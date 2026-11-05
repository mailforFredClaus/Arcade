// Gem Swap: the rules.
//
// The board is a grid of cells; holes in the grid give it a shape. A cell
// holds a gem (one of up to six colours, perhaps a power-up), a crate or a
// coin, and can have ice frozen under it. Gems can be bound by chains.
//
// Swap two neighbouring gems to make a line of three or more of a colour.
// Bigger matches leave a power-up behind:
//   4 in a line      a line blaster, which clears a row or a column
//   L or T shape     a bomb, which clears the area around it
//   2x2 square       a butterfly, which clears its neighbours, then flies off
//                    to hit something that helps with a goal
//   5 in a line      a prism, which clears every gem of one colour
// Swapping a power-up with anything sets it off; swapping two power-ups
// together sets off a bigger combo; tapping one sets it off where it is.
//
// After each clear, gems fall into the gaps (sliding sideways round crates
// and chains when nothing can fall straight in), new gems drop in at the top
// and any new lines clear too.
//
// play() changes the board and returns the steps, with timings, for the
// screen to animate. Everything follows from the seed, so a game can be saved
// as its list of moves and replayed exactly. (Only plain arithmetic and
// square roots are used, never Math.hypot, exp or the like: browsers round
// those differently, and the same level must come out the same everywhere.)

export const NONE = 0, LINE_H = 1, LINE_V = 2, BOMB = 3, FLY = 4, PRISM = 5;
export const EMPTY = 0, GEM = 1, CRATE = 2, COIN = 3;
export const isLine = (p) => p === LINE_H || p === LINE_V;

// Timings (ms) used to order everything that happens in a clear.
export const T = {
  line: 34, // a line blast travels one cell in this time
  bomb: 55, // a bomb's blast spreads one ring in this time
  fuse: 110, // a power-up hit by a blast goes off this long after
  gather: 150, // matched gems slide into a new power-up
  zap: 38, // between a prism's zaps
  launch: 90, // a butterfly takes off this long after it hatches
};

// A small seeded random number generator whose state can be copied.
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

