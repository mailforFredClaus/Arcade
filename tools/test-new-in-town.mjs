// Checks New in Town's rules: time and money, skills, jobs and promotions,
// courses, moving house, the bank, people, events and the end of a life.
// Then practice players live whole lives: one sets out to climb each career
// (which proves every ladder can be climbed), and one does things at random
// (which proves nothing it can do breaks the game). After every action the
// numbers are checked, and the same seed must always give the same life.
// Usage: node tools/test-new-in-town.mjs [lives per career] [random lives]

import { Life, ACTIONS, money, cashShort } from '../games/new-in-town/js/engine.js';
import { EVENTS } from '../games/new-in-town/js/events.js';
import {
  STATS, PLACES, CAREERS, SHIFTS_FOR_RUNG, COURSES, HOMES, ITEMS, TRIPS, STOCKS, PROPS, PETS, DREAMS, QUESTS, TROPHIES, RIBBONS, BACKGROUNDS,
} from '../games/new-in-town/js/data.js';

const perCareer = Number(process.argv[2] || 12), randomLives = Number(process.argv[3] || 60);
let failures = 0;
const check = (ok, what) => {
  if (!ok) {
    failures++;
    console.log(`FAIL: ${what}`);
  }
};
const fresh = (o = {}) => Life.create({ seed: 7, name: 'Test', ...o });

// ---- the lists hang together ------------------------------------------------------------

{
  for (const [id, c] of Object.entries(CAREERS)) {
    check(PLACES[c.place], `${id}: works at a real place`);
    check(c.rungs.length >= 5 && c.rungs.length <= SHIFTS_FOR_RUNG.length, `${id}: five or six rungs`);
    check(c.stats.every((k) => STATS.includes(k)), `${id}: trains real skills`);
    c.rungs.forEach((r, i) => {
      check(i === 0 || r.pay > c.rungs[i - 1].pay, `${id}: ${r.title} pays more than the rung below`);
      check(!r.need.edu || COURSES[r.need.edu], `${id}: ${r.title} asks for a real course`);
      check(!r.need.item || ITEMS[r.need.item], `${id}: ${r.title} asks for a real thing`);
    });
  }
  for (const [id, c] of Object.entries(COURSES)) check(!c.need.edu || COURSES[c.need.edu], `${id}: builds on a real course`);
  for (const [id, it] of Object.entries(ITEMS)) check(PLACES[it.at], `${id}: sold at a real place`);
  for (const a of Object.values(ACTIONS)) check(a.place == null || typeof a.place === 'function' || PLACES[a.place], `${a.id}: happens at a real place`);
  for (const id of Object.keys(PLACES)) check(fresh().placeActions(id).length > 0 || id === 'labs', `${id}: has something to do`);
  const ids = new Set();
  for (const e of EVENTS) {
    check(!ids.has(e.id), `event ${e.id}: only one of that name`);
    ids.add(e.id);
    check(e.opts && e.opts.length > 0 && e.opts.every((o) => o.t && (o.run || e.opts.length === 1)), `event ${e.id}: has choices that do something`);
  }
  for (const id of ['marlow1', 'marlow2', 'marlow3', 'busted', 'dumped', 'divorce', 'wedding', 'baby', 'kid18', 'grandchild', 'parentDies', 'spouseDies', 'petDies', 'sportsRetire', 'birthday30', 'birthday50', 'birthday100', 'bailiffs', 'bust']) check(ids.has(id), `the rules send for event ${id}, and it exists`);
  check(RIBBONS[RIBBONS.length - 1].test(fresh()), 'the last ribbon fits any life');
  check(Object.keys(DREAMS).length >= 6 && QUESTS.length >= 8 && Object.keys(TROPHIES).length >= 30, 'plenty of dreams, to-dos and trophies');
  check(money(1234.4) === '$1,234' && money(-50) === '−$50' && cashShort(1250000) === '$1.25M' && cashShort(340000) === '$340k', 'money is written out properly');
}

