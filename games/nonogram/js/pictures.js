// Nonogram pictures: hand-drawn icons for the small puzzles, and recipes
// (critters, badges, landscapes, islands and quilts) for the rest.
//
// Every recipe takes a random number source R and the grid size, and
// returns { grid, kind, sym, paint }:
//   grid  which squares are filled (1) or empty (0)
//   kind  what each square is part of (for colouring), or null
//   sym   'v' if mirrored left to right, 'vh' if top to bottom too, or null
//   paint(grid, kind) the colours of the finished picture: { fg, bg }, one
//         colour per square (fg for filled squares, bg for empty ones)

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// How deep inside the shape each filled square is: 1 on its edge, 2 one
// step in, and so on (empty squares 0).
export function depthOf(grid, cols, rows) {
  const d = new Int16Array(cols * rows).fill(-1);
  const q = [];
  for (let i = 0; i < grid.length; i++) {
    const r = (i / cols) | 0, c = i % cols;
    if (!grid[i]) { d[i] = 0; continue; }
    if (r === 0 || c === 0 || r === rows - 1 || c === cols - 1 || !grid[i - 1] || !grid[i + 1] || !grid[i - cols] || !grid[i + cols]) {
      d[i] = 1;
      q.push(i);
    }
  }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], r = (i / cols) | 0, c = i % cols;
    for (const [dr, dc] of STEPS) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
      const j = rr * cols + cc;
      if (d[j] === -1) { d[j] = d[i] + 1; q.push(j); }
    }
  }
  return d;
}

// Empty squares shut in by the picture (holes, like eyes): 1, else 0.
export function holesOf(grid, cols, rows) {
  const out = new Uint8Array(cols * rows);
  const q = [];
  for (let i = 0; i < grid.length; i++) {
    const r = (i / cols) | 0, c = i % cols;
    if (grid[i]) continue;
    out[i] = 1;
    if (r === 0 || c === 0 || r === rows - 1 || c === cols - 1) { out[i] = 0; q.push(i); }
  }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], r = (i / cols) | 0, c = i % cols;
    for (const [dr, dc] of STEPS) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
      const j = rr * cols + cc;
      if (out[j]) { out[j] = 0; q.push(j); }
    }
  }
  return out;
}

function inPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Draw a shape given as a function of a point (x, y down) that returns a
// kind for a filled square, '' or 0 for empty, or a string starting with
// '-' for an empty square that's part of the picture (an eye, a window).
// The shape is scaled and centred to fill the grid, `margin` squares in.
function rasterFit(inside, cols, rows, margin = 0, stretch = 1.15) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const S = 120;
  for (let i = 0; i <= S; i++) {
    for (let j = 0; j <= S; j++) {
      const x = -1.6 + (3.2 * i) / S, y = -1.6 + (3.2 * j) / S;
      const k = inside(x, y);
      if (!k || (typeof k === 'string' && k[0] === '-')) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  // Stretch it a little (not too much) if it's wider or taller than the grid.
  let ux = (x1 - x0) / Math.max(1, cols - 2 * margin - 0.6), uy = (y1 - y0) / Math.max(1, rows - 2 * margin - 0.6);
  if (ux > uy) uy = Math.max(uy, ux / stretch);
  else ux = Math.max(ux, uy / stretch);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const grid = new Uint8Array(cols * rows), kind = new Array(cols * rows).fill(null);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = inside(cx + (c + 0.5 - cols / 2) * ux, cy + (r + 0.5 - rows / 2) * uy);
      if (!k) continue;
      if (typeof k === 'string' && k[0] === '-') kind[r * cols + c] = k;
      else { grid[r * cols + c] = 1; kind[r * cols + c] = k; }
    }
  }
  return { grid, kind };
}

