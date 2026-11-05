// Car Park: slide the cars and trucks out of the way to get the red car out.

import { MODES, RANGES, SIZE, EXIT_ROW, GOAL, GEN_VERSION, limits, isSolved, canMove, solveFrom, bestHint, paintOf, makePuzzle } from './logic.js';
import { store, settings, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, toast, confetti, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = ICON[el.dataset.icon];
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

const MODE_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' };
const THEME = { easy: '', medium: 'teal', hard: 'red', expert: 'night' };
const canvas = $('stage');
const g = canvas.getContext('2d');

// ---- saved progress ----------------------------------------------------------------

// One run per mode: the puzzle number you're up to, how many you've solved,
// your best stars for each puzzle, and the puzzle in progress.
const SAVE_KEY = 'carpark';
const save = (() => {
  const s = store.get(SAVE_KEY, {}) || {};
  const out = { mode: MODES.includes(s.mode) ? s.mode : 'easy', seen: s.seen || {}, runs: s.runs || {} };
  for (const m of MODES) out.runs[m] = Object.assign({ n: 1, solved: 0, best: {}, play: null }, out.runs[m]);
  return out;
})();
const writeSave = () => store.set(SAVE_KEY, save);

// Stars for finishing in `moves` when `min` is the fewest possible.
const starsFor = (moves, min) => (moves <= min ? 3 : moves <= min + Math.max(2, Math.round(min * 0.3)) ? 2 : 1);

// ---- puzzles (built in a worker, so the screen never freezes) --------------------------

const built = new Map();
const waiting = new Map();
let worker = null, workerBroken = false;
const keyOf = (m, n) => `${m}:${n}`;

// The puzzles in play (and the next ones) are kept on the device, so
// opening the game again doesn't mean working them out all over again.
const CACHE_KEY = 'carpark-built';

function cached(m, n) {
  const p = (store.get(CACHE_KEY, null) || {})[keyOf(m, n)];
  return p && p.v === GEN_VERSION ? p : null;
}

function keep(p) {
  const c = store.get(CACHE_KEY, null) || {}, k = keyOf(p.mode, p.n);
  c[k] = p;
  const wanted = new Set();
  for (const m of MODES) {
    const r = save.runs[m], at = r.play ? r.play.n : r.n;
    for (const x of [at, at + 1, r.n, r.n + 1]) wanted.add(keyOf(m, x));
  }
  if (puzzle) { wanted.add(keyOf(puzzle.mode, puzzle.n)); wanted.add(keyOf(puzzle.mode, puzzle.n + 1)); }
  wanted.add(k);
  for (const old of Object.keys(c)) if (!wanted.has(old)) delete c[old];
  if (!store.set(CACHE_KEY, c)) store.set(CACHE_KEY, { [k]: p });
}

function deliver(m, n, p) {
  if (!p) return buildHere(m, n);
  const k = keyOf(m, n);
  built.set(k, p);
  while (built.size > 12) built.delete(built.keys().next().value);
  keep(p);
  const list = waiting.get(k) || [];
  waiting.delete(k);
  list.forEach((resolve) => resolve(p));
}

function buildHere(m, n) {
  setTimeout(() => deliver(m, n, makePuzzle(m, n)), 20);
}

function builder() {
  if (!worker && !workerBroken) {
    try {
      worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => deliver(e.data.mode, e.data.n, e.data.puzzle);
      worker.onerror = () => {
        workerBroken = true;
        worker = null;
        for (const k of waiting.keys()) {
          const [wm, wn] = k.split(':');
          buildHere(wm, Number(wn));
        }
      };
    } catch {
      workerBroken = true;
    }
  }
  return worker;
}

function getPuzzle(m, n) {
  const k = keyOf(m, n);
  if (built.has(k)) return Promise.resolve(built.get(k));
  const kept = cached(m, n);
  if (kept) {
    built.set(k, kept);
    return Promise.resolve(kept);
  }
  return new Promise((resolve) => {
    if (waiting.has(k)) return waiting.get(k).push(resolve);
    waiting.set(k, [resolve]);
    if (builder()) worker.postMessage({ mode: m, n });
    else buildHere(m, n);
  });
}

// Get a puzzle ready before it's needed (only in the worker: on the main
// thread a hard one could stall the game mid-drag).
function prefetch(m, n) {
  const k = keyOf(m, n);
  if (built.has(k) || waiting.has(k) || cached(m, n) || !builder()) return;
  getPuzzle(m, n);
}

// ---- the game ------------------------------------------------------------------------

let mode = save.mode; // the mode of the puzzle on screen
let loadingMode = null; // a puzzle on its way (nothing can be moved meanwhile)
let puzzle = null;
let pos = []; // where each vehicle is, in squares along its line
let shown = []; // where each one is drawn (it slides between squares)
let tweens = []; // slides in progress: { from, to, start, dur, clack }
let moves = []; // { i, from, to }
let hints = 0;
let finished = false;
let drag = null;
let hintShow = null; // { i, to, at }
let exitAt = 0; // when the red car started driving out
let introAt = 0;
let loadToken = 0;
let winToken = 0; // a win's drive-out and card, cancelled if another puzzle starts
const bumps = new Map(); // vehicle -> { at, dir }

async function startPuzzle(n, resume = false, m = puzzle ? puzzle.mode : mode) {
  n = Math.max(1, Math.floor(n) || 1);
  ui.close();
  const token = ++loadToken;
  winToken++; // a win still driving out on the old puzzle stops here
  if (drag) { const d = drag; drag = null; slideTo(d.i, pos[d.i]); }
  loadingMode = m;
  updateHud();
  const slow = setTimeout(() => {
    if (token !== loadToken) return;
    $('loadingText').textContent = m === 'easy' ? 'Parking the cars…' : `Parking the cars for a ${MODE_NAME[m].toLowerCase()} one…`;
    $('loading').classList.remove('hide');
  }, 150);
  const p = await getPuzzle(m, n);
  if (token !== loadToken) return; // another puzzle was picked meanwhile
  clearTimeout(slow);
  $('loading').classList.add('hide');
  loadingMode = null;
  mode = m;
  save.mode = m;

  winToken++;
  puzzle = p;
  pos = p.start.slice();
  moves = [];
  hints = 0;
  finished = false;
  drag = null;
  hintShow = null;
  exitAt = 0;
  bumps.clear();
  const play = save.runs[m].play;
  if (resume && play && play.n === n && play.v === p.v) {
    let ok = true;
    for (const [i, to] of play.moves || []) {
      if (!canMove(puzzle, pos, i, to)) { ok = false; break; }
      moves.push({ i, from: pos[i], to });
      pos[i] = to;
    }
    if (!ok || isSolved(pos)) { pos = p.start.slice(); moves = []; }
    else hints = play.hints || 0;
  }
  shown = pos.slice();
  tweens = pos.map(() => null);
  introAt = performance.now();
  for (const t of ['teal', 'red', 'night']) document.body.classList.toggle(`theme-${t}`, THEME[m] === t);
  $('levelLabel').textContent = `${MODE_NAME[m].toUpperCase()} ${n}`;
  $('tierTag').textContent = `MIN ${p.min}`;
  layout();
  updateHud();
  savePlay();
  sfx('slide');
  intro();
  // The next one is worked out while you play this one.
  setTimeout(() => prefetch(m, n + 1), 400);
}

// Stop loading a puzzle that was asked for (going back to the one on screen).
function cancelLoad() {
  loadToken++;
  loadingMode = null;
  $('loading').classList.add('hide');
  updateHud();
}

function savePlay() {
  if (!puzzle) return;
  save.runs[puzzle.mode].play = finished ? null : { n: puzzle.n, v: puzzle.v, moves: moves.map((m) => [m.i, m.to]), hints };
  writeSave();
}

function updateHud() {
  $('moves').textContent = String(moves.length);
  $('movesUnit').textContent = moves.length === 1 ? 'move' : 'moves';
  const busy = finished || !!loadingMode || !puzzle;
  $('undoBtn').disabled = busy || !moves.length;
  $('restartBtn').disabled = busy;
  $('hintBtn').disabled = busy;
}

// Slide vehicle i to p on screen. clack: knock into place when it gets there.
function slideTo(i, p, clack = false, dur = 0) {
  const d = Math.abs(p - shown[i]);
  if (d < 1e-3) {
    shown[i] = p;
    tweens[i] = null;
    if (clack) { sfx('clack'); haptic(); }
    return;
  }
  // It may spring a little past the end, but never into whatever is there.
  const [lo, hi] = limits(puzzle, pos, i);
  tweens[i] = { from: shown[i], to: p, start: performance.now(), dur: dur || 110 + 55 * Math.min(4, d), clack, lo, hi };
  requestDraw();
}

// Vehicle i has been driven to p (as one move, joined onto the last one if
// that was the same vehicle).
function drive(i, p) {
  const from = pos[i];
  if (p === from) return false;
  pos[i] = p;
  const last = moves[moves.length - 1];
  if (last && last.i === i) {
    last.to = p;
    if (last.from === p) moves.pop();
  } else moves.push({ i, from, to: p });
  hintShow = null;
  updateHud();
  savePlay();
  if (isSolved(pos)) win();
  return true;
}

function undo() {
  if (finished || drag || loadingMode || !moves.length) return;
  const m = moves.pop();
  pos[m.i] = m.from;
  slideTo(m.i, m.from, true);
  hintShow = null;
  sfx('slide');
  updateHud();
  savePlay();
}

// A fresh go at the same puzzle: everything back where it started (the cars
// arrive again, rather than all sliding back through each other), and no
// moves or hints so far.
function restart() {
  if (!puzzle || loadingMode) return;
  ui.close();
  winToken++;
  finished = false;
  exitAt = 0;
  drag = null;
  hintShow = null;
  moves = [];
  hints = 0;
  pos = puzzle.start.slice();
  shown = pos.slice();
  tweens = pos.map(() => null);
  bumps.clear();
  introAt = performance.now();
  sfx('slide');
  updateHud();
  savePlay();
  requestDraw();
}

function hint() {
  if (finished || !puzzle || drag || loadingMode || ui.isOpen()) return;
  // Asked again while showing: make that move.
  if (hintShow && performance.now() - hintShow.at < 9000) {
    const { i, to } = hintShow;
    hintShow = null;
    slideTo(i, to, true);
    drive(i, to);
    return;
  }
  // Driving the last car again is still the same move, so the best next
  // step is sometimes to carry on with it.
  const last = moves[moves.length - 1] || null;
  const h = bestHint(puzzle, pos, last && { i: last.i, from: last.from });
  if (!h) return;
  hints++;
  hintShow = { i: h.i, to: h.to, at: performance.now() };
  sfx('hint');
  const total = moves.length + h.left;
  const same = last && last.i === h.i ? 'Keep going with that one: it’s still the same move. ' : '';
  const out = h.i === 0 && h.to === GOAL ? 'Drive the red car out! ' : '';
  const best = `Best from here: ${total} ${total === 1 ? 'move' : 'moves'} in all${total === puzzle.min ? ', the fewest possible' : ''}.`;
  toast(`${out || same}${best} Tap Hint again to make this move.`, 3600);
  savePlay();
  requestDraw();
}

function win() {
  finished = true;
  hintShow = null;
  const run = save.runs[puzzle.mode];
  const name = MODE_NAME[puzzle.mode];
  const stars = starsFor(moves.length, puzzle.min);
  const before = run.best[puzzle.n] || 0;
  if (!before) run.solved++;
  run.best[puzzle.n] = Math.max(before, stars);
  run.n = Math.max(run.n, puzzle.n + 1);
  run.play = null;
  writeSave();
  updateHud();
  // Off it goes, once it has finished sliding into the gap.
  const wait = tweens[0] ? Math.max(0, tweens[0].start + tweens[0].dur - performance.now()) : 0;
  const token = ++winToken;
  const later = (ms, fn) => setTimeout(() => { if (token === winToken && finished) fn(); }, ms);
  later(wait + 60, () => {
    exitAt = performance.now();
    sfx('whoosh');
    requestDraw();
  });
  later(wait + 650, () => { sfx('win'); haptic(); confetti(); });
  later(wait + 1500, () => {
    const total = Object.values(run.best).reduce((s, v) => s + v, 0);
    const star = (on) => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}"><path d="M12 2.6l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.2l-5.72 3 1.1-6.37-4.63-4.5 6.4-.93z"/></svg>`;
    const note = stars === 3 ? 'The fewest moves possible. Perfect!'
      : `Do it in ${puzzle.min} for 3 stars${before === 3 ? ' (you already have them).' : '.'}`;
    ui.show(`<h2>${name} ${puzzle.n} solved!</h2>
      <div class="win-stars">${star(stars >= 1)}${star(stars >= 2)}${star(stars >= 3)}</div>
      <p class="you">You: ${moves.length} ${moves.length === 1 ? 'move' : 'moves'} · Best possible: ${puzzle.min}</p>
      <div class="stats"><div><b>${moves.length}</b><span>Your moves</span></div><div><b>${puzzle.min}</b><span>Fewest</span></div><div><b>${hints}</b><span>Hints</span></div></div>
      <p class="best">${note}</p>
      <p class="tip">★ ${total} ${total === 1 ? 'star' : 'stars'} in ${name} so far</p>
      <div class="actions"><button class="btn btn-primary" data-action="next">Next puzzle</button>
      ${stars < 3 ? '<button class="btn btn-soft" data-action="retry">Try for 3 stars</button>' : ''}</div>`);
  });
}

