// New in Town: the town growing old with you, on screen. The council
// chamber (who is mayor, what was promised and what came of it, and at
// election time who is standing, the bookmaker's odds and how to help),
// Years in the Bay (the Gazette's back numbers: a headline for every year
// of your life here, the town's and your own), a box on the Me tab, notes
// at the top of the places that have changed, and a badge on the Town Hall
// while an election is on. The rules are in annals.js.

import { PLATS } from './annals.js';
import { LOOKS } from './data.js';

// Mayor Pennington's face, as folk-cast.js draws him.
const PENN = { skin: 0, hair: 1, top: 6, style: 4, beard: false };
// A face for somebody standing for mayor, the same every time for the same name.
function lookOf(c) {
  let h = 7;
  for (const ch of c.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const styles = LOOKS[c.sex === 'f' ? 'f' : 'm'];
  return { skin: h % LOOKS.skin.length, hair: (h >>> 4) % LOOKS.hair.length, top: (h >>> 8) % LOOKS.top.length, style: styles[(h >>> 12) % styles.length], beard: c.sex === 'm' && (h >>> 16) % 4 === 0 };
}
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const many = (n, one, more) => `${WORDS[n] || n} ${n === 1 ? one : more}`;
const DECADE = ['', 'Your teens', 'Your twenties', 'Your thirties', 'Your forties', 'Your fifties', 'Your sixties', 'Your seventies', 'Your eighties', 'Your nineties', 'Past a hundred'];

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const list = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);

