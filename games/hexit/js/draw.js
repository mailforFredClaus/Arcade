// Hexit: drawing the tiles, stones, pads and the honeycomb floor.
// Tiles are coloured by the way they point, so you can see at a glance
// which tiles run the same way.

import { ANGLE, opposite } from './hex.js';

export const COLORS = [ // N, NE, SE, S, SW, NW
  { top: '#ff6b81', side: '#c8385a', light: '#ffb0bd' },
  { top: '#ffa24a', side: '#cf6d12', light: '#ffd0a0' },
  { top: '#ffcf3a', side: '#c99600', light: '#fff0a8' },
  { top: '#3fcf7f', side: '#14884b', light: '#a8f2c8' },
  { top: '#4aa3ff', side: '#1d5fc4', light: '#b0d6ff' },
  { top: '#a77bff', side: '#6b3fd2', light: '#d8c4ff' },
];

// The tiles hidden under a stack, seen from the top while the one above is
// away (bumping): no arrow until they're uncovered.
const PLAIN = { top: '#e8edf8', side: '#9aa6c8', light: '#ffffff' };

const TAU = Math.PI * 2;

export function hexPath(g, x, y, a) {
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const t = (k * Math.PI) / 3;
    const px = x + a * Math.cos(t), py = y + a * Math.sin(t);
    if (k) g.lineTo(px, py);
    else g.moveTo(px, py);
  }
  g.closePath();
}

// A rounder hexagon for the tiles.
function softHex(g, x, y, a, round = 0.18) {
  g.beginPath();
  const pts = [];
  for (let k = 0; k < 6; k++) {
    const t = (k * Math.PI) / 3;
    pts.push([x + a * Math.cos(t), y + a * Math.sin(t)]);
  }
  for (let k = 0; k < 6; k++) {
    const p = pts[k], n = pts[(k + 1) % 6], prev = pts[(k + 5) % 6];
    const a1 = [p[0] + (prev[0] - p[0]) * round, p[1] + (prev[1] - p[1]) * round];
    const a2 = [p[0] + (n[0] - p[0]) * round, p[1] + (n[1] - p[1]) * round];
    if (k) g.lineTo(a1[0], a1[1]);
    else g.moveTo(a1[0], a1[1]);
    g.quadraticCurveTo(p[0], p[1], a2[0], a2[1]);
  }
  g.closePath();
}

function arrow(g, x, y, a, d, double = false, alpha = 1, colour = '#fff') {
  g.save();
  g.translate(x, y);
  g.rotate(ANGLE[d]);
  g.globalAlpha *= alpha;
  const draw = () => {
    g.beginPath();
    if (double) {
      g.moveTo(0.52 * a, 0);
      g.lineTo(0.2 * a, -0.27 * a);
      g.lineTo(0.2 * a, -0.085 * a);
      g.lineTo(-0.2 * a, -0.085 * a);
      g.lineTo(-0.2 * a, -0.27 * a);
      g.lineTo(-0.52 * a, 0);
      g.lineTo(-0.2 * a, 0.27 * a);
      g.lineTo(-0.2 * a, 0.085 * a);
      g.lineTo(0.2 * a, 0.085 * a);
      g.lineTo(0.2 * a, 0.27 * a);
    } else {
      g.moveTo(0.52 * a, 0);
      g.lineTo(0.12 * a, -0.31 * a);
      g.lineTo(0.12 * a, -0.1 * a);
      g.lineTo(-0.42 * a, -0.1 * a);
      g.lineTo(-0.42 * a, 0.1 * a);
      g.lineTo(0.12 * a, 0.1 * a);
      g.lineTo(0.12 * a, 0.31 * a);
    }
    g.closePath();
  };
  g.lineJoin = 'round';
  g.save();
  g.rotate(-ANGLE[d]);
  g.translate(0, 0.05 * a);
  g.rotate(ANGLE[d]);
  draw();
  g.fillStyle = 'rgba(30, 20, 70, 0.28)';
  g.fill();
  g.restore();
  draw();
  g.fillStyle = colour;
  g.fill();
  g.lineWidth = 0.05 * a;
  g.strokeStyle = colour;
  g.stroke();
  g.restore();
}