// ---- the car park on screen ------------------------------------------------------------

const KERB = 0.3; // the wall round the car park, in squares
const ROAD = 0.42; // the way out beyond the wall
let W = 0, H = 0, dpr = 1;
let S = 50, ox = 0, oy = 0; // size of a square, and the top-left of the grid

function layout() {
  W = innerWidth;
  H = innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const top = $('topbar').getBoundingClientRect().bottom + 18;
  let bottom = $('tools').getBoundingClientRect().top - 18;
  const across = SIZE + 2 * KERB + ROAD, down = SIZE + 2 * KERB;
  const size = (b) => Math.max(24, Math.min((W - 14) / across, (b - top) / down, 88));
  S = size(bottom);
  // Hints pop up just above the buttons: where the car park would reach down
  // that far (a big screen, or a short one), it stops short of them.
  const room = H - (parseFloat(getComputedStyle($('toast')).bottom) || 112) - 64;
  if (top + (bottom - top + down * S) / 2 > room) {
    bottom = Math.min(bottom, room);
    S = size(bottom);
  }
  ox = Math.round((W - across * S) / 2 + KERB * S);
  oy = Math.round(top + (bottom - top - (SIZE + 2 * KERB) * S) / 2 + KERB * S);
  requestDraw();
}

// The box a vehicle covers when it's at p (in screen pixels).
function boxOf(i, p) {
  const v = puzzle.vehicles[i];
  return v.h
    ? { x: ox + p * S, y: oy + v.line * S, w: v.len * S, h: S }
    : { x: ox + v.line * S, y: oy + p * S, w: S, h: v.len * S };
}

