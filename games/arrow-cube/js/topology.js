// The surface of a shape built from unit cubes, cut into square cells.
//
// A shape is a union of boxes inside an X x Y x Z grid of voxels. Every
// exposed voxel face is a cell. Cells know their neighbours along the surface
// (over flat ground, convex edges and concave corners alike), which is how
// arrow bodies bend around the shape. They also know which flat plane they
// lie in: heads travel in straight lines within their plane, and anything in
// that plane can block them, even on a different part of the shape.
//
// Directions on a cell are local to its face: 0 = +U, 1 = +V, 2 = -U, 3 = -V.
// Directions in space are axis indices: 0 = +x, 1 = -x, 2 = +y, 3 = -y, 4 = +z, 5 = -z
// (the same numbering as face normals).

export const DU = [1, 0, -1, 0];
export const DV = [0, 1, 0, -1];
export const opp = (k) => (k + 2) & 3;
export const FLAT = 0, CONVEX = 1, CONCAVE = 2;

// U x V = N for every face, so (u, v) reads like a page when seen from outside.
export const FACE_DEFS = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
];
export const AXIS_VEC = FACE_DEFS.map((F) => F.n);
const axisOf = (w) => (w[0] !== 0 ? 0 : w[1] !== 0 ? 1 : 2);
const neg = (w) => [-w[0], -w[1], -w[2]];
export const vecIndex = (w) => axisOf(w) * 2 + (w[0] + w[1] + w[2] > 0 ? 0 : 1);
export const oppAxis = (D) => D ^ 1;

export function faceDir(f, k) {
  const F = FACE_DEFS[f];
  return k === 0 ? F.u : k === 1 ? F.v : k === 2 ? neg(F.u) : neg(F.v);
}
// LOCAL[f * 6 + D]: the local direction on a face with normal f that points along axis D.
export const LOCAL = new Int8Array(36).fill(-1);
// SPACE[f * 4 + k]: the axis a local direction points along.
export const SPACE = new Int8Array(24);
for (let f = 0; f < 6; f++) {
  for (let k = 0; k < 4; k++) {
    const D = vecIndex(faceDir(f, k));
    LOCAL[f * 6 + D] = k;
    SPACE[f * 4 + k] = D;
  }
}

export const boxShape = (dims) => ({ dims: dims.slice(), boxes: [[0, 0, 0, dims[0], dims[1], dims[2]]] });

// Fill in the voxels of a shape. Its boxes are applied in order; a box with a
// 7th value of 0 cuts away instead of adding. Places where two cubes would
// touch only along an edge or at a corner get filled in, so the surface never
// pinches.
export function voxelize(shape) {
  const [X, Y, Z] = shape.dims;
  const solid = new Uint8Array(X * Y * Z);
  const id = (x, y, z) => (x * Y + y) * Z + z;
  const paint = (b, value) => {
    for (let x = Math.max(0, b[0]); x < Math.min(X, b[3]); x++)
      for (let y = Math.max(0, b[1]); y < Math.min(Y, b[4]); y++)
        for (let z = Math.max(0, b[2]); z < Math.min(Z, b[5]); z++) solid[id(x, y, z)] = value;
  };
  for (const b of shape.boxes) paint(b, b[6] === 0 ? 0 : 1);
  const at = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < X && y < Y && z < Z && solid[id(x, y, z)] === 1;
  // The three axis pairs, as unit steps (ax,ay,az) and (bx,by,bz).
  const PAIRS = [[1, 0, 0, 0, 1, 0], [1, 0, 0, 0, 0, 1], [0, 1, 0, 0, 0, 1]];
  // Corners with at most one coordinate set; each pairs with its opposite a ^ 7.
  const LOW = [0, 1, 2, 4];
  for (let changed = true, pass = 0; changed && pass < 8; pass++) {
    changed = false;
    for (let x = -1; x < X; x++) for (let y = -1; y < Y; y++) for (let z = -1; z < Z; z++) {
      // Two cubes meeting only along an edge: fill in one of the gaps.
      for (const [ax, ay, az, bx, by, bz] of PAIRS) {
        const s0 = at(x, y, z), sa = at(x + ax, y + ay, z + az), sb = at(x + bx, y + by, z + bz);
        const sab = at(x + ax + bx, y + ay + by, z + az + bz);
        if (s0 && sab && !sa && !sb) { solid[id(x + ax, y + ay, z + az)] = 1; changed = true; }
        else if (sa && sb && !s0 && !sab) { solid[id(x, y, z)] = 1; changed = true; }
      }
      // Two cubes meeting only at a corner of this 2x2x2 block: fill in a
      // cube next to one of them. (Bit i of mask = corner (i&1, i>>1&1, i>>2&1).)
      let mask = 0, count = 0;
      for (let i = 0; i < 8; i++) {
        if (at(x + (i & 1), y + ((i >> 1) & 1), z + ((i >> 2) & 1))) { mask |= 1 << i; count++; }
      }
      if (count !== 2) continue;
      for (const a of LOW) {
        const b = a ^ 7; // the opposite corner
        if (!(mask & (1 << a)) || !(mask & (1 << b))) continue;
        solid[id(x + (b & 1), y + ((a >> 1) & 1), z + ((a >> 2) & 1))] = 1;
        changed = true;
      }
    }
  }
  return solid;
}

