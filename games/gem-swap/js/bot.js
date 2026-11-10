// Gem Swap: a practice player. It judges each move by what its first clear
// does for the goals (without peeking at what will drop in next), plus a bit
// for any power-up it makes. The level builder lets it play each level many
// times to set a fair number of moves, and Hint uses it to suggest a move.

import { Board, Rand, EMPTY, CRATE, COIN, NONE, LINE_H, LINE_V, BOMB, FLY, PRISM } from './engine.js';

// What a power-up is worth while it waits on the board.
const MADE = { [LINE_H]: 5, [LINE_V]: 5, [BOMB]: 7, [FLY]: 6, [PRISM]: 11, [NONE]: 0 };

// How much the goals still need, roughly counted in gems.
export function work(b) {
  let s = 0;
  for (const g of b.goals) {
    const left = g.need - g.got;
    if (left <= 0) continue;
    if (g.type === 'color') s += left;
    else if (g.type === 'crate') {
      let hp = 0;
      for (let i = 0; i < b.N; i++) if (b.kind[i] === CRATE) hp += b.hp[i];
      s += 4 * hp;
    } else if (g.type === 'ice') {
      let n = 0;
      for (let i = 0; i < b.N; i++) n += b.ice[i];
      s += 4 * n;
    } else if (g.type === 'chain') {
      let n = 0;
      for (let i = 0; i < b.N; i++) n += b.chain[i];
      s += 4 * n;
    } else if (g.type === 'coin') {
      s += 12 * left;
      // How far each coin still has to fall: the cells below it that are
      // still full (anything just cleared under it, it will drop through).
      for (let i = 0; i < b.N; i++) {
        if (b.kind[i] !== COIN) continue;
        let d = 0;
        for (let x = b.down[i]; x >= 0; x = b.down[x]) if (b.kind[x] !== EMPTY) d++;
        s += d * 3;
      }
    }
  }
  return s;
}

export function judge(b, m, before = work(b)) {
  const t = b.clone();
  t.quiet = true;
  t.play(m, true);
  let s = before - work(t);
  // The more power-ups are lying about, the less another is worth, and
  // the less it costs to use one: they're there to be set off.
  let held = 0;
  for (let i = 0; i < b.N; i++) if (b.power[i]) held++;
  const worth = 1 / (1 + held / 2);
  for (const p of t.made) s += MADE[p] * worth;
  s -= t.fired * 4 * worth; // a power-up used is a power-up gone
  // Lower on the board shakes more down.
  const at = m.type === 'swap' ? Math.max(m.a, m.b) : m.i;
  s += 0.04 * Math.floor(at / b.w);
  return s;
}

// The best move by that measure. noise > 0 makes it play a little
// differently each time, the way people do.
export function bestMove(b, R = null, noise = 0) {
  const moves = b.listMoves();
  if (!moves.length) return null;
  const before = work(b);
  let best = null, bestS = -Infinity;
  for (const m of moves) {
    let s = judge(b, m, before);
    if (m.type === 'tap') s -= 0.5; // a swap that does as much is usually better
    if (R && noise) s += R.next() * noise;
    if (s > bestS) {
      best = m;
      bestS = s;
    }
  }
  return best;
}

// Plays a level from the start until its goals are done; returns how many
// moves that took (Infinity if it gave up).
export function practise(level, seed, cap = 140) {
  const b = new Board(level, seed);
  b.quiet = true;
  b.moves = 100000;
  const R = new Rand(seed ^ 0x5bd1e995);
  let used = 0;
  while (!b.won() && used < cap) {
    const m = bestMove(b, R, 2.5);
    if (!m) break;
    b.play(m);
    used++;
  }
  return b.won() ? used : Infinity;
}
