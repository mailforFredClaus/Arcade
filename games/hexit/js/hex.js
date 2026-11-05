// Hexit: honeycomb geometry. Hexagons are flat-topped and addressed by axial
// coordinates (q, r), with s = -q - r. The six directions run clockwise from
// straight up.

export const DIRS = [[0, -1], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]]; // N, NE, SE, S, SW, NW
export const ANGLE = [-90, -30, 30, 90, 150, 210].map((a) => (a * Math.PI) / 180);
export const opposite = (d) => (d + 3) % 6;
const R3 = Math.sqrt(3);

// The centre of hex (q, r) for hexagons of radius 1 (centre to corner).
export const toXY = (q, r) => [1.5 * q, R3 * (r + q / 2)];

export function fromXY(x, y) {
  const q = (2 / 3) * x, r = (-1 / 3) * x + (R3 / 3) * y;
  return round(q, r);
}

function round(q, r) {
  const s = -q - r;
  let rq = Math.round(q), rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return [rq, rr];
}

export const key = (q, r) => `${q},${r}`;
export const dist = (q, r) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));

// ---- shapes ------------------------------------------------------------------------
// Each returns a list of [q, r] cells around (0, 0).

function hexagon(R) {
  const out = [];
  for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (dist(q, r) <= R) out.push([q, r]);
  return out;
}

// A rectangle of columns; taller than wide suits a phone.
function rect(w, h) {
  const out = [];
  for (let col = 0; col < w; col++) for (let row = 0; row < h; row++) out.push([col, row - ((col - (col & 1)) >> 1)]);
  return out;
}

function byPixels(R, inside) {
  const out = [];
  for (let q = -R; q <= R; q++) {
    for (let r = -R * 2; r <= R * 2; r++) {
      const [x, y] = toXY(q, r);
      if (inside(x, y)) out.push([q, r]);
    }
  }
  return out;
}

const circle = (rad) => byPixels(Math.ceil(rad), (x, y) => x * x + y * y <= rad * rad);
const oval = (rad) => byPixels(Math.ceil(rad), (x, y) => (x * x) / (rad * rad * 0.62) + (y * y) / (rad * rad) <= 1);

function star(R) {
  // A hexagon with a triangle on each side.
  const set = new Map(hexagon(R).map((c) => [key(...c), c]));
  for (const [q, r] of hexagon(2 * R)) {
    const s = -q - r;
    const a = [q, r, s].filter((v) => v > R).length, b = [q, r, s].filter((v) => v < -R).length;
    if (a + b === 1 && Math.abs(q) + Math.abs(r) + Math.abs(s) <= 4 * R) set.set(key(q, r), [q, r]);
  }
  return [...set.values()];
}

function flower(R) {
  const set = new Map(hexagon(R).map((c) => [key(...c), c]));
  const k = Math.max(1, Math.round(R / 2));
  for (const [dq, dr] of DIRS) {
    const cq = dq * (R + k - 1), cr = dr * (R + k - 1);
    for (const [q, r] of hexagon(k)) set.set(key(cq + q, cr + r), [cq + q, cr + r]);
  }
  return [...set.values()];
}

function ring(R) {
  const inner = Math.max(1, Math.floor(R / 2.6));
  return hexagon(R).filter(([q, r]) => dist(q, r) > inner);
}

