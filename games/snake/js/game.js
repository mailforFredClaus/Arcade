// Snake: the screen. Steps the rules in engine.js a few times a second,
// draws the snake sliding smoothly from cell to cell, and looks after the
// swipes, keys, sounds, best scores and menus.

import { Snake, COLS, ROWS, DIRS, STAR_STEPS } from './engine.js';
import { store, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, confetti, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

const canvas = $('stage'), g = canvas.getContext('2d');
const TAU = Math.PI * 2;
const touch = matchMedia('(pointer: coarse)').matches;

// ---- saved things ---------------------------------------------------------------------

// wrap and speed: how you like to play. best: the top score for each way of
// playing. long: the longest snake ever. seen: the how-to-play card was shown.
const SAVE_KEY = 'snake';
const save = Object.assign({ wrap: false, speed: 'normal', best: {}, long: 0, games: 0, seen: false }, store.get(SAVE_KEY, {}) || {});
const writeSave = () => store.set(SAVE_KEY, save);
const SPEED_NAME = { slow: 'Slow', normal: 'Normal', fast: 'Fast' };
const bestKey = () => `${save.wrap ? 'wrap' : 'walls'}-${save.speed}`;
const best = () => save.best[bestKey()] || 0;

// ---- the game -------------------------------------------------------------------------

let game = null;
// 'ready': waiting for a swipe to set off (at the start, or after a pause).
// 'play': moving. 'dying': just crashed. 'over': finished.
let phase = 'ready';
let acc = 0; // how far through the current step, 0 to 1
let diedAt = 0, record = false;

function newGame() {
  game = new Snake({ wrap: save.wrap, speed: save.speed, seed: (Math.random() * 2 ** 32) >>> 0 });
  phase = 'ready';
  acc = 1;
  record = false;
  parts.length = 0;
  floats.length = 0;
  updateHud();
}

function updateHud() {
  $('score').textContent = String(game.score);
  $('bestLabel').textContent = `BEST ${Math.max(best(), game.score)}`;
  $('modeTag').textContent = `${save.wrap ? 'NO WALLS' : 'WALLS'} · ${SPEED_NAME[save.speed].toUpperCase()}`;
}

// A swipe or a key: turn, setting off first if the snake is waiting.
function steer(dir) {
  if (ui.isOpen() || !DIRS[dir]) return;
  if (phase === 'over') return;
  if (phase === 'ready') {
    game.turn(dir);
    phase = 'play';
    // Take the first step straight away, so it answers at once.
    acc = 0;
    tick();
    return;
  }
  if (phase === 'play') game.turn(dir);
}

function pause() {
  if (phase === 'play') {
    phase = 'ready';
    acc = 1;
  }
}

function tick() {
  const apple = game.apple, star = game.star;
  const r = game.step();
  if (r.ate) {
    sfx('pop');
    haptic();
    burst(apple, ['#ff5a5f', '#ff8a8e', '#ffd1d3']);
    float(apple, '+10', '#ffffff');
    if (game.star >= 0 && star < 0) sfx('hint');
  }
  if (r.star) {
    sfx('chime');
    haptic();
    burst(star, ['#ffd23f', '#fff3a8', '#ffffff']);
    float(star, `+${r.star}`, '#ffe14d');
  }
  if (r.ate || r.star) {
    if (!record && best() > 0 && game.score > best()) {
      record = true;
      float(game.head, 'New best!', '#ffe14d', 1.5);
      sfx('star');
    }
    updateHud();
  }
  if (r.dead || r.won) finish(r.won);
}

function finish(won) {
  phase = 'dying';
  diedAt = performance.now();
  if (!won) {
    sfx('crash');
    haptic();
  }
  save.games++;
  const before = best();
  if (game.score > before) save.best[bestKey()] = game.score;
  save.long = Math.max(save.long, game.length);
  writeSave();
  setTimeout(() => {
    if (phase !== 'dying') return;
    phase = 'over';
    showOver(won, game.score > before && game.score > 0);
  }, won ? 500 : 900);
}

// ---- where things go ------------------------------------------------------------------

let W = 0, H = 0, dpr = 1, cell = 20, ox = 0, oy = 0;
let board = null; // the grass, drawn once per size

function layout() {
  W = innerWidth;
  H = innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const top = $('topbar').getBoundingClientRect().bottom + 16;
  const bottom = $('foot').getBoundingClientRect().top - 6;
  cell = Math.max(8, Math.floor(Math.min((W - 28) / COLS, (bottom - top) / ROWS, 40)));
  ox = Math.round((W - cell * COLS) / 2);
  oy = Math.round(top + (bottom - top - cell * ROWS) / 2);
  // The grass: a frame, and squares of two greens.
  board = document.createElement('canvas');
  board.width = canvas.width;
  board.height = canvas.height;
  const b = board.getContext('2d');
  b.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pad = Math.max(5, cell * 0.3);
  b.shadowColor = 'rgba(7, 60, 50, 0.35)';
  b.shadowBlur = 18;
  b.shadowOffsetY = 6;
  b.fillStyle = '#2e7d4f';
  b.beginPath();
  b.roundRect(ox - pad, oy - pad, cell * COLS + 2 * pad, cell * ROWS + 2 * pad, pad * 1.6);
  b.fill();
  b.shadowColor = 'transparent';
  b.fillStyle = '#a8dc66';
  b.fillRect(ox, oy, cell * COLS, cell * ROWS);
  b.fillStyle = '#9dd35a';
  for (let y = 0; y < ROWS; y++) for (let x = (y + 1) % 2; x < COLS; x += 2) b.fillRect(ox + x * cell, oy + y * cell, cell, cell);
}

// The middle of a cell, in cells.
const mid = (c) => [(c % COLS) + 0.5, Math.floor(c / COLS) + 0.5];
// The way from cell a to the next cell b, even when that goes round the edge.
function way(a, b) {
  let dx = (b % COLS) - (a % COLS), dy = Math.floor(b / COLS) - Math.floor(a / COLS);
  if (dx > 1) dx = -1; else if (dx < -1) dx = 1;
  if (dy > 1) dy = -1; else if (dy < -1) dy = 1;
  return [dx, dy];
}

// The snake as lines to draw, t of the way through its step. Usually one
// line from tail to head; where it goes off one edge and comes back on the
// other, the line is cut in two there. Also where the head is (in both
// places, while it's crossing an edge).
function shape(t) {
  const b = game.body, last = b.length - 1;
  const lines = [], heads = [];
  let cur = [];
  const tail = mid(b[last]);
  if (game.dropped >= 0 && t < 1) {
    // The tail end is still sliding out of the cell it has just left.
    const p = mid(game.dropped), d = way(game.dropped, b[last]);
    const from = [p[0] + d[0] * t, p[1] + d[1] * t];
    if (p[0] + d[0] === tail[0] && p[1] + d[1] === tail[1]) cur.push(from);
    else {
      lines.push([from, [p[0] + d[0], p[1] + d[1]]]);
      cur.push([tail[0] - d[0] * (1 - t), tail[1] - d[1] * (1 - t)]);
    }
  }
  cur.push(tail);
  for (let i = last - 1; i >= 1; i--) {
    const p = mid(b[i + 1]), q = mid(b[i]), d = way(b[i + 1], b[i]);
    if (p[0] + d[0] === q[0] && p[1] + d[1] === q[1]) cur.push(q);
    else {
      cur.push([p[0] + d[0], p[1] + d[1]]);
      lines.push(cur);
      cur = [[q[0] - d[0], q[1] - d[1]], q];
    }
  }
  const p = mid(b[1]), q = mid(b[0]), d = way(b[1], b[0]);
  const at = [p[0] + d[0] * t, p[1] + d[1] * t];
  cur.push(at);
  heads.push({ x: at[0], y: at[1], d });
  if (!(p[0] + d[0] === q[0] && p[1] + d[1] === q[1])) {
    lines.push(cur);
    const back = [q[0] - d[0] * (1 - t), q[1] - d[1] * (1 - t)];
    cur = [[q[0] - d[0], q[1] - d[1]], back];
    heads.push({ x: back[0], y: back[1], d });
  }
  lines.push(cur);
  return { lines, heads };
}

// ---- little effects -------------------------------------------------------------------

const parts = [], floats = [];
let shakeAt = -1e9;

function burst(c, colors) {
  const [x, y] = mid(c);
  for (let k = 0; k < 12; k++) {
    const a = Math.random() * TAU, v = 3 + Math.random() * 5;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, t0: performance.now(), life: 320 + Math.random() * 260, color: colors[k % colors.length], size: 0.1 + Math.random() * 0.1 });
  }
}

