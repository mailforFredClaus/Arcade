// Gem Swap: the places you play in. Ten levels to a chapter, and each
// chapter is somewhere in or around the castle, painted behind the board.
// A scene is drawn once (when the level or the window changes); the little
// things drifting across it (petals, fireflies, snow) are drawn every frame.

const TAU = Math.PI * 2;

// The same "random" numbers every time, so a scene never changes between visits.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function fillDown(g, W, y0, y1, stops) {
  const grad = g.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([at, col]) => grad.addColorStop(at, col));
  g.fillStyle = grad;
  g.fillRect(0, y0, W, y1 - y0);
}

function glow(g, x, y, r, col, a = 1) {
  const rg = g.createRadialGradient(x, y, 0, x, y, r);
  rg.addColorStop(0, `rgba(${col}, ${a})`);
  rg.addColorStop(1, `rgba(${col}, 0)`);
  g.fillStyle = rg;
  g.fillRect(x - r, y - r, 2 * r, 2 * r);
}

// A line of rolling hills from the left edge to the right, filled down to y1.
function hills(g, W, y, amp, y1, col, R, bumps = 3) {
  const ph = R() * TAU, ph2 = R() * TAU;
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, y1);
  for (let x = 0; x <= W + 8; x += 8) {
    const k = x / W;
    g.lineTo(x, y - amp * (0.6 * Math.sin(k * bumps * Math.PI + ph) + 0.4 * Math.sin(k * bumps * 2.3 * Math.PI + ph2)));
  }
  g.lineTo(W, y1);
  g.closePath();
  g.fill();
}

// Jagged mountains.
function peaks(g, W, y, amp, y1, col, snow, R) {
  const pts = [];
  let x = -W * 0.1;
  while (x < W * 1.1) {
    pts.push([x, y - amp * (0.45 + 0.55 * R())]);
    x += W * (0.1 + 0.12 * R());
    pts.push([x, y - amp * 0.12 * R()]);
    x += W * (0.06 + 0.1 * R());
  }
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(-W * 0.1, y1);
  pts.forEach(([px, py]) => g.lineTo(px, py));
  g.lineTo(W * 1.1, y1);
  g.closePath();
  g.fill();
  if (!snow) return;
  g.fillStyle = snow;
  for (let k = 0; k < pts.length; k += 2) {
    const [px, py] = pts[k], d = amp * 0.22;
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(px + d * 0.9, py + d);
    g.lineTo(px + d * 0.35, py + d * 0.75);
    g.lineTo(px, py + d * 1.15);
    g.lineTo(px - d * 0.4, py + d * 0.7);
    g.lineTo(px - d * 0.9, py + d);
    g.closePath();
    g.fill();
  }
}

function cloud(g, x, y, s, col) {
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(x, y, s, s * 0.34, 0, 0, TAU);
  g.ellipse(x - s * 0.45, y + s * 0.06, s * 0.5, s * 0.26, 0, 0, TAU);
  g.ellipse(x + s * 0.4, y + s * 0.08, s * 0.55, s * 0.24, 0, 0, TAU);
  g.ellipse(x - s * 0.1, y - s * 0.2, s * 0.42, s * 0.3, 0, 0, TAU);
  g.ellipse(x + s * 0.3, y - s * 0.12, s * 0.3, s * 0.22, 0, 0, TAU);
  g.fill();
}

