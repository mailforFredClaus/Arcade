// Checks Honey Run's rules (jumping, rolling, lanes, roofs, bumps, coins and
// power-ups), then lets a practice player run the line, keeping to the lane
// the line promises is passable: if it always gets through, the line is
// fair. Also checks the same seed always lays the same line.
// Usage: node tools/test-honey-run.mjs [runs] [metres]

import { Run, STEP, LANE, ROOF, CART, RAMP, JUMP, GRAVITY, POWER_TIME, speedAt, V0, VMAX, FLY_HEIGHT } from '../games/honey-run/js/engine.js';

const runs = Number(process.argv[2] || 12), metres = Number(process.argv[3] || 6000);
let failures = 0;
const check = (ok, what) => {
  if (!ok) {
    failures++;
    console.log(`FAIL: ${what}`);
  }
};
const steps = (r, secs) => { for (let i = 0; i < Math.round(secs / STEP) && !r.dead; i++) r.step(); };
const empty = () => new Run({ lay: false });
const says = (r, e) => r.events.some((x) => x.e === e);

// ---- the rules, one at a time ------------------------------------------------------------

{
  const r = empty();
  steps(r, 1);
  check(Math.abs(r.s - V0) < 0.5 && r.y === 0 && r.grounded, 'runs along the ground at the starting speed');
  check(speedAt(0) === V0 && speedAt(1e6) === VMAX && speedAt(1000) > V0, 'speeds up with distance, to a limit');
  r.input('up');
  let top = 0, air = 0;
  while (!r.grounded || air === 0) { r.step(); top = Math.max(top, r.y); air += STEP; }
  check(Math.abs(top - (JUMP * JUMP) / (2 * GRAVITY)) < 0.08, `a jump rises ${((JUMP * JUMP) / (2 * GRAVITY)).toFixed(2)} m`);
  check(Math.abs(air - (2 * JUMP) / GRAVITY) < 0.03, 'and lasts as long as it should');
  r.input('down');
  check(r.rolling && r.height < 1, 'rolling makes the cub low');
  steps(r, 0.7);
  check(!r.rolling, 'and ends by itself');
  r.input('up');
  steps(r, 0.2);
  r.input('down');
  steps(r, 0.05);
  check(r.vy <= -20, 'swiping down in the air drops fast');
  steps(r, 0.3);
  check(r.grounded && r.rolling, 'and rolls on landing');
}

{
  // Lanes.
  const r = empty();
  r.input('left');
  check(r.lane === -1, 'left moves a lane left');
  r.input('left');
  check(r.lane === -1 && says(r, 'edge'), 'but not off the edge');
  steps(r, 0.3);
  check(Math.abs(r.x + LANE) < 1e-6, 'the cub slides across to its lane');
  r.input('right');
  r.input('right');
  check(r.lane === 1, 'two quick swipes cross two lanes');
}

{
  // Fences and barriers.
  const a = empty();
  a.add({ kind: 'low', lane: 0, s0: 10, s1: 10.5 });
  steps(a, 1);
  check(a.dead && a.cause === 'low', 'running into a fence ends the run');
  const b = empty();
  b.add({ kind: 'low', lane: 0, s0: 10, s1: 10.5 });
  steps(b, 0.5);
  b.input('up');
  steps(b, 1);
  check(!b.dead, 'jumping clears it');
  const c = empty();
  c.add({ kind: 'high', lane: 0, s0: 10, s1: 10.5 });
  steps(c, 0.5);
  c.input('up');
  steps(c, 1);
  check(c.dead && c.cause === 'high', 'a barrier cannot be jumped');
  const d = empty();
  d.add({ kind: 'high', lane: 0, s0: 10, s1: 10.5 });
  steps(d, 0.55);
  d.input('down');
  steps(d, 1);
  check(!d.dead, 'rolling goes under it');
}

