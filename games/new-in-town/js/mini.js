// New in Town: the games you play at work. One for every career, each a
// minute at most: a shift done by hand instead of left to look after
// itself. playMini puts one on screen and reports a score from 0 to 1,
// which the rules (engine.js, workPlay) turn into pay and standing.
//
// level (0 to 5) is how far up the ladder you are: the job gets harder.
// ease (0 to 1) is how good you are at the skill the career runs on: it
// gives you a little more room. The puzzles themselves are made in
// minilogic.js.

import { sfx, haptic } from '../../../shared/arcade.js';
import { face } from './art.js';
import { grade, GRADE_WORD, pipes, flow, turn, sweep, dig, sale, COINS, lineup, smallPrint, sum, tune, ticker } from './minilogic.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const dollars = (c) => `$${(c / 100).toFixed(2)}`;
const press = (node, fn) => node.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });

// Each game: how (what to do, in a line), time (seconds), and play, which
// builds the game on api.stage and returns { score, auto }: score is how it
// stands if the clock runs out now; auto plays it perfectly (for testing).
export const GAMES = {
  // ---- kitchens: four pans, each ready for a moment ----
  pans: {
    how: 'Tap each pan when its ring reaches the green. Too soon is raw; too late is burnt.', time: 24, fixed: true,
    play(api) {
      const lo = 0.63 - api.ease * 0.07, hi = 0.8 + api.ease * 0.07, pans = [];
      let good = 0, bad = 0;
      const grid = el('div', 'mg-pans');
      api.stage.append(grid);
      for (let i = 0; i < 4; i++) {
        const b = el('button', 'mg-pan', `<span class="mg-zone" style="--lo:${lo};--hi:${hi}"></span><span class="mg-ring"></span><i></i>`);
        const pan = { b, p: 0, d: 1, wait: 0.2 + i * 0.6, on: false };
        pan.serve = (ok, cls) => { pan.on = false; pan.wait = 0.55; b.classList.add(cls); if (ok) { good++; sfx('pop'); } else { bad++; sfx('nope'); } };
        press(b, () => { if (pan.on) pan.serve(pan.p >= lo && pan.p <= hi, pan.p < lo ? 'raw' : pan.p > hi ? 'burnt' : 'done'); });
        pans.push(pan); grid.append(b);
      }
      api.frame((dt) => {
        for (const pan of pans) {
          if (!pan.on) {
            pan.wait -= dt;
            if (pan.wait > 0) continue;
            pan.p = 0; pan.d = (2.4 + api.rnd() * 2) * (1 - api.level * 0.07); pan.on = true;
            pan.b.className = 'mg-pan'; pan.b.querySelector('i').textContent = ['🥘', '🍳', '🥩', '🍲', '🐟', '🥞'][Math.floor(api.rnd() * 6)];
          }
          pan.p += dt / pan.d;
          pan.b.style.setProperty('--p', Math.min(1, pan.p));
          if (pan.p >= 1.08) pan.serve(false, 'burnt');
        }
      });
      return { score: () => clamp(good / Math.max(12, good + bad), 0, 1), auto: () => { for (const pan of pans) if (pan.on && pan.p >= lo && pan.p <= hi) pan.serve(true, 'done'); } };
    },
  },

  // ---- retail: give the right change ----
  till: {
    how: 'Count out the change: tap coins and notes until it is right, then hand it over.', time: 34,
    play(api) {
      const want = 5 + Math.min(3, api.level);
      let right = 0, wrong = 0, cur = null, hand = 0;
      const box = el('div', 'mg-till');
      api.stage.append(box);
      const draw = () => {
        box.innerHTML = `<div class="mg-slip"><p><span>Sale</span><b>${dollars(cur.price)}</b></p><p><span>Customer gives</span><b>${dollars(cur.paid)}</b></p><p class="due"><span>Change due</span><b>${api.level < 2 || api.ease > 0.75 ? dollars(cur.due) : '?'}</b></p></div>
          <p class="mg-hand">In your hand: <b>${dollars(hand)}</b></p>
          <div class="mg-coins">${COINS.map((c) => `<button data-c="${c}" class="${c >= 500 ? 'note' : ''}">${c >= 100 ? `$${c / 100}` : `${c}c`}</button>`).join('')}</div>
          <div class="mg-row"><button class="mg-soft" data-c="0">Start again</button><button class="mg-go" data-c="give">Hand it over</button></div>
          <p class="mg-tally">${right} of ${want} customers served</p>`;
      };
      const next = () => { cur = sale(api.level, api.rnd); hand = 0; draw(); };
      const give = () => { if (hand === cur.due) { right++; sfx('coin'); } else { wrong++; sfx('nope'); haptic(); } if (right >= want) api.finish(score(true)); else next(); };
      const score = (done) => clamp((right - wrong * 0.5) / want, 0, 1) * (done ? 1 : 0.9);
      press(box, (e) => { const b = e.target.closest('[data-c]'); if (!b) return; if (b.dataset.c === 'give') return give(); hand = b.dataset.c === '0' ? 0 : hand + Number(b.dataset.c); sfx('tap'); draw(); });
      next();
      return { score: () => score(false), auto: () => { hand = cur.due; give(); } };
    },
  },

  // ---- building: turn the pipes until the water runs through ----
  pipes: {
    how: 'Tap a pipe to turn it. Join the tap at the top left to the bath at the bottom right.', time: 46,
    play(api) {
      const p = pipes(api.level >= 4 ? 5 : 4, api.rnd);
      const grid = el('div', 'mg-pipes');
      grid.style.setProperty('--n', p.n);
      const wrap = el('div', 'mg-pipewrap', '<span class="in">🚰</span><span class="out">🛁</span>');
      wrap.style.setProperty('--n', p.n);
      wrap.append(grid);
      api.stage.append(wrap);
      const tile = (m, wet) => `<svg viewBox="0 0 40 40"><g stroke="${wet ? '#2aa7b8' : '#b9b09a'}" stroke-width="10" stroke-linecap="round">${[[1, 20, 0], [2, 40, 20], [4, 20, 40], [8, 0, 20]].filter(([s]) => m & s).map(([, x, y]) => `<line x1="20" y1="20" x2="${x}" y2="${y}"/>`).join('')}</g></svg>`;
      let wet = flow(p);
      const draw = () => { wet = flow(p); grid.innerHTML = p.tiles.map((m, i) => `<button data-i="${i}" class="${wet.wet.has(i) ? 'wet' : ''}">${tile(m, wet.wet.has(i))}</button>`).join(''); };
      const check = () => { draw(); if (wet.done) { sfx('pour'); api.finish(0.62 + 0.38 * api.left() / api.total); } };
      press(grid, (e) => { const b = e.target.closest('[data-i]'); if (!b) return; const i = Number(b.dataset.i); p.tiles[i] = turn(p.tiles[i]); sfx('tap'); check(); });
      draw();
      return { score: () => clamp(wet.wet.size / p.path, 0, 1) * 0.5, auto: () => { p.tiles = p.answer.slice(); check(); } };
    },
  },

  // ---- tech: find every square with no bug in it ----
  sweep: {
    how: 'Open every square that has no bug in it. A number says how many bugs touch that square. You can afford two mistakes, not three.', time: 50,
    play(api) {
      const n = 6, bugs = Math.min(9, 5 + api.level), open = new Set(), found = new Set();
      let board = null, over = false, lives = 3;
      const grid = el('div', 'mg-sweep'), tally = el('p', 'mg-tally');
      api.stage.append(grid, tally);
      const draw = () => {
        grid.innerHTML = Array.from({ length: n * n }, (_, i) => { const o = open.has(i), bug = found.has(i) || (over && board && board.bug[i]); return `<button data-i="${i}" class="${o ? `open c${board.count[i]}` : ''}${bug ? ' bug' : ''}">${bug ? '🐛' : o && board.count[i] ? board.count[i] : ''}</button>`; }).join('');
        tally.textContent = `${'❤️'.repeat(lives)} · ${board ? board.safe - open.size : n * n - bugs} to clear`;
      };
      const score = () => (board ? open.size / board.safe * 0.5 : 0);
      const tap = (i) => {
        if (over || open.has(i) || found.has(i)) return;
        if (!board) board = sweep(n, bugs, i, api.rnd);
        if (dig(board, open, i)) { found.add(i); lives--; sfx('wrong'); haptic(); if (lives <= 0) { over = true; draw(); api.finish(score()); return; } draw(); return; }
        sfx('tap');
        if (open.size >= board.safe) { over = true; draw(); api.finish(clamp(0.7 + 0.3 * api.left() / api.total - found.size * 0.2, 0.4, 1)); return; }
        draw();
      };
      press(grid, (e) => { const b = e.target.closest('[data-i]'); if (b) tap(Number(b.dataset.i)); });
      draw();
      return { score, auto: () => { if (!board) tap(0); for (let i = 0; i < n * n && !over; i++) if (!board.bug[i]) tap(i); } };
    },
  },

  // ---- medicine: follow the line without straying ----
  steady: {
    how: 'Put a finger on the dot and follow the line up to the ring. If you stray off it, go back to the dot and carry on.', time: 22,
    play(api) {
      const W = 300, H = 400, pts = [], r = clamp(18 + api.ease * 7 - api.level * 1.6, 10, 27);
      const a = 46 + api.level * 5, k1 = 0.012 + api.rnd() * 0.01, k2 = 0.03 + api.rnd() * 0.012, f1 = api.rnd() * 6, f2 = api.rnd() * 6;
      // (From the bottom upwards, so that the finger never hides the way ahead.)
      for (let y = H - 26; y >= 26; y -= 3) { const ramp = Math.min(1, (H - 26 - y) / 60); pts.push([W / 2 + a * Math.sin(y * k1 * 3 + f1) * ramp + 22 * Math.sin(y * k2 * 2 + f2) * ramp, y]); }
      const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y}`).join(' ');
      const wrap = el('div', 'mg-steady', `<svg viewBox="0 0 ${W} ${H}"><path d="${d}" class="tube" stroke-width="${r * 2}"/><path d="${d}" class="line"/><path d="${d}" class="done" pathLength="1" stroke-dasharray="0 1"/><circle class="end" r="9" cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}"/><circle class="dot" r="13" cx="${pts[0][0]}" cy="${pts[0][1]}"/></svg><p class="mg-tally"></p>`);
      api.stage.append(wrap);
      const svg = wrap.querySelector('svg'), done = wrap.querySelector('.done'), dot = wrap.querySelector('.dot'), tally = wrap.querySelector('.mg-tally');
      let at = 0, slips = 0, held = null, ended = false;
      const show = () => { done.setAttribute('stroke-dasharray', `${at / (pts.length - 1)} 1`); dot.setAttribute('cx', pts[at][0]); dot.setAttribute('cy', pts[at][1]); tally.textContent = slips ? `${slips} slip${slips > 1 ? 's' : ''}` : 'Steady…'; };
      // Where a finger is, in the drawing's own measure, however the drawing has been fitted to the screen.
      const where = (e) => { const m = svg.getScreenCTM(); if (!m) return [-99, -99]; const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return [q.x, q.y]; };
      const finish = () => { ended = true; api.finish(Math.max(0.3, clamp(1 - slips * 0.17, 0, 1) * (0.78 + 0.22 * api.left() / api.total))); };
      const drop = (e) => { if (e.pointerId === held) { held = null; svg.classList.remove('held'); } };
      svg.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (held != null || ended) return;
        const [x, y] = where(e);
        if (Math.hypot(x - pts[at][0], y - pts[at][1]) > r + 18) return;
        held = e.pointerId; svg.classList.add('held');
        if (svg.setPointerCapture) try { svg.setPointerCapture(e.pointerId); } catch { /* not every browser will */ }
      });
      svg.addEventListener('pointermove', (e) => {
        if (e.pointerId !== held || ended) return;
        e.preventDefault();
        const [x, y] = where(e);
        let best = -1, bd = 1e9;
        for (let i = Math.max(0, at - 6); i <= Math.min(pts.length - 1, at + 26); i++) { const q = Math.hypot(x - pts[i][0], y - pts[i][1]); if (q < bd) { bd = q; best = i; } }
        if (bd > r) { held = null; slips++; svg.classList.remove('held'); svg.classList.add('slip'); api.after(260, () => svg.classList.remove('slip')); sfx('nope'); haptic(); show(); return; }
        // (Near enough to the ring at the end is the end.)
        if (best > at) { at = best; show(); if (at >= pts.length - 4) { at = pts.length - 1; show(); finish(); } }
      });
      svg.addEventListener('pointerup', drop); svg.addEventListener('pointercancel', drop);
      show();
      return { score: () => at / (pts.length - 1) * 0.5 * clamp(1 - slips * 0.1, 0, 1), auto: () => { at = pts.length - 1; show(); finish(); } };
    },
  },

  // ---- police: pick the one the witness described ----
  lineup: {
    how: 'Read the witness’s description and tap the face it fits. Only one fits.', time: 30,
    play(api) {
      const want = 5;
      let right = 0, wrong = 0, cur = null;
      const box = el('div', 'mg-lineup');
      api.stage.append(box);
      const next = () => { cur = lineup(api.level, api.rnd); box.innerHTML = `<p class="mg-says">“${cur.says}”</p><div class="mg-faces">${cur.faces.map((f, i) => `<button data-i="${i}">${face({ skin: f.skin, hair: f.hair, top: f.top, style: f.style, beard: f.beard }, 30, 50, f.sex)}</button>`).join('')}</div><p class="mg-tally">${right} of ${want} picked out</p>`; };
      const tap = (i) => { if (i === cur.who) { right++; sfx('pop'); } else { wrong++; sfx('nope'); haptic(); } if (right + wrong >= want) api.finish(clamp((right - wrong * 0.5) / want, 0, 1)); else next(); };
      press(box, (e) => { const b = e.target.closest('[data-i]'); if (b) tap(Number(b.dataset.i)); });
      next();
      return { score: () => clamp((right - wrong * 0.5) / want, 0, 1) * 0.9, auto: () => tap(cur.who) };
    },
  },

  // ---- law: find the clause that has been changed ----
  print: {
    how: 'The copy differs from what was agreed in one clause. Tap the clause that has been changed.', time: 36,
    play(api) {
      const want = 5;
      let right = 0, wrong = 0, cur = null;
      const box = el('div', 'mg-print');
      api.stage.append(box);
      const next = () => { cur = smallPrint(api.level, api.rnd); box.innerHTML = `${cur.rows.map((r, i) => `<button data-i="${i}"><small>Agreed</small><span>${r.was}</span><small>Copy</small><span>${r.now}</span></button>`).join('')}<p class="mg-tally">${right} of ${want} found</p>`; box.scrollTop = 0; };
      const tap = (i) => { if (i === cur.odd) { right++; sfx('pop'); } else { wrong++; sfx('nope'); haptic(); } if (right + wrong >= want) api.finish(clamp((right - wrong * 0.5) / want, 0, 1)); else next(); };
      box.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) tap(Number(b.dataset.i)); });
      next();
      return { score: () => clamp((right - wrong * 0.5) / want, 0, 1) * 0.9, auto: () => tap(cur.odd) };
    },
  },

  // ---- music: play the notes as they reach the line ----
  tune: {
    how: 'Tap each pad as its note reaches the line.', time: 21, fixed: true,
    play(api) {
      const notes = tune(api.level, api.rnd).map((n) => ({ ...n, hit: false, gone: false, node: null }));
      const fall = 1.7 - api.level * 0.1, win = 0.13 + api.ease * 0.05, LINE = 84;
      let hits = 0, stray = 0, now = 0;
      const box = el('div', 'mg-tune', `<div class="mg-lanes">${[0, 1, 2, 3].map((i) => `<div class="mg-lane l${i}"></div>`).join('')}<span class="mg-line" style="top:${LINE}%"></span></div><div class="mg-pads">${[0, 1, 2, 3].map((i) => `<button class="l${i}" data-l="${i}"></button>`).join('')}</div><p class="mg-tally"></p>`);
      api.stage.append(box);
      const lanes = [...box.querySelectorAll('.mg-lane')], tally = box.querySelector('.mg-tally');
      const play = (lane) => {
        const n = notes.find((q) => !q.hit && !q.gone && q.lane === lane && Math.abs(q.t - now) <= win);
        const pad = box.querySelector(`.mg-pads .l${lane}`);
        pad.classList.remove('hit', 'off'); void pad.offsetWidth;
        if (n) { n.hit = true; hits++; if (n.node) n.node.remove(); pad.classList.add('hit'); sfx('tap', lane); } else { stray++; pad.classList.add('off'); }
      };
      press(box.querySelector('.mg-pads'), (e) => { const b = e.target.closest('[data-l]'); if (b) play(Number(b.dataset.l)); });
      const score = () => clamp((hits - stray * 0.3) / notes.length, 0, 1);
      api.frame((dt) => {
        now += dt;
        for (const n of notes) {
          if (n.hit || n.gone) continue;
          const y = LINE - (n.t - now) / fall * LINE;
          if (y < -6) continue;
          if (!n.node) { n.node = el('i', 'mg-note'); lanes[n.lane].append(n.node); }
          n.node.style.top = `${y}%`;
          if (now > n.t + win) { n.gone = true; n.node.classList.add('lost'); api.after(250, () => n.node.remove()); }
        }
        tally.textContent = `${hits} of ${notes.length}`;
        if (now > notes[notes.length - 1].t + 0.6) api.finish(score());
      });
      return { score, auto: () => { for (const n of notes) if (!n.hit && !n.gone && Math.abs(n.t - now) <= win) play(n.lane); } };
    },
  },

  // ---- sport: left, right, left, right ----
  sprint: {
    how: 'Tap left, right, left, right as fast as you can. The same foot twice and you stumble.', time: 20, fixed: true,
    play(api) {
      const step = 1.3 + api.ease * 0.5, rivals = [6.2, 7.3, 8.4].map((v) => ({ v: v + api.level * 0.4 + (api.rnd() - 0.5) * 0.5, x: 0 }));
      let x = 0, last = '', stun = 0, wait = 1.6, ended = false, t = 0;
      const box = el('div', 'mg-sprint', `<div class="mg-track">${['You', 'Ox', 'Finch', 'Mabel'].map((n, i) => `<div class="mg-run${i ? '' : ' mine'}"><small>${n}</small><i>🏃</i></div>`).join('')}<span class="mg-tape"></span></div><p class="mg-count">Ready…</p><div class="mg-feet"><button data-f="L">Left</button><button data-f="R">Right</button></div>`);
      api.stage.append(box);
      const runners = [...box.querySelectorAll('.mg-run i')], count = box.querySelector('.mg-count');
      const place = () => 1 + rivals.filter((r) => r.x >= 100 || r.x > x).length;
      const finish = () => { if (ended) return; ended = true; const p = 1 + rivals.filter((r) => r.x >= 100 && r.done < t).length; count.textContent = ['First!', 'Second', 'Third', 'Last'][p - 1]; api.finish([1, 0.72, 0.45, 0.2][p - 1]); };
      press(box.querySelector('.mg-feet'), (e) => {
        const b = e.target.closest('[data-f]');
        if (!b || wait > 0 || ended || stun > 0) return;
        if (b.dataset.f === last) { stun = 0.35; last = ''; sfx('nope'); haptic(); box.classList.add('trip'); api.after(350, () => box.classList.remove('trip')); return; }
        last = b.dataset.f; x += step; sfx('tap');
        if (x >= 100) finish();
      });
      api.frame((dt) => {
        if (wait > 0) { wait -= dt; count.textContent = wait > 0.7 ? 'Ready…' : 'Set…'; if (wait > 0) return; count.textContent = 'Go!'; sfx('hint'); }
        if (ended) return;
        t += dt; stun = Math.max(0, stun - dt);
        for (const r of rivals) { if (r.x < 100) { r.x += r.v * dt * (0.9 + api.rnd() * 0.2); if (r.x >= 100) r.done = t; } }
        runners[0].style.left = `${Math.min(100, x) * 0.86}%`;
        rivals.forEach((r, i) => { runners[i + 1].style.left = `${Math.min(100, r.x) * 0.86}%`; });
        if (t > 0.6) count.textContent = `${Math.round(Math.min(100, x))} m · ${['1st', '2nd', '3rd', '4th'][place() - 1]}`;
      });
      return { score: () => (x >= 100 ? 1 : [0.5, 0.4, 0.3, 0.1][place() - 1] * Math.min(1, x / 60)), auto: () => { wait = 0; x = 100; for (const r of rivals) r.x = Math.min(r.x, 90); finish(); } };
    },
  },

  // ---- teaching: tick or cross ----
  marking: {
    how: 'Mark the sums: tick the ones that are right, cross the ones that are wrong.', time: 24,
    play(api) {
      const want = 10;
      let right = 0, wrong = 0, cur = null;
      const box = el('div', 'mg-marking', '<p class="mg-sum"></p><div class="mg-row"><button class="tick" data-a="1">✓</button><button class="cross" data-a="0">✗</button></div><p class="mg-tally"></p>');
      api.stage.append(box);
      const next = () => { cur = sum(api.level, api.rnd); box.querySelector('.mg-sum').textContent = cur.text; box.querySelector('.mg-tally').textContent = `${right + wrong} of ${want} marked`; };
      const mark = (yes) => { if (yes === cur.right) { right++; sfx('tap'); } else { wrong++; sfx('nope'); haptic(); box.classList.add('oops'); api.after(200, () => box.classList.remove('oops')); } if (right + wrong >= want) api.finish(clamp((right - wrong * 0.6) / want, 0, 1)); else next(); };
      press(box.querySelector('.mg-row'), (e) => { const b = e.target.closest('[data-a]'); if (b) mark(b.dataset.a === '1'); });
      next();
      return { score: () => clamp((right - wrong * 0.6) / want, 0, 1), auto: () => mark(cur.right) };
    },
  },

  // ---- the sea: bring her in between the rocks ----
  channel: {
    how: 'Slide a finger left and right to steer. Bring the boat in without touching the rocks.', time: 22, fixed: true,
    play(api) {
      const rocks = [], speed = 36 + api.level * 5, gap = 0.72 - api.level * 0.06, reach = 36 - api.ease * 9;
      let bx = 50, hull = 3, spawn = 0.4, safe = false, ended = false;
      const sea = el('div', 'mg-channel', '<i class="mg-boat">⛵</i><p class="mg-hull"></p>');
      api.stage.append(sea);
      const boat = sea.querySelector('.mg-boat'), hullEl = sea.querySelector('.mg-hull');
      const steer = (e) => { e.preventDefault(); const b = sea.getBoundingClientRect(); bx = clamp((e.clientX - b.left) / b.width * 100, 6, 94); };
      sea.addEventListener('pointerdown', steer); sea.addEventListener('pointermove', steer);
      const score = () => (1 - api.left() / api.total) * (hull <= 0 ? 0.25 : [0, 0.5, 0.75, 1][hull]);
      api.frame((dt) => {
        if (ended) return;
        spawn -= dt;
        if (spawn <= 0) { spawn = gap * (0.7 + api.rnd() * 0.6); const node = el('i', 'mg-rock', '🪨'); const r = { x: 6 + api.rnd() * 88, y: -8, node }; node.style.left = `${r.x}%`; sea.append(node); rocks.push(r); }
        // (Measured in the width of a finger, not as a share of the screen, so that a tall phone is no harder.)
        const wide = sea.clientWidth / 100, tall = sea.clientHeight / 100;
        for (const r of rocks) {
          r.y += speed * dt; r.node.style.top = `${r.y}%`;
          if (!r.hit && Math.abs(r.y - 85) * tall < 30 && Math.abs(r.x - bx) * wide < reach) {
            r.hit = true; r.node.remove();
            if (!safe) { hull--; sfx('bump'); haptic(); sea.classList.add('hit'); api.after(240, () => sea.classList.remove('hit')); if (hull <= 0) { ended = true; api.finish(score()); } }
          }
          if (r.y > 108 && !r.hit) { r.hit = true; r.node.remove(); }
        }
        boat.style.left = `${bx}%`;
        hullEl.textContent = '❤️'.repeat(Math.max(0, hull));
      });
      return { score, auto: () => { safe = true; } };
    },
  },

  // ---- finance: buy low, sell high ----
  floor: {
    how: 'One button: buy when the price is low, sell when it is high. You start with $1,000, and are marked on what you end with.', time: 20, fixed: true,
    play(api) {
      const N = 200, p = ticker(N, api.rnd), marks = [];
      let lo = p[0] - 8, hi = p[0] + 8;
      const need = clamp(0.3 + api.level * 0.03 - api.ease * 0.08, 0.16, 0.5);
      let cash = 1000, shares = 0, i = 0, t = 0;
      const box = el('div', 'mg-floor', '<svg viewBox="0 0 300 180" preserveAspectRatio="none"><polyline class="price" points=""/><g class="marks"></g></svg><p class="mg-worth"></p><button class="mg-go"></button>');
      api.stage.append(box);
      const line = box.querySelector('.price'), g = box.querySelector('.marks'), worth = box.querySelector('.mg-worth'), btn = box.querySelector('.mg-go');
      const X = (k) => k / (N - 1) * 300, Y = (v) => 170 - (v - lo) / (hi - lo) * 160;
      const value = () => cash + shares * p[i];
      const score = () => { const m = value() / 1000; return marks.length ? clamp(m >= 1 ? 0.3 + (m - 1) / need * 0.7 : 0.3 + (m - 1) / 0.2 * 0.3, 0, 1) : 0.2; };
      const trade = () => { if (shares) { cash = shares * p[i]; shares = 0; marks.push([i, 'sell']); sfx('coin'); } else { shares = cash / p[i]; cash = 0; marks.push([i, 'buy']); sfx('tap'); } draw(); };
      const draw = () => {
        lo = Math.min(lo, p[i] - 3); hi = Math.max(hi, p[i] + 3);
        line.setAttribute('points', p.slice(0, i + 1).map((v, k) => `${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(' '));
        g.innerHTML = marks.map(([k, w]) => `<circle class="${w}" r="5" cx="${X(k)}" cy="${Y(p[k])}"/>`).join('');
        worth.innerHTML = `Price <b>$${p[i].toFixed(2)}</b> · You have <b>$${Math.round(value()).toLocaleString('en')}</b>${shares ? ' in shares' : ' in cash'}`;
        btn.textContent = shares ? 'Sell' : 'Buy'; btn.className = `mg-go ${shares ? 'sell' : 'buy'}`;
      };
      press(btn, trade);
      api.frame((dt) => { t += dt; const k = Math.min(N - 1, Math.floor(t / api.total * N)); if (k !== i) { i = k; draw(); } });
      draw();
      return { score, auto: () => { cash = 1000 * (1 + need * 1.2); shares = 0; if (!marks.length) marks.push([i, 'sell']); draw(); } };
    },
  },

  // ---- politics: shake every hand, mind the tomatoes ----
  room: {
    how: 'Shake every hand that is held out. Do not touch the tomatoes.', time: 20, fixed: true,
    play(api) {
      const cells = [], stay = 1.05 - api.level * 0.07 + api.ease * 0.25, gap = 0.58 - api.level * 0.04;
      let shaken = 0, splats = 0, hands = 0, spawn = 0.3;
      const grid = el('div', 'mg-room');
      api.stage.append(grid, el('p', 'mg-tally'));
      const tally = api.stage.querySelector('.mg-tally');
      for (let i = 0; i < 9; i++) { const b = el('button'); const c = { b, what: '', left: 0 }; press(b, () => { if (!c.what) return; if (c.what === '🤝') { shaken++; sfx('pop'); b.className = 'yes'; } else { splats++; sfx('nope'); haptic(); b.className = 'no'; } c.what = ''; c.left = 0.25; }); cells.push(c); grid.append(b); }
      api.frame((dt) => {
        spawn -= dt;
        if (spawn <= 0) { spawn = gap * (0.7 + api.rnd() * 0.6); const free = cells.filter((c) => !c.what && c.left <= 0); if (free.length) { const c = free[Math.floor(api.rnd() * free.length)]; c.what = api.rnd() < 0.78 ? '🤝' : '🍅'; c.left = stay; if (c.what === '🤝') hands++; c.b.className = 'up'; c.b.textContent = c.what; } }
        for (const c of cells) { if (c.left > 0) { c.left -= dt; if (c.left <= 0) { c.what = ''; c.b.className = ''; c.b.textContent = ''; } } }
        tally.textContent = `${shaken} hands shaken${splats ? ` · ${splats} tomato${splats > 1 ? 'es' : ''}` : ''}`;
      });
      return { score: () => clamp((shaken - splats * 1.5) / Math.max(14, hands), 0, 1), auto: () => { for (const c of cells) if (c.what === '🤝') { shaken++; c.what = ''; c.left = 0.1; } } };
    },
  },

  // ---- Sal's crew: feel for the numbers ----
  safe: {
    how: 'Turn the dial, or use the arrows. The lights show how near you are: when all five are lit, try the handle. A wrong try costs three seconds. Three numbers open it.', time: 36,
    play(api) {
      const N = 40, combo = Array.from({ length: 3 }, () => Math.floor(api.rnd() * N)), far = clamp(11 - api.level + Math.round(api.ease * 3), 5, 14);
      let at = Math.floor(api.rnd() * N), found = 0, grab = null, ended = false;
      const box = el('div', 'mg-safe', '<div class="mg-dial"><b></b><span></span></div><div class="mg-pips"></div><div class="mg-row"><button class="mg-soft" data-d="-1">◀</button><button class="mg-go" data-d="0">Try the handle</button><button class="mg-soft" data-d="1">▶</button></div><p class="mg-tally"></p>');
      api.stage.append(box);
      const dial = box.querySelector('.mg-dial'), num = dial.querySelector('b'), hand = dial.querySelector('span'), pips = box.querySelector('.mg-pips'), tally = box.querySelector('.mg-tally');
      const gapTo = () => { const d = Math.abs(at - combo[found]); return Math.min(d, N - d); };
      const lit = () => { const d = gapTo(); return d === 0 ? 5 : d <= 1 ? 4 : d <= Math.ceil(far * 0.3) ? 3 : d <= Math.ceil(far * 0.6) ? 2 : d <= far ? 1 : 0; };
      let was = -1;
      const draw = () => { num.textContent = at; hand.style.transform = `rotate(${at / N * 360}deg)`; const n = lit(); pips.innerHTML = [0, 1, 2, 3, 4].map((i) => `<i class="${i < n ? 'on' : ''}"></i>`).join(''); tally.textContent = `${'🔓'.repeat(found)}${'🔒'.repeat(3 - found)}`; if (n === 5 && was !== 5) haptic(); was = n; };
      const move = (d) => { if (ended) return; at = (at + d + N) % N; sfx('tap'); draw(); };
      const tryIt = () => { if (ended) return; if (gapTo() === 0) { found++; sfx('pop'); if (found >= 3) { ended = true; draw(); api.finish(0.7 + 0.3 * api.left() / api.total); return; } } else { sfx('nope'); haptic(); api.lose(3); box.classList.add('oops'); api.after(220, () => box.classList.remove('oops')); } draw(); };
      press(box.querySelector('.mg-row'), (e) => { const b = e.target.closest('[data-d]'); if (!b) return; const d = Number(b.dataset.d); if (d) move(d); else tryIt(); });
      // The dial follows a finger round its middle: nine degrees to a number.
      const angle = (e) => { const b = dial.getBoundingClientRect(); return Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180 / Math.PI; };
      dial.addEventListener('pointerdown', (e) => { e.preventDefault(); if (grab) return; grab = { id: e.pointerId, a: angle(e), sum: 0 }; if (dial.setPointerCapture) try { dial.setPointerCapture(e.pointerId); } catch { /* not every browser will */ } });
      dial.addEventListener('pointermove', (e) => {
        if (!grab || e.pointerId !== grab.id) return;
        e.preventDefault();
        const now = angle(e);
        let d = now - grab.a;
        if (d > 180) d -= 360; else if (d < -180) d += 360;
        grab.a = now; grab.sum += d;
        const steps = Math.trunc(grab.sum / 9);
        if (steps) { grab.sum -= steps * 9; for (let i = 0; i < Math.abs(steps); i++) move(Math.sign(steps)); }
      });
      for (const ev of ['pointerup', 'pointercancel']) dial.addEventListener(ev, (e) => { if (grab && e.pointerId === grab.id) grab = null; });
      draw();
      return { score: () => found / 3 * 0.6, auto: () => { at = combo[found]; draw(); tryIt(); } };
    },
  },
};

// ---- putting one on screen ----------------------------------------------------------------

let live = null;

// Plays a game. o: { id, title, icon, level, ease, skill }. done(score) is called once it is
// over, or done(null) if it was backed out of before it began.
export function playMini(o, done) {
  const def = GAMES[o.id], root = $('mini'), stage = $('miniStage'), bar = $('miniClock'), quitBtn = $('miniQuitBtn');
  if (!def || live) return;
  const timers = [];
  const ease = clamp(o.ease || 0, 0, 1);
  // Where time is what you are short of, skill buys a little more of it.
  const total = def.time * (def.fixed ? 1 : 1 + 0.3 * ease);
  let raf = 0, over = false, left = total, game = null, clock = 0, sure = 0;
  const stop = () => { over = true; cancelAnimationFrame(raf); clearInterval(clock); for (const t of timers) { clearTimeout(t); clearInterval(t); } };
  // (The game stays up a moment after it has reported, so that a last tap cannot land on what is underneath.)
  const close = (q) => { done(q); setTimeout(() => { root.hidden = true; root.classList.remove('done'); stage.innerHTML = ''; live = null; window.__mini = null; }, 420); };
  const api = {
    stage, level: clamp(o.level || 0, 0, 5), ease, rnd: Math.random, total,
    left: () => Math.max(0, left),
    lose(n) { left -= n; },
    after(ms, fn) { timers.push(setTimeout(() => { if (!over) fn(); }, ms)); },
    frame(fn) { let last = performance.now(); const tick = (t) => { if (over) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; fn(dt); raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); },
    finish(score) {
      if (over) return;
      stop();
      const q = clamp(score, 0, 1), g = grade(q);
      sfx(g >= 2 ? 'win' : g ? 'chime' : 'lose');
      root.classList.add('done');
      const banner = el('div', 'mini-end', `<i>${'<b>★</b>'.repeat(g)}${'<s>★</s>'.repeat(3 - g)}</i><b>${GRADE_WORD[g]}</b>`);
      root.append(banner);
      setTimeout(() => { banner.remove(); close(q); }, 1150);
    },
  };
  live = {
    // Giving up before it has begun is no shift at all. After that it is asked twice, and the
    // shift is marked on what was done, and on how much of it was done.
    quit(force) {
      if (over) return;
      if (force || !game) { stop(); root.classList.add('done'); if (force) { root.hidden = true; root.classList.remove('done'); stage.innerHTML = ''; live = null; window.__mini = null; return; } close(null); return; }
      if (performance.now() > sure) { sure = performance.now() + 2500; quitBtn.textContent = 'Sure?'; setTimeout(() => { quitBtn.textContent = 'Give up'; }, 2500); return; }
      api.finish(game.score() * Math.min(0.8, (total - left) / total));
    },
  };
  $('miniIco').textContent = o.icon || '🎮';
  $('miniTitle').textContent = o.title || '';
  quitBtn.textContent = 'Give up';
  bar.style.width = '100%';
  root.hidden = false;
  stage.className = 'mini-stage';
  const skill = o.skill || 'skill';
  stage.innerHTML = `<div class="mini-intro"><i>${o.icon || '🎮'}</i><p>${def.how}</p><small>${ease >= 0.6 ? `Your ${skill} gives you room to spare.` : ease >= 0.3 ? `Your ${skill} helps a little.` : `The more ${skill} you have, the kinder this gets.`}</small><button class="mg-go" id="miniStart">Start</button></div>`;
  $('miniStart').addEventListener('click', () => {
    stage.innerHTML = '';
    stage.className = `mini-stage g-${o.id}`;
    sfx('flip');
    game = def.play(api);
    window.__mini = { id: o.id, auto: () => game.auto(), score: () => game.score(), over: () => over };
    clock = setInterval(() => { left -= 0.1; bar.style.width = `${clamp(left / total, 0, 1) * 100}%`; if (left <= 0) api.finish(game.score()); }, 100);
  }, { once: true });
}
// Gives up on the game in progress (the shift is marked on what was done so far).
// force: shut it without a word (the life it belonged to has gone).
export function quitMini(force = false) { if (live) live.quit(force); }
export const miniOpen = () => !!live;
