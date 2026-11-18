// Haywire: the bots. Each bot has a Brain that, every step, fills in the
// same input the player's keys and mouse would: which way to walk and look,
// and which buttons are down. They play by the same rules as the player:
// they see only what is in front of them, take time to react, swing their
// aim round at a limited speed, and miss.
//
// What a bot is doing at any moment:
//   roam   walking to somewhere worth going: where the other team was last
//          seen, or one of the map's busy spots
//   fight  an enemy is in sight: aim, shoot in bursts, keep moving
//   hunt   it was in sight a moment ago: watch the spot, then go and look
//   cover  badly hurt: get out of sight and mend
//   camp   (marksmen) hold a window or a roof for a while

import { STEP_UP } from './world.js';
import { REVIVE_TIME, SQUAD, THRUST, KICK, blowOf, meets } from './engine.js';

const TAU = Math.PI * 2, RAD = Math.PI / 180;

// How good a bot is: seconds to react, how far off its aim wanders
// (degrees), how long its aim takes to settle on a new target, how fast it
// can turn (radians a second), how much it dodges, and how keen it is on
// grenades and on going for the head, and how often it thinks to get into cover.
export const SKILL = [
  { name: 'Easy', react: 0.85, err: 10.5, settle: 1.9, turn: 3.4, dance: 0.3, nade: 0.2, head: 0.04, hear: 0.6, cover: 0.3, block: 0.22, read: 0.5, feint: 0 },
  { name: 'Normal', react: 0.55, err: 7.6, settle: 1.4, turn: 5.2, dance: 0.65, nade: 0.45, head: 0.1, hear: 1, cover: 0.85, block: 0.45, read: 0.72, feint: 0.06 },
  { name: 'Hard', react: 0.32, err: 4.6, settle: 0.9, turn: 7.5, dance: 1, nade: 0.75, head: 0.22, hear: 1.3, cover: 1, block: 0.7, read: 0.9, feint: 0.16 },
];

// How close each gun likes to be: nearer than the first it backs off,
// further than the second it closes in.
const RANGE = { carbine: [10, 45], rifle: [7, 32], smg: [3, 15], shotgun: [0, 8], lmg: [9, 38], sniper: [16, 90], pistol: [3, 16] };

const LANE_Z = [[0, 21], [21, 43], [43, 64]];

const wrap = (a) => a - TAU * Math.round(a / TAU);

export class Brain {
  constructor(match, soldier, skill) {
    this.m = match;
    this.s = soldier;
    this.w = match.world;
    this.k = SKILL[skill] || SKILL[1];
    this.salt = soldier.id * 7919 + 13;
    this.reset();
  }

  reset() {
    this.mode = 'roam';
    this.target = null;
    this.visible = false;
    this.tSeen = 0; // when the target first came into view
    this.lastSeen = -99;
    this.lx = this.ly = this.lz = 0; // where it was last seen
    this.path = null;
    this.pi = 0;
    this.ahead = 0;
    this.goal = -1;
    this.repathAt = 0;
    this.waitUntil = 0;
    this.errY = this.errP = this.errTY = this.errTP = 0;
    this.errAt = 0;
    this.strafe = this.m.rng.next() < 0.5 ? -1 : 1;
    this.strafeAt = 0;
    this.holdYaw = this.s.in.yaw;
    this.holdLow = false;
    this.burstT = 0;
    this.restT = 0;
    this.clickAt = 0;
    this.glance = 0;
    this.glanceUntil = 0;
    this.glanceAt = this.m.time + 2;
    this.checkAt = this.m.time + 1;
    this.checkX = this.s.x;
    this.checkZ = this.s.z;
    this.stuck = 0;
    this.nadeAt = this.m.time + 4 + this.m.rng.next() * 6;
    this.lob = null;
    this.perch = null;
    this.campUntil = 0;
    this.coverUntil = 0;
    this.goHead = false;
    this.sector = -1;
    this.obj = null; // Advance: the objective it is working on
    this.objCheck = 0;
    this.pushAt = 0;
    this.pushing = false;
    // Fighting from cover: what it is doing ('hold' where it is, or 'move'
    // to cover, round the side or forward), whether where it holds is cover,
    // whether it is up and shooting or down behind it, and when it next thinks again.
    this.plan = 'hold';
    this.atCover = false;
    this.peeking = true;
    this.peekSwap = 0;
    this.cvCheck = 0;
    this.cv = -1;
    this.swingAt = 0;
    this.peekNode = -1; // at a corner: where to lean out from
    this.peekAt = -1;
    this.holdSince = this.m.time;
    this.flanked = -1;
    // Its part in its squad: the odd ones go round the side and forward, the others keep the enemy's heads down.
    this.mover = (this.s.id % SQUAD) % 2 === 1;
    this.fleeX = this.fleeZ = 0;
    this.fleeUntil = 0;
    // Which way round it goes this life: 0 the north side, 1 the middle,
    // 2 the south. The close-up guns keep to the buildings.
    const gun = this.m.classes[this.s.nextCls >= 0 ? this.s.nextCls : this.s.cls].gun, roll = this.m.rng.next();
    this.wantDraw = 1; // how far to draw the bow before letting go
    this.throwAt = this.m.time + 1 + this.m.rng.next() * 3;
    this.readAt = -1; // the blow it last saw coming, and what it does about it
    this.answer = 'none';
    this.answerAt = 0;
    this.answerDir = 0;
    this.nextDir = null;
    this.feint = false;
    this.chain = false;
    this.kickAt = 0;
    const mid = gun === 'shotgun' ? 0.1 : gun === 'smg' ? 0.22 : gun === 'lmg' ? 0.45 : 0.34;
    this.lane = roll < mid ? 1 : roll < mid + (1 - mid) / 2 ? 0 : 2;
  }

  // ---- every step ---------------------------------------------------------------------

  think(dt) {
    const s = this.s, m = this.m, inp = s.in;
    inp.mx = inp.mz = 0;
    inp.jump = false;
    inp.fire = inp.reload = inp.nade = inp.sprint = inp.crouch = inp.ads = inp.melee = inp.toss = inp.use = inp.prone = inp.slide = false;
    // Out of rounds for its main gun: pick up whatever is lying at its feet.
    if (this.dry() && (m.tick + s.id) % 10 === 0 && m.dropNear(s)) inp.use = !s.useHeld;
    inp.slot = -1;
    this.wx = this.wz = 0; // which way to walk, in the world
    // Advance: the fight has moved on to the next sector, so think again
    // about where to go; and now and then, whether its objective still
    // needs it (taken, for an attacker; quiet while another is being
    // taken, for a defender).
    if (m.type === 'adv') {
      if (this.sector !== m.sector) {
        this.sector = m.sector;
        this.obj = null;
        this.waitUntil = 0;
        this.repathAt = 0;
        if (this.mode === 'roam') this.path = null;
      } else if (m.time > this.objCheck && this.mode === 'roam') {
        this.objCheck = m.time + 1 + m.rng.next();
        if (this.obj && this.needsMove()) { this.waitUntil = 0; this.obj = null; this.path = null; this.repathAt = 0; }
      }
    }
    if ((m.tick + s.id * 3) % 7 === 0) this.perceive();
    if ((m.tick + s.id * 5) % 12 === 0) this.watchForNades();
    if (this.target && !this.target.alive) { this.target = null; this.visible = false; }

    const wp = s.weapons[s.slot];
    // Advance: strayed out of the sector being fought for. Drop everything and get back in.
    // (A defender falling back when a sector is lost does the same, without waiting to be told.)
    let astray = false;
    const fence = m.bounds(s);
    if (fence) astray = s.x < fence[0] || s.x > fence[1];
    this.astray = astray;
    if (astray) {
      this.target = null;
      this.visible = false;
      this.lob = null;
      if (this.mode !== 'roam' || !this.path) { this.mode = 'roam'; this.waitUntil = 0; this.newGoal(); }
    }
    // A marksman moves on once it has held a spot long enough, whatever it can see.
    if (this.mode === 'camp' && m.time > this.campUntil) { this.mode = 'roam'; this.perch = null; this.path = null; this.repathAt = 0; }
    if (m.time < this.fleeUntil) this.flee(dt);
    else if (this.lob) this.throwing(dt);
    else if (this.mode === 'cover') this.cover(dt);
    else if (this.target && this.visible) this.fight(dt);
    else if ((this.body = this.medic() ? this.findBody() : null)) this.reviveBody(this.body, dt);
    else if (this.target && this.plan === 'hold' && this.atCover && m.time - this.lastSeen < 8) this.holdCover(dt);
    else if (this.target && m.time - this.lastSeen < 6 && !this.leashed(this.lx, this.lz)) this.hunt(dt);
    else {
      this.target = null;
      if (this.mode !== 'camp') this.mode = 'roam';
      this.roam(dt);
    }

    // Reload when there's a lull, and get the main gun back out.
    if (!this.visible) {
      const main = s.weapons[0];
      if (wp.mag < wp.gun.mag * 0.6) inp.reload = true;
      if (s.slot === 1 && (main.mag > 0 || main.reserve > 0 || (main.gun.kind === 'melee' && main.gun.id !== 'spear'))) inp.slot = 0;
    }
    this.unstick();

    // Turn the walking direction into forward and sideways, as the keys would give.
    const sy = Math.sin(inp.yaw), cy = Math.cos(inp.yaw);
    inp.mx = this.wx * cy + this.wz * sy;
    inp.mz = this.wx * sy - this.wz * cy;
    if (inp.sprint && inp.mz < 0.5) inp.sprint = false;
  }

