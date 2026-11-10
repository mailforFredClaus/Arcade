// Prism Break: how things look. Bricks, capsules and the ball are painted
// once each (at the size the screen needs) with their glow baked in, and
// kept as ready-made pictures, so a frame is mostly quick stamps.

import { BW, BH, BALL_R } from './engine.js';

export const COLOURS = ['#ff4d6d', '#ff9a3c', '#ffd93d', '#4ade80', '#2dd4bf', '#4d9bff', '#a78bfa', '#f472b6', '#e8eefc'];
const TAU = Math.PI * 2;

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const css = (c, a = 1) => `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${a})`;
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const lighten = (h, k) => css(mix(hex(h), [255, 255, 255], k));
export const darken = (h, k) => css(mix(hex(h), [0, 0, 20], k));
export const fade = (h, a) => css(hex(h), a);

export const POWER_LOOK = {
  multi: { colour: '#4d9bff', name: 'Multi-ball' },
  wide: { colour: '#4ade80', name: 'Wide paddle' },
  laser: { colour: '#ff4d6d', name: 'Laser' },
  fire: { colour: '#ff9a3c', name: 'Fireball' },
  slow: { colour: '#2dd4bf', name: 'Slow' },
  shield: { colour: '#a78bfa', name: 'Shield' },
  life: { colour: '#f472b6', name: 'Extra life' },
  shrink: { colour: '#5b2333', name: 'Shrink' },
  fast: { colour: '#5b2333', name: 'Fast ball' },
};

export class Art {
  constructor() {
    this.s = 0;
    this.cache = new Map();
  }

  // s: screen pixels (times the display's sharpness) per unit of the field.
  scale(s) {
    if (Math.abs(s - this.s) < 1e-6) return;
    this.s = s;
    this.cache.clear();
  }

  // A picture w x h units big with `pad` units of room round it for glow.
  make(key, w, h, pad, paint) {
    let c = this.cache.get(key);
    if (c) return c;
    const s = this.s;
    c = document.createElement('canvas');
    c.width = Math.ceil((w + 2 * pad) * s);
    c.height = Math.ceil((h + 2 * pad) * s);
    const g = c.getContext('2d');
    g.scale(s, s);
    g.translate(pad, pad);
    paint(g);
    c.pad = pad;
    c.w = w + 2 * pad;
    c.h = h + 2 * pad;
    this.cache.set(key, c);
    return c;
  }

  // The picture for a brick as it is now (null for one that can't be seen).
  brick(b) {
    if (!b.seen) return null;
    const key = `b${b.type}${b.colour}${b.hp}`;
    return this.make(key, BW, BH, 3, (g) => paintBrick(g, b));
  }

  capsule(kind) {
    return this.make(`c${kind}`, 10, 5, 2.5, (g) => paintCapsule(g, kind));
  }

  ball(fire) {
    return this.make(`ball${fire ? 1 : 0}`, BALL_R * 2, BALL_R * 2, 4, (g) => {
      const r = BALL_R, col = fire ? '#ff9a3c' : '#9fe8ff';
      const glow = g.createRadialGradient(r, r, r * 0.5, r, r, r + 3.6);
      glow.addColorStop(0, fade(col, 0.75));
      glow.addColorStop(1, fade(col, 0));
      g.fillStyle = glow;
      g.fillRect(-4, -4, r * 2 + 8, r * 2 + 8);
      const body = g.createRadialGradient(r - 0.5, r - 0.6, 0.1, r, r, r);
      body.addColorStop(0, '#ffffff');
      body.addColorStop(0.6, fire ? '#ffe08a' : '#eafaff');
      body.addColorStop(1, fire ? '#ff7a1c' : '#7fd4ff');
      g.fillStyle = body;
      g.beginPath();
      g.arc(r, r, r, 0, TAU);
      g.fill();
    });
  }

  // A soft round glow, for sparks and trails.
  spark(colour) {
    return this.make(`s${colour}`, 4, 4, 0, (g) => {
      const gl = g.createRadialGradient(2, 2, 0, 2, 2, 2);
      gl.addColorStop(0, fade(colour, 1));
      gl.addColorStop(0.4, fade(colour, 0.55));
      gl.addColorStop(1, fade(colour, 0));
      g.fillStyle = gl;
      g.fillRect(0, 0, 4, 4);
    });
  }
}

