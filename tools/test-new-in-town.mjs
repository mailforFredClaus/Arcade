// Checks New in Town's rules: time and money, skills, jobs and promotions,
// courses and exams, homes and property, the bank and shares, people and
// love and children, a business of your own, crime and vice and the law,
// events and the end of a life.
// Then practice players live whole lives: one sets out to climb each career
// (which proves every ladder can be climbed), and one does things at random
// (which proves nothing it can do breaks the game). After every action the
// numbers are checked, and the same seed must always give the same life.
// Usage: node tools/test-new-in-town.mjs [lives per career] [random lives]

import { Life, ACTIONS, money, cashShort } from '../games/new-in-town/js/engine.js';
import { EVENTS } from '../games/new-in-town/js/events.js';
import {
  STATS, PLACES, CAREERS, SHIFTS_FOR_RUNG, COURSES, HOMES, UPGRADES, ITEMS, STOCKS, PROPS, PETS, DREAMS, QUESTS, TROPHIES, RIBBONS, BACKGROUNDS,
  BUSINESSES, FISH, OUTINGS, KID_PLAY, PERKS, NAMES_M, NAMES_F, INSURANCE, FOOD,
} from '../games/new-in-town/js/data.js';

const perCareer = Number(process.argv[2] || 12), randomLives = Number(process.argv[3] || 60);
let failures = 0;
const check = (ok, what) => {
  if (!ok) {
    failures++;
    console.log(`FAIL: ${what}`);
  }
};
// A fresh life, with the to-do list's rewards out of the way so sums are plain.
const fresh = (o = {}) => { const L = Life.create({ seed: 7, name: 'Test', ...o }); L.s.quest = QUESTS.length; return L; };

// ---- the lists hang together ------------------------------------------------------------

{
  for (const [id, c] of Object.entries(CAREERS)) {
    check(PLACES[c.place], `${id}: works at a real place`);
    check(c.rungs.length >= 5 && c.rungs.length <= SHIFTS_FOR_RUNG.length, `${id}: five or six rungs`);
    check(!c.shady || !c.clean, `${id}: is honest or it is not`);
    check(c.stats.every((k) => STATS.includes(k)), `${id}: trains real skills`);
    check(PERKS[id], `${id}: knowing someone in it is worth something`);
    c.rungs.forEach((r, i) => {
      check(i === 0 || r.pay > c.rungs[i - 1].pay, `${id}: ${r.title} pays more than the rung below`);
      check(!r.need.edu || COURSES[r.need.edu], `${id}: ${r.title} asks for a real course`);
      check(!r.need.item || ITEMS[r.need.item], `${id}: ${r.title} asks for a real thing`);
    });
    for (const [q, r] of Object.entries(c.entry || {})) check((q === 'degree' || COURSES[q]) && c.rungs[r] && r > 0, `${id}: ${q} lets you in at a real rung`);
  }
  for (const [id, c] of Object.entries(COURSES)) {
    check(!c.need.edu || COURSES[c.need.edu], `${id}: builds on a real course`);
    check((c.covers || []).every((k) => COURSES[k]), `${id}: covers real courses`);
    check(c.degree || Object.values(CAREERS).some((car) => (car.entry || {})[id] || car.rungs.some((r) => r.need.edu === id)), `${id}: is good for something`);
  }
  for (const [id, it] of Object.entries(ITEMS)) check(PLACES[it.at], `${id}: sold at a real place`);
  for (const a of Object.values(ACTIONS)) check(a.place == null || typeof a.place === 'function' || PLACES[a.place] || a.place === 'sal', `${a.id}: happens at a real place`);
  for (const id of Object.keys(PLACES)) check(fresh().placeActions(id).length > 0 || id === 'labs', `${id}: has something to do`);
  for (const [id, b] of Object.entries(BUSINESSES)) check(PLACES[b.place] && b.names.length === 4 && b.cost.length === 4 && b.take.length === 4 && b.skill.length === 4 && b.wait.length === 4 && b.stats.every((k) => STATS.includes(k)), `${id}: a business with four sizes`);
  for (const [id, f] of Object.entries(FISH)) check(f.pay[1] >= f.pay[0] && f.where.every((w) => w === 'wall' || w === 'boat'), `${id}: a proper fish`);
  for (let q = 0; q < 4; q++) for (const w of ['wall', 'boat']) check(Object.values(FISH).some((f) => f.where.includes(w) && (!f.when || f.when.includes(q))), `something bites from the ${w} in season ${q}`);
  check(new Set([...NAMES_M, ...NAMES_F]).size === NAMES_M.length + NAMES_F.length, 'no name is both a man’s and a woman’s');
  const ids = new Set();
  for (const e of EVENTS) {
    check(!ids.has(e.id), `event ${e.id}: only one of that name`);
    ids.add(e.id);
    check(e.opts && e.opts.length > 0 && e.opts.every((o) => o.t && (o.run || e.opts.length === 1)), `event ${e.id}: has choices that do something`);
  }
  for (const id of ['marlow1', 'marlow2', 'marlow3', 'busted', 'dumped', 'divorce', 'wedding', 'baby', 'kid18', 'grandchild', 'parentDies', 'spouseDies', 'petDies', 'sportsRetire', 'birthday30', 'birthday50', 'birthday100', 'bailiffs', 'bust', 'sacked']) check(ids.has(id), `the rules send for event ${id}, and it exists`);
  check(RIBBONS[RIBBONS.length - 1].test(fresh()), 'the last ribbon fits any life');
  check(Object.keys(DREAMS).length >= 6 && QUESTS.length >= 8 && Object.keys(TROPHIES).length >= 30, 'plenty of dreams, to-dos and trophies');
  check(money(1234.4) === '$1,234' && money(-50) === '−$50' && cashShort(1250000) === '$1.25M' && cashShort(340000) === '$340k', 'money is written out properly');
  check(cashShort(999700) === '$1.00M' && cashShort(99999) === '$99,999', 'short money never reads as a thousand thousands');
}

// ---- starting out -----------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  check(s.age === 18 && s.t === 0 && L.season === 0 && s.cash === 1500 && s.home === 'hostel' && !s.job, 'starts at 18, in spring, in the hostel, with $1,500 and no job');
  check(s.time === 6 && L.timeMax() === 6, 'six blocks of time a season to begin with');
  check(STATS.every((k) => s.st[k] >= 14 && s.st[k] <= 20), 'every skill starts low: an all-rounder’s are between 14 and 20');
  check(s.dreams.length === 3 && new Set(s.dreams).size === 3, 'three different dreams');
  check(s.people.length === 2 && s.people[0].sex === 'f' && s.people[1].sex === 'm' && s.people.every((p) => p.kind === 'parent'), 'a mum and a dad back home');
  check(s.sex === 'm' && s.into === 'f' && fresh({ sex: 'f' }).s.into === 'm' && fresh({ sex: 'f', into: 'b' }).s.into === 'b', 'you are a man or a woman, and fall for whoever you say');
  const B = fresh({ bg: 'bookworm' }), S = fresh({ bg: 'saver' });
  check(B.s.st.smarts === s.st.smarts + 8 && B.s.st.craft === s.st.craft - 4 && S.s.cash === 4500, 'a background gives what it says');
  const H = fresh({ heir: 'star', inherit: 5000, gen: 2, parent: { name: 'Old Sam', age: 70, sex: 'm' }, raised: { smarts: 60, fitness: 10, charm: 0, craft: 100 } });
  check(H.s.items.guitar && H.s.cash === 6500 && H.s.gen === 2 && H.s.people.length === 1 && H.s.people[0].name === 'Old Sam', 'a later generation brings its heirloom, its inheritance and a parent');
  check(H.s.st.smarts >= 14 + 24 && H.s.st.craft >= 14 + 28 && H.s.st.craft <= 20 + 28, 'and the skills it was brought up with, up to a point');
  check(JSON.stringify(fresh().s) === JSON.stringify(fresh().s), 'the same seed starts the same life');
  check(JSON.stringify(Life.create({ seed: 8, name: 'Test' }).s) !== JSON.stringify(Life.create({ seed: 7, name: 'Test' }).s), 'a different seed starts a different one');
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
  s.cash = 20; s.bank = 100;
  check(L.act('workout').ok && s.cash === 0 && s.bank === 60, 'what cash will not cover comes out of savings');
  s.cash = 1000;
  L.act('buy', 'bike');
  check(s.items.bike && s.cash === 600 && s.time === 6 && L.timeMax() === 7, 'a bicycle gives a seventh block of time, straight away');
  check(!L.act('buy', 'bike').ok, 'one bicycle is enough');
  s.cash = 100000;
  L.act('buy', 'car');
  check(L.timeMax() === 8 && s.time === 7, 'a car makes it eight');
  s.st.smarts = 100; L.gain('smarts', 50);
  check(s.st.smarts === 100, 'no skill goes past 100');
  L.joy(500); L.hp(500);
  check(s.happy === 100 && s.health <= 100, 'mood and health stop at 100');
  // How you eat.
  const A = fresh(), B = fresh();
  A.act('food', 0); B.act('food', 2);
  check(A.bills().find(([w]) => w === 'Food and bills')[1] === 400 && B.bills().find(([w]) => w === 'Food and bills')[1] === 1300, 'eating cheaply costs less, eating well costs more');
  A.s.time = B.s.time = 0;
  A.endSeason(); B.endSeason();
  check(A.s.health < B.s.health, 'and your body knows the difference');
  check(FOOD.length === 3 && !A.act('food', 0).ok, 'three ways to eat; you are already eating one of them');
}

