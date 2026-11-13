// New in Town: a stretch in Starling Gaol, on screen (the rules are in
// gaol2.js, the hotplate game in gaol2-games.js). A box on the prison screen
// with your job, the record of your seasons and your plan for the board;
// sheets for work and the education wing, the landing, letters and visits,
// the plan for outside and the way over the wall; and a box on the Me tab,
// inside, on the run, or looking back.

import { JOBS, JOB_IDS, LANDING, POST } from './gaol2.js';
import { COURSES } from './data.js';
import './gaol2-games.js';

export default function (kit) {
  const { esc, money, pick, actRow, chip } = kit;
  const pct = (p) => `${Math.round(p * 100)}%`;
  const bar = (ico, label, v, colour) => `<div class="skill"><i>${ico}</i><span>${label}</span><span class="bar"><span style="width:${Math.max(0, Math.min(100, v))}%${colour ? `;background:${colour}` : ''}"></span></span><b>${Math.round(v)}</b></div>`;
  const dots = (n, of) => `<span class="g2-dots">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  const cur = (L) => (L.s.gaol2 && L.s.gaol2.cur) || null;
  const MARKS = { w: ['Worked', 'w'], s: ['Studied', 's'], q: ['Quiet', 'q'], t: ['Trouble', 't'], b: ['The block', 'b'] };
  const rec = (r) => `<div class="g2-rec">${[...r.slice(-40)].map((m) => `<i class="${m}" title="${MARKS[m] ? MARKS[m][0] : ''}"></i>`).join('')}</div>`;
  const need = (ok, text) => `<i class="need${ok ? ' ok' : ''}">${ok ? '✓' : '○'} ${esc(text)}</i>`;
  const kindWord = { partner: 'Your partner', spouse: 'Your spouse', parent: 'Your parent', child: 'Your child', sibling: 'Family', grandchild: 'Your grandchild', friend: 'A friend' };
  const btn = (kind, label) => `<button class="btn btn-soft" data-do="open" data-kind="${kind}">${label}</button>`;

  // ---- the box on the prison screen (and on the Me tab, inside) ----
  const gaolBox = (L) => (cur(L) ? `<div class="box g2-box">${gaolInner(L)}</div>` : '');
  function gaolInner(L) {
    const C = cur(L);
    const j = C.job, J = j && JOBS[j.k], next = L.g2Next(), board = L.g2BoardIn();
    const P = C.plan, clean = [...C.rec].filter((m) => m !== 't' && m !== 'b').length;
    const wants = C.here.filter((id) => L.g2Favour(id)).map((id) => LANDING[id].first);
    return `<div class="g2-job"><span class="act-ico">${J ? J.icon : '🚪'}</span><div><b>${esc(L.g2JobTitle())}${J ? ` · ${esc(J.name.toLowerCase())}` : ''}</b><small>${J ? `${money(J.pay[j.r])} a shift. ${esc(next)}` : 'No work: put in for a job.'}</small></div></div>
      ${C.rec.length ? `${rec(C.rec)}<p class="fine">${C.rec.length} season${C.rec.length === 1 ? '' : 's'} on your record this time, ${clean === C.rec.length ? 'all of them clean' : `${clean} clean`}. The board reads every one.</p>` : '<p class="fine">Every season you serve goes on your record: worked, studied, quiet, or trouble. The board reads every one.</p>'}
      <div class="needs">${need(L.g2HomeOk(), 'Somewhere to live')}${need(!!P.work, 'Work')}${need(!!P.vouch, 'A good word')}</div>
      ${board && L.s.gaol.served * 2 >= L.s.gaol.total ? `<p class="fine">The board sits again ${board === 1 ? 'next season' : `in ${board} seasons`}: about ${pct(L.paroleOdds())} as things stand.</p>` : ''}
      ${wants.length ? `<p class="fine">On the landing, ${esc(wants.join(' and '))} could use your help.</p>` : ''}`;
  }

  // ---- work and the education wing ----
  function g2Jobs() {
    const L = kit.life, C = cur(L);
    if (!C) return null;
    const s = L.s, j = C.job;
    let body = '';
    if (j) {
      const J = JOBS[j.k];
      body += `<div class="item mine"><div class="item-top"><span class="act-ico">${J.icon}</span><div><b>${esc(J.ranks[j.r])}</b><small>${esc(J.name)} · ${money(J.pay[j.r])} a shift · ${esc(L.g2Next())}</small></div></div>${bar('🤝', `With ${esc(J.boss)}`, j.perf)}</div>`;
    } else body += '<div class="item"><p class="sub">No work. Behind your door most of the day, and the board will ask why.</p></div>';
    body += '<p class="fine">Two shifts a season. Each place up pays more and needs a better record; the block, a fight or anything found on you can cost you the job. A place you rose in before will take you back a step below where you left off.</p><h3>Work</h3>';
    for (const k of JOB_IDS) {
      const J = JOBS[k], mine = j && j.k === k, why = mine ? null : L.can('g2Apply', k), best = s.gaol2.best[k] || 0, start = L.g2Start(k);
      body += `<div class="item${mine ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${J.icon}</span><div><b>${esc(J.name)}</b><small>${esc(J.blurb)}</small></div></div>
        <p class="fine">${J.ranks.map((r, i) => `${esc(r)} ${money(J.pay[i])}`).join(' → ')}. Starts at a record of ${J.good[start]}${J.smarts ? `, and Smarts ${J.smarts}` : ''}.${best ? ` You were ${esc(J.ranks[best].toLowerCase())} here once.` : ''}${J.course ? ` Counts towards ${esc(COURSES[J.course].name)}.` : ''}</p>
        <div class="picks">${mine ? '<span class="note ok">Your job</span>' : pick(`Put in for it${start ? ` (${esc(J.ranks[start].toLowerCase())})` : ''}`, 'g2Apply', k, why)}</div></div>`;
    }
    const now = L.gaolCourse();
    body += `<h3>The education wing</h3><p class="fine">${now ? `Studying for the ${esc(COURSES[now].name)}: ${Math.floor(s.gaol.study)} of ${L.gaolSittings()} sittings.` : 'Nothing on the go.'} The free courses are taught here; the others come by post, for half the college’s fee. Changing course starts the new one from scratch.</p>`;
    body += actRow(L.look('gStudy'));
    for (const id of ['firstaid', 'culinary', 'trade', 'skipper', ...POST]) {
      const c = COURSES[id], why = L.can('g2Course', id), had = L.hasEdu(id), on = now === id, fee = L.g2CourseFee(id);
      body += `<div class="item g2-course${on ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${c.icon}</span><div><b>${esc(c.name)}</b><small>${POST.includes(id) ? `By post · ${L.g2Sittings(id)} sittings` : 'The education wing · 5 sittings'}${c.degree ? ' · a degree' : ''}</small></div></div>
        <div class="picks">${had ? '<span class="note ok">Passed</span>' : on ? '<span class="note ok">Studying now</span>' : pick(`Study for it${fee ? ` ${chip('cash', money(fee))}` : ''}`, 'g2Course', id, why)}</div></div>`;
    }
    return { icon: '📋', title: 'Work and study', sub: 'The labour board meets on Mondays', body };
  }

  // ---- the landing ----
  function g2Landing() {
    const L = kit.life, C = cur(L);
    if (!C) return null;
    const s = L.s, G = s.gaol2;
    let body = '<p class="lead">Who you share B wing with. They remember what you do, this sentence and the next, and some of them outside.</p>';
    const cm = s.gaol.mate && s.heists ? s.heists.lag.mates[s.gaol.mate] : null;
    if (cm) body += `<div class="line"><span>🛏️ Your cellmate: ${esc(L.g2MateName(s.gaol.mate) === 'your cellmate' ? 'a quiet man' : L.g2MateName(s.gaol.mate))}</span><b>${esc(L.g2Word(cm.bond - 30))}</b></div>`;
    if (G.feud) body += `<p class="fine">🎱 The pool table: ${{ bay: 'you sit with the Bay lads', kett: 'you sit with the Kettleby lot', peace: 'there is a rota now, in your handwriting', broker: 'both sides talk to you', out: 'you keep out of it' }[G.feud]}.</p>`;
    const list = C.here.filter((id) => !(G.folk[id] && G.folk[id].gone));
    if (!list.length) body += '<div class="item"><p class="sub">Nobody you know. The faces change; give it a season or two.</p></div>';
    for (const id of list) {
      const k = LANDING[id], p = G.folk[id], fav = L.g2Favour(id), want = L.g2Wants(id);
      body += `<div class="item g2-man-row"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${esc(k.name)}</b><small>${esc(p ? k.blurb : 'You have not really spoken yet.')}</small></div></div>
        ${p ? `${bar('🤝', esc(L.g2Word(p.v)), (p.v + 100) / 2, p.v < -8 ? 'var(--bad)' : 'var(--teal)')}` : ''}
        ${want ? `<p class="fine">Wants: ${esc(want[0].toLowerCase() + want.slice(1))}.</p>` : ''}
        <div class="picks">${pick(`Spend an hour with ${esc(k.first)} ${chip('time', '⏱ 1')}`, 'g2Sit', id, L.can('g2Sit', id))}${fav ? pick(`${esc(fav.title)} ${chip('time', '⏱ 1')}`, 'g2Help', id, L.can('g2Help', id)) : ''}</div></div>`;
    }
    const gone = Object.keys(G.folk).filter((id) => !list.includes(id) && G.folk[id].met != null);
    if (gone.length) {
      body += '<h3>Not on the landing now</h3>';
      for (const id of gone) {
        const p = G.folk[id], k = LANDING[id];
        const where = p.gone === 'dead' ? 'Died inside' : p.gone === 'home' ? 'Gone home' : p.gone === 'free' ? 'Freed on appeal' : p.f.moved ? 'Moved on' : 'Out';
        body += `<div class="line"><span>${k.icon} ${esc(k.name)}</span><b>${where}${p.pid && L.person(p.pid) ? ', a friend outside' : ''}</b></div>`;
      }
    }
    return { icon: '👥', title: 'B wing', sub: 'Who is who on the landing', body };
  }

  // ---- letters and visits ----
  function g2Post() {
    const L = kit.life, C = cur(L);
    if (!C) return null;
    const s = L.s;
    let body = '<p class="lead">Every season inside, the people outside drift a little further off. A letter keeps them; a visit keeps them better, if they come. On a visit you can ask for what the board will want to see.</p>';
    body += actRow(L.look('gLetters'));
    if (C.vo) { const p = L.person(C.vo.p); if (p) body += `<p class="fine">🪑 A visiting order is in the post to ${esc(p.name)}.</p>`; }
    const people = s.people.filter((p) => ['partner', 'spouse', 'parent', 'child', 'sibling', 'grandchild', 'friend'].includes(p.kind)).sort((a, b) => b.bond - a.bond);
    if (!people.length) body += '<div class="item"><p class="sub">There is nobody to write to. The chaplain says that is when it matters most to start.</p></div>';
    for (const p of people) {
      const w = L.can('g2Write', p.id), v = L.can('g2VO', p.id);
      body += `<div class="item"><div class="item-top"><span class="g2-face">${kit.face(p.look, p.age, 60, p.sex)}</span><div><b>${esc(p.name)}</b><small>${kindWord[p.kind] || ''}${C.vis[p.id] ? ` · visited ${C.vis[p.id]} time${C.vis[p.id] === 1 ? '' : 's'}` : ''}</small></div></div>${bar('💛', 'Close', p.bond)}
        <div class="picks">${pick(`Write ${chip('time', '⏱ 1')}`, 'g2Write', p.id, w)}${v === 'Not somebody who can visit.' ? '' : pick('Send a visiting order', 'g2VO', p.id, v)}</div></div>`;
    }
    return { icon: '📮', title: 'Letters and visits', sub: 'Two letters a season; one visiting order', body };
  }

  // ---- the plan for outside ----
  function g2Plan() {
    const L = kit.life, C = cur(L);
    if (!C) return null;
    const s = L.s, P = C.plan, board = L.g2BoardIn();
    let body = `<p class="lead">${board ? `The parole board sits ${board === 1 ? 'next season' : `in ${board} seasons`}.` : s.gaol.total >= 3 ? 'The parole board will not sit again before you are out.' : 'A sentence this short does not go before the board.'} It reads your record, and asks what you will do when you are out. What you arrange here holds good whether you leave on parole or when your time is done.</p>`;
    if (board || s.gaol.total >= 3) body += `<div class="facts"><span class="${L.paroleOdds() >= 0.5 ? 'up' : 'down'}">About ${pct(L.paroleOdds())} they would let you go, as things stand</span></div>`;
    const homeTxt = s.owned && !P.home ? 'Your own home, waiting for you.' : L.g2HomeOk() ? `${P.home.txt[0].toUpperCase()}${P.home.txt.slice(1)}.` : null;
    body += `<h3>Somewhere to live</h3><div class="item${homeTxt ? ' mine' : ''}"><p class="sub">${homeTxt ? `✓ ${esc(homeTxt)}` : 'Nothing yet. Without it, you walk out to a bunk at the Seagull Hostel, and whatever you rented is gone.'}</p>${homeTxt ? '' : '<p class="fine">Ask your partner, or family, on a visit; or the chaplain, who knows a trust with rooms.</p>'}</div>`;
    body += `<h3>Work</h3><div class="item${P.work ? ' mine' : ''}"><p class="sub">${P.work ? `✓ A start at ${esc(P.work.at)}${P.work.who ? `, through ${esc(P.work.who)}` : ''}.` : 'Nothing lined up.'}</p>${P.work ? '' : '<p class="fine">Rise a place in your prison job, and the boss may put a word in; or ask somebody with a job, on a visit.</p>'}</div>`;
    body += `<h3>Somebody to speak for you</h3><div class="item${P.vouch ? ' mine' : ''}"><p class="sub">${P.vouch ? `✓ ${esc(P.vouch.name)}.` : 'Nobody yet.'}</p>${P.vouch ? '' : '<p class="fine">Ask somebody close, on a visit; or the chaplain, once you have been going a while.</p>'}</div>`;
    const j = C.job;
    body += `<h3>What else the board reads</h3>${rec(C.rec)}<p class="fine">${Object.values(MARKS).map(([w, c]) => `<i class="g2-key ${c}"></i>${w}`).join(' ')}</p>
      <div class="needs">${need(!!j && j.r >= 1, j ? `${L.g2JobTitle()}, ${JOBS[j.k].name.toLowerCase()}` : 'Work inside')}${need(C.learnt.length > 0, C.learnt.length ? `${COURSES[C.learnt[0]].name}, passed inside` : 'A course passed inside')}${need(C.change >= 50, `Mrs Abernethy’s group (${Math.min(100, Math.round(C.change))}%)`)}${need(!!(C.f.stmt || C.f.report), C.f.report ? 'A report from Mr Hobbs' : C.f.stmt ? 'A statement, written with the chaplain' : 'A statement or a report')}</div>
      <p class="fine">Trouble in the last year counts against you: a fight, a find, the block.</p>`;
    return { icon: '🗺️', title: 'Your plan for outside', sub: 'What the board wants to see', body };
  }

  // ---- the wall ----
  function g2Wall() {
    const L = kit.life, C = cur(L);
    if (!C) return null;
    const s = L.s, e = C.esc, q = s.gaol;
    let body = `<p class="lead">A way out is a plan, not a night. The route takes digging; tools, the guards’ habits and somebody to go with make the night likelier; being suspected makes everything harder. Caught, it is four more seasons, the block, and your job.</p>
      <div class="facts"><span class="${L.breakOdds() >= 0.5 ? 'up' : 'down'}">About ${pct(L.breakOdds())} on the night, as things stand</span>${s.wx === 'fog' ? '<span class="up">Fog tonight: good for it</span>' : s.wx === 'storm' ? '<span class="up">A storm tonight: it covers the noise</span>' : ''}</div>
      ${bar('👁️', 'Suspected', e.seen, e.seen >= 40 ? 'var(--bad)' : 'var(--sun)')}
      <div class="line"><span>🥄 The route</span><b>${dots(q.dig, 4)}</b></div>
      <div class="line"><span>🪚 Tools</span><b>${dots(e.tools, 2)}</b></div>
      <div class="line"><span>🔭 The guards’ habits</span><b>${dots(e.habits, 2)}</b></div>
      <div class="line"><span>🤝 Going with you</span><b>${e.mate ? esc(L.g2MateName()) : 'Nobody'}</b></div>`;
    body += '<h3>Getting ready</h3>';
    for (const id of ['gDig', 'g2Tools', 'g2Watch', 'gBreak']) { const a = L.look(id); if (!a.why || a.why !== 'Not just now.') body += actRow(a); }
    if (!e.mate) {
      body += '<h3>Somebody to go with</h3><p class="fine">Somebody who knows walls, or is strong, or keeps a good lookout. Ask somebody who does not trust you, and they may tell Mr Hobbs instead.</p><div class="picks">';
      const cm = s.gaol.mate;
      if (cm) body += pick(`Ask ${esc(L.g2MateName(cm))}`, 'g2Ask', 'mate', L.can('g2Ask', 'mate'));
      for (const id of C.here) if (s.gaol2.folk[id]) body += pick(`Ask ${esc(LANDING[id].first)}`, 'g2Ask', id, L.can('g2Ask', id));
      body += '</div>';
    }
    return { icon: '🌙', title: 'The way over the wall', sub: 'Starling Gaol, B wing', body };
  }

  // ---- the Me tab ----
  function me(L) {
    const s = L.s, G = s.gaol2;
    if (!G) return '';
    if (s.gaol && G.cur) return `<div class="box g2-box"><h3>This stretch</h3>${gaolInner(L)}<div class="g2-btns">${btn('g2Plan', '🗺️ Your plan')}${btn('g2Landing', '👥 The landing')}</div></div>`;
    if (s.run && G.run) {
      const R = G.run, where = { kin: 'at home, where they will look first', caves: 'in a cave under Gorse Head', sal: 'in Sal’s boat shed', room: 'in a room in Kettleby, under another name' }[R.hid] || 'wherever you can';
      return `<div class="box warn"><h3>On the run</h3><p class="sub">${R.n} season${R.n === 1 ? '' : 's'} out. Sleeping ${esc(where)}.${R.mate ? ` ${esc(L.g2MateName(R.mate))} came over the wall with you.` : ''}</p></div>`;
    }
    if (!G.n.terms) return '';
    const friends = Object.keys(G.folk).filter((id) => G.folk[id].pid && L.person(G.folk[id].pid)).map((id) => LANDING[id].first);
    const best = Object.entries(G.best).sort((a, b) => b[1] - a[1])[0];
    const bits = [`${G.n.seasons} season${G.n.seasons === 1 ? '' : 's'} in Starling Gaol, over ${G.n.terms} sentence${G.n.terms === 1 ? '' : 's'}`];
    if (best) bits.push(`once ${JOBS[best[0]].ranks[best[1]].toLowerCase()} in ${JOBS[best[0]].name.toLowerCase()}`);
    if (G.n.letters) bits.push(`${G.n.letters} letter${G.n.letters === 1 ? '' : 's'} home`);
    return `<div class="box"><h3>Starling Gaol</h3><p class="sub">${esc(bits.join('; '))}.${friends.length ? ` Friends from the landing: ${esc(friends.join(', '))}.` : ''}</p></div>`;
  }

  return {
    sheets: { g2Jobs, g2Landing, g2Post, g2Plan, g2Wall },
    gaol: gaolBox,
    me,
    act: {
      // The hotplate is played by hand first.
      g2Plate() {
        const L = kit.life, why = L.can('g2Plate');
        if (why) { kit.sfx('nope'); kit.toast(why); return; }
        const j = L.g2Job();
        kit.playMini({ id: 'g2plate', title: 'The hotplate', icon: '🍛', level: j.r, ease: L.s.st.craft / 100, skill: 'Craft' }, (score) => { if (score != null) kit.doAct('g2Plate', score); });
      },
    },
    css: `
.g2-box { display: grid; gap: 8px; }
.g2-job { display: flex; align-items: center; gap: 10px; }
.g2-job b { display: block; font-size: 15px; }
.g2-job small { display: block; font-size: 12.5px; color: var(--muted); font-weight: 700; line-height: 1.3; }
.g2-rec { display: flex; flex-wrap: wrap; gap: 3px; }
.g2-rec i, .g2-key { display: inline-block; width: 13px; height: 13px; border-radius: 3px; background: #cfcabb; }
.g2-key { margin: 0 4px 0 8px; vertical-align: -2px; }
.g2-rec i.w, .g2-key.w { background: #3aa391; } .g2-rec i.s, .g2-key.s { background: #5b8fd6; } .g2-rec i.q, .g2-key.q { background: #cfcabb; }
.g2-rec i.t, .g2-key.t { background: #e0803a; } .g2-rec i.b, .g2-key.b { background: #3d3f46; }
.g2-dots { display: inline-flex; gap: 4px; }
.g2-dots i { width: 11px; height: 11px; border-radius: 50%; background: #d8d2c2; }
.g2-dots i.on { background: var(--teal); }
.g2-btns { display: flex; gap: 8px; margin-top: 10px; }
.g2-btns .btn { flex: 1; padding: 10px 8px; font-size: 14px; }
.g2-face { flex: none; width: 44px; height: 44px; border-radius: 50%; overflow: hidden; background: #f1ece0; }
.g2-face svg { width: 100%; height: 100%; display: block; }

/* the hotplate */
.g2-plate { display: grid; gap: 10px; width: min(360px, 100%); }
.g2-q { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 26px; font-size: 17px; letter-spacing: -4px; }
.g2-q small { font-size: 13px; font-weight: 800; color: var(--muted); letter-spacing: 0; }
.g2-man { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 18px; background: #fff; box-shadow: 0 2px 0 var(--line); min-height: 92px; }
.g2-man.yes { box-shadow: 0 0 0 3px #49c27c; } .g2-man.no { box-shadow: 0 0 0 3px #d8433a; }
.g2-man .g2-face { width: 72px; height: 72px; }
.g2-man b { font-size: 16px; font-weight: 900; }
.g2-man p { margin: 2px 0 0; font-size: 15px; font-weight: 800; line-height: 1.3; }
.g2-slip { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; padding: 8px; border-radius: 12px; background: #fdf8e8; border: 2px dashed #d9cfae; }
.g2-slip span { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 999px; background: #fff; font-size: 14px; font-weight: 800; color: #6b6048; }
.g2-slip span i { font-style: normal; font-size: 19px; }
.g2-slip span.on { background: #d9f2e3; color: #1c5a36; }
.g2-pans { display: grid; gap: 9px; }
.g2-pans4 { grid-template-columns: repeat(2, 1fr); } .g2-pans6 { grid-template-columns: repeat(3, 1fr); }
.g2-pans button { display: grid; justify-items: center; gap: 2px; min-height: 70px; padding: 8px 4px; border-radius: 16px; background: #c9ccd3; color: #2c2f36; box-shadow: 0 4px 0 #9a9ea8; }
.g2-pans button i { font-style: normal; font-size: 30px; line-height: 1.1; }
.g2-pans button small { font-size: 13px; font-weight: 900; }
.g2-pans button:active { transform: translateY(3px); box-shadow: none; }
`,
  };
}