function vehicleAt(x, y) {
  if (!puzzle) return -1;
  for (let i = 0; i < puzzle.vehicles.length; i++) {
    const b = boxOf(i, shown[i]);
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return i;
  }
  return -1;
}

// ---- dragging ------------------------------------------------------------------------

const rubber = (x) => 0.1 * (1 - Math.exp(-x / 0.25)); // a little give against a blocker

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!puzzle || finished || drag || loadingMode || ui.isOpen()) return;
  const i = vehicleAt(e.clientX, e.clientY);
  if (i < 0) return;
  try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported */ }
  const v = puzzle.vehicles[i];
  // Caught while still sliding: it carries on from where it is now.
  const t = tweens[i];
  tweens[i] = null;
  const [lo, hi] = limits(puzzle, pos, i);
  drag = {
    i, id: e.pointerId, h: v.h, lo, hi, base: shown[i], at: shown[i], from: pos[i], clack: !!(t && t.clack),
    start: v.h ? e.clientX : e.clientY, travel: 0, pushed: 0, slid: shown[i], track: [[performance.now(), shown[i]]],
  };
  hintShow = hintShow && hintShow.i === i ? hintShow : null;
  requestDraw();
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const want = drag.base + ((drag.h ? e.clientX : e.clientY) - drag.start) / S;
  drag.travel = Math.max(drag.travel, Math.abs(want - drag.base));
  let at = want, push = 0;
  if (want < drag.lo) { at = drag.lo - rubber(drag.lo - want); push = -1; }
  else if (want > drag.hi) { at = drag.hi + rubber(want - drag.hi); push = 1; }
  // Pushing on into whatever is in the way: a bump (once per push).
  const over = push < 0 ? drag.lo - want : push > 0 ? want - drag.hi : 0;
  if (push && over > 0.22 && drag.pushed !== push) {
    drag.pushed = push;
    bumps.set(drag.i, { at: performance.now(), dir: push });
    const wall = !(drag.i === 0 && push > 0 && drag.hi === GOAL);
    if (wall) { sfx('bump'); haptic(); }
  } else if (!push || over < 0.08) drag.pushed = 0;
  if (Math.abs(at - drag.slid) >= 0.85) { sfx('slide'); drag.slid = at; }
  drag.at = at;
  shown[drag.i] = at;
  drag.track.push([performance.now(), at]);
  if (drag.track.length > 6) drag.track.shift();
  requestDraw();
});

