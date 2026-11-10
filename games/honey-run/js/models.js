// Honey Run: the models. Everything is built from boxes, columns and lumpy
// balls in flat colours. x is across the line, y is up, and the cub runs
// towards -z, so things on the line start at z = 0 (the end the cub meets)
// and stretch away to -length.

import { Builder, M, rgb, mix, shade } from './gl.js';
import { CAR, RAMP, ROOF, CART, CART_LEN } from './engine.js';

const W = 0.92; // half the width of a wagon
const DARK = '#2b2f3a', STEEL = '#59606e', WOOD = '#b98146', WOOD_D = '#8f5f2f', WOOD_L = '#d6a468';
const TAU = Math.PI * 2;

// A wheel, lying across the line at (x, y, z).
function wheel(b, x, y, z, r = 0.34, w = 0.14) {
  b.with(M.chain(M.move(x, y, z), M.rotZ(Math.PI / 2)), () => {
    b.column(10, 0, -w / 2, 0, r, r, w, DARK, { top: DARK });
    b.column(10, 0, -w / 2 - 0.01, 0, r * 0.45, r * 0.45, w + 0.02, '#aab1bf');
  });
}

function chassis(b, len) {
  b.box(-W + 0.06, 0.42, -len + 0.25, W - 0.06, 0.7, -0.25, DARK);
  for (const z of [-1.25, -2.3, -len + 2.3, -len + 1.25]) for (const x of [-0.72, 0.72]) wheel(b, x, 0.34, z);
  // Buffers at each end.
  for (const z of [-0.12, -len + 0.12]) for (const x of [-0.5, 0.5]) b.block(x, 0.48, z, 0.16, 0.16, 0.26, STEEL);
}

// A freight wagon. style 0: boxcar. 1: coach. 2: two containers.
function wagon(style, colour, second) {
  const b = new Builder(), len = CAR;
  const c = rgb(colour), dark = shade(c, 0.72), light = mix(c, [1, 1, 1], 0.28);
  const z0 = -len + 0.22, z1 = -0.22;
  chassis(b, len);
  if (style === 2) {
    // A flat wagon with two containers.
    b.box(-W, 0.7, z0, W, 0.86, z1, STEEL);
    const mid = (z0 + z1) / 2;
    [[z0 + 0.1, mid - 0.06, c], [mid + 0.06, z1 - 0.1, rgb(second)]].forEach(([a, e, col]) => {
      b.box(-W + 0.04, 0.86, a, W - 0.04, ROOF, e, col, { top: mix(col, [1, 1, 1], 0.22) });
      // Corrugations.
      for (let z = a + 0.3; z < e - 0.2; z += 0.42) for (const sx of [-1, 1]) b.box(sx * (W - 0.04), 1.0, z, sx * (W - 0.0), ROOF - 0.16, z + 0.16, shade(col, 0.8));
      // Doors on the end you see.
      b.box(-W + 0.14, 1.0, e, -0.03, ROOF - 0.14, e + 0.03, shade(col, 0.86));
      b.box(0.03, 1.0, e, W - 0.14, ROOF - 0.14, e + 0.03, shade(col, 0.86));
      b.box(-0.2, 1.7, e + 0.03, -0.12, 2.3, e + 0.06, '#e8ecf2');
      b.box(0.12, 1.7, e + 0.03, 0.2, 2.3, e + 0.06, '#e8ecf2');
    });
    return b;
  }
  // The body, with a paler roof and a walkway of planks along the top.
  b.box(-W, 0.7, z0, W, ROOF - 0.08, z1, c, { noTop: true });
  b.box(-W - 0.05, ROOF - 0.08, z0 - 0.05, W + 0.05, ROOF, z1 + 0.05, mix(c, [0.9, 0.92, 0.95], 0.72));
  b.box(-0.3, ROOF, z0 + 0.2, 0.3, ROOF + 0.03, z1 - 0.2, WOOD_L);
  b.box(-W - 0.01, 0.7, z0 - 0.01, W + 0.01, 0.98, z1 + 0.01, dark, { noTop: true, noBottom: true });
  if (style === 0) {
    // Ribs, and a sliding door in the middle of each side.
    for (let z = z0 + 0.5; z < z1 - 0.3; z += 1.05) for (const sx of [-1, 1]) b.box(sx * W, 0.98, z, sx * (W + 0.04), ROOF - 0.1, z + 0.12, dark);
    for (const sx of [-1, 1]) {
      b.box(sx * W, 1.0, -len / 2 - 1.1, sx * (W + 0.05), ROOF - 0.25, -len / 2 + 1.1, light);
      b.box(sx * (W + 0.05), 1.75, -len / 2 + 0.7, sx * (W + 0.09), 1.95, -len / 2 + 0.85, DARK);
    }
    // The end you see: a ladder and a panel.
    b.box(-0.62, 1.05, z1, 0.62, ROOF - 0.3, z1 + 0.03, light);
    for (let y = 1.0; y < ROOF - 0.2; y += 0.36) b.box(0.42, y, z1 + 0.03, 0.8, y + 0.06, z1 + 0.08, DARK);
  } else {
    // A coach: cream above, a row of windows, a door on the end.
    b.box(-W - 0.01, 1.55, z0 - 0.01, W + 0.01, ROOF - 0.08, z1 + 0.01, '#f6edd6', { noTop: true, noBottom: true });
    for (let z = z0 + 0.45; z < z1 - 0.9; z += 1.25) for (const sx of [-1, 1]) b.box(sx * (W + 0.01), 1.75, z, sx * (W + 0.035), 2.5, z + 0.85, '#3d5a80');
    b.box(-0.36, 0.98, z1 + 0.01, 0.36, 2.66, z1 + 0.04, dark);
    b.box(-0.24, 1.8, z1 + 0.04, 0.24, 2.5, z1 + 0.06, '#3d5a80');
    for (const sx of [-1, 1]) b.box(sx * 0.62 - 0.14, 1.8, z1 + 0.01, sx * 0.62 + 0.14, 2.5, z1 + 0.04, '#3d5a80');
  }
  return b;
}

