// Honey Run: the rules, as plain numbers. The screen (game.js) steps this
// 120 times a second and draws what it finds here.
//
// A bear cub runs for ever down a three-lane railway. s is how far it has
// run; lanes are -1, 0 and 1. Swipe left or right to change lane, up to
// jump, down to roll (or, in the air, to drop fast and roll on landing).
//
// In the way:
//   train   wagons standing on the line (or rolling towards you). Too tall
//           to jump: go round, or run up a ramp and along the roofs.
//   cart    a low hay cart: jump on top, or go round.
//   ramp    leads up onto the roof of the train behind it.
//   low     a fence: jump it.
//   high    a barrier at head height: roll under it.
// Run into the front of something and it's over. Swipe sideways into the
// side of something and you bounce back and stumble: the bees catch up, and
// a second stumble while they're close ends the run.
//
// Power-ups: magnet (pulls coins in), balloons (float above everything
// along a trail of coins), boots (jump onto roofs), double (twice the
// score) and bubble (shrugs off one crash).
//
// The line is laid a little way ahead of the cub, one "beat" at a time.
// One lane, the safe lane, never gets anything the cub can't deal with on
// foot: nothing, or a fence to jump, a barrier to roll under, or a hay cart
// to hop over. Now and then the safe lane moves one lane over (with room
// to follow it). The other lanes fill up with whatever they like, except
// that a train never starts in a lane that is boxed in (no way out to the
// side just before it). So there is always a way through on the ground,
// and the roofs are there for the coins.

export const LANE = 3.4; // metres between lanes
export const STEP = 1 / 120; // seconds per step
export const GRAVITY = 38, JUMP = 13;
// With boots a jump is nearly twice as high but hardly any longer, so the
// timing you've learnt still works.
export const BOOT_GRAVITY = 60, BOOT_JUMP = 22;
export const ROLL_TIME = 0.62;
export const ROOF = 3, CART = 1.5; // heights of a wagon and a hay cart
export const CAR = 8.5, RAMP = 6.5, CART_LEN = 4.5; // lengths
export const FLY_HEIGHT = 7;
export const V0 = 12.5, VMAX = 25;
export const speedAt = (s) => Math.min(VMAX, V0 + s / 280);
export const AHEAD = 150, BEHIND = 24;
const STEP_UP = 0.5; // a ledge this much above your feet is run up onto, not into
const SIDE = 25.5; // sideways speed when changing lane, metres a second

// How long each power-up lasts at upgrade levels 0 to 5.
export const POWER_TIME = { magnet: [8, 10, 12, 15, 18, 22], fly: [6, 7, 8, 9.5, 11, 13], boots: [8, 10, 12, 15, 18, 22], double: [8, 10, 12, 15, 18, 22], bubble: [14, 17, 20, 24, 28, 34] };
export const POWERS = Object.keys(POWER_TIME);

export class Rand {
  constructor(seed) { this.s = seed >>> 0; }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n) { return Math.floor(this.next() * n); }
  pick(list) { return list[this.int(list.length)]; }
  // Picks a key of { key: weight }.
  weighted(table) {
    let total = 0;
    for (const k in table) total += Math.max(0, table[k]);
    let x = this.next() * total;
    for (const k in table) {
      x -= Math.max(0, table[k]);
      if (x <= 0) return k;
    }
    return Object.keys(table)[0];
  }
}

