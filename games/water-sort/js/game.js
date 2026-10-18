// Water Sort: pour the colours until every tube holds just one.

import { CAP, PALETTE, makeLevel, pourAmount, pour, isSolved, isFull, anyMove, solve } from './logic.js';
import { store, settings, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, toast, confetti, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = ICON[el.dataset.icon];
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

const canvas = $('stage');
const g = canvas.getContext('2d');

// ---- saved progress ----------------------------------------------------------

// n: the level you're up to. done: the highest level finished.
// play: the level in progress and the moves made in it.
const SAVE_KEY = 'watersort';
const save = Object.assign({ n: 1, done: 0, seen: {}, play: null }, store.get(SAVE_KEY, {}) || {});
const writeSave = () => store.set(SAVE_KEY, save);

// ---- the game ------------------------------------------------------------------

let level = null; // as dealt
let tubes = []; // colours (indexes into PALETTE), bottom first
let hidden = []; // hidden[t][i]: is unit i of tube t still a mystery?
let undoStack = []; // snapshots for Undo
let moves = []; // [a, b] for a pour, [-1] for the extra tube (for saving)
let extraUsed = false;
let selected = -1;
let finished = false;
let hintMove = null; // { a, b, at }
let warnedAt = ''; // the position we last said was a dead end

const snapshot = () => ({ tubes: tubes.map((t) => t.slice()), hidden: hidden.map((h) => h.slice()), extraUsed });

function startLevel(n, resume = false) {
  n = Math.max(1, Math.floor(n) || 1);
  ui.close();
  level = makeLevel(n);
  tubes = level.tubes.map((t) => t.slice());
  hidden = tubes.map((t) => t.map((_, i) => level.mystery && i < t.length - 1));
  undoStack = [];
  moves = [];
  extraUsed = false;
  selected = -1;
  finished = false;
  hintMove = null;
  warnedAt = '';
  pours.length = 0;
  corks.clear();
  shakes.clear();
  reveals.clear();
  const p = save.play;
  if (resume && p && p.n === n && p.v === level.v) {
    for (const m of p.moves) {
      if (m[0] === -1 ? !addTube(false) : !doPour(m[0], m[1], false)) {
        // Something doesn't fit any more: start the level fresh.
        return startLevel(n, false);
      }
    }
  }
  if (!resume || !p || p.n !== n) save.play = null;
  for (const t of ['red', 'purple']) document.body.classList.toggle(`theme-${t}`, (t === 'red' && level.hard) || (t === 'purple' && level.mystery));
  layout();
  updateHud();
  savePlay();
  requestDraw();
  intro();
}

function savePlay() {
  if (!level) return;
  save.play = finished ? null : { n: level.n, v: level.v, moves };
  writeSave();
}

// Pour from tube a into tube b. Returns false if that isn't possible.
function doPour(a, b, animate = true) {
  const n = pourAmount(tubes, a, b, CAP);
  if (!n) return false;
  const before = { src: unitsOf(a), dst: unitsOf(b) };
  undoStack.push(snapshot());
  moves.push([a, b]);
  pour(tubes, a, b, n);
  for (let i = 0; i < n; i++) { hidden[a].pop(); hidden[b].push(false); }
  // The colour underneath is uncovered.
  const top = tubes[a].length - 1;
  if (top >= 0 && hidden[a][top]) {
    hidden[a][top] = false;
    if (animate) reveals.set(`${a}:${top}`, performance.now() + timing(n).total);
  }
  if (animate) startPour(a, b, n, before);
  return true;
}

function addTube(animate = true) {
  if (extraUsed || finished) return false;
  undoStack.push(snapshot());
  moves.push([-1]);
  tubes.push([]);
  hidden.push([]);
  extraUsed = true;
  if (animate) {
    layout();
    updateHud();
    savePlay();
    sfx('pop');
    haptic();
    requestDraw();
  }
  return true;
}

function undo() {
  if (finished || !undoStack.length) return;
  pours.length = 0;
  const s = undoStack.pop();
  moves.pop();
  const relayout = s.tubes.length !== tubes.length;
  tubes = s.tubes;
  hidden = s.hidden;
  extraUsed = s.extraUsed;
  selected = -1;
  hintMove = null;
  if (relayout) layout();
  sfx('tap');
  updateHud();
  savePlay();
  requestDraw();
}

// What a tube shows: its colours, or -1 for the ones still hidden.
const unitsOf = (t) => tubes[t].map((c, i) => (hidden[t][i] ? -1 : c));

function sortedCount() {
  return tubes.filter((t) => isFull(t, CAP)).length;
}

function updateHud() {
  $('levelLabel').textContent = `LEVEL ${level.n}`;
  $('tierTag').textContent = level.hard ? 'HARD' : level.mystery ? 'MYSTERY' : '';
  $('sorted').textContent = `${sortedCount()}/${level.colors}`;
  $('undoBtn').disabled = !undoStack.length || finished;
  $('tubeBtn').disabled = extraUsed || finished;
  $('tubeBadge').textContent = extraUsed ? '' : '1';
}

// ---- tapping ---------------------------------------------------------------------

const busy = (t) => pours.some((p) => p.a === t || p.b === t);

function tapTube(t) {
  if (finished || ui.isOpen()) return;
  hintMove = null;
  if (t < 0) {
    if (selected >= 0) { selected = -1; requestDraw(); }
    return;
  }
  if (busy(t)) return;
  if (selected < 0) {
    if (!tubes[t].length || isFull(tubes[t], CAP)) return;
    selected = t;
    sfx('tap');
    requestDraw();
    return;
  }
  if (selected === t) {
    selected = -1;
    requestDraw();
    return;
  }
  const from = selected;
  if (doPour(from, t)) {
    selected = -1;
    haptic();
    updateHud();
    savePlay();
    return;
  }
  // Can't pour there. Pick that tube instead if it's worth picking up.
  if (tubes[t].length && !isFull(tubes[t], CAP)) {
    selected = t;
    sfx('tap');
  } else {
    shakes.set(from, performance.now());
    sfx('nope');
    selected = -1;
  }
  requestDraw();
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  tapTube(tubeAt(e.clientX, e.clientY));
});

