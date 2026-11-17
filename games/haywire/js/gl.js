// Haywire: a small 3D renderer on WebGL 2. No textures: everything is
// coloured triangles, with the surface patterns (bricks, ribs, planks,
// paving) worked out for each pixel from where it is in the world. The sun
// casts real shadows: the yard's are drawn once into a shadow map when the
// map loads, and the robots' into a second one every frame. Light from the
// sky and the lamps indoors is worked out once for each corner of the map
// (mesh.js) and handed in with it.

// ---- matrices (4x4, column-major) -----------------------------------------------------

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
  ortho(l, r, b, t, n, f) {
    return new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]);
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
  // The view of a camera at eye looking along yaw (0 is north) and pitch.
  view(eye, yaw, pitch, roll = 0) {
    const m = M.chain(M.rotZ(-roll), M.rotX(-pitch), M.rotY(yaw), M.move(-eye[0], -eye[1], -eye[2]));
    return m;
  },
  // The opposite of a matrix made only of turns and moves.
  rigidInverse(m) {
    const o = new Float32Array(16);
    o[0] = m[0]; o[1] = m[4]; o[2] = m[8];
    o[4] = m[1]; o[5] = m[5]; o[6] = m[9];
    o[8] = m[2]; o[9] = m[6]; o[10] = m[10];
    o[12] = -(m[0] * m[12] + m[1] * m[13] + m[2] * m[14]);
    o[13] = -(m[4] * m[12] + m[5] * m[13] + m[6] * m[14]);
    o[14] = -(m[8] * m[12] + m[9] * m[13] + m[10] * m[14]);
    o[15] = 1;
    return o;
  },
  point(m, x, y, z) {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w];
  },
};

// '#rrggbb' to [r, g, b] in 0..1.
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
const asColor = (c) => (typeof c === 'string' ? rgb(c) : c);

// ---- building models -------------------------------------------------------------------

// Collects triangles for a model: 9 numbers a corner (where, which way it
// faces, colour). Boxes are flat-shaded; columns and balls are shaded round.
export class Builder {
  constructor() {
    this.data = [];
    this.m = null;
    this.stack = [];
  }

  // Everything added inside fn is moved by matrix m (turns and moves only).
  with(m, fn) {
    this.stack.push(this.m);
    this.m = this.m ? M.mul(this.m, m) : m;
    fn();
    this.m = this.stack.pop();
    return this;
  }

