// Haywire: the second map, the Long Works, for Advance. It is 253 m long
// and 64 m wide: five separate arenas in a row, west to east, with a wall
// and three gates between each and the next. The attackers start in the
// camp at the west end and fight for one arena at a time.
//
//   camp | 1 the yard | 2 the sheds | 3 the cut | 4 the foundry | 5 the offices
//
// Each arena has two objectives. A strip is kept clear along both sides of
// every wall: that is where the two teams come in.

import { World } from './world.js';
import { MATS } from './map.js';

export const LW = 253, LH = 64;
const M = Object.fromEntries(MATS.map((m, i) => [m.name, i]));

export function buildLine() {
  const w = new World(LW, LH), lamps = [];
  const F = (x0, z0, x1, z1, y0, y1, mat) => w.fill(x0, z0, x1, z1, y0, y1, M[mat]);
  const C = (x0, z0, x1, z1, y0, y1) => w.carve(x0, z0, x1, z1, y0, y1);
  const lamp = (x, y, z, r = 1, g = 0.82, b = 0.58, reach = 9) => lamps.push({ x, y, z, r, g, b, reach });
  // A building: walls a metre thick, a floor, a roof, and lamps under it.
  // Doors and windows are cut afterwards.
  const hall = (x0, z0, x1, z1, h, wall) => {
    F(x0, z0, x1, z1, 0, h + 0.4, wall);
    C(x0 + 1, z0 + 1, x1 - 1, z1 - 1, 0, h);
    F(x0 + 1, z0 + 1, x1 - 1, z1 - 1, h, h + 0.4, 'roof');
    F(x0 + 1, z0 + 1, x1 - 1, z1 - 1, -0.02, 0, 'floor');
    for (let x = x0 + 4; x < x1 - 2; x += 7) for (let z = z0 + 4; z < z1 - 2; z += 7) lamp(x, h - 0.2, z);
  };
  const door = (x0, z0, x1, z1, h = 2.4) => C(x0, z0, x1, z1, 0, h);
  const pane = (x0, z0, x1, z1) => C(x0, z0, x1, z1, 1, 2.2);
  const crate = (x, z, h = 1, wide = 1, deep = 1) => F(x, z, x + wide, z + deep, 0, h, 'crate');
  // A container, lying east-west or north-south, one or two high.
  const box = (x, z, eastWest, mat, high = 1) => (eastWest ? F(x, z, x + 6, z + 2, 0, 2.6 * high, mat) : F(x, z, x + 2, z + 6, 0, 2.6 * high, mat));
  const low = (x0, z0, x1, z1) => F(x0, z0, x1, z1, 0, 1, 'barrier');
  // The wall between two arenas, with its gates.
  const divide = (x, gates) => {
    F(x, 3, x + 1, 61, 0, 5, 'wall');
    F(x, 3, x + 1, 61, 5, 5.3, 'hazard');
    for (const [z0, z1] of gates) C(x, z0, x + 1, z1, 0, 3.2);
  };

  w.fill(0, 0, LW, LH, -3, 0, M.asphalt);
  let seed = 11;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  const rim = (x0, z0, x1, z1) => F(x0, z0, x1, z1, 0, 9 + Math.floor(rnd() * 4) * 2, 'skyline');
  for (let x = 0; x < LW; x += 8) { rim(x, 0, x + 8, 3); rim(x, LH - 3, x + 8, LH); }
  for (let z = 0; z < LH; z += 8) { rim(0, z, 3, z + 8); rim(LW - 3, z, LW, z + 8); }

  // ---- the camp, where the attack starts ------------------------------------------------
  F(3, 3, 14, 61, -0.02, 0, 'concrete');
  crate(5, 20, 1, 2, 2); crate(5, 40, 1, 2, 2); crate(8, 30, 2, 2, 3);
  box(4, 8, true, 'blue'); box(4, 52, true, 'blue');
  divide(14, [[8, 12], [29, 35], [52, 56]]);
  F(14, 3, 15, 61, 5.3, 5.6, 'trimBlue');

  // ---- 1: the yard. Containers in the open, an office and a depot ----------------------
  box(20, 18, false, 'red'); box(20, 40, false, 'blue');
  box(25, 7, true, 'green'); box(25, 55, true, 'yellow');
  box(28, 27, true, 'white', 2); box(28, 35, true, 'red');
  box(34, 20, false, 'yellow'); box(34, 38, false, 'green', 2);
  crate(27, 31, 1, 2, 2); crate(22, 30, 1); crate(23, 33, 2); crate(36, 30, 1, 1, 3);
  low(17, 22, 19, 24); low(17, 40, 19, 42); low(30, 14, 34, 15); low(30, 49, 34, 50);
  F(23, 44, 26, 51, 0, 3, 'white'); F(23, 42, 26, 44, 0, 2.3, 'red'); // a truck
  hall(40, 6, 52, 18, 3.2, 'workshop'); // A: the office
  door(40, 11, 41, 13); door(45, 17, 47, 18); door(51, 9, 52, 11);
  pane(42, 17, 43, 18); pane(49, 17, 50, 18); pane(40, 15, 41, 16);
  crate(47, 8, 1, 2, 1); F(42, 7, 43, 10, 0, 1, 'machine');
  F(38, 44, 54, 58, 4, 4.3, 'roof'); // B: the depot, a roof on posts
  for (const [x, z] of [[38, 44], [53, 44], [38, 57], [53, 57], [45, 44], [45, 57]]) F(x, z, x + 1, z + 1, 0, 4, 'pillar');
  crate(41, 47, 1, 2, 2); crate(49, 53, 2, 2, 2); crate(48, 47, 1); low(40, 52, 44, 53); low(47, 50, 51, 51);
  lamp(46, 3.8, 51, 1, 0.9, 0.7, 10);
  low(55, 26, 56, 30); low(55, 36, 56, 40); crate(44, 28, 1, 2, 2); crate(48, 34, 2); crate(49, 34, 1);
  divide(62, [[10, 14], [30, 34], [50, 54]]);

  // ---- 2: the sheds. Two long buildings with a lane between ----------------------------
  hall(68, 6, 106, 24, 4.6, 'warehouse'); // A: the north shed
  door(68, 13, 69, 16, 3); door(105, 13, 106, 16, 3); door(76, 23, 79, 24); door(96, 23, 99, 24);
  for (const x of [72, 84, 90, 102]) pane(x, 23, x + 2, 24);
  crate(74, 8, 1, 3, 2); crate(74, 8, 2, 1, 1); crate(82, 18, 1, 2, 3); crate(92, 9, 1, 2, 2); crate(99, 17, 2, 2, 2); crate(86, 12, 1, 1, 2);
  F(80, 7, 84, 9, 0, 2.2, 'machine'); F(94, 20, 98, 22, 0, 2.2, 'machine');
  hall(68, 40, 106, 58, 4.6, 'pump'); // B: the south shed
  door(68, 48, 69, 51, 3); door(105, 48, 106, 51, 3); door(76, 40, 79, 41); door(96, 40, 99, 41);
  for (const x of [72, 84, 90, 102]) pane(x, 40, x + 2, 41);
  crate(73, 53, 1, 2, 3); crate(83, 44, 1, 3, 2); crate(84, 44, 2); crate(92, 52, 1, 2, 2); crate(100, 44, 2, 2, 2); crate(88, 50, 1, 2, 1);
  F(78, 55, 82, 57, 0, 2.2, 'machine'); F(95, 42, 99, 44, 0, 2.2, 'machine');
  box(72, 28, true, 'yellow'); box(80, 34, true, 'green'); box(90, 28, true, 'red', 2); box(98, 34, true, 'white');
  low(70, 33, 71, 37); low(86, 31, 88, 32); low(103, 27, 104, 31); crate(94, 36, 1, 2, 1); crate(78, 31, 1);
  crate(65, 20, 1, 2, 2); crate(65, 42, 1, 2, 2);
  divide(111, [[6, 10], [30, 34], [54, 58]]);

  // ---- 3: the cut. A deep channel with two bridges, and steps down into it -------------
  C(132, 3, 140, 61, -2, 0);
  F(132, 3, 140, 61, -2.1, -2, 'trench');
  F(132, 12, 140, 16, -0.4, 0, 'steel'); F(132, 46, 140, 50, -0.4, 0, 'steel'); // the bridges
  for (let k = 0; k < 4; k++) {
    // Steps down from each bank, in the middle.
    C(128 + k, 30, 129 + k, 34, -0.5 * (k + 1), 0);
    F(128 + k, 30, 129 + k, 34, -0.5 * (k + 1) - 0.1, -0.5 * (k + 1), 'trench');
    C(143 - k, 30, 144 - k, 34, -0.5 * (k + 1), 0);
    F(143 - k, 30, 144 - k, 34, -0.5 * (k + 1) - 0.1, -0.5 * (k + 1), 'trench');
  }
  F(134, 24, 136, 26, -2, -1, 'crate'); F(136, 38, 138, 40, -2, -1, 'crate'); F(134, 54, 137, 56, -2, -1, 'crate'); F(135, 6, 138, 8, -2, -1, 'crate');
  box(118, 10, false, 'green'); box(118, 46, false, 'red'); box(122, 26, true, 'white'); box(122, 36, true, 'blue', 2);
  low(127, 8, 128, 11); low(127, 17, 128, 20); low(127, 42, 128, 45); low(127, 51, 128, 54); low(125, 30, 126, 34);
  crate(115, 30, 1, 2, 2); crate(116, 22, 2); crate(121, 54, 1, 2, 1); crate(124, 18, 1);
  hall(144, 6, 156, 20, 3.2, 'pump'); // A: the pump house
  door(144, 12, 145, 14); door(149, 19, 151, 20); pane(144, 8, 145, 9); pane(144, 17, 145, 18); pane(153, 19, 154, 20);
  F(152, 7, 155, 10, 0, 1.4, 'machine'); crate(147, 16, 1, 2, 1);
  hall(144, 44, 156, 58, 3.2, 'workshop'); // B: the boiler house
  door(144, 50, 145, 52); door(149, 44, 151, 45); pane(144, 46, 145, 47); pane(144, 55, 145, 56); pane(153, 44, 154, 45);
  F(152, 54, 155, 57, 0, 1.4, 'machine'); crate(147, 47, 1, 2, 1);
  F(146, 28, 150, 31, 0, 4, 'machine'); F(146, 28, 150, 31, 4, 4.2, 'hazard'); F(146, 33, 150, 36, 0, 4, 'machine'); F(146, 33, 150, 36, 4, 4.2, 'hazard');
  low(142, 22, 143, 26); low(142, 38, 143, 42); crate(153, 30, 1, 2, 3);
  divide(160, [[8, 12], [29, 35], [52, 56]]);

  // ---- 4: the foundry. One great hall, with galleries along two walls ------------------
  F(167, 9, 203, 55, 0, 7.4, 'warehouse');
  C(168, 10, 202, 54, 0, 7);
  F(168, 10, 202, 54, 7, 7.4, 'roof');
  F(168, 10, 202, 54, -0.02, 0, 'floor');
  door(167, 18, 168, 22, 3); door(167, 30, 168, 34, 3); door(167, 42, 168, 46, 3);
  door(202, 20, 203, 24, 3); door(202, 40, 203, 44, 3); door(184, 9, 187, 10, 3); door(184, 54, 187, 55, 3);
  for (const z of [10, 50]) {
    // A gallery four metres up, and the stairs to it.
    F(168, z, 202, z + 4, 3.6, 4, 'steel');
    const zs = z === 10 ? 14 : 48;
    for (let k = 0; k < 8; k++) F(169 + k, zs, 170 + k, zs + 2, 0, 0.5 * (k + 1), 'steel');
    for (let k = 0; k < 8; k++) F(200 - k, zs, 201 - k, zs + 2, 0, 0.5 * (k + 1), 'steel');
    for (let x = 172; x < 200; x += 9) lamp(x, 6.6, z + 2, 0.9, 0.8, 0.6, 9);
  }
  // Furnaces, glowing, and things to get behind.
  for (const [x, z] of [[180, 22], [188, 36]]) {
    F(x, z, x + 6, z + 6, 0, 3.2, 'machine');
    F(x, z, x + 6, z + 6, 3.2, 3.4, 'hazard');
    lamp(x - 1.5, 1.5, z + 3, 1.6, 0.6, 0.15, 8); lamp(x + 7.5, 1.5, z + 3, 1.6, 0.6, 0.15, 8);
  }
  for (const [x, z] of [[174, 26], [174, 37], [196, 26], [196, 37], [185, 31]]) F(x, z, x + 1, z + 1, 0, 7, 'pillar');
  crate(171, 22, 1, 2, 2); crate(172, 40, 2, 2, 2); crate(178, 44, 1, 3, 1); crate(190, 18, 1, 3, 1); crate(197, 44, 1, 2, 2); crate(193, 30, 1, 1, 2); crate(177, 31, 1, 2, 1);
  for (let x = 172; x < 200; x += 7) for (const z of [20, 32, 44]) lamp(x, 6.6, z, 1, 0.85, 0.65, 10);
  crate(164, 12, 1, 2, 2); crate(164, 50, 1, 2, 2); crate(175, 5, 1, 3, 1); crate(190, 58, 1, 3, 1); low(163, 26, 164, 28); low(163, 36, 164, 38);
  divide(209, [[10, 14], [30, 34], [50, 54]]);

  // ---- 5: the offices. A forecourt, and a long building with two rooms ------------------
  F(210, 3, 250, 61, -0.02, 0, 'concrete');
  F(216, 28, 220, 36, 0, 0.6, 'barrier'); F(217, 29, 219, 35, 0.6, 1.6, 'machine'); // something in the forecourt
  low(214, 14, 215, 20); low(214, 44, 215, 50); low(221, 22, 222, 26); low(221, 38, 222, 42);
  F(213, 6, 216, 12, 0, 3, 'white'); F(213, 52, 216, 58, 0, 3, 'white'); // trucks
  crate(222, 8, 1, 2, 2); crate(222, 54, 1, 2, 2); crate(219, 18, 1); crate(219, 45, 1);
  hall(226, 8, 246, 56, 3.4, 'workshop');
  F(227, 31, 245, 33, 0, 3.4, 'workshop'); // the wall between the two rooms
  door(235, 31, 238, 33);
  door(226, 18, 227, 21); door(226, 43, 227, 46); door(245, 20, 246, 22); door(245, 42, 246, 44); door(234, 8, 237, 9); door(234, 55, 237, 56);
  for (const z of [12, 26, 37, 51]) pane(226, z, 227, z + 2);
  for (const z of [14, 27, 36, 49]) pane(245, z, 246, z + 1);
  F(230, 12, 233, 13, 0, 1, 'machine'); F(239, 26, 242, 27, 0, 1, 'machine'); F(230, 50, 233, 51, 0, 1, 'machine'); F(239, 37, 242, 38, 0, 1, 'machine');
  crate(241, 12, 1, 2, 2); crate(229, 24, 1, 2, 1); crate(241, 49, 1, 2, 2); crate(229, 39, 1, 2, 1); crate(236, 16, 1); crate(236, 46, 1);
  F(249, 3, 250, 61, 0, 5.3, 'wall');
  F(249, 3, 250, 61, 5.3, 5.6, 'trimOrange');
  w.freeze();

  // The arenas, their objectives, and where each side comes in while one
  // is being fought for: the attackers along the west side of its west
  // wall, the defenders along the inside of its east wall.
  const home = w.nodeAt(11.5, 0.1, 32.5), reach = w.reachFrom(home);
  const strip = (x) => {
    const out = [];
    for (let z = 5.5; z < 59; z += 3.5) {
      const n = w.nodeAt(x, 0.1, z);
      if (n >= 0 && reach[n] && w.nodeY[n] === 0 && !w.blocked(x, 0, z, 0.32, 1.8, 0.55)) out.push([x, z]);
    }
    return out;
  };
  const sector = (name, x0, x1, a, b, back) => ({
    name, x0, x1, att: strip(x0 - 3.5), def: strip(back),
    objs: [{ name: 'A', what: a[0], x: a[1], y: 0, z: a[2] }, { name: 'B', what: b[0], x: b[1], y: 0, z: b[2] }],
  });
  const advance = {
    sectors: [
      sector('The Yard', 15, 62, ['the office', 46, 12], ['the depot', 46, 51], 59.5),
      sector('The Sheds', 63, 111, ['the north shed', 87, 15], ['the south shed', 87, 49], 108.5),
      sector('The Cut', 112, 160, ['the pump house', 150, 13], ['the boiler house', 150, 51], 157.5),
      sector('The Foundry', 161, 209, ['the west furnace', 177, 37], ['the east furnace', 194.5, 28], 205.5),
      sector('The Offices', 210, 249, ['the north room', 236, 20], ['the south room', 236, 44], 247.5),
    ],
  };
  const spawns = [advance.sectors[0].att.map(([x, z]) => ({ x, z, yaw: Math.PI / 2 })), advance.sectors[4].def.map(([x, z]) => ({ x, z, yaw: -Math.PI / 2 }))];

  return { world: w, W: LW, H: LH, spawns, spots: [], perches: [], lamps, laneCost: null, advance, name: 'The Long Works', sun: norm([-0.3, 0.76, 0.58]) };
}

function norm(v) {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}
