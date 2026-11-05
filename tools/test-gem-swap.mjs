// Builds Gem Swap levels and checks them: the board is sound, the goals can
// be met, the rules never leave the board in a broken state, saved games
// replay exactly, and the practice player can win in the moves given.
// Usage: node tools/test-gem-swap.mjs [from] [to]

import { Board, Rand, mix, EMPTY, GEM, CRATE, COIN } from '../games/gem-swap/js/engine.js';
import { makeLevel } from '../games/gem-swap/js/levels.js';
import { practise } from '../games/gem-swap/js/bot.js';

const from = Number(process.argv[2] || 1);
const to = Number(process.argv[3] || 60);
let failures = 0, slowest = 0, wins = 0, games = 0;
const byTier = {};

// Everything a settled board must be true of.
function settledProblems(b) {
  const out = [];
  if (b.findGroups().length) out.push('matches left on the board');
  for (let i = 0; i < b.N; i++) {
    if (!b.on[i]) {
      if (b.kind[i] !== EMPTY) out.push('something in a hole');
      continue;
    }
    if (b.kind[i] === EMPTY && b.feedable(i)) out.push('a gap that should have filled');
    if (b.movable(i) && b.down[i] >= 0 && b.kind[b.down[i]] === EMPTY) out.push('a gem left floating');
    if ((b.kind[i] === GEM || b.kind[i] === COIN) && b.id[i] <= 0) out.push('a piece with no id');
    if (b.kind[i] === CRATE && !b.hp[i]) out.push('a crate with no layers');
  }
  const ids = new Set();
  for (let i = 0; i < b.N; i++) {
    if (!b.id[i]) continue;
    if (ids.has(b.id[i])) out.push('two pieces share an id');
    ids.add(b.id[i]);
  }
  for (const g of b.goals) if (g.got > g.need) out.push('a goal counted past its target');
  return [...new Set(out)];
}

const stateOf = (b) => JSON.stringify([...b.kind, ...b.color, ...b.power, ...b.hp, ...b.chain, ...b.ice, ...b.id, b.moves, b.goals.map((g) => g.got)]);

for (let n = from; n <= to; n++) {
  const t0 = performance.now();
  const lv = makeLevel(n);
  const ms = performance.now() - t0;
  slowest = Math.max(slowest, ms);
  const problems = [];
  if (!lv) {
    failures++;
    console.log(`L${n}: FAIL could not be built`);
    continue;
  }
  const N = lv.w * lv.h;
  const count = (arr) => arr.reduce((s, v, i) => s + (lv.on[i] && v ? 1 : 0), 0);
  for (const g of lv.goals) {
    if (g.type === 'crate' && g.need !== count(lv.crate)) problems.push('crate goal does not match the crates');
    if (g.type === 'ice' && g.need !== count(lv.ice)) problems.push('ice goal does not match the ice');
    if (g.type === 'chain' && g.need !== count(lv.chain)) problems.push('chain goal does not match the chains');
    if (g.type === 'color' && !lv.colors.includes(g.color)) problems.push('a colour goal for a colour not in play');
    if (g.need <= 0) problems.push('an empty goal');
  }
  if (lv.goals.length < 1 || lv.goals.length > 4) problems.push('wrong number of goals');
  if (lv.moves < 10 || lv.moves > 45) problems.push(`odd number of moves (${lv.moves})`);
  if (!(lv.stars[0] >= 1 && lv.stars[1] > lv.stars[0] && lv.stars[1] <= lv.moves)) problems.push('star thresholds out of order');
  for (let i = 0; i < N; i++) if (!lv.on[i] && (lv.crate[i] || lv.ice[i] || lv.chain[i] || lv.coin[i])) problems.push('an obstacle in a hole');

  // Random play: the board must always settle properly.
  for (let k = 0; k < 3; k++) {
    const b = new Board(lv, mix(lv.seed, 900 + k));
    const start = settledProblems(b);
    if (start.length) problems.push(`fresh board: ${start.join(', ')}`);
    if (!b.hasMove()) problems.push('fresh board has no move');
    const R = new Rand(mix(n, k, 77));
    const played = [];
    for (let step = 0; step < 60 && !b.won() && b.moves > 0; step++) {
      const moves = b.listMoves();
      if (!moves.length) { problems.push('no moves on a settled board'); break; }
      const m = R.next() < 0.15 ? { type: ['hammer', 'row'][R.int(2)], i: R.int(N) } : moves[R.int(moves.length)];
      if ((m.type === 'hammer' || m.type === 'row') && (!b.on[m.i] || b.kind[m.i] === COIN)) continue;
      const before = b.moves;
      const steps = b.play(m);
      if (!steps.length) continue;
      played.push(m);
      if (m.type === 'swap' && b.moves !== before - 1) problems.push('a swap did not cost one move');
      const bad = settledProblems(b);
      if (bad.length) { problems.push(`after a move: ${bad.join(', ')}`); break; }
    }
    // A saved game is its seed and its moves: replaying them must land on the same board.
    const again = new Board(lv, mix(lv.seed, 900 + k));
    again.quiet = true;
    for (const m of played) again.play(m);
    if (stateOf(again) !== stateOf(b)) problems.push('replaying the moves gave a different board');
  }

  // The practice player, on fresh deals, with the moves the level gives.
  let won = 0;
  const tries = 4;
  for (let k = 0; k < tries; k++) {
    const used = practise(lv, mix(lv.seed, 5000 + k), 60);
    if (used <= lv.moves) won++;
  }
  wins += won;
  games += tries;
  const t = (byTier[lv.tier] = byTier[lv.tier] || { won: 0, games: 0 });
  t.won += won;
  t.games += tries;
  if (lv.tier === 'normal' && won === 0) problems.push('the practice player never won it');

  const goals = lv.goals.map((g) => (g.type === 'color' ? `colour:${g.need}` : `${g.type}:${g.need}`)).join(' ');
  const line = `L${String(n).padStart(4)} ${lv.tier.padEnd(6)} ${lv.w}x${lv.h} ${String(lv.moves).padStart(2)} moves, ${goals.padEnd(30)} practice ${won}/${tries}, ${ms.toFixed(0).padStart(4)} ms`;
  if (problems.length) {
    failures++;
    console.log(`${line}\n   FAIL: ${[...new Set(problems)].join('; ')}`);
  } else if (n === from || n === to || n % 10 === 0) console.log(line);
}

const rate = (x) => `${Math.round((100 * x.won) / Math.max(1, x.games))}%`;
console.log(`\n${to - from + 1} levels, ${failures} failed, slowest build ${slowest.toFixed(0)} ms`);
console.log(`practice player won ${rate({ won: wins, games })} of fresh games (${Object.entries(byTier).map(([k, v]) => `${k} ${rate(v)}`).join(', ')})`);
process.exit(failures ? 1 : 0);
