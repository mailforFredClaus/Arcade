// Hexit: the rules.
//
// Every tile on the honeycomb has an arrow. Tap a tile and it slides that
// way, straight across gaps and off the edge of the board, unless another
// tile (or a stone) is in the way: then it bumps back and you lose a heart.
//   Blue pads steer anything that slides over them.
//   Two-way tiles have an arrow at each end and leave from the end you tap.
//   Stacked tiles leave one layer at a time; each layer has its own arrow.
//   Frozen tiles can't move until a tile next to them flies away.
//
// Levels are built backwards (see levels.js) so that whatever order you take
// the tiles in, there is always one that can leave: you can never get stuck.

import { DIRS, key, opposite, ANGLE } from './hex.js';

// The cells a tile passes over leaving cell i in direction d, steered by
// pads, until it's clear of the board. Null if it would go round in circles
// or come back over its own cell.
export function makePaths(cells, pad) {
  const N = cells.length, at = new Map(cells.map(([q, r], i) => [key(q, r), i]));
  let q0 = Infinity, q1 = -Infinity, r0 = Infinity, r1 = -Infinity, s0 = Infinity, s1 = -Infinity;
  for (const [q, r] of cells) {
    q0 = Math.min(q0, q); q1 = Math.max(q1, q);
    r0 = Math.min(r0, r); r1 = Math.max(r1, r);
    s0 = Math.min(s0, -q - r); s1 = Math.max(s1, -q - r);
  }
  const outside = (q, r) => q < q0 || q > q1 || r < r0 || r > r1 || -q - r < s0 || -q - r > s1;
  const paths = new Array(N * 6).fill(null);
  for (let i = 0; i < N; i++) {
    for (let d0 = 0; d0 < 6; d0++) {
      let [q, r] = cells[i], d = d0;
      const list = [], dirs = [], seen = new Set();
      let ok = true;
      for (;;) {
        q += DIRS[d][0];
        r += DIRS[d][1];
        if (outside(q, r)) break;
        const j = at.get(key(q, r));
        if (j === undefined) continue;
        if (j === i) { ok = false; break; }
        list.push(j);
        dirs.push(d);
        if (pad[j] >= 0) d = pad[j];
        const st = j * 6 + d;
        if (seen.has(st)) { ok = false; break; }
        seen.add(st);
      }
      if (ok) paths[i * 6 + d0] = { cells: list, dirs, out: d };
    }
  }
  return { paths, at };
}

export class Board {
  // level: { cells: [[q, r]], stacks: [[[d, two], ...] bottom first], stones: [i], pads: [[i, d]], frozen: [i] }
  constructor(level) {
    this.level = level;
    this.cells = level.cells;
    const N = (this.N = this.cells.length);
    this.stone = new Uint8Array(N);
    for (const i of level.stones || []) this.stone[i] = 1;
    this.pad = new Int8Array(N).fill(-1);
    for (const [i, d] of level.pads || []) this.pad[i] = d;
    this.frozen = new Uint8Array(N);
    for (const i of level.frozen || []) this.frozen[i] = 1;
    this.stack = level.stacks.map((s) => (s || []).map(([d, two]) => ({ d, two: !!two })));
    const { paths, at } = makePaths(this.cells, this.pad);
    this.paths = paths;
    this.at = at;
    this.nb = this.cells.map(([q, r]) => DIRS.map(([dq, dr]) => at.get(key(q + dq, r + dr))).filter((j) => j !== undefined));
    this.total = this.stack.reduce((s, l) => s + l.length, 0);
    this.remaining = this.total;
    this.history = [];
  }

  occupied(j) { return !!this.stone[j] || this.stack[j].length > 0; }
  top(i) { const s = this.stack[i]; return s.length ? s[s.length - 1] : null; }

  // Where the tile in cell i would go heading d: the path, and the cell it
  // would hit (-1 if it gets away). stop: how far along the path it gets.
  probe(i, d) {
    const p = this.paths[i * 6 + d];
    if (!p) return { path: null, hit: -2, stop: 0 };
    for (let k = 0; k < p.cells.length; k++) if (this.occupied(p.cells[k])) return { path: p, hit: p.cells[k], stop: k };
    return { path: p, hit: -1, stop: p.cells.length };
  }

  // Which way a tap at angle a (radians, from the tile's centre) sends it.
  dirFor(i, a = null) {
    const t = this.top(i);
    if (!t) return -1;
    if (!t.two || a === null) return t.d;
    const near = (d) => Math.abs(Math.atan2(Math.sin(a - ANGLE[d]), Math.cos(a - ANGLE[d])));
    return near(t.d) <= near(opposite(t.d)) ? t.d : opposite(t.d);
  }

  // A direction the top tile at i could leave in right now, or -1.
  exit(i) {
    const t = this.top(i);
    if (!t || this.frozen[i]) return -1;
    for (const d of t.two ? [t.d, opposite(t.d)] : [t.d]) if (this.probe(i, d).hit === -1) return d;
    return -1;
  }

  // Every tile that could leave right now.
  free() {
    const out = [];
    for (let i = 0; i < this.N; i++) if (this.exit(i) >= 0) out.push(i);
    return out;
  }

  // Tap the tile at i, heading d. Returns what happened; if it got away,
  // the board has changed.
  move(i, d) {
    const t = this.top(i);
    if (!t) return { ok: false, empty: true };
    if (this.frozen[i]) return { ok: false, frozen: true };
    const pr = this.probe(i, d);
    if (pr.hit !== -1) return { ok: false, ...pr };
    this.stack[i].pop();
    const thawed = [];
    for (const j of this.nb[i]) {
      if (this.frozen[j]) {
        this.frozen[j] = 0;
        thawed.push(j);
      }
    }
    this.remaining--;
    this.history.push({ i, tile: t, d, thawed });
    return { ok: true, ...pr, tile: t, thawed };
  }

  undo() {
    const h = this.history.pop();
    if (!h) return null;
    this.stack[h.i].push(h.tile);
    for (const j of h.thawed) this.frozen[j] = 1;
    this.remaining++;
    return h;
  }
}
