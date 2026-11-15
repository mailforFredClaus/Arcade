// Haywire: the rules of a match, as plain numbers. The screen (game.js)
// steps this 60 times a second and draws what it finds here.
//
// Two teams of robots, blue (team 0) and orange (team 1). Every robot, the
// player's included, is a "soldier" and works the same way: each step it is
// handed an input (which way to walk and look, and which buttons are down)
// and the rules do the rest. The bots' inputs come from bots.js.
//
// A team scores one for each robot of the other team it scraps. First to
// the score limit wins, or whoever is ahead when the clock runs out.

import { Brain } from './bots.js';

export const STEP = 1 / 60;
export const GRAVITY = 17, JUMP = 5.9;
export const WALK = 4.7, SPRINT = 1.42, CROUCH = 0.5;
export const RADIUS = 0.32, TALL = 1.8, TALL_CROUCH = 1.25, EYE = 1.62, EYE_CROUCH = 1.05;
export const RESPAWN = 5, REGEN_DELAY = 4.5, REGEN = 34;
export const NADE_FUSE = 2.7, NADE_REACH = 6.5, NADE_DAMAGE = 170;
const RAD = Math.PI / 180;

// dmg: for each hit. head: how much more a head shot does. rate: seconds
// between shots. hip / ads: how wide the shots scatter (degrees) from the hip
// and down the sights. zoom: how much the sights magnify. kick: how far the
// view jumps up and sideways with each shot (degrees). bloom: how much each
// shot widens the scatter. near / far / min: full damage out to near metres,
// falling to min of it at far.
export const GUNS = {
  rifle: { name: 'Riveter', auto: true, pellets: 1, dmg: 26, head: 1.5, rate: 0.098, mag: 30, reserve: 180, reload: 2.0, hip: 2.6, ads: 0.22, adsTime: 0.2, adsMove: 0.62, zoom: 1.35, kickUp: 0.55, kickSide: 0.22, bloom: 0.28, near: 25, far: 60, min: 0.7, weight: 1 },
  smg: { name: 'Buzzer', auto: true, pellets: 1, dmg: 25, head: 1.4, rate: 0.068, mag: 32, reserve: 192, reload: 1.6, hip: 2.0, ads: 0.55, adsTime: 0.15, adsMove: 0.8, zoom: 1.2, kickUp: 0.42, kickSide: 0.3, bloom: 0.22, near: 12, far: 32, min: 0.5, weight: 1 },
  shotgun: { name: 'Scatterjack', auto: false, pellets: 8, dmg: 15, head: 1.2, rate: 0.8, mag: 6, reserve: 36, reload: 0.5, shell: 0.45, hip: 3.6, ads: 2.9, adsTime: 0.2, adsMove: 0.7, zoom: 1.15, kickUp: 3.2, kickSide: 0.8, bloom: 0, near: 7, far: 22, min: 0.2, weight: 1 },
  lmg: { name: 'Hammer', auto: true, pellets: 1, dmg: 24, head: 1.5, rate: 0.132, mag: 80, reserve: 240, reload: 3.6, hip: 3.4, ads: 0.4, adsTime: 0.34, adsMove: 0.45, zoom: 1.3, kickUp: 0.48, kickSide: 0.3, bloom: 0.22, near: 30, far: 70, min: 0.75, weight: 0.96 },
  sniper: { name: 'Longbolt', auto: false, pellets: 1, dmg: 85, head: 2, rate: 1.15, mag: 5, reserve: 30, reload: 2.6, hip: 7, ads: 0.03, adsTime: 0.3, adsMove: 0.4, zoom: 4.2, kickUp: 3.5, kickSide: 0.6, bloom: 0, near: 100, far: 200, min: 1, weight: 1 },
  pistol: { name: 'Spark', auto: false, pellets: 1, dmg: 24, head: 1.5, rate: 0.14, mag: 12, reserve: Infinity, reload: 1.3, hip: 1.6, ads: 0.35, adsTime: 0.12, adsMove: 0.85, zoom: 1.15, kickUp: 1.1, kickSide: 0.35, bloom: 0.5, near: 12, far: 35, min: 0.5, weight: 1 },
};
for (const k of Object.keys(GUNS)) GUNS[k].id = k;

