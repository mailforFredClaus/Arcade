// Haywire: the screen. Steps the match in engine.js, draws the yard and the
// robots in 3D, and looks after the mouse and keys, the sights, the radar,
// the scores, the sounds and the menus.

import { buildMap } from './map.js';
import { buildLine } from './line.js';
import { buildFront } from './front.js';
import { Match, STEP, MODES, GUNS, WALK, ROUT, REVIVE_REACH, REVIVE_TIME, FROM_LEFT, FROM_RIGHT, OVERHEAD, THRUST, meets, blowOf, bladeLocal, thrustOut } from './engine.js';
import { SKILL } from './bots.js';
import { Renderer, Builder, M } from './gl.js';
import { buildMesh, SKY, SUN } from './mesh.js';
import { makeModels, pose, TEAM } from './models.js';
import { fxReset, fxStep, fxDraw, fx, lightsNow } from './fx.js';
import { store, settings, sfx, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;
const canvas = $('stage');
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (t) => t * t * (3 - 2 * t);
const TAU = Math.PI * 2;
const wrap = (a) => a - TAU * Math.round(a / TAU);

// ---- saved things ---------------------------------------------------------------------

const SAVE_KEY = 'haywire';
const save = Object.assign({ advSize: 32, map: 0, vol: 1, type: 'tdm', side: 0, mode: 0, clsOld: 0, cls: 0, skill: 1, limit: 75, sens: 1, fov: 90, invert: false, matches: 0, wins: 0, kills: 0, deaths: 0, heads: 0, streak: 0, xp: 0 }, store.get(SAVE_KEY, {}) || {});
const writeSave = () => store.set(SAVE_KEY, save);
if (!MODES[save.mode]) save.mode = 0;
if (save.type !== 'adv') save.type = 'tdm';
if (!(save.map >= 0 && save.map <= 5)) save.map = 0;
// Every sound, at the loudness asked for in the settings.
const snd = (name, k = 0, vol = 1, pan = 0) => sfx(name, k, vol * save.vol, pan);
// The maps for team deathmatch: Foundry Yard, or any one arena of the Long Works.
const MAP_NAMES = ['Foundry Yard', 'The Yard', 'The Sheds', 'The Cut', 'The Foundry', 'The Offices'];
const mapId = () => (save.type === 'adv' ? 'front' : save.map > 0 ? 'line' : 'yard');
if (![16, 24, 32].includes(save.advSize)) save.advSize = 32;
const arenaNow = () => (save.type !== 'adv' && save.map > 0 ? save.map - 1 : undefined);
save.side = save.side ? 1 : 0;
// Each mode remembers its own choice of class.
const clsKey = (mode) => (mode === MODES[1] ? 'clsOld' : 'cls');
const RANKS = ['Spare Part', 'Loose Nut', 'Bolt', 'Sprocket', 'Gearhead', 'Piston', 'Dynamo', 'Turbine', 'Ironclad', 'Juggernaut', 'Mainframe', 'Overlord'];
// Each rank takes 600 more points than the one before.
function rankOf(xp) {
  let n = 0, need = 600, into = xp;
  while (into >= need) { into -= need; n++; need += 600; }
  return { n, title: RANKS[Math.min(n, RANKS.length - 1)] + (n >= RANKS.length ? ` ${n - RANKS.length + 2}` : ''), into, need };
}

// ---- the yard -------------------------------------------------------------------------

let R = null, models = null, map = null, world = null, mesh = null, flash = null;
let match = null, me = null;
// 'load', 'title' (bots play behind the menu), 'play', 'over'.
let phase = 'load';
let acc = 0, last = 0, locked = false, force = false, frozen = false; // (force and frozen are for testing)
const view = { yaw: 0, pitch: 0 }; // where the player is looking
const cam = { eye: [44, 20, 32], yaw: 0, pitch: -0.5, fov: 1, y: 0, shake: 0, roll: 0, dead: null, view: null, proj: null };
const vis = []; // how each robot is drawn: where it is in its stride, and so on
const hand = { bash: 0, kick: 0, swayX: 0, swayY: 0, flash: 0, roll: 0, bob: 0, dip: 0 };
let W = 1, H = 1;

function load() {
  R = new Renderer(canvas);
  models = makeModels(R);
  // The flash at the end of the barrel: three flat stars crossing.
  const b = new Builder();
  for (let k = 0; k < 3; k++) {
    b.with(M.rotZ((k * Math.PI) / 3), () => {
      b.quad([-0.12, -0.02, 0], [0.12, -0.02, 0], [0.12, 0.02, 0], [-0.12, 0.02, 0], [1, 0.9, 0.55]);
    });
  }
  b.quad([-0.025, 0, 0], [0.025, 0, 0], [0.01, 0, -0.3], [-0.01, 0, -0.3], [1, 0.85, 0.45]);
  b.quad([0, -0.025, 0], [0, 0.025, 0], [0, 0.01, -0.3], [0, -0.01, -0.3], [1, 0.85, 0.45]);
  flash = R.mesh(b);
  layout();
  attract();
  phase = 'title';
  $('loading').hidden = true;
  showTitle();
}

// How sharp the picture is drawn: as sharp as the screen, but no more than
// 1440 lines, and less on a machine that can't keep up (see frame()).
let sharp = 1, slow = 0, quick = 0, spent = 0, wasSpent = 0, settled = false;
function layout() {
  W = innerWidth;
  H = innerHeight;
  R.resize(W, H, Math.min(window.devicePixelRatio || 1, 2, 1440 / H) * sharp);
}

// ---- matches --------------------------------------------------------------------------

// The two maps: Foundry Yard for team deathmatch, the Long Works for
// Advance. Each is built, lit and drawn for the radar the first time it is
// wanted (which takes a moment), and kept.
const maps = {};
function useMap(id) {
  if (!maps[id]) {
    const m = id === 'front' ? buildFront() : id === 'line' ? buildLine() : buildMap();
    maps[id] = { map: m, mesh: buildMesh(m), radar: null };
  }
  const it = maps[id];
  if (map === it.map) return;
  map = it.map;
  world = map.world;
  mesh = it.mesh;
  R.setWorld(mesh, map.sun, [map.W, map.H]);
  if (!it.radar) it.radar = drawRadarMap();
  radarMap = it.radar;
}
// Runs fn once the map for this kind of match is ready, with a notice up while it is built.
function whenBuilt(fn) {
  const id = mapId();
  if (maps[id]) { fn(); return; }
  $('loading').textContent = id === 'front' ? 'Building the Iron Front…' : id === 'line' ? 'Building the Long Works…' : 'Building the yard…';
  $('loading').hidden = false;
  setTimeout(() => { useMap(id); $('loading').hidden = true; fn(); }, 40);
}

function newMatch(opts) {
  useMap(opts.type === 'adv' ? 'front' : opts.arena !== undefined ? 'line' : 'yard');
  if (opts.type === 'adv') opts.size = save.advSize;
  spawnPick = -1;
  match = new Match(map, { seed: (Math.random() * 2 ** 32) >>> 0, ...opts });
  me = opts.human ? match.soldiers[0] : null;
  vis.length = 0;
  for (const s of match.soldiers) vis.push({ stride: s.id * 1.3, pace: 0, lean: 0, lower: 0, hurt: -9, swingT: -9, twist: 0, blockK: 0, bd: [READY[0], READY[1], READY[2]], be: [0, 1, 0], bh: [0.07, 0.2, 0.24], tip: null, light: [SKY[0], SKY[1], SKY[2]] });
  fxReset();
  acc = 0;
  feed.length = 0;
  $('feed').innerHTML = '';
  $('pops').innerHTML = '';
}

// Bots playing behind the menu.
function attract() {
  newMatch({ human: false, mode: save.mode, type: save.type, attack: save.side, arena: arenaNow(), skill: [1, 1], scoreLimit: 1e9, timeLimit: save.type === 'adv' ? undefined : 1e9 });
  $('objs').innerHTML = $('marks').innerHTML = '';
  cam.dead = null;
}

function start() {
  clearTimeout(overTimer);
  stance = 0;
  newMatch({ human: true, mode: save.mode, cls: save[clsKey(MODES[save.mode])], skill: [1, save.skill], scoreLimit: save.limit, type: save.type, attack: save.side, arena: arenaNow() });
  Object.assign(feats, { last: -9, run: 0, killer: -1, dry: 0, bonus: 0 });
  phase = 'play';
  $('title').hidden = true;
  $('hud').hidden = false;
  $('limit').textContent = match.type === 'adv' ? '' : `First to ${save.limit}`;
  shown.objs = shown.sector = '';
  $('objs').innerHTML = $('marks').innerHTML = '';
  shown.hp = shown.mag = shown.reserve = shown.nades = shown.s0 = shown.s1 = shown.clock = -1;
  shown.gun = shown.cls = '';
  ui.close();
  grab();
  snd('deploy');
}

function toTitle() {
  clearTimeout(overTimer);
  phase = 'title';
  release();
  attract();
  $('hud').hidden = true;
  $('title').hidden = false;
  $('down').hidden = true;
  $('board').hidden = true;
  showTitle();
}

let overTimer = 0;
function finish() {
  // (Not if the player has left the match in the meantime.)
  if (phase !== 'play' || !me) return;
  phase = 'over';
  release();
  const won = match.winner === 0, drew = match.winner < 0;
  const before = rankOf(save.xp);
  const gained = me.score + feats.bonus + (won ? 500 : drew ? 250 : 150);
  save.matches++;
  if (won) save.wins++;
  save.kills += me.kills;
  save.deaths += me.deaths;
  save.heads += me.heads;
  save.streak = Math.max(save.streak, me.best);
  save.xp += gained;
  writeSave();
  const after = rankOf(save.xp);
  snd(won ? 'win' : 'lose');
  $('down').hidden = true;
  $('board').hidden = true;
  const acc100 = me.shots ? Math.round((100 * me.hits) / me.shots) : 0;
  ui.show(`<h2 class="${won ? 'win' : drew ? '' : 'loss'}">${won ? 'Victory' : drew ? 'Draw' : 'Defeat'}</h2>
    <p>${scoreLine()}</p>
    <div class="stats"><div><b>${me.kills}</b><span>Scrapped</span></div><div><b>${me.deaths}</b><span>Times scrapped</span></div><div><b>${me.assists}</b><span>Assists</span></div>
      <div><b>${acc100}%</b><span>Accuracy</span></div><div><b>${me.heads}</b><span>Head shots</span></div><div><b>${me.best}</b><span>Best streak</span></div></div>
    <p class="rank">${after.n > before.n ? 'Promoted: ' : ''}Rank ${after.n + 1} &middot; ${after.title} &nbsp; +${gained}</p>
    <div class="rankbar"><i style="width:${Math.round((100 * after.into) / after.need)}%"></i></div>
    ${boardHtml()}
    <div class="actions"><button class="btn btn-primary" data-action="again">Play again</button><button class="btn btn-soft" data-action="menu">Menu</button></div>`);
  $('card').classList.add('wide');
}

// The state of the match in a line, for the cards.
function scoreLine() {
  if (match.type !== 'adv') return `Blue ${match.scores[0]} &middot; Haywire ${match.scores[1]}`;
  const side = match.attack === 0 ? 'Blue attacking' : 'Blue defending';
  return `${side} &middot; ${match.sector} of ${match.sectors.length} sectors taken &middot; battalion ${match.battalion} of ${match.battalions}, ${match.tickets} ${match.tickets === 1 ? 'life' : 'lives'} left`;
}

// ---- mouse and keys -------------------------------------------------------------------

const keys = new Set();
const mouse = { fire: false, ads: false, mid: false };
// The side picked for the next blow (or guard) with the old arms, and the mouse movement that picks it.
const side = { x: 0, y: 0, at: 0, dir: FROM_RIGHT };
// What a blow just did, said under the sights for a moment; and the last blow that landed on the player.
const blowSaid = { text: '', color: '#fff', t: 0 };
const sayBlow = (text, color) => { blowSaid.text = text; blowSaid.color = color; blowSaid.t = 1; };
let lastCut = null;
const gunName = (id) => (id === 'kick' ? 'Kick' : GUNS[id].name);
let wantSlot = -1, wantCls = -1;
// 0 standing, 1 crouched, 2 lying down. C crouches and C again stands; Z lies
// down and Z again stands. Sprinting or jumping stands you up. C twice in
// quick succession while sprinting is a slide.
let stance = 0, lastC = -9, slideReq = false;
// Scrapped in Advance: where to come back in (-1 the usual place, or a squad mate).
let spawnPick = -1;
const fine = matchMedia('(pointer: fine)').matches;

let asking = 0; // when the game last asked to hold the mouse
function grab() {
  // (Asking twice at once makes some browsers drop the first.)
  if (document.pointerLockElement === canvas || performance.now() - asking < 400) return;
  asking = performance.now();
  try {
    const p = canvas.requestPointerLock({ unadjustedMovement: true });
    if (p && p.catch) p.catch(() => { try { const q = canvas.requestPointerLock(); if (q && q.catch) q.catch(() => {}); } catch { /* no pointer lock */ } });
  } catch { /* no pointer lock */ }
}
function release() {
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  keys.clear();
  mouse.fire = mouse.ads = false;
}

document.addEventListener('pointerlockchange', () => {
  const was = locked;
  locked = document.pointerLockElement === canvas;
  if (!locked) {
    keys.clear();
    mouse.fire = mouse.ads = false;
    $('board').hidden = true;
    // Only when the mouse was held and has been let go (Esc): that pauses.
    if (was && phase === 'play' && !ui.isOpen()) showPause();
  }
});
canvas.addEventListener('click', () => { if (phase === 'play' && !ui.isOpen() && !locked) grab(); });
document.addEventListener('mousemove', (e) => {
  if (!locked || phase !== 'play') return;
  // (Slower when the sights magnify, so the aim feels the same.)
  const k = 0.0022 * save.sens * (Math.tan(cam.fov / 2) / Math.tan(baseFov() / 2));
  view.yaw = wrap(view.yaw + e.movementX * k);
  view.pitch = clamp(view.pitch - e.movementY * k * (save.invert ? -1 : 1), -1.5, 1.5);
  hand.swayX = clamp(hand.swayX - e.movementX * 0.0006, -0.05, 0.05);
  hand.swayY = clamp(hand.swayY + e.movementY * 0.0006, -0.05, 0.05);
  // The old arms: the way the mouse last moved picks the side of a blow (and of a guard).
  const t = performance.now(), fade = Math.exp(-(t - side.at) / 110);
  side.at = t;
  side.x = side.x * fade + e.movementX * k;
  side.y = side.y * fade - e.movementY * k;
  if (Math.hypot(side.x, side.y) > 0.045) side.dir = Math.abs(side.x) > Math.abs(side.y) ? (side.x < 0 ? FROM_LEFT : FROM_RIGHT) : side.y > 0 ? OVERHEAD : THRUST;
});
document.addEventListener('mousedown', (e) => {
  if (!locked) return;
  if (e.button === 0) mouse.fire = true;
  if (e.button === 2) mouse.ads = true;
  if (e.button === 1) mouse.mid = true;
  e.preventDefault();
});
document.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouse.fire = false;
  if (e.button === 2) mouse.ads = false;
  if (e.button === 1) mouse.mid = false;
});
document.addEventListener('contextmenu', (e) => e.preventDefault());
let wheelAt = 0;
document.addEventListener('wheel', () => {
  // (One turn of the wheel is one swap, however many clicks it sends.)
  const now = performance.now();
  if (locked && me && me.alive && now - wheelAt > 300) wantSlot = 1 - me.slot;
  wheelAt = now;
}, { passive: true });

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (phase === 'play' && e.code === 'Tab') {
    e.preventDefault();
    if (!e.repeat) { $('board').hidden = false; boardAt = 0; }
  }
  if (phase !== 'play' || ui.isOpen()) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys.add(e.code);
  const digit = /^Digit([1-5])$/.exec(e.code);
  if (digit) {
    const n = Number(digit[1]) - 1;
    if (me && !me.alive) pickClass(n);
    else if (n < 2) wantSlot = n;
  }
  if (e.code === 'KeyQ' && me && me.alive) wantSlot = 1 - me.slot;
  // Scrapped: A and D (or the arrows) choose where to come back in.
  if (me && !me.alive && match.type === 'adv' && ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    const list = spawnList(), k = Math.max(0, list.findIndex((o) => o.id === spawnPick));
    spawnPick = list[(k + (e.code === 'KeyD' || e.code === 'ArrowRight' ? 1 : list.length - 1)) % list.length].id;
    shown.down = '';
    snd('tap');
  }
  if (e.code === 'KeyC' && me && me.alive) {
    const now = performance.now();
    if (me.sprinting && now - lastC < 400) { slideReq = true; lastC = -9; } else lastC = now;
    stance = stance === 1 ? 0 : 1;
  }
  if (e.code === 'KeyZ' && me && me.alive) stance = stance === 2 ? 0 : 2;
  if (e.code === 'KeyP') showPause();
  if (e.code === 'KeyF') fullScreen();
});
window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
  if (e.code === 'Tab') $('board').hidden = true;
});
window.addEventListener('blur', () => { keys.clear(); mouse.fire = mouse.ads = mouse.mid = false; $('board').hidden = true; });