function rounded(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

function paintBrick(g, b) {
  const x = 0.45, y = 0.4, w = BW - 0.9, h = BH - 0.8, r = 1.1;
  const type = b.type;
  if (type === 'steel') {
    const body = g.createLinearGradient(0, y, 0, y + h);
    body.addColorStop(0, '#c3cbd9');
    body.addColorStop(0.5, '#8d97aa');
    body.addColorStop(1, '#5a6375');
    g.fillStyle = body;
    rounded(g, x, y, w, h, 0.7);
    g.fill();
    g.save();
    g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.22)';
    g.lineWidth = 0.7;
    for (let k = -2; k < 8; k++) {
      g.beginPath();
      g.moveTo(x + k * 2.4, y + h);
      g.lineTo(x + k * 2.4 + h, y);
      g.stroke();
    }
    g.restore();
    g.strokeStyle = '#3b4252';
    g.lineWidth = 0.45;
    rounded(g, x, y, w, h, 0.7);
    g.stroke();
    g.fillStyle = '#eef2f8';
    for (const [cx, cy] of [[x + 1.1, y + 1.1], [x + w - 1.1, y + 1.1], [x + 1.1, y + h - 1.1], [x + w - 1.1, y + h - 1.1]]) {
      g.beginPath();
      g.arc(cx, cy, 0.35, 0, TAU);
      g.fill();
    }
    return;
  }
  const col = type === 'bomb' ? '#ff7a1c' : type === 'gift' ? '#ffd76a' : type === 'armour' ? '#ffd76a' : COLOURS[b.colour] || '#e8eefc';
  // The glow.
  g.save();
  g.shadowColor = col;
  g.shadowBlur = 2.6 * (g.getTransform().a || 1);
  g.fillStyle = fade(col, type === 'hidden' ? 0.35 : 0.8);
  rounded(g, x, y, w, h, r);
  g.fill();
  g.restore();
  // The body.
  const body = g.createLinearGradient(0, y, 0, y + h);
  if (type === 'bomb') {
    body.addColorStop(0, '#4a3550');
    body.addColorStop(1, '#1f1526');
  } else if (type === 'armour') {
    body.addColorStop(0, '#52648f');
    body.addColorStop(1, '#232d4a');
  } else if (type === 'gift') {
    body.addColorStop(0, '#fff3b0');
    body.addColorStop(0.5, '#ffc928');
    body.addColorStop(1, '#ff8ad8');
  } else if (type === 'hidden') {
    body.addColorStop(0, 'rgba(255,255,255,0.75)');
    body.addColorStop(1, 'rgba(190,210,255,0.45)');
  } else {
    body.addColorStop(0, lighten(col, 0.42));
    body.addColorStop(0.45, col);
    body.addColorStop(1, darken(col, 0.3));
  }
  g.fillStyle = body;
  rounded(g, x, y, w, h, r);
  g.fill();
  g.save();
  g.clip();
  // A facet across one corner, and a line of light along the top: cut glass.
  g.fillStyle = 'rgba(255,255,255,0.2)';
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w * 0.55, y);
  g.lineTo(x + w * 0.3, y + h);
  g.lineTo(x, y + h);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.fillRect(x + 0.6, y + 0.35, w - 1.2, 0.5);
  g.fillStyle = 'rgba(0,0,30,0.22)';
  g.fillRect(x, y + h - 0.7, w, 0.7);
  g.restore();

  if (type === 'tough') {
    // A silver frame: one hit takes it off.
    if (b.hp >= 2) {
      g.strokeStyle = '#f4f7ff';
      g.lineWidth = 0.75;
      rounded(g, x + 0.4, y + 0.4, w - 0.8, h - 0.8, r - 0.3);
      g.stroke();
      g.strokeStyle = 'rgba(40,50,90,0.6)';
      g.lineWidth = 0.25;
      rounded(g, x + 0.9, y + 0.9, w - 1.8, h - 1.8, r - 0.6);
      g.stroke();
    } else crack(g, x, y, w, h, 1);
  } else if (type === 'armour') {
    g.strokeStyle = '#ffd76a';
    g.lineWidth = 0.7;
    rounded(g, x + 0.4, y + 0.4, w - 0.8, h - 0.8, r - 0.3);
    g.stroke();
    // A stud for each hit it can still take.
    g.fillStyle = '#ffe9a8';
    for (let k = 0; k < b.hp; k++) {
      g.beginPath();
      g.arc(x + w / 2 + (k - (b.hp - 1) / 2) * 2, y + h / 2, 0.6, 0, TAU);
      g.fill();
    }
    if (b.hp < 3) crack(g, x, y, w, h, 3 - b.hp);
  } else if (type === 'bomb') {
    const core = g.createRadialGradient(x + w / 2, y + h / 2, 0.1, x + w / 2, y + h / 2, 2);
    core.addColorStop(0, '#fff6c4');
    core.addColorStop(0.5, '#ffb347');
    core.addColorStop(1, '#ff4d00');
    g.fillStyle = core;
    g.beginPath();
    g.arc(x + w / 2, y + h / 2, 1.5, 0, TAU);
    g.fill();
    g.strokeStyle = '#ffb347';
    g.lineWidth = 0.4;
    for (let k = 0; k < 8; k++) {
      const a = (k * TAU) / 8;
      g.beginPath();
      g.moveTo(x + w / 2 + Math.cos(a) * 1.9, y + h / 2 + Math.sin(a) * 1.9 * 0.8);
      g.lineTo(x + w / 2 + Math.cos(a) * 2.5, y + h / 2 + Math.sin(a) * 2.5 * 0.8);
      g.stroke();
    }
    g.strokeStyle = '#ff7a1c';
    g.lineWidth = 0.4;
    rounded(g, x + 0.3, y + 0.3, w - 0.6, h - 0.6, r - 0.2);
    g.stroke();
  } else if (type === 'gift') {
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillRect(x + w / 2 - 0.55, y, 1.1, h);
    g.fillRect(x, y + h / 2 - 0.45, w, 0.9);
    g.fillStyle = '#ff4d8d';
    g.beginPath();
    g.arc(x + w / 2, y + h / 2, 0.95, 0, TAU);
    g.fill();
  }
}