// ---- starting out -----------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  check(s.age === 18 && s.t === 0 && L.season === 0 && s.cash === 1500 && s.home === 'hostel' && !s.job, 'starts at 18, in spring, in the hostel, with $1,500 and no job');
  check(s.time === 6 && L.timeMax() === 6, 'six blocks of time a season to begin with');
  check(STATS.every((k) => s.st[k] >= 14 && s.st[k] <= 20), 'every skill starts low: an all-rounder\u2019s are between 14 and 20');
  check(s.dreams.length === 3 && new Set(s.dreams).size === 3, 'three different dreams');
  check(s.people.length === 2 && s.people.every((p) => p.kind === 'parent'), 'a mum and dad back home');
  const B = fresh({ bg: 'bookworm' }), S = fresh({ bg: 'saver' });
  check(B.s.st.smarts === s.st.smarts + 8 && B.s.st.craft === s.st.craft - 4 && S.s.cash === 4500, 'a background gives what it says');
  const H = fresh({ heir: 'star', inherit: 5000, gen: 2, parent: { name: 'Old Sam', age: 70 } });
  check(H.s.items.guitar && H.s.cash === 6500 && H.s.gen === 2 && H.s.people.length === 1 && H.s.people[0].name === 'Old Sam', 'a later generation brings its heirloom, its inheritance and a parent');
  check(JSON.stringify(fresh().s) === JSON.stringify(fresh().s), 'the same seed starts the same life');
  check(JSON.stringify(Life.create({ seed: 8, name: 'Test' }).s) !== JSON.stringify(fresh().s), 'a different seed starts a different one');
}

// ---- time, skills and money -------------------------------------------------------------

{
  const L = fresh();
  const s = L.s, before = s.st.smarts;
  const r = L.act('library');
  check(r.ok && s.time === 5 && s.st.smarts > before + 1.5, 'studying takes a block of time and raises Smarts');
  check(r.changes.some((c) => c.k === 'smarts' && c.d > 0) && r.text.length > 0, 'an action says what it did and what changed');
  s.st.smarts = 90;
  const hi = s.st.smarts;
  L.act('library');
  check(s.st.smarts - hi < 0.5 && s.st.smarts > hi, 'skills grow far more slowly near the top');
  s.time = 0;
  check(!L.act('library').ok && L.can('library').includes('time'), 'no time, no action');
  s.time = 6; s.cash = 10;
  check(!L.act('workout').ok && s.cash === 10 && s.time === 6, 'cannot do what you cannot pay for, and nothing is taken');
  s.cash = 1000;
  L.act('buy', 'bike');
  check(s.items.bike && s.cash === 600 && s.time === 7 && L.timeMax() === 7, 'a bicycle gives a seventh block of time, straight away');
  check(!L.act('buy', 'bike').ok, 'one bicycle is enough');
  s.cash = 100000;
  L.act('buy', 'car');
  check(L.timeMax() === 8 && s.time === 8, 'a car makes it eight');
  s.st.smarts = 100; L.gain('smarts', 50);
  check(s.st.smarts === 100, 'no skill goes past 100');
  L.joy(500); L.hp(500);
  check(s.happy === 100 && s.health <= 100, 'mood and health stop at 100');
}

// ---- work -------------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.quest = QUESTS.length; // (so the to-do list's rewards don't muddy the sums)
  check(L.can('apply', 'tech') && L.can('apply', 'tech').includes('Smarts'), 'a job with an entry bar says what is missing');
  check(L.act('apply', 'kitchen').ok && s.job.c === 'kitchen' && s.job.r === 0 && s.time === 5, 'anyone can start as a pot washer; applying takes time');
  check(L.placeActions('pub')[0].id === 'work', 'your job shows first at the place you work');
  const cash = s.cash;
  const r = L.act('work');
  check(r.ok && s.cash === cash + 1300 && s.time === 3 && s.n.shifts === 1, 'a shift pays the rung’s wage and takes two blocks');
  // Promotion needs both the shifts and the skills.
  s.st.charm = 5;
  for (let i = 0; i < SHIFTS_FOR_RUNG[1]; i++) { s.time = 2; s.use = {}; L.act('work'); }
  check(s.job.r === 0, 'no promotion without the skill, however many shifts');
  const next = L.nextRung();
  check(next.title === 'Waiter' && !next.ready && next.list.some((n) => !n.ok && n.text.includes('Charm')), 'the next rung lists what is still needed');
  s.st.charm = 25; s.time = 2; s.use = {};
  const up = L.act('work');
  check(s.job.r === 1 && s.job.n === 0 && s.f.promoted && up.news.some((n) => n.kind === 'promo'), 'with the skill, the next shift brings the promotion');
  // Too many shifts in one season costs health.
  const hp = s.health;
  for (let i = 0; i < 4; i++) { s.time = 2; L.act('work'); }
  check(s.health < hp, 'more than three shifts a season wears you down');
  // Courses gate some rungs.
  s.job = { c: 'kitchen', r: 2, n: 99 }; s.st.craft = 99; s.st.charm = 99; s.time = 2; s.use = {};
  L.act('work');
  check(s.job.r === 2, 'Sous Chef needs the culinary certificate');
  s.edu.culinary = 20; s.time = 2; s.use = {};
  L.act('work');
  check(s.job.r === 3, 'and with it, up you go');
  // Leaving and coming back.
  L.act('quit');
  check(!s.job, 'you can hand in your notice');
  s.time = 6;
  L.act('apply', 'kitchen');
  check(s.job.r === 3, 'going back to a career picks up where you left off');
  s.record = 1;
  check(L.can('apply', 'police') === 'Not with your record.', 'the police will not take you with a record');
  s.record = 0; s.age = 66; s.time = 6;
  check(L.placeActions('townhall').some((a) => a.id === 'retire'), 'at 65 you can retire');
  L.act('retire');
  check(!s.job && s.retired && s.pension > 0, 'retiring swaps the job for a pension');
}

