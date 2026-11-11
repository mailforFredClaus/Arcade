// Honey Run: the models. Everything is built from boxes, columns and balls
// in flat colours: the boxy things crisp, the round things (the cub, wheels,
// roofs, balloons) shaded smooth. x is across the line, y is up, and the
// cub runs towards -z, so things on the line start at z = 0 (the end the
// cub meets) and stretch away to -length.

import { Builder, M, rgb, mix, shade } from './gl.js';
import { CAR, RAMP, ROOF, CART, CART_LEN } from './engine.js';

export const W = 1.4; // half the width of a wagon
export const GAUGE = 0.7; // half the distance between the rails
const X = W / 0.92; // (things across a wagon were first drawn for a narrower one)
const DARK = '#2b2f3a', STEEL = '#59606e', WOOD = '#b98146', WOOD_D = '#8f5f2f', WOOD_L = '#d6a468';
const TAU = Math.PI * 2;

// A wheel, lying across the line at (x, y, z).
function wheel(b, x, y, z, r = 0.34, w = 0.14) {
  b.with(M.chain(M.move(x, y, z), M.rotZ(Math.PI / 2)), () => {
    b.round(() => b.column(14, 0, -w / 2, 0, r, r, w, DARK, { top: DARK }));
    b.column(10, 0, -w / 2 - 0.01, 0, r * 0.45, r * 0.45, w + 0.02, '#aab1bf');
  });
}

function chassis(b, len) {
  b.box(-W + 0.06, 0.42, -len + 0.25, W - 0.06, 0.7, -0.25, DARK);
  for (const z of [-1.25, -2.3, -len + 2.3, -len + 1.25]) for (const x of [-GAUGE, GAUGE]) wheel(b, x, 0.36, z, 0.36, 0.16);
  // The bogie frames round each pair of wheels.
  for (const z of [-1.78, -len + 1.78]) for (const sx of [-1, 1]) b.box(sx * (GAUGE + 0.09), 0.3, z - 0.95, sx * (GAUGE + 0.17), 0.52, z + 0.95, '#3a3f4c');
  // Buffers at each end.
  for (const z of [-0.12, -len + 0.12]) for (const x of [-0.8, 0.8]) b.block(x, 0.46, z, 0.2, 0.2, 0.26, STEEL);
}

// Where the flat sides of a wagon end and its rounded roof begins.
const EAVES = 2.48;

// A rounded roof from z0 to z1: from the tops of the sides (at yb, w out
// from the middle) up to ROOF in the middle, shaded smooth, with its ends
// filled in.
function roundRoof(b, z0, z1, yb, color, w = W, end = color) {
  const n = 10, hr = ROOF - yb, pts = [];
  for (let k = 0; k <= n; k++) {
    const a = (Math.PI * k) / n, t = Math.cos(a), u = Math.sin(a);
    pts.push({ x: w * t, y: yb + hr * u, n: [t / w, u / hr, 0] });
  }
  for (let k = 0; k < n; k++) {
    const p = pts[k], q = pts[k + 1];
    b.triN([p.x, p.y, z1], [q.x, q.y, z1], [q.x, q.y, z0], p.n, q.n, q.n, color);
    b.triN([p.x, p.y, z1], [q.x, q.y, z0], [p.x, p.y, z0], p.n, q.n, p.n, color);
    for (const [z, nz] of [[z1, 1], [z0, -1]]) b.triN([0, yb, z], [p.x, p.y, z], [q.x, q.y, z], [0, 0, nz], [0, 0, nz], [0, 0, nz], end);
  }
}

