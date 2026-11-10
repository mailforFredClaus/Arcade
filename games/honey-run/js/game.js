// Honey Run: the screen. Steps the rules in engine.js, draws the world in
// 3D, and looks after the swipes and keys, the score, the sounds, the
// shop, the goals and the menus.

import { Run, STEP, LANE, CAR, ROOF, POWER_TIME, POWERS } from './engine.js';
import { Renderer, M } from './gl.js';
import { makeModels, SKINS } from './models.js';
import { World, lookAt, zoneName } from './world.js';
import { store, settings, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, toast, confetti, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

const canvas = $('stage');
const R = new Renderer(canvas);
const models = makeModels(R);
const world = new World(R);
const TAU = Math.PI * 2;
const CUB = 1.22; // how big the cub is drawn
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const touch = matchMedia('(pointer: coarse)').matches;

// ---- saved things ---------------------------------------------------------------------

// bank: coins to spend. levels: how far each power-up is upgraded. skin and
// owned: which cub. goal: the goals in hand (see GOALS). best: top score.
const SAVE_KEY = 'honeyrun';
const save = Object.assign({ best: 0, bank: 0, far: 0, runs: 0, levels: {}, skin: 'cub', owned: ['cub'], goal: { level: 0, have: [0, 0, 0] }, seen: false }, store.get(SAVE_KEY, {}) || {});
const writeSave = () => store.set(SAVE_KEY, save);
const fmt = (n) => Math.floor(n).toLocaleString();

const POWER_INFO = {
  magnet: { name: 'Magnet', colour: '#e5383b', what: 'Pulls in coins from every lane.' },
  fly: { name: 'Balloons', colour: '#3b9dff', what: 'Float over everything, along a trail of coins.' },
  boots: { name: 'Boots', colour: '#ff8a1c', what: 'Jump high enough to land on the roofs.' },
  double: { name: 'Double', colour: '#a45bff', what: 'Twice the score.' },
  bubble: { name: 'Bubble', colour: '#58c7f3', what: 'Shrugs off one crash.' },
};
const UPGRADE_COST = [300, 600, 1200, 2400, 4000];

// ---- goals ----------------------------------------------------------------------------

// Three goals at a time. Finish all three and the score multiplier goes up
// by one for good (to 30 at most), and three harder ones take their place.
// once: has to be done in a single run; otherwise it adds up over runs.
const GOALS = [
  { text: (n) => `Collect ${n} coins in one run`, once: true, need: (l) => Math.min(500, 40 + 25 * l), now: (r) => r.coins },
  { text: (n) => `Jump ${n} times`, need: (l) => 15 + 8 * l, now: (r) => r.stats.jumps },
  { text: (n) => `Run ${fmt(n)} m in one run`, once: true, need: (l) => Math.min(4000, 500 + 250 * l), now: (r) => Math.floor(r.s) },
  { text: (n) => `Roll ${n} times`, need: (l) => 12 + 6 * l, now: (r) => r.stats.rolls },
  { text: (n) => `Run ${fmt(n)} m along the roofs`, need: (l) => 100 + 60 * l, now: (r) => Math.floor(r.stats.roof) },
  { text: (n) => `Pick up ${n} power-ups`, need: (l) => 2 + Math.floor(l / 2), now: (r) => r.stats.powers },
  { text: (n) => `Score ${fmt(n)} in one run`, once: true, need: (l) => (1500 * (l + 1) * Math.min(l + 2, 8)) / 2, now: (r) => Math.floor(r.score) },
  { text: (n) => `Collect ${fmt(n)} coins`, need: (l) => 150 + 120 * l, now: (r) => r.coins },
  { text: (n) => `Get past ${n} rolling trains`, need: (l) => 2 + l, now: (r) => r.stats.dodged },
];
const MAX_MULT = 30;
const goalSet = (level) => [0, 1, 2].map((k) => GOALS[(level * 2 + k * 3) % GOALS.length]);
const multiplier = () => Math.min(MAX_MULT, 1 + save.goal.level);
// How far along each goal in hand is, counting the run in progress.
function goalState(run) {
  return goalSet(save.goal.level).map((gl, k) => {
    const need = gl.need(save.goal.level), had = save.goal.have[k] || 0;
    const now = run ? gl.now(run) : 0;
    const have = Math.min(need, gl.once ? Math.max(had, now) : had + now);
    return { text: gl.text(need), need, have, done: have >= need };
  });
}

// ---- the run --------------------------------------------------------------------------

let run = null;
// 'title': waiting to start. 'play'. 'paused'. 'dead': the crash is playing out. 'over': the card is up.
let phase = 'title';
let acc = 0; // time owed to the rules
let startedAt = 0, diedAt = 0;
let goalsDone = [false, false, false];
let revives = 0;
let lastZone = '';

function freshRun() {
  run = new Run({ seed: (Math.random() * 2 ** 32) >>> 0, levels: save.levels, mult: multiplier() });
  acc = 0;
  revives = 0;
  goalsDone = goalState(null).map((gl) => gl.done);
  sparks.length = 0;
  cam.ys = 0;
  lastZone = zoneName(0);
}

function start() {
  if (phase !== 'title') return;
  phase = 'play';
  startedAt = performance.now();
  $('title').classList.add('gone');
  $('hud').hidden = false;
  if (save.runs < 3) {
    $('tips').hidden = false;
    $('tips').classList.remove('fade');
    setTimeout(() => $('tips').classList.add('fade'), 5200);
    setTimeout(() => { $('tips').hidden = true; }, 6000);
  }
  sfx('whoosh');
  sfx('buzz');
}

function toTitle() {
  freshRun();
  phase = 'title';
  $('title').classList.remove('gone');
  $('hud').hidden = true;
  $('tips').hidden = true;
  showTitle();
}

function showTitle() {
  $('bank').textContent = fmt(save.bank);
  $('bestLine').textContent = save.best ? `Best ${fmt(save.best)}${save.far ? `  ·  ${fmt(save.far)} m` : ''}` : '';
  $('goalsMult').textContent = `×${multiplier()}`;
  $('goHint').textContent = touch ? 'Tap to run' : 'Press Space to run';
}

function pause() {
  if (phase !== 'play') return;
  phase = 'paused';
  showPause();
}

// Carrying on (after a pause, or a crash you've paid your way out of)
// gives a moment to get your thumb ready.
function resume() {
  ui.close();
  if (phase !== 'paused') return;
  callout('Ready?');
  setTimeout(() => {
    if (phase !== 'paused' || ui.isOpen()) return;
    phase = 'play';
    acc = 0;
    last = performance.now();
  }, 750);
}

// Bank the coins and settle the goals when a run is over for good.
function settle() {
  save.bank += run.coins;
  save.runs++;
  save.far = Math.max(save.far, Math.floor(run.s));
  const st = goalState(run);
  let levelled = false;
  if (st.every((gl) => gl.done) && save.goal.level < MAX_MULT - 1) {
    save.goal = { level: save.goal.level + 1, have: [0, 0, 0] };
    levelled = true;
  } else save.goal.have = st.map((gl) => gl.have);
  const best = Math.floor(run.score) > save.best;
  if (best) save.best = Math.floor(run.score);
  writeSave();
  return { best, levelled };
}

const reviveCost = () => 200 * 2 ** revives;

// ---- little effects -------------------------------------------------------------------

const sparks = []; // { x, y, z, vx, vy, vz, t, life, size, c, grav }
let shake = 0;
let coinRun = 0, coinAt = 0; // coins picked up in quick succession ring higher and higher
let calloutTimer = 0;

function spark(x, y, z, n, colour, speed = 4, size = 0.16, life = 0.5, grav = 6) {
  for (let k = 0; k < n; k++) {
    const a = Math.random() * TAU, b = Math.random() * 1.4 - 0.4, v = speed * (0.4 + Math.random() * 0.8);
    sparks.push({ x, y, z, vx: Math.cos(a) * v, vy: b * v + 1.5, vz: Math.sin(a) * v, t: 0, life: life * (0.6 + Math.random() * 0.7), size: size * (0.6 + Math.random() * 0.8), c: colour, grav });
  }
}

function callout(text, small = '') {
  const el = $('callout');
  el.innerHTML = `${text}${small ? `<small>${small}</small>` : ''}`;
  el.classList.add('show');
  clearTimeout(calloutTimer);
  calloutTimer = setTimeout(() => el.classList.remove('show'), 1300);
}

function onEvent(ev) {
  const z = -run.s;
  switch (ev.e) {
    case 'coin': {
      const now = performance.now();
      coinRun = now - coinAt < 450 ? Math.min(12, coinRun + 1) : 0;
      coinAt = now;
      sfx('honey', coinRun);
      spark(ev.x, ev.y, -ev.s, 4, [1, 0.82, 0.25], 3, 0.14, 0.35);
      bumpPurse();
      break;
    }
    case 'jump': sfx('hop'); break;
    case 'roll': sfx('slide'); break;
    case 'dive': sfx('slide'); break;
    case 'lane': sfx('flip'); break;
    case 'land':
      if (run.y < 0.1) spark(run.x, 0.15, z, 5, [0.5, 0.45, 0.35], 2.5, 0.2, 0.3, 0);
      break;
    case 'bump':
      sfx('bump');
      haptic();
      shake = 0.35;
      spark(run.x + ev.d * 0.7, run.y + 0.9, z, 8, [1, 0.9, 0.6], 4, 0.16, 0.35);
      break;
    case 'stumble':
      sfx('buzz');
      callout('Ouch!', 'the bees are close');
      break;
    case 'pop':
      sfx('pop');
      haptic();
      shake = 0.3;
      spark(run.x, run.y + 0.9, z, 22, [0.6, 0.9, 1], 6, 0.2, 0.5);
      callout('Phew!', 'bubble popped');
      break;
    case 'crash':
      sfx('smash');
      haptic();
      shake = 0.6;
      spark(run.x, run.y + 0.9, z, 26, [1, 0.85, 0.4], 7, 0.22, 0.7);
      break;
    case 'power':
      sfx('power');
      haptic();
      spark(run.x, run.y + 1, z, 18, [1, 1, 1], 5, 0.2, 0.5);
      callout(`${POWER_INFO[ev.kind].name}!`);
      break;
    case 'powerEnd': sfx('powerdown'); break;
    case 'revive':
      sfx('power');
      break;
    default:
  }
}

let purseTimer = 0;
function bumpPurse() {
  const el = $('coins').parentElement;
  if (purseTimer) return;
  el.classList.add('bump');
  purseTimer = setTimeout(() => {
    el.classList.remove('bump');
    purseTimer = 0;
  }, 180);
}

// ---- the heads-up display -------------------------------------------------------------

const shown = { score: -1, coins: -1, mult: '' };
const powerEls = {};
function updateHud() {
  const sc = Math.floor(run.score);
  if (sc !== shown.score) {
    shown.score = sc;
    $('score').textContent = fmt(sc);
  }
  if (run.coins !== shown.coins) {
    shown.coins = run.coins;
    $('coins').textContent = fmt(run.coins);
  }
  const m = `×${run.multiplier()}`;
  if (m !== shown.mult) {
    shown.mult = m;
    $('mult').textContent = m;
    $('mult').classList.toggle('double', run.power.double > 0);
  }
  for (const k of POWERS) {
    const left = run.power[k];
    let el = powerEls[k];
    if (left <= 0) {
      if (el) {
        el.remove();
        delete powerEls[k];
      }
      continue;
    }
    if (!el) {
      el = document.createElement('div');
      el.className = 'power';
      el.innerHTML = `<i style="background:${POWER_INFO[k].colour}"></i><div>${POWER_INFO[k].name}<u><b></b></u></div>`;
      $('powers').appendChild(el);
      powerEls[k] = el;
      el.bar = el.querySelector('u b');
    }
    el.bar.style.width = `${Math.round((100 * left) / run.powerFull[k])}%`;
    el.classList.toggle('low', left < 2);
  }
}

// Goals finished while running get a shout.
function checkGoals() {
  goalState(run).forEach((gl, k) => {
    if (!gl.done || goalsDone[k]) return;
    goalsDone[k] = true;
    sfx('goal');
    toast(`Goal done: ${gl.text}`, 2600);
  });
}

// ---- the camera -----------------------------------------------------------------------

const cam = { ys: 0, k: 0, eye: [0, 0, 0], at: [0, 0, 0], view: null, proj: null, vp: null };
let W = 1, H = 1;

function layout() {
  W = innerWidth;
  H = innerHeight;
  R.resize(W, H, Math.min(window.devicePixelRatio || 1, 2));
}

function aim(dt, now) {
  const z = -run.s, aspect = W / H;
  // Behind and above the cub when running; round in front of it on the title.
  const want = phase === 'title' ? 0 : 1;
  cam.k = want > cam.k ? Math.min(want, cam.k + dt * 1.5) : Math.max(want, cam.k - dt * 1.5);
  const k = ease(cam.k);
  cam.ys += (run.y - cam.ys) * Math.min(1, dt * (run.flying || run.landing ? 3 : 5));
  const ys = cam.ys;
  const wide = aspect > 1;
  const back = wide ? 6.6 : 8.2, up = wide ? 4.0 : 5.0;
  const playEye = [run.x * 0.7, up + ys * 0.82, z + back];
  const playAt = [run.x * 0.82, 1.2 + ys * 0.85, z - 6];
  const sway = Math.sin(now / 2600) * 0.5;
  const titleEye = [(wide ? 2.8 : 1.9) + sway, 1.5, z - (wide ? 4.8 : 6)];
  const titleAt = [0, wide ? 1.1 : 1.7, z];
  for (let i = 0; i < 3; i++) {
    cam.eye[i] = lerp(titleEye[i], playEye[i], k);
    cam.at[i] = lerp(titleAt[i], playAt[i], k);
  }
  // Swing wide on the way round, so the turn doesn't cut through the cub.
  cam.eye[0] += Math.sin(k * Math.PI) * 3;
  cam.eye[1] += Math.sin(k * Math.PI) * 1.5;
  if (shake > 0) {
    shake = Math.max(0, shake - dt);
    cam.eye[0] += Math.sin(now / 17) * shake * 0.5;
    cam.eye[1] += Math.cos(now / 13) * shake * 0.4;
  }
  // The view opens out a little as the cub speeds up.
  const fov = ((wide ? 56 : aspect > 0.7 ? 64 : 72) + (run.speed - 12.5) * 0.55 * k) * (Math.PI / 180);
  cam.proj = M.perspective(fov, aspect, 0.5, 420);
  cam.view = M.lookAt(cam.eye, cam.at);
  cam.vp = M.mul(cam.proj, cam.view);
}

// Where a direction far away lands on the screen (-1..1), or null if it's behind.
function onScreen(dir) {
  const p = [cam.eye[0] + dir[0] * 1000, cam.eye[1] + dir[1] * 1000, cam.eye[2] + dir[2] * 1000];
  const m = cam.vp, w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
  if (w <= 0) return null;
  return [(m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]) / w, (m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]) / w];
}

