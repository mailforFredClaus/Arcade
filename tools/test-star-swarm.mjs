// Checks Star Swarm's rules against the arcade original's, then lets a
// simple robot player play whole games to make sure nothing ever jams.
// Usage: node tools/test-star-swarm.mjs [games] [furthest stage]

import {
  Game, W, H, PLAYER_Y, BEE, FLY, BOSS, MORPH, GUEST, POINTS, GROUP_BONUS, PERFECT_BONUS, BOSS_DIVE_POINTS, extraAt, isChallenge,
} from '../games/star-swarm/js/engine.js';

const games = Number(process.argv[2] || 12);
const maxStage = Number(process.argv[3] || 16);
let failures = 0;
const check = (ok, what) => { if (!ok) { failures++; console.log(`   FAIL: ${what}`); } };

// A game where nothing can touch the player and nobody attacks, for looking
// at one thing at a time.
function quiet(opts) {
  const g = new Game(opts);
  g.collideAll = g.collide;
  g.collide = () => {};
  g.director = () => {};
  return g;
}
const run = (g, until, max = 4000) => { let n = 0; while (!until(g) && n++ < max) g.step(); return n <= max; };

// ---- which stages are which --------------------------------------------------------
{
  const list = [];
  for (let s = 1; s <= 40; s++) if (isChallenge(s)) list.push(s);
  check(list.join() === '3,7,11,15,19,23,27,31,35,39', `Challenging Stages are ${list.join()}`);
  check(extraAt(0) === 20000 && extraAt(1) === 70000 && extraAt(2) === 140000, 'extra fighters at 20,000, 70,000, 140,000');
  console.log('Stages: Challenging Stages at 3, 7, 11, ... and extra fighters at 20,000 then every 70,000');
}

// ---- every ordinary stage fills the formation ----------------------------------------
{
  let slowest = 0;
  for (let s = 1; s <= 30; s++) {
    if (isChallenge(s)) continue;
    const g = quiet({ seed: s, stage: s });
    const ok = run(g, (q) => q.phase === 'battle' && q.enemies.every((e) => e.st === 'form'));
    slowest = Math.max(slowest, g.frame);
    const count = (k) => g.enemies.filter((e) => e.kind === k).length;
    const slots = new Set(g.enemies.map((e) => `${e.row},${e.col}`));
    check(ok, `stage ${s}: everyone reaches the formation`);
    check(g.enemies.length === 40 && count(BOSS) === 4 && count(FLY) === 16 && count(BEE) === 20, `stage ${s}: 4 bosses, 16 butterflies, 20 bees (got ${count(BOSS)}, ${count(FLY)}, ${count(BEE)})`);
    check(slots.size === 40, `stage ${s}: forty different places`);
    check(g.enemies.every((e) => e.row === (e.kind === BOSS ? 0 : e.kind === FLY ? (e.row <= 2 ? e.row : -1) : (e.row >= 3 ? e.row : -1))), `stage ${s}: bosses on top, butterflies, then bees`);
    check(s > 1 || g.eShots.length === 0, 'nobody shoots on the way in on stage 1');
  }
  console.log(`Formation: stages 1-30 each bring in 4 bosses, 16 butterflies and 20 bees (slowest ${(slowest / 60).toFixed(1)} s)`);
}

// ---- points -------------------------------------------------------------------------
{
  const g = quiet({ seed: 5 });
  run(g, (q) => q.phase === 'battle' && q.enemies.every((e) => e.st === 'form'));
  const of = (k) => g.enemies.find((e) => e.kind === k && e.st === 'form');
  const worth = (e) => { const before = g.score; g.destroy(e); return g.score - before; };
  check(worth(of(BEE)) === 50, 'a bee in the formation is 50');
  check(worth(of(FLY)) === 80, 'a butterfly in the formation is 80');
  check(worth(of(BOSS)) === 150, 'a boss in the formation is 150');
  const out = (k) => { const e = of(k); e.st = 'path'; return e; };
  check(worth(out(BEE)) === 100, 'a diving bee is 100');
  check(worth(out(FLY)) === 160, 'a diving butterfly is 160');
  check(worth(out(BOSS)) === 400, 'a diving boss alone is 400');
  for (const n of [1, 2]) {
    const boss = out(BOSS), squad = { aim: null, killed: 0, boss: boss.id };
    boss.squad = squad;
    for (let i = 0; i < n; i++) { const e = out(FLY); e.squad = squad; check(worth(e) === 160, 'an escort is 160'); }
    check(worth(boss) === BOSS_DIVE_POINTS[n], `a diving boss after ${n} escort${n > 1 ? 's' : ''} is ${BOSS_DIVE_POINTS[n]}`);
  }
  // Bosses take two hits; the first scores nothing.
  const g2 = quiet({ seed: 6 });
  run(g2, (q) => q.phase === 'battle' && q.enemies.every((e) => e.st === 'form'));
  const boss = g2.enemies.find((e) => e.kind === BOSS);
  g2.collide = g2.collideAll;
  g2.pShots.push({ x: boss.x, y: boss.y + 4, v: 1 });
  g2.collide();
  check(g2.enemies.includes(boss) && boss.hp === 1 && g2.score === 0, 'a boss survives its first hit, for no points');
  g2.pShots.push({ x: boss.x, y: boss.y + 4, v: 2 });
  g2.collide();
  check(!g2.enemies.includes(boss) && g2.score === 150, 'and goes with the second');
  // Extra fighters.
  const g3 = quiet({ seed: 7 });
  g3.addScore(19990); check(g3.reserves === 2, 'no extra fighter before 20,000');
  g3.addScore(10); check(g3.reserves === 3, 'one at 20,000');
  g3.addScore(50000); check(g3.reserves === 4, 'one at 70,000');
  g3.addScore(70000); check(g3.reserves === 5, 'one at 140,000');
  console.log('Points: 50/100, 80/160, 150/400/800/1600, two hits for a boss, extra fighters on time');
}

