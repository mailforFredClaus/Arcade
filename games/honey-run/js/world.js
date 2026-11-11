// Honey Run: the countryside the line runs through. It is built in chunks
// a little way ahead of the cub and thrown away behind: the ground (grass,
// fields, the track bed, far hills, clouds), the things standing on it
// (trees, houses, walls, platforms, gantries, poles), which cast shadows,
// and the bright steel (rails and wires), which glints.
//
// Every 520 metres the season changes: meadow, blossom, autumn, sunset,
// snow, and round again. The colours of the land, the sky and the light
// all drift from one to the next.
//
// The line beside the track comes in stretches of 80 metres: open country,
// a cutting between stone walls with the fields up on top, or a station
// with a platform and a canopy each side. Many stretches are electrified,
// with a gantry over all three tracks every 40 metres. Everything close to
// the line is there so the run feels fast: it streams past at the edges.

import { Builder, M, rgb, mix, shade } from './gl.js';
import { Rand, LANE, FLY_HEIGHT } from './engine.js';
import { GAUGE } from './models.js';

export const CHUNK = 20;
const BED = LANE + 2.35; // half the width of the track bed
const OUT = BED - 3.75; // how much further out everything beside the line stands than it first did
const ZONE = 520, BLEND = 90;
const TAU = Math.PI * 2;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const WALL = BED + 1.0; // the inside face of a cutting's walls
const BANK = 16, FOOT = 26; // a cutting's top is flat out to here, then slopes down to the fields by here
const PLAT = BED + 0.15, PLAT_W = 4.2, PLAT_H = 1.05; // station platforms: where they start, how wide, how high
const MAST = BED + 0.55; // a gantry's masts
export const WIRE = FLY_HEIGHT + 5.1; // the overhead wires: well above the balloons
const SEG = 4; // chunks to a stretch

const hex = (list) => list.map(rgb);
const ZONES = [
  {
    name: 'Meadow',
    top: '#2a7fe6', fog: '#cdeeff', sunCol: [0.66, 0.62, 0.52], skyLight: [0.6, 0.66, 0.78], groundLight: [0.4, 0.42, 0.34], sun: [-0.5, 0.74, 0.45], glow: [1, 0.95, 0.8],
    grass: '#7ed058', grass2: '#70c44c', bed: '#6a6674', stone: '#b5a893', hill: '#62b85c', field: ['#9bdc6a', '#f2d660', '#86cf5e', '#cbe36a'],
    leaf: ['#3fa64a', '#58bb4e', '#2f8f48', '#6cc75a'], trunk: '#8a5a33', flower: ['#ffd23f', '#ff7fb0', '#ffffff'],
    wall: ['#fff3dc', '#ffe0b8', '#f6f1e6'], roof: ['#e5533b', '#c8452f', '#3b6fd6'], kind: 'meadow',
  },
  {
    name: 'Blossom',
    top: '#4a97f2', fog: '#e9f4ff', sunCol: [0.62, 0.6, 0.56], skyLight: [0.64, 0.66, 0.78], groundLight: [0.42, 0.4, 0.38], sun: [-0.55, 0.72, 0.42], glow: [1, 0.96, 0.9],
    grass: '#8fd66c', grass2: '#82cb60', bed: '#6e6877', stone: '#c27a5c', hill: '#7cc674', field: ['#a5e07a', '#ffc7dd', '#8fd66c', '#ffe08a'],
    leaf: ['#ffb3d1', '#ff9cc4', '#ffd0e2', '#f78fb8'], trunk: '#7a4f36', flower: ['#ff7fb0', '#ffffff', '#c58bff'],
    wall: ['#fff8ee', '#ffe9ef', '#eef6ff'], roof: ['#3b6fd6', '#e5533b', '#8a5fd6'], kind: 'village',
  },
  {
    name: 'Autumn',
    top: '#4f86d2', fog: '#ffe9c8', sunCol: [0.7, 0.58, 0.42], skyLight: [0.62, 0.6, 0.62], groundLight: [0.44, 0.38, 0.28], sun: [-0.6, 0.62, 0.48], glow: [1, 0.85, 0.6],
    grass: '#b9b24c', grass2: '#aaa341', bed: '#6b6159', stone: '#9e8d79', hill: '#c78f3e', field: ['#d9b44a', '#c96a2a', '#b9b24c', '#e0903a'],
    leaf: ['#e8792a', '#d9452b', '#f2b632', '#c9611e'], trunk: '#6b4226', flower: ['#f2b632', '#e8792a', '#d9452b'],
    wall: ['#f6e6c8', '#e8d2a8', '#fff3dc'], roof: ['#8a4a2f', '#6b3a26', '#a8452f'], kind: 'forest',
  },
  {
    name: 'Sunset',
    top: '#3b3a94', fog: '#ffb07a', sunCol: [0.9, 0.5, 0.26], skyLight: [0.7, 0.58, 0.72], groundLight: [0.6, 0.44, 0.4], sun: [-0.5, 0.3, -0.81], glow: [1, 0.6, 0.3],
    grass: '#c7a84c', grass2: '#b89a42', bed: '#625465', stone: '#ad8572', hill: '#8a5f78', field: ['#e0bd55', '#d6a640', '#c7a84c', '#b98a3a'],
    leaf: ['#7d8a3c', '#96833a', '#6a7d3a', '#a8903e'], trunk: '#5c3a26', flower: ['#ffd23f', '#ff9f43', '#ffffff'],
    wall: ['#ffe0b8', '#f6d2a8', '#ffe9c8'], roof: ['#a8452f', '#8a3a2a', '#6b3a4a'], kind: 'meadow',
  },
  {
    name: 'Snow',
    top: '#4d86d0', fog: '#eef6ff', sunCol: [0.56, 0.58, 0.62], skyLight: [0.7, 0.74, 0.84], groundLight: [0.5, 0.52, 0.58], sun: [-0.45, 0.68, 0.5], glow: [0.95, 0.97, 1],
    grass: '#f4f9ff', grass2: '#e4eefb', bed: '#6f798d', stone: '#a9afba', hill: '#dce8f8', field: ['#ffffff', '#e4eefb', '#f4f9ff', '#d8e6f8'],
    leaf: ['#2f7a5f', '#3b8a6a', '#286a55', '#34806a'], trunk: '#5c4032', flower: ['#ffffff', '#bfe0ff', '#ffffff'],
    wall: ['#a8643a', '#8f5530', '#b97a48'], roof: ['#ffffff', '#f4f9ff', '#ffffff'], kind: 'snow',
  },
].map((z) => ({
  ...z, top: rgb(z.top), fog: rgb(z.fog), grass: rgb(z.grass), grass2: rgb(z.grass2), bed: rgb(z.bed), stone: rgb(z.stone), hill: rgb(z.hill), trunk: rgb(z.trunk),
  field: hex(z.field), leaf: hex(z.leaf), flower: hex(z.flower), wall: hex(z.wall), roof: hex(z.roof),
}));

