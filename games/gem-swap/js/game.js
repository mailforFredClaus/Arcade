// Gem Swap: swap neighbouring gems to make lines of three or more, and hit
// every goal before the moves run out.
//
// The rules live in engine.js. A move changes the board there straight away
// and hands back a list of steps (clears, falls, shuffles) with timings;
// this file plays those steps back as animation, then carries on.

import { Board, mix, NONE, LINE_H, LINE_V, BOMB, FLY, PRISM, EMPTY, GEM, CRATE, COIN, T } from './engine.js';
import { bestMove } from './bot.js';
import { intros, GEN_VERSION, makeLevel } from './levels.js';
import * as art from './art.js';
import { store, settings, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, toast, confetti, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = ICON[el.dataset.icon];
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

const canvas = $('stage'), g = canvas.getContext('2d');
const fxCanvas = $('fx'), fg = fxCanvas.getContext('2d');
const TAU = Math.PI * 2;
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const easeOut = (t) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
const lerp = (a, b, t) => a + (b - a) * t;

// ---- saved progress -----------------------------------------------------------------

// n: the highest level you can play. best: stars per level. tries: how many
// times each level has been started (each go deals a different board).
// play: the level in progress and the moves made in it.
const SAVE_KEY = 'gemswap';
// streak: levels won in a row (each one starts the next with power-ups).
const save = Object.assign({ n: 1, best: {}, seen: {}, tries: {}, play: null, streak: 0 }, store.get(SAVE_KEY, {}) || {});
const writeSave = () => store.set(SAVE_KEY, save);
const totalStars = () => Object.values(save.best).reduce((s, v) => s + v, 0);

// ---- levels (built in a worker, kept on the phone) -------------------------------------

const LEVEL_KEY = 'gemswap-levels';
const levels = new Map();
const waiting = new Map();
let worker = null, workerBroken = false;

function keepLevel(lv) {
  const all = store.get(LEVEL_KEY, null) || {};
  all[lv.n] = lv;
  const want = new Set([lv.n, save.n, save.n + 1, save.play && save.play.n].filter(Boolean).map(String));
  for (const k of Object.keys(all)) if (!want.has(k)) delete all[k];
  if (!store.set(LEVEL_KEY, all)) store.set(LEVEL_KEY, { [lv.n]: lv });
}

function deliver(n, lv) {
  if (!lv) {
    const list = waiting.get(n) || [];
    waiting.delete(n);
    list.forEach((resolve) => resolve(null));
    return;
  }
  levels.set(n, lv);
  while (levels.size > 8) levels.delete(levels.keys().next().value);
  keepLevel(lv);
  const list = waiting.get(n) || [];
  waiting.delete(n);
  list.forEach((resolve) => resolve(lv));
}

function buildHere(n) {
  setTimeout(() => deliver(n, makeLevel(n)), 20);
}

function builder() {
  if (!worker && !workerBroken) {
    try {
      worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => deliver(e.data.n, e.data.level);
      worker.onerror = () => {
        workerBroken = true;
        worker = null;
        for (const n of waiting.keys()) buildHere(n);
      };
    } catch {
      workerBroken = true;
    }
  }
  return worker;
}

function getLevel(n) {
  if (levels.has(n)) return Promise.resolve(levels.get(n));
  const kept = (store.get(LEVEL_KEY, null) || {})[n];
  if (kept && kept.v === GEN_VERSION) {
    levels.set(n, kept);
    return Promise.resolve(kept);
  }
  return new Promise((resolve) => {
    if (waiting.has(n)) return waiting.get(n).push(resolve);
    waiting.set(n, [resolve]);
    if (builder()) worker.postMessage({ n });
    else buildHere(n);
  });
}

function prefetch(n) {
  if (levels.has(n) || waiting.has(n) || !builder()) return;
  getLevel(n);
}

// ---- the game ----------------------------------------------------------------------------

let level = null, board = null;
let attempt = 1;
let log = []; // this go's moves, for saving
let extra = 0; // times "+5 moves" was taken
let used = { hammer: 0, row: 0, shuffle: 0 }; // one of each per level
let state = 'loading'; // loading, ready, busy, won, lost
let armed = ''; // a booster waiting for a square: 'hammer' or 'row'
let selected = -1;
let celebrating = false;
let loadToken = 0;

const CODE = { tap: 't', hammer: 'h', row: 'r', shuffle: 's', extra: 'e', start: 'b' };
const TYPE = { t: 'tap', h: 'hammer', r: 'row', s: 'shuffle', e: 'extra', b: 'start' };
const enc = (m) => (m.type === 'swap' ? [m.a, m.b] : m.type === 'start' ? ['b', ...m.powers] : m.i === undefined ? [CODE[m.type]] : [CODE[m.type], m.i]);
const dec = (e) => (typeof e[0] === 'number' ? { type: 'swap', a: e[0], b: e[1] } : e[0] === 'b' ? { type: 'start', powers: e.slice(1) } : { type: TYPE[e[0]], i: e[1] });

// What a win streak starts the next level with.
const STREAK = [LINE_H, BOMB, PRISM];
const streakGift = () => STREAK.slice(0, Math.min(3, save.streak || 0));
let gift = []; // cells given power-ups at the start of this go

// Has a move been made in this go? (The streak's gift doesn't count.)
const played = () => log.some((e) => e[0] !== 'b');

// Giving up on a level (or needing extra moves) ends the streak.
function endStreak() {
  if (save.streak) {
    save.streak = 0;
    writeSave();
  }
}

async function startLevel(n, resume = false) {
  n = Math.max(1, Math.min(save.n, Math.floor(n) || 1));
  ui.close();
  const token = ++loadToken;
  state = 'loading';
  stopAnimation();
  hideHint();
  const slow = setTimeout(() => { if (token === loadToken) $('loading').classList.remove('hide'); }, 150);
  const lv = await getLevel(n);
  if (token !== loadToken) return;
  clearTimeout(slow);
  $('loading').classList.add('hide');
  if (!lv) {
    toast('Sorry, that level couldn’t be built.');
    return;
  }
  level = lv;
  const p = save.play;
  const again = resume && p && p.n === n && p.v === lv.v;
  attempt = again ? p.attempt : (save.tries[n] || 0) + 1;
  save.tries[n] = Math.max(save.tries[n] || 0, attempt);
  board = new Board(lv, mix(lv.seed, attempt));
  log = [];
  extra = 0;
  used = { hammer: 0, row: 0, shuffle: 0 };
  gift = [];
  if (again) {
    board.quiet = true;
    for (const e of p.moves) {
      const m = dec(e), steps = apply(m);
      if (!steps) break;
      if (m.type === 'start') gift = steps[0].cells;
    }
    board.quiet = false;
  } else if (streakGift().length) {
    const steps = board.play({ type: 'start', powers: streakGift() });
    log.push(enc({ type: 'start', powers: streakGift() }));
    gift = steps[0].cells;
  }
  selected = -1;
  armed = '';
  celebrating = false;
  for (const t of ['red', 'night']) document.body.classList.toggle(`theme-${t}`, (t === 'red' && lv.tier === 'hard') || (t === 'night' && lv.tier === 'super'));
  $('levelLabel').textContent = `LEVEL ${n}`;
  $('tierTag').textContent = lv.tier === 'hard' ? 'HARD' : lv.tier === 'super' ? 'SUPER HARD' : '';
  buildGoals();
  layout();
  syncFrom(board);
  updateHud();
  savePlay();
  state = 'ready';
  setTimeout(() => prefetch(n + 1), 900);
  if (board.won()) return win();
  if (board.moves <= 0) return outOfMoves();
  if (!played()) {
    dropIn();
    introCards();
  } else armHint();
  requestDraw();
}

// Replays a saved move (no animation): its steps, or null if it no longer fits.
function apply(m) {
  if (!m.type) return false;
  if (used[m.type] !== undefined) {
    if (used[m.type]) return false;
    used[m.type]++;
  }
  if (m.type === 'extra') extra++;
  const steps = board.play(m);
  if (!steps.length || (steps[0].t === 'swap' && !steps[0].ok)) return null;
  log.push(enc(m));
  return steps;
}

function savePlay() {
  if (!level) return;
  save.play = state === 'won' ? null : { n: level.n, v: level.v, attempt, moves: log };
  writeSave();
}

// Makes a move and plays it out.
function doMove(m) {
  if (state !== 'ready' && !(state === 'lost' && m.type === 'extra')) return false;
  if (used[m.type] !== undefined) {
    if (used[m.type]) return false;
    used[m.type]++;
  }
  const steps = board.play(m);
  if (!steps.length) {
    if (used[m.type] !== undefined) used[m.type]--;
    return false;
  }
  const ok = !(steps[0].t === 'swap' && !steps[0].ok);
  if (ok) {
    if (m.type === 'extra') extra++;
    log.push(enc(m));
    savePlay();
  }
  state = 'busy';
  selected = -1;
  hideHint();
  updateTools();
  if (ok && m.type === 'tap') {
    movesShown--;
    setMoves(movesShown);
    bump();
  }
  playSteps(steps, () => {
    state = 'ready';
    afterMove(ok);
  });
  return ok;
}

function afterMove(ok) {
  syncFrom(board);
  updateHud();
  if (ok && board.won()) return win();
  if (ok && board.moves <= 0) return outOfMoves();
  armHint();
}

// ---- heads-up display ---------------------------------------------------------------------

let goalEls = [];
let shown = []; // what each goal counter says (it ticks down as things arrive)
let movesShown = 0;
const iconCache = new Map();

function goalIcon(gl) {
  const key = `${gl.type}${gl.color}`;
  if (!iconCache.has(key)) {
    iconCache.set(key, art.icon(112, (c) => {
      if (gl.type === 'color') art.paintGem(c, gl.color);
      else if (gl.type === 'crate') art.paintCrate(c, 1);
      else if (gl.type === 'ice') art.paintIce(c, 1);
      else if (gl.type === 'coin') art.paintCoin(c);
      else if (gl.type === 'chain') {
        c.save();
        c.scale(0.9, 0.9);
        art.paintGem(c, 5);
        c.restore();
        art.paintChain(c);
      }
    }));
  }
  return iconCache.get(key);
}

const TICK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

function buildGoals() {
  const box = $('goals');
  box.innerHTML = '';
  goalEls = board.goals.map((gl) => {
    const d = document.createElement('div');
    d.className = 'goal';
    d.innerHTML = `<img alt="" src="${goalIcon(gl)}"><b>${Math.max(0, gl.need - gl.got)}</b><span class="tick">${TICK_SVG}</span>`;
    box.appendChild(d);
    return { el: d, img: d.querySelector('img'), num: d.querySelector('b') };
  });
  shown = board.goals.map((gl) => gl.need - gl.got);
}

function updateHud() {
  movesShown = board.moves;
  setMoves(board.moves);
  shown = board.goals.map((gl) => Math.max(0, gl.need - gl.got));
  shown.forEach((_, k) => showGoal(k));
  updateTools();
}

function setMoves(v) {
  const el = $('moves');
  el.textContent = String(Math.max(0, v));
  $('moves').parentElement.classList.toggle('low', v <= 5 && state !== 'won');
}

function showGoal(k) {
  const e = goalEls[k];
  if (!e) return;
  e.num.textContent = String(shown[k]);
  e.el.classList.toggle('done', shown[k] <= 0);
}

function updateTools() {
  for (const kind of ['hammer', 'row', 'shuffle']) {
    $(`${kind}Btn`).disabled = !!used[kind];
    $(`${kind}Btn`).classList.toggle('armed', armed === kind);
    $(`${kind}Badge`).textContent = used[kind] ? '' : '1';
  }
}

// ---- where things go on screen ------------------------------------------------------------

let W = 0, H = 0, dpr = 1;
let geo = { s: 40, ox: 0, oy: 0 };
let tray = null; // the board's backing, drawn once per layout
let clip = null; // the board's outline, to hide gems dropping in from above

function layout() {
  W = innerWidth;
  H = innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  for (const c of [canvas, fxCanvas]) {
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
  }
  if (!level) return;
  const goalsBox = $('goals').getBoundingClientRect();
  const top = (goalsBox.height ? goalsBox.bottom : $('topbar').getBoundingClientRect().bottom) + 12;
  const bottom = $('tools').getBoundingClientRect().top - 16;
  const coins = board && board.goals.some((gl) => gl.type === 'coin') ? 0.45 : 0;
  const s = Math.floor(Math.min((W - 14) / level.w, (bottom - top) / (level.h + coins), 64));
  geo = { s, ox: Math.round((W - s * level.w) / 2), oy: Math.round(top + (bottom - top - s * (level.h + coins)) / 2) };
  buildTray();
  requestDraw();
}

function buildTray() {
  const { s, ox, oy } = geo, { w, h, on } = level;
  const c = document.createElement('canvas');
  c.width = canvas.width;
  c.height = canvas.height;
  const t = c.getContext('2d');
  t.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pad = Math.max(3, s * 0.1);
  const cells = [];
  for (let r = 0; r < h; r++) for (let k = 0; k < w; k++) if (on[r * w + k]) cells.push([ox + k * s, oy + r * s, r, k]);
  t.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (const [x, y] of cells) {
    t.beginPath();
    t.roundRect(x - pad - 2, y - pad - 2, s + 2 * pad + 4, s + 2 * pad + 4, pad * 2);
    t.fill();
  }
  t.fillStyle = '#262b78';
  for (const [x, y] of cells) {
    t.beginPath();
    t.roundRect(x - pad, y - pad, s + 2 * pad, s + 2 * pad, pad * 1.6);
    t.fill();
  }
  for (const [x, y, r, k] of cells) {
    t.fillStyle = (r + k) % 2 ? '#3a40a6' : '#343a9a';
    t.beginPath();
    t.roundRect(x + 1, y + 1, s - 2, s - 2, s * 0.16);
    t.fill();
  }
  tray = c;
  clip = new Path2D();
  for (const [x, y] of cells) clip.rect(x - 0.5, y - 0.5, s + 1, s + 1);
}

const cellXY = (i) => ({ x: i % level.w, y: (i / level.w) | 0 });
const toScreen = (x, y) => ({ x: geo.ox + (x + 0.5) * geo.s, y: geo.oy + (y + 0.5) * geo.s });
const centre = (i) => toScreen(i % level.w, (i / level.w) | 0);

function cellAt(px, py) {
  const c = Math.floor((px - geo.ox) / geo.s), r = Math.floor((py - geo.oy) / geo.s);
  if (!level || c < 0 || r < 0 || c >= level.w || r >= level.h) return -1;
  const i = r * level.w + c;
  return level.on[i] ? i : -1;
}

// ---- what's drawn: pieces that move about, and what sits in each cell ------------------------

const pieces = new Map(); // id -> { id, kind, color, power, x, y, path, van, app, land, drop }
let cellId = [], vKind = [], vHp = [], vChain = [], vIce = [];
const wobble = new Map(); // cell -> when its crate was hit

function makePiece(id, kind, color, power, cell) {
  return { id, kind, color, power, x: cell % level.w, y: (cell / level.w) | 0, path: null, van: null, app: 0, land: 0, drop: false };
}

// Match what's drawn to the board (or a snapshot of it).
function syncFrom(src) {
  const N = level.w * level.h, seen = new Set();
  for (let i = 0; i < N; i++) {
    const k = src.kind[i], id = src.id[i];
    if ((k !== GEM && k !== COIN) || !id) continue;
    seen.add(id);
    let p = pieces.get(id);
    if (!p) pieces.set(id, (p = makePiece(id, k, src.color[i], src.power[i], i)));
    p.kind = k;
    p.color = src.color[i];
    p.power = src.power[i];
    p.x = i % level.w;
    p.y = (i / level.w) | 0;
    p.path = null;
    p.van = null;
  }
  for (const id of [...pieces.keys()]) if (!seen.has(id)) pieces.delete(id);
  cellId = Array.from(src.id);
  vKind = Array.from(src.kind);
  vHp = Array.from(src.hp);
  vChain = Array.from(src.chain);
  vIce = Array.from(src.ice);
}

// Paths: { from, to, t0, dur, ctrl?, accel? } for a single eased move, or
// { pts: [{ x, y, t }] } for a fall through several cells.
function pathAt(p, now) {
  if (p.pts) {
    const pts = p.pts;
    if (now <= pts[0].t) return { x: pts[0].x, y: pts[0].y, done: false };
    for (let k = 1; k < pts.length; k++) {
      if (now <= pts[k].t) {
        const a = pts[k - 1], b = pts[k], u = (now - a.t) / Math.max(1, b.t - a.t);
        return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), done: false };
      }
    }
    const e = pts[pts.length - 1];
    return { x: e.x, y: e.y, done: true };
  }
  const raw = (now - p.t0) / p.dur;
  if (raw <= 0) return { x: p.from.x, y: p.from.y, done: false };
  const u = raw >= 1 ? 1 : p.accel ? raw * raw : ease(raw);
  let x = lerp(p.from.x, p.to.x, u), y = lerp(p.from.y, p.to.y, u);
  if (p.ctrl) {
    x = (1 - u) * (1 - u) * p.from.x + 2 * (1 - u) * u * p.ctrl.x + u * u * p.to.x;
    y = (1 - u) * (1 - u) * p.from.y + 2 * (1 - u) * u * p.ctrl.y + u * u * p.to.y;
  }
  return { x, y, done: raw >= 1 };
}

