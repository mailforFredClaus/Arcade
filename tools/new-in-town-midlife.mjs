// New in Town: how the middle of a successful life goes. Plays careful,
// successful lives to 80 (a career climbed, a partner, children, a few close
// friends kept up, a home bought, every card answered sensibly) and prints,
// decade by decade, the mood, the bonds with the people close to you and
// what the life is worth: to see whether forty to sixty-five still has
// something to push against, or is a flat line.
// Usage: node tools/new-in-town-midlife.mjs [lives] [career] [--log] [--notes]
// (--log: the cards each life answered from 38 to 66; --notes: the big moments in its journal then;
// --passive: a life that takes nothing new on in its middle years, and only answers what comes.)

import { Life } from '../games/new-in-town/js/engine.js';
import { CAREERS, COURSES, STATS, cashShort } from '../games/new-in-town/js/data.js';

const N = Number(process.argv[2] || 6), CAREER = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'medicine';
const LOG = process.argv.includes('--log'), NOTES = process.argv.includes('--notes'), PASSIVE = process.argv.includes('--passive');

const TRAIN = {
  smarts: (L) => (L.s.cash > 3000 ? ['tutor'] : ['library']),
  fitness: (L) => (L.s.cash > 4000 ? ['trainer'] : L.s.cash > 600 ? ['workout'] : ['jog']),
  charm: (L) => (L.s.cash > 3000 ? ['round'] : ['chat']),
  craft: (L) => (L.s.cash > 800 ? ['artclass'] : ['cook']),
};
const CLOSE = ['partner', 'spouse', 'friend', 'child'];
const MID = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// Answers every card: the best odds it can comfortably afford (as the test players do).
function answer(L, seen) {
  let ev, n = 0;
  while ((ev = L.event())) {
    if (++n > 50) throw new Error(`card ${ev.id} never goes away`);
    const open = ev.opts.map((o, i) => ({ o, i })).filter(({ o }) => !o.why);
    const cheap = open.filter(({ o }) => o.cost <= Math.max(600, (L.s.cash + L.s.bank) * 0.15));
    const pool = cheap.length ? cheap : open;
    let pick = pool.slice().sort((a, b) => (b.o.chance ?? 0.75) - (a.o.chance ?? 0.75))[0];
    // (A passive life lets the itch of the middle years pass; an active one does something about it.)
    if (ev.id === 'midWobble') pick = PASSIVE ? open[open.length - 1] : open.find(({ o }) => /Marathon|band|Talk/.test(o.t)) || pick;
    if (seen && L.s.age >= 38 && L.s.age <= 66) seen.push(`${L.s.age}: ${ev.title} -> ${pick.o.t}${pick.o.cost ? ` (${cashShort(pick.o.cost)})` : ''}`);
    const r = L.choose(pick.i);
    if (!r.ok) throw new Error(`card ${ev.id}: ${r.why}`);
  }
}

