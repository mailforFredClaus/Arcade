// New in Town: Windle Farm and Market Square, up the hill.
//
// Tom Windle takes on casual help through the farming year (lambing in
// spring, hay in summer, the harvest in autumn, hedges and fences in
// winter), and the work builds a Farming skill of its own. With enough of
// it, and a home with the room, you can buy hens, bees, a goat or a pig
// from him: they want feeding (a bill every season) and seeing to (or they
// suffer), and give eggs, honey and milk to collect.
//
// On Saturdays there is a stall to rent in Market Square, where Priya Lal
// keeps order from behind her cheeses. Put out what you have collected,
// made at home (jam, cakes, cheese), grown on the allotment, painted or
// cleared out of the cupboards; price each thing cheap, fair or dear; then
// serve the queue (a game in market-games.js). What sells, and for how
// much, moves with the season, the weather, the economy and your stall's
// good name. Once a year, in summer, Tom's top field holds the Windle Show,
// with rosettes for the best hens, honey, jam and pigs on the hill.
//
// All of it lives in s.mkt. The screen is market-ui.js.

import { HOMES, CROPS, CURIOS, TROPHIES, money, aCurio } from './data.js';

const round10 = (n) => Math.round(n / 10) * 10;

// ---- what there is to sell ----------------------------------------------------------------

// price: the going rate for one, in a middling season; want: how many a
// Saturday's crowd of the usual size would buy at that price. rate and dem:
// how the price and the wanting move from spring to winter. fresh: it does
// not keep past the end of the season.
export const GOODS = {
  eggs: { name: 'Eggs', icon: '🥚', one: 'box of eggs', many: 'boxes of eggs', price: 16, want: 24, fresh: true, rate: [0.9, 0.95, 1.05, 1.35], dem: [1, 1, 1, 1.1] },
  milk: { name: 'Goat’s milk', icon: '🥛', one: 'pint of goat’s milk', many: 'pints of goat’s milk', price: 9, want: 16, fresh: true, rate: [1, 1, 1, 1.2], dem: [1, 1.1, 1, 0.9] },
  cake: { name: 'Cakes and bakes', icon: '🍰', one: 'cake', many: 'cakes', price: 40, want: 12, fresh: true, rate: [1, 0.95, 1, 1.25], dem: [1, 0.9, 1, 1.3] },
  veg: { name: 'Veg from the allotment', icon: '🥕', one: 'box of veg', many: 'boxes of veg', price: 80, want: 8, fresh: true, rate: [1.15, 0.85, 0.95, 1.2], dem: [1, 1, 1.1, 0.9] },
  honey: { name: 'Honey', icon: '🍯', one: 'jar of honey', many: 'jars of honey', price: 58, want: 10, rate: [1.1, 0.9, 1, 1.25], dem: [1, 0.9, 1, 1.3] },
  jam: { name: 'Jam', icon: '🍓', one: 'jar of jam', many: 'jars of jam', price: 30, want: 14, rate: [1, 0.9, 1.1, 1.25], dem: [0.9, 0.9, 1.1, 1.3] },
  cheese: { name: 'Goat’s cheese', icon: '🧀', one: 'goat’s cheese', many: 'goat’s cheeses', price: 55, want: 8, rate: [1, 1.05, 1, 1.2], dem: [1, 1, 1, 1.2] },
  bric: { name: 'Bric-a-brac', icon: '🕰️', one: 'piece of bric-a-brac', many: 'pieces of bric-a-brac', price: 36, want: 6, rate: [1, 1.1, 1, 1.1], dem: [1, 1.2, 1, 1] },
  // (Pictures are the ones you paint in the park, also sold at the studios. Nobody at a
  // Saturday market pays gallery prices, so the price here has a ceiling.)
  art: { name: 'Paintings', icon: '🖼️', one: 'painting', many: 'paintings', price: 0, want: 1, rate: [1, 1.3, 0.9, 1.1], dem: [1, 1.4, 0.9, 1] },
};
export const GOOD_IDS = Object.keys(GOODS);
// What may be the thing everybody wants this season.
const HOT = ['eggs', 'milk', 'cake', 'veg', 'honey', 'jam', 'cheese', 'bric'];
// Three ways to price a thing. mul: on the going rate; want: how much more or
// less of it goes, for its quality q (0 to 1): dear only sells if it is good.
export const LEVELS = [
  { id: 'cheap', name: 'Cheap', mul: 0.8, want: () => 1.4 },
  { id: 'fair', name: 'Fair', mul: 1, want: () => 1 },
  { id: 'dear', name: 'Dear', mul: 1.3, want: (q) => 0.4 + 0.45 * q },
];
// How many come up the hill on a Saturday, by the weather.
export const WX_FOOT = { fair: 1, wet: 0.7, hot: 1.1, storm: 0.5, fog: 0.85, snow: 0.65 };
const WX_SAID = { fair: 'A fair Saturday, and the square is busy.', wet: 'Rain, and the awnings drip down people’s necks. Fewer come.', hot: 'A scorcher. The square is packed, and the butter is sweating.', storm: 'A gale. Half the stalls do not open, and the ones that do hold on to their awnings.', fog: 'Fog on the hill. People loom out of it, buy something, and vanish.', snow: 'Snow on the cobbles. A brave few, all wanting something warming.' };
export const PITCH_COST = 250; // a trestle table, an awning and a cash tin, once
export const PITCH_FEE = 200; // to Priya, each season you trade

// What your stall is called: {n} is your first name.
export const STALL_NAMES = ['{n}’s Pantry', 'The Good Egg', 'Hive and Hedgerow', 'Jam Tomorrow', 'Top of the Hill', 'The Honesty Box', 'The Starling Larder', 'Busy Bee'];

// ---- the animals ----------------------------------------------------------------------------

// skill: the Farming Tom wants to see before he sells you any. price: for
// one; buy: how many come at once. back: what Tom gives for one, back.
// feed: each one's food and bedding, a season. makes: what they give, and
// lay: how much of it, from spring to winter, from one well kept.
export const BEASTS = {
  hens: { name: 'Hens', one: 'hen', many: 'hens', icon: '🐔', skill: 15, price: 45, buy: 3, back: 15, feed: 20, makes: 'eggs', lay: [10, 9, 6, 2], blurb: 'Point-of-lay brown hens. Eggs most of the year, fewer in winter.' },
  bees: { name: 'Bees', one: 'hive', many: 'hives', icon: '🐝', skill: 25, price: 380, buy: 1, back: 120, feed: 40, makes: 'honey', lay: [0, 12, 9, 0], blurb: 'A hive with a colony in it. Honey in summer and autumn, and the allotment does better.' },
  goat: { name: 'Goats', one: 'goat', many: 'goats', icon: '🐐', skill: 35, price: 450, buy: 1, back: 150, feed: 150, makes: 'milk', lay: [70, 80, 60, 20], blurb: 'A nanny goat in milk. Milk to sell, or to make into cheese. Eats anything.' },
  pig: { name: 'Pig', one: 'pig', many: 'pigs', icon: '🐖', skill: 45, price: 220, buy: 1, back: 0, feed: 160, makes: null, lay: [0, 0, 0, 0], blurb: 'A weaner to fatten. Worth more each season it is well kept, and it digs the allotment over for you.' },
};
// What each home has room for. A hostel bunk and a bedsit have none; a
// flat can keep a hive on the roof; anywhere with a garden, hens.
export const ROOM = { flat: { bees: 1 }, cottage: { hens: 6, bees: 2 }, townhouse: { hens: 8, bees: 2 }, villa: { hens: 12, bees: 3, goat: 2 }, manor: { hens: 20, bees: 4, goat: 3, pig: 1 } };
// Tom will keep a goat or a pig in his top paddock for you, once he trusts you to.
export const PADDOCK = { goat: 2, pig: 1 };
export const PADDOCK_SKILL = 40, PADDOCK_FEE = 90;

// ---- the farming year -------------------------------------------------------------------------

export const WORK = [
  { title: 'Help with the lambing', icon: '🐑', load: '🌾', said: ['Three nights in the lambing shed with a torch and a flask. Twins at four in the morning, and Tom pretending he is not pleased.', 'You pull a lamb out backwards in the rain. Tom says “Not bad,” which, from him, is a speech.', 'Tom names the weakest lamb after you. You are not sure how to take it, but it thrives.'] },
  { title: 'Help with the haymaking', icon: '🌾', load: '🟨', said: ['Bales to the barn until the light goes. Your arms are scratched to the elbow and you have never slept so well.', 'You ride home on top of the last load, with the swallows going round your head.', 'Tom tests the hay by smelling it, and nods. You smell it too, for form’s sake.'], wet: 'Rain on cut hay. Half of it is spoiled, and Tom does not speak for an hour.' },
  { title: 'Help with the harvest', icon: '🍎', load: '🥔', said: ['Potatoes, then apples, then potatoes again. You will dream in potatoes.', 'You ride the trailer back to the yard with the sun going down and your back telling you all about it.', 'The cider apples go to the press, and a jug of last year’s comes out. For the workers.'] },
  { title: 'Lay hedges and mend fences', icon: '🪵', load: '🪵', said: ['Forty yards of hawthorn laid the old way. You only bleed a bit.', 'You mend the fence along the footpath that Tom says is not a footpath.', 'Posts, wire and a sledgehammer. By dark the sheep are where they ought to be, for once.'], snow: 'Snow. You dig ewes out of a drift by the wall. They are not grateful.' },
];
const TOM_SAYS = [
  '“Council wants a footpath through my bottom field,” says Tom. “They can have one when the cows say so.” The cows say nothing, which he takes as support.',
  'Tom is explaining the weather to a cow called Margaret. She has heard it before.',
  '“Folk from the town,” says Tom, “think milk comes from a carton.” He looks at you. “You did, once.”',
  '“That Priya Lal,” says Tom, “could sell cheese to a cow.” It is meant kindly.',
  '“Mayor Pennington,” says Tom, and then nothing else for some time.',
  'Tom has a new sign by the gate: PRIVATE. NO FOOTPATH. THIS MEANS YOU, COUNCIL.',
];

