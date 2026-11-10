// Star Swarm's pixel art: every sprite is drawn here, by hand, as rows of
// letters (one letter per pixel, a colour each), then turned into little
// canvases. Ships and aliens are symmetrical, so only their left half is
// written out.

const PALETTE = {
  W: '#ffffff', R: '#ff2a2a', B: '#2a5bff', C: '#29d9ff', Y: '#ffe000', O: '#ff8c1a', G: '#1fd655', P: '#b45cff', K: '#ff6ec7', D: '#9aa0ae', N: '#0b2fb0',
};
export const INK = { white: '#ffffff', red: '#ff2a2a', cyan: '#29d9ff', yellow: '#ffe000', blue: '#2a5bff', green: '#1fd655', orange: '#ff8c1a', pink: '#ff6ec7' };

// Left halves, 8 wide by 16 tall, facing up the screen.
const HALVES = {
  fighter: [
    '.......W', '.......W', '.......W', '......WW', '......WW', '..R...WW', '..R...WW', '..W..BWW',
    '..W..BRW', '..W.WWRW', 'R.WWWWRW', 'R.WWWBWW', 'WWWWWBWW', 'WWW.WWWW', 'WW..R.WW', 'W...R..W',
  ],
  bee0: [
    '........', '........', '...R....', '....R..Y', '.....RYY', '......YY', '..BB.YRY', '.BBBBYYY',
    'BBCBBYBY', 'BBBB.YYY', '.BB..YBY', '.....YYY', '......YY', '.......Y', '........', '........',
  ],
  bee1: [
    '........', '........', '...R....', '....R..Y', '.....RYY', '......YY', '.....YRY', '..B..YYY',
    '.BBB.YBY', 'BBCBBYYY', 'BBBBBYBY', '.BBB.YYY', '..B...YY', '.......Y', '........', '........',
  ],
  fly0: [
    '........', '........', '....B...', '.....B.W', '.RR...WW', 'RRRR.WBW', 'RWWRRWWW', 'RWWRRRWW',
    '.RRRRRWW', '..RRRBWW', '.BBRR.WW', 'BBBB..WW', 'BCCB...W', '.BB.....', '........', '........',
  ],
  fly1: [
    '........', '........', '....B...', '.....B.W', '......WW', '.RR..WBW', 'RRRRRWWW', 'RWWRRRWW',
    'RWWRRRWW', '.RRRRBWW', '..BRR.WW', '.BBB..WW', '.BCB...W', '..B.....', '........', '........',
  ],
  boss0: [
    '........', '..G....G', '..GG..GG', '...GGGGG', '..GGGYYG', '.GGGGYRG', 'GGGGGGGG', 'GGOGGGGG',
    'GOOOGGYG', 'GOOO.GYG', 'GGO..GGG', '.GG...GG', '.G.....G', 'G.......', 'G.......', '........',
  ],
  boss1: [
    '........', '..G....G', '..GG..GG', '...GGGGG', '..GGGYYG', '.GGGGYRG', '.GGGGGGG', 'GGOGGGGG',
    'GOOOGGYG', 'GOOO.GYG', '.GO..GGG', '.GG...GG', '..G....G', '..G.....', '.G......', '........',
  ],
  scorpion: [
    '........', '........', '.R.....Y', 'R.R...YY', 'R..R.YYY', '.R..YYRY', '..RYYYYY', '...YYOYY',
    '..YYYOYY', '.YY.YYYY', 'YY...YOY', 'Y....YYY', '......YY', '.......R', '........', '........',
  ],
  saucer: [
    '........', '........', '........', '........', '......CC', '....CCWW', '...CCWWW', '.GGGGGGG',
    'GGYGGYGG', 'GGGGGGGG', '.GGGGGGG', '..G..G..', '.G..G...', '........', '........', '........',
  ],
  flagship: [
    '........', '........', '.......Y', '......YY', '......YY', '..B..YYY', '..B..YRY', '.BB.YYRY',
    '.BBYYYYY', 'BBBYYRYY', 'BB.YRRYY', 'B..Y.RYY', '...Y..RY', '.......R', '........', '........',
  ],
  dragonfly: [
    '........', '........', '.......G', '..CC..GG', '.CCCC.GR', 'CCWCCCGG', '.CCCCCGG', '..CC..GG',
    '.CCCC.GG', 'CCWCC.GG', '.CCC..GG', '.......G', '.......G', '.......G', '........', '........',
  ],
  satellite: [
    '........', '........', '........', '.......D', '......DD', 'OO...DDD', 'OOO.DDCD', 'OOODDDCD',
    'OOODDDDD', 'OOO.DDRD', 'OO...DDD', '......DD', '.....D.D', '....D...', '........', '........',
  ],
  starship: [
    '........', '.......W', '......WW', '......WW', '.....WWB', '.....WWB', '.....WWW', '....WWWW',
    '....WWRW', '...WWWRW', '..RWWWWW', '.RRWW.WW', 'RRR.W..O', 'RR.....Y', '........', '........',
  ],
};
// The same drawings in other colours.
const RECOLOUR = {
  captive: ['fighter', { W: 'R', R: 'Y', B: 'W' }],
  bossHurt0: ['boss0', { G: 'P', O: 'B', Y: 'K', R: 'W' }],
  bossHurt1: ['boss1', { G: 'P', O: 'B', Y: 'K', R: 'W' }],
};