// ---- study ------------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.quest = QUESTS.length;
  check(L.can('enrol', 'medicine').includes('Smarts'), 'medicine needs Smarts');
  check(L.can('enrol', 'nursing') !== null, 'nursing needs first aid first');
  check(L.act('enrol', 'firstaid').ok && s.course.id === 'firstaid', 'anyone can sign up for first aid');
  check(L.can('enrol', 'culinary') === 'One course at a time.', 'one course at a time');
  const cash = s.cash;
  L.act('class');
  check(s.cash === cash - 200 && s.time === 4 && s.course.p === 1, 'a class costs its fee and two blocks');
  const r = L.act('class');
  check(s.edu.firstaid && !s.course && r.news.some((n) => n.text.includes('First Aid')), 'the last class earns the certificate');
  check(!L.hasDegree(), 'a certificate is not a degree');
  s.edu.business = 30;
  check(L.hasDegree(), 'a business degree is');
}

// ---- home and the bank ------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.quest = QUESTS.length;
  s.cash = 5000;
  check(L.act('move', { id: 'bedsit', buy: false }).ok && s.home === 'bedsit' && s.cash === 4400 && !s.owned, 'moving into a rented place costs half a season’s rent');
  check(L.can('move', { id: 'bedsit', buy: true }) === 'Not on offer.', 'the bedsit cannot be bought');
  check(L.can('move', { id: 'flat', buy: true }).includes('deposit'), 'buying needs a fifth down');
  s.cash = 40000;
  const price = L.homePrice('flat');
  check(L.act('move', { id: 'flat', buy: true }).ok && s.owned && s.home === 'flat', 'with the deposit you can buy');
  check(s.cash === 40000 - price * 0.2 && s.debt === price * 0.8, 'a fifth comes from cash and the bank lends the rest');
  check(L.netWorth() === 40000, 'buying a home does not change what you are worth');
  check(L.bills().some(([what]) => what === 'Loan interest') && !L.bills().some(([what]) => what === 'Rent'), 'an owner pays loan interest and upkeep, not rent');
  s.cash = 500000;
  L.act('move', { id: 'cottage', buy: true });
  check(s.home === 'cottage' && s.owned && s.debt === price * 0.8, 'trading up: the old place is sold and the new one bought outright if you can');
  L.act('move', { id: 'bedsit', buy: false });
  check(!s.owned && s.debt === 0, 'selling up pays off the loan');

  s.cash = 5000; s.bank = 0; s.debt = 0;
  L.act('deposit', 3000);
  check(s.cash === 2000 && s.bank === 3000, 'money can be paid into savings');
  check(!L.act('deposit', 9999).ok && !L.act('withdraw', 9999).ok, 'but only what you have');
  const lim = L.creditLimit();
  check(!L.act('borrow', lim + 1).ok && L.act('borrow', 1000).ok && s.debt === 1000 && s.cash === 3000, 'the bank lends up to a limit');
  L.act('repay', 1000);
  check(s.debt === 0, 'and can be paid back');
  const p = s.stk.p.GULL;
  L.act('shares', { sym: 'GULL', n: 10 });
  check(s.stk.own.GULL === 10 && s.cash === 2000 - Math.ceil(10 * p), 'shares cost their price');
  L.act('sellShares', { sym: 'GULL', n: 10 });
  check(!s.stk.own.GULL && s.cash >= 2000 - 1, 'and sell for it');
  // Spending past your cash dips into savings, then the overdraft.
  s.cash = 100; s.bank = 500; s.debt = 0;
  L.cash(-1000);
  check(s.cash === 0 && s.bank === 0 && s.debt === 400, 'a bill you cannot cover takes savings first, then goes on a loan');
}

