// Haywire: the map, Foundry Yard, laid out by hand. The yard is 88 m by
// 64 m. The west half is built here and the east half is the same thing
// turned half a turn about the middle, so neither team has the better end.
//
//   north:  the warehouse (two floors, windows over the yard)  ...  pump house, workshop
//   middle: the open yard: containers, a truck, a trench, and the gantry
//           crossing overhead from one warehouse to the other
//   south:  workshop (stairs up to its roof), pump house       ...  the other warehouse
//
// Blue starts behind the wall along the west edge, orange along the east.

import { World } from './world.js';

export const W = 88, H = 64;

// What things are made of: a colour, and the pattern the renderer draws on it.
// Patterns: 0 plain, 1 paving, 2 ribbed metal, 3 panels, 4 planks, 5 hazard
// stripes, 6 tiles, 7 tread plate, 8 brick.
export const MATS = [
  { name: 'asphalt', c: '#4b4f58', p: 1 },
  { name: 'concrete', c: '#9a9c9f', p: 3 },
  { name: 'warehouse', c: '#5f8a8f', p: 2 },
  { name: 'workshop', c: '#c9a37a', p: 8 },
  { name: 'roof', c: '#3c4049', p: 3 },
  { name: 'floor', c: '#a8a39a', p: 6 },
  { name: 'crate', c: '#b98a4e', p: 4 },
  { name: 'red', c: '#c2463c', p: 2 },
  { name: 'blue', c: '#3f6fb5', p: 2 },
  { name: 'green', c: '#4f9a62', p: 2 },
  { name: 'yellow', c: '#d9a92e', p: 2 },
  { name: 'steel', c: '#c2942c', p: 7 },
  { name: 'hazard', c: '#e0b21c', p: 5 },
  { name: 'barrier', c: '#b9b6ae', p: 0 },
  { name: 'wall', c: '#6c7078', p: 3 },
  { name: 'skyline', c: '#7c8794', p: 3 },
  { name: 'trimBlue', c: '#2f7df0', p: 0 },
  { name: 'trimOrange', c: '#f07a1f', p: 0 },
  { name: 'machine', c: '#4a5560', p: 3 },
  { name: 'trench', c: '#6f7376', p: 3 },
  { name: 'slab', c: '#8d9094', p: 6 },
  { name: 'white', c: '#d9dde0', p: 2 },
  { name: 'pump', c: '#8b7fa8', p: 8 },
  { name: 'pillar', c: '#8a6f2a', p: 0 },
];
const M = Object.fromEntries(MATS.map((m, i) => [m.name, i]));

