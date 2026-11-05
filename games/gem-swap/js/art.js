// Gem Swap: drawing the gems, power-ups, crates, chains, ice and coins.
// Everything is drawn in a unit square centred on 0,0 and scaled to the
// cell size; still pictures are kept as ready-made sprites.

import { LINE_H, LINE_V, BOMB, FLY, PRISM } from './engine.js';

// Six gems, each its own colour and its own shape, so they're easy to tell
// apart at a glance.
export const GEMS = [
  { name: 'red', shape: 'heart', base: '#ff3d5c', light: '#ffa3b5', dark: '#c0112f', edge: '#8e0a22', glint: [-0.2, -0.2] },
  { name: 'orange', shape: 'round', base: '#ff8b1f', light: '#ffd099', dark: '#d25d00', edge: '#9e4400', glint: [-0.16, -0.18] },
  { name: 'yellow', shape: 'star', base: '#ffd31f', light: '#fff5b0', dark: '#d89f00', edge: '#a87900', glint: [-0.07, -0.17] },
  { name: 'green', shape: 'square', base: '#2fd07a', light: '#a8f7cb', dark: '#13924f', edge: '#0b6a38', glint: [-0.17, -0.18] },
  { name: 'blue', shape: 'drop', base: '#3088ff', light: '#abd0ff', dark: '#174ccc', edge: '#0f3699', glint: [-0.13, -0.06] },
  { name: 'purple', shape: 'diamond', base: '#a95cff', light: '#dfc2ff', dark: '#6b25cc', edge: '#4f179c', glint: [-0.16, -0.2] },
];

const TAU = Math.PI * 2;

// ---- shapes -------------------------------------------------------------------------

export function shapePath(shape, k = 1) {
  const p = new Path2D();
  switch (shape) {
    case 'heart':
      p.moveTo(0, 0.37 * k);
      p.bezierCurveTo(-0.07 * k, 0.31 * k, -0.43 * k, 0.1 * k, -0.43 * k, -0.11 * k);
      p.bezierCurveTo(-0.43 * k, -0.31 * k, -0.28 * k, -0.4 * k, -0.16 * k, -0.4 * k);
      p.bezierCurveTo(-0.07 * k, -0.4 * k, -0.02 * k, -0.34 * k, 0, -0.28 * k);
      p.bezierCurveTo(0.02 * k, -0.34 * k, 0.07 * k, -0.4 * k, 0.16 * k, -0.4 * k);
      p.bezierCurveTo(0.28 * k, -0.4 * k, 0.43 * k, -0.31 * k, 0.43 * k, -0.11 * k);
      p.bezierCurveTo(0.43 * k, 0.1 * k, 0.07 * k, 0.31 * k, 0, 0.37 * k);
      p.closePath();
      break;
    case 'round':
      p.arc(0, 0, 0.4 * k, 0, TAU);
      break;
    case 'star': {
      const pts = [];
      for (let j = 0; j < 10; j++) {
        const a = -Math.PI / 2 + (j * Math.PI) / 5, r = (j % 2 ? 0.215 : 0.45) * k;
        pts.push([Math.cos(a) * r, Math.sin(a) * r + 0.03 * k]);
      }
      // Soften the points a little.
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const start = mid(pts[9], pts[0]);
      p.moveTo(start[0], start[1]);
      for (let j = 0; j < 10; j++) {
        const cur = pts[j], nxt = pts[(j + 1) % 10], m = mid(cur, nxt);
        p.quadraticCurveTo(cur[0], cur[1], m[0], m[1]);
      }
      p.closePath();
      break;
    }
    case 'square': {
      const s = 0.37 * k, r = 0.12 * k;
      p.roundRect(-s, -s, 2 * s, 2 * s, r);
      break;
    }
    case 'drop':
      p.moveTo(0, -0.45 * k);
      p.bezierCurveTo(0.12 * k, -0.27 * k, 0.37 * k, -0.06 * k, 0.37 * k, 0.13 * k);
      p.bezierCurveTo(0.37 * k, 0.33 * k, 0.2 * k, 0.43 * k, 0, 0.43 * k);
      p.bezierCurveTo(-0.2 * k, 0.43 * k, -0.37 * k, 0.33 * k, -0.37 * k, 0.13 * k);
      p.bezierCurveTo(-0.37 * k, -0.06 * k, -0.12 * k, -0.27 * k, 0, -0.45 * k);
      p.closePath();
      break;
    case 'diamond': {
      const pts = [[-0.25, -0.33], [0.25, -0.33], [0.44, -0.1], [0, 0.42], [-0.44, -0.1]];
      roundPoly(p, pts.map(([x, y]) => [x * k, y * k]), 0.06 * k);
      break;
    }
    default:
      p.arc(0, 0, 0.4 * k, 0, TAU);
  }
  return p;
}