function feedInput() {
  const inp = me.in, on = locked || force;
  inp.mx = on ? (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) : 0;
  inp.mz = on ? (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) : 0;
  inp.yaw = view.yaw;
  inp.pitch = view.pitch;
  inp.jump = on && keys.has('Space');
  inp.sprint = on && (keys.has('ShiftLeft') || keys.has('ShiftRight'));
  if (inp.jump || (inp.sprint && inp.mz > 0) || !me.alive) stance = 0;
  // A slide ends crouched, unless you go on sprinting.
  if (slideReq) { inp.slide = true; slideReq = false; stance = 1; } else inp.slide = false;
  inp.crouch = stance === 1;
  inp.prone = stance === 2;
  inp.use = on && keys.has('KeyE');
  inp.deploy = (on || !me.alive) && keys.has('Space') && !me.alive;
  inp.spawnAt = spawnPick;
  inp.ads = on && mouse.ads;
  inp.fire = on && mouse.fire;
  inp.reload = on && keys.has('KeyR');
  inp.nade = on && keys.has('KeyG');
  inp.melee = on && keys.has('KeyV');
  inp.toss = on && (mouse.mid || keys.has('KeyT'));
  inp.dir = side.dir;
  inp.slot = wantSlot;
  inp.cls = wantCls;
  wantSlot = wantCls = -1;
}

function fullScreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  } catch { /* not allowed here */ }
}

function pickClass(n) {
  save[clsKey(match.mode)] = n;
  writeSave();
  wantCls = n;
  if (me) me.nextCls = n;
  snd('tap');
  shown.down = '';
}

// ---- what happens --------------------------------------------------------------------

const feed = [];
const GUN_K = { rifle: 0, smg: 1, shotgun: 2, lmg: 3, sniper: 4, pistol: 5 };
const tmpA = [0, 0, 0];

// A sound from somewhere in the yard: quieter with distance, and to one side.
function sound(name, k, x, y, z, loud = 1, reach = 70) {
  if (phase !== 'play') return;
  const dx = x - cam.eye[0], dy = y - cam.eye[1], dz = z - cam.eye[2], d = Math.hypot(dx, dy, dz);
  if (d > reach) return;
  const vol = loud * (1 - d / reach) ** 2;
  if (vol < 0.02) return;
  const pan = d > 0.5 ? (dx * Math.cos(cam.yaw) + dz * Math.sin(cam.yaw)) / d : 0;
  snd(name, k, Math.min(1, vol), pan * 0.8);
}

// Where the end of a robot's barrel is, near enough.
function muzzleOf(s, out) {
  if (s === me && cam.dead === null) {
    const hip = 1 - ease(me.ads), v = cam.view;
    // (Out in front, and down and to the right when firing from the hip.)
    out[0] = cam.eye[0] - v[2] * 0.7 + v[0] * 0.13 * hip - v[1] * (0.03 + 0.1 * hip);
    out[1] = cam.eye[1] - v[6] * 0.7 + v[4] * 0.13 * hip - v[5] * (0.03 + 0.1 * hip);
    out[2] = cam.eye[2] - v[10] * 0.7 + v[8] * 0.13 * hip - v[9] * (0.03 + 0.1 * hip);
    return out;
  }
  const d = match.aim(s, tmpA);
  out[0] = s.x + d[0] * 0.85 + Math.cos(s.yaw) * 0.1;
  out[1] = match.eyeY(s) - 0.22 + d[1] * 0.85;
  out[2] = s.z + d[2] * 0.85 + Math.sin(s.yaw) * 0.1;
  return out;
}

