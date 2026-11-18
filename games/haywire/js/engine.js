// Haywire: the rules of a match, as plain numbers. The screen (game.js)
// steps this 60 times a second and draws what it finds here.
//
// Two teams of robots, blue (team 0) and orange (team 1). Every robot, the
// player's included, is a "soldier" and works the same way: each step it is
// handed an input (which way to walk and look, and which buttons are down)
// and the rules do the rest. The bots' inputs come from bots.js.
//
// A team scores one for each robot of the other team it scraps. First to
// the score limit wins, or whoever is ahead when the clock runs out.

import { Brain } from './bots.js';

export const STEP = 1 / 60;
export const GRAVITY = 17, JUMP = 5.9;
export const WALK = 4.7, SPRINT = 1.42, CROUCH = 0.5, PRONE = 0.24;
export const RADIUS = 0.32, TALL = 1.8, TALL_CROUCH = 1.25, TALL_PRONE = 0.6, EYE = 1.62, EYE_CROUCH = 1.05, EYE_PRONE = 0.42;
// A slide, from a sprint: it starts at least this fast and slows as it goes.
export const SLIDE_TIME = 0.85, SLIDE_SPEED = 9.5;
// Weapons dropped by the scrapped lie there this long, and so many at most.
export const DROP_TIME = 45, DROPS = 48, PICK_REACH = 1.8;
export const RESPAWN = 5, REGEN_DELAY = 4.5, REGEN = 34;
export const NADE_FUSE = 2.7, NADE_REACH = 6.5, NADE_DAMAGE = 170;
// Advance, the attack-and-defend game. The attackers have so many lives
// between them (TICKETS) and get some back for each sector they take. An
// objective is anyone's who has more robots within OBJ_REACH metres of it.
// It gets BATTALIONS tries: when one runs out of lives the next takes up
// the attack on the same sector, which the defenders have back whole.
// Each side must keep to the sector being fought for: out of it for
// OUT_TIME seconds and a robot is scrapped. When a sector falls the
// defenders have RETREAT seconds to fall back, and each one caught on the
// way is worth ROUT lives to the attack.
//
// A battalion has so many lives for every robot on a side (the mode's
// `tickets`: fights with the old arms are slower, so fewer), or TICKETS if
// the match sets no size. When one runs out, everyone regroups: both sides
// come in again at the sector being fought for, and it starts over. The
// attack gets lives back only one way: each defender it catches still in a
// sector it has just lost, while they fall back, is worth ROUT.
export const TICKETS = 55, BATTALIONS = 3, OBJ_REACH = 5.5, ADVANCE_TIME = 4500, OUT_TIME = 6, RETREAT = 14, ROUT = 3;
// The scrapped can be got back on their feet by a medic for REVIVE_WAIT
// seconds: it takes REVIVE_TIME of holding the use key beside them, and they
// come back with REVIVE_HP of their plating (and, attacking, their life back).
export const REVIVE_WAIT = 12, REVIVE_TIME = 1.1, REVIVE_HP = 0.5, REVIVE_REACH = 2.2;
// A robot can come in beside a squad mate who hasn't been hurt for this long.
export const SQUAD = 4, SQUAD_CALM = 5;
// Rounds passing within NEAR_MISS metres of a robot's head (and not hitting
// it) pin it down: its aim gets worse, and bots duck.
export const NEAR_MISS = 1.6;
const RAD = Math.PI / 180;

// dmg: for each hit. head: how much more a head shot does. rate: seconds
// between shots. hip / ads: how wide the shots scatter (degrees) from the hip
// and down the sights. zoom: how much the sights magnify. kick: how far the
// view jumps up and sideways with each shot (degrees). bloom: how much each
// shot widens the scatter. near / far / min: full damage out to near metres,
// falling to min of it at far.
export const GUNS = {
  rifle: { name: 'Riveter', auto: true, pellets: 1, dmg: 26, head: 1.5, rate: 0.098, mag: 30, reserve: 180, reload: 2.0, hip: 2.6, ads: 0.22, adsTime: 0.2, adsMove: 0.62, zoom: 1.35, kickUp: 0.55, kickSide: 0.22, bloom: 0.28, near: 25, far: 60, min: 0.7, weight: 1 },
  smg: { name: 'Buzzer', auto: true, pellets: 1, dmg: 25, head: 1.4, rate: 0.068, mag: 32, reserve: 192, reload: 1.6, hip: 1.6, ads: 0.5, adsTime: 0.15, adsMove: 0.85, zoom: 1.2, kickUp: 0.4, kickSide: 0.28, bloom: 0.18, near: 14, far: 34, min: 0.55, weight: 1 },
  shotgun: { name: 'Scatterjack', auto: false, pellets: 8, dmg: 18, head: 1.2, rate: 0.8, mag: 6, reserve: 36, reload: 0.5, shell: 0.45, hip: 3.6, ads: 2.9, adsTime: 0.2, adsMove: 0.7, zoom: 1.15, kickUp: 3.2, kickSide: 0.8, bloom: 0, near: 9, far: 24, min: 0.2, weight: 1 },
  lmg: { name: 'Hammer', auto: true, pellets: 1, dmg: 24, head: 1.5, rate: 0.132, mag: 80, reserve: 240, reload: 3.6, hip: 3.4, ads: 0.4, adsTime: 0.34, adsMove: 0.45, zoom: 1.3, kickUp: 0.48, kickSide: 0.3, bloom: 0.22, near: 30, far: 70, min: 0.75, weight: 0.96 },
  sniper: { name: 'Longbolt', auto: false, pellets: 1, dmg: 85, head: 2, rate: 1.15, mag: 5, reserve: 30, reload: 2.6, hip: 7, ads: 0.03, adsTime: 0.3, adsMove: 0.4, zoom: 4.2, kickUp: 3.5, kickSide: 0.6, bloom: 0, near: 100, far: 200, min: 1, weight: 1 },
  pistol: { name: 'Spark', auto: false, pellets: 1, dmg: 24, head: 1.5, rate: 0.14, mag: 12, reserve: Infinity, reload: 1.3, hip: 1.6, ads: 0.35, adsTime: 0.12, adsMove: 0.85, zoom: 1.15, kickUp: 1.1, kickSide: 0.35, bloom: 0.5, near: 12, far: 35, min: 0.5, weight: 1 },
};

// The old arms, for the mode with no guns. kind 'melee': a blow comes from
// a side (see FROM_LEFT below). It winds up for wind seconds (it can be held
// back there, wound up, as long as the button is held), sweeps through for
// strike seconds, hitting whatever the blade passes through, and takes
// recover seconds to come back. dmg and reach are for a blow from the side;
// blows (one per side, each a list of multipliers) change that for a side.
// cleave: a blow from the side goes on through everyone in its way. back:
// how much more it does from behind. kind 'bow': hold to draw, let go to
// loose; dmg and speed run from a half-drawn bow to a full one. alt is what
// the right button does: 'block' raises a shield, 'guard' guards with the
// blade itself, 'zoom' looks closer. throw: how many there are to throw (mag),
// and shot says what one does in the air.
const OLD = { auto: true, pellets: 1, head: 1, reserve: 0, reload: 0, hip: 0, ads: 0, adsTime: 0.15, adsMove: 1, zoom: 1, kickUp: 0, kickSide: 0, bloom: 0, weight: 1, mag: 0 };
Object.assign(GUNS, {
  sword: { ...OLD, name: 'Longsword', kind: 'melee', dmg: 46, wind: 0.42, strike: 0.17, recover: 0.36, reach: 2.3, alt: 'block', adsMove: 0.65 },
  spear: { ...OLD, name: 'Pike', kind: 'melee', dmg: 60, wind: 0.44, strike: 0.15, recover: 0.46, reach: 3.4, alt: 'guard', throw: true, mag: 3, shot: { kind: 'spear', dmg: 95, speed: 30, grav: 9, head: 1.5 },
    blows: [{ dmg: 0.6, reach: 0.78 }, { dmg: 0.6, reach: 0.78 }, { dmg: 0.8, reach: 0.8 }, { dmg: 1.05, reach: 1, wind: 0.95 }] },
  axe: { ...OLD, name: 'Greataxe', kind: 'melee', dmg: 80, wind: 0.58, strike: 0.22, recover: 0.62, reach: 2.6, cleave: true, alt: 'guard', throw: true, mag: 3, weight: 0.97, shot: { kind: 'hatchet', dmg: 70, speed: 23, grav: 12, head: 1.3 },
    blows: [null, null, null, { dmg: 0.5, reach: 0.9 }] },
  bow: { ...OLD, name: 'Longbow', kind: 'bow', dmg: 92, min: 40, speed: 58, slow: 26, grav: 9.8, drawTime: 0.85, rate: 0.35, mag: 24, head: 1.8, alt: 'zoom', zoom: 1.6, adsTime: 0.2, adsMove: 0.6, shot: { kind: 'arrow' } },
  daggers: { ...OLD, name: 'Twin Daggers', kind: 'melee', dmg: 32, wind: 0.3, strike: 0.12, recover: 0.2, reach: 1.9, back: 2, alt: 'guard', throw: true, mag: 10, shot: { kind: 'knife', dmg: 42, speed: 34, grav: 10, head: 1.5 } },
  knife: { ...OLD, name: 'Dagger', kind: 'melee', dmg: 28, wind: 0.32, strike: 0.12, recover: 0.24, reach: 1.85, back: 1.5, alt: 'guard' },
});
// A medic's weapons: a quick semi-automatic rifle, and a mace.
Object.assign(GUNS, {
  carbine: { name: 'Patcher', auto: false, pellets: 1, dmg: 36, head: 1.6, rate: 0.16, mag: 12, reserve: 108, reload: 1.9, hip: 2.0, ads: 0.2, adsTime: 0.2, adsMove: 0.66, zoom: 1.5, kickUp: 0.85, kickSide: 0.25, bloom: 0.38, near: 30, far: 70, min: 0.75, weight: 1 },
  mace: { ...OLD, name: 'Mace', kind: 'melee', dmg: 50, wind: 0.45, strike: 0.17, recover: 0.42, reach: 2.2, alt: 'guard', blows: [null, null, null, { dmg: 0.6, reach: 0.95 }] },
});
// A blow with the gun itself, in Firefight, for when something is right on top of you.
export const BASH = { name: 'Rifle butt', dmg: 55, wind: 0.12, rate: 0.65, reach: 1.9, arc: 1.4, back: 2 };
GUNS.bash = BASH;
for (const k of Object.keys(GUNS)) GUNS[k].id = k;

// ---- blows from a side -------------------------------------------------------------------