  // ---- seeing and hearing --------------------------------------------------------------

  perceive() {
    const s = this.s, m = this.m, k = this.k;
    const view = m.aim(s, [0, 0, 0]), ey = m.eyeY(s);
    let best = null, bestScore = Infinity;
    for (const e of m.soldiers) {
      if (!e.alive || e.team === s.team) continue;
      const x = e.x - s.x, y = e.y + 1 - ey, z = e.z - s.z, d = Math.hypot(x, y, z) || 1;
      if (d > 95) continue;
      const cos = (x * view[0] + y * view[1] + z * view[2]) / d;
      const hurtMe = s.hurtBy === e.id && m.time - s.hurtAt < 2;
      const heard = m.time - e.lastShot < 0.6 && d < 28 * k.hear;
      if (!(cos > 0.42 || d < 4.5 || hurtMe || heard)) continue;
      if (!m.canSee(s, e)) {
        // Hit or shot at from somewhere it can't see: remember roughly where.
        if ((hurtMe || heard) && !this.visible && !(this.target && m.time - this.lastSeen < 1)) this.remember(e);
        continue;
      }
      // Something new a long way off, or out of the corner of its eye, can go unnoticed for a while.
      if (e !== this.target && !hurtMe) {
        // (One lying down is harder to pick out still.)
        const p = (cos > 0.85 ? 1 : 0.4) * Math.max(0.05, Math.min(1, 1.45 - d / 38)) * (m.time - e.lastShot < 0.6 ? 4 : 1) * (e.prone ? 0.4 : 1);
        if (m.rng.next() > p) continue;
      }
      m.know(e);
      const score = d * (1.5 - 0.5 * cos) - (e === this.target ? 7 : 0) - (hurtMe ? 9 : 0);
      if (score < bestScore) { bestScore = score; best = e; }
    }
    if (best) {
      if (best !== this.target || m.time - this.lastSeen > 1.5) {
        this.tSeen = m.time;
        this.goHead = m.rng.next() < k.head;
      }
      this.remember(best);
      this.visible = true;
    } else this.visible = false;
  }

  remember(e) {
    if (this.target !== e) { this.target = e; this.path = null; }
    this.lastSeen = this.m.time;
    this.lx = e.x; this.ly = e.y; this.lz = e.z;
  }

  watchForNades() {
    const s = this.s, m = this.m;
    for (const n of m.nades) {
      if (n.team === s.team && n.by !== s.id) continue;
      const dx = s.x - n.x, dz = s.z - n.z, d = Math.hypot(dx, dz);
      if (d > 7 || n.fuse > 2.2 || Math.abs(n.y - s.y) > 3) continue;
      this.fleeX = d > 0.1 ? dx / d : 1;
      this.fleeZ = d > 0.1 ? dz / d : 0;
      this.fleeUntil = m.time + Math.min(n.fuse + 0.15, 1.4);
      return;
    }
  }

  // ---- aiming --------------------------------------------------------------------------

  // Swings the view towards a point, with the wander a hand would have.
  // Returns how far off the true line it still is (radians).
  aimAt(x, y, z, dt, steady = 1, moving = 0) {
    const s = this.s, m = this.m, k = this.k, inp = s.in;
    const dx = x - s.x, dy = y - m.eyeY(s), dz = z - s.z, flat = Math.hypot(dx, dz) || 1e-6;
    const yaw = Math.atan2(dx, -dz), pitch = Math.atan2(dy, flat);
    if (m.time >= this.errAt) {
      // A fresh target is aimed at roughly, and the aim tightens as it is held.
      const fresh = 1 + 1.6 * Math.exp(-(m.time - this.tSeen) / k.settle);
      // (Harder still when it is on the move itself, or the target is.)
      const e = k.err * RAD * fresh * steady * (0.75 + 0.5 * Math.min(1, Math.hypot(s.vx, s.vz) / 4)) * (1 + 0.5 * Math.min(1, moving / 5));
      const r = m.rng;
      this.errTY = (r.next() + r.next() + r.next() - 1.5) * e * 1.1;
      this.errTP = (r.next() + r.next() + r.next() - 1.5) * e * 0.6;
      this.errAt = m.time + 0.18 + r.next() * 0.22;
    }
    this.errY += (this.errTY - this.errY) * Math.min(1, dt * 7);
    this.errP += (this.errTP - this.errP) * Math.min(1, dt * 7);
    this.turn(yaw + this.errY, pitch + this.errP, dt);
    // (How far it is from where it means to aim: it can't tell that's wrong.)
    return Math.hypot(wrap(yaw + this.errY - inp.yaw) * Math.cos(pitch), pitch + this.errP - inp.pitch);
  }

  turn(yaw, pitch, dt, rate = 1) {
    const inp = this.s.in, max = this.k.turn * rate * dt;
    const dy = wrap(yaw - inp.yaw), dp = pitch - inp.pitch;
    inp.yaw = wrap(inp.yaw + Math.max(-max, Math.min(max, dy * Math.min(1, dt * 14))));
    inp.pitch += Math.max(-max, Math.min(max, dp * Math.min(1, dt * 14)));
  }

  // ---- fighting ------------------------------------------------------------------------

  fight(dt) {
    const s = this.s, m = this.m, k = this.k, inp = s.in, t = this.target, r = m.rng;
    const wp = s.weapons[s.slot], gun = wp.gun;
    this.mode = this.mode === 'camp' ? 'camp' : 'fight';
    const dx = t.x - s.x, dz = t.z - s.z, dist = Math.hypot(dx, dz) || 1e-6;
    if (gun.kind) { this.fightOld(dt, dist, dx / dist, dz / dist); return; }
    const [near, far] = RANGE[gun.id];

    // Badly hurt and being shot at: sometimes it breaks off to mend.
    if (s.hp < s.maxHp * 0.4 && m.time - s.hurtAt < 0.5 && this.mode !== 'camp' && m.time > this.coverUntil + 5 && r.next() < 0.06 * (0.5 + k.dance)) {
      if (this.takeCover()) return;
    }

    inp.ads = gun.id === 'sniper' || dist > (gun.id === 'shotgun' || gun.id === 'smg' ? 14 : 8);
    // Right on top of it: a blow with the gun (unless it's a shotgun, which is better fired).
    if (dist < 1.7 && Math.abs(t.y - s.y) < 1 && gun.id !== 'shotgun' && m.time - this.tSeen > k.react) inp.melee = !s.meleeHeld;
    const steady = (s.ads > 0.8 ? 0.6 : 1) * (s.crouching ? 0.85 : 1) * (gun.id === 'sniper' ? 0.9 : 1);
    const tp = m.target(t, this.goHead, this.tp || (this.tp = [0, 0, 0]));
    const off = this.aimAt(tp[0], tp[1], tp[2], dt, steady, Math.hypot(t.vx, t.vz));

    // Moving. It doesn't walk about shooting (moving spoils the aim): it
    // fights from cover, crouched behind it and standing up to shoot, or
    // stands its ground where there is none; and it moves between pieces of
    // cover at a run. See tactics() for when it moves, and where to.
    let shoot = true;
    if (this.mode === 'camp') {
      inp.crouch = false;
    } else {
      if (m.time > this.cvCheck) this.tactics(t, dist);
      if (this.mode === 'cover') return;
      if (this.plan === 'move') {
        if (this.path && this.follow()) {
          // (Close up, it fires as it goes; further off it runs for it.)
          if (dist > 12) { shoot = false; inp.sprint = true; inp.ads = false; this.lookAlong(dt); }
        } else this.arrive();
      }
      if (this.plan === 'hold') shoot = this.coverCycle(dt, dist, gun, wp);
    }

    // Shooting, once it has had time to react and the aim is on.
    const ready = m.time - this.tSeen > k.react && s.protect <= 0.2;
    const size = Math.max(0.012, Math.atan(0.3 / dist)) + (gun.pellets > 1 ? 0.05 : 0);
    const scoped = gun.id !== 'sniper' || s.ads > 0.95;
    if (wp.mag === 0 && s.slot === 0 && dist < 14 && k.dance > 0.5 && s.weapons[1].mag > 0) inp.slot = 1;
    if (shoot && ready && off < size && scoped && wp.mag > 0) {
      if (gun.auto) {
        if (this.restT > 0) this.restT -= dt;
        else {
          inp.fire = true;
          this.burstT -= dt;
          if (this.burstT <= 0) {
            this.burstT = (0.22 + r.next() * 0.45) * (dist < 10 ? 3 : dist < 22 ? 1.4 : 1);
            this.restT = dist < 10 ? 0 : 0.1 + r.next() * 0.3;
          }
        }
      } else if (m.time >= this.clickAt) {
        inp.fire = !s.fireHeld;
        if (inp.fire) this.clickAt = m.time + gun.rate + 0.04 + r.next() * 0.14;
      }
    }
  }

