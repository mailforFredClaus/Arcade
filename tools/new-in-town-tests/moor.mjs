// Starling Moor, the third map: the trip up, the walks, finds, the stars,
// the Askwiths at Haverleigh Hall, the quarry, Fennick and its bells, the
// Curlew Award, the larder, and the moor's cards.
import { MOOR_PLACES, WALKS, WALK_IDS, FINDS, FIND_IDS, SKY, SKY_IDS, AWARD, CLUES, CLUE_IDS, QUARRY_RANKS, HALL_NEED, SYND_FEE, STEWARD_PAY } from '../../games/new-in-town/js/moor.js';
import { PLACES, TROPHIES } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';

const clean = (t) => typeof t === 'string' && t.length > 15 && !/undefined|NaN|\[object|\s\s|\.\./.test(t);
// A fresh season with nothing waiting: time back, nothing used.
const reset = (L) => { L.s.use = {}; L.s.time = 12; L.s.pend = []; };
// Answers the card on top with the option of this name (or the first that can be taken).
const answer = (L, i = 0) => { const ev = L.event(); if (!ev) return null; return L.choose(ev.opts[i] && !ev.opts[i].why ? i : ev.opts.findIndex((o) => !o.why)); };
const top = (L) => (L.s.pend[0] ? L.s.pend[0].id : null);

export default function ({ check, fresh, Life, ACTIONS }) {
  // ---- the map and the tables ----
  check(MOOR_PLACES.length === 9 && MOOR_PLACES.every((id) => PLACES[id] && PLACES[id].area === 'moor'), 'nine places out on the moor');
  {
    const L = fresh();
    for (const id of MOOR_PLACES) check(L.placeActions(id).some((a) => !a.open), `${id}: has something to do`);
  }
  check(WALK_IDS.length === 10 && WALK_IDS.every((id) => { const w = WALKS[id]; return w.name && w.miles > 0 && w.said.length >= 2 && w.said.every(clean) && PLACES[w.from]; }), 'ten walks, each with its words and its starting place');
  check(FIND_IDS.length >= 12 && FIND_IDS.every((id) => FINDS[id].worth > 0 && FINDS[id].r > 0), 'a dozen finds, each worth something');
  check(SKY_IDS.length === 12 && SKY_IDS.every((id) => { const k = SKY[id]; return k.lines.every(([a, b]) => k.stars[a] && k.stars[b] && a !== b) && k.stars.every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 100); }), 'twelve constellations, joined up properly');
  for (let q = 0; q < 4; q++) check(SKY_IDS.filter((id) => SKY[id].q.includes(q)).length >= 3, `there is something to log in season ${q}`);
  check(CLUE_IDS.every((id) => clean(CLUES[id].text) && clean(CLUES[id].where)), 'every Fennick clue reads properly');
  for (const id of ['moorWalker', 'moorRock', 'moorSky', 'moorBells', 'moorHall', 'moorGold']) check(TROPHIES[id], `trophy ${id} is in the cabinet`);

  // ---- an old life, from before the moor ----
  {
    const L = fresh();
    delete L.s.moor;
    const O = new Life(JSON.parse(JSON.stringify(L.s)));
    check(O.s.moor && O.s.moor.hall.f === 0 && O.moorWalksDone() === 0 && O.s.moor.comet > O.s.t, 'an old life is given an empty moor, and a comet to come');
    reset(O);
    check(O.act('moorStones').ok && O.endSeason(), 'and can use it at once');
    O.s.moor.hall = { f: 30 };
    const P = new Life(JSON.parse(JSON.stringify(O.s)));
    check(P.s.moor.hall.f === 30 && P.s.moor.hall.ch === 0 && P.s.moor.hall.synd === null, 'and a half-filled record is filled in');
  }

  // ---- getting there ----
  {
    const L = fresh(), s = L.s;
    s.wx = 'fair'; reset(L);
    check(L.look('moorStones').time === 2 && L.moorHow() === 'foot', 'on foot, the first thing on the moor takes a block more');
    L.act('moorStones');
    check(s.time === 10 && L.look('moorDowse').time === 1 && L.moorUp(), 'and once you are up, you are up');
    s.t++; reset(L);
    check(L.look('moorStones').time === 2, 'the next season, the trip again');
    s.items.bike = 1; s.st.fitness = 20;
    check(L.moorHow() === 'push' && L.moorTrip() === 1, 'a bicycle does not help the unfit up the hill');
    s.st.fitness = 45;
    check(L.moorHow() === 'bike' && L.moorTrip() === 0, 'but it does the fit');
    s.items.car = 1;
    check(L.moorTrip() === 0 && L.moorHow() === 'car', 'a car gets you up for nothing');
    s.wx = 'snow';
    check(L.moorTrip() === 2 && L.look('moorStones').time === 3, 'snow shuts the moor road: two blocks more, car or no car');
    // Fog loses the walker now and then, never below no time at all, and never the driver.
    let lost = 0, bad = false;
    for (let seed = 1; seed <= 60; seed++) {
      const F = fresh({ seed }); F.s.wx = 'fog'; reset(F); F.s.time = 2;
      F.act('moorStones');
      if (F.s.moor.lost) lost++;
      if (F.s.time < 0) bad = true;
    }
    check(lost > 5 && lost < 40 && !bad, `fog loses walkers on the moor now and then (${lost} in 60)`);
    let carLost = 0;
    for (let seed = 1; seed <= 30; seed++) { const F = fresh({ seed }); F.s.items.car = 1; F.s.wx = 'fog'; reset(F); F.act('moorStones'); carLost += F.s.moor.lost; }
    check(carLost === 0, 'but not in a car');
    // A hot summer may set the moor alight, and the fire shuts the wood.
    const H = fresh(); H.s.moor.fire = H.s.t; reset(H);
    check(H.can('moorForage') && H.can('moorForage').includes('fire') && !H.can('moorDrovers'), 'a moor fire shuts the wood, not the village');
  }

  // ---- the walks ----
  {
    const L = fresh(), s = L.s, m = s.moor;
    s.t = 0; s.wx = 'fair'; reset(L); s.st.fitness = 10;
    check(!L.can('moorWalk', 'ring') && L.can('moorWalk', 'water').includes('Fitness'), 'the gentle walks are for anyone; the others want Fitness');
    s.st.fitness = 70;
    check(L.can('moorWalk', 'moss').includes('map') && L.can('moorWalk', 'edge').includes('boots'), 'the rough walks want a map, or boots');
    check(L.can('moorWalk', 'round').includes('summer') && L.can('moorWalk', 'lantern').includes('winter'), 'the Round is a summer walk, the Lantern Walk a winter one');
    s.cash = 1000;
    check(L.act('moorBuyMap').ok && L.act('moorBuyBoots').ok && !L.placeActions('village').some((a) => a.id === 'moorBuyMap'), 'the post office sells a map and boots, once');
    const fit = s.st.fitness, r = L.act('moorWalk', 'moss');
    check(r.ok && clean(r.text) && m.walks.moss === 1 && s.st.fitness > fit && top(L) === 'moorBog', 'a walk across Black Moss is recorded, is good for you, and finds something in the peat');
    check(!L.act('moorWalk', 'ring').ok, 'one walk a season');
    answer(L, 0);
    check(m.f.bog === 'told' && s.log.some((e) => e.t.includes('Black Moss Man')), 'the body in the bog, reported, goes in the journal');
    s.wx = 'wet'; s.t++; reset(L);
    check(L.can('moorWalk', 'moss').includes('rain'), 'not across the bog after rain');
    for (const id of WALK_IDS) m.walks[id] = 1;
    L.after();
    check(s.ach.moorWalker, 'every walk walked: a trophy');
    check(L.can('moorWalk', 'drove') && L.can('moorWalk', 'nowhere'), 'no such walk as the drove road until it is opened, and none at all as nowhere');
  }

  // ---- finds ----
  {
    const L = fresh(), s = L.s, m = s.moor;
    let n = 0;
    for (let i = 0; i < 400; i++) { L.moorFind(i % 3 ? 'quarry' : 'moor'); n++; }
    check(L.moorFindsN() >= 10 && Object.keys(m.finds).every((id) => FINDS[id]) && !m.finds.ichthy, 'finds come from the quarry and the moor; the ichthyosaur only after a blast');
    check(L.moorSpares() > 0, 'and the second of anything is a spare');
    const c = s.cash, sp = L.moorSpares();
    check(L.act('moorSellSpares').ok && s.cash === c + sp && L.moorSpares() === 0 && !L.act('moorSellSpares').ok, 'spares sell to the visitor hut, once');
    check(L.act('moorGiveFinds').ok && !L.act('moorGiveFinds').ok && m.gifts.coll === 'museum', 'the collection goes to the museum, once');
    L.after();
    check(s.ach.moorRock, 'ten finds: a trophy');
    const F = fresh(); F.s.moor.blast = F.s.t;
    let ich = false;
    for (let i = 0; i < 300 && !ich; i++) ich = F.moorFind('quarry', 0.2).id === 'ichthy';
    check(ich, 'a blasting day can turn up the ichthyosaur');
  }

  // ---- the stars ----
  {
    const L = fresh(), s = L.s, m = s.moor;
    s.wx = 'wet'; reset(L);
    check(L.can('moorStargaze', 0.9).includes('Cloud'), 'no stars in the rain');
    s.wx = 'fair';
    const id = L.moorStarNext(), sm = s.st.smarts;
    check(L.act('moorStargaze', 0.3).ok && !m.stars[id] && s.st.smarts > sm, 'a poor night teaches you something, but logs nothing');
    check(!L.act('moorStargaze', 0.9).ok, 'once a season');
    reset(L);
    check(L.act('moorStargaze', 0.9).ok && m.stars[id] != null, 'a good night logs the shape');
    s.t++; reset(L);
    check(L.can('moorStargaze', 7) === 'Mind how you go.' && !L.act('moorStargaze', 'x').ok, 'a score out of range is refused');
    for (let t = 1; t <= 40 && L.moorStarsN() < 12; t++) { s.t = t; s.wx = 'fair'; reset(L); L.act('moorStargaze', 1); }
    check(L.moorStarsN() === 12, 'over the seasons, every constellation can be logged');
    L.after();
    check(s.ach.moorSky, 'and that is a trophy');
    // The comet.
    s.t = m.comet; s.wx = 'fair'; reset(L);
    check(L.moorComet() && L.act('moorStargaze', 0.8).ok && m.cometSeen && s.log.some((e) => e.t.includes('comet')), 'once in a life, a comet, seen through the big telescope');
  }

  // ---- the Askwiths ----
  {
    const L = fresh(), s = L.s, h = s.moor.hall;
    s.cash = 100000; s.wx = 'fair';
    for (let t = 0; t < 30; t++) { s.t = t % 4 === 3 ? t + 1 : t; reset(L); L.act('moorGardens'); }
    check(h.f >= 10 && h.f < 22, `the gardens alone get you known, and no further (${Math.round(h.f)})`);
    s.pend = [];
    // The chapters come with standing, a year apart.
    h.f = 9; h.at = -99; reset(L); s.t = 40;
    L.act('moorGardens');
    check(top(L) === 'moorHall1', 'with a little standing, Kit has a word');
    answer(L, 0);
    check(h.ch === 1 && L.moorHallNext() === null, 'a chapter told; the next must wait');
    h.f = 30; s.t += 4; reset(L); L.act('moorEstate', 0.9);
    check(top(L) === 'moorHall2' && answer(L, 0).ok && h.ch === 2 && h.lady === 1, 'tea with the dowager');
    h.f = 45; s.t += 4; reset(L); L.act('moorEstate', 0.9);
    check(top(L) === 'moorHall3' && answer(L, 0).ok && h.gallery === 'kept', 'the secret of the Lady in Grey');
    h.f = 65; s.t += 4; reset(L); L.act('moorEstate', 0.9);
    const t0 = L.timeMax();
    check(top(L) === 'moorHall4' && answer(L, 0).ok && h.steward != null && L.timeMax() === t0 - 1 && L.income().some(([w, n]) => w.includes('Steward') && n === STEWARD_PAY), 'the dowager dies; the steward’s post pays, and takes a block a season');
    h.f = 85; s.t += 4; reset(L); s.cash = 900000; L.act('moorEstate', 0.9);
    const w0 = L.netWorth(), ev = L.event();
    check(top(L) === 'moorHall5' && ev.opts.length === 3, 'the future of Haverleigh');
    const cost = L.moorShareCost();
    answer(L, 0);
    check(h.end === 'share' && h.share === cost && L.income().some(([w]) => w.includes('share in Haverleigh')) && Math.abs(L.netWorth() - (w0 - cost * 0.15)) < 5, 'a share in the Hall pays, and counts in what you are worth');
    L.after();
    check(s.ach.moorHall && L.moorHallNext() === null, 'the story told to the end: a trophy, and no more chapters');
    // The press, and the gates shut.
    const P = fresh(); P.s.moor.hall.ch = 2; P.s.pend = [{ id: 'moorHall3', x: null }];
    P.choose(2);
    check(P.s.moor.hall.gallery === 'press' && P.s.moor.hall.f === 0 && P.can('moorGift', 0) && P.moorHallNext() === null, 'tell the papers, and the Askwiths are done with you');
  }

  // ---- gifts and the syndicate, scaled to means ----
  {
    const P = fresh(), R = fresh();
    P.s.cash = 3000; R.s.cash = 2000000;
    check(P.moorGiftCost(0) === 250 && R.moorGiftCost(0) >= 20000 && R.moorGiftCost(2) > R.moorGiftCost(1), 'gifts are scaled to what you have');
    check(R.act('moorGift', 1).ok && !R.act('moorGift', 0).ok, 'one gift a year');
    R.s.t += 4;
    check(R.act('moorGift', 0).ok, 'and another the next');
    check(P.can('moorSynd').includes('invitation') && !R.can('moorSynd'), 'a gun in the syndicate is by invitation, or for the very rich');
    const c = R.s.cash, sc = R.moorSyndCost();
    R.act('moorSynd');
    check(R.s.cash === c - sc && R.bills().some(([w, n]) => w.includes('syndicate') && n === SYND_FEE) && R.placeActions('hall').some((a) => a.id === 'moorShoot'), 'it costs to buy in, and every season after');
    R.s.t = 2; reset(R);
    check(R.act('moorShoot').ok && !R.act('moorShoot').ok, 'a shoot day, once a season');
    check(R.act('moorSyndQuit').ok && !R.bills().some(([w]) => w.includes('syndicate')), 'and the gun can be given up');
  }

  // ---- the quarry ----
  {
    const L = fresh(), s = L.s, q = s.moor.quarry;
    s.st.fitness = 20; s.moor.blast = -1; reset(L);
    const lo = L.moorQuarryPay();
    s.st.fitness = 60;
    const hi = L.moorQuarryPay();
    check(hi > lo && lo >= 500 && hi < 1300, `quarry pay goes with Fitness (${lo} to ${hi}), and is no fortune`);
    const c = s.cash;
    check(L.act('moorQuarry').ok && s.cash > c && q.days === 1, 'a day at the quarry pays');
    check(L.act('moorQuarry').ok && !L.act('moorQuarry').ok, 'twice a season at most');
    // Up the ranks.
    q.days = 8; s.st.fitness = 40; reset(L); L.act('moorQuarry');
    check(top(L) === 'moorRankUp' && answer(L, 0).ok && q.rank === 1, 'Dot offers you the drill');
    q.days = 40; s.st.craft = 40; s.st.smarts = 90; s.t += 4; reset(L); s.cash = 5000; L.act('moorQuarry');
    check(top(L) === 'moorRankUp', 'and in time the shotfirer’s ticket');
    let tries = 0;
    while (q.rank < 2 && tries++ < 10) { s.t += 4; reset(L); L.act('moorQuarry'); if (top(L) === 'moorRankUp') answer(L, 0); }
    check(q.rank === 2, 'which can be passed');
    s.moor.folk.dot = 80; s.t += 4; reset(L); L.act('moorQuarry');
    check(top(L) === 'moorRankUp' && answer(L, 0).ok && q.rank === 3 && L.income().some(([w]) => w.includes('Foreman')), 'and then Dot hands you the keys: foreman, with a retainer');
    s.age = 64;
    check(L.can('moorQuarry').includes('age'), 'no work on the face past sixty-three');
  }

  // ---- Fennick ----
  {
    const L = fresh(), s = L.s, m = s.moor, d = m.drown;
    s.cash = 50000; s.wx = 'fair';
    for (let i = 0; i < 6 && !s.pend.some((e) => e.id === 'moorNance'); i++) { s.t = i; reset(L); L.act('moorDrovers'); }
    check(top(L) === 'moorNance' || s.pend.some((e) => e.id === 'moorNance'), 'Nance Dyer, once she knows you, brings out the shoebox');
    s.pend = [{ id: 'moorNance', x: null }];
    answer(L, 0);
    check(d.on != null && L.moorHasClue('nance') && !L.placeActions('reservoir').some((a) => a.id === 'moorSpire' && !a.why), 'the story begins; the spire is under water');
    // A drought brings it up.
    s.t = 13; m.dry = s.t; reset(L);
    check(L.moorDry() && L.act('moorSpire').ok && L.moorHasClue('spire'), 'in a drought you can walk down to the drowned village');
    check(L.placeActions('library').some((a) => a.id === 'moorRegister') && L.act('moorRegister').ok && L.moorHasClue('register'), 'the library has the registers');
    m.dowse = 40; reset(L);
    check(L.act('moorDowse').ok && L.moorHasClue('dowse') && L.moorDriftReady(), 'the dowsers find where the bells went');
    m.folk.dot = 5; reset(L);
    check(L.can('moorDrift').includes('Dot'), 'Dot will not open the drift for a stranger');
    m.folk.dot = 30; reset(L);
    check(L.act('moorDrift').ok && top(L) === 'moorBells', 'the old drift is opened');
    const k = s.karma;
    answer(L, 0);
    L.after();
    check(d.end === 'moorend' && s.karma > k && s.ach.moorBells && !L.moorDriftReady(), 'the bells come home: a trophy');
    // The letter comes, once enough is known.
    const T = fresh(); T.moorClue('nance'); T.moorClue('spire'); T.moorClue('register');
    check(T.s.moor.drown.letterAt === T.s.t + 4, 'with three clues, a letter is on its way');
  }

  // ---- the Curlew Award ----
  {
    const L = fresh(), s = L.s, m = s.moor;
    s.wx = 'fair'; s.st.fitness = 30; s.st.smarts = 50;
    check(L.moorAwardWho().some((w) => w.me), 'you can go for the award at eighteen');
    reset(L); L.act('moorTrain', 'me');
    check(m.award.me.tr === 1 && !L.act('moorTrain', 'me').ok, 'one training day a season');
    s.t++; reset(L); L.act('moorTrain', 'me');
    check(m.award.me.out != null && s.pend.some((e) => e.id === 'moorExped'), 'two training days, and the bronze expedition goes out');
    while (L.event()) answer(L, 1);
    check(m.award.me.out == null && (m.award.me.lvl === 1 || m.award.me.tr === 1), 'the expedition is passed, or is tried again with one more training day');
    m.award.me.lvl = 3;
    L.after();
    check(s.ach.moorGold && L.can('moorTrain', 'me'), 'gold is the top of it, and a trophy');
    s.age = 25;
    check(!L.moorAwardWho().some((w) => w.me) && L.can('moorTrain', 'me'), 'and it is for the young');
    // A child goes for it.
    const K = fresh();
    const kid = K.makePerson({ kind: 'child', age: 14, sex: 'f' }); K.s.people.push(kid);
    K.s.wx = 'fair';
    for (let i = 0; i < 2; i++) { K.s.t = i; reset(K); K.act('moorTrain', String(kid.id)); }
    check(K.s.pend.some((e) => e.id === 'moorExped' && e.x === String(kid.id)), 'a child trains, and goes on the expedition');
    const b = kid.bond, r = answer(K, 2);
    check(r && r.ok && clean(r.text) && kid.bond >= b, 'and you wave them off');
    K.s.people = K.s.people.filter((p) => p !== kid);
    K.s.pend = [{ id: 'moorExped', x: String(kid.id) }];
    check(!K.event(), 'a card about a child no longer there is dropped');
  }

  // ---- the larder ----
  {
    const L = fresh(), s = L.s, m = s.moor;
    s.t = 2; s.wx = 'fair'; reset(L);
    check(L.act('moorForage', 0.9).ok && m.larder > 0 && !L.act('moorForage', 0.9).ok, 'foraging fills the larder, once a season');
    const n = m.larder;
    check(L.income().some(([w, v]) => w.includes('larder') && v === n), 'what is in the larder comes off the bills');
    L.endSeason(); s.pend = [];
    check(m.larder === 0, 'and what is not eaten spoils');
    reset(L);
    check(L.act('moorForage', 0.05).ok && s.ill, 'a bad basket makes you ill');
  }

  // ---- nothing on the moor can be farmed ----
  {
    const L = fresh(), s = L.s;
    s.t = 1; s.wx = 'fair'; s.cash = 100000; s.st.fitness = 60; s.items.rod = 1;
    reset(L); s.time = 60;
    const c = s.cash + s.bank, h = s.happy;
    let did = 0;
    for (let i = 0; i < 6; i++) for (const id of Object.keys(ACTIONS).filter((k) => k.startsWith('moor') && !['moorGift', 'moorSynd', 'moorScope', 'moorSellSpares', 'moorGiveFinds'].includes(k))) if (L.act(id, id === 'moorWalk' ? 'ring' : id === 'moorTrain' ? 'me' : undefined).ok) did++;
    const got = s.cash + s.bank - c;
    check(did < 40 && got < 4000, `a whole season of everything on the moor is limited (${did} things, ${got} dollars)`);
    check(s.happy <= 100 && h <= s.happy, 'and does you good');
  }

  // ---- every card reads, and every choice can be made ----
  {
    let ok = true;
    for (const e of EVENTS.filter((v) => v.id.startsWith('moor'))) {
      for (let i = 0; i < 5; i++) {
        const X = fresh({ seed: 30 + i }), m = X.s.moor;
        X.s.cash = 600000; X.s.st.charm = 55; X.s.st.fitness = 50;
        m.hall.ch = Number((e.id.match(/^moorHall(\d)$/) || [0, 1])[1]) - 1; m.hall.synd = 0; m.drown.on = 0; m.drove.side = 'tom';
        m.quarry.days = 50; m.folk.dot = 80; m.folk.lamb = 40; m.n.trips = 5; m.up = X.s.t; m.walks = { ring: 1, water: 1 }; m.fire = X.s.t; X.s.wx = 'fog'; X.s.t = 1;
        m.up = 1; m.fire = 1; m.award.me = { lvl: 0, tr: 2, tt: -1, out: 0, name: 'You' };
        for (let k = 0; k < 6; k++) m.stars[Object.keys(SKY)[k]] = 0;
        X.s.people.push(X.makePerson({ kind: 'partner', bond: 70 }), X.makePerson({ kind: 'child', age: 15 }));
        let x = e.ctx ? e.ctx(X) : null;
        if (e.id === 'moorExped') x = 'me';
        X.s.pend = [{ id: e.id, x }];
        const ev = X.event();
        if (!ev) { if (i === 0) { ok = false; console.log('stale:', e.id); } break; }
        if (!clean(ev.text) || !(ev.title.length > 3) || ev.opts.some((o) => !o.t || /undefined/.test(o.t))) { ok = false; console.log('bad words:', e.id); }
        if (i >= ev.opts.length) break;
        if (ev.opts[i].why) continue;
        const r = X.choose(i);
        if (!r.ok || (r.text && !clean(r.text))) { ok = false; console.log('bad choice:', e.id, i, r.why || r.text); }
      }
    }
    check(ok, 'every moor card reads properly, and every choice can be made');
  }
}

// For the practice players: one walk, a training day and a gift now and then (the rest is on the map).
export function moves(L) {
  const s = L.s, m = s.moor;
  if (!m) return [];
  const out = [];
  const walk = WALK_IDS.find((id) => !m.walks[id] && !L.can('moorWalk', id)) || WALK_IDS.find((id) => !L.can('moorWalk', id));
  if (walk) out.push(['moorWalk', walk]);
  const who = L.moorAwardWho()[0];
  if (who) out.push(['moorTrain', who.key]);
  if (s.cash > 20000) out.push(['moorGift', 0]);
  if (m.hall.synd == null && s.cash > 200000) out.push(['moorSynd']);
  return out;
}