// The engine at the head of a rolling train: you see its face.
function engine() {
  const b = new Builder(), len = CAR, z0 = -len + 0.22, z1 = -0.3;
  chassis(b, len);
  const c = rgb('#d9483b'), dark = shade(c, 0.7);
  b.box(-W, 0.7, z0, W, ROOF - 0.08, z1, c, { noTop: true });
  b.box(-W - 0.05, ROOF - 0.08, z0 - 0.05, W + 0.05, ROOF, z1 + 0.05, '#e9e4d8');
  b.box(-W - 0.01, 0.7, z0 - 0.01, W + 0.01, 1.05, z1 + 0.01, dark, { noTop: true, noBottom: true });
  // A cream band and side windows.
  b.box(-W - 0.012, 2.02, z0 - 0.01, W + 0.012, 2.18, z1 + 0.012, '#f6edd6', { noTop: true, noBottom: true });
  for (const sx of [-1, 1]) for (const z of [z1 - 1.5, z1 - 3.1]) b.box(sx * (W + 0.01), 2.25, z, sx * (W + 0.035), 2.75, z + 1.1, '#2c3e5c');
  // The face: two windows, a striped bumper, lamps.
  b.box(-0.78, 2.2, z1, -0.08, 2.76, z1 + 0.035, '#2c3e5c');
  b.box(0.08, 2.2, z1, 0.78, 2.76, z1 + 0.035, '#2c3e5c');
  for (let k = 0; k < 8; k++) b.box(-W + k * 0.23, 0.72, z1, -W + (k + 1) * 0.23, 1.04, z1 + 0.05, k % 2 ? '#ffd23f' : DARK);
  for (const sx of [-1, 1]) b.with(M.chain(M.move(sx * 0.56, 1.5, z1 + 0.02), M.rotX(Math.PI / 2)), () => b.column(10, 0, 0, 0, 0.2, 0.2, 0.08, '#fff7c2', { top: '#fff7c2' }));
  b.with(M.chain(M.move(0, 1.75, z1 + 0.02), M.rotX(Math.PI / 2)), () => b.column(10, 0, 0, 0, 0.13, 0.13, 0.07, '#fff7c2'));
  // A wedge to clear the line.
  b.quad([-W, 0.12, z1 + 0.55], [W, 0.12, z1 + 0.55], [W, 0.62, z1], [-W, 0.62, z1], STEEL);
  b.tri([-W, 0.12, z1 + 0.55], [-W, 0.62, z1], [-W, 0.12, z1], STEEL);
  b.tri([W, 0.12, z1 + 0.55], [W, 0.12, z1], [W, 0.62, z1], STEEL);
  return b;
}

