// New in Town: people who want things. The person you share your life
// with, your children, your ageing parents and your friends each have lives
// and wishes of their own, and now and then they ask something of you.
//
// The partner draws an ambition or two of their own (the band, a job in the
// city, a degree, a shop, a voyage, a garden), each a chain of cards over the
// years with real choices: go with them, hold them back, pay for it, talk
// them out of it. What you choose is remembered: held back, they grow sore,
// and a sore partner has a rough patch, which needs time together to mend.
// There are anniversaries (remembered, or not), somebody at their work, their
// parents, wanting a child or not wanting one, and an illness to see them through.
//
// Children are asked about at every stage (a nursery, the first day at
// school, a bully, the wrong crowd, the mocks and the results, learning to
// drive, what next, graduating, leaving home, coming back, a wedding) and
// what you choose shapes their skills and what becomes of them, which is
// what an heir inherits. Parents grow frail and need looking after (your
// time, a carer, a care home, or the spare room), may find love again, or be
// taken in by a man about a driveway, and ask for you at the end. Friends ask
// for money, a share in their venture, a speech, a hand with a piano, and
// come round with a casserole when it is your turn.
//
// None of it is a button: it comes as cards, one at a time and no more than
// one every other season (unless something cannot wait), chosen from what is
// going on in the people's lives (gather, below). The cards themselves are
// in wants-partner.js and wants-family.js; their screen is wants-ui.js.
//
// Everything is kept in s.wants:
//   p[id]: what is known about one person (see rec in wants-lib.js). Partners:
//     since, am (their ambitions: { id, st, at, sup, out }), band, inst, boat,
//     shop, city, biz, inc (money they bring home), away (back in season),
//     voyage, sore (resentment), patch (a rough patch), last, eye, eyeName,
//     inl (their parents), ill, wed (the season you married), annT, forgot,
//     kidN, kidAt, noKid, turnAt, sloan, bye. Children: ms (stages done), care,
//     hope, ex (exam results), rev, path, paid, sal, bad, nick, back, rent,
//     drives, wed, fiance. Parents: need, care, cAt, ask, talk, suitor,
//     with, money, widow. Friends: asked, owe, best, bestAt, fell, doubt.
//     Everybody: been (what you went through together).
//   next: no new card is brought up before this season (urgent ones aside)
//   loans: money lent to friends: [{ p, n, due, back: will they pay it }]
//   ven: a friend's venture you have a stake in
//   mind: the grandchild you have on Thursdays
//   fNext: the season a friend may next ask something
//   tales: a few things for the Gazette to say at the end
//   n, f: counts and flags, for trophies

import { TROPHIES, HOMES, money } from './data.js';
import {
  clamp, first, he, him, his, P, isLove, rec, been, price, fee, young, spareRooms,
  AMBITIONS, BANDS, INSTRUMENTS, BOATS, SHOPS, PREMISES, HOPES, PATHS, CARE, MILESTONES, EXAM,
} from './wants-lib.js';
import { PARTNER_CARDS } from './wants-partner.js';
import { FAMILY_CARDS, settle, granny } from './wants-family.js';

export const WANT_CARDS = [...PARTNER_CARDS, ...FAMILY_CARDS];
const MINE = new Set(WANT_CARDS.map((e) => e.id));
// One card from here at most every other season, and this often when one is due.
const GAP = 2, ODDS = 0.6;
// How long, in seasons, before another friend asks the same kind of thing.
const KIND_GAP = { loan: 20, ven: 24, best: 10, move: 28, said: 32, night: 24, mend: 12 };
// What there is to carry, when a friend moves house.
const MOVING = ['a piano', 'a wardrobe', 'a chest freezer', 'a Welsh dresser', 'a sofa bed', 'a grandfather clock'];

const blank = () => ({ p: {}, next: 0, loans: [], ven: null, mind: null, minded: {}, fNext: 0, tales: [], n: { amb: 0, grad: 0, hopes: 0, speech: 0, patches: 0, cared: 0, ven: 0 }, f: {} });
const top = (p) => Object.keys(p.st || { smarts: 1 }).sort((a, b) => p.st[b] - p.st[a])[0];
const tale = (L, t) => { const T = L.s.wants.tales; if (!T.includes(t)) T.push(t); if (T.length > 6) T.shift(); };
// Who could help pay for a parent's care: a brother or sister who is close.
const halves = (L) => L.siblings().some((q) => q.bond >= 50);

// ---- what might come up --------------------------------------------------------------------

// Draws the ambitions a partner has: two, the first some seasons off.
// (Later in a long life together, another may come along: see more.)
function draw(L, p, r) {
  const s = L.s, w = {
    band: (p.trait === 'arty' ? 3 : 1) * (p.job === 'arts' ? 2.5 : 1),
    city: ['law', 'finance', 'tech', 'medicine', 'politics', 'retail'].includes(p.job) ? 2.5 : 0.8,
    study: p.trait === 'bookish' ? 2.5 : 1,
    shop: (['kind', 'witty'].includes(p.trait) ? 1.5 : 1) * (['retail', 'kitchen'].includes(p.job) ? 2 : 1),
    sail: (p.trait === 'sporty' ? 2 : 0.8) * (p.job === 'sea' ? 2.5 : 1),
    garden: s.owned && HOMES[s.home].tier >= 3 ? 0.3 : p.trait === 'kind' ? 1.6 : 1,
  };
  if (p.age > 58) { w.city = 0; w.band *= 0.5; w.study *= 0.6; }
  for (const q of r.am || []) w[q.id] = 0;
  const pick = () => { const ids = Object.keys(w).filter((k) => w[k] > 0); let x = L.rnd() * ids.reduce((a, k) => a + w[k], 0); for (const k of ids) { x -= w[k]; if (x < 0) return k; } return ids[0] || null; };
  if (r.am) { const c = pick(); return c ? { id: c, st: 0, at: s.t + L.int(2, 6), sup: 0, out: null } : null; }
  const a = pick();
  w[a] = 0;
  const b = pick();
  r.band = L.pick(BANDS); r.inst = L.pick(INSTRUMENTS); r.boat = L.pick(BOATS); const sh = SHOPS[p.trait] || SHOPS.kind;
  r.shop = { a: sh.a, job: sh.job, sign: L.pick(sh.signs), where: L.pick(PREMISES) };
  return [{ id: a, st: 0, at: s.t + L.int(4, 10), sup: 0, out: null }, { id: b, st: 0, at: null, sup: 0, out: null }];
}
// The parents of the person you are with.
function inlaws(L, p) {
  const last = p.name.split(' ')[1] || '';
  const mum = L.pick(['Pat', 'Maureen', 'Brenda', 'Jean', 'Sheila', 'Margaret', 'Val', 'Dot']), dad = L.pick(['Keith', 'Derek', 'Brian', 'Roy', 'Clive', 'Malcolm', 'Les', 'Terry']);
  const age = p.age + L.int(25, 32), M = last ? `${mum} ${last}` : mum, D = last ? `${dad} ${last}` : dad, left = age < 82 ? 2 : age < 92 ? 1 : 0;
  // (Of an old couple, one may be left: more often the mother.)
  return { mum: M, dad: D, age, left, last: left === 1 ? (L.chance(0.6) ? M : D) : null, w: 50, help: 0 };
}
// How a child's exams went: what they know, how much they revised, and the day.
function examGrade(L, k, r) {
  const sc = (k.st ? k.st.smarts : 30) + (r.rev || 0) * 4 + (k.priv ? 4 : 0) + L.int(-8, 8);
  return sc >= 60 ? 3 : sc >= 45 ? 2 : sc >= 32 ? 1 : 0;
}
// When the voyage is over, or the summer's touring.
const awayNow = (L, r) => !!r && r.away > L.s.t;

