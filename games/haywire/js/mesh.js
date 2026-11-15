// Haywire: turns the map into triangles, and works out the soft light on
// it. Every face of every slab that can be seen becomes a square (walls are
// cut at each whole metre so the light changes smoothly up them). For each
// corner, rays are sent out to see how much sky it can see, and to each
// lamp nearby; that light is stored with the corner, so the yard has soft
// shade in its corners and lit rooms for nothing while the game runs. The
// sun itself is added live, with real shadows, by gl.js.

import { MATS } from './map.js';
import { rgb } from './gl.js';

// Light, in the units the renderer uses.
export const SKY = [0.4, 0.49, 0.68]; // from the open sky
export const BOUNCE = [0.16, 0.15, 0.135]; // off whatever is nearby
export const SUN = [2.25, 1.98, 1.58];

// Twelve directions spread over a dome, to look for the sky along.
const DOME = [];
for (let k = 0; k < 12; k++) {
  const u = (k + 0.5) / 12, a = k * 2.399963, r = Math.sqrt(u);
  DOME.push([Math.cos(a) * r, Math.sqrt(1 - u), Math.sin(a) * r]);
}

// The soft light arriving at a point facing n: from the sky, from nearby
// surfaces, and from the lamps.
function softLight(world, lamps, x, y, z, nx, ny, nz, out) {
  // Two directions square to n.
  let ax, ay, az;
  if (Math.abs(ny) > 0.9) { ax = 1; ay = 0; az = 0; } else { ax = -nz; ay = 0; az = nx; }
  const bx = ny * az - nz * ay, by = nz * ax - nx * az, bz = nx * ay - ny * ax;
  const px = x + nx * 0.04, py = y + ny * 0.04, pz = z + nz * 0.04;
  let r = 0, g = 0, b = 0;
  for (const d of DOME) {
    const dx = ax * d[0] + nx * d[1] + bx * d[2], dy = ay * d[0] + ny * d[1] + by * d[2], dz = az * d[0] + nz * d[1] + bz * d[2];
    const t = world.ray(px, py, pz, dx, dy, dz, 16);
    if (t === Infinity) {
      const k = 0.6 + 0.4 * Math.max(0, dy);
      r += SKY[0] * k; g += SKY[1] * k; b += SKY[2] * k;
    } else {
      const k = Math.min(1, t / 3.5);
      r += BOUNCE[0] * k; g += BOUNCE[1] * k; b += BOUNCE[2] * k;
    }
  }
  r /= DOME.length; g /= DOME.length; b /= DOME.length;
  for (const l of lamps) {
    const lx = l.x - px, ly = l.y - py, lz = l.z - pz, d = Math.hypot(lx, ly, lz);
    if (d >= l.reach || d < 1e-3) continue;
    const facing = (lx * nx + ly * ny + lz * nz) / d;
    if (facing <= 0) continue;
    if (world.ray(px, py, pz, lx / d, ly / d, lz / d, d) < d - 0.05) continue;
    const k = (1 - d / l.reach) ** 2 * (0.3 + 0.7 * facing) * 2.4;
    r += l.r * k; g += l.g * k; b += l.b * k;
  }
  out[0] = r; out[1] = g; out[2] = b;
  return out;
}

const NORMALS = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];

