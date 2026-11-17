// Checks Haywire: that the map is fair and can be walked all over, the rules
// one at a time (moving, shooting, reloading, grenades, scoring, and the old
// arms: swords, shields, bows and things thrown), and then, in each mode,
// whole matches played by the bots: that they finish, that nobody gets
// stuck or falls out of the yard, that neither end of the yard is the
// better one, that harder bots beat easier ones, and that the same match
// always plays out the same way.
// Usage: node tools/test-haywire.mjs [matches]

import { buildMap } from '../games/haywire/js/map.js';
import { buildLine } from '../games/haywire/js/line.js';
import { buildFront } from '../games/haywire/js/front.js';
import { Match, STEP, GUNS, BASH, CLASSES, OLD_CLASSES, MODES, TALL_PRONE, SLIDE_TIME, DROP_TIME, REVIVE_WAIT, REVIVE_TIME, REVIVE_HP, SQUAD_CALM, BATTALIONS, OUT_TIME, RETREAT, ROUT, RESPAWN, REGEN_DELAY, NADE_FUSE, JUMP, GRAVITY, WALK, TALL, TALL_CROUCH } from '../games/haywire/js/engine.js';
import { STEP_UP } from '../games/haywire/js/world.js';

const matches = Number(process.argv[2] || 12);
let failures = 0;
const check = (ok, what) => {
  if (!ok) {
    failures++;
    console.log(`FAIL: ${what}`);
  }
};
const map = buildMap(), w = map.world;

// ---- the map ----------------------------------------------------------------------------

{
  // The same turned half a turn, but for the far-off buildings round the edge.
  let differ = 0;
  for (let z = 3; z < w.H - 3; z++) {
    for (let x = 3; x < w.W - 3; x++) {
      const i = z * w.W + x, j = (w.H - 1 - z) * w.W + (w.W - 1 - x);
      let same = w.first[i + 1] - w.first[i] === w.first[j + 1] - w.first[j];
      for (let k = 0; same && k < w.first[i + 1] - w.first[i]; k++) {
        same = Math.abs(w.lo[w.first[i] + k] - w.lo[w.first[j] + k]) < 1e-4 && Math.abs(w.hi[w.first[i] + k] - w.hi[w.first[j] + k]) < 1e-4;
      }
      if (!same) differ++;
    }
  }
  check(differ === 0, `the east half is the west half turned round (${differ} columns differ)`);

  const s0 = map.spawns[0][0], home = w.nodeAt(s0.x, 0.1, s0.z), reach = w.reachFrom(home);
  const places = [...map.spawns[0], ...map.spawns[1]].map((p) => ({ ...p, y: 0, what: 'spawn' }))
    .concat(map.spots.map((p) => ({ ...p, what: `spot (${p.name})` })), map.perches.map((p) => ({ ...p, what: 'perch' })));
  for (const p of places) {
    const n = w.nodeAt(p.x, p.y + 0.1, p.z);
    const ok = n >= 0 && reach[n] && Math.abs(w.nodeY[n] - p.y) < 0.01;
    check(ok, `a ${p.what} at ${p.x}, ${p.y}, ${p.z} can be walked to`);
    if (ok) check(w.path(n, home) !== null, `and back from the ${p.what} at ${p.x}, ${p.z}`);
    check(!w.blocked(p.x, p.y, p.z, 0.32, TALL, STEP_UP), `there is room to stand at the ${p.what} at ${p.x}, ${p.z}`);
  }
  check(map.spawns[0].length === map.spawns[1].length && map.spawns[0].length >= 8, 'each team has the same number of places to come in');
}

// ---- the world's rules ------------------------------------------------------------------

{
  // Looking east from the blue base: the wall is at x = 15.
  const t = w.ray(10.5, 1.6, 20.5, 1, 0, 0, 50);
  check(Math.abs(t - 4.5) < 1e-6 && w.hit.nx === -1, 'a ray stops at the wall it meets');
  check(w.ray(10.5, 1.6, 31.5, 1, 0, 0, 3) === Infinity, 'and misses what is out of reach');
  check(Math.abs(w.ray(10.5, 1.6, 20.5, 0, -1, 0, 9) - 1.6) < 1e-6 && w.hit.ny === 1, 'a ray straight down finds the floor');
  check(!w.sees(10.5, 1.6, 20.5, 20.5, 1.6, 20.5) && w.sees(10.5, 1.6, 31.5, 18, 1.6, 31.5), 'walls block the view and gates do not');

  const body = () => ({ x: 10.5, y: 0, z: 20.5, vx: 0, vy: 0, vz: 0, r: 0.32, h: TALL, grounded: true });
  const a = body();
  a.vx = 5;
  for (let k = 0; k < 120; k++) w.move(a, STEP, GRAVITY);
  check(Math.abs(a.x - (15 - 0.32)) < 0.1 && a.vx === 0, 'a body walks up to a wall and stops');
  // Up the warehouse stairs: eight steps of half a metre.
  const b = body();
  b.x = 22; b.z = 18.6; b.vz = -4;
  let top = 0;
  for (let k = 0; k < 150; k++) { b.vz = -4; w.move(b, STEP, GRAVITY); top = Math.max(top, b.y); }
  check(Math.abs(top - 4) < 1e-4 && b.grounded, 'stairs are climbed a step at a time');
  // Off the gantry: a four-metre drop.
  const c = body();
  c.x = 44.5; c.y = 4; c.z = 24.5; c.vx = 3;
  let landed = false;
  for (let k = 0; k < 120 && !landed; k++) { c.vx = 3; landed = w.move(c, STEP, GRAVITY); }
  check(landed && c.y === 0, 'a body walks off a ledge, falls and lands');
  // A crate one metre high stops a walk but not a jump.
  const d = body();
  d.x = 5.4; d.z = 31.5; d.vx = 4;
  for (let k = 0; k < 60; k++) { d.vx = 4; w.move(d, STEP, GRAVITY); }
  check(d.y === 0 && d.x < 6, 'a crate is too high to walk up onto');
  d.vy = JUMP; d.grounded = false;
  for (let k = 0; k < 60; k++) { d.vx = 4; w.move(d, STEP, GRAVITY); }
  check(d.y === 1 && d.grounded, 'but can be jumped onto');
  check(Math.abs((JUMP * JUMP) / (2 * GRAVITY) - 1.02) < 0.05, 'a jump rises about a metre');
}

