// New in Town: the thinking behind the games you play at work. No screen
// here: how a shift played by hand is marked, and how each puzzle is made
// so that it can always be solved. mini.js puts them on screen.
//
// rnd is a function giving a number from 0 up to 1 (the screen's own
// dice: how well you play is up to you, not to the life's seed).

// A score from 0 to 1 becomes a mark: 0 a shift to forget, 1 fair, 2 good, 3 a blinder.
export const grade = (q) => (q >= 0.85 ? 3 : q >= 0.6 ? 2 : q >= 0.3 ? 1 : 0);
export const GRADE_WORD = ['A shift to forget', 'A fair shift', 'A good shift', 'A blinder'];

const pick = (rnd, list) => list[Math.floor(rnd() * list.length)];
const shuffle = (rnd, list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---- pipes (building) -------------------------------------------------------------------

// A tile is four bits, one for each open side: north 1, east 2, south 4, west 8.
export const turn = (m) => ((m << 1) & 15) | (m >> 3);
const SIDES = [[1, 0, -1, 4], [2, 1, 0, 8], [4, 0, 1, 1], [8, -1, 0, 2]]; // [side, dx, dy, the side that meets it]

// A square of pipes with one way through from the top left (water comes in
// from the west) to the bottom right (and out to the east), then every tile
// spun at random. tiles: what is on screen; path: how many tiles the way through
// uses; answer: the tiles as they were before they were spun.
export function pipes(n, rnd) {
  const at = (x, y) => y * n + x, seen = new Set(), path = [];
  const walk = (x, y) => {
    seen.add(at(x, y)); path.push([x, y]);
    if (x === n - 1 && y === n - 1) return true;
    for (const [, dx, dy] of shuffle(rnd, SIDES)) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n || seen.has(at(nx, ny))) continue;
      if (walk(nx, ny)) return true;
    }
    path.pop();
    return false;
  };
  walk(0, 0);
  const tiles = Array.from({ length: n * n }, () => pick(rnd, [5, 5, 3, 3, 3, 7]));
  path.forEach(([x, y], i) => {
    let m = 0;
    for (const [px, py] of [path[i - 1] || [-1, 0], path[i + 1] || [n, n - 1]]) m |= px < x ? 8 : px > x ? 2 : py < y ? 1 : 4;
    tiles[at(x, y)] = m;
  });
  const answer = tiles.slice();
  for (let i = 0; i < tiles.length; i++) for (let k = Math.floor(rnd() * 4); k > 0; k--) tiles[i] = turn(tiles[i]);
  // (Never hand over one that is already done.)
  if (flow({ n, tiles }).done) tiles[0] = turn(tiles[0]);
  return { n, tiles, path: path.length, answer };
}
// Where the water has got to: wet is the set of tiles it reaches, done whether it runs out of the far corner.
export function flow({ n, tiles }) {
  const wet = new Set();
  if (!(tiles[0] & 8)) return { wet, done: false };
  const todo = [0];
  wet.add(0);
  while (todo.length) {
    const i = todo.pop(), x = i % n, y = Math.floor(i / n);
    for (const [side, dx, dy, meets] of SIDES) {
      const nx = x + dx, ny = y + dy, j = ny * n + nx;
      if (!(tiles[i] & side) || nx < 0 || ny < 0 || nx >= n || ny >= n || wet.has(j) || !(tiles[j] & meets)) continue;
      wet.add(j); todo.push(j);
    }
  }
  const last = n * n - 1;
  return { wet, done: wet.has(last) && !!(tiles[last] & 2) };
}

// ---- bug sweep (tech) -------------------------------------------------------------------

