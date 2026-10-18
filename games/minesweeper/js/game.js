// Minesweeper: clear every square that isn't a mine. The numbers say how many
// mines touch each square, and every board can be cleared without guessing.

import { MODES, SIZES, makeBoard, neighbours, counts, flood, safeCell } from './logic.js';
import { store, settings, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, toast, confetti, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = ICON[el.dataset.icon];
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

if (settings.minesLongPress === undefined) settings.minesLongPress = true;

const MODE_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard', huge: 'Huge' };
const THEME = { easy: '', medium: 'teal', hard: 'red', huge: 'night' };
const canvas = $('stage');
const g = canvas.getContext('2d');

// ---- saved progress ----------------------------------------------------------------

const SAVE_KEY = 'minesweeper';
const save = (() => {
  const s = store.get(SAVE_KEY, {}) || {};
  const out = { mode: MODES.includes(s.mode) ? s.mode : 'easy', seen: s.seen || {}, runs: s.runs || {} };
  for (const m of MODES) out.runs[m] = Object.assign({ n: 1, solved: 0, best: null, play: null }, out.runs[m]);
  return out;
})();
const writeSave = () => store.set(SAVE_KEY, save);

// ---- the game ------------------------------------------------------------------------

let mode = save.mode;
let board = null; // { mode, n, cols, rows, mines, start, layout }
let N = 0, mines, num, nb, open, flag;
let undoStack = [];
let time = 0, mistakes = 0, hints = 0;
let finished = false;
let boom = -1; // the mine just dug up, until it's undone
let flagMode = false;
let hintCell = -1, hintAt = 0;
const popping = new Map(); // cell -> when its tile lifts off

function startBoard(n, resume = false) {
  n = Math.max(1, Math.floor(n) || 1);
  ui.close();
  board = makeBoard(mode, n);
  N = board.cols * board.rows;
  nb = neighbours(board.cols, board.rows);
  mines = Uint8Array.from(board.layout);
  num = counts(mines, nb);
  open = new Uint8Array(N);
  flag = new Uint8Array(N);
  undoStack = [];
  time = mistakes = hints = 0;
  finished = false;
  boom = -1;
  hintCell = -1;
  popping.clear();
  const play = save.runs[mode].play;
  if (resume && play && play.n === n && play.v === board.v && play.open && play.open.length === N) {
    for (let i = 0; i < N; i++) open[i] = play.open.charCodeAt(i) === 49 ? 1 : 0;
    for (const i of play.flags || []) flag[i] = 1;
    time = play.time || 0;
    mistakes = play.mistakes || 0;
    hints = play.hints || 0;
  } else {
    flood(board.start, num, open, nb);
  }
  for (const t of ['teal', 'red', 'night']) document.body.classList.toggle(`theme-${t}`, THEME[mode] === t);
  $('levelLabel').textContent = `${MODE_NAME[mode].toUpperCase()} ${n}`;
  layout(true);
  updateHud();
  savePlay();
  intro();
}

function savePlay() {
  if (!board) return;
  save.runs[mode].play = finished ? null : {
    n: board.n, v: board.v, time, mistakes, hints,
    open: Array.from(open, (o) => (o ? '1' : '0')).join(''),
    flags: [...flag.keys()].filter((i) => flag[i]),
  };
  writeSave();
}

const flagsUsed = () => flag.reduce((s, f) => s + f, 0);

function updateHud() {
  $('minesLeft').textContent = String(board.mines - flagsUsed());
  $('timer').textContent = clock(time);
  $('undoBtn').disabled = finished || (!undoStack.length && boom < 0);
  $('flagBtn').classList.toggle('on', flagMode);
  $('flagLabel').textContent = flagMode ? 'Flag: on' : 'Flag: off';
}

function dig(i, quiet = false) {
  if (finished || boom >= 0 || open[i] || flag[i]) return;
  hintCell = -1;
  if (mines[i]) return explode(i);
  const opened = flood(i, num, open, nb);
  undoStack.push({ opened, flagged: [] });
  ripple(opened, i);
  if (!quiet) sfx(opened.length > 1 ? 'whoosh' : 'tap');
  afterMove();
}

// Tapping an open number with all its mines flagged digs the rest round it.
function chord(i) {
  if (finished || boom >= 0 || !open[i] || !num[i]) return;
  const around = nb[i].filter((j) => !open[j]);
  const flagged = around.filter((j) => flag[j]).length;
  if (flagged !== num[i] || flagged === around.length) {
    sfx('nope');
    chordFlash = { i, at: performance.now() };
    requestDraw();
    return;
  }
  const hit = around.find((j) => !flag[j] && mines[j]);
  if (hit !== undefined) return explode(hit);
  const opened = [];
  for (const j of around) if (!flag[j] && !open[j]) opened.push(...flood(j, num, open, nb));
  undoStack.push({ opened, flagged: [] });
  ripple(opened, i);
  sfx('whoosh');
  afterMove();
}
let chordFlash = null;

function toggleFlag(i) {
  if (finished || boom >= 0 || open[i]) return;
  hintCell = -1;
  flag[i] ^= 1;
  undoStack.push({ opened: [], flagged: [i] });
  sfx(flag[i] ? 'write' : 'tap');
  haptic();
  afterMove();
}

function explode(i) {
  boom = i;
  mistakes++;
  sfx('bump');
  haptic();
  shakeAt = performance.now();
  updateHud();
  requestDraw();
  setTimeout(() => {
    if (boom < 0) return;
    ui.show(`<h2>Boom!</h2><p>That one was a mine. Every square can be worked out from the numbers, so no guessing needed. Take it back and look again?</p>
      <div class="actions"><button class="btn btn-primary" data-action="undo">Undo that tap</button>
      <button class="btn btn-soft" data-action="restart">Start this board again</button></div>`);
  }, 650);
}
let shakeAt = 0;

function undo() {
  if (finished) return;
  if (boom >= 0) {
    boom = -1;
  } else {
    const u = undoStack.pop();
    if (!u) return;
    for (const c of u.opened) open[c] = 0;
    for (const c of u.flagged) flag[c] ^= 1;
  }
  hintCell = -1;
  sfx('tap');
  updateHud();
  savePlay();
  requestDraw();
}

function afterMove() {
  let shut = 0;
  for (let i = 0; i < N; i++) if (!open[i]) shut++;
  if (shut === board.mines) return win();
  updateHud();
  savePlay();
  requestDraw();
}

function win() {
  finished = true;
  for (let i = 0; i < N; i++) if (mines[i]) flag[i] = 1;
  const run = save.runs[mode];
  run.solved++;
  const best = run.best === null || time < run.best;
  if (best) run.best = time;
  run.n = Math.max(run.n, board.n + 1);
  run.play = null;
  writeSave();
  updateHud();
  requestDraw();
  setTimeout(() => { sfx('win'); haptic(); confetti(); }, 250);
  setTimeout(() => {
    ui.show(`<h2>${MODE_NAME[mode]} ${board.n} cleared!</h2>
      <div class="stats"><div><b>${clock(time)}</b><span>Time</span></div><div><b>${mistakes}</b><span>Mines hit</span></div><div><b>${hints}</b><span>Hints</span></div></div>
      <p class="best">${best ? 'A new best time!' : `Best time: ${clock(run.best)}`}</p>
      <div class="actions"><button class="btn btn-primary" data-action="next">Next board</button></div>`);
  }, 1100);
}

function hint() {
  if (finished || !board) return;
  if (boom >= 0) { undo(); return; }
  // A wrong flag gets pointed out first.
  const wrong = [...flag.keys()].find((i) => flag[i] && !mines[i]);
  if (wrong !== undefined) {
    flag[wrong] = 0;
    undoStack.push({ opened: [], flagged: [wrong] });
    hints++;
    show(wrong);
    toast('That flag was wrong, so it’s been taken off.');
    sfx('hint');
    afterMove();
    return;
  }
  const c = safeCell(num, open, nb, board.mines);
  if (c < 0) { toast('Nothing certain right now. Look around the edges.'); return; }
  hints++;
  show(c);
  hintCell = c;
  hintAt = performance.now();
  toast('This square is safe. The numbers around it prove it.');
  sfx('hint');
  requestDraw();
}

// ---- view: where the board sits, and how big a square is -------------------------------

let W = 0, H = 0, dpr = 1;
let area = { x: 0, y: 0, w: 0, h: 0 };
let view = { ox: 0, oy: 0, s: 20 };
let fitS = 20;
let anim = null; // { from, to, start }
const MAX_S = 48, COMFY = 32;

function layout(reset = false) {
  W = innerWidth;
  H = innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  if (!board) return;
  const top = $('topbar').getBoundingClientRect().bottom + 34;
  const bottom = $('tools').getBoundingClientRect().top - 12;
  area = { x: 8, y: top, w: W - 16, h: bottom - top };
  fitS = Math.min(area.w / board.cols, area.h / board.rows, MAX_S);
  if (reset) {
    anim = null;
    // Big boards start zoomed in on the open patch; small ones show whole.
    if (fitS < 24) view = centredOn(board.start, COMFY);
    else view = fitted();
  }
  clampView(view);
  requestDraw();
}

function fitted() {
  return { s: fitS, ox: area.x + (area.w - fitS * board.cols) / 2, oy: area.y + (area.h - fitS * board.rows) / 2 };
}

function centredOn(i, s) {
  const r = (i / board.cols) | 0, c = i % board.cols;
  const v = { s, ox: area.x + area.w / 2 - (c + 0.5) * s, oy: area.y + area.h / 2 - (r + 0.5) * s };
  clampView(v);
  return v;
}

// Keep the board from being dragged out of sight.
function clampView(v) {
  const bw = v.s * board.cols, bh = v.s * board.rows;
  if (bw <= area.w) v.ox = area.x + (area.w - bw) / 2;
  else v.ox = Math.min(area.x, Math.max(area.x + area.w - bw, v.ox));
  if (bh <= area.h) v.oy = area.y + (area.h - bh) / 2;
  else v.oy = Math.min(area.y, Math.max(area.y + area.h - bh, v.oy));
}

function zoomAt(s, x, y) {
  s = Math.max(fitS, Math.min(Math.max(fitS, MAX_S), s));
  const k = s / view.s;
  view = { s, ox: x - (x - view.ox) * k, oy: y - (y - view.oy) * k };
  clampView(view);
  anim = null;
  requestDraw();
}

function animateTo(to) {
  anim = { from: { ...view }, to, start: performance.now() };
  requestDraw();
}

// Bring cell i into comfortable view.
function show(i) {
  const s = Math.max(view.s, Math.min(COMFY, Math.max(fitS, MAX_S)));
  const r = (i / board.cols) | 0, c = i % board.cols;
  const x = view.ox + (c + 0.5) * view.s, y = view.oy + (r + 0.5) * view.s;
  const inside = x > area.x + view.s && x < area.x + area.w - view.s && y > area.y + view.s && y < area.y + area.h - view.s;
  if (inside && view.s >= Math.min(COMFY, fitS * 1.01)) return;
  animateTo(centredOn(i, s));
}

function cellAt(x, y) {
  const c = Math.floor((x - view.ox) / view.s), r = Math.floor((y - view.oy) / view.s);
  if (c < 0 || r < 0 || c >= board.cols || r >= board.rows) return -1;
  return r * board.cols + c;
}

// ---- touch and mouse ----------------------------------------------------------------

const pointers = new Map();
let gesture = null;
let pressTimer = 0;

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!board || ui.isOpen()) return;
  try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported */ }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  clearTimeout(pressTimer);
  if (pointers.size === 1) {
    if (e.button === 2) return; // right-click flags, below
    const cell = cellAt(e.clientX, e.clientY);
    gesture = { kind: 'tap', x0: e.clientX, y0: e.clientY, cell };
    if (cell >= 0 && settings.minesLongPress && !open[cell]) {
      pressTimer = setTimeout(() => {
        if (gesture && gesture.kind === 'tap') {
          gesture.kind = 'done';
          toggleFlag(cell);
        }
      }, 380);
    }
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    gesture = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), s0: view.s, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, ox: view.ox, oy: view.oy };
  }
});

canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p || !gesture) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (gesture.kind === 'tap' && Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > 9) {
    gesture.kind = 'pan';
    clearTimeout(pressTimer);
  }
  if (gesture.kind === 'pan') {
    view.ox += dx;
    view.oy += dy;
    clampView(view);
    anim = null;
    requestDraw();
  } else if (gesture.kind === 'pinch' && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const s = Math.max(fitS, Math.min(Math.max(fitS, MAX_S), (gesture.s0 * d) / Math.max(1, gesture.d0)));
    const k = s / gesture.s0;
    view = { s, ox: mx - (gesture.mx - gesture.ox) * k, oy: my - (gesture.my - gesture.oy) * k };
    clampView(view);
    anim = null;
    requestDraw();
  }
});

function endPointer(e, cancelled) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  clearTimeout(pressTimer);
  if (gesture && gesture.kind === 'tap' && !cancelled && pointers.size === 0) tap(gesture.cell);
  if (pointers.size === 0) gesture = null;
  else if (gesture && gesture.kind === 'pinch') gesture = { kind: 'done' };
}
canvas.addEventListener('pointerup', (e) => endPointer(e, false));
canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (!board || ui.isOpen()) return;
  const cell = cellAt(e.clientX, e.clientY);
  if (cell >= 0) toggleFlag(cell);
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (board) zoomAt(view.s * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
}, { passive: false });