function float(c, text, color, size = 1) {
  const [x, y] = mid(c);
  floats.push({ x, y, text, color, size, t0: performance.now() });
}

// ---- drawing --------------------------------------------------------------------------

function stroke(line, width, color) {
  g.lineWidth = width;
  g.strokeStyle = color;
  g.beginPath();
  g.moveTo(line[0][0], line[0][1]);
  for (let k = 1; k < line.length; k++) g.lineTo(line[k][0], line[k][1]);
  // (A line of no length still wants its round end drawn.)
  if (line.length === 1) g.lineTo(line[0][0] + 0.001, line[0][1]);
  g.stroke();
}

function drawApple(now) {
  const [x, y] = mid(game.apple), k = 1 + 0.06 * Math.sin(now / 220);
  g.save();
  g.translate(x, y + 0.04);
  g.scale(k, k);
  g.fillStyle = 'rgba(20, 70, 30, 0.22)';
  g.beginPath();
  g.ellipse(0, 0.34, 0.26, 0.07, 0, 0, TAU);
  g.fill();
  const body = new Path2D();
  body.moveTo(0, -0.2);
  body.bezierCurveTo(-0.16, -0.36, -0.44, -0.22, -0.4, 0.06);
  body.bezierCurveTo(-0.37, 0.28, -0.2, 0.4, -0.08, 0.36);
  body.quadraticCurveTo(0, 0.32, 0.08, 0.36);
  body.bezierCurveTo(0.2, 0.4, 0.37, 0.28, 0.4, 0.06);
  body.bezierCurveTo(0.44, -0.22, 0.16, -0.36, 0, -0.2);
  const red = g.createRadialGradient(-0.12, -0.08, 0.03, 0, 0.05, 0.45);
  red.addColorStop(0, '#ff9a9e');
  red.addColorStop(0.45, '#ff4d55');
  red.addColorStop(1, '#c81e2b');
  g.fillStyle = red;
  g.fill(body);
  g.lineWidth = 0.045;
  g.strokeStyle = '#8f1220';
  g.lineJoin = 'round';
  g.stroke(body);
  g.strokeStyle = '#6b3d1a';
  g.lineWidth = 0.06;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, -0.2);
  g.quadraticCurveTo(0.01, -0.33, 0.07, -0.4);
  g.stroke();
  g.fillStyle = '#3fae4f';
  g.beginPath();
  g.moveTo(0.05, -0.3);
  g.quadraticCurveTo(0.2, -0.46, 0.34, -0.36);
  g.quadraticCurveTo(0.22, -0.24, 0.05, -0.3);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.8)';
  g.beginPath();
  g.ellipse(-0.2, -0.08, 0.07, 0.04, -0.8, 0, TAU);
  g.fill();
  g.restore();
}

