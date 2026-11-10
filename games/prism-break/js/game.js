// Prism Break: the screen. Steps the rules in engine.js, draws the field,
// and looks after the touch and keys, the sparks and sounds, the level
// picker and the cards.

import { Game, W, H, BW, BH, PADDLE_Y, PADDLE_H, BALL_R, STEP, SHIELD_Y, POWER_TIME, BAD } from './engine.js';
import { levelFor, WORLDS, MADE_COUNT } from './levels.js';
import { steer } from './bot.js';
import { Art, COLOURS, POWER_LOOK, paintBackdrop, fade } from './art.js';
import { store, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, confetti, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

const canvas = $('stage'), g = canvas.getContext('2d');
const art = new Art();
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
const touch = matchMedia('(pointer: coarse)').matches;
const fmt = (n) => Math.floor(n).toLocaleString();
const STAR = (on) => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}"><path d="M12 2.6l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.2l-5.72 3 1.1-6.37-4.630-4.500 6.400-.930z"/></svg>`;

// ---- saved things ---------------------------------------------------------------------

// n: the furthest level you can play. stars and best: for each level cleared.
const SAVE_KEY = 'prismbreak';
const save = Object.assign({ n: 1, stars: {}, best: {}, seen: false }, store.get(SAVE_KEY, {}) || {});
const writeSave = () => store.set(SAVE_KEY, save);
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);

// ---- the game in hand -----------------------------------------------------------------

let game = null, level = null;
let demo = true; // the practice player is playing, behind the title
let auto = false; // (for testing: the practice player plays a real level)
// 'title', 'play', 'paused', or 'done' (a card is up at the end of a level)
let mode = 'title';
let acc = 0, startAt = 0, endAt = 0, slow = 1;
let targetX = null, wantLaunch = false;
const keys = { left: false, right: false };

function begin(n, asDemo) {
  level = levelFor(n);
  game = new Game(level, { seed: (Math.random() * 2 ** 32) >>> 0 });
  demo = asDemo;
  acc = 0;
  endAt = 0;
  slow = 1;
  startAt = performance.now();
  targetX = null;
  wantLaunch = false;
  parts.length = 0;
  floats.length = 0;
  trails.clear();
  shake = 0;
  comboShown = 0;
  for (const k in powerEls) { powerEls[k].remove(); delete powerEls[k]; }
  paintBack();
}

function startLevel(n) {
  ui.close();
  begin(n, false);
  mode = 'play';
  $('title').classList.add('gone');
  $('hud').hidden = false;
  $('levelLabel').textContent = `LEVEL ${level.n}`;
  $('levelName').textContent = level.name;
  shown.score = -1;
  shown.lives = -1;
  updateHud();
  callout(level.name, `Level ${level.n}`);
}

function toTitle() {
  ui.close();
  mode = 'title';
  $('title').classList.remove('gone');
  $('hud').hidden = true;
  begin(1 + Math.floor(Math.random() * Math.min(MADE_COUNT, Math.max(10, save.n))), true);
  showTitle();
}

function showTitle() {
  $('starTotal').textContent = totalStars();
  const next = levelFor(save.n);
  $('playLabel').textContent = save.n > 1 ? 'Continue' : 'Play';
  $('playSub').textContent = save.n > 1 ? `Level ${next.n} · ${next.name}` : '';
}

// ---- where things go ------------------------------------------------------------------

let Wpx = 1, Hpx = 1, dpr = 1, s = 3, fx = 0, fy = 0;
let back = null;

function layout() {
  Wpx = innerWidth;
  Hpx = innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(Wpx * dpr);
  canvas.height = Math.round(Hpx * dpr);
  // The field starts under the bar along the top (the title's or the game's: they sit at the same height).
  const bar = $('hud').hidden ? document.querySelector('.title-top') : $('hud');
  const safeTop = Math.max(58, bar.getBoundingClientRect().bottom + 8);
  s = Math.min((Wpx - 10) / W, (Hpx - safeTop - 6) / H);
  fx = (Wpx - W * s) / 2;
  fy = safeTop;
  art.scale(s * dpr);
  paintBack();
}

