// Generates Arrow Cube levels and independently re-checks every one of them.
// Usage: node tools/test-levels.mjs [from] [to] [levels|hard|super|huge]

import { generateLevel, levelSpec, checkLevel } from '../games/arrow-cube/js/generator.js';
import { buildShape, hiddenFaces } from '../games/arrow-cube/js/topology.js';
import { Board, TWO_WAY, FORK, BLUE, PURPLE } from '../games/arrow-cube/js/rules.js';

const from = Number(process.argv[2] || 1);
const to = Number(process.argv[3] || 60);
const mode = process.argv[4] || 'levels';
let failures = 0;
let slowest = 0;

for (let n = from; n <= to; n++) {
  const spec = levelSpec(n, mode);
  const t0 = performance.now();
  const level = generateLevel(n, mode);
  const ms = performance.now() - t0;
  slowest = Math.max(slowest, ms);

  const problems = [];
  const topo = buildShape(level.shape);
  const seen = new Int32Array(topo.N).fill(-1);
  level.pieces.forEach((p, i) => {
    const cells = p.kind === FORK ? p.cells.concat(p.branch) : p.cells;
    for (const c of cells) {
      if (seen[c] >= 0) problems.push(`cell ${c} shared by arrows ${seen[c]} and ${i}`);
      seen[c] = i;
    }
  });
  for (const r of level.redirectors) if (seen[r.cell] >= 0) problems.push(`marker under arrow at ${r.cell}`);
  // Everything you need to see must be somewhere you can comfortably look.
  const hidden = hiddenFaces(topo);
  let hiddenCount = 0;
  for (let c = 0; c < topo.N; c++) {
    hiddenCount += hidden[c];
    if (hidden[c] && seen[c] >= 0) problems.push(`arrow ${seen[c]} on hidden face ${c}`);
  }
  for (const r of level.redirectors) if (hidden[r.cell]) problems.push(`marker on hidden face ${r.cell}`);
  for (const e of level.yellow) if (topo.edges[e].cells.some((c) => hidden[c])) problems.push(`yellow edge ${e} next to a hidden face`);

  const check = checkLevel(level, spec, { budget: 60000 });
  if (!check.ok) problems.push(check.why);

  // Random tap orders must never get stuck.
  const B = new Board(topo, level);
  // Without purple markers, a solvable level can't have dead ends (clearing an
  // arrow never blocks another), so random play adds nothing for the giants.
  const runs = mode === 'huge' || spec.tier === 'giga' ? 0 : spec.tier === 'mega' ? 6 : 25;
  for (let run = 0; run < runs && !problems.length; run++) {
    let seed = n * 1000 + run;
    const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
    B.undoTo(0);
    while (B.remaining) {
      const moves = [];
      for (let i = 0; i < B.pieces.length; i++) {
        if (!B.present[i]) continue;
        B.pieces[i].options.forEach((o, k) => { const r = B.tryMove(i, k); if (r.ok) moves.push([i, k, r]); });
      }
      if (!moves.length) { problems.push(`random play got stuck with ${B.remaining} arrows left`); break; }
      const [i, k, r] = moves[(rand() * moves.length) | 0];
      B.apply(i, k, r);
    }
  }

  const cellsUsed = level.pieces.reduce((s, p) => s + p.cells.length + (p.branch ? p.branch.length : 0), 0);
  const feats = [
    level.redirectors.filter((r) => r.kind === BLUE).length && `blue×${level.redirectors.filter((r) => r.kind === BLUE).length}`,
    level.redirectors.filter((r) => r.kind === PURPLE).length && `purple×${level.redirectors.filter((r) => r.kind === PURPLE).length}`,
    level.pieces.filter((p) => p.kind === TWO_WAY).length && `two×${level.pieces.filter((p) => p.kind === TWO_WAY).length}`,
    level.pieces.filter((p) => p.kind === FORK).length && `fork×${level.pieces.filter((p) => p.kind === FORK).length}`,
    level.yellow.length && `yellow×${level.yellow.length}(${level.wraps} wraps)`,
  ].filter(Boolean).join(' ');
  const fill = Math.round((100 * cellsUsed) / (topo.N - hiddenCount));
  const tag = { normal: '     ', hard: 'HARD ', super: 'SUPER', mega: 'MEGA ', giga: 'GIGA ', huge: 'HUGE ' }[spec.tier];
  const kind = (level.shape.kind || 'box').padEnd(8);
  const line = `L${String(n).padStart(3)} ${tag} ${kind} ${level.dims.join('x').padEnd(8)} ` +
    `${String(level.pieces.length).padStart(3)} arrows, ${String(check.free ?? '?').padStart(3)} free at start, ` +
    `${String(check.rounds ?? '?').padStart(2)} waves, ` +
    `${fill}% full${hiddenCount ? ` (${Math.round((100 * hiddenCount) / topo.N)}% out of sight)` : ''}, ${ms.toFixed(0).padStart(5)} ms  ${feats}`;
  console.log(problems.length ? `${line}\n   FAIL: ${problems.slice(0, 3).join('; ')}` : line);
  if (problems.length) failures++;
}

console.log(`\n${to - from + 1} levels, ${failures} failed, slowest ${slowest.toFixed(0)} ms`);
process.exit(failures ? 1 : 0);
