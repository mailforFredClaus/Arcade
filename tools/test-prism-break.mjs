// Checks Prism Break: the level maps are sound, the rules do what they say
// (bounces, brick kinds, power-ups, lives), and a practice player can clear
// every level, so none has a brick that can't be reached or a ball that
// gets stuck for ever. Usage: node tools/test-prism-break.mjs [last level]

import { Game, W, H, COLS, ROWS, BW, BH, TOP, PADDLE_Y, PADDLE_W, BALL_R, STEP, POWER_TIME, GOOD, BAD } from '../games/prism-break/js/engine.js';
import { levelFor, MADE_COUNT, WORLDS } from '../games/prism-break/js/levels.js';
import { steer } from '../games/prism-break/js/bot.js';

const last = Number(process.argv[2] || 70);
let failures = 0;
const check = (ok, what) => {
  if (!ok) {
    failures++;
    console.log(`FAIL: ${what}`);
  }
};
const level = (rows, extra = {}) => ({ n: 0, map: rows, speed: 90, bad: true, drops: 0, ...extra });
const steps = (g, secs, input = {}) => { for (let i = 0; i < Math.round(secs / STEP); i++) g.step(input); };
const says = (g, e) => g.events.some((x) => x.e === e);
// A ball placed and aimed by hand.
function aim(g, x, y, dx, dy) {
  const b = g.balls[0];
  b.stuck = false;
  b.x = x; b.y = y;
  const l = Math.hypot(dx, dy);
  b.dx = dx / l; b.dy = dy / l;
  g.state = 'play';
  return b;
}