const BLENDED = ['top', 'fog', 'sunCol', 'skyLight', 'groundLight', 'sun', 'glow', 'grass', 'grass2', 'bed', 'stone', 'hill', 'trunk'];
const LISTS = ['field', 'leaf', 'flower', 'wall', 'roof'];

// The look of the land s metres along: one season, or two blended.
export function lookAt(s) {
  const i = Math.floor(Math.max(0, s) / ZONE), into = Math.max(0, s) - i * ZONE;
  const a = ZONES[i % ZONES.length], b = ZONES[(i + 1) % ZONES.length];
  const k = into > ZONE - BLEND ? (into - (ZONE - BLEND)) / BLEND : 0;
  if (k <= 0) return a;
  const t = k * k * (3 - 2 * k);
  const out = { name: t < 0.5 ? a.name : b.name, kind: t < 0.5 ? a.kind : b.kind, index: i };
  for (const key of BLENDED) out[key] = mix(a[key], b[key], t);
  for (const key of LISTS) out[key] = a[key].map((c, n) => mix(c, b[key][n % b[key].length], t));
  const l = Math.hypot(...out.sun);
  out.sun = out.sun.map((v) => v / l);
  return out;
}
export const zoneName = (s) => ZONES[Math.floor(Math.max(0, s) / ZONE) % ZONES.length].name;
for (const z of ZONES) {
  const l = Math.hypot(...z.sun);
  z.sun = z.sun.map((v) => v / l);
}

// ---- things that stand on the land ------------------------------------------------------

function tree(b, R, x, z, s, look) {
  const leaf = look.leaf;
  b.column(6, x, 0, z, 0.2 * s, 0.14 * s, 1.5 * s, look.trunk);
  const c1 = R.pick(leaf), c2 = R.pick(leaf);
  b.ball(x, 2.5 * s, z, 1.25 * s, 1.15 * s, 1.25 * s, c1, 7, 4, shade(c1, 0.84));
  b.ball(x + 0.55 * s, 3.3 * s, z + 0.2 * s, 0.85 * s, 0.8 * s, 0.85 * s, c2, 6, 4, shade(c2, 0.86));
  if (R.next() < 0.6) b.ball(x - 0.6 * s, 3.0 * s, z - 0.3 * s, 0.75 * s, 0.7 * s, 0.75 * s, mix(c1, [1, 1, 1], 0.12), 6, 4);
}

function pine(b, R, x, z, s, look, snowy) {
  const c = R.pick(look.leaf);
  b.column(6, x, 0, z, 0.2 * s, 0.16 * s, 1.0 * s, look.trunk);
  for (let k = 0; k < 3; k++) {
    const y = (0.8 + k * 1.15) * s, r = (1.35 - k * 0.33) * s;
    b.column(7, x, y, z, r, 0, 1.7 * s, shade(c, 1 - k * 0.04), { noBottom: false, turn: k });
    if (snowy) b.column(7, x, y + 0.75 * s, z, r * 0.6, 0, 0.98 * s, [1, 1, 1], { turn: k });
  }
}

function bush(b, R, x, z, s, look) {
  const c = R.pick(look.leaf);
  b.ball(x, 0.35 * s, z, 0.7 * s, 0.5 * s, 0.6 * s, c, 6, 3, shade(c, 0.85));
}

function house(b, R, x, z, look, facing) {
  const wall = R.pick(look.wall), roof = R.pick(look.roof);
  const w = 3.4 + R.next() * 1.2, d = 3 + R.next() * 1.4, h = 2.5 + R.next() * 0.8;
  b.with(M.chain(M.move(x, 0, z), M.rotY(facing), M.scale(1.5)), () => {
    b.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, wall, { noTop: true });
    // A pitched roof.
    const o = 0.3, ry = h + 1.5;
    b.quad([-w / 2 - o, h - 0.1, d / 2 + o], [w / 2 + o, h - 0.1, d / 2 + o], [w / 2 + o, ry, 0], [-w / 2 - o, ry, 0], roof);
    b.quad([w / 2 + o, h - 0.1, -d / 2 - o], [-w / 2 - o, h - 0.1, -d / 2 - o], [-w / 2 - o, ry, 0], [w / 2 + o, ry, 0], shade(roof, 0.86));
    for (const sx of [-1, 1]) b.tri([sx * w / 2, h, d / 2], [sx * w / 2, h, -d / 2], [sx * w / 2, ry - 0.12, 0], wall);
    // Door and windows on the side that faces the line.
    b.box(-0.4, 0, d / 2, 0.4, 1.6, d / 2 + 0.05, shade(roof, 0.8));
    for (const sx of [-1, 1]) {
      b.box(sx * w * 0.32 - 0.38, 1.0, d / 2, sx * w * 0.32 + 0.38, 1.8, d / 2 + 0.05, '#7fb8e6');
      b.box(sx * w * 0.32 - 0.44, 0.92, d / 2, sx * w * 0.32 + 0.44, 1.0, d / 2 + 0.08, '#ffffff');
    }
    b.box(w * 0.2, h + 0.4, -0.3, w * 0.2 + 0.5, ry + 0.5, 0.2, shade(wall, 0.78));
  });
}