// Where a blow comes from, as the one swinging it sees it: from the left
// (sweeping across to the right), from the right, from overhead (down), or
// straight in. To block one, the guard goes up on the side it is coming
// from as the one blocking sees it: a blow from the swinger's left arrives on
// the blocker's right. A shield stops a blow from any side.
export const FROM_LEFT = 0, FROM_RIGHT = 1, OVERHEAD = 2, THRUST = 3;
export const SIDES = ['from the left', 'from the right', 'overhead', 'a thrust'];
export const meets = (dir) => (dir === FROM_LEFT ? FROM_RIGHT : dir === FROM_RIGHT ? FROM_LEFT : dir);
export const PARRY = 0.28;    // a guard put up (or turned to the side) this soon before the blow: a parry
export const HOLD_MAX = 2.5;  // the longest a blow can be held back, wound up
export const BLOCKED = 0.42, PARRIED = 0.85; // how long a blow that is stopped leaves the one who swung it reeling
export const FLINCH = 0.22;   // how long a blow that lands stops the one it lands on
export const RIPOSTE = 0.62;  // after a parry, the next blow winds up this much quicker (for a moment)
export const KICK = { dmg: 8, wind: 0.24, reach: 1.75, stun: 0.85, shove: 6.5, rate: 1 };
const SIDE_BLOW = [{ wind: 1, dmg: 1, reach: 1 }, { wind: 1, dmg: 1, reach: 1 }, { wind: 1.18, dmg: 1.3, reach: 0.95 }, { wind: 0.85, dmg: 0.85, reach: 1.15 }];

// What a blow with gun from side dir is like: wind, strike, dmg and reach.
export function blowOf(gun, dir) {
  const base = SIDE_BLOW[dir], own = (gun.blows && gun.blows[dir]) || null;
  const k = (f) => base[f] * (own && own[f] !== undefined ? own[f] : 1);
  return { wind: gun.wind * k('wind'), strike: gun.strike, dmg: gun.dmg * k('dmg'), reach: gun.reach * k('reach') };
}

// The way the blade points at u through a blow from side dir (u 0 as it
// starts through, 1 at the end, below 0 wound back): x to the right, y up,
// z ahead, as the one swinging it sees it.
export function bladeLocal(dir, u, out) {
  let x, y, z;
  if (dir === OVERHEAD) { const a = 1.25 - 2 * u; x = 0.1; y = Math.sin(a); z = Math.cos(a); }
  else if (dir === THRUST) { x = 0.04; y = -0.06; z = 1; }
  else { const a = (-1.1 + 2.2 * u) * (dir === FROM_LEFT ? 1 : -1); x = Math.sin(a); z = Math.cos(a); y = (dir === FROM_LEFT ? -a : a) * 0.32; }
  const l = Math.hypot(x, y, z);
  out[0] = x / l; out[1] = y / l; out[2] = z / l;
  return out;
}
// Where the hand is, ahead of the shoulder, at u through a thrust (and 0 for any other blow).
export const thrustOut = (dir, u) => (dir === THRUST ? -0.45 + 0.65 * Math.max(0, Math.min(1, u)) : 0);

// The closest two segments (p0-p1 and q0-q1) come to one another.
function segGap(p0x, p0y, p0z, p1x, p1y, p1z, q0x, q0y, q0z, q1x, q1y, q1z) {
  const ux = p1x - p0x, uy = p1y - p0y, uz = p1z - p0z, vx = q1x - q0x, vy = q1y - q0y, vz = q1z - q0z;
  const wx = p0x - q0x, wy = p0y - q0y, wz = p0z - q0z;
  const a = ux * ux + uy * uy + uz * uz, b = ux * vx + uy * vy + uz * vz, c = vx * vx + vy * vy + vz * vz;
  const d = ux * wx + uy * wy + uz * wz, e = vx * wx + vy * wy + vz * wz, den = a * c - b * b;
  let s = den > 1e-9 ? clamp((b * e - c * d) / den, 0, 1) : 0;
  let t = c > 1e-9 ? (b * s + e) / c : 0;
  if (t < 0) { t = 0; s = a > 1e-9 ? clamp(-d / a, 0, 1) : 0; } else if (t > 1) { t = 1; s = a > 1e-9 ? clamp((b - d) / a, 0, 1) : 0; }
  return { gap: Math.hypot(wx + ux * s - vx * t, wy + uy * s - vy * t, wz + uz * s - vz * t), s };
}

export const CLASSES = [
  { id: 'assault', name: 'Assault', gun: 'rifle', hp: 100, speed: 1, nades: 2, what: 'A steady rifle for any range.' },
  { id: 'runner', name: 'Runner', gun: 'smg', hp: 110, speed: 1.12, nades: 2, what: 'Fast on its feet, deadly up close.' },
  { id: 'breacher', name: 'Breacher', gun: 'shotgun', hp: 125, speed: 1.04, nades: 2, what: 'A shotgun for doorways and corners.' },
  { id: 'gunner', name: 'Gunner', gun: 'lmg', hp: 110, speed: 0.9, nades: 1, what: 'Heavy plating and eighty rounds.' },
  { id: 'marksman', name: 'Marksman', gun: 'sniper', hp: 100, speed: 1, nades: 1, what: 'One shot to the head, from anywhere.' },
  { id: 'medic', name: 'Medic', gun: 'carbine', hp: 100, speed: 1, nades: 1, medic: true, what: 'Revives the scrapped, and those near it mend faster.' },
];

export const OLD_CLASSES = [
  { id: 'knight', name: 'Knight', gun: 'sword', hp: 110, speed: 1, nades: 1, what: 'A quick sword, and a shield to stop arrows and blades.' },
  { id: 'archer', name: 'Archer', gun: 'bow', hp: 90, speed: 1.02, nades: 1, what: 'Hold to draw, let go to loose. Deadly from afar.' },
  { id: 'lancer', name: 'Lancer', gun: 'spear', hp: 100, speed: 1, nades: 1, what: 'The longest reach, and pikes to throw.' },
  { id: 'berserker', name: 'Berserker', gun: 'axe', hp: 130, speed: 0.95, nades: 1, what: 'A slow axe that fells all in its path.' },
  { id: 'scout', name: 'Scout', gun: 'daggers', hp: 100, speed: 1.14, nades: 2, what: 'Fast, with knives to throw and a deadly backstab.' },
  { id: 'medic', name: 'Medic', gun: 'mace', hp: 110, speed: 1, nades: 1, medic: true, what: 'Revives the scrapped, and those near it mend faster.' },
];
// The two ways to play: with guns, or with the old arms. side: what
// everyone carries as well; pot: the grenade is a fire pot that bursts
// where it lands; defWait: how many seconds a scrapped defender is out for
// in Advance (set so that an attack gets through about half the time).
export const MODES = [
  { id: 'guns', name: 'Firefight', classes: CLASSES, side: 'pistol', pot: false, defWait: 13.5, tickets: 11, what: 'Rifles, shotguns and grenades.' },
  { id: 'old', name: 'Old Iron', classes: OLD_CLASSES, side: 'knife', pot: true, defWait: 28, tickets: 7, what: 'Swords, bows, pikes and axes. No guns.' },
];

export const NAMES = [
  ['Bolt', 'Rivet', 'Gasket', 'Sprocket', 'Diode', 'Piston', 'Flux', 'Servo', 'Torque', 'Cog', 'Fuse', 'Widget', 'Axle', 'Ratchet', 'Spindle', 'Socket',
    'Ampere', 'Lumen', 'Vector', 'Cathode', 'Pulley', 'Gimbal', 'Joule', 'Ohm', 'Baud', 'Capstan', 'Dynamo', 'Ferrule', 'Hertz', 'Nozzle', 'Pinion', 'Tensor'],
  ['Crank', 'Spanner', 'Grommet', 'Tappet', 'Shim', 'Clutch', 'Rotor', 'Valve', 'Rust', 'Glitch', 'Static', 'Jolt', 'Burr', 'Slag', 'Clinker', 'Scrap',
    'Sludge', 'Fizzle', 'Snarl', 'Kink', 'Warp', 'Rasp', 'Gnash', 'Sputter', 'Clang', 'Grit', 'Dent', 'Klaxon', 'Blight', 'Rattle', 'Smog', 'Wrench'],
];

// The classes the bots take, by their place in a squad of four: the first
// two are always an assault and a medic, the others vary from squad to squad.
const BOT_CLASS = (k) => {
  const q = Math.floor(k / SQUAD), j = k % SQUAD;
  return j === 0 ? 0 : j === 1 ? 5 : j === 2 ? [1, 3, 2, 4][q % 4] : [3, 4, 0, 1][q % 4];
};

export class Rand {
  constructor(seed) { this.s = seed >>> 0; }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const emptyInput = () => ({ deploy: false, spawnAt: -1, prone: false, slide: false, use: false, melee: false, toss: false, dir: 0, mx: 0, mz: 0, yaw: 0, pitch: 0, jump: false, crouch: false, sprint: false, ads: false, fire: false, reload: false, nade: false, slot: -1, cls: -1 });

export class Match {
  // opts: seed, size (robots a side), human (is soldier 0 the player),
  // skill: [blue, orange] bot skill 0..2, scoreLimit, timeLimit (seconds).
  constructor(map, opts = {}) {
    this.map = map;
    this.world = map.world;
    this.rng = new Rand(opts.seed ?? 1);
    this.mode = MODES[opts.mode ?? 0];
    this.classes = this.mode.classes;
    this.shots = []; // arrows and thrown things in the air
    // 'tdm': team deathmatch. 'adv': Advance, one team attacking through the sectors.
    this.type = opts.type === 'adv' ? 'adv' : 'tdm';
    const adv = this.type === 'adv';
    this.size = opts.size ?? (adv ? (map.advance.size || 12) : 8);
    this.scoreLimit = adv ? Infinity : opts.scoreLimit ?? 50;
    this.timeLimit = opts.timeLimit ?? (adv ? (map.advance.time || ADVANCE_TIME) : 600);
    if (adv) {
      this.attack = opts.attack ? 1 : 0; // which team attacks
      this.battalion = 1;
      this.battalions = opts.battalions ?? BATTALIONS;
      this.tickets = this.ticketsAtStart = opts.tickets ?? (opts.size || map.advance.size ? Math.round(this.mode.tickets * this.size) : TICKETS);
      this.sector = 0;
      this.defWait = opts.defWait ?? this.mode.defWait;
      this.retreatUntil = -1; // the defenders have until then to fall back to the next sector
      // For each objective, p runs from 0 (the defenders') to 1 (the attackers'); a and d count who is at it.
      this.sectors = map.advance.sectors.map((sec) => ({ ...sec, objs: sec.objs.map((o) => ({ ...o, own: false, p: 0, a: 0, d: 0 })) }));
      this.shells = []; // a barrage on its way down: where, and how long till each lands
      this.barrageUntil = -1;
    } else if (map.advance) {
      // Team deathmatch in one arena of the Long Works: blue comes in at its west end, orange at its east.
      this.arena = map.advance.sectors[opts.arena ?? 0];
    }
    this.time = 0;
    this.tick = 0;
    this.scores = [0, 0];
    this.over = false;
    this.winner = -1;
    this.events = [];
    this.nades = [];
    this.drops = []; // weapons lying where they fell
    this.dropId = 0;
    this.soldiers = [];
    const skill = opts.skill ?? [1, 1];
    for (let team = 0; team < 2; team++) {
      for (let k = 0; k < this.size; k++) {
        const human = !!opts.human && team === 0 && k === 0;
        const s = {
          id: this.soldiers.length, team, human, name: human ? 'You' : NAMES[team][k % NAMES[team].length] + (k >= NAMES[team].length ? ` ${Math.floor(k / NAMES[team].length) + 1}` : ''),
          cls: human ? (opts.cls ?? 0) : BOT_CLASS(k), nextCls: -1, squad: Math.floor(k / SQUAD),
          down: 0, reviveT: 0, reviving: -1, revives: 0, aura: false, spawnOn: -1,
          alive: false, respawnT: human ? 0 : 0.05 * k, x: 0, y: 0, z: 0, px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, r: RADIUS, h: TALL,
          yaw: 0, pitch: 0, grounded: true, crouching: false, crouchK: 0, sprinting: false, sprintOut: 0, ads: 0,
          hp: 0, maxHp: 100, hurtAt: -99, hurtBy: -1, protect: 0, dmgFrom: new Map(),
          weapons: [], slot: 0, cool: 0, reloadT: 0, swapT: 0, throwT: 0, nadeCount: 0, bloom: 0, kp: 0, ky: 0,
          out: 0, moveK: 0, swY: 0, swP: 0, supp: 0, suppAt: -99, prone: false, proneK: 0, stanceT: 0, slideT: 0, slideCool: 0, slideX: 0, slideZ: 0, slideV: 0, useHeld: false, meleeHeld: false, fireHeld: false, pull: 0, nadeHeld: false, swing: 0, draw: 0, block: false, altHeld: false, tossHeld: false,
          atk: 0, atkT: 0, atkAt: -99, atkDir: 0, atkWind: 0, atkRecover: 0, atkHit: [], atkLanded: false, atkQueued: false, guard: false, guardDir: 0, guardAt: -99, riposteUntil: -99, stun: 0, hitStop: 0, kickT: 0, shoveX: 0, shoveZ: 0, feints: 0, blocks: 0, parries: 0, jumpHeld: false, lastShot: -99, stride: 0,
          knownT: -99, kx: 0, ky2: 0, kz: 0, // when and where the other team last knew it to be
          kills: 0, deaths: 0, assists: 0, score: 0, streak: 0, best: 0, heads: 0, shots: 0, hits: 0,
          in: emptyInput(), bot: null,
        };
        s.nextCls = s.cls;
        if (!human) s.bot = new Brain(this, s, skill[team]);
        this.soldiers.push(s);
      }
    }
  }

