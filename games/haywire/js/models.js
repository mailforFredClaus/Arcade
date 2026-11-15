// Haywire: the models, built from boxes and bars. A robot comes in pieces
// (two thighs, two shins, hips, and a top half holding its gun) so it can
// walk, crouch and aim, and so it can fall to bits when it is scrapped.
// Everything faces north (towards -z) with its feet or grip at the origin.

import { Builder, M } from './gl.js';

export const HIP = 0.94, THIGH = 0.44, SHIN = 0.5, WAIST = 0.1; // a robot's legs, in metres
export const HOLD = [0.1, 0.27, -0.42]; // where the top half grips its gun
export const TEAM = [
  { main: '#2f7df0', dark: '#1e4f9c', glow: [0.35, 0.7, 1] },
  { main: '#f0761c', dark: '#a84a10', glow: [1, 0.45, 0.12] },
];
const STEEL = '#3a4049', DARK = '#23272e', PALE = '#c8ced6', JOINT = '#15181c';

// A matrix that carries the z axis from a to b: for laying a box along a limb.
function along(a, b) {
  let zx = b[0] - a[0], zy = b[1] - a[1], zz = b[2] - a[2];
  const l = Math.hypot(zx, zy, zz) || 1;
  zx /= l; zy /= l; zz /= l;
  let xx = zz, xy = 0, xz = -zx; // up cross z
  let xl = Math.hypot(xx, xz);
  if (xl < 1e-4) { xx = 1; xz = 0; xl = 1; }
  xx /= xl; xz /= xl;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return { m: new Float32Array([xx, xy, xz, 0, yx, yy, yz, 0, zx, zy, zz, 0, a[0], a[1], a[2], 1]), len: l };
}
function limb(b, a, c, w, color) {
  const { m, len } = along(a, c);
  b.with(m, () => b.box(-w, -w, -w * 0.4, w, w, len + w * 0.4, color));
}

function robot(R, team) {
  const t = TEAM[team];
  const thigh = new Builder()
    .box(-0.075, -THIGH, -0.085, 0.075, 0.03, 0.085, STEEL)
    .box(-0.085, -THIGH - 0.05, -0.1, 0.085, -THIGH + 0.07, 0.07, t.main); // the knee
  const shin = new Builder()
    .box(-0.065, -SHIN + 0.08, -0.07, 0.065, 0, 0.075, DARK)
    .box(-0.08, -SHIN + 0.08, -0.085, 0.08, -0.2, 0.0, t.dark)
    .box(-0.085, -SHIN, -0.2, 0.085, -SHIN + 0.09, 0.1, STEEL); // the foot
  const hips = new Builder()
    .box(-0.18, -0.07, -0.11, 0.18, WAIST + 0.02, 0.11, DARK)
    .box(-0.1, -0.1, -0.12, 0.1, 0.02, -0.08, t.dark);
  // The top half: its origin is the waist.
  const top = new Builder()
    .box(-0.2, 0, -0.12, 0.2, 0.2, 0.12, STEEL) // belly
    .box(-0.25, 0.18, -0.15, 0.25, 0.47, 0.14, t.main) // chest
    .box(-0.17, 0.22, -0.175, 0.17, 0.43, -0.15, t.dark)
    .box(-0.16, 0.1, 0.12, 0.16, 0.44, 0.25, DARK) // pack
    .box(-0.37, 0.33, -0.1, -0.24, 0.5, 0.1, t.main) // shoulders
    .box(0.24, 0.33, -0.1, 0.37, 0.5, 0.1, t.main)
    .box(-0.05, 0.47, -0.05, 0.05, 0.52, 0.05, JOINT) // neck
    .box(-0.12, 0.5, -0.135, 0.12, 0.745, 0.115, PALE) // head
    .box(-0.125, 0.69, -0.14, 0.125, 0.755, 0.12, t.main)
    .box(0.07, 0.745, 0.03, 0.085, 0.9, 0.045, JOINT); // aerial
  limb(top, [0.3, 0.42, 0], [0.27, 0.2, -0.17], 0.055, STEEL);
  limb(top, [0.27, 0.2, -0.17], [HOLD[0] + 0.02, HOLD[1] - 0.04, HOLD[2] + 0.02], 0.048, t.dark);
  limb(top, [-0.3, 0.42, 0], [-0.25, 0.2, -0.24], 0.055, STEEL);
  limb(top, [-0.25, 0.2, -0.24], [HOLD[0] - 0.06, HOLD[1] - 0.03, HOLD[2] - 0.26], 0.048, t.dark);
  // The bits that glow: the visor and a light on the chest.
  const glow = new Builder()
    .box(-0.105, 0.585, -0.142, 0.105, 0.655, -0.136, [1, 1, 1])
    .box(-0.04, 0.3, -0.18, 0.04, 0.36, -0.176, [1, 1, 1]);
  return { thigh: R.mesh(thigh), shin: R.mesh(shin), hips: R.mesh(hips), top: R.mesh(top), glow: R.mesh(glow) };
}

