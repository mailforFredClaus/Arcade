// Nonogram: the rules, a line-by-line solver, the hint finder and the
// picture maker.
//
// A puzzle is a picture: some squares filled, the rest empty. Each row and
// column has a clue listing its runs of filled squares, in order. Puzzles are
// made from their number (same number, same puzzle, on every device): a
// picture is drawn, then a solver that only ever works one line at a time
// (the way a person does) tries to rebuild it from the clues alone. If it
// gets stuck, a square in the part it couldn't work out is flipped and it
// tries again, until the clues lead all the way to the picture with no
// guessing. Getting there by logic alone also proves it's the only answer.

import { picture } from './pictures.js';

export const GEN_VERSION = 2;
export const MODES = ['easy', 'medium', 'hard', 'huge'];
export const SIZES = {
  easy: { cols: 10, rows: 10 },
  medium: { cols: 15, rows: 15 },
  hard: { cols: 20, rows: 20 },
  huge: { cols: 25, rows: 25 },
};

// What's known about a square.
export const UNKNOWN = 0, FILL = 1, EMPTY = 2;

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

// ---- clues -------------------------------------------------------------------------

// The runs of filled squares in a line ([] for an empty line).
export function runsOf(cells) {
  const out = [];
  let run = 0;
  for (const v of cells) {
    if (v) run++;
    else if (run) { out.push(run); run = 0; }
  }
  if (run) out.push(run);
  return out;
}

export const rowOf = (grid, cols, r) => Array.from({ length: cols }, (_, c) => grid[r * cols + c]);
export const colOf = (grid, cols, rows, c) => Array.from({ length: rows }, (_, r) => grid[r * cols + c]);

export function cluesFor(solution, cols, rows) {
  const rowClues = [], colClues = [];
  for (let r = 0; r < rows; r++) rowClues.push(runsOf(rowOf(solution, cols, r)));
  for (let c = 0; c < cols; c++) colClues.push(runsOf(colOf(solution, cols, rows, c)));
  return { rowClues, colClues };
}

// ---- solving one line ------------------------------------------------------------------

let FW = new Uint8Array(2048), BW = new Uint8Array(2048);
let COVER = new Int32Array(128), CAN_E = new Uint8Array(128), EPRE = new Int32Array(130);

// Works out what it can about one line. line holds what's known (UNKNOWN,
// FILL or EMPTY for each square) and clue the runs. Every way of laying the
// runs out that agrees with what's known is considered at once (counted
// with a table rather than one by one), and each square that comes out the
// same in all of them goes into out; the rest are UNKNOWN. Returns false if
// the runs can't be laid out at all.
export function solveLine(clue, line, out) {
  const n = line.length, k = clue.length, m = n + 1, W = m + 1;
  const size = (k + 1) * W;
  if (FW.length < size) { FW = new Uint8Array(size * 2); BW = new Uint8Array(size * 2); }
  if (COVER.length < n + 2) { COVER = new Int32Array(n * 2 + 4); CAN_E = new Uint8Array(n * 2 + 4); EPRE = new Int32Array(n * 2 + 6); }
  // EPRE[i]: how many squares in [0, i) are known to be empty. The line gets
  // one extra empty square at the end, so every run has a gap after it.
  EPRE[0] = 0;
  for (let i = 0; i < n; i++) EPRE[i + 1] = EPRE[i] + (line[i] === EMPTY ? 1 : 0);
  const filled = (i) => i < n && line[i] === FILL;
  const fits = (s, b) => s + b < m && EPRE[s + b] - EPRE[s] === 0 && !filled(s + b);
  // FW[j][i]: the first i squares can hold the first j runs (ending in a gap).
  FW.fill(0, 0, size);
  FW[0] = 1;
  for (let j = 0; j <= k; j++) {
    const at = j * W;
    for (let i = 0; i < m; i++) {
      if (!FW[at + i]) continue;
      if (!filled(i)) FW[at + i + 1] = 1;
      if (j < k && fits(i, clue[j])) FW[at + W + i + clue[j] + 1] = 1;
    }
  }
  if (!FW[k * W + m]) return false;
  // BW[j][i]: the squares from i on can hold runs j onwards.
  BW.fill(0, 0, size);
  BW[k * W + m] = 1;
  for (let j = k; j >= 0; j--) {
    const at = j * W;
    for (let i = m - 1; i >= 0; i--) {
      if ((!filled(i) && BW[at + i + 1]) || (j < k && fits(i, clue[j]) && BW[at + W + i + clue[j] + 1])) BW[at + i] = 1;
    }
  }
  // Which squares some layout fills, and which some layout leaves empty.
  COVER.fill(0, 0, n + 2);
  CAN_E.fill(0, 0, n + 1);
  for (let j = 0; j <= k; j++) {
    const at = j * W;
    for (let i = 0; i < n; i++) {
      if (!FW[at + i]) continue;
      if (!filled(i) && BW[at + i + 1]) CAN_E[i] = 1;
      if (j < k && fits(i, clue[j]) && BW[at + W + i + clue[j] + 1]) {
        COVER[i]++;
        COVER[i + clue[j]]--;
        if (i + clue[j] < n) CAN_E[i + clue[j]] = 1;
      }
    }
  }
  let cover = 0;
  for (let i = 0; i < n; i++) {
    cover += COVER[i];
    const f = cover > 0, e = CAN_E[i] === 1;
    out[i] = f && !e ? FILL : e && !f ? EMPTY : UNKNOWN;
  }
  return true;
}

