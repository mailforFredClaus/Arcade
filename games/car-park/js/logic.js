// Car Park: the rules, an exact solver and the puzzle generator.
//
// The car park is a 6×6 grid. Every vehicle lies along a row (across) or a
// column (along) and can only drive forwards or backwards. So a position is
// just how far along its own line each vehicle sits: a short list of numbers.
// Vehicle 0 is your red car, on the exit row. It's out when it reaches the
// exit on the right. One move is one vehicle driven any distance.
//
// Puzzles are built backwards. Lay out a car park with the red car already
// at the exit, find every position that can be reached from there, and work
// out how far each one is from the nearest finish (a breadth-first search,
// so the distances are exact). The farthest positions are the hardest
// puzzles that layout can make. Layouts are improved a vehicle at a time
// until one is hard enough. That's quick for easy and medium ones; the first
// few hundred hard and expert ones each come from a bank of car parks found
// the same way ahead of time (seeds.js). Same mode and number, same puzzle,
// everywhere.

import { SEEDS } from './seeds.js';

export const SIZE = 6;
export const EXIT_ROW = 2;
export const GOAL = SIZE - 2; // the red car's column when it's at the exit
export const GEN_VERSION = 2;
export const MODES = ['easy', 'medium', 'hard', 'expert'];

// The fewest moves each mode's puzzles take.
export const RANGES = { easy: [5, 9], medium: [10, 17], hard: [18, 28], expert: [29, 60] };

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

// ---- the rules ----------------------------------------------------------------

// A vehicle: h (true = lies across a row), line (its row, or its column if it
// lies along one) and len (2 for a car, 3 for a truck). Its position p is the
// column (or row) of its first square.
export const cellOf = (v, p, k) => (v.h ? v.line * SIZE + p + k : (p + k) * SIZE + v.line);

export function cellsOf(v, p) {
  const out = [];
  for (let k = 0; k < v.len; k++) out.push(cellOf(v, p, k));
  return out;
}

// What's in each square: 0 empty, i + 1 for vehicle i, 255 for a bollard.
export function occupancy(puzzle, pos) {
  const grid = new Uint8Array(SIZE * SIZE);
  for (const w of puzzle.walls) grid[w] = 255;
  puzzle.vehicles.forEach((v, i) => { for (let k = 0; k < v.len; k++) grid[cellOf(v, pos[i], k)] = i + 1; });
  return grid;
}

// How far vehicle i can drive each way from where it is: [lowest, highest].
export function limits(puzzle, pos, i, grid = occupancy(puzzle, pos)) {
  const v = puzzle.vehicles[i];
  let lo = pos[i], hi = pos[i];
  while (lo > 0 && !grid[cellOf(v, lo - 1, 0)]) lo--;
  while (hi + v.len < SIZE && !grid[cellOf(v, hi + 1, v.len - 1)]) hi++;
  return [lo, hi];
}

export const isSolved = (pos) => pos[0] === GOAL;

// Can vehicle i drive from where it is to p, with nothing in the way?
export function canMove(puzzle, pos, i, p) {
  if (!Number.isInteger(p) || i < 0 || i >= pos.length) return false;
  const [lo, hi] = limits(puzzle, pos, i);
  return p >= lo && p <= hi && p !== pos[i];
}

// ---- the search space -----------------------------------------------------------

// A position packs into two whole numbers, three bits per vehicle (where it
// sits along its line, 0 to 4): vehicles 0 to 9 in `lo`, the rest in `hi`.
// Everything stays in small integers, which keeps the searches quick.
const PER = 10;
export const MAX_VEHICLES = 2 * PER;

class Space {
  constructor(vehicles, walls) {
    const n = vehicles.length;
    this.n = n;
    this.h = Uint8Array.from(vehicles, (v) => (v.h ? 1 : 0));
    this.line = Uint8Array.from(vehicles, (v) => v.line);
    this.len = Uint8Array.from(vehicles, (v) => v.len);
    this.base = new Uint8Array(SIZE * SIZE);
    for (const w of walls) this.base[w] = 255;
    this.grid = new Uint8Array(SIZE * SIZE);
    this.pos = new Uint8Array(n);
  }

  encode(pos) {
    let lo = 0, hi = 0;
    for (let i = 0; i < this.n; i++) {
      if (i < PER) lo |= pos[i] << (3 * i);
      else hi |= pos[i] << (3 * (i - PER));
    }
    return [lo, hi];
  }

