// Water Sort: the rules, the level generator and a solver.
//
// A tube holds up to CAP units of liquid, listed bottom first. Pouring moves
// the run of matching colour on top of one tube onto another tube, as much as
// fits, if that tube is empty or has the same colour on top. A level is won
// when every tube is either empty or full of a single colour.
//
// Levels are dealt at random from their number (same number, same level, on
// every device) and only kept if the solver can finish them.

export const CAP = 4;
export const GEN_VERSION = 1;

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

// ---- rules -----------------------------------------------------------------

// How many units of the same colour sit on top of tube t.
export function topRun(t) {
  if (!t.length) return 0;
  const c = t[t.length - 1];
  let n = 1;
  while (n < t.length && t[t.length - 1 - n] === c) n++;
  return n;
}

export const isFull = (t, cap = CAP) => t.length === cap && topRun(t) === cap;

// How much would pour from tube a into tube b (0 if it can't).
export function pourAmount(tubes, a, b, cap = CAP) {
  if (a === b) return 0;
  const s = tubes[a], t = tubes[b];
  if (!s.length || t.length >= cap) return 0;
  if (t.length && t[t.length - 1] !== s[s.length - 1]) return 0;
  return Math.min(topRun(s), cap - t.length);
}

export function pour(tubes, a, b, n) {
  for (let i = 0; i < n; i++) tubes[b].push(tubes[a].pop());
}

export function isSolved(tubes, cap = CAP) {
  return tubes.every((t) => !t.length || isFull(t, cap));
}

// Is there any pour at all that changes something?
export function anyMove(tubes, cap = CAP) {
  for (let a = 0; a < tubes.length; a++) {
    const s = tubes[a];
    if (!s.length || isFull(s, cap)) continue;
    for (let b = 0; b < tubes.length; b++) {
      if (!pourAmount(tubes, a, b, cap)) continue;
      // Tipping a tube that holds one colour into an empty one changes nothing.
      if (!tubes[b].length && topRun(s) === s.length) continue;
      return true;
    }
  }
  return false;
}

// ---- solver ----------------------------------------------------------------

const LIMIT = { limit: true };

// Pours worth trying from here, most promising first.
function candidates(T, cap) {
  const out = [];
  let firstEmpty = -1;
  for (let b = 0; b < T.length; b++) if (!T[b].length) { firstEmpty = b; break; }
  for (let a = 0; a < T.length; a++) {
    const s = T[a];
    if (!s.length) continue;
    const run = topRun(s), uniform = run === s.length;
    if (uniform && s.length === cap) continue;
    const c = s[s.length - 1];
    for (let b = 0; b < T.length; b++) {
      if (b === a) continue;
      const t = T[b];
      if (!t.length) {
        // All empty tubes are alike; and moving a one-colour tube is pointless.
        if (b !== firstEmpty || uniform) continue;
        out.push(a, b, 1);
        continue;
      }
      if (t.length >= cap || t[t.length - 1] !== c) continue;
      const n = Math.min(run, cap - t.length);
      const tUniform = topRun(t) === t.length;
      let p;
      if (tUniform && t.length + n === cap) p = 6; // finishes a tube
      else if (n === run && tUniform) p = 5; // joins its own colour
      else if (n === run) p = 4; // moves the whole run
      else if (tUniform) p = 3;
      else p = 0; // splits a run
      // Emptying a tube is handy.
      if (n === s.length) p += 0.5;
      out.push(a, b, p);
    }
  }
  const idx = [];
  for (let i = 0; i < out.length; i += 3) idx.push(i);
  idx.sort((x, y) => out[y + 2] - out[x + 2]);
  return idx.map((i) => [out[i], out[i + 1]]);
}

const keyOf = (T) => T.map((t) => t.join('.')).sort().join('|');