  // Fighting with the old arms: close in and swing, hold a shield up, throw, or draw a bow.
  fightOld(dt, dist, fx, fz) {
    const s = this.s, m = this.m, k = this.k, inp = s.in, t = this.target, r = m.rng, w = this.w;
    const wp = s.weapons[s.slot], gun = wp.gun, theirs = t.weapons[t.slot].gun;
    const ready = m.time - this.tSeen > k.react * 0.7 && s.protect <= 0.2;
    const body = m.target(t, false, this.tp || (this.tp = [0, 0, 0]))[1], speed = Math.hypot(t.vx, t.vz);
    const camp = this.mode === 'camp';
    if (s.hp < s.maxHp * 0.35 && m.time - s.hurtAt < 0.5 && !camp && dist > 4 && m.time > this.coverUntil + 5 && r.next() < 0.04 * (0.5 + k.dance)) {
      if (this.takeCover()) return;
    }
    // Where something sent through the air must be aimed: ahead of a moving
    // target, and above it for the drop.
    const lob = (v, grav) => {
      const tf = dist / v;
      return this.aimAt(t.x + t.vx * tf * 0.85, body + 0.5 * grav * tf * tf, t.z + t.vz * tf * 0.85, dt, s.ads > 0.8 ? 0.6 : 0.85, speed);
    };
    const stepTo = (x, z) => {
      const l = Math.hypot(x, z);
      if (l < 0.01) return;
      const px = s.x + (x / l) * 0.9, pz = s.z + (z / l) * 0.9;
      if (w.blocked(px, s.y, pz, s.r, s.h, STEP_UP) || w.floorUnder(px, s.y, pz, 0.1, STEP_UP) < s.y - STEP_UP) { this.strafe = -this.strafe; return; }
      this.wx = x / l; this.wz = z / l;
    };
    if (m.time >= this.strafeAt) {
      this.strafe = -this.strafe;
      this.strafeAt = m.time + 0.35 + r.next() * 0.9;
      this.still = r.next() > k.dance;
    }

    if (gun.kind === 'bow') {
      // Someone right on top of it: out with the dagger.
      if (dist < 3.2 && s.slot === 0 && s.draw === 0) { inp.slot = 1; return; }
      const off = lob(gun.slow + (gun.speed - gun.slow) * ((this.wantDraw - 0.25) / 0.75), gun.grav);
      inp.ads = dist > 16;
      if (wp.mag > 0 && ready && (s.cool <= 0 || s.draw > 0)) {
        inp.fire = !(s.draw >= this.wantDraw && off < Math.max(0.02, Math.atan(0.4 / dist)));
        if (!inp.fire) this.wantDraw = dist < 10 ? 0.55 + r.next() * 0.3 : 0.8 + r.next() * 0.2;
      }
      if (camp) return;
      if (dist < 9) { stepTo(-fx - fz * this.strafe * 0.5, -fz + fx * this.strafe * 0.5); return; }
      if (dist > 45) { this.goTo(w.nodeAt(t.x, t.y + 0.1, t.z), 0.8); this.follow(); return; }
      // Otherwise, as with a gun: from cover, crouched until it draws.
      if (m.time > this.cvCheck && s.draw === 0) this.tactics(t, dist);
      if (this.mode === 'cover') return;
      if (this.plan === 'move') {
        if (this.path && this.follow()) { inp.fire = false; inp.sprint = true; this.lookAlong(dt); return; }
        this.arrive();
      }
      inp.crouch = this.atCover && s.draw === 0 && s.cool > 0;
      return;
    }

    // A blade. Throw something on the way in, if there's something to throw.
    const keep = gun.id === 'spear' ? 1 : 0;
    let off;
    if (gun.throw && wp.mag > keep && dist > 5.5 && dist < 22 && m.time > this.throwAt && s.atk === 0) {
      off = lob(gun.shot.speed, gun.shot.grav);
      if (ready && s.cool <= 0 && off < Math.max(0.02, Math.atan(0.35 / dist))) {
        inp.toss = !s.tossHeld;
        if (inp.toss) this.throwAt = m.time + 1.2 + r.next() * 2.5;
      }
    } else off = this.aimAt(t.x, body, t.z, dt, 1, speed);
    const shield = gun.alt === 'block';
    // A shield goes up against a drawn bow.
    if (shield && s.atk === 0 && theirs.kind === 'bow' && t.draw > 0.3 && dist > 3.5 && dist < 30) inp.ads = true;

    // Reading the enemy's blow. Each one is seen coming a moment after it
    // starts to wind up (quicker for an abler bot), and then it is met with
    // a guard (on the right side, mostly), or stepped back from, or not.
    const coming = theirs.kind === 'melee' && (t.atk === 1 || t.atk === 2) && dist < blowOf(theirs, t.atkDir).reach + 1.2 && m.facing(t, s.x - t.x, s.z - t.z) > 0.5;
    if (coming && this.readAt !== t.atkAt) {
      this.readAt = t.atkAt;
      const roll = r.next();
      this.answer = roll < k.block * (shield ? 1.15 : 1) ? 'guard' : roll < k.block + 0.25 * k.dance ? 'back' : 'none';
      this.answerAt = m.time + k.react * (0.45 + 0.4 * r.next());
      this.answerDir = r.next() < k.read ? meets(t.atkDir) : (meets(t.atkDir) + 1 + Math.floor(r.next() * 3)) % 4;
    }
    const threat = coming && m.time >= this.answerAt && s.atk !== 2;
    if (threat && this.answer === 'guard' && s.atk === 1) {
      // Caught winding up: call it off and guard instead (if it can).
      if (!s.altHeld && r.next() < k.dance) inp.ads = true;
    } else if (threat && this.answer === 'guard') {
      inp.ads = true;
      inp.dir = this.answerDir;
    }
    // How many of its own are already at this one: no more than two at once on the player, three on anyone else.
    let crowd = 0;
    for (const f of m.soldiers) if (f !== s && f.alive && f.team === s.team && f.weapons[f.slot].gun.kind === 'melee' && Math.abs(f.x - t.x) < 3 && Math.hypot(f.x - t.x, f.z - t.z) < 2.8) crowd++;
    const wait = crowd >= (t.human ? 2 : 3) && dist > 2.8;
    const reachNow = blowOf(gun, s.atk ? s.atkDir : this.nextDir ?? THRUST).reach;

    if (!camp && dist > 6 && this.push()) {
      // Advance: on into the objective; the fight will come to it.
    } else if (!camp) {
      const want = wait ? 4.2 : (threat && this.answer === 'back') ? reachNow + 1.4 : s.atk === 1 ? reachNow * 0.7 : reachNow * 0.85;
      if (dist > want + 0.3 && !this.leashed(t.x, t.z)) {
        // Straight at it when it's close and in plain view; otherwise by the path.
        if (dist < 7 && Math.abs(t.y - s.y) < 0.6 && w.sees(s.x, s.y + 1, s.z, t.x, t.y + 1, t.z)) stepTo(fx - fz * this.strafe * (dist > 3 ? 0.3 : 0), fz + fx * this.strafe * (dist > 3 ? 0.3 : 0));
        if (this.wx === 0 && this.wz === 0) { this.goTo(w.nodeAt(t.x, t.y + 0.1, t.z), 0.5); this.follow(); }
        inp.sprint = dist > 6 && !inp.ads && off < 0.5 && s.atk === 0;
      } else if (dist < want - 0.6) stepTo(-fx - fz * this.strafe * 0.4, -fz + fx * this.strafe * 0.4);
      else if (!this.still) stepTo(-fz * this.strafe, fx * this.strafe);
    }

    // Its own blows.
    if (s.atk === 1) {
      // Winding up: let go once it's in reach. An able bot, seeing the right
      // guard go up against it, calls the blow off to come from another side.
      const read = t.guard && (t.block || t.guardDir === meets(s.atkDir)) && m.time - t.guardAt > k.react * 0.5;
      if ((this.feint && s.atkT > s.atkWind * 0.6) || (read && !t.block && r.next() < k.feint * 0.1)) { inp.ads = !s.altHeld; this.feint = false; this.swingAt = m.time + 0.15; }
      else inp.fire = !(s.atkT >= s.atkWind && dist < reachNow + 0.15) && s.atkT < s.atkWind + 1.2;
      return;
    }
    if (s.atk === 3) {
      // A blow that landed: another straight after it, sometimes.
      if (s.atkLanded && this.chain) { inp.fire = true; inp.dir = this.pickDir(t, gun); }
      return;
    }
    if (s.atk === 2 || inp.ads) return;
    // A kick for a shield held up, or a guard that won't come down.
    if (dist < KICK.reach + 0.2 && t.guard && m.time - t.guardAt > 0.5 && s.cool <= 0 && ready && m.time > this.kickAt) {
      this.kickAt = m.time + 1.5 + r.next() * 2;
      if (r.next() < (t.block ? 0.6 : 0.3) * k.dance) { inp.melee = !s.meleeHeld; return; }
    }
    // Open: their blow missed, or they are reeling. Quick, before they recover.
    const open = t.stun > 0 || t.atk === 3;
    const dir = this.nextDir = this.pickDir(t, gun);
    const inReach = dist < blowOf(gun, dir).reach + (open ? 0.6 : 1.1);
    if (!wait && ready && inReach && Math.abs(t.y - s.y) < 1.6 && off < 0.5 && s.cool <= 0 && (m.time > this.swingAt || (open && r.next() < k.dance * 0.3))) {
      inp.fire = true;
      inp.dir = dir;
      this.nextDir = null;
      this.feint = r.next() < k.feint;
      this.chain = r.next() < 0.25 + 0.5 * k.dance;
      // (A less able bot waits longer between blows.)
      this.swingAt = m.time + 0.25 + k.react * (0.6 + 0.8 * r.next());
    }
  }