// Smooth random bumps: a lattice of random heights, eased between.
function noise(R, size) {
  const n = size + 2, v = Array.from({ length: n * n }, () => R());
  const ease = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    x = clamp(x, 0, 0.9999) * size;
    y = clamp(y, 0, 0.9999) * size;
    const i = Math.floor(x), j = Math.floor(y), fx = ease(x - i), fy = ease(y - j);
    const a = v[j * n + i], b = v[j * n + i + 1], c = v[(j + 1) * n + i], d = v[(j + 1) * n + i + 1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

// Fill the squares where a field is highest, so that a given share of the
// grid ends up filled.
function threshold(field, share) {
  const sorted = Float64Array.from(field).sort();
  const t = sorted[Math.floor((1 - share) * (sorted.length - 1))];
  return Uint8Array.from(field, (v) => (v > t ? 1 : 0));
}

// ---- hand-drawn icons (10×10) -------------------------------------------------------------

// Each letter is a colour from the palette; dots are empty. `hole` colours
// the empty squares the picture shuts in (eyes, windows), if given.
export const ICONS = [
  { name: 'heart', bg: '#fff1f3', pal: { r: '#ef4d5e', p: '#ff97a6', d: '#c22f45' }, px: [
    '..........',
    '.rrr..rrr.',
    'rpprrrrrrr',
    'rprrrrrrrr',
    'rrrrrrrrrd',
    '.rrrrrrrd.',
    '..rrrrrd..',
    '...rrrd...',
    '....rd....',
    '..........'] },
  { name: 'house', bg: '#e8f4ff', hole: '#5ec8ff', pal: { r: '#e8513f', w: '#ffe2b8', d: '#8a5a2e' }, px: [
    '....rr....',
    '...rrrr.d.',
    '..rrrrrrd.',
    '.rrrrrrrr.',
    'rrrrrrrrrr',
    '.wwwwwwww.',
    '.w..ww..w.',
    '.w..ww..w.',
    '.wwwddwww.',
    '.wwwddwww.'] },
  { name: 'tree', bg: '#eaf8ff', pal: { g: '#2fa34f', l: '#7fd36b', t: '#8a5a2e' }, px: [
    '....gg....',
    '...glgg...',
    '..gllggg..',
    '..gggggg..',
    '.gglgggg..',
    '.gggggggg.',
    'gggggggggg',
    '....tt....',
    '....tt....',
    '...tttt...'] },
  { name: 'cat', bg: '#fff7e8', hole: '#2f8a4a', pal: { o: '#f39a2b', p: '#ff8fa3', w: '#fff4e0' }, px: [
    'o........o',
    'oo......oo',
    'oooooooooo',
    'oo.ooo.ooo',
    'oo.ooo.ooo',
    'oooooooooo',
    'ooooppoooo',
    '.oowoowoo.',
    '.oooooooo.',
    '..........'] },
  { name: 'fish', bg: '#e6f6ff', pal: { b: '#2f8ae0', l: '#6fc2ff', k: '#1d2340' }, px: [
    '..........',
    '...bbb....',
    '..bbbbb..b',
    '.bkbbbbbbb',
    'bbbbbbbbb.',
    'bbblllbbb.',
    '.blllllbbb',
    '..bbbbb..b',
    '...bbb....',
    '..........'] },
  { name: 'star', bg: '#f1f0ff', pal: { y: '#ffc928', o: '#f39a12' }, px: [
    '....yy....',
    '....yy....',
    '...yyyy...',
    'yyyyyyyyyy',
    '.yyyyyyyy.',
    '..yyyyyy..',
    '..yyyyyy..',
    '.yyyooyyy.',
    '.yyo..oyy.',
    'yo......oy'] },
  { name: 'mushroom', bg: '#f3fbea', pal: { r: '#e8413c', w: '#ffffff', c: '#f7e7c8' }, px: [
    '...rrrr...',
    '.rrwrrrrr.',
    'rrrrrrwwrr',
    'rwwrrrwwrr',
    'rwwrrrrrrr',
    '..........',
    '...cccc...',
    '...cccc...',
    '...cccc...',
    '..cccccc..'] },
  { name: 'mug', bg: '#f6f0ff', pal: { u: '#8e4ad8', l: '#c9a8ff', w: '#c9cfe6' }, px: [
    '..w...w...',
    '...w...w..',
    '..w...w...',
    '..........',
    'uuuuuuuu..',
    'ulluuuuuuu',
    'uluuuuuu.u',
    'uuuuuuuuuu',
    '.uuuuuuu..',
    '..uuuuu...'] },
  { name: 'umbrella', bg: '#eaf6ff', pal: { r: '#f2576d', y: '#ffd93b', k: '#1d2340' }, px: [
    '....rr....',
    '..rryyrr..',
    '.rrryyrrr.',
    'rrrryyrrrr',
    'rrrryyrrrr',
    '....k.....',
    '....k.....',
    '....k.....',
    '..k.k.....',
    '...k......'] },
  { name: 'key', bg: '#fffbea', pal: { y: '#f5b70a', l: '#ffe27a' }, px: [
    '..........',
    '.yyy......',
    'yy.yy.....',
    'y...y.....',
    'yy.yyyyyyy',
    '.yyylllyly',
    '.......y.y',
    '..........',
    '..........',
    '..........'] },
  { name: 'apple', bg: '#f2fbec', pal: { r: '#e8413c', g: '#4caf50', t: '#8a5a2e', w: '#ff9a8f' }, px: [
    '.....t....',
    '....tgg...',
    '.rrrtrrr..',
    'rrrrrrrrr.',
    'rwwrrrrrr.',
    'rwrrrrrrr.',
    'rrrrrrrrr.',
    '.rrrrrrr..',
    '..rr.rr...',
    '..........'] },
  { name: 'bell', bg: '#fff8e6', pal: { y: '#f5b70a', l: '#ffe27a', o: '#c98a00' }, px: [
    '....oo....',
    '...yyyy...',
    '..yylyyy..',
    '..ylyyyy..',
    '..ylyyyy..',
    '.yyyyyyyy.',
    'yyyyyyyyyy',
    'oooooooooo',
    '....oo....',
    '..........'] },
  { name: 'sailboat', bg: '#e3f3ff', pal: { w: '#ffffff', r: '#e8413c', b: '#2f5bd9', t: '#8a5a2e' }, px: [
    '....t.....',
    '....tr....',
    '...wtrr...',
    '..wwtrrr..',
    '.wwwt.....',
    'wwwwt.....',
    '....t.....',
    'bbbbbbbbbb',
    '.bbbbbbbb.',
    '..bbbbbb..'] },
  { name: 'rocket', bg: '#ecebff', hole: '#5ec8ff', pal: { w: '#eef2fb', r: '#e8413c', o: '#ff9a1f' }, px: [
    '....rr....',
    '...wwww...',
    '...w..w...',
    '...w..w...',
    '...wwww...',
    '..rwwwwr..',
    '.rrwwwwrr.',
    '.r.wwww.r.',
    '....oo....',
    '...o..o...'] },
  { name: 'ghost', bg: '#efeefb', hole: '#3a3250', pal: { w: '#ffffff' }, px: [
    '...wwww...',
    '..wwwwww..',
    '.wwwwwwww.',
    '.w..ww..w.',
    '.w..ww..w.',
    '.wwwwwwww.',
    '.www..www.',
    '.wwwwwwww.',
    '.wwwwwwww.',
    '.w.ww.ww.w'] },
  { name: 'flower', bg: '#f3fbea', pal: { p: '#f26bb5', y: '#ffd93b', g: '#4caf50' }, px: [
    '..pp..pp..',
    '.pppppppp.',
    '..ppyypp..',
    '.pppyyppp.',
    '..pppppp..',
    '...pppp...',
    '....g.....',
    '.gg.g.gg..',
    '..ggggg...',
    '....g.....'] },
  { name: 'music note', bg: '#eef2ff', pal: { k: '#3a4266' }, px: [
    '....kkkkkk',
    '....kkkkkk',
    '....k....k',
    '....k....k',
    '....k....k',
    '..kkk..kkk',
    '.kkkk.kkkk',
    '.kkkk.kkkk',
    '..kk...kk.',
    '..........'] },
  { name: 'smiley', bg: '#fffbea', hole: '#5a3d00', pal: { y: '#ffd12e', o: '#f5a300' }, px: [
    '...yyyy...',
    '.yyyyyyyy.',
    '.yy.yy.yy.',
    'yyy.yy.yyy',
    'yyyyyyyyyy',
    'yoyyyyyyoy',
    'yy.yyyy.yy',
    '.yy....yy.',
    '.yyyyyyyy.',
    '...yyyy...'] },
  { name: 'moon', bg: '#1f2550', pal: { y: '#ffe27a', o: '#f5c542', s: '#ffffff' }, px: [
    '...yyy....',
    '..yyy.....',
    '.yyy......',
    'yyyy......',
    'yyyy......',
    'yyyy..s...',
    'yyyyy.....',
    '.yyyyyy..y',
    '..oyyyyyy.',
    '...oooo...'] },
  { name: 'crown', bg: '#fff6e0', pal: { y: '#f5b70a', r: '#e8413c', b: '#2f5bd9', o: '#c98a00' }, px: [
    '..........',
    'y...y...y.',
    'yy.yyy.yy.',
    'yyyyyyyyy.',
    'yyryybyry.',
    'yyyyyyyyy.',
    'ooooooooo.',
    '..........',
    '..........',
    '..........'] },
  { name: 'duck', bg: '#e6f4ff', pal: { y: '#ffd93b', o: '#ff9a1f', k: '#1d2340', w: '#ffffff' }, px: [
    '...yyy....',
    '..yyyyy...',
    '..ykyyyoo.',
    '..yyyyyoo.',
    '...yyy....',
    '.yyyyyyy..',
    'yyywwyyyy.',
    'yywwwwyyy.',
    '.yyyyyyy..',
    '..........'] },
  { name: 'snail', bg: '#f2fbec', pal: { b: '#b07a45', s: '#8a5a2e', g: '#86d64a', k: '#1d2340' }, px: [
    '..........',
    '.....bbb..',
    '....bsssb.',
    '...bsbbsb.',
    'g..bsbssb.',
    'gk.bsbbsb.',
    'gg.bssssb.',
    'ggg.bbbb..',
    'gggggggggg',
    '..........'] },
  { name: 'pair of cherries', bg: '#fff3f0', pal: { r: '#e8413c', d: '#2f7d32', w: '#ffb3a8' }, px: [
    '......ll..',
    '.....dll..',
    '....dd....',
    '...d..d...',
    '..d....d..',
    '.rrr..rrr.',
    'rwrrrrwrrr',
    'rrrrrrrrrr',
    'rrrrrrrrrr',
    '.rr....rr.'] },
  { name: 'ice cream', bg: '#fff0f6', pal: { p: '#ff8fbf', w: '#fff4e0', c: '#d9a066', b: '#a86d3a', r: '#e8413c' }, px: [
    '....r.....',
    '...pppp...',
    '..pppwpp..',
    '..pwpppp..',
    '..pppppp..',
    '..cccccc..',
    '...cbcc...',
    '...ccbc...',
    '....cc....',
    '....b.....'] },
  { name: 'sun', bg: '#e8f4ff', pal: { y: '#ffd12e', o: '#ff9a1f' }, px: [
    '....oo....',
    '....oo....',
    '..yyyyyy..',
    '.yyyyyyyy.',
    'ooyyyyyyoo',
    'ooyyyyyyoo',
    '.yyyyyyyy.',
    '..yyyyyy..',
    '....oo....',
    '....oo....'] },
  { name: 'rain cloud', bg: '#eef2fb', pal: { w: '#ffffff', g: '#c7cfe6', b: '#3b8ff0' }, px: [
    '...ww.....',
    '..wwwwww..',
    '.wwwwwwww.',
    'wwwwwwwwww',
    'gggggggggg',
    '..........',
    '.b..b..b..',
    '..b..b..b.',
    '.b..b..b..',
    '..........'] },
  { name: 'butterfly', bg: '#f6f0ff', pal: { p: '#9b4dff', l: '#ff8fd0', k: '#3a3250' }, px: [
    'pp..k..pp.',
    'ppp.k.ppp.',
    'plpkkkplp.',
    'ppppkpppp.',
    '.pppkppp..',
    '.llpkpll..',
    'lllpkplll.',
    'lllkkklll.',
    '.l..k..l..',
    '..........'] },
  { name: 'anchor', bg: '#e6f2ff', pal: { b: '#2f5bd9' }, px: [
    '...bbbb...',
    '...b..b...',
    '...bbbb...',
    '.bbbbbbbb.',
    '....bb....',
    '....bb....',
    'bb..bb..bb',
    'bb..bb..bb',
    '.bbbbbbbb.',
    '...bbbb...'] },
  { name: 'gem', bg: '#eafcff', pal: { c: '#22c3b4', l: '#7ef0e4', d: '#0c7f6c' }, px: [
    '..........',
    '..cccccc..',
    '.clllcccc.',
    'cllcccccdc',
    '.cccccccd.',
    '..ccccdd..',
    '...ccdd...',
    '....dd....',
    '..........',
    '..........'] },
  { name: 'cactus', bg: '#fff8e8', pal: { g: '#2fa34f', l: '#86d64a', p: '#f26bb5', s: '#e0b070' }, px: [
    '....gp....',
    '....gg....',
    '.g..gg....',
    '.gg.gg..g.',
    '.gg.gl.gg.',
    '..gggl.gg.',
    '....glgg..',
    '....gg....',
    '..ssssss..',
    '...ssss...'] },
  { name: 'bunny', bg: '#eef7ee', hole: '#3a3250', pal: { w: '#ffffff', p: '#ffa3c0' }, px: [
    '.ww....ww.',
    '.wp....pw.',
    '.wp....pw.',
    '.ww....ww.',
    '.wwwwwwww.',
    'ww.wwww.ww',
    'wwwwppwwww',
    'wwwwwwwwww',
    '.wwwwwwww.',
    '..wwwwww..'] },
  { name: 'owl', bg: '#f0f4ff', hole: '#1d2340', pal: { o: '#a0703c', y: '#ffb52e', b: '#f2dcb3' }, px: [
    '.o......o.',
    '.oo....oo.',
    '.oooooooo.',
    'oo..oo..oo',
    'oo..oo..oo',
    'ooooyyoooo',
    '.oobbbboo.',
    '.obbbbbbo.',
    '..oobboo..',
    '..y....y..'] },
  { name: 'frog', bg: '#eaf6ff', hole: '#8a1f3d', pal: { g: '#4caf50', w: '#ffffff', k: '#1d2340' }, px: [
    '.ggg..ggg.',
    'gwwkggwwkg',
    'gwwkggwwkg',
    'gggggggggg',
    'gggggggggg',
    'gg......gg',
    'ggg....ggg',
    '.gggggggg.',
    '..gggggg..',
    '.gg....gg.'] },
  { name: 'whale', bg: '#e3f3ff', pal: { b: '#3d6fd9', l: '#9cc4ff', w: '#5ec8ff', k: '#1d2340' }, px: [
    '..w.w.....',
    '...w......',
    '..bbbbb...',
    '.bbbbbbbb.',
    'bbkbbbbbb.',
    'bbbbbbbbbb',
    'blllllbbbb',
    '.llllbbb.b',
    '..lll..bbb',
    '.........b'] },
  { name: 'car', bg: '#eef6ff', hole: '#9cd8ff', pal: { r: '#e8413c', k: '#1d2340', g: '#c7cfe6', y: '#ffd93b' }, px: [
    '..........',
    '...rrrr...',
    '..r..r.r..',
    '.r...r..r.',
    'rrrrrrrrry',
    'rrrrrrrrrr',
    'rkkrrrrkkr',
    '.kgk..kgk.',
    '..k....k..',
    '..........'] },
  { name: 'light bulb', bg: '#f4f1ff', pal: { y: '#ffd93b', w: '#fff6c2', g: '#9aa4b1' }, px: [
    '...yyyy...',
    '..yyyyyy..',
    '.yyywyyyy.',
    '.yywyyyyy.',
    '.yyyyyyyy.',
    '..yyyyyy..',
    '...yyyy...',
    '...gggg...',
    '...gggg...',
    '....gg....'] },
  { name: 'padlock', bg: '#fff8e8', pal: { k: '#9aa4b1', y: '#f5b70a' }, px: [
    '...kkkk...',
    '..kk..kk..',
    '..k....k..',
    '..k....k..',
    '.yyyyyyyy.',
    '.yyyyyyyy.',
    '.yyy..yyy.',
    '.yyyy.yyy.',
    '.yyyyyyyy.',
    '.yyyyyyyy.'] },
  { name: 'penguin', bg: '#e6f6ff', pal: { k: '#2a3050', w: '#ffffff', y: '#ffa21f' }, px: [
    '...kkkk...',
    '..kkkkkk..',
    '..kwkkwk..',
    '..kkyykk..',
    '.kkwwwwkk.',
    'kkwwwwwwkk',
    'kkwwwwwwkk',
    '.kwwwwwwk.',
    '..kwwwwk..',
    '..yy..yy..'] },
  { name: 'strawberry', bg: '#fff1f3', pal: { r: '#e8413c', l: '#4caf50', w: '#ffe27a' }, px: [
    '...llll...',
    '..llllll..',
    '.rrllllrr.',
    'rrrrrrrrrr',
    'rwrrwrrwrr',
    'rrrrrrrrrr',
    '.rrwrrwrr.',
    '..rrrrrr..',
    '...rwrr...',
    '....rr....'] },
  { name: 'clover', bg: '#f3fbea', pal: { g: '#2fa34f', l: '#7fd36b', d: '#2f7d32' }, px: [
    '.gg....gg.',
    'glgg..gglg',
    'gggggggggg',
    '.gggggggg.',
    '...gggg...',
    '.gggggggg.',
    'gggggggggg',
    'glgg..gglg',
    '.gg.d..gg.',
    '....d.....'] },
  { name: 'crab', bg: '#fff4e6', hole: '#1d2340', pal: { r: '#e8513f', o: '#ff8a5c' }, px: [
    'r........r',
    'rr......rr',
    '.rr....rr.',
    '..rrrrrr..',
    '.rr.rr.rr.',
    'rrrrrrrrrr',
    'r.oooooo.r',
    'r.rrrrrr.r',
    '..r....r..',
    '.r......r.'] },
  { name: 'bee', bg: '#f3fbea', pal: { y: '#ffc928', k: '#2a2a3a', w: '#dff3ff' }, px: [
    '..ww..ww..',
    '.wwww.www.',
    '.wwww.www.',
    '..ww..ww..',
    '.yyyyyyyy.',
    'kykkyykkyk',
    'yyyyyyyyyy',
    'kykkyykkyk',
    '.yyyyyyyy.',
    '...kkkk...'] },
  { name: 'pear', bg: '#f6fbe6', pal: { g: '#a5cf3a', l: '#d8ef8a', t: '#8a5a2e', f: '#4caf50' }, px: [
    '....t.....',
    '....tff...',
    '....gg....',
    '...gggg...',
    '...gggg...',
    '..gggggg..',
    '.gggggggg.',
    '.gllggggg.',
    '.glgggggg.',
    '..gggggg..'] },
  { name: 'trophy', bg: '#f1f0ff', pal: { y: '#f5b70a', l: '#ffe27a', o: '#c98a00' }, px: [
    'yyyyyyyyyy',
    'y.yyyyyy.y',
    'y.ylyyyy.y',
    '.yylyyyyy.',
    '..yyyyyy..',
    '...yyyy...',
    '....yy....',
    '....yy....',
    '..oooooo..',
    '..oooooo..'] },
  { name: 'balloon', bg: '#eaf6ff', pal: { r: '#f2576d', w: '#ffc2cb', k: '#3a4266' }, px: [
    '...rrrr...',
    '..rrrrrr..',
    '.rwwrrrrr.',
    '.rwrrrrrr.',
    '.rrrrrrrr.',
    '..rrrrrr..',
    '...rrrr...',
    '....rr....',
    '.....k....',
    '....k.....'] },
  { name: 'cupcake', bg: '#fff0f6', pal: { p: '#ff8fbf', w: '#fff4e0', c: '#d9a066', r: '#e8413c', b: '#a86d3a' }, px: [
    '....rr....',
    '...pppp...',
    '..pwpppp..',
    '.pppppwpp.',
    'pppppppppp',
    '.cbcbcbcb.',
    '.cbcbcbcb.',
    '.cbcbcbcb.',
    '..cbcbcb..',
    '..........'] },
  { name: 'pig', bg: '#fff3f6', hole: '#7a2848', pal: { p: '#ff9fb8', d: '#e86f92' }, px: [
    '.pp....pp.',
    'ppp....ppp',
    'pppppppppp',
    'pp.pppp.pp',
    'pppppppppp',
    'ppdddddppp',
    'ppd.dd.dpp',
    'ppdddddppp',
    '.pppppppp.',
    '..pppppp..'] },
  { name: 'dog', bg: '#f4f1ff', hole: '#1d2340', pal: { b: '#b07a45', e: '#6e4520', w: '#f2dcb3', k: '#1d2340' }, px: [
    'ee......ee',
    'eebbbbbbee',
    'eebbbbbbee',
    'eeb.bb.bee',
    'e.bbbbbb.e',
    '..bwwwwb..',
    '..wwkkww..',
    '..wwwwww..',
    '...wwww...',
    '..........'] },
  { name: 'turtle', bg: '#eaf8ff', hole: '#1d2340', pal: { g: '#4caf50', d: '#2f7d32', l: '#8bc34a' }, px: [
    '..........',
    '...dddd...',
    '..dgdgdd..',
    '.dddgdgdd.',
    'ddgdddgddl',
    'dddddddll.',
    '.l.l..l.l.',
    '.l.l..l.l.',
    '..........',
    '..........'] },
  { name: 'tent', bg: '#1f2550', hole: '#ffd34d', pal: { o: '#ff9a1f', r: '#e8513f', g: '#4caf50', s: '#ffffff' }, px: [
    's.......s.',
    '....o.....',
    '...ooo..s.',
    '..oorrr...',
    '..oorrrr..',
    '.ooo..rrr.',
    '.ooo..rrrr',
    'ooo....rrr',
    'gggggggggg',
    'gggggggggg'] },
  { name: 'lighthouse', bg: '#e3f3ff', hole: '#ffd34d', pal: { r: '#e8413c', w: '#ffffff', k: '#3a4266', b: '#2f5bd9' }, px: [
    '....kk....',
    '...k..k...',
    '...kkkk...',
    '...rrrr...',
    '...wwww...',
    '...rrrr...',
    '..wwwwww..',
    '..rrrrrr..',
    'bbwwwwwwbb',
    'bbbbbbbbbb'] },
];

// The icons in a fixed shuffled order, the same everywhere.
let iconOrder = null;
function orderedIcons() {
  if (!iconOrder) {
    let s = 0x1c0a;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    iconOrder = [...ICONS.keys()];
    for (let i = iconOrder.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [iconOrder[i], iconOrder[j]] = [iconOrder[j], iconOrder[i]]; }
  }
  return iconOrder;
}

// The k-th icon puzzle: every icon once, then every icon mirrored, then at
// random (mirrored or not).
export function iconPicture(R, cols, rows, k, alt = 0) {
  const order = orderedIcons();
  const round = Math.floor(k / order.length);
  const icon = ICONS[round < 2 ? order[(k + alt * 7) % order.length] : Math.floor(R() * ICONS.length)];
  const flip = round === 1 || (round >= 2 && R() < 0.5);
  const grid = new Uint8Array(cols * rows), kind = new Array(cols * rows).fill(null);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = icon.px[r][flip ? cols - 1 - c : c];
      if (ch !== '.') { grid[r * cols + c] = 1; kind[r * cols + c] = ch; }
    }
  }
  const first = Object.values(icon.pal)[0];
  const paint = (g, kd) => {
    const holes = holesOf(g, cols, rows);
    return {
      fg: Array.from(g, (v, i) => (v ? icon.pal[kd[i]] || first : null)),
      bg: Array.from(g, (v, i) => (v ? null : holes[i] && icon.hole ? icon.hole : icon.bg)),
    };
  };
  return { grid, kind, sym: null, paint, fixed: true, title: `It’s ${/^[aeiou]/.test(icon.name) ? 'an' : 'a'} ${icon.name}!` };
}