// ---- the turn of the season -------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.quest = QUESTS.length;
  s.bank = 10000;
  const r = L.endSeason();
  check(s.t === 1 && L.season === 1 && s.age === 18 && !r.birthday, 'spring turns to summer');
  check(s.bank === 10100, 'savings earn one per cent a season');
  check(s.cash === 1500 - 500 - 700, 'rent and food come out');
  check(s.time === L.timeMax() && Object.keys(s.use).length === 0, 'a new season brings fresh time');
  L.endSeason(); L.endSeason();
  const b = L.endSeason();
  check(b.birthday && s.age === 19 && L.season === 0 && L.year === 2, 'four seasons make a year, and a birthday');
  // Time left over is rest.
  const A = fresh(), B = fresh();
  A.s.health = B.s.health = 50; A.s.happy = B.s.happy = 50;
  B.s.time = 0;
  A.endSeason(); B.endSeason();
  check(A.s.health > B.s.health && A.s.happy > B.s.happy, 'unused time does you good');
  // Going broke.
  const C = fresh();
  C.s.quest = QUESTS.length;
  C.s.cash = 0;
  C.endSeason();
  check(C.s.debt === 1200 && C.s.cash === 0, 'bills you cannot pay go on the overdraft');
  C.s.debt = 500000; C.s.pend = [];
  C.endSeason();
  check(C.s.f.bust && C.s.debt === 0 && C.event().id === 'bust', 'owe far more than you could ever cover and you go bankrupt');
  check(C.can('borrow', 500).includes('bankruptcy'), 'after which the bank will not lend for a while');
  C.s.t += 20;
  check(C.can('borrow', 500) === null, 'but it forgets in the end');
  const D = fresh();
  D.s.cash = 600000; D.act('move', { id: 'flat', buy: true }); D.s.cash = 5000; D.s.debt = 130000; D.s.pend = [];
  D.endSeason();
  check(!D.s.owned && D.s.debt < 5000 && !D.s.f.bust && D.event().id === 'bailiffs', 'owe too much with a house to your name and the bank sells it');
}

// ---- people -----------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  const p = L.meet({ spark: true, bond: 50 });
  check(s.people.includes(p) && p.kind === 'friend' && L.takeNews().some((n) => n.text.includes(p.name)), 'meeting someone adds a friend');
  const b = p.bond;
  check(L.act('hang', p.id).ok && p.bond > b && s.time === 5, 'time together brings you closer');
  check(L.act('gift', p.id).ok && !L.act('gift', p.id).ok, 'one present a season');
  s.st.charm = 100; p.bond = 100;
  L.act('askout', p.id);
  check(p.kind === 'partner' && L.partner() === p, 'ask the right person and you are a couple');
  check(L.can('movein', p.id).includes('hostel'), 'nobody moves into a hostel bunk');
  s.home = 'flat';
  L.act('movein', p.id);
  check(p.live && L.bills().find(([what]) => what === 'Rent')[1] < HOMES.flat.rent, 'living together shares the rent');
  check(L.can('propose', p.id).includes('ring'), 'a proposal needs a ring');
  s.items.ring = 1; s.cash = 99999; p.bond = 100;
  L.act('propose', p.id);
  check(p.eng && !s.items.ring, 'a yes uses up the ring');
  L.endSeason();
  s.pend = s.pend.filter((e) => e.id === 'wedding');
  check(L.event().id === 'wedding' && L.event().opts.length === 4, 'the wedding comes next season');
  L.choose(0);
  check(p.kind === 'spouse' && s.f.wed, 'and then you are married');
  s.time = 6; s.pend = [];
  // A baby.
  let tries = 0;
  while (!s.due && tries++ < 40) { s.time = 6; L.act('baby', p.id); }
  check(s.due && s.due.t === s.t + 3, 'a baby takes three seasons to arrive');
  for (let i = 0; i < 3; i++) { s.pend = []; L.endSeason(); }
  s.pend = s.pend.filter((e) => e.id === 'baby');
  check(L.event() && L.event().id === 'baby', 'then there is a name to choose');
  const name = L.event().opts[1].t;
  L.choose(1);
  check(L.kids().length === 1 && L.kids()[0].name === name && L.timeMax() < 8, 'the baby has the name you chose, and takes up your time');
  check(L.bills().some(([what]) => what === 'Raising a child'), 'children cost money');
  check(L.can('move', { id: 'bedsit', buy: false }) === 'No room for the children there.', 'you cannot move somewhere too small for the family');
  // Neglect.
  const f = L.meet({ bond: 3 });
  s.pend = [];
  L.endSeason(); L.endSeason();
  check(!s.people.includes(f), 'a friend you never see drifts away');
  // Divorce.
  const cash = s.cash + s.bank;
  L.split(p, true);
  check(!L.partner() && s.cash + s.bank < cash * 0.61 + 1, 'a divorce costs two fifths of your money');
}

