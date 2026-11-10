// Gem Swap: the levels. Every level is built from its number, so the same
// number is the same level on every device: a board shape, what's on it,
// the goals, and a number of moves set by letting the practice player try
// the level again and again.
//
// The first levels bring in one new thing each. After that, levels mix
// what's been met so far, getting slowly busier. Every 5th level from 10 is
// HARD, every 20th SUPER HARD: they're set so the practice player only
// wins about half the time (or less), where normal levels it wins nearly
// always. The level after a hard one is a TREAT: four colours, treasure
// chests, power-ups already on the board and moves to spare.
//
// The practice player also says how long a level is. One it finishes in a
// handful of moves is given more to do; one that swings between quick and
// endless (so it's down to luck) is thrown away for another.

import { Board, Rand, mix, LINE_H, LINE_V, BOMB, FLY, PRISM } from './engine.js';
import { practise } from './bot.js';

export const GEN_VERSION = 2;

export function tierOf(n) {
  if (n >= 20 && n % 20 === 0) return 'super';
  if (n >= 10 && n % 5 === 0) return 'hard';
  return 'normal';
}

// The level where each thing first appears (the game explains it there).
// Things on the board (crates, ice, chains, coins) are explained the first
// time a level has them; see intros().
export const INTRO = { 1: 'basics', 2: 'line', 3: 'bomb', 5: 'fly', 7: 'prism', 9: 'combo' };

// What a level has on it that might need explaining.
export function intros(lv) {
  const out = [];
  if (INTRO[lv.n]) out.push(INTRO[lv.n]);
  const most = (arr) => arr.reduce((m, v, i) => (lv.on[i] ? Math.max(m, v) : m), 0);
  const crate = most(lv.crate), ice = most(lv.ice);
  if (crate >= 1) out.push('crate');
  if (crate >= 2) out.push('crate2');
  if (crate >= 3) out.push('crate3');
  if (ice >= 1) out.push('ice');
  if (ice >= 2) out.push('ice2');
  if (lv.chest && most(lv.chest)) out.push('chest');
  if (most(lv.chain)) out.push('chain');
  if (lv.goals.some((g) => g.type === 'coin')) out.push('coin');
  return out;
}
const UNLOCK = { crate: 4, ice: 8, chain: 12, coin: 14, crate2: 11, ice2: 17, crate3: 22, six: 20, start: 6, chest: 16 };

// What sort of level this is: 'normal', 'hard', 'super' or 'treat'.
export function flavourOf(n) {
  const tier = tierOf(n);
  if (tier !== 'normal') return tier;
  return n >= UNLOCK.chest && n % 5 === 1 ? 'treat' : 'normal';
}

// Ten levels to a chapter.
export const chapterOf = (n) => Math.floor((Math.max(1, n) - 1) / 10);

