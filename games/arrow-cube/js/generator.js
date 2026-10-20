// Level generator for Arrow Cube.
//
// Levels are built backwards. Each new arrow is placed so that its way out is
// clear of every arrow already on the shape, so clearing the arrows in reverse
// order of placement always works: every level has a solution by construction.
// checkLevel() then re-plays that solution and searches every order of taps
// that involves purple markers, rejecting any level where a player could get
// stuck. Same level number -> same level, on every device.

import { buildShape, boxShape, opp, headDir, hiddenFaces, FLAT, CONVEX } from './topology.js';
import { Board, pieceOptions, NORMAL, TWO_WAY, FORK, BLUE, PURPLE, FORWARD, IGNORE, REVERSE } from './rules.js';

// Version 5 made the regular levels' arrows longer and more tangled.
export const GEN_VERSION = 5;
// The giant puzzles (Mega, Giga, Huge) have their own version, so tuning them
// doesn't restart anyone's regular level. Bump it whenever they change: the
// game keeps built giant puzzles on the device, tagged with this version.
export const BIG_VERSION = 4;
// The regular levels' version the giant puzzles were last built with. It's
// part of their version and their random seeds, so it stays put when only the
// regular levels change.
const BIG_GEN = 4;
// The version their shapes and random seeds come from. Leaving it alone when
// bumping BIG_VERSION keeps every giant puzzle's shape (version 4 only took
// the arrows out of gaps too narrow to see into).
const BIG_SEED = 3;
export const BIG_TIERS = new Set(['mega', 'giga', 'huge']);
export const versionOf = (tier) => (BIG_TIERS.has(tier) ? `${BIG_GEN}.${BIG_VERSION}` : GEN_VERSION);

// Levels: the main run, where every 5th level is HARD and every 10th is
// SUPER HARD. Hard and Super Hard: endless runs of only that kind.
// Huge: enormous shapes to chip away at over many sittings.
export const MODES = ['levels', 'hard', 'super', 'huge'];

// The level where each feature first appears (with a short how-to card).
export const INTRO = { blue: 4, two: 6, yellow: 8, purple: 12, fork: 14 };

export function tierOf(n, mode = 'levels') {
  if (mode !== 'levels') return mode;
  if (n >= 100 && n % 100 === 0) return 'giga';
  if (n >= 50 && n % 50 === 0) return 'mega';
  if (n >= 10 && n % 10 === 0) return 'super';
  if (n >= 5 && n % 5 === 0) return 'hard';
  return 'normal';
}

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