// ---- the rules of a match, one at a time ------------------------------------------------

// A match with every robot under the test's control, two of them set facing
// each other `apart` metres from each other, down the long clear strip
// behind the blue base's wall.
function duel(apart = 6, clsA = 0, clsB = 0, mode = 0) {
  const m = new Match(map, { seed: 5, scoreLimit: 3, mode });
  for (const s of m.soldiers) { s.bot = null; s.nextCls = s.team ? clsB : clsA; }
  for (let k = 0; k < 30; k++) m.step();
  m.events.length = 0;
  const a = m.soldiers[0], b = m.soldiers[8];
  a.x = 13.5; a.z = 6; b.x = 13.5; b.z = 6 + apart;
  for (const s of [a, b]) { s.y = 0; s.vx = s.vz = 0; s.protect = 0; }
  a.in.yaw = Math.PI; b.in.yaw = 0;
  // Everyone else out of the way and harmless.
  m.soldiers.forEach((s, i) => { if (s !== a && s !== b) { s.x = s.team ? 80 : 6; s.z = 8 + (i % 8) * 6; } });
  return { m, a, b };
}
const run = (m, secs) => { for (let k = 0; k < Math.round(secs / STEP); k++) m.step(); };
const has = (m, e) => m.events.some((x) => x.e === e);

{
  // Walking, sprinting, crouching.
  const { m, a } = duel(40);
  a.in.mz = 1;
  run(m, 1);
  const walked = a.z - 6;
  check(Math.abs(walked - WALK) < 0.3, `walks ${WALK} m a second`);
  a.in.sprint = true;
  const z0 = a.z;
  run(m, 1);
  check(a.z - z0 > walked * 1.3 && a.sprinting, 'sprinting is faster');
  a.in.fire = true;
  run(m, 0.3);
  check(!a.sprinting && a.shots > 0, 'firing breaks a sprint, then fires');
  a.in.fire = a.in.sprint = false;
  a.in.crouch = true;
  const z1 = a.z;
  run(m, 1);
  check(a.crouching && a.h === TALL_CROUCH && a.z - z1 < walked * 0.6, 'crouching is lower and slower');
  a.in.crouch = false;
  a.in.mz = 0;
  run(m, 0.3);
  check(!a.crouching && a.h === TALL, 'and it stands again');
  a.in.jump = true;
  m.step();
  check(!a.grounded && has(m, 'jump'), 'jumps');
}

{
  // The rifle: four hits to the body, down the sights, at six metres.
  const { m, a, b } = duel(6);
  a.in.ads = true;
  run(m, 0.5);
  a.in.pitch = Math.atan2(1.0 - 1.62, 6);
  a.in.fire = true;
  m.step();
  check(b.hp === 100 - GUNS.rifle.dmg && a.weapons[0].mag === 29, 'a rifle round takes 26 from the body');
  run(m, 0.5);
  check(!b.alive && a.kills === 1 && m.scores[0] === 1 && b.deaths === 1 && a.score === 100, 'four of them scrap a robot, for a point');
  check(a.shots > 4, 'and the rifle keeps firing while the trigger is held');
  a.in.fire = false;
  run(m, RESPAWN - 0.6);
  check(!b.alive, `a scrapped robot is out for ${RESPAWN} seconds`);
  run(m, 0.7);
  check(b.alive && b.hp === 100 && b.protect > 0, 'then comes back whole, and safe for a moment');
}

{
  // Head shots, and damage falling off with distance.
  const { m, a, b } = duel(6);
  a.in.ads = true;
  run(m, 0.5);
  a.in.pitch = Math.atan2(1.67 - 1.62, 6);
  a.in.fire = true;
  m.step();
  check(Math.abs(b.hp - (100 - GUNS.rifle.dmg * GUNS.rifle.head)) < 1e-6, 'a head shot does half as much again');
  const far = duel(44);
  far.a.in.ads = true;
  run(far.m, 0.5);
  far.a.in.pitch = Math.atan2(1.0 - 1.62, 44);
  far.a.in.fire = true;
  for (let k = 0; k < 40 && far.b.hp === 100; k++) far.m.step();
  const lost = 100 - far.b.hp;
  check(lost > GUNS.rifle.dmg * GUNS.rifle.min - 0.01 && lost < GUNS.rifle.dmg - 1, `a rifle round does less at 44 m (${lost.toFixed(1)})`);
}

{
  // Sights tighten the aim; moving and firing loosen it.
  const { m, a } = duel(30);
  const hip = m.spread(a);
  a.in.ads = true;
  run(m, 0.5);
  check(m.spread(a) < hip * 0.2 && a.ads === 1, 'aiming down the sights is far tighter than the hip');
  const still = m.spread(a);
  a.in.fire = true;
  run(m, 0.3);
  check(m.spread(a) > still && a.kp > 0, 'firing loosens the aim and kicks the view up');
  a.in.fire = false;
  run(m, 1.5);
  check(Math.abs(m.spread(a) - still) < 1e-4 && a.kp < 0.002, 'and both settle again');
}