// ---- the maps -------------------------------------------------------------------------
check(MADE_COUNT === 50 && WORLDS.length === 5, 'fifty levels laid out by hand, ten to each of five worlds');
for (let n = 1; n <= last; n++) {
  const lv = levelFor(n);
  check(lv.map.every((row) => row.length === COLS && /^[roygtbpkwROYGTBPKW@#*?~.]+$/.test(row)), `level ${n}: every row is ${COLS} letters this game knows`);
  check(lv.map.length <= ROWS, `level ${n}: fits in the field`);
  const g = new Game(lv);
  check(g.total >= 12, `level ${n}: enough to break (${g.total})`);
  check(lv.map[0] === '...........', `level ${n}: room above the bricks`);
}

// ---- bouncing -------------------------------------------------------------------------
{
  const EMPTY = ['...........', 'r.........r']; // (two bricks out of the way, so the level isn't over at once)
  const g = new Game(level(EMPTY));
  check(g.state === 'serve' && g.balls.length === 1 && g.balls[0].stuck, 'starts with a ball on the paddle');
  g.step({ x: 30 });
  check(Math.abs(g.balls[0].x - 30) < 1e-6, 'the ball rides the paddle until it is served');
  g.step({ launch: true });
  check(g.state === 'play' && g.balls[0].dy < 0, 'serving sends it up');
  aim(g, 100, 150, 0, 1);
  steps(g, 1, { x: 20 });
  check(g.lives === 2 && (g.state === 'serve' || g.state === 'wait') && says(g, 'life'), 'a ball that gets past the paddle costs a life');

  const h = new Game(level(EMPTY));
  for (const [off, want] of [[0, 0], [0.9, 1], [-0.9, -1]]) {
    const b = aim(h, W / 2 + off * (PADDLE_W / 2), PADDLE_Y - 6, 0, 1);
    h.paddle.x = W / 2;
    steps(h, 0.15, { x: W / 2 });
    check(b.dy < 0 && Math.sign(Math.round(b.dx * 10)) === want, `off the paddle ${off === 0 ? 'middle: straight up' : off > 0 ? 'right end: out to the right' : 'left end: out to the left'}`);
  }
  // Walls and the top.
  const k = new Game(level(['...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', 'r.........r']));
  const b = aim(k, 30, 100, -1, -1);
  let out = false;
  for (let i = 0; i < 600; i++) { k.step({ x: b.x }); if (b.x < BALL_R - 1e-6 || b.x > W - BALL_R + 1e-6 || b.y < BALL_R - 1e-6) out = true; }
  check(!out && k.lives === 3, 'the walls and the top keep the ball in');
  check(Math.abs(Math.hypot(b.dx, b.dy) - 1) < 1e-6 && Math.abs(b.dy) >= 0.239, 'a ball never ends up going nearly sideways');
}

// ---- bricks ---------------------------------------------------------------------------
{
  const row = (ch) => level(['...........', `.....${ch}.....`, 'r.........r']);
  const hitFromBelow = (g) => { aim(g, 5.5 * BW, TOP + 2 * BH + 6, 0, -1); steps(g, 0.25, { x: null }); };
  let g = new Game(row('r'));
  hitFromBelow(g);
  check(!g.bricks[0].alive && g.balls[0].dy > 0 && g.score > 0 && says(g, 'break'), 'a plain brick breaks in one hit and the ball bounces back');
  g = new Game(row('R'));
  hitFromBelow(g);
  check(g.bricks[0].alive && g.bricks[0].hp === 1 && says(g, 'hit'), 'a tough brick survives the first hit');
  hitFromBelow(g);
  check(!g.bricks[0].alive, 'and breaks on the second');
  g = new Game(row('@'));
  hitFromBelow(g); hitFromBelow(g);
  check(g.bricks[0].alive, 'an armoured brick survives two');
  hitFromBelow(g);
  check(!g.bricks[0].alive, 'and breaks on the third');
  g = new Game(row('#'));
  for (let i = 0; i < 5; i++) hitFromBelow(g);
  check(g.bricks[0].alive && g.total === 2, 'steel never breaks, and does not have to');
  g = new Game(row('~'));
  check(!g.bricks[0].seen, 'a hidden brick starts unseen');
  hitFromBelow(g);
  check(g.bricks[0].alive && g.bricks[0].seen, 'the first hit shows it');
  hitFromBelow(g);
  check(!g.bricks[0].alive, 'the second breaks it');
  g = new Game(row('?'));
  hitFromBelow(g);
  check(g.caps.length === 1 && GOOD.includes(g.caps[0].kind), 'a gift always drops something good');
  // A bomb takes its neighbours, and other bombs go off in turn; steel stays.
  g = new Game(level(['...........', 'rr**rr#rrrr', 'r.........r']));
  aim(g, 2.5 * BW, TOP + 2 * BH + 6, 0, -1);
  steps(g, 0.6, { x: null });
  const alive = g.bricks.filter((b) => b.r === 1 && b.alive).map((b) => b.c);
  check(alive.join() === '0,5,6,7,8,9,10', `a bomb takes the bricks beside it, and sets off the next bomb (left: ${alive.join()})`);
  // Corner hits and fast balls never get through.
  g = new Game(level(['...........', '###########', '###########', 'r.........r'], { speed: 170 }));
  const b = aim(g, 40, 120, 0.3, -1);
  let through = false;
  for (let i = 0; i < 4000; i++) { g.step({ x: b.x }); if (b.y < TOP + BH) through = true; }
  check(!through, 'even a fast ball never gets through a wall of bricks');
  // Combos.
  g = new Game(level(['...........', 'rrrrrrrrrrr', 'rrrrrrrrrrr', 'r.........r']));
  g.destroy(g.bricks[0], 'ball'); g.destroy(g.bricks[1], 'ball'); g.destroy(g.bricks[2], 'ball');
  check(g.combo === 3 && g.score === 10 + 15 + 20, 'bricks in a row without touching the paddle are worth more each time');
}

// ---- power-ups ------------------------------------------------------------------------
{
  const open = () => { const g = new Game(level(['...........', 'rrrrrrrrrrr', 'r.........r'])); aim(g, 60, 120, 0.2, -1); return g; };
  let g = open();
  g.give('multi');
  check(g.balls.length === 3, 'multi makes one ball three');
  g.give('multi');
  check(g.balls.length === 9, 'and three nine');
  g = open();
  g.give('wide');
  steps(g, 0.5, { x: 60 });
  check(g.paddle.w > PADDLE_W * 1.4, 'wide lengthens the paddle');
  g.give('shrink');
  steps(g, 0.5, { x: 60 });
  check(g.paddle.w < PADDLE_W * 0.7 && g.power.wide === 0, 'shrink shortens it (and ends wide)');
  g = open();
  const v = g.speed;
  g.give('slow');
  check(g.speed < v * 0.75, 'slow slows the balls');
  g.give('fast');
  check(g.speed > v * 1.25 && g.power.slow === 0, 'fast speeds them up');
  g = open();
  g.give('laser');
  aim(g, 100, 60, 0.1, -1);
  steps(g, 1.2, { x: 16 });
  check(g.bricks.filter((b) => b.r === 1 && !b.alive).length >= 2 && says(g, 'shot'), 'the laser shoots bricks above the paddle');
  g = new Game(level(['...........', 'rRr@rRr@rRr', 'RRRRRRRRRRR', 'r.........r']));
  g.give('fire');
  aim(g, 60, 100, 0, -1);
  steps(g, 0.95, { x: null });
  check(g.balls[0].dy < 0 && g.balls[0].y < TOP && g.bricks.filter((b) => !b.alive).length >= 2, 'a fireball burns straight through, tough bricks and all');
  g = open();
  g.give('shield');
  aim(g, 100, 205, 0, 1);
  steps(g, 0.4, { x: 10 });
  check(g.lives === 3 && !g.shield && g.balls[0].dy < 0, 'the shield saves a ball, once');
  g = open();
  g.give('life');
  check(g.lives === 4, 'a life is a life');
  g = open();
  g.give('wide');
  steps(g, POWER_TIME.wide + 0.5, { x: null, });
  check(g.power.wide === 0, 'power-ups run out');
  check(BAD.length === 2 && GOOD.length === 7, 'seven to catch and two to dodge');
  // Nothing nasty on the early levels.
  let nasty = 0;
  const early = new Game(levelFor(2));
  for (let i = 0; i < 400; i++) if (BAD.includes(early.pick(false))) nasty++;
  check(nasty === 0, 'nothing to dodge falls on the first levels');
}

// ---- lives and stars --------------------------------------------------------------------
{
  const g = new Game(level(['...........', 'rrrrrrrrrrr']));
  g.step({ launch: true });
  for (let k = 0; k < 3; k++) { g.balls.length = 0; g.step({}); steps(g, 1.2, { launch: true }); }
  check(g.state === 'over' && g.lives === 0, 'three lost balls and the level is over');
  const h = new Game(level(['...........', 'r.........r']));
  aim(h, 50, 100, 0, 1);
  h.destroy(h.bricks[0], 'ball'); h.destroy(h.bricks[1], 'ball');
  h.step({ x: 50 });
  check(h.state === 'clear' && h.stars() === 3, 'breaking everything clears the level: three stars for losing no lives');
  h.lost = 1;
  check(h.stars() === 2, 'two for losing one');
  h.lost = 2;
  check(h.stars() === 1, 'one otherwise');
}

// ---- a practice player clears every level -------------------------------------------------

let slowest = 0, slowestN = 0, total = 0;
const t0 = performance.now();
for (let n = 1; n <= last; n++) {
  const lv = levelFor(n);
  const g = new Game(lv, { seed: n * 17 + 3, lives: 3 });
  let bad = false;
  const limit = 15 * 60 / STEP; // fifteen minutes of play
  let i = 0;
  for (; i < limit && g.state !== 'clear'; i++) {
    if (g.state === 'over') { g.lives = 3; g.serve(); } // (the practice player just keeps going)
    g.step(steer(g));
    if (i % 240 === 0) {
      for (const b of g.balls) if (!(b.x >= 0 && b.x <= W && b.y >= 0 && b.y <= H + 10) || Number.isNaN(b.x + b.y + b.dx + b.dy)) bad = true;
    }
    g.events.length = 0;
  }
  check(!bad, `level ${n}: a ball went somewhere it should not`);
  check(g.state === 'clear', `level ${n} (${lv.name}): the practice player could not clear it in fifteen minutes (${g.left} of ${g.total} left)`);
  const secs = g.t;
  total += secs;
  if (secs > slowest) { slowest = secs; slowestN = n; }
  if (process.env.TIMES) console.log(`  level ${String(n).padStart(2)} ${lv.name.padEnd(16)} ${String(g.total).padStart(3)} bricks  ${secs.toFixed(0).padStart(4)} s`);
}
console.log(`${last} levels cleared by the practice player: ${(total / last).toFixed(0)} s each on average, slowest level ${slowestN} at ${slowest.toFixed(0)} s (${((performance.now() - t0) / 1000).toFixed(1)} s to check)`);

{
  // The same seed plays the same game.
  const play = (seed) => { const g = new Game(levelFor(12), { seed }); for (let i = 0; i < 6000; i++) { g.step(steer(g)); g.events.length = 0; } return `${g.score}:${g.left}:${g.balls.length}:${g.balls[0]?.x.toFixed(4)}`; };
  check(play(5) === play(5), 'the same seed plays out the same way');
}

console.log(failures ? `${failures} problem(s)` : 'All Prism Break checks passed.');
process.exit(failures ? 1 : 0);