function windmill(b, R, x, z, look) {
  b.with(M.chain(M.move(x, 0, z), M.scale(1.4)), () => {
    b.column(8, 0, 0, 0, 1.5, 0.95, 6.2, look.wall[0]);
    b.column(8, 0, 6.2, 0, 1.15, 0, 1.3, look.roof[0]);
    b.box(-0.35, 0, 1.3, 0.35, 1.5, 1.5, shade(look.roof[0], 0.8));
    // Sails.
    const turn = R.next() * TAU;
    b.with(M.chain(M.move(0, 5.6, 1.25), M.rotZ(turn)), () => {
      for (let k = 0; k < 4; k++) {
        b.with(M.rotZ((k * TAU) / 4), () => {
          b.box(-0.07, 0, -0.05, 0.07, 3.6, 0.05, '#8a5a33');
          b.box(0.07, 0.9, -0.03, 0.85, 3.5, 0.03, '#fff8ee');
        });
      }
    });
  });
}

function haystack(b, R, x, z) {
  b.column(8, x, 0, z, 1.1, 0.9, 1.1, '#f2c84b');
  b.column(8, x, 1.1, z, 0.95, 0, 1.0, '#ffe08a');
}

function roundBale(b, R, x, z) {
  b.with(M.chain(M.move(x, 0.6, z), M.rotY(R.next() * 3), M.rotZ(Math.PI / 2)), () => {
    b.column(10, 0, -0.5, 0, 0.6, 0.6, 1.0, '#f2c84b', { top: '#ffe08a' });
  });
}

function sunflower(b, R, x, z) {
  const h = 1.2 + R.next() * 0.6;
  b.box(x - 0.03, 0, z - 0.03, x + 0.03, h, z + 0.03, '#3f9a45');
  b.with(M.chain(M.move(x, h, z), M.rotX(Math.PI / 2 - 0.35)), () => {
    b.column(8, 0, 0, 0, 0.3, 0.3, 0.06, '#ffd23f', { top: '#ffd23f' });
    b.column(6, 0, 0.02, 0, 0.14, 0.14, 0.07, '#7a4a22');
  });
}

function snowman(b, R, x, z) {
  b.ball(x, 0.5, z, 0.6, 0.55, 0.6, [1, 1, 1], 7, 4);
  b.ball(x, 1.25, z, 0.42, 0.4, 0.42, [1, 1, 1], 7, 4);
  b.ball(x, 1.85, z, 0.3, 0.3, 0.3, [1, 1, 1], 7, 4);
  b.column(6, x, 2.08, z, 0.28, 0.24, 0.3, '#2b2f3a');
  b.column(5, x + 0.0, 1.85, z + 0.28, 0.06, 0, 0.3, '#ff8a1c', { turn: 0 });
}

function rock(b, R, x, z, s) {
  const g = 0.55 + R.next() * 0.2;
  b.ball(x, 0.25 * s, z, 0.8 * s, 0.5 * s, 0.6 * s, [g, g, g * 1.05], 6, 3);
}

function lamp(b, x, z) {
  b.box(x - 0.06, 0, z - 0.06, x + 0.06, 3.2, z + 0.06, '#3a4152');
  b.box(x - 0.2, 3.2, z - 0.2, x + 0.2, 3.7, z + 0.2, '#ffe9a8');
  b.column(4, x, 3.7, z, 0.3, 0, 0.25, '#3a4152');
}

// A stone road bridge over the line: tall enough to float under on balloons.
const ARCH = 12.8;
function roadBridge(b, z, look) {
  const stone = mix(rgb('#b8b0a2'), look.bed, 0.3), dark = shade(stone, 0.78), pale = shade(stone, 1.12);
  const a = BED + 2.3, d = 2.6, n = 12; // half the span (the fence and the wires run through it too), half the depth, pieces of arch
  const under = (x) => ARCH - 4.4 + 3.9 * Math.sqrt(Math.max(0, 1 - (x / a) ** 2));
  // Piers, the deck and its walls.
  for (const sx of [-1, 1]) {
    b.box(sx * a, 0, z - d, sx * (a + 2.6), ARCH, z + d, stone);
    b.box(sx * (a - 0.15), 0, z - d - 0.15, sx * (a + 2.75), 0.9, z + d + 0.15, dark);
    // The road runs off down a bank on each side.
    b.quad([sx * (a + 2.6), ARCH + 0.5, z + d], [sx * (a + 2.6), ARCH + 0.5, z - d], [sx * (a + 30), 0, z - d], [sx * (a + 30), 0, z + d], sx > 0 ? look.grass2 : look.grass);
    b.quad([sx * (a + 2.6), ARCH + 0.5, z - d], [sx * (a + 2.6), ARCH + 0.5, z + d], [sx * (a + 30), 0, z + d], [sx * (a + 30), 0, z - d], look.grass2);
    b.tri([sx * (a + 2.6), 0, z + d], [sx * (a + 30), 0, z + d], [sx * (a + 2.6), ARCH + 0.5, z + d], look.grass2);
    b.tri([sx * (a + 2.6), 0, z - d], [sx * (a + 2.6), ARCH + 0.5, z - d], [sx * (a + 30), 0, z - d], look.grass2);
  }
  b.box(-a - 2.6, ARCH, z - d, a + 2.6, ARCH + 0.5, z + d, dark, { top: '#6f6a66' });
  for (const sz of [-1, 1]) b.box(-a - 2.6, ARCH + 0.5, z + sz * d, a + 2.6, ARCH + 1.4, z + sz * (d - 0.35), pale);
  // The arch: its two faces and its underside.
  for (let k = 0; k < n; k++) {
    const x0 = -a + (2 * a * k) / n, x1 = -a + (2 * a * (k + 1)) / n, y0 = under(x0), y1 = under(x1);
    b.quad([x0, y0, z + d], [x1, y1, z + d], [x1, ARCH, z + d], [x0, ARCH, z + d], stone);
    b.quad([x1, y1, z - d], [x0, y0, z - d], [x0, ARCH, z - d], [x1, ARCH, z - d], stone);
    b.quad([x0, y0, z - d], [x1, y1, z - d], [x1, y1, z + d], [x0, y0, z + d], dark);
    // A ring of paler stones round the opening, on the side you see.
    b.quad([x0, y0, z + d + 0.06], [x1, y1, z + d + 0.06], [x1, y1 + 0.5, z + d + 0.06], [x0, y0 + 0.5, z + d + 0.06], pale);
  }
}

