// New in Town: the screen for the chapters of a life, old age and the will
// (the rules are in chapters.js). Boxes on the Me tab for the chapter you
// are in, what you would leave, and later life; a sheet for the will, kept
// by Mrs Gale on the High Street; and a sheet for the chapters so far.

import { DREAMS, HOMES, GIFTS, CAREERS, ITEMS, low } from './data.js';
import { CROSS, DUTY, SETTLE, GIFT_YEARS, MEMO, homeSaid, famRel } from './chapters.js';

const AGES = { 18: 'eighteen', 30: 'thirty', 45: 'forty-five', 60: 'sixty' };
const first = (p) => p.name.split(' ')[0];
const relOf = (p) => (p.kind === 'child' ? (p.sex === 'm' ? 'son' : 'daughter') : p.sex === 'm' ? 'grandson' : 'granddaughter');

export default function (kit) {
  const { esc, money, cashShort, pick, face } = kit;

  // What starting as this person would look like.
  function startsAs(life, p) {
    if (p.age < 18) return `Would come back to the Bay at eighteen, in ${18 - p.age} year${18 - p.age === 1 ? '' : 's'}.`;
    const job = p.job && CAREERS[p.job] && !CAREERS[p.job].shady ? life.jobOf(p).toLowerCase() : null;
    const own = life.grandkids().filter((g) => g.of === p.id).length;
    return `Would start at ${p.age}${job ? `, ${kit.an(job)}` : ''}${own ? `, with ${own === 1 ? 'a child' : `${own} children`} of ${p.sex === 'm' ? 'his' : 'her'} own` : ''}.`;
  }
  // "the cottage, your guitar and $84,000"
  function leaves(life, est) {
    const out = life.chapLeaves(est, est.heir);
    // (Anything with an "and" of its own is closed off with a comma before the last "and".)
    return out.length ? kit.esc(out.length < 2 ? out.join('') : `${out.slice(0, -1).join(', ')}${out.slice(0, -1).some((t) => t.includes(' and ')) ? ',' : ''} and ${out[out.length - 1]}`) : 'nothing much but a good name';
  }
  const choice = (label, id, x, on, why) => pick(`${on ? '✓ ' : ''}${label}`, id, x, why, on ? 'on' : 'quiet');

  function chapters(life) {
    const s = life.s, C = s.chap, next = life.chapNext();
    const from = C.past.length ? C.past[C.past.length - 1].age : C.start.age;
    let h = `<div class="box chap-box"><h3>The chapters of your life</h3>
      <div class="line"><span>📖 ${esc(life.chapName())}</span><b>since ${from}</b></div>`;
    if (next) h += `<p class="fine">At ${next} comes a crossroads: a look back at what this chapter held, and new dreams for anything that has come true, or gone out of reach.</p>`;
    if (C.was.length) h += `<h4>Dreams from earlier chapters</h4>${C.was.map((d) => (DREAMS[d.id] ? `<div class="dream${d.done != null ? ' done' : ''}"><i>${DREAMS[d.id].icon}</i><div><b>${esc(DREAMS[d.id].name)}</b><small>${d.done != null ? `Came true at ${d.done}` : `Let go at ${d.at}`}</small></div><em>${d.done != null ? '✓' : ''}</em></div>` : '')).join('')}`;
    if (C.past.length) h += '<button class="btn btn-soft wide" data-do="open" data-kind="chapStory">📖 The chapters so far</button>';
    return `${h}</div>`;
  }

  function legacy(life) {
    const s = life.s, cands = life.chapCands();
    if (s.age < 35 && !cands.length && life.netWorth() < 250000) return '';
    const est = life.chapEstate(), heir = est.heir != null ? life.person(est.heir) : null;
    const who = heir ? `<b>${esc(first(heir))}</b> (your ${relOf(heir)}, ${heir.age}) would carry on` : 'a distant cousin would carry on, stepping off the train at eighteen,';
    return `<div class="box chap-box"><h3>What you would leave</h3>
      <p class="sub">If it all ended today, ${who}, with ${leaves(life, est)}.</p>
      ${est.toSpouse ? (() => { const sp = life.chapSpouse(), mum = est.via ? life.person(est.via.p) : null; return `<p class="fine">The money goes to ${esc(first(sp))}, free of duty${mum ? `; ${esc(first(mum))}’s part of it, ${money(est.via.n)}, comes down to ${esc(first(heir))} in the end` : ', and comes down to the children in the end'}.</p>`; })() : ''}
      <div class="line"><span>Everything you own</span><b>${money(est.worth)}</b></div>
      ${est.duty ? `<div class="line down"><span>Death duty</span><b>${money(-est.duty)}</b></div>` : ''}
      ${est.town && est.town.ok ? `<div class="line"><span>${GIFTS[est.town.id].icon} To the town</span><b>${money(est.town.cost)}</b></div>` : ''}
      <p class="fine">${s.chap.will.made ? 'Your will is with Mrs Gale on the High Street.' : 'You have not made a will: this is what would happen without one.'} Death duty: none on the first ${money(DUTY.free)}, half of the rest up to ${money(DUTY.mid)}, and four-fifths of anything above.</p>
      <button class="btn btn-soft wide" data-do="open" data-kind="chapWill">📜 Your will</button></div>`;
  }

  function later(life) {
    const s = life.s, C = s.chap, O = C.old, D = C.dusk, rows = [];
    if (s.age < 60 && !D) return '';
    if (D) rows.push(['🕯️', 'Your last chapter', `${life.chapDuskWord().replace(/^./, (c) => c.toUpperCase())}.${D.way === 'grace' ? ' You are meeting it with grace.' : D.way === 'fight' ? ' You are fighting it.' : D.way === 'quiet' ? ' You have told nobody.' : ''}`]);
    if (s.age >= 75) rows.push(['🦯', 'Slower than you were', `One block of time less each season${s.age >= 85 ? ', two now you are past eighty-five' : ' (two at eighty-five)'}.`]);
    if (O.hip) rows.push(['🦴', 'Your hip', { new: 'A new one, and it works.', wait: 'On the waiting list. It costs you a block of time a season, and some cheer.', stick: 'Managing with a stick. Mind the frost.' }[O.hip]]);
    if (O.heart) rows.push(['🫀', 'Your heart', O.heart === 'mended' ? 'A new valve, ticking like a good clock.' : 'Tablets, and a quieter life.']);
    if (O.mend != null && O.mend >= s.t) rows.push(['🩹', 'Getting over an operation', 'A block of time less this season.']);
    if (C.memo.done) rows.push(['📜', 'Your memoirs', `${esc(C.memo.done.title)}, finished at ${C.memo.done.age}.`]);
    else if (C.memo.p) rows.push(['📜', 'Your memoirs', `${C.memo.p} of ${MEMO} sittings written, at home.`]);
    else if (s.age >= 60) rows.push(['📜', 'Your memoirs', 'Not begun. They are written at home, a sitting a season.']);
    if (O.mind && O.mind.on) rows.push(['🧸', 'Minding the grandchildren', O.mind.light ? 'Fridays, and some of the holidays.' : 'Tuesdays and Thursdays: a block of time a season, and worth every minute.']);
    if (O.lunch != null && life.person(O.lunch)) rows.push(['🍺', 'Lunch at the Gull', `With ${esc(life.person(O.lunch).name)}, the first Friday of the month.`]);
    if (O.kid != null && life.person(O.kid)) rows.push(['🏠', 'Family under your roof', `${esc(first(life.person(O.kid)))} and family: a hand about the house, and a block of time more.`]);
    if (O.adv) rows.push(['🎈', 'One last adventure', `At ${O.adv.age} you ${esc(O.adv.said)}${O.adv.fam ? `, as your ${famRel(O.adv.fam)} had at ${O.adv.fam.age}` : ''}.`]);
    return `<div class="box chap-box"><h3>Later life</h3>${rows.map(([i, b, t]) => `<div class="chap-row"><i>${i}</i><div><b>${b}</b><small>${t}</small></div></div>`).join('')}
      <p class="fine">Health holds up best with exercise, good food and a settled home, and the years are kinder to the healthy. When the end comes, you will see it coming.</p></div>`;
  }

  return {
    me(life) { return life.s.chap ? chapters(life) + legacy(life) + later(life) : ''; },

    sheets: {
      chapWill() {
        const life = kit.life, s = life.s, C = s.chap, w = C.will, est = life.chapEstate(), heir = est.heir != null ? life.person(est.heir) : null;
        const cands = life.chapCands().slice().sort((a, b) => (a.kind === b.kind ? b.age - a.age : a.kind === 'child' ? -1 : 1));
        const hn = heir ? esc(first(heir)) : 'your cousin';
        let body = `<p class="lead">Mrs Gale keeps your will in a tin box in her office on the High Street. Change it whenever you like: what counts is what it says at the end.${w.made ? '' : ' You have not made one yet, so this is what would happen without one.'}</p>`;
        // Who carries on.
        body += '<h3>Who carries on</h3>';
        if (cands.length) {
          body += cands.map((p) => `<div class="item${p === heir ? ' mine' : ''}"><div class="item-top"><span class="ava">${face(p.look, p.age, 40 + p.bond * 0.6, p.sex)}</span><div><b>${esc(p.name)}</b><small>Your ${relOf(p)}, ${p.age} · bond ${Math.round(p.bond)}</small></div></div>
            <p class="fine">${esc(startsAs(life, p))}</p><div class="picks chap-picks">${choice(p === heir ? 'Carries on' : 'Name as the one who carries on', 'chapWill', { k: 'heir', v: p.id }, p === heir)}</div></div>`).join('');
          body += '<p class="fine">Whoever carries on is the next life you play. The others get their share of the money; brothers and sisters remember whether it was fair.</p>';
        } else body += '<p class="sub">With no children or grandchildren, a distant cousin would carry on, and step off the train at eighteen as you did.</p>';
        // The house and the business.
        const home = life.homeEntry();
        if (home && heir) {
          body += `<h3>The house</h3><div class="item"><div class="item-top"><span class="act-ico">${HOMES[home.kind].icon}</span><div><b>${esc(homeSaid(home.kind).replace(/^the /, 'The '))}</b><small>Worth ${money(life.propValue(home))}</small></div></div>
            <div class="picks chap-picks">${choice(`To ${hn}, free of duty`, 'chapWill', { k: 'home', v: 'heir' }, w.home === 'heir')}${choice('Sell it, and share the money', 'chapWill', { k: 'home', v: 'sell' }, w.home === 'sell')}</div></div>`;
        }
        if (s.biz && heir) {
          body += `<h3>The business</h3><div class="item"><div class="item-top"><span class="act-ico">🏪</span><div><b>Your ${esc(life.bizName().toLowerCase())}</b><small>Worth ${money(life.bizWorth())}</small></div></div>
            <div class="picks chap-picks">${choice(`To ${hn}, free of duty`, 'chapWill', { k: 'biz', v: 'heir' }, w.biz === 'heir')}${choice('Sell it, and share the money', 'chapWill', { k: 'biz', v: 'sell' }, w.biz === 'sell')}</div></div>`;
        }
        // The money.
        const sp = life.chapSpouse(), kids = life.kids(), can = life.chapSpouseCan(heir);
        if (heir && (kids.length > 1 || sp || heir.kind === 'grandchild')) {
          const sn = sp ? esc(first(sp)) : '', she = sp && sp.sex === 'm' ? 'he' : 'she', mum = heir.kind === 'grandchild' ? life.person(heir.of) : null;
          body += `<h3>The money</h3><div class="item"><div class="picks chap-picks">${choice('Shared fairly among the children', 'chapWill', { k: 'split', v: 'fair' }, w.split === 'fair' || (w.split === 'spouse' && !can))}${kids.length > 1 || heir.kind === 'grandchild' ? choice(`Half to ${hn}, the rest shared`, 'chapWill', { k: 'split', v: 'heir' }, w.split === 'heir') : ''}${can ? choice(`All to ${sn}, and the children after`, 'chapWill', { k: 'split', v: 'spouse' }, w.split === 'spouse') : ''}</div>
            ${!sp ? '' : !can ? `<p class="fine">Money left to ${sn} would never reach ${hn}, so it is not one of the choices.</p>`
              : heir.kind === 'child' ? `<p class="fine">Money left to ${sn} pays no duty now. ${sn} is ${hn}’s ${sp.sex === 'm' ? 'father' : 'mother'} in the next life, and it comes down to the children when ${she} dies, after duty then.</p>`
              : `<p class="fine">Money left to ${sn} pays no duty now. When ${she} dies it is shared among the children: ${esc(first(mum))}’s part${est.via ? ` (${money(est.via.n)} today)` : ''} comes down to ${hn} in the next life, when ${esc(first(mum))} dies, after duty then.</p>`}</div>`;
        } else if (sp && !heir) body += `<h3>The money</h3><p class="fine">With nobody of your own to carry on, money left to ${esc(first(sp))} would never come down to the cousin who does: whatever is left goes to the cousin, after duty.</p>`;
        // The town.
        const open = Object.keys(GIFTS).filter((id) => !s.gifts[id]);
        if (open.length) {
          body += `<h3>The town</h3><div class="item"><p class="fine" style="margin-top:0">Something from the mayor’s appeal, with your name on it, paid for before anything else and free of duty, if the money stretches that far.</p><div class="picks chap-picks">${choice('Nothing for the town', 'chapWill', { k: 'town', v: null }, !w.town)}${open.map((id) => choice(`${GIFTS[id].icon} ${GIFTS[id].name} (${cashShort(GIFTS[id].cost)})`, 'chapWill', { k: 'town', v: id }, w.town === id)).join('')}</div>
            ${est.town && !est.town.ok ? `<p class="fine">There is not enough money in the estate for ${esc(GIFTS[est.town.id].said)} just now.</p>` : ''}</div>`;
        }
        // Given in life.
        if (cands.length) {
          body += `<h3>Given while you are here</h3><p class="fine">Up to ${money(SETTLE[SETTLE.length - 1])} a year to each child or grandchild. It is theirs at once, and free of duty once you have lived another ${GIFT_YEARS} years; until then it counts against the free ${cashShort(DUTY.free)}.</p>`;
          body += cands.map((p) => {
            const got = p.purse || 0;
            return `<div class="item"><div class="item-top"><span class="ava">${face(p.look, p.age, 40 + p.bond * 0.6, p.sex)}</span><div><b>${esc(first(p))}</b><small>${got ? `Given ${money(got)} so far` : 'Nothing given yet'}</small></div></div>
              <div class="picks">${SETTLE.map((n) => pick(`Give ${cashShort(n)}`, 'chapSettle', { p: p.id, n }, life.can('chapSettle', { p: p.id, n }))).join('')}</div></div>`;
          }).join('');
        }
        // What it all comes to.
        const line = (t, n, cls = '') => `<div class="line ${cls}"><span>${t}</span><b>${money(n)}</b></div>`;
        body += `<h3>What it comes to, today</h3><div class="item">${line('Everything you own', est.worth)}
          ${est.home ? line(`${esc(homeSaid(est.home.kind).replace(/^the /, 'The '))}, to ${hn}`, -est.home.value, 'down') : ''}
          ${est.biz ? line(`The ${esc(est.biz.name.toLowerCase())}, to ${hn}`, -est.biz.value, 'down') : ''}
          ${est.town && est.town.ok ? line(`${esc(GIFTS[est.town.id].name)}, for the town`, -est.town.cost, 'down') : ''}
          ${line('Money in the estate', est.money, 'total')}
          ${est.recent ? line(`Given in the last ${GIFT_YEARS} years (counted for duty)`, est.recent) : ''}
          ${est.toSpouse ? '<div class="line"><span>Death duty (none, between husband and wife)</span><b>$0</b></div>' : line('Death duty', -est.duty, 'down')}
          ${est.shares.map((q) => { const p = q.p != null ? life.person(q.p) : null; return line(p ? `To ${esc(first(p))}${p === heir ? ' (carries on)' : ''}` : 'To a distant cousin', q.n, 'up'); }).join('')}</div>
          <p class="fine">Death duty: none on the first ${money(DUTY.free)}; half of the rest up to ${money(DUTY.mid)}; four-fifths of anything above. The family home and a business handed on pass free of it, and so does anything left to the town. ${est.keep.length ? `Keepsakes go with whoever carries on: ${esc(est.keep.map((id) => low(ITEMS[id].name)).join(', '))}.` : ''}</p>`;
        return { icon: '📜', title: 'Your will', sub: heir ? `${first(heir)} carries on` : 'Mrs Gale, solicitor', body };
      },

      chapStory() {
        const life = kit.life, C = life.s.chap;
        let from = C.start.age;
        let body = '<p class="lead">Every crossroads, a look back. These are the chapters so far, as you saw them at the time.</p>';
        for (const c of C.past) {
          body += `<div class="item"><div class="item-top"><span class="act-ico">${{ 30: '🛤️', 45: '⛰️', 60: '🌅' }[c.a] || '📖'}</span><div><b>${esc(life.chapName(from))}</b><small>${AGES[from] ? `${AGES[from][0].toUpperCase()}${AGES[from].slice(1)}` : from} to ${AGES[c.a] || c.age}</small></div></div><p class="fine chap-story">${esc(c.text)}</p></div>`;
          from = c.age;
        }
        return { icon: '📖', title: 'The chapters so far', sub: `${C.past.length} of ${CROSS.length} crossroads`, body };
      },
    },

    css: `
.chap-box h4 { margin: 10px 0 2px; }
.chap-row { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; }
.chap-row + .chap-row { border-top: 1.5px solid var(--line); }
.chap-row > i { font-style: normal; font-size: 22px; width: 32px; text-align: center; line-height: 1.2; }
.chap-row > div { flex: 1; min-width: 0; display: grid; gap: 1px; }
.chap-row b { font-size: 14.5px; font-weight: 900; }
.chap-row small { font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.35; }
.chap-picks .pick { min-height: 44px; }
.chap-picks .pick.on { box-shadow: 0 3px 0 var(--teal-edge); }
.chap-story { color: #5d6680; font-size: 13px; }
.ev-text.letter { margin-top: 10px; padding: 10px 12px; border-radius: 12px; background: #fbf4e3; box-shadow: inset 0 0 0 1.5px #eadfc4; font-style: italic; color: #5a4a36; text-align: left; }
#start .reroll { display: block; margin: 10px auto 0; min-height: 44px; padding: 0 18px; }
`,
  };
}