function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag;
  drag = null;
  // A quick flick carries on a little further.
  const now = performance.now();
  const recent = d.track.filter(([t]) => now - t < 90);
  let v = 0;
  if (recent.length >= 2) v = (recent[recent.length - 1][1] - recent[0][1]) / Math.max(16, recent[recent.length - 1][0] - recent[0][0]);
  const aim = Math.abs(v) > 0.004 ? d.at + v * 110 : d.at;
  // Hardly moved at all (a tap): no move, it just settles where it was going.
  const to = d.travel < 0.2 ? pos[d.i] : Math.max(d.lo, Math.min(d.hi, Math.round(aim)));
  const moved = to !== pos[d.i];
  slideTo(d.i, to, moved || d.clack);
  if (moved) drive(d.i, to);
  requestDraw();
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---- drawing ------------------------------------------------------------------------

let raf = 0;
function requestDraw() {
  if (!raf) raf = requestAnimationFrame(frame);
}
function frame(now) {
  raf = 0;
  if (draw(now)) requestDraw();
}

const ease = (t) => 1 - (1 - t) ** 3;
const easeBack = (t) => { const c = 1.4; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };

function draw(now) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  if (!puzzle) return false;
  let moving = !!drag;

  for (let i = 0; i < tweens.length; i++) {
    const t = tweens[i];
    if (!t) continue;
    const k = Math.min(1, (now - t.start) / t.dur);
    shown[i] = Math.max(t.lo, Math.min(t.hi, t.from + (t.to - t.from) * easeBack(k)));
    if (k >= 1) {
      shown[i] = t.to;
      tweens[i] = null;
      if (t.clack) { sfx('clack'); haptic(); }
    } else moving = true;
  }

  // When nothing is left between the red car and the gap, the way out lights up.
  drawLot(finished || limits(puzzle, pos, 0)[1] === GOAL);
  for (const w of puzzle.walls) drawBollard(w);

  // The red car drives off through the gap.
  let exitK = -1;
  if (exitAt) {
    exitK = Math.min(1, (now - exitAt) / 700);
    shown[0] = GOAL + (W - ox) / S * (exitK * exitK);
    if (exitK < 1) moving = true;
  }

  const intro = Math.min(1, (now - introAt) / 420);
  if (intro < 1) moving = true;
  const order = puzzle.vehicles.map((_, i) => i).filter((i) => !drag || i !== drag.i);
  if (drag) order.push(drag.i);
  for (const i of order) {
    // Vehicles arrive one after another when a puzzle starts.
    const k = Math.min(1, Math.max(0, (now - introAt - i * 28) / 260));
    if (k < 1) moving = true;
    let off = 0;
    const b = bumps.get(i);
    if (b) {
      const t = (now - b.at) / 260;
      if (t >= 1) bumps.delete(i);
      else { off = Math.sin(t * Math.PI * 3) * (1 - t) * 0.05 * b.dir; moving = true; }
    }
    if (i === 0 && exitK >= 0) drawSpeedLines(exitK);
    drawVehicle(i, shown[i] + off, { lift: drag && drag.i === i ? 1 : 0, appear: ease(k) });
  }

  if (hintShow) {
    const t = now - hintShow.at;
    if (t > 9000) hintShow = null;
    else { drawHint(now); moving = true; }
  }
  return moving;
}