// A signal on a post beside the line: its arm up or down.
function signal(b, R, x, z) {
  const side = Math.sign(x);
  b.box(x - 0.1, 0, z - 0.1, x + 0.1, 6.2, z + 0.1, '#f1ede4');
  b.box(x - 0.14, 0, z - 0.14, x + 0.14, 1.1, z + 0.14, '#2b2f3a');
  b.column(4, x, 6.2, z, 0.2, 0, 0.35, '#2b2f3a');
  b.with(M.chain(M.move(x, 5.5, z + 0.12), M.rotZ(side * (R.next() < 0.5 ? 0.75 : 0))), () => {
    b.box(-side * 1.5, -0.16, 0, 0, 0.16, 0.06, '#e5383b');
    b.box(-side * 1.2, -0.16, 0.06, -side * 0.95, 0.16, 0.07, '#ffffff');
  });
  b.box(x - 0.16, 4.7, z + 0.1, x + 0.16, 5.0, z + 0.2, '#ffd23f');
}

function cloud(b, R, x, y, z, s) {
  const n = 3 + R.int(3);
  for (let k = 0; k < n; k++) {
    const r = (2.2 + R.next() * 2.4) * s;
    // (Brighter than white, so their undersides stay pale rather than grey.)
    b.ball(x + (k - n / 2) * 2.8 * s, y + R.next() * 1.2 * s, z + (R.next() - 0.5) * 3 * s, r * 1.3, r * 0.75, r, [1.5, 1.5, 1.5], 7, 4, [1.75, 1.8, 1.95]);
  }
}

// ---- stretches: open country, cuttings and stations ----------------------------------------

const STRETCH = {
  meadow: { open: 5, cutting: 3, station: 1.2 },
  village: { open: 3, cutting: 2, station: 4 },
  forest: { open: 4, cutting: 5 },
  snow: { open: 5, cutting: 4, station: 1 },
};
const stretches = new Map();
// Stretch n runs from n * 80 m to (n + 1) * 80 m. (Where the cub starts is
// always open country, for the title.)
function stretch(n) {
  let st = stretches.get(n);
  if (st) return st;
  const R = new Rand(5003 + n * 104729);
  const kind = lookAt(n * SEG * CHUNK + (SEG * CHUNK) / 2).kind;
  const type = n > 0 ? R.weighted(STRETCH[kind]) : 'open';
  st = { type, wired: n > 0 && type !== 'station' && R.next() < 0.7, h: 3.6 + R.next() * 1.4 };
  if (stretches.size > 300) stretches.clear();
  stretches.set(n, st);
  return st;
}
const stretchOf = (index) => stretch(Math.floor(index / SEG));

// How high a cutting's walls are s metres along. They rise out of the
// ground and sink back into it over a few metres at each end, and run
// smoothly from one cutting into the next.
const EASE = 7;
const wallH = (st) => (st.type === 'cutting' ? st.h : 0);
function wallAt(s) {
  const L = SEG * CHUNK, n = Math.floor(s / L), into = s - n * L, h = wallH(stretch(n));
  if (into < EASE) return lerp(wallH(stretch(n - 1)), h, (into + EASE) / (2 * EASE));
  if (into > L - EASE) return lerp(h, wallH(stretch(n + 1)), (into - (L - EASE)) / (2 * EASE));
  return h;
}

// How much of a platform there is s metres along (0..1: it slopes down at the ends).
function platAt(s) {
  const L = SEG * CHUNK, n = Math.floor(s / L), into = s - n * L;
  if (stretch(n).type !== 'station') return 0;
  const a = stretch(n - 1).type === 'station' ? 1 : clamp((into - 2) / 4, 0, 1);
  const b = stretch(n + 1).type === 'station' ? 1 : clamp((L - 2 - into) / 4, 0, 1);
  return Math.min(a, b);
}

// The height of the land |x| metres out from the middle of the line, where
// a cutting's walls are h high.
function landAt(ax, h) {
  if (h <= 0.01 || ax < WALL) return 0;
  if (ax <= BANK) return h;
  if (ax >= FOOT) return 0;
  return (h * (FOOT - ax)) / (FOOT - BANK);
}

// A quad, turned so that it faces the way n points.
function facing(b, a, c, d, e, color, n) {
  const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * n[0] + ny * n[1] + nz * n[2] >= 0) b.quad(a, c, d, e, color);
  else b.quad(e, d, c, a, color);
}

// A thin bar from one point to another (a wire, a brace).
function bar(b, a, e, w, color) {
  const dx = e[0] - a[0], dy = e[1] - a[1], dz = e[2] - a[2];
  // Two crossed strips, so it shows from any side.
  const l = Math.hypot(dx, dz) || 1, px = (-dz / l) * w, pz = (dx / l) * w;
  b.quad([a[0] - px, a[1], a[2] - pz], [a[0] + px, a[1], a[2] + pz], [e[0] + px, e[1], e[2] + pz], [e[0] - px, e[1], e[2] - pz], color);
  b.quad([a[0], a[1] - w, a[2]], [a[0], a[1] + w, a[2]], [e[0], e[1] + w, e[2]], [e[0], e[1] - w, e[2]], color);
}

