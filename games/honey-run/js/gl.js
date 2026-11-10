// Honey Run: a small 3D renderer on WebGL. Everything is flat-shaded,
// vertex-coloured triangles (no textures): lit by a sun and the sky, faded
// into the horizon by fog, and bent gently down and sideways with distance
// so the line seems to roll away over the hills. Shadows are the models
// themselves, squashed flat onto the ground along the sunlight.

// ---- matrices (4x4, column-major, as WebGL likes them) --------------------------------

export const M = {
  ident: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  mul(a, b, out = new Float32Array(16)) {
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      out[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
      out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
      out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return out;
  },
  move: (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]),
  scale: (x, y = x, z = x) => new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]),
  rotX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  },
  rotY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  },
  rotZ(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  },
  // Several in a row: chain(A, B, C) applies C first, then B, then A.
  chain(...ms) {
    let out = ms[0];
    for (let i = 1; i < ms.length; i++) out = M.mul(out, ms[i]);
    return out;
  },
  perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  },
  lookAt(eye, at, up = [0, 1, 0]) {
    let zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2];
    let l = Math.hypot(zx, zy, zz) || 1;
    zx /= l; zy /= l; zz /= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    l = Math.hypot(xx, xy, xz) || 1;
    xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]), -(yx * eye[0] + yy * eye[1] + yz * eye[2]), -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1]);
  },
  // A point through a matrix (w divided out).
  point(m, x, y, z) {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w];
  },
};

// ---- colours --------------------------------------------------------------------------

// '#rrggbb' to [r, g, b] in 0..1, made linear-ish so mixing looks right.
const cache = new Map();
export function rgb(hex) {
  let c = cache.get(hex);
  if (!c) {
    const n = parseInt(hex.slice(1), 16);
    c = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    cache.set(hex, c);
  }
  return c;
}
export const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const shade = (c, k) => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)];
const asColor = (c) => (typeof c === 'string' ? rgb(c) : c);

// ---- building models -------------------------------------------------------------------

// Collects triangles: 9 numbers a corner (where, which way it faces, colour).
export class Builder {
  constructor() {
    this.data = [];
    this.stack = [];
    this.m = null; // a matrix applied to everything added (null: none)
  }

  // Everything added inside fn is moved by matrix m.
  with(m, fn) {
    this.stack.push(this.m);
    this.m = this.m ? M.mul(this.m, m) : m;
    fn();
    this.m = this.stack.pop();
    return this;
  }

  tri(a, b, c, color) {
    const col = asColor(color), m = this.m;
    if (m) {
      a = M.point(m, a[0], a[1], a[2]);
      b = M.point(m, b[0], b[1], b[2]);
      c = M.point(m, c[0], c[1], c[2]);
    }
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    for (const p of [a, b, c]) this.data.push(p[0], p[1], p[2], nx, ny, nz, col[0], col[1], col[2]);
    return this;
  }

  // Four corners, anticlockwise seen from the front.
  quad(a, b, c, d, color) {
    this.tri(a, b, c, color);
    return this.tri(a, c, d, color);
  }

  // A box from corner to corner. opts: top / bottom / side colours,
  // noBottom / noTop to leave a face off.
  box(x0, y0, z0, x1, y1, z1, color, opts = {}) {
    if (x0 > x1) [x0, x1] = [x1, x0];
    if (y0 > y1) [y0, y1] = [y1, y0];
    if (z0 > z1) [z0, z1] = [z1, z0];
    const side = opts.side || color, top = opts.top || color;
    const a = [x0, y0, z1], b = [x1, y0, z1], c = [x1, y1, z1], d = [x0, y1, z1];
    const e = [x0, y0, z0], f = [x1, y0, z0], g = [x1, y1, z0], h = [x0, y1, z0];
    this.quad(a, b, c, d, opts.front || side); // facing +z (towards the camera)
    this.quad(f, e, h, g, opts.back || side);
    this.quad(e, a, d, h, side);
    this.quad(b, f, g, c, side);
    if (!opts.noTop) this.quad(d, c, g, h, top);
    if (!opts.noBottom) this.quad(e, f, b, a, opts.bottom || side);
    return this;
  }

