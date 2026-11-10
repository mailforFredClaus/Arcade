// Snake: the rules, as plain numbers. The screen (game.js) calls step()
// a few times a second and draws what it finds here.
//
// The snake is a list of cells, head first. Each step the head moves one
// cell the way the snake is facing; eat an apple and the tail stays where it
// is, so the snake grows by one. Run into yourself and it's over; run into
// the edge and it's over too, unless the board wraps (then you come back in
// on the other side). Turns are queued, two deep, so a quick "up, left"
// between steps isn't lost.
//
// Every fifth apple also puts a gold star on the board for a short while:
// worth more the sooner you reach it, and it doesn't make you longer.

export const COLS = 15, ROWS = 23;
export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const APPLE_POINTS = 10;
export const STAR_EVERY = 5; // apples between stars
export const STAR_STEPS = 45; // how long a star stays
export const STAR_POINTS = 50; // at most; it falls to 10 as the star's time runs out

// How fast each speed setting starts and tops out, in steps a second.
export const SPEEDS = { slow: [5, 9], normal: [7, 12], fast: [10, 15] };

// A small seeded random number generator.
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

export class Snake {
  // wrap: the edges join up. speed: 'slow', 'normal' or 'fast'.
  constructor({ cols = COLS, rows = ROWS, wrap = false, speed = 'normal', seed = 1 } = {}) {
    this.cols = cols;
    this.rows = rows;
    this.wrap = wrap;
    this.speed = speed;
    this.rand = new Rand(seed);
    // Three long, in the left half of the middle row, heading right.
    const y = Math.floor(rows / 2), x = Math.max(2, Math.floor(cols / 3));
    this.body = [y * cols + x, y * cols + x - 1, y * cols + x - 2];
    this.on = new Uint8Array(cols * rows); // 1 where the snake is
    for (const c of this.body) this.on[c] = 1;
    this.dir = 'right';
    this.queue = []; // turns waiting for their step
    this.dropped = -1; // the cell the tail left on the last step (-1 if it grew)
    this.score = 0;
    this.apples = 0;
    this.steps = 0;
    this.dead = false;
    this.won = false;
    this.star = -1; // the cell a gold star is on
    this.starLeft = 0; // steps before it goes
    this.apple = -1;
    this.placeApple();
  }

  get head() { return this.body[0]; }
  get length() { return this.body.length; }

  // Steps a second right now: it creeps up as the apples go down.
  rate() {
    const [from, to] = SPEEDS[this.speed] || SPEEDS.normal;
    return Math.min(to, from + Math.floor(this.apples / 4) * 0.5);
  }

  // Ask to turn. A turn straight back on yourself, or the way you're
  // already going, is ignored. Returns whether it was taken.
  turn(dir) {
    if (!DIRS[dir] || this.dead || this.won) return false;
    const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (dir === last || dir === OPPOSITE[last] || this.queue.length >= 2) return false;
    this.queue.push(dir);
    return true;
  }

  // The cell next to c in a direction: -1 off the edge of a walled board.
  next(c, dir) {
    const [dx, dy] = DIRS[dir];
    let x = (c % this.cols) + dx, y = Math.floor(c / this.cols) + dy;
    if (this.wrap) {
      x = (x + this.cols) % this.cols;
      y = (y + this.rows) % this.rows;
    } else if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return -1;
    return y * this.cols + x;
  }

  free() {
    const out = [];
    for (let c = 0; c < this.on.length; c++) if (!this.on[c] && c !== this.apple && c !== this.star) out.push(c);
    return out;
  }

  placeApple() {
    const free = this.free();
    this.apple = free.length ? free[this.rand.int(free.length)] : -1;
  }

  // Moves the snake one cell. Returns what happened:
  // { ate, star (points, if a star was taken), starGone, dead, won }.
  step() {
    const out = { ate: false, star: 0, starGone: false, dead: false, won: false };
    if (this.dead || this.won) return out;
    if (this.queue.length) this.dir = this.queue.shift();
    this.steps++;
    const to = this.next(this.head, this.dir);
    const grow = to === this.apple;
    // The tail moves out of the way first, so chasing it is safe.
    const tail = this.body[this.body.length - 1];
    if (to < 0 || (this.on[to] && !(to === tail && !grow))) {
      this.dead = out.dead = true;
      this.dropped = -1;
      return out;
    }
    if (grow) this.dropped = -1;
    else {
      this.body.pop();
      this.on[tail] = 0;
      this.dropped = tail;
    }
    this.body.unshift(to);
    this.on[to] = 1;
    if (grow) {
      out.ate = true;
      this.apples++;
      this.score += APPLE_POINTS;
      this.placeApple();
      if (this.apple < 0 && this.star < 0) {
        // Nowhere left to put an apple: the board is full.
        this.won = out.won = true;
        return out;
      }
      if (this.apples % STAR_EVERY === 0 && this.star < 0) {
        const free = this.free();
        if (free.length) {
          this.star = free[this.rand.int(free.length)];
          this.starLeft = STAR_STEPS;
        }
      }
    } else if (to === this.star) {
      out.star = this.starWorth();
      this.score += out.star;
      this.star = -1;
      this.starLeft = 0;
      if (this.apple < 0) this.placeApple();
    } else if (this.star >= 0 && --this.starLeft <= 0) {
      this.star = -1;
      out.starGone = true;
      if (this.apple < 0) this.placeApple();
    }
    return out;
  }

  // What the star is worth just now: 50 down to 10.
  starWorth() {
    return Math.max(10, 10 * Math.ceil((STAR_POINTS / 10) * (this.starLeft / STAR_STEPS)));
  }
}