// ---- guns ------------------------------------------------------------------------------

// Each gun points along -z with its grip at the origin. sight: how high the
// line of its sights is. muzzle: how far forward the end of the barrel is.
const GUN_SHAPES = {
  rifle(b, acc) {
    b.box(-0.028, -0.02, -0.32, 0.028, 0.07, 0.12, STEEL);
    b.box(-0.032, -0.005, -0.52, 0.032, 0.062, -0.32, DARK);
    b.rod(0, 0.03, -0.52, -0.66, 0.014, 0.014, JOINT);
    b.box(-0.022, -0.045, 0.12, 0.022, 0.06, 0.36, DARK);
    b.box(-0.026, -0.07, 0.34, 0.026, 0.065, 0.39, JOINT);
    b.box(-0.018, -0.2, -0.13, 0.018, -0.02, -0.05, JOINT);
    b.box(-0.018, -0.13, 0.02, 0.018, -0.02, 0.07, DARK);
    b.box(-0.03, 0.02, -0.28, 0.03, 0.04, -0.02, acc);
    return { sight: 0.1, muzzle: 0.66, rear: -0.0, front: -0.5 };
  },
  smg(b, acc) {
    b.box(-0.027, -0.02, -0.22, 0.027, 0.065, 0.1, STEEL);
    b.rod(0, 0.03, -0.22, -0.38, 0.016, 0.016, JOINT);
    b.box(-0.03, 0.0, -0.3, 0.03, 0.06, -0.2, DARK);
    b.box(-0.016, -0.27, -0.1, 0.016, -0.02, -0.04, JOINT);
    b.box(-0.018, -0.12, 0.02, 0.018, -0.02, 0.07, DARK);
    b.box(-0.014, 0.0, 0.1, 0.014, 0.05, 0.26, DARK);
    b.box(-0.024, -0.05, 0.25, 0.024, 0.06, 0.29, JOINT);
    b.box(-0.029, 0.02, -0.18, 0.029, 0.04, 0.02, acc);
    return { sight: 0.095, muzzle: 0.38, rear: 0.02, front: -0.28 };
  },
  shotgun(b, acc) {
    b.box(-0.03, -0.025, -0.2, 0.03, 0.07, 0.1, STEEL);
    b.rod(0, 0.045, -0.2, -0.72, 0.021, 0.021, JOINT);
    b.rod(0, 0.0, -0.2, -0.62, 0.017, 0.017, DARK);
    b.box(-0.034, -0.03, -0.5, 0.034, 0.03, -0.3, '#8a5a2c');
    b.box(-0.024, -0.06, 0.1, 0.024, 0.055, 0.4, '#8a5a2c');
    b.box(-0.018, -0.12, 0.03, 0.018, -0.02, 0.08, '#6f4722');
    b.box(-0.031, 0.02, -0.16, 0.031, 0.04, 0.04, acc);
    return { sight: 0.085, muzzle: 0.72, rear: 0.04, front: -0.7 };
  },
  lmg(b, acc) {
    b.box(-0.034, -0.03, -0.3, 0.034, 0.085, 0.16, STEEL);
    b.box(-0.036, 0.0, -0.56, 0.036, 0.07, -0.3, DARK);
    b.rod(0, 0.035, -0.56, -0.8, 0.018, 0.018, JOINT);
    b.box(-0.085, -0.2, -0.2, 0.04, -0.03, -0.03, '#4c5a3c'); // the ammunition box
    b.box(-0.022, -0.06, 0.16, 0.022, 0.07, 0.42, DARK);
    b.box(-0.03, -0.09, 0.4, 0.03, 0.075, 0.45, JOINT);
    b.box(-0.018, -0.14, 0.04, 0.018, -0.03, 0.09, DARK);
    b.box(-0.008, 0.085, -0.2, 0.008, 0.115, 0.02, JOINT); // carrying handle
    b.box(-0.012, -0.16, -0.6, 0.012, 0.0, -0.57, JOINT); // bipod, folded
    b.box(-0.035, 0.03, -0.26, 0.035, 0.05, 0.02, acc);
    return { sight: 0.125, muzzle: 0.8, rear: 0.06, front: -0.54 };
  },
  sniper(b, acc) {
    b.box(-0.026, -0.02, -0.3, 0.026, 0.065, 0.14, STEEL);
    b.rod(0, 0.035, -0.3, -1.0, 0.013, 0.011, JOINT);
    b.rod(0, 0.035, -1.0, -1.08, 0.02, 0.02, DARK);
    b.box(-0.03, -0.01, -0.46, 0.03, 0.05, -0.3, '#5b6b4a');
    b.box(-0.024, -0.06, 0.14, 0.024, 0.06, 0.46, '#5b6b4a');
    b.box(-0.02, 0.06, 0.2, 0.02, 0.085, 0.38, DARK);
    b.box(-0.016, -0.11, -0.12, 0.016, -0.02, -0.04, JOINT);
    b.box(-0.018, -0.13, 0.03, 0.018, -0.02, 0.08, DARK);
    b.rod(0, 0.125, -0.26, 0.12, 0.027, 0.027, DARK, 10); // the scope
    b.rod(0, 0.125, -0.32, -0.26, 0.036, 0.03, DARK, 10);
    b.box(-0.012, 0.065, -0.2, 0.012, 0.1, -0.16, JOINT);
    b.box(-0.012, 0.065, 0.02, 0.012, 0.1, 0.06, JOINT);
    b.box(-0.028, 0.02, -0.26, 0.028, 0.035, 0.0, acc);
    return { sight: 0.125, muzzle: 1.08, rear: null, front: null };
  },
  pistol(b, acc) {
    b.box(-0.016, 0.015, -0.2, 0.016, 0.075, 0.05, STEEL);
    b.box(-0.014, -0.005, -0.18, 0.014, 0.02, 0.04, DARK);
    b.box(-0.016, -0.13, 0.0, 0.016, 0.0, 0.055, DARK);
    b.box(-0.017, 0.03, -0.1, 0.017, 0.045, 0.02, acc);
    return { sight: 0.097, muzzle: 0.2, rear: 0.035, front: -0.19 };
  },
};
const ACCENT = { rifle: '#3fb6c8', smg: '#e8c53a', shotgun: '#d8612c', lmg: '#8fcf5a', sniper: '#b58cf0', pistol: '#d0d5db' };