{
  // Reloading; single shots; the shotgun's shells.
  const { m, a } = duel(30);
  a.in.fire = true;
  run(m, GUNS.rifle.rate * 31 + 0.2);
  check(a.weapons[0].mag === 0 && a.reloadT > 0 && has(m, 'reload'), 'an empty rifle reloads by itself');
  a.in.fire = false;
  run(m, GUNS.rifle.reload);
  check(a.weapons[0].mag === 30 && a.weapons[0].reserve === 150, 'a reload fills the magazine from the reserve');
  a.in.slot = 1;
  m.step();
  a.in.slot = -1;
  run(m, 0.5);
  a.in.fire = true;
  run(m, 1);
  check(a.slot === 1 && a.weapons[1].mag === 11, 'the pistol fires once for each pull of the trigger');
  const s = duel(30, 2);
  s.a.in.fire = true;
  s.m.step();
  s.a.in.fire = false;
  check(s.a.weapons[0].mag === 5 && s.m.events.filter((e) => e.e === 'shot').length === 8, 'the shotgun fires eight pellets at once');
  s.a.in.reload = true;
  run(s.m, GUNS.shotgun.reload + 0.05);
  s.a.in.reload = false;
  check(s.a.weapons[0].mag === 6, 'and reloads a shell at a time');
}

{
  // Mending.
  const { m, a, b } = duel(6);
  a.in.ads = true;
  run(m, 0.5);
  a.in.pitch = Math.atan2(1.0 - 1.62, 6);
  a.in.fire = true;
  m.step();
  a.in.fire = false;
  run(m, REGEN_DELAY - 0.2);
  check(b.hp < 100, 'damage stays for a few seconds');
  run(m, 1.5);
  check(b.hp === 100, 'then mends by itself');
}

{
  // Grenades.
  const { m, a, b } = duel(13);
  a.in.pitch = 0.15;
  a.in.nade = true;
  m.step();
  a.in.nade = false;
  check(m.nades.length === 1 && a.nadeCount === 1, 'a grenade is thrown');
  run(m, NADE_FUSE - 0.1);
  check(m.nades.length === 1 && b.hp === 100, 'it bounces and lies there');
  const n = m.nades[0];
  const d = Math.hypot(b.x - n.x, b.z - n.z);
  run(m, 0.2);
  check(m.nades.length === 0 && has(m, 'boom'), `and goes off after ${NADE_FUSE} seconds`);
  check(d > 6.5 || b.hp < 100, `hurting what is near it (it landed ${d.toFixed(1)} m away, leaving ${Math.ceil(b.hp)})`);
  // One right at a robot's feet scraps it; a wall in between saves it.
  const g = duel(13);
  g.m.nades.push({ x: g.b.x + 0.8, y: 0.1, z: g.b.z, px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, fuse: 0.05, by: 0, team: 0, rest: true });
  run(g.m, 0.1);
  check(!g.b.alive && g.a.kills === 1, 'a grenade at its feet scraps a robot');
  const h = duel(13);
  h.b.x = 16.5; h.b.z = 20.5; h.b.y = 0; // just east of the base wall
  h.m.nades.push({ x: 14.4, y: 0.1, z: 20.5, px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, fuse: 0.05, by: 0, team: 0, rest: true });
  run(h.m, 0.1);
  check(h.b.hp === 100, 'but not through a wall');
  const own = duel(13);
  own.m.nades.push({ x: own.a.x + 0.5, y: 0.1, z: own.a.z, px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, fuse: 0.05, by: 0, team: 0, rest: true });
  run(own.m, 0.1);
  check(!own.a.alive && own.m.scores[0] === 0 && own.m.scores[1] === 0, 'your own grenade can scrap you, for no points');
}

{
  // Assists, the end of a match, and changing class.
  const { m, a, b } = duel(6);
  const helper = m.soldiers[1];
  helper.x = 12; helper.z = 6; helper.y = 0; helper.protect = 0;
  helper.in.yaw = Math.atan2(b.x - helper.x, -(b.z - helper.z));
  helper.in.ads = a.in.ads = true;
  run(m, 0.5);
  helper.in.pitch = a.in.pitch = Math.atan2(1.0 - 1.62, 6);
  helper.in.fire = true;
  run(m, 0.12);
  helper.in.fire = false;
  a.in.fire = true;
  run(m, 0.4);
  check(!b.alive && a.kills === 1 && helper.assists === 1 && helper.score === 40, 'helping to scrap a robot is an assist');
  check(!m.over, 'one point does not end a match to three');
  m.scores[0] = 2;
  a.in.fire = false;
  b.in.cls = 4;
  run(m, RESPAWN + 0.2);
  check(b.alive && CLASSES[b.cls].id === 'marksman' && b.weapons[0].gun.id === 'sniper', 'a change of class takes effect on coming back');
  b.x = 13.5; b.z = 12; b.y = 0; b.protect = 0;
  a.in.fire = true;
  run(m, 1);
  check(m.over && m.winner === 0 && has(m, 'over'), 'reaching the target ends the match');
  const t = m.tick;
  m.step();
  check(m.tick === t, 'and nothing more happens after that');
  const clock = new Match(map, { seed: 2, timeLimit: 1 });
  for (const s of clock.soldiers) s.bot = null;
  run(clock, 1.1);
  check(clock.over && clock.winner === -1, 'the clock running out ends it too: a draw if the scores are level');
}

{
  // Moving spoils the aim, down the sights too, and the sights sway; it takes a moment to steady.
  const { m, a } = duel(40);
  a.in.ads = true;
  run(m, 0.6);
  const still = m.spread(a);
  check(a.swY === 0 && a.swP === 0, 'standing still, the sights are steady');
  a.in.mz = 1;
  run(m, 0.6);
  check(m.spread(a) > still * 3.5 && (a.swY !== 0 || a.swP !== 0), `walking, the shots scatter far more (${(m.spread(a) / still).toFixed(1)} times) and the sights sway`);
  a.in.mz = 0;
  m.step();
  check(m.spread(a) > still * 1.5, 'and they take a moment to steady after stopping');
  run(m, 1);
  check(m.spread(a) < still * 1.1, 'then they are steady again');
  a.in.crouch = true;
  run(m, 0.3);
  a.in.mz = 1;
  run(m, 0.6);
  const crawl = m.spread(a);
  a.in.crouch = false;
  run(m, 0.6);
  check(crawl < m.spread(a), 'walking crouched spoils it less');
}