function paintBack() {
  if (!level) return;
  back = document.createElement('canvas');
  back.width = canvas.width;
  back.height = canvas.height;
  const b = back.getContext('2d');
  b.scale(dpr, dpr);
  const world = WORLDS[level.world % WORLDS.length];
  paintBackdrop(b, Wpx, Hpx, world, { x: fx, y: fy, w: W * s, h: H * s });
  document.body.style.background = world.sky[0];
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = world.sky[0];
}

// ---- sparks, shards and words -----------------------------------------------------------

const parts = [], floats = [];
const trails = new Map(); // ball id -> where it has just been
let shake = 0, flash = 0, kick = 0, comboShown = 0, comboAt = 0;
let calloutTimer = 0, lastWall = 0;

function shards(x, y, colour, n, speed = 60) {
  for (let k = 0; k < n; k++) {
    const a = Math.random() * TAU, v = speed * (0.3 + Math.random());
    parts.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, g: 190, t: 0, life: 0.45 + Math.random() * 0.4, size: 0.7 + Math.random() * 1.1, colour, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 16, kind: 'shard' });
  }
}

function sparks(x, y, colour, n, speed = 70, life = 0.35) {
  for (let k = 0; k < n; k++) {
    const a = Math.random() * TAU, v = speed * (0.25 + Math.random());
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 40, t: 0, life: life * (0.6 + Math.random() * 0.8), size: 1.4 + Math.random() * 1.8, colour, kind: 'spark' });
  }
}

function ring(x, y, colour, size = 26) {
  parts.push({ x, y, vx: 0, vy: 0, g: 0, t: 0, life: 0.45, size, colour, kind: 'ring' });
}

function callout(text, small = '') {
  const el = $('callout');
  el.innerHTML = `${text}${small ? `<small>${small}</small>` : ''}`;
  el.classList.add('show');
  clearTimeout(calloutTimer);
  calloutTimer = setTimeout(() => el.classList.remove('show'), 1250);
}

const say = (name, k) => { if (!demo) sfx(name, k); };
const buzz = () => { if (!demo) haptic(); };

function onEvent(ev) {
  switch (ev.e) {
    case 'break': {
      const colour = ev.type === 'bomb' ? '#ff9a3c' : ev.type === 'gift' ? '#ffd76a' : ev.type === 'armour' ? '#ffd76a' : COLOURS[ev.colour] || '#ffffff';
      shards(ev.x, ev.y, colour, 9);
      sparks(ev.x, ev.y, '#ffffff', 3, 50, 0.25);
      if (!demo) floats.push({ x: ev.x, y: ev.y, text: `+${ev.points}`, t: 0, colour });
      say('brick', ev.combo);
      if (ev.combo >= 3) { comboShown = ev.combo; comboAt = performance.now(); }
      break;
    }
    case 'hit':
      sparks(ev.x, ev.y, '#ffffff', 5, 50, 0.25);
      say('brick', 0);
      break;
    case 'steel':
      sparks(ev.x, ev.y, '#dfe6f5', 4, 60, 0.2);
      say('tink');
      break;
    case 'reveal': say('pop'); break;
    case 'paddle':
      kick = 1;
      sparks(ev.x, PADDLE_Y, WORLDS[level.world % WORLDS.length].glow, 6, 60, 0.25);
      say('pad');
      break;
    case 'wall': {
      const now = performance.now();
      if (now - lastWall > 60) { lastWall = now; say('wallb'); }
      break;
    }
    case 'boom':
      ring(ev.x, ev.y, '#ffb347', 30);
      sparks(ev.x, ev.y, '#ffd08a', 22, 150, 0.5);
      shake = Math.max(shake, 0.45);
      flash = Math.max(flash, 0.25);
      say('bomb');
      buzz();
      break;
    case 'power': {
      const bad = BAD.includes(ev.kind);
      say(bad ? 'ouch' : 'power');
      buzz();
      sparks(game.paddle.x, PADDLE_Y, bad ? '#ff2d55' : POWER_LOOK[ev.kind].colour, 16, 90, 0.45);
      if (!demo) callout(POWER_LOOK[ev.kind].name);
      break;
    }
    case 'powerEnd': say('powerdown'); break;
    case 'shot': say('zap'); break;
    case 'shield':
      say('pop');
      ring(ev.x, SHIELD_Y, '#a78bfa', 22);
      break;
    case 'drop':
      sparks(ev.x, H - 2, '#ff4d6d', 14, 110, 0.5);
      break;
    case 'life':
      shake = Math.max(shake, 0.4);
      flash = Math.max(flash, 0.2);
      say('lose');
      buzz();
      break;
    case 'launch': say('whoosh'); break;
    case 'clear':
      endAt = performance.now();
      slow = 0.3;
      say('cheer');
      buzz();
      break;
    case 'over':
      endAt = performance.now();
      break;
    default:
  }
}