const move = (from, to, t0, dur, extraOpts = {}) => ({ from, to, t0, dur, ...extraOpts });

// At the start of a level the gems drop in from above.
function dropIn() {
  const now = performance.now();
  for (const p of pieces.values()) {
    const delay = (level.h - 1 - p.y) * 45 + Math.abs(p.x - (level.w - 1) / 2) * 18;
    p.path = move({ x: p.x, y: p.y - level.h - 1.5 }, { x: p.x, y: p.y }, now + delay, 430, { accel: true });
    p.drop = true;
  }
  requestDraw();
}

// ---- playing back a move ---------------------------------------------------------------------

let timers = [];
let queue = [], current = null, stepEnd = 0, onSteps = null, playing = false;

function at(t, fn) {
  timers.push({ t, fn });
}

function runTimers(now) {
  if (!timers.length) return;
  timers.sort((a, b) => a.t - b.t);
  while (timers.length && timers[0].t <= now) timers.shift().fn(now);
}

function playSteps(steps, done) {
  queue = steps.slice();
  onSteps = done;
  playing = true;
  current = null;
  nextStep(performance.now());
}

function nextStep(now) {
  if (current && current.snap) syncFrom(current.snap);
  current = queue.shift() || null;
  if (!current) {
    playing = false;
    const cb = onSteps;
    onSteps = null;
    if (cb) cb();
    requestDraw();
    return;
  }
  stepEnd = now + startStep(current, now);
  requestDraw();
}

