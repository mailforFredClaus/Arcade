// Checks Snake's rules: moving, turning, growing, walls and wrapping,
// running into yourself, the gold stars and the scoring. Then a simple
// robot plays whole games, checking after every step that the snake is
// still in one piece, and that the same seed always gives the same game.
// Usage: node tools/test-snake.mjs [games]

import { Snake, COLS, ROWS, DIRS, APPLE_POINTS, STAR_EVERY, STAR_STEPS, STAR_POINTS, SPEEDS } from '../games/snake/js/engine.js';

const games = Number(process.argv[2] || 30);
let failures = 0;
const check = (ok, what) => {
  if (!ok) {
    failures++;
    console.log(`FAIL: ${what}`);
  }
};

// ---- the rules, one at a time ----------------------------------------------------------

{
  const s = new Snake({ seed: 7 });
  check(s.cols === COLS && s.rows === ROWS && s.length === 3 && s.dir === 'right', 'starts three long, heading right');
  check(s.apple >= 0 && !s.on[s.apple], 'the first apple is on an empty cell');
  const head = s.head;
  s.apple = -5; // out of the way
  s.step();
  check(s.head === head + 1 && s.length === 3, 'moves one cell without growing');
  check(!s.turn('left'), 'cannot turn straight back');
  check(!s.turn('right'), 'turning the way it is going does nothing');
  check(s.turn('up') && s.turn('left'), 'two turns can wait their turn');
  check(!s.turn('down'), 'a third turn is not kept');
  s.step();
  check(s.dir === 'up' && s.head === head + 1 - COLS, 'the first queued turn is taken');
  s.step();
  check(s.dir === 'left' && s.head === head - COLS, 'then the second');
}

{
  // Eating: grows by one, scores, and a new apple appears off the snake.
  const s = new Snake({ seed: 3 });
  s.apple = s.head + 1;
  const r = s.step();
  check(r.ate && s.length === 4 && s.score === APPLE_POINTS && s.apples === 1, 'eating an apple grows the snake and scores');
  check(s.apple >= 0 && !s.on[s.apple], 'the next apple is on an empty cell');
  check(s.dropped === -1, 'the tail stays put on the step it grows');
}

{
  // Walls and wrapping.
  const walls = new Snake({ seed: 1 });
  walls.apple = -5;
  let r = { dead: false };
  for (let k = 0; k < COLS && !r.dead; k++) r = walls.step();
  check(r.dead && walls.dead, 'running into the wall ends the game');
  check(walls.step().dead === false && walls.dead, 'nothing more happens after that');
  const wrap = new Snake({ seed: 1, wrap: true });
  wrap.apple = -5;
  const row = Math.floor(wrap.head / COLS);
  for (let k = 0; k < COLS; k++) wrap.step();
  check(!wrap.dead && Math.floor(wrap.head / COLS) === row, 'with no walls it comes back in on the other side');
  wrap.turn('up');
  for (let k = 0; k < ROWS; k++) wrap.step();
  check(!wrap.dead, 'and the same going up and down');
}

{
  // Running into yourself; chasing your own tail is safe.
  const s = new Snake({ seed: 5 });
  for (let k = 0; k < 2; k++) {
    s.apple = s.head + 1;
    s.step();
  }
  s.apple = -5;
  check(s.length === 5, 'five long');
  s.turn('down');
  s.step();
  s.turn('left');
  s.step();
  s.turn('up');
  const r = s.step();
  check(r.dead, 'running into yourself ends the game');
  const t = new Snake({ seed: 5 });
  t.apple = t.head + 1;
  t.step(); // four long: a 2x2 loop chases its own tail for ever
  t.apple = -5;
  for (const d of ['down', 'left', 'up', 'right', 'down', 'left', 'up', 'right']) {
    t.turn(d);
    t.step();
  }
  check(!t.dead && t.length === 4, 'moving into the cell the tail is leaving is safe');
}

{
  // Gold stars: every fifth apple, worth less as time runs out, no growth.
  const s = new Snake({ seed: 11, wrap: true });
  for (let k = 0; k < STAR_EVERY; k++) {
    s.apple = s.next(s.head, s.dir);
    s.step();
  }
  check(s.star >= 0 && !s.on[s.star] && s.star !== s.apple && s.starLeft === STAR_STEPS, `a star appears after ${STAR_EVERY} apples`);
  check(s.starWorth() === STAR_POINTS, 'a fresh star is worth the most');
  s.apple = -5;
  const len = s.length, score = s.score;
  s.star = s.next(s.head, s.dir);
  const r = s.step();
  check(r.star === STAR_POINTS && s.score === score + STAR_POINTS && s.length === len && s.star < 0, 'taking a star scores and does not grow the snake');
  check(s.apple >= 0, 'an apple is back on the board after a star');
  const u = new Snake({ seed: 11, wrap: true });
  for (let k = 0; k < STAR_EVERY; k++) {
    u.apple = u.next(u.head, u.dir);
    u.step();
  }
  u.apple = -5;
  u.star = u.next(u.next(u.head, 'up'), 'up'); // out of the snake's way
  let worth = u.starWorth(), falls = true, gone = false;
  for (let k = 0; k < STAR_STEPS + 2 && !gone; k++) {
    gone = u.step().starGone;
    if (u.star >= 0) {
      falls = falls && u.starWorth() <= worth && u.starWorth() >= 10;
      worth = u.starWorth();
    }
  }
  check(falls, 'a star is worth less and less, never under 10');
  check(gone && u.star < 0, 'a star goes when its time is up');
}