// ---- the heads-up display -------------------------------------------------------------

const shown = { score: -1, lives: -1 };
const powerEls = {};
function updateHud() {
  const sc = Math.floor(game.score);
  if (sc !== shown.score) { shown.score = sc; $('score').textContent = fmt(sc); }
  if (game.lives !== shown.lives) {
    shown.lives = game.lives;
    const n = Math.max(3, game.lives);
    $('lives').innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < game.lives ? '' : 'gone'}"></i>`).join('');
  }
  // A ring for each power-up running, emptying as it runs out.
  const active = { ...game.power, shield: game.shield ? 1 : 0 };
  for (const k in active) {
    const left = active[k];
    let el = powerEls[k];
    if (left <= 0) {
      if (el) { el.remove(); delete powerEls[k]; }
      continue;
    }
    const look = POWER_LOOK[k];
    if (!el) {
      el = document.createElement('div');
      el.className = 'power';
      const c = BAD.includes(k) ? '#ff2d55' : look.colour;
      el.innerHTML = `<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="14" stroke="rgba(255,255,255,.2)"/><circle class="arc" cx="17" cy="17" r="14" stroke="${c}" stroke-dasharray="88" stroke-linecap="round"/></svg><img alt="" src="${capIcon(k)}">`;
      $('powers').appendChild(el);
      el.arc = el.querySelector('.arc');
      powerEls[k] = el;
    }
    const share = k === 'shield' ? 1 : left / POWER_TIME[k];
    el.arc.setAttribute('stroke-dashoffset', String(88 * (1 - share)));
    el.classList.toggle('low', k !== 'shield' && left < 2);
  }
}

// ---- drawing --------------------------------------------------------------------------

function stamp(img, x, y, alpha) {
  if (!img) return;
  const was = g.globalAlpha;
  g.globalAlpha = alpha;
  g.drawImage(img, fx + (x - img.pad) * s, fy + (y - img.pad) * s, img.w * s, img.h * s);
  g.globalAlpha = was;
}