  // A box given by its middle (x, z), its base y, and its size.
  block(x, y, z, w, h, d, color, opts) {
    return this.box(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, color, opts);
  }

  // A column with n sides standing on (x, y, z): radius r0 at the bottom,
  // r1 at the top (0 for a point). opts: top colour, turn (radians), sx / sz
  // to squash it, noCaps.
  column(n, x, y, z, r0, r1, h, color, opts = {}) {
    const turn = opts.turn ?? Math.PI / n, sx = opts.sx || 1, sz = opts.sz || 1;
    const ring = (r, yy) => Array.from({ length: n }, (_, k) => {
      const a = turn + (k * 2 * Math.PI) / n;
      return [x + Math.cos(a) * r * sx, yy, z + Math.sin(a) * r * sz];
    });
    const lo = ring(r0, y), hi = ring(r1, y + h);
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      if (r1 > 0) this.quad(lo[j], lo[k], hi[k], hi[j], color);
      else this.tri(lo[j], lo[k], [x, y + h, z], color);
    }
    if (!opts.noCaps) {
      if (r1 > 0) for (let k = 1; k < n - 1; k++) this.tri(hi[0], hi[k + 1], hi[k], opts.top || color);
      if (!opts.noBottom) for (let k = 1; k < n - 1; k++) this.tri(lo[0], lo[k], lo[k + 1], color);
    }
    return this;
  }

  // A lumpy ball: a low-poly sphere of the given radii.
  ball(x, y, z, rx, ry, rz, color, around = 7, up = 4, lower = null) {
    const pt = (i, j) => {
      const lat = -Math.PI / 2 + (Math.PI * j) / up, lon = (2 * Math.PI * i) / around;
      return [x + Math.cos(lat) * Math.cos(lon) * rx, y + Math.sin(lat) * ry, z + Math.cos(lat) * Math.sin(lon) * rz];
    };
    for (let j = 0; j < up; j++) {
      const col = lower && j < up / 2 ? lower : color;
      for (let i = 0; i < around; i++) {
        const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
        if (j === 0) this.tri(a, d, c, col);
        else if (j === up - 1) this.tri(a, d, b, col);
        else this.quad(a, d, c, b, col);
      }
    }
    return this;
  }

  get count() { return this.data.length / 9; }
}

// ---- the renderer ----------------------------------------------------------------------

const VERT = `
attribute vec3 aPos, aNor, aCol;
uniform mat4 uModel, uVP;
uniform vec3 uBend;      // how much the world drops and swings with distance, and the z it bends from
uniform vec3 uSun, uSunCol, uSky, uGround, uTint;
uniform vec2 uFog;       // where the fog starts and where it's complete
uniform float uLit;      // 1: lit by the sun and sky. 0: its own colour
uniform mediump float uShadow;   // 1: squash flat onto the ground along the sunlight
uniform float uPlane;    // the height of the ground the shadow falls on
varying vec3 vCol;
varying float vFog;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  if (uShadow > 0.5) {
    w.xyz -= uSun * ((w.y - uPlane) / uSun.y);
    w.y = uPlane;
  }
  float d = max(0.0, uBend.z - w.z);
  w.y -= uBend.x * d * d;
  w.x += uBend.y * d * d;
  vec3 n = normalize((uModel * vec4(aNor, 0.0)).xyz);
  vec3 light = mix(uGround, uSky, n.y * 0.5 + 0.5) + uSunCol * max(dot(n, uSun), 0.0);
  vCol = aCol * uTint * mix(vec3(1.0), light, uLit);
  float f = clamp((abs(uBend.z - w.z) - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
  vFog = f * f * (3.0 - 2.0 * f);
  gl_Position = uVP * w;
}`;

const FRAG = `
precision mediump float;
uniform vec3 uFogCol;
uniform float uAlpha, uShadow, uGlow;
varying vec3 vCol;
varying float vFog;
void main() {
  if (uShadow > 0.5) gl_FragColor = vec4(0.0, 0.02, 0.08, uAlpha * (1.0 - vFog));
  else if (uGlow > 0.5) gl_FragColor = vec4(vCol * (1.0 - vFog), 1.0);
  else gl_FragColor = vec4(mix(vCol, uFogCol, vFog), uAlpha);
}`;