// The castle, standing on baseY and u wide. c: { wall, shade, roof, window, flag }.
function castle(g, cx, baseY, u, c) {
  const tower = (x, w, h, roof) => {
    g.fillStyle = c.wall;
    g.fillRect(x - w / 2, baseY - h, w, h);
    g.fillStyle = c.shade;
    g.fillRect(x + w * 0.12, baseY - h, w * 0.38, h);
    // Battlements.
    g.fillStyle = c.wall;
    const n = 3, bw = (w * 1.2) / (2 * n - 1);
    for (let k = 0; k < n; k++) g.fillRect(x - w * 0.6 + k * 2 * bw, baseY - h - bw * 0.8, bw, bw * 0.9);
    if (roof) {
      g.fillStyle = c.roof;
      g.beginPath();
      g.moveTo(x - w * 0.68, baseY - h - bw * 0.7);
      g.lineTo(x, baseY - h - bw * 0.7 - roof);
      g.lineTo(x + w * 0.68, baseY - h - bw * 0.7);
      g.closePath();
      g.fill();
      // A flag on top.
      g.strokeStyle = c.shade;
      g.lineWidth = Math.max(1, u * 0.008);
      const top = baseY - h - bw * 0.7 - roof;
      g.beginPath();
      g.moveTo(x, top);
      g.lineTo(x, top - u * 0.07);
      g.stroke();
      g.fillStyle = c.flag;
      g.beginPath();
      g.moveTo(x, top - u * 0.07);
      g.lineTo(x + u * 0.06, top - u * 0.05);
      g.lineTo(x, top - u * 0.03);
      g.closePath();
      g.fill();
    }
    // A window.
    g.fillStyle = c.window;
    g.beginPath();
    g.roundRect(x - w * 0.14, baseY - h * 0.78, w * 0.28, w * 0.5, w * 0.14);
    g.fill();
  };
  // The wall between the towers, with its gate.
  g.fillStyle = c.wall;
  g.fillRect(cx - u * 0.42, baseY - u * 0.2, u * 0.84, u * 0.2);
  g.fillStyle = c.shade;
  g.fillRect(cx - u * 0.42, baseY - u * 0.05, u * 0.84, u * 0.05);
  g.fillStyle = c.wall;
  for (let k = 0; k < 9; k++) g.fillRect(cx - u * 0.42 + k * u * 0.1, baseY - u * 0.235, u * 0.05, u * 0.04);
  tower(cx - u * 0.4, u * 0.13, u * 0.34, u * 0.17);
  tower(cx + u * 0.4, u * 0.13, u * 0.34, u * 0.17);
  tower(cx - u * 0.19, u * 0.11, u * 0.44, u * 0.15);
  tower(cx + u * 0.19, u * 0.11, u * 0.44, u * 0.15);
  tower(cx, u * 0.2, u * 0.54, u * 0.24);
  g.fillStyle = c.gate || c.shade;
  g.beginPath();
  g.moveTo(cx - u * 0.055, baseY);
  g.lineTo(cx - u * 0.055, baseY - u * 0.08);
  g.arc(cx, baseY - u * 0.08, u * 0.055, Math.PI, 0);
  g.lineTo(cx + u * 0.055, baseY);
  g.closePath();
  g.fill();
}

function pine(g, x, y, s, col, snow) {
  g.fillStyle = '#4a2f1c';
  g.fillRect(x - s * 0.05, y - s * 0.12, s * 0.1, s * 0.14);
  for (let k = 0; k < 3; k++) {
    const w = s * (0.42 - k * 0.1), top = y - s * (0.42 + k * 0.26), bot = y - s * (0.08 + k * 0.24);
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x - w, bot);
    g.lineTo(x, top);
    g.lineTo(x + w, bot);
    g.closePath();
    g.fill();
    if (snow) {
      g.fillStyle = snow;
      g.beginPath();
      g.moveTo(x - w * 0.55, bot - (bot - top) * 0.45);
      g.lineTo(x, top);
      g.lineTo(x + w * 0.55, bot - (bot - top) * 0.45);
      g.lineTo(x + w * 0.2, bot - (bot - top) * 0.3);
      g.lineTo(x, bot - (bot - top) * 0.5);
      g.lineTo(x - w * 0.25, bot - (bot - top) * 0.3);
      g.closePath();
      g.fill();
    }
  }
}

// A cluster of crystals growing up (or, flipped, down) from (x, y).
function crystals(g, x, y, s, a, b, R, flip = 1) {
  glow(g, x, y - flip * s * 0.4, s * 1.5, a, 0.35);
  for (let k = 0; k < 5; k++) {
    const lean = (k - 2) * 0.32 + (R() - 0.5) * 0.2, len = s * (0.6 + R() * 0.7) * (k === 2 ? 1.3 : 1), w = s * (0.13 + R() * 0.08);
    g.save();
    g.translate(x + (k - 2) * s * 0.14, y);
    g.rotate(lean * flip);
    g.scale(1, flip);
    const grad = g.createLinearGradient(-w, 0, w, 0);
    grad.addColorStop(0, `rgba(${b}, 1)`);
    grad.addColorStop(0.5, `rgba(${a}, 1)`);
    grad.addColorStop(1, `rgba(${b}, 1)`);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(-w, 0);
    g.lineTo(-w, -len * 0.78);
    g.lineTo(0, -len);
    g.lineTo(w, -len * 0.78);
    g.lineTo(w, 0);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.4)';
    g.beginPath();
    g.moveTo(-w, 0);
    g.lineTo(-w, -len * 0.78);
    g.lineTo(0, -len);
    g.lineTo(-w * 0.2, -len * 0.74);
    g.lineTo(-w * 0.2, 0);
    g.closePath();
    g.fill();
    g.restore();
  }
}

// ---- the six places -----------------------------------------------------------------------

