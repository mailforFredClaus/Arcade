// A business worth running (firm.js): a name, staff, the office, the year's accounts, rivals, going
// under and a way back, and the family business handed on.
import { BUSINESSES, PLACES, TROPHIES } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';
import { TRADES, NATURES, NAMES, TAKEN, NEED, MAX } from '../../games/new-in-town/js/firm-lib.js';
import { SHOPS } from '../../games/new-in-town/js/wants-lib.js';
import { STALL_NAMES } from '../../games/new-in-town/js/market.js';

// Answers whatever is waiting with option i (or the first that can be taken).
const answer = (L, pick = 0) => { let ev, n = 0; while ((ev = L.event()) && n++ < 20) { const open = ev.opts.map((o, i) => ({ o, i })).filter(({ o }) => !o.why); L.choose((open[Math.min(pick, open.length - 1)] || open[0]).i); } };
// A business of this trade, named, with time and money to spare.
function started(fresh, type = 'food', o = {}) {
  const L = fresh({ name: 'Ada Penrose', ...o });
  const s = L.s;
  Object.assign(s.st, { craft: 60, charm: 55, smarts: 55, fitness: 55 });
  s.cash = 200000;
  L.act('bizStart', type);
  answer(L, 0);
  s.pend = [];
  return L;
}