// One side of a cutting along a chunk: the wall, its coping, the grass on
// top and the bank down to the fields. side -1 or 1.
function cuttingSide(g, p, side, z1, z0, look) {
  const step = 2.5, stone = look.stone, dark = shade(stone, 0.84), coping = mix(stone, [1, 1, 1], 0.3);
  const inward = [-side, 0, 0], up = [0, 1, 0];
  const x = side * WALL, xc = side * (WALL + 0.55);
  for (let za = z1; za > z0 + 0.01; za -= step) {
    const zb = Math.max(z0, za - step), ha = wallAt(-za), hb = wallAt(-zb);
    if (ha < 0.02 && hb < 0.02) continue;
    const k = Math.round(-za / step);
    // The face, in courses of lighter and darker stone.
    facing(p, [x, 0, za], [x, 0, zb], [x, hb, zb], [x, ha, za], k % 2 ? stone : shade(stone, 0.95), inward);
    facing(p, [x - side * 0.01, 0, za], [x - side * 0.01, 0, zb], [x - side * 0.01, Math.min(0.55, hb), zb], [x - side * 0.01, Math.min(0.55, ha), za], dark, inward);
    // Courses of stone.
    for (let y = 0.95; y < Math.max(ha, hb) - 0.3; y += 0.62) {
      if (y > Math.min(ha, hb) - 0.3) continue;
      facing(p, [x - side * 0.012, y, za], [x - side * 0.012, y, zb], [x - side * 0.012, y + 0.06, zb], [x - side * 0.012, y + 0.06, za], dark, inward);
    }
    // A pier every so often, standing proud of the wall.
    if (k % 3 === 0 && ha > 0.6) p.box(x - side * 0.22, 0, za - 0.45, x + side * 0.05, ha + 0.12, za + 0.45, shade(stone, 1.06), { top: coping });
    // The coping along the top.
    facing(p, [x - side * 0.12, ha, za], [x - side * 0.12, hb, zb], [x - side * 0.12, hb + 0.24, zb], [x - side * 0.12, ha + 0.24, za], coping, inward);
    facing(p, [x - side * 0.12, ha + 0.24, za], [x - side * 0.12, hb + 0.24, zb], [xc, hb + 0.24, zb], [xc, ha + 0.24, za], coping, up);
    // Grass on top, and the bank down to the fields.
    facing(g, [xc, ha + 0.2, za], [xc, hb + 0.2, zb], [side * BANK, hb, zb], [side * BANK, ha, za], look.grass, up);
    facing(g, [side * BANK, ha, za], [side * BANK, hb, zb], [side * FOOT, 0, zb], [side * FOOT, 0, za], look.grass2, [side * 0.3, 1, 0]);
  }
}

// One side of a station along a chunk: the platform, and its canopy where
// the platform is at its full height.
function stationSide(p, side, z1, z0, look) {
  const step = 2.5, brick = look.stone, top = rgb('#d9d4cc'), edge = rgb('#f4f1ea'), line = rgb('#ffd23f');
  const x0 = side * PLAT, x1 = side * (PLAT + PLAT_W), inward = [-side, 0, 0], up = [0, 1, 0];
  const roof = look.roof[0], post = rgb('#3d4f6b');
  for (let za = z1; za > z0 + 0.01; za -= step) {
    const zb = Math.max(z0, za - step), pa = platAt(-za), pb = platAt(-zb);
    if (pa <= 0 && pb <= 0) continue;
    const ha = PLAT_H * pa, hb = PLAT_H * pb;
    facing(p, [x0, 0, za], [x0, 0, zb], [x0, hb - 0.12, zb], [x0, ha - 0.12, za], brick, inward);
    // The edge: pale stone overhanging, then a yellow line to stand behind.
    facing(p, [x0 - side * 0.12, ha - 0.12, za], [x0 - side * 0.12, hb - 0.12, zb], [x0 - side * 0.12, hb, zb], [x0 - side * 0.12, ha, za], edge, inward);
    facing(p, [x0 - side * 0.12, ha, za], [x0 - side * 0.12, hb, zb], [x0 + side * 0.45, hb, zb], [x0 + side * 0.45, ha, za], edge, up);
    facing(p, [x0 + side * 0.45, ha + 0.004, za], [x0 + side * 0.45, hb + 0.004, zb], [x0 + side * 0.65, hb + 0.004, zb], [x0 + side * 0.65, ha + 0.004, za], line, up);
    facing(p, [x0 + side * 0.65, ha, za], [x0 + side * 0.65, hb, zb], [x1, hb, zb], [x1, ha, za], top, up);
    facing(p, [x1, 0, za], [x1, 0, zb], [x1, hb, zb], [x1, ha, za], shade(brick, 0.9), [side, 0, 0]);
    if (pa < 1 || pb < 1) continue;
    // The canopy: posts, a sloping roof and a coloured edge.
    const k = Math.round(-za / step), cx = side * (PLAT + 2.7);
    if (k % 2 === 0) {
      p.block(cx, PLAT_H, za - 0.6, 0.18, 3.45, 0.18, post);
      p.box(cx - 0.1, PLAT_H + 3.1, za - 0.62, cx - side * 1.6, PLAT_H + 3.22, za - 0.58, post);
      // A bench, or a lamp, between the posts.
      if (k % 4 === 0) {
        p.box(side * (PLAT + 1.9), PLAT_H + 0.42, zb + 0.6, side * (PLAT + 2.35), PLAT_H + 0.5, za - 1.8, rgb('#a8643a'));
        p.box(side * (PLAT + 2.3), PLAT_H + 0.5, zb + 0.6, side * (PLAT + 2.38), PLAT_H + 0.95, za - 1.8, rgb('#a8643a'));
        for (const z of [zb + 0.8, za - 2]) p.block(side * (PLAT + 2.12), PLAT_H, z, 0.06, 0.42, 0.06, post);
      }
    }
    const ry0 = PLAT_H + 3.45, ry1 = PLAT_H + 3.9;
    const rx0 = side * (PLAT + 0.55), rx1 = side * (PLAT + PLAT_W + 0.3);
    facing(p, [rx0, ry0, za], [rx0, ry0, zb], [rx1, ry1, zb], [rx1, ry1, za], shade(rgb('#e9e4d8'), 0.96), up);
    facing(p, [rx0, ry0 - 0.02, za], [rx0, ry0 - 0.02, zb], [rx1, ry1 - 0.02, zb], [rx1, ry1 - 0.02, za], rgb('#cfc8ba'), [0, -1, 0]);
    facing(p, [rx0, ry0 - 0.45, za], [rx0, ry0 - 0.45, zb], [rx0, ry0, zb], [rx0, ry0, za], roof, inward);
  }
}