// A wagon. style 0: boxcar. 1: coach. 2: a flat wagon with two containers.
function wagon(style, colour, second) {
  const b = new Builder(), len = CAR;
  const c = rgb(colour), dark = shade(c, 0.72), light = mix(c, [1, 1, 1], 0.28);
  const z0 = -len + 0.22, z1 = -0.22;
  chassis(b, len);
  if (style === 2) {
    b.box(-W, 0.7, z0, W, 0.86, z1, STEEL);
    const mid = (z0 + z1) / 2;
    [[z0 + 0.1, mid - 0.06, c], [mid + 0.06, z1 - 0.1, rgb(second)]].forEach(([a, e, col]) => {
      b.box(-W + 0.04, 0.86, a, W - 0.04, ROOF, e, col, { top: mix(col, [1, 1, 1], 0.22) });
      // Corrugations.
      for (let z = a + 0.3; z < e - 0.2; z += 0.42) for (const sx of [-1, 1]) b.box(sx * (W - 0.04), 1.0, z, sx * (W - 0.0), ROOF - 0.16, z + 0.16, shade(col, 0.8));
      // A frame round the top, and doors on the end you see.
      for (const sx of [-1, 1]) b.box(sx * (W - 0.04), ROOF - 0.14, a, sx * (W + 0.01), ROOF, e, shade(col, 0.7));
      b.box(-W + 0.14, 1.0, e, -0.03, ROOF - 0.14, e + 0.03, shade(col, 0.86));
      b.box(0.03, 1.0, e, W - 0.14, ROOF - 0.14, e + 0.03, shade(col, 0.86));
      b.box(-0.3, 1.6, e + 0.03, -0.2, 2.3, e + 0.06, '#e8ecf2');
      b.box(0.2, 1.6, e + 0.03, 0.3, 2.3, e + 0.06, '#e8ecf2');
    });
    return b;
  }
  // The body, a dark skirt along the bottom, and a pale rounded roof.
  b.box(-W, 0.7, z0, W, EAVES, z1, c, { noTop: true });
  b.box(-W - 0.012, 0.7, z0 - 0.012, W + 0.012, 1.0, z1 + 0.012, dark, { noTop: true, noBottom: true });
  b.box(-W - 0.02, EAVES - 0.1, z0 - 0.03, W + 0.02, EAVES, z1 + 0.03, shade(c, 0.82), { noTop: true, noBottom: true });
  roundRoof(b, z0 - 0.04, z1 + 0.04, EAVES - 0.02, mix(c, [0.9, 0.92, 0.95], 0.72), W + 0.04, mix(c, [0.9, 0.92, 0.95], 0.55));
  if (style === 0) {
    // Ribs, a bold stripe, and a sliding door in the middle of each side.
    for (let z = z0 + 0.5; z < z1 - 0.3; z += 1.05) for (const sx of [-1, 1]) b.box(sx * W, 1.0, z, sx * (W + 0.04), EAVES - 0.1, z + 0.12, dark);
    for (const sx of [-1, 1]) {
      b.box(sx * W, 1.62, z0 + 0.1, sx * (W + 0.05), 1.82, z1 - 0.1, light);
      b.box(sx * W, 1.0, -len / 2 - 1.1, sx * (W + 0.06), EAVES - 0.16, -len / 2 + 1.1, shade(c, 1.12));
      b.box(sx * (W + 0.06), 1.0, -len / 2 - 1.1, sx * (W + 0.08), EAVES - 0.16, -len / 2 - 0.95, dark);
      b.box(sx * (W + 0.06), 1.75, -len / 2 + 0.7, sx * (W + 0.1), 1.95, -len / 2 + 0.85, DARK);
    }
    // The end you see: a panel and a ladder.
    b.box(-0.62 * X, 1.05, z1, 0.62 * X, EAVES - 0.2, z1 + 0.03, light);
    for (let y = 1.0; y < EAVES - 0.1; y += 0.32) b.box(0.7, y, z1 + 0.03, 1.2, y + 0.06, z1 + 0.08, DARK);
    for (const x of [0.7, 1.2]) b.box(x - 0.03, 1.0, z1 + 0.03, x + 0.03, EAVES, z1 + 0.08, DARK);
  } else {
    // A coach: a cream band with a row of big windows, a stripe under it,
    // a door at each end of each side, and a door on the end.
    const glass = '#28374f';
    b.box(-W - 0.01, 1.5, z0 - 0.01, W + 0.01, EAVES - 0.1, z1 + 0.01, '#f6edd6', { noTop: true, noBottom: true });
    for (const sx of [-1, 1]) {
      b.box(sx * (W + 0.01), 1.3, z0 + 0.05, sx * (W + 0.025), 1.42, z1 - 0.05, light);
      for (let z = z0 + 1.35; z < z1 - 1.5; z += 1.32) b.box(sx * (W + 0.01), 1.68, z, sx * (W + 0.035), 2.3, z + 1.0, glass);
      for (const z of [z0 + 0.25, z1 - 1.15]) {
        b.box(sx * (W + 0.01), 0.95, z, sx * (W + 0.03), 2.34, z + 0.9, shade(c, 0.86));
        b.box(sx * (W + 0.03), 1.7, z + 0.15, sx * (W + 0.045), 2.2, z + 0.75, glass);
      }
    }
    b.box(-0.48, 0.98, z1 + 0.01, 0.48, EAVES - 0.08, z1 + 0.04, dark);
    b.box(-0.32, 1.7, z1 + 0.04, 0.32, 2.3, z1 + 0.06, glass);
    for (const sx of [-1, 1]) b.box(sx * 0.95 - 0.24, 1.7, z1 + 0.01, sx * 0.95 + 0.24, 2.3, z1 + 0.04, glass);
  }
  return b;
}