// ---- drawing --------------------------------------------------------------------------

// The cub's pose, as matrices for its parts.
function cubParts(now, t) {
  const z = -run.s, sp = run.speed;
  const phaseRun = run.s * 1.15;
  const running = phase !== 'title' && run.grounded && !run.rolling && !run.dead;
  const air = !run.grounded && !run.flying && !run.dead && phase !== 'title';
  let legL = 0, legR = 0, armL = 0, armR = 0, bob = 0, tilt = -0.14, headTilt = 0.05, pitch = 0, lift = 0, scale = 1, yaw = 0;
  if (phase === 'title') {
    // Standing, looking about, breathing.
    bob = Math.sin(now / 520) * 0.02;
    tilt = 0;
    armL = armR = 0.1 + Math.sin(now / 520) * 0.05;
    headTilt = Math.sin(now / 1700) * 0.08;
    yaw = Math.sin(now / 2300) * 0.3;
  } else if (run.dead) {
    const k = clamp((now - diedAt) / 350, 0, 1);
    pitch = k * 1.35;
    lift = Math.sin(k * Math.PI) * 0.5 + 0.18 * k;
    armL = armR = -2.2 * k;
    legL = 0.5 * k;
    legR = -0.3 * k;
  } else if (run.flying || run.landing) {
    armL = armR = -2.9;
    legL = Math.sin(now / 300) * 0.25;
    legR = Math.sin(now / 300 + 1.6) * 0.25;
    tilt = 0;
  } else if (run.rolling) {
    pitch = -((1 - run.rollT / 0.62) * TAU);
    scale = 0.82;
    armL = armR = 0.9;
    legL = legR = 1.3;
    tilt = -0.5;
  } else if (air) {
    const up = clamp(run.vy / 12, -1, 1);
    legL = 0.9 + up * 0.3;
    legR = -0.5 - up * 0.2;
    armL = armR = -1.6 - up * 0.8;
    tilt = -0.2 - up * 0.1;
  } else if (running) {
    const sw = Math.sin(phaseRun), k = 0.75 + sp * 0.012;
    legL = sw * k;
    legR = -sw * k;
    armL = -sw * 0.85;
    armR = sw * 0.85;
    bob = Math.abs(Math.cos(phaseRun)) * 0.07;
  }
  // Lean into a lane change; wobble after a stumble.
  let lean = clamp((run.lane * LANE - run.x) * -0.22, -0.4, 0.4);
  if (run.stumbleT > 6.2) lean += Math.sin(now / 40) * 0.25 * (run.stumbleT - 6.2);
  // (Drawn a little bigger than it is, so it reads well from behind.)
  let root = M.chain(M.move(run.x, run.y + lift, z), M.rotY(yaw), M.rotZ(lean), M.scale(CUB));
  if (pitch || scale !== 1) root = M.chain(root, M.move(0, 0.62, 0), M.rotX(pitch), M.scale(scale), M.move(0, -0.75, 0));
  const P = (...ms) => M.chain(root, ...ms);
  return {
    root,
    body: P(M.move(0, bob, 0), M.rotX(tilt)),
    head: P(M.move(0, 1.08 + bob, tilt * 0.35), M.rotX(headTilt + tilt * 0.4)),
    armL: P(M.move(-0.42, 1.0 + bob, tilt * 0.3), M.rotX(armL), M.rotZ(-0.12)),
    armR: P(M.move(0.42, 1.0 + bob, tilt * 0.3), M.rotX(armR), M.rotZ(0.12)),
    legL: P(M.move(-0.17, 0.44, 0), M.rotX(legL)),
    legR: P(M.move(0.17, 0.44, 0), M.rotX(legR)),
  };
}