function shuffle(R, a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (R() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- shapes ------------------------------------------------------------------

// Shape families for the regular modes and for Huge. Each is a few boxes
// glued face to face; a box ending in 0 is cut away again.
const KINDS = ['bumps', 'steps', 'towers', 'arch', 'cross', 'ring', 'ell', 'yoke', 'pyramid', 'tee', 'stack'];
// The big families, each with a size factor so that they all come out with
// roughly the same number of arrows at the same size.
const HUGE_SCALE = { city: 1.45, castle: 1.25, ziggurat: 1.72, bumps: 1, cross: 1.17, ring: 1.12, towers: 1.1 };
const HUGE_KINDS = Object.keys(HUGE_SCALE);

export function makeShape(R, kind, s) {
  const ri = (lo, hi) => lo + ((R() * (Math.max(lo, hi) - lo + 1)) | 0);
  const boxes = [];
  const add = (x0, y0, z0, x1, y1, z1) => boxes.push([x0, y0, z0, x1, y1, z1]);
  const cut = (x0, y0, z0, x1, y1, z1) => boxes.push([x0, y0, z0, x1, y1, z1, 0]);
  const half = Math.max(2, s >> 1);
  switch (kind) {
    case 'bumps': {
      // A big block with smaller blocks stuck on (like the original's level 712).
      const m = Math.max(2, Math.round(s * 0.35));
      add(m, m, m, m + s, m + s, m + s);
      const count = ri(2, s > 12 ? 7 : 4);
      for (let k = 0; k < count; k++) {
        const a = ri(0, 2), out = R() < 0.5;
        const [b, c] = a === 0 ? [1, 2] : a === 1 ? [0, 2] : [0, 1];
        const wb = ri(2, half), wc = ri(2, half), d = ri(1, m);
        const ob = m + ri(0, s - wb), oc = m + ri(0, s - wc);
        const lo = [0, 0, 0], hi = [0, 0, 0];
        lo[a] = out ? m + s : m - d;
        hi[a] = out ? m + s + d : m;
        lo[b] = ob; hi[b] = ob + wb; lo[c] = oc; hi[c] = oc + wc;
        add(lo[0], lo[1], lo[2], hi[0], hi[1], hi[2]);
      }
      break;
    }
    case 'steps': {
      const k = ri(3, 4), w = Math.max(2, Math.round(s / k)), h = Math.max(1, Math.round(s / k));
      for (let i = 0; i < k; i++) add(0, 0, i * w, s, (k - i) * h, (i + 1) * w);
      break;
    }
    case 'towers': {
      // Equal-height towers on a base: their tops share a plane across the gaps.
      const X = s + 2, Z = s + 2, base = ri(2, 3), H = ri(Math.max(3, half), s), t = ri(2, Math.max(2, (s >> 2) + 1));
      add(0, 0, 0, X, base, Z);
      const slots = [];
      for (let x = 0; x + t <= X; x += t + 2) for (let z = 0; z + t <= Z; z += t + 2) slots.push([x, z]);
      shuffle(R, slots);
      for (const [x, z] of slots.slice(0, ri(2, s > 12 ? 8 : 4))) add(x, base, z, x + t, base + H, z + t);
      break;
    }
    case 'arch': {
      const p = ri(2, Math.max(2, s >> 2)), H = s, X = s + 2, Z = ri(3, Math.max(3, s - 2)), t = ri(2, 3);
      add(0, 0, 0, p, H, Z);
      add(X - p, 0, 0, X, H, Z);
      add(0, H - t, 0, X, H, Z);
      break;
    }
    case 'cross': {
      const c = Math.max(2, Math.round(s * 0.45)), a = Math.max(2, Math.round((s - c) / 2) + 1), L = c + 2 * a;
      add(a, a, 0, a + c, a + c, L);
      add(0, a, a, L, a + c, a + c);
      add(a, 0, a, a + c, L, a + c);
      break;
    }
    case 'ring': {
      const X = s + 1, Y = ri(Math.max(2, half), s), w = Math.max(2, Math.round(s / 4));
      add(0, 0, 0, X, Y, X);
      cut(w, 0, w, X - w, Y, X - w);
      break;
    }
    case 'ell': {
      const X = s + 1, Z = s, Y = s, h = ri(2, Math.max(2, s >> 2)), w = ri(2, Math.max(2, s >> 2));
      add(0, 0, 0, X, h, Z);
      add(0, 0, 0, w, Y, Z);
      break;
    }
    case 'yoke': {
      const X = s + 2, Z = ri(3, s), Y = s, b = ri(2, 3), w = ri(2, Math.max(2, s >> 2));
      add(0, 0, 0, X, b, Z);
      add(0, 0, 0, w, Y, Z);
      add(X - w, 0, 0, X, Y, Z);
      break;
    }
    case 'pyramid': {
      const k = ri(3, 4), t = Math.max(1, Math.round(s / (2 * k))), h = Math.max(1, Math.round(s / k)), X = s + 2;
      for (let i = 0; i < k && X - 2 * i * t >= 2; i++) add(i * t, i * h, i * t, X - i * t, (i + 1) * h, X - i * t);
      break;
    }
    case 'tee': {
      const X = s + 2, Z = ri(3, s), Y = s, t = ri(2, 3), w = ri(2, half), x0 = (X - w) >> 1;
      add(0, Y - t, 0, X, Y, Z);
      add(x0, 0, 0, x0 + w, Y - t, Z);
      break;
    }
    case 'stack': {
      // Blocks piled on each other, each shifted a little.
      let px = 0, pz = 0, pa = 0, pb = 0, y = 0;
      for (let i = 0, k = ri(2, 3); i < k; i++) {
        const a = ri(Math.max(3, half), s), b = ri(Math.max(3, half), s), h = ri(2, Math.max(2, half));
        const x = i ? px + ri(2 - a, pa - 2) : 0, z = i ? pz + ri(2 - b, pb - 2) : 0;
        add(x, y, z, x + a, y + h, z + b);
        px = x; pz = z; pa = a; pb = b; y += h;
      }
      break;
    }
    case 'city': {
      // A ground slab packed with towers in a few different heights.
      const X = s + 4, Z = s + 4, base = 2, t = ri(2, 4);
      const heights = [ri(3, half), ri(half, s), ri(3, s)];
      add(0, 0, 0, X, base, Z);
      const slots = [];
      for (let x = 1; x + t <= X - 1; x += t + 1 + ri(0, 1)) for (let z = 1; z + t <= Z - 1; z += t + 1 + ri(0, 1)) slots.push([x, z]);
      shuffle(R, slots);
      for (const [x, z] of slots.slice(0, ri(6, 14))) add(x, base, z, x + t, base + heights[ri(0, 2)], z + t);
      break;
    }
    case 'castle': {
      // Thick walls round an open courtyard (an enclosed floor would trap
      // every arrow on it), tall corner towers and a gatehouse on each side.
      const X = s + 2, H = ri(Math.max(4, s >> 2), Math.max(4, half)), w = Math.max(3, Math.round(s / 6)), T = w + 2, mid = X >> 1;
      add(0, 0, 0, X, H, X);
      cut(w, 0, w, X - w, H, X - w);
      for (const [x, z] of [[0, 0], [X - T, 0], [0, X - T], [X - T, X - T]]) add(x, 0, z, x + T, H + ri(3, 6), z + T);
      const g = Math.max(2, w >> 1);
      add(mid - 2, 0, -g, mid + 2, H + 2, 0);
      add(mid - 2, 0, X, mid + 2, H + 2, X + g);
      add(-g, 0, mid - 2, 0, H + 2, mid + 2);
      add(X, 0, mid - 2, X + g, H + 2, mid + 2);
      break;
    }
    case 'ziggurat': {
      const k = ri(5, 6), t = Math.max(1, Math.round(s / (2 * k))), h = ri(2, 3), X = s + 4;
      for (let i = 0; i < k && X - 2 * i * t >= 2; i++) add(i * t, i * h, i * t, X - i * t, (i + 1) * h, X - i * t);
      break;
    }
    case 'bridge': {
      const X = s + 6, Z = ri(4, 6), H = ri(half, s - 2), p = 4, mid = X >> 1;
      add(0, 0, 0, p, H + 2, Z + 2);
      add(X - p, 0, 0, X, H + 2, Z + 2);
      add(0, H - 2, 1, X, H, Z + 1);
      add(mid - 1, 0, 1, mid + 1, H - 2, Z + 1);
      break;
    }
    default:
      add(0, 0, 0, s, s, s);
  }
  // Move it to start at the origin and size the grid to fit.
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const b of boxes) {
    if (b[6] === 0) continue;
    for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], b[a]); hi[a] = Math.max(hi[a], b[a + 3]); }
  }
  return {
    kind,
    dims: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]],
    boxes: boxes.map((b) => [b[0] - lo[0], b[1] - lo[1], b[2] - lo[2], b[3] - lo[0], b[4] - lo[1], b[5] - lo[2], ...b.slice(6)]),
  };
}

// How each tier of puzzle is built. size: how much bigger than a normal level
// at the same point; cap: the largest it gets; then how full, how long the
// arrows run, how hard the generator pushes for interlocking arrows (see
// score()), and how often each special piece turns up.
const TIERS = {
  normal: { size: 0, cap: 12, fill: 0.93, maxLen: 12, choices: 5, chain: 1.5, rim: 3, candidates: 3, free: 0.25, odds: 0.4, markers: 2, edges: 3 },
  hard: { size: 1, cap: 13, fill: 0.97, maxLen: 12, choices: 8, chain: 2, rim: 4, candidates: 4, free: 0.15, odds: 0.6, markers: 2, edges: 3 },
  super: { size: 3, cap: 14, fill: 0.985, maxLen: 13, choices: 10, chain: 2.6, rim: 5, candidates: 3, free: 0.08, odds: 0.85, markers: 3, edges: 4 },
  mega: { size: 8, cap: 22, fill: 0.97, maxLen: 10, choices: 6, chain: 2.6, rim: 5, candidates: 1, free: 0.1, odds: 0.9, markers: 4, edges: 5 },
  giga: { size: 14, cap: 30, fill: 0.96, maxLen: 8, choices: 4, chain: 2.4, rim: 5, candidates: 1, free: 0.12, odds: 0.95, markers: 5, edges: 5 },
  huge: { size: 0, cap: 90, fill: 0.95, maxLen: 6, choices: 4, chain: 2.4, rim: 4, candidates: 1, free: 0.15, odds: 0.85, markers: 14, edges: 10 },
};