{
  // Rounds going close past pin a robot down.
  const { m, a, b } = duel(20);
  b.x += 1.2; // a step to the side of where a is aiming
  b.in.ads = true;
  run(m, 0.5);
  const steady = m.spread(b);
  a.in.ads = true;
  run(m, 0.5);
  a.in.pitch = 0;
  a.in.fire = true;
  run(m, 0.6);
  a.in.fire = false;
  check(b.supp > 0.5 && b.hp === b.maxHp && m.spread(b) > steady * 1.4, 'rounds going close past pin a robot down, spoiling its aim, without a scratch');
  run(m, 3);
  check(b.supp < 0.1, 'and it gets over it');
}

{
  // Lying down.
  const { m, a, b } = duel(6);
  a.in.prone = true;
  m.step();
  check(a.prone && a.h === TALL_PRONE && a.stanceT > 0, 'Z lies down, which takes a moment');
  a.in.fire = true;
  m.step();
  check(a.shots === 0, 'no firing while getting down');
  a.in.fire = false;
  run(m, 0.6);
  check(Math.abs(m.eyeY(a) - a.y - 0.42) < 0.02, 'the eye is down near the ground');
  a.in.mz = 1;
  const z0 = a.z;
  run(m, 1);
  check(a.z - z0 > 0.6 && a.z - z0 < 1.6, `a robot lying down crawls (${(a.z - z0).toFixed(1)} m a second)`);
  a.in.mz = 0;
  run(m, 1);
  const hip = m.spread(a);
  a.in.prone = false;
  run(m, 0.7);
  check(m.spread(a) > hip * 1.5 && !a.prone && !a.crouching, 'lying down is steadier than standing; and it stands again');
  a.in.prone = true;
  run(m, 0.7);
  b.in.ads = true;
  run(m, 0.4);
  b.in.pitch = Math.atan2(1.67 - 1.62, b.z - a.z);
  b.in.fire = true;
  run(m, 0.5);
  b.in.fire = false;
  check(a.hp === 100, 'shots at a standing robot\'s head height pass over one lying down');
  b.in.pitch = Math.atan2(a.y + 0.26 - 1.62, b.z - a.z);
  b.in.fire = true;
  run(m, 0.5);
  check(!a.alive, 'shots at its body find it');
}

{
  // A slide.
  const { m, a } = duel(40);
  a.in.mz = 1;
  a.in.slide = true;
  m.step();
  check(a.slideT <= 0, 'there is no slide from a walk');
  a.in.slide = false;
  a.in.sprint = true;
  run(m, 0.6);
  const z0 = a.z;
  a.in.slide = true;
  m.step();
  a.in.slide = false;
  a.in.sprint = false;
  check(a.slideT > 0 && a.crouching && has(m, 'slide'), 'from a sprint, a slide: low and fast');
  run(m, SLIDE_TIME - 0.05);
  const went = a.z - z0;
  check(went > 4.5 && went < 7, `it goes ${went.toFixed(1)} m and slows`);
  run(m, 0.2);
  check(a.slideT <= 0 && !a.crouching, 'and it is over, back on its feet');
}

{
  // Weapons dropped by the scrapped. (Here a rifle, and a Runner's submachine gun.)
  const { m, a, b } = duel(1, 0, 1);
  const theirs = b.weapons[0].gun.id;
  m.scrap(b, a, 'rifle', false);
  check(m.drops.length === 1 && m.drops[0].gun === theirs, 'a scrapped robot drops its main weapon');
  a.weapons[0].mag = 3;
  a.weapons[0].reserve = 0;
  a.in.use = true;
  m.step();
  a.in.use = false;
  check(a.weapons[0].gun.id === theirs && a.weapons[0].mag + a.weapons[0].reserve >= GUNS[theirs].mag && has(m, 'pickup'), 'E takes it, with at least a magazine in it');
  check(m.drops.length === 1 && m.drops[0].gun === 'rifle' && m.drops[0].mag === 3, 'and leaves yours where it lay');
  // One like your own gives you its rounds as you pass.
  a.weapons[0].reserve = 0;
  const c = m.soldiers[9];
  c.x = 13.5; c.z = 6.8; c.y = 0;
  c.weapons[0] = { gun: GUNS[a.weapons[0].gun.id], mag: 10, reserve: 40 };
  m.scrap(c, a, 'rifle', false);
  run(m, 0.2);
  check(a.weapons[0].reserve === 50 && has(m, 'ammo'), 'walking over a weapon like your own takes its rounds');
  run(m, DROP_TIME + 0.5);
  check(m.drops.length === 0, `dropped weapons are gone after ${DROP_TIME} seconds`);
}

{
  // A blow with the gun; deathmatch in one arena of the Long Works.
  const { m, a, b } = duel(1.5);
  a.in.reload = true;
  a.weapons[0].mag = 10;
  run(m, 0.1);
  a.in.reload = false;
  a.in.melee = true;
  m.step();
  check(a.reloadT === 0 && has(m, 'swing') && b.hp === 100, 'a blow with the gun breaks off a reload, and takes a moment to land');
  run(m, BASH.wind + 0.02);
  check(b.hp === 100 - BASH.dmg, `then does ${BASH.dmg}`);
  a.in.fire = true;
  run(m, 0.3);
  check(a.shots === 1, 'the gun cannot fire until it is back in the hands');
  const behind = duel(1.5);
  behind.b.in.yaw = Math.PI;
  behind.a.in.melee = true;
  run(behind.m, BASH.wind + 0.05);
  check(!behind.b.alive && behind.a.kills === 1, 'from behind it scraps outright');

  const line = buildLine();
  line.advance.sectors.forEach((sec, k) => {
    const g = new Match(line, { seed: 4, arena: k, scoreLimit: 20 });
    check(sec.west.length >= 8 && sec.spots.length >= 4, `${sec.name} has places to come in at both ends, and places to make for`);
    let outside = 0, strays = 0;
    while (!g.over) {
      g.step();
      for (const ev of g.events) if (ev.e === 'kill' && ev.gun === 'out') strays++;
      g.events.length = 0;
      if (g.tick % 120 === 0) for (const s of g.soldiers) if (s.alive && (s.x < sec.x0 - 4 || s.x > sec.x1 + 4)) outside++;
    }
    check(g.scores[0] === 20 || g.scores[1] === 20, `a deathmatch in ${sec.name} is played to the end (${g.scores.join('-')})`);
    check(outside === 0 && strays <= 2, `and stays in it (${outside} seen outside, ${strays} scrapped for straying)`);
  });
  const lone = new Match(line, { seed: 4, arena: 2 });
  for (const s of lone.soldiers) s.bot = null;
  run(lone, 0.7);
  const stray = lone.soldiers[0];
  check(stray.x > 112 && stray.x < 118 && lone.soldiers[8].x > 154, 'blue comes in at the west end of the arena, orange at the east');
  stray.x = 105;
  run(lone, OUT_TIME + 0.2);
  check(!stray.alive, 'and leaving the arena gets a robot scrapped');
}