function heart(R) {
  return byPixels(Math.ceil(R * 1.3), (x, y) => {
    const u = x / (R * 1.05), v = -y / (R * 1.05) + 0.25;
    return (u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0;
  });
}

function triangle(n) {
  const out = [];
  for (let q = 0; q <= n; q++) for (let r = 0; r <= n - q; r++) out.push([q, r]);
  // Centre it.
  const c = Math.round(n / 3);
  return out.map(([q, r]) => [q - c, r - c]);
}

function diamond(n) {
  const out = [];
  for (let q = 0; q < n; q++) for (let r = 0; r < Math.round(n * 1.4); r++) out.push([q, r - Math.floor(q / 2)]);
  return centre(out.map(([q, r]) => [q, r]));
}

function bowtie(n) {
  const out = [];
  for (const [q, r] of triangle(n)) out.push([q, r]);
  for (const [q, r] of triangle(n)) out.push([-q, -r]);
  return dedupe(out);
}

function clover(R) {
  const set = new Map();
  const k = Math.max(2, Math.round(R * 0.62));
  for (const d of [0, 2, 4]) {
    const [dq, dr] = DIRS[d];
    for (const [q, r] of hexagon(k)) set.set(key(dq * k + q, dr * k + r), [dq * k + q, dr * k + r]);
  }
  return [...set.values()];
}

function snowflake(R) {
  const set = new Map(hexagon(Math.max(1, Math.round(R / 2))).map((c) => [key(...c), c]));
  for (const [dq, dr] of DIRS) {
    for (let k = 1; k <= R; k++) {
      for (const [eq, er] of [[0, 0], ...DIRS]) {
        if (k < R * 0.45 && (eq || er)) continue;
        const q = dq * k + (k % 2 ? 0 : eq), r = dr * k + (k % 2 ? 0 : er);
        set.set(key(q, r), [q, r]);
      }
    }
  }
  return [...set.values()];
}

const dedupe = (cells) => [...new Map(cells.map((c) => [key(...c), c])).values()];

function centre(cells) {
  let sx = 0, sy = 0;
  for (const [q, r] of cells) {
    const [x, y] = toXY(q, r);
    sx += x;
    sy += y;
  }
  const [cq, cr] = fromXY(sx / cells.length, sy / cells.length);
  return cells.map(([q, r]) => [q - cq, r - cr]);
}

// A lumpy blob, grown at random and mirrored left to right.
function blob(target, R) {
  const set = new Map([[key(0, 0), [0, 0]]]);
  const mirror = (q, r) => [-q, r + q]; // reflect x -> -x
  let guard = 0;
  while (set.size < target && guard++ < target * 40) {
    const cells = [...set.values()];
    const [q, r] = cells[Math.floor(R.next() * cells.length)];
    const [dq, dr] = DIRS[Math.floor(R.next() * 6)];
    const nq = q + dq, nr = r + dr;
    if (dist(nq, nr) > Math.sqrt(target)) continue;
    set.set(key(nq, nr), [nq, nr]);
    const [mq, mr] = mirror(nq, nr);
    set.set(key(mq, mr), [mq, mr]);
  }
  // Fill any pinholes.
  for (const [q, r] of hexagon(Math.ceil(Math.sqrt(target)) + 1)) {
    if (set.has(key(q, r))) continue;
    const around = DIRS.filter(([dq, dr]) => set.has(key(q + dq, r + dr))).length;
    if (around >= 5) set.set(key(q, r), [q, r]);
  }
  return [...set.values()];
}

export const SHAPES = {
  hexagon: (k) => hexagon(k),
  rect: (k) => rect(Math.max(3, Math.round(k * 1.25)), Math.max(4, Math.round(k * 1.9))),
  circle: (k) => circle(k * 1.5 + 0.4),
  oval: (k) => oval(k * 1.75 + 0.5),
  star: (k) => star(Math.max(1, Math.round(k * 0.62))),
  flower: (k) => flower(Math.max(2, Math.round(k * 0.78))),
  ring: (k) => ring(k + 1),
  heart: (k) => heart(k * 1.45 + 0.8),
  triangle: (k) => triangle(Math.round(k * 1.75) + 1),
  diamond: (k) => diamond(Math.round(k * 1.3) + 2),
  bowtie: (k) => bowtie(Math.round(k * 1.15) + 1),
  clover: (k) => clover(k + 1),
  snowflake: (k) => snowflake(Math.round(k * 1.3) + 2),
};

// Cells for a named shape with about `target` cells.
export function shapeCells(name, target, R) {
  if (name === 'blob') return centre(blob(target, R));
  const make = SHAPES[name] || SHAPES.hexagon;
  let best = null;
  for (let k = 1; k <= 60; k++) {
    const cells = make(k);
    if (!best || Math.abs(cells.length - target) < Math.abs(best.length - target)) best = cells;
    if (cells.length > target * 1.4) break;
  }
  return centre(dedupe(best));
}