// A board with bugs hidden in it, none of them on or beside the first square opened.
export function sweep(n, bugs, first, rnd) {
  const near = (i) => { const x = i % n, y = Math.floor(i / n), out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < n && ny < n) out.push(ny * n + nx); } return out; };
  const clear = new Set([first, ...near(first)]);
  const spots = shuffle(rnd, Array.from({ length: n * n }, (_, i) => i).filter((i) => !clear.has(i))).slice(0, bugs);
  const bug = Array(n * n).fill(false);
  for (const i of spots) bug[i] = true;
  return { n, bug, count: bug.map((b, i) => near(i).filter((j) => bug[j]).length), near, safe: n * n - spots.length };
}
// Opens a square, and everything around a square with no bugs beside it. Returns true if it was a bug.
export function dig(board, open, i) {
  if (board.bug[i]) return true;
  const todo = [i];
  while (todo.length) {
    const k = todo.pop();
    if (open.has(k)) continue;
    open.add(k);
    if (board.count[k] === 0) for (const j of board.near(k)) if (!open.has(j) && !board.bug[j]) todo.push(j);
  }
  return false;
}

// ---- the till (retail) ------------------------------------------------------------------

export const COINS = [1000, 500, 100, 50, 20, 10]; // in cents
// A sale: what it came to, what the customer handed over, and the change due (all in cents).
export function sale(level, rnd) {
  const price = (2 + Math.floor(rnd() * (18 + level * 6))) * 50 + Math.floor(rnd() * 5) * 10 * (level >= 1 ? 1 : 0);
  const paid = [500, 1000, 2000, 5000].find((n) => n > price) || 10000;
  return { price, paid, due: paid - price };
}

// ---- the line-up (police) ---------------------------------------------------------------

export const HAIR_WORD = { 0: 'black', 2: 'brown', 4: 'blond', 5: 'red', 7: 'pink', 8: 'blue' };
export const TOP_WORD = { 0: 'red', 2: 'yellow', 3: 'green', 4: 'purple', 6: 'navy' };
// Six faces and a description that fits exactly one of them.
export function lineup(level, rnd) {
  const hairs = Object.keys(HAIR_WORD).map(Number), tops = Object.keys(TOP_WORD).map(Number);
  const make = () => { const sex = rnd() < 0.5 ? 'm' : 'f'; return { sex, hair: pick(rnd, hairs), top: pick(rnd, tops), beard: sex === 'm' && rnd() < 0.5, style: sex === 'm' ? pick(rnd, [0, 3, 4]) : pick(rnd, [1, 2, 5]), skin: Math.floor(rnd() * 6) }; };
  const same = (a, b) => a.sex === b.sex && a.hair === b.hair && a.top === b.top && a.beard === b.beard;
  const who = make(), faces = [who];
  // The others are near misses: the same but for one or two things.
  while (faces.length < 6) {
    const f = { ...who, skin: Math.floor(rnd() * 6) };
    for (let k = 0; k < (level >= 3 ? 1 : 2); k++) {
      const what = pick(rnd, f.sex === 'm' ? ['hair', 'top', 'beard'] : ['hair', 'top']);
      if (what === 'hair') f.hair = pick(rnd, hairs.filter((h) => h !== f.hair));
      else if (what === 'top') f.top = pick(rnd, tops.filter((t) => t !== f.top));
      else f.beard = !f.beard;
    }
    if (!faces.some((g) => same(f, g))) faces.push(f);
  }
  const order = shuffle(rnd, faces);
  return { faces: order, who: order.indexOf(who), says: `A ${who.sex === 'm' ? 'man' : 'woman'} with ${HAIR_WORD[who.hair]} hair${who.sex === 'm' ? (who.beard ? ' and a beard' : ' and no beard') : ''}, in a ${TOP_WORD[who.top]} top.` };
}

// ---- the small print (law) --------------------------------------------------------------