function rr(x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

function drawLot(clear) {
  const k = KERB * S, side = SIZE * S;
  const x0 = ox - k, y0 = oy - k, w0 = side + 2 * k;
  const gapY = oy + EXIT_ROW * S;

  // The way out: a short stretch of road beyond the gap.
  g.fillStyle = '#5a6276';
  rr(ox + side - 4, gapY - 2, W - (ox + side) + 8, S + 4, 0);
  g.fill();
  g.fillStyle = '#d9dee9';
  g.fillRect(ox + side, gapY - 3, W - (ox + side), 3);
  g.fillRect(ox + side, gapY + S, W - (ox + side), 3);

  // Shadow, then the concrete wall all round.
  g.save();
  g.shadowColor = 'rgba(30, 40, 90, 0.28)';
  g.shadowBlur = 18 * dpr;
  g.shadowOffsetY = 8 * dpr;
  g.fillStyle = '#c9cfdc';
  rr(x0, y0, w0, w0, k * 1.2);
  g.fill();
  g.restore();
  const wall = g.createLinearGradient(0, y0, 0, y0 + w0);
  wall.addColorStop(0, '#eef1f7');
  wall.addColorStop(1, '#c6ccda');
  g.fillStyle = wall;
  rr(x0, y0, w0, w0, k * 1.2);
  g.fill();
  // The gap in the wall.
  g.fillStyle = '#5a6276';
  g.fillRect(ox + side - 2, gapY, k + 4, S);

  // The tarmac.
  const tar = g.createLinearGradient(0, oy, 0, oy + side);
  tar.addColorStop(0, '#5d6579');
  tar.addColorStop(1, '#4f566a');
  g.fillStyle = tar;
  rr(ox, oy, side, side, S * 0.16);
  g.fill();
  g.fillStyle = '#5a6276';
  g.fillRect(ox + side - S * 0.3, gapY, S * 0.3 + 2, S);

  // Painted bays: dashed lines between the squares, crosses where they meet.
  g.strokeStyle = 'rgba(255, 255, 255, 0.13)';
  g.lineWidth = Math.max(1, S * 0.025);
  g.setLineDash([S * 0.16, S * 0.12]);
  g.lineDashOffset = -S * 0.02;
  g.beginPath();
  for (let i = 1; i < SIZE; i++) {
    g.moveTo(ox + i * S, oy + S * 0.08);
    g.lineTo(ox + i * S, oy + side - S * 0.08);
    g.moveTo(ox + S * 0.08, oy + i * S);
    g.lineTo(ox + side - S * 0.08, oy + i * S);
  }
  g.stroke();
  g.setLineDash([]);

  // Arrows on the exit row, and painted chevrons out through the gap.
  g.fillStyle = clear ? '#5ee88f' : 'rgba(255, 210, 64, 0.85)';
  const chevron = (cx, cy, r) => {
    g.beginPath();
    g.moveTo(cx - r * 0.55, cy - r);
    g.lineTo(cx + r * 0.45, cy);
    g.lineTo(cx - r * 0.55, cy + r);
    g.lineTo(cx - r * 0.95, cy + r);
    g.lineTo(cx + 0.05 * r, cy);
    g.lineTo(cx - r * 0.95, cy - r);
    g.closePath();
    g.fill();
  };
  const cy = gapY + S / 2;
  for (let j = 0; j < 4; j++) {
    const cx = ox + side + k * 0.5 + j * S * 0.36;
    if (cx > W - 4) break;
    chevron(cx, cy, S * 0.16);
  }
  // A little sign over the way out.
  const sx = ox + side - S * 0.06, signW = Math.min(S * 0.96, W - sx - 6), signH = Math.max(13, S * 0.3);
  if (signW > 24) {
    const sy = gapY - signH - S * 0.1;
    g.fillStyle = '#1f9d55';
    rr(sx, sy, signW, signH, 4);
    g.fill();
    g.fillStyle = '#fff';
    g.font = `900 ${Math.round(signH * 0.62)}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('EXIT', sx + signW / 2, sy + signH / 2 + 0.5);
  }
}

function drawBollard(cell) {
  const r = (cell / SIZE) | 0, c = cell % SIZE;
  const x = ox + c * S, y = oy + r * S, m = S * 0.1;
  // Yellow and black hatching on the ground...
  g.save();
  rr(x + m, y + m, S - 2 * m, S - 2 * m, S * 0.12);
  g.clip();
  g.fillStyle = '#2c3142';
  g.fillRect(x, y, S, S);
  g.strokeStyle = '#ffc531';
  g.lineWidth = S * 0.1;
  g.beginPath();
  for (let d = -S; d < 2 * S; d += S * 0.26) { g.moveTo(x + d, y + S); g.lineTo(x + d + S, y); }
  g.stroke();
  g.restore();
  // ...and a concrete post in the middle.
  const cx = x + S / 2, cy = y + S / 2;
  g.save();
  g.shadowColor = 'rgba(0, 0, 0, 0.35)';
  g.shadowBlur = 6 * dpr;
  g.shadowOffsetY = 3 * dpr;
  g.fillStyle = '#c3c8d4';
  g.beginPath();
  g.arc(cx, cy, S * 0.27, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const top = g.createRadialGradient(cx - S * 0.08, cy - S * 0.1, S * 0.02, cx, cy, S * 0.27);
  top.addColorStop(0, '#ffffff');
  top.addColorStop(1, '#b4bac8');
  g.fillStyle = top;
  g.beginPath();
  g.arc(cx, cy, S * 0.24, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#ffc531';
  g.lineWidth = S * 0.05;
  g.beginPath();
  g.arc(cx, cy, S * 0.16, 0, Math.PI * 2);
  g.stroke();
}

function mixHex(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

// Draw vehicle i at position p (squares along its line).
function drawVehicle(i, p, { lift = 0, appear = 1 } = {}) {
  const v = puzzle.vehicles[i];
  const b = boxOf(i, p);
  const [paint, trim] = paintOf(v);
  const L = v.len * S;
  g.save();
  g.translate(b.x + b.w / 2, b.y + b.h / 2);
  // Every vehicle is drawn pointing right, then turned to face its way.
  g.rotate(v.h ? (v.flip ? Math.PI : 0) : v.flip ? -Math.PI / 2 : Math.PI / 2);
  const grow = (0.65 + 0.35 * appear) * (1 + 0.035 * lift);
  g.scale(grow, grow);
  g.globalAlpha = appear;

  const hl = L / 2 - S * 0.07, hw = S * 0.37; // half length and half width of the body
  // Wheels peeking out at the sides.
  g.fillStyle = '#23283a';
  const axles = v.len === 2 ? [-hl + S * 0.42, hl - S * 0.42] : [-hl + S * 0.38, -hl + S * 0.86, hl - S * 0.42];
  for (const ax of axles) {
    rr(ax - S * 0.15, -hw - S * 0.05, S * 0.3, S * 0.16, S * 0.06);
    g.fill();
    rr(ax - S * 0.15, hw - S * 0.11, S * 0.3, S * 0.16, S * 0.06);
    g.fill();
  }

  // The body, with a soft shadow under it (bigger while it's lifted).
  g.save();
  g.shadowColor = `rgba(12, 16, 40, ${0.38 + 0.12 * lift})`;
  g.shadowBlur = (5 + 9 * lift) * dpr;
  g.shadowOffsetY = (2.5 + 5 * lift) * dpr;
  g.fillStyle = trim;
  rr(-hl, -hw, 2 * hl, 2 * hw, S * 0.22);
  g.fill();
  g.restore();
  const body = g.createLinearGradient(0, -hw, 0, hw);
  body.addColorStop(0, mixHex(paint, 0.22));
  body.addColorStop(0.45, paint);
  body.addColorStop(1, mixHex(paint, -0.12));
  g.fillStyle = body;
  rr(-hl + S * 0.03, -hw + S * 0.03, 2 * hl - S * 0.06, 2 * hw - S * 0.06, S * 0.19);
  g.fill();

  if (v.len === 2) drawCarTop(hl, hw, paint, trim, i === 0);
  else drawTruckTop(hl, hw, paint, trim);

  // Lights: headlamps at the front, red lamps at the back.
  g.fillStyle = '#fff4b8';
  rr(hl - S * 0.1, -hw + S * 0.07, S * 0.08, S * 0.15, S * 0.04);
  g.fill();
  rr(hl - S * 0.1, hw - S * 0.22, S * 0.08, S * 0.15, S * 0.04);
  g.fill();
  g.fillStyle = '#ff4d5e';
  rr(-hl + S * 0.03, -hw + S * 0.07, S * 0.06, S * 0.14, S * 0.03);
  g.fill();
  rr(-hl + S * 0.03, hw - S * 0.21, S * 0.06, S * 0.14, S * 0.03);
  g.fill();
  g.restore();
}

function glass(x0, x1, w0, w1) {
  // A pane of glass from x0 (w0 wide) to x1 (w1 wide).
  g.beginPath();
  g.moveTo(x0, -w0);
  g.lineTo(x1, -w1);
  g.quadraticCurveTo(x1 + S * 0.03, 0, x1, w1);
  g.lineTo(x0, w0);
  g.quadraticCurveTo(x0 - S * 0.02, 0, x0, -w0);
  g.closePath();
  const sky = g.createLinearGradient(x0, -w0, x1, w1);
  sky.addColorStop(0, '#cfeaff');
  sky.addColorStop(1, '#7fb6e6');
  g.fillStyle = sky;
  g.fill();
}

function drawCarTop(hl, hw, paint, trim, hero) {
  // Racing stripes for your car.
  if (hero) {
    g.fillStyle = 'rgba(255, 255, 255, 0.92)';
    g.fillRect(-hl + S * 0.06, -S * 0.11, 2 * hl - S * 0.12, S * 0.07);
    g.fillRect(-hl + S * 0.06, S * 0.04, 2 * hl - S * 0.12, S * 0.07);
  }
  // Roof.
  g.fillStyle = mixHex(paint, 0.16);
  rr(-S * 0.4, -hw + S * 0.09, S * 0.62, 2 * hw - S * 0.18, S * 0.14);
  g.fill();
  if (hero) {
    g.fillStyle = 'rgba(255, 255, 255, 0.92)';
    g.fillRect(-S * 0.4, -S * 0.11, S * 0.62, S * 0.07);
    g.fillRect(-S * 0.4, S * 0.04, S * 0.62, S * 0.07);
    // A star on the roof.
    g.save();
    g.translate(-S * 0.09, 0);
    g.fillStyle = '#ffd23f';
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k * Math.PI) / 5 - Math.PI / 2, r = k % 2 ? S * 0.07 : S * 0.16;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
    g.restore();
  }
  // Windscreen and back window.
  glass(S * 0.24, S * 0.5, hw - S * 0.11, hw - S * 0.15);
  glass(-S * 0.62, -S * 0.42, hw - S * 0.15, hw - S * 0.11);
  // Wing mirrors.
  g.fillStyle = trim;
  rr(S * 0.2, -hw - S * 0.06, S * 0.1, S * 0.08, S * 0.03);
  g.fill();
  rr(S * 0.2, hw - S * 0.02, S * 0.1, S * 0.08, S * 0.03);
  g.fill();
  // A shine along the bonnet.
  g.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  g.lineWidth = S * 0.035;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(S * 0.58, -hw + S * 0.12);
  g.lineTo(hl - S * 0.16, -hw + S * 0.12);
  g.stroke();
}

function drawTruckTop(hl, hw, paint, trim) {
  // The load at the back: a pale box with ribs across it.
  const bx0 = -hl + S * 0.05, bx1 = hl - S * 0.78;
  g.fillStyle = trim;
  rr(bx0 - S * 0.02, -hw - S * 0.02, bx1 - bx0 + S * 0.04, 2 * hw + S * 0.04, S * 0.12);
  g.fill();
  const box = g.createLinearGradient(0, -hw, 0, hw);
  box.addColorStop(0, '#ffffff');
  box.addColorStop(1, mixHex(paint, 0.62));
  g.fillStyle = box;
  rr(bx0 + S * 0.03, -hw + S * 0.03, bx1 - bx0 - S * 0.06, 2 * hw - S * 0.06, S * 0.09);
  g.fill();
  g.strokeStyle = mixHex(paint, 0.35);
  g.lineWidth = Math.max(1, S * 0.03);
  g.beginPath();
  for (let x = bx0 + S * 0.24; x < bx1 - S * 0.1; x += S * 0.24) {
    g.moveTo(x, -hw + S * 0.08);
    g.lineTo(x, hw - S * 0.08);
  }
  g.stroke();
  // A band of the truck's colour along the load.
  g.fillStyle = paint;
  g.fillRect(bx0 + S * 0.03, -S * 0.07, bx1 - bx0 - S * 0.06, S * 0.14);
  // The cab at the front.
  const cx0 = bx1 + S * 0.06;
  g.fillStyle = mixHex(paint, 0.14);
  rr(cx0, -hw + S * 0.07, hl - cx0 - S * 0.3, 2 * hw - S * 0.14, S * 0.12);
  g.fill();
  glass(hl - S * 0.34, hl - S * 0.12, hw - S * 0.1, hw - S * 0.14);
  g.fillStyle = trim;
  rr(cx0 + S * 0.12, -hw - S * 0.06, S * 0.1, S * 0.08, S * 0.03);
  g.fill();
  rr(cx0 + S * 0.12, hw - S * 0.02, S * 0.1, S * 0.08, S * 0.03);
  g.fill();
}

function drawSpeedLines(k) {
  const b = boxOf(0, shown[0]);
  g.save();
  g.strokeStyle = `rgba(255, 255, 255, ${0.75 * (1 - k * 0.6)})`;
  g.lineCap = 'round';
  g.lineWidth = Math.max(2, S * 0.06);
  const len = S * (0.6 + 2.4 * k);
  g.beginPath();
  for (const f of [0.22, 0.5, 0.78]) {
    const y = b.y + b.h * f, x = b.x - S * 0.12 - (f === 0.5 ? S * 0.25 : 0);
    g.moveTo(x, y);
    g.lineTo(x - len, y);
  }
  g.stroke();
  g.restore();
}

function drawHint(now) {
  const { i, to, at } = hintShow;
  const t = now - at;
  const pulse = 0.55 + 0.45 * Math.sin(t / 160);
  const a = boxOf(i, shown[i]), b = boxOf(i, to);
  // A dashed outline where it should go...
  g.save();
  g.setLineDash([S * 0.14, S * 0.1]);
  g.lineDashOffset = -t / 30;
  g.strokeStyle = `rgba(255, 56, 150, ${0.55 + 0.35 * pulse})`;
  g.lineWidth = Math.max(2, S * 0.06);
  rr(b.x + S * 0.08, b.y + S * 0.08, b.w - S * 0.16, b.h - S * 0.16, S * 0.18);
  g.stroke();
  g.restore();
  // ...a glow round the vehicle...
  g.strokeStyle = `rgba(255, 56, 150, ${0.35 + 0.5 * pulse})`;
  g.lineWidth = Math.max(3, S * 0.1);
  rr(a.x + S * 0.03, a.y + S * 0.03, a.w - S * 0.06, a.h - S * 0.06, S * 0.22);
  g.stroke();
  // ...and an arrow from one to the other.
  const v = puzzle.vehicles[i];
  const dir = Math.sign(to - shown[i]);
  if (!dir) return;
  const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
  const bob = Math.sin(t / 140) * S * 0.06;
  g.save();
  g.translate(v.h ? (ax + bx) / 2 + bob * dir : ax, v.h ? ay : (ay + by) / 2 + bob * dir);
  g.rotate(v.h ? (dir > 0 ? 0 : Math.PI) : dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  g.fillStyle = '#ff3896';
  g.strokeStyle = '#fff';
  g.lineWidth = Math.max(2, S * 0.04);
  g.beginPath();
  const r = S * 0.24;
  g.moveTo(r, 0);
  g.lineTo(-r * 0.2, -r * 0.85);
  g.lineTo(-r * 0.2, -r * 0.38);
  g.lineTo(-r, -r * 0.38);
  g.lineTo(-r, r * 0.38);
  g.lineTo(-r * 0.2, r * 0.38);
  g.lineTo(-r * 0.2, r * 0.85);
  g.closePath();
  g.stroke();
  g.fill();
  g.restore();
}

// ---- cards ------------------------------------------------------------------------------

// Little pictures for the how-to-play card.
const ART_CAR = (x, y, w, h, color, hero = false) => {
  const across = w > h;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) * 0.28}" fill="${color}"/>`;
  s += across
    ? `<rect x="${x + w * 0.56}" y="${y + h * 0.18}" width="${w * 0.14}" height="${h * 0.64}" rx="2" fill="#bfe2ff"/>`
    : `<rect x="${x + w * 0.18}" y="${y + h * 0.56}" width="${w * 0.64}" height="${h * 0.14}" rx="2" fill="#bfe2ff"/>`;
  if (hero) s += `<rect x="${x + 3}" y="${y + h / 2 - 1.6}" width="${w - 6}" height="3.2" fill="#fff"/>`;
  return s;
};
const ART_LOT = (inner) => `<svg viewBox="0 0 64 48"><rect x="2" y="2" width="60" height="44" rx="7" fill="#5d6579"/>${inner}</svg>`;

function showRules() {
  ui.show(`<h2>How to play</h2>
    <div class="rules">
      <div class="rule">${ART_LOT(`${ART_CAR(10, 17, 30, 14, '#3f7cf0')}<path d="M45 24h10m-3-4 4 4-4 4M8 24H4" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)}
        <div><b>Drag to drive</b><span>Cars and trucks go forwards and backwards along their length. They can't turn.</span></div></div>
      <div class="rule">${ART_LOT(`${ART_CAR(8, 17, 28, 14, '#ef3b3b', true)}<rect x="56" y="15" width="8" height="18" fill="#5d6579"/><path d="M42 18l6 6-6 6M50 18l6 6-6 6" stroke="#ffd240" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)}
        <div><b>Get the red car out</b><span>Clear a way, then drive it out through the gap on the right.</span></div></div>
      <div class="rule"><svg viewBox="0 0 64 48"><g fill="#ffc531" stroke="#d68f00" stroke-width="1.5" stroke-linejoin="round">${[12, 32, 52].map((x) => `<path transform="translate(${x - 9} ${x === 32 ? 9 : 14}) scale(.75)" d="M12 2.6l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.2l-5.72 3 1.1-6.37-4.63-4.5 6.4-.93z"/>`).join('')}</g></svg>
        <div><b>Fewest moves, three stars</b><span>One move is one vehicle driven any distance. Finish in the fewest possible (shown up top) for 3 stars.</span></div></div>
      <div class="rule">${ART_LOT(`${ART_CAR(18, 9, 14, 30, '#2fbf71')}<rect x="15" y="6" width="20" height="36" rx="6" fill="none" stroke="#ff3896" stroke-width="2.6"/>`)}
        <div><b>Stuck?</b><span>Hint shows the best next move (tap it again to make it). Undo as much as you like.</span></div></div>
    </div>
    <div class="actions"><button class="btn btn-primary" data-action="close">Got it</button></div>`);
}

function intro() {
  if (!save.seen.rules) {
    save.seen.rules = true;
    writeSave();
    showRules();
  }
}

const runStars = (m) => Object.values(save.runs[m].best).reduce((s, v) => s + v, 0);

function showSettings() {
  const shownMode = loadingMode || mode;
  const tab = (m) => `<button class="seg-btn${m === shownMode ? ' on' : ''}" data-action="mode" data-mode="${m}">${MODE_NAME[m]}</button>`;
  const run = save.runs[shownMode];
  const [lo, hi] = RANGES[shownMode];
  ui.show(`<h2>Settings</h2>
    <div class="seg">${MODES.map(tab).join('')}</div>
    <p class="seg-note tip">${shownMode === 'expert' ? `${lo} or more moves` : `${lo} to ${hi} moves`} · ${run.solved} solved · ★ ${runStars(shownMode)}</p>
    ${switchRow('Sound', 'sound')}
    ${switchRow('Haptics', 'haptics')}
    <div class="row">Puzzle <span class="stepper"><button class="btn btn-soft" data-action="num-down" aria-label="Previous">−</button>
      <input id="numInput" type="number" inputmode="numeric" min="1" value="${puzzle && puzzle.mode === shownMode ? puzzle.n : run.play ? run.play.n : run.n}">
      <button class="btn btn-soft" data-action="num-up" aria-label="Next">+</button></span></div>
    <div class="actions">
      <button class="btn btn-primary" data-action="go">Play this puzzle</button>
      <button class="btn btn-soft" data-action="restart">Start this one again</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
      <button class="btn btn-soft" data-action="close">Close</button>
    </div>`);
}

// Pick up another mode's run where it was left. The puzzle on screen stays
// (and stays saved as its own mode's) until the new one has arrived.
function switchMode(m) {
  if (!MODES.includes(m) || m === (loadingMode || mode)) return;
  if (puzzle) savePlay();
  if (m === mode && puzzle && puzzle.mode === m) { cancelLoad(); ui.close(); return; }
  const run = save.runs[m];
  startPuzzle(run.play ? run.play.n : run.n, true, m);
}

const ui = cards({
  next: () => startPuzzle(puzzle.n + 1),
  retry: () => restart(),
  restart: () => { if (loadingMode) ui.close(); else restart(); },
  rules: showRules,
  mode: (el) => switchMode(el.dataset.mode),
  'num-down': () => { const i = $('numInput'); i.value = Math.max(1, (+i.value || 1) - 1); },
  'num-up': () => { const i = $('numInput'); i.value = (+i.value || 0) + 1; },
  go: () => startPuzzle(+$('numInput').value || 1, true, loadingMode || mode),
});

$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });
$('undoBtn').addEventListener('click', undo);
$('restartBtn').addEventListener('click', () => {
  if (finished || !puzzle) return;
  sfx('tap');
  if (!moves.length) return;
  ui.show(`<h2>Start again?</h2><p>Every vehicle goes back to where it started.</p>
    <div class="actions"><button class="btn btn-primary" data-action="restart">Restart puzzle</button>
    <button class="btn btn-soft" data-action="close">Keep going</button></div>`);
});
$('hintBtn').addEventListener('click', hint);
window.addEventListener('keydown', (e) => {
  if (ui.isOpen() || !puzzle) return;
  if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'u') undo();
  else if (e.key === 'h') hint();
});

