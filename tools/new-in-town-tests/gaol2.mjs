// A stretch in Starling Gaol (gaol2.js): prison jobs and their wages, courses, the people
// on the landing and their stories, letters and visits, the plan for outside and the board,
// the way over the wall and life on the run, the cards of a long sentence, and old saves.
import { JOBS, JOB_IDS, LANDING, LANDING_IDS, POST } from '../../games/new-in-town/js/gaol2.js';
import { TROPHIES, COURSES } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';

export default function ({ check, fresh, Life, ACTIONS }) {
  const clone = (L, rng) => { const X = new Life(JSON.parse(JSON.stringify(L.s))); if (rng != null) X.s.rng = rng; return X; };
  const rig = (X, yes, f) => { const was = X.chance; X.chance = () => yes; try { return f(); } finally { X.chance = was; } };
  const clean = (t) => typeof t === 'string' && !/undefined|NaN|\[object|\s\s/.test(t);
  const reset = (L) => { L.s.use = {}; L.s.time = L.timeMax(); };
  const answerAll = (L, wild = false) => { let ev, n = 0; while ((ev = L.event()) && n++ < 30) { const open = ev.opts.map((o, i) => [o, i]).filter(([o]) => !o.why); const r = L.choose(wild ? open[Math.floor(L.rnd() * open.length)][1] : open[0][1]); if (!r.ok) break; } };
  const ids = new Set(EVENTS.map((e) => e.id));
  const card = (id) => EVENTS.find((e) => e.id === id);
  const inside = (o = {}) => { const L = fresh(o); L.s.st.smarts = 45; L.s.st.charm = 45; L.s.st.fitness = 45; L.s.st.craft = 45; L.jail(o.n || 12); L.s.pend = []; reset(L); return L; };

  // ---- the state, for new lives, old ones, and old ones saved in a cell ----
  {
    const L = fresh();
    check(L.s.gaol2 && !L.s.gaol2.cur && L.s.gaol2.n.terms === 0, 'a new life: nothing to remember yet');
    delete L.s.gaol2;
    check(new Life(JSON.parse(JSON.stringify(L.s))).s.gaol2.cur === null, 'a life saved before any of this opens with it');
    const P = inside({ n: 20 });
    delete P.s.gaol2;
    const O = new Life(JSON.parse(JSON.stringify(P.s)));
    check(O.s.gaol2.cur && O.g2Job().k === 'laundry' && O.s.gaol2.cur.here.length >= 5 && O.act('gWork').ok, 'a life saved in a cell opens in the laundry, with the landing as it is');
    reset(O);
    for (let i = 0; i < 6; i++) { O.endSeason(); answerAll(O); reset(O); }
    check(O.s.gaol2.cur && O.s.gaol2.cur.rec.length === 6, 'and the record of its seasons is kept from then on');
    const H = fresh({ heir: 'lag' });
    check(H.s.gaol2 && H.s.gaol2.n.terms === 0 && !H.s.gaol2.cur, 'an heir starts with a clean slate, here too');
    for (const id of ['g2Top', 'g2Reader', 'g2Quashed', 'g2Planned', 'g2Peace']) check(TROPHIES[id], `trophy ${id} is in the cabinet`);
    for (const e of EVENTS.filter((x) => x.id.startsWith('g2'))) check(!e.w, `${e.id}: dealt by the rules, never drawn at random`);
  }

  // ---- work, and a wage ----
  {
    const L = inside(), s = L.s;
    check(L.g2Job().k === 'laundry' && L.g2Job().r === 0, 'everybody starts in the laundry');
    const c0 = s.cash;
    const r1 = L.act('gWork'), r2 = L.act('gWork');
    check(r1.ok && r2.ok && s.cash === c0 + 2 * JOBS.laundry.pay[0] && clean(r1.text), 'a shift pays a prison wage, into your account');
    check(L.can('gWork') === 'Two shifts a season is all the work there is.', 'two shifts a season');
    // Up a place: shifts, a good name with the boss, and the record for it.
    s.gaol.good = 80;
    for (let i = 0; i < 12; i++) { reset(L); L.act('gWork'); }
    check(L.g2Job().r >= 1 && s.gaol2.best.laundry >= 1, 'enough good shifts, and you rise');
    // Another job: the record it wants, and not twice in a row.
    s.gaol.good = 30;
    check(L.can('g2Apply', 'gardens').includes('60'), 'the gardens are for men the governor trusts');
    s.gaol.good = 70; s.gaol2.cur.moved = s.t - 5;
    check(L.act('g2Apply', 'kitchen').ok && L.g2Job().k === 'kitchen' && L.g2Job().r === 0, 'you can put in for the kitchens, and start at the bottom');
    check(L.can('g2Apply', 'library') === 'The labour board will not move you again so soon.', 'and the labour board does not move you again at once');
    // The hotplate by hand: a better service pays more.
    L.g2Job().r = 1;
    const H1 = clone(L), H2 = clone(L), H3 = clone(L);
    reset(H1); reset(H2); reset(H3);
    const a = H1.s.cash; H1.act('g2Plate', 1); const b = H2.s.cash; H2.act('g2Plate', 0); const c = H3.s.cash; H3.act('g2Plate');
    check(H1.s.cash - a > H3.s.cash - c && H3.s.cash - c > H2.s.cash - b, 'the hotplate pays for a good service, and less for beans everywhere');
    check(!clone(L).can('g2Plate') && L.look('g2Plate').sec === 'Work', 'and it can be played, or left to look after itself');
    // The block costs you the job, sooner or later.
    const B = clone(L);
    B.g2Job().perf = 30; B.s.gaol.sol = true; B.endSeason(); B.s.pend = [];
    check(!B.g2Job() && B.g2ShiftWhy().includes('no work') && B.can('gWork') === 'Not from the block.', 'the block, with a poor name at work, and the job is gone');
    B.endSeason(); B.s.pend = [];
    check(B.s.gaol2.cur.rec.endsWith('b') && B.can('g2Apply', 'laundry') === 'The labour board will not move you again so soon.', 'the block goes on the record, and the labour board makes you wait');
    B.endSeason(); B.s.pend = [];
    check(B.can('g2Apply', 'laundry') === null, 'and then you can put in for work again');
    // A wage is a wage: no more than two shifts' worth, whatever you do.
    const W = inside();
    let most = 0;
    for (let i = 0; i < 20; i++) { const X = clone(W, i * 11); X.g2Job().k = 'kitchen'; X.g2Job().r = 3; reset(X); const c1 = X.s.cash; for (let k = 0; k < 4; k++) X.act('g2Plate', 1); X.act('gWork'); most = Math.max(most, X.s.cash - c1); }
    check(most <= 2 * JOBS.kitchen.pay[3] * 1.5 + 1, `the best service in the kitchens pays at most ${most} a season`);
    // A place you rose in before takes you back a step below.
    const R = inside();
    R.s.gaol2.best.kitchen = 3;
    check(R.g2Start('kitchen') === 2, 'a place you rose in before takes you back a step below where you were');
  }

  // ---- courses ----
  {
    const L = inside(), s = L.s;
    check(L.gaolCourse() === 'trade' && L.gaolSittings() === 5, 'the education wing starts with Trade Papers');
    s.cash = 20000; s.st.smarts = 50;
    const c0 = s.cash + s.bank;
    check(L.act('g2Course', 'business').ok && L.gaolCourse() === 'business' && L.gaolSittings() === COURSES.business.classes && s.cash + s.bank === c0 - COURSES.business.cost / 2, 'a degree by post, for half the fee');
    s.st.smarts = 20;
    check(L.can('g2Course', 'coding').includes('Smarts'), 'a course by post asks what the college asks');
    s.st.smarts = 50;
    for (let i = 0; i < COURSES.business.classes; i++) { s.time = 1; L.act('gStudy'); }
    check(s.edu.business && s.gaol2.cur.learnt.includes('business'), 'and it is a real degree at the end of it');
    // The kitchens count towards the Culinary Certificate.
    const K = inside();
    K.act('g2Course', 'culinary'); K.g2Job().k = 'kitchen';
    let n = 0;
    for (let i = 0; i < 30 && !K.s.edu.culinary; i++) { reset(K); K.act('gWork'); n++; }
    check(K.s.edu.culinary && n > 4, `shifts in the kitchens count towards the Culinary Certificate (${n} shifts)`);
    check(K.startRung('kitchen') >= 2, 'and it counts outside, too');
  }

  // ---- the landing ----
  {
    // Every card about somebody on the landing can be answered, every way it offers.
    const L = inside({ n: 30 });
    const C = L.s.gaol2.cur;
    for (const id of LANDING_IDS) { const p = L.s.gaol2.folk[id] = { v: 40, st: 0, at: null, met: L.s.t, out: L.s.t + 30, back: 0, gone: null, pid: null, f: { tick: 1, letter: 2, june: 'none', listen: 1, work: 3, q: 2, found: 1, won: 1, teach: 1, les: 4 } }; if (!C.here.includes(id)) C.here.push(id); }
    L.s.gaol2.feud = 'bay';
    L.s.gaol.rep = 50;
    for (const id of ['g2Len0', 'g2Len1', 'g2Len2', 'g2Len3', 'g2Oss0', 'g2Oss1', 'g2Oss2', 'g2Oss3', 'g2Win0', 'g2Win1', 'g2Win2', 'g2Jam0', 'g2Jam1', 'g2Feud0', 'g2Feud1', 'g2Feud2']) {
      const k = { Len: 'lenny', Oss: 'ossie', Win: 'winston', Jam: 'jamie', Feu: 'stevie' }[id.slice(2, 5)];
      L.s.pend = []; L.queue(id, { k });
      const ev = L.event();
      let ok = !!ev && clean(ev.text) && ev.opts.length >= 1;
      for (let i = 0; ev && i < ev.opts.length; i++) { if (ev.opts[i].why) continue; const X = clone(L, i + 3); const r = X.choose(i); if (!r.ok || !clean(r.text)) ok = false; }
      check(ok, `${id}: a story card on the landing, answerable every way`);
    }
    // Over a long sentence, the stories move on, and some reach their end.
    let ends = 0, moved = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const X = inside({ n: 40, seed });
      for (let i = 0; i < 40 && X.s.gaol; i++) {
        reset(X);
        for (const id of LANDING_IDS) { if (!X.can('g2Help', id)) X.act('g2Help', id); else if (!X.can('g2Sit', id)) X.act('g2Sit', id); }
        X.endSeason(); answerAll(X);
      }
      const F = X.s.gaol2.folk;
      moved += Object.values(F).filter((p) => p.st >= 2).length;
      ends += Object.values(F).filter((p) => p.st >= 3 || p.gone).length;
    }
    check(moved >= 6 && ends >= 3, `the landing's stories move on over a long sentence (${moved} past their start, ${ends} at an end)`);
    // Teach Jamie to read: the trophy, and a friend when he is out.
    const J = inside({ n: 30 });
    const p = J.s.gaol2.folk.jamie = { v: 60, st: 1, at: -9, met: J.s.t, out: J.s.t + 20, back: 0, gone: null, pid: null, f: { teach: 1 } };
    for (let i = 0; i < 12 && (p.f.les || 0) < 4; i++) { reset(J); J.act('g2Help', 'jamie'); }
    check(p.f.les >= 4 && !J.g2Favour('jamie'), 'a few evenings, and Jamie can read');
    J.s.pend = []; J.queue('g2Jam1', { k: 'jamie' }); J.choose(0);
    check(J.s.gaol2.f.reader && J.s.ach.g2Reader && p.f.read, 'and writes to Kayleigh himself');
    p.out = J.s.t; J.s.pend = []; J.queue('g2Bye', { k: 'jamie' }); J.choose(0);
    check(J.s.people.some((q) => q.name === 'Jamie Nance' && q.kind === 'friend') && !J.s.gaol2.cur.here.includes('jamie'), 'he goes home, and is a friend outside');
    // Winston's appeal, won: a friend outside who works in the law.
    const Wn = inside({ n: 30 });
    Wn.s.gaol2.folk.winston = { v: 40, st: 2, at: -9, met: Wn.s.t, out: Wn.s.t + 30, back: 0, gone: null, pid: null, f: { listen: 1, work: 3, q: 3, found: 2, won: 1 } };
    Wn.s.pend = []; Wn.queue('g2Win2', { k: 'winston' }); Wn.choose(0);
    check(Wn.s.gaol2.f.quashed && Wn.s.people.some((q) => q.name === 'Winston Jory' && q.job === 'law') && Wn.s.gaol2.folk.winston.gone === 'free', 'Winston’s conviction quashed: free, and a friend in the law');
    // The landing remembers you: next sentence, the same faces, the same feelings.
    const M = inside({ n: 2 });
    M.s.gaol2.folk.ossie = { v: 55, st: 1, at: null, met: M.s.t, out: null, back: 0, gone: null, pid: null, f: { pip: 1 } };
    M.s.gaol2.folk.lenny = { v: -60, st: 2, at: null, met: M.s.t, out: M.s.t + 1, back: 0, gone: null, pid: null, f: {} };
    for (let i = 0; i < 3 && M.s.gaol; i++) { M.endSeason(); M.s.pend = []; }
    check(!M.s.gaol && M.s.gaol2.folk.ossie.v === 55, 'out of the gate, and the landing remembers what it thought of you');
    M.jail(4);
    check(M.s.gaol2.cur.here.includes('ossie') && M.s.gaol2.folk.ossie.st === 1, 'and Ossie is still in the end cell next time, where his story left off');
    // Peace at the pool table.
    const Pz = inside({ n: 30 });
    Pz.s.gaol2.folk.stevie = { v: 40, st: 2, at: -9, met: Pz.s.t, out: Pz.s.t + 30, back: 0, gone: null, pid: null, f: {} };
    Pz.s.gaol2.folk.reece = { v: 40, st: 0, at: -9, met: Pz.s.t, out: Pz.s.t + 30, back: 0, gone: null, pid: null, f: {} };
    Pz.s.gaol2.feud = 'broker'; Pz.s.st.charm = 90;
    Pz.s.pend = []; Pz.queue('g2Feud2', { k: 'stevie' });
    rig(Pz, true, () => Pz.choose(0));
    check(Pz.s.gaol2.feud === 'peace' && Pz.s.ach.g2Peace, 'a sit-down in the chapel, and a rota for the pool table');
  }

  // ---- letters and visits ----
  {
    const L = inside(), s = L.s;
    const pt = L.meet({ kind: 'partner', sex: 'f', bond: 60, live: true, single: false });
    const mum = s.people.find((p) => p.kind === 'parent');
    const b0 = pt.bond;
    check(L.act('g2Write', pt.id).ok && pt.bond > b0, 'a letter keeps somebody close');
    check(L.can('g2Write', pt.id) === 'You have written to them this season.' && L.act('g2Write', mum.id).ok && L.can('g2Write', s.people.find((p) => p.kind === 'parent' && p !== mum).id).includes('Two letters'), 'one each, and two a season');
    check(L.act('g2VO', pt.id).ok && L.can('g2VO', mum.id), 'one visiting order at a time');
    let came = 0, empty = 0;
    for (let i = 0; i < 12; i++) { const X = clone(L, i * 7 + 1); X.endSeason(); X.endSeason(); if (X.s.pend.some((e) => e.id === 'g2Visit')) came++; else empty++; }
    check(came > 0, `they come to the visiting hall, mostly (${came} of 12)`);
    // On a visit you can ask for what the board will want.
    const V = clone(L); V.s.pend = []; V.queue('g2Visit', { p: pt.id });
    const ev = V.event(), ask = ev.opts.findIndex((o) => /keep the home/.test(o.t));
    check(ev && clean(ev.text) && ask >= 0, 'a visit, and something to ask');
    rig(V, true, () => V.choose(ask));
    check(V.g2HomeOk() && V.g2Plan().home.k === 'kept', 'your partner keeps the home going for you');
    // Fading: a partner who does not hear from you.
    const F = clone(L); F.s.pend = []; F.queue('g2Fade', { p: pt.id });
    const i = F.event().opts.findIndex((o) => /go and be happy/.test(o.t));
    F.choose(i);
    check(F.s.people.find((p) => p.id === pt.id).kind === 'ex', 'or you let them go');
    // Replies, for every kind of person.
    for (const p of [pt, mum, L.meet({ bond: 40 })]) { const X = clone(L); X.s.pend = []; X.queue('g2Reply', { p: p.id }); const e = X.event(); let ok = clean(e.text); for (let k = 0; k < e.opts.length; k++) { const Y = clone(X, k + 1); const r = Y.choose(k); if (!r.ok || !clean(r.text)) ok = false; } check(ok, `a letter back from ${p.kind}, answered every way`); }
  }

  // ---- the plan, and the board ----
  {
    const L = inside({ n: 12 }), s = L.s;
    s.gaol.good = 60;
    const bare = L.paroleOdds();
    const pt = L.meet({ kind: 'partner', sex: 'f', bond: 60, live: true, single: false });
    s.home = 'bedsit';
    const C = s.gaol2.cur;
    C.plan.home = { k: 'kept', p: pt.id, txt: 'home, with her' };
    C.plan.work = { c: 'kitchen', r: 0, at: 'the Gull & Anchor’s kitchen', who: 'Chef' };
    C.plan.vouch = { p: null, name: 'the Reverend Hugh Penrose' };
    const full = L.paroleOdds();
    check(full >= bare + 0.15, `the board likes a plan (${Math.round(bare * 100)}% without, ${Math.round(full * 100)}% with)`);
    C.rec = 'wwwtbt';
    check(L.paroleOdds() < full, 'and does not like trouble in the last year');
    const P = fresh(); P.jail(6); P.s.gaol.good = 100; P.s.st.charm = 100;
    check(P.paroleOdds() > 0.85, 'a model prisoner with no plan still has a good chance');
    s.n.boards = 0; s.pend = []; L.queue('parole');
    const t1 = L.event().text; s.n.boards = 3; const t2 = L.event().text;
    check(t1 !== t2 && /Gull & Anchor/.test(t1) && /Penrose/.test(t1) && clean(t1), 'the board reads out your plan, and does not say it the same way twice');
    // Out on parole: the home kept on, and the job waiting after the gate.
    const O = clone(L, 5);
    rig(O, true, () => O.choose(0));
    check(!O.s.gaol && O.s.home === 'bedsit' && O.s.f.parole, 'out on parole, and the home was kept on');
    check(O.s.pend.map((e) => e.id).indexOf('g2Start') > 0 && ['gateOut', 'lagGate'].includes(O.event().id), 'the gate first, and then the job');
    answerAll(O);
    check(O.s.job && O.s.job.c === 'kitchen' && O.s.gaol2.f.planned && O.s.ach.g2Planned, 'Monday morning, a job in the kitchens, as promised');
    // Without a plan the rented room is gone; with the chaplain's room you have a bedsit.
    const R = inside({ n: 2 }); R.s.home = 'flat'; R.s.gaol2.cur.plan.home = { k: 'room', p: null, txt: 'a room' };
    for (let i = 0; i < 3 && R.s.gaol; i++) { R.endSeason(); R.s.pend = []; }
    check(!R.s.gaol && R.s.home === 'bedsit', 'the Mariners’ Trust finds you a room');
    // Before the board: a card to get ready.
    const B = inside({ n: 12 });
    let prep = false;
    for (let i = 0; i < 6 && B.s.gaol && !prep; i++) { B.endSeason(); prep = B.s.pend.some((e) => e.id === 'g2Prep'); answerAll(B); }
    check(prep, 'the season before the board, a chance to get ready for it');
  }

  // ---- the wall ----
  {
    const L = inside({ n: 12 }), s = L.s;
    s.gaol.dig = 4;
    const bare = L.breakOdds();
    const C = s.gaol2.cur;
    C.esc.tools = 2; C.esc.habits = 2; C.esc.mate = 'moss';
    const ready = L.breakOdds();
    check(ready >= bare + 0.25, `a plan makes the wall a real chance (${Math.round(bare * 100)}% to ${Math.round(ready * 100)}%)`);
    C.esc.seen = 80;
    check(L.breakOdds() < ready, 'and being suspected makes it worse');
    // Digging: careful, and with a lookout, they rarely find it.
    const D = inside({ n: 12 }); D.s.gaol.rep = 30;
    const r0 = D.g2DigRisk(); D.s.gaol2.cur.esc.habits = 2; D.s.gaol2.cur.esc.mate = 'kev';
    check(D.g2DigRisk() < r0 && r0 < 0.15, 'digging is less often found out than it was, and less still with a plan');
    let found = 0;
    for (let i = 0; i < 40; i++) { const X = inside({ n: 20, seed: 100 + i }); X.s.gaol.rep = 30; for (let k = 0; k < 4 && X.s.gaol.dig < 4 && !X.s.gaol.sol; k++) { reset(X); X.act('gDig'); X.endSeason(); X.s.pend = []; } if (X.s.gaol.sol || X.s.gaol.dig < 4) found++; }
    check(found > 2 && found < 30, `the dig is found out sometimes, not always (${found} of 40)`);
    // The tools, the watching.
    const T = inside({ n: 12 }); T.s.gaol.dig = 1; T.g2Job().k = 'workshop'; T.g2Job().r = 1;
    rig(T, false, () => T.act('g2Tools'));
    check(T.s.gaol2.cur.esc.tools === 1, 'a hacksaw blade from the workshop');
    reset(T); T.act('g2Watch'); reset(T); T.act('g2Watch');
    check(T.s.gaol2.cur.esc.habits >= 1, 'and the guards’ habits, from watching');
    // Over the wall with somebody, and the first nights out.
    let away = null, caught = null;
    for (let i = 0; i < 40 && !(away && caught); i++) { const X = clone(L, i * 13 + 1); X.s.gaol2.cur.esc.seen = 0; X.s.time = 4; const r = X.act('gBreak'); if (!clean(r.text)) check(false, `a clean tale of the wall: ${r.text}`); if (X.s.gaol) caught = X; else away = X; }
    check(away && away.s.run && away.s.gaol2.run && away.s.gaol2.run.mate === 'moss' && !away.s.pend.length, 'over the wall, with Old Moss, and no card in the way of the law’s');
    check(caught && caught.s.gaol2.cur.esc.tools === 0 && !caught.s.gaol2.cur.esc.mate && !caught.g2Job(), 'or caught, with everything lost: the tools, the partner and the job');
    away.endSeason();
    check(away.s.pend.some((e) => e.id === 'g2Lam0'), 'somewhere to sleep, the first season out');
    const hid = away.event().opts.findIndex((o) => /caves/.test(o.t));
    away.choose(hid);
    check(away.g2LamRisk() < 1 && away.s.gaol2.run.hid === 'caves', 'and where you sleep changes the odds of being found');
    for (let i = 0; i < 6 && away.s.run; i++) { away.endSeason(); answerAll(away, true); }
    check(away.s.gaol || away.s.run || away.s.f.lam, 'on the run until they find you or stop looking');
    // Handing yourself in.
    const Hd = clone(L); Hd.s.gaol2.cur.esc.seen = 0;
    rig(Hd, true, () => Hd.act('gBreak'));
    Hd.meet({ kind: 'partner', bond: 50, live: true, single: false });
    Hd.s.pend = []; Hd.queue('g2Lam3');
    const owe = Hd.s.run.owe; Hd.choose(0);
    check(!Hd.s.run && Hd.event().id === 'inside' && Hd.s.pend[0].x.n === owe - 2, 'or you hand yourself in, and serve less than you owed');
  }

  // ---- a long sentence: something different, not the same cards ----
  {
    let repeats = 0, shown = 0, oldTwice = 0;
    const mine = new Set();
    for (let seed = 1; seed <= 4; seed++) {
      const L = inside({ n: 48, seed: 50 + seed });
      L.meet({ kind: 'partner', bond: 60, live: true, single: false });
      const said = new Set(), olds = {};
      for (let i = 0; i < 48 && L.s.gaol && !L.s.dead; i++) {
        reset(L);
        if (i % 3 === 0) { const pt = L.partner(); if (pt && !L.can('g2VO', pt.id)) L.act('g2VO', pt.id); }
        L.act('gWork'); L.act('g2Chap'); L.act('g2Group');
        L.endSeason();
        let ev, n = 0;
        while ((ev = L.event()) && n++ < 20) {
          if (ev.id !== 'parole' && ev.id !== 'g2Visit' && ev.id !== 'g2Reply') { shown++; if (said.has(ev.text)) { repeats++; if (process.env.V) console.log('again:', ev.id, ev.text.slice(0, 80)); } said.add(ev.text); }
          if (ev.id.startsWith('g2')) mine.add(ev.id);
          if (['gPudding', 'gRiot', 'gVisit', 'gSearch', 'gGarden', 'gPoem', 'gParcel', 'fk_cell'].includes(ev.id)) { olds[ev.id] = (olds[ev.id] || 0) + 1; if (olds[ev.id] > 1) oldTwice++; }
          const open = ev.opts.map((o, k) => [o, k]).filter(([o]) => !o.why);
          if (!L.choose(ev.id === 'parole' ? 1 : open[0][1]).ok) break;
        }
      }
    }
    check(repeats === 0, `no card word for word twice in a sentence (${repeats} repeats in ${shown} cards)`);
    check(oldTwice === 0, 'the old prison cards come up once a sentence at most');
    check(mine.size >= 14, `a long sentence has many cards of its own (${mine.size}: ${[...mine].join(' ')})`);
  }

  // ---- dying inside, and the last illness ----
  {
    const L = inside({ n: 40 });
    L.s.age = 80; L.s.health = 1; L.s.st.fitness = 0;
    for (let i = 0; i < 12 && !L.s.dead; i++) { L.s.health = Math.min(L.s.health, 2); L.endSeason(); answerAll(L); }
    check(L.s.dead && L.epitaph().every(clean), 'a prisoner who dies inside: the life ends, and the Gazette has its words');
    const M = inside({ n: 40 });
    M.s.chap.dusk = { at: M.s.t, cause: 'old age', left: 4, way: 'grace', treat: null, done: {} };
    M.s.gaol2.cur.t = M.s.t - 4;
    M.endSeason();
    check(M.s.pend.some((e) => e.id === 'g2Mercy'), 'a dying prisoner may be let home');
    while (M.event() && M.event().id !== 'g2Mercy') M.choose(M.event().opts.findIndex((o) => !o.why));
    rig(M, true, () => M.choose(0));
    check(!M.s.gaol && M.s.f.parole, 'on compassionate grounds');
  }

  // ---- saved and loaded inside: the same life ----
  {
    const L = inside({ n: 20 });
    for (let i = 0; i < 5; i++) { L.endSeason(); answerAll(L); reset(L); }
    const A = clone(L), B = clone(L);
    A.endSeason(); B.endSeason();
    check(JSON.stringify(A.s) === JSON.stringify(B.s), 'a life saved in a cell carries on exactly the same');
    check(ids.has('g2Start') && card('g2Lam0').ok && Object.values(ACTIONS).filter((a) => a.id.startsWith('g2') && a.place).every((a) => a.sec), 'every row inside has a heading');
    check(POST.every((id) => COURSES[id]) && JOB_IDS.every((k) => JOBS[k].ranks.length === JOBS[k].pay.length && JOBS[k].pay.length === JOBS[k].good.length), 'the tables hang together');
    check(LANDING_IDS.every((id) => LANDING[id].name && LANDING[id].blurb), 'everybody on the landing is somebody');
  }
}

// The things done from a sheet inside, for the random players: offered only in a cell.
export function moves(L) {
  const s = L.s, C = s.gaol2 && s.gaol2.cur;
  if (!s.gaol || !C) return [];
  const t = s.t, kin = s.people.filter((p) => ['partner', 'spouse', 'parent', 'child', 'sibling', 'friend'].includes(p.kind));
  const out = [['g2Apply', JOB_IDS[t % JOB_IDS.length]], ['g2Course', ['culinary', 'firstaid', 'coding'][t % 3]], ['g2Ask', t % 2 ? 'mate' : C.here[t % Math.max(1, C.here.length)]]];
  if (C.here.length) { const id = C.here[(t * 7) % C.here.length]; out.push(['g2Sit', id], ['g2Help', id]); }
  if (kin.length) { const p = kin[t % kin.length]; out.push(['g2Write', p.id], ['g2VO', p.id]); }
  return out;
}