const CLAUSES = [
  ['The tenant shall pay the rent on the', ['first', 'last', 'third'], 'day of each month.'],
  ['Notice of', ['thirty', 'thirteen', 'ninety'], 'days must be given in writing.'],
  ['The seller', ['shall', 'may', 'shall not'], 'deliver the goods to the quay.'],
  ['Interest accrues at', ['4', '14', '40'], 'per cent a year.'],
  ['The boat is to be returned', ['before', 'after', 'by'], 'high water.'],
  ['Damages are limited to', ['$500', '$5,000', '$50'], 'for each claim.'],
  ['This agreement ends on the death of the', ['lessee', 'lessor', 'lender'], 'and not before.'],
  ['The catch is to be divided', ['equally', 'unequally', 'evenly'], 'among the crew.'],
  ['Either party', ['may', 'must', 'may not'], 'end this contract without cause.'],
  ['The deposit is', ['refundable', 'non-refundable', 'returnable'], 'in full.'],
  ['Disputes go before the magistrate at', ['Starling Bay', 'Port Merrow', 'the county town'], 'and nowhere else.'],
  ['The landlord is liable for the', ['roof', 'rent', 'rates'], 'and the drains.'],
];
// Some clauses as they were agreed, and the copy, which differs in one of them.
export function smallPrint(level, rnd) {
  const rows = shuffle(rnd, CLAUSES).slice(0, 4 + Math.min(2, Math.floor(level / 2))).map(([a, words, b]) => { const w = pick(rnd, words); return { was: `${a} ${w} ${b}`, now: `${a} ${w} ${b}`, a, b, w, words }; });
  const odd = Math.floor(rnd() * rows.length), r = rows[odd];
  r.now = `${r.a} ${pick(rnd, r.words.filter((w) => w !== r.w))} ${r.b}`;
  return { rows: rows.map(({ was, now }) => ({ was, now })), odd };
}

// ---- marking (teaching) -----------------------------------------------------------------

// A sum a child has done, and whether they got it right.
export function sum(level, rnd) {
  const big = 6 + level * 3, ops = level >= 2 ? ['+', '−', '×'] : ['+', '−'];
  const op = pick(rnd, ops);
  let a = 2 + Math.floor(rnd() * big), b = 2 + Math.floor(rnd() * big);
  if (op === '×') { a = 2 + Math.floor(rnd() * (5 + level)); b = 2 + Math.floor(rnd() * 8); }
  if (op === '−' && b > a) [a, b] = [b, a];
  const real = op === '+' ? a + b : op === '−' ? a - b : a * b;
  const right = rnd() < 0.5;
  const off = pick(rnd, [-10, -2, -1, 1, 2, 10].filter((d) => real + d >= 0));
  return { text: `${a} ${op} ${b} = ${right ? real : real + off}`, right };
}

// ---- the set (music) --------------------------------------------------------------------

// The notes of a tune: when each falls due (in seconds) and in which of four lanes.
export function tune(level, rnd) {
  const beat = 60 / (88 + level * 9), notes = [];
  let lane = Math.floor(rnd() * 4);
  for (let t = 1.2; t < 19; t += beat * (rnd() < 0.25 + level * 0.07 ? 0.5 : 1)) {
    lane = (lane + pick(rnd, [0, 1, 1, 2, 3, 3])) % 4;
    notes.push({ t: Math.round(t * 1000) / 1000, lane });
  }
  return notes;
}

// ---- the floor (finance) ----------------------------------------------------------------

// A share price over n ticks: it swings, with a little noise, and ends about where it began.
export function ticker(n, rnd) {
  const a = 0.5 + rnd(), b = 1.5 + rnd() * 1.5, pa = rnd() * 6.28, pb = rnd() * 6.28, out = [];
  for (let i = 0; i < n; i++) {
    const x = i / n * 6.28;
    out.push(Math.round((100 + 18 * Math.sin(x * a * 2 + pa) + 9 * Math.sin(x * b * 3 + pb) + (rnd() - 0.5) * 5) * 100) / 100);
  }
  return out;
}
// The best that could have been made from it, buying and selling as often as you like (as a multiple of what you began with).
export function bestTrade(p) {
  let m = 1;
  for (let i = 1; i < p.length; i++) if (p[i] > p[i - 1]) m *= p[i] / p[i - 1];
  return m;
}