function roundPoly(p, pts, r) {
  const n = pts.length;
  for (let j = 0; j < n; j++) {
    const a = pts[(j + n - 1) % n], b = pts[j], c = pts[(j + 1) % n];
    const d1 = Math.hypot(a[0] - b[0], a[1] - b[1]), d2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const p1 = [b[0] + ((a[0] - b[0]) / d1) * r, b[1] + ((a[1] - b[1]) / d1) * r];
    const p2 = [b[0] + ((c[0] - b[0]) / d2) * r, b[1] + ((c[1] - b[1]) / d2) * r];
    if (j === 0) p.moveTo(p1[0], p1[1]);
    else p.lineTo(p1[0], p1[1]);
    p.quadraticCurveTo(b[0], b[1], p2[0], p2[1]);
  }
  p.closePath();
}

// ---- sprites ---------------------------------------------------------------------------

// Kept for the last few sizes in use: gems are drawn a little smaller than
// crates and ice, and both are needed every frame.
const caches = new Map();

// A still picture at pixel size px, drawn once and reused.
export function sprite(key, px, paint) {
  let cache = caches.get(px);
  if (!cache) {
    cache = new Map();
    caches.set(px, cache);
    while (caches.size > 4) caches.delete(caches.keys().next().value);
  }
  let c = cache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    g.translate(px / 2, px / 2);
    g.scale(px, px);
    paint(g);
    cache.set(key, c);
  }
  return c;
}

function shadow(g, y = 0.41, rx = 0.3) {
  g.fillStyle = 'rgba(8, 10, 45, 0.28)';
  g.beginPath();
  g.ellipse(0, y, rx, 0.065, 0, 0, TAU);
  g.fill();
}

export function paintGem(g, color) {
  const d = GEMS[color];
  shadow(g);
  const body = shapePath(d.shape);
  const grad = g.createLinearGradient(-0.28, -0.42, 0.28, 0.42);
  grad.addColorStop(0, d.light);
  grad.addColorStop(0.42, d.base);
  grad.addColorStop(1, d.dark);
  g.fillStyle = grad;
  g.fill(body);
  g.lineJoin = 'round';
  g.lineWidth = 0.04;
  g.strokeStyle = d.edge;
  g.stroke(body);
  // A raised facet in the middle.
  g.save();
  g.translate(0, -0.025);
  const facet = shapePath(d.shape, 0.56);
  const fg = g.createLinearGradient(0, -0.26, 0, 0.24);
  fg.addColorStop(0, 'rgba(255,255,255,0.62)');
  fg.addColorStop(1, 'rgba(255,255,255,0.04)');
  g.fillStyle = fg;
  g.fill(facet);
  g.lineWidth = 0.018;
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.stroke(facet);
  g.restore();
  // Glints.
  const [gx, gy] = d.glint;
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.beginPath();
  g.ellipse(gx, gy, 0.085, 0.045, -0.75, 0, TAU);
  g.fill();
  g.beginPath();
  g.arc(gx + 0.1, gy - 0.07, 0.022, 0, TAU);
  g.fill();
}

function gemGradient(g, d, x0, y0, x1, y1) {
  const grad = g.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, d.light);
  grad.addColorStop(0.45, d.base);
  grad.addColorStop(1, d.dark);
  return grad;
}

