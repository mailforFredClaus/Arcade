// The rules of Arrow Cube.
//
// An arrow is a snake of cells. Tapping it sends its head forward; the body
// follows the exact path the head took. The head travels in a straight line
// within its own flat plane, just above the surface: off the edge of its
// face and across open gaps, where arrows lying in that same plane on other
// parts of the shape can be in its way. If it runs into another arrow, or
// into the shape itself (a wall rising up in front of it), it bounces back
// and you lose a star. Once it's past the whole shape, it's gone.
//
//   Blue marker    turns any head that passes over it. Never changes.
//   Purple marker  turns a passing head, then flips around 180 degrees.
//   Yellow edge    a head reaching it slides around onto the next face instead.
//   Two-way arrow  has a head on each end; it leaves from whichever end you tap.
//   Forked arrow   has two heads that leave at the same time, splitting apart.
//                  Both paths must be clear or the whole arrow bounces.

import { opp, headDir, CONVEX, LOCAL, SPACE } from './topology.js';

export const NORMAL = 0, TWO_WAY = 1, FORK = 2;
export const BLUE = 1, PURPLE = 2;

// Simulation modes.
export const FORWARD = 0; // a real move
export const IGNORE = 1; // pretend no other arrows exist (where would it go?)
export const REVERSE = 2; // generator only: read purple markers as they were before this arrow passed

// What blocked a move, when it was not another arrow.
export const SELF = -2, LOOP = -3, TWICE = -4, WALL = -5;

// What a head's step did.
const GONE = 0, MOVED = 1, HIT_WALL = 2;

const LIMIT = { limit: true };

// The snakes that move for each way of leaving. Option 0 is always the way
// the level generator intended.
export function pieceOptions(topo, data) {
  const main = data.cells;
  if (data.kind === FORK) {
    const armB = main.slice(0, data.at + 1).concat(data.branch);
    return [[{ cells: main, dir: headDir(topo, main) }, { cells: armB, dir: headDir(topo, armB) }]];
  }
  const fwd = [{ cells: main, dir: headDir(topo, main) }];
  if (data.kind === TWO_WAY) {
    const rev = main.slice().reverse();
    return [fwd, [{ cells: rev, dir: headDir(topo, rev) }]];
  }
  return [fwd];
}

function makePiece(topo, data, id) {
  const paths = [data.cells];
  const cells = data.cells.slice();
  if (data.kind === FORK) {
    paths.push([data.cells[data.at], ...data.branch]);
    cells.push(...data.branch);
  }
  return { id, kind: data.kind, cells, paths, options: pieceOptions(topo, data), green: data.green | 0, data };
}

export class Board {
  constructor(topo, level) {
    this.topo = topo;
    this.N = topo.N;
    this.occ = new Int32Array(topo.N).fill(-1);
    this.rKind = new Uint8Array(topo.N);
    this.rDir = new Int8Array(topo.N);
    this.yellow = new Uint8Array(topo.edges.length);
    this.purples = [];
    this.pkey = '';
    this.pieces = [];
    this.present = [];
    this.remaining = 0;
    this.history = [];
    this._count = new Int16Array(topo.N);
    this._inert = [];
    this.reach = new Map(); // purple cell -> how many arrows left could ever slide over it
    for (const e of level.yellow || []) this.yellow[e] = 1;
    for (const r of level.redirectors || []) this.setRedirector(r.cell, r.kind, r.dir);
    for (const p of level.pieces || []) this.addPiece(p);
  }

  setRedirector(cell, kind, dir) {
    this.rKind[cell] = kind;
    this.rDir[cell] = dir;
    this.purples = [];
    for (let c = 0; c < this.N; c++) if (this.rKind[c] === PURPLE) this.purples.push(c);
    this.refreshPurpleKey();
  }

  refreshPurpleKey() {
    let s = '';
    for (const c of this.purples) s += this.rDir[c];
    this.pkey = s;
  }