function draw(now, dt) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (back) g.drawImage(back, 0, 0, Wpx, Hpx);
  else g.clearRect(0, 0, Wpx, Hpx);
  if (!game) return;
  const world = WORLDS[level.world % WORLDS.length];
  const intro = (now - startAt) / 1000;
  g.save();
  if (demo) g.globalAlpha = 0.5;
  if (shake > 0) {
    shake = Math.max(0, shake - dt);
    g.translate(Math.sin(now / 14) * shake * 9, Math.cos(now / 11) * shake * 7);
  }
  const X = (x) => fx + x * s, Y = (y) => fy + y * s;
  const keep = g.globalAlpha;

  // The shield: a line of light under the paddle.
  // (No blurred shadows are drawn while playing: they're slow on a phone.
  // Glows are wide faint strokes, or pictures made beforehand.)
  if (game.shield) {
    const pulse = 0.65 + 0.3 * Math.sin(now / 160);
    g.lineCap = 'round';
    for (const [wd, a, col] of [[12, 0.18, '#a78bfa'], [6, 0.35, '#a78bfa'], [2.5, 1, '#efe6ff']]) {
      g.globalAlpha = keep * a * pulse;
      g.strokeStyle = col;
      g.lineWidth = wd;
      g.beginPath();
      g.moveTo(X(2), Y(SHIELD_Y));
      g.lineTo(X(W - 2), Y(SHIELD_Y));
      g.stroke();
    }
    g.globalAlpha = keep;
  }

  // Bricks. At the start of a level they drop into place, row by row.
  for (const b of game.bricks) {
    if (!b.alive) continue;
    const k = ease((intro - b.r * 0.035 - b.c * 0.012) / 0.4);
    if (k <= 0) continue;
    const img = art.brick(b);
    const y = b.y - (1 - k) * 26;
    if (!img) {
      // A hidden brick gives itself away with a glint now and then.
      const tw = (now / 2600 + b.i * 0.37) % 1;
      if (tw < 0.1) {
        g.globalAlpha = keep * Math.sin((tw / 0.1) * Math.PI) * 0.5;
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(X(b.x + BW / 2), Y(b.y + BH / 2), s * 0.7, 0, TAU);
        g.fill();
        g.globalAlpha = keep;
      }
      continue;
    }
    stamp(img, b.x, y, keep * k);
    if (b.flash > 0) {
      g.globalAlpha = keep * Math.min(1, b.flash * 7);
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.roundRect(X(b.x + 0.45), Y(y + 0.4), (BW - 0.9) * s, (BH - 0.8) * s, s);
      g.fill();
      g.globalAlpha = keep;
    }
  }

  // Capsules, rocking as they fall.
  for (const c of game.caps) {
    const img = art.capsule(c.kind);
    g.save();
    g.translate(X(c.x), Y(c.y));
    g.rotate(Math.sin(now / 180 + c.id) * 0.18);
    g.drawImage(img, -img.w * s / 2, -img.h * s / 2, img.w * s, img.h * s);
    g.restore();
  }

  // Laser shots.
  if (game.shots.length) {
    g.lineCap = 'round';
    for (const [wd, a, col] of [[s * 2, 0.35, '#ff2d55'], [Math.max(2, s * 0.7), 1, '#ffe3e8']]) {
      g.globalAlpha = keep * a;
      g.strokeStyle = col;
      g.lineWidth = wd;
      g.beginPath();
      for (const sh of game.shots) { g.moveTo(X(sh.x), Y(sh.y)); g.lineTo(X(sh.x), Y(sh.y + 4)); }
      g.stroke();
    }
    g.globalAlpha = keep;
  }

  // The paddle.
  {
    const p = game.paddle;
    if (kick > 0) kick = Math.max(0, kick - dt * 7);
    const y = PADDLE_Y + kick * 1.1, w = p.w, x = p.x - w / 2;
    const laser = game.power.laser > 0;
    // Its glow: a soft light stretched out under it.
    const halo = art.spark(laser ? '#ff2d55' : world.glow);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = keep * 0.75;
    g.drawImage(halo, X(x - 5), Y(y - 4.5), (w + 10) * s, (PADDLE_H + 9) * s);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = keep;
    g.save();
    const body = g.createLinearGradient(0, Y(y), 0, Y(y + PADDLE_H));
    body.addColorStop(0, '#ffffff');
    body.addColorStop(0.5, laser ? '#ff9aa9' : fade(world.glow, 1));
    body.addColorStop(1, laser ? '#c81e3c' : '#5b6fd6');
    g.fillStyle = body;
    g.beginPath();
    g.roundRect(X(x), Y(y), w * s, PADDLE_H * s, PADDLE_H * s / 2);
    g.fill();
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath();
    g.roundRect(X(x + 2), Y(y + 0.5), (w - 4) * s, s * 0.7, s * 0.35);
    g.fill();
    if (laser) {
      g.fillStyle = '#ffffff';
      for (const sx of [-1, 1]) g.fillRect(X(p.x + sx * (w / 2 - 2)) - s * 0.6, Y(y - 1.6), s * 1.2, s * 1.8);
    }
  }

  // Balls, each with a tail of light.
  const fire = game.power.fire > 0;
  const tail = art.spark(fire ? '#ff9a3c' : '#7fd4ff'), ballImg = art.ball(fire);
  g.globalCompositeOperation = 'lighter';
  const live = new Set();
  for (const b of game.balls) {
    live.add(b.id);
    let tr = trails.get(b.id);
    if (!tr) trails.set(b.id, (tr = []));
    if (!b.stuck) {
      tr.push(b.x, b.y);
      if (tr.length > 28) tr.splice(0, 2);
    } else tr.length = 0;
    for (let k = 0; k < tr.length; k += 2) {
      const a = (k + 2) / tr.length, z = (fire ? 5.5 : 4.2) * a * s;
      g.globalAlpha = keep * a * 0.5;
      g.drawImage(tail, X(tr[k]) - z / 2, Y(tr[k + 1]) - z / 2, z, z);
    }
  }
  for (const id of trails.keys()) if (!live.has(id)) trails.delete(id);
  g.globalAlpha = keep;
  g.globalCompositeOperation = 'source-over';
  for (const b of game.balls) stamp(ballImg, b.x - BALL_R, b.y - BALL_R, keep);

  // Shards, sparks and rings.
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k];
    p.t += dt;
    if (p.t >= p.life) { parts.splice(k, 1); continue; }
    const a = 1 - p.t / p.life;
    if (p.kind === 'ring') {
      g.globalAlpha = keep * a;
      g.strokeStyle = p.colour;
      g.lineWidth = Math.max(1.5, s * 1.2 * a);
      g.beginPath();
      g.arc(X(p.x), Y(p.y), p.size * s * ease(p.t / p.life), 0, TAU);
      g.stroke();
      continue;
    }
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'spark') {
      const img = art.spark(p.colour), z = p.size * s * (0.4 + a);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = keep * a;
      g.drawImage(img, X(p.x) - z / 2, Y(p.y) - z / 2, z, z);
      g.globalCompositeOperation = 'source-over';
    } else {
      p.rot += p.vr * dt;
      g.save();
      g.globalAlpha = keep * a;
      g.translate(X(p.x), Y(p.y));
      g.rotate(p.rot);
      g.fillStyle = p.colour;
      g.fillRect(-p.size * s * 0.9, -p.size * s * 0.45, p.size * s * 1.8, p.size * s * 0.9);
      g.restore();
    }
  }
  g.globalAlpha = keep;

  // Points floating up from where they were won.
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let k = floats.length - 1; k >= 0; k--) {
    const f = floats[k];
    f.t += dt;
    if (f.t > 0.7) { floats.splice(k, 1); continue; }
    g.globalAlpha = keep * (1 - f.t / 0.7);
    g.font = `900 ${Math.round(s * 3.1)}px ui-rounded, system-ui, sans-serif`;
    g.fillStyle = '#ffffff';
    g.fillText(f.text, X(f.x), Y(f.y - f.t * 12));
  }
  g.globalAlpha = keep;

  if (!demo) {
    // A combo, counted out loud.
    const since = (now - comboAt) / 1000;
    if (comboShown >= 3 && since < 1.1 && game.combo > 0) {
      const pop = 1 + Math.max(0, 0.35 - since) * 1.2;
      g.globalAlpha = Math.min(1, (1.1 - since) * 3);
      g.font = `900 ${Math.round(s * 7 * pop)}px ui-rounded, system-ui, sans-serif`;
      g.lineJoin = 'round';
      g.lineWidth = s * 1.4;
      g.strokeStyle = 'rgba(120, 50, 0, 0.6)';
      g.strokeText(`×${comboShown}`, X(W / 2), Y(130));
      g.fillStyle = '#ffd93d';
      g.fillText(`×${comboShown}`, X(W / 2), Y(130));
      g.globalAlpha = 1;
    }
    if (game.state === 'serve' && intro > 0.9 && mode === 'play') {
      // Dots showing which way the ball will set off.
      const a = game.serveAngle(), b0 = game.balls[0];
      g.fillStyle = '#ffffff';
      for (let k = 1; k <= 9; k++) {
        const d = k * 6 + ((now / 60) % 6);
        g.globalAlpha = 0.75 * (1 - k / 10);
        g.beginPath();
        g.arc(X(b0.x + Math.sin(a) * d), Y(b0.y - Math.cos(a) * d), s * 0.55, 0, TAU);
        g.fill();
      }
      g.globalAlpha = 0.75 + 0.25 * Math.sin(now / 280);
      g.font = `900 ${Math.round(s * 5)}px ui-rounded, system-ui, sans-serif`;
      g.fillStyle = '#ffffff';
      g.fillText(touch ? 'Slide to aim, lift to launch' : 'Click or press Space to launch', X(W / 2), Y(165));
      g.globalAlpha = 1;
    }
  }
  g.restore();

  // A flash over everything for the big moments.
  if (flash > 0) {
    flash = Math.max(0, flash - dt);
    g.fillStyle = `rgba(255,255,255,${Math.min(0.5, flash * 1.6)})`;
    g.fillRect(0, 0, Wpx, Hpx);
  }
}