  // Which side to swing from: wherever their guard isn't (if it can tell),
  // and what suits the weapon (a pike thrusts; an axe likes to come down).
  pickDir(t, gun) {
    const r = this.m.rng, k = this.k;
    const pref = gun.id === 'spear' ? [0.1, 0.1, 0.15, 0.65] : gun.id === 'axe' ? [0.3, 0.3, 0.35, 0.05] : gun.id === 'mace' ? [0.3, 0.3, 0.3, 0.1] : [0.28, 0.28, 0.2, 0.24];
    const w = pref.slice();
    if (t.guard && !t.block && r.next() < k.read) w[meets(t.guardDir)] = 0;
    let sum = w[0] + w[1] + w[2] + w[3], x = r.next() * sum;
    for (let d = 0; d < 4; d++) { x -= w[d]; if (x <= 0) return d; }
    return THRUST;
  }

  // ---- fighting from cover ---------------------------------------------------------------

  // Every second or two in a fight: is it hurt or outnumbered (pull back out
  // of sight)? Is the enemy behind cover (a grenade)? Is it time to go
  // forward to the next cover (attacking in Advance) or round the side (a
  // squad's movers)? Is where it is any cover, or is there some near?
  tactics(t, dist) {
    const s = this.s, m = this.m, w = this.w, r = m.rng, k = this.k;
    this.cvCheck = m.time + 1.1 + r.next() * 0.9;
    const tx = t.x, ty = m.eyeY(t), tz = t.z;
    // Hurt, or outnumbered: back out of sight, away from them, to mend.
    let foes = 0, friends = 0;
    for (const e of m.soldiers) {
      if (!e.alive || e === s) continue;
      const d = Math.hypot(e.x - s.x, e.z - s.z);
      if (e.team === s.team) { if (d < 18) friends++; } else if (d < 25 && m.time - e.knownT < 3) foes++;
    }
    if (((s.hp < s.maxHp * 0.45 && m.time - s.hurtAt < 1.5) || foes >= friends + 3) && m.time > this.coverUntil + 4 && r.next() < 0.75) {
      const n = this.findCover(tx, ty, tz, 'hide', 12, null, true);
      if (n >= 0 && this.moveTo(n)) {
        this.mode = 'cover';
        this.coverUntil = m.time + 7;
        return;
      }
    }
    // Behind cover, with only its head showing: flush it out.
    const g = s.weapons[0].gun;
    if (dist > 8 && dist < 26 && s.nadeCount > 0 && m.time > this.nadeAt && !w.sees(s.x, m.eyeY(s), s.z, tx, m.mid(t), tz)) {
      this.nadeAt = m.time + 7 + r.next() * 6;
      if (r.next() < k.nade * 1.3 && this.startLob(tx, t.y, tz)) return;
    }
    // (Where it is: still cover against this enemy?)
    const covered = !w.sees(tx, ty, tz, s.x, s.y + 0.8, s.z) && (this.peekNode >= 0 ? this.atCover : w.sees(tx, ty, tz, s.x, s.y + 1.62, s.z));
    if (this.plan === 'move') return;
    const o = this.obj, held = m.time - this.holdSince;
    // Advance: on towards the objective, a piece of cover at a time.
    const forward = m.type === 'adv' && o && !this.astray && (s.team === m.attack ? !o.own : o.a > 0 || o.p > 0.02) && Math.hypot(o.x - s.x, o.z - s.z) > 4;
    if (forward && held > (this.mover ? 2.5 : 5) + r.next() * 2) {
      const n = this.findCover(tx, ty, tz, 'fight', 14, o, false, 3);
      if (n >= 0 && this.moveTo(n)) return;
      // (No cover forward: a dash straight on.)
      const at = w.nodeAt(o.x, o.y + 0.6, o.z), from = w.nodeAt(s.x, s.y + 0.1, s.z);
      const p = at >= 0 && from >= 0 ? w.pathDown(from, w.flowTo(at), 2) : null;
      if (p && p.length > 2) {
        this.path = p.slice(0, 10); this.pi = 0; this.ahead = 0; this.goal = this.path[this.path.length - 1];
        this.plan = 'move';
        this.cv = -1;
        this.peekNode = -1;
        return;
      }
    }
    // Held one spot a good while, with no objective to push on to: up on the
    // enemy, a piece of cover at a time.
    if (!forward && held > 18 + r.next() * 10) {
      const n = this.findCover(tx, ty, tz, 'fight', 14, t, false, 3);
      if (n >= 0 && this.moveTo(n)) return;
      this.holdSince = m.time - 10;
    }
    // A squad's movers go round the side, once a fight.
    if (this.mover && this.flanked !== t.id && dist > 15 && dist < 50 && g.id !== 'sniper' && !forward) {
      this.flanked = t.id;
      const ux = (s.x - tx) / dist, uz = (s.z - tz) / dist, side = s.id % 4 < 2 ? 1 : -1, back = Math.min(dist * 0.6, 18);
      const n = w.nodeAt(tx + ux * back - uz * side * 14, s.y + 0.6, tz + uz * back + ux * side * 14);
      const fence = m.bounds(s);
      if (n >= 0 && Math.abs(w.nodeY[n] - s.y) < 2 && !(fence && (w.nodeX(n) < fence[0] + 2 || w.nodeX(n) > fence[1] - 2)) && !this.leashed(w.nodeX(n), w.nodeZ(n))) {
        this.goTo(n, 6, true);
        if (this.path && this.path.length < 70) { this.plan = 'move'; this.cv = -1; this.peekNode = -1; return; }
      }
    }
    if (covered) { this.atCover = true; return; }
    this.peekNode = -1;
    // Out in the open: to cover near by, if there is any (and it thinks of it).
    const n = r.next() < k.cover ? this.findCover(tx, ty, tz, 'fight', 9, forward ? o : null) : -1;
    if (n >= 0 && this.moveTo(n)) return;
    this.atCover = false;
  }