function drawCub(parts, shadowPlane = null) {
  const c = models.cubs[save.skin] || models.cubs.cub;
  const list = [[c.body, parts.body], [c.head, parts.head], [c.arm, parts.armL], [c.arm, parts.armR], [c.leg, parts.legL], [c.leg, parts.legR]];
  for (const [mesh, m] of list) {
    if (shadowPlane === null) R.draw(mesh, m);
    else R.shadow(mesh, m, shadowPlane);
  }
}

// Each thing on the line as [mesh, matrix] pairs.
const lamps = [];
function obstacleDraws() {
  const out = [];
  lamps.length = 0;
  for (const o of run.obstacles) {
    if (o.s0 > run.s + 150) continue;
    if (o.kind === 'train') {
      for (let i = 0; i < o.cars; i++) {
        const mesh = o.v && i === 0 ? models.engine : models.wagons[o.look][(o.id + i) % 3];
        out.push([mesh, M.move(o.lane * LANE, 0, -(o.s0 + i * CAR))]);
        // An engine's lamps are lit.
        if (o.v && i === 0) for (const dx of [-0.56, 0.56]) lamps.push([o.lane * LANE + dx, 1.5, -o.s0 - 0.2, 0.3, 0.9, 0.8, 0.45]);
      }
    } else {
      const mesh = o.kind === 'ramp' ? models.ramp : o.kind === 'cart' ? models.cart : o.kind === 'high' ? models.high : models.low[o.id % 2];
      out.push([mesh, M.move(o.lane * LANE, 0, -o.s0)]);
    }
  }
  return out;
}