// One tile. t: { d, two }; layers: how many tiles are stacked here (the
// ones underneath show only as edges); frozen: iced over.
export function paintTile(g, x, y, a, t, layers = 1, frozen = false) {
  const c = t.d < 0 ? PLAIN : COLORS[t.d];
  const face = a * 0.9, depth = a * 0.16;
  // The tiles underneath, as plain edges.
  for (let k = layers - 1; k >= 1; k--) {
    const oy = y + k * depth;
    softHex(g, x, oy + depth, face);
    g.fillStyle = '#9aa6c8';
    g.fill();
    softHex(g, x, oy, face);
    g.fillStyle = k % 2 ? '#e8edf8' : '#d5ddf0';
    g.fill();
    g.lineWidth = a * 0.03;
    g.strokeStyle = 'rgba(90, 104, 150, 0.35)';
    g.stroke();
  }
  // This tile's own edge, then its face.
  softHex(g, x, y + depth, face);
  g.fillStyle = c.side;
  g.fill();
  softHex(g, x, y, face);
  const grad = g.createLinearGradient(x, y - face, x, y + face);
  grad.addColorStop(0, c.light);
  grad.addColorStop(0.45, c.top);
  grad.addColorStop(1, c.top);
  g.fillStyle = grad;
  g.fill();
  if (t.two) {
    // The other half in the other way's colour.
    const o = COLORS[opposite(t.d)];
    g.save();
    softHex(g, x, y, face);
    g.clip();
    g.translate(x, y);
    g.rotate(ANGLE[t.d]);
    const og = g.createLinearGradient(0, -face, 0, face);
    og.addColorStop(0, o.light);
    og.addColorStop(0.5, o.top);
    g.fillStyle = og;
    g.fillRect(-face * 1.2, -face * 1.2, face * 1.2, face * 2.4);
    g.restore();
  }
  // A bevel highlight.
  g.save();
  softHex(g, x, y, face);
  g.clip();
  g.lineWidth = a * 0.12;
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  softHex(g, x, y + a * 0.05, face);
  g.stroke();
  g.restore();
  softHex(g, x, y, face);
  g.lineWidth = a * 0.035;
  g.strokeStyle = 'rgba(40, 30, 90, 0.25)';
  g.stroke();
  if (frozen) {
    // A layer of frost over the face; the arrow still shows through.
    g.save();
    softHex(g, x, y, face);
    g.clip();
    const ig = g.createLinearGradient(x - face, y - face, x + face, y + face);
    ig.addColorStop(0, 'rgba(240, 252, 255, 0.78)');
    ig.addColorStop(1, 'rgba(165, 218, 252, 0.62)');
    g.fillStyle = ig;
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath();
    g.moveTo(x - face, y + face * 0.1);
    g.lineTo(x - face * 0.1, y - face);
    g.lineTo(x + face * 0.25, y - face);
    g.lineTo(x - face, y + face * 0.45);
    g.closePath();
    g.fill();
    g.restore();
    softHex(g, x, y, face);
    g.lineWidth = a * 0.06;
    g.strokeStyle = '#ffffff';
    g.stroke();
  }
  if (t.d >= 0) arrow(g, x, y, a, t.d, t.two, 1, frozen ? '#3b8fd9' : '#fff');
  if (frozen) snowflake(g, x + a * 0.5, y - a * 0.5, a * 0.2);
  if (layers > 1) {
    // How many are stacked here.
    const bx = x + a * 0.56, by = y + a * 0.34, br = a * 0.24;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(bx, by, br, 0, TAU);
    g.fill();
    g.lineWidth = a * 0.04;
    g.strokeStyle = c.side;
    g.stroke();
    g.fillStyle = c.side;
    g.font = `900 ${Math.round(br * 1.45)}px ui-rounded, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(layers), bx, by + br * 0.08);
  }
}

function snowflake(g, x, y, r) {
  g.save();
  g.translate(x, y);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(0, 0, r * 1.25, 0, TAU);
  g.fill();
  g.strokeStyle = '#3b8fd9';
  g.lineWidth = r * 0.16;
  g.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    g.rotate(Math.PI / 3);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -r);
    g.moveTo(0, -r * 0.55);
    g.lineTo(-r * 0.25, -r * 0.8);
    g.moveTo(0, -r * 0.55);
    g.lineTo(r * 0.25, -r * 0.8);
    g.stroke();
  }
  g.restore();
}

export function paintStone(g, x, y, a) {
  const face = a * 0.9, depth = a * 0.2;
  softHex(g, x, y + depth, face, 0.26);
  g.fillStyle = '#4f5670';
  g.fill();
  softHex(g, x, y, face, 0.26);
  const grad = g.createLinearGradient(x, y - face, x, y + face);
  grad.addColorStop(0, '#b9c0d3');
  grad.addColorStop(1, '#7d869e');
  g.fillStyle = grad;
  g.fill();
  g.fillStyle = 'rgba(70, 78, 100, 0.35)';
  for (const [dx, dy, r] of [[-0.3, 0.2, 0.13], [0.25, -0.18, 0.1], [0.32, 0.3, 0.08], [-0.05, -0.4, 0.07]]) {
    g.beginPath();
    g.arc(x + dx * a, y + dy * a, r * a, 0, TAU);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.ellipse(x - a * 0.25, y - a * 0.42, a * 0.25, a * 0.08, -0.3, 0, TAU);
  g.fill();
}

// A pad on the floor: it steers anything sliding over it.
export function paintPad(g, x, y, a, d, glow = 0) {
  g.save();
  g.fillStyle = `rgba(58, 134, 255, ${0.18 + 0.12 * glow})`;
  g.beginPath();
  g.arc(x, y, a * 0.78, 0, TAU);
  g.fill();
  const grad = g.createRadialGradient(x - a * 0.15, y - a * 0.2, a * 0.05, x, y, a * 0.6);
  grad.addColorStop(0, '#7fb8ff');
  grad.addColorStop(1, '#2f6fe0');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(x, y, a * 0.56, 0, TAU);
  g.fill();
  g.lineWidth = a * 0.06;
  g.strokeStyle = '#ffffff';
  g.stroke();
  g.translate(x, y);
  g.rotate(ANGLE[d]);
  g.strokeStyle = '#fff';
  g.lineWidth = a * 0.13;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const off of [-0.16, 0.12]) {
    g.beginPath();
    g.moveTo((off - 0.12) * a, -0.22 * a);
    g.lineTo((off + 0.1) * a, 0);
    g.lineTo((off - 0.12) * a, 0.22 * a);
    g.stroke();
  }
  g.restore();
}

// ---- sprites ---------------------------------------------------------------------------

const cache = new Map();
let cacheSize = 0;

// Tiles are drawn once per look and size, then copied.
export function tileSprite(a, t, layers, frozen) {
  const px = Math.max(6, Math.round(a));
  if (px !== cacheSize) {
    cache.clear();
    cacheSize = px;
  }
  const k = `${t.d}${t.two ? 1 : 0}${layers}${frozen ? 1 : 0}`;
  let c = cache.get(k);
  if (!c) {
    c = document.createElement('canvas');
    const w = Math.ceil(px * 2.1), h = Math.ceil(px * 2.1 + px * 0.16 * layers + 2);
    c.width = w;
    c.height = h;
    paintTile(c.getContext('2d'), w / 2, px * 1.05, px, t, layers, frozen);
    cache.set(k, c);
  }
  return c;
}

export function stoneSprite(a) {
  const px = Math.max(6, Math.round(a));
  if (px !== cacheSize) {
    cache.clear();
    cacheSize = px;
  }
  let c = cache.get('stone');
  if (!c) {
    c = document.createElement('canvas');
    c.width = Math.ceil(px * 2.1);
    c.height = Math.ceil(px * 2.5);
    paintStone(c.getContext('2d'), c.width / 2, px * 1.05, px);
    cache.set('stone', c);
  }
  return c;
}
