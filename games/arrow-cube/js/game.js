// Arrow Cube: the game screen. Wires the board, renderer and controls together.

import { buildShape } from './topology.js';
import { Board, TWO_WAY } from './rules.js';
import { BIG_TIERS, INTRO, MODES, generateLevel, tierOf, versionOf } from './generator.js';
import { Renderer } from './render.js';
import { store, settings, saveSettings, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
let renderer;
try {
  renderer = new Renderer(canvas);
} catch (err) {
  $('loading').classList.remove('hide');
  $('loading').textContent = 'Sorry, this browser can’t show the 3D cube (WebGL is turned off).';
  throw err;
}
const SAVE_KEY = 'arrowcube';
const MODE_NAME = { levels: 'Level', hard: 'Hard', super: 'Super', huge: 'Huge' };
const TIER_TAG = { hard: 'HARD', super: 'SUPER HARD', mega: 'MEGA HARD', giga: 'GIGA HARD' };
const TIER_THEMES = ['hard', 'super', 'mega', 'giga', 'huge']; // each has its own colours (body.tier-*)
// Huge puzzles are for chipping away at: no stars to lose, just progress.
const relaxed = () => level && level.mode === 'huge';

// One run of progress per mode: the number you're up to, your best stars,
// and the puzzle you're in the middle of.
const save = (() => {
  const s = store.get(SAVE_KEY, {}) || {};
  const out = { mode: MODES.includes(s.mode) ? s.mode : 'levels', seen: s.seen || {}, runs: s.runs || {} };
  // Saves from before there were modes kept a single run at the top level.
  if (!s.runs && s.level) out.runs.levels = { n: s.level, best: s.best || {}, play: s.play || null };
  for (const m of MODES) out.runs[m] = Object.assign({ n: 1, best: {}, play: null }, out.runs[m]);
  return out;
})();
const writeSave = () => store.set(SAVE_KEY, save);

let mode = save.mode;
let level = null;
let board = null;
let stars = 3;
let practice = false; // kept going after running out of stars
let finished = false;

// ---- levels (built in a worker so the screen never freezes) -------------

const levels = new Map();
const waiting = new Map();
let worker = null;
let workerBroken = false;

const keyOf = (m, n) => `${m}:${n}`;

function remember(k, lv) {
  levels.set(k, lv);
  while (levels.size > 6) levels.delete(levels.keys().next().value);
}

// The giant puzzles take seconds to build, so the ones in play (and the one
// up next) are kept on the device instead of being rebuilt every time the
// game opens.
const BIG_CACHE = 'arrowcube-big';

function cachedLevel(m, n) {
  const lv = (store.get(BIG_CACHE, null) || {})[keyOf(m, n)];
  return lv && lv.v === versionOf(tierOf(n, m)) ? lv : null;
}

function cacheLevel(lv) {
  const c = store.get(BIG_CACHE, null) || {}, k = keyOf(lv.mode, lv.n);
  c[k] = lv;
  const keep = new Set([k]);
  for (const m of MODES) {
    const r = save.runs[m], at = r.play ? r.play.n : r.n;
    for (const x of [at, at + 1, r.n]) keep.add(keyOf(m, x));
  }
  for (const old of Object.keys(c)) if (!keep.has(old)) delete c[old];
  // Short on space: keep just this one.
  if (!store.set(BIG_CACHE, c)) store.set(BIG_CACHE, { [k]: lv });
}

function uncacheLevel(lv) {
  const c = store.get(BIG_CACHE, null), k = keyOf(lv.mode, lv.n);
  if (c && c[k]) {
    delete c[k];
    store.set(BIG_CACHE, c);
  }
}

function deliver(m, n, lv) {
  if (!lv) return buildHere(m, n);
  const k = keyOf(m, n);
  remember(k, lv);
  if (BIG_TIERS.has(lv.tier)) cacheLevel(lv);
  const list = waiting.get(k) || [];
  waiting.delete(k);
  list.forEach((resolve) => resolve(lv));
}

function buildHere(m, n) {
  setTimeout(() => deliver(m, n, generateLevel(n, m)), 20);
}

// The worker that builds levels, started the first time one is needed.
// Null if this browser can't run it.
function builder() {
  if (!worker && !workerBroken) {
    try {
      worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => deliver(e.data.mode, e.data.n, e.data.level);
      worker.onerror = () => {
        workerBroken = true;
        worker = null;
        for (const w of waiting.keys()) {
          const [wm, wn] = w.split(':');
          buildHere(wm, Number(wn));
        }
      };
    } catch {
      workerBroken = true;
    }
  }
  return worker;
}

function getLevel(n, m = mode) {
  const k = keyOf(m, n);
  if (levels.has(k)) return Promise.resolve(levels.get(k));
  const kept = BIG_TIERS.has(tierOf(n, m)) && cachedLevel(m, n);
  if (kept) {
    remember(k, kept);
    return Promise.resolve(kept);
  }
  return new Promise((resolve) => {
    if (waiting.has(k)) return waiting.get(k).push(resolve);
    waiting.set(k, [resolve]);
    if (builder()) worker.postMessage({ n, mode: m });
    else buildHere(m, n);
  });
}

// Get a level ready before it's needed. Without the worker it would be built
// on the main thread: fine for small levels, but the giant ones take seconds
// and would freeze the game mid-play.
function prefetch(n, m) {
  const k = keyOf(m, n);
  if (levels.has(k) || waiting.has(k) || (!builder() && BIG_TIERS.has(tierOf(n, m)))) return;
  getLevel(n, m);
}

let loadToken = 0;
let loading = false;

async function startLevel(n, resume = false) {
  n = Math.max(1, Math.floor(n) || 1);
  closeCard();
  const token = ++loadToken;
  loading = true;
  const tier = tierOf(n, mode);
  $('loadingText').textContent = mode === 'huge' ? 'Building a huge puzzle… thousands of arrows can take a few seconds'
    : BIG_TIERS.has(tier) ? `Building a ${tier} hard level…` : 'Building level…';
  const slow = setTimeout(() => {
    if (token !== loadToken) return;
    // Taking a while (a giant puzzle): say which one is on its way.
    $('levelLabel').textContent = `${MODE_NAME[mode].toUpperCase()} ${n}`;
    $('tierTag').textContent = mode === 'levels' ? TIER_TAG[tier] || '' : '';
    for (const t of TIER_THEMES) document.body.classList.toggle(`tier-${t}`, tier === t);
    $('stars').hidden = $('progress').hidden = true;
    $('counter').style.visibility = 'hidden';
    $('loading').classList.remove('hide');
  }, 150);
  const lv = await getLevel(n);
  if (token !== loadToken) return; // another level was picked meanwhile
  clearTimeout(slow);
  $('loading').classList.add('hide');
  loading = false;
  finished = false;

  level = lv;
  board = new Board(buildShape(lv.shape), lv);
  stars = 3;
  practice = false;
  const p = save.runs[lv.mode].play;
  let view = null;
  if (resume && p && p.n === n && p.v === lv.v) {
    let ok = true;
    for (const [pid, opt] of p.moves) {
      const r = board.pieces[pid] ? board.tryMove(pid, opt) : null;
      if (!r || !r.ok) { ok = false; break; }
      board.apply(pid, opt, r);
    }
    if (ok) {
      stars = p.stars ?? 3;
      practice = !!p.practice;
      view = p.view || null;
    } else {
      board = new Board(board.topo, lv);
    }
  }
  renderer.setBoard(board);
  // Pick up a big puzzle looking at the same spot as last time.
  if (view) {
    renderer.q = view.q;
    renderer.zoom = view.zoom;
    renderer.pan = view.pan;
  }
  for (const t of TIER_THEMES) document.body.classList.toggle(`tier-${t}`, lv.tier === t);
  updateHud();
  savePlay();
  requestDraw();
  // The next one is built while you play. (A Huge puzzle waits until you're
  // nearly done, so it doesn't sit in memory for days.)
  if (lv.mode !== 'huge') setTimeout(() => prefetch(n + 1, lv.mode), 600);
  showTutorial(n);
}

function savePlay() {
  if (!level) return;
  save.runs[level.mode].play = finished ? null : {
    n: level.n, v: level.v, moves: board.history.map((h) => [h.pid, h.opt]), stars, practice,
    view: { q: renderer.q, zoom: renderer.zoom, pan: renderer.pan },
  };
  writeSave();
}

// Pick up a mode's run where it was left. (If that puzzle has been rebuilt
// by a newer version of the game since, it starts over.)
function switchMode(m) {
  if (!MODES.includes(m)) return;
  if (level) savePlay();
  mode = m;
  save.mode = m;
  writeSave();
  const r = save.runs[m];
  startLevel(r.play ? r.play.n : r.n, true);
}

// ---- heads-up display ----------------------------------------------------

const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.2l-5.72 3 1.1-6.37-4.63-4.5 6.4-.93z"/></svg>';
$('stars').innerHTML = STAR.repeat(3);

function updateHud() {
  $('levelLabel').textContent = `${MODE_NAME[level.mode].toUpperCase()} ${level.n}`;
  $('tierTag').textContent = level.mode === 'levels' ? TIER_TAG[level.tier] || '' : '';
  $('count').textContent = board.remaining.toLocaleString();
  $('counter').style.visibility = '';
  [...$('stars').children].forEach((el, i) => el.classList.toggle('on', i < stars));
  // Huge puzzles show how much is done instead of stars.
  $('stars').hidden = relaxed();
  $('progress').hidden = !relaxed();
  const total = board.pieces.length, pct = Math.floor((100 * (total - board.remaining)) / Math.max(1, total));
  $('progressFill').style.width = `${pct}%`;
  $('progressText').textContent = `${pct}%`;
  $('undoBtn').disabled = board.history.length === 0 || finished;
}

let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ---- drawing loop ----------------------------------------------------------

let raf = 0;
let spin = null; // the shape keeps turning a little after a flick

function requestDraw() {
  if (!raf) raf = requestAnimationFrame(loop);
}

function loop(now) {
  raf = 0;
  let spinning = false;
  if (spin) {
    const dt = Math.min(40, now - spin.last);
    spin.last = now;
    renderer.rotateBy(spin.vx * dt, spin.vy * dt);
    const decay = Math.exp(-dt / 280);
    spin.vx *= decay;
    spin.vy *= decay;
    if (Math.hypot(spin.vx, spin.vy) < 0.015) spin = null;
    spinning = true;
  }
  if (renderer.frame(now) || spinning) requestDraw();
}

function layout() {
  const w = window.innerWidth, h = window.innerHeight;
  const top = $('counter').getBoundingClientRect().bottom + 4;
  const bottom = h - $('tools').getBoundingClientRect().top + 8;
  renderer.resize(w, h, Math.min(window.devicePixelRatio || 1, 3), { top, bottom });
  requestDraw();
}

// ---- touch & mouse ---------------------------------------------------------

const pointers = new Map();
let gesture = null;
const recent = [];
let lastEmptyTap = { t: 0, x: 0, y: 0 };

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported */ }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now() });
  spin = null;
  if (pointers.size === 1) {
    gesture = { mode: 'tap' };
    recent.length = 0;
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    gesture = { mode: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  } else {
    gesture = { mode: 'none' };
  }
});

canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p || !gesture) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (gesture.mode === 'tap') {
    if (Math.hypot(p.x - p.x0, p.y - p.y0) < 9) return;
    gesture.mode = 'rotate';
  }
  if (gesture.mode === 'rotate') {
    renderer.rotateBy(dx, dy);
    recent.push([performance.now(), dx, dy]);
    if (recent.length > 8) recent.shift();
    requestDraw();
  } else if (gesture.mode === 'pinch' && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    renderer.panBy(mx - gesture.mx, my - gesture.my);
    if (gesture.dist > 0) renderer.zoomAt(dist / gesture.dist, mx, my);
    Object.assign(gesture, { dist, mx, my });
    requestDraw();
  }
});

function endPointer(e, cancelled) {
  const p = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  if (!gesture || !p) return;
  if (!cancelled && gesture.mode === 'tap' && pointers.size === 0 && performance.now() - p.t0 < 650) {
    onTap(e.clientX, e.clientY);
  }
  if (gesture.mode === 'rotate' && pointers.size === 0) flick();
  gesture = pointers.size === 0 ? null : { mode: 'none' };
}
canvas.addEventListener('pointerup', (e) => endPointer(e, false));
canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  renderer.zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  requestDraw();
}, { passive: false });

function flick() {
  const now = performance.now();
  const r = recent.filter((v) => now - v[0] < 90);
  if (r.length < 2) return;
  const dt = Math.max(16, now - r[0][0]);
  const vx = r.reduce((s, v) => s + v[1], 0) / dt, vy = r.reduce((s, v) => s + v[2], 0) / dt;
  if (Math.hypot(vx, vy) < 0.25) return;
  spin = { vx, vy, last: now };
  requestDraw();
}

