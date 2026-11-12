// New in Town: the games for Windle Farm and Market Square (the rules are
// in market.js). Each joins the work games in mini.js and is played the
// same way, a minute at most, marked from 0 to 1.
//
//   stall:   a Saturday at your stall. One customer at a time comes up
//            wanting something; read them (who they are, what they say) and
//            ask the most they will pay. Too much and they walk off.
//   trailer: farm work. Loads swing over Tom's trailer; tap to drop each one
//            and stack them square.

import { GAMES } from './mini.js';
import { face } from './art.js';
import { sfx, haptic } from '../../../shared/arcade.js';
import { stallCustomer, askMark, LEVELS } from './market.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const press = (node, fn) => node.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });

// What the next game is about: the things on the stall (set by the screen
// just before it starts the game), and what is being loaded on the farm.
let STALL = [];
export function setStallGoods(list) { STALL = list || []; }
const LOADS = [
  { icon: '🌾', fill: '#e9c86a', edge: '#b8963a', name: 'Hay for the ewes' },
  { icon: '🌾', fill: '#f0d27a', edge: '#c19c3c', name: 'Bales of hay' },
  { icon: '🥔', fill: '#c9a27a', edge: '#8f6b45', name: 'Sacks of potatoes' },
  { icon: '🪵', fill: '#a8774f', edge: '#714b2c', name: 'Fence posts' },
];
let LOAD = LOADS[1];
export function setLoad(season) { LOAD = LOADS[season] || LOADS[1]; }

const THANKS = ['Lovely, thank you.', 'Worth every penny.', 'Keep the change, love.', 'Smashing.'];
const PLEASED = ['Is that all? Oh, lovely!', 'Really? I’ll take it before you change your mind.', 'What a bargain.'];
const HUFF = ['How much? No, thank you.', 'I’ll leave it, thanks.', 'Daylight robbery.', 'Not at that price, dear.'];