// The arcade font: 7 x 7 letters in 8 x 8 squares.
const FONT = {
  A: '..###.. .##.##. ##...## ##...## ####### ##...## ##...##',
  B: '######. ##...## ##...## ######. ##...## ##...## ######.',
  C: '.#####. ##...## ##..... ##..... ##..... ##...## .#####.',
  D: '#####.. ##..##. ##...## ##...## ##...## ##..##. #####..',
  E: '####### ##..... ##..... #####.. ##..... ##..... #######',
  F: '####### ##..... ##..... #####.. ##..... ##..... ##.....',
  G: '.#####. ##...## ##..... ##.#### ##...## ##...## .######',
  H: '##...## ##...## ##...## ####### ##...## ##...## ##...##',
  I: '.#####. ...#... ...#... ...#... ...#... ...#... .#####.'.replace(/\.\.\.#\.\.\./g, '..###..'),
  J: '....### .....## .....## .....## ##...## ##...## .#####.',
  K: '##...## ##..##. ##.##.. ####... ##.##.. ##..##. ##...##',
  L: '##..... ##..... ##..... ##..... ##..... ##..... #######',
  M: '##...## ###.### ####### ##.#.## ##...## ##...## ##...##',
  N: '##...## ###..## ####.## ##.#### ##..### ##...## ##...##',
  O: '.#####. ##...## ##...## ##...## ##...## ##...## .#####.',
  P: '######. ##...## ##...## ######. ##..... ##..... ##.....',
  Q: '.#####. ##...## ##...## ##...## ##.#.## ##..##. .###.##',
  R: '######. ##...## ##...## ######. ##.##.. ##..##. ##...##',
  S: '.#####. ##...## ##..... .#####. .....## ##...## .#####.',
  T: '####### ..###.. ..###.. ..###.. ..###.. ..###.. ..###..',
  U: '##...## ##...## ##...## ##...## ##...## ##...## .#####.',
  V: '##...## ##...## ##...## ##...## .##.##. ..###.. ...#...',
  W: '##...## ##...## ##...## ##.#.## ####### ###.### ##...##',
  X: '##...## .##.##. ..###.. ..###.. ..###.. .##.##. ##...##',
  Y: '##...## ##...## .##.##. ..###.. ..###.. ..###.. ..###..',
  Z: '####### ....##. ...##.. ..##... .##.... ##..... #######',
  0: '.#####. ##...## ##..### ##.#.## ###..## ##...## .#####.',
  1: '..###.. .####.. ..###.. ..###.. ..###.. ..###.. .#####.',
  2: '.#####. ##...## .....## ..####. .##.... ##..... #######',
  3: '.#####. ##...## .....## ..####. .....## ##...## .#####.',
  4: '...###. ..####. .##.##. ##..##. ####### ....##. ....##.',
  5: '####### ##..... ######. .....## .....## ##...## .#####.',
  6: '.#####. ##..... ##..... ######. ##...## ##...## .#####.',
  7: '####### .....## ....##. ...##.. ..##... ..##... ..##...',
  8: '.#####. ##...## ##...## .#####. ##...## ##...## .#####.',
  9: '.#####. ##...## ##...## .###### .....## .....## .#####.',
  '-': '....... ....... ....... .#####. ....... ....... .......',
  '!': '..###.. ..###.. ..###.. ..###.. ..###.. ....... ..###..',
  '.': '....... ....... ....... ....... ....... ..##... ..##...',
  ':': '....... ..##... ..##... ....... ..##... ..##... .......',
  '%': '##...## ##..##. ...##.. ..##... .##.... ##..##. #...##.',
  '/': '.....## ....##. ...##.. ..##... .##.... ##..... #......',
  '+': '....... ...#... ...#... .#####. ...#... ...#... .......',
};
// Small 3 x 5 digits, for the points that pop up and the stage badges.
const MINI = ['### #.# #.# #.# ###', '.#. ##. .#. .#. ###', '### ..# ### #.. ###', '### ..# ### ..# ###', '#.# #.# ### ..# ..#',
  '### #.. ### ..# ###', '### #.. ### #.# ###', '### ..# ..# .#. .#.', '### #.# ### #.# ###', '### #.# ### ..# ###'];

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function fromHalf(rows, swap = {}) {
  const c = canvas(16, 16), g = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < 8; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      g.fillStyle = PALETTE[swap[ch] || ch];
      g.fillRect(x, y, 1, 1);
      g.fillRect(15 - x, y, 1, 1);
    }
  });
  return c;
}