// Drop everything in flight (a new level, or skipping the celebration).
function stopAnimation() {
  timers = [];
  queue = [];
  current = null;
  playing = false;
  onSteps = null;
  effects.length = 0;
  parts.length = 0;
  flights.length = 0;
  texts.length = 0;
}

function startStep(st, now) {
  if (st.t === 'swap') return swapAnim(st, now);
  if (st.t === 'clear') return clearAnim(st, now);
  if (st.t === 'fall') return fallAnim(st, now);
  if (st.t === 'shuffle') return shuffleAnim(st, now);
  if (st.t === 'extra') {
    movesShown += 5;
    setMoves(movesShown);
    bump();
  }
  return 0;
}

function bump() {
  const el = $('moves');
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 160);
}

function swapAnim(st, now) {
  const pa = pieces.get(cellId[st.a]), pb = pieces.get(cellId[st.b]);
  const A = cellXY(st.a), B = cellXY(st.b), D = 150;
  if (pa) pa.path = move(A, B, now, D);
  if (pb) pb.path = move(B, A, now, D);
  sound('swap');
  if (st.ok) {
    [cellId[st.a], cellId[st.b]] = [cellId[st.b], cellId[st.a]];
    movesShown--;
    setMoves(movesShown);
    bump();
    return D;
  }
  at(now + D + 30, (t) => {
    if (pa) pa.path = move(B, A, t, D);
    if (pb) pb.path = move(A, B, t, D);
    sound('nope');
  });
  return 2 * D + 50;
}

// How long each kind of event keeps its pieces busy.
const BUSY = { pop: 250, gather: T.gather + 30, make: 260, fire: 230, convert: 160, crate: 200, chain: 200, ice: 200, hammer: 140 };

function clearAnim(st, now) {
  let end = 0;
  for (const ev of st.events) {
    end = Math.max(end, ev.at + (BUSY[ev.e] || 0));
    at(now + ev.at, (t) => onEvent(ev, t, st.cascade));
  }
  if (st.cascade >= 2) at(now + 60, () => praise(st.cascade));
  return end + 30;
}

function onEvent(ev, now, cascade) {
  const p = ev.id ? pieces.get(ev.id) : null;
  switch (ev.e) {
    case 'pop':
      if (p) p.van = { t0: now, dur: 240, kind: 'pop' };
      burst(ev.i, art.GEMS[ev.color] ? art.GEMS[ev.color].base : '#fff', 6, now);
      sound('match', cascade);
      break;
    case 'gather':
      if (p) {
        p.path = move({ x: p.x, y: p.y }, cellXY(ev.to), now, T.gather);
        p.van = { t0: now, dur: T.gather, kind: 'gather' };
      }
      sound('match', cascade);
      break;
    case 'make': {
      pieces.delete(ev.old);
      const np = makePiece(ev.id, GEM, ev.color, ev.power, ev.i);
      np.app = now;
      pieces.set(ev.id, np);
      cellId[ev.i] = ev.id;
      ring(ev.i, now, '#ffffff');
      sound('pop');
      break;
    }
    case 'fire':
      if (p) p.van = { t0: now, dur: 200, kind: 'fire' };
      ring(ev.i, now, ev.color >= 0 ? art.GEMS[ev.color].light : '#ffffff');
      break;
    case 'line':
      beam(ev, now);
      sound('line');
      shake(now, 3);
      break;
    case 'bomb':
      boom(ev, now);
      sound('bomb');
      shake(now, ev.R > 2 ? 14 : 9);
      haptic();
      break;
    case 'fly':
      flight(ev, now);
      sound('flutter');
      break;
    case 'zap':
      zaps(ev, now);
      sound('prism');
      break;
    case 'convert':
      if (p) {
        p.power = ev.power;
        p.app = now;
      }
      ring(ev.i, now, '#ffffff');
      sound(ev.bonus ? 'tap' : 'pop');
      break;
    case 'crate':
      vHp[ev.i] = ev.hp;
      wobble.set(ev.i, now);
      if (!ev.hp) vKind[ev.i] = EMPTY;
      splinters(ev.i, ev.hp ? 5 : 12, now);
      sound('crate');
      break;
    case 'chain':
      vChain[ev.i] = 0;
      links(ev.i, now);
      sound('clack');
      break;
    case 'ice':
      vIce[ev.i] = ev.left;
      shards(ev.i, ev.left ? 5 : 9, now);
      sound('ice');
      break;
    case 'goal':
      collect(ev.g, ev.i, now);
      break;
    case 'combo':
      ring(ev.i, now, '#fff6b0', 2.4);
      say('Combo!', 900, 1);
      haptic();
      break;
    case 'wipe':
      whiteout(now);
      say('Incredible!', 1300, 1.15);
      break;
    case 'hammer':
      hammerFx(ev.i, now);
      break;
    default:
  }
}

function fallAnim(st, now) {
  const w = level.w, TICK = 58;
  const tt = (k) => TICK * Math.max(0, k) ** 0.85;
  let end = 0;
  for (const p of st.paths) {
    const first = p.pts[1][0];
    const pts = p.pts.map(([cell, tick]) => {
      const xy = cell < 0 ? { x: -1 - cell, y: ((first / w) | 0) - 1 } : cellXY(cell);
      return { x: xy.x, y: xy.y, t: now + tt(tick) };
    });
    let piece = pieces.get(p.id);
    if (!piece) pieces.set(p.id, (piece = makePiece(p.id, p.kind, p.color, p.power, first)));
    piece.x = pts[0].x;
    piece.y = pts[0].y;
    piece.path = { pts };
    piece.drop = true;
    end = Math.max(end, pts[pts.length - 1].t - now);
  }
  for (const ex of st.exits) {
    at(now + tt(ex.tick - 1) + 20, (t) => coinOut(ex, t));
    end = Math.max(end, tt(ex.tick - 1) + 340);
  }
  return end + 60;
}

function coinOut(ex, now) {
  const p = pieces.get(ex.id);
  if (p) p.van = { t0: now, dur: 320, kind: 'exit' };
  sound('coin');
  if (ex.g >= 0) collect(ex.g, ex.i, now + 200, 0.9);
}

function shuffleAnim(st, now) {
  if (st.auto) toast('No moves left, so the gems were shuffled.');
  for (const m of st.moves) {
    const p = pieces.get(m.id);
    if (!p) continue;
    const A = cellXY(m.from), B = cellXY(m.to);
    p.path = move(A, B, now + Math.random() * 80, 560, { ctrl: { x: (A.x + B.x) / 2 + (Math.random() - 0.5) * 2, y: Math.min(A.y, B.y) - 1.5 } });
  }
  sound('whoosh');
  return 680;
}

// ---- effects ------------------------------------------------------------------------------

const effects = []; // drawn over the board: { t0, dur, draw(t, k) }
const parts = []; // particles
const flights = []; // things flying up to the goal counters
const texts = []; // big words: "Great!"
let shakeAt = 0, shakeMag = 0;

function addFx(t0, dur, draw) {
  effects.push({ t0, dur, draw });
}

function shake(now, mag) {
  if (mag >= shakeMag * (1 - Math.min(1, (now - shakeAt) / 300))) {
    shakeAt = now;
    shakeMag = mag;
  }
}

const lastSound = new Map();
function sound(name, k) {
  const now = performance.now();
  if (now - (lastSound.get(name) || 0) < 45) return;
  lastSound.set(name, now);
  sfx(name, k);
}

function burst(i, color, n, now, opts = {}) {
  const c = centre(i), s = geo.s;
  for (let k = 0; k < n; k++) {
    const a = Math.random() * TAU, v = (opts.speed || 1) * s * (2.2 + Math.random() * 3.2);
    parts.push({
      x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - s * 2, grav: s * 16,
      t0: now, life: 380 + Math.random() * 260, size: s * (opts.size || 0.11) * (0.6 + Math.random() * 0.7),
      color: opts.colors ? opts.colors[k % opts.colors.length] : color, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12,
      shape: opts.shape || 'gem',
    });
  }
}