export function buildMap() {
  const w = new World(W, H);
  const spawns = [[], []], spots = [], perches = [], lamps = [];

  // side 0 builds as written (the west half); side 1 builds the same thing
  // turned half a turn (the east half).
  const half = (side) => {
    const fill = (x0, z0, x1, z1, y0, y1, mat) => (side ? w.fill(W - x1, H - z1, W - x0, H - z0, y0, y1, mat) : w.fill(x0, z0, x1, z1, y0, y1, mat));
    const carve = (x0, z0, x1, z1, y0, y1) => (side ? w.carve(W - x1, H - z1, W - x0, H - z0, y0, y1) : w.carve(x0, z0, x1, z1, y0, y1));
    const X = (x) => (side ? W - x : x), Z = (z) => (side ? H - z : z);
    const YAW = (a) => (side ? a + Math.PI : a);
    const team = side ? M.trimOrange : M.trimBlue;
    const lamp = (x, y, z, r, g, b, reach = 9) => lamps.push({ x: X(x), y, z: Z(z), r, g, b, reach });
    const warm = (x, y, z, k = 1) => lamp(x, y, z, 1.0 * k, 0.82 * k, 0.58 * k);
    const spot = (x, y, z, name) => spots.push({ x: X(x), y, z: Z(z), name, side });
    const perch = (x, y, z, yaw) => perches.push({ x: X(x), y, z: Z(z), yaw: YAW(yaw), side });
    // Yaw 0 looks north (towards smaller z); a quarter turn right looks east.
    const N = 0, E = Math.PI / 2, S = Math.PI, WEST = -Math.PI / 2;

    // ---- the base: a strip behind a wall with three gates -----------------------------
    fill(15, 3, 16, 61, 0, 4, M.wall);
    fill(15, 3, 16, 61, 4, 4.3, team);
    carve(15, 8, 16, 12, 0, 3.2); // north gate
    carve(15, 29, 16, 35, 0, 3.2); // middle gate
    carve(15, 44, 16, 48, 0, 3.2); // south gate
    // A canopy on pillars, and things to stand behind.
    fill(4, 26, 12, 38, 4, 4.3, M.roof);
    for (const [x, z] of [[4, 26], [11, 26], [4, 37], [11, 37]]) fill(x, z, x + 1, z + 1, 0, 4, M.pillar);
    fill(6, 30, 9, 34, 0, 1, M.crate);
    fill(7, 31, 8, 33, 1, 2, M.crate);
    fill(10, 16, 13, 18, 0, 1.2, team);
    fill(10, 46, 13, 48, 0, 1.2, team);
    fill(3, 18, 5, 24, 0, 2.6, side ? M.red : M.blue);
    fill(3, 40, 5, 46, 0, 2.6, M.white);
    fill(8, 5, 12, 7, 0, 1, M.barrier);
    fill(8, 57, 12, 59, 0, 1, M.barrier);
    lamp(8, 3.8, 32, side ? 1.0 : 0.3, 0.55, side ? 0.2 : 1.0, 11);
    for (const [x, z] of [[6, 10], [9, 21], [6, 28], [10, 36], [6, 43], [9, 53], [12, 24], [12, 40]]) {
      spawns[side].push({ x: X(x + 0.5), z: Z(z + 0.5), yaw: YAW(E) });
    }

    // ---- the warehouse: two floors against the north wall ------------------------------
    fill(20, 3, 43, 20, 0, 7.6, M.warehouse);
    carve(21, 3, 42, 19, 0, 7.2);
    fill(21, 3, 42, 19, 7.2, 7.6, M.roof);
    fill(20, 3, 43, 20, 7.6, 7.9, M.roof);
    fill(21, 3, 42, 19, -0.02, 0, M.floor);
    fill(21, 3, 42, 19, 3.6, 4, M.slab);
    carve(27, 8, 36, 15, 3.6, 4); // open in the middle, looking down
    // Stairs up, at each end.
    carve(21, 10, 23, 18, 3.6, 4);
    for (let k = 0; k < 8; k++) fill(21, 17 - k, 23, 18 - k, 0, 0.5 * (k + 1), M.steel);
    carve(40, 4, 42, 12, 3.6, 4);
    for (let k = 0; k < 8; k++) fill(40, 4 + k, 42, 5 + k, 0, 0.5 * (k + 1), M.steel);
    // Doors: west, two south onto the yard, and the big one east.
    carve(20, 11, 21, 13, 0, 2.4);
    carve(25, 19, 27, 20, 0, 2.4);
    carve(36, 19, 38, 20, 0, 2.4);
    carve(42, 13, 43, 17, 0, 3);
    // Upstairs: windows over the yard and the gate, and a door onto the gantry.
    for (const x of [23, 29, 33, 39]) carve(x, 19, x + 2, 20, 5, 6.3);
    carve(20, 6, 21, 8, 5, 6.3);
    carve(42, 14, 43, 16, 4, 6.4);
    // Things in the way.
    fill(24, 6, 26, 8, 0, 1, M.crate);
    fill(25, 6, 26, 7, 1, 2, M.crate);
    fill(30, 3, 34, 5, 0, 2.2, M.machine);
    fill(29, 16, 31, 18, 0, 1, M.crate);
    fill(36, 9, 38, 11, 0, 1, M.crate);
    fill(31, 11, 33, 13, 0, 1.5, M.machine);
    fill(30, 11, 31, 12, 0, 1, M.crate);
    fill(24, 4, 25, 6, 4, 5, M.crate);
    fill(37, 16, 39, 18, 4, 5, M.crate);
    fill(31, 15, 33, 16, 4, 5, M.barrier);
    for (const [x, z] of [[25, 6], [31, 8], [37, 6], [25, 15], [37, 15], [31, 17]]) warm(x, 3.4, z);
    for (const [x, z] of [[24, 6], [38, 7], [24, 16], [38, 16], [31, 5]]) warm(x, 7, z, 0.8);
    spot(31.5, 0, 9.5, 'warehouse');
    spot(26.5, 4, 17.5, 'upstairs');
    spot(38.5, 4, 13.5, 'upstairs');
    spot(17.5, 0, 14.5, 'north lane');
    for (const x of [23.5, 29.5, 33.5, 39.5]) perch(x + 0.5, 4, 18.5, S);
    perch(21.5, 4, 7, WEST);

    // ---- the gantry: a walkway overhead, from one warehouse to the other ---------------
    fill(43, 14, 45, 32, 3.6, 4, M.steel);
    fill(43, 21, 44, 22, 0, 3.6, M.pillar);
    fill(44, 26, 45, 27, 0, 3.6, M.pillar);
    fill(43, 19, 44, 20, 4, 5, M.crate);
    // The platform in the middle, and the stairs down from it.
    fill(41, 29, 44, 35, 3.6, 4, M.hazard);
    fill(41, 29, 42, 30, 0, 3.6, M.pillar);
    fill(41, 34, 42, 35, 0, 3.6, M.pillar);
    for (let k = 0; k < 7; k++) fill(40 - k, 29, 41 - k, 31, 0, 3.5 - 0.5 * k, M.steel);
    fill(43, 31, 44, 33, 4, 5, M.crate);
    spot(43.5, 4, 30.5, 'gantry');
    spot(43.5, 4, 22.5, 'gantry');
    perch(43.5, 4, 17.5, S);

    // ---- the trench through the middle of the yard --------------------------------------
    carve(28, 31, 44, 33, -1.6, 0);
    fill(28, 31, 44, 33, -1.7, -1.6, M.trench);
    for (let k = 0; k < 3; k++) {
      carve(27 - k, 31, 28 - k, 33, -1.2 + 0.4 * k, 0);
      fill(27 - k, 31, 28 - k, 33, -1.3 + 0.4 * k, -1.2 + 0.4 * k, M.trench);
    }
    fill(37, 32, 38, 33, -1.6, -0.6, M.crate); // a way to hop out half way along
    spot(35.5, -1.6, 31.5, 'trench');

    // ---- the yard -------------------------------------------------------------------------
    fill(19, 29, 21, 35, 0, 2.6, side ? M.yellow : M.green); // in front of the middle gate
    fill(24, 22, 26, 28, 0, 2.6, M.red);
    fill(26, 24, 27, 25, 0, 1, M.crate); // and a way up onto it
    fill(26, 25, 27, 26, 0, 2, M.crate);
    fill(23, 37, 25, 43, 0, 2.6, M.blue);
    fill(23, 37, 25, 43, 2.6, 5.2, M.white);
    fill(30, 22, 33, 28, 0, 3, M.white); // the truck
    fill(30, 20, 33, 22, 0, 2.3, M.red);
    fill(27, 37, 32, 38, 0, 1, M.barrier);
    fill(34, 38, 40, 40, 0, 2.6, M.green);
    fill(36, 23, 39, 24, 0, 1, M.barrier);
    fill(35, 26, 37, 28, 0, 1, M.crate);
    fill(35, 34, 36, 36, 0, 1, M.crate);
    fill(29, 41, 31, 43, 0, 1, M.crate);
    fill(30, 42, 31, 43, 1, 2, M.crate);
    fill(17, 23, 19, 25, 0, 1, M.barrier);
    fill(17, 39, 19, 41, 0, 1, M.barrier);
    spot(27.5, 0, 28.5, 'yard');
    spot(34.5, 0, 25.5, 'yard');
    spot(33.5, 0, 41.5, 'yard');
    spot(21.5, 0, 26.5, 'yard');

    // ---- the workshop, with stairs up to its roof -----------------------------------------
    fill(19, 47, 31, 61, 0, 3.8, M.workshop);
    carve(20, 48, 30, 61, 0, 3.4);
    fill(20, 48, 30, 61, 3.4, 3.8, M.roof);
    fill(20, 48, 30, 61, -0.02, 0, M.floor);
    carve(23, 47, 25, 48, 0, 2.4); // doors: north, east and west
    carve(30, 52, 31, 54, 0, 2.4);
    carve(19, 50, 20, 52, 0, 2.4);
    carve(21, 47, 22, 48, 1, 2.2); // windows
    carve(27, 47, 28, 48, 1, 2.2);
    carve(30, 57, 31, 58, 1, 2.2);
    fill(20, 54, 21, 59, 0, 1, M.machine);
    fill(26, 58, 29, 61, 0, 2.2, M.machine);
    fill(25, 50, 26, 51, 0, 1, M.crate);
    for (let k = 0; k < 8; k++) fill(17, 60 - k, 19, 61 - k, 0, 0.475 * (k + 1), M.steel);
    // A low wall round the roof, with a gap where the stairs come up.
    fill(19, 47, 31, 48, 3.8, 4.8, M.workshop);
    fill(30, 48, 31, 61, 3.8, 4.8, M.workshop);
    fill(19, 55, 20, 61, 3.8, 4.8, M.workshop);
    fill(19, 48, 20, 52, 3.8, 4.8, M.workshop);
    fill(24, 52, 26, 54, 3.8, 4.8, M.machine);
    warm(25, 3.2, 51);
    warm(24, 3.2, 57);
    spot(24.5, 0, 53.5, 'workshop');
    spot(22.5, 3.8, 50.5, 'roof');
    spot(32.5, 0, 55.5, 'alley');
    perch(22.5, 3.8, 48.6, N);
    perch(27.5, 3.8, 48.6, N);

    // ---- the pump house -------------------------------------------------------------------
    fill(34, 49, 42, 58, 0, 3.6, M.pump);
    carve(35, 50, 41, 57, 0, 3.2);
    fill(35, 50, 41, 57, 3.2, 3.6, M.roof);
    fill(35, 50, 41, 57, -0.02, 0, M.floor);
    carve(34, 53, 35, 55, 0, 2.4);
    carve(37, 49, 39, 50, 0, 2.4);
    carve(41, 52, 42, 54, 0, 2.4);
    carve(40, 49, 41, 50, 1, 2.2);
    fill(35, 50, 36, 52, 0, 1.4, M.machine);
    fill(39, 55, 41, 57, 0, 1, M.crate);
    warm(38, 3, 53.5, 0.9);
    spot(38.5, 0, 53.5, 'pump house');
    fill(36, 44, 40, 47, 0, 4, M.machine); // a transformer between it and the yard
    fill(36, 44, 40, 47, 4, 4.2, M.hazard);
    spot(38.5, 0, 59.5, 'back alley');
    spot(17.5, 0, 46.5, 'south lane');
  };

  // The ground, and a wall of far-off buildings round the edge.
  w.fill(0, 0, W, H, -3, 0, M.asphalt);
  let seed = 7;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  const rim = (x0, z0, x1, z1) => w.fill(x0, z0, x1, z1, 0, 9 + Math.floor(rnd() * 4) * 2, M.skyline);
  for (let x = 0; x < W; x += 8) { rim(x, 0, x + 8, 3); rim(x, H - 3, x + 8, H); }
  for (let z = 0; z < H; z += 8) { rim(0, z, 3, z + 8); rim(W - 3, z, W, z + 8); }
  // Paving where the buildings and bases stand.
  w.fill(3, 3, 15, 61, -0.02, 0, M.concrete);
  w.fill(W - 15, 3, W - 3, 61, -0.02, 0, M.concrete);
  half(0);
  half(1);
  w.freeze();

  // The yard has three ways across: by the north side, through the middle
  // and by the south. A robot keeping to one of them counts every step
  // outside it as longer than it is (the bases at each end are free).
  const laneCost = [[0, 21], [21, 43], [43, 64]].map(([z0, z1]) => {
    const cost = new Float32Array(w.nodeY.length);
    for (let n = 0; n < cost.length; n++) {
      const x = w.nodeX(n), z = w.nodeZ(n);
      if (x > 16 && x < W - 16 && (z < z0 || z >= z1)) cost[n] = 1.3;
    }
    return cost;
  });

  // For the attack-and-defend game: three sectors of two objectives each,
  // from the west end to the east, and where the attackers come in while
  // they fight for the second and third (for the first, their base). The
  // defenders' places are the same ones turned round; and if it is orange
  // that attacks, all of it is turned round.
  const advance = {
    sectors: [
      [{ name: 'A', what: 'the warehouse', x: 31.5, y: 0, z: 9.5 }, { name: 'B', what: 'the workshop', x: 24.5, y: 0, z: 53.5 }],
      [{ name: 'A', what: 'the north crossing', x: 44.5, y: 0, z: 23.5 }, { name: 'B', what: 'the south crossing', x: 43.5, y: 0, z: 40.5 }],
      [{ name: 'A', what: 'the workshop', x: 63.5, y: 0, z: 10.5 }, { name: 'B', what: 'the warehouse', x: 56.5, y: 0, z: 54.5 }],
    ],
    spawns: [
      spawns[0].map((p) => [p.x, p.z]),
      [[22.5, 26.5], [21.5, 38.5], [17.5, 14.5], [17.5, 46.5], [27.5, 20.5], [28.5, 44.5], [18.5, 31.5], [32.5, 29.5]],
      [[36.5, 25.5], [34.5, 41.5], [40.5, 36.5], [38.5, 21.5], [40.5, 16.5], [33.5, 45.5], [41.5, 45.5], [28.5, 34.5]],
    ],
  };

  return { world: w, W, H, spawns, spots, perches, lamps, laneCost, advance, name: 'Foundry Yard', sun: norm([-0.42, 0.74, 0.52]) };
}

function norm(v) {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}