  put(p, n, col) {
    const m = this.m;
    if (m) {
      const x = p[0], y = p[1], z = p[2], a = n[0], b = n[1], c = n[2];
      this.data.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14],
        m[0] * a + m[4] * b + m[8] * c, m[1] * a + m[5] * b + m[9] * c, m[2] * a + m[6] * b + m[10] * c, col[0], col[1], col[2]);
    } else this.data.push(p[0], p[1], p[2], n[0], n[1], n[2], col[0], col[1], col[2]);
  }

  tri(a, b, c, color, na = null, nb = na, nc = na) {
    const col = asColor(color);
    if (!na) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], l = Math.hypot(n[0], n[1], n[2]) || 1;
      na = nb = nc = [n[0] / l, n[1] / l, n[2] / l];
    }
    this.put(a, na, col);
    this.put(b, nb, col);
    this.put(c, nc, col);
    return this;
  }

  // Four corners, anticlockwise seen from the front.
  quad(a, b, c, d, color) {
    this.tri(a, b, c, color);
    return this.tri(a, c, d, color);
  }

  // A box from corner to corner. opts: top, bottom, front (+z), back colours.
  box(x0, y0, z0, x1, y1, z1, color, opts = {}) {
    if (x0 > x1) [x0, x1] = [x1, x0];
    if (y0 > y1) [y0, y1] = [y1, y0];
    if (z0 > z1) [z0, z1] = [z1, z0];
    const a = [x0, y0, z1], b = [x1, y0, z1], c = [x1, y1, z1], d = [x0, y1, z1];
    const e = [x0, y0, z0], f = [x1, y0, z0], g = [x1, y1, z0], h = [x0, y1, z0];
    this.quad(a, b, c, d, opts.front || color);
    this.quad(f, e, h, g, opts.back || color);
    this.quad(e, a, d, h, color);
    this.quad(b, f, g, c, color);
    this.quad(d, c, g, h, opts.top || color);
    this.quad(e, f, b, a, opts.bottom || color);
    return this;
  }

  // A box given by its middle and its size.
  cube(x, y, z, w, h, d, color, opts) {
    return this.box(x - w / 2, y - h / 2, z - d / 2, x + w / 2, y + h / 2, z + d / 2, color, opts);
  }

  // A round bar along the z axis from z0 to z1, n sides, radius r0 at z0 and r1 at z1.
  rod(x, y, z0, z1, r0, r1, color, n = 8, caps = true) {
    const col = asColor(color);
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const p00 = [x + c0 * r0, y + s0 * r0, z0], p10 = [x + c1 * r0, y + s1 * r0, z0];
      const p01 = [x + c0 * r1, y + s0 * r1, z1], p11 = [x + c1 * r1, y + s1 * r1, z1];
      const n0 = [c0, s0, 0], n1 = [c1, s1, 0];
      const flip = z1 > z0;
      if (flip) {
        this.tri(p00, p10, p11, col, n0, n1, n1);
        this.tri(p00, p11, p01, col, n0, n1, n0);
      } else {
        this.tri(p10, p00, p01, col, n1, n0, n0);
        this.tri(p10, p01, p11, col, n1, n0, n1);
      }
      if (caps) {
        const front = [0, 0, flip ? 1 : -1], back = [0, 0, flip ? -1 : 1];
        if (flip) {
          this.tri([x, y, z1], p01, p11, col, front);
          this.tri([x, y, z0], p10, p00, col, back);
        } else {
          this.tri([x, y, z1], p11, p01, col, front);
          this.tri([x, y, z0], p00, p10, col, back);
        }
      }
    }
    return this;
  }

  // A ball.
  ball(x, y, z, r, color, around = 10, up = 6) {
    const col = asColor(color);
    const pt = (i, j) => {
      const lat = -Math.PI / 2 + (Math.PI * j) / up, lon = (2 * Math.PI * i) / around;
      return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
    };
    const at = (n) => [x + n[0] * r, y + n[1] * r, z + n[2] * r];
    for (let j = 0; j < up; j++) {
      for (let i = 0; i < around; i++) {
        const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
        if (j > 0) this.tri(at(a), at(c), at(b), col, a, c, b);
        if (j < up - 1) this.tri(at(a), at(d), at(c), col, a, d, c);
      }
    }
    return this;
  }

  get count() { return this.data.length / 9; }
}

// ---- shaders ---------------------------------------------------------------------------

const VERT = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNor;
layout(location=2) in vec3 aCol;
layout(location=3) in vec3 aLight;
layout(location=4) in float aMat;
uniform mat4 uVP, uModel, uSun0, uSun1;
out vec3 vPos, vNor, vCol, vLight;
out float vMat;
out vec4 vS0, vS1;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vPos = w.xyz;
  vNor = mat3(uModel) * aNor;
  vCol = aCol;
  vLight = aLight;
  vMat = aMat;
  vec4 o = vec4(w.xyz + normalize(vNor) * 0.06, 1.0);
  vS0 = uSun0 * o;
  vS1 = uSun1 * o;
  gl_Position = uVP * w;
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
uniform sampler2DShadow uShadow0, uShadow1;
uniform vec3 uSunDir, uSunCol, uEye, uFogCol, uTint;
uniform vec2 uFog;
uniform float uEmit, uAlpha, uGloss, uFlat;
uniform vec4 uLPos[4];
uniform vec3 uLCol[4];
in vec3 vPos, vNor, vCol, vLight;
in float vMat;
in vec4 vS0, vS1;
out vec4 o;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
// A dark line wherever x is a whole number: 1 away from it, 0 on it. w is
// half its width. It fades out once it's thinner than a pixel.
float seam(float x, float w) {
  float d = abs(fract(x + 0.5) - 0.5), fw = fwidth(x);
  return mix(1.0, smoothstep(w - fw, w + fw, d), clamp(w / max(fw, 1e-5), 0.0, 1.0));
}