// The engine at the head of a rolling train: you see its face.
export const LAMP_X = 0.82, LAMP_Y = 1.45;
function engine() {
  const b = new Builder(), len = CAR, z0 = -len + 0.22, z1 = -0.3;
  chassis(b, len);
  const c = rgb('#d9483b'), dark = shade(c, 0.7), glass = '#22314a';
  b.box(-W, 0.7, z0, W, EAVES, z1, c, { noTop: true });
  roundRoof(b, z0 - 0.04, z1 + 0.04, EAVES - 0.02, rgb('#e9e4d8'), W + 0.04, rgb('#e9e4d8'));
  b.box(-W - 0.012, 0.7, z0 - 0.01, W + 0.012, 1.05, z1 + 0.012, dark, { noTop: true, noBottom: true });
  // A cream band and side windows.
  b.box(-W - 0.012, 1.95, z0 - 0.01, W + 0.012, 2.08, z1 + 0.012, '#f6edd6', { noTop: true, noBottom: true });
  for (const sx of [-1, 1]) for (const z of [z1 - 1.5, z1 - 3.1]) b.box(sx * (W + 0.01), 2.12, z, sx * (W + 0.035), 2.4, z + 1.1, glass);
  // The face: a big windscreen in a frame, a striped bumper, lamps.
  b.box(-1.3, 1.95, z1, 1.3, EAVES, z1 + 0.04, '#f6edd6');
  b.box(-1.18, 2.02, z1 + 0.04, -0.06, EAVES - 0.04, z1 + 0.07, glass);
  b.box(0.06, 2.02, z1 + 0.04, 1.18, EAVES - 0.04, z1 + 0.07, glass);
  for (let k = 0; k < 8; k++) b.box(-W + (k * W) / 4, 0.72, z1, -W + ((k + 1) * W) / 4, 1.04, z1 + 0.05, k % 2 ? '#ffd23f' : DARK);
  for (const sx of [-1, 1]) {
    b.with(M.chain(M.move(sx * LAMP_X, LAMP_Y, z1 + 0.02), M.rotX(Math.PI / 2)), () => {
      b.column(12, 0, 0, 0, 0.3, 0.3, 0.06, '#c9ccd4');
      b.column(12, 0, 0, 0, 0.23, 0.23, 0.1, '#fff7c2', { top: '#fff7c2' });
    });
  }
  // A wedge to clear the line.
  b.quad([-W, 0.12, z1 + 0.55], [W, 0.12, z1 + 0.55], [W, 0.62, z1], [-W, 0.62, z1], STEEL);
  b.tri([-W, 0.12, z1 + 0.55], [-W, 0.62, z1], [-W, 0.12, z1], STEEL);
  b.tri([W, 0.12, z1 + 0.55], [W, 0.12, z1], [W, 0.62, z1], STEEL);
  return b;
}