// ---- work -------------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  check(L.can('apply', 'tech') && L.can('apply', 'tech').includes('Smarts'), 'a job with an entry bar says what is missing');
  check(L.act('apply', 'kitchen').ok && s.job.c === 'kitchen' && s.job.r === 0 && s.time === 5, 'anyone can start as a pot washer; applying takes time');
  check(L.placeActions('pub')[0].id === 'work' && ['workHard', 'workEasy', 'raise'].every((id) => L.placeActions('pub').some((a) => a.id === id)), 'your job shows first at the place you work, with three ways to do it');
  const cash = s.cash;
  const r = L.act('work');
  check(r.ok && s.cash === cash + 1300 && s.time === 3 && s.n.shifts === 1 && s.job.n === 1, 'a shift pays the rung’s wage and takes two blocks');
  const perf = s.job.perf;
  s.time = 2; L.act('workHard');
  check(s.job.n === 2.5 && s.job.perf > perf, 'going the extra mile counts for a shift and a half, and the boss notices');
  s.time = 2; s.use = {}; L.act('workEasy');
  check(s.job.n === 3 && s.job.perf < perf + 6, 'coasting counts for half, and the boss notices that too');
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
  // A raise.
  s.job.perf = 100; s.st.charm = 100; s.use = {};
  const pay = L.shiftPay();
  let asked = 0;
  while (s.job.raise === 0 && asked++ < 30) { s.job.asked = -99; L.act('raise'); }
  check(s.job.raise === 0.08 && L.shiftPay() > pay && L.can('raise').includes('not long ago'), 'a well thought of worker can ask for a raise, now and then');
  // Standing at work.
  s.job.perf = 5; s.pend = [];
  L.endSeason();
  check(s.pend.some((e) => e.id === 'sacked'), 'let your standing fall far enough and the boss wants a word');
  s.pend = [{ id: 'sacked', x: null }];
  L.choose(1);
  check(!s.job, 'and that word is goodbye');
  // Leaving and coming back.
  s.worked.kitchen = 3; s.st.craft = 99; s.st.charm = 99; s.edu.culinary = { a: 20, g: 0 }; s.time = 6;
  L.act('apply', 'kitchen');
  check(s.job.r === 3, 'going back to a career picks up where you left off');
  s.job.perf = 20; s.stand.kitchen = 20;
  L.act('quit');
  check(!s.job, 'you can hand in your notice');
  s.time = 6; L.act('apply', 'kitchen');
  check(s.job.perf === 20, 'walking out and back in does not mend your standing with the boss');
  L.act('quit');
  s.record = 1;
  check(L.can('apply', 'police') === 'Not with your record.', 'the police will not take you with a record');
  s.record = 0; s.age = 66; s.time = 6;
  L.act('apply', 'kitchen');
  check(L.placeActions('townhall').some((a) => a.id === 'retire'), 'at 65 you can retire');
  L.act('retire');
  check(!s.job && s.retired && s.pension > 0, 'retiring swaps the job for a pension');
  const pension = s.pension;
  s.time = 6; L.act('apply', 'kitchen'); L.act('retire');
  check(s.pension === pension, 'retiring a second time does not pay a second pension');
}

// ---- study, and where it gets you -------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  check(L.can('enrol', { id: 'medicine' }).includes('Smarts'), 'medicine needs Smarts');
  check(L.act('enrol', { id: 'firstaid' }).ok && s.course.id === 'firstaid', 'anyone can sign up for first aid');
  check(L.can('enrol', { id: 'culinary' }) === 'One course at a time.', 'one course at a time');
  const cash = s.cash;
  L.act('class');
  check(s.cash === cash - 200 && s.time === 4 && s.course.p === 1, 'a class costs its fee and two blocks');
  L.act('class');
  check(s.course.exam && !s.edu.firstaid && !L.placeActions('college').some((a) => a.id === 'class') && L.placeActions('college').some((a) => a.id === 'exam'), 'after the last class comes the exam');
  const mark = L.examMark(), rng = s.rng;
  check(L.examMark() === mark && s.rng === rng, 'looking at where your mark is heading does not change it');
  L.act('revise');
  check(L.examMark() === mark + 5 && s.time === 1, 'revising lifts the mark you are heading for');
  s.course.mark = 2 * 95;
  const r = L.act('exam');
  check(s.edu.firstaid && s.edu.firstaid.g === 2 && !s.course && r.news.some((n) => n.text.includes('Distinction')), 'a high mark is a distinction');
  check(!L.hasDegree(), 'a certificate is not a degree');
  // A fail means going back for more.
  const F = fresh();
  F.act('enrol', { id: 'firstaid' }); F.act('class'); F.act('class');
  F.s.course.mark = 0;
  F.act('exam');
  check(F.s.course && !F.s.course.exam && F.s.course.p === 0 && !F.s.edu.firstaid, 'fail the exam and there are classes to sit again');
  // A student loan.
  const D = fresh();
  D.s.st.smarts = 70; D.s.cash = 0;
  D.act('enrol', { id: 'medicine', loan: true });
  check(D.act('class').ok && D.s.sloan === 2000 && D.s.cash === 0, 'on a student loan the fees are owed, not paid');
  D.endSeason();
  check(D.s.sloan === 2020, 'the loan gathers a little interest');
  D.s.pend = []; D.s.job = { c: 'kitchen', r: 0, n: 0, perf: 50, raise: 0 }; D.s.debt = 0; D.s.cash = 0;
  D.act('work');
  check(D.s.sloan === 2020 - 130 && D.s.cash === 1300 - 130, 'and a tenth of every pay packet goes to paying it off');
  check(D.netWorth() < 0, 'a student loan counts against what you are worth');
  // A qualification lets you in partway up.
  const M = fresh();
  M.s.st.smarts = 70;
  check(M.startRung('medicine') === 0, 'with no papers you start at the bottom');
  M.s.edu.medicine = { a: 24, g: 0 };
  check(M.hasEdu('nursing') && M.hasEdu('firstaid') && M.hasDegree(), 'a medical degree stands in for the nursing diploma and first aid');
  M.act('apply', 'medicine');
  check(M.s.job.r === 3 && M.jobTitle() === 'Junior Doctor', 'a medical degree makes you a junior doctor, not a porter');
  check(M.can('enrol', { id: 'nursing' }) === 'You hold something better.', 'and nobody with one needs a nursing diploma');
  const N = fresh();
  N.s.st.smarts = 50; N.s.edu.medicine = { a: 24, g: 0 };
  check(N.startRung('medicine') === 2, 'short of the skill for the rung, you start on the one below');
  const G = fresh(), g0 = fresh();
  for (const X of [G, g0]) { X.s.st.smarts = 70; X.s.edu.medicine = { a: 24, g: X === G ? 2 : 0 }; X.act('apply', 'medicine'); }
  check(G.shiftPay() > g0.shiftPay(), 'a distinction earns more than a pass');
  const P = fresh();
  P.s.st.smarts = 50; P.s.edu.business = { a: 22, g: 0 };
  check(P.startRung('politics') === 0 && (P.s.st.charm = 40, P.startRung('politics')) === 1, 'any degree is a way into politics, given the charm');
}