  // Sets off for node n (cover); false if it can't get there.
  moveTo(n) {
    this.goTo(n, 3, true);
    if (!this.path || this.path.length > 30) { this.path = null; return false; }
    this.plan = 'move';
    this.cv = n;
    this.peekNode = this.peekAt;
    return true;
  }

  // Got where it was going.
  arrive() {
    this.plan = 'hold';
    this.atCover = this.cv >= 0;
    this.holdSince = this.m.time;
    this.peeking = false;
    this.peekSwap = this.m.time + 0.3;
    this.path = null;
  }

  // A spot near it to fight from against a threat whose eyes are at (tx, ty, tz).
  // 'fight': either low cover (crouched behind it, it is hidden; standing,
  // it can shoot over) or a corner (hidden where it stands, with a spot a
  // step to the side that can see the threat, to lean out to). 'hide':
  // where it can't be seen at all. Nearer is better; and, if `toward` is
  // given, nearer that (going forward), by at least `gain` metres; or, if
  // `away`, further from the threat. Only spots against something, and not
  // one a team-mate has. Returns a node or -1 (and sets this.peekAt).
  findCover(tx, ty, tz, kind, reach, toward = null, away = false, gain = 0) {
    const s = this.s, m = this.m, w = this.w, r = m.rng, fence = m.bounds(s);
    const d0 = Math.hypot(tx - s.x, tz - s.z), o0 = toward ? Math.hypot(toward.x - s.x, toward.z - s.z) : 0;
    let best = -1, bestScore = -Infinity, bestPeek = -1;
    for (let k = 0; k < 28; k++) {
      const a = r.next() * Math.PI * 2, d = 1 + r.next() * reach;
      const n = w.nodeAt(s.x + Math.cos(a) * d, s.y + 0.6, s.z + Math.sin(a) * d);
      if (n < 0 || !w.nodeNear[n] || Math.abs(w.nodeY[n] - s.y) > 1.6) continue;
      const nx = w.nodeX(n), ny = w.nodeY[n], nz = w.nodeZ(n), dt = Math.hypot(tx - nx, tz - nz);
      if (dt < 5 || (fence && (nx < fence[0] + 2 || nx > fence[1] - 2)) || this.leashed(nx, nz)) continue;
      const gained = toward ? o0 - Math.hypot(toward.x - nx, toward.z - nz) : 0;
      if (gained < gain) continue;
      if (w.sees(tx, ty, tz, nx, ny + 0.8, nz)) continue;
      const standing = w.sees(tx, ty, tz, nx, ny + 1.62, nz);
      let peek = -1;
      if (kind === 'hide') { if (standing) continue; }
      else if (!standing) {
        // A corner: is there a spot a step to the side to lean out from?
        const ux = (tx - nx) / dt, uz = (tz - nz) / dt;
        for (const side of [1, -1]) {
          const p = w.nodeAt(nx - uz * side * 1.2, ny + 0.6, nz + ux * side * 1.2);
          if (p >= 0 && p !== n && Math.abs(w.nodeY[p] - ny) < 0.3 && w.sees(tx, ty, tz, w.nodeX(p), w.nodeY[p] + 1.62, w.nodeZ(p))) { peek = p; break; }
        }
        if (peek < 0) continue;
      }
      if (m.soldiers.some((e) => e !== s && e.alive && e.team === s.team && ((e.bot && e.bot.cv === n) || Math.abs(e.x - nx) + Math.abs(e.z - nz) < 1.2))) continue;
      const score = -Math.hypot(nx - s.x, nz - s.z) * 0.35 + gained * 0.6 + (away ? (dt - d0) * 0.5 : 0) + r.next() * 0.5;
      if (score > bestScore) { bestScore = score; best = n; bestPeek = peek; }
    }
    this.peekAt = bestPeek;
    return best;
  }

  // In cover: down behind it a moment, up (or out from the corner) to shoot
  // a few seconds; down to reload, and for longer when pinned. In the open:
  // still, and low when the enemy is far. Returns whether it may fire.
  coverCycle(dt, dist, gun, wp) {
    const s = this.s, m = this.m, r = m.rng, inp = s.in, w = this.w;
    if (!this.atCover) {
      inp.crouch = dist > 14 && gun.id !== 'shotgun';
      return true;
    }
    const pinned = s.supp > 0.5;
    if (m.time > this.peekSwap) {
      this.peeking = !this.peeking;
      this.peekSwap = m.time + (this.peeking ? 1.3 + r.next() * 2 : (0.5 + r.next() * 0.9) * (pinned ? 2.2 : 1));
    }
    if (wp.mag < gun.mag * 0.3 && wp.reserve > 0 && !gun.kind) { this.peeking = false; inp.reload = true; }
    if (this.peekNode < 0) {
      inp.crouch = !this.peeking;
      return this.peeking;
    }
    // At a corner: a step out to shoot, a step back to hide. (It only fires once it has stopped.)
    const n = this.peeking ? this.peekNode : this.cv, x = w.nodeX(n) - s.x, z = w.nodeZ(n) - s.z, d = Math.hypot(x, z);
    if (d > 0.3) { this.wx = x / d; this.wz = z / d; return false; }
    return this.peeking && Math.hypot(s.vx, s.vz) < 0.5;
  }

  // In cover with the enemy out of sight a moment: keep at it, watching
  // where it was; the squad's holders fire on that spot to keep its head
  // down; and a grenade, if it went to ground close by.
  holdCover(dt) {
    const s = this.s, m = this.m, r = m.rng, inp = s.in, wp = s.weapons[s.slot], gun = wp.gun;
    this.mode = 'hold';
    const since = m.time - this.lastSeen, dist = Math.hypot(this.lx - s.x, this.lz - s.z);
    if (since > 0.6 && since < 3 && dist > 8 && dist < 26 && s.nadeCount > 0 && m.time > this.nadeAt) {
      this.nadeAt = m.time + 8 + r.next() * 6;
      if (r.next() < this.k.nade && this.startLob(this.lx, this.ly, this.lz)) return;
    }
    const up = this.coverCycle(dt, dist, gun, wp);
    this.aimAt(this.lx, this.ly + (s.crouching ? 0.9 : 1.2), this.lz, dt);
    inp.ads = up && !gun.kind;
    // Covering fire, in short bursts.
    if (up && !this.mover && gun.auto && since < 3.5 && wp.mag > gun.mag * 0.3 && r.next() < 0.5) inp.fire = true;
    // Nothing for a while: back to whatever it was doing.
    if (since > 6) { this.target = null; this.atCover = false; }
  }

  // ---- it was here a moment ago --------------------------------------------------------

  hunt(dt) {
    const s = this.s, m = this.m, k = this.k, inp = s.in, r = m.rng;
    const since = m.time - this.lastSeen;
    const dx = this.lx - s.x, dz = this.lz - s.z, dist = Math.hypot(dx, dz);
    if (this.mode === 'camp') {
      this.aimAt(this.lx, this.ly + 1.2, this.lz, dt);
      inp.ads = true;
      return;
    }
    this.mode = 'hunt';
    // Lob a grenade at where it went, now and then.
    if (since > 0.5 && since < 3 && dist > 8 && dist < 27 && s.nadeCount > 0 && m.time > this.nadeAt) {
      this.nadeAt = m.time + 9 + r.next() * 8;
      if (r.next() < k.nade && this.startLob(this.lx, this.ly, this.lz)) return;
    }
    if (since < 0.7) {
      // Keep the sights on the corner it went round.
      this.aimAt(this.lx, this.ly + 1.2, this.lz, dt);
      inp.ads = dist > 10 && !s.weapons[s.slot].gun.kind;
      return;
    }
    if (dist < 1.6) { this.target = null; return; }
    this.goTo(m.world.nodeAt(this.lx, this.ly + 0.1, this.lz), 1.2);
    if (!this.follow()) { this.target = null; return; }
    // Look at where it was while it's close; otherwise where it's walking.
    if (dist < 12 && this.w.sees(s.x, m.eyeY(s), s.z, this.lx, this.ly + 1.2, this.lz)) this.aimAt(this.lx, this.ly + 1.2, this.lz, dt);
    else this.lookAlong(dt);
    inp.sprint = dist > 14;
  }