// ---- the Windle Show --------------------------------------------------------------------------

// Each summer on Tom's top field. A class is judged on an animal (how well
// kept it is, and your Farming) or on a thing (its quality): use: how much of it the judges keep.
export const CLASSES = {
  hens: { name: 'Best hen', icon: '🐔', beast: 'hens' },
  goat: { name: 'Goat in milk', icon: '🐐', beast: 'goat' },
  pig: { name: 'Pig in the ring', icon: '🐖', beast: 'pig' },
  eggs: { name: 'A plate of six eggs', icon: '🥚', good: 'eggs', use: 1 },
  honey: { name: 'Two jars of clear honey', icon: '🍯', good: 'honey', use: 2 },
  jam: { name: 'A jar of soft-fruit jam', icon: '🍓', good: 'jam', use: 1 },
  cheese: { name: 'A soft cheese', icon: '🧀', good: 'cheese', use: 1 },
  cake: { name: 'A Victoria sponge', icon: '🍰', good: 'cake', use: 1 },
  veg: { name: 'A trug of vegetables', icon: '🥕', good: 'veg', use: 1 },
};
export const PLACINGS = [null, { name: 'First', colour: 'red', prize: 120 }, { name: 'Second', colour: 'blue', prize: 50 }, { name: 'Third', colour: 'yellow', prize: 20 }];
export const SHOW_FEE = 5;

// ---- the queue at the stall -------------------------------------------------------------------

// Who comes to the stall. tier: the dearest of the three prices they will
// pay (0 cheap, 1 fair, 2 dear). badge, age and what they say are the clues.
export const SHOPPERS = [
  { id: 'regular', badge: '🛍️', tier: 1, w: 4, age: [28, 64], lines: ['Morning! The usual, please.', 'Same as last week, love.', 'What’s good today?', 'Go on then, I’ll have one of those.', 'Lovely. How much is that one?'] },
  { id: 'saver', badge: '🛒', tier: 0, w: 3, age: [68, 86], lines: ['How much?', 'I can get that cheaper at the supermarket.', 'In my day that was a shilling.', 'Is that your best price, dear?', 'I’m only looking, mind.'] },
  { id: 'tourist', badge: '📷', tier: 2, w: 3, age: [30, 58], lines: ['Is this all made locally? How lovely.', 'We’re only here for the day. I’ll take one.', 'My sister would adore this. Go on.', 'Isn’t it all so quaint!'] },
  { id: 'chef', badge: '🧑‍🍳', tier: 2, w: 1, age: [26, 50], lines: ['If it tastes as good as it looks, I’ll be back.', 'I’m doing a tasting menu on Friday. I want the best you’ve got.'] },
  { id: 'child', badge: '🪙', tier: 0, w: 1, age: [9, 11], lines: ['I’ve got my pocket money. Is it enough?', 'Mum says I can have one if it’s not dear.'] },
];
// Now and then somebody is not what they look like: listen to what they say.
export const TWISTS = {
  regular: { tier: 2, lines: ['It’s my birthday, and I’m treating myself. Don’t stint.', 'We’ve got the in-laws coming. Only the best will do.'] },
  saver: { tier: 2, lines: ['My grandson is coming to tea. Never mind the price.', 'I’ve had a win on the bingo. Your dearest, please.'] },
  tourist: { tier: 0, lines: ['I’ve spent everything at the gift shop. What can I have for a few coins?', 'The car park took all my change. Anything cheap?'] },
};
const CHEF_DOUBT = ['Hm. It looks a bit tired. What will you do me it for?', 'I’ve seen better. Something sensible, please.'];

// The next customer: who, what they say, what they want, and what they will pay.
// rnd: a function giving a number from 0 up to 1. goods: [{ g, q }] on the stall.
// twist: how often somebody is not what they look like.
export function stallCustomer(rnd, goods, twist = 0.2) {
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const total = SHOPPERS.reduce((a, k) => a + k.w, 0);
  let r = rnd() * total, who = SHOPPERS[0];
  for (const k of SHOPPERS) { who = k; r -= k.w; if (r < 0) break; }
  const item = pick(goods);
  let tier = who.tier, line = pick(who.lines);
  if (who.id === 'chef' && item.q < 0.6) { tier = 1; line = pick(CHEF_DOUBT); }
  else if (TWISTS[who.id] && rnd() < twist) { tier = TWISTS[who.id].tier; line = pick(TWISTS[who.id].lines); }
  const [lo, hi] = who.age;
  const sex = rnd() < 0.5 ? 'm' : 'f';
  const look = { skin: Math.floor(rnd() * 6), hair: Math.floor(rnd() * 9), top: Math.floor(rnd() * 8), style: sex === 'm' ? pick([0, 0, 3, 4]) : pick([1, 1, 2, 5, 3]), beard: sex === 'm' && rnd() < 0.3 };
  return { who: who.id, badge: who.badge, line, g: item.g, tier, sex, age: lo + Math.floor(rnd() * (hi - lo + 1)), look };
}
// How a price asked is marked: the most they would pay is full marks; less
// than that is money left on the table; more and they walk off.
export const askMark = (ask, tier) => (ask > tier ? 0 : LEVELS[ask].mul / LEVELS[tier].mul);

// ---- a life's farm and stall ------------------------------------------------------------------

