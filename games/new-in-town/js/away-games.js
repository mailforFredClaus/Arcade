// New in Town: going away, the games. Packing the case before the taxi comes
// (fit the shapes into the case; not everything will go, so the things you
// cannot do without come first), and finding your lot again on a crowded
// beach with the ice creams melting. Each reports how it went from 0 to 1,
// as the work games do (see playMini in mini.js); away.js decides what came of
// it. The puzzles are made here, with no screen, so that they can be checked:
// a case can always be packed full, and your lot is always on the beach once.

import { GAMES } from './mini.js';
import { sfx, haptic } from '../../../shared/arcade.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const press = (node, fn) => node.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });
const pick = (rnd, list) => list[Math.floor(rnd() * list.length)];
const shuffle = (rnd, list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---- the case -----------------------------------------------------------------------------

// What goes in, by how many squares of the case it takes. must: you cannot go without it.
export const PACK_ITEMS = {
  1: [['🛂', 'Passport', true], ['🧴', 'Suncream', true], ['🪥', 'Toothbrush', true], ['💊', 'Pills', true], ['🕶️', 'Sunglasses', false], ['🔌', 'Charger', false]],
  2: [['🩱', 'Swimming things', true], ['🧦', 'Socks', true], ['👟', 'Shoes', false], ['📚', 'Books', false], ['📷', 'Camera', false], ['👒', 'Sun hat', false]],
  3: [['👖', 'Trousers', true], ['🧼', 'Wash bag', true], ['🩴', 'Flip-flops', false], ['🎒', 'Day bag', false]],
  4: [['🧥', 'Jumper', true], ['👗', 'Best outfit', false], ['🏖️', 'Beach towel', false], ['🥾', 'Boots', false]],
};
// What will not go, whatever you do (somebody always wants to bring them).
export const PACK_EXTRAS = [['🎸', 'Guitar'], ['🪑', 'Deckchair'], ['🧸', 'Teddy'], ['🏓', 'Bats and balls'], ['🪁', 'Kite']];

// Turning a shape a quarter round, and setting it back in its corner.
export const norm = (cells) => { const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1])); return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
export const spin = (cells) => norm(cells.map(([x, y]) => [-y, x]));
// The square of a shape that goes where you tap: its first, reading across the top.
export const anchor = (cells) => norm(cells)[0];
// Where a shape would go if its anchor were put at (cx, cy), or null if it will not fit there.
// grid: one entry a square, null where it is empty.
export function placeAt(grid, w, h, cells, cx, cy) {
  const [ax, ay] = anchor(cells), out = [];
  for (const [x, y] of norm(cells)) {
    const gx = cx + x - ax, gy = cy + y - ay;
    if (gx < 0 || gy < 0 || gx >= w || gy >= h || grid[gy * w + gx] != null) return null;
    out.push(gy * w + gx);
  }
  return out;
}