// Everything that could be brought up this season: [{ id, x, w: weight, u: cannot wait, go: on bringing it up }].
function gather(L) {
  const s = L.s, out = [];
  const add = (id, x, w, u = false, go = null) => out.push({ id, x, w, u, go });
  const pt = L.partner();
  if (pt) partnerBeats(L, pt, rec(L, pt), add);
  for (const k of L.kids()) childBeats(L, k, rec(L, k), add);
  for (const q of s.people.filter((p) => p.kind === 'parent')) parentBeats(L, q, rec(L, q), add);
  friendBeats(L, add);
  return out;
}

function partnerBeats(L, p, r, add) {
  const s = L.s, t = s.t, x = { p: p.id }, together = t - r.since, live = p.kind === 'spouse' || !!p.live;
  // An anniversary, in its season: remembered, or not.
  if (p.kind === 'spouse' && r.wed != null && t > r.wed && (t - r.wed) % 4 === 0 && r.annT !== t) {
    const y = (t - r.wed) / 4, big = !!MILESTONES[y];
    if (big || L.chance(0.12)) {
      const strain = s.soul && s.soul.mind ? s.soul.mind.strain : 0;
      const keep = clamp(0.6 + (big ? 0.15 : 0) + (s.items.phone ? 0.08 : 0) + (p.bond - 50) / 250 + (r.forgot ? 0.2 : 0) - (strain >= 10 ? 0.2 : 0) + (L.soulHas && L.soulHas('romantic') ? 0.3 : 0), 0.2, 0.97);
      const forgot = !L.chance(keep);
      add(forgot ? 'wantsForgot' : 'wantsAnniv', { p: p.id, y }, 6, true, () => { r.annT = t; if (forgot) r.forgot = (r.forgot || 0) + 1; else r.forgot = 0; });
    } else r.annT = t;
  }
  if (r.ill) {
    if (r.ill.due) add('wantsIll', x, 7, true, () => { Object.assign(r.ill, { due: 0, on: 1, at: t, until: t + 3, care: null }); });
    else if (r.ill.well) add('wantsWell', { p: p.id, what: r.ill.what }, 6, true, () => { r.ill = { done: 1 }; });
  }
  // A rough patch, and how it ends.
  if (r.patch) {
    if (r.patch.n >= 3 || p.bond >= 62) add('wantsRoughUp', x, 5, true);
    else if (t - r.patch.at >= 5) add('wantsRoughDown', x, 5, true);
  } else if (live && together >= 6 && t - (r.last ?? -99) >= 16 && (p.bond < 38 || (r.sore || 0) >= 3)) add('wantsRough', x, 4, (r.sore || 0) >= 5);
  // Somebody at their work.
  if (r.eye === 2 && t >= r.eyeAt) add('wantsFound', x, 6, true);
  else if (!r.eye && live && together >= 10 && p.age < 68 && s.age < 70) {
    const strain = s.soul && s.soul.mind ? s.soul.mind.strain : 0;
    add('wantsEye', x, 0.25 + (p.bond < 55 ? 0.5 : 0) + (strain >= 10 ? 0.35 : 0), false, () => { r.eye = 1; r.eyeName = L.freshName(s.sex === 'f' ? 'f' : 'm').split(' ')[0]; });
  }
  // Their ambitions, a stage at a time (not while something else has the upper hand), once
  // the two of you have made a home together: nobody brings out the ring binder on a third date.
  if (!r.am && live && together >= 4) r.am = draw(L, p, r);
  // Years after the last dream was settled, another (four in a long life together, at most).
  if (r.am && r.am.length < 4 && r.am.every((q) => q.out != null) && t - Math.max(...r.am.map((q) => q.end ?? t)) >= 16) { const c = draw(L, p, r); if (c) r.am.push(c); }
  const a = r.am && r.am.find((q) => q.out == null);
  const free = !r.patch && !(r.ill && r.ill.on) && !awayNow(L, r) && !(r.voyage > t);
  if (a && free) {
    if (a.st === 3 && r.away && r.away <= t) add('wantsSailHome', { p: p.id, a: a.id }, 6, true, () => { r.away = null; });
    // (The longer one has waited, the more it presses: a busy house does not crowd it out for ever.)
    else if (a.at != null && a.at <= t && a.st < AMBITIONS[a.id].cards.length && (a.id !== 'sail' || (a.st === 1 ? L.season <= 1 : a.st === 2 ? L.season === 0 : true))) add(AMBITIONS[a.id].cards[a.st], { p: p.id, a: a.id }, 3 + (t - a.at), t - a.at >= 8);
  }
  const held = r.am && r.am.find((q) => q.out === 'held' && !q.road && t - q.end >= 12);
  if (held && free && !a) add('wantsRoad', { p: p.id, a: held.id }, 1.2, false, () => { held.road = 1; });
  // Children, or not.
  if (p.wish && !L.kids().length && !s.due && live && together >= 6 && (r.kidN || 0) < 3 && t >= (r.kidAt || 0) && s.age <= 50 && p.age <= 48) add('wantsBaby', x, 2.5);
  if (!p.wish && !r.noKid && !L.kids().length && live && together >= 4 && s.age <= 46 && p.age <= 46) add('wantsNoBaby', x, 2, false, () => { r.noKid = 1; });
  // Their parents.
  if (together >= 3) {
    if (!r.inl) r.inl = inlaws(L, p);
    const i = r.inl;
    if (i.dying) add('wantsInlawsGone', { p: p.id, ...i.dying }, 6, true, () => { i.dying = null; });
    else if (i.left > 0) {
      if (!i.offered && young(L, 4).length && i.w >= 45) add('wantsInlawsKids', x, 1.5, false, () => { i.offered = 1; });
      if (!i.ruby && i.left === 2 && together >= 6 && i.age >= 64 && i.age <= 84) add('wantsInlawsRuby', x, 0.8, false, () => { i.ruby = 1; });
      if (!i.fell && i.age >= 72) add('wantsInlawsIll', x, 0.7, false, () => { i.fell = 1; });
    }
  }
}