// ---- home and property ------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.cash = 5000;
  check(L.act('rentHome', 'bedsit').ok && s.home === 'bedsit' && s.cash === 4400 && !s.owned && s.time === 5, 'moving into a rented place costs half a season’s rent');
  check(L.can('buyHome', { id: 'bedsit' }) === 'Not for sale.', 'the bedsit cannot be bought');
  check(L.can('buyHome', { id: 'flat' }).includes('fifth'), 'buying needs a fifth down');
  s.cash = 40000;
  const price = L.propPrice('flat');
  check(L.act('buyHome', { id: 'flat' }).ok && s.owned && s.home === 'flat' && s.estate.length === 1 && s.homeAt === s.estate[0].id, 'with the deposit you can buy');
  check(s.cash === 40000 - price * 0.2 && s.debt === price * 0.8, 'a fifth comes from cash and the bank lends the rest');
  check(L.netWorth() === 40000, 'buying a home does not change what you are worth');
  check(L.bills().some(([what]) => what === 'Loan interest') && !L.bills().some(([what]) => what === 'Rent'), 'an owner pays loan interest and upkeep, not rent');
  // Buying a second home: the first is kept.
  s.cash = 500000; s.time = 6;
  const flat = s.estate[0];
  check(L.act('buyHome', { id: 'cottage' }).ok && s.home === 'cottage' && s.estate.length === 2 && s.estate.includes(flat), 'buy a better home and the old one is still yours');
  check(L.bills().some(([what]) => what === 'Upkeep on empty property'), 'an empty property costs its upkeep');
  check(L.can('sellEstate', s.homeAt).includes('live there') && L.can('letProp', s.homeAt) === 'You live there.', 'you cannot sell or let the roof over your head');
  L.act('letProp', flat.id);
  check(flat.let && L.letIncome() === L.propEarn(flat) && L.letIncome() > 0 && L.income().some(([w]) => w.startsWith('Rent from')), 'let the old one out and it earns rent');
  const cashWas = s.cash;
  s.pend = [];
  const lines = L.endSeason().lines;
  check(lines.some(([w, n]) => w.startsWith('Rent from') && n > 0) && s.cash > cashWas - 20000, 'the rent arrives each season');
  s.pend = []; s.time = 6;
  check(L.act('moveIn', flat.id).ok && s.home === 'flat' && s.homeAt === flat.id && !flat.let && s.estate.length === 2, 'you can move back into a place you own; the tenant goes');
  const cottage = s.estate.find((e) => e.kind === 'cottage'), worth = L.netWorth(), debt = s.debt;
  L.act('sellEstate', cottage.id);
  check(s.estate.length === 1 && Math.abs(L.netWorth() - (worth - L.propPrice('cottage') * 0.04)) < 2 && s.debt <= debt, 'or sell it, less the agent’s fees');
  // Trading up.
  s.cash = 0; s.bank = 0; s.debt = 0; s.time = 6;
  const plan = L.buyPlan('cottage', true);
  check(plan.sale === Math.round(L.propValue(flat) * 0.97) && plan.loan === L.propPrice('cottage') - plan.sale && plan.ok, 'trading in: the sale of the old home goes towards the new');
  L.act('buyHome', { id: 'cottage', trade: true });
  check(s.home === 'cottage' && s.estate.length === 1 && s.estate[0].kind === 'cottage' && s.debt === plan.loan, 'and the old one is gone');
  // Renting again while owning.
  s.cash = 9000; s.time = 6;
  L.act('rentHome', 'bedsit');
  check(!s.owned && s.homeAt === null && s.estate.length === 1 && L.bills().some(([w]) => w === 'Rent'), 'move into a rented place and what you own stays yours');
  // Buying to let.
  s.cash = 100000; s.debt = 0; s.time = 6;
  check(L.act('buyLet', 'garage').ok && s.estate.length === 2 && s.estate[1].let && s.home === 'bedsit', 'a lock-up can be bought to let, not to live in');
  check(L.can('moveIn', s.estate[1].id) === 'Nobody could live there.' && L.can('letProp', s.estate[1].id).includes('no use'), 'nobody lives in a lock-up, and it is no use empty');
  // Doing a home up.
  s.time = 6; L.act('moveIn', s.estate[0].id);
  const home = L.homeEntry(), value = L.propValue(home), comfort = L.comfort();
  check(L.placeActions('home').filter((a) => a.id === 'improve').length >= Object.keys(UPGRADES).length, 'a home you own can be improved');
  s.cash = 50000;
  L.act('improve', { id: 'kitchen' });
  check(home.ups.kitchen && L.propValue(home) > value && L.propValue(home) <= value + 12000 * s.idx + 1000 && L.comfort() > comfort && s.cash === 38000, 'a new kitchen adds comfort, and no more value than it cost');
  check(L.can('improve', { id: 'kitchen' }) === 'Done already.' && L.can('improve', { id: 'garden', diy: true }).includes('Craft'), 'once is enough; doing it yourself takes Craft');
  s.st.craft = 80; s.time = 6;
  const c2 = s.cash;
  L.act('improve', { id: 'garden', diy: true });
  check(home.ups.garden && s.cash === c2 - Math.round(4000 / 3) && s.time === 4 && s.f.diy, 'with the Craft, you do it yourself for a third of the price and some of your time');
  const kids = L.kidRoom();
  s.cash = 50000;
  L.act('improve', { id: 'extension' });
  check(L.kidRoom() === kids + 1, 'an extra bedroom is room for one more child');
  const bill = L.bills().find(([w]) => w === 'Food and bills')[1];
  s.cash = 50000;
  L.act('improve', { id: 'solar' });
  check(L.bills().find(([w]) => w === 'Food and bills')[1] === bill - 250, 'solar panels cut the bills');
}

// ---- the bank ---------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.cash = 5000;
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
  check(L.dividends() === Math.floor(10 * p * STOCKS.GULL.div) && L.dividends() > 0, 'and some pay a dividend every season');
  L.act('sellShares', { sym: 'GULL', n: 10 });
  check(!s.stk.own.GULL && s.cash >= 2000 - 1, 'and sell for it');
  // Spending past your cash dips into savings, then the overdraft.
  s.cash = 100; s.bank = 500; s.debt = 0;
  L.cash(-1000);
  check(s.cash === 0 && s.bank === 0 && s.debt === 400, 'a bill you cannot cover takes savings first, then goes on a loan');
  // Insurance.
  const I = fresh();
  I.s.cash = 5000;
  const cost = I.medCost(1000);
  I.act('insure', 'health');
  check(I.s.ins.health && I.medCost(1000) === cost * 0.4 && I.bills().some(([w]) => w === INSURANCE.health.name), 'health cover costs a premium and cuts hospital bills');
  check(I.s.cash === 5000 - INSURANCE.health.cost, 'and the first premium is paid on the spot');
  I.act('insure', 'health');
  check(!I.s.ins.health, 'and can be cancelled');
}