const splinters = (i, n, now) => burst(i, '#c98a45', n, now, { shape: 'plank', colors: ['#e0a868', '#b9772f', '#8a5523'], size: 0.16 });
const shards = (i, n, now) => burst(i, '#d8f3ff', n, now, { shape: 'shard', colors: ['#ffffff', '#cdefff', '#8fd0ff'], size: 0.14 });
const links = (i, now) => burst(i, '#aeb6c7', 7, now, { shape: 'link', colors: ['#dfe4ee', '#aeb6c7', '#7b869c'], size: 0.13 });

function ring(i, now, color, big = 1) {
  const c = centre(i), s = geo.s;
  addFx(now, 320, (t, k) => {
    g.save();
    g.globalAlpha = 1 - k;
    g.strokeStyle = color;
    g.lineWidth = s * 0.12 * (1 - k) + 1;
    g.beginPath();
    g.arc(c.x, c.y, s * (0.3 + 0.55 * big * easeOut(k)), 0, TAU);
    g.stroke();
    g.restore();
  });
}

function beam(ev, now) {
  const s = geo.s, c = toScreen(ev.c, ev.r);
  // How far it runs each way before leaving the board.
  const pos = ev.horiz ? ev.c : ev.r, size = ev.horiz ? level.w : level.h;
  const back = pos + 0.7, fwd = size - pos - 0.3;
  const len = Math.max(back, fwd);
  const col = ev.color >= 0 ? art.GEMS[ev.color].base : '#ffe14d';
  const run = len * T.line;
  addFx(now, run + 280, (t) => {
    const reach = Math.min(len, t / T.line);
    const r0 = Math.min(back, reach) * s, r1 = Math.min(fwd, reach) * s;
    const fade = t > run ? Math.max(0, 1 - (t - run) / 280) : 1;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = fade;
    const th = s * 0.46;
    const grad = ev.horiz ? g.createLinearGradient(0, c.y - th, 0, c.y + th) : g.createLinearGradient(c.x - th, 0, c.x + th, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, col);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    if (ev.horiz) g.fillRect(c.x - r0, c.y - th, r0 + r1, th * 2);
    else g.fillRect(c.x - th, c.y - r0, th * 2, r0 + r1);
    g.fillStyle = 'rgba(255,255,255,0.95)';
    const core = s * 0.07;
    if (ev.horiz) g.fillRect(c.x - r0, c.y - core, r0 + r1, core * 2);
    else g.fillRect(c.x - core, c.y - r0, core * 2, r0 + r1);
    if (t < run) {
      for (const [sg, rr, lim] of [[-1, r0, back], [1, r1, fwd]]) {
        if (reach >= lim) continue;
        const hx = ev.horiz ? c.x + sg * rr : c.x, hy = ev.horiz ? c.y : c.y + sg * rr;
        const rg = g.createRadialGradient(hx, hy, 0, hx, hy, s * 0.5);
        rg.addColorStop(0, 'rgba(255,255,255,1)');
        rg.addColorStop(0.4, col);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg;
        g.beginPath();
        g.arc(hx, hy, s * 0.5, 0, TAU);
        g.fill();
      }
    }
    g.restore();
  });
}

function boom(ev, now) {
  const s = geo.s, c = toScreen(ev.c, ev.r), R = (ev.R + 0.7) * s;
  addFx(now, 520, (t, k) => {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const r = R * easeOut(k * 1.4);
    const rg = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(1, r));
    rg.addColorStop(0, `rgba(255, 252, 220, ${0.95 * (1 - k)})`);
    rg.addColorStop(0.55, `rgba(255, 170, 60, ${0.7 * (1 - k)})`);
    rg.addColorStop(1, 'rgba(255, 90, 30, 0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(c.x, c.y, Math.max(1, r), 0, TAU);
    g.fill();
    g.restore();
    g.save();
    g.globalAlpha = Math.max(0, 1 - k * 1.2);
    g.strokeStyle = '#fff';
    g.lineWidth = s * 0.2 * (1 - k) + 1;
    g.beginPath();
    g.arc(c.x, c.y, R * easeOut(k), 0, TAU);
    g.stroke();
    g.restore();
  });
  const i = ev.r * level.w + ev.c;
  if (ev.r >= 0 && ev.c >= 0) burst(i, '#ffb347', 16, now, { colors: ['#fff6c4', '#ffb347', '#ff7b39'], speed: 1.6, shape: 'spark' });
}

function flight(ev, now) {
  const s = geo.s, A = centre(ev.from), B = centre(ev.to);
  const ctrl = { x: (A.x + B.x) / 2 + (B.y - A.y) * 0.25, y: Math.min(A.y, B.y) - s * 1.8 };
  let lastTrail = 0;
  addFx(now, ev.dur, (t, k) => {
    const u = ease(k);
    const x = (1 - u) * (1 - u) * A.x + 2 * (1 - u) * u * ctrl.x + u * u * B.x;
    const y = (1 - u) * (1 - u) * A.y + 2 * (1 - u) * u * ctrl.y + u * u * B.y;
    const dx = 2 * (1 - u) * (ctrl.x - A.x) + 2 * u * (B.x - ctrl.x);
    g.save();
    g.translate(x, y);
    g.rotate(Math.max(-0.5, Math.min(0.5, dx / (s * 12))));
    const size = s * (1 + 0.25 * Math.sin(k * Math.PI));
    g.scale(size, size);
    art.paintFly(g, ev.color, Math.abs(Math.sin(t / 42)), ev.carry);
    g.restore();
    if (t - lastTrail > 30) {
      lastTrail = t;
      parts.push({ x, y, vx: 0, vy: s * 0.5, grav: 0, t0: performance.now(), life: 360, size: s * 0.07, color: art.GEMS[ev.color] ? art.GEMS[ev.color].light : '#fff', rot: 0, vr: 3, shape: 'spark' });
    }
  });
}