const pick = (R, list) => list[R.int(list.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- board shapes ---------------------------------------------------------------
// Each is mirrored left to right.

const SHAPES = ['full', 'corners', 'top', 'bottom', 'diamond', 'hourglass', 'window', 'arch', 'castle', 'twin', 'cross', 'bites', 'pillars', 'heart', 'octagon'];

function makeShape(name, w, h, R) {
  const on = new Array(w * h).fill(1);
  const off = (r, c) => {
    if (r < 0 || r >= h || c < 0 || c >= w) return;
    on[r * w + c] = 0;
    on[r * w + (w - 1 - c)] = 0;
  };
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  const each = (fn) => { for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (fn(r, c)) off(r, c); };
  const hw = w % 2 ? pick(R, [1, 3]) : 2; // width of a hole in the middle
  const mid = (c) => Math.abs(c - cx) < hw / 2;
  switch (name) {
    case 'corners': {
      const k = 1 + R.int(2);
      each((r, c) => Math.min(r, h - 1 - r) + Math.min(c, w - 1 - c) < k);
      break;
    }
    case 'octagon': {
      const k = Math.round(Math.min(w, h) / 3);
      each((r, c) => Math.min(r, h - 1 - r) + Math.min(c, w - 1 - c) < k);
      break;
    }
    case 'top': {
      const k = 2 + R.int(2);
      each((r, c) => r + Math.min(c, w - 1 - c) < k);
      break;
    }
    case 'bottom': {
      const k = 2 + R.int(2);
      each((r, c) => h - 1 - r + Math.min(c, w - 1 - c) < k);
      break;
    }
    case 'diamond':
      each((r, c) => Math.abs(c - cx) / (cx + 0.8) + Math.abs(r - cy) / (cy + 0.8) > 1.12);
      break;
    case 'hourglass': {
      const k = 1 + R.int(2);
      each((r, c) => Math.min(c, w - 1 - c) < Math.round(k * (1 - Math.abs(r - cy) / cy) * 1.6) - 0.5);
      break;
    }
    case 'window': {
      const hh = 1 + R.int(3);
      each((r, c) => mid(c) && Math.abs(r - cy) < hh / 2 + (h % 2 ? 0 : 0.5));
      break;
    }
    case 'arch': {
      const hh = 2 + R.int(2);
      each((r, c) => mid(c) && r >= h - hh);
      break;
    }
    case 'castle':
      each((r, c) => r === 0 && (Math.min(c, w - 1 - c) % 2 === 0));
      break;
    case 'twin': {
      const hh = 2 + R.int(2);
      each((r, c) => mid(c) && r < hh);
      break;
    }
    case 'cross': {
      const a = 2, b = 2 + R.int(2);
      each((r, c) => Math.min(c, w - 1 - c) < a && Math.min(r, h - 1 - r) < b);
      break;
    }
    case 'bites': {
      const k = 1 + R.int(2);
      each((r, c) => Math.min(c, w - 1 - c) < k && Math.abs(r - cy) < 1.6);
      break;
    }
    case 'pillars': {
      const c0 = Math.floor(cx) - 2;
      each((r, c) => c === c0 && r >= 2 && r <= h - 3);
      break;
    }
    case 'heart':
      each((r, c) => {
        const x = (c - cx) / (cx + 0.9) * 1.25, y = (cy - r) / (cy + 0.9) * 1.25 + 0.2;
        const t = x * x + y * y - 1;
        return t * t * t - x * x * y * y * y > 0;
      });
      break;
    default: // full
  }
  return on;
}

function connected(on, w, h) {
  const start = on.indexOf(1);
  if (start < 0) return false;
  const seen = new Uint8Array(w * h);
  const stack = [start];
  seen[start] = 1;
  let n = 1;
  while (stack.length) {
    const i = stack.pop(), r = (i / w) | 0, c = i % w;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const rr = r + dr, cc = c + dc, j = rr * w + cc;
      if (rr < 0 || cc < 0 || rr >= h || cc >= w || !on[j] || seen[j]) continue;
      seen[j] = 1;
      n++;
      stack.push(j);
    }
  }
  return n === on.reduce((s, v) => s + v, 0);
}

// Every cell should be able to sit in some line of three.
function lineable(on, w, h) {
  const at = (r, c) => r >= 0 && c >= 0 && r < h && c < w && on[r * w + c];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!at(r, c)) continue;
      let ok = false;
      for (let k = -2; k <= 0 && !ok; k++) ok = (at(r, c + k) && at(r, c + k + 1) && at(r, c + k + 2)) || (at(r + k, c) && at(r + k + 1, c) && at(r + k + 2, c));
      if (!ok) return false;
    }
  }
  return true;
}

// ---- what goes on the board -------------------------------------------------------

