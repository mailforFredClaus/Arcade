// The annals of Starling Bay: elections every four years (voting, campaigning,
// a bet, standing yourself as Deputy Mayor), promises kept and broken, the
// big events (the storm and the pier, the flood and the barrier, the railway,
// the supermarket, the royal visit...), the High Street's shops and the Gull's
// regulars changing over the decades, Years in the Bay, the Gazette, the
// obituary, old saves, and that none of it can be wrung for money or mood.
import { PLATS } from '../../games/new-in-town/js/annals.js';
import { TROPHIES, GIFTS } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';
import UI from '../../games/new-in-town/js/annals-ui.js';

const CARDS = ['anPoll', 'anCount', 'anManifesto', 'anIncumbent', 'anCause', 'anBudget', 'anStorm', 'anPierFund', 'anPierOpen', 'anMarket', 'anShopLocal', 'anCutbacks', 'anFilm', 'anFilmAir',
  'anEstate', 'anChair', 'anLine', 'anLineEnd', 'anLineBack', 'anFlood', 'anRoyal', 'anHeat', 'anLidoFund', 'anLidoOpen', 'anWake', 'anMeeting', 'anRemember', 'anSchool', 'anFifty', 'anPlay'];

export default function ({ check, fresh, Life }) {
  // The turn of a season, and what it sent for (the cards are then put away).
  const turn = (L) => { L.endSeason(); const ids = L.s.pend.map((e) => e.id); L.s.pend = []; L.s.time = 20; return ids; };
  const till = (L, t) => { const seen = []; while (L.s.t < t) seen.push(...turn(L)); return seen; };
  const bill = (L, what) => (L.bills().find((r) => r[0] === what) || [0, 0])[1];
  const pays = (L, what) => (L.income().find((r) => r[0] === what) || [0, 0])[1];
  // (Makes every chance come off, or not, for a moment.)
  const rigged = (L, yes, f) => { const was = L.chance; L.chance = () => yes; try { return f(); } finally { L.chance = was; } };

  // ---- the lists hang together ----
  {
    for (const [id, P] of Object.entries(PLATS)) {
      check(P.name && P.icon && P.pitch && P.base > 0 && P.keep > 0 && P.keep <= 1 && P.works >= 0, `${id}: a proper promise`);
      check(id === 'steady' || (P.drop && P.drop.length === 2), `${id}: says what happens if it is given up`);
      check(id === 'steady' || ['pier', 'homes', 'jobs', 'line'].includes(id) || (P.done && P.done.length === 3), `${id}: says what happens when it is done`);
    }
    for (const id of CARDS) check(EVENTS.some((e) => e.id === id && !e.w), `card ${id} is in the deck, and only comes when it is sent for`);
    for (const id of ['anVoter', 'anMaker', 'anRibbon', 'anAlbum']) check(TROPHIES[id], `trophy ${id} is there`);
  }

  // ---- a new life, and an old one ----
  {
    const L = fresh(), an = L.s.annals;
    check(an && an.mayor.k === 'penn' && an.poll === 8 && an.from === 0 && !an.race, 'a new life starts with Mayor Pennington, and the first election in its third spring');
    check(an.shops.length === 6 && new Set(an.shops.map((x) => x.n)).size === 6 && an.bar.length === 6 && an.bar.some((r) => r.n === 'Big Tam'), 'six shops that come and go on the High Street, and six regulars at the Gull, Big Tam among them');
    check(!L.annalsPennOut() && L.folkName('penn') === 'Mayor Pennington', 'and the mayor is the mayor');
    // An old save: the town's own record starts where it is.
    const O = fresh();
    till(O, 13);
    const old = JSON.parse(JSON.stringify(O.s));
    delete old.annals;
    const R = new Life(old), ra = R.s.annals;
    check(ra && ra.from === 13 && ra.poll >= 19 && ra.poll % 4 === 0 && ra.mayor.k === 'penn', 'a life saved before the annals opens with them, starting from where it is');
    check(ra.yr.some((y) => y.a === 18 && !y.h && y.m) && ra.yr.every((y) => y.a < 21), 'and its own years before then come from the journal');
    let ok = true;
    try { till(R, 60); } catch (e) { ok = false; console.log(e); }
    check(ok && R.s.annals.yr.some((y) => y.h) && R.s.annals.last, 'and plays on: elections, headlines and all');
    // An old save in which you are mayor already, or the drains have done for Pennington.
    const Y = fresh();
    till(Y, 5);
    Y.s.job = { c: 'politics', r: 4, n: 0, perf: 60, raise: 0 }; Y.s.f.elected = 1;
    const y = JSON.parse(JSON.stringify(Y.s));
    delete y.annals;
    const YY = new Life(y);
    check(YY.s.annals.mayor.k === 'you' && YY.annalsPennOut() && !YY.s.log.some((e) => /takes the chain/.test(e.t)), 'an old save in which you are mayor carries on with you as mayor, quietly');
    const D = JSON.parse(JSON.stringify(O.s));
    delete D.annals; D.f.drains = 2;
    const DD = new Life(D);
    check(DD.s.annals.mayor.name === 'Iris Penhallow' && DD.annalsPennOut() && DD.folkName('penn') === 'Mr Pennington', 'and one in which Pennington resigned over the drains has the woman from the chemist’s as mayor');
    // A half-filled save keeps what it has.
    check(JSON.stringify(new Life(JSON.parse(JSON.stringify(R.s))).s.annals) === JSON.stringify(R.s.annals), 'opening a saved life changes nothing in its annals');
  }

  // ---- an election: nominations, a vote, a bet, the count ----
  {
    const L = fresh(), s = L.s, an = s.annals;
    s.cash = 20000;
    check(L.can('anCampaign', 'penn') && L.can('anBet', { k: 'penn', n: 100 }), 'no campaigning or betting with no election on');
    till(L, 6);
    const r = an.race;
    check(!!r && r.c.length >= 2 && r.c.length <= 3 && r.c[0].k === 'penn' && r.c.every((c) => PLATS[c.plat]), 'two seasons before polling day the nominations are in, Pennington among them');
    check(new Set(r.c.map((c) => c.plat)).size === r.c.length, 'and each stands for something different');
    const k = r.c[1].k, sup = r.sup[k], t0 = s.time;
    check(L.act('anCampaign', k).ok && r.sup[k] > sup && s.time === t0 - 1, 'campaigning for somebody takes time and helps them');
    check(!L.act('anCampaign', k).ok, 'and is once a season');
    const cash = s.cash;
    check(L.act('anBet', { k, n: 500 }).ok && s.cash === cash - 500 && r.bet.on === k, 'a bet at the bookmaker’s');
    check(!L.act('anBet', { k: 'penn', n: 100 }).ok && !L.act('anBet', { k, n: 777 }).ok, 'one bet an election, at the stakes on the board');
    const ch = L.annalsChances(), total = Object.values(ch).reduce((a, b) => a + b, 0);
    check(Math.abs(total - 1) < 1e-9 && L.annalsPriceSaid(k).length > 2, 'the chances add up, and the bookmaker has a price');
    const ids = till(L, 8);
    check(L.s.t === 8 && ids.includes('anPoll'), 'polling day brings a ballot paper');
    s.pend = [{ id: 'anPoll', x: null }];
    const ev = L.event();
    check(ev && ev.opts.length === r.c.length + 1, 'with a cross for each, or staying at home');
    L.choose(1);
    check(an.n.votes === 1 && r.vote === k, 'a vote is cast');
    // The count: rig it for the challenger.
    r.sup[k] = 1000;
    for (const c of r.c) if (c.k !== k) r.sup[c.k] = 1;
    const a = r.bet.a, b = r.bet.b;
    const sent = turn(L);
    check(!an.race && an.last && an.last.win === k && an.mayor.k === k && an.poll === 24, 'the count, at the turn of the season: a new mayor, and the next election four years on');
    check(an.n.betWon === Math.round(500 * (1 + a / b)) - 500 && sent.includes('anCount'), 'the bet pays out at its price, and the count is a card for those who had a hand in it');
    check(an.penn === 'out' && L.annalsPennOut() && L.folkPennOut() && L.folkName('penn') === 'Mr Pennington', 'Mayor Pennington, beaten, is plain Mr Pennington');
    check(an.mayors.length === 2 && (an.n.backed || 0) === 1, 'the town remembers its mayors, and you backed the winner');
    // What they promised gets going.
    const P = an.last.plat;
    check(P === 'steady' || an.plan.some((w) => w.p === P) || (PLATS[P].ok && !PLATS[P].ok(L)), 'the winner starts on the promise');
    check(L.can('anCampaign', k) && L.can('anBet', { k, n: 100 }), 'and the campaigning and betting are over');
  }

  // ---- standing yourself ----
  {
    const L = fresh({ seed: 11 }), s = L.s, an = s.annals;
    s.cash = 100000;
    s.job = { c: 'politics', r: 3, n: 60, perf: 70, raise: 0 };
    Object.assign(s.st, { charm: 90, smarts: 70 });
    s.karma = 60; s.fame = 30;
    check(L.can('mayor') && /next election/.test(L.can('mayor')), 'a Deputy Mayor cannot stand until nominations open');
    till(L, 6);
    check(!L.can('mayor'), 'once they are, you can');
    const cash = s.cash;
    check(L.act('mayor').ok && s.cash === cash - 20000 && an.race.you && an.race.c.some((c) => c.k === 'you'), 'standing costs the campaign, and puts your name on the paper');
    check(L.can('mayor') && L.can('anCampaign', an.race.c[0].k === 'you' ? an.race.c[1].k : an.race.c[0].k), 'once is enough, and you cannot campaign for somebody else');
    check(L.event() && L.event().id === 'anManifesto', 'and the Gazette wants your manifesto');
    const pick = L.event().opts.findIndex((o) => !o.why && o.t !== 'Steady as she goes');
    L.choose(pick);
    const mine = an.mine;
    check(mine && mine !== 'steady' && an.race.c.find((c) => c.k === 'you').plat === mine, 'what you promise goes on your leaflets');
    const odds = L.annalsYourOdds();
    check(L.act('anCampaign', 'you').ok && L.annalsYourOdds() > odds, 'campaigning for yourself helps your chances');
    till(L, 8);
    rigged(L, true, () => turn(L));
    check(an.race === null && an.last.win === 'you', 'the count');
    check(s.f.elected && an.mayor.k === 'you' && L.annalsMayor().k === 'you' && an.mayors.includes(s.name), 'a win makes you mayor-elect, and the town’s mayor');
    check(L.folkPennOut(), 'and Pennington is out');
    s.time = 20;
    L.act('work');
    check(s.job.r === 4 && s.f.wasMayor, 'the next shift, and you take the chain');
    check(an.plan.some((w) => w.p === mine && w.by === 'you') || (PLATS[mine].ok && !PLATS[mine].ok(L)), 'your promise is under way');
    // Four years on: stand again or stand down.
    till(L, 22);
    check(an.race && an.race.you && an.race.c.some((c) => c.k === 'you'), 'the sitting mayor is on the paper again');
    rigged(L, false, () => { till(L, 25); });
    check(s.job.r === 3 && !s.f.elected && an.mayor.k !== 'you' && s.log.some((e) => /Lost the mayoralty/.test(e.t)), 'voted out, you go back to being Deputy Mayor');
    check(s.f.wasMayor && L.folkPennOut(), 'but you were mayor, and that stays');
    // Out of politics altogether while mayor: the deputy minds the shop, and the chain is not yours to walk back into.
    const M = fresh({ seed: 12 });
    M.s.job = { c: 'politics', r: 4, n: 0, perf: 70, raise: 0 };
    M.s.f.elected = 1;
    turn(M);
    check(M.s.annals.mayor.k === 'you', 'a mayor from before the annals is the town’s mayor');
    M.s.job = null;
    turn(M);
    check(M.s.annals.mayor.k !== 'you' && M.s.annals.mayor.acting && !M.s.f.elected, 'and when you leave, an acting mayor takes over until the election');
  }

  // ---- promises kept and broken ----
  {
    const L = fresh(), s = L.s, an = s.annals;
    an.plan.push({ p: 'lido', by: 'c9', byName: 'Kit Finch', at: s.t, due: s.t + 2, keep: true, drop: null });
    check(bill(L, 'Council rates: towards the lido on the front') === 30, 'the rates pay for it while it is built');
    check(!L.placeActions('cove').some((a) => a.id === 'anLido'), 'no lido yet');
    till(L, 2);
    check(an.built.lido === 2 && !an.plan.length && !bill(L, 'Council rates: towards the lido on the front'), 'two seasons on, the lido opens, and the rates go back down');
    s.t = 5; s.time = 20; s.cash = 100;
    check(L.placeActions('cove').some((a) => a.id === 'anLido') && L.act('anLido').ok && !L.act('anLido').ok && s.cash === 94, 'a swim at the lido, once a season, for a few dollars');
    s.t = 7; s.use = {};
    check(/winter/.test(L.can('anLido')), 'and not in winter');
    an.plan.push({ p: 'bypass', by: 'c9', byName: 'Kit Finch', at: s.t, due: s.t + 12, keep: false, drop: s.t + 1 });
    const mood = L.moodBase();
    turn(L);
    check(!an.plan.length && !an.built.bypass && an.sour === L.s.t && an.mbroke === 'c9', 'a promise not kept is quietly given up');
    check(L.moodBase() < mood + 1, 'and the town is sour about it for a while');
  }

  // ---- the storm and the pier ----
  {
    const L = fresh(), s = L.s;
    s.cash = 20000;
    check(!L.can('slots', 50), 'the Lucky Gull is open');
    L.annalsStart('storm');
    const e = s.annals.ev.storm;
    check(e.shut && /shut/.test(L.can('slots', 50)) && /shut/.test(L.can('slotsOpen')) && /shut/.test(L.can('bjStart', 50)), 'the storm takes the pier, and the Lucky Gull is shut');
    check(L.placeActions('casino').every((a) => a.why) && L.annalsPlace('casino').length === 1, 'every game on the pier is shut, and its sheet says why');
    check(s.pend.some((p) => p.id === 'anStorm') && s.wx === 'storm' && s.annals.lead.h === 'Great storm wrecks the pier', 'a card for the night of the storm, and the Gazette has its lead');
    check(L.annalsAppeals().includes('pier'), 'the Pier Trust opens an appeal');
    const due = e.due;
    check(L.act('anGive', { to: 'pier', n: 10000 }).ok && e.due === due - 4 && e.trust === 10000, 'giving to the Pier Trust brings the day nearer');
    check(!L.act('anGive', { to: 'pier', n: 100 }).ok, 'once a season');
    s.cash = 3000000;
    check(L.act('fund', 'pier').ok && !e.shut && !L.can('slots', 50), 'paying for the whole pier through the mayor’s appeal mends it at once');
    // A daredevil (soul.js) has a choice of their own on the night of the storm.
    const Dd = fresh();
    Dd.s.soul.has.daredevil = 0;
    Dd.annalsStart('storm');
    Dd.s.pend = Dd.s.pend.filter((p) => p.id === 'anStorm');
    check(Dd.event().opts.some((o) => /watch it/.test(o.t)) && !L.event().opts.some((o) => /watch it/.test(o.t)), 'a daredevil can go down to the front to watch the storm');
    const H = fresh();
    H.s.gifts.pier = 'Gran Test';
    H.annalsStart('storm');
    check(!H.s.annals.ev.storm.shut && !H.can('slots', 50), 'a pier the family rebuilt rides the storm out');
    const T = fresh();
    T.annalsStart('storm');
    T.s.annals.ev.storm.due = 3;
    till(T, 3);
    T.s.cash = 5000;
    check(!T.s.annals.ev.storm.shut && !T.can('slots', 50), 'in time the Pier Trust mends it anyway');
  }

  // ---- the flood and the barrier ----
  {
    const own = (L, kind) => { const s = L.s; s.home = kind; s.estate.push({ id: s.eid, kind, ups: {}, let: false }); s.homeAt = s.eid++; s.owned = true; };
    const L = fresh(), s = L.s;
    own(L, 'cottage');
    s.cash = 50000;
    const value = L.propValue(L.homeEntry());
    L.annalsStart('flood');
    check(s.cash === 50000 - Math.max(2000, Math.round(value * 0.02 / 100) * 100), 'the sea comes into a cottage by the harbour, and putting it right costs money');
    check(/flood/.test(L.can('lotto')) && L.can('rest') === null, 'the High Street is shut for the season, but home is still home');
    turn(L);
    check(!L.can('lotto'), 'and opens again the season after');
    const I = fresh();
    own(I, 'cottage'); I.s.ins.home = true; I.s.cash = 50000;
    I.annalsStart('flood');
    check(I.s.cash === 49500, 'insurance pays for all but $500');
    const B = fresh();
    own(B, 'cottage'); B.s.cash = 50000; B.s.annals.built.barrier = 0;
    B.annalsStart('flood');
    check(B.s.annals.ev.flood.held && B.s.cash === 50000 && !B.can('lotto'), 'behind a tidal barrier the town stays dry');
    const V = fresh();
    own(V, 'villa'); V.s.cash = 50000;
    V.annalsStart('flood');
    check(V.s.cash === 50000, 'and a villa on the cliff is above it all');
  }

  // ---- the railway ----
  {
    const L = fresh(), s = L.s;
    L.annalsStart('line');
    const e = s.annals.ev.line;
    check(e.decide === s.t + 8 && L.annalsAppeals().includes('line') && s.pend.some((p) => p.id === 'anLine'), 'the line is threatened, and there is a campaign to join');
    e.decide = s.t + 1; e.effort = 0;
    const idx = s.idx;
    rigged(L, false, () => turn(L));
    check(e.shut === s.t && Math.abs(s.idx / idx - 0.96) < 0.06 && s.annals.lead.h === 'The last train leaves Starling Bay', 'the line closes, and house prices dip');
    s.cash = 5000; s.time = 20;
    check(L.act('trip', 'camping').ok && s.cash === 5000 - 300 - 150, 'a holiday means the coach, at $150 on top');
    check(L.annalsPlace('station').length && L.annalsOn().some(([i]) => i === '🚌'), 'the station says so');
    e.due = s.t + 1;
    turn(L);
    check(e.back === s.t && !L.annalsOn().some(([i]) => i === '🚌'), 'and in time the trains run again');
    const S = fresh();
    S.annalsStart('line');
    S.s.annals.ev.line.decide = 1;
    rigged(S, true, () => turn(S));
    check(S.s.annals.ev.line.saved && !S.s.annals.ev.line.shut, 'or the line is saved');
  }

  // ---- the supermarket ----
  {
    const L = fresh(), s = L.s;
    s.cash = 100000; s.st.charm = 60; s.st.smarts = 60;
    s.home = 'bedsit';
    L.act('bizStart', 'shop');
    const food = bill(L, 'Food and bills');
    L.annalsStart('market');
    s.annals.ev.market.due = s.t + 1;
    turn(L);
    check(s.annals.ev.market.open === s.t && bill(L, 'Food and bills') === food - 80, 'the supermarket opens, and the weekly shop is cheaper');
    check(!!s.biz && bill(L, 'Trade lost to the supermarket') > 0, 'but a shop on the High Street loses trade to it');
    check(s.annals.gone.length === 1, 'and one of the old shops closes');
    s.annals.ev.market.local = 1;
    const half = bill(L, 'Trade lost to the supermarket');
    s.annals.ev.market.local = 0;
    check(half < bill(L, 'Trade lost to the supermarket'), 'shopping local halves the loss');
  }

  // ---- a royal visit, the Gazette, and jail ----
  {
    const L = fresh(), s = L.s;
    L.annalsStart('royal');
    const g = L.gazette();
    check(g.lead.h === 'A royal visit' && g.items.some((i) => i.h === 'From the Town Hall'), 'the Gazette leads with the town’s news when nothing bigger has happened to you');
    check(s.pend.some((p) => p.id === 'anRoyal'), 'and there is a card for it');
    const J = fresh();
    J.jail(2);
    J.s.pend = [];
    J.annalsStart('royal');
    check(!J.s.pend.length && J.s.annals.ev.royal, 'in Starling Gaol the town goes on without you, and sends no cards');
  }

  // ---- forty years: mayors, shops, regulars, the album and the obituary ----
  {
    const L = fresh({ seed: 5 }), s = L.s, an = s.annals;
    let votes = 0;
    const bad = (t) => /undefined|NaN|null|\[object/.test(t);
    let printed = true;
    const live = (X, count = () => {}) => {
      while (X.s.age < 60) {
        X.endSeason();
        let ev, n = 0;
        while ((ev = X.event()) && n++ < 30) { count(ev); if (bad(ev.title + ev.text + ev.opts.map((o) => o.t).join())) printed = false; X.choose(ev.opts.findIndex((o) => !o.why)); }
        X.s.time = 20; X.s.health = Math.max(X.s.health, 60);
        const g = X.gazette(), places = ['pub', 'highstreet', 'townhall', 'casino', 'station', 'park', 'cove'].flatMap((p) => X.annalsPlace(p).map((q) => q[1]));
        if (bad(JSON.stringify(g)) || places.some(bad) || X.annalsOn().some((q) => bad(q[1])) || X.annalsWorks().some((w) => bad(w.state + w.by))) printed = false;
      }
    };
    live(L, (ev) => { if (ev.id === 'anPoll') votes++; });
    check(printed, 'forty years of cards, Gazettes and place notes, all printed properly');
    check(an.yr.length === 42 && an.yr.every((y, i) => y.a === 18 + i && typeof y.h === 'string' && y.h.length > 4 && y.i), 'a headline for every year in the Bay, from 18 on');
    check(new Set(an.yr.map((y) => y.h)).size >= 30, 'and they are not all the same');
    check(an.mayors.length >= 3 && an.penn === 'out', 'mayors come and go, and Pennington goes in the end');
    check(Object.keys(an.ev).length >= 4, `the big events come (${Object.keys(an.ev).join(', ')})`);
    check(an.shops.length === 6 && new Set(an.shops.map((x) => x.n)).size === 6 && (an.n.shops || 0) >= 3, 'the High Street changes, and always has six shops of its own');
    check(an.bar.length >= 5 && an.bar.length <= 7 && an.bar.some((r) => r.n === 'Big Tam') && an.bar.some((r) => r.at > 0), 'the Gull’s regulars grow old and younger faces come in; there is always a Big Tam');
    check(votes >= 8 && (an.n.votes || 0) >= 8, 'and you get to vote every four years');
    const now = L.annalsYears();
    check(now[now.length - 1].now && now[now.length - 1].a === s.age, 'Years in the Bay ends with this year, so far');
    check(L.annalsPlace('pub').length >= 1 && L.annalsPlace('highstreet').length >= 1 && L.annalsPlace('townhall').length === 1, 'the pub, the High Street and the Town Hall say how things stand');
    L.die('old age');
    const ep = L.epitaph().join(' ');
    check(/lived through|mayors come and go/.test(ep) && !/undefined|NaN|\s\s/.test(ep), 'the obituary remembers what the town went through');
    // The same seed, the same town.
    const M = fresh({ seed: 5 });
    live(M);
    check(JSON.stringify(M.s.annals) === JSON.stringify(s.annals), 'the same seed and the same choices give the same town');
  }

  // ---- a saved life carries on exactly the same, even mid-election ----
  {
    const L = fresh({ seed: 9 });
    till(L, 7);
    const twin = new Life(JSON.parse(JSON.stringify(L.s)));
    turn(L); turn(twin); turn(L); turn(twin);
    check(JSON.stringify(L.s) === JSON.stringify(twin.s), 'a life saved in the middle of an election carries on just the same');
  }
}

// The random players campaign, bet and give now and then, sparingly.
export function moves(L) {
  const an = L.s.annals, out = [];
  if (!an) return out;
  if (an.race && L.s.t % 2 === 0) { const c = an.race.c[L.s.t % an.race.c.length]; out.push(['anCampaign', c.k]); if (!an.race.bet && L.s.t % 3 === 0) out.push(['anBet', { k: c.k, n: 100 }]); }
  const to = L.annalsAppeals()[0];
  if (to && L.s.t % 5 === 0) out.push(['anGive', { to, n: 100 }]);
  return out;

  // ---- the words for it ----
  {
    // A storm the pier rode out, and a flood the barrier kept out, are not remembered as the ones that did the damage.
    const H = fresh();
    H.s.gifts.pier = 'Gran';
    H.annalsStart('storm'); H.s.pend = [];
    H.s.annals.built.barrier = 0;
    H.annalsStart('flood'); H.s.pend = [];
    H.die('old age');
    const ep = H.epitaph().join(' ');
    check(/rode out/.test(ep) && /kept out/.test(ep) && !/took the pier/.test(ep), `the obituary remembers the storm and the flood as they were (${H.annalsLived().join('; ')})`);
    // Pennington is Mayor Pennington until the count, even once he has said he will not stand again.
    const P = fresh();
    P.s.annals.mayor.age = 75;
    till(P, P.s.annals.poll - 1);
    check(P.s.annals.race && P.s.annals.penn === 'out' && P.s.annals.mayor.k === 'penn' && !P.annalsPennOut() && P.folkName('penn') === 'Mayor Pennington', 'Mayor Pennington, standing down, is still the mayor while the race is on');
    till(P, P.s.annals.poll + 2);
    check(P.s.annals.mayor.k !== 'penn' && P.folkName('penn') === 'Mr Pennington', 'and plain Mr Pennington after the count');
    // Seasons before this life began are told as so long ago.
    check(!/undefined|year -|year 0/.test(P.annalsWhen(-5)) && /ago/.test(P.annalsWhen(-5)), `the seasons before this life began (${P.annalsWhen(-5)})`);
    // Years in the Bay: the year in progress is not counted twice, and the story begins where the life did.
    const kit = { esc: (t) => String(t), money: (n) => `$${n}`, chip: () => '', pick: () => '', actRow: () => '', face: () => '', life: null };
    const ui = UI(kit);
    const Y = fresh();
    till(Y, 30);
    kit.life = Y;
    const sh = ui.sheets.annalsYears(), so = Number((sh.body.match(/(\d+) years? so far/) || [])[1]), heads = Number(sh.sub.split(' ')[0]);
    check(heads === Y.s.annals.yr.filter((y) => y.h).length && heads <= so, `Years in the Bay counts the years gone by, not the one in progress (${sh.sub}; ${so} so far)`);
    check(/came to Starling Bay at eighteen/.test(sh.body), 'and a life off the train came to the Bay at eighteen');
    Y.s.chap.start = { how: 'home', age: 40 };
    check(/born in Starling Bay, and has lived here all/.test(ui.sheets.annalsYears().body) && !/at eighteen with one suitcase/.test(ui.sheets.annalsYears().body), 'one who grew up here was born here');
    Y.s.chap.start = { how: 'back', age: 18 };
    check(/came home at eighteen/.test(ui.sheets.annalsYears().body), 'and one who came home, came home');
  }

}