function gun(R, id) {
  const b = new Builder();
  const info = GUN_SHAPES[id](b, ACCENT[id]);
  // Iron sights: a notch at the back and a post at the front.
  if (info.rear !== null) {
    const top = info.sight, base = top - 0.03;
    b.box(-0.013, base, info.rear - 0.012, -0.006, top + 0.003, info.rear, JOINT);
    b.box(0.006, base, info.rear - 0.012, 0.013, top + 0.003, info.rear, JOINT);
    b.box(-0.0025, base - 0.01, info.front - 0.01, 0.0025, top, info.front, JOINT);
    b.box(-0.0025, top - 0.006, info.front - 0.011, 0.0025, top, info.front - 0.01, '#ffd84a');
  }
  return { mesh: R.mesh(b), ...info };
}

// The player's own forearms, drawn with the gun in first person: they run
// from the grips down and back off the bottom of the screen.
function hands(R, info) {
  const b = new Builder(), sleeve = '#2a3340', band = TEAM[0].dark, glove = '#1b1e23';
  limb(b, [0.04, -0.09, 0.05], [0.22, -0.34, 0.55], 0.034, sleeve);
  limb(b, [0.075, -0.14, 0.15], [0.1, -0.175, 0.22], 0.038, band);
  b.cube(0.01, -0.07, 0.045, 0.055, 0.085, 0.065, glove);
  const fz = -Math.min(0.34, info.muzzle * 0.5);
  limb(b, [-0.03, -0.04, fz], [-0.34, -0.3, 0.45], 0.034, sleeve);
  limb(b, [-0.09, -0.09, fz + 0.14], [-0.13, -0.125, fz + 0.21], 0.038, band);
  b.cube(-0.01, -0.02, fz, 0.075, 0.055, 0.085, glove);
  return R.mesh(b);
}

