// Hexit: tap the tiles to send them sliding off the honeycomb, in the order
// that keeps them from bumping into each other.

import { DIRS, ANGLE, toXY, fromXY, key, opposite } from './hex.js';
import { Board } from './rules.js';
import { MODES, INTRO, GEN_VERSION, tierOf, makeLevel } from './levels.js';
import { COLORS, tileSprite, stoneSprite, paintPad, paintTile, paintStone, hexPath } from './draw.js';
import { store, settings, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, toast, confetti, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = ICON[el.dataset.icon];
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

const canvas = $('stage'), g = canvas.getContext('2d');
const TAU = Math.PI * 2;
const MODE_NAME = { levels: 'Level', hard: 'Hard', super: 'Super', huge: 'Huge' };
const TIER_TAG = { hard: 'HARD', super: 'SUPER HARD' };
const THEME = { hard: 'red', super: 'night', huge: 'teal' };
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.4C.9 8.1 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.7 3.6 4.2 7.1C19.5 16.4 12 21 12 21z"/></svg>';
const STAR = (on) => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}"><path d="M12 2.6l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.2l-5.72 3 1.1-6.37-4.63-4.5 6.4-.93z"/></svg>`;
$('hearts').innerHTML = HEART.repeat(3);

// ---- saved progress ---------------------------------------------------------------

// One run per mode: the number you're up to, best stars per number, and the
// puzzle in progress (its moves, hearts left, and for huge boards the view).
const SAVE_KEY = 'hexit';
const save = (() => {
  const s = store.get(SAVE_KEY, {}) || {};
  const out = { mode: MODES.includes(s.mode) ? s.mode : 'levels', seen: s.seen || {}, runs: s.runs || {} };
  for (const m of MODES) out.runs[m] = Object.assign({ n: 1, best: {}, solved: 0, play: null }, out.runs[m]);
  return out;
})();
const writeSave = () => store.set(SAVE_KEY, save);

// ---- levels ---------------------------------------------------------------------------

const built = new Map();
const waiting = new Map();
let worker = null, workerBroken = false;

function deliver(k, lv) {
  built.set(k, lv);
  while (built.size > 6) built.delete(built.keys().next().value);
  const list = waiting.get(k) || [];
  waiting.delete(k);
  list.forEach((resolve) => resolve(lv));
}

function getLevel(n, m) {
  const k = `${m}:${n}`;
  if (built.has(k)) return Promise.resolve(built.get(k));
  return new Promise((resolve) => {
    if (waiting.has(k)) return waiting.get(k).push(resolve);
    waiting.set(k, [resolve]);
    // The main run's boards are quick; the big ones are built in a worker.
    if (m !== 'levels' && !workerBroken) {
      try {
        if (!worker) {
          worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
          worker.onmessage = (e) => deliver(`${e.data.mode}:${e.data.n}`, e.data.level);
          worker.onerror = () => {
            workerBroken = true;
            for (const w of waiting.keys()) {
              const [wm, wn] = w.split(':');
              setTimeout(() => deliver(w, makeLevel(+wn, wm)), 20);
            }
          };
        }
        worker.postMessage({ n, mode: m });
        return;
      } catch {
        workerBroken = true;
      }
    }
    setTimeout(() => deliver(k, makeLevel(n, m)), 30);
  });
}

// ---- the game ----------------------------------------------------------------------------

let mode = save.mode;
let level = null, board = null;
let hearts = 3, practice = false, finished = false;
let moves = []; // [cell, direction] for each tile sent away
let order = []; // cells, back to front, for drawing
let loadToken = 0;
const relaxed = () => level && level.mode === 'huge';

async function startLevel(n, resume = false) {
  n = Math.max(1, Math.floor(n) || 1);
  ui.close();
  const token = ++loadToken;
  $('loadingText').textContent = mode === 'huge' ? 'Building a huge board…' : 'Building level…';
  const slow = setTimeout(() => { if (token === loadToken) $('loading').classList.remove('hide'); }, 150);
  const lv = await getLevel(n, mode);
  if (token !== loadToken) return;
  clearTimeout(slow);
  $('loading').classList.add('hide');
  level = lv;
  board = new Board(lv);
  hearts = 3;
  practice = false;
  finished = false;
  moves = [];
  flying.length = 0;
  bumps.length = 0;
  parts.length = 0;
  wiggle.clear();
  hint = null;
  preview = null;
  const run = save.runs[mode];
  let view = null;
  if (resume && run.play && run.play.n === n && run.play.v === lv.v) {
    let ok = true;
    for (const [i, d] of run.play.moves) {
      if (!board.move(i, d).ok) { ok = false; break; }
      moves.push([i, d]);
    }
    if (ok) {
      hearts = run.play.hearts ?? 3;
      practice = !!run.play.practice;
      view = run.play.view || null;
    } else {
      board = new Board(lv);
      moves = [];
    }
  }
  order = lv.cells.map((c, i) => i).sort((a, b) => toXY(...lv.cells[a])[1] - toXY(...lv.cells[b])[1]);
  for (const t of ['red', 'night', 'teal']) document.body.classList.toggle(`theme-${t}`, THEME[lv.tier] === t);
  layout(true);
  if (view) setView(view);
  updateHud();
  savePlay();
  if (mode !== 'huge') setTimeout(() => getLevel(n + 1, mode), 700);
  if (!relaxed() && hearts <= 0 && !practice) outOfHearts();
  else intro();
  requestDraw();
}