float shade(sampler2DShadow t, vec4 p, float texel, float bias) {
  vec3 c = p.xyz / p.w * 0.5 + 0.5;
  if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;
  // Four looks, each already a blend of four texels: a soft edge three texels wide.
  float z = c.z - bias, h = texel * 0.75;
  return 0.25 * (texture(t, vec3(c.xy + vec2(-h, -h), z)) + texture(t, vec3(c.xy + vec2(h, -h), z))
    + texture(t, vec3(c.xy + vec2(-h, h), z)) + texture(t, vec3(c.xy + vec2(h, h), z)));
}

void main() {
  vec3 n = normalize(vNor);
  vec3 c = pow(vCol * uTint, vec3(2.2));
  int mat = int(vMat + 0.5);
  // Where this pixel is on its surface, in metres.
  vec2 uv = abs(n.y) > 0.5 ? vPos.xz : abs(n.x) > 0.5 ? vPos.zy : vPos.xy;
  float wall = abs(n.y) > 0.5 ? 0.0 : 1.0;
  float k = 1.0, lift = 0.0;
  if (mat == 1) {          // paving: big slabs, a little grit
    k = 0.9 + 0.2 * noise(uv * 3.0) * noise(uv * 0.7 + 3.0);
    k *= 0.86 + 0.14 * seam(uv.x / 4.0, 0.008) * seam(uv.y / 4.0, 0.008);
  } else if (mat == 2) {   // ribbed metal
    float r = wall > 0.5 ? uv.x : uv.y;
    float rib = abs(fract(r * 4.0) - 0.5) * 2.0, fw = fwidth(r * 4.0);
    k = mix(0.94, 0.84 + 0.2 * smoothstep(0.2, 0.8, rib), clamp(1.0 - fw * 1.5, 0.0, 1.0));
    k *= 0.8 + 0.2 * seam((wall > 0.5 ? uv.y : uv.x) / 2.6, 0.012);
    k *= 0.95 + 0.1 * hash(floor(vec2(r * 4.0, 0.0)));
  } else if (mat == 3) {   // panels
    k = 0.82 + 0.18 * seam(uv.x / 2.0, 0.012) * seam(uv.y / 2.0, 0.012);
    k *= 0.93 + 0.12 * hash(floor(uv / 2.0));
  } else if (mat == 4) {   // planks in a frame
    vec2 f = fract(uv);
    float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
    float frame = smoothstep(0.09, 0.11, edge);
    k = mix(0.72, 0.92 + 0.14 * hash(floor(vec2(uv.x * 5.0, floor(uv.y)))), frame);
    k *= mix(1.0, 0.82 + 0.18 * seam(uv.x * 5.0, 0.06), frame);
  } else if (mat == 5) {   // hazard stripes
    float s = fract((vPos.x + vPos.y + vPos.z) * 1.4);
    float fw = fwidth((vPos.x + vPos.y + vPos.z) * 1.4);
    k = mix(0.55, mix(0.12, 1.0, smoothstep(0.5 - fw, 0.5 + fw, s) * (1.0 - smoothstep(1.0 - fw, 1.0, s)) + (1.0 - smoothstep(0.0, fw, s))), clamp(1.0 - fw, 0.0, 1.0));
  } else if (mat == 6) {   // tiles
    k = 0.84 + 0.16 * seam(uv.x, 0.012) * seam(uv.y, 0.012);
    k *= 0.94 + 0.1 * hash(floor(uv));
  } else if (mat == 7) {   // tread plate
    vec2 d = vec2(uv.x + uv.y, uv.x - uv.y) * 5.0;
    float fw = fwidth(d.x);
    k = mix(0.96, 0.93 + 0.07 * step(0.5, fract(d.x)) * step(0.5, fract(d.y)), clamp(1.0 - fw * 1.2, 0.0, 1.0));
    k *= 0.88 + 0.12 * seam(uv.x, 0.015) * seam(uv.y, 0.015);
  } else if (mat == 8) {   // brick
    float row = floor(uv.y * 4.0);
    vec2 b = vec2(uv.x * 2.0 + 0.5 * mod(row, 2.0), uv.y * 4.0);
    float mortar = wall > 0.5 ? seam(b.x, 0.03) * seam(b.y, 0.06) : 1.0;
    k = mix(1.18, 0.9 + 0.16 * hash(floor(b)), mortar);
    if (wall < 0.5) k = 0.9 + 0.1 * seam(uv.x / 2.0, 0.012) * seam(uv.y / 2.0, 0.012);
  } else if (mat == 9) {   // rough ground: blotches, large and small
    k = 0.82 + 0.22 * noise(uv * 0.35 + 9.0) + 0.12 * noise(uv * 2.7) - 0.06 * noise(uv * 9.0);
  }
  c *= k * k;

  // Light: what was worked out for the map (sky and lamps), plus the sun
  // where nothing shades it, plus flashes.
  float sun = max(dot(n, uSunDir), 0.0);
  if (sun > 0.0) sun *= shade(uShadow0, vS0, 1.0 / 4096.0, 0.0006);
  if (sun > 0.0) sun *= shade(uShadow1, vS1, 1.0 / 1024.0, 0.0015);
  vec3 light = vLight + uSunCol * sun;
  vec3 v = normalize(uEye - vPos);
  for (int i = 0; i < 4; i++) {
    vec3 d = uLPos[i].xyz - vPos;
    float l = length(d), a = max(0.0, 1.0 - l / uLPos[i].w);
    light += uLCol[i] * (a * a * (0.35 + 0.65 * max(dot(n, d / max(l, 1e-4)), 0.0)));
  }
  // Models have no baked light of their own: give them some shape.
  light *= mix(1.0, 0.62 + 0.38 * (n.y * 0.5 + 0.5) + 0.25 * pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0), uFlat);
  vec3 col = c * light + c * uEmit;
  col += uSunCol * (uGloss * sun * pow(max(dot(n, normalize(uSunDir + v)), 0.0), 40.0));
  // Haze with distance.
  float dist = length(uEye - vPos);
  col = mix(col, uFogCol, clamp((dist - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0) * 0.6);
  // Bright things roll off rather than clip.
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  o = vec4(pow(col, vec3(1.0 / 2.2)), uAlpha);
}`;

const DEPTH_VERT = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uVP, uModel;
void main() { gl_Position = uVP * uModel * vec4(aPos, 1.0); }`;
const DEPTH_FRAG = `#version 300 es
precision mediump float;
void main() {}`;