window.addEventListener('keydown', (e) => {
  if (cardOpen()) {
    if (e.key === 'Escape' && $('card').querySelector('[data-action="close"]')) closeCard();
    return;
  }
  const turn = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] }[e.key];
  if (turn) renderer.rotateBy(turn[0], turn[1]);
  else if (e.key === '+' || e.key === '=') renderer.zoomAt(1.2, innerWidth / 2, innerHeight / 2);
  else if (e.key === '-') renderer.zoomAt(1 / 1.2, innerWidth / 2, innerHeight / 2);
  else if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'u') undo();
  else if (e.key === 'h') hint();
  else return;
  e.preventDefault();
  requestDraw();
});

// ---- playing ---------------------------------------------------------------

function onTap(x, y) {
  if (!board || finished || loading || cardOpen()) return;
  const hit = renderer.pick(x, y);
  if (!hit) {
    const now = performance.now();
    if (now - lastEmptyTap.t < 330 && Math.hypot(x - lastEmptyTap.x, y - lastEmptyTap.y) < 40) {
      renderer.resetView();
      lastEmptyTap.t = 0;
      requestDraw();
    } else {
      lastEmptyTap = { t: now, x, y };
    }
    return;
  }
  const piece = board.pieces[hit.pid];
  // Two-way arrows leave from whichever end you tapped nearer.
  const opt = piece.kind === TWO_WAY && hit.along < hit.len / 2 ? 1 : 0;
  const res = board.tryMove(hit.pid, opt, true);
  renderer.setHint(-1);
  if (res.ok) {
    board.apply(hit.pid, opt, res);
    renderer.addMover(hit.pid, opt, res, false);
    renderer.refresh();
    sfx('whoosh');
    if (res.flips) setTimeout(() => sfx('flip'), 140);
    haptic();
    if (board.remaining === 0) {
      finished = true;
      setTimeout(levelComplete, 750);
    } else if (board.purples.length && !freeMoves().length) {
      // Can't happen with generated levels (they're checked for dead ends),
      // but never leave a player staring at a stuck board. Only purple
      // markers could ever do it: otherwise clearing an arrow just opens
      // things up, so skipping the check keeps taps instant on giant puzzles.
      setTimeout(showStuck, 700);
    }
    if (level.mode === 'huge' && board.remaining < board.pieces.length * 0.15) prefetch(level.n + 1, 'huge');
    updateHud();
    savePlay();
  } else {
    renderer.addMover(hit.pid, opt, res, true);
    if (res.by >= 0) renderer.flashPiece(res.by);
    sfx('bump');
    haptic();
    loseStar();
  }
  requestDraw();
}