Object.assign(GAMES, {
  // ---- the stall: ask the most each customer will pay ----
  stall: {
    how: 'Read each customer, then ask a price: cheap, fair or dear. Ask the most they will pay. Too much and they walk off; too little and the money stays in their purse.', time: 34,
    play(api) {
      const goods = STALL.length ? STALL : [{ g: 'jam', icon: '🍓', name: 'Jam', one: 'jar of jam', q: 0.5, each: [18, 22, 29] }];
      const want = 8, twist = 0.15 + api.level * 0.04;
      let served = 0, points = 0, sold = 0, walked = 0, till = 0, cur = null, busy = false;
      const box = el('div', 'mkt-queue');
      api.stage.append(box);
      const item = () => goods.find((x) => x.g === cur.g) || goods[0];
      const draw = (said, cls = '') => {
        const it = item(), left = want - served - 1;
        box.innerHTML = `<div class="mkt-line"><span>${'🧍'.repeat(Math.max(0, Math.min(6, left)))}</span><small>${left > 0 ? `${left} more in the queue` : 'The last one'}</small></div>
          <div class="mkt-cust ${cls}"><span class="mkt-face">${face(cur.look, cur.age, cls === 'no' ? 20 : 70, cur.sex)}<b>${cur.badge}</b></span><p class="mkt-says">${said || `“${cur.line}”`}</p></div>
          <div class="mkt-want"><i>${it.icon}</i><span><b>A ${it.one}</b><small>${'★'.repeat(Math.max(1, Math.round(it.q * 3)))}${'☆'.repeat(3 - Math.max(1, Math.round(it.q * 3)))}</small></span></div>
          <div class="mkt-asks">${it.each.map((p, i) => `<button data-a="${i}"><small>${LEVELS[i].name}</small><b>$${p}</b></button>`).join('')}</div>
          <p class="mg-tally">${sold} sold · ${walked} walked off · $${till} in the tin</p>`;
      };
      const next = () => { cur = stallCustomer(api.rnd, goods, twist); busy = false; draw(); };
      const ask = (a) => {
        if (busy || !cur) return;
        busy = true;
        const it = item(), mark = askMark(a, cur.tier), pick = (l) => l[Math.floor(api.rnd() * l.length)];
        served++; points += mark;
        if (mark > 0) { sold++; till += it.each[a]; sfx('coin'); draw(`“${mark < 1 ? pick(PLEASED) : pick(THANKS)}”`, mark < 1 ? 'cheap' : 'yes'); }
        else { walked++; sfx('nope'); haptic(); draw(`“${pick(HUFF)}”`, 'no'); }
        const b = box.querySelector(`[data-a="${a}"]`);
        if (b) b.classList.add(mark > 0 ? 'yes' : 'no');
        if (served >= want) { api.after(450, () => api.finish(points / want)); return; }
        api.after(mark > 0 && mark < 1 ? 800 : 600, next);
      };
      press(box, (e) => { const b = e.target.closest('[data-a]'); if (b) ask(Number(b.dataset.a)); });
      next();
      return { score: () => clamp(points / want, 0, 1), auto: () => { if (!busy && cur) ask(cur.tier); } };
    },
  },

  // ---- the farm: stack the loads on the trailer ----
  trailer: {
    how: 'A load swings over Tom’s trailer: tap to drop it. Stack them square. One that hangs too far over the edge falls off, and three off is the end of it.', time: 28,
    play(api) {
      const N = 8, W = 30 + api.ease * 8, H = 9, BED = { x: 14, w: 72 }, TOP = 84;
      const stack = [];
      let x = 0, dir = 1, speed = 34 + api.level * 5, state = 'swing', misses = 0, points = 0, ended = false;
      const yard = el('div', 'mkt-yard', `<div class="mkt-trailer" style="left:${BED.x}%;width:${BED.w}%;top:${TOP}%"><i></i><i></i></div><p class="mkt-tally"></p>`);
      api.stage.append(yard);
      const tally = yard.querySelector('.mkt-tally');
      const block = (cls) => { const b = el('div', `mkt-load ${cls || ''}`, `<span>${LOAD.icon}</span>`); b.style.width = `${W}%`; b.style.height = `${H}%`; b.style.background = LOAD.fill; b.style.borderColor = LOAD.edge; yard.append(b); return b; };
      let mover = block('swing');
      const show = () => { tally.textContent = `${stack.length} of ${N} loaded${misses ? ` · ${misses} off` : ''}`; };
      const place = (b, bx, i) => { b.style.left = `${bx}%`; b.style.top = `${TOP - (i + 1) * H}%`; };
      // How much of a load at bx sits on what is below it.
      const over = (bx) => {
        if (!stack.length) return clamp((Math.min(bx + W, BED.x + BED.w) - Math.max(bx, BED.x)) / W, 0, 1);
        return clamp(1 - Math.abs(bx - stack[stack.length - 1]) / W, 0, 1);
      };
      const finish = () => { if (ended) return; ended = true; api.finish(clamp(points / N, 0, 1)); };
      const land = (bx) => {
        const o = over(bx), b = mover;
        if (o < 0.45) {
          misses++; sfx('bump'); haptic();
          b.classList.add('off'); b.style.left = `${bx + (bx > (stack.length ? stack[stack.length - 1] : 35) ? 30 : -30)}%`; b.style.top = '104%';
          api.after(500, () => b.remove());
          if (misses >= 3) { show(); api.after(300, finish); return; }
        } else {
          stack.push(bx); points += o; sfx(o > 0.9 ? 'pop' : 'tap');
          b.classList.remove('swing'); b.classList.add('down'); place(b, bx, stack.length - 1);
          speed *= 1.07;
          if (stack.length >= N) { show(); api.after(300, finish); return; }
        }
        show();
        mover = block('swing'); x = dir > 0 ? 0 : 100 - W; state = 'swing';
      };
      const drop = () => {
        if (state !== 'swing' || ended) return;
        state = 'drop';
        const bx = x;
        mover.classList.add('fall'); mover.style.top = `${TOP - (stack.length + 1) * H}%`;
        api.after(220, () => land(bx));
      };
      press(yard, drop);
      api.frame((dt) => {
        if (state !== 'swing' || ended) return;
        x += dir * speed * dt;
        if (x >= 100 - W) { x = 100 - W; dir = -1; } else if (x <= 0) { x = 0; dir = 1; }
        mover.style.left = `${x}%`; mover.style.top = '2%';
      });
      show();
      return {
        score: () => clamp(points / N, 0, 1),
        auto: () => { while (!ended && stack.length < N) { x = stack.length ? stack[stack.length - 1] : BED.x + (BED.w - W) / 2; state = 'swing'; land(x); } },
      };
    },
  },
});
