// Windle Farm and Market Square: farm work and the Farming it builds, animals
// of your own (room, feed, care, what they give, what neglect costs), making
// things at home, the Saturday stall (prices, the crowd, its good name), the
// Windle Show, the cards, and that none of it can be wrung for money,
// mood or skill for nothing.
import { GOODS, GOOD_IDS, BEASTS, ROOM, PADDOCK, PADDOCK_SKILL, CLASSES, STALL_NAMES, PITCH_COST, WORK, SHOPPERS, stallCustomer, askMark } from '../../games/new-in-town/js/market.js';
import { HOMES, TROPHIES } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';

const MINE = ['mktFox', 'mktSwarm', 'mktRival', 'mktInspect', 'mktChef', 'mktGoat', 'mktBroody', 'mktPath', 'mktTruffle', 'mktCoach', 'mktMind', 'mktPoorly'];

// A seeded stand-in for Math.random, for the queue game's logic.
const seeded = (seed) => () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };

export default function ({ check, fresh, Life }) {
  // A life set up for the farm: a home with a garden, money, and Farming to spare.
  const farmer = (o = {}) => {
    const L = fresh({ seed: o.seed || 21 });
    const s = L.s;
    s.home = o.home || 'cottage'; s.cash = o.cash ?? 50000; s.mkt.farm = o.farm ?? 60; s.wx = 'fair'; s.time = 20;
    return L;
  };
  const turn = (L) => { L.endSeason(); L.s.pend = []; L.s.wx = 'fair'; L.s.time = 20; };
  const stall = (L) => { L.act('mktJoin', 0); return L.s.mkt.stall; };

  // ---- the lists hang together ----
  {
    for (const [g, k] of Object.entries(GOODS)) check(k.rate.length === 4 && k.dem.length === 4 && k.one && k.many && k.icon && (k.price > 0 || g === 'art') && k.want > 0, `${g}: a proper thing to sell`);
    for (const [kind, b] of Object.entries(BEASTS)) {
      check(b.lay.length === 4 && (!b.makes || GOODS[b.makes]) && b.price > 0 && b.feed > 0 && b.skill > 0 && b.buy >= 1, `${kind}: a proper animal`);
      check(Object.values(ROOM).some((r) => r[kind]), `${kind}: some home has room for it`);
    }
    for (const id of Object.keys(ROOM)) check(HOMES[id], `${id}: room in a real home`);
    check(!ROOM.hostel && !ROOM.bedsit, 'no hens in a hostel bunk or a bedsit');
    for (const [c, k] of Object.entries(CLASSES)) check((k.beast && BEASTS[k.beast]) || (k.good && GOODS[k.good] && k.use >= 1), `${c}: a show class for a real animal or thing`);
    check(WORK.length === 4 && WORK.every((w) => w.title && w.said.length >= 3), 'farm work for every season of the year');
    for (const id of ['mktHens', 'mktArk', 'mktTrader', 'mktName', 'mktRosette', 'mktChamp']) check(TROPHIES[id], `trophy ${id} is there`);
    for (const id of MINE) check(EVENTS.some((e) => e.id === id), `card ${id} is in the deck`);
    check(Object.keys(PADDOCK).every((k) => BEASTS[k]), 'Tom’s paddock takes real animals');
  }

  // ---- a new life, and an old one ----
  {
    const L = fresh();
    check(L.s.mkt && L.s.mkt.farm === 0 && !L.s.mkt.stall && !Object.keys(L.s.mkt.herd).length, 'a new life starts with no Farming, no animals and no stall');
    const old = JSON.parse(JSON.stringify(L.s));
    delete old.mkt;
    const O = new Life(old);
    check(O.s.mkt && O.s.mkt.farm === 0 && O.s.mkt.n.days === 0, 'a life saved before the market existed opens with one');
    check(O.act('windleWork').ok && O.s.mkt.farm > 0, 'and can go straight up to the farm');
    let ok = true;
    try { for (let i = 0; i < 4; i++) { O.endSeason(); O.s.pend = []; } } catch (e) { ok = false; console.log(e); }
    check(ok, 'and plays on');
    const half = JSON.parse(JSON.stringify(L.s));
    delete half.mkt.n; delete half.mkt.ready; delete half.mkt.show;
    const H = new Life(half);
    check(H.s.mkt.n.take === 0 && H.s.mkt.ready && H.s.mkt.show.c, 'a half-filled save is filled in');
  }

  // ---- work on Windle Farm ----
  {
    const L = fresh(), s = L.s;
    check(new Set([0, 1, 2, 3].map((q) => { s.t = q; return L.look('windleWork').title; })).size === 4, 'the farm work changes with the season');
    s.t = 0; s.time = 6; s.wx = 'fair';
    const cash = s.cash, r = L.act('windleWork');
    check(r.ok && s.time === 4 && s.cash > cash && s.mkt.farm > 0 && s.mkt.days === 1, 'a day on the farm takes two blocks, pays, and teaches Farming');
    check(!L.act('windleWork', 2).ok && !L.act('windleWork', 'x').ok, 'a score out of range is refused');
    L.act('windleWork');
    s.time = 6;
    check(!L.act('windleWork').ok, 'two days on the farm a season');
    check(L.mktWorkPay(1) > L.mktWorkPay(0.5) && L.mktWorkPay(0.5) > L.mktWorkPay(0), 'a well-stacked trailer pays more');
    s.mkt.farm = 0; const lo = L.mktWorkPay(0.5); s.mkt.farm = 100;
    check(L.mktWorkPay(0.5) > lo && L.mktWorkPay(1) < 1500, 'Farming makes the work pay better, though never like a career');
    s.mkt.farm = 95; s.use = {}; s.time = 6;
    const f = s.mkt.farm; L.act('windleWork', 1);
    check(s.mkt.farm - f < 0.6, 'Farming grows slowly near the top');
    s.use = {}; s.time = 6; s.t = 1; s.wx = 'wet';
    const c1 = s.cash; L.act('windleWork', 0.5); const wet = s.cash - c1;
    s.use = {}; s.time = 6; s.wx = 'fair';
    const c2 = s.cash; L.act('windleWork', 0.5); const dry = s.cash - c2;
    check(wet < dry, 'rain on the hay pays less');
    s.mkt.told = false; s.time = 6;
    const t = L.act('windleTom');
    check(t.ok && s.mkt.told && t.text.includes('Mark me'), 'Tom says what the market will want next season');
    check(!L.act('windleTom').ok, 'and he says it once a season');
  }

  // ---- animals: room, money, care ----
  {
    const L = farmer({ home: 'hostel', farm: 0 }), s = L.s;
    check(L.can('beastBuy', 'hens').includes('Farming'), 'Tom sells to nobody who has not learned');
    s.mkt.farm = 100;
    check(!!L.can('beastBuy', 'hens') && !!L.can('beastBuy', 'bees'), 'no animals at all in a hostel bunk');
    s.home = 'flat';
    check(!!L.can('beastBuy', 'hens') && !L.can('beastBuy', 'bees'), 'a flat has room for a hive on the roof, not for hens');
    L.act('beastBuy', 'bees');
    check(L.s.mkt.herd.bees.n === 1 && !!L.can('beastBuy', 'bees'), 'one hive, and no room for another');
    const C = farmer(), c = C.s;
    const cash = c.cash, time = c.time;
    check(C.act('beastBuy', 'hens').ok && c.mkt.herd.hens.n === 3 && c.cash === cash - 3 * BEASTS.hens.price && c.time === time - 1, 'three hens, paid for, take a block of time to settle');
    C.act('beastBuy', 'hens');
    check(c.mkt.herd.hens.n === ROOM.cottage.hens && C.can('beastBuy', 'hens') === 'No room for any more.', 'a cottage garden takes six hens and no more');
    check(C.bills().some(([w, n]) => w.includes('animals') && n === 6 * BEASTS.hens.feed), 'they eat, every season');
    check(C.netWorth() >= 0 && C.mktBack('hens') < BEASTS.hens.price, 'Tom gives less for a hen than he takes');
    // What they give, and collecting it.
    c.t = 0;
    turn(C);
    const ready = c.mkt.ready.eggs;
    check(ready && ready.n >= 30 && ready.q > 0 && ready.q <= 1, 'six hens kept well lay a good few boxes of eggs over a spring');
    check(C.act('beastCollect').ok && c.mkt.stock.eggs.n === ready.n && !C.mktHasReady(), 'collecting brings the eggs in');
    turn(C);
    check(!c.mkt.stock.eggs, 'eggs not sold by the end of the season are gone');
    check(c.mkt.ready.eggs && c.mkt.herd.hens.care < 70, 'the hens lay again, and need seeing to');
    turn(C);
    check(c.log.some((e) => e.t.includes('Nobody collected')), 'and what is not collected spoils');
    // Care.
    const h = c.mkt.herd.hens;
    h.care = 30;
    C.act('beastCare');
    check(h.care === 75 && C.act('beastCare').ok && h.care === 100 && !C.act('beastCare').ok, 'seeing to them twice a season puts them right, and no more');
    h.care = 10; const n = h.n;
    check(C.moodBase() < (h.care = 60, C.moodBase()), 'neglected animals weigh on you');
    h.care = 10;
    turn(C);
    check((c.mkt.herd.hens ? c.mkt.herd.hens.n : 0) < n && c.log.some((e) => e.t.includes('Nobody had been to see to them')), 'left alone, some die');
    // Moving to a home with no room.
    c.mkt.herd.hens = { n: 6, care: 80, where: 'home', age: 0, fat: 0, since: c.t };
    c.cash = 100000;
    C.act('rentHome', 'bedsit');
    check(c.home === 'bedsit' && !c.mkt.herd.hens && c.log.some((e) => e.t.includes('No room for them')), 'move somewhere with no garden and the hens go back to Tom');
  }
  // ---- goats and pigs, and Tom's paddock ----
  {
    const L = farmer({ home: 'cottage', farm: PADDOCK_SKILL - 1 }), s = L.s;
    check(!!L.can('beastBuy', 'goat'), 'no goat in a cottage garden, and no paddock until Tom trusts you');
    s.mkt.farm = PADDOCK_SKILL;
    check(!L.can('beastBuy', 'goat') && L.mktWhere('goat') === 'farm', 'then the goat can live in Tom’s top paddock');
    L.act('beastBuy', 'goat');
    check(s.mkt.herd.goat.where === 'farm' && L.bills().some(([w]) => w.includes('Grazing')), 'for a grazing fee');
    s.mkt.herd.goat.care = 0;
    turn(L);
    check(s.mkt.herd.goat && s.mkt.herd.goat.care >= 40, 'Tom will not let an animal in his paddock go to ruin');
    check(!!L.can('beastFetch', 'goat'), 'no bringing it home without room');
    s.home = 'villa';
    check(!L.can('beastFetch', 'goat') && L.act('beastFetch', 'goat').ok && s.mkt.herd.goat.where === 'home', 'a villa has room for a goat');
    // A pig: worth what is put into it.
    const P = farmer({ home: 'manor', farm: 60 }), p = P.s;
    P.act('beastBuy', 'pig');
    const back0 = P.mktBack('pig');
    check(back0 < BEASTS.pig.price, 'a weaner sold straight back loses money');
    let fed = 0;
    for (let i = 0; i < 4; i++) { P.act('beastCare'); fed += P.mktFeed(); turn(P); }
    const back4 = P.mktBack('pig'), gain = back4 - BEASTS.pig.price - fed;
    check(back4 > BEASTS.pig.price * 3 && gain > -100 && gain < 900, `a pig kept well for a year is worth keeping, but not a fortune (${gain})`);
    // The pig digs the allotment over.
    P.s.plot = { beds: [{ c: 'spuds', age: 0, care: 0 }, null, null], since: P.s.t };
    turn(P);
    check(P.s.plot.beds[0] && P.s.plot.beds[0].care >= 1, 'a pig digs the allotment over');
    const worth = P.mktBack('pig'), end = P.endSeason();
    p.pend = []; p.wx = 'fair'; p.time = 20;
    check(!p.mkt.herd.pig && end.lines.some(([w, n]) => w.includes('pig') && n >= worth) && p.log.some((e) => e.t.includes('took your pig to market')), 'a grown pig goes to market, and does not eat its head off for ever');
    // Prison: Tom keeps an eye.
    P.act('beastBuy', 'pig');
    p.mkt.herd.pig.care = 50;
    p.gaol = { left: 2, total: 2, served: 0, good: 50, rep: 30 };
    let ok = true;
    try { P.endSeason(); p.pend = []; } catch (e) { ok = false; console.log(e); }
    check(ok && p.mkt.herd.pig && p.mkt.herd.pig.care >= 30, 'inside, your animals are looked after by Tom');
    p.gaol = null;
  }

  // ---- making things ----
  {
    const L = farmer({ home: 'hostel' }), s = L.s;
    check(L.can('mktJam') === 'The hostel kitchen is a kettle.', 'no jam in a hostel kitchen');
    s.home = 'bedsit'; s.t = 0;
    const cash = s.cash;
    check(L.act('mktJam').ok && s.cash === cash - 90 && s.mkt.stock.jam.n >= 12, 'a batch of jam from bought fruit');
    s.t = 2;
    const c2 = s.cash;
    L.act('mktJam');
    check(s.cash === c2 - 30, 'and cheaper in autumn, with blackberries from the hedges');
    check(!L.act('mktJam').ok, 'two batches a season');
    const q = s.mkt.stock.jam.q;
    check(q > 0 && q <= 1, 'jam has a quality');
    s.mkt.stock.eggs = { n: 4, q: 0.8 };
    const c3 = s.cash;
    L.act('mktBake');
    check(s.cash === c3 - 45 && s.mkt.stock.eggs.n === 2 && s.mkt.stock.cake.n >= 10, 'baking uses your own eggs, and costs less for it');
    turn(L);
    check(s.mkt.stock.jam && !s.mkt.stock.cake, 'jam keeps; cakes do not');
    check(!!L.can('mktCheese'), 'no cheese without milk');
    s.mkt.stock.milk = { n: 22, q: 0.7 };
    check(L.act('mktCheese').ok && s.mkt.stock.cheese.n === 4 && s.mkt.stock.milk.n === 2, 'five pints make a cheese');
    const b = L.act('mktClear');
    check(b.ok && s.mkt.stock.bric.n >= 3 && !L.act('mktClear').ok, 'a clear-out, once a year');
    s.t += 4; s.time = 6;
    check(L.act('mktClear').ok, 'and again the next year');
  }

  // ---- the stall ----
  {
    const L = farmer({ home: 'cottage' }), s = L.s;
    check(!L.placeActions('market').some((a) => a.id === 'mktTrade'), 'no Saturdays without a pitch');
    check(!!L.can('mktJoin') && !!L.can('mktJoin', 99), 'a pitch needs a name');
    const cash = s.cash;
    check(L.act('mktJoin', 0).ok && s.cash === cash - PITCH_COST && s.mkt.stall.name === 'Test’s Pantry', 'a pitch, with your name over it');
    check(!L.act('mktJoin', 1).ok, 'one pitch is plenty');
    check(L.can('mktTrade').includes('Nothing'), 'nothing to sell, no Saturday');
    s.mkt.stock.jam = { n: 60, q: 0.6 }; s.t = 3;
    const fee = L.mktFee(), c1 = s.cash, r = L.act('mktTrade', 0.5);
    check(r.ok && s.time === 18 && s.mkt.stock.jam.n < 60 && s.cash - c1 === s.mkt.n.take - fee && s.mkt.n.days === 1, 'a Saturday sells jam, less Priya’s fee');
    const c2 = s.cash, before = s.mkt.n.take;
    L.act('mktTrade', 0.5);
    check(s.cash - c2 === s.mkt.n.take - before, 'and the fee is paid once a season');
    check(!L.act('mktTrade', 0.5).ok, 'two Saturdays a season');
    // Prices: cheap sells more, dear makes more on each, and only good things sell dear.
    check(L.mktWant('jam', 0) > L.mktWant('jam', 1) && L.mktWant('jam', 1) > L.mktWant('jam', 2), 'cheaper sells more');
    check(L.mktEach('jam', 2) > L.mktEach('jam', 1) && L.mktEach('jam', 1) > L.mktEach('jam', 0), 'dearer makes more on each one');
    s.mkt.stock.jam = { n: 60, q: 0.2 }; const poor = L.mktWant('jam', 2);
    s.mkt.stock.jam = { n: 60, q: 0.9 };
    check(L.mktWant('jam', 2) > poor * 1.3, 'good jam sells dear; poor jam does not');
    check(L.mktGuess('jam', 0).sum > L.mktGuess('jam', 2).sum, 'with plenty to sell, cheap brings in more');
    s.mkt.stock.jam = { n: 3, q: 0.9 };
    check(L.mktGuess('jam', 2).sum > L.mktGuess('jam', 0).sum, 'with only a few, dear brings in more');
    // The crowd: the weather, the times, the stall's name, what is in fashion.
    const foot = L.mktFoot();
    s.wx = 'storm'; check(L.mktFoot() < foot, 'a gale keeps people away'); s.wx = 'fair';
    s.eco = 2; const boom = L.mktFoot(); s.eco = -2; check(boom > L.mktFoot(), 'a boom brings more than a slump'); s.eco = 0;
    const rep = s.mkt.stall.rep; s.mkt.stall.rep = 90; check(L.mktFoot() > foot, 'a stall with a good name draws a crowd'); s.mkt.stall.rep = rep;
    s.mkt.hot = 'jam'; const hot = L.mktWant('jam', 1); s.mkt.hot = 'eggs'; check(hot > L.mktWant('jam', 1), 'what everybody wants this season sells more');
    check(L.mktRate('eggs') !== (s.t = 0, L.mktRate('eggs')), 'prices move with the season');
    // Serving the queue well brings in more: the same Saturday, played well and badly.
    s.mkt.stock.jam = { n: 60, q: 0.6 }; s.use = {}; s.time = 20;
    const twin = new Life(JSON.parse(JSON.stringify(s)));
    const a = s.cash; L.act('mktTrade', 1); const good = s.cash - a;
    const b = twin.s.cash; twin.act('mktTrade', 0); const bad = twin.s.cash - b;
    check(good > bad && s.mkt.stall.rep > twin.s.mkt.stall.rep, 'serving the queue well brings in more, and does the stall’s name more good');
    // Its name wears down if it does not open.
    const r0 = s.mkt.stall.rep; s.mkt.stall.at = -5; turn(L);
    check(s.mkt.stall.rep < r0, 'a season without trading wears its name down');
    // Keeping things back, and paintings.
    L.act('mktOut', 'jam');
    check(!L.mktIsOut('jam') && !L.mktOnStall().includes('jam'), 'things can be kept back');
    L.act('mktOut', 'jam');
    s.paintings = 3; s.st.craft = 90;
    check(!L.mktIsOut('art'), 'paintings stay at home unless you say');
    L.act('mktOut', 'art');
    check(L.mktIsOut('art') && L.mktEach('art', 2) < L.artPrice() * 0.4, 'and a Saturday crowd will not pay gallery prices');
    // Shut by the inspector.
    s.mkt.shut = s.t; s.use = {};
    check(L.can('mktTrade', 0.5).includes('inspector'), 'shut by the inspector, no trading');
    s.mkt.shut = -1;
    // The allotment's harvest goes to the stall once you hold a pitch (the default: the old
    // default, the honesty box, sent it past most players), and can be sent back to the gate.
    s.plot = { beds: [{ c: 'toms', age: 1, care: 2 }, null, null], since: 0 };
    check(s.mkt.veg, 'once you hold a pitch, the allotment’s harvest comes to it');
    const c5 = s.cash, earned = s.n.earned, r5 = L.act('reap');
    check(r5.ok && s.cash === c5 && s.n.earned === earned && s.mkt.stock.veg && s.mkt.stock.veg.n >= 1 && r5.text.includes('your stall'), 'the allotment’s harvest goes to the stall instead of the honesty box');
    L.act('mktVeg');
    check(!s.mkt.veg && s.mkt.vegSet, 'or, if you say so, by the gate');
    s.plot.beds[0] = { c: 'toms', age: 1, care: 2 };
    const c6 = s.cash; L.act('reap');
    check(s.cash > c6, 'and it is paid for there, as before');
    // Veg the stall did not sell goes to the honesty box at the turn of the season, not to the rats.
    const V = farmer({ home: 'cottage' });
    V.act('mktJoin', 0);
    V.s.mkt.stock.veg = { n: 12, q: 0.6 };
    const cv = V.s.cash, rv = V.endSeason();
    check(!V.s.mkt.stock.veg && rv.lines.some(([w, n]) => /honesty box/.test(w) && n > 12 * 30) && V.s.log.some((e) => /honesty box/.test(e.t)), 'veg the stall did not sell goes on the table by the allotment gate, for less');
    void cv;
    // With no money for Priya's fee, a stall with something to sell still opens: she takes it out of the tin.
    const F = farmer({ home: 'cottage' });
    F.act('mktJoin', 0);
    F.s.mkt.stock.jam = { n: 30, q: 0.6 };
    F.s.cash = 0; F.s.bank = 0; F.s.t = 3; F.s.time = 6;
    const fr = F.act('mktTrade', 0.6);
    check(fr.ok && F.s.cash === F.s.mkt.n.take - F.mktFee() && /out of the tin/.test(fr.text), 'no money for the pitch fee: Priya takes it out of the tin');
    // An old save with a pitch, from before the harvest came to the stall by itself.
    const O = farmer({ home: 'cottage' }); O.act('mktJoin', 0); O.s.mkt.veg = false; delete O.s.mkt.vegSet;
    const R = new Life(JSON.parse(JSON.stringify(O.s)));
    check(R.s.mkt.veg, 'an old save with a pitch sends the harvest to it, unless it had said otherwise');
    // Rename, and give it up.
    const r7 = s.mkt.stall.rep;
    check(L.act('mktRename', 1).ok && s.mkt.stall.name === 'The Good Egg' && s.mkt.stall.rep < r7, 'a new sign costs a little of its name');
    check(L.act('mktQuit').ok && !s.mkt.stall && !L.act('mktTrade', 0.5).ok, 'the pitch can be given up');
  }

  // ---- Priya, prices, and plants from the square ----
  {
    const L = farmer({ home: 'cottage' }), s = L.s;
    stall(L);
    check(!!L.can('mktPrice', { g: 'jam', lvl: 1 }) && !!L.can('mktPrice', { g: 'gold', lvl: 0 }) && !!L.can('mktPrice', { g: 'jam', lvl: 5 }), 'a price must be a new one, for a real thing');
    check(L.act('mktPrice', { g: 'jam', lvl: 2 }).ok && L.mktLevel('jam') === 2, 'jam priced dear');
    const rep = s.mkt.stall.rep, charm = s.st.charm, r = L.act('mktPriya');
    check(r.ok && s.mkt.stall.rep > rep && s.st.charm > charm && r.text.includes('Everybody’s after'), 'a word with Priya: a little Charm, a little goodwill, and what is selling');
    check(!L.act('mktPriya').ok, 'once a season');
    check(!L.placeActions('market').some((a) => a.id === 'mktPlants'), 'no plants for an allotment you do not have');
    s.plot = { beds: [{ c: 'garlic', age: 0, care: 0 }, null, null], since: 0 };
    s.t = 1; // (summer: tomatoes are sown in spring, but these are already on their way)
    const cash = s.cash;
    check(L.act('mktPlants').ok && s.plot.beds[1] && s.plot.beds[1].c === 'toms' && s.plot.beds[1].care === 2 && s.cash === cash - 110, 'tomato plants with a head start, even in summer');
    check(!L.act('mktPlants').ok, 'one tray a season');
    s.use = {}; s.plot.beds[2] = { c: 'beans', age: 0, care: 0 };
    check(L.can('mktPlants').includes('taken'), 'and only for an empty bed');
    // Pitch fee moves with the times.
    s.eco = 2; const boom = L.mktFee(); s.eco = -2;
    check(boom > L.mktFee() && L.mktFee() > 0, 'Priya charges more in good times');
  }

  // ---- the Windle Show ----
  {
    const L = farmer({ home: 'cottage', farm: 80 }), s = L.s;
    L.act('beastBuy', 'hens');
    s.mkt.herd.hens.care = 100;
    s.mkt.stock.jam = { n: 5, q: 0.95 };
    s.t = 0;
    check(L.can('showEnter', 'hens') === 'The show is in summer.', 'the show is in summer');
    s.t = 1;
    check(!!L.can('showEnter', 'goat') && !!L.can('showEnter', 'honey'), 'nothing to enter, no entry');
    const cash = s.cash, r = L.act('showEnter', 'jam');
    check(r.ok && s.mkt.stock.jam.n === 4 && s.mkt.show.c.jam >= 1, 'an entry, and the judges keep the jar');
    check(!L.act('showEnter', 'jam').ok, 'one entry a class each year');
    check(s.cash !== cash, 'the entry fee, and any prize');
    L.act('showEnter', 'hens');
    let firsts = 0, champs = 0;
    for (let y = 0; y < 30; y++) {
      const T = farmer({ home: 'villa', farm: 90, seed: 300 + y });
      for (const k of ['hens', 'goat']) T.act('beastBuy', k);
      for (const k of T.mktKinds()) T.s.mkt.herd[k].care = 100;
      T.s.mkt.stock = { jam: { n: 3, q: 0.9 }, honey: { n: 3, q: 0.9 }, eggs: { n: 3, q: 0.9 } };
      T.s.t = 1;
      for (const c of ['hens', 'goat', 'jam', 'honey', 'eggs']) T.act('showEnter', c);
      firsts += Object.values(T.s.mkt.show.c).filter((n) => n === 1).length;
      champs += T.s.mkt.champ;
    }
    check(firsts > 60 && champs > 5, `the best kept and best made usually win (${firsts} firsts of 150, ${champs} champions in 30)`);
    // A beginner's entries rarely do.
    let begin = 0;
    for (let y = 0; y < 30; y++) {
      const T = farmer({ home: 'cottage', farm: 15, seed: 600 + y });
      T.act('beastBuy', 'hens'); T.s.mkt.herd.hens.care = 40;
      T.s.mkt.stock = { jam: { n: 3, q: 0.3 } };
      T.s.t = 1;
      for (const c of ['hens', 'jam']) T.act('showEnter', c);
      begin += Object.values(T.s.mkt.show.c).filter((n) => n === 1).length;
    }
    check(begin < 12, `and a beginner’s seldom do (${begin} firsts of 60)`);
    // A champion is given less room each time.
    const was = L.mktShowBar('jam');
    s.mkt.firsts.jam = 3;
    check(L.mktShowBar('jam') > was, 'a class you keep winning gets harder');
  }

  // ---- nothing for nothing ----
  {
    const L = farmer({ home: 'cottage', farm: 60 }), s = L.s;
    // Rummaging never puts anything on your stall.
    let found = 0;
    for (let i = 0; i < 60; i++) { s.use = {}; s.time = 6; const n = Object.values(s.curios).reduce((a, x) => a + x, 0); L.act('mktRummage'); if (Object.values(s.curios).reduce((a, x) => a + x, 0) > n) found++; }
    check(!s.mkt.stock.bric && found > 2 && found < 25, `a sharp eye sometimes spots a curio at the bric-a-brac stall (${found} in 60), and nothing else comes home`);
    // Hens bought and sold straight back lose money.
    const c = s.cash;
    L.act('beastBuy', 'hens'); L.act('beastSell', 'hens');
    check(s.cash < c, 'animals bought and sold straight back lose money');
    L.act('mktTreat');
    check(!L.act('mktTreat').ok, 'one treat a season');
    // A dedicated year at the stall pays less than a middling career.
    const Y = farmer({ home: 'cottage', farm: 60, seed: 77 }), y = Y.s;
    Y.act('beastBuy', 'hens'); Y.act('beastBuy', 'hens'); Y.act('beastBuy', 'bees');
    Y.act('mktJoin', 1);
    y.st.craft = 60; y.st.charm = 60; y.mkt.stall.rep = 70;
    const start = y.cash;
    let spent = 0;
    for (let i = 0; i < 4; i++) {
      y.time = 8; y.use = {};
      Y.act('beastCare'); if (Y.mktHasReady()) Y.act('beastCollect');
      Y.act('mktJam'); Y.act('mktBake');
      Y.act('mktTrade', 0.9);
      spent += Y.bills().filter(([w]) => /animals/.test(w)).reduce((a, [, n]) => a + n, 0);
      y.cash += Y.bills().reduce((a, [, n]) => a + n, 0) - Y.bills().filter(([w]) => /animals/.test(w)).reduce((a, [, n]) => a + n, 0);
      turn(Y);
    }
    const net = y.cash - start;
    check(net > 0 && net < 4 * 3 * 3400, `a year at the stall pays its way, but less than a middling career (${net} for the year, ${spent} on feed)`);
  }

  // ---- the queue game's logic ----
  {
    const goods = [{ g: 'jam', q: 0.8 }, { g: 'eggs', q: 0.3 }];
    const a = [], rnd = seeded(5);
    for (let i = 0; i < 400; i++) a.push(stallCustomer(rnd, goods));
    check(a.every((c) => [0, 1, 2].includes(c.tier) && goods.some((x) => x.g === c.g) && c.line && c.badge && c.age >= 9 && c.look), 'every customer wants something on the stall and will pay one of three prices');
    check([0, 1, 2].every((t) => a.some((c) => c.tier === t)), 'some are careful, some ordinary, some generous');
    check(a.some((c) => SHOPPERS.find((k) => k.id === c.who).tier !== c.tier), 'and now and then one is not what they look like');
    check(!a.some((c) => c.who === 'chef' && c.g === 'eggs' && c.tier === 2), 'a chef will not pay dear for poor eggs');
    const twin = []; const r2 = seeded(5);
    for (let i = 0; i < 400; i++) twin.push(stallCustomer(r2, goods));
    check(JSON.stringify(a) === JSON.stringify(twin), 'the same dice, the same queue');
    check(askMark(1, 1) === 1 && askMark(2, 1) === 0 && askMark(0, 2) < askMark(1, 2) && askMark(1, 2) < 1, 'asking what they will pay is best; less leaves money behind; more and they walk');
    const mean = (f) => a.reduce((s, c) => s + askMark(f(c), c.tier), 0) / a.length;
    check(mean((c) => c.tier) === 1 && mean(() => 0) < 0.85 && mean(() => 2) < 0.5 && mean(() => 1) < 0.9, 'only reading the customers scores full marks');
  }

  // ---- the cards ----
  {
    for (const id of MINE) {
      const e = EVENTS.find((v) => v.id === id);
      e.opts.forEach((o, i) => {
        const L = farmer({ home: 'manor', farm: 80, seed: 900 + i }), s = L.s;
        for (const k of Object.keys(BEASTS)) L.act('beastBuy', k);
        L.act('beastBuy', 'hens');
        stall(L);
        s.mkt.stock = { jam: { n: 12, q: 0.9 }, honey: { n: 8, q: 0.9 }, cheese: { n: 5, q: 0.9 }, eggs: { n: 20, q: 0.8 }, cake: { n: 6, q: 0.7 } };
        s.mkt.stall.days = 5; s.mkt.days = 6; s.t = id === 'mktCoach' ? 1 : 0;
        if (id === 'mktPoorly') s.mkt.herd.goat.care = 20;
        check(!e.when || e.when(L), `card ${id} can come up for someone it is about`);
        const x = e.ctx ? e.ctx(L) : null;
        check(!e.ctx || x != null, `card ${id} finds what it is about`);
        L.queue(id, x);
        const ev = L.event();
        check(ev && ev.id === id && ev.opts.length === e.opts.length && typeof ev.text === 'string' && !/undefined|NaN/.test(ev.text), `card ${id} shows`);
        let r = null;
        try { r = L.choose(i); } catch (err) { console.log(err); }
        check(r && r.ok && typeof r.text === 'string' && !/undefined|NaN/.test(r.text) && r.text.length > 10, `card ${id}, choice ${i}: does something and says what`);
        check(Number.isFinite(s.cash) && s.cash >= 0 && Object.values(s.mkt.herd).every((h) => h.n >= 1), `card ${id}, choice ${i}: leaves the numbers sane`);
      });
    }
  }
}

// For the random players: the things done from the stall, animal and show
// sheets. (The ones that take no time are offered now and then, not every
// time, so that they do not crowd out everything else a random life might do.)
export function moves(L) {
  const s = L.s, m = s.mkt;
  if (L.rnd() < 0.6) return [];
  const out = [m.stall ? L.pick([['mktPrice', { g: L.pick(GOOD_IDS), lvl: Math.floor(L.rnd() * 3) }], ['mktOut', L.pick(GOOD_IDS)], ['mktVeg'], ['mktRename', Math.floor(L.rnd() * STALL_NAMES.length)], ['mktQuit']]) : ['mktJoin', Math.floor(L.rnd() * STALL_NAMES.length)]];
  const k = L.pick(Object.keys(BEASTS));
  out.push(['beastBuy', k], ['beastFetch', k]);
  if (m.herd[k] && L.rnd() < 0.1) out.push(['beastSell', k]);
  if (L.season === 1) out.push(['showEnter', L.pick(Object.keys(CLASSES))]);
  return out;
}
