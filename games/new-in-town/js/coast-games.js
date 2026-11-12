// New in Town: the coast’s games, played by hand. Feeling your way through
// Hob’s Hole by lantern before the tide comes back, and building for the
// Sandcastle Cup at the cove. Each reports how it went from 0 to 1, as the
// work games do (see playMini in mini.js), and the rules in coast.js
// decide what came of it: for the caves, under 0.2 is cut off by the tide,
// 0.4 is out with nothing, and 1 is out with everything there was.

import { GAMES } from './mini.js';
import { sfx, haptic } from '../../../shared/arcade.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const press = (node, fn) => node.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });

// ---- the caves ------------------------------------------------------------------------------

// A cave five squares wide and seven deep, with its mouth at the bottom in
// the middle. Passages wind up from the mouth with side passages off them
// (one way to everywhere, so nothing is ever walled off); a few pools to
// wade through; and the finds left furthest in, in the dead ends first.
// rnd: the screen’s own dice. cells: 0 rock, 1 passage, 2 pool.
export const CAVE_W = 5, CAVE_H = 7;
export function makeCave(rnd, level = 0) {
  const W = CAVE_W, H = CAVE_H, N = W * H, mouth = (H - 1) * W + 2;
  const cells = new Array(N).fill(0);
  const nb = (i) => { const x = i % W, y = (i - x) / W, out = []; if (y > 0) out.push(i - W); if (x < W - 1) out.push(i + 1); if (y < H - 1) out.push(i + W); if (x > 0) out.push(i - 1); return out; };
  const open = (i) => cells[i] > 0;
  cells[mouth] = 1;
  const target = Math.min(22, 17 + level);
  let count = 1;
  const live = [mouth];
  // (Mostly carry on from the newest passage, for long winding ways; now and then branch off an old one.)
  for (let guard = 0; count < target && live.length && guard < 4000; guard++) {
    const k = rnd() < 0.65 ? live.length - 1 : Math.floor(rnd() * live.length), c = live[k];
    const can = nb(c).filter((j) => !open(j) && j < (H - 1) * W && nb(j).filter(open).length === 1);
    if (!can.length) { live.splice(k, 1); continue; }
    const j = can[Math.floor(rnd() * can.length)];
    cells[j] = 1; count++; live.push(j);
  }
  const dist = new Array(N).fill(-1);
  dist[mouth] = 0;
  for (const q = [mouth]; q.length;) { const c = q.shift(); for (const j of nb(c)) if (open(j) && dist[j] < 0) { dist[j] = dist[c] + 1; q.push(j); } }
  const spots = cells.map((v, i) => i).filter((i) => open(i) && i !== mouth && dist[i] >= 2);
  const dead = (i) => nb(i).filter(open).length === 1;
  const want = 3 + (level >= 2 ? 1 : 0) + (level >= 4 ? 1 : 0);
  const finds = spots.map((i) => [i, dist[i] + (dead(i) ? 4 : 0) + rnd() * 3]).sort((a, b) => b[1] - a[1]).slice(0, want).map(([i]) => i);
  const rest = spots.filter((i) => !finds.includes(i)), pools = [];
  for (let n = 2 + (level >= 3 ? 1 : 0); n > 0 && rest.length; n--) pools.push(rest.splice(Math.floor(rnd() * rest.length), 1)[0]);
  for (const i of pools) cells[i] = 2;
  return { W, H, cells, mouth, finds, pools, dist, nb };
}
// The score for coming out (or not) with some of what was in there.
export const caveScore = (out, got, total) => (out ? 0.4 + 0.6 * got / Math.max(1, total) : 0.05 + 0.1 * got / Math.max(1, total));

