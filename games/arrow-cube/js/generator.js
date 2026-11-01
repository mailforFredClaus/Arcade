// Level generator for Arrow Cube.
//
// Levels are built backwards. Each new arrow is placed so that its way out is
// clear of every arrow already on the shape, so clearing the arrows in reverse
// order of placement always works: every level has a solution by construction.
// checkLevel() then re-plays that solution and searches every order of taps
// that involves purple markers, rejecting any level where a player could get
// stuck. Same level number -> same level, on every device.

import { buildShape, boxShape, voxelize, opp, headDir, hiddenFaces, FLAT, CONVEX } from './topology.js';
import { Board, pieceOptions, NORMAL, TWO_WAY, FORK, BLUE, PURPLE, FORWARD, IGNORE, REVERSE } from './rules.js';

// Version 5 made the arrows longer and more tangled.
export const GEN_VERSION = 5;
// The giant puzzles (Mega, Giga, Huge) have their own version, so tuning them
// doesn't restart anyone's regular level. Bump it whenever they change: the
// game keeps built giant puzzles on the device, tagged with this version.
// (Version 6 made them plain boxes with longer, more tangled arrows.)
export const BIG_VERSION = 6;
// The version their shapes and random seeds come from. Leaving it alone when
// bumping BIG_VERSION keeps every giant puzzle's shape (version 4 only took
// the arrows out of gaps too narrow to see into).
const BIG_SEED = 3;
export const BIG_TIERS = new Set(['mega', 'giga', 'huge']);
export const versionOf = (tier) => (BIG_TIERS.has(tier) ? `${GEN_VERSION}.${BIG_VERSION}` : GEN_VERSION);

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

// Working out a shape's surface takes a while for the giant ones, and every
// step of making a level needs it, so it's done once per shape.
const topos = new WeakMap();
function topoOf(shape) {
  let t = topos.get(shape);
  if (!t) topos.set(shape, (t = buildShape(shape)));
  return t;
}
const hiddens = new WeakMap();
function hiddenOf(topo) {
  let h = hiddens.get(topo);
  if (!h) hiddens.set(topo, (h = hiddenFaces(topo)));
  return h;
}

