// Draws the glass shape and its arrows with WebGL.
//
// The camera is orthographic. Arrows are real geometry lying on the faces, so
// they foreshorten naturally on any shape. Anything hidden behind the
// nearest glass surface (the far side, or parts of the shape tucked behind
// other parts) is drawn as a white "ghost", which makes it read as frosted
// glass. Each frame:
//   1. glass, depth only       remember the nearest surface at every pixel
//   2. hidden glass, faintly   (depth test GREATER)
//   3. hidden arrows as ghosts (depth test GREATER)
//   4. the nearest glass       (LEQUAL), frosting everything behind it
//   5. visible arrows          (LEQUAL), crisp on top
//   6. edges

import { FACE_DEFS, SPACE, AXIS_VEC, canSee, viewOf } from './topology.js';
import { TWO_WAY, FORK, BLUE, PURPLE, LOOP } from './rules.js';

const BODY = 0.28; // arrow thickness, in cells
const TIP = 0.43, BACK = 0.1, HALF = 0.34; // arrowhead shape
const AIR_FADE = 6; // cells an arrow travels after leaving before it has faded out
const LIFT = 0.012; // arrows float this far above the glass
const NV = FACE_DEFS.map((F) => F.n);
const TAP_PX = 30; // how big a cell should be on screen when a hint shows it
const LIGHT = norm3([-0.35, 0.75, 0.55]);
// How much light reaches a corner of a cell with 3, 2, 1 or 0 of the cubes
// around it rising up in front (ambient occlusion).
const AO = [0.3, 0.58, 0.82, 1];

const rgba = (hex, a = 1) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a];
};
const INK = rgba('#16181d');
const FORK_INK = rgba('#f97316'); // forked arrows are orange so they never surprise you
const PURPLE_INK = rgba('#9b4dff');
const BLUE_INK = rgba('#10a5f5');
const PINK = rgba('#ff3896');
const RED = rgba('#ef4444');
const EDGE_INK = rgba('#4f63a3', 0.85);
const EDGE_GLOW = [1, 0.91, 0.25, 0.42];
const EDGE_CORE = [1, 0.965, 0.59, 0.95];
const GREEN = [34 / 255, 197 / 255, 94 / 255], YELLOW = [250 / 255, 204 / 255, 21 / 255];
const inkOf = (kind) => (kind === FORK ? FORK_INK : INK);

function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const rot = (M, v) => [
  M[0] * v[0] + M[1] * v[1] + M[2] * v[2],
  M[3] * v[0] + M[4] * v[1] + M[5] * v[2],
  M[6] * v[0] + M[7] * v[1] + M[8] * v[2],
];
const ease = (t) => t * t * (3 - 2 * t);
const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

function twoColor(green, frac, a = 1) {
  const t = green ? 1 - frac : frac; // 0 = green end
  return [GREEN[0] + (YELLOW[0] - GREEN[0]) * t, GREEN[1] + (YELLOW[1] - GREEN[1]) * t, GREEN[2] + (YELLOW[2] - GREEN[2]) * t, a];
}
const withAlpha = (c, a) => (a >= 1 ? c : [c[0], c[1], c[2], c[3] * a]);

// Quaternions as [x, y, z, w].
export const quat = {
  mul(a, b) {
    return [
      a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
      a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
      a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
      a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
    ];
  },
  axis(ax, ang) {
    const s = Math.sin(ang / 2);
    return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(ang / 2)];
  },
  norm(q) {
    const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
  },
  slerp(a, b, t) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = b.map((x) => -x); d = -d; }
    if (d > 0.9995) return quat.norm(a.map((x, i) => x + (b[i] - x) * t));
    const th = Math.acos(d), s = Math.sin(th);
    const wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
    return a.map((x, i) => x * wa + b[i] * wb);
  },
  toMat(q) {
    const [x, y, z, w] = q;
    return [
      1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
      2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
      2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y),
    ];
  },
  // The rotation a 3x3 matrix (rows, as toMat gives) stands for.
  fromMat(m) {
    const [a, b, c, d, e, f, g, h, i] = m;
    const tr = a + e + i;
    let q;
    if (tr > 0) {
      const s = Math.sqrt(tr + 1) * 2;
      q = [(h - f) / s, (c - g) / s, (d - b) / s, s / 4];
    } else if (a > e && a > i) {
      const s = Math.sqrt(1 + a - e - i) * 2;
      q = [s / 4, (b + d) / s, (c + g) / s, (h - f) / s];
    } else if (e > i) {
      const s = Math.sqrt(1 + e - a - i) * 2;
      q = [(b + d) / s, s / 4, (f + h) / s, (c - g) / s];
    } else {
      const s = Math.sqrt(1 + i - a - e) * 2;
      q = [(c + g) / s, (f + h) / s, s / 4, (d - b) / s];
    }
    return quat.norm(q);
  },
};

// The axis direction closest to v (only among those square to n, if given).
function nearestAxis(v, n = null) {
  let best = null, top = -Infinity;
  for (const a of NV) {
    if (n && Math.abs(dot3(a, n)) > 0.5) continue;
    const d = dot3(a, v);
    if (d > top) { top = d; best = a; }
  }
  return best;
}

// The view with side n facing you, square on. Sides are shown upright; the
// top and bottom are turned so "up" on screen is as close to `up` as can be.
function squareView(n, up) {
  const y = n[1] ? nearestAxis(up, n) : [0, 1, 0], x = cross(y, n);
  return quat.fromMat([x[0], x[1], x[2], y[0], y[1], y[2], n[0], n[1], n[2]]);
}

export function defaultView(dims) {
  const thin = Math.min(dims[0], dims[1]) >= 4 && dims[2] <= 2;
  const yaw = thin ? -0.3 : -0.62, pitch = thin ? 0.28 : 0.45;
  return quat.mul(quat.axis([1, 0, 0], pitch), quat.axis([0, 1, 0], yaw));
}

// ---- triangle soup ------------------------------------------------------------

// Vertices are x, y, z, r, g, b, a.
class Mesh {
  constructor(size = 4096) { this.a = new Float32Array(size * 7); this.n = 0; }
  clear() { this.n = 0; }
  grow(k) {
    const need = (this.n + k) * 7;
    if (need <= this.a.length) return;
    let size = this.a.length * 2;
    while (size < need) size *= 2;
    const b = new Float32Array(size);
    b.set(this.a.subarray(0, this.n * 7));
    this.a = b;
  }
  v(x, y, z, c) {
    const a = this.a, i = this.n * 7;
    a[i] = x; a[i + 1] = y; a[i + 2] = z; a[i + 3] = c[0]; a[i + 4] = c[1]; a[i + 5] = c[2]; a[i + 6] = c[3];
    this.n++;
  }
}