export function levelSpec(n, mode = 'levels') {
  const m = Math.max(0, MODES.indexOf(mode));
  const R = rng(mix(n, m, 0x51ed));
  const chance = (p) => R() < p;
  const tier = tierOf(n, mode);
  const tt = TIERS[tier];
  const big = tier === 'mega' || tier === 'giga' || tier === 'huge';
  const main = mode === 'levels';
  const intro = main ? Object.keys(INTRO).find((k) => INTRO[k] === n) || null : null;

  // How big the shape is: grows as you go, wobbles a little, and now and
  // then jumps up for a surprise big one.
  let size;
  if (main) {
    size = n <= 2 ? 3 : n <= 5 ? 4 : n <= 10 ? 5 : n <= 17 ? 6 : n <= 26 ? 7 : n <= 38 ? 8 : n <= 52 ? 9 : n <= 70 ? 10 : n <= 95 ? 11 : 12;
    if (n > 6 && !intro) size += Math.round(R() * 2 - 1);
    if (n > 10 && !intro && chance(0.14)) size += 2;
    size += tt.size;
  } else if (mode === 'hard') {
    size = 6 + Math.floor(n / 6) + Math.round(R() * 2 - 1);
  } else if (mode === 'super') {
    size = 9 + Math.floor(n / 5) + Math.round(R() * 2 - 1);
  } else {
    // Aim for about 2,500 arrows in the first Huge puzzle, growing 10% per
    // puzzle up to about 5,000 (measured: size 44 gives ~2,150 arrows on
    // average across the shape families, and arrows grow with the square of
    // the size).
    const target = Math.min(5000, 2500 * (1 + 0.1 * (n - 1)));
    size = Math.round(44 * Math.sqrt(target / 2150));
  }
  size = Math.max(3, Math.min(tt.cap, size));

  // Plain boxes early on; after that, about half the time something fancier.
  let shape;
  if ((main && n <= 2) || intro) shape = boxShape([size, size, size]);
  else if (main && n === 3) shape = boxShape([4, 5, 1]);
  else if (big) {
    const kind = HUGE_KINDS[(R() * HUGE_KINDS.length) | 0];
    shape = makeShape(R, kind, Math.min(tt.cap, Math.round(size * HUGE_SCALE[kind])));
  }
  else if (size >= 5 && chance(main ? (n < 6 ? 0 : 0.5) : 0.6)) shape = makeShape(R, KINDS[(R() * KINDS.length) | 0], size - 1);
  else {
    const roll = R();
    if (roll < (tier === 'super' ? 0.7 : 0.58)) shape = boxShape([size, size, size]);
    else if (tier !== 'super' && roll < 0.8) shape = boxShape([size + 1, size + 2 + (chance(0.5) ? 1 : 0), chance(0.6) ? 1 : 2]);
    else shape = boxShape([size + 1, size, Math.max(2, size - 1)]);
  }

  const early = main && n <= 2, young = main && n <= 9 && tier === 'normal';
  const spec = {
    n, mode, tier, intro, shape,
    fill: early ? (n === 1 ? 0.55 : 0.75) : tt.fill,
    minLen: 2,
    // The biggest puzzles use shorter arrows, so there are lots of them to chip away at.
    maxLen: early ? 3 : big ? tt.maxLen : Math.min(tt.maxLen + 4, 2 * size + 2),
    straight: 0.5,
    aim: intro ? 0.45 : 0.3,
    inward: early ? 0 : 1.6,
    hug: early ? 0 : 0.7,
    choices: early ? 1 : young ? 3 : tt.choices,
    chain: early ? 0 : young ? 1.2 : tt.chain,
    rimPenalty: early ? 0 : young ? 2 : tt.rim,
    candidates: early ? 1 : young ? 2 : tt.candidates,
    freeTarget: early ? 1 : young ? 0.4 : tt.free,
    fastInterlock: big,
    // Joining arrows into long ones (see entwine()): the longest an arrow gets.
    join: !big && !early,
    joinLen: young ? size + 4 : Math.round(2.5 * size) + 2,
    shortLen: 3,
    joinBudget: 4000,
    joinTrials: 80,
    blue: 0, purple: 0, two: 0, fork: 0, yellow: 0,
  };
  const has = (k) => !main || n >= INTRO[k];
  const p = tt.odds;
  const upTo = (k) => 1 + ((R() * k) | 0);
  if (has('blue')) spec.blue = chance(p) ? upTo(tt.markers) : 0;
  if (has('two')) spec.two = chance(p + 0.1) ? 0.08 + R() * 0.12 : 0;
  if (has('yellow')) spec.yellow = chance(p) ? upTo(tt.edges) : 0;
  // Purple markers make a puzzle slow to check for dead ends, so the very
  // biggest ones go without.
  if (has('purple')) spec.purple = tier !== 'giga' && tier !== 'huge' && chance(p) ? upTo(2) : 0;
  if (has('fork')) spec.fork = chance(p) ? 0.05 + R() * 0.1 : 0;
  if (intro) {
    // A new feature gets the level to itself.
    for (const k of Object.keys(INTRO)) spec[k] = 0;
    Object.assign(spec, { blue: { blue: 2 }, two: { two: 0.3 }, yellow: { yellow: 3 }, purple: { purple: 2 }, fork: { fork: 0.25 } }[intro]);
  }
  return spec;
}

