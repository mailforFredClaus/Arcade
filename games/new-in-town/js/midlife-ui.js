// New in Town: the middle of a life on screen (the rules are in midlife.js). A box on the Me
// tab from forty or so: how much of the same week there has been, who is close and who is
// drifting for want of your time, and what you have taken on; a sheet of the things you could
// take on (the ward, a year out, a trust in your name, and whatever you are seeing through);
// and on each person's sheet, when you last had time with them.

import { CAUSES, REST, CLOSE } from './midlife.js';

export default function (kit) {
  const { esc, money, actRow, pick, chip } = kit;
  const L = () => kit.life;
  const ago = (n) => (n <= 0 ? 'this season' : n === 1 ? 'last season' : n < 8 ? `${n} seasons ago` : `${Math.floor(n / 4)} years ago`);
  const bar = (icon, label, v, of, word) => `<div class="skill"><i>${icon}</i><span>${esc(label)}</span><span class="bar"><span style="width:${Math.round((v / of) * 100)}%"></span></span><b>${esc(word)}</b></div>`;
  const busyWith = (life) => {
    const m = life.s.mid;
    return !!m && (life.midSeat() || life.midAway() || !!m.trust || m.lent.length > 0 || !!m.plan);
  };

  // ---- what you could take on ----
  function midPlans() {
    const life = L(), s = life.s, m = s.mid;
    let body = '<p class="lead">The middle of a life wants something new now and then, or the weeks start to look alike. Each of these costs money or time, or both, and any of them can go wrong.</p>';
    // Seeing a wobble through.
    if (m.plan) {
      body += `<h3>${m.plan.id === 'run' ? 'The Coast Marathon' : 'The band'}</h3>`;
      if (m.plan.id === 'run') body += m.plan.n < 4 ? actRow(life.look('midTrain')) : '<div class="item"><p class="sub">You are ready. The race is in the summer.</p></div>';
      else body += m.plan.n < 4 ? actRow(life.look('midRehearse')) : '<div class="item"><p class="sub">The landlord of the Gull has given you a Friday.</p></div>';
    }
    // The ward.
    body += '<h3>The harbour ward</h3>';
    if (life.midSeat()) body += actRow(life.look('midCouncil'));
    else body += actRow(life.look('midStand'));
    body += `<p class="fine">A councillor sits on Thursdays (a block of time a season; miss three in a row and the Gazette notices), votes on what the town argues about, and is paid ${money(800)} a season. The ward remembers how you voted when you stand again.</p>`;
    // A year out.
    if (s.job || life.midAway()) {
      body += '<h3>A year out</h3>';
      if (life.midAway()) body += `<div class="item mine"><div class="item-top"><span class="act-ico">🧳</span><div><b>On a year out, ${esc({ travel: 'travelling', learn: 'learning something new', home: 'at home' }[m.sab.how])}</b><small>Back at work in ${m.sab.until - s.t} season${m.sab.until - s.t === 1 ? '' : 's'}. No pay meanwhile.</small></div></div></div>`;
      else {
        const why = life.midYearWhy();
        body += `<div class="item"><p class="sub">A year away from work, with your job held for you and no pay coming in. ${why ? esc(why) : 'What would you do with it?'}</p><div class="picks">${[['travel', '✈️ See the world'], ['learn', '📚 Learn something'], ['home', '🏡 Be at home']].map(([how, label]) => { const c = life.midYearCost(how); return pick(`${label}${c ? ` ${chip('cash', kit.cashShort(c))}` : ''}`, 'midYearOut', how, life.can('midYearOut', how)); }).join('')}</div></div>`;
      }
    }
    // Something in your name.
    body += '<h3>In your name</h3>';
    if (m.trust) {
      const t = m.trust, k = CAUSES[t.cause];
      body += `<div class="item mine"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${esc(t.name)}</b><small>For ${esc(k.name)}, ${t.n ? `for ${t.n} year${t.n === 1 ? '' : 's'}` : 'from the spring'}. ${money(t.fund)} left in the fund, of ${money(t.start)}.</small></div></div>
        ${bar('🪙', 'The fund', t.fund, Math.max(t.fund, t.start), money(t.fund))}
        <p class="fine">Each year it spends a little of its fund on what it is for. Chair the trustees now and then: a trust nobody watches is a temptation to its treasurer.</p></div>${actRow(life.look('midChair'))}${actRow(life.look('midTopUp'))}`;
    } else {
      const cost = life.midTrustCost();
      body += `<div class="item"><p class="sub">${esc(life.midTrustName())}, endowed with ${money(cost)}: a fund that spends a little each year on something the town needs, with your name on it for as long as the money lasts. For:</p><div class="picks">${Object.entries(CAUSES).map(([id, c]) => pick(`${c.icon} ${esc(c.short)}`, 'midFound', id, life.can('midFound', id))).join('')}</div></div>`;
    }
    return { icon: '🧭', title: 'What you could take on', sub: `The same again: ${life.midRutWord().toLowerCase()}`, body };
  }

  return {
    sheets: { midPlans },
    me(life) {
      const s = life.s, m = s.mid;
      if (!m || (s.age < 38 && !busyWith(life)) || (s.age >= 70 && !busyWith(life))) return '';
      const rut = life.midRut();
      let out = `<div class="box mid-me"><h3>The middle years</h3>`;
      if (s.age >= 40 && s.age < 66) out += bar('🔁', 'The same again', rut, 8, life.midRutWord()) + `<p class="fine">${rut >= 3 ? 'A year with nothing new in it wears at you, a little more each year. Something new helps, big enough to go in the journal.' : 'A year with nothing new in it wears at you. So far, life keeps changing.'}</p>`;
      // Who is close, and who is drifting for want of your time.
      const close = life.midClose(), drift = s.people.filter((p) => life.midDrifting(p)).sort((a, b) => b.bond - a.bond).slice(0, 6);
      out += `<div class="line"><span>🫂 People who really know you</span><b>${close.length}</b></div>`;
      if (drift.length) out += `<p class="fine">Drifting for want of your time: ${drift.map((p) => `<button class="mid-who" data-do="person" data-id="${p.id}">${esc(p.name.split(' ')[0])}</button>`).join(', ')}. A present or a party keeps people warm; only time together keeps them close.</p>`;
      if (life.midSeat()) out += `<div class="line"><span>🏛️ Councillor, the harbour ward</span><b>${m.seat.until - s.t} season${m.seat.until - s.t === 1 ? '' : 's'} left</b></div>`;
      if (life.midAway()) out += `<div class="line"><span>🧳 A year out</span><b>back in ${m.sab.until - s.t}</b></div>`;
      if (m.trust) out += `<div class="line"><span>${CAUSES[m.trust.cause].icon} ${esc(m.trust.name)}</span><b>${money(m.trust.fund)}</b></div>`;
      for (const l of m.lent) { const p = life.person(l.p); if (p) out += `<div class="line"><span>📒 ${esc(p.name.split(' ')[0])} owes you, for the house</span><b>${money(l.left)}</b></div>`; }
      if (m.plan) out += `<div class="line"><span>${m.plan.id === 'run' ? '🏃 Training for the Coast Marathon' : '🎸 Rehearsing with the band'}</span><b>${Math.min(4, m.plan.n)} of 4</b></div>`;
      out += '<div class="picks"><button class="pick quiet" data-do="open" data-kind="midPlans">🧭 What you could take on</button></div></div>';
      return out;
    },
    person(life, p) {
      const m = life.s.mid;
      if (!m || REST[p.kind] == null || (p.kind === 'child' && p.age < 18)) return '';
      const n = life.midSince(p), drifting = life.midDrifting(p);
      return `<p class="fine mid-last">${p.bond >= CLOSE ? '🫂 Close. ' : ''}Last time together: ${ago(n)}.${drifting ? ' Drifting for want of your time: a present keeps a friendship warm, but only time together keeps anybody close.' : ''}</p>`;
    },
    css: `
.mid-me { min-width: 0; }
.mid-who { font: inherit; font-weight: 800; color: var(--teal-d); background: none; border: 0; padding: 0; min-height: 32px; text-decoration: underline; text-underline-offset: 3px; }
.mid-last { margin: 6px 0 0; }
`,
  };
}
