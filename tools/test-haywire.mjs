// Checks Haywire: that the map is fair and can be walked all over, the rules
// one at a time (moving, shooting, reloading, grenades, scoring, and the old
// arms: swords, shields, bows and things thrown), and then, in each mode,
// whole matches played by the bots: that they finish, that nobody gets
// stuck or falls out of the yard, that neither end of the yard is the
// better one, that harder bots beat easier ones, and that the same match
// always plays out the same way.
// Usage: node tools/test-haywire.mjs [matches]

import { buildMap } from '../games/haywire/js/map.js';
import { Match, STEP, GUNS, CLASSES, MODES, RESPAWN, REGEN_DELAY, NADE_FUSE, JUMP, GRAVITY, WALK, TALL, TALL_CROUCH } from '../games/haywire/js/engine.js';
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
        if (!s.alive) { seen[s.id].t = 0; continue; }
        if (!(s.y > -2 && s.y < 9) || w.solidAt(s.x, s.y + 0.9, s.z)) lost++;
        // (Marksmen hold a window for up to half a minute; nobody else stays put that long.)
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