// Shares mostly go up, given time: the fund almost surely, the wild ones probably.
{
  const runs = 300, years = 20, up = {}, mid = {};
  for (const sym of Object.keys(STOCKS)) { up[sym] = 0; mid[sym] = []; }
  for (let i = 0; i < runs; i++) {
    const L = Life.create({ seed: 900 + i, name: 'Market' });
    for (let t = 0; t < years * 4; t++) L.moveMarkets();
    for (const sym of Object.keys(STOCKS)) { const g = L.s.stk.p[sym] / STOCKS[sym].start; if (g > 1) up[sym]++; mid[sym].push(g); }
  }
  const pc = (sym) => Math.round(up[sym] / runs * 100), med = (sym) => mid[sym].sort((a, b) => a - b)[runs / 2];
  console.log(`Shares after ${years} years: ${Object.keys(STOCKS).map((sym) => `${sym} up in ${pc(sym)}% of lives (typically x${med(sym).toFixed(1)})`).join(', ')}`);
  check(pc('BAY') >= 97, `the index fund is worth more after ${years} years nearly every time (${pc('BAY')}%)`);
  for (const sym of ['GULL', 'BRCK', 'SNCK', 'LITE']) check(pc(sym) >= 82 && med(sym) > 1.8, `${sym} is very likely worth more after ${years} years (${pc(sym)}%)`);
  check(pc('MOON') >= 52 && pc('MOON') < pc('BAY'), `even the wild one is more likely up than down, but is no sure thing (${pc('MOON')}%)`);
  const swing = (sym) => { const l = mid[sym]; return l[Math.floor(runs * 0.9)] / l[Math.floor(runs * 0.1)]; };
  check(swing('BAY') < swing('GULL') * 1.3 && swing('BAY') < swing('LITE') && swing('LITE') < swing('MOON'), 'the fund is the steadiest, the miner the wildest');
  const L = Life.create({ seed: 5, name: 'News' });
  for (let t = 0; t < 60; t++) L.moveMarkets();
  check(L.s.stk.news.length > 0 && L.s.stk.news.length <= 6 && L.s.stk.h.BAY.length <= 41, 'the market makes news, and keeps ten years of prices');
}

// ---- the turn of the season -------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.bank = 10000;
  const r = L.endSeason();
  check(s.t === 1 && L.season === 1 && s.age === 18 && !r.birthday, 'spring turns to summer');
  check(s.bank === 10100, 'savings earn one per cent a season');
  check(s.cash === 1500 - 500 - 700, 'rent and food come out');
  check(s.time === L.timeMax() && Object.keys(s.use).length === 0, 'a new season brings fresh time');
  L.endSeason(); L.endSeason();
  const b = L.endSeason();
  check(b.birthday && s.age === 19 && L.season === 0 && L.year === 2 && s.hist.length === 1, 'four seasons make a year, and a birthday');
  // Time left over is rest.
  const A = fresh(), B = fresh();
  A.s.health = B.s.health = 50; A.s.happy = B.s.happy = 50;
  B.s.time = 0;
  A.endSeason(); B.endSeason();
  check(A.s.health > B.s.health && A.s.happy > B.s.happy, 'unused time does you good');
  // Going broke.
  const C = fresh();
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
  D.s.cash = 900000; D.act('buyHome', { id: 'flat' }); D.s.time = 6; D.act('buyLet', 'rental');
  D.s.cash = 5000; D.s.debt = 288000; D.s.pend = [];
  D.endSeason();
  check(D.s.owned && D.s.estate.length === 1 && !D.s.f.bust && D.event().id === 'bailiffs', 'owe too much and the bank sells what you let out before the roof over your head');
  D.s.cash = 4100; D.s.bank = 0; D.s.debt = Math.round(D.propValue(D.homeEntry()) * 0.89 + 3200); D.s.pend = [];
  D.endSeason();
  check(!D.s.owned && D.s.estate.length === 0 && D.s.home === 'bedsit', 'and then the roof');
}

// ---- people -----------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  const f = L.meet({ sex: 'm', bond: 50 });
  check(s.people.includes(f) && f.kind === 'friend' && f.job && f.likes.length === 2 && L.takeNews().some((n) => n.text.includes(f.name)), 'meeting someone adds a friend, with a job and things he loves doing');
  check(NAMES_M.includes(f.name.split(' ')[0]), 'a man has a man’s name');
  check(!L.personActions(f).some((a) => a.id === 'askout'), 'a man who falls for women cannot ask a man out');
  const acts = L.personActions(f);
  check(acts.filter((a) => a.id === 'out').length === Object.keys(OUTINGS).length && acts.some((a) => a.id === 'forget') && acts.some((a) => a.id === 'gift'), 'a friend can be taken out, given a present, or let go');
  // Outings: everybody has two they love.
  const loved = f.likes[0], dull = Object.keys(OUTINGS).find((k) => !f.likes.includes(k) && OUTINGS[k].not !== 0 && !OUTINGS[k].big);
  s.cash = 5000;
  let b = f.bond;
  L.act('out', { p: f.id, a: dull });
  const plain = f.bond - b;
  check(plain > 0 && s.time === 5 && f.known[dull], 'time together brings you closer');
  b = f.bond;
  L.act('out', { p: f.id, a: loved });
  check(f.bond - b > plain * 1.4 * (OUTINGS[loved].big ? 1 : 1) && f.known[loved], 'doing what they love brings you closer still, and now you know');
  check(L.act('gift', f.id).ok && !L.act('gift', f.id).ok, 'one present a season');
  // A friend in the right place.
  f.job = 'medicine'; f.bond = 70;
  const c1 = L.medCost(1000);
  f.bond = 30;
  check(L.perk('medicine') === false && L.medCost(1000) > c1, 'a close friend at the hospital gets you a discount; a distant one does not');
  f.job = 'kitchen'; f.bond = 70; s.st.charm = 25;
  check(L.startRung('kitchen') === 1, 'and a close friend in a trade can get you past the bottom rung');
  L.act('forget', f.id);
  check(!s.people.includes(f), 'you can let a friendship go');
  // No limit of eight any more.
  for (let i = 0; i < 12; i++) L.meet({ bond: 30 });
  check(L.friends().length === 12, 'you can have a dozen friends');
  // Romance without friendship first.
  s.st.charm = 100; s.cash = 5000;
  let tries = 0;
  while (!L.partner() && tries++ < 40) { s.time = 6; L.act('chatup'); }
  const p = L.partner();
  check(p && p.kind === 'partner' && p.sex === 'f' && NAMES_F.includes(p.name.split(' ')[0]) && L.friends().length === 12, 'chat someone up at the pub and you can be seeing her by closing time, friends or no friends');
  check(!L.placeActions('pub').some((a) => a.id === 'chatup'), 'no chatting people up while you are spoken for');
  L.act('split', p.id);
  check(!L.partner(), 'you can break it off');
  // The dating app.
  s.items.phone = 1;
  check(L.placeActions('home').some((a) => a.id === 'datingOpen'), 'a phone brings the dating app');
  const three = L.prospects();
  check(three.length === 3 && three.every((q) => q.sex === 'f' && q.single) && L.prospects() === three, 'three faces, all of a kind you could fall for, the same until next season');
  tries = 0;
  while (!L.partner() && tries++ < 40) { s.time = 6; if (!L.prospects().length) L.act('rematch'); else L.act('match', 0); }
  check(L.partner() && s.people.includes(L.partner()), 'ask one on a date and it may go well');
  L.split(L.partner(), false);
  // Asking a friend out.
  const g = L.meet({ sex: 'f', single: true, bond: 20 });
  check(L.can('askout', g.id).includes('30 bond'), 'a friend wants to know you a little before a date');
  g.bond = 100;
  L.act('askout', g.id);
  check(g.kind === 'partner' && L.partner() === g, 'ask the right person and you are a couple');
  const taken = L.meet({ sex: 'f', single: false, bond: 90 });
  check(!L.personActions(taken).some((a) => a.id === 'askout'), 'someone spoken for cannot be asked out');
  check(L.can('movein', g.id).includes('hostel'), 'nobody moves into a hostel bunk');
  s.home = 'flat';
  L.act('movein', g.id);
  check(g.live && L.bills().find(([what]) => what === 'Rent')[1] < HOMES.flat.rent, 'living together shares the rent');
  check(L.can('propose', g.id).includes('ring'), 'a proposal needs a ring');
  s.items.ring = 1; s.cash = 99999; g.bond = 100;
  L.act('propose', g.id);
  check(g.eng && !s.items.ring, 'a yes uses up the ring');
  s.pend = [];
  L.endSeason();
  s.pend = s.pend.filter((e) => e.id === 'wedding');
  check(L.event().id === 'wedding' && L.event().opts.length === 4, 'the wedding comes next season');
  L.choose(0);
  check(g.kind === 'spouse' && s.f.wed, 'and then you are married');
  g.live = false; s.home = 'hostel'; s.time = 6; s.cash = 99999;
  L.act('rentHome', 'flat');
  check(g.live, 'a wife moves with you out of the hostel');
  s.time = 6; s.pend = [];
  // A baby.
  g.wish = false;
  check(L.can('baby', g.id).includes('does not want children'), 'not everyone wants children');
  g.wish = true; g.age = 50;
  check(L.can('baby', g.id).includes('adopt'), 'and there comes an age when it is too late');
  g.age = 30;
  tries = 0;
  while (!s.due && tries++ < 40) { s.time = 6; L.act('baby', g.id); }
  check(s.due && s.due.t === s.t + 3, 'a baby takes three seasons to arrive');
  for (let i = 0; i < 3; i++) { s.pend = []; L.endSeason(); }
  s.pend = s.pend.filter((e) => e.id === 'baby');
  check(L.event() && L.event().id === 'baby' && /boy|girl/.test(L.event().text), 'then there is a boy or a girl, and a name to choose');
  const name = L.event().opts[1].t;
  L.choose(1);
  const kid = L.kids()[0];
  check(kid && kid.name === name && (kid.sex === 'm' ? NAMES_M : NAMES_F).includes(name) && L.timeMax() < 8, 'the baby has the name you chose, and takes up your time');
  check(L.bills().some(([what]) => what === 'Raising a child'), 'children cost money');
  check(L.can('rentHome', 'bedsit') === 'No room for the children there.', 'you cannot move somewhere too small for the family');
  // Bringing a child up.
  kid.age = 6; s.time = 6;
  const sm = kid.st.smarts;
  L.act('kid', { p: kid.id, a: 'read' });
  check(kid.st.smarts === sm + 2.5 && L.personActions(kid).filter((a) => a.id === 'kid').length === Object.keys(KID_PLAY).length, 'reading together brings on a child’s Smarts');
  L.act('school', kid.id);
  check(kid.priv && L.bills().some(([w]) => w === 'School fees'), 'a private school costs fees');
  const grown = { ...kid.st };
  s.pend = [];
  for (let i = 0; i < 4; i++) { L.endSeason(); s.pend = []; }
  check(kid.age === 7 && STATS.every((k) => kid.st[k] > grown[k]) && kid.st.smarts - grown.smarts > kid.st.fitness - grown.fitness, 'children grow a little every year, faster at a good school');
  kid.age = 17; s.pend = [];
  for (let i = 0; i < 4; i++) { L.endSeason(); s.pend = s.pend.filter((e) => e.id === 'kid18'); }
  check(kid.age === 18 && kid.job && !kid.priv && s.pend.length === 1, 'at eighteen they find their own way in the world');
  s.pend = [];
  // Neglect.
  const drift = L.meet({ bond: 1 });
  L.endSeason(); s.pend = []; L.endSeason(); s.pend = [];
  check(!s.people.includes(drift), 'a friend you never see drifts away');
  // Divorce.
  const cash = s.cash + s.bank;
  L.split(g, true);
  check(!L.partner() && s.cash + s.bank < cash * 0.61 + 1, 'a divorce costs two fifths of your money');
  // A woman who falls for women adopts.
  const W = fresh({ sex: 'f', into: 'f' });
  const w = W.meet({ sex: 'f', kind: 'spouse', bond: 90 });
  W.s.home = 'cottage';
  check(W.can('baby', w.id).includes('adopt'), 'two women adopt');
  const V = fresh({ sex: 'f', into: 'f' });
  check(V.personActions(V.meet({ sex: 'f', single: true, bond: 50 })).some((a) => a.id === 'askout') && !V.personActions(V.meet({ sex: 'm', single: true, bond: 50 })).some((a) => a.id === 'askout'), 'a woman who falls for women can ask one out, and not a man');
}

