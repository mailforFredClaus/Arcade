// Generates Car Park puzzles and checks every one: a legal car park, the
// fewest moves worked out again by a separate search, and the stored answer
// actually getting the red car out.
// Usage: node tools/test-car-park.mjs [count per mode]
//        node tools/test-car-park.mjs --seeds [count]   (remakes js/seeds.js)

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MODES, RANGES, SIZE, EXIT_ROW, GOAL, makePuzzle, makeSeed, solveFrom } from '../games/car-park/js/logic.js';

const args = process.argv.slice(2);

if (args[0] === '--seeds') {
  // Hard seeds aim a little above the middle of hard; expert ones a little
  // above where expert puzzles go, so rearranging them has room to spare.
  const count = Number(args[1] || 150);
  const plan = { hard: [20, 28], expert: [30, 35] };
  const out = {};
  for (const mode of ['hard', 'expert']) {
    const [lo, hi] = plan[mode];
    out[mode] = [];
    const t0 = performance.now();
    for (let i = 0; i < count; i++) {
      const want = lo + (i % (hi - lo + 1));
      out[mode].push(makeSeed(mode, i, want));
      if (i % 10 === 9) console.log(`${mode}: ${i + 1}/${count} seeds, ${((performance.now() - t0) / 1000).toFixed(0)} s`);
    }
  }
  const body = (list) => list.map((x) => `    { board: '${x.board}', max: ${x.max} },`).join('\n');
  const file = `// Hard and expert car parks for new puzzles to start from. Finding a car
// park this hard from scratch can take a phone several seconds, so these
// were found ahead of time by the same search (makeSeed in logic.js), and
// each puzzle rearranges one of them. Each is six rows of six: '.' empty,
// 'x' a bollard, 'A' the red car; max is the most moves its hardest
// position takes. Remade by: node tools/test-car-park.mjs --seeds
// (which changes the hard and expert puzzles, so bump GEN_VERSION too).
export const SEEDS = {
  hard: [
${body(out.hard)}
  ],
  expert: [
${body(out.expert)}
  ],
};
`;
  await writeFile(fileURLToPath(new URL('../games/car-park/js/seeds.js', import.meta.url)), file);
  console.log('games/car-park/js/seeds.js written');
  process.exit(0);
}

const count = Number(args[0] || 30);

// ---- an independent check: a plain breadth-first search ----------------------------

function cells(v, p) {
  const out = [];
  for (let k = 0; k < v.len; k++) out.push(v.h ? v.line * SIZE + p + k : (p + k) * SIZE + v.line);
  return out;
}

function gridOf(puzzle, pos) {
  const grid = new Array(SIZE * SIZE).fill(-1);
  for (const w of puzzle.walls) grid[w] = -2;
  puzzle.vehicles.forEach((v, i) => { for (const c of cells(v, pos[i])) grid[c] = i; });
  return grid;
}

function* nextPositions(puzzle, pos) {
  const grid = gridOf(puzzle, pos);
  for (let i = 0; i < pos.length; i++) {
    const v = puzzle.vehicles[i];
    for (const dir of [-1, 1]) {
      for (let q = pos[i] + dir; q >= 0 && q + v.len <= SIZE; q += dir) {
        const c = dir < 0 ? cells(v, q)[0] : cells(v, q)[v.len - 1];
        if (grid[c] !== -1) break;
        const next = pos.slice();
        next[i] = q;
        yield next;
      }
    }
  }
}

function fewestMoves(puzzle, start) {
  if (start[0] === GOAL) return 0;
  const seen = new Set([start.join(',')]);
  let layer = [start];
  for (let d = 1; layer.length; d++) {
    const next = [];
    for (const pos of layer) {
      for (const q of nextPositions(puzzle, pos)) {
        if (q[0] === GOAL) return d;
        const k = q.join(',');
        if (seen.has(k)) continue;
        seen.add(k);
        next.push(q);
      }
    }
    layer = next;
  }
  return -1;
}

function legalMove(puzzle, pos, i, q) {
  for (const p of nextPositions(puzzle, pos)) if (p[i] === q && p.every((x, j) => j === i || x === pos[j])) return true;
  return false;
}

// ---- the checks -----------------------------------------------------------------------

let failures = 0;
for (const mode of MODES) {
  let total = 0, slowest = 0;
  const mins = [];
  for (let n = 1; n <= count; n++) {
    const t0 = performance.now();
    const p = makePuzzle(mode, n);
    const ms = performance.now() - t0;
    total += ms;
    slowest = Math.max(slowest, ms);
    const problems = [];
    // A legal car park.
    const red = p.vehicles[0];
    if (!red.h || red.line !== EXIT_ROW || red.len !== 2) problems.push('the red car is not across the exit row');
    if (p.vehicles.some((v, i) => i > 0 && v.h && v.line === EXIT_ROW)) problems.push('something else lies across the exit row');
    const used = new Map();
    for (const w of p.walls) { if (w < 0 || w >= SIZE * SIZE || used.has(w)) problems.push('bad bollard'); used.set(w, 'x'); }
    p.vehicles.forEach((v, i) => {
      const at = p.start[i];
      if (![2, 3].includes(v.len) || at < 0 || at + v.len > SIZE || v.line < 0 || v.line >= SIZE) problems.push(`vehicle ${i} is off the grid`);
      for (const c of cells(v, at)) { if (used.has(c)) problems.push(`vehicle ${i} overlaps something`); used.set(c, i); }
    });
    if (p.start[0] === GOAL) problems.push('already solved');
    // The fewest moves, worked out again from scratch.
    const fewest = fewestMoves(p, p.start);
    if (fewest !== p.min) problems.push(`stored minimum ${p.min}, but it really takes ${fewest}`);
    const [lo, hi] = RANGES[mode];
    if (p.min < lo || p.min > hi) problems.push(`${p.min} moves is outside ${mode}'s ${lo}-${hi}`);
    // The stored answer works, and is that short.
    let pos = p.start.slice();
    for (const [i, q] of p.solution) {
      if (!legalMove(p, pos, i, q)) { problems.push('illegal move in the answer'); break; }
      pos[i] = q;
    }
    if (pos[0] !== GOAL) problems.push('the answer does not get the red car out');
    if (p.solution.length !== p.min) problems.push('the answer is not the shortest');
    // The hint solver agrees.
    const hintPlan = solveFrom(p, p.start);
    if (!hintPlan || hintPlan.length !== p.min) problems.push('the hint solver disagrees');
    // Same number, same puzzle.
    if (n <= 3 && JSON.stringify(makePuzzle(mode, n)) !== JSON.stringify(p)) problems.push('not the same puzzle twice');
    mins.push(p.min);
    if (problems.length) { failures++; console.log(`${mode} ${n}: FAIL ${problems.join('; ')}`); }
  }
  const spread = `${Math.min(...mins)}-${Math.max(...mins)} moves (average ${(mins.reduce((s, v) => s + v, 0) / mins.length).toFixed(1)})`;
  console.log(`${mode.padEnd(7)} ${count} puzzles, ${spread}, average ${(total / count).toFixed(0)} ms, slowest ${slowest.toFixed(0)} ms`);
}

console.log(`\n${failures} failed`);
process.exit(failures ? 1 : 0);