export function mix(...xs) {
  let h = 0x9e3779b9;
  for (const x of xs) {
    h = Math.imul(h ^ (x | 0), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return h >>> 0;
}

// Goal types: collect gems of a colour, break crates, free chained gems,
// break ice tiles, or bring coins down to the bottom.
export const GOALS = ['color', 'crate', 'chain', 'ice', 'coin'];

export class Board {
  // level: { w, h, on[], crate[], chain[], ice[], coin[], colors[], goals[], moves, coinMax }
  constructor(level, seed, fill = true) {
    if (!level) return; // an empty shell for clone()
    const w = (this.w = level.w), h = (this.h = level.h), N = (this.N = w * h);
    this.on = Uint8Array.from(level.on);
    this.kind = new Uint8Array(N);
    this.color = new Int8Array(N).fill(-1);
    this.power = new Uint8Array(N);
    this.hp = new Uint8Array(N); // layers left on a crate
    this.chain = new Uint8Array(N); // 1 if the gem is chained
    this.ice = new Uint8Array(N); // layers of ice under the cell
    this.exit = new Uint8Array(N); // coins leave from here
    this.id = new Int32Array(N); // so the screen can follow each piece around
    this.nextId = 1;
    this.rand = new Rand(seed);
    this.palette = level.colors.slice();
    this.goals = level.goals.map((g) => ({ type: g.type, color: g.color ?? -1, need: g.need, got: 0 }));
    this.moves = level.moves;
    this.coinMax = level.coinMax || 0;
    this.coins = 0; // on the board right now
    this.quiet = false; // true: skip what only the screen needs
    // Each cell's neighbours up and down its column (skipping holes).
    this.up = new Int16Array(N).fill(-1);
    this.down = new Int16Array(N).fill(-1);
    for (let c = 0; c < w; c++) {
      let prev = -1;
      for (let r = 0; r < h; r++) {
        const i = r * w + c;
        if (!this.on[i]) continue;
        this.up[i] = prev;
        if (prev >= 0) this.down[prev] = i;
        prev = i;
      }
      if (prev >= 0) this.exit[prev] = 1;
    }
    for (let i = 0; i < N; i++) {
      if (!this.on[i]) continue;
      this.ice[i] = level.ice ? level.ice[i] : 0;
      if (level.crate && level.crate[i]) {
        this.kind[i] = CRATE;
        this.hp[i] = level.crate[i];
      } else if (level.coin && level.coin[i]) {
        this.kind[i] = COIN;
        this.id[i] = this.nextId++;
        this.coins++;
      } else {
        this.kind[i] = GEM;
        this.chain[i] = level.chain && level.chain[i] ? 1 : 0;
      }
    }
    if (fill) this.fill(level.gems);
  }

  clone() {
    const b = new Board(null);
    for (const k of ['w', 'h', 'N', 'nextId', 'moves', 'coinMax', 'coins', 'quiet', 'up', 'down', 'exit', 'on']) b[k] = this[k];
    for (const k of ['kind', 'color', 'power', 'hp', 'chain', 'ice', 'id']) b[k] = this[k].slice();
    b.rand = new Rand(this.rand.s);
    b.palette = this.palette;
    b.goals = this.goals.map((g) => ({ ...g }));
    return b;
  }

  idx(r, c) {
    if (r < 0 || c < 0 || r >= this.h || c >= this.w) return -1;
    const i = r * this.w + c;
    return this.on[i] ? i : -1;
  }

  // Gems that can take part in a line (a prism has no colour).
  matchable(i) { return this.kind[i] === GEM && this.color[i] >= 0; }
  swappable(i) { return i >= 0 && this.kind[i] === GEM && !this.chain[i]; }
  movable(i) { return (this.kind[i] === GEM && !this.chain[i]) || this.kind[i] === COIN; }

  won() { return this.goals.every((g) => g.got >= g.need); }

  // ---- filling the board ----------------------------------------------------

  // Colours for every gem with no lines or squares already made, and at
  // least one move to make. preset: colours fixed by the level (-1 = any).
  fill(preset) {
    const cells = [];
    for (let i = 0; i < this.N; i++) if (this.kind[i] === GEM) cells.push(i);
    for (let tries = 0; tries < 60; tries++) {
      for (const i of cells) this.color[i] = -1;
      for (const i of cells) {
        if (preset && preset[i] >= 0) { this.color[i] = preset[i]; continue; }
        const ok = this.palette.filter((c) => !this.wouldMatch(i, c));
        const from = ok.length ? ok : this.palette;
        this.color[i] = from[this.rand.int(from.length)];
      }
      if (preset || (!this.findGroups().length && this.hasMove())) break;
    }
    for (const i of cells) {
      this.power[i] = NONE;
      this.id[i] = this.nextId++;
    }
  }

  // Would colour c at cell i finish a line of three or a square?
  wouldMatch(i, c) {
    const { w } = this, r = (i / w) | 0, col = i % w;
    const same = (rr, cc) => {
      const j = this.idx(rr, cc);
      return j >= 0 && j !== i && this.matchable(j) && this.color[j] === c;
    };
    let n = 1;
    for (let k = 1; same(r, col - k); k++) n++;
    for (let k = 1; same(r, col + k); k++) n++;
    if (n >= 3) return true;
    n = 1;
    for (let k = 1; same(r - k, col); k++) n++;
    for (let k = 1; same(r + k, col); k++) n++;
    if (n >= 3) return true;
    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      if (same(r + dr, col) && same(r, col + dc) && same(r + dr, col + dc)) return true;
    }
    return false;
  }

  // ---- finding matches ------------------------------------------------------------

  // Every match on the board: lines of 3 or more and 2x2 squares of a colour,
  // joined into groups where they share gems. Each group says which
  // power-up (if any) it makes.
  findGroups() {
    const { w, h, N } = this;
    const col = (i) => (i >= 0 && this.matchable(i) ? this.color[i] : -2);
    const runs = [], squares = [];
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w;) {
        const k = col(this.idx(r, c));
        let e = c + 1;
        if (k >= 0) while (e < w && col(this.idx(r, e)) === k) e++;
        if (k >= 0 && e - c >= 3) {
          const cells = [];
          for (let x = c; x < e; x++) cells.push(r * w + x);
          runs.push({ horiz: true, cells });
        }
        c = e;
      }
    }
    for (let c = 0; c < w; c++) {
      for (let r = 0; r < h;) {
        const k = col(this.idx(r, c));
        let e = r + 1;
        if (k >= 0) while (e < h && col(this.idx(e, c)) === k) e++;
        if (k >= 0 && e - r >= 3) {
          const cells = [];
          for (let y = r; y < e; y++) cells.push(y * w + c);
          runs.push({ horiz: false, cells });
        }
        r = e;
      }
    }
    for (let r = 0; r + 1 < h; r++) {
      for (let c = 0; c + 1 < w; c++) {
        const k = col(this.idx(r, c));
        if (k >= 0 && col(this.idx(r, c + 1)) === k && col(this.idx(r + 1, c)) === k && col(this.idx(r + 1, c + 1)) === k) {
          const i = r * w + c;
          squares.push([i, i + 1, i + w, i + w + 1]);
        }
      }
    }
    if (!runs.length && !squares.length) return [];
    const parent = new Int16Array(N).fill(-1);
    const find = (x) => {
      while (parent[x] !== x) x = parent[x] = parent[parent[x]];
      return x;
    };
    const join = (list) => {
      for (const x of list) if (parent[x] < 0) parent[x] = x;
      for (let k = 1; k < list.length; k++) {
        const a = find(list[0]), b = find(list[k]);
        if (a !== b) parent[b] = a;
      }
    };
    for (const run of runs) join(run.cells);
    for (const sq of squares) join(sq);
    const groups = new Map();
    const groupOf = (x) => {
      const root = find(x);
      if (!groups.has(root)) groups.set(root, { cells: new Set(), runs: [], squares: [], color: this.color[x] });
      return groups.get(root);
    };
    for (const run of runs) {
      const g = groupOf(run.cells[0]);
      g.runs.push(run);
      run.cells.forEach((x) => g.cells.add(x));
    }
    for (const sq of squares) {
      const g = groupOf(sq[0]);
      g.squares.push(sq);
      sq.forEach((x) => g.cells.add(x));
    }
    const out = [];
    for (const g of groups.values()) {
      const longest = g.runs.reduce((m, run) => Math.max(m, run.cells.length), 0);
      const hasH = g.runs.some((run) => run.horiz), hasV = g.runs.some((run) => !run.horiz);
      let power = NONE, cross = -1;
      if (longest >= 5) power = PRISM;
      else if (hasH && hasV) {
        power = BOMB;
        // Where the lines cross.
        const hc = new Set(g.runs.filter((run) => run.horiz).flatMap((run) => run.cells));
        cross = g.runs.filter((run) => !run.horiz).flatMap((run) => run.cells).find((x) => hc.has(x)) ?? -1;
      } else if (longest === 4) power = g.runs.find((run) => run.cells.length === 4).horiz ? LINE_V : LINE_H;
      else if (g.squares.length) power = FLY;
      out.push({ cells: [...g.cells], color: g.color, power, cross, runs: g.runs });
    }
    return out;
  }

  // Does swapping a and b make a match?
  swapMatches(a, b) {
    const ca = this.color[a], cb = this.color[b];
    if (ca === cb) return false;
    this.color[a] = cb;
    this.color[b] = ca;
    const hit = this.matchAt(a) || this.matchAt(b);
    this.color[a] = ca;
    this.color[b] = cb;
    return hit;
  }

  matchAt(i) {
    if (!this.matchable(i)) return false;
    const c = this.color[i], w = this.w, r = (i / w) | 0, col = i % w;
    const same = (rr, cc) => {
      const j = this.idx(rr, cc);
      return j >= 0 && this.matchable(j) && this.color[j] === c;
    };
    let n = 1;
    for (let k = 1; same(r, col - k); k++) n++;
    for (let k = 1; same(r, col + k); k++) n++;
    if (n >= 3) return true;
    n = 1;
    for (let k = 1; same(r - k, col); k++) n++;
    for (let k = 1; same(r + k, col); k++) n++;
    if (n >= 3) return true;
    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      if (same(r + dr, col) && same(r, col + dc) && same(r + dr, col + dc)) return true;
    }
    return false;
  }

  canSwap(a, b) {
    if (!this.swappable(a) || !this.swappable(b)) return false;
    const w = this.w;
    const near = Math.abs(a - b) === w || (Math.abs(a - b) === 1 && ((a / w) | 0) === ((b / w) | 0));
    if (!near) return false;
    return !!(this.power[a] || this.power[b] || this.swapMatches(a, b));
  }

  // Every move worth making: swaps that match or set off a power-up, and
  // taps on power-ups.
  listMoves() {
    const out = [];
    const { w, N } = this;
    for (let i = 0; i < N; i++) {
      if (!this.swappable(i)) continue;
      if (this.power[i]) out.push({ type: 'tap', i });
      const c = i % w;
      for (const j of [c + 1 < w ? i + 1 : -1, i + w < N ? i + w : -1]) {
        if (j >= 0 && this.swappable(j) && (this.power[i] || this.power[j] || this.swapMatches(i, j))) out.push({ type: 'swap', a: i, b: j });
      }
    }
    return out;
  }

  hasMove() {
    const { w, N } = this;
    for (let i = 0; i < N; i++) {
      if (!this.swappable(i)) continue;
      if (this.power[i]) return true;
      const c = i % w;
      if (c + 1 < w && this.swappable(i + 1) && (this.power[i + 1] || this.swapMatches(i, i + 1))) return true;
      if (i + w < N && this.swappable(i + w) && (this.power[i + w] || this.swapMatches(i, i + w))) return true;
    }
    return false;
  }

  // ---- making a move -----------------------------------------------------------------

  // m: { type: 'swap', a, b } | { type: 'tap', i } | { type: 'hammer', i }
  //    | { type: 'row', i } | { type: 'shuffle' } | { type: 'extra' }
  //    | { type: 'start', powers: [...] } (power-ups to begin with)
  // first: stop after the first clear (the practice player uses this to
  // judge a move without peeking at what drops in next).
  play(m, first = false) {
    const steps = [];
    this.made = [];
    this.fired = 0;
    if (m.type === 'swap') {
      const { a, b } = m;
      if (!this.canSwap(a, b)) return [{ t: 'swap', a, b, ok: false }];
      this.moves--;
      const pa = this.power[a], pb = this.power[b];
      this.swapCells(a, b);
      steps.push({ t: 'swap', a, b, ok: true });
      // The piece that was at a is now at b, and the other way round.
      let ev;
      if (pa && pb) ev = this.phase([], [], [], (ctx) => this.combo(b, a, ctx));
      else if (pa === PRISM || pb === PRISM) {
        const at = pa === PRISM ? b : a, other = pa === PRISM ? a : b;
        ev = this.phase([], [{ i: at, with: this.color[other] }], []);
      } else if (pa || pb) ev = this.phase(this.findGroups(), [{ i: pa ? b : a }], [pa ? a : b]);
      else ev = this.phase(this.findGroups(), [], [b, a]);
      steps.push(this.clearStep(ev, 0));
    } else if (m.type === 'tap') {
      if (!this.swappable(m.i) || !this.power[m.i]) return [];
      this.moves--;
      steps.push(this.clearStep(this.phase([], [{ i: m.i }], []), 0));
    } else if (m.type === 'hammer') {
      if (m.i < 0 || !this.on[m.i] || this.kind[m.i] === COIN) return [];
      steps.push(this.clearStep(this.phase([], [], [], (ctx) => {
        ctx.ev.push({ at: 0, e: 'hammer', i: m.i });
        ctx.push({ at: 120, act: 'hit', i: m.i, s: ++ctx.src });
      }), 0));
    } else if (m.type === 'row') {
      if (m.i < 0 || !this.on[m.i]) return [];
      const r = (m.i / this.w) | 0, c = m.i % this.w;
      steps.push(this.clearStep(this.phase([], [], [], (ctx) => this.line(r, c, true, 0, ++ctx.src, -1, true, ctx)), 0));
    } else if (m.type === 'shuffle') {
      steps.push(this.shuffle(false));
      return steps;
    } else if (m.type === 'start') {
      // A win streak's reward: some gems become power-ups before the first move.
      const pool = [];
      for (let i = 0; i < this.N; i++) if (this.kind[i] === GEM && !this.chain[i] && !this.power[i] && this.color[i] >= 0) pool.push(i);
      const cells = [];
      for (const p of m.powers || []) {
        if (!pool.length) break;
        const i = pool.splice(this.rand.int(pool.length), 1)[0];
        const pw = isLine(p) ? (this.rand.int(2) ? LINE_H : LINE_V) : p;
        this.power[i] = pw;
        if (pw === PRISM) this.color[i] = -1;
        cells.push(i);
      }
      return [{ t: 'start', cells, snap: this.snap() }];
    } else if (m.type === 'extra') {
      this.moves += 5;
      steps.push({ t: 'extra' });
      // The moves ran out on a board with nothing left to do: mix it up.
      if (!this.won() && !this.hasMove()) steps.push(this.shuffle());
      return steps;
    } else return [];
    if (first) return steps;
    this.settle(steps);
    return steps;
  }

  // Let everything fall, clear any new matches, and repeat until still.
  // Shuffles if no move is left.
  settle(steps) {
    for (let cascade = 1; cascade < 80; cascade++) {
      const fall = this.gravity();
      if (fall.paths.length || fall.exits.length) steps.push({ t: 'fall', ...fall, snap: this.snap() });
      const groups = this.findGroups();
      if (!groups.length) break;
      steps.push(this.clearStep(this.phase(groups, [], fall.landed), cascade));
    }
    if (!this.won() && this.moves > 0 && !this.hasMove()) steps.push(this.shuffle());
  }

  clearStep(ev, cascade) {
    return { t: 'clear', cascade, events: ev, snap: this.snap() };
  }

  snap() {
    if (this.quiet) return null;
    const s = {};
    for (const k of ['kind', 'color', 'power', 'hp', 'chain', 'ice', 'id']) s[k] = this[k].slice();
    s.goals = this.goals.map((g) => g.got);
    s.moves = this.moves;
    return s;
  }

  swapCells(a, b) {
    for (const k of ['kind', 'color', 'power', 'id', 'chain']) {
      const t = this[k][a];
      this[k][a] = this[k][b];
      this[k][b] = t;
    }
  }

  // ---- one round of clearing ---------------------------------------------------------

  // Clears the groups, sets off the power-ups in fires, then runs every
  // knock-on effect in the order it happens. extra(ctx) can start more
  // effects (combos and boosters). Returns what happened, in time order.
  phase(groups, fires, prefer, extra) {
    const N = this.N;
    const q = [];
    let seq = 0;
    const ctx = {
      ev: [],
      push: (a) => {
        a.seq = seq++;
        if (a.act === 'hit') ctx.doomed[a.i]++;
        let lo = 0, hi = q.length;
        while (lo < hi) {
          const m = (lo + hi) >> 1;
          if (q[m].at < a.at || (q[m].at === a.at && q[m].seq < a.seq)) lo = m + 1;
          else hi = m;
        }
        q.splice(lo, 0, a);
      },
      src: 0,
      iceDone: new Uint8Array(N), // ice already cracked this round
      adj: new Uint8Array(N), // crates knocked by a match beside them
      pending: new Uint8Array(N), // power-ups about to go off
      doomed: new Uint16Array(N), // hits on their way
      struck: new Map(), // which blasts have hit each crate or chain
      reserved: new Set(), // where butterflies are heading
    };
    this.ctx = ctx;
    for (const g of groups) this.clearGroup(g, prefer, ctx);
    for (const f of fires) {
      ctx.pending[f.i] = 1;
      ctx.push({ at: 0, act: 'fire', i: f.i, with: f.with });
    }
    if (extra) extra(ctx);
    while (q.length) {
      const a = q.shift();
      if (a.act === 'hit') {
        ctx.doomed[a.i]--;
        this.hit(a.i, a.at, a.s, a.how, ctx);
      } else if (a.act === 'fire') this.fire(a, ctx);
      else if (a.act === 'launch') this.launch(a, ctx);
      else if (a.act === 'convert') this.convert(a, ctx);
    }
    this.ctx = null;
    ctx.ev.sort((x, y) => x.at - y.at);
    return ctx.ev;
  }

  // A group of matched gems: they clear, and a power-up may be left behind.
  clearGroup(g, prefer, ctx) {
    const s = ++ctx.src;
    let make = -1;
    if (g.power) {
      const ok = (i) => g.cells.includes(i) && !this.chain[i] && !this.power[i] && !ctx.pending[i];
      make = prefer.find(ok) ?? -1;
      if (make < 0 && g.power === BOMB && ok(g.cross)) make = g.cross;
      if (make < 0) {
        // The middle of the group.
        const free = g.cells.filter(ok);
        if (free.length) {
          const w = this.w;
          const mr = free.reduce((t, i) => t + ((i / w) | 0), 0) / free.length, mc = free.reduce((t, i) => t + (i % w), 0) / free.length;
          make = free.reduce((best, i) => {
            const dr = ((i / w) | 0) - mr, dc = (i % w) - mc, d = dr * dr + dc * dc;
            return d < best.d ? { i, d } : best;
          }, { i: -1, d: Infinity }).i;
        }
      }
    }
    for (const i of g.cells) {
      if (i === make) continue;
      if (make >= 0 && !this.chain[i] && !this.power[i]) {
        // Slides into the new power-up.
        if (!this.quiet) ctx.ev.push({ at: 0, e: 'gather', i, to: make, id: this.id[i], color: this.color[i] });
        this.addGoal('color', this.color[i], T.gather, i, ctx);
        this.kind[i] = EMPTY;
        this.color[i] = -1;
        this.id[i] = 0;
        this.breakIce(i, T.gather * 0.5, ctx);
      } else ctx.push({ at: 0, act: 'hit', i, s, how: 'match' });
    }
    if (make >= 0) {
      this.breakIce(make, T.gather * 0.5, ctx);
      const old = this.id[make];
      this.power[make] = g.power;
      if (g.power === PRISM) this.color[make] = -1;
      this.id[make] = this.nextId++;
      this.made.push(g.power);
      ctx.ev.push({ at: T.gather, e: 'make', i: make, id: this.id[make], old, color: this.color[make], power: g.power });
    }
    // Crates beside the match take a knock (once per crate per round).
    for (const i of g.cells) {
      for (const n of this.around(i)) {
        if (this.kind[n] === CRATE && !ctx.adj[n]) {
          ctx.adj[n] = 1;
          ctx.push({ at: 40, act: 'hit', i: n, s: -1, how: 'adj' });
        }
      }
    }
  }

  around(i) {
    const w = this.w, r = (i / w) | 0, c = i % w, out = [];
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const j = this.idx(r + dr, c + dc);
      if (j >= 0) out.push(j);
    }
    return out;
  }

  // Each blast only damages a crate or chain once.
  firstStrike(i, s, ctx) {
    if (s < 0) return true;
    let set = ctx.struck.get(i);
    if (!set) ctx.struck.set(i, (set = new Set()));
    if (set.has(s)) return false;
    set.add(s);
    return true;
  }

  hit(i, at, s, how, ctx) {
    if (i < 0 || !this.on[i]) return;
    switch (this.kind[i]) {
      case CRATE:
        if (how !== 'adj' && !this.firstStrike(i, s, ctx)) return;
        this.hp[i]--;
        ctx.ev.push({ at, e: 'crate', i, hp: this.hp[i] });
        if (!this.hp[i]) {
          this.kind[i] = EMPTY;
          this.addGoal('crate', -1, at, i, ctx);
        }
        return;
      case GEM:
        if (this.chain[i]) {
          if (!this.firstStrike(i, s, ctx)) return;
          this.chain[i] = 0;
          ctx.ev.push({ at, e: 'chain', i });
          this.addGoal('chain', -1, at, i, ctx);
          return;
        }
        if (ctx.pending[i]) return;
        if (this.power[i]) {
          ctx.pending[i] = 1;
          ctx.push({ at: at + T.fuse, act: 'fire', i });
          return;
        }
        if (!this.quiet) ctx.ev.push({ at, e: 'pop', i, id: this.id[i], color: this.color[i], how });
        this.addGoal('color', this.color[i], at, i, ctx);
        this.kind[i] = EMPTY;
        this.color[i] = -1;
        this.id[i] = 0;
        this.breakIce(i, at, ctx);
        return;
      case EMPTY:
        this.breakIce(i, at, ctx);
        return;
      default: // coins can't be harmed
    }
  }

  breakIce(i, at, ctx) {
    if (!this.ice[i] || ctx.iceDone[i]) return;
    ctx.iceDone[i] = 1;
    this.ice[i]--;
    ctx.ev.push({ at, e: 'ice', i, left: this.ice[i] });
    if (!this.ice[i]) this.addGoal('ice', -1, at, i, ctx);
  }

  addGoal(type, color, at, i, ctx) {
    for (let k = 0; k < this.goals.length; k++) {
      const g = this.goals[k];
      if (g.type !== type || (type === 'color' && g.color !== color) || g.got >= g.need) continue;
      g.got++;
      if (ctx && !this.quiet) ctx.ev.push({ at, e: 'goal', g: k, i });
      return;
    }
  }

  // A power-up goes off. a: { i, at, with?, virtual?, power?, color? }.
  // A virtual one isn't a piece on the board (a butterfly's cargo, say).
  fire(a, ctx) {
    const { i, at } = a;
    let power = a.power, color = a.color ?? -1;
    if (!a.virtual) {
      ctx.pending[i] = 0;
      if (this.kind[i] !== GEM || !this.power[i]) return;
      power = this.power[i];
      color = this.color[i];
      ctx.ev.push({ at, e: 'fire', i, id: this.id[i], power, color });
      this.addGoal('color', color, at, i, ctx);
      this.kind[i] = EMPTY;
      this.color[i] = -1;
      this.power[i] = NONE;
      this.id[i] = 0;
      this.breakIce(i, at, ctx);
    }
    this.fired++;
    const s = ++ctx.src, r = (i / this.w) | 0, c = i % this.w;
    if (power === LINE_H || power === LINE_V) this.line(r, c, power === LINE_H, at, s, color, a.virtual, ctx);
    else if (power === BOMB) this.bomb(r, c, a.radius || 2, at, s, ctx);
    else if (power === FLY) this.fly(i, at, s, color, a.carry, ctx);
    else if (power === PRISM) this.prism(i, at, s, a.with ?? this.commonColour(), a.withPower || 0, ctx);
  }

  line(r, c, horiz, at, s, color, virtual, ctx) {
    ctx.ev.push({ at, e: 'line', r, c, horiz, color });
    if (virtual) {
      const j = this.idx(r, c);
      if (j >= 0) ctx.push({ at, act: 'hit', i: j, s });
    }
    const len = horiz ? this.w : this.h;
    for (let d = 1; d < len; d++) {
      for (const sg of [-1, 1]) {
        const j = horiz ? this.idx(r, c + sg * d) : this.idx(r + sg * d, c);
        if (j >= 0) ctx.push({ at: at + d * T.line, act: 'hit', i: j, s });
      }
    }
  }

  // Clears a rounded square of radius R around (r, c).
  bomb(r, c, R, at, s, ctx) {
    ctx.ev.push({ at, e: 'bomb', r, c, R });
    for (let dr = -R; dr <= R; dr++) {
      for (let dc = -R; dc <= R; dc++) {
        if (Math.abs(dr) === R && Math.abs(dc) === R) continue;
        const j = this.idx(r + dr, c + dc);
        if (j >= 0) ctx.push({ at: at + Math.max(Math.abs(dr), Math.abs(dc)) * T.bomb, act: 'hit', i: j, s });
      }
    }
  }

  // A butterfly clears the cross around it, then flies to a target.
  fly(i, at, s, color, carry, ctx, extra = 0) {
    const r = (i / this.w) | 0, c = i % this.w;
    if (!extra) {
      for (const [dr, dc] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const j = this.idx(r + dr, c + dc);
        if (j >= 0) ctx.push({ at, act: 'hit', i: j, s });
      }
    }
    ctx.push({ at: at + T.launch + extra * 70, act: 'launch', i, s, color, carry });
  }

  launch(a, ctx) {
    const t = this.pickTarget(ctx);
    if (t < 0) return;
    ctx.reserved.add(t);
    const w = this.w;
    const dr = ((a.i / w) | 0) - ((t / w) | 0), dc = (a.i % w) - (t % w), dist = Math.sqrt(dr * dr + dc * dc);
    const dur = Math.round(430 + 26 * dist);
    ctx.ev.push({ at: a.at, e: 'fly', from: a.i, to: t, color: a.color, carry: a.carry ? a.carry.power : 0, dur });
    if (a.carry) ctx.push({ at: a.at + dur, act: 'fire', i: t, virtual: true, power: a.carry.power, color: a.carry.color, radius: a.carry.radius });
    else ctx.push({ at: a.at + dur, act: 'hit', i: t, s: a.s });
  }

  // Where a butterfly should go: something a goal still needs.
  pickTarget(ctx) {
    const needs = (type, color = -1) => this.goals.some((g) => g.type === type && (type !== 'color' || g.color === color) && g.got < g.need);
    const wantCrate = needs('crate'), wantChain = needs('chain'), wantIce = needs('ice'), wantCoin = needs('coin');
    let best = -1, bestS = 0, ties = 0;
    for (let i = 0; i < this.N; i++) {
      if (!this.on[i] || ctx.reserved.has(i) || ctx.pending[i] || ctx.doomed[i]) continue;
      const k = this.kind[i];
      let sc = 0;
      if (k === CRATE) sc = wantCrate ? 60 - this.hp[i] : 3;
      else if (k === GEM) {
        if (this.chain[i]) sc = wantChain ? 55 : 4;
        else if (this.ice[i] && wantIce) sc = 50 + this.ice[i];
        else if (wantCoin && this.coinAbove(i)) sc = 45;
        else if (this.power[i]) sc = 6;
        else if (needs('color', this.color[i])) sc = 30;
        else sc = 1;
      } else if (k === EMPTY && this.ice[i] && wantIce) sc = 48;
      if (sc <= 0) continue;
      if (sc > bestS) {
        best = i;
        bestS = sc;
        ties = 1;
      } else if (sc === bestS && this.rand.int(++ties) === 0) best = i;
    }
    return best;
  }

  coinAbove(i) {
    for (let x = this.up[i]; x >= 0; x = this.up[x]) {
      if (this.kind[x] === COIN) return true;
      if (!this.movable(x)) return false;
    }
    return false;
  }

  commonColour() {
    const n = new Array(8).fill(0);
    for (let i = 0; i < this.N; i++) if (this.kind[i] === GEM && this.color[i] >= 0 && !this.power[i]) n[this.color[i]]++;
    let best = this.palette[0];
    for (const c of this.palette) if (n[c] > n[best]) best = c;
    return best;
  }

  // A prism zaps every gem of a colour; with a power-up it turns them all
  // into that power-up first.
  prism(i, at, s, color, withPower, ctx) {
    const w = this.w, r0 = (i / w) | 0, c0 = i % w;
    const targets = [];
    for (let j = 0; j < this.N; j++) if (j !== i && this.kind[j] === GEM && this.color[j] === color && !ctx.pending[j]) targets.push(j);
    // Squared distances are whole numbers, so they sort the same everywhere.
    const d2 = (j) => {
      const dr = ((j / w) | 0) - r0, dc = (j % w) - c0;
      return dr * dr + dc * dc;
    };
    targets.sort((a, b) => d2(a) - d2(b));
    ctx.ev.push({ at, e: 'zap', i, targets, color, power: withPower });
    const after = at + 160 + targets.length * T.zap + 260;
    targets.forEach((j, k) => {
      const t = at + 160 + k * T.zap;
      if (withPower) ctx.push({ at: t, act: 'convert', i: j, power: withPower, fireAt: after + k * 120 });
      else ctx.push({ at: t, act: 'hit', i: j, s });
    });
  }

  convert(a, ctx) {
    const j = a.i;
    if (this.kind[j] !== GEM || ctx.pending[j]) return;
    if (this.chain[j]) {
      this.hit(j, a.at, ++ctx.src, 'blast', ctx);
      return;
    }
    if (!this.power[j]) {
      let p = a.power;
      if (isLine(p)) p = this.rand.int(2) ? LINE_H : LINE_V;
      this.power[j] = p;
      ctx.ev.push({ at: a.at, e: 'convert', i: j, id: this.id[j], power: p, color: this.color[j] });
    }
    ctx.pending[j] = 1;
    ctx.push({ at: a.fireAt, act: 'fire', i: j });
  }

  // Two power-ups swapped together, meeting at cell i (the other came from o).
  combo(i, o, ctx) {
    const pa = this.power[i], pb = this.power[o], ca = this.color[i], cb = this.color[o];
    for (const j of [i, o]) {
      ctx.ev.push({ at: 0, e: 'fire', i: j, id: this.id[j], power: this.power[j], color: this.color[j], combo: true });
      this.addGoal('color', this.color[j], 0, j, ctx);
      this.kind[j] = EMPTY;
      this.color[j] = -1;
      this.power[j] = NONE;
      this.id[j] = 0;
      this.breakIce(j, 0, ctx);
    }
    this.fired += 2;
    const w = this.w, r = (i / w) | 0, c = i % w, s = ++ctx.src;
    const has = (p) => pa === p || pb === p;
    ctx.ev.push({ at: 0, e: 'combo', i, a: pa, b: pb });
    if (pa === PRISM && pb === PRISM) {
      // Everything on the board.
      ctx.ev.push({ at: 60, e: 'wipe', i });
      for (let j = 0; j < this.N; j++) {
        if (!this.on[j]) continue;
        const dr = ((j / w) | 0) - r, dc = (j % w) - c, d = Math.sqrt(dr * dr + dc * dc);
        ctx.push({ at: 140 + d * 50, act: 'hit', i: j, s });
      }
    } else if (has(PRISM)) {
      const other = pa === PRISM ? pb : pa, oc = pa === PRISM ? cb : ca;
      this.prism(i, 0, s, oc, other, ctx);
    } else if (pa === FLY && pb === FLY) {
      for (let k = 0; k < 3; k++) this.fly(i, 0, s, ca, null, ctx, k);
    } else if (has(FLY)) {
      const other = pa === FLY ? pb : pa, oc = pa === FLY ? cb : ca;
      this.fly(i, 0, s, pa === FLY ? ca : cb, { power: other, color: oc, radius: other === BOMB ? 2 : 0 }, ctx);
    } else if (isLine(pa) && isLine(pb)) {
      this.line(r, c, true, 0, s, ca, true, ctx);
      this.line(r, c, false, 0, ++ctx.src, cb, true, ctx);
    } else if (has(BOMB) && (isLine(pa) || isLine(pb))) {
      const lc = isLine(pa) ? ca : cb;
      for (let d = -1; d <= 1; d++) {
        this.line(r + d, c, true, 0, ++ctx.src, lc, true, ctx);
        this.line(r, c + d, false, 0, ++ctx.src, lc, true, ctx);
      }
    } else {
      this.bomb(r, c, 3, 0, s, ctx); // two bombs
    }
  }

  // ---- gravity ---------------------------------------------------------------------------

  // Everything falls one cell per tick: straight down where it can, sideways
  // into gaps nothing can reach from above. New gems (and coins, when a goal
  // needs them) drop in at the top of each column. Coins that reach the
  // bottom drop out.
  gravity() {
    const { N, w, h } = this;
    const paths = new Map();
    const exits = [];
    const track = (from, to, tick) => {
      const id = this.id[to];
      let p = paths.get(id);
      if (!p) {
        p = { id, kind: this.kind[to], color: this.color[to], power: this.power[to], pts: [[from, tick - 1]] };
        paths.set(id, p);
      }
      p.pts.push([to, tick]);
    };
    const done = new Uint8Array(N);
    for (let tick = 1; tick < 400; tick++) {
      let moved = false;
      done.fill(0);
      for (let i = 0; i < N; i++) {
        if (this.kind[i] === COIN && this.exit[i]) {
          exits.push({ id: this.id[i], i, tick, g: this.goals.findIndex((g) => g.type === 'coin') });
          this.addGoal('coin', -1, 0, i, null);
          this.kind[i] = EMPTY;
          this.id[i] = 0;
          this.coins--;
          moved = true;
        }
      }
      for (let r = h - 1; r >= 0; r--) {
        for (let c = 0; c < w; c++) {
          const e = r * w + c;
          if (!this.on[e] || this.kind[e] !== EMPTY) continue;
          const a = this.up[e];
          if (a < 0) {
            this.spawn(e);
            done[e] = 1;
            track(-1 - c, e, tick);
            moved = true;
          } else if (this.movable(a) && !done[a]) {
            this.move(a, e);
            done[e] = 1;
            track(a, e, tick);
            moved = true;
          }
        }
      }
      for (let r = h - 1; r > 0; r--) {
        for (let c = 0; c < w; c++) {
          const e = r * w + c;
          if (!this.on[e] || this.kind[e] !== EMPTY || this.feedable(e)) continue;
          for (const dc of (tick + r + c) & 1 ? [-1, 1] : [1, -1]) {
            const cc = c + dc;
            if (cc < 0 || cc >= w) continue;
            const d = (r - 1) * w + cc;
            if (!this.on[d] || !this.movable(d) || done[d]) continue;
            const below = this.down[d];
            if (below >= 0 && this.kind[below] === EMPTY) continue; // it falls straight down instead
            this.move(d, e);
            done[e] = 1;
            track(d, e, tick);
            moved = true;
            break;
          }
        }
      }
      if (!moved) break;
    }
    const landed = [];
    for (const p of paths.values()) landed.push(p.pts[p.pts.length - 1][0]);
    // Most recent arrivals first: that's where a cascade's power-up appears.
    landed.reverse();
    return { paths: [...paths.values()], exits, landed };
  }

  // Can something still fall into cell e from above?
  feedable(e) {
    for (let x = this.up[e]; x >= 0; x = this.up[x]) {
      if (this.kind[x] === EMPTY) continue;
      return this.movable(x);
    }
    return true;
  }

  move(a, e) {
    this.kind[e] = this.kind[a];
    this.color[e] = this.color[a];
    this.power[e] = this.power[a];
    this.id[e] = this.id[a];
    this.kind[a] = EMPTY;
    this.color[a] = -1;
    this.power[a] = NONE;
    this.id[a] = 0;
  }

  spawn(e) {
    const g = this.goals.find((x) => x.type === 'coin');
    if (g && this.coins < this.coinMax && g.got + this.coins < g.need && this.rand.next() < 0.25) {
      this.kind[e] = COIN;
      this.color[e] = -1;
      this.coins++;
    } else {
      this.kind[e] = GEM;
      this.color[e] = this.palette[this.rand.int(this.palette.length)];
    }
    this.power[e] = NONE;
    this.chain[e] = 0;
    this.id[e] = this.nextId++;
  }

  // ---- shuffling ---------------------------------------------------------------------------

  // Mix up the loose gems (not power-ups or chained ones) until there's a
  // move to make and nothing already matched.
  // auto: the game had to (no move left), rather than the Shuffle booster.
  shuffle(auto = true) {
    const cells = [];
    for (let i = 0; i < this.N; i++) if (this.kind[i] === GEM && !this.chain[i] && !this.power[i]) cells.push(i);
    const pieces = cells.map((i) => ({ id: this.id[i], color: this.color[i], from: i }));
    let order = pieces;
    for (let t = 0; t < 400; t++) {
      order = pieces.slice();
      for (let k = order.length - 1; k > 0; k--) {
        const j = this.rand.int(k + 1);
        [order[k], order[j]] = [order[j], order[k]];
      }
      cells.forEach((i, k) => { this.color[i] = order[k].color; this.id[i] = order[k].id; });
      if (!this.findGroups().length && this.hasMove()) break;
      if (t === 399) {
        // Can't be done with these colours: deal fresh ones.
        for (const i of cells) this.color[i] = -1;
        for (const i of cells) {
          const ok = this.palette.filter((c) => !this.wouldMatch(i, c));
          this.color[i] = (ok.length ? ok : this.palette)[this.rand.int((ok.length ? ok : this.palette).length)];
        }
      }
    }
    const moves = cells.map((i, k) => ({ id: this.id[i], from: order[k].from, to: i }));
    return { t: 'shuffle', moves, auto, snap: this.snap() };
  }

  // ---- the end-of-level celebration ------------------------------------------------------

  // Every move left over turns a gem into a line blaster, and they all go off.
  celebrate() {
    const steps = [];
    const left = Math.min(this.moves, 24);
    this.moves = 0;
    if (!left) return steps;
    const pool = [];
    for (let i = 0; i < this.N; i++) if (this.kind[i] === GEM && !this.chain[i] && !this.power[i]) pool.push(i);
    const picks = [];
    for (let k = 0; k < left && pool.length; k++) picks.push(pool.splice(this.rand.int(pool.length), 1)[0]);
    const ev = this.phase([], [], [], (ctx) => {
      picks.forEach((i, k) => {
        const p = this.rand.int(2) ? LINE_H : LINE_V;
        this.power[i] = p;
        ctx.ev.push({ at: k * 110, e: 'convert', i, id: this.id[i], power: p, color: this.color[i], bonus: true });
        ctx.pending[i] = 1;
        ctx.push({ at: picks.length * 110 + 250 + k * 90, act: 'fire', i });
      });
    });
    steps.push(this.clearStep(ev, 0));
    // Fizz out any power-ups still lying about, then let it all settle.
    for (let round = 0; round < 6; round++) {
      this.settle(steps);
      const left2 = [];
      for (let i = 0; i < this.N; i++) if (this.kind[i] === GEM && this.power[i] && !this.chain[i]) left2.push(i);
      if (!left2.length) break;
      steps.push(this.clearStep(this.phase([], left2.map((i) => ({ i })), []), 0));
    }
    return steps;
  }
}