// ---- a business of your own -------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.st.craft = 10; s.cash = 10000;
  check(L.placeActions('townhall').some((a) => a.id === 'bizOpen') && L.can('bizStart', 'food').includes('Craft'), 'starting a business takes a little of its skill');
  s.st.craft = 60; s.st.charm = 50;
  check(L.can('bizStart', 'food') === null, 'and with it, anyone can');
  L.act('bizStart', 'food');
  check(s.biz && s.biz.lvl === 0 && s.cash === 6000 && L.bizName() === 'Food stall' && !L.placeActions('townhall').some((a) => a.id === 'bizOpen'), 'a food stall costs $4,000 to start');
  check(L.placeActions('highstreet').some((a) => a.id === 'bizWork') && L.bizIdle() === 0, 'you work in it where it stands; a stall earns nothing without you');
  check(L.bizWorth() < 4000, 'a business sold the day it opens loses money');
  const rep = s.biz.rep, cash = s.cash;
  L.act('bizWork');
  check(s.cash > cash && s.biz.rep > rep && s.time === 3, 'working in it brings in money and builds its name');
  check(L.can('bizGrow').includes('70'), 'it cannot grow until it has a name');
  s.biz.rep = 80; s.cash = 50000; s.time = 6;
  check(L.can('bizGrow').includes('more season'), 'nor until it has found its feet');
  s.biz.at = s.t - 8;
  const take = L.bizTake();
  L.act('bizGrow');
  check(s.biz.lvl === 1 && L.bizName() === 'Café' && s.cash === 20000 && L.bizIdle() > 0, 'with a name and the money it grows into a café, which earns a little without you');
  check(L.bizTake() > take * 1.5, 'and takes more');
  const idle = L.bizIdle();
  L.act('bizMgr');
  check(s.biz.mgr && L.bizIdle() > idle * 2.5 && L.income().some(([w]) => w.startsWith('Takings')), 'a manager makes it earn properly without you');
  s.use = {}; s.pend = [];
  const before = s.cash;
  const lines = L.endSeason().lines;
  check(lines.some(([w, n]) => w.startsWith('Takings') && n > 0) && s.cash > before - 5000, 'the takings arrive each season');
  s.pend = [];
  const worth = L.bizWorth(), c2 = s.cash;
  check(L.netWorth() >= c2 + worth - 1, 'the business counts towards what you are worth');
  L.act('bizSell');
  check(!s.biz && s.cash === c2 + worth, 'and it can be sold');
  const F = fresh({ heir: 'founder' });
  check(F.bizCost(0) === 2000 && F.bizCost(1) === 30000, 'the old shop sign halves the cost of starting out');
}

// ---- fishing ----------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  check(!L.placeActions('harbour').some((a) => a.id === 'fish'), 'no rod, no fishing');
  s.items.rod = 1;
  check(L.placeActions('harbour').some((a) => a.id === 'fish') && !L.placeActions('harbour').some((a) => a.id === 'fishBoat'), 'with a rod you fish off the wall; the bay needs a boat');
  for (let i = 0; i < 300; i++) { s.time = 6; L.act('fish'); }
  const wall = Object.keys(s.fishbook);
  check(wall.length >= 3 && wall.every((id) => FISH[id].where.includes('wall') && (!FISH[id].when || FISH[id].when.includes(0))), 'what you catch off the wall in spring is what runs there in spring');
  check(s.n.fish === Object.values(s.fishbook).reduce((a, n) => a + n, 0), 'every fish is counted in the book');
  s.items.boat = 1;
  for (let i = 0; i < 300; i++) { s.time = 6; L.act('fishBoat'); }
  check(Object.keys(s.fishbook).some((id) => !FISH[id].where.includes('wall')), 'a boat finds fish the wall never sees');
}