// A case w by h, cut into pieces that fill it exactly (so it can always be packed full), each turned
// any way round, and a couple more that will not go in as well. Every piece is { id, cells, icon, name,
// must, spare }, and the answer is where each of the case's own pieces goes: { id, cells (the way round
// it fits), x, y } with (x, y) its anchor.
export function packPuzzle(rnd, level = 0) {
  const w = 5, h = level >= 3 ? 5 : 4, n = w * h, owner = new Array(n).fill(-1), pieces = [], answer = [];
  const nb = (i) => { const x = i % w, y = (i - x) / w, o = []; if (x > 0) o.push(i - 1); if (x < w - 1) o.push(i + 1); if (y > 0) o.push(i - w); if (y < h - 1) o.push(i + w); return o; };
  const used = { 1: [], 2: [], 3: [], 4: [] };
  for (let start = 0; start < n; start++) {
    if (owner[start] >= 0) continue;
    const want = pick(rnd, [1, 2, 2, 3, 3, 3, 4, 4]), id = pieces.length, region = [start];
    owner[start] = id;
    while (region.length < want) {
      const can = [...new Set(region.flatMap(nb))].filter((j) => owner[j] < 0);
      if (!can.length) break;
      const j = pick(rnd, can);
      owner[j] = id; region.push(j);
    }
    const cells = norm(region.map((i) => [i % w, (i - (i % w)) / w]));
    const size = Math.min(4, cells.length);
    const pool = PACK_ITEMS[size].filter((it) => !used[size].includes(it[1]));
    const [icon, name, must] = pool.length ? pick(rnd, pool) : pick(rnd, PACK_ITEMS[size]);
    used[size].push(name);
    // (The anchor of a shape is its first square reading across: the region's own first square.)
    const first = region.map((i) => [i % w, (i - (i % w)) / w]).sort((a, b) => a[1] - b[1] || a[0] - b[0])[0];
    answer.push({ id, cells, x: first[0], y: first[1] });
    let shown = cells;
    for (let r = Math.floor(rnd() * 4); r > 0; r--) shown = spin(shown);
    pieces.push({ id, cells: shown, icon, name, must: !!must, spare: false });
  }
  // (Two more that there is no room for.)
  for (const [icon, name] of shuffle(rnd, PACK_EXTRAS).slice(0, 2)) {
    const shapes = [[[0, 0], [1, 0]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [0, 1], [1, 1]]];
    pieces.push({ id: pieces.length, cells: pick(rnd, shapes), icon, name, must: false, spare: true });
  }
  return { w, h, pieces: shuffle(rnd, pieces), answer };
}
// How a case stands: the things you cannot do without count most, then how full it is.
export function packScore(pz, placed) {
  const must = pz.pieces.filter((p) => p.must), inMust = must.filter((p) => placed[p.id]).length;
  const full = pz.pieces.filter((p) => placed[p.id]).reduce((a, p) => a + p.cells.length, 0) / (pz.w * pz.h);
  return clamp(0.55 * (must.length ? inMust / must.length : 1) + 0.45 * full, 0, 1);
}

// ---- the beach ----------------------------------------------------------------------------

export const UMBRELLAS = [['#e2493d', 'red'], ['#2a7fd4', 'blue'], ['#f2b705', 'yellow'], ['#2f9e5b', 'green'], ['#8a4fc7', 'purple']];
export const TOWELS = [['#ff8fa3', 'pink'], ['#5bc0eb', 'sky-blue'], ['#ff9f1c', 'orange'], ['#3d405b', 'navy'], ['#f4f1e8', 'white']];
export const THINGS = [['🪣', 'a bucket'], ['🏐', 'a ball'], ['🐕', 'a dog'], ['📻', 'a radio'], ['🧺', 'a picnic basket'], ['🥪', 'sandwiches']];
// A crowded beach: cols by rows of spots, each an umbrella, a towel and a thing, and yours among them
// exactly once. Many of the others are nearly yours (two things out of three the same).
export function beachRound(rnd, level = 0) {
  const cols = 4, rows = 5, n = cols * rows;
  const mine = { u: Math.floor(rnd() * UMBRELLAS.length), t: Math.floor(rnd() * TOWELS.length), x: Math.floor(rnd() * THINGS.length) };
  const same = (a) => a.u === mine.u && a.t === mine.t && a.x === mine.x;
  const near = Math.min(0.75, 0.35 + level * 0.08), spots = [];
  for (let i = 0; i < n - 1; i++) {
    let s;
    do {
      s = { u: Math.floor(rnd() * UMBRELLAS.length), t: Math.floor(rnd() * TOWELS.length), x: Math.floor(rnd() * THINGS.length) };
      if (rnd() < near) { const k = Math.floor(rnd() * 3); s = { ...mine, [['u', 't', 'x'][k]]: s[['u', 't', 'x'][k]] }; }
    } while (same(s));
    spots.push(s);
  }
  const at = Math.floor(rnd() * n);
  spots.splice(at, 0, { ...mine });
  return { cols, rows, spots, mine, at };
}
export const BEACH_ROUNDS = 5;