Object.assign(GAMES, {
  coastCaves: {
    how: 'Feel your way into the cave: tap the square next to you to step into it. Pick up whatever glints, then get back to the mouth and out before the tide comes in. The lantern will not last for ever.',
    time: 50,
    words: ['Cut off by the tide', 'Out, empty-handed', 'Out, with full pockets', 'Out, with everything'],
    play(api) {
      const cv = makeCave(api.rnd, api.level), { W, H, cells, mouth } = cv;
      const finds = new Set(cv.finds), total = finds.size, seen = new Set(), lit = new Set();
      let at = mouth, got = 0, oil = 26 + Math.round(api.ease * 12) - api.level, over = false, stage = 0;
      const box = el('div', 'cv', '<div class="cv-bar"><span class="cv-oil"></span><span class="cv-got"></span></div><div class="cv-grid"></div><div class="cv-foot"><p class="cv-say"></p><button class="mg-go cv-out">Out into the daylight</button></div>');
      api.stage.append(box);
      const grid = box.querySelector('.cv-grid'), foot = box.querySelector('.cv-foot'), say = box.querySelector('.cv-say'), oilEl = box.querySelector('.cv-oil'), gotEl = box.querySelector('.cv-got');
      const around = (i) => { const x = i % W, y = (i - x) / W, list = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) list.push(ny * W + nx); } return list; };
      const beside = (i, j) => cv.nb(i).includes(j);
      // The lantern lights the squares round you; when the oil is gone, only the one you are on.
      const look = () => { lit.clear(); lit.add(at); seen.add(at); if (oil > 0) for (const j of around(at)) { lit.add(j); seen.add(j); } };
      // How far the tide has come back: nothing for the first half of the time, then all the way.
      const tide = () => clamp((1 - api.left() / api.total - 0.5) * 2, 0, 1);
      const tell = (t) => { say.textContent = t; };
      const draw = () => {
        const wet = stage;
        grid.innerHTML = cells.map((v, i) => {
          const y = (i - (i % W)) / W, k = seen.has(i), cls = ['cv-c'];
          cls.push(!k ? 'dark' : !v ? 'rock' : v === 2 ? 'pool' : 'way');
          if (lit.has(i)) cls.push('lit');
          if (i === mouth) cls.push('mouth');
          if (k && v && y >= H - wet) cls.push('wet');
          const what = i === at ? '<i class="cv-lamp"></i>' : k && finds.has(i) ? '✨' : i === mouth ? (stage >= 2 ? '🌊' : '☀️') : k && v === 2 ? '💧' : '';
          return `<button class="${cls.join(' ')}" data-i="${i}" aria-label="square ${i + 1}">${what}</button>`;
        }).join('');
        oilEl.textContent = oil > 0 ? `🕯️ Oil for ${oil} more step${oil > 1 ? 's' : ''}` : '🕯️ The lantern is out';
        gotEl.textContent = `✨ ${got} of ${total}`;
        foot.classList.toggle('at-mouth', at === mouth);
      };
      const score = () => caveScore(at === mouth, got, total);
      const finish = () => { if (over) return; over = true; draw(); api.finish(score()); };
      const step = (j) => {
        if (over || j === at || !beside(at, j)) return;
        if (!cells[j]) {
          // (In the dark you only find the rock by walking into it.)
          if (!seen.has(j)) { seen.add(j); api.lose(1); sfx('bump'); haptic(); tell('Rock. You feel your way along it.'); draw(); } else sfx('nope');
          return;
        }
        at = j;
        if (oil > 0 && --oil === 0) tell('The lantern gutters and goes out. Feel your way.');
        if (cells[j] === 2) { api.lose(2); sfx('pour'); tell('Up to your waist in cold water. That was slow.'); } else sfx('tap');
        if (finds.has(j)) { finds.delete(j); got++; sfx('coin'); haptic(); tell(got === total ? 'That is everything. Now get out.' : 'Something glints. Into your pocket.'); }
        look(); draw();
      };
      press(grid, (e) => { const b = e.target.closest('[data-i]'); if (b) step(Number(b.dataset.i)); });
      press(box.querySelector('.cv-out'), () => { if (at === mouth) finish(); });
      api.frame(() => {
        if (over) return;
        const t = tide(), k = t <= 0 ? 0 : t < 0.45 ? 1 : t < 0.85 ? 2 : 3;
        if (k !== stage) { stage = k; tell(['', 'The tide has turned. You can hear it.', 'The water is round the mouth of the cave.', 'Get out. Now.'][k]); sfx(k === 3 ? 'wrong' : 'hint'); if (k === 3) haptic(); draw(); }
      });
      look(); draw();
      tell('Step in. Mind your head.');
      return { score, auto: () => { got = total; finds.clear(); at = mouth; look(); finish(); } };
    },
  },

  // ---- the Sandcastle Cup ---------------------------------------------------------------------

  // Six towers. Hold a bucket down to pack it; let go when the sand is in the green.
  coastCastle: {
    how: 'Six towers. Press and hold a bucket to pack it with sand, and let go when the sand is in the green. Too little and the tower slumps; too much and it cracks. Get them all standing before the tide.',
    time: 30, fixed: true,
    words: ['Washed away', 'A modest castle', 'A fine castle', 'A masterpiece'],
    play(api) {
      const lo = 0.6 - api.ease * 0.07, hi = 0.8 + api.ease * 0.05, fill = 1.15 - api.level * 0.04;
      const up = Array(6).fill(0); // 0 to build, 1 standing, -1 fallen (build it again)
      let hold = null, over = false, falls = 0;
      const box = el('div', 'cs', `<div class="cs-beach">${up.map((_, i) => `<button class="cs-b" data-i="${i}"><span class="cs-gauge"><span class="cs-zone" style="--lo:${lo};--hi:${hi}"></span><span class="cs-sand"></span></span><i>🪣</i></button>`).join('')}</div><p class="mg-tally cs-say"></p>`);
      api.stage.append(box);
      const buttons = [...box.querySelectorAll('.cs-b')], say = box.querySelector('.cs-say');
      const standing = () => up.filter((v) => v === 1).length;
      const show = (i) => { const b = buttons[i]; b.className = `cs-b${up[i] === 1 ? ' up' : up[i] === -1 ? ' down' : ''}`; b.querySelector('i').textContent = up[i] === 1 ? '🏰' : up[i] === -1 ? '🟫' : '🪣'; b.style.setProperty('--p', 0); };
      const tally = (t) => { say.textContent = `${t ? `${t} ` : ''}${standing()} of 6 standing.`; };
      const score = () => clamp(standing() / 6 * 0.85 - falls * 0.01, 0, 1);
      const end = () => { if (over) return; over = true; api.finish(clamp(0.72 + 0.28 * api.left() / api.total, 0, 1)); };
      const judge = (crack) => {
        const { i, p } = hold;
        hold = null;
        if (!crack && p >= lo && p <= hi) { up[i] = 1; sfx('pop'); show(i); tally('Firm and square.'); if (standing() === 6) end(); return; }
        up[i] = -1; falls++; sfx('nope'); haptic(); show(i);
        tally(crack ? 'Packed too hard: it cracks.' : 'Not enough sand: it slumps.');
      };
      buttons.forEach((b, i) => {
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (over || hold || up[i] === 1) return;
          hold = { i, p: 0, id: e.pointerId };
          b.classList.add('held');
          if (b.setPointerCapture) try { b.setPointerCapture(e.pointerId); } catch { /* not every browser will */ }
          sfx('tap');
        });
        const let_go = (e) => { if (hold && hold.i === i && e.pointerId === hold.id) { b.classList.remove('held'); judge(false); } };
        b.addEventListener('pointerup', let_go);
        b.addEventListener('pointercancel', let_go);
      });
      api.frame((dt) => {
        if (!hold || over) return;
        hold.p += dt / fill;
        buttons[hold.i].style.setProperty('--p', Math.min(1, hold.p));
        if (hold.p > 1.02) { buttons[hold.i].classList.remove('held'); judge(true); }
      });
      tally('');
      return { score, auto: () => { for (let i = 0; i < 6; i++) { up[i] = 1; show(i); } end(); } };
    },
  },
});