function tap(cell) {
  if (cell < 0 || finished || boom >= 0) return;
  if (open[cell]) chord(cell);
  else if (flagMode) toggleFlag(cell);
  else if (flag[cell]) { sfx('nope'); toast('That square is flagged. Switch Flag on, or long-press, to take the flag off.'); }
  else dig(cell);
}

// ---- drawing --------------------------------------------------------------------------

const NUM_COLORS = ['', '#2f5bd9', '#1f9d55', '#e8413c', '#5228a8', '#a3213f', '#0c8a8a', '#1d2340', '#7b8396'];
let raf = 0;

function requestDraw() {
  if (!raf) raf = requestAnimationFrame(frame);
}

function frame(now) {
  raf = 0;
  if (draw(now)) requestDraw();
}

// Opened squares lift away in a ripple out from where you tapped.
function ripple(cells, from) {
  const now = performance.now();
  const fr = (from / board.cols) | 0, fc = from % board.cols;
  for (const c of cells) {
    const d = Math.max(Math.abs(((c / board.cols) | 0) - fr), Math.abs((c % board.cols) - fc));
    popping.set(c, now + Math.min(d, 24) * 16);
  }
}

function draw(now) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  if (!board) return false;
  let moving = false;
  if (anim) {
    const k = Math.min(1, (now - anim.start) / 280), e = k * k * (3 - 2 * k);
    view = {
      s: anim.from.s + (anim.to.s - anim.from.s) * e,
      ox: anim.from.ox + (anim.to.ox - anim.from.ox) * e,
      oy: anim.from.oy + (anim.to.oy - anim.from.oy) * e,
    };
    if (k >= 1) anim = null;
    moving = true;
  }
  let { ox, oy, s } = view;
  if (boom >= 0 && now - shakeAt < 420) {
    const k = (now - shakeAt) / 420;
    ox += Math.sin(k * 40) * (1 - k) * 6;
    moving = true;
  }
  const { cols, rows } = board;
  // The board's backing.
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  g.beginPath();
  g.roundRect(ox - 4, oy - 4, cols * s + 8, rows * s + 8, Math.min(14, s * 0.5));
  g.fill();

  const c0 = Math.max(0, Math.floor((area.x - ox) / s) - 1), c1 = Math.min(cols - 1, Math.ceil((area.x + area.w - ox) / s));
  const r0 = Math.max(0, Math.floor((0 - oy) / s) - 1), r1 = Math.min(rows - 1, Math.ceil((H - oy) / s));
  const gap = Math.max(0.6, s * 0.06), rad = s * 0.2;
  const fontPx = Math.round(s * 0.62);
  g.font = `900 ${fontPx}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const i = r * cols + c;
      const x = ox + c * s, y = oy + r * s;
      const odd = (r + c) & 1;
      if (open[i]) {
        g.fillStyle = odd ? '#e7ecf9' : '#eef2fb';
        g.fillRect(x, y, s, s);
        if (num[i] && fontPx >= 6) {
          g.fillStyle = NUM_COLORS[num[i]];
          g.fillText(String(num[i]), x + s / 2, y + s / 2 + s * 0.04);
        }
        const t0 = popping.get(i);
        if (t0 !== undefined) {
          const k = (now - t0) / 170;
          if (k >= 1) popping.delete(i);
          else {
            moving = true;
            tile(x, y, s, gap, rad, odd, Math.max(0, k), now < t0 ? 1 : 1 - k);
          }
        }
      } else {
        tile(x, y, s, gap, rad, odd, 0, 1);
        if (flag[i]) drawFlag(x, y, s, finished && mines[i]);
        // Only the mine you hit shows: you can undo, so the rest stay secret.
        else if (i === boom) drawMine(x, y, s, true);
      }
    }
  }
  if (chordFlash) {
    const k = (now - chordFlash.at) / 400;
    if (k >= 1) chordFlash = null;
    else {
      moving = true;
      g.strokeStyle = `rgba(255, 56, 150, ${0.8 * (1 - k)})`;
      g.lineWidth = Math.max(2, s * 0.08);
      for (const j of nb[chordFlash.i]) {
        if (open[j]) continue;
        g.strokeRect(ox + (j % cols) * s + gap, oy + ((j / cols) | 0) * s + gap, s - 2 * gap, s - 2 * gap);
      }
    }
  }
  if (hintCell >= 0 && !open[hintCell]) {
    const pulse = 0.5 + 0.5 * Math.sin((now - hintAt) / 160);
    g.strokeStyle = `rgba(255, 56, 150, ${0.45 + 0.5 * pulse})`;
    g.lineWidth = Math.max(3, s * 0.12);
    g.beginPath();
    g.roundRect(ox + (hintCell % cols) * s + gap, oy + ((hintCell / cols) | 0) * s + gap, s - 2 * gap, s - 2 * gap, rad);
    g.stroke();
    moving = now - hintAt < 9000;
    if (!moving) hintCell = -1;
  }
  return moving;
}

// A raised square. k: how far it has lifted off (0 = in place).
function tile(x, y, s, gap, rad, odd, k, alpha) {
  const shrink = (s - 2 * gap) * k * 0.5;
  g.globalAlpha = alpha;
  g.fillStyle = odd ? '#7d8df4' : '#8b9af8';
  g.beginPath();
  g.roundRect(x + gap + shrink, y + gap + shrink, s - 2 * gap - 2 * shrink, s - 2 * gap - 2 * shrink, rad);
  g.fill();
  if (s >= 10 && k === 0) {
    g.fillStyle = 'rgba(255, 255, 255, 0.22)';
    g.beginPath();
    g.roundRect(x + gap * 2, y + gap * 1.6, s - 4 * gap, (s - 2 * gap) * 0.32, rad * 0.7);
    g.fill();
  }
  g.globalAlpha = 1;
}

function drawFlag(x, y, s, sure) {
  g.strokeStyle = '#1d2340';
  g.lineWidth = Math.max(1, s * 0.07);
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x + s * 0.36, y + s * 0.78);
  g.lineTo(x + s * 0.36, y + s * 0.2);
  g.stroke();
  g.fillStyle = sure ? '#22c55e' : '#ff4d3d';
  g.beginPath();
  g.moveTo(x + s * 0.38, y + s * 0.2);
  g.lineTo(x + s * 0.76, y + s * 0.36);
  g.lineTo(x + s * 0.38, y + s * 0.52);
  g.closePath();
  g.fill();
}

function drawMine(x, y, s, hit) {
  if (hit) {
    g.fillStyle = '#ff4d3d';
    g.beginPath();
    g.roundRect(x + 1, y + 1, s - 2, s - 2, s * 0.2);
    g.fill();
  }
  const cx = x + s / 2, cy = y + s / 2, r = s * 0.22;
  g.strokeStyle = '#1d2340';
  g.lineWidth = Math.max(1, s * 0.07);
  g.beginPath();
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 4;
    g.moveTo(cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 1.5);
    g.lineTo(cx - Math.cos(a) * r * 1.5, cy - Math.sin(a) * r * 1.5);
  }
  g.stroke();
  g.fillStyle = '#1d2340';
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(cx - r * 0.35, cy - r * 0.35, r * 0.25, 0, Math.PI * 2);
  g.fill();
}

const clock = (t) => (t >= 3600 ? `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}` : `${Math.floor(t / 60)}`) + `:${String(t % 60).padStart(2, '0')}`;

// ---- timer ----------------------------------------------------------------------------

setInterval(() => {
  if (!board || finished || boom >= 0 || document.hidden || ui.isOpen()) return;
  time++;
  $('timer').textContent = clock(time);
  if (time % 10 === 0) savePlay();
}, 1000);

// ---- cards ----------------------------------------------------------------------------

const MINI = (cells) => {
  // A tiny 3x3 board picture: '#' closed, 'F' flag, digits open.
  let s = '';
  cells.forEach((ch, k) => {
    const x = 6 + (k % 3) * 18, y = 2 + ((k / 3) | 0) * 15;
    if (ch === '#' || ch === 'F') s += `<rect x="${x}" y="${y}" width="16" height="13" rx="3" fill="#8b9af8"/>`;
    else s += `<rect x="${x}" y="${y}" width="16" height="13" fill="#eef2fb"/>${ch === ' ' ? '' : `<text x="${x + 8}" y="${y + 11}" font-size="11" font-weight="900" text-anchor="middle" fill="${NUM_COLORS[+ch]}">${ch}</text>`}`;
    if (ch === 'F') s += `<path d="M${x + 6} ${y + 11}V${y + 2}l6 3-6 3" fill="#ff4d3d" stroke="#1d2340" stroke-width="1.2"/>`;
  });
  return `<svg viewBox="0 0 64 48">${s}</svg>`;
};

function showRules() {
  ui.show(`<h2>How to play</h2>
    <div class="rules">
      <div class="rule">${MINI(['1', '1', '1', '1', '#', '1', '1', '1', '1'])}
        <div><b>Numbers count mines</b><span>Each number says how many of the 8 squares around it hide a mine.</span></div></div>
      <div class="rule">${MINI([' ', '1', '#', ' ', '1', '#', ' ', '1', '#'])}
        <div><b>Tap to dig</b><span>Dig every square that isn't a mine to win. Drag to move around, pinch to zoom.</span></div></div>
      <div class="rule">${MINI(['2', 'F', '#', '2', 'F', '#', '1', '1', '1'])}
        <div><b>Long-press to flag</b><span>Or turn Flag on. Tapping a number whose mines are all flagged digs the rest around it.</span></div></div>
      <div class="rule">${MINI(['1', '2', '1', ' ', ' ', ' ', '1', '1', '1'])}
        <div><b>No guessing, ever</b><span>Every board can be cleared by logic alone. Hit a mine? Just undo that tap.</span></div></div>
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