// A burst of sparks: an enemy's (small) or a fighter's (big), frame by frame.
function burst(frame, frames, size, colours, seed) {
  const c = canvas(size, size), g = c.getContext('2d'), mid = size / 2;
  let a = seed;
  const rnd = () => ((a = (a * 1103515245 + 12345) >>> 0) / 4294967296);
  const k = (frame + 1) / frames, reach = (size / 2 - 1) * k;
  const spokes = size > 16 ? 18 : 10;
  for (let i = 0; i < spokes; i++) {
    const ang = (i / spokes) * Math.PI * 2 + rnd() * 0.5, len = reach * (0.55 + rnd() * 0.45);
    for (let d = Math.max(1, len - 2 - 4 * (1 - k)); d <= len; d += 1) {
      g.fillStyle = colours[Math.min(colours.length - 1, Math.floor(k * colours.length + rnd() * 1.2))];
      g.fillRect(Math.round(mid + Math.cos(ang) * d - 0.5), Math.round(mid + Math.sin(ang) * d - 0.5), 1, 1);
    }
  }
  if (frame < frames / 2) {
    g.fillStyle = '#ffffff';
    const r = Math.max(1, Math.round(size / 12 - frame / 2));
    g.fillRect(mid - r, mid - r, 2 * r, 2 * r);
  }
  return c;
}

// The flags along the bottom that count the stages: 50, 30, 20, 10, 5 and 1.
function badge(value) {
  const wide = value >= 10, c = canvas(wide ? 14 : 7, 14), g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  if (value === 1) {
    px(1, 1, 1, 12, '#ffffff');
    for (let i = 0; i < 4; i++) px(2, 2 + i, 4 - i, 1, '#ff2a2a');
    px(2, 6, 1, 1, '#ff2a2a');
  } else if (value === 5) {
    px(1, 1, 1, 12, '#ffffff');
    px(2, 2, 4, 6, '#ffe000');
    px(2, 4, 4, 2, '#ff2a2a');
  } else {
    const col = { 10: '#2a5bff', 20: '#ff2a2a', 30: '#1fd655', 50: '#ffe000' }[value];
    px(1, 1, 12, 9, col);
    px(2, 10, 10, 1, col);
    px(4, 11, 6, 1, col);
    px(6, 12, 2, 1, col);
    drawMini(g, String(value), 3, 3, value === 50 ? '#ff2a2a' : '#ffffff');
  }
  return c;
}

function drawMini(g, text, x, y, colour) {
  g.fillStyle = colour;
  for (const ch of text) {
    const rows = MINI[+ch].split(' ');
    rows.forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '#') g.fillRect(x + i, y + j, 1, 1); });
    x += 4;
  }
}

export function makeSprites() {
  const s = {};
  for (const [name, rows] of Object.entries(HALVES)) s[name] = fromHalf(rows);
  for (const [name, [from, swap]] of Object.entries(RECOLOUR)) s[name] = fromHalf(HALVES[from], swap);
  s.boom = [0, 1, 2, 3, 4].map((f) => burst(f, 5, 16, ['#ffffff', '#ffe000', '#ff8c1a', '#ff2a2a'], 7));
  s.bigBoom = [0, 1, 2, 3, 4, 5].map((f) => burst(f, 6, 32, ['#ffffff', '#ffffff', '#ff2a2a', '#2a5bff', '#ff2a2a'], 3));
  s.badges = Object.fromEntries([50, 30, 20, 10, 5, 1].map((v) => [v, badge(v)]));
  // The player's shot and the enemies'.
  s.shot = canvas(3, 8);
  let g = s.shot.getContext('2d');
  g.fillStyle = '#2a5bff'; g.fillRect(0, 2, 3, 6);
  g.fillStyle = '#ffffff'; g.fillRect(1, 0, 1, 7);
  g.fillStyle = '#ff2a2a'; g.fillRect(1, 5, 1, 3);
  s.bomb = canvas(3, 7);
  g = s.bomb.getContext('2d');
  g.fillStyle = '#ff2a2a'; g.fillRect(0, 0, 3, 5);
  g.fillStyle = '#ffffff'; g.fillRect(1, 2, 1, 5);
  // The font, once in each colour as it's first asked for.
  s.glyphs = new Map();
  return s;
}

// Which drawing an enemy shows: wings flap in time, everyone together.
export function enemySprite(s, look, flap) {
  return s[look + flap] || s[look] || s[look + '0'];
}

function glyphs(s, colour) {
  let set = s.glyphs.get(colour);
  if (set) return set;
  set = {};
  for (const [ch, def] of Object.entries(FONT)) {
    const c = canvas(8, 8), g = c.getContext('2d');
    g.fillStyle = colour;
    def.split(' ').forEach((row, y) => { for (let x = 0; x < 7; x++) if (row[x] === '#') g.fillRect(x, y, 1, 1); });
    set[ch] = c;
  }
  s.glyphs.set(colour, set);
  return set;
}

// Write in the arcade font. align: 'left' (x is the left edge), 'right' or 'center'.
export function drawText(g, s, text, x, y, colour = '#ffffff', align = 'left') {
  const set = glyphs(s, colour), w = text.length * 8;
  let at = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
  for (const ch of text) {
    const c = set[ch];
    if (c) g.drawImage(c, at, y);
    at += 8;
  }
}

// Points popping up where something was shot.
export function drawPoints(g, n, x, y, colour) {
  const text = String(n);
  drawMini(g, text, Math.round(x - text.length * 2), Math.round(y - 2), colour);
}