export function generateLevel(n, mode = 'levels') {
  const spec = levelSpec(n, mode);
  const m = Math.max(0, MODES.indexOf(mode));
  const big = BIG_TIERS.has(spec.tier);
  const seedOf = (attempt) => (big ? mix(n, m, attempt, BIG_GEN, BIG_SEED) : mix(n, m, attempt, GEN_VERSION));
  const done = (level) => Object.assign(level, { mode, tier: spec.tier, v: versionOf(spec.tier) });
  // Build a few valid candidates and keep the most interlocked one.
  const stats = spec.candidates > 1;
  let pick = null, pickScore = -Infinity, found = 0;
  for (let attempt = 0; attempt < 40 && found < spec.candidates; attempt++) {
    const seed = seedOf(attempt);
    const level = buildLevel(spec, seed);
    entwine(level, spec, rng(seed ^ 0x2e2e));
    interlock(level, spec, rng(seed ^ 0x1f1f));
    const check = checkLevel(level, spec, { stats });
    if (!check.ok) continue;
    found++;
    const s = stats ? check.rounds * 2 - (10 * check.free) / level.pieces.length : 0;
    if (s > pickScore) { pick = level; pickScore = s; }
  }
  if (pick) return done(pick);
  // Purple markers are the only thing that can make a level hard to verify,
  // so as a last resort leave them out.
  const plain = { ...spec, purple: 0 };
  for (let attempt = 40; ; attempt++) {
    const level = buildLevel(plain, seedOf(attempt));
    entwine(level, plain, rng(seedOf(attempt) ^ 0x2e2e));
    if (checkLevel(level, plain, { skipIntro: attempt >= 80 }).ok) return done(level);
  }
}

function showsFeature(level, feature) {
  switch (feature) {
    case 'blue': return level.redirectors.some((r) => r.kind === BLUE);
    case 'purple': return level.redirectors.some((r) => r.kind === PURPLE);
    case 'two': return level.pieces.some((p) => p.kind === TWO_WAY);
    case 'fork': return level.pieces.some((p) => p.kind === FORK);
    case 'yellow': return level.wraps > 0;
    default: return true;
  }
}

// Too many arrows that are free from the start makes a level feel trivial.
// Turn some of them around so they point into the crowd instead, keeping
// each change only if the level is still solvable.
function interlock(level, spec, R) {
  if (spec.freeTarget >= 1) return;
  const topo = buildShape(level.shape);
  const isFree = (b, i) => b.pieces[i].options.some((o, k) => b.tryMove(i, k).ok);
  const start = new Board(topo, level);
  const free = [];
  for (let i = 0; i < level.pieces.length; i++) if (isFree(start, i)) free.push(i);
  let count = free.length;
  const target = Math.max(1, Math.round(level.pieces.length * spec.freeTarget));
  if (spec.fastInterlock && !start.purples.length) {
    // For the giant puzzles. Without purple markers an arrow's way out never
    // changes, so the whole puzzle boils down to "this arrow needs those
    // arrows gone first". Turning an arrow around is safe exactly when every
    // arrow on its new way out can still be cleared while it stays put. That
    // takes one quick count-down pass instead of a full solve, so it scales
    // to thousands of arrows.
    const P = level.pieces.length;
    const left0 = new Int32Array(P * 2).fill(1 << 30); // per way of leaving: arrows still in the way
    const users = Array.from({ length: P }, () => []); // arrow -> the ways of leaving it blocks
    const need = (i, k, list) => {
      left0[i * 2 + k] = list ? list.length : 1 << 30;
      if (list) for (const j of list) users[j].push(i * 2 + k);
    };
    start.pieces.forEach((p) => p.options.forEach((snakes, k) => need(p.id, k, blockersOf(start, p.id, snakes))));
    const left = new Int32Array(P * 2), gone = new Uint8Array(P), queue = [];
    // Which arrows can be cleared while arrow `pin` stays.
    const clearable = (pin) => {
      left.set(left0);
      gone.fill(0);
      for (let i = 0; i < P; i++) {
        if (i !== pin && (left[i * 2] === 0 || left[i * 2 + 1] === 0)) { gone[i] = 1; queue.push(i); }
      }
      while (queue.length) {
        for (const u of users[queue.pop()]) {
          const i = u >> 1;
          if (--left[u] === 0 && !gone[i] && i !== pin) { gone[i] = 1; queue.push(i); }
        }
      }
      return gone;
    };
    for (const i of shuffle(R, free)) {
      if (count <= target) break;
      const p = level.pieces[i];
      if (p.kind !== NORMAL) continue;
      const cells = p.cells.slice().reverse();
      const list = blockersOf(start, i, [{ cells, dir: headDir(topo, cells) }]);
      if (!list || !list.length) continue; // it would still be free (or never get out)
      const ok = clearable(i);
      if (!list.every((j) => ok[j])) continue;
      p.cells = cells;
      need(i, 0, list);
      count--;
    }
    // A two-way arrow with one end already clear is as good as free. Where
    // it's safe, keep just its blocked end, so it has to wait its turn.
    for (const i of shuffle(R, free)) {
      if (count <= target) break;
      const p = level.pieces[i];
      if (p.kind !== TWO_WAY) continue;
      const k = left0[i * 2] === 0 ? 1 : 0; // the end that isn't clear
      if (left0[i * 2 + k] === 0 || left0[i * 2 + k] >= 1 << 30) continue;
      const list = blockersOf(start, i, start.pieces[i].options[k]);
      const ok = clearable(i);
      if (!list.every((j) => ok[j])) continue;
      p.kind = NORMAL;
      if (k === 1) p.cells = p.cells.slice().reverse();
      left0[i * 2 + 1 - k] = 1 << 30;
      count--;
    }
    return;
  }
  for (const i of shuffle(R, free)) {
    if (count <= target) break;
    const p = level.pieces[i];
    if (p.kind !== NORMAL) continue;
    const old = p.cells;
    p.cells = old.slice().reverse();
    const b = new Board(topo, level);
    if (!isFree(b, i) && b.solve(3000) === true) count--;
    else p.cells = old;
  }
}

// The arrows in the way of one way of leaving, or null if it can never leave
// that way (say it runs into a wall). Only meaningful without purple markers,
// where the route out doesn't depend on what has gone before.
function blockersOf(board, pid, snakes) {
  const r = board.simulate(pid, snakes, IGNORE);
  if (!r.ok) return null;
  const out = [];
  snakes.forEach((sn, s) => {
    const seq = r.seqs[s];
    for (let k = sn.cells.length; k < seq.length; k++) {
      const o = seq[k] >= 0 ? board.occ[seq[k]] : -1;
      if (o >= 0 && o !== pid && !out.includes(o)) out.push(o);
    }
  });
  return out;
}