const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Run {
  // levels: upgrade level of each power-up. mult: the score multiplier
  // earned from goals. lay: false makes a run with an empty line (tests).
  constructor({ seed = 1, levels = {}, mult = 1, lay = true } = {}) {
    this.levels = levels;
    this.mult = mult;
    this.lay = lay;
    this.t = 0;
    this.s = 0;
    this.lane = 0;
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.pull = GRAVITY; // how hard the cub is pulled down while in the air
    this.grounded = true;
    this.coyote = 0; // a moment after running off an edge when a jump still works
    this.jumpWait = 0; // a jump asked for just before landing
    this.rollT = 0;
    this.rollOnLand = false;
    this.stumbleT = 0; // the bees are close while this runs down
    this.ghost = 0; // nothing can hurt you while this runs down
    this.dead = false;
    this.cause = '';
    this.hitId = 0; // what the cub ran into
    this.power = { magnet: 0, fly: 0, boots: 0, double: 0, bubble: 0 };
    this.powerFull = { magnet: 1, fly: 1, boots: 1, double: 1, bubble: 1 };
    this.landing = false; // coming down from the balloons
    this.score = 0;
    this.coins = 0;
    this.stats = { jumps: 0, rolls: 0, powers: 0, roof: 0, dodged: 0, bumps: 0, lanes: 0 };
    this.obstacles = [];
    this.coinList = [];
    this.pickups = [];
    this.events = [];
    this.nextId = 1;
    this.rand = new Rand(seed);
    this.gen = { s: 46, safe: 0, busy: [0, 0, 0], hold: [0, 0, 0], sincePower: 0, beats: 0 };
    // Where the safe lane changes: [from s, lane], oldest first.
    this.safePath = [[0, 0]];
    if (lay) this.layAhead();
  }

  get speed() { return speedAt(this.s); }
  get rolling() { return this.rollT > 0; }
  get height() { return this.rolling ? 0.8 : 1.6; }
  get flying() { return this.power.fly > 0; }
  multiplier() { return this.mult * (this.power.double > 0 ? 2 : 1); }

  emit(e, data) { this.events.push(data ? { e, ...data } : { e }); }

  // ---- what you do ------------------------------------------------------------------

  // 'left', 'right', 'up' or 'down'.
  input(a) {
    if (this.dead) return;
    if (a === 'left' || a === 'right') this.sidestep(a === 'left' ? -1 : 1);
    else if (a === 'up') {
      if (this.flying || this.landing) return;
      if (this.grounded || this.coyote > 0) this.jump();
      else this.jumpWait = 0.14;
    } else if (a === 'down') {
      if (this.flying || this.landing) return;
      if (this.grounded) this.roll();
      else {
        this.vy = Math.min(this.vy, -24);
        this.rollOnLand = true;
        this.emit('dive');
      }
    }
  }

  jump() {
    const boots = this.power.boots > 0;
    this.vy = boots ? BOOT_JUMP : JUMP;
    this.pull = boots ? BOOT_GRAVITY : GRAVITY;
    this.grounded = false;
    this.coyote = 0;
    this.jumpWait = 0;
    this.rollT = 0;
    this.rollOnLand = false;
    this.stats.jumps++;
    this.emit('jump');
  }

  roll() {
    this.rollT = ROLL_TIME;
    this.rollOnLand = false;
    this.stats.rolls++;
    this.emit('roll');
  }

  sidestep(d) {
    const to = this.lane + d;
    if (to < -1 || to > 1) {
      this.emit('edge', { d });
      return;
    }
    if (!this.flying && this.ghost <= 0 && this.blockedBeside(to)) {
      // Into the side of something: bounce back, and stumble.
      this.stats.bumps++;
      this.emit('bump', { d });
      this.stumble();
      return;
    }
    this.lane = to;
    this.stats.lanes++;
    this.emit('lane', { d });
  }

  stumble() {
    if (this.stumbleT > 0) return this.crash('bees', null);
    this.stumbleT = 7;
    this.emit('stumble');
  }

  // o: what was run into, if anything.
  crash(cause, o) {
    if (this.power.bubble > 0) {
      this.power.bubble = 0;
      this.emit('pop');
      this.shrug(o, 1.6);
      return;
    }
    this.dead = true;
    this.cause = cause;
    this.hitId = o ? o.id : 0;
    this.emit('crash', { cause });
  }

  // Get past whatever was hit: up onto a wagon's roof, or straight through
  // a fence, with a moment when nothing can hurt.
  shrug(o, time) {
    this.ghost = time;
    this.stumbleT = 0;
    this.rollT = 0;
    if (o && o.h) {
      this.y = Math.max(this.y, Run.top(o, this.s + 0.3) + 0.3);
      this.vy = 5;
      this.pull = GRAVITY;
      this.grounded = false;
    }
  }

  // Carry on after a crash (bought with coins).
  revive() {
    if (!this.dead) return;
    this.dead = false;
    this.cause = '';
    this.shrug(this.obstacles.find((o) => o.id === this.hitId), 2.5);
    this.emit('revive');
  }

  // ---- the line ------------------------------------------------------------------------

  // The top of a thing you can stand on, at s (ramps slope).
  static top(o, s) {
    if (o.kind === 'ramp') return o.h * clamp((s - o.s0) / (o.s1 - o.s0), 0, 1);
    return o.h;
  }

  // Is there something in that lane, beside you, that you can't step onto?
  blockedBeside(lane) {
    for (const o of this.obstacles) {
      if (o.lane !== lane || o.s1 < this.s - 0.6 || o.s0 > this.s + 0.6) continue;
      if (this.hits(o, this.s)) return true;
    }
    return false;
  }

  // Would the cub, at s in o's lane, be inside o?
  hits(o, s) {
    const y = this.y;
    if (o.kind === 'low') return y < 0.85;
    if (o.kind === 'high') return y + this.height > 1.25 && y < 2.6;
    if (o.kind === 'ramp') return y < Run.top(o, s + 0.3) - 0.75;
    return y < o.h - STEP_UP; // train or cart
  }

  // The ground under the cub: the highest thing here it is on or above.
  // (Coming down from the balloons it lands on top of whatever is there.)
  floor() {
    let f = 0;
    const reach = this.landing ? 99 : STEP_UP;
    for (const o of this.obstacles) {
      if (o.lane !== this.lane || !o.h || o.s1 < this.s - 0.25 || o.s0 > this.s + 0.25) continue;
      const top = Run.top(o, this.s + 0.25);
      if (top <= this.y + reach && top > f) f = top;
    }
    return f;
  }

  // ---- one step -----------------------------------------------------------------------

  step() {
    if (this.dead) return;
    const dt = STEP, v = this.speed;
    this.t += dt;
    this.s += v * dt;
    this.score += v * dt * this.multiplier();
    for (const o of this.obstacles) {
      if (!o.v) continue;
      o.s0 -= o.v * dt;
      o.s1 -= o.v * dt;
    }
    if (this.lay) this.layAhead();

    // Timers.
    if (this.coyote > 0) this.coyote -= dt;
    if (this.jumpWait > 0) this.jumpWait -= dt;
    if (this.rollT > 0) this.rollT -= dt;
    if (this.stumbleT > 0) this.stumbleT = Math.max(0, this.stumbleT - dt);
    for (const k of POWERS) {
      if (this.power[k] <= 0) continue;
      this.power[k] -= dt;
      if (this.power[k] <= 0) {
        this.power[k] = 0;
        this.emit('powerEnd', { kind: k });
        if (k === 'fly') {
          this.landing = true;
          this.grounded = false;
          this.pull = GRAVITY;
          this.vy = 0;
        }
      }
    }

    // Sideways.
    const tx = this.lane * LANE;
    if (this.x < tx) this.x = Math.min(tx, this.x + SIDE * dt);
    else if (this.x > tx) this.x = Math.max(tx, this.x - SIDE * dt);

    // Up and down.
    if (this.flying) {
      this.y += (FLY_HEIGHT - this.y) * Math.min(1, 5 * dt);
      this.vy = 0;
      this.grounded = false;
    } else {
      const floor = this.floor();
      if (this.grounded) {
        if (this.y > floor + 0.02) {
          this.grounded = false;
          this.coyote = 0.1;
          this.pull = GRAVITY;
        } else this.y = floor;
        if (floor >= CART) this.stats.roof += v * dt;
      }
      if (!this.grounded) {
        // Coming down from the balloons is gentle.
        this.vy -= (this.landing ? GRAVITY * 0.45 : this.pull) * dt;
        this.y += this.vy * dt;
        if (this.y <= floor && this.vy <= 0) {
          this.y = floor;
          this.vy = 0;
          this.grounded = true;
          if (this.landing) {
            this.landing = false;
            this.ghost = Math.max(this.ghost, 1.2);
          }
          this.emit('land');
          if (this.jumpWait > 0) this.jump();
          else if (this.rollOnLand) this.roll();
        }
      }
    }

    // Running into things.
    let inside = false;
    if (!this.flying) {
      for (const o of this.obstacles) {
        if (o.lane !== this.lane || o.s1 < this.s - 0.3 || o.s0 > this.s + 0.35) continue;
        if (!this.hits(o, this.s)) continue;
        inside = true;
        if (this.ghost <= 0 && !this.landing) {
          this.crash(o.kind, o);
          if (this.dead) return;
        }
        break;
      }
    }
    // Being untouchable never runs out while you're inside something.
    if (this.ghost > 0 && !(inside && this.ghost <= dt)) this.ghost = Math.max(0, this.ghost - dt);

    this.gather(dt);
    this.tidy();
  }

  // Coins and power-ups.
  gather(dt) {
    const magnet = this.power.magnet > 0;
    const cy = this.y + 0.8;
    for (const c of this.coinList) {
      if (c.taken) continue;
      const ds = c.s - this.s;
      if (ds > 12) break;
      if (magnet && !c.pull && ds > -1.5 && ds < 10 && Math.abs(c.y - cy) < 5) c.pull = true;
      if (c.pull) {
        // Fly to the cub, faster the closer it gets.
        const k = Math.min(1, 14 * dt);
        c.x += (this.x - c.x) * k;
        c.y += (cy - c.y) * k;
        c.s += (this.s - c.s) * k;
      }
      if (Math.abs(c.s - this.s) < 0.8 && Math.abs(c.x - this.x) < LANE * 0.52 && Math.abs(c.y - cy) < 1.35) {
        c.taken = true;
        this.coins++;
        this.score += 5 * this.multiplier();
        this.emit('coin', { x: c.x, y: c.y, s: c.s });
      }
    }
    for (const p of this.pickups) {
      if (p.taken || Math.abs(p.s - this.s) > 0.9 || p.lane !== this.lane || Math.abs(p.y - cy) > 2.6) continue;
      p.taken = true;
      this.give(p.kind);
    }
  }

  give(kind) {
    const time = POWER_TIME[kind][clamp(this.levels[kind] || 0, 0, 5)];
    this.power[kind] = time;
    this.powerFull[kind] = time;
    this.stats.powers++;
    this.emit('power', { kind });
    if (kind === 'fly') {
      this.rollT = 0;
      this.landing = false;
      this.skyCoins(time);
    }
  }

  // A trail of coins in the sky, for as long as the balloons last.
  skyCoins(time) {
    let s = this.s + this.speed * 0.9, lane = this.lane;
    const end = this.s + this.speed * (time - 0.5);
    while (s < end) {
      const n = 5 + this.rand.int(5);
      for (let k = 0; k < n && s < end; k++, s += 2.4) this.coin(lane, s, FLY_HEIGHT + 0.8);
      const next = clamp(lane + (this.rand.int(2) ? 1 : -1), -1, 1);
      // Slant across to the next lane.
      for (let k = 1; k <= 2 && s < end; k++, s += 2.4) {
        const c = this.coin(lane, s, FLY_HEIGHT + 0.8);
        c.x = lerp(lane, next, k / 3) * LANE;
      }
      lane = next;
    }
    this.coinList.sort((a, b) => a.s - b.s);
  }

  coin(lane, s, y) {
    const c = { id: this.nextId++, lane, x: lane * LANE, s, y, taken: false, pull: false };
    this.coinList.push(c);
    return c;
  }

  // The lane that is sure to be passable at s.
  safeLane(s) {
    let lane = this.safePath[0][1];
    for (const [from, l] of this.safePath) {
      if (from > s) break;
      lane = l;
    }
    return lane;
  }

  // Forget what's behind.
  tidy() {
    const back = this.s - BEHIND;
    const obs = this.obstacles;
    for (let i = obs.length - 1; i >= 0; i--) {
      if (obs[i].s1 >= back) continue;
      if (obs[i].v) this.stats.dodged++;
      obs.splice(i, 1);
    }
    while (this.coinList.length && (this.coinList[0].taken || this.coinList[0].s < back)) this.coinList.shift();
    while (this.pickups.length && (this.pickups[0].taken || this.pickups[0].s < back)) this.pickups.shift();
    while (this.safePath.length > 1 && this.safePath[1][0] < back) this.safePath.shift();
  }

  // ---- laying the line ------------------------------------------------------------------

  add(o) {
    o.id = this.nextId++;
    this.obstacles.push(o);
    return o;
  }

  // A train of n wagons from s0 on. v: rolling towards you at this speed.
  train(lane, s0, n, v = 0) {
    return this.add({ kind: 'train', lane, s0, s1: s0 + n * CAR, h: ROOF, cars: n, v, look: this.rand.int(5) });
  }

  // A row of coins: n of them from s on, at height y (a function of how
  // far along, for arcs and slopes).
  row(lane, s, n, y = 0.7, gap = 2.2) {
    for (let k = 0; k < n; k++) this.coin(lane, s + k * gap, typeof y === 'function' ? y(k / Math.max(1, n - 1)) : y);
  }

  layAhead() {
    const g = this.gen;
    while (g.s < this.s + AHEAD) this.beat();
  }

  // One beat of the line, starting at gen.s.
  beat() {
    const g = this.gen, R = this.rand;
    const p = g.s, v = speedAt(p), d = clamp(p / 3200, 0, 1);
    // How long this beat is. Never so short that there isn't time to land
    // from one jump before the next.
    const B = v * lerp(1.1, 0.78, d);
    g.beats++;
    const lanes = [-1, 0, 1];
    const idx = (l) => l + 1;
    const safe = g.safe;

    // What the safe lane asks of you.
    const others = lanes.filter((l) => Math.abs(l - safe) === 1 && g.busy[idx(l)] < p - 2 && g.hold[idx(l)] < p - 2);
    const act = g.beats <= 2 ? 'free' : R.weighted({
      free: lerp(0.26, 0.12, d),
      low: 0.2,
      high: g.beats > 5 ? 0.18 : 0,
      shift: others.length ? lerp(0.22, 0.3, d) : 0,
      cart: g.beats > 12 ? 0.05 : 0,
    });

    let next = p + B; // where the next beat starts
    if (act === 'low') {
      const at = p + B * 0.55;
      this.add({ kind: 'low', lane: safe, s0: at - 0.25, s1: at + 0.25 });
      // Coins in an arc over it, the shape of a jump.
      if (R.next() < 0.7) {
        const reach = v * (2 * JUMP / GRAVITY);
        this.row(safe, at - reach / 2 + 0.4, 5, (k) => 0.8 + 4 * 2.0 * k * (1 - k), (reach - 0.8) / 4);
      }
    } else if (act === 'high') {
      const at = p + B * 0.55;
      this.add({ kind: 'high', lane: safe, s0: at - 0.25, s1: at + 0.25 });
      if (R.next() < 0.5) this.row(safe, at - 3.3, 4, 0.5);
    } else if (act === 'cart') {
      // A hay cart: hop on, hop off.
      const at = p + B * 0.55;
      this.add({ kind: 'cart', lane: safe, s0: at, s1: at + CART_LEN, h: CART });
      this.row(safe, at + 0.6, 3, CART + 0.7, 1.6);
      next = Math.max(next, at + CART_LEN + v * 0.5);
    } else if (act === 'shift') {
      // The safe lane moves over. Whatever comes next in the old lane shuts it.
      const to = R.pick(others);
      const slant = Math.min(B * 0.5, 6);
      for (let k = 0; k < 4; k++) {
        const c = this.coin(safe, p + (slant * k) / 3, 0.7);
        c.x = lerp(safe, to, k / 3) * LANE;
      }
      this.row(to, p + slant + 2.2, 2, 0.7);
      const shut = p + B + v * 0.15;
      if (p > 260 && R.next() < lerp(0.22, 0.42, d) && g.hold[idx(safe)] < p) {
        // A train rolling towards you down the old lane. It is placed so
        // that it gets here about when you do.
        const vt = 7 + R.int(4), n = 2 + R.int(3);
        const eta = Math.max(0, shut - this.s) / v;
        this.train(safe, shut + vt * eta, n, vt);
        g.busy[idx(safe)] = shut + (n * CAR * v) / (v + vt) + 3;
        // Nothing else is built where it will be seen rolling through.
        g.hold[idx(safe)] = shut + (vt * AHEAD) / (v + vt) + n * CAR + 6;
      } else {
        const n = 2 + R.int(3);
        this.train(safe, shut, n);
        g.busy[idx(safe)] = shut + n * CAR;
        if (R.next() < 0.35) this.row(to, shut + 2, Math.min(6, n * 3), 0.7);
      }
      g.safe = to;
      this.safePath.push([p, to]);
    } else if (R.next() < 0.6) this.row(safe, p + 1, Math.max(3, Math.floor(B / 2.4) - 1), 0.7);

    // A power-up now and then, in the safe lane where there's room.
    g.sincePower += next - p;
    if (act === 'free' && g.sincePower > v * 15 && p > 120) {
      g.sincePower = 0;
      this.pickups.push({ id: this.nextId++, kind: R.weighted({ magnet: 3, fly: 2, boots: 2, double: 3, bubble: 2 }), lane: safe, s: p + B * 0.6, y: 1.2, taken: false });
    }

    this.fill(p, B, safe, d, v);
    g.s = next;
  }

  // Puts something (or nothing) in each lane that isn't the safe one, for
  // the stretch from p to p + B.
  fill(p, B, safe, d, v) {
    const g = this.gen, R = this.rand;
    // (The lane next to the safe one first: what goes in the far lane
    // depends on it.)
    for (const l of safe === 0 ? [-1, 1] : [0, -safe]) {
      const i = l + 1;
      // A far lane with a train beside it has no way out: no train may
      // start there until there has been a second's gap to step across.
      const boxed = Math.abs(l - safe) === 2 && g.busy[1] > p - v;
      // (A lane that has only just stopped being the safe one is left alone
      // for a moment, so there's time to get out of it.)
      if (l === g.safe || g.busy[i] > p + B * 0.2 || g.hold[i] > p) continue;
      const what = g.beats <= 1 ? 'none' : R.weighted({
        none: lerp(0.2, 0.1, d),
        low: 0.13,
        high: g.beats > 5 ? 0.12 : 0,
        train: boxed ? 0 : lerp(0.42, 0.5, d),
        ramp: g.beats > 6 ? lerp(0.1, 0.13, d) : 0,
        cart: g.beats > 8 ? 0.06 : 0,
        coins: 0.1,
      });
      const at = p + B * (0.3 + 0.4 * R.next());
      if (what === 'low' || what === 'high') this.add({ kind: what, lane: l, s0: at - 0.25, s1: at + 0.25 });
      else if (what === 'train') {
        // (Long ones: the lanes beside you are often a wall of wagons.)
        const n = 2 + R.int(d > 0.3 ? 5 : 4);
        this.train(l, at, n);
        g.busy[i] = at + n * CAR;
      } else if (what === 'ramp') {
        const n = 3 + R.int(3);
        this.add({ kind: 'ramp', lane: l, s0: at, s1: at + RAMP, h: ROOF });
        this.train(l, at + RAMP, n);
        // (With room to land at the far end.)
        g.busy[i] = at + RAMP + n * CAR + v * 0.8;
        // The roofs are worth the climb.
        this.row(l, at + RAMP + 2, Math.floor((n * CAR - 4) / 2.2), ROOF + 0.7, 2.2);
      } else if (what === 'cart') {
        this.add({ kind: 'cart', lane: l, s0: at, s1: at + CART_LEN, h: CART });
        g.busy[i] = at + CART_LEN;
        this.row(l, at + 0.6, 3, CART + 0.7, 1.6);
      } else if (what === 'coins') this.row(l, p + 1, Math.max(3, Math.floor(B / 2.4) - 1), 0.7);
    }
    this.coinList.sort((a, b) => a.s - b.s);
  }

  // A copy to try things out on (the practice player uses this). It keeps
  // what's in the way but not the coins, and lays no more line.
  clone() {
    const c = Object.create(Run.prototype);
    Object.assign(c, this);
    c.lay = false;
    c.power = { ...this.power };
    c.stats = { ...this.stats };
    c.obstacles = this.obstacles.map((o) => (o.v ? { ...o } : o));
    c.coinList = [];
    c.pickups = [];
    c.events = [];
    return c;
  }
}