// ---- events -----------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.quest = QUESTS.length;
  L.queue('wallet');
  const ev = L.event();
  check(ev.id === 'wallet' && ev.opts.length === 2 && ev.opts[0].chance === null, 'an event shows its choices');
  const cash = s.cash;
  const r = L.choose(1);
  check(r.ok && s.cash === cash + 320 && s.karma < 0 && !L.event() && r.text.length > 0, 'a choice does what it says');
  check(s.log[s.log.length - 1].t.startsWith('A lost wallet'), 'and goes in the journal');
  L.queue('gull');
  s.st.fitness = 35;
  check(Math.abs(L.event().opts[0].chance - 0.5) < 1e-9 && L.event().opts[0].stat === 'fitness', 'a test of skill shows its odds: even when the skill meets the bar');
  s.st.fitness = 95;
  check(L.event().opts[0].chance === 0.95, 'never better than 95 in 100');
  s.pend = [];
  L.queue('scratch'); s.cash = 5; s.bank = 0;
  check(L.event().opts[0].why && !L.choose(0).ok && L.choose(1).ok, 'a choice you cannot afford cannot be taken');
  L.queue('dumped', 999);
  check(!L.event(), 'an event about someone who has gone is dropped');
  L.queue('row');
  check(!L.event(), 'and so is a row with a partner you do not have');
  // Old Marlow's story.
  const M = fresh();
  M.s.items.rod = 1; M.s.st.craft = 100;
  M.act('marlow');
  check(M.event().id === 'marlow1', 'old Marlow is on the pier');
  M.choose(0);
  check(M.s.f.marlow === 1, 'help with the nets (with good hands) and he warms to you');
  M.s.use = {}; M.act('marlow'); M.choose(0);
  check(M.s.f.marlow === 2, 'then he teaches you to fish');
  M.s.use = {}; M.s.n.fish = 15; M.s.karma = 20; M.act('marlow');
  check(M.event().id === 'marlow3' && M.event().opts[0].t.startsWith('Accept'), 'and at last he offers his boat to a friend');
  M.choose(0);
  check(M.s.items.boat && M.s.f.marlow === 3, 'the Peggy Sue is yours');
  // Getting caught.
  const J = fresh();
  J.s.job = { c: 'kitchen', r: 1, n: 0 }; J.s.record = 1; J.s.home = 'bedsit';
  J.queue('busted');
  J.choose(0);
  check(J.s.record === 2 && J.s.f.jailed && !J.s.job && J.s.t === 2 && J.s.home === 'hostel' && J.s.time === J.timeMax(), 'a second offence is two seasons inside: job gone, room gone');
}

// ---- the casino -------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.cash = 1e7;
  let back = 0;
  let three = true;
  for (let i = 0; i < 20000; i++) { const r = L.act('slots', 50); back += r.out.win; three = three && r.out.reels.length === 3; }
  check(three, 'three reels every spin');
  const rtp = back / (20000 * 50);
  check(rtp > 0.6 && rtp < 1, `the slots pay back less than they take (${(rtp * 100).toFixed(0)}%)`);
  check(s.time === 6, 'gambling takes no time');
  check(!L.act('slots', 77).ok, 'only the stakes on offer');
  L.act('hiloStart', 500);
  check(s.hilo && s.hilo.pot === 500 && !L.act('hiloStart', 500).ok, 'one hand of Higher or Lower at a time');
  s.hilo.card = 1;
  check(!L.act('hiloGuess', 'lo').ok && L.hiloOdds('hi') === 12 / 13, 'nothing is lower than an ace');
  const cash = s.cash;
  L.act('hiloCash');
  check(!s.hilo && s.cash === cash + 500, 'cashing out returns the pot');
  let won = 0, lost = 0;
  for (let i = 0; i < 4000; i++) {
    L.act('hiloStart', 50);
    const dir = s.hilo.card <= 7 ? 'hi' : 'lo';
    const r = L.act('hiloGuess', dir);
    if (r.out.lost) lost++; else { won += s.hilo.pot; L.act('hiloCash'); }
  }
  check(won / (4000 * 50) > 0.85 && won / (4000 * 50) < 1.02, `Higher or Lower is close to fair (${(won / 2000).toFixed(0)}%)`);
  check(lost > 500, 'and can be lost');
}

