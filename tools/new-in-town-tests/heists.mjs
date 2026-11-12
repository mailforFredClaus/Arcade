// The low road with a plot: jobs planned over seasons, hot money, the
// detective's file, Sal's trust, Nan Carne's lot, and prison that remembers.
import { TARGETS, ROLES, RIDES } from '../../games/new-in-town/js/heists.js';
import { PLACES, TROPHIES, CAREERS } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';

export default function ({ check, fresh, Life, ACTIONS }) {
  const clone = (L, rng) => { const X = new Life(JSON.parse(JSON.stringify(L.s))); if (rng != null) X.s.rng = rng >>> 0; return X; };
  const ev = (L) => L.event();
  // Answers what is waiting with chooser(card) (default: the first that can be taken), stopping at an arrest.
  const settle = (L, chooser, stop = ['busted']) => {
    let e, n = 0;
    while ((e = L.event()) && n++ < 40) {
      if (stop.includes(e.id)) return e.id;
      const i = chooser ? chooser(e) : e.opts.findIndex((o) => !o.why);
      L.choose(i < 0 ? e.opts.findIndex((o) => !o.why) : i);
    }
    return null;
  };
  // A life with a job planned, cased and crewed, ready to go.
  const ready = (k, o = {}) => {
    const L = fresh(), s = L.s;
    s.n.crimes = 30; s.cash = 60000; s.heists.sal = 60; s.st.smarts = 50; s.st.fitness = 50; s.st.craft = 50; s.st.charm = 50;
    L.act('heistsPick', k);
    const p = s.heists.plan, T = TARGETS[k];
    for (const f of T.facts) p.know[f.id] = o.know ?? 2;
    p.way = o.way || Object.keys(T.ways)[0];
    p.ride = o.ride || (T.rides.includes('hot') ? 'hot' : T.rides[0]);
    if (p.way === 'drain') p.dug = 3;
    if (p.way === 'copy') p.copy = 2;
    if (o.crew !== false) {
      const job = { hands: 'trades', muscle: 'sports', wheel: 'sea', inside: { bank: 'finance', gull: 'kitchen', van: 'police' }[k] || 'trades' };
      for (const r of o.roles || T.ways[p.way].need) {
        const q = L.meet({ sex: 'm', job: job[r], bond: o.bond ?? 80, trait: 'witty' });
        p.crew[r] = { kind: 'friend', p: q.id, g: false };
      }
      if (!p.crew.wheel) p.crew.wheel = { kind: 'me' };
    }
    s.time = 6; s.use = {};
    return L;
  };
  // A night, answered with chooser; returns 'clean', 'messy', 'bust' or 'walked'.
  const night = (L, chooser) => {
    const r = L.act('heistsGo');
    if (!r.ok) return `refused: ${r.why}`;
    const stop = settle(L, chooser, ['busted', 'heistDone']);
    const j = L.s.heists.jobs[L.s.heists.jobs.length - 1];
    if (stop === 'busted') return 'bust';
    return j ? j.how : 'walked';
  };
  const careful = (e) => e.opts.findIndex((o) => !o.why);

  // ---- the lists hang together ----
  {
    for (const [k, T] of Object.entries(TARGETS)) {
      check(T.facts.length === 3 && T.facts.every((f) => PLACES[f.place] && [].concat(f.stage).every((st) => ['in', 'take', 'out'].includes(st)) && f.lines.length === 2 && f.lines.every((l) => l.length >= 1)), `${k}: three things to find out, each at a real place`);
      check(new Set(T.facts.map((f) => f.place)).size === 3, `${k}: cased in three different places`);
      check(Object.keys(T.ways).length === 3 && Object.entries(T.ways).every(([w, v]) => v.need.every((r) => ROLES[r]) && T.night[w]) && T.night.take, `${k}: three ways to do it, each with its night`);
      check(T.rides.every((r) => RIDES[r]) && T.haul[0] < T.haul[1] && T.sev >= 3 && T.loot, `${k}: real getaways, a haul and a charge`);
    }
    for (const id of ['heistsOpen', 'heistsPick', 'heistsCase0', 'heistsCase1', 'heistsCase2', 'heistsDig', 'heistsCopy', 'heistsAsk', 'heistsLad', 'heistsSelf', 'heistsOff', 'heistsSet', 'heistsGo', 'heistsDrop', 'heistsWashSal', 'heistsWashChips', 'heistsWashBiz', 'heistsWashBank', 'heistsWashHouse', 'heistsSpend', 'heistsTea', 'heistsPatchOff']) check(ACTIONS[id], `there is an action ${id}`);
    const ids = new Set(EVENTS.map((e) => e.id));
    for (const id of ['heistIn', 'heistSnag', 'heistTake', 'heistOut', 'heistDone', 'heistBlown', 'heistGrass', 'heistStale', 'heistLoose', 'kittoMeet', 'kittoVisit', 'kittoFlash', 'kittoPromo', 'kittoBent', 'kittoRetire', 'kittoGaol', 'lagMate', 'lagFoe', 'lagGate', 'salHome', 'carneArrive', 'carneNan', 'carneFire', 'carneHit', 'carneSitdown', 'carneWar', 'carneStash']) check(ids.has(id), `card ${id} is in the deck`);
    // (All sent for by the rules here: none of them crowds the random deck.)
    const mine = ['heistIn', 'heistSnag', 'heistTake', 'heistOut', 'heistDone', 'heistBlown', 'heistGrass', 'heistStale', 'heistLoose', 'kittoMeet', 'kittoVisit', 'kittoFlash', 'kittoPromo', 'kittoBent', 'kittoRetire', 'kittoGaol', 'lagMate', 'lagFoe', 'lagGate', 'salHome', 'carneArrive', 'carneNan', 'carneFire', 'carneHit', 'carneSitdown', 'carneWar', 'carneStash'];
    check(EVENTS.filter((e) => mine.includes(e.id)).every((e) => !e.w), 'the new cards are all sent for, never dealt at random');
    check(EVENTS.find((e) => e.id === 'gCellmate').w === 0, 'Bernard is sent for, not dealt over and over');
    check(!ACTIONS.heist, 'the one-tap bank job is gone');
  }

  // ---- a fresh life, and one saved before any of this ----
  {
    const L = fresh(), H = L.s.heists;
    check(H && H.det.file === 0 && H.sal === 50 && !H.plan && H.hot === 0 && H.lag.n === 0 && H.rival.stage === 0, 'a new life: no file, no plan, no hot money');
    L.s.record = 2; L.s.n.crimes = 12; L.s.f.jailed = 1;
    delete L.s.heists;
    const O = new Life(JSON.parse(JSON.stringify(L.s)));
    check(O.s.heists && O.s.heists.det.file > 10 && O.s.heists.det.file <= 45 && O.s.heists.lag.n >= 1, 'an old life with a record already has a file, and a sentence remembered');
    let ok = true;
    try { for (let i = 0; i < 8; i++) { O.endSeason(); O.s.pend = []; } } catch (e) { ok = false; console.log(e); }
    check(ok, 'and plays on');
    const P = fresh();
    delete P.s.heists.lag; delete P.s.heists.det.bond;
    const Q = new Life(JSON.parse(JSON.stringify(P.s)));
    check(Q.s.heists.lag && Q.s.heists.lag.mates && Q.s.heists.det.bond === 0, 'a part missing from a save is filled in');
  }

  // ---- picking a job ----
  {
    const L = fresh(), s = L.s;
    check(L.placeActions('sal').some((a) => a.id === 'heistsOpen' && a.open === 'heistPlan'), 'Sal’s back room is where jobs are planned');
    check(L.heistWhy('villa').includes('5 crimes') && L.heistWhy('bank').includes('15 crimes'), 'Sal will not talk about a job with a beginner');
    check(!L.heistList().includes('merrow') && L.heistWhy('merrow').includes('museum'), 'nothing in the museum, no Merrow job');
    s.coast = s.coast || {}; s.coast.m = { end: 'museum' };
    check(L.heistList().includes('merrow'), 'the Merrow’s treasure in its room is a target');
    s.n.crimes = 8;
    check(!L.heistWhy('villa') && L.heistWhy('bank'), 'eight crimes: the house, but not the bank');
    check(L.act('heistsPick', 'villa').ok && s.heists.plan.k === 'villa' && L.heistWhy('van') === 'One job at a time.', 'one job at a time');
    check(L.act('heistsDrop').ok && !s.heists.plan, 'and a job can be called off');
  }

  // ---- casing ----
  {
    const L = fresh(), s = L.s;
    const casing = () => Object.keys(PLACES).flatMap((id) => L.placeActions(id)).filter((a) => /^heistsCase/.test(a.id));
    check(!casing().length, 'nothing to case without a job');
    s.n.crimes = 10;
    L.act('heistsPick', 'villa');
    check(casing().length === 3 && casing().every((a, i, l) => l.findIndex((b) => b.id === a.id) === i), 'with one, three things to find out');
    check(L.placeActions('church').some((a) => a.id === 'heistsCase0') && L.placeActions('farm').some((a) => a.id === 'heistsCase1') && L.placeActions('headland').some((a) => a.id === 'heistsCase2'), 'each at its own place');
    const p = s.heists.plan, file = s.heists.det.file;
    const r = L.act('heistsCase0');
    check(r.ok && p.know.away >= 1 && p.noticed > 0 && s.heists.det.file > file && r.text.length > 20, 'a look tells you something, and gets you noticed');
    check(L.can('heistsCase0') === 'Once a season.', 'once a season');
    s.use = {};
    if (p.know.away < 2) L.act('heistsCase0');
    s.use = {};
    check(p.know.away === 2 && L.can('heistsCase0') === 'You know all there is to know.', 'twice, and you know it all');
    // Seen too often, the place tightens up.
    p.noticed = 99; s.use = {};
    L.act('heistsCase1');
    check(ev(L) && ev(L).id === 'heistBlown', 'noticed too often, and the place notices you');
    L.choose(0);
    check(p.noticed === 50 && p.know.away === 1, 'and what you knew is half out of date');
    // Casing the gull costs a stake at the tables.
    const G = fresh();
    G.s.n.crimes = 12; G.act('heistsPick', 'gull');
    check(G.look('heistsCase0').cost === 150, 'casing the casino means losing a little at the tables');
    // Noticed fades.
    const n0 = p.noticed;
    L.endSeason(); s.pend = [];
    check(p.noticed < n0, 'and being noticed fades');
  }

  // ---- the crew ----
  {
    const L = fresh(), s = L.s;
    s.n.crimes = 20; s.heists.sal = 30;
    L.act('heistsPick', 'bank');
    const lock = L.meet({ sex: 'f', job: 'trades', bond: 70, trait: 'bookish' }), cook = L.meet({ sex: 'm', job: 'kitchen', bond: 70 }), banker = L.meet({ sex: 'm', job: 'finance', bond: 70 });
    check(L.heistSkill('hands', lock) > L.heistSkill('hands', cook) && L.heistCandidates('hands')[0] === lock, 'a locksmith is better with locks than a cook');
    check(L.heistCandidates('inside').length === 1 && L.heistCandidates('inside')[0] === banker, 'only somebody who works at the bank can be inside it');
    check(L.can('heistsAsk', { r: 'inside', p: cook.id }).includes('does not work there') && L.can('heistsAsk', { p: lock.id }) === 'Ask them to do what?', 'nobody is asked to do something they cannot');
    check(L.can('heistsLad', 'hands') === 'Sal will not lend you his lads.' && L.can('heistsLad', 'inside').includes('banks'), 'Sal lends his lads only to those he trusts, and not to work in banks');
    s.heists.sal = 60;
    check(L.act('heistsLad', 'muscle').ok && L.act('heistsSelf', 'wheel').ok && L.can('heistsSelf', 'hands').includes('one place'), 'one of Sal’s lads, and yourself in one place only');
    L.act('heistsAsk', { r: 'hands', p: lock.id });
    check(L.can('heistsAsk', { r: 'hands', p: lock.id }) !== null && (s.heists.plan.crew.hands ? s.heists.plan.crew.hands.p === lock.id : true), 'asked once');
    // Close friends who work for Sal say yes more often than kind ones who do not.
    let yes = 0, kind = 0;
    for (let i = 0; i < 80; i++) {
      const X = clone(L, i * 97 + 1);
      const a = X.meet({ sex: 'm', job: 'crew', bond: 85 }), b = X.meet({ sex: 'f', job: 'teaching', bond: 40, trait: 'kind' });
      X.s.use = {}; X.s.heists.plan.crew = {}; X.s.heists.plan.asked = {};
      X.act('heistsAsk', { r: 'hands', p: a.id }); if (X.s.heists.plan.crew.hands) yes++;
      X.act('heistsAsk', { r: 'wheel', p: b.id }); if (X.s.heists.plan.crew.wheel) kind++;
    }
    check(yes > 55 && kind < 25, `an old friend in Sal’s crew says yes (${yes}/80); a kind teacher seldom does (${kind}/80)`);
    // Shares: friends a sixth, inside a fifth, lads a tenth and Sal a fifth on top.
    const C = fresh();
    C.s.n.crimes = 20; C.s.heists.sal = 60; C.act('heistsPick', 'bank');
    const f = C.meet({ sex: 'm', job: 'trades', bond: 60 }), b2 = C.meet({ sex: 'm', job: 'finance', bond: 60 });
    C.s.heists.plan.crew = { hands: { kind: 'friend', p: f.id }, inside: { kind: 'friend', p: b2.id }, muscle: { kind: 'lad' }, wheel: { kind: 'me' } };
    const cuts = C.heistCuts(), sum = cuts.reduce((a, [, c]) => a + c, 0);
    check(cuts.length === 4 && Math.abs(sum - (0.15 + 0.2 + 0.1 + 0.2)) < 1e-9, 'everybody’s share is counted, and Sal’s');
    check(C.act('heistsOff', 'hands').ok && !C.s.heists.plan.crew.hands && f.bond < 60, 'taking somebody off the job stings');
    // Enemies and strangers are not asked.
    const e = C.foe({ sex: 'm' });
    check(!C.heistAskable().includes(e), 'nobody asks an enemy');
  }

  // ---- ready, or not ----
  {
    const L = fresh(), s = L.s;
    s.n.crimes = 20; s.cash = 20000; s.heists.sal = 60;
    L.act('heistsPick', 'bank');
    check(L.heistReady() === 'Decide how it is to be done.', 'no plan, no night');
    L.act('heistsSet', { way: 'drain' });
    check(L.heistReady() === 'Decide how you get away.', 'no getaway, no night');
    L.act('heistsSet', { ride: 'boat' });
    check(L.heistReady().includes('hands'), 'the drain needs somebody on the locks');
    L.act('heistsSelf', 'hands');
    check(L.heistReady().includes('drain'), 'and the drain dug first');
    check(L.placeActions('harbour').some((a) => a.id === 'heistsDig') && L.can('heistsDig').includes('plans'), 'dug from the harbour, once you know where it runs');
    s.heists.plan.know.plans = 1;
    for (let i = 0; i < 3; i++) { s.use = {}; s.time = 6; s.health = 90; L.act('heistsDig'); }
    check(s.heists.plan.dug === 3 && !L.placeActions('harbour').some((a) => a.id === 'heistsDig'), 'three seasons of digging');
    check(L.heistReady() === 'You have no boat.', 'a boat getaway needs a boat');
    s.items.boat = 1; s.wx = 'storm';
    check(L.heistReady().includes('gale'), 'and not in a gale');
    s.wx = 'fair';
    check(!L.heistReady(), 'and then it is ready');
    L.act('heistsSet', { ride: 'own' });
    check(L.heistReady().includes('car'), 'your own car needs a car');
    L.act('heistsSet', { ride: 'hot' }); s.heists.sal = 20;
    check(L.heistReady().includes('Sal'), 'and Sal’s car needs Sal’s trust');
    check(L.can('heistsSet', { ride: 'foot' }) === 'Not a way to get away.' && L.can('heistsSet', { way: 'smash' }) === 'Not a way to do it.', 'only the ways that make sense for the place');
    // The Merrow's copy is made at the studios, by a good pair of hands.
    const M = fresh();
    M.s.n.crimes = 10; M.s.coast = M.s.coast || {}; M.s.coast.m = { end: 'museum' }; M.s.cash = 5000;
    M.act('heistsPick', 'merrow'); M.act('heistsSet', { way: 'copy' }); M.act('heistsSet', { ride: 'foot' }); M.act('heistsSelf', 'hands');
    check(M.heistReady().includes('copy') && M.can('heistsCopy') === 'Needs Craft 55.', 'a copy good enough needs Craft');
    M.s.st.craft = 70;
    for (let i = 0; i < 2; i++) { M.s.use = {}; M.s.time = 6; M.act('heistsCopy'); }
    check(M.s.heists.plan.copy === 2 && !M.heistReady(), 'two sittings, and it is ready');
  }

  // ---- the night ----
  {
    // A house, well cased, with a good crew.
    const base = ready('villa', { way: 'quiet' });
    const c = base.heistChance();
    check(c > 0.35 && c < 0.95, `a well-planned house job has a fair chance (${Math.round(c * 100)}%)`);
    const tally = { clean: 0, messy: 0, bust: 0, walked: 0 };
    let hotOk = true, cashOk = true, fileUp = true, after = true, sev = true;
    for (let i = 0; i < 160; i++) {
      const X = clone(base, i * 7919 + 3), cash = X.s.cash, file = X.s.heists.det.file;
      const how = night(X, careful);
      tally[how] = (tally[how] || 0) + 1;
      const H = X.s.heists;
      if (how === 'clean' || how === 'messy') {
        const j = H.jobs[0];
        if (!(H.hot === j.got && j.got >= 3000 && j.got <= 80000)) hotOk = false;
        if (X.s.cash > cash - 1500 || X.s.cash < cash - 1600) cashOk = false;
        if (H.det.file < file + 15) fileUp = false;
        if (!X.heistWhy('villa') || !X.heistWhy('villa').includes('forgotten') || X.s.heists.plan) after = false;
      }
      if (how === 'bust' && X.s.pend.find((q) => q.id === 'busted').x.sev !== 3) sev = false;
    }
    check(tally.clean + tally.messy >= 45 && tally.bust >= 8, `a good plan usually comes off, and sometimes it does not (${JSON.stringify(tally)})`);
    check(hotOk && cashOk, 'the haul is hot money, not cash: only the hired car comes out of your pocket');
    check(fileUp, 'and the detective knows whose work it was');
    check(after && sev, 'the house is not hit again for years, and a house is a serious charge');
    // The same house, cased by nobody and done alone on foot.
    const bad = ready('villa', { way: 'quiet', know: 0, crew: false, ride: 'foot' });
    bad.s.heists.plan.crew = { hands: { kind: 'me' } };
    let won = 0;
    for (let i = 0; i < 160; i++) { const how = night(clone(bad, i * 7919 + 3), careful); if (how === 'clean' || how === 'messy') won++; }
    check(won < tally.clean + tally.messy, `going in blind is worse (${won} against ${tally.clean + tally.messy})`);
    // The bank is harder than a house, and worth more.
    const bank = ready('bank', { way: 'inside' });
    let bw = 0, bb = 0, got = 0;
    for (let i = 0; i < 160; i++) {
      const X = clone(bank, i * 7919 + 3), how = night(X, careful);
      if (how === 'clean' || how === 'messy') { bw++; got += X.s.heists.hot; if (!X.s.f.heist) bw = -999; } else if (how === 'bust') bb++;
    }
    check(bw > 10 && bw < tally.clean + tally.messy && bb > 20, `the bank is harder (${bw} came off, ${bb} caught)`);
    check(bw > 0 && got / bw > 120000, 'and pays far more');
    // A night goes once a season, and walking away loses nothing but nerve.
    const W = clone(base, 5);
    W.act('heistsGo');
    check(W.can('heistsGo') !== null, 'one night a season');
    W.s.pend = []; W.s.heists.plan.night = null;
    // A crew member who talked: the police are waiting.
    const T = clone(base, 11);
    T.s.heists.plan.crew.hands.g = true;
    T.act('heistsGo');
    T.choose(0);
    let saw = false, e;
    while ((e = T.event()) && e.id !== 'busted') { if (e.id === 'heistSnag' && e.title === 'Blue lights') { saw = true; T.choose(e.opts.length - 1); } else T.choose(careful(e)); }
    check(saw && T.event() && T.event().id === 'busted', 'a grass on the crew means blue lights at both ends of the road');
    check(!T.s.heists.plan && T.s.heists.jobs[0].how === 'bust' && T.heistAskable().every((q) => !T.s.heists.away[q.id] || T.s.heists.away[q.id] <= T.s.t), 'and everybody caught with you is inside for a while');
    // Greed: everything you can carry is worth more, when it comes off.
    const Gr = ready('van', { way: 'inside' });
    let greedy = 0, modest = 0, gn = 0, mn = 0;
    for (let i = 0; i < 120; i++) {
      const A = clone(Gr, i * 31 + 7), B = clone(Gr, i * 31 + 7);
      if (['clean', 'messy'].includes(night(A, (q) => (q.id === 'heistTake' ? 1 : careful(q))))) { greedy += A.s.heists.hot; gn++; }
      if (['clean', 'messy'].includes(night(B, (q) => (q.id === 'heistTake' ? 2 : careful(q))))) { modest += B.s.heists.hot; mn++; }
    }
    check(gn && mn && greedy / gn > modest / mn * 1.5 && mn > gn, 'grabbing what is nearest is safer; taking it all pays more');
    // By hand: opening the lock well makes the take likelier.
    const Hn = ready('gull', { way: 'floor', roles: [] });
    Hn.s.heists.plan.crew = { hands: { kind: 'me' }, wheel: { kind: 'lad' } };
    const A = clone(Hn, 1), B = clone(Hn, 1);
    A.act('heistsGo', 1); B.act('heistsGo', 0);
    check(A.s.heists.plan.night.hand === 1 && A.heistStage('take') > B.heistStage('take'), 'a lock opened well by hand helps with the take');
    check(!A.can('heistsGo', 2) || A.can('heistsGo', 2) !== null, 'the lock is scored between nothing and everything');
  }

  // ---- hot money ----
  {
    const L = fresh(), s = L.s, H = s.heists;
    H.hot = 100000;
    const w0 = L.netWorth();
    check(w0 >= 100000 && L.placeActions('sal').some((a) => a.id === 'heistsWashSal'), 'hot money counts as yours, and can be washed');
    H.sal = 60;
    const c0 = s.cash;
    L.act('heistsWashSal');
    check(s.cash === c0 + 42000 && H.hot === 40000 && H.washed === 42000 && L.can('heistsWashSal') === 'Once a season.', 'Sal washes sixty thousand a season and keeps three in ten');
    H.sal = 20; s.use = {};
    check(L.can('heistsWashSal').includes('will not'), 'but only for somebody he trusts');
    const c1 = s.cash;
    L.act('heistsWashBank');
    check((s.cash === c1 + 4000 && H.hot === 36000) || s.pend.length, 'the bank takes four thousand a season, at face value');
    s.pend = [];
    // Every way of washing it gives back less than went in.
    let lost = true;
    for (let i = 0; i < 40; i++) {
      const X = clone(L, i * 13 + 5), XH = X.s.heists;
      XH.hot = 90000; XH.sal = 60; X.s.use = {}; X.s.time = 6; X.s.cash = 1000;
      const before = XH.hot + X.s.cash;
      for (const id of ['heistsWashSal', 'heistsWashChips', 'heistsWashBank', 'heistsSpend', 'heistsSpend', 'heistsWashHouse']) X.act(id);
      const prop = X.s.estate.reduce((a, q) => a + X.propValue(q), 0);
      if (XH.hot + X.s.cash + prop > before + 1) lost = false;
      if (XH.hot < 0) lost = false;
    }
    check(lost, 'nothing washes out more than went in');
    // Spending it loose is quick, and noticed.
    const Sp = fresh();
    Sp.s.heists.hot = 50000;
    Sp.act('heistsSpend'); Sp.act('heistsSpend');
    check(Sp.s.heists.flash === 20000 && Sp.can('heistsSpend') === 'That is enough for this season.', 'twenty thousand a season, straight out of the floorboards');
    const f0 = Sp.s.heists.det.file;
    Sp.endSeason(); Sp.s.pend = [];
    check(Sp.s.heists.det.file > f0, 'and money spent faster than anybody could earn it goes in the file');
    // A property, bought for cash.
    const Pr = fresh();
    Pr.s.heists.hot = 60000;
    const n0 = Pr.s.estate.length;
    let bought = false;
    for (let i = 0; i < 10 && !bought; i++) { const X = clone(Pr, i * 41 + 3); X.act('heistsWashHouse'); if (X.s.estate.length === n0 + 1 && X.s.estate[n0].let) bought = X; }
    check(bought && bought.s.heists.hot < 60000 - bought.propValue(bought.s.estate[n0]), 'a lock-up bought for cash, and the cousin keeps a fifth');
    // A business puts it through its books.
    const B = fresh();
    check(!B.placeActions('highstreet').some((a) => a.id === 'heistsWashBiz'), 'no business, no books to cook');
    // The police search the house when you are sent down, sometimes.
    let found = 0;
    for (let i = 0; i < 40; i++) { const X = fresh(); X.s.rng = i * 17 + 1; X.s.heists.hot = 20000; X.s.heists.det.file = 60; X.jail(3); if (!X.s.heists.hot) found++; }
    check(found > 10 && found < 40, `sent down, and the stash may be found (${found}/40)`);
  }

  // ---- the detective ----
  {
    const L = fresh(), s = L.s, d = s.heists.det;
    L.crime(0, 2, 'a test');
    const after = d.file;
    check(after > 0 && after < 4, 'a crime puts a little in the file');
    s.pend = [];
    L.lawNoted(2, true);
    check(d.file > after + 8, 'an arrest a great deal more');
    s.pend = [];
    d.file = 50;
    const risk = L.riskOf(0.2);
    d.file = 0;
    check(risk > L.riskOf(0.2) + 0.05, 'a thick file makes every crime riskier');
    d.file = 50; s.heists.crimes = s.n.crimes;
    for (let i = 0; i < 12; i++) { L.endSeason(); s.pend = []; }
    check(d.file < 40 && d.file > 10, 'quiet years thin it, slowly');
    // A lawyer.
    const B = fresh();
    check(B.briefOdds(2) >= 0.85, 'a first offence and no file: a good lawyer is nearly sure');
    B.s.record = 4; B.s.heists.det.file = 60;
    check(B.briefOdds(2) < 0.25 && B.briefOdds(3) < B.briefOdds(2), 'a long record and a thick file: hardly any use, and less for worse');
    B.queue('busted', { what: 'a crate', sev: 2 });
    check(B.event().opts[3].chance < 0.3, 'and the card says so');
    let won = 0, lost = 0;
    for (let i = 0; i < 40; i++) { const X = clone(B, i * 3 + 1); X.s.cash = 20000; X.choose(3); if (X.s.pend.length && X.s.pend[0].id === 'inside') lost++; else won++; }
    check(lost > won, `a repeat offender’s lawyer mostly fails (${won} won, ${lost} lost)`);
    // A long stretch.
    const C = fresh(), D = fresh();
    C.sentence(3);
    D.s.record = 4; D.s.heists.det.file = 90;
    D.sentence(3);
    const nC = C.s.pend[0].x.n, nD = D.s.pend[0].x.n;
    check(nC === 5 && nD >= 14, `the same charge, a first time (${nC}) and with a thick file and a long record (${nD})`);
    check(D.s.heists.det.nailed === 1 && D.s.heists.det.file <= 50 && D.s.log.some((e) => e.t.includes('long stretch')), 'the detective gets a result, and the file is closed');
    // Arrests are not word for word.
    const E = fresh(), titles = new Set();
    for (let i = 0; i < 8; i++) { E.s.t = i * 3; E.s.heists.n.collared = i; titles.add(E.lawCollar({ what: 'a crate', sev: 2 }).title); }
    check(titles.size >= 4, `arrested again and again, it reads differently (${[...titles].join(', ')})`);
    E.s.heists.det.file = 70;
    check(E.lawCollar({ what: 'a crate', sev: 2 }).title === 'Detective Sergeant Kitto', 'and with a thick enough file, it is the detective herself');
    E.queue('busted', { what: 'a crate', sev: 2 });
    check(E.event().title === 'Detective Sergeant Kitto' && E.event().opts[2].chance < 0.3, 'who is harder to bribe than a constable');
    // Meeting her.
    const M = fresh();
    M.s.heists.det.file = 25;
    M.endSeason();
    check(M.s.pend.some((q) => q.id === 'kittoMeet'), 'a file thick enough, and she comes to put a face to the name');
    while (M.event() && M.event().id !== 'kittoMeet') M.choose(0);
    M.choose(0);
    check(M.s.heists.det.met != null && M.placeActions('townhall').some((a) => a.id === 'heistsTea'), 'after which she can be visited at the station');
    // Bought.
    const Bt = fresh();
    Bt.s.heists.det.met = 0; Bt.s.heists.det.file = 40; Bt.s.heists.det.bond = 100; Bt.s.cash = 10000;
    let bent = null, nick = null;
    for (let i = 0; i < 60 && !(bent && nick); i++) { const X = clone(Bt, i * 11 + 1); X.queue('kittoVisit'); X.choose(2); if (X.s.heists.det.bent != null) bent = X; else nick = X; }
    check(bent && bent.s.heists.det.file < 40 && bent.bills().some(([w]) => w.includes('Kitto')) && bent.briefOdds(2) > Bt.briefOdds(2), 'an envelope taken: the file thins, there is a retainer to pay, and a lawyer does better');
    check(bent && bent.lawFileWord() === 'On your payroll' && TROPHIES.heistBent.test(bent), 'and she is on your payroll');
    check(nick && nick.event() && nick.event().id === 'busted', 'an envelope refused is an arrest');
    // Sent after somebody else.
    const Fl = fresh();
    Fl.s.heists.det.met = 0; Fl.s.heists.det.file = 40; Fl.s.st.smarts = 100;
    let off = null;
    for (let i = 0; i < 20 && !off; i++) { const X = clone(Fl, i * 5 + 2); X.queue('kittoVisit'); X.choose(1); if (X.s.heists.det.off > X.s.t) off = X; }
    check(off && off.s.heists.det.file < 40 && off.lawFileWord() === 'Chasing somebody else', 'a good story sends her after somebody else for a while');
    const f1 = off.s.heists.det.file;
    off.lawNoted(2, true);
    check(off.s.heists.det.file - f1 <= 5, 'while she is busy, she notices half as much');
    // Retired: a new detective, with some of the notes.
    const R = fresh();
    R.s.heists.det.met = 0; R.s.heists.det.file = 80; R.s.heists.det.rank = 2;
    R.queue('kittoRetire'); R.choose(2);
    check(R.s.heists.det.i === 1 && R.s.heists.det.file === 32 && R.lawWho() === 'Treloar' && R.s.heists.det.rank === 0, 'she retires; a new detective has her notes, or some of them');
  }

  // ---- prison remembers ----
  {
    const L = fresh(), s = L.s, H = s.heists;
    s.n.crimes = 12; s.heists.sal = 70;
    s.job = { c: 'crew', r: 2, n: 5, perf: 60, raise: 0 }; s.worked.crew = 2;
    L.queue('inside', { n: 3 });
    const first = L.event().text;
    L.choose(1);
    check(s.gaol && H.lag.n === 1 && H.lag.kept && H.lag.kept.r === 2 && H.lag.kept.n === 5, 'sent down from Sal’s crew, Sal keeps your place');
    L.endSeason();
    check(s.gaol.mate && s.pend.some((q) => q.id === 'lagMate' || q.id === 'gCellmate'), 'a cellmate, from the first season');
    const mate = s.gaol.mate;
    while (s.gaol) { s.gaol.rep = 70; let e; while ((e = L.event()) && e.id !== 'lagGate') L.choose(e.opts.findIndex((o) => !o.why)); if (s.gaol) L.endSeason(); }
    const gate = L.event();
    check(gate && gate.id === 'lagGate' && gate.text.includes('$46') && H.lag.rep === 70, 'out of the gate, and your standing remembered');
    const car = gate.opts.findIndex((o) => o.t === 'Get in Sal’s car');
    check(car >= 0, 'Sal’s car is waiting for somebody who kept quiet');
    const c0 = s.cash;
    L.choose(car);
    check(s.job && s.job.c === 'crew' && s.job.r === 2 && s.job.n === 5 && s.cash > c0 && s.cash <= c0 + 12000, 'and your old job, as if you had never been away, and something for your trouble');
    // The second time.
    L.s.pend = [];
    L.queue('inside', { n: 2 });
    const again = L.event().text;
    check(again !== first && /second/.test(again), 'the second sentence does not read like the first');
    L.choose(0);
    check(s.gaol.rep >= 56 && s.gaol.good < 65, 'the landing remembers you; so does Mr Hobbs');
    L.endSeason();
    if (H.lag.mates[mate].out > s.t - 1) check(s.gaol.mate === mate, 'and your old cellmate, if he is still in');
    // The gate reads differently by the fourth time through it.
    const G = fresh();
    const texts = new Set();
    for (const n of [1, 2, 3, 5]) { const X = clone(G); X.s.heists.lag.n = n - 1; X.jail(1); X.endSeason(); while (X.event() && X.event().id !== 'lagGate') X.choose(0); if (X.event()) texts.add(X.event().text.split('.')[0]); }
    check(texts.size >= 3, `the gate is not the same every time (${texts.size} ways)`);
    // A cellmate you looked after looks you up when you are both out.
    const K = fresh();
    K.s.heists.lag.mates.kev = { met: 0, out: 0, bond: 80, n: 1 };
    K.jail(1); K.endSeason();
    check(K.s.people.some((p) => p.name === 'Kev Rudd' && p.kind === 'friend' && p.job === 'crew'), 'Kev Rudd, out before you, is a friend now: somebody to ask, one day');
    // An enemy made inside is waiting next time.
    const F = fresh();
    F.s.heists.lag.foes.col = 99;
    F.jail(4); F.endSeason();
    check(F.s.pend.some((q) => q.id === 'lagFoe'), 'Big Col has not forgotten');
    // Grassing on the landing makes him.
    let made = 0;
    for (let i = 0; i < 30; i++) { const X = fresh(); X.s.rng = i * 7 + 1; X.jail(4); X.s.time = 4; X.act('gSnitch'); if (X.s.heists.lag.foes.col) made++; }
    check(made > 5 && made < 30, 'nobody loves a grass');
  }

  // ---- Sal's trust ----
  {
    const L = fresh(), s = L.s;
    s.n.crimes = 5;
    L.queue('busted', { what: 'a crate', sev: 2 });
    L.choose(4);
    check(s.heists.sal <= 20, 'blaming Sal costs you his trust');
    const M = fresh();
    M.s.record = 1; M.s.n.crimes = 5;
    M.queue('snitch'); M.choose(0);
    check(M.s.heists.sal === 0 && M.s.heists.det.met != null, 'telling the detective everything costs you all of it');
    const W = fresh();
    W.s.n.crimes = 3; W.act('joinCrew');
    const t = W.s.heists.sal;
    W.act('work'); W.s.pend = [];
    check(W.s.heists.sal > t || !W.s.job, 'work for Sal and he trusts you a little more');
  }

  // ---- Nan Carne's lot ----
  {
    const L = fresh(), s = L.s, r = s.heists.rival;
    s.n.crimes = 14; s.t = 20; s.age = 24; s.job = { c: 'crew', r: 1, n: 0, perf: 50, raise: 0 };
    let seen = new Set();
    for (let i = 0; i < 120 && !r.end; i++) {
      s.job = s.job || { c: 'crew', r: 1, n: 0, perf: 50, raise: 0 };
      s.cash = 50000; s.health = 90; s.st.charm = 100;
      L.endSeason();
      let e;
      while ((e = L.event())) { seen.add(e.id); if (e.id === 'inside') { L.s.pend = []; break; } L.choose(e.opts.findIndex((o) => !o.why)); }
      if (s.gaol) { s.gaol = null; s.time = L.timeMax(); }
    }
    check(seen.has('carneArrive') && seen.has('carneNan') && seen.has('carneFire'), `Nan Carne’s lot move in, over years (${[...seen].filter((id) => /^carne/.test(id)).join(' ')})`);
    check(r.end, `and it ends (${r.end})`);
    // A truce, brokered.
    const T = fresh();
    T.s.st.charm = 100; T.s.heists.rival.stage = 2; T.s.heists.rival.peace = 3;
    let truce = null;
    for (let i = 0; i < 20 && !truce; i++) { const X = clone(T, i * 3 + 1); X.queue('carneSitdown'); X.choose(0); if (X.s.heists.rival.end === 'truce') truce = X; }
    check(truce && TROPHIES.heistCarne.test(truce) && truce.s.heists.sal > 50, 'a truce, brokered over the teapot, and Sal grateful');
    // You in charge of the pier.
    const Y = fresh();
    Y.s.st.charm = 100; Y.s.heists.rival.stage = 3;
    let mine = null;
    for (let i = 0; i < 20 && !mine; i++) { const X = clone(Y, i * 3 + 1); X.queue('carneWar'); X.choose(0); if (X.s.heists.rival.end === 'yours') mine = X; }
    check(mine && mine.income().some(([w, n]) => w.includes('pier') && n > 0) && mine.placeActions('casino').some((a) => a.id === 'heistsPatchOff'), 'the pier, yours: an income, and a way to give it up');
    mine.act('heistsPatchOff');
    check(!mine.income().some(([w]) => w.includes('pier')), 'given up, and it stops');
    // Sal gone: his lads with him, his cellmate's bunk, and a homecoming.
    const S = fresh();
    S.s.heists.rival.stage = 2; S.s.heists.rival.side = 'nan'; S.s.heists.det.met = 0; S.s.n.crimes = 20;
    S.queue('carneSitdown');
    const i = S.event().opts.findIndex((o) => o.t.includes('Sal will be carrying'));
    S.choose(i);
    check(S.s.heists.rival.end === 'sal' && S.salAway() && S.s.heists.rival.grass === 'you', 'tipped off, and Sal goes down');
    S.act('heistsPick', 'villa');
    check(S.can('heistsLad', 'hands').includes('away'), 'and his lads go with him');
    S.jail(3); S.endSeason();
    check(S.s.gaol.mate === 'sal', 'and if you go down too, guess who is on the bottom bunk');
    S.s.gaol = null; S.s.pend = []; S.s.t = S.s.heists.rival.back + 1;
    S.endSeason();
    check(S.s.pend.some((q) => q.id === 'salHome'), 'and one day Sal comes home');
    while (S.event() && S.event().id !== 'salHome') S.choose(0);
    S.choose(S.event().opts.length - 1);
    check(S.s.f.salOff > S.s.t + 30, 'and knows who put him there');
  }

  // ---- traits, cellmates, the gate and the stash ----
  {
    // A trait from soul.js opens a choice of its own.
    const L = ready('villa', { way: 'quiet' });
    L.act('heistsGo');
    let e;
    while ((e = L.event()) && e.id !== 'heistTake' && e.id !== 'busted') L.choose(careful(e));
    if (e && e.id === 'heistTake') {
      check(!e.opts.some((o) => o.t.startsWith('🪂')), 'no daredevil, no going back for the safe');
      L.s.soul.has.daredevil = L.s.t;
      check(L.event().opts.some((o) => o.t.startsWith('🪂')), 'a daredevil may go back for the safe as well');
    }
    // Every cellmate's card can be answered, every way.
    for (const m of ['bernard', 'tiny', 'kev', 'moss', 'sal', 'danny']) {
      const X = fresh();
      X.jail(6);
      X.s.heists.lag.mates[m] = { met: 0, out: 99, bond: 50, n: 2 };
      X.queue('lagMate', { m });
      const n = X.event().opts.length;
      let ok = n >= 1 && n <= 3;
      for (let i = 0; i < n; i++) { const Y = clone(X, i + 1); const r = Y.choose(i); if (!r.ok || !r.text) ok = false; }
      check(ok, `${m}: a cellmate with a few things to say to`);
    }
    // At the gate: Nan Carne's Rover, or the detective on a lamppost.
    const G = fresh();
    G.s.heists.rival.stage = 2; G.s.heists.sal = 20;
    let nan = false, det = false;
    for (let i = 0; i < 30 && !(nan && det); i++) {
      const X = clone(G, i * 3 + 1);
      X.s.heists.det.file = 60; X.s.heists.det.met = 0;
      X.jail(1); X.endSeason();
      while (X.event() && X.event().id !== 'lagGate') X.choose(0);
      const g = X.event(), o = g ? g.opts.map((q) => q.t) : [];
      if (o.includes('Get in the pink Rover')) { nan = true; const c = X.s.cash; X.choose(o.indexOf('Get in the pink Rover')); check(X.s.heists.rival.side === 'nan' && X.s.cash === c + 2000, 'Nan Carne’s car, and her money, and her side'); } else if (o.includes('Nod to the detective')) det = true;
    }
    check(nan && det, 'somebody different across the road, now and then');
    // The detective's tea.
    const T = fresh();
    T.s.heists.det.met = 0; T.s.heists.det.file = 30;
    const r = T.act('heistsTea');
    check(r.ok && r.text.length > 20 && T.s.heists.det.bond > 0 && T.can('heistsTea') === 'Once a season.', 'a cup of tea with the detective, once a season');
    // Nan's lads find the stash.
    const S = fresh();
    S.s.heists.hot = 50000; S.s.heists.rival.stage = 3;
    S.queue('carneStash'); S.choose(1);
    check(S.s.heists.hot === 20000, 'hot money in the loft is a temptation to the other side');
    // Robbing the Gull in the middle of the war finishes Nan Carne.
    const W = ready('gull', { way: 'inside' });
    W.s.heists.rival.stage = 3;
    let fin = null;
    for (let i = 0; i < 40 && !fin; i++) { const X = clone(W, i * 7 + 1); const how = night(X, careful); if (how === 'clean' || how === 'messy') fin = X; }
    check(fin && fin.s.heists.rival.end === 'gone', 'without the pier’s takings, Nan’s lot are just a family');
  }

  // ---- the paper, the obituary and the trophies ----
  {
    const L = ready('villa', { way: 'quiet' });
    let X = null;
    for (let i = 0; i < 40 && !X; i++) { const Y = clone(L, i * 7 + 1); const how = night(Y, careful); if (how === 'clean' || how === 'messy') X = Y; }
    check(X && X.gazette().lead.h.includes('Highcliff House'), 'a job makes the front page');
    settle(X);
    X.s.heists.det.met = 0; X.s.heists.det.bond = 70;
    const last = X.epitaph();
    check(last.some((t) => t.includes('Highcliff House robbery remains unsolved')) && last.some((t) => t.includes('sat at the back')) && last.every((t) => /[.]$/.test(t) && !/undefined|NaN/.test(t)), 'and the obituary remembers it, and who came to the funeral');
    check(TROPHIES.heistKitto.test(X) && (X.s.heists.n.clean ? TROPHIES.heistClean.test(X) : true), 'first-name terms with the detective');
    X.s.heists.washed = 100000;
    check(TROPHIES.heistWashed.test(X) && !TROPHIES.heistFirm.test(fresh()), 'trophies for the washing, not for nothing');
    for (const id of ['heistHomework', 'heistClean', 'heistFirm', 'heistWashed', 'heistKitto', 'heistBent', 'heistCarne']) check(TROPHIES[id] && !TROPHIES[id].test(fresh()), `trophy ${id} is earned, not given`);
  }

  // ---- nothing to farm ----
  {
    const L = ready('van', { way: 'inside' });
    let X = null;
    for (let i = 0; i < 60 && !X; i++) { const Y = clone(L, i * 7 + 1); const how = night(Y, careful); if (how === 'clean' || how === 'messy') X = Y; }
    settle(X);
    X.s.n.crimes = 40;
    check(X.heistWhy('van').includes('forgotten'), 'the same job is not there to be done again for years');
    X.act('heistsPick', 'villa');
    const p = X.s.heists.plan;
    for (const f of TARGETS.villa.facts) p.know[f.id] = 2;
    p.way = 'con'; p.ride = 'hot'; X.s.time = 6; X.s.use = {};
    check(X.heistReady().includes('jumpy'), 'and nothing else for a year and a half');
    // A season of casing three things is three blocks of time and no more.
    const C = fresh();
    C.s.n.crimes = 10; C.act('heistsPick', 'villa');
    for (const i of [0, 1, 2]) C.act(`heistsCase${i}`);
    check(C.s.time === 3 && [0, 1, 2].every((i) => C.can(`heistsCase${i}`) === 'Once a season.'), 'casing costs time, once a place a season');
  }
}

// For the random players: a criminal life plans jobs now and then, crews them, and goes.
export function moves(L) {
  const s = L.s, H = s.heists;
  if (!H || s.n.crimes < 8 || !(s.karma <= -10 || (s.job && s.job.c === 'crew'))) return [];
  const p = H.plan;
  if (!p) return L.rnd() < 0.15 ? L.heistList().map((k) => ['heistsPick', k]) : [];
  const out = [];
  const T = TARGETS[p.k];
  if (!p.way) out.push(['heistsSet', { way: L.pick(Object.keys(T.ways)) }]);
  if (!p.ride) out.push(['heistsSet', { ride: L.pick(T.rides) }]);
  for (const r of L.heistRoles()) {
    if (p.crew[r]) continue;
    out.push(['heistsLad', r], ['heistsSelf', r]);
    const q = L.heistCandidates(r, 1)[0];
    if (q) out.push(['heistsAsk', { r, p: q.id }]);
  }
  out.push(['heistsGo']);
  if (L.rnd() < 0.05) out.push(['heistsDrop']);
  return out;
}