  decode(lo, hi, pos = this.pos) {
    for (let i = 0; i < this.n; i++) pos[i] = i < PER ? (lo >>> (3 * i)) & 7 : (hi >>> (3 * (i - PER))) & 7;
    return pos;
  }

  // Every move out of position (lo, hi). The new positions go in M.lo/M.hi,
  // and which vehicle went where in M.v/M.q. Returns how many there are.
  moves(lo, hi, M) {
    const { n, h, line, len, grid, pos } = this;
    for (let i = 0; i < n; i++) pos[i] = i < PER ? (lo >>> (3 * i)) & 7 : (hi >>> (3 * (i - PER))) & 7;
    grid.set(this.base);
    for (let i = 0; i < n; i++) {
      const L = len[i], p = pos[i], v = i + 1;
      if (h[i]) { const r = line[i] * SIZE + p; for (let j = 0; j < L; j++) grid[r + j] = v; }
      else { const c = line[i]; for (let j = 0; j < L; j++) grid[(p + j) * SIZE + c] = v; }
    }
    const oLo = M.lo, oHi = M.hi, oV = M.v, oQ = M.q;
    let m = 0;
    for (let i = 0; i < n; i++) {
      const L = len[i], p = pos[i], low = i < PER;
      const sh = low ? 3 * i : 3 * (i - PER), keep = ~(7 << sh);
      const step = h[i] ? 1 : SIZE;
      const first = h[i] ? line[i] * SIZE : line[i];
      // Backwards: the square in front of its first one must be free.
      for (let q = p - 1; q >= 0 && !grid[first + q * step]; q--) {
        oLo[m] = low ? (lo & keep) | (q << sh) : lo;
        oHi[m] = low ? hi : (hi & keep) | (q << sh);
        oV[m] = i;
        oQ[m++] = q;
      }
      // Forwards: the square past its last one must be free.
      for (let q = p + 1; q + L <= SIZE && !grid[first + (q + L - 1) * step]; q++) {
        oLo[m] = low ? (lo & keep) | (q << sh) : lo;
        oHi[m] = low ? hi : (hi & keep) | (q << sh);
        oV[m] = i;
        oQ[m++] = q;
      }
    }
    return m;
  }
}

const isGoal = (lo) => (lo & 7) === GOAL;
const moveBuf = () => ({ lo: new Int32Array(64), hi: new Int32Array(64), v: new Uint8Array(64), q: new Uint8Array(64) });

// A set of positions for the searches: open addressing over typed arrays,
// reused from one search to the next. Each position also keeps a distance.
const TBITS = 17, TSIZE = 1 << TBITS, TMASK = TSIZE - 1;
const tLo = new Int32Array(TSIZE), tHi = new Int32Array(TSIZE);
const tDist = new Int8Array(TSIZE);
const tUsed = new Uint8Array(TSIZE);
const tTouched = new Int32Array(TSIZE);
let tCount = 0;

function tClear() {
  for (let i = 0; i < tCount; i++) tUsed[tTouched[i]] = 0;
  tCount = 0;
}

// The slot for a position: where it is, or where it would go.
function tSlot(lo, hi) {
  let x = Math.imul(lo, 0x9e3779b1) ^ Math.imul(hi + 0x632be5ab, 0x85ebca6b);
  x ^= x >>> 15;
  x = Math.imul(x, 0x2c1b3c6d);
  let s = x >>> (32 - TBITS);
  while (tUsed[s] && (tLo[s] !== lo || tHi[s] !== hi)) s = (s + 1) & TMASK;
  return s;
}

function tAdd(s, lo, hi, d) {
  tUsed[s] = 1;
  tLo[s] = lo;
  tHi[s] = hi;
  tDist[s] = d;
  tTouched[tCount++] = s;
}

// Past this many positions a layout is far too loose to make a good puzzle.
const LIMIT = 40000;
const qLo = new Int32Array(LIMIT + 64), qHi = new Int32Array(LIMIT + 64);
const qFrom = new Int32Array(LIMIT + 64);
const qV = new Uint8Array(LIMIT + 64), qQ = new Uint8Array(LIMIT + 64);
const tIdx = new Int32Array(TSIZE); // slot -> where that position is in qLo/qHi
const eStart = new Int32Array(LIMIT + 65);
let edges = new Int32Array(1 << 18);
const dist = new Int8Array(LIMIT + 64);
const order = new Int32Array(LIMIT + 64);
const M = moveBuf();