export function makeModels(R) {
  const guns = {}, arms = {};
  for (const id of Object.keys(GUN_SHAPES)) {
    guns[id] = gun(R, id);
    arms[id] = hands(R, guns[id]);
  }
  const nade = new Builder().ball(0, 0, 0, 0.075, '#3d5a3a', 8, 5).box(-0.02, 0.06, -0.02, 0.02, 0.11, 0.02, JOINT).box(-0.08, -0.012, -0.08, 0.08, 0.012, 0.08, '#2a3d28');
  const chunk = new Builder().cube(0, 0, 0, 1, 1, 1, STEEL);
  const shell = new Builder().rod(0, 0, -0.5, 0.5, 0.5, 0.5, '#d9a441', 6);
  // The arrow over a team-mate's head.
  const tag = new Builder().tri([-0.1, 0.16, 0], [0.1, 0.16, 0], [0, 0, 0], [1, 1, 1]).tri([0.1, 0.16, 0], [-0.1, 0.16, 0], [0, 0, 0], [1, 1, 1]);
  return { robots: [robot(R, 0), robot(R, 1)], guns, arms, nade: R.mesh(nade), chunk: R.mesh(chunk), shell: R.mesh(shell), tag: R.mesh(tag) };
}

// Where each piece of a robot is, given how it stands. s: x, y, z, yaw,
// pitch, crouch (0..1), stride (how far through a step, in radians), pace
// (0 standing .. 1 walking .. 1.4 running), lean. Returns matrices.
export function pose(s) {
  const k = s.crouch, swing = Math.sin(s.stride) * 0.62 * s.pace;
  const legs = [swing, -swing].map((a, i) => {
    // The knee bends as the leg comes through from behind.
    const lift = Math.max(0, Math.sin(s.stride + (i ? Math.PI : 0) + 1.1)) * 0.95 * s.pace;
    const A = a + k * 1.08, B = A - lift - k * 1.97;
    return { A, B, reach: THIGH * Math.cos(A) + SHIN * Math.cos(B) };
  });
  const hip = Math.max(legs[0].reach, legs[1].reach);
  const root = M.chain(M.move(s.x, s.y, s.z), M.rotY(-s.yaw));
  const out = { root, hip, thigh: [], shin: [] };
  legs.forEach((l, i) => {
    const x = i ? 0.1 : -0.1;
    out.thigh.push(M.chain(root, M.move(x, hip, 0), M.rotX(l.A)));
    out.shin.push(M.chain(root, M.move(x, hip - THIGH * Math.cos(l.A), -THIGH * Math.sin(l.A)), M.rotX(l.B)));
  });
  out.hips = M.chain(root, M.move(0, hip, 0), M.rotX(-0.1 * k));
  // The top half leans into a run and a crouch, and tips to aim up and down.
  out.top = M.chain(root, M.move(0, hip + WAIST, 0), M.rotX(s.pitch * 0.75 - 0.22 * k - s.lean), M.rotY(Math.sin(s.stride) * 0.06 * s.pace));
  out.gun = M.chain(out.top, M.move(HOLD[0], HOLD[1], HOLD[2]), M.rotX(s.pitch * 0.25 + 0.22 * k + s.lean - s.lower));
  return out;
}