  // ---- one step ---------------------------------------------------------------------

  step() {
    if (this.over) return;
    const dt = STEP;
    this.tick++;
    this.time += dt;
    for (const s of this.soldiers) {
      s.px = s.x; s.py = s.y; s.pz = s.z;
      if (s.bot && s.alive) s.bot.think(dt);
    }
    for (const s of this.soldiers) this.stepSoldier(s, dt);
    this.separate();
    for (let k = this.nades.length - 1; k >= 0; k--) if (this.stepNade(this.nades[k], dt)) this.nades.splice(k, 1);
    for (let k = this.shots.length - 1; k >= 0; k--) if (this.stepShot(this.shots[k], dt)) this.shots.splice(k, 1);
    // What the player can see, the whole blue team knows about.
    if (this.tick % 8 === 0) {
      for (const s of this.soldiers) if (s.human && s.alive) this.look(s);
    }
    if (this.type === 'adv' && !this.over) {
      if (this.regroupAt === this.tick) this.regroup();
      this.stepAdvance(dt);
      this.stepBarrage(dt);
    }
    // (Out of time, the defenders have held.)
    if (!this.over && this.time >= this.timeLimit) this.finish(this.type === 'adv' ? 1 - this.attack : undefined);
  }

  finish(winner) {
    if (this.over) return;
    this.over = true;
    this.winner = winner !== undefined ? winner : this.scores[0] === this.scores[1] ? -1 : this.scores[0] > this.scores[1] ? 0 : 1;
    this.events.push({ e: 'over', winner: this.winner });
  }

  eyeY(s) { return s.y + EYE + (EYE_CROUCH - EYE) * s.crouchK + (EYE_PRONE - EYE_CROUCH) * s.proneK; }

  // The middle of a soldier's body, for blasts and blows to reach.
  mid(e) { return e.y + (e.prone ? 0.28 : e.crouching ? 0.6 : 0.95); }

  // Where to aim at soldier e: its head, or the middle of its body.
  target(e, head, out) {
    if (e.prone) {
      const k = head ? 0.72 : 0;
      out[0] = e.x + Math.sin(e.yaw) * k; out[1] = e.y + (head ? 0.36 : 0.26); out[2] = e.z - Math.cos(e.yaw) * k;
    } else {
      out[0] = e.x; out[1] = e.y + (head ? (e.crouching ? 1.19 : 1.67) : e.crouching ? 0.7 : 1.1); out[2] = e.z;
    }
    return out;
  }

  // The way a soldier's gun points: where it looks, plus the kick.
  aim(s, out) {
    const yaw = s.yaw + s.ky + s.swY, pitch = clamp(s.pitch + s.kp + s.swP, -1.55, 1.55), c = Math.cos(pitch);
    out[0] = Math.sin(yaw) * c;
    out[1] = Math.sin(pitch);
    out[2] = -Math.cos(yaw) * c;
    return out;
  }

  // ---- Advance: the objectives -------------------------------------------------------------

  // The objectives being fought over now.
  sectorNow() { return this.sectors[Math.min(this.sector, this.sectors.length - 1)]; }
  objectives() { return this.sectorNow().objs; }

  // How far west and east a soldier's team may go just now.
  // (Nothing, on a map with no sectors.)
  bounds(s) {
    if (this.arena) return [this.arena.x0 - 1, this.arena.x1 + 1];
    if (this.type !== 'adv') return null;
    const sec = this.sectorNow();
    // (For the first sector, the attackers' whole camp is theirs.)
    return s.team === this.attack ? [this.sector === 0 ? 0 : sec.x0 - 15, sec.x1 + 1.5] : [sec.x0 - 1.5, sec.x1 + 15];
  }

  // A barrage: shells come down round the objectives for a few seconds,
  // each marked a moment before it lands. Only the defenders are hurt by
  // it, and not under a roof.
  stepBarrage(dt) {
    const rng = this.rng, w = this.world;
    if (this.time < this.barrageUntil && this.time > this.barrageUntil - 9 && this.tick % 24 === 0) {
      const objs = this.objectives(), o = objs[Math.floor(rng.next() * objs.length)];
      const a = rng.next() * Math.PI * 2, r = 11 * Math.sqrt(rng.next());
      const x = o.x + Math.cos(a) * r, z = o.z + Math.sin(a) * r, y = w.groundAt(x, z, 30);
      if (y > -9 && y < 9) {
        this.shells.push({ x, y, z, t: 1.3 });
        this.events.push({ e: 'incoming', x, y, z });
      }
    }
    for (let k = this.shells.length - 1; k >= 0; k--) {
      const sh = this.shells[k];
      sh.t -= dt;
      if (sh.t > 0) continue;
      this.shells.splice(k, 1);
      this.events.push({ e: 'boom', x: sh.x, y: sh.y, z: sh.z });
      for (const e of this.soldiers) {
        if (!e.alive || e.team === this.attack) continue;
        const cy = this.mid(e), d = Math.hypot(e.x - sh.x, cy - sh.y, e.z - sh.z);
        if (d < 5 && w.sees(sh.x, sh.y + 0.25, sh.z, e.x, cy, e.z)) this.hurt(e, 130 * clamp(1 - (d - 1) / 4, 0, 1), e, 'barrage', false);
      }
    }
  }

  stepAdvance(dt) {
    let all = true;
    for (const o of this.objectives()) {
      let a = 0, d = 0;
      for (const s of this.soldiers) {
        if (!s.alive || Math.abs(s.y - o.y) > 3 || Math.hypot(s.x - o.x, s.z - o.z) > OBJ_REACH) continue;
        if (s.team === this.attack) a++; else d++;
      }
      o.a = a;
      o.d = d;
      // Whoever has more robots at it pulls it their way, faster with more of them.
      // (About 22 seconds for one robot alone, and 11 for a crowd.)
      if (a !== d) o.p = clamp(o.p + Math.sign(a - d) * (0.03 + 0.015 * Math.min(4, Math.abs(a - d))) * dt, 0, 1);
      else if (a === 0) o.p = o.own ? Math.min(1, o.p + 0.03 * dt) : Math.max(0, o.p - 0.03 * dt);
      const took = !o.own && o.p >= 1, lost = o.own && o.p <= 0;
      if (took || lost) {
        o.own = took;
        for (const s of this.soldiers) {
          if (s.alive && (s.team === this.attack) === took && Math.hypot(s.x - o.x, s.z - o.z) <= OBJ_REACH) s.score += 150;
        }
        this.events.push({ e: took ? 'taken' : 'lost', name: o.name });
      }
      if (!o.own) all = false;
    }
    if (!all) return;
    // The whole sector is theirs: on to the next, with some lives back.
    this.events.push({ e: 'sector', n: this.sector });
    this.sector++;
    if (this.sector >= this.sectors.length) this.finish(this.attack);
    else {
      this.retreatUntil = this.time + RETREAT;
      // The defenders who are out come back quickly, to make a stand at the next one.
      for (const s of this.soldiers) if (!s.alive && s.team !== this.attack) s.respawnT = Math.min(s.respawnT, 2.5);
    }
  }

  // ---- coming into the yard ---------------------------------------------------------------

  // Can soldier s come in beside squad mate m? Only if m is in the fight
  // (not out of bounds) and nothing has hurt it for a while, nor is any of
  // the other side close.
  canSpawnOn(s, m) {
    if (!m || m === s || !m.alive || m.team !== s.team || m.squad !== s.squad || this.time - m.hurtAt < SQUAD_CALM || m.out > 0 || !m.grounded) return false;
    for (const e of this.soldiers) if (e.alive && e.team !== s.team && Math.abs(e.x - m.x) < 14 && Math.hypot(e.x - m.x, e.z - m.z) < 14) return false;
    return true;
  }

  // An alive medic of s's team within reach of it, if there is one.
  medicNear(s, reach) {
    for (const m of this.soldiers) {
      if (m.alive && m !== s && m.team === s.team && this.classes[m.cls].medic && Math.abs(m.x - s.x) < reach && Math.hypot(m.x - s.x, m.z - s.z) < reach) return m;
    }
    return null;
  }

  spawn(s) {
    const map = this.map, w = this.world;
    let best = null, bestScore = -Infinity;
    // Beside a squad mate, if one was picked and still may be.
    const mate = s.spawnOn >= 0 ? this.soldiers[s.spawnOn] : null;
    s.spawnOn = -1;
    if (this.canSpawnOn(s, mate)) {
      const bx = -Math.sin(mate.yaw) * 1.1, bz = Math.cos(mate.yaw) * 1.1;
      const x = this.world.blocked(mate.x + bx, mate.y, mate.z + bz, RADIUS, TALL, 0.55) ? mate.x : mate.x + bx, z = x === mate.x ? mate.z : mate.z + bz;
      return this.enter(s, x, mate.y, z, mate.yaw);
    }
    // Team deathmatch: anywhere, but better at your own end. Advance: behind your own lines.
    const adv = this.type === 'adv';
    const places = adv ? [this.sectorNow()[s.team === this.attack ? 'att' : 'def'].map(([x, z]) => ({ x, z, yaw: 0 }))]
      : this.arena ? [this.arena.west.map(([x, z]) => ({ x, z, yaw: Math.PI / 2 })), this.arena.def.map(([x, z]) => ({ x, z, yaw: -Math.PI / 2 }))]
        : map.spawns;
    for (let side = 0; side < places.length; side++) {
      for (const p of places[side]) {
        let near = 99, seen = false, taken = false;
        for (const e of this.soldiers) {
          if (!e.alive || e === s) continue;
          const d = Math.hypot(e.x - p.x, e.z - p.z);
          if (d < 1.2) taken = true;
          if (e.team === s.team) continue;
          if (d < near) near = d;
          if (!seen && d < 45 && w.sees(p.x, 1.6, p.z, e.x, this.eyeY(e), e.z)) seen = true;
        }
        const score = Math.min(near, 45) + (!adv && side === s.team ? 25 : 0) - (seen ? 30 : 0) - (near < 10 ? 100 : 0) - (taken ? 200 : 0) + this.rng.next() * 6;
        if (score > bestScore) { bestScore = score; best = p; }
      }
    }
    if (adv) {
      // Facing the nearest objective.
      let near = Infinity;
      for (const o of this.objectives()) {
        const d = Math.hypot(o.x - best.x, o.z - best.z);
        if (d < near) { near = d; best.yaw = Math.atan2(o.x - best.x, -(o.z - best.z)); }
      }
    }
    this.enter(s, best.x, w.groundAt(best.x, best.z, 0.5), best.z, best.yaw);
  }