// A ramp of planks up to roof height, with arrows painted on it.
function ramp() {
  const b = new Builder(), len = RAMP, w = 0.9, n = 9;
  const top = (k) => [(k / n) * ROOF, -(k / n) * len];
  for (let k = 0; k < n; k++) {
    const [y0, za] = top(k), [y1, zb] = top(k + 1);
    b.quad([-w, y0, za], [w, y0, za], [w, y1, zb], [-w, y1, zb], k % 2 ? WOOD : WOOD_L);
  }
  // Sides and a back.
  for (const sx of [-1, 1]) {
    b.tri([sx * w, 0, 0], [sx * w, 0, -len], [sx * w, ROOF, -len], WOOD_D);
    // A rail to run your eye up.
    b.quad([sx * w, 0.02, 0], [sx * (w - 0.1), 0.02, 0], [sx * (w - 0.1), ROOF + 0.02, -len], [sx * w, ROOF + 0.02, -len], '#ffd23f');
  }
  b.quad([-w, 0, -len], [w, 0, -len], [w, ROOF, -len], [-w, ROOF, -len], WOOD_D);
  // Arrows pointing up the slope.
  for (const k of [2.2, 4.4, 6.6]) {
    const at = (kk, x) => { const [y, z] = top(kk); return [x, y + 0.02, z]; };
    b.quad(at(k, -0.5), at(k, -0.25), at(k + 1.1, 0), at(k + 1.5, 0), '#ffffff');
    b.quad(at(k, 0.25), at(k, 0.5), at(k + 1.5, 0), at(k + 1.1, 0), '#ffffff');
  }
  return b;
}

// A fence to jump: red and white along the top.
function fence() {
  const b = new Builder();
  for (const x of [-0.82, 0.82]) b.block(x, 0, -0.25, 0.16, 1.02, 0.16, WOOD_D, { top: WOOD_L });
  b.box(-0.9, 0.3, -0.31, 0.9, 0.5, -0.19, WOOD);
  for (let k = 0; k < 6; k++) b.box(-0.9 + k * 0.3, 0.68, -0.33, -0.6 + k * 0.3, 0.96, -0.17, k % 2 ? '#ffffff' : '#e5383b');
  return b;
}

// Hay bales to jump.
function bales() {
  const b = new Builder();
  for (const [x, r] of [[-0.46, 0.05], [0.46, -0.04]]) {
    b.with(M.chain(M.move(x, 0, -0.25), M.rotY(r)), () => {
      b.block(0, 0, 0, 0.86, 0.9, 0.62, '#f2c84b', { top: '#ffe08a' });
      for (const z of [-0.18, 0.18]) b.box(-0.44, 0, z - 0.03, 0.44, 0.91, z + 0.03, '#c9982b');
    });
  }
  return b;
}

// A barrier to roll under: a striped board between two tall posts.
function barrier() {
  const b = new Builder();
  for (const x of [-0.88, 0.88]) {
    b.block(x, 0, -0.25, 0.16, 2.95, 0.16, STEEL, { top: '#aab1bf' });
    b.block(x, 2.95, -0.25, 0.22, 0.14, 0.22, '#ffd23f');
  }
  for (let k = 0; k < 8; k++) b.box(-0.8 + k * 0.2, 1.28, -0.31, -0.6 + k * 0.2, 2.5, -0.19, k % 2 ? '#2b2f3a' : '#ffd23f');
  b.box(-0.8, 2.5, -0.33, 0.8, 2.62, -0.17, STEEL);
  b.box(-0.8, 1.2, -0.33, 0.8, 1.28, -0.17, STEEL);
  return b;
}

// A hay cart: low enough to jump onto.
function cart() {
  const b = new Builder(), len = CART_LEN;
  for (const z of [-0.9, -len + 0.9]) for (const x of [-0.8, 0.8]) wheel(b, x, 0.42, z, 0.42, 0.12);
  b.box(-0.86, 0.5, -len + 0.15, 0.86, 0.7, -0.15, WOOD_D);
  for (const sx of [-1, 1]) b.box(sx * 0.86, 0.7, -len + 0.15, sx * 0.78, 1.15, -0.15, WOOD);
  b.box(-0.78, 0.7, -len + 0.15, 0.78, 1.15, -len + 0.23, WOOD);
  b.box(-0.78, 0.7, -0.23, 0.78, 1.15, -0.15, WOOD);
  b.box(-0.8, 1.0, -len + 0.2, 0.8, CART, -0.2, '#f2c84b', { top: '#ffe08a' });
  for (let z = -0.7; z > -len + 0.5; z -= 0.8) b.box(-0.81, 1.15, z - 0.03, 0.81, CART + 0.005, z + 0.03, '#c9982b');
  // Shafts.
  for (const x of [-0.5, 0.5]) b.box(x - 0.05, 0.5, -0.15, x + 0.05, 0.6, 0.7, WOOD_D);
  return b;
}