// Make the arrows long and tangled. On a nearly full shape, the arrows that
// are free from the start are mostly short ones pointing straight off the
// nearest edge, and they make a level quick to clear without thinking. So
// each one is worked into its neighbours: joined end to end with an arrow it
// touches (led by the far end of either), or joined onto part of an arrow it
// touches in the middle (which splits that arrow in two), or turned around.
// The long arrows this makes wind over more of the shape, often round an edge
// onto the next side, and sit in the way of more arrows. A change is kept
// only if it leaves fewer arrows free and the level can still be cleared
// without ever getting stuck. Finally, arrows that are still very short are
// joined onto a neighbour where that costs nothing.
function entwine(level, spec, R) {
  if (!spec.join) return;
  const topo = buildShape(level.shape);
  const { nbCell, planeOf } = topo;
  const pieces = level.pieces.map((p) => ({ ...p }));
  const P = pieces.length;
  const board = new Board(topo, level);
  const purple = board.purples.length > 0;
  // (A level that can already get stuck is going to be thrown away.)
  if (purple && board.findDeadEnd(spec.joinBudget) !== false) return;
  let occ = board.occ.slice();
  let alive = new Uint8Array(P).fill(1);
  const len = (i) => pieces[i].cells.length;
  const markers = level.redirectors.map((r) => r.cell);

  // The cells each way of leaving crosses (null if it never works). Without
  // purple markers that never changes, and the puzzle is just "this arrow
  // needs the arrows on those cells gone first". With them it's how things
  // stand at the start, and a full search has the final say.
  const raysOf = (id, data) => pieceOptions(topo, data).map((snakes) => {
    const r = board.simulate(id, snakes, IGNORE);
    if (!r.ok) return null;
    const out = [];
    snakes.forEach((sn, s) => {
      for (let k = sn.cells.length; k < r.seqs[s].length; k++) if (r.seqs[s][k] >= 0) out.push(r.seqs[s][k]);
    });
    return out;
  });
  let rays = pieces.map((p, i) => raysOf(i, p));
  const waysOf = (i, rs, oc) => rs[i].map((cells) => {
    if (!cells) return null;
    const out = [];
    for (const c of cells) if (oc[c] >= 0 && oc[c] !== i && !out.includes(oc[c])) out.push(oc[c]);
    return out;
  });
  let ways = pieces.map((p, i) => waysOf(i, rays, occ));
  const isFree = (w) => w.some((l) => l && !l.length);
  let free = ways.filter(isFree).length;
  // crossers[c]: the arrows with a way out over cell c.
  let crossers;
  const index = () => {
    crossers = Array.from({ length: topo.N }, () => []);
    for (let i = 0; i < P; i++) if (alive[i]) for (const cells of rays[i]) if (cells) for (const c of cells) crossers[c].push(i);
  };
  index();

  // Can everything be cleared? Clear whatever can go until nothing can.
  const left = new Int32Array(P * 2), gone = new Uint8Array(P), users = Array.from({ length: P }, () => []);
  function clears(w, al) {
    const queue = [];
    let count = 0;
    for (let i = 0; i < P; i++) users[i].length = 0;
    for (let i = 0; i < P; i++) {
      gone[i] = 0;
      if (!al[i]) continue;
      count++;
      for (let k = 0; k < 2; k++) {
        const list = w[i][k];
        left[i * 2 + k] = list ? list.length : 1 << 30;
        if (list) for (const j of list) users[j].push(i * 2 + k);
      }
      if (left[i * 2] === 0 || left[i * 2 + 1] === 0) { gone[i] = 1; queue.push(i); }
    }
    let cleared = queue.length;
    while (queue.length) {
      for (const u of users[queue.pop()]) {
        const i = u >> 1;
        if (--left[u] === 0 && !gone[i]) { gone[i] = 1; queue.push(i); cleared++; }
      }
    }
    return cleared === count;
  }

  // Give some arrows new cells (null removes the arrow). Keeps the change and
  // returns true if `accept(arrows free before, after)` agrees and the level
  // still works.
  let purpleTrials = 0;
  function change(edits, accept) {
    const oc = occ.slice(), al = alive.slice(), rs = rays.slice();
    // Only the arrows being changed, and those with a way out over a cell
    // that changes hands, can come out differently.
    const touched = new Set();
    for (const [id] of edits) {
      touched.add(id);
      for (const c of pieces[id].cells) { oc[c] = -1; for (const i of crossers[c]) touched.add(i); }
    }
    for (const [id, cells] of edits) {
      if (cells) {
        for (const c of cells) { oc[c] = id; for (const i of crossers[c]) touched.add(i); }
        rs[id] = raysOf(id, { ...pieces[id], cells });
        if (!rs[id].some(Boolean)) return false;
      } else al[id] = 0;
    }
    const w = ways.slice();
    let f = free;
    for (const i of touched) {
      if (alive[i] && isFree(ways[i])) f--;
      w[i] = al[i] ? waysOf(i, rs, oc) : null;
      if (al[i] && isFree(w[i])) f++;
    }
    if (!accept(free, f)) return false;
    // Every marker must still be on some arrow's way out.
    for (const c of markers) {
      if (crossers[c].some((i) => al[i] && !touched.has(i))) continue;
      if (![...touched].some((i) => al[i] && rs[i].some((cells) => cells && cells.includes(c)))) return false;
    }
    if (purple) {
      if (++purpleTrials > spec.joinTrials) return false;
      const cells = new Map(edits);
      const trial = { ...level, pieces: pieces.map((p, i) => (cells.has(i) ? { ...p, cells: cells.get(i) } : p)).filter((p, i) => al[i]) };
      if (new Board(topo, trial).findDeadEnd(spec.joinBudget) !== false) return false;
    } else if (!clears(w, al)) return false;
    for (const [id, cells] of edits) if (cells) pieces[id].cells = cells;
    occ = oc; alive = al; rays = rs; ways = w; free = f;
    index();
    return true;
  }

  const rev = (a) => a.slice().reverse();
  const fits = (cells) => cells.length <= spec.joinLen;
  // Ways arrow x (with its end e touching cell z) could be worked into the
  // arrow on z. Each is a list of edits.
  function mergesAt(x, e, z) {
    const y = occ[z], out = [];
    if (y < 0 || y === x || !alive[y] || pieces[y].kind !== NORMAL) return out;
    const X = pieces[x].cells, xc = e === X[X.length - 1] ? X : rev(X);
    const Y = pieces[y].cells, at = Y.indexOf(z);
    const add = (a, rest) => {
      if (!fits(a)) return;
      out.push([[x, a], [y, rest]]);
      out.push([[x, rev(a)], [y, rest]]);
    };
    if (at === 0) add(xc.concat(Y), null);
    else if (at === Y.length - 1) add(xc.concat(rev(Y)), null);
    else {
      // Split y at z: x takes the part beyond z, or the part up to z.
      if (at >= 2) add(xc.concat(Y.slice(at)), Y.slice(0, at));
      if (Y.length - at >= 3) add(xc.concat(rev(Y.slice(0, at + 1))), Y.slice(at + 1));
    }
    return out;
  }

  // Take away free arrows.
  const fewer = (before, after) => after < before;
  for (let guard = 0; guard < 4 * P && free > 0; guard++) {
    const moves = [];
    for (let x = 0; x < P; x++) {
      if (!alive[x] || pieces[x].kind !== NORMAL || !isFree(ways[x])) continue;
      const X = pieces[x].cells;
      moves.push([R(), [[x, rev(X)]]]);
      for (const e of [X[0], X[X.length - 1]]) {
        for (let k = 0; k < 4; k++) {
          const z = nbCell[e * 4 + k];
          // Joining round an edge and joining whole arrows come first.
          const bonus = (planeOf[z] !== planeOf[e] ? 0.5 : 0) + 1;
          for (const m of mergesAt(x, e, z)) moves.push([R() + bonus + (m[1][1] ? 0 : 1), m]);
        }
      }
    }
    moves.sort((a, b) => b[0] - a[0]);
    if (!moves.some(([, m]) => change(m, fewer))) break;
  }

  // Tidy up: join very short arrows onto a neighbour, if no more arrows end
  // up free.
  const noWorse = (before, after) => after <= before;
  for (let guard = 0; guard < P; guard++) {
    const moves = [];
    for (let x = 0; x < P; x++) {
      if (!alive[x] || pieces[x].kind !== NORMAL || len(x) > spec.shortLen) continue;
      const X = pieces[x].cells;
      for (const e of [X[0], X[X.length - 1]]) {
        for (let k = 0; k < 4; k++) {
          for (const m of mergesAt(x, e, nbCell[e * 4 + k])) if (!m[1][1] || m[1][1].length > spec.shortLen) moves.push([R(), m]);
        }
      }
    }
    moves.sort((a, b) => b[0] - a[0]);
    if (!moves.some(([, m]) => change(m, noWorse))) break;
  }
  level.pieces = pieces.filter((p, i) => alive[i]);
  const after = new Board(topo, level);
  level.wraps = after.pieces.reduce((n, p) => n + after.simulate(p.id, p.options[0], IGNORE).wraps, 0);
}

