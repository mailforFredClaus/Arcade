// Sudoku: generating puzzles with exactly one solution, and grading them by
// the techniques a person needs to solve them.
//
// Cells are numbered 0..80, row by row. A grid is 81 numbers, 0 = empty.
// Candidate sets are 9-bit masks: bit d-1 set means digit d is possible.

export const GEN_VERSION = 1;
export const MODES = ['easy', 'medium', 'hard', 'expert'];

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

// ---- geometry ----------------------------------------------------------------

export const rowOf = (i) => (i / 9) | 0;
export const colOf = (i) => i % 9;
export const boxOf = (i) => 3 * ((i / 27) | 0) + (((i % 9) / 3) | 0);

// The 27 units: rows 0-8, columns 9-17, boxes 18-26.
export const UNITS = [];
for (let r = 0; r < 9; r++) UNITS.push([...Array(9)].map((_, c) => r * 9 + c));
for (let c = 0; c < 9; c++) UNITS.push([...Array(9)].map((_, r) => r * 9 + c));
for (let b = 0; b < 9; b++) {
  const r0 = 3 * ((b / 3) | 0), c0 = 3 * (b % 3);
  UNITS.push([...Array(9)].map((_, k) => (r0 + ((k / 3) | 0)) * 9 + c0 + (k % 3)));
}
export const PEERS = [...Array(81)].map((_, i) => {
  const s = new Set([...UNITS[rowOf(i)], ...UNITS[9 + colOf(i)], ...UNITS[18 + boxOf(i)]]);
  s.delete(i);
  return [...s];
});
const UNITS_OF = [...Array(81)].map((_, i) => [rowOf(i), 9 + colOf(i), 18 + boxOf(i)]);

const ALL = 0x1ff;
const bit = (d) => 1 << (d - 1);
export const popcount = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
export const digitsOf = (m) => { const out = []; for (let d = 1; d <= 9; d++) if (m & bit(d)) out.push(d); return out; };
const lowDigit = (m) => 32 - Math.clz32(m & -m);

// ---- brute-force solver --------------------------------------------------------

// Count solutions (stopping at limit). With R, fills the grid in random
// order and leaves the first solution in `fill`.
export function countSolutions(grid, limit = 2, R = null, fill = null) {
  const g = Int8Array.from(grid);
  const rows = new Uint16Array(9), cols = new Uint16Array(9), boxes = new Uint16Array(9);
  for (let i = 0; i < 81; i++) {
    const d = g[i];
    if (!d) continue;
    const b = bit(d);
    if ((rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]) & b) return 0;
    rows[rowOf(i)] |= b; cols[colOf(i)] |= b; boxes[boxOf(i)] |= b;
  }
  let count = 0;
  const order = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const rec = () => {
    // The empty cell with the fewest options.
    let best = -1, bestMask = 0, bestN = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = ALL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]);
      const n = popcount(m);
      if (n < bestN) { best = i; bestMask = m; bestN = n; if (n <= 1) break; }
    }
    if (best < 0) {
      count++;
      if (fill && count === 1) fill.set(g);
      return count >= limit;
    }
    if (!bestMask) return false;
    const r = rowOf(best), c = colOf(best), bx = boxOf(best);
    let digits = order;
    if (R) {
      digits = order.slice();
      for (let k = 8; k > 0; k--) { const j = (R() * (k + 1)) | 0; [digits[k], digits[j]] = [digits[j], digits[k]]; }
    }
    for (const d of digits) {
      const b = bit(d);
      if (!(bestMask & b)) continue;
      g[best] = d; rows[r] |= b; cols[c] |= b; boxes[bx] |= b;
      if (rec()) return true;
      g[best] = 0; rows[r] &= ~b; cols[c] &= ~b; boxes[bx] &= ~b;
    }
    return false;
  };
  rec();
  return count;
}

export function solution(grid) {
  const fill = new Int8Array(81);
  return countSolutions(grid, 1, null, fill) ? fill : null;
}

// ---- solving like a person -------------------------------------------------------

// Techniques, from simplest to hardest. A puzzle's grade is the hardest one
// it needs.
export const TECH = {
  nakedSingle: { level: 1, name: 'only number that fits' },
  hiddenSingle: { level: 1, name: 'only place it fits' },
  locked: { level: 2, name: 'locked candidates' },
  nakedPair: { level: 3, name: 'naked pair' },
  hiddenPair: { level: 3, name: 'hidden pair' },
  nakedTriple: { level: 3, name: 'naked triple' },
  hiddenTriple: { level: 3, name: 'hidden triple' },
  xWing: { level: 4, name: 'X-Wing' },
  swordfish: { level: 4, name: 'Swordfish' },
  xyWing: { level: 4, name: 'XY-Wing' },
};