// Cracks: more of them the nearer a brick is to breaking.
function crack(g, x, y, w, h, n) {
  g.strokeStyle = 'rgba(10,10,40,0.6)';
  g.lineWidth = 0.35;
  g.lineJoin = 'round';
  const lines = [
    [[0.3, 0], [0.38, 0.4], [0.3, 0.62], [0.42, 1]],
    [[0.7, 0], [0.62, 0.3], [0.74, 0.6], [0.66, 1]],
  ];
  for (let k = 0; k < Math.min(n, lines.length); k++) {
    g.beginPath();
    lines[k].forEach(([px, py], i) => g[i ? 'lineTo' : 'moveTo'](x + px * w, y + py * h));
    g.stroke();
  }
}

// A capsule, 10 x 5, with what it does drawn on it.
function paintCapsule(g, kind) {
  const look = POWER_LOOK[kind], bad = kind === 'shrink' || kind === 'fast';
  g.save();
  g.shadowColor = bad ? '#ff2d55' : look.colour;
  g.shadowBlur = 2.2 * (g.getTransform().a || 1);
  g.fillStyle = bad ? '#ff2d55' : look.colour;
  rounded(g, 0, 0, 10, 5, 2.5);
  g.fill();
  g.restore();
  const body = g.createLinearGradient(0, 0, 0, 5);
  body.addColorStop(0, bad ? '#8a3145' : lighten(look.colour, 0.45));
  body.addColorStop(0.5, look.colour);
  body.addColorStop(1, bad ? '#2a0f18' : darken(look.colour, 0.35));
  g.fillStyle = body;
  rounded(g, 0, 0, 10, 5, 2.5);
  g.fill();
  g.strokeStyle = bad ? '#ff2d55' : 'rgba(255,255,255,0.85)';
  g.lineWidth = 0.45;
  rounded(g, 0.25, 0.25, 9.5, 4.5, 2.25);
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.35)';
  rounded(g, 1.4, 0.7, 7.2, 1, 0.5);
  g.fill();
  // The sign.
  g.translate(5, 2.5);
  g.fillStyle = '#ffffff';
  g.strokeStyle = '#ffffff';
  g.lineWidth = 0.6;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const dot = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const line = (...pts) => { g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.stroke(); };
  if (kind === 'multi') { dot(-1.7, 0.5, 0.75); dot(0, -0.6, 0.75); dot(1.7, 0.5, 0.75); }
  else if (kind === 'wide') { line([-2.6, 0], [2.6, 0]); line([-1.6, -1], [-2.6, 0], [-1.6, 1]); line([1.6, -1], [2.6, 0], [1.6, 1]); }
  else if (kind === 'shrink') { line([-2.8, 0], [-0.9, 0]); line([2.8, 0], [0.9, 0]); line([-1.9, -1], [-0.9, 0], [-1.9, 1]); line([1.9, -1], [0.9, 0], [1.9, 1]); }
  else if (kind === 'laser') { line([0.7, -1.5], [-0.8, 0.2], [0.5, 0.2], [-0.7, 1.5]); }
  else if (kind === 'fire') {
    g.beginPath();
    g.moveTo(0, -1.7);
    g.bezierCurveTo(1.9, -0.2, 1.5, 1.6, 0, 1.6);
    g.bezierCurveTo(-1.5, 1.6, -1.6, 0.3, -0.7, -0.5);
    g.bezierCurveTo(-0.5, 0.2, 0, 0.1, 0, -1.7);
    g.fill();
  } else if (kind === 'slow') { g.beginPath(); g.arc(0, 0, 1.5, 0, TAU); g.stroke(); line([0, -0.9], [0, 0], [0.8, 0.5]); }
  else if (kind === 'fast') { line([-1.8, -1.1], [-0.6, 0], [-1.8, 1.1]); line([0.2, -1.1], [1.4, 0], [0.2, 1.1]); }
  else if (kind === 'shield') {
    g.beginPath();
    g.moveTo(0, -1.6);
    g.lineTo(1.5, -1);
    g.quadraticCurveTo(1.5, 1, 0, 1.7);
    g.quadraticCurveTo(-1.5, 1, -1.5, -1);
    g.closePath();
    g.fill();
  } else if (kind === 'life') {
    g.beginPath();
    g.moveTo(0, 1.5);
    g.bezierCurveTo(-2.6, -0.2, -1.2, -2, 0, -0.7);
    g.bezierCurveTo(1.2, -2, 2.6, -0.2, 0, 1.5);
    g.fill();
  }
}