// ---- the old arms -------------------------------------------------------------------------

{
  // Classes 0 to 4 here: knight, archer, lancer, berserker, scout.
  const old = (apart, a = 0, b = 0) => duel(apart, a, b, 1);
  const aimFor = (a, dist, speed, grav) => { a.in.pitch = Math.atan2(1.0 - 1.62 + 0.08 + 0.5 * grav * (dist / speed) ** 2, dist); };

  // The sword.
  const s = old(2);
  check(s.a.weapons[0].gun.id === 'sword' && s.a.weapons[1].gun.id === 'knife' && s.a.hp === 110, 'a knight has a sword, a dagger and thicker plating');
  s.a.in.fire = true;
  s.m.step();
  check(s.b.hp === 110 && has(s.m, 'swing'), 'a swing takes a moment to land');
  run(s.m, GUNS.sword.wind + 0.02);
  check(s.b.hp === 110 - GUNS.sword.dmg, 'then takes 48 from whoever is in reach');
  run(s.m, GUNS.sword.rate * 2 + 0.2);
  check(!s.b.alive && s.a.kills === 1, 'three blows scrap a knight');
  const far = old(4);
  far.a.in.fire = true;
  run(far.m, 1);
  check(far.b.hp === 110 && far.a.shots > 0, 'a sword does not reach four metres');

  // The shield.
  const sh = old(2);
  sh.b.in.ads = true;
  sh.a.in.fire = true;
  run(sh.m, 0.3);
  check(sh.b.block && sh.b.hp === 110 && has(sh.m, 'block'), 'a raised shield stops a blow from the front');
  sh.a.in.fire = false;
  run(sh.m, 1.5);
  sh.b.in.yaw = Math.PI; // turned its back
  sh.a.in.fire = true;
  run(sh.m, 0.3);
  check(sh.b.hp < 110, 'but not one from behind');

  // The bow.
  const bow = old(20, 1);
  aimFor(bow.a, 20, GUNS.bow.speed, GUNS.bow.grav);
  bow.a.in.fire = true;
  run(bow.m, 0.5);
  check(bow.a.draw > 0.5 && bow.a.draw < 0.7 && bow.m.shots.length === 0, 'a bow is drawn while the button is held');
  run(bow.m, 0.6);
  bow.a.in.fire = false;
  bow.m.step();
  check(bow.a.draw === 0 && bow.m.shots.length === 1 && bow.a.weapons[0].mag === 23, 'and looses an arrow when it is let go');
  run(bow.m, 0.6);
  check(Math.abs(bow.b.hp - (110 - GUNS.bow.dmg)) < 1e-6 && bow.m.shots.length === 0, `a full draw does ${GUNS.bow.dmg} at twenty metres`);
  const half = old(8, 1);
  aimFor(half.a, 8, 34, GUNS.bow.grav);
  half.a.in.fire = true;
  run(half.m, GUNS.bow.drawTime * 0.45);
  half.a.in.fire = false;
  run(half.m, 0.6);
  check(half.b.hp < 110 && half.b.hp > 110 - GUNS.bow.dmg * 0.75, `a half draw does less (${(110 - half.b.hp).toFixed(0)})`);
  const stop = old(20, 1);
  aimFor(stop.a, 20, GUNS.bow.speed, GUNS.bow.grav);
  stop.b.in.ads = true;
  stop.a.in.fire = true;
  run(stop.m, 1.1);
  stop.a.in.fire = false;
  run(stop.m, 0.7);
  check(stop.b.hp === 110 && has(stop.m, 'block'), 'a shield stops an arrow');
  const wall = old(20, 1);
  wall.a.in.yaw = Math.PI / 2; // at the base wall
  wall.a.in.fire = true;
  run(wall.m, 1.1);
  wall.a.in.fire = false;
  run(wall.m, 0.5);
  check(has(wall.m, 'stick') && wall.m.shots.length === 0, 'an arrow sticks in a wall');

  // Throwing a pike; an axe through two at once; a dagger in the back.
  const pike = old(9, 2);
  aimFor(pike.a, 9, GUNS.spear.shot.speed, GUNS.spear.shot.grav);
  pike.a.in.ads = true;
  pike.m.step();
  check(pike.m.shots.length === 1 && pike.a.weapons[0].mag === 2 && has(pike.m, 'hurl'), 'the right button throws a pike');
  run(pike.m, 0.6);
  check(pike.b.hp === 110 - GUNS.spear.shot.dmg, 'which does 95');
  pike.a.in.ads = false;
  run(pike.m, 0.2);
  check(pike.a.weapons[0].mag === 2, 'one press throws one');
  const axe = old(2, 3);
  const other = axe.m.soldiers[9];
  other.x = 12.8; other.z = 8; other.y = 0; other.protect = 0;
  axe.a.in.fire = true;
  run(axe.m, GUNS.axe.wind + 0.05);
  check(axe.b.hp === 110 - GUNS.axe.dmg && other.hp < other.maxHp, 'an axe hits everyone in front of it');
  const back = old(1.5, 4);
  back.b.in.yaw = Math.PI; // facing away
  back.a.in.fire = true;
  run(back.m, GUNS.daggers.wind + 0.05);
  check(back.b.hp === 110 - GUNS.daggers.dmg * GUNS.daggers.back, 'a dagger in the back does double');

  // A fire pot.
  const pot = old(12);
  pot.a.in.pitch = 0.1;
  pot.a.in.nade = true;
  pot.m.step();
  pot.a.in.nade = false;
  run(pot.m, 1.6);
  check(pot.m.nades.length === 0 && has(pot.m, 'boom'), 'a fire pot bursts where it lands');
}