export const CLASSES = [
  { id: 'assault', name: 'Assault', gun: 'rifle', hp: 100, speed: 1, nades: 2, what: 'A steady rifle for any range.' },
  { id: 'runner', name: 'Runner', gun: 'smg', hp: 100, speed: 1.1, nades: 2, what: 'Fast on its feet, deadly up close.' },
  { id: 'breacher', name: 'Breacher', gun: 'shotgun', hp: 110, speed: 1.04, nades: 2, what: 'A shotgun for doorways and corners.' },
  { id: 'gunner', name: 'Gunner', gun: 'lmg', hp: 115, speed: 0.9, nades: 1, what: 'Heavy plating and eighty rounds.' },
  { id: 'marksman', name: 'Marksman', gun: 'sniper', hp: 100, speed: 1, nades: 1, what: 'One shot to the head, from anywhere.' },
];

export const NAMES = [
  ['Bolt', 'Rivet', 'Gasket', 'Sprocket', 'Diode', 'Piston', 'Flux', 'Servo', 'Torque', 'Cog', 'Fuse', 'Widget'],
  ['Crank', 'Spanner', 'Grommet', 'Tappet', 'Shim', 'Clutch', 'Rotor', 'Valve', 'Rust', 'Glitch', 'Static', 'Jolt'],
];

export class Rand {
  constructor(seed) { this.s = seed >>> 0; }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const emptyInput = () => ({ mx: 0, mz: 0, yaw: 0, pitch: 0, jump: false, crouch: false, sprint: false, ads: false, fire: false, reload: false, nade: false, slot: -1, cls: -1 });

export class Match {
  // opts: seed, size (robots a side), human (is soldier 0 the player),
  // skill: [blue, orange] bot skill 0..2, scoreLimit, timeLimit (seconds).
  constructor(map, opts = {}) {
    this.map = map;
    this.world = map.world;
    this.rng = new Rand(opts.seed ?? 1);
    this.size = opts.size ?? 8;
    this.scoreLimit = opts.scoreLimit ?? 50;
    this.timeLimit = opts.timeLimit ?? 600;
    this.time = 0;
    this.tick = 0;
    this.scores = [0, 0];
    this.over = false;
    this.winner = -1;
    this.events = [];
    this.nades = [];
    this.soldiers = [];
    const skill = opts.skill ?? [1, 1];
    for (let team = 0; team < 2; team++) {
      for (let k = 0; k < this.size; k++) {
        const human = !!opts.human && team === 0 && k === 0;
        const s = {
          id: this.soldiers.length, team, human, name: human ? 'You' : NAMES[team][k % NAMES[team].length],
          cls: human ? (opts.cls ?? 0) : [0, 1, 0, 3, 2, 4, 0, 1][k % 8], nextCls: -1,
          alive: false, respawnT: human ? 0 : 0.05 * k, x: 0, y: 0, z: 0, px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, r: RADIUS, h: TALL,
          yaw: 0, pitch: 0, grounded: true, crouching: false, crouchK: 0, sprinting: false, sprintOut: 0, ads: 0,
          hp: 0, maxHp: 100, hurtAt: -99, hurtBy: -1, protect: 0, dmgFrom: new Map(),
          weapons: [], slot: 0, cool: 0, reloadT: 0, swapT: 0, throwT: 0, nadeCount: 0, bloom: 0, kp: 0, ky: 0,
          fireHeld: false, pull: 0, nadeHeld: false, jumpHeld: false, lastShot: -99, stride: 0,
          knownT: -99, kx: 0, ky2: 0, kz: 0, // when and where the other team last knew it to be
          kills: 0, deaths: 0, assists: 0, score: 0, streak: 0, best: 0, heads: 0, shots: 0, hits: 0,
          in: emptyInput(), bot: null,
        };
        s.nextCls = s.cls;
        if (!human) s.bot = new Brain(this, s, skill[team]);
        this.soldiers.push(s);
      }
    }
  }