const blank = (t) => ({
  farm: 0, days: 0, told: false, herd: {}, ready: {}, stock: {}, stall: null, veg: false,
  hot: HOT[(t * 3) % HOT.length], next: HOT[(t * 3 + 5) % HOT.length],
  show: { y: 0, c: {} }, firsts: {}, ros: 0, champ: 0, loft: 0, rival: 0, shut: -1, tom: 0,
  n: { days: 0, take: 0, sold: 0, best: 0, made: 0 },
});
const sayMany = (k, n) => `${n} ${n === 1 ? k.one : k.many}`;
// Eggs, honey and jam.
const andList = (l) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}` : l[0] || '');
// A thing said plainly: eggs, honey, goat’s cheeses, bric-a-brac.
export const plain = (g) => GOODS[g].many.replace(/^\w+ of /, '');
const careWord = (c) => (c >= 75 ? 'In fine fettle' : c >= 50 ? 'Doing well' : c >= 25 ? 'Wanting attention' : 'Neglected');
export { careWord };

export function install({ def, A, Life, clamp, hooks, addEvents }) {
  // Farming grows more slowly the more you know, and faster when you are happy (as skills do).
  const farmUp = (L, base) => {
    const m = L.s.mkt, k = L.s.happy >= 70 ? 1.15 : L.s.happy < 20 ? 0.75 : 1;
    m.farm = clamp(m.farm + base * k * (1 - m.farm / 105) ** 1.6, 0, 100);
  };
  const addStock = (L, g, n, q) => {
    if (!(n > 0)) return;
    const m = L.s.mkt, st = m.stock[g] || (m.stock[g] = { n: 0, q: 0 });
    st.q = Math.round(((st.q * st.n + q * n) / (st.n + n)) * 100) / 100;
    st.n += n;
  };
  const take = (L, g, n) => {
    const m = L.s.mkt;
    if (g === 'art') { L.s.paintings = Math.max(0, L.s.paintings - n); return; }
    const st = m.stock[g];
    if (!st) return;
    st.n -= n;
    if (st.n <= 0) delete m.stock[g];
  };

  Object.assign(Life.prototype, {
    // ---- the animals ----
    // Room at home for a kind of animal, and room for it all told (home, or Tom's paddock).
    mktRoom(kind) { return (ROOM[this.s.home] || {})[kind] || 0; },
    mktPaddock(kind) { return this.s.mkt.farm >= PADDOCK_SKILL ? PADDOCK[kind] || 0 : 0; },
    // Where more of a kind would go: with the rest of them, or at home if there is room, or up at Tom's.
    mktWhere(kind) {
      const h = this.s.mkt.herd[kind];
      if (h) return h.where;
      return this.mktRoom(kind) ? 'home' : this.mktPaddock(kind) ? 'farm' : null;
    },
    mktCap(kind) { const w = this.mktWhere(kind); return w === 'home' ? this.mktRoom(kind) : w === 'farm' ? this.mktPaddock(kind) : 0; },
    // How many would come if you bought some now.
    mktBuyN(kind) { const h = this.s.mkt.herd[kind]; return Math.max(0, Math.min(BEASTS[kind].buy, this.mktCap(kind) - (h ? h.n : 0))); },
    // What Tom would give for one (a pig is worth what has been put into it).
    mktBack(kind) {
      const h = this.s.mkt.herd[kind];
      if (kind === 'pig') return h ? round10(BEASTS.pig.price * 0.8 + h.fat) : 0;
      return BEASTS[kind].back;
    },
    mktFeed() {
      const herd = this.s.mkt.herd;
      return Math.round(Object.keys(herd).reduce((a, k) => a + BEASTS[k].feed * herd[k].n, 0) * (this.season === 3 ? 1.3 : 1));
    },
    mktGraze() { const herd = this.s.mkt.herd; return Object.keys(herd).reduce((a, k) => a + (herd[k].where === 'farm' ? PADDOCK_FEE * herd[k].n : 0), 0); },
    mktKinds() { return Object.keys(this.s.mkt.herd); },
    mktHasReady() { const r = this.s.mkt.ready; return Object.keys(r).some((g) => r[g].n > 0); },
    // Animals your home has no room for go up to Tom's paddock, if he will
    // have them, or back to him for what he will give.
    mktRehome() {
      const s = this.s, m = s.mkt, said = [];
      for (const kind of Object.keys(m.herd)) {
        const h = m.herd[kind], b = BEASTS[kind];
        if (h.where !== 'home') continue;
        const room = this.mktRoom(kind);
        if (h.n <= room) continue;
        if (!room && this.mktPaddock(kind) >= h.n) { h.where = 'farm'; said.push(`your ${h.n === 1 ? b.one : b.many} went up to Tom’s top paddock`); continue; }
        const go = h.n - room, pay = this.mktBack(kind) * go;
        h.n = room;
        if (!h.n) delete m.herd[kind];
        if (pay) this.cash(pay);
        said.push(`${sayMany(b, go)} went back to Tom Windle${pay ? ` for ${money(pay)}` : ''}`);
      }
      if (!said.length) return;
      this.note(`No room for them at home: ${said.join('; ')}.`);
      this.say('🐔', 'No room for your animals: Tom has them now', 'bad');
    },

    // ---- the stall ----
    mktFirst() { return (this.s.name || 'You').split(' ')[0]; },
    mktNameOf(i) { return STALL_NAMES[i].replace('{n}', this.mktFirst()); },
    mktFee() { return round10(PITCH_FEE * (1 + 0.1 * this.s.eco)); },
    // How many come up the hill to the stall: its name, the weather, the times, and any rival.
    mktFoot() {
      const s = this.s, st = s.mkt.stall;
      return (0.55 + (st ? st.rep : 0) / 110) * (WX_FOOT[s.wx] || 1) * (1 + 0.05 * s.eco) * (s.mkt.rival > 0 ? 0.8 : 1);
    },
    // How much of a thing you have, and how good it is (0 to 1).
    mktHave(g) { return g === 'art' ? this.s.paintings : (this.s.mkt.stock[g] || { n: 0 }).n; },
    mktQ(g) { return g === 'art' ? clamp(this.s.st.craft / 100, 0.1, 1) : g === 'bric' ? 0.5 : (this.s.mkt.stock[g] || { q: 0.5 }).q; },
    // The going rate for one this season, before its quality or your price.
    mktRate(g) {
      const k = GOODS[g], s = this.s;
      const base = g === 'art' ? Math.min(0.5 * this.artPrice(), 120 + 5 * s.st.craft) : k.price;
      return base * k.rate[this.season] * (1 + 0.05 * s.eco);
    },
    mktEach(g, lvl) { return Math.max(1, Math.round(this.mktRate(g) * (0.75 + 0.5 * this.mktQ(g)) * LEVELS[lvl].mul)); },
    mktLevel(g) { const st = this.s.mkt.stall; return st && st.price[g] != null ? st.price[g] : 1; },
    // Is it on the stall, or kept back? (Paintings are kept back unless you say.)
    mktIsOut(g) { const st = this.s.mkt.stall; return !!st && (g === 'art' ? st.out.art === true : st.out[g] !== false); },
    mktOnStall() { return GOOD_IDS.filter((g) => this.mktIsOut(g) && this.mktHave(g) > 0); },
    // How many a Saturday would sell, on the average, at a price.
    mktWant(g, lvl = this.mktLevel(g)) {
      const s = this.s, m = s.mkt, k = GOODS[g];
      let d = k.want * this.mktFoot() * k.dem[this.season] * (m.hot === g ? 1.6 : 1) * LEVELS[lvl].want(this.mktQ(g));
      if (s.wx === 'hot' && ['milk', 'cheese', 'cake'].includes(g)) d *= 0.8;
      if (s.wx === 'snow' && ['cake', 'jam'].includes(g)) d *= 1.25;
      return d;
    },
    // What it would come to, as things stand, if a fair Saturday went as expected.
    mktGuess(g, lvl = this.mktLevel(g)) { const n = Math.min(this.mktHave(g), Math.round(this.mktWant(g, lvl))); return { n, each: this.mktEach(g, lvl), sum: n * this.mktEach(g, lvl) }; },
    // A Saturday's trading. score: how well the queue was served (0 to 1).
    mktDay(score) {
      const s = this.s, m = s.mkt, st = m.stall, sold = [];
      let sum = 0, units = 0, rep = 1.5 + 3 * score;
      const out = this.mktOnStall();
      if (out.length >= 3) rep += 1;
      for (const g of out) {
        const lvl = this.mktLevel(g), q = this.mktQ(g);
        const n = Math.min(this.mktHave(g), Math.round(this.mktWant(g, lvl) * (0.8 + this.rnd() * 0.4)));
        if (lvl === 0) rep += 0.4;
        if (lvl === 2 && q < 0.45) rep -= 1.5;
        if (n <= 0) continue;
        const each = this.mktEach(g, lvl), got = Math.round(n * each * (0.85 + 0.3 * score));
        take(this, g, n);
        sold.push({ g, n, got });
        sum += got; units += n;
      }
      st.rep = clamp(st.rep + (rep > 0 ? rep * (1 - st.rep / 130) : rep), 0, 100);
      return { sold, sum, units };
    },
    // What the queue game shows: the things on the stall, and their three prices.
    mktGameGoods() {
      return this.mktOnStall().map((g) => ({ g, icon: GOODS[g].icon, name: GOODS[g].name, one: GOODS[g].one, q: this.mktQ(g), each: [0, 1, 2].map((l) => this.mktEach(g, l)) }));
    },

    // ---- the show ----
    mktShowYear() { const sh = this.s.mkt.show; return sh.y === this.year ? sh.c : {}; },
    mktCanEnter(c) {
      const k = CLASSES[c], m = this.s.mkt;
      if (!k) return 'No such class.';
      if (k.beast) return m.herd[k.beast] ? null : `You would need ${k.beast === 'hens' ? 'hens' : `a ${BEASTS[k.beast].one}`} of your own.`;
      return this.mktHave(k.good) >= k.use ? null : `You would need ${sayMany(GOODS[k.good], k.use)}.`;
    },
    // How your entry should do, 0 to 1, before the judges' mood on the day.
    mktShowScore(c) {
      const k = CLASSES[c], m = this.s.mkt;
      if (k.beast) { const h = m.herd[k.beast]; return h ? 0.15 + 0.4 * h.care / 100 + 0.35 * m.farm / 100 : 0; }
      return 0.15 + 0.6 * this.mktQ(k.good) + 0.1 * m.farm / 100;
    },
    // The other entries: stiffer each time you have won the class.
    mktShowBar(c) { return 0.55 + 0.05 * Math.min(5, this.s.mkt.firsts[c] || 0); },
    // Your chances in a class, in words.
    mktShowWord(c) { const d = this.mktShowScore(c) - this.mktShowBar(c); return d >= 0.12 ? 'A strong chance' : d >= 0.03 ? 'A good chance' : d >= -0.06 ? 'An even chance' : 'An outside chance'; },
    mktTomTip() { const g = this.s.mkt.next; return `“Folk’ll be wanting ${plain(g)} come ${['the summer', 'the autumn', 'the winter', 'the spring'][this.season]},” says Tom. “Mark me.”`; },
  });

  // ---- the state, for new lives and old ----

  hooks.load.push((L) => {
    const s = L.s, b = blank(s.t || 0);
    if (!s.mkt || typeof s.mkt !== 'object') { s.mkt = b; return; }
    for (const [k, v] of Object.entries(b)) if (s.mkt[k] == null) s.mkt[k] = v;
    for (const [k, v] of Object.entries(b.n)) if (s.mkt.n[k] == null) s.mkt.n[k] = v;
  });

  // ---- money in and out ----

  hooks.bills.push((L, out) => {
    const feed = L.mktFeed(), graze = L.mktGraze();
    if (feed) out.push(['Feed and bedding for your animals', feed]);
    if (graze) out.push(['Grazing at Windle Farm', graze]);
  });
  hooks.worth.push((L) => { const herd = L.s.mkt.herd; return Object.keys(herd).reduce((a, k) => a + L.mktBack(k) * herd[k].n, 0); });
  // Animals kept well cheer you up; animals left to fend for themselves do not. A stall people like does too.
  hooks.mood.push((L) => {
    const m = L.s.mkt, herd = Object.values(m.herd);
    let b = Math.min(3, herd.filter((h) => h.care >= 50).length);
    if (herd.some((h) => h.care < 25)) b -= 4;
    if (m.stall && m.stall.rep >= 60) b += 1;
    return b;
  });
  hooks.acted.push((L) => L.mktRehome());

  // ---- the turn of the season ----

  hooks.season.push((L, lines, jailed) => {
    const s = L.s, m = s.mkt, q = L.season;
    // Whatever was not collected, or sold while it was fresh, is past its best.
    const left = Object.keys(m.ready).filter((g) => m.ready[g].n > 0);
    if (left.length) L.note(`Nobody collected the ${left.map((g) => GOODS[g].name.toLowerCase()).join(' or the ')}. The rats were grateful.`);
    m.ready = {};
    const off = GOOD_IDS.filter((g) => GOODS[g].fresh && m.stock[g]);
    if (off.length) { L.note(`The ${off.map((g) => GOODS[g].name.toLowerCase()).join(' and the ')} you did not sell went past ${off.length > 1 ? 'their' : 'its'} best.`); for (const g of off) delete m.stock[g]; }
    // What the animals gave, and how they fared.
    for (const kind of Object.keys(m.herd)) {
      const h = m.herd[kind], b = BEASTS[kind];
      if (b.makes && b.lay[q]) {
        let wx = 1;
        if (kind === 'hens' && (s.wx === 'snow' || s.wx === 'storm')) wx = 0.7;
        if (kind === 'bees') wx = s.wx === 'wet' ? 0.6 : s.wx === 'hot' ? 1.2 : s.wx === 'storm' ? 0.7 : 1;
        const n = Math.round(b.lay[q] * h.n * (0.35 + 0.65 * h.care / 100) * (0.85 + m.farm / 300) * wx * (0.85 + L.rnd() * 0.3));
        const qual = clamp(Math.round((0.25 + 0.4 * h.care / 100 + 0.35 * m.farm / 100 + (L.rnd() - 0.5) * 0.1) * 100) / 100, 0.1, 1);
        if (n > 0) m.ready[b.makes] = { n, q: qual };
      }
      // (A pig puts on what is put into it, for a year or so.)
      if (kind === 'pig' && h.age < 5) h.fat += Math.round(110 + 1.4 * h.care + m.farm);
      h.age++;
      if (jailed) { h.care = Math.max(40, h.care - 20); continue; } // (Tom keeps an eye on them while you are away.)
      if (h.care < 25 && h.where !== 'farm') {
        if (kind === 'hens') {
          const lost = Math.max(1, Math.round(h.n / 4));
          h.n -= lost; L.karma(-1);
          L.note(`${['One', 'Two', 'Three', 'Four', 'Five'][lost - 1] || lost} of your hens died. Nobody had been to see to them.`);
        } else if (kind === 'bees') {
          if (L.chance(0.5)) { h.n--; L.note('A hive of your bees, left alone all season, packed up and went.'); }
        } else if (h.care <= 0) {
          h.n = 0; L.karma(-4);
          L.note(`The animal welfare people came for your ${b.one}. It is with Tom Windle now, and Tom is not speaking to you.`, 'big');
          L.say('😞', `Your ${b.one} has been taken away`, 'bad');
        } else {
          L.cash(-200); lines.push([`The vet, for your ${b.one}`, -200]); L.karma(-1);
        }
      }
      h.care = Math.max(h.where === 'farm' ? 40 : 0, h.care - (h.where === 'farm' ? 20 : 35));
      if (h.n <= 0) delete m.herd[kind];
    }
    // A pig digs the allotment over; bees in summer do the flowers.
    if (s.plot && (m.herd.pig || (m.herd.bees && q === 1))) for (const bed of s.plot.beds) if (bed) bed.care++;
    // A stall that does not open is soon forgotten.
    if (m.stall && m.stall.at !== s.t) m.stall.rep = clamp(m.stall.rep - 4, 0, 100);
    if (m.rival > 0) m.rival--;
    L.mktRehome();
  });
  // The new season: what everybody will be wanting.
  hooks.late.push((L) => {
    const m = L.s.mkt;
    m.hot = m.next;
    m.next = L.pick(HOT.filter((g) => g !== m.hot));
    m.told = false;
    L.mktRehome();
  });

  // ---- Windle Farm ----

  def('windleWork', {
    place: 'farm', sec: 'Work on the farm', time: 2, per: 2,
    icon: (L) => WORK[L.season].icon, title: (L) => WORK[L.season].title,
    desc: (L) => `About ${money(L.mktWorkPay(0.5))}, and Farming (${Math.floor(L.s.mkt.farm)}). Stack the trailer well and Tom pays more.`,
    why: (L, x) => (x === undefined || (typeof x === 'number' && x >= 0 && x <= 1) ? null : 'Roll your sleeves up.'),
    run(L, x) {
      const s = L.s, m = s.mkt, score = x === undefined ? 0.5 : x, w = WORK[L.season];
      const spoilt = (L.season === 1 && s.wx === 'wet') || (L.season === 3 && s.wx === 'snow');
      const pay = L.mktWorkPay(score) * (spoilt ? 0.8 : 1);
      const got = round10(pay);
      L.cash(got); s.n.earned += got;
      farmUp(L, 3 * (0.7 + 0.6 * score));
      L.gain('fitness', 1.3); L.joy(1); s.use.fit = 1;
      m.days++;
      let text = `${spoilt ? (w.wet || w.snow) : L.pick(w.said)} ${money(got)}.`;
      if (score >= 0.9) text += ' Tom looks at the trailer for a long moment. “Tidy,” he says.';
      else if (score < 0.35) text += ' Half the load comes off at the gate. Tom says nothing, loudly.';
      if (!m.told && L.chance(0.35)) { m.told = true; text += ` ${L.mktTomTip()}`; }
      return text;
    },
  });
  // (Tom thinks more of a hand who signed his petition, and less of one who did not.)
  Life.prototype.mktWorkPay = function (score) {
    const s = this.s, m = s.mkt;
    return (320 + 3.2 * m.farm + 2.4 * s.st.fitness) * (0.75 + 0.5 * score) * (m.tom > 0 ? 1.1 : m.tom < 0 ? 0.9 : 1);
  };
  def('windleTom', {
    place: 'farm', sec: 'Work on the farm', icon: '🧑‍🌾', title: 'Lean on the gate with Tom Windle', per: 1,
    desc: 'He has opinions about cows, the council and the weather, and knows what the market will want next.',
    run(L) {
      const m = L.s.mkt;
      L.joy(3); farmUp(L, 0.6);
      m.told = true;
      const herd = L.mktKinds();
      const worst = herd.slice().sort((a, b) => m.herd[a].care - m.herd[b].care)[0];
      const about = worst ? (m.herd[worst].care < 40 ? ` Then: “Your ${BEASTS[worst].many} want seeing to. I can tell from here.”` : L.chance(0.5) ? ` Then: “Your ${BEASTS[worst].many} look all right. For town ${BEASTS[worst].many}.”` : '') : '';
      return `${L.pick(TOM_SAYS)} ${L.mktTomTip()}${about}`;
    },
  });
  def('beastsOpen', { place: 'farm', sec: 'Animals of your own', icon: '🐓', title: 'Animals from Tom', desc: (L) => (L.mktKinds().length ? 'Hens, bees, goats and pigs: buy more, or sell them back.' : 'Hens, bees, a goat or a pig, once you know enough to keep them.'), time: 0, open: 'mktBeasts' });
  def('beastsMine', { place: 'home', sec: 'Your animals', icon: '🐓', title: 'Your animals', desc: (L) => L.mktKinds().map((k) => `${BEASTS[k].icon} ${careWord(L.s.mkt.herd[k].care).toLowerCase()}`).join(', '), time: 0, open: 'mktBeasts', show: (L) => L.mktKinds().length > 0 });

  def('beastBuy', {
    time: 1, cost: (L, kind) => (BEASTS[kind] ? BEASTS[kind].price * Math.max(1, L.mktBuyN(kind)) : 0),
    why(L, kind) {
      const b = BEASTS[kind], m = L.s.mkt;
      if (!b) return 'No such animal.';
      if (m.farm < b.skill) return `Tom will not sell you ${b.many} until you know what you are doing (Farming ${b.skill}).`;
      if (!L.mktWhere(kind)) return PADDOCK[kind] ? `No room at home, and Tom’s paddock is for people he trusts (Farming ${PADDOCK_SKILL}).` : L.s.home === 'hostel' ? 'Not in a hostel bunk.' : 'Your home has no room for them.';
      return L.mktBuyN(kind) > 0 ? null : 'No room for any more.';
    },
    run(L, kind) {
      const s = L.s, m = s.mkt, b = BEASTS[kind], n = L.mktBuyN(kind), where = L.mktWhere(kind), h = m.herd[kind];
      if (h) h.n += n;
      else {
        m.herd[kind] = { n, care: 70, where, age: 0, fat: 0, since: s.t };
        L.note(`Bought ${sayMany(b, n)} from Tom Windle${where === 'farm' ? ', kept in his top paddock' : ''}.`);
      }
      L.joy(4);
      const said = { hens: '“Three good layers,” says Tom, putting them in a cardboard box with holes in. “Grit, water, and shut them in at night. Foxes.”', bees: 'Tom brings the hive down on the back of the quad bike, very slowly, in a veil. “They’re calm,” he says. “Mostly.”', goat: '“She’ll eat your washing,” says Tom. “And your hedge. And your letters.” The goat looks at you as if it is all true.', pig: 'A weaner, pink and furious, in a sack. “Don’t name it,” says Tom. You name it.' }[kind];
      return `${said}${where === 'farm' ? ' It stays in Tom’s top paddock.' : ''}`;
    },
  });
  def('beastSell', {
    time: 0,
    why: (L, kind) => (BEASTS[kind] && L.s.mkt.herd[kind] ? null : 'You have none.'),
    run(L, kind) {
      const m = L.s.mkt, b = BEASTS[kind], h = m.herd[kind], pay = L.mktBack(kind) * h.n;
      delete m.herd[kind];
      L.cash(pay); L.joy(-2);
      L.note(`Sold your ${h.n === 1 ? b.one : b.many} back to Tom Windle for ${money(pay)}.`);
      return `Tom looks ${h.n === 1 ? 'it' : 'them'} over, sniffs, and counts out ${money(pay)}. ${kind === 'pig' ? '“Good pig,” he says, which is the most he has ever said.' : '“They’ll be all right with me.”'}`;
    },
  });
  // Goats and pigs kept up at Tom's can come home, if home has the room.
  def('beastFetch', {
    time: 1,
    why: (L, kind) => { const h = L.s.mkt.herd[kind]; return !h || h.where !== 'farm' ? 'They are not at the farm.' : L.mktRoom(kind) < h.n ? 'Your home has no room for them.' : null; },
    run(L, kind) { L.s.mkt.herd[kind].where = 'home'; return kind === 'pig' ? 'You walk the pig home on a string, through the middle of town. It is the best day of its life.' : 'The goat comes home on a rope, eating a hedge on the way.'; },
  });
  def('beastCare', {
    place: 'home', sec: 'Your animals', icon: '🪣', title: 'See to the animals', per: 2,
    desc: (L) => `Feed, water, muck out and look them over. ${L.mktKinds().filter((k) => L.s.mkt.herd[k].care < 50).length ? 'Some of them need it.' : 'They are well.'}`,
    show: (L) => L.mktKinds().length > 0,
    run(L) {
      const m = L.s.mkt, kinds = L.mktKinds();
      for (const k of kinds) m.herd[k].care = Math.min(100, m.herd[k].care + 45);
      farmUp(L, 0.8); L.joy(2); L.gain('fitness', 0.5); L.s.use.fit = 1;
      const lines = { hens: ['The hens follow you round the run, telling you everything.', 'Clean straw, fresh water, and a hen sits on your foot.'], bees: ['You open the hive in a veil. Ten thousand bees go on with their day.', 'The bees are calm and the frames are heavy.'], goat: ['The goat eats the bucket, then the feed, then your sleeve.', 'The goat stands on the roof of its shed and looks at you as an equal.'], pig: ['The pig has its back scratched with a stick and lies down in bliss.', 'The pig gets the peelings, and you get a look of real love.'] };
      return kinds.map((k) => L.pick(lines[k])).join(' ');
    },
  });
  def('beastCollect', {
    place: 'home', sec: 'Your animals', icon: '🧺', time: 0,
    title: (L) => { const r = L.s.mkt.ready; const g = Object.keys(r).filter((k) => r[k].n > 0); return `Collect the ${g.map((k) => GOODS[k].name.toLowerCase()).join(' and the ') || 'eggs'}`; },
    desc: (L) => { const r = L.s.mkt.ready; return `${Object.keys(r).filter((k) => r[k].n > 0).map((k) => sayMany(GOODS[k], r[k].n)).join(', ')}. Leave it and it spoils at the turn of the season.`; },
    show: (L) => L.mktHasReady(),
    run(L) {
      const m = L.s.mkt, got = [];
      for (const [g, r] of Object.entries(m.ready)) { if (r.n > 0) { addStock(L, g, r.n, r.q); got.push(sayMany(GOODS[g], r.n)); } }
      m.ready = {};
      L.joy(1);
      return `${andList(got)}. ${L.pick([m.stock.eggs ? 'Some of the eggs are still warm.' : 'All of it carried in before anything else can get at it.','You carry it all in before anything else can get at it.', 'Into the larder, and onto the stall on Saturday.'])}`;
    },
  });

  // ---- making things at home ----

  const kitchen = (L) => (L.s.home === 'hostel' ? 'The hostel kitchen is a kettle.' : null);
  const made = (L, base) => clamp(Math.round((0.2 + L.s.st.craft / 110 + L.rnd() * 0.15 + (base || 0)) * 100) / 100, 0.1, 1);
  def('mktJam', {
    place: 'home', sec: 'Making for the stall', icon: '🍓', title: 'Make jam', per: 2,
    // (In autumn the hedges are full of blackberries, for nothing.)
    cost: (L) => (L.season === 2 ? 30 : 90),
    desc: (L) => `About ${Math.round(16 * (0.85 + L.s.st.craft / 400))} jars, which keep. ${L.season === 2 ? 'Blackberries from the hedges, so only sugar and jars to buy.' : 'Fruit from the greengrocer; it is cheaper in autumn.'} Craft.`,
    why: kitchen,
    run(L) {
      const n = Math.round(16 * (0.85 + L.s.st.craft / 400)), q = made(L);
      addStock(L, 'jam', n, q);
      L.gain('craft', 1.2); L.joy(1); L.s.mkt.n.made++;
      return `${L.pick(['The kitchen smells of hot sugar for a week.', 'You do the cold saucer test four times and it sets on the fifth.', 'Every surface is sticky, including the cat.', 'A row of jars on the windowsill, glowing like stained glass.'])} ${n} jars.`;
    },
  });
  def('mktBake', {
    place: 'home', sec: 'Making for the stall', icon: '🍰', title: 'Bake for the stall', per: 2,
    // (Your own eggs make it cheaper.)
    cost: (L) => ((L.s.mkt.stock.eggs || { n: 0 }).n >= 2 ? 45 : 70),
    desc: (L) => `About ${Math.round(12 * (0.85 + L.s.st.craft / 400))} cakes, to sell this season: they do not keep.${(L.s.mkt.stock.eggs || { n: 0 }).n >= 2 ? ' Uses two boxes of your own eggs.' : ''} Craft.`,
    why: kitchen,
    run(L) {
      const m = L.s.mkt, own = (m.stock.eggs || { n: 0 }).n >= 2;
      if (own) take(L, 'eggs', 2);
      const n = Math.round(12 * (0.85 + L.s.st.craft / 400)), q = made(L, own ? 0.05 : 0);
      addStock(L, 'cake', n, q);
      L.gain('craft', 1.2); L.joy(1.5); m.n.made++;
      return `${L.pick(['Victoria sponges, a lemon drizzle and a tray of flapjack.', 'One of them sinks in the middle. You fill the hole with cream and call it a feature.', 'You lick every bowl. It is the law.'])} ${n} cakes.`;
    },
  });
  def('mktCheese', {
    place: 'home', sec: 'Making for the stall', icon: '🧀', title: 'Make goat’s cheese', cost: 15,
    desc: (L) => `Turns your goat’s milk into ${Math.floor((L.s.mkt.stock.milk || { n: 0 }).n / 5)} soft cheeses, which keep. Craft.`,
    show: (L) => !!L.s.mkt.herd.goat || !!L.s.mkt.stock.milk,
    why: (L) => kitchen(L) || ((L.s.mkt.stock.milk || { n: 0 }).n < 5 ? 'You need five pints of milk for a cheese.' : null),
    run(L) {
      const m = L.s.mkt, milk = m.stock.milk, n = Math.floor(milk.n / 5), q = clamp(Math.round((milk.q * 0.5 + made(L) * 0.5) * 100) / 100, 0.1, 1);
      take(L, 'milk', n * 5);
      addStock(L, 'cheese', n, q);
      L.gain('craft', 1); m.n.made++;
      return `${L.pick(['Muslin, a colander and a lot of patience.', 'The kitchen smells, faintly but definitely, of goat.', 'You turn them, salt them and look at them more than is strictly needed.'])} ${n} cheeses.`;
    },
  });
  def('mktClear', {
    place: 'home', sec: 'Making for the stall', icon: '📦', title: 'Have a clear-out', desc: 'Once a year: what you no longer need, for the bric-a-brac end of the stall.',
    why: (L) => (L.s.mkt.loft === L.year ? 'You did this not long ago. There is nothing left to throw out but the cat.' : null),
    run(L) {
      const s = L.s, m = s.mkt, n = L.int(3, 6) + (HOMES[s.home].tier >= 3 ? 2 : 0);
      m.loft = L.year;
      addStock(L, 'bric', n, 0.5);
      L.joy(2);
      if (L.chance(0.08)) { const k = L.gotCurio(L.anyCurio(['toy', 'book', 'art'])); return `${n} things for the stall, and at the back of a cupboard, ${k.a}. That one is for Mr Pym.`; }
      return `${L.pick(['A fondue set, still in its box. A box of tapes. A lamp shaped like a fish.', 'Three odd vases, a lava lamp and a book called Teach Yourself Yodelling.', 'A clock that runs backwards, and the shoes you swore you would wear again.'])} ${n} things for the stall.`;
    },
  });

  // ---- Market Square ----

  def('mktOpen', {
    place: 'market', sec: 'Your stall', icon: '🧺', time: 0, open: 'mktStall',
    title: (L) => (L.s.mkt.stall ? L.s.mkt.stall.name : 'Ask Priya about a pitch'),
    desc: (L) => { const st = L.s.mkt.stall; if (!st) return `Priya Lal runs the square. A pitch of your own: ${money(PITCH_COST)} to set up, then ${money(L.mktFee())} each season you trade.`; const n = L.mktOnStall().length; return n ? `${n} thing${n > 1 ? 's' : ''} to sell. Set your prices.` : 'Nothing to sell yet. Make something, grow something, or collect from your animals.'; },
  });
  def('mktJoin', {
    time: 0, cost: PITCH_COST,
    why: (L, i) => (L.s.mkt.stall ? 'You have a pitch.' : !(Number.isInteger(i) && STALL_NAMES[i]) ? 'Choose a name for it.' : null),
    run(L, i) {
      const s = L.s, m = s.mkt, name = L.mktNameOf(i);
      m.stall = { name, rep: 20, price: {}, out: {}, paid: -1, at: -1, days: 0, since: s.t, log: [] };
      L.joy(4);
      L.note(`Took a pitch on Market Square: ${name}.`, 'big');
      return `Priya Lal writes ${name} in a ledger with a fountain pen and shows you your pitch, between the cheese and the man who sells only batteries. “Saturdays,” she says. “Nine sharp. Not nine-ish.”`;
    },
  });
  def('mktRename', {
    time: 0, cost: 40,
    why: (L, i) => (!L.s.mkt.stall ? 'You have no pitch.' : !(Number.isInteger(i) && STALL_NAMES[i]) ? 'Choose a name.' : L.s.mkt.stall.name === L.mktNameOf(i) ? 'That is its name now.' : null),
    run(L, i) {
      const st = L.s.mkt.stall;
      st.name = L.mktNameOf(i);
      st.rep = clamp(st.rep - 5, 0, 100);
      return `A new sign, painted by hand: ${st.name}. Some of your regulars walk straight past it.`;
    },
  });
  def('mktPrice', {
    time: 0,
    why: (L, x) => (!L.s.mkt.stall ? 'You have no pitch.' : !(x && GOODS[x.g] && LEVELS[x.lvl]) ? 'Price what?' : L.mktLevel(x.g) === x.lvl ? 'That is its price now.' : null),
    run(L, x) { L.s.mkt.stall.price[x.g] = x.lvl; return `${GOODS[x.g].name}: ${LEVELS[x.lvl].name.toLowerCase()}, at ${money(L.mktEach(x.g, x.lvl))} each.`; },
  });
  def('mktOut', {
    time: 0,
    why: (L, g) => (!L.s.mkt.stall ? 'You have no pitch.' : !GOODS[g] ? 'Put out what?' : null),
    run(L, g) {
      const st = L.s.mkt.stall, now = !L.mktIsOut(g);
      st.out[g] = now;
      return now ? `On the stall: ${GOODS[g].name.toLowerCase()}.` : `Kept back: ${GOODS[g].name.toLowerCase()}.`;
    },
  });
  def('mktVeg', {
    time: 0,
    why: (L) => (!L.s.mkt.stall ? 'You have no pitch.' : null),
    run(L) { const m = L.s.mkt; m.veg = !m.veg; return m.veg ? 'What the allotment gives will come to the stall, in boxes.' : 'What the allotment gives will go on the table by the gate, with the honesty box.'; },
  });
  def('mktQuit', {
    time: 0,
    why: (L) => (L.s.mkt.stall ? null : 'You have no pitch.'),
    run(L) { const st = L.s.mkt.stall; L.s.mkt.stall = null; L.s.mkt.veg = false; L.note(`Gave up the pitch on Market Square after ${st.days} Saturday${st.days === 1 ? '' : 's'}.`); return 'You hand Priya the key to the padlock on the awning. “The batteries man will be glad,” she says. “He has wanted your end for years.”'; },
  });
  def('mktTrade', {
    place: 'market', sec: 'Your stall', icon: '🛎️', title: 'Trade on Saturday', time: 2, per: 2,
    cost: (L) => (L.s.mkt.stall && L.s.mkt.stall.paid !== L.s.t ? L.mktFee() : 0),
    desc: (L) => { const out = L.mktOnStall(); const n = out.reduce((a, g) => a + L.mktGuess(g).sum, 0); return out.length ? `Serve the queue. Should bring in about ${money(n)}${L.s.mkt.stall.paid !== L.s.t ? `; Priya’s pitch fee is ${money(L.mktFee())} this season` : ''}.` : 'Nothing on the stall to sell.'; },
    show: (L) => !!L.s.mkt.stall,
    why: (L, x) => (x !== undefined && !(typeof x === 'number' && x >= 0 && x <= 1) ? 'Roll your sleeves up.' : L.s.mkt.shut === L.s.t ? 'The inspector has shut you until next season.' : !L.mktOnStall().length ? 'Nothing on the stall to sell. Make something, grow something, or collect from your animals.' : null),
    run(L, x) {
      const s = L.s, m = s.mkt, st = m.stall, score = x === undefined ? 0.5 : x;
      st.paid = s.t;
      const day = L.mktDay(score);
      L.cash(day.sum); s.n.earned += day.sum;
      st.days++; st.at = s.t; st.log.unshift({ t: s.t, take: day.sum }); st.log.length = Math.min(st.log.length, 6);
      m.n.days++; m.n.take += day.sum; m.n.sold += day.units; m.n.best = Math.max(m.n.best, day.sum);
      L.gain('charm', 1.2); L.joy(2 + (day.sum >= 1000 ? 2 : 0));
      const what = day.sold.length ? andList(day.sold.map((d) => sayMany(GOODS[d.g], d.n))) : 'nothing at all';
      const how = score >= 0.9 ? 'You read every customer like a book.' : score >= 0.65 ? 'The queue goes quickly and most go away happy.' : score >= 0.35 ? 'A steady day behind the trestle table.' : 'You get the prices muddled all morning, and several people walk off.';
      if (st.days === 1) L.note(`First Saturday at ${st.name}: ${money(day.sum)} taken.`);
      return `${WX_SAID[s.wx] || WX_SAID.fair} ${how} You sell ${what}: ${money(day.sum)}.`;
    },
  });
  def('mktPriya', {
    place: 'market', sec: 'Your stall', icon: '🧀', title: 'Have a word with Priya Lal', per: 1,
    desc: 'She runs the cheese stall and, unofficially, the square. She knows what is selling.',
    run(L) {
      const m = L.s.mkt;
      L.joy(2); L.gain('charm', 0.8);
      if (m.stall) m.stall.rep = clamp(m.stall.rep + 2 * (1 - m.stall.rep / 130), 0, 100);
      return `${L.pick(['Priya gives you a sliver of a cheese “for research”, and three pieces of gossip, one of them about the vicar.', 'Priya is moving the batteries man’s van with her eyes. It works.', 'Priya tells you who is not speaking to whom on the square, and why, and why they are wrong.', '“A stall is a stage,” says Priya, rearranging yours. “Height at the back. Colour at the front.”'])} “Everybody’s after ${plain(m.hot)} this season,” she says.`;
    },
  });
  def('mktRummage', {
    place: 'market', sec: 'Buying on the square', icon: '🔎', title: 'Rummage at the bric-a-brac stall', cost: 15, per: 1,
    desc: (L) => `Boxes of old things at a few dollars each. A sharp eye might spot something Mr Pym would pay for (about ${Math.round(L.mktSpot() * 100)}%).`,
    run(L) {
      if (L.chance(L.mktSpot())) {
        const k = L.gotCurio(L.anyCurio(['toy', 'book', 'art', 'coin']));
        return `Under a box of knitting patterns: ${k.a}, with a sticker on it saying $8. You pay before the man can look at it again.`;
      }
      return L.pick(['A hat stand, a trouser press and a box of somebody’s holiday slides. You buy none of it.', 'You find a lovely old tin. It is full of buttons. It is the buttons that are lovely.', 'An oil painting of a horse that looks surprised. Nothing worth the money.', 'The man on the stall tells you the history of every item. None of it is true.']);
    },
  });
  Life.prototype.mktSpot = function () { const s = this.s; return clamp(0.05 + (s.st.smarts + s.st.craft) / 900 + Object.keys(s.curSeen).length * 0.006, 0.05, 0.28); };
  const TREATS = [['🍞', 'Hot cross buns from the bakery stall', 'Still warm. You eat two on the walk home.'], ['🍓', 'A punnet of strawberries', 'You mean to save some. You do not.'], ['🍎', 'A toffee apple', 'Your teeth will never be the same, and it is worth it.'], ['🥧', 'Mince pies and a cup of mulled apple', 'Steam, cinnamon and a brass band playing carols nearby, slightly flat.']];
  def('mktTreat', {
    place: 'market', sec: 'Buying on the square', icon: (L) => TREATS[L.season][0], title: (L) => TREATS[L.season][1], desc: 'What the season brings to the square. Cheers you up.', cost: 25, time: 0, per: 1,
    run(L) { L.joy(2.5); L.hp(0.5); return TREATS[L.season][2]; },
  });
  // Plants with a head start: a bed sown and already well on, even out of season.
  const PLANTS = ['toms', 'toms', 'leeks', 'leeks'], PLANTS_SAID = { toms: 'Tomato plants', leeks: 'Leek plants' };
  def('mktPlants', {
    place: 'market', sec: 'Buying on the square', icon: (L) => CROPS[PLANTS[L.season]].icon, cost: 110, per: 1,
    title: (L) => `${PLANTS_SAID[PLANTS[L.season]]} for the allotment`,
    desc: (L) => `A tray of plants already well on, for an empty bed: a good crop with less tending${CROPS[PLANTS[L.season]].sow.includes(L.season) ? '' : ', even out of season'}.`,
    show: (L) => !!L.s.plot,
    why: (L) => (L.s.plot.beds.some((b) => !b) ? null : 'Every bed on your plot is taken.'),
    run(L) {
      const p = L.s.plot, i = p.beds.findIndex((b) => !b), c = PLANTS[L.season];
      p.beds[i] = { c, age: 0, care: 2 };
      L.gain('craft', 0.4); L.joy(1);
      return `${L.pick(['You carry the tray up the hill and down again, and plant them out before dark.', 'The plant man says they are the best he has had all year. He says it to everyone.'])} A bed of ${CROPS[c].name.toLowerCase()} is in.`;
    },
  });

  // Allotment produce kept for the stall, if you say so, rather than left on
  // the table by the gate. (The honesty box gets what reap gives; the stall gets boxes of it instead.)
  const reap = A.reap.run;
  A.reap.run = function (L, ...rest) {
    const s = L.s, before = s.n.earned, text = reap.call(this, L, ...rest);
    const got = s.n.earned - before, m = s.mkt;
    if (!(m && m.veg && m.stall) || got <= 0) return text;
    s.cash -= got; s.n.earned -= got;
    const boxes = Math.max(1, Math.round(got / 60));
    addStock(L, 'veg', boxes, clamp(Math.round((0.45 + s.st.craft / 200) * 100) / 100, 0.1, 1));
    const was = `so the rest goes on a table by the gate with an honesty box. ${money(got)}.`;
    return text.includes(was) ? text.replace(was, `so the rest goes into boxes for your stall: ${boxes} of them.`) : `${text} (It goes to your stall instead: ${boxes} boxes.)`;
  };

  // ---- the Windle Show ----

  def('showOpen', {
    place: 'farm', sec: 'The Windle Show', icon: '🏵️', time: 0, open: 'mktShow', title: 'The Windle Show',
    desc: (L) => { const n = Object.keys(L.mktShowYear()).length; return n ? `You have entered ${n} class${n > 1 ? 'es' : ''} this year.` : 'On Tom’s top field this summer: rosettes for the best hens, honey, jam and pigs on the hill.'; },
    show: (L) => L.season === 1,
  });
  def('showEnter', {
    time: 0, cost: SHOW_FEE,
    why(L, c) {
      if (L.season !== 1) return 'The show is in summer.';
      if (!CLASSES[c]) return 'No such class.';
      if (L.mktShowYear()[c]) return 'One entry a class, each year.';
      return L.mktCanEnter(c);
    },
    run(L, c) {
      const s = L.s, m = s.mkt, k = CLASSES[c];
      if (m.show.y !== L.year) m.show = { y: L.year, c: {} };
      const mine = L.mktShowScore(c) + (L.rnd() - 0.5) * 0.24, bar = L.mktShowBar(c);
      let place = 1;
      for (let i = 0; i < 3; i++) if (bar + (L.rnd() - 0.5) * 0.3 > mine) place++;
      if (k.good) take(L, k.good, k.use);
      m.show.c[c] = place;
      farmUp(L, 0.4);
      const p = PLACINGS[place];
      if (!p) { L.joy(-1); return `${L.pick(['The judge looks at yours for a long time and then at somebody else’s.', 'Highly commended, which is what they say when they mean no.', 'A card that says “Unplaced”, in very good handwriting.'])} ${k.name}: no rosette this year.`; }
      L.cash(p.prize); L.joy(place === 1 ? 6 : 3);
      m.ros++;
      if (m.stall && place === 1) m.stall.rep = clamp(m.stall.rep + 4 * (1 - m.stall.rep / 130), 0, 100);
      let text = `${k.name}: a ${p.colour} rosette, ${p.name.toLowerCase()} prize, and ${money(p.prize)}.`;
      if (place === 1) {
        m.firsts[c] = (m.firsts[c] || 0) + 1;
        L.fame(0.5);
        if (Object.values(m.firsts).reduce((a, n) => a + n, 0) === 1) L.note(`Won a red rosette at the Windle Show: ${k.name.toLowerCase()}.`, 'big');
        text += ` ${L.pick(['Tom Windle shakes your hand as if he were pumping water.', 'The judge, a woman in a hat like a cake stand, says it is the best she has seen in years.', 'Priya Lal says she will put a card on your stall: PRIZE-WINNING.'])}`;
        // Three firsts at one show: the supreme champion's cup.
        if (Object.values(m.show.c).filter((n) => n === 1).length === 3) {
          m.champ++; L.cash(300); L.fame(2); L.joy(8);
          L.note('Supreme champion at the Windle Show.', 'big');
          L.say('🏆', 'Supreme champion at the Windle Show', 'good');
          text += ' And with three firsts, you are supreme champion: a silver cup with a dent in it, and $300.';
        }
      }
      return text;
    },
  });

  // ---- trophies ----

  Object.assign(TROPHIES, {
    mktHens: { name: 'Fresh eggs', icon: '🐔', desc: 'Keep hens of your own.', test: (L) => !!(L.s.mkt && L.s.mkt.herd.hens) },
    mktArk: { name: 'Noah’s smallholding', icon: '🐖', desc: 'Keep hens, bees, a goat and a pig all at once.', test: (L) => !!L.s.mkt && ['hens', 'bees', 'goat', 'pig'].every((k) => L.s.mkt.herd[k]) },
    mktTrader: { name: 'Saturday trader', icon: '🧺', desc: 'Trade on twenty Saturdays in Market Square.', test: (L) => !!L.s.mkt && L.s.mkt.n.days >= 20 },
    mktName: { name: 'Known on the square', icon: '🪧', desc: 'Make your stall’s name 80.', test: (L) => !!(L.s.mkt && L.s.mkt.stall && L.s.mkt.stall.rep >= 80) },
    mktRosette: { name: 'Red rosette', icon: '🏵️', desc: 'Win a class at the Windle Show.', test: (L) => !!L.s.mkt && Object.keys(L.s.mkt.firsts).length >= 1 },
    mktChamp: { name: 'Supreme champion', icon: '🏆', desc: 'Win three classes at one Windle Show.', test: (L) => !!L.s.mkt && L.s.mkt.champ >= 1 },
  });

  // ---- cards ----

  const m_ = (L) => L.s.mkt;
  const home = (L, kind) => { const h = m_(L).herd[kind]; return h && h.where === 'home' ? h : null; };
  // The thing you have most of on the stall.
  const most = (L) => { const out = L.mktOnStall().filter((g) => g !== 'art'); return out.length ? out.sort((a, b) => L.mktHave(b) - L.mktHave(a))[0] : null; };
  // Sells a share of what is on the stall, at a price: returns what it came to.
  const sellSome = (L, frac, lvl, mul) => {
    let sum = 0;
    for (const g of L.mktOnStall()) {
      const n = Math.floor(L.mktHave(g) * frac);
      if (n <= 0) continue;
      sum += Math.round(n * L.mktEach(g, lvl) * mul);
      take(L, g, n);
    }
    L.cash(sum); L.s.n.earned += sum; m_(L).n.take += sum;
    return sum;
  };
  addEvents([
    {
      id: 'mktFox', icon: '🦊', title: 'A fox in the henhouse', w: 4, cd: 12,
      when: (L) => { const h = home(L, 'hens'); return !!h && h.n >= 2; },
      text: 'Feathers all over the lawn at first light, one hen fewer, and a fox sitting on the compost heap licking its lips as if it means to come back.',
      opts: [
        { t: 'Fox-proof the run properly', cost: 180, run(L) { const h = home(L, 'hens'); h.n--; h.care = Math.min(100, h.care + 10); return 'Wire dug in a foot deep, a new bolt, and a light that comes on at a whisker. The fox looks at it all from the hedge, and leaves.'; } },
        { t: 'Sit up for it with a torch', check: ['fitness', 35], run(L, x, win) { const h = home(L, 'hens'); h.n--; if (win) { L.joy(3); return 'At two in the morning you and the fox see each other. You shout. It goes, at a trot, and does not come back.'; } h.n = Math.max(0, h.n - 1); if (!h.n) delete m_(L).herd.hens; L.joy(-3); return 'You nod off at one. At three, the fox does not.'; } },
        { t: 'Hope it has had its fill', run(L) { const h = home(L, 'hens'), lost = Math.min(h.n, L.int(2, 3)); h.n -= lost; if (!h.n) delete m_(L).herd.hens; L.joy(-4); return `It had not. ${lost} hens gone, and the rest will not come out of the house.`; } },
      ],
    },
    {
      id: 'mktSwarm', icon: '🐝', title: 'A swarm', w: 4, cd: 12,
      when: (L) => !!m_(L).herd.bees && L.season <= 1,
      text: 'A brown cloud hangs over the garden, roaring softly, and settles in a great hanging clump on next door’s apple tree. Half of one hive has decided to go and live somewhere else.',
      opts: [
        { t: 'Shake it into a box', check: ['craft', 40], run(L, x, win) { const h = m_(L).herd.bees; if (win) { if (h && h.n < L.mktCap('bees')) { h.n++; farmUp(L, 1); return 'One sharp shake, and the whole clump drops into the box like a dropped jumper. You have a new hive.'; } L.karma(2); return 'Into the box they go. With no room for another hive, you take them up to St Brigid’s, where the Reverend Hollis is delighted and flustered in equal parts.'; } L.hp(-3); return 'You shake. They drop, mostly onto you. They go off over the roofs, and you go off to find the vinegar.'; } },
        { t: 'Ring the vicar: she keeps bees', run(L) { L.karma(2); return 'The Reverend Alice Hollis arrives on a bicycle in a veil, says the bees are a gift from God and a nuisance to the insurers, and takes them away in a cardboard box on her handlebars.'; } },
        { t: 'Let them go', run(L) { const h = m_(L).herd.bees; if (h) h.care = Math.max(0, h.care - 15); return 'They lift off over the chimneys and are gone. The hive is quieter, and so, next summer, will the honey be.'; } },
      ],
    },
    {
      id: 'mktRival', icon: '🏷️', title: 'Across the square', w: 4, cd: 16,
      when: (L) => !!m_(L).stall && m_(L).stall.days >= 3 && !!most(L),
      ctx: most,
      text: (L, g) => `A new stall has gone up across the square from yours, selling ${plain(g)} at two-thirds of your price, under a banner that says ARTISAN.`,
      opts: [
        { t: 'Have a word with Priya', check: ['charm', 45], run(L, g, win) { if (win) { L.joy(2); return 'Priya reads their permit for a very long time, and then reads it again, aloud. By the next Saturday they have gone to try their luck in the next town.'; } m_(L).rival = 2; return '“It is a free square,” says Priya, which, from Priya, is a shock. Your Saturdays will be quieter for a while.'; } },
        { t: 'Cut your prices and see them off', run(L, g) { m_(L).stall.price[g] = 0; m_(L).stall.rep = clamp(m_(L).stall.rep + 3, 0, 100); L.joy(-1); return 'A fortnight of price war. Then the ARTISAN banner comes down, and you notice it says MADE IN BELGIUM on the back.'; } },
        { t: 'There is room for both of you', run(L) { m_(L).rival = 2; L.karma(1); return 'You take them a cup of tea. They are nice, which is annoying. Saturdays will be quieter for a while.'; } },
      ],
    },
    {
      id: 'mktInspect', icon: '📋', title: 'The health inspector', w: 3, cd: 16,
      when: (L) => !!m_(L).stall && ['milk', 'cheese', 'cake', 'eggs'].some((g) => L.mktIsOut(g) && L.mktHave(g) > 0),
      text: 'A woman with a clipboard and a probe thermometer is looking at your stall as though it had said something rude.',
      opts: [
        { t: 'Show her your records', check: ['smarts', 40], run(L, x, win) { const st = m_(L).stall; if (win) { st.rep = clamp(st.rep + 3, 0, 100); return 'Temperatures, dates, the lot, in a ring binder. She gives you five stars, laminated, for the front of the stall.'; } m_(L).shut = L.s.t; for (const g of ['milk', 'cheese', 'cake']) delete m_(L).stock[g]; st.rep = clamp(st.rep - 6, 0, 100); return 'Your records are on the back of an envelope, and the envelope is in the other coat. She shuts you until next season, and the dairy goes in the bin.'; } },
        { t: 'Offer her a slice of something', check: ['charm', 50], run(L, x, win) { if (win) { L.karma(-1); return 'She eats it standing up, makes a note that may say “excellent”, and moves on to the batteries man.'; } L.cash(-150); m_(L).shut = L.s.t; return 'That, she says, is very nearly an offence. A $150 fine, and shut until next season.'; } },
        { t: 'Bin the dairy and the cakes, and start again', run(L) { for (const g of ['milk', 'cheese', 'cake']) delete m_(L).stock[g]; L.joy(-2); return 'It hurts to watch it go in the bin. She signs you off with a small nod.'; } },
      ],
    },
    {
      id: 'mktChef', icon: '🧑‍🍳', title: 'A man off the television', w: 2, once: true,
      when: (L) => !!m_(L).stall && ['jam', 'honey', 'cheese'].some((g) => L.mktIsOut(g) && L.mktHave(g) >= 3 && L.mktQ(g) >= 0.6),
      ctx: (L) => ['honey', 'cheese', 'jam'].find((g) => L.mktIsOut(g) && L.mktHave(g) >= 3 && L.mktQ(g) >= 0.6) || null,
      ok: (L, g) => L.mktHave(g) >= 1,
      text: (L, g) => `A man in a very long scarf, whom you last saw on television shouting at a soufflé, is tasting your ${GOODS[g].name.toLowerCase()} with his eyes shut. A small crowd has gathered to see what he will say.`,
      opts: [
        { t: 'Sell him every jar you have', run(L, g) { const n = L.mktHave(g), sum = Math.round(n * L.mktEach(g, 2) * 1.5); take(L, g, n); L.cash(sum); L.s.n.earned += sum; m_(L).n.take += sum; L.fame(2); m_(L).stall.rep = clamp(m_(L).stall.rep + 8, 0, 100); L.note(`A chef off the television bought all your ${GOODS[g].name.toLowerCase()}.`); return `He buys the lot, for ${money(sum)}, and on Tuesday he holds a jar up to the camera and says your stall’s name. People come up the hill for weeks.`; } },
        { t: 'Give him one, and ask for a mention', run(L, g) { take(L, g, 1); L.fame(3); L.karma(1); m_(L).stall.rep = clamp(m_(L).stall.rep + 12, 0, 100); L.note('A chef off the television mentioned your stall.'); return '“Generous,” he says, which is not a word he uses on television. On Tuesday he says your stall’s name twice, the second time correctly.'; } },
      ],
    },
    {
      id: 'mktGoat', icon: '🐐', title: 'The goat is out', w: 4, cd: 12,
      when: (L) => !!home(L, 'goat'),
      text: 'The goat has eaten through its tether, a washing line and most of the dahlias next door, in that order. It is now on the roof of a car, looking pleased.',
      opts: [
        { t: 'Chase it round the gardens', check: ['fitness', 40], run(L, x, win) { if (win) { L.joy(3); L.gain('fitness', 0.6); return 'A rugby tackle in the rhubarb. The neighbours applaud, except the one with the dahlias.'; } L.hp(-2); L.cash(-120); return 'It leads you through four gardens and a pond. You pay $120 for the dahlias and have a bath.'; } },
        { t: 'Pay for the dahlias and buy a chain', cost: 200, run(L) { const h = home(L, 'goat'); if (h) h.care = Math.min(100, h.care + 10); return 'A heavy chain, a new stake and a bunch of flowers for next door. The goat eats the flowers.'; } },
        { t: 'Blame the vicar’s goat', run(L) { L.karma(-3); return 'There is no vicar’s goat. Everybody knows there is no vicar’s goat.'; } },
      ],
    },
    {
      id: 'mktBroody', icon: '🐣', title: 'A broody hen', w: 3, cd: 12,
      when: (L) => !!home(L, 'hens') && L.season <= 1,
      text: 'One of your hens has sat down on a clutch of eggs and will not get up. Try to move her and she makes a noise like a kettle.',
      opts: [
        { t: 'Let her sit', run(L) { const h = home(L, 'hens'), room = L.mktRoom('hens') - h.n, n = Math.min(3, Math.max(0, room)); h.n += n; L.joy(4); return n ? `Three weeks later: ${n === 1 ? 'one chick' : `${n} chicks`}, like pom-poms, under her. Your flock grows.` : 'Three chicks, like pom-poms. With no room for more, Tom takes them up to the farm and says you can visit.'; } },
        { t: 'Lift her off and take the eggs', run(L) { addStock(L, 'eggs', 2, 0.6); return 'You lift her off in oven gloves. She tells you exactly what she thinks of you, for some days.'; } },
      ],
    },
    {
      id: 'mktPath', icon: '🥾', title: 'The footpath', w: 3, once: true,
      when: (L) => m_(L).days >= 4,
      text: 'Tom Windle is at the farm gate with a petition and a face like thunder. The council mean to open a footpath across his bottom field, Mayor Pennington has said so in the Gazette, and the walkers are delighted.',
      opts: [
        { t: 'Sign Tom’s petition', run(L) { m_(L).tom = 1; L.karma(-1); return 'Tom grunts, which is thank you. From now on he pays you a little more, and talks to you a little more, mostly about the council.'; } },
        { t: 'Side with the walkers', run(L) { m_(L).tom = -1; L.karma(3); return 'You sign the other petition, the one at the library. Tom finds out by teatime. He still takes you on, but he pays you as if he were doing you a favour.'; } },
        { t: 'Stay out of it', run() { return '“Fence-sitter,” says Tom. He would know. He built most of the fences.'; } },
      ],
    },
    {
      id: 'mktTruffle', icon: '🐖', title: 'Rooting about', w: 3, cd: 20,
      when: (L) => !!m_(L).herd.pig,
      text: 'Your pig has spent the morning rooting about in the corner of its pen, and has turned up something that is not a turnip.',
      opts: [
        { t: 'Wipe it off and take a look', run(L) { const k = L.gotCurio(L.anyCurio(['coin', 'toy', 'book'])); return `It is ${k.a}, a bit muddy. The pig watches you take it with deep suspicion.`; } },
        { t: 'Let the pig keep it', run(L) { L.joy(2); return 'The pig buries it again, carefully, and lies down on top. Some things are the pig’s business.'; } },
      ],
    },
    {
      id: 'mktCoach', icon: '🚌', title: 'A coach party', w: 3, cd: 12,
      when: (L) => !!m_(L).stall && L.season === 1 && L.mktOnStall().length > 0,
      text: 'A coach from the city has parked across two pitches, and forty people in sun hats are moving across the square towards your stall.',
      opts: [
        { t: 'Put your prices up while they are here', run(L) { const n = sellSome(L, 0.35, 2, 1.1); m_(L).stall.rep = clamp(m_(L).stall.rep - 2, 0, 100); return n ? `They pay what you ask without blinking. ${money(n)}. Priya, watching, raises one eyebrow.` : 'They look, and look, and get back on the coach.'; } },
        { t: 'Keep your prices fair', run(L) { const n = sellSome(L, 0.25, 1, 1); m_(L).stall.rep = clamp(m_(L).stall.rep + 3, 0, 100); return n ? `${money(n)}, and three of them ask if you do mail order.` : 'They look, and look, and get back on the coach.'; } },
      ],
    },
    {
      id: 'mktMind', icon: '🧀', title: 'Mind the cheese', w: 3, cd: 16,
      when: (L) => !!m_(L).stall,
      text: 'Priya Lal has to take her mother to St Wren’s on Saturday, and asks if you would mind the cheese stall as well as your own. She does not ask people things.',
      opts: [
        { t: 'Of course', run(L) { const st = m_(L).stall; L.s.time = Math.max(0, L.s.time - 1); st.rep = clamp(st.rep + 5, 0, 100); L.karma(2); L.gain('charm', 1); return 'Two stalls, one of you. You sell forty cheeses you cannot pronounce. Priya brings you a wedge of something the size of a doorstep, and the square treats you as one of its own.'; } },
        { t: 'Not this week', run() { return '“Of course,” says Priya, and asks the batteries man, who sells eleven cheeses and a battery.'; } },
      ],
    },
    {
      id: 'mktPoorly', icon: '🩺', title: 'Off their food', w: 3, cd: 8,
      when: (L) => L.mktKinds().some((k) => m_(L).herd[k].care < 40),
      ctx: (L) => L.mktKinds().find((k) => m_(L).herd[k].care < 40) || null,
      ok: (L, k) => !!m_(L).herd[k],
      text: (L, k) => ({ hens: 'Your hens are off their food and off their lay, and stand about in the run with their feathers fluffed up.', bees: 'Your bees are too quiet. The few at the door of the hive are crawling, not flying.', goat: 'Your goat is off its food, which for a goat is like the sun going out.', pig: 'Your pig will not get up, even for the peelings.' })[k],
      opts: [
        { t: 'Call the vet', cost: 250, run(L, k) { const h = m_(L).herd[k]; if (h) h.care = Math.min(100, h.care + 40); return 'Injections, a powder for the water and a lecture about looking in more often. Better within the week.'; } },
        { t: 'Ask Tom what he would do', odds: (L) => clamp(0.3 + m_(L).farm / 140, 0.3, 0.95), run(L, k, win) { const h = m_(L).herd[k]; if (!h) return 'By the time you get home, they have perked up on their own.'; if (win) { h.care = Math.min(100, h.care + 30); farmUp(L, 1); return 'Tom looks, sniffs, and tells you something his grandfather did with cider vinegar. It works.'; } const one = h.n === 1; h.n--; if (h.n <= 0) delete m_(L).herd[k]; L.joy(-5); return `Tom’s remedy is not enough. You lose ${one ? `your ${BEASTS[k].one}` : `one of your ${BEASTS[k].many}`}.`; } },
      ],
    },
  ]);
}
