// Star Swarm: the screen. Runs the rules in engine.js sixty times a second,
// draws what it finds there on a 224 x 288 arcade screen, and looks after
// the controls, the sounds, the high score and the menus.

import { Game, W, H, PLAYER_Y, BOSS, ROGUE, POINTS, extraAt } from './engine.js';
import { makeSprites, enemySprite, drawText, drawPoints, INK } from './sprites.js';
import { store, settings, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

const canvas = $('screen'), g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;
const S = makeSprites();
const TAU = Math.PI * 2, STEP = Math.PI / 12; // sprites turn in 15 degree steps, like the arcade's

// ---- saved things ---------------------------------------------------------------------

// The high score (the arcade machine started at 20,000 too), the furthest
// stage reached, and a game in progress: where its current stage started.
const SAVE_KEY = 'starswarm';
const save = Object.assign({ high: 20000, stage: 0, games: 0, run: null }, store.get(SAVE_KEY, {}) || {});
const writeSave = () => store.set(SAVE_KEY, save);
if (settings.autofire === undefined) settings.autofire = false;

let game = null;
let mode = 'title'; // 'title', 'play' or 'over'
let overAt = 0;

// ---- controls -------------------------------------------------------------------------

const held = { left: false, right: false, fire: false };
const keys = { left: false, right: false, fire: false };
let shots = 0; // presses of fire not yet used
let autoT = 0;

function firePressed() {
  if (ui.isOpen()) return;
  if (mode === 'title') return startGame();
  if (mode === 'over') { if (performance.now() - overAt > 1500) showOver(); return; }
  shots = Math.min(2, shots + 1);
}

const move = $('move');
function steer(e) {
  const r = move.getBoundingClientRect(), left = e.clientX < r.left + r.width / 2;
  held.left = left;
  held.right = !left;
  move.classList.toggle('left', left);
  move.classList.toggle('right', !left);
}
function letGo() {
  held.left = held.right = false;
  move.classList.remove('left', 'right');
}
move.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  try { move.setPointerCapture(e.pointerId); } catch { /* not supported */ }
  steer(e);
});
move.addEventListener('pointermove', (e) => { if (held.left || held.right) steer(e); });
move.addEventListener('pointerup', letGo);
move.addEventListener('pointercancel', letGo);

// The fire button, and the screen itself: a tap anywhere on it fires too.
for (const el of [$('fire'), canvas]) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch { /* not supported */ }
    held.fire = true;
    $('fire').classList.add('down');
    firePressed();
  });
  const up = () => { held.fire = false; $('fire').classList.remove('down'); };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
$('pad').addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

const KEY = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ' ': 'fire', ArrowUp: 'fire', z: 'fire', x: 'fire', Enter: 'fire' };
window.addEventListener('keydown', (e) => {
  if (ui.isOpen()) return;
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { showSettings(); e.preventDefault(); return; }
  const k = KEY[e.key];
  if (!k) return;
  e.preventDefault();
  if (k === 'fire' && !e.repeat) firePressed();
  keys[k] = true;
});
window.addEventListener('keyup', (e) => { const k = KEY[e.key]; if (k) keys[k] = false; });
window.addEventListener('blur', () => { keys.left = keys.right = keys.fire = false; letGo(); });

function readInput() {
  const input = { left: held.left || keys.left, right: held.right || keys.right, fire: false };
  if (input.left && input.right) input.left = input.right = false;
  if (shots > 0) { shots--; input.fire = true; autoT = 0; }
  // Optionally, holding fire keeps firing (the arcade made you tap).
  else if (settings.autofire && (held.fire || keys.fire) && ++autoT >= 9) { input.fire = true; autoT = 0; }
  return input;
}

// ---- a game ---------------------------------------------------------------------------