// A list of pours that finishes the puzzle, null if there is none, or
// undefined if the search gave up (budget = how many positions to look at).
export function solve(start, cap = CAP, budget = 200000) {
  const T = start.map((t) => t.slice());
  const seen = new Set();
  const path = [];
  let nodes = 0;
  const dfs = () => {
    if (isSolved(T, cap)) return true;
    if (++nodes > budget) throw LIMIT;
    const k = keyOf(T);
    if (seen.has(k)) return false;
    seen.add(k);
    for (const [a, b] of candidates(T, cap)) {
      const n = Math.min(topRun(T[a]), cap - T[b].length);
      pour(T, a, b, n);
      path.push([a, b]);
      if (dfs()) return true;
      path.pop();
      for (let i = 0; i < n; i++) T[a].push(T[b].pop());
    }
    return false;
  };
  try {
    return dfs() ? path : null;
  } catch (e) {
    if (e === LIMIT) return undefined;
    throw e;
  } finally {
    solve.nodes = nodes; // how hard the last search had to work
  }
}

// ---- levels ----------------------------------------------------------------

// What a level number brings: how many colours, whether it's a hard one
// (every 10th) or a mystery one (lower layers hidden until uncovered), and
// how many deals to choose the trickiest from. Random deals vary a lot: some
// fall into place, others are full of dead ends. Later levels pick from more.
export function levelSpec(n) {
  const hard = n >= 10 && n % 10 === 0;
  const mystery = !hard && n >= 16 && n % 4 === 2;
  let colors = n <= 3 ? n + 2 : Math.min(12, 5 + Math.floor((n - 3) / 6));
  if (hard) colors = Math.min(14, colors + 2);
  const pick = n < 8 ? 1 : hard ? 10 : Math.min(8, 2 + Math.floor(n / 12));
  return { n, colors, empty: 2, cap: CAP, hard, mystery, pick };
}

// Deal a level: every colour's units shuffled into the tubes, plus empties.
// A deal only counts if it can be finished and doesn't start half done; of
// the first few that count, the one that took the solver longest wins.
export function makeLevel(n) {
  const spec = levelSpec(n);
  const { colors, empty, cap } = spec;
  let best = null;
  for (let attempt = 0, found = 0; found < spec.pick; attempt++) {
    const R = rng(mix(n, attempt, GEN_VERSION, 0x5047));
    const units = [];
    for (let c = 0; c < colors; c++) for (let k = 0; k < cap; k++) units.push(c);
    for (let i = units.length - 1; i > 0; i--) {
      const j = (R() * (i + 1)) | 0;
      [units[i], units[j]] = [units[j], units[i]];
    }
    const tubes = [];
    for (let t = 0; t < colors; t++) tubes.push(units.slice(t * cap, (t + 1) * cap));
    for (let e = 0; e < empty; e++) tubes.push([]);
    // No tube may start with three of a colour together, or the level would
    // feel half done before it starts.
    if (tubes.some((t) => t.length && topRun(t) >= 3)) continue;
    if (tubes.some((t) => t.some((c, i) => i >= 2 && c === t[i - 1] && c === t[i - 2]))) continue;
    const plan = solve(tubes, cap, 150000);
    if (!plan) continue;
    found++;
    if (best && solve.nodes <= best.effort) continue;
    // The colours are shuffled too, so the same colour isn't always first.
    const palette = [...Array(PALETTE.length).keys()];
    for (let i = palette.length - 1; i > 0; i--) {
      const j = (R() * (i + 1)) | 0;
      [palette[i], palette[j]] = [palette[j], palette[i]];
    }
    best = { ...spec, v: GEN_VERSION, tubes: tubes.map((t) => t.map((c) => palette[c])), plan: plan.length, effort: solve.nodes };
  }
  return best;
}

// Liquid colours, picked to stay distinct from each other.
export const PALETTE = [
  '#e8413c', // red
  '#ff9a1f', // orange
  '#ffd93b', // yellow
  '#86d64a', // lime
  '#1f9d55', // green
  '#22c3b4', // teal
  '#5ec8ff', // sky
  '#2f5bd9', // blue
  '#8e4ad8', // purple
  '#f26bb5', // pink
  '#8a5a2e', // brown
  '#9aa4b1', // grey
  '#c9a8ff', // lilac
  '#a3213f', // wine
];