const CIRCLE = Array.from({ length: 9 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]);

// A flat strip from p to q, lying in the plane with normal n.
function segment(m, p, q, n, width, ca, cb) {
  const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2];
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return;
  const w = cross(n, [dx / len, dy / len, dz / len]), h = width / 2;
  const wx = w[0] * h, wy = w[1] * h, wz = w[2] * h;
  const lx = n[0] * LIFT, ly = n[1] * LIFT, lz = n[2] * LIFT;
  m.grow(6);
  m.v(p[0] + wx + lx, p[1] + wy + ly, p[2] + wz + lz, ca);
  m.v(p[0] - wx + lx, p[1] - wy + ly, p[2] - wz + lz, ca);
  m.v(q[0] + wx + lx, q[1] + wy + ly, q[2] + wz + lz, cb);
  m.v(p[0] - wx + lx, p[1] - wy + ly, p[2] - wz + lz, ca);
  m.v(q[0] - wx + lx, q[1] - wy + ly, q[2] - wz + lz, cb);
  m.v(q[0] + wx + lx, q[1] + wy + ly, q[2] + wz + lz, cb);
}

// A round dot in the plane of face direction f (joins and tail ends).
function disc(m, p, f, r, color) {
  const { n, u, v } = FACE_DEFS[f];
  const cx = p[0] + n[0] * LIFT, cy = p[1] + n[1] * LIFT, cz = p[2] + n[2] * LIFT;
  m.grow(24);
  for (let i = 0; i < 8; i++) {
    const [c0, s0] = CIRCLE[i], [c1, s1] = CIRCLE[i + 1];
    m.v(cx, cy, cz, color);
    m.v(cx + (u[0] * c0 + v[0] * s0) * r, cy + (u[1] * c0 + v[1] * s0) * r, cz + (u[2] * c0 + v[2] * s0) * r, color);
    m.v(cx + (u[0] * c1 + v[0] * s1) * r, cy + (u[1] * c1 + v[1] * s1) * r, cz + (u[2] * c1 + v[2] * s1) * r, color);
  }
}

function arrowhead(m, p, t, n, color, scale = 1) {
  const w = cross(n, t);
  const lx = n[0] * LIFT, ly = n[1] * LIFT, lz = n[2] * LIFT;
  const tp = TIP * scale, bk = BACK * scale, hf = HALF * scale;
  m.grow(3);
  m.v(p[0] + t[0] * tp + lx, p[1] + t[1] * tp + ly, p[2] + t[2] * tp + lz, color);
  m.v(p[0] - t[0] * bk + w[0] * hf + lx, p[1] - t[1] * bk + w[1] * hf + ly, p[2] - t[2] * bk + w[2] * hf + lz, color);
  m.v(p[0] - t[0] * bk - w[0] * hf + lx, p[1] - t[1] * bk - w[1] * hf + ly, p[2] - t[2] * bk - w[2] * hf + lz, color);
}

// A thick polyline in a face's plane, drawn as two strokes (for markers).
function chevron(m, center, X, Y, n, pts, width, color) {
  const P = pts.map(([x, y]) => [center[0] + X[0] * x + Y[0] * y, center[1] + X[1] * x + Y[1] * y, center[2] + X[2] * x + Y[2] * y]);
  for (let i = 0; i + 1 < P.length; i++) segment(m, P[i], P[i + 1], n, width, color, color);
}

// ---- WebGL plumbing -------------------------------------------------------------

const FLAT_VS = `attribute vec3 aPos; attribute vec4 aColor; uniform mat4 uMVP; varying vec4 vColor;
void main() { gl_Position = uMVP * vec4(aPos, 1.0); vColor = aColor; }`;
const FLAT_FS = `precision mediump float; varying vec4 vColor; uniform vec4 uTint; uniform float uGhost;
void main() {
  vec4 c = vColor * uTint;
  if (uGhost > 0.5) c = vec4(1.0, 1.0, 1.0, c.a * 0.92);
  gl_FragColor = vec4(c.rgb * c.a, c.a);
}`;
const GLASS_VS = `attribute vec3 aPos; attribute vec3 aNormal; attribute float aShade; uniform mat4 uMVP; uniform mat3 uRot;
uniform vec3 uLight; uniform vec4 uBase; uniform vec4 uLit; uniform float uAo; varying vec4 vColor;
void main() {
  gl_Position = uMVP * vec4(aPos, 1.0);
  vColor = uBase + uLit * max(0.0, dot(uRot * aNormal, uLight));
  vColor.rgb *= 1.0 - uAo * (1.0 - aShade);
}`;
const GLASS_FS = `precision mediump float; varying vec4 vColor; uniform float uAlpha;
void main() { float a = vColor.a * uAlpha; gl_FragColor = vec4(vColor.rgb * a, a); }`;