const glowList = [];
const UNLIT = { unlit: true };
const BUBBLE = { tint: [0.62, 0.86, 1] };
function draw(now, dt) {
  const look = lookAt(run.s);
  const z = -run.s;
  // The line swings gently left and right as it goes.
  const swing = Math.sin(run.s / 230) * 0.00042 + Math.sin(run.s / 97) * 0.00012;
  // The horizon: straight ahead of the camera, level.
  const fx = cam.at[0] - cam.eye[0], fz = cam.at[2] - cam.eye[2], fl = Math.hypot(fx, fz) || 1;
  const hz = onScreen([fx / fl, -0.02, fz / fl]);
  const sunAt = onScreen(look.sun) || [-3, 3];
  R.begin({
    vp: cam.vp, bend: [0.00075, swing, z], sun: look.sun, sunCol: look.sunCol, sky: look.skyLight, ground: look.groundLight,
    fogCol: look.fog, fog: [55, 150], top: look.top, sunGlow: look.glow, sunAt, sunSize: 0.42, horizon: hz ? hz[1] : -0.2,
  });
  world.drawGround();
  world.drawProps();
  const obs = obstacleDraws();
  for (const [mesh, m] of obs) R.draw(mesh, m);

  // Coins and power-ups, turning.
  glowList.length = 0;
  for (const l of lamps) glowList.push(l);
  const spin = now / 260;
  for (const c of run.coinList) {
    if (c.taken) continue;
    if (c.s > run.s + 130) break;
    R.draw(models.coin, M.chain(M.move(c.x, c.y, -c.s), M.rotY(spin + c.s * 0.35)), UNLIT);
  }
  for (const p of run.pickups) {
    if (p.taken || p.s > run.s + 130) continue;
    const y = p.y + Math.sin(now / 300 + p.s) * 0.15;
    R.draw(models.power[p.kind], M.chain(M.move(p.lane * LANE, y, -p.s), M.rotY(now / 500), M.scale(1.15)));
    // A ring of twinkles round it.
    for (let k = 0; k < 4; k++) {
      const a = now / 400 + (k * TAU) / 4;
      glowList.push([p.lane * LANE + Math.cos(a) * 0.9, y + Math.sin(a * 1.3) * 0.5, -p.s + Math.sin(a) * 0.9, 0.16, 1, 1, 0.8]);
    }
  }

  // The cub, and what it's carrying.
  const parts = cubParts(now);
  const blink = run.ghost > 0 && !run.dead && Math.floor(now / 70) % 2 === 0;
  if (!blink) drawCub(parts);
  if (run.flying || run.landing) R.draw(models.power.fly, M.chain(M.move(run.x, run.y + 2.75, z), M.rotY(Math.sin(now / 700) * 0.3), M.scale(1.35)));
  else if (run.power.magnet > 0) R.draw(models.power.magnet, M.chain(M.move(run.x, run.y + 2.75 + Math.sin(now / 250) * 0.06, z), M.rotY(now / 400), M.scale(0.6)));
  if (run.power.boots > 0) {
    for (const leg of [parts.legL, parts.legR]) R.draw(models.bootOn, leg);
    if (run.grounded && Math.random() < 0.5) spark(run.x, run.y + 0.1, z + 0.2, 1, [1, 0.6, 0.15], 1.5, 0.12, 0.3, 0);
  }

  // Bees: close at the start and after a stumble.
  const sinceStart = (now - startedAt) / 1000;
  const close = run.dead && run.cause === 'bees' ? 1.2 : phase === 'title' ? 0 : Math.max(run.stumbleT > 0 ? Math.min(1, run.stumbleT / 1.5) : 0, clamp(1 - (sinceStart - 1.2) / 1.6, 0, 1));
  if (close > 0.01) {
    // (They drop back out of sight past the camera.)
    const bz = z + lerp(13, 2.6, ease(Math.min(1, close))) - (close > 1 ? 2.4 : 0);
    for (let k = 0; k < 14; k++) {
      const a = now / (190 + k * 13) + k * 2.1, b = now / (260 + k * 7) + k;
      const x = run.x + Math.cos(a) * (0.5 + (k % 4) * 0.25), y = run.y + 1.3 + Math.sin(b) * 0.6 + (k % 3) * 0.2, zz = bz + Math.sin(a * 0.7) * 0.8;
      if (zz > cam.eye[2] - 1.5) continue;
      const m = M.chain(M.move(x, y, zz), M.scale(1.25));
      R.draw(models.bee, m);
      const flap = Math.sin(now / 18 + k) * 0.7;
      R.draw(models.wing, M.chain(m, M.rotZ(0.3 + flap)));
      R.draw(models.wing, M.chain(m, M.scale(-1, 1, 1), M.rotZ(0.3 + flap)));
    }
  }

  // Shadows on the ground.
  R.shadows(true, 0.3);
  world.shadowProps();
  for (const [mesh, m] of obs) R.shadow(mesh, m);
  const floor = run.dead ? 0 : run.floor();
  if (!blink) drawCub(parts, floor + 0.09);
  R.shadows(false);

  // See-through things.
  if (run.power.bubble > 0) {
    const wob = 1 + Math.sin(now / 160) * 0.03;
    R.glass(models.bubble, M.chain(M.move(run.x, run.y + 1.05, z), M.rotY(now / 900), M.scale(1.4 * wob, 1.5 / wob, 1.4 * wob)), run.power.bubble < 2 && Math.floor(now / 120) % 2 ? 0.1 : 0.24, BUBBLE);
    glowList.push([run.x - 0.55, run.y + 1.9, z + 0.8, 0.24, 0.9, 0.95, 1]);
  }

  // Sparks.
  for (let k = sparks.length - 1; k >= 0; k--) {
    const s = sparks[k];
    s.t += dt;
    if (s.t >= s.life) { sparks.splice(k, 1); continue; }
    s.vy -= s.grav * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
    const a = 1 - s.t / s.life;
    glowList.push([s.x, s.y, s.z, s.size * (0.5 + a * 0.5), s.c[0] * a, s.c[1] * a, s.c[2] * a]);
  }
  // Coins glint.
  for (const c of run.coinList) {
    if (c.taken || c.s > run.s + 40) continue;
    const k = (now / 900 + c.s * 0.37) % 1;
    if (k < 0.12) glowList.push([c.x + 0.12, c.y + 0.14, -c.s + 0.1, 0.22 * Math.sin((Math.PI * k) / 0.12), 1, 0.95, 0.7]);
  }
  const v = cam.view;
  R.glow(glowList, [v[0], v[4], v[8]], [v[1], v[5], v[9]]);
}
for (const k of POWERS) {
  const n = parseInt(POWER_INFO[k].colour.slice(1), 16);
  POWER_INFO[k].glow = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// ---- the loop -------------------------------------------------------------------------

let last = 0, hudAt = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (phase === 'play') {
    acc += dt;
    let n = 0;
    while (acc >= STEP && n++ < 12) {
      acc -= STEP;
      run.step();
      if (run.dead) break;
    }
    if (n >= 12) acc = 0;
    for (const ev of run.events) onEvent(ev);
    run.events.length = 0;
    if (run.dead) {
      phase = 'dead';
      diedAt = now;
      setTimeout(showOver, 1100);
    }
    const zone = zoneName(run.s + 30);
    if (zone !== lastZone) {
      lastZone = zone;
      callout(zone, `${fmt(run.s)} m`);
    }
    if (now - hudAt > 100) {
      hudAt = now;
      checkGoals();
    }
    updateHud();
  }
  // (On the title the camera looks back down the line, so more of it is kept.)
  world.update(run.s, 160, phase === 'title' || cam.k < 1 ? 150 : 16, world.chunks.size < 10 ? 16 : 2);
  aim(dt, now);
  draw(now, dt);
  requestAnimationFrame(frame);
}