function loseStar() {
  if (practice || stars === 0 || relaxed()) return;
  stars--;
  const el = $('stars').children[stars];
  el.classList.remove('star-lost');
  void el.getBoundingClientRect();
  el.classList.add('star-lost');
  setTimeout(() => sfx('star'), 160);
  updateHud();
  savePlay();
  if (stars === 0) setTimeout(showOutOfStars, 650);
}

const endColor = (piece, opt) => ((opt === 0) === !!piece.green ? 'green' : 'yellow');

// Every arrow that could leave right now. Levels are checked so that no order
// of taps can get you stuck, so any of these is a safe hint.
function freeMoves() {
  const out = [];
  for (let pid = 0; pid < board.pieces.length; pid++) {
    if (!board.present[pid]) continue;
    board.pieces[pid].options.forEach((o, opt) => { if (board.tryMove(pid, opt).ok) out.push({ pid, opt }); });
  }
  return out;
}

function hint() {
  if (!board || finished || cardOpen()) return;
  const moves = freeMoves();
  if (!moves.length) {
    toast('No arrow can get out right now. Try Undo.');
    return;
  }
  // Prefer an arrow in plain sight on screen. Otherwise take the one nearest
  // to where you're looking, and turn the camera to show it.
  const f = renderer.focus();
  let pick = null, seen = -1, near = Infinity;
  for (const m of moves) {
    const v = renderer.visibility(m.pid) >= 0.6 ? 1 : 0;
    const p = renderer.cellPos(board.pieces[m.pid].options[m.opt][0].cells.at(-1));
    const d = Math.hypot(p[0] - f[0], p[1] - f[1], p[2] - f[2]);
    if (v > seen || (v === seen && d < near)) { pick = m; seen = v; near = d; }
  }
  const piece = board.pieces[pick.pid];
  renderer.setHint(pick.pid);
  if (!seen) renderer.showCell(piece.options[pick.opt][0].cells.at(-1));
  if (piece.kind === TWO_WAY) toast(`Tap the ${endColor(piece, pick.opt)} end of the glowing arrow`);
  sfx('hint');
  requestDraw();
}