  // Puts soldier s into the yard at (x, y, z), fresh, as its class.
  enter(s, x, y, z, yaw) {
    if (s.nextCls >= 0) s.cls = s.nextCls;
    const cls = this.classes[s.cls];
    s.alive = true;
    s.down = 0;
    s.x = x; s.z = z; s.y = y;
    s.px = s.x; s.py = s.y; s.pz = s.z;
    s.vx = s.vy = s.vz = 0;
    s.yaw = yaw; s.pitch = 0;
    s.in.yaw = yaw; s.in.pitch = 0;
    s.grounded = true; s.crouching = false; s.crouchK = 0; s.prone = false; s.proneK = 0; s.stanceT = 0; s.slideT = 0; s.h = TALL; s.ads = 0; s.sprinting = false;
    s.hp = s.maxHp = cls.hp;
    s.protect = 1.5;
    s.dmgFrom.clear();
    s.swing = s.draw = 0;
    s.block = s.guard = false;
    s.atk = s.atkT = s.stun = s.hitStop = s.kickT = s.shoveX = s.shoveZ = 0;
    s.atkQueued = false; s.riposteUntil = -99;
    s.out = 0;
    s.moveK = s.supp = s.swY = s.swP = 0;
    s.weapons = [cls.gun, this.mode.side].map((id) => ({ gun: GUNS[id], mag: GUNS[id].mag, reserve: GUNS[id].reserve }));
    s.pull = 0;
    s.slot = 0; s.cool = 0.3; s.reloadT = 0; s.swapT = 0; s.throwT = 0; s.bloom = 0; s.kp = s.ky = 0;
    s.nadeCount = cls.nades;
    s.streak = 0;
    if (s.bot) s.bot.reset();
    this.events.push({ e: 'spawn', id: s.id });
  }

  // ---- a soldier's step -------------------------------------------------------------------

  stepSoldier(s, dt) {
    const inp = s.in;
    if (inp.cls >= 0 && inp.cls < this.classes.length) s.nextCls = inp.cls;
    if (!s.alive) {
      s.respawnT -= dt;
      // The body lies there a while, for a medic to get back on its feet.
      if (s.down > 0) {
        s.down -= dt;
        if (s.down <= 0) { s.down = 0; this.events.push({ e: 'gone', id: s.id }); }
      }
      // Back in when the wait is over: straight away if no medic is near
      // (or the player says so), or else once the body is past saving.
      if (s.respawnT <= 0 && (s.down <= 0 || (s.human && inp.deploy) || !this.medicNear(s, 30))) {
        if (s.down > 0) { s.down = 0; this.events.push({ e: 'gone', id: s.id }); }
        if (s.bot) s.bot.pickSpawn();
        else s.spawnOn = inp.spawnAt ?? -1;
        this.spawn(s);
      }
      return;
    }
    const w = this.world, gun = s.weapons[s.slot].gun, cls = this.classes[s.cls];
    s.yaw = inp.yaw;
    s.pitch = clamp(inp.pitch, -1.5, 1.5);
    if (s.protect > 0) s.protect -= dt;

    // A slide: from a sprint, low and fast, slowing as it goes.
    if (s.slideCool > 0) s.slideCool -= dt;
    if (inp.slide && s.grounded && s.slideT <= 0 && s.slideCool <= 0 && !s.prone && s.sprinting) {
      const v = Math.hypot(s.vx, s.vz) || 1e-6;
      s.slideT = SLIDE_TIME;
      s.slideX = s.vx / v; s.slideZ = s.vz / v;
      s.slideV = Math.max(v * 1.25, SLIDE_SPEED);
      s.crouching = true; s.h = TALL_CROUCH;
      this.events.push({ e: 'slide', id: s.id });
    }

    // Standing, crouching and lying down. Getting down or up takes a
    // moment (no firing meanwhile), and getting up needs the room.
    const roof = w.ceilingOver(s.x, s.y, s.z, s.r);
    const wantProne = inp.prone && s.grounded && s.slideT <= 0;
    if (wantProne && !s.prone) { s.prone = true; s.crouching = true; s.h = TALL_PRONE; s.stanceT = 0.5; }
    else if (!wantProne && s.prone && roof >= s.y + TALL_CROUCH) { s.prone = false; s.h = TALL_CROUCH; s.stanceT = 0.45; }
    if (!s.prone) {
      const low = inp.crouch || s.slideT > 0;
      if (low && !s.crouching) { s.crouching = true; s.h = TALL_CROUCH; }
      else if (!low && s.crouching && roof >= s.y + TALL) { s.crouching = false; s.h = TALL; }
    }
    if (s.stanceT > 0) s.stanceT -= dt;
    s.crouchK += ((s.crouching ? 1 : 0) - s.crouchK) * Math.min(1, dt * 14);
    s.proneK += ((s.prone ? 1 : 0) - s.proneK) * Math.min(1, dt * 7);

    // Running flat out: forwards only, gun down.
    const busy = s.throwT > 0 || s.stanceT > 0;
    s.sprinting = inp.sprint && inp.mz > 0.3 && !s.crouching && !inp.ads && !inp.fire && !busy && s.atk === 0 && s.stun <= 0 && s.kickT <= 0;
    if (s.sprinting) s.sprintOut = 0.16; else if (s.sprintOut > 0) s.sprintOut -= dt;
    const wantAds = inp.ads && !s.sprinting && s.reloadT <= 0 && s.swapT <= 0 && !busy;
    s.ads = clamp(s.ads + (wantAds ? dt : -dt) / gun.adsTime, 0, 1);

    // Walking.
    let mx = inp.mx, mz = inp.mz;
    const ml = Math.hypot(mx, mz);
    if (ml > 1) { mx /= ml; mz /= ml; }
    const speed = WALK * cls.speed * gun.weight * (s.sprinting ? SPRINT : 1) * (s.prone ? PRONE : s.crouching ? CROUCH : 1) * (1 + (gun.adsMove - 1) * s.ads) * (1 - 0.4 * s.draw) * this.meleePace(s);
    const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
    const wx = (sy * mz + cy * mx) * speed, wz = (-cy * mz + sy * mx) * speed;
    if (s.slideT > 0 && s.grounded) {
      // Sliding: steered only a little, towards where the keys point.
      s.slideT -= dt;
      s.slideV *= Math.exp(-dt * 1.2);
      const wl = Math.hypot(wx, wz);
      if (wl > 0.1) {
        s.slideX += (wx / wl - s.slideX) * Math.min(1, dt * 1.6);
        s.slideZ += (wz / wl - s.slideZ) * Math.min(1, dt * 1.6);
        const l = Math.hypot(s.slideX, s.slideZ) || 1;
        s.slideX /= l; s.slideZ /= l;
      }
      s.vx = s.slideX * s.slideV;
      s.vz = s.slideZ * s.slideV;
      if (s.slideT <= 0) s.slideCool = 0.5;
      if (inp.jump && !s.jumpHeld) s.slideT = 0; // jump out of it
    } else if (s.grounded) {
      if (s.slideT > 0) { s.slideT = 0; s.slideCool = 0.5; }
      // (A shove from a blow or a kick, or a step into a blow, on top of walking.)
      const ax = wx + s.shoveX - s.vx, az = wz + s.shoveZ - s.vz, al = Math.hypot(ax, az), lim = 55 * dt;
      if (al <= lim) { s.vx = wx + s.shoveX; s.vz = wz + s.shoveZ; } else { s.vx += (ax / al) * lim; s.vz += (az / al) * lim; }
      if (inp.jump && !s.jumpHeld && !s.prone && s.stanceT <= 0 && w.ceilingOver(s.x, s.y, s.z, s.r) >= s.y + s.h + 0.4) {
        s.vy = JUMP;
        s.grounded = false;
        this.events.push({ e: 'jump', id: s.id });
      }
    } else {
      // A little steering in the air.
      s.vx += (wx - s.vx) * Math.min(1, dt * 2.2);
      s.vz += (wz - s.vz) * Math.min(1, dt * 2.2);
    }
    s.jumpHeld = inp.jump;
    if (s.shoveX || s.shoveZ) {
      const k = Math.exp(-dt * 7);
      s.shoveX *= k; s.shoveZ *= k;
      if (Math.abs(s.shoveX) + Math.abs(s.shoveZ) < 0.05) s.shoveX = s.shoveZ = 0;
    }
    const fell = s.vy;
    if (w.move(s, dt, GRAVITY)) this.events.push({ e: 'land', id: s.id, v: -fell });
    if (s.grounded) {
      s.stride += Math.hypot(s.vx, s.vz) * dt;
      if (s.stride > (s.sprinting ? 2.5 : 2)) { s.stride = 0; this.events.push({ e: 'foot', id: s.id }); }
    }

    // Advance: keep to the sector being fought for. (Defenders falling back get time to.)
    const fence = this.bounds(s);
    if (fence) {
      const [lo, hi] = fence;
      if ((s.x < lo || s.x > hi) && !(this.type === 'adv' && s.team !== this.attack && this.time < this.retreatUntil)) {
        s.out += dt;
        if (s.out >= OUT_TIME) { this.scrap(s, s, 'out', false); return; }
      } else s.out = 0;
    }

    // Weapons lying about: rounds from one like your own are taken as you
    // pass; another is taken in place of yours with the use key.
    // A medic beside one of its own who is down: holding the use key gets them up.
    const medic = cls.medic;
    let busyReviving = false;
    if (medic && inp.use) {
      let body = null, near = REVIVE_REACH;
      for (const e of this.soldiers) {
        if (e.alive || e.team !== s.team || e.down <= 0 || Math.abs(e.y - s.y) > 1.5) continue;
        const d = Math.hypot(e.x - s.x, e.z - s.z);
        if (d < near) { near = d; body = e; }
      }
      if (body) {
        busyReviving = true;
        if (s.reviving !== body.id) { s.reviving = body.id; s.reviveT = 0; }
        s.reviveT += dt;
        if (s.reviveT >= REVIVE_TIME) { this.revive(body, s); s.reviveT = 0; s.reviving = -1; }
      }
    }
    if (!busyReviving) { s.reviveT = 0; s.reviving = -1; }
    if (this.drops.length && !busyReviving) this.stepPickup(s, inp);
    if (this.tick % 10 === s.id % 10) s.aura = !!this.medicNear(s, 7);

    // Moving throws the aim off: the sights sway, more the faster, and it
    // takes a moment to steady after stopping. (Pinned down, it shakes.)
    const speedK = Math.min(1, Math.hypot(s.vx, s.vz) / WALK);
    s.moveK += (speedK - s.moveK) * Math.min(1, dt * (speedK > s.moveK ? 8 : 3.5));
    if (this.time - s.suppAt > 0.8) s.supp = Math.max(0, s.supp - dt * 0.6);
    const sway = (s.moveK * 0.014 + s.supp * 0.006) * (0.6 + 0.4 * s.ads), ph = this.time * 6.3 + s.id;
    s.swY = Math.sin(ph) * sway;
    s.swP = Math.sin(ph * 2) * sway * 0.5;

    // Healing by itself, once nothing has hit it for a while.
    // (Sooner and faster with a medic near.)
    if (s.hp < s.maxHp && this.time - s.hurtAt > (s.aura ? 2 : REGEN_DELAY)) s.hp = Math.min(s.maxHp, s.hp + REGEN * (s.aura ? 1.6 : 1) * dt);

    this.stepWeapon(s, dt);
  }