// A ramp of planks up to roof height, with arrows painted on it.
function ramp() {
  const b = new Builder(), len = RAMP, w = W - 0.04, n = 9;
  const top = (k) => [(k / n) * ROOF, -(k / n) * len];
  for (let k = 0; k < n; k++) {
    const [y0, za] = top(k), [y1, zb] = top(k + 1);
    b.quad([-w, y0, za], [w, y0, za], [w, y1, zb], [-w, y1, zb], k % 2 ? WOOD : WOOD_L);
  }
  // Sides and a back.
  for (const sx of [-1, 1]) {
    b.tri([sx * w, 0, 0], [sx * w, 0, -len], [sx * w, ROOF, -len], WOOD_D);
    // A rail to run your eye up.
    b.quad([sx * w, 0.02, 0], [sx * (w - 0.14), 0.02, 0], [sx * (w - 0.14), ROOF + 0.02, -len], [sx * w, ROOF + 0.02, -len], '#ffd23f');
  }
  b.quad([-w, 0, -len], [w, 0, -len], [w, ROOF, -len], [-w, ROOF, -len], WOOD_D);
  // Arrows pointing up the slope.
  for (const k of [2.2, 4.4, 6.6]) {
    const at = (kk, x) => { const [y, z] = top(kk); return [x, y + 0.02, z]; };
    b.quad(at(k, -0.76), at(k, -0.38), at(k + 1.1, 0), at(k + 1.5, 0), '#ffffff');
    b.quad(at(k, 0.38), at(k, 0.76), at(k + 1.5, 0), at(k + 1.1, 0), '#ffffff');
  }
  return b;
}

// A fence to jump: red and white along the top.
function fence() {
  const b = new Builder(), w = W - 0.05;
  for (const x of [-w + 0.12, w - 0.12]) b.block(x, 0, -0.25, 0.24, 1.06, 0.24, WOOD_D, { top: WOOD_L });
  b.box(-w, 0.26, -0.33, w, 0.5, -0.17, WOOD);
  for (let k = 0; k < 6; k++) b.box(-w + (k * w) / 3, 0.64, -0.36, -w + ((k + 1) * w) / 3, 1.0, -0.14, k % 2 ? '#ffffff' : '#e5383b');
  return b;
}

// Hay bales to jump.
function bales() {
  const b = new Builder();
  for (const [x, r] of [[-0.68, 0.05], [0.68, -0.04]]) {
    b.with(M.chain(M.move(x, 0, -0.3), M.rotY(r)), () => {
      b.block(0, 0, 0, 1.3, 0.92, 0.8, '#f2c84b', { top: '#ffe08a' });
      for (const z of [-0.22, 0.22]) b.box(-0.66, 0, z - 0.04, 0.66, 0.93, z + 0.04, '#c9982b');
    });
  }
  return b;
}

// A barrier to roll under: a striped board between two tall posts.
function barrier() {
  const b = new Builder(), w = W - 0.16;
  for (const x of [-w - 0.02, w + 0.02]) {
    b.block(x, 0, -0.25, 0.22, 2.95, 0.22, STEEL, { top: '#aab1bf' });
    b.block(x, 2.95, -0.25, 0.3, 0.14, 0.3, '#ffd23f');
  }
  for (let k = 0; k < 8; k++) b.box(-w + (k * w) / 4, 1.28, -0.32, -w + ((k + 1) * w) / 4, 2.5, -0.18, k % 2 ? '#2b2f3a' : '#ffd23f');
  b.box(-w, 2.5, -0.34, w, 2.62, -0.16, STEEL);
  b.box(-w, 1.2, -0.34, w, 1.28, -0.16, STEEL);
  return b;
}

// A hay cart: low enough to jump onto.
function cart() {
  const b = new Builder(), len = CART_LEN, w = W - 0.1;
  for (const z of [-0.9, -len + 0.9]) for (const x of [-w + 0.08, w - 0.08]) wheel(b, x, 0.42, z, 0.42, 0.16);
  b.box(-w, 0.5, -len + 0.15, w, 0.7, -0.15, WOOD_D);
  for (const sx of [-1, 1]) b.box(sx * w, 0.7, -len + 0.15, sx * (w - 0.1), 1.15, -0.15, WOOD);
  b.box(-w + 0.1, 0.7, -len + 0.15, w - 0.1, 1.15, -len + 0.25, WOOD);
  b.box(-w + 0.1, 0.7, -0.25, w - 0.1, 1.15, -0.15, WOOD);
  b.box(-w + 0.08, 1.0, -len + 0.2, w - 0.08, CART, -0.2, '#f2c84b', { top: '#ffe08a' });
  for (let z = -0.7; z > -len + 0.5; z -= 0.8) b.box(-w + 0.07, 1.15, z - 0.03, w - 0.07, CART + 0.005, z + 0.03, '#c9982b');
  // Shafts.
  for (const x of [-0.75, 0.75]) b.box(x - 0.06, 0.5, -0.15, x + 0.06, 0.6, 0.7, WOOD_D);
  return b;
}

