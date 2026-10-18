// Minesweeper with no guessing: every board can be cleared by logic alone,
// starting from the open patch the game reveals for you.
//
// Boards are made from their number (same number, same board, everywhere).
// A random layout is tried with a solver that only uses deductions a person
// can make; when it gets stuck, a mine near the stuck spot is moved somewhere
// out of the way and it tries again, until the whole board can be worked out.

export const GEN_VERSION = 1;
export const MODES = ['easy', 'medium', 'hard', 'huge'];
export const SIZES = {
  easy: { cols: 9, rows: 9, mines: 10 },
  medium: { cols: 12, rows: 16, mines: 32 },
  hard: { cols: 16, rows: 30, mines: 90 },
  huge: { cols: 30, rows: 50, mines: 300 },
};

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

// Neighbour lists for a grid.
export function neighbours(cols, rows) {
  const out = [];
  for (let i = 0; i < cols * rows; i++) {
    const r = (i / cols) | 0, c = i % cols, list = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < rows && cc < cols) list.push(rr * cols + cc);
    }
    out.push(list);
  }
  return out;
}

export function counts(mines, nb) {
  return Uint8Array.from(nb, (list, i) => (mines[i] ? 9 : list.reduce((s, j) => s + mines[j], 0)));
}

// Open cell i, spreading through zeros. Returns the cells opened.
export function flood(i, num, open, nb) {
  const out = [];
  const stack = [i];
  while (stack.length) {
    const c = stack.pop();
    if (open[c]) continue;
    open[c] = 1;
    out.push(c);
    if (num[c] === 0) for (const j of nb[c]) if (!open[j]) stack.push(j);
  }
  return out;
}

// ---- the solver ------------------------------------------------------------------

// Work out as much as logic allows from the open cells. Fills `open` and
// `flag` further; returns true if every safe cell ends up open.
// Uses: a number whose mines are all found (rest safe) or whose unknowns are
// all mines; one number's unknowns sitting inside another's (the difference
// holds the difference in mines); and the mine total at the end.
// With firstSafe, it stops at the first cell it proves safe and returns
// that cell (or -1 if it can't find one).
const FOUND = { found: true };

export function solveFrom(num, open, flag, nb, mineTotal, firstSafe = false) {
  const N = num.length;
  const safeTotal = N - mineTotal;
  let opened = open.reduce((s, v) => s + v, 0);
  let found = -1;
  const openCell = (c) => {
    if (firstSafe) { found = c; throw FOUND; }
    opened += flood(c, num, open, nb).length;
  };
  try {
    return run();
  } catch (e) {
    if (e === FOUND) return found;
    throw e;
  }
  function run() {
    for (;;) {
      let progress = false;
      // Constraints from open numbers that still touch unknown cells.
      const cons = [];
      for (let i = 0; i < N; i++) {
        if (!open[i] || num[i] === 0) continue;
        const unk = [];
        let m = num[i];
        for (const j of nb[i]) {
          if (flag[j]) m--;
          else if (!open[j]) unk.push(j);
        }
        if (!unk.length) continue;
        if (m === 0) { for (const j of unk) if (!open[j]) { openCell(j); progress = true; } }
        else if (m === unk.length) { for (const j of unk) flag[j] = 1; progress = true; }
        else cons.push({ cells: unk, m });
      }
      if (progress) continue;
      // Subsets: if A's unknowns are all among B's, B's others hold B - A mines.
      const byCell = new Map();
      cons.forEach((k, idx) => k.cells.forEach((c) => { if (!byCell.has(c)) byCell.set(c, []); byCell.get(c).push(idx); }));
      outer: for (let a = 0; a < cons.length; a++) {
        const A = cons[a];
        const near = new Set();
        for (const c of A.cells) for (const b of byCell.get(c)) if (b !== a) near.add(b);
        for (const b of near) {
          const B = cons[b];
          if (A.cells.length >= B.cells.length || !A.cells.every((c) => B.cells.includes(c))) continue;
          const rest = B.cells.filter((c) => !A.cells.includes(c));
          const m = B.m - A.m;
          if (m === 0) { for (const c of rest) if (!open[c]) openCell(c); progress = true; break outer; }
          if (m === rest.length) { for (const c of rest) flag[c] = 1; progress = true; break outer; }
        }
      }
      if (progress) continue;
      // The mine total: if every mine is found, everything else is safe; if
      // the unknowns left are exactly the mines left, they're all mines.
      let flags = 0, unknown = 0;
      for (let i = 0; i < N; i++) { flags += flag[i]; if (!open[i] && !flag[i]) unknown++; }
      if (unknown && flags === mineTotal) { for (let i = 0; i < N; i++) if (!open[i] && !flag[i]) openCell(i); continue; }
      if (unknown && unknown === mineTotal - flags) { for (let i = 0; i < N; i++) if (!open[i]) flag[i] = 1; continue; }
      break;
    }
    return firstSafe ? -1 : opened === safeTotal;
  }
}

// A cell that logic says is safe right now (for hints), or -1. It works
// from the open cells only: the player's own flags might be wrong.
export function safeCell(num, open, nb, mineTotal) {
  return solveFrom(num, Uint8Array.from(open), new Uint8Array(num.length), nb, mineTotal, true);
}

// ---- boards ------------------------------------------------------------------------

export function makeBoard(mode, n) {
  const m = Math.max(0, MODES.indexOf(mode));
  const { cols, rows, mines: total } = SIZES[MODES[m]];
  const N = cols * rows;
  const nb = neighbours(cols, rows);
  for (let attempt = 0; ; attempt++) {
    const R = rng(mix(m, n, attempt, GEN_VERSION, 0x3b0b));
    // Start somewhere near the middle, with its whole neighbourhood clear.
    const sr = Math.floor(rows * (0.3 + 0.4 * R())), sc = Math.floor(cols * (0.25 + 0.5 * R()));
    const start = sr * cols + sc;
    const keepClear = new Set([start, ...nb[start]]);
    const mines = new Uint8Array(N);
    const spots = [...Array(N).keys()].filter((i) => !keepClear.has(i));
    for (let k = spots.length - 1; k > 0; k--) { const j = (R() * (k + 1)) | 0; [spots[k], spots[j]] = [spots[j], spots[k]]; }
    for (let k = 0; k < total; k++) mines[spots[k]] = 1;
    // Try to solve; when stuck, move a mine from the edge of what's known to
    // somewhere far from it, and try again.
    for (let fix = 0; fix < N * 2; fix++) {
      const num = counts(mines, nb);
      const open = new Uint8Array(N), flag = new Uint8Array(N);
      flood(start, num, open, nb);
      if (solveFrom(num, open, flag, nb, total)) {
        return { mode: MODES[m], n, v: GEN_VERSION, cols, rows, mines: total, start, layout: [...mines], fixes: fix, attempt };
      }
      // The frontier: unknown cells next to an open cell.
      const frontier = [], inner = [];
      for (let i = 0; i < N; i++) {
        if (open[i] || flag[i] || keepClear.has(i)) continue;
        (nb[i].some((j) => open[j]) ? frontier : inner).push(i);
      }
      const minesHere = frontier.filter((i) => mines[i]);
      const freeFar = inner.filter((i) => !mines[i]);
      if (!minesHere.length || !freeFar.length) break;
      const from = minesHere[(R() * minesHere.length) | 0];
      const to = freeFar[(R() * freeFar.length) | 0];
      mines[from] = 0;
      mines[to] = 1;
    }
  }
}