function zaps(ev, now) {
  const s = geo.s, A = centre(ev.i);
  const col = ev.color >= 0 ? art.GEMS[ev.color].base : '#fff';
  const total = 160 + ev.targets.length * T.zap + 220;
  addFx(now, total, (t, k) => {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const r = s * (0.6 + 0.15 * Math.sin(t / 40));
    const rg = g.createRadialGradient(A.x, A.y, 0, A.x, A.y, r);
    rg.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k * 0.5)})`);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(A.x, A.y, r, 0, TAU);
    g.fill();
    g.restore();
  });
  ev.targets.forEach((j, k) => {
    const B = centre(j);
    addFx(now + 160 + k * T.zap, 260, (t, kk) => bolt(A, B, col, 1 - kk));
  });
}

function bolt(A, B, col, alpha) {
  const s = geo.s, n = 7, dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const pts = [[A.x, A.y]];
  for (let k = 1; k < n; k++) {
    const off = (Math.random() - 0.5) * s * 0.6;
    pts.push([A.x + (dx * k) / n + nx * off, A.y + (dy * k) / n + ny * off]);
  }
  pts.push([B.x, B.y]);
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = alpha;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  for (const [wd, c] of [[s * 0.22, col], [s * 0.07, '#ffffff']]) {
    g.strokeStyle = c;
    g.lineWidth = wd;
    g.beginPath();
    pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  }
  g.restore();
}

function whiteout(now) {
  addFx(now, 700, (t, k) => {
    g.save();
    g.fillStyle = `rgba(255,255,255,${0.75 * (1 - k)})`;
    g.fillRect(0, 0, W, H);
    g.restore();
  });
}

function hammerFx(i, now) {
  const c = centre(i), s = geo.s;
  addFx(now, 260, (t, k) => {
    g.save();
    g.translate(c.x + s * 0.35, c.y - s * 0.35);
    g.rotate(-1.1 + 1.3 * easeOut(Math.min(1, k * 1.6)));
    g.fillStyle = '#8a5523';
    g.fillRect(-s * 0.06, -s * 0.05, s * 0.12, s * 0.75);
    g.fillStyle = '#6b7385';
    g.beginPath();
    g.roundRect(-s * 0.3, -s * 0.2, s * 0.6, s * 0.26, s * 0.05);
    g.fill();
    g.restore();
  });
  setTimeout(() => { shake(performance.now(), 6); sound('crate'); }, 120);
}

// Something a goal needs flies up to its counter.
function collect(k, i, now, size = 0.8) {
  const e = goalEls[k];
  if (!e) return;
  const gl = board.goals[k];
  if (flights.length > 36) return arrive(k);
  const box = e.img.getBoundingClientRect(), from = centre(i);
  flights.push({
    k, t0: now + Math.random() * 60, dur: 560, from, to: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
    ctrl: { x: from.x + (Math.random() - 0.5) * geo.s * 3, y: Math.min(from.y, box.top) - geo.s * 1.2 },
    type: gl.type, color: gl.color, size,
  });
  requestDraw();
}

function arrive(k) {
  const real = Math.max(0, board.goals[k].need - board.goals[k].got);
  if (shown[k] > real) shown[k]--;
  const e = goalEls[k];
  showGoal(k);
  e.img.classList.add('hit');
  setTimeout(() => e.img.classList.remove('hit'), 120);
  if (shown[k] === 0 && !e.done) {
    e.done = true;
    sound('goal');
  }
}

function say(text, dur = 1000, size = 1) {
  texts.push({ text, t0: performance.now(), dur, size });
  requestDraw();
}

const PRAISE = ['', '', 'Nice!', 'Great!', 'Super!', 'Amazing!', 'Incredible!'];
function praise(cascade) {
  say(PRAISE[Math.min(6, cascade)], 900, 0.8 + Math.min(0.4, cascade * 0.06));
  if (cascade >= 4) sound('cheer');
}

// ---- drawing ------------------------------------------------------------------------------

let raf = 0, lastFrame = 0;

function requestDraw() {
  if (!raf) raf = requestAnimationFrame(frame);
}

// Power-ups twinkle even when nothing else is happening; that's drawn at a
// gentler rate, to go easy on the battery.
let ambient = false, ambientTimer = 0;

function frame(now) {
  raf = 0;
  const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
  lastFrame = now;
  runTimers(now);
  if (playing && now >= stepEnd) nextStep(now);
  ambient = false;
  const live = draw(now, dt);
  if (live || playing || timers.length) requestDraw();
  else {
    lastFrame = 0;
    if (ambient && !ambientTimer && !document.hidden) {
      ambientTimer = setTimeout(() => {
        ambientTimer = 0;
        requestDraw();
      }, 45);
    }
  }
}

function draw(now, dt) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  fg.setTransform(dpr, 0, 0, dpr, 0, 0);
  fg.clearRect(0, 0, W, H);
  if (!level || !tray) return false;
  let live = false;
  const { s, ox, oy } = geo, { w } = level, N = level.w * level.h;
  // Shake.
  let sx = 0, sy = 0;
  if (shakeMag) {
    const k = (now - shakeAt) / 320;
    if (k >= 1) shakeMag = 0;
    else {
      sx = Math.sin(now / 18) * shakeMag * (1 - k);
      sy = Math.cos(now / 23) * shakeMag * (1 - k) * 0.6;
      live = true;
    }
  }
  g.translate(sx, sy);
  g.save();
  g.setTransform(1, 0, 0, 1, sx * dpr, sy * dpr);
  g.drawImage(tray, 0, 0);
  g.restore();
  const px = Math.max(8, Math.round(s * dpr));

  // Ice under the cells.
  for (let i = 0; i < N; i++) {
    if (!vIce[i]) continue;
    g.drawImage(art.iceSprite(px, vIce[i]), ox + (i % w) * s, oy + ((i / w) | 0) * s, s, s);
  }
  // Coin exits.
  if (board.goals.some((gl) => gl.type === 'coin')) {
    g.fillStyle = '#ffc93c';
    for (let i = 0; i < N; i++) {
      if (!board.exit[i]) continue;
      const x = ox + (i % w + 0.5) * s, y = oy + (((i / w) | 0) + 1) * s + s * 0.12;
      const bob = Math.sin(now / 260) * s * 0.04;
      g.beginPath();
      g.moveTo(x - s * 0.16, y + bob);
      g.lineTo(x + s * 0.16, y + bob);
      g.lineTo(x, y + s * 0.2 + bob);
      g.closePath();
      g.fill();
    }
    ambient = true;
  }
  // Crates.
  for (let i = 0; i < N; i++) {
    if (vKind[i] !== CRATE || !vHp[i]) continue;
    const x = ox + (i % w + 0.5) * s, y = oy + (((i / w) | 0) + 0.5) * s;
    let rot = 0;
    const wb = wobble.get(i);
    if (wb !== undefined) {
      const k = (now - wb) / 260;
      if (k >= 1) wobble.delete(i);
      else {
        rot = Math.sin(k * Math.PI * 3) * (1 - k) * 0.12;
        live = true;
      }
    }
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.drawImage(art.crateSprite(px, vHp[i]), -s / 2, -s / 2, s, s);
    g.restore();
  }

  // Pieces, kept inside the board.
  g.save();
  g.clip(clip);
  const gemPx = Math.max(8, Math.round(s * 0.94 * dpr)), gs = s * 0.94;
  let hintOff = null;
  if (hint) hintOff = hintOffsets(now);
  for (const p of pieces.values()) {
    let { x, y } = p;
    if (p.path) {
      const q = pathAt(p.path, now);
      x = q.x;
      y = q.y;
      if (q.done) {
        p.x = q.x;
        p.y = q.y;
        p.path = null;
        if (p.drop) {
          p.land = now;
          p.drop = false;
        }
      }
      live = true;
    }
    let sc = 1, sxk = 1, syk = 1, alpha = 1, glow = 0;
    if (p.land) {
      const k = (now - p.land) / 190;
      if (k >= 1) p.land = 0;
      else {
        const b = Math.sin(k * Math.PI);
        syk = 1 - 0.13 * b;
        sxk = 1 + 0.07 * b;
        live = true;
      }
    }
    if (p.app) {
      const k = (now - p.app) / 280;
      if (k >= 1) p.app = 0;
      else {
        sc = k < 0.55 ? 0.35 + (k / 0.55) * 0.95 : 1.3 - ((k - 0.55) / 0.45) * 0.3;
        glow = 1 - k;
        live = true;
      }
    }
    if (p.van) {
      const k = (now - p.van.t0) / p.van.dur;
      if (k >= 1) {
        pieces.delete(p.id);
        continue;
      }
      live = true;
      if (k > 0) {
        if (p.van.kind === 'pop') {
          sc = k < 0.3 ? 1 + k * 0.8 : 1.24 * (1 - (k - 0.3) / 0.7);
          alpha = 1 - k * k;
          glow = 1 - k;
        } else if (p.van.kind === 'gather') {
          sc = 1 - 0.45 * k;
          alpha = 1 - 0.5 * k;
        } else if (p.van.kind === 'fire') {
          sc = 1 + 0.6 * k;
          alpha = 1 - k;
          glow = 1;
        } else if (p.van.kind === 'exit') {
          y += k * 0.9;
          alpha = 1 - k;
        }
      }
    }
    if (hintOff && hintOff.has(p.id)) {
      const o = hintOff.get(p.id);
      x += o.x;
      y += o.y;
      sc *= o.s;
    }
    const cx = ox + (x + 0.5) * s, cy = oy + (y + 0.5) * s;
    g.save();
    g.globalAlpha = alpha;
    g.translate(cx, cy + (syk < 1 ? (1 - syk) * gs * 0.45 : 0));
    g.scale(sc * sxk, sc * syk);
    if (glow > 0) {
      g.fillStyle = `rgba(255,255,255,${0.35 * glow})`;
      g.beginPath();
      g.arc(0, 0, gs * 0.55, 0, TAU);
      g.fill();
    }
    if (p.kind === COIN) g.drawImage(art.coinSprite(gemPx), -gs / 2, -gs / 2, gs, gs);
    else if (p.power === FLY || p.power === PRISM) {
      g.scale(gs, gs);
      if (p.power === FLY) art.paintFly(g, p.color, 0.75 + 0.25 * Math.sin(now / 140 + p.id));
      else art.paintPrism(g, now);
      ambient = true;
    } else {
      g.drawImage(art.pieceSprite(gemPx, p.color, p.power), -gs / 2, -gs / 2, gs, gs);
      if (p.power === BOMB) {
        g.scale(gs, gs);
        art.paintSpark(g, now + p.id * 50);
        ambient = true;
      }
    }
    g.restore();
  }
  // Chains over their gems.
  for (let i = 0; i < N; i++) {
    if (!vChain[i]) continue;
    g.drawImage(art.chainSprite(px), ox + (i % w) * s, oy + ((i / w) | 0) * s, s, s);
  }
  g.restore();

  // The gem you've picked up, and the hint.
  if (selected >= 0) {
    const c = centre(selected);
    g.save();
    g.strokeStyle = `rgba(255,255,255,${0.75 + 0.25 * Math.sin(now / 150)})`;
    g.lineWidth = Math.max(2, s * 0.07);
    g.beginPath();
    g.roundRect(c.x - s * 0.47, c.y - s * 0.47, s * 0.94, s * 0.94, s * 0.2);
    g.stroke();
    g.restore();
    live = true;
  }
  if (hint) {
    // A hint nobody looks at stops after a while (the next tap starts the clock again).
    if (now - hint.t0 > 12000) hint = null;
    else live = true;
  }
  if (armed) {
    // Shimmer to show a booster is waiting for a square.
    g.save();
    g.globalAlpha = 0.18 + 0.1 * Math.sin(now / 200);
    g.fillStyle = '#ffb347';
    g.fill(clip);
    g.restore();
    live = true;
  }

  // Effects.
  for (let k = effects.length - 1; k >= 0; k--) {
    const e = effects[k];
    const t = now - e.t0;
    if (t < 0) { live = true; continue; }
    if (t >= e.dur) { effects.splice(k, 1); continue; }
    e.draw(t, t / e.dur);
    live = true;
  }
  drawParts(now, dt);
  if (parts.length) live = true;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (drawFlights(now)) live = true;
  if (drawTexts(now)) live = true;
  return live;
}

function drawParts(now, dt) {
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k];
    const age = now - p.t0;
    if (age >= p.life) { parts.splice(k, 1); continue; }
    p.vy += p.grav * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    const a = 1 - age / p.life;
    g.save();
    g.globalAlpha = a;
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    g.fillStyle = p.color;
    const z = p.size;
    if (p.shape === 'plank') g.fillRect(-z, -z * 0.3, z * 2, z * 0.6);
    else if (p.shape === 'shard') {
      g.beginPath();
      g.moveTo(0, -z);
      g.lineTo(z * 0.6, z * 0.6);
      g.lineTo(-z * 0.5, z * 0.4);
      g.closePath();
      g.fill();
    } else if (p.shape === 'link') {
      g.strokeStyle = p.color;
      g.lineWidth = z * 0.4;
      g.beginPath();
      g.ellipse(0, 0, z, z * 0.55, 0, 0, TAU);
      g.stroke();
    } else if (p.shape === 'spark') {
      g.globalCompositeOperation = 'lighter';
      g.beginPath();
      g.arc(0, 0, z * (0.5 + a * 0.5), 0, TAU);
      g.fill();
    } else {
      g.beginPath();
      g.moveTo(0, -z);
      g.lineTo(z * 0.7, 0);
      g.lineTo(0, z);
      g.lineTo(-z * 0.7, 0);
      g.closePath();
      g.fill();
    }
    g.restore();
  }
}

function flightSprite(f, px) {
  if (f.type === 'color') return art.pieceSprite(px, f.color, NONE);
  if (f.type === 'crate') return art.crateSprite(px, 1);
  if (f.type === 'ice') return art.iceSprite(px, 1);
  if (f.type === 'coin') return art.coinSprite(px);
  return art.chainSprite(px);
}

function drawFlights(now) {
  if (!flights.length) return false;
  const px = Math.max(8, Math.round(geo.s * dpr));
  for (let k = flights.length - 1; k >= 0; k--) {
    const f = flights[k];
    const raw = (now - f.t0) / f.dur;
    if (raw < 0) continue;
    if (raw >= 1) {
      flights.splice(k, 1);
      arrive(f.k);
      continue;
    }
    const u = ease(raw);
    const x = (1 - u) * (1 - u) * f.from.x + 2 * (1 - u) * u * f.ctrl.x + u * u * f.to.x;
    const y = (1 - u) * (1 - u) * f.from.y + 2 * (1 - u) * u * f.ctrl.y + u * u * f.to.y;
    const z = geo.s * f.size * (1 - 0.4 * u);
    fg.drawImage(flightSprite(f, px), x - z / 2, y - z / 2, z, z);
  }
  return true;
}

function drawTexts(now) {
  if (!texts.length) return false;
  const cx = geo.ox + (level.w * geo.s) / 2, cy = geo.oy + (level.h * geo.s) * 0.42;
  for (let k = texts.length - 1; k >= 0; k--) {
    const t = texts[k];
    const raw = (now - t.t0) / t.dur;
    if (raw >= 1) { texts.splice(k, 1); continue; }
    const pop = raw < 0.2 ? 0.4 + (raw / 0.2) * 0.75 : raw < 0.3 ? 1.15 - ((raw - 0.2) / 0.1) * 0.15 : 1;
    const alpha = raw > 0.75 ? 1 - (raw - 0.75) / 0.25 : 1;
    const size = Math.round(Math.min(W / 7, geo.s * 1.25) * t.size);
    fg.save();
    fg.globalAlpha = alpha;
    fg.translate(cx, cy - raw * geo.s * 0.6);
    fg.scale(pop, pop);
    fg.font = `900 ${size}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
    fg.textAlign = 'center';
    fg.textBaseline = 'middle';
    fg.lineJoin = 'round';
    fg.lineWidth = size * 0.18;
    fg.strokeStyle = '#2b1a6b';
    fg.strokeText(t.text, 0, 0);
    const grad = fg.createLinearGradient(0, -size / 2, 0, size / 2);
    grad.addColorStop(0, '#fff7b0');
    grad.addColorStop(0.5, '#ffd23f');
    grad.addColorStop(1, '#ff9f1c');
    fg.fillStyle = grad;
    fg.fillText(t.text, 0, 0);
    fg.restore();
  }
  return true;
}

