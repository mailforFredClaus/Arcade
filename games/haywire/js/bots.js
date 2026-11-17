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

const TAU = Math.PI * 2, RAD = Math.PI / 180;

// How good a bot is: seconds to react, how far off its aim wanders
// (degrees), how long its aim takes to settle on a new target, how fast it
// can turn (radians a second), how much it dodges, and how keen it is on
// grenades and on going for the head.
export const SKILL = [
  { name: 'Easy', react: 0.85, err: 10.5, settle: 1.9, turn: 3.4, dance: 0.3, nade: 0.2, head: 0.04, hear: 0.6 },
  { name: 'Normal', react: 0.55, err: 7.6, settle: 1.4, turn: 5.2, dance: 0.65, nade: 0.45, head: 0.1, hear: 1 },
  { name: 'Hard', react: 0.32, err: 4.6, settle: 0.9, turn: 7.5, dance: 1, nade: 0.75, head: 0.22, hear: 1.3 },
];

// How close each gun likes to be: nearer than the first it backs off,
// further than the second it closes in.
const RANGE = { rifle: [7, 32], smg: [3, 15], shotgun: [0, 8], lmg: [9, 38], sniper: [16, 90], pistol: [3, 16] };

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
    this.fleeX = this.fleeZ = 0;
    this.fleeUntil = 0;
    // Which way round it goes this life: 0 the north side, 1 the middle,
    // 2 the south. The close-up guns keep to the buildings.
    const gun = this.m.classes[this.s.nextCls >= 0 ? this.s.nextCls : this.s.cls].gun, roll = this.m.rng.next();
    this.wantDraw = 1; // how far to draw the bow before letting go
    this.throwAt = this.m.time + 1 + this.m.rng.next() * 3;
    this.parry = false;
    this.sawSwing = false;
    const mid = gun === 'shotgun' ? 0.1 : gun === 'smg' ? 0.22 : gun === 'lmg' ? 0.45 : 0.34;
    this.lane = roll < mid ? 1 : roll < mid + (1 - mid) / 2 ? 0 : 2;
  }

  // ---- every step ---------------------------------------------------------------------

  think(dt) {
    const s = this.s, m = this.m, inp = s.in;
    inp.mx = inp.mz = 0;
    inp.jump = false;
    inp.fire = inp.reload = inp.nade = inp.sprint = inp.crouch = inp.ads = inp.melee = inp.use = inp.prone = inp.slide = false;
    // Out of rounds for its main gun: pick up whatever is lying at its feet.
    if (this.dry() && (m.tick + s.id) % 10 === 0 && m.dropNear(s)) inp.use = !s.useHeld;
    inp.slot = -1;
    this.wx = this.wz = 0; // which way to walk, in the world
    // Advance: the fight has moved on to the next sector, so think again about where to go.
    if (m.type === 'adv' && this.sector !== m.sector) {
      this.sector = m.sector;
      this.waitUntil = 0;
      this.repathAt = 0;
      if (this.mode === 'roam') this.path = null;
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
    else if (this.target && m.time - this.lastSeen < 6) this.hunt(dt);
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

    // Moving: close in, back off, or dodge from side to side.
    const fx = dx / dist, fz = dz / dist;
    if (this.mode === 'camp') {
      inp.crouch = false;
    } else if (dist > far) {
      this.goTo(m.world.nodeAt(t.x, t.y + 0.1, t.z), 0.8);
      this.follow();
      // Much too far for this gun: run for it rather than plink.
      if (dist > far * (gun.id === 'smg' || gun.id === 'shotgun' ? 1.15 : 1.6)) {
        this.lookAlong(dt);
        inp.sprint = true;
        inp.ads = false;
        return;
      }
    } else {
      if (m.time >= this.strafeAt) {
        this.strafe = -this.strafe;
        this.strafeAt = m.time + 0.35 + r.next() * 0.9;
        this.still = r.next() > k.dance; // the less sure-footed stand still more
      }
      let wx = 0, wz = 0;
      if (!this.still) { wx = -fz * this.strafe; wz = fx * this.strafe; }
      if (dist < near) { wx -= fx; wz -= fz; } else if (dist > far * 0.7 && !this.still) { wx += fx * 0.6; wz += fz * 0.6; }
      const l = Math.hypot(wx, wz);
      if (l > 0.01) {
        wx /= l; wz /= l;
        // Not off a ledge or into a wall.
        const px = s.x + wx * 0.9, pz = s.z + wz * 0.9;
        if (this.w.blocked(px, s.y, pz, s.r, s.h, STEP_UP) || this.w.floorUnder(px, s.y, pz, 0.1, STEP_UP) < s.y - STEP_UP) {
          this.strafe = -this.strafe;
          wx = wz = 0;
        }
      }
      this.wx = wx; this.wz = wz;
      inp.crouch = (gun.id === 'lmg' || gun.id === 'sniper') && dist > 18 && this.still;
    }

    // Shooting, once it has had time to react and the aim is on.
    const ready = m.time - this.tSeen > k.react && s.protect <= 0.2;
    const size = Math.max(0.012, Math.atan(0.3 / dist)) + (gun.pellets > 1 ? 0.05 : 0);
    const scoped = gun.id !== 'sniper' || s.ads > 0.95;
    if (wp.mag === 0 && s.slot === 0 && dist < 14 && k.dance > 0.5 && s.weapons[1].mag > 0) inp.slot = 1;
    if (ready && off < size && scoped && wp.mag > 0) {
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
      if (dist < 9) stepTo(-fx - fz * this.strafe * 0.5, -fz + fx * this.strafe * 0.5);
      else if (dist > 45) { this.goTo(w.nodeAt(t.x, t.y + 0.1, t.z), 0.8); this.follow(); }
      else if (!this.still && s.draw < 0.5) stepTo(-fz * this.strafe, fx * this.strafe);
      return;
    }

    // A blade. Throw something on the way in, if there's something to throw.
    const keep = gun.id === 'spear' ? 1 : 0;
    let off;
    if (gun.alt === 'throw' && wp.mag > keep && dist > 5.5 && dist < 22 && m.time > this.throwAt) {
      off = lob(gun.shot.speed, gun.shot.grav);
      if (ready && s.cool <= 0 && s.swing <= 0 && off < Math.max(0.02, Math.atan(0.35 / dist))) {
        inp.ads = !s.altHeld;
        if (inp.ads) this.throwAt = m.time + 1.2 + r.next() * 2.5;
      }
    } else off = this.aimAt(t.x, body, t.z, dt, 1, speed);
    // A shield goes up against a drawn bow, and sometimes against a blow.
    if (gun.alt === 'block') {
      const swinging = theirs.kind === 'melee' && t.swing > 0 && dist < theirs.reach + 0.7;
      if (swinging && !this.sawSwing) this.parry = r.next() < 0.2 + 0.45 * k.dance;
      this.sawSwing = swinging;
      if (s.swing <= 0 && ((swinging && this.parry) || (theirs.kind === 'bow' && t.draw > 0.3 && dist > 3.5 && dist < 30))) inp.ads = true;
    }
    if (!camp) {
      if (dist > gun.reach * 0.8) {
        // Straight at it when it's close and in plain view; otherwise by the path.
        if (dist < 7 && Math.abs(t.y - s.y) < 0.6 && w.sees(s.x, s.y + 1, s.z, t.x, t.y + 1, t.z)) stepTo(fx - fz * this.strafe * (dist > 3 ? 0.3 : 0), fz + fx * this.strafe * (dist > 3 ? 0.3 : 0));
        if (this.wx === 0 && this.wz === 0) { this.goTo(w.nodeAt(t.x, t.y + 0.1, t.z), 0.5); this.follow(); }
        inp.sprint = dist > 6 && !inp.ads && off < 0.5;
      } else if (!this.still || dist < gun.reach * 0.4) stepTo(-fz * this.strafe - (dist < gun.reach * 0.45 ? fx : 0), fx * this.strafe - (dist < gun.reach * 0.45 ? fz : 0));
    }
    if (ready && dist < gun.reach + 0.1 && Math.abs(t.y - s.y) < 1.6 && off < 0.5 && s.cool <= 0 && !inp.ads) inp.fire = true;
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
      if (m.time - s.hurtAt < 0.4) this.waitUntil = 0;
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
      let tx = m.arena ? (s.team ? m.arena.x0 : m.arena.x1) : s.team ? 8 : map.W - 8, tz = map.H / 2, bestD = Infinity;
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
    // Advance: mostly, to an objective. Attackers to one that isn't theirs
    // yet; defenders to one that is being taken, or to stand guard.
    if (m.type === 'adv') {
      const mine = s.team === m.attack;
      let obj = null, top = -Infinity;
      for (const o of m.objectives()) {
        const want = mine ? (o.own ? 0.2 : 1.6) : (o.own || o.p > 0.02 || o.a > 0 ? 1.6 : 0.9);
        const score = want + r.next() - Math.hypot(o.x - s.x, o.z - s.z) / 70;
        if (score > top) { top = score; obj = o; }
      }
      // Somewhere in it; the long guns and bows a little way off.
      const id = s.weapons[0].gun.id, wide = id === 'sniper' || id === 'bow' ? 11 : 4.3;
      for (let k = 0; k < 6 && node < 0; k++) {
        const n = w.nodeAt(obj.x + (r.next() * 2 - 1) * wide, obj.y + 0.6, obj.z + (r.next() * 2 - 1) * wide);
        if (n >= 0 && Math.abs(w.nodeY[n] - obj.y) < 2.5) node = n;
      }
      if (node < 0) node = w.nodeAt(obj.x, obj.y + 0.6, obj.z);
      this.goTo(node, 30, true);
      if (!this.path) this.waitUntil = m.time + 0.5;
      return;
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
