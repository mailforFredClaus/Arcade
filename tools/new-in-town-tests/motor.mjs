// Wheels: learning to drive, owning a car, Dobbs & Daughter's garage, and
// what a car opens up (and the trouble it can get you into).
import { MODELS, CLASSICS, STAGES, DRIVES, tradeIn, condCap } from '../../games/new-in-town/js/motor.js';
import { QUESTIONS, quizScore } from '../../games/new-in-town/js/motor-games.js';
import { GAMES } from '../../games/new-in-town/js/mini.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';
import { TROPHIES, ITEMS } from '../../games/new-in-town/js/data.js';
import { grade } from '../../games/new-in-town/js/minilogic.js';

// Clears whatever cards are waiting, taking the first choice each time; or simply drops them.
const clear = (L) => { let n = 0; while (L.event() && n++ < 20) L.choose(0); };
const skip = (L) => { L.s.pend = []; };
// A life with a licence (held a while), the to-do list out of the way.
const driver = (fresh, o) => { const L = fresh(o); L.s.motor.lic = -8; L.s.motor.th = true; L.s.motor.drv = 60; return L; };
// Answers the card on top with the option whose text starts so.
const answer = (L, start) => { const ev = L.event(); const i = ev.opts.findIndex((o) => o.t.startsWith(start)); return i >= 0 ? L.choose(i) : null; };