// The sky: a wash from the top colour down to the horizon colour, with the
// sun's glow in it.
const SKY_VERT = `
attribute vec2 aPos;
varying vec2 vPos;
void main() { vPos = aPos; gl_Position = vec4(aPos, 0.999, 1.0); }`;
const SKY_FRAG = `
precision mediump float;
uniform vec3 uTop, uHorizon, uSunGlow;
uniform vec4 uSunAt;     // where the sun is on screen (x, y), the screen's shape, and how big its glow is
uniform float uLine;     // how high up the screen the horizon is (-1..1)
varying vec2 vPos;
void main() {
  float h = clamp((vPos.y - uLine) / (1.0 - uLine), 0.0, 1.0);
  vec3 c = mix(uHorizon, uTop, pow(h, 0.65));
  vec2 d = (vPos - uSunAt.xy) * vec2(uSunAt.z, 1.0);
  float r = length(d) / uSunAt.w;
  c += uSunGlow * (0.55 * exp(-r * 2.2) + 1.0 - smoothstep(0.13, 0.17, r));
  gl_FragColor = vec4(c, 1.0);
}`;

export class Renderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true, stencil: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL is not available');
    this.gl = gl;
    this.canvas = canvas;
    this.main = this.program(VERT, FRAG, ['aPos', 'aNor', 'aCol'],
      ['uModel', 'uVP', 'uBend', 'uSun', 'uSunCol', 'uSky', 'uGround', 'uTint', 'uFog', 'uLit', 'uShadow', 'uPlane', 'uFogCol', 'uAlpha', 'uGlow']);
    this.sky = this.program(SKY_VERT, SKY_FRAG, ['aPos'], ['uTop', 'uHorizon', 'uSunGlow', 'uSunAt', 'uLine']);
    this.skyQuad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyQuad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.sparks = { buf: gl.createBuffer(), data: new Float32Array(9 * 6 * 400), count: 0 };
    this.ident = M.ident();
    this.white = [1, 1, 1];
  }

  program(vs, fs, attribs, uniforms) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    attribs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    for (const name of uniforms) u[name] = gl.getUniformLocation(p, name);
    return { p, u };
  }

  // Turns a Builder into something to draw. The Builder isn't needed afterwards.
  mesh(builder) {
    const gl = this.gl, buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(builder.data), gl.STATIC_DRAW);
    return { buf, count: builder.count };
  }

  free(mesh) {
    if (mesh && mesh.buf) this.gl.deleteBuffer(mesh.buf);
  }

  resize(w, h, dpr) {
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.aspect = w / h;
  }

  // Starts a frame. look: { vp (view x projection), bend [down, sideways, fromZ],
  // sun (direction to it), sunCol, sky, ground, fogCol, fog [from, to], top,
  // sunGlow, horizon (-1..1 up the screen), sunAt [x, y] on screen }.
  begin(look) {
    const gl = this.gl;
    this.look = look;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearStencil(0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.CULL_FACE);
    // The sky first, behind everything.
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(this.sky.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyQuad);
    gl.enableVertexAttribArray(0);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(this.sky.u.uTop, look.top);
    gl.uniform3fv(this.sky.u.uHorizon, look.fogCol);
    gl.uniform3fv(this.sky.u.uSunGlow, look.sunGlow);
    gl.uniform4f(this.sky.u.uSunAt, look.sunAt[0], look.sunAt[1], this.aspect, look.sunSize || 0.5);
    gl.uniform1f(this.sky.u.uLine, look.horizon);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    const u = this.main.u;
    gl.useProgram(this.main.p);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.uniformMatrix4fv(u.uVP, false, look.vp);
    gl.uniform3fv(u.uBend, look.bend);
    gl.uniform3fv(u.uSun, look.sun);
    gl.uniform3fv(u.uSunCol, look.sunCol);
    gl.uniform3fv(u.uSky, look.sky);
    gl.uniform3fv(u.uGround, look.ground);
    gl.uniform3fv(u.uFogCol, look.fogCol);
    gl.uniform2fv(u.uFog, look.fog);
    gl.uniform1f(u.uShadow, 0);
    gl.uniform1f(u.uGlow, 0);
    gl.uniform1f(u.uPlane, 0.09);
    gl.uniform1f(u.uAlpha, 1);
    gl.uniform1f(u.uLit, 1);
    gl.uniform3fv(u.uTint, this.white);
    this.bound = null;
  }

  bind(mesh) {
    if (this.bound === mesh) return;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buf);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
    this.bound = mesh;
  }

  // Draws a mesh. opts: tint [r, g, b], unlit.
  draw(mesh, model = this.ident, opts = null) {
    if (!mesh || !mesh.count) return;
    const gl = this.gl, u = this.main.u;
    this.bind(mesh);
    gl.uniformMatrix4fv(u.uModel, false, model);
    if (opts) {
      if (opts.tint) gl.uniform3fv(u.uTint, opts.tint);
      if (opts.unlit) gl.uniform1f(u.uLit, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    if (opts) {
      if (opts.tint) gl.uniform3fv(u.uTint, this.white);
      if (opts.unlit) gl.uniform1f(u.uLit, 1);
    }
  }

  // Shadows: call shadows(true), draw the things that cast them (with
  // shadow()), then shadows(false). Each bit of ground is darkened once
  // however many shadows fall on it.
  shadows(on, strength = 0.3) {
    const gl = this.gl, u = this.main.u;
    if (on) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.enable(gl.STENCIL_TEST);
      gl.stencilFunc(gl.EQUAL, 0, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
      gl.uniform1f(u.uShadow, 1);
      gl.uniform1f(u.uAlpha, strength);
    } else {
      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      gl.uniform1f(u.uShadow, 0);
      gl.uniform1f(u.uAlpha, 1);
      gl.uniform1f(u.uPlane, 0.09);
    }
  }

  // plane: the height of the surface the shadow falls on.
  shadow(mesh, model = this.ident, plane = 0.09) {
    if (!mesh || !mesh.count) return;
    const gl = this.gl, u = this.main.u;
    this.bind(mesh);
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniform1f(u.uPlane, plane);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }

  // See-through things (drawn last, back to front by the caller).
  glass(mesh, model, alpha, opts = null) {
    const gl = this.gl, u = this.main.u;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.uniform1f(u.uAlpha, alpha);
    this.draw(mesh, model, opts);
    gl.uniform1f(u.uAlpha, 1);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  // Sparks: little squares of light facing the camera, added to what's
  // behind them. Each is [x, y, z, size, r, g, b]. right / up: the camera's
  // right and up directions.
  glow(list, right, up) {
    if (!list.length) return;
    const gl = this.gl, u = this.main.u, s = this.sparks;
    const n = Math.min(list.length, 400);
    const d = s.data;
    let o = 0;
    const corner = (p, sx, sy) => {
      const k = p[3];
      d[o++] = p[0] + (right[0] * sx + up[0] * sy) * k;
      d[o++] = p[1] + (right[1] * sx + up[1] * sy) * k;
      d[o++] = p[2] + (right[2] * sx + up[2] * sy) * k;
      d[o++] = 0; d[o++] = 1; d[o++] = 0;
      d[o++] = p[4]; d[o++] = p[5]; d[o++] = p[6];
    };
    for (let i = 0; i < n; i++) {
      const p = list[i];
      // A diamond reads as a twinkle.
      corner(p, -1, 0); corner(p, 0, -1); corner(p, 1, 0);
      corner(p, -1, 0); corner(p, 1, 0); corner(p, 0, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, s.buf);
    gl.bufferData(gl.ARRAY_BUFFER, d.subarray(0, o), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
    this.bound = null;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.depthMask(false);
    gl.uniformMatrix4fv(u.uModel, false, this.ident);
    gl.uniform1f(u.uLit, 0);
    gl.uniform1f(u.uGlow, 1);
    gl.drawArrays(gl.TRIANGLES, 0, n * 6);
    gl.uniform1f(u.uGlow, 0);
    gl.uniform1f(u.uLit, 1);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
}