function startGame(from = null) {
  ui.close();
  game = new Game({ seed: (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0, ...(from || {}) });
  mode = 'play';
  shots = 0;
  if (!from) { save.games++; save.run = null; writeSave(); sfx('anthem'); }
  listen();
}

const SOUNDS = { shot: 'laser', clank: 'clank', dive: 'swoop', beam: 'tractor', caught: 'alarm', captured: 'lose', rescue: 'reunite', docked: 'chime',
  crash: 'crash', extra: 'coin', perfect: 'cheer', tally: 'chime' };

// What just happened in the game: play its sounds, keep the save up to date.
function listen() {
  for (const [name, k] of game.events) {
    if (name === 'boom') sfx('burst', k);
    else if (name === 'stage') {
      $('stageLabel').textContent = `STAGE ${k}`;
      $('tierTag').textContent = game.challenge ? 'CHALLENGING' : '';
      // Leave the game and come back: it carries on from the start of this stage.
      save.run = k > 1 ? game.snapshot() : null;
      save.stage = Math.max(save.stage, k);
      writeSave();
      if (k > 1) sfx('stage');
    } else if (name === 'over') {
      mode = 'over';
      overAt = performance.now();
      save.run = null;
      writeSave();
      sfx('lose');
      setTimeout(() => { if (mode === 'over' && !ui.isOpen()) showOver(); }, 6500);
    } else if (SOUNDS[name]) sfx(SOUNDS[name]);
    if (name === 'crash' || name === 'captured') haptic();
  }
  game.events.length = 0;
  if (game.score > save.high) save.high = game.score;
}

// ---- drawing --------------------------------------------------------------------------

const stars = Array.from({ length: 64 }, (_, i) => ({
  x: (i * 53 + 17) % W, y: (i * 97 + 31) % H, c: ['#ffffff', '#ff2a2a', '#2a5bff', '#29d9ff', '#ffe000', '#1fd655'][i % 6], ph: i * 11, v: 0.35 + (i % 3) * 0.25,
}));
let tick = 0;

function sprite(img, x, y, a = 0) {
  a = Math.round(a / STEP) * STEP;
  if (Math.abs(a % TAU) < 0.01) { g.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2)); return; }
  const c = Math.cos(a), s = Math.sin(a);
  g.setTransform(c, s, -s, c, Math.round(x), Math.round(y));
  g.drawImage(img, -img.width / 2, -img.height / 2);
  g.setTransform(1, 0, 0, 1, 0, 0);
}

function drawStars(moving) {
  for (const st of stars) {
    if (moving) { st.y += st.v; if (st.y >= H) { st.y -= H; st.x = (st.x * 7 + 13) % W; } }
    if (((tick + st.ph) >> 4) % 4 === 0) continue; // twinkle
    g.fillStyle = st.c;
    g.fillRect(st.x | 0, st.y | 0, 1, 1);
  }
}

// The boss's tractor beam: a widening cone of stripes sliding downwards.
function drawBeam(e) {
  const len = Math.round(80 * game.beamReach(e));
  for (let d = 0; d < len; d++) {
    const band = (d - tick + 4096) % 12;
    if (band >= 8) continue;
    g.fillStyle = band < 3 ? '#29d9ff' : band < 6 ? '#2a5bff' : '#ffffff';
    const half = Math.round(5 + d * 0.21);
    g.fillRect(Math.round(e.x) - half, Math.round(e.y) + 9 + d, half * 2, 1);
  }
}

function drawHud(score) {
  if (mode !== 'play' || (tick >> 4) & 1) drawText(g, S, '1UP', 24, 0, INK.red);
  drawText(g, S, String(score || '00'), 72, 8, INK.white, 'right');
  drawText(g, S, 'HIGH SCORE', W / 2 + 8, 0, INK.red, 'center');
  drawText(g, S, String(save.high), W / 2 + 8, 8, INK.white, 'center');
  if (!game) return;
  // Fighters in reserve, bottom left; a flag for the stages, bottom right.
  for (let i = 0; i < Math.min(7, game.reserves); i++) g.drawImage(S.fighter, i * 16, H - 16);
  let n = game.stage, x = W;
  const flags = [];
  for (const v of [50, 30, 20, 10, 5, 1]) while (n >= v) { flags.push(v); n -= v; }
  for (const v of flags.reverse()) {
    const img = S.badges[v];
    x -= img.width + 1;
    g.drawImage(img, x, H - 15);
  }
}

