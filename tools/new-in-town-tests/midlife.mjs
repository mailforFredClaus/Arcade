// The middle of a life (midlife.js): people who need tending, the same week again, the
// ward, a year out, a trust in your name, a grown child's house, and costs that follow
// what you have. Also the words on a card for a choice with hardly any chance (engine.js).
import { REST, WARM, CLOSE, CAUSES } from '../../games/new-in-town/js/midlife.js';
import { TROPHIES } from '../../games/new-in-town/js/data.js';

export default function ({ check, fresh, Life }) {
  const rig = (X, yes, f) => { const was = X.chance; X.chance = () => yes; try { return f(); } finally { X.chance = was; } };
  const reset = (L) => { L.s.use = {}; L.s.time = L.timeMax(); L.s.pend = []; };
  const turn = (L) => { L.endSeason(); L.s.pend = []; reset(L); };
  const clean = (t) => typeof t === 'string' && t.length > 0 && !/undefined|NaN|\[object|\s\s/.test(t);
  const answerAll = (L) => { let ev, n = 0; while ((ev = L.event()) && n++ < 20) { const r = L.choose(ev.opts.findIndex((o) => !o.why)); if (!r.ok) break; } };
  // Answers whatever cards come before the one wanted (which is left waiting); true if it is there.
  const upTo = (L, id) => { let ev, n = 0; while ((ev = L.event()) && ev.id !== id && n++ < 20) { if (!L.choose(ev.opts.findIndex((o) => !o.why)).ok) break; } return !!L.event() && L.event().id === id; };

  // ---- its state, for new lives and old ----
  {
    const L = fresh();
    check(L.s.mid && L.s.mid.rut === 0 && L.midMeans() === 1 && L.midPrice(10000) === 10000, 'a new life starts with nothing on, and ordinary means');
    delete L.s.mid;
    const O = new Life(JSON.parse(JSON.stringify(L.s)));
    check(O.s.mid && O.s.mid.rut === 0 && Array.isArray(O.s.mid.lent) && O.midMeans() >= 1, 'a life saved before the middle years were thought of opens with them');
    for (const id of ['midClose', 'midTerm', 'midTrust', 'midRun', 'midYear']) check(TROPHIES[id], `trophy ${id} is in the cabinet`);
  }

  // ---- people need tending ----
  {
    const L = fresh(), s = L.s;
    s.cash = 1e5;
    const a = L.meet({ bond: 100 }), b = L.meet({ bond: 100 }), c = L.meet({ bond: 50 });
    turn(L); // (somebody new is counted as seen when first noticed)
    reset(L); L.act('out', { p: a.id, a: 'walk' });
    for (let i = 0; i < 4; i++) { if (i === 2) L.act('out', { p: a.id, a: 'walk' }); turn(L); }
    check(L.midSince(a) <= 2 && L.midSince(b) >= 4, 'time together is remembered, person by person');
    check(b.bond < a.bond - 10 && b.bond < 85, `a close friend left without your time drifts back (${b.bond.toFixed(0)} against ${a.bond.toFixed(0)})`);
    check(50 - c.bond <= 2 * 5 + 0.01, 'one who was never close only drifts as friends always have');
    check(L.midDrifting(b) && !L.midDrifting(c), 'and the screen can say who is drifting for want of your time');
    // Presents and parties keep people warm, not close.
    const d = L.meet({ bond: 66 });
    reset(L); L.act('gift', d.id);
    check(d.bond > 66 && d.bond < 70 + 0.5 * 2, `a present takes a friend up to ${WARM}, and only a little past it (${d.bond.toFixed(1)})`);
    const e = L.meet({ bond: 40 });
    reset(L); L.act('gift', e.id);
    check(e.bond === 46, 'a present does its full good for a friend who is not yet close');
    s.home = 'bedsit';
    const hi = L.meet({ bond: 90 }); reset(L); L.act('party');
    check(hi.bond <= 91.6 && hi.bond > 90, 'a party does a close friend only a little good');
    // A few people who really know you lift your mood.
    const M0 = fresh(); const base = M0.moodBase();
    for (let i = 0; i < 4; i++) M0.meet({ bond: 95 });
    check(M0.moodBase() >= base + 4 && M0.midClose().length === 4, 'a few people who really know you lift your mood');
    check(REST.friend < CLOSE && REST.spouse > REST.friend, 'friends drift furthest; a husband or wife less far');
  }

  // ---- the same week again ----
  {
    const L = fresh(), s = L.s;
    s.age = 44; s.t = 104;
    s.mid.big = s.t; s.mid.rut = 0;
    const m0 = L.moodBase();
    for (let i = 0; i < 12; i++) turn(L);
    check(s.mid.rut >= 2 && L.moodBase() < m0 - 2, `years with nothing new in them wear at you (the same again: ${s.mid.rut})`);
    const r = s.mid.rut;
    L.note('Something happened.', 'big');
    check(s.mid.rut === r - 1, 'something new, big enough for the journal, eases it');
    s.mid.rut = 5; s.pend = []; s.mid.wob = null;
    L.endSeason();
    check(s.pend.some((q) => q.id === 'midWobble'), 'and when it is bad enough, the itch to do something about it');
    upTo(L, 'midWobble');
    const ev = L.event();
    check(ev && ev.opts.length >= 3 && ev.opts.every((o) => clean(o.t)), 'a card with ways out of it');
    // The marathon: train, then run it in the summer.
    const rr = L.choose(ev.opts.findIndex((o) => /Marathon/.test(o.t)));
    check(rr.ok && s.mid.plan && s.mid.plan.id === 'run' && s.mid.rut < 5, 'signing up for the Coast Marathon');
    let guard = 0;
    while (s.mid.plan && s.mid.plan.n < 4 && guard++ < 10) { reset(L); check(L.act('midTrain').ok, 'a training run'); turn(L); }
    guard = 0;
    while (!s.pend.some((q) => q.id === 'midRace') && guard++ < 8) { s.pend = []; L.endSeason(); }
    check(s.pend.some((q) => q.id === 'midRace') && L.season === 1, 'the race comes round in the summer');
    upTo(L, 'midRace');
    const race = rig(L, true, () => L.choose(0));
    check(race.ok && clean(race.text) && !s.mid.plan && s.mid.done.run === s.age && s.ach.midRun, 'and is run');
    // The band.
    const B = fresh(); B.s.age = 48; B.s.cash = 5000; B.queue('midWobble');
    B.choose(B.event().opts.findIndex((o) => /band/.test(o.t)));
    for (let i = 0; i < 4; i++) { reset(B); B.act('midRehearse'); B.s.pend = B.s.pend.filter((q) => q.id === 'midGig'); turn(B); B.s.pend = []; if (i === 3) B.queue('midGig'); }
    check(B.event() && B.event().id === 'midGig', 'four rehearsals, and a Friday at the Gull');
    const g = B.choose(0);
    check(g.ok && clean(g.text) && B.s.mid.done.band === B.s.age && !B.s.mid.plan, 'and the gig');
    // Talking it over.
    const T = fresh(); T.s.age = 46; const p = T.meet({ bond: 70 }); p.kind = 'spouse'; p.live = true; T.queue('midWobble');
    const t0 = p.bond; T.choose(T.event().opts.findIndex((o) => /Talk/.test(o.t)));
    check(p.bond > t0 && T.midSince(p) === 0, 'or a long talk on the sea wall');
  }

  // ---- the ward ----
  {
    const L = fresh(), s = L.s;
    s.cash = 1e5; s.age = 45; s.st.charm = 60; reset(L);
    check(L.placeActions('townhall').some((a) => a.id === 'midStand'), 'the ward wants a councillor');
    const Y = fresh(); Y.s.age = 30; Y.s.cash = 1e5;
    check(/35/.test(Y.can('midStand') || ''), 'one with a few grey hairs');
    const c0 = s.cash, cost = L.midPrice(3000);
    const r = rig(L, true, () => L.act('midStand'));
    check(r.ok && clean(r.text) && L.midSeat() && s.cash === c0 - cost && s.mid.seat.until === s.t + 16, 'stand, and win: four years on the council');
    check(L.income().some(([w, n]) => /councillor/.test(w) && n > 0), 'with an allowance');
    check(L.act('midCouncil').ok && !L.act('midCouncil').ok, 'the council meets once a season');
    // Miss three meetings and the Gazette notices.
    for (let i = 0; i < 4; i++) { s.pend = []; L.endSeason(); reset(L); if (s.pend.some((q) => q.id === 'midCensure')) break; }
    check(s.mid.seat.miss >= 3, 'missed meetings are counted');
    // A vote in the summer, and each question comes before you once.
    const V = fresh(); V.s.age = 45; V.s.cash = 1e5; V.s.st.charm = 60; reset(V);
    rig(V, true, () => V.act('midStand'));
    const seen = [];
    for (let i = 0; i < 13; i++) { reset(V); V.act('midCouncil'); V.endSeason(); let ev, n = 0; while ((ev = V.event()) && n++ < 20) { if (ev.id === 'midVote') { seen.push(V.s.pend[0].x.k); check(ev.opts.length === 3 && ev.opts.every((o) => clean(o.t)) && clean(ev.title), 'a vote has a title and two sides, and abstaining'); } if (!V.choose(ev.opts.findIndex((o) => !o.why)).ok) break; } }
    check(seen.length >= 3 && new Set(seen).size === seen.length, `a vote each summer, never the same one twice (${seen.join(', ')})`);
    // The end of the term: stand down, and it is done.
    let tries = 0;
    while (!V.s.pend.some((q) => q.id === 'midTerm') && tries++ < 20) { reset(V); V.act('midCouncil'); V.endSeason(); V.s.pend = V.s.pend.filter((q) => q.id === 'midTerm'); }
    check(upTo(V, 'midTerm'), 'four years on, the ward wants an answer');
    V.choose(V.event().opts.findIndex((o) => /Stand down/.test(o.t)));
    V.s.pend = []; V.endSeason(); V.s.pend = [];
    check(!V.midSeat() && V.s.mid.n.terms === 1 && V.s.ach.midTerm && V.epitaph().some((t) => /council/.test(t)), 'a full term is remembered');
    check(/a while/.test(V.can('midStand') || '') || V.can('midStand') === null, 'and you may stand again in time');
  }

  // ---- a year out ----
  {
    const L = fresh(), s = L.s;
    s.cash = 1e5; s.age = 45;
    check(/job/.test(L.can('midYearOut', 'travel') || ''), 'a year out needs a job to be out of');
    s.job = { c: 'tech', r: 3, n: 0, perf: 60, raise: 0 }; s.n.shifts = 60; reset(L);
    const c0 = s.cash, cost = L.midYearCost('travel');
    check(L.act('midYearOut', 'travel').ok && L.midAway() && s.cash === c0 - cost, 'a year out, travelling, paid for');
    check(/year out/.test(L.can('work') || ''), 'and the job waits: no shifts meanwhile');
    for (let i = 0; i < 6; i++) { s.pend = s.pend.filter((q) => q.id === 'midBack'); if (!s.pend.length) L.endSeason(); }
    s.pend = s.pend.filter((q) => q.id === 'midBack');
    check(s.pend.some((q) => q.id === 'midBack'), 'a year later the job wants you back');
    upTo(L, 'midBack');
    const r = L.choose(0);
    reset(L);
    check(r.ok && clean(r.text) && !L.midAway() && !L.can('work') && s.ach.midYear, 'and you go back to it');
    check(/not long ago/.test(L.can('midYearOut', 'home') || ''), 'one year out at a time');
  }

  // ---- a trust in your name ----
  {
    const L = fresh({ name: 'Ada Pengelly' }), s = L.s;
    s.age = 50; s.cash = 3e5; reset(L);
    check(L.placeActions('townhall').some((a) => a.id === 'midTrustOpen'), 'a trust in your name, at the Town Hall');
    const cost = L.midTrustCost();
    check(cost >= 40000 && L.act('midFound', 'sail').ok && s.mid.trust.name === 'The Pengelly Trust' && s.cash === 3e5 - cost, 'founded with your name on it');
    check(!L.act('midFound', 'books').ok, 'one is enough');
    // A year of it: some of the fund goes on what it is for.
    const f0 = s.mid.trust.fund;
    while (L.season !== 3) turn(L);
    s.mid.trust.chair = s.t;
    L.endSeason();
    check(s.mid.trust.fund < f0 && s.pend.some((q) => q.id === 'midTrustYear'), 'each year it spends a little, and you hear what it did');
    answerAll(L);
    // Left unwatched, a trust tempts its treasurer.
    let books = false;
    for (let y = 0; y < 8 && !books; y++) { for (let i = 0; i < 4; i++) { s.pend = []; L.endSeason(); if (s.pend.some((q) => q.id === 'midTrustBooks')) books = true; } }
    check(books, 'a trust nobody chairs tempts its treasurer');
    // Running low.
    s.mid.trust.fund = 1000; s.pend = [];
    while (L.season !== 3) { L.endSeason(); s.pend = []; }
    L.endSeason();
    check(s.pend.some((q) => q.id === 'midTrustLow'), 'and a fund run low has to be topped up or wound up');
    upTo(L, 'midTrustLow');
    L.choose(L.event().opts.findIndex((o) => /wind it up/.test(o.t)));
    check(!s.mid.trust && s.ach.midTrust && L.epitaph().some((t) => /trust/.test(t)), 'wound up, it is still remembered');
  }

  // ---- a grown child's house ----
  {
    const L = fresh(), s = L.s;
    s.age = 55; s.cash = 5e5; reset(L);
    const k = L.meet({ bond: 60 }); k.kind = 'child'; k.age = 30;
    const x = { p: k.id, n: L.midPrice(20000) };
    L.queue('midNest', x);
    const ev = L.event();
    check(ev && clean(ev.text) && ev.opts.length === 3 && ev.opts[0].cost === x.n, 'a grown child, a house, and a deposit to find');
    const b0 = k.bond;
    L.choose(1);
    check(s.mid.lent.length === 1 && s.mid.lent[0].left === x.n && L.netWorth() > 0 && k.bond > b0, 'lent, to be paid back');
    const c0 = s.cash;
    rig(L, false, () => { L.endSeason(); });
    check(s.cash !== c0 && s.mid.lent[0].left < x.n, 'a little back each season');
    // Given outright, it counts as a gift made in life.
    const G = fresh(); G.s.age = 60; G.s.cash = 5e5;
    const g = G.meet({ bond: 60 }); g.kind = 'child'; g.age = 32;
    G.queue('midNest', { p: g.id, n: G.midPrice(20000) });
    G.choose(0);
    check(g.bond > 70 && (!G.chapGiven || G.chapGiven(g.id).length === 1), 'given, it is counted as a gift in life, for the will');
  }

  // ---- costs that follow what you have ----
  {
    const P = fresh(), R = fresh();
    R.s.bank = 2400000; R.s.mid.means = R.midCalcMeans();
    check(R.midMeans() >= 3.5 && R.midMeans() <= 4.5 && R.midPrice(10000) > P.midPrice(10000) * 3, `a fortune changes what the town asks of you (${R.midMeans()})`);
    check(R.annalsAsks()[2] > P.annalsAsks()[2] && P.annalsAsks().join() === '100,1000,10000', 'the appeals ask more of the rich');
    R.s.age = 62; R.queue('will');
    const will = R.event();
    check(will && will.opts[0].cost === R.midPrice(10000) && /\$/.test(will.opts[0].t), 'and so does the solicitor, putting things in order');
    // A big house costs more to run; so do a comfortable home's children; a boat wants a mooring.
    const H = fresh(); H.s.home = 'villa';
    check(H.bills().some(([w, n]) => /Rates/.test(w) && n >= 2000), 'a big house has rates and a gardener to pay');
    R.s.people.push(R.makePerson({ kind: 'child', age: 8, bond: 60 }));
    check(R.bills().some(([w]) => /children’s friends/.test(w)) && !P.bills().some(([w]) => /children’s friends/.test(w)), 'a comfortable home’s children cost more');
    P.s.items.boat = 1;
    check(P.bills().some(([w]) => /boat/.test(w)), 'a boat wants a mooring');
    // The bank's best rate is for savers, not for fortunes.
    const S = fresh(); S.s.bank = 100000; const r1 = S.savingsRate(); S.s.bank = 5e6;
    check(S.savingsRate() < r1 * 0.6 && S.savingsRate() > r1 * 0.5, 'what is over half a million earns half the rate');
  }

  // ---- a choice with hardly any chance says so ----
  {
    const L = fresh(); L.s.st.charm = 1;
    L.queue('midNest', { p: -1, n: 1 }); L.s.pend = [];
    L.s.age = 50; L.s.mid.seat = { since: 0, until: 99, miss: 0, att: 0, ward: 0, votes: [], terms: 0 };
    L.s.t = 10; L.queue('midTerm');
    const ev = L.event();
    const o = ev && ev.opts.find((q) => q.chance != null);
    L.s.st.charm = 100; L.s.karma = 100; L.s.fame = 100;
    const hi = L.event().opts.find((q) => q.chance != null);
    check(L.hopeWord(0.05) === ' (hardly any chance)' && L.hopeWord(0.15) === ' (a long shot)' && L.hopeWord(0.5) === '' && L.hopeWord(null) === '', 'odds in words when they are poor');
    check(o && hi && (o.chance > 0.2 || /chance|long shot/.test(o.t)) && !/chance|long shot/.test(hi.t), 'a near-hopeless choice says so on the card; a good one does not');
  }

  // ---- random lives: nothing in it falls over ----
  {
    const L = fresh(), s = L.s;
    s.cash = 1e6; s.age = 50;
    for (let i = 0; i < 60; i++) {
      reset(L);
      for (const [id, x] of moves(L)) if (!L.can(id, x)) L.act(id, x);
      for (const id of ['midStand', 'midCouncil', 'midChair', 'midTrain', 'midRehearse']) if (!L.can(id)) L.act(id);
      L.endSeason();
      answerAll(L);
    }
    check(!s.dead && Number.isFinite(L.netWorth()) && s.mid.rut >= 0 && s.mid.rut <= 8, 'twenty years of the middle of a life, without anything going wrong');
  }
}

// For the random players: the things here that are not on any place's list.
export function moves(L) {
  const out = [];
  for (const how of ['travel', 'learn', 'home']) out.push(['midYearOut', how]);
  for (const c of Object.keys(CAUSES)) out.push(['midFound', c]);
  out.push(['midTopUp']);
  return out;
}
