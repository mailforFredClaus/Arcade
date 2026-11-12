// Who you become, St Brigid's, and the ups and downs of the mind (soul.js).
import { CHARACTER, DEEDS, ROOF } from '../../games/new-in-town/js/soul.js';
import { TROPHIES } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';

const IDS = Object.keys(CHARACTER);
const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

// Answers whatever is waiting with the first choice that can be taken (or the one named).
function clear(L, prefer = {}) {
  let ev, n = 0;
  while ((ev = L.event()) && n++ < 30) {
    let i = prefer[ev.id] != null ? prefer[ev.id] : ev.opts.findIndex((o) => !o.why);
    if (typeof i === 'function') i = i(ev);
    L.choose(i);
  }
}
// A season gone by, with nothing much done (and only this part of town's cards answered,
// so that a card about something else cannot send the test to prison).
function turn(L, prefer) { L.s.time = 0; L.endSeason(); L.s.pend = L.s.pend.filter((e) => e.id.startsWith('soul')); clear(L, prefer); }

export default function ({ check, fresh, Life, ACTIONS }) {
  // ---- the lists hang together ----
  check(IDS.length >= 15, 'fifteen or so traits');
  for (const [id, t] of Object.entries(CHARACTER)) {
    check(t.name && t.icon && t.word && t.blurb && t.does && t.hint && typeof t.known === 'function', `trait ${id}: has a name, an icon, words and an effect`);
    const said = t.known({ He: 'She', he: 'she', his: 'her', him: 'her' });
    check(/^[A-Z].*\.$/.test(said) && !/undefined|\s\s/.test(said), `trait ${id}: the Gazette can say it`);
  }
  const known = new Set([...Object.keys(ACTIONS)]);
  for (const [id, o] of Object.entries(DEEDS)) {
    check(known.has(id), `deeds: ${id} is a real action`);
    check(Object.keys(o).every((k) => CHARACTER[k]), `deeds: ${id} counts towards real traits`);
  }
  for (const id of IDS) check(Object.values(DEEDS).some((o) => o[id] > 0), `trait ${id}: something you do leads to it`);
  for (const id of ['soulService', 'soulCarols', 'soulSupper', 'soulVicar', 'soulBells', 'soulBoard']) check(ACTIONS[id] && ACTIONS[id].place === 'church', `${id}: is at St Brigid's`);
  for (const id of ['soulCharacter', 'soulWed', 'soulPeal', 'soulParish', 'soulRoof', 'soulThrough']) check(TROPHIES[id], `trophy ${id}`);
  // Several cards offer something extra to those with a given trait.
  const traitCards = EVENTS.filter((e) => e.id.startsWith('soul') && e.opts.some((o) => o.show && /^\S+ /.test(typeof o.t === 'string' ? o.t : '')));
  check(traitCards.length >= 8, `several cards have choices only for some characters (${traitCards.length})`);

  // ---- an old save ----
  {
    const L = fresh();
    L.act('library');
    delete L.s.soul;
    const R = new Life(JSON.parse(JSON.stringify(L.s)));
    check(R.s.soul && R.s.soul.lean.bookish === 0 && R.s.soul.graves.length === 0, 'a life saved before St Brigid’s opened picks it up');
    R.s.time = 6;
    check(R.act('soulService').ok && R.act('library').ok, 'and carries on');
    let ok = true;
    try { for (let i = 0; i < 8; i++) turn(R); } catch (e) { ok = false; console.log(e); }
    check(ok, 'and seasons go by');
    // A half-filled save is filled in too.
    const H = fresh();
    delete H.s.soul.mind.strain; delete H.s.soul.n; delete H.s.soul.lean.joker;
    const H2 = new Life(JSON.parse(JSON.stringify(H.s)));
    check(H2.s.soul.mind.strain === 0 && H2.s.soul.n.vol === 0 && H2.s.soul.lean.joker === 0, 'and so is a half-filled one');
  }

  // ---- traits come from what you do, and go again ----
  {
    const L = fresh({ seed: 11 });
    L.s.cash = 200000;
    let at = null;
    for (let q = 0; q < 40 && at === null; q++) {
      L.s.time = 6;
      for (let i = 0; i < 3; i++) L.act('library');
      turn(L);
      if (L.soulHas('bookish')) at = q;
    }
    check(at !== null && at >= 4 && at <= 16, `three study sessions a season make you bookish in a year or few (after ${at} seasons)`);
    check(L.s.log.some((e) => /call you bookish/.test(e.t)), 'and the journal notices');
    // A little more is learned.
    const A = fresh({ seed: 3 }), B = fresh({ seed: 3 });
    A.s.soul.has.bookish = 0;
    A.s.time = B.s.time = 6;
    A.act('library'); B.act('library');
    check(A.s.st.smarts > B.s.st.smarts, 'the bookish learn a little more from a book');
    // Stop, and it fades.
    let gone = null;
    for (let q = 0; q < 40 && gone === null; q++) { L.s.time = 6; L.act('rest'); turn(L); if (!L.soulHas('bookish')) gone = q; }
    check(gone !== null && gone >= 4, `stop reading and in time it fades (after ${gone} seasons)`);
    check(L.s.soul.ever.bookish != null, 'though it is remembered');
  }
  {
    // One a season is not enough.
    const L = fresh({ seed: 12 });
    for (let q = 0; q < 40; q++) { L.s.time = 6; L.act('library'); turn(L); }
    check(!L.soulHas('bookish') && L.soulShaping().includes('bookish'), 'one book a season is a leaning, not a trait');
  }
  {
    // Never more than three, and never two that pull against each other.
    const L = fresh({ seed: 13 });
    L.s.cash = 500000;
    let most = 0, both = false;
    for (let q = 0; q < 60; q++) {
      L.s.time = 8;
      for (const id of ['library', 'jog', 'cook', 'volunteer', 'rest', 'workout', 'readingRoom']) L.act(id);
      for (const t of IDS) L.s.soul.lean[t] = Math.min(100, L.s.soul.lean[t] + (q % 7 === 0 ? 30 : 0));
      turn(L);
      most = Math.max(most, Object.keys(L.s.soul.has).length);
      if ((L.soulHas('thrifty') && L.soulHas('spender')) || (L.soulHas('homebody') && L.soulHas('nightowl')) || (L.soulHas('grafter') && L.soulHas('idler')) || (L.soulHas('charmer') && L.soulHas('loner'))) both = true;
    }
    check(most === 3, `at most three traits at once (${most})`);
    check(!both, 'never two that pull against each other');
    check(L.s.ach.soulCharacter, 'three at once earns a trophy');
  }

  // ---- what traits do ----
  {
    const L = fresh({ seed: 14 });
    const t0 = L.timeMax(), m0 = L.moodBase(), luck0 = L.luck();
    L.s.soul.has.nightowl = 0; L.s.t = 3;
    check(L.timeMax() === t0 + 1, 'a night owl has an extra block in winter');
    L.s.t = 1;
    check(L.timeMax() === t0, 'but not in summer');
    L.s.soul.has = { daredevil: 0 };
    check(Math.abs(L.luck() - luck0 - 0.03) < 1e-9, 'a daredevil’s chances are a little better');
    L.s.soul.has = { idler: 0, homebody: 0 };
    check(L.moodBase() > m0, 'an idler and a homebody are easily pleased');
    L.s.soul.has = { thrifty: 0 };
    check(L.income().some(([w, n]) => w === 'Careful housekeeping' && n > 0 && n < 200), 'the thrifty save a little on food and bills');
    L.s.soul.has = { spender: 0 };
    check(L.bills().some(([w, n]) => w === 'Little luxuries' && n === 250), 'big spenders pay for little luxuries');
    // Charm works on people.
    const A = fresh({ seed: 15 }), B = fresh({ seed: 15 });
    const pa = A.meet({ bond: 30 }), pb = B.meet({ bond: 30 });
    A.s.soul.has.charmer = 0;
    A.s.time = B.s.time = 6;
    A.act('out', { p: pa.id, a: 'coffee' }); B.act('out', { p: pb.id, a: 'coffee' });
    check(pa.bond > pb.bond, 'people take to a charmer faster');
    // A grafter is noticed.
    const G = fresh({ seed: 16 }), N = fresh({ seed: 16 });
    G.act('apply', 'retail'); N.act('apply', 'retail');
    G.s.soul.has.grafter = 0;
    G.s.time = N.s.time = 6;
    G.act('work'); N.act('work');
    check(G.s.job.perf > N.s.job.perf, 'the boss notices a grafter');
    // Trait-only choices show only for those who have the trait.
    const C = fresh({ seed: 17 });
    C.s.age = 25;
    C.queue('soulQuiz');
    const plain = C.event().opts.length;
    C.s.soul.has.bookish = 0;
    check(C.event().opts.length === plain + 1 && C.event().opts.some((o) => o.t.startsWith('📚')), 'the bookish get another answer to a quiz team one short');
  }

  // ---- St Brigid's ----
  {
    const L = fresh({ seed: 21 });
    L.s.time = 8;
    const k0 = L.s.karma;
    check(L.act('soulService').ok && !L.act('soulService').ok, 'one Sunday service a season');
    check(L.act('soulSoup').ok && !L.act('soulSoup').ok && L.s.karma > k0, 'the soup run, once a season, is good for your name');
    check(L.act('soulVisit').ok && L.act('soulJumble').ok && L.s.soul.roof > 0, 'visiting and the jumble sale');
    check(L.s.soul.n.vol === 3 && L.s.soul.parish > 0, 'the parish notices');
    check(!L.can('soulCarols') === false || L.season === 3, 'carols only at Christmas');
    L.s.t = 3; L.s.time = 6;
    check(L.can('soulCarols') === null && L.act('soulCarols').ok, 'carols by candlelight in winter');
    L.s.t = 2; L.s.time = 6;
    check(L.act('soulSupper').ok && !L.act('soulSupper').ok, 'the harvest supper in autumn, once');
    check(L.can('soulBells', 2) && L.can('soulBells', 'x'), 'a bell practice wants a sensible score');
    check(L.act('soulBells').ok, 'a bell practice works without one');
    // Volunteering is good for the mood and your name, never for money.
    const M = fresh({ seed: 22 });
    const cash0 = M.s.cash + M.s.bank;
    for (let q = 0; q < 12; q++) { M.s.time = 8; for (const id of ['soulService', 'soulSoup', 'soulVisit', 'soulJumble', 'soulVicar', 'soulBells']) M.act(id); turn(M); }
    const spent = 12 * 0, made = M.s.cash + M.s.bank - cash0;
    check(made <= spent + 1, 'the church brings no money in');
    check(M.s.soul.n.vol === 36, 'once a season each, and no more');
    // The roof.
    const R = fresh({ seed: 23 });
    R.s.cash = 100000;
    for (let q = 0; q < 40 && !R.soulRoofDone(); q++) { R.s.time = 6; R.act('soulRoofGive'); R.act('soulJumble'); turn(R); }
    check(R.soulRoofDone() && R.s.ach.soulRoof && R.s.soul.roof >= ROOF, 'the roof gets mended in the end');
    check(R.can('soulRoofGive') && R.can('soulJumble') === null, 'and the bucket goes away, but the jumble carries on');
    // The bells.
    const B = fresh({ seed: 24 });
    for (let q = 0; q < 6; q++) { B.s.time = 6; B.act('soulBells', 1); turn(B); }
    check(B.soulRinger() && B.s.ach.soulPeal, 'ring well a few times and you are in the band, with a clean peal');
  }

  // ---- a church wedding ----
  {
    const L = fresh({ seed: 31 });
    L.s.cash = 20000;
    L.rentHome = null;
    const p = L.meet({ bond: 90, single: true });
    Object.assign(p, { kind: 'partner', eng: true });
    turn(L, {});
    // (turn answered whatever came up: look at the pending list instead, one season on.)
    const Q = fresh({ seed: 32 });
    Q.s.cash = 20000;
    const q = Q.meet({ bond: 90, single: true });
    Object.assign(q, { kind: 'partner', eng: true });
    Q.s.time = 0;
    Q.endSeason();
    const ids = Q.s.pend.map((e) => e.id);
    check(ids.indexOf('soulBanns') >= 0 && ids.indexOf('soulBanns') === ids.indexOf('wedding') - 1, 'the Reverend asks before the wedding');
    while (Q.event() && Q.event().id !== 'soulBanns') Q.choose(Q.event().opts.findIndex((o) => !o.why));
    Q.choose(0);
    check(q.kind === 'spouse' && Q.s.f.wed && Q.s.soul.f.wed && Q.s.ach.soulWed, 'and a church wedding is a wedding');
    check(!Q.event() || Q.event().id !== 'wedding', 'with no second wedding after it');
    check(Q.s.log.some((e) => /at St Brigid’s/.test(e.t)), 'and the journal says where');
    // Saying no leaves the usual wedding.
    const N = fresh({ seed: 33 });
    const r = N.meet({ bond: 90, single: true });
    Object.assign(r, { kind: 'partner', eng: true });
    N.s.time = 0; N.endSeason();
    while (N.event() && N.event().id !== 'soulBanns') N.choose(N.event().opts.findIndex((o) => !o.why));
    N.choose(N.event().opts.length - 1);
    check(N.event() && N.event().id === 'wedding', 'turn her down and the wedding goes on as planned');
  }

  // ---- a christening ----
  {
    const L = fresh({ seed: 34 });
    L.s.cash = 5000;
    L.queue('baby', { names: ['Ada', 'Bea'], sex: 'f', adopt: false, age: 0 });
    L.choose(0);
    check(L.event() && L.event().id === 'soulChristen', 'a new baby is followed by the offer of a christening');
    const kid = L.kids()[0], b = kid.bond;
    L.choose(0);
    check(kid.bond > b && L.s.soul.days.some((d) => d.k === 'christening'), 'and a christening is a day to remember');
  }

  // ---- a funeral, and a grave ----
  {
    const L = fresh({ seed: 35 });
    const mum = L.s.people.find((p) => p.kind === 'parent');
    mum.age = 90;
    L.queue('parentDies', mum.id);
    L.s.time = 0; L.endSeason();
    while (L.event() && L.event().id !== 'parentDies') L.choose(L.event().opts.findIndex((o) => !o.why));
    L.choose(0);
    check(L.s.soul.graves.length === 1 && L.s.soul.graves[0].name === mum.name, 'a parent who dies is buried at St Brigid’s');
    const g1 = L.s.soul.grief, m1 = L.moodBase();
    L.s.soul.grief = 0;
    check(g1 > 0 && m1 < L.moodBase(), 'and grief weighs on you');
    L.s.soul.grief = g1;
    check(L.event() && L.event().id === 'soulFuneral', 'the funeral follows, with a eulogy to give');
    const g0 = L.s.soul.grief;
    L.choose(1);
    check(L.s.soul.graves[0].said === 'plain' && L.s.soul.grief < g0, 'and what you say eases it');
    L.s.time = 6;
    check(L.act('soulGrave', 0).ok && !L.act('soulGrave', 0).ok, 'you can visit the grave, once a season');
    check(L.can('soulGrave', 5) && L.can('soulGrave', 'x'), 'but only a grave that is there');
    for (let q = 0; q < 12; q++) turn(L);
    check(L.s.soul.grief === 0, 'and in time grief passes');
    check(L.epitaph().join(' ').length > 0, 'and the obituary is still fine');
    // Old friends.
    const F = fresh({ seed: 36 });
    const f = F.meet({ bond: 60, age: 90 });
    F.queue('soulFriendGone', f.id);
    F.choose(0);
    check(!F.person(f.id) && F.s.soul.graves.length === 1 && F.event() && F.event().id === 'soulFuneral', 'an old friend who dies has a funeral too');
    // Inside, there is no funeral to go to, but there is still a grave.
    const G = fresh({ seed: 37 });
    const dad = G.s.people.find((p) => p.kind === 'parent');
    G.s.soul.dying = { [dad.id]: { name: dad.name, kind: 'parent', sex: dad.sex, age: 80, bond: 60 } };
    G.s.gaol = { left: 2, served: 0, total: 2, good: 50, rep: 30, crime: 'test' };
    G.queue('parentDies', dad.id);
    const ev = G.event();
    if (ev) G.choose(0);
    check(G.s.soul.graves.length === (ev ? 1 : 0) && !G.s.pend.some((e) => e.id === 'soulFuneral'), 'a funeral is missed from a cell');
  }

  // ---- the mind ----
  {
    const L = fresh({ seed: 41 });
    const t0 = L.timeMax();
    let spell = null;
    for (let q = 0; q < 12 && !spell; q++) { L.s.happy = 10; L.s.time = 0; L.endSeason(); L.s.happy = 10; spell = L.soulSpell(); clear(L); }
    check(spell && spell.k === 'low', 'a long run of very low spirits can become a low spell');
    check(L.timeMax() === t0 - 1, 'which takes a block of time a season');
    check(L.s.log.some((e) => /low spell/.test(e.t)), 'and is noted, plainly');
    // Help makes it lift sooner than time alone.
    const A = new Life(JSON.parse(JSON.stringify(L.s))), B = new Life(JSON.parse(JSON.stringify(L.s)));
    let a = 0, b = 0;
    for (; a < 20 && A.soulSpell(); a++) {
      A.s.time = 6; A.s.cash = 5000;
      const f = A.s.people.find((p) => ['parent', 'sibling', 'friend'].includes(p.kind));
      A.act('soulVicar'); A.act('jog'); A.act('therapy'); if (f) A.act('out', { p: f.id, a: 'walk' });
      A.s.time = 0; A.endSeason(); A.s.pend = A.s.pend.filter((e) => e.id === 'soulLift'); clear(A);
    }
    for (; b < 20 && B.soulSpell(); b++) { B.s.time = 0; B.endSeason(); B.s.pend = B.s.pend.filter((e) => e.id === 'soulLift'); clear(B); }
    check(!A.soulSpell() && !B.soulSpell(), 'a low spell lifts, in the end, even on its own');
    check(a >= 2 && a < b, `help lifts it sooner (${a} seasons with help, ${b} without)`);
    check(A.s.ach.soulThrough && A.s.soul.n.through === 1, 'coming through it is a trophy');
    check(A.timeMax() === t0 || A.timeMax() === t0 + (A.soulHas('nightowl') && A.season === 3 ? 1 : 0), 'and the time comes back');
    // And it does not come straight back.
    A.s.happy = 10;
    for (let q = 0; q < 4; q++) { A.s.happy = 10; turn(A); }
    check(!A.soulSpell(), 'nor straight back again');
  }
  {
    // Burnout: working flat out, season after season.
    const L = fresh({ seed: 42 });
    L.act('apply', 'retail');
    L.s.happy = 45;
    let spell = null, q = 0;
    for (; q < 24 && !spell; q++) {
      L.s.time = L.timeMax();
      while (L.s.time >= 2 && L.act(L.playDue() ? 'workPlay' : 'work').ok);
      L.s.happy = 45; L.s.health = 90;
      L.endSeason(); clear(L);
      spell = L.soulSpell();
    }
    check(spell && spell.k === 'burn', `a long run of overwork ends in burnout (after ${q} seasons)`);
    // Easing off mends it.
    let r = 0;
    for (; r < 20 && L.soulSpell(); r++) { L.s.time = L.timeMax(); L.act('work'); L.act('rest'); L.s.time = 0; L.endSeason(); L.s.pend = L.s.pend.filter((e) => e.id === 'soulLift'); clear(L); }
    check(!L.soulSpell() && r <= 14, `and easing off mends it (${r} seasons)`);
    // A sensible week does not.
    const S = fresh({ seed: 43 });
    S.act('apply', 'retail');
    for (let k = 0; k < 40; k++) { S.s.time = S.timeMax(); S.act('work'); S.act('work'); S.s.happy = 45; S.s.time = 0; S.endSeason(); clear(S); }
    check(!S.soulSpell() && S.s.soul.mind.strain < 14, 'two shifts a season never burns anyone out');
  }

  // ---- the obituary ----
  {
    const L = fresh({ seed: 51 });
    L.s.soul.has = { joker: 1, kind: 2 };
    L.s.soul.lean.joker = 80; L.s.soul.lean.kind = 70;
    L.s.soul.n.vol = 30; L.s.soul.n.through = 1;
    L.die('old age');
    const t = L.epitaph();
    check(t.some((x) => x === 'He was a joker and kind-hearted.'), 'the Gazette says what you were like');
    check(t.some((x) => /could make a room laugh/.test(x)) && t.some((x) => /soup run/.test(x)) && t.some((x) => /grey seasons/.test(x)), 'and what you were known for');
    check(t.every((x) => /\.$/.test(x) && !/undefined|NaN|\s\s|\.\./.test(x)), 'in proper sentences');
    const O = fresh({ seed: 52 });
    O.s.soul.ever = { sporty: 3, loner: 9 };
    check(O.epitaph().some((x) => x === 'In his younger days he had been sporty and a private soul.'), 'and remembers what you were once');
  }

  // ---- every card can be answered ----
  {
    for (const e of EVENTS.filter((q) => q.id.startsWith('soul'))) {
      check(e.opts.some((o) => !o.show && !o.cost && !o.check && !o.odds), `card ${e.id}: always has a free, sure choice`);
      if (e.w) check(e.cd >= 8, `card ${e.id}: does not come round too often`);
    }
    // Each random card, with every trait, plays out.
    const L = fresh({ seed: 61 });
    L.s.cash = 50000; L.act('apply', 'retail');
    const p = L.meet({ bond: 60 }); Object.assign(p, { kind: 'spouse', live: true });
    L.s.soul.has = Object.fromEntries(IDS.map((id) => [id, 0]));
    L.s.soul.mind.spell = { k: 'low', at: 0, depth: 8, by: {} };
    let ok = true;
    for (const e of EVENTS.filter((q) => q.id.startsWith('soul'))) {
      const x = e.id === 'soulFuneral' ? { name: 'Jo Finch', kind: 'spouse', sex: 'f', age: 80, bond: 50, g: 0 } : e.id === 'soulLift' ? { k: 'low', top: 'talk' } : ['soulBanns', 'soulConfide', 'soulChristen', 'soulFriendGone'].includes(e.id) ? null : null;
      const opts = e.opts.length;
      for (let i = 0; i < opts; i++) {
        const M = new Life(JSON.parse(JSON.stringify(L.s)));
        let arg = x;
        if (e.id === 'soulBanns') { const q = M.meet({ bond: 80 }); M.s.people = M.s.people.filter((r) => r.kind !== 'spouse'); Object.assign(q, { kind: 'partner', eng: true }); arg = q.id; }
        if (e.id === 'soulChristen') { M.s.people.push(M.makePerson({ name: 'Kit', kind: 'child', age: 0, bond: 60 })); arg = M.s.people[M.s.people.length - 1].id; }
        if (e.id === 'soulConfide' || e.id === 'soulFriendGone') { arg = M.meet({ bond: 60, age: 80 }).id; }
        M.s.soul.graves = [{ name: 'Jo Finch', kind: 'spouse', sex: 'f', age: 80, t: 0, said: null, visits: 0 }];
        M.queue(e.id, arg);
        const ev = M.event();
        if (!ev || ev.id !== e.id) continue;
        if (i >= ev.opts.length || ev.opts[i].why) continue;
        try { const r = M.choose(i); if (!r.ok || typeof r.text !== 'string') ok = false; } catch (err) { ok = false; console.log(e.id, i, err); }
      }
    }
    check(ok, 'every choice on every card plays out, with every trait');
  }
}

// For the random practice players: the noticeboard's jobs, the graves, and the bells.
export function moves(L) {
  // (One job off the noticeboard at a time, as if it were one row on a place's list: offering
  // all four every time made the random players far busier at St Brigid's than anywhere else.)
  const out = [[L.pick(['soulSoup', 'soulVisit', 'soulJumble', 'soulRoofGive'])], ['soulBells', Math.round(L.rnd() * 100) / 100]];
  const g = L.s.soul ? L.s.soul.graves : [];
  if (g.length) out.push(['soulGrave', Math.floor(L.rnd() * g.length)]);
  return out;
}