  // How a blow, a guard or being knocked off balance slows walking.
  meleePace(s) {
    if (s.stun > 0) return 0.4;
    if (s.atk === 1) return 0.78;
    if (s.atk === 2) return 0.55;
    if (s.atk === 3) return 0.7;
    if (s.kickT > 0) return 0.5;
    return s.guard && !s.block ? 0.72 : 1;
  }

  stepWeapon(s, dt) {
    const inp = s.in;
    if (s.cool > 0) s.cool -= dt;
    if (s.swapT > 0) s.swapT -= dt;
    if (s.throwT > 0) s.throwT -= dt;
    // The kick settles and the scatter tightens again.
    const settle = Math.exp(-dt * 7);
    s.kp *= settle;
    s.ky *= settle;
    if (s.bloom > 0) s.bloom = Math.max(0, s.bloom - dt * 1.6);

    if (inp.slot >= 0 && inp.slot < s.weapons.length && inp.slot !== s.slot && s.throwT <= 0) {
      s.slot = inp.slot;
      s.swapT = 0.4;
      s.reloadT = 0;
      s.bloom = 0;
      s.swing = s.draw = 0;
      s.atk = s.kickT = 0;
      s.guard = s.block = false;
      this.events.push({ e: 'swap', id: s.id });
    }
    const wp = s.weapons[s.slot], gun = wp.gun;
    if (gun.kind) {
      this.stepOld(s, dt, wp, gun);
      if (inp.nade && !s.nadeHeld && s.nadeCount > 0 && s.throwT <= 0 && s.swapT <= 0) this.throwNade(s);
      s.nadeHeld = inp.nade;
      return;
    }
    // A blow with the gun itself: it breaks off a reload, and the gun can't fire till it is back.
    const bash = inp.melee && !s.meleeHeld;
    s.meleeHeld = inp.melee;
    if (s.swing > 0) {
      s.swing -= dt;
      if (s.swing <= 0) this.strike(s, BASH);
    } else if (bash && s.swapT <= 0 && s.throwT <= 0 && s.cool <= 0.2) {
      s.swing = BASH.wind;
      s.cool = BASH.rate;
      s.reloadT = 0;
      s.protect = 0;
      this.events.push({ e: 'swing', id: s.id });
    }
    const pressed = inp.fire && !s.fireHeld;
    s.fireHeld = inp.fire;
    // A single-shot gun fires once for each press; a press made a moment
    // too soon (still bringing the gun up from a sprint, say) is remembered.
    if (pressed) s.pull = 0.2; else if (s.pull > 0) s.pull -= dt;
    const pulled = gun.auto ? inp.fire : s.pull > 0;

    if (s.reloadT > 0) {
      s.reloadT -= dt;
      if (s.reloadT <= 0) {
        if (gun.shell) {
          // One shell at a time; firing breaks off.
          wp.mag++;
          wp.reserve--;
          this.events.push({ e: 'shell', id: s.id });
          if (wp.mag < gun.mag && wp.reserve > 0 && !inp.fire) s.reloadT = gun.shell;
        } else {
          const take = Math.min(gun.mag - wp.mag, wp.reserve);
          wp.mag += take;
          wp.reserve -= take;
        }
      } else if (gun.shell && pressed && wp.mag > 0) s.reloadT = 0;
    }
    if (s.reloadT <= 0 && s.swapT <= 0 && s.throwT <= 0 && wp.reserve > 0 && wp.mag < gun.mag && (inp.reload || wp.mag === 0)) {
      s.reloadT = gun.reload;
      this.events.push({ e: 'reload', id: s.id, gun: gun.id });
    }
    // Out of rounds altogether: fall back on the pistol.
    if (wp.mag === 0 && wp.reserve <= 0 && s.slot === 0 && s.swapT <= 0) { s.slot = 1; s.swapT = 0.4; }

    if (pulled && s.cool <= 0 && s.reloadT <= 0 && s.swapT <= 0 && s.throwT <= 0 && s.sprintOut <= 0 && s.stanceT <= 0) {
      s.pull = 0;
      if (wp.mag > 0) this.fire(s, wp);
      else if (!gun.auto) this.events.push({ e: 'dry', id: s.id });
    }

    if (inp.nade && !s.nadeHeld && s.nadeCount > 0 && s.throwT <= 0 && s.swapT <= 0) this.throwNade(s);
    s.nadeHeld = inp.nade;
  }

  // The old arms: blows from a side, guarding, kicking, drawing a bow, throwing.
  stepOld(s, dt, wp, gun) {
    const inp = s.in, free = s.swapT <= 0 && s.throwT <= 0 && s.sprintOut <= 0 && s.stanceT <= 0;
    const alt = inp.ads && !s.altHeld;
    s.altHeld = inp.ads;
    const pressed = inp.fire && !s.fireHeld;
    s.fireHeld = inp.fire;
    const tossed = inp.toss && !s.tossHeld;
    s.tossHeld = inp.toss;
    const kicked = inp.melee && !s.meleeHeld;
    s.meleeHeld = inp.melee;
    if (gun.kind === 'bow') {
      s.guard = s.block = false;
      s.atk = 0;
      if (inp.fire && free && s.cool <= 0 && wp.mag > 0) {
        if (s.draw === 0) this.events.push({ e: 'draw', id: s.id });
        s.draw = Math.min(1, s.draw + dt / gun.drawTime);
      } else if (s.draw > 0) {
        // Let go: the arrow flies, faster and harder the further the bow was drawn.
        if (!inp.fire && s.draw >= 0.25 && free) {
          const k = (s.draw - 0.25) / 0.75;
          wp.mag--;
          s.cool = gun.rate;
          const wide = (0.25 + (1 - s.draw) * 1.6 + Math.min(1, Math.hypot(s.vx, s.vz) / WALK) * 0.9 + (s.grounded ? 0 : 2)) * (1 - 0.5 * s.ads);
          this.loose(s, gun, 'arrow', gun.slow + (gun.speed - gun.slow) * k, gun.min + (gun.dmg - gun.min) * k, gun.grav, gun.head, wide * RAD);
          this.events.push({ e: 'loose', id: s.id });
        }
        s.draw = 0;
      }
      return;
    }
    // Knocked off balance (by a kick, a blow that landed, or one that was stopped): nothing for a moment.
    if (s.stun > 0) {
      s.stun -= dt;
      s.atk = 0; s.kickT = 0;
      s.guard = s.block = false;
      return;
    }
    // A blow that has just bitten holds there for a moment.
    if (s.hitStop > 0) { s.hitStop -= dt; return; }
    // A kick: unstoppable, but short, and slow to come back from if it misses.
    if (s.kickT > 0) {
      s.kickT -= dt;
      if (s.kickT <= 0) this.kick(s);
      return;
    }
    if (kicked && s.atk === 0 && free && s.cool <= 0) {
      s.kickT = KICK.wind;
      s.cool = KICK.rate;
      s.guard = s.block = false;
      s.protect = 0;
      this.events.push({ e: 'kick', id: s.id });
      return;
    }
    // Throwing a pike, a hatchet or a knife.
    if (tossed && gun.throw && wp.mag > 0 && s.atk === 0 && s.cool <= 0 && free) {
      const sh = gun.shot;
      wp.mag--;
      s.cool = 0.55;
      s.protect = 0;
      s.guard = s.block = false;
      this.loose(s, gun, sh.kind, sh.speed, sh.dmg, sh.grav, sh.head, 0.6 * RAD);
      this.events.push({ e: 'hurl', id: s.id });
      // The last pike thrown: out with the dagger.
      if (gun.id === 'spear' && wp.mag === 0 && s.slot === 0) { s.slot = 1; s.swapT = 0.4; }
      return;
    }
    const dir = inp.dir & 3;
    if (s.atk === 0) {
      // On guard: the blade (or a shield) up on the side the right button is held to.
      const want = inp.ads && free && !s.sprinting && s.cool <= 0.1;
      if (want) {
        const side = gun.alt === 'block' ? -1 : dir;
        if (!s.guard || side !== s.guardDir) { s.guardAt = this.time; s.guardDir = side; }
        s.guard = true;
      } else s.guard = false;
      s.block = s.guard && gun.alt === 'block';
      if ((pressed || (inp.fire && s.atkQueued)) && free && s.cool <= 0) this.windUp(s, gun, dir, 1);
      s.atkQueued = false;
    } else if (s.atk === 1) {
      // Winding up. The right button now calls the blow off (a feint), into a guard.
      s.atkT += dt;
      if (alt) {
        s.atk = 0;
        s.cool = 0;
        s.feints++;
        this.events.push({ e: 'feint', id: s.id });
      } else if (s.atkT >= s.atkWind && (!inp.fire || s.atkT >= s.atkWind + HOLD_MAX)) {
        // Let go: through it goes, with a step into it.
        s.atk = 2;
        s.atkT = 0;
        s.atkHit.length = 0;
        s.atkLanded = false;
        const fwd = gun.reach > 3 ? 2.6 : 2.1, sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
        if (s.grounded) { s.shoveX += sy * fwd; s.shoveZ -= cy * fwd; }
        this.events.push({ e: 'swing', id: s.id, dir: s.atkDir });
      }
    } else if (s.atk === 2) {
      const b = blowOf(gun, s.atkDir), u0 = s.atkT / b.strike;
      s.atkT += dt;
      const u1 = Math.min(1, s.atkT / b.strike);
      const got = this.sweep(s, gun, b, u0, u1);
      if (got === 'stopped') return;
      if (u1 >= 1 || (got === 'hit' && !(gun.cleave && s.atkDir < OVERHEAD))) {
        s.atk = 3;
        s.atkT = 0;
        s.atkRecover = gun.recover * (s.atkLanded ? 0.6 : 1);
        if (!s.atkLanded) s.shots++;
      }
    } else {
      // Coming back from it. A blow that landed can be followed by another, sooner.
      s.atkT += dt;
      if (pressed) s.atkQueued = true;
      if (s.atkLanded && s.atkQueued && inp.fire && s.atkT > s.atkRecover * 0.35 && free) { this.windUp(s, gun, dir, 0.8); s.atkQueued = false; }
      else if (s.atkT >= s.atkRecover) s.atk = 0;
    }
  }