// The runs pushed as far left as they'll go (start of each run), agreeing
// with what's known. null if they don't fit at all.
export function leftmost(clue, line) {
  const n = line.length, k = clue.length;
  const starts = [];
  // Greedy, with a check that the rest can still be laid out after each run.
  const tail = (j, from) => {
    if (j === k) {
      for (let i = from; i < n; i++) if (line[i] === FILL) return false;
      return true;
    }
    const probe = line.slice(from);
    return probe.length >= 0 && solveLine(clue.slice(j), probe, new Uint8Array(probe.length));
  };
  let from = 0;
  for (let j = 0; j < k; j++) {
    const b = clue[j];
    let placed = false;
    for (let s = from; s + b <= n; s++) {
      // No filled square may be skipped over before the run.
      let skip = false;
      for (let i = from; i < s; i++) if (line[i] === FILL) { skip = true; break; }
      if (skip) break;
      let ok = s + b === n || line[s + b] !== FILL;
      for (let i = s; ok && i < s + b; i++) if (line[i] === EMPTY) ok = false;
      if (ok && tail(j + 1, Math.min(n, s + b + 1))) {
        starts.push(s);
        from = s + b + 1;
        placed = true;
        break;
      }
    }
    if (!placed) return null;
  }
  if (!k) for (let i = 0; i < n; i++) if (line[i] === FILL) return null;
  return starts;
}

export function rightmost(clue, line) {
  const n = line.length;
  const flipped = leftmost(clue.slice().reverse(), line.slice().reverse());
  if (!flipped) return null;
  return flipped.reverse().map((s, j) => n - s - clue[j]);
}

// ---- solving the whole grid ------------------------------------------------------------

