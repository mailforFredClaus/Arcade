// Generates Minesweeper boards and checks each one can be cleared by logic
// alone from the patch the game opens for you.
// Usage: node tools/test-minesweeper.mjs [count per size]

import { MODES, makeBoard, neighbours, counts, flood, solveFrom } from '../games/minesweeper/js/logic.js';

const count = Number(process.argv[2] || 30);
let failures = 0;

for (const mode of MODES) {
  const runs = mode === 'huge' ? Math.max(3, Math.round(count / 4)) : count;
  let slowest = 0, total = 0;
  for (let n = 1; n <= runs; n++) {
    const t0 = performance.now();
    const b = makeBoard(mode, n);
    const ms = performance.now() - t0;
    slowest = Math.max(slowest, ms);
    total += ms;
    const problems = [];
    const nb = neighbours(b.cols, b.rows), mines = Uint8Array.from(b.layout), num = counts(mines, nb);
    if (mines.reduce((s, v) => s + v, 0) !== b.mines) problems.push('wrong number of mines');
    if (num[b.start] !== 0) problems.push('the starting square is not clear');
    const open = new Uint8Array(mines.length), flag = new Uint8Array(mines.length);
    flood(b.start, num, open, nb);
    if (!solveFrom(num, open, flag, nb, b.mines)) problems.push('needs guessing');
    if ([...flag].some((f, i) => f && !mines[i])) problems.push('logic flagged a safe square');
    if ([...open].some((o, i) => o && mines[i])) problems.push('logic opened a mine');
    if (problems.length) { failures++; console.log(`${mode} ${n}: FAIL ${problems.join('; ')}`); }
  }
  console.log(`${mode.padEnd(7)} ${runs} boards, average ${(total / runs).toFixed(0)} ms, slowest ${slowest.toFixed(0)} ms`);
}

console.log(`\n${failures} failed`);
process.exit(failures ? 1 : 0);