  // ---- one step ---------------------------------------------------------------------

  step() {
    if (this.over) return;
    const dt = STEP;
    this.tick++;
    this.time += dt;
    for (const s of this.soldiers) {
      s.px = s.x; s.py = s.y; s.pz = s.z;
      if (s.bot && s.alive) s.bot.think(dt);
    }
    for (const s of this.soldiers) this.stepSoldier(s, dt);
    this.separate();
    for (let k = this.nades.length - 1; k >= 0; k--) if (this.stepNade(this.nades[k], dt)) this.nades.splice(k, 1);
    // What the player can see, the whole blue team knows about.
    if (this.tick % 8 === 0) {
      for (const s of this.soldiers) if (s.human && s.alive) this.look(s);
    }
    if (!this.over && this.time >= this.timeLimit) this.finish();
  }

  finish() {
    if (this.over) return;
    this.over = true;
    this.winner = this.scores[0] === this.scores[1] ? -1 : this.scores[0] > this.scores[1] ? 0 : 1;
    this.events.push({ e: 'over', winner: this.winner });
  }

  eyeY(s) { return s.y + EYE + (EYE_CROUCH - EYE) * s.crouchK; }

  // The way a soldier's gun points: where it looks, plus the kick.
  aim(s, out) {
    const yaw = s.yaw + s.ky, pitch = clamp(s.pitch + s.kp, -1.55, 1.55), c = Math.cos(pitch);
    out[0] = Math.sin(yaw) * c;
    out[1] = Math.sin(pitch);
    out[2] = -Math.cos(yaw) * c;
    return out;
  }

  // ---- coming into the yard ---------------------------------------------------------------

  spawn(s) {
    const map = this.map, w = this.world;
    let best = null, bestScore = -Infinity;
    for (let side = 0; side < 2; side++) {
      for (const p of map.spawns[side]) {
        let near = 99, seen = false, taken = false;
        for (const e of this.soldiers) {
          if (!e.alive || e === s) continue;
          const d = Math.hypot(e.x - p.x, e.z - p.z);
          if (d < 1.2) taken = true;
          if (e.team === s.team) continue;
          if (d < near) near = d;
          if (!seen && d < 45 && w.sees(p.x, 1.6, p.z, e.x, this.eyeY(e), e.z)) seen = true;
        }
        const score = Math.min(near, 45) + (side === s.team ? 25 : 0) - (seen ? 30 : 0) - (near < 10 ? 100 : 0) - (taken ? 200 : 0) + this.rng.next() * 6;
        if (score > bestScore) { bestScore = score; best = p; }
      }
    }
    if (s.nextCls >= 0) s.cls = s.nextCls;
    const cls = CLASSES[s.cls];
    s.alive = true;
    s.x = best.x; s.z = best.z; s.y = w.groundAt(best.x, best.z, 0.5);
    s.px = s.x; s.py = s.y; s.pz = s.z;
    s.vx = s.vy = s.vz = 0;
    s.yaw = best.yaw; s.pitch = 0;
    s.in.yaw = best.yaw; s.in.pitch = 0;
    s.grounded = true; s.crouching = false; s.crouchK = 0; s.h = TALL; s.ads = 0; s.sprinting = false;
    s.hp = s.maxHp = cls.hp;
    s.protect = 1.5;
    s.dmgFrom.clear();
    s.weapons = [cls.gun, 'pistol'].map((id) => ({ gun: GUNS[id], mag: GUNS[id].mag, reserve: GUNS[id].reserve }));
    s.pull = 0;
    s.slot = 0; s.cool = 0.3; s.reloadT = 0; s.swapT = 0; s.throwT = 0; s.bloom = 0; s.kp = s.ky = 0;
    s.nadeCount = cls.nades;
    s.streak = 0;
    if (s.bot) s.bot.reset();
    this.events.push({ e: 'spawn', id: s.id });
  }