// ---- Challenging Stages ---------------------------------------------------------------
for (const [no, s] of [3, 7, 11, 15, 19, 23, 27, 31, 35].entries()) {
  // Let them all go by.
  const g = quiet({ seed: s, stage: s });
  let seen = new Set(), low = 0;
  const ok = run(g, (q) => { for (const e of q.enemies) { seen.add(e.id); low = Math.max(low, e.y); } return q.stage > s; }, 9000);
  check(ok, `stage ${s}: the Challenging Stage ends`);
  check(seen.size === 40, `stage ${s}: forty fly past (${seen.size})`);
  check(g.score === 0 && g.eShots.length === 0, `stage ${s}: no points for no hits, and nobody shoots`);
  // Shoot every one of them.
  const h = quiet({ seed: s, stage: s });
  run(h, (q) => { for (const e of q.enemies.slice()) if (e.y > 30 && e.x > 10 && e.x < W - 10) q.destroy(e); return q.stage > s; }, 9000);
  const want = 40 * 100 + 5 * GROUP_BONUS[Math.min(7, no)] + PERFECT_BONUS;
  check(h.score === want, `stage ${s}: a perfect score is ${want} (got ${h.score})`);
  if (no === 0) console.log(`Challenging Stage: forty fly past; all forty is 40 x 100 + 5 x ${GROUP_BONUS[0]} + ${PERFECT_BONUS} = ${want}`);
}

// ---- capture and rescue ----------------------------------------------------------------
{
  const g = new Game({ seed: 11 });
  g.director = () => {};
  const base = g.collide.bind(g);
  g.collide = () => {};
  run(g, (q) => q.phase === 'battle' && q.enemies.every((e) => e.st === 'form'));
  // Send a boss down with its beam, and sit under it.
  const boss = g.enemies.find((e) => e.kind === BOSS);
  g.launch(boss, [['F', 16, -11.25], ['G'], ['B'], ['A', 30], ['Y', H + 14], ['W']]);
  const caught = run(g, (q) => q.player.captured, 1200);
  check(caught && boss.captive, 'a fighter under the beam is captured');
  check(g.reserves === 2, 'the fighter is lost when captured, not before');
  run(g, (q) => q.player.st === 'alive', 1500);
  check(g.reserves === 1 && !g.player.dual, 'the next fighter comes out');
  run(g, () => boss.st === 'form', 1500);
  // Shoot the boss on its way down: the fighter comes back, and now there are two.
  boss.hp = 1;
  boss.st = 'path';
  boss.sc = [['Y', 150], ['X']];
  boss.pc = 0;
  boss.a = Math.PI;
  for (let i = 0; i < 20; i++) g.step();
  g.destroy(boss);
  check(g.rescue !== null, 'shooting its boss mid-dive frees the fighter');
  const docked = run(g, (q) => q.player.dual, 900);
  check(docked && g.ships().length === 2, 'the freed fighter joins up: a dual fighter');
  const before = g.shots;
  g.step({ fire: true });
  check(g.shots === before + 2 && g.pShots.length === 2, 'the dual fighter fires two shots at once');
  // A hit takes one of the pair.
  g.collide = base;
  g.eShots.push({ x: g.player.x - 8, y: PLAYER_Y, vx: 0, vy: 0 });
  g.collide();
  check(!g.player.dual && g.player.st === 'alive' && g.reserves === 1, 'a hit on the dual fighter costs one of the pair');
  console.log('Capture: the beam takes a fighter, shooting the boss mid-dive wins it back as a dual fighter');
}

