// Haywire: the things that are only there to be looked at. Tracers, sparks,
// smoke, scorch marks, flashes of light, and the pieces a robot falls into
// when it is scrapped. None of it changes the match.

import { M } from './gl.js';
import { pose } from './models.js';

const sparks = [], smoke = [], tracers = [], marks = [], debris = [], lights = [], glows = [];
const rnd = (a = 1) => (Math.random() * 2 - 1) * a;

// Marks stay until there are too many; then the oldest go.
function mark(m) {
  if (marks.length >= 160) marks.shift();
  marks.push(m);
}

export function fxReset() {
  for (const list of [sparks, smoke, tracers, marks, debris, lights, glows]) list.length = 0;
}

export const fx = {
  // A flash that lights the things round it.
  light(x, y, z, reach, r, g, b, life) { lights.push({ x, y, z, reach, r, g, b, t: 0, life }); },
  glow(x, y, z, size, c, life) { glows.push({ x, y, z, size, c, t: 0, life }); },

  tracer(a, b, c, w) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
    if (len < 1.5) return;
    tracers.push({ a: [a[0], a[1], a[2]], d: [dx / len, dy / len, dz / len], len, head: Math.min(len, 5), c, w });
  },

  sparks(x, y, z, n, c, speed = 4, dir = null) {
    for (let k = 0; k < n && sparks.length < 500; k++) {
      let vx = rnd(), vy = rnd() + 0.3, vz = rnd();
      if (dir) { vx += dir[0] * 1.2; vy += dir[1] * 1.2; vz += dir[2] * 1.2; }
      const v = speed * (0.4 + Math.random());
      sparks.push({ x, y, z, vx: vx * v, vy: vy * v, vz: vz * v, t: 0, life: 0.18 + Math.random() * 0.3, c });
    }
  },

  puff(x, y, z, size, shade, life = 0.7, rise = 0.6) {
    if (smoke.length > 160) smoke.shift();
    smoke.push({ x, y, z, vx: rnd(0.4), vy: rise * (0.5 + Math.random()), vz: rnd(0.4), size, shade, t: 0, life: life * (0.7 + Math.random() * 0.6) });
  },

  // A round hitting the yard: sparks, a puff of dust, and a mark left behind.
  impact(x, y, z, n) {
    fx.sparks(x, y, z, 4, [1, 0.8, 0.45], 3.5, n);
    fx.puff(x + n[0] * 0.08, y + n[1] * 0.08, z + n[2] * 0.08, 0.14, 0.55, 0.4, 0.3);
    mark({ x, y, z, n, size: 0.05 + Math.random() * 0.03, a: 0.75 });
  },

  // A robot comes apart: each piece goes its own way.
  scrap(match, s, v, robot, gunMesh, glow) {
    const p = pose({ x: s.x, y: s.y, z: s.z, yaw: s.yaw, pitch: s.pitch, crouch: s.crouchK, stride: v.stride, pace: v.pace, lean: 0, lower: 0 });
    const pieces = [[robot.thigh, p.thigh[0]], [robot.thigh, p.thigh[1]], [robot.shin, p.shin[0]], [robot.shin, p.shin[1]], [robot.hips, p.hips], [robot.top, p.top], [gunMesh, p.gun]];
    for (const [mesh, m] of pieces) {
      const rot = new Float32Array(m);
      rot[12] = rot[13] = rot[14] = 0;
      debris.push({
        mesh, rot, x: m[12], y: m[13], z: m[14], vx: rnd(2.6) + s.vx * 0.5, vy: 1.5 + Math.random() * 3.5, vz: rnd(2.6) + s.vz * 0.5,
        ax: rnd(), az: rnd(), ang: 0, spin: 4 + Math.random() * 8, t: 0, life: 7 + Math.random() * 3, light: [v.light[0], v.light[1], v.light[2]], half: 0.09, scale: 1, tint: null,
      });
    }
    while (debris.length > 110) debris.shift();
    const cy = s.y + 1;
    fx.sparks(s.x, cy, s.z, 26, [glow[0] * 0.5 + 0.5, glow[1] * 0.5 + 0.5, glow[2] * 0.5 + 0.5], 6);
    fx.glow(s.x, cy, s.z, 1.3, [glow[0], glow[1], glow[2]], 0.16);
    fx.light(s.x, cy, s.z, 8, glow[0] * 2.5, glow[1] * 2.5, glow[2] * 2.5, 0.2);
    for (let k = 0; k < 5; k++) fx.puff(s.x + rnd(0.3), cy + rnd(0.5), s.z + rnd(0.3), 0.5, 0.22, 1.3, 0.9);
    const g = match.world.groundAt(s.x, s.z, s.y + 0.3);
    if (g > -9) mark({ x: s.x, y: g, z: s.z, n: [0, 1, 0], size: 0.7, a: 0.5 });
  },

  boom(x, y, z) {
    fx.light(x, y + 0.5, z, 18, 4, 2.6, 1.1, 0.35);
    fx.glow(x, y + 0.4, z, 3.4, [1, 0.75, 0.35], 0.14);
    fx.glow(x, y + 0.6, z, 2.0, [1, 0.5, 0.15], 0.3);
    fx.sparks(x, y + 0.2, z, 40, [1, 0.75, 0.35], 11);
    for (let k = 0; k < 12; k++) fx.puff(x + rnd(1.1), y + 0.3 + Math.random() * 1.2, z + rnd(1.1), 1.0 + Math.random() * 0.8, 0.12 + Math.random() * 0.2, 2.2, 1.3);
    mark({ x, y: y - 0.05, z, n: [0, 1, 0], size: 1.9, a: 0.6 });
  },
};

