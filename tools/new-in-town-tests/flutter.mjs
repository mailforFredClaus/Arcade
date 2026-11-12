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
}