// Every position reachable from (lo, hi), and how far each one is from the
// nearest finish. Returns null if there are more than `limit` of them.
// Otherwise qLo/qHi hold the positions, dist their distances, order lists
// them nearest first, and it returns { max, size }.
function analyse(space, lo, hi, limit = LIMIT) {
  tClear();
  // First find them all, noting which joins to which...
  let s0 = tSlot(lo, hi);
  tAdd(s0, lo, hi, -1);
  tIdx[s0] = 0;
  qLo[0] = lo;
  qHi[0] = hi;
  let size = 1, e = 0, goals = 0;
  for (let at = 0; at < size; at++) {
    eStart[at] = e;
    const a = qLo[at];
    if (isGoal(a)) order[goals++] = at;
    const m = space.moves(a, qHi[at], M);
    if (e + m > edges.length) {
      const bigger = new Int32Array(edges.length * 2);
      bigger.set(edges);
      edges = bigger;
    }
    for (let j = 0; j < m; j++) {
      const s = tSlot(M.lo[j], M.hi[j]);
      if (!tUsed[s]) {
        if (size >= limit) return null;
        tAdd(s, M.lo[j], M.hi[j], -1);
        tIdx[s] = size;
        qLo[size] = M.lo[j];
        qHi[size++] = M.hi[j];
      }
      edges[e++] = tIdx[s];
    }
  }
  eStart[size] = e;
  // ...then spread out from every finish at once.
  dist.fill(-1, 0, size);
  for (let i = 0; i < goals; i++) dist[order[i]] = 0;
  let max = 0, end = goals;
  for (let at = 0; at < end; at++) {
    const i = order[at], d = dist[i] + 1;
    for (let k = eStart[i], stop = eStart[i + 1]; k < stop; k++) {
      const j = edges[k];
      if (dist[j] >= 0) continue;
      dist[j] = d;
      order[end++] = j;
      max = d;
    }
  }
  return { max, size, end };
}

// The fewest moves from pos to the exit, as a list of [vehicle, new position],
// or null if the red car can never get out.
export function solveFrom(puzzle, pos) {
  const space = new Space(puzzle.vehicles, puzzle.walls);
  const [lo, hi] = space.encode(pos);
  if (isGoal(lo)) return [];
  tClear();
  tAdd(tSlot(lo, hi), lo, hi, 0);
  qLo[0] = lo;
  qHi[0] = hi;
  qFrom[0] = -1;
  let size = 1;
  for (let at = 0; at < size; at++) {
    const m = space.moves(qLo[at], qHi[at], M);
    for (let j = 0; j < m; j++) {
      const s = tSlot(M.lo[j], M.hi[j]);
      if (tUsed[s]) continue;
      if (size >= LIMIT) return null;
      tAdd(s, M.lo[j], M.hi[j], 0);
      qLo[size] = M.lo[j];
      qHi[size] = M.hi[j];
      qFrom[size] = at;
      qV[size] = M.v[j];
      qQ[size] = M.q[j];
      if (isGoal(M.lo[j])) {
        const out = [];
        for (let k = size; qFrom[k] >= 0; k = qFrom[k]) out.push([qV[k], qQ[k]]);
        return out.reverse();
      }
      size++;
    }
  }
  return null;
}

// The best next move for the way the game counts: driving the vehicle you
// moved last again is still that same move, and driving it back to where
// that move started takes the move away. last: { i, from } for the last move,
// or null. Returns { i, to, left }, where left is how many more moves the
// counter will go up by on the best way out from here; null if solved.
export function bestHint(puzzle, pos, last = null) {
  const plan = solveFrom(puzzle, pos);
  if (!plan || !plan.length) return null;
  let best = { i: plan[0][0], to: plan[0][1], left: plan.length };
  if (last && last.i >= 0 && last.i < pos.length) {
    const [lo, hi] = limits(puzzle, pos, last.i);
    for (let q = lo; q <= hi; q++) {
      if (q === pos[last.i]) continue;
      const next = pos.slice();
      next[last.i] = q;
      const rest = solveFrom(puzzle, next);
      if (!rest) continue;
      const left = rest.length - (q === last.from ? 1 : 0);
      if (left < best.left) best = { i: last.i, to: q, left };
    }
  }
  return best;
}

