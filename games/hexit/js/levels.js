// Hexit: the levels, built from their number (same number, same puzzle).
//
// A level is built backwards from an empty board. Tiles go on one at a time,
// each pointing a way that's clear of every tile already down. Played
// forwards, the last tile placed is the first that can leave, and so on, so
// there is always a way to finish, whatever order you go in: taking a tile
// off can only ever open things up.
//
// To make it a puzzle, each new tile prefers to point across cells that are
// still to be filled, so later tiles end up in its way. And the cell placed
// next is always the one with the fewest ways out left, so the board fills
// right up. Of a few tries, the one with the fewest tiles free at the start
// is kept.

import { DIRS, key, opposite, shapeCells, dist } from './hex.js';
import { makePaths, Board } from './rules.js';

export const GEN_VERSION = 1;
export const MODES = ['levels', 'hard', 'super', 'huge'];

export function rng(seed) {
  let a = seed >>> 0;
  const R = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next: R, int: (n) => Math.floor(R() * n) };
}

export function mix(...xs) {
  let h = 0x9e3779b9;
  for (const x of xs) {
    h = Math.imul(h ^ (x | 0), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return h >>> 0;
}

// In the main run every 5th level is HARD and every 10th SUPER HARD.
export function tierOf(n, mode = 'levels') {
  if (mode !== 'levels') return mode === 'huge' ? 'huge' : mode;
  if (n >= 10 && n % 10 === 0) return 'super';
  if (n >= 5 && n % 5 === 0) return 'hard';
  return 'normal';
}

// The level where each new kind of piece first turns up.
export const INTRO = { 1: 'basics', 4: 'two', 7: 'stack', 11: 'frozen', 16: 'stone', 21: 'pad', 26: 'stack3' };
const AT = { two: 4, stack: 7, frozen: 11, stone: 16, pad: 21, stack3: 26 };

const SHAPES = ['hexagon', 'flower', 'heart', 'circle', 'star', 'rect', 'ring', 'triangle', 'clover', 'oval', 'bowtie', 'diamond', 'snowflake', 'blob'];
const EARLY = ['hexagon', 'triangle', 'hexagon', 'heart', 'circle', 'star', 'rect', 'flower', 'ring', 'clover'];
const CHUNKY = ['hexagon', 'rect', 'circle', 'oval', 'flower', 'heart', 'clover', 'star'];

export function levelSpec(n, mode = 'levels') {
  const tier = tierOf(n, mode);
  const has = (k) => mode !== 'levels' || n >= AT[k];
  const fresh = (k) => mode === 'levels' && n === AT[k];
  let tiles, bias, tries;
  if (mode === 'levels') {
    tiles = Math.round(9 + 135 * (1 - Math.exp(-(n - 1) / 38)));
    if (tier === 'hard') tiles = Math.round(tiles * 1.3);
    if (tier === 'super') tiles = Math.round(tiles * 1.6);
    bias = 0.8 + Math.min(1.6, n / 25) + (tier === 'hard' ? 0.6 : tier === 'super' ? 1 : 0);
    tries = tier === 'normal' ? 2 : tier === 'hard' ? 4 : 6;
  } else if (mode === 'hard') {
    tiles = 110 + Math.min(150, n * 4);
    bias = 2.6;
    tries = 5;
  } else if (mode === 'super') {
    tiles = 200 + Math.min(260, n * 6);
    bias = 3.2;
    tries = 6;
  } else {
    tiles = 700 + Math.min(1800, (n - 1) * 150);
    bias = 3;
    tries = 1;
  }
  const R = rng(mix(n, MODES.indexOf(mode), GEN_VERSION, 0x4e58));
  const shape = mode === 'huge' ? CHUNKY[(n - 1) % CHUNKY.length]
    : mode === 'levels' && n <= EARLY.length ? EARLY[n - 1] : SHAPES[R.int(SHAPES.length)];
  const feats = {
    two: has('two') ? (fresh('two') ? 0.4 : 0.14) : 0,
    stack2: has('stack') ? (fresh('stack') ? 0.35 : mode === 'huge' ? 0.08 : 0.13) : 0,
    stack3: has('stack3') ? (fresh('stack3') ? 0.25 : 0.05) : 0,
    frozen: has('frozen') ? (fresh('frozen') ? 0.3 : 0.1) : 0,
    stones: has('stone') ? (fresh('stone') ? 0.08 : 0.035) : 0,
    pads: has('pad') ? (fresh('pad') ? 0.06 : 0.025) : 0,
  };
  return { n, mode, tier, tiles, bias, tries, shape, feats };
}

// ---- building ------------------------------------------------------------------------

function attempt(spec, R) {
  const { feats } = spec;
  // How many cells: the tiles, less what stacking adds, plus stones and pads.
  const avgLayers = 1 + feats.stack2 + feats.stack3;
  const cellsWanted = Math.max(7, Math.round(spec.tiles / avgLayers / (1 - feats.stones - feats.pads)));
  const cells = shapeCells(spec.shape, cellsWanted, R);
  const N = cells.length;
  const at = new Map(cells.map(([q, r], i) => [key(q, r), i]));
  const inner = cells.map(([q, r]) => DIRS.every(([dq, dr]) => at.has(key(q + dq, r + dr))));
  // Stones and pads go inside the shape, never on its edge.
  const stone = new Uint8Array(N), pad = new Int8Array(N).fill(-1);
  const spots = cells.map((_, i) => i).filter((i) => inner[i]);
  const take = () => (spots.length ? spots.splice(R.int(spots.length), 1)[0] : -1);
  for (let k = Math.round(N * feats.stones); k > 0; k--) { const i = take(); if (i >= 0) stone[i] = 1; }
  for (let k = Math.round(N * feats.pads); k > 0; k--) {
    const i = take();
    if (i < 0) continue;
    // Not next to a stone, or it would steer things straight into it.
    if (cells.some((_, j) => stone[j] && dist(cells[j][0] - cells[i][0], cells[j][1] - cells[i][1]) === 1)) continue;
    pad[i] = R.int(6);
  }
  const { paths } = makePaths(cells, pad);
  // How many layers each cell wants.
  const want = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (stone[i] || pad[i] >= 0) continue;
    const x = R.next();
    want[i] = x < feats.stack3 ? 3 : x < feats.stack3 + feats.stack2 ? 2 : 1;
  }
  // block[c*6+d]: how many occupied cells lie on that path.
  const occ = new Uint8Array(N), block = new Int32Array(N * 6), through = Array.from({ length: N }, () => []);
  for (let p = 0; p < N * 6; p++) {
    if (!paths[p]) continue;
    for (const j of paths[p].cells) through[j].push(p);
  }
  const occupy = (i) => {
    occ[i] = 1;
    for (const p of through[i]) block[p]++;
  };
  for (let i = 0; i < N; i++) if (stone[i]) occupy(i);
  const layers = Array.from({ length: N }, () => []);
  let order = 0;
  const ways = new Int8Array(N);
  for (;;) {
    // The cells with the fewest ways out left...
    let fewest = 7, cands = [];
    for (let c = 0; c < N; c++) {
      ways[c] = 0;
      if (layers[c].length >= want[c]) continue;
      let clear = 0;
      for (let d = 0; d < 6; d++) if (paths[c * 6 + d] && !block[c * 6 + d]) clear++;
      ways[c] = clear;
      if (!clear) continue;
      if (clear < fewest) {
        fewest = clear;
        cands = [c];
      } else if (clear === fewest) cands.push(c);
    }
    if (!cands.length) break;
    // ...and of those, one whose tile won't shut another cell's last way out.
    let best = -1, bestKill = Infinity, ties = 0;
    for (let k = 0; k < Math.min(cands.length, 24); k++) {
      const c = cands.length > 24 ? cands[R.int(cands.length)] : cands[k];
      let kill = 0;
      if (!occ[c]) {
        for (const p of through[c]) {
          if (block[p]) continue;
          const c2 = (p / 6) | 0;
          if (ways[c2] === 1) kill++;
        }
      }
      if (kill < bestKill) {
        best = c;
        bestKill = kill;
        ties = 1;
      } else if (kill === bestKill && R.int(++ties) === 0) best = c;
    }
    // Point across cells still to be filled, so later tiles get in the way.
    let total = 0;
    const opts = [];
    for (let d = 0; d < 6; d++) {
      const p = paths[best * 6 + d];
      if (!p || block[best * 6 + d]) continue;
      let later = 0;
      for (const j of p.cells) if (!occ[j] && want[j]) later++;
      const wgt = (1 + later) ** spec.bias;
      opts.push([d, wgt]);
      total += wgt;
    }
    let x = R.next() * total, d = opts[opts.length - 1][0];
    for (const [od, wgt] of opts) {
      x -= wgt;
      if (x <= 0) { d = od; break; }
    }
    layers[best].push({ d, order: order++ });
    if (!occ[best]) occupy(best);
  }
  // Cells that never got a tile stay as empty floor.
  const empty = cells.filter((_, i) => !stone[i] && pad[i] < 0 && !layers[i].length).length;
  // Two-way tiles: any tile can have a second head (its own way stays clear),
  // as long as that other way leads somewhere (a pad could turn it back round).
  const stacks = layers.map((ls, i) => ls.map((t) => [t.d, R.next() < feats.two && paths[i * 6 + opposite(t.d)] ? 1 : 0]));
  // Frozen tiles: only single tiles with a neighbour that leaves before them.
  const frozen = [];
  if (feats.frozen) {
    for (let i = 0; i < N; i++) {
      if (layers[i].length !== 1) continue;
      const mine = layers[i][0].order;
      const [q, r] = cells[i];
      const thaws = DIRS.some(([dq, dr]) => {
        const j = at.get(key(q + dq, r + dr));
        return j !== undefined && layers[j].some((t) => t.order > mine);
      });
      if (thaws && R.next() < feats.frozen) frozen.push(i);
    }
  }
  const level = {
    mode: spec.mode, n: spec.n, v: GEN_VERSION, tier: spec.tier, shape: spec.shape,
    cells, stacks,
    stones: [...stone.keys()].filter((i) => stone[i]),
    pads: [...pad.keys()].filter((i) => pad[i] >= 0).map((i) => [i, pad[i]]),
    frozen,
  };
  const b = new Board(level);
  level.free = b.free().length;
  level.tiles = b.total;
  level.empty = empty;
  return level;
}

export function makeLevel(n, mode = 'levels') {
  const spec = levelSpec(n, mode);
  let best = null, fallback = null;
  for (let t = 0; t < spec.tries * 3 && (t < spec.tries || !best); t++) {
    const R = rng(mix(spec.n, MODES.indexOf(mode), t, GEN_VERSION, 0x7f11));
    const lv = attempt(spec, R);
    if (!fallback || lv.empty < fallback.empty) fallback = lv;
    // Too many holes left: try again.
    if (lv.empty > Math.max(2, lv.cells.length * 0.04)) continue;
    const score = lv.free / Math.max(1, lv.tiles) + lv.empty * 0.002;
    if (!best || score < best.score) best = { lv, score };
  }
  return best ? best.lv : fallback;
}