// A station building behind the platform.
function stationHouse(p, R, side, zm, look) {
  const wall = R.pick(look.wall), roof = R.pick(look.roof);
  const x0 = side * (PLAT + PLAT_W), x1 = side * (PLAT + PLAT_W + 5.5), h = PLAT_H + 4.2, d = 7;
  p.box(x0, 0, zm - d, x1, h, zm + d, wall, { noTop: true });
  // A hipped roof.
  const o = 0.4, xa = x0 - side * o, xb = x1 + side * o, ym = h + 2.1, xm = (x0 + x1) / 2;
  p.quad([xa, h, zm + d + o], [xb, h, zm + d + o], [xm, ym, zm + d - 2.5], [xm, ym, zm + d - 2.5], roof);
  p.quad([xb, h, zm - d - o], [xa, h, zm - d - o], [xm, ym, zm - d + 2.5], [xm, ym, zm - d + 2.5], shade(roof, 0.9));
  facing(p, [xa, h, zm + d + o], [xa, h, zm - d - o], [xm, ym, zm - d + 2.5], [xm, ym, zm + d - 2.5], shade(roof, 0.96), [-side, 1, 0]);
  facing(p, [xb, h, zm + d + o], [xb, h, zm - d - o], [xm, ym, zm - d + 2.5], [xm, ym, zm + d - 2.5], shade(roof, 0.84), [side, 1, 0]);
  // Doors and windows facing the line, and a clock.
  const fx = x0 - side * 0.03;
  for (let z = zm - d + 1.4; z < zm + d - 1; z += 2.4) {
    const door = Math.abs(z - zm) < 1.3;
    p.box(fx, PLAT_H + (door ? 0 : 0.9), z - 0.55, fx + side * 0.05, PLAT_H + 2.4, z + 0.55, door ? shade(roof, 0.75) : rgb('#7fb8e6'));
    p.box(fx - side * 0.02, PLAT_H + 2.4, z - 0.65, fx + side * 0.06, PLAT_H + 2.55, z + 0.65, rgb('#ffffff'));
  }
  p.with(M.chain(M.move(fx - side * 0.04, PLAT_H + 3.3, zm), M.rotZ(Math.PI / 2)), () => {
    p.column(12, 0, -0.04, 0, 0.42, 0.42, 0.08, rgb('#ffffff'), { top: rgb('#ffffff') });
    p.column(12, 0, -0.06, 0, 0.5, 0.5, 0.06, rgb('#3d4f6b'));
  });
}

// A gantry over all three tracks, carrying the wires.
function gantry(p, m, z) {
  const steel = rgb('#8790a0'), dark = rgb('#5c6474'), base = rgb('#c9c4ba');
  const top = WIRE + 1.25;
  for (const side of [-1, 1]) {
    const x = side * MAST;
    p.block(x, 0, z, 0.7, 0.45, 0.7, base);
    // A lattice mast: four corner posts and braces between them.
    for (const [dx, dz] of [[-0.17, -0.17], [0.17, -0.17], [0.17, 0.17], [-0.17, 0.17]]) p.box(x + dx - 0.04, 0.45, z + dz - 0.04, x + dx + 0.04, top, z + dz + 0.04, steel);
    for (let y = 0.45; y < top - 0.8; y += 1.1) {
      bar(p, [x - side * 0.17, y, z + 0.17], [x + side * 0.17, y + 1.1, z + 0.17], 0.025, dark);
      bar(p, [x - side * 0.17, y, z - 0.17], [x + side * 0.17, y + 1.1, z - 0.17], 0.025, dark);
      bar(p, [x - side * 0.17, y + 1.1, z - 0.17], [x - side * 0.17, y, z + 0.17], 0.025, dark);
    }
  }
  // The girder across: two chords with a zigzag between.
  p.box(-MAST - 0.25, top - 0.12, z - 0.2, MAST + 0.25, top + 0.06, z + 0.2, steel);
  p.box(-MAST, top - 0.95, z - 0.16, MAST, top - 0.82, z + 0.16, steel);
  const n = 10;
  for (let k = 0; k < n; k++) {
    const xa = -MAST + (2 * MAST * k) / n, xb = -MAST + (2 * MAST * (k + 1)) / n;
    bar(p, [xa, k % 2 ? top - 0.12 : top - 0.82, z], [xb, k % 2 ? top - 0.82 : top - 0.12, z], 0.035, dark);
  }
  // Insulators hanging down to each track's wire.
  for (const lane of [-1, 0, 1]) m.box(lane * LANE - 0.05, WIRE, z - 0.05, lane * LANE + 0.05, top - 0.82, z + 0.05, rgb('#c46a3a'));
}

// ---- a chunk of the world ----------------------------------------------------------------