// The backdrop for a world, the size of the whole screen, with the field
// marked out on it. field: { x, y, w, h } in screen pixels.
export function paintBackdrop(g, Wpx, Hpx, world, field) {
  const [top, mid, low] = world.sky;
  const sky = g.createLinearGradient(0, 0, 0, Hpx);
  sky.addColorStop(0, top);
  sky.addColorStop(0.6, mid);
  sky.addColorStop(1, low);
  g.fillStyle = sky;
  g.fillRect(0, 0, Wpx, Hpx);
  // Soft clouds of light.
  let seed = 12345 + top.charCodeAt(2) * 7;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let k = 0; k < 7; k++) {
    const x = rnd() * Wpx, y = rnd() * Hpx, r = (0.25 + rnd() * 0.4) * Math.max(Wpx, Hpx);
    const c = g.createRadialGradient(x, y, 0, x, y, r);
    c.addColorStop(0, fade(k % 2 ? world.glow : low, 0.16));
    c.addColorStop(1, fade(world.glow, 0));
    g.fillStyle = c;
    g.fillRect(0, 0, Wpx, Hpx);
  }
  // Stars.
  for (let k = 0; k < 140; k++) {
    const x = rnd() * Wpx, y = rnd() * Hpx, r = 0.4 + rnd() * 1.1;
    g.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.55})`;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  // The field: a dark pane with a thin lit edge.
  const { x, y, w, h } = field, r = Math.min(18, w * 0.04);
  g.fillStyle = 'rgba(6, 8, 26, 0.5)';
  g.beginPath();
  g.roundRect(x - 3, y - 3, w + 6, Hpx - y + 6, [r, r, 0, 0]);
  g.fill();
  const edge = g.createLinearGradient(0, y, 0, Hpx);
  edge.addColorStop(0, fade(world.glow, 0.9));
  edge.addColorStop(0.7, fade(world.glow, 0.4));
  edge.addColorStop(1, fade(world.glow, 0.15));
  g.strokeStyle = edge;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - 2, Hpx);
  g.lineTo(x - 2, y + r);
  g.quadraticCurveTo(x - 2, y - 2, x + r, y - 2);
  g.lineTo(x + w - r, y - 2);
  g.quadraticCurveTo(x + w + 2, y - 2, x + w + 2, y + r);
  g.lineTo(x + w + 2, Hpx);
  g.stroke();
}