// ---- hints -----------------------------------------------------------------------------------

let hint = null, hintTimer = 0;

function armHint() {
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => showHint(false), 6500);
}

function hideHint() {
  clearTimeout(hintTimer);
  hint = null;
}

function showHint(asked) {
  if (state !== 'ready' || ui.isOpen() || !board) return;
  const m = bestMove(board);
  if (!m) return;
  hint = { m, t0: performance.now() };
  if (asked) sound('hint');
  requestDraw();
}

// The hinted gems nudge towards each other (or a power-up throbs).
function hintOffsets(now) {
  const out = new Map(), m = hint.m, t = (now - hint.t0) / 1000;
  const k = Math.max(0, Math.sin(t * 7)) * (Math.floor(t / 0.9) % 2 === 0 ? 1 : 0.3);
  if (m.type === 'swap') {
    const A = cellXY(m.a), B = cellXY(m.b);
    out.set(cellId[m.a], { x: (B.x - A.x) * 0.16 * k, y: (B.y - A.y) * 0.16 * k, s: 1 });
    out.set(cellId[m.b], { x: (A.x - B.x) * 0.16 * k, y: (A.y - B.y) * 0.16 * k, s: 1 });
  } else out.set(cellId[m.i], { x: 0, y: 0, s: 1 + 0.12 * k });
  return out;
}

// ---- touch and mouse -------------------------------------------------------------------------

let drag = null;

const neighbour = (i, dr, dc) => {
  const r = ((i / level.w) | 0) + dr, c = (i % level.w) + dc;
  if (r < 0 || c < 0 || r >= level.h || c >= level.w) return -1;
  return level.on[r * level.w + c] ? r * level.w + c : -1;
};
const adjacent = (a, b) => {
  const w = level.w;
  return Math.abs(a - b) === w || (Math.abs(a - b) === 1 && ((a / w) | 0) === ((b / w) | 0));
};

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (ui.isOpen() || !level) return;
  if (celebrating) { skipCelebration(); return; }
  if (state !== 'ready') return;
  const i = cellAt(e.clientX, e.clientY);
  hideHint();
  armHint();
  if (i < 0) {
    if (selected >= 0 || armed) {
      selected = -1;
      armed = '';
      updateTools();
      requestDraw();
    }
    return;
  }
  if (armed) { useBooster(i); return; }
  drag = { i, x0: e.clientX, y0: e.clientY, id: e.pointerId, done: false };
  try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported */ }
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag || drag.done || drag.id !== e.pointerId) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < geo.s * 0.3) return;
  drag.done = true;
  const [dr, dc] = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
  const j = neighbour(drag.i, dr, dc);
  selected = -1;
  if (j >= 0) trySwap(drag.i, j);
});