// ---- making puzzles ----------------------------------------------------------------

// How each mode's car parks are filled: how many vehicles, how many of them
// trucks, how many bollards, and how hard the search may work.
export const SPEC = {
  easy: { count: [7, 10], trucks: 0.22, walls: 0, steps: 40, stale: 20, fresh: 2, limit: 6000, side: 1, back: 0.08 },
  medium: { count: [10, 13], trucks: 0.28, walls: 0, steps: 120, stale: 50, fresh: 3, limit: 8000, side: 1, back: 0.08 },
  hard: { count: [11, 14], trucks: 0.3, walls: 0, steps: 300, stale: 100, fresh: 5, limit: 8000, side: 1, back: 0.08 },
  expert: { count: [12, 15], trucks: 0.3, walls: 2, steps: 600, stale: 100, fresh: 5, limit: 8000, side: 1, back: 0.08 },
};

// The range of minimum moves a puzzle number aims for: early numbers sit at
// the easy end of their mode, later ones drift up towards the top.
export function targetFor(mode, n) {
  const [lo, hi] = RANGES[mode];
  const top = mode === 'expert' ? 34 : hi;
  const p = Math.min(1, Math.max(0, (n - 1) / 40));
  const low = lo + Math.floor(p * 0.6 * (top - lo));
  const high = lo + Math.ceil((0.4 + 0.6 * p) * (top - lo));
  return [low, Math.min(hi, high)];
}

// A random empty spot for a new vehicle (or null). Nothing else lies across
// the exit row: that row is the red car's way out.
function place(R, grid, len, h) {
  for (let tries = 0; tries < 30; tries++) {
    const line = (R() * SIZE) | 0;
    if (h && line === EXIT_ROW) continue;
    const p = (R() * (SIZE - len + 1)) | 0;
    const v = { h, line, len };
    if (cellsOf(v, p).every((c) => !grid[c])) return { v, p };
  }
  return null;
}

function gridOf(layout) {
  const grid = new Uint8Array(SIZE * SIZE);
  for (const w of layout.walls) grid[w] = 255;
  layout.vehicles.forEach((v, i) => { for (const c of cellsOf(v, layout.pos[i])) grid[c] = i + 1; });
  return grid;
}

function addVehicle(R, layout, spec) {
  const grid = gridOf(layout);
  const len = R() < spec.trucks ? 3 : 2;
  const spot = place(R, grid, len, R() < 0.5);
  if (!spot) return false;
  layout.vehicles.push(spot.v);
  layout.pos.push(spot.p);
  return true;
}

function addWall(R, layout) {
  const grid = gridOf(layout);
  for (let tries = 0; tries < 20; tries++) {
    const c = (R() * SIZE * SIZE) | 0;
    if (grid[c] || ((c / SIZE) | 0) === EXIT_ROW) continue;
    layout.walls.push(c);
    return true;
  }
  return false;
}

const copy = (L) => ({ vehicles: L.vehicles.slice(), pos: L.pos.slice(), walls: L.walls.slice() });

// A finished car park: the red car at the exit, the rest scattered round it.
function randomLayout(R, spec) {
  const L = { vehicles: [{ h: true, line: EXIT_ROW, len: 2 }], pos: [GOAL], walls: [] };
  const want = spec.count[0] + ((R() * (spec.count[1] - spec.count[0] + 1)) | 0);
  for (let i = 0; i < spec.walls; i++) if (R() < 0.6) addWall(R, L);
  for (let tries = 0; L.vehicles.length < want && tries < 60; tries++) addVehicle(R, L, spec);
  return L;
}

// Everything in the same place (in any order)?
function sameLayout(a, b) {
  const key = (L) => L.vehicles.map((v, i) => `${v.h ? 'h' : 'v'}${v.line}${v.len}@${L.pos[i]}`).concat(L.walls.map((w) => `x${w}`)).sort().join(' ');
  return key(a) === key(b);
}

