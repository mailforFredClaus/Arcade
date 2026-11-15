// Haywire: the world, as plain numbers. The map is a grid of columns one
// metre square. Each column holds the solid slabs in it, bottom to top, so
// there can be rooms over rooms, windows, doorways and bridges. Everything
// else is built on four questions asked of it: is this point solid, what
// does this ray hit, can a body stand here, and how do I walk from A to B.

export const STEP_UP = 0.55; // a ledge this much above your feet is walked up onto
export const AIR_STEP = 0.3; // and this much when you are in the air
export const STAND = 1.8; // headroom needed to stand somewhere
export const JUMP_UP = 1.2; // the highest ledge a jump gets you onto

const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

export class World {
  constructor(W, H) {
    this.W = W;
    this.H = H;
    // While building: for each column, a list of [bottom, top, material].
    this.cols = Array.from({ length: W * H }, () => []);
    this.hit = { nx: 0, ny: 0, nz: 0 }; // which way the last thing a ray hit was facing
  }

  // ---- building ---------------------------------------------------------------------

  // Fills a box with material mat. x1 and z1 are not included, so
  // fill(2, 2, 4, 4, ...) is two columns by two.
  fill(x0, z0, x1, z1, y0, y1, mat) {
    this.carve(x0, z0, x1, z1, y0, y1);
    for (let z = Math.max(0, z0); z < Math.min(this.H, z1); z++) {
      for (let x = Math.max(0, x0); x < Math.min(this.W, x1); x++) {
        const c = this.cols[z * this.W + x];
        c.push([y0, y1, mat]);
        c.sort((a, b) => a[0] - b[0]);
      }
    }
    return this;
  }

  // Empties a box.
  carve(x0, z0, x1, z1, y0, y1) {
    for (let z = Math.max(0, z0); z < Math.min(this.H, z1); z++) {
      for (let x = Math.max(0, x0); x < Math.min(this.W, x1); x++) {
        const i = z * this.W + x, out = [];
        for (const s of this.cols[i]) {
          if (s[1] <= y0 || s[0] >= y1) { out.push(s); continue; }
          if (s[0] < y0) out.push([s[0], y0, s[2]]);
          if (s[1] > y1) out.push([y1, s[1], s[2]]);
        }
        this.cols[i] = out;
      }
    }
    return this;
  }

  // Call once building is done. Packs the slabs into flat arrays (slabs
  // that touch are joined, whatever they are made of) and works out where
  // a robot can walk.
  freeze() {
    const n = this.W * this.H;
    this.first = new Int32Array(n + 1);
    const lo = [], hi = [];
    for (let i = 0; i < n; i++) {
      this.first[i] = lo.length;
      let top = -Infinity;
      for (const s of this.cols[i]) {
        if (s[0] <= top + 1e-6) hi[hi.length - 1] = top = Math.max(top, s[1]);
        else { lo.push(s[0]); hi.push(top = s[1]); }
      }
    }
    this.first[n] = lo.length;
    this.lo = new Float32Array(lo);
    this.hi = new Float32Array(hi);
    this.buildNav();
    return this;
  }

  // ---- questions --------------------------------------------------------------------

  solidAt(x, y, z) {
    const cx = Math.floor(x), cz = Math.floor(z);
    if (cx < 0 || cz < 0 || cx >= this.W || cz >= this.H) return true;
    const i = cz * this.W + cx;
    for (let s = this.first[i]; s < this.first[i + 1]; s++) if (y > this.lo[s] && y < this.hi[s]) return true;
    return false;
  }

  // The top of the highest slab at or below y in the column at (x, z).
  groundAt(x, z, y) {
    const cx = Math.floor(x), cz = Math.floor(z);
    if (cx < 0 || cz < 0 || cx >= this.W || cz >= this.H) return -Infinity;
    const i = cz * this.W + cx;
    let g = -Infinity;
    for (let s = this.first[i]; s < this.first[i + 1]; s++) if (this.hi[s] <= y + 1e-4) g = this.hi[s];
    return g;
  }