// ---- start ------------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', layout);
document.addEventListener('visibilitychange', () => { if (document.hidden) savePlay(); });

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.carPark = {
    startPuzzle, hint, undo, restart, switchMode,
    // Drive vehicle i to p, as if it had been dragged there.
    move(i, p) { if (finished || !canMove(puzzle, pos, i, p)) return false; slideTo(i, p, true); return drive(i, p); },
    // Play the rest of the puzzle out, one best move at a time.
    async solve(ms = 250) {
      for (let plan = solveFrom(puzzle, pos); plan && plan.length && !finished; plan = solveFrom(puzzle, pos)) {
        this.move(...plan[0]);
        await new Promise((r) => setTimeout(r, ms));
      }
    },
    get puzzle() { return puzzle; }, get pos() { return pos.slice(); }, get moves() { return moves.length; },
    get finished() { return finished; }, get hints() { return hints; }, get view() { return { ox, oy, S }; },
    get shown() { return shown.slice(); }, get loading() { return loadingMode; },
  };
}

const params = new URLSearchParams(location.search);
if (MODES.includes(params.get('mode'))) mode = params.get('mode');
if (location.search) window.history.replaceState(null, '', location.pathname);
layout();
const asked = Number(params.get('n'));
if (asked > 0) startPuzzle(asked, true);
else {
  const run = save.runs[mode];
  startPuzzle(run.play ? run.play.n : run.n, true);
}