// ---- after each pour -----------------------------------------------------------

function pourDone(p) {
  if (isFull(tubes[p.b], CAP)) {
    corks.set(p.b, performance.now());
    sfx('pop');
    haptic();
    updateHud();
  }
  if (pours.length) return;
  if (isSolved(tubes, CAP)) return win();
  if (!anyMove(tubes, CAP)) {
    setTimeout(() => {
      if (finished || pours.length || anyMove(tubes, CAP)) return;
      ui.show(`<h2>No moves left</h2><p>Nothing can be poured anywhere. Undo a few pours or start again.</p>
        <div class="actions"><button class="btn btn-primary" data-action="undo">Undo</button>
        ${extraUsed ? '' : '<button class="btn btn-soft" data-action="tube">Add an empty tube</button>'}
        <button class="btn btn-soft" data-action="restart">Restart level</button></div>`);
    }, 350);
    return;
  }
  // Quietly check whether this position can still be finished.
  setTimeout(() => {
    if (finished || pours.length) return;
    const key = JSON.stringify(tubes);
    if (key === warnedAt) return;
    if (solve(tubes, CAP, 30000) === null) {
      warnedAt = key;
      toast(extraUsed ? 'No way to finish from here. Try Undo.' : 'No way to finish from here. Try Undo, or add a tube.', 3200);
    }
  }, 60);
}

function win() {
  finished = true;
  selected = -1;
  save.done = Math.max(save.done, level.n);
  save.n = Math.max(save.n, level.n + 1);
  save.play = null;
  writeSave();
  updateHud();
  setTimeout(() => {
    sfx('win');
    haptic();
    confetti();
  }, 250);
  setTimeout(() => {
    const what = level.hard ? 'Hard level' : level.mystery ? 'Mystery level' : 'Level';
    ui.show(`<h2>${what} ${level.n} sorted!</h2><p>${praise()}</p>
      <div class="actions"><button class="btn btn-primary" data-action="next">Next level</button></div>`);
  }, 1100);
}