  // ---- a soldier's step -------------------------------------------------------------------

  stepSoldier(s, dt) {
    const inp = s.in;
    if (inp.cls >= 0 && inp.cls < CLASSES.length) s.nextCls = inp.cls;
    if (!s.alive) {
      s.respawnT -= dt;
      if (s.respawnT <= 0) this.spawn(s);
      return;
    }
    const w = this.world, gun = s.weapons[s.slot].gun, cls = CLASSES[s.cls];
    s.yaw = inp.yaw;
    s.pitch = clamp(inp.pitch, -1.5, 1.5);
    if (s.protect > 0) s.protect -= dt;

    // Standing and crouching.
    if (inp.crouch && !s.crouching) { s.crouching = true; s.h = TALL_CROUCH; }
    else if (!inp.crouch && s.crouching && w.ceilingOver(s.x, s.y, s.z, s.r) >= s.y + TALL) { s.crouching = false; s.h = TALL; }
    s.crouchK += ((s.crouching ? 1 : 0) - s.crouchK) * Math.min(1, dt * 14);

    // Running flat out: forwards only, gun down.
    const busy = s.throwT > 0;
    s.sprinting = inp.sprint && inp.mz > 0.3 && !s.crouching && !inp.ads && !inp.fire && !busy;
    if (s.sprinting) s.sprintOut = 0.16; else if (s.sprintOut > 0) s.sprintOut -= dt;
    const wantAds = inp.ads && !s.sprinting && s.reloadT <= 0 && s.swapT <= 0 && !busy;
    s.ads = clamp(s.ads + (wantAds ? dt : -dt) / gun.adsTime, 0, 1);

    // Walking.
    let mx = inp.mx, mz = inp.mz;
    const ml = Math.hypot(mx, mz);
    if (ml > 1) { mx /= ml; mz /= ml; }
    const speed = WALK * cls.speed * gun.weight * (s.sprinting ? SPRINT : 1) * (s.crouching ? CROUCH : 1) * (1 + (gun.adsMove - 1) * s.ads);
    const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
    const wx = (sy * mz + cy * mx) * speed, wz = (-cy * mz + sy * mx) * speed;
    if (s.grounded) {
      const ax = wx - s.vx, az = wz - s.vz, al = Math.hypot(ax, az), lim = 55 * dt;
      if (al <= lim) { s.vx = wx; s.vz = wz; } else { s.vx += (ax / al) * lim; s.vz += (az / al) * lim; }
      if (inp.jump && !s.jumpHeld && w.ceilingOver(s.x, s.y, s.z, s.r) >= s.y + s.h + 0.4) {
        s.vy = JUMP;
        s.grounded = false;
        this.events.push({ e: 'jump', id: s.id });
      }
    } else {
      // A little steering in the air.
      s.vx += (wx - s.vx) * Math.min(1, dt * 2.2);
      s.vz += (wz - s.vz) * Math.min(1, dt * 2.2);
    }
    s.jumpHeld = inp.jump;
    const fell = s.vy;
    if (w.move(s, dt, GRAVITY)) this.events.push({ e: 'land', id: s.id, v: -fell });
    if (s.grounded) {
      s.stride += Math.hypot(s.vx, s.vz) * dt;
      if (s.stride > (s.sprinting ? 2.5 : 2)) { s.stride = 0; this.events.push({ e: 'foot', id: s.id }); }
    }

    // Healing by itself, once nothing has hit it for a while.
    if (s.hp < s.maxHp && this.time - s.hurtAt > REGEN_DELAY) s.hp = Math.min(s.maxHp, s.hp + REGEN * dt);

    this.stepWeapon(s, dt);
  }