// ---- the loop -------------------------------------------------------------------------

let last = 0, fireworkAt = 0, frames = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const running = mode === 'play' || mode === 'title';
  if (running && game) {
    // The keys slide the paddle.
    if (!demo && (keys.left || keys.right)) targetX = clamp((targetX ?? game.paddle.x) + (keys.right ? 1 : -1) * 190 * dt, 0, W);
    if (slow < 1) slow = Math.min(1, slow + dt * 0.5);
    acc += dt * slow;
    let n = 0;
    const ready = now - startAt > 900;
    while (acc >= STEP && n++ < 10) {
      acc -= STEP;
      const input = demo || auto ? steer(game) : { x: targetX, launch: wantLaunch && ready };
      if (!ready) input.launch = false;
      game.step(input);
      if (input.launch) wantLaunch = false;
    }
    if (n >= 10) acc = 0;
    for (const ev of game.events) onEvent(ev);
    game.events.length = 0;
    if (!demo) updateHud();
    // The end of a level: fireworks, then the card.
    if (endAt) {
      const since = now - endAt;
      if (game.state === 'clear' && now > fireworkAt && since < 1500) {
        fireworkAt = now + 130;
        const x = 12 + Math.random() * (W - 24), y = 30 + Math.random() * 110, c = COLOURS[Math.floor(Math.random() * 8)];
        ring(x, y, c, 20);
        sparks(x, y, c, 22, 120, 0.7);
      }
      if (since > (game.state === 'clear' ? 1700 : 900)) {
        endAt = 0;
        if (demo) begin(1 + Math.floor(Math.random() * Math.min(MADE_COUNT, Math.max(10, save.n))), true);
        else if (game.state === 'clear') showClear();
        else showFail();
      }
    }
  }
  draw(now, running ? dt : 0);
  frames++;
  requestAnimationFrame(frame);
}