// ---- swipes and keys ------------------------------------------------------------------

function act(a) {
  if (ui.isOpen()) return;
  if (phase === 'title') { start(); return; }
  if (phase === 'play') run.input(a);
}

let swipe = null;
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (ui.isOpen()) return;
  swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported */ }
});
canvas.addEventListener('pointermove', (e) => {
  // One swipe is one move, however far the finger travels: lift it to
  // swipe again.
  if (!swipe || swipe.id !== e.pointerId || swipe.moved) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  swipe.moved = true;
  act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
});
const endSwipe = (e) => {
  if (!swipe || swipe.id !== e.pointerId) return;
  if (!swipe.moved && phase === 'title' && !ui.isOpen()) start();
  swipe = null;
};
canvas.addEventListener('pointerup', endSwipe);
canvas.addEventListener('pointercancel', () => { swipe = null; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right', ' ': 'up' };
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (phase === 'play') pause();
    else if (phase === 'paused') resume();
    // (Escape can close the shop after a run: then it's back to the start.)
    else setTimeout(() => { if (!ui.isOpen() && phase === 'over') toTitle(); else if (!ui.isOpen() && phase === 'title') showTitle(); }, 0);
    return;
  }
  if (KEYS[e.key]) {
    e.preventDefault();
    if (!e.repeat) act(KEYS[e.key]);
  } else if (e.key === 'Enter' && phase === 'title' && !ui.isOpen()) start();
});