function savePlay() {
  if (!level) return;
  save.runs[level.mode].play = finished ? null : {
    n: level.n, v: level.v, moves, hearts, practice,
    view: relaxed() ? { s: view.s, cx: (W / 2 - view.x) / view.s, cy: (H / 2 - view.y) / view.s } : null,
  };
  writeSave();
}

function switchMode(m) {
  if (!MODES.includes(m) || m === mode) return;
  if (level) savePlay();
  mode = m;
  save.mode = m;
  writeSave();
  const run = save.runs[m];
  startLevel(run.play ? run.play.n : run.n, true);
}

function updateHud() {
  $('levelLabel').textContent = `${MODE_NAME[level.mode].toUpperCase()} ${level.n}`;
  $('tierTag').textContent = level.mode === 'levels' ? TIER_TAG[level.tier] || '' : '';
  $('count').textContent = board.remaining.toLocaleString();
  const hs = $('hearts');
  hs.hidden = relaxed();
  [...hs.children].forEach((el, k) => el.classList.toggle('on', k < hearts && !practice));
  hs.classList.toggle('practice', practice);
  $('progress').hidden = !relaxed();
  const pct = Math.floor((100 * (board.total - board.remaining)) / Math.max(1, board.total));
  $('progressFill').style.width = `${pct}%`;
  $('progressText').textContent = `${pct}%`;
  $('undoBtn').disabled = !moves.length || finished;
}

// ---- tapping a tile ---------------------------------------------------------------------

function tapAt(sx, sy) {
  if (finished || !board || ui.isOpen()) return;
  const i = cellAt(sx, sy);
  if (i < 0 || !board.top(i) || busyCell(i)) return;
  hint = null;
  const c = centreOf(i);
  const d = board.dirFor(i, Math.atan2(sy - c.y, sx - c.x));
  send(i, d);
}

function send(i, d) {
  const t = board.top(i), layers = board.stack[i].length;
  if (board.frozen[i]) {
    wiggle.set(i, performance.now());
    sfx('nope');
    if (!save.seen.frozenTap) {
      save.seen.frozenTap = true;
      writeSave();
      toast('Frozen tiles thaw when a tile next to them flies away.', 3200);
    }
    requestDraw();
    return;
  }
  const r = board.move(i, d);
  if (r.ok) {
    moves.push([i, d]);
    fly(i, t, d, r.path, layers);
    for (const j of r.thawed) thaw(j);
    sfx('whoosh');
    haptic();
    updateHud();
    savePlay();
    if (!board.remaining) setTimeout(win, 650);
  } else if (r.hit >= 0) {
    bump(i, t, d, r.path, r.stop, r.hit);
  } else {
    // A way that goes round in circles (never in a built level).
    wiggle.set(i, performance.now());
    sfx('nope');
  }
  requestDraw();
}

function bump(i, t, d, path, stop, hit) {
  sfx('bump');
  haptic();
  bumps.push({ i, t, d, pts: pathPoints(i, path, stop, true), t0: performance.now(), hit });
  setTimeout(() => {
    wiggle.set(hit, performance.now());
    requestDraw();
  }, 140);
  if (relaxed()) return;
  if (!practice) {
    hearts = Math.max(0, hearts - 1);
    const el = $('hearts').children[hearts];
    if (el) {
      el.classList.remove('lost');
      void el.getBoundingClientRect();
      el.classList.add('lost');
    }
    sfx('star');
  }
  updateHud();
  savePlay();
  if (hearts <= 0 && !practice) {
    const b = board;
    setTimeout(() => { if (board === b) outOfHearts(); }, 600);
  }
}

function outOfHearts() {
  if (finished || practice || hearts > 0 || relaxed()) return;
  ui.show(`<h2>Out of hearts</h2><p>That's three bumps. Press and hold a tile to see where it would go before you tap it.</p>
    <div class="actions"><button class="btn btn-primary" data-action="restart">Start again</button>
    <button class="btn btn-soft" data-action="practice">Keep going, for no stars</button></div>`);
}

function undo() {
  if (finished || !moves.length || !board) return;
  const h = board.undo();
  if (!h) return;
  moves.pop();
  for (let k = flying.length - 1; k >= 0; k--) if (flying[k].i === h.i) flying.splice(k, 1);
  for (let k = bumps.length - 1; k >= 0; k--) if (bumps[k].i === h.i) bumps.splice(k, 1);
  appear.set(h.i, performance.now());
  sfx('tap');
  updateHud();
  savePlay();
  requestDraw();
}