class Layout {
  constructor(w, h, on) {
    this.w = w;
    this.h = h;
    this.on = on;
    const N = w * h;
    this.crate = new Array(N).fill(0);
    this.chain = new Array(N).fill(0);
    this.ice = new Array(N).fill(0);
    this.coin = new Array(N).fill(0);
    this.chest = new Array(N).fill(0); // the power-up inside a crate
    this.power = new Array(N).fill(0); // power-ups on the board at the start
  }
  ok(r, c) { return r >= 0 && c >= 0 && r < this.h && c < this.w && this.on[r * this.w + c]; }
  // Set a cell and its mirror image.
  set(arr, r, c, v) {
    if (!this.ok(r, c)) return;
    this[arr][r * this.w + c] = v;
    this[arr][r * this.w + (this.w - 1 - c)] = v;
  }
  free(r, c) { return this.ok(r, c) && !this.crate[r * this.w + c]; }
  count(arr) { return this[arr].reduce((s, v) => s + (v ? 1 : 0), 0); }
  cells() { return this.on.reduce((s, v) => s + v, 0); }
}

// Crates. amount 0..1; hp: the toughest crate.
function placeCrates(L, R, { style, amount = 0.5, hp = 1 }) {
  const { w, h } = L, cx = (w - 1) / 2, cy = (h - 1) / 2;
  const tough = (k) => clamp(k, 1, hp);
  switch (style) {
    case 'floor': {
      const rows = clamp(Math.round(1 + amount * 2.6), 1, 4);
      for (let j = 0; j < rows; j++) for (let c = 0; c < w; c++) L.set('crate', h - 1 - j, c, tough(hp - j));
      break;
    }
    case 'blocks': {
      const spots = [];
      for (let r = 2; r + 1 < h; r++) for (let c = 0; c + 1 <= cx; c++) spots.push([r, c]);
      const n = clamp(Math.round(1 + amount * 3), 1, 4);
      for (let k = 0; k < n && spots.length; k++) {
        const [r, c] = spots.splice(R.int(spots.length), 1)[0];
        const v = tough(1 + R.int(hp));
        for (const [dr, dc] of [[0, 0], [0, 1], [1, 0], [1, 1]]) L.set('crate', r + dr, c + dc, v);
      }
      break;
    }
    case 'band': {
      const r0 = Math.round(cy) + R.int(2);
      const rows = amount > 0.6 ? 2 : 1;
      for (let j = 0; j < rows; j++) for (let c = 0; c < w; c++) if (Math.abs(c - cx) > 0.6 || w % 2 === 0) L.set('crate', r0 + j, c, tough(hp - j));
      // Gaps to let gems through.
      const gap = 1 + R.int(Math.max(1, Math.floor(cx) - 1));
      for (let j = 0; j < rows; j++) L.set('crate', r0 + j, gap, 0);
      break;
    }
    case 'pillars': {
      const c = 1 + R.int(Math.max(1, Math.floor(cx) - 1));
      const top = clamp(Math.round(h * (0.65 - amount * 0.35)), 2, h - 2);
      for (let r = top; r < h; r++) L.set('crate', r, c, tough(hp - (r === top ? 1 : 0)));
      break;
    }
    case 'corners': {
      const k = clamp(Math.round(2 + amount * 2.5), 2, 5);
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (h - 1 - r + c < k) L.set('crate', r, c, tough(hp - (h - 1 - r + c === k - 1 ? 1 : 0)));
      break;
    }
    case 'frame': {
      const r0 = clamp(Math.round(cy - 1 - amount * 1.5), 1, h - 3), r1 = h - 1 - Math.max(1, r0 - 1);
      const c0 = clamp(Math.round(cx - 1 - amount * 1.5), 0, w - 3);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= cx; c++) {
        if (r === r0 || r === r1 || c === c0) L.set('crate', r, c, tough(hp));
      }
      break;
    }
    case 'center': {
      const k = 1 + amount * 1.8;
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (Math.abs(r - cy - 0.5) + Math.abs(c - cx) <= k) L.set('crate', r, c, tough(hp - (Math.abs(r - cy - 0.5) + Math.abs(c - cx) > k - 1 ? 1 : 0)));
      break;
    }
    default: { // scatter
      const n = clamp(Math.round(2 + amount * 7), 2, 9);
      for (let k = 0; k < n; k++) {
        const r = 2 + R.int(h - 2), c = R.int(Math.ceil(w / 2));
        L.set('crate', r, c, tough(1 + R.int(hp)));
      }
    }
  }
}