  // A blow begins to wind up, from side dir (quick: how much quicker than usual).
  windUp(s, gun, dir, quick) {
    s.atk = 1;
    s.atkT = 0;
    s.atkAt = this.time;
    s.atkDir = dir;
    s.atkWind = blowOf(gun, dir).wind * quick * (this.time < s.riposteUntil ? RIPOSTE : 1);
    s.riposteUntil = -99;
    s.guard = s.block = false;
    s.protect = 0;
    this.events.push({ e: 'windup', id: s.id, dir });
  }

  // Where the blade of soldier s is, u through a blow from side dir: its hilt and its tip.
  blade(s, dir, u, reach, out) {
    const yaw = s.yaw, pitch = clamp(s.pitch, -1.2, 1.2), sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const fx = sy * cp, fy = sp, fz = -cy * cp, rx = cy, rz = sy, ux = -sy * sp, uy = cp, uz = cy * sp;
    const l = bladeLocal(dir, u, this.tmpL || (this.tmpL = [0, 0, 0])), ahead = thrustOut(dir, u);
    const dx = rx * l[0] + ux * l[1] + fx * l[2], dy = uy * l[1] + fy * l[2], dz = rz * l[0] + uz * l[1] + fz * l[2];
    // (From the shoulder, a little to the right of and below the eye.)
    const ox = s.x + rx * 0.15 - ux * 0.28 + fx * ahead, oy = this.eyeY(s) - uy * 0.28 + fy * ahead, oz = s.z + rz * 0.15 - uz * 0.28 + fz * ahead;
    out[0] = ox + dx * 0.25; out[1] = oy + dy * 0.25; out[2] = oz + dz * 0.25;
    out[3] = ox + dx * reach; out[4] = oy + dy * reach; out[5] = oz + dz * reach;
    return out;
  }

  // A blow sweeping on from u0 to u1 of the way through: does the blade meet
  // anyone? A guard on the right side (or a shield) stops it and throws the
  // one swinging off balance; otherwise it bites. 'stopped', 'hit' or null.
  sweep(s, gun, b, u0, u1) {
    const w = this.world, seg = this.tmpSeg || (this.tmpSeg = [0, 0, 0, 0, 0, 0]);
    let met = null, metS = 2, landed = null;
    for (let i = 1; i <= 3; i++) {
      const u = u0 + ((u1 - u0) * i) / 3;
      this.blade(s, s.atkDir, u, b.reach, seg);
      for (const e of this.soldiers) {
        if (!e.alive || e.team === s.team || s.atkHit.includes(e.id)) continue;
        if (Math.abs(e.x - s.x) > 4.5 || Math.abs(e.z - s.z) > 4.5) continue;
        // (The body as a line up the middle of it; lying down, a line along the ground.)
        let ax, ay, az, bx, by, bz;
        if (e.prone) {
          const hx = Math.sin(e.yaw) * 0.75, hz = -Math.cos(e.yaw) * 0.75;
          ax = e.x - hx; bx = e.x + hx; ay = by = e.y + 0.25; az = e.z - hz; bz = e.z + hz;
        } else { ax = bx = e.x; az = bz = e.z; ay = e.y + 0.25; by = e.y + e.h - 0.15; }
        const g = segGap(seg[0], seg[1], seg[2], seg[3], seg[4], seg[5], ax, ay, az, bx, by, bz);
        if (g.gap > 0.36 || g.s >= metS) continue;
        // (Not through a wall.)
        const hx = seg[0] + (seg[3] - seg[0]) * g.s, hy = seg[1] + (seg[4] - seg[1]) * g.s, hz = seg[2] + (seg[5] - seg[2]) * g.s;
        if (!w.sees(s.x, this.eyeY(s), s.z, hx, hy, hz)) continue;
        met = e; metS = g.s;
        landed = [hx, hy, hz];
      }
      if (met) break;
    }
    if (!met) return null;
    const e = met;
    s.atkHit.push(e.id);
    const front = this.facing(e, s.x - e.x, s.z - e.z);
    // Met by a guard on that side, or a shield.
    if (front > 0.25 && e.guard && (e.block || e.guardDir === meets(s.atkDir))) {
      const parry = this.time - e.guardAt < PARRY;
      s.atk = 0;
      s.stun = parry ? PARRIED : BLOCKED;
      s.cool = 0;
      if (parry) { e.riposteUntil = this.time + 1.1; e.parries++; }
      e.blocks++;
      // (Both pushed apart a little.)
      const dx = s.x - e.x, dz = s.z - e.z, l = Math.hypot(dx, dz) || 1;
      s.shoveX += (dx / l) * (parry ? 3 : 1.8); s.shoveZ += (dz / l) * (parry ? 3 : 1.8);
      this.events.push({ e: 'block', id: e.id, by: s.id, parry, shield: e.block, x: landed[0], y: landed[1], z: landed[2] });
      return 'stopped';
    }
    const dmg = b.dmg * (gun.back && front < -0.3 ? gun.back : 1);
    s.atkLanded = true;
    s.hits++;
    s.shots++;
    s.hitStop = 0.06;
    this.events.push({ e: 'cut', id: e.id, by: s.id, dir: s.atkDir, x: landed[0], y: landed[1], z: landed[2] });
    // A blow that lands stops whatever they were winding up, and knocks them back a step.
    if (e.atk === 1) { e.atk = 0; this.events.push({ e: 'broken', id: e.id }); }
    e.stun = Math.max(e.stun, FLINCH);
    e.guard = e.block = false;
    const dx = e.x - s.x, dz = e.z - s.z, l = Math.hypot(dx, dz) || 1;
    e.shoveX += (dx / l) * 2.6; e.shoveZ += (dz / l) * 2.6;
    this.hurt(e, dmg, s, gun.id, false);
    return 'hit';
  }

  // A kick lands (or doesn't): on the nearest enemy just in front, through any guard.
  kick(s) {
    const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
    let best = null, bd = KICK.reach + 0.35;
    for (const e of this.soldiers) {
      if (!e.alive || e.team === s.team || Math.abs(e.y - s.y) > 1) continue;
      const dx = e.x - s.x, dz = e.z - s.z, d = Math.hypot(dx, dz);
      if (d >= bd || (dx * sy - dz * cy) / (d || 1) < 0.55) continue;
      if (!this.world.sees(s.x, s.y + 0.8, s.z, e.x, e.y + 0.8, e.z)) continue;
      best = e; bd = d;
    }
    if (!best) { s.cool += 0.35; return; }
    const e = best;
    e.atk = 0; e.kickT = 0;
    e.guard = e.block = false;
    e.stun = KICK.stun;
    e.shoveX += sy * KICK.shove; e.shoveZ -= cy * KICK.shove;
    s.hits++;
    this.events.push({ e: 'kicked', id: e.id, by: s.id, x: e.x, y: e.y + 0.9, z: e.z });
    this.hurt(e, KICK.dmg, s, 'kick', false);
  }

  // A blow with a gun's butt (in Firefight) lands: on the nearest enemy in reach and in front.
  strike(s, gun) {
    const w = this.world, d = this.aim(s, [0, 0, 0]), ox = s.x, oy = this.eyeY(s), oz = s.z;
    const fl = Math.hypot(d[0], d[2]) || 1e-6, cosArc = Math.cos(gun.arc / 2), hits = [];
    for (const e of this.soldiers) {
      if (!e.alive || e.team === s.team) continue;
      const cy = this.mid(e), x = e.x - ox, y = cy - oy, z = e.z - oz, dist = Math.hypot(x, y, z);
      if (dist > gun.reach + 0.34) continue;
      const flat = Math.hypot(x, z) || 1e-6;
      if (dist > 0.9 && (x * d[0] + z * d[2]) / (flat * fl) < cosArc) continue;
      if (!w.sees(ox, oy, oz, e.x, cy, e.z)) continue;
      hits.push({ e, dist, cy });
    }
    hits.sort((a, b) => a.dist - b.dist || a.e.id - b.e.id);
    if (!gun.cleave) hits.length = Math.min(1, hits.length);
    let any = false, stopped = false;
    for (const { e, cy } of hits) {
      const front = this.facing(e, s.x - e.x, s.z - e.z);
      if (e.block && front > 0.3) {
        stopped = true;
        this.events.push({ e: 'block', id: e.id, x: e.x + Math.sin(e.yaw) * 0.4, y: cy + 0.2, z: e.z - Math.cos(e.yaw) * 0.4 });
        continue;
      }
      any = true;
      this.events.push({ e: 'cut', x: e.x, y: cy + 0.2, z: e.z });
      this.hurt(e, gun.dmg * (gun.back && front < -0.3 ? gun.back : 1), s, gun.id, false);
    }
    // A blow that only met a shield throws the arm back.
    if (stopped && !any) s.cool += 0.4;
    s.shots++;
    if (any) s.hits++;
  }

  // How squarely soldier e faces the direction (x, z): 1 straight at it, -1 away.
  facing(e, x, z) {
    const l = Math.hypot(x, z) || 1e-6;
    return (Math.sin(e.yaw) * x - Math.cos(e.yaw) * z) / l;
  }

  // Sends an arrow or a thrown thing on its way.
  loose(s, gun, kind, speed, dmg, grav, head, wide) {
    const d = this.aim(s, [0, 0, 0]), rng = this.rng;
    const r = wide * Math.sqrt(rng.next()), a = rng.next() * Math.PI * 2;
    const rl = Math.hypot(d[0], d[2]) || 1, rx = -d[2] / rl, rz = d[0] / rl;
    const ex = Math.cos(a) * r, ey = Math.sin(a) * r;
    let dx = d[0] + rx * ex - d[1] * rz * ey, dy = d[1] + (d[0] * rz - d[2] * rx) * ey, dz = d[2] + rz * ex + d[1] * rx * ey;
    const l = Math.hypot(dx, dy, dz);
    dx /= l; dy /= l; dz /= l;
    const x = s.x + dx * 0.35, y = this.eyeY(s) - 0.08 + dy * 0.35, z = s.z + dz * 0.35;
    s.shots++;
    this.shots.push({ kind, gun: gun.id, by: s.id, team: s.team, x, y, z, px: x, py: y, pz: z, vx: dx * speed, vy: dy * speed, vz: dz * speed, grav, dmg, head, life: 5 });
  }

  // An arrow or a thrown thing in the air. True when it has landed.
  stepShot(p, dt) {
    const w = this.world;
    p.px = p.x; p.py = p.y; p.pz = p.z;
    p.life -= dt;
    if (p.life <= 0) return true;
    p.vy -= p.grav * dt;
    const v = Math.hypot(p.vx, p.vy, p.vz), dx = p.vx / v, dy = p.vy / v, dz = p.vz / v, dist = v * dt;
    const wall = w.ray(p.x, p.y, p.z, dx, dy, dz, dist);
    let best = Math.min(wall, dist), struck = null, head = false;
    for (const e of this.soldiers) {
      if (!e.alive || e.team === p.team) continue;
      const h = this.rayHits(e, p.x, p.y, p.z, dx, dy, dz, best);
      if (h.t < best) { best = h.t; struck = e; head = h.head; }
    }
    const x = p.x + dx * best, y = p.y + dy * best, z = p.z + dz * best;
    if (struck) {
      const by = this.soldiers[p.by];
      if (struck.block && this.facing(struck, -dx, -dz) > 0.3) this.events.push({ e: 'block', id: struck.id, x, y, z });
      else {
        this.events.push({ e: 'cut', x, y, z });
        by.hits++;
        this.hurt(struck, p.dmg * (head ? p.head : 1), by, p.gun, head);
      }
      return true;
    }
    if (wall <= dist) {
      this.events.push({ e: 'stick', kind: p.kind, x: x - dx * 0.06, y: y - dy * 0.06, z: z - dz * 0.06, dx, dy, dz });
      return true;
    }
    p.x = x; p.y = y; p.z = z;
    return false;
  }