// A gold hexagon, standing on edge: a thick coin with bevelled faces and a
// raised cell in the middle, like a piece of honeycomb.
function coin() {
  const b = new Builder();
  const face = () => {
    b.column(6, 0, 0.08, 0, 0.5, 0.41, 0.04, '#f2a900', { top: '#ffc928', turn: 0, noBottom: true });
    b.column(6, 0, 0.12, 0, 0.25, 0.21, 0.025, '#ffd84a', { top: '#fff0a0', turn: 0, noBottom: true });
  };
  b.with(M.rotX(Math.PI / 2), () => {
    b.column(6, 0, -0.08, 0, 0.5, 0.5, 0.16, '#d98a00', { noCaps: true, turn: 0 });
    face();
    b.with(M.rotX(Math.PI), face);
  });
  return b;
}

// ---- power-ups -------------------------------------------------------------------------

function magnet() {
  const b = new Builder();
  for (const sx of [-1, 1]) {
    b.box(sx * 0.36 - 0.13, -0.1, -0.13, sx * 0.36 + 0.13, 0.42, 0.13, '#e5383b');
    b.box(sx * 0.36 - 0.13, -0.38, -0.13, sx * 0.36 + 0.13, -0.1, 0.13, '#f4f6fa');
  }
  b.box(-0.49, 0.42, -0.13, 0.49, 0.68, 0.13, '#e5383b', { top: '#ff6b6b' });
  return b;
}

function balloons() {
  const b = new Builder();
  for (const [x, y, z, c] of [[-0.3, 0.42, 0, '#ff5a5f'], [0.3, 0.46, 0.04, '#3b9dff'], [0, 0.72, -0.05, '#ffd23f']]) {
    // (Brighter than life, so they glow against the sky.)
    b.round(() => b.ball(x, y, z, 0.27, 0.32, 0.27, rgb(c).map((v) => v * 1.35), 12, 8));
    b.quad([x - 0.012, y - 0.32, z], [x + 0.012, y - 0.32, z], [0.012, -0.5, 0], [-0.012, -0.5, 0], '#ffffff');
  }
  return b;
}

function boots() {
  const b = new Builder();
  for (const sx of [-1, 1]) {
    b.with(M.move(sx * 0.24, 0, 0), () => {
      b.box(-0.15, -0.05, -0.1, 0.15, 0.5, 0.2, '#ff8a1c');
      b.box(-0.15, -0.3, -0.34, 0.15, -0.05, 0.2, '#ff8a1c');
      b.box(-0.17, -0.42, -0.36, 0.17, -0.3, 0.22, '#f4f6fa');
      b.box(-0.17, 0.4, -0.12, 0.17, 0.52, 0.22, '#ffd23f');
      // A wing on the outside.
      b.quad([sx * 0.16, 0.05, 0.05], [sx * 0.16, 0.05, 0.2], [sx * 0.52, 0.42, 0.34], [sx * 0.3, 0.3, 0.1], '#ffffff');
    });
  }
  return b;
}

// A gold token with a 2 on each face.
function double() {
  const b = new Builder();
  b.with(M.rotX(Math.PI / 2), () => b.column(12, 0, -0.07, 0, 0.5, 0.5, 0.14, '#a45bff', { top: '#bf8aff', turn: 0 }));
  const two = ['###', '..#', '###', '#..', '###'];
  for (const [face, flip] of [[0.075, 1], [-0.075, -1]]) {
    two.forEach((row, r) => [...row].forEach((ch, k) => {
      if (ch !== '#') return;
      const x = flip * (k - 1) * 0.15, y = (2 - r) * 0.15;
      b.box(x - 0.075, y - 0.075, Math.min(face, face + flip * 0.03), x + 0.075, y + 0.075, Math.max(face, face + flip * 0.03), '#ffffff');
    }));
  }
  return b;
}