// ---- critters ----------------------------------------------------------------------------

export function critterPicture(R, cols, rows) {
  return cols <= 12 ? invader(R, cols, rows) : creature(R, cols, rows);
}

// A little space critter: half of it at random, mirrored, denser in the
// middle, with a pair of eyes.
function invader(R, cols, rows) {
  const half = Math.ceil(cols / 2);
  const grid = new Uint8Array(cols * rows);
  const lean = R() * 0.2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < half; c++) {
      const mid = 1 - Math.abs(c + 0.5 - cols / 2) / (cols / 2);
      const vert = 1 - Math.abs(r + 0.5 - rows * 0.5) / (rows * 0.5);
      grid[r * cols + c] = R() < 0.2 + lean + 0.45 * mid + 0.2 * vert ? 1 : 0;
    }
  }
  // Every row and every column gets something.
  for (let r = 0; r < rows; r++) {
    let any = false;
    for (let c = 0; c < half; c++) any ||= !!grid[r * cols + c];
    if (!any) grid[r * cols + half - 1 - Math.floor(R() * 2)] = 1;
  }
  for (let c = 0; c < half; c++) {
    let any = false;
    for (let r = 0; r < rows; r++) any ||= !!grid[r * cols + c];
    if (!any) grid[Math.floor(rows * (0.3 + R() * 0.4)) * cols + c] = 1;
  }
  // Eyes: two squares with filled squares all round them, up top.
  const er = 2 + Math.floor(R() * 2), ec = Math.max(1, Math.round(cols * 0.25 + R()));
  for (let r = er - 1; r <= er + 1; r++) for (let c = ec - 1; c <= ec + 1; c++) grid[r * cols + c] = 1;
  grid[er * cols + ec] = 0;
  const g = mirrorGrid(grid, cols, rows, 'v');
  const hue = R() * 360;
  const paint = (gg) => {
    const d = depthOf(gg, cols, rows), holes = holesOf(gg, cols, rows);
    return {
      fg: Array.from(gg, (v, i) => (v ? (d[i] <= 1 ? hsl(hue, 60, 40) : hsl(hue + 12, 72, 56)) : null)),
      bg: Array.from(gg, (v, i) => (v ? null : holes[i] ? '#ffffff' : hsl(hue + 180, 40, 95))),
    };
  };
  return { grid: g, kind: null, sym: 'v', paint, title: 'A little space critter!' };
}

