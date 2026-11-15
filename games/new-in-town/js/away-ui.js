// New in Town: going away, on screen (the rules are in away.js). The station's
// board of this year's trips; a sheet for each, to choose who comes, how
// grandly and when, with the price and what it will cost you at work; your
// place away, or the places you could buy; a Going away box on the Me tab (the
// holidays you have had and what they are remembered as, the postcards on the
// fridge and the souvenirs on the mantelpiece); a line on each person's sheet
// about the holidays you have had together; and the two games: packing the
// case before you go, and finding your lot again on a crowded beach on a day
// out.

import { KINDS, WHO, WHO_ORDER, OWN } from './away.js';
import { GAME_CSS } from './away-games.js';
import { SEASONS } from './data.js';

const ORDER = ['tent', 'caravan', 'coach', 'walk', 'city', 'sun', 'cruise', 'far', 'gap', 'own'];
const PACK_LEVEL = { tent: 0, own: 0, caravan: 1, coach: 1, walk: 1, city: 1, sun: 2, gap: 2, cruise: 3, far: 4 };
const cap = (t) => t[0].toUpperCase() + t.slice(1);
const first = (p) => (/^(Mum|Dad)$/.test(p.name) ? p.name : p.name.split(' ')[0]);

export default function (kit) {
  const { esc, money, cashShort, chip, pick } = kit;
  const L = () => kit.life;
  // What each sheet has chosen so far, by kind of trip: { w, c, when }.
  const plan = {};
  const planFor = (life, k) => {
    const K = life.awayKind(k), p = plan[k] || (plan[k] = { w: null, c: 0, when: 0 });
    // (Who comes, if not chosen yet or no longer possible: the family, the two of you, or just you.)
    if (!p.w || life.awayParty(p.w, k).why) p.w = ['family', 'pair', 'solo', 'friends'].find((w) => !life.awayParty(w, k).why) || 'solo';
    if (p.c >= K.cls.length) p.c = 0;
    return p;
  };
  const xOf = (k, p) => ({ k, w: p.w, c: p.c });
  const go = (label, kind, x, why, cls = '') => `<button class="pick ${cls}${why ? ' off' : ''}" data-do="${kind}" data-x="${esc(JSON.stringify(x))}"${why ? ` data-why="${esc(why)}"` : ''}>${label}</button>`;
  const lineShut = (life) => { const e = life.s.annals && life.s.annals.ev && life.s.annals.ev.line; return !!e && e.shut != null && e.back == null; };
  const holSaid = (h) => (h.k === 'stay' ? `a night at ${h.at}` : h.k === 'own' ? `a week at ${h.at}` : KINDS[h.k] ? KINDS[h.k].trip(h.at) : h.at);
  const holIcon = (h) => (h.k === 'stay' ? '🏨' : h.k === 'own' ? '🏡' : KINDS[h.k] ? KINDS[h.k].icon : '🧳');
  const bar = (v, label, icon) => `<div class="skill"><i>${icon}</i><span>${label}</span><span class="bar"><span style="width:${Math.round(v)}%;background:${v >= 65 ? 'var(--good)' : v >= 40 ? 'var(--sun)' : 'var(--bad)'}"></span></span><b>${Math.round(v)}</b></div>`;

  // ---- the board of this year's trips ----
  function awayTrips() {
    const life = L(), s = life.s, A = s.away;
    if (!A) return null;
    let body = '<p class="lead">Trains, coaches and the airport bus all go from here. A holiday takes most of a season, costs what it costs, and comes home with you.</p>';
    if (s.job) body += `<p class="fine aw-pad">${life.awayYearUsed() ? '🗓️ You have had this year’s holiday. Another before your birthday will cost you standing at work.' : '🗓️ This year’s holiday is still to have: the first trip in a year is no trouble at work.'}</p>`;
    if (lineShut(life)) body += '<p class="fine aw-pad">🚌 The railway is shut: the coach costs $150 on top of any trip.</p>';
    if (A.book) {
      const b = A.book, K = life.awayKind(b.k), P = life.awayParty(b.w, b.k);
      body += `<div class="item mine"><div class="item-top"><span class="act-ico">${K ? K.icon : '🧳'}</span><div><b>Booked: ${esc(K ? K.trip(b.at) : 'a trip')}</b><small>${esc(P.why ? 'Not everybody who was coming can, now.' : cap(life.awaySaid(P.ids, b.w)))}, in the ${SEASONS[b.t % 4].toLowerCase()}${b.t - s.t >= 1 ? ` (${b.t - s.t === 1 ? 'next season' : `in ${b.t - s.t} seasons`})` : ''}. ${money(b.cost - b.dep)} still to pay when you go.</small></div></div>
        <div class="picks">${pick(`Cancel it, and lose the ${cashShort(b.dep)} deposit`, 'awayCancel', undefined, life.can('awayCancel'), 'quiet')}</div></div>`;
    }
    body += '<h3>This year’s trips</h3>';
    for (const k of ORDER) {
      if (k === 'gap' && s.age > 25) continue;
      if (k === 'own' && !A.own) continue;
      const K = life.awayKind(k), dest = life.awayDest(k), p = planFor(life, k), solo = life.awayCost({ k, w: 'solo', c: 0 }), why = life.awayWhy({ k, w: 'solo', c: 0 });
      const shut = why && !K.months.includes(life.season) ? why : '';
      body += `<button class="act aw-trip" data-do="awayPlan" data-k="${k}"><span class="act-ico">${K.icon}</span><span class="act-main"><b>${esc(K.name)}</b><small>${esc(cap(K.trip(dest)))}. ${shut ? esc(shut) : `From ${money(solo)}${p.w !== 'solo' ? `; ${esc(WHO[p.w].name.toLowerCase())}, ${money(life.awayCost(xOf(k, p)))}` : ''}.`}</small></span><span class="act-cost">${chip('time', `⏱ ${life.awayTime(k)}`)}<i class="go">›</i></span></button>`;
    }
    if (A.own || life.netWorth() >= OWN.static.need * s.idx) {
      body += `<h3>A place of your own away</h3><button class="act" data-do="open" data-kind="awayPlace"><span class="act-ico">${A.own ? OWN[A.own.kind].icon : '🏡'}</span><span class="act-main"><b>${A.own ? `Your ${esc(OWN[A.own.kind].name)} ${A.own.kind === 'villa' ? 'in' : 'at'} ${esc(A.own.at)}` : 'A static caravan, a cottage, a villa'}</b><small>${A.own ? `Worth ${money(life.awayOwnWorth())}. ${A.own.let ? 'Let to holidaymakers.' : 'Yours, all year round.'}` : 'Somewhere of your own to go every summer, and to let when you do not.'}</small></span><span class="act-cost"><i class="go">›</i></span></button>`;
    }
    body += '<p class="fine aw-pad">Who comes changes the price: children count half, the very small nothing, and friends pay their own way. A good trip rests you and brings you closer to whoever came; a bad one does neither, and you will have paid all the same.</p>';
    return { icon: '🧳', title: 'Going away', sub: `${A.n.trips ? `${A.n.trips} holiday${A.n.trips > 1 ? 's' : ''} so far` : 'Nowhere yet'}${A.book ? ' · one booked' : ''}`, body };
  }

  // ---- one trip: who, how, when ----
  function awayPlan(k) {
    const life = L(), s = life.s, K = life.awayKind(k);
    if (!K || (k === 'own' && !s.away.own)) return null;
    const p = planFor(life, k), when = p.when, x = { ...xOf(k, p), ...(when ? { at: when } : {}) }, dest = life.awayDest(k, s.t + when);
    const P = life.awayParty(p.w, k), cost = life.awayCost(x, when), time = life.awayTime(k), sn = life.awaySeason(when);
    const chips = (field, list) => `<div class="aw-chips">${list.map(([v, label, why]) => `<button class="aw-chip${p[field] === v ? ' on' : ''}${why ? ' off' : ''}" data-do="awaySet" data-k="${k}" data-f="${field}" data-v="${v}"${why ? ` data-why="${esc(why)}"` : ''}>${label}</button>`).join('')}</div>`;
    let body = `<div class="item"><div class="item-top"><span class="act-ico">${K.icon}</span><div><b>${esc(cap(K.trip(dest)))}</b><small>${esc(K.blurb)}</small></div></div></div>`;
    // Who.
    const whoList = WHO_ORDER.map((w) => {
      const q = life.awayParty(w, k);
      if (q.why && (w === 'clan' || (w === 'parent' && /No parent/.test(q.why)))) return null;
      const name = w === 'pair' && !q.why ? `${WHO.pair.icon} With ${esc(first(life.partner()))}` : w === 'parent' && !q.why ? `${WHO.parent.icon} With ${esc(q.ids.map((id) => first(life.person(id))).join(' and '))}` : `${WHO[w].icon} ${WHO[w].name}`;
      return [w, name, q.why];
    }).filter(Boolean);
    body += `<h3>Who comes</h3>${chips('w', whoList)}`;
    if (!P.why && P.ids.length) body += `<p class="fine aw-pad">${esc(cap(life.awaySaid(P.ids, p.w)))}${p.w === 'friends' ? ', who pay their own way' : ''}.</p>`;
    // How.
    if (K.cls.length > 1) body += `<h3>How</h3>${chips('c', K.cls.map((name, i) => [i, `${['🛏️', '🛎️', '✨'][i]} ${esc(name)}`, null]))}`;
    else body += `<h3>How</h3><p class="fine aw-pad">${esc(K.cls[0])}.</p>`;
    // When.
    const whenList = [0, 1, 2, 3].map((n) => {
      const why = n ? life.awayWhy({ ...xOf(k, p), at: n }, { when: n, book: true }) || (s.away.book ? 'You have a trip booked already.' : null) : life.can('trip', xOf(k, p));
      const label = n ? `${['', '🌸', '☀️', '🍂', '❄️'][((s.t + n) % 4) + 1]} ${SEASONS[(s.t + n) % 4]}` : '⏱ Now';
      return [n, label, n ? why : null];
    });
    body += `<h3>When</h3>${chips('when', whenList)}`;
    // What it comes to.
    const notes = [];
    if (sn === 1 && (K.peak || 1) > 1) notes.push('Summer prices.');
    if (sn === 3 && (K.off || 1) < 1) notes.push('Winter prices, which are kinder.');
    if (sn !== 1 && P.school) notes.push(`Includes ${money(60 * P.school)} for taking ${P.school > 1 ? 'the children' : 'a child'} out of school.`);
    if (s.heir === 'globe') notes.push('Half price, thanks to the battered suitcase.');
    if (!when && life.awayBossMinds()) notes.push('You have had this year’s holiday: the boss will mind.');
    if (lineShut(life)) notes.push('Add $150 for the coach: the railway is shut.');
    if (k === 'gap') notes.push('A whole season away. You come back with more Charm and Smarts than you went with.');
    const why = when ? life.can('awayBook', x) : life.can('trip', xOf(k, p));
    body += `<div class="item aw-sum"><div class="line"><span>Where</span><b>${esc(dest.split(',')[0])}</b></div>
      <div class="line"><span>All in</span><b>${P.why ? '—' : money(cost)}</b></div>
      ${when ? `<div class="line"><span>Deposit now</span><b>${money(Math.round(cost * 0.02) * 10)}</b></div>` : ''}
      <div class="line"><span>Time</span><b>${time} block${time > 1 ? 's' : ''}${when ? `, in the ${SEASONS[sn].toLowerCase()}` : ' of this season'}</b></div>
      ${P.why ? '' : `<p class="fine">${esc(life.awayHint(cost))}. ${notes.map(esc).join(' ')}</p>`}
      <div class="picks">${when
    ? pick(`📅 Book it · ${cashShort(Math.round(cost * 0.02) * 10)} now`, 'awayBook', x, why)
    : `${go(`🧳 Pack, and go · ${cashShort(cost)}`, 'awayGo', xOf(k, p), why)}${go('Just go', 'awayQuick', xOf(k, p), why, 'quiet')}`}</div>
      ${when ? '<p class="fine">Something to look forward to: a booked trip lifts the mood until it comes. Cancel and the deposit is gone.</p>' : '<p class="fine">Pack the case yourself, and pack it well, and you will not be the one who forgot the passports.</p>'}</div>`;
    return { icon: K.icon, title: K.name, sub: dest.split(',')[0], body };
  }

  // ---- your place away, or the places you could have ----
  function awayPlace() {
    const life = L(), s = life.s, A = s.away;
    if (!A) return null;
    let body = '';
    if (A.own) {
      const o = A.own, D = OWN[o.kind], letYear = Math.round(D.let * Math.sqrt(s.idx) / 100) * 100;
      body += `<div class="item mine"><div class="item-top"><span class="act-ico">${D.icon}</span><div><b>Your ${esc(D.name)} ${o.kind === 'villa' ? 'in' : 'at'} ${esc(o.at)}</b><small>${esc(D.blurb)}</small></div></div>
        ${bar(o.cond, 'Repair', '🔧')}
        <div class="facts"><span>Worth ${cashShort(life.awayOwnWorth())}</span><span>Upkeep ${money(life.awayOwnUpkeep())} a season</span><span>${o.let ? `Let: about ${money(letYear)} a year` : 'Not let'}</span>${o.n ? `<span>${o.n} stay${o.n > 1 ? 's' : ''} there</span>` : ''}</div>
        <p class="fine">It wears a little every season, faster when it is let and faster still when nobody goes. A stay there sets some of it right, and so does paying somebody local.</p>
        <div class="picks">${go(`${D.icon} Go there`, 'awayPlan', { k: 'own' }, null)}${pick(o.let ? 'Stop letting it' : `Let it · ~${cashShort(letYear)} a year`, 'awayLet', undefined, life.can('awayLet'), 'quiet')}${o.cond < 95 ? pick(`Have it seen to · ${cashShort(life.awayOwnMend())}`, 'awayMend', undefined, life.can('awayMend'), 'quiet') : ''}${pick(`Sell it · ${cashShort(Math.round(life.awayOwnWorth() * D.keep / 100) * 100)}`, 'awaySell', undefined, life.can('awaySell'), 'quiet')}</div></div>`;
    } else {
      body += '<p class="lead">For people with means: somewhere of your own to go every summer, to let when you do not, and to worry about in a storm. It counts in what you are worth.</p>';
      for (const [kind, D] of Object.entries(OWN)) {
        const why = life.can('awayBuy', kind), at = life.awayOwnAt(kind), price = life.awayOwnPrice(kind);
        body += `<div class="item"><div class="item-top"><span class="act-ico">${D.icon}</span><div><b>A ${esc(D.name)} ${kind === 'villa' ? 'in' : 'at'} ${esc(at)}</b><small>${esc(D.blurb)}</small></div></div>
          <div class="facts"><span>${money(price)}</span><span>Upkeep ${money(Math.round(D.upkeep * s.idx / 10) * 10)} a season</span><span>Lets for about ${money(Math.round(D.let * Math.sqrt(s.idx) / 100) * 100)} a year</span></div>
          <div class="picks">${pick(`Buy it · ${cashShort(price)}`, 'awayBuy', kind, why)}</div></div>`;
      }
    }
    return { icon: A.own ? OWN[A.own.kind].icon : '🏡', title: A.own ? `Your ${OWN[A.own.kind].name}` : 'A place of your own away', sub: A.own ? A.own.at : 'Up the coast, or abroad', body };
  }

  // ---- the Me tab ----
  function me(life) {
    const s = life.s, A = s.away;
    if (!A || s.gaol) return '';
    const hols = A.hols.slice().reverse();
    let out = '<div class="box aw-me"><h3>Going away</h3>';
    if (!hols.length && !A.book && !A.own) out += '<p class="sub">You have not been anywhere since you came to the Bay. Trips go from the station, and a borrowed tent costs next to nothing.</p>';
    if (hols.length) out += `<div class="line"><span>🧳 Holidays</span><b>${hols.length}${A.n.abroad ? `, ${A.n.abroad} abroad` : ''}</b></div>`;
    if (s.job) out += `<div class="line"><span>🗓️ This year’s holiday</span><b>${life.awayYearUsed() ? 'Taken' : 'Still to have'}</b></div>`;
    if (A.book) { const K = life.awayKind(A.book.k); out += `<div class="line"><span>📅 Booked: ${esc(K ? K.name.toLowerCase() : 'a trip')}</span><b>${SEASONS[A.book.t % 4]}</b></div>`; }
    if (A.trad.on) out += `<div class="line"><span>🚐 Every summer at ${esc(A.park)}</span><b>${A.trad.n} year${A.trad.n > 1 ? 's' : ''} running</b></div>`;
    else if (A.trad.best >= 3) out += `<div class="line"><span>🚐 The caravan summers at ${esc(A.park)}</span><b>${A.trad.best} years</b></div>`;
    if (A.own) out += `<div class="line"><span>${OWN[A.own.kind].icon} Your ${esc(OWN[A.own.kind].name)} ${A.own.kind === 'villa' ? 'in' : 'at'} ${esc(A.own.at)}</span><b>${cashShort(life.awayOwnWorth())}</b></div>`;
    if (hols.length) {
      const row = (h) => `<div class="aw-hol"><i>${holIcon(h)}</i><div><b>“${esc(cap(h.mem))}”</b><small>At ${h.age}: ${esc(holSaid(h))}, ${esc(h.who)}.${h.hon ? ' The honeymoon.' : ''}</small></div></div>`;
      out += `<h4>Remembered as</h4>${hols.slice(0, 3).map(row).join('')}`;
      if (hols.length > 3) out += `<details class="aw-more"><summary>All ${hols.length}</summary>${hols.slice(3).map(row).join('')}</details>`;
    }
    if (A.fridge.length) out += `<h4>On the fridge</h4><div class="aw-fridge">${A.fridge.slice().reverse().map((c, i) => `<span class="aw-card" style="--r:${(i % 3) - 1}deg"><b>${esc(c.at)}</b>${esc(c.line)}</span>`).join('')}</div>`;
    if (A.souv.length) out += `<h4>On the mantelpiece</h4><div class="aw-mantel">${A.souv.map((v) => `<span title="${esc(v.name)}">${v.i}<small>${esc(cap(v.name))}, from ${esc(v.at)}</small></span>`).join('')}</div>`;
    out += '<div class="picks"><button class="pick quiet" data-do="open" data-kind="awayTrips">🧳 This year’s trips</button></div></div>';
    return out;
  }

  // ---- the games ----
  function play(id, o, done) {
    kit.playMini(o, (score) => { if (score != null && kit.life) done(score); });
  }

  return {
    sheets: { awayTrips, awayPlan, awayPlace },
    do: {
      awayPlan(el) {
        kit.sfx('tap');
        const k = el.dataset.k || (el.dataset.x && JSON.parse(el.dataset.x).k);
        if (!L().awayKind(k)) return;
        kit.openSheet({ kind: 'awayPlan', id: k });
      },
      awaySet(el) {
        if (el.dataset.why) { kit.sfx('nope'); kit.toast(el.dataset.why); return; }
        const p = plan[el.dataset.k];
        if (!p) return;
        p[el.dataset.f] = Number.isNaN(Number(el.dataset.v)) ? el.dataset.v : Number(el.dataset.v);
        kit.sfx('tap');
        kit.renderSheet();
      },
      // Pack the case first (the better it is packed, the less goes wrong), then off.
      awayGo(el) {
        if (el.dataset.why) { kit.sfx('nope'); kit.toast(el.dataset.why); return; }
        const life = L(), x = JSON.parse(el.dataset.x), why = life.can('trip', x);
        if (why) { kit.sfx('nope'); kit.toast(why); return; }
        play('awayPack', { id: 'awayPack', title: 'Pack the case', icon: '🧳', level: PACK_LEVEL[x.k] + (x.w === 'family' || x.w === 'clan' ? 1 : 0), ease: life.s.st.craft / 100, skill: 'Craft' }, (score) => {
          kit.backSheet();
          kit.doAct('trip', { ...x, p: Math.round(score * 100) / 100 });
        });
      },
      awayQuick(el) {
        if (el.dataset.why) { kit.sfx('nope'); kit.toast(el.dataset.why); return; }
        const x = JSON.parse(el.dataset.x);
        kit.backSheet();
        kit.doAct('trip', x);
      },
    },
    act: {
      // A day at the seaside: find your lot again on the beach with the ice creams (the lights and the
      // pantomime need no finding).
      awayDay() {
        const life = L(), why = life.can('awayDay', 0.5);
        if (why) { kit.sfx('nope'); kit.toast(why); return; }
        const D = life.awayDay();
        if (!D.beach) { kit.doAct('awayDay', 0.6); return; }
        play('awayBeach', { id: 'awayBeach', title: D.title, icon: '🍦', level: Math.min(5, Math.floor(life.s.away.n.days / 3)), ease: life.s.st.smarts / 100, skill: 'Smarts' }, (score) => kit.doAct('awayDay', Math.round(score * 100) / 100));
      },
    },
    me,
    person(life, p) {
      const A = life.s.away;
      if (!A) return '';
      const with_ = A.hols.filter((h) => (h.ids || []).includes(p.id));
      if (!with_.length) return '';
      const last = with_[with_.length - 1];
      return `<p class="fine aw-pad">🧳 Away together ${with_.length === 1 ? 'once' : `${with_.length} times`}: last ${esc(holSaid(last))}, remembered as “${esc(last.mem)}”.</p>`;
    },
    marks(life) {
      const A = life.s.away;
      return A && A.book && A.book.t === life.s.t + 1 ? [['station', '🧳']] : [];
    },
    css: `
.aw-pad { padding: 0 4px; }
.aw-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 2px 0 6px; }
.aw-chip { min-height: 44px; padding: 8px 12px; border-radius: 12px; background: #fff; color: var(--ink); font-size: 13.5px; font-weight: 800; box-shadow: 0 2px 0 var(--line); text-align: left; line-height: 1.2; max-width: 100%; }
.aw-chip.on { background: #dff1f4; color: var(--teal-d); box-shadow: 0 0 0 2.5px var(--teal); }
.aw-chip.off { opacity: .45; }
.aw-sum .line { padding: 3px 0; }
.aw-sum .picks { margin-top: 10px; }
.aw-sum .pick { min-height: 44px; }
.aw-trip .act-cost { grid-auto-flow: column; align-items: center; gap: 6px; }
.aw-me h4 { margin: 12px 0 6px; font-size: 12.5px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; color: #9a8f78; }
.aw-hol { display: flex; gap: 10px; align-items: flex-start; padding: 6px 0; border-top: 1px solid var(--line); }
.aw-hol:first-of-type { border-top: 0; }
.aw-hol i { font-style: normal; font-size: 22px; line-height: 1.2; flex: none; }
.aw-hol div { display: grid; gap: 1px; min-width: 0; }
.aw-hol b { font-size: 14px; font-weight: 900; }
.aw-hol small { font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.3; }
.aw-more summary { min-height: 44px; display: flex; align-items: center; font-size: 13.5px; font-weight: 900; color: var(--teal-d); cursor: pointer; }
.aw-fridge { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.aw-card { display: grid; gap: 2px; padding: 7px 8px; border-radius: 6px; background: #fff; box-shadow: 0 2px 4px rgba(31, 42, 68, .12); transform: rotate(var(--r)); font-size: 11.5px; font-weight: 700; color: #5d5544; line-height: 1.3; font-style: italic; }
.aw-card b { font-style: normal; font-size: 12px; font-weight: 900; color: var(--coral-d); }
.aw-mantel { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.aw-mantel span { display: grid; justify-items: center; gap: 2px; padding: 7px 2px; border-radius: 12px; background: #fff; font-size: 24px; text-align: center; }
.aw-mantel small { font-size: 9.5px; font-weight: 800; color: var(--muted); line-height: 1.15; overflow-wrap: anywhere; }
${GAME_CSS}`,
  };
}