  // ---- grenades ------------------------------------------------------------------------

  // Works out how high to throw to land a grenade near (x, y, z).
  startLob(x, y, z) {
    const s = this.s, m = this.m;
    const dx = x - s.x, dz = z - s.z, dist = Math.hypot(dx, dz), drop = y + 0.3 - (m.eyeY(s) - 0.1);
    let best = null, bestMiss = 3;
    for (let p = -0.15; p <= 0.85; p += 0.05) {
      const vh = 16 * Math.cos(p), vy = 16 * Math.sin(p) + 3.2;
      // How far along it is when it comes down to the target's height.
      const disc = vy * vy + 2 * 17 * -drop;
      if (disc < 0) continue;
      const t = (vy + Math.sqrt(disc)) / 17, miss = Math.abs(vh * t - dist);
      if (miss < bestMiss) { bestMiss = miss; best = p; }
    }
    if (best === null) return false;
    const yaw = Math.atan2(dx, -dz), c = Math.cos(best);
    // Not if there's a wall right in front.
    if (this.w.ray(s.x, m.eyeY(s), s.z, Math.sin(yaw) * c, Math.sin(best), -Math.cos(yaw) * c, 3) < Infinity) return false;
    this.lob = { yaw, pitch: best, until: m.time + 1.2 };
    return true;
  }

  throwing(dt) {
    const s = this.s, inp = s.in, l = this.lob;
    this.turn(l.yaw, l.pitch, dt, 1.5);
    if (Math.abs(wrap(l.yaw - inp.yaw)) < 0.05 && Math.abs(l.pitch - inp.pitch) < 0.05) {
      inp.nade = !s.nadeHeld;
      if (inp.nade) this.lob = null;
    } else if (this.m.time > l.until) this.lob = null;
  }

  flee(dt) {
    const s = this.s, inp = s.in;
    this.wx = this.fleeX;
    this.wz = this.fleeZ;
    // If straight away is blocked, slide along whichever way is open.
    if (this.w.blocked(s.x + this.wx * 0.7, s.y, s.z + this.wz * 0.7, s.r, s.h, STEP_UP)) {
      const ax = -this.fleeZ, az = this.fleeX;
      const side = this.w.blocked(s.x + ax * 0.7, s.y, s.z + az * 0.7, s.r, s.h, STEP_UP) ? -1 : 1;
      this.wx = ax * side; this.wz = az * side;
    }
    this.turn(Math.atan2(this.wx, -this.wz), 0, dt, 1.5);
    inp.sprint = true;
    this.path = null;
  }

  // ---- getting out of the way to mend --------------------------------------------------

  takeCover() {
    const s = this.s, m = this.m, w = this.w, t = this.target, r = m.rng;
    const ty = m.eyeY(t);
    for (let k = 0; k < 14; k++) {
      const x = s.x + (r.next() * 2 - 1) * 11, z = s.z + (r.next() * 2 - 1) * 11;
      const n = w.nodeAt(x, s.y + 0.6, z);
      if (n < 0 || Math.abs(w.nodeY[n] - s.y) > 2.5) continue;
      if (w.sees(t.x, ty, t.z, w.nodeX(n), w.nodeY[n] + 1.2, w.nodeZ(n))) continue;
      const p = w.path(w.nodeAt(s.x, s.y + 0.1, s.z), n, this.salt, 0);
      if (!p || p.length > 22) continue;
      this.path = p; this.pi = 0; this.ahead = 0; this.goal = n;
      this.mode = 'cover';
      this.coverUntil = m.time + 6;
      return true;
    }
    return false;
  }

  cover(dt) {
    const s = this.s, m = this.m, inp = s.in;
    if (s.hp >= s.maxHp * 0.85 || m.time > this.coverUntil) { this.mode = 'hunt'; this.path = null; return; }
    if (this.path && this.follow()) {
      this.lookAlong(dt);
      inp.sprint = true;
      return;
    }
    // In cover: keep low and watch the way it came.
    this.path = null;
    inp.crouch = true;
    this.aimAt(this.lx, this.ly + 1.2, this.lz, dt);
    if (this.visible) { this.mode = 'fight'; }
  }

  // ---- going places --------------------------------------------------------------------

  roam(dt) {
    const s = this.s, m = this.m, inp = s.in, r = m.rng, map = m.map;
    if (this.mode === 'camp') { this.camp(dt); return; }
    if (m.time < this.waitUntil) {
      // Arrived: hold here a while, watching the way the other team comes from.
      this.turn(this.holdYaw + Math.sin(m.time * 0.9 + s.id) * 0.7, 0, dt, 0.3);
      inp.crouch = this.holdLow;
      inp.ads = s.weapons[s.slot].gun.alt !== 'throw';
      // (Hit from somewhere it can't see: move. But not off an objective it is holding.)
      if (m.time - s.hurtAt < 0.4 && !(m.type === 'adv' && this.obj && Math.hypot(this.obj.x - s.x, this.obj.z - s.z) < 12)) this.waitUntil = 0;
      return;
    }
    if (!this.path || this.goal < 0 || m.time >= this.repathAt) this.newGoal();
    if (!this.follow()) {
      this.path = null;
      this.goal = -1;
      if (this.perch) {
        this.mode = 'camp';
        this.campUntil = m.time + 14 + r.next() * 16;
        return;
      }
      const quick = s.weapons[0].gun.id === 'smg' || s.weapons[0].gun.id === 'shotgun';
      this.waitUntil = m.time + (quick ? 1 + r.next() * 3 : 2.5 + r.next() * 7);
      this.holdLow = r.next() < 0.4;
      // Face the nearest place an enemy was seen lately, else their end of the yard.
      // (In Advance the attack always comes from the west.)
      let tx = m.type === 'adv' ? (s.team === m.attack ? map.W : 0) : m.arena ? (s.team ? m.arena.x0 : m.arena.x1) : s.team ? 8 : map.W - 8, tz = map.H / 2, bestD = Infinity;
      for (const e of m.soldiers) {
        if (e.team === s.team || m.time - e.knownT > 12) continue;
        const d = Math.hypot(e.kx - s.x, e.kz - s.z);
        if (d < bestD) { bestD = d; tx = e.kx; tz = e.kz; }
      }
      this.holdYaw = Math.atan2(tx - s.x, -(tz - s.z));
      return;
    }
    this.lookAlong(dt);
    inp.sprint = this.astray || (this.path.length - this.pi > 7 && m.time - this.lastSeen > 3 && m.time - s.hurtAt > 3);
  }

  // Where to go next: where the other team was last seen, a marksman's
  // window, or one of the map's busy spots (their end more than ours).
  // ---- Advance: the objectives ---------------------------------------------------------

  // Which objective to work on. Attackers: the squads share out the ones
  // not yet taken. Defenders: one being taken draws in most of those near
  // enough; otherwise each squad guards its own.
  pickObjective() {
    const s = this.s, m = this.m, r = m.rng, objs = m.objectives();
    if (s.team === m.attack) {
      const open = objs.filter((o) => !o.own);
      if (!open.length) return objs[0];
      return open[s.squad % open.length];
    }
    let hot = null, hotD = Infinity;
    for (const o of objs) {
      const d = Math.hypot(o.x - s.x, o.z - s.z);
      if ((o.a > 0 || o.p > 0.02 || o.own) && d < hotD) { hotD = d; hot = o; }
    }
    if (hot && (hotD < 60 || r.next() < 0.5)) return hot;
    return objs[s.squad % objs.length];
  }

