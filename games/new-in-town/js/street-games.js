// New in Town: the seating plan, for having people round (the rules are in street.js, the
// sheet that chooses the guests in street-ui.js). It joins the games in mini.js and is
// played the same way, marked from 0 to 1.
//
//   stSeat: the table, seen from above, with your chair at the head. Tap a guest, then a
//           chair. Those at odds should not sit side by side; a shy guest wants somebody kind
//           beside them and nobody loud; the guest of honour sits beside you, and not beside
//           somebody who will talk at them. Each rule kept shows a tick. Then serve.
//
// The guests come from the life (setTable, before playing); seated() says where everybody
// sat, for the rules to judge the evening by.

import { GAMES } from './mini.js';
import { face } from './art.js';
import { sfx, haptic } from '../../../shared/arcade.js';
import { SEAT, tableRules, ruleKept, bestTable, ruleSaid } from './street-lib.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const press = (node, fn) => node.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let TABLE = null, ORDER = null;
// The table to lay: [{ k, first, look, age, sex, tags, vs, icon? }], you first.
export const setTable = (t) => { TABLE = t; ORDER = null; };
// Where everybody sat when dinner was served (keys by chair, you first), or null.
export const seated = () => ORDER;
// For a guest with no face of their own to draw.
const ICON = { boss: '👔', vicar: '⛪', inl: '👵' };

// (A table to practise on, if the game is opened with none.)
const SPARE = [
  { k: 'you', first: 'You', tags: [], vs: [] },
  { k: 'a', first: 'Cyril', tags: ['bore'], vs: ['b'] },
  { k: 'b', first: 'Gary', tags: ['loud'], vs: ['a'] },
  { k: 'c', first: 'Ivy', tags: ['shy'], vs: [] },
  { k: 'd', first: 'Mum', tags: ['kind'], vs: [] },
  { k: 'e', first: 'The boss', tags: ['honour'], vs: [] },
];

Object.assign(GAMES, {
  stSeat: {
    how: 'Seat your guests. Tap a guest, then a chair (tap a seated guest to move them). Keep those at odds apart, put somebody kind beside anyone shy and nobody loud, and the guest of honour beside you. Then serve.',
    time: 75, fixed: true,
    words: ['A frosty evening', 'A pleasant evening', 'A lovely evening', 'A night to remember'],
    play(api) {
      const guests = TABLE && TABLE.length >= 2 ? TABLE : SPARE, n = guests.length, rules = tableRules(guests), best = bestTable(guests, rules);
      const G = (k) => guests.find((g) => g.k === k);
      const seats = Array(n).fill(null);
      seats[0] = 'you';
      let pick = null, over = false;
      const box = el('div', 'st-seat');
      api.stage.append(box);
      const kept = () => rules.filter((r) => ruleKept(r, seats.map((k) => k || '·'), guests)).length;
      const score = (done) => {
        const k = kept(), m = best.max || 0, q = m ? clamp(k / m, 0, 1) : 1;
        return done ? q * (0.85 + 0.15 * api.left() / api.total) : q * 0.85 * (seats.every(Boolean) ? 1 : 0.6);
      };
      const ava = (g, size = 'b') => `<span class="st-ava ${size}">${g.look ? face(g.look, g.age || 40, 70, g.sex) : `<i>${ICON[g.k] || '🙂'}</i>`}</span>`;
      const tags = (g) => [...g.tags.map((t) => SEAT[t].icon), ...(g.vs.some((k) => guests.some((h) => h.k === k)) ? ['⚡'] : [])].join('');
      // Who is unhappy where they sit, for a red ring.
      const sore = () => {
        const out = new Set(), order = seats.map((k) => k || '·');
        for (const r of rules) {
          if (!seats.includes(r.a) || (r.b && !seats.includes(r.b))) continue;
          if (r.t === 'kind' && seats.indexOf(r.a) >= 0) { const i = seats.indexOf(r.a), nb = [seats[(i + 1) % n], seats[(i + n - 1) % n]]; if (nb.some((k) => !k)) continue; }
          if (!ruleKept(r, order, guests)) { out.add(r.a); if (r.t === 'apart') out.add(r.b); }
        }
        return out;
      };
      const draw = () => {
        const bad = sore(), tray = guests.filter((g) => !seats.includes(g.k));
        const pos = (i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return `left:${50 + 41 * Math.cos(a)}%;top:${50 + 39 * Math.sin(a)}%`; };
        box.innerHTML = `<div class="st-tbl"><div class="st-cloth"><span>🕯️🍽️🕯️</span></div>${seats.map((k, i) => {
          const g = k && G(k);
          return `<button class="st-chair${i === 0 ? ' host' : ''}${g && pick === k ? ' on' : ''}${g && bad.has(k) ? ' sore' : g && i ? ' ok' : ''}" data-s="${i}" style="${pos(i)}">${g ? `${ava(g)}<small>${esc(g.first)}<em>${tags(g)}</em></small>` : '<span class="st-empty">+</span>'}</button>`;
        }).join('')}</div>
          <div class="st-tray">${tray.length ? tray.map((g) => `<button class="st-guest${pick === g.k ? ' on' : ''}" data-g="${esc(g.k)}">${ava(g, 's')}<b>${esc(g.first)}</b><em>${tags(g)}</em></button>`).join('') : '<p class="mg-tally">Everybody has a chair.</p>'}</div>
          <ul class="st-rules">${rules.map((r) => { const k = ruleKept(r, seats.map((q) => q || '·'), guests); return `<li class="${k ? 'kept' : ''}">${k ? '✓' : '○'} ${esc(ruleSaid(r, (q) => (q === 'you' ? 'you' : G(q).first)))}</li>`; }).join('') || '<li class="kept">✓ Nobody minds where they sit.</li>'}</ul>
          <button class="mg-go st-serve" data-serve="1"${seats.every(Boolean) ? '' : ' disabled'}>Serve dinner</button>`;
      };
      const serve = () => { if (over || !seats.every(Boolean)) return; over = true; ORDER = seats.slice(); sfx('chime'); api.finish(score(true)); };
      press(box, (e) => {
        if (over) return;
        const b = e.target.closest('[data-s],[data-g],[data-serve]');
        if (!b) return;
        if (b.dataset.serve) return serve();
        if (b.dataset.g) { pick = pick === b.dataset.g ? null : b.dataset.g; sfx('tap'); return draw(); }
        const i = Number(b.dataset.s);
        if (i === 0) { sfx('nope'); return; }
        const there = seats[i];
        if (pick) {
          const from = seats.indexOf(pick);
          if (from >= 0) seats[from] = there; // (a swap, if somebody was in the chair)
          seats[i] = pick; pick = null;
          sfx('pop');
        } else if (there) { pick = there; sfx('tap'); }
        else { haptic(); }
        // (Anybody left without a chair goes back to waiting.)
        ORDER = seats.every(Boolean) ? seats.slice() : null;
        draw();
      });
      draw();
      return {
        score: () => { ORDER = seats.map((k) => k); return score(false); },
        auto: () => { for (let i = 0; i < n; i++) seats[i] = best.order[i]; pick = null; draw(); serve(); },
      };
    },
  },
});