function drawStar(now, t) {
  const [x, y] = mid(game.star);
  const left = Math.max(0, (game.starLeft - (phase === 'play' ? t : 0)) / STAR_STEPS);
  g.save();
  g.translate(x, y);
  // How long it has left, as a ring running down.
  g.lineWidth = 0.09;
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.arc(0, 0, 0.46, 0, TAU);
  g.stroke();
  g.strokeStyle = left < 0.3 ? '#ff5a5f' : '#ffffff';
  g.beginPath();
  g.arc(0, 0, 0.46, -Math.PI / 2, -Math.PI / 2 + TAU * left);
  g.stroke();
  g.rotate(Math.sin(now / 300) * 0.25);
  const k = 1 + 0.08 * Math.sin(now / 150);
  g.scale(k, k);
  g.beginPath();
  for (let j = 0; j < 10; j++) {
    const a = -Math.PI / 2 + (j * Math.PI) / 5, r = j % 2 ? 0.16 : 0.36;
    g[j ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  const gold = g.createLinearGradient(0, -0.36, 0, 0.36);
  gold.addColorStop(0, '#fff3a8');
  gold.addColorStop(0.5, '#ffd23f');
  gold.addColorStop(1, '#f09a00');
  g.fillStyle = gold;
  g.fill();
  g.lineWidth = 0.045;
  g.lineJoin = 'round';
  g.strokeStyle = '#a86a00';
  g.stroke();
  g.restore();
}

function drawHead(h, now, dead) {
  const a = Math.atan2(h.d[1], h.d[0]);
  g.save();
  g.translate(h.x, h.y);
  g.rotate(a);
  // The tongue flicks out now and then.
  const flick = (now % 2600) / 260;
  if (!dead && flick < 1) {
    const len = 0.28 * Math.sin(Math.PI * flick);
    g.strokeStyle = '#ff4d55';
    g.lineWidth = 0.07;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0.38, 0);
    g.lineTo(0.42 + len, 0);
    g.moveTo(0.42 + len, 0);
    g.lineTo(0.5 + len, -0.08);
    g.moveTo(0.42 + len, 0);
    g.lineTo(0.5 + len, 0.08);
    g.stroke();
  }
  g.fillStyle = dead ? '#5f6880' : '#2638a8';
  g.beginPath();
  g.ellipse(0.02, 0, 0.5, 0.47, 0, 0, TAU);
  g.fill();
  g.fillStyle = dead ? '#8b93a7' : '#5876ff';
  g.beginPath();
  g.ellipse(0.02, 0, 0.42, 0.39, 0, 0, TAU);
  g.fill();
  for (const s of [-1, 1]) {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(0.12, s * 0.2, 0.135, 0, TAU);
    g.fill();
    if (dead) {
      g.strokeStyle = '#2a2f45';
      g.lineWidth = 0.05;
      g.beginPath();
      g.moveTo(0.05, s * 0.2 - 0.07);
      g.lineTo(0.19, s * 0.2 + 0.07);
      g.moveTo(0.19, s * 0.2 - 0.07);
      g.lineTo(0.05, s * 0.2 + 0.07);
      g.stroke();
    } else {
      g.fillStyle = '#141a3a';
      g.beginPath();
      g.arc(0.17, s * 0.2, 0.07, 0, TAU);
      g.fill();
    }
  }
  g.restore();
}

function label(text, y, size, alpha = 1) {
  g.save();
  g.globalAlpha = alpha;
  g.font = `900 ${size}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = size * 0.22;
  g.strokeStyle = 'rgba(12, 70, 50, 0.85)';
  g.strokeText(text, W / 2, y);
  g.fillStyle = '#ffffff';
  g.fillText(text, W / 2, y);
  g.restore();
}

function draw(now) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  if (!game || !board) return;
  let sx = 0, sy = 0;
  const sk = (now - shakeAt) / 380;
  if (sk < 1) {
    sx = Math.sin(now / 16) * 7 * (1 - sk);
    sy = Math.cos(now / 21) * 5 * (1 - sk);
  }
  g.save();
  g.setTransform(1, 0, 0, 1, sx * dpr, sy * dpr);
  g.drawImage(board, 0, 0);
  g.restore();

  const dead = phase === 'dying' || phase === 'over';
  const t = phase === 'play' ? Math.min(1, acc) : 1;
  // Everything on the grass is drawn in cells, and kept inside it.
  g.save();
  g.translate(ox + sx, oy + sy);
  g.beginPath();
  g.rect(0, 0, cell * COLS, cell * ROWS);
  g.clip();
  g.scale(cell, cell);
  if (game.apple >= 0) drawApple(now);
  if (game.star >= 0) drawStar(now, t);

  const { lines, heads } = shape(t);
  const blink = phase === 'dying' && !game.won && Math.floor((now - diedAt) / 110) % 2 === 0;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.globalAlpha = blink ? 0.45 : 1;
  for (const line of lines) stroke(line, 0.86, dead && !game.won ? '#5f6880' : '#2638a8');
  for (const line of lines) stroke(line, 0.7, dead && !game.won ? '#8b93a7' : '#4a6cf7');
  for (const line of lines) stroke(line, 0.22, dead && !game.won ? 'rgba(255,255,255,0.25)' : 'rgba(170, 190, 255, 0.55)');
  for (const h of heads) drawHead(h, now, dead && !game.won);
  g.globalAlpha = 1;

  // Bits flying off what was eaten.
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k], age = now - p.t0;
    if (age >= p.life) { parts.splice(k, 1); continue; }
    const s = age / 1000;
    g.globalAlpha = 1 - age / p.life;
    g.fillStyle = p.color;
    g.beginPath();
    g.arc(p.x + p.vx * s, p.y + p.vy * s + 9 * s * s, p.size, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
  g.restore();

  // Points floating up.
  for (let k = floats.length - 1; k >= 0; k--) {
    const f = floats[k], age = (now - f.t0) / 900;
    if (age >= 1) { floats.splice(k, 1); continue; }
    const size = Math.max(13, cell * 0.8) * f.size;
    g.save();
    g.globalAlpha = age > 0.6 ? 1 - (age - 0.6) / 0.4 : 1;
    g.font = `900 ${size}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = size * 0.22;
    g.strokeStyle = 'rgba(12, 60, 45, 0.85)';
    const x = Math.min(W - size * 2, Math.max(size * 2, ox + f.x * cell)), y = oy + f.y * cell - cell * (0.6 + age * 1.4);
    g.strokeText(f.text, x, y);
    g.fillStyle = f.color;
    g.fillText(f.text, x, y);
    g.restore();
  }

  if (!ui.isOpen()) {
    const y = oy + cell * ROWS * 0.3, pulse = 0.75 + 0.25 * Math.sin(now / 300);
    if (phase === 'ready') label(game.steps ? (touch ? 'Swipe to carry on' : 'Press an arrow key') : touch ? 'Swipe to start' : 'Press an arrow key to start', y, Math.min(30, cell * 1.15), pulse);
    else if (phase === 'over') label(touch ? 'Tap to play again' : 'Press Enter to play again', y, Math.min(30, cell * 1.15), pulse);
  }
}