function buildChunk(index) {
  const R = new Rand(9001 + index * 7919);
  const z1 = -index * CHUNK, z0 = z1 - CHUNK, zm = (z0 + z1) / 2;
  const look = lookAt(index * CHUNK + CHUNK / 2);
  const g = new Builder(), p = new Builder(), m = new Builder();
  const first = index === 0 || index === 1; // where the cub starts is kept clear, for the title
  const bridge = index > 3 && index % 7 === 5 && stretchOf(index).type !== 'station'; // a road bridge crosses here
  const st = stretchOf(index);
  // How high the cutting walls get in this chunk, and whether there's a platform.
  let cut = 0, plat = 0;
  for (let z = z1; z >= z0; z -= 2.5) {
    cut = Math.max(cut, wallAt(-z));
    plat = Math.max(plat, platAt(-z));
  }
  const busy = cut > 0.05 || plat > 0; // nothing low and small stands right beside the line here
  // Things standing beside the line go on the land, which may be up on a cutting's bank.
  const land = (x, z) => landAt(Math.abs(x), wallAt(-z));
  const on = (x, z, fn) => {
    const y = land(x, z);
    if (y > 0) p.with(M.move(0, y, 0), fn);
    else fn();
  };

  // Grass, and a patchwork of fields further out.
  g.quad([-90, 0, z1], [90, 0, z1], [90, 0, z0], [-90, 0, z0], look.grass);
  for (const side of [-1, 1]) {
    for (let k = 0; k < 2; k++) {
      const x0 = side * (9 + OUT + R.next() * 10), w = 10 + R.next() * 22, zz = z0 + R.next() * 6, d = 8 + R.next() * 12;
      const xa = Math.min(x0, x0 + side * w), xb = Math.max(x0, x0 + side * w);
      g.quad([xa, 0.012, Math.min(z1, zz + d)], [xb, 0.012, Math.min(z1, zz + d)], [xb, 0.012, zz], [xa, 0.012, zz], R.pick(look.field));
    }
    // Darker and lighter patches near the line.
    for (let k = 0; k < 5; k++) {
      const x = side * (4.2 + OUT + R.next() * 9), zz = z0 + R.next() * CHUNK, r = 0.8 + R.next() * 1.6;
      if (land(x, zz) > 0) continue;
      g.column(6, x, 0.016, zz, r, r, 0.001, k % 2 ? look.grass2 : mix(look.grass, [1, 1, 1], 0.1), { noBottom: true, sx: 1.4 });
    }
    // Flowers.
    for (let k = 0; k < 9; k++) {
      const x = side * (4 + OUT + R.next() * 8), zz = z0 + R.next() * CHUNK;
      const y = land(x, zz);
      g.block(x, y, zz, 0.16, 0.14, 0.16, R.pick(look.flower));
    }
  }

  // The track bed: dark ballast, a raised shoulder under each track,
  // chunky sleepers and bright rails.
  const bed = look.bed;
  g.quad([-WALL, 0.012, z1], [WALL, 0.012, z1], [WALL, 0.012, z0], [-WALL, 0.012, z0], shade(bed, 0.8));
  g.quad([-BED, 0.02, z1], [BED, 0.02, z1], [BED, 0.02, z0], [-BED, 0.02, z0], bed);
  for (const lane of [-1, 0, 1]) {
    const x = lane * LANE;
    g.quad([x - 1.5, 0.028, z1], [x + 1.5, 0.028, z1], [x + 1.5, 0.028, z0], [x - 1.5, 0.028, z0], shade(bed, 1.08));
  }
  // A scatter of stones, lighter and darker.
  for (let k = 0; k < 60; k++) {
    const x = (R.next() - 0.5) * (BED * 2 - 0.3), z = z0 + R.next() * CHUNK, r = 0.06 + R.next() * 0.1;
    g.quad([x - r, 0.032, z + r], [x + r, 0.032, z + r], [x + r, 0.032, z - r], [x - r, 0.032, z - r], shade(bed, k % 2 ? 0.88 : 1.16));
  }
  const sleeper = shade(mix(rgb('#4a3b36'), bed, 0.2), 0.95);
  for (const lane of [-1, 0, 1]) {
    const x = lane * LANE;
    for (let z = z1 - 0.5; z > z0; z -= 1) g.box(x - 1.15, 0.028, z - 0.17, x + 1.15, 0.085, z + 0.17, sleeper, { top: shade(sleeper, 1.18), noBottom: true });
    for (const sx of [-GAUGE, GAUGE]) {
      m.box(x + sx - 0.065, 0.085, z0, x + sx + 0.065, 0.13, z1, '#4d5361', { noBottom: true });
      m.box(x + sx - 0.04, 0.13, z0, x + sx + 0.04, 0.2, z1, '#6f7787', { top: '#c3cad6', noBottom: true });
    }
  }

  // Far hills and clouds (they don't cast shadows).
  for (const side of [-1, 1]) {
    if (R.next() < 0.7) {
      const x = side * (46 + R.next() * 30), r = 16 + R.next() * 14;
      g.ball(x, -2, zm + (R.next() - 0.5) * CHUNK, r * 1.3, 6 + R.next() * 9, r, look.hill, 8, 4, shade(look.hill, 0.9));
    }
    if (R.next() < 0.4) cloud(g, R, side * (30 + R.next() * 60), 34 + R.next() * 16, zm + (R.next() - 0.5) * CHUNK, 1 + R.next() * 0.9);
  }

  // Cuttings and stations.
  if (cut > 0.02) for (const side of [-1, 1]) cuttingSide(g, p, side, z1, z0, look);
  if (plat > 0) {
    for (const side of [-1, 1]) stationSide(p, side, z1, z0, look);
    if (st.type === 'station' && ((index % SEG) + SEG) % SEG === 1) stationHouse(p, R, index % 2 ? 1 : -1, z0, look);
  }

  // Overhead: gantries and their wires on an electrified stretch, or else
  // a telegraph pole each chunk with the wire running on to the next.
  if (st.wired) {
    if (index % 2 === 0) gantry(p, m, z1 - 1);
    for (const lane of [-1, 0, 1]) {
      m.box(lane * LANE - 0.025, WIRE - 0.03, z0, lane * LANE + 0.025, WIRE + 0.02, z1, '#2f3440');
      m.box(lane * LANE - 0.02, WIRE + 0.4, z0, lane * LANE + 0.02, WIRE + 0.44, z1, '#2f3440');
    }
  } else if (st.type !== 'station') {
    const px = -5.2 - OUT, ya = land(px, z1), yb = land(px, z0);
    p.box(px - 0.1, ya, z1 - 0.1, px + 0.1, ya + 6, z1 + 0.1, '#7a5a3c');
    p.box(px - 0.7, ya + 5.3, z1 - 0.06, px + 0.7, ya + 5.45, z1 + 0.06, '#7a5a3c');
    for (const x of [px - 0.6, px + 0.6]) bar(g, [x, ya + 5.5, z1], [x, yb + 5.5, z0], 0.018, rgb('#3a3f4a'));
  }

  // Things that go by close, and overhead: signals, and now and then a road bridge.
  if (!first && !plat && index % 3 === 1) signal(p, R, (index % 2 ? 1 : -1) * (BED + 0.75), zm + 3);
  if (bridge) roadBridge(p, zm, look);

  // A fence along one side or both, some of the time.
  for (const side of [-1, 1]) {
    if (!busy && R.next() < (look.kind === 'village' ? 0.8 : 0.45)) {
      const x = side * (4.5 + OUT), c = look.kind === 'village' ? rgb('#ffffff') : rgb('#b98146');
      for (let z = z1; z > z0 + 0.1; z -= 2.5) p.box(x - 0.07, 0, z - 0.07, x + 0.07, 0.95, z + 0.07, c);
      for (const y of [0.4, 0.75]) p.box(x - 0.03, y, z0, x + 0.03, y + 0.1, z1, c);
    }
  }

  // Trees, bushes and the odd building.
  const snowy = look.kind === 'snow';
  for (const side of [-1, 1]) {
    const trees = first ? 1 : look.kind === 'forest' ? 7 + R.int(4) : look.kind === 'snow' ? 5 + R.int(3) : 3 + R.int(4);
    for (let k = 0; k < trees; k++) {
      const x = side * (6.5 + OUT + R.next() * (look.kind === 'forest' ? 20 : 30)), z = z0 + R.next() * CHUNK, s = 1.15 + R.next() * 1.3;
      if (bridge && Math.abs(z - zm) < 5) continue; // (not in the road)
      if (plat > 0 && Math.abs(x) < PLAT + PLAT_W + 7) continue; // (nor on the platform)
      on(x, z, () => {
        if (snowy || (look.kind === 'forest' && R.next() < 0.3)) pine(p, R, x, z, s, look, snowy);
        else tree(p, R, x, z, s, look);
      });
    }
    for (let k = 0; k < 3; k++) {
      const x = side * (5.2 + OUT + R.next() * 4), z = z0 + R.next() * CHUNK, s = 0.7 + R.next() * 0.7;
      if (R.next() < 0.7 && !plat) on(x, z, () => bush(p, R, x, z, s, look));
    }
    if (R.next() < 0.3 && !plat) {
      const x = side * (5 + OUT + R.next() * 6), z = z0 + R.next() * CHUNK, s = 0.6 + R.next() * 0.8;
      on(x, z, () => rock(p, R, x, z, s));
    }
    if (first || bridge || busy) continue;
    const roll = R.next();
    const x = side * (12 + OUT + R.next() * 6);
    if (look.kind === 'village') {
      if (roll < 0.55) house(p, R, x, zm, look, side < 0 ? Math.PI / 2 : -Math.PI / 2);
      if (R.next() < 0.5) lamp(p, side * (4.9 + OUT), zm + 5);
    } else if (look.kind === 'meadow') {
      if (roll < 0.1) windmill(p, R, side * (15 + OUT + R.next() * 8), zm, look);
      else if (roll < 0.22) house(p, R, x, zm, look, side < 0 ? Math.PI / 2 : -Math.PI / 2);
      else if (roll < 0.4) for (let k = 0; k < 3; k++) roundBale(p, R, side * (7 + OUT + R.next() * 8), z0 + R.next() * CHUNK);
      else if (roll < 0.52) haystack(p, R, x, zm);
      else if (roll < 0.7) for (let k = 0; k < 12; k++) sunflower(p, R, side * (5.6 + OUT + (k % 4) * 0.8 + R.next() * 0.3), zm - 3 + Math.floor(k / 4) * 1.2 + R.next() * 0.3);
    } else if (look.kind === 'forest') {
      if (roll < 0.12) house(p, R, x + side * 4, zm, look, side < 0 ? Math.PI / 2 : -Math.PI / 2);
      else if (roll < 0.3) for (let k = 0; k < 3; k++) rock(p, R, side * (6 + OUT + R.next() * 8), z0 + R.next() * CHUNK, 0.8 + R.next());
    } else if (snowy) {
      if (roll < 0.2) house(p, R, x, zm, look, side < 0 ? Math.PI / 2 : -Math.PI / 2);
      else if (roll < 0.38) snowman(p, R, side * (5.6 + OUT + R.next() * 2), zm + R.next() * 4);
    }
  }
  return { index, ground: g, props: p, metal: m };
}