export function candidatesFor(grid) {
  const cand = new Uint16Array(81);
  for (let i = 0; i < 81; i++) {
    if (grid[i]) continue;
    let m = ALL;
    for (const p of PEERS[i]) if (grid[p]) m &= ~bit(grid[p]);
    cand[i] = m;
  }
  return cand;
}

const place = (g, cand, i, d) => {
  g[i] = d;
  cand[i] = 0;
  for (const p of PEERS[i]) cand[p] &= ~bit(d);
};

// One step of logic. Returns { tech, place: [cell, digit] } for a placement,
// { tech, removed } for eliminations, or null if stuck.
export function step(g, cand) {
  // Naked single.
  for (let i = 0; i < 81; i++) {
    if (!g[i] && cand[i] && !(cand[i] & (cand[i] - 1))) return { tech: 'nakedSingle', place: [i, lowDigit(cand[i])], unit: -1 };
  }
  // Hidden single (boxes first: easiest to see).
  for (const u of [18, 19, 20, 21, 22, 23, 24, 25, 26, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]) {
    for (let d = 1; d <= 9; d++) {
      let where = -1, n = 0;
      for (const i of UNITS[u]) if (!g[i] && cand[i] & bit(d)) { where = i; n++; }
      if (n === 1) return { tech: 'hiddenSingle', place: [where, d], unit: u };
    }
  }
  const remove = (cells, mask, tech) => {
    const removed = [];
    for (const i of cells) if (cand[i] & mask) { removed.push(i); cand[i] &= ~mask; }
    return removed.length ? { tech, removed } : null;
  };
  // Locked candidates: a digit in a box confined to one row or column
  // (pointing), or in a row or column confined to one box (claiming).
  for (let d = 1; d <= 9; d++) {
    const b = bit(d);
    for (let u = 0; u < 27; u++) {
      const cells = UNITS[u].filter((i) => !g[i] && cand[i] & b);
      if (cells.length < 2) continue;
      const others = [];
      if (u >= 18) {
        if (cells.every((i) => rowOf(i) === rowOf(cells[0]))) others.push(...UNITS[rowOf(cells[0])]);
        else if (cells.every((i) => colOf(i) === colOf(cells[0]))) others.push(...UNITS[9 + colOf(cells[0])]);
      } else if (cells.every((i) => boxOf(i) === boxOf(cells[0]))) others.push(...UNITS[18 + boxOf(cells[0])]);
      if (!others.length) continue;
      const r = remove(others.filter((i) => !cells.includes(i) && !g[i]), b, 'locked');
      if (r) return r;
    }
  }
  // Naked and hidden subsets (pairs, then triples).
  for (const size of [2, 3]) {
    for (let u = 0; u < 27; u++) {
      const empty = UNITS[u].filter((i) => !g[i]);
      if (empty.length <= size) continue;
      // Naked: `size` cells whose candidates together are just `size` digits.
      for (const combo of combos(empty, size)) {
        let m = 0;
        for (const i of combo) m |= cand[i];
        if (popcount(m) !== size) continue;
        const r = remove(empty.filter((i) => !combo.includes(i)), m, size === 2 ? 'nakedPair' : 'nakedTriple');
        if (r) return r;
      }
      // Hidden: `size` digits that only fit in the same `size` cells.
      const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => empty.some((i) => cand[i] & bit(d)));
      for (const ds of combos(digits, size)) {
        let m = 0;
        for (const d of ds) m |= bit(d);
        const cells = empty.filter((i) => cand[i] & m);
        if (cells.length !== size) continue;
        const r = remove(cells, ALL & ~m, size === 2 ? 'hiddenPair' : 'hiddenTriple');
        if (r) return r;
      }
    }
  }
  // X-Wing and Swordfish: a digit that, in `size` rows, only fits in the
  // same `size` columns (or the other way round).
  for (const size of [2, 3]) {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d);
      for (const byRow of [true, false]) {
        const lines = [];
        for (let k = 0; k < 9; k++) {
          const cells = UNITS[byRow ? k : 9 + k].filter((i) => !g[i] && cand[i] & b);
          if (cells.length >= 2 && cells.length <= size) lines.push({ k, cross: cells.map((i) => (byRow ? colOf(i) : rowOf(i))) });
        }
        for (const set of combos(lines, size)) {
          const cross = new Set(set.flatMap((l) => l.cross));
          if (cross.size !== size) continue;
          const keep = new Set(set.map((l) => l.k));
          const targets = [];
          for (const x of cross) {
            for (const i of UNITS[byRow ? 9 + x : x]) {
              if (!keep.has(byRow ? rowOf(i) : colOf(i)) && !g[i]) targets.push(i);
            }
          }
          const r = remove(targets, b, size === 2 ? 'xWing' : 'swordfish');
          if (r) return r;
        }
      }
    }
  }
  // XY-Wing: a pivot with two options AB, and two cells it sees with AC and
  // BC. Whatever the pivot is, one of them is C, so C goes from any cell
  // that sees both.
  for (let p = 0; p < 81; p++) {
    if (g[p] || popcount(cand[p]) !== 2) continue;
    const [a, b] = digitsOf(cand[p]);
    const wings = PEERS[p].filter((i) => !g[i] && popcount(cand[i]) === 2);
    for (const x of wings) {
      if (!(cand[x] & bit(a)) || cand[x] & bit(b)) continue;
      const c = cand[x] & ~bit(a);
      for (const y of wings) {
        if (cand[y] !== (bit(b) | c)) continue;
        const seenByBoth = PEERS[x].filter((i) => i !== p && !g[i] && PEERS[y].includes(i));
        const r = remove(seenByBoth, c, 'xyWing');
        if (r) return r;
      }
    }
  }
  return null;
}