function hintMove() {
  if (finished || !board || ui.isOpen()) return;
  const free = board.free();
  if (!free.length) return;
  // A free tile you can see (the one nearest the middle), or failing that
  // the nearest one out of sight.
  const seen = (c) => c.x >= area.x && c.x <= area.x + area.w && c.y >= area.y && c.y <= area.y + area.h;
  let best = free[0], bd = Infinity;
  for (const i of free) {
    const c = centreOf(i), dd = Math.hypot(c.x - W / 2, c.y - (area.y + area.h / 2)) + (seen(c) ? 0 : 1e6);
    if (dd < bd) { bd = dd; best = i; }
  }
  const c = centreOf(best);
  if (c.x < area.x || c.x > area.x + area.w || c.y < area.y || c.y > area.y + area.h) {
    // Out of sight: bring it into view.
    const s = Math.max(view.s, Math.min(maxScale(), 26));
    const [wx, wy] = toXY(...level.cells[best]);
    animateView({ s, x: W / 2 - wx * s, y: area.y + area.h / 2 - wy * s });
  }
  hint = { i: best, d: board.exit(best), t0: performance.now() };
  sfx('hint');
  requestDraw();
}

function win() {
  if (finished || board.remaining) return;
  finished = true;
  const run = save.runs[level.mode];
  const stars = relaxed() ? 3 : practice ? 0 : hearts;
  const prev = run.best[level.n] || 0;
  run.best[level.n] = Math.max(prev, stars);
  run.solved++;
  run.n = Math.max(run.n, level.n + 1);
  run.play = null;
  writeSave();
  updateHud();
  glowAt = performance.now();
  sfx('win');
  haptic();
  confetti();
  requestDraw();
  const b = board;
  setTimeout(() => {
    if (board !== b) return;
    const what = level.mode === 'levels' ? (TIER_TAG[level.tier] ? `${level.tier === 'hard' ? 'Hard' : 'Super hard'} level` : 'Level') : MODE_NAME[level.mode];
    const note = relaxed() ? `All ${board.total.toLocaleString()} tiles cleared. What a board!`
      : practice ? 'Cleared! Try it again without running out of hearts for stars.'
        : stars === 3 ? 'Not a single bump. Perfect!' : `${3 - stars} bump${stars === 2 ? '' : 's'}. Clear it without bumping for three stars.`;
    ui.show(`<h2>${what} ${level.n} cleared!</h2>
      ${relaxed() ? '' : `<div class="win-stars">${[1, 2, 3].map((k) => STAR(k <= stars)).join('')}</div>`}
      <p>${note}</p>
      <div class="actions"><button class="btn btn-primary" data-action="next">Next ${level.mode === 'levels' ? 'level' : 'board'}</button>
      ${stars < 3 && !relaxed() ? '<button class="btn btn-soft" data-action="restart">Try again</button>' : ''}</div>`);
  }, 1300);
}

// ---- view: where the board sits and how big it is ------------------------------------------

let W = 0, H = 0, dpr = 1;
let area = { x: 0, y: 0, w: 0, h: 0 };
let view = { s: 20, x: 0, y: 0 };
let fit = { s: 20, x: 0, y: 0 };
let bounds = { x0: 0, x1: 0, y0: 0, y1: 0 };
let viewAnim = null;
const maxScale = () => Math.max(fit.s * 1.01, 46);

function layout(reset = false) {
  W = innerWidth;
  H = innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  if (!level) return;
  const top = $('counter').getBoundingClientRect().bottom + 10;
  const bottom = $('tools').getBoundingClientRect().top - 12;
  area = { x: 10, y: top, w: W - 20, h: bottom - top };
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [q, r] of level.cells) {
    const [x, y] = toXY(q, r);
    x0 = Math.min(x0, x - 1); x1 = Math.max(x1, x + 1);
    y0 = Math.min(y0, y - 0.9); y1 = Math.max(y1, y + 1.05);
  }
  bounds = { x0, x1, y0, y1 };
  const s = Math.min(area.w / (x1 - x0), area.h / (y1 - y0), 38);
  fit = { s, x: area.x + area.w / 2 - ((x0 + x1) / 2) * s, y: area.y + area.h / 2 - ((y0 + y1) / 2) * s };
  if (reset) {
    viewAnim = null;
    // Big boards start zoomed in near the middle; small ones show whole.
    view = fit.s < 13 ? centredView(16) : { ...fit };
  }
  clampView(view);
  requestDraw();
}

function centredView(s) {
  const v = { s, x: W / 2 - ((bounds.x0 + bounds.x1) / 2) * s, y: area.y + area.h / 2 - ((bounds.y0 + bounds.y1) / 2) * s };
  clampView(v);
  return v;
}

function setView(v) {
  view = { s: Math.max(fit.s, Math.min(maxScale(), v.s)), x: 0, y: 0 };
  view.x = W / 2 - v.cx * view.s;
  view.y = H / 2 - v.cy * view.s;
  clampView(view);
}