let last = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (phase === 'play' && !ui.isOpen()) {
    acc += dt * game.rate();
    while (acc >= 1 && phase === 'play') {
      acc -= 1;
      tick();
    }
    if (phase !== 'play') {
      acc = 1;
      if (game.dead) shakeAt = now;
    }
  }
  draw(now);
  requestAnimationFrame(frame);
}

// ---- swipes and keys ------------------------------------------------------------------

let swipe = null;

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (ui.isOpen()) return;
  if (phase === 'over') { newGame(); return; }
  swipe = { id: e.pointerId, x: e.clientX, y: e.clientY };
  try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported */ }
});
canvas.addEventListener('pointermove', (e) => {
  if (!swipe || swipe.id !== e.pointerId) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
  steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  // Carry on from here, so one long drag can make several turns.
  swipe.x = e.clientX;
  swipe.y = e.clientY;
});
const endSwipe = (e) => { if (swipe && swipe.id === e.pointerId) swipe = null; };
canvas.addEventListener('pointerup', endSwipe);
canvas.addEventListener('pointercancel', endSwipe);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (KEYS[e.key]) {
    e.preventDefault();
    if (!ui.isOpen()) steer(KEYS[e.key]);
    return;
  }
  if (ui.isOpen()) return;
  if (e.key === 'Enter' && phase === 'over') newGame();
  else if (e.key === ' ' || e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    e.preventDefault();
    if (phase === 'play' || phase === 'ready') showSettings();
  }
});