const spotHtml = (s) => `<span class="aw-umb" style="--u:${UMBRELLAS[s.u][0]}"></span><span class="aw-towel" style="--t:${TOWELS[s.t][0]}"></span><i>${THINGS[s.x][0]}</i>`;
const spotSaid = (s) => `a ${UMBRELLAS[s.u][1]} umbrella, a ${TOWELS[s.t][1]} towel and ${THINGS[s.x][1]}`;

Object.assign(GAMES, {
  awayPack: {
    how: 'The taxi is coming. Tap a thing, then tap the case where it should go (its top left square goes where you tap). ↻ turns it. Tap something in the case to take it out. The starred things you cannot do without; not everything will fit.',
    time: 50,
    words: ['A shambles', 'It shuts, just', 'Neatly packed', 'A work of art'],
    play(api) {
      const pz = packPuzzle(api.rnd, api.level), { w, h } = pz, grid = new Array(w * h).fill(null), placed = {};
      const shape = {}; for (const p of pz.pieces) shape[p.id] = p.cells;
      let sel = null, over = false;
      const box = el('div', 'aw-pack', `<div class="aw-case" style="--w:${w};--h:${h}"></div><p class="mg-tally aw-say"></p><div class="aw-tray"></div><div class="aw-row"><button class="aw-turn">↻ Turn it</button><button class="mg-go aw-shut">Shut the case</button></div>`);
      api.stage.append(box);
      const caseEl = box.querySelector('.aw-case'), tray = box.querySelector('.aw-tray'), say = box.querySelector('.aw-say');
      const byId = (id) => pz.pieces.find((p) => p.id === id);
      const mini = (cells, icon) => { const mw = Math.max(...cells.map((c) => c[0])) + 1, mh = Math.max(...cells.map((c) => c[1])) + 1; return `<span class="aw-shape" style="--mw:${mw};--mh:${mh}">${cells.map(([x, y], i) => `<b style="grid-column:${x + 1};grid-row:${y + 1}">${i === 0 ? icon : ''}</b>`).join('')}</span>`; };
      const draw = () => {
        caseEl.innerHTML = grid.map((id, i) => { const p = id == null ? null : byId(id); const head = p && placed[id] && placed[id][0] === i; return `<button class="aw-sq${p ? ' full' : ''}${p && p.must ? ' must' : ''}" data-i="${i}" style="${p ? `--hue:${(p.id * 47) % 360}` : ''}">${head ? p.icon : ''}</button>`; }).join('');
        tray.innerHTML = pz.pieces.filter((p) => !placed[p.id]).map((p) => `<button class="aw-piece${sel === p.id ? ' sel' : ''}${p.must ? ' must' : ''}" data-id="${p.id}" aria-label="${p.name}">${mini(shape[p.id], p.icon)}<small>${p.must ? '★ ' : ''}${p.name}</small></button>`).join('') || '<p class="aw-done">Everything that will go is in.</p>';
        const must = pz.pieces.filter((p) => p.must), inn = must.filter((p) => placed[p.id]).length;
        say.textContent = sel != null ? `${byId(sel).name}: now tap the case.` : `★ ${inn} of ${must.length} things you cannot do without packed.`;
      };
      const full = () => grid.every((v) => v != null);
      const perfect = () => full() && pz.pieces.filter((p) => p.must).every((p) => placed[p.id]);
      const finish = () => { if (over) return; over = true; api.finish(perfect() ? 0.88 + 0.12 * api.left() / api.total : packScore(pz, placed) * 0.92); };
      const put = (id, i) => {
        const cx = i % w, cy = (i - cx) / w, where = placeAt(grid, w, h, shape[id], cx, cy);
        if (!where) { sfx('nope'); haptic(); say.textContent = 'It will not go there.'; return false; }
        for (const j of where) grid[j] = id;
        placed[id] = where; sel = null; sfx('pop');
        draw();
        if (perfect()) { say.textContent = 'Everything in, and it shuts.'; finish(); }
        return true;
      };
      press(tray, (e) => { const b = e.target.closest('[data-id]'); if (!b || over) return; const id = Number(b.dataset.id); sel = sel === id ? null : id; sfx('tap'); draw(); });
      press(caseEl, (e) => {
        const b = e.target.closest('[data-i]'); if (!b || over) return;
        const i = Number(b.dataset.i), at = grid[i];
        if (at != null) { for (const j of placed[at]) grid[j] = null; delete placed[at]; sel = at; sfx('tap'); draw(); return; }
        if (sel != null) put(sel, i);
      });
      press(box.querySelector('.aw-turn'), () => { if (sel == null || over) return; shape[sel] = spin(shape[sel]); sfx('flip'); draw(); });
      press(box.querySelector('.aw-shut'), () => { if (!over) finish(); });
      draw();
      return {
        score: () => packScore(pz, placed) * 0.92,
        auto: () => {
          for (const id of Object.keys(placed)) { for (const j of placed[id]) grid[j] = null; delete placed[id]; }
          for (const a of pz.answer) { shape[a.id] = a.cells; const where = placeAt(grid, w, h, a.cells, a.x, a.y); for (const j of where) grid[j] = a.id; placed[a.id] = where; }
          draw(); finish();
        },
      };
    },
  },

  awayBeach: {
    how: 'You have been to the van for ice creams, and the beach has filled up. Find your lot again before they melt: tap your umbrella, your towel and your things, five times over.',
    time: 40,
    words: ['Melted', 'Sticky, but home', 'Back in good time', 'Not a drip spilt'],
    play(api) {
      let round = null, got = 0, wrong = 0, over = false;
      const box = el('div', 'aw-beach', '<div class="aw-mine"><span>Your lot:</span><b class="aw-spot aw-me"></b><small class="aw-said"></small></div><div class="aw-sand"></div><p class="mg-tally aw-say"></p>');
      api.stage.append(box);
      const sand = box.querySelector('.aw-sand'), me = box.querySelector('.aw-me'), said = box.querySelector('.aw-said'), say = box.querySelector('.aw-say');
      const tally = (t) => { say.textContent = `${t ? `${t} ` : ''}🍦 ${got} of ${BEACH_ROUNDS} trips back`; };
      const next = () => {
        round = beachRound(api.rnd, api.level);
        me.innerHTML = spotHtml(round.mine);
        said.textContent = spotSaid(round.mine);
        sand.innerHTML = round.spots.map((s, i) => `<button class="aw-spot" data-i="${i}" aria-label="${spotSaid(s)}">${spotHtml(s)}</button>`).join('');
      };
      const score = (done) => clamp(got / BEACH_ROUNDS * 0.8 + (done ? 0.2 * api.left() / api.total : 0) - wrong * 0.03, 0, 1);
      const tap = (i) => {
        if (over) return;
        if (i === round.at) {
          got++; sfx('pop');
          if (got >= BEACH_ROUNDS) { over = true; tally('Home and dry.'); api.finish(score(true)); return; }
          tally('Found them.'); next(); return;
        }
        wrong++; api.lose(2); sfx('nope'); haptic();
        const b = sand.querySelector(`[data-i="${i}"]`); if (b) { b.classList.add('no'); api.after(380, () => b.classList.remove('no')); }
        tally('Not yours. A man in a hat glares.');
      };
      press(sand, (e) => { const b = e.target.closest('[data-i]'); if (b) tap(Number(b.dataset.i)); });
      next(); tally('');
      return { score: () => score(false), auto: () => { while (!over) tap(round.at); } };
    },
  },
});

