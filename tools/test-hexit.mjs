// Builds Hexit boards and checks every one can be cleared, whatever order
// the tiles are taken in.
// Usage: node tools/test-hexit.mjs [from] [to] [mode]   (mode: levels, hard, super, huge;
// without one, every mode is tested, with fewer of the big boards)

import { makeLevel, MODES } from '../games/hexit/js/levels.js';
import { Board } from '../games/hexit/js/rules.js';
import { key } from '../games/hexit/js/hex.js';

const from = Number(process.argv[2] || 1);
const to = Number(process.argv[3] || 60);
const modes = process.argv[4] ? [process.argv[4]] : MODES;
let failures = 0;

for (const mode of modes) {
  // Testing every mode at once: fewer of the big ones. Name a mode to test all of its range.
  const last = process.argv[4] || mode === 'levels' ? to : mode === 'huge' ? Math.min(to, from + 3) : Math.min(to, from + 14);
  let slowest = 0, total = 0, freeSum = 0, tileSum = 0;
  for (let n = from; n <= last; n++) {
    const t0 = performance.now();
    const lv = makeLevel(n, mode);
    const ms = performance.now() - t0;
    slowest = Math.max(slowest, ms);
    total += ms;
    const problems = [];
    if (JSON.stringify(makeLevel(n, mode)) !== JSON.stringify(lv)) problems.push('the same number built a different board');
    const seen = new Set();
    for (const [q, r] of lv.cells) {
      if (seen.has(key(q, r))) problems.push('a cell twice');
      seen.add(key(q, r));
    }
    const b = new Board(lv);
    for (let i = 0; i < b.N; i++) {
      if ((b.stone[i] || b.pad[i] >= 0) && b.stack[i].length) problems.push('a tile on a stone or pad');
      for (const t of b.stack[i]) {
        if (!(t.d >= 0 && t.d < 6)) problems.push('a tile with no direction');
        if (!b.paths[i * 6 + t.d]) problems.push('a tile pointing round in circles');
        if (t.two && !b.paths[i * 6 + (t.d + 3) % 6]) problems.push('a two-way tile whose other end goes nowhere');
      }
    }
    for (const i of lv.frozen) if (b.stack[i].length !== 1) problems.push('a frozen stack');
    if (!b.free().length) problems.push('nothing can move at the start');
    if (lv.empty > Math.max(4, lv.cells.length * 0.05)) problems.push(`${lv.empty} cells left empty`);
    // Clear it in random orders: there must never be a dead end.
    for (let k = 0; k < 4 && !problems.length; k++) {
      const p = new Board(lv);
      let seed = (n * 7919 + k * 104729) >>> 0;
      const rand = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
      while (p.remaining) {
        const free = p.free();
        if (!free.length) { problems.push(`stuck with ${p.remaining} tiles left`); break; }
        const i = free[Math.floor(rand() * free.length)];
        let d = p.exit(i);
        const t = p.top(i);
        if (t.two && rand() < 0.5 && p.probe(i, (d + 3) % 6).hit === -1) d = (d + 3) % 6;
        if (!p.move(i, d).ok) { problems.push('a free tile would not move'); break; }
        // Now and then, undo and redo.
        if (rand() < 0.05) {
          const h = p.undo();
          if (!p.move(h.i, h.d).ok) { problems.push('could not redo after undo'); break; }
        }
      }
    }
    freeSum += lv.free;
    tileSum += lv.tiles;
    const line = `${mode.padEnd(6)} ${String(n).padStart(4)} ${lv.tier.padEnd(6)} ${lv.shape.padEnd(9)} ${String(lv.tiles).padStart(5)} tiles, ${String(lv.free).padStart(3)} free at the start, ${ms.toFixed(0).padStart(4)} ms`;
    if (problems.length) {
      failures++;
      console.log(`${line}\n   FAIL: ${[...new Set(problems)].join('; ')}`);
    } else if (n === from || n === last || n % 10 === 0) console.log(line);
  }
  const count = last - from + 1;
  console.log(`${mode}: ${count} boards, ${(100 * freeSum / Math.max(1, tileSum)).toFixed(0)}% of tiles free at the start, average ${(total / count).toFixed(0)} ms, slowest ${slowest.toFixed(0)} ms\n`);
}

console.log(`${failures} failed`);
process.exit(failures ? 1 : 0);
