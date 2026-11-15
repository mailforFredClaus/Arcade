// New in Town: the moor's games, played by hand with a finger. Foraging in
// Hollowell Wood (pick the good mushrooms, leave the deadly ones), joining
// up the stars at the observatory, and building a course of dry-stone wall
// on the Haverleigh estate. Each reports how it went from 0 to 1, as the
// work games do (see playMini in mini.js); the rules in moor.js decide what
// came of it.

import { GAMES } from './mini.js';
import { SKY } from './moor.js';
import { sfx, haptic } from '../../../shared/arcade.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const press = (node, fn) => node.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });

// ---- the wood ------------------------------------------------------------------------------

// What grows on the floor of Hollowell Wood. good: to pick. cap, gill: colours. ring: a ring on
// the stem (the deadly ones' tell). spots: white spots on the cap. lv: the level it turns up from.
export const SHROOMS = [
  { id: 'cep', name: 'Cep', good: true, cap: '#8a5a34', gill: '#d9c58a', lv: 0 },
  { id: 'chant', name: 'Chanterelle', good: true, cap: '#e8a93a', gill: '#e0a43a', lv: 0 },
  { id: 'bay', name: 'Bay bolete', good: true, cap: '#a0663c', gill: '#e6d27a', lv: 0 },
  { id: 'hedge', name: 'Hedgehog', good: true, cap: '#d9a25c', gill: '#f0d9a6', lv: 1 },
  { id: 'death', name: 'Death cap', good: false, cap: '#dfe3c8', gill: '#ffffff', ring: true, lv: 0 },
  { id: 'fly', name: 'Fly agaric', good: false, cap: '#d94a3a', gill: '#ffffff', ring: true, spots: true, lv: 0 },
  { id: 'angel', name: 'Destroying angel', good: false, cap: '#f7f6f0', gill: '#ffffff', ring: true, lv: 1 },
  { id: 'panther', name: 'Panther cap', good: false, cap: '#8a6a4a', gill: '#ffffff', ring: true, spots: true, lv: 2 },
  { id: 'web', name: 'Deadly webcap', good: false, cap: '#b0662c', gill: '#8a4a2a', ring: true, lv: 3 },
];
export const shroomSvg = (k) => `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="16.500" y="17" width="7" height="18" rx="3.500" fill="#f3ead6"/>${k.ring ? '<path d="M14 25h12l-2 3h-8z" fill="#fff" stroke="#b9ae98" stroke-width=".9"/>' : ''}<path d="M3 20a17 14 0 0 1 34 0z" fill="${k.cap}"/>${k.spots ? '<circle cx="12" cy="13" r="2.200" fill="#fff"/><circle cx="21" cy="8.500" r="2.400" fill="#fff"/><circle cx="28.500" cy="14" r="2" fill="#fff"/>' : ''}<path d="M4.500 20.500h31" stroke="${k.gill}" stroke-width="3" stroke-linecap="round"/><ellipse cx="20" cy="36" rx="10" ry="2" fill="rgba(0,0,0,.15)"/></svg>`;

// ---- the stars ------------------------------------------------------------------------------

// Which constellation the next night at the telescope is for (moor-ui.js sets it from the rules).
let skyId = 'plough';
export const setSky = (id) => { if (SKY[id]) skyId = id; };
// The shape as Dr Lamb draws it in her book: lines between the stars.
export const skySvg = (k, cls = 'sk-chart') => `<svg viewBox="-6 -6 112 112" class="${cls}" aria-hidden="true">${k.lines.map(([a, b]) => `<line x1="${k.stars[a][0]}" y1="${k.stars[a][1]}" x2="${k.stars[b][0]}" y2="${k.stars[b][1]}"/>`).join('')}${k.stars.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('')}</svg>`;

// ---- the wall -------------------------------------------------------------------------------

export const COURSE = 12;
// The joints along a course, as positions from the left (not counting the two ends).
export const joints = (stones) => { const out = []; let x = 0; for (const w of stones.slice(0, -1)) { x += w; out.push(x); } return out; };