// ---- menus ----------------------------------------------------------------------------

const ui = cards({
  resume: () => ui.close(),
  again: () => { newGame(); ui.close(); },
  rules: () => showRules(false),
  start: () => ui.close(),
  edges: (el) => {
    const wrap = el.dataset.v === 'wrap';
    if (wrap === save.wrap) return;
    save.wrap = wrap;
    writeSave();
    newGame();
    showSettings();
  },
  speed: (el) => {
    if (el.dataset.v === save.speed) return;
    save.speed = el.dataset.v;
    writeSave();
    newGame();
    showSettings();
  },
});

function showSettings() {
  const going = phase === 'play' || (phase === 'ready' && game.steps > 0);
  pause();
  const tab = (action, v, label, on) => `<button class="seg-btn${on ? ' on' : ''}" data-action="${action}" data-v="${v}">${label}</button>`;
  ui.show(`<h2>${going ? 'Paused' : 'Settings'}</h2>
    ${switchRow('Sound', 'sound')}${switchRow('Haptics', 'haptics')}
    <div class="row">Edges <div class="seg">${tab('edges', 'walls', 'Walls', !save.wrap)}${tab('edges', 'wrap', 'No walls', save.wrap)}</div></div>
    <div class="row">Speed <div class="seg">${['slow', 'normal', 'fast'].map((v) => tab('speed', v, SPEED_NAME[v], save.speed === v)).join('')}</div></div>
    <p class="seg-note tip">Best this way: ${best()}${going ? '. Changing Edges or Speed starts a new game.' : ''}</p>
    <div class="actions">
      <button class="btn btn-primary" data-action="resume">${going ? 'Carry on' : 'Close'}</button>
      ${going || phase === 'over' ? '<button class="btn btn-soft" data-action="again">New game</button>' : ''}
      <button class="btn btn-soft" data-action="rules">How to play</button>
    </div>`);
}

