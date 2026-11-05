// Generates Nonogram puzzles and checks each one: the clues match the
// picture, it can be solved line by line with no guessing, it has exactly
// one answer (checked a second, independent way on the smaller sizes), the
// hints can walk all the way through it, and the same number always gives
// the same puzzle.
// Usage: node tools/test-nonogram.mjs [count per size]

import { MODES, SIZES, makePuzzle, solve, cluesFor, nextStep, UNKNOWN, FILL, EMPTY } from '../games/nonogram/js/logic.js';
import { ICONS } from '../games/nonogram/js/pictures.js';

const count = Number(process.argv[2] || 30);
let failures = 0;

// Every way to lay a clue's runs out in a line of n squares.
function layouts(clue, n) {
  const out = [];
  const go = (j, from, line) => {
    if (j === clue.length) { out.push(line.slice()); return; }
    const rest = clue.slice(j + 1).reduce((s, b) => s + b + 1, 0);
    for (let s = from; s + clue[j] + rest <= n; s++) {
      for (let i = s; i < s + clue[j]; i++) line[i] = 1;
      go(j + 1, s + clue[j] + 1, line);
      for (let i = s; i < s + clue[j]; i++) line[i] = 0;
    }
  };
  go(0, 0, new Array(n).fill(0));
  return out;
}

// Count answers (up to 2) by trying every layout of each row in turn and
// checking the columns as they fill up. Nothing to do with the game's own
// solver, so it's a fair second opinion.
function countByRows(p, limit = 2, budget = 4e6) {
  const { cols, rows, rowClues, colClues } = p;
  const options = rowClues.map((c) => layouts(c, cols));
  const grid = [];
  let found = 0, steps = 0;
  // Can column c still be finished, given the rows placed so far?
  const colOk = (c, depth) => {
    const clue = colClues[c];
    let j = 0, run = 0;
    for (let r = 0; r < depth; r++) {
      if (grid[r][c]) { run++; if (j >= clue.length || run > clue[j]) return false; }
      else if (run) { if (run !== clue[j]) return false; j++; run = 0; }
    }
    const left = rows - depth;
    if (depth === rows) return run ? j === clue.length - 1 && run === clue[j] : j === clue.length;
    // Room left for the rest of the runs?
    let need = run ? clue[j] - run : 0;
    const from = run ? j + 1 : j;
    for (let k = from; k < clue.length; k++) need += clue[k] + (k > from || run ? 1 : 0);
    return need <= left;
  };
  const go = (r) => {
    if (found >= limit || ++steps > budget) return;
    if (r === rows) { found++; return; }
    for (const line of options[r]) {
      grid[r] = line;
      let ok = true;
      for (let c = 0; c < cols && ok; c++) ok = colOk(c, r + 1);
      if (ok) go(r + 1);
      if (found >= limit) return;
    }
  };
  go(0);
  return steps > budget ? -1 : found;
}

const sameClues = (a, b) => a.length === b.length && a.every((c, i) => c.length === b[i].length && c.every((v, j) => v === b[i][j]));
const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);

for (const mode of MODES) {
  const { cols, rows } = SIZES[mode];
  let slowest = 0, total = 0, sweeps = 0, fixes = 0, unchecked = 0;
  const styles = {};
  for (let n = 1; n <= count; n++) {
    const t0 = performance.now();
    const p = makePuzzle(mode, n);
    const ms = performance.now() - t0;
    slowest = Math.max(slowest, ms);
    total += ms;
    const problems = [];
    if (!p) { failures++; console.log(`${mode} ${n}: FAIL no puzzle`); continue; }
    styles[p.style] = (styles[p.style] || 0) + 1;
    sweeps += p.sweeps;
    fixes += p.fixes;
    if (p.cols !== cols || p.rows !== rows || p.solution.length !== cols * rows) problems.push('wrong size');
    if (p.rowClues.length !== rows || p.colClues.length !== cols) problems.push('wrong number of clues');
    const clues = cluesFor(p.solution, cols, rows);
    if (!sameClues(clues.rowClues, p.rowClues) || !sameClues(clues.colClues, p.colClues)) problems.push('clues do not match the picture');
    // Logic alone, from an empty grid.
    const res = solve(p);
    if (!res.solved) problems.push('needs guessing');
    else if (res.grid.some((v, i) => (v === FILL) !== !!p.solution[i])) problems.push('logic found a different picture');
    // A second opinion on uniqueness, for the sizes where that's quick.
    if (cols <= 15) {
      const k = countByRows(p);
      if (k === -1) unchecked++;
      else if (k !== 1) problems.push(`${k} answers`);
    }
    // Colours for every square.
    if (p.solution.some((v, i) => (v ? !isHex(p.fg[i]) : !isHex(p.bg[i])))) problems.push('a square has no colour');
    // Same number, same puzzle.
    if (n <= 5 && makePuzzle(mode, n).solution.join('') !== p.solution.join('')) problems.push('not the same puzzle twice');
    // Hints all the way through.
    if (n <= 6) {
      const known = new Uint8Array(cols * rows);
      let steps = 0;
      for (;;) {
        const step = nextStep(p, known);
        if (!step) break;
        if ((step.value === FILL) !== !!p.solution[step.cell] || known[step.cell] !== UNKNOWN) { problems.push('a hint was wrong'); break; }
        if (!/^(Row|Column) \d+/.test(step.why)) { problems.push('a hint gave no reason'); break; }
        known[step.cell] = step.value === FILL ? FILL : EMPTY;
        steps++;
      }
      if (known.some((v) => v === UNKNOWN)) problems.push(`hints stopped after ${steps} squares`);
    }
    if (problems.length) { failures++; console.log(`${mode} ${n}: FAIL ${problems.join('; ')}`); }
  }
  const mix = Object.entries(styles).map(([k, v]) => `${k} ${v}`).join(', ');
  console.log(`${mode.padEnd(7)} ${cols}×${rows}: ${count} puzzles, average ${(total / count).toFixed(0)} ms, slowest ${slowest.toFixed(0)} ms, ${(sweeps / count).toFixed(1)} sweeps, ${(fixes / count).toFixed(1)} squares fixed (${mix})${unchecked ? `, ${unchecked} too big to double-check` : ''}`);
}

// Every hand-drawn icon, both ways round.
let badIcons = 0;
for (const icon of ICONS) {
  for (const flip of [false, true]) {
    const grid = [];
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) grid.push(icon.px[r][flip ? 9 - c : c] !== '.' ? 1 : 0);
    const p = { cols: 10, rows: 10, ...cluesFor(grid, 10, 10) };
    if (icon.px.length !== 10 || icon.px.some((row) => row.length !== 10) || !solve(p).solved) { badIcons++; console.log(`icon ${icon.name}${flip ? ' (mirrored)' : ''}: FAIL needs guessing`); }
  }
}
failures += badIcons;
console.log(`icons   ${ICONS.length} pictures, ${badIcons} failed`);

console.log(`\n${failures} failed`);
process.exit(failures ? 1 : 0);