  addPiece(data) {
    const p = makePiece(this.topo, data, this.pieces.length);
    p.reach = this.reachOf(p);
    this.pieces.push(p);
    this.present.push(1);
    this._inert.push(null);
    this.remaining++;
    for (const c of p.cells) this.occ[c] = p.id;
    this.countReach(p, 1);
    return p;
  }

  countReach(p, delta) {
    for (const c of p.reach) this.reach.set(c, (this.reach.get(c) || 0) + delta);
  }

  // Where a head starts: its cell, the plane it travels in, its spot on that
  // plane, and the axis it's heading along.
  headState(cells, dir) {
    const T = this.topo, h = cells[cells.length - 1];
    return { c: h, P: T.planeOf[h], i: T.gi[h], j: T.gj[h], d: SPACE[T.nrm[h] * 4 + dir], f: T.nrm[h], wrapped: false };
  }

  // Move a head one step: around a yellow edge if it's standing at one,
  // otherwise straight on within its plane. Returns GONE once it is past the
  // whole shape, HIT_WALL if the shape itself is in the way, else MOVED.
  advance(st) {
    const T = this.topo;
    if (st.c >= 0) {
      const e = st.c * 4 + LOCAL[T.nrm[st.c] * 6 + st.d];
      if (T.nbType[e] === CONVEX && this.yellow[T.nbEdge[e]]) {
        const c2 = T.nbCell[e];
        st.from = st.c;
        st.c = c2;
        st.d = SPACE[T.nrm[c2] * 4 + T.nbDir[e]];
        st.P = T.planeOf[c2]; st.i = T.gi[c2]; st.j = T.gj[c2]; st.f = T.nrm[c2];
        st.wrapped = true;
        return MOVED;
      }
    }
    st.wrapped = false;
    const pl = T.planes[st.P];
    const i = st.i + pl.dI[st.d], j = st.j + pl.dJ[st.d];
    if (i < 0 || j < 0 || i >= pl.nb || j >= pl.nc) return GONE;
    st.i = i;
    st.j = j;
    // The head slides just above its plane, on the side its face looks out
    // to. A cube there is a wall in its way; a cube just below is more
    // surface it slides over; neither means open air.
    const q = [0, 0, 0];
    q[pl.b] = i;
    q[pl.c] = j;
    q[pl.a] = st.f & 1 ? pl.level - 1 : pl.level;
    if (T.isSolid(q[0], q[1], q[2])) { st.c = -1; return HIT_WALL; }
    q[pl.a] = st.f & 1 ? pl.level : pl.level - 1;
    st.c = T.isSolid(q[0], q[1], q[2]) ? T.cellOf[T.vid(q[0], q[1], q[2]) * 6 + st.f] : -1;
    return MOVED;
  }

  // The point in space a head is at (for drawing its path).
  pointOf(st) {
    const pl = this.topo.planes[st.P], p = [0, 0, 0];
    p[pl.a] = pl.level;
    p[pl.b] = st.i + 0.5;
    p[pl.c] = st.j + 0.5;
    return [p[0], p[1], p[2], st.f, 0];
  }

  // Every purple marker this piece could ever slide over, whichever way the
  // markers face and whatever else is still on the board. (It ignores other
  // arrows and its own body, so it errs on the side of "could".)
  reachOf(p) {
    if (!this.purples.length) return [];
    const T = this.topo, found = new Set(), seen = new Set(), stack = [];
    for (const snakes of p.options) for (const sn of snakes) stack.push(this.headState(sn.cells, sn.dir));
    const limit = this.N * 4 + 64;
    while (stack.length) {
      const st = stack.pop();
      for (let steps = 0; steps < limit && this.advance(st) === MOVED; steps++) {
        const c = st.c;
        if (c < 0) continue;
        if (this.rKind[c] === BLUE) {
          st.d = SPACE[T.nrm[c] * 4 + this.rDir[c]];
        } else if (this.rKind[c] === PURPLE) {
          found.add(c);
          const alt = SPACE[T.nrm[c] * 4 + opp(this.rDir[c])];
          if (!seen.has(c * 6 + alt)) {
            seen.add(c * 6 + alt);
            stack.push({ ...st, d: alt });
          }
          st.d = SPACE[T.nrm[c] * 4 + this.rDir[c]];
        }
        if (seen.has(c * 6 + st.d)) break;
        seen.add(c * 6 + st.d);
      }
    }
    return [...found];
  }