canvas.addEventListener('pointerup', (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const d = drag;
  drag = null;
  if (!d.done) tap(d.i);
});
canvas.addEventListener('pointercancel', () => { drag = null; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function tap(i) {
  if (state !== 'ready') return;
  if (selected >= 0 && selected !== i && adjacent(selected, i)) {
    const a = selected;
    selected = -1;
    trySwap(a, i);
    return;
  }
  if (board.swappable(i) && board.power[i]) {
    selected = -1;
    doMove({ type: 'tap', i });
    return;
  }
  if (selected === i) selected = -1;
  else if (board.swappable(i)) {
    selected = i;
    sound('tap');
  } else {
    selected = -1;
    nope(i);
  }
  requestDraw();
}

function trySwap(a, b) {
  if (!board.swappable(a) || !board.swappable(b)) {
    nope(board.swappable(a) ? b : a);
    return;
  }
  doMove({ type: 'swap', a, b });
}

// Chained gems and crates won't budge.
function nope(i) {
  sound('nope');
  if (vKind[i] === CRATE) wobble.set(i, performance.now());
  else if (vChain[i]) links(i, performance.now());
  requestDraw();
}

// ---- boosters ------------------------------------------------------------------------------

function arm(kind) {
  if (state !== 'ready' || ui.isOpen()) return;
  sound('tap');
  if (used[kind]) {
    toast('One of each booster per level.');
    return;
  }
  armed = armed === kind ? '' : kind;
  selected = -1;
  if (armed === 'hammer') toast('Tap any square to smash it.');
  if (armed === 'row') toast('Tap a square to clear its whole row.');
  updateTools();
  requestDraw();
}

function useBooster(i) {
  const kind = armed;
  armed = '';
  if (kind === 'hammer' && board.kind[i] === COIN) {
    toast('Coins can’t be smashed. Clear the gems under them.');
    updateTools();
    return;
  }
  doMove({ type: kind, i });
  updateTools();
}

$('hammerBtn').addEventListener('click', () => arm('hammer'));
$('rowBtn').addEventListener('click', () => arm('row'));
$('shuffleBtn').addEventListener('click', () => {
  if (state !== 'ready' || ui.isOpen()) return;
  if (used.shuffle) { toast('One shuffle per level.'); return; }
  armed = '';
  doMove({ type: 'shuffle' });
});
$('hintBtn').addEventListener('click', () => {
  if (state !== 'ready' || ui.isOpen()) return;
  showHint(true);
});

// ---- winning and losing ------------------------------------------------------------------------

let result = null;
const STAR = (on) => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}"><path d="M12 2.6l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.2l-5.72 3 1.1-6.37-4.63-4.5 6.4-.93z"/></svg>`;

function win() {
  state = 'won';
  hideHint();
  armed = '';
  selected = -1;
  const spare = board.moves;
  const stars = extra ? 1 : spare >= level.stars[1] ? 3 : spare >= level.stars[0] ? 2 : 1;
  const prev = save.best[level.n] || 0;
  save.best[level.n] = Math.max(prev, stars);
  save.n = Math.max(save.n, level.n + 1);
  save.play = null;
  if (!extra) save.streak = (save.streak || 0) + 1;
  writeSave();
  result = { stars, spare, better: prev > 0 && stars > prev };
  setMoves(spare);
  sound('cheer');
  haptic();
  say('Level complete!', 1500, 0.9);
  updateTools();
  setTimeout(() => {
    if (state !== 'won' || !board) return;
    const steps = board.celebrate();
    if (!steps.length) return winCard();
    celebrating = true;
    say('Bonus!', 900, 0.8);
    playSteps(steps, () => {
      celebrating = false;
      winCard();
    });
  }, 1200);
}

function skipCelebration() {
  if (!celebrating) return;
  celebrating = false;
  stopAnimation();
  syncFrom(board);
  requestDraw();
  // Wait until the finger that skipped has lifted, so its tap doesn't land on
  // a button of the card that comes up.
  let shown = false;
  const show = () => {
    if (shown) return;
    shown = true;
    window.removeEventListener('pointerup', later, true);
    winCard();
  };
  const later = () => setTimeout(show, 120);
  window.addEventListener('pointerup', later, true);
  setTimeout(show, 900);
}

function winCard() {
  if (state !== 'won') return;
  setMoves(0);
  const { stars, spare, better } = result;
  const left = spare === 1 ? '1 move' : `${spare} moves`;
  const note = extra ? 'You used extra moves, so that’s one star. Try again for more?'
    : stars === 3 ? `${left} to spare. Superb!` : `${left} to spare. Finish with ${level.stars[stars === 1 ? 0 : 1]} or more for ${stars === 1 ? 'two' : 'three'} stars.`;
  const streak = !extra && save.streak ? `<p class="tip streak-tip">Win streak ×${save.streak}! ${save.streak <= 3 ? `The next level starts with ${listOf(streakGift().map((p) => POWER_NAME[p]))}.` : 'The next level starts with all three power-ups.'}</p>` : '';
  ui.show(`<h2>Level ${level.n} complete!</h2>
    <div class="win-stars">${[1, 2, 3].map((k) => STAR(k <= stars)).join('')}</div>
    <p>${note}${better ? ' A new best!' : ''}</p>${streak}
    <div class="actions"><button class="btn btn-primary" data-action="next">Next level</button>
    <button class="btn btn-soft" data-action="replay">Play again</button></div>`);
  sfx('win');
  confetti();
}

function outOfMoves() {
  state = 'lost';
  hideHint();
  sound('lose');
  setTimeout(() => {
    if (state !== 'lost') return;
    const lose = save.streak ? ` Either way your win streak of ${save.streak} ends.` : '';
    ui.show(`<h2>Out of moves</h2>${goalRow(true)}
      <p>So close! Take 5 more moves and keep going? You can still finish the level, for one star.${lose}</p>
      <div class="actions"><button class="btn btn-primary" data-action="extra">+5 moves</button>
      <button class="btn btn-soft" data-action="retry">Try again</button></div>`);
  }, 500);
}

// ---- cards --------------------------------------------------------------------------------------

function goalRow(left) {
  return `<div class="goal-row">${board.goals.map((gl) => {
    const n = left ? gl.need - gl.got : gl.need;
    return `<div><img alt="" src="${goalIcon(gl)}"><b class="${n <= 0 ? 'ok' : ''}">${n <= 0 ? '✓' : n}</b></div>`;
  }).join('')}</div>`;
}

const POWER_NAME = { [LINE_H]: 'a Line Blaster', [LINE_V]: 'a Line Blaster', [BOMB]: 'a Bomb', [PRISM]: 'a Prism' };
const powerIcon = (p) => {
  const key = `pw${p}`;
  if (!iconCache.has(key)) iconCache.set(key, art.icon(96, (c) => (p === PRISM ? art.paintPrism(c, 300) : p === BOMB ? art.paintBomb(c, 1) : art.paintLine(c, 4, false))));
  return iconCache.get(key);
};
const listOf = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

function streakNote() {
  if (!gift.length) return '';
  const powers = gift.map((i) => board.power[i]);
  return `<div class="streak"><div class="streak-icons">${powers.map((p) => `<img alt="" src="${powerIcon(p)}">`).join('')}</div>
    <span><b>Win streak ×${save.streak}!</b> You start with ${listOf(powers.map((p) => POWER_NAME[p]))}.</span></div>`;
}

function levelCard() {
  const tier = level.tier === 'hard' ? '<p class="tip" style="color:var(--red-2)">Hard level: fewer moves than usual.</p>'
    : level.tier === 'super' ? '<p class="tip" style="color:#5228a8">Super hard level! Every move counts.</p>' : '';
  ui.show(`<h2>Level ${level.n}</h2>${tier}${goalRow(false)}
    <p class="level-info">${level.moves} moves</p>${streakNote()}
    <p class="tip"><span class="star-goal">${'<svg viewBox="0 0 24 24"><path d="M12 2.6l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.2l-5.72 3 1.1-6.37-4.63-4.5 6.4-.93z"/></svg>'.repeat(3)}</span>
      with ${level.stars[1]} or more moves to spare</p>
    <div class="actions"><button class="btn btn-primary" data-action="go">Play</button></div>`);
}

// Little pictures for the cards: a row of pieces with an arrow.
function scene(items, wpx = 440, hpx = 156) {
  const c = document.createElement('canvas');
  c.width = wpx;
  c.height = hpx;
  const t = c.getContext('2d');
  t.fillStyle = '#2f3488';
  t.fillRect(0, 0, wpx, hpx);
  const size = hpx * 0.42;
  let x = (wpx - items.reduce((s, it) => s + (it === '>' ? size * 0.75 : it === '+' ? size * 0.6 : size * (it.k || 1)), 0)) / 2;
  for (const it of items) {
    if (it === '>' || it === '+') {
      t.fillStyle = '#ffe14d';
      t.font = `900 ${size * 0.7}px ui-rounded, system-ui, sans-serif`;
      t.textAlign = 'center';
      t.textBaseline = 'middle';
      t.fillText(it === '>' ? '➜' : '+', x + (it === '>' ? size * 0.375 : size * 0.3), hpx / 2);
      x += it === '>' ? size * 0.75 : size * 0.6;
      continue;
    }
    const z = size * (it.k || 1);
    t.save();
    t.translate(x + z / 2, hpx / 2 + (it.dy || 0) * size);
    t.scale(z, z);
    it.paint(t);
    t.restore();
    x += z;
  }
  return c.toDataURL();
}

const gem = (c, opts = {}) => ({ paint: (t) => art.paintGem(t, c), ...opts });
const pw = (p, c = 0, opts = {}) => ({
  paint: (t) => (p === FLY ? art.paintFly(t, c, 1) : p === PRISM ? art.paintPrism(t, 400) : p === BOMB ? art.paintBomb(t, c) : art.paintLine(t, c, p === LINE_V)),
  ...opts,
});
// A 2x2 block or an L drawn as one item.
const block = (cells, color) => ({
  k: 1.25,
  paint: (t) => {
    for (const [x, y] of cells) {
      t.save();
      t.translate(x * 0.42 - 0.21, y * 0.42 - 0.21);
      t.scale(0.42, 0.42);
      art.paintGem(t, color);
      t.restore();
    }
  },
});

const INTRO_CARD = {
  basics: () => ({ title: 'How to play', art: scene([gem(0), gem(0), gem(3), '>', gem(0), gem(0), gem(0)]), text: 'Swap two neighbouring gems to make a line of 3 or more of the same colour. Hit every goal at the top before your moves run out.' }),
  line: () => ({ title: 'Line Blaster', art: scene([gem(4), gem(4), gem(4), gem(4), '>', pw(LINE_V, 4)]), text: 'Match 4 in a row to make a Line Blaster. Swap it, or tap it, and it clears a whole row or column (the way its arrows point).' }),
  bomb: () => ({ title: 'Bomb', art: scene([block([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]].map(([x, y]) => [x * 0.66, y * 0.66]), 1), '>', pw(BOMB, 1)]), text: 'Match an L or T shape to make a Bomb. It blows up everything around it.' }),
  crate: () => ({ title: 'Crates', art: scene([{ paint: (t) => art.paintCrate(t, 1) }, gem(2), gem(2), gem(2)]), text: 'Crates break when you make a match right next to them, or hit them with a power-up.' }),
  fly: () => ({ title: 'Butterfly', art: scene([block([[0, 0], [1, 0], [0, 1], [1, 1]], 3), '>', pw(FLY, 3)]), text: 'Match a 2×2 square to make a Butterfly. It clears the gems around it, then flies off to hit something you still need.' }),
  prism: () => ({ title: 'Prism', art: scene([gem(5, { k: 0.8 }), gem(5, { k: 0.8 }), gem(5, { k: 0.8 }), gem(5, { k: 0.8 }), gem(5, { k: 0.8 }), '>', pw(PRISM)]), text: 'Match 5 in a row to make a Prism. Swap it with any gem to clear every gem of that colour.' }),
  ice: () => ({ title: 'Ice', art: scene([{ paint: (t) => { art.paintIce(t, 1); t.save(); t.scale(0.9, 0.9); art.paintGem(t, 4); t.restore(); } }, gem(4), gem(4)]), text: 'Clear the gems sitting on ice to crack it. Break every tile of ice to win.' }),
  combo: () => ({ title: 'Combos!', art: scene([pw(LINE_H, 0), '+', pw(BOMB, 2), '>', { paint: (t) => { t.fillStyle = '#ffe14d'; t.font = '900 0.5px system-ui'; t.textAlign = 'center'; t.textBaseline = 'middle'; t.fillText('✸', 0, 0); } }]), text: 'Swap two power-ups together for a giant combo. A Line Blaster with a Bomb clears three rows and three columns, and a Prism with anything turns a whole colour into it!' }),
  crate2: () => ({ title: 'Tougher crates', art: scene([{ paint: (t) => art.paintCrate(t, 2) }]), text: 'Crates with iron straps take two hits to break.' }),
  chain: () => ({ title: 'Chains', art: scene([{ paint: (t) => { art.paintGem(t, 3); art.paintChain(t); } }, gem(3), gem(3)]), text: 'Chained gems can’t be moved. Match them with other gems, or blast them, to break the chains.' }),
  coin: () => ({ title: 'Coins', art: scene([{ paint: (t) => art.paintCoin(t) }, '>', { paint: (t) => { t.fillStyle = '#ffc93c'; t.beginPath(); t.moveTo(-0.2, -0.1); t.lineTo(0.2, -0.1); t.lineTo(0, 0.2); t.closePath(); t.fill(); } }]), text: 'Clear the gems under the coins to drop them down. Coins that reach the bottom of the board are collected.' }),
  ice2: () => ({ title: 'Thick ice', art: scene([{ paint: (t) => art.paintIce(t, 2) }]), text: 'Thick ice takes two hits: the first leaves thin ice behind.' }),
  crate3: () => ({ title: 'Iron crates', art: scene([{ paint: (t) => art.paintCrate(t, 3) }]), text: 'The toughest crates take three hits.' }),
};