function placeIce(L, R, { style, amount = 0.5, hp = 1 }) {
  const { w, h } = L, cx = (w - 1) / 2, cy = (h - 1) / 2;
  const put = (r, c, v) => { if (L.free(r, c)) L.set('ice', r, c, v); };
  const deep = (inner) => (hp > 1 && inner ? 2 : 1);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const dx = Math.abs(c - cx) / (cx + 0.5), dy = Math.abs(r - cy) / (cy + 0.5);
      let on = false, inner = false;
      switch (style) {
        case 'all': on = true; inner = dx + dy < 0.7; break;
        case 'center': on = Math.max(dx, dy) < 0.45 + amount * 0.35; inner = Math.max(dx, dy) < 0.3; break;
        case 'bottom': on = r >= h * (0.6 - amount * 0.3); inner = r >= h - 2; break;
        case 'top': on = r < h * (0.4 + amount * 0.3); inner = r < 2; break;
        case 'frame': on = Math.max(dx, dy) > 0.62 - amount * 0.3; inner = Math.max(dx, dy) > 0.85; break;
        case 'checker': on = (r + Math.round(Math.min(c, w - 1 - c))) % 2 === 0; inner = dx + dy < 0.5; break;
        case 'cross': on = dx < 0.2 + amount * 0.25 || dy < 0.2 + amount * 0.25; inner = dx < 0.2 && dy < 0.2; break;
        case 'stripes': on = r % 2 === (h % 2 ? 0 : 1); inner = r % 4 === 0; break;
        default: on = dx + dy < 0.6 + amount * 0.5; inner = dx + dy < 0.45; // diamond
      }
      if (on) put(r, c, deep(inner));
    }
  }
}

function placeChains(L, R, { style, amount = 0.5 }) {
  const { w, h } = L, cx = (w - 1) / 2, cy = (h - 1) / 2;
  const put = (r, c) => { if (L.free(r, c)) L.set('chain', r, c, 1); };
  switch (style) {
    case 'row': {
      const r0 = 1 + R.int(h - 3);
      for (let c = 0; c < w; c++) if (Math.min(c, w - 1 - c) % 2 === 0 || amount > 0.6) put(r0, c);
      if (amount > 0.5) for (let c = 0; c < w; c++) if (Math.min(c, w - 1 - c) % 2 === 1) put(r0 + 2, c);
      break;
    }
    case 'diag':
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (Math.abs(Math.abs(c - cx) - Math.abs(r - cy)) < 0.6 && R.next() < 0.5 + amount * 0.5) put(r, c);
      break;
    case 'cols': {
      const c = R.int(Math.ceil(w / 2));
      for (let r = 1; r < h; r++) if (r % 2 || amount > 0.6) put(r, c);
      break;
    }
    case 'frame':
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if ((r === 1 || r === h - 2 || c === 1) && (r + c) % 2 === 0) put(r, c);
      break;
    default: { // scatter
      const n = clamp(Math.round(3 + amount * 6), 3, 9);
      for (let k = 0; k < n; k++) put(R.int(h), R.int(Math.ceil(w / 2)));
    }
  }
}

// Some of the crates become treasure chests. pairs: how many, each with
// its mirror image.
function placeChests(L, R, pairs) {
  const { w, h } = L, spots = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < Math.ceil(w / 2); c++) if (L.crate[r * w + c]) spots.push([r, c]);
  for (let k = 0; k < pairs && spots.length; k++) {
    const [r, c] = spots.splice(R.int(spots.length), 1)[0];
    L.set('chest', r, c, R.next() < 0.08 ? PRISM : pick(R, [LINE_H, LINE_V, BOMB, BOMB, FLY]));
    // A chest is never the toughest sort of crate.
    L.set('crate', r, c, Math.min(2, L.crate[r * w + c]));
  }
}