// ---- touch, mouse and keys --------------------------------------------------------------

const toField = (clientX) => (clientX - fx) / s;
let finger = null;

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (mode !== 'play' || ui.isOpen()) return;
  finger = e.pointerId;
  targetX = toField(e.clientX);
  try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported */ }
});
canvas.addEventListener('pointermove', (e) => {
  if (mode !== 'play' || ui.isOpen()) return;
  // A mouse steers just by moving; a finger has to be down.
  if (e.pointerType === 'mouse' || finger === e.pointerId) targetX = toField(e.clientX);
});
const lift = (e) => {
  if (finger !== e.pointerId) return;
  finger = null;
  // Lifting the finger (or clicking) sends the ball on its way.
  if (mode === 'play' && game && game.state === 'serve' && !ui.isOpen()) wantLaunch = true;
};
canvas.addEventListener('pointerup', lift);
canvas.addEventListener('pointercancel', () => { finger = null; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (mode === 'play') pause();
    else if (mode === 'paused') resume();
    else setTimeout(() => { if (!ui.isOpen() && mode === 'done') toTitle(); }, 0);
    return;
  }
  if (ui.isOpen()) return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); }
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); }
  else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') {
    e.preventDefault();
    if (mode === 'title') startLevel(save.n);
    else if (mode === 'play' && game.state === 'serve') wantLaunch = true;
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// ---- cards ----------------------------------------------------------------------------