// Change one thing: take a vehicle away, add one, or move one somewhere else.
// Returns null if that came to nothing (no room for it, or the same again).
function mutate(R, L, spec) {
  const out = copy(L);
  const n = out.vehicles.length;
  const roll = R();
  const drop = () => {
    const i = 1 + ((R() * (out.vehicles.length - 1)) | 0);
    out.vehicles.splice(i, 1);
    out.pos.splice(i, 1);
  };
  if (spec.walls && roll < 0.08) {
    if (out.walls.length && (out.walls.length >= spec.walls || R() < 0.5)) out.walls.splice((R() * out.walls.length) | 0, 1);
    else addWall(R, out);
  } else if (roll < 0.3 && n > spec.count[0]) {
    drop();
  } else if (roll < 0.55 && n < spec.count[1]) {
    addVehicle(R, out, spec);
  } else if (n > 1) {
    drop();
    addVehicle(R, out, spec);
  }
  return sameLayout(out, L) ? null : out;
}

// How hard a layout's hardest position is (-1 if it leaves far too much
// room, 0 if the red car can't get out at all), and that position itself.
function score(L, limit) {
  const space = new Space(L.vehicles, L.walls);
  const [lo, hi] = space.encode(L.pos);
  const a = analyse(space, lo, hi, limit);
  if (!a) return { max: -1, far: L };
  if (!a.max) return { max: 0, far: L };
  const i = order[a.end - 1];
  return { max: a.max, far: { vehicles: L.vehicles, pos: Array.from(space.decode(qLo[i], qHi[i], new Uint8Array(space.n))), walls: L.walls } };
}

// Keep changing one vehicle at a time in the hardest position, keeping the
// changes that make it harder, until it takes at least `target` moves.
// Layouts that leave too much room are no good (and slow to look at), so
// they score -1 and the search moves on to tighter ones.
function climb(R, spec, mode, target) {
  let best = null;
  let cur = score(randomLayout(R, spec), spec.limit);
  let stale = 0, steps = 0, restarts = 0;
  for (steps = 1; ; steps++) {
    if (!best || cur.max > best.max) best = cur;
    if (best.max >= target) break;
    // Taking a long time: settle for a little less (never below the mode's range).
    if (steps % (spec.steps * 3) === 0) target = Math.max(RANGES[mode][0], target - 1);
    // Getting nowhere: shake up the best one so far (a few changes at once),
    // or now and then start again from a fresh layout.
    if (stale > spec.stale) {
      stale = 0;
      restarts++;
      if (restarts % spec.fresh === 0) cur = score(randomLayout(R, spec), spec.limit);
      else {
        let L = best.far;
        for (let k = 2 + ((R() * 3) | 0); k > 0; k--) L = mutate(R, L, spec) || L;
        cur = score(L, spec.limit);
      }
      continue;
    }
    const changed = mutate(R, cur.far, spec);
    if (!changed) { stale++; continue; }
    const next = score(changed, spec.limit);
    if (next.max > cur.max) {
      cur = next;
      stale = 0;
    } else {
      stale++;
      // Sideways (or a little back) now and then, to get off a plateau.
      if (next.max > 0 && (next.max === cur.max ? R() < spec.side : next.max >= cur.max - 2 && R() < spec.back)) cur = next;
    }
  }
  return { layout: best.far, max: best.max, steps };
}

// Hard and expert puzzles 1, 2, 3… each have a car park of their own from
// the bank, easiest first so later numbers get harder. Past the end of the
// bank they're built from scratch like the others (slower, but the next
// puzzle is always built while you play this one).
const seedOrders = {};
function seedFor(mode, n) {
  const seeds = SEEDS[mode];
  if (!seeds || n > seeds.length) return null;
  if (!seedOrders[mode]) seedOrders[mode] = seeds.map((x, i) => i).sort((x, y) => seeds[x].max - seeds[y].max || x - y);
  return seeds[seedOrders[mode][n - 1]];
}