// A rounder creature for the bigger grids: a body of overlapping blobs,
// mirrored, with legs, maybe arms, ears or antennae, eyes and a mouth.
function creature(R, cols, rows) {
  const blobs = [];
  const n = 1 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    blobs.push({ x: i ? R() * 0.35 : 0, y: i ? (R() - 0.6) * 0.8 : 0, rx: 0.45 + R() * 0.4, ry: 0.4 + R() * 0.35 });
  }
  let bottom = -Infinity, top = Infinity, side = 0;
  for (const b of blobs) { bottom = Math.max(bottom, b.y + b.ry); top = Math.min(top, b.y - b.ry); side = Math.max(side, b.x + b.rx); }
  const main = blobs[0];
  const legs = { n: R() < 0.7 ? 1 + Math.floor(R() * 2) : 0, w: 0.12 + R() * 0.1, len: 0.25 + R() * 0.3 };
  const legX = [main.rx * (0.25 + R() * 0.2), main.rx * (0.6 + R() * 0.15)];
  const arms = R() < 0.5 ? { y: main.y + (R() - 0.3) * main.ry * 0.6, len: 0.25 + R() * 0.25, w: 0.12 + R() * 0.08 } : null;
  const head = R() < 0.35 ? 'ears' : R() < 0.6 ? 'antennae' : 'none';
  const eye = { x: main.rx * (0.3 + R() * 0.2), y: main.y - main.ry * (0.15 + R() * 0.3), r: 0.12 + R() * 0.07 };
  const mouth = R() < 0.7;
  const belly = R() < 0.6;
  const inside = (x, y) => {
    const ax = Math.abs(x);
    // Eyes first (they're holes, with a pupil in the bigger ones).
    const ed = Math.hypot(ax - eye.x, y - eye.y);
    if (ed < eye.r * 0.45 && cols >= 20) return 'pupil';
    if (ed < eye.r) return '-eye';
    if (mouth) {
      const my = main.y + main.ry * 0.25, mw = main.rx * 0.38;
      if (ax < mw && y > my && y < my + 0.12 + 0.1 * (1 - (ax / mw) ** 2) && y > my + 0.12 * (ax / mw) ** 2) return '-mouth';
    }
    for (const b of blobs) {
      const dx = (ax - b.x) / b.rx, dy = (y - b.y) / b.ry;
      if (dx * dx + dy * dy <= 1) {
        if (belly && b === main && ((ax / (b.rx * 0.6)) ** 2 + ((y - b.y - b.ry * 0.35) / (b.ry * 0.5)) ** 2 <= 1)) return 'belly';
        return 'body';
      }
    }
    for (let l = 0; l < legs.n; l++) {
      if (Math.abs(ax - legX[l]) < legs.w && y > bottom - 0.2 && y < bottom + legs.len) return 'limb';
    }
    if (arms && Math.abs(y - arms.y) < arms.w && ax > side - 0.15 && ax < side + arms.len) return 'limb';
    if (head === 'ears' && inPolygon(ax, y, [[main.rx * 0.2, top + 0.15], [main.rx * 0.75, top - 0.3], [main.rx * 0.75, top + 0.3]])) return 'horn';
    if (head === 'antennae') {
      const ay = top - 0.25, axx = main.rx * 0.45;
      if (Math.hypot(ax - axx, y - ay) < 0.1) return 'horn';
      if (Math.abs(ax - axx * (1 - (ay - y) * 0)) < 0.05 && y > ay && y < top + 0.15) return 'limb';
    }
    return 0;
  };
  const { grid, kind } = rasterFit(inside, cols, rows, R() < 0.6 ? 0 : 1, 1.4);
  const hue = R() * 360, horn = hue + 140 + R() * 80;
  const paint = (g, kd) => {
    const d = depthOf(g, cols, rows), holes = holesOf(g, cols, rows);
    return {
      fg: Array.from(g, (v, i) => {
        if (!v) return null;
        switch (kd[i]) {
          case 'pupil': return '#1d2340';
          case 'belly': return hsl(hue + 20, 80, 78);
          case 'limb': return hsl(hue, 55, 38);
          case 'horn': return hsl(horn, 80, 60);
          default: return d[i] <= 1 ? hsl(hue, 60, 40) : hsl(hue, 70, 52 + Math.min(3, d[i]) * 3);
        }
      }),
      bg: Array.from(g, (v, i) => {
        if (v) return null;
        if (kd[i] === '-mouth' && holes[i]) return '#7a1f3d';
        if (holes[i]) return '#ffffff';
        return hsl(hue + 180, 40, 95);
      }),
    };
  };
  return { grid, kind, sym: 'v', paint, title: 'A little critter!' };
}