// Solves as far as line-by-line logic goes, from an empty grid or from what's
// already known (start). Returns the grid (UNKNOWN where it got stuck),
// whether it got all of it, and how many sweeps it took: all the rows, then
// all the columns, then rows again..., counting the ones that found
// something. More sweeps means a puzzle you have to keep going back and
// forth over, which is a fair measure of how hard it is.
export function solve(p, start = null) {
  const { cols, rows, rowClues, colClues } = p;
  const grid = start ? Uint8Array.from(start) : new Uint8Array(cols * rows);
  const rowDirty = new Uint8Array(rows).fill(1), colDirty = new Uint8Array(cols).fill(1);
  const lr = new Uint8Array(cols), or = new Uint8Array(cols);
  const lc = new Uint8Array(rows), oc = new Uint8Array(rows);
  let sweeps = 0, ok = true, lines = 0;
  for (;;) {
    let rowsFound = false, colsFound = false;
    for (let r = 0; r < rows && ok; r++) {
      if (!rowDirty[r]) continue;
      rowDirty[r] = 0;
      for (let c = 0; c < cols; c++) lr[c] = grid[r * cols + c];
      lines++;
      if (!solveLine(rowClues[r], lr, or)) { ok = false; break; }
      for (let c = 0; c < cols; c++) {
        if (or[c] && !lr[c]) { grid[r * cols + c] = or[c]; colDirty[c] = 1; rowsFound = true; }
      }
    }
    if (rowsFound) sweeps++;
    for (let c = 0; c < cols && ok; c++) {
      if (!colDirty[c]) continue;
      colDirty[c] = 0;
      for (let r = 0; r < rows; r++) lc[r] = grid[r * cols + c];
      lines++;
      if (!solveLine(colClues[c], lc, oc)) { ok = false; break; }
      for (let r = 0; r < rows; r++) {
        if (oc[r] && !lc[r]) { grid[r * cols + c] = oc[r]; rowDirty[r] = 1; colsFound = true; }
      }
    }
    if (colsFound) sweeps++;
    if (!ok || (!rowsFound && !colsFound)) break;
  }
  const solved = ok && grid.every((v) => v !== UNKNOWN);
  return { grid, solved, ok, sweeps, lines };
}

// ---- hints ---------------------------------------------------------------------------

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

// Which run covers square i in a layout given by run starts (-1 if none),
// and how many runs end before it.
function runAt(starts, clue, i) {
  for (let j = 0; j < starts.length; j++) if (i >= starts[j] && i < starts[j] + clue[j]) return j;
  return -1;
}
function runsBefore(starts, clue, i) {
  let n = 0;
  for (let j = 0; j < starts.length; j++) if (starts[j] + clue[j] <= i) n++;
  return n;
}

// Why square i of a line must be v, in a few plain words. Also how simple
// that reasoning is (lower is simpler), to pick the friendliest hint.
function reason(clue, line, i, v) {
  const n = line.length;
  if (!clue.length) return { rank: 0, text: ' is empty: its clue is 0.' };
  const total = clue.reduce((s, b) => s + b, 0) + clue.length - 1;
  if (total === n) return { rank: 1, text: v === FILL ? ': its runs fill the whole line, with one gap between each.' : ': its runs fill the whole line, and this is one of the gaps between them.' };
  if (v === EMPTY) {
    const done = runsOf(line.map((s) => (s === FILL ? 1 : 0)));
    if (done.length === clue.length && done.every((b, j) => b === clue[j])) return { rank: 2, text: ' has all its runs, so the rest of it is empty.' };
  }
  const L = leftmost(clue, line), R = rightmost(clue, line);
  const known = line.some((s) => s !== UNKNOWN);
  if (L && R && v === FILL) {
    const a = runAt(L, clue, i), b = runAt(R, clue, i);
    if (a >= 0 && a === b) {
      const same = clue.filter((x) => x === clue[a]).length;
      const which = same > 1 ? `the ${ORD[clue.slice(0, a).filter((x) => x === clue[a]).length] || 'next'} ${clue[a]}` : `the ${clue[a]}`;
      return { rank: known ? 4 : 3, text: `: ${which} has to cover this square, wherever it goes.` };
    }
  }
  if (L && R && v === EMPTY && runAt(L, clue, i) < 0 && runAt(R, clue, i) < 0 && runsBefore(L, clue, i) === runsBefore(R, clue, i)) {
    return { rank: 4, text: ': none of its runs can reach this square.' };
  }
  return { rank: 5, text: v === FILL ? ': every way its runs can fit fills this square.' : ': every way its runs can fit leaves this square empty.' };
}