function childBeats(L, k, r, add) {
  const s = L.s, a = k.age, ms = r.ms || (r.ms = {}), x = { p: k.id };
  const once = (id, w, u = false, go = null) => add(id, x, w, u, () => { ms[id] = 1; if (go) go(); });
  // (What would have been decided on a birthday, for a child who was already older when this part of town began.)
  if (r.bully === undefined && a > 7) r.bully = a <= 11 && L.chance(0.5);
  if (r.crowd === undefined && a > 13) r.crowd = a <= 16 && L.chance(0.4);
  if (r.backRoll === undefined && a > 23) r.backRoll = a <= 33 && L.chance(0.35);
  if (r.wedRoll === undefined && a > 24) r.wedRoll = a <= 38 && L.chance(0.7);
  if (r.nick === 1) add('wantsNick', x, 6, true, () => { r.nick = 2; });
  if (a >= 1 && a <= 3 && !ms.wantsNursery) once('wantsNursery', 2.5);
  if (a >= 4 && a <= 5 && !ms.wantsSchool) once('wantsSchool', 3, a === 5 && L.season >= 2);
  if (a >= 7 && a <= 11 && r.bully && !ms.wantsBully) once('wantsBully', 2);
  if (a >= 13 && a <= 16 && r.crowd && !ms.wantsCrowd) once('wantsCrowd', 2);
  if (a === 15 && !ms.wantsMocks) once('wantsMocks', 3);
  if (a === 16 && !ms.wantsResults) once('wantsResults', 4, L.season >= 2, () => { r.ex = examGrade(L, k, r); });
  if (a === 17 && !ms.wantsCar) once('wantsCar', 2);
  if (a === 17 && !ms.wantsNext) once('wantsNext', 5, L.season >= 2);
  if (a >= 19 && a <= 22 && !ms.wantsLeave && r.path !== 'gap') once('wantsLeave', 2);
  if (!ms.wantsGrad && ((r.path === 'uni' && a >= 21 && a <= 23) || (PATHS[r.path] && PATHS[r.path].job && a >= 20 && a <= 22))) once('wantsGrad', 3);
  if (a >= 23 && a <= 33 && r.backRoll && !ms.wantsBack) once('wantsBack', 1.2);
  if (r.back && s.t >= r.back) add('wantsBackOut', x, 4, true, () => { r.back = null; });
  if (a >= 24 && a <= 38 && r.wedRoll && !ms.wantsChildWed) once('wantsChildWed', 2, false, () => { r.fiance = L.freshName(L.chance(0.5) ? 'm' : 'f').split(' ')[0]; });
}

function parentBeats(L, q, r, add) {
  const s = L.s, x = { p: q.id };
  if (r.ask) add('wantsFrail', { p: q.id, why: r.askWhy || null }, 6, true, () => { r.ask = 0; r.askWhy = null; });
  // (A widowed parent, a few years on, and still on their feet.)
  const widow = r.widow != null ? s.t - r.widow >= 8 : s.gen > 1;
  if (!r.suitor && widow && q.age >= 55 && q.age <= 80 && !r.need) {
    add('wantsSuitor', { p: q.id, him: q.sex !== 'm', name: L.pick(q.sex !== 'm' ? ['Clive', 'Bernard', 'Desmond', 'Ray', 'Gordon'] : ['Marjorie', 'Irene', 'Babs', 'Rita', 'Joan']), was: L.pick(['postman', 'dentist', 'ferry captain', 'piano tuner', 'bank manager']) }, 0.9, false, () => { r.suitor = 1; });
  }
  if (!r.money && q.age >= 62) add('wantsParentMoney', { p: q.id, n: price(L, 1500) }, 0.5, false, () => { r.money = 1; });
}