  // Run a move without changing the board. Every head advances one step at a
  // time and each body follows its own head, so the result says exactly what
  // the animation will show. With trace, it also records the points each
  // head passes through.
  simulate(pid, snakes, mode = FORWARD, trace = false) {
    const T = this.topo;
    const { occ, rKind, rDir } = this;
    const count = this._count;
    const touched = [];
    const ns = snakes.length;
    const seqs = new Array(ns), tail = new Array(ns).fill(0), heads = new Array(ns);
    const out = new Array(ns).fill(false), exits = new Array(ns).fill(null), pts = trace ? new Array(ns) : null;
    for (let s = 0; s < ns; s++) {
      const cells = snakes[s].cells;
      seqs[s] = cells.slice();
      for (const c of cells) if (count[c]++ === 0) touched.push(c);
      heads[s] = this.headState(cells, snakes[s].dir);
      if (trace) pts[s] = [];
    }
    let flips = null, local = null, passed = null, wraps = 0, touchedPurple = false;
    let alive = ns, ok = false, by = 0, blockedStep = 0, blockedCell = -1, blockedSnake = -1;
    const limit = this.N * 4 + 64;
    const block = (s, step, c, who) => { by = who; blockedStep = step; blockedCell = c; blockedSnake = s; };
    let step = 0;
    outer: for (;;) {
      step++;
      if (step > limit) { by = LOOP; blockedStep = step; break; }
      // Tails move first, so a head may enter the cell a tail is leaving.
      for (let s = 0; s < ns; s++) {
        const t = tail[s];
        if (t < seqs[s].length) {
          const c = seqs[s][t];
          if (c >= 0) count[c]--;
          tail[s] = t + 1;
        }
      }
      for (let s = 0; s < ns; s++) {
        if (out[s]) { seqs[s].push(-1); continue; }
        const st = heads[s];
        const before = st.c, beforeF = st.f;
        const status = this.advance(st);
        if (status === GONE) {
          out[s] = true;
          alive--;
          exits[s] = { d: st.d, f: st.f };
          seqs[s].push(-1);
          continue;
        }
        if (status === HIT_WALL) {
          if (trace) pts[s].push(this.pointOf(st));
          block(s, step, -1, WALL);
          break outer;
        }
        if (trace) {
          // Each point: x, y, z, the face direction of the stretch leading to it,
          // and 1 if it's where the path bends over an edge.
          if (st.wrapped) {
            const q = this.edgePoint(before, st.c);
            pts[s].push([q[0], q[1], q[2], beforeF, 1]);
          }
          pts[s].push(this.pointOf(st));
        }
        if (st.wrapped) wraps++;
        const c = st.c;
        if (c < 0) { seqs[s].push(-1); continue; }
        const o = occ[c];
        if (mode !== IGNORE && o >= 0 && o !== pid) { block(s, step, c, o); break outer; }
        if (count[c] > 0) { block(s, step, c, SELF); break outer; }
        const rk = rKind[c];
        if (rk === BLUE) {
          st.d = SPACE[T.nrm[c] * 4 + rDir[c]];
        } else if (rk === PURPLE) {
          touchedPurple = true;
          if (mode === REVERSE) {
            if (passed === null) passed = [];
            if (passed.includes(c)) { block(s, step, c, TWICE); break outer; }
            passed.push(c);
            st.d = SPACE[T.nrm[c] * 4 + opp(rDir[c])];
          } else {
            if (local === null) local = new Map();
            const cur = local.has(c) ? local.get(c) : rDir[c];
            st.d = SPACE[T.nrm[c] * 4 + cur];
            local.set(c, opp(cur));
            if (flips === null) flips = [];
            flips.push(c, step);
          }
        }
        seqs[s].push(c);
        if (count[c]++ === 0) touched.push(c);
      }
      if (alive === 0) { ok = true; break; }
    }
    for (const c of touched) count[c] = 0;
    return {
      ok, by, step: blockedStep, cell: blockedCell, snake: blockedSnake, steps: step,
      seqs, exits, pts, flips, passed, wraps, touchedPurple,
    };
  }