// ---- badges --------------------------------------------------------------------------------

function starPoints(points, inner, lift = 0) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points, rad = i % 2 ? inner : 1;
    pts.push([Math.cos(a) * rad, Math.sin(a) * rad + lift]);
  }
  return pts;
}

const HEX = Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3 + Math.PI / 6), Math.sin((i * Math.PI) / 3 + Math.PI / 6)]);
const BOLT = [[0.15, -1], [-0.55, 0.12], [-0.05, 0.12], [-0.2, 1], [0.55, -0.15], [0.05, -0.15], [0.3, -1]];

// Shapes to put on a badge, each a test of a point (x, y down, about -1..1).
const MOTIFS = {
  heart: () => (x, y) => {
    const X = x * 1.12, Y = -y * 1.12 + 0.25;
    return (X * X + Y * Y - 1) ** 3 - X * X * Y * Y * Y <= 0;
  },
  star: (R) => {
    const pts = starPoints(5 + Math.floor(R() * 3), 0.5 + R() * 0.08, 0.08);
    return (x, y) => inPolygon(x, y, pts);
  },
  flower: (R) => {
    const petals = 5 + Math.floor(R() * 3);
    return (x, y) => {
      const r = Math.hypot(x, y), a = Math.atan2(y, x);
      if (r < 0.32) return 'centre';
      return r < 0.62 + 0.36 * Math.cos(petals * a);
    };
  },
  plus: () => (x, y) => (Math.abs(x) < 0.34 && Math.abs(y) < 0.92) || (Math.abs(y) < 0.34 && Math.abs(x) < 0.92),
  moon: () => (x, y) => x * x + y * y < 0.85 && (x - 0.38) ** 2 + (y + 0.18) ** 2 > 0.45,
  drop: () => (x, y) => x * x + (y - 0.3) ** 2 < 0.42 || (y < 0.3 && y > -1 && Math.abs(x) < (y + 1) * 0.5),
  bolt: () => (x, y) => inPolygon(x, y, BOLT),
  paw: () => (x, y) => ((x / 0.6) ** 2 + ((y - 0.38) / 0.48) ** 2 < 1)
    || Math.hypot(Math.abs(x) - 0.66, y + 0.18) < 0.24 || Math.hypot(Math.abs(x) - 0.26, y + 0.62) < 0.26,
  clover: () => (x, y) => Math.hypot(x, y - 0.42) < 0.42 || Math.hypot(x, y + 0.42) < 0.42 || Math.hypot(x - 0.42, y) < 0.42 || Math.hypot(x + 0.42, y) < 0.42,
  diamond: () => (x, y) => Math.abs(x) * 0.85 + Math.abs(y) < 0.95,
  house: () => (x, y) => {
    if (Math.abs(x) < 0.2 && y > 0.35 && y < 0.95) return '-door';
    return (Math.abs(x) < 0.7 && y > -0.1 && y < 0.95) || (y <= -0.1 && y > -0.95 && Math.abs(x) < (y + 0.95) * 1.0);
  },
  tree: () => (x, y) => {
    if (Math.abs(x) < 0.14 && y > 0.6 && y < 1) return 'trunk';
    for (const [top, w] of [[-1, 0.5], [-0.55, 0.72], [-0.1, 0.95]]) if (y > top && y < top + 0.7 && Math.abs(x) < ((y - top) / 0.7) * w) return true;
    return false;
  },
};