  stepWeapon(s, dt) {
    const inp = s.in;
    if (s.cool > 0) s.cool -= dt;
    if (s.swapT > 0) s.swapT -= dt;
    if (s.throwT > 0) s.throwT -= dt;
    // The kick settles and the scatter tightens again.
    const settle = Math.exp(-dt * 7);
    s.kp *= settle;
    s.ky *= settle;
    if (s.bloom > 0) s.bloom = Math.max(0, s.bloom - dt * 1.6);

    if (inp.slot >= 0 && inp.slot < s.weapons.length && inp.slot !== s.slot && s.throwT <= 0) {
      s.slot = inp.slot;
      s.swapT = 0.4;
      s.reloadT = 0;
      s.bloom = 0;
      this.events.push({ e: 'swap', id: s.id });
    }
    const wp = s.weapons[s.slot], gun = wp.gun;
    const pressed = inp.fire && !s.fireHeld;
    s.fireHeld = inp.fire;
    // A single-shot gun fires once for each press; a press made a moment
    // too soon (still bringing the gun up from a sprint, say) is remembered.
    if (pressed) s.pull = 0.2; else if (s.pull > 0) s.pull -= dt;
    const pulled = gun.auto ? inp.fire : s.pull > 0;

    if (s.reloadT > 0) {
      s.reloadT -= dt;
      if (s.reloadT <= 0) {
        if (gun.shell) {
          // One shell at a time; firing breaks off.
          wp.mag++;
          wp.reserve--;
          this.events.push({ e: 'shell', id: s.id });
          if (wp.mag < gun.mag && wp.reserve > 0 && !inp.fire) s.reloadT = gun.shell;
        } else {
          const take = Math.min(gun.mag - wp.mag, wp.reserve);
          wp.mag += take;
          wp.reserve -= take;
        }
      } else if (gun.shell && pressed && wp.mag > 0) s.reloadT = 0;
    }
    if (s.reloadT <= 0 && s.swapT <= 0 && s.throwT <= 0 && wp.reserve > 0 && wp.mag < gun.mag && (inp.reload || wp.mag === 0)) {
      s.reloadT = gun.reload;
      this.events.push({ e: 'reload', id: s.id, gun: gun.id });
    }
    // Out of rounds altogether: fall back on the pistol.
    if (wp.mag === 0 && wp.reserve <= 0 && s.slot === 0 && s.swapT <= 0) { s.slot = 1; s.swapT = 0.4; }

    if (pulled && s.cool <= 0 && s.reloadT <= 0 && s.swapT <= 0 && s.throwT <= 0 && s.sprintOut <= 0) {
      s.pull = 0;
      if (wp.mag > 0) this.fire(s, wp);
      else if (!gun.auto) this.events.push({ e: 'dry', id: s.id });
    }

    if (inp.nade && !s.nadeHeld && s.nadeCount > 0 && s.throwT <= 0 && s.swapT <= 0) this.throwNade(s);
    s.nadeHeld = inp.nade;
  }

  // How wide a soldier's shots scatter right now, in radians.
  spread(s) {
    const gun = s.weapons[s.slot].gun;
    const moving = Math.min(1, Math.hypot(s.vx, s.vz) / WALK);
    let a = gun.hip + (gun.ads - gun.hip) * s.ads;
    a += s.bloom * (1 - 0.6 * s.ads);
    a *= 1 + moving * (0.7 - 0.45 * s.ads);
    if (s.crouching) a *= 0.8;
    if (!s.grounded) a = a * 2 + 2.5;
    return a * RAD;
  }