// ---- medics, revives and squads -------------------------------------------------------------

{
  check(CLASSES[5].medic && OLD_CLASSES[5].medic, 'there is a medic in both modes');
  // A medic (blue), a team-mate beside it, and an enemy.
  const { m, a, b } = duel(6, 5, 0);
  const c = m.soldiers[1];
  c.x = a.x + 1.2; c.z = a.z; c.y = 0; c.protect = 0;
  m.scrap(c, b, 'rifle', false);
  check(!c.alive && c.down === REVIVE_WAIT && m.drops.some((d) => d.owner === c.id), 'a scrapped robot lies there, for a medic to save');
  run(m, RESPAWN + 1);
  check(!c.alive, 'and waits, with a medic near, rather than come back in');
  a.in.use = true;
  run(m, REVIVE_TIME - 0.2);
  check(!c.alive && a.reviveT > 0, 'holding E beside it takes a moment');
  run(m, 0.3);
  a.in.use = false;
  check(c.alive && Math.abs(c.hp - c.maxHp * REVIVE_HP) < 1 && has(m, 'revive') && a.revives === 1, 'then it is back on its feet, with half its plating');
  check(!m.drops.some((d) => d.owner === c.id), 'with its own weapon (the one it dropped goes)');
  // Too late, and not for a robot that strayed.
  m.scrap(c, b, 'rifle', false);
  run(m, REVIVE_WAIT + 0.1);
  check(c.down === 0 && has(m, 'gone') && c.alive && Math.hypot(c.x - a.x, c.z - a.z) > 3, `after ${REVIVE_WAIT} seconds it is past saving, and comes back in as usual`);
  m.scrap(c, c, 'out', false);
  check(c.down === 0, 'one scrapped for leaving the fight cannot be saved');
  // Only a medic can; with none near, the scrapped come back in as usual.
  const plain = duel(6, 0, 0);
  const d = plain.m.soldiers[1];
  d.x = plain.a.x + 1.2; d.z = plain.a.z; d.y = 0;
  plain.m.scrap(d, plain.b, 'rifle', false);
  plain.a.in.use = true;
  run(plain.m, RESPAWN + 0.2);
  check(d.alive && !has(plain.m, 'revive') && Math.hypot(d.x - plain.a.x, d.z - plain.a.z) > 3, 'only a medic can save one; with none near it comes back in');
  // Near a medic, damage mends sooner.
  const e1 = m.soldiers[2], e2 = m.soldiers[3];
  e1.x = a.x - 1.2; e1.z = a.z; e1.y = 0; e2.x = 6; e2.z = 60; e2.y = 0;
  for (const e of [e1, e2]) { e.hp = 50; e.hurtAt = m.time; }
  run(m, 2.6);
  check(e1.hp > 50 && e2.hp === 50, 'a robot near a medic mends sooner');
}

// ---- Advance: attack and defence, on the Iron Front ------------------------------------------