function undo() {
  if (!board || finished || !board.history.length) return;
  const h = board.undo();
  renderer.movers = renderer.movers.filter((m) => m.pid !== h.pid);
  renderer.hidden.delete(h.pid);
  renderer.syncAngles();
  renderer.setHint(-1);
  renderer.refresh();
  sfx('tap');
  updateHud();
  savePlay();
  requestDraw();
}

function restart() {
  closeCard();
  if (!level) return;
  board = new Board(board.topo, level);
  stars = 3;
  practice = false;
  finished = false;
  renderer.setBoard(board);
  updateHud();
  savePlay();
  requestDraw();
}

function levelComplete() {
  const n = level.n;
  const earned = practice ? 0 : stars;
  const r = save.runs[level.mode];
  r.best[n] = Math.max(r.best[n] || 0, earned);
  r.n = Math.max(r.n, n + 1);
  r.play = null;
  writeSave();
  if (BIG_TIERS.has(level.tier)) uncacheLevel(level);
  updateHud();
  renderer.vanish();
  requestDraw();
  sfx('win');
  haptic();
  confetti();
  if (relaxed()) {
    showCard(`<h2>Huge ${n} cleared!</h2><p>All ${board.pieces.length.toLocaleString()} arrows, gone. That took some chipping away.</p>
      <div class="actions"><button class="btn btn-primary" data-action="next">Start the next huge one</button></div>`);
    return;
  }
  const big = [0, 1, 2].map((i) => STAR.replace('<svg', `<svg class="${i < earned ? 'on' : ''}"`)).join('');
  const line = earned === 3 ? 'Perfect. Not a single bump!' : earned ? 'Nice work.' : 'Cleared in practice mode.';
  const special = { super: 'Super hard level', mega: 'Mega hard level', giga: 'Giga hard level' }[level.tier];
  const name = level.mode === 'levels' && special ? special : MODE_NAME[level.mode];
  showCard(`<h2>${name} ${n} cleared!</h2><div class="big-stars">${big}</div><p>${line}</p>
    <div class="actions"><button class="btn btn-primary" data-action="next">Next level</button></div>`);
}

function showOutOfStars() {
  showCard(`<h2>Out of stars</h2><p>Every bump costs a star. Start over to earn them back, or keep going just for practice.</p>
    <div class="actions"><button class="btn btn-primary" data-action="restart">Try again</button>
    <button class="btn btn-soft" data-action="keep">Keep going</button></div>`);
}