// The look of both, added to the page by away-ui.js.
export const GAME_CSS = `
.aw-pack { display: grid; gap: 8px; justify-items: center; width: 100%; max-width: 340px; }
.aw-case { box-sizing: border-box; display: grid; grid-template-columns: repeat(var(--w), 1fr); gap: 3px; padding: 7px; width: min(300px, 100%, calc((100vh - 330px) * var(--w) / var(--h))); width: min(300px, 100%, calc((100dvh - 330px) * var(--w) / var(--h))); border-radius: 14px; background: #7a4b2a; box-shadow: inset 0 0 0 3px #5c3519, 0 3px 0 #4a2a12; }
.mini-stage .aw-sq { aspect-ratio: 1; min-width: 0; padding: 0; border-radius: 6px; background: #f1e3c6; box-shadow: inset 0 1px 0 #00000014; display: grid; place-items: center; font-size: 22px; line-height: 1; }
.aw-sq.full { background: hsl(var(--hue) 55% 78%); box-shadow: inset 0 -3px 0 hsl(var(--hue) 40% 62%); }
.aw-sq.full.must { background: hsl(var(--hue) 65% 72%); }
.aw-say { min-height: 2.6em; }
.aw-tray { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; width: 100%; max-height: 32vh; overflow-y: auto; }
.mini-stage .aw-piece { min-width: 64px; min-height: 56px; padding: 6px 6px 4px; border-radius: 12px; background: #fff; box-shadow: 0 3px 0 #e2d6bb; display: grid; justify-items: center; gap: 3px; }
.aw-piece.must { background: #fff7df; }
.aw-piece.sel { background: #dff1f4; box-shadow: 0 0 0 3px var(--teal), 0 3px 0 var(--teal-edge); }
.aw-piece small { font-size: 10.5px; font-weight: 800; color: var(--muted); line-height: 1.1; max-width: 76px; }
.aw-shape { display: grid; grid-template-columns: repeat(var(--mw), 15px); grid-template-rows: repeat(var(--mh), 15px); gap: 1px; }
.aw-shape b { border-radius: 3px; background: #d8c59c; font-size: 11px; line-height: 15px; text-align: center; font-weight: 400; }
.aw-row { display: flex; gap: 8px; width: 100%; justify-content: center; }
.mini-stage .aw-turn { min-height: 48px; padding: 8px 16px; border-radius: 14px; background: #f1eadb; color: #6b6048; font-size: 16px; font-weight: 900; box-shadow: 0 3px 0 #dcd2bb; }
.aw-shut { min-height: 48px; padding: 8px 18px; font-size: 16px; }
.aw-done { margin: 6px 0; font-size: 14px; font-weight: 800; color: var(--good); }
.aw-beach { display: grid; gap: 8px; justify-items: center; width: 100%; max-width: 340px; }
.aw-mine { display: grid; grid-template-columns: auto auto; grid-template-rows: auto auto; column-gap: 10px; align-items: center; justify-content: center; }
.aw-mine span { font-size: 14px; font-weight: 900; color: var(--ink); }
.aw-mine small { grid-column: 1 / 3; font-size: 12.5px; font-weight: 800; color: var(--muted); text-align: center; }
.aw-sand { box-sizing: border-box; display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; width: min(320px, 100%, calc((100vh - 290px) * 0.8)); width: min(320px, 100%, calc((100dvh - 290px) * 0.8)); padding: 7px; border-radius: 16px; background: #f3dfae; background-image: radial-gradient(#e6cf96 1.2px, #0000 1.6px); background-size: 11px 11px; box-shadow: 0 3px 0 #dcc58d; }
.aw-spot { position: relative; display: block; min-width: 0; min-height: 44px; aspect-ratio: 1; padding: 0; border-radius: 12px; background: #fbefcc; box-shadow: 0 2px 0 #e0c991; overflow: hidden; }
.aw-me { width: 58px; height: 58px; }
.aw-umb { position: absolute; left: 14%; top: 6%; width: 62%; aspect-ratio: 1; border-radius: 50%; background: repeating-conic-gradient(var(--u) 0 30deg, #fffdf6 30deg 60deg); box-shadow: 0 1px 2px #0003; }
.aw-towel { position: absolute; right: 7%; bottom: 8%; width: 42%; height: 46%; border-radius: 4px; background: var(--t); box-shadow: inset 0 0 0 2px #ffffff55, 0 1px 0 #0002; }
.aw-spot i { position: absolute; left: 6%; bottom: 4%; font-style: normal; font-size: 18px; line-height: 1; }
.aw-spot.no { animation: aw-no .38s; }
@keyframes aw-no { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
`;
