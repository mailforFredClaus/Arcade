// Prism Break: the rules and the physics, as plain numbers. The screen
// (game.js) steps this 120 times a second and draws what it finds here.
//
// The field is 121 wide and 232 tall. Bricks sit on a grid 11 across, each
// 11 x 5.5; the paddle slides along near the bottom. A ball that gets past
// it is lost; lose them all and a life goes. Clear every brick that can be
// broken to finish the level.
//
// Bricks: plain ones break in one hit, tough ones in two, armoured ones in
// three. Steel never breaks (and doesn't have to). A bomb takes its
// neighbours with it. A gift always drops a power-up. A hidden brick can't
// be seen until it's first hit.
//
// Power-ups fall as capsules, to be caught on the paddle:
//   multi   every ball becomes three        wide    a longer paddle
//   laser   the paddle shoots               fire    balls burn straight through
//   slow    slower balls                    shield  a floor that saves one ball
//   life    one more life
// and two to dodge:  shrink (a shorter paddle)  and  fast (faster balls).
//
// Where a ball hits the paddle decides which way it goes: the middle sends
// it straight up, the ends send it out to the side. Bricks broken in a row
// without touching the paddle build a combo that's worth more and more.

export const W = 121, H = 232;
export const COLS = 11, ROWS = 17, BW = 11, BH = 5.5, TOP = 22;
export const PADDLE_Y = 210, PADDLE_H = 3.6, PADDLE_W = 23;
export const BALL_R = 1.75;
export const STEP = 1 / 120;
export const SHIELD_Y = 223;
const MAX_BALLS = 24;
const SPREAD = 62 * Math.PI / 180; // how far off straight up the ends of the paddle send the ball
const MIN_RISE = 0.24; // a ball always keeps at least this share of its speed going up or down

export const GOOD = ['multi', 'wide', 'laser', 'fire', 'slow', 'shield', 'life'];
export const BAD = ['shrink', 'fast'];
export const POWER_TIME = { wide: 18, laser: 9, fire: 7, slow: 9, shrink: 13, fast: 9 };

// What the letters in a level's map mean (see levels.js).
//   r o y g t b p k w   plain bricks: red orange yellow green teal blue purple pink white
//   R O Y G T B P K W   tough (two hits)
//   @  armoured (three hits)    #  steel    *  bomb    ?  gift    ~  hidden    .  nothing
const COLOURS = 'roygtbpkw';