function showStuck() {
  showCard(`<h2>Stuck!</h2><p>The arrows left can't all get out from here. Undo a move or start the level over.</p>
    <div class="actions"><button class="btn btn-primary" data-action="undo">Undo last move</button>
    <button class="btn btn-soft" data-action="restart">Restart level</button></div>`);
}

// ---- how to play -------------------------------------------------------------

const INK = '#16181d';
const FACE = '<rect x="8" y="10" width="100" height="76" rx="7" fill="#e9f1fd" stroke="#c9d8f3" stroke-width="2"/>';
const ART = {
  basics: `${FACE}<path d="M28 64H56V38H82" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M80 28 96 38 80 48z" fill="${INK}"/><path d="M114 30h22M118 41h26M114 52h18" stroke="#9fb3da" stroke-width="4" stroke-linecap="round"/>`,
  blue: `${FACE}<path d="M20 66H52" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M50 57 64 66 50 75z" fill="${INK}"/>
    <path d="M78 72l8-8 8 8M78 82l8-8 8 8" fill="none" stroke="#10a5f5" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M86 52V18" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 9"/>`,
  two: `<defs><linearGradient id="gy" gradientUnits="userSpaceOnUse" x1="36" y1="48" x2="84" y2="48"><stop offset="0" stop-color="#22c55e"/><stop offset="1" stop-color="#facc15"/></linearGradient></defs>
    ${FACE}<path d="M36 48H84" stroke="url(#gy)" stroke-width="8" stroke-linecap="round"/>
    <path d="M22 48 38 37V59z" fill="#22c55e"/><path d="M98 48 82 37V59z" fill="#facc15"/>`,
  yellow: `<path d="M10 22 74 12V84L10 74z" fill="#e9f1fd" stroke="#c9d8f3" stroke-width="2"/><path d="M74 12 140 22V74L74 84z" fill="#dbe7fb" stroke="#c9d8f3" stroke-width="2"/>
    <path d="M74 12V84" stroke="#ffe840" stroke-width="9" stroke-linecap="round" opacity=".55"/><path d="M74 12V84" stroke="#fff59a" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M22 50H64" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M84 51H118" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 9"/>
    <path d="M118 43 130 51 118 59z" fill="${INK}" opacity=".35"/>`,
  purple: `${FACE}<path d="M18 66H48" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M46 57 60 66 46 75z" fill="${INK}"/>
    <path d="M74 70l8-9 8 9" fill="none" stroke="#9b4dff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="82" cy="76" r="3.6" fill="#9b4dff"/>
    <path d="M82 50V18" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 9"/>
    <path d="M118 36a14 14 0 1 1-1 26" fill="none" stroke="#9b4dff" stroke-width="4" stroke-linecap="round"/><path d="M110 58l8 4 0-9" fill="none" stroke="#9b4dff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  fork: `${FACE}<path d="M24 70H62V30M62 48H90" fill="none" stroke="#f97316" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M62 16 52 30H72z" fill="#f97316"/><path d="M104 48 90 38V58z" fill="#f97316"/>`,
  shapes: `<path d="M4 46 26 34 58 40 36 52z" fill="#ffffff" stroke="#c9d8f3" stroke-width="2"/><path d="M4 46 36 52V88L4 82z" fill="#eef3ff" stroke="#c9d8f3" stroke-width="2"/>
    <path d="M36 52 58 40V76L36 88z" fill="#dbe6fb" stroke="#c9d8f3" stroke-width="2"/>
    <path d="M90 46 112 34 144 40 122 52z" fill="#ffffff" stroke="#c9d8f3" stroke-width="2"/><path d="M90 46 122 52V88L90 82z" fill="#eef3ff" stroke="#c9d8f3" stroke-width="2"/>
    <path d="M122 52 144 40V76L122 88z" fill="#dbe6fb" stroke="#c9d8f3" stroke-width="2"/>
    <path d="M18 43 34 46" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M33 40 44 48 32 51z" fill="${INK}"/>
    <path d="M50 49 98 58" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 8"/>
    <path d="M110 41 106 51" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>`,
};
const RULES = {
  basics: ['How to play', 'Tap an arrow to send it sliding off the shape. Arrows can’t pass through each other, so clear the way first. Every bump costs a star.', 'Drag to spin · Pinch or scroll to zoom'],
  blue: ['Blue turners', 'A blue marker steers every arrow that slides over it.'],
  two: ['Two-way arrows', 'Green-and-yellow arrows have a head on each end. Tap near the end you want to lead.'],
  yellow: ['Yellow edges', 'At a glowing yellow edge, arrows don’t fly off. They slide around onto the next side and keep going.'],
  purple: ['Purple turners', 'A purple marker steers an arrow like a blue one, then flips around to face the other way.'],
  fork: ['Forked arrows', 'Orange arrows have two heads. Tap one and both heads leave at once, splitting it in two, so both ways out must be clear.'],
  shapes: ['Shapes', 'Arrows fly in a straight line on their own flat level, off edges and across gaps, so arrows on that same level elsewhere on the shape can be in the way. The shape blocks them too: an arrow aimed into a corner where a wall rises up can’t get out that way.'],
};
const art = (key, cls = 'tut-art') => `<svg class="${cls}" viewBox="0 0 150 96">${ART[key]}</svg>`;

