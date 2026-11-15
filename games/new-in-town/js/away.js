// New in Town: going away. Nobody in Starling Bay used to go anywhere; now the
// station has a board of this year's trips, from a borrowed tent in a farmer's
// field to three weeks on the other side of the world, and something to save
// for and look forward to at every means.
//
// A trip: pick where (this year's place for each kind of trip), who comes
// (just you, the two of you, the family, the whole family on you, friends, or
// taking a parent), how grandly, and when (now, or booked for a later season,
// with a deposit, which is something to look forward to). It costs money by
// the head and most of a season's time; the first trip in a year is your
// holiday, and a second costs you standing at work. Then it plays: two to four
// cards from the pools for that kind of trip (lost luggage, sunburn, a row in
// the car, a storm, a holiday romance or temptation, a stranger's kindness, a
// festival, a burglary at home...), with choices that remember who came, and
// the last evening. You come home with rest, mood, bonds with those who came
// (worse if it went badly), a named memory, and perhaps a souvenir for the
// mantelpiece and a postcard on the fridge. The life keeps a list.
//
// Over the years: a honeymoon after a wedding (the journal says when there has
// been one); the same caravan every summer, which the children grow out of and
// later bring their own children back to; a holiday romance that follows you
// home, and a stray one that does too, in a photograph; a season with a
// rucksack for the young; the cruise brochures that come after retiring; an
// old friend met abroad. And for people with means, a place of your own away
// (a static caravan, a cottage in the next bay, a villa abroad) with upkeep,
// lets, and storms, squatters and leaks to see to.
//
// The trips are booked through the engine's own `trip` action (x: { k, w, c }),
// so that what the rest of the town already does on a trip still happens
// (soul.js's "getting away", annals.js's coach when the line is shut); the
// engine's old eight holidays (x: a TRIPS id) still work if asked for, but are
// no longer on the station's board: this takes their place.
//
// State, all under s.away (see blank):
//   on: the trip under way { n, k, w, c, who, at, q, b, ctx, mem, mw, step, deck, ... } or null
//   book: a trip booked for later { id, k, w, c, t, cost, dep, at } or null
//   hols: the holidays taken [{ k, at, who, ids, mem, age, q, t, hon, gr }]
//   fridge: postcards [{ at, line, age }]; souv: souvenirs [{ i, name, at }]
//   own: a place of your own away { kind, at, paid, idx, fx, t, cond, let, n, seen, cd } or null
//   trad: the family caravan { n, last, on, best, done, back }
//   moon: a honeymoon still owed { p, t }; rom: a romance that may follow you home; secret: a stray one
//   yr: trips taken by year (for the boss); last: the season of the last trip; glow: { t, d }
//   n: counts { trips, far, abroad, pack, moon, days, back, owned, gap }; kinds: trips by kind

import { TROPHIES, TRIPS, CAREERS, SEASONS, money } from './data.js';
import { KINDS, EIGHT, WHO, WHO_ORDER, PARKS, BAYS, ABROAD, OWN, LET_SHARE, RESORTS, DAYS, clamp, first, his, cap, list, nth } from './away-lib.js';
import { tripCards, lifeCards } from './away-tales.js';

export { KINDS, EIGHT, WHO, WHO_ORDER, OWN, DAYS };
// The trip cards by id, once installed (for the checks, which deal particular ones).
export const TRIP_CARDS = {};

const round10 = (n) => Math.round(n / 10) * 10;
const round100 = (n) => Math.round(n / 100) * 100;
const yearOf = (t) => Math.floor(t / 4);
// A number from the life's own seed, for what each life has of its own (its caravan park, its bay).
const hash = (n) => { let t = (n ^ 0x9e3779b9) >>> 0; t = Math.imul(t ^ (t >>> 16), 0x45d9f3b) >>> 0; t = Math.imul(t ^ (t >>> 16), 0x45d9f3b) >>> 0; return (t ^ (t >>> 16)) >>> 0; };

// What a new life (or an old one, the first time it is opened) starts with.
function blank(s) {
  const seed = hash((s.rng || 1) + (s.pid || 0) * 7919);
  return {
    v: 1, seed, park: nth(PARKS, seed), bay: nth(BAYS, seed >>> 5), abroad: nth(ABROAD, seed >>> 9),
    on: null, book: null, hols: [], fridge: [], souv: [], own: null,
    trad: { n: 0, last: -9, on: false, best: 0, done: false, back: -99 },
    moon: null, rom: null, secret: null, broch: null, glow: null, yr: {}, last: -9, ser: 0,
    n: { trips: 0, far: 0, abroad: 0, pack: 0, moon: 0, days: 0, back: 0, owned: 0, gap: 0 }, kinds: {},
  };
}

// What going-away lines the trip starts with, by how you get there.
const OFF = {
  road: ['The car is packed to the roof, and somebody is already asking if you are nearly there.', 'You are away before six, with a flask of tea and a map that nobody can fold.', 'The boot will not shut until somebody sits on it. Then you are off.'],
  abroad: ['The airport bus leaves the station at four in the morning, and you are on it, passport in hand.', 'Passports, tickets, money: you check them nine times between the front door and the station.', 'You leave the key with a neighbour, a list for the cat, and the Bay behind you.'],
  coach: ['Ken the driver welcomes you aboard over the microphone, and then over it again, louder.', 'The coach leaves from outside the station at half past seven, with a smell of egg sandwiches already.', 'You get a window seat, and a neighbour with a bag of boiled sweets and a great deal to say.'],
  city: ['The train to the city, a paperback and a cup of tea that costs more than the paperback.', 'You catch the early train and watch the fields turn into suburbs.', 'A weekend bag, your good shoes, and the 8:15 from the Bay.'],
  cruise: ['The ship is the size of the High Street and has more restaurants.', 'A band plays on the quay as the ship pulls out. Everybody waves at nobody in particular.', 'You find your cabin on the third try, and the buffet on the first.'],
  gap: ['One rucksack, one rail pass, and a goodbye at the station that goes on rather long.', 'Your mother has sewn your name into everything. You leave with the whole world ahead of you and a toothbrush.', 'You have a plan. It lasts until the first stop.'],
};
const offFor = (k, K) => (k === 'gap' ? OFF.gap : k === 'cruise' ? OFF.cruise : k === 'coach' ? OFF.coach : k === 'city' ? OFF.city : K.abroad ? OFF.abroad : OFF.road);
// Home again, by how it went (worst first).
const HOME = [
  ['Home at last, and gladder of it than you thought possible.', 'Home again. You need a holiday to get over it.', 'Home, and the kettle never looked so good.'],
  ['Home again, more or less rested.', 'Home again, with a suitcase of damp washing.', 'Home, glad you went and glad to be back.'],
  ['Home again, brown and broke.', 'Home again, rested to the bone.', 'Home again, and the Bay looks smaller and dearer.'],
  ['Home again, and already planning the next one.', 'Home again, and nobody wants to unpack.', 'Home again, somebody slightly better than the one who went.'],
];
// The boss, about a second trip in a year.
const BOSS = ['The boss signs the form without looking up, which is never a good sign.', '“Again?” says the boss, and writes something down.', 'At work there is a meeting about holidays, with you in mind.'];