function pause() {
  if (mode !== 'play' || endAt) return;
  mode = 'paused';
  ui.show(`<h2>Paused</h2>
    ${switchRow('Sound', 'sound')}${switchRow('Haptics', 'haptics')}
    <div class="actions">
      <button class="btn btn-primary" data-action="resume">Carry on</button>
      <button class="btn btn-soft" data-action="restart">Start this level again</button>
      <button class="btn btn-soft" data-action="levels">Levels</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
      <button class="btn btn-soft" data-action="home">Home</button>
    </div>`);
}

function resume() {
  ui.close();
  if (mode !== 'paused') return;
  mode = 'play';
  last = performance.now();
  acc = 0;
}

function showSettings() {
  ui.show(`<h2>Settings</h2>
    ${switchRow('Sound', 'sound')}${switchRow('Haptics', 'haptics')}
    <div class="actions">
      <button class="btn btn-primary" data-action="close">Close</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
    </div>`);
}

const capIcons = {};
function capIcon(kind) {
  if (!capIcons[kind]) {
    const big = new Art();
    big.scale(8);
    capIcons[kind] = big.capsule(kind).toDataURL();
  }
  return capIcons[kind];
}

function showRules() {
  const cap = (k, text) => `<img alt="" src="${capIcon(k)}"><span><b>${POWER_LOOK[k].name}:</b> ${text}</span>`;
  ui.show(`<h2>How to play</h2>
    <div class="how">
      <p><b>${touch ? 'Slide your finger' : 'Move the mouse (or use the arrow keys)'}</b> to move the paddle, and <b>${touch ? 'lift it' : 'click or press Space'}</b> to launch the ball. Break every brick to clear the level.</p>
      <p><b>Aim with the paddle:</b> the middle sends the ball straight up, the ends send it out to the side.</p>
      <p><b>Combos:</b> every brick broken before the ball touches the paddle again is worth more than the last.</p>
      <p><b>Stars:</b> three for clearing a level without losing a life, two for losing one.</p>
    </div>
    <div class="caps">
      ${cap('multi', 'every ball becomes three')}
      ${cap('wide', 'a longer paddle')}
      ${cap('laser', 'the paddle shoots')}
      ${cap('fire', 'balls burn straight through')}
      ${cap('slow', 'slower balls')}
      ${cap('shield', 'a floor that saves one ball')}
      ${cap('life', 'one more life')}
      ${cap('shrink', 'a shorter paddle: dodge it')}
      ${cap('fast', 'faster balls: dodge it')}
    </div>
    <div class="actions"><button class="btn btn-primary" data-action="${mode === 'paused' ? 'pauseCard' : 'close'}">Got it</button></div>`);
}