// ---- events -----------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
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
  // Insurance pays out.
  const I = fresh(), U = fresh();
  for (const X of [I, U]) { X.s.home = 'bedsit'; X.s.cash = 10000; X.queue('burglar'); }
  I.s.ins.home = true;
  let n = 0;
  while (I.s.cash === 10000 && n++ < 30) { I.choose(0); if (I.s.cash === 10000) I.queue('burglar'); }
  n = 0;
  while (U.s.cash === 10000 && n++ < 30) { U.choose(0); if (U.s.cash === 10000) U.queue('burglar'); }
  check(I.s.cash === 9800 && U.s.cash === 7000, 'a burglary costs the insured $200 and the uninsured a great deal more');
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
}

// ---- the low road -----------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  check(L.placeActions('harbour').some((a) => a.open === 'sal') && L.placeActions('sal').some((a) => a.id === 'errand'), 'Sal’s back room is behind the harbour');
  const risk = L.riskOf(0.2), karma = s.karma;
  L.crime(0, 2, 'a test');
  s.pend = [];
  check(s.n.crimes === 1 && s.karma < karma && s.heat === 6 && L.riskOf(0.2) > risk, 'a crime is counted, blackens your name and draws the law’s eye, which makes the next one riskier');
  L.endSeason(); s.pend = [];
  check(s.heat === 0, 'the heat cools with time');
  // What the magistrate hands down.
  const F = fresh();
  F.s.cash = 5000;
  F.sentence(1);
  check(F.s.record === 1 && F.s.cash === 3500 && !F.event(), 'a petty offence is a fine and a record');
  F.sentence(2);
  check(F.event().id === 'inside' && F.s.pend[0].x.n === 3, 'something worse is prison, and longer the second time');
  F.s.job = { c: 'kitchen', r: 1, n: 0, perf: 50, raise: 0 }; F.s.home = 'bedsit';
  F.choose(0);
  check(F.s.record === 2 && F.s.f.jailed && !F.s.job && F.s.t === 3 && F.s.home === 'hostel' && F.s.time === F.timeMax(), 'three seasons inside: job gone, room gone');
  const G = fresh();
  G.queue('busted', { what: 'a crate', sev: 2 });
  check(G.event().opts.length === 5 && G.event().opts[2].chance > 0, 'caught, you can go quietly, run, bribe, send for a lawyer, or blame Sal');
  G.s.cash = 12000;
  G.choose(3);
  check(G.s.record === 1 && G.s.cash === 12000 - 8000 - 1500 && !G.event(), 'a good lawyer turns prison into a fine');
  const E = fresh();
  E.s.st.fitness = 100; E.s.st.smarts = 100;
  E.queue('inside', { n: 6 });
  E.choose(2);
  check((E.s.f.escaped && E.s.t === 1 && E.s.heat > 90) || (!E.s.f.escaped && E.s.t === 9), 'going over the wall is one season or three more');
  // Sal's crew.
  check(L.can('joinCrew').includes('crimes') && !L.placeActions('townhall').some((a) => a.id === 'apply'), 'Sal takes nobody who has not proved themselves');
  s.n.crimes = 3; s.time = 6;
  check(L.act('joinCrew').ok && s.job.c === 'crew' && L.placeActions('harbour').some((a) => a.id === 'work'), 'with three crimes behind you, you are in');
  const before = s.n.crimes;
  s.time = 2; L.act('work'); s.pend = [];
  check(s.n.crimes === before + 1 && (!s.job || s.job.c === 'crew'), 'every shift for Sal is a crime');
  if (!s.job) s.job = { c: 'crew', r: 0, n: 0, perf: 50, raise: 0 };
  s.age = 66;
  check(!L.placeActions('townhall').some((a) => a.id === 'retire') && !L.placeActions('harbour').some((a) => a.id === 'graft'), 'there is no pension in it, and nothing to embezzle');
  s.job = null;
  // Stealing.
  const T = fresh();
  let got = 0, nicked = 0;
  for (let i = 0; i < 60; i++) { T.s.time = 6; T.s.heat = 0; const c = T.s.cash; T.act('dip'); if (T.s.cash > c) got++; if (T.s.pend.length) { nicked++; T.s.pend = []; } }
  check(got > 30 && nicked > 3 && got + nicked === 60 && T.s.n.thefts === got, 'picking pockets mostly pays, and sometimes ends with a hand on your collar');
  // Bending the rules at work.
  const W = fresh();
  W.s.job = { c: 'finance', r: 2, n: 0, perf: 50, raise: 0 };
  check(W.placeActions('bank').some((a) => a.id === 'graft' && a.title.includes('should not know')), 'a banker can trade on what he should not know');
  const cash = W.s.cash;
  W.act('graft');
  check((W.s.cash > cash && W.s.job) || (!W.s.job && W.s.pend.some((e) => e.id === 'busted')), 'it pays, or it is the sack and the law');
  check(W.s.job ? W.can('graft') === 'Once a season.' : true, 'once a season at most');
  // Vices.
  const V = fresh();
  V.s.cash = 9000;
  const mood = V.s.happy, hp = V.s.health;
  V.act('binge');
  check(V.s.happy > mood && V.s.health < hp && V.s.habit.drink === 9, 'a night on the drink is a fine time, bad for you, and habit-forming');
  for (let i = 0; i < 6; i++) { V.s.time = 6; V.act('binge'); }
  check(V.hooked('drink') && V.placeActions('hospital').some((a) => a.id === 'rehab'), 'keep it up and you are hooked; the clinic can help');
  const dry = fresh();
  dry.s.time = V.s.time = 0; dry.s.happy = V.s.happy = 60; V.s.use = {}; dry.s.health = V.s.health = 80; dry.s.cash = V.s.cash;
  V.endSeason(); dry.endSeason();
  check(V.s.happy < dry.s.happy - 4 && V.s.health < dry.s.health, 'a season without it, once hooked, is a miserable one');
  V.s.pend = []; V.s.time = 6;
  V.act('rehab');
  check(!V.hooked('drink') && V.s.f.clean && !V.placeActions('hospital').some((a) => a.id === 'rehab'), 'and the clinic gets you clean');
  // Fights.
  const B = fresh();
  B.s.st.fitness = 100;
  let wins = 0;
  for (let i = 0; i < 20; i++) { B.s.time = 6; B.s.use = {}; B.s.health = 90; const c = B.s.cash; B.act('bout0'); if (B.s.cash === c + 500) wins++; }
  check(wins >= 16 && B.s.n.fights === wins && B.can('bout0') === 'Once a season.', 'a fit fighter usually beats Wee Dougie, once a season');
  // Sal's money.
  const S = fresh();
  const worth = S.netWorth();
  S.act('shark2000');
  check(S.s.shark === 2000 && S.s.cash === 3500 && S.netWorth() === worth, 'Sal lends without forms');
  S.s.time = 0; S.endSeason(); S.s.pend = [];
  check(S.s.shark === 2200, 'at ten per cent a season');
  for (let i = 0; i < 5; i++) { S.s.cash = 5000; S.endSeason(); S.s.pend = S.s.pend.filter((e) => e.id === 'legbreakers'); }
  check(S.s.pend.length === 1 && S.event().id === 'legbreakers', 'and sends people round if it drags on');
  S.s.cash = 99999;
  S.choose(0);
  check(S.s.shark === 0, 'who will take it in cash');
  // Leaning on people.
  const Q = fresh();
  Q.s.st.charm = 100;
  const mum = Q.s.people[0], bond = mum.bond, c0 = Q.s.cash;
  let asks = 0;
  while (Q.s.cash === c0 && asks++ < 20) { mum.asked = -99; mum.bond = bond; Q.act('scrounge', mum.id); }
  check(Q.s.cash > c0 && mum.bond < bond && Q.can('scrounge', mum.id).includes('not long ago'), 'your mother will lend you money, and think less of you');
  // Straying.
  check(!Q.placeActions('pub').some((a) => a.id === 'fling'), 'you cannot stray with nobody to stray from');
  const wife = Q.meet({ sex: 'f', kind: 'spouse', bond: 90 });
  let n = 0;
  while (!Q.s.n.flings && n++ < 30) { Q.s.time = 6; Q.s.cash = 500; Q.act('fling'); }
  check(Q.s.n.flings === 1 && Q.partner() === wife, 'with a wife at home, you can');
  Q.s.pend = [];
  Q.queue('caughtOut', wife.id);
  Q.choose(2);
  check(!Q.partner() && Q.s.f.divorced, 'and if she finds out and you shrug, that is that');
  // The bank job.
  const H = fresh();
  check(H.can('heist').includes('15 crimes'), 'Sal keeps the bank job for people he trusts');
  H.s.n.crimes = 15; H.s.cash = 20000;
  const hc = H.s.cash;
  H.act('heist');
  check((H.s.f.heist && H.s.cash >= hc - 10000 + 250000) || (H.event().id === 'busted' && H.s.pend[0].x.sev === 4), 'the bank job is a fortune or a hand on the collar');
  check(H.can('heist').includes('jumpy') && H.s.heat >= 45, 'and not something to try twice in a hurry');
  if (!H.s.f.heist) { H.choose(0); check(H.event().id === 'inside' && H.s.pend[0].x.n === 12, 'a dozen seasons, for the bank'); }
  // An accident with a candle.
  const A = fresh();
  A.s.cash = 500000; A.act('buyLet', 'garage');
  check(A.can('torch').includes('not insured'), 'a fire is only worth having if you are insured');
  A.s.ins.home = true;
  const c1 = A.s.cash, v = A.propValue(A.s.estate[0]);
  A.act('torch');
  check(A.s.estate.length === 0 && (A.s.cash === c1 + v || A.s.pend.some((e) => e.id === 'busted')), 'the lock-up burns, and the insurance pays unless they work it out');
  // Cheating, and a clerk with a shredder.
  const C = fresh();
  C.act('enrol', { id: 'firstaid' }); C.act('class'); C.act('class');
  C.act('cheat');
  check((C.s.edu.firstaid && C.s.edu.firstaid.g === 2) || (!C.s.course && !C.s.edu.firstaid), 'cheat in the exam and it is a distinction, or the door');
  C.s.record = 2; C.s.cash = 50000;
  C.act('bribeClerk');
  check(C.s.cash === 10000 && (C.s.record === 0 || C.s.record === 2), 'a record can be lost, for a price, usually');
}