Object.assign(GAMES, {
  moorForage: {
    how: 'Mushrooms come up all over the wood floor. Tap the good ones into your basket before they go over. Leave anything with a ring on its stem, and anything white or red: those will kill you.',
    time: 30,
    words: ['A basket to throw away', 'A fair basket', 'A good basket', 'Abel would be proud'],
    play(api) {
      const kinds = SHROOMS.filter((k) => k.lv <= api.level), N = 12, cells = Array(N).fill(null);
      const stay = 2.4 + api.ease * 1.4 - api.level * 0.12, every = 0.72 - api.level * 0.03;
      let good = 0, bad = 0, grown = 0, wait = 0.3, over = false;
      const box = el('div', 'fg', `<div class="fg-guide"><span class="ok">${shroomSvg(SHROOMS[0])}${shroomSvg(SHROOMS[1])}<b>Pick</b></span><span class="no">${shroomSvg(SHROOMS[4])}${shroomSvg(SHROOMS[5])}<b>Leave: a ring, or white or red</b></span></div><div class="fg-floor">${cells.map((_, i) => `<button class="fg-c" data-i="${i}" aria-label="patch ${i + 1}"></button>`).join('')}</div><p class="mg-tally fg-say"></p>`);
      api.stage.append(box);
      const btns = [...box.querySelectorAll('.fg-c')], say = box.querySelector('.fg-say');
      const target = () => Math.max(8, Math.round(grown * 0.72));
      const tally = (t) => { say.textContent = `${t ? `${t} ` : ''}🧺 ${good} in the basket${bad ? `, ${bad} bad` : ''}`; };
      const score = () => clamp((good - 3 * bad) / target(), 0, 1);
      const show = (i) => { const c = cells[i], b = btns[i]; b.className = `fg-c${c ? ' up' : ''}`; b.innerHTML = c ? shroomSvg(c.k) : ''; };
      const grow = () => {
        const free = cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
        if (!free.length) return;
        const i = free[Math.floor(api.rnd() * free.length)];
        // (About three in five are good; the rest are the ones to leave.)
        const want = api.rnd() < 0.6, pool = kinds.filter((k) => k.good === want);
        cells[i] = { k: pool[Math.floor(api.rnd() * pool.length)], t: stay };
        if (cells[i].k.good) grown++;
        show(i);
      };
      press(box.querySelector('.fg-floor'), (e) => {
        const b = e.target.closest('[data-i]');
        if (!b || over) return;
        const i = Number(b.dataset.i), c = cells[i];
        if (!c) return;
        cells[i] = null; show(i);
        if (c.k.good) { good++; sfx('pop'); tally(''); return; }
        bad++; sfx('wrong'); haptic();
        b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 450);
        tally(`✘ ${c.k.name}!`);
      });
      api.frame((dt) => {
        if (over) return;
        wait -= dt;
        if (wait <= 0) { grow(); wait = every * (0.7 + api.rnd() * 0.6); }
        for (let i = 0; i < N; i++) { const c = cells[i]; if (c && (c.t -= dt) <= 0) { cells[i] = null; show(i); } }
      });
      tally('');
      return { score, auto: () => { over = true; good = target() + 2; bad = 0; api.finish(1); } };
    },
  },

  moorStars: {
    how: 'Dr Lamb’s chart shows the shape. Find its stars among all the others, and join them up: tap a star, then the next one along the line. A wrong star costs you time.',
    time: 45,
    words: ['Lost in the stars', 'A smudge of it', 'Found and logged', 'Clear as print'],
    play(api) {
      const k = SKY[skyId], n = k.stars.length;
      // Where the shape sits in the sky, and how big: then the other stars, none too close to any.
      const size = 62 - api.level * 2, ox = 6 + api.rnd() * (88 - size), oy = 6 + api.rnd() * (88 - size);
      const stars = k.stars.map(([x, y]) => ({ x: ox + x / 100 * size, y: oy + y / 100 * size, r: 1.8 + api.rnd() * 1.4, mine: true }));
      for (let tries = 0, want = 9 + api.level * 2; stars.length < n + want && tries < 600; tries++) {
        const x = 4 + api.rnd() * 92, y = 4 + api.rnd() * 92;
        if (stars.every((s) => Math.hypot(s.x - x, s.y - y) > 11)) stars.push({ x, y, r: 1.4 + api.rnd() * 1.8, mine: false });
      }
      const done = new Set(), key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`), edges = new Set(k.lines.map(([a, b]) => key(a, b)));
      let sel = null, over = false;
      const box = el('div', 'sk', `<div class="sk-top">${skySvg(k)}<div><b>${k.name}</b><small>Join up the shape. Tap a star, then the next.</small></div></div><div class="sk-sky"><svg viewBox="0 0 100 100" class="sk-svg"><g class="sk-lines"></g><g class="sk-stars"></g></svg></div><p class="mg-tally sk-say"></p>`);
      api.stage.append(box);
      const sky = box.querySelector('.sk-sky'), lines = box.querySelector('.sk-lines'), dots = box.querySelector('.sk-stars'), say = box.querySelector('.sk-say');
      const tell = (t) => { say.textContent = t; };
      const draw = () => {
        lines.innerHTML = [...done].map((e) => { const [a, b] = e.split('-').map(Number); return `<line x1="${stars[a].x}" y1="${stars[a].y}" x2="${stars[b].x}" y2="${stars[b].y}"/>`; }).join('');
        // (The more Smarts, the brighter the shape's own stars shine against the rest.)
        dots.innerHTML = stars.map((s, i) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r + (s.mine ? api.ease * 0.6 : 0)}" class="${i === sel ? 'sel' : ''}${[...done].some((e) => e.split('-').map(Number).includes(i)) ? ' lit' : ''}"/>${i === sel ? `<circle cx="${s.x}" cy="${s.y}" r="5.500" class="ring"/>` : ''}`).join('');
      };
      const score = () => (done.size >= edges.size ? clamp(0.65 + 0.35 * api.left() / api.total, 0.65, 1) : 0.45 * done.size / edges.size);
      const finish = () => { if (over) return; over = true; draw(); api.finish(score()); };
      press(sky, (e) => {
        if (over) return;
        const r = sky.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
        let best = -1, d = 9;
        stars.forEach((s, i) => { const q = Math.hypot(s.x - x, s.y - y); if (q < d) { d = q; best = i; } });
        if (best < 0) return;
        if (best >= n) { sel = null; api.lose(1.5); sfx('nope'); tell('That one is not in the shape.'); draw(); return; }
        if (sel == null || sel === best) { sel = sel === best ? null : best; sfx('tap'); tell(''); draw(); return; }
        const e2 = key(sel, best);
        if (edges.has(e2) && !done.has(e2)) {
          done.add(e2); sel = best; sfx('pop'); haptic();
          if (done.size >= edges.size) { tell(`${k.name}: logged.`); sfx('chime'); finish(); return; }
          tell(`${done.size} of ${edges.size} joined.`);
        } else if (done.has(e2)) { sel = best; sfx('tap'); }
        else { api.lose(1); sfx('nope'); tell('Those two are not joined on the chart.'); sel = best; }
        draw();
      });
      draw();
      tell('Start anywhere on the shape.');
      return { score, auto: () => { for (const e of edges) done.add(e); finish(); } };
    },
  },

  moorWall: {
    how: 'Build the wall a course at a time: tap a stone from the heap to lay it next along. Fill each course exactly, and never let a joint sit straight over a joint in the course below (the dotted lines), or the wall is weak. Rummage for other stones if you need to.',
    time: 50,
    words: ['A heap of stones', 'It will stand', 'A sound wall', 'A waller’s wall'],
    play(api) {
      const target = 3 + (api.level >= 3 ? 1 : 0);
      const rw = () => { const r = api.rnd(); return r < 0.18 ? 1 : r < 0.5 ? 2 : r < 0.82 ? 3 : 4; };
      // The footings: a course laid already, to build on.
      const foot = []; for (let x = 0; x < COURSE;) { const w = Math.min(COURSE - x, 2 + Math.floor(api.rnd() * 3)); foot.push(w); x += w; }
      const built = [{ stones: foot, sound: true }];
      let cur = [], weak = 0, heap = [rw(), rw(), rw(), rw()], over = false;
      const box = el('div', 'dw', '<div class="dw-wall"></div><div class="dw-heap"></div><div class="dw-foot"><button class="dw-rummage">Rummage in the heap</button><p class="mg-tally dw-say"></p></div>');
      api.stage.append(box);
      const wallEl = box.querySelector('.dw-wall'), heapEl = box.querySelector('.dw-heap'), say = box.querySelector('.dw-say');
      const tell = (t) => { say.textContent = t; };
      const used = () => cur.reduce((a, b) => a + b, 0);
      const below = () => joints(built[built.length - 1].stones);
      // Make sure something in the heap fits the gap that is left.
      const fit = () => { const gap = COURSE - used(); if (gap > 0 && !heap.some((w) => w <= gap)) heap[Math.floor(api.rnd() * heap.length)] = Math.max(1, Math.min(gap, rw())); };
      const sound = () => built.slice(1).filter((c) => c.sound).length, laid = () => built.length - 1;
      const score = () => clamp((sound() + 0.6 * (laid() - sound()) + 0.5 * used() / COURSE) / target, 0, 1);
      const row = (stones, cls, guides) => `<div class="dw-row ${cls}">${stones.map((w, i) => `<span class="dw-s s${(i * 7 + w) % 4}" style="flex-basis:${w / COURSE * 100}%"></span>`).join('')}${guides ? guides.map((x) => `<i class="dw-g" style="left:${x / COURSE * 100}%"></i>`).join('') : ''}</div>`;
      const draw = () => {
        const rows = [];
        if (!over && laid() < target) rows.push(row(cur, `now${weak ? ' weak' : ''}`, below()));
        for (let i = built.length - 1; i >= 0; i--) rows.push(row(built[i].stones, i ? (built[i].sound ? 'done' : 'done weak') : 'footing'));
        wallEl.innerHTML = rows.join('');
        fit();
        const gap = COURSE - used();
        heapEl.innerHTML = heap.map((w, i) => `<button class="dw-h${w > gap ? ' off' : ''}" data-i="${i}" aria-label="a stone ${w} wide"><span class="dw-s s${w % 4}" style="width:${w / 4 * 100}%"></span><small>${w}</small></button>`).join('');
      };
      const finish = () => { if (over) return; over = true; draw(); api.finish(score()); };
      press(heapEl, (e) => {
        const b = e.target.closest('[data-i]');
        if (!b || over) return;
        const i = Number(b.dataset.i), w = heap[i], gap = COURSE - used();
        if (w > gap) { sfx('nope'); tell('Too long for the gap that is left.'); return; }
        cur.push(w); heap[i] = rw();
        const end = used();
        if (end < COURSE && below().includes(end)) { weak++; sfx('nope'); haptic(); tell('A joint over a joint: that is a weak spot.'); }
        else sfx('clack');
        if (end === COURSE) {
          const ok = weak === 0;
          built.push({ stones: cur, sound: ok }); cur = []; weak = 0;
          sfx(ok ? 'brick' : 'tap');
          tell(ok ? 'A sound course. On to the next.' : 'It will stand. Just.');
          if (laid() >= target) { finish(); return; }
        }
        draw();
      });
      press(box.querySelector('.dw-rummage'), () => { if (over) return; heap = [rw(), rw(), rw(), rw()]; api.lose(2); sfx('flip'); tell('You turn over the heap for better stones.'); draw(); });
      draw();
      tell(`${target} courses to build.`);
      return { score, auto: () => { while (built.length - 1 < target) built.push({ stones: [3, 3, 3, 3], sound: true }); cur = []; finish(); } };
    },
  },
});