  // In a fight, does it keep pushing on into its objective rather than
  // stand and trade shots? Most attackers do, while it isn't theirs; and
  // defenders do, while it is being taken. (Decided afresh every few seconds.)
  push() {
    const s = this.s, m = this.m, o = this.obj, r = m.rng;
    if (m.type !== 'adv' || !o || this.astray) return false;
    const mine = s.team === m.attack, d = Math.hypot(o.x - s.x, o.z - s.z);
    const want = mine ? !o.own : o.a > 0 || o.p > 0.02;
    if (!want || d < 3 || d > 60) return false;
    if (m.time > this.pushAt) {
      this.pushAt = m.time + 2 + r.next() * 3;
      this.pushing = r.next() < (mine ? 0.8 : 0.65) * (0.7 + 0.3 * this.k.dance);
    }
    if (!this.pushing) return false;
    const w = this.w;
    if (this.goal < 0 || Math.hypot(w.nodeX(this.goal) - o.x, w.nodeZ(this.goal) - o.z) > 4 || !this.path) {
      if (d > 12) this.flowTo(o, 2);
      else {
        const a = r.next() * Math.PI * 2, rr = 3 * Math.sqrt(r.next());
        let n = w.nodeAt(o.x + Math.cos(a) * rr, o.y + 0.6, o.z + Math.sin(a) * rr);
        if (n < 0) n = w.nodeAt(o.x, o.y + 0.6, o.z);
        this.goTo(n, 3, true);
      }
    }
    return this.follow();
  }

  // Sets its path down the flow to objective o, to within `stop` of it.
  flowTo(o, stop) {
    const s = this.s, w = this.w, m = this.m;
    const at = w.nodeAt(o.x, o.y + 0.6, o.z), from = w.nodeAt(s.x, s.y + 0.1, s.z);
    if (at < 0 || from < 0) return false;
    const p = w.pathDown(from, w.flowTo(at), stop);
    if (!p || p.length < 2) return false;
    this.path = p;
    this.pi = 0;
    this.ahead = 0;
    this.goal = p[p.length - 1];
    this.repathAt = m.time + 25;
    return true;
  }

  // Should it leave the objective it is at for another?
  needsMove() {
    const s = this.s, m = this.m, o = this.obj;
    if (s.team === m.attack) return o.own;
    if (o.a > 0 || o.p > 0.02 || o.own) return false;
    return m.objectives().some((x) => x !== o && (x.a > 0 || x.p > 0.05)) && m.rng.next() < 0.35;
  }

  // Would going after something at (x, z) take it too far from its objective?
  leashed(x, z) {
    const m = this.m, o = this.obj;
    if (m.type !== 'adv' || !o || this.astray) return false;
    const mine = this.s.team === m.attack;
    return Math.hypot(x - o.x, z - o.z) > (mine ? (o.own ? 45 : 16) : 24);
  }

  // Where to come in, when it is its turn. In Advance, beside a squad mate
  // who is well forward of where it would otherwise come in (attacking),
  // or in the thick of things at an objective being taken (defending).
  pickSpawn() {
    const s = this.s, m = this.m, r = m.rng;
    s.spawnOn = -1;
    if (m.type !== 'adv') return;
    const sec = m.sectorNow(), mine = s.team === m.attack, objs = m.objectives();
    const toObj = (x, z) => {
      let d = Infinity;
      for (const o of objs) if (!mine || !o.own) d = Math.min(d, Math.hypot(o.x - x, o.z - z));
      return d;
    };
    const base = mine ? toObj(sec.x0 - 5, 64) : Infinity;
    let best = null, bestD = mine ? base - 25 : 18;
    for (const e of m.soldiers) {
      if (e.team !== s.team || e.squad !== s.squad || !m.canSpawnOn(s, e)) continue;
      const d = toObj(e.x, e.z);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best && r.next() < (mine ? 0.85 : 0.5)) s.spawnOn = best.id;
  }

  // ---- medics -----------------------------------------------------------------------------

  medic() { return !!this.m.classes[this.s.cls].medic; }

  // A team-mate down near enough to get to before it's too late.
  findBody() {
    const s = this.s, m = this.m;
    let best = null, bestD = 26;
    for (const e of m.soldiers) {
      if (e.alive || e.team !== s.team || e.down < REVIVE_TIME + 1 || Math.abs(e.y - s.y) > 3) continue;
      const d = Math.hypot(e.x - s.x, e.z - s.z);
      // (Not one so far it would be gone by the time it got there.)
      if (d < bestD && d / 5 < e.down - REVIVE_TIME) { bestD = d; best = e; }
    }
    return best;
  }

  reviveBody(e, dt) {
    const s = this.s, inp = s.in, w = this.w;
    this.mode = 'revive';
    const dx = e.x - s.x, dz = e.z - s.z, d = Math.hypot(dx, dz);
    if (d > 1.4) {
      if (this.goal < 0 || Math.abs(w.nodeX(this.goal) - e.x) > 1.5 || Math.abs(w.nodeZ(this.goal) - e.z) > 1.5) this.goTo(w.nodeAt(e.x, e.y + 0.3, e.z), 2, true);
      if (!this.follow()) { this.wx = dx / (d || 1); this.wz = dz / (d || 1); }
      this.lookAlong(dt);
      inp.sprint = d > 5;
      return;
    }
    // Beside it: down low, working.
    this.path = null;
    this.goal = -1;
    inp.use = true;
    inp.crouch = true;
    this.turn(Math.atan2(dx, -dz), -0.6, dt, 0.6);
  }

  // Is its main gun empty, with nothing left to load?
  dry() {
    const main = this.s.weapons[0];
    return !main.gun.kind && main.mag + main.reserve <= 0;
  }

  newGoal() {
    const s = this.s, m = this.m, w = this.w, r = m.rng, map = m.map;
    this.perch = null;
    let node = -1;
    // Empty: go and get a weapon someone dropped, if there is one not far off.
    if (this.dry()) {
      let best = null, bestD = 30;
      for (const d of m.drops) {
        const dist = Math.hypot(d.x - s.x, d.z - s.z);
        if (dist < bestD && Math.abs(d.y - s.y) < 4) { bestD = dist; best = d; }
      }
      if (best) {
        node = w.nodeAt(best.x, best.y + 0.3, best.z);
        if (node >= 0) { this.goTo(node, 30, true); if (this.path) return; }
        node = -1;
      }
    }
    // Advance: always to an objective (see pickObjective). An attacker goes
    // right into one it hasn't taken; a defender stands guard round its own,
    // in cover, and goes right in when it is being taken. The long guns and
    // bows keep a little way off.
    if (m.type === 'adv') {
      const o = this.obj = this.pickObjective(), mine = s.team === m.attack;
      const id = s.weapons[0].gun.id, far = id === 'sniper' || id === 'bow';
      const into = (mine && !o.own) || (!mine && (o.a > 0 || o.p > 0.02));
      const [r0, r1] = far ? [8, 18] : into ? [0, 3.6] : [3, 11];
      let best = -1, bestScore = -Infinity;
      for (let k = 0; k < 8; k++) {
        const a = r.next() * Math.PI * 2, d = r0 + (r1 - r0) * Math.sqrt(r.next());
        const n = w.nodeAt(o.x + Math.cos(a) * d, o.y + 0.6, o.z + Math.sin(a) * d);
        if (n < 0 || Math.abs(w.nodeY[n] - o.y) > 3) continue;
        // (Guarding, a spot against a wall is better.)
        const score = (into ? 0 : w.nodeNear[n] * 2) + r.next();
        if (score > bestScore) { bestScore = score; best = n; }
      }
      if (best < 0) best = w.nodeAt(o.x, o.y + 0.6, o.z);
      // A long way off: down the shared flow to the objective (see World.flowTo),
      // stopping short of it; the last few metres are found when it gets there.
      if (Math.hypot(o.x - s.x, o.z - s.z) > 24 && this.flowTo(o, into ? 3 : 8)) return;
      this.goTo(best, 30, true);
      if (!this.path) this.waitUntil = m.time + 0.5;
      return;
    }
    // A squad keeps together: away from its leader (the first of it still
    // standing, which may be the player), it goes back to them.
    const lead = m.soldiers.find((e) => e.alive && e.team === s.team && e.squad === s.squad);
    if (lead && lead !== s && Math.hypot(lead.x - s.x, lead.z - s.z) > 14 && r.next() < 0.8) {
      const a = r.next() * Math.PI * 2;
      const n = w.nodeAt(lead.x + Math.cos(a) * 4, lead.y + 0.6, lead.z + Math.sin(a) * 4);
      if (n >= 0) { this.goTo(n, 6, true); if (this.path) return; }
    }
    if ((s.weapons[0].gun.id === 'sniper' && r.next() < 0.75) || (s.weapons[0].gun.id === 'bow' && s.weapons[0].mag > 0 && r.next() < 0.4)) {
      let best = null, bestD = Infinity;
      for (const p of map.perches) {
        // (Not the one it has just left, nor the one beside it.)
        if (Math.hypot(p.x - s.x, p.z - s.z) < 8) continue;
        const d = Math.hypot(p.x - s.x, p.z - s.z) * (p.side === s.team ? 1 : 1.6) * (0.6 + r.next());
        if (d < bestD && !m.soldiers.some((o) => o !== s && o.alive && Math.hypot(o.x - p.x, o.z - p.z) < 1.5)) { bestD = d; best = p; }
      }
      if (best) { this.perch = best; node = w.nodeAt(best.x, best.y + 0.1, best.z); }
    }
    const [z0, z1] = LANE_Z[this.lane];
    if (node < 0 && r.next() < 0.55) {
      // Somewhere the other team has just been seen, if it's near or on its side of the yard.
      let best = null, bestD = Infinity;
      for (const e of m.soldiers) {
        if (e.team === s.team || m.time - e.knownT > 9) continue;
        const d = Math.hypot(e.kx - s.x, e.kz - s.z);
        if (d > 30 && (e.kz < z0 || e.kz >= z1)) continue;
        if (d * (0.7 + r.next() * 0.6) < bestD) { bestD = d; best = e; }
      }
      if (best) node = w.nodeAt(best.kx, best.ky2 + 0.1, best.kz);
    }
    if (node < 0) {
      const spots = m.arena ? m.arena.spots : map.spots;
      for (let k = 0; k < 8 && node < 0; k++) {
        const p = spots[Math.floor(r.next() * spots.length)];
        if (p.side === s.team && r.next() < 0.6) continue;
        if ((p.z < z0 || p.z >= z1) && r.next() < 0.8) continue;
        node = w.nodeAt(p.x, p.y + 0.1, p.z);
      }
    }
    this.goTo(node, 30, true, map.laneCost ? map.laneCost[this.lane] : null);
    if (!this.path) this.waitUntil = m.time + 0.5;
  }