function showRules(first) {
  ui.show(`<h2>${first ? 'Snake' : 'How to play'}</h2>
    <div class="how">
      <p><b>${touch ? 'Swipe' : 'Use the arrow keys'}</b> to steer the snake${touch ? ' (anywhere on the screen)' : ', or W A S D'}. It never stops moving.</p>
      <p><b>Eat apples</b> to score 10 and grow one longer. The snake speeds up as it grows.</p>
      <p><b>Gold stars</b> turn up every fifth apple and don't stay long: up to 50 points, more the sooner you get there, and they don't make you longer.</p>
      <p><b>Don't run into yourself</b>, or into the edge. With <b>No walls</b> (in settings) you come back in on the other side instead.</p>
    </div>
    <p class="tip">${touch ? 'The gear pauses.' : 'Space or P pauses.'} Each mix of edges and speed keeps its own best score.</p>
    <div class="actions"><button class="btn btn-primary" data-action="${first ? 'start' : 'resume'}">${first ? 'Play' : 'Got it'}</button></div>`);
}

function showOver(won, isBest) {
  ui.show(`<h2>${won ? 'You filled the board!' : isBest ? 'New best!' : 'Game over'}</h2>
    <div class="stats"><div><b>${game.score}</b><span>Score</span></div><div><b>${game.length}</b><span>Length</span></div><div><b>${game.apples}</b><span>Apples</span></div></div>
    <p class="best">Best ${best()} · ${save.wrap ? 'No walls' : 'Walls'}, ${SPEED_NAME[save.speed]}</p>
    <div class="actions"><button class="btn btn-primary" data-action="again">Play again</button><button class="btn btn-soft" data-action="close">Close</button></div>`);
  if (won || isBest) {
    sfx('win');
    confetti();
  }
}

$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });

// ---- start ----------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', layout);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.snake = { steer, get game() { return game; }, get phase() { return phase; }, newGame };
}

newGame();
layout();
if (!save.seen) {
  save.seen = true;
  writeSave();
  showRules(true);
}
requestAnimationFrame((t) => { last = t; frame(t); });