export function fxStep(dt, world) {
  for (let k = sparks.length - 1; k >= 0; k--) {
    const p = sparks[k];
    p.t += dt;
    if (p.t >= p.life) { sparks.splice(k, 1); continue; }
    p.vy -= 13 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  }
  for (let k = smoke.length - 1; k >= 0; k--) {
    const p = smoke[k];
    p.t += dt;
    if (p.t >= p.life) { smoke.splice(k, 1); continue; }
    const drag = Math.exp(-dt * 1.5);
    p.vx *= drag; p.vz *= drag;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  }
  for (let k = tracers.length - 1; k >= 0; k--) {
    const t = tracers[k];
    t.head += 300 * dt;
    if (t.head - 12 > t.len) tracers.splice(k, 1);
  }
  for (const list of [lights, glows]) {
    for (let k = list.length - 1; k >= 0; k--) {
      list[k].t += dt;
      if (list[k].t >= list[k].life) list.splice(k, 1);
    }
  }
  for (let k = debris.length - 1; k >= 0; k--) {
    const d = debris[k];
    d.t += dt;
    if (d.t >= d.life) { debris.splice(k, 1); continue; }
    if (d.rest) continue;
    d.vy -= 17 * dt;
    const nx = d.x + d.vx * dt, nz = d.z + d.vz * dt;
    // Off the walls, and down onto the floor.
    if (world.solidAt(nx, d.y, d.z)) d.vx *= -0.4; else d.x = nx;
    if (world.solidAt(d.x, d.y, nz)) d.vz *= -0.4; else d.z = nz;
    d.y += d.vy * dt;
    d.ang += d.spin * dt;
    const floor = world.groundAt(d.x, d.z, d.y + 0.25) + d.half;
    if (d.y < floor) {
      d.y = floor;
      if (d.vy < -1.5) { d.vy *= -0.35; d.vx *= 0.6; d.vz *= 0.6; d.spin *= 0.5; } else { d.vy = 0; d.vx *= 0.8; d.vz *= 0.8; d.spin *= 0.8; if (Math.hypot(d.vx, d.vz) < 0.2) d.rest = true; }
    }
  }
}

// The four flashes that matter most to the camera, as the renderer wants them.
export function lightsNow(eye) {
  const out = [];
  for (const l of lights) {
    const k = 1 - l.t / l.life, d = Math.hypot(l.x - eye[0], l.y - eye[1], l.z - eye[2]);
    out.push({ w: (l.r + l.g + l.b) * k / (1 + d * 0.15), v: [l.x, l.y, l.z, l.reach, l.r * k, l.g * k, l.b * k] });
  }
  out.sort((a, b) => b.w - a.w);
  return out.slice(0, 4).map((o) => o.v);
}

const tmpA = [0, 0, 0], tmpB = [0, 0, 0];
export function fxDraw(R, models, pass, now = 0) {
  if (pass === 'cast' || pass === 'solid') {
    for (const d of debris) {
      // (Pieces shrink away at the end.)
      const left = d.life - d.t, k = left < 1 ? Math.max(0.01, left) : 1;
      const m = M.chain(M.move(d.x, d.y, d.z), M.rotX(d.ang * d.ax), M.rotZ(d.ang * d.az), d.rot, M.scale(k));
      if (pass === 'cast') R.cast(d.mesh, m);
      else R.draw(d.mesh, m, d.light);
    }
    return;
  }
  for (const m of marks) R.mark(m.x, m.y, m.z, m.n, m.size, [0, 0, 0, m.a]);
  for (const p of smoke) {
    const k = p.t / p.life, a = (1 - k) * 0.5 * Math.min(1, k * 8);
    R.sprite(p.x, p.y, p.z, p.size * (0.6 + k * 1.6), [p.shade * a, p.shade * a, p.shade * a, a]);
  }
  for (const g of glows) {
    const k = 1 - g.t / g.life;
    R.sprite(g.x, g.y, g.z, g.size * (0.7 + 0.5 * (1 - k)), [g.c[0] * k, g.c[1] * k, g.c[2] * k, 0]);
  }
  for (const p of sparks) {
    const k = 1 - p.t / p.life;
    tmpA[0] = p.x; tmpA[1] = p.y; tmpA[2] = p.z;
    tmpB[0] = p.x - p.vx * 0.035; tmpB[1] = p.y - p.vy * 0.035; tmpB[2] = p.z - p.vz * 0.035;
    R.streak(tmpB, tmpA, 0.012, [p.c[0] * k * 1.6, p.c[1] * k * 1.6, p.c[2] * k * 1.6, 0]);
  }
  for (const t of tracers) {
    const h1 = Math.min(t.len, t.head), h0 = Math.max(0, t.head - 12);
    if (h1 <= h0) continue;
    tmpA[0] = t.a[0] + t.d[0] * h0; tmpA[1] = t.a[1] + t.d[1] * h0; tmpA[2] = t.a[2] + t.d[2] * h0;
    tmpB[0] = t.a[0] + t.d[0] * h1; tmpB[1] = t.a[1] + t.d[1] * h1; tmpB[2] = t.a[2] + t.d[2] * h1;
    R.streak(tmpA, tmpB, t.w, [t.c[0] * 0.9, t.c[1] * 0.9, t.c[2] * 0.9, 0]);
  }
}