function drawGame() {
  const p = game.player, flap = (game.frame >> 4) & 1;
  for (const e of game.enemies) if (e.bt >= 0) drawBeam(e);
  for (const s of game.eShots) g.drawImage(S.bomb, Math.round(s.x) - 1, Math.round(s.y) - 3);
  for (const e of game.enemies) {
    let img = enemySprite(S, e.look, flap);
    // A bee about to turn into something flickers between the two.
    if (e.st === 'morph' && (game.frame >> 2) & 1) img = S[['scorpion', 'saucer', 'flagship'][Math.floor((game.stage - 4) / 4) % 3]];
    sprite(img, e.x, e.y, e.a);
    if (e.kind === BOSS && e.captive) { const [x, y] = game.captivePos(e); sprite(S.captive, x, y, e.a); }
  }
  for (const s of game.pShots) g.drawImage(S.shot, Math.round(s.x) - 1, Math.round(s.y) - 4);
  if (p.st === 'alive' || p.st === 'ready') for (const x of game.ships()) sprite(S.fighter, x, p.y);
  else if (p.st === 'beamed') sprite(p.y < PLAYER_Y - 40 ? S.captive : S.fighter, p.x, p.y, p.spin);
  if (game.rescue) sprite(S.fighter, game.rescue.x, game.rescue.y, game.rescue.a);
  for (const b of game.booms) {
    const set = b.big ? S.bigBoom : S.boom, img = set[Math.min(set.length - 1, Math.floor(b.t / (b.big ? 8 : 4)))];
    sprite(img, b.x, b.y);
  }
  for (const q of game.popups) drawPoints(g, q.n, q.x, q.y - q.t / 8, q.n >= 1000 ? INK.yellow : INK.cyan);
  for (const [text, colour, y] of game.texts()) drawText(g, S, text, W / 2, y, INK[colour], 'center');
}

// Before a game: what everything's worth, as the arcade machine showed it.
function drawTitle() {
  // The name, twice the size, with a shadow.
  for (const [dx, colour] of [[1, INK.blue], [0, INK.yellow]]) {
    g.setTransform(2, 0, 0, 2, dx * 2, dx * 2);
    drawText(g, S, 'STAR SWARM', W / 4, 18, colour, 'center');
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  drawText(g, S, 'IN LINE  DIVING', 136, 76, INK.cyan, 'center');
  [['bee0', 0], ['fly0', 1], ['boss0', 2]].forEach(([look, kind], i) => {
    const y = 92 + i * 22;
    g.drawImage(S[look], 28, y - 4);
    drawText(g, S, String(POINTS[kind][0]), 112, y, INK.white, 'right');
    drawText(g, S, String(POINTS[kind][1]), 180, y, INK.white, 'right');
  });
  if ((tick >> 5) & 1) drawText(g, S, 'PUSH FIRE TO START', W / 2, 168, INK.red, 'center');
  drawText(g, S, `1ST BONUS FOR ${extraAt(0)} PTS`, W / 2, 200, INK.yellow, 'center');
  drawText(g, S, `2ND BONUS FOR ${extraAt(1)} PTS`, W / 2, 216, INK.yellow, 'center');
  drawText(g, S, `AND FOR EVERY ${extraAt(1)} PTS`, W / 2, 232, INK.yellow, 'center');
  g.drawImage(S.fighter, W / 2 - 8, 250);
}

function draw() {
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  drawStars(!ui.isOpen());
  if (game) drawGame();
  else drawTitle();
  drawHud(game ? game.score : 0);
}

// ---- the loop -------------------------------------------------------------------------

let last = 0, owed = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(100, now - last);
  last = now;
  const paused = ui.isOpen() || document.hidden;
  if (!paused) {
    // The game runs at 60 steps a second whatever the screen does.
    owed += dt;
    for (let n = 0; owed >= 1000 / 60 && n < 5; n++) {
      owed -= 1000 / 60;
      tick++;
      if (game && mode !== 'title') { game.step(mode === 'play' ? readInput() : {}); listen(); }
    }
    if (owed > 100) owed = 0;
  }
  draw();
}