function onEvent(ev) {
  const s = ev.id !== undefined ? match.soldiers[ev.id] : null;
  switch (ev.e) {
    case 'shot': {
      const from = muzzleOf(s, [0, 0, 0]), mine = s === me, glow = TEAM[s.team].glow;
      if (ev.first) {
        if (mine) {
          snd('gun', GUN_K[ev.gun], 0.9);
          hand.kick = Math.min(1.6, hand.kick + (ev.gun === 'sniper' || ev.gun === 'shotgun' ? 1.5 : ev.gun === 'pistol' ? 0.8 : 0.5));
          hand.flash = 0.045;
          hand.roll = Math.random() * TAU;
          fx.light(from[0], from[1], from[2], 7, 1.6, 1.2, 0.6, 0.06);
        } else {
          sound('gun', GUN_K[ev.gun], from[0], from[1], from[2], 0.75, 95);
          fx.glow(from[0], from[1], from[2], 0.38, [1, 0.8, 0.4], 0.05);
          fx.light(from[0], from[1], from[2], 6, 1.2, 0.9, 0.45, 0.06);
        }
      }
      fx.tracer(from, [ev.x, ev.y, ev.z], mine ? [1, 0.92, 0.6] : [glow[0] * 0.6 + 0.4, glow[1] * 0.6 + 0.4, glow[2] * 0.6 + 0.4], ev.gun === 'shotgun' ? 0.012 : 0.02);
      if (ev.hit === 0) {
        fx.impact(ev.x, ev.y, ev.z, ev.n);
        if (!mine && Math.hypot(ev.x - cam.eye[0], ev.y - cam.eye[1], ev.z - cam.eye[2]) < 5) sound('ping', (Math.random() * 3) | 0, ev.x, ev.y, ev.z, 0.8, 12);
      } else if (ev.hit > 0) {
        fx.sparks(ev.x, ev.y, ev.z, 7, [1, 0.85, 0.5], 5);
        sound('clank', 0, ev.x, ev.y, ev.z, 0.5, 40);
      }
      break;
    }
    case 'hurt': {
      vis[ev.id].hurt = performance.now();
      const by = match.soldiers[ev.by];
      if (by === me && s !== me) hitMark(ev.head ? 1 : 0);
      if (s === me) {
        hurtShow = Math.min(1, hurtShow + 0.25 + ev.dmg / 80);
        cam.shake = Math.min(0.5, cam.shake + ev.dmg / 200);
        snd('pain');
        if (by !== me) fromShow.push({ x: by.x, z: by.z, t: 1 });
      }
      break;
    }
    case 'kill': {
      const by = match.soldiers[ev.by];
      // Down, for a medic to save: it falls, sparking. Otherwise it comes apart.
      if (s.down > 0) {
        const g = TEAM[s.team].glow;
        fx.sparks(ev.x, ev.y + 1, ev.z, 16, [g[0] * 0.5 + 0.5, g[1] * 0.5 + 0.5, g[2] * 0.5 + 0.5], 5);
        fx.puff(ev.x, ev.y + 0.6, ev.z, 0.5, 0.25, 1.2, 0.8);
      } else fx.scrap(match, s, vis[s.id], models.robots[s.team], null, TEAM[s.team].glow);
      sound('scrap', 0, ev.x, ev.y + 1, ev.z, 0.9, 60);
      addFeed(by, s, ev.gun, ev.head);
      if (by === me && s !== me) {
        hitMark(2);
        pop(`<b>+${ev.head ? 125 : 100}</b>Scrapped ${s.name}${ev.head ? ' &middot; head shot' : ''}`);
        feat(ev, s);
        if ([3, 5, 7, 10, 15].includes(me.streak)) pop(`${me.streak} in a row`, 'streak');
      }
      if (s === me) {
        cam.dead = { by: by !== me ? by : null, t: 0 };
        feats.dry++;
        feats.run = 0;
        feats.killer = by !== me ? by.id : -1;
        $('down').hidden = false;
        // Who did it, with what, and how much they had left.
        // (Cut down: which side the blow came from, and how to have stopped it.)
        const cut = lastCut && lastCut.by === ev.by && GUNS[ev.gun] && GUNS[ev.gun].kind === 'melee' ? meets(lastCut.dir) : -1;
        const how = cut < 0 ? '' : `<small class="how">The blow came ${['from your left', 'from your right', 'from above', 'straight in, a thrust'][cut]}. Hold right-click and move the mouse ${['left', 'right', 'up', 'down'][cut]} to block one.</small>`;
        $('downBy').innerHTML = by !== me ? `Scrapped by <b>${by.name}</b><small>${ev.gun === 'nade' ? (match.mode.pot ? 'Fire pot' : 'Grenade') : gunName(ev.gun)}${ev.head ? ', to the head' : ''} &middot; ${by.alive ? `${Math.ceil(by.hp)} of ${by.maxHp} left` : 'scrapped too'}</small>${how}`
          : ev.gun === 'out' ? 'Scrapped for leaving the fight' : ev.gun === 'barrage' ? 'Caught in the barrage' : `Blown up by your own ${match.mode.pot ? 'fire pot' : 'grenade'}`;
        shown.down = '';
        mouse.fire = false;
      } else if (me && me.assists > shownAssists) pop('<b>+40</b>Assist');
      if (me) shownAssists = me.assists;
      break;
    }
    case 'boom': {
      fx.boom(ev.x, ev.y, ev.z);
      const d = Math.hypot(ev.x - cam.eye[0], ev.y - cam.eye[1], ev.z - cam.eye[2]);
      sound('blast', 0, ev.x, ev.y, ev.z, 1, 110);
      if (phase === 'play') cam.shake = Math.min(1, cam.shake + clamp(1 - d / 28, 0, 1));
      break;
    }
    case 'gone': fx.scrap(match, s, vis[s.id], models.robots[s.team], null, TEAM[s.team].glow); break;
    case 'revive': {
      const by = match.soldiers[ev.by];
      fx.glow(s.x, s.y + 1, s.z, 1.4, [0.5, 1, 0.6], 0.4);
      fx.sparks(s.x, s.y + 1, s.z, 14, [0.6, 1, 0.7], 4);
      sound('reunite', 0, s.x, s.y + 1, s.z, 0.7, 40);
      if (by === me) pop(`<b>+80</b>Got ${s.name} back on their feet`);
      if (s === me) {
        view.yaw = me.yaw;
        view.pitch = 0;
        stance = 0;
        cam.dead = null;
        cam.y = match.eyeY(me);
        $('down').hidden = true;
        hurtShow = 0;
        pop(`${by.name} got you back on your feet`, 'streak');
      }
      break;
    }
    case 'regroup':
      if (me && phase === 'play') {
        cam.dead = { by: null, t: 0 };
        $('down').hidden = false;
        $('downBy').innerHTML = `Battalion ${match.battalion} regroups<small>Everyone comes back in at ${match.sectorNow().name}, and it starts over</small>`;
        shown.down = '';
        mouse.fire = false;
      }
      break;
    case 'spawn':
      if (s === me) {
        view.yaw = me.yaw;
        view.pitch = 0;
        stance = 0;
        cam.dead = null;
        cam.y = match.eyeY(me);
        $('down').hidden = true;
        hurtShow = 0;
        snd('deploy');
      }
      break;
    case 'reload': if (s === me) snd('mag', ev.gun === 'lmg' ? 2 : ev.gun === 'shotgun' ? 0 : 1, 0.7); else sound('mag', 1, s.x, s.y + 1, s.z, 0.35, 18); break;
    case 'shell': if (s === me) snd('clack'); break;
    case 'swap': if (s === me) snd('swap'); break;
    case 'dry': if (s === me) snd('tap'); break;
    // The old arms.
    case 'incoming':
      // A shell on its way: a mark where it will land, and the sound of it coming.
      fx.glow(ev.x, ev.y + 0.2, ev.z, 2.6, [0.9, 0.12, 0.05], 1.3);
      sound('swoop', 0, ev.x, ev.y, ev.z, 0.9, 60);
      break;
    case 'swing':
      if (s === me && !s.weapons[s.slot].gun.kind) hand.bash = 1;
      vis[ev.id].swingT = match.time;
      if (s === me) snd('whoosh', 0, 0.45); else sound('whoosh', 0, s.x, s.y + 1.2, s.z, 0.5, 22);
      break;
    case 'cut':
      // A blow (or an arrow, or a thrown thing) that bites.
      fx.sparks(ev.x, ev.y, ev.z, 11, [1, 0.8, 0.45], 5);
      fx.glow(ev.x, ev.y, ev.z, 0.45, [1, 0.55, 0.25], 0.12);
      sound('chop', 0, ev.x, ev.y, ev.z, 1, 40);
      if (ev.by !== undefined && me) {
        if (ev.by === me.id) cam.shake = Math.min(0.5, cam.shake + 0.1);
        if (s === me) { lastCut = { by: ev.by, dir: ev.dir }; cam.shake = Math.min(0.6, cam.shake + 0.2); }
      }
      break;
    case 'block':
      // A blow (or an arrow) stopped by a guard or a shield; a parry, if the guard went up just in time.
      fx.sparks(ev.x, ev.y, ev.z, ev.parry ? 24 : 12, ev.parry ? [1, 0.85, 0.35] : [0.9, 0.95, 1], ev.parry ? 8 : 6);
      fx.light(ev.x, ev.y, ev.z, 4, 1, 1, ev.parry ? 0.6 : 1.2, 0.08);
      sound('clang', ev.shield ? 1 : 0, ev.x, ev.y, ev.z, 1, 45);
      if (ev.parry) sound('clang', 0, ev.x, ev.y, ev.z, 0.6, 30);
      if (me && s === me && ev.by !== undefined) sayBlow(ev.parry ? 'Parried' : 'Blocked', ev.parry ? '#ffd257' : '#e8f2ff');
      if (me && ev.by === me.id) { sayBlow(ev.parry ? 'They parried it' : 'They blocked it', '#ff9a72'); cam.shake = Math.min(0.6, cam.shake + 0.22); }
      break;
    case 'windup':
      if (s === me) snd('slide', 0, 0.12); else sound('slide', 0, s.x, s.y + 1.4, s.z, 0.22, 14);
      break;
    case 'feint': if (s === me) sayBlow('Feint', '#cfd6e0'); break;
    case 'broken': if (s === me) sayBlow('Knocked off your blow', '#ff7a5c'); break;
    case 'kick': if (s === me) snd('whoosh', 0, 0.3); else sound('whoosh', 0, s.x, s.y + 0.8, s.z, 0.35, 18); break;
    case 'kicked':
      fx.puff(ev.x, ev.y, ev.z, 0.25, 0.4, 0.5, 0.3);
      sound('thump', 0, ev.x, ev.y, ev.z, 1, 35);
      if (me && s === me) { sayBlow('Kicked off balance', '#ff7a5c'); cam.shake = Math.min(0.7, cam.shake + 0.4); }
      if (me && ev.by === me.id) sayBlow('Kicked', '#ffd257');
      break;
    case 'draw': if (s === me) snd('slide', 0, 0.25); break;
    case 'loose': if (s === me) snd('twang', 0, 0.8); else sound('twang', 0, s.x, s.y + 1.4, s.z, 0.6, 30); break;
    case 'hurl':
      if (s === me) { snd('lob', 0, 0.8); hand.kick = 1.4; } else sound('lob', 0, s.x, s.y + 1.4, s.z, 0.5, 25);
      break;
    case 'stick':
      fx.stick(models.thrown[ev.kind], M.chain(M.move(ev.x, ev.y, ev.z), M.rotY(-Math.atan2(ev.dx, -ev.dz)), M.rotX(Math.asin(clamp(ev.dy, -1, 1)))));
      fx.puff(ev.x, ev.y, ev.z, 0.1, 0.5, 0.3, 0.2);
      sound('clack', 0, ev.x, ev.y, ev.z, 0.7, 30);
      break;
    case 'throw': if (s === me) snd('lob'); else sound('lob', 0, s.x, s.y + 1.4, s.z, 0.5, 25); break;
    case 'bounce': sound('clack', 0, ev.x, ev.y, ev.z, 0.6, 28); break;
    case 'jump': if (s === me) snd('hop', 0, 0.25); break;
    case 'whizz': sound('whizz', 0, ev.x, ev.y, ev.z, 1, 8); cam.shake = Math.min(0.35, cam.shake + 0.06); break;
    case 'slide': if (s === me) snd('slide', 0, 0.7); else sound('slide', 0, s.x, s.y, s.z, 0.5, 20); break;
    case 'ammo':
      if (s === me) {
        snd('clack', 0, 0.6);
        pop(`<b>+${ev.n}</b>${UNIT[ev.gun] || 'rounds'} from a dropped ${GUNS[ev.gun].name}`);
      }
      break;
    case 'pickup':
      if (s === me) { snd('mag', 1, 0.7); pop(`Picked up the ${GUNS[ev.gun].name}`); }
      break;
    case 'land': if (s === me) { hand.dip = Math.min(1, ev.v / 9); snd('foot', 2, 0.6); } break;
    case 'foot': if (s === me) snd('foot', (Math.random() * 2) | 0, me.sprinting ? 0.5 : 0.3); else sound('foot', 0, s.x, s.y, s.z, 0.45, 14); break;
    // Advance.
    case 'taken':
    case 'lost': {
      if (phase !== 'play') break;
      const ours = (ev.e === 'taken') === (match.attack === 0);
      pop(ours ? `Objective ${ev.name} is ours` : `Objective ${ev.name} lost`, ours ? 'streak' : '');
      snd(ours ? 'goal' : 'alarm', 0, 0.8);
      break;
    }
    case 'sector': {
      if (phase !== 'play') break;
      const last = ev.n >= match.sectors.length - 1, ours = match.attack === 0, name = match.sectors[ev.n].name;
      pop(ours ? (last ? `${map.name} is taken` : `${name} is taken: on to ${match.sectorNow().name}`) : (last ? `${map.name} is lost` : `${name} is lost: fall back to ${match.sectorNow().name}`), 'streak');
      if (!last) pop(ours ? `Catch them falling back: +${ROUT} lives each` : `Fall back, or be cut off`);
      if (!last) snd(ours ? 'cheer' : 'lose', 0, 0.8);
      break;
    }
    case 'battalion':
      if (phase !== 'play') break;
      pop(match.attack === 0 ? `Battalion ${ev.n} takes up the attack` : `Their battalion is spent: ${match.battalions - ev.n + 1} to go`, 'streak');
      snd(match.attack === 0 ? 'alarm' : 'cheer', 0, 0.8);
      break;
    case 'rout':
      if (me && match.soldiers[ev.by] === me) pop(`<b>+${ROUT} lives</b>Caught falling back`);
      break;
    case 'over': if (phase === 'play') { clearTimeout(overTimer); overTimer = setTimeout(finish, 900); } break;
    default:
  }
}

// Feats: a few points more for scrapping something in style. (They go to
// your rank, not to the match's scores.)
// Where the player could come back in: the usual place, or beside a squad
// mate who is out of trouble (Advance only).
function spawnList() {
  const out = [{ id: -1, label: match.attack === 0 ? 'The line' : 'The rear' }];
  for (const s of match.soldiers) {
    if (s === me || s.team !== me.team || s.squad !== me.squad || !s.alive) continue;
    if (match.canSpawnOn(me, s)) out.push({ id: s.id, label: `${s.name} <small>${match.classes[s.cls].name}</small>` });
  }
  return out;
}