// Keep the board from being dragged out of sight.
function clampView(v) {
  const bw = (bounds.x1 - bounds.x0) * v.s, bh = (bounds.y1 - bounds.y0) * v.s;
  const left = v.x + bounds.x0 * v.s, top = v.y + bounds.y0 * v.s;
  if (bw <= area.w) v.x += area.x + (area.w - bw) / 2 - left;
  else v.x += Math.min(area.x + area.w * 0.25 - left, Math.max(0, area.x + area.w * 0.75 - (left + bw)));
  if (bh <= area.h) v.y += area.y + (area.h - bh) / 2 - top;
  else v.y += Math.min(area.y + area.h * 0.25 - top, Math.max(0, area.y + area.h * 0.75 - (top + bh)));
}

function zoomAt(s, x, y) {
  s = Math.max(fit.s, Math.min(maxScale(), s));
  const k = s / view.s;
  view = { s, x: x - (x - view.x) * k, y: y - (y - view.y) * k };
  clampView(view);
  viewAnim = null;
  requestDraw();
}

function animateView(to) {
  clampView(to);
  viewAnim = { from: { ...view }, to, t0: performance.now() };
  requestDraw();
}

const centreOf = (i) => {
  const [x, y] = toXY(...level.cells[i]);
  return { x: view.x + x * view.s, y: view.y + y * view.s };
};

function cellAt(sx, sy) {
  if (!level) return -1;
  const [q, r] = fromXY((sx - view.x) / view.s, (sy - view.y) / view.s);
  const i = board.at.get(key(q, r));
  return i === undefined ? -1 : i;
}

// ---- animation --------------------------------------------------------------------------

const flying = []; // tiles on their way out
const bumps = []; // tiles going out and back
const parts = []; // ice shards and sparkles
const wiggle = new Map(); // cell -> when it shook
const appear = new Map(); // cell -> when an undone tile came back
let hint = null, preview = null, glowAt = 0;

// World points along a path: from the tile's cell over each cell it passes,
// then on out past the edge (or, for a bump, up to whatever is in the way).
function pathPoints(i, path, stop, isBump) {
  const pts = [toXY(...level.cells[i])];
  const cells = path.cells.slice(0, stop);
  for (const j of cells) pts.push(toXY(...level.cells[j]));
  if (isBump) {
    // Up against the tile in the way.
    const [hx, hy] = toXY(...level.cells[path.cells[stop]]);
    const [lx, ly] = pts[pts.length - 1];
    pts.push([lx + (hx - lx) * 0.42, ly + (hy - ly) * 0.42]);
    return pts;
  }
  const [lx, ly] = pts[pts.length - 1], d = path.out;
  const [dx, dy] = toXY(...DIRS[d]);
  pts.push([lx + dx * 30, ly + dy * 30]);
  return pts;
}

function fly(i, t, d, path, layers) {
  flying.push({ i, t, pts: pathPoints(i, path, path.cells.length, false), t0: performance.now(), d });
  // Sparkles where it took off.
  const [x, y] = toXY(...level.cells[i]);
  for (let k = 0; k < 6; k++) {
    const a = Math.random() * TAU;
    parts.push({ x, y, vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 2.4, t0: performance.now(), life: 420, color: COLORS[t.d].light, size: 0.12 });
  }
}

function thaw(j) {
  const [x, y] = toXY(...level.cells[j]);
  for (let k = 0; k < 10; k++) {
    const a = Math.random() * TAU, v = 2 + Math.random() * 3;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, t0: performance.now(), life: 520, color: k % 2 ? '#ffffff' : '#bfe6ff', size: 0.16, shard: true });
  }
  setTimeout(() => sfx('ice'), 120);
}

const busyCell = (i) => bumps.some((b) => b.i === i);
const PLAIN_TILE = { d: -1, two: false };

// Where along a polyline a distance falls.
function along(pts, dist) {
  for (let k = 1; k < pts.length; k++) {
    const [ax, ay] = pts[k - 1], [bx, by] = pts[k];
    const seg = Math.hypot(bx - ax, by - ay);
    if (dist <= seg) {
      const u = seg ? dist / seg : 0;
      return [ax + (bx - ax) * u, ay + (by - ay) * u, false];
    }
    dist -= seg;
  }
  const [x, y] = pts[pts.length - 1];
  return [x, y, true];
}

const pathLength = (pts) => pts.reduce((s, p, k) => (k ? s + Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) : 0), 0);

// ---- drawing ------------------------------------------------------------------------------

let raf = 0, lastT = 0;
let floor = null; // the honeycomb, as one path in board units

function requestDraw() {
  if (!raf) raf = requestAnimationFrame(frame);
}

function frame(now) {
  raf = 0;
  const dt = Math.min(0.05, (now - (lastT || now)) / 1000);
  lastT = now;
  if (draw(now, dt)) requestDraw();
  else lastT = 0;
}