// The next square that logic can prove, from what's known (known: the
// player's marks that are right). Returns { cell, value, kind: 'row' or
// 'col', index, why } or null if there's nothing left to find.
export function nextStep(p, known) {
  const { cols, rows, rowClues, colClues } = p;
  let best = null;
  const consider = (kind, index, clue, line, toCell) => {
    const out = new Uint8Array(line.length);
    if (!solveLine(clue, line, out)) return;
    const found = [];
    for (let i = 0; i < line.length; i++) if (out[i] && !line[i]) found.push(i);
    if (!found.length) return;
    // Within a line, a square to fill beats one to cross, and the middle of
    // a run beats its edge.
    const fills = found.filter((i) => out[i] === FILL);
    const pool = fills.length ? fills : found;
    const i = pool[Math.floor((pool.length - 1) / 2)];
    const r = reason(clue, line, i, out[i]);
    const score = (out[i] === FILL ? 0 : 100) + r.rank * 10 - Math.min(9, found.length);
    if (!best || score < best.score) best = { score, cell: toCell(i), value: out[i], kind, index, why: r.text };
  };
  for (let r = 0; r < rows; r++) {
    consider('row', r, rowClues[r], Array.from({ length: cols }, (_, c) => known[r * cols + c]), (i) => r * cols + i);
  }
  for (let c = 0; c < cols; c++) {
    consider('col', c, colClues[c], Array.from({ length: rows }, (_, r) => known[r * cols + c]), (i) => i * cols + c);
  }
  if (!best) return null;
  const name = best.kind === 'row' ? `Row ${best.index + 1}` : `Column ${best.index + 1}`;
  return { cell: best.cell, value: best.value, kind: best.kind, index: best.index, why: `${name}${best.why}` };
}

// Which clue numbers of a line are done, from the player's marks (FILL or
// EMPTY; anything else counts as not known yet). A run counts once it's
// closed off at both ends, working in from either end of the line; the whole
// line counts when its filled squares match the clue exactly.
export function doneRuns(clue, line) {
  const k = clue.length, done = new Array(k).fill(false);
  const runs = runsOf(line.map((s) => (s === FILL ? 1 : 0)));
  if (runs.length === k && runs.every((b, j) => b === clue[j])) return done.fill(true);
  const walk = (cells, order) => {
    let j = 0, run = 0;
    for (let i = 0; i <= cells.length && j < k; i++) {
      const s = i < cells.length ? cells[i] : EMPTY;
      if (s === FILL) run++;
      else if (s === EMPTY) {
        if (run) {
          if (run !== clue[order(j)]) return;
          done[order(j)] = true;
          j++;
          run = 0;
        }
      } else return;
    }
  };
  walk(line, (j) => j);
  walk(line.slice().reverse(), (j) => k - 1 - j);
  return done;
}

// ---- making puzzles --------------------------------------------------------------------

// Which kind of picture each puzzle gets, in turn. Easy puzzles are mostly
// hand-drawn icons, with a critter or a badge every third one.
const CYCLE = {
  easy: ['icon', 'icon', 'critter', 'icon', 'icon', 'emblem'],
  medium: ['landscape', 'critter', 'emblem', 'island', 'landscape', 'emblem', 'critter', 'quilt'],
  hard: ['landscape', 'emblem', 'critter', 'island', 'quilt', 'landscape', 'critter', 'emblem'],
  huge: ['landscape', 'island', 'emblem', 'critter', 'quilt', 'landscape', 'emblem', 'island'],
};

const DENSITY = { easy: [0.4, 0.75], medium: [0.4, 0.7], hard: [0.4, 0.68], huge: [0.4, 0.68] };
// How many sweeps a puzzle should take, at least, to be worth its mode.
const SWEEPS = { easy: 0, medium: 5, hard: 7, huge: 9 };

const density = (grid) => grid.reduce((s, v) => s + v, 0) / grid.length;

// Flip the square that most stands out from its neighbours (the picture
// barely changes), keeping the picture mirrored if it was. Only squares the
// solver couldn't work out are picked: those are where the clues fall short.
function fixOne(pic, unknown, cols, rows, R, keepSym) {
  const { grid } = pic;
  let best = -1, bestScore = -Infinity;
  const tries = Math.min(unknown.length, 40);
  for (let t = 0; t < tries; t++) {
    const i = unknown[(R() * unknown.length) | 0];
    const r = (i / cols) | 0, c = i % cols;
    let same = 0, diff = 0;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr, cc = c + dc;
      const v = rr < 0 || cc < 0 || rr >= rows || cc >= cols ? 0 : grid[rr * cols + cc];
      if (v === grid[i]) same++;
      else diff++;
    }
    const score = diff - same + R() * 0.5;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  const flipAt = (i) => {
    const r = (i / cols) | 0, c = i % cols;
    grid[i] ^= 1;
    if (!pic.kind) return;
    // A square that's filled now takes after a filled neighbour.
    let k = null;
    if (grid[i]) {
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < rows && cc < cols && grid[rr * cols + cc] && pic.kind[rr * cols + cc]) { k = pic.kind[rr * cols + cc]; break; }
      }
    }
    pic.kind[i] = k;
  };
  flipAt(best);
  if (keepSym && pic.sym) {
    const r = (best / cols) | 0, c = best % cols;
    const twins = new Set([r * cols + (cols - 1 - c)]);
    if (pic.sym === 'vh') { twins.add((rows - 1 - r) * cols + c); twins.add((rows - 1 - r) * cols + (cols - 1 - c)); }
    twins.delete(best);
    for (const j of twins) if (grid[j] !== grid[best]) flipAt(j);
  }
}