// Make puzzle number n of a mode.
// (`want` is only for testing and making seeds: it asks for a particular
// number of moves, and builds from scratch.)
export function makePuzzle(mode, n, want = 0) {
  n = Math.max(1, Math.floor(n) || 1);
  const spec = SPEC[mode];
  const R = rng(mix(MODES.indexOf(mode) + 1, n, GEN_VERSION, 0xca7));
  let [low, high] = targetFor(mode, n);
  if (want) low = high = want;
  const target = low + ((R() * (high - low + 1)) | 0);

  // Easy and medium car parks are built from scratch. Hard and expert ones
  // take a while to find, so the first few hundred come from a bank found
  // ahead of time (SEEDS).
  const seed = !want && seedFor(mode, n);
  const found = seed ? { layout: parseBoard(seed.board), max: seed.max, steps: 0 } : climb(R, spec, mode, target);
  const best = found.layout;
  const goal = Math.min(target, found.max);

  // Pick the start: the farthest position if that's within range, else one
  // exactly `goal` moves out.
  const space = new Space(best.vehicles, best.walls);
  const a = analyse(space, ...space.encode(best.pos));
  const d = a.max <= high ? a.max : goal;
  const choices = [];
  for (let i = 0; i < a.size; i++) if (dist[i] === d) choices.push(i);
  let at = choices[(R() * choices.length) | 0];
  const start = Array.from(space.decode(qLo[at], qHi[at], new Uint8Array(space.n)));

  // The answer, walking downhill from the start to a finish.
  const solution = [];
  while (dist[at] > 0) {
    const m = space.moves(qLo[at], qHi[at], M);
    for (let j = 0; j < m; j++) {
      const next = tIdx[tSlot(M.lo[j], M.hi[j])];
      if (dist[next] !== dist[at] - 1) continue;
      solution.push([M.v[j], M.q[j]]);
      at = next;
      break;
    }
  }

  // Paint jobs and which way each vehicle faces (just for looks).
  const paint = shuffled(R, PAINT.length);
  const vehicles = best.vehicles.map((v, i) => ({
    ...v,
    color: i === 0 ? 0 : 1 + paint[(i - 1) % paint.length],
    flip: i === 0 ? false : R() < 0.5,
  }));
  return {
    mode, n, v: GEN_VERSION, vehicles, walls: best.walls.slice(), start, min: d, solution,
    positions: a.size, steps: found.steps, max: a.max, seeded: !!seed,
  };
}

// ---- car parks written out as text ----------------------------------------------------
// Six rows of six: '.' empty, 'x' a bollard, 'A' the red car, other letters
// the rest. (Handy for seeds and for testing.)

export function boardString(vehicles, walls, pos) {
  const out = Array(SIZE * SIZE).fill('.');
  for (const w of walls) out[w] = 'x';
  vehicles.forEach((v, i) => { for (const c of cellsOf(v, pos[i])) out[c] = String.fromCharCode(65 + i); });
  return out.join('');
}

export function parseBoard(str) {
  const cells = new Map(), walls = [];
  [...str].forEach((ch, c) => {
    if (ch === 'x') walls.push(c);
    else if (ch !== '.') cells.set(ch, [...(cells.get(ch) || []), c]);
  });
  const vehicles = [], pos = [];
  for (const ch of [...cells.keys()].sort()) {
    const list = cells.get(ch);
    const h = list.length > 1 && list[1] - list[0] === 1;
    vehicles.push({ h, line: h ? (list[0] / SIZE) | 0 : list[0] % SIZE, len: list.length });
    pos.push(h ? list[0] % SIZE : (list[0] / SIZE) | 0);
  }
  return { vehicles, pos, walls };
}

// A seed for the bank: a layout built from scratch that takes `want` moves.
export function makeSeed(mode, i, want) {
  const p = makePuzzle(mode, 100000 + i, want);
  return { board: boardString(p.vehicles, p.walls, p.start), max: p.max };
}

function shuffled(R, n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = (R() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Paint colours: [body, darker trim]. The first is the red car's.
export const PAINT_RED = ['#ef3b3b', '#b81f2a'];
export const PAINT = [
  ['#3f7cf0', '#2453b8'], // blue
  ['#ffc22e', '#d68f00'], // yellow
  ['#2fbf71', '#16864a'], // green
  ['#9a62ee', '#6b37c2'], // purple
  ['#ff8a2b', '#d65a00'], // orange
  ['#1fb8b0', '#0d7f7a'], // teal
  ['#ff6fae', '#d63d83'], // pink
  ['#5cc6ff', '#2391d1'], // sky
  ['#9ad94a', '#5f9e1c'], // lime
  ['#6f7a99', '#47506b'], // slate
];
export const paintOf = (v) => (v.color === 0 ? PAINT_RED : PAINT[(v.color - 1) % PAINT.length]);