// The sky: blue overhead, hazy at the horizon, with the sun in it.
const SKY_VERT = `#version 300 es
layout(location=0) in vec2 aPos;
uniform vec3 uRight, uUp, uFwd;
out vec3 vDir;
void main() { vDir = uFwd + uRight * aPos.x + uUp * aPos.y; gl_Position = vec4(aPos, 0.9999, 1.0); }`;
const SKY_FRAG = `#version 300 es
precision highp float;
uniform vec3 uTop, uHorizon, uSunDir, uSunCol;
in vec3 vDir;
out vec4 o;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.0);
  vec3 c = mix(uHorizon, uTop, pow(h, 0.45));
  // Thin cloud, high up.
  vec2 p = d.xz / (h + 0.12) * 1.4;
  float cl = noise(p) * 0.6 + noise(p * 2.3 + 7.0) * 0.3 + noise(p * 5.1) * 0.1;
  c = mix(c, vec3(1.0, 0.97, 0.93), smoothstep(0.52, 0.85, cl) * 0.55 * smoothstep(0.0, 0.25, h));
  float s = max(dot(d, uSunDir), 0.0);
  c += uSunCol * (pow(s, 900.0) * 6.0 + pow(s, 14.0) * 0.22);
  if (d.y < 0.0) c = mix(c, uHorizon * 0.8, min(1.0, -d.y * 6.0));
  c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
  o = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

// Sparks, smoke, tracers and marks: flat shapes, each corner carrying where
// in the shape it is. kind 0: a soft round glow. 1: a streak, soft across
// its width. 2: a hard-edged disc. Colours come already multiplied by how
// solid they are; alpha 0 means "add this light to what's behind".
const FX_VERT = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aUv;
layout(location=2) in vec4 aCol;
uniform mat4 uVP;
uniform vec3 uEye;
out vec3 vUv;
out vec4 vCol;
out float vDist;
void main() { vUv = aUv; vCol = aCol; vDist = length(uEye - aPos); gl_Position = uVP * vec4(aPos, 1.0); }`;
const FX_FRAG = `#version 300 es
precision highp float;
uniform vec2 uFog;
in vec3 vUv;
in vec4 vCol;
in float vDist;
out vec4 o;
void main() {
  float a;
  if (vUv.z < 0.5) a = pow(max(0.0, 1.0 - length(vUv.xy)), 1.8);
  else if (vUv.z < 1.5) a = pow(max(0.0, 1.0 - abs(vUv.y)), 1.5) * smoothstep(1.0, 0.7, abs(vUv.x));
  else a = smoothstep(1.0, 0.75, length(vUv.xy));
  a *= 1.0 - clamp((vDist - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0) * 0.6;
  o = vCol * a;
}`;