// ---- the casino -------------------------------------------------------------------------

{
  const L = fresh();
  const s = L.s;
  s.cash = 1e7;
  let back = 0, three = true;
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
  T.s.age = 80; T.s.cash = 2e7;
  T.s.people.push(T.makePerson({ name: 'Kit', sex: 'm', kind: 'child', bond: 80, age: 40 }));
  T.kids()[0].st.craft = 77;
  T.die('old age');
  const ob = T.obituary();
  check(ob.ribbon.id === 'tycoon' && ob.inherit === 150000 && ob.heir.name === 'Kit' && ob.heir.sex === 'm' && ob.heir.st.craft === 77, 'a tycoon leaves a child the most that can be inherited, and the child takes what he learned');
  const U = fresh();
  U.s.age = 120;
  U.endSeason(); U.endSeason(); U.endSeason(); U.endSeason();
  check(U.s.dead && U.s.dead.cause === 'old age', 'nobody lives for ever');
  const I = fresh();
  I.s.ill = { name: 'flu', sev: 1 }; I.s.health = 30;
  for (let i = 0; i < 8 && I.s.ill; i++) { I.s.pend = []; I.s.ill = { name: 'flu', sev: 1 }; I.endSeason(); }
  check(!I.s.dead, 'flu alone does not kill');
}

// ---- lives saved by the first version of the game ---------------------------------------

{
  // What a save from the first version looked like: no sexes, 'spark' on
  // friends, one owned home, and rental places as plain counts.
  const N = fresh();
  N.s.cash = 900000; N.act('buyHome', { id: 'cottage' });
  const s = JSON.parse(JSON.stringify(N.s));
  Object.assign(s, { v: 1, props: { garage: 2, rental: 1 }, edu: { firstaid: 19 }, course: { id: 'culinary', p: 2 }, job: { c: 'kitchen', r: 1, n: 3 } });
  for (const k of ['sex', 'into', 'estate', 'eid', 'homeAt', 'sloan', 'food', 'ins', 'matches', 'biz', 'fishbook', 'hist']) delete s[k];
  delete s.stk.p.BAY; delete s.stk.h.BAY; delete s.stk.news;
  s.n.fish = 4;
  s.people = [
    { id: 1, name: 'Mum', kind: 'parent', bond: 60, age: 50, trait: 'kind', look: { skin: 1, hair: 1, top: 1, style: 1 } },
    { id: 2, name: 'Kofi Finch', kind: 'spouse', bond: 80, age: 30, trait: 'witty', spark: true, live: true, look: { skin: 1, hair: 1, top: 1, style: 0 } },
    { id: 3, name: 'Hana Drake', kind: 'friend', bond: 40, age: 28, trait: 'arty', spark: true, look: { skin: 1, hair: 1, top: 1, style: 2 } },
    { id: 4, name: 'Wren', kind: 'child', bond: 60, age: 7, trait: 'sporty', look: { skin: 1, hair: 1, top: 1, style: 2 } },
  ];
  const L = new Life(s);
  check(s.v === 2 && s.sex === null && s.into === null, 'an old save is brought up to date, and has yet to say who it is');
  check(s.estate.length === 4 && s.homeAt === s.estate[0].id && s.estate[0].kind === 'cottage' && s.estate.filter((e) => e.let).length === 3 && !('props' in s), 'its home and its rental places become its property');
  check(Math.abs(L.netWorth() - (N.netWorth() + 2 * L.propPrice('garage') + L.propPrice('rental'))) < 2, 'worth what it was worth');
  check(s.edu.firstaid.a === 19 && s.edu.firstaid.g === 0 && s.course.mark === 100 && s.job.perf === 50 && s.stk.p.BAY > 0, 'its courses, job and shares gain what is new');
  check(s.people[0].sex === 'f' && s.people[1].sex === 'm' && s.people[2].sex === 'f' && s.people[2].single && s.people[3].st && s.people.every((p) => !('spark' in p)), 'its people are men and women now');
  L.setSex('m', 'f');
  check(s.sex === 'm' && s.people[1].sex === 'f' && NAMES_F.includes(s.people[1].name.split(' ')[0]) && s.people[1].name.endsWith('Finch'), 'say you fall for women, and your wife is one');
  s.time = 6;
  let ok = true;
  try { for (let i = 0; i < 12; i++) { L.act('class'); L.act('work'); L.endSeason(); s.pend = []; } } catch (e) { ok = false; console.log(e); }
  check(ok && s.t >= 12, 'and it plays on');
}

// ---- practice players -------------------------------------------------------------------