function program(gl, vs, fs, attrs, uniforms) {
  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
  attrs.forEach((name, i) => gl.bindAttribLocation(p, i, name));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const out = { p };
  for (const u of uniforms) out[u] = gl.getUniformLocation(p, u);
  return out;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.w = 1; this.h = 1; this.dpr = 1;
    this.inset = { top: 0, bottom: 0 };
    this.q = [0, 0, 0, 1];
    this.zoom = 1;
    this.pan = [0, 0];
    this.base = 30;
    this.shrink = 1;
    this.alpha = 1;
    this.board = null;
    this.movers = [];
    this.hidden = new Set();
    this.flash = new Map();
    this.hintPid = -1;
    this.hintStart = 0;
    this.angles = new Map();
    this.spins = [];
    this.cam = null;
    this.vanishAt = 0;
    this.needsDraw = true;
    this.dyn = new Mesh();
    this.gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, depth: true });
    if (!this.gl) throw new Error('WebGL is not available');
    this.initGL();
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; });
    canvas.addEventListener('webglcontextrestored', () => {
      this.lost = false;
      this.initGL();
      if (this.board) this.upload();
      this.needsDraw = true;
    });
  }

  initGL() {
    const gl = this.gl;
    this.flatProg = program(gl, FLAT_VS, FLAT_FS, ['aPos', 'aColor'], ['uMVP', 'uTint', 'uGhost']);
    this.glassProg = program(gl, GLASS_VS, GLASS_FS, ['aPos', 'aNormal', 'aShade'], ['uMVP', 'uRot', 'uLight', 'uBase', 'uLit', 'uAo', 'uAlpha']);
    this.bufs = {};
    for (const k of ['glass', 'arrows', 'edges', 'yellow', 'dyn', 'hint', 'flash']) this.bufs[k] = gl.createBuffer();
    this.uploadedHint = -1;
  }

  resize(w, h, dpr, inset) {
    this.w = w; this.h = h;
    this.dpr = Math.min(dpr, 2);
    this.inset = inset;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.fit();
    this.needsDraw = true;
  }

  // ---- level setup ----------------------------------------------------------------

  setBoard(board) {
    this.board = board;
    this.topo = board.topo;
    const t = this.topo;
    this.markers = [];
    for (let c = 0; c < t.N; c++) if (board.rKind[c]) this.markers.push(c);
    this.movers = [];
    this.hidden.clear();
    this.flash.clear();
    this.spins = [];
    this.hintPid = -1;
    this.cam = null;
    this.vanishAt = 0;
    this.shrink = 1;
    this.alpha = 1;
    this.syncAngles();
    this.q = defaultView(t.dims);
    this.zoom = 1;
    this.pan = [0, 0];
    const D = t.dims;
    this.zr = Math.hypot(D[0], D[1], D[2]) + 4;
    this.buildStatic();
    this.upload();
    this.fit();
    this.needsDraw = true;
  }

  // Everything that only changes when arrows come and go.
  buildStatic() {
    const t = this.topo, b = this.board;
    // Glass: one square per cell (position, normal, and how open each corner
    // is). Corners tucked into a crease are shaded darker, so inside corners
    // and the floors of gaps read as such.
    const g = new Float32Array(t.N * 42);
    for (let c = 0; c < t.N; c++) {
      const { n, u, v } = FACE_DEFS[t.nrm[c]];
      const P = this.cellPos(c);
      const x = t.vox[c * 3] + n[0], y = t.vox[c * 3 + 1] + n[1], z = t.vox[c * 3 + 2] + n[2]; // the space in front
      const solid = (su, sv) => (t.isSolid(x + u[0] * su + v[0] * sv, y + u[1] * su + v[1] * sv, z + u[2] * su + v[2] * sv) ? 1 : 0);
      const corner = (su, sv) => {
        const s1 = solid(su, 0), s2 = solid(0, sv);
        const open = s1 && s2 ? 0 : 3 - s1 - s2 - solid(su, sv);
        return [P[0] + (u[0] * su + v[0] * sv) / 2, P[1] + (u[1] * su + v[1] * sv) / 2, P[2] + (u[2] * su + v[2] * sv) / 2, AO[open]];
      };
      const p00 = corner(-1, -1), p10 = corner(1, -1), p11 = corner(1, 1), p01 = corner(-1, 1);
      // Split the square along the diagonal that keeps the shading smooth.
      const quad = p00[3] + p11[3] >= p10[3] + p01[3] ? [p00, p10, p11, p00, p11, p01] : [p10, p11, p01, p10, p01, p00];
      quad.forEach((q, i) => g.set([q[0], q[1], q[2], n[0], n[1], n[2], q[3]], c * 42 + i * 7));
    }
    this.glassData = g;

    // Arrows, each in its own stretch of the buffer so it can be hidden alone.
    const m = new Mesh(t.N * 16);
    this.ranges = [];
    this.geo = [];
    for (const p of b.pieces) {
      const start = m.n;
      this.pieceMesh(m, p, BODY, null, 1);
      this.ranges[p.id] = [start, m.n - start];
      this.geo[p.id] = this.pickGeometry(p);
    }
    this.arrowMesh = m;
    this.shown = new Uint8Array(b.pieces.length).fill(1);

    // Edges: thin outlines, and glowing yellow ones that arrows wrap over.
    const lines = new Mesh(), yel = new Mesh();
    for (const ed of t.edges) {
      const [c1, c2] = ed.cells, n1 = NV[t.nrm[c1]], n2 = NV[t.nrm[c2]];
      const strip = (mesh, n, inward, width, color) => {
        const lift = 1.6 * LIFT;
        const a = [ed.a[0] + n[0] * lift, ed.a[1] + n[1] * lift, ed.a[2] + n[2] * lift];
        const bb = [ed.b[0] + n[0] * lift, ed.b[1] + n[1] * lift, ed.b[2] + n[2] * lift];
        const a2 = [a[0] - inward[0] * width, a[1] - inward[1] * width, a[2] - inward[2] * width];
        const b2 = [bb[0] - inward[0] * width, bb[1] - inward[1] * width, bb[2] - inward[2] * width];
        mesh.grow(6);
        for (const q of [a, bb, a2, bb, b2, a2]) mesh.v(q[0], q[1], q[2], color);
      };
      if (b.yellow[ed.id]) {
        for (const [n, other] of [[n1, n2], [n2, n1]]) {
          strip(yel, n, other, 0.2, EDGE_GLOW);
          strip(yel, n, other, 0.075, EDGE_CORE);
        }
      } else {
        strip(lines, n1, n2, 0.035, EDGE_INK);
        strip(lines, n2, n1, 0.035, EDGE_INK);
      }
    }
    this.edgeMesh = lines;
    this.yellowMesh = yel;
  }

  upload() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.glass);
    gl.bufferData(gl.ARRAY_BUFFER, this.glassData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.arrows);
    gl.bufferData(gl.ARRAY_BUFFER, this.arrowMesh.a.subarray(0, this.arrowMesh.n * 7), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.edges);
    gl.bufferData(gl.ARRAY_BUFFER, this.edgeMesh.a.subarray(0, this.edgeMesh.n * 7), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.yellow);
    gl.bufferData(gl.ARRAY_BUFFER, this.yellowMesh.a.subarray(0, this.yellowMesh.n * 7), gl.STATIC_DRAW);
    this.shown.fill(1);
    this.uploadedHint = -1;
    this.refresh();
  }

  // Show or hide arrows to match the board (after moves, undo, bumps).
  refresh() {
    if (!this.board || this.lost) return;
    const gl = this.gl, b = this.board;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.arrows);
    for (const p of b.pieces) {
      const want = b.present[p.id] && !this.hidden.has(p.id) ? 1 : 0;
      if (want === this.shown[p.id]) continue;
      const [start, count] = this.ranges[p.id];
      const data = want ? this.arrowMesh.a.subarray(start * 7, (start + count) * 7) : new Float32Array(count * 7);
      gl.bufferSubData(gl.ARRAY_BUFFER, start * 28, data);
      this.shown[p.id] = want;
    }
    this.needsDraw = true;
  }

  // Purple markers snap to the board's current state (after undo/restart).
  syncAngles() {
    this.angles.clear();
    this.spins = [];
    const b = this.board;
    for (let c = 0; c < this.topo.N; c++) if (b.rKind[c] === PURPLE) this.angles.set(c, this.dirAngle(b.rDir[c]));
    this.needsDraw = true;
  }

  dirAngle(k) { return [0, Math.PI / 2, Math.PI, -Math.PI / 2][k]; }

  // Scale so the shape fills the space between the top and bottom bars.
  fit() {
    if (this.topo) this.base = this.scaleFor(this.q);
  }

  // The scale at which the whole shape fills that space, seen in view q.
  scaleFor(q) {
    const M = quat.toMat(q), C = this.topo.center, D = this.topo.dims;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      const p = rot(M, [(i & 1 ? D[0] : 0) - C[0], (i & 2 ? D[1] : 0) - C[1], (i & 4 ? D[2] : 0) - C[2]]);
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }
    const availW = Math.max(100, this.w - 28);
    const availH = Math.max(100, this.h - this.inset.top - this.inset.bottom - 20);
    return Math.min(availW / (x1 - x0), availH / (y1 - y0)) * 0.94;
  }

  cellPos(c) {
    const p = this.topo.pos;
    return [p[c * 3], p[c * 3 + 1], p[c * 3 + 2]];
  }

  // ---- arrow shapes ---------------------------------------------------------------

  // The route of one snake as a polyline: its body, then (when it moves) the
  // points its head passes, then (when it leaves) a straight run into the air.
  track(cells, path = [], exit = null) {
    const T = this.topo, b = this.board;
    const pts = [this.cellPos(cells[0])], segN = [], segP = [], edge = [false];
    for (let i = 1; i < cells.length; i++) {
      const a = cells[i - 1], c = cells[i];
      if (T.planeOf[a] !== T.planeOf[c] || T.nrm[a] !== T.nrm[c]) {
        pts.push(b.edgePoint(a, c)); segN.push(T.nrm[a]); segP.push(T.planeOf[a]); edge.push(true);
        pts.push(this.cellPos(c)); segN.push(T.nrm[c]); segP.push(T.planeOf[c]); edge.push(false);
      } else {
        pts.push(this.cellPos(c)); segN.push(T.nrm[a]); segP.push(T.planeOf[a]); edge.push(false);
      }
    }
    const bodyEnd = pts.length;
    for (const q of path) { pts.push([q[0], q[1], q[2]]); segN.push(q[3]); segP.push(-1); edge.push(!!q[4]); }
    let exitAt = Infinity;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    if (exit) {
      exitAt = cum[cum.length - 1];
      const last = pts[pts.length - 1], dv = AXIS_VEC[exit.d];
      for (let j = 1; j <= cells.length + AIR_FADE + 3; j++) {
        pts.push([last[0] + dv[0] * j, last[1] + dv[1] * j, last[2] + dv[2] * j]);
        segN.push(exit.f); segP.push(-1); edge.push(false);
        cum.push(exitAt + j);
      }
    }
    // Round joins only where the path turns within a face.
    const turn = pts.map((p, i) => {
      if (i === 0 || i === pts.length - 1 || edge[i] || segN[i - 1] !== segN[i]) return false;
      const a = pts[i - 1], c = pts[i + 1];
      return Math.abs((p[0] - a[0]) * (c[0] - p[0]) + (p[1] - a[1]) * (c[1] - p[1]) + (p[2] - a[2]) * (c[2] - p[2])) < 0.5;
    });
    return { pts, segN, segP, cum, turn, bodyEnd, L: cum[bodyEnd - 1], exitAt };
  }

  pointAt(tr, x) {
    let i = 1;
    while (i < tr.pts.length - 1 && tr.cum[i] < x) i++;
    const s0 = tr.cum[i - 1], s1 = tr.cum[i];
    const k = s1 > s0 ? Math.max(0, Math.min(1, (x - s0) / (s1 - s0))) : 0;
    const a = tr.pts[i - 1], b = tr.pts[i];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1;
    return { p: lerp3(a, b, k), t: [(b[0] - a[0]) / len, (b[1] - a[1]) / len, (b[2] - a[2]) / len], f: tr.segN[i - 1] };
  }

  // Draw the stretch [x0, x1] of a track. color(x) gives the colour at arc
  // position x; heads says which ends get arrowheads.
  strokeTrack(m, tr, x0, x1, width, color, headFront, headBack, headScale = 1) {
    for (let i = 1; i < tr.pts.length; i++) {
      const s0 = tr.cum[i - 1], s1 = tr.cum[i];
      if (s1 <= x0 || s0 >= x1 || s1 <= s0) continue;
      const a = Math.max(s0, x0), b = Math.min(s1, x1);
      const P = lerp3(tr.pts[i - 1], tr.pts[i], (a - s0) / (s1 - s0));
      const Q = lerp3(tr.pts[i - 1], tr.pts[i], (b - s0) / (s1 - s0));
      segment(m, P, Q, NV[tr.segN[i - 1]], width, color(a), color(b));
    }
    for (let i = 1; i < tr.pts.length - 1; i++) {
      if (tr.turn[i] && tr.cum[i] > x0 && tr.cum[i] < x1) disc(m, tr.pts[i], tr.segN[i], width / 2, color(tr.cum[i]));
    }
    const back = this.pointAt(tr, x0);
    if (headBack) arrowhead(m, back.p, back.t.map((v) => -v), NV[back.f], color(x0), headScale);
    else disc(m, back.p, back.f, width / 2, color(x0));
    if (headFront) {
      const front = this.pointAt(tr, x1);
      arrowhead(m, front.p, front.t, NV[front.f], color(x1), headScale);
    }
  }

  // A resting arrow: every path of the piece. Each path ends in a head; a
  // two-way arrow's path starts with one too. (A fork's second path starts at
  // the junction, where a round join covers the seam.)
  pieceMesh(m, p, width, override, headScale) {
    const two = p.kind === TWO_WAY;
    for (const cells of p.paths) {
      const tr = this.track(cells);
      const color = override ? () => override : two ? (x) => twoColor(p.green, x / tr.L) : () => inkOf(p.kind);
      this.strokeTrack(m, tr, 0, tr.L, width, color, true, two, headScale);
    }
  }

  // Each arrow, cut into pieces per plane in that plane's 2D coordinates, for tapping.
  pickGeometry(p) {
    const T = this.topo;
    const segs = [], heads = [];
    p.paths.forEach((cells, pi) => {
      const tr = this.track(cells);
      for (let i = 1; i < tr.pts.length; i++) {
        const P = tr.segP[i - 1];
        if (P < 0) continue;
        const pl = T.planes[P];
        const a = tr.pts[i - 1], b = tr.pts[i];
        segs.push([P, a[pl.b], a[pl.c], b[pl.b], b[pl.c], tr.cum[i - 1], tr.cum[i], pi]);
      }
    });
    const L = p.paths[0].length - 1;
    const addHead = (cells, dir, along) => {
      const h = cells[cells.length - 1], P = T.planeOf[h], pl = T.planes[P];
      const D = AXIS_VEC[SPACE[T.nrm[h] * 4 + dir]], c = this.cellPos(h);
      heads.push([P, c[pl.b] + D[pl.b] * 0.15, c[pl.c] + D[pl.c] * 0.15, along]);
    };
    for (const sn of p.options[0]) addHead(sn.cells, sn.dir, L);
    if (p.kind === TWO_WAY) addHead(p.options[1][0].cells, p.options[1][0].dir, 0);
    return { segs, heads, len: L };
  }

  // ---- transforms -------------------------------------------------------------------

  updateTransforms() {
    const M = quat.toMat(this.q);
    const s = this.base * this.zoom * this.shrink;
    const cx = this.w / 2 + this.pan[0];
    const cy = this.inset.top + (this.h - this.inset.top - this.inset.bottom) / 2 + this.pan[1];
    this.M = M; this.s = s; this.cx = cx; this.cy = cy;
    const C = this.topo ? this.topo.center : [0, 0, 0];
    const sx = (2 * s) / this.w, sy = (2 * s) / this.h, sz = -1 / (this.zr || 100);
    const ox = (2 * cx) / this.w - 1, oy = 1 - (2 * cy) / this.h;
    const r = [
      [sx * M[0], sx * M[1], sx * M[2], ox - sx * (M[0] * C[0] + M[1] * C[1] + M[2] * C[2])],
      [sy * M[3], sy * M[4], sy * M[5], oy - sy * (M[3] * C[0] + M[4] * C[1] + M[5] * C[2])],
      [sz * M[6], sz * M[7], sz * M[8], -sz * (M[6] * C[0] + M[7] * C[1] + M[8] * C[2])],
    ];
    this.mvp = new Float32Array([
      r[0][0], r[1][0], r[2][0], 0,
      r[0][1], r[1][1], r[2][1], 0,
      r[0][2], r[1][2], r[2][2], 0,
      r[0][3], r[1][3], r[2][3], 1,
    ]);
    this.rotMat = new Float32Array([M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]]);
  }

  project(p) {
    const C = this.topo.center;
    const v = rot(this.M, [p[0] - C[0], p[1] - C[1], p[2] - C[2]]);
    return [this.cx + this.s * v[0], this.cy - this.s * v[1]];
  }

  // Does cell c face the camera? (Ignores whether something is in front of it.)
  facing(c) {
    return rot(this.M || quat.toMat(this.q), NV[this.topo.nrm[c]])[2] > 1e-4;
  }

  // ---- camera ---------------------------------------------------------------------

  rotateBy(dx, dy) {
    const k = 0.0085;
    this.q = quat.norm(quat.mul(quat.axis([1, 0, 0], dy * k), quat.mul(quat.axis([0, 1, 0], dx * k), this.q)));
    this.cam = null;
    this.needsDraw = true;
  }

  // Big shapes can be zoomed in further, to about ten cubes across.
  maxZoom() {
    return this.topo ? Math.max(6, Math.max(...this.topo.dims) / 2.5) : 6;
  }

  zoomAt(factor, x, y) {
    const z0 = this.zoom, z1 = Math.max(0.6, Math.min(this.maxZoom(), z0 * factor));
    const cx = this.w / 2 + this.pan[0];
    const cy = this.inset.top + (this.h - this.inset.top - this.inset.bottom) / 2 + this.pan[1];
    this.pan[0] += (x - cx) * (1 - z1 / z0);
    this.pan[1] += (y - cy) * (1 - z1 / z0);
    this.zoom = z1;
    this.cam = null;
    this.needsDraw = true;
  }

  panBy(dx, dy) {
    this.pan[0] += dx;
    this.pan[1] += dy;
    this.cam = null;
    this.needsDraw = true;
  }

  animateView(target, ms = 450) {
    this.cam = {
      from: { q: this.q, zoom: this.zoom, pan: this.pan.slice() },
      to: { q: target.q || this.q, zoom: target.zoom ?? this.zoom, pan: target.pan || this.pan.slice() },
      start: performance.now(), ms,
    };
  }

  resetView() {
    if (this.topo) this.animateView({ q: defaultView(this.topo.dims), zoom: 1, pan: [0, 0] });
  }

  // The view looking straight at side f of the shape (f numbered as in
  // FACE_DEFS), reached by the smallest turn from the current view and then
  // squared up so the shape sits level on screen.
  faceView(f) {
    const M = quat.toMat(this.q), n = NV[f];
    const from = rot(M, n), axis = cross(from, [0, 0, 1]), s = Math.hypot(axis[0], axis[1], axis[2]);
    const ang = Math.atan2(s, from[2]);
    const turn = s > 1e-6 ? quat.axis(axis.map((x) => x / s), ang) : ang > 1 ? quat.axis([1, 0, 0], Math.PI) : [0, 0, 0, 1];
    const T = quat.toMat(quat.mul(turn, this.q));
    return squareView(n, [T[3], T[4], T[5]]);
  }

  // A quarter turn, landing square on a side: left and right (dx = -1, 1)
  // spin the shape round its upright axis like a turntable, bringing the side
  // on that side round to face you; up and down (dy = -1, 1) tip it towards
  // or away from you.
  quarterTurn(dx, dy) {
    const q = dx ? quat.mul(this.q, quat.axis([0, 1, 0], (-dx * Math.PI) / 2)) : quat.mul(quat.axis([1, 0, 0], (-dy * Math.PI) / 2), this.q);
    const T = quat.toMat(q);
    return squareView(nearestAxis([T[6], T[7], T[8]]), [T[3], T[4], T[5]]);
  }

  // Turn to view q. Zoomed right out, the whole shape stays in view, as big
  // as fits; zoomed in, the spot in the middle of the screen stays there.
  turnTo(q) {
    if (!this.topo) return;
    if (this.zoom <= 1.05 * this.scaleFor(this.q) / this.base) {
      return this.animateView({ q, zoom: this.scaleFor(q) / this.base, pan: [0, 0] }, 520);
    }
    const f = this.focus(), C = this.topo.center, s = this.base * this.zoom;
    const v = rot(quat.toMat(q), [f[0] - C[0], f[1] - C[1], f[2] - C[2]]);
    this.animateView({ q, pan: [-s * v[0], s * v[1]] }, 520);
  }

  // Turn and slide the view so cell c is in plain sight. A small shape is
  // shown whole; on a big one the view closes in until the cell is easy to tap.
  showCell(c) {
    this.updateTransforms();
    const M = this.M;
    const q = canSee(this.topo, c, [M[6], M[7], M[8]]) ? this.q : this.turnedTo(c);
    const need = TAP_PX / this.base;
    if (need <= 1) {
      this.animateView({ q, zoom: Math.min(this.zoom, 1.6), pan: [0, 0] }, 520);
      return;
    }
    const zoom = Math.min(this.maxZoom(), Math.max(this.zoom, need));
    const p = this.cellPos(c), C = this.topo.center;
    const v = rot(quat.toMat(q), [p[0] - C[0], p[1] - C[1], p[2] - C[2]]);
    const s = this.base * zoom;
    this.animateView({ q, zoom, pan: [-s * v[0], s * v[1]] }, 520);
  }

  // A view with nothing in front of cell c: its face seen a little from above
  // and to one side, like the starting view, if that works; otherwise along
  // a clear line of sight, keeping "up" on screen as close to now as it can.
  turnedTo(c) {
    const T = this.topo, n = NV[T.nrm[c]];
    const nv = rot(this.M, n);
    const yaw = Math.atan2(nv[0], nv[2]);
    let q = quat.mul(quat.axis([0, 1, 0], -yaw), this.q);
    const n2 = rot(quat.toMat(q), n);
    q = quat.mul(quat.axis([1, 0, 0], Math.atan2(n2[1], n2[2]) + 0.42), q);
    q = quat.norm(quat.mul(quat.axis([0, 1, 0], yaw > 0 ? 0.45 : -0.45), q));
    const Q = quat.toMat(q);
    if (canSee(T, c, [Q[6], Q[7], Q[8]])) return q;
    const z = viewOf(T, c) || n;
    let x = cross([this.M[3], this.M[4], this.M[5]], z);
    if (Math.hypot(x[0], x[1], x[2]) < 0.1) {
      const r = [this.M[0], this.M[1], this.M[2]], k = dot3(r, z);
      x = [r[0] - k * z[0], r[1] - k * z[1], r[2] - k * z[2]];
    }
    x = norm3(x);
    const y = cross(z, x);
    return quat.fromMat([x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2]]);
  }

  // Shrink the empty glass shape away at the end of a level.
  vanish() {
    this.vanishAt = performance.now();
    this.needsDraw = true;
  }

  // ---- animation --------------------------------------------------------------------

  // An arrow sliding away (or bumping and coming back). res must come from a
  // traced move (board.tryMove(pid, opt, true)).
  addMover(pid, opt, res, bump) {
    const p = this.board.pieces[pid];
    const tracks = p.options[opt].map((sn, s) => this.track(sn.cells, res.pts ? res.pts[s] : [], bump ? null : res.exits[s]));
    const m = { pid, opt, kind: p.kind, green: p.green, tracks, bump, start: performance.now(), d: 0, flips: [] };
    if (bump) {
      // An arrow that would only go round in circles just nudges forward.
      m.peak = res.by === LOOP ? 1.3 : Math.max(0.3, res.step - 1 + 0.3);
      m.t1 = Math.min(0.32, 0.08 + m.peak * 0.035);
      m.t2 = m.t1 * 1.3;
      this.hidden.add(pid);
      this.refresh();
    } else {
      // Done once the tail has passed the point of leaving and faded out.
      m.total = Math.max(...tracks.map((tr) => tr.exitAt + AIR_FADE + 1));
      if (res.flips) for (let i = 0; i < res.flips.length; i += 2) m.flips.push({ cell: res.flips[i], step: res.flips[i + 1], done: false });
    }
    this.movers.push(m);
    this.needsDraw = true;
    return m;
  }

  spin(cell) {
    const from = this.angles.get(cell) ?? 0;
    this.spins = this.spins.filter((s) => s.cell !== cell);
    this.spins.push({ cell, from, to: from + Math.PI, start: performance.now() });
  }

  setHint(pid) {
    this.hintPid = pid;
    this.hintStart = performance.now();
    this.needsDraw = true;
  }

  flashPiece(pid) {
    this.flash.set(pid, performance.now());
    this.needsDraw = true;
  }

  // Advance animations and draw if anything changed. Returns true while
  // something is still moving.
  frame(now) {
    let busy = false;
    if (this.cam) {
      const c = this.cam, k = Math.min(1, (now - c.start) / c.ms), e = ease(k);
      this.q = quat.slerp(c.from.q, c.to.q, e);
      this.zoom = c.from.zoom + (c.to.zoom - c.from.zoom) * e;
      this.pan = [c.from.pan[0] + (c.to.pan[0] - c.from.pan[0]) * e, c.from.pan[1] + (c.to.pan[1] - c.from.pan[1]) * e];
      if (k >= 1) this.cam = null;
      busy = true;
    }
    if (this.movers.length) {
      const keep = [];
      for (const m of this.movers) {
        const t = (now - m.start) / 1000;
        if (m.bump) {
          if (t < m.t1) m.d = m.peak * (1 - (1 - t / m.t1) ** 2);
          else if (t < m.t1 + m.t2) m.d = m.peak * (1 - ease((t - m.t1) / m.t2));
          else { m.d = 0; this.hidden.delete(m.pid); this.refresh(); continue; }
        } else {
          m.d = 9 * t + 34 * t * t;
          for (const fl of m.flips) if (!fl.done && m.d >= fl.step - 0.4) { fl.done = true; this.spin(fl.cell); }
          if (m.d >= m.total) continue;
        }
        keep.push(m);
      }
      this.movers = keep;
      busy = true;
    }
    if (this.spins.length) {
      this.spins = this.spins.filter((s) => {
        const k = Math.min(1, (now - s.start) / 280);
        this.angles.set(s.cell, s.from + (s.to - s.from) * ease(k));
        return k < 1;
      });
      busy = true;
    }
    if (this.flash.size) {
      for (const [pid, t0] of this.flash) if (now - t0 > 750) this.flash.delete(pid);
      busy = true;
    }
    if (this.hintPid >= 0) {
      if (now - this.hintStart > 6000) this.hintPid = -1;
      busy = true;
    }
    if (this.vanishAt) {
      const k = Math.min(1, (now - this.vanishAt) / 700);
      this.shrink = 1 - ease(k) * 0.9;
      this.alpha = 1 - k;
      this.q = quat.norm(quat.mul(quat.axis([0, 1, 0], 0.05 * (1 - k)), this.q));
      if (k < 1) busy = true;
    }
    if ((busy || this.needsDraw) && !this.lost) {
      this.draw(now);
      this.needsDraw = false;
    }
    return busy;
  }

  // ---- drawing ------------------------------------------------------------------------

  // Moving arrows and the markers, rebuilt every frame.
  buildDynamic() {
    const m = this.dyn, b = this.board, T = this.topo;
    m.clear();
    for (const c of this.markers) {
      const f = T.nrm[c], { n, u, v } = FACE_DEFS[f];
      const kind = b.rKind[c];
      const ang = kind === PURPLE ? this.angles.get(c) : this.dirAngle(b.rDir[c]);
      const cs = Math.cos(ang), sn = Math.sin(ang);
      const X = [u[0] * cs + v[0] * sn, u[1] * cs + v[1] * sn, u[2] * cs + v[2] * sn];
      const Y = [-u[0] * sn + v[0] * cs, -u[1] * sn + v[1] * cs, -u[2] * sn + v[2] * cs];
      const P = this.cellPos(c);
      if (kind === BLUE) {
        for (const x of [-0.15, 0.15]) chevron(m, P, X, Y, n, [[x - 0.14, -0.29], [x + 0.12, 0], [x - 0.14, 0.29]], 0.15, BLUE_INK);
      } else {
        chevron(m, P, X, Y, n, [[-0.02, -0.32], [0.26, 0], [-0.02, 0.32]], 0.16, PURPLE_INK);
        disc(m, [P[0] - X[0] * 0.22, P[1] - X[1] * 0.22, P[2] - X[2] * 0.22], f, 0.1, PURPLE_INK);
      }
    }
    for (const mv of this.movers) {
      const two = mv.kind === TWO_WAY;
      for (const tr of mv.tracks) {
        const x0 = mv.d, x1 = mv.d + tr.L;
        const fade = (x) => (x > tr.exitAt ? Math.max(0, 1 - (x - tr.exitAt) / AIR_FADE) : 1);
        const color = two
          ? (x) => twoColor(mv.green, mv.opt === 0 ? (x - x0) / tr.L : 1 - (x - x0) / tr.L, fade(x))
          : (x) => withAlpha(inkOf(mv.kind), fade(x));
        this.strokeTrack(m, tr, x0, x1, BODY, color, true, two);
      }
    }
  }

  draw(now) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.depthMask(true);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!this.board || this.alpha <= 0) return;
    this.updateTransforms();
    this.buildDynamic();
    const B = this.bufs, A = this.alpha;
    gl.bindBuffer(gl.ARRAY_BUFFER, B.dyn);
    gl.bufferData(gl.ARRAY_BUFFER, this.dyn.a.subarray(0, this.dyn.n * 7), gl.STREAM_DRAW);
    const arrows = this.arrowMesh.n, dyn = this.dyn.n;

    // 1. Remember the nearest glass surface.
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.depthFunc(gl.LESS);
    gl.colorMask(false, false, false, false);
    this.drawGlass([0, 0, 0, 0], [0, 0, 0, 0]);
    gl.colorMask(true, true, true, true);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // 2-3. Whatever is hidden behind it: faint glass, ghost arrows.
    gl.depthFunc(gl.GREATER);
    this.drawGlass([206 / 255, 224 / 255, 250 / 255, 0.28], [0, 0, 0, 0]);
    this.drawFlat(B.arrows, arrows, [1, 1, 1, A], true);
    this.drawFlat(B.dyn, dyn, [1, 1, 1, A], true);
    this.drawFlat(B.yellow, this.yellowMesh.n, [1, 1, 1, 0.35 * A], false);

    // 4. The nearest glass, frosting all of that.
    gl.depthFunc(gl.LEQUAL);
    this.drawGlass([168 / 255, 185 / 255, 230 / 255, 0.66], [128 / 255, 112 / 255, 60 / 255, 0.06], 0.75);

    // 5. Visible arrows.
    if (this.hintPid >= 0 && this.board.present[this.hintPid]) {
      if (this.uploadedHint !== this.hintPid) {
        const hm = new Mesh(512);
        this.pieceMesh(hm, this.board.pieces[this.hintPid], BODY + 0.34, PINK, 1.45);
        gl.bindBuffer(gl.ARRAY_BUFFER, B.hint);
        gl.bufferData(gl.ARRAY_BUFFER, hm.a.subarray(0, hm.n * 7), gl.DYNAMIC_DRAW);
        this.hintCount = hm.n;
        this.uploadedHint = this.hintPid;
      }
      const pulse = 0.5 + 0.4 * Math.sin((now - this.hintStart) / 160);
      this.drawFlat(B.hint, this.hintCount, [1, 1, 1, pulse * A], false);
    }
    this.drawFlat(B.arrows, arrows, [1, 1, 1, A], false);
    this.drawFlat(B.dyn, dyn, [1, 1, 1, A], false);
    for (const [pid, t0] of this.flash) {
      if (!this.board.present[pid]) continue;
      const fm = new Mesh(512);
      this.pieceMesh(fm, this.board.pieces[pid], BODY + 0.02, RED, 1.05);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.flash);
      gl.bufferData(gl.ARRAY_BUFFER, fm.a.subarray(0, fm.n * 7), gl.STREAM_DRAW);
      this.drawFlat(B.flash, fm.n, [1, 1, 1, Math.max(0, 1 - (now - t0) / 750) * A], false);
    }

    // 6. Edges.
    this.drawFlat(B.edges, this.edgeMesh.n, [1, 1, 1, A], false);
    this.drawFlat(B.yellow, this.yellowMesh.n, [1, 1, 1, A], false);
  }

  drawFlat(buf, count, tint, ghost) {
    if (!count) return;
    const gl = this.gl, P = this.flatProg;
    gl.useProgram(P.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
    gl.uniformMatrix4fv(P.uMVP, false, this.mvp);
    gl.uniform4fv(P.uTint, tint);
    gl.uniform1f(P.uGhost, ghost ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, count);
  }

  drawGlass(base, lit, ao = 0) {
    const gl = this.gl, P = this.glassProg;
    gl.useProgram(P.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.glass);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 28, 12);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 28, 24);
    gl.uniformMatrix4fv(P.uMVP, false, this.mvp);
    gl.uniformMatrix3fv(P.uRot, false, this.rotMat);
    gl.uniform3fv(P.uLight, LIGHT);
    gl.uniform4fv(P.uBase, base);
    gl.uniform4fv(P.uLit, lit);
    gl.uniform1f(P.uAo, ao);
    gl.uniform1f(P.uAlpha, this.alpha);
    gl.drawArrays(gl.TRIANGLES, 0, this.topo.N * 6);
    gl.disableVertexAttribArray(2);
  }

  // ---- picking --------------------------------------------------------------------------

  // The arrow under screen point (x, y), and how far along it the tap was.
  pick(x, y) {
    if (!this.board) return null;
    this.updateTransforms();
    const hit = this.castRay(x, y);
    if (!hit) return null;
    const T = this.topo, b = this.board;
    const P = T.planeOf[hit.cell], pl = T.planes[P];
    const u = hit.point[pl.b], v = hit.point[pl.c];
    const cand = new Set();
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const i = T.gi[hit.cell] + di, j = T.gj[hit.cell] + dj;
        if (i < 0 || j < 0 || i >= pl.nb || j >= pl.nc) continue;
        const c = pl.cells[i * pl.nc + j];
        if (c >= 0 && b.occ[c] >= 0 && !this.hidden.has(b.occ[c])) cand.add(b.occ[c]);
      }
    }
    let best = null;
    for (const pid of cand) {
      const g = this.geo[pid];
      for (const s of g.segs) {
        if (s[0] !== P) continue;
        const [dist, k] = segDist(u, v, s[1], s[2], s[3], s[4]);
        if (!best || dist < best.dist) best = { pid, dist, along: s[7] === 0 ? s[5] + (s[6] - s[5]) * k : -1 };
      }
      for (const h of g.heads) {
        if (h[0] !== P) continue;
        const dist = Math.hypot(u - h[1], v - h[2]) * 0.9;
        if (!best || dist < best.dist) best = { pid, dist, along: h[3] };
      }
    }
    if (!best || best.dist > 0.72) return null;
    return { pid: best.pid, along: best.along, len: this.geo[best.pid].len };
  }

  // Follow the line of sight through the grid of cubes to the first cell it meets.
  castRay(x, y) {
    const T = this.topo, M = this.M, C = T.center, D = T.dims;
    const vx = (x - this.cx) / this.s, vy = -(y - this.cy) / this.s, vz = this.zr;
    const o = [
      C[0] + M[0] * vx + M[3] * vy + M[6] * vz,
      C[1] + M[1] * vx + M[4] * vy + M[7] * vz,
      C[2] + M[2] * vx + M[5] * vy + M[8] * vz,
    ];
    const d = [-M[6], -M[7], -M[8]];
    let t0 = -Infinity, t1 = Infinity, axis = 0;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(d[a]) < 1e-9) {
        if (o[a] < 0 || o[a] > D[a]) return null;
        continue;
      }
      const ta = (0 - o[a]) / d[a], tb = (D[a] - o[a]) / d[a];
      const lo = Math.min(ta, tb);
      if (lo > t0) { t0 = lo; axis = a; }
      t1 = Math.min(t1, Math.max(ta, tb));
    }
    if (t0 > t1 || t1 < 0) return null;
    let t = Math.max(t0, 0);
    const p = [o[0] + d[0] * (t + 1e-7), o[1] + d[1] * (t + 1e-7), o[2] + d[2] * (t + 1e-7)];
    const v = p.map((c, a) => Math.min(D[a] - 1, Math.max(0, Math.floor(c))));
    const step = d.map((c) => (c > 0 ? 1 : -1));
    const tMax = d.map((c, a) => (Math.abs(c) < 1e-9 ? Infinity : ((c > 0 ? v[a] + 1 : v[a]) - o[a]) / c));
    const tDelta = d.map((c) => (Math.abs(c) < 1e-9 ? Infinity : Math.abs(1 / c)));
    for (let guard = 0; guard < D[0] + D[1] + D[2] + 3; guard++) {
      if (T.isSolid(v[0], v[1], v[2])) {
        const f = axis * 2 + (step[axis] > 0 ? 1 : 0); // the face we came in through points back at us
        const cell = T.cellOf[T.vid(v[0], v[1], v[2]) * 6 + f];
        if (cell < 0) return null;
        return { cell, point: [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t] };
      }
      axis = tMax[0] < tMax[1] ? (tMax[0] < tMax[2] ? 0 : 2) : tMax[1] < tMax[2] ? 1 : 2;
      t = tMax[axis];
      v[axis] += step[axis];
      if (v[axis] < 0 || v[axis] >= D[axis]) return null;
      tMax[axis] += tDelta[axis];
    }
    return null;
  }

  // Share of an arrow that is on screen with nothing in front of it (for
  // choosing hints).
  visibility(pid) {
    this.updateTransforms();
    const M = this.M, toCam = [M[6], M[7], M[8]];
    const cells = this.board.pieces[pid].cells;
    const top = this.inset.top + 6, bottom = this.h - this.inset.bottom - 6;
    let seen = 0;
    for (const c of cells) {
      const [x, y] = this.project(this.cellPos(c));
      if (x >= 6 && x <= this.w - 6 && y >= top && y <= bottom && canSee(this.topo, c, toCam)) seen++;
    }
    return cells.length ? seen / cells.length : 0;
  }

  // The point on the shape in the middle of the screen (or the middle of the
  // shape, if the middle of the screen is empty).
  focus() {
    this.updateTransforms();
    const hit = this.castRay(this.cx - this.pan[0], this.cy - this.pan[1]);
    return hit ? hit.point : this.topo.center;
  }
}

function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return [Math.hypot(px - x1 - dx * t, py - y1 - dy * t), t];
}
