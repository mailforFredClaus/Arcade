// New in Town: the screen for wheels (the rules are motor.js). Dobbs &
// Daughter's books (your licence, your car, the back bay), the forecourt,
// the day trips, a Car box on the Me tab, a box of people who could do with
// a lift on the People tab, and the two driving tests, played on screen.

import { MODELS, CLASSICS, STAGES, DRIVES, carValue } from './motor.js';
import './motor-games.js';
import { SEASONS } from './data.js';

export default function (kit) {
  const { esc, money, cashShort, chip, pick, actRow, face, sfx, toast, playMini, doAct, an } = kit;
  const An = (w) => { const t = an(w); return t[0].toUpperCase() + t.slice(1); };
  const T = (n) => (n ? ` ${chip('time', `⏱ ${n}`)}` : '');
  const cost = (n) => (n > 0 ? ` · ${cashShort(n)}` : '');
  const pct = (n) => `${Math.max(0, Math.min(100, n))}%`;
  // A condition bar: green when sound, amber when tired, red when it will let you down.
  const condBar = (n, label = 'Condition', icon = '🔧') => `<div class="skill"><i>${icon}</i><span>${label}</span><span class="bar"><span style="width:${pct(n)};background:${n >= 65 ? 'var(--good)' : n >= 40 ? 'var(--sun)' : 'var(--bad)'}"></span></span><b>${Math.round(n)}</b></div>`;
  const carLine = (c) => `${c.age ? `${c.age}-year-old` : 'brand new'} ${esc(c.col)} ${MODELS[c.m].make} ${MODELS[c.m].name}`;
  const relWord = (r) => (r >= 1.3 ? 'Hardly ever goes wrong' : r >= 1.05 ? 'Reliable' : r >= 0.9 ? 'Goes wrong now and then' : 'Temperamental');
  const offWord = { broken: 'Broken down', mot: 'Failed its MOT', crash: 'Off the road after a crash' };
  const can = (life, id, x) => life.can(id, x);
  // The next MOT, said plainly.
  const motWhen = (life, c) => (c.age < 3 ? `First MOT when it is three (in ${3 - c.age} year${3 - c.age > 1 ? 's' : ''})` : `MOT due at the end of ${c.mot === life.season ? 'this season' : SEASONS[c.mot].toLowerCase()}`);
  const licWord = (life) => {
    const m = life.s.motor, pts = life.motorPoints();
    if (m.lic == null) return m.les ? 'Learning' : 'None yet';
    if (life.motorBanned()) { const n = m.ban - life.s.t; return `Banned: ${n} more season${n > 1 ? 's' : ''}`; }
    return pts ? `Full, ${pts} point${pts > 1 ? 's' : ''}` : 'Full, clean';
  };

  // ---- the sheets ----

  function garage() {
    const life = kit.life, s = life.s, m = s.motor, c = m.car, p = m.proj;
    let body = `<p class="lead">Jess Dobbs does the work; her dad Len supervises from a deckchair, pointing at things with his mug. Jess thinks you are ${life.motorJessWord()}${m.jess >= 40 ? ', and will tell you if a car on the forecourt is a wrong ’un' : ''}.</p>`;
    // The licence.
    body += '<h3>Your licence</h3>';
    if (m.lic == null) {
      body += `<div class="item"><div class="item-top"><span class="act-ico">🔰</span><div><b>Learning to drive</b><small>${m.les} lesson${m.les === 1 ? '' : 's'} so far · ${m.th ? 'theory passed' : 'theory still to sit'}${m.tries ? ` · ${m.tries} practical test${m.tries > 1 ? 's' : ''} taken` : ''}</small></div></div>
        ${condBar(m.drv, 'Driving', '🚦').replace(/var\(--(good|sun|bad)\)/, 'var(--teal)')}
        <p class="fine">Lessons build up your driving; Jess thinks you are ready for the practical at 55, and the readier you are, the kinder the test. The theory test comes first.</p></div>`;
      for (const id of ['motorLesson', 'motorTheory', 'motorTest']) if (id !== 'motorTheory' || !m.th) body += actRow(life.look(id));
    } else {
      const pts = life.motorPoints();
      body += `<div class="item${life.motorBanned() ? '' : ' mine'}"><div class="item-top"><span class="act-ico">🪪</span><div><b>${licWord(life)}</b><small>${m.old ? 'You were driving before you came to Starling Bay.' : `Passed ${m.first ? 'first time' : `at the ${['', 'first', 'second', 'third', 'fourth', 'fifth'][m.tries] || `${m.tries}th`} attempt`}.`}${pts ? ` Points come off three years after you get them; twelve at once means a ban.` : ''}</small></div></div>
        ${life.motorBanned() ? `<p class="fine">No driving until the ban is over: the car${c ? ` stays in the yard, and still costs its tax and insurance` : ''}.</p>` : ''}</div>`;
    }
    // The car.
    body += '<h3>Your car</h3>';
    if (c) {
      const k = MODELS[c.m];
      body += `<div class="item mine"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${MODELS[c.m].make} ${k.name}</b><small>${carLine(c)}, ${an(k.body)}. ${relWord(k.rel)}.${k.sport ? ' Heads turn.' : ''}</small></div></div>
        ${condBar(c.cond)}
        <div class="facts"><span>${c.off ? `⛔ ${offWord[c.off]}` : life.motorBanned() ? '⛔ You are banned' : m.lic == null ? '⛔ No licence yet' : '✅ On the road'}</span><span>Worth ${cashShort(carValue(c))}; Jess would give ${cashShort(life.motorTrade())}</span><span>${motWhen(life, c)}</span><span>${life.motorUsable() ? `Running it: ${money(k.sport ? 1200 : 300)} a season` : `Off the road: ${money(90)} a season for tax and insurance`}</span></div>
        <p class="fine">A car goes down a little every season, and faster as it ages; a car its age can be brought back to ${Math.round(life.motorCap())}. The lower it gets, the likelier it lets you down, and the likelier it fails its MOT.</p>
        <div class="picks">${c.off ? `${c.fix ? pick(`Have Jess fix it${cost(c.fix)}`, 'motorFix', undefined, can(life, 'motorFix')) : '<span class="note">The insurers are mending it: back next season</span>'}${c.fix ? pick(`Fix it yourself${cost(Math.round(c.fix * 0.035) * 10)}${T(2)}`, 'motorDiy', undefined, can(life, 'motorDiy'), 'quiet') : ''}` : pick(`Have it serviced${cost(life.motorServiceCost())}${T(1)}`, 'motorService', undefined, can(life, 'motorService'))}${pick(`Sell it to Jess · ${cashShort(life.motorTrade())}`, 'motorSell', undefined, can(life, 'motorSell'), 'quiet')}</div></div>`;
    } else body += `<p class="sub motor-pad">${m.lic == null ? 'No car yet. You will need a licence before Jess lets you drive one off the forecourt.' : 'No car yet. The forecourt has a few, and Jess can order a new one.'}</p>`;
    body += `<button class="act" data-do="open" data-kind="motorYard"><span class="act-ico">🏷️</span><span class="act-main"><b>The forecourt</b><small>${life.motorYard().cars.length} used cars this season${life.motorYard().classic ? ', and something sorry in the back' : ''}. New ones to order.</small></span><span class="act-cost"><i class="go">›</i></span></button>`;
    if (life.motorUsable()) body += `<button class="act" data-do="open" data-kind="motorTrips"><span class="act-ico">🗺️</span><span class="act-main"><b>Days out in the car</b><small>${Object.keys(m.trips).length} of ${Object.keys(DRIVES).length} places been to.</small></span><span class="act-cost"><i class="go">›</i></span></button>`;
    // The back bay.
    body += '<h3>The back bay</h3>';
    if (p) {
      const k = CLASSICS[p.m], g = life.motorStage(), stages = STAGES.map((st, i) => `<i class="${i < p.st || p.done ? 'on' : i === p.st ? 'now' : ''}" title="${esc(st.name)}">${st.icon}</i>`).join('');
      body += `<div class="item mine"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${k.make} ${k.name}</b><small>${An(k.body)}. ${p.done ? 'Finished, and shining.' : `${g.name}: ${p.p} of ${g.n} done.`}</small></div></div>
        <div class="motor-stages">${stages}</div>
        ${p.n ? condBar(life.motorQuality(), 'Quality', '✨').replace(/var\(--(good|sun|bad)\)/, 'var(--teal)') : ''}
        <div class="facts"><span>Would fetch ${cashShort(life.motorProjValue())}</span>${p.done ? `<span>Done right, up to ${cashShort(k.top)}</span>` : `<span>Spent on parts: ${cashShort(p.spent)}</span>`}${p.need ? `<span class="down">Needs ${esc(p.need)}</span>` : ''}</div>
        ${p.need ? '<p class="fine">Hunt for one at the autojumble in Market Square, or have Jess find one, at a price.</p>' : p.done ? `<p class="fine">Show it at the County Classic Car Show on the Rovers’ ground in the summer, sell it to a collector, or keep it: it counts in what you are worth.</p>` : '<p class="fine">Two sittings a season at most. Each is better with Craft, and the quality decides what it fetches.</p>'}
        <div class="picks">${p.done ? '' : p.need ? pick(`Have Jess find it${cost(Math.round(k.top * 0.007) * 10)}`, 'motorPartOrder', undefined, can(life, 'motorPartOrder')) : pick(`${g.name}${cost(life.motorStageCost())}${T(1)}`, 'motorWork', undefined, can(life, 'motorWork'))}${pick(p.done ? `Sell to a collector · ${cashShort(life.motorProjValue())}` : `Sell it as it stands · ${cashShort(life.motorProjValue())}`, 'motorClassicSell', undefined, can(life, 'motorClassicSell'), 'quiet')}</div></div>`;
    } else body += '<p class="sub motor-pad">Len’s old bay is empty. Now and then Jess has something sorry in the back of the forecourt to bring back to life, and Tom Windle has been known to find one under the hay.</p>';
    return { icon: '🔧', title: 'Dobbs & Daughter', sub: c ? `Your ${life.motorCarName()}` : m.lic == null ? 'Lessons, tests and cars' : 'Cars mended, cars sold', body };
  }

  function yard() {
    const life = kit.life, s = life.s, m = s.motor, c = m.car, y = life.motorYard();
    let body = `<p class="lead">A few used cars every season, and new ones to order from the dealer in Kettleby. Jess gives three quarters of what a car is worth in part-exchange, so a car is something to keep, not to trade.</p>`;
    if (m.lic == null) body += '<p class="fine motor-pad">You will need a driving licence before Jess lets you drive one away. Lessons are in the workshop.</p>';
    if (c) body += `<p class="fine motor-pad">Your ${MODELS[c.m].name} goes in part-exchange: Jess would give ${money(life.motorTrade())} for it.</p>`;
    body += '<h3>Used</h3>';
    for (const u of y.cars) {
      const k = MODELS[u.m], why = can(life, 'motorBuy', u.id), hint = life.motorHint(u), net = life.motorNet(u.price);
      body += `<div class="item"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${carLine(u)}</b><small>${An(k.body)}. ${relWord(k.rel)}.${k.sport ? ' Heads turn, and it costs $1,200 a season to run.' : ''}</small></div></div>
        ${condBar(u.cond)}
        ${hint ? `<p class="fine${u.tag === 'lemon' ? ' motor-warn' : ''}">${u.tag === 'lemon' ? '⚠️ ' : '🏷️ '}${esc(hint)}</p>` : ''}
        <div class="picks">${pick(`Buy it · ${cashShort(u.price)}`, 'motorBuy', u.id, why)}${c && !why ? `<span class="note">${net >= 0 ? `${cashShort(net)} with your ${esc(MODELS[c.m].name)}` : `${cashShort(-net)} back, with your ${esc(MODELS[c.m].name)}`}</span>` : why ? `<span class="note">${esc(why)}</span>` : ''}</div></div>`;
    }
    if (y.classic) {
      const k = CLASSICS[y.classic], why = can(life, 'motorClassicBuy', y.classic);
      body += `<h3>In the back</h3><div class="item"><div class="item-top"><span class="act-ico">🕸️</span><div><b>An old ${k.make} ${k.name}</b><small>${An(k.body)}, under a tarpaulin and a family of mice. Done properly, one is worth up to ${cashShort(k.top)}.</small></div></div>
        ${condBar(8, 'Condition')}
        <div class="picks">${pick(`Buy it to restore · ${cashShort(k.wreck)}`, 'motorClassicBuy', y.classic, why)}${why ? `<span class="note">${esc(why)}</span>` : '<span class="note">Len’s bay is $120 a season</span>'}</div></div>`;
    }
    body += '<h3>New, to order</h3>';
    for (const [id, k] of Object.entries(MODELS)) {
      const why = can(life, 'motorNew', id), net = life.motorNet(k.price);
      body += `<div class="item"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${k.make} ${k.name}</b><small>${An(k.body)}. ${relWord(k.rel)}.${k.sport ? ' Heads turn (Charm grows faster), and it cheers you up. $1,200 a season to run.' : k.big ? ' Room for a load: the chip shop pays a little more.' : ''}</small></div></div>
        <div class="picks">${pick(`Order one · ${cashShort(k.price)}`, 'motorNew', id, why, 'quiet')}${c && !why ? `<span class="note">${net >= 0 ? `${cashShort(net)} with your ${esc(MODELS[c.m].name)}` : `${cashShort(-net)} back`}</span>` : why ? `<span class="note">${esc(why)}</span>` : ''}</div></div>`;
    }
    return { icon: '🏷️', title: 'The forecourt', sub: `${SEASONS[life.season]}: ${y.cars.length} used car${y.cars.length === 1 ? '' : 's'}`, body };
  }

  function trips() {
    const life = kit.life, m = life.s.motor;
    let body = `<p class="lead">One day out a season: two blocks of time, a little petrol, and a few miles on the car. ${life.partner() ? `${esc(life.partner().name.split(' ')[0])} comes too, and any children.` : 'Anybody who lives with you comes too.'}</p>`;
    for (const [id, t] of Object.entries(DRIVES)) {
      const why = can(life, 'motorTrip', id), n = m.trips[id] || 0;
      body += `<div class="item"><div class="item-top"><span class="act-ico">${t.icon}</span><div><b>${t.name}</b><small>${esc(t.blurb)}</small></div></div>
        <div class="facts">${t.stat ? `<span>Some ${{ fitness: 'Fitness', smarts: 'Smarts', charm: 'Charm', craft: 'Craft' }[t.stat]}</span>` : '<span>Good for your parents</span>'}<span>${n ? `Been ${n === 1 ? 'once' : `${n} times`}` : 'Never been'}</span></div>
        <div class="picks">${pick(`Go${cost(t.cost)}${T(2)}`, 'motorTrip', id, why)}${why ? `<span class="note">${esc(why)}</span>` : ''}</div></div>`;
    }
    return { icon: '🗺️', title: 'Days out in the car', sub: `${Object.keys(m.trips).length} of ${Object.keys(DRIVES).length} places been to`, body };
  }

  // ---- playing the tests ----
  const test = (id, game) => () => {
    const life = kit.life, why = life.can(id, 0.5);
    if (why) { sfx('nope'); toast(why); return; }
    const o = id === 'motorTheory'
      ? { id: game, title: 'The theory test', icon: '📝', level: 0, ease: life.s.st.smarts / 100, skill: 'Smarts' }
      : { id: game, title: 'Your driving test', icon: '🚗', level: 0, ease: life.s.motor.drv / 100, skill: 'practice' };
    // (A test walked out of is reported as such: -1.)
    playMini(o, (score, gaveUp) => { if (score != null && kit.life) doAct(id, gaveUp ? -1 : score); });
  };

  return {
    sheets: { motorGarage: garage, motorYard: yard, motorTrips: trips },
    act: { motorTheory: test('motorTheory', 'motorQuiz'), motorTest: test('motorTest', 'motorRoad') },

    me(life) {
      const s = life.s, m = s.motor, c = m.car, p = m.proj;
      if (s.gaol) return '';
      const btn = `<button class="btn btn-soft wide" data-do="open" data-kind="motorGarage">🔧 Dobbs & Daughter</button>`;
      if (m.lic == null && !m.les && !c && !p) return `<div class="box"><h3>Car</h3><p class="sub">No licence yet. Jess Dobbs gives driving lessons at the garage up the hill.</p>${btn}</div>`;
      let out = `<div class="box"><h3>Car</h3><div class="line${life.motorBanned() ? ' down' : ''}"><span>🪪 Licence</span><b>${licWord(life)}</b></div>`;
      if (m.lic == null) out += condBar(m.drv, 'Driving', '🚦').replace(/var\(--(good|sun|bad)\)/, 'var(--teal)');
      if (c) {
        out += `<div class="line"><span>${MODELS[c.m].icon} ${MODELS[c.m].make} ${MODELS[c.m].name}</span><b>${c.off ? offWord[c.off] : `Worth ${cashShort(life.motorTrade())}`}</b></div>${condBar(c.cond)}<p class="fine">${motWhen(life, c)}.${life.motorUsable() ? ' Two more blocks of time every season.' : life.motorBanned() ? ' No extra time until the ban is over.' : ' Off the road: no extra time until it goes again.'}</p>`;
      }
      if (p) out += `<div class="line"><span>${CLASSICS[p.m].icon} In the back bay: the ${CLASSICS[p.m].name}</span><b>${p.done ? 'Finished' : `Stage ${p.st + 1} of ${STAGES.length}`}</b></div>`;
      if (m.n.drives) out += `<div class="line"><span>🚕 Evenings behind the wheel</span><b>${m.n.drives}</b></div>`;
      out += `${btn}${life.motorUsable() ? '<button class="btn btn-soft wide motor-gap" data-do="open" data-kind="motorTrips">🗺️ A day out in the car</button>' : ''}</div>`;
      return out;
    },

    people(life) {
      const m = life.s.motor;
      if (life.s.gaol || !life.motorUsable() || !m.asks.length) return '';
      let out = '<h3 class="group">Could do with a lift</h3>';
      for (const a of m.asks) {
        const p = life.person(a.p);
        if (!p) continue;
        out += `<div class="box person motor-lift"><span class="ava">${face(p.look, p.age, 40 + p.bond * 0.6, p.sex)}</span><div><b>${esc(p.name)}</b><small>Needs a lift ${esc(a.to)}.</small><div class="picks">${pick(`Give ${esc(p.name.split(' ')[0])} a lift${T(1)}`, 'motorLift', p.id, can(life, 'motorLift', p.id))}</div></div></div>`;
      }
      return out;
    },

    marks(life) {
      const m = life.s.motor, out = [];
      if (m.car && m.car.off && m.car.fix) out.push(['garage', '🔧']);
      if (m.proj && m.proj.need) out.push(['market', '🔩']);
      if (m.proj && m.proj.done && life.season === 1 && m.shown !== life.year) out.push(['ground', '🏆']);
      return out;
    },

    css: `
.motor-pad { padding: 0 4px 6px; }
.motor-warn { color: var(--bad); }
.motor-gap { margin-top: 8px; }
.motor-stages { display: flex; gap: 5px; margin-top: 8px; }
.motor-stages i { flex: 1; height: 30px; border-radius: 9px; display: grid; place-items: center; font-style: normal; font-size: 15px; background: #f1eadb; opacity: .55; }
.motor-stages i.on { background: #e4f5ea; opacity: 1; }
.motor-stages i.now { background: #dff1f4; opacity: 1; box-shadow: inset 0 0 0 2px var(--teal); }
.motor-lift { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
.motor-lift > div { flex: 1; min-width: 0; display: grid; gap: 1px; }
.motor-lift small { font-size: 12.5px; font-weight: 700; color: var(--muted); }
.motor-lift .picks { margin-top: 6px; }

/* the theory test */
.mg-quiz { width: min(380px, 100%); display: grid; gap: 10px; align-content: center; }
.mg-qn { margin: 0; font-size: 13px; font-weight: 900; color: var(--muted); text-align: center; letter-spacing: .04em; text-transform: uppercase; }
.mg-q { margin: 0; padding: 14px; border-radius: 16px; background: #fff; box-shadow: 0 2px 0 var(--line); font-size: 18px; font-weight: 800; line-height: 1.35; min-height: 4.4em; display: grid; place-items: center; text-align: center; }
.mg-as { display: grid; gap: 9px; }
.mini-stage .mg-as button { min-height: 54px; padding: 10px 14px; border-radius: 14px; background: #fffaf0; box-shadow: 0 3px 0 #dcd2bb; font-size: 16px; font-weight: 800; line-height: 1.25; text-align: left; color: var(--ink); }
.mini-stage .mg-as button:active { transform: translateY(2px); box-shadow: 0 1px 0 #dcd2bb; }
.mini-stage .mg-as button.yes { background: #e4f5ea; color: var(--good); box-shadow: 0 3px 0 #9fd4b4; }
.mini-stage .mg-as button.no { background: #fde8e4; color: var(--bad); box-shadow: 0 3px 0 #f2b0a8; }
.mini-stage .mg-as button.dim { opacity: .45; }

/* the practical */
.mini-stage.g-motorRoad { padding: 8px 10px 10px; gap: 0; }
.mg-road { align-self: stretch; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 6px; }
.mg-road-hud { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 6px 10px; border-radius: 12px; background: #fff; box-shadow: 0 2px 0 var(--line); }
.mg-road-hud .say { flex: 1; font-size: 14px; font-weight: 800; line-height: 1.25; }
.mg-road-hud .say.bad { color: var(--bad); }
.mg-road-hud .minors { font-size: 13px; font-weight: 900; color: var(--muted); white-space: nowrap; }
.mg-road-box { position: relative; flex: 1; min-height: 0; border-radius: 14px; overflow: hidden; background: #9fd17a; }
.mg-road-box canvas { position: absolute; left: 0; top: 0; touch-action: none; display: block; }
`,
  };
}