// ---- cards ----------------------------------------------------------------------------

const hexCoin = '<i class="hex"></i>';

function showPause() {
  ui.show(`<h2>Paused</h2>
    ${switchRow('Sound', 'sound')}${switchRow('Haptics', 'haptics')}
    <div class="actions">
      <button class="btn btn-primary" data-action="resume">Carry on</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
      <button class="btn btn-soft" data-action="quit">End this run</button>
    </div>`);
}

function showSettings() {
  ui.show(`<h2>Settings</h2>
    ${switchRow('Sound', 'sound')}${switchRow('Haptics', 'haptics')}
    <div class="actions">
      <button class="btn btn-primary" data-action="close">Close</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
    </div>`);
}

function showRules() {
  const back = phase === 'paused' ? 'pause' : 'close';
  ui.show(`<h2>How to play</h2>
    <div class="how">
      <p><b>${touch ? 'Swipe left or right' : 'Left and right arrows'}</b> to change lane. <b>${touch ? 'Swipe up' : 'Up or Space'}</b> to jump, <b>${touch ? 'swipe down' : 'Down'}</b> to roll. In the air, ${touch ? 'swiping ' : ''}down drops you fast.</p>
      <p><b>Jump</b> the fences and hay carts, <b>roll</b> under the striped barriers, and go <b>round</b> the wagons, or up a ramp and along their roofs.</p>
      <p><b>Careful:</b> run into something and it's over. Swipe sideways into a wagon and you stumble: the bees close in, and a second stumble while they're near ends the run.</p>
      <p><b>Power-ups:</b> a magnet for coins, balloons to float over everything, spring boots to jump onto roofs, double score, and a bubble that shrugs off one crash.</p>
      <p><b>Coins</b> buy longer power-ups and new cubs in the shop. <b>Goals</b> raise your score multiplier for good.</p>
    </div>
    <div class="actions"><button class="btn btn-primary" data-action="${back}">Got it</button></div>`);
}