// ---- the end ----------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.health = 1; s.ill = { name: 'heart trouble', sev: 3 };
  L.endSeason();
  check(s.dead && s.dead.cause === 'heart trouble' && !L.event() && !L.act('library').ok && L.endSeason() === null, 'when health runs out the life is over, and nothing more can be done');
  const o = L.obituary();
  check(o.ribbon.id === 'young' && o.age === 18 && o.inherit >= 0 && o.score > 0 && o.heir === null, 'a short life gets its ribbon');
  const T = fresh();
  T.s.age = 80; T.s.cash = 2e7; T.s.people.push({ id: 50, name: 'Kit', kind: 'child', bond: 80, age: 40, trait: 'kind', look: T.randomLook() });
  T.die('old age');
  const ob = T.obituary();
  check(ob.ribbon.id === 'tycoon' && ob.inherit === 150000 && ob.heir.name === 'Kit', 'a tycoon leaves a child the most that can be inherited');
  const U = fresh();
  U.s.age = 120;
  U.endSeason(); U.endSeason(); U.endSeason(); U.endSeason();
  check(U.s.dead && U.s.dead.cause === 'old age', 'nobody lives for ever');
  const I = fresh();
  I.s.ill = { name: 'flu', sev: 1 }; I.s.health = 30;
  for (let i = 0; i < 8 && I.s.ill; i++) { I.s.pend = []; I.s.ill = { name: 'flu', sev: 1 }; I.endSeason(); }
  check(!I.s.dead, 'flu alone does not kill');
}

// ---- practice players -------------------------------------------------------------------

const sane = (L, after) => {
  const s = L.s;
  const nums = [s.cash, s.bank, s.debt, s.health, s.happy, s.time, s.fame, s.idx, ...STATS.map((k) => s.st[k])];
  if (!nums.every((v) => Number.isFinite(v) && v >= -1e-6)) throw new Error(`a number went wrong after ${after}: ${JSON.stringify(nums)}`);
  if (STATS.some((k) => s.st[k] > 100) || s.happy > 100 || s.health > 100 || s.fame > 100) throw new Error(`a number went over 100 after ${after}`);
  if (Math.abs(s.karma) > 100) throw new Error(`karma out of range after ${after}`);
  if (!HOMES[s.home] || (s.job && !CAREERS[s.job.c].rungs[s.job.r])) throw new Error(`a home or job that does not exist after ${after}`);
};

// Answers every card that is waiting: sensibly (the best odds it can afford) or at random.
function answer(L, wild) {
  let ev, n = 0;
  while ((ev = L.event())) {
    if (++n > 50) throw new Error(`event ${ev.id} never goes away`);
    const open = ev.opts.map((o, i) => ({ o, i })).filter(({ o }) => !o.why);
    if (!open.length) throw new Error(`event ${ev.id} has no choice that can be taken`);
    let pick;
    if (wild) pick = open[Math.floor(L.rnd() * open.length)];
    else {
      const cheap = open.filter(({ o }) => o.cost <= Math.max(600, L.s.cash * 0.15));
      const pool = cheap.length ? cheap : open;
      pick = pool.slice().sort((a, b) => (b.o.chance ?? 0.75) - (a.o.chance ?? 0.75))[0];
    }
    const r = L.choose(pick.i);
    if (!r.ok) throw new Error(`event ${ev.id}: ${r.why}`);
    sane(L, `event ${ev.id}`);
  }
}

const TRAIN = {
  smarts: (L) => (L.s.cash > 3000 ? ['tutor'] : ['library']),
  fitness: (L) => (L.s.cash > 4000 ? ['trainer'] : L.s.cash > 600 ? ['workout'] : ['jog']),
  charm: (L) => (L.s.cash > 3000 ? ['round'] : ['chat']),
  craft: (L) => (L.s.cash > 800 ? ['artclass'] : L.s.items.guitar ? ['practise'] : ['cook']),
};

