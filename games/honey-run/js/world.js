// Honey Run: the countryside the line runs through. It is built in chunks
// a little way ahead of the cub and thrown away behind: the ground (grass,
// fields, the track bed, far hills, clouds) and the things standing on it
// (trees, houses, fences, poles), which cast shadows.
//
// Every 520 metres the season changes: meadow, blossom, autumn, sunset,
// snow, and round again. The colours of the land, the sky and the light
// all drift from one to the next.

import { Builder, M, rgb, mix, shade } from './gl.js';
import { Rand, LANE } from './engine.js';
import { GAUGE } from './models.js';

export const CHUNK = 20;
const BED = LANE + 2.35; // half the width of the track bed
const OUT = BED - 3.75; // how much further out everything beside the line stands than it first did
const ZONE = 520, BLEND = 90;
const TAU = Math.PI * 2;

const hex = (list) => list.map(rgb);
const ZONES = [
  {
    name: 'Meadow',
    top: '#2a7fe6', fog: '#cdeeff', sunCol: [0.66, 0.62, 0.52], skyLight: [0.6, 0.66, 0.78], groundLight: [0.4, 0.42, 0.34], sun: [-0.42, 0.74, -0.52], glow: [1, 0.95, 0.8],
    grass: '#7ed058', grass2: '#70c44c', bed: '#b9ae9b', hill: '#62b85c', field: ['#9bdc6a', '#f2d660', '#86cf5e', '#cbe36a'],
    leaf: ['#3fa64a', '#58bb4e', '#2f8f48', '#6cc75a'], trunk: '#8a5a33', flower: ['#ffd23f', '#ff7fb0', '#ffffff'],
    wall: ['#fff3dc', '#ffe0b8', '#f6f1e6'], roof: ['#e5533b', '#c8452f', '#3b6fd6'], kind: 'meadow',
  },
  {
    name: 'Blossom',
    top: '#4a97f2', fog: '#e9f4ff', sunCol: [0.62, 0.6, 0.56], skyLight: [0.64, 0.66, 0.78], groundLight: [0.42, 0.4, 0.38], sun: [-0.5, 0.72, -0.46], glow: [1, 0.96, 0.9],
    grass: '#8fd66c', grass2: '#82cb60', bed: '#bdb2a2', hill: '#7cc674', field: ['#a5e07a', '#ffc7dd', '#8fd66c', '#ffe08a'],
    leaf: ['#ffb3d1', '#ff9cc4', '#ffd0e2', '#f78fb8'], trunk: '#7a4f36', flower: ['#ff7fb0', '#ffffff', '#c58bff'],
    wall: ['#fff8ee', '#ffe9ef', '#eef6ff'], roof: ['#3b6fd6', '#e5533b', '#8a5fd6'], kind: 'village',
  },
  {
    name: 'Autumn',
    top: '#4f86d2', fog: '#ffe9c8', sunCol: [0.7, 0.58, 0.42], skyLight: [0.62, 0.6, 0.62], groundLight: [0.44, 0.38, 0.28], sun: [-0.56, 0.6, -0.56], glow: [1, 0.85, 0.6],
    grass: '#b9b24c', grass2: '#aaa341', bed: '#b3a48d', hill: '#c78f3e', field: ['#d9b44a', '#c96a2a', '#b9b24c', '#e0903a'],
    leaf: ['#e8792a', '#d9452b', '#f2b632', '#c9611e'], trunk: '#6b4226', flower: ['#f2b632', '#e8792a', '#d9452b'],
    wall: ['#f6e6c8', '#e8d2a8', '#fff3dc'], roof: ['#8a4a2f', '#6b3a26', '#a8452f'], kind: 'forest',
  },
  {
    name: 'Sunset',
    top: '#3b3a94', fog: '#ffb07a', sunCol: [0.9, 0.5, 0.26], skyLight: [0.7, 0.58, 0.72], groundLight: [0.6, 0.44, 0.4], sun: [-0.5, 0.3, -0.81], glow: [1, 0.6, 0.3],
    grass: '#c7a84c', grass2: '#b89a42', bed: '#b09886', hill: '#8a5f78', field: ['#e0bd55', '#d6a640', '#c7a84c', '#b98a3a'],
    leaf: ['#7d8a3c', '#96833a', '#6a7d3a', '#a8903e'], trunk: '#5c3a26', flower: ['#ffd23f', '#ff9f43', '#ffffff'],
    wall: ['#ffe0b8', '#f6d2a8', '#ffe9c8'], roof: ['#a8452f', '#8a3a2a', '#6b3a4a'], kind: 'meadow',
  },
  {
    name: 'Snow',
    top: '#4d86d0', fog: '#eef6ff', sunCol: [0.56, 0.58, 0.62], skyLight: [0.7, 0.74, 0.84], groundLight: [0.5, 0.52, 0.58], sun: [-0.4, 0.66, -0.6], glow: [0.95, 0.97, 1],
    grass: '#f4f9ff', grass2: '#e4eefb', bed: '#cfd6e2', hill: '#dce8f8', field: ['#ffffff', '#e4eefb', '#f4f9ff', '#d8e6f8'],
    leaf: ['#2f7a5f', '#3b8a6a', '#286a55', '#34806a'], trunk: '#5c4032', flower: ['#ffffff', '#bfe0ff', '#ffffff'],
    wall: ['#a8643a', '#8f5530', '#b97a48'], roof: ['#ffffff', '#f4f9ff', '#ffffff'], kind: 'snow',
  },
].map((z) => ({
  ...z, top: rgb(z.top), fog: rgb(z.fog), grass: rgb(z.grass), grass2: rgb(z.grass2), bed: rgb(z.bed), hill: rgb(z.hill), trunk: rgb(z.trunk),
  field: hex(z.field), leaf: hex(z.leaf), flower: hex(z.flower), wall: hex(z.wall), roof: hex(z.roof),
}));