const sane = (L, after) => {
  const s = L.s;
  const nums = [s.cash, s.bank, s.debt, s.sloan, s.health, s.happy, s.time, s.fame, s.idx, ...STATS.map((k) => s.st[k]), ...Object.values(s.stk.p)];
  if (!nums.every((v) => Number.isFinite(v) && v >= -1e-6)) throw new Error(`a number went wrong after ${after}: ${JSON.stringify(nums)}`);
  if (STATS.some((k) => s.st[k] > 100) || s.happy > 100 || s.health > 100 || s.fame > 100) throw new Error(`a number went over 100 after ${after}`);
  if (Math.abs(s.karma) > 100) throw new Error(`karma out of range after ${after}`);
  if (!HOMES[s.home] || (s.job && !CAREERS[s.job.c].rungs[s.job.r])) throw new Error(`a home or job that does not exist after ${after}`);
  if (s.owned !== !!L.homeEntry() || (s.owned && L.homeEntry().kind !== s.home) || (s.owned && L.homeEntry().let)) throw new Error(`the home you own is muddled after ${after}`);
  if (s.people.filter((p) => p.kind === 'partner' || p.kind === 'spouse').length > 1) throw new Error(`two partners at once after ${after}`);
  if (s.people.some((p) => p.sex !== 'm' && p.sex !== 'f')) throw new Error(`someone is neither man nor woman after ${after}`);
  if (s.biz && !(s.biz.rep >= 0 && s.biz.rep <= 100)) throw new Error(`a business with a broken name after ${after}`);
  if (!Number.isFinite(L.netWorth())) throw new Error(`worth is not a number after ${after}`);
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
  const L = Life.create({ seed, name: 'Climber', bg, sex: seed % 2 ? 'f' : 'm' });
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
    if (s.home === 'hostel' && s.cash > 4000) go('rentHome', 'bedsit');
    if (s.home === 'bedsit' && s.cash > 12000 && s.job && s.job.r >= 2) go('rentHome', 'flat');
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
    const course = want.edu && !L.hasEdu(want.edu) ? want.edu : want.degree && !L.hasDegree() ? 'business' : null;
    if (course && !s.course) {
      const pre = COURSES[course].need.edu;
      go('enrol', { id: pre && !L.hasEdu(pre) ? pre : course, loan: s.cash < 5000 });
    }
    let shifts = 0;
    for (let i = 0; i < 12 && s.time > 0 && !s.dead; i++) {
      if (s.health < 45) { if (!go('rest')) break; continue; }
      if (s.happy < 32) { if (!go('bench')) break; continue; }
      const short = STATS.find((k) => want[k] && s.st[k] < want[k]);
      const enrolShort = course && !s.course ? STATS.find((k) => COURSES[course].need[k] && s.st[k] < COURSES[course].need[k]) : null;
      const poor = s.cash < 2500;
      if (s.job && shifts < (poor ? 3 : 2) && s.time >= 2) { if (go('work')) { shifts++; continue; } }
      if (!s.job && poor && s.time >= 2) { if (go('crates')) continue; }
      if (s.course && s.course.exam && go('exam')) continue;
      if (s.course && s.time >= 2 && go('class')) continue;
      const k = enrolShort || short;
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

console.log(`Climbers: ${perCareer} lives for each of ${Object.keys(CAREERS).filter((id) => !CAREERS[id].shady).length} honest careers`);
for (const c of Object.keys(CAREERS).filter((id) => !CAREERS[id].shady)) {
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

// Does anything at all, for a whole life. Two in three keep to the
// straight and narrow; the third does not.
const LOW = new Set(['Vices', 'Under the pier', 'Light fingers', 'Behave badly', 'Under the counter', 'Work for Sal', 'Jobs', 'The ring', 'Sal’s money']);
const lowRoad = (a) => LOW.has(a.sec) || ['graft', 'cheat', 'fiddle'].includes(a.id);
function monkey(seed) {
  const wild = seed % 3 === 0;
  const L = Life.create({ seed, name: 'Monkey', bg: Object.keys(BACKGROUNDS)[seed % 6], sex: seed % 2 ? 'f' : 'm', into: ['m', 'f', 'b'][seed % 3] });
  const s = L.s;
  let guard = 0;
  while (!s.dead) {
    if (++guard > 500) throw new Error('a life that never ends');
    answer(L, true);
    for (let k = 0; k < 14 && !s.dead; k++) {
      const opts = [];
      for (const p of [...Object.keys(PLACES), 'sal']) for (const a of L.placeActions(p)) if (!a.why && !a.open && (wild || !lowRoad(a))) opts.push([a.id, a.x]);
      for (const c of Object.keys(CAREERS)) if (!L.can('apply', c)) opts.push(['apply', c]);
      for (const c of Object.keys(COURSES)) for (const loan of [false, true]) if (!L.can('enrol', { id: c, loan })) opts.push(['enrol', { id: c, loan }]);
      for (const h of Object.keys(HOMES)) {
        if (!L.can('rentHome', h)) opts.push(['rentHome', h]);
        for (const trade of [false, true]) if (!L.can('buyHome', { id: h, trade })) opts.push(['buyHome', { id: h, trade }]);
      }
      for (const kind of [...Object.keys(HOMES), ...Object.keys(PROPS)]) if (!L.can('buyLet', kind)) opts.push(['buyLet', kind]);
      for (const e of s.estate) for (const id of ['letProp', 'sellEstate', 'moveIn']) if (!L.can(id, e.id)) opts.push([id, e.id]);
      for (const p of s.people) for (const a of L.personActions(p)) if (!a.why && (wild || !lowRoad(a))) opts.push([a.id, a.x]);
      for (const kind of Object.keys(PETS)) if (!L.can('pet', kind)) opts.push(['pet', kind]);
      for (const type of Object.keys(BUSINESSES)) if (!L.can('bizStart', type)) opts.push(['bizStart', type]);
      for (const sym of Object.keys(STOCKS)) {
        const x = { sym, n: 1 + Math.floor(L.rnd() * 20) };
        if (!L.can('shares', x)) opts.push(['shares', x]);
        if (!L.can('sellShares', x)) opts.push(['sellShares', x]);
      }
      if (s.items.phone && !L.partner()) { for (let i = 0; i < L.prospects().length; i++) if (!L.can('match', i)) opts.push(['match', i]); if (!L.can('rematch')) opts.push(['rematch']); }
      for (const [id, x] of [['deposit', 500], ['withdraw', 500], ['borrow', 1000], ['repay', 500], ['repayStudent', 200], ['slots', 50], ['hiloStart', 50], ['hiloGuess', 'hi'], ['hiloGuess', 'lo'], ['hiloCash'], ['drop'], ['insure', 'health'], ['insure', 'home'], ['food', Math.floor(L.rnd() * 3)]]) if (!L.can(id, x)) opts.push([id, x]);
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
  let trophies = 0, wed = 0, kids = 0, biz = 0, owned = 0, jailed = 0;
  for (let i = 0; i < randomLives; i++) {
    try {
      const L = monkey(5000 + i);
      const o = L.obituary();
      if ((5000 + i) % 3) ages.push(o.age); else jailed += L.s.f.jailed ? 1 : 0;
      ribbons[o.ribbon.id] = (ribbons[o.ribbon.id] || 0) + 1;
      trophies += o.trophies;
      wed += L.s.f.wed ? 1 : 0; kids += L.kids().length ? 1 : 0; biz += L.s.ach.shop ? 1 : 0; owned += L.s.ach.owner ? 1 : 0;
      for (const id of Object.keys(L.s.seen)) seen.add(id);
      if (i === 0) {
        const again = monkey(5000);
        check(JSON.stringify(again.s) === JSON.stringify(L.s), 'the same seed and the same choices give the same life');
      }
    } catch (e) {
      check(false, `random life ${i} fell over: ${e.message}`);
      console.log(e.stack.split('\n').slice(0, 5).join('\n'));
      break;
    }
  }
  ages.sort((a, b) => a - b);
  const random = EVENTS.filter((e) => e.w);
  console.log(`  lived to between ${ages[0]} and ${ages[ages.length - 1]} (typically ${ages[Math.floor(ages.length / 2)]}); ${(trophies / randomLives).toFixed(1)} trophies a life; ${seen.size} of ${random.length} chance events seen`);
  console.log(`  ${wed} married, ${kids} had children, ${biz} started a business, ${owned} bought property; of the wild third, ${jailed} went to prison`);
  console.log(`  ribbons: ${Object.entries(ribbons).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  check(ages[Math.floor(ages.length / 2)] >= 60, 'even a careless life usually lasts past 60, if it keeps out of trouble');
  if (randomLives >= 40) {
    check(seen.size >= random.length * 0.75, `nearly every chance event turns up across ${randomLives} lives (${seen.size}/${random.length})`);
    check(wed > 0 && biz > 0 && owned > 0 && jailed > 0, 'some random lives marry, start a business and buy property, and some of the wild ones go to prison');
  }
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