function draw(now, dt) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  if (!level) return false;
  let live = false;
  if (viewAnim) {
    const k = Math.min(1, (now - viewAnim.t0) / 320), e = k * k * (3 - 2 * k);
    view = {
      s: viewAnim.from.s + (viewAnim.to.s - viewAnim.from.s) * e,
      x: viewAnim.from.x + (viewAnim.to.x - viewAnim.from.x) * e,
      y: viewAnim.from.y + (viewAnim.to.y - viewAnim.from.y) * e,
    };
    if (k >= 1) viewAnim = null;
    live = true;
  }
  const { s } = view;
  const cells = level.cells;
  // Only what's on screen.
  const vis = (x, y) => x > -2 * s && x < W + 2 * s && y > -2 * s && y < H + 2 * s;

  // The honeycomb floor.
  if (!floor || floor.level !== level) {
    const p = new Path2D();
    for (const [q, r] of cells) {
      const [x, y] = toXY(q, r);
      for (let k = 0; k < 6; k++) {
        const t = (k * Math.PI) / 3;
        const px = x + 0.94 * Math.cos(t), py = y + 0.94 * Math.sin(t);
        if (k) p.lineTo(px, py);
        else p.moveTo(px, py);
      }
      p.closePath();
    }
    floor = { level, path: p };
  }
  g.save();
  g.translate(view.x, view.y);
  g.scale(s, s);
  const glow = glowAt ? Math.max(0, 1 - (now - glowAt) / 1500) : 0;
  if (glow > 0) live = true;
  g.fillStyle = `rgba(255, 255, 255, ${0.5 + 0.4 * glow})`;
  g.fill(floor.path);
  g.lineWidth = 1.5 / s;
  g.strokeStyle = 'rgba(77, 91, 230, 0.16)';
  g.stroke(floor.path);
  g.restore();

  const a = s; // hex radius on screen
  // Sprites come in steps of size, so zooming doesn't redraw them every frame.
  const spriteA = Math.max(6, Math.round(1.06 ** Math.round(Math.log(a * dpr) / Math.log(1.06))));
  // Pads.
  for (const [i, d] of level.pads) {
    const c = centreOf(i);
    if (!vis(c.x, c.y)) continue;
    paintPad(g, c.x, c.y, a, d, 0.5);
  }
  // Tiles and stones, back to front.
  for (const i of order) {
    const st = board.stack[i];
    if (!st.length && !board.stone[i]) continue;
    const away = busyCell(i); // the top tile is out bumping
    if (away && st.length < 2) continue;
    let { x, y } = centreOf(i);
    if (!vis(x, y)) continue;
    const wg = wiggle.get(i);
    if (wg !== undefined) {
      const k = (now - wg) / 380;
      if (k >= 1) wiggle.delete(i);
      else {
        x += Math.sin(k * Math.PI * 7) * (1 - k) * a * 0.16;
        live = true;
      }
    }
    let sc = 1;
    const ap = appear.get(i);
    if (ap !== undefined) {
      const k = (now - ap) / 260;
      if (k >= 1) appear.delete(i);
      else {
        sc = 0.5 + 0.5 * Math.sin((k * Math.PI) / 2) + 0.1 * Math.sin(k * Math.PI);
        live = true;
      }
    }
    const img = board.stone[i] ? stoneSprite(spriteA)
      : away ? tileSprite(spriteA, PLAIN_TILE, st.length - 1, false)
        : tileSprite(spriteA, st[st.length - 1], st.length, !!board.frozen[i]);
    const w = (img.width / dpr / spriteA) * a * dpr, h = (img.height / dpr / spriteA) * a * dpr;
    g.drawImage(img, x - (w / 2) * sc, y - a * 1.05 * sc, w * sc, h * sc);
  }
  // The hinted tile.
  if (hint && board.top(hint.i)) {
    const k = (now - hint.t0) / 1000;
    if (k > 8) hint = null;
    else {
      const c = centreOf(hint.i);
      g.save();
      g.lineWidth = Math.max(2, a * 0.16);
      g.strokeStyle = `rgba(255, 56, 150, ${0.45 + 0.4 * Math.sin(k * 6)})`;
      hexPath(g, c.x, c.y, a * 1.02);
      g.stroke();
      g.restore();
      if (k < 2.5 && hint.d >= 0) trail(hint.i, hint.d, now, k / 2.5);
      live = true;
    }
  } else hint = null;
  // Press-and-hold preview.
  if (preview) {
    trail(preview.i, preview.d, now, 0);
    live = true;
  }
  // Tiles bumping and coming back.
  for (let k = bumps.length - 1; k >= 0; k--) {
    const b = bumps[k];
    const t = now - b.t0, len = pathLength(b.pts), out = Math.max(90, len * 55), dur = out * 2 + 60;
    if (t >= dur) { bumps.splice(k, 1); continue; }
    const dist = t < out ? (t / out) ** 2 * len : t < out + 60 ? len : (1 - (t - out - 60) / out) * len;
    const [wx, wy] = along(b.pts, Math.max(0, dist));
    const img = tileSprite(spriteA, b.t, 1, false);
    const w = (img.width / spriteA) * a, h = (img.height / spriteA) * a;
    g.drawImage(img, view.x + wx * s - w / 2, view.y + wy * s - a * 1.05, w, h);
    live = true;
  }
  // Tiles flying off.
  for (let k = flying.length - 1; k >= 0; k--) {
    const f = flying[k];
    const t = (now - f.t0) / 1000;
    const dist = 9 * t + 70 * t * t;
    const [wx, wy, done] = along(f.pts, dist);
    const x = view.x + wx * s, y = view.y + wy * s;
    if (done || t > 2.5 || x < -4 * a || x > W + 4 * a || y < -4 * a || y > H + 4 * a) { flying.splice(k, 1); continue; }
    const img = tileSprite(spriteA, f.t, 1, false);
    const w = (img.width / spriteA) * a, h = (img.height / spriteA) * a;
    g.save();
    g.globalAlpha = Math.max(0.15, 1 - t * 1.2);
    g.drawImage(img, x - w / 2, y - a * 1.05, w, h);
    g.restore();
    live = true;
  }
  // Particles.
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k], age = now - p.t0;
    if (age >= p.life) { parts.splice(k, 1); continue; }
    p.vy += 9 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const al = 1 - age / p.life;
    g.save();
    g.globalAlpha = al;
    g.fillStyle = p.color;
    const x = view.x + p.x * s, y = view.y + p.y * s, z = p.size * a;
    if (p.shard) {
      g.translate(x, y);
      g.rotate(age / 90);
      g.beginPath();
      g.moveTo(0, -z);
      g.lineTo(z * 0.6, z * 0.6);
      g.lineTo(-z * 0.5, z * 0.4);
      g.closePath();
      g.fill();
    } else {
      g.beginPath();
      g.arc(x, y, z * al, 0, TAU);
      g.fill();
    }
    g.restore();
    live = true;
  }
  return live || flying.length > 0;
}