export const GAME_CSS = `
.fg { display: grid; gap: 10px; justify-items: center; width: 100%; }
.fg-guide { display: flex; gap: 8px; width: min(340px, 100%); }
.fg-guide span { flex: 1; display: flex; align-items: center; gap: 2px; padding: 4px 8px; border-radius: 12px; font-size: 12px; line-height: 1.15; }
.fg-guide span svg { width: 26px; height: 26px; flex: none; }
.fg-guide span b { margin-left: 4px; font-weight: 900; }
.fg-guide .ok { background: #e4f5ea; color: #1f7a4a; flex: .7; }
.fg-guide .no { background: #fde8e4; color: #9b2f25; }
.fg-floor { box-sizing: border-box; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 10px; border-radius: 20px; width: min(340px, 100%, calc((100dvh - 250px) * 3 / 4)); background: #5f7a3e; background-image: radial-gradient(#6f8c48 2px, #0000 3px), radial-gradient(#4f6a32 1.5px, #0000 2.5px); background-size: 18px 18px, 13px 13px; background-position: 0 0, 7px 9px; box-shadow: 0 3px 0 #465c2c; }
.mini-stage .fg-c { aspect-ratio: 1; min-width: 0; min-height: 56px; border-radius: 50%; padding: 6px; background: radial-gradient(circle, #7d9a52 0 55%, #6a8644 56%); display: grid; place-items: center; transition: transform .12s; }
.fg-c svg { width: 100%; height: 100%; }
.fg-c.up svg { animation: fg-up .25s ease-out; }
.fg-c.bad { background: radial-gradient(circle, #f2576d 0 55%, #c43a4f 56%); }
.fg-c:active { transform: scale(.94); }
@keyframes fg-up { from { transform: translateY(30%) scale(.4); opacity: 0; } to { transform: none; opacity: 1; } }
.sk { display: grid; gap: 10px; justify-items: center; width: 100%; }
.sk-top { display: flex; align-items: center; gap: 10px; width: min(340px, 100%); padding: 6px 10px; border-radius: 14px; background: #fbf6e9; box-shadow: 0 2px 0 var(--line); }
.sk-top div { display: grid; gap: 1px; }
.sk-top b { font-size: 16px; font-weight: 900; }
.sk-top small { font-size: 12px; font-weight: 700; color: var(--muted); line-height: 1.3; }
.sk-chart { width: 54px; height: 54px; flex: none; }
.sk-chart line { stroke: #8a6a3a; stroke-width: 3; stroke-linecap: round; }
.sk-chart circle { fill: #3d4a6b; }
.sk-sky { width: min(340px, 100%, calc(100dvh - 270px)); aspect-ratio: 1; border-radius: 20px; background: radial-gradient(ellipse at 50% 120%, #2b3a66, #0d1330 70%); box-shadow: 0 3px 0 #070a1a; touch-action: none; }
.sk-svg { width: 100%; height: 100%; display: block; }
.sk-stars circle { fill: #f6f1da; }
.sk-stars circle.lit { fill: #ffe27a; }
.sk-stars circle.sel { fill: #fff; }
.sk-stars circle.ring { fill: none; stroke: #ffe27a; stroke-width: .8; }
.sk-lines line { stroke: #ffe27a; stroke-width: .9; stroke-linecap: round; opacity: .85; }
.dw { display: grid; gap: 10px; justify-items: center; width: 100%; }
.dw-wall { display: flex; flex-direction: column; gap: 3px; width: min(340px, 100%); padding: 10px 8px 6px; border-radius: 16px; background: #c8dcb0; box-shadow: inset 0 -10px 0 #9ab47c; }
.dw-row { position: relative; display: flex; gap: 0; height: 30px; }
.dw-row.now { outline: 2px dashed #8d877c; outline-offset: 2px; border-radius: 6px; background: rgba(255, 255, 255, .35); }
.dw-row.now.weak { outline-color: #d9534f; }
.dw-row.footing { opacity: .8; }
.dw-row.done.weak .dw-s { filter: saturate(.4) brightness(1.05); }
.dw-s { display: block; height: 100%; flex: none; box-sizing: border-box; border: 1.5px solid #6b6359; border-radius: 7px 9px 6px 8px; background: #a59f94; }
.dw-s.s1 { background: #b3ada2; border-radius: 9px 6px 8px 7px; }
.dw-s.s2 { background: #9a948a; border-radius: 6px 8px 9px 6px; }
.dw-s.s3 { background: #bdb6a8; border-radius: 8px 7px 6px 9px; }
.dw-g { position: absolute; top: -3px; bottom: -3px; width: 0; border-left: 2px dotted #d9534f; margin-left: -1px; pointer-events: none; }
.dw-heap { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; width: min(340px, 100%); }
.mini-stage .dw-h { position: relative; display: grid; place-items: center; min-height: 64px; padding: 8px 6px 16px; border-radius: 14px; background: #fff7e2; box-shadow: 0 4px 0 #d9c38c; }
.dw-h .dw-s { height: 26px; }
.dw-h small { position: absolute; bottom: 3px; left: 0; right: 0; text-align: center; font-size: 11px; font-weight: 900; color: var(--muted); }
.dw-h.off { opacity: .35; }
.dw-h:active { transform: translateY(2px); box-shadow: 0 2px 0 #d9c38c; }
.dw-foot { display: grid; gap: 6px; justify-items: center; width: min(340px, 100%); }
.mini-stage .dw-rummage { min-height: 44px; padding: 8px 16px; border-radius: 12px; background: #f1eadb; color: #6b6048; font-weight: 900; box-shadow: 0 3px 0 #dcd2bb; }
`;