// The look of both, added to the page by coast-ui.js.
export const GAME_CSS = `
.cv { display: grid; gap: 8px; justify-items: center; width: 100%; }
.cv-bar { display: flex; justify-content: space-between; gap: 8px; width: min(330px, 100%); font-size: 13.5px; font-weight: 900; color: #6b6048; }
.cv-grid { box-sizing: border-box; display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; padding: 6px; border-radius: 16px; background: #15110d;
  width: min(330px, 100%, calc((100vh - 196px) * 5 / 7)); width: min(330px, 100%, calc((100dvh - 196px) * 5 / 7)); box-shadow: 0 3px 0 #3a2f25; }
.mini-stage .cv-c { aspect-ratio: 1; min-width: 0; border-radius: 8px; padding: 0; display: grid; place-items: center; font-size: 22px; line-height: 1; background: #0c0a08; transition: background .25s; }
.cv-c.rock { background: #2f2822; }
.cv-c.way { background: #5b4c3a; }
.cv-c.pool { background: #2d5568; }
.cv-c.lit.rock { background: #5a4d40; background-image: repeating-linear-gradient(135deg, #0000 0 7px, #00000022 7px 9px); }
.cv-c.lit.way { background: #d6b47a; }
.cv-c.lit.pool { background: #5aa3c4; }
.cv-c.mouth { background: #f3dfae; }
.cv-c.wet { background-image: linear-gradient(to top, rgba(63, 177, 196, .85) 60%, #0000 60%); }
.cv-c.mouth.wet { background-image: linear-gradient(to top, rgba(63, 177, 196, .95) 80%, #0000 80%); }
.cv-lamp { display: block; width: 46%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, #fffbe0 0 25%, #ffc93c 60%, #e0861e); box-shadow: 0 0 14px 7px rgba(255, 201, 60, .55); }
.cv-foot { display: grid; place-items: center; width: min(330px, 100%); height: 52px; }
.cv-say { margin: 0; font-size: 14px; font-weight: 800; color: var(--muted); text-align: center; line-height: 1.3; }
.cv-out { display: none; width: 100%; min-height: 48px; padding: 10px 16px; font-size: 17px; }
.cv-foot.at-mouth .cv-out { display: block; }
.cv-foot.at-mouth .cv-say { display: none; }
.cs { display: grid; gap: 14px; justify-items: center; width: 100%; }
.cs-beach { box-sizing: border-box; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; width: min(330px, 100%); padding: 14px; border-radius: 20px; background: var(--sand, #f3dfae); background-image: radial-gradient(#e6cf96 1.2px, #0000 1.6px); background-size: 12px 12px; box-shadow: 0 3px 0 #dcc58d; }
.mini-stage .cs-b { position: relative; aspect-ratio: 1; min-width: 0; border-radius: 18px; background: #fff7e2; box-shadow: 0 4px 0 #d9c38c; display: grid; place-items: center; padding: 0; --p: 0; }
.cs-b i { font-style: normal; font-size: 40px; line-height: 1; transition: transform .15s; }
.cs-b.held i { transform: scale(1.12) rotate(-8deg); }
.cs-b.up { background: #e4f5ea; box-shadow: 0 4px 0 #9fd5b2; }
.cs-b.down { background: #f6e3d6; }
.cs-gauge { position: absolute; left: 8px; top: 10px; bottom: 10px; width: 9px; border-radius: 5px; background: #ece2c8; overflow: hidden; }
.cs-zone { position: absolute; left: 0; right: 0; bottom: calc(var(--lo) * 100%); height: calc((var(--hi) - var(--lo)) * 100%); background: #49c27c; }
.cs-sand { position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--p) * 100%); background: #b98a4a; opacity: .85; }
.cs-b.up .cs-gauge, .cs-b.up .cs-zone { opacity: 0; }
`;
