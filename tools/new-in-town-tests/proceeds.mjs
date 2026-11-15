// The proceeds of crime: what Sal's crew and a burglary pay, the money the
// court can trace and take back, "It was all Sal" and running from an arrest
// (each works less well the more it is done), and Sal's trust in his crew.
import { CAREERS } from '../../games/new-in-town/js/data.js';
import { RISE, DOCK, OUT } from '../../games/new-in-town/js/proceeds.js';

export default function ({ check, fresh, Life }) {
  const clone = (L, rng) => { const X = new Life(JSON.parse(JSON.stringify(L.s))); if (rng != null) X.s.rng = rng >>> 0; return X; };
  const pct = (t) => +(/About (\d+)%/.exec(t) || [0, -1])[1];
  const arrested = (L) => L.s.pend.some((q) => q.id === 'busted');
  // Clones of L, each with its own luck, until one does what is wanted (or forty have tried).
  const find = (L, f, ok) => { for (let i = 0; i < 40; i++) { const X = clone(L, i * 7919 + 13); f(X); if (ok(X)) return X; } return null; };

  // ---- the wages ----
  {
    const crew = CAREERS.crew.rungs, doc = CAREERS.medicine.rungs, starts = Object.values(CAREERS).filter((c) => c.clean).map((c) => c.rungs[0].pay);
    check(crew[0].pay > starts.sort((a, b) => a - b)[starts.length >> 1], 'Sal pays a new face better than most honest starts');
    check(crew[2].title === 'Enforcer' && crew[2].pay < 5000 && crew[crew.length - 1].pay <= doc[doc.length - 1].pay * 1.15, 'and no better, at the top, than the top of medicine');
  }

  // ---- burglary ----
  {
    const B = fresh();
    B.s.time = 6;
    const was = pct(B.look('burgle1').desc);
    const done = [], nicked = [];
    for (let i = 0; i < 80; i++) { const X = clone(B, i * 37 + 1), c = X.s.cash; X.act('burgle1'); (arrested(X) ? nicked : done).push(X); X.got = X.s.cash - c; }
    check(done.length > 30 && nicked.length > 8 && done.every((X) => X.got >= 4000 && X.got <= 11000), `a villa on the cliff road pays $4,000 to $11,000 to Sal’s man, or ends in a cell (${nicked.length} of 80)`);
    const X = done[0];
    check(X && X.can('burgle1') === 'Once a season.' && !X.can('burgle0'), 'one villa a season; a terrace is another matter');
    check(X && X.s.proceeds.dirty === X.got && X.s.proceeds.all === X.got, 'what a burglary brings in can be traced');
    check(X && X.s.f.alert === 1 && pct(X.look('burgle1').desc) >= was + 4, `and the next one is riskier: the town is talking (${was}% to ${pct(X.look('burgle1').desc)}%)`);
    if (X) {
      X.s.pend = []; X.endSeason();
      check(X.s.f.alert === 0.5 && X.s.proceeds.dirty === Math.round(X.got * 0.95), 'the talk dies down, and the money gets harder to trace, a season at a time');
      for (let i = 0; i < 6; i++) { X.s.pend = []; X.endSeason(); }
      check(!X.s.f.alert || X.s.gaol, 'until the street forgets');
    }
    // A fence in Kettleby, when Sal will not deal with you.
    const K = fresh();
    K.s.heists.sal = OUT - 5;
    check(K.look('burgle1').desc.startsWith('A fence in Kettleby') && K.can('errand').includes('nothing for you'), 'Sal does not want you: no errands, and a fence in Kettleby for the silver');
    const k = find(K, (Y) => { Y.c0 = Y.s.cash; Y.act('burgle1'); }, (Y) => !arrested(Y));
    check(k && k.s.cash - k.c0 >= 2400 && k.s.cash - k.c0 <= 6600, 'who pays like it');
  }

  // ---- traceable money ----
  {
    const W = fresh();
    W.s.job = { c: 'kitchen', r: 1, n: 0, perf: 50, raise: 0 }; W.s.time = 2;
    W.act('work');
    check(W.s.proceeds.dirty === 0, 'an honest shift is nobody’s business');
    const C = fresh();
    C.s.job = { c: 'crew', r: 1, n: 0, perf: 50, raise: 0 }; C.s.time = 2;
    const c0 = C.s.cash;
    C.act('work');
    check(C.s.proceeds.dirty === C.s.cash - c0 && C.s.proceeds.dirty > 0, 'a shift for Sal is the proceeds of crime');
  }

  // ---- the confiscation order ----
  {
    const base = () => { const L = fresh(); L.s.bank = 50000; L.s.proceeds.dirty = 40000; L.s.proceeds.all = 60000; L.s.heists.det.file = 70; L.s.record = 2; return L; };
    const ordered = (X) => X.s.pend.some((q) => q.id === 'proSeize');
    const X = find(base(), (Y) => Y.sentence(2), ordered);
    check(X && X.s.pend[0].id === 'inside' && X.s.pend[1].x.n === 20000, 'sent down, with a thick file, the court asks for half of what it can trace');
    if (X) {
      X.choose(0);
      const e = X.event();
      check(e && e.id === 'proSeize' && e.opts.length === 3 && e.opts[1].chance < 0.6 && e.opts[1].cost >= 2000, 'hand it over, fight it with a lawyer (no sure thing), or tell a tale');
      X.choose(0);
      check(X.s.bank === 30000 && X.s.proceeds.dirty === 20000 && X.s.proceeds.seized === 20000 && X.s.proceeds.orders === 1, 'savings go first');
    }
    let none = 0;
    for (let i = 0; i < 30; i++) { const Y = clone(base(), i * 31 + 3); Y.sentence(2); if (!ordered(Y)) none++; }
    check(none > 0 && none < 15, `and it does not always ask (${none} of 30 times it did not)`);
    const T = base();
    T.s.proceeds.dirty = 1500;
    T.sentence(2);
    check(!ordered(T), 'a little does not interest it');
    const F = base();
    F.s.record = 0;
    F.sentence(1);
    check(!ordered(F) && F.s.record === 1 && !F.s.pend.length, 'nor does a fine');
    // The detective's long stretch: everything crime ever paid that you still have.
    const N = base();
    N.s.heists.det.file = 90;
    N.sentence(3);
    const q = N.s.pend.find((p) => p.id === 'proSeize');
    check(q && q.x.all && q.x.n === Math.min(60000, 50000 + N.s.cash), 'put away for the long stretch, all of it');
    if (q) {
      N.choose(0); N.choose(0);
      check(N.s.bank === 0 && N.s.cash >= 0 && N.s.proceeds.seized === 50000 + 1500, 'and there is nothing left');
    }
  }

  // ---- "It was all Sal" ----
  {
    const S = fresh();
    S.s.n.crimes = 20; S.s.st.charm = 90; S.s.st.fitness = 90; S.s.heists.sal = 70;
    S.s.job = { c: 'crew', r: 2, n: 0, perf: 60, raise: 0 }; S.s.worked.crew = 2;
    S.queue('busted', { what: 'a crate', sev: 2 });
    const first = S.event().opts[4];
    check(first.t.startsWith('It was all Sal') && first.stat === 'charm' && first.chance >= 0.9, 'the first time, a charmer is believed');
    const X = find(S, (Y) => Y.choose(4), (Y) => !Y.s.gaol && !Y.s.pend.some((p) => p.id === 'inside'));
    check(X && X.s.proceeds.blamed === 1 && X.s.heists.sal === 40 && X.event() && X.event().id === 'proSalWord', 'and then Sal wants a word');
    if (X) {
      X.queue('busted', { what: 'a crate', sev: 2 });
      X.s.cash = 50000;
      const pay = X.event().opts[0].cost;
      check(pay >= 3000, 'paying for his trouble costs something');
      const P1 = clone(X); P1.choose(0);
      check(P1.s.heists.sal === 50 && P1.s.job.r === 2, 'paid for, the trouble is over, and you keep your place');
      const P2 = clone(X); const hp = P2.s.health; P2.choose(1);
      check(P2.s.job.r === 1 && P2.s.health < hp && P2.s.heists.sal === 46, 'or you take your punishment, and go down a rung');
      const P3 = clone(X); P3.choose(2);
      check(!P3.s.job, 'or you walk out');
      P1.s.st.charm = 90;
      const second = P1.event().opts[4];
      check(second.chance <= first.chance - 0.2, `the police have heard it before (${Math.round(first.chance * 100)}% to ${Math.round(second.chance * 100)}%)`);
      P1.s.proceeds.blamed = 4;
      check(P1.event().opts[4].chance <= 0.1 && P1.event().opts[4].t.includes('hardly any chance'), 'by the fifth time, hardly anybody would');
    }
    // Not in the crew: no word, but Sal is not speaking to you.
    const O = fresh();
    O.s.n.crimes = 20; O.s.st.charm = 100;
    const Y = find(O, (Z) => { Z.queue('busted', { what: 'a crate', sev: 2 }); Z.choose(4); }, (Z) => !Z.s.pend.length);
    check(Y && Y.can('errand') === 'Sal is not speaking to you.' && Y.s.proceeds.blamed === 1, 'blame Sal from outside the crew and his errands dry up');
  }

  // ---- running for it ----
  {
    const R = fresh();
    R.s.st.fitness = 75;
    R.queue('busted', { what: 'a crate', sev: 2 });
    const first = R.event().opts[1];
    const X = find(R, (Y) => Y.choose(1), (Y) => !Y.s.pend.length);
    check(first.stat === 'fitness' && X && X.s.proceeds.ran === 1, 'a fit runner gets away');
    if (X) {
      X.queue('busted', { what: 'a crate', sev: 2 });
      check(X.event().opts[1].chance <= first.chance - 0.15, 'and next time they send the fast one');
      X.s.pend = []; X.s.proceeds.ranT = X.s.t - 8; X.endSeason();
      check(X.s.proceeds.ran === 0, 'for a couple of years');
    }
  }

  // ---- Sal's trust, in his crew ----
  {
    const T = fresh(), s = T.s;
    s.n.crimes = 40; s.karma = -40;
    for (const k of ['fitness', 'charm', 'smarts', 'craft']) s.st[k] = 90;
    s.job = { c: 'crew', r: 2, n: 100, perf: 60, raise: 0 }; s.worked.crew = 2;
    s.heists.sal = RISE - 5;
    const nr = T.nextRung();
    check(!nr.ready && nr.list.some((n) => !n.ok && n.text.startsWith('Sal trusts you')), 'below the mark, Sal does not move you up, and the next rung says why');
    const X = clone(T); X.s.time = 2; X.act('work');
    check(X.s.job && X.s.job.r === 2, 'however many shifts you put in');
    const Y = clone(T); Y.s.heists.sal = RISE + 5; Y.s.time = 2; Y.act('work');
    check(Y.s.job && Y.s.job.r === 3, 'trusted, you go up');
    const full = clone(T).shiftPay(), D = clone(T); D.s.heists.sal = DOCK - 5;
    check(D.shiftPay() === Math.round(full * 0.8 / 10) * 10 && D.proDocked(), 'distrusted, you get the worst rounds and a fifth less');
    D.s.time = 2;
    const r = D.act('work');
    check(r.ok && /Sal/.test(r.text.split('.').slice(1).join('.')), 'and you are told why');
    // Wanted out.
    const O = clone(T); O.s.heists.sal = OUT - 5; O.s.pend = [];
    O.endSeason();
    check(O.s.pend.some((q) => q.id === 'proSalOut'), 'wanted nowhere near, you are told so');
    const go = clone(O); go.s.pend = [{ id: 'proSalOut', x: null }]; go.choose(0);
    check(!go.s.job, 'and can go');
    const ask = find(O, (Z) => { Z.s.pend = [{ id: 'proSalOut', x: null }]; Z.choose(1); }, (Z) => !!Z.s.job);
    check(ask && ask.s.job.r === 1 && ask.s.heists.sal >= 25, 'or ask for one more chance, a rung down');
    const buy = clone(O); buy.s.cash = 100000; buy.s.pend = [{ id: 'proSalOut', x: null }]; buy.choose(2);
    check(buy.s.job && buy.s.job.r === 2 && buy.s.heists.sal >= 30 && buy.s.cash < 100000, 'or make it worth his while');
    O.s.pend = []; O.endSeason();
    check(!O.s.pend.some((q) => q.id === 'proSalOut') || O.s.gaol, 'and you are not asked again every season');
  }

  // ---- an old save ----
  {
    const L = fresh();
    delete L.s.proceeds; delete L.s.f.alert;
    const R = new Life(JSON.parse(JSON.stringify(L.s)));
    check(R.s.proceeds && R.s.proceeds.dirty === 0 && R.proBlameDc() === 60 && R.proRunDc() === 55 && R.proTraceable() === 0, 'a life saved before any of this carries on with a clean slate');
    R.s.time = 6;
    check(R.act('burgle0').ok, 'and can still burgle a terrace');
  }
}