// A gold hexagon, standing on edge.
function coin() {
  const b = new Builder();
  b.with(M.rotX(Math.PI / 2), () => {
    // (Drawn in its own colours, unlit, so it always shines.)
    b.column(6, 0, -0.06, 0, 0.38, 0.38, 0.12, '#f2a200', { top: '#ffcb1f', turn: 0 });
    b.column(6, 0, -0.075, 0, 0.24, 0.24, 0.15, '#ffe36a', { top: '#fff6c4', turn: 0 });
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
    b.ball(x, y, z, 0.27, 0.32, 0.27, rgb(c).map((v) => v * 1.35), 7, 5);
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
  b.column(8, 0, -0.32, 0, 0.26, 0.3, 0.2, '#ffb52e');
  b.column(8, 0, -0.12, 0, 0.3, 0.24, 0.34, '#ffb52e');
  b.column(8, 0, 0.22, 0, 0.27, 0.27, 0.08, '#f1e8d4', { top: '#fff8e8' });
  b.box(-0.3, -0.06, -0.3, 0.3, 0.06, 0.3, '#fff3b0', { noTop: true, noBottom: true });
  return b;
}

const sphere = (color, r = 1) => new Builder().ball(0, 0, 0, r, r, r, color, 12, 8);

// ---- the cub ---------------------------------------------------------------------------

const FUR = '#c9803f', FUR_D = '#8f5527', CREAM = '#f3d3a2', SCARF = '#e5383b';

// skin: { fur, dark, cream, scarf }.
function cub(skin = {}) {
  const fur = skin.fur || FUR, dark = skin.dark || FUR_D, cream = skin.cream || CREAM, scarf = skin.scarf || SCARF;
  const body = new Builder();
  body.ball(0, 0.8, 0, 0.36, 0.42, 0.31, fur, 8, 5);
  body.ball(0, 0.76, -0.2, 0.22, 0.27, 0.14, cream, 7, 4); // tummy
  body.ball(0, 0.56, 0.3, 0.1, 0.1, 0.1, cream, 6, 4); // tail
  // A scarf, with its ends flying out behind.
  body.column(8, 0, 1.06, 0, 0.3, 0.27, 0.13, scarf);
  body.quad([0.06, 1.14, 0.24], [0.2, 1.14, 0.24], [0.3, 1.02, 0.74], [0.14, 1.06, 0.7], scarf);
  body.quad([-0.14, 1.12, 0.24], [0, 1.12, 0.24], [0.02, 0.9, 0.62], [-0.12, 0.92, 0.64], shade(rgb(scarf), 0.82));
  // The honey pot on its back.
  body.column(8, 0, 0.5, 0.36, 0.17, 0.2, 0.14, '#ffb52e');
  body.column(8, 0, 0.64, 0.36, 0.2, 0.16, 0.24, '#ffb52e');
  body.column(8, 0, 0.88, 0.36, 0.18, 0.18, 0.06, '#f1e8d4', { top: '#fff8e8' });
  body.box(-0.34, 0.66, -0.05, -0.28, 0.72, 0.4, dark);
  body.box(0.28, 0.66, -0.05, 0.34, 0.72, 0.4, dark);

  const head = new Builder();
  head.ball(0, 0.3, 0, 0.34, 0.31, 0.31, fur, 8, 5);
  for (const sx of [-1, 1]) {
    head.ball(sx * 0.25, 0.58, 0.02, 0.12, 0.12, 0.08, fur, 6, 4);
    head.ball(sx * 0.25, 0.58, -0.04, 0.07, 0.07, 0.05, dark, 6, 4);
    head.ball(sx * 0.13, 0.36, -0.28, 0.045, 0.055, 0.03, '#2a1c12', 6, 4); // eyes
  }
  head.ball(0, 0.22, -0.27, 0.15, 0.11, 0.1, cream, 7, 4);
  head.ball(0, 0.27, -0.36, 0.05, 0.04, 0.03, '#2a1c12', 6, 4);

  const limb = (len, w, d, paw) => {
    const b = new Builder();
    b.box(-w / 2, -len, -d / 2, w / 2, 0.04, d / 2, fur);
    b.box(-w / 2 - 0.01, -len - 0.1, -d / 2 - 0.05, w / 2 + 0.01, -len, d / 2 + 0.01, paw);
    return b;
  };
  return { body, head, arm: limb(0.36, 0.14, 0.15, dark), leg: limb(0.34, 0.18, 0.2, dark) };
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

// A flat dark disc: the cub's shadow when it isn't on the ground.
const disc = () => new Builder().column(12, 0, 0, 0, 0.5, 0.5, 0.001, '#000000', { turn: 0 });

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