{
  // Trains, ramps and roofs.
  const a = empty();
  a.train(0, 10, 2);
  steps(a, 0.5);
  a.input('up');
  steps(a, 1);
  check(a.dead && a.cause === 'train', 'a wagon is too tall to jump');
  const b = empty();
  b.add({ kind: 'ramp', lane: 0, s0: 6, s1: 6 + RAMP, h: ROOF });
  b.train(0, 6 + RAMP, 2);
  steps(b, 1.3);
  check(!b.dead && Math.abs(b.y - ROOF) < 1e-6 && b.grounded, 'a ramp leads up onto the roof');
  const before = b.stats.roof;
  steps(b, 0.5);
  check(b.stats.roof > before, 'running on roofs is counted');
  steps(b, 2);
  check(!b.dead && b.y === 0 && b.grounded, 'and off the far end back to the ground');
  // Roof to roof.
  const c = empty();
  c.add({ kind: 'ramp', lane: 0, s0: 6, s1: 6 + RAMP, h: ROOF });
  c.train(0, 6 + RAMP, 3);
  c.train(1, 6 + RAMP, 3);
  steps(c, 1.4);
  c.input('right');
  steps(c, 0.3);
  check(!c.dead && c.lane === 1 && c.y === ROOF && c.stumbleT === 0, 'you can step across from roof to roof');
  // Hay carts.
  const d = empty();
  d.add({ kind: 'cart', lane: 0, s0: 10, s1: 14.5, h: CART });
  steps(d, 0.45);
  d.input('up');
  steps(d, 0.62);
  check(!d.dead && d.y === CART, 'a jump lands on a hay cart');
  const e = empty();
  e.add({ kind: 'cart', lane: 0, s0: 10, s1: 14.5, h: CART });
  steps(e, 1);
  check(e.dead, 'running into one does not');
  // Boots.
  const f = empty();
  f.train(0, 12, 2);
  f.give('boots');
  steps(f, 0.45);
  f.input('up');
  steps(f, 0.7);
  check(!f.dead && f.y === ROOF, 'with boots a jump reaches the roof');
}

{
  // Bumps and bees.
  const r = empty();
  r.train(1, 0, 20);
  steps(r, 0.5);
  r.input('right');
  check(r.lane === 0 && r.stumbleT > 0 && !r.dead && says(r, 'bump'), 'swiping into the side of a train bounces you back with a stumble');
  steps(r, 1);
  r.input('right');
  check(r.dead && r.cause === 'bees', 'a second stumble while the bees are close ends the run');
  const q = empty();
  q.train(1, 0, 40);
  steps(q, 0.5);
  q.input('right');
  steps(q, 7.5);
  check(q.stumbleT === 0, 'the bees fall back after a while');
  q.input('right');
  check(!q.dead, 'and then a stumble is forgiven again');
}

{
  // Trains rolling towards you.
  const r = empty();
  r.train(0, 40, 2, 8);
  steps(r, 1);
  check(r.obstacles[0].s0 < 40 - 7.9, 'a rolling train comes towards you');
  steps(r, 2);
  check(r.dead, 'and is just as solid');
}

{
  // Coins, the magnet, doubling.
  const r = empty();
  r.row(0, 5, 5);
  r.row(1, 5, 5);
  steps(r, 1.5);
  check(r.coins === 5, 'coins in your lane are collected, the others left');
  const m = empty();
  m.row(1, 8, 5);
  m.row(-1, 8, 5);
  m.coinList.sort((a, b) => a.s - b.s);
  m.give('magnet');
  steps(m, 2);
  check(m.coins === 10, 'the magnet pulls in coins from every lane');
  const a = empty(), b = new Run({ lay: false, mult: 3 });
  b.give('double');
  steps(a, 2);
  steps(b, 2);
  check(Math.abs(b.score - 6 * a.score) < 1e-6, 'the multiplier and double both multiply the score');
  steps(b, POWER_TIME.double[0]);
  check(b.power.double === 0 && says(b, 'powerEnd'), 'power-ups run out');
  const up = new Run({ lay: false, levels: { magnet: 5 } });
  up.give('magnet');
  check(up.power.magnet === POWER_TIME.magnet[5], 'upgrades make them last longer');
}

{
  // Balloons, and the bubble.
  const r = empty();
  r.train(0, 30, 3);
  r.add({ kind: 'low', lane: 0, s0: 20, s1: 20.5 });
  r.give('fly');
  steps(r, 3);
  check(!r.dead && r.y > FLY_HEIGHT - 0.3, 'balloons float over everything');
  check(r.coins > 5, 'along a trail of coins');
  r.train(0, r.s + speedAt(r.s) * (r.power.fly + 0.6), 3);
  steps(r, r.power.fly + 4);
  check(!r.dead, 'and coming down is safe, even onto a train');
  const b = empty();
  b.train(0, 12, 2);
  b.give('bubble');
  steps(b, 1.2);
  check(!b.dead && b.power.bubble === 0 && says(b, 'pop'), 'a bubble shrugs off one crash');
  steps(b, 3);
  check(!b.dead, 'and leaves you somewhere safe');
  const c = empty();
  c.train(0, 12, 2);
  steps(c, 1.2);
  c.revive();
  steps(c, 3);
  check(!c.dead, 'carrying on after a crash leaves you somewhere safe too');
}