// A line blaster: a capsule with an arrow at each end.
export function paintLine(g, color, vertical) {
  const d = GEMS[color];
  shadow(g, 0.4, 0.34);
  g.save();
  if (vertical) g.rotate(Math.PI / 2);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.beginPath();
  g.roundRect(-0.47, -0.25, 0.94, 0.5, 0.25);
  g.fill();
  const body = new Path2D();
  body.roundRect(-0.43, -0.21, 0.86, 0.42, 0.21);
  g.fillStyle = gemGradient(g, d, 0, -0.21, 0, 0.21);
  g.fill(body);
  g.lineWidth = 0.035;
  g.strokeStyle = d.edge;
  g.stroke(body);
  // Arrows.
  g.fillStyle = '#fff';
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(s * 0.4, 0);
    g.lineTo(s * 0.2, -0.15);
    g.lineTo(s * 0.2, 0.15);
    g.closePath();
    g.fill();
  }
  g.fillRect(-0.2, -0.045, 0.4, 0.09);
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.beginPath();
  g.roundRect(-0.3, -0.16, 0.6, 0.06, 0.03);
  g.fill();
  g.restore();
}

export function paintBomb(g, color) {
  const d = GEMS[color];
  shadow(g, 0.42, 0.3);
  // Fuse cap.
  g.save();
  g.translate(0.17, -0.25);
  g.rotate(0.6);
  g.fillStyle = '#5b6178';
  g.beginPath();
  g.roundRect(-0.08, -0.06, 0.16, 0.12, 0.03);
  g.fill();
  g.restore();
  g.strokeStyle = '#6b4b2a';
  g.lineWidth = 0.04;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0.2, -0.29);
  g.quadraticCurveTo(0.3, -0.42, 0.36, -0.35);
  g.stroke();
  const body = new Path2D();
  body.arc(0, 0.05, 0.34, 0, TAU);
  const grad = g.createRadialGradient(-0.12, -0.08, 0.04, 0, 0.05, 0.36);
  grad.addColorStop(0, d.light);
  grad.addColorStop(0.5, d.base);
  grad.addColorStop(1, d.dark);
  g.fillStyle = grad;
  g.fill(body);
  g.lineWidth = 0.04;
  g.strokeStyle = d.edge;
  g.stroke(body);
  // A band round the middle.
  g.save();
  g.clip(body);
  g.fillStyle = 'rgba(30, 20, 60, 0.28)';
  g.fillRect(-0.4, 0.06, 0.8, 0.09);
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.beginPath();
  g.ellipse(-0.13, -0.11, 0.09, 0.05, -0.7, 0, TAU);
  g.fill();
}

// The spark on a bomb's fuse (it flickers, so it's drawn every frame).
export function paintSpark(g, t) {
  const k = 0.75 + 0.25 * Math.sin(t / 60);
  g.save();
  g.translate(0.37, -0.36);
  g.fillStyle = 'rgba(255, 200, 60, 0.55)';
  g.beginPath();
  g.arc(0, 0, 0.09 * k, 0, TAU);
  g.fill();
  g.strokeStyle = '#fff6c4';
  g.lineWidth = 0.025;
  g.lineCap = 'round';
  for (let j = 0; j < 4; j++) {
    const a = j * (Math.PI / 2) + t / 200;
    g.beginPath();
    g.moveTo(Math.cos(a) * 0.03, Math.sin(a) * 0.03);
    g.lineTo(Math.cos(a) * 0.09 * k, Math.sin(a) * 0.09 * k);
    g.stroke();
  }
  g.restore();
}

// A butterfly. flap 0..1: how open the wings are.
export function paintFly(g, color, flap = 1, carry = 0) {
  const d = GEMS[color] || GEMS[4];
  const open = 0.45 + 0.55 * flap;
  g.save();
  g.fillStyle = 'rgba(8, 10, 45, 0.22)';
  g.beginPath();
  g.ellipse(0, 0.42, 0.26 * open, 0.05, 0, 0, TAU);
  g.fill();
  for (const s of [-1, 1]) {
    g.save();
    g.scale(s * open, 1);
    const up = new Path2D();
    up.moveTo(0.02, -0.04);
    up.bezierCurveTo(0.1, -0.42, 0.46, -0.44, 0.42, -0.16);
    up.bezierCurveTo(0.4, -0.02, 0.2, 0.02, 0.02, 0.0);
    up.closePath();
    const low = new Path2D();
    low.moveTo(0.02, 0.02);
    low.bezierCurveTo(0.26, 0.02, 0.38, 0.14, 0.3, 0.3);
    low.bezierCurveTo(0.22, 0.42, 0.06, 0.3, 0.02, 0.1);
    low.closePath();
    for (const wing of [low, up]) {
      g.fillStyle = gemGradient(g, d, 0.1, -0.4, 0.4, 0.3);
      g.fill(wing);
      g.lineWidth = 0.035;
      g.strokeStyle = d.edge;
      g.stroke(wing);
    }
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.beginPath();
    g.arc(0.27, -0.2, 0.055, 0, TAU);
    g.arc(0.19, 0.17, 0.04, 0, TAU);
    g.fill();
    g.restore();
  }
  // Body and feelers.
  g.fillStyle = '#2a2d4a';
  g.beginPath();
  g.ellipse(0, 0.02, 0.05, 0.2, 0, 0, TAU);
  g.fill();
  g.strokeStyle = '#2a2d4a';
  g.lineWidth = 0.025;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-0.02, -0.16);
  g.quadraticCurveTo(-0.06, -0.3, -0.13, -0.33);
  g.moveTo(0.02, -0.16);
  g.quadraticCurveTo(0.06, -0.3, 0.13, -0.33);
  g.stroke();
  if (carry) {
    g.save();
    g.translate(0, 0.3);
    g.scale(0.42, 0.42);
    if (carry === BOMB) paintBomb(g, color);
    else paintLine(g, color, carry === LINE_V);
    g.restore();
  }
  g.restore();
}