// Power-ups lying on the board when the level starts.
function placeStart(L, R, pairs) {
  const { w, h } = L, spots = [];
  for (let r = 1; r < h; r++) for (let c = 0; c < Math.ceil(w / 2); c++) {
    const i = r * w + c;
    if (L.on[i] && !L.crate[i] && !L.chain[i] && !L.coin[i]) spots.push([r, c]);
  }
  for (let k = 0; k < pairs && spots.length; k++) {
    const [r, c] = spots.splice(R.int(spots.length), 1)[0];
    L.set('power', r, c, pick(R, [LINE_H, LINE_V, LINE_H, LINE_V, BOMB, BOMB, FLY]));
  }
}

function placeCoins(L, R, max) {
  const { w, h } = L, spots = [];
  for (let r = 0; r < Math.max(3, Math.floor(h / 2)); r++) for (let c = 0; c < w; c++) {
    const i = r * w + c;
    if (L.on[i] && !L.crate[i] && !L.chain[i]) spots.push(i);
  }
  for (let k = 0; k < max && spots.length; k++) L.coin[spots.splice(R.int(spots.length), 1)[0]] = 1;
}

// Can new gems reach every free cell, falling straight down or sideways
// round the crates and chains?
function reachable(L) {
  const { w, h, on } = L, N = w * h;
  const block = (i) => !on[i] || L.crate[i] || L.chain[i];
  const seen = new Uint8Array(N), stack = [];
  for (let c = 0; c < w; c++) {
    for (let r = 0; r < h; r++) {
      const i = r * w + c;
      if (!on[i]) continue;
      if (!block(i)) { seen[i] = 1; stack.push(i); }
      break;
    }
  }
  while (stack.length) {
    const i = stack.pop(), r = (i / w) | 0, c = i % w;
    // Straight down (over any holes) and diagonally down.
    let d = -1;
    for (let rr = r + 1; rr < h; rr++) if (on[rr * w + c]) { d = rr * w + c; break; }
    const next = [d];
    for (const dc of [-1, 1]) if (r + 1 < h && c + dc >= 0 && c + dc < w) next.push((r + 1) * w + c + dc);
    for (const j of next) {
      if (j < 0 || block(j) || seen[j]) continue;
      seen[j] = 1;
      stack.push(j);
    }
  }
  for (let i = 0; i < N; i++) if (!block(i) && !seen[i]) return false;
  return true;
}

// ---- planning a level ---------------------------------------------------------------

// The first levels, one new thing at a time.
const EARLY = {
  1: { w: 7, h: 7, shape: 'full', colorGoals: [10, 10] },
  2: { w: 8, h: 8, shape: 'corners', colorGoals: [20] },
  3: { w: 8, h: 9, shape: 'full', colorGoals: [15, 15] },
  4: { w: 8, h: 8, shape: 'full', crate: { style: 'floor', amount: 0.3, hp: 1 } },
  5: { w: 9, h: 9, shape: 'diamond', colorGoals: [22], crate: { style: 'blocks', amount: 0.3, hp: 1 } },
  6: { w: 9, h: 9, shape: 'top', crate: { style: 'band', amount: 0.2, hp: 1 } },
  7: { w: 9, h: 9, shape: 'full', colorGoals: [28, 28] },
  8: { w: 8, h: 9, shape: 'full', ice: { style: 'center', amount: 0.4, hp: 1 } },
  9: { w: 9, h: 9, shape: 'corners', ice: { style: 'frame', amount: 0.2, hp: 1 }, crate: { style: 'center', amount: 0.3, hp: 1 } },
  10: { w: 9, h: 10, shape: 'window', crate: { style: 'floor', amount: 0.4, hp: 1 }, ice: { style: 'top', amount: 0.3, hp: 1 } },
  11: { w: 9, h: 9, shape: 'octagon', crate: { style: 'blocks', amount: 0.6, hp: 2 } },
  12: { w: 9, h: 9, shape: 'full', chain: { style: 'scatter', amount: 0.5 }, colorGoals: [20] },
  13: { w: 9, h: 10, shape: 'arch', chain: { style: 'row', amount: 0.4 }, ice: { style: 'center', amount: 0.4, hp: 1 } },
  14: { w: 8, h: 9, shape: 'full', coin: { need: 3, max: 2 }, colorGoals: [16] },
};