export default function ({ check, fresh, Life }) {
  // ---- the lists hang together ----
  for (const [id, k] of Object.entries(MODELS)) check(k.make && k.name && k.icon && k.body && k.price >= 10000 && k.rel > 0.5 && k.rel < 1.5, `${id}: a car Jess can order`);
  check(Object.values(MODELS).filter((k) => k.sport).length === 1 && MODELS.vela.price === 85000, 'one sports car, at the price it always was');
  for (const [id, k] of Object.entries(CLASSICS)) check(k.wreck < k.top * 0.25 && k.part && k.body, `${id}: a classic worth bringing back`);
  check(STAGES.length === 6 && STAGES.every((g) => g.n >= 1 && g.cost > 0 && g.says.length && g.fin !== undefined), 'six stages to a restoration');
  for (const [id, t] of Object.entries(DRIVES)) check(t.name && t.icon && t.cost > 0 && t.joy > 0 && t.blurb, `${id}: somewhere to drive to`);
  check(QUESTIONS.length >= 24 && new Set(QUESTIONS.map((q) => q.q)).size === QUESTIONS.length && QUESTIONS.every((q) => q.a.length === 3 && new Set(q.a).size === 3), 'two dozen different questions for the theory test, three answers each');
  check(grade(quizScore(8)) === 2 && grade(quizScore(7)) < 2 && quizScore(10) === 1 && quizScore(0) === 0, 'eight right out of ten is a pass in the theory test, and seven is not');
  for (const id of ['motorQuiz', 'motorRoad']) check(GAMES[id] && GAMES[id].how && GAMES[id].time > 0 && GAMES[id].words.length === 4 && typeof GAMES[id].play === 'function', `${id}: a test to play on screen`);
  for (const id of ['motorPass', 'motorFirst', 'motorTrips', 'motorCabbie', 'motorRestored', 'motorBest']) check(TROPHIES[id], `${id}: a trophy`);
  for (const id of ['motorBreakdown', 'motorMot', 'motorPub', 'motorCrash', 'motorStopped', 'motorCoast', 'motorPullOut', 'motorHitcher', 'motorVicar', 'motorTicket', 'motorBarn', 'motorTip']) check(EVENTS.some((e) => e.id === id), `${id}: a card`);
  check(!ITEMS.car && !ITEMS.sportscar && ITEMS.bike.at === 'highstreet', 'cars are not on the High Street any more; the bicycle is');

  // ---- a new life has no licence ----
  {
    const L = fresh(), s = L.s, m = s.motor;
    check(m && m.lic == null && !m.car && !s.items.car && L.timeMax() === 6, 'a new life starts with no licence and no car');
    const rows = L.placeActions('garage').map((a) => a.id);
    check(['motorLesson', 'motorTheory', 'motorTest', 'motorYardOpen', 'motorDesk'].every((id) => rows.includes(id)), 'the garage offers lessons, the tests, the forecourt and your licence');
    check(L.can('motorTest') === 'Pass the theory test first.' && L.can('motorNew', 'pip').includes('licence') && L.can('buy', 'car') && L.can('buy', 'sportscar'), 'no test before the theory, no car without a licence, and none in the shops');
    check(!L.placeActions('highstreet').some((a) => a.id === 'motorDeliver') && !L.placeActions('station').some((a) => a.id === 'motorCab'), 'no evening driving without a licence');
    check(L.can('motorTheory', 2) && L.can('motorTheory', 'x') && !L.can('motorTheory', 0.5), 'a test takes a score from 0 to 1');
  }

  // ---- learning ----
  {
    const L = fresh(), s = L.s, m = s.motor;
    s.cash = 5000;
    const c0 = s.cash, j0 = m.jess;
    check(L.act('motorLesson').ok && s.cash === c0 - 80 && s.time === 5 && m.drv > 10 && m.les === 1 && m.jess > j0, 'a lesson costs $80 and a block of time, and you learn');
    L.act('motorLesson');
    check(!L.act('motorLesson').ok && L.can('motorLesson') === 'That is enough for this season.', 'two lessons a season');
    let seasons = 1;
    while (!L.motorReady() && seasons < 10) { L.endSeason(); skip(L); s.time = 6; L.act('motorLesson'); L.act('motorLesson'); seasons++; }
    check(L.motorReady() && seasons >= 2 && seasons <= 5 && m.les >= 4 && m.les <= 9, `a year or so of lessons and Jess says you are ready (${m.les} lessons)`);
    // The theory test.
    check(L.act('motorTheory', 0.6).ok && !m.th, 'seven right out of ten is a fail');
    check(!L.act('motorTheory', 0.9).ok, 'and you can sit it again next season, not now');
    L.endSeason(); skip(L); s.time = 6;
    check(L.act('motorTheory', 0.65).ok && m.th && !L.placeActions('garage').some((a) => a.id === 'motorTheory'), 'eight right is a pass');
    // The practical.
    const r = L.act('motorTest', 0.5);
    check(r.ok && m.lic == null && m.tries === 1 && /next season/.test(r.text), 'a test with six minor faults is a fail');
    check(L.can('motorTest', 1) === 'Once a season.', 'one test a season');
    L.endSeason(); skip(L); s.time = 6;
    const p = L.act('motorTest', 0.93);
    check(p.ok && m.lic === s.t && m.passed && !m.first && s.ach.motorPass && !s.ach.motorFirst && /one minor fault/.test(p.text.replace('1 minor', 'one minor')), 'pass, and you have a licence (and a trophy)');
    check(!L.placeActions('garage').some((a) => ['motorLesson', 'motorTest'].includes(a.id)), 'no more lessons once you have it');
    const F = fresh();
    F.s.motor.th = true; F.s.motor.les = 3;
    F.act('motorTest', 1);
    check(F.s.motor.first && F.s.ach.motorFirst, 'first time, first try');
    // Played without the screen (as the practice players do), it is rolled on how ready you are.
    let ready = 0, green = 0;
    for (let i = 0; i < 200; i++) {
      const A = fresh({ seed: 100 + i }), B = fresh({ seed: 100 + i });
      for (const X of [A, B]) { X.s.motor.th = true; X.s.motor.les = 4; }
      A.s.motor.drv = 70; B.s.motor.drv = 15;
      A.act('motorTest'); B.act('motorTest');
      ready += A.s.motor.lic != null ? 1 : 0; green += B.s.motor.lic != null ? 1 : 0;
    }
    check(ready > 110 && green < 70 && ready > green * 2, `ready drivers pass more often (${ready} to ${green} in 200)`);
  }

  // ---- a car of your own ----
  {
    const L = driver(fresh), s = L.s, m = s.motor;
    s.cash = 100000;
    const y = L.motorYard();
    check(y.cars.length >= 3 && y.cars.length <= 4 && y.cars.every((c) => MODELS[c.m] && c.age >= 1 && c.price > 0 && c.cond >= 22), 'a few used cars on the forecourt');
    const u = y.cars.slice().sort((a, b) => a.price - b.price)[0], t0 = s.time, c0 = s.cash, w0 = L.netWorth();
    const r = L.act('motorBuy', u.id);
    check(r.ok && s.cash === c0 - u.price && m.car && m.car.m === u.m && !y.cars.includes(u), 'buy one, and it is yours');
    check((s.items.car || s.items.sportscar) && L.timeMax() === 8 && s.time === t0 + 2, 'and two more blocks of time, straight away');
    check(L.netWorth() < w0 && L.netWorth() > w0 - u.price, 'what it is worth counts in what you are worth, less what Jess would knock off');
    check(L.can('motorSell') === 'You have only just bought it.' && L.can('motorNew', 'pip') === 'One car a season is plenty.', 'not sold, nor swapped, the season it was bought');
    check(L.bills().some(([w, n]) => /Running the (sports )?car/.test(w) && (n === 300 || n === 1200)), 'it costs what a car always cost to run');
    L.endSeason(); skip(L);
    check(L.timeMax() === 8 && s.time === 8 && m.car.cond < (u.real ?? u.cond), 'every season: eight blocks of time, and the car a little the worse for wear');
    const w1 = L.netWorth(), c1 = s.cash, trade = L.motorTrade();
    s.time = 3;
    check(L.act('motorSell').ok && !m.car && !s.items.car && !s.items.sportscar && s.cash === c1 + trade && L.netWorth() === w1 && trade < u.price, 'sold back to Jess for three quarters of its worth');
    check(s.time === 1 && L.timeMax() === 6, 'and the time it gave goes with it');
    // Never a profit in it: anything on the forecourt, or new, fetches less than it cost, even a bargain.
    let worst = -Infinity;
    for (let i = 0; i < 60; i++) {
      const X = driver(fresh, { seed: 300 + i });
      for (const c of X.motorYard().cars) worst = Math.max(worst, tradeIn({ ...c, cond: c.real }) - c.price);
      worst = Math.max(worst, ...Object.keys(MODELS).map((id) => tradeIn({ m: id, age: 0, cond: 100 }) - MODELS[id].price));
    }
    check(worst < 0, 'no car Jess sells is worth more to her the moment it is bought');
    // Buying and selling over and over loses money every time.
    const R = driver(fresh, { seed: 77 });
    R.s.cash = 200000;
    const start = R.netWorth();
    for (let i = 0; i < 6; i++) {
      R.s.time = 6;
      const cheap = R.motorYard().cars.slice().sort((a, b) => b.price - a.price)[0];
      if (!R.can('motorBuy', cheap.id)) R.act('motorBuy', cheap.id);
      R.endSeason(); skip(R);
    }
    check(R.netWorth() < start - 3000, 'trading cars season after season costs a great deal');
  }

  // ---- part-exchange, lemons and bargains ----
  {
    const L = driver(fresh), s = L.s, m = s.motor;
    s.cash = 200000;
    L.act('motorNew', 'vela');
    check(s.items.sportscar && !s.items.car && m.car.age === 0 && m.car.cond === 100 && s.cash === 200000 - 85000, 'a new sports car');
    const ch = L.s.st.charm;
    L.gain('charm', 2);
    const sport = L.s.st.charm - ch;
    check(L.moodBase() > 0 && L.bills().some(([w, n]) => w === 'Running the sports car' && n === 1200), 'heads turn, and it costs $1,200 a season to run');
    L.endSeason(); skip(L);
    s.time = 6;
    const trade = L.motorTrade(), c0 = s.cash;
    check(L.motorNet(MODELS.pip.price) < 0 && L.act('motorNew', 'pip').ok && s.cash === c0 + trade - MODELS.pip.price && s.items.car && !s.items.sportscar, 'a sports car part-exchanged for a little one pays back the difference');
    const C = driver(fresh);
    C.s.st.charm = ch;
    C.gain('charm', 2);
    check(sport > C.s.st.charm - ch, 'and charm grows faster in the sports car');
    // A lemon looks better than it is, and Jess warns those she likes.
    const Y = driver(fresh, { seed: 5 });
    Y.s.cash = 50000;
    const lemon = Y.motorUsedCar('lemon');
    Y.motorYard().cars.push(lemon);
    Y.s.motor.jess = 10; Y.s.st.craft = 20;
    check(lemon.real < lemon.cond - 20 && !Y.motorHint(lemon), 'a lemon looks sound, and a stranger is not told');
    Y.s.motor.jess = 45;
    check(/shakes her head/.test(Y.motorHint(lemon)), 'Jess warns you if she likes you');
    Y.s.motor.jess = 10; Y.s.st.craft = 60;
    check(/do not like the sound/.test(Y.motorHint(lemon)), 'and a good mechanic can tell for themselves');
    Y.act('motorBuy', lemon.id);
    check(Y.s.motor.car.cond === lemon.real, 'buy it anyway, and you get what it really is');
    check(/part-exchange/.test(Y.motorHint(Y.motorUsedCar('bargain'))), 'a bargain is plain to see');
  }

  // ---- keeping it on the road ----
  {
    const L = driver(fresh), s = L.s, m = s.motor;
    s.cash = 100000;
    L.act('motorNew', 'pip');
    const c = m.car;
    c.cond = 40; c.age = 6;
    check(L.act('motorService').ok && c.cond === 62 && !L.act('motorService').ok, 'a service puts it right, once a season');
    c.cond = condCap(c);
    s.use = {};
    check(L.can('motorService').includes('as well as a car its age'), 'but an old car is only ever so good');
    // An MOT, every year once it is three.
    c.cond = 12; c.age = 12; c.mot = L.season;
    check(L.bills().some(([w, n]) => /MOT/.test(w) && n === 55), 'the MOT is on the bills in its season');
    let failed = false;
    for (let i = 0; i < 12 && !failed; i++) {
      c.mot = L.season; c.cond = 12; c.off = null;
      L.endSeason();
      failed = c.off === 'mot' && L.event() && L.event().id === 'motorMot';
      if (!failed) clear(L);
    }
    check(failed && !s.items.car && L.timeMax() === 6 && s.time === 6, 'a car in that state fails its MOT, and is off the road');
    check(L.bills().some(([w]) => /off the road/.test(w)) && !L.bills().some(([w]) => w === 'Running the car'), 'it still costs its tax and insurance, but not its petrol');
    const fix = c.fix, c0 = s.cash;
    answer(L, 'Have it all put right');
    skip(L);
    check(!c.off && s.items.car && s.cash === c0 - fix && L.timeMax() === 8 && s.time === 8, 'have it put right, and it is back on the road, time and all');
    // A breakdown.
    L.queue('motorBreakdown', { fix: 300 });
    answer(L, 'Leave it');
    check(c.off === 'broken' && c.fix === 360 && !s.items.car && s.time === 6 && L.placeActions('garage').some((a) => a.id === 'motorFix'), 'leave it at the roadside and it waits at the garage, off the road');
    check(L.act('motorFix').ok && !c.off && s.items.car && s.time === 6, 'the time it gives back comes once a season, not twice');
    // Fixing it yourself.
    c.off = 'broken'; c.fix = 400;
    L.motorSync(true);
    s.time = 6; s.st.craft = 95;
    const d0 = s.cash;
    check(L.act('motorDiy').ok && s.cash === d0 - 140, 'fixing it yourself costs the parts');
    // Breakdowns come oftener to a car that is not looked after.
    let poor = 0, good = 0;
    for (let i = 0; i < 40; i++) {
      for (const [cond, add] of [[25, () => poor++], [90, () => good++]]) {
        const X = driver(fresh, { seed: 900 + i });
        X.s.cash = 50000; X.act('motorNew', 'minster');
        X.s.motor.car.cond = cond; X.s.motor.car.age = 1;
        X.endSeason();
        if (X.s.pend.some((q) => q.id === 'motorBreakdown')) add();
      }
    }
    check(poor > good * 3 && poor >= 6, `a neglected car lets you down far more often (${poor} to ${good})`);
  }

  // ---- crashes, points, bans, and the drive home from the pub ----
  {
    const L = driver(fresh), s = L.s;
    s.cash = 100000;
    L.act('motorNew', 'seabird');
    // Speeding: three points at a time; twelve and you are off the road.
    check(/3 points/.test(L.motorAddPoints(3)) && L.motorPoints() === 3, 'points on your licence');
    L.motorAddPoints(3); L.motorAddPoints(3);
    s.time = 6;
    const said = L.motorAddPoints(3);
    L.motorSync(true);
    check(/ban/.test(said) && L.motorBanned() && !s.items.car && L.motorPoints() === 0 && s.time === 4, 'twelve points is a ban, and the car is no use to you');
    check(L.can('motorDeliver').includes('banned') && L.can('motorTrip', 'moor') && L.can('motorNew', 'graf').includes('banned'), 'no driving at all while banned');
    L.endSeason(); skip(L); L.endSeason(); skip(L);
    check(!L.motorBanned() && s.items.car && L.timeMax() === 8, 'a six-month ban, and then you are back on the road');
    L.motorAddPoints(3);
    for (let i = 0; i < 12; i++) { L.endSeason(); skip(L); }
    check(L.motorPoints() === 0, 'points come off after three years');
    // Drunk at the wheel.
    const D = driver(fresh, { seed: 21 });
    D.s.cash = 100000;
    D.s.st.fitness = 30;
    D.act('apply', 'police');
    D.act('motorNew', 'pip');
    const had = !!D.s.job;
    D.queue('motorStopped', { why: 'drink' });
    const rec = D.s.record, c0 = D.s.cash;
    answer(D, 'Blow');
    check(D.motorBanned() && D.s.motor.ban - D.s.t === 4 && D.s.record === rec + 1 && D.s.cash === c0 - 2500 && had && !D.s.job && D.s.heat > 0, 'over the limit: a fine, a record, a year’s ban, and a policeman loses his job');
    check(D.s.motor.car && !D.s.items.car, 'you keep the car, but cannot drive it');
    D.s.motor.ban = 0; D.motorSync(false);
    D.queue('motorStopped', { why: 'drink' });
    answer(D, 'Blow');
    check(D.s.motor.ban - D.s.t === 12, 'a second time is three years');
    // The crash at the bottom of the hill.
    const K = driver(fresh, { seed: 4 });
    K.s.cash = 100000;
    K.act('motorNew', 'graf');
    const h0 = K.s.health;
    K.queue('motorCrash');
    answer(K, 'Wait for the police');
    check(K.s.health < h0 && K.motorBanned() && (!K.s.motor.car || (K.s.motor.car.off === 'crash' && K.s.motor.car.fix > 0)), 'drunk in a crash: hurt, banned, and the insurers will not pay');
    // A sober crash: the excess, and the insurers mend it.
    const Q = driver(fresh, { seed: 6 });
    Q.s.cash = 100000;
    Q.act('motorNew', 'graf');
    const q0 = Q.s.cash, said2 = Q.motorSmash(false, 0.6);
    Q.motorSync(true);
    check(Q.s.motor.car.off === 'crash' && Q.s.motor.car.fix === 0 && Q.s.cash === q0 - 400 && /excess/.test(said2), 'a crash that was not your fault: the excess, and the insurers mend it');
    Q.endSeason(); skip(Q);
    check(!Q.s.motor.car.off && Q.s.items.car, 'back on the road next season');
    const O = driver(fresh, { seed: 6 });
    O.s.cash = 100000;
    O.act('motorNew', 'pip');
    O.s.motor.car.age = 14; O.s.motor.car.cond = 30;
    const o0 = O.s.cash, v0 = O.motorValue(), said3 = O.motorSmash(false, 1.5);
    check(!O.s.motor.car && !O.s.items.car && O.s.cash === o0 + v0 - 400 && /write-off/.test(said3), 'an old car in a bad crash is written off, and the insurers pay what it was worth');
    // Running from the police.
    const P = driver(fresh, { seed: 8 });
    P.s.cash = 100000;
    P.act('motorNew', 'pip');
    let ran = 0, caught = 0;
    for (let i = 0; i < 60; i++) {
      const X = new Life(JSON.parse(JSON.stringify(P.s)));
      X.s.rng = 4000 + i;
      X.queue('motorStopped', { why: 'speed' });
      answer(X, 'Put your foot down');
      if (X.s.pend.some((q) => q.id === 'busted')) caught++; else if (X.s.heat >= 20) ran++;
    }
    check(caught > ran && ran > 0, `putting your foot down usually ends in the back of a police car (${caught} caught, ${ran} got away)`);
    // Closing time: the card turns up after a night at the pub, now and then, if you drove there.
    let asked = 0;
    for (let i = 0; i < 40; i++) {
      const X = driver(fresh, { seed: 600 + i });
      X.s.cash = 50000;
      X.act('motorNew', 'pip');
      X.act('binge');
      if (X.event() && X.event().id === 'motorPub') { asked++; if (i % 2) answer(X, 'Drive'); else answer(X, 'Leave it'); clear(X); }
    }
    check(asked >= 8 && asked <= 28, `after drinking until closing, the car is often still outside (${asked} of 40)`);
    const N = fresh({ seed: 601 });
    N.s.cash = 5000;
    for (let i = 0; i < 6; i++) { N.act('binge'); N.s.time = 6; }
    check(!N.s.pend.some((q) => q.id === 'motorPub'), 'never without a car');
  }

  // ---- out on the road ----
  {
    const L = driver(fresh), s = L.s, m = s.motor;
    s.cash = 100000;
    check(!L.placeActions('home').some((a) => a.id === 'motorTripsOpen'), 'no days out without a car');
    L.act('motorNew', 'seabird');
    check(L.placeActions('home').some((a) => a.id === 'motorTripsOpen'), 'with one, a day out from home');
    const c0 = s.cash, j0 = s.happy;
    s.happy = 50;
    check(L.act('motorTrip', 'castle').ok && s.cash === c0 - 45 && s.happy > 50 && m.trips.castle === 1, 'a day out costs a little and does you good');
    check(L.can('motorTrip', 'moor') === 'Once a season.', 'one a season');
    void j0;
    s.t = 3; L.s.use = {};
    check(L.can('motorTrip', 'sands').includes('winter'), 'not to the beach in winter');
    for (const id of Object.keys(DRIVES)) { L.s.use = {}; s.time = 6; s.t = 1; L.act('motorTrip', id); }
    check(s.ach.motorTrips, 'everywhere on the list, and a trophy');
    // Lifts.
    const F = driver(fresh, { seed: 12 });
    F.s.cash = 100000;
    F.act('motorNew', 'pip');
    for (let i = 0; i < 3; i++) F.meet();
    let asks = 0;
    for (let i = 0; i < 8; i++) { F.endSeason(); skip(F); asks += F.s.motor.asks.length; if (F.s.motor.asks.length) break; }
    const a = F.s.motor.asks[0], p = F.person(a.p), b0 = p.bond;
    check(asks > 0 && F.s.motor.asks.length <= 2, 'now and then somebody you know could do with a lift');
    check(F.act('motorLift', p.id).ok && p.bond > b0 && !F.s.motor.asks.some((q) => q.p === p.id) && F.can('motorLift', p.id), 'give them one, and they think the better of you; once is enough');
    const stranger = F.s.people.find((q) => !F.s.motor.asks.some((k) => k.p === q.id) && q.id !== p.id);
    check(!stranger || F.can('motorLift', stranger.id), 'nobody else is waiting for one');
    // Evening work.
    const E = driver(fresh, { seed: 13 });
    E.s.motor.lic = E.s.t - 2;
    check(E.can('motorCab').includes('a year’s driving'), 'the taxi wants a year’s driving first');
    E.s.motor.lic = -8;
    check(E.can('motorDeliver').includes('car of your own'), 'deliveries need your own car');
    E.s.cash = 100000;
    E.act('motorNew', 'hauler');
    let earned = 0;
    for (let i = 0; i < 20; i++) {
      E.s.use = {}; E.s.time = 6;
      const e0 = E.s.cash;
      for (const id of ['motorCab', 'motorCab', 'motorDeliver', 'motorDeliver']) E.act(id);
      skip(E);
      earned = Math.max(earned, E.s.cash - e0);
      check(!E.act('motorCab').ok && !E.act('motorDeliver').ok, 'twice a season each');
    }
    check(earned > 600 && earned < 3600, `four evenings behind the wheel make a modest sum (at best ${earned})`);
    check(E.s.motor.n.drives >= 25 && E.s.ach.motorCabbie, 'and a trophy for doing it often');
  }

  // ---- the back bay ----
  {
    const L = fresh(), s = L.s, m = s.motor;
    s.cash = 200000; s.st.craft = 20;
    L.motorStart('swallow', CLASSICS.swallow.wreck);
    const p = m.proj;
    check(L.bills().some(([w, n]) => /back bay/.test(w) && n === 120) && L.placeActions('garage').some((a) => a.id === 'motorWork'), 'a classic in Len’s back bay, for $120 a season');
    check(L.can('motorClassicSell') === 'You have only just bought it.', 'not to be sold the day it is bought');
    let seasons = 0, spent = CLASSICS.swallow.wreck, blocks = 0;
    while (!p.done && seasons < 30) {
      s.time = 6;
      for (let k = 0; k < 2; k++) {
        if (p.need) { const c0 = s.cash; L.act('motorPartOrder'); spent += c0 - s.cash; }
        const c0 = s.cash, r = L.act('motorWork');
        if (r.ok) { spent += c0 - s.cash; blocks++; }
      }
      check(!L.act('motorWork').ok || p.done, 'two sittings a season');
      L.endSeason(); skip(L); seasons++; spent += 120;
    }
    check(p.done && seasons >= 6 && blocks === STAGES.reduce((a, g) => a + g.n, 0) && m.n.restored === 1 && s.ach.motorRestored, `a classic takes a dozen sittings over ${seasons} seasons`);
    const low = L.motorProjValue();
    check(low > CLASSICS.swallow.top * 0.4 && low < CLASSICS.swallow.top * 0.8 && low - spent < 4000, `done with little Craft, it is worth something, but not much more than it cost (${low} for ${spent})`);
    check(L.netWorth() >= low, 'it counts in what you are worth');
    // The show: summer only, once a summer.
    s.t = 4; s.use = {};
    check(!L.placeActions('ground').some((a) => a.id === 'motorShow'), 'the show is in summer');
    s.t = 5;
    check(L.act('motorShow').ok && L.can('motorShow') && m.shown === L.year, 'show it, once a summer');
    const c0 = s.cash;
    check(L.act('motorClassicSell').ok && !m.proj && s.cash === c0 + low, 'and a collector buys it');
    // Done well, it is worth a good deal more, but never more than all that time and money.
    const H = fresh({ seed: 31 });
    H.s.cash = 200000; H.s.st.craft = 95;
    H.motorStart('lucia', CLASSICS.lucia.wreck);
    let hs = CLASSICS.lucia.wreck, hb = 0, wins = 0;
    for (let i = 0; i < 30 && !H.s.motor.proj.done; i++) {
      H.s.time = 6;
      for (let k = 0; k < 2; k++) { if (H.s.motor.proj.need) { const c1 = H.s.cash; H.act('motorHunt'); H.act('motorPartOrder'); hs += c1 - H.s.cash; } const c1 = H.s.cash; if (H.act('motorWork').ok) hb++; hs += c1 - H.s.cash; }
      H.endSeason(); skip(H); hs += 120;
    }
    const top = H.motorProjValue();
    check(top > CLASSICS.lucia.top * 0.85 && top <= CLASSICS.lucia.top && top - hs < hb * 3000, `with real Craft it is worth nearly what one can be (${top} for ${hs} and ${hb} sittings)`);
    for (let y = 0; y < 6; y++) { H.s.t = 4 * (y + 3) + 1; H.s.use = {}; H.s.time = 6; H.act('motorShow'); }
    wins = H.s.motor.n.wins;
    check(wins >= 2 && H.s.ach.motorBest, `and it wins at the show more often than not (${wins} of 6)`);
    // Somewhere to find one.
    const B = driver(fresh, { seed: 40 });
    B.s.cash = 50000;
    let found = null;
    for (let i = 0; i < 40 && !found; i++) { B.s.motor.yard = null; B.s.t++; found = B.motorYard().classic; }
    check(found && B.act('motorClassicBuy', found).ok && B.s.motor.proj && !B.motorYard().classic, 'now and then something sorry turns up in the back of the forecourt');
    check(B.can('motorClassicBuy', found), 'one at a time');
    B.queue('motorBarn', 'ranger');
    check(!B.event(), 'and Tom Windle does not offer you his barn find while the bay is full');
    // The part nobody has.
    const U = fresh({ seed: 41 });
    U.s.cash = 50000;
    U.motorStart('ranger', 2300);
    Object.assign(U.s.motor.proj, { st: 2, need: CLASSICS.ranger.part });
    check(U.can('motorWork').includes('First you need') && U.placeActions('market').some((a) => a.id === 'motorHunt'), 'the engine waits for the part, which might be at the autojumble');
    let got = false;
    for (let i = 0; i < 20 && !got; i++) { U.s.use = {}; U.s.time = 6; U.act('motorHunt'); got = !U.s.motor.proj.need; }
    check(got && !U.can('motorWork'), 'found at last');
  }

  // ---- the bailiffs, and the law of the land ----
  {
    const L = driver(fresh), s = L.s;
    s.cash = 100000;
    L.act('motorNew', 'graf');
    L.motorStart('swallow', 3000);
    s.cash = 0; s.bank = 0; s.debt = 400000;
    L.endSeason(); skip(L);
    check(!s.motor.car && !s.items.car && !s.motor.proj, 'the bailiffs take the car, and the classic');
  }

  // ---- lives from before there was a garage ----
  {
    // A life with a hatchback from the High Street.
    const A = fresh();
    A.s.cash = 30000;
    A.s.items.car = 1;
    const was = JSON.parse(JSON.stringify(A.s));
    delete was.motor;
    const O = new Life(was);
    check(O.s.motor.car && O.s.motor.car.m === 'pip' && O.s.motor.lic != null && O.s.motor.old && !O.s.motor.passed && O.s.items.car && O.timeMax() === 8, 'an old car is kept, and a licence comes with it');
    check(!O.placeActions('garage').some((a) => a.id === 'motorLesson'), 'no lessons needed');
    // A sports car, and both.
    const B = fresh();
    B.s.items.sportscar = 1; B.s.items.car = 1;
    const wb = JSON.parse(JSON.stringify(B.s));
    delete wb.motor;
    const c0 = wb.cash, OB = new Life(wb);
    check(OB.s.motor.car.m === 'vela' && OB.s.items.sportscar && !OB.s.items.car && OB.s.cash > c0 && OB.bills().some(([w, n]) => w === 'Running the sports car' && n === 1200), 'a sports car stays a sports car, and Jess buys the hatchback');
    // Any life at all can be saved without this part and opened again.
    const C = fresh();
    for (let i = 0; i < 4; i++) { C.act('motorLesson'); C.endSeason(); skip(C); }
    const wc = JSON.parse(JSON.stringify(C.s));
    delete wc.motor;
    const OC = new Life(wc);
    let ok = true;
    try { for (let i = 0; i < 8; i++) { OC.s.time = 6; OC.act('motorLesson'); OC.act('work'); OC.endSeason(); skip(OC); } } catch (e) { ok = false; console.log(e); }
    check(ok && OC.s.motor && OC.s.motor.les > 0, 'and plays on');
    // The same life, opened twice, goes the same way.
    const D = driver(fresh, { seed: 55 });
    D.s.cash = 80000;
    D.act('motorNew', 'kite');
    const twin = new Life(JSON.parse(JSON.stringify(D.s)));
    for (let i = 0; i < 6; i++) { D.endSeason(); twin.endSeason(); skip(D); skip(twin); }
    check(JSON.stringify(D.s) === JSON.stringify(twin.s), 'a saved life with a car carries on exactly the same');
  }

  // ---- the plan the practice players follow ----
  {
    const L = fresh({ seed: 9 });
    L.s.cash = 60000;
    let steps = 0;
    for (let i = 0; i < 40 && !L.s.motor.car; i++) {
      L.s.time = 6;
      const step = L.motorPlan();
      if (step && !L.can(...step)) { L.act(...step); steps++; }
      L.endSeason(); skip(L);
    }
    check(L.s.motor.car && L.s.items.car && L.s.motor.passed && steps >= 6, `from no licence to a car of your own, a step at a time (${steps} steps)`);
  }
}

// For the random players: the forecourt, the order book, days out, lifts, the back bay, and the tests played well or badly.
export function moves(L) {
  const m = L.s.motor, out = [];
  if (!m) return out;
  if (m.lic != null) for (const c of L.motorYard().cars) out.push(['motorBuy', c.id]);
  if (L.rnd() < 0.05) out.push(['motorNew', L.pick(Object.keys(MODELS))]);
  if (L.rnd() < 0.1) out.push(['motorSell']);
  for (const id of Object.keys(DRIVES)) out.push(['motorTrip', id]);
  for (const a of m.asks) out.push(['motorLift', a.p]);
  if (m.yard && m.yard.classic) out.push(['motorClassicBuy', m.yard.classic]);
  if (m.proj && L.rnd() < 0.15) out.push(['motorClassicSell']);
  out.push(['motorTheory', Math.round(L.rnd() * 100) / 100], ['motorTest', Math.round(L.rnd() * 100) / 100]);
  return out;
}