const BLENDED = ['top', 'fog', 'sunCol', 'skyLight', 'groundLight', 'sun', 'glow', 'grass', 'grass2', 'bed', 'hill', 'trunk'];
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

function cloud(b, R, x, y, z, s) {
  const n = 3 + R.int(3);
  for (let k = 0; k < n; k++) {
    const r = (2.2 + R.next() * 2.4) * s;
    // (Brighter than white, so their undersides stay pale rather than grey.)
    b.ball(x + (k - n / 2) * 2.8 * s, y + R.next() * 1.2 * s, z + (R.next() - 0.5) * 3 * s, r * 1.3, r * 0.75, r, [1.5, 1.5, 1.5], 7, 4, [1.75, 1.8, 1.95]);
  }
}

// ---- a chunk of the world ----------------------------------------------------------------

function buildChunk(index) {
  const R = new Rand(9001 + index * 7919);
  const z1 = -index * CHUNK, z0 = z1 - CHUNK, zm = (z0 + z1) / 2;
  const look = lookAt(index * CHUNK + CHUNK / 2);
  const g = new Builder(), p = new Builder();
  const first = index === 0 || index === 1; // where the cub starts is kept clear, for the title

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
      g.column(6, x, 0.016, zz, r, r, 0.001, k % 2 ? look.grass2 : mix(look.grass, [1, 1, 1], 0.1), { noBottom: true, sx: 1.4 });
    }
    // Flowers.
    for (let k = 0; k < 9; k++) {
      const x = side * (4 + OUT + R.next() * 8), zz = z0 + R.next() * CHUNK;
      g.block(x, 0, zz, 0.16, 0.14, 0.16, R.pick(look.flower));
    }
  }

  // The track bed, sleepers and rails.
  g.quad([-BED - 0.35, 0.015, z1], [BED + 0.35, 0.015, z1], [BED + 0.35, 0.015, z0], [-BED - 0.35, 0.015, z0], shade(look.bed, 0.9));
  g.quad([-BED, 0.02, z1], [BED, 0.02, z1], [BED, 0.02, z0], [-BED, 0.02, z0], look.bed);
  // Stones in the bed, lighter and darker.
  for (let k = 0; k < 100; k++) {
    const x = (R.next() - 0.5) * (BED * 2 - 0.3), z = z0 + R.next() * CHUNK, r = 0.06 + R.next() * 0.12;
    g.quad([x - r, 0.026, z + r], [x + r, 0.026, z + r], [x + r, 0.026, z - r], [x - r, 0.026, z - r], shade(look.bed, k % 2 ? 0.86 : 1.1));
  }
  // A strip of grass and weeds between the tracks.
  for (const x of [-LANE / 2, LANE / 2]) g.quad([x - 0.22, 0.03, z1], [x + 0.22, 0.03, z1], [x + 0.22, 0.03, z0], [x - 0.22, 0.03, z0], mix(look.bed, look.grass2, 0.45));
  const sleeper = shade(mix(rgb('#7a5a3c'), look.bed, 0.25), 0.9);
  for (const lane of [-1, 0, 1]) {
    const x = lane * LANE;
    for (let z = z1 - 0.5; z > z0; z -= 1) g.quad([x - 1.12, 0.04, z + 0.17], [x + 1.12, 0.04, z + 0.17], [x + 1.12, 0.04, z - 0.17], [x - 1.12, 0.04, z - 0.17], sleeper);
    for (const sx of [-GAUGE, GAUGE]) g.box(x + sx - 0.05, 0.04, z0, x + sx + 0.05, 0.12, z1, '#7f8794', { top: '#d5dbe6', noBottom: true });
  }

  // Far hills and clouds (they don't cast shadows).
  for (const side of [-1, 1]) {
    if (R.next() < 0.7) {
      const x = side * (46 + R.next() * 30), r = 16 + R.next() * 14;
      g.ball(x, -2, zm + (R.next() - 0.5) * CHUNK, r * 1.3, 6 + R.next() * 9, r, look.hill, 8, 4, shade(look.hill, 0.9));
    }
    if (R.next() < 0.4) cloud(g, R, side * (30 + R.next() * 60), 34 + R.next() * 16, zm + (R.next() - 0.5) * CHUNK, 1 + R.next() * 0.9);
  }

  // A telegraph pole each chunk, with the wire running on to the next.
  const px = -5.2 - OUT;
  p.box(px - 0.1, 0, z1 - 0.1, px + 0.1, 6, z1 + 0.1, '#7a5a3c');
  p.box(px - 0.7, 5.3, z1 - 0.06, px + 0.7, 5.45, z1 + 0.06, '#7a5a3c');
  for (const x of [px - 0.6, px + 0.6]) g.box(x - 0.015, 5.5, z0, x + 0.015, 5.53, z1, '#3a3f4a');

  // A fence along one side or both, some of the time.
  for (const side of [-1, 1]) {
    if (R.next() < (look.kind === 'village' ? 0.8 : 0.45)) {
      const x = side * (4.5 + OUT), c = look.kind === 'village' ? rgb('#ffffff') : rgb('#b98146');
      for (let z = z1; z > z0 + 0.1; z -= 2.5) p.box(x - 0.07, 0, z - 0.07, x + 0.07, 0.95, z + 0.07, c);
      for (const y of [0.4, 0.75]) p.box(x - 0.03, y, z0, x + 0.03, y + 0.1, z1, c);
    }
  }

  // Trees, bushes and the odd building.
  const snowy = look.kind === 'snow';
  for (const side of [-1, 1]) {
    const trees = first ? 1 : look.kind === 'forest' ? 6 + R.int(4) : look.kind === 'snow' ? 4 + R.int(3) : 2 + R.int(3);
    for (let k = 0; k < trees; k++) {
      const x = side * (6.5 + OUT + R.next() * (look.kind === 'forest' ? 20 : 30)), z = z0 + R.next() * CHUNK, s = 1.15 + R.next() * 1.3;
      if (snowy || (look.kind === 'forest' && R.next() < 0.3)) pine(p, R, x, z, s, look, snowy);
      else tree(p, R, x, z, s, look);
    }
    for (let k = 0; k < 3; k++) if (R.next() < 0.7) bush(p, R, side * (5.2 + OUT + R.next() * 4), z0 + R.next() * CHUNK, 0.7 + R.next() * 0.7, look);
    if (R.next() < 0.3) rock(p, R, side * (5 + OUT + R.next() * 6), z0 + R.next() * CHUNK, 0.6 + R.next() * 0.8);
    if (first) continue;
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
  return { index, ground: g, props: p };
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
      this.chunks.set(i, { ground: this.R.mesh(c.ground), props: this.R.mesh(c.props) });
      budget--;
    }
    for (const [i, c] of this.chunks) {
      if (i >= from && i <= to) continue;
      this.R.free(c.ground);
      this.R.free(c.props);
      this.chunks.delete(i);
    }
  }

  clear() {
    for (const c of this.chunks.values()) {
      this.R.free(c.ground);
      this.R.free(c.props);
    }
    this.chunks.clear();
  }

  drawGround() { for (const c of this.chunks.values()) this.R.draw(c.ground); }
  drawProps() { for (const c of this.chunks.values()) this.R.draw(c.props); }
  shadowProps() { for (const c of this.chunks.values()) this.R.shadow(c.props); }
}