function plan(n, R, tier, flavour) {
  if (EARLY[n]) return { colors: 5, ...EARLY[n] };
  const treat = flavour === 'treat';
  // Rises from 0 towards 1 as the levels go on (a ratio rather than an
  // exponential, so every browser works it out exactly the same).
  const hardness = (n / (n + 45)) * (treat ? 0.5 : 1) + (tier === 'super' ? 0.3 : tier === 'hard' ? 0.18 : 0);
  const amount = () => clamp(0.15 + hardness * 0.55 + (R.next() - 0.5) * 0.35, 0.05, 1);
  const p = { w: R.next() < 0.75 ? 9 : 8, h: pick(R, [9, 9, 10, 10, 8]), shape: pick(R, SHAPES) };
  // Which obstacles, favouring the newest ones for a while after they arrive.
  const kinds = [];
  const want = (k, base) => {
    if (n < UNLOCK[k]) return 0;
    const fresh = n - UNLOCK[k] < 12 ? 1.6 : 1;
    return base * fresh;
  };
  const weights = { crate: want('crate', 1.2), ice: want('ice', 1), chain: want('chain', 0.8), coin: want('coin', 0.6) };
  const howMany = treat ? 1 : R.next() < 0.1 ? 0 : R.next() < 0.55 - hardness * 0.25 ? 1 : R.next() < 0.88 ? 2 : 3;
  // A treat is always a treasure hunt: crates with chests among them.
  if (treat) kinds.push('crate');
  for (let k = kinds.length; k < howMany; k++) {
    const opts = Object.entries(weights).filter(([key, v]) => v > 0 && !kinds.includes(key));
    const total = opts.reduce((s, [, v]) => s + v, 0);
    let x = R.next() * total;
    for (const [key, v] of opts) {
      x -= v;
      if (x <= 0) { kinds.push(key); break; }
    }
  }
  const crateHp = n >= UNLOCK.crate3 ? 1 + R.int(3) : n >= UNLOCK.crate2 ? 1 + R.int(2) : 1;
  const iceHp = n >= UNLOCK.ice2 && R.next() < 0.6 ? 2 : 1;
  if (kinds.includes('crate')) p.crate = { style: pick(R, ['floor', 'blocks', 'band', 'pillars', 'corners', 'frame', 'center', 'scatter']), amount: amount(), hp: crateHp };
  if (kinds.includes('ice')) p.ice = { style: pick(R, ['all', 'center', 'bottom', 'top', 'frame', 'checker', 'cross', 'stripes', 'diamond']), amount: amount(), hp: iceHp };
  if (kinds.includes('chain')) p.chain = { style: pick(R, ['scatter', 'row', 'diag', 'cols', 'frame']), amount: amount() };
  if (kinds.includes('coin')) p.coin = { need: 2 + R.int(3) + Math.round(hardness * 2), max: 2 + (hardness > 0.5 ? R.int(2) : 0) };
  // Colour goals: always when there's nothing else to do, often alongside.
  if (!kinds.length) p.colorGoals = [20 + R.int(12), 20 + R.int(12)];
  else if (kinds.length === 1 && R.next() < 0.6) p.colorGoals = [16 + R.int(14) + Math.round(hardness * 10)];
  // Six colours make matches scarce: mostly kept for the hard levels.
  p.colors = treat ? 4 : n >= UNLOCK.six && R.next() < (tier === 'normal' ? 0.07 : 0.4) ? 6 : 5;
  if (p.crate && n >= UNLOCK.chest && (treat || R.next() < 0.45)) p.chests = treat ? 2 : 1 + R.int(2);
  if (treat) p.start = 1 + R.int(2);
  else if (n >= UNLOCK.start && R.next() < (tier === 'normal' ? 0.3 : 0.15)) p.start = 1;
  return p;
}