export class World {
  constructor(R) {
    this.R = R;
    this.chunks = new Map();
  }

  // Makes sure the chunks from a little behind s to `ahead` beyond it exist,
  // and drops the ones left behind. At most `budget` are built per call, so
  // a frame never stalls.
  update(s, ahead = 150, behind = 14, budget = 2) {
    const from = Math.floor((s - behind) / CHUNK), to = Math.floor((s + ahead) / CHUNK);
    for (let i = from; i <= to && budget > 0; i++) {
      if (this.chunks.has(i)) continue;
      const c = buildChunk(i);
      this.chunks.set(i, { ground: this.R.mesh(c.ground), props: this.R.mesh(c.props), metal: this.R.mesh(c.metal) });
      budget--;
    }
    for (const [i, c] of this.chunks) {
      if (i >= from && i <= to) continue;
      this.free(c);
      this.chunks.delete(i);
    }
  }

  free(c) {
    this.R.free(c.ground);
    this.R.free(c.props);
    this.R.free(c.metal);
  }

  clear() {
    for (const c of this.chunks.values()) this.free(c);
    this.chunks.clear();
  }

  drawGround() { for (const c of this.chunks.values()) this.R.draw(c.ground); }
  drawProps() { for (const c of this.chunks.values()) this.R.draw(c.props, undefined, PROPS); }
  drawMetal() { for (const c of this.chunks.values()) this.R.draw(c.metal, undefined, METAL); }
  shadowProps() { for (const c of this.chunks.values()) this.R.shadow(c.props); }
}
const PROPS = { rim: 0.22 }, METAL = { shine: 0.9, rim: 0.15 };