  // A medic gets a scrapped robot back on its feet, where it lay.
  revive(e, by) {
    e.alive = true;
    e.down = 0;
    e.respawnT = 0;
    e.hp = e.maxHp * REVIVE_HP;
    e.hurtAt = this.time;
    e.protect = 1;
    e.vx = e.vy = e.vz = 0;
    e.px = e.x; e.py = e.y; e.pz = e.z;
    e.grounded = true; e.crouching = false; e.crouchK = 0; e.prone = false; e.proneK = 0; e.stanceT = 0.5; e.slideT = 0; e.h = TALL;
    e.swing = e.draw = 0; e.reloadT = 0; e.throwT = 0; e.out = 0; e.spawnOn = -1;
    // (It has its weapon back, so the one it dropped goes.)
    const k = this.drops.findIndex((d) => d.owner === e.id);
    if (k >= 0) this.drops.splice(k, 1);
    if (this.type === 'adv' && e.team === this.attack && !this.over) this.tickets++;
    by.score += 80;
    by.revives++;
    if (e.bot) e.bot.reset();
    this.events.push({ e: 'revive', id: e.id, by: by.id });
  }

  // A battalion is spent: both sides regroup, and the sector starts over.
  regroup() {
    for (const o of this.objectives()) { o.own = false; o.p = 0; o.a = o.d = 0; }
    this.soldiers.forEach((s, i) => {
      s.alive = false;
      s.down = 0;
      s.hp = 0;
      s.spawnOn = -1;
      s.respawnT = 3 + 0.04 * (i % 40);
    });
    this.nades.length = 0;
    this.shots.length = 0;
    this.drops.length = 0;
    this.shells.length = 0;
    this.retreatUntil = -1;
    this.barrageUntil = this.time + 15; // and the new battalion comes in behind a barrage
    this.events.push({ e: 'regroup' });
  }

  // ---- weapons lying about ---------------------------------------------------------

  // A scrapped soldier's main weapon falls where it stood, with at least a
  // magazine's worth in it.
  dropWeapon(e) {
    const wp = e.weapons[0];
    if (!wp) return;
    const gun = wp.gun, y = this.world.groundAt(e.x, e.z, e.y + 0.5);
    let mag = wp.mag, reserve = wp.reserve;
    if (gun.kind) mag = Math.max(mag, Math.ceil(gun.mag / 2));
    else reserve = Math.max(reserve, gun.mag);
    if (y < -9) return;
    if (this.drops.length >= DROPS) this.drops.shift();
    this.drops.push({ id: ++this.dropId, owner: e.id, gun: gun.id, mag, reserve, x: e.x, y, z: e.z, yaw: e.yaw + 0.7, t: this.time });
  }

  // How many of a thing a weapon can carry, and how many it has.
  static full(gun) { return gun.kind ? gun.mag : gun.mag + gun.reserve; }
  static has(wp) { return wp.mag + (wp.reserve === Infinity ? 0 : wp.reserve); }

  stepPickup(s, inp) {
    const use = inp.use && !s.useHeld;
    s.useHeld = inp.use;
    if (this.tick % 6 !== s.id % 6 && !use) return;
    let near = null, nearD = PICK_REACH;
    for (let k = this.drops.length - 1; k >= 0; k--) {
      const d = this.drops[k];
      if (this.time - d.t > DROP_TIME) { this.drops.splice(k, 1); continue; }
      if (Math.abs(d.y - s.y) > 1.2) continue;
      const dist = Math.hypot(d.x - s.x, d.z - s.z);
      if (dist >= PICK_REACH) continue;
      const wp = s.weapons[0], gun = wp.gun;
      if (d.gun === gun.id) {
        // The same as yours: take what it has, up to what you can carry.
        const room = Match.full(gun) - Match.has(wp), take = Math.min(room, d.mag + d.reserve);
        if (take > 0) {
          if (gun.kind) wp.mag += take; else wp.reserve += take;
          let left = take;
          const fromRes = Math.min(d.reserve, left); d.reserve -= fromRes; left -= fromRes; d.mag -= left;
          this.events.push({ e: 'ammo', id: s.id, n: take, gun: gun.id });
          if (d.mag + d.reserve <= 0) { this.drops.splice(k, 1); continue; }
        }
      } else if (dist < nearD) { nearD = dist; near = d; }
    }
    if (!use || !near || s.swing > 0 || s.atk > 0 || s.draw > 0 || s.throwT > 0) return;
    // Swap: yours goes down where it lay.
    const old = s.weapons[0];
    near.t = this.time;
    s.weapons[0] = { gun: GUNS[near.gun], mag: near.mag, reserve: near.reserve };
    Object.assign(near, { gun: old.gun.id, mag: old.mag, reserve: old.reserve === Infinity ? 0 : old.reserve, yaw: s.yaw + 0.7 });
    s.slot = 0;
    s.swapT = 0.5;
    s.reloadT = 0;
    s.bloom = 0;
    this.events.push({ e: 'pickup', id: s.id, gun: s.weapons[0].gun.id });
  }

  // The weapon lying nearest to a soldier, other than one like its own, within reach.
  dropNear(s) {
    let best = null, bestD = PICK_REACH;
    for (const d of this.drops) {
      if (d.gun === s.weapons[0].gun.id || Math.abs(d.y - s.y) > 1.2 || this.time - d.t > DROP_TIME) continue;
      const dist = Math.hypot(d.x - s.x, d.z - s.z);
      if (dist < bestD) { bestD = dist; best = d; }
    }
    return best;
  }

  // How wide a soldier's shots scatter right now, in radians.
  spread(s) {
    const gun = s.weapons[s.slot].gun;
    let a = gun.hip + (gun.ads - gun.hip) * s.ads;
    a += s.bloom * (1 - 0.6 * s.ads);
    // On the move the shots scatter much more, down the sights as well (see moveK).
    a *= 1 + s.moveK * (1.4 + 3.5 * s.ads);
    a *= 1 + s.supp * 1.2;
    if (s.prone) a *= 0.55;
    else if (s.crouching) a *= 0.8;
    if (!s.grounded) a = a * 2 + 2.5;
    return a * RAD;
  }

  fire(s, wp) {
    const gun = wp.gun, rng = this.rng, w = this.world;
    wp.mag--;
    // (Counted from when the gun was ready, not from this step, so it keeps its true rate.)
    s.cool = Math.max(s.cool, -STEP) + gun.rate;
    s.lastShot = this.time;
    s.protect = 0;
    s.shots++;
    const spread = this.spread(s), d = this.aim(s, [0, 0, 0]);
    const ox = s.x, oy = this.eyeY(s), oz = s.z;
    // Two directions square to the aim, to scatter the shots in.
    const rl = Math.hypot(d[0], d[2]) || 1, rx = -d[2] / rl, rz = d[0] / rl;
    const ux = -d[1] * rz, uy = d[0] * rz - d[2] * rx, uz = d[1] * rx;
    let any = false;
    for (let p = 0; p < gun.pellets; p++) {
      const r = spread * Math.sqrt(rng.next()), a = rng.next() * Math.PI * 2;
      const ex = Math.cos(a) * r, ey = Math.sin(a) * r;
      let dx = d[0] + rx * ex + ux * ey, dy = d[1] + uy * ey, dz = d[2] + rz * ex + uz * ey;
      const l = Math.hypot(dx, dy, dz);
      dx /= l; dy /= l; dz /= l;
      let t = w.ray(ox, oy, oz, dx, dy, dz, 160), struck = null, head = false;
      const wallN = t < Infinity ? [w.hit.nx, w.hit.ny, w.hit.nz] : null;
      for (const e of this.soldiers) {
        if (!e.alive || e.team === s.team) continue;
        const te = this.rayHits(e, ox, oy, oz, dx, dy, dz, t);
        if (te.t < t) { t = te.t; struck = e; head = te.head; }
      }
      const far = t === Infinity ? 160 : t;
      this.events.push({ e: 'shot', id: s.id, gun: gun.id, first: p === 0, x: ox + dx * far, y: oy + dy * far, z: oz + dz * far, hit: struck ? (head ? 2 : 1) : t < Infinity ? 0 : -1, n: struck ? null : wallN });
      // Close past anyone else of the other side: it is pinned down.
      for (const e of this.soldiers) {
        if (!e.alive || e.team === s.team || e === struck) continue;
        const hx = e.x - ox, hy = this.eyeY(e) - oy, hz = e.z - oz, along = hx * dx + hy * dy + hz * dz;
        if (along <= 0 || along > far + 1) continue;
        if (hx * hx + hy * hy + hz * hz - along * along < NEAR_MISS * NEAR_MISS) {
          e.supp = Math.min(1, e.supp + (gun.pellets > 1 ? 0.06 : 0.2));
          e.suppAt = this.time;
          if (e.human) this.events.push({ e: 'whizz', id: e.id, x: ox + dx * along, y: oy + dy * along, z: oz + dz * along });
        }
      }
      if (struck) {
        any = true;
        const fall = far <= gun.near ? 1 : far >= gun.far ? gun.min : 1 - ((far - gun.near) / (gun.far - gun.near)) * (1 - gun.min);
        this.hurt(struck, gun.dmg * fall * (head ? gun.head : 1), s, gun.id, head);
      }
    }
    if (any) s.hits++;
    const ease = (1 - 0.35 * s.ads) * (s.prone ? 0.65 : s.crouching ? 0.85 : 1);
    s.kp += gun.kickUp * RAD * ease;
    s.ky += (rng.next() * 2 - 1) * gun.kickSide * RAD * ease;
    s.bloom = Math.min(1.6, s.bloom + gun.bloom);
    // A shot gives you away to anyone on the other side close enough to hear it.
    for (const e of this.soldiers) {
      if (e.alive && e.team !== s.team && Math.hypot(e.x - s.x, e.z - s.z) < 45) { this.know(s); break; }
    }
  }