const PLATES = {
  circle: (x, y) => x * x + y * y <= 1,
  squircle: (x, y) => x ** 4 + y ** 4 <= 1,
  hexagon: (x, y) => inPolygon(x, y, HEX),
  shield: (x, y) => (y < 0.15 ? Math.abs(x) <= 0.92 && y >= -0.95 : Math.abs(x) <= 0.92 * (1 - (y - 0.15) / 0.85) && y <= 1),
  square: (x, y) => Math.abs(x) <= 0.92 && Math.abs(y) <= 0.92,
};

export const EMBLEMS = Object.keys(MOTIFS);
const NICE = { plus: 'cross', drop: 'raindrop', bolt: 'lightning bolt', paw: 'paw print', house: 'little house' };

export function emblemPicture(R, cols, rows, motifName = EMBLEMS[Math.floor(R() * EMBLEMS.length)]) {
  const motif = MOTIFS[motifName](R);
  const plateName = Object.keys(PLATES)[Math.floor(R() * Object.keys(PLATES).length)];
  const plate = PLATES[plateName];
  // Three ways to show it: cut out of a plate, inside a frame, or on its own.
  const solo = ['heart', 'flower', 'paw', 'clover', 'house', 'tree', 'plus', 'drop'];
  const how = R() < 0.42 ? 'cutout' : R() < 0.6 || !solo.includes(motifName) ? 'framed' : 'solo';
  const size = how === 'cutout' ? 0.6 + R() * 0.08 : 0.58 + R() * 0.06;
  const inside = (x, y) => {
    if (how === 'solo') {
      const k = motif(x, y);
      return k === true ? 'motif' : k;
    }
    const m = motif(x / size, y / size);
    if (how === 'cutout') {
      if (!plate(x, y)) return 0;
      if (m === true) return '-motif';
      if (typeof m === 'string' && m[0] !== '-') return 'detail';
      return 'plate';
    }
    if (plate(x, y) && !plate(x / 0.8, y / 0.8)) return 'ring';
    if (m === true) return 'motif';
    if (m) return m[0] === '-' ? m : 'detail';
    return 0;
  };
  const { grid, kind } = rasterFit(inside, cols, rows, 0);
  const hue = R() * 360, hue2 = hue + 150 + R() * 60;
  const paint = (g, kd) => {
    const holes = holesOf(g, cols, rows);
    return {
      fg: Array.from(g, (v, i) => {
        if (!v) return null;
        const r = (i / cols) | 0, c = i % cols;
        const shade = (r / rows) * 8 - (c / cols) * 4;
        switch (kd[i]) {
          case 'ring': return hsl(hue2, 60, 40);
          case 'detail': case 'centre': return hsl(hue2 + 30, 90, 60);
          case 'trunk': return hsl(28, 50, 34);
          case 'motif': return hsl(hue, 72, 52 - shade);
          default: return hsl(hue, 65, 48 - shade);
        }
      }),
      bg: Array.from(g, (v, i) => (v ? null : holes[i] ? hsl(hue2, 80, 90) : '#fdf8ee')),
    };
  };
  const mirrored = !['moon', 'bolt'].includes(motifName);
  const what = NICE[motifName] || motifName;
  const title = how === 'solo' ? `It’s ${/^[aeiou]/.test(what) ? 'an' : 'a'} ${what}!` : `A ${what} badge!`;
  return { grid, kind, sym: mirrored ? 'v' : null, paint, title };
}