{
  const front = buildFront(), fw = front.world, secs = front.advance.sectors;
  const reach = fw.reachFrom(fw.nodeAt(12.5, 0.1, 40.5));
  check(secs.length === 4 && secs.every((sec, k) => k === 0 || sec.x0 === secs[k - 1].x1), 'the Iron Front is four sectors in a row');
  for (const sec of secs) {
    check(sec.att.length >= 32 && sec.def.length >= 32, `there is room for 32 a side to come in at ${sec.name}`);
    check(sec.att.every(([x]) => x < sec.x0) && sec.def.every(([x]) => x > sec.x1 - 8 && x < sec.x1), `the attackers come in before ${sec.name} and the defenders at the back of it`);
    check(sec.objs.length >= 2 && sec.objs.length <= 3, `${sec.name} has two or three objectives`);
    for (const o of sec.objs) {
      const n = fw.nodeAt(o.x, o.y + 0.1, o.z);
      check(n >= 0 && reach[n] === 1 && !fw.blocked(o.x, o.y, o.z, 0.32, TALL, STEP_UP) && o.x > sec.x0 && o.x < sec.x1, `objective ${o.name} of ${sec.name} (${o.what}) is inside it and can be walked to`);
    }
  }
  const full = new Match(front, { seed: 1, type: 'adv' });
  check(full.soldiers.length === 64 && full.tickets === Math.round(MODES[0].tickets * 32), `32 a side, and ${Math.round(MODES[0].tickets * 32)} lives to a battalion`);

  // A match with every robot under the test's control, standing out of the way at each end.
  const setUp = (opts) => {
    const m = new Match(front, { seed: 3, type: 'adv', size: 16, ...opts });
    for (const s of m.soldiers) s.bot = null;
    run(m, 0.7);
    m.events.length = 0;
    const att = m.soldiers.filter((s) => s.team === m.attack), def = m.soldiers.filter((s) => s.team !== m.attack);
    const park = (list, x) => list.forEach((s, i) => { s.x = x; s.z = 8 + i * 7.5; s.y = 0; });
    park(att, m.sectorNow().x0 - 6);
    park(def, m.sectorNow().x1 - 5);
    const put = (s, o, dx = 0) => { s.x = o.x + dx; s.z = o.z; s.y = o.y; };
    return { m, att, def, put, park };
  };
  const { m, att, def, put, park } = setUp({ attack: 0 });
  check(m.tickets === Math.round(MODES[0].tickets * 16) && m.battalion === 1 && m.sector === 0, 'the first battalion has its lives');
  const [A, B, C] = m.objectives();
  check(m.objectives().length === 3 && A.z < B.z && B.z < C.z, 'the Rail Yard has three objectives, spread from north to south');
  put(att[0], A);
  run(m, 5);
  check(A.p > 0.15 && A.p < 0.35 && !A.own && A.a === 1, 'one attacker at an objective takes it slowly');
  put(def[0], A, 1.5);
  const p0 = A.p;
  run(m, 2);
  check(Math.abs(A.p - p0) < 1e-6 && A.d === 1, 'a defender there too holds it where it is');
  put(def[1], A, -1.5);
  run(m, 1);
  check(A.p < p0, 'more defenders than attackers win it back');
  park([def[0], def[1]], m.sectorNow().x1 - 5);
  put(att[1], A, 1.5); put(att[2], A, -1.5);
  run(m, 12);
  check(A.own && has(m, 'taken') && att[0].score === 150, 'three attackers take it sooner, for 150 each');
  check(m.sector === 0, 'one objective is not the sector');
  put(att[3], B);
  put(att[4], C);
  run(m, 23);
  check(m.sector === 1 && has(m, 'sector') && m.tickets === Math.round(MODES[0].tickets * 16), 'holding them all takes the sector (with no lives back for it)');

  // The fight moves on. The defenders still in the lost sector are cut off.
  const before = m.tickets;
  m.scrap(def[2], att[0], 'rifle', false);
  check(m.tickets === before + ROUT && has(m, 'rout'), `a defender caught falling back is worth ${ROUT} lives to the attack`);
  m.scrap(att[5], def[5], 'rifle', false);
  check(m.tickets === before + ROUT - 1, 'an attacker scrapped is a life gone');
  run(m, RESPAWN + 0.1);
  check(att[5].alive && att[5].x > 150 && att[5].x < 160, 'the attackers now come in before the second sector');
  run(m, RETREAT + OUT_TIME - RESPAWN + 0.3);
  check(!def[0].alive && def[0].down === 0 && def[0].deaths === 1, 'a defender still in the lost sector when the time is up is scrapped, past saving');
  run(m, MODES[0].defWait + 0.5);
  check(def[0].alive && def[0].x > 290 && def[0].x < 300, 'and the defenders come in at the back of the second');
  att[7].x = 305; att[7].z = 60;
  run(m, OUT_TIME + 0.2);
  check(!att[7].alive, `an attacker out of the sector for ${OUT_TIME} seconds is scrapped`);

  // Coming in beside a squad mate (squads of four: robots 0 to 3 of a side, 4 to 7, and so on).
  const sq = setUp({ attack: 0 });
  const [s0, s1, s2] = sq.att, other = sq.att[5];
  s0.x = 100; s0.z = 64; s0.y = 0.9; s0.hurtAt = -99; // on the platform, well forward
  check(sq.m.canSpawnOn(s1, s0) && !sq.m.canSpawnOn(other, s0), 'a robot can come in beside a squad mate out of trouble, and only one of its own squad');
  sq.m.scrap(s1, sq.def[0], 'rifle', false);
  s1.in.spawnAt = s0.id;
  run(sq.m, RESPAWN + 0.2);
  check(s1.alive && Math.hypot(s1.x - s0.x, s1.z - s0.z) < 2, 'and does');
  s0.hurtAt = sq.m.time;
  check(!sq.m.canSpawnOn(s2, s0), `not beside one hurt in the last ${SQUAD_CALM} seconds`);
  s0.hurtAt = -99;
  sq.def[0].x = s0.x + 6; sq.def[0].z = s0.z; sq.def[0].y = 0;
  check(!sq.m.canSpawnOn(s2, s0), 'nor one with the other side close by');
  // A medic attacking gets the life back.
  const md = setUp({ attack: 0 });
  const medic = md.att.find((s) => md.m.classes[s.cls].medic), mate = md.att[0];
  mate.x = medic.x + 1; mate.z = medic.z;
  md.m.scrap(mate, md.def[0], 'rifle', false);
  const lives = md.m.tickets;
  medic.in.use = true;
  run(md.m, REVIVE_TIME + 0.1);
  check(mate.alive && md.m.tickets === lives + 1, 'an attacker got back on its feet gives the attack its life back');

  // A spent battalion: everyone regroups, and the sector starts over.
  const spent = setUp({ attack: 0 });
  spent.m.objectives()[0].p = 0.6;
  spent.m.drops.push({ id: 99, owner: -1, gun: 'rifle', mag: 1, reserve: 1, x: 50, y: 0, z: 50, yaw: 0, t: spent.m.time });
  spent.m.tickets = 1;
  spent.m.scrap(spent.att[0], spent.def[0], 'rifle', false);
  spent.m.step();
  check(spent.m.battalion === 2 && spent.m.tickets === Math.round(MODES[0].tickets * 16) && has(spent.m, 'battalion') && has(spent.m, 'regroup') && !spent.m.over, 'a battalion out of lives hands over to the next');
  check(spent.m.soldiers.every((s) => !s.alive && s.down === 0) && spent.m.objectives()[0].p === 0 && spent.m.drops.length === 0, 'everyone regroups, and the sector is the defenders\' again');
  run(spent.m, 4.5);
  check(spent.att.every((s) => s.alive && s.x < 26) && spent.def.every((s) => s.alive && s.x > 150), 'both sides come back in at their own ends of it');
  spent.m.battalion = BATTALIONS;
  spent.m.tickets = 1;
  spent.m.scrap(spent.att[1], spent.def[0], 'rifle', false);
  check(spent.m.over && spent.m.winner === 1 && spent.m.tickets === 0, 'the last battalion spent is a win for the defence');

  // The last sector, and the clock.
  const end = setUp({ attack: 1 });
  check(end.att.every((s) => s.team === 1), 'either side can attack');
  end.m.sector = 3;
  const objs = end.m.objectives();
  end.park(end.def, 591);
  end.att.forEach((s, i) => end.put(s, objs[i % objs.length], (i % 3) - 1));
  run(end.m, 12);
  check(end.m.over && end.m.winner === 1 && end.m.sector === 4, 'taking the last sector wins it for the attack');
  const slow = setUp({ attack: 0, timeLimit: 2 });
  run(slow.m, 1.5);
  check(slow.m.over && slow.m.winner === 1, 'time running out is a win for the defence');

  // Whole matches between bots, each team attacking in turn: smaller ones
  // here, to be quick; `node tools/test-haywire.mjs 12 full` plays them 32 a side.
  const big = process.argv[3] === 'full';
  for (let mode = 0; mode < MODES.length; mode++) {
    const n = big ? Math.max(4, Math.round(matches / 2)) : 1;
    let took = 0, minutes = 0, revives = 0;
    for (let seed = 1; seed <= n; seed++) {
      const g = new Match(front, { seed, mode, type: 'adv', attack: seed % 2, size: big ? 32 : 12 });
      while (!g.over) {
        g.step();
        for (const ev of g.events) if (ev.e === 'revive') revives++;
        g.events.length = 0;
      }
      if (g.winner === g.attack) took++;
      minutes += g.time / 60;
      check(g.winner >= 0 && (g.sector === 4 || g.tickets === 0 || g.time >= g.timeLimit), `an Advance match is played to an end (${MODES[mode].name}, ${seed})`);
      if (seed === 1) {
        const a1 = new Match(front, { seed, mode, type: 'adv', attack: 1, size: 12 }), a2 = new Match(front, { seed, mode, type: 'adv', attack: 1, size: 12 });
        for (let k = 0; k < 3600; k++) { a1.step(); a2.step(); a1.events.length = a2.events.length = 0; }
        check(a1.hash() === a2.hash(), 'and plays out the same way twice');
      }
    }
    console.log(`${MODES[mode].name}, Advance: the attack got through in ${took} of ${n} matches between bots (${big ? 32 : 12} a side); ${(minutes / n).toFixed(1)} minutes each on average; ${revives} revives`);
    check(revives > 0, 'medics get the scrapped back on their feet');
    if (big && n >= 6) check(took >= 1 && took <= n - 1, `neither attack nor defence has it all its own way (${took} of ${n})`);
  }
}