  fire(s, wp) {
    const gun = wp.gun, rng = this.rng, w = this.world;
    wp.mag--;
    // (Counted from when the gun was ready, not from this step, so it keeps its true rate.)
    s.cool = Math.max(s.cool, -STEP) + gun.rate;
    s.lastShot = this.time;
    s.protect = 0;
    s.shots++;
    const spread = this.spread(s), d = this.aim(s, [0, 0, 0]);
    const ox = s.x, oy = this.eyeY(s), oz = s.z;
    // Two directions square to the aim, to scatter the shots in.
    const rl = Math.hypot(d[0], d[2]) || 1, rx = -d[2] / rl, rz = d[0] / rl;
    const ux = -d[1] * rz, uy = d[0] * rz - d[2] * rx, uz = d[1] * rx;
    let any = false;
    for (let p = 0; p < gun.pellets; p++) {
      const r = spread * Math.sqrt(rng.next()), a = rng.next() * Math.PI * 2;
      const ex = Math.cos(a) * r, ey = Math.sin(a) * r;
      let dx = d[0] + rx * ex + ux * ey, dy = d[1] + uy * ey, dz = d[2] + rz * ex + uz * ey;
      const l = Math.hypot(dx, dy, dz);
      dx /= l; dy /= l; dz /= l;
      let t = w.ray(ox, oy, oz, dx, dy, dz, 160), struck = null, head = false;
      const wallN = t < Infinity ? [w.hit.nx, w.hit.ny, w.hit.nz] : null;
      for (const e of this.soldiers) {
        if (!e.alive || e.team === s.team) continue;
        const te = this.rayHits(e, ox, oy, oz, dx, dy, dz, t);
        if (te.t < t) { t = te.t; struck = e; head = te.head; }
      }
      const far = t === Infinity ? 160 : t;
      this.events.push({ e: 'shot', id: s.id, gun: gun.id, first: p === 0, x: ox + dx * far, y: oy + dy * far, z: oz + dz * far, hit: struck ? (head ? 2 : 1) : t < Infinity ? 0 : -1, n: struck ? null : wallN });
      if (struck) {
        any = true;
        const fall = far <= gun.near ? 1 : far >= gun.far ? gun.min : 1 - ((far - gun.near) / (gun.far - gun.near)) * (1 - gun.min);
        this.hurt(struck, gun.dmg * fall * (head ? gun.head : 1), s, gun.id, head);
      }
    }
    if (any) s.hits++;
    const ease = (1 - 0.35 * s.ads) * (s.crouching ? 0.85 : 1);
    s.kp += gun.kickUp * RAD * ease;
    s.ky += (rng.next() * 2 - 1) * gun.kickSide * RAD * ease;
    s.bloom = Math.min(1.6, s.bloom + gun.bloom);
    // A shot gives you away to anyone on the other side close enough to hear it.
    for (const e of this.soldiers) {
      if (e.alive && e.team !== s.team && Math.hypot(e.x - s.x, e.z - s.z) < 45) { this.know(s); break; }
    }
  }

  // Where a ray meets soldier e, if it does before maxT: the head is a
  // ball, the body an upright cylinder.
  rayHits(e, ox, oy, oz, dx, dy, dz, maxT) {
    const out = this.hitOut || (this.hitOut = { t: Infinity, head: false });
    out.t = Infinity;
    out.head = false;
    const top = e.crouching ? 1.02 : 1.5, hy = e.y + top + 0.17;
    // Quick miss: too far from the line.
    const px = e.x - ox, pz = e.z - oz, along = px * dx + pz * dz;
    if (along < -1 || along > maxT + 1) return out;
    let cx = e.x - ox, cy = hy - oy, cz = e.z - oz;
    let pr = cx * dx + cy * dy + cz * dz;
    if (pr > 0) {
      const d2 = cx * cx + cy * cy + cz * cz - pr * pr;
      if (d2 < 0.19 * 0.19) {
        const t = pr - Math.sqrt(0.19 * 0.19 - d2);
        if (t > 0 && t < maxT) { out.t = t; out.head = true; }
      }
    }
    const a = dx * dx + dz * dz;
    if (a > 1e-9) {
      const b = -(px * dx + pz * dz), c = px * px + pz * pz - 0.34 * 0.34, disc = b * b - a * c;
      if (disc > 0) {
        const sq = Math.sqrt(disc), t0 = Math.max(0, (-b - sq) / a), t1 = (-b + sq) / a;
        if (t1 > 0 && t0 < maxT) {
          const y0 = oy + dy * t0, y1 = oy + dy * t1, lo = e.y, hi = e.y + top;
          let t = -1;
          if (y0 >= lo && y0 <= hi) t = t0;
          else if (y0 > hi && y1 < hi) t = (hi - oy) / dy;
          else if (y0 < lo && y1 > lo) t = (lo - oy) / dy;
          if (t >= 0 && t < maxT && t < out.t) { out.t = t; out.head = false; }
        }
      }
    }
    return out;
  }