function showTutorial(n) {
  if (level.mode === 'huge' && !save.seen.huge) {
    save.seen.huge = true;
    save.seen.rules = true;
    writeSave();
    showCard(`<h2>Huge puzzles</h2><p>These are meant for chipping away at, a few arrows at a time. Every move is saved, along with where you were looking, so come back whenever you like.</p>
      <p>No stars to lose here, and Hint always knows a way forward. Pinch to zoom way in.</p>
      <div class="actions"><button class="btn btn-primary" data-action="close">Let’s go</button><button class="btn btn-soft" data-action="rules">How to play</button></div>`);
    return;
  }
  // The hard runs use every piece from the start, so explain them all at once.
  if (level.mode !== 'levels') {
    if (save.seen.rules) return;
    save.seen.rules = true;
    writeSave();
    showRules();
    return;
  }
  let key = n === 1 ? 'basics' : Object.keys(INTRO).find((k) => INTRO[k] === n);
  // The first shape that isn't a plain box gets its own explanation.
  if (!key && level.shape.kind && !save.seen.shapes) key = 'shapes';
  if (!key || save.seen[key]) return;
  save.seen[key] = true;
  writeSave();
  const [title, text, tip] = RULES[key];
  showCard(`${art(key)}<h2>${title}</h2><p>${text}</p>${tip ? `<p class="tip">${tip}</p>` : ''}
    <div class="actions"><button class="btn btn-primary" data-action="close">Got it</button></div>`);
}

function showRules() {
  const list = Object.keys(RULES).map((k) => `<div class="rule">${art(k, '')}<div><b>${RULES[k][0]}</b><span>${RULES[k][1]}</span></div></div>`).join('');
  showCard(`<h2>How to play</h2><div class="rules">${list}</div><p class="tip">Drag to spin · Pinch to zoom · Double-tap empty space to recenter</p>
    <div class="actions"><button class="btn btn-primary" data-action="close">Got it</button></div>`);
}

function showSettings() {
  const tab = (m, label) => `<button class="seg-btn${m === mode ? ' on' : ''}" data-action="mode" data-mode="${m}">${label}</button>`;
  const r = save.runs[mode];
  showCard(`<h2>Settings</h2>
    <div class="seg">${tab('levels', 'Levels')}${tab('hard', 'Hard')}${tab('super', 'Super')}${tab('huge', 'Huge')}</div>
    <p class="seg-note">${{
      levels: 'Every 5th level is hard, every 10th super hard, every 50th mega hard and every 100th giga hard.',
      hard: 'Endless hard puzzles.',
      super: 'Endless super hard puzzles. Big and brutal.',
      huge: 'Enormous puzzles to chip away at. Progress saves after every move.',
    }[mode]}</p>
    <label class="row">Sound <input type="checkbox" class="toggle" data-setting="sound" ${settings.sound ? 'checked' : ''}></label>
    <label class="row">Haptics <input type="checkbox" class="toggle" data-setting="haptics" ${settings.haptics ? 'checked' : ''}></label>
    <div class="row">${MODE_NAME[mode]} <span class="stepper"><button class="btn btn-soft" data-action="lvl-down" aria-label="Previous">−</button>
      <input id="lvlInput" type="number" inputmode="numeric" min="1" value="${level && level.mode === mode ? level.n : r.n}">
      <button class="btn btn-soft" data-action="lvl-up" aria-label="Next">+</button></span></div>
    <div class="actions">
      <button class="btn btn-primary" data-action="go-level">Play this one</button>
      <button class="btn btn-soft" data-action="restart">Restart level</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
      <button class="btn btn-soft" data-action="close">Close</button>
    </div>`);
}