// ---- the renderer ----------------------------------------------------------------------

const SHADOW0 = 4096, SHADOW1 = 1024;

export class Renderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, depth: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL 2 is not available');
    this.gl = gl;
    this.canvas = canvas;
    this.main = this.program(VERT, FRAG, ['uVP', 'uModel', 'uSun0', 'uSun1', 'uShadow0', 'uShadow1', 'uSunDir', 'uSunCol', 'uEye', 'uFogCol', 'uTint', 'uFog', 'uEmit', 'uAlpha', 'uGloss', 'uFlat', 'uLPos', 'uLCol']);
    this.depth = this.program(DEPTH_VERT, DEPTH_FRAG, ['uVP', 'uModel']);
    this.sky = this.program(SKY_VERT, SKY_FRAG, ['uRight', 'uUp', 'uFwd', 'uTop', 'uHorizon', 'uSunDir', 'uSunCol']);
    this.fx = this.program(FX_VERT, FX_FRAG, ['uVP', 'uEye', 'uFog']);
    this.skyVao = gl.createVertexArray();
    gl.bindVertexArray(this.skyVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.shadow0 = this.shadowTarget(SHADOW0);
    this.shadow1 = this.shadowTarget(SHADOW1);
    this.sun0 = M.ident();
    this.sun1 = M.ident();
    // Flat shapes: room for 6000 of them.
    this.fxMax = 6000;
    this.fxData = new Float32Array(this.fxMax * 6 * 10);
    this.fxN = 0;
    this.fxVao = gl.createVertexArray();
    gl.bindVertexArray(this.fxVao);
    this.fxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.fxData.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 40, 12);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 24);
    gl.bindVertexArray(null);
    this.ident = M.ident();
    this.world = null;
    this.lPos = new Float32Array(16);
    this.lCol = new Float32Array(12);
  }

  program(vs, fs, uniforms) {
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
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    for (const name of uniforms) u[name] = gl.getUniformLocation(p, name);
    return { p, u };
  }

  shadowTarget(size) {
    const gl = this.gl, tex = gl.createTexture(), fbo = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, size, size);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, size };
  }

  // A model from a Builder: lit by whatever light it is handed when drawn.
  mesh(builder) {
    const gl = this.gl, vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(builder.data), gl.STATIC_DRAW);
    for (let i = 0; i < 3; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 36, i * 12);
    }
    gl.bindVertexArray(null);
    return { vao, count: builder.count };
  }

  // The map: corners of 13 numbers (where, facing, colour, light, pattern)
  // and the triangles between them. Draws its shadows once, here.
  // (geom is kept and handed back when the game changes map, so each map
  // is only loaded onto the graphics card once.)
  setWorld(geom, sunDir, size) {
    const gl = this.gl, verts = geom.verts, index = geom.index;
    if (geom.vao) {
      this.world = geom;
      this.castWorld(sunDir, size);
      return;
    }
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const sizes = [3, 3, 3, 3, 1];
    let off = 0;
    for (let i = 0; i < 5; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, sizes[i], gl.FLOAT, false, 52, off);
      off += sizes[i] * 4;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    geom.vao = vao;
    geom.count = index.length;
    this.world = geom;
    this.castWorld(sunDir, size);
  }

  // The map's own shadows, drawn once from where the sun is.
  castWorld(sunDir, size) {
    const gl = this.gl, vao = this.world.vao;
    this.sunDir = sunDir;
    // Looking down the sunlight at the whole map.
    const cx = size[0] / 2, cz = size[1] / 2, far = 140;
    const view = M.lookAt([cx + sunDir[0] * far, sunDir[1] * far, cz + sunDir[2] * far], [cx, 0, cz]);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const x of [0, size[0]]) for (const y of [-3, 16]) for (const z of [0, size[1]]) {
      const p = M.point(view, x, y, z);
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
      z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2]);
    }
    this.sunView = view;
    this.sun0 = M.mul(M.ortho(x0, x1, y0, y1, -z1 - 1, -z0 + 1), view);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow0.fbo);
    gl.viewport(0, 0, SHADOW0, SHADOW0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);
    gl.useProgram(this.depth.p);
    gl.uniformMatrix4fv(this.depth.u.uVP, false, this.sun0);
    gl.uniformMatrix4fv(this.depth.u.uModel, false, this.ident);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, this.world.count, gl.UNSIGNED_INT, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize(w, h, dpr) {
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
  }

  // The robots' shadows: call this, then cast() each thing, then begin().
  // They are drawn into a square of ground reach metres round the camera.
  shadows(eye, reach = 34) {
    const gl = this.gl, v = this.sunView;
    const c = M.point(v, eye[0], eye[1], eye[2]);
    // (Kept to whole texels, so the shadows don't shimmer as the camera moves.)
    const texel = (reach * 2) / SHADOW1, sx = Math.round(c[0] / texel) * texel, sy = Math.round(c[1] / texel) * texel;
    this.sun1 = M.mul(M.ortho(sx - reach, sx + reach, sy - reach, sy + reach, -c[2] - 120, -c[2] + 120), v);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow1.fbo);
    gl.viewport(0, 0, SHADOW1, SHADOW1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.depth.p);
    gl.uniformMatrix4fv(this.depth.u.uVP, false, this.sun1);
  }

  cast(mesh, model) {
    const gl = this.gl;
    gl.uniformMatrix4fv(this.depth.u.uModel, false, model);
    gl.bindVertexArray(mesh.vao);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }

  // Starts the picture. look: view, proj, eye, sunCol, skyTop, horizon,
  // fog [from, to], lights: up to four of [x, y, z, reach, r, g, b].
  begin(look) {
    const gl = this.gl;
    this.look = look;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    // The sky, behind everything.
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(this.sky.p);
    const v = look.view, p = look.proj, tx = 1 / p[0], ty = 1 / p[5];
    gl.uniform3f(this.sky.u.uRight, v[0] * tx, v[4] * tx, v[8] * tx);
    gl.uniform3f(this.sky.u.uUp, v[1] * ty, v[5] * ty, v[9] * ty);
    gl.uniform3f(this.sky.u.uFwd, -v[2], -v[6], -v[10]);
    gl.uniform3fv(this.sky.u.uTop, look.skyTop);
    gl.uniform3fv(this.sky.u.uHorizon, look.horizon);
    gl.uniform3fv(this.sky.u.uSunDir, this.sunDir);
    gl.uniform3fv(this.sky.u.uSunCol, look.sunCol);
    gl.bindVertexArray(this.skyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    this.vp = M.mul(look.proj, look.view);
    this.useMain(this.vp, look.eye);
  }

  useMain(vp, eye) {
    const gl = this.gl, u = this.main.u, look = this.look;
    gl.useProgram(this.main.p);
    gl.uniformMatrix4fv(u.uVP, false, vp);
    gl.uniformMatrix4fv(u.uSun0, false, this.sun0);
    gl.uniformMatrix4fv(u.uSun1, false, this.sun1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shadow0.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.shadow1.tex);
    gl.uniform1i(u.uShadow0, 0);
    gl.uniform1i(u.uShadow1, 1);
    gl.uniform3fv(u.uSunDir, this.sunDir);
    gl.uniform3fv(u.uSunCol, look.sunCol);
    gl.uniform3fv(u.uEye, eye);
    gl.uniform3fv(u.uFogCol, look.horizon);
    gl.uniform2fv(u.uFog, look.fog);
    gl.uniform3f(u.uTint, 1, 1, 1);
    gl.uniform1f(u.uEmit, 0);
    gl.uniform1f(u.uAlpha, 1);
    gl.uniform1f(u.uGloss, 0);
    gl.uniform1f(u.uFlat, 0);
    this.lPos.fill(0);
    this.lCol.fill(0);
    const lights = look.lights || [];
    for (let i = 0; i < Math.min(4, lights.length); i++) {
      this.lPos.set(lights[i].slice(0, 4), i * 4);
      this.lCol.set(lights[i].slice(4, 7), i * 3);
    }
    for (let i = lights.length; i < 4; i++) this.lPos[i * 4 + 3] = 1;
    gl.uniform4fv(u.uLPos, this.lPos);
    gl.uniform3fv(u.uLCol, this.lCol);
  }

  drawWorld() {
    const gl = this.gl, u = this.main.u;
    gl.uniformMatrix4fv(u.uModel, false, this.ident);
    gl.bindVertexArray(this.world.vao);
    gl.drawElements(gl.TRIANGLES, this.world.count, gl.UNSIGNED_INT, 0);
  }

  // Draws a model. light: the sky and lamp light where it stands [r, g, b].
  // opts: tint, emit (glows with its own colour), gloss, alpha.
  draw(mesh, model, light, opts = null) {
    const gl = this.gl, u = this.main.u;
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniform1f(u.uFlat, 1);
    gl.bindVertexArray(mesh.vao);
    gl.vertexAttrib3f(3, light[0], light[1], light[2]);
    gl.vertexAttrib1f(4, 0);
    if (opts) {
      if (opts.tint) gl.uniform3fv(u.uTint, opts.tint);
      if (opts.emit) gl.uniform1f(u.uEmit, opts.emit);
      if (opts.gloss) gl.uniform1f(u.uGloss, opts.gloss);
      if (opts.alpha !== undefined) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform1f(u.uAlpha, opts.alpha);
      }
    }
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    if (opts) {
      if (opts.tint) gl.uniform3f(u.uTint, 1, 1, 1);
      if (opts.emit) gl.uniform1f(u.uEmit, 0);
      if (opts.gloss) gl.uniform1f(u.uGloss, 0);
      if (opts.alpha !== undefined) {
        gl.disable(gl.BLEND);
        gl.uniform1f(u.uAlpha, 1);
      }
    }
    gl.uniform1f(u.uFlat, 0);
  }

  // Wipes the depth so the gun in your hands is drawn over everything,
  // through its own lens.
  beginHands(proj, view) {
    const gl = this.gl;
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(this.main.u.uVP, false, M.mul(proj, view));
  }

  // ---- flat shapes: glows, streaks, smoke, marks ---------------------------------------

  fxClear() { this.fxN = 0; }

  corner(x, y, z, u, v, kind, c) {
    const d = this.fxData;
    let o = this.fxN++ * 10;
    d[o++] = x; d[o++] = y; d[o++] = z; d[o++] = u; d[o++] = v; d[o++] = kind;
    d[o++] = c[0]; d[o++] = c[1]; d[o++] = c[2]; d[o] = c[3];
  }

  // A shape facing the camera at (x, y, z), size metres across.
  // c: [r, g, b, a], already multiplied by a (a 0: adds light).
  sprite(x, y, z, size, c, kind = 0) {
    if (this.fxN + 6 > this.fxMax * 6) return;
    const v = this.look.view, rx = v[0] * size, ry = v[4] * size, rz = v[8] * size, ux = v[1] * size, uy = v[5] * size, uz = v[9] * size;
    this.corner(x - rx - ux, y - ry - uy, z - rz - uz, -1, -1, kind, c);
    this.corner(x + rx - ux, y + ry - uy, z + rz - uz, 1, -1, kind, c);
    this.corner(x + rx + ux, y + ry + uy, z + rz + uz, 1, 1, kind, c);
    this.corner(x - rx - ux, y - ry - uy, z - rz - uz, -1, -1, kind, c);
    this.corner(x + rx + ux, y + ry + uy, z + rz + uz, 1, 1, kind, c);
    this.corner(x - rx + ux, y - ry + uy, z - rz + uz, -1, 1, kind, c);
  }

  // A streak from a to b, width metres wide, turned to face the camera.
  streak(a, b, width, c) {
    if (this.fxN + 6 > this.fxMax * 6) return;
    const e = this.look.eye;
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const tx = e[0] - a[0], ty = e[1] - a[1], tz = e[2] - a[2];
    let sx = dy * tz - dz * ty, sy = dz * tx - dx * tz, sz = dx * ty - dy * tx;
    const l = Math.hypot(sx, sy, sz) || 1;
    sx *= width / l; sy *= width / l; sz *= width / l;
    this.corner(a[0] - sx, a[1] - sy, a[2] - sz, -1, -1, 1, c);
    this.corner(b[0] - sx, b[1] - sy, b[2] - sz, 1, -1, 1, c);
    this.corner(b[0] + sx, b[1] + sy, b[2] + sz, 1, 1, 1, c);
    this.corner(a[0] - sx, a[1] - sy, a[2] - sz, -1, -1, 1, c);
    this.corner(b[0] + sx, b[1] + sy, b[2] + sz, 1, 1, 1, c);
    this.corner(a[0] + sx, a[1] + sy, a[2] + sz, -1, 1, 1, c);
  }

  // A mark lying flat on a surface facing n.
  mark(x, y, z, n, size, c) {
    if (this.fxN + 6 > this.fxMax * 6) return;
    // Two directions lying in the surface.
    let ax = n[1], ay = -n[0], az = 0;
    if (Math.abs(n[2]) > 0.9) { ax = 1; ay = 0; az = 0; }
    if (Math.abs(n[1]) > 0.9) { ax = 1; ay = 0; az = 0; }
    const bx = n[1] * az - n[2] * ay, by = n[2] * ax - n[0] * az, bz = n[0] * ay - n[1] * ax;
    const px = x + n[0] * 0.012, py = y + n[1] * 0.012, pz = z + n[2] * 0.012;
    const P = (u, v) => this.corner(px + (ax * u + bx * v) * size, py + (ay * u + by * v) * size, pz + (az * u + bz * v) * size, u, v, 2, c);
    P(-1, -1); P(1, -1); P(1, 1); P(-1, -1); P(1, 1); P(-1, 1);
  }

  fxDraw() {
    if (!this.fxN) return;
    const gl = this.gl;
    gl.useProgram(this.fx.p);
    gl.uniformMatrix4fv(this.fx.u.uVP, false, this.vp);
    gl.uniform3fv(this.fx.u.uEye, this.look.eye);
    gl.uniform2fv(this.fx.u.uFog, this.look.fog);
    gl.bindVertexArray(this.fxVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.fxData, 0, this.fxN * 10);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.drawArrays(gl.TRIANGLES, 0, this.fxN);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    this.useMain(this.vp, this.look.eye);
  }
}