  hurt(e, dmg, by, gun, head) {
    if (!e.alive || e.protect > 0) return;
    e.hp -= dmg;
    e.hurtAt = this.time;
    e.hurtBy = by.id;
    e.dmgFrom.set(by.id, (e.dmgFrom.get(by.id) || 0) + dmg);
    this.events.push({ e: 'hurt', id: e.id, by: by.id, dmg, head });
    if (e.hp <= 0) this.scrap(e, by, gun, head);
  }

  scrap(e, by, gun, head) {
    e.alive = false;
    e.hp = 0;
    e.deaths++;
    e.respawnT = RESPAWN;
    e.streak = 0;
    const own = by === e;
    if (!own) {
      by.kills++;
      by.streak++;
      by.best = Math.max(by.best, by.streak);
      by.score += 100 + (head ? 25 : 0);
      if (head) by.heads++;
      if (!this.over) this.scores[by.team]++;
      for (const [id, dmg] of e.dmgFrom) {
        const a = this.soldiers[id];
        if (a !== by && a.team !== e.team && dmg >= 25) { a.assists++; a.score += 40; }
      }
    }
    e.dmgFrom.clear();
    this.events.push({ e: 'kill', id: e.id, by: by.id, gun, head, x: e.x, y: e.y, z: e.z, yaw: e.yaw });
    if (this.scores[by.team] >= this.scoreLimit) this.finish();
  }

  // The other team now knows where s is.
  know(s) {
    s.knownT = this.time;
    s.kx = s.x; s.ky2 = s.y; s.kz = s.z;
  }

  // Can soldier a see soldier b (head or chest)?
  canSee(a, b) {
    const w = this.world, ay = this.eyeY(a);
    return w.sees(a.x, ay, a.z, b.x, this.eyeY(b), b.z) || w.sees(a.x, ay, a.z, b.x, b.y + 0.9, b.z);
  }

  // What the player has in view is marked for the team.
  look(s) {
    const d = this.aim(s, [0, 0, 0]);
    for (const e of this.soldiers) {
      if (!e.alive || e.team === s.team) continue;
      const x = e.x - s.x, y = e.y + 1 - this.eyeY(s), z = e.z - s.z, l = Math.hypot(x, y, z) || 1;
      if ((x * d[0] + y * d[1] + z * d[2]) / l > 0.75 && l < 90 && this.canSee(s, e)) this.know(e);
    }
  }