function friendBeats(L, add) {
  const s = L.s, W = s.wants, t = s.t;
  // Money owed, and a venture, come up when they are due.
  for (const ln of W.loans) { const f = L.person(ln.p); if (t >= ln.due && f && f.kind === 'friend') { add('wantsLoanDue', { p: ln.p }, 5, true); break; } }
  const v = W.ven;
  if (v && L.person(v.p)) {
    if (v.hp <= 0) add('wantsVenEnd', { p: v.p }, 6, true);
    else if (v.st === 0 && v.age >= 4) add('wantsVenWinter', { p: v.p }, 3);
    else if (v.st === 1 && v.age >= 12 && v.hp >= 65) add('wantsVenEnd', { p: v.p }, 3, false, () => { v.mult = Math.round((1.5 + v.hp / 100) * 10) / 10; });
  }
  // A friend you were there for returns the favour, when it is your turn.
  const S = s.soul, low = (S && S.mind && S.mind.spell) || (S && S.grief >= 4) || (s.ill && s.ill.sev >= 2) || (s.f.bustAt != null && t - s.f.bustAt <= 2);
  if (low && t - (W.turnT ?? -99) >= 8) {
    const f = L.friends().filter((q) => (rec(L, q).owe || 0) >= 2 && q.bond >= 35).sort((a, b) => b.bond - a.bond)[0];
    if (f) add('wantsTurn', { p: f.id }, 5, true, () => { W.turnT = t; });
  }
  for (const f of L.friends()) {
    const r = rec(L, f);
    if (r.best === 1 && t >= r.bestAt) add('wantsSpeech', { p: f.id }, 5, true);
  }
  // One friend a season might ask you something.
  if (t < W.fNext) return;
  const pals = L.friends().filter((q) => q.bond >= 30);
  if (!pals.length) return;
  const f = pals[(t * 7 + pals.length) % pals.length], r = rec(L, f), asked = r.asked || (r.asked = {}), x = { p: f.id };
  // (Each kind of thing is asked once by each friend, and by nobody else for some years after: a life
  // with twenty friends should not carry twenty pianos up twenty staircases. W.kindT: when each was last asked.)
  const kindT = W.kindT || (W.kindT = {});
  const due = (k) => t - (kindT[k] ?? -99) >= (KIND_GAP[k] || 12);
  const ask = (id, k, w, more = {}) => { if (due(k)) add(id, { ...x, ...more }, w, false, () => { asked[k] = 1; kindT[k] = t; W.fNext = t + 3; }); };
  if (r.fell != null && t - r.fell >= 8) ask('wantsMend', 'mend', 1.2);
  if (r.fell != null) return;
  // (A loan asked for here, or by the old card in events.js, which shares its title: one or the other, now and then.)
  if (f.bond >= 35 && !asked.loan && s.cash + s.bank >= 2500 && t - (s.cd.loan ?? -99) >= KIND_GAP.loan) {
    const why = L.pick(['The van has failed its MOT, and the work depends on it.', 'The rent is late, and the landlord is not a patient man.', 'The vet’s bill for the dog has come to more than the dog.', 'The boiler has died, and it is February.']);
    ask('wantsLoan', 'loan', 1, { n: price(L, 1500), why });
  }
  if (f.bond >= 45 && !asked.ven && !W.ven && W.n.ven < 2 && s.age >= 22 && s.age <= 70 && s.cash + s.bank >= price(L, 5000) * 1.5) {
    const [what, name] = L.pick([['a café on Harbour Row', 'the café'], ['a surf school down at the cove', 'the surf school'], ['a little brewery in the old net loft', 'the brewery'], ['a bicycle repair shop', 'the bike shop'], ['a fish and chip van', 'the chip van'], ['a vintage clothes shop on the High Street', 'the clothes shop']]);
    ask('wantsVenture', 'ven', 0.9, { n: price(L, 5000), what, name });
  }
  if (f.bond >= 55 && !asked.best && !r.best && f.age >= 21 && f.age <= 60) ask('wantsBest', 'best', 1, { name: L.freshName(L.chance(0.5) ? 'm' : 'f').split(' ')[0] });
  // (Moving house: not once they, or you, are past carrying furniture up stairs.)
  if (!asked.move && s.age <= 64 && f.age <= 70) ask('wantsMoving', 'move', 0.8, { big: L.pick(MOVING) });
  if (f.bond >= 35 && !asked.said) ask('wantsSaid', 'said', 0.5, { thing: L.pick(['haircut', 'new sweetheart', 'business idea', 'poetry', 'driving']) });
  if (f.bond >= 45 && !asked.night) ask('wantsNight', 'night', 0.8, { why: L.pick([`${f.sex === 'm' ? 'His' : 'Her'} other half has gone, and taken the dog.`, `${f.sex === 'm' ? 'His' : 'Her'} dad has died, very suddenly.`, `${f.sex === 'm' ? 'He' : 'She'} has lost ${f.sex === 'm' ? 'his' : 'her'} job, and has not told anybody.`, `There has been some news from the hospital.`]) });
}

// The Gazette's lines from the tales: all that was gone through with each partner in one sentence, said
// once ("was married to Lily for fifty years and more, and stood behind her through a degree and a
// record with The Undertow"), and then anything else.
function talesSaid(L, tales, list) {
  const s = L.s, by = new Map(), rest = [];
  const of = (n) => { if (!by.has(n)) by.set(n, { wed: null, behind: [], sailed: false }); return by.get(n); };
  for (const t of tales) {
    let q;
    if ((q = t.match(/^was married to (\S+) for (.+)$/))) of(q[1]).wed = q[2];
    else if ((q = t.match(/^stood behind (\S+) through (.+)$/))) { const b = of(q[1]).behind; if (!b.includes(q[2])) b.push(q[2]); }
    else if ((q = t.match(/^sailed round the world with (\S+)$/))) of(q[1]).sailed = true;
    else rest.push(t);
  }
  const out = [];
  for (const [n, g] of by) {
    // (Him or her the second time, where it is known which.)
    const p = s.people.find((q) => ['spouse', 'partner', 'ex'].includes(q.kind) && first(q) === n)
      || ((s.soul && s.soul.graves) || []).find((q) => ['spouse', 'partner'].includes(q.kind) && q.name.split(' ')[0] === n);
    const them = p ? (p.sex === 'm' ? 'him' : 'her') : n, parted = !!p && p.kind === 'ex';
    const behind = g.sailed ? g.behind.filter((b) => b !== 'a voyage round the world') : g.behind, bits = [];
    if (g.wed) bits.push(`was married to ${n} for ${g.wed}${parted ? ', until they went their separate ways' : ''}`);
    if (g.sailed) bits.push(`sailed round the world with ${bits.length ? them : n}`);
    if (behind.length) bits.push(`stood behind ${bits.length ? them : n} through ${list(behind)}`);
    out.push(bits.length < 2 ? bits[0] : `${bits.slice(0, -1).join(', ')}, and ${bits[bits.length - 1]}`);
  }
  if (rest.length) out.push(list(rest));
  return out;
}

// Grandchildren: Thursdays, if they are asked for.
function grandBeats(L, add) {
  const s = L.s, W = s.wants;
  // (Not while chapters.js has you minding them on Tuesdays and Thursdays already: one arrangement at a time.)
  if (W.mind || s.age < 45 || (s.chap && s.chap.old && s.chap.old.mind && s.chap.old.mind.on) || (s.chap && s.chap.dusk)) return;
  const g = L.grandkids().find((q) => q.age <= 1 && !W.minded[q.id] && L.person(q.of));
  if (g) add('wantsMinding', { p: g.id }, 1.5, false, () => { W.minded[g.id] = 1; });
}

// ---- install --------------------------------------------------------------------------------