function showSettings() {
  const tab = (m) => `<button class="seg-btn${m === mode ? ' on' : ''}" data-action="mode" data-mode="${m}">${MODE_NAME[m]}</button>`;
  const run = save.runs[mode], size = SIZES[mode];
  ui.show(`<h2>Settings</h2>
    <div class="seg">${MODES.map(tab).join('')}</div>
    <p class="seg-note tip">${size.cols}×${size.rows}, ${size.mines} mines · ${run.solved} cleared${run.best !== null ? ` · best ${clock(run.best)}` : ''}</p>
    ${switchRow('Sound', 'sound')}
    ${switchRow('Haptics', 'haptics')}
    ${switchRow('Long-press to flag', 'minesLongPress')}
    <div class="row">Board <span class="stepper"><button class="btn btn-soft" data-action="num-down" aria-label="Previous">−</button>
      <input id="numInput" type="number" inputmode="numeric" min="1" value="${board ? board.n : run.n}">
      <button class="btn btn-soft" data-action="num-up" aria-label="Next">+</button></span></div>
    <div class="actions">
      <button class="btn btn-primary" data-action="go">Play this board</button>
      <button class="btn btn-soft" data-action="restart">Start this one again</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
      <button class="btn btn-soft" data-action="close">Close</button>
    </div>`);
}