// A pot of honey (what the bubble keeps safe).
function pot() {
  const b = new Builder();
  b.smooth = true;
  b.column(8, 0, -0.32, 0, 0.26, 0.3, 0.2, '#ffb52e');
  b.column(8, 0, -0.12, 0, 0.3, 0.24, 0.34, '#ffb52e');
  b.column(8, 0, 0.22, 0, 0.27, 0.27, 0.08, '#f1e8d4', { top: '#fff8e8' });
  b.box(-0.3, -0.06, -0.3, 0.3, 0.06, 0.3, '#fff3b0', { noTop: true, noBottom: true });
  return b;
}

function sphere(color, r = 1) {
  const b = new Builder();
  return b.round(() => b.ball(0, 0, 0, r, r, r, color, 16, 10));
}

// ---- the cub ---------------------------------------------------------------------------

const FUR = '#c9803f', FUR_D = '#8f5527', CREAM = '#f3d3a2', SCARF = '#e5383b';

// skin: { fur, dark, cream, scarf }. A big round head and a round body,
// so it reads well from behind at speed.
function cub(skin = {}) {
  const fur = skin.fur || FUR, dark = skin.dark || FUR_D, cream = skin.cream || CREAM, scarf = skin.scarf || SCARF;
  const body = new Builder();
  body.smooth = true;
  body.ball(0, 0.8, 0, 0.37, 0.43, 0.33, fur, 14, 9);
  body.ball(0, 0.76, -0.2, 0.24, 0.29, 0.15, cream, 12, 7); // tummy
  body.ball(0, 0.56, 0.31, 0.11, 0.11, 0.11, cream, 9, 6); // tail
  // A scarf, with its ends flying out behind.
  body.column(16, 0, 1.03, 0, 0.32, 0.28, 0.15, scarf);
  // (Lit as if facing up and back, whichever way the cloth is turned.)
  const tail = (a, b, c, d, col) => {
    const n = [0, 0.75, 0.66];
    body.triN(a, b, c, n, n, n, col);
    body.triN(a, c, d, n, n, n, col);
  };
  tail([0.06, 1.14, 0.25], [0.2, 1.14, 0.25], [0.3, 1.02, 0.76], [0.14, 1.06, 0.72], scarf);
  tail([-0.14, 1.12, 0.25], [0, 1.12, 0.25], [0.02, 0.9, 0.64], [-0.12, 0.92, 0.66], shade(rgb(scarf), 0.86));
  // The honey pot on its back.
  body.smooth = true;
  body.column(12, 0, 0.5, 0.37, 0.17, 0.2, 0.14, '#ffb52e');
  body.column(12, 0, 0.64, 0.37, 0.2, 0.16, 0.24, '#ffb52e');
  body.column(12, 0, 0.88, 0.37, 0.18, 0.18, 0.06, '#f1e8d4', { top: '#fff8e8' });
  body.smooth = false;
  body.box(-0.34, 0.66, -0.05, -0.28, 0.72, 0.41, dark);
  body.box(0.28, 0.66, -0.05, 0.34, 0.72, 0.41, dark);

  const head = new Builder();
  head.smooth = true;
  head.ball(0, 0.33, 0, 0.4, 0.37, 0.37, fur, 16, 10);
  for (const sx of [-1, 1]) {
    head.ball(sx * 0.28, 0.64, 0.03, 0.14, 0.14, 0.09, fur, 10, 6);
    head.ball(sx * 0.28, 0.64, -0.03, 0.085, 0.085, 0.05, dark, 8, 5);
    head.ball(sx * 0.14, 0.4, -0.32, 0.06, 0.07, 0.04, '#ffffff', 8, 5); // eyes
    head.ball(sx * 0.14, 0.39, -0.35, 0.035, 0.045, 0.02, '#2a1c12', 8, 5);
  }
  head.ball(0, 0.24, -0.31, 0.17, 0.12, 0.11, cream, 10, 6);
  head.ball(0, 0.29, -0.41, 0.055, 0.045, 0.035, '#2a1c12', 8, 5);

  // An arm or a leg hanging from (0, 0, 0), with a round paw on the end.
  const limb = (len, r, paw) => {
    const b = new Builder();
    b.smooth = true;
    b.ball(0, 0, 0, r * 1.05, r * 1.05, r * 1.05, fur, 10, 6);
    b.column(12, 0, -len, 0, r * 0.95, r, len, fur, { noCaps: true });
    b.ball(0, -len - 0.02, -0.025, r * 1.18, r * 0.95, r * 1.35, paw, 10, 6);
    return b;
  };
  return { body, head, arm: limb(0.34, 0.088, dark), leg: limb(0.32, 0.108, dark) };
}