function praise() {
  const used = moves.filter((m) => m[0] >= 0).length;
  return `${used} pours. ${['Lovely.', 'Nice and tidy.', 'Smooth.', 'Very satisfying.', 'All sorted.'][level.n % 5]}`;
}

function hint() {
  if (finished || ui.isOpen()) return;
  selected = -1;
  const plan = solve(tubes, CAP, 200000);
  if (plan === null) {
    toast(extraUsed ? 'No way to finish from here. Undo a few pours.' : 'No way to finish from here. Undo a few pours, or add a tube.', 3200);
    sfx('nope');
    return;
  }
  if (!plan || !plan.length) {
    toast('Tricky! Try undoing a few pours.');
    return;
  }
  const [a, b] = plan[0];
  hintMove = { a, b, at: performance.now() };
  sfx('hint');
  requestDraw();
}

// ---- tube shape ------------------------------------------------------------------
// In tube widths, with the middle of the mouth at 0,0 and y pointing down.

const OUT = 0.5; // outer half width
const IN = 0.4; // inner half width
const DEPTH = 3.5; // mouth to the bottom of the glass
const HEAD = 0.5; // space above a full tube
const BULB = DEPTH - OUT; // centre of the round bottom

// The inside of the tube, as a polygon.
const INSIDE = (() => {
  const pts = [[-IN, 0]];
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI - (i * Math.PI) / 18;
    pts.push([IN * Math.cos(a), BULB + IN * Math.sin(a)]);
  }
  pts.push([IN, 0]);
  return pts;
})();