// ---- shots outrun the attackers ---------------------------------------------------------
{
  let ok = true, lean = 0, early = 0;
  for (let s = 1; s <= 30; s++) {
    const g = quiet({ seed: s, stage: s });
    // A shot must be well clear before whoever fired it gets there.
    if (!(g.shotV >= g.diveV * 1.4)) ok = false;
    if (s === 1 && (g.ammo !== 0 || g.armed !== 0)) early++;
    if (s === 2 && !(g.ammo === 1 && g.armed > 0 && g.armed < 1)) early++;
  }
  check(ok, 'on every stage shots fall well faster than attackers fly');
  check(early === 0, 'nobody shoots on stage 1, and only some of them on stage 2');
  // Play a stage without firing and look at every shot the enemies fire.
  const g = new Game({ seed: 5, stage: 4 });
  g.collide = () => {}; // nothing can touch the player
  const seen = new Set();
  let n = 0, high = 0;
  run(g, (q) => {
    for (const sh of q.eShots) {
      if (seen.has(sh)) continue;
      seen.add(sh);
      n++;
      lean = Math.max(lean, Math.abs(sh.vx / sh.vy));
      if (sh.y < 100 && q.phase === 'battle') high++;
    }
    return n >= 40;
  }, 60 * 120);
  check(n >= 40, `attackers do shoot on stage 4 (${n} shots)`);
  check(lean <= 0.2701, `a shot leans at most 0.27 sideways per pixel down (${lean.toFixed(2)})`);
  check(high <= n * 0.1, `attackers fire on the way down, not as they set off (${high} of ${n} from the formation)`);
  console.log(`Shots: fall ${quiet({ seed: 1, stage: 2 }).shotV.toFixed(2)} px a frame on stage 2 against attackers flying at ${quiet({ seed: 1, stage: 2 }).diveV.toFixed(2)}`);
}

// ---- a robot plays -----------------------------------------------------------------------

function robot(g) {
  const p = g.player;
  if (p.st !== 'alive') return {};
  const safe = (x) => {
    for (const s of g.eShots) {
      const t = (p.y - s.y) / s.vy;
      if (t >= 0 && t < 26 && Math.abs(s.x + s.vx * t - x) < (p.dual ? 19 : 11)) return false;
    }
    for (const e of g.enemies) {
      if (e.st === 'form' || e.y < 150 || e.y > p.y + 12) continue;
      if (Math.abs(e.x + Math.sin(e.a) * e.v * 8 - x) < (p.dual ? 24 : 16)) return false;
    }
    for (const e of g.enemies) if (e.bt >= 0 && Math.abs(e.x - x) < 30) return false;
    return true;
  };
  // Go for whatever is lowest.
  let target = null;
  for (const e of g.enemies) if (e.y > 20 && (!target || e.y > target.y) && e.y < p.y - 20) target = e;
  const want = target ? target.x : W / 2;
  const moves = [0, -2, 2].sort((a, b) => Math.abs(p.x + a * 6 - want) - Math.abs(p.x + b * 6 - want));
  const dx = moves.find((m) => safe(p.x + m * 6)) ?? moves[0];
  return { left: dx < 0, right: dx > 0, fire: g.frame % 5 === 0 };
}

function play(seed, limit) {
  const g = new Game({ seed });
  const stages = [];
  let last = 0, lastScore = 0, events = 0;
  for (let n = 0; n < 60 * 60 * 30 && !g.over && g.stage <= limit; n++) {
    g.step(robot(g));
    events += g.events.length;
    g.events.length = 0;
    if (g.stage !== last) { stages.push(g.stage); last = g.stage; }
    if (g.score < lastScore) { check(false, `seed ${seed}: the score went down`); break; }
    lastScore = g.score;
    if (g.score % 10) { check(false, `seed ${seed}: a score not in tens (${g.score})`); break; }
    if (g.enemies.length > 46 || g.eShots.length > g.maxShots || new Set(g.pShots.map((s) => s.v)).size > 2) { check(false, `seed ${seed}: too much on screen`); break; }
    if (g.enemies.some((e) => !Number.isFinite(e.x + e.y + e.a))) { check(false, `seed ${seed}: an enemy lost its place`); break; }
  }
  check(g.over || g.stage > limit, `seed ${seed}: the game got stuck at stage ${g.stage} (${g.phase}, ${g.enemies.length} left, player ${g.player.st})`);
  check(stages.every((s, i) => s === i + 1), `seed ${seed}: stages in order`);
  check(g.hits <= g.shots, `seed ${seed}: no more hits than shots`);
  return g;
}

let reached = 0, best = 0, frames = 0;
const t0 = performance.now();
for (let seed = 1; seed <= games; seed++) {
  const g = play(seed, maxStage);
  const again = play(seed, maxStage);
  check(again.score === g.score && again.frame === g.frame, `seed ${seed}: the same game twice plays out the same`);
  reached += g.stage;
  best = Math.max(best, g.score);
  frames += g.frame;
  console.log(`Game ${String(seed).padStart(2)}: ${g.over ? 'over at' : 'reached'} stage ${String(g.stage).padStart(2)}, ${String(g.score).padStart(7)} points, ` +
    `${g.hits}/${g.shots} hits, ${(g.frame / 3600).toFixed(1)} min${g.player.dual ? ', dual fighter' : ''}`);
}
console.log(`\n${games} robot games: stage ${(reached / games).toFixed(1)} on average, best score ${best}, ` +
  `${Math.round(frames / ((performance.now() - t0) / 1000) / 60 / 2)}x real time`);
console.log(failures ? `${failures} checks failed` : 'All checks passed');
process.exit(failures ? 1 : 0);