// ---- the line ---------------------------------------------------------------------------

function lineProblems(r, seen) {
  const out = [];
  const obs = r.obstacles;
  for (const o of obs) {
    if (seen.has(o.id)) continue;
    seen.add(o.id);
    if (o.lane < -1 || o.lane > 1) out.push('something off the line');
    if (!(o.s1 > o.s0)) out.push('something with no length');
    if (o.kind === 'ramp' && !obs.some((t) => t.kind === 'train' && t.lane === o.lane && Math.abs(t.s0 - o.s1) < 1e-6)) out.push('a ramp with no train behind it');
    // Things standing still never overlap.
    if (!o.v) for (const q of obs) if (q !== o && !q.v && q.lane === o.lane && q.s0 < o.s1 - 1e-6 && o.s0 < q.s1 - 1e-6) out.push(`${o.kind} and ${q.kind} on top of each other`);
  }
  return out;
}

// The practice player keeps to the safe lane: it steps across when the
// safe lane moves, jumps the fences and carts and rolls under the
// barriers. If it always gets through, there is always a way through.
function practise(seed, far) {
  const r = new Run({ seed });
  const seen = new Set(), problems = new Set();
  let moves = 0;
  const act = (a) => { r.input(a); moves++; };
  while (!r.dead && r.s < far) {
    r.step();
    r.events.length = 0;
    if (r.dead) break;
    if (Math.round(r.t / STEP) % 12 === 0) for (const p of lineProblems(r, seen)) problems.add(p);
    const want = r.safeLane(r.s);
    if (want !== r.lane && !r.blockedBeside(r.lane + Math.sign(want - r.lane))) act(want < r.lane ? 'left' : 'right');
    // (Nothing to do while nothing can hurt it.)
    if (r.lane !== want || r.ghost > 0.3 || r.flying || r.landing) continue;
    // The next thing in this lane.
    let o = null;
    for (const q of r.obstacles) if (q.lane === r.lane && q.s1 > r.s - 0.2 && (!o || q.s0 < o.s0)) o = q;
    if (!o) continue;
    const gap = (o.s0 - r.s) / r.speed; // seconds away
    if ((o.kind === 'low' || o.kind === 'cart') && r.grounded && gap < 0.3 && gap > 0 && r.y < 0.5) act('up');
    else if (o.kind === 'high' && gap < 0.26 && gap > -0.02 && !r.rolling) {
      if (r.grounded || !r.rollOnLand) act('down');
    }
  }
  return { r, problems: [...problems], moves };
}

let reached = 0;
const t0 = performance.now();
for (let k = 0; k < runs; k++) {
  const { r, problems, moves } = practise(100 + k, metres);
  for (const p of problems) check(false, `line ${100 + k}: ${p}`);
  check(!r.dead, `line ${100 + k}: the practice player was stopped at ${Math.round(r.s)} m by a ${r.cause} (lane ${r.lane}, height ${r.y.toFixed(1)})`);
  if (!r.dead) reached++;
  if (k === 0) console.log(`line 100: ${Math.round(r.s)} m in ${Math.round(r.t)} s with ${moves} moves, ${r.coins} coins, ${r.stats.dodged} rolling trains passed`);
}
console.log(`${reached}/${runs} lines run to ${metres} m (${((performance.now() - t0) / 1000).toFixed(1)} s)`);

{
  // The same seed lays the same line.
  const a = new Run({ seed: 77 }), b = new Run({ seed: 77 }), c = new Run({ seed: 78 });
  const sig = (r) => r.obstacles.map((o) => `${o.kind}${o.lane}@${o.s0.toFixed(2)}`).join(' ');
  check(sig(a) === sig(b), 'the same seed lays the same line');
  check(sig(a) !== sig(c), 'a different seed lays a different one');
}

console.log(failures ? `${failures} problem(s)` : 'All Honey Run checks passed.');
process.exit(failures ? 1 : 0);
