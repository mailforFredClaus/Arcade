// Prism Break: a practice player. The tests use it to prove every level
// can be cleared, and the title screen uses it to play quietly in the
// background.

import { W, BW, BH, PADDLE_Y, BALL_R, GOOD } from './engine.js';

const SPREAD = 62 * Math.PI / 180;

// What to do this step: { x: where to put the paddle, launch }.
// It goes where the next ball will come down, and leans it towards a brick.
export function steer(g) {
  const p = g.paddle;
  let next = null, soon = Infinity;
  for (const b of g.balls) {
    if (b.stuck) return { x: p.x, launch: true };
    if (b.dy <= 0) continue;
    const t = (PADDLE_Y - BALL_R - b.y) / b.dy;
    if (t < soon) { soon = t; next = b; }
  }
  if (!next) {
    // Nothing coming down: fetch a good capsule if there is one.
    const cap = g.caps.find((c) => GOOD.includes(c.kind));
    return { x: cap ? cap.x : p.x };
  }
  // Where it lands, bouncing off the side walls on the way.
  let x = next.x + next.dx * soon;
  const span = W - 2 * BALL_R;
  x = (((x - BALL_R) % (2 * span)) + 2 * span) % (2 * span);
  if (x > span) x = 2 * span - x;
  x += BALL_R;
  // Lean it towards the lowest brick; or, after a dry spell, any which way
  // (a different way for each bounce), to find the way round the steel.
  let target = null;
  for (const b of g.bricks) if (b.alive && b.type !== 'steel' && (!target || b.y > target.y)) target = b;
  let off = 0;
  if (g.sinceBrick > 2.5) off = Math.sin(next.id * 7.3 + Math.floor(g.t * 0.7) * 2.1) * 0.85;
  else if (target) {
    const a = Math.atan2(target.x + BW / 2 - x, PADDLE_Y - (target.y + BH / 2));
    off = Math.max(-0.85, Math.min(0.85, a / SPREAD));
  }
  return { x: x - off * (p.w / 2) };
}