let conic = null;
// A prism: a rainbow orb. t turns its colours.
export function paintPrism(g, t) {
  shadow(g, 0.42, 0.3);
  const body = new Path2D();
  body.arc(0, 0, 0.39, 0, TAU);
  g.save();
  g.clip(body);
  if (conic === null) conic = typeof g.createConicGradient === 'function';
  if (conic) {
    const cg = g.createConicGradient(t / 900, 0, 0);
    const hues = ['#ff4d6d', '#ff9f1c', '#ffe14d', '#3ddc84', '#3a86ff', '#a45bff', '#ff4d6d'];
    hues.forEach((h, j) => cg.addColorStop(j / (hues.length - 1), h));
    g.fillStyle = cg;
  } else {
    const lg = g.createLinearGradient(-0.4, -0.4, 0.4, 0.4);
    ['#ff4d6d', '#ffe14d', '#3ddc84', '#3a86ff', '#a45bff'].forEach((h, j) => lg.addColorStop(j / 4, h));
    g.fillStyle = lg;
  }
  g.fillRect(-0.5, -0.5, 1, 1);
  const rg = g.createRadialGradient(-0.12, -0.14, 0.02, 0, 0, 0.42);
  rg.addColorStop(0, 'rgba(255,255,255,0.95)');
  rg.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.fillRect(-0.5, -0.5, 1, 1);
  g.restore();
  // Facets.
  g.strokeStyle = 'rgba(255,255,255,0.75)';
  g.lineWidth = 0.022;
  g.beginPath();
  for (let j = 0; j < 6; j++) {
    const a = (j * Math.PI) / 3 + t / 1500;
    g.moveTo(Math.cos(a) * 0.15, Math.sin(a) * 0.15);
    g.lineTo(Math.cos(a) * 0.38, Math.sin(a) * 0.38);
  }
  g.stroke();
  g.lineWidth = 0.045;
  g.strokeStyle = '#ffffff';
  g.stroke(body);
  g.fillStyle = '#fff';
  g.beginPath();
  for (let j = 0; j < 8; j++) {
    const a = -Math.PI / 2 + (j * Math.PI) / 4, r = j % 2 ? 0.06 : 0.16;
    g[j ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
}

export function paintCoin(g) {
  shadow(g, 0.42, 0.28);
  const body = new Path2D();
  body.arc(0, 0, 0.37, 0, TAU);
  const grad = g.createLinearGradient(-0.3, -0.36, 0.3, 0.36);
  grad.addColorStop(0, '#fff3b0');
  grad.addColorStop(0.45, '#ffc93c');
  grad.addColorStop(1, '#df9600');
  g.fillStyle = grad;
  g.fill(body);
  g.lineWidth = 0.04;
  g.strokeStyle = '#a86a00';
  g.stroke(body);
  g.lineWidth = 0.03;
  g.strokeStyle = 'rgba(168, 106, 0, 0.55)';
  g.beginPath();
  g.arc(0, 0, 0.28, 0, TAU);
  g.stroke();
  // A star stamped in the middle.
  const star = shapePath('star', 0.5);
  g.save();
  g.translate(0, -0.01);
  g.fillStyle = '#e39d00';
  g.fill(star);
  g.translate(-0.012, -0.012);
  g.fillStyle = '#ffe27a';
  g.fill(star);
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.beginPath();
  g.ellipse(-0.15, -0.17, 0.08, 0.04, -0.75, 0, TAU);
  g.fill();
}

const WOOD = [
  null,
  { top: '#f0bd7d', mid: '#d99a54', bot: '#b9772f', edge: '#83501c', line: 'rgba(110, 62, 18, 0.55)' },
  { top: '#d99d5c', mid: '#bd7d3b', bot: '#9c5f23', edge: '#6a3d12', line: 'rgba(84, 45, 10, 0.6)' },
  { top: '#b47b48', mid: '#93592b', bot: '#74411b', edge: '#4a260b', line: 'rgba(52, 26, 6, 0.65)' },
];

export function paintCrate(g, hp) {
  const w = WOOD[Math.max(1, Math.min(3, hp))];
  const box = new Path2D();
  box.roundRect(-0.46, -0.46, 0.92, 0.92, 0.1);
  const grad = g.createLinearGradient(0, -0.46, 0, 0.46);
  grad.addColorStop(0, w.top);
  grad.addColorStop(0.5, w.mid);
  grad.addColorStop(1, w.bot);
  g.fillStyle = grad;
  g.fill(box);
  g.save();
  g.clip(box);
  // Planks and a brace.
  g.strokeStyle = w.line;
  g.lineWidth = 0.025;
  g.beginPath();
  for (const y of [-0.15, 0.15]) {
    g.moveTo(-0.46, y);
    g.lineTo(0.46, y);
  }
  g.stroke();
  g.lineWidth = 0.1;
  g.strokeStyle = w.bot;
  g.beginPath();
  g.moveTo(-0.34, 0.34);
  g.lineTo(0.34, -0.34);
  g.stroke();
  g.lineWidth = 0.02;
  g.strokeStyle = w.line;
  g.beginPath();
  g.moveTo(-0.38, 0.3);
  g.lineTo(0.3, -0.38);
  g.moveTo(-0.3, 0.38);
  g.lineTo(0.38, -0.3);
  g.stroke();
  g.restore();
  // Frame.
  g.lineWidth = 0.075;
  g.strokeStyle = w.bot;
  g.beginPath();
  g.roundRect(-0.4, -0.4, 0.8, 0.8, 0.06);
  g.stroke();
  g.lineWidth = 0.035;
  g.strokeStyle = w.edge;
  g.stroke(box);
  if (hp >= 2) {
    // Iron straps.
    for (const y of [-0.27, 0.27]) {
      const sg = g.createLinearGradient(0, y - 0.05, 0, y + 0.05);
      sg.addColorStop(0, '#d5dbe6');
      sg.addColorStop(1, '#7b869c');
      g.fillStyle = sg;
      g.fillRect(-0.46, y - 0.05, 0.92, 0.1);
      g.fillStyle = '#4d566b';
      for (const x of [-0.33, 0.33]) {
        g.beginPath();
        g.arc(x, y, 0.025, 0, TAU);
        g.fill();
      }
    }
  }
  if (hp >= 3) {
    // Iron corners.
    g.fillStyle = '#8d97ab';
    g.strokeStyle = '#4d566b';
    g.lineWidth = 0.02;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.beginPath();
      g.moveTo(sx * 0.46, sy * 0.2);
      g.lineTo(sx * 0.46, sy * 0.46);
      g.lineTo(sx * 0.2, sy * 0.46);
      g.lineTo(sx * 0.2, sy * 0.36);
      g.lineTo(sx * 0.36, sy * 0.36);
      g.lineTo(sx * 0.36, sy * 0.2);
      g.closePath();
      g.fill();
      g.stroke();
    }
  }
  g.fillStyle = 'rgba(255,255,255,0.22)';
  g.beginPath();
  g.roundRect(-0.4, -0.43, 0.8, 0.07, 0.035);
  g.fill();
}

// Two chains crossed over a gem.
export function paintChain(g) {
  const link = (x, y, a, big) => {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.lineWidth = 0.05;
    g.strokeStyle = '#3f4659';
    g.beginPath();
    g.ellipse(0, 0, big ? 0.085 : 0.075, 0.045, 0, 0, TAU);
    g.stroke();
    g.lineWidth = 0.03;
    g.strokeStyle = big ? '#dfe4ee' : '#aeb6c7';
    g.stroke();
    g.restore();
  };
  for (const dir of [1, -1]) {
    for (let k = -3; k <= 3; k++) {
      const t = k * 0.125;
      link(t, t * dir, dir * Math.PI / 4 + (k % 2 ? Math.PI / 2 : 0), k % 2 === 0);
    }
  }
  // A padlock in the middle.
  g.lineWidth = 0.035;
  g.strokeStyle = '#5c6378';
  g.beginPath();
  g.arc(0, -0.04, 0.065, Math.PI, 0);
  g.stroke();
  const lg = g.createLinearGradient(0, -0.04, 0, 0.12);
  lg.addColorStop(0, '#ffe08a');
  lg.addColorStop(1, '#d99a00');
  g.fillStyle = lg;
  g.beginPath();
  g.roundRect(-0.1, -0.04, 0.2, 0.16, 0.03);
  g.fill();
  g.lineWidth = 0.02;
  g.strokeStyle = '#9b6a00';
  g.stroke();
  g.fillStyle = '#7a5200';
  g.beginPath();
  g.arc(0, 0.03, 0.022, 0, TAU);
  g.fill();
}

// Ice under a cell: layers 1 or 2.
export function paintIce(g, layers) {
  const thick = layers >= 2;
  const tile = new Path2D();
  tile.roundRect(-0.47, -0.47, 0.94, 0.94, 0.12);
  const grad = g.createLinearGradient(-0.4, -0.47, 0.4, 0.47);
  if (thick) {
    grad.addColorStop(0, 'rgba(150, 214, 255, 0.98)');
    grad.addColorStop(1, 'rgba(38, 126, 222, 0.98)');
  } else {
    grad.addColorStop(0, 'rgba(214, 243, 255, 0.92)');
    grad.addColorStop(1, 'rgba(118, 196, 246, 0.9)');
  }
  g.fillStyle = grad;
  g.fill(tile);
  g.lineWidth = 0.03;
  g.strokeStyle = thick ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)';
  g.stroke(tile);
  if (thick) {
    // A second rim: two layers to break.
    g.lineWidth = 0.025;
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.beginPath();
    g.roundRect(-0.39, -0.39, 0.78, 0.78, 0.08);
    g.stroke();
  }
  g.save();
  g.clip(tile);
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.beginPath();
  g.moveTo(-0.47, 0.05);
  g.lineTo(0.05, -0.47);
  g.lineTo(0.2, -0.47);
  g.lineTo(-0.47, 0.2);
  g.closePath();
  g.fill();
  if (thick) {
    g.strokeStyle = 'rgba(255,255,255,0.8)';
    g.lineWidth = 0.02;
    g.beginPath();
    g.moveTo(0.1, 0.47);
    g.lineTo(0.18, 0.2);
    g.lineTo(0.35, 0.1);
    g.moveTo(0.18, 0.2);
    g.lineTo(0.05, 0.08);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [x, y] of [[-0.25, 0.25], [0.3, -0.22], [-0.05, 0.32]]) {
      g.beginPath();
      g.arc(x, y, 0.022, 0, TAU);
      g.fill();
    }
  }
  g.restore();
}

// The picture for a piece. power: NONE, a line, BOMB, FLY or PRISM.
export function pieceSprite(px, color, power) {
  if (power === PRISM) return null; // drawn live, it shimmers
  if (power === FLY) return null; // drawn live, it flaps
  return sprite(`p${color}:${power}`, px, (g) => {
    if (power === LINE_H || power === LINE_V) paintLine(g, color, power === LINE_V);
    else if (power === BOMB) paintBomb(g, color);
    else paintGem(g, color);
  });
}

export const coinSprite = (px) => sprite('coin', px, paintCoin);
export const crateSprite = (px, hp) => sprite(`crate${hp}`, px, (g) => paintCrate(g, hp));
export const chainSprite = (px) => sprite('chain', px, paintChain);
export const iceSprite = (px, layers) => sprite(`ice${layers}`, px, (g) => paintIce(g, layers));

// A small picture as a data URL, for cards and the goal bar.
export function icon(px, paint) {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const g = c.getContext('2d');
  g.translate(px / 2, px / 2);
  g.scale(px, px);
  paint(g);
  return c.toDataURL();
}