function live(seed) {
  const bg = { smarts: 'bookworm', fitness: 'athlete', charm: 'charmer', craft: 'maker' }[CAREERS[CAREER].stats[0]];
  const L = Life.create({ seed, name: 'Nell Careful', bg, sex: seed % 2 ? 'f' : 'm' });
  const s = L.s, car = CAREERS[CAREER], rows = [], cards = [];
  const go = (id, x) => { if (id === 'work' && L.playDue()) { id = 'workPlay'; x = 0.75; } const r = L.act(id, x); if (r.ok) answer(L, cards); return r.ok; };
  let guard = 0;
  while (!s.dead && s.age < 80) {
    if (++guard > 400) break;
    answer(L, cards);
    if (s.dead) break;
    if (s.ill && !L.can('treat')) go('treat');
    if (!s.items.bike && !s.items.car && s.cash > 1200) go('buy', 'bike');
    if (!s.items.car && !s.items.sportscar && s.cash > 20000 && L.motorPlan) { const step = L.motorPlan(); if (step) go(...step); }
    // A home: rent, then buy, then trade up as the money comes.
    if (s.home === 'hostel' && s.cash > 4000) go('rentHome', 'bedsit');
    if (s.home === 'bedsit' && s.cash > 12000) go('rentHome', 'flat');
    const worth = s.cash + s.bank;
    if (!s.owned && worth > 120000) go('buyHome', { id: 'cottage', trade: false });
    if (s.owned && s.home === 'cottage' && worth > 500000) go('buyHome', { id: 'townhouse', trade: true });
    if (s.owned && s.home === 'townhouse' && worth > 1500000) go('buyHome', { id: 'villa', trade: true });
    if (s.debt > 0 && s.cash > 6000) go('repay', Math.min(s.debt, s.cash - 3000));
    // The career: the next rung, and what it needs.
    if (!(s.job && s.job.c === CAREER) && !L.can('apply', CAREER) && !s.retired) go('apply', CAREER);
    else if (!s.job && !s.retired && s.age < 65) { const any = ['kitchen', 'retail', 'trades', 'medicine'].find((c) => !L.can('apply', c)); if (any) go('apply', any); }
    if (s.job && s.age >= 66 && !L.can('retire')) go('retire');
    const now = s.job && s.job.c === CAREER;
    const want = now ? (car.rungs[s.job.r + 1] || { need: {} }).need : car.rungs[0].need;
    const course = want.edu && !L.hasEdu(want.edu) ? want.edu : want.degree && !L.hasDegree() ? 'business' : null;
    if (course && !s.course) { const pre = COURSES[course].need.edu; go('enrol', { id: pre && !L.hasEdu(pre) ? pre : course, loan: s.cash < 5000 }); }
    // Love and family.
    const pt = L.partner();
    if (!pt && s.age >= 21) { const f = L.friends().find((p) => p.single && L.fancy(p) && p.bond >= 30); if (f) go('askout', f.id); }
    if (pt && pt.kind === 'partner' && !pt.live && pt.bond >= 60) go('movein', pt.id);
    if (pt && pt.kind === 'partner' && pt.bond >= 75 && !pt.eng) { if (!s.items.ring) go('buy', 'ring'); go('propose', pt.id); }
    if (pt && L.kids().length < 2 && s.age >= 26 && s.age <= 40 && !s.due) go('baby', pt.id);
    // The middle years: when the same week keeps coming round, take something on (the ward, a
    // trust, a year out), and see it through.
    if (!PASSIVE && s.mid && s.mid.rut >= 3 && !(s.mid.seat && s.t < s.mid.seat.until) && !s.mid.trust && !(s.mid.sab && s.t < s.mid.sab.until)) {
      if (!L.can('midStand')) go('midStand');
      else if (s.cash + s.bank > L.midTrustCost() * 3 && !L.can('midFound', 'sail')) go('midFound', 'sail');
      else if (!L.can('midYearOut', 'travel')) go('midYearOut', 'travel');
    }
    if (s.mid) { go('midCouncil'); if (s.mid.trust && s.t % 4 === 2) go('midChair'); go('midTrain'); go('midRehearse'); }
    // The season's time.
    let shifts = 0, outs = 0;
    for (let i = 0; i < 14 && s.time > 0 && !s.dead; i++) {
      if (s.health < 45) { if (!go('rest')) break; continue; }
      if (s.happy < 35) { if (!go('bench')) break; continue; }
      if (s.job && shifts < 2 && s.time >= 2) { if (go('work')) { shifts++; continue; } }
      if (s.course && s.course.exam && go('exam')) continue;
      if (s.course && s.time >= 2 && go('class')) continue;
      const short = STATS.find((k) => want[k] && s.st[k] < want[k]);
      if (short && TRAIN[short](L).some((id) => go(id))) continue;
      // Friends: make a few, then keep them.
      if (L.friends().length < 5 && go(s.cash > 3000 ? 'round' : 'chat')) continue;
      // Time with whoever close has been left longest (the partner first).
      if (outs < 2) {
        const close = s.people.filter((p) => CLOSE.includes(p.kind) && (p.kind !== 'child' || p.age >= 18)).sort((a, b) => (a === pt ? -1 : b === pt ? 1 : a.bond - b.bond));
        const young = L.kids().find((k) => k.age < 18 && k.age >= 2);
        if (young && outs === 0 && go('kid', { p: young.id, a: 'read' })) { outs++; continue; }
        if (close.length && go('out', { p: close[0].id, a: close[0] === pt ? 'dinner' : 'walk' })) { outs++; continue; }
      }
      if (s.people.some((p) => p.kind === 'parent' && p.bond < 50) && go('call', s.people.find((p) => p.kind === 'parent' && p.bond < 50).id)) continue;
      if (s.job && shifts < 3 && s.time >= 2 && go('work')) { shifts++; continue; }
      if (!go('rest')) break;
    }
    // Presents for everybody, and a party when there is money for one: they cost no time.
    for (const p of s.people.slice()) if (CLOSE.includes(p.kind) || p.kind === 'parent') if (s.cash + s.bank > 3000) go('gift', p.id);
    if (s.cash + s.bank > 8000) go('party');
    if (s.cash > 30000) go('deposit', s.cash - 15000);
    if (s.dead) break;
    const close = s.people.filter((p) => CLOSE.includes(p.kind) && (p.kind !== 'child' || p.age >= 6));
    rows.push({ age: s.age, mood: s.happy, worth: L.netWorth(), bonds: close.map((p) => p.bond), friends: L.friends().length, rut: s.mid ? (L.midRut ? L.midRut() : 0) : 0, base: L.moodBase() });
    L.endSeason();
  }
  return { L, rows, cards };
}