// ---- cards ---------------------------------------------------------------------

const cardOpen = () => !$('overlay').hidden;
function showCard(html) {
  $('card').innerHTML = html;
  $('overlay').hidden = false;
}
function closeCard() {
  $('overlay').hidden = true;
}

const actions = {
  close: closeCard,
  next: () => startLevel(level.n + 1),
  restart,
  keep: () => { practice = true; closeCard(); savePlay(); },
  undo: () => { closeCard(); undo(); },
  rules: showRules,
  'lvl-down': () => { const i = $('lvlInput'); i.value = Math.max(1, (+i.value || 1) - 1); },
  'lvl-up': () => { const i = $('lvlInput'); i.value = (+i.value || 0) + 1; },
  'go-level': () => startLevel(+$('lvlInput').value || 1),
  // Tapping a mode tab jumps straight into that mode's run.
  mode: (el) => (el.dataset.mode === mode ? null : switchMode(el.dataset.mode)),
};
$('card').addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (el) {
    sfx('tap');
    actions[el.dataset.action]?.(el);
  }
});
$('card').addEventListener('change', (e) => {
  const key = e.target.dataset.setting;
  if (!key) return;
  settings[key] = e.target.checked;
  saveSettings();
  if (key === 'haptics' && settings.haptics) haptic();
  if (key === 'sound') sfx('tap');
});
$('overlay').addEventListener('click', (e) => {
  if (e.target === $('overlay') && $('card').querySelector('[data-action="close"]')) closeCard();
});

$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });
$('hintBtn').addEventListener('click', hint);
$('undoBtn').addEventListener('click', undo);
$('viewBtn').addEventListener('click', () => { sfx('tap'); renderer.resetView(); requestDraw(); });

// ---- confetti --------------------------------------------------------------------

function confetti() {
  const c = $('confetti'), g = c.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
  c.width = W * dpr;
  c.height = H * dpr;
  const colors = ['#5463ee', '#ffd12e', '#22c55e', '#f2576d', '#9b4dff', '#10a5f5'];
  const bits = Array.from({ length: 120 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 90, y: H * 0.4,
    vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 12 - 4,
    r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, c: colors[(Math.random() * colors.length) | 0],
  }));
  const t0 = performance.now();
  const step = (now) => {
    const t = now - t0;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.globalAlpha = Math.max(0, 1 - t / 2400);
    for (const b of bits) {
      b.vy += 0.34; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.fillStyle = b.c;
      g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); g.restore();
    }
    if (t < 2400) requestAnimationFrame(step);
    else g.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(step);
}

// ---- start -----------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', layout);
document.addEventListener('visibilitychange', () => { if (document.hidden) savePlay(); });
layout();

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.arrowCube = { renderer, startLevel, hint, undo, requestDraw, get board() { return board; }, get stars() { return stars; } };
}

const params = new URLSearchParams(location.search);
if (MODES.includes(params.get('mode'))) {
  mode = params.get('mode');
  save.mode = mode;
  writeSave();
}
// The save remembers the mode from here on, so a reload doesn't undo a switch.
if (location.search) history.replaceState(null, '', location.pathname);
const asked = Number(params.get('level'));
if (asked > 0) startLevel(asked);
else switchMode(mode);