// Independent check of a finished level: searches every order of taps and
// fails if any of them can leave the player stuck. (No dead ends anywhere
// also proves the level can be finished.)
export function checkLevel(level, spec = null, opts = {}) {
  const topo = buildShape(level.shape);
  const fresh = new Board(topo, level);
  const dead = fresh.findDeadEnd(opts.budget ?? 30000);
  if (dead !== false) return { ok: false, why: dead ? 'a dead end is reachable' : 'too many orders to verify' };

  if (spec && spec.intro && !opts.skipIntro && !showsFeature(level, spec.intro)) {
    return { ok: false, why: `intro feature "${spec.intro}" unused` };
  }
  if (opts.stats === false) return { ok: true };
  // How many arrows are free at the start, and how many waves of
  // "clear everything that's free" it takes to finish.
  let free = -1, rounds = 0;
  while (fresh.remaining > 0 && rounds < 500) {
    const wave = [];
    for (let i = 0; i < fresh.pieces.length; i++) {
      if (fresh.present[i] && fresh.pieces[i].options.some((o, k) => fresh.tryMove(i, k).ok)) wave.push(i);
    }
    if (free < 0) free = wave.length;
    if (!wave.length) break;
    for (const i of wave) {
      const k = fresh.pieces[i].options.findIndex((o, kk) => fresh.tryMove(i, kk).ok);
      if (k >= 0) fresh.apply(i, k, fresh.tryMove(i, k));
    }
    rounds++;
  }
  return { ok: true, free, rounds };
}