export function buildShape(shape) {
  const D = shape.dims.slice();
  const [X, Y, Z] = D;
  const solid = voxelize(shape);
  const vid = (x, y, z) => (x * Y + y) * Z + z;
  const isSolid = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < X && y < Y && z < Z && solid[vid(x, y, z)] === 1;

  // Cells: one per exposed voxel face.
  const cellOf = new Int32Array(X * Y * Z * 6).fill(-1);
  const nrmL = [], voxL = [];
  for (let x = 0; x < X; x++) for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) {
    if (!solid[vid(x, y, z)]) continue;
    for (let f = 0; f < 6; f++) {
      const n = FACE_DEFS[f].n;
      if (isSolid(x + n[0], y + n[1], z + n[2])) continue;
      cellOf[vid(x, y, z) * 6 + f] = nrmL.length;
      nrmL.push(f);
      voxL.push(x, y, z);
    }
  }
  const N = nrmL.length;
  const nrm = Uint8Array.from(nrmL), vox = Int16Array.from(voxL);
  const pos = new Float64Array(N * 3);
  for (let c = 0; c < N; c++) {
    const n = FACE_DEFS[nrm[c]].n;
    for (let a = 0; a < 3; a++) pos[c * 3 + a] = vox[c * 3 + a] + 0.5 + 0.5 * n[a];
  }

  // Planes: every flat plane (axis + level) and a grid of which cell sits where on it.
  const maxD = Math.max(X, Y, Z) + 1;
  const planes = [];
  const planeIndex = new Map();
  const planeOf = new Int32Array(N), gi = new Int16Array(N), gj = new Int16Array(N);
  for (let c = 0; c < N; c++) {
    const f = nrm[c], a = f >> 1, sign = f & 1 ? -1 : 1;
    const level = vox[c * 3 + a] + (sign > 0 ? 1 : 0);
    const key = a * maxD + level;
    let P = planeIndex.get(key);
    if (P === undefined) {
      const [b, cc] = a === 0 ? [1, 2] : a === 1 ? [0, 2] : [0, 1];
      P = planes.length;
      planeIndex.set(key, P);
      const dI = new Int8Array(6), dJ = new Int8Array(6);
      for (let d = 0; d < 6; d++) {
        const w = AXIS_VEC[d];
        dI[d] = w[b];
        dJ[d] = w[cc];
      }
      planes.push({ id: P, a, b, c: cc, level, nb: D[b], nc: D[cc], cells: new Int32Array(D[b] * D[cc]).fill(-1), dI, dJ });
    }
    const pl = planes[P];
    planeOf[c] = P;
    gi[c] = vox[c * 3 + pl.b];
    gj[c] = vox[c * 3 + pl.c];
    pl.cells[gi[c] * pl.nc + gj[c]] = c;
  }

  // Walking along the surface, for arrow bodies: over flat ground, down over
  // convex edges and up into concave corners.
  const nbCell = new Int32Array(N * 4), nbDir = new Int8Array(N * 4), nbType = new Int8Array(N * 4), nbEdge = new Int32Array(N * 4).fill(-1);
  for (let c = 0; c < N; c++) {
    const f = nrm[c], n = FACE_DEFS[f].n;
    const x = vox[c * 3], y = vox[c * 3 + 1], z = vox[c * 3 + 2];
    for (let k = 0; k < 4; k++) {
      const t = faceDir(f, k), e = c * 4 + k;
      if (isSolid(x + t[0] + n[0], y + t[1] + n[1], z + t[2] + n[2])) {
        const c2 = cellOf[vid(x + t[0] + n[0], y + t[1] + n[1], z + t[2] + n[2]) * 6 + vecIndex(neg(t))];
        nbCell[e] = c2; nbDir[e] = LOCAL[nrm[c2] * 6 + vecIndex(n)]; nbType[e] = CONCAVE;
      } else if (isSolid(x + t[0], y + t[1], z + t[2])) {
        nbCell[e] = cellOf[vid(x + t[0], y + t[1], z + t[2]) * 6 + f]; nbDir[e] = k; nbType[e] = FLAT;
      } else {
        const c2 = cellOf[vid(x, y, z) * 6 + vecIndex(t)];
        nbCell[e] = c2; nbDir[e] = LOCAL[nrm[c2] * 6 + vecIndex(neg(n))]; nbType[e] = CONVEX;
      }
    }
  }

  // Convex edges (each shared by two cells), grouped into straight lines.
  const edges = [];
  const edgeKey = new Map();
  for (let c = 0; c < N; c++) {
    for (let k = 0; k < 4; k++) {
      const e = c * 4 + k;
      if (nbType[e] !== CONVEX) continue;
      const c2 = nbCell[e];
      const key = Math.min(c, c2) * N + Math.max(c, c2);
      let id = edgeKey.get(key);
      if (id === undefined) {
        id = edges.length;
        edgeKey.set(key, id);
        const n = FACE_DEFS[nrm[c]].n, t = faceDir(nrm[c], k);
        const w = [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]];
        const E = [0, 1, 2].map((a) => pos[c * 3 + a] + 0.5 * t[a]);
        edges.push({
          id, cells: [c, c2], normals: [nrm[c], nrm[c2]],
          a: E.map((v, i) => v - 0.5 * Math.abs(w[i])), b: E.map((v, i) => v + 0.5 * Math.abs(w[i])),
          axis: axisOf(w), line: -1,
        });
      }
      nbEdge[e] = id;
    }
  }
  const lines = [];
  const byLine = new Map();
  for (const ed of edges) {
    const fixed = [0, 1, 2].filter((a) => a !== ed.axis).map((a) => ed.a[a]);
    const key = `${ed.axis}|${fixed.join(',')}|${Math.min(...ed.normals)},${Math.max(...ed.normals)}`;
    if (!byLine.has(key)) byLine.set(key, []);
    byLine.get(key).push(ed);
  }
  for (const group of byLine.values()) {
    group.sort((p, q) => p.a[p.axis] - q.a[q.axis]);
    let run = [];
    for (const ed of group) {
      if (run.length && run[run.length - 1].b[ed.axis] !== ed.a[ed.axis]) { lines.push(run); run = []; }
      run.push(ed);
    }
    if (run.length) lines.push(run);
  }
  lines.forEach((run, i) => run.forEach((ed) => { ed.line = i; }));

  return {
    shape, dims: D, N, center: [X / 2, Y / 2, Z / 2], solid, isSolid,
    nrm, vox, pos, cellOf, vid,
    planes, planeOf, gi, gj,
    nbCell, nbDir, nbType, nbEdge,
    edges, lines: lines.map((run) => run.map((ed) => ed.id)),
  };
}