function goalsHtml(st) {
  return `<div class="goals">${st.map((gl) => `<div class="goal-line${gl.done ? ' done' : ''}"><i>${gl.done ? '✓' : ''}</i><div>${gl.text}
    ${gl.done ? '' : `<u><b style="width:${Math.round((100 * gl.have) / gl.need)}%"></b></u><small>${fmt(gl.have)} / ${fmt(gl.need)}</small>`}</div></div>`).join('')}</div>`;
}

function showGoals() {
  ui.show(`<h2>Goals</h2>
    <p>Finish all three to raise your score multiplier to <b>×${Math.min(MAX_MULT, multiplier() + 1)}</b> for good.</p>
    ${goalsHtml(goalState(null))}
    <p class="tip">Your multiplier now: ×${multiplier()}</p>
    <div class="actions"><button class="btn btn-primary" data-action="close">Close</button></div>`);
}

function showShop() {
  const ups = POWERS.map((k) => {
    const lvl = save.levels[k] || 0, cost = UPGRADE_COST[lvl];
    const pips = [0, 1, 2, 3, 4].map((i) => `<u class="${i < lvl ? 'on' : ''}"></u>`).join('');
    const btn = lvl >= 5 ? '<button class="buy have" disabled>Max</button>'
      : `<button class="buy" data-action="upgrade" data-k="${k}" ${save.bank < cost ? 'disabled' : ''}>${hexCoin}${fmt(cost)}</button>`;
    return `<div class="item"><i style="background:${POWER_INFO[k].colour}"></i><div><b>${POWER_INFO[k].name}</b><span>${POWER_TIME[k][lvl]} s${lvl < 5 ? ` → ${POWER_TIME[k][lvl + 1]} s` : ''}</span><div class="pips">${pips}</div></div>${btn}</div>`;
  }).join('');
  const cubs = SKINS.map((sk) => {
    const own = save.owned.includes(sk.id), on = save.skin === sk.id;
    const btn = on ? '<button class="buy on" disabled>Running</button>'
      : own ? `<button class="buy have" data-action="wear" data-k="${sk.id}">Choose</button>`
        : `<button class="buy" data-action="adopt" data-k="${sk.id}" ${save.bank < sk.cost ? 'disabled' : ''}>${hexCoin}${fmt(sk.cost)}</button>`;
    return `<div class="item"><i style="background:${sk.fur};box-shadow:inset 0 0 0 4px ${sk.scarf}"></i><div><b>${sk.name}</b><span>${sk.cost ? 'A new cub to run with' : 'Your first cub'}</span></div>${btn}</div>`;
  }).join('');
  ui.show(`<h2>Shop</h2>
    <div class="shop-head"><span>Power-ups last longer</span><span class="purse">${hexCoin}${fmt(save.bank)}</span></div>
    <div class="shop">${ups}</div>
    <div class="shop-head"><span>Cubs</span></div>
    <div class="shop">${cubs}</div>
    <div class="actions"><button class="btn btn-primary" data-action="close">Done</button></div>`);
}