  // Soldiers don't stand inside each other.
  separate() {
    const list = this.soldiers, w = this.world;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (!b.alive || Math.abs(a.y - b.y) > 1.6) continue;
        const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = a.r + b.r;
        if (d >= min || d < 1e-6) continue;
        const k = (min - d) / d / 2, px = dx * k, pz = dz * k;
        if (!w.blocked(a.x - px, a.y, a.z - pz, a.r, a.h, 0.55)) { a.x -= px; a.z -= pz; }
        if (!w.blocked(b.x + px, b.y, b.z + pz, b.r, b.h, 0.55)) { b.x += px; b.z += pz; }
      }
    }
  }

  // ---- grenades ---------------------------------------------------------------------------

  throwNade(s) {
    const d = this.aim(s, [0, 0, 0]);
    s.nadeCount--;
    s.throwT = 0.65;
    s.reloadT = 0;
    s.protect = 0;
    this.nades.push({
      x: s.x + d[0] * 0.3, y: this.eyeY(s) - 0.1, z: s.z + d[2] * 0.3, px: s.x, py: this.eyeY(s), pz: s.z,
      vx: d[0] * 16 + s.vx * 0.5, vy: d[1] * 16 + 3.2, vz: d[2] * 16 + s.vz * 0.5, fuse: NADE_FUSE, by: s.id, team: s.team, rest: false, spin: 0,
    });
    this.events.push({ e: 'throw', id: s.id });
  }

  stepNade(n, dt) {
    const w = this.world;
    n.px = n.x; n.py = n.y; n.pz = n.z;
    n.fuse -= dt;
    if (n.fuse <= 0) { this.explode(n); return true; }
    if (n.rest) return false;
    n.vy -= GRAVITY * dt;
    let left = dt;
    for (let k = 0; k < 3 && left > 1e-5; k++) {
      const v = Math.hypot(n.vx, n.vy, n.vz);
      if (v < 1e-4) break;
      const dx = n.vx / v, dy = n.vy / v, dz = n.vz / v, dist = v * left;
      const t = w.ray(n.x, n.y, n.z, dx, dy, dz, dist + 0.08);
      if (t === Infinity) { n.x += dx * dist; n.y += dy * dist; n.z += dz * dist; break; }
      const go = Math.max(0, t - 0.08);
      n.x += dx * go; n.y += dy * go; n.z += dz * go;
      left -= go / v;
      // Bounce: lose most of the speed into the surface, some along it.
      const h = w.hit, vn = n.vx * h.nx + n.vy * h.ny + n.vz * h.nz;
      n.vx = (n.vx - 1.4 * vn * h.nx) * 0.72;
      n.vy = (n.vy - 1.4 * vn * h.ny) * 0.72;
      n.vz = (n.vz - 1.4 * vn * h.nz) * 0.72;
      if (-vn > 2) this.events.push({ e: 'bounce', x: n.x, y: n.y, z: n.z });
      if (h.ny > 0.5 && Math.hypot(n.vx, n.vy, n.vz) < 1.2) { n.rest = true; n.vx = n.vy = n.vz = 0; break; }
    }
    return false;
  }

  explode(n) {
    const w = this.world, by = this.soldiers[n.by];
    this.events.push({ e: 'boom', x: n.x, y: n.y, z: n.z });
    for (const e of this.soldiers) {
      if (!e.alive || (e.team === n.team && e !== by)) continue;
      const cy = e.y + (e.crouching ? 0.6 : 0.95), d = Math.hypot(e.x - n.x, cy - n.y, e.z - n.z);
      if (d >= NADE_REACH || !w.sees(n.x, n.y + 0.25, n.z, e.x, cy, e.z)) continue;
      this.hurt(e, NADE_DAMAGE * clamp(1 - (d - 1.2) / (NADE_REACH - 1.2), 0, 1), by, 'nade', false);
    }
  }

  // ---- for the screen and the tests --------------------------------------------------------

  // The soldiers of both teams, best score first.
  table(team) {
    return this.soldiers.filter((s) => s.team === team).sort((a, b) => b.score - a.score || a.deaths - b.deaths || a.id - b.id);
  }

  // A number that changes if anything about the match does.
  hash() {
    let h = 2166136261;
    const mix = (v) => { h = Math.imul(h ^ (Math.round(v * 1000) | 0), 16777619); };
    for (const s of this.soldiers) { mix(s.x); mix(s.y); mix(s.z); mix(s.hp); mix(s.kills); mix(s.deaths); mix(s.yaw); }
    mix(this.scores[0]); mix(this.scores[1]);
    return h >>> 0;
  }
}