function garden(g, W, H, R) {
  const h = H * 0.3;
  fillDown(g, W, 0, h, [[0, '#3f9cf0'], [0.55, '#8fd3ff'], [1, '#e2f6ff']]);
  glow(g, W * 0.84, H * 0.07, W * 0.6, '255, 250, 210', 0.95);
  glow(g, W * 0.84, H * 0.07, W * 0.09, '255, 255, 240', 1);
  for (const [x, y, s] of [[0.14, 0.06, 0.13], [0.52, 0.035, 0.1], [0.3, 0.17, 0.09], [0.9, 0.2, 0.12], [0.68, 0.13, 0.07]]) cloud(g, W * x, H * y, W * s, 'rgba(255,255,255,0.92)');
  hills(g, W, h, H * 0.022, H, '#a5dcc0', R, 2);
  castle(g, W * 0.5, h + H * 0.004, Math.min(W * 0.62, H * 0.36), { wall: '#f6efff', shade: '#cdbdf0', roof: '#ff6f91', window: '#7a63c9', flag: '#ffd23f', gate: '#6a4fb0' });
  hills(g, W, h + H * 0.03, H * 0.016, H, '#7fd07a', R, 3);
  fillDown(g, W, h + H * 0.045, H, [[0, '#86dc72'], [0.5, '#56bf5a'], [1, '#2f9b4a']]);
  // Mown stripes fanning out from the castle gate.
  g.save();
  g.beginPath();
  g.rect(0, h + H * 0.045, W, H);
  g.clip();
  g.fillStyle = 'rgba(255,255,255,0.07)';
  for (let k = -9; k <= 9; k += 2) {
    g.beginPath();
    g.moveTo(W * 0.5 + k * W * 0.012, h);
    g.lineTo(W * 0.5 + (k + 1) * W * 0.012, h);
    g.lineTo(W * 0.5 + (k + 1) * W * 0.22, H);
    g.lineTo(W * 0.5 + k * W * 0.22, H);
    g.closePath();
    g.fill();
  }
  // The path up to the gate.
  const path = g.createLinearGradient(0, h, 0, H);
  path.addColorStop(0, '#f7e6bd');
  path.addColorStop(1, '#e2bf82');
  g.fillStyle = path;
  g.beginPath();
  g.moveTo(W * 0.48, h + H * 0.03);
  g.lineTo(W * 0.52, h + H * 0.03);
  g.lineTo(W * 0.74, H);
  g.lineTo(W * 0.26, H);
  g.closePath();
  g.fill();
  g.restore();
  // Hedges and flowers along the bottom.
  for (const side of [0, 1]) {
    for (let k = 0; k < 4; k++) {
      const x = side ? W - (k * 0.11 - 0.02) * W : (k * 0.11 - 0.02) * W, r = W * (0.13 - k * 0.018), y = H - r * 0.25 + k * H * 0.004;
      g.fillStyle = '#1f7a3c';
      g.beginPath();
      g.arc(x, y, r, 0, TAU);
      g.fill();
      g.fillStyle = '#2f9b4a';
      g.beginPath();
      g.arc(x - r * 0.15, y - r * 0.2, r * 0.72, 0, TAU);
      g.fill();
    }
  }
  const petals = ['#ff7fb0', '#ffe14d', '#ffffff', '#ff9f43', '#c58bff'];
  for (let k = 0; k < 46; k++) {
    const side = k % 2, x = (side ? 1 - R() * 0.3 : R() * 0.3) * W, y = H * (0.8 + R() * 0.2), r = W * (0.007 + R() * 0.006);
    g.fillStyle = petals[k % petals.length];
    for (let j = 0; j < 5; j++) {
      g.beginPath();
      g.arc(x + Math.cos((j * TAU) / 5) * r, y + Math.sin((j * TAU) / 5) * r, r * 0.75, 0, TAU);
      g.fill();
    }
    g.fillStyle = '#ffd23f';
    g.beginPath();
    g.arc(x, y, r * 0.6, 0, TAU);
    g.fill();
  }
}

