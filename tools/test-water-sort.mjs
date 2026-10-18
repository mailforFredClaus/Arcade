// Generates Water Sort levels and checks every one can be finished.
// Usage: node tools/test-water-sort.mjs [from] [to]

import { makeLevel, solve, pourAmount, pour, isSolved, topRun, CAP } from '../games/water-sort/js/logic.js';

const from = Number(process.argv[2] || 1);
const to = Number(process.argv[3] || 200);
let failures = 0, slowest = 0;

for (let n = from; n <= to; n++) {
  const t0 = performance.now();
  const lv = makeLevel(n);
  const ms = performance.now() - t0;
  slowest = Math.max(slowest, ms);
  const problems = [];
  // Every colour exactly CAP times, nothing over-full, no tube half done.
  const counts = new Map();
  for (const t of lv.tubes) {
    if (t.length > CAP) problems.push('over-full tube');
    if (t.length && topRun(t) >= 3) problems.push('tube starts nearly sorted');
    for (const c of t) counts.set(c, (counts.get(c) || 0) + 1);
  }
  if (counts.size !== lv.colors || [...counts.values()].some((k) => k !== CAP)) problems.push('colour counts are off');
  // Solve it again from scratch and play the answer out.
  const T = lv.tubes.map((t) => t.slice());
  const plan = solve(T, CAP, 400000);
  if (!plan) problems.push(plan === null ? 'cannot be finished' : 'solver gave up');
  else {
    for (const [a, b] of plan) {
      const k = pourAmount(T, a, b, CAP);
      if (!k) { problems.push('illegal pour in the answer'); break; }
      pour(T, a, b, k);
    }
    if (!isSolved(T, CAP)) problems.push('answer does not finish it');
  }
  const tag = lv.hard ? 'HARD   ' : lv.mystery ? 'MYSTERY' : '       ';
  const line = `L${String(n).padStart(4)} ${tag} ${String(lv.colors).padStart(2)} colours, ${String(plan ? plan.length : '?').padStart(3)} pours, trickiness ${String(lv.effort).padStart(6)}, ${ms.toFixed(0).padStart(4)} ms`;
  if (problems.length) { failures++; console.log(`${line}\n   FAIL: ${problems.join('; ')}`); }
  else if (n === from || n === to || n % 25 === 0) console.log(line);
}

console.log(`\n${to - from + 1} levels, ${failures} failed, slowest ${slowest.toFixed(0)} ms`);
process.exit(failures ? 1 : 0);
