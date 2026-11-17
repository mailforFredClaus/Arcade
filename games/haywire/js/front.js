// Haywire: the Iron Front, the map for Advance. It is 600 m long and 136 m
// wide: the attackers' camp at the west end, then four sectors, each about
// the size of a whole deathmatch map, that the attack must take one after
// another. The fight moves east as each one falls.
//
//   camp | 1 the Rail Yard | 2 Ashby, a village | 3 No Man's Land | 4 the Citadel
//
// The sectors run into one another, with no walls between: a road crosses
// the yard at each boundary, kept clear, and that is where the two sides
// come in while that sector is being fought for.

import { World } from './world.js';
import { MATS } from './map.js';

export const FW = 600, FH = 136;
const M = Object.fromEntries(MATS.map((m, i) => [m.name, i]));

export function buildFront() {
  const w = new World(FW, FH), lamps = [];
  let seed = 23;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  const F = (x0, z0, x1, z1, y0, y1, mat) => w.fill(x0, z0, x1, z1, y0, y1, M[mat]);
  const C = (x0, z0, x1, z1, y0, y1) => w.carve(x0, z0, x1, z1, y0, y1);
  const lamp = (x, y, z, r = 1, g = 0.82, b = 0.58, reach = 9) => lamps.push({ x, y, z, r, g, b, reach });

  // ---- building blocks ------------------------------------------------------------------

  // A run of steps half a metre each, one metre deep, wide across; dir is
  // which way it climbs: 'x+', 'x-', 'z+', 'z-'.
  const stairs = (x, z, dir, n, wide = 2, base = 0, mat = 'timber') => {
    for (let k = 0; k < n; k++) {
      const top = base + 0.5 * (k + 1);
      if (dir === 'x+') F(x + k, z, x + k + 1, z + wide, base, top, mat);
      else if (dir === 'x-') F(x - k - 1, z, x - k, z + wide, base, top, mat);
      else if (dir === 'z+') F(x, z + k, x + wide, z + k + 1, base, top, mat);
      else F(x, z - k - 1, x + wide, z - k, base, top, mat);
    }
  };
  // A building: walls a metre thick, a floor, a roof, lamps. With two
  // floors, an upper floor and stairs up to it along the west wall.
  const hall = (x0, z0, x1, z1, h, wall, roof = 'roof', floors = 1) => {
    const top = h * floors + 0.4 * (floors - 1);
    F(x0, z0, x1, z1, 0, top + 0.4, wall);
    C(x0 + 1, z0 + 1, x1 - 1, z1 - 1, 0, top);
    F(x0 + 1, z0 + 1, x1 - 1, z1 - 1, top, top + 0.4, roof);
    F(x0 + 1, z0 + 1, x1 - 1, z1 - 1, -0.02, 0, 'floor');
    if (floors === 2) {
      F(x0 + 1, z0 + 1, x1 - 1, z1 - 1, h, h + 0.4, 'floor');
      // The stairwell: a hole in the floor over a straight flight.
      const n = Math.ceil((h + 0.4) / 0.5);
      C(x0 + 1, z0 + 2, x0 + 3, z0 + 2 + n, h, h + 0.4);
      stairs(x0 + 1, z0 + 2, 'z+', n, 2, 0, 'timber');
      for (let x = x0 + 4; x < x1 - 2; x += 7) for (let z = z0 + 4; z < z1 - 2; z += 7) lamp(x, top - 0.2, z);
    }
    for (let x = x0 + 4; x < x1 - 2; x += 7) for (let z = z0 + 4; z < z1 - 2; z += 7) lamp(x, h - 0.2, z);
  };
  const door = (x0, z0, x1, z1, h = 2.4) => C(x0, z0, x1, z1, 0, h);
  const pane = (x0, z0, x1, z1, y = 0) => C(x0, z0, x1, z1, y + 1, y + 2.2);
  // Windows along each wall of a building, on each floor.
  const panes = (x0, z0, x1, z1, h, floors, every = 4) => {
    for (let f = 0; f < floors; f++) {
      const y = f * (h + 0.4);
      for (let x = x0 + 2; x < x1 - 2; x += every) { pane(x, z0, x + 1, z0 + 1, y); pane(x, z1 - 1, x + 1, z1, y); }
      for (let z = z0 + 2; z < z1 - 2; z += every) { pane(x0, z, x0 + 1, z + 1, y); pane(x1 - 1, z, x1, z + 1, y); }
    }
  };
  // A house in the village: plastered or brick, one or two floors, doors
  // front and back, windows all round; a ruined one has lost part of its
  // roof and a corner.
  const house = (x0, z0, wide, deep, floors, ruined) => {
    const x1 = x0 + wide, z1 = z0 + deep, h = 3.1;
    hall(x0, z0, x1, z1, h, rnd() < 0.5 ? 'plaster' : 'stone', 'slate', floors);
    panes(x0, z0, x1, z1, h, floors);
    const mid = Math.floor((x0 + x1) / 2);
    door(mid, z0, mid + 2, z0 + 1);
    door(mid - 1, z1 - 1, mid + 1, z1);
    door(x1 - 1, z0 + 3, x1, z0 + 5);
    if (ruined) {
      const top = h * floors + 0.4 * (floors - 1);
      const cx = rnd() < 0.5 ? x0 : x1 - 5, cz = rnd() < 0.5 ? z0 : z1 - 4;
      C(cx, cz, cx + 5, cz + 4, 1.4 + rnd() * 1.4, top + 0.5);
      C(x0 + 2, z0 + 2, x0 + Math.floor(wide / 2), z1 - 2, top, top + 0.5);
      F(cx + 1, cz + 1, cx + 3, cz + 2, 0, 0.8, 'stone'); // rubble
    }
  };
  // A rounded mound, in steps of half a metre (so it can be walked up).
  const hill = (cx, cz, rx, rz, h, mat) => {
    for (let z = Math.floor(cz - rz); z <= cz + rz; z++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const d = ((x + 0.5 - cx) / rx) ** 2 + ((z + 0.5 - cz) / rz) ** 2;
        if (d >= 1) continue;
        const k = 1 - d, y = Math.floor((h * k * k * (3 - 2 * k)) / 0.5) * 0.5;
        if (y > 0) F(x, z, x + 1, z + 1, 0, y, mat);
      }
    }
  };
  // A shell hole, in steps down.
  const crater = (cx, cz, r, depth, mat = 'mud') => {
    for (let z = Math.floor(cz - r); z <= cz + r; z++) {
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz) / r;
        if (d >= 1) continue;
        const y = -Math.ceil((depth * (1 - d * d)) / 0.5) * 0.5;
        if (y < 0) { C(x, z, x + 1, z + 1, y, 0); F(x, z, x + 1, z + 1, y - 0.1, y, mat); }
      }
    }
  };
  // A trench running north-south, with steps out of it on both sides every so often.
  const trench = (x, z0, z1, wide = 3, depth = 1.6, exits = 14) => {
    C(x, z0, x + wide, z1, -depth, 0);
    F(x, z0, x + wide, z1, -depth - 0.1, -depth, 'timber');
    for (let z = z0 + 4; z < z1 - 3; z += exits) {
      for (let k = 0; k < Math.ceil(depth / 0.5); k++) {
        const y = -depth + 0.5 * (k + 1);
        F(x + k, z, x + k + 1, z + 2, -depth, Math.min(0, y), 'sandbag');
        F(x + wide - k - 1, z + 6, x + wide - k, z + 8, -depth, Math.min(0, y), 'sandbag');
      }
    }
  };
  const sandbags = (x0, z0, x1, z1, h = 1.1) => F(x0, z0, x1, z1, 0, h, 'sandbag');
  // Barbed wire on posts: a line of posts a metre apart, with a gap every so often.
  const wire = (x0, z0, x1, z1) => {
    const n = Math.max(x1 - x0, z1 - z0);
    for (let k = 0; k < n; k += 2) {
      if (k % 12 === 8 || k % 12 === 10) continue;
      const x = x1 - x0 > z1 - z0 ? x0 + k : x0, z = x1 - x0 > z1 - z0 ? z0 : z0 + k;
      F(x, z, x + 1, z + 1, 0, 0.9, 'barrier');
    }
  };
  const tree = (x, z, h = 6) => {
    F(x, z, x + 1, z + 1, 0, h, 'timber');
    F(x - 2, z - 2, x + 3, z + 3, h - 1.5, h + 1.5, 'leaf');
    F(x - 1, z - 1, x + 2, z + 2, h + 1.5, h + 2.5, 'leaf');
  };
  const deadTree = (x, z, h = 5) => {
    F(x, z, x + 1, z + 1, 0, h, 'timber');
    F(x + 1, z, x + 2, z + 1, h - 1.5, h - 1, 'timber');
  };
  const box = (x, z, eastWest, mat, high = 1) => (eastWest ? F(x, z, x + 6, z + 2, 0, 2.6 * high, mat) : F(x, z, x + 2, z + 6, 0, 2.6 * high, mat));
  const crate = (x, z, h = 1, wide = 1, deep = 1) => F(x, z, x + wide, z + deep, 0, h, 'crate');
  const low = (x0, z0, x1, z1, mat = 'barrier') => F(x0, z0, x1, z1, 0, 1, mat);
  // A wagon on the rails: wheels under a box.
  const wagon = (x, z, len, mat) => {
    F(x, z, x + len, z + 3, 0.3, 0.8, 'machine');
    F(x, z, x + len, z + 3, 0.8, 3.3, mat);
  };

  // ---- the ground -----------------------------------------------------------------------
  F(0, 0, FW, FH, -3, 0, 'asphalt');
  F(3, 3, 26, 133, -3, 0, 'concrete');
  F(26, 3, 160, 133, -3, 0, 'ballast');
  F(160, 3, 300, 133, -3, 0, 'grass');
  F(300, 3, 440, 133, -3, 0, 'mud');
  F(440, 3, 597, 133, -3, 0, 'concrete');
  // Far-off buildings round the edge.
  const rim = (x0, z0, x1, z1) => F(x0, z0, x1, z1, 0, 9 + Math.floor(rnd() * 5) * 2, 'skyline');
  for (let x = 0; x < FW; x += 8) { rim(x, 0, x + 8, 3); rim(x, FH - 3, x + 8, FH); }
  for (let z = 0; z < FH; z += 8) { rim(0, z, 3, z + 8); rim(FW - 3, z, FW, z + 8); }
  // The roads across the yard, at the edge of each sector.
  for (const [x0, x1] of [[150, 166], [290, 306], [430, 446]]) F(x0, 3, x1, 133, -0.02, 0, 'cobble');

  // ---- the camp ---------------------------------------------------------------------------
  F(6, 50, 16, 86, 4, 4.3, 'roof');
  for (const [x, z] of [[6, 50], [15, 50], [6, 85], [15, 85], [6, 67], [15, 67]]) F(x, z, x + 1, z + 1, 0, 4, 'pillar');
  crate(9, 58, 1, 2, 3); crate(9, 74, 2, 2, 2); box(5, 12, true, 'blue'); box(5, 120, true, 'blue');
  F(18, 20, 22, 28, 0, 2.6, 'white'); F(18, 106, 22, 114, 0, 2.6, 'white');
  lamp(11, 3.8, 68, 0.3, 0.55, 1.0, 12);

  // ---- 1: the Rail Yard -------------------------------------------------------------------
  // Six lines of track east-west, in two groups, with wagons standing on them.
  for (const z of [44, 52, 60, 76, 84, 92]) {
    F(36, z, 148, z + 1, 0, 0.15, 'rail');
    F(36, z + 2, 148, z + 3, 0, 0.15, 'rail');
  }
  const wagons = [[40, 43, 14, 'red'], [62, 51, 12, 'green'], [80, 43, 16, 'blue'], [104, 59, 12, 'yellow'], [118, 51, 14, 'white'], [48, 59, 10, 'yellow'],
    [44, 75, 16, 'green'], [70, 83, 12, 'red'], [94, 75, 14, 'white'], [112, 91, 12, 'blue'], [128, 83, 12, 'green'], [56, 91, 12, 'red'], [134, 75, 10, 'yellow']];
  for (const [x, z, len, mat] of wagons) wagon(x, z, len, mat);
  // The platform between the two groups, with a canopy and a footbridge to the station.
  F(40, 66, 146, 72, 0, 0.9, 'concrete');
  for (let x = 41; x < 145; x += 26) { stairs(x, 64, 'z+', 2, 4, 0, 'concrete'); F(x, 64, x + 4, 66, 0, 0.45, 'concrete'); }
  F(60, 66, 120, 72, 4.2, 4.5, 'roof');
  for (let x = 60; x < 121; x += 12) { F(x, 67, x + 1, 68, 0.9, 4.2, 'pillar'); F(x, 70, x + 1, 71, 0.9, 4.2, 'pillar'); }
  // A: the station, two floors, north of the lines.
  hall(108, 12, 138, 32, 3.4, 'stone', 'slate', 2);
  panes(108, 12, 138, 32, 3.4, 2, 5);
  door(116, 31, 120, 32); door(126, 31, 130, 32); door(108, 20, 109, 23); door(137, 20, 138, 23); door(122, 12, 124, 13);
  F(110, 32, 136, 36, 0, 0.9, 'concrete'); stairs(118, 36, 'z-', 2, 6, 0, 'concrete');
  F(112, 16, 116, 18, 0, 1, 'crate'); F(130, 26, 133, 28, 0, 1, 'crate'); F(124, 18, 127, 20, 0, 1.2, 'machine');
  F(112, 24, 115, 26, 3.8, 4.8, 'crate'); F(128, 16, 131, 18, 3.8, 4.8, 'crate');
  // B: the goods shed, south of the lines: one big open hall.
  hall(104, 104, 140, 126, 5.4, 'warehouse');
  door(104, 110, 105, 115, 3.6); door(139, 112, 140, 117, 3.6); door(112, 104, 117, 105, 3.6); door(126, 104, 131, 105, 3.6);
  for (const [x, z] of [[110, 108], [118, 116], [128, 110], [134, 120], [114, 121]]) crate(x, z, 1 + Math.floor(rnd() * 2), 2, 2);
  F(122, 118, 126, 122, 0, 2.2, 'machine'); F(130, 106, 132, 112, 0, 1.6, 'crate');
  // The water tower, the signal box, coal heaps, and stacks of sleepers.
  for (const [x, z] of [[70, 20], [75, 20], [70, 25], [75, 25]]) F(x, z, x + 1, z + 1, 0, 8, 'steel');
  F(69, 19, 77, 27, 8, 12, 'red');
  hall(84, 100, 92, 108, 3.1, 'workshop', 'slate', 2);
  panes(84, 100, 92, 108, 3.1, 2, 3); door(87, 100, 89, 101);
  hill(56, 22, 9, 7, 3, 'ballast'); hill(66, 116, 8, 7, 2.5, 'ballast'); hill(142, 40, 5, 4, 2, 'ballast');
  for (const [x, z] of [[46, 30], [92, 28], [98, 36], [52, 104], [76, 122], [96, 116], [140, 100]]) F(x, z, x + 4, z + 2, 0, 1.2, 'timber');
  for (const [x, z] of [[32, 30], [32, 100], [146, 22], [146, 112]]) low(x, z, x + 1, z + 5);
  box(36, 12, true, 'red', 2); box(36, 118, true, 'white'); box(88, 12, true, 'green'); box(142, 58, false, 'blue');

  // ---- 2: Ashby, a village ------------------------------------------------------------------
  // The main street east-west, and a street north-south across it at the square.
  F(166, 60, 290, 74, -0.02, 0, 'cobble');
  F(224, 8, 238, 128, -0.02, 0, 'cobble');
  // Houses along both sides of the main street, and more beyond.
  const plots = [
    [170, 42, 10, 12, 2], [184, 44, 9, 11, 1], [197, 41, 11, 13, 2], [210, 43, 10, 11, 2], [244, 42, 10, 12, 1], [258, 41, 11, 13, 2], [273, 43, 10, 11, 2],
    [170, 80, 11, 12, 2], [185, 80, 10, 11, 1], [199, 81, 10, 12, 2], [212, 80, 9, 11, 1], [246, 80, 10, 12, 2], [272, 80, 11, 12, 1],
    [172, 14, 10, 11, 1], [190, 18, 11, 12, 2], [206, 12, 10, 11, 1], [274, 16, 10, 12, 2],
    [176, 106, 10, 12, 2], [194, 110, 11, 11, 1], [210, 104, 10, 12, 2], [280, 106, 9, 11, 1],
  ];
  plots.forEach(([x, z, wd, dp, fl], i) => house(x, z, wd, dp, fl, i % 3 === 1));
  // Garden walls and hedges.
  for (const [x0, z0, x1, z1, m] of [[168, 38, 222, 39, 'stone'], [242, 38, 286, 39, 'stone'], [168, 95, 222, 96, 'leaf'], [244, 95, 286, 96, 'leaf'],
    [186, 30, 188, 38, 'leaf'], [262, 28, 264, 38, 'stone'], [196, 96, 198, 104, 'stone'], [226, 98, 227, 104, 'leaf']]) F(x0, z0, x1, z1, 0, m === 'leaf' ? 1.6 : 1.1, m);
  // A: the church, north of the square, with its tower and churchyard.
  hall(240, 12, 268, 32, 6.5, 'stone', 'slate');
  door(240, 20, 241, 25, 4); door(252, 31, 256, 32, 3); door(267, 20, 268, 23, 3);
  for (let x = 243; x < 266; x += 5) { C(x, 12, x + 2, 13, 2, 5); C(x, 31, x + 1, 32, 2, 5); }
  F(234, 18, 240, 26, 0, 16, 'stone'); F(233, 17, 241, 27, 16, 17, 'slate');
  for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) F(247 + k * 4, 16 + j * 5, 248 + k * 4, 18 + j * 5, 0, 0.9, 'barrier'); // pews
  for (let k = 0; k < 6; k++) F(242 + k * 4, 35, 243 + k * 4, 36, 0, 0.9, 'stone'); // headstones
  F(240, 33, 270, 34, 0, 1.1, 'stone');
  // B: the square, where the streets cross: a fountain and market stalls.
  F(228, 64, 234, 70, 0, 0.8, 'stone'); F(230, 66, 232, 68, 0.8, 2.2, 'stone');
  for (const [x, z] of [[220, 62], [240, 62], [220, 71], [240, 71]]) {
    F(x, z, x + 3, z + 2, 0, 1, 'timber');
    F(x, z, x + 1, z + 1, 1, 2.6, 'timber'); F(x + 2, z + 1, x + 3, z + 2, 1, 2.6, 'timber');
    F(x, z, x + 3, z + 2, 2.6, 2.8, 'red');
  }
  F(212, 74, 216, 78, 0, 3, 'white'); F(246, 56, 250, 60, 0, 3, 'white'); // carts
  // C: the mill, south of the square, by its pond and woodpile.
  hall(244, 104, 266, 122, 3.4, 'stone', 'slate', 2);
  panes(244, 104, 266, 122, 3.4, 2, 5);
  door(244, 110, 245, 113); door(253, 104, 256, 105); door(265, 114, 266, 117); door(256, 121, 258, 122);
  F(248, 114, 252, 118, 0, 1.6, 'machine'); F(258, 108, 261, 110, 3.8, 4.8, 'crate');
  C(268, 104, 276, 116, -0.5, 0); F(268, 104, 276, 116, -0.6, -0.5, 'trench');
  for (const [x, z] of [[240, 96], [262, 96], [270, 120]]) F(x, z, x + 4, z + 2, 0, 1.4, 'timber');
  for (const [x, z] of [[166, 32], [206, 30], [282, 30], [176, 98], [218, 120], [288, 96], [204, 64], [262, 76], [232, 48], [236, 88]]) tree(x, z, 5 + Math.floor(rnd() * 3));

  // ---- 3: No Man's Land ----------------------------------------------------------------------
  // The old front line near the west road, and the defenders' line near the east.
  trench(312, 8, 128);
  trench(418, 8, 128);
  for (let z = 12; z < 126; z += 16) { sandbags(311, z, 312, z + 6); sandbags(421, z + 4, 422, z + 10); }
  // Shell holes everywhere, wire, a wrecked tank, dead trees.
  for (let k = 0; k < 46; k++) {
    const x = 322 + rnd() * 92, z = 8 + rnd() * 120;
    // (Not on the objectives.)
    if (Math.hypot(x - 366, z - 26) < 12 || Math.hypot(x - 374, z - 68) < 14 || Math.hypot(x - 372, z - 108) < 18) continue;
    crater(x, z, 2 + rnd() * 3.5, 0.8 + rnd() * 1.2);
  }
  wire(338, 10, 339, 126); wire(396, 10, 397, 126);
  for (const [x, z] of [[332, 50], [352, 92], [404, 40], [390, 84], [344, 118], [408, 120]]) deadTree(x, z, 4 + Math.floor(rnd() * 3));
  F(386, 44, 394, 49, 0, 2, 'machine'); F(388, 45, 392, 48, 2, 3, 'machine'); F(392, 46, 397, 47, 2.4, 2.8, 'machine');
  F(346, 64, 350, 70, 0, 2.2, 'machine'); F(347, 65, 349, 69, 2.2, 3, 'machine');
  // A: the bunker, north: thick concrete with slits, sandbags round it.
  F(360, 20, 374, 32, 0, 3.4, 'concrete');
  C(361, 21, 373, 31, 0, 2.6);
  for (let x = 362; x < 372; x += 3) { C(x, 20, x + 2, 21, 1.3, 1.9); C(x, 31, x + 2, 32, 1.3, 1.9); }
  C(360, 23, 361, 26, 1.3, 1.9); door(373, 24, 374, 28); door(365, 31, 368, 32);
  F(362, 22, 364, 24, 0, 1, 'crate'); F(369, 27, 372, 29, 0, 1, 'crate');
  lamp(367, 2.4, 26, 1, 0.8, 0.55, 8);
  sandbags(356, 16, 358, 36); sandbags(358, 16, 378, 17); sandbags(358, 35, 378, 36);
  // B: the farm: a ruined farmhouse and barn, with haystacks.
  hall(364, 58, 378, 70, 3.1, 'stone', 'slate');
  door(364, 62, 365, 65); door(371, 69, 373, 70); door(377, 61, 378, 64);
  C(364, 58, 370, 63, 1.2, 3.6); C(370, 58, 378, 70, 3.1, 3.6); F(366, 60, 368, 61, 0, 0.8, 'stone');
  F(380, 70, 392, 82, 0, 3.6, 'timber'); C(381, 71, 391, 81, 0, 3.6); door(380, 74, 381, 78, 3); door(385, 70, 388, 71, 3); C(384, 70, 392, 76, 1.6, 3.6);
  for (const [x, z] of [[358, 74], [368, 78], [386, 60], [356, 60]]) F(x, z, x + 3, z + 3, 0, 1.6, 'yellow');
  // C: the redoubt, south: a ring of sandbags on a hill.
  hill(372, 108, 18, 15, 4, 'mud');
  for (let k = 0; k < 32; k++) {
    const a = (k / 32) * Math.PI * 2;
    if (k % 8 === 0 || k % 8 === 1) continue; // ways in
    const x = Math.floor(372 + Math.cos(a) * 6.5), z = Math.floor(108 + Math.sin(a) * 6.5);
    const y = w.cols[z * FW + x].reduce((t, s) => Math.max(t, s[1]), 0);
    F(x, z, x + 1, z + 1, y, y + 1.1, 'sandbag');
  }

  // ---- 4: the Citadel ---------------------------------------------------------------------------
  // Tank traps and shell holes on the open ground before the walls.
  for (let z = 10; z < 128; z += 9) if (z < 56 || z > 80) F(452, z, 453, z + 2, 0, 1, 'steel'), F(451, z + 1, 454, z + 2, 0, 1, 'steel');
  for (const [x, z, r] of [[460, 30, 3], [458, 100, 3.5], [464, 64, 2.5], [448, 118, 3]]) crater(x, z, r, 1, 'concrete');
  // The outer wall, seven metres high, with a gate, two breaches, corner towers and crenellations.
  F(472, 6, 475, 130, 0, 7, 'stone');
  for (let z = 6; z < 130; z += 2) F(472, z, 473, z + 1, 7, 8, 'stone');
  C(472, 62, 475, 74, 0, 4.5); // the gate
  for (const [z0, z1] of [[22, 28], [104, 110]]) {
    C(472, z0, 475, z1, 0, 8);
    hill(473.5, (z0 + z1) / 2, 4, 4, 1.5, 'stone');
  }
  F(470, 4, 478, 14, 0, 10, 'stone'); F(470, 122, 478, 132, 0, 10, 'stone');
  F(470, 58, 478, 62, 0, 10, 'stone'); F(470, 74, 478, 78, 0, 10, 'stone'); // the gatehouse towers
  // Stairs up to the wall walk from the inside.
  stairs(475, 34, 'z+', 14, 2, 0, 'stone');
  stairs(475, 102, 'z-', 14, 2, 0, 'stone');
  // A: the courtyard inside the gate: crates, a statue, trucks.
  F(494, 64, 500, 72, 0, 1.2, 'stone'); F(496, 66, 498, 70, 1.2, 4.5, 'pillar');
  for (const [x, z] of [[484, 54], [486, 80], [508, 58], [506, 78], [516, 68]]) crate(x, z, 1 + Math.floor(rnd() * 2), 2, 2);
  F(482, 44, 488, 47, 0, 2.6, 'white'); F(510, 88, 516, 91, 0, 2.6, 'white');
  // The barracks and the armoury, two floors each, either side of the courtyard.
  hall(496, 14, 528, 34, 3.3, 'stone', 'slate', 2);
  panes(496, 14, 528, 34, 3.3, 2, 5); door(496, 22, 497, 26); door(510, 33, 514, 34); door(527, 20, 528, 23); door(510, 14, 513, 15);
  F(500, 18, 504, 20, 0, 1, 'crate'); F(518, 26, 522, 28, 0, 1, 'crate');
  hall(496, 102, 528, 122, 3.3, 'stone', 'slate', 2);
  panes(496, 102, 528, 122, 3.3, 2, 5); door(496, 110, 497, 114); door(510, 102, 514, 103); door(527, 112, 528, 115); door(510, 121, 513, 122);
  F(504, 106, 508, 108, 0, 1.4, 'machine'); F(518, 114, 522, 116, 0, 1, 'crate');
  // B: the great hall, at the back: one tall room with galleries and pillars.
  F(548, 44, 588, 92, 0, 8.4, 'stone');
  C(549, 45, 587, 91, 0, 8);
  F(549, 45, 587, 91, 8, 8.4, 'slate');
  F(549, 45, 587, 91, -0.02, 0, 'floor');
  door(548, 54, 549, 58, 3.5); door(548, 66, 549, 70, 3.5); door(548, 78, 549, 82, 3.5);
  door(564, 44, 568, 45, 3.5); door(564, 91, 568, 92, 3.5); door(587, 66, 588, 70, 3.5);
  for (const z of [45, 87]) {
    F(549, z, 587, z + 4, 3.8, 4.2, 'steel');
    const zs = z === 45 ? 49 : 85;
    stairs(578, zs, 'x+', 8, 2, 0, 'stone');
  }
  for (let x = 556; x < 584; x += 7) for (const z of [56, 80]) F(x, z, x + 1, z + 1, 0, 8, 'pillar');
  for (const [x, z] of [[558, 62], [570, 72], [576, 60], [562, 76]]) F(x, z, x + 4, z + 2, 0, 1, 'timber');
  F(582, 64, 586, 72, 0, 0.6, 'stone');
  for (let x = 553; x < 586; x += 7) for (const z of [52, 68, 84]) lamp(x, 7.6, z, 1, 0.85, 0.65, 11);
  for (const [x, z] of [[536, 40], [536, 96], [540, 18], [540, 118]]) tree(x, z, 6);
  F(588, 3, 597, 133, -0.02, 0, 'cobble');
  F(596, 3, 597, 133, 0, 5, 'wall');
  F(596, 3, 597, 133, 5, 5.3, 'trimOrange');
  F(26, 3, 27, 133, -0.02, 0, 'trimBlue');
  w.freeze();

  // ---- the sectors ------------------------------------------------------------------------------
  // Where each side comes in, for each sector: two lines of places across
  // the yard, the attackers' just behind the sector's west edge and the
  // defenders' at its east edge.
  const home = w.nodeAt(12.5, 0.1, 40.5), reach = w.reachFrom(home);
  const strip = (x) => {
    const out = [];
    for (let z = 6.5; z < 131; z += 3.5) {
      const n = w.nodeAt(x, 0.1, z);
      if (n >= 0 && reach[n] && w.nodeY[n] === 0 && !w.blocked(x, 0, z, 0.32, 1.8, 0.55)) out.push([x, z]);
    }
    return out;
  };
  // (On the ground floor of a building; on top of a hill.)
  const objAt = (name, what, x, z, high) => {
    const n = w.nodeAt(x, high ? 10 : 0.1, z);
    return { name, what, x, y: n >= 0 ? w.nodeY[n] : 0, z };
  };
  const sector = (name, x0, x1, objs, att) => ({
    name, x0, x1,
    att: att ?? [...strip(x0 - 3.5), ...strip(x0 - 7)],
    def: [...strip(x1 - 3.5), ...strip(x1 - 7)],
    objs: objs.map(([what, x, z, high], i) => objAt('ABC'[i], what, x, z, high)),
  });
  const camp = [];
  for (let x = 8.5; x < 24; x += 3.5) for (let z = 8.5; z < 130; z += 6) {
    const n = w.nodeAt(x, 0.1, z);
    if (n >= 0 && reach[n] && w.nodeY[n] === 0 && !w.blocked(x, 0, z, 0.32, 1.8, 0.55)) camp.push([x, z]);
  }
  const advance = {
    size: 32,
    time: 4500,
    sectors: [
      sector('The Rail Yard', 26, 160, [['the station', 124, 24], ['the goods shed', 122, 114]], camp),
      sector('Ashby', 160, 300, [['the church', 254, 24], ['the square', 226, 77], ['the mill', 255, 112]]),
      sector("No Man's Land", 300, 440, [['the bunker', 367, 26], ['the farm', 374, 66], ['the redoubt', 372, 108, true]]),
      sector('The Citadel', 440, 596, [['the courtyard', 490, 68], ['the great hall', 568, 68]]),
    ],
  };
  const spawns = [advance.sectors[0].att.map(([x, z]) => ({ x, z, yaw: Math.PI / 2 })), advance.sectors[3].def.map(([x, z]) => ({ x, z, yaw: -Math.PI / 2 }))];
  return { world: w, W: FW, H: FH, spawns, spots: [], perches: [], lamps, laneCost: null, advance, name: 'The Iron Front', sun: norm([-0.35, 0.72, 0.6]) };
}

function norm(v) {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}