// A dotted trail showing where a tile would go: green if it gets away, red
// up to whatever is in its way.
function trail(i, d, now, fade) {
  const r = board.probe(i, d);
  if (!r.path) return;
  const blocked = r.hit >= 0;
  const pts = blocked ? pathPoints(i, r.path, r.stop, true) : pathPoints(i, r.path, r.path.cells.length, false);
  if (!blocked) {
    // Not all the way to the edge of the world: just a little way past the board.
    const last = pts[pts.length - 2], end = pts[pts.length - 1];
    const k = 2.2 / 30;
    pts[pts.length - 1] = [last[0] + (end[0] - last[0]) * k, last[1] + (end[1] - last[1]) * k];
  }
  const s = view.s;
  g.save();
  g.globalAlpha = 1 - fade * 0.6;
  g.setLineDash([s * 0.18, s * 0.2]);
  g.lineDashOffset = -now / 25;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.lineWidth = Math.max(3, s * 0.2);
  g.strokeStyle = blocked ? '#ff3b4f' : '#22c55e';
  g.beginPath();
  pts.forEach(([x, y], k) => (k ? g.lineTo(view.x + x * s, view.y + y * s) : g.moveTo(view.x + x * s, view.y + y * s)));
  g.stroke();
  g.setLineDash([]);
  if (blocked) {
    const c = centreOf(r.hit);
    g.lineWidth = Math.max(2.5, s * 0.14);
    hexPath(g, c.x, c.y, s * 0.98);
    g.stroke();
  }
  g.restore();
}

// ---- touch and mouse ---------------------------------------------------------------------

const pointers = new Map();
let gesture = null, holdTimer = 0;
const HOLD_MS = 380;

function previewAt(x, y) {
  const i = cellAt(x, y);
  if (i < 0 || !board.top(i) || board.frozen[i]) {
    preview = null;
    return false;
  }
  const c = centreOf(i);
  const d = board.dirFor(i, Math.atan2(y - c.y, x - c.x));
  if (!preview || preview.i !== i || preview.d !== d) {
    preview = { i, d };
    requestDraw();
  }
  return true;
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!board || ui.isOpen()) return;
  try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported */ }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now() });
  clearTimeout(holdTimer);
  if (pointers.size === 1) {
    if (e.pointerType === 'mouse' && (e.button === 1 || e.button === 2 || e.shiftKey)) {
      gesture = { kind: 'pan' };
      return;
    }
    gesture = { kind: 'tap' };
    const p = pointers.get(e.pointerId);
    holdTimer = setTimeout(() => {
      if (gesture && gesture.kind === 'tap' && pointers.size === 1 && previewAt(p.x, p.y)) {
        gesture.kind = 'preview';
        haptic();
      }
    }, HOLD_MS);
  } else if (pointers.size === 2) {
    preview = null;
    const [a, b] = [...pointers.values()];
    gesture = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), s0: view.s, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, x0: view.x, y0: view.y };
  } else gesture = { kind: 'none' };
});

canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p || !gesture) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (gesture.kind === 'preview') {
    previewAt(p.x, p.y);
    return;
  }
  if (gesture.kind === 'tap') {
    if (Math.hypot(p.x - p.x0, p.y - p.y0) < 9) return;
    clearTimeout(holdTimer);
    gesture.kind = 'pan';
  }
  if (gesture.kind === 'pan') {
    view.x += dx;
    view.y += dy;
    clampView(view);
    viewAnim = null;
    requestDraw();
  } else if (gesture.kind === 'pinch' && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const s = Math.max(fit.s, Math.min(maxScale(), (gesture.s0 * d) / Math.max(1, gesture.d0)));
    const k = s / gesture.s0;
    view = { s, x: mx - (gesture.mx - gesture.x0) * k, y: my - (gesture.my - gesture.y0) * k };
    clampView(view);
    viewAnim = null;
    requestDraw();
  }
});

function endPointer(e, cancelled) {
  const p = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  clearTimeout(holdTimer);
  if (!gesture || !p) return;
  if (gesture.kind === 'preview') {
    preview = null;
    requestDraw();
  }
  if (!cancelled && gesture.kind === 'tap' && pointers.size === 0 && performance.now() - p.t0 < 650) tapAt(e.clientX, e.clientY);
  if (gesture.kind === 'pan' || gesture.kind === 'pinch') savePlaySoon();
  gesture = pointers.size === 0 ? null : { kind: 'none' };
}
canvas.addEventListener('pointerup', (e) => endPointer(e, false));
canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (board) zoomAt(view.s * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  savePlaySoon();
}, { passive: false });

let saveSoon = 0;
function savePlaySoon() {
  if (!relaxed()) return;
  clearTimeout(saveSoon);
  saveSoon = setTimeout(savePlay, 600);
}

// ---- cards ------------------------------------------------------------------------------

// Small pictures of tiles for the cards.
function picture(items, w = 200, h = 110) {
  const c = document.createElement('canvas');
  c.width = w * 2;
  c.height = h * 2;
  const t = c.getContext('2d');
  t.scale(2, 2);
  const a = Math.min(26, (w - 20) / (items.length * 2.1));
  items.forEach((it, k) => {
    const x = w / 2 + (k - (items.length - 1) / 2) * a * 2.05, y = h / 2 - a * 0.1;
    if (it.pad !== undefined) {
      t.fillStyle = 'rgba(255,255,255,0.7)';
      hexPath(t, x, y, a * 0.94);
      t.fill();
      paintPad(t, x, y, a, it.pad, 0.5);
    } else if (it.stone) paintStone(t, x, y, a);
    else if (it.empty) {
      t.fillStyle = 'rgba(255,255,255,0.7)';
      hexPath(t, x, y, a * 0.94);
      t.fill();
    } else paintTile(t, x, y, a, { d: it.d, two: !!it.two }, it.layers || 1, !!it.frozen);
  });
  return c.toDataURL();
}

const TUT = {
  basics: { title: 'How to play', art: () => picture([{ d: 1 }, { d: 2 }, { empty: 1 }]), text: 'Tap a tile and it slides off the board the way its arrow points. If another tile is in the way it bumps back, and you lose a heart. Clear every tile to win!' },
  two: { title: 'Two-way tiles', art: () => picture([{ d: 2, two: 1 }]), text: 'These have an arrow at each end. Tap the end you want it to leave from.' },
  stack: { title: 'Stacks', art: () => picture([{ d: 0, layers: 2 }, { d: 3, layers: 3 }]), text: 'Stacked tiles leave one layer at a time. Each layer underneath has its own arrow, and the stack keeps blocking the way until it’s all gone.' },
  frozen: { title: 'Frozen tiles', art: () => picture([{ d: 5, frozen: 1 }, { d: 4 }]), text: 'A frozen tile can’t move until a tile right next to it flies away.' },
  stone: { title: 'Stones', art: () => picture([{ d: 2 }, { stone: 1 }]), text: 'Stones never move, and nothing can slide through them.' },
  pad: { title: 'Steering pads', art: () => picture([{ d: 2 }, { pad: 3 }, { empty: 1 }]), text: 'A tile that slides over a blue pad turns the way the pad points.' },
  stack3: { title: 'Taller stacks', art: () => picture([{ d: 1, layers: 3 }]), text: 'Now stacks can be three tiles high.' },
};

function intro() {
  if (level.mode !== 'levels' && !save.seen.basics) {
    save.seen.basics = true;
    writeSave();
    return showRules();
  }
  const k = level.mode === 'levels' ? INTRO[level.n] : null;
  if (!k || save.seen[k] || moves.length) return;
  save.seen[k] = true;
  writeSave();
  const t = TUT[k];
  ui.show(`<h2>${t.title}</h2><img class="tut-img" alt="" src="${t.art()}"><p>${t.text}</p>
    ${k === 'basics' ? '<p class="tip">Press and hold a tile to see where it would go.</p>' : ''}
    <div class="actions"><button class="btn btn-primary" data-action="close">${k === 'basics' ? 'Let’s go' : 'Got it'}</button></div>`);
}