// Builds the board for a plan. Returns null if it doesn't come out right.
function build(p, R) {
  const { w, h } = p;
  const on = makeShape(p.shape, w, h, R);
  if (!connected(on, w, h) || !lineable(on, w, h) || on.reduce((s, v) => s + v, 0) < 40) return null;
  const L = new Layout(w, h, on);
  if (p.crate) placeCrates(L, R, p.crate);
  if (p.chain) placeChains(L, R, p.chain);
  if (p.ice) placeIce(L, R, p.ice);
  if (p.coin) placeCoins(L, R, p.coin.max);
  if (p.chests) placeChests(L, R, p.chests);
  if (p.start) placeStart(L, R, p.start);
  const cells = L.cells(), crates = L.count('crate');
  if (p.crate && crates < 4) return null;
  if (cells - crates < Math.max(30, cells * 0.55)) return null;
  if (p.chain && L.count('chain') < 3) return null;
  if (p.chain && L.count('chain') > (cells - crates) * 0.3) return null;
  if (p.ice && L.count('ice') < 6) return null;
  if (!reachable(L)) return null;
  return L;
}

function goalsFor(p, L, R, palette) {
  const goals = [];
  if (p.crate) goals.push({ type: 'crate', need: L.count('crate') });
  if (p.chain) goals.push({ type: 'chain', need: L.count('chain') });
  if (p.ice) goals.push({ type: 'ice', need: L.count('ice') });
  if (p.coin) goals.push({ type: 'coin', need: p.coin.need });
  const colors = palette.slice();
  for (const need of p.colorGoals || []) {
    const c = colors.splice(R.int(colors.length), 1)[0];
    goals.push({ type: 'color', color: c, need });
  }
  return goals;
}

// ---- moves: let the practice player have a go ----------------------------------------

const RUNS = 12;
const TOO_LONG = 40;
const TARGET = { normal: [0.85, 1], treat: [1, 2], hard: [0.55, 1], super: [0.4, 1] };

function calibrate(spec, flavour) {
  let [q, margin] = TARGET[flavour];
  // The first levels are gentler; the first hard one is only a little hard.
  if (spec.tier === 'normal' && spec.n <= 6) { q = 1; margin = 4; } else if (spec.tier === 'normal' && spec.n <= 14) { q = 0.92; margin = 2; } else if (spec.n <= 14) { q = 0.7; margin = 1; }
  // (One game that goes badly wrong is never what sets the moves.)
  const k = Math.min(RUNS - 2, Math.floor(q * RUNS));
  const used = [];
  let long = 0;
  for (let run = 0; run < RUNS; run++) {
    // A game it gives up on counts as a very long one.
    const u = Math.min(practise(spec, mix(spec.seed, run, 0xb07), TOO_LONG + 8), TOO_LONG + 9);
    used.push(u);
    // Once enough runs have taken too long, the answer can only be "too long".
    if (u > TOO_LONG && ++long >= RUNS - k) return { moves: Infinity, used };
  }
  used.sort((a, b) => a - b);
  const at = (x) => used[Math.min(RUNS - 1, Math.floor(x * RUNS))];
  // mid: a typical game. luck: how much longer an unlucky game takes.
  const mid = at(0.5), slow = Math.min(at(0.85), TOO_LONG + 8);
  return { moves: used[k] + margin, used, three: at(0.25), two: at(0.6), mid, luck: slow / Math.max(1, mid) };
}

// The fewest moves a typical game of a level should take.
function shortest(n, flavour) {
  if (n <= 3) return 5;
  if (n <= 10) return 8;
  if (flavour === 'treat') return 10;
  return n <= 20 ? 11 : 13;
}

