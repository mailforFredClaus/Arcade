// The flutter: a gambling habit that grows with betting, fades without it, hurts once it has hold,
// and can be fought (the Tuesday group) or fenced off (a bar at the Lucky Gull).

export default function ({ check, fresh, Life }) {
  // A bet now and then is nothing; a big stake every season is a habit.
  {
    const L = fresh(); L.s.cash = 5000;
    L.act('lotto'); L.endSeason();
    check(L.s.flutter.h < 2, `a lotto ticket now and then is nothing (${L.s.flutter.h.toFixed(1)})`);
    const H = fresh(); H.s.cash = 2000;
    for (let t = 0; t < 12; t++) { H.s.cash = Math.max(H.s.cash, 2000); for (let i = 0; i < 3; i++) H.act('slots', 500); H.endSeason(); while (H.event()) H.choose(H.event().opts.length - 1); }
    check(H.flHooked(), `big stakes every season: hooked (${H.s.flutter.h.toFixed(0)})`);
    // Hooked, a season without a bet is miserable; seasons without wear it down.
    const before = H.s.happy, m0 = H.moodBase();
    H.s.flutter.h = 70;
    const mood = H.moodBase();
    H.s.flutter.h = 0;
    check(H.moodBase() - mood === 3, 'it weighs on you while it has hold');
    H.s.flutter.h = 70;
    H.endSeason();
    while (H.event()) H.choose(H.event().opts.length - 1);
    check(H.s.flutter.h < 70 && H.news !== null, 'a season without a bet wears it down');
    void before; void m0;
  }

  // The Tuesday group wears it down faster, and a bar at the Lucky Gull keeps you out.
  {
    const A = fresh(), B = fresh();
    for (const L of [A, B]) { L.s.flutter.h = 50; L.s.flutter.was = true; }
    A.s.time = 6; check(A.act('flGroup').ok, 'the Tuesday group meets at St Brigid’s');
    A.endSeason(); B.endSeason();
    check(A.s.flutter.h < B.s.flutter.h - 8, `and it helps (${A.s.flutter.h.toFixed(0)} against ${B.s.flutter.h.toFixed(0)})`);
    const C = fresh(); C.s.cash = 1000; C.s.flutter.h = 30;
    check(C.act('flBar').ok && C.flBarred(), 'the Lucky Gull will bar you if you ask');
    check(C.can('slots', 50) && C.can('bjStart', 50) && !C.can('lotto'), 'and then the pier’s games will not take your money, though the newsagent will');
    for (let t = 0; t < 8; t++) C.endSeason();
    check(!C.flBarred() && !C.can('slots', 50), 'for two years');
  }

  // Chasing a loss, and the people at home.
  {
    const L = fresh(); L.s.cash = 20000; L.s.flutter.h = 75;
    L.s.flutter.last = L.s.n.casino; L.s.n.casino -= 3000; L.s.flutter.bet = L.s.t;
    L.endSeason();
    check(L.s.pend.some((q) => q.id === 'flChase'), 'hooked and losing, you are tempted to chase it');
    while (L.event() && L.event().id !== 'flChase') L.choose(0);
    const h = L.s.flutter.h;
    L.choose(L.event().opts.length - 1);
    check(L.s.flutter.h < h && !L.s.shark, 'walking away from it helps, and costs nothing');
  }

  // Getting free of it is remembered; a life saved before this has no habit.
  {
    const L = fresh(); L.s.flutter.h = 12; L.s.flutter.was = true;
    for (let t = 0; t < 3; t++) L.endSeason();
    check(L.s.f.flFree && L.s.ach.flFree, 'free of it: a milestone and a trophy');
    const O = fresh(); delete O.s.flutter;
    const R = new Life(JSON.parse(JSON.stringify(O.s)));
    check(R.s.flutter && R.s.flutter.h === 0, 'a life saved before the flutter starts without a habit');
  }

  // Chasing it with Sal's man's money: a win puts the season right, and Sal's limit is Sal's limit.
  {
    const rig = (X, yes, f) => { const was = X.chance; X.chance = () => yes; try { return f(); } finally { X.chance = was; } };
    const L = fresh(); L.s.cash = 5000; L.s.bank = 20000; L.s.flutter.h = 70;
    L.queue('flChase', 8000);
    const w0 = L.netWorth(), X = new Life(JSON.parse(JSON.stringify(L.s)));
    const r = rig(X, true, () => X.choose(0));
    check(r.ok && X.netWorth() >= w0 + 8000 && X.s.shark === 9600 && X.s.cash >= X.s.shark, `a win wins it back, with enough to clear Sal’s man (${X.netWorth() - w0}, owing ${X.s.shark})`);
    const Z = fresh(); Z.s.cash = 100; Z.s.flutter.h = 90;
    for (let i = 0; i < 4; i++) { Z.s.pend = []; Z.queue('flChase', 25000); rig(Z, false, () => Z.choose(0)); }
    Z.s.pend = []; Z.queue('flChase', 5000);
    check(Z.s.shark <= 30000 && /limits/.test(Z.event().opts[0].why || ''), `and never past what Sal lets anybody owe him (${Z.s.shark})`);
    const A = fresh(); A.s.cash = 100; A.s.flutter.h = 90;
    A.s.heists.rival.end = 'sal'; A.s.heists.rival.back = A.s.t + 10;
    A.queue('flChase', 5000);
    check(!A.event().opts.some((o) => /Sal’s man/.test(o.t)), 'with Sal inside, there is no Sal’s man to borrow from');
  }

  // The house minds a big winner: a word and a limit, then a polite request to go elsewhere.
  {
    const L = fresh(); const s = L.s, f = s.flutter;
    s.cash = 1e6;
    L.act('slots', 50);
    s.n.casino = 120000; L.endSeason();
    check(s.pend.some((q) => q.id === 'flLimit'), 'up a hundred thousand on the house, and the manager wants a word');
    while (L.event() && L.event().id !== 'flLimit') L.choose(0);
    L.choose(0);
    s.time = 6; s.use = {};
    check(L.flLimit() === 500 && /no more than \$500/.test(L.can('slots', 5000) || '') && !L.can('slots', 500) && /no more than/.test(L.can('raceBet', { i: 0, bet: 5000 }) || ''), 'and then your stakes are kept small');
    L.act('bjStart', 500);
    if (L.s.bj) check(/no more than/.test(L.can('bjDouble') || ''), 'doubling a hand is a bigger stake too');
    L.s.bj = null;
    // Still up on the house when the limit is over: asked to go elsewhere. (Her books start again from her word.)
    for (let t = 0; t < 8; t++) { s.pend = []; L.endSeason(); }
    check(L.flLimit() == null && f.base === 120000, 'the limit lasts two years, and her books on you start afresh');
    s.time = 6; s.use = {}; s.pend = [];
    L.act('slots', 50);
    s.n.casino = f.base + 105000; L.endSeason();
    while (L.event() && L.event().id !== 'flBan') L.choose(0);
    check(L.event() && L.event().id === 'flBan', 'up as much again, and the house would rather you went elsewhere');
    L.choose(0);
    check(L.flBarred() && f.house && /very politely/.test(L.can('slots', 50) || '') && !L.can('lotto'), 'the pier will not take your money for three years; the newsagent still will');
    // A small winner is nothing to the house.
    const W = fresh(); W.s.cash = 5000; W.act('slots', 50); W.s.n.casino = 20000; W.endSeason();
    check(!W.s.pend.some((q) => q.id === 'flLimit' || q.id === 'flBan'), 'a few thousand up is nothing to the house');
    // An old save starts with clean books.
    const O = fresh(); for (const k of ['nets', 'lim', 'house', 'warned', 'base']) delete O.s.flutter[k];
    const R = new Life(JSON.parse(JSON.stringify(O.s)));
    check(Array.isArray(R.s.flutter.nets) && R.s.flutter.warned === 0 && R.flLimit() == null, 'a life saved before the house kept books on you starts with clean ones');
  }

  // The house limit, and an edge that bites: nothing pays more than $100,000 over the stake.
  {
    const L = fresh(); const s = L.s;
    s.cash = 1e9;
    let best = 0;
    for (let i = 0; i < 4000; i++) { const r = L.act('slots', 50000); best = Math.max(best, r.out.win); s.flutter.barred = null; s.flutter.lim = null; s.pend = []; }
    check(best <= 150000 && best > 0, `the slots never pay more than the house limit over the stake (${best})`);
    s.hilo = { bet: 50000, pot: 140000, card: 2, streak: 2 };
    L.act('hiloGuess', 'hi');
    check(!s.hilo || s.hilo.pot <= 150000, 'nor does Higher or Lower');
    if (s.hilo) check(/house limit/.test(L.can('hiloGuess', 'hi') || '') || s.hilo.pot < 150000, 'and a pot at the limit can only be cashed');
    s.hilo = null;
    s.bj = { bet: 50, me: [1, 13], dl: [10, 7] };
    const c0 = s.cash;
    L.bjSettle('natural');
    check(s.cash === c0 + 110, 'a blackjack pays six to five');
    // A sensible gambler, over thousands of bets at each game, loses: the edge bites.
    const G = fresh(); G.s.cash = 1e9;
    const n0 = G.s.n.casino;
    for (let i = 0; i < 6000; i++) {
      G.act('hiloStart', 50);
      for (let j = 0; j < 3 && G.s.hilo; j++) { const hi = G.hiloOdds('hi'), lo = G.hiloOdds('lo'); if (Math.max(hi, lo) < 0.65) break; G.act('hiloGuess', hi >= lo ? 'hi' : 'lo'); }
      if (G.s.hilo) G.act('hiloCash');
      G.s.flutter.barred = null; G.s.pend = [];
    }
    const edge = -(G.s.n.casino - n0) / (6000 * 50);
    check(edge > 0.03 && edge < 0.15, `the house keeps a share at Higher or Lower, played sensibly (${(edge * 100).toFixed(1)}%)`);
  }
}