function showRules() {
  const row = (img, title, text) => `<div class="rule"><img alt="" src="${img}"><div><b>${title}</b><span>${text}</span></div></div>`;
  const pic = (items) => picture(items, 64, 56);
  ui.show(`<h2>How to play</h2>
    <div class="rules">
      ${row(pic([{ d: 1 }]), 'Tap to send it', 'Each tile slides off the way its arrow points. Bump into another and you lose a heart.')}
      ${row(pic([{ d: 2, two: 1 }]), 'Two-way tiles', 'leave from the end you tap.')}
      ${row(pic([{ d: 0, layers: 2 }]), 'Stacks', 'leave one layer at a time, each with its own arrow.')}
      ${row(pic([{ d: 4, frozen: 1 }]), 'Frozen tiles', 'thaw when a tile next to them flies away.')}
      ${row(pic([{ stone: 1 }]), 'Stones', 'never move; nothing gets past them.')}
      ${row(pic([{ pad: 1 }]), 'Blue pads', 'turn anything sliding over them.')}
    </div>
    <p class="tip">Press and hold a tile to see its way out without moving it. Every board can be cleared, in many orders, so you can never get stuck.</p>
    <div class="actions"><button class="btn btn-primary" data-action="close">Got it</button></div>`);
}

function showSettings() {
  const tab = (m) => `<button class="seg-btn${m === mode ? ' on' : ''}" data-action="mode" data-mode="${m}">${{ levels: 'Levels', hard: 'Hard', super: 'Super', huge: 'Huge' }[m]}</button>`;
  const run = save.runs[mode];
  const stars = Object.values(run.best).reduce((s, v) => s + v, 0);
  ui.show(`<h2>Settings</h2>
    <div class="seg">${MODES.map(tab).join('')}</div>
    <p class="seg-note tip">${{ levels: 'New pieces arrive as you go. Every 5th level is hard, every 10th super hard.', hard: 'Endless hard boards with every kind of tile.', super: 'Endless big, dense boards.', huge: 'Enormous boards to chip away at. No hearts to lose.' }[mode]}${mode === 'huge' ? '' : ` ★ ${stars}`}</p>
    ${switchRow('Sound', 'sound')}
    ${switchRow('Haptics', 'haptics')}
    <div class="row">${mode === 'levels' ? 'Level' : 'Board'} <span class="stepper"><button class="btn btn-soft" data-action="num-down" aria-label="Previous">−</button>
      <input id="numInput" type="number" inputmode="numeric" min="1" value="${level ? level.n : run.n}">
      <button class="btn btn-soft" data-action="num-up" aria-label="Next">+</button></span></div>
    <div class="actions">
      <button class="btn btn-primary" data-action="go">Play this one</button>
      <button class="btn btn-soft" data-action="restart">Start this one again</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
      <button class="btn btn-soft" data-action="close">Close</button>
    </div>`);
}

const ui = cards({
  next: () => startLevel(level.n + 1),
  restart: () => {
    save.runs[mode].play = null;
    startLevel(level.n);
  },
  practice: () => {
    practice = true;
    ui.close();
    updateHud();
    savePlay();
  },
  rules: showRules,
  mode: (el) => switchMode(el.dataset.mode),
  'num-down': () => { const i = $('numInput'); i.value = Math.max(1, (+i.value || 1) - 1); },
  'num-up': () => { const i = $('numInput'); i.value = (+i.value || 0) + 1; },
  go: () => startLevel(+$('numInput').value || 1, true),
});

$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });
$('undoBtn').addEventListener('click', undo);
$('hintBtn').addEventListener('click', hintMove);
$('fitBtn').addEventListener('click', () => {
  if (!level) return;
  sfx('tap');
  if (view.s > fit.s * 1.05) animateView({ ...fit });
  else animateView(centredView(Math.min(maxScale(), Math.max(fit.s * 2, 24))));
});
window.addEventListener('keydown', (e) => {
  if (ui.isOpen() || !board) return;
  if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'u') undo();
  else if (e.key === 'h') hintMove();
  else if (e.key === '+' || e.key === '=') zoomAt(view.s * 1.2, W / 2, area.y + area.h / 2);
  else if (e.key === '-') zoomAt(view.s / 1.2, W / 2, area.y + area.h / 2);
});

// ---- start ---------------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', () => layout(false));
document.addEventListener('visibilitychange', () => { if (document.hidden) savePlay(); });

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.hexit = {
    startLevel, send, undo, hintMove, switchMode, get board() { return board; }, get level() { return level; }, get view() { return view; },
    get finished() { return finished; }, centreOf,
    solveStep() { const i = board.free()[0]; if (i !== undefined) send(i, board.exit(i)); },
  };
}

const params = new URLSearchParams(location.search);
if (MODES.includes(params.get('mode'))) {
  mode = params.get('mode');
  save.mode = mode;
  writeSave();
}
if (location.search) window.history.replaceState(null, '', location.pathname);
const asked = Number(params.get('n'));
if (asked > 0) startLevel(asked, true);
else {
  const run = save.runs[mode];
  startLevel(run.play ? run.play.n : run.n, true);
}
