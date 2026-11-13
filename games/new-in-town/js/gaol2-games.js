// New in Town: the game for the kitchens in Starling Gaol (the rules are in
// gaol2.js). It joins the work games in mini.js and is played the same way,
// a minute at most, marked from 0 to 1.
//
//   g2plate: the hotplate at dinner. Men come up to the hatch one at a time
//            with the menu sheet they ticked last week; put on each tray what
//            he ticked, and nothing else. A wrong ladle is a complaint.

import { GAMES } from './mini.js';
import { face } from './art.js';
import { sfx, haptic } from '../../../shared/arcade.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const press = (node, fn) => node.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });

// What is on the hotplate (the first four always; the rest once you are higher up).
const DISHES = [['🥔', 'Mash'], ['🫘', 'Beans'], ['🥕', 'Carrots'], ['🍮', 'Sponge'], ['🐟', 'Fish'], ['🥧', 'Pie']];
const NAMES = ['Del', 'Big Mick', 'Shorty', 'Taff', 'Ginger', 'Nobby', 'Lofty', 'Smudger', 'Dodger', 'The Professor', 'Chalky', 'Dusty'];
const MOANS = ['I never ticked that.', 'Oi. Beans, I said.', 'Is that meant to be for me?', 'I am telling Chef.'];
const THANKS = ['Ta.', 'Lovely.', 'Cheers, chef.', 'Bit more custard next time.', 'Right you are.'];

Object.assign(GAMES, {
  g2plate: {
    how: 'Each man at the hatch ticked his menu sheet last week. Tap the pans to put on his tray what he ticked, and nothing else. A wrong ladle is a complaint.', time: 40,
    words: ['Beans everywhere', 'A fair service', 'A good service', 'Not a tray sent back'],
    play(api) {
      const n = api.level >= 2 ? 6 : 4, each = api.level >= 3 ? 3 : 2, want = 8;
      let served = 0, moans = 0, cur = null, busy = false, ended = false;
      const box = el('div', 'g2-plate');
      api.stage.append(box);
      const pick = (l) => l[Math.floor(api.rnd() * l.length)];
      const draw = (said, cls = '') => {
        const left = want - served - 1;
        box.innerHTML = `<div class="g2-q"><span>${'🧍'.repeat(Math.max(0, Math.min(7, left)))}</span><small>${left > 0 ? `${left} more in the queue` : 'The last one'}</small></div>
          <div class="g2-man ${cls}"><span class="g2-face">${face(cur.look, cur.age, cls === 'no' ? 20 : 65, 'm')}</span><div><b>${cur.name}</b><p>${said || 'Holds out his tray.'}</p></div></div>
          <div class="g2-slip">${cur.wants.map((d, i) => `<span class="${cur.got[i] ? 'on' : ''}"><i>${DISHES[d][0]}</i>${DISHES[d][1]}${cur.got[i] ? ' ✓' : ''}</span>`).join('')}</div>
          <div class="g2-pans g2-pans${n}">${DISHES.slice(0, n).map(([ic, nm], i) => `<button data-d="${i}"><i>${ic}</i><small>${nm}</small></button>`).join('')}</div>
          <p class="mg-tally">${served} served · ${moans} complaint${moans === 1 ? '' : 's'}</p>`;
      };
      const next = () => {
        const wants = [];
        while (wants.length < each) { const d = Math.floor(api.rnd() * n); if (!wants.includes(d)) wants.push(d); }
        cur = { name: pick(NAMES), age: 20 + Math.floor(api.rnd() * 50), look: { skin: Math.floor(api.rnd() * 6), hair: Math.floor(api.rnd() * 9), top: Math.floor(api.rnd() * 8), style: pick([0, 0, 3, 4]), beard: api.rnd() < 0.35 }, wants, got: wants.map(() => false) };
        busy = false; draw();
      };
      const score = () => clamp((served - moans * 0.34) / want, 0, 1);
      const ladle = (d) => {
        if (busy || ended || !cur) return;
        const i = cur.wants.findIndex((w, k) => w === d && !cur.got[k]);
        if (i < 0) { moans++; sfx('nope'); haptic(); draw(`“${pick(MOANS)}”`, 'no'); return; }
        cur.got[i] = true; sfx('pop');
        if (cur.got.every(Boolean)) {
          served++; busy = true; sfx('coin'); draw(`“${pick(THANKS)}”`, 'yes');
          if (served >= want) { ended = true; api.after(350, () => api.finish(score())); return; }
          api.after(380, next);
          return;
        }
        draw();
      };
      press(box, (e) => { const b = e.target.closest('[data-d]'); if (b) ladle(Number(b.dataset.d)); });
      next();
      return { score, auto: () => { if (busy || ended || !cur) return; for (let k = 0; k < cur.wants.length; k++) if (!cur.got[k]) ladle(cur.wants[k]); } };
    },
  },
});
