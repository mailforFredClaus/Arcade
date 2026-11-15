// New in Town: the screens for a business of your own (the rules are in
// firm.js). The Town Hall's list of trades to start; the office, which is
// the business's one sheet (how it is run, the staff and who wants a job,
// growing, the rival, the money and the board); the business's lines in the
// Work box on the Me tab; a badge on the map for a second premises, or when
// it is short of hands; and a spell of work in it, played as the trade's
// game from the careers.

import { BUSINESSES, PLACES, STAT_NAME, STAT_ICON, SEASONS, an, lowJob } from './data.js';
import { setStallGoods } from './market-games.js';
import { TRADES, NATURES, PRICES, QUALS, HOURS, NEED, DESIGN_GOODS, RIVAL_KINDS, years, first } from './firm-lib.js';

export default function (kit) {
  const { esc, money, pick, actRow, chip, face } = kit;
  const jx = (x) => ` data-x="${esc(JSON.stringify(x))}"`;
  const bar = (ico, label, v, colour) => `<div class="skill"><i>${ico}</i><span>${label}</span><span class="bar"><span style="width:${Math.max(0, Math.min(100, v))}%${colour ? `;background:${colour}` : ''}"></span></span><b>${Math.round(v)}</b></div>`;
  const signed = (n) => `<b class="${n >= 0 ? 'up' : 'down'}">${n >= 0 ? '' : '−'}${money(Math.abs(n)).replace('−', '')}</b>`;
  const busyWord = (L) => { const f = L.firmBusy(); return f >= 1.15 ? 'A busy season' : f <= 0.88 ? 'A quiet season' : 'An ordinary season'; };
  const moodWord = (m) => (m >= 75 ? 'Happy' : m >= 55 ? 'Content' : m >= 35 ? 'Grumbling' : m >= 20 ? 'Fed up' : 'At the end of their tether');
  const SAY = {
    price: ['More come; less from each', 'What people expect', 'More from each, if the name and the goods are good enough'],
    qual: ['Cheaper stock, and a risk', 'The usual', 'Dearer stock; the name grows'],
    hours: ['Less trade; happier staff', 'The usual', 'More trade; tired staff'],
  };

  // A row of three for one of the settings.
  function seg(L, k, names) {
    const c = L.firmOf();
    return `<div class="firm-set"><span>${{ price: 'Prices', qual: 'Quality', hours: 'Hours' }[k]}</span><div class="firm-seg">${names.map((n, v) => {
      const why = L.can('firmSettle', { k, v });
      return `<button class="${c[k] === v ? 'on' : ''}" data-do="act" data-id="firmSettle"${jx({ k, v })}${why ? ` data-why="${esc(why)}"` : ''}><b>${n}</b><small>${SAY[k][v]}</small></button>`;
    }).join('')}</div></div>`;
  }
  // One of the staff, or somebody who wants to be.
  function person(L, st, app) {
    const c = L.firmOf(), mgr = c.mgr === st.id, nat = NATURES[st.nat];
    const word = st.kin != null ? (st.sex === 'm' ? 'Your son' : 'Your daughter') : st.known ? nat.word : app ? `“${st.hint}”` : 'New: still finding out';
    const top = `<div class="item-top"><span class="firm-face">${face(st.look, st.age, app ? 60 : st.mor, st.sex)}</span><div><b>${esc(st.name)}${mgr ? ' · manager' : ''}${st.part ? ' · part-time' : ''}</b><small>${esc(word)} · ${st.age}${app ? '' : ` · here ${years(L.s.t - st.since)}`}</small></div><div class="quote"><b>${money(L.firmWage(st))}</b><small>a season</small></div></div>`;
    if (app) {
      const why = L.can('firmHire', st.id);
      return `<div class="item">${top}<div class="picks">${pick('Take on', 'firmHire', st.id, why)}</div></div>`;
    }
    const picks = [];
    if (L.s.biz.lvl >= 1 && !mgr) picks.push(pick('Make manager', 'bizMgr', st.id, null, 'quiet'));
    picks.push(pick(`Let go · ${money(L.firmWage(st))}`, 'firmSack', st.id, L.can('firmSack', st.id), 'quiet'));
    return `<div class="item${mgr ? ' mine' : ''}">${top}${bar('🙂', moodWord(st.mor), st.mor, st.mor < 30 ? 'var(--bad)' : '')}<div class="picks">${picks.join('')}</div></div>`;
  }

  const sheets = {
    // ---- the Town Hall's list of trades (in place of game.js's) ----
    firmStart() {
      const L = kit.life, s = L.s, barred = L.firmBarred();
      let body = `<p class="lead">Start small, and give it a name. Work in it yourself (each trade has a game of its own) to bring in money and build its name; take people on, and set its prices, quality and hours in the office. What the staff take goes into its own till, and at the end of each year the accounts come in. When its name is good enough, it can grow.</p>`;
      if (barred) body += `<div class="item"><p class="sub">📉 After ${esc(s.firm.fail.name)}, the bank will not back a new business for ${barred} more season${barred > 1 ? 's' : ''}.</p></div>`;
      for (const [type, k] of Object.entries(BUSINESSES)) {
        const T = TRADES[type], why = L.can('bizStart', type), seed = L.can('firmSeed', type);
        const best = T.season.indexOf(Math.max(...T.season)), worst = T.season.indexOf(Math.min(...T.season));
        body += `<div class="item"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${k.names[0]}</b><small>Grows into: ${k.names.slice(1).join(', ').toLowerCase()}</small></div></div>
          <div class="facts"><span>${esc(PLACES[k.place].name)}</span><span>${STAT_ICON[k.stats[0]]} ${STAT_NAME[k.stats[0]]} and ${STAT_ICON[k.stats[1]]} ${STAT_NAME[k.stats[1]]}</span><span class="up">Busy in ${SEASONS[best].toLowerCase()}</span><span class="down">Quiet in ${SEASONS[worst].toLowerCase()}</span></div>
          <div class="picks">${pick(`Start · ${money(L.bizCost(0))} ${chip('time', '⏱ 1')}`, 'bizStart', type, why)}${!seed ? pick(`On the enterprise fund · ${money(500)}`, 'firmSeed', type, null, 'quiet') : ''}${why && seed ? `<span class="note">${esc(why)}</span>` : ''}</div></div>`;
      }
      body += '<p class="fine">Short of the money? The Town Hall’s enterprise fund lends the rest of a start, once in a life, for a $500 deposit, paid back out of the till.</p>';
      return { icon: '🏪', title: 'Start a business', sub: 'Be your own boss', body };
    },

    // ---- the office: the one sheet for the business ----
    firmOffice() {
      const L = kit.life, s = L.s, c = L.firmOf();
      if (!c) return null;
      const b = s.biz, k = BUSINESSES[b.type], T = TRADES[b.type], f = L.firmForecast(), mgr = L.firmMgr(), R = c.rival;
      const hands = L.firmHands();
      let body = `<div class="item mine"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${esc(c.name)}</b><small>${esc(cap(an(L.firmSize())))} ${esc(L.firmAt())}, since you were ${c.from}</small></div><div class="quote"><b class="${c.till < 0 ? 'down' : ''}">${money(c.till)}</b><small>in the till</small></div></div>
        ${bar('📣', 'Its name', b.rep)}
        <div class="facts"><span>${L.firmBusy() >= 1.15 ? '🔥' : L.firmBusy() <= 0.88 ? '🥶' : '⛅'} ${busyWord(L)}</span><span>${L.eco().icon} ${esc(L.eco().name)}</span>${c.loan ? `<span class="down">Owes the bank ${money(c.loan)}</span>` : ''}${R ? `<span class="down">A rival: ${esc(R.name)}</span>` : ''}${c.shut === s.t ? '<span class="down">Shut by the inspector</span>' : ''}${c.strike === s.t ? '<span class="down">On strike</span>' : ''}</div></div>`;
      body += actRow(L.look('bizWork'));
      body += `<h3>How it is run</h3>${seg(L, 'price', PRICES)}${seg(L, 'qual', QUALS)}${seg(L, 'hours', HOURS)}<p class="fine">Changes show from next season. Cheap and long hours bring more in and wear on the staff; dear only works with a good name; cutting corners saves on stock, and inspectors notice.</p>`;
      body += `<h3>This season, as it looks</h3><div class="item"><div class="line"><span>Trade coming its way</span><b>${money(f.there.demand)}</b></div><div class="line"><span>What the staff can serve${c.staff.length ? '' : ' (nobody yet)'}</span><b>${money(f.there.cap)}</b></div>
        <div class="line"><span>If you work in it</span>${signed(f.there.profit)}</div><div class="line"><span>Left to ${mgr ? `${esc(first(mgr.name))}, the manager` : 'itself'}</span>${signed(f.away.profit)}</div>
        <p class="fine">${hands < 0 ? '📋 Short of hands: there is more trade than the staff can serve.' : hands > 0 ? 'More hands than work: wages for nothing in a quiet season.' : 'About as many hands as the trade needs.'} ${esc(T.busy)}; ${esc(T.quiet.toLowerCase())}. Your own spells of work pay you directly, on top.</p></div>`;
      body += `<h3>Staff · ${c.staff.length} of ${L.firmNeed()} needed</h3>`;
      if (!c.staff.length) body += `<div class="item"><p class="sub">${b.lvl === 0 ? 'Just you. A helper would keep it open when you are not there.' : 'Nobody yet: it cannot trade without you until somebody is taken on.'}</p></div>`;
      body += c.staff.map((st) => person(L, st, false)).join('');
      if (b.lvl >= 1) body += actRow(L.look('bizMgr'));
      const apps = c.apps;
      if (apps.length) body += `<details${c.staff.length < L.firmNeed() ? ' open' : ''}><summary>Who wants a job here (${apps.length})</summary>${apps.map((a) => person(L, a, true)).join('')}<p class="fine">What sort of person they are is not on the form, and shows in a season or two.</p></details>`;
      body += '<h3>Growing</h3>';
      if (b.lvl < 3) { body += actRow(L.look('bizGrow')); const g = L.look('firmGrowLoan'); body += `<div class="picks">${pick(`Grow it on a bank loan · ${money(g.cost)} down`, 'firmGrowLoan', undefined, g.why, 'quiet')}${g.why && g.why !== L.can('bizGrow') ? `<span class="note">${esc(g.why)}</span>` : ''}</div>`; } else body += `<div class="item"><p class="sub">${esc(c.name)} is as big as a business gets in the Bay.</p></div>`;
      if (b.lvl >= 2) {
        if (c.branch) body += `<div class="item"><p class="sub">🏪 A second ${esc(c.name)} ${esc(L.firmAt(c.branch.at))}, since ${SEASONS[c.branch.t % 4].toLowerCase()} of year ${Math.floor(c.branch.t / 4) + 1}.</p></div>`;
        else body += `<div class="item"><div class="item-top"><span class="act-ico">🏪</span><div><b>A second premises</b><small>More trade, and two more staff to find. ${money(L.firmBranchCost())}.</small></div></div><div class="picks">${L.firmBranchPlaces().map((p) => pick(esc(PLACES[p].name), 'firmBranch', p, L.can('firmBranch', p))).join('')}</div></div>`;
      }
      if (R) {
        body += `<h3>The rival</h3><div class="item"><div class="item-top"><span class="act-ico">🏴</span><div><b>${esc(R.name)}</b><small>${esc(R.who)}${R.known ? `: ${RIVAL_KINDS[R.kind].word}` : ''}</small></div></div>${bar('📈', 'Pull', R.str, 'var(--bad)')}
          <p class="fine">A good name, fair prices and good things wear a rival down; a poor name feeds it.</p><div class="picks">${pick(`Buy them out · ${money(L.firmRivalPrice())}`, 'firmBuyOut', undefined, L.can('firmBuyOut'))}</div></div>`;
      }
      if (c.board) body += `<h3>The board</h3><div class="item"><p class="sub">${c.board.who.map(esc).join(', ')}.</p>${bar('🪑', 'Its patience', c.board.mood)}</div>`;
      const y = c.yr, yrs = c.years.slice(-5);
      body += `<h3>The money</h3><div class="item"><div class="line"><span>In the till</span>${signed(c.till)}</div>${c.loan ? `<div class="line"><span>Owed to the bank${c.seed ? ' (enterprise fund)' : ''}</span><b class="down">${money(c.loan)}</b></div>` : ''}
        ${y.n ? `<div class="line"><span>This year so far (${y.n} season${y.n > 1 ? 's' : ''})</span>${signed(y.profit)}</div>` : ''}${yrs.map((q) => `<div class="line"><span>The year you were ${q.a}</span>${signed(q.p)}</div>`).join('')}
        <div class="line"><span>Worth, to a buyer</span><b>${money(L.bizWorth())}</b></div>
        <p class="fine">At the end of each year the accounts come in, and you choose what happens to the profit.</p>
        <div class="picks">${[1000, 10000].map((n) => pick(`Put in ${money(n)}`, 'firmPutIn', n, L.can('firmPutIn', n), 'quiet')).join('')}${c.loan ? pick(`Pay off ${money(Math.min(c.loan, Math.max(0, s.cash + s.bank)))}`, 'firmRepay', Math.min(c.loan, Math.max(0, Math.floor(s.cash + s.bank))), L.can('firmRepay', Math.min(c.loan, Math.max(0, Math.floor(s.cash + s.bank)))), 'quiet') : ''}</div></div>`;
      const tales = [...c.lines.map((id) => { const i = T.ideas.find((q) => q.id === id); return i ? `💡 ${cap(i.t)}` : ''; }), ...(c.gone || []).slice(-4).map((g) => `${g.name}: ${{ sacked: 'let go', left: 'left', poached: 'went elsewhere', retired: 'retired', rival: 'left to set up across the road', theft: 'left under a cloud', quiet: 'moved on', died: 'died' }[g.how] || 'left'}${g.yrs ? `, after ${years(g.yrs * 4)}` : ''}`)].filter(Boolean);
      if (tales.length) body += `<details><summary>The story so far</summary>${tales.map((t) => `<p class="fine">${esc(t)}</p>`).join('')}</details>`;
      body += actRow(L.look('bizSell'));
      return { icon: '🗝️', title: c.name, sub: `${cap(L.firmSize())} · ${L.firmWhere()}`, body };
    },
  };
  const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

  return {
    sheets,
    // A spell of work, played as the trade's game.
    act: {
      bizWork() {
        const L = kit.life, why = L.can('bizWork', 0.5);
        if (why) { kit.sfx('nope'); kit.toast(why); return; }
        const b = L.s.biz, k = BUSINESSES[b.type], g = TRADES[b.type].game;
        if (g.id === 'stall') setStallGoods(DESIGN_GOODS);
        kit.playMini({ id: g.id, title: g.titles[b.lvl], icon: k.icon, level: Math.min(5, b.lvl + 1), ease: L.s.st[k.stats[0]] / 100, skill: STAT_NAME[k.stats[0]] }, (score) => { if (score != null && kit.life && kit.life.s.biz) kit.doAct('bizWork', score); });
      },
    },
    // The business's lines in the Work box on the Me tab (see game.js).
    work(L) {
      const c = L.firmOf();
      if (!c) return '';
      const b = L.s.biz, mgr = L.firmMgr(), last = c.years[c.years.length - 1];
      return `<div class="line"><span>${BUSINESSES[b.type].icon} ${esc(c.name)}, ${esc(an(L.firmSize()))} ${esc(L.firmAt())}</span><b>${mgr ? `Managed by ${esc(first(mgr.name))}` : 'Run by you'}</b></div>
        ${bar('📣', 'Its name', b.rep)}
        <p class="fine">${c.staff.length} of ${L.firmNeed()} staff · ${money(c.till)} in the till${c.loan ? ` · owes the bank ${money(c.loan)}` : ''}${last ? ` · last year ${last.p >= 0 ? `${money(last.p)} profit` : `${money(-last.p)} lost`}` : ''}${c.rival ? ` · a rival, ${esc(c.rival.name)}` : ''}. Worth ${money(L.bizWorth())}; a spell of work in it brings in about ${money(L.bizTake())}.</p>
        <button class="btn btn-soft wide firm-btn" data-do="open" data-kind="firmOffice">🗝️ The office</button>`;
    },
    // Businesses that are gone, once there is no business now.
    me(L) {
      const Fm = L.s.firm;
      if (!Fm || L.firmOf() || (!Fm.past.length && !Fm.fail)) return '';
      const how = { sold: (p) => `sold for ${money(p.got)}`, chain: (p) => `sold to a chain for ${money(p.got)}`, bust: () => 'went under', gone: () => 'taken by the bailiffs', replaced: () => 'gave way to another', will: () => 'left in the will' };
      const barred = L.firmBarred();
      return `<div class="box"><h3>Businesses</h3>${Fm.past.slice(-5).reverse().map((p) => `<div class="line"><span>${BUSINESSES[p.type] ? BUSINESSES[p.type].icon : '🏪'} ${esc(p.name)}, ${p.from} to ${p.to}</span><b class="${p.how === 'bust' ? 'down' : ''}">${(how[p.how] || (() => 'closed'))(p)}</b></div>`).join('')}
        ${barred ? `<p class="fine">The bank will back a new business again in ${barred} season${barred > 1 ? 's' : ''}.</p>` : '<p class="fine">The Town Hall’s job board has a list of trades, for a fresh start.</p>'}</div>`;
    },
    marks(L) {
      const c = L.firmOf(), out = [];
      if (!c) return out;
      if (c.branch) out.push([c.branch.at, '🏪']);
      if (L.s.biz.lvl >= 1 && c.staff.length < L.firmNeed() && c.apps.length) out.push([BUSINESSES[L.s.biz.type].place, '📋']);
      return out;
    },
    // A son or daughter who works in it.
    person(L, p) {
      const c = L.firmOf(), st = c && c.staff.find((q) => q.kin === p.id);
      return st ? `<p class="fine">🏪 Works at ${esc(c.name)}, these ${years(L.s.t - st.since)}.</p>` : '';
    },
    css: `
.firm-set { margin: 8px 0 4px; }
.firm-set > span { display: block; margin: 0 2px 4px; font-size: 12.5px; font-weight: 900; color: var(--muted); }
.firm-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.firm-seg button { display: grid; align-content: start; justify-items: center; gap: 2px; min-height: 58px; padding: 7px 4px; border-radius: 12px; background: #f6efdf; color: #6b6048; box-shadow: 0 2px 0 #e2d8c0; text-align: center; }
.firm-seg button b { font-size: 13.5px; font-weight: 900; color: var(--ink); line-height: 1.15; }
.firm-seg button small { font-size: 11px; font-weight: 700; line-height: 1.2; }
.firm-seg button.on { background: #e3f4f6; box-shadow: 0 0 0 2.5px var(--teal); }
.firm-seg button.on b { color: var(--teal-d); }
.firm-seg button:active { transform: translateY(2px); box-shadow: none; }
.firm-face { flex: none; width: 44px; height: 44px; border-radius: 50%; background: #f6efdf; overflow: hidden; }
.firm-face svg { width: 100%; height: 100%; display: block; }
.item .line { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; font-size: 13.5px; font-weight: 700; }
.item .line b.up { color: var(--good); } .item .line b.down, .item-top .quote b.down { color: var(--bad); }
.firm-btn { margin-top: 10px; }
`,
  };
}