// Try to turn a picture into a puzzle that logic alone can solve. Returns
// the solver's result, or null if it can't be done.
function settle(pic, cols, rows, R) {
  const fixes = pic.fixed ? 0 : Math.ceil((cols * rows) / 6);
  for (let fixed = 0; ; fixed++) {
    const clues = cluesFor(pic.grid, cols, rows);
    const res = solve({ cols, rows, ...clues });
    if (res.solved) return { ...res, clues, fixes: fixed };
    if (fixed >= fixes) return null;
    const unknown = [];
    for (let i = 0; i < res.grid.length; i++) if (res.grid[i] === UNKNOWN) unknown.push(i);
    fixOne(pic, unknown, cols, rows, R, fixed < fixes / 2);
  }
}

// Make puzzle number n of a mode.
export function makePuzzle(mode, n) {
  const m = Math.max(0, MODES.indexOf(mode));
  mode = MODES[m];
  const { cols, rows } = SIZES[mode];
  const [lo, hi] = DENSITY[mode];
  const cycle = CYCLE[mode];
  const planned = cycle[(n - 1) % cycle.length];
  // Easy puzzles count through the icons in order.
  let iconNo = 0;
  if (planned === 'icon') {
    const perCycle = cycle.filter((s) => s === 'icon').length;
    iconNo = Math.floor((n - 1) / cycle.length) * perCycle + cycle.slice(0, (n - 1) % cycle.length).filter((s) => s === 'icon').length;
  }
  let fallback = null;
  for (let attempt = 0; attempt < 300; attempt++) {
    const R = rng(mix(m, n, attempt, GEN_VERSION, 0x6e6f));
    // If a style keeps failing, fall back on landscapes and critters.
    let style = planned;
    if (attempt >= 40) style = attempt % 2 ? 'critter' : mode === 'easy' ? 'emblem' : 'landscape';
    const pic = picture(style, R, cols, rows, { k: iconNo, alt: attempt });
    if (!pic.fixed) {
      const dens = density(pic.grid);
      if (dens < lo || dens > hi) continue;
    }
    const res = settle(pic, cols, rows, R);
    if (!res) continue;
    if (!pic.fixed) {
      const d2 = density(pic.grid);
      if (d2 < lo - 0.03 || d2 > hi + 0.03) continue;
      // A few blank rows or columns are fine; lots make dull clues.
      const blank = res.clues.rowClues.filter((c) => !c.length).length + res.clues.colClues.filter((c) => !c.length).length;
      if (blank > Math.ceil(cols / 4)) continue;
    }
    const colours = pic.paint(pic.grid, pic.kind || []);
    const puzzle = {
      mode, n, v: GEN_VERSION, cols, rows, style, title: pic.title || 'A picture!',
      solution: Array.from(pic.grid),
      rowClues: res.clues.rowClues, colClues: res.clues.colClues,
      fg: colours.fg, bg: colours.bg,
      sweeps: res.sweeps, fixes: res.fixes, attempt,
    };
    // Bigger modes keep looking a little for one that takes more working out.
    if (res.sweeps >= SWEEPS[mode] || pic.fixed) return puzzle;
    if (!fallback || res.sweeps > fallback.sweeps) fallback = puzzle;
    if (attempt >= 16) return fallback;
  }
  return fallback;
}