  // Plans a way to a node. Asked again for the same node, it only plans
  // afresh every `every` seconds.
  goTo(node, every, force = false, extra = null) {
    const s = this.s, m = this.m, w = this.w;
    if (!force && this.path && node === this.goal && m.time < this.repathAt) return;
    if (!force && this.path && m.time < this.repathAt && this.goal >= 0 && node >= 0
      && Math.abs(w.nodeX(node) - w.nodeX(this.goal)) + Math.abs(w.nodeZ(node) - w.nodeZ(this.goal)) < 3) return;
    const from = w.nodeAt(s.x, s.y + 0.1, s.z);
    this.goal = node;
    this.repathAt = m.time + every;
    this.path = from >= 0 && node >= 0 ? w.path(from, node, this.salt + this.stuck * 101, 0.5, extra) : null;
    this.pi = 0;
    this.ahead = 0;
  }

  // Walks along the path. False when there's no path, or it has arrived.
  follow() {
    const s = this.s, w = this.w, p = this.path, inp = s.in;
    if (!p) return false;
    while (this.pi < p.length) {
      const n = p[this.pi];
      if (Math.hypot(w.nodeX(n) - s.x, w.nodeZ(n) - s.z) < 0.5 && Math.abs(w.nodeY[n] - s.y) < 0.8) this.pi++;
      else break;
    }
    if (this.pi >= p.length) return false;
    // Cut the corner to a point further along, if the way to it is clear and level.
    if ((this.m.tick + s.id) % 5 === 0 || this.ahead < this.pi) {
      this.ahead = this.pi;
      for (let j = Math.min(p.length - 1, this.pi + 4); j > this.pi; j--) {
        if (this.clearWalk(p, this.pi, j)) { this.ahead = j; break; }
      }
      // (The points cut past are done with.)
      this.pi = this.ahead;
    }
    const n = p[this.ahead], dx = w.nodeX(n) - s.x, dz = w.nodeZ(n) - s.z, d = Math.hypot(dx, dz) || 1;
    this.wx = dx / d;
    this.wz = dz / d;
    // A ledge to hop up onto.
    const next = p[this.pi], up = w.nodeY[next] - s.y;
    if (up > STEP_UP && s.grounded && Math.hypot(w.nodeX(next) - s.x, w.nodeZ(next) - s.z) < 1.3) inp.jump = !s.jumpHeld;
    // Fallen a long way off the path: plan again.
    if (Math.hypot(w.nodeX(next) - s.x, w.nodeZ(next) - s.z) > 9) this.repathAt = 0;
    return true;
  }

  // Is it a plain walk from here straight to path point j?
  clearWalk(p, i, j) {
    const s = this.s, w = this.w;
    for (let k = i; k <= j; k++) if (Math.abs(w.nodeY[p[k]] - s.y) > 0.01) return false;
    const n = p[j], dx = w.nodeX(n) - s.x, dz = w.nodeZ(n) - s.z, d = Math.hypot(dx, dz);
    const steps = Math.ceil(d / 0.4);
    for (let k = 1; k <= steps; k++) {
      const x = s.x + (dx * k) / steps, z = s.z + (dz * k) / steps;
      if (w.blocked(x, s.y, z, s.r + 0.12, s.h, 0.05) || w.floorUnder(x, s.y, z, 0.05, 0.05) < s.y - 0.01) return false;
    }
    return true;
  }

  // Looks the way it is walking, with a glance to the side now and then.
  lookAlong(dt) {
    const s = this.s, m = this.m, w = this.w, p = this.path, r = m.rng;
    let yaw = s.in.yaw, pitch = 0;
    if (p && this.pi < p.length) {
      const n = p[Math.min(p.length - 1, this.pi + 4)], dx = w.nodeX(n) - s.x, dz = w.nodeZ(n) - s.z, d = Math.hypot(dx, dz);
      if (d > 0.6) {
        yaw = Math.atan2(dx, -dz);
        pitch = Math.max(-0.6, Math.min(0.6, Math.atan2(w.nodeY[n] - s.y, d)));
      }
    }
    if (m.time > this.glanceAt) {
      this.glanceAt = m.time + 1.5 + r.next() * 3;
      this.glance = (r.next() < 0.5 ? -1 : 1) * (0.5 + r.next() * 0.9);
      this.glanceUntil = m.time + 0.35 + r.next() * 0.4;
    }
    if (m.time < this.glanceUntil && !s.sprinting) yaw += this.glance;
    this.turn(yaw, pitch, dt, 0.8);
  }

  // A marksman holding a spot: sights up, sweeping the view.
  camp(dt) {
    const s = this.s, m = this.m, inp = s.in, p = this.perch;
    if (!p || m.time > this.campUntil || m.time - s.hurtAt < 0.3) {
      this.mode = 'roam';
      this.perch = null;
      this.path = null;
      this.repathAt = 0;
      return;
    }
    inp.ads = true;
    const sweep = Math.sin(m.time * 0.45 + s.id) * 0.6;
    this.turn(p.yaw + sweep, -0.07, dt, 0.25);
  }

  // Walking into something for a second: hop, then find another way.
  unstick() {
    const s = this.s, m = this.m;
    if (m.time < this.checkAt) return;
    const moved = Math.hypot(s.x - this.checkX, s.z - this.checkZ);
    const trying = Math.hypot(this.wx, this.wz) > 0.5 && this.path;
    this.checkAt = m.time + 0.8;
    this.checkX = s.x;
    this.checkZ = s.z;
    if (trying && moved < 0.35) {
      this.stuck++;
      s.in.jump = !s.jumpHeld;
      this.repathAt = 0;
      this.strafe = -this.strafe;
      if (this.stuck >= 3) { this.path = null; this.goal = -1; this.target = null; this.stuck = 0; this.mode = this.mode === 'camp' ? 'roam' : this.mode; }
    } else if (moved > 0.6) this.stuck = 0;
  }
}