// One of your own down within reach, for a medic.
function bodyNear(s) {
  let best = null, bestD = REVIVE_REACH;
  for (const e of match.soldiers) {
    if (e.alive || e.team !== s.team || e.down <= 0 || Math.abs(e.y - s.y) > 1.5) continue;
    const d = Math.hypot(e.x - s.x, e.z - s.z);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

// What a weapon's rounds are called, where they aren't rounds.
const UNIT = { bow: 'arrows', spear: 'pikes', axe: 'hatchets', daggers: 'knives', sword: '', knife: '' };

const feats = { last: -9, run: 0, killer: -1, dry: 0, bonus: 0 };
function feat(ev, s) {
  const got = [], gun = GUNS[ev.gun], far = Math.hypot(me.x - ev.x, me.z - ev.z);
  feats.run = match.time - feats.last < 4 ? feats.run + 1 : 1;
  feats.last = match.time;
  if (feats.run === 2) got.push(['Double', 50]);
  if (feats.run === 3) got.push(['Triple', 100]);
  if (feats.run >= 4) got.push(['Rampage', 150]);
  if (match.scores[0] + match.scores[1] === 1) got.push(['First scrap', 50]);
  if (s.id === feats.killer) { got.push(['Payback', 50]); feats.killer = -1; }
  if (feats.dry >= 3) got.push(['Comeback', 50]);
  if (ev.gun === 'bash') got.push(['Clobbered', 50]);
  else if (ev.gun === 'kick') got.push(['Booted', 75]);
  else if (ev.gun === 'nade') got.push([match.mode.pot ? 'Fire pot' : 'Grenade', 25]);
  else if (gun && far > (gun.kind === 'melee' ? 12 : gun.kind ? 28 : 45)) got.push([gun.kind === 'melee' ? 'Long throw' : 'Long shot', 50]);
  if (me.alive && me.hp < me.maxHp * 0.25) got.push(['Close call', 25]);
  feats.dry = 0;
  for (const [name, pts] of got) {
    feats.bonus += pts;
    pop(`<b>+${pts}</b>${name}`);
  }
}

// ---- the heads-up display -------------------------------------------------------------

const shown = { hp: -1, mag: -1, reserve: -1, nades: -1, s0: -1, s1: -1, clock: -1, gun: '', cls: '', down: '', note: '' };
let hurtShow = 0, shownAssists = 0, boardAt = 0;
const fromShow = [];

// The cross that flashes when a shot lands: once a frame, however many
// pellets hit, for the best of them (0 a hit, 1 the head, 2 scrapped).
let marked = -1;
function hitMark(kind) { marked = Math.max(marked, kind); }
function showMark() {
  if (marked < 0) return;
  const el = $('mark');
  el.className = 'mark';
  void el.offsetWidth;
  el.className = marked === 2 ? 'mark kill' : 'mark hit';
  snd('hitmark', marked, 0.9);
  marked = -1;
}

function pop(html, cls = '') {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const box = $('pops');
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.remove(), 2000);
}

function addFeed(by, s, gun, head) {
  const el = document.createElement('div');
  if (by === me || s === me) el.className = 'mine';
  const what = gun === 'nade' ? (match.mode.pot ? 'fire pot' : 'grenade') : gun === 'out' ? '' : gunName(gun);
  el.innerHTML = by === s ? `<span class="t${s.team}">${s.name}</span><em>${gun === 'out' ? 'left the fight' : gun === 'barrage' ? 'the barrage' : match.mode.pot ? 'own fire pot' : 'own grenade'}</em>`
    : `<span class="t${by.team}">${by.name}</span><em class="${head ? 'head' : ''}">${what}${head ? ' &middot; head' : ''}</em><span class="t${s.team}">${s.name}</span>`;
  const box = $('feed');
  box.appendChild(el);
  while (box.children.length > 5) box.firstChild.remove();
  setTimeout(() => el.classList.add('old'), 5000);
  setTimeout(() => el.remove(), 5600);
}

const classCard = (c, i, on, key = true) => `<button class="class${on ? ' on' : ''}" data-cls="${i}">${key ? `<kbd>${i + 1}</kbd>` : ''}<b>${c.name}</b><span>${c.what}</span><em>${GUNS[c.gun].name}</em></button>`;

function boardHtml() {
  const team = (t) => `<div class="team t${t}"><h3><span>${t ? 'HAYWIRE' : 'BLUE'}</span><span>${match.scores[t]}</span></h3><table><tr><th>Robot</th><th>Score</th><th>K</th><th>D</th><th>A</th></tr>${
    match.table(t).map((s) => `<tr class="${s === me ? 'me' : ''}${s.alive ? '' : ' dead'}"><td>${s.name}<small>${match.classes[s.cls].name}</small></td><td>${s.score}</td><td>${s.kills}</td><td>${s.deaths}</td><td>${s.assists}</td></tr>`).join('')}</table></div>`;
  return `<div class="board${match.size > 12 ? ' many' : ''}">${team(0)}${team(1)}</div>`;
}

function updateHud(now, dt) {
  if ((phase !== 'play' && phase !== 'over') || !me) return;
  showMark();
  const set = (key, v, id, text = v) => { if (shown[key] !== v) { shown[key] = v; $(id).textContent = text; return true; } return false; };
  if (match.type === 'adv') hudAdvance();
  else {
    if (set('s0', match.scores[0], 'scoreBlue')) $('barBlue').style.width = `${(100 * match.scores[0]) / match.scoreLimit}%`;
    if (set('s1', match.scores[1], 'scoreOrange')) $('barOrange').style.width = `${(100 * match.scores[1]) / match.scoreLimit}%`;
  }
  const left = Math.max(0, Math.ceil(match.timeLimit - match.time));
  set('clock', left, 'clock', `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);
  const wp = me.weapons[me.slot], gun = wp ? wp.gun : null;
  const hp = Math.max(0, Math.ceil(me.hp));
  if (set('hp', hp, 'hp')) {
    $('hpBar').style.width = `${(100 * hp) / (me.maxHp || 100)}%`;
    $('hpBar').parentElement.classList.toggle('low', hp < 40);
  }
  set('cls', match.classes[me.cls].name, 'clsName');
  if (gun && gun.kind) {
    // The old arms: only what there is a number of to show.
    const counted = gun.kind === 'bow' || gun.throw;
    set('mag', counted ? `n${wp.mag}` : 'none', 'mag', counted ? wp.mag : '');
    $('mag').classList.remove('low');
    set('reserve', gun.id, 'reserve', gun.kind === 'bow' ? 'arrows' : { spear: 'pikes', axe: 'hatchets', daggers: 'knives' }[gun.id] || '');
  } else if (gun) {
    if (set('mag', wp.mag, 'mag')) $('mag').classList.toggle('low', wp.mag <= gun.mag * 0.25);
    set('reserve', wp.reserve, 'reserve', wp.reserve === Infinity ? '∞' : wp.reserve);
  }
  if (gun) {
    set('gun', gun.name, 'gunName');
    if (shown.nades !== me.nadeCount) { shown.nades = me.nadeCount; $('nades').innerHTML = '<i></i>'.repeat(me.nadeCount); }
  }
  // The sights open out as the aim loosens, and go when the gun is up.
  const cross = $('cross');
  if (me.alive && gun) {
    // (With a bow they close in as it is drawn.)
    const gap = gun.kind ? (gun.kind === 'bow' ? 17 - 12 * me.draw : 6) : 3 + (Math.tan(match.spread(me)) / Math.tan(cam.fov / 2)) * (H / 2);
    cross.style.setProperty('--gap', `${gap.toFixed(1)}px`);
    const scoped = gun.id === 'sniper' && me.ads > 0.9;
    cross.classList.toggle('aim', me.ads > 0.5 && !gun.kind);
    cross.style.opacity = me.sprinting || scoped || (gun.id === 'sniper' && me.ads > 0.5) ? 0 : 1;
    $('scope').style.opacity = scoped ? 1 : 0;
  } else { cross.style.opacity = 0; $('scope').style.opacity = 0; }
  // Whoever is in your sights is named under them.
  let who = '';
  if (me.alive && !me.sprinting) {
    const d = match.aim(me, tmpA), ex = me.x, ey = match.eyeY(me), ez = me.z;
    let best = Math.min(90, world.ray(ex, ey, ez, d[0], d[1], d[2], 90)), seen = null;
    for (const s of match.soldiers) {
      if (!s.alive || s === me) continue;
      const h = match.rayHits(s, ex, ey, ez, d[0], d[1], d[2], best);
      if (h.t < best) { best = h.t; seen = s; }
    }
    if (seen) who = `<span class="t${seen.team}">${seen.name}</span><small>${match.classes[seen.cls].name}</small>`;
  }
  if (shown.who !== who) { shown.who = who; $('who').innerHTML = who; }
  let note = '', warn = false;
  // Advance: out of the sector being fought for, with how long there is to get back.
  let astray = '';
  const fence = me.alive && !match.over ? match.bounds(me) : null;
  if (fence) {
    const [lo, hi] = fence;
    if (me.x < lo || me.x > hi) {
      const adv = match.type === 'adv';
      const left = (adv ? Math.max(0, match.retreatUntil - match.time) : 0) + 6 - me.out;
      astray = `${adv && match.attack !== 0 && me.x < lo ? 'Fall back to the next sector' : 'Get back to the fight'}: ${Math.ceil(left)}`;
    }
  }
  if (astray) { note = astray; warn = true; }
  else if (me.alive && gun && gun.kind) {
    if (gun.kind === 'bow' && wp.mag === 0) { note = 'Out of arrows: Q for the dagger'; warn = true; }
  } else if (me.alive && gun) {
    if (me.reloadT > 0) note = 'Reloading';
    else if (wp.mag === 0 && wp.reserve <= 0) { note = 'Out of rounds'; warn = true; }
    else if (wp.mag <= gun.mag * 0.25 && wp.reserve > 0) { note = 'R to reload'; warn = wp.mag === 0; }
  }
  // A weapon at your feet that you could take instead of your own.
  // Or, for a medic, one of your own down beside you.
  const body = me.alive && match.classes[me.cls].medic ? bodyNear(me) : null;
  const near = me.alive && !body ? match.dropNear(me) : null;
  const take = body ? `<b>E</b> hold to get ${body.name} back on their feet <i class="bar"><i style="width:${Math.round((100 * (me.reviving === body.id ? me.reviveT : 0)) / REVIVE_TIME)}%"></i></i>`
    : near ? `<b>E</b> take the ${GUNS[near.gun].name}${near.mag + near.reserve > 0 ? ` &middot; ${near.mag + near.reserve} ${UNIT[near.gun] || 'rounds'}` : ''}` : '';
  if (shown.take !== take) { shown.take = take; $('use').innerHTML = take; }
  if (shown.note !== note) { shown.note = note; $('note').textContent = note; $('note').classList.toggle('warn', warn); }
  // Being hit.
  hurtShow = Math.max(0, hurtShow - dt * 0.9);
  const low = me.alive && me.hp < me.maxHp * 0.45 ? 0.35 + 0.15 * Math.sin(now / 160) : 0;
  $('hurt').style.opacity = Math.max(hurtShow, low).toFixed(2);
  // Pinned down by rounds going close past: the edges of the view darken.
  const pin = me.alive ? Math.min(0.75, me.supp * 0.85).toFixed(2) : '0';
  if (shown.pin !== pin) { shown.pin = pin; $('supp').style.opacity = pin; }
  let arcs = '';
  for (let k = fromShow.length - 1; k >= 0; k--) {
    const f = fromShow[k];
    f.t -= dt * 0.8;
    if (f.t <= 0) { fromShow.splice(k, 1); continue; }
    const a = Math.atan2(f.x - cam.eye[0], -(f.z - cam.eye[2])) - cam.yaw;
    arcs += `<i style="transform:rotate(${a.toFixed(2)}rad);opacity:${Math.min(1, f.t * 2).toFixed(2)}"></i>`;
  }
  if (arcs !== shown.arcs) { shown.arcs = arcs; $('from').innerHTML = arcs; }
  // Scrapped: the wait, where to come back in, and a change of class.
  if (!me.alive && phase === 'play') {
    const list = match.type === 'adv' ? spawnList() : [];
    if (!list.some((o) => o.id === spawnPick)) spawnPick = -1;
    const medic = me.down > 0 && match.medicNear(me, 30);
    const wait = Math.ceil(Math.max(0, me.respawnT));
    const key = `${wait}|${me.nextCls}|${spawnPick}|${list.map((o) => o.id).join(',')}|${medic ? Math.ceil(me.down) : ''}`;
    if (shown.down !== key) {
      shown.down = key;
      $('downIn').textContent = wait > 0 ? `Back in ${wait}` : medic ? `A medic is near: wait to be got back on your feet (${Math.ceil(me.down)}), or Space to come back in now` : 'Coming back in';
      $('downSpawn').innerHTML = list.length > 1 ? list.map((o) => `<span class="${o.id === spawnPick ? 'on' : ''}">${o.label}</span>`).join('') + '<em>A and D to choose</em>' : '';
      $('spawnMap').hidden = match.type !== 'adv';
      $('downClasses').innerHTML = match.classes.map((c, i) => classCard(c, i, i === me.nextCls)).join('');
    }
  }
  if (!me.alive && phase === 'play' && match.type === 'adv' && now - mapAt > 200) { mapAt = now; drawSpawnMap(); }
  // (Down, the objectives are on the map instead of at the top.)
  $('objs').hidden = !me.alive && match.type === 'adv';
  if (!$('board').hidden && now - boardAt > 250) { boardAt = now; $('board').classList.toggle('many', match.size > 12); $('board').innerHTML = boardHtml().replace(/^<div class="board[^"]*">|<\/div>$/g, ''); }
  $('grab').hidden = locked || force || ui.isOpen() || phase !== 'play';
  drawRadar();
}

// Advance: the attackers' lives against the sectors the defenders still
// hold, and the objectives, at the top and out in the yard.
const TEAM_CSS = ['#4a9bff', '#ff8a2a'];
function hudAdvance() {
  const att = match.attack, all = match.sectors.length, held = all - Math.min(all, match.sector);
  const nums = att === 0 ? [match.tickets, held] : [held, match.tickets];
  const bars = att === 0 ? [match.tickets / match.ticketsAtStart, held / all] : [held / all, match.tickets / match.ticketsAtStart];
  if (shown.s0 !== nums[0]) { shown.s0 = nums[0]; $('scoreBlue').textContent = nums[0]; $('barBlue').style.width = `${Math.min(100, 100 * bars[0])}%`; }
  if (shown.s1 !== nums[1]) { shown.s1 = nums[1]; $('scoreOrange').textContent = nums[1]; $('barOrange').style.width = `${Math.min(100, 100 * bars[1])}%`; }
  const stage = `${match.sector}|${match.battalion}`;
  if (shown.sector !== stage) {
    shown.sector = stage;
    $('limit').textContent = `Sector ${Math.min(all, match.sector + 1)} of ${all} · Battalion ${match.battalion} of ${match.battalions}`;
    $('marks').innerHTML = match.objectives().map((o) => `<div class="objmark"><b>${o.name}</b><span></span></div>`).join('');
  }
  const objs = match.objectives(), vp = M.mul(cam.proj, cam.view);
  let key = '';
  for (const o of objs) key += `${o.own ? 1 : 0}${Math.round(o.p * 40)}${o.a > 0 && o.d > 0 ? 'f' : ''}|`;
  if (shown.objs !== key) {
    shown.objs = key;
    // The frame is the colour of whoever holds it; the bar, the attackers' progress.
    $('objs').innerHTML = objs.map((o) => `<div class="obj t${o.own ? att : 1 - att}${o.a > 0 && o.d > 0 ? ' fight' : ''}"><i class="t${att}" style="height:${Math.round(o.p * 100)}%"></i><b>${o.name}</b></div>`).join('');
  }
  // A marker for each out in the yard, kept on screen when it is off to one side or behind.
  const marks = $('marks').children;
  objs.forEach((o, i) => {
    const el = marks[i];
    if (!el) return;
    const p = [o.x, o.y + 2.4, o.z];
    const w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
    let x = (vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12]) / Math.abs(w || 1e-6), y = (vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13]) / Math.abs(w || 1e-6);
    if (w < 0) { x = -x; y = -1; x = x >= 0 ? Math.max(x, 0.6) : Math.min(x, -0.6); }
    const k = Math.max(Math.abs(x) / 0.94, Math.abs(y) / 0.86, 1);
    el.style.transform = `translate(${(((x / k) * 0.5 + 0.5) * W).toFixed(0)}px, ${((0.5 - (y / k) * 0.5) * H).toFixed(0)}px)`;
    el.className = `objmark t${o.own ? att : 1 - att}`;
    const d = Math.round(Math.hypot(o.x - cam.eye[0], o.z - cam.eye[2]));
    const inside = me.alive && Math.hypot(o.x - me.x, o.z - me.z) <= 5.5 && Math.abs(o.y - me.y) <= 3;
    const txt = inside ? (o.a > 0 && o.d > 0 ? 'Contested' : (att === 0) !== o.own ? (att === 0 ? 'Taking' : 'Taking back') : 'Holding') : `${d} m`;
    if (el.lastChild.textContent !== txt) el.lastChild.textContent = txt;
  });
}

// ---- the radar ------------------------------------------------------------------------

let radarMap = null, mapAt = 0;

// Scrapped in Advance: a map of the sector being fought for, to choose
// where to come back in. The objectives, your team, the other side where
// it was last seen, your squad mates you could come in beside (named), and
// your choice ringed in white: a squad mate, or your side's line.
function drawSpawnMap() {
  const c = $('spawnMap'), g = c.getContext('2d'), sec = match.sectorNow();
  const x0 = Math.max(0, sec.x0 - 22), x1 = Math.min(map.W, sec.x1 + 22), k = Math.min(c.width / (x1 - x0), c.height / map.H);
  const ox = (c.width - (x1 - x0) * k) / 2, oz = (c.height - map.H * k) / 2;
  const at = (x, z) => [ox + (x - x0) * k, oz + z * k];
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, c.width, c.height);
  g.imageSmoothingEnabled = false;
  g.globalAlpha = 0.95;
  g.drawImage(radarMap, x0 * PX, 0, (x1 - x0) * PX, map.H * PX, ox, oz, (x1 - x0) * k, map.H * k);
  g.globalAlpha = 1;
  // Outside the sector, dimmed; its two ends in each side's colour.
  g.fillStyle = 'rgba(5, 8, 14, .55)';
  const [a0] = at(sec.x0, 0), [a1] = at(sec.x1, 0);
  g.fillRect(ox, oz, a0 - ox, map.H * k);
  g.fillRect(a1, oz, ox + (x1 - x0) * k - a1, map.H * k);
  const mine = match.attack === me.team;
  // Your side's line, where you come in if you choose no one.
  const line = sec[mine ? 'att' : 'def'];
  const lx = line.reduce((t, p) => t + p[0], 0) / line.length;
  g.strokeStyle = spawnPick < 0 ? '#fff' : 'rgba(74, 155, 255, .7)';
  g.lineWidth = spawnPick < 0 ? 4 : 2;
  g.setLineDash([6, 5]);
  g.beginPath(); g.moveTo(at(lx, 3)[0], at(lx, 3)[1]); g.lineTo(at(lx, map.H - 3)[0], at(lx, map.H - 3)[1]); g.stroke();
  g.setLineDash([]);
  for (const o of match.objectives()) {
    const [x, y] = at(o.x, o.z);
    g.fillStyle = TEAM_CSS[o.own ? match.attack : 1 - match.attack];
    g.beginPath(); g.arc(x, y, 11, 0, TAU); g.fill();
    g.fillStyle = '#fff';
    g.font = '900 13px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(o.name, x, y + 1);
  }
  const choices = new Set(spawnList().map((o) => o.id));
  for (const s of match.soldiers) {
    if (!s.alive || s === me) continue;
    const [x, y] = at(s.x, s.z);
    if (s.team !== me.team) {
      if (match.time - s.knownT < 4) { g.fillStyle = '#ff4a3a'; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
      continue;
    }
    const squad = s.squad === me.squad, can = choices.has(s.id);
    g.fillStyle = squad ? '#9fd0ff' : '#4a9bff';
    g.beginPath(); g.arc(x, y, squad ? 5 : 3, 0, TAU); g.fill();
    if (squad) {
      g.fillStyle = can ? '#fff' : 'rgba(255, 255, 255, .5)';
      g.font = '800 11px system-ui, sans-serif';
      g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(can ? s.name : `${s.name} (in a fight)`, x + 8, y + ((s.id % 4) - 1.5) * 8);
    }
    if (s.id === spawnPick) { g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, 10, 0, TAU); g.stroke(); }
  }
  // Where you fell.
  if (me.down > 0) {
    const [x, y] = at(me.x, me.z);
    g.strokeStyle = '#ff6a55'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x - 5, y - 5); g.lineTo(x + 5, y + 5); g.moveTo(x + 5, y - 5); g.lineTo(x - 5, y + 5); g.stroke();
  }
}
const PX = 4; // dots a metre on the radar's picture of the yard

function drawRadarMap() {
  const pic = document.createElement('canvas');
  pic.width = map.W * PX;
  pic.height = map.H * PX;
  const g = pic.getContext('2d');
  for (let z = 0; z < map.H; z++) {
    for (let x = 0; x < map.W; x++) {
      const wall = world.solidAt(x + 0.5, 1.2, z + 0.5), low = world.solidAt(x + 0.5, 0.5, z + 0.5);
      const roofed = world.ceilingOver(x + 0.5, 0, z + 0.5, 0.1) < 12;
      const pit = world.groundAt(x + 0.5, z + 0.5, 0.1) < -0.1;
      g.fillStyle = wall ? '#c9d3e4' : low ? '#7f8ba3' : pit ? '#1b2230' : roofed ? '#3c4a63' : '#2a3345';
      g.fillRect(x * PX, z * PX, PX, PX);
    }
  }
  return pic;
}

function drawRadar() {
  const c = $('radar'), g = c.getContext('2d'), S = c.width, zoom = 1.75;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, S, S);
  g.save();
  g.translate(S / 2, S / 2);
  g.rotate(-cam.yaw);
  g.scale(zoom, zoom);
  g.translate(-cam.eye[0] * PX, -cam.eye[2] * PX);
  g.globalAlpha = 0.9;
  g.imageSmoothingEnabled = false;
  g.drawImage(radarMap, 0, 0);
  g.globalAlpha = 1;
  const dot = (x, z, yaw, col, size, arrow) => {
    g.save();
    g.translate(x * PX, z * PX);
    g.fillStyle = col;
    if (arrow) {
      g.rotate(yaw);
      g.beginPath();
      g.moveTo(0, -size * 1.5); g.lineTo(size, size); g.lineTo(0, size * 0.45); g.lineTo(-size, size);
      g.closePath();
      g.fill();
    } else { g.beginPath(); g.arc(0, 0, size, 0, TAU); g.fill(); }
    g.restore();
  };
  for (const s of match.soldiers) {
    if (!s.alive || s === me) continue;
    if (s.team === 0) dot(s.x, s.z, s.yaw, '#4a9bff', 4.2, true);
    else {
      // The other team shows only where it was last seen or heard, and fades.
      const age = match.time - s.knownT;
      if (age < 3) { g.globalAlpha = clamp(1.3 - age / 2.3, 0, 1); dot(s.kx, s.kz, 0, '#ff4a3a', 4.2, false); g.globalAlpha = 1; }
    }
  }
  for (const n of match.nades) dot(n.x, n.z, 0, '#ffe04a', 2.6, false);
  if (match.type === 'adv') {
    // The two ends of the sector being fought for.
    const sec = match.sectorNow();
    g.lineWidth = 3;
    for (const [x, team] of [[sec.x0 - 1, match.attack], [sec.x1 + 1, 1 - match.attack]]) {
      g.strokeStyle = TEAM_CSS[team];
      g.beginPath();
      g.moveTo(x * PX, 3 * PX);
      g.lineTo(x * PX, (map.H - 3) * PX);
      g.stroke();
    }
    for (const o of match.objectives()) {
      g.strokeStyle = g.fillStyle = TEAM_CSS[o.own ? match.attack : 1 - match.attack];
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(o.x * PX, o.z * PX, 5.5 * PX, 0, TAU);
      g.stroke();
      g.save();
      g.translate(o.x * PX, o.z * PX);
      g.rotate(cam.yaw);
      g.font = '900 20px system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.name, 0, 1);
      g.restore();
    }
  }
  if (me && me.alive) dot(me.x, me.z, view.yaw, '#ffffff', 4.6, true);
  g.restore();
}

// ---- the camera -----------------------------------------------------------------------

// The setting is the view across a wide screen; the renderer wants it up and down.
const baseFov = () => 2 * Math.atan(Math.tan((save.fov * Math.PI) / 360) * (9 / 16) * Math.max(1, 16 / 9 / (W / H)));

function aim(now, dt, alpha) {
  let fov = baseFov();
  if (phase === 'title' || !me) {
    // A slow flight round the yard, looking at the middle.
    const a = now / 14000, r = 30 + 6 * Math.sin(now / 9000);
    // (In Advance, round the sector being fought for.)
    const sec = match.type === 'adv' ? match.sectorNow() : match.arena || null;
    const cx = sec ? (sec.x0 + sec.x1) / 2 : map.W / 2, cz = map.H / 2;
    cam.eye[0] = cx + Math.cos(a) * r * 1.25;
    cam.eye[1] = 15 + 3 * Math.sin(now / 7000);
    cam.eye[2] = cz + Math.sin(a) * r * 0.85;
    cam.yaw = Math.atan2(cx - cam.eye[0], -(cz - cam.eye[2])) + 0.25;
    cam.pitch = -0.42;
    cam.roll = 0;
    fov = 1.0;
  } else if (!me.alive && !cam.dead) {
    // Not in the yard yet: wait where the camera is.
  } else if (cam.dead) {
    // Scrapped: the view lifts and turns to whoever did it.
    const d = cam.dead;
    d.t += dt;
    cam.eye[1] += (cam.y + 1.1 - cam.eye[1]) * Math.min(1, dt * 3);
    if (d.by) cam.yaw += wrap(Math.atan2(d.by.x - cam.eye[0], -(d.by.z - cam.eye[2])) - cam.yaw) * Math.min(1, dt * 4);
    cam.pitch += (-0.12 - cam.pitch) * Math.min(1, dt * 4);
    cam.roll += (0.12 - cam.roll) * Math.min(1, dt * 2);
  } else {
    const x = lerp(me.px, me.x, alpha), z = lerp(me.pz, me.z, alpha);
    const y = lerp(me.py, me.y, alpha) + match.eyeY(me) - me.y;
    // (Steps are climbed in jumps; the eye glides up them.)
    cam.y = Math.abs(y - cam.y) > 1.2 ? y : cam.y + (y - cam.y) * Math.min(1, dt * 22);
    const v = vis[me.id], bob = me.grounded ? Math.abs(Math.sin(v.stride)) * 0.035 * v.pace : 0;
    cam.eye[0] = x; cam.eye[1] = cam.y - bob - hand.dip * 0.12; cam.eye[2] = z;
    // (The sights sway as you move, and shake when you're pinned down: the shots go where the view goes.)
    cam.yaw = view.yaw + me.ky + me.swY;
    cam.pitch = clamp(view.pitch + me.kp + me.swP, -1.55, 1.55);
    const strafe = (me.vx * Math.cos(view.yaw) + me.vz * Math.sin(view.yaw)) / WALK;
    cam.roll += (-strafe * 0.018 + (me.slideT > 0 ? 0.06 : 0) - cam.roll) * Math.min(1, dt * 8);
    const gun = me.weapons[me.slot].gun;
    fov = 2 * Math.atan(Math.tan(fov / 2) / lerp(1, gun.zoom, ease(me.ads)));
    if (me.sprinting) fov *= 1.04;
  }
  cam.fov += (fov - cam.fov) * (phase === 'title' ? 1 : Math.min(1, dt * 30));
  const eye = [cam.eye[0], cam.eye[1], cam.eye[2]];
  if (cam.shake > 0.001) {
    cam.shake *= Math.exp(-dt * 5);
    eye[0] += Math.sin(now / 23) * cam.shake * 0.12;
    eye[1] += Math.cos(now / 17) * cam.shake * 0.12;
  }
  cam.view = M.view(eye, cam.yaw, cam.pitch + Math.sin(now / 19) * cam.shake * 0.02, cam.roll);
  cam.proj = M.perspective(cam.fov, W / H, 0.08, 400);
  cam.at = eye;
}

// ---- drawing --------------------------------------------------------------------------

const lightAt = (s, v, dt) => {
  const n = world.nodeAt(s.x, s.y + 0.1, s.z), p = mesh.probes, k = Math.min(1, dt * 6);
  if (n < 0) return v.light;
  for (let i = 0; i < 3; i++) v.light[i] += (p[n * 3 + i] - v.light[i]) * k;
  return v.light;
};

const poseIn = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, crouch: 0, prone: 0, stride: 0, pace: 0, lean: 0, lower: 0, twist: 0 };

// ---- the old arms: where a blade is ------------------------------------------------------

// Which way a blade points (x right, y up, z ahead, as the one holding it
// sees it), which way its edge leads, and where the hand is, from the
// shoulder. While a blow goes through, this is the very sweep that decides
// what it hits (bladeLocal), so what is seen is what lands.
const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; v[0] /= l; v[1] /= l; v[2] /= l; return v; };
const READY = unit([0.22, 0.62, 0.75]);
// On guard, the blade across the side the blow will come from (as the holder sees it).
const GUARD_D = [unit([0.05, 0.95, 0.3]), unit([-0.05, 0.95, 0.3]), unit([-1, 0.12, 0.2]), unit([-0.6, -0.4, 0.7])];
const GUARD_H = [[-0.32, 0.02, 0.36], [0.22, 0.02, 0.36], [0.05, 0.32, 0.32], [0.02, -0.12, 0.42]];
const tmpD = [0, 0, 0], tmpE = [0, 0, 0];
// Into v.bd (direction), v.be (edge) and v.bh (hand): where s's blade is now, eased there from where it was.
function bladeNow(s, gun, v, dt) {
  let d = READY, e = null, h = null, exact = false, ahead = 0;
  if (s.atk === 1) {
    // Winding up: back and over to the side it will come from.
    const k = clamp(s.atkT / Math.max(0.05, s.atkWind), 0, 1);
    d = bladeLocal(s.atkDir, -0.38 * ease(k), tmpD);
    e = edgeOf(s.atkDir, -0.38 * ease(k));
    ahead = s.atkDir === THRUST ? -0.45 * ease(k) : 0;
  } else if (s.atk === 2) {
    const u = clamp(s.atkT / gun.strike, 0, 1);
    d = bladeLocal(s.atkDir, u, tmpD);
    e = edgeOf(s.atkDir, u);
    ahead = thrustOut(s.atkDir, u);
    exact = true;
  } else if (s.atk === 3 && s.atkT < s.atkRecover * 0.4) {
    d = bladeLocal(s.atkDir, 1, tmpD);
    e = edgeOf(s.atkDir, 1);
    ahead = thrustOut(s.atkDir, 1);
  } else if (s.guard && !s.block) {
    d = GUARD_D[s.guardDir];
    h = GUARD_H[s.guardDir];
  } else if (s.stun > 0) d = unit([0.5, 0.75, -0.1]);
  if (!e) { tmpE[0] = 0; tmpE[1] = 1; tmpE[2] = 0; e = tmpE; }
  const hx = h ? h[0] : d[0] * 0.32, hy = h ? h[1] : d[1] * 0.32, hz = h ? h[2] : d[2] * 0.32 + ahead;
  const k = exact ? 1 : Math.min(1, dt * 22);
  for (let i = 0; i < 3; i++) {
    v.bd[i] += (d[i] - v.bd[i]) * k;
    v.be[i] += (e[i] - v.be[i]) * k;
  }
  unit(v.bd); unit(v.be);
  v.bh[0] += (hx - v.bh[0]) * k; v.bh[1] += (hy - v.bh[1]) * k; v.bh[2] += (hz - v.bh[2]) * k;
}
// Which way the edge leads at u through a blow from side dir: the way the blade is sweeping.
function edgeOf(dir, u) {
  if (dir === THRUST) { tmpE[0] = 0; tmpE[1] = 1; tmpE[2] = 0; return tmpE; }
  const a = bladeLocal(dir, u, [0, 0, 0]), b = bladeLocal(dir, u + 0.05, [0, 0, 0]);
  tmpE[0] = b[0] - a[0]; tmpE[1] = b[1] - a[1]; tmpE[2] = b[2] - a[2];
  return unit(tmpE);
}
// The matrix for a blade held at hand position h, pointing d, edge leading e (all
// as the holder sees them), given the holder's right, up and ahead (rx.., ux.., fx..)
// and shoulder (o). (The weapon models point down -z with their edge up +y.)
function bladeMatrix(o, r, u, f, d, e, h, mirror = 1) {
  const dl = [d[0] * mirror, d[1], d[2]], el = [e[0] * mirror, e[1], e[2]];
  const wd = [r[0] * dl[0] + u[0] * dl[1] + f[0] * dl[2], r[1] * dl[0] + u[1] * dl[1] + f[1] * dl[2], r[2] * dl[0] + u[2] * dl[1] + f[2] * dl[2]];
  const we = [r[0] * el[0] + u[0] * el[1] + f[0] * el[2], r[1] * el[0] + u[1] * el[1] + f[1] * el[2], r[2] * el[0] + u[2] * el[1] + f[2] * el[2]];
  const z = [-wd[0], -wd[1], -wd[2]];
  // (The edge, square to the blade.)
  const dot = we[0] * z[0] + we[1] * z[1] + we[2] * z[2];
  const y = unit([we[0] - z[0] * dot, we[1] - z[1] * dot, we[2] - z[2] * dot]);
  const x = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]];
  const hx = h[0] * mirror, px = o[0] + r[0] * hx + u[0] * h[1] + f[0] * h[2], py = o[1] + r[1] * hx + u[1] * h[1] + f[1] * h[2], pz = o[2] + r[2] * hx + u[2] * h[1] + f[2] * h[2];
  return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, px, py, pz, 1]);
}
// Where a robot (seen from outside) holds its blade, in the world.
function bladeWorld(s, v, alpha, mesh, mirror = 1) {
  const yaw = s.yaw, pitch = clamp(s.pitch, -1.2, 1.2), sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
  const f = [sy * cp, sp, -cy * cp], r = [cy, 0, sy], u = [-sy * sp, cp, cy * sp];
  const eye = match.eyeY(s) + (lerp(s.py, s.y, alpha) - s.y);
  const o = [lerp(s.px, s.x, alpha) + r[0] * 0.15 * mirror - u[0] * 0.28, eye - u[1] * 0.28, lerp(s.pz, s.z, alpha) + r[2] * 0.15 * mirror - u[2] * 0.28];
  return bladeMatrix(o, r, u, f, v.bd, v.be, v.bh, mirror);
}

function poseOf(s, v, alpha) {
  poseIn.x = lerp(s.px, s.x, alpha);
  poseIn.y = lerp(s.py, s.y, alpha);
  poseIn.z = lerp(s.pz, s.z, alpha);
  poseIn.yaw = s === me ? view.yaw : s.yaw + s.ky;
  poseIn.pitch = clamp((s === me ? view.pitch : s.pitch) + s.kp, -1.2, 1.2);
  poseIn.crouch = s.crouchK;
  poseIn.prone = s.proneK;
  poseIn.stride = v.stride;
  poseIn.pace = s.grounded ? v.pace : 0.45;
  poseIn.lean = v.lean;
  poseIn.lower = s.weapons[s.slot].gun.kind ? 0 : v.lower;
  poseIn.twist = v.twist;
  const p = pose(poseIn);
  p.alpha = alpha;
  return p;
}

const HOT = { tint: [1.9, 1.9, 1.9] };
const DOWN = { tint: [0.55, 0.55, 0.6] };
const WIND = { tint: [2.4, 0.75, 0.5], emit: 0.35 }, STRIKE = { tint: [2.6, 1.6, 1.1], emit: 0.6 };
function draw(now, dt, alpha) {
  const firstPerson = me && me.alive && !cam.dead && phase !== 'title';
  // How each robot stands this frame.
  const poses = [];
  const v0 = cam.view, fx0 = -v0[2], fz0 = -v0[10];
  for (const s of match.soldiers) {
    const v = vis[s.id];
    // (Robots far off, or behind the camera, aren't drawn; only those near cast shadows.)
    const dx = s.x - cam.at[0], dz = s.z - cam.at[2], dist = Math.hypot(dx, dz);
    v.show = dist < 170 && (dist < 8 || dx * fx0 + dz * fz0 > -0.25 * dist);
    v.cast = dist < 42;
    if (!s.alive) {
      // Down, waiting for a medic: lying where it fell.
      if (s.down > 0 && (v.show || v.cast)) {
        lightAt(s, v, dt);
        poseIn.x = s.x; poseIn.y = s.y; poseIn.z = s.z; poseIn.yaw = s.yaw; poseIn.pitch = -0.4; poseIn.crouch = 1; poseIn.prone = 1;
        poseIn.stride = 0; poseIn.pace = 0; poseIn.lean = 0; poseIn.lower = 0; poseIn.twist = 0;
        const p = pose(poseIn);
        p.down = true;
        poses.push(p);
      } else poses.push(null);
      continue;
    }
    if (!v.show && !v.cast) { poses.push(null); continue; }
    const speed = Math.hypot(s.vx, s.vz);
    v.pace += (Math.min(1.45, speed / WALK) - v.pace) * Math.min(1, dt * 10);
    v.stride += speed * dt * 2.6;
    // (Leaning into a sprint; back, sliding.)
    v.lean += ((s.sprinting ? 0.24 : s.slideT > 0 ? -0.3 : 0) - v.lean) * Math.min(1, dt * 8);
    v.lower += ((s.sprinting ? 0.7 : s.reloadT > 0 || s.swapT > 0 ? 0.5 : 0) - v.lower) * Math.min(1, dt * 10);
    // The old arms: how far through a swing it is, and whether its shield is up.
    const gun = s.weapons[s.slot].gun;
    if (gun.kind === 'melee') {
      bladeNow(s, gun, v, dt || 1 / 60);
      // (The body turns with a blow from the side.)
      v.twist += ((s.atk && s.atkDir < OVERHEAD ? -0.5 * v.bd[0] : 0) - v.twist) * Math.min(1, dt * 14);
      // (The blade's path through the air, as it goes: the very sweep that decides what it hits.)
      if (s.atk === 2 && v.show) {
        const b = blowOf(gun, s.atkDir), seg = match.blade(s, s.atkDir, clamp(s.atkT / b.strike, 0, 1), b.reach, [0, 0, 0, 0, 0, 0]);
        const now3 = [seg[3], seg[4], seg[5]], mid3 = [lerp(seg[0], seg[3], 0.6), lerp(seg[1], seg[4], 0.6), lerp(seg[2], seg[5], 0.6)];
        if (v.tip && Math.hypot(now3[0] - v.tip[0], now3[1] - v.tip[1], now3[2] - v.tip[2]) > 0.01) {
          const c = s === me ? [0.55, 0.65, 0.8] : me && s.team !== me.team ? [1, 0.45, 0.25] : [0.6, 0.6, 0.6];
          fx.trail(v.tip, now3, c, 0.05, 0.22);
          fx.trail(v.mid, mid3, [c[0] * 0.5, c[1] * 0.5, c[2] * 0.5], 0.04, 0.18);
        }
        v.tip = now3; v.mid = mid3;
      } else v.tip = null;
    } else v.twist = 0;
    v.blockK += ((s.block ? 1 : 0) - v.blockK) * Math.min(1, dt * 14);
    lightAt(s, v, dt);
    poses.push(poseOf(s, v, alpha));
  }
  const eachPart = (fn, casting) => {
    match.soldiers.forEach((s, i) => {
      const p = poses[i];
      if (!p || !(casting ? vis[s.id].cast : vis[s.id].show)) return;
      const r = models.robots[s.team], own = s === me && firstPerson;
      fn(r.thigh, p.thigh[0], s, own); fn(r.thigh, p.thigh[1], s, own);
      fn(r.shin, p.shin[0], s, own); fn(r.shin, p.shin[1], s, own);
      fn(r.hips, p.hips, s, own); fn(r.top, p.top, s, own);
      if (p.down) return;
      const gun = s.weapons[s.slot].gun;
      if (gun.kind === 'melee') {
        // (Two daggers: one in each hand, the left a mirror of the right.)
        const v = vis[s.id], twin = gun.id === 'daggers', mesh = models.guns[twin ? 'knife' : gun.id].mesh;
        fn(mesh, bladeWorld(s, v, p.alpha, mesh), s, own, s.atk === 1 || s.atk === 2 ? 'blade' : null);
        if (twin) fn(mesh, bladeWorld(s, v, p.alpha, mesh, -1), s, own, s.atk === 1 || s.atk === 2 ? 'blade' : null);
      } else fn(models.guns[gun.id].mesh, gun.kind ? M.mul(p.gun, M.chain(M.move(-0.1, 0.02, -0.12), M.rotZ(0.2))) : p.gun, s, own);
      // A knight's shield: on the arm, or up in front.
      if (gun.alt === 'block') {
        const k = vis[s.id].blockK;
        fn(models.shields[s.team], M.chain(p.top, M.move(lerp(-0.33, -0.03, k), 0.27, lerp(-0.2, -0.46, k)), M.rotY(lerp(1, 0, k))), s, own);
      }
    });
  };

  // Shadows first (the player's own included, though they aren't drawn themselves).
  R.shadows(cam.at);
  eachPart((meshPart, m) => R.cast(meshPart, m), true);
  const nadeMesh = match.mode.pot ? models.pot : models.nade;
  for (const n of match.nades) R.cast(nadeMesh, M.move(n.x, n.y, n.z));
  const dropAt = (d) => M.chain(M.move(d.x, d.y + 0.045, d.z), M.rotY(-d.yaw), M.rotZ(Math.PI / 2));
  for (const d of match.drops) R.cast(models.guns[d.gun].mesh, dropAt(d));
  fxDraw(R, models, 'cast');

  R.begin({ view: cam.view, proj: cam.proj, eye: cam.at, sunCol: SUN, skyTop: [0.13, 0.3, 0.7], horizon: [0.62, 0.7, 0.8], fog: [60, 240], lights: lightsNow(cam.at) });
  R.drawWorld();
  eachPart((meshPart, m, s, own, part) => {
    if (own) return;
    // (An enemy's blade glows as its blow winds up and goes through: a warning.)
    const warn = part === 'blade' && me && s.team !== me.team;
    R.draw(meshPart, m, vis[s.id].light, !s.alive ? DOWN : now - vis[s.id].hurt < 70 ? HOT : warn ? (s.atk === 2 ? STRIKE : WIND) : null);
  });
  const medicNow = me && me.alive && match.classes[me.cls].medic;
  match.soldiers.forEach((s, i) => {
    const p = poses[i];
    if (!p || !vis[s.id].show || (s === me && firstPerson)) return;
    if (p.down) {
      // A medic sees its own who are down: a green light over each.
      if (medicNow && s.team === me.team && Math.hypot(s.x - me.x, s.z - me.z) < 40) {
        const k = 0.5 + 0.3 * Math.sin(now / 200);
        R.sprite(s.x, s.y + 1.1, s.z, 0.45, [0.25 * k, k, 0.35 * k, 0]);
        R.streak([s.x, s.y + 0.85, s.z], [s.x, s.y + 1.35, s.z], 0.07, [0.4, 1, 0.5, 0]);
      }
      return;
    }
    R.draw(models.robots[s.team].glow, p.top, vis[s.id].light, { tint: TEAM[s.team].glow, emit: 7 });
    // An arrow over each team-mate.
    if (me && s.team === me.team) {
      const d = Math.hypot(s.x - cam.at[0], s.z - cam.at[2]), k = clamp(d / 10, 1, 5);
      R.draw(models.tag, M.chain(M.move(poseIn.x = lerp(s.px, s.x, alpha), lerp(s.py, s.y, alpha) + 2.05 - 0.5 * s.crouchK, lerp(s.pz, s.z, alpha)), M.rotY(-cam.yaw), M.scale(k)), vis[s.id].light, { tint: TEAM[0].glow, emit: 5 });
    }
  });
  for (const n of match.nades) {
    const x = lerp(n.px, n.x, alpha), y = lerp(n.py, n.y, alpha), z = lerp(n.pz, n.z, alpha);
    R.draw(nadeMesh, M.chain(M.move(x, y, z), M.rotX(n.rest ? 0 : now / 60), M.rotY(1)), SKY);
    // A fire pot burns; a grenade has a light that blinks faster as it runs down.
    if (match.mode.pot) R.sprite(x, y + 0.2, z, 0.2 + 0.08 * Math.random(), [1, 0.55, 0.15, 0]);
    else if (Math.sin(now / (30 + n.fuse * 45)) > 0) R.sprite(x, y + 0.1, z, 0.22, [1, 0.15, 0.1, 0]);
  }
  // Weapons lying where they fell, each with a glint to show it can be picked up.
  for (const d of match.drops) {
    if (Math.abs(d.x - cam.at[0]) > 70) continue;
    R.draw(models.guns[d.gun].mesh, dropAt(d), SKY, { gloss: 0.5 });
    const k = 0.3 + 0.2 * Math.sin(now / 250 + d.id);
    R.sprite(d.x, d.y + 0.25, d.z, 0.22, [k, k * 0.95, k * 0.7, 0]);
  }
  // Arrows and thrown things in the air: point first, the thrown ones turning over.
  for (const p of match.shots) {
    const x = lerp(p.px, p.x, alpha), y = lerp(p.py, p.y, alpha), z = lerp(p.pz, p.z, alpha);
    const turn = p.kind === 'hatchet' || p.kind === 'knife' ? -(5 - p.life) * 22 : 0;
    R.draw(models.thrown[p.kind], M.chain(M.move(x, y, z), M.rotY(-Math.atan2(p.vx, -p.vz)), M.rotX(Math.atan2(p.vy, Math.hypot(p.vx, p.vz)) + turn)), SKY, { gloss: 0.4 });
  }
  // Advance: a beam of light stands on each objective, in the colour of whoever holds it.
  if (match.type === 'adv' && !match.over) {
    for (const o of match.objectives()) {
      const c = TEAM[o.own ? match.attack : 1 - match.attack].glow, k = 0.16 + 0.05 * Math.sin(now / 300);
      R.streak([o.x, o.y, o.z], [o.x, o.y + 11, o.z], 0.5, [c[0] * k, c[1] * k, c[2] * k, 0]);
      R.sprite(o.x, o.y + 0.15, o.z, 1.6, [c[0] * 0.25, c[1] * 0.25, c[2] * 0.25, 0]);
    }
  }
  fxDraw(R, models, 'solid');
  fxDraw(R, models, 'flat', now);
  R.fxDraw();
  R.fxClear();

  if (firstPerson && !(me.weapons[me.slot].gun.id === 'sniper' && me.ads > 0.9)) drawHands(now, dt);
}

// The gun in the player's hands.
function drawHands(now, dt) {
  const gun = me.weapons[me.slot].gun, info = models.guns[gun.id], v = vis[me.id];
  if (gun.kind) { drawOldHands(dt, gun, info, v); return; }
  const ads = ease(me.ads), hip = 1 - ads;
  hand.kick *= Math.exp(-dt * 13);
  hand.bash *= Math.exp(-dt * 8);
  hand.swayX *= Math.exp(-dt * 9);
  hand.swayY *= Math.exp(-dt * 9);
  hand.dip *= Math.exp(-dt * 7);
  const walk = me.grounded ? v.pace : 0;
  const bobX = Math.sin(v.stride) * 0.012 * walk * (0.25 + 0.75 * hip), bobY = -Math.abs(Math.cos(v.stride)) * 0.012 * walk * (0.25 + 0.75 * hip);
  const run = Math.max(0, v.lean / 0.24); // 0..1 as the sprint comes on
  // Lying down: the gun a little lower, steadied on the ground.
  const lying = me.proneK;
  // Lowered while reloading, swapping or throwing.
  const g = me.weapons[me.slot].gun;
  const reload = me.reloadT > 0 ? Math.sin(Math.PI * clamp(1 - me.reloadT / (g.shell ? g.shell : g.reload), 0, 1)) : 0;
  const down = Math.max(reload * 0.8, clamp(me.swapT / 0.4, 0, 1), clamp(me.throwT / 0.65, 0, 1) * 1.1);
  const SIZE = 0.8;
  // Sprinting, the gun comes in to the middle, held low with the barrel up a little, and swings with each stride.
  const x = 0.2 * hip * (1 - 0.82 * run) + bobX * (1 + 2 * run) + hand.swayX * hip;
  const settle = me.stanceT > 0 ? Math.sin(Math.PI * clamp(me.stanceT / 0.5, 0, 1)) : 0;
  const y = lerp(-info.sight * SIZE, -0.2, hip) + bobY * (1 + run) + hand.swayY * hip - down * 0.22 - hand.dip * 0.05 - run * 0.07 + hand.kick * 0.006 * hip - lying * 0.02 * hip - settle * 0.15;
  const z = lerp(-0.3, -0.46, hip) + hand.kick * 0.035 + run * 0.05 - hand.bash * 0.2;
  const local = M.chain(M.move(x, y, z), M.rotY(-0.04 * hip * (1 - run) + hand.bash * 0.9), M.rotZ(-hand.bash * 0.5), M.rotX(hand.kick * (0.035 + 0.03 * hip) - down * 0.7 + run * 0.2), M.rotZ(run * 0.1 + down * 0.3), M.scale(SIZE));
  const model = M.mul(M.rigidInverse(cam.view), local);
  const light = v.light;
  R.beginHands(M.perspective(1.0, W / H, 0.02, 10), cam.view);
  R.draw(info.mesh, model, light, { gloss: 0.5 });
  R.draw(models.arms[gun.id], model, light);
  if (hand.flash > 0) {
    hand.flash -= dt;
    R.draw(flash, M.chain(model, M.move(0, 0.035, -info.muzzle - 0.03), M.rotZ(hand.roll), M.scale(0.75 + 0.5 * Math.random())), [1, 1, 1], { emit: 9, alpha: 0.85 });
  }
}

// One of the old arms in the player's hands.
function drawOldHands(dt, gun, info, v) {
  hand.kick *= Math.exp(-dt * 9);
  hand.swayX *= Math.exp(-dt * 9);
  hand.swayY *= Math.exp(-dt * 9);
  hand.dip *= Math.exp(-dt * 7);
  const walk = me.grounded ? v.pace : 0, run = Math.max(0, v.lean / 0.24);
  const bobX = Math.sin(v.stride) * 0.014 * walk * (1 + run) + hand.swayX;
  const down = Math.max(clamp(me.swapT / 0.4, 0, 1), clamp(me.throwT / 0.65, 0, 1) * 1.1);
  const bobY = -Math.abs(Math.cos(v.stride)) * 0.014 * walk * (1 + run) + hand.swayY - down * 0.32 - hand.dip * 0.05;
  const inv = M.rigidInverse(cam.view), light = v.light, throwK = hand.kick;
  const at = (x, y, z, ...turns) => M.mul(inv, M.chain(M.move(x + bobX, y + bobY, z), ...turns));
  // (The forearm follows the hand, but doesn't turn with the blade.)
  const arm = (mesh, m) => R.draw(mesh, M.mul(M.move(m[12], m[13], m[14]), M.mul(inv, M.ident()).map((val, i) => (i >= 12 && i < 15 ? 0 : val))), light);
  R.beginHands(M.perspective(1.0, W / H, 0.02, 10), cam.view);
  let m;
  if (gun.kind === 'bow') {
    // The bow comes up and in as it is drawn, with the arrow on the string.
    const d = me.draw;
    m = at(lerp(-0.16, -0.04, d) - run * 0.1, -0.12 - run * 0.1, -0.56, M.rotZ(-0.42 + 0.3 * d), M.rotX(-run * 0.3));
    R.draw(models.armL, M.chain(m, M.move(0, 0, -0.02)), light);
    const wp = me.weapons[me.slot];
    if (wp.mag > 0 && (me.cool <= 0 || d > 0)) {
      R.draw(models.thrown.arrow, M.chain(m, M.move(0.025, 0.01, -0.25 + 0.33 * d)), light);
      R.draw(models.armR, M.chain(m, M.move(0.03, 0, 0.14 + 0.33 * d), M.rotZ(0.5)), light);
    }
  } else {
    // A blade: where it is is where the blow is (see bladeNow), seen from the shoulder.
    // (A thrown thing: the arm goes back with it.)
    const o = [0.17 + bobX, -0.31 + bobY - throwK * 0.04, -0.1 + throwK * 0.12], r = [1, 0, 0], u = [0, 1, 0], f = [0, 0, -1];
    const twin = gun.id === 'daggers', mesh = twin ? models.guns.knife.mesh : info.mesh;
    // (Seen from behind the eyes, the blade is turned a little towards straight ahead
    // and the hand kept out in front, so that every blow, wound back or going
    // through, stays in view: it goes the way the real one does.)
    const fd = unit([v.bd[0], v.bd[1], v.bd[2] + 0.8]), fh = [v.bh[0], v.bh[1] * 0.9, Math.max(0.12, 0.22 + v.bh[2] * 0.3)];
    const place = (mirror) => {
      const bm = bladeMatrix(mirror > 0 ? o : [-0.17 + bobX, o[1], o[2]], r, u, f, fd, v.be, fh, mirror);
      const hm = M.mul(inv, bm);
      arm(mirror > 0 ? models.armR : models.armL, hm);
      R.draw(mesh, hm, light, { gloss: 0.7 });
    };
    place(1);
    if (twin) place(-1);
    m = null;
  }
  if (m) R.draw(info.mesh, m, light, { gloss: 0.7 });
  if (gun.alt === 'block') {
    // The shield: down at the left, or up in front.
    const b = ease(v.blockK);
    const sm = at(lerp(-0.5, -0.24, b), lerp(-0.72, -0.42, b) - run * 0.1, lerp(-0.55, -0.62, b), M.rotY(lerp(0.6, 0.15, b)), M.rotX(lerp(-0.25, 0, b)));
    R.draw(models.shields[0], sm, [light[0] + 0.25, light[1] + 0.25, light[2] + 0.25], { gloss: 0.3 });
  }
}

// ---- the old arms: the sides of blows, round the sights ----------------------------------

// Round the sights, with a blade in hand: the side picked for your next
// blow (or guard), white, the others faint; a blow winding up, amber (gold
// when it is ready to go); a guard, a blue bar on its side (all round, for a
// shield); and blows coming at you, red and brighter as they come, on the
// side they will come from, or round the edge if they come from somewhere
// you aren't looking. Under it, a word for what a blow just did.
const SIDE_ANG = [Math.PI, 0, -Math.PI / 2, Math.PI / 2];
function drawBlades(dt) {
  const cv = $('blades'), gun = me && me.alive && phase === 'play' && !cam.dead ? me.weapons[me.slot].gun : null;
  const on = !!gun && gun.kind === 'melee';
  if (cv.hidden === on) cv.hidden = !on;
  if (!on) { blowSaid.t = 0; return; }
  const g = cv.getContext('2d'), S = cv.width / 180, pulse = 0.75 + 0.25 * Math.sin(performance.now() / 45);
  g.setTransform(S, 0, 0, S, cv.width / 2, cv.height / 2);
  g.clearRect(-90, -90, 180, 180);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const SHADE = 'rgba(0, 0, 0, 0.5)';
  const chevron = (a, r, size, color, width) => {
    const tx = -Math.cos(a), ty = -Math.sin(a), cx = -tx * r, cy = -ty * r, nx = -ty, ny = tx;
    for (const [c, wd] of [[SHADE, width + 2.5], [color, width]]) {
      g.strokeStyle = c;
      g.lineWidth = wd;
      g.beginPath();
      g.moveTo(cx - tx * size * 0.55 + nx * size, cy - ty * size * 0.55 + ny * size);
      g.lineTo(cx + tx * size * 0.45, cy + ty * size * 0.45);
      g.lineTo(cx - tx * size * 0.55 - nx * size, cy - ty * size * 0.55 - ny * size);
      g.stroke();
    }
  };
  const bar = (a, r, span, color, width) => {
    for (const [c, wd] of [[SHADE, width + 2.5], [color, width]]) {
      g.strokeStyle = c;
      g.lineWidth = wd;
      g.beginPath();
      g.arc(0, 0, r, a - span, a + span);
      g.stroke();
    }
  };
  // Blows coming at you.
  const sy = Math.sin(view.yaw), cy = Math.cos(view.yaw);
  for (const e of match.soldiers) {
    if (!e.alive || e.team === me.team || (e.atk !== 1 && e.atk !== 2)) continue;
    const eg = e.weapons[e.slot].gun;
    if (eg.kind !== 'melee') continue;
    const dx = me.x - e.x, dz = me.z - e.z;
    if (Math.hypot(dx, dz) > blowOf(eg, e.atkDir).reach + 1.6 || match.facing(e, dx, dz) < 0.6) continue;
    const k = e.atk === 2 ? 1 : clamp(e.atkT / Math.max(0.05, e.atkWind), 0, 1);
    const col = `rgba(255, ${Math.round(95 - 55 * k)}, ${Math.round(70 - 45 * k)}, ${(0.55 + 0.45 * k) * (k >= 1 ? pulse : 1)})`;
    const ahead = -dx * sy + dz * cy, right = -dx * cy - dz * sy;
    if (ahead > 0.35 * Math.hypot(dx, dz)) chevron(SIDE_ANG[meets(e.atkDir)], 64 - 18 * k, 10 + 7 * k, col, 3.5 + 2 * k);
    else bar(Math.atan2(-ahead, right), 80, 0.3, col, 5);
  }
  // Your guard.
  if (me.guard) for (const d of me.block ? [0, 1, 2, 3] : [me.guardDir]) bar(SIDE_ANG[d], 37, me.block ? 0.62 : 0.55, 'rgba(150, 210, 255, 0.95)', 5);
  // Your sides, and the one picked.
  const pick = me.atk ? me.atkDir : side.dir;
  for (let d = 0; d < 4; d++) {
    const sel = d === pick;
    let col = sel ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.3)';
    if (sel && me.atk === 1) col = me.atkT >= me.atkWind ? `rgba(255, 210, 87, ${pulse})` : `rgba(255, 170, 60, ${0.6 + 0.4 * clamp(me.atkT / me.atkWind, 0, 1)})`;
    if (me.stun > 0) col = 'rgba(255, 120, 90, 0.55)';
    chevron(SIDE_ANG[d], 26, sel ? 7 : 5, col, sel ? 3 : 1.8);
  }
  // What a blow just did.
  if (blowSaid.t > 0) {
    blowSaid.t -= dt * 1.1;
    g.globalAlpha = clamp(blowSaid.t * 2.5, 0, 1);
    g.font = '700 13px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillStyle = SHADE;
    g.fillText(blowSaid.text, 0.8, 84.8);
    g.fillStyle = blowSaid.color;
    g.fillText(blowSaid.text, 0, 84);
    g.globalAlpha = 1;
  }
}

// ---- the loop -------------------------------------------------------------------------

const stat = { step: 0, draw: 0, hud: 0 }; // milliseconds spent in each part of the last frame
function frame(now) {
  requestAnimationFrame(frame);
  const t0 = performance.now();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  // (The match waits while a card is up, or the mouse isn't held by the game.)
  const running = !frozen && ((phase === 'play' && !ui.isOpen() && (locked || force)) || phase === 'title');
  // Too slow for a while: draw the picture a little less sharp.
  // (If that doesn't help, the screen itself is the limit: put it back and leave it.)
  if (running && !settled) {
    if (dt > 0.024) slow++; else quick++;
    spent += dt;
    if (slow + quick >= 120) {
      if (wasSpent && spent > wasSpent * 0.93) { sharp = Math.min(1, sharp / 0.85); settled = true; layout(); }
      else if (slow > 80 && sharp > 0.5) { sharp = Math.max(0.5, sharp * 0.85); wasSpent = spent; layout(); }
      else wasSpent = 0;
      slow = quick = spent = 0;
    }
  }
  if (running) {
    acc += dt;
    let n = 0;
    while (acc >= STEP && n++ < 6) {
      acc -= STEP;
      if (me) feedInput();
      match.step();
      for (const ev of match.events) onEvent(ev);
      match.events.length = 0;
    }
    if (n > 6) acc = 0;
    if (phase === 'title' && match.over) attract();
    fxStep(dt, world);
  }
  const t1 = performance.now();
  aim(now, running ? dt : 0, acc / STEP);
  draw(now, running ? dt : 0, acc / STEP);
  const t2 = performance.now();
  updateHud(now, dt);
  drawBlades(dt);
  stat.step = t1 - t0;
  stat.draw = t2 - t1;
  stat.hud = performance.now() - t2;
}

// ---- menus ----------------------------------------------------------------------------

function showTitle() {
  const mode = MODES[save.mode], adv = save.type === 'adv';
  $('typeSeg').innerHTML = [['tdm', 'Deathmatch'], ['adv', 'Advance']].map(([id, name]) => `<button class="seg-btn${id === save.type ? ' on' : ''}" data-type="${id}">${name}</button>`).join('');
  $('sideSeg').innerHTML = ['Attack', 'Defend'].map((name, i) => `<button class="seg-btn${i === save.side ? ' on' : ''}" data-side="${i}">${name}</button>`).join('');
  $('limitRow').hidden = adv;
  $('mapRow').hidden = adv;
  $('mapSeg').innerHTML = MAP_NAMES.map((name, i) => `<button class="seg-btn${i === save.map ? ' on' : ''}" data-map="${i}">${name}</button>`).join('');
  $('sideRow').hidden = !adv;
  $('sizeRow').hidden = !adv;
  $('sizeSeg').innerHTML = [16, 24, 32].map((n) => `<button class="seg-btn${n === save.advSize ? ' on' : ''}" data-size="${n}">${n} a side</button>`).join('');
  $('tagLine').innerHTML = adv ? `Advance &middot; the Iron Front &middot; four sectors &middot; ${save.advSize} against ${save.advSize}` : `Team deathmatch &middot; ${MAP_NAMES[save.map]} &middot; 8 against 8`;
  $('modeSeg').innerHTML = MODES.map((m, i) => `<button class="seg-btn${i === save.mode ? ' on' : ''}" data-mode="${i}">${m.name}</button>`).join('');
  $('classPick').innerHTML = mode.classes.map((c, i) => classCard(c, i, i === save[clsKey(mode)], false)).join('');
  $('keysLine').innerHTML = (save.mode
    ? 'W A S D|move,Mouse|aim; its last move picks the side,Left|swing (hold to keep it back); draw the bow,Right|guard; shield; look closer,Right while winding up|feint,V|kick,Middle or T|throw,Shift|sprint,C|crouch and stand,Space|jump,Z|lie down,E|pick up,G|fire pot,Q|dagger,Tab|scores,F|full screen'
    : 'W A S D|move,Mouse|aim,Left|fire,Right|sights,Shift|sprint,C|crouch and stand,Space|jump,Z|lie down,C twice sprinting|slide,R|reload,G|grenade,V|strike,E|pick up,Q|swap,Tab|scores')
    .split(',').map((k) => k.split('|')).map(([key, what]) => `<b>${key}</b> ${what.replace(/;/g, ',')}`).join(' &middot; ');
  $('skillSeg').innerHTML = SKILL.map((k, i) => `<button class="seg-btn${i === save.skill ? ' on' : ''}" data-skill="${i}">${k.name}</button>`).join('');
  $('limitSeg').innerHTML = [50, 75, 100].map((n) => `<button class="seg-btn${n === save.limit ? ' on' : ''}" data-limit="${n}">${n}</button>`).join('');
  const r = rankOf(save.xp);
  $('career').innerHTML = `<span><b>Rank ${r.n + 1}</b>${r.title}</span>${save.matches ? `<span><b>${save.wins}</b>won of ${save.matches}</span><span><b>${save.kills}</b>scrapped</span><span><b>${(save.kills / Math.max(1, save.deaths)).toFixed(2)}</b>for each time scrapped</span><span><b>${save.streak}</b>best streak</span>` : ''}`;
  $('playBtn').textContent = fine ? 'Play' : 'Needs a mouse and keyboard';
}

$('classPick').addEventListener('click', (e) => {
  const el = e.target.closest('[data-cls]');
  if (!el) return;
  save[clsKey(MODES[save.mode])] = Number(el.dataset.cls);
  writeSave();
  snd('tap');
  showTitle();
});
$('typeSeg').addEventListener('click', (e) => {
  const el = e.target.closest('[data-type]');
  if (!el || el.dataset.type === save.type) return;
  save.type = el.dataset.type;
  writeSave();
  snd('tap');
  showTitle();
  whenBuilt(attract);
});
$('mapSeg').addEventListener('click', (e) => {
  const el = e.target.closest('[data-map]');
  if (!el || Number(el.dataset.map) === save.map) return;
  save.map = Number(el.dataset.map);
  writeSave();
  snd('tap');
  showTitle();
  whenBuilt(attract);
});
$('sideSeg').addEventListener('click', (e) => {
  const el = e.target.closest('[data-side]');
  if (!el || Number(el.dataset.side) === save.side) return;
  save.side = Number(el.dataset.side);
  writeSave();
  snd('tap');
  attract();
  showTitle();
});
$('modeSeg').addEventListener('click', (e) => {
  const el = e.target.closest('[data-mode]');
  if (!el || Number(el.dataset.mode) === save.mode) return;
  save.mode = Number(el.dataset.mode);
  writeSave();
  snd('tap');
  attract(); // the bots behind the menu change over too
  showTitle();
});
$('skillSeg').addEventListener('click', (e) => {
  const el = e.target.closest('[data-skill]');
  if (!el) return;
  save.skill = Number(el.dataset.skill);
  writeSave();
  snd('tap');
  showTitle();
});
$('sizeSeg').addEventListener('click', (e) => {
  const el = e.target.closest('[data-size]');
  if (!el || Number(el.dataset.size) === save.advSize) return;
  save.advSize = Number(el.dataset.size);
  writeSave();
  snd('tap');
  showTitle();
  whenBuilt(attract);
});
$('limitSeg').addEventListener('click', (e) => {
  const el = e.target.closest('[data-limit]');
  if (!el) return;
  save.limit = Number(el.dataset.limit);
  writeSave();
  snd('tap');
  showTitle();
});
$('playBtn').addEventListener('click', () => { if (phase === 'title') start(); });
$('menuBtn').addEventListener('click', () => { snd('tap'); showSettings(); });
$('downClasses').addEventListener('click', (e) => {
  const el = e.target.closest('[data-cls]');
  if (el) pickClass(Number(el.dataset.cls));
});

const settingsHtml = () => `
  <label class="row">Mouse speed <span class="slider"><input type="range" min="0.3" max="3" step="0.05" value="${save.sens}" data-opt="sens"><output>${save.sens.toFixed(2)}</output></span></label>
  <label class="row">Loudness <span class="slider"><input type="range" min="0" max="1" step="0.05" value="${save.vol}" data-opt="vol"><output>${Math.round(save.vol * 100)}</output></span></label>
  <label class="row">Field of view <span class="slider"><input type="range" min="70" max="110" step="1" value="${save.fov}" data-opt="fov"><output>${save.fov}</output></span></label>
  <label class="row">Flip up and down <input type="checkbox" class="toggle" data-opt="invert" ${save.invert ? 'checked' : ''}></label>
  ${switchRow('Sound', 'sound')}`;

function showPause() {
  if (phase !== 'play') return;
  release();
  $('card').classList.remove('wide');
  ui.show(`<h2>Paused</h2>
    <p>${scoreLine()}</p>
    ${settingsHtml()}
    <div class="classes">${match.classes.map((c, i) => classCard(c, i, i === me.nextCls, false)).join('')}</div>
    <p class="tip">A change of class takes effect the next time you come back.</p>
    <div class="actions">
      <button class="btn btn-primary" data-action="resume">Carry on</button>
      <button class="btn btn-soft" data-action="how">How to play</button>
      <button class="btn btn-soft" data-action="menu">Leave the match</button>
    </div>`);
  $('card').classList.add('wide');
}

function showSettings() {
  $('card').classList.remove('wide');
  ui.show(`<h2>Settings</h2>${settingsHtml()}
    <div class="actions"><button class="btn btn-primary" data-action="close">Done</button><button class="btn btn-soft" data-action="how">How to play</button></div>`);
}

function showHow() {
  $('card').classList.remove('wide');
  ui.show(`<h2>How to play</h2>
    <div class="how">
      <p><b>Scrap the haywire robots.</b> Every one your team scraps is a point; the first team to the target wins.</p>
      <p><b>W A S D</b> to move, the <b>mouse</b> to aim, <b>left button</b> to fire. Hold the <b>right button</b> to look down the sights: slower, but much more accurate.</p>
      <p><b>Shift</b> sprints, <b>C</b> crouches and <b>Z</b> lies down (press it again to stand); either way you are steadier and smaller. <b>C</b> twice while sprinting is a slide. <b>Space</b> jumps onto crates, and <b>E</b> picks up a weapon someone dropped (walk over one like your own and you take its rounds). <b>R</b> reloads, <b>Q</b> or <b>1</b> and <b>2</b> swap to the pistol and back, <b>G</b> throws a grenade, and <b>V</b> strikes with the gun itself at whatever is right in front of you.</p>
      <p><b>Advance</b> is attack and defence on a map of its own, the Iron Front: four great sectors in a row, from a rail yard to a walled citadel, each with two or three objectives. The attackers take an objective by having more robots at it than the defenders; holding them all takes the sector, and the fight moves on to the next. The defenders then have a few seconds to fall back: every one the attack catches in the lost sector is worth three lives to it.</p>
      <p>The attack has three battalions. Every attacker scrapped costs a life; when a battalion's lives are gone, everyone regroups and the sector starts over with the next. Take every sector and the attack has won; lose all three battalions and the defence has. Keep to the sector being fought for: stray out of it for six seconds and you are scrapped.</p>
      <p><b>Squads and medics.</b> You are in a squad of four. Scrapped in Advance, <b>A</b> and <b>D</b> choose to come back in beside a squad mate who is out of trouble. A <b>Medic</b> can get the scrapped back on their feet where they fell: hold <b>E</b> beside them (attacking, it gives the life back), and those near a medic mend faster. Down, you wait for a medic who is near, or press <b>Space</b> to come back in.</p>
      <p><b>Old Iron</b> is the same match with no guns. A blow comes from a side, and the way the mouse last moved picks it: move it left and click for a blow from the left, right for one from the right, up for one from overhead, down for a thrust. The marks round the sights show the side picked. Hold the <b>left button</b> to keep a blow wound up, and let go to strike. Hold the <b>right button</b> to guard, moving the mouse towards the blow coming at you: it shows as a red mark on the side it will come from. A guard on the right side stops it; one put up just in time is a parry, which leaves them reeling and your next blow quicker. Overhead blows hit harder but are slower; thrusts are quick and reach further. The right button while winding up calls a blow off (a feint). <b>V</b> kicks, through any guard or shield. The Knight's shield stops blows from any side, and arrows. <b>Middle button</b> or <b>T</b> throws a pike, hatchet or knife; with a bow, hold the left button to draw and let go to loose, aiming a little high for the drop, and the right button looks closer. <b>G</b> throws a fire pot that bursts where it lands, and <b>Q</b> draws your dagger.</p>
      <p><b>Head shots</b> do more. Your plating mends itself when nothing has hit you for a few seconds, so get behind something.</p>
      <p>The <b>radar</b> shows your team in blue, and the others in red wherever one was last seen or heard. Hold <b>Tab</b> for the scores, press <b>F</b> to fill the screen, and <b>Esc</b> to pause.</p>
    </div>
    <div class="actions"><button class="btn btn-primary" data-action="${phase === 'play' ? 'pause' : 'close'}">Got it</button></div>`);
}

const ui = cards({
  resume: () => { ui.close(); last = performance.now(); grab(); },
  pause: showPause,
  how: showHow,
  menu: () => { ui.close(); toTitle(); },
  again: () => { ui.close(); $('hud').hidden = true; start(); },
});
$('card').addEventListener('input', (e) => {
  const opt = e.target.dataset.opt;
  if (!opt) return;
  if (opt === 'invert') save.invert = e.target.checked;
  else {
    save[opt] = Number(e.target.value);
    e.target.nextElementSibling.textContent = opt === 'sens' ? save.sens.toFixed(2) : opt === 'vol' ? Math.round(save.vol * 100) : save.fov;
  }
  writeSave();
});
$('card').addEventListener('click', (e) => {
  const el = e.target.closest('[data-cls]');
  if (!el || phase !== 'play') return;
  pickClass(Number(el.dataset.cls));
  showPause();
});
// A card closed some other way (Esc, a click outside) carries the match on.
$('overlay').addEventListener('click', (e) => { if (e.target === $('overlay') && !ui.isOpen() && phase === 'play') { last = performance.now(); grab(); } });

// ---- start ----------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', () => { if (R) layout(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && phase === 'play' && !ui.isOpen()) showPause(); });

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.haywire = {
    get match() { return match; }, get me() { return me; }, get phase() { return phase; }, view, cam, keys, mouse, save, start, finish,
    set force(v) { force = v; }, set frozen(v) { frozen = v; }, get stance() { return stance; }, vis, hand, stat, get mesh() { return mesh; },
  };
}

// (Let the "Building the yard" notice get on screen before the work starts.)
requestAnimationFrame(() => setTimeout(() => {
  try {
    load();
  } catch (err) {
    $('loading').textContent = /WebGL/.test(String(err)) ? 'Haywire needs WebGL 2, which this browser does not have.' : `Something went wrong: ${err.message}`;
    throw err;
  }
  if (!store.get('haywire-seen', false)) { store.set('haywire-seen', true); showHow(); }
  requestAnimationFrame((t) => { last = t; frame(t); });
}, 30));