  // How far along a ray the world is hit: the ray starts at (ox, oy, oz) and
  // goes the way of (dx, dy, dz), which must be one long. Infinity if
  // nothing is hit within maxT. this.hit says which way the surface faces.
  ray(ox, oy, oz, dx, dy, dz, maxT) {
    const W = this.W, H = this.H, first = this.first, lo = this.lo, hi = this.hi, hit = this.hit;
    let cx = Math.floor(ox), cz = Math.floor(oz);
    if (cx < 0 || cz < 0 || cx >= W || cz >= H) return Infinity;
    const sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
    const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity, tdz = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let tmx = dx !== 0 ? (dx > 0 ? cx + 1 - ox : ox - cx) * tdx : Infinity;
    let tmz = dz !== 0 ? (dz > 0 ? cz + 1 - oz : oz - cz) * tdz : Infinity;
    let t = 0, side = 0;
    for (;;) {
      const i = cz * W + cx, a = first[i], b = first[i + 1];
      const tOut = Math.min(tmx, tmz, maxT);
      const y0 = oy + dy * t, y1 = oy + dy * tOut;
      for (let s = a; s < b; s++) {
        if (y0 > lo[s] && y0 < hi[s]) {
          hit.nx = side === 1 ? -sx : 0;
          hit.ny = 0;
          hit.nz = side === 2 ? -sz : 0;
          return t;
        }
      }
      if (dy < 0) {
        for (let s = b - 1; s >= a; s--) {
          if (hi[s] <= y0 && hi[s] > y1) {
            hit.nx = 0; hit.ny = 1; hit.nz = 0;
            return (hi[s] - oy) / dy;
          }
        }
      } else if (dy > 0) {
        for (let s = a; s < b; s++) {
          if (lo[s] >= y0 && lo[s] < y1) {
            hit.nx = 0; hit.ny = -1; hit.nz = 0;
            return (lo[s] - oy) / dy;
          }
        }
      }
      if (tOut >= maxT) return Infinity;
      if (tmx < tmz) { cx += sx; t = tmx; tmx += tdx; side = 1; } else { cz += sz; t = tmz; tmz += tdz; side = 2; }
      if (cx < 0 || cz < 0 || cx >= W || cz >= H) return Infinity;
    }
  }