  // Where the surface path from cell a to its neighbour b bends over an edge.
  edgePoint(a, b) {
    const T = this.topo;
    for (let k = 0; k < 4; k++) {
      if (T.nbCell[a * 4 + k] !== b) continue;
      const D = SPACE[T.nrm[a] * 4 + k], w = [0, 0, 0];
      w[D >> 1] = D & 1 ? -0.5 : 0.5;
      return [T.pos[a * 3] + w[0], T.pos[a * 3 + 1] + w[1], T.pos[a * 3 + 2] + w[2]];
    }
    return [T.pos[a * 3], T.pos[a * 3 + 1], T.pos[a * 3 + 2]];
  }

  tryMove(pid, opt, trace = false) {
    return this.simulate(pid, this.pieces[pid].options[opt], FORWARD, trace);
  }

  apply(pid, opt, res) {
    const p = this.pieces[pid];
    this.present[pid] = 0;
    this.remaining--;
    for (const c of p.cells) this.occ[c] = -1;
    this.countReach(p, -1);
    const flips = [];
    if (res.flips) {
      for (let i = 0; i < res.flips.length; i += 2) {
        const c = res.flips[i];
        this.rDir[c] = opp(this.rDir[c]);
        flips.push(c);
      }
      this.refreshPurpleKey();
    }
    this.history.push({ pid, opt, flips });
  }

  undo() {
    const h = this.history.pop();
    if (!h) return null;
    const p = this.pieces[h.pid];
    this.present[h.pid] = 1;
    this.remaining++;
    for (const c of p.cells) this.occ[c] = h.pid;
    this.countReach(p, 1);
    for (let i = h.flips.length - 1; i >= 0; i--) this.rDir[h.flips[i]] = opp(this.rDir[h.flips[i]]);
    if (h.flips.length) this.refreshPurpleKey();
    return h;
  }

  undoTo(len) {
    while (this.history.length > len) this.undo();
  }

  // An arrow is "inert" when leaving can't change any purple marker that
  // another remaining arrow could ever slide over. Then removing it can only
  // free up space, so doing it early can never make the puzzle unsolvable.
  isInert(pid) {
    const p = this.pieces[pid];
    if (!p.reach.length) return true;
    let key = this.pkey + '|', shared = false;
    for (const c of this.purples) {
      const s = (this.reach.get(c) || 0) > 1;
      key += s ? '1' : '0';
      if (s && p.reach.includes(c)) shared = true;
    }
    if (!shared) return true;
    const cached = this._inert[pid];
    if (cached && cached.key === key) return cached.value;
    let value = true;
    search: for (const snakes of p.options) {
      const r = this.simulate(pid, snakes, IGNORE);
      if (!r.flips) continue;
      for (let i = 0; i < r.flips.length; i += 2) {
        if ((this.reach.get(r.flips[i]) || 0) > 1) { value = false; break search; }
      }
    }
    this._inert[pid] = { key, value };
    return value;
  }