export class Rand {
  constructor(seed) { this.s = seed >>> 0; }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n) { return Math.floor(this.next() * n); }
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Game {
  // level: { n, map: [rows of 11 letters], speed, bad: whether shrink and fast can drop }
  constructor(level, { seed = 1, lives = 3 } = {}) {
    this.level = level;
    this.rand = new Rand(seed);
    this.t = 0;
    this.lives = lives;
    this.lost = 0; // lives lost this level
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.state = 'serve'; // serve, play, wait (a life just went), clear, over
    this.wait = 0;
    this.events = [];
    this.base = level.speed || 90;
    this.ramp = 1;
    this.sinceBrick = 0;
    this.power = { wide: 0, laser: 0, fire: 0, slow: 0, shrink: 0, fast: 0 };
    this.shield = false;
    this.shotT = 0;
    this.paddle = { x: W / 2, w: PADDLE_W, v: 0 };
    this.balls = [];
    this.caps = [];
    this.shots = [];
    this.booms = []; // explosions waiting to go off: { at, cells }
    this.nextId = 1;
    // The bricks, and which one (if any) is in each cell of the grid.
    this.bricks = [];
    this.cell = new Int16Array(COLS * ROWS).fill(-1);
    this.left = 0; // bricks still to break
    level.map.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === '.' || ch === ' ' || r >= ROWS || c >= COLS) return;
        const low = ch.toLowerCase();
        let type = 'plain', hp = 1, colour = COLOURS.indexOf(low);
        if (ch === '#') { type = 'steel'; hp = 99; colour = -1; }
        else if (ch === '*') { type = 'bomb'; colour = -1; }
        else if (ch === '?') { type = 'gift'; colour = -1; }
        else if (ch === '@') { type = 'armour'; hp = 3; colour = -1; }
        else if (ch === '~') { type = 'hidden'; colour = 8; }
        else if (colour < 0) return;
        else if (ch !== low) { type = 'tough'; hp = 2; }
        const b = { i: this.bricks.length, c, r, x: c * BW, y: TOP + r * BH, type, hp, max: hp, colour, alive: true, seen: type !== 'hidden', flash: 0 };
        this.cell[r * COLS + c] = b.i;
        this.bricks.push(b);
        if (type !== 'steel') this.left++;
      });
    });
    this.total = this.left;
    this.serve();
  }

  emit(e, data) { this.events.push(data ? { e, ...data } : { e }); }

  get speed() { return this.base * this.ramp * (this.power.slow > 0 ? 0.7 : this.power.fast > 0 ? 1.32 : 1); }

  // A new ball, sitting on the paddle.
  serve() {
    this.balls = [{ id: this.nextId++, x: this.paddle.x, y: PADDLE_Y - BALL_R, dx: 0, dy: -1, stuck: true, off: 0 }];
    this.state = 'serve';
    this.combo = 0;
  }

  // Which way a served ball sets off: up, leaning in towards the middle
  // of the field, the more so the further out the paddle is. (So where you
  // serve from is how you aim.) Radians from straight up.
  serveAngle() {
    const k = clamp((W / 2 - this.paddle.x) / (W / 2 - PADDLE_W / 2), -1, 1);
    const a = k * 0.6;
    return Math.abs(a) < 0.1 ? (a < 0 ? -0.1 : 0.1) : a;
  }

  // Send the ball on its way.
  launch() {
    if (this.state !== 'serve') return;
    const a = this.serveAngle();
    for (const b of this.balls) {
      if (!b.stuck) continue;
      b.stuck = false;
      b.dx = Math.sin(a);
      b.dy = -Math.cos(a);
    }
    this.state = 'play';
    this.sinceBrick = 0;
    this.emit('launch');
  }

  // ---- one step -----------------------------------------------------------------------

  // input: { x: where the paddle should be (or null to leave it), launch: true to serve }
  step(input = {}) {
    const dt = STEP;
    this.t += dt;
    for (const b of this.bricks) if (b.flash > 0) b.flash -= dt;
    if (this.state === 'clear' || this.state === 'over') return;
    // The paddle goes where it's told.
    const p = this.paddle;
    const want = this.power.wide > 0 ? PADDLE_W * 1.5 : this.power.shrink > 0 ? PADDLE_W * 0.64 : PADDLE_W;
    p.w += (want - p.w) * Math.min(1, dt * 14);
    if (input.x !== null && input.x !== undefined) {
      const nx = clamp(input.x, p.w / 2, W - p.w / 2);
      p.v = (nx - p.x) / dt;
      p.x = nx;
    } else p.v = 0;
    p.x = clamp(p.x, p.w / 2, W - p.w / 2);

    if (this.state === 'wait') {
      this.wait -= dt;
      if (this.wait <= 0) this.serve();
      return;
    }
    if (this.state === 'serve') {
      for (const b of this.balls) { b.x = p.x + b.off; b.y = PADDLE_Y - BALL_R; }
      if (input.launch) this.launch();
      return;
    }

    // Playing.
    this.sinceBrick += dt;
    this.ramp = Math.min(1.6, this.ramp + dt * 0.004);
    for (const k in this.power) {
      if (this.power[k] <= 0) continue;
      this.power[k] -= dt;
      if (this.power[k] <= 0) { this.power[k] = 0; this.emit('powerEnd', { kind: k }); }
    }

    // Balls, in steps short enough that one can never skip over a brick.
    const v = this.speed;
    const n = Math.max(1, Math.ceil((v * dt) / 0.7));
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      for (let k = 0; k < n; k++) {
        if (!this.moveBall(b, (v * dt) / n)) { this.balls.splice(i, 1); break; }
      }
    }

    // Lasers.
    if (this.power.laser > 0) {
      this.shotT -= dt;
      if (this.shotT <= 0) {
        this.shotT = 0.3;
        for (const sx of [-1, 1]) this.shots.push({ x: p.x + sx * (p.w / 2 - 2), y: PADDLE_Y - 2 });
        this.emit('shot');
      }
    }
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.y -= 270 * dt;
      const hit = this.brickAt(s.x, s.y);
      if (hit) { this.damage(hit, 'laser'); this.shots.splice(i, 1); } else if (s.y < 0) this.shots.splice(i, 1);
    }

    // Capsules.
    for (let i = this.caps.length - 1; i >= 0; i--) {
      const c = this.caps[i];
      c.y += 44 * dt;
      if (c.y + 2.6 >= PADDLE_Y && c.y - 2.6 <= PADDLE_Y + PADDLE_H && Math.abs(c.x - p.x) <= p.w / 2 + 5) {
        this.caps.splice(i, 1);
        this.give(c.kind);
      } else if (c.y > H + 6) this.caps.splice(i, 1);
    }

    // Explosions due.
    for (let i = this.booms.length - 1; i >= 0; i--) {
      const bm = this.booms[i];
      if (bm.at > this.t) continue;
      this.booms.splice(i, 1);
      for (const j of bm.cells) {
        const b = this.bricks[j];
        if (b.alive && b.type !== 'steel') this.destroy(b, 'boom');
      }
    }

    if (this.left <= 0 && !this.booms.length) {
      this.state = 'clear';
      this.score += this.lives * 500 + Math.max(0, 3000 - Math.floor(this.t) * 12);
      this.emit('clear');
      return;
    }
    if (!this.balls.length) this.loseLife();
  }

  loseLife() {
    this.lives--;
    this.lost++;
    this.caps.length = 0;
    this.shots.length = 0;
    for (const k in this.power) this.power[k] = 0;
    this.shield = false;
    this.ramp = Math.max(1, this.ramp - 0.15);
    this.combo = 0;
    this.emit('life');
    if (this.lives <= 0) {
      this.state = 'over';
      this.emit('over');
    } else {
      this.state = 'wait';
      this.wait = 0.9;
    }
  }

  // Moves a ball `d` along its way and deals with whatever it meets.
  // False if it has gone off the bottom.
  moveBall(b, d) {
    const p = this.paddle, R = BALL_R;
    b.x += b.dx * d;
    b.y += b.dy * d;
    let bounced = false;
    if (b.x < R) { b.x = R; b.dx = Math.abs(b.dx); bounced = true; } else if (b.x > W - R) { b.x = W - R; b.dx = -Math.abs(b.dx); bounced = true; }
    if (b.y < R) { b.y = R; b.dy = Math.abs(b.dy); bounced = true; }
    if (bounced) {
      this.emit('wall', { x: b.x, y: b.y });
      // A ball that has gone a long while without finding a brick is nudged
      // off whatever loop it's stuck in.
      if (this.sinceBrick > 7) this.turn(b, (this.rand.next() - 0.5) * 0.3);
    }
    // The paddle.
    if (b.dy > 0 && b.y + R >= PADDLE_Y && b.y <= PADDLE_Y + PADDLE_H * 0.6 && Math.abs(b.x - p.x) <= p.w / 2 + R) {
      const off = clamp((b.x - p.x) / (p.w / 2), -1, 1);
      let a = off * SPREAD;
      // With only a few bricks left and no luck finding them, the paddle
      // helps: it leans the ball towards one.
      if (this.left <= 5 && this.sinceBrick > 5) {
        const t = this.bricks.find((q) => q.alive && q.type !== 'steel' && this.clearTo(b.x, q));
        if (t) {
          const aim = Math.atan2(t.x + BW / 2 - b.x, PADDLE_Y - (t.y + BH / 2));
          a = clamp(a + (aim - a) * 0.6, -SPREAD, SPREAD);
        }
      }
      b.dx = Math.sin(a);
      b.dy = -Math.cos(a);
      b.y = PADDLE_Y - R;
      this.combo = 0;
      this.ramp = Math.min(1.6, this.ramp + 0.011);
      this.emit('paddle', { x: b.x, off });
      return true;
    }
    // The shield, or the bottom.
    if (this.shield && b.dy > 0 && b.y + R >= SHIELD_Y) {
      b.y = SHIELD_Y - R;
      b.dy = -Math.abs(b.dy);
      this.shield = false;
      this.emit('shield', { x: b.x });
      return true;
    }
    if (b.y - R > H) {
      this.emit('drop', { x: b.x });
      return false;
    }
    // Bricks: the one the ball is deepest into.
    const c0 = Math.max(0, Math.floor((b.x - R) / BW)), c1 = Math.min(COLS - 1, Math.floor((b.x + R) / BW));
    const r0 = Math.max(0, Math.floor((b.y - R - TOP) / BH)), r1 = Math.min(ROWS - 1, Math.floor((b.y + R - TOP) / BH));
    let hit = null, deep = 0, hx = 0, hy = 0;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const j = this.cell[r * COLS + c];
        if (j < 0) continue;
        const q = this.bricks[j];
        const px = clamp(b.x, q.x, q.x + BW), py = clamp(b.y, q.y, q.y + BH);
        const ex = b.x - px, ey = b.y - py, dist = Math.sqrt(ex * ex + ey * ey);
        if (dist >= R) continue;
        if (R - dist > deep) { deep = R - dist; hit = q; hx = ex; hy = ey; }
      }
    }
    if (!hit) return true;
    const burning = this.power.fire > 0 && hit.type !== 'steel';
    if (!burning) {
      // Bounce off the face (or the corner) that was hit.
      let nx = hx, ny = hy;
      const len = Math.sqrt(nx * nx + ny * ny);
      if (len < 1e-6) {
        // Right inside: back out the way it came.
        nx = -b.dx; ny = -b.dy;
      } else { nx /= len; ny /= len; }
      const dot = b.dx * nx + b.dy * ny;
      if (dot < 0) {
        b.dx -= 2 * dot * nx;
        b.dy -= 2 * dot * ny;
      }
      b.x += nx * deep;
      b.y += ny * deep;
      this.steady(b);
    }
    this.damage(hit, 'ball');
    return true;
  }

  // Turns a ball by an angle.
  turn(b, a) {
    const c = Math.cos(a), s = Math.sin(a), x = b.dx * c - b.dy * s, y = b.dx * s + b.dy * c;
    b.dx = x; b.dy = y;
    this.steady(b);
  }

  // Keeps a ball from going too nearly sideways (which takes for ever).
  steady(b) {
    const len = Math.sqrt(b.dx * b.dx + b.dy * b.dy) || 1;
    b.dx /= len; b.dy /= len;
    if (Math.abs(b.dy) < MIN_RISE) {
      b.dy = (b.dy < 0 ? -1 : 1) * MIN_RISE;
      b.dx = (b.dx < 0 ? -1 : 1) * Math.sqrt(1 - MIN_RISE * MIN_RISE);
    }
  }

  // Is there a straight way from the paddle at x up to brick q, with
  // nothing else in between?
  clearTo(x, q) {
    const tx = q.x + BW / 2, ty = q.y + BH / 2, y0 = PADDLE_Y - BALL_R;
    const n = Math.ceil(Math.hypot(tx - x, ty - y0) / 2);
    for (let k = 1; k < n; k++) {
      const hit = this.brickAt(x + ((tx - x) * k) / n, y0 + ((ty - y0) * k) / n);
      if (hit && hit !== q) return false;
    }
    return true;
  }

  brickAt(x, y) {
    const c = Math.floor(x / BW), r = Math.floor((y - TOP) / BH);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
    const j = this.cell[r * COLS + c];
    return j < 0 ? null : this.bricks[j];
  }

  // ---- bricks -------------------------------------------------------------------------

  damage(b, how) {
    if (!b.alive) return;
    if (b.type === 'steel') {
      b.flash = 0.12;
      this.emit('steel', { x: b.x + BW / 2, y: b.y + BH / 2 });
      return;
    }
    this.sinceBrick = 0;
    if (!b.seen) {
      // A hidden brick shows itself; it takes another hit to break.
      b.seen = true;
      b.flash = 0.2;
      this.emit('reveal', { i: b.i });
      return;
    }
    b.hp -= how === 'ball' && this.power.fire > 0 ? 9 : 1;
    if (b.hp > 0) {
      b.flash = 0.12;
      this.emit('hit', { i: b.i, x: b.x + BW / 2, y: b.y + BH / 2 });
      return;
    }
    this.destroy(b, how);
  }

  destroy(b, how) {
    if (!b.alive) return;
    b.alive = false;
    this.cell[b.r * COLS + b.c] = -1;
    this.left--;
    this.sinceBrick = 0;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const points = (10 + 5 * Math.min(this.combo - 1, 30)) * b.max;
    this.score += points;
    this.emit('break', { i: b.i, x: b.x + BW / 2, y: b.y + BH / 2, colour: b.colour, type: b.type, points, combo: this.combo, how });
    if (b.type === 'bomb') {
      const cells = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const r = b.r + dr, c = b.c + dc;
        if ((dr || dc) && r >= 0 && r < ROWS && c >= 0 && c < COLS && this.cell[r * COLS + c] >= 0) cells.push(this.cell[r * COLS + c]);
      }
      this.booms.push({ at: this.t + 0.07, cells });
      this.emit('boom', { x: b.x + BW / 2, y: b.y + BH / 2 });
    }
    // Something to catch?
    if (this.left <= 0) return;
    let kind = null;
    if (b.type === 'gift') kind = this.pick(true);
    else if (this.caps.length < 3 && this.rand.next() < (this.level.drops ?? 0.12)) kind = this.pick(false);
    if (kind) {
      this.caps.push({ id: this.nextId++, x: b.x + BW / 2, y: b.y + BH / 2, kind });
      this.emit('cap', { kind });
    }
  }

  // Which power-up drops. onlyGood: nothing to dodge.
  pick(onlyGood) {
    const table = { multi: 16, wide: 13, laser: 10, fire: 8, slow: 7, shield: 10, life: this.lives < 5 ? 2 : 0 };
    if (!onlyGood && this.level.bad !== false) { table.shrink = 7; table.fast = 6; }
    // (Not a second shield while one is up, nor more balls than is sensible.)
    if (this.shield) table.shield = 0;
    if (this.balls.length > 8) table.multi = 0;
    let total = 0;
    for (const k in table) total += table[k];
    let x = this.rand.next() * total;
    for (const k in table) {
      x -= table[k];
      if (x <= 0) return k;
    }
    return 'multi';
  }

  give(kind) {
    this.score += 50;
    this.emit('power', { kind });
    if (kind === 'multi') {
      const now = this.balls.slice();
      for (const b of now) {
        for (const a of [-0.42, 0.42]) {
          if (this.balls.length >= MAX_BALLS) break;
          const nb = { id: this.nextId++, x: b.x, y: b.y, dx: b.dx, dy: b.dy, stuck: false, off: 0 };
          this.turn(nb, a);
          this.balls.push(nb);
        }
      }
    } else if (kind === 'shield') this.shield = true;
    else if (kind === 'life') this.lives = Math.min(5, this.lives + 1);
    else {
      this.power[kind] = POWER_TIME[kind];
      if (kind === 'wide') this.power.shrink = 0;
      if (kind === 'shrink') this.power.wide = 0;
      if (kind === 'slow') this.power.fast = 0;
      if (kind === 'fast') this.power.slow = 0;
      if (kind === 'laser') this.shotT = 0;
    }
  }

  // Stars for a finished level: three for losing no lives, two for one.
  stars() {
    return this.lost === 0 ? 3 : this.lost === 1 ? 2 : 1;
  }
}