// Gives a level that's over too soon more to do: more gems to collect.
// Returns false if there's nothing left to add.
function grow(spec, R) {
  const colour = spec.goals.filter((g) => g.type === 'color');
  if (!colour.length || (colour.length < 2 && spec.goals.length < 3 && colour[0].need >= 30)) {
    if (spec.goals.length >= 4) return false;
    const free = spec.colors.filter((c) => !colour.some((g) => g.color === c));
    spec.goals.push({ type: 'color', color: free[R.int(free.length)], need: 12 + R.int(7) });
    return true;
  }
  let grew = false;
  for (const g of colour) {
    if (g.need >= 70) continue;
    g.need = Math.min(70, g.need + Math.max(6, Math.round(g.need * 0.35)));
    grew = true;
  }
  return grew;
}

// ---- the whole level ---------------------------------------------------------------------

export function makeLevel(n) {
  n = Math.max(1, Math.floor(n) || 1);
  const tier = tierOf(n), flavour = flavourOf(n), least = shortest(n, flavour);
  let easeOff = false, best = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const R = new Rand(mix(n, attempt, GEN_VERSION, 0x6e75));
    const p = plan(n, R, tier, flavour);
    // Retries ease off a little if the level keeps coming out too long.
    if (easeOff) {
      // (The first levels are laid out by hand: only their goals ease.)
      if (!EARLY[n]) for (const k of ['crate', 'ice', 'chain']) if (p[k]) p[k].amount *= 0.7;
      if (p.colorGoals) p.colorGoals = p.colorGoals.map((x) => Math.round(x * 0.8));
      if (p.coin) p.coin.need = Math.max(2, p.coin.need - 2);
    }
    const L = build(p, R);
    if (!L) continue;
    // The colours this level uses, in a shuffled order.
    const all = [0, 1, 2, 3, 4, 5];
    for (let i = all.length - 1; i > 0; i--) {
      const j = R.int(i + 1);
      [all[i], all[j]] = [all[j], all[i]];
    }
    const colors = all.slice(0, p.colors).sort((a, b) => a - b);
    const spec = {
      n, v: GEN_VERSION, tier, flavour, w: L.w, h: L.h, on: L.on, crate: L.crate, chain: L.chain, ice: L.ice, coin: L.coin,
      chest: L.chest, power: L.power,
      colors, goals: goalsFor(p, L, R, colors), coinMax: p.coin ? p.coin.max : 0, moves: 0,
      seed: mix(n, attempt, GEN_VERSION, 0x5eed),
    };
    // Check the board really can be dealt.
    const b = new Board(spec, spec.seed);
    if (b.findGroups().length || !b.hasMove()) continue;
    let cal = calibrate(spec, flavour);
    for (let k = 0; k < 5 && Number.isFinite(cal.moves) && cal.mid < least; k++) {
      if (!grow(spec, R)) break;
      cal = calibrate(spec, flavour);
    }
    const last = attempt === 39;
    const tooLong = !Number.isFinite(cal.moves) || cal.moves > TOO_LONG;
    if (tooLong) easeOff = true;
    spec.moves = clamp(Number.isFinite(cal.moves) ? cal.moves : 40, 10, 45);
    // Stars: finish with this many moves to spare for 2 and 3 stars.
    const spare2 = clamp(spec.moves - (cal.two || spec.moves), 1, spec.moves - 1);
    const spare3 = clamp(spec.moves - (cal.three || spec.moves), spare2 + 1, spec.moves);
    spec.stars = [spare2, spare3];
    spec.practice = cal.used.map((u) => (Number.isFinite(u) ? u : -1));
    // How far it is from a good level: over too soon, or too much down to luck.
    const off = tooLong ? 99 : Math.max(0, least - cal.mid) + Math.max(0, cal.luck - 1.9) * 8;
    if (!best || off < best.off) best = { off, spec };
    if (off < 0.5 || (attempt >= 6 && best.off < 99) || last) break;
  }
  return best ? best.spec : null;
}
