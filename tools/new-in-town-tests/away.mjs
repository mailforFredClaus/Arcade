// Going away (away.js): this year's trips from the station, who comes and what it costs, the trip
// played as cards, home again with a memory; booking ahead; the boss and a second holiday; the
// honeymoon, the romance that follows you home and the one that should not, the family caravan,
// the cruise brochures; a place of your own away; the days out; and the two games.
import { KINDS, EIGHT, OWN, TRIP_CARDS } from '../../games/new-in-town/js/away.js';
import { packPuzzle, placeAt, packScore, beachRound, BEACH_ROUNDS } from '../../games/new-in-town/js/away-games.js';
import { GAMES } from '../../games/new-in-town/js/mini.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';
import { TROPHIES } from '../../games/new-in-town/js/data.js';

export default function ({ check, fresh, Life }) {
  const reset = (L) => { L.s.use = {}; L.s.time = L.timeMax(); L.s.pend = []; };
  const turn = (L) => { L.endSeason(); L.s.pend = []; L.s.use = {}; L.s.time = L.timeMax(); };
  const clean = (t) => typeof t === 'string' && t.length > 0 && !/undefined|NaN|\[object|null\b|\s\s/.test(t);
  // Answers every card waiting with the option chosen by pick (the first free one, unless told).
  const answer = (L, pick = (ev) => ev.opts.findIndex((o) => !o.why)) => { let ev, n = 0; const out = []; while ((ev = L.event()) && n++ < 30) { out.push(ev); const r = L.choose(pick(ev)); if (!r.ok) break; out.push(r); } return out; };
  // Deals these cards (then the last evening) to the trip under way, in place of what was dealt.
  const rig = (L, ids) => {
    const tr = L.s.away.on;
    tr.deck = [...ids, 'awLast']; tr.step = 0;
    for (const id of ids) tr.ctx[id] = TRIP_CARDS[id].ctx ? TRIP_CARDS[id].ctx(L, tr) : { v: 0 };
    L.s.pend = [{ id: ids[0], x: { n: tr.n } }];
  };
  const withKids = (L) => { const pt = L.meet({ kind: 'spouse', bond: 60, sex: 'f', single: false }); pt.live = true; const a = L.meet({ kind: 'child', age: 8, bond: 60 }), b = L.meet({ kind: 'child', age: 5, bond: 60 }); return { pt, a, b }; };
  const ops = (L, id) => { const ev = L.event(); return ev && ev.id === id ? ev.opts : null; };
  const opt = (L, start) => { const ev = L.event(); return ev ? ev.opts.findIndex((o) => o.t.startsWith(start)) : -1; };

  // ---- the lists hang together ----
  for (const [k, K] of Object.entries(KINDS)) {
    check(K.name && K.icon && K.time >= 2 && K.per > 0 && K.n >= 2 && K.n <= 4 && K.cls.length === K.clsX.length && K.months.length && K.blurb, `${k}: a trip with a price, a length and classes`);
    if (k !== 'caravan') check(K.where && K.where.length >= 4 && K.where.every((w) => clean(K.trip(w)) && clean(K.mem(w))), `${k}: somewhere different to go each year`);
  }
  check(EIGHT.length === 8 && EIGHT.every((k) => KINDS[k]) && KINDS.tent.per * 2 < KINDS.caravan.fixed && KINDS.cruise.per < KINDS.far.per, 'eight holidays, from a borrowed tent to the trip of a lifetime');
  for (const [k, D] of Object.entries(OWN)) check(D.price > 0 && D.upkeep > 0 && D.let > D.upkeep && D.keep < 1, `${k}: a place away with upkeep, lets and a price to sell at`);
  for (const id of ['awayFar', 'awayTradition', 'awayPlace', 'awayFridge', 'awayPack', 'awayMoon']) check(TROPHIES[id], `trophy ${id}`);
  for (const id of ['awDepart', 'awMoon', 'awRomanceHome', 'awFound', 'awBrochure', 'awTradCall', 'awTradBack', 'awOwnSummer', 'awOwnStorm', 'awOwnLeak', 'awOwnSquat', 'awOwnGuests', ...Object.keys(TRIP_CARDS)]) {
    const e = EVENTS.find((q) => q.id === id);
    check(e && !e.w && e.ok, `${id}: a card that only comes when it is sent for, and goes stale when it should`);
  }
  for (const [id, c] of Object.entries(TRIP_CARDS)) check(c.opts.some((o) => !o.cost && !o.check && !o.odds), `${id}: has a choice that costs nothing`);

  // ---- new lives and old ----
  {
    const L = fresh(), s = L.s;
    check(s.away && Array.isArray(s.away.hols) && !s.away.on && s.away.n.trips === 0, 'a new life has been nowhere');
    const old = JSON.parse(JSON.stringify(s));
    delete old.away;
    const O = new Life(old);
    check(O.s.away && O.s.away.trad && O.awayPark() && O.awayDest('sun') && O.placeActions('station').some((a) => a.open === 'awayTrips'), 'a life saved before going away was thought of opens with it');
    const rows = L.placeActions('station');
    check(rows.some((a) => a.open === 'awayTrips') && rows.some((a) => a.id === 'awayDay') && !rows.some((a) => a.id === 'trip'), 'the station has this year’s trips and a day out, not the old list of eight');
    s.cash = 5000; reset(L);
    check(L.act('trip', 'camping').ok, 'the old holidays still go if asked for by name');
    check(L.awayDest('sun', 0) !== L.awayDest('sun', 4) || L.awayDest('sun', 4) !== L.awayDest('sun', 8), 'somewhere different each year');
  }

  // ---- who comes, and what it costs ----
  {
    const L = fresh(), s = L.s;
    s.cash = 1e6; s.t = 4; // (spring)
    const solo = L.awayCost({ k: 'sun', w: 'solo', c: 0 });
    check(L.awayParty('pair', 'sun').why && L.awayParty('family', 'sun').why && L.awayParty('friends', 'sun').why, 'nobody to go with, at first');
    const { pt } = withKids(L);
    const pair = L.awayCost({ k: 'sun', w: 'pair', c: 0 }), fam = L.awayCost({ k: 'sun', w: 'family', c: 0 });
    check(solo === 1500 && pair === 2700 && fam === 3900 + 120, `the price goes by the head: ${solo}, ${pair}, and ${fam} for the family (children half, and $60 each out of school)`);
    check(L.awayCost({ k: 'sun', w: 'family', c: 0 }, 1) === Math.round((300 + 1200 * 3) * 1.25 / 10) * 10, 'summer is dearer, and nobody misses school');
    check(L.awayCost({ k: 'sun', w: 'pair', c: 2 }) === Math.round(pair * 3.5 / 10) * 10, 'the very best costs three and a half times as much');
    check(L.awaySaid([pt.id], 'pair') === `with ${pt.name.split(' ')[0]}` && /the children/.test(L.awaySaid(L.awayParty('family').ids, 'family')), 'who came, said');
    s.heir = 'globe';
    check(L.awayCost({ k: 'sun', w: 'solo', c: 0 }) === 750, 'the battered suitcase halves it');
    s.heir = null;
    check(L.awayHint(100) === 'Small change, for you' && L.awayHint(5e6) === 'More than you have', 'what a price is to you, in words');
  }

  // ---- why not ----
  {
    const L = fresh(), s = L.s;
    s.cash = 1e5;
    s.t = 3; reset(L);
    check(/winter/.test(L.can('trip', { k: 'tent', w: 'solo', c: 0 })) && /winter/.test(L.can('trip', { k: 'caravan', w: 'solo', c: 0 })), 'no tents or caravans in winter');
    s.t = 4; reset(L);
    check(!L.can('trip', { k: 'gap', w: 'solo', c: 0 }), 'a season with a rucksack, at eighteen');
    s.job = { c: 'kitchen', r: 0, perf: 50, raise: 0 };
    check(/job/.test(L.can('trip', { k: 'gap', w: 'solo', c: 0 })), 'not with a job to go to');
    s.job = null; s.age = 30;
    check(/young/.test(L.can('trip', { k: 'gap', w: 'solo', c: 0 })), 'nor at thirty');
    check(L.can('trip', { k: 'sun', w: 'solo', c: 7 }) && L.can('trip', { k: 'mars', w: 'solo' }) && L.can('trip'), 'no such trip');
    s.health = 20;
    check(/well enough/.test(L.can('trip', { k: 'city', w: 'solo', c: 0 })), 'not when you are ill');
    s.health = 90; s.time = 1;
    check(/time/.test(L.can('trip', { k: 'sun', w: 'solo', c: 0 })), 'a fortnight takes most of a season');
  }

  // ---- a trip, played ----
  {
    const L = fresh(), s = L.s;
    s.cash = 20000; s.t = 5; reset(L); s.happy = 40; s.health = 70;
    const { pt, a } = withKids(L);
    const b0 = pt.bond, k0 = a.bond, c0 = s.cash, t0 = s.time, x = { k: 'sun', w: 'family', c: 0 };
    const cost = L.awayCost(x), r = L.act('trip', x);
    check(r.ok && clean(r.text) && s.cash === c0 - cost && s.time === t0 - 4 && s.away.on && s.pend[0].x.n === s.away.on.n, 'off you go: the money, most of the season, and the first card waiting');
    check(L.can('trip', { k: 'city', w: 'solo', c: 0 }) && L.can('awayDay'), 'one trip at a time');
    const seen = answer(L);
    const cards = seen.filter((e) => e.opts), last = seen[seen.length - 1];
    check(cards.length === 3 && cards[cards.length - 1].id === 'awLast' && cards.every((e) => clean(e.text) && e.opts.every((o) => clean(o.t))), `three cards for a fortnight, the last evening last (${cards.map((e) => e.id).join(', ')})`);
    check(!s.away.on && s.away.hols.length === 1 && /It goes down as “/.test(last.text) && s.trips.sun === 1 && s.away.n.trips === 1, 'home again, with a memory, and counted');
    check(s.happy > 40 && s.health > 70 && pt.bond > b0 && a.bond > k0, 'rested, happier, and closer to those who came');
    check(s.log.some((e) => /^Away: a fortnight in/.test(e.t)) && s.comfy.trip === s.t, 'it goes in the journal, and counts as the year’s holiday for living well');
  }

  // ---- a bad trip, and a good one ----
  {
    const run = (good) => {
      const L = fresh({ seed: 11 }), s = L.s;
      s.cash = 20000; s.t = 5; reset(L);
      const { pt } = withKids(L);
      pt.bond = 60;
      L.act('trip', { k: 'caravan', w: 'family', c: 0 });
      rig(L, ['awRow', 'awStorm']);
      L.s.away.on.ctx.awRow.p = pt.id;
      L.chance = () => good;
      answer(L, (ev) => (ev.id === 'awRow' ? 0 : ev.id === 'awStorm' ? (good ? 0 : 1) : 2));
      return { L, b: pt.bond, h: s.away.hols[0] };
    };
    const g = run(true), bad = run(false);
    check(g.b > 66 && bad.b < 60 && g.h.q > bad.h.q && bad.h.cut === 1, `a trip that goes badly does a family no good (${g.b.toFixed(0)} against ${bad.b.toFixed(0)}), and a storm can send you home early`);
  }

  // ---- the boss, and a second holiday ----
  {
    const L = fresh(), s = L.s;
    s.cash = 50000; s.t = 4; reset(L);
    s.job = { c: 'kitchen', r: 1, perf: 60, raise: 0 };
    L.act('trip', { k: 'city', w: 'solo', c: 0 }); answer(L);
    check(s.job.perf === 60 && L.awayBossMinds(), 'the first trip in a year is your holiday');
    turn(L); const p0 = s.job.perf; L.act('trip', { k: 'city', w: 'solo', c: 0 }); answer(L);
    check(s.job.perf === p0 - 10, 'a second one costs you at work');
    const T = fresh(), ts = T.s;
    ts.cash = 50000; ts.t = 5; reset(T); ts.job = { c: 'teaching', r: 1, perf: 60, raise: 0 }; T.s.away.yr = { 1: 1 };
    T.act('trip', { k: 'city', w: 'solo', c: 0 }); answer(T);
    check(ts.job.perf === 60, 'a teacher’s summer is their own');
  }

  // ---- booking ahead ----
  {
    const L = fresh(), s = L.s;
    s.cash = 10000; s.t = 4; reset(L);
    const x = { k: 'sun', w: 'solo', c: 0, at: 1 }, full = L.awayCost(x, 1), dep = Math.round(full * 0.02) * 10;
    check(L.act('awayBook', x).ok && s.cash === 10000 - dep && s.away.book.t === 5 && L.can('awayBook', x), 'a fifth down, for the summer; one booking at a time');
    const m0 = L.moodBase();
    s.away.book = null; const m1 = L.moodBase(); s.away.book = { id: 99, k: 'sun', w: 'solo', c: 0, t: 5, cost: full, dep, at: 'Spain' };
    check(m0 === m1 + 2, 'something to look forward to');
    L.endSeason();
    check(s.pend.some((q) => q.id === 'awDepart'), 'the day comes');
    while (L.event() && L.event().id !== 'awDepart') L.choose(L.event().opts.findIndex((o) => !o.why));
    const c1 = s.cash + s.bank, t1 = s.time;
    L.choose(opt(L, 'Off we go'));
    check(!s.away.book && s.away.on && c1 - (s.cash + s.bank) === full - dep && s.time === t1 - 4 && L.event() && TRIP_CARDS[L.event().id], 'the rest is paid, the time taken, and off you go');
    answer(L);
    check(s.away.hols.length === 1 && s.comfy.trip === s.t, 'and it counts as a holiday like any other');
    const C = fresh(), cs = C.s;
    cs.cash = 10000; cs.t = 4; reset(C);
    C.act('awayBook', { k: 'city', w: 'solo', c: 0, at: 2 });
    const kept = cs.cash;
    check(C.act('awayCancel').ok && !cs.away.book && cs.cash === kept, 'cancel, and the deposit is gone');
    C.act('awayBook', { k: 'city', w: 'solo', c: 0, at: 1 });
    cs.gaol = { left: 4, served: 0, total: 4, good: 50, rep: 50 }; C.endSeason();
    check(!cs.away.book && !cs.pend.some((q) => q.id === 'awDepart'), 'Starling Gaol does not do holidays');
  }

  // ---- the honeymoon ----
  {
    const L = fresh(), s = L.s;
    s.cash = 20000; s.t = 4; reset(L);
    const p = L.meet({ kind: 'spouse', bond: 60, sex: 'f', single: false });
    L.note(`Married ${p.name}.`, 'love');
    check(s.away.moon && L.event() && L.event().id === 'awMoon', 'a wedding wants a honeymoon');
    const b0 = p.bond;
    L.choose(opt(L, 'A fortnight in the sun'));
    answer(L);
    check(s.away.n.moon === 1 && s.away.hols[0].hon && p.bond > b0 + 8 && s.ach.awayMoon && s.log.some((e) => /^Honeymoon:/.test(e.t)), 'a fortnight in the sun, as a honeymoon');
    const N = fresh(), ns = N.s;
    ns.cash = 2000; reset(N);
    const q = N.meet({ kind: 'spouse', bond: 60, sex: 'f', single: false });
    N.note(`Married ${q.name} at St Brigid’s.`, 'love');
    N.choose(opt(N, 'Later'));
    check(ns.away.moon && !N.event(), 'or later');
    turn(N); ns.t = 5; ns.cash = 5000;
    N.act('trip', { k: 'caravan', w: 'pair', c: 0 }); answer(N);
    check(ns.away.hols[0].hon && !ns.away.moon, 'the next trip together is the honeymoon');
  }

  // ---- a holiday romance, and what follows you home ----
  {
    const L = fresh(), s = L.s;
    s.cash = 20000; s.t = 5; reset(L);
    L.act('trip', { k: 'sun', w: 'solo', c: 0 });
    rig(L, ['awRomance']);
    L.chance = () => true;
    answer(L, (ev) => (ev.id === 'awRomance' ? 0 : 2));
    delete L.chance;
    const r = s.away.rom;
    check(r && r.follow && s.away.hols[0].mem.includes(r.name.split(' ')[0]), 'a holiday romance, remembered by name');
    s.t = r.due - 1; L.endSeason();
    check(s.pend.some((q) => q.id === 'awRomanceHome'), 'and a letter with a foreign stamp');
    while (L.event() && L.event().id !== 'awRomanceHome') L.choose(L.event().opts.findIndex((o) => !o.why));
    L.choose(opt(L, 'Ask'));
    check(L.partner() && L.partner().name === r.name && !s.away.rom, 'who comes to stay');
    // The one that should not have happened.
    const T = fresh({ seed: 12 }), ts = T.s;
    ts.cash = 20000; ts.t = 5; reset(T);
    const pt = T.meet({ kind: 'partner', bond: 70, sex: 'f', single: false });
    T.act('trip', { k: 'city', w: 'solo', c: 0 });
    rig(T, ['awTempt']);
    T.chance = () => true;
    answer(T, () => 2);
    delete T.chance;
    check(ts.away.secret && ts.away.secret.out && ts.karma < 0, 'temptation, given in to');
    ts.t = ts.away.secret.due - 1; T.endSeason();
    while (T.event() && T.event().id !== 'awFound') T.choose(T.event().opts.findIndex((o) => !o.why));
    const b0 = pt.bond;
    check(T.event() && T.event().id === 'awFound' && T.choose(opt(T, 'Say nothing')).ok && pt.bond <= b0 - 15 && !ts.away.secret, 'and found out, in a photograph');
  }

  // ---- the family caravan ----
  {
    const L = fresh(), s = L.s;
    s.cash = 1e5; s.age = 35;
    const { a, b } = withKids(L);
    for (let y = 0; y < 3; y++) {
      s.t = 4 * (y + 1) + 1; reset(L);
      check(L.act('trip', { k: 'caravan', w: 'family', c: 0 }).ok, `to the caravan, summer ${y + 1}`);
      answer(L);
    }
    check(s.away.trad.on && s.away.trad.n === 3 && s.log.some((e) => /A family tradition/.test(e.t)), 'three summers running is a tradition');
    s.t = 16; reset(L); L.endSeason();
    check(s.pend.some((q) => q.id === 'awTradCall'), 'and the next summer, the caravan calls');
    while (L.event() && L.event().id !== 'awTradCall') L.choose(L.event().opts.findIndex((o) => !o.why));
    L.choose(opt(L, 'Same as ever')); answer(L);
    check(s.away.trad.n === 4, 'same as ever');
    a.age = 19; b.age = 18; s.t = 19; L.endSeason();
    check(!s.away.trad.on && s.away.trad.done, 'until the children grow out of it');
    // ... and come back with their own.
    a.kind = 'child'; L.grandchild(a); L.grandkids()[0].age = 5; s.away.trad.back = -99;
    L.chance = () => true; s.t = 24; L.endSeason(); delete L.chance;
    check(s.pend.some((q) => q.id === 'awTradBack'), 'a grown child takes the grandchildren back to the same sands, and asks you along');
    while (L.event() && L.event().id !== 'awTradBack') L.choose(L.event().opts.findIndex((o) => !o.why));
    L.choose(opt(L, 'Come for the weekend'));
    check(s.away.n.back === 1 && s.log.some((e) => /^Went back to/.test(e.t)), 'back to the sands');
  }

  // ---- a place of your own away ----
  {
    const L = fresh(), s = L.s;
    s.cash = 30000;
    check(/worth/.test(L.can('awayBuy', 'static')) && /worth/.test(L.can('awayBuy', 'villa')), 'for people with means');
    s.bank = 2e6;
    const w0 = L.netWorth(), price = L.awayOwnPrice('cottage');
    check(L.act('awayBuy', 'cottage').ok && s.away.own && Math.abs(L.netWorth() - w0) < 2000 && s.ach.awayPlace, 'a cottage up the coast, which counts in what you are worth');
    check(L.can('awayBuy', 'static'), 'one is plenty');
    check(L.bills().some(([w, n]) => /upkeep/.test(w) && n === L.awayOwnUpkeep()) && !L.income().some(([w]) => /Letting/.test(w)), 'it costs its upkeep, and earns nothing unlet');
    L.act('awayLet');
    s.t = 1;
    const inc = L.income().find(([w]) => /Letting/.test(w));
    check(inc && inc[1] > L.awayOwnUpkeep() && inc[1] < price * 0.04, `let, it pays its way in the summer (${inc && inc[1]})`);
    let year = 0;
    for (let i = 0; i < 4; i++) { s.t = i; year += L.awayOwnLet() - L.awayOwnUpkeep(); }
    check(year > 0 && year < price * 0.07, `a year’s letting, after upkeep, is a fair return and no fortune (${year})`);
    const c0 = s.away.own.cond;
    for (let i = 0; i < 4; i++) { s.pend = []; L.endSeason(); }
    check(s.away.own.cond < c0 - 5, 'let, it wears');
    const mend = L.awayOwnMend();
    check(mend > 0 && L.act('awayMend').ok && s.away.own.cond === 100, 'and can be seen to');
    s.pend = []; s.t = 9; reset(L);
    check(L.act('trip', { k: 'own', w: 'solo', c: 0 }).ok === false, 'it is let for the summer');
    L.act('awayLet'); s.away.own.cond = 60;
    check(L.act('trip', { k: 'own', w: 'solo', c: 0 }).ok, 'unlet, it is yours to go to');
    answer(L);
    check(s.away.own.cond === 80 && s.away.own.n === 1, 'and a stay there sets some of it right');
    for (const id of ['awOwnStorm', 'awOwnLeak', 'awOwnSquat']) {
      s.pend = [{ id, x: null }];
      const ev = L.event();
      check(ev && clean(ev.text) && L.choose(ev.opts.length - 1).ok, `${id}: looking after it`);
    }
    const cash = s.cash + s.bank, worth = L.awayOwnWorth();
    check(L.act('awaySell').ok && !s.away.own && s.cash + s.bank - cash === Math.round(worth * OWN.cottage.keep / 100) * 100, 'sold, less the agent');
  }

  // ---- days out, the brochures, an old friend ----
  {
    const L = fresh(), s = L.s;
    s.cash = 1000; s.t = 1; reset(L);
    const c0 = s.cash;
    check(L.act('awayDay', 0.9).ok && s.cash === c0 - 20 && L.can('awayDay'), 'a day at the seaside, once a season');
    s.t = 3; reset(L);
    check(L.act('awayDay').ok && !L.awayDay().beach, 'the pantomime in winter');
    L.note('Retired as Head Chef on a pension of $1,000 a season.', 'big');
    s.bank = 1e5; L.endSeason();
    check(s.pend.some((q) => q.id === 'awBrochure'), 'retiring brings the cruise brochures');
    while (L.event() && L.event().id !== 'awBrochure') L.choose(L.event().opts.findIndex((o) => !o.why));
    L.choose(opt(L, 'Book a cruise'));
    check(s.away.book && s.away.book.k === 'cruise', 'and a cruise booked');
    const F = fresh(), fs = F.s;
    F.note('Lost touch with Nell Finch.');
    fs.cash = 10000; reset(F);
    F.act('trip', { k: 'city', w: 'solo', c: 0 });
    check(TRIP_CARDS.awOldFriend.when(F, fs.away.on), 'an old friend lost touch with could turn up abroad');
    rig(F, ['awOldFriend']); answer(F);
    check(F.friends().some((p) => p.name === 'Nell Finch'), 'and does');
    F.note('One last adventure: went north to see the Northern Lights, at 72.', 'big');
    check(fs.away.hols.some((h) => h.k === 'adv' && h.mem === 'the Northern Lights'), 'one last adventure, if it took you away, is on the list of holidays');
  }

  // ---- nothing for nothing ----
  {
    const L = fresh(), s = L.s;
    s.cash = 1e6; s.t = 5; reset(L); s.happy = 30;
    let n = 0;
    for (let i = 0; i < 6; i++) if (L.act('trip', { k: 'tent', w: 'solo', c: 0 }).ok) { n++; answer(L); }
    check(n === 1, 'one trip a season');
    const G = fresh(), gs = G.s;
    gs.cash = 50000; gs.t = 5; reset(G);
    const before = gs.cash + gs.bank;
    G.act('trip', { k: 'gap', w: 'solo', c: 0 });
    rig(G, ['awGapWork']); answer(G);
    check(gs.cash + gs.bank < before, 'working your way round still costs more than it pays');
    // A saved life, mid-trip, carries on the same.
    const S = fresh(), ss = S.s;
    ss.cash = 50000; ss.t = 5; reset(S);
    S.act('trip', { k: 'cruise', w: 'solo', c: 1 });
    const twin = new Life(JSON.parse(JSON.stringify(ss)));
    answer(S); answer(twin);
    check(JSON.stringify(twin.s) === JSON.stringify(ss), 'a life saved halfway through a cruise finishes it the same');
  }

  // ---- every trip, every way, answered at random ----
  {
    let bad = null, played = 0;
    for (let i = 0; i < 160 && !bad; i++) {
      const L = fresh({ seed: 300 + i }), s = L.s;
      s.cash = 2e5; s.age = 24 + (i % 50); s.t = 4 + (i % 4); reset(L);
      if (i % 2) withKids(L);
      if (i % 3) L.meet({ bond: 60 });
      L.s.people.push(L.makePerson({ kind: 'parent', age: 60, bond: 60, name: 'Mum', sex: 'f', single: false }));
      const k = Object.keys(KINDS)[i % Object.keys(KINDS).length], w = ['solo', 'pair', 'family', 'friends', 'parent'][i % 5], c = i % 3;
      const x = { k, w, c: Math.min(c, KINDS[k].cls.length - 1) };
      if (L.can('trip', x)) continue;
      L.act('trip', x); played++;
      let ev, m = 0;
      while ((ev = L.event()) && m++ < 10) {
        if (!clean(ev.text) || !clean(ev.title) || ev.opts.some((o) => !clean(o.t))) { bad = `${ev.id}: ${ev.text}`; break; }
        const open = ev.opts.map((o, j) => [o, j]).filter(([o]) => !o.why);
        if (!open.length) { bad = `${ev.id} has no choice`; break; }
        const r = L.choose(open[Math.floor(L.rnd() * open.length)][1]);
        if (!r.ok || (r.text && !clean(r.text))) { bad = `${ev.id}: ${r.text || r.why}`; break; }
      }
      if (!bad && s.away.on) bad = 'a trip never came home';
      if (!bad && !(s.away.hols.length === 1 && clean(s.away.hols[0].mem))) bad = 'no memory';
    }
    check(!bad && played >= 60, `every kind of trip plays through and comes home (${played} of 160)${bad ? `: ${bad}` : ''}`);
  }

  // ---- the games ----
  for (const id of ['awayPack', 'awayBeach']) check(GAMES[id] && GAMES[id].how && GAMES[id].time > 0 && GAMES[id].words.length === 4 && typeof GAMES[id].play === 'function', `${id}: a game to play on screen`);
  {
    let r = 7; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    let ok = true;
    for (let i = 0; i < 300 && ok; i++) {
      const pz = packPuzzle(rnd, i % 6), g = new Array(pz.w * pz.h).fill(null), placed = {};
      for (const a of pz.answer) { const w = placeAt(g, pz.w, pz.h, a.cells, a.x, a.y); if (!w) { ok = false; break; } for (const j of w) g[j] = a.id; placed[a.id] = w; }
      if (ok && (g.some((v) => v == null) || packScore(pz, placed) < 0.999 || pz.pieces.filter((p) => p.spare).length !== 2)) ok = false;
      const b = beachRound(rnd, i % 6);
      if (b.spots.filter((s) => s.u === b.mine.u && s.t === b.mine.t && s.x === b.mine.x).length !== 1 || b.spots.length !== b.cols * b.rows) ok = false;
    }
    check(ok && BEACH_ROUNDS >= 4, 'every case can be packed full, and your lot is on the beach exactly once');
  }
}

// For the practice players: a trip now and then, of a kind that suits them (no dice thrown here), a
// booking, and, for the rich, a place away.
export function moves(L) {
  const s = L.s, A = s.away;
  // (A holiday every year or so, as people take them: not a trip every season the dice allow.)
  if (!A || s.gaol || s.time < 2 || s.t - A.last < 3) return [];
  const ks = ['tent', 'caravan', 'coach', 'walk', 'city', 'sun', 'cruise', 'far', 'gap', 'own'], ws = ['solo', 'pair', 'family', 'friends', 'parent', 'clan'];
  const k = ks[(s.t * 7 + s.time) % ks.length], w = ws[(s.t + s.time * 3) % ws.length];
  const out = [['trip', { k, w, c: (s.t >> 2) % 2 }]];
  if (!A.book && s.t % 5 === 0) out.push(['awayBook', { k: ks[s.t % 8], w: 'solo', c: 0, at: 1 + (s.t % 3) }]);
  if (A.book && s.t % 9 === 0) out.push(['awayCancel']);
  if (!A.own && s.t % 7 === 0) out.push(['awayBuy', ['static', 'cottage', 'villa'][s.t % 3]]);
  if (A.own) { if (s.t % 6 === 0) out.push(['awayLet']); if (s.t % 5 === 0) out.push(['awayMend']); if (s.t % 40 === 0) out.push(['awaySell']); }
  return out;
}