export function buildLevel(spec, seed) {
  const R = rng(seed);
  const ri = (k) => (R() * k) | 0;
  const topo = buildShape(spec.shape);
  const { N, nbCell, nbDir, nbType, nbEdge, planeOf, gi, gj } = topo;
  const B = new Board(topo, {});
  const placed = [];
  const uses = new Map();
  let wraps = 0, covered = 0;

  // Faces deep in a gap too narrow to see into get no arrows, markers or
  // yellow edges: you couldn't see or tap them.
  const hidden = hiddenFaces(topo);
  let visible = N;
  for (let c = 0; c < N; c++) visible -= hidden[c];

  // How far each cell is from the rim of its flat patch (0 = next to an edge).
  const depth = new Int16Array(N).fill(-1);
  const queue = [];
  for (let c = 0; c < N; c++) {
    for (let k = 0; k < 4; k++) {
      if (nbType[c * 4 + k] !== FLAT) { depth[c] = 0; queue.push(c); break; }
    }
  }
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q];
    for (let k = 0; k < 4; k++) {
      const e = c * 4 + k, nb = nbCell[e];
      if (nbType[e] === FLAT && depth[nb] < 0) { depth[nb] = depth[c] + 1; queue.push(nb); }
    }
  }

  // Yellow edges: whole straight runs of edge, preferring longer ones.
  const yellow = [];
  const longest = Math.max(1, ...topo.lines.map((l) => l.length));
  const inSight = (e) => !hidden[topo.edges[e].cells[0]] && !hidden[topo.edges[e].cells[1]];
  const lines = shuffle(R, topo.lines.filter((l) => l.length >= Math.min(3, longest) && l.every(inSight)));
  for (const line of lines.slice(0, spec.yellow)) for (const e of line) { yellow.push(e); B.yellow[e] = 1; }

  // Markers sit inside a flat patch, away from its rim and from each other.
  const markers = [];
  const kinds = [...Array(spec.blue).fill(BLUE), ...Array(spec.purple).fill(PURPLE)];
  if (kinds.length) {
    const spots = shuffle(R, [...Array(N).keys()].filter((c) => depth[c] >= 1 && !hidden[c]));
    for (const kind of shuffle(R, kinds)) {
      const c = spots.find((s) => !markers.includes(s) && markers.every((m) =>
        planeOf[m] !== planeOf[s] || Math.max(Math.abs(gi[m] - gi[s]), Math.abs(gj[m] - gj[s])) >= 2));
      if (c === undefined) break;
      B.setRedirector(c, kind, ri(4));
      markers.push(c);
    }
  }

  // Steps that cross a yellow edge, used to aim some arrows across them.
  const wrapSpots = [];
  if (yellow.length) {
    for (let c = 0; c < N; c++) {
      for (let k = 0; k < 4; k++) {
        const e = c * 4 + k;
        if (nbType[e] === CONVEX && B.yellow[nbEdge[e]]) wrapSpots.push([c, k]);
      }
    }
  }

  const isOpen = (c) => B.occ[c] < 0 && !B.rKind[c] && !hidden[c];
  // rayOwners[c] lists the placed arrows whose way out crosses cell c.
  const rayOwners = Array.from({ length: N }, () => []);
  const flipAll = (cells) => {
    for (const c of cells) B.rDir[c] = opp(B.rDir[c]);
    if (cells.length) B.refreshPurpleKey();
  };

  // Would this piece's intended way out work right now? Returns a plan for
  // place(), or null. Purple markers are judged as they must have been
  // before this arrow passed over them.
  function evaluate(data) {
    const snakes = pieceOptions(topo, data)[0];
    const own = new Set(data.kind === FORK ? data.cells.concat(data.branch) : data.cells);
    const rev = B.simulate(-1, snakes, REVERSE);
    if (!rev.ok) return null;
    // Every head travels over fresh cells: no loops, no crossing itself or the other head.
    const trail = new Set();
    for (let s = 0; s < snakes.length; s++) {
      const seq = rev.seqs[s];
      // (-1 entries are steps through open air or through the shape.)
      for (let i = snakes[s].cells.length; i < seq.length; i++) {
        if (seq[i] < 0) continue;
        if (trail.has(seq[i]) || own.has(seq[i])) return null;
        trail.add(seq[i]);
      }
    }
    const passed = rev.passed || [];
    flipAll(passed);
    const fwd = B.simulate(-1, snakes, FORWARD);
    let good = fwd.ok;
    if (good) {
      const odd = new Set();
      if (fwd.flips) for (let i = 0; i < fwd.flips.length; i += 2) {
        const c = fwd.flips[i];
        if (odd.has(c)) odd.delete(c); else odd.add(c);
      }
      good = odd.size === passed.length && passed.every((c) => odd.has(c));
    }
    flipAll(passed);
    return good ? { data, own, trail, passed, wraps: rev.wraps } : null;
  }

  function place(plan) {
    flipAll(plan.passed);
    for (const c of plan.trail) {
      if (B.rKind[c]) uses.set(c, (uses.get(c) || 0) + 1);
      rayOwners[c].push(placed.length);
    }
    wraps += plan.wraps;
    covered += plan.own.size;
    B.addPiece(plan.data);
    placed.push(plan.data);
  }

  // Prefer arrows that sit in the way of earlier arrows and that have a long
  // way out themselves (so later arrows can sit in their way). That builds
  // chains of arrows that must be cleared in order.
  function score(plan) {
    const blocked = new Set();
    for (const c of plan.own) for (const id of rayOwners[c]) blocked.add(id);
    const ray = plan.trail.size;
    return blocked.size * spec.chain + Math.min(ray, 8) * 0.6 - (ray === 0 ? spec.rimPenalty : 0) +
      plan.own.size * 0.15 + R() * 0.8;
  }

  function best(plans) {
    let top = null, topScore = -Infinity;
    for (const p of plans) {
      if (!p) continue;
      const s = score(p);
      if (s > topScore) { top = p; topScore = s; }
    }
    return top;
  }

  function pickHead() {
    const pMark = markers.length ? spec.aim : 0;
    const pWrap = wrapSpots.length ? spec.aim : 0;
    const x = R();
    if (x < pMark + pWrap) {
      let c, d, back;
      if (x < pMark) {
        c = markers[ri(markers.length)]; d = ri(4); back = 1 + ri(4);
      } else {
        [c, d] = wrapSpots[ri(wrapSpots.length)]; back = ri(4);
      }
      const start = c;
      for (let s = 0; s < back; s++) {
        const e = c * 4 + opp(d);
        if (nbType[e] !== FLAT) break;
        c = nbCell[e];
      }
      if (x < pMark && c === start) return null;
      return [c, d];
    }
    // Fill the middle of each face first, while long ways out are still
    // clear, and work out towards the rims (which are easy to fill last).
    const lean = Math.max(0, 1 - covered / Math.max(1, target)) * spec.inward;
    let pick = -1, top = -Infinity;
    for (let t = 0, seen = 0; t < 60 && seen < 6; t++) {
      const c = ri(N);
      if (!isOpen(c)) continue;
      seen++;
      const s = depth[c] * lean + R() * 2;
      if (s > top) { pick = c; top = s; }
    }
    return pick < 0 ? null : [pick, ri(4)];
  }

  // How many of a cell's neighbours are already taken (or in the path being drawn).
  const closed = (c, inPath) => {
    let k = 0;
    for (let d = 0; d < 4; d++) {
      const nb = nbCell[c * 4 + d];
      if (!isOpen(nb) || inPath.has(nb)) k++;
    }
    return k;
  };

  // Extend a path one random step at a time: mostly straight, sometimes
  // turning, and hugging arrows already placed so no lonely gaps are left.
  function extend(path, inPath, cur, a, len, avoid) {
    while (path.length < len) {
      const opts = [];
      let total = 0;
      for (let t = 0; t < 3; t++) {
        const k = t === 0 ? a : t === 1 ? (a + 1) & 3 : (a + 3) & 3;
        const e = cur * 4 + k, c = nbCell[e];
        if (!isOpen(c) || inPath.has(c) || avoid.has(c)) continue;
        const w = (t === 0 ? spec.straight : (1 - spec.straight) / 2) * (1 + spec.hug * closed(c, inPath));
        opts.push([c, nbDir[e], w]);
        total += w;
      }
      if (!opts.length) return;
      let x = R() * total, pick = opts[opts.length - 1];
      for (const o of opts) { x -= o[2]; if (x <= 0) { pick = o; break; } }
      path.push(pick[0]); inPath.add(pick[0]);
      cur = pick[0]; a = pick[1];
    }
  }

  // Cells a head at h facing d would cross on its way out, or null if it can't get out.
  function probeRay(h, d) {
    const b1 = nbCell[h * 4 + opp(d)];
    if (!isOpen(h) || !isOpen(b1)) return null;
    const stub = [b1, h];
    const r = B.simulate(-1, [{ cells: stub, dir: d }], REVERSE);
    if (!r.ok) return null;
    const ray = new Set();
    const seq = r.seqs[0];
    for (let i = 2; i < seq.length; i++) {
      if (seq[i] < 0) continue;
      if (ray.has(seq[i]) || seq[i] === b1 || seq[i] === h) return null;
      ray.add(seq[i]);
    }
    return ray;
  }

  // A body growing backwards from head h (facing d), returned tail-first.
  function body(h, d, len, avoid) {
    const e0 = h * 4 + opp(d);
    const path = [h, nbCell[e0]];
    extend(path, new Set(path), path[1], nbDir[e0], len, avoid);
    return path.reverse();
  }

  const randLen = () => spec.minLen + ri(spec.maxLen - spec.minLen + 1);

  function proposeArrow(kind) {
    const hd = pickHead();
    if (!hd) return null;
    const ray = probeRay(hd[0], hd[1]);
    if (!ray) return null;
    return evaluate({ kind, cells: body(hd[0], hd[1], randLen(), ray), green: ri(2) });
  }

  function proposeFork() {
    const hd = pickHead();
    if (!hd) return null;
    const rayA = probeRay(hd[0], hd[1]);
    if (!rayA) return null;
    const main = body(hd[0], hd[1], 2 + ri(Math.max(1, spec.maxLen - 2)), rayA);
    const at = ri(main.length - 1);
    const J = main[at];
    const avoid = new Set([...rayA, ...main]);
    for (const k of shuffle(R, [0, 1, 2, 3])) {
      const e = J * 4 + k, c = nbCell[e];
      if (!isOpen(c) || avoid.has(c)) continue;
      const arm = [c];
      extend(arm, new Set(arm), c, nbDir[e], 1 + ri(4), avoid);
      return evaluate({ kind: FORK, cells: main, at, branch: arm, green: 0 });
    }
    return null;
  }

  // Try to cover the open cell e with a new arrow whose tail is there.
  function fillFrom(e) {
    const path = [e];
    const inPath = new Set(path);
    const plans = [];
    let budget = 150;
    const want = 2 + ri(Math.max(1, spec.maxLen - 1));
    const kind = R() < spec.two ? TWO_WAY : NORMAL;
    const green = ri(2);
    const visit = (cell) => {
      if (--budget < 0 || plans.length >= 3) return;
      if (path.length < want) {
        for (const k of shuffle(R, [0, 1, 2, 3])) {
          const c = nbCell[cell * 4 + k];
          if (!isOpen(c) || inPath.has(c)) continue;
          path.push(c); inPath.add(c);
          visit(c);
          path.pop(); inPath.delete(c);
          if (budget < 0 || plans.length >= 3) return;
        }
      }
      if (path.length >= 2) {
        const p = evaluate({ kind, cells: path.slice(), green });
        if (p) plans.push(p);
      }
    };
    visit(e);
    const pick = best(plans);
    if (pick) place(pick);
  }

  const target = Math.floor(spec.fill * (visible - markers.length));
  const maxFails = 40 + (N >> 2);
  let fails = 0;
  while (covered < target && fails < maxFails) {
    const plans = [];
    for (let k = 0; k < spec.choices; k++) {
      const x = R();
      plans.push(x < spec.fork ? proposeFork() : proposeArrow(x < spec.fork + spec.two ? TWO_WAY : NORMAL));
    }
    const pick = best(plans);
    if (pick) { place(pick); fails = 0; } else fails++;
  }
  if (spec.fill >= 0.85) {
    // Fill gaps that are about to be cut off first.
    const openAround = (c) => 4 - closed(c, new Set());
    for (let pass = 0; pass < 2 && covered < target; pass++) {
      const gaps = shuffle(R, [...Array(N).keys()].filter(isOpen));
      gaps.sort((a, b) => openAround(a) - openAround(b));
      for (const c of gaps) {
        if (covered >= target) break;
        if (isOpen(c)) fillFrom(c);
      }
    }
    absorbGaps();
  }

  // Let an arrow's tail grow into a leftover gap right behind it. That's safe
  // when every arrow whose way out crosses the gap leaves after this one
  // (was placed before it), so the longer tail never blocks anything early.
  function absorbGaps() {
    let grew = true;
    while (grew) {
      grew = false;
      for (let id = 0; id < placed.length; id++) {
        const data = placed[id];
        if (data.kind !== NORMAL || data.cells.length >= spec.maxLen + 3) continue;
        const tail = data.cells[0];
        for (let k = 0; k < 4; k++) {
          const gap = nbCell[tail * 4 + k];
          if (!isOpen(gap) || rayOwners[gap].some((o) => o >= id)) continue;
          data.cells = [gap, ...data.cells];
          B.occ[gap] = id;
          covered++;
          grew = true;
          break;
        }
      }
    }
  }

  return {
    v: GEN_VERSION,
    n: spec.n,
    tier: spec.tier,
    shape: spec.shape,
    dims: spec.shape.dims,
    yellow,
    redirectors: markers.filter((c) => uses.get(c)).map((c) => ({ cell: c, kind: B.rKind[c], dir: B.rDir[c] })),
    pieces: placed,
    wraps,
  };
}