function combos(arr, k, start = 0, acc = [], out = []) {
  if (acc.length === k) { out.push(acc.slice()); return out; }
  for (let i = start; i < arr.length; i++) {
    acc.push(arr[i]);
    combos(arr, k, i + 1, acc, out);
    acc.pop();
  }
  return out;
}

// Solve as far as logic goes. Returns { solved, level, used } where level is
// the hardest technique needed (0 if the grid was already full).
export function grade(grid) {
  const g = Int8Array.from(grid);
  const cand = candidatesFor(g);
  let level = 0;
  const used = {};
  for (;;) {
    const s = step(g, cand);
    if (!s) break;
    level = Math.max(level, TECH[s.tech].level);
    used[s.tech] = (used[s.tech] || 0) + 1;
    if (s.place) place(g, cand, s.place[0], s.place[1]);
  }
  return { solved: g.every((d) => d), level, used };
}

// The next cell a person could fill in by logic, and how: used for hints.
// grid holds the correct entries so far.
export function nextPlacement(grid) {
  const g = Int8Array.from(grid);
  const cand = candidatesFor(g);
  const along = [];
  for (let guard = 0; guard < 400; guard++) {
    const s = step(g, cand);
    if (!s) return null;
    if (s.place) return { cell: s.place[0], digit: s.place[1], tech: s.tech, unit: s.unit, along };
    if (!along.includes(s.tech)) along.push(s.tech);
  }
  return null;
}

// ---- puzzles -----------------------------------------------------------------------

// How many clues to aim for, and which grade a puzzle must have, per mode.
const TARGET = {
  easy: { minClues: 36, grade: [1, 1] },
  medium: { minClues: 28, grade: [2, 2] },
  hard: { minClues: 22, grade: [3, 3] },
  expert: { minClues: 17, grade: [4, 4] },
};

export function makePuzzle(mode, n) {
  const m = Math.max(0, MODES.indexOf(mode));
  const t = TARGET[MODES[m]];
  let fallback = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const R = rng(mix(m, n, attempt, GEN_VERSION, 0x5d0c));
    const full = new Int8Array(81);
    countSolutions(new Int8Array(81), 1, R, full);
    const puzzle = Int8Array.from(full);
    // Take clues away in symmetric pairs, keeping the answer unique.
    const order = [...Array(41).keys()];
    for (let k = order.length - 1; k > 0; k--) { const j = (R() * (k + 1)) | 0; [order[k], order[j]] = [order[j], order[k]]; }
    let clues = 81;
    for (const i of order) {
      const j = 80 - i;
      const drop = i === j ? 1 : 2;
      if (clues - drop < t.minClues) continue;
      const keep = [puzzle[i], puzzle[j]];
      puzzle[i] = 0;
      puzzle[j] = 0;
      if (countSolutions(puzzle, 2) !== 1) { puzzle[i] = keep[0]; puzzle[j] = keep[1]; continue; }
      // Easy and medium puzzles mustn't need anything beyond their grade.
      if (t.grade[1] <= 2) {
        const gr = grade(puzzle);
        if (!gr.solved || gr.level > t.grade[1]) { puzzle[i] = keep[0]; puzzle[j] = keep[1]; continue; }
      }
      clues -= drop;
    }
    const gr = grade(puzzle);
    if (!gr.solved) continue; // would need guessing
    const out = { mode: MODES[m], n, v: GEN_VERSION, puzzle: [...puzzle], answer: [...full], clues, level: gr.level, used: gr.used };
    if (gr.level >= t.grade[0] && gr.level <= t.grade[1]) return out;
    if (!fallback || Math.abs(gr.level - t.grade[0]) < Math.abs(fallback.level - t.grade[0])) fallback = out;
  }
  return fallback;
}