// The level picker: a page for each world of ten.
let page = 0;
function showLevels(p = Math.floor((Math.min(save.n, 999) - 1) / 10)) {
  const pages = Math.max(5, Math.floor((save.n - 1) / 10) + 1);
  page = clamp(p, 0, pages - 1);
  const world = WORLDS[page % WORLDS.length];
  const name = page < 5 ? world.name : `Deep Space ${page - 4}`;
  const cells = Array.from({ length: 10 }, (_, k) => {
    const n = page * 10 + k + 1, st = save.stars[n] || 0, open = n <= save.n;
    return `<button class="lv${n === save.n ? ' next' : ''}" data-action="pick" data-n="${n}" ${open ? '' : 'disabled'}>${n}<u>${[1, 2, 3].map((i) => STAR(i <= st)).join('')}</u></button>`;
  }).join('');
  ui.show(`<h2>Levels</h2>
    <div class="world-head"><button data-action="prevPage" ${page === 0 ? 'disabled' : ''} aria-label="Earlier levels">‹</button>
      <div><b>${name}</b><small>LEVELS ${page * 10 + 1}–${page * 10 + 10}</small></div>
      <button data-action="nextPage" ${page >= pages - 1 ? 'disabled' : ''} aria-label="Later levels">›</button></div>
    <div class="grid">${cells}</div>
    <p class="tip" style="margin-top:12px">★ ${totalStars()} collected</p>
    <div class="actions"><button class="btn btn-soft" data-action="${mode === 'paused' ? 'pauseCard' : mode === 'done' ? 'home' : 'close'}">Back</button></div>`);
}

function showClear() {
  mode = 'done';
  const st = game.stars(), n = level.n, sc = Math.floor(game.score);
  const best = sc > (save.best[n] || 0);
  save.stars[n] = Math.max(save.stars[n] || 0, st);
  if (best) save.best[n] = sc;
  save.n = Math.max(save.n, n + 1);
  writeSave();
  const world = n % 10 === 0 && n <= MADE_COUNT ? `<p class="tip">${WORLDS[level.world].name} complete!${n < MADE_COUNT ? ` Next: ${WORLDS[level.world + 1].name}.` : ' You’ve finished every world. Deep Space goes on for ever.'}</p>` : '';
  ui.show(`<h2>Level ${n} clear!</h2>
    <div class="win-stars">${[1, 2, 3].map((k) => STAR(k <= st)).join('')}</div>
    <div class="stats"><div><b>${fmt(sc)}</b><span>Score</span></div><div><b>×${game.bestCombo}</b><span>Best combo</span></div><div><b>${fmt(save.best[n])}</b><span>${best ? 'New best!' : 'Best'}</span></div></div>
    ${st < 3 ? '<p class="tip">Clear it without losing a life for three stars.</p>' : ''}${world}
    <div class="actions">
      <button class="btn btn-primary" data-action="next">Next level</button>
      <button class="btn btn-soft" data-action="restart">Play again</button>
      <button class="btn btn-soft" data-action="levels">Levels</button>
    </div>`);
  sfx('win');
  confetti();
}

function showFail() {
  mode = 'done';
  const done = Math.round((100 * (game.total - game.left)) / game.total);
  ui.show(`<h2>Out of lives</h2>
    <p>You cleared ${done}% of ${level.name}. Have another go?</p>
    <div class="actions">
      <button class="btn btn-primary" data-action="restart">Try again</button>
      <button class="btn btn-soft" data-action="levels">Levels</button>
      <button class="btn btn-soft" data-action="home">Home</button>
    </div>`);
}

const ui = cards({
  resume,
  pauseCard: () => { mode = 'play'; pause(); },
  restart: () => startLevel(level.n),
  next: () => startLevel(level.n + 1),
  home: toTitle,
  rules: showRules,
  levels: () => showLevels(),
  prevPage: () => showLevels(page - 1),
  nextPage: () => showLevels(page + 1),
  pick: (el) => { const n = Number(el.dataset.n); if (n >= 1 && n <= save.n) startLevel(n); },
});

$('pauseBtn').addEventListener('click', () => { sfx('tap'); pause(); });
$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });
$('playBtn').addEventListener('click', () => { sfx('tap'); startLevel(save.n); });
$('levelsBtn').addEventListener('click', () => { sfx('tap'); showLevels(); });

// ---- start ----------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', layout);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.prism = { get frames() { return frames; }, get game() { return game; }, get mode() { return mode; }, startLevel, save, set auto(v) { auto = v; } };
}

toTitle();
layout();
if (!save.seen) {
  save.seen = true;
  writeSave();
  showRules();
}
requestAnimationFrame((t) => { last = t; frame(t); });
