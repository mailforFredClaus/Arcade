// Generates Sudoku puzzles and checks each has exactly one solution, can be
// solved by logic alone, and is graded right for its difficulty.
// Usage: node tools/test-sudoku.mjs [count per difficulty]

import { MODES, makePuzzle, countSolutions, grade, PEERS } from '../games/sudoku/js/logic.js';

const count = Number(process.argv[2] || 30);
const GRADE = { easy: [1, 1], medium: [2, 2], hard: [3, 3], expert: [4, 4] };
let failures = 0;

for (const mode of MODES) {
  let slowest = 0, total = 0;
  const clues = [];
  for (let n = 1; n <= count; n++) {
    const t0 = performance.now();
    const p = makePuzzle(mode, n);
    const ms = performance.now() - t0;
    slowest = Math.max(slowest, ms);
    total += ms;
    const problems = [];
    if (countSolutions(p.puzzle, 2) !== 1) problems.push('not exactly one solution');
    // The stored answer must be a valid, complete grid matching the clues.
    if (!p.answer.every((d, i) => d >= 1 && d <= 9 && PEERS[i].every((q) => p.answer[q] !== d))) problems.push('answer is not a valid grid');
    if (!p.puzzle.every((d, i) => !d || d === p.answer[i])) problems.push('clues disagree with the answer');
    const g = grade(p.puzzle);
    if (!g.solved) problems.push('needs guessing');
    if (g.level < GRADE[mode][0] || g.level > GRADE[mode][1]) problems.push(`graded ${g.level}, wanted ${GRADE[mode].join('-')}`);
    clues.push(p.clues);
    if (problems.length) { failures++; console.log(`${mode} ${n}: FAIL ${problems.join('; ')}`); }
  }
  console.log(`${mode.padEnd(7)} ${count} puzzles, ${Math.min(...clues)}-${Math.max(...clues)} clues, average ${(total / count).toFixed(0)} ms, slowest ${slowest.toFixed(0)} ms`);
}

console.log(`\n${failures} failed`);
process.exit(failures ? 1 : 0);