export default function ({ check, fresh, Life, ACTIONS }) {
  // ---- the tables hang together ----
  for (const [type, k] of Object.entries(BUSINESSES)) {
    const T = TRADES[type];
    check(!!T && T.season.length === 4 && T.ideas.length >= 4 && T.trouble.length >= 3 && T.branch.every((p) => PLACES[p]), `firm: ${type} is a trade with seasons, ideas, troubles and places for a second premises`);
    check(NAMES[type].length >= 20 && new Set(NAMES[type]).size === NAMES[type].length, `firm: plenty of names for a ${k.names[0].toLowerCase()}`);
    check(T.season.indexOf(Math.max(...T.season)) !== T.season.indexOf(Math.min(...T.season)) || type === 'soft', `firm: ${type} has a busy season and a quiet one`);
  }
  const taken = new Set([...TAKEN, ...Object.values(SHOPS).flatMap((x) => x.signs), ...STALL_NAMES].map((x) => x.toLowerCase()));
  check(Object.values(NAMES).flat().every((n) => !taken.has(n.toLowerCase())), 'firm: no business name is one the town already has');
  check(new Set(Object.values(NAMES).flat()).size === Object.values(NAMES).flat().length, 'firm: and no two trades share a name');
  check(Object.values(NATURES).every((n) => n.hints.length >= 3), 'firm: three ways of noticing each sort of person at an interview');
  check(NEED.every((n, i) => n <= MAX[i]), 'firm: room for at least the staff a size needs');
  const ids = new Set(EVENTS.map((e) => e.id));
  for (const id of ['firmName', 'firmHands', 'firmBooks', 'firmRise', 'firmPoach', 'firmLove', 'firmLove2', 'firmIll', 'firmTheft', 'firmIdea', 'firmLeave', 'firmRetire', 'firmLate', 'firmClash', 'firmStrike', 'firmQuit', 'firmInspect', 'firmPoorly', 'firmReview', 'firmRival', 'firmWar', 'firmRumour', 'firmDeal', 'firmChain', 'firmBoard', 'firmKin', 'firmBroke', 'firmAgain']) check(ids.has(id), `firm: the card ${id} exists`);
  check(EVENTS.filter((e) => /^firm/.test(e.id)).every((e) => !e.w && e.ok), 'firm: its cards come from firm.js, not the deck, and each knows when it has gone stale');
  check(['firmTen', 'firmSendoff', 'firmSeenOff', 'firmBuyer', 'firmBest', 'firmBlack', 'firmPhoenix', 'firmFamily'].every((id) => TROPHIES[id]), 'firm: trophies');

  // ---- starting out, and a name ----
  {
    const L = fresh({ name: 'Ada Penrose' }), s = L.s;
    s.st.craft = 60; s.cash = 10000;
    check(L.placeActions('townhall').find((a) => a.id === 'bizOpen').open === 'firmStart', 'firm: the Town Hall’s list of trades is the firm’s');
    L.act('bizStart', 'food');
    check(s.cash === 6000 && !!L.firmOf() && s.biz.fid === L.firmOf().fid, 'firm: starting costs what it did, and the business is set up');
    const ev = L.event();
    check(ev && ev.id === 'firmName' && ev.opts.length === 3 && new Set(ev.opts.map((o) => o.t)).size === 3, 'firm: three names to choose from');
    const name = ev.opts[2].t;
    L.choose(2);
    check(L.firmCalled() === name && s.log.some((e) => e.t.startsWith('Went into business') && e.t.includes(name)), 'firm: the chosen name goes over the door, and in the journal');
    check(s.chap.names.firm.includes(name), 'firm: and the family will not use it again');
    L.act('bizSell'); s.pend = [];
    let again = false;
    for (let i = 0; i < 12; i++) { s.cash = 10000; s.time = 6; L.act('bizStart', 'food'); const e = L.event(); if (e.opts.some((o) => o.t === name)) again = true; L.choose(0); L.act('bizSell'); s.pend = []; }
    check(!again, 'firm: a name used once is never offered again in the life');
    check(new Set(s.firm.past.map((p) => p.name)).size === s.firm.past.length, 'firm: every business it has had has had a name of its own');
    // The enterprise fund, for somebody without the money.
    const P = fresh(), q = P.s;
    q.st.craft = 40; q.cash = 800;
    check(!!P.can('bizStart', 'food') && !P.can('firmSeed', 'food'), 'firm: short of the money, the enterprise fund will lend it');
    P.act('firmSeed', 'food'); P.choose(0);
    check(q.cash === 300 && P.firmLoan() === P.bizCost(0) - 500 && P.firmOf().seed, 'firm: for a $500 deposit, the rest on loan');
    P.act('bizSell'); q.cash = 800; q.time = 6; q.pend = [];
    check(!!P.can('firmSeed', 'food'), 'firm: and only once in a life');
  }

  // ---- working in it, and the staff ----
  {
    const L = started(fresh), s = L.s;
    s.time = 6;
    const c0 = s.cash; L.act('bizWork', 1); const best = s.cash - c0;
    const c1 = s.cash; L.act('bizWork', 0); const worst = s.cash - c1;
    check(best > worst * 1.3 && s.time === 2, 'firm: a spell of work played well pays better, and takes two blocks');
    check(!!L.can('bizWork', 7) && !L.can('bizWork'), 'firm: a score is between 0 and 1; left out, it is a fair spell');
    check(L.firmApps().length === 3 && L.firmMax() === 1, 'firm: three want a job; a stall has room for one helper');
    const a = L.firmApps()[0];
    L.act('firmHire', a.id);
    check(L.firmStaff().length === 1 && !!L.can('firmHire', L.firmApps()[0].id), 'firm: a helper is taken on, and that is all a stall can use');
    const f = L.firmForecast();
    check(f.there.cap > f.away.cap && f.there.take >= f.away.take, 'firm: the staff serve more with you there');
    check(L.firmWage(L.firmStaff()[0]) > 0 && L.firmTrade(false).wages === L.firmWage(L.firmStaff()[0]), 'firm: the wages come out of the takings');
    // The settings.
    const d = L.firmDemand();
    L.act('firmSettle', { k: 'price', v: 0 });
    check(L.firmDemand() > d && !!L.can('firmSettle', { k: 'price', v: 2 }), 'firm: cheaper brings more in, and prices change once a season');
    const stock = L.firmTrade(true).stock;
    L.act('firmSettle', { k: 'qual', v: 0 });
    check(L.firmTrade(true).stock < stock && s.time === 2, 'firm: cutting corners saves on stock, and settings take no time');
    // The year: takings go into the till, and the accounts come in.
    s.pend = [];
    for (let i = 0; i < 4; i++) { s.time = 6; L.act('bizWork'); s.pend = s.pend.filter((e) => e.id === 'firmBooks'); L.endSeason(); }
    const books = s.pend.find((e) => e.id === 'firmBooks');
    check(!!books && L.firmOf().years.length === 1, 'firm: once a year, the accounts');
    s.pend = [books];
    const ev = L.event(), till = L.firmTill(), cash = s.cash, pay = ev.opts.findIndex((o) => o.t.startsWith('Pay yourself'));
    if (till > 0 && pay >= 0) { L.choose(pay); check(s.cash === cash + Math.min(till, books.x.profit) && L.firmTill() === till - Math.min(till, books.x.profit), 'firm: paying yourself the year’s profit takes it out of the till'); }
    check(L.netWorth() > 0 && Number.isFinite(L.firmTill()), 'firm: the till counts towards what you are worth');
  }

  // ---- growing it: staff needed, the manager, a loan ----
  {
    const L = started(fresh, 'shop'), s = L.s;
    s.biz.rep = 80; s.biz.at = s.t - 10; s.time = 6;
    const cost = L.look('firmGrowLoan').cost;
    check(cost === Math.round(L.bizCost(1) * 0.25 / 100) * 100 && !L.can('firmGrowLoan'), 'firm: it can grow on a bank loan, a quarter down');
    L.act('firmGrowLoan');
    check(s.biz.lvl === 1 && L.firmLoan() === L.bizCost(1) - cost && s.pend.some((e) => e.id === 'firmHands'), 'firm: the bank lends the rest, and it wants hands');
    check(s.log.some((e) => /^The business grew into a corner shop: /.test(e.t)), 'firm: the journal says what it grew into, by name');
    answer(L, 0); answer(L, 0);
    check(L.firmStaff().length >= 1, 'firm: taken on from the card');
    L.act('bizMgr');
    check(s.biz.mgr && L.firmMgr() && L.firmWage(L.firmMgr()) > 0, 'firm: a manager is one of the staff, on more pay');
    check(L.firmTrade(false).cap > 0 && L.firmTrade(false).cap <= L.firmTrade(true).cap, 'firm: the manager keeps it trading, but not as well as you');
    const loan = L.firmLoan();
    s.pend = []; L.endSeason(); s.pend = [];
    check(L.firmLoan() < loan, 'firm: the loan is paid back out of the till, season by season');
    // Selling settles the till and the loan.
    const worth = L.bizWorth(), net = L.firmTill() - L.firmLoan(), cash = s.cash + s.bank - s.debt;
    L.act('bizSell');
    check(!s.biz && !L.firmOf() && Math.abs(s.cash + s.bank - s.debt - (cash + worth + net)) <= 1, 'firm: selling up settles the till and the loan');
  }

  // ---- going under, and a way back ----
  {
    const L = started(fresh, 'build'), s = L.s;
    s.biz.lvl = 2; L.firmOf().loan = 150000; L.firmOf().till = -200000;
    s.cash = 0; s.bank = 0;
    s.pend = []; L.endSeason();
    check(!s.biz && s.firm.fail && s.firm.past.some((p) => p.how === 'bust') && s.debt > 0, 'firm: a till run far dry and the bank calls it in: it goes under, and the debt is yours');
    check(!!L.can('bizStart', 'build') && /bank/.test(L.can('bizStart', 'build')), 'firm: and the bank will not back another for a while');
    s.t += 8; s.debt = 0;
    let came = false;
    for (let i = 0; i < 30 && !came; i++) { s.pend = []; L.endSeason(); came = s.pend.some((e) => e.id === 'firmAgain'); }
    check(came, 'firm: after a while, somebody offers a second go');
    s.pend = s.pend.filter((e) => e.id === 'firmAgain');
    L.choose(0);
    check(!!s.biz && s.biz.lvl === 0 && s.pend.some((e) => e.id === 'firmName'), 'firm: a stall again, for nothing, with a new name to choose');
  }

  // ---- rivals ----
  {
    const L = started(fresh), s = L.s;
    s.biz.lvl = 1; s.biz.rep = 60;
    const d = L.firmDemand();
    const R = L.firmRivalOpen({ kind: 'cheap', str: 40 });
    check(!!R && R.name !== L.firmCalled() && L.firmDemand() < d, 'firm: a rival opens nearby, by another name, and takes trade');
    check(!L.can('firmBuyOut'), 'firm: it can be bought out');
    L.act('firmBuyOut');
    check(!L.firmOf().rival && s.firm.f.bought && L.firmDemand() >= d * 0.95, 'firm: and its customers become yours');
    L.firmRivalOpen({ kind: 'proper', str: 2 });
    s.biz.rep = 90; s.pend = []; L.endSeason();
    check(!L.firmOf().rival && s.firm.f.seenOff, 'firm: a good name sees a weak rival off');
  }

  // ---- every card, every choice ----
  {
    let bad = 0;
    for (const e of EVENTS.filter((q) => /^firm/.test(q.id))) {
      for (let i = 0; i < 6; i++) {
        const L = started(fresh, ['food', 'shop', 'build', 'soft', 'fleet', 'design'][i]), s = L.s, c = L.firmOf();
        s.biz.lvl = 3; s.biz.rep = 60; c.board = { mood: 30, t: 0, who: ['Mr A', 'Mrs B', 'Ms C'] }; c.till = i === 2 || e.id === 'firmBroke' ? -3000 : 9000; c.loan = 1000;
        for (let n = 0; n < 4; n++) { const a = L.firmApps()[0]; L.firmTakeOn(a.id); c.apps.length || L.firmApps(); }
        c.staff.forEach((st, k) => { st.age = 30 + k * 12; st.since = -60; st.nat = ['prickly', 'fingers', 'late', 'charmer'][k % 4]; st.stolen = 9e9; st.mor = 50; });
        L.firmRivalOpen({ kind: ['cheap', 'sly', 'flash', 'proper', 'cheap', 'sly'][i], str: i % 2 ? 20 : 90 });
        L.s.people.push(L.makePerson({ kind: 'child', age: 24, bond: 70 }));
        const kid = L.kids()[0];
        if (e.id === 'firmAgain') { s.firm.fail = { t: 0, name: 'Old Firm' }; s.firm.past.push({ name: 'Old Firm', type: 'food', how: 'bust' }); L.act('bizSell'); }
        const st = c.staff;
        const x = { firmName: { fid: c.fid, names: ['A', 'B', 'C'] }, firmBooks: { take: 9000, wages: 4000, stock: 2000, over: 1000, interest: 0, other: 0, profit: i === 1 ? -2000 : 2000, n: 4, till: c.till }, firmLove: { a: st[0].id, b: st[1].id }, firmLove2: { a: st[0].id, b: st[1].id }, firmClash: { a: st[0].id, b: st[1].id }, firmPoach: { id: st[0].id, by: ['rival', 'town', 'city'][i % 3] }, firmPoorly: i, firmReview: { good: i % 2 === 0 }, firmChain: { chain: 'Test Group', offer: 500000 }, firmBoard: { k: ['grow', 'cut', 'chair'][i % 3] }, firmKin: kid.id }[e.id] ?? (['firmRise', 'firmIll', 'firmTheft', 'firmIdea', 'firmLeave', 'firmRetire', 'firmLate', 'firmQuit'].includes(e.id) ? st[i % st.length].id : null);
        if (e.id === 'firmName') c.named = false;
        if (e.id === 'firmLeave') { c.rival = null; }
        s.pend = [{ id: e.id, x }];
        const ev = L.event();
        if (!ev) { check(false, `firm: card ${e.id} could be shown (${i})`); bad++; break; }
        if (/undefined|NaN/.test(`${ev.title} ${ev.text} ${ev.opts.map((o) => o.t).join(' ')}`)) { check(false, `firm: card ${e.id} reads properly: ${ev.text}`); bad++; }
        const open = ev.opts.map((o, k) => ({ o, k })).filter(({ o }) => !o.why);
        if (!open.length) { check(false, `firm: card ${e.id} has something that can be chosen`); bad++; continue; }
        const r = L.choose(open[i % open.length].k);
        if (!r.ok || typeof r.text !== 'string' || /undefined|NaN/.test(r.text) || !(s.cash >= 0) || (s.biz && !(s.biz.rep >= 0 && s.biz.rep <= 100))) { check(false, `firm: card ${e.id}, choice ${open[i % open.length].k}: ${r.text || r.why}`); bad++; }
      }
    }
    check(!bad, 'firm: every card can be shown and answered, every way, and says something sensible');
  }

  // ---- the family: a grown child, and the heir ----
  {
    const L = started(fresh), s = L.s;
    s.biz.lvl = 1;
    for (let n = 0; n < 2; n++) L.firmTakeOn(L.firmApps()[0].id);
    const name = L.firmCalled(), staff = L.firmStaff().map((q) => q.name);
    // Old save: the firm's record lost, and opened again.
    const old = JSON.parse(JSON.stringify(s));
    delete old.firm; delete old.biz.fid;
    const O = new Life(old);
    check(!!O.firmOf() && O.firmOf().named && O.firmStaff().length >= 1, 'firm: a life saved before firm.js opens with its business named and staffed');
    s.pend = []; L.endSeason(); s.pend = [];
    const twin = new Life(JSON.parse(JSON.stringify(s)));
    check(JSON.stringify(twin.s) === JSON.stringify(s), 'firm: a saved life opens exactly as it was');
    // The heir.
    const kid = L.makePerson({ kind: 'child', age: 30, bond: 80, sex: 'f' });
    s.people.push(kid);
    s.age = 70;
    L.die('old age');
    const nx = L.chapNextLife(0);
    check(!!nx.carry.biz && nx.carry.firm && nx.carry.firm.name === name, 'firm: the will hands the business on, by its name');
    const H = Life.create({ seed: 9, name: `${kid.name}`, sex: 'f' });
    H.chapBegin(nx.carry, H.s.dreams);
    check(!!H.firmOf() && H.firmCalled() === name && H.firmStaff().some((q) => staff.includes(q.name)), 'firm: the heir runs it under the same name, with the same people');
    check(H.s.chap.names.firm && H.s.chap.names.firm.includes(name) && !H.firmNames('food', 20).includes(name), 'firm: and the next of the family will never open another by that name');
    check(H.s.firm.f.family, 'firm: the family firm');
  }

  // ---- nothing for nothing ----
  {
    const L = started(fresh), s = L.s;
    const c0 = s.cash + s.bank;
    for (const v of [0, 1, 2]) L.act('firmSettle', { k: 'hours', v });
    L.act('firmPutIn', 1000);
    check(s.cash + s.bank === c0 - 1000 && L.firmTill() === 1000, 'firm: money put into the till comes out of your pocket, and nothing comes from nothing');
    check(!!L.can('firmRepay', 100) && !!L.can('firmSack', 999), 'firm: nothing to repay, nobody to let go');
    check(!!ACTIONS.firmOffice.open && !ACTIONS.firmSettle.place && !ACTIONS.firmHire.place, 'firm: one row at the business (the office), and the rest on its sheet');
  }
}

// For the random players: hiring when it is short of hands, and the enterprise fund when they cannot pay.
export function moves(L) {
  const out = [], c = L.firmOf && L.firmOf();
  if (c && c.staff.length < L.firmNeed() && c.apps[0]) out.push(['firmHire', c.apps[0].id]);
  if (!L.s.biz && L.s.cash + L.s.bank < 4000) out.push(['firmSeed', ['food', 'shop', 'build'][L.s.t % 3]]);
  return out;
}