export function install({ def, A, Life, val, hooks, addEvents }) {
  const W = (L) => L.s.away;

  // ---- what each trip is ----

  Object.assign(Life.prototype, {
    // A kind of trip, as a table row (your own place away is built from what you own).
    awayKind(k) {
      if (k !== 'own') return KINDS[k] || null;
      const o = this.s.away.own;
      if (!o) return null;
      const D = OWN[o.kind];
      return {
        name: `A week at your ${D.name}`, icon: D.icon, time: D.time, fixed: D.fare[0], per: D.fare[1], n: 2, joy: 8, hp: 4, bond: 6,
        months: [0, 1, 2, 3], road: o.kind !== 'villa', abroad: o.kind === 'villa', peak: 1, cls: ['Your own place'], clsX: [1],
        blurb: o.kind === 'villa' ? `Flights to ${o.at}, and the key under the pot by the door.` : `Forty minutes up the coast to ${o.at}, and the key under the pot by the door.`,
        trip: () => `a week at your ${D.name} ${o.kind === 'villa' ? 'in' : 'at'} ${o.at}`, mem: () => `the week at the ${D.name}`, last: o.kind === 'villa' ? 'one last swim in your own pool' : 'one last walk down to the sea',
      };
    },
    // Where a kind of trip goes this year: a different place each year, in an order of the life's own.
    awayDest(k, t = this.s.t) {
      const A = this.s.away;
      if (k === 'caravan') return A.park;
      if (k === 'own') return A.own ? A.own.at : '';
      const K = KINDS[k];
      return nth(K.where, (A.seed >>> (k.length + 3)) + yearOf(t));
    },
    awayDestIndex(k, t = this.s.t) { const K = KINDS[k]; return K && K.where ? (((this.s.away.seed >>> (k.length + 3)) + yearOf(t)) % K.where.length) : 0; },
    // Who would come, and how many of them you pay for (children count half, the very small nothing; friends pay their own way).
    awayParty(w, k) {
      const s = this.s, pt = this.partner(), kids = this.kids().filter((p) => p.age < 18), grown = this.kids().filter((p) => p.age >= 18);
      const grand = this.grandkids ? this.grandkids() : [];
      const head = (p) => (p.age < 3 ? 0 : p.age < 18 ? 0.5 : 1);
      if (!WHO[w]) return { why: 'Who with?' };
      if (k === 'gap' && w !== 'solo' && w !== 'friends') return { why: 'A rucksack is for one, or for friends.' };
      if (w === 'solo') return { ids: [], pay: 1 };
      if (w === 'pair') return pt ? { ids: [pt.id], pay: 2 } : { why: 'You would need somebody to go with.' };
      if (w === 'family') {
        if (!kids.length) return { why: 'No children at home to take.' };
        const ids = [...(pt ? [pt.id] : []), ...kids.map((p) => p.id)];
        return { ids, pay: 1 + (pt ? 1 : 0) + kids.reduce((a, p) => a + head(p), 0), school: kids.filter((p) => p.age >= 5 && p.age <= 16).length };
      }
      if (w === 'clan') {
        if (!grown.length || (!grand.length && grown.length + kids.length < 2)) return { why: 'For a family with grown-up children, and theirs.' };
        const all = [...this.kids(), ...grand];
        return { ids: [...(pt ? [pt.id] : []), ...all.map((p) => p.id)], pay: 1 + (pt ? 1 : 0) + all.reduce((a, p) => a + head(p), 0), school: all.filter((p) => p.age >= 5 && p.age <= 16).length };
      }
      if (w === 'friends') {
        const fr = this.friends().filter((p) => p.bond >= 25).sort((a, b) => b.bond - a.bond || a.id - b.id).slice(0, 2);
        return fr.length ? { ids: fr.map((p) => p.id), pay: 1 } : { why: 'Nobody close enough to ask.' };
      }
      const par = s.people.filter((p) => p.kind === 'parent');
      if (!par.length) return { why: 'No parent to take.' };
      if (par.every((p) => p.age >= 90)) return { why: 'Too frail to travel now.' };
      const go = par.filter((p) => p.age < 90);
      return { ids: go.map((p) => p.id), pay: 1 + go.length };
    },
    // Who came, said mid-sentence: "on your own", "with Sam and the children".
    awaySaid(ids, w) {
      const ps = ids.map((id) => this.person(id)).filter(Boolean);
      if (!ps.length) return 'on your own';
      if (w === 'clan') return 'with the whole family';
      const pt = ps.find((p) => p.kind === 'partner' || p.kind === 'spouse'), kids = ps.filter((p) => p.kind === 'child');
      if (w === 'family' && kids.length >= 2) return `with ${pt ? `${first(pt)} and ` : ''}the children`;
      const par = ps.filter((p) => p.kind === 'parent');
      if (par.length === 2 && par.every((p) => /^(Mum|Dad)$/.test(p.name))) return 'with your mum and dad';
      return `with ${list(ps.map((p) => (/^(Mum|Dad)$/.test(p.name) ? `your ${p.name.toLowerCase()}` : first(p))))}`;
    },
    // The season a trip would go in: now (0), or so many seasons on.
    awaySeason(when = 0) { return (this.s.t + (when || 0)) % 4; },
    // What it costs, all in: by the head, by how grandly, by the season (and $60 a child taken out of school).
    awayCost(x, when = 0) {
      const K = this.awayKind(x && x.k);
      if (!K) return 0;
      const P = x.ids ? { ids: x.ids, pay: x.pay } : this.awayParty(x.w, x.k);
      if (P.why) return 0;
      const sn = this.awaySeason(when), c = clamp(Math.round(x.c || 0), 0, K.cls.length - 1);
      const sea = sn === 1 ? K.peak || 1 : sn === 3 ? K.off || 1 : 1;
      let n = (K.fixed + K.per * P.pay) * K.clsX[c] * sea;
      if (sn !== 1 && P.school) n += 60 * P.school;
      if (this.s.heir === 'globe') n *= 0.5;
      return round10(n);
    },
    awayTime(k) { const K = this.awayKind(k); return K ? Math.min(K.time, this.timeMax()) : 0; },
    // Why not: everything but the time and the money (those the engine checks itself).
    awayWhy(x, o = {}) {
      const s = this.s, A = s.away;
      if (!x || typeof x !== 'object' || (!KINDS[x.k] && x.k !== 'own')) return 'Where to?';
      const K = this.awayKind(x.k);
      if (!K) return 'You have nowhere of your own away.';
      if (!Number.isInteger(x.c || 0) || (x.c || 0) < 0 || (x.c || 0) >= K.cls.length) return 'Not like that.';
      const P = this.awayParty(x.w, x.k);
      if (P.why) return P.why;
      const sn = this.awaySeason(o.when);
      if (!K.months.includes(sn)) return K.shut || 'Not at this time of year.';
      if (K.young && s.age > 25) return 'A rucksack and a rail pass are for the young.';
      if (K.young && s.job) return 'Not with a job to go to. (Hand in your notice first.)';
      if (K.young && s.course) return 'Not halfway through a course.';
      if (x.k === 'walk' && x.w === 'parent' && this.s.people.some((p) => P.ids.includes(p.id) && p.age >= 80)) return 'Not with those knees. Somewhere flatter.';
      if (x.k === 'own' && A.own.let && sn === 1) return 'It is let for the summer.';
      if (K.abroad && s.run) return 'Not with your face up at every port.';
      if (K.abroad && s.f.licence > s.t) return 'Not while you are out on licence.';
      if (o.book) return null;
      if (A.on) return 'You are away already.';
      if (A.last === s.t) return 'You have only just got back.';
      if (s.health < 25) return 'You are not well enough to travel.';
      if (s.ill && s.ill.sev >= 2) return `Not with your ${s.ill.name}.`;
      return null;
    },
    // Trips this year (the first is your holiday; the boss minds a second).
    awayYearUsed() { return this.s.away.yr[yearOf(this.s.t)] || 0; },
    awayBossMinds() { const j = this.s.job; return !!j && !CAREERS[j.c].shady && !(CAREERS[j.c].summer && this.season === 1) && this.awayYearUsed() >= 1; },
    // What a sum is to somebody of your means, in a word or two.
    awayHint(n) {
      const s = this.s, liquid = s.cash + s.bank, worth = Math.max(liquid, this.netWorth());
      if (n > liquid) return 'More than you have';
      if (n <= worth * 0.02 || n <= 150) return 'Small change, for you';
      if (n <= worth * 0.08) return 'About right for you';
      if (n <= worth * 0.25) return 'A treat';
      return 'A stretch';
    },
    awayBooked() { return this.s.away.book; },

    // ---- a place of your own away ----
    awayOwnName(kind = this.s.away.own && this.s.away.own.kind) { return kind ? OWN[kind].name : ''; },
    awayOwnAt(kind) { const A = this.s.away; return kind === 'static' ? A.park : kind === 'cottage' ? A.bay : A.abroad; },
    awayOwnPrice(kind) { const D = OWN[kind]; return kind === 'static' ? round100(D.price * Math.sqrt(this.s.idx)) : Math.round(D.price * this.s.idx / 1000) * 1000; },
    // What it is worth: a caravan loses a little every year; a cottage follows the price of houses; a villa that,
    // and the money over there. A place let go is worth less.
    awayOwnWorth() {
      const o = this.s.away.own;
      if (!o) return 0;
      const fit = 0.75 + 0.25 * o.cond / 100, yrs = (this.s.t - o.t) / 4;
      if (o.kind === 'static') return round100(o.paid * 0.95 ** yrs * fit);
      return Math.round(o.paid * (this.s.idx / o.idx) * (o.kind === 'villa' ? o.fx : 1) * fit / 1000) * 1000;
    },
    awayOwnUpkeep() { const o = this.s.away.own; return o ? round10(OWN[o.kind].upkeep * this.s.idx) : 0; },
    // What letting it brings in this season (good repair lets better; a poor economy lets worse).
    awayOwnLet(sn = this.season) {
      const o = this.s.away.own;
      if (!o || !o.let) return 0;
      return round10(OWN[o.kind].let * LET_SHARE[sn] * (o.cond >= 50 ? 0.6 + 0.4 * o.cond / 100 : 0.5) * (1 + 0.06 * (this.s.eco || 0)) * Math.sqrt(this.s.idx));
    },
    awayOwnMend() { const o = this.s.away.own; return o && o.cond < 95 ? round10((100 - o.cond) * this.awayOwnWorth() * 0.0012 + 150) : 0; },
    awayBuyWhy(kind) {
      const s = this.s, D = OWN[kind];
      if (!D) return 'Nothing like that for sale.';
      if (s.away.own) return 'You have a place away already. One is plenty to worry about.';
      if (this.netWorth() < D.need * this.s.idx) return `For somebody worth about ${money(round100(D.need * this.s.idx))} or more.`;
      return null;
    },

    // ---- a day out on the coach ----
    awayDay() {
      const sn = this.season, D = DAYS[sn], r = nth(RESORTS, yearOf(this.s.t) + (this.s.away.seed >>> 3));
      return { icon: D.icon, beach: !!D.beach, title: D.title(r), blurb: D.blurb(r), r };
    },
    awayDayParty() { const pt = this.partner(); return [...(pt && pt.live ? [pt] : []), ...this.kids().filter((k) => k.age < 18)]; },
    awayDayCost() { return 20 + 12 * this.awayDayParty().length; },

    // ---- across the family's lives ----
    // (chapters.js could carry this to the heir in the carry it builds, and hand it back with awayTakeOn: see the report.)
    awayCarry() {
      const A = this.s.away;
      return { park: A.park, bay: A.bay, abroad: A.abroad, trad: A.trad.best, hols: A.n.trips, own: A.own ? { kind: A.own.kind, at: A.own.at, paid: this.awayOwnWorth(), cond: A.own.cond } : null };
    },
    awayTakeOn(c) {
      if (!c || typeof c !== 'object') return;
      const A = this.s.away;
      if (typeof c.park === 'string') A.park = c.park;
      if (typeof c.bay === 'string') A.bay = c.bay;
      if (typeof c.abroad === 'string') A.abroad = c.abroad;
      if (c.trad >= 3) A.trad.heir = c.trad;
      if (c.own && OWN[c.own.kind]) A.own = { kind: c.own.kind, at: c.own.at, paid: c.own.paid, idx: this.s.idx, fx: 1, t: this.s.t, cond: clamp(c.own.cond || 80, 20, 100), let: false, n: 0, seen: this.s.t, cd: this.s.t + 4 };
    },
  });

  // ---- the trip itself ----

  const live = (L, x) => !L.s.gaol && !!L.s.away && !!L.s.away.on && !!x && L.s.away.on.n === x.n;
  const people = (L, tr) => tr.who.map((id) => L.person(id)).filter(Boolean);
  // A memory, if it is a bigger one than the trip already has.
  const mem = (tr, text, w = 2) => { if (w > tr.mw) { tr.mem = text; tr.mw = w; } };

  // The cards a trip is made of: from the pools for its kind, a few that fit who came, then the last evening.
  // (A badly packed case means something has been left behind; a well packed one, nothing.)
  let SPECS = [];
  function deal(L, tr) {
    const K = L.awayKind(tr.k), n = Math.max(1, K.n - 1), deck = [];
    const pool = [];
    for (const c of SPECS) {
      if (c.id === 'awLast') continue;
      if (c.kinds !== '*' && !c.kinds.includes(tr.k)) continue;
      if (c.when && !c.when(L, tr)) continue;
      const w = typeof c.w === 'function' ? c.w(L, tr) : c.w;
      if (w > 0) pool.push([c, w]);
    }
    const take = (c) => { deck.push(c.id); tr.ctx[c.id] = c.ctx ? c.ctx(L, tr) || { v: L.int(0, 99) } : { v: L.int(0, 99) }; const i = pool.findIndex(([q]) => q === c); if (i >= 0) pool.splice(i, 1); };
    const forgot = pool.find(([c]) => c.id === 'awForgot');
    if (forgot && tr.p < 0.35) take(forgot[0]);
    else if (forgot && tr.p >= 0.75) pool.splice(pool.indexOf(forgot), 1);
    // (The trip of a lifetime always has the thing you went all that way to see.)
    const wonder = pool.find(([c]) => c.id === 'awWonder');
    while (deck.length < n - (wonder ? 1 : 0) && pool.length) {
      const opts = pool.filter(([c]) => c.id !== 'awWonder'), total = opts.reduce((a, [, w]) => a + w, 0);
      if (!opts.length) break;
      let r = L.rnd() * total, pickC = opts[0][0];
      for (const [c, w] of opts) { pickC = c; r -= w; if (r < 0) break; }
      take(pickC);
    }
    if (wonder) take(wonder[0]);
    tr.ctx.awLast = { v: L.int(0, 99) };
    deck.push('awLast');
    return deck;
  }

  // Off you go. x: { k, w, c, p (how well you packed, 0 to 1) }. o: { card (started from a card: the time is
  // taken here), ids (who, decided already), at, hon, gr, trad }.
  function begin(L, x, o = {}) {
    const s = L.s, A = s.away, K = L.awayKind(x.k), P = o.ids ? { ids: o.ids } : L.awayParty(x.w, x.k);
    const tr = {
      n: ++A.ser, k: x.k, w: x.w, c: clamp(Math.round(x.c || 0), 0, K.cls.length - 1), who: (P.ids || []).slice(), at: o.at || L.awayDest(x.k), di: L.awayDestIndex(x.k),
      q: 0, b: {}, ctx: {}, mem: null, mw: 0, step: 0, deck: [], t: s.t, p: typeof x.p === 'number' ? clamp(x.p, 0, 1) : 0.5,
      hon: false, gr: !!o.gr, trad: !!o.trad, cut: false, souv: null,
    };
    // A honeymoon owed is taken the first time the two of you go anywhere.
    const pt = L.partner();
    if (pt && pt.kind === 'spouse' && tr.who.includes(pt.id) && (o.hon || (A.moon && A.moon.p === pt.id))) { tr.hon = true; A.moon = null; }
    tr.said = L.awaySaid(tr.who, x.w);
    if (tr.p >= 0.75) tr.q += 1;
    A.on = tr; A.last = s.t;
    if (o.card) s.time = Math.max(0, s.time - L.awayTime(x.k));
    // The first trip in a year is your holiday; a second, the boss minds. (A summer away in a job with long
    // summers is no trouble to anybody.)
    let boss = '';
    const j = s.job, free = !!j && !!CAREERS[j.c].summer && L.season === 1;
    if (!free) {
      const y = yearOf(s.t), used = A.yr[y] || 0;
      A.yr = { [y]: used + 1, ...(A.yr[y - 1] ? { [y - 1]: A.yr[y - 1] } : {}) };
      if (used >= 1 && j && !CAREERS[j.c].shady) {
        j.perf = clamp(j.perf - (6 + 2 * L.awayTime(x.k)), 0, 100); s.stand[j.c] = j.perf;
        boss = ` ${L.pick(BOSS)}`;
      }
    }
    if (EIGHT.includes(x.k)) s.trips[x.k] = (s.trips[x.k] || 0) + 1;
    if (x.p != null) A.n.pack = Math.max(A.n.pack, tr.p);
    tr.deck = deal(L, tr);
    s.pend.unshift({ id: tr.deck[0], x: { n: tr.n } });
    // (A trip that begins with a card is a trip all the same, to the rest of the town: see the top of this file.)
    if (o.card) for (const f of hooks.acted) f(L, 'trip', x, x);
    return `${cap(K.trip(tr.at))}, ${tr.said}. ${L.pick(offFor(x.k, K))}${tr.p >= 0.75 ? ' Everything you need is packed, and nothing you do not.' : ''}${boss}`;
  }

  // Each card of a trip, once answered, brings on the next; after the last comes home.
  function onward(L, tr) {
    if (L.s.away.on !== tr) return '';
    tr.step++;
    if (tr.cut || tr.step >= tr.deck.length) return home(L, tr);
    L.s.pend.unshift({ id: tr.deck[tr.step], x: { n: tr.n } });
    return '';
  }

  // Home again: what it did for you, and for those who came, and what it is remembered as.
  function home(L, tr) {
    const s = L.s, A = s.away, K = L.awayKind(tr.k) || KINDS.caravan, who = people(L, tr);
    A.on = null;
    const q = clamp(tr.q, -6, 6), band = q >= 3 ? 3 : q >= 0 ? 2 : q >= -2 ? 1 : 0, cls = tr.c || 0;
    const fresh = !(A.kinds[tr.k] > 0);
    const f = [0.35, 0.7, 1, 1.25][band] * (fresh ? 1.2 : 1) * (1 + 0.12 * cls) * (tr.cut ? 0.5 : 1);
    L.joy(K.joy * f);
    L.hp((K.hp + cls * 1.5) * (band ? 1 : 0.5) * (tr.cut ? 0.5 : 1));
    for (const [k, n] of K.stat || []) L.gain(k, n * (band ? 1 : 0.5));
    const pt = L.partner();
    for (const p of who) {
      const d = K.bond + cls + [-8, -2, 1, 3][band] + (tr.b[p.id] || 0) + (tr.hon && p === pt ? 6 : 0);
      L.bond(p, tr.cut ? Math.min(d, d / 2) : d);
      if (L.midSaw) L.midSaw(p);
    }
    if (L.midFresh) L.midFresh(1);
    A.kinds[tr.k] = (A.kinds[tr.k] || 0) + 1;
    A.n.trips++;
    if (K.abroad) A.n.abroad++;
    if (tr.k === 'far') A.n.far++;
    if (tr.k === 'gap') A.n.gap++;
    if (tr.hon) A.n.moon++;
    if (tr.gr) A.n.back++;
    if (tr.k === 'own' && A.own) { A.own.cond = Math.min(100, A.own.cond + 20); A.own.n++; A.own.seen = s.t; }
    const name = tr.mem || (tr.hon ? `the honeymoon: ${K.mem(tr.at)}` : K.mem(tr.at));
    A.hols.push({ k: tr.k, at: tr.at, who: tr.said, ids: tr.who.slice(), mem: name, age: s.age, q: band, t: s.t, ...(tr.hon ? { hon: 1 } : {}), ...(tr.gr ? { gr: 1 } : {}), ...(tr.cut ? { cut: 1 } : {}) });
    if (A.hols.length > 80) A.hols.splice(0, A.hols.length - 80);
    if (band >= 2 && !tr.cut) A.glow = { t: s.t, d: band === 3 ? 3 : 2 };
    // The family caravan: every summer with the children, and after three it is a tradition.
    let trad = '';
    const kidsOn = who.filter((p) => p.kind === 'child' && p.age < 18);
    if (tr.k === 'caravan' && L.season === 1 && kidsOn.length) {
      const T = A.trad, y = yearOf(s.t);
      T.n = T.last === y - 1 ? T.n + 1 : T.last === y ? T.n : 1;
      T.last = y; T.best = Math.max(T.best, T.n);
      if (T.n >= 3 && !T.on) { T.on = true; T.done = false; L.note(`A family tradition: every summer, the caravan at ${A.park}.`, 'big'); trad = ` That is three summers running at ${A.park}: a family tradition, now.`; }
    }
    const big = tr.hon || tr.gr || tr.k === 'far' || tr.k === 'gap' || (K.abroad && A.n.abroad === 1);
    L.note(`${tr.hon ? 'Honeymoon' : 'Away'}: ${K.trip(tr.at)}, ${tr.said}. “${cap(name)}.”`, big ? 'big' : '');
    return `${L.pick(HOME[band])} It goes down as “${name}”.${trad}`;
  }

  // A trip booked for later (the deposit is paid by whoever asks for it: the action, or a card).
  function deposit(L, x) { return round10(L.awayCost(x, x.at) * 0.2); }
  function book(L, x) {
    const s = L.s, A = s.away, K = L.awayKind(x.k), dep = deposit(L, x), cost = L.awayCost(x, x.at);
    A.book = { id: ++A.ser, k: x.k, w: x.w, c: Math.round(x.c || 0), t: s.t + x.at, cost, dep, at: L.awayDest(x.k, s.t + x.at) };
    return `${L.pick(['The woman at the ticket window writes it all in a big book, slowly, and gives you a receipt with a picture of a palm tree on it.', 'Booked, and the deposit paid. You put the receipt on the mantelpiece, where you can see it.', 'Booked. You will spend more time looking forward to it than doing it, which is half the point.'])} ${cap(K.trip(A.book.at))}, ${L.awaySaid(L.awayParty(x.w, x.k).ids || [], x.w)}, in the ${SEASONS[A.book.t % 4].toLowerCase()}: ${money(cost - dep)} to pay when you go.`;
  }

  // The trip's cards, from away-tales.js: each answered card brings on the next.
  const H = { live, people, mem, begin, home, onward, W, book, deposit };
  const asEvent = (c) => {
    const T = (L) => L.s.away.on, C = (L) => (L.s.away.on && L.s.away.on.ctx[c.id]) || {};
    return {
      id: c.id, w: 0, log: false, ok: live,
      icon: (L, x) => (live(L, x) ? val(c.icon, L, T(L), C(L)) : '🧳'),
      title: (L, x) => (live(L, x) ? val(c.title, L, T(L), C(L)) : ''),
      text: (L, x) => (live(L, x) ? c.text(L, T(L), C(L)) : ''),
      opts: c.opts.map((o) => ({
        t: (L, x) => (live(L, x) ? val(o.t, L, T(L), C(L)) : ''),
        show: (L, x) => live(L, x) && (!o.show || !!o.show(L, T(L), C(L))),
        ...(o.cost ? { cost: (L, x) => (live(L, x) ? Math.round(val(o.cost, L, T(L), C(L)) || 0) : 0) } : {}),
        ...(o.check ? { check: o.check } : {}),
        ...(o.odds ? { odds: (L, x) => o.odds(L, T(L), C(L)) } : {}),
        run(L, x, win) {
          const tr = T(L);
          if (!tr) return '';
          const said = o.run(L, tr, C(L), win) || '', next = onward(L, tr);
          return said && next ? `${said} ${next}` : said || next;
        },
      })),
    };
  };
  SPECS = tripCards(H);
  for (const c of SPECS) TRIP_CARDS[c.id] = c;
  addEvents([...SPECS.map(asEvent), ...lifeCards(H)]);

  // ---- the engine's trip, taught the new ones ----

  // (The old eight, by name, still go as they did: a saved routine or an old test may ask for one.)
  const old = { time: A.trip.time, cost: A.trip.cost, why: A.trip.why, run: A.trip.run };
  const mine = (x) => !!x && typeof x === 'object' && (!!KINDS[x.k] || x.k === 'own');
  const oldId = (x) => typeof x === 'string' && !!TRIPS[x];
  A.trip.time = (L, x) => (mine(x) ? L.awayTime(x.k) : oldId(x) ? val(old.time, L, x) : 0);
  A.trip.cost = (L, x) => (mine(x) ? L.awayCost(x) : oldId(x) ? val(old.cost, L, x) : 0);
  A.trip.why = (L, x) => (mine(x) ? L.awayWhy(x) : oldId(x) ? (old.why ? old.why(L, x) : null) : 'Where to?');
  A.trip.run = (L, x) => (mine(x) ? begin(L, x) : old.run(L, x));
  // The station's board is this part's now: the old list of eight is not shown there.
  const placeActions = Life.prototype.placeActions;
  Life.prototype.placeActions = function (place) {
    const out = placeActions.call(this, place);
    return place === 'station' ? out.filter((a) => !(a.id === 'trip' && typeof a.x === 'string')) : out;
  };

  // ---- the station ----

  def('awayTrips', {
    place: 'station', sec: 'Going away', icon: '🧳', title: 'This year’s trips', time: 0, open: 'awayTrips',
    desc: (L) => {
      const A = W(L), b = A.book;
      if (b) return `Booked: ${L.awayKind(b.k) ? L.awayKind(b.k).name.toLowerCase() : 'a trip'}, for the ${SEASONS[b.t % 4].toLowerCase()}. ${money(b.cost - b.dep)} still to pay.`;
      return `From a borrowed tent to the trip of a lifetime.${L.awayBossMinds() ? ' You have had this year’s holiday: another would cost you at work.' : ''}`;
    },
  });
  def('awayPlaceOpen', {
    place: 'station', sec: 'Going away', icon: (L) => (W(L).own ? OWN[W(L).own.kind].icon : '🏡'), time: 0, open: 'awayPlace',
    title: (L) => (W(L).own ? `Your ${L.awayOwnName()} at ${W(L).own.at}` : 'A place of your own away'),
    desc: (L) => (W(L).own ? `Worth ${money(L.awayOwnWorth())}${W(L).own.let ? ', let to holidaymakers' : ''}.` : 'A static caravan, a cottage up the coast, or a villa abroad.'),
    show: (L) => !!W(L).own || L.netWorth() >= OWN.static.need * L.s.idx,
  });
  def('awayDay', {
    place: 'station', sec: 'Going away', icon: (L) => L.awayDay().icon, title: (L) => L.awayDay().title, time: 1, per: 1, cost: (L) => L.awayDayCost(),
    desc: (L) => `${L.awayDay().blurb}${L.awayDayParty().length ? ' The family comes too.' : ''}`,
    // x: how well you found your lot again on the beach (0 to 1), if it was played; otherwise an ordinary day.
    run(L, x) {
      const s = L.s, A = s.away, D = L.awayDay(), sc = typeof x === 'number' ? clamp(x, 0, 1) : 0.5, ps = L.awayDayParty();
      A.n.days++;
      L.joy(3 + 3 * sc); L.hp(1);
      for (const p of ps) { L.bond(p, 2 + (sc >= 0.7 ? 1 : 0)); if (L.midSaw) L.midSaw(p); }
      const kids = ps.filter((p) => p.kind === 'child'), k = kids.length ? first(L.pick(kids)) : null;
      if (D.beach) {
        if (sc >= 0.7) return L.pick([`You find your windbreak again first time, with the ice creams still ice creams. ${k ? `${k} buries you up to the neck, and is allowed to.` : 'You sleep for an hour with a hanky on your face.'}`, `A perfect day at ${D.r}: the tide out, the donkeys in, and nobody sunburnt. ${k ? `${k} falls asleep on the coach with a bucket on ${his(kids.find((p) => first(p) === k))} lap.` : 'You come home pink and pleased.'}`, `Sandcastles, a pier, and chips eaten out of the paper on the sea wall. ${k ? `${k} wants to live at ${D.r}.` : 'Nobody wants anything from you all day.'}`]);
        if (sc >= 0.35) return L.pick([`The beach at ${D.r} is so full you can barely see the sand. You find your spot again on the second go, and the ice creams only a little melted.`, `A good day, mostly. It is the getting back to your windbreak with the teas that nearly finishes you.`, `You spend half an hour looking for your towel among four thousand towels. The rest is lovely.`]);
        return L.pick([`You never do find your spot again. You eat the melted ice creams standing up, by the lifeguard hut, and go home early.`, `Somebody else is sitting on your towel when you find it. It takes a while to find it.`, `${D.r} is heaving. You lose your windbreak, then your temper, then the coach.`]);
      }
      return s.t % 4 === 2
        ? L.pick([`Six miles of coloured bulbs along the front at ${D.r}, chips in paper and a tram ride in the dark.`, `The lights come on all at once along the front, and the whole crowd goes “ooh”. You go “ooh” too.`, `You walk the whole length of the lights and back, and get home after midnight with cold ears.`])
        : L.pick(['The dame is a man called Trevor with very big shoes. You shout “behind you” until you lose your voice.', 'The cow with two people in it falls over in the second act, and gets the biggest cheer of the night.', 'Sweets thrown into the audience, a sing-along with the words on a sheet, and a coach home full of sleepy people.']);
    },
  });

  // ---- booking ahead ----

  // Booked for a later season: a fifth now, the rest when you go. Something to look forward to.
  // x: { k, w, c, at: how many seasons on (1 to 3) }.
  const bookX = (x) => mine(x) && [1, 2, 3].includes(x.at);
  def('awayBook', {
    time: 0, cost: (L, x) => (bookX(x) ? deposit(L, x) : 0),
    why: (L, x) => (!bookX(x) ? 'When?' : W(L).book ? 'You have a trip booked already.' : L.awayWhy(x, { when: x.at, book: true })),
    run: (L, x) => book(L, x),
  });
  def('awayCancel', {
    time: 0, why: (L) => (W(L).book ? null : 'Nothing is booked.'),
    run(L) {
      const A = W(L), b = A.book;
      A.book = null;
      L.joy(-2);
      for (const id of (L.awayParty(b.w, b.k).ids || [])) { const p = L.person(id); if (p) L.bond(p, -2); }
      return `You ring and cancel. The ${money(b.dep)} deposit is not coming back, and nor, for a while, is the mood in the house.`;
    },
  });

  // ---- a place of your own away ----

  def('awayBuy', {
    time: 0, cost: (L, kind) => (OWN[kind] ? L.awayOwnPrice(kind) : 0),
    why: (L, kind) => L.awayBuyWhy(kind),
    run(L, kind) {
      const s = L.s, A = s.away, D = OWN[kind], price = L.awayOwnPrice(kind), at = L.awayOwnAt(kind);
      A.own = { kind, at, paid: price, idx: s.idx, fx: 1, t: s.t, cond: 100, let: false, n: 0, seen: s.t, cd: s.t + 4 };
      A.n.owned++;
      L.joy(6);
      L.note(`Bought a ${D.name} ${kind === 'villa' ? 'in' : 'at'} ${at}, for ${money(price)}.`, 'big');
      return kind === 'static'
        ? `A caravan of your own at ${at}, with a veranda, a gas fire and a smell of the sea that will never quite leave the cushions. The warden gives you two keys and a list of rules about bins.`
        : kind === 'cottage'
          ? `A cottage at ${at}, with a stable door, a wood stove, a garden full of thrift and a view of the harbour if you stand on the bed. The keys are on a piece of string.`
          : `A villa in ${at}: white walls, blue shutters, a pool, and a fig tree that drops figs on everything. A man called Tomás comes with it, to look after the pool, and does.`;
    },
  });
  def('awaySell', {
    time: 0, why: (L) => (W(L).own ? null : 'You have nowhere away to sell.'),
    run(L) {
      const A = W(L), o = A.own, D = OWN[o.kind], n = round100(L.awayOwnWorth() * D.keep);
      A.own = null;
      L.cash(n); L.joy(-2);
      L.note(`Sold the ${D.name} at ${o.at}, for ${money(n)}.`);
      return `${L.pick(['You take the last things out of the drawers: a shell, a timetable, a paperback with sand in the spine.', 'The new owners seem nice. You tell them which drawer sticks.', 'You lock up for the last time and post the key back through the door.'])} After the agent and the fees, it comes to ${money(n)}.`;
    },
  });
  def('awayLet', {
    time: 0, why: (L) => (W(L).own ? null : 'You have nowhere away to let.'),
    run(L) {
      const o = W(L).own;
      o.let = !o.let;
      return o.let ? `An agent in ${o.at} will let it to holidaymakers and take a fifth for the trouble. It should bring in about ${money(Math.round(OWN[o.kind].let * Math.sqrt(L.s.idx) / 100) * 100)} a year, most of it in the summer, and wear it out a little faster.` : 'You take it back off the agent’s books. It is yours again, all year round.';
    },
  });
  def('awayMend', {
    time: 0, cost: (L) => L.awayOwnMend(),
    why: (L) => (!W(L).own ? 'You have nowhere away.' : W(L).own.cond >= 95 ? 'It is in good repair.' : null),
    run(L) {
      const o = W(L).own;
      o.cond = 100;
      return L.pick([`A firm in ${o.at} goes through it from top to bottom: gutters, damp, a door that sticks, and a smell nobody can trace until they find the kipper.`, 'New paint, new washers, a new fridge, and the bill. It looks lovely in the photographs the agent sends.', 'Somebody local sees to it all, and sends a bill with a photograph of every job. It is very thorough, and so is the bill.']);
    },
  });

  // ---- what it does, season by season ----

  hooks.load.push((L) => {
    const s = L.s;
    if (!s.away || typeof s.away !== 'object') s.away = blank(s);
    const A = s.away, b = blank(s);
    for (const [k, v] of Object.entries(b)) if (A[k] == null) A[k] = v;
    for (const [k, v] of Object.entries(b.n)) if (A.n[k] == null) A.n[k] = v;
    for (const [k, v] of Object.entries(b.trad)) if (A.trad[k] == null) A.trad[k] = v;
    if (!s.trips) s.trips = {};
  });

  hooks.season.push((L) => {
    const s = L.s, o = s.away.own;
    // A place away wears, faster when it is let, and faster still when nobody goes.
    if (o) o.cond = clamp(o.cond - (o.let ? 2.5 : 1) - (s.t - (o.seen ?? o.t) >= 6 ? 1 : 0), 0, 100);
  });

  hooks.late.push((L, jailed) => {
    const s = L.s, A = s.away, kids = L.kids().filter((p) => p.age < 18);
    // (A trip whose next card has gone missing is over.)
    if (A.on && !s.pend.some((q) => q.x && q.x.n === A.on.n)) home(L, A.on);
    if (jailed || s.gaol || s.dead) {
      if (A.book && A.book.t <= s.t) { L.note(`Missed ${L.awayKind(A.book.k) ? L.awayKind(A.book.k).trip(A.book.at) : 'a holiday'}: Starling Gaol does not do holidays.`); A.book = null; }
      return;
    }
    let n = 0;
    const q = (id, x = null) => { if (n < 2 && !s.pend.some((p) => p.id === id)) { L.queue(id, x); n++; } };
    // The day comes.
    if (A.book && A.book.t <= s.t) q('awDepart', { b: A.book.id });
    // The family caravan, every summer; until the children grow out of it.
    const T = A.trad, y = yearOf(s.t);
    if (T.on && !kids.length) { T.on = false; T.done = true; L.note(`The last of the caravan summers at ${A.park}: the children are grown.`); }
    if (L.season === 1 && T.on && !A.book && A.last !== s.t) q('awTradCall');
    if (L.season === 2 && T.on && T.last < y) { T.on = false; T.n = 0; L.note(`The caravan summers at ${A.park} lapsed, the year nobody went.`); }
    // ... and the grandchildren, brought back to the same sands.
    if (L.season === 1 && T.best >= 2 && s.t - T.back >= 8) {
      const c = L.kids().filter((k) => k.age >= 18 && L.grandkids().some((g) => g.of === k.id && g.age >= 3 && g.age <= 12)).sort((a, b) => b.bond - a.bond)[0];
      if (c && L.chance(0.6)) { T.back = s.t; q('awTradBack', { c: c.id }); }
    }
    // A summer at your own place.
    if (L.season === 1 && A.own && !A.own.let && A.last !== s.t && !A.book) q('awOwnSummer');
    // Somebody from a holiday, and what they bring home with them.
    if (A.rom && s.t >= A.rom.due) { if (A.rom.follow && !L.partner()) q('awRomanceHome'); else A.rom = null; }
    if (A.secret && s.t >= A.secret.due) {
      const pt = L.partner();
      if (A.secret.out && pt && pt.id === A.secret.p) q('awFound', { p: pt.id }); else A.secret = null;
    }
    // The brochures that come after retiring.
    if (A.broch != null && A.broch >= 0 && s.t >= A.broch) { A.broch = -1; if (L.netWorth() >= 30000 && s.age < 86) q('awBrochure'); }
    // A place away wants looking after.
    const o = A.own;
    if (o && s.t >= (o.cd || 0) && L.chance(0.1 + (o.cond < 50 ? 0.12 : 0))) {
      const can = ['awOwnStorm', 'awOwnLeak', ...(o.kind !== 'static' && !o.let && s.t - (o.seen ?? o.t) >= 3 ? ['awOwnSquat'] : []), ...(o.let ? ['awOwnGuests'] : [])].filter((id) => id !== 'awOwnStorm' || o.kind !== 'villa' || L.season === 3);
      o.cd = s.t + 4;
      q(L.pick(can));
    }
  });

  hooks.year.push((L) => {
    const o = L.s.away.own;
    // (The money over there goes up and down.)
    if (o && o.kind === 'villa') o.fx = clamp(o.fx * Math.exp(0.05 * L.gauss()), 0.7, 1.4);
  });

  hooks.mood.push((L) => {
    const s = L.s, A = s.away;
    let b = 0;
    if (A.glow && s.t - A.glow.t < A.glow.d) b += 2;
    if (A.book) b += 2;
    if (A.own && s.t - (A.own.seen ?? A.own.t) < 4) b += 1;
    return Math.min(4, b);
  });

  hooks.bills.push((L, out) => { const A = L.s.away; if (A.own) out.push([`Your ${OWN[A.own.kind].name} at ${A.own.at}: upkeep`, L.awayOwnUpkeep()]); });
  hooks.income.push((L, out) => { const A = L.s.away, n = L.awayOwnLet(); if (n > 0) out.push([`Letting your ${OWN[A.own.kind].name} at ${A.own.at}`, n]); });
  hooks.worth.push((L) => L.awayOwnWorth());

  // A wedding (whoever's rules it was under) wants a honeymoon; retiring brings the cruise brochures.
  hooks.noted.push((L, e) => {
    const s = L.s, A = s.away;
    if (!A) return;
    if (/^Married /.test(e.t)) {
      const pt = L.partner();
      if (pt && pt.kind === 'spouse' && !s.gaol && !s.pend.some((q) => q.id === 'awMoon')) { A.moon = { p: pt.id, t: s.t }; s.pend.unshift({ id: 'awMoon', x: { p: pt.id } }); }
    }
    if (/^Retired /.test(e.t) && A.broch == null) A.broch = s.t + 1;
  });

  // The Gazette remembers the summers, or the one great journey, or the place away.
  hooks.epitaph.push((L, out) => {
    const s = L.s, A = s.away;
    if (!A) return;
    const m = s.sex !== 'f', He2 = m ? 'He' : 'She', he2 = m ? 'he' : 'she', his2 = m ? 'his' : 'her';
    const far = A.hols.filter((h) => h.k === 'far').pop();
    if (A.trad.best >= 3) out.push(`For ${A.trad.best} summers running ${he2} took the family to ${A.park}, where the caravan’s wardrobe door still has the children’s heights pencilled on it.`);
    else if (far) out.push(`${He2} went to ${far.at.split(',')[0]} at ${far.age}, and talked about it for the rest of ${his2} life.`);
    else if (A.own) out.push(`${He2} kept ${A.own.kind === 'cottage' ? 'a cottage' : A.own.kind === 'villa' ? 'a villa' : 'a static caravan'} ${A.own.kind === 'villa' ? 'in' : 'at'} ${A.own.at}, and went there whenever the Bay got too much.`);
    else if (A.n.trips >= 12) out.push(`${He2} went away ${A.n.trips} times, and always came back.`);
  });

  // ---- trophies ----

  Object.assign(TROPHIES, {
    awayFar: { name: 'The trip of a lifetime', icon: '🌏', desc: 'Go to the other side of the world.', test: (L) => !!L.s.away && L.s.away.n.far >= 1 },
    awayTradition: { name: 'Same time next year', icon: '🚐', desc: 'Take the children to the same caravan five summers running.', test: (L) => !!L.s.away && L.s.away.trad.best >= 5 },
    awayPlace: { name: 'A place to get away to', icon: '🏡', desc: 'Own a place of your own away from the Bay.', test: (L) => !!L.s.away && L.s.away.n.owned >= 1 },
    awayFridge: { name: 'Wish you were here', icon: '✉️', desc: 'Fill the fridge door with eight postcards.', test: (L) => !!L.s.away && L.s.away.fridge.length >= 8 },
    awayPack: { name: 'A place for everything', icon: '🧳', desc: 'Pack a case perfectly before the taxi comes.', test: (L) => !!L.s.away && L.s.away.n.pack >= 0.95 },
    awayMoon: { name: 'Just married', icon: '💐', desc: 'Go away on honeymoon.', test: (L) => !!L.s.away && L.s.away.n.moon >= 1 },
  });
}