// Area of polygon P below the line y = L (y points down).
function areaBelow(P, L) {
  const out = [];
  let prev = P[P.length - 1], prevIn = prev[1] >= L;
  for (const cur of P) {
    const curIn = cur[1] >= L;
    if (curIn !== prevIn) {
      const t = (L - prev[1]) / (cur[1] - prev[1]);
      out.push([prev[0] + t * (cur[0] - prev[0]), L]);
    }
    if (curIn) out.push(cur);
    prev = cur;
    prevIn = curIn;
  }
  let s = 0;
  for (let i = 0; i < out.length; i++) {
    const p = out[i], q = out[(i + 1) % out.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(s) / 2;
}

const UNIT = areaBelow(INSIDE, HEAD) / CAP; // the area of one unit of liquid

// The inside polygon tipped by angle a around the point (lx, 0) on the rim.
function tipped(a, lx) {
  const c = Math.cos(a), s = Math.sin(a);
  return INSIDE.map(([x, y]) => [(x - lx) * c - y * s, (x - lx) * s + y * c]);
}

// Height of the liquid surface (relative to the pivot) when P holds v units.
function surfaceY(P, v) {
  let lo = Infinity, hi = -Infinity;
  for (const p of P) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
  if (v <= 0) return hi;
  let a = lo, b = hi;
  for (let i = 0; i < 24; i++) {
    const m = (a + b) / 2;
    if (areaBelow(P, m) > v * UNIT) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

// How far to tip a tube (pouring over its rim) so that it holds v units
// with the liquid right at the rim.
const TIP = (() => {
  const t = [];
  for (let a = 0; a <= 1.9; a += 0.02) t.push([a, areaBelow(tipped(a, IN), 0) / UNIT]);
  return t;
})();
function tipFor(v) {
  for (let i = 1; i < TIP.length; i++) {
    const [a1, h1] = TIP[i - 1], [a2, h2] = TIP[i];
    if (h2 <= v) return Math.max(0, a1 + ((a2 - a1) * (h1 - v)) / Math.max(1e-6, h1 - h2));
  }
  return 1.75;
}

// ---- pour animation ----------------------------------------------------------------

const pours = [];
const corks = new Map(); // tube -> when its cork went on
const shakes = new Map(); // tube -> when it shook "no"
const reveals = new Map(); // "tube:unit" -> when a hidden colour shows

let slowMo = 1; // for testing on this computer
const timing = (n) => {
  const move = 240 * slowMo, flow = (200 + 120 * n) * slowMo, back = 230 * slowMo;
  return { move, flow, back, total: move + flow + back };
};
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;

function startPour(a, b, n, before) {
  const T = timing(n);
  // Tip towards the middle of the screen, so the tube stays in view.
  const dir = geo.pos[b].x < W / 2 - 1 ? -1 : 1;
  const p = {
    a, b, n, dir, before, color: tubes[b][tubes[b].length - 1],
    start: performance.now(), T, lift0: lift[a],
    from: before.src.length, to: before.src.length - n,
  };
  pours.push(p);
  setTimeout(() => sfx('pour'), T.move - 30);
  requestDraw();
}

// Where tube a's rim is, and how it's tipped, at this point in a pour.
function pourPose(p, now) {
  const { w } = geo;
  const home = geo.pos[p.a], dest = geo.pos[p.b];
  const t = now - p.start, T = p.T;
  const lx = p.dir * IN;
  const homeRim = { x: home.x + lx * w, y: home.y - p.lift0 * LIFT * w };
  const back = { x: home.x + lx * w, y: home.y };
  const spout = { x: dest.x - p.dir * 0.05 * w, y: dest.y - 0.5 * w };
  let x, y, ang, poured;
  const a0 = tipFor(p.from), a1 = Math.min(1.75, tipFor(p.to));
  if (t < T.move) {
    const k = ease(t / T.move);
    x = lerp(homeRim.x, spout.x, k);
    y = lerp(homeRim.y, spout.y, k) - Math.sin(k * Math.PI) * 0.6 * w;
    ang = a0 * k;
    poured = 0;
  } else if (t < T.move + T.flow) {
    const k = (t - T.move) / T.flow;
    poured = p.n * ease(k);
    x = spout.x;
    y = spout.y;
    ang = Math.min(1.75, tipFor(p.from - poured));
    if (k > 0.85) ang = lerp(ang, a1, (k - 0.85) / 0.15);
  } else {
    const k = ease((t - T.move - T.flow) / T.back);
    x = lerp(spout.x, back.x, k);
    y = lerp(spout.y, back.y, k) - Math.sin(k * Math.PI) * 0.3 * w;
    ang = a1 * (1 - k);
    poured = p.n;
  }
  return { x, y, a: ang * p.dir, lx, poured, flowing: t >= T.move && t < T.move + T.flow, k: (t - T.move) / T.flow };
}

// ---- drawing -------------------------------------------------------------------------

const LIFT = 0.45; // how far a picked-up tube rises, in tube widths
const lift = [];
let geo = { w: 40, pos: [], slot: 60 };
let W = 0, H = 0, dpr = 1;
let raf = 0;

function layout() {
  W = innerWidth;
  H = innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const top = $('topbar').getBoundingClientRect().bottom + 20;
  const bottom = $('tools').getBoundingClientRect().top - 16;
  const n = tubes.length;
  let best = null;
  for (let rows = 1; rows <= 4; rows++) {
    const per = Math.ceil(n / rows);
    const byWidth = (W - 16) / (per * 1.45);
    const byHeight = (bottom - top) / (rows * (DEPTH + 1.25) + 0.2);
    const w = Math.min(byWidth, byHeight, 60);
    if (!best || w > best.w + 0.5) best = { rows, w };
  }
  const { rows, w } = best;
  const rowH = w * (DEPTH + 1.25);
  const y0 = top + (bottom - top - rows * rowH) / 2 + w * 0.95;
  const pos = [];
  for (let r = 0, i = 0; r < rows; r++) {
    const count = Math.ceil((n - i) / (rows - r));
    const slot = Math.min(w * 1.7, (W - 16) / count);
    const x0 = W / 2 - (slot * (count - 1)) / 2;
    for (let k = 0; k < count; k++, i++) pos.push({ x: x0 + k * slot, y: y0 + r * rowH });
  }
  geo = { w, pos, slot: Math.min(w * 1.7, (W - 16) / Math.ceil(n / rows)) };
  while (lift.length < n) lift.push(0);
  lift.length = n;
  requestDraw();
}

function tubeAt(x, y) {
  const { w, pos, slot } = geo;
  for (let i = 0; i < pos.length; i++) {
    const p = pos[i];
    if (Math.abs(x - p.x) <= slot / 2 && y >= p.y - 1.1 * w && y <= p.y + (DEPTH + 0.35) * w) return i;
  }
  return -1;
}

function requestDraw() {
  if (!raf) raf = requestAnimationFrame(frame);
}

function frame(now) {
  raf = 0;
  if (draw(now)) requestDraw();
}

function draw(now) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  if (!level) return false;
  let moving = false;

  // Finish pours whose time is up.
  for (let i = pours.length - 1; i >= 0; i--) {
    if (now - pours[i].start >= pours[i].T.total) {
      const p = pours.splice(i, 1)[0];
      lift[p.a] = 0;
      pourDone(p);
    }
  }

  // Picked-up tubes rise; put-down ones settle.
  for (let i = 0; i < tubes.length; i++) {
    const want = i === selected ? 1 : 0;
    if (lift[i] !== want) {
      lift[i] += Math.sign(want - lift[i]) * 0.16;
      if (Math.abs(lift[i] - want) < 0.17) lift[i] = want;
      moving = true;
    }
  }

  const { w, pos } = geo;
  const inPour = new Set();
  for (const p of pours) { inPour.add(p.a); inPour.add(p.b); }

  for (let i = 0; i < tubes.length; i++) {
    if (inPour.has(i)) continue;
    let dx = 0;
    const sh = shakes.get(i);
    if (sh !== undefined) {
      const t = (now - sh) / 320;
      if (t >= 1) shakes.delete(i);
      else { dx = Math.sin(t * Math.PI * 6) * (1 - t) * 0.12 * w; moving = true; }
    }
    const units = unitsOf(i);
    const pose = { x: pos[i].x + dx, y: pos[i].y - lift[i] * LIFT * w, a: 0, lx: 0 };
    drawTube(pose, units, units.length, { cork: isFull(tubes[i], CAP) ? corks.get(i) ?? -1 : null, now, tube: i });
    if (corks.has(i) && now - corks.get(i) < 400) moving = true;
  }

  for (const p of pours) {
    moving = true;
    const pose = pourPose(p, now);
    // The tube being poured into fills up as the liquid arrives.
    const dst = p.before.dst.concat(Array(p.n).fill(p.color));
    const dstVol = p.before.dst.length + pose.poured;
    const dPose = { x: pos[p.b].x, y: pos[p.b].y, a: 0, lx: 0 };
    drawTube(dPose, dst, dstVol, { now, tube: p.b });
    if (pose.flowing) {
      const surf = pos[p.b].y + surfaceY(INSIDE, dstVol) * w;
      const thin = pose.k < 0.12 ? pose.k / 0.12 : pose.k > 0.9 ? (1 - pose.k) / 0.1 : 1;
      const sw = 0.15 * w * Math.max(0.2, thin);
      g.fillStyle = PALETTE[p.color];
      g.beginPath();
      g.roundRect(pose.x - sw / 2, pose.y - 0.02 * w, sw, Math.max(0, surf - pose.y + 0.05 * w), sw / 2);
      g.fill();
    }
    drawTube(pose, p.before.src, p.from - pose.poured, { now, tube: p.a });
  }

  if (hintMove) {
    moving = true;
    drawHint(now);
  }
  for (const [k, t] of reveals) {
    if (now - t > 600) reveals.delete(k);
    else moving = true;
  }
  return moving;
}

function outerPath() {
  g.beginPath();
  g.moveTo(-OUT, 0);
  g.lineTo(-OUT, BULB);
  g.arc(0, BULB, OUT, Math.PI, 0, true);
  g.lineTo(OUT, 0);
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

const MYSTERY = '#3d4460';

// Draw one tube. pose: where its rim pivot is (x, y), how it's tipped (a),
// and which point of the rim it turns around (lx). units: colours bottom
// first (-1 = hidden); vol: how many units of liquid it holds right now.
function drawTube(pose, units, vol, opts) {
  const { w } = geo;
  const { x, y, a, lx } = pose;
  const upright = Math.abs(a) < 1e-3;

  // Back of the glass.
  g.save();
  g.translate(x, y);
  g.rotate(a);
  g.translate(-lx * w, 0);
  g.scale(w, w);
  outerPath();
  g.closePath();
  g.fillStyle = 'rgba(255, 255, 255, 0.34)';
  g.fill();
  g.restore();

  // Liquid: horizontal bands, cut to the inside of the (maybe tipped) tube.
  if (vol > 0.002) {
    const P = tipped(a, lx);
    g.save();
    g.translate(x, y);
    g.scale(w, w);
    g.beginPath();
    P.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.closePath();
    g.clip();
    const bands = [];
    for (let i = 0; i < units.length && i < vol; i++) {
      const c = units[i], top = Math.min(i + 1, vol);
      const last = bands[bands.length - 1];
      if (last && c >= 0 && last.c === c) last.to = top;
      else bands.push({ c, from: i, to: top });
    }
    const bottom = surfaceY(P, 0);
    for (const b of bands) {
      const y0 = b.from <= 0 ? bottom + 0.1 : surfaceY(P, b.from);
      const y1 = surfaceY(P, b.to);
      const col = b.c < 0 ? MYSTERY : PALETTE[b.c];
      g.fillStyle = col;
      g.fillRect(-3, y1, 6, y0 - y1 + 0.004);
      // A thin lighter line where one colour sits on another.
      g.fillStyle = b.c < 0 ? 'rgba(255,255,255,0.12)' : shade(col, 0.28);
      g.fillRect(-3, y1, 6, 0.05);
    }
    // Shading across the tube, so it looks round.
    g.rotate(a);
    g.translate(-lx, 0);
    const grad = g.createLinearGradient(-IN, 0, IN, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.16)');
    grad.addColorStop(0.28, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    g.fillStyle = grad;
    g.fillRect(-1, -1, 2, DEPTH + 2);
    g.restore();

    // Question marks on colours not yet uncovered.
    if (upright) {
      g.save();
      g.fillStyle = 'rgba(255, 255, 255, 0.85)';
      g.font = `900 ${Math.round(w * 0.5)}px ui-rounded, system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (const b of bands) {
        if (b.c >= 0 || b.to - b.from < 0.6) continue;
        const yc = (surfaceY(P, b.from) + surfaceY(P, b.to)) / 2;
        g.fillText('?', x - lx * w, y + yc * w + w * 0.03);
      }
      g.restore();
    }
    // A newly uncovered colour flashes white for a moment.
    if (upright && opts.tube !== undefined) {
      for (let i = 0; i < units.length; i++) {
        const t0 = reveals.get(`${opts.tube}:${i}`);
        if (t0 === undefined || opts.now < t0) continue;
        const k = (opts.now - t0) / 600;
        if (k >= 1) continue;
        g.save();
        g.translate(x, y);
        g.scale(w, w);
        g.beginPath();
        P.forEach(([px, py], j) => (j ? g.lineTo(px, py) : g.moveTo(px, py)));
        g.closePath();
        g.clip();
        g.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - k)})`;
        const y0 = surfaceY(P, i), y1 = surfaceY(P, i + 1);
        g.fillRect(-1, y1, 2, y0 - y1);
        g.restore();
      }
    }
  }

  // Front of the glass: outline, shine and rim.
  g.save();
  g.translate(x, y);
  g.rotate(a);
  g.translate(-lx * w, 0);
  g.scale(w, w);
  outerPath();
  g.lineWidth = 0.075;
  g.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  g.lineJoin = 'round';
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.5)';
  g.beginPath();
  g.roundRect(-0.33, 0.3, 0.085, BULB - 0.45, 0.04);
  g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.roundRect(-0.6, -0.1, 1.2, 0.16, 0.08);
  g.fill();
  // A cork on a finished tube (dropping in when it's new).
  if (opts.cork !== undefined && opts.cork !== null) {
    const k = opts.cork < 0 ? 1 : Math.min(1, (opts.now - opts.cork) / 380);
    const drop = k < 0.7 ? (1 - k / 0.7) ** 2 * -1.2 : Math.sin(((k - 0.7) / 0.3) * Math.PI) * -0.08;
    g.fillStyle = '#b07a45';
    g.beginPath();
    g.roundRect(-0.34, -0.42 + drop, 0.68, 0.5, 0.1);
    g.fill();
    g.fillStyle = '#c99560';
    g.beginPath();
    g.roundRect(-0.34, -0.42 + drop, 0.68, 0.14, 0.07);
    g.fill();
  }
  g.restore();
}

function drawHint(now) {
  const { w, pos } = geo;
  const { a, b, at } = hintMove;
  if (now - at > 7000) { hintMove = null; return; }
  const pulse = 0.55 + 0.45 * Math.sin((now - at) / 170);
  // Glow round the tube to pour from.
  g.save();
  g.translate(pos[a].x, pos[a].y);
  g.scale(w, w);
  outerPath();
  g.lineWidth = 0.22;
  g.strokeStyle = `rgba(255, 56, 150, ${0.35 + 0.4 * pulse})`;
  g.stroke();
  g.restore();
  // A bouncing arrow over the tube to pour into.
  const bob = Math.sin((now - at) / 150) * 0.12 * w;
  const x = pos[b].x, y = pos[b].y - 0.75 * w + bob;
  g.fillStyle = '#ff3896';
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x - 0.32 * w, y - 0.38 * w);
  g.lineTo(x - 0.12 * w, y - 0.38 * w);
  g.lineTo(x - 0.12 * w, y - 0.7 * w);
  g.lineTo(x + 0.12 * w, y - 0.7 * w);
  g.lineTo(x + 0.12 * w, y - 0.38 * w);
  g.lineTo(x + 0.32 * w, y - 0.38 * w);
  g.closePath();
  g.fill();
}

// ---- cards --------------------------------------------------------------------------

const TUBE_ART = (colors, x) => {
  const h = 18;
  let s = `<g transform="translate(${x} 8)"><path d="M0 0v62a11 11 0 0 0 22 0V0" fill="#eef3ff" stroke="#c9d8f3" stroke-width="2.5"/>`;
  colors.forEach((c, i) => {
    const y = 74 - (i + 1) * h;
    s += i === 0 ? `<path d="M2 ${y}h18v${h - 7}a9 9 0 0 1-18 0z" fill="${c}"/>` : `<rect x="2" y="${y}" width="18" height="${h}" fill="${c}"/>`;
  });
  return `${s}</g>`;
};

function showRules() {
  ui.show(`<h2>How to play</h2>
    <div class="rules">
      <div class="rule"><svg viewBox="0 0 64 84">${TUBE_ART(['#2f5bd9', '#e8413c'], 6)}${TUBE_ART(['#e8413c'], 36)}</svg>
        <div><b>Tap a tube, then another</b><span>The colour on top pours across, as much as fits.</span></div></div>
      <div class="rule"><svg viewBox="0 0 64 84">${TUBE_ART(['#ffd93b', '#ffd93b', '#ffd93b', '#ffd93b'], 6)}${TUBE_ART([], 36)}</svg>
        <div><b>Same colour, or an empty tube</b><span>You can only pour onto a matching colour, or into an empty tube.</span></div></div>
      <div class="rule"><svg viewBox="0 0 64 84">${TUBE_ART(['#3d4460', '#3d4460', '#22c3b4'], 6)}<text x="17" y="56" text-anchor="middle" font-size="15" font-weight="900" fill="#fff">?</text></svg>
        <div><b>Mystery levels</b><span>Hidden colours show once you uncover them.</span></div></div>
      <div class="rule"><svg viewBox="0 0 64 84">${TUBE_ART(['#8e4ad8', '#8e4ad8', '#8e4ad8', '#8e4ad8'], 20)}<rect x="22" y="2" width="18" height="12" rx="3" fill="#b07a45"/></svg>
        <div><b>One colour per tube</b><span>Fill every tube with a single colour to win. Undo as much as you like, and each level gives you one extra empty tube.</span></div></div>
    </div>
    <div class="actions"><button class="btn btn-primary" data-action="close">Got it</button></div>`);
}

function intro() {
  if (level.n === 1 && !save.seen.rules) {
    save.seen.rules = true;
    writeSave();
    showRules();
  } else if (level.mystery && !save.seen.mystery) {
    save.seen.mystery = true;
    writeSave();
    ui.show(`<h2>Mystery level!</h2><svg class="tut-art" viewBox="0 0 64 84">${TUBE_ART(['#3d4460', '#3d4460', '#3d4460', '#f26bb5'], 21)}
      <text x="32" y="52" text-anchor="middle" font-size="15" font-weight="900" fill="#fff">?</text><text x="32" y="34" text-anchor="middle" font-size="15" font-weight="900" fill="#fff">?</text></svg>
      <p>Only the top colour of each tube is showing. The rest appear as you pour off what's on top of them.</p>
      <div class="actions"><button class="btn btn-primary" data-action="close">Let’s go</button></div>`);
  } else if (level.hard && !save.seen.hard) {
    save.seen.hard = true;
    writeSave();
    ui.show(`<h2>Hard level!</h2><p>Every 10th level has two extra colours to sort, and it's picked from the trickiest deals.</p>
      <div class="actions"><button class="btn btn-primary" data-action="close">Bring it on</button></div>`);
  }
}

function showSettings() {
  ui.show(`<h2>Settings</h2>
    ${switchRow('Sound', 'sound')}
    ${switchRow('Haptics', 'haptics')}
    <div class="row">Level <span class="stepper"><button class="btn btn-soft" data-action="lvl-down" aria-label="Previous">−</button>
      <input id="lvlInput" type="number" inputmode="numeric" min="1" value="${level.n}">
      <button class="btn btn-soft" data-action="lvl-up" aria-label="Next">+</button></span></div>
    <p class="seg-note tip">You're up to level ${save.n}.</p>
    <div class="actions">
      <button class="btn btn-primary" data-action="go-level">Play this level</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
      <button class="btn btn-soft" data-action="close">Close</button>
    </div>`);
}

const ui = cards({
  next: () => startLevel(level.n + 1),
  undo: () => { ui.close(); undo(); },
  restart: () => startLevel(level.n),
  tube: () => { ui.close(); addTube(); },
  rules: showRules,
  'lvl-down': () => { const i = $('lvlInput'); i.value = Math.max(1, (+i.value || 1) - 1); },
  'lvl-up': () => { const i = $('lvlInput'); i.value = (+i.value || 0) + 1; },
  'go-level': () => startLevel(+$('lvlInput').value || 1),
});

$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });
$('undoBtn').addEventListener('click', undo);
$('restartBtn').addEventListener('click', () => {
  if (finished) return;
  sfx('tap');
  if (!undoStack.length) return;
  ui.show(`<h2>Start again?</h2><p>All the pours in this level will be undone.</p>
    <div class="actions"><button class="btn btn-primary" data-action="restart">Restart level</button>
    <button class="btn btn-soft" data-action="close">Keep going</button></div>`);
});
$('hintBtn').addEventListener('click', hint);
$('tubeBtn').addEventListener('click', () => {
  if (addTube()) toast('An extra empty tube. One per level!');
});
window.addEventListener('keydown', (e) => {
  if (ui.isOpen()) return;
  if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'u') undo();
  else if (e.key === 'h') hint();
});

// ---- start --------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', layout);
document.addEventListener('visibilitychange', () => { if (document.hidden) savePlay(); });

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.waterSort = {
    startLevel, tapTube, hint, undo, addTube, set slowMo(k) { slowMo = k; },
    get tubes() { return tubes; }, get level() { return level; }, get geo() { return geo; }, get finished() { return finished; },
  };
}

const params = new URLSearchParams(location.search);
if (location.search) window.history.replaceState(null, '', location.pathname);
const asked = Number(params.get('level'));
if (asked > 0) startLevel(asked);
else startLevel(save.play ? save.play.n : save.n, true);