  // Remove every inert arrow that can leave, until none can. An arrow only
  // gets looked at again once the arrow that blocked it has gone.
  greedyInert() {
    const P = this.pieces.length;
    for (;;) {
      let moved = false;
      const queue = [], queued = new Uint8Array(P), waiting = new Map();
      for (let pid = P - 1; pid >= 0; pid--) if (this.present[pid]) { queue.push(pid); queued[pid] = 1; }
      while (queue.length) {
        const pid = queue.pop();
        queued[pid] = 0;
        if (!this.present[pid] || !this.isInert(pid)) continue;
        const opts = this.pieces[pid].options;
        let left = false;
        for (let o = 0; o < opts.length && !left; o++) {
          const r = this.simulate(pid, opts[o], FORWARD);
          if (r.ok) {
            this.apply(pid, o, r);
            left = true;
          } else if (r.by >= 0) {
            if (!waiting.has(r.by)) waiting.set(r.by, []);
            waiting.get(r.by).push(pid);
          }
        }
        if (!left) continue;
        moved = true;
        for (const w of waiting.get(pid) || []) {
          if (!queued[w] && this.present[w]) { queued[w] = 1; queue.push(w); }
        }
        waiting.delete(pid);
      }
      // With purple markers, arrows leaving can make other arrows inert.
      if (!moved || !this.purples.length) return;
    }
  }

  stateKey() {
    let s = this.pkey + '|';
    const pr = this.present;
    for (let i = 0; i < pr.length; i += 24) {
      let v = 0;
      for (let j = 0; j < 24 && i + j < pr.length; j++) v |= pr[i + j] << j;
      s += v.toString(36) + ',';
    }
    return s;
  }

  freeNonInertMoves() {
    const moves = [];
    for (let pid = 0; pid < this.pieces.length; pid++) {
      if (!this.present[pid] || this.isInert(pid)) continue;
      const opts = this.pieces[pid].options;
      for (let o = 0; o < opts.length; o++) {
        const r = this.simulate(pid, opts[o], FORWARD);
        if (r.ok) moves.push([pid, o, r]);
      }
    }
    return moves;
  }

  // Can every arrow still be cleared from here? true / false, or null if the
  // search ran out of budget. The board is left unchanged.
  solve(budget = 20000) {
    const base = this.history.length;
    const seen = new Set();
    let nodes = 0;
    const dfs = () => {
      if (++nodes > budget) throw LIMIT;
      const mark = this.history.length;
      this.greedyInert();
      if (this.remaining === 0) return true;
      const key = this.stateKey();
      if (seen.has(key)) { this.undoTo(mark); return false; }
      seen.add(key);
      for (const [pid, o, r] of this.freeNonInertMoves()) {
        this.apply(pid, o, r);
        if (dfs()) return true;
        this.undo();
      }
      this.undoTo(mark);
      return false;
    };
    try {
      const ok = dfs();
      this.undoTo(base);
      return ok;
    } catch (e) {
      this.undoTo(base);
      if (e === LIMIT) return null;
      throw e;
    }
  }

  // Is there ANY order of taps that leaves the player stuck? Only purple
  // markers can cause that (everything else only ever frees space), so this
  // explores every order of the arrows that touch purple markers.
  // true = a dead end exists, false = none, null = too many orders to check.
  findDeadEnd(budget = 20000) {
    if (this.purples.length === 0) {
      const s = this.solve(budget);
      return s === null ? null : !s;
    }
    const base = this.history.length;
    const seen = new Set();
    let nodes = 0;
    const dfs = () => {
      if (++nodes > budget) throw LIMIT;
      const mark = this.history.length;
      this.greedyInert();
      if (this.remaining === 0) { this.undoTo(mark); return false; }
      const key = this.stateKey();
      if (seen.has(key)) { this.undoTo(mark); return false; }
      seen.add(key);
      const moves = this.freeNonInertMoves();
      if (moves.length === 0) { this.undoTo(mark); return true; }
      for (const [pid, o, r] of moves) {
        this.apply(pid, o, r);
        const dead = dfs();
        this.undo();
        if (dead) { this.undoTo(mark); return true; }
      }
      this.undoTo(mark);
      return false;
    };
    try {
      return dfs();
    } catch (e) {
      this.undoTo(base);
      if (e === LIMIT) return null;
      throw e;
    }
  }

}