const decades = [[18, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 79]];
const all = [];
for (let i = 0; i < N; i++) {
  const r = live(4100 + i * 13);
  all.push(r);
  if (LOG) {
    console.log(`\nLife ${i + 1}: ${r.L.s.name}, died ${r.L.s.dead ? `at ${r.L.s.dead.age} of ${r.L.s.dead.cause}` : 'no'}; cards from 38 to 66:`);
    for (const c of r.cards) console.log(`  ${c}`);
  }
  if (NOTES) {
    console.log(`\nLife ${i + 1}: the big moments from 38 to 66:`);
    for (const e of r.L.s.log) if (e.a >= 38 && e.a <= 66 && (e.k === 'big' || e.k === 'love')) console.log(`  ${e.a}: ${e.t.slice(0, 120)}`);
  }
}
const avg = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : NaN);
const pct = (l, p) => { const q = l.slice().sort((a, b) => a - b); return q.length ? q[Math.min(q.length - 1, Math.floor(p * q.length))] : NaN; };
console.log(`${N} careful lives in ${CAREER}, by decade (the average of every season in it, across the lives):`);
console.log('  ages     mood (low-high)    close bonds (low)  at 95+   friends  same again  worth at the end');
for (const [a, b] of decades) {
  const rs = all.flatMap((r) => r.rows.filter((x) => x.age >= a && x.age <= b));
  if (!rs.length) continue;
  const moods = rs.map((x) => x.mood), bonds = rs.flatMap((x) => x.bonds);
  const hi = avg(rs.map((x) => (x.bonds.length ? x.bonds.filter((v) => v >= 95).length / x.bonds.length : 0)));
  const ends = all.map((r) => r.rows.filter((x) => x.age === b).slice(-1)[0]).filter(Boolean).map((x) => x.worth);
  console.log(`  ${a}-${b}    ${avg(moods).toFixed(0).padStart(3)} (${pct(moods, 0.1).toFixed(0)}-${pct(moods, 0.9).toFixed(0)})${''.padEnd(8)}${avg(bonds).toFixed(0).padStart(3)} (${pct(bonds, 0.1).toFixed(0)})${''.padEnd(9)}${(hi * 100).toFixed(0).padStart(3)}%    ${avg(rs.map((x) => x.friends)).toFixed(1).padStart(4)}     ${avg(rs.map((x) => x.rut)).toFixed(1).padStart(4)}       ${cashShort(pct(ends, 0.5))}`);
}
// How much the mood moves in the middle of life: the spread from season to season.
const mid = all.map((r) => r.rows.filter((x) => x.age >= 40 && x.age <= 65).map((x) => x.mood));
const swing = avg(mid.map((m) => Math.max(...m) - Math.min(...m)));
const sd = avg(mid.map((m) => { const a = avg(m); return Math.sqrt(avg(m.map((v) => (v - a) ** 2))); }));
const midCards = avg(all.map((r) => r.cards.length));
console.log(`  40-65: mood ranges over ${swing.toFixed(0)} points in a life (spread ${sd.toFixed(1)}); ${midCards.toFixed(0)} cards answered from 38 to 66; died at ${all.map((r) => (r.L.s.dead ? r.L.s.dead.age : '80+')).join(', ')}`);