// ---- landscapes -----------------------------------------------------------------------------

export function landscapePicture(R, cols, rows) {
  const N = cols * rows;
  const grid = new Uint8Array(N), kind = new Array(N).fill(null);
  // The ground: rolling hills, or mountain peaks.
  const peaks = R() < 0.4;
  const h = [];
  const base = rows * (0.5 + R() * 0.12);
  const amp = rows * (peaks ? 0.22 : 0.1);
  const f1 = 1 + R() * 2, f2 = 2 + R() * 3, p1 = R() * 6, p2 = R() * 6;
  for (let c = 0; c < cols; c++) {
    const x = c / cols;
    let y = Math.sin(x * Math.PI * f1 + p1) * 0.6 + Math.sin(x * Math.PI * f2 + p2) * 0.4;
    if (peaks) y = 1 - Math.abs(((x * f1 + p1) % 1) * 2 - 1) * 2;
    h.push(clamp(Math.round(base - y * amp), Math.round(rows * 0.3), rows - 2));
  }
  for (let c = 0; c < cols; c++) {
    for (let r = h[c]; r < rows; r++) { grid[r * cols + c] = 1; kind[r * cols + c] = r - h[c] < 1 ? 'top' : 'soil'; }
  }
  // A lake or a winding river cut into the ground.
  if (R() < 0.6) {
    if (R() < 0.5) {
      const cx = cols * (0.3 + R() * 0.4), cy = rows - 1 - R() * rows * 0.15, rx = cols * (0.15 + R() * 0.12), ry = rows * 0.12;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const dx = (c + 0.5 - cx) / rx, dy = (r + 0.5 - cy) / ry;
        if (dx * dx + dy * dy < 1 && r > h[c] + 1) { grid[r * cols + c] = 0; kind[r * cols + c] = 'water'; }
      }
    } else {
      let c = cols * (0.3 + R() * 0.4);
      for (let r = 0; r < rows; r++) {
        c += (R() - 0.5) * 1.6;
        const cc = Math.round(clamp(c, 1, cols - 2));
        if (r > h[cc] + 1) for (const x of [cc, cc + 1]) if (x < cols) { grid[r * cols + x] = 0; kind[r * cols + x] = 'water'; }
      }
    }
  }
  // The sun, up in the sky.
  const sr = Math.max(1.2, cols * (0.08 + R() * 0.06));
  const sx = cols * (R() < 0.5 ? 0.22 : 0.78), sy = rows * 0.12 + sr;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const dx = c + 0.5 - sx, dy = r + 0.5 - sy;
    if (dx * dx + dy * dy < sr * sr && r < h[c] - 1) { grid[r * cols + c] = 1; kind[r * cols + c] = 'sun'; }
  }
  // A cloud or two, away from the sun.
  const clouds = Math.floor(R() * 3);
  for (let k = 0; k < clouds; k++) {
    const cx = sx < cols / 2 ? cols * (0.5 + R() * 0.35) : cols * (0.15 + R() * 0.35), cy = rows * (0.08 + R() * 0.14), w = cols * (0.12 + R() * 0.1);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const dx = (c + 0.5 - cx) / w, dy = (r + 0.5 - cy) / (w * 0.45);
      if (dx * dx + dy * dy < 1 && !grid[r * cols + c] && r < h[c] - 2) { grid[r * cols + c] = 1; kind[r * cols + c] = 'cloud'; }
    }
  }
  // Trees or a little house standing on the ground.
  const things = 1 + Math.floor(R() * 3);
  for (let k = 0; k < things; k++) {
    const c0 = 1 + Math.floor(R() * (cols - 3));
    const ground = h[c0];
    if (R() < 0.3 && cols >= 15) {
      const w = Math.max(4, Math.round(cols * 0.22)) | 1, x0 = clamp(c0, 0, cols - w), hh = Math.max(3, Math.round(rows * 0.14));
      const floor = Math.max(...h.slice(x0, x0 + w));
      for (let r = floor - hh; r < floor; r++) for (let c = x0; c < x0 + w; c++) if (r >= 0) { grid[r * cols + c] = 1; kind[r * cols + c] = 'wall'; }
      for (let i = 0; i <= w / 2; i++) {
        const r = floor - hh - 1 - i;
        for (let c = x0 + i - 1; c <= x0 + w - i; c++) if (r >= 0 && c >= 0 && c < cols) { grid[r * cols + c] = 1; kind[r * cols + c] = 'roof'; }
      }
      const door = x0 + (w >> 1);
      for (let r = floor - Math.min(2, hh - 1); r < floor; r++) { grid[r * cols + door] = 0; kind[r * cols + door] = 'door'; }
      continue;
    }
    const top = Math.max(1, ground - Math.round(rows * (0.18 + R() * 0.12)));
    const cr = Math.max(1, Math.round(cols * (0.06 + R() * 0.05)));
    for (let r = top + cr; r < ground; r++) { grid[r * cols + c0] = 1; kind[r * cols + c0] = 'trunk'; }
    for (let r = top - cr; r <= top + cr; r++) for (let c = c0 - cr; c <= c0 + cr; c++) {
      if (r < 0 || c < 0 || c >= cols) continue;
      if ((r - top) ** 2 + (c - c0) ** 2 <= cr * cr + cr) { grid[r * cols + c] = 1; kind[r * cols + c] = 'leaves'; }
    }
  }
  const dusk = R() < 0.3;
  const house = kind.includes('roof');
  const title = house ? 'A house in the hills!' : peaks ? (dusk ? 'Mountains at sunset!' : 'Mountains!') : dusk ? 'Hills at sunset!' : 'Rolling hills!';
  const paint = (g, kd) => {
    const fg = [], bg = [];
    for (let i = 0; i < N; i++) {
      const r = (i / cols) | 0, c = i % cols;
      const k = kd[i];
      if (g[i]) {
        const depth = r - h[c];
        const kk = k && k[0] !== '-' && k !== 'water' && k !== 'door' ? k : r >= h[c] ? 'soil' : 'cloud';
        fg.push({
          top: hsl(105, 55, 44),
          soil: depth < 2 ? hsl(100, 50, 38 - depth * 2) : hsl(28, 45, 40 - Math.min(10, depth) * 1.2),
          sun: dusk ? hsl(18, 95, 58) : hsl(46, 100, 56),
          cloud: '#ffffff',
          leaves: hsl(130, 45, 30 + ((r + c) % 2) * 5),
          trunk: hsl(25, 50, 32),
          wall: hsl(40, 80, 88),
          roof: hsl(4, 70, 50),
        }[kk] || hsl(100, 50, 40));
        bg.push(null);
      } else {
        fg.push(null);
        if (k === 'door') bg.push(hsl(25, 50, 30));
        else if (k === 'water' || r >= h[c]) bg.push(hsl(205, 80, 62));
        else bg.push(dusk ? hsl(20 + (r / rows) * 30, 85, 78 + (r / rows) * 10) : hsl(205, 85, 86 + (r / rows) * 8));
      }
    }
    return { fg, bg };
  };
  return { grid, kind, sym: null, paint, title };
}