export default function (kit) {
  const { esc, money, chip, pick, actRow } = kit;
  const L = () => kit.life;

  function faceOf(life, c) {
    const s = life.s;
    if (c.k === 'you') return kit.face(s.look, s.age, s.happy, s.sex);
    return kit.face(c.k === 'penn' ? PENN : lookOf(c), life.annalsAge(c), 62, c.sex);
  }
  const platLine = (p) => `${PLATS[p].icon} ${esc(PLATS[p].name)}`;

  // ---- the council chamber ----
  function hall() {
    const life = L(), s = life.s, an = s.annals, m = life.annalsMayor(), race = an.race;
    let body = '';
    // Who holds the chain.
    body += `<div class="item an-mayor"><div class="item-top"><span class="ava">${faceOf(life, m)}</span><div><b>${m.k === 'you' ? 'You' : esc(life.annalsMayorName(m))}</b>
      <small>${m.k === 'you' ? 'Mayor of Starling Bay' : m.acting ? `Acting mayor, ${esc(m.job)}` : m.k === 'penn' ? 'Mayor, like his father and his grandfather before him' : `Mayor, ${esc(m.job)}`}${m.since >= 0 ? ` · since ${life.annalsWhen(m.since)}` : ''}</small>
      <small>${platLine(m.plat)}</small></div></div></div>`;
    // What was promised, and what came of it.
    const works = life.annalsWorks(), built = Object.entries(an.built).sort((a, b) => b[1] - a[1]);
    if (works.length || built.length) {
      body += '<h3>Promised, and done</h3>';
      body += works.map((w) => `<div class="an-row"><span>${w.icon}</span><div><b>${esc(w.name)}</b><small>${esc(w.state)} · ${w.by === 'yours' ? 'your promise' : `promised by ${esc(w.by)}`}</small></div></div>`).join('');
      body += built.map(([p, t]) => `<div class="an-row done"><span>${PLATS[p].icon}</span><div><b>${esc(PLATS[p].name)}</b><small>✓ Done, in ${life.annalsWhen(t)}</small></div></div>`).join('');
    }
    // The election, if one is on.
    if (race) {
      const ch = life.annalsChances(), you = race.you;
      body += `<h3>The election · polling day in ${life.annalsWhen(an.poll)}</h3>`;
      body += `<p class="lead">${s.t < an.poll ? 'Nominations are open until polling day.' : 'It is polling day this season.'} Campaigning helps whoever you campaign for (Charm and fame make it count for more). The bookmaker on the High Street takes one bet an election.</p>`;
      for (const c of race.c) {
        const k = c.k, mine = k === 'you', p = Math.round((ch[k] || 0) * 100);
        const camp = life.can('anCampaign', k), bets = [100, 500].map((n) => pick(`Bet ${money(n)}`, 'anBet', { k, n }, life.can('anBet', { k, n }), 'quiet')).join('');
        body += `<div class="item${race.vote === k || race.camp[k] ? ' mine' : ''}"><div class="item-top"><span class="ava">${faceOf(life, c)}</span><div><b>${mine ? 'You' : esc(c.k === 'penn' ? life.annalsMayorName(c) : c.name)}</b><small>${mine ? 'Standing for mayor' : c.k === 'penn' ? 'Standing again' : esc(c.job)}</small><small>${platLine(c.plat)}</small></div>
          <div class="quote"><b>${p}%</b><small>${esc(life.annalsPriceSaid(k))}</small></div></div>
          <p class="fine an-pitch">${esc(PLATS[c.plat].pitch)}</p>
          ${race.camp[k] ? `<div class="facts"><span class="up">📣 You have campaigned for ${mine ? 'yourself' : 'them'}</span></div>` : ''}
          <div class="picks">${pick(`📣 Campaign ${chip('time', '⏱ 1')}`, 'anCampaign', k, camp)}${race.bet ? '' : bets}</div></div>`;
      }
      if (race.bet) { const c = race.c.find((q) => q.k === race.bet.on), { a, b } = race.bet; body += `<p class="sub">🎫 Your bet: ${money(race.bet.n)} on ${race.bet.on === 'you' ? 'yourself' : esc(c ? c.name : 'them')}, at ${a === b ? 'evens' : a < b ? `${b} to ${a} on` : `${a} to ${b}`}.</p>`; }
      if (you) body += '<p class="fine">Your own chances rest on your Charm, your name in town and your fame, and on how hard you campaign.</p>';
    } else body += `<h3>The next election</h3><p class="sub">In ${life.annalsWhen(an.poll)}${an.poll - s.t <= 6 ? ', and nominations open two seasons before' : ''}.${an.last ? ` Last time: ${esc(an.last.name)}, for ${esc(PLATS[an.last.plat].said || PLATS[an.last.plat].name.toLowerCase())}.` : ''}</p>`;
    // Standing yourself.
    const j = s.job;
    if (j && j.c === 'politics') body += j.r === 3 && !s.f.elected ? `<h3>Your own name</h3>${actRow(life.look('mayor'))}` : j.r < 3 ? '<p class="fine">Deputy Mayors may stand for mayor. You have some way to go.</p>' : '';
    // The appeals.
    const open = life.annalsAppeals(), appeals = [['pier', 'The Pier Trust', '🎡'], ['lido', 'The Lido Fund', '🏊'], ['line', 'Save Our Line', '🚂']].filter(([to]) => open.includes(to));
    if (appeals.length) {
      body += '<h3>The appeals</h3>';
      for (const [to, name, icon] of appeals) body += `<div class="item fund"><div class="item-top"><span class="act-ico">${icon}</span><div><b>${name}</b><small>${(an.gave[to] || 0) ? `You have given ${money(an.gave[to])}.` : 'Every dollar helps, they say, and so does every name on the list.'}</small></div></div>
        <div class="picks">${[100, 1000, 10000].map((n) => pick(money(n), 'anGive', { to, n }, life.can('anGive', { to, n }))).join('')}</div></div>`;
    }
    body += '<div class="picks mid"><button class="pick quiet" data-do="open" data-kind="annalsYears">🗂️ Years in the Bay</button></div>';
    return { icon: '🎩', title: race ? 'The election' : 'The council', sub: m.k === 'you' ? 'You hold the chain of office' : life.annalsMayorTitle(m), body };
  }

  // ---- Years in the Bay ----
  function years() {
    const life = L(), s = life.s, an = s.annals, all = life.annalsYears();
    const town = all.filter((y) => y.h).length, mayors = new Set(an.mayors).size;
    let body = `<div class="paper an-album"><p class="mast">Years in the Bay</p><p class="dateline">From the files of the Starling Bay Gazette · ${all.length - 1} year${all.length === 2 ? '' : 's'} so far</p>
      <p class="story">${esc(s.name)} came to Starling Bay at eighteen with one suitcase${an.from ? '' : ', and the town has been keeping count ever since'}. ${cap(list([mayors > 1 ? `${many(mayors, 'mayor', 'mayors')} in the Town Hall` : '', an.hooks.length ? `${many(an.hooks.length, 'tankard', 'tankards')} on the hooks at the Gull` : '', `${many(an.n.shops || 0, 'shop', 'shops')} come and gone on the High Street`].filter(Boolean)))}.</p>
      ${an.from > 0 ? `<p class="fine">The Gazette’s files go back to ${life.annalsWhen(an.from)}. Before that, your own journal remembers what it can.</p>` : ''}`;
    // By decade of your life, the latest open.
    const by = {};
    for (const y of all) (by[Math.floor(y.a / 10)] = by[Math.floor(y.a / 10)] || []).push(y);
    const decs = Object.keys(by).map(Number).sort((a, b) => a - b);
    for (const d of decs) {
      const rows = by[d].map((y) => `<div class="an-yr${y.now ? ' now' : ''}"><b>${y.a}</b><span>${y.i}</span><div>${y.h ? `<p class="an-h">${esc(y.h)}</p>` : y.now ? '<p class="an-h">This year, so far</p>' : '<p class="an-h dim">(No Gazette for this year)</p>'}
        <p class="an-m">${y.m ? esc(y.m) : y.now ? '' : esc(life.annalsQuiet(y.a))}</p></div></div>`).join('');
      // (Shut, a decade shows the thing it will be remembered for.)
      const big = by[d].filter((y) => y.h).sort((a, b) => (b.p || 0) - (a.p || 0))[0];
      body += `<details class="an-dec"${d === decs[decs.length - 1] ? ' open' : ''}><summary><span><b>${DECADE[Math.min(10, d)] || `Your ${d}0s`}</b>${big && (big.p || 0) >= 5 ? `<em>${big.i} ${esc(big.h)}</em>` : ''}</span><small>${by[d][0].a}–${by[d][by[d].length - 1].a}</small></summary>${rows}</details>`;
    }
    body += '</div>';
    return { icon: '🗂️', title: 'Years in the Bay', sub: `${town} year${town === 1 ? '' : 's'} of headlines`, body };
  }

  // ---- the Me tab ----
  function me(life) {
    const s = life.s, an = s.annals;
    if (!an) return '';
    const m = life.annalsMayor(), works = life.annalsWorks(), on = life.annalsOn();
    return `<div class="box an-me"><h3>The town</h3>
      <div class="line"><span>🎩 ${m.k === 'you' ? 'Mayor' : m.acting ? 'Acting mayor' : 'Mayor'}</span><b>${m.k === 'you' ? 'You' : esc(life.annalsMayorName(m))}</b></div>
      ${works.map((w) => `<div class="line"><span>${w.icon} ${esc(w.name)}</span><b>${esc(w.state.replace(/^Promised for /, ''))}</b></div>`).join('')}
      <div class="line"><span>🗳️ ${an.race ? 'Polling day' : 'Next election'}</span><b>${esc(life.annalsWhen(an.poll))}</b></div>
      ${on.map(([i, t]) => `<p class="sub">${i} ${esc(t)}</p>`).join('')}
      <div class="picks"><button class="pick quiet" data-do="open" data-kind="annalsHall">🎩 The council</button><button class="pick quiet" data-do="open" data-kind="annalsYears">🗂️ Years in the Bay</button></div></div>`;
  }

  // ---- at the top of a place's sheet ----
  function place(life, id) {
    if (!life.s.annals) return '';
    return life.annalsPlace(id).map(([i, t]) => {
      // (The long lists fold away.)
      if (id === 'pub' && i === '🍺') {
        const bar = life.annalsBar();
        return `<details class="an-note"><summary>🍺 The regulars${bar.some((r) => r.fresh) ? ' · a new face' : ''}</summary><ul class="an-list">${bar.map((r) => `<li><b>${esc(r.n)}</b>, ${r.age}, who ${esc(r.does)}${r.fresh ? ' <i class="an-new">new</i>' : ''}</li>`).join('')}</ul></details>`;
      }
      if (id === 'highstreet' && i === '🛍️') {
        const shops = life.annalsShops(), fresh = shops.some((x) => x.fresh);
        return `<details class="an-note"><summary>🛍️ The shops${fresh ? ' · something new' : ''}</summary><ul class="an-list">${shops.map((x) => `<li>${esc(cap(x.n))}${x.was ? `<small>, where ${esc(x.was)} was</small>` : ''}${x.fresh ? ' <i class="an-new">new</i>' : ''}</li>`).join('')}</ul>${/supermarket/.test(t) ? '<p>The supermarket on the ring road has a free bus, and it is always full.</p>' : ''}</details>`;
      }
      // (The Town Hall's note is the way into the council chamber.)
      if (id === 'townhall') return `<button class="an-note an-go" data-do="open" data-kind="annalsHall"><span>${i} ${esc(t)}</span><i class="go">›</i></button>`;
      return `<p class="an-note">${i} ${esc(t)}</p>`;
    }).join('');
  }

  function marks(life) {
    const an = life.s.annals;
    return an && an.race && !life.s.gaol ? [['townhall', '🗳️']] : [];
  }

  const css = `
.an-mayor .ava, .sheet-body .item .ava { width: 52px; height: 52px; flex: none; }
.an-mayor .ava svg, .sheet-body .item .ava svg { width: 100%; height: 100%; }
.an-row { display: flex; align-items: center; gap: 10px; padding: 7px 4px; border-bottom: 1px solid var(--line); }
.an-row > span { font-size: 22px; width: 30px; text-align: center; flex: none; }
.an-row > div { display: grid; gap: 1px; min-width: 0; }
.an-row b { font-size: 14px; font-weight: 800; }
.an-row small { font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.3; }
.an-row.done b { color: var(--good); }
.an-pitch { margin-top: 6px; font-style: italic; }
.an-note { margin: 10px 2px 0; padding: 8px 10px; border-radius: 10px; background: #eef6f7; box-shadow: inset 0 0 0 1.5px #cfe5e8; font-size: 13px; font-weight: 700; color: #3d5a63; line-height: 1.4; }
button.an-note.an-go { display: flex; align-items: center; gap: 8px; width: calc(100% - 4px); text-align: left; min-height: 44px; font: inherit; font-size: 13px; font-weight: 800; border: 0; }
button.an-note.an-go span { flex: 1; }
button.an-note.an-go:active { transform: translateY(1px); }
details.an-note summary { cursor: pointer; font-weight: 800; color: #2d4f58; min-height: 24px; display: flex; align-items: center; }
details.an-note p { margin: 6px 0 0; }
.an-album { padding-bottom: 10px; }
.an-album .story { font-size: 14px; }
.an-dec { border-top: 1px solid #d9cfb6; }
.an-dec summary { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-height: 44px; padding: 10px 0; font-size: 15px; font-weight: 700; cursor: pointer; list-style: none; }
.an-dec summary::-webkit-details-marker { display: none; }
.an-dec summary::before { content: '▸'; margin-right: 6px; color: #9a8f78; }
.an-dec[open] summary::before { content: '▾'; }
.an-dec summary small { margin-left: auto; font-size: 12px; color: #9a8f78; font-weight: 400; flex: none; }
.an-dec summary > span { display: grid; gap: 2px; min-width: 0; }
.an-dec summary b { font-weight: 700; }
.an-dec summary em { font-size: 12.5px; font-weight: 400; color: #6b6048; line-height: 1.3; }
.an-list { margin: 6px 0 0; padding: 0 0 0 16px; display: grid; gap: 4px; }
.an-list li { line-height: 1.35; }
.an-list small { font-size: 12px; font-weight: 700; color: #6d8790; }
.an-new { font-style: normal; font-size: 10.5px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; color: #fff; background: var(--teal); border-radius: 6px; padding: 1px 5px; vertical-align: 1px; }
.an-yr { display: grid; grid-template-columns: 30px 26px 1fr; gap: 6px; align-items: start; padding: 7px 0; border-top: 1px dotted #e3d9c0; }
.an-yr > b { font-size: 15px; font-weight: 700; color: #6b6048; text-align: right; padding-top: 1px; }
.an-yr > span { font-size: 18px; line-height: 1.2; text-align: center; }
.an-yr p { margin: 0; }
.an-yr .an-h { font-size: 14.5px; font-weight: 700; line-height: 1.3; }
.an-yr .an-h.dim { color: #9a8f78; font-weight: 400; font-style: italic; }
.an-yr .an-m { font-size: 13px; color: #5a5446; line-height: 1.35; font-style: italic; }
.an-yr.now { background: #f6efdc; border-radius: 6px; padding: 7px 4px; }
.entry.town { color: #3d5a63; }
.an-me .picks { margin-top: 10px; }
`;

  return { sheets: { annalsHall: hall, annalsYears: years }, me, place, marks, css };
}