function showOver() {
  if (phase !== 'dead') return;
  phase = 'over';
  const cost = reviveCost(), purse = save.bank + run.coins;
  const canRevive = revives < 3 && purse >= cost;
  ui.show(`<h2>${run.cause === 'bees' ? 'Stung!' : 'Crash!'}</h2>
    <div class="stats"><div><b>${fmt(run.score)}</b><span>Score</span></div><div><b>${hexCoin}${fmt(run.coins)}</b><span>Coins</span></div><div><b>${fmt(run.s)} m</b><span>Distance</span></div></div>
    ${canRevive ? `<p>Carry on from here?</p>` : ''}
    <div class="actions">
      ${canRevive ? `<button class="btn btn-primary" data-action="revive">Carry on &nbsp;${hexCoin} ${fmt(cost)}</button>` : ''}
      <button class="btn ${canRevive ? 'btn-soft' : 'btn-primary'}" data-action="finish">${canRevive ? 'No thanks' : 'Continue'}</button>
    </div>`);
}

function showResult() {
  const { best, levelled } = settle();
  const st = levelled ? null : goalState(null);
  ui.show(`<h2>${best ? 'New best!' : 'Run over'}</h2>
    <div class="stats"><div><b>${fmt(run.score)}</b><span>Score</span></div><div><b>${hexCoin}${fmt(run.coins)}</b><span>Coins</span></div><div><b>${fmt(run.s)} m</b><span>Distance</span></div></div>
    <p class="best${best ? ' newbest' : ''}">Best ${fmt(save.best)}</p>
    ${levelled ? `<p class="newbest">All three goals done! Your multiplier is now ×${multiplier()}.</p>` : goalsHtml(st)}
    <div class="actions">
      <button class="btn btn-primary" data-action="again">Run again</button>
      <button class="btn btn-soft" data-action="shopAfter">Shop &nbsp;${hexCoin} ${fmt(save.bank)}</button>
      <button class="btn btn-soft" data-action="home">Home</button>
    </div>`);
  if (best || levelled) {
    sfx('win');
    confetti();
  }
}

let afterShop = null;
const ui = cards({
  resume,
  pause: showPause,
  rules: showRules,
  quit: () => {
    ui.close();
    run.dead = true;
    run.cause = 'quit';
    phase = 'over';
    showResult();
  },
  revive: () => {
    const cost = reviveCost();
    // Paid from this run's coins first, then the bank.
    const fromRun = Math.min(run.coins, cost);
    run.coins -= fromRun;
    save.bank -= cost - fromRun;
    writeSave();
    revives++;
    run.revive();
    phase = 'paused';
    resume();
  },
  finish: showResult,
  again: () => {
    ui.close();
    toTitle();
    start();
  },
  home: () => {
    ui.close();
    toTitle();
  },
  shopAfter: () => {
    afterShop = 'home';
    showShop();
  },
  upgrade: (el) => {
    const k = el.dataset.k, lvl = save.levels[k] || 0;
    if (lvl >= 5 || save.bank < UPGRADE_COST[lvl]) return;
    save.bank -= UPGRADE_COST[lvl];
    save.levels[k] = lvl + 1;
    writeSave();
    sfx('power');
    showShop();
  },
  adopt: (el) => {
    const sk = SKINS.find((x) => x.id === el.dataset.k);
    if (!sk || save.bank < sk.cost || save.owned.includes(sk.id)) return;
    save.bank -= sk.cost;
    save.owned.push(sk.id);
    save.skin = sk.id;
    writeSave();
    sfx('win');
    showShop();
  },
  wear: (el) => {
    if (!save.owned.includes(el.dataset.k)) return;
    save.skin = el.dataset.k;
    writeSave();
    showShop();
  },
});
// Closing the shop after a run goes home, with the coins brought up to date.
$('overlay').addEventListener('click', () => {
  if (!ui.isOpen() && (afterShop || phase === 'over')) {
    afterShop = null;
    toTitle();
  } else if (!ui.isOpen() && phase === 'title') showTitle();
});

$('pauseBtn').addEventListener('click', () => { sfx('tap'); pause(); });
$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });
$('shopBtn').addEventListener('click', () => { sfx('tap'); showShop(); });
$('goalsBtn').addEventListener('click', () => { sfx('tap'); showGoals(); });

// ---- start ----------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', layout);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.honey = { get run() { return run; }, get phase() { return phase; }, start, act, save, cam };
}

layout();
freshRun();
showTitle();
if (!save.seen) {
  save.seen = true;
  writeSave();
  showRules();
}
requestAnimationFrame((t) => { last = t; frame(t); });