export const buildBox = (dims) => buildShape(boxShape(dims));

// Local direction of travel on arriving at b when stepping from neighbour a.
export function arriveDir(topo, a, b) {
  for (let k = 0; k < 4; k++) if (topo.nbCell[a * 4 + k] === b) return topo.nbDir[a * 4 + k];
  return -1;
}

// Direction a path's last cell points in (the way its arrowhead faces).
export function headDir(topo, cells) {
  return arriveDir(topo, cells[cells.length - 2], cells[cells.length - 1]);
}

// ---- what the player can see ---------------------------------------------------

// The camera always looks at the shape from outside, so a face deep in a
// narrow gap can only ever be seen edge-on. A face counts as visible when
// there's a comfortable way to look at it: at most VIEW_TILT degrees from
// straight on, with VIEW_SLACK degrees of leeway all round, so the view
// doesn't have to be lined up exactly.
const VIEW_TILT = 55, VIEW_SLACK = 8;

// Ways to look at a face, in its own frame (along n, u, v), straight on
// first. Each comes with four nearby directions that must be clear too.
const VIEWS = (() => {
  const rad = Math.PI / 180, ks = Math.cos(VIEW_SLACK * rad), ss = Math.sin(VIEW_SLACK * rad);
  const out = [];
  for (const t of [0, 15, 30, 45, VIEW_TILT]) {
    for (let p = 0; p < (t ? 360 : 1); p += 30) {
      const ct = Math.cos(t * rad), st = Math.sin(t * rad), cp = Math.cos(p * rad), sp = Math.sin(p * rad);
      const d = [ct, st * cp, st * sp];
      const tilt = [-st, ct * cp, ct * sp], side = [0, -sp, cp];
      const ring = [d];
      for (const w of [tilt, side]) for (const sign of [1, -1]) ring.push(d.map((x, i) => ks * x + sign * ss * w[i]));
      out.push(ring);
    }
  }
  return out;
})();

