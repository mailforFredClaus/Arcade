// People who want things: the partner's ambitions, anniversaries, rough
// patches and the rest; children growing up; ageing parents; friends who
// ask (wants.js, wants-partner.js, wants-family.js).
import { WANT_CARDS } from '../../games/new-in-town/js/wants.js';
import { AMBITIONS, CARE } from '../../games/new-in-town/js/wants-lib.js';
import { TROPHIES } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';

const IDS = WANT_CARDS.map((e) => e.id);
const BAD = /undefined|NaN|\[object|\s\s|(?<!\.)\.\.(?!\.)/;

// Answers whatever is waiting (the first choice that can be taken, or one picked by prefer).
function clear(L, prefer = {}, seen = null) {
  let ev, n = 0;
  while ((ev = L.event()) && n++ < 30) {
    let i = prefer[ev.id] != null ? prefer[ev.id] : ev.opts.findIndex((o) => !o.why);
    if (typeof i === 'function') i = i(ev, L);
    if (seen) seen.push(ev.id);
    L.choose(i);
  }
}
// A season gone by with nothing much done, only this part's cards (and the
// family's own: births, deaths, funerals) answered.
const KEEP = /^(wants|kid18|grandchild|parentDies|spouseDies|soulFuneral|baby)/;
function turn(L, prefer, seen) { L.s.time = 0; L.endSeason(); L.s.pend = L.s.pend.filter((e) => KEEP.test(e.id)); clear(L, prefer, seen); }
const sane = (L) => {
  const s = L.s;
  return [s.cash, s.bank, s.debt, s.happy, s.health, s.time].every((v) => Number.isFinite(v) && v >= 0) && s.people.every((p) => p.bond >= 0 && p.bond <= 100) && Number.isFinite(L.netWorth());
};

// A whole family at forty: a husband, children of every age, a grandchild, both parents, three friends.
function family(fresh, seed = 5) {
  const L = fresh({ seed, sex: 'f', into: 'm', name: 'Nora Test' });
  const s = L.s;
  s.cash = 400000; s.home = 'manor'; s.age = 40; s.t = 88;
  const sp = L.makePerson({ kind: 'spouse', bond: 72, age: 41, sex: 'm', live: true, single: false, trait: 'kind', job: 'retail' });
  sp.wish = true;
  s.people.push(sp);
  const F = { sp: sp.id, kid: {} };
  for (const age of [1, 4, 9, 14, 15, 16, 17, 20, 26]) { const k = L.makePerson({ kind: 'child', bond: 60, age, single: false }); s.people.push(k); F.kid[age] = k.id; }
  const g = L.makePerson({ kind: 'grandchild', bond: 40, age: 0, single: false, of: F.kid[26] });
  s.people.push(g); F.grand = g.id;
  const ps = s.people.filter((p) => p.kind === 'parent');
  ps[0].age = 78; ps[1].age = 80; ps[0].bond = 60; ps[1].bond = 60;
  F.mum = ps.find((p) => p.sex === 'f').id; F.dad = ps.find((p) => p.sex === 'm').id;
  F.pal = [0, 1, 2].map(() => { const f = L.makePerson({ kind: 'friend', bond: 70 }); s.people.push(f); return f.id; });
  const r = L.wantsRec(sp) || (s.wants.p[sp.id] = { been: [] });
  Object.assign(r, { since: 40, wed: 44, band: 'The Undertow', inst: 'the bass', boat: 'Curlew', shop: { a: 'a bakery', sign: 'Crumbs', job: 'kitchen' } });
  return { L, F };
}

export default function ({ check, fresh, Life, ACTIONS }) {
  // ---- the lists hang together ----
  check(IDS.length >= 60 && IDS.every((id) => id.startsWith('wants')), `sixty or so cards, all of them this part's (${IDS.length})`);
  check(new Set(IDS).size === IDS.length && IDS.every((id) => EVENTS.some((e) => e.id === id)), 'each card once, and every one in the deck');
  for (const e of WANT_CARDS) {
    check(e.icon && e.title && e.text && e.opts.length >= 1 && !e.w, `${e.id}: a card that is brought up, never drawn at random`);
    check(e.opts.every((o) => o.t && typeof o.run === 'function'), `${e.id}: every choice says something and does something`);
    check(typeof e.ok === 'function', `${e.id}: knows when it has gone stale`);
  }
  for (const [id, a] of Object.entries(AMBITIONS)) check(a.cards.every((c) => IDS.includes(c)) && a.hope.length === a.cards.length - (id === 'garden' ? 0 : 0), `ambition ${id}: its chain of cards exists`);
  for (const id of ['wantsBehind', 'wantsSilver', 'wantsGolden', 'wantsProud', 'wantsPromise', 'wantsCared', 'wantsSpeech', 'wantsAngel']) check(TROPHIES[id] && typeof TROPHIES[id].test === 'function', `trophy ${id}`);
  check(!Object.keys(ACTIONS).some((id) => id.startsWith('wants')), 'no new buttons: all of it comes as cards');

  // ---- an old save ----
  {
    const { L } = family(fresh);
    delete L.s.wants;
    const R = new Life(JSON.parse(JSON.stringify(L.s)));
    check(R.s.wants && R.s.wants.loans.length === 0 && R.s.wants.n.amb === 0, 'a life saved before this part of town picks it up');
    let ok = true;
    try { for (let i = 0; i < 12; i++) turn(R); } catch (e) { ok = false; console.log(e); }
    check(ok && sane(R), 'and seasons go by');
    const H = fresh();
    delete H.s.wants.n; delete H.s.wants.tales;
    const H2 = new Life(JSON.parse(JSON.stringify(H.s)));
    check(H2.s.wants.n.grad === 0 && Array.isArray(H2.s.wants.tales), 'and so is a half-filled one');
    // A marriage from before: the anniversary is worked out from the journal.
    const M = fresh({ seed: 4 });
    const p = M.makePerson({ kind: 'spouse', bond: 70, age: 30, live: true, single: false });
    M.s.people.push(p); M.s.age = 30; M.s.t = 48; M.s.home = 'flat';
    M.s.log.push({ a: 26, q: 1, t: `Married ${p.name}.`, k: 'love' });
    delete M.s.wants;
    const M2 = new Life(JSON.parse(JSON.stringify(M.s)));
    turn(M2);
    check(M2.wantsRec(M2.partner()).wed === 33, `a marriage from before is dated from the journal (${M2.wantsRec(M2.partner()).wed})`);
  }

  // ---- every choice on every card can be taken, and reads properly ----
  {
    const { L, F } = family(fresh);
    L.s.soul.has = { romantic: 0, joker: 0, kind: 0, hothead: 0, bookish: 0 };
    const base = JSON.stringify(L.s);
    const t = L.s.t;
    const sp = (C) => C.person(F.sp), R = (C, id) => C.s.wants.p[id] || (C.s.wants.p[id] = { been: [] });
    const amb = (id, st, more = {}) => (C) => { R(C, F.sp).am = [{ id, st, at: t, sup: 3, out: null, ...more }]; return { p: F.sp, a: id }; };
    const kid = (age, more = {}) => (C) => { Object.assign(R(C, F.kid[age]), more); return { p: F.kid[age] }; };
    const noKids = (C) => { C.s.people = C.s.people.filter((p) => p.kind !== 'child' && p.kind !== 'grandchild'); };
    const inl = (more = {}) => (C) => { R(C, F.sp).inl = { mum: 'Pat Hill', dad: 'Roy Hill', age: 74, left: 2, last: null, w: 55, help: 0, ...more }; return { p: F.sp }; };
    const pal = (i, more = {}) => (C) => { Object.assign(R(C, F.pal[i]), more); return { p: F.pal[i] }; };
    const SET = {
      wantsBand1: [amb('band', 0)], wantsBand2: [amb('band', 1), (C) => { noKids(C); return amb('band', 1)(C); }],
      wantsBand3: [amb('band', 2, { win: true }), amb('band', 2, { win: false })],
      wantsCity1: [amb('city', 0), (C) => { sp(C).bond = 40; return amb('city', 0)(C); }],
      wantsCity2: [amb('city', 1)], wantsCity3: [amb('city', 2, { win: true }), amb('city', 2, { win: false })],
      wantsStudy1: [amb('study', 0)], wantsStudy2: [amb('study', 1)], wantsStudy3: [amb('study', 2)],
      wantsShop1: [amb('shop', 0)], wantsShop2: [(C) => { R(C, F.sp).biz = { hp: 30, stake: 5000 }; return amb('shop', 1)(C); }],
      wantsShop3: [(C) => { R(C, F.sp).biz = { hp: 70, stake: 5000 }; return amb('shop', 2)(C); }, (C) => { R(C, F.sp).biz = { hp: 20, stake: 5000 }; return amb('shop', 2)(C); }],
      wantsSail1: [amb('sail', 0), (C) => { C.s.items.boat = 1; return amb('sail', 0)(C); }],
      wantsSail2: [amb('sail', 1)], wantsSail3: [amb('sail', 2), (C) => { noKids(C); return amb('sail', 2)(C); }],
      wantsSailHome: [(C) => { R(C, F.sp).away = t; return amb('sail', 3)(C); }],
      wantsGarden1: [amb('garden', 0), (C) => { C.s.home = 'flat'; C.s.owned = false; C.s.people = C.s.people.filter((p) => !(p.kind === 'child' && p.age < 18)); C.s.plot = { beds: [null, null, null], since: t }; return amb('garden', 0)(C); }],
      wantsGarden2: [(C) => { R(C, F.sp).grew = 1; return amb('garden', 1)(C); }, (C) => { C.s.home = 'flat'; C.s.owned = false; return amb('garden', 1)(C); }],
      wantsRoad: [(C) => { R(C, F.sp).am = [{ id: 'city', st: 1, out: 'held', end: t - 20 }]; return { p: F.sp, a: 'city' }; }],
      wantsBaby: [(C) => { noKids(C); return { p: F.sp }; }, (C) => { noKids(C); sp(C).sex = 'f'; return { p: F.sp }; }, (C) => { noKids(C); sp(C).bond = 20; return { p: F.sp }; }],
      wantsNoBaby: [(C) => { sp(C).wish = false; return { p: F.sp }; }, (C) => { sp(C).wish = false; sp(C).kind = 'partner'; return { p: F.sp }; }],
      wantsAnniv: [() => ({ p: F.sp, y: 25 }), () => ({ p: F.sp, y: 3 })], wantsForgot: [() => ({ p: F.sp, y: 10 })],
      wantsRough: [(C) => { R(C, F.sp).sore = 4; return { p: F.sp }; }, (C) => { sp(C).bond = 30; return { p: F.sp }; }],
      wantsRoughUp: [(C) => { R(C, F.sp).patch = { at: t - 2, n: 3 }; return { p: F.sp }; }],
      wantsRoughDown: [(C) => { R(C, F.sp).patch = { at: t - 6, n: 0 }; return { p: F.sp }; }],
      wantsEye: [(C) => { Object.assign(R(C, F.sp), { eye: 1, eyeName: 'Rob' }); return { p: F.sp }; }, (C) => { Object.assign(R(C, F.sp), { eye: 1, eyeName: 'Rob' }); sp(C).bond = 40; return { p: F.sp }; }],
      wantsFound: [(C) => { Object.assign(R(C, F.sp), { eye: 2, eyeName: 'Rob' }); return { p: F.sp }; }, (C) => { Object.assign(R(C, F.sp), { eye: 2, eyeName: 'Rob' }); sp(C).kind = 'partner'; return { p: F.sp }; }],
      wantsInlawsKids: [inl()], wantsInlawsRuby: [inl()], wantsInlawsIll: [inl(), inl({ left: 1, last: 'Pat Hill' })],
      wantsInlawsGone: [(C) => { inl({ left: 0 })(C); return { p: F.sp, mum: true, name: 'Pat Hill', age: 88 }; }, (C) => { inl({ left: 1, last: 'Pat Hill' })(C); return { p: F.sp, mum: false, name: 'Roy Hill', age: 86 }; }],
      wantsIll: [(C) => { R(C, F.sp).ill = { on: 1, at: t, until: t + 3, what: 'a new hip' }; return { p: F.sp }; }],
      wantsWell: [() => ({ p: F.sp, what: 'a new hip' })], wantsFading: [() => ({ p: F.sp })],
      wantsNursery: [kid(1), (C) => { C.person(F.mum).bond = 20; C.person(F.dad).bond = 20; return { p: F.kid[1] }; }],
      wantsSchool: [kid(4)], wantsBully: [kid(9)], wantsCrowd: [kid(14)],
      wantsNick: [kid(15), (C) => { C.s.n.crimes = 5; return { p: F.kid[15] }; }],
      wantsMocks: [kid(15)], wantsResults: [kid(16, { ex: 3, bribe: 1 }), kid(16, { ex: 0 })],
      wantsCar: [kid(17)], wantsNext: [kid(17, { ex: 2 }), kid(17, { ex: 0, sal: 2 })],
      wantsEighteen: [kid(17, { path: 'app-trades' }), kid(17, { path: 'gap' }), kid(17, { path: 'crew', sal: 2 }), kid(17, { path: 'work' })],
      wantsGrad: [kid(20, { path: 'uni', paid: 1 }), kid(20, { path: 'app-sea' })],
      wantsLeave: [kid(20)], wantsBack: [kid(26)], wantsBackOut: [kid(26, { back: t })], wantsChildWed: [kid(26, { fiance: 'Sam' })],
      wantsMinding: [() => ({ p: F.grand })],
      wantsFrail: [(C) => { R(C, F.mum).need = 1; return { p: F.mum }; }, (C) => { R(C, F.mum).need = 2; const q = C.makePerson({ kind: 'sibling', bond: 70, age: 38 }); C.s.people.push(q); return { p: F.mum }; }, (C) => { C.s.home = 'bedsit'; R(C, F.mum).need = 1; return { p: F.mum, why: 'room' }; }],
      wantsLastTalk: [() => ({ p: F.dad }), (C) => { C.person(F.dad).bond = 30; return { p: F.dad }; }],
      wantsSuitor: [() => ({ p: F.mum, him: true, name: 'Clive', was: 'postman' })], wantsParentMoney: [() => ({ p: F.dad, n: 1500 })],
      wantsLoan: [() => ({ p: F.pal[0], n: 1500, why: 'The boiler has died, and it is February.' })],
      wantsLoanDue: [(C) => { C.s.wants.loans = [{ p: F.pal[0], n: 1500, due: t, back: true }]; return { p: F.pal[0] }; }, (C) => { C.s.wants.loans = [{ p: F.pal[0], n: 1500, due: t, back: false }]; return { p: F.pal[0] }; }],
      wantsVenture: [() => ({ p: F.pal[1], n: 5000, what: 'a café on Harbour Row', name: 'the café' })],
      wantsVenWinter: [(C) => { C.s.wants.ven = { p: F.pal[1], name: 'the café', stake: 5000, hp: 60, age: 4, st: 0, got: 0, wait: 0, mult: 0 }; return { p: F.pal[1] }; }, (C) => { C.s.wants.ven = { p: F.pal[1], name: 'the café', stake: 5000, hp: 30, age: 4, st: 0, got: 0, wait: 0, mult: 0 }; return { p: F.pal[1] }; }],
      wantsVenEnd: [(C) => { C.s.wants.ven = { p: F.pal[1], name: 'the café', stake: 5000, hp: 0, age: 9, st: 1, got: 600, wait: 0, mult: 0 }; return { p: F.pal[1] }; }, (C) => { C.s.wants.ven = { p: F.pal[1], name: 'the café', stake: 5000, hp: 80, age: 14, st: 1, got: 1200, wait: 0, mult: 2.3 }; return { p: F.pal[1] }; }],
      wantsBest: [() => ({ p: F.pal[2], name: 'Jo' })], wantsSpeech: [pal(2, { best: 1 })],
      wantsMoving: [pal(0)], wantsSaid: [() => ({ p: F.pal[0], thing: 'haircut' })], wantsMend: [pal(0, { fell: t - 10 })],
      wantsNight: [() => ({ p: F.pal[1], why: 'There has been some news from the hospital.' })], wantsTurn: [pal(1, { owe: 2 })],
    };
    for (const id of IDS) check(SET[id], `${id}: has a setting to try it in`);
    let tried = 0;
    for (const [id, vs] of Object.entries(SET)) {
      for (const [v, setup] of vs.entries()) {
        const probe = new Life(JSON.parse(base));
        probe.s.pend = [{ id, x: setup(probe) }];
        const ev = probe.event();
        if (!check(ev && ev.id === id, `${id} (${v}): shows when it should`) && !ev) continue;
        check(!BAD.test(`${ev.title} ${ev.text}`), `${id} (${v}): reads properly: ${ev.text}`);
        check(ev.opts.some((o) => !o.why), `${id} (${v}): always has a choice that can be taken`);
        ev.opts.forEach((o, i) => {
          if (o.why) return;
          const C = new Life(JSON.parse(base));
          C.s.pend = [{ id, x: setup(C) }];
          let r = null;
          try { r = C.choose(i); } catch (e) { check(false, `${id} (${v}) option ${i} throws: ${e.message}`); return; }
          tried++;
          check(r.ok && typeof r.text === 'string' && r.text.length > 10 && !BAD.test(r.text), `${id} (${v}) "${o.t}": ${r.ok ? r.text : r.why}`);
          check(!BAD.test(o.t), `${id} (${v}): choice ${i} reads properly: ${o.t}`);
          check(sane(C), `${id} (${v}) "${o.t}": the numbers stay sensible`);
        });
      }
    }
    check(tried >= 220, `every choice on every card tried (${tried})`);
  }

  // ---- the partner's dreams: a chain over the years ----
  {
    const { L, F } = family(fresh, 9);
    const r = L.wantsRec(L.person(F.sp));
    r.am = [{ id: 'study', st: 0, at: L.s.t + 1, sup: 0, out: null }, { id: 'garden', st: 0, at: null, sup: 0, out: null }];
    const seen = [];
    for (let i = 0; i < 40 && r.am[0].out == null; i++) turn(L, { wantsStudy1: 0, wantsStudy2: (ev) => ev.opts.findIndex((o) => /tea/.test(o.t)), wantsStudy3: 0 }, seen);
    check(['wantsStudy1', 'wantsStudy2', 'wantsStudy3'].every((id) => seen.includes(id)), `a degree comes up in three cards over the years (${seen.filter((q) => q.startsWith('wantsStudy')).join(', ')})`);
    check(r.am[0].out === 'won' && L.s.wants.n.amb === 1 && L.s.ach.wantsBehind, 'and seen through, it is a dream come true, and a trophy');
    check(['law', 'teaching', 'medicine', 'politics'].includes(L.person(F.sp).job), `and a better job after it (${L.person(F.sp).job})`);
    check(r.am[1].at != null && r.am[1].at > L.s.t, 'and in time another dream comes along');
    check(L.wantsBeen(L.person(F.sp)).some((b) => /graduate/.test(b.t)), 'and it is remembered on their sheet');
  }

  // ---- held back: sore, then a rough patch, which time together mends ----
  {
    const { L, F } = family(fresh, 12);
    const p = L.person(F.sp), r = L.wantsRec(p);
    r.am = [{ id: 'city', st: 0, at: L.s.t, sup: 0, out: null }, { id: 'sail', st: 0, at: null, sup: 0, out: null }];
    L.s.pend = [{ id: 'wantsCity1', x: { p: p.id, a: 'city' } }];
    L.choose(L.event().opts.findIndex((o) => /turn it down/.test(o.t)));
    check(r.am[0].out === 'held' && r.sore === 2, 'asking them to turn down their dream leaves them sore');
    r.sore = 3;
    check(L.wantsBeats().some((b) => b.id === 'wantsRough'), 'and a sore partner has a rough patch coming');
    L.s.pend = [{ id: 'wantsRough', x: { p: p.id } }];
    L.choose(L.event().opts.findIndex((o) => /Give it time/.test(o.t)));
    check(r.patch && r.patch.n === 0 && L.wantsHope(p).text.includes('rough patch'), 'a rough patch shows on their sheet');
    const mood = L.moodBase();
    delete L.s.wants.p[p.id].patch;
    check(L.moodBase() > mood, 'and weighs on you');
    r.patch = { at: L.s.t, n: 0, c: 0 };
    for (let i = 0; i < 3; i++) {
      L.s.time = 6;
      L.act('out', { p: p.id, a: 'walk' }); L.act('out', { p: p.id, a: 'coffee' });
      check(r.patch.n === i + 1, `time together counts, once a season (${r.patch.n})`);
      L.s.time = 0; L.endSeason(); L.s.pend = [];
    }
    check(L.wantsBeats().some((b) => b.id === 'wantsRoughUp' && b.u), 'and three seasons of it bring you out the other side');
  }

  // ---- anniversaries come in their season ----
  {
    const { L, F } = family(fresh, 2);
    const r = L.wantsRec(L.person(F.sp));
    r.wed = L.s.t + 1 - 40;
    const seen = [];
    turn(L, {}, seen);
    check(seen.includes('wantsAnniv') || seen.includes('wantsForgot'), `the tenth anniversary is not let go by (${seen.join(', ')})`);
    r.wed = L.s.t + 1 - 100;
    turn(L, {}, seen);
    check(L.s.wants.f.silver && L.s.ach.wantsSilver, 'twenty-five years married is a trophy');
  }

  // ---- children grow up: eighteen, and what becomes of them ----
  {
    const { L, F } = family(fresh, 6);
    const app = L.person(F.kid[17]), uni = L.person(F.kid[16]);
    L.wantsRec(app) || (L.s.wants.p[app.id] = { been: [] });
    Object.assign(L.s.wants.p[app.id], { path: 'app-trades', hope: ['a builder', 'trades'] });
    L.s.t = 91; // (the next season is a birthday)
    L.s.time = 0; L.endSeason();
    const ids = L.s.pend.map((e) => e.id);
    check(app.age === 18 && ids.includes('wantsEighteen') && !L.s.pend.some((e) => e.id === 'kid18' && e.x === app.id), 'an apprentice’s eighteenth is about the apprenticeship, not who pays for college');
    check(app.job === 'trades' && L.s.wants.p[app.id].dream && L.s.wants.n.hopes === 1, 'and the apprentice goes into the trade, as promised at six');
    check(L.s.log.some((e) => /just as/.test(e.t)), 'which the journal notices');
    // University: the town's own card asks who pays, and the answer is remembered.
    uni.age = 17;
    L.s.pend = [];
    L.s.t = 95; L.s.time = 0; L.endSeason();
    const k18 = L.s.pend.findIndex((e) => e.id === 'kid18' && e.x === uni.id);
    check(k18 >= 0, 'with nothing decided at seventeen, the town’s own card comes at eighteen');
    L.s.pend = [L.s.pend[k18]];
    L.choose(1);
    check(L.s.wants.p[uni.id].path === 'uni' && L.s.wants.p[uni.id].paid === 1, 'and what it was answered is remembered');
    uni.age = 21;
    check(L.wantsBeats().some((b) => b.id === 'wantsGrad'), 'and three years later there is a graduation');
    L.s.pend = [{ id: 'wantsGrad', x: { p: uni.id } }];
    L.choose(L.event().opts.findIndex((o) => !o.why));
    check(['medicine', 'law', 'tech', 'finance', 'teaching', 'politics'].includes(uni.job) && L.s.wants.n.grad === 1 && L.s.ach.wantsProud, `a graduate goes into work that wants a degree (${uni.job}), and you are proud`);
    // Exams: reading together before them helps.
    const k = L.person(F.kid[15]);
    k.age = 15;
    for (let i = 0; i < 3; i++) { L.s.time = 6; L.act('kid', { p: k.id, a: 'read' }); L.act('kid', { p: k.id, a: 'read' }); L.s.t++; }
    check(L.s.wants.p[k.id].rev === 1.5, `reading together counts towards the exams, once a season (${L.s.wants.p[k.id].rev})`);
  }

  // ---- ageing parents: who looks after them, and what it costs ----
  {
    const { L, F } = family(fresh, 7);
    const mum = L.person(F.mum), r = L.s.wants.p[mum.id] = { been: [], need: 1 };
    const time0 = L.timeMax();
    L.s.pend = [{ id: 'wantsFrail', x: { p: mum.id } }];
    L.choose(L.event().opts.findIndex((o) => /every day/.test(o.t)));
    check(r.care === 'you' && L.timeMax() === time0 - 1, 'looking after a parent yourself takes a block of every season');
    r.care = 'home';
    const bill = L.bills().find(([w]) => w.includes('Seaview'));
    check(bill && bill[1] === Math.round(CARE.home.cost * L.s.idx / 10) * 10, `a care home is a real cost every season (${bill && bill[1]})`);
    L.s.people.push(L.makePerson({ kind: 'sibling', bond: 70, age: 36 }));
    const half = L.bills().find(([w]) => w.includes('Seaview'));
    check(half && half[0].includes('half') && Math.abs(half[1] - bill[1] / 2) <= 1, 'a brother or sister who is close goes halves');
    check(!L.bills(true).some(([w]) => w.includes('Seaview')), 'and nothing is asked of you while you are inside');
    // Moving them in needs room.
    L.s.home = 'bedsit';
    L.s.pend = [{ id: 'wantsFrail', x: { p: mum.id } }];
    const ev = L.event(), opt = ev.opts.find((o) => /Move them in/.test(o.t));
    check(opt && /spare room/.test(opt.why), 'moving a parent in needs a spare room');
    L.s.pend = [];
    L.s.home = 'townhouse';
    L.s.people = L.s.people.filter((p) => !(p.kind === 'child' && p.age < 18));
    r.care = 'with';
    L.s.home = 'bedsit';
    turn(L, { wantsFrail: (e) => e.opts.findIndex((o) => !o.why) });
    check(r.care !== 'with', 'and a parent living with you has to go elsewhere if you move somewhere without room');
    // The last conversation comes before the end.
    const dad = L.person(F.dad);
    dad.age = 130; L.s.t = 95; L.s.pend = [];
    const twin = new Life(JSON.parse(JSON.stringify(L.s)));
    L.s.time = 0; L.endSeason();
    const at = L.s.pend.findIndex((e) => e.id === 'wantsLastTalk'), end = L.s.pend.findIndex((e) => e.id === 'parentDies');
    check(at >= 0 && end > at, 'a parent near the end asks for you first');
    L.s.pend = L.s.pend.filter((e) => KEEP.test(e.id));
    clear(L, { wantsLastTalk: (e) => e.opts.findIndex((o) => /meant to you/.test(o.t)) });
    twin.s.time = 0; twin.endSeason(); twin.s.pend = twin.s.pend.filter((e) => KEEP.test(e.id));
    clear(twin, { wantsLastTalk: (e) => e.opts.findIndex((o) => /time for that/.test(o.t)) });
    check(!L.person(F.dad) && L.s.soul.grief < twin.s.soul.grief, `saying what they meant to you makes the grief easier to carry (${L.s.soul.grief} against ${twin.s.soul.grief})`);
  }

  // ---- friends: money lent comes back no bigger, and a venture is a gamble ----
  {
    let paid = 0, kept = 0, more = 0, due = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const L = fresh({ seed: 300 + seed });
      L.s.cash = 100000;
      const f = L.makePerson({ kind: 'friend', bond: 60 });
      L.s.people.push(f);
      L.s.pend = [{ id: 'wantsLoan', x: { p: f.id, n: 1500, why: 'The rent is late.' } }];
      L.choose(0);
      const ln = L.s.wants.loans[0];
      L.s.t = ln.due;
      if (L.wantsBeats().some((b) => b.id === 'wantsLoanDue' && b.u)) due++;
      const c0 = L.s.cash + L.s.bank;
      L.s.pend = [{ id: 'wantsLoanDue', x: { p: f.id } }];
      L.choose(L.event().opts.findIndex((o) => !o.why && /Take it|nicely/.test(o.t)));
      if (L.s.cash + L.s.bank - c0 > 1500) more++;
      if (ln.back) paid++; else kept++;
      if (L.s.wants.loans.length) more++;
    }
    check(due === 60, 'money lent to a friend comes up when it is due');
    check(more === 0, 'and never comes back more than it was');
    check(paid > 10 && kept > 10, `some friends pay you back and some do not (${paid} and ${kept})`);
  }
  {
    // A venture, followed to its end, many times over: what comes back.
    let stake = 0, ret = 0, busts = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const L = fresh({ seed: 900 + seed });
      L.s.cash = 100000;
      const f = L.makePerson({ kind: 'friend', bond: 70 });
      L.s.people.push(f);
      L.s.pend = [{ id: 'wantsVenture', x: { p: f.id, n: 5000, what: 'a café', name: 'the café' } }];
      L.choose(0);
      stake += 5000;
      for (let i = 0; i < 60 && L.s.wants.ven; i++) {
        L.person(f.id).bond = 70;
        const v = L.s.wants.ven, had = v.got;
        turn(L, { wantsVenWinter: (e) => e.opts.findIndex((o) => !o.why && /each season|Not another/.test(o.t)), wantsVenEnd: (e) => e.opts.findIndex((o) => !o.why && /Sell|worth a try/.test(o.t)) });
        if (!L.s.wants.ven) { ret += v.got; if (v.hp <= 0) busts++; } else if (i === 59) ret += v.got + v.stake * v.hp / 100;
        if (had > v.got) check(false, 'a venture never pays back less than it already has');
      }
    }
    check(busts > 0 && ret / stake > 0.6 && ret / stake < 2.2, `ventures: some go bust (${busts}/80), and on the whole they pay back ${(ret / stake).toFixed(2)} times the stake`);
  }

  // ---- a partner away cannot be taken out; the time it all takes has a floor ----
  {
    const { L, F } = family(fresh, 3);
    const p = L.person(F.sp), r = L.wantsRec(p);
    r.away = L.s.t + 1; r.awayWhy = 'band';
    check(/away/.test(L.can('out', { p: p.id, a: 'walk' })) && /away/.test(L.can('baby', p.id) || ''), 'a partner away on tour cannot be taken out, or tried for a baby with');
    r.voyage = L.s.t + 2; r.ill = { on: 1, care: 'you', until: L.s.t + 3 };
    L.s.wants.p[F.mum] = { been: [], care: 'you', need: 2 };
    L.s.wants.p[F.dad] = { been: [], care: 'you', need: 2 };
    L.s.wants.mind = F.grand;
    check(L.timeMax() >= 3, `however much is asked of you, there is still some time (${L.timeMax()})`);
    const inc = JSON.stringify(L.s);
    L.income(); L.bills(); L.moodBase(); L.timeMax(); L.wantsLines(); L.wantsHope(p);
    check(JSON.stringify(L.s) === inc, 'looking at the sums changes nothing');
    // Help with the little ones only gives back what the little ones take.
    const { L: Q } = family(fresh, 3);
    const t0 = Q.timeMax();
    for (const k of Q.kids()) if (k.age < 5) Q.s.wants.p[k.id] = { been: [], care: 'nursery' };
    check(Q.timeMax() === t0 + 1, 'a nursery gives back the time a small child takes');
    Q.s.people = Q.s.people.filter((k) => !(k.kind === 'child' && k.age < 6));
    check(Q.timeMax() === Q.timeMaxWithout(null) && Q.timeMax() <= t0 + 1, 'and nothing more once they are at school');
  }

  // ---- whole family lives: nothing breaks, the same choices give the same life, nothing repeats for ever ----
  for (const seed of [21, 22, 23]) {
    const { L, F } = family(fresh, seed);
    // (One married to somebody older, whose own parents are very old or gone.)
    if (seed === 23) L.person(F.sp).age = 62;
    let ok = true, twinOk = true, mine = 0, seasons = 0, worst = 0;
    const per = {};
    try {
      for (let q = 0; q < 160 && !L.s.dead; q++) {
        const pt = L.partner(), pal = L.friends()[q % Math.max(1, L.friends().length)];
        L.s.time = 6;
        if (pt) L.act('out', { p: pt.id, a: 'walk' });
        if (pal) L.act('out', { p: pal.id, a: 'coffee' });
        for (const k of L.kids()) if (k.age >= 2 && k.age < 18) L.act('kid', { p: k.id, a: 'read' });
        if (q === 60) {
          const snap = JSON.stringify(L.s), twin = new Life(JSON.parse(snap));
          twin.endSeason(); L.endSeason();
          twinOk = JSON.stringify(twin.s) === JSON.stringify(L.s);
        } else L.endSeason();
        seasons++;
        let n = 0, ev, k = 0;
        while ((ev = L.event()) && k++ < 30) {
          if (ev.id.startsWith('wants')) {
            n++; mine++;
            const key = `${ev.id}`;
            per[key] = (per[key] || 0) + 1;
            if (BAD.test(ev.text + ev.title)) { check(false, `${ev.id} reads badly in a life: ${ev.text}`); }
          }
          const open = ev.opts.map((o, i) => ({ o, i })).filter(({ o }) => !o.why);
          const pick = open[Math.floor(L.rnd() * open.length)];
          const r = L.choose(pick.i);
          if (!r.ok) throw new Error(`${ev.id}: ${r.why}`);
        }
        worst = Math.max(worst, n);
        if (!sane(L)) throw new Error(`numbers went wrong at ${L.s.age}`);
      }
    } catch (e) { ok = false; console.log(e); }
    check(ok, `a family life (${seed}) plays through`);
    check(twinOk, `a family life (${seed}): saved and loaded, it goes on the same`);
    check(mine >= seasons / 6 && mine <= seasons * 0.75, `a family life (${seed}): its people ask things of you now and then, not every season (${mine} cards in ${seasons} seasons)`);
    check(worst <= 4, `a family life (${seed}): never a pile of them at once (${worst})`);
    const kids = 9;
    for (const id of ['wantsSchool', 'wantsMocks', 'wantsResults', 'wantsNext', 'wantsCar', 'wantsLeave']) check((per[id] || 0) <= kids, `a family life (${seed}): ${id} at most once a child (${per[id] || 0})`);
    check(Object.entries(per).every(([id, n]) => n <= (id === 'wantsAnniv' || id === 'wantsForgot' ? 12 : 10)), `a family life (${seed}): nothing comes up over and over (${Object.entries(per).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(', ')})`);
    check(L.s.log.every((e) => !BAD.test(e.t)), `a family life (${seed}): the journal reads properly`);
  }

  // ---- the People tab and the Gazette ----
  {
    const { L, F } = family(fresh, 8);
    L.s.wants.p[F.mum] = { been: [], care: 'home', need: 1 };
    L.wantsRec(L.person(F.sp)).am = [{ id: 'band', st: 1, at: L.s.t + 2, sup: 0, out: null }];
    const l = L.wantsLines();
    check(l.length >= 2 && l.every((q) => q.icon && q.text && !BAD.test(q.text)), `the People tab says who is hoping for what (${l.map((q) => q.text).join(' / ')})`);
    L.s.wants.tales = ['stood behind Dan through a degree', 'looked after an ageing parent at home to the very end'];
    Object.assign(L.s.wants.p[F.kid[26]] || (L.s.wants.p[F.kid[26]] = { been: [] }), { dream: 1, hope: ['a vet', 'medicine'] });
    const ep = L.epitaph();
    check(ep.some((t) => /stood behind Dan/.test(t)) && ep.some((t) => /said .* at six/.test(t)) && ep.every((t) => /[.]$/.test(t) && !BAD.test(t)), `the Gazette remembers (${ep.filter((t) => /Dan|six/.test(t)).join(' ')})`);
  }

  // ---- inside: none of this comes up from a cell ----
  {
    const { L } = family(fresh, 4);
    L.s.gaol = { left: 6, total: 6, served: 0, good: 50, rep: 10, dig: 0, study: 0, sol: false, inSol: false, appeal: false, board: null, tat: false };
    let any = false;
    for (let i = 0; i < 4; i++) { L.s.time = 0; L.endSeason(); if (L.s.pend.some((e) => e.id.startsWith('wants'))) any = true; L.s.pend = []; if (!L.s.gaol) break; }
    check(!any, 'nobody asks anything of you through the bars');
  }
}