// Lives a life aiming for the top of one career. Returns the Life at its end.
function climber(seed, target) {
  const bg = { smarts: 'bookworm', fitness: 'athlete', charm: 'charmer', craft: 'maker' }[CAREERS[target].stats[0]];
  const L = Life.create({ seed, name: 'Climber', bg });
  const s = L.s, car = CAREERS[target];
  const go = (id, x) => { const r = L.act(id, x); if (r.ok) { sane(L, id); answer(L, false); } return r.ok; };
  let guard = 0, topAt = null;
  while (!s.dead) {
    if (++guard > 500) throw new Error('a life that never ends');
    answer(L, false);
    if (s.dead) break;
    // The basics.
    if (s.ill && !L.can('treat')) go('treat');
    if (!s.items.bike && !s.items.car && s.cash > 1200) go('buy', 'bike');
    if (!s.items.car && s.cash > 20000) go('buy', 'car');
    if (s.home === 'hostel' && s.cash > 4000) go('move', { id: 'bedsit', buy: false });
    if (s.home === 'bedsit' && s.cash > 12000 && s.job && s.job.r >= 2) go('move', { id: 'flat', buy: false });
    if (s.cash > 6000 && s.debt > 0) go('repay', Math.min(s.debt, s.cash - 3000));
    // What the next step needs: the next rung, or the first one if not in yet.
    const inIt = s.job && s.job.c === target;
    if (!inIt && !L.can('apply', target)) go('apply', target);
    else if (!s.job && !s.retired) {
      const any = ['kitchen', 'retail', 'trades', 'medicine', 'sports', 'politics'].find((c) => !L.can('apply', c));
      if (any) go('apply', any);
    }
    const now = s.job && s.job.c === target;
    const want = now ? (car.rungs[s.job.r + 1] || { need: {} }).need : car.rungs[0].need;
    if (now && s.job.r === car.rungs.length - 1 && topAt === null) topAt = s.age;
    if (want.item && !s.items[want.item] && s.cash > ITEMS[want.item].price + 500) go('buy', want.item);
    if (want.flag === 'elected' && !s.f.elected && !L.can('mayor')) go('mayor');
    const course = want.edu && !s.edu[want.edu] ? want.edu : want.degree && !L.hasDegree() ? 'business' : null;
    if (course && !s.course) {
      const pre = COURSES[course].need.edu;
      if (pre && !s.edu[pre]) go('enrol', pre); else go('enrol', course);
    }
    let shifts = 0;
    for (let i = 0; i < 12 && s.time > 0 && !s.dead; i++) {
      if (s.health < 45) { if (!go('rest')) break; continue; }
      if (s.happy < 32) { if (!go('bench')) break; continue; }
      const short = STATS.find((k) => want[k] && s.st[k] < want[k]);
      const needCourse = s.course && s.cash >= L.classFee(s.course.id) + 800;
      const courseNeed = s.course ? STATS.find((k) => COURSES[s.course.id].need[k] && s.st[k] < 0) : null;
      const enrolShort = course && !s.course ? STATS.find((k) => COURSES[course].need[k] && s.st[k] < COURSES[course].need[k]) : null;
      const poor = s.cash < 2500;
      if (s.job && shifts < (poor ? 3 : 2) && s.time >= 2) { if (go('work')) { shifts++; continue; } }
      if (!s.job && poor && s.time >= 2) { if (go('crates')) continue; }
      if (needCourse && s.time >= 2 && go('class')) continue;
      const k = enrolShort || short || courseNeed;
      if (k) { const ids = TRAIN[k](L); if (ids.some((id) => go(id))) continue; }
      if (want.karma && s.karma < want.karma && go('volunteer')) continue;
      if (want.fame && s.fame < want.fame) { if (go('openmic') || go('busk')) continue; }
      if (s.job && shifts < 3 && s.time >= 2 && go('work')) { shifts++; continue; }
      if (!go('rest')) break;
    }
    if (s.dead) break;
    L.endSeason();
    sane(L, 'the end of a season');
  }
  return { L, topAt, top: !!s.worked[target] && s.worked[target] === car.rungs.length - 1 };
}

console.log(`Climbers: ${perCareer} lives for each of ${Object.keys(CAREERS).length} careers`);
for (const c of Object.keys(CAREERS)) {
  let tops = 0;
  const ages = [], worth = [], died = [];
  for (let i = 0; i < perCareer; i++) {
    try {
      const r = climber(1000 + i * 37 + c.length, c);
      if (r.top) { tops++; ages.push(r.topAt ?? r.L.s.age); }
      worth.push(r.L.netWorth());
      died.push(r.L.s.age);
    } catch (e) {
      check(false, `a ${c} climber fell over: ${e.message}`);
      break;
    }
  }
  ages.sort((a, b) => a - b); worth.sort((a, b) => a - b); died.sort((a, b) => a - b);
  const mid = (l) => l[Math.floor(l.length / 2)];
  console.log(`  ${c.padEnd(9)} reached the top in ${tops}/${perCareer}${ages.length ? `, typically at ${mid(ages)}` : ''}; died at ${mid(died)} worth ${cashShort(mid(worth))}`);
  check(tops >= Math.ceil(perCareer * 0.5), `${c}: a determined player reaches the top at least half the time (${tops}/${perCareer})`);
}