function switchMode(m) {
  if (!MODES.includes(m) || m === mode) return;
  savePlay();
  mode = m;
  save.mode = m;
  writeSave();
  const run = save.runs[m];
  startBoard(run.play ? run.play.n : run.n, true);
}

const ui = cards({
  next: () => startBoard(board.n + 1),
  undo: () => { ui.close(); undo(); },
  restart: () => { save.runs[mode].play = null; startBoard(board.n); },
  rules: showRules,
  mode: (el) => switchMode(el.dataset.mode),
  'num-down': () => { const i = $('numInput'); i.value = Math.max(1, (+i.value || 1) - 1); },
  'num-up': () => { const i = $('numInput'); i.value = (+i.value || 0) + 1; },
  go: () => startBoard(+$('numInput').value || 1, true),
});

$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });
$('undoBtn').addEventListener('click', undo);
$('hintBtn').addEventListener('click', hint);
$('flagBtn').addEventListener('click', () => { flagMode = !flagMode; sfx('tap'); updateHud(); });
$('viewBtn').addEventListener('click', () => {
  sfx('tap');
  // Toggle between the whole board and a close-up of the middle of the screen.
  if (view.s > fitS * 1.05) animateTo(fitted());
  else {
    const i = cellAt(area.x + area.w / 2, area.y + area.h / 2);
    animateTo(centredOn(i < 0 ? board.start : i, Math.max(fitS, Math.min(COMFY, MAX_S))));
  }
});
window.addEventListener('keydown', (e) => {
  if (ui.isOpen() || !board) return;
  if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'u') undo();
  else if (e.key === 'h') hint();
  else if (e.key === 'f') { flagMode = !flagMode; updateHud(); }
});

// ---- start ----------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', () => layout(false));
document.addEventListener('visibilitychange', () => { if (document.hidden) savePlay(); });

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.minesweeper = { startBoard, dig, chord, toggleFlag, hint, undo, tap, get board() { return board; }, get open() { return open; }, get mines() { return mines; }, get num() { return num; }, get view() { return view; }, get finished() { return finished; }, cellAt };
}

const params = new URLSearchParams(location.search);
if (MODES.includes(params.get('mode'))) {
  mode = params.get('mode');
  save.mode = mode;
  writeSave();
}
if (location.search) window.history.replaceState(null, '', location.pathname);
const asked = Number(params.get('n'));
if (asked > 0) startBoard(asked, true);
else {
  const run = save.runs[mode];
  startBoard(run.play ? run.play.n : run.n, true);
}
