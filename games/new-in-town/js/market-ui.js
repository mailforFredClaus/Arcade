// New in Town: the screens for Windle Farm and Market Square (the rules
// are in market.js, the games in market-games.js). A sheet for your stall
// (what you have, what you ask for it, what it has taken), one for your
// animals, one for the Windle Show; a box on the Me tab; and badges on the
// map when there are eggs to collect, a Saturday to trade or a show to enter.

import { GOODS, GOOD_IDS, LEVELS, BEASTS, ROOM, PADDOCK, PADDOCK_SKILL, PADDOCK_FEE, CLASSES, PLACINGS, STALL_NAMES, PITCH_COST, SHOW_FEE, WORK, careWord, plain } from './market.js';
import { setStallGoods, setLoad } from './market-games.js';
import { HOMES, WEATHER, SEASONS, low } from './data.js';

export default function (kit) {
  const { esc, money, pick, actRow, chip } = kit;
  const jx = (x) => ` data-x="${esc(JSON.stringify(x))}"`;
  const stars = (q) => { const n = q >= 0.75 ? 3 : q >= 0.45 ? 2 : 1; return `${'★'.repeat(n)}${'☆'.repeat(3 - n)}`; };
  const bar = (ico, label, v) => `<div class="skill"><i>${ico}</i><span>${label}</span><span class="bar"><span style="width:${Math.max(0, Math.min(100, v))}%"></span></span><b>${Math.floor(v)}</b></div>`;
  const many = (k, n) => `${n} ${n === 1 ? k.one : k.many}`;
  // What a home has room for, said out loud.
  const roomSaid = (L) => {
    const r = ROOM[L.s.home];
    if (!r) return `${L.s.home === 'hostel' ? 'A hostel bunk' : 'A bedsit over the chip shop'} has no room for animals.`;
    const l = Object.entries(r).map(([k, n]) => many(BEASTS[k], n));
    return `Your ${low(HOMES[L.s.home].name)} has room for ${l.length > 1 ? `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}` : l[0]}.`;
  };
  // What one animal gives in a year, season by season.
  const gives = (b) => {
    if (!b.makes) return 'Fattens for about a year: Tom gives more for it each season it is well kept. It digs your allotment over while it is about it.';
    const k = GOODS[b.makes], l = b.lay.map((n, q) => [n, q]).filter(([n]) => n).map(([n, q], i) => `${n}${i ? '' : ` ${k.many}`} in ${SEASONS[q].toLowerCase()}`);
    return `One ${b.one} kept well gives about ${l.length > 1 ? `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}` : l[0]}.${b.makes === 'honey' ? ' The allotment does better for them in summer.' : ''}`;
  };
  const crowd = (L) => { const f = L.mktFoot(); return f >= 1.25 ? 'Crowds expected' : f >= 0.95 ? 'A good crowd expected' : f >= 0.7 ? 'A fair crowd expected' : 'A thin crowd expected'; };

  const sheets = {
    // ---- your stall ----
    mktStall() {
      const L = kit.life, s = L.s, m = s.mkt, st = m.stall;
      if (!st) {
        const body = `<p class="lead">Priya Lal runs the cheese stall and, as far as anybody can tell, Market Square. A pitch costs ${money(PITCH_COST)} to set up (a trestle table, an awning and a cash tin), then ${money(L.mktFee())} each season you trade. Sell what your animals give, what you make at home, what you grow on the allotment, what you paint and what you clear out of the cupboards.</p>
          <h3>What will you call it?</h3><div class="picks">${STALL_NAMES.map((_, i) => pick(esc(L.mktNameOf(i)), 'mktJoin', i, L.can('mktJoin', i))).join('')}</div>
          <p class="fine">A stall’s good name grows with every Saturday it opens, and with fair prices and good things; dear prices for poor things, and Saturdays missed, wear it down.</p>`;
        return { icon: '🧺', title: 'A pitch on the square', sub: 'Saturdays, nine sharp', body };
      }
      const wx = WEATHER[s.wx] || WEATHER.fair, have = GOOD_IDS.filter((g) => L.mktHave(g) > 0);
      let body = `<div class="item mine mkt-sign"><div class="item-top"><span class="act-ico">🧺</span><div><b>${esc(st.name)}</b><small>${st.days} Saturday${st.days === 1 ? '' : 's'} traded · ${money(m.n.take)} taken in all</small></div></div>${bar('📣', 'Its name', st.rep)}</div>
        <div class="facts"><span>${wx.icon} ${crowd(L)}</span><span class="up">Priya: ${esc(plain(m.hot))} are wanted</span>${m.told ? `<span>Tom: ${esc(plain(m.next))} next season</span>` : ''}${m.rival > 0 ? '<span class="down">A rival across the square</span>' : ''}${m.shut === s.t ? '<span class="down">Shut by the inspector</span>' : ''}</div>`;
      body += actRow(L.look('mktTrade'));
      body += '<h3>What you have to sell</h3>';
      if (!have.length) body += '<div class="item"><p class="sub">Nothing yet. Make jam or bake at home, collect from your animals, keep your allotment’s harvest for the stall, paint in the park or have a clear-out.</p></div>';
      for (const g of have) {
        const k = GOODS[g], out = L.mktIsOut(g), lvl = L.mktLevel(g), n = L.mktHave(g), q = L.mktQ(g), guess = L.mktGuess(g);
        body += `<div class="item mkt-good${out ? '' : ' kept'}${m.hot === g ? ' hot' : ''}"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${k.name}${m.hot === g ? ' 🔥' : ''}</b><small>${many(k, n)} · <span class="mkt-q">${stars(q)}</span> · ${k.fresh ? 'sell it this season' : 'keeps'}</small></div>${out ? `<div class="quote"><b>~${guess.n} sell</b><small class="up">${money(guess.sum)}</small></div>` : ''}</div>
          ${out ? `<div class="mkt-seg">${LEVELS.map((v, l) => { const gl = L.mktGuess(g, l); return `<button class="${lvl === l ? 'on' : ''}" data-do="act" data-id="mktPrice"${jx({ g, lvl: l })}${lvl === l ? ' data-why="That is its price now."' : ''}><small>${v.name}</small><b>${money(gl.each)}</b><em>~${gl.n} sell</em></button>`; }).join('')}</div>` : ''}
          <div class="picks">${pick(out ? 'Keep it back' : 'Put it on the stall', 'mktOut', g, null, 'quiet')}${g === 'art' ? '<span class="note">The studios pay more, two a season.</span>' : ''}</div></div>`;
      }
      body += `<p class="fine">Cheap moves more and makes friends; dear makes more on each one, but only good things sell dear. When you have more than will sell, cheap; when you have only a few, dear. What is fresh does not keep past the season.</p>`;
      if (st.log.length) body += `<details><summary>Recent Saturdays</summary>${st.log.map((d) => `<div class="line"><span>${SEASONS[d.t % 4]}, year ${Math.floor(d.t / 4) + 1}</span><b>${money(d.take)}</b></div>`).join('')}${m.n.best ? `<p class="fine">Your best Saturday: ${money(m.n.best)}.</p>` : ''}</details>`;
      if (s.plot) body += `<details><summary>The allotment’s harvest</summary><p class="fine">${m.veg ? 'What you bring in goes into boxes for the stall, to sell this season.' : 'What you bring in goes on the table by the gate with the honesty box. Kept for the stall, it can fetch more, if you sell it while it is fresh.'}</p><div class="picks">${pick(m.veg ? 'Leave it by the gate' : 'Keep it for the stall', 'mktVeg', undefined, null, 'quiet')}</div></details>`;
      body += `<details><summary>A new sign</summary><p class="fine">${money(40)} for the signwriter. Some of your regulars will walk straight past it for a while.</p><div class="picks">${STALL_NAMES.map((_, i) => pick(esc(L.mktNameOf(i)), 'mktRename', i, L.can('mktRename', i), 'quiet')).join('')}</div></details>`;
      body += `<details><summary>Give up the pitch</summary><p class="fine">What you have keeps at home; the table and the awning stay with Priya.</p><div class="picks">${pick('Give it up', 'mktQuit', undefined, null, 'quiet')}</div></details>`;
      return { icon: '🧺', title: 'Your stall', sub: `Market Square · ${money(L.mktFee())} a season you trade`, body };
    },

    // ---- your animals ----
    mktBeasts() {
      const L = kit.life, s = L.s, m = s.mkt;
      const kinds = L.mktKinds();
      let body = `<p class="lead">${kinds.length ? 'See to them at least once a season, or they suffer.' : 'Tom Windle sells animals to people who know what they are doing: work on the farm to learn. They want feeding (a bill every season) and seeing to at least once a season, or they suffer.'} ${esc(roomSaid(L))}${m.farm >= PADDOCK_SKILL ? ` Tom will keep a goat or a pig in his top paddock for ${money(PADDOCK_FEE)} a season.` : ''}</p>
        ${bar('🌾', 'Farming', m.farm)}`;
      if (kinds.length) body += actRow(L.look('beastCare')) + (L.mktHasReady() ? actRow(L.look('beastCollect')) : '');
      for (const [kind, b] of Object.entries(BEASTS)) {
        const h = m.herd[kind], n = L.mktBuyN(kind), why = L.can('beastBuy', kind), where = L.mktWhere(kind);
        body +=`<div class="item${h ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${b.icon}</span><div><b>${b.name}</b><small>${h ? `${many(b, h.n)}, ${h.where === 'farm' ? 'in Tom’s top paddock' : 'at home'} · ${careWord(h.care)}` : esc(b.blurb)}</small></div><div class="quote"><b>${money(b.price)}</b><small>each</small></div></div>
          ${h ? bar('🪣', 'Kept', h.care) : ''}
          <div class="facts"><span class="${m.farm >= b.skill ? 'up' : ''}">${m.farm >= b.skill ? '✓' : '○'} Farming ${b.skill}</span><span>Feed ${money(b.feed)} a season each</span>${h ? `<span>Tom would give ${money(L.mktBack(kind) * h.n)}</span>` : ''}${where === 'farm' && !h ? `<span>In Tom’s paddock, ${money(PADDOCK_FEE)} a season</span>` : ''}</div>
          <p class="fine">${esc(gives(b))}</p>
          <div class="picks">${pick(`Buy ${(n || b.buy) > 1 ? n || b.buy : 'one'} · ${money(b.price * (n || b.buy))} ${chip('time', '⏱ 1')}`, 'beastBuy', kind, why)}${h ? pick('Sell to Tom', 'beastSell', kind, null, 'quiet') : ''}${h && h.where === 'farm' && L.mktRoom(kind) >= h.n ? pick(`Bring ${h.n > 1 ? 'them' : 'it'} home`, 'beastFetch', kind, L.can('beastFetch', kind), 'quiet') : ''}${why && !h ? `<span class="note">${esc(why)}</span>` : ''}</div></div>`;
      }
      body += `<p class="fine">What they give is ready at the turn of each season, to collect at home before the next or it spoils. Moving somewhere without room for them means they go back to Tom${PADDOCK.goat ? ', unless he has room in his paddock for a goat or a pig' : ''}.</p>`;
      return { icon: '🐓', title: kinds.length ? 'Your animals' : 'Animals from Tom', sub: `Farming ${Math.floor(m.farm)} · feed ${money(L.mktFeed())} a season`, body };
    },

    // ---- the Windle Show ----
    mktShow() {
      const L = kit.life, m = L.s.mkt, done = L.mktShowYear();
      let body = `<p class="lead">On Tom Windle’s top field, every summer: rosettes for the best kept animals and the best things made on the hill. ${money(SHOW_FEE)} an entry, one entry a class each year, and the judges keep what they taste. Red is first (${money(PLACINGS[1].prize)}), blue second, yellow third; three firsts in one show makes you supreme champion.</p>`;
      for (const [c, k] of Object.entries(CLASSES)) {
        const why = L.can('showEnter', c), place = done[c], p = place ? PLACINGS[place] : null;
        body += `<div class="item${p && place === 1 ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${k.name}</b><small>${place ? (p ? `${p.name}: a ${p.colour} rosette` : 'Entered: no rosette this year') : L.mktCanEnter(c) ? esc(L.mktCanEnter(c)) : `${L.mktShowWord(c)}. ${k.beast ? 'Judged on how well kept it is, and your Farming.' : 'Judged on how good it is.'}`}</small></div>${m.firsts[c] ? `<div class="quote"><b>🏵️ ×${m.firsts[c]}</b><small>firsts</small></div>` : ''}</div>
          ${place ? '' : `<div class="picks">${pick(`Enter · ${money(SHOW_FEE)}`, 'showEnter', c, why)}</div>`}</div>`;
      }
      if (m.ros) body += `<p class="fine">${m.ros} rosette${m.ros > 1 ? 's' : ''} won at the Windle Show${m.champ ? `, and supreme champion ${m.champ === 1 ? 'once' : `${m.champ} times`}` : ''}.</p>`;
      return { icon: '🏵️', title: 'The Windle Show', sub: `Summer, year ${L.year}`, body };
    },
  };

  return {
    sheets,
    // A Saturday at the stall, and a day on the farm, are played first.
    act: {
      mktTrade() {
        const L = kit.life, why = L.can('mktTrade', 0.5);
        if (why) { kit.sfx('nope'); kit.toast(why); return; }
        setStallGoods(L.mktGameGoods());
        kit.playMini({ id: 'stall', title: L.s.mkt.stall.name, icon: '🧺', level: Math.min(5, Math.floor(L.s.mkt.stall.rep / 20)), ease: L.s.st.charm / 100, skill: 'Charm' }, (score) => { if (score != null && kit.life && kit.life.s.mkt.stall) kit.doAct('mktTrade', score); });
      },
      windleWork() {
        const L = kit.life, why = L.can('windleWork', 0.5);
        if (why) { kit.sfx('nope'); kit.toast(why); return; }
        setLoad(L.season);
        const w = WORK[L.season];
        kit.playMini({ id: 'trailer', title: w.title, icon: w.icon, level: Math.min(5, Math.floor(L.s.mkt.farm / 20)), ease: L.s.st.fitness / 100, skill: 'Fitness' }, (score) => { if (score != null && kit.life) kit.doAct('windleWork', score); });
      },
    },
    me(L) {
      const s = L.s, m = s.mkt, st = m.stall, kinds = L.mktKinds();
      if (!m.farm && !st && !kinds.length && !m.ros) return '';
      return `<div class="box"><h3>Farm and market</h3>${bar('🌾', 'Farming', m.farm)}
        ${kinds.map((k) => { const h = m.herd[k], b = BEASTS[k]; return `<div class="line"><span>${b.icon} ${many(b, h.n)}${h.where === 'farm' ? ', at Tom’s' : ''}</span><b class="${h.care < 25 ? 'down' : ''}">${careWord(h.care)}</b></div>`; }).join('')}
        ${L.mktHasReady() ? '<p class="sub">🧺 Something to collect at home.</p>' : ''}
        ${st ? `<div class="line"><span>🧺 ${esc(st.name)}</span><b>${money(m.n.take)} taken</b></div>${bar('📣', 'Its name', st.rep)}` : ''}
        ${m.ros ? `<p class="sub">🏵️ ${m.ros} rosette${m.ros > 1 ? 's' : ''} at the Windle Show${m.champ ? ', and a silver cup' : ''}.</p>` : ''}
        <div class="mkt-btns">${st ? '<button class="btn btn-soft" data-do="open" data-kind="mktStall">🧺 Your stall</button>' : ''}<button class="btn btn-soft" data-do="open" data-kind="mktBeasts">🐓 ${kinds.length ? 'Your animals' : 'Animals'}</button></div></div>`;
    },
    marks(L) {
      const s = L.s, m = s.mkt, out = [];
      if (L.mktHasReady()) out.push(['home', '🥚']);
      if (m.stall && m.stall.at !== s.t && m.shut !== s.t && L.mktOnStall().length) out.push(['market', '🧺']);
      if (L.season === 1 && Object.keys(CLASSES).some((c) => !L.can('showEnter', c))) out.push(['farm', '🏵️']);
      return out;
    },
    css: `
.mkt-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 9px; }
.mkt-seg button { display: grid; justify-items: center; gap: 1px; min-height: 52px; padding: 6px 4px; border-radius: 12px; background: #f6efdf; color: #6b6048; box-shadow: 0 2px 0 #e2d8c0; text-align: center; }
.mkt-seg button small { font-size: 11.5px; font-weight: 800; }
.mkt-seg button b { font-size: 16px; font-weight: 900; color: var(--ink); }
.mkt-seg button em { font-style: normal; font-size: 11px; font-weight: 800; color: var(--muted); }
.mkt-seg button.on { background: #e3f4f6; box-shadow: 0 0 0 2.5px var(--teal); }
.mkt-seg button.on b { color: var(--teal-d); }
.mkt-seg button:active { transform: translateY(2px); box-shadow: none; }
.mkt-good.kept { opacity: .7; }
.mkt-good.hot { box-shadow: 0 0 0 2px #ffc93c, 0 2px 0 var(--line); }
.mkt-q { color: #d39b16; letter-spacing: 1px; }
.mkt-btns { display: flex; gap: 8px; margin-top: 10px; }
.mkt-btns .btn { flex: 1; padding: 10px 8px; font-size: 14px; }

/* the queue at the stall */
.mkt-queue { display: grid; gap: 10px; width: min(360px, 100%); }
.mkt-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 28px; font-size: 18px; letter-spacing: -4px; }
.mkt-line small { font-size: 13px; font-weight: 800; color: var(--muted); letter-spacing: 0; }
.mkt-cust { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 18px; background: #fff; box-shadow: 0 2px 0 var(--line); min-height: 112px; }
.mkt-cust.yes { box-shadow: 0 0 0 3px #49c27c; } .mkt-cust.cheap { box-shadow: 0 0 0 3px #ffc93c; } .mkt-cust.no { box-shadow: 0 0 0 3px #d8433a; }
.mkt-face { position: relative; flex: none; width: 88px; height: 88px; border-radius: 50%; background: #f6efdf; overflow: hidden; }
.mkt-face svg { width: 100%; height: 100%; display: block; }
.mkt-face b { position: absolute; right: -2px; bottom: -2px; width: 36px; height: 36px; border-radius: 50%; background: #fff; display: grid; place-items: center; font-size: 21px; box-shadow: 0 1px 4px rgba(31, 42, 68, .25); }
.mkt-says { margin: 0; flex: 1; font-size: 16px; font-weight: 800; line-height: 1.3; }
.mkt-want { display: flex; align-items: center; justify-content: center; gap: 10px; }
.mkt-want i { font-style: normal; font-size: 34px; }
.mkt-want span { display: grid; }
.mkt-want b { font-size: 16px; font-weight: 900; }
.mkt-want small { font-size: 14px; color: #d39b16; letter-spacing: 1px; }
.mkt-asks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.mkt-asks button { display: grid; justify-items: center; gap: 2px; min-height: 72px; padding: 8px 4px; border-radius: 16px; background: #f3c64a; color: #5a4208; box-shadow: 0 4px 0 #c99a1f; }
.mkt-asks button:nth-child(1) { background: #bfe3c8; color: #1c5a36; box-shadow: 0 4px 0 #8cc49b; }
.mkt-asks button:nth-child(3) { background: #f7b2a6; color: #7a2219; box-shadow: 0 4px 0 #d9857a; }
.mkt-asks button small { font-size: 13px; font-weight: 800; }
.mkt-asks button b { font-size: 22px; font-weight: 900; }
.mkt-asks button:active { transform: translateY(3px); box-shadow: none; }
.mkt-asks button.yes { outline: 3px solid #1f9d62; } .mkt-asks button.no { outline: 3px solid #d8433a; }

/* the trailer on the farm */
.mkt-yard { position: relative; width: min(340px, 100%); height: min(420px, 62vh); border-radius: 18px; background: linear-gradient(180deg, #cfeaf6 0%, #e8f4f8 64%, #9ccf7a 64%, #84bd62 100%); overflow: hidden; touch-action: none; }
.mkt-trailer { position: absolute; height: 6%; border-radius: 4px; background: #c0392b; box-shadow: inset 0 -4px 0 #8e2a20; }
.mkt-trailer i { position: absolute; top: 70%; width: 26px; height: 26px; border-radius: 50%; background: #2b2b2b; border: 5px solid #777; }
.mkt-trailer i:first-child { left: 14%; } .mkt-trailer i:last-child { right: 14%; }
.mkt-load { position: absolute; top: 2%; display: grid; place-items: center; border: 3px solid; border-radius: 8px; box-sizing: border-box; box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .25); }
.mkt-load span { font-size: 20px; line-height: 1; }
.mkt-load.fall { transition: top .22s ease-in; }
.mkt-load.off { transition: top .5s ease-in, left .5s ease-out, transform .5s; transform: rotate(50deg); }
.mkt-tally { position: absolute; left: 0; right: 0; bottom: 2%; margin: 0; text-align: center; font-size: 14px; font-weight: 900; color: #fff; text-shadow: 0 1px 2px rgba(0, 0, 0, .35); }
`,
  };
}