// Does anything at all, for a whole life.
function monkey(seed) {
  const L = Life.create({ seed, name: 'Monkey', bg: Object.keys(BACKGROUNDS)[seed % 6] });
  const s = L.s;
  let guard = 0;
  while (!s.dead) {
    if (++guard > 500) throw new Error('a life that never ends');
    answer(L, true);
    for (let k = 0; k < 14 && !s.dead; k++) {
      const opts = [];
      for (const p of Object.keys(PLACES)) for (const a of L.placeActions(p)) if (!a.why && !a.open) opts.push([a.id, a.x]);
      for (const c of Object.keys(CAREERS)) if (!L.can('apply', c)) opts.push(['apply', c]);
      for (const c of Object.keys(COURSES)) if (!L.can('enrol', c)) opts.push(['enrol', c]);
      for (const h of Object.keys(HOMES)) for (const buy of [false, true]) if (!L.can('move', { id: h, buy })) opts.push(['move', { id: h, buy }]);
      for (const p of s.people) for (const a of L.personActions(p)) if (!a.why) opts.push([a.id, p.id]);
      for (const kind of Object.keys(PETS)) if (!L.can('pet', kind)) opts.push(['pet', kind]);
      for (const id of Object.keys(PROPS)) { if (!L.can('buyProp', id)) opts.push(['buyProp', id]); if (!L.can('sellProp', id)) opts.push(['sellProp', id]); }
      for (const sym of Object.keys(STOCKS)) {
        const x = { sym, n: 1 + Math.floor(L.rnd() * 20) };
        if (!L.can('shares', x)) opts.push(['shares', x]);
        if (!L.can('sellShares', x)) opts.push(['sellShares', x]);
      }
      for (const [id, x] of [['deposit', 500], ['withdraw', 500], ['borrow', 1000], ['repay', 500], ['slots', 50], ['hiloStart', 50], ['hiloGuess', 'hi'], ['hiloGuess', 'lo'], ['hiloCash'], ['drop']]) if (!L.can(id, x)) opts.push([id, x]);
      if (!opts.length) break;
      const [id, x] = opts[Math.floor(L.rnd() * opts.length)];
      const r = L.act(id, x);
      if (!r.ok) throw new Error(`${id} was on offer but failed: ${r.why}`);
      if (typeof r.text !== 'string') throw new Error(`${id} said nothing`);
      sane(L, id);
      answer(L, true);
      if (s.time <= 0 && k > 8) break;
    }
    if (s.dead) break;
    const snap = JSON.stringify(s);
    if (guard % 40 === 0) {
      // A saved life, loaded again, carries on exactly the same.
      const twin = new Life(JSON.parse(snap));
      twin.endSeason();
      L.endSeason();
      if (JSON.stringify(twin.s) !== JSON.stringify(s)) throw new Error('a saved life went a different way');
    } else L.endSeason();
    sane(L, 'the end of a season');
  }
  return L;
}

console.log(`Random players: ${randomLives} lives`);
{
  const ages = [], ribbons = {}, seen = new Set();
  let trophies = 0;
  for (let i = 0; i < randomLives; i++) {
    try {
      const L = monkey(5000 + i);
      const o = L.obituary();
      ages.push(o.age);
      ribbons[o.ribbon.id] = (ribbons[o.ribbon.id] || 0) + 1;
      trophies += o.trophies;
      for (const id of Object.keys(L.s.seen)) seen.add(id);
      if (i === 0) {
        const again = monkey(5000);
        check(JSON.stringify(again.s) === JSON.stringify(L.s), 'the same seed and the same choices give the same life');
      }
    } catch (e) {
      check(false, `random life ${i} fell over: ${e.message}`);
      break;
    }
  }
  ages.sort((a, b) => a - b);
  const random = EVENTS.filter((e) => e.w);
  console.log(`  lived to between ${ages[0]} and ${ages[ages.length - 1]} (typically ${ages[Math.floor(ages.length / 2)]}); ${(trophies / randomLives).toFixed(1)} trophies a life; ${seen.size} of ${random.length} chance events seen`);
  console.log(`  ribbons: ${Object.entries(ribbons).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  check(ages[Math.floor(ages.length / 2)] >= 60, 'even a careless life usually lasts past 60');
  if (randomLives >= 40) check(seen.size >= random.length * 0.85, `nearly every chance event turns up across ${randomLives} lives (${seen.size}/${random.length})`);
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