function shuffle(R, a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (R() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- shapes ------------------------------------------------------------------

// Shape families for the regular modes. Each is a few boxes glued face to
// face; a box ending in 0 is cut away again.
const KINDS = ['bumps', 'steps', 'towers', 'arch', 'cross', 'ring', 'ell', 'yoke', 'pyramid', 'tee', 'stack'];
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
    case 'bridge': {
      const X = s + 6, Z = ri(4, 6), H = ri(half, s - 2), p = 4, mid = X >> 1;
      add(0, 0, 0, p, H + 2, Z + 2);
      add(X - p, 0, 0, X, H + 2, Z + 2);
      add(0, H - 2, 1, X, H, Z + 1);
      add(mid - 1, 0, 1, mid + 1, H - 2, Z + 1);
      break;
    }
    case 'box': {
      // The giant puzzles: a plain box, in one of a few proportions. Every
      // side is one flat face with nothing else on its level, so it's easy to
      // see what could be in an arrow's way even zoomed right in.
      const [a, b, c] = [[1, 1, 1], [1.4, 0.8, 1.1], [0.7, 1.7, 0.7], [1.6, 0.5, 1.3], [1.9, 0.75, 0.75]][ri(0, 4)];
      add(0, 0, 0, Math.max(3, Math.round(s * a)), Math.max(3, Math.round(s * b)), Math.max(3, Math.round(s * c)));
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

// How many cell faces a shape's surface has.
function surface(shape) {
  const [X, Y, Z] = shape.dims, solid = voxelize(shape);
  const at = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < X && y < Y && z < Z && solid[(x * Y + y) * Z + z];
  let n = 0;
  for (let x = 0; x < X; x++) for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) {
    if (!solid[(x * Y + y) * Z + z]) continue;
    n += !at(x + 1, y, z) + !at(x - 1, y, z) + !at(x, y + 1, z) + !at(x, y - 1, z) + !at(x, y, z + 1) + !at(x, y, z - 1);
  }
  return n;
}

// A shape of the given family with about `cells` cells on its surface: the
// same random choices each time, scaled up or down until it's about right.
export function sizedShape(seed, kind, cells) {
  let s = Math.max(4, Math.round(Math.sqrt(cells / 6))), shape = null;
  for (let tries = 0; tries < 5; tries++) {
    shape = makeShape(rng(seed), kind, s);
    const k = Math.sqrt(cells / surface(shape)), next = Math.max(4, Math.round(s * k));
    if (Math.abs(k - 1) < 0.05 || next === s) break;
    s = next;
  }
  return shape;
}

// How each tier of puzzle is built. size: how much bigger than a normal level
// at the same point; cap: the largest it gets; then how full, how long the
// arrows run, how hard the generator pushes for interlocking arrows (see
// score()), and how often each special piece turns up.
const TIERS = {
  normal: { size: 0, cap: 12, fill: 0.93, maxLen: 12, choices: 5, chain: 1.5, rim: 3, candidates: 3, free: 0.25, odds: 0.4, markers: 2, edges: 3 },
  hard: { size: 1, cap: 13, fill: 0.97, maxLen: 12, choices: 8, chain: 2, rim: 4, candidates: 4, free: 0.15, odds: 0.6, markers: 2, edges: 3 },
  super: { size: 3, cap: 14, fill: 0.985, maxLen: 13, choices: 10, chain: 2.6, rim: 5, candidates: 3, free: 0.08, odds: 0.85, markers: 3, edges: 4 },
  mega: { size: 8, cap: 22, fill: 0.97, maxLen: 14, choices: 6, chain: 2.6, rim: 5, candidates: 1, free: 0.03, odds: 0.9, markers: 4, edges: 5 },
  giga: { size: 14, cap: 30, fill: 0.96, maxLen: 14, choices: 4, chain: 2.4, rim: 5, candidates: 1, free: 0.03, odds: 0.95, markers: 5, edges: 5 },
  huge: { size: 0, cap: 90, fill: 0.95, maxLen: 14, choices: 4, chain: 2.4, rim: 4, candidates: 1, free: 0.03, odds: 0.85, markers: 14, edges: 10 },
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
    // Make the first Huge puzzle big enough for about 2,500 short arrows,
    // growing 10% per puzzle up to about 5,000 (measured: size 44 gives
    // ~2,150 on average across the shape families, and the count grows with
    // the square of the size). Joining them into long arrows (see entwine())
    // leaves about two thirds as many.
    const target = Math.min(5000, 2500 * (1 + 0.1 * (n - 1)));
    size = Math.round(44 * Math.sqrt(target / 2150));
  }
  size = Math.max(3, Math.min(tt.cap, size));

  // Plain boxes early on; after that, about half the time something fancier.
  let shape;
  if ((main && n <= 2) || intro) shape = boxShape([size, size, size]);
  else if (main && n === 3) shape = boxShape([4, 5, 1]);
  else if (big) {
    // A plain box, sized by how much surface it has.
    shape = sizedShape(mix(n, m, 0x5a9e), 'box', 7 * size * size);
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
    // The giant puzzles' big faces: try every way out for a new arrow, and
    // look at more spots for it, so they fill up.
    anyWay: big,
    samples: big ? 20 : 6,
    // Joining arrows into long ones (see entwine()): the longest an arrow
    // gets, and how short an arrow must be to get joined onto a neighbour
    // even when that frees nothing. On the giant puzzles arrows also grow
    // into empty cells, and two-way arrows can become one-way.
    join: !early,
    joinLen: young ? size + 4 : big ? 50 : Math.round(2.5 * size) + 2,
    shortLen: big ? 14 : 3,
    grow: big,
    joinBudget: 4000,
    joinTrials: 400,
    blue: 0, purple: 0, two: 0, fork: 0, yellow: 0,
  };
  const has = (k) => !main || n >= INTRO[k];
  const p = tt.odds;
  const upTo = (k) => 1 + ((R() * k) | 0);
  if (has('blue')) spec.blue = chance(p) ? upTo(tt.markers) : 0;
  if (has('two')) spec.two = chance(p + 0.1) ? 0.08 + R() * 0.12 : 0;
  if (has('yellow')) spec.yellow = chance(p) ? upTo(tt.edges) : 0;
  // A box has only twelve edges, and every arrow aimed at a yellow one goes
  // round onto the next side instead of leaving: too many, and arrows can
  // hardly get off the shape at all.
  if (big) spec.yellow = Math.min(spec.yellow, 2);
  // Two-way arrows have two chances to be free, so the giant puzzles have fewer.
  if (big) spec.two = Math.min(spec.two, 0.1);
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
  const seedOf = (attempt) => (big ? mix(n, m, attempt, GEN_VERSION, BIG_SEED) : mix(n, m, attempt, GEN_VERSION));
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
  const topo = topoOf(level.shape);
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
  const topo = topoOf(level.shape);
  const { nbCell, nbDir, planeOf } = topo;
  const pieces = level.pieces.map((p) => ({ ...p }));
  const P = pieces.length;
  const board = new Board(topo, level);
  const purple = board.purples.length > 0;
  // (A level that can already get stuck is going to be thrown away.)
  if (purple && board.findDeadEnd(spec.joinBudget) !== false) return;
  const occ = board.occ.slice();
  const alive = new Uint8Array(P).fill(1);
  const len = (i) => pieces[i].cells.length;
  const markers = level.redirectors.map((r) => r.cell);
  // Cells no arrow is on yet, that one could go on.
  const hidden = hiddenOf(topo), marked = new Uint8Array(topo.N);
  for (const c of markers) marked[c] = 1;
  const empty = (c) => occ[c] < 0 && !marked[c] && !hidden[c];

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
  const rays = pieces.map((p, i) => raysOf(i, p));
  const waysOf = (i) => rays[i].map((cells) => {
    if (!cells) return null;
    const out = [];
    for (const c of cells) if (occ[c] >= 0 && occ[c] !== i && !out.includes(occ[c])) out.push(occ[c]);
    return out;
  });
  const ways = pieces.map((p, i) => waysOf(i));
  const isFree = (w) => w.some((l) => l && !l.length);
  let free = ways.filter(isFree).length;
  // crossers[c]: the arrows with a way out over cell c.
  const crossers = Array.from({ length: topo.N }, () => []);
  const index = (id, rs, add) => {
    for (const cells of rs) {
      if (!cells) continue;
      for (const c of cells) {
        if (add) crossers[c].push(id);
        else crossers[c] = crossers[c].filter((i) => i !== id);
      }
    }
  };
  pieces.forEach((p, i) => index(i, rays[i], true));

  // An order to clear the arrows in: ord[i] is when arrow i goes, once the
  // arrows need[i] on its way out have gone (that's its way cw[i]; a two-way
  // arrow only needs one of its two). Without purple markers the level works
  // exactly when there is such an order, and after a change only the arrows
  // around the ones it touched need to shuffle along (Pearce and Kelly's
  // way of keeping a topological order up to date).
  const ord = new Float64Array(P), cw = new Int8Array(P), need = new Array(P), deps = Array.from({ length: P }, () => []);
  if (!purple) {
    // Clear whatever can go until nothing can, noting the order.
    const left = ways.map((w) => w.map((l) => (l ? l.length : -1)));
    const users = Array.from({ length: P }, () => []);
    ways.forEach((w, i) => w.forEach((l, k) => { if (l) for (const j of l) users[j].push([i, k]); }));
    const queue = [];
    let at = 0;
    const go = (i, k) => { ord[i] = at++; cw[i] = k; need[i] = ways[i][k]; queue.push(i); };
    left.forEach((l, i) => { if (l.includes(0)) go(i, l.indexOf(0)); });
    while (queue.length) {
      for (const [i, k] of users[queue.pop()]) if (--left[i][k] === 0 && !need[i]) go(i, k);
    }
    if (at < P) return; // (Can't happen: levels are built to be solvable.)
    need.forEach((l, i) => { for (const j of l) deps[j].push(i); });
  }

  // Make arrow t wait for arrow j, moving arrows along in the order if need
  // be (noting each move in `moved`). False if j already waits for t.
  function link(j, t, moved) {
    if (ord[j] < ord[t]) return true;
    const later = [], earlier = [], seen = new Set([t, j]);
    for (const stack = [t]; stack.length;) {
      const u = stack.pop();
      later.push(u);
      for (const v of deps[u]) {
        if (v === j) return false;
        if (!seen.has(v) && ord[v] < ord[j]) { seen.add(v); stack.push(v); }
      }
    }
    for (const stack = [j]; stack.length;) {
      const u = stack.pop();
      earlier.push(u);
      for (const v of need[u]) if (!seen.has(v) && ord[v] > ord[t]) { seen.add(v); stack.push(v); }
    }
    const slots = later.concat(earlier).map((i) => ord[i]).sort((a, b) => a - b);
    const byOrd = (a, b) => ord[a] - ord[b];
    earlier.sort(byOrd).concat(later.sort(byOrd)).forEach((i, k) => { moved.push(i, ord[i]); ord[i] = slots[k]; });
    return true;
  }

  // After a change, re-attach the touched arrows to the arrows they now wait
  // for. Returns false (with everything put back) if that makes a loop.
  function relink(touched) {
    const moved = [], before = [];
    const unhook = (t) => {
      for (const j of need[t]) deps[j] = deps[j].filter((i) => i !== t);
      need[t] = [];
    };
    for (const t of touched) { before.push([t, need[t], cw[t]]); unhook(t); }
    for (const t of touched) {
      if (!alive[t]) continue;
      let linked = false;
      for (const k of [cw[t], 1 - cw[t]]) {
        if (!ways[t][k]) continue;
        linked = ways[t][k].every((j) => {
          if (!link(j, t, moved)) return false;
          need[t].push(j);
          deps[j].push(t);
          return true;
        });
        if (linked) { cw[t] = k; break; }
        unhook(t);
      }
      if (linked) continue;
      for (const u of touched) unhook(u);
      for (const [u, l, k] of before) { need[u] = l; cw[u] = k; for (const j of l) deps[j].push(u); }
      for (let k = moved.length - 2; k >= 0; k -= 2) ord[moved[k]] = moved[k + 1];
      return false;
    }
    return true;
  }

  // Give some arrows new cells (null removes the arrow), and maybe a new kind.
  // Keeps the change and returns true if `accept(arrows free before, after)`
  // agrees and the level still works; otherwise puts everything back.
  let purpleTrials = 0;
  function change(edits, accept) {
    const touched = new Set(), oldOcc = [], old = edits.map(([id]) => [id, rays[id]]), oldWays = new Map();
    const take = (c, id) => {
      oldOcc.push(c, occ[c]);
      occ[c] = id;
      for (const i of crossers[c]) touched.add(i);
    };
    // Only the arrows being changed, and those with a way out over a cell
    // that changes hands, can come out differently.
    for (const [id] of edits) {
      touched.add(id);
      for (const c of pieces[id].cells) take(c, -1);
    }
    let ok = true;
    for (const [id, cells, kind = pieces[id].kind] of edits) {
      if (!cells) { alive[id] = 0; continue; }
      for (const c of cells) take(c, id);
      rays[id] = raysOf(id, { ...pieces[id], cells, kind });
      if (!rays[id].some(Boolean)) ok = false;
    }
    let f = free;
    if (ok) {
      for (const i of touched) {
        oldWays.set(i, ways[i]);
        if (isFree(ways[i])) f--;
        ways[i] = alive[i] ? waysOf(i) : null;
        if (ways[i] && isFree(ways[i])) f++;
      }
      ok = accept(free, f);
    }
    // Every marker must still be on some arrow's way out.
    for (const c of ok ? markers : []) {
      if (crossers[c].some((i) => !touched.has(i))) continue;
      if (![...touched].some((i) => alive[i] && rays[i].some((cells) => cells && cells.includes(c)))) { ok = false; break; }
    }
    if (ok && purple) {
      const now = new Map(edits.map(([id, cells, kind = pieces[id].kind]) => [id, { cells, kind }]));
      const trial = { ...level, pieces: pieces.map((p, i) => (now.has(i) ? { ...p, ...now.get(i) } : p)).filter((p, i) => alive[i]) };
      ok = ++purpleTrials <= spec.joinTrials && new Board(topo, trial).findDeadEnd(spec.joinBudget) === false;
    } else if (ok) ok = relink(touched);
    if (!ok) {
      for (const [i, w] of oldWays) ways[i] = w;
      for (let k = oldOcc.length - 2; k >= 0; k -= 2) occ[oldOcc[k]] = oldOcc[k + 1];
      for (const [id, rs] of old) { rays[id] = rs; alive[id] = 1; }
      return false;
    }
    for (const [id, rs] of old) index(id, rs, false);
    for (const [id, cells, kind] of edits) {
      if (!cells) continue;
      pieces[id].cells = cells;
      if (kind !== undefined) pieces[id].kind = kind;
      index(id, rays[id], true);
    }
    free = f;
    return true;
  }

  const rev = (a) => a.slice().reverse();
  const fits = (cells) => cells.length <= spec.joinLen;
  // Ways arrow x (with its end e touching cell z) could be worked into the
  // arrow on z. Each is a list of edits.
  function mergesAt(x, e, z) {
    const y = occ[z], out = [];
    if (y < 0 || y === x || pieces[y].kind !== NORMAL) return out;
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
  // Ways arrow x could grow from its end e into empty cells (one to three in
  // a straight line), its head moving to the far end of them: that way it
  // often reaches round an edge and points into the crowd on the next side.
  function growsAt(x, e) {
    const X = pieces[x].cells, xc = e === X[X.length - 1] ? X : rev(X), out = [], path = [];
    for (let k = 0; k < 4; k++) {
      path.length = 0;
      for (let c = nbCell[e * 4 + k], d = nbDir[e * 4 + k]; path.length < 3 && empty(c) && !path.includes(c);) {
        path.push(c);
        if (fits(xc.concat(path))) out.push([[x, xc.concat(path)]]);
        const step = c * 4 + d;
        c = nbCell[step];
        d = nbDir[step];
      }
    }
    return out;
  }
  // Every merge at either end of arrow x, scored by `rate`, best first.
  function movesFor(x, rate) {
    const X = pieces[x].cells, moves = [];
    for (const e of [X[0], X[X.length - 1]]) {
      for (let k = 0; k < 4; k++) {
        const z = nbCell[e * 4 + k];
        for (const m of mergesAt(x, e, z)) {
          const s = rate(m, e, z);
          if (s !== null) moves.push([s, m]);
        }
      }
    }
    return moves.sort((a, b) => b[0] - a[0]).map((m) => m[1]);
  }

  // Take away free arrows. Joining round an edge and joining whole arrows
  // are tried first.
  const fewer = (before, after) => after < before;
  const lead = (m, e, z) => R() + 1 + (planeOf[z] !== planeOf[e] ? 0.5 : 0) + (m[1][1] ? 0 : 1);
  for (let pass = 0, again = true; again && pass < 3; pass++) {
    again = false;
    for (const x of shuffle(R, [...Array(P).keys()])) {
      if (!alive[x] || !isFree(ways[x])) continue;
      const X = pieces[x].cells;
      let moves;
      if (pieces[x].kind === NORMAL) {
        moves = [[[x, rev(X)]], ...movesFor(x, lead)];
        if (spec.grow) moves.push(...growsAt(x, X[X.length - 1]), ...growsAt(x, X[0]));
      } else if (pieces[x].kind === TWO_WAY && spec.grow) {
        // A two-way arrow with one end clear is free: keep just its other
        // end, or make it a one-way arrow joined or grown as above.
        moves = [[[x, X, NORMAL]], [[x, rev(X), NORMAL]], ...movesFor(x, lead), ...growsAt(x, X[X.length - 1]), ...growsAt(x, X[0])];
        for (const m of moves) m[0][2] = NORMAL;
      } else continue;
      if (moves.some((m) => change(m, fewer))) again = true;
    }
  }

  // Tidy up: join very short arrows onto a neighbour, if no more arrows end
  // up free.
  const noWorse = (before, after) => after <= before;
  const tidy = (m) => (!m[1][1] || m[1][1].length > spec.shortLen ? R() : null);
  for (const x of shuffle(R, [...Array(P).keys()])) {
    if (!alive[x] || pieces[x].kind !== NORMAL || len(x) > spec.shortLen) continue;
    movesFor(x, tidy).some((m) => change(m, noWorse));
  }

  // Grow tails into the empty cells behind them: longer arrows, in the way
  // of more arrows, and fewer bare patches.
  if (spec.grow) {
    for (const x of shuffle(R, [...Array(P).keys()])) {
      for (let grew = true; grew && alive[x] && pieces[x].kind === NORMAL && len(x) < spec.joinLen;) {
        const X = pieces[x].cells;
        grew = false;
        for (let k = 0; k < 4 && !grew; k++) {
          const c = nbCell[X[0] * 4 + k];
          if (empty(c)) grew = change([[x, [c].concat(X)]], noWorse);
        }
      }
    }
  }
  level.pieces = pieces.filter((p, i) => alive[i]);
  const after = new Board(topo, level);
  level.wraps = after.pieces.reduce((n, p) => n + after.simulate(p.id, p.options[0], IGNORE).wraps, 0);
}

// Independent check of a finished level: searches every order of taps and
// fails if any of them can leave the player stuck. (No dead ends anywhere
// also proves the level can be finished.)
export function checkLevel(level, spec = null, opts = {}) {
  const topo = topoOf(level.shape);
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
  const topo = topoOf(spec.shape);
  const { N, nbCell, nbDir, nbType, nbEdge, planeOf, gi, gj } = topo;
  const B = new Board(topo, {});
  const placed = [];
  const uses = new Map();
  let wraps = 0, covered = 0;

  // Faces deep in a gap too narrow to see into get no arrows, markers or
  // yellow edges: you couldn't see or tap them.
  const hidden = hiddenOf(topo);
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
    for (let t = 0, seen = 0; t < 60 && seen < spec.samples; t++) {
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
    let ray = probeRay(hd[0], hd[1]);
    // (On the giant puzzles' big faces most ways are soon blocked, so try the others too.)
    for (let k = 1; !ray && spec.anyWay && k < 4; k++) ray = probeRay(hd[0], (hd[1] = (hd[1] + 1) & 3));
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
    // Gaps are small, so aim short (entwine() joins short arrows up later).
    const want = 2 + ri(Math.max(1, Math.min(spec.maxLen, 6) - 1));
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
  // (The giant puzzles give up sooner: the last stretch of tries there takes
  // seconds and hardly adds an arrow.)
  const maxFails = 40 + (BIG_TIERS.has(spec.tier) ? N >> 4 : N >> 2);
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
