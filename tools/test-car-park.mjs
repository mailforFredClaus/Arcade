// Generates Car Park puzzles and checks every one: a legal car park, the
// fewest moves worked out again by a separate search, and the stored answer
// actually getting the red car out, and no puzzle repeating another.
// Usage: node tools/test-car-park.mjs [count per mode]
//        node tools/test-car-park.mjs --seeds [count]   (remakes js/seeds.js)

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MODES, RANGES, SIZE, EXIT_ROW, GOAL, makePuzzle, makeSeed, parseBoard, solveFrom, bestHint, limits } from '../games/car-park/js/logic.js';
import { SEEDS } from '../games/car-park/js/seeds.js';

const args = process.argv.slice(2);

// A car park's tracks: the line each vehicle lies on and its length, plus
// the bollards (but not where along its line each vehicle sits). Two car
// parks with different tracks can never be the same puzzle.
function tracksKey(vehicles, walls) {
  const k = vehicles.map((v, i) => `${i ? '' : 'R'}${v.h ? 'h' : 'v'}${v.line}${v.len}`);
  return [k[0], ...k.slice(1).sort(), ...walls.slice().sort((x, y) => x - y).map((w) => `x${w}`)].join(' ');
}

if (args[0] === '--seeds') {
  // Puzzles use the bank easiest first, so its spread follows each mode's
  // drift: a few easier ones for the first 40 numbers, then harder.
  const count = Number(args[1] || 200);
  const plan = { hard: [[19, 23], [24, 28]], expert: [[29, 31], [32, 35]] };
  const out = {};
  for (const mode of ['hard', 'expert']) {
    out[mode] = [];
    const seen = new Set();
    const t0 = performance.now();
    for (let i = 0; out[mode].length < count; i++) {
      const [lo, hi] = plan[mode][out[mode].length < 40 ? 0 : 1];
      const want = lo + (i % (hi - lo + 1));
      const seed = makeSeed(mode, i, want);
      // Never the same car park twice.
      const L = parseBoard(seed.board), key = tracksKey(L.vehicles, L.walls);
      if (seen.has(key)) continue;
      seen.add(key);
      out[mode].push(seed);
      if (out[mode].length % 10 === 0) console.log(`${mode}: ${out[mode].length}/${count} seeds, ${((performance.now() - t0) / 1000).toFixed(0)} s`);
    }
  }
  const body = (list) => list.map((x) => `    { board: '${x.board}', max: ${x.max} },`).join('\n');
  const file = `// Hard and expert car parks, one for each of the first few hundred puzzle
// numbers (used easiest first). Finding a car park this hard from scratch
// can take a phone several seconds, so these were found ahead of time by
// the same search (makeSeed in logic.js), and no two are the same car park.
// Each is six rows of six: '.' empty, 'x' a bollard, 'A' the red car; max is
// the most moves its hardest position takes.
// Remade by: node tools/test-car-park.mjs --seeds
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

// The same car park, vehicles listed in a fixed order: red car first, then by
// line and length (and, on a shared line, by where they sit, which never
// changes order since they can't pass each other).
function canonical(p, pos) {
  const order = [0, ...p.vehicles.map((_, i) => i).slice(1).sort((a, b) => {
    const A = p.vehicles[a], B = p.vehicles[b];
    return (A.h - B.h) || (A.line - B.line) || (A.len - B.len) || (pos[a] - pos[b]);
  })];
  return { vehicles: order.map((i) => p.vehicles[i]), walls: p.walls, start: order.map((i) => pos[i]) };
}

// Every position reachable from start.
function reachable(p) {
  const seen = new Set([p.start.join(',')]);
  const queue = [p.start];
  for (let at = 0; at < queue.length; at++) {
    for (const q of nextPositions(p, queue[at])) {
      const k = q.join(',');
      if (!seen.has(k)) { seen.add(k); queue.push(q); }
    }
  }
  return seen;
}

// The game counts driving the vehicle moved last again as the same move
// (and driving it back to where that move began takes the move away).
function counter() {
  const moves = [];
  return {
    get count() { return moves.length; },
    get last() { return moves.length ? moves[moves.length - 1] : null; },
    drive(pos, i, q) {
      const from = pos[i];
      pos[i] = q;
      const last = moves[moves.length - 1];
      if (last && last.i === i) { last.to = q; if (last.from === q) moves.pop(); } else moves.push({ i, from, to: q });
    },
  };
}

// Make a first move that's only part of a best first move, then follow the
// hints: it must still finish in the fewest moves.
function hintsStayBest(p) {
  for (let i = 0; i < p.vehicles.length; i++) {
    const [lo, hi] = limits(p, p.start, i);
    for (let q = lo; q <= hi; q++) {
      if (q === p.start[i]) continue;
      const after = p.start.slice();
      after[i] = q;
      if (fewestMoves(p, after) !== p.min - 1) continue; // not a best first move
      for (let part = p.start[i] + Math.sign(q - p.start[i]); part !== q; part += Math.sign(q - p.start[i])) {
        const pos = p.start.slice(), c = counter();
        c.drive(pos, i, part);
        for (let guard = 0; pos[0] !== GOAL && guard < 200; guard++) {
          const h = bestHint(p, pos, c.last);
          if (!h) break;
          c.drive(pos, h.i, h.to);
        }
        if (pos[0] !== GOAL || c.count !== p.min) return `a part-way first move then the hints took ${c.count}, not ${p.min}`;
      }
    }
  }
  return '';
}

// ---- the checks -----------------------------------------------------------------------

function check(mode, n, p, problems) {
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
  const pos = p.start.slice();
  for (const [i, q] of p.solution) {
    if (!legalMove(p, pos, i, q)) { problems.push('illegal move in the answer'); break; }
    pos[i] = q;
  }
  if (pos[0] !== GOAL) problems.push('the answer does not get the red car out');
  if (p.solution.length !== p.min) problems.push('the answer is not the shortest');
  // The hint solver agrees.
  const hintPlan = solveFrom(p, p.start);
  if (!hintPlan || hintPlan.length !== p.min) problems.push('the hint solver disagrees');
}

let failures = 0;
const fail = (what, problems) => { failures++; console.log(`${what}: FAIL ${problems.join('; ')}`); };

for (const mode of MODES) {
  let total = 0, slowest = 0;
  const mins = [], byTracks = new Map();
  for (let n = 1; n <= count; n++) {
    const t0 = performance.now();
    const p = makePuzzle(mode, n);
    const ms = performance.now() - t0;
    total += ms;
    slowest = Math.max(slowest, ms);
    const problems = [];
    check(mode, n, p, problems);
    // Same number, same puzzle.
    if (n <= 3 && JSON.stringify(makePuzzle(mode, n)) !== JSON.stringify(p)) problems.push('not the same puzzle twice');
    // Following the hints after a part-way move still gets 3 stars.
    if (n <= 8) { const why = hintsStayBest(p); if (why) problems.push(why); }
    mins.push(p.min);
    const key = tracksKey(p.vehicles, p.walls);
    if (!byTracks.has(key)) byTracks.set(key, []);
    byTracks.get(key).push({ n, c: canonical(p, p.start) });
    if (problems.length) fail(`${mode} ${n}`, problems);
  }
  // No puzzle is another one again: the same car park with one start
  // reachable from the other (or simply identical).
  let repeats = 0;
  for (const list of byTracks.values()) {
    for (let a = 0; a < list.length; a++) {
      const seen = list.length > 1 ? reachable(list[a].c) : null;
      for (let b = a + 1; b < list.length; b++) {
        if (seen.has(list[b].c.start.join(','))) { repeats++; fail(`${mode} ${list[b].n}`, [`the same puzzle as ${mode} ${list[a].n}`]); }
      }
    }
  }
  const spread = `${Math.min(...mins)}-${Math.max(...mins)} moves (average ${(mins.reduce((s, v) => s + v, 0) / mins.length).toFixed(1)})`;
  console.log(`${mode.padEnd(7)} ${count} puzzles, ${spread}, ${byTracks.size} different car parks, average ${(total / count).toFixed(0)} ms, slowest ${slowest.toFixed(0)} ms`);
}

// Past the end of the bank, hard and expert puzzles are built from scratch:
// check a couple of those too, and that they aren't a bank car park again.
for (const mode of ['hard', 'expert']) {
  const bank = new Set(SEEDS[mode].map((x) => { const L = parseBoard(x.board); return tracksKey(L.vehicles, L.walls); }));
  for (let n = SEEDS[mode].length + 1; n <= SEEDS[mode].length + 2; n++) {
    const t0 = performance.now();
    const p = makePuzzle(mode, n);
    const problems = [];
    check(mode, n, p, problems);
    if (bank.has(tracksKey(p.vehicles, p.walls))) problems.push('the same car park as one in the bank');
    if (problems.length) fail(`${mode} ${n}`, problems);
    else console.log(`${mode} ${n} (past the bank): ${p.min} moves, built in ${(performance.now() - t0).toFixed(0)} ms`);
  }
}

console.log(`\n${failures} failed`);
process.exit(failures ? 1 : 0);