  // Where a ray meets soldier e, if it does before maxT: the head is a
  // ball, the body an upright cylinder.
  rayHits(e, ox, oy, oz, dx, dy, dz, maxT) {
    const out = this.hitOut || (this.hitOut = { t: Infinity, head: false });
    out.t = Infinity;
    out.head = false;
    if (e.prone) return this.rayHitsLying(e, ox, oy, oz, dx, dy, dz, maxT, out);
    const top = e.crouching ? 1.02 : 1.5, hy = e.y + top + 0.17;
    // Quick miss: too far from the line.
    const px = e.x - ox, pz = e.z - oz, along = px * dx + pz * dz;
    if (along < -1 || along > maxT + 1) return out;
    let cx = e.x - ox, cy = hy - oy, cz = e.z - oz;
    let pr = cx * dx + cy * dy + cz * dz;
    if (pr > 0) {
      const d2 = cx * cx + cy * cy + cz * cz - pr * pr;
      if (d2 < 0.19 * 0.19) {
        const t = pr - Math.sqrt(0.19 * 0.19 - d2);
        if (t > 0 && t < maxT) { out.t = t; out.head = true; }
      }
    }
    const a = dx * dx + dz * dz;
    if (a > 1e-9) {
      const b = -(px * dx + pz * dz), c = px * px + pz * pz - 0.34 * 0.34, disc = b * b - a * c;
      if (disc > 0) {
        const sq = Math.sqrt(disc), t0 = Math.max(0, (-b - sq) / a), t1 = (-b + sq) / a;
        if (t1 > 0 && t0 < maxT) {
          const y0 = oy + dy * t0, y1 = oy + dy * t1, lo = e.y, hi = e.y + top;
          let t = -1;
          if (y0 >= lo && y0 <= hi) t = t0;
          else if (y0 > hi && y1 < hi) t = (hi - oy) / dy;
          else if (y0 < lo && y1 > lo) t = (lo - oy) / dy;
          if (t >= 0 && t < maxT && t < out.t) { out.t = t; out.head = false; }
        }
      }
    }
    return out;
  }

  // A soldier lying down: its body a capsule along the ground, its head a ball in front.
  rayHitsLying(e, ox, oy, oz, dx, dy, dz, maxT, out) {
    const fx = Math.sin(e.yaw), fz = -Math.cos(e.yaw);
    const hx = e.x + fx * 0.72 - ox, hy = e.y + 0.36 - oy, hz = e.z + fz * 0.72 - oz;
    const pr = hx * dx + hy * dy + hz * dz;
    if (pr > 0) {
      const d2 = hx * hx + hy * hy + hz * hz - pr * pr;
      if (d2 < 0.19 * 0.19) {
        const t = pr - Math.sqrt(0.19 * 0.19 - d2);
        if (t > 0 && t < maxT) { out.t = t; out.head = true; }
      }
    }
    // Closest approach between the ray and the body's middle line.
    const ax = e.x - fx * 0.75, ay = e.y + 0.24, az = e.z - fz * 0.75;
    const ex = fx * 1.2, ey = 0.04, ez = fz * 1.2;
    const wx = ox - ax, wy = oy - ay, wz = oz - az;
    const b = dx * ex + dy * ey + dz * ez, c = ex * ex + ey * ey + ez * ez, d = dx * wx + dy * wy + dz * wz, f = ex * wx + ey * wy + ez * wz;
    const den = c - b * b;
    let u = den > 1e-9 ? (f - b * d) / den : 0;
    u = clamp(u, 0, 1);
    const t = Math.max(0, b * u - d);
    const px = ox + dx * t - (ax + ex * u), py = oy + dy * t - (ay + ey * u), pz = oz + dz * t - (az + ez * u);
    const dist2 = px * px + py * py + pz * pz, r = 0.26;
    if (dist2 < r * r) {
      const th = Math.max(0, t - Math.sqrt(r * r - dist2));
      if (th < maxT && th < out.t) { out.t = th; out.head = false; }
    }
    return out;
  }

  hurt(e, dmg, by, gun, head) {
    if (!e.alive || e.protect > 0) return;
    e.hp -= dmg;
    e.hurtAt = this.time;
    e.hurtBy = by.id;
    e.dmgFrom.set(by.id, (e.dmgFrom.get(by.id) || 0) + dmg);
    this.events.push({ e: 'hurt', id: e.id, by: by.id, dmg, head });
    if (e.hp <= 0) this.scrap(e, by, gun, head);
  }

  scrap(e, by, gun, head) {
    e.alive = false;
    e.hp = 0;
    e.deaths++;
    e.down = gun === 'out' ? 0 : REVIVE_WAIT;
    e.spawnOn = -1;
    // (In Advance the defenders are out for longer, so that an attack can break through.)
    // (The player, defending, is not kept waiting quite so long.)
    e.respawnT = this.type === 'adv' && e.team !== this.attack ? (e.human ? Math.min(this.defWait, 7) : this.defWait) : RESPAWN;
    // Each attacker scrapped is one of their lives gone; with none left, the defenders have won.
    if (this.type === 'adv' && !this.over) {
      if (e.team !== this.attack) {
        // A defender caught falling back gives the attack heart.
        if (by !== e && this.time < this.retreatUntil && e.x < this.sectorNow().x0 - 1.5) {
          this.tickets += ROUT;
          this.events.push({ e: 'rout', by: by.id });
        }
      } else if (--this.tickets <= 0) {
        if (this.battalion < this.battalions) {
          // That battalion is spent. The next takes up the attack, and everyone regroups for the sector.
          this.battalion++;
          this.tickets = this.ticketsAtStart;
          this.events.push({ e: 'battalion', n: this.battalion });
          this.regroupAt = this.tick + 1;
        } else {
          this.tickets = 0;
          this.finish(1 - this.attack);
        }
      }
    }
    e.streak = 0;
    const own = by === e;
    if (!own) {
      by.kills++;
      by.streak++;
      by.best = Math.max(by.best, by.streak);
      by.score += 100 + (head ? 25 : 0);
      if (head) by.heads++;
      if (!this.over) this.scores[by.team]++;
      for (const [id, dmg] of e.dmgFrom) {
        const a = this.soldiers[id];
        if (a !== by && a.team !== e.team && dmg >= 25) { a.assists++; a.score += 40; }
      }
    }
    e.dmgFrom.clear();
    this.dropWeapon(e);
    this.events.push({ e: 'kill', id: e.id, by: by.id, gun, head, x: e.x, y: e.y, z: e.z, yaw: e.yaw });
    if (this.scores[by.team] >= this.scoreLimit) this.finish();
  }

  // The other team now knows where s is.
  know(s) {
    s.knownT = this.time;
    s.kx = s.x; s.ky2 = s.y; s.kz = s.z;
  }

  // Can soldier a see soldier b (head or chest)?
  canSee(a, b) {
    const w = this.world, ay = this.eyeY(a);
    return w.sees(a.x, ay, a.z, b.x, this.eyeY(b), b.z) || w.sees(a.x, ay, a.z, b.x, b.y + 0.9, b.z);
  }

  // What the player has in view is marked for the team.
  look(s) {
    const d = this.aim(s, [0, 0, 0]);
    for (const e of this.soldiers) {
      if (!e.alive || e.team === s.team) continue;
      const x = e.x - s.x, y = e.y + 1 - this.eyeY(s), z = e.z - s.z, l = Math.hypot(x, y, z) || 1;
      if ((x * d[0] + y * d[1] + z * d[2]) / l > 0.75 && l < 90 && this.canSee(s, e)) this.know(e);
    }
  }

  // Soldiers don't stand inside each other.
  separate() {
    const list = this.soldiers, w = this.world;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (!b.alive || Math.abs(a.y - b.y) > 1.6) continue;
        const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = a.r + b.r;
        if (d >= min || d < 1e-6) continue;
        const k = (min - d) / d / 2, px = dx * k, pz = dz * k;
        if (!w.blocked(a.x - px, a.y, a.z - pz, a.r, a.h, 0.55)) { a.x -= px; a.z -= pz; }
        if (!w.blocked(b.x + px, b.y, b.z + pz, b.r, b.h, 0.55)) { b.x += px; b.z += pz; }
      }
    }
  }

  // ---- grenades ---------------------------------------------------------------------------

  throwNade(s) {
    const d = this.aim(s, [0, 0, 0]);
    s.nadeCount--;
    s.throwT = 0.65;
    s.reloadT = 0;
    s.protect = 0;
    this.nades.push({
      x: s.x + d[0] * 0.3, y: this.eyeY(s) - 0.1, z: s.z + d[2] * 0.3, px: s.x, py: this.eyeY(s), pz: s.z,
      vx: d[0] * 16 + s.vx * 0.5, vy: d[1] * 16 + 3.2, vz: d[2] * 16 + s.vz * 0.5, fuse: NADE_FUSE, by: s.id, team: s.team, rest: false, spin: 0,
    });
    this.events.push({ e: 'throw', id: s.id });
  }

  stepNade(n, dt) {
    const w = this.world;
    n.px = n.x; n.py = n.y; n.pz = n.z;
    n.fuse -= dt;
    if (n.fuse <= 0) { this.explode(n); return true; }
    if (n.rest) return false;
    n.vy -= GRAVITY * dt;
    let left = dt;
    for (let k = 0; k < 3 && left > 1e-5; k++) {
      const v = Math.hypot(n.vx, n.vy, n.vz);
      if (v < 1e-4) break;
      const dx = n.vx / v, dy = n.vy / v, dz = n.vz / v, dist = v * left;
      const t = w.ray(n.x, n.y, n.z, dx, dy, dz, dist + 0.08);
      if (t === Infinity) { n.x += dx * dist; n.y += dy * dist; n.z += dz * dist; break; }
      const go = Math.max(0, t - 0.08);
      n.x += dx * go; n.y += dy * go; n.z += dz * go;
      // A fire pot bursts where it lands.
      if (this.mode.pot) { this.explode(n); return true; }
      left -= go / v;
      // Bounce: lose most of the speed into the surface, some along it.
      const h = w.hit, vn = n.vx * h.nx + n.vy * h.ny + n.vz * h.nz;
      n.vx = (n.vx - 1.4 * vn * h.nx) * 0.72;
      n.vy = (n.vy - 1.4 * vn * h.ny) * 0.72;
      n.vz = (n.vz - 1.4 * vn * h.nz) * 0.72;
      if (-vn > 2) this.events.push({ e: 'bounce', x: n.x, y: n.y, z: n.z });
      if (h.ny > 0.5 && Math.hypot(n.vx, n.vy, n.vz) < 1.2) { n.rest = true; n.vx = n.vy = n.vz = 0; break; }
    }
    return false;
  }

  explode(n) {
    const w = this.world, by = this.soldiers[n.by];
    this.events.push({ e: 'boom', x: n.x, y: n.y, z: n.z });
    for (const e of this.soldiers) {
      if (!e.alive || (e.team === n.team && e !== by)) continue;
      const cy = this.mid(e), d = Math.hypot(e.x - n.x, cy - n.y, e.z - n.z);
      const reach = this.mode.pot ? 5 : NADE_REACH;
      if (d >= reach || !w.sees(n.x, n.y + 0.25, n.z, e.x, cy, e.z)) continue;
      this.hurt(e, (this.mode.pot ? 140 : NADE_DAMAGE) * clamp(1 - (d - 1.2) / (reach - 1.2), 0, 1), by, 'nade', false);
    }
  }

  // ---- for the screen and the tests --------------------------------------------------------

  // The soldiers of both teams, best score first.
  table(team) {
    return this.soldiers.filter((s) => s.team === team).sort((a, b) => b.score - a.score || a.deaths - b.deaths || a.id - b.id);
  }

  // A number that changes if anything about the match does.
  hash() {
    let h = 2166136261;
    const mix = (v) => { h = Math.imul(h ^ (Math.round(v * 1000) | 0), 16777619); };
    for (const s of this.soldiers) { mix(s.x); mix(s.y); mix(s.z); mix(s.hp); mix(s.kills); mix(s.deaths); mix(s.yaw); }
    mix(this.scores[0]); mix(this.scores[1]);
    return h >>> 0;
  }
}