// Does a ray from point p in direction d get away from the shape?
function clearRay(T, p, d) {
  const [X, Y, Z] = T.dims, solid = T.solid;
  let x = Math.floor(p[0]), y = Math.floor(p[1]), z = Math.floor(p[2]);
  const sx = d[0] > 0 ? 1 : -1, sy = d[1] > 0 ? 1 : -1, sz = d[2] > 0 ? 1 : -1;
  const ax = Math.abs(d[0]), ay = Math.abs(d[1]), az = Math.abs(d[2]);
  const dx = ax > 1e-9 ? 1 / ax : Infinity, dy = ay > 1e-9 ? 1 / ay : Infinity, dz = az > 1e-9 ? 1 / az : Infinity;
  let tx = ax > 1e-9 ? (sx > 0 ? x + 1 - p[0] : p[0] - x) * dx : Infinity;
  let ty = ay > 1e-9 ? (sy > 0 ? y + 1 - p[1] : p[1] - y) * dy : Infinity;
  let tz = az > 1e-9 ? (sz > 0 ? z + 1 - p[2] : p[2] - z) * dz : Infinity;
  for (;;) {
    if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) return true;
    if (solid[(x * Y + y) * Z + z]) return false;
    if (tx < ty && tx < tz) { x += sx; tx += dx; }
    else if (ty < tz) { y += sy; ty += dy; }
    else { z += sz; tz += dz; }
  }
}

// Just in front of the middle of face c.
function faceStart(T, c) {
  const n = FACE_DEFS[T.nrm[c]].n;
  return [0, 1, 2].map((i) => T.pos[c * 3 + i] + 1e-3 * n[i]);
}

// Can face c be seen from direction w (pointing from the face to the viewer)?
export function canSee(T, c, w) {
  const n = FACE_DEFS[T.nrm[c]].n;
  return n[0] * w[0] + n[1] * w[1] + n[2] * w[2] > 1e-4 && clearRay(T, faceStart(T, c), w);
}

// A comfortable direction to look at face c from (pointing from the face
// towards the viewer), or null if it can only be seen edge-on.
export function viewOf(T, c) {
  const F = FACE_DEFS[T.nrm[c]], p = faceStart(T, c), w = [0, 0, 0];
  for (const ring of VIEWS) {
    let clear = true;
    for (const d of ring) {
      for (let i = 0; i < 3; i++) w[i] = d[0] * F.n[i] + d[1] * F.u[i] + d[2] * F.v[i];
      if (!clearRay(T, p, w)) { clear = false; break; }
    }
    if (clear) return [0, 1, 2].map((i) => ring[0][0] * F.n[i] + ring[0][1] * F.u[i] + ring[0][2] * F.v[i]);
  }
  return null;
}

// 1 for each face that can only be seen edge-on: arrows don't go there.
export function hiddenFaces(T) {
  const out = new Uint8Array(T.N);
  for (let c = 0; c < T.N; c++) if (!viewOf(T, c)) out[c] = 1;
  return out;
}