// A bright boot, worn on each leg while the spring boots last.
function bootOn() {
  const b = new Builder();
  b.box(-0.13, -0.3, -0.13, 0.13, -0.14, 0.13, '#ffd23f');
  b.box(-0.13, -0.42, -0.2, 0.13, -0.3, 0.13, '#ff8a1c');
  b.box(-0.14, -0.47, -0.21, 0.14, -0.42, 0.14, '#f4f6fa');
  return b;
}

// One bee.
function bee() {
  const b = new Builder();
  b.box(-0.07, -0.06, -0.12, 0.07, 0.06, -0.04, '#ffd23f');
  b.box(-0.07, -0.06, -0.04, 0.07, 0.06, 0.03, '#2a1c12');
  b.box(-0.07, -0.06, 0.03, 0.07, 0.06, 0.1, '#ffd23f');
  b.box(-0.05, -0.04, 0.1, 0.05, 0.04, 0.15, '#2a1c12');
  return b;
}
const wing = () => new Builder().quad([0, 0, -0.06], [0, 0, 0.05], [0.2, 0.03, 0.07], [0.2, 0.03, -0.04], '#eaf6ff');

// A flat dark disc: the cub's shadow.
const disc = () => new Builder().column(20, 0, 0, 0, 0.5, 0.5, 0.001, '#000000', { turn: 0 });

export const SKINS = [
  { id: 'cub', name: 'Bruno', cost: 0, fur: FUR, dark: FUR_D, cream: CREAM, scarf: SCARF },
  { id: 'polar', name: 'Snowy', cost: 1000, fur: '#f4f6fb', dark: '#b9c4d6', cream: '#ffffff', scarf: '#3b9dff' },
  { id: 'panda', name: 'Bao', cost: 2500, fur: '#f7f7f2', dark: '#2a2a30', cream: '#ffffff', scarf: '#3fae4f' },
  { id: 'honey', name: 'Goldie', cost: 5000, fur: '#ffc53d', dark: '#b97a00', cream: '#fff0b8', scarf: '#8a5fd6' },
];

const WAGON_COLOURS = [['#e24b3b', '#3b82e2'], ['#3b82e2', '#f2b632'], ['#3fa85a', '#e24b3b'], ['#f2b632', '#23a6a6'], ['#8a5fd6', '#3fa85a']];

// Builds every model. R: the Renderer.
export function makeModels(R) {
  const mesh = (b) => R.mesh(b);
  const models = {
    // wagons[look][style]
    wagons: WAGON_COLOURS.map(([a, b]) => [0, 1, 2].map((style) => mesh(wagon(style, a, b)))),
    engine: mesh(engine()),
    ramp: mesh(ramp()),
    low: [mesh(fence()), mesh(bales())],
    high: mesh(barrier()),
    cart: mesh(cart()),
    coin: mesh(coin()),
    power: { magnet: mesh(magnet()), fly: mesh(balloons()), boots: mesh(boots()), double: mesh(double()), bubble: mesh(pot()) },
    bubble: mesh(sphere([1.6, 1.6, 1.6])),
    bootOn: mesh(bootOn()),
    bee: mesh(bee()),
    wing: mesh(wing()),
    disc: mesh(disc()),
    cubs: {},
  };
  for (const skin of SKINS) {
    const c = cub(skin);
    models.cubs[skin.id] = { body: mesh(c.body), head: mesh(c.head), arm: mesh(c.arm), leg: mesh(c.leg) };
  }
  return models;
}

export { TAU };