{
  // Speed: creeps up, within its limits.
  for (const [name, [from, to]] of Object.entries(SPEEDS)) {
    const s = new Snake({ speed: name });
    check(s.rate() === from, `${name} starts at ${from} a second`);
    s.apples = 400;
    check(s.rate() === to, `${name} tops out at ${to}`);
  }
}

{
  // A tiny board can be filled: that's a win.
  const s = new Snake({ cols: 4, rows: 2, seed: 2, wrap: true });
  let r = {};
  for (let k = 0; k < 200 && !s.dead && !s.won; k++) {
    // Round and round the two rows.
    const x = s.head % 4, y = Math.floor(s.head / 4);
    s.turn(y === 0 ? (x === 3 ? 'down' : 'right') : x === 0 ? 'up' : 'left');
    r = s.step();
  }
  check(s.won && r.won && s.length === 8, 'filling the board wins');
}

// ---- a robot plays whole games ------------------------------------------------------------

// Heads for the apple (or a star) by the shortest safe way; if there is
// none, takes any step that doesn't kill it at once.
function choose(s) {
  const N = s.cols * s.rows, goal = s.star >= 0 ? s.star : s.apple;
  const dist = new Int32Array(N).fill(-1);
  const queue = [goal];
  dist[goal] = 0;
  const tail = s.body[s.body.length - 1];
  while (queue.length) {
    const c = queue.shift();
    for (const d of Object.keys(DIRS)) {
      const n = s.next(c, d);
      if (n < 0 || dist[n] >= 0 || (s.on[n] && n !== s.head && n !== tail)) continue;
      dist[n] = dist[c] + 1;
      queue.push(n);
    }
  }
  let best = null, bestD = Infinity;
  for (const d of Object.keys(DIRS)) {
    const n = s.next(s.head, d);
    if (n < 0 || (s.on[n] && n !== tail)) continue;
    const k = dist[n] < 0 ? 1e6 : dist[n];
    if (k < bestD) {
      bestD = k;
      best = d;
    }
  }
  return best;
}

function sound(s) {
  const out = [];
  if (s.body.length !== new Set(s.body).size) out.push('the snake overlaps itself');
  let on = 0;
  for (let c = 0; c < s.on.length; c++) on += s.on[c];
  if (on !== s.body.length || s.body.some((c) => !s.on[c])) out.push('the map of where the snake is has gone wrong');
  for (let i = 1; i < s.body.length; i++) {
    const near = Object.keys(DIRS).some((d) => s.next(s.body[i], d) === s.body[i - 1]);
    if (!near) out.push('the snake is in pieces');
  }
  if (s.body.length !== 3 + s.apples) out.push('length does not match apples eaten');
  if (s.apple >= 0 && s.on[s.apple]) out.push('an apple under the snake');
  if (s.star >= 0 && (s.on[s.star] || s.star === s.apple)) out.push('a star under the snake or the apple');
  if (!s.dead && !s.won && s.apple < 0 && s.star < 0) out.push('nothing to eat');
  return out;
}

function playOne(seed, wrap) {
  const s = new Snake({ seed, wrap, speed: ['slow', 'normal', 'fast'][seed % 3] });
  const trace = [];
  const problems = new Set();
  for (let k = 0; k < 20000 && !s.dead && !s.won; k++) {
    const d = choose(s);
    if (d) s.turn(d);
    s.step();
    trace.push(s.head);
    for (const p of sound(s)) problems.add(p);
  }
  return { s, trace, problems: [...problems] };
}

let total = 0, longest = 0, stars = 0;
for (let k = 0; k < games; k++) {
  const wrap = k % 2 === 1;
  const a = playOne(1000 + k, wrap), b = playOne(1000 + k, wrap);
  for (const p of a.problems) check(false, `game ${k}: ${p}`);
  check(a.trace.length === b.trace.length && a.trace.every((c, i) => c === b.trace[i]) && a.s.score === b.s.score, `game ${k}: the same seed gives the same game`);
  check(a.s.dead || a.s.won, `game ${k}: the game ends`);
  check(a.s.score >= a.s.apples * APPLE_POINTS, `game ${k}: the score covers its apples`);
  total += a.s.apples;
  longest = Math.max(longest, a.s.length);
  stars += (a.s.score - a.s.apples * APPLE_POINTS) > 0 ? 1 : 0;
}
check(total / games > 20, 'the robot usually gets a good way');

console.log(`${games} robot games: ${Math.round(total / games)} apples on average, longest snake ${longest}, stars taken in ${stars} games`);
console.log(failures ? `${failures} problem(s)` : 'All Snake checks passed.');
process.exit(failures ? 1 : 0);