// Fit the screen between the top bar and the controls, each game pixel a
// whole number of real pixels where there's room, so they're all the same size.
function layout() {
  const top = $('topbar').getBoundingClientRect().bottom + 10;
  const bottom = $('pad').getBoundingClientRect().top - 10;
  const dpr = window.devicePixelRatio || 1;
  let k = Math.max(0.5, Math.min((innerWidth - 8) / W, (bottom - top) / H));
  if (k * dpr >= 2) k = Math.floor(k * dpr) / dpr;
  canvas.style.width = `${W * k}px`;
  canvas.style.height = `${H * k}px`;
  canvas.style.left = `${Math.round((innerWidth - W * k) / 2)}px`;
  canvas.style.top = `${Math.round(top + Math.max(0, bottom - top - H * k) / 2)}px`;
}

// ---- menus ----------------------------------------------------------------------------

const ui = cards({
  resume: () => ui.close(),
  again: () => startGame(),
  carryOn: () => startGame(save.run),
  fresh: () => startGame(),
  rules: showRules,
  quit: () => { game = null; mode = 'title'; save.run = null; writeSave(); $('stageLabel').textContent = 'STAGE 1'; $('tierTag').textContent = ''; ui.close(); },
  title: () => { game = null; mode = 'title'; $('stageLabel').textContent = 'STAGE 1'; $('tierTag').textContent = ''; ui.close(); },
});

function showSettings() {
  const playing = mode === 'play';
  ui.show(`<h2>${playing ? 'Paused' : 'Settings'}</h2>
    ${switchRow('Sound', 'sound')}${switchRow('Haptics', 'haptics')}${switchRow('Keep firing while Fire is held', 'autofire')}
    <div class="actions">
      <button class="btn btn-primary" data-action="resume">${playing ? 'Carry on' : 'Close'}</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
      ${playing ? '<button class="btn btn-soft" data-action="quit">End this game</button>' : ''}
    </div>`);
}

function showRules() {
  ui.show(`<h2>How to play</h2>
    <p>Slide your thumb on the left pad to move, and tap <b>FIRE</b> (or the screen) to shoot: two shots in the air at most. On a computer: arrow keys and Space.</p>
    <div class="pts"><span></span><i>In line</i><i>Diving</i>
      <span>Bee</span><b>50</b><b>100</b><span>Butterfly</span><b>80</b><b>160</b><span>Boss (two hits)</span><b>150</b><b>400 to 1,600</b></div>
    <p>A boss diving with escorts is worth 800 if you shoot one escort first, 1,600 for both.</p>
    <p><b>Tractor beam:</b> a boss can capture your fighter. Shoot that boss while it dives and the fighter comes back to fly beside you: twice the firepower. Shoot it in the line-up and the fighter turns on you.</p>
    <p><b>Challenging Stages</b> (3, 7, 11, …): nothing shoots back. 100 a hit, and 10,000 for all forty.</p>
    <p class="tip">A new fighter at 20,000, at 70,000, and every 70,000 after.</p>
    <div class="actions"><button class="btn btn-primary" data-action="${mode === 'title' ? 'close' : 'resume'}">Got it</button></div>`);
}

function showOver() {
  if (!game) return;
  const ratio = game.shots ? ((100 * game.hits) / game.shots).toFixed(1) : '0.0';
  const record = game.score >= save.high && game.score > 20000;
  ui.show(`<h2>${record ? 'New high score!' : 'Game over'}</h2>
    <div class="stats"><div><b>${game.score.toLocaleString()}</b><span>Score</span></div><div><b>${game.stage}</b><span>Stage</span></div><div><b>${ratio}%</b><span>Hits</span></div></div>
    <p class="best">High score ${save.high.toLocaleString()}</p>
    <div class="actions"><button class="btn btn-primary" data-action="again">Play again</button><button class="btn btn-soft" data-action="title">Close</button></div>`);
}

$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });

// ---- start ----------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', layout);
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play' && !ui.isOpen()) showSettings(); });
layout();
requestAnimationFrame((t) => { last = t; loop(t); });

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.starSwarm = { get game() { return game; }, get mode() { return mode; }, startGame, save };
}

// A game left part way through: offer to pick it up at the stage it had reached.
if (save.run) {
  ui.show(`<h2>Welcome back</h2><p>You were on stage ${save.run.stage} with ${save.run.score.toLocaleString()} points. Carry on from the start of that stage?</p>
    <div class="actions"><button class="btn btn-primary" data-action="carryOn">Carry on</button><button class="btn btn-soft" data-action="fresh">New game</button></div>`);
}