function hall(g, W, H, R) {
  const floor = H * 0.74;
  fillDown(g, W, 0, floor, [[0, '#3b1f6e'], [0.45, '#6a3ba0'], [1, '#4a2580']]);
  // Panelling.
  g.strokeStyle = 'rgba(255, 220, 140, 0.1)';
  g.lineWidth = 2;
  for (let k = 0; k <= 8; k++) {
    g.beginPath();
    g.moveTo((W * k) / 8, H * 0.3);
    g.lineTo((W * k) / 8, floor);
    g.stroke();
  }
  // Three tall windows, and the light they throw.
  const win = (cx) => {
    const w = W * 0.2, top = H * 0.035, bot = H * 0.27, r = w / 2;
    const shape = new Path2D();
    shape.moveTo(cx - r, bot);
    shape.lineTo(cx - r, top + r);
    shape.arc(cx, top + r, r, Math.PI, 0);
    shape.lineTo(cx + r, bot);
    shape.closePath();
    const glass = g.createLinearGradient(0, top, 0, bot);
    glass.addColorStop(0, '#e9f8ff');
    glass.addColorStop(0.6, '#9ad2ff');
    glass.addColorStop(1, '#ffd9a8');
    g.fillStyle = glass;
    g.fill(shape);
    g.strokeStyle = '#f0b84a';
    g.lineWidth = Math.max(3, W * 0.012);
    g.stroke(shape);
    g.lineWidth = Math.max(2, W * 0.006);
    g.beginPath();
    g.moveTo(cx, top);
    g.lineTo(cx, bot);
    for (const y of [0.35, 0.65]) {
      g.moveTo(cx - r, top + (bot - top) * y);
      g.lineTo(cx + r, top + (bot - top) * y);
    }
    g.stroke();
    // A shaft of light.
    const shaft = g.createLinearGradient(0, bot, 0, H);
    shaft.addColorStop(0, 'rgba(255, 240, 190, 0.2)');
    shaft.addColorStop(1, 'rgba(255, 240, 190, 0)');
    g.fillStyle = shaft;
    g.beginPath();
    g.moveTo(cx - r, bot);
    g.lineTo(cx + r, bot);
    g.lineTo(cx + r - W * 0.16, H);
    g.lineTo(cx - r - W * 0.3, H);
    g.closePath();
    g.fill();
  };
  // The floor: chequered, running away to the far wall, with a carpet down the middle.
  fillDown(g, W, floor, H, [[0, '#8a5a3a'], [1, '#c79a66']]);
  g.save();
  g.beginPath();
  g.rect(0, floor, W, H - floor);
  g.clip();
  const vx = W / 2, vy = floor - (H - floor) * 0.9;
  for (let row = 0; row < 7; row++) {
    const y0 = floor + (H - floor) * (row / 7) ** 1.5, y1 = floor + (H - floor) * ((row + 1) / 7) ** 1.5;
    for (let col = -8; col < 8; col++) {
      if ((row + col) & 1) continue;
      const at = (c, y) => vx + (c * W * 0.16 * (y - vy)) / (H - vy);
      g.fillStyle = 'rgba(60, 28, 10, 0.3)';
      g.beginPath();
      g.moveTo(at(col, y0), y0);
      g.lineTo(at(col + 1, y0), y0);
      g.lineTo(at(col + 1, y1), y1);
      g.lineTo(at(col, y1), y1);
      g.closePath();
      g.fill();
    }
  }
  const cw = (y) => (W * 0.2 * (y - vy)) / (H - vy);
  for (const [k, col] of [[1.12, '#ffd23f'], [1, '#c2183c']]) {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(vx - cw(floor) * k, floor);
    g.lineTo(vx + cw(floor) * k, floor);
    g.lineTo(vx + cw(H) * k, H);
    g.lineTo(vx - cw(H) * k, H);
    g.closePath();
    g.fill();
  }
  g.restore();
  g.fillStyle = '#f0b84a';
  g.fillRect(0, floor - H * 0.008, W, H * 0.012);
  for (const x of [0.18, 0.5, 0.82]) win(W * x);
  // Banners between the windows.
  for (const x of [0.34, 0.66]) {
    const w = W * 0.085, cx = W * x, bot = H * 0.24;
    g.fillStyle = '#c2183c';
    g.beginPath();
    g.moveTo(cx - w / 2, 0);
    g.lineTo(cx + w / 2, 0);
    g.lineTo(cx + w / 2, bot);
    g.lineTo(cx, bot - w * 0.5);
    g.lineTo(cx - w / 2, bot);
    g.closePath();
    g.fill();
    g.strokeStyle = '#ffd23f';
    g.lineWidth = Math.max(2, W * 0.006);
    g.stroke();
    g.fillStyle = '#ffd23f';
    g.beginPath();
    for (let j = 0; j < 10; j++) {
      const a = -Math.PI / 2 + (j * Math.PI) / 5, r = (j % 2 ? 0.16 : 0.36) * w;
      g[j ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, bot * 0.42 + Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
  }
  // Torches at the sides.
  for (const x of [0.04, 0.96]) {
    glow(g, W * x, H * 0.48, W * 0.42, '255, 170, 70', 0.5);
    glow(g, W * x, H * 0.86, W * 0.3, '255, 170, 70', 0.3);
  }
  void R;
}

function courtyard(g, W, H, R) {
  const h = H * 0.3;
  fillDown(g, W, 0, h, [[0, '#070a33'], [0.6, '#1d2a80'], [1, '#4a55c0']]);
  for (let k = 0; k < 90; k++) {
    g.fillStyle = `rgba(255,255,255,${0.35 + R() * 0.65})`;
    g.beginPath();
    g.arc(R() * W, R() * h * 0.95, 0.6 + R() * 1.3, 0, TAU);
    g.fill();
  }
  // The moon.
  const mx = W * 0.18, my = H * 0.085, mr = Math.min(W * 0.085, H * 0.05);
  glow(g, mx, my, mr * 5, '200, 215, 255', 0.5);
  g.fillStyle = '#fff8d6';
  g.beginPath();
  g.arc(mx, my, mr, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(190, 170, 120, 0.3)';
  for (const [dx, dy, r] of [[-0.3, -0.2, 0.2], [0.25, 0.3, 0.26], [0.35, -0.35, 0.13]]) {
    g.beginPath();
    g.arc(mx + dx * mr, my + dy * mr, r * mr, 0, TAU);
    g.fill();
  }
  cloud(g, W * 0.7, H * 0.09, W * 0.14, 'rgba(120, 135, 220, 0.5)');
  cloud(g, W * 0.38, H * 0.2, W * 0.1, 'rgba(120, 135, 220, 0.4)');
  hills(g, W, h, H * 0.02, H, '#232d7a', R, 2);
  const u = Math.min(W * 0.62, H * 0.36);
  glow(g, W * 0.5, h - u * 0.2, u * 0.7, '255, 200, 110', 0.28);
  castle(g, W * 0.5, h + H * 0.004, u, { wall: '#1b2166', shade: '#11164a', roof: '#2a1d6e', window: '#ffd76a', flag: '#ff6f91', gate: '#ffc04d' });
  fillDown(g, W, h + H * 0.02, H, [[0, '#26407a'], [0.5, '#1a2c5e'], [1, '#0e1a40']]);
  // Cobbles.
  g.strokeStyle = 'rgba(160, 190, 255, 0.09)';
  g.lineWidth = 1.5;
  for (let row = 0; row < 16; row++) {
    const y = h + H * 0.04 + ((H - h) * row) / 16, sw = W * (0.07 + row * 0.006);
    for (let x = ((row % 2) * sw) / 2 - sw; x < W; x += sw) {
      g.beginPath();
      g.roundRect(x + 2, y + 2, sw - 4, (H - h) / 16 - 4, 6);
      g.stroke();
    }
  }
  // Lanterns.
  for (const x of [0.07, 0.93]) {
    const lx = W * x, ly = H * 0.83;
    glow(g, lx, ly, W * 0.4, '255, 190, 90', 0.5);
    g.fillStyle = '#0a0f30';
    g.fillRect(lx - W * 0.008, ly, W * 0.016, H * 0.2);
    g.fillStyle = '#ffe9a8';
    g.beginPath();
    g.roundRect(lx - W * 0.03, ly - W * 0.07, W * 0.06, W * 0.075, W * 0.012);
    g.fill();
    g.strokeStyle = '#0a0f30';
    g.lineWidth = Math.max(2, W * 0.008);
    g.stroke();
    g.fillStyle = '#0a0f30';
    g.beginPath();
    g.moveTo(lx - W * 0.042, ly - W * 0.068);
    g.lineTo(lx, ly - W * 0.11);
    g.lineTo(lx + W * 0.042, ly - W * 0.068);
    g.closePath();
    g.fill();
  }
}

function cavern(g, W, H, R) {
  fillDown(g, W, 0, H, [[0, '#2c1560'], [0.5, '#1c0e42'], [1, '#0d0626']]);
  glow(g, W * 0.5, H * 0.5, Math.max(W, H) * 0.6, '140, 90, 255', 0.3);
  // Rock walls closing in from the sides.
  g.fillStyle = '#140a30';
  for (const side of [0, 1]) {
    g.beginPath();
    g.moveTo(side ? W : 0, 0);
    for (let k = 0; k <= 12; k++) {
      const y = (H * k) / 12, d = W * (0.05 + 0.09 * R()) * (k % 2 ? 1 : 0.45);
      g.lineTo(side ? W - d : d, y);
    }
    g.lineTo(side ? W : 0, H);
    g.closePath();
    g.fill();
  }
  // Stalactites.
  for (let k = 0; k < 11; k++) {
    const x = W * (k / 10 + (R() - 0.5) * 0.05), w = W * (0.03 + R() * 0.035), len = H * (0.04 + R() * 0.1);
    const grad = g.createLinearGradient(x - w, 0, x + w, 0);
    grad.addColorStop(0, '#2a1658');
    grad.addColorStop(1, '#0f0728');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(x - w, 0);
    g.lineTo(x, len);
    g.lineTo(x + w, 0);
    g.closePath();
    g.fill();
  }
  crystals(g, W * 0.1, H * 0.01, W * 0.13, '125, 240, 255', '42, 120, 220', R, -1);
  crystals(g, W * 0.88, H * 0.01, W * 0.11, '255, 140, 225', '150, 50, 200', R, -1);
  // The floor, a heap of gold and more crystals.
  g.fillStyle = '#0a0420';
  g.beginPath();
  g.moveTo(0, H);
  g.lineTo(0, H * 0.9);
  g.quadraticCurveTo(W * 0.3, H * 0.84, W * 0.5, H * 0.9);
  g.quadraticCurveTo(W * 0.75, H * 0.95, W, H * 0.87);
  g.lineTo(W, H);
  g.closePath();
  g.fill();
  crystals(g, W * 0.1, H * 0.93, W * 0.17, '255, 140, 225', '150, 50, 200', R);
  crystals(g, W * 0.9, H * 0.91, W * 0.19, '125, 240, 255', '42, 120, 220', R);
  crystals(g, W * 0.3, H * 0.97, W * 0.08, '170, 255, 190', '40, 160, 110', R);
  glow(g, W * 0.56, H * 0.97, W * 0.4, '255, 200, 80', 0.45);
  for (let k = 0; k < 60; k++) {
    const a = R(), x = W * (0.42 + R() * 0.3), y = H * (0.955 + a * 0.05) - Math.max(0, W * 0.05 * (1 - Math.abs(x / W - 0.57) * 7)), r = W * 0.017;
    g.fillStyle = '#b5770a';
    g.beginPath();
    g.ellipse(x, y + r * 0.25, r, r * 0.45, 0, 0, TAU);
    g.fill();
    g.fillStyle = k % 3 ? '#ffc93c' : '#ffe58a';
    g.beginPath();
    g.ellipse(x, y, r, r * 0.45, 0, 0, TAU);
    g.fill();
  }
}

function harbour(g, W, H, R) {
  const h = H * 0.3;
  fillDown(g, W, 0, h, [[0, '#2a2a80'], [0.4, '#a2479d'], [0.75, '#ff8a5c'], [1, '#ffd98a']]);
  const sx = W * 0.68;
  glow(g, sx, h, W * 0.7, '255, 220, 150', 0.75);
  for (const [x, y, s] of [[0.2, 0.09, 0.2], [0.75, 0.05, 0.16], [0.5, 0.17, 0.12]]) {
    g.save();
    g.translate(W * x, H * y);
    g.scale(1, 0.45);
    cloud(g, 0, 0, W * s, 'rgba(255, 170, 190, 0.55)');
    g.restore();
  }
  g.fillStyle = '#fff6c9';
  g.beginPath();
  g.arc(sx, h, Math.min(W * 0.1, H * 0.06), Math.PI, 0);
  g.fill();
  // A far headland with a lighthouse.
  g.fillStyle = '#5a2f7a';
  g.beginPath();
  g.moveTo(W, h);
  g.lineTo(W, h - H * 0.035);
  g.quadraticCurveTo(W * 0.9, h - H * 0.05, W * 0.8, h);
  g.closePath();
  g.fill();
  g.fillRect(W * 0.925, h - H * 0.1, W * 0.022, H * 0.07);
  glow(g, W * 0.936, h - H * 0.105, W * 0.07, '255, 250, 200', 0.9);
  fillDown(g, W, h, H, [[0, '#ffb07a'], [0.18, '#c8588f'], [0.55, '#5a3596'], [1, '#231a5c']]);
  // The sun's path on the water.
  for (let k = 0; k < 70; k++) {
    const d = R(), y = h + (H - h) * d * d * 0.9 + 3, w = W * (0.02 + 0.1 * d) * (0.5 + R());
    g.fillStyle = `rgba(255, 236, 170, ${0.55 * (1 - d * 0.7)})`;
    g.beginPath();
    g.roundRect(sx + (R() - 0.5) * W * (0.1 + 0.5 * d) - w / 2, y, w, 1.5 + d * 2.5, 2);
    g.fill();
  }
  // A ship on the horizon.
  const ship = (x, s) => {
    g.fillStyle = '#3a1d5c';
    g.beginPath();
    g.moveTo(x - s * 0.5, h - s * 0.06);
    g.lineTo(x + s * 0.55, h - s * 0.06);
    g.lineTo(x + s * 0.4, h + s * 0.07);
    g.lineTo(x - s * 0.38, h + s * 0.07);
    g.closePath();
    g.fill();
    for (const [mx, mh] of [[-0.18, 0.62], [0.16, 0.5]]) {
      g.fillRect(x + mx * s - s * 0.012, h - s * (0.06 + mh), s * 0.024, s * mh);
      g.fillStyle = '#f7d9c4';
      g.beginPath();
      g.moveTo(x + mx * s + s * 0.03, h - s * (0.02 + mh));
      g.quadraticCurveTo(x + mx * s + s * 0.3, h - s * (0.06 + mh * 0.55), x + mx * s + s * 0.03, h - s * 0.12);
      g.closePath();
      g.fill();
      g.fillStyle = '#3a1d5c';
    }
  };
  ship(W * 0.24, Math.min(W * 0.26, H * 0.16));
  // The quay.
  const q = H * 0.89;
  fillDown(g, W, q, H, [[0, '#a8683a'], [1, '#5e3319']]);
  g.strokeStyle = 'rgba(40, 16, 4, 0.5)';
  g.lineWidth = 2;
  for (let k = 1; k < 5; k++) {
    g.beginPath();
    g.moveTo(0, q + ((H - q) * k) / 5);
    g.lineTo(W, q + ((H - q) * k) / 5);
    g.stroke();
  }
  g.fillStyle = 'rgba(255, 220, 170, 0.35)';
  g.fillRect(0, q, W, 3);
  for (const x of [0.06, 0.94]) {
    g.fillStyle = '#4a2812';
    g.beginPath();
    g.roundRect(W * x - W * 0.028, q - H * 0.06, W * 0.056, H * 0.1, W * 0.012);
    g.fill();
    g.fillStyle = '#d9b27a';
    g.fillRect(W * x - W * 0.032, q - H * 0.035, W * 0.064, H * 0.012);
  }
}

function keep(g, W, H, R) {
  const h = H * 0.3;
  fillDown(g, W, 0, h, [[0, '#0d1a4d'], [0.55, '#2c56a8'], [1, '#a7d0f5']]);
  for (let k = 0; k < 50; k++) {
    g.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.6})`;
    g.beginPath();
    g.arc(R() * W, R() * h * 0.6, 0.6 + R() * 1.1, 0, TAU);
    g.fill();
  }
  // The northern lights.
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const [y, col, ph] of [[0.06, '90, 255, 170', 0], [0.1, '90, 220, 255', 1.7], [0.14, '190, 120, 255', 3.1]]) {
    for (let x = 0; x <= W; x += 2) {
      const k = x / W, top = H * (y + 0.025 * Math.sin(k * 5 + ph) + 0.012 * Math.sin(k * 13 + ph * 2)), len = H * (0.07 + 0.03 * Math.sin(k * 9 + ph));
      const grad = g.createLinearGradient(0, top, 0, top + len);
      grad.addColorStop(0, `rgba(${col}, 0.3)`);
      grad.addColorStop(1, `rgba(${col}, 0)`);
      g.fillStyle = grad;
      g.fillRect(x, top, 2, len);
    }
  }
  g.restore();
  peaks(g, W, h, H * 0.15, H, '#8fa9e0', '#ffffff', R);
  peaks(g, W, h + H * 0.02, H * 0.09, H, '#6583c9', '#eaf3ff', R);
  castle(g, W * 0.5, h + H * 0.012, Math.min(W * 0.5, H * 0.3), { wall: '#e8f1ff', shade: '#a9bfe8', roof: '#3f6fd0', window: '#ffd76a', flag: '#ff6f91', gate: '#31549e' });
  hills(g, W, h + H * 0.03, H * 0.014, H, '#f4f9ff', R, 2);
  fillDown(g, W, h + H * 0.04, H, [[0, '#f4f9ff'], [0.6, '#d3e4fb'], [1, '#a9c6ee']]);
  // Drifts.
  g.fillStyle = 'rgba(120, 160, 220, 0.16)';
  for (let k = 0; k < 6; k++) {
    g.beginPath();
    g.ellipse(W * R(), h + (H - h) * (0.15 + 0.14 * k), W * (0.25 + R() * 0.2), H * 0.012, 0, 0, TAU);
    g.fill();
  }
  // Pines, bigger towards the front.
  for (const side of [0, 1]) {
    for (let k = 0; k < 6; k++) {
      const d = k / 5, x = (side ? 1 - (0.02 + R() * 0.2) * (0.4 + d) : (0.02 + R() * 0.2) * (0.4 + d)) * W;
      pine(g, x, h + H * 0.07 + (H - h) * 0.92 * d ** 1.4, W * (0.1 + 0.2 * d), '#1d5a52', '#ffffff');
    }
  }
}

// ---- chapters -----------------------------------------------------------------------------

const PLACES = [
  { name: 'Palace Garden', paint: garden, top: '#3f9cf0', drift: 'petal' },
  { name: 'Great Hall', paint: hall, top: '#3b1f6e', drift: 'dust' },
  { name: 'Moonlit Courtyard', paint: courtyard, top: '#070a33', drift: 'firefly' },
  { name: 'Crystal Cavern', paint: cavern, top: '#2c1560', drift: 'glint' },
  { name: 'Royal Harbour', paint: harbour, top: '#2a2a80', drift: 'glint' },
  { name: 'Snowy Keep', paint: keep, top: '#0d1a4d', drift: 'snow' },
];
const ROUND = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];

// The chapter a level belongs to: { index, name, first, last, place }.
export function chapterFor(n) {
  const index = Math.floor((Math.max(1, n) - 1) / 10), place = PLACES[index % PLACES.length];
  const round = Math.floor(index / PLACES.length);
  return { index, name: place.name + (ROUND[round] ?? ` ${round + 1}`), first: index * 10 + 1, last: index * 10 + 10, place };
}

// Paints chapter `index`'s scene over the whole W x H canvas.
export function paintScene(g, W, H, index) {
  const place = PLACES[index % PLACES.length];
  g.save();
  place.paint(g, W, H, seeded(977 + index % PLACES.length));
  // Darker towards the middle, where the board sits, and at the very edges.
  const shade = g.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, 'rgba(10, 8, 50, 0.12)');
  shade.addColorStop(0.22, 'rgba(10, 8, 50, 0)');
  shade.addColorStop(0.8, 'rgba(10, 8, 50, 0)');
  shade.addColorStop(1, 'rgba(10, 8, 50, 0.3)');
  g.fillStyle = shade;
  g.fillRect(0, 0, W, H);
  g.restore();
  return place.top;
}

// The things drifting across the scene. t: seconds.
const DRIFT = Array.from({ length: 18 }, (_, k) => {
  const R = seeded(31 + k * 7919);
  return [R(), R(), R(), R()];
});
const wrap = (v, m) => ((v % m) + m) % m;

export function paintDrift(g, W, H, index, t) {
  const kind = PLACES[index % PLACES.length].drift;
  g.save();
  for (const [a, b, c, d] of DRIFT) {
    if (kind === 'petal') {
      const x = wrap(a * W + t * 16 * (0.5 + b) + Math.sin(t * 0.8 + c * 6) * 22, W + 40) - 20;
      const y = wrap(b * H + t * 24 * (0.6 + c), H + 40) - 20;
      g.save();
      g.translate(x, y);
      g.rotate(t * (0.8 + d * 1.6) + a * 6);
      g.fillStyle = d > 0.5 ? 'rgba(255, 190, 220, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      g.beginPath();
      g.ellipse(0, 0, 6, 3.2, 0, 0, TAU);
      g.fill();
      g.restore();
    } else if (kind === 'snow') {
      const x = wrap(a * W + t * 9 * (b - 0.5) + Math.sin(t * 0.9 + c * 6) * 16, W + 20) - 10;
      const y = wrap(b * H + t * 30 * (0.5 + c), H + 20) - 10;
      g.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * d})`;
      g.beginPath();
      g.arc(x, y, 1.6 + d * 2.2, 0, TAU);
      g.fill();
    } else if (kind === 'dust') {
      const x = a * W + Math.sin(t * 0.5 + d * 6) * 14, y = H - wrap(b * H + t * 9 * (0.5 + c), H);
      g.fillStyle = `rgba(255, 233, 168, ${0.28 + 0.26 * Math.sin(t * 1.3 + a * 9)})`;
      g.beginPath();
      g.arc(x, y, 1.4 + d * 1.6, 0, TAU);
      g.fill();
    } else if (kind === 'firefly') {
      const x = a * W + Math.sin(t * 0.4 + b * 7) * 44, y = c * H + Math.cos(t * 0.33 + d * 7) * 32;
      const on = Math.max(0, Math.sin(t * 1.1 + a * 20));
      if (on > 0.02) {
        glow(g, x, y, 9, '236, 255, 140', 0.85 * on);
        g.fillStyle = `rgba(255, 255, 220, ${on})`;
        g.beginPath();
        g.arc(x, y, 1.6, 0, TAU);
        g.fill();
      }
    } else {
      // Glints: they blink where they are.
      const k = wrap(t * (0.18 + 0.12 * d) + c, 1);
      if (k < 0.3) {
        const z = Math.sin((Math.PI * k) / 0.3) * (5 + 7 * d);
        g.fillStyle = 'rgba(255,255,255,0.95)';
        g.beginPath();
        for (let j = 0; j < 8; j++) {
          const ang = (j * Math.PI) / 4, r = j % 2 ? z * 0.18 : z;
          g[j ? 'lineTo' : 'moveTo'](a * W + Math.cos(ang) * r, b * H + Math.sin(ang) * r);
        }
        g.closePath();
        g.fill();
      }
    }
  }
  g.restore();
}