  // Can one point see another?
  sees(ax, ay, az, bx, by, bz) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, d = Math.hypot(dx, dy, dz);
    if (d < 1e-6) return true;
    return this.ray(ax, ay, az, dx / d, dy / d, dz / d, d) === Infinity;
  }

  // ---- bodies -----------------------------------------------------------------------

  // A body is an upright cylinder: feet at (x, y, z), radius r, height h.
  // Is it stopped from being here? Slabs no higher than step above its feet
  // don't count (it walks up onto them), unless there's no headroom on top.
  blocked(x, y, z, r, h, step) {
    const W = this.W, first = this.first, lo = this.lo, hi = this.hi;
    const x0 = Math.floor(x - r), x1 = Math.floor(x + r), z0 = Math.floor(z - r), z1 = Math.floor(z + r);
    if (x0 < 0 || z0 < 0 || x1 >= W || z1 >= this.H) return true;
    let ground = y;
    for (let pass = 0; pass < 2; pass++) {
      // First pass: where it stands now. Second: where it would stand after stepping up.
      const base = pass ? ground + 0.02 : y + step, top = (pass ? ground : y) + h;
      for (let cz = z0; cz <= z1; cz++) {
        for (let cx = x0; cx <= x1; cx++) {
          const px = x < cx ? cx : x > cx + 1 ? cx + 1 : x, pz = z < cz ? cz : z > cz + 1 ? cz + 1 : z;
          if ((px - x) * (px - x) + (pz - z) * (pz - z) >= r * r) continue;
          const i = cz * W + cx;
          for (let s = first[i]; s < first[i + 1]; s++) {
            if (lo[s] < top && hi[s] > base) return true;
            if (!pass && hi[s] > ground && hi[s] <= y + step) ground = hi[s];
          }
        }
      }
      if (ground === y) break;
    }
    return false;
  }

  // The height of the floor under a body: the highest slab top under any
  // part of it that it could step onto.
  floorUnder(x, y, z, r, step) {
    const W = this.W, first = this.first, hi = this.hi;
    const x0 = Math.max(0, Math.floor(x - r)), x1 = Math.min(W - 1, Math.floor(x + r));
    const z0 = Math.max(0, Math.floor(z - r)), z1 = Math.min(this.H - 1, Math.floor(z + r));
    let g = -Infinity;
    for (let cz = z0; cz <= z1; cz++) {
      for (let cx = x0; cx <= x1; cx++) {
        const px = x < cx ? cx : x > cx + 1 ? cx + 1 : x, pz = z < cz ? cz : z > cz + 1 ? cz + 1 : z;
        if ((px - x) * (px - x) + (pz - z) * (pz - z) >= r * r) continue;
        const i = cz * W + cx;
        for (let s = first[i]; s < first[i + 1]; s++) if (hi[s] <= y + step && hi[s] > g) g = hi[s];
      }
    }
    return g;
  }

  // The underside of the lowest slab above a body's feet, anywhere over it.
  ceilingOver(x, y, z, r) {
    const W = this.W, first = this.first, lo = this.lo;
    const x0 = Math.max(0, Math.floor(x - r)), x1 = Math.min(W - 1, Math.floor(x + r));
    const z0 = Math.max(0, Math.floor(z - r)), z1 = Math.min(this.H - 1, Math.floor(z + r));
    let c = Infinity;
    for (let cz = z0; cz <= z1; cz++) {
      for (let cx = x0; cx <= x1; cx++) {
        const px = x < cx ? cx : x > cx + 1 ? cx + 1 : x, pz = z < cz ? cz : z > cz + 1 ? cz + 1 : z;
        if ((px - x) * (px - x) + (pz - z) * (pz - z) >= r * r) continue;
        const i = cz * W + cx;
        for (let s = first[i]; s < first[i + 1]; s++) if (lo[s] > y + 0.3 && lo[s] < c) c = lo[s];
      }
    }
    return c;
  }

  // Moves a body for dt seconds: b has x, y, z, vx, vy, vz, r, h, grounded.
  // It slides along walls, climbs steps, falls off ledges and lands.
  // Returns true if it landed this step.
  move(b, dt, gravity) {
    const step = b.grounded ? STEP_UP : AIR_STEP;
    const nx = b.x + b.vx * dt;
    if (!this.blocked(nx, b.y, b.z, b.r, b.h, step)) b.x = nx; else b.vx = 0;
    const nz = b.z + b.vz * dt;
    if (!this.blocked(b.x, b.y, nz, b.r, b.h, step)) b.z = nz; else b.vz = 0;
    const ground = this.floorUnder(b.x, b.y, b.z, b.r, step);
    if (b.grounded) {
      if (b.y - ground > STEP_UP) b.grounded = false; // walked off a ledge
      else { b.y = ground; b.vy = 0; return false; }
    }
    b.vy -= gravity * dt;
    const ny = b.y + b.vy * dt;
    if (b.vy <= 0 && ny <= ground) {
      b.y = ground;
      b.vy = 0;
      b.grounded = true;
      return true;
    }
    if (b.vy > 0 && ny + b.h > this.ceilingOver(b.x, b.y, b.z, b.r)) b.vy = 0;
    else b.y = ny;
    return false;
  }

  // ---- finding the way --------------------------------------------------------------

  // Every place a robot can stand is a node: the top of a slab with room
  // above it. Nodes join to the ones around them: walking (a step up or
  // down), dropping off a ledge, or jumping up onto one.
  buildNav() {
    const W = this.W, H = this.H, first = this.first, lo = this.lo, hi = this.hi;
    const colNode = new Int32Array(W * H + 1), ny = [], ncol = [], nroom = [];
    for (let i = 0; i < W * H; i++) {
      colNode[i] = ny.length;
      for (let s = first[i]; s < first[i + 1]; s++) {
        const room = (s + 1 < first[i + 1] ? lo[s + 1] : Infinity) - hi[s];
        if (room >= STAND) { ny.push(hi[s]); ncol.push(i); nroom.push(room); }
      }
    }
    colNode[W * H] = ny.length;
    const N = ny.length;
    this.colNode = colNode;
    this.nodeY = new Float32Array(ny);
    this.nodeCol = new Int32Array(ncol);
    // The node in column j a robot at height y would walk onto, or -1.
    const walkTo = (j, y) => {
      for (let m = colNode[j]; m < colNode[j + 1]; m++) if (Math.abs(ny[m] - y) <= STEP_UP) return m;
      return -1;
    };
    // Nodes right beside a wall cost more, so robots keep off them when they can.
    const near = new Uint8Array(N);
    for (let n = 0; n < N; n++) {
      const cx = ncol[n] % W, cz = (ncol[n] - cx) / W;
      for (const [ax, az] of D8) {
        const x = cx + ax, z = cz + az;
        if (x < 0 || z < 0 || x >= W || z >= H || walkTo(z * W + x, ny[n]) < 0) { near[n] = 1; break; }
      }
    }
    this.nodeNear = near;
    const eStart = new Int32Array(N + 1), eTo = [], eCost = [], eKind = [];
    for (let n = 0; n < N; n++) {
      eStart[n] = eTo.length;
      const cx = ncol[n] % W, cz = (ncol[n] - cx) / W, y = ny[n];
      for (let d = 0; d < 8; d++) {
        const x = cx + D8[d][0], z = cz + D8[d][1];
        if (x < 0 || z < 0 || x >= W || z >= H) continue;
        const j = z * W + x;
        const m = walkTo(j, y);
        if (d >= 4) {
          // Across a corner: only walking, and only if both sides are open too.
          if (m < 0 || walkTo(cz * W + x, y) < 0 || walkTo(z * W + cx, y) < 0) continue;
          if (ny[m] > y && nroom[n] < ny[m] - y + STAND) continue;
          eTo.push(m); eCost.push(1.414 * (near[m] ? 1.6 : 1)); eKind.push(0);
          continue;
        }
        if (m >= 0) {
          if (ny[m] > y && nroom[n] < ny[m] - y + STAND) continue;
          eTo.push(m); eCost.push(near[m] ? 1.6 : 1); eKind.push(0);
          continue;
        }
        for (let k = colNode[j]; k < colNode[j + 1]; k++) {
          const dy = ny[k] - y;
          if (dy < -STEP_UP && dy >= -6 && nroom[k] >= -dy + STAND) {
            eTo.push(k); eCost.push(2.5 - dy * 0.5); eKind.push(1); // a drop
          } else if (dy > STEP_UP && dy <= JUMP_UP && nroom[n] >= dy + STAND) {
            eTo.push(k); eCost.push(4); eKind.push(2); // a jump
          }
        }
      }
    }
    eStart[N] = eTo.length;
    this.eStart = eStart;
    this.eTo = new Int32Array(eTo);
    this.eCost = new Float32Array(eCost);
    this.eKind = new Uint8Array(eKind);
    // Scratch space for path().
    this.pG = new Float32Array(N);
    this.pFrom = new Int32Array(N);
    this.pStamp = new Int32Array(N);
    this.pGen = 0;
    this.heap = new Int32Array(N * 4);
    this.heapF = new Float32Array(N * 4);
  }

  // The node a body at (x, y, z) is standing on (or about to land on), or -1.
  nodeAt(x, y, z) {
    const cx = Math.floor(x), cz = Math.floor(z);
    if (cx < 0 || cz < 0 || cx >= this.W || cz >= this.H) return -1;
    const i = cz * this.W + cx;
    let best = -1;
    for (let m = this.colNode[i]; m < this.colNode[i + 1]; m++) if (this.nodeY[m] <= y + STEP_UP) best = m;
    return best;
  }

  nodeX(n) { return (this.nodeCol[n] % this.W) + 0.5; }
  nodeZ(n) { return Math.floor(this.nodeCol[n] / this.W) + 0.5; }

  // The cheapest way from node a to node b, as a list of nodes (a first),
  // or null. salt and wobble make each asker value the ground a little
  // differently, so they don't all take the same road. extra, if given, is
  // an added cost for each node (danger, say).
  path(a, b, salt = 0, wobble = 0, extra = null) {
    if (a < 0 || b < 0) return null;
    const { eStart, eTo, eCost, nodeCol, pG, pFrom, pStamp, heap, heapF, W } = this;
    const gen = ++this.pGen;
    const bx = nodeCol[b] % W, bz = (nodeCol[b] - bx) / W;
    const h = (n) => {
      const x = Math.abs((nodeCol[n] % W) - bx), z = Math.abs(Math.floor(nodeCol[n] / W) - bz);
      return x > z ? x + z * 0.414 : z + x * 0.414;
    };
    let size = 0;
    const push = (n, f) => {
      let i = size++;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heapF[p] <= f) break;
        heap[i] = heap[p]; heapF[i] = heapF[p];
        i = p;
      }
      heap[i] = n; heapF[i] = f;
    };
    const pop = () => {
      const top = heap[0], n = heap[--size], f = heapF[size];
      let i = 0;
      for (;;) {
        let c = i * 2 + 1;
        if (c >= size) break;
        if (c + 1 < size && heapF[c + 1] < heapF[c]) c++;
        if (heapF[c] >= f) break;
        heap[i] = heap[c]; heapF[i] = heapF[c];
        i = c;
      }
      heap[i] = n; heapF[i] = f;
      return top;
    };
    pG[a] = 0; pFrom[a] = -1; pStamp[a] = gen;
    push(a, h(a));
    while (size > 0) {
      const n = pop();
      if (n === b) {
        const out = [];
        for (let k = b; k >= 0; k = pFrom[k]) out.push(k);
        return out.reverse();
      }
      const g = pG[n];
      for (let e = eStart[n]; e < eStart[n + 1]; e++) {
        const m = eTo[e];
        let c = eCost[e];
        if (wobble) c *= 1 + wobble * ((Math.imul(m + salt, 0x9e3779b1) >>> 8) / 16777216);
        if (extra) c += extra[m];
        const ng = g + c;
        if (pStamp[m] === gen && pG[m] <= ng) continue;
        if (size >= heap.length - 1) continue;
        pG[m] = ng; pFrom[m] = n; pStamp[m] = gen;
        push(m, ng + h(m));
      }
    }
    return null;
  }

  // Marks every node that can be walked to from node a (reach[n] = 1).
  reachFrom(a) {
    const reach = new Uint8Array(this.nodeY.length), stack = [a];
    reach[a] = 1;
    while (stack.length) {
      const n = stack.pop();
      for (let e = this.eStart[n]; e < this.eStart[n + 1]; e++) {
        const m = this.eTo[e];
        if (!reach[m]) { reach[m] = 1; stack.push(m); }
      }
    }
    return reach;
  }
}