// ---- whole matches, played by the bots --------------------------------------------------

for (let mode = 0; mode < MODES.length; mode++) {
  const wins = [0, 0], kills = [0, 0];
  let minutes = 0, stuck = 0, lost = 0;
  const t0 = Date.now();
  for (let seed = 1; seed <= matches; seed++) {
    const m = new Match(map, { seed, mode, scoreLimit: 50, timeLimit: 600 });
    const seen = m.soldiers.map((s) => ({ x: s.x, z: s.z, t: 0 }));
    while (!m.over) {
      m.step();
      m.events.length = 0;
      if (m.tick % 60) continue;
      for (const s of m.soldiers) {
        // (Not counting a robot fighting from cover: that can go on a while.)
        if (!s.alive || (s.bot && s.bot.target && m.time - s.bot.lastSeen < 6)) { seen[s.id].t = 0; continue; }
        if (!(s.y > -2 && s.y < 9) || w.solidAt(s.x, s.y + 0.9, s.z)) lost++;
        // (Marksmen hold a window for up to half a minute; nobody else stays put that long, but to fight.)
        const p = seen[s.id];
        if (Math.hypot(s.x - p.x, s.z - p.z) > 1) { p.x = s.x; p.z = s.z; p.t = 0; } else if (++p.t === 45) stuck++;
      }
    }
    check(m.scores[0] === 50 || m.scores[1] === 50, `match ${seed} is played to the end (${m.scores.join('-')} after ${(m.time / 60).toFixed(1)} min)`);
    if (m.winner >= 0) wins[m.winner]++;
    kills[0] += m.scores[0];
    kills[1] += m.scores[1];
    minutes += m.time / 60;
    if (seed === 1) {
      const again = new Match(map, { seed, mode, scoreLimit: 50, timeLimit: 600 });
      while (!again.over) { again.step(); again.events.length = 0; }
      check(again.hash() === m.hash() && again.tick === m.tick, 'the same match always plays out the same way');
    }
  }
  console.log(`${MODES[mode].name}: ${matches} matches between bots: blue won ${wins[0]}, orange ${wins[1]}; ${kills[0]} against ${kills[1]} scrapped; ${(minutes / matches).toFixed(1)} minutes each on average (${((Date.now() - t0) / 1000).toFixed(1)} s to play them)`);
  check(stuck === 0, `no robot stands in one place for three quarters of a minute (${stuck} did)`);
  check(lost === 0, `no robot leaves the yard or ends up inside a wall (${lost} sightings)`);
  if (matches >= 12) {
    const share = kills[0] / (kills[0] + kills[1]);
    check(share > 0.44 && share < 0.56, `neither end of the yard is the better one (blue scrapped ${(share * 100).toFixed(0)}% of the total)`);
  }

  // Harder bots against easier ones.
  let hardWins = 0;
  const rounds = Math.max(4, Math.round(matches / 3));
  for (let seed = 1; seed <= rounds; seed++) {
    const hardTeam = seed % 2;
    const m = new Match(map, { seed: 100 + seed, mode, scoreLimit: 30, timeLimit: 600, skill: hardTeam ? [0, 2] : [2, 0] });
    while (!m.over) { m.step(); m.events.length = 0; }
    if (m.winner === hardTeam) hardWins++;
  }
  check(hardWins === rounds, `hard bots beat easy ones (${hardWins} of ${rounds})`);
}

console.log(failures ? `${failures} check(s) failed` : 'All checks passed');
process.exit(failures ? 1 : 0);
