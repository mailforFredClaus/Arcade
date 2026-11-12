// New in Town: the low road with a plot, on screen. The planning sheet for
// a job (what you know, the crew, the way in and the way out, and the
// night), the detective, Sal and Nan Carne's lot in the Low road box on the
// Me tab, and a mark on the map wherever the job can be cased today. When
// you open the vault yourself, the safe is played by hand first (the crew's
// game in mini.js). The rules are in heists.js.

import { TARGETS, ROLES, RIDES } from './heists.js';
import { PLACES } from './data.js';

export default function (kit) {
  const { esc, money, cashShort, pick, chip } = kit;
  const dots = (n, of = 3) => `<span class="hp-dots">${Array.from({ length: of }, (_, i) => `<i class="${i < Math.round(n) ? 'on' : ''}"></i>`).join('')}</span>`;
  const pct = (p) => `${Math.round(p * 100)}%`;
  const bar = (icon, label, n, colour) => `<div class="skill"><i>${icon}</i><span>${label}</span><span class="bar"><span style="width:${Math.round(n)}%${colour ? `;background:${colour}` : ''}"></span></span><b>${Math.round(n)}</b></div>`;
  const lowFirst = (t) => t[0].toLowerCase() + t.slice(1);
  const bondWord = (b) => (b >= 80 ? 'would do anything for you' : b >= 60 ? 'very close' : b >= 40 ? 'close' : b >= 20 ? 'friendly' : 'hardly knows you');

  // ---- the planning sheet ----
  function heistPlan() {
    const L = kit.life, s = L.s, H = s.heists, p = H.plan;
    if (!p) return pickSheet(L);
    const T = TARGETS[p.k], w = T.ways[p.way];
    let body = `<div class="item mine"><div class="item-top"><span class="act-ico">${T.icon}</span><div><b>${esc(T.name)}</b><small>${esc(T.blurb)}</small></div></div>
      <div class="facts"><span>Worth ${cashShort(T.haul[0])} to ${cashShort(T.haul[1])}</span><span>Planning for ${s.t - p.t} season${s.t - p.t === 1 ? '' : 's'}</span>${p.way && p.ride ? `<span class="${L.heistChance() >= 0.5 ? 'up' : 'down'}">About ${pct(L.heistChance())} you come home with it</span>` : ''}</div>
      ${bar('👀', 'Noticed', Math.min(100, p.noticed), p.noticed >= 60 ? 'var(--bad)' : 'var(--sun)')}
      <p class="fine">Every visit to case the job gets you noticed a little; at a hundred, the place tightens up. It fades with time. The detective’s file on you counts against every part of the night.</p></div>`;

    // What you know.
    body += '<h3>What you know</h3>';
    T.facts.forEach((f, i) => {
      const k = p.know[f.id] || 0, a = L.look(`heistsCase${i}`), why = a.why;
      const said = k ? f.lines[0][0] + (k >= 2 ? ` ${f.lines[1][0]}` : '') : 'Nothing yet.';
      body += `<div class="hp-fact${k >= 2 ? ' known' : ''}"><div class="hp-row"><i>${f.icon}</i><b>${esc(f.name)}</b>${dots(k, 2)}</div>
        <p class="${k ? 'hp-said' : 'fine'}">${esc(said)}</p>
        ${k < 2 ? `<p class="fine">📍 ${esc(PLACES[f.place].name)}: ${esc(f.title)}${why && why !== 'You know all there is to know.' ? ` (${esc(why === 'Once a season.' ? 'done this season' : why)})` : ''}. Helps ${[].concat(f.stage).map((st) => ({ in: 'getting in', take: 'the take', out: 'the getaway' })[st]).join(' and ')}.</p>` : ''}</div>`;
    });

    // How: the way in.
    body += '<h3>The plan</h3>';
    for (const [id, v] of Object.entries(T.ways)) {
      const on = p.way === id, why = on ? null : L.can('heistsSet', { way: id });
      const needs = v.need.map((r) => `<i class="need${p.crew[r] ? ' ok' : ''}">${p.crew[r] ? '✓' : '○'} ${ROLES[r].name}</i>`).join('');
      const extra = id === 'drain' ? `<i class="need${p.dug >= 3 ? ' ok' : ''}">${p.dug >= 3 ? '✓' : '○'} Dig the drain (${p.dug} of 3, at the harbour)</i>` : id === 'copy' ? `<i class="need${p.copy >= 2 ? ' ok' : ''}">${p.copy >= 2 ? '✓' : '○'} Make the copy (${p.copy} of 2, at the studios)</i>` : '';
      body += `<div class="item hp-way${on ? ' mine' : ''}"><b>${esc(v.name)}</b><small>${esc(v.blurb)}${v.loud ? ' A loud way: noisy from the start, and a worse charge if it goes wrong.' : ''}</small>
        <div class="needs">${needs}${extra}${v.stat ? `<i class="need">${v.stat === 'charm' ? '😊 Charm' : v.stat === 'smarts' ? '🧠 Smarts' : '💪 Fitness'} counts</i>` : ''}</div>
        <div class="picks">${on ? '<span class="note ok">This is the plan</span>' : pick('Do it this way', 'heistsSet', { way: id }, why)}</div></div>`;
    }

    // Who.
    // (Boss of the Bay: the lads are yours, and nobody takes a cut on top.)
    const yours = L.salYours(), theLads = yours ? 'your lads' : 'Sal’s lads';
    body += `<h3>The crew</h3><p class="fine">Each friend takes 15% of the haul (whoever is inside, 20%); each of ${theLads} 10%${yours ? '' : ', and Sal 20% on top'}. The closer a friend, the less likely to lose their nerve, or to talk.</p>`;
    for (const r of L.heistRoles()) {
      const R = ROLES[r], c = p.crew[r];
      let who, picks = '';
      if (c) {
        const q = c.kind === 'friend' ? L.person(c.p) : null, sk = L.heistSkill(r, c.kind === 'friend' ? c.p : c.kind);
        who = c.kind === 'me' ? `You, yourself ${dots(sk)}` : c.kind === 'lad' ? `One of ${theLads} ${dots(sk)}` : q ? `${esc(q.name)} ${dots(sk)}<small>${esc(L.jobOf(q) || '')}${L.jobOf(q) ? ', ' : ''}${bondWord(q.bond)}</small>` : 'Nobody';
        picks = pick('Take them off', 'heistsOff', r, null, 'quiet');
      } else {
        who = '<span class="note">Nobody yet</span>';
        if (r !== 'inside') {
          const me = L.heistSkill(r, 'me'), selfWhy = L.can('heistsSelf', r), ladWhy = L.can('heistsLad', r);
          picks += pick(`Do it yourself ${dots(me)}`, 'heistsSelf', r, selfWhy);
          picks += pick(`One of ${theLads} ${dots(1.5)}`, 'heistsLad', r, ladWhy);
        }
        const asked = L.heistCandidates(r, 3);
        for (const q of asked) picks += pick(`Ask ${esc(q.name.split(' ')[0])} ${dots(L.heistSkill(r, q))}`, 'heistsAsk', { r, p: q.id }, L.can('heistsAsk', { r, p: q.id }));
        if (r === 'inside' && !asked.length) picks += '<span class="note">You know nobody who works there.</span>';
      }
      body += `<div class="item hp-role"><div class="hp-row"><i>${R.icon}</i><b>${R.name}</b><span class="hp-who">${who}</span></div><p class="fine">${R.blurb}: helps ${R.helps}.</p><div class="picks">${picks}</div></div>`;
    }

    // The way out.
    body += '<h3>The getaway</h3><div class="picks hp-rides">';
    for (const id of T.rides) {
      const v = RIDES[id], on = p.ride === id;
      const why = on ? null : L.can('heistsSet', { ride: id }) || (id === 'own' && !(L.motorUsable && L.motorUsable()) ? 'You have no car you can drive.' : id === 'boat' && !s.items.boat ? 'You have no boat.' : null);
      body += on ? `<span class="pick hp-on">${v.icon} ${esc(v.name)}</span>` : pick(`${v.icon} ${esc(v.name)}${v.cost ? ` ${chip('cash', cashShort(v.cost))}` : ''}`, 'heistsSet', { ride: id }, why);
    }
    body += `</div><p class="fine">${p.ride ? esc(RIDES[p.ride].blurb) : 'Your own car is quick but in your name; a car from Sal is cleaner and costs; a boat needs calm water; on foot is free and slow, and you carry less.'}</p>`;

    // The night.
    const ready = L.heistReady(), go = L.look('heistsGo');
    const crew = L.heistCrew(), lads = crew.filter((c) => c.kind === 'lad').length;
    const with_ = [...crew.filter((c) => c.kind === 'friend').map((c) => c.who.name.split(' ')[0]), lads ? `${['', 'one', 'two', 'three'][lads]} of ${theLads}` : ''].filter(Boolean);
    const said = with_.length < 2 ? with_.join('') : `${with_.slice(0, -1).join(', ')} and ${with_[with_.length - 1]}`;
    body += `<div class="item hp-go">
      <p class="lead">${ready ? esc(ready) : `Everything is ready: ${esc(lowFirst(w.name))}, with ${esc(said || 'nobody but you')}, and away by ${esc(lowFirst(RIDES[p.ride].name))}.`}</p>
      ${ready ? '' : `<div class="facts"><span>Getting in: ${pct(L.heistStage('in'))}</span><span>The take: ${pct(L.heistStage('take'))}</span><span>The getaway: ${pct(L.heistStage('out'))}</span></div>`}
      <div class="picks">${pick(`Do it tonight ${chip('time', '⏱ 3')}`, 'heistsGo', undefined, go.why)}${pick('Call it off', 'heistsDrop', undefined, null, 'quiet')}</div></div>`;
    return { icon: T.icon, title: 'The job', sub: T.name, body };
  }

  // No job yet: what there is.
  function pickSheet(L) {
    const s = L.s, H = s.heists;
    let body = '<p class="lead">A proper job is planned, not done on a whim. Pick a target, find out all you can about it at the right places, get a crew together, choose a way in and a way out, and then pick your night. The haul has to be washed before it can be spent, and spending it carelessly is how most people are caught.</p>';
    for (const k of L.heistList()) {
      const T = TARGETS[k], why = L.heistWhy(k);
      body += `<div class="item"><div class="item-top"><span class="act-ico">${T.icon}</span><div><b>${esc(T.name)}</b><small>${esc(T.blurb)}</small></div></div>
        <div class="facts"><span>Worth ${cashShort(T.haul[0])} to ${cashShort(T.haul[1])}</span><span>${T.min} crimes behind you</span>${H.after[k] != null ? `<span class="down">Hit ${s.t - H.after[k]} season${s.t - H.after[k] === 1 ? '' : 's'} ago</span>` : ''}</div>
        <div class="picks">${why ? `<span class="note">${esc(why)}</span>` : pick('Start planning', 'heistsPick', k)}</div></div>`;
    }
    body += pastJobs(L);
    return { icon: '🗺️', title: 'A proper job', sub: H.jobs.length ? `${H.jobs.length} done so far` : 'Nine parts looking, one part doing', body };
  }
  function pastJobs(L) {
    const H = L.s.heists;
    if (!H.jobs.length) return '';
    return `<h3>Jobs done</h3>${H.jobs.slice().reverse().map((j) => `<div class="line"><span>${TARGETS[j.k].icon} ${esc(TARGETS[j.k].name)}, year ${Math.floor(j.t / 4) + 1}</span><b class="${j.how === 'bust' ? 'down' : 'up'}">${j.how === 'bust' ? 'Caught' : `${j.how === 'clean' ? 'Clean' : 'Messy'}: ${cashShort(j.got)}`}</b></div>`).join('')}`;
  }

  // ---- the Low road box on the Me tab ----
  function lowRoad(L) {
    const s = L.s, H = s.heists, d = H.det, r = H.rival;
    const line = (label, v, cls = '') => `<div class="line ${cls}"><span>${label}</span><b>${v}</b></div>`;
    let out = '';
    if (d.met != null || d.file >= 8) {
      out += line(`🕵️ ${esc(L.lawWho(true))}`, esc(L.lawFileWord()));
      out += bar('📁', 'The file', d.file, d.file >= 60 ? 'var(--bad)' : d.file >= 35 ? 'var(--coral)' : 'var(--sun)');
      if (L.lawBondWord()) out += line('🫖 Between you', esc(L.lawBondWord()));
      out += `<p class="fine">${d.bent != null ? `On your payroll, at ${money(1500 * (d.rank + 1))} a season, for as long as nobody notices.` : 'The file grows with every crime and every arrest, and thins in quiet years. It makes every crime riskier and a lawyer less use, and a thick one means a long stretch.'}</p>`;
    }
    if (s.n.crimes >= 3 || (s.job && s.job.c === 'crew')) out += line('🦊 Sal', { inside: 'Inside, for now', spain: 'Retired to Spain' }[L.salWhere()] || esc(L.salWord()));
    if (r.stage >= 1) out += line('🏴 Nan Carne’s lot', { truce: 'A truce', gone: 'Gone back to Kettleby', spain: 'Gone back to Kettleby', sal: 'Own the pier', yours: 'The pier is yours now' }[r.end] || (r.stage >= 3 ? 'At war with Sal' : r.side === 'nan' ? 'You are on their payroll' : 'Moving in on Sal’s patch'));
    if (H.hot > 0) out += line('💰 Hot money', money(H.hot), 'down') + `<p class="fine">Hidden ${esc(L.heistHotWord())}. It needs washing before it can be spent: through Sal, the Lucky Gull’s cage, a business of your own, property, or the bank a little at a time.</p>`;
    if (H.washed) out += line('🧼 Washed so far', money(H.washed));
    if (H.lag.n) {
      const q = s.gaol, m = q && q.mate;
      out += line('⛓️ Sentences served', `${H.lag.n}${H.lag.n > 1 ? '; they remember you inside' : ''}`);
      if (m) out += line('🛏️ Your cellmate', esc({ bernard: '“Books” Bernard', tiny: 'Tiny Doyle', kev: 'Kev Rudd', moss: 'Old Moss', sal: 'Sal', danny: 'Danny Carne' }[m] || 'Somebody quiet'));
    }
    if (H.plan) out += `<button class="btn btn-soft wide hp-btn" data-do="open" data-kind="heistPlan">${TARGETS[H.plan.k].icon} The job: ${esc(TARGETS[H.plan.k].name)}</button>`;
    else if (H.jobs.length) out += `<button class="btn btn-soft wide hp-btn" data-do="open" data-kind="heistPlan">🗺️ Jobs done: ${H.jobs.length}</button>`;
    return out;
  }

  // ---- the map: wherever the job can be cased today ----
  function marks(L) {
    const p = L.s.heists.plan, out = [];
    if (!p || p.night || L.s.gaol) return out;
    [0, 1, 2].forEach((i) => { const f = L.heistFact(i); if (f && !L.can(`heistsCase${i}`)) out.push([f.place, '🕶️']); });
    if (!L.can('heistsDig')) out.push(['harbour', '⛏️']);
    if (!L.can('heistsCopy')) out.push(['studios', '🏺']);
    return out;
  }

  // ---- the night: open the safe by hand, if the hands are yours ----
  function go() {
    const L = kit.life, p = L.s.heists.plan, why = L.can('heistsGo', 0.5);
    if (why) { kit.sfx('nope'); kit.toast(why); return; }
    if (!p.crew.hands || p.crew.hands.kind !== 'me') { kit.doAct('heistsGo', 0.5); return; }
    kit.playMini({ id: 'safe', title: 'The lock, yourself', icon: '🔐', level: L.heistLevel(), ease: L.heistSkill('hands', 'me') / 3, skill: 'Craft' }, (score) => { if (score != null && kit.life) kit.doAct('heistsGo', score); });
  }

  return {
    sheets: { heistPlan },
    act: { heistsGo: go },
    lowRoad,
    marks,
    css: `
.hp-dots { display: inline-flex; gap: 3px; margin-left: 6px; vertical-align: middle; }
.hp-dots i { width: 8px; height: 8px; border-radius: 50%; background: rgba(0, 0, 0, .15); }
.pick .hp-dots i { background: rgba(255, 255, 255, .35); }
.hp-dots i.on { background: var(--sun); box-shadow: 0 0 0 1px rgba(0, 0, 0, .12); }
.hp-fact { margin: 0 0 8px; padding: 10px 12px 10px 14px; border-radius: 4px; background: #fbf6e9; box-shadow: 0 2px 0 var(--line), inset 0 0 0 1px #e9dfc6, inset 4px 0 0 #9aa7b8; }
.hp-fact.known { box-shadow: 0 2px 0 var(--line), inset 0 0 0 1px #e9dfc6, inset 4px 0 0 var(--good); }
.hp-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.hp-row > i { font-style: normal; font-size: 20px; line-height: 1; }
.hp-row > b { font-size: 14.5px; font-weight: 900; }
.hp-said { margin: 6px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: 14px; line-height: 1.42; color: #2b2a26; }
.hp-way b { display: block; font-size: 14.5px; font-weight: 900; }
.hp-way small { display: block; margin: 2px 0 6px; font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.35; }
.hp-who { margin-left: auto; font-size: 13.5px; font-weight: 800; text-align: right; }
.hp-who small { display: block; font-size: 11.5px; font-weight: 700; color: var(--muted); }
.hp-role .picks .pick, .hp-way .pick, .hp-go .pick, .hp-rides .pick { min-height: 44px; }
.hp-rides { margin-top: 4px; }
.hp-on { background: var(--good); box-shadow: 0 3px 0 #156b43; }
.hp-go { box-shadow: 0 0 0 2.5px var(--coral); }
.hp-go .lead { margin-top: 2px; color: var(--ink); }
.hp-btn { margin-top: 10px; min-height: 44px; }
`,
  };
}