function introCards() {
  const intro = intros(level).find((k) => !save.seen[k] && INTRO_CARD[k]);
  if (intro) {
    save.seen[intro] = true;
    writeSave();
    const c = INTRO_CARD[intro]();
    ui.show(`<h2>${c.title}</h2><img class="intro-art" alt="" src="${c.art}"><p>${c.text}</p>
      <div class="actions"><button class="btn btn-primary" data-action="intro-done">Got it</button></div>`);
  } else levelCard();
}

function showRules() {
  const row = (img, title, text) => `<div class="rule"><img alt="" src="${img}"><div><b>${title}</b><span>${text}</span></div></div>`;
  const small = (items) => scene(items, 256, 192);
  ui.show(`<h2>How to play</h2>
    <div class="rules">
      ${row(small([gem(0, { k: 0.8 }), gem(0, { k: 0.8 }), gem(0, { k: 0.8 })]), 'Match 3', 'Swap neighbouring gems to make lines of 3 or more. Hit the goals before the moves run out.')}
      ${row(small([pw(LINE_H, 4, { k: 1.6 })]), '4 in a row', 'makes a Line Blaster: clears a row or column.')}
      ${row(small([pw(BOMB, 1, { k: 1.6 })]), 'L or T shape', 'makes a Bomb: clears all around it.')}
      ${row(small([pw(FLY, 3, { k: 1.6 })]), '2×2 square', 'makes a Butterfly: flies off to hit what you need.')}
      ${row(small([pw(PRISM, 0, { k: 1.6 })]), '5 in a row', 'makes a Prism: swap it with a gem to clear that whole colour.')}
      ${row(small([pw(LINE_V, 2), pw(BOMB, 5)]), 'Combos', 'Swap two power-ups together. Tap a power-up to set it off where it is.')}
    </div>
    <p class="tip">Each level gives you one Hammer, one Row blast and one Shuffle, and they don't cost a move. Win levels in a row and the next one starts with power-ups already on the board.</p>
    <div class="actions"><button class="btn btn-primary" data-action="close">Got it</button></div>`);
}

function showSettings() {
  ui.show(`<h2>Settings</h2>
    ${switchRow('Sound', 'sound')}
    ${switchRow('Haptics', 'haptics')}
    <div class="row">Level <span class="stepper"><button class="btn btn-soft" data-action="lvl-down" aria-label="Previous">−</button>
      <input id="lvlInput" type="number" inputmode="numeric" min="1" max="${save.n}" value="${level ? level.n : save.n}">
      <button class="btn btn-soft" data-action="lvl-up" aria-label="Next">+</button></span></div>
    <p class="seg-note tip">You're up to level ${save.n} · ★ ${totalStars()}</p>
    <div class="actions">
      <button class="btn btn-primary" data-action="go-level">Play this level</button>
      <button class="btn btn-soft" data-action="restart">Start this level again</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
      <button class="btn btn-soft" data-action="close">Close</button>
    </div>`);
}

const ui = cards({
  go: () => {
    ui.close();
    armHint();
    if (gift.length && !played()) {
      gift.forEach((i, k) => setTimeout(() => {
        ring(i, performance.now(), '#fff6b0', 1.6);
        const p = pieces.get(cellId[i]);
        if (p) p.app = performance.now();
        sound('pop');
        requestDraw();
      }, 150 + k * 220));
    }
  },
  'intro-done': () => introCards(),
  next: () => startLevel(level.n + 1),
  replay: () => startLevel(level.n),
  retry: () => {
    endStreak();
    save.play = null;
    startLevel(level.n);
  },
  restart: () => {
    // Starting again part way through gives up on this go.
    if (state !== 'won' && played()) endStreak();
    save.play = null;
    startLevel(level.n);
  },
  extra: () => {
    endStreak();
    ui.close();
    state = 'ready';
    doMove({ type: 'extra' });
  },
  rules: showRules,
  'lvl-down': () => { const i = $('lvlInput'); i.value = Math.max(1, (+i.value || 1) - 1); },
  'lvl-up': () => { const i = $('lvlInput'); i.value = Math.min(save.n, (+i.value || 0) + 1); },
  'go-level': () => {
    const n = Math.min(save.n, Math.max(1, +$('lvlInput').value || 1));
    if (level && n === level.n && state !== 'won') { ui.close(); return; }
    if (level && state !== 'won' && played()) endStreak();
    startLevel(n, true);
  },
});

$('menuBtn').addEventListener('click', () => {
  sfx('tap');
  if (celebrating) skipCelebration();
  else showSettings();
});
window.addEventListener('keydown', (e) => {
  if (ui.isOpen() || !level) return;
  if (e.key === 'h') showHint(true);
  else if (e.key === 'Escape' && armed) {
    armed = '';
    updateTools();
    requestDraw();
  }
});

// ---- start --------------------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', () => {
  layout();
  if (board) syncFrom(playing && current && current.snap ? current.snap : board);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) savePlay();
  else requestDraw();
});

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.gemSwap = {
    startLevel, doMove, showHint, get board() { return board; }, get level() { return level; }, get state() { return state; },
    get geo() { return geo; }, get save() { return save; }, bestMove: () => bestMove(board),
    unlock(n) { save.n = Math.max(save.n, n); writeSave(); },
  };
}

const params = new URLSearchParams(location.search);
if (location.search) window.history.replaceState(null, '', location.pathname);
layout();
const asked = Number(params.get('level'));
if (asked > 0 && asked <= save.n) startLevel(asked, true);
else startLevel(save.play ? save.play.n : save.n, true);