export function install({ A, Life, hooks, addEvents }) {
  Object.assign(Life.prototype, {
    // What there is to tell about somebody, for their sheet and the People tab.
    wantsRec(p) { return this.s.wants.p[p.id] || null; },
    wantsAway(p) { return awayNow(this, this.s.wants.p[p.id]); },
    // What a person is hoping for, or going through, just now: { icon, text } or null.
    // (text reads after their name: "Harry hopes to take The Undertow on tour".)
    wantsHope(p) {
      const s = this.s, r = s.wants.p[p.id], t = s.t;
      if (!r) return null;
      if (isLove(p)) {
        if (r.ill && r.ill.on) return { icon: '🩺', text: `Is getting over ${(r.ill.what || 'an illness').replace(/,.*$/, '')}` };
        if (r.patch) return { icon: '🌧️', text: 'Is going through a rough patch with you. Time together helps.' };
        if (r.voyage > t) return { icon: '🌍', text: 'Is at sea with you, round the world' };
        if (awayNow(this, r)) return { icon: r.awayWhy === 'band' ? '🚐' : '⛵', text: r.awayWhy === 'band' ? `Is on tour with ${r.band}` : 'Is away at sea' };
        // (A dream shows once it has been talked about: after its first card.)
        const a = r.am && r.am.find((q) => q.out == null && q.st >= 1);
        if (a) { const k = AMBITIONS[a.id], h = k.hope[Math.min(a.st, k.hope.length - 1)](r); return { icon: k.icon, text: /^To /.test(h) ? `Hopes ${h[0].toLowerCase()}${h.slice(1)}` : `Hopes for ${h[0].toLowerCase()}${h.slice(1)}` }; }
        if (r.city) return { icon: '🚆', text: 'Works in the city, home on Fridays' };
        if (p.wish && !this.kids().length && (r.kidN || 0) < 9) return { icon: '👶', text: 'Hopes for a baby, one day' };
        return null;
      }
      if (p.kind === 'child') {
        if (r.back > t) return { icon: '🧳', text: 'Is living back at home for a while' };
        if (p.age < 17 && r.hope) return { icon: '🌟', text: `Wants to be ${r.hope[0]}` };
        if (p.age < 18 && r.path) return { icon: '🧭', text: PATHS[r.path] ? PATHS[r.path].plan : 'Is making plans' };
        if (p.age >= 18 && r.path === 'uni' && !(r.ms && r.ms.wantsGrad)) return { icon: '🎓', text: 'Is at university in the city' };
        return null;
      }
      if (p.kind === 'parent') {
        if (r.ask) return { icon: '🫖', text: 'Is not managing alone any more' };
        if (r.care) return { icon: '🫖', text: CARE[r.care].said };
        if (r.suitor === 2) return { icon: '💍', text: `Is married again, to ${r.with}` };
        return null;
      }
      if (p.kind === 'friend') {
        const ln = s.wants.loans.find((q) => q.p === p.id), v = s.wants.ven;
        if (r.fell != null) return { icon: '🗯️', text: 'Is not speaking to you' };
        if (ln) return { icon: '🫴', text: `Owes you ${money(ln.n)}` };
        if (v && v.p === p.id) return { icon: '📈', text: `Runs ${v.name}, with your money in it` };
        if (r.best === 1) return { icon: '🤵', text: 'Is getting married, with you at the top table' };
        return null;
      }
      return null;
    },
    // The People tab's short list: who is hoping for what. [{ p, icon, text }]
    wantsLines() {
      const out = [], pt = this.partner();
      const add = (p) => { const h = this.wantsHope(p); if (h) out.push({ p, ...h }); };
      if (pt) add(pt);
      for (const k of this.kids()) add(k);
      for (const q of this.s.people.filter((o) => o.kind === 'parent')) add(q);
      for (const f of this.friends()) if (out.length < 7) add(f);
      return out.slice(0, 7);
    },
    // What they have been through with you.
    wantsBeen(p) { const r = this.s.wants.p[p.id]; return r ? r.been : []; },
    // What every card might be just now (for tests: it may draw on chance, as the season's turn does).
    wantsBeats() { const out = gather(this); grandBeats(this, (id, x, w, u, go) => out.push({ id, x, w, u, go })); return out; },
  });

  hooks.load.push((L) => {
    const s = L.s;
    if (!s.wants) s.wants = blank();
    const W = s.wants, b = blank();
    for (const [k, v] of Object.entries(b)) if (W[k] == null) W[k] = v;
    for (const k of Object.keys(b.n)) if (W.n[k] == null) W.n[k] = 0;
  });

  // ---- the turn of the season ----

  hooks.season.push((L, lines, jailed) => {
    const s = L.s, W = s.wants, t = s.t;
    // (People who have gone take what was known about them with them.)
    for (const id of Object.keys(W.p)) if (!L.person(Number(id))) delete W.p[id];
    for (const ln of W.loans.filter((q) => !L.person(q.p))) L.note(`The ${money(ln.n)} lent to a friend who has gone will not be coming back.`);
    W.loans = W.loans.filter((q) => L.person(q.p));
    // (Thursdays end when the little one starts school, or with a last illness: see chapters.js.)
    if (W.mind && (!(L.person(W.mind) && L.person(W.mind).age < 5) || (s.chap && s.chap.dusk))) W.mind = null;
    const v = W.ven;
    if (v) {
      if (!L.person(v.p)) {
        const n = Math.round(v.stake * clamp(v.hp, 0, 100) / 100);
        L.cash(n); v.got += n;
        L.note(`${v.name.replace(/^./, (c) => c.toUpperCase())} was wound up when your friend left, and your share came back: ${money(n)}.`);
        if (v.got > v.stake) W.f.angel = 1;
        W.ven = null;
      } else {
        // (What it paid you came in with the season, just now: see the income below. Then it has another season.)
        if (v.st >= 1 && v.hp >= 50 && t >= (v.wait || 0)) v.got += Math.round(v.stake * 0.04);
        v.age++;
        if (v.hp > 0) v.hp = clamp(v.hp + 2.5 * s.eco + L.int(-7, 7) + (v.age <= 4 ? -1.5 : 0.5), 0, 100);
      }
    }
    if (jailed) return;
    const pt = L.partner();
    if (pt) {
      const r = rec(L, pt);
      if (r.since == null) r.since = t;
      if (pt.kind === 'spouse' && r.wed == null) r.wed = wedAt(L, pt);
      if (r.city) L.bond(pt, r.city.mode === 'week' ? -1 : -0.5);
      // (Letters from the road keep them close.)
      if (awayNow(L, r)) L.bond(pt, 1);
      if (r.noKid === 2 && r.turnAt != null && t >= r.turnAt) {
        r.turnAt = null;
        if (L.chance(0.35)) { pt.wish = true; r.noKid = 3; L.note(`${first(pt)} changed ${his(pt)} mind about children.`, 'love'); L.say('👶', `${first(pt)} has changed ${his(pt)} mind about children`, 'good'); }
      }
      const a = r.am && r.am.find((q) => q.out == null);
      if (r.biz && a && a.id === 'shop') r.biz.hp = clamp(r.biz.hp + 2 * s.eco + L.int(-6, 6), 0, 100);
      // An illness runs its course. Late in life, and unlucky, it may not end well.
      if (r.ill && r.ill.on && t + 1 >= r.ill.until) {
        const risk = pt.age >= 68 ? 0.15 * (r.ill.priv ? 0.5 : 1) * (r.ill.care === 'you' ? 0.8 : 1) : 0;
        r.ill.on = 0;
        if (L.chance(risk)) { r.ill = { done: 1 }; s.pend.push({ id: 'wantsFading', x: { p: pt.id } }, { id: 'spouseDies', x: pt.id }); } else r.ill.well = 1;
      }
      if (pt.kind === 'spouse' && r.wed != null) {
        const y = (t + 1 - r.wed) / 4;
        // (The trophies are for anniversaries reached in this life: an heir married long before it began has 2, and the tale.)
        if (y >= 25 && !W.f.silver) { W.f.silver = r.wed + 100 >= 0 ? 1 : 2; tale(L, `was married to ${first(pt)} for more than twenty-five years`); }
        if (y >= 50 && !W.f.golden) { W.f.golden = r.wed + 200 >= 0 ? 1 : 2; W.tales = W.tales.filter((q) => !q.startsWith('was married to')); tale(L, `was married to ${first(pt)} for fifty years and more`); }
      }
    }
    for (const q of s.people.filter((p) => p.kind === 'parent')) {
      const r = W.p[q.id];
      if (!r || !r.care) continue;
      L.bond(q, { you: 2, carer: 1, home: t - r.cAt < 4 ? -1 : 0.5, with: 2, sib: 0 }[r.care]);
      if (r.care === 'with') {
        if (spareRooms(L) < 0) { r.care = null; r.ask = 1; r.askWhy = 'room'; continue; }
        const p2 = L.partner();
        if (p2 && p2.trait !== 'kind') L.bond(p2, -0.5);
      }
    }
    for (const k of L.kids()) { const r = W.p[k.id]; if (r && r.back > t) L.bond(k, 2); }
    if (W.mind) { const g = L.person(W.mind), k = g && L.person(g.of); L.bond(g, 3); if (k) L.bond(k, 1); }
  });

  // The day you married, for a save from before this part of town (from the journal).
  function wedAt(L, p) {
    const e = L.s.log.slice().reverse().find((q) => q.t.startsWith(`Married ${p.name}`));
    return e ? Math.max(0, (e.a - 18) * 4 + e.q) : L.s.t;
  }

  hooks.year.push((L) => {
    const s = L.s, W = s.wants;
    const pt = L.partner();
    if (pt) {
      const r = rec(L, pt);
      const i = r.inl;
      if (i) {
        i.age++;
        if (i.left > 0 && i.age >= 70 && !i.dying && L.chance((i.age - 66) ** 2 / 1500)) {
          const mum = i.left === 2 ? L.chance(0.45) : i.last === i.mum, name = mum ? i.mum : i.dad;
          i.left--; i.last = i.left === 1 ? (mum ? i.dad : i.mum) : null;
          i.dying = { mum, name, age: i.age };
        }
      }
      if (pt.age >= 45 && !r.ill && L.chance((pt.age - 40) / 700)) {
        r.ill = { due: 1, what: pt.age >= 65 ? L.pick(['a stroke, and months of learning to walk again', 'an operation on the heart', 'a new hip, and a long time on crutches']) : L.pick(['a lump that needs taking out, and treatment after', 'an operation on the back, and a long time flat on it', 'something with a long name, and a course of treatment']) };
      }
    }
    for (const k of L.kids()) {
      const r = rec(L, k);
      if (k.st && k.age >= 6 && (!r.hope || (k.age === 13 && L.chance(0.4)))) r.hope = L.pick(HOPES[top(k)]);
      if (k.age === 7) r.bully = L.chance(0.5);
      if (k.age === 13) r.crowd = L.chance(0.4 + (s.n.crimes >= 3 ? 0.2 : 0) + (s.karma <= -20 ? 0.1 : 0));
      if (k.age >= 13 && k.age <= 17 && (r.bad || 0) >= 2 && !r.nick && L.chance(0.5)) r.nick = 1;
      // (Results that never came up on a card came all the same.)
      if (k.age === 17 && r.ex == null) r.ex = examGrade(L, k, r);
      if (k.age === 18) eighteen(L, k, r);
      if (k.age === 23) r.backRoll = L.chance(0.35);
      if (k.age === 24) r.wedRoll = L.chance(0.7);
      // A child who has married is a child who might make you a grandparent.
      if (r.wed != null && k.age >= 26 && k.age <= 40 && (k.gk || 0) < 3 && L.chance(0.08)) { k.gk = (k.gk || 0) + 1; L.queue('grandchild', k.id); }
    }
    for (const q of s.people.filter((p) => p.kind === 'parent')) {
      const r = rec(L, q);
      if (!r.need && q.age >= 70 && L.chance((q.age - 68) * 0.04 * (r.suitor === 2 ? 0.6 : 1))) { r.need = 1; r.ask = 1; }
      else if (r.need === 1 && L.chance(0.18)) { r.need = 2; if (!r.care || r.care === 'you' || r.care === 'carer') r.ask = 1; }
      // A parent nearing the end asks for you first (the funeral is St Brigid's: see soul.js).
      const i = s.pend.findIndex((e) => e.id === 'parentDies' && e.x === q.id);
      if (i >= 0 && !s.gaol && !r.talk && (r.need > 0 || q.age >= 76)) s.pend.splice(i, 0, { id: 'wantsLastTalk', x: { p: q.id } });
    }
  });

  // Eighteen: whatever was decided at seventeen takes effect. University is
  // the town's own card ("Eighteen", who pays), and what was chosen on it is
  // remembered (see chose, below); any other way, this part's card instead.
  function eighteen(L, k, r) {
    const s = L.s, i = s.pend.findIndex((e) => e.id === 'kid18' && e.x === k.id);
    if (r.sal === 2 && !(r.path && (r.path === 'uni' || (PATHS[r.path] || {}).job))) { r.path = 'crew'; k.job = 'crew'; }
    else if (r.path && r.path !== 'uni') settle(L, k, (PATHS[r.path] || {}).job || null);
    else return;
    if (i >= 0) s.pend.splice(i, 1, { id: 'wantsEighteen', x: { p: k.id } });
  }

  hooks.late.push((L, jailed) => {
    const s = L.s, W = s.wants;
    if (jailed || s.dead) return;
    if (s.pend.some((q) => MINE.has(q.id))) return;
    const beats = gather(L);
    grandBeats(L, (id, x, w, u, go) => beats.push({ id, x, w, u, go }));
    if (!beats.length) return;
    let b = null;
    const urgent = beats.filter((q) => q.u);
    if (urgent.length) b = urgent.slice().sort((p, q) => q.w - p.w)[0];
    else if (s.t >= W.next && L.chance(ODDS)) {
      let r = L.rnd() * beats.reduce((a, q) => a + q.w, 0);
      for (const q of beats) { b = q; r -= q.w; if (r < 0) break; }
    }
    if (!b) return;
    if (b.go) b.go();
    L.queue(b.id, b.x);
    W.next = s.t + GAP;
  });

  // ---- what you do, and what you choose ----

  hooks.acted.push((L, id, p, y) => {
    if (!p || typeof p !== 'object' || !L.s.wants || !L.s.people.includes(p)) return;
    const r = (id === 'kid' && p.kind === 'child') ? rec(L, p) : L.s.wants.p[p.id];
    if (!r) return;
    // A rough patch mends with time together (once a season; with counselling behind it, twice as fast).
    if (id === 'out' && isLove(p) && r.patch && r.patch.seen !== L.s.t) { r.patch.seen = L.s.t; r.patch.n += r.patch.c ? 2 : 1; }
    // Reading together before the exams.
    if (id === 'kid' && p.kind === 'child' && p.age >= 14 && p.age <= 16 && y && y.a === 'read' && (r.rev || 0) < 4 && r.revT !== L.s.t) { r.rev = (r.rev || 0) + 0.5; r.revT = L.s.t; }
  });

  hooks.chose.push((L, id, x, i) => {
    const s = L.s, W = s.wants;
    if (!W) return;
    if (id === 'wedding' || id === 'soulBanns') { const p = L.person(x); if (p && p.kind === 'spouse') { const r = rec(L, p); r.wed = s.t; if (r.since == null) r.since = s.t; } }
    if (id === 'kid18') {
      const k = L.person(x);
      if (k) { const r = rec(L, k); if (i === 2) { r.path = 'sea'; settle(L, k, 'sea'); } else { r.path = 'uni'; r.paid = i === 1 ? 1 : 0; } }
    }
    if (id === 'parentDies') {
      const r = W.p[x], S = s.soul;
      for (const q of s.people.filter((p) => p.kind === 'parent')) rec(L, q).widow = s.t;
      if (r) {
        if (r.care === 'you' || r.care === 'with') { W.n.cared++; tale(L, 'looked after an ageing parent at home to the very end'); }
        if (S && r.talk && r.talk !== 'later') S.grief = Math.max(0, Math.round((S.grief - 2.5) * 100) / 100);
        if (r.talk === 'later') L.joy(-4);
      }
    }
    if (id === 'spouseDies') { const r = W.p[x], S = s.soul; if (r && r.bye && S) S.grief = Math.max(0, Math.round((S.grief - 2) * 100) / 100); }
    if (id === 'wantsSail3' || id === 'wantsSailHome') { const p = L.person(x && x.p); if (p && W.f.world) tale(L, `sailed round the world with ${first(p)}`); }
  });

  // ---- what it all does, season by season ----

  hooks.mood.push((L) => {
    const s = L.s, W = s.wants;
    if (!W) return 0;
    let b = 0;
    const pt = L.partner(), r = pt && W.p[pt.id];
    if (r) {
      if (awayNow(L, r)) b -= 2;
      if (r.ill && r.ill.on) b -= 3;
      if (r.patch) b -= 3;
    }
    for (const q of s.people) {
      const R = W.p[q.id];
      if (!R) continue;
      // (Looking after them yourself is hard, and you are glad you do it.)
      if (q.kind === 'parent') b += R.ask ? -1 : R.care === 'with' || R.care === 'you' ? 1 : R.care === 'home' ? -0.5 : 0;
      if (q.kind === 'child' && R.back > s.t) b += 1;
    }
    if (W.mind) b += 2;
    return clamp(b, -6, 4);
  });

  hooks.time.push((L) => {
    const s = L.s, W = s.wants;
    if (!W) return 0;
    let t = 0, help = 0;
    const pt = L.partner(), r = pt && W.p[pt.id], small = L.kids().some((k) => k.age < 6), schoolKids = young(L, 12).length > 0;
    if (r) {
      if (r.voyage > s.t) t -= 3;
      if ((awayNow(L, r) || (r.city && r.city.mode === 'week')) && schoolKids) t -= 1;
      if (r.ill && r.ill.on && r.ill.care === 'you') t -= 1;
      if (r.inl && r.inl.help && r.inl.left > 0 && small) help = 1;
    }
    for (const q of s.people) {
      const R = W.p[q.id];
      if (!R) continue;
      if (q.kind === 'parent' && R.care === 'you') t -= R.need >= 2 ? 2 : 1;
      if (q.kind === 'parent' && R.care === 'with' && small) help = 1;
      if (q.kind === 'child' && q.age < 5 && (R.care === 'nursery' || (R.care === 'gran' && granny(L)))) help = 1;
    }
    if (W.mind) t -= 1;
    // (Help with small children only gives back the time small children take.)
    return Math.max(-3, t) + (small ? help : 0);
  });

  hooks.income.push((L, out) => {
    const s = L.s, W = s.wants;
    if (!W) return;
    const pt = L.partner(), r = pt && W.p[pt.id];
    if (r) {
      const f = first(pt);
      if (r.city) out.push([`What ${f} brings home from the city`, Math.round((r.city.n || price(L, r.city.mode === 'week' ? 1200 : 800)) * (r.city.up ? 1.6 : 1))]);
      const said = { band: `Royalties from ${r.band}’s record`, shop: `What ${r.shop ? r.shop.sign : 'the shop'} brings home`, near: `${f}’s wages from Kettleby`, part: `${f}’s share of the firm` };
      for (const [k, v] of Object.entries(r.inc || {})) if (v.until == null || v.until > s.t) out.push([said[k] || `What ${f} brings home`, v.n]);
    }
    const v = W.ven;
    if (v && v.st >= 1 && v.hp >= 50 && s.t >= (v.wait || 0)) out.push([`Your share of ${v.name}`, Math.round(v.stake * 0.04)]);
    for (const k of L.kids()) { const R = W.p[k.id]; if (R && R.rent && R.back > s.t) out.push([`Rent from ${first(k)}`, fee(L, 250)]); }
  });

  hooks.bills.push((L, out, jailed) => {
    const s = L.s, W = s.wants;
    if (!W || jailed) return;
    for (const q of s.people) {
      const R = W.p[q.id];
      if (!R) continue;
      if (q.kind === 'parent' && R.care && CARE[R.care].cost) {
        const n = fee(L, CARE[R.care].cost) / (R.care !== 'with' && halves(L) ? 2 : 1);
        out.push([{ carer: `A carer for ${first(q)}`, home: `Seaview House, for ${first(q)}`, with: `${first(q)}’s keep` }[R.care] + (R.care !== 'with' && halves(L) ? ' (your half)' : ''), Math.round(n)]);
      }
      if (q.kind === 'child' && q.age < 5 && R.care === 'nursery') out.push([`Bayview Nursery, for ${first(q)}`, fee(L, 600)]);
      if (q.kind === 'child' && R.back > s.t && !R.rent) out.push([`${first(q)}’s keep`, fee(L, 250)]);
      if (isLove(q) && R.sloan > s.t) out.push([`${first(q)}’s student loan`, price(L, 250)]);
    }
  });

  hooks.worth.push((L) => {
    const W = L.s.wants;
    if (!W) return 0;
    const v = W.ven;
    let n = v ? Math.round(v.stake * clamp(v.hp, 0, 100) / 70) : 0;
    const pt = L.partner(), r = pt && W.p[pt.id];
    if (r && r.biz && r.biz.stake && r.am && r.am.some((a) => a.id === 'shop' && a.out !== 'lost')) n += Math.round(r.biz.stake * clamp(r.biz.hp, 0, 100) / 70);
    return n;
  });

  if (hooks.seize) hooks.seize.push((L) => {
    const W = L.s.wants, v = W && W.ven;
    if (!v) return null;
    W.ven = null;
    return [`your share in ${v.name}`, Math.round(v.stake * 0.5)];
  });

  if (hooks.epitaph) hooks.epitaph.push((L, out) => {
    const s = L.s, W = s.wants;
    if (!W) return;
    const m = s.sex !== 'f', He = m ? 'He' : 'She';
    const list = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);
    for (const t of talesSaid(L, W.tales, list)) out.push(`${He} ${t}.`);
    // (Only those still doing it, by name; and "of the children" when not all of them did, so that it is true of each.)
    const made = L.kids().filter((k) => k.age >= 18 && W.p[k.id] && W.p[k.id].dream && (!W.p[k.id].hope || W.p[k.id].hope[1] === k.job));
    if (made.length) {
      const one = made.length === 1, k0 = made[0], said = `${list(made.map(first))} grew up to do exactly what ${one ? he(k0) : 'they'} said ${one ? he(k0) : 'they'} would at six`;
      out.push(made.length < L.kids().length ? `Of ${m ? 'his' : 'her'} children, ${said}.` : `${said}.`);
    }
  });

  // A partner who is away (on tour, at sea) cannot be taken out, or try for a baby.
  for (const id of ['out', 'baby']) {
    const a = A[id];
    if (!a) continue;
    const why = a.why;
    a.why = (L, p, x) => {
      if (p && L.s.wants && L.wantsAway(p)) { const n = L.s.wants.p[p.id].away - L.s.t; return `${first(p)} is away${n > 1 ? ` for another ${n} seasons` : ' until next season'}.`; }
      return why ? why(L, p, x) : null;
    };
  }

  Object.assign(TROPHIES, {
    wantsBehind: { name: 'In their corner', icon: '🫶', desc: 'See the one you love make a dream of their own come true.', test: (L) => !!L.s.wants && L.s.wants.n.amb >= 1 },
    wantsSilver: { name: 'Silver', icon: '🥈', desc: 'Reach your silver wedding anniversary.', test: (L) => !!L.s.wants && L.s.wants.f.silver === 1 },
    wantsGolden: { name: 'Golden', icon: '🥇', desc: 'Be married to the same person for fifty years.', test: (L) => !!L.s.wants && L.s.wants.f.golden === 1 },
    wantsProud: { name: 'Proud as Punch', icon: '🎓', desc: 'See a child of yours graduate, or qualify in a trade.', test: (L) => !!L.s.wants && L.s.wants.n.grad >= 1 },
    wantsPromise: { name: 'Just as they said', icon: '🌟', desc: 'A child grows up to be what they said they would be at six.', test: (L) => !!L.s.wants && L.s.wants.n.hopes >= 1 },
    wantsCared: { name: 'To the end', icon: '🫖', desc: 'Look after a parent yourself, at home, to the end.', test: (L) => !!L.s.wants && L.s.wants.n.cared >= 1 },
    wantsSpeech: { name: 'Do you do bookings?', icon: '🥂', desc: 'Bring the house down with a speech at a friend’s wedding.', test: (L) => !!L.s.wants && L.s.wants.n.speech >= 1 },
    wantsAngel: { name: 'Backer', icon: '📈', desc: 'Get back more than you put into a friend’s venture.', test: (L) => !!L.s.wants && !!L.s.wants.f.angel },
  });

  addEvents(WANT_CARDS);
}