// ---- islands and quilts ------------------------------------------------------------------------

// An island seen from above: a few hills of land in the sea, framed so the
// land fills the picture.
export function islandPicture(R, cols, rows) {
  const hills = Array.from({ length: 3 + Math.floor(R() * 4) }, () => ({ x: 0.2 + R() * 0.6, y: 0.2 + R() * 0.6, r: 0.12 + R() * 0.2, w: 0.6 + R() * 0.6 }));
  const bumps = noise(R, 5), fine = noise(R, 9);
  const field = (x, y) => {
    let v = 0;
    for (const h of hills) v += h.w * Math.exp(-((x - h.x) ** 2 + (y - h.y) ** 2) / (h.r * h.r));
    return v + bumps(x, y) * 0.35 + fine(x, y) * 0.15;
  };
  const share = 0.48 + R() * 0.12;
  // Find where the land is, then frame the picture around it.
  const S = 48, fineGrid = new Float64Array(S * S);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) fineGrid[j * S + i] = field((i + 0.5) / S, (j + 0.5) / S);
  const land = threshold(fineGrid, share * 0.55);
  let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (land[j * S + i]) {
    x0 = Math.min(x0, i / S); x1 = Math.max(x1, (i + 1) / S); y0 = Math.min(y0, j / S); y1 = Math.max(y1, (j + 1) / S);
  }
  const span = Math.max(x1 - x0, y1 - y0) * 1.04, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const values = new Float64Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    values[r * cols + c] = field(cx + ((c + 0.5) / cols - 0.5) * span, cy + ((r + 0.5) / rows - 0.5) * span);
  }
  const grid = threshold(values, share);
  const snow = R() < 0.25;
  const paint = (g) => {
    const d = depthOf(g, cols, rows);
    const sea = depthOf(Uint8Array.from(g, (v) => 1 - v), cols, rows);
    return {
      fg: Array.from(g, (v, i) => {
        if (!v) return null;
        if (d[i] <= 1) return hsl(45, 70, 72);
        if (snow && d[i] >= 4) return '#f4f8ff';
        return d[i] >= 4 ? hsl(130, 40, 28) : d[i] === 3 ? hsl(118, 45, 36) : hsl(100, 50, 45);
      }),
      bg: Array.from(g, (v, i) => (v ? null : sea[i] <= 1 ? hsl(190, 75, 72) : sea[i] <= 3 ? hsl(200, 75, 62) : hsl(212, 70, 52))),
    };
  };
  return { grid, kind: null, sym: null, paint, title: snow ? 'A snowy island!' : 'An island!' };
}

// A quilt or snowflake: one corner at random, mirrored into all four.
export function quiltPicture(R, cols, rows) {
  const bumps = noise(R, 3 + Math.floor(R() * 3)), fine = noise(R, 8);
  const diag = R() < 0.5;
  const values = new Float64Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let x = Math.abs((c + 0.5) / cols - 0.5) * 2, y = Math.abs((r + 0.5) / rows - 0.5) * 2;
    if (diag && y > x) [x, y] = [y, x];
    values[r * cols + c] = bumps(x, y) + fine(x, y) * 0.3 - Math.hypot(x, y) * 0.15;
  }
  const grid = threshold(values, 0.5 + R() * 0.1);
  const hue = R() * 360;
  const paint = (g) => {
    const holes = holesOf(g, cols, rows);
    return {
      fg: Array.from(g, (v, i) => {
        if (!v) return null;
        const r = (i / cols) | 0, c = i % cols;
        const ring = Math.floor(Math.max(Math.abs(c + 0.5 - cols / 2), Math.abs(r + 0.5 - rows / 2)) / (cols / 8));
        return hsl(hue + ring * 28, 70, 48 + (ring % 2) * 10);
      }),
      bg: Array.from(g, (v, i) => (v ? null : holes[i] ? hsl(hue + 180, 70, 88) : '#fbf7ef')),
    };
  };
  return { grid, kind: null, sym: 'vh', paint, title: diag ? 'A snowflake pattern!' : 'A patchwork quilt!' };
}

function mirrorGrid(grid, cols, rows, sym) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sc = c >= cols / 2 ? cols - 1 - c : c;
      const sr = sym === 'vh' && r >= rows / 2 ? rows - 1 - r : r;
      grid[r * cols + c] = grid[sr * cols + sc];
    }
  }
  return grid;
}

// Draw a picture in a style. For 'icon', k says which one (and alt picks
// another if that one won't do); for 'emblem', motif can pick the shape.
export function picture(style, R, cols, rows, { k = 0, alt = 0, motif } = {}) {
  switch (style) {
    case 'icon': return iconPicture(R, cols, rows, k, alt);
    case 'critter': return critterPicture(R, cols, rows);
    case 'emblem': return emblemPicture(R, cols, rows, motif);
    case 'landscape': return landscapePicture(R, cols, rows);
    case 'island': return islandPicture(R, cols, rows);
    default: return quiltPicture(R, cols, rows);
  }
}