export function buildMesh(map) {
  const world = map.world, W = world.W, H = world.H, cols = world.cols, lamps = map.lamps;
  const verts = [], index = [];
  const lightCache = new Map(), tmp = [0, 0, 0];
  const mats = MATS.map((m) => ({ c: rgb(m.c), p: m.p }));
  const lightAt = (x, y, z, ni) => {
    const key = ((Math.round(x * 4) * 4099 + Math.round(y * 40)) * 4099 + Math.round(z * 4)) * 6 + ni;
    let l = lightCache.get(key);
    if (!l) {
      const n = NORMALS[ni];
      l = softLight(world, lamps, x, y, z, n[0], n[1], n[2], [0, 0, 0]);
      lightCache.set(key, l);
    }
    return l;
  };
  const hash = (i) => ((Math.imul(i + 11, 0x9e3779b1) >>> 8) / 16777216);

  // One square: four corners, anticlockwise from outside, facing NORMALS[ni].
  const quad = (p, ni, mat, tint) => {
    const n = NORMALS[ni], m = mats[mat], base = verts.length / 13;
    const ls = p.map((q) => lightAt(q[0], q[1], q[2], ni));
    for (let k = 0; k < 4; k++) {
      verts.push(p[k][0], p[k][1], p[k][2], n[0], n[1], n[2], m.c[0] * tint, m.c[1] * tint, m.c[2] * tint, ls[k][0], ls[k][1], ls[k][2], m.p);
    }
    // Split the square along whichever diagonal has the more even light.
    const sum = (l) => l[0] + l[1] + l[2];
    if (Math.abs(sum(ls[0]) - sum(ls[2])) <= Math.abs(sum(ls[1]) - sum(ls[3]))) index.push(base, base + 1, base + 2, base, base + 2, base + 3);
    else index.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
  };

  // The parts of [y0, y1] not covered by the slabs in list.
  const gaps = (y0, y1, list) => {
    let out = [[y0, y1]];
    for (const s of list) {
      const next = [];
      for (const [a, b] of out) {
        if (s[1] <= a || s[0] >= b) { next.push([a, b]); continue; }
        if (s[0] > a) next.push([a, s[0]]);
        if (s[1] < b) next.push([s[1], b]);
      }
      out = next;
    }
    return out;
  };

  const rim = (x, z) => x < 3 || z < 3 || x >= W - 3 || z >= H - 3;
  for (let z = 0; z < H; z++) {
    for (let x = 0; x < W; x++) {
      const i = z * W + x, list = cols[i], tint = 0.965 + 0.07 * hash(i);
      for (let k = 0; k < list.length; k++) {
        const [y0, y1, mat] = list[k];
        // Top and underside, unless another slab sits right against them.
        if (!(k + 1 < list.length && list[k + 1][0] <= y1 + 1e-6) && !(rim(x, z) && y1 > 8)) {
          quad([[x, y1, z + 1], [x + 1, y1, z + 1], [x + 1, y1, z], [x, y1, z]], 4, mat, tint);
        }
        if (y0 > -2.9 && !(k > 0 && list[k - 1][1] >= y0 - 1e-6)) {
          quad([[x, y0, z], [x + 1, y0, z], [x + 1, y0, z + 1], [x, y0, z + 1]], 5, mat, tint);
        }
        // The four sides, where the column next door leaves them showing.
        for (let d = 0; d < 4; d++) {
          const nx = x + NORMALS[d][0], nz = z + NORMALS[d][2];
          if (nx < 0 || nz < 0 || nx >= W || nz >= H) continue;
          for (const [a, b] of gaps(Math.max(y0, -2.9), y1, cols[nz * W + nx])) {
            // Cut at each whole metre.
            for (let lo = a; lo < b - 1e-6;) {
              const hi = Math.min(b, Math.floor(lo + 1 + 1e-6));
              let p;
              if (d === 0) p = [[x + 1, lo, z + 1], [x + 1, lo, z], [x + 1, hi, z], [x + 1, hi, z + 1]];
              else if (d === 1) p = [[x, lo, z], [x, lo, z + 1], [x, hi, z + 1], [x, hi, z]];
              else if (d === 2) p = [[x, lo, z + 1], [x + 1, lo, z + 1], [x + 1, hi, z + 1], [x, hi, z + 1]];
              else p = [[x + 1, lo, z], [x, lo, z], [x, hi, z], [x + 1, hi, z]];
              quad(p, d, mat, tint);
              lo = hi;
            }
          }
        }
      }
    }
  }

  // The soft light where a robot stands, for each place one can stand: it
  // is what lights the robots themselves.
  const probes = new Float32Array(world.nodeY.length * 3);
  for (let n = 0; n < world.nodeY.length; n++) {
    softLight(world, lamps, world.nodeX(n), world.nodeY[n] + 1.1, world.nodeZ(n), 0, 1, 0, tmp);
    probes[n * 3] = tmp[0]; probes[n * 3 + 1] = tmp[1]; probes[n * 3 + 2] = tmp[2];
  }

  return { verts: new Float32Array(verts), index: new Uint32Array(index), probes };
}
