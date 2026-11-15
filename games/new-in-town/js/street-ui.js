// New in Town: the house, the garden and the street on screen (the rules are in street.js,
// the seating plan in street-games.js). One row at home opens the house's sheet, which leads
// to the garden's and the street's; the street's leads to having people round. Two boxes on
// the Me tab: your house, and your street.

import { HOMES } from './data.js';
import { FOLK } from './folk-cast.js';
import { HOUSE, FAULTS, BUILDERS, PROJECTS, GARDENS, FEATURES, STREETS, ROLES, MENUS, SEAT, LANDLORDS, standWord, first } from './street-lib.js';
import { faultLine } from './street-cards.js';
import { setTable, seated } from './street-games.js';

export default function (kit) {
  const { esc, money, cashShort, pick, actRow, chip } = kit;
  const L = () => kit.life;
  // (A word and a bar beneath it: the words are too long to sit beside one on a phone.)
  const bar = (icon, label, v, word) => `<div class="line st-mline"><span>${icon} ${esc(label)}</span><b>${esc(word)}</b></div><span class="bar st-bar"><span style="width:${Math.max(0, Math.min(100, v))}%"></span></span>`;
  const ICON = { boss: '👔', vicar: '⛪', inl: '👵' };
  const ava = (g) => `<span class="ava st-av">${g.look ? kit.face(g.look, g.age || 40, 40 + (g.st != null ? (g.st + 100) * 0.3 : 30), g.sex) : g.k === 'vicar' ? kit.face(FOLK.hollis.look, 52, 70, 'f') : `<i>${ICON[g.k] || '🙂'}</i>`}</span>`;
  const link = (kind, label) => `<button class="pick quiet" data-do="open" data-kind="${kind}">${label}</button>`;
  const years = (n) => (n >= 200 ? 'nearly three hundred years old' : n >= 150 ? 'getting on for two hundred years old' : n >= 100 ? 'over a hundred years old' : n >= 50 ? `about ${Math.round(n / 10) * 10} years old` : `about ${Math.max(5, Math.round(n / 5) * 5)} years old`);
  // The guests chosen for the next time you have people round, and what you will give them.
  const plan = { g: [], m: 'roast' };

  // ---- the house ----
  function stHouse() {
    const life = L(), s = life.s, h = life.stHouse();
    if (!h) return null;
    const H = HOMES[h.kind], own = life.stOwned();
    let body = `<div class="picks st-links">${h.g ? link('stGarden', `${GARDENS[h.kind].icon} The garden`) : ''}${link('stStreet', `${STREETS[h.kind].icon} ${h.kind === 'hostel' ? 'Your bunkmates' : 'The neighbours'}`)}${HOUSE[h.kind].table ? link('stHost', '🍽️ Have people round') : ''}</div>`;
    if (h.kind === 'hostel' || HOMES[h.kind].lodger) {
      body += `<div class="item"><p class="sub">${h.kind === 'hostel' ? 'A bunk in Dormitory B. Nothing here is yours to mend, except your sleep, and nobody comes round for dinner.' : 'Mrs Pargeter’s house, and Mrs Pargeter’s rules. What goes wrong with it is hers to see to, and she sees to it before you have noticed. Nobody comes round for dinner.'}</p></div>`;
      return { icon: H.icon, title: H.name, sub: 'Not yours to mend', body };
    }
    const c = life.stCond(h);
    body += `<p class="lead">${esc(H.name)}: ${years(h.age)}${own ? ', and yours' : ''}. A house wears as it ages and as it is lived in: what goes wrong is ${own ? 'yours to put right, and what is left shows in the price' : 'your landlord’s to put right, or not'}.</p>${bar('🏠', 'Repair', c, life.stCondWord(h))}`;
    // What is wrong.
    const wrong = life.stWrong(h);
    body += '<h3>What wants doing</h3>';
    if (!wrong.length) body += '<div class="item"><p class="sub">Nothing, just now. Touch wood.</p></div>';
    for (const [f, r] of wrong) {
      const F = FAULTS[f], job = h.job && h.job.f === f;
      let picks = '';
      if (job) picks = `<span class="note">${esc(h.job.who)} is seeing to it, he says.</span>`;
      else if (own) picks = `${pick(`🧰 Penwarden &amp; Sons ${chip('cash', cashShort(life.stFaultCost(f, 'sound', h)))}`, 'stFix', { f, b: 'sound' }, life.can('stFix', { f, b: 'sound' }))}${pick(`🚐 Daz ${chip('cash', cashShort(life.stFaultCost(f, 'cheap', h)))}`, 'stFix', { f, b: 'cheap' }, life.can('stFix', { f, b: 'cheap' }), 'quiet')}${F.diy != null ? pick(`🔨 Yourself, Craft ${F.diy} ${chip('time', '⏱ 2')}`, 'stFix', { f, b: 'diy' }, life.can('stFix', { f, b: 'diy' }), 'quiet') : ''}`;
      else picks = `${pick(`📞 Ask ${esc(h.ll ? h.ll.name : 'the landlord')} again`, 'stFix', { f, b: 'll' }, life.can('stFix', { f, b: 'll' }))}${F.diy != null ? pick(`🔨 Yourself, Craft ${F.diy} ${chip('time', '⏱ 2')}`, 'stFix', { f, b: 'diy' }, life.can('stFix', { f, b: 'diy' }), 'quiet') : ''}`;
      body += `<div class="item"><div class="item-top"><span class="act-ico">${F.icon}</span><div><b>${esc(F.name)}</b><small>${esc(faultLine(life, f, r))}${life.stOnlyPatch(f, h) ? ' On a roof like this, only a patch, until the whole roof is done.' : ''}</small></div></div><div class="picks">${picks}</div></div>`;
    }
    if (own) {
      // Building work.
      body += '<h3>Building work</h3>';
      if (h.proj) {
        const p = h.proj, P = PROJECTS[p.id];
        if (p.gone) body += `<div class="item"><div class="item-top"><span class="act-ico">🚐</span><div><b>${esc(P.name)}</b><small>${esc(p.who)} has gone, with ${money(p.paid)}.</small></div></div></div>${actRow(life.look('stDrop'))}`;
        else if (p.b === 'diy') body += `${actRow(life.look('stBuild'))}${actRow(life.look('stDrop'))}`;
        else body += `<div class="item mine"><div class="item-top"><span class="act-ico">${P.icon}</span><div><b>${esc(P.name)}</b><small>${p.b === 'charm' ? esc(p.who) : BUILDERS[p.b].name} on site: ${p.left} season${p.left === 1 ? '' : 's'} to go, more or less. You are living on a building site.</small></div></div>${bar('🏗️', 'Done', ((p.total - p.left) / p.total) * 100, `${p.total - p.left} of ${p.total}`)}</div>`;
      }
      let could = '', nCould = 0;
      for (const id of life.stProjects(h)) {
        const P = PROJECTS[id], d = h.done[id];
        if (d) { body += `<div class="item"><div class="item-top"><span class="act-ico">${P.icon}</span><div><b>${esc(P.name)}</b><small>✓ Done${d.b === 'diy' ? ', by your own hands' : ''}. Adds about ${cashShort(d.v * s.idx)} to the price.</small></div></div></div>`; continue; }
        if (h.proj) continue;
        const x = (b) => ({ id, b }), cost = (b) => cashShort(life.stProjCost(id, b, h)), why = life.can('stProject', x('sound'));
        nCould++;
        could += `<div class="item"><div class="item-top"><span class="act-ico">${P.icon}</span><div><b>${esc(P.name)}</b><small>${esc(P.blurb)} About ${P.seasons} season${P.seasons > 1 ? 's' : ''} of building.</small></div></div>
          <div class="picks">${pick(`🧰 Penwarden ${chip('cash', cost('sound'))}`, 'stProject', x('sound'), why)}${pick(`🚐 Daz ${chip('cash', cost('cheap'))}`, 'stProject', x('cheap'), life.can('stProject', x('cheap')), 'quiet')}${pick(`😎 ${esc(life.stCharmer().split(' ')[0])} ${chip('cash', `${cashShort(Math.round(life.stProjCost(id, 'charm', h) / 2))} down`)}`, 'stProject', x('charm'), life.can('stProject', x('charm')), 'quiet')}${P.diy != null ? pick(`🔨 Yourself, Craft ${P.diy} ${chip('cash', cost('diy'))}`, 'stProject', x('diy'), life.can('stProject', x('diy')), 'quiet') : ''}</div></div>`;
      }
      if (nCould) body += `<details class="st-could"><summary>Building work you could have done (${nCould})</summary>${could}<p class="fine">${esc(BUILDERS.sound.blurb)} ${esc(BUILDERS.cheap.blurb)} Charming builders want half up front. Building yourself takes weekends: two blocks of time a season.</p></details>`;
      else if (!h.proj) body += '<div class="item"><p class="sub">Everything this house could have done to it has been done.</p></div>';
      if (h.done.annexe) body += `<h3>The annexe</h3><div class="item"><p class="sub">${h.ann && h.ann.p != null && life.person(h.ann.p) ? `${esc(first(life.person(h.ann.p)))} lives in it, at the end of the garden.` : h.ann && h.ann.let ? 'Let to holidaymakers.' : 'Empty.'}</p></div>${h.ann && h.ann.p == null ? actRow(life.look('stLetAnnexe')) : ''}`;
      if (h.done.workshop) body += actRow(life.look('stMake'));
      const staff = ['gardener', 'keeper'].filter((k) => !life.can('stStaff', k) || (k === 'gardener' ? h.staff.gardener : h.staff.keeper));
      if (staff.length) body += `<h3>Help in the house</h3>${staff.map((k) => actRow(life.look('stStaff', k))).join('')}`;
      if (['villa', 'manor'].includes(h.kind)) body += `<p class="fine">A gardener comes with the rates on a house like this, and keeps the garden from going under. A big house left without a housekeeper wears faster.</p>`;
    } else if (h.ll) {
      const ll = h.ll;
      body += `<h3>Your landlord</h3><div class="item"><div class="item-top"><span class="act-ico">🔑</span><div><b>${esc(ll.name)}</b><small>${ll.known ? `Who ${esc(LANDLORDS[ll.kind].word)}.` : 'You have not had to ask for anything yet.'}${ll.up > 0 ? ` The rent has gone up by ${Math.round(ll.up * 100)}% since you came.` : ''}</small></div></div>${bar('🤝', 'Thinks of you as', ll.tn, ll.tn >= 60 ? 'A good tenant' : ll.tn >= 35 ? 'A tenant' : 'Trouble')}</div>
        <p class="fine">Paying on time, season after season, makes a good tenant, and a good landlord has been known to sell to one. Building work is for homes of your own.</p>`;
    }
    for (const o of s.street.owe) body += `<div class="line"><span>📒 ${esc(o.what)}</span><b>${money(o.left)} to go</b></div>`;
    return { icon: H.icon, title: H.name, sub: own ? `Yours · ${life.stCondWord(h)}` : `Rented${h.ll ? ` from ${h.ll.name}` : ''}`, body };
  }

  // ---- the garden ----
  function stGarden() {
    const life = L(), h = life.stHouse(), g = h && h.g;
    if (!g) return null;
    const G = GARDENS[h.kind], score = life.stScore(h);
    let body = `${bar('🪣', 'Kept', g.care, g.care >= 60 ? 'Well kept' : g.care >= 30 ? 'Could do with you' : 'Neglected')}${bar('🌷', 'Looks', score, life.stScoreWord(h))}${actRow(life.look('stDig'))}`;
    const have = Object.entries(g.ft);
    if (have.length) {
      body += '<h3>What is in it</h3>';
      for (const [id, f] of have) body += `<div class="item st-ft"><div class="item-top"><span class="act-ico">${FEATURES[id].icon}</span><div><b>${esc(FEATURES[id].name)}${f.old ? ' <i class="st-old">there when you came</i>' : ''}</b><small>${esc(life.stFtWord(id, f))}${id === 'pond' && g.frogs ? ', and frogs' : ''}</small></div></div><span class="bar st-grow"><span style="width:${Math.round(f.m * 100)}%"></span></span></div>`;
    }
    const can = life.stFeatures(h).filter((id) => !g.ft[id]);
    if (can.length) body += `<h3>Put in</h3>${can.map((id) => actRow(life.look('stPlant', id))).join('')}`;
    const S = life.s.street, rosettes = Object.values(S.shows).reduce((a, n) => a + n, 0);
    body += `<p class="fine">${rosettes ? `🏵️ ${rosettes} first${rosettes > 1 ? 's' : ''} at the Harvest Show. ` : ''}${S.n.bloom ? `🌸 ${S.n.bloom} win${S.n.bloom > 1 ? 's' : ''} at Bay in Bloom. ` : ''}A garden grows from what you put in and how you keep it. What it grows comes off the food bill in summer and autumn, it can go to the Harvest Show and Bay in Bloom, and it stays with the house when you move.</p>`;
    return { icon: G.icon, title: G.name, sub: life.stScoreWord(h), body };
  }

  // ---- the street ----
  function stStreet() {
    const life = L(), h = life.stHouse();
    if (!h) return null;
    const K = STREETS[h.kind], nbs = life.stNbs();
    let body = `<p class="lead">${h.kind === 'hostel' ? 'The people you share a room with.' : 'The people you live among. Each has a want of their own, and a story that takes years; how you stand with them lifts your mood, or sours it.'}</p>`;
    for (const n of nbs) {
      const R = ROLES[n.role], why = life.can('stCall', n.id);
      const st = (n.st + 100) / 2;
      body += `<div class="item st-nb"><div class="item-top">${ava({ look: n.look, age: n.age, sex: n.sex, st: n.st, k: 'n' })}<div><b>${esc(n.name)}</b><small>${esc(R.quirk)}${n.kid ? ` ${esc(n.kid.name)}, ${n.kid.age}, lives there too.` : ''}${n.other ? ` With ${esc(n.other)}.` : ''}</small></div></div>
        ${bar(n.st < -10 ? '⚡' : '🤝', 'Standing', st, standWord(n.st))}
        ${n.know ? `<p class="fine">Wants: ${esc(R.want)}</p>` : ''}
        <div class="picks">${pick(`🚪 Pop round ${chip('time', '⏱ 1')}`, 'stCall', n.id, why)}${why && why !== 'You have been round this season.' ? `<span class="note">${esc(why)}</span>` : ''}</div></div>`;
    }
    if (h.arrive != null) body += '<div class="item"><p class="sub">There is a house empty on the street, for now. Somebody will be along.</p></div>';
    if (HOUSE[h.kind].table) body += `<h3>Having people round</h3><button class="act" data-do="open" data-kind="stHost"><span class="act-ico">🍽️</span><span class="act-main"><b>Have people round</b><small>Up to ${HOUSE[h.kind].table} round your table: friends, family, the neighbours, the boss. Choose the food, then seat them.</small></span><span class="act-cost"><i class="go">›</i></span></button>`;
    return { icon: K.icon, title: K.name, sub: `${nbs.length} neighbour${nbs.length === 1 ? '' : 's'}`, body };
  }

  // ---- having people round ----
  function stHost() {
    const life = L(), seats = life.stTableSize();
    if (!seats) return null;
    const all = life.stGuests();
    plan.g = plan.g.filter((k) => all.some((g) => g.k === k));
    if (!MENUS[plan.m]) plan.m = 'roast';
    const x = { g: plan.g, m: plan.m }, why = life.can('stHost', x);
    const group = (label, list) => (list.length ? `<h3>${label}</h3><div class="st-guests">${list.map((g) => `<button class="st-gst${plan.g.includes(g.k) ? ' on' : ''}" data-do="stGuest" data-k="${esc(g.k)}">${ava(g)}<span><b>${esc(g.first)}</b><small>${g.who === 'inlaw' ? `${esc(g.of)}’s mother` : g.who === 'neighbour' ? standWord(g.st).toLowerCase() : esc(g.who)}${g.tags.length ? ` ${g.tags.map((t) => SEAT[t].icon).join('')}` : ''}</small></span></button>`).join('')}</div>` : '');
    let body = `<p class="lead">Up to ${seats} round your table. Choose who comes and what you give them, then lay the table: where they sit decides how the night goes. ${Object.values(SEAT).map((t) => `${t.icon} ${t.word.toLowerCase()}`).join(' · ')}.</p>`;
    body += `<p class="st-count">${plan.g.length} of ${seats} chairs taken</p>`;
    body += group('Close to home', all.filter((g) => ['partner', 'spouse', 'parent', 'sibling', 'child', 'grandchild', 'inlaw'].includes(g.who)));
    body += group('Friends', all.filter((g) => g.who === 'friend'));
    body += group('The street', all.filter((g) => g.who === 'neighbour'));
    body += group('People to impress', all.filter((g) => g.who === 'boss' || g.who === 'vicar'));
    body += `<h3>What you will give them</h3><div class="picks">${Object.entries(MENUS).map(([id, m]) => `<button class="pick${plan.m === id ? '' : ' quiet'}" data-do="stMenu" data-m="${id}">${m.icon} ${esc(m.name)}${m.dc ? ` <small>Craft ${m.dc}</small>` : ''}</button>`).join('')}</div>`;
    body += `<p class="fine">${plan.m === 'bought' ? 'No cooking, and no risk: it is good, if not memorable.' : `It takes Craft: done well, the food makes the night; done badly, it is talked about for other reasons.${life.homeEntry() && life.homeEntry().ups.kitchen ? ' A new kitchen helps.' : ''}`}</p>`;
    body += `<button class="btn wide st-lay${why ? ' off' : ''}" data-do="stLay"${why ? ` data-why="${esc(why)}"` : ''}>🍽️ Lay the table ${chip('time', '⏱ 2')}${chip('cash', cashShort(life.stHostCost(x)))}</button>${why ? `<p class="fine">${esc(why)}</p>` : ''}`;
    return { icon: '🍽️', title: 'Having people round', sub: `${life.s.street.n.hosted ? `${life.s.street.n.hosted} evening${life.s.street.n.hosted > 1 ? 's' : ''} so far` : 'The first time'}`, body };
  }

  return {
    sheets: { stHouse, stGarden, stStreet, stHost },
    do: {
      stGuest(el) {
        const k = el.dataset.k, i = plan.g.indexOf(k);
        if (i >= 0) plan.g.splice(i, 1);
        else if (plan.g.length < L().stTableSize()) plan.g.push(k);
        else { kit.toast('The table is full.'); kit.sfx('nope'); return; }
        kit.sfx('tap'); kit.renderSheet();
      },
      stMenu(el) { plan.m = el.dataset.m; kit.sfx('tap'); kit.renderSheet(); },
      stLay(el) {
        const life = L(), x = { g: plan.g.slice(), m: plan.m }, why = life.can('stHost', x);
        if (why) { kit.toast(why); kit.sfx('nope'); return; }
        setTable(life.stTable(x.g));
        kit.playMini({ id: 'stSeat', title: 'The seating plan', icon: '🍽️', level: 0, ease: life.s.st.charm / 100, skill: 'Charm' }, (score) => {
          if (score == null) return;
          const o = seated();
          plan.g = [];
          kit.doAct('stHost', { ...x, o: o || undefined });
        });
        void el;
      },
    },
    me(life) {
      const s = life.s, h = life.stHouse();
      if (!h || s.gaol) return '';
      const H = HOMES[h.kind], K = STREETS[h.kind];
      let out = `<div class="box st-me"><h3>Your house</h3><div class="line"><span>${H.icon} ${esc(H.name)}</span><b>${h.kind === 'hostel' || H.lodger ? 'Not yours' : life.stOwned() ? 'Yours' : 'Rented'}</b></div>`;
      if (h.kind !== 'hostel' && !H.lodger) {
        out += `<div class="line"><span>🏠 ${esc(years(h.age).replace(/^./, (c) => c.toUpperCase()))}</span><b>${esc(life.stCondWord(h))}</b></div>`;
        const w = life.stWrong(h);
        if (w.length) out += `<p class="fine">${w.map(([f]) => `${FAULTS[f].icon} ${esc(FAULTS[f].name.toLowerCase().replace(/^the /, 'the '))}`).join(' · ')}: wants seeing to.</p>`;
        if (h.proj && !h.proj.gone) out += `<div class="line"><span>${PROJECTS[h.proj.id].icon} ${esc(PROJECTS[h.proj.id].name)}</span><b>${h.proj.b === 'diy' ? `${h.proj.n} of ${h.proj.need}` : `${h.proj.left} season${h.proj.left === 1 ? '' : 's'} to go`}</b></div>`;
        const done = Object.keys(h.done);
        if (done.length) out += `<p class="fine">Done: ${done.map((id) => `${PROJECTS[id].icon} ${esc(PROJECTS[id].name.replace(/^An? /, '').toLowerCase())}`).join(', ')}.</p>`;
      }
      if (h.g) out += `<div class="line"><span>${GARDENS[h.kind].icon} ${esc(GARDENS[h.kind].name)}</span><b>${esc(life.stScoreWord(h))}</b></div>`;
      if (h.ll && !s.owned) out += `<div class="line"><span>🔑 ${esc(h.ll.name)}</span><b>${h.ll.tn >= 60 ? 'A good tenant' : 'Landlord'}</b></div>`;
      out += `<div class="picks"><button class="pick quiet" data-do="open" data-kind="stHouse">🏡 The house</button>${h.g ? '<button class="pick quiet" data-do="open" data-kind="stGarden">🌷 The garden</button>' : ''}</div></div>`;
      const nbs = life.stNbs();
      out += `<div class="box st-me"><h3>Your street: ${esc(K.name.replace(/^The /, 'the '))}</h3>${nbs.map((n) => `<div class="line"><span>${n.st <= -40 ? '⚡' : n.st >= 40 ? '💛' : '👋'} ${esc(n.name)}</span><b>${esc(standWord(n.st))}</b></div>`).join('') || '<p class="sub">Nobody, just now.</p>'}
        <div class="picks"><button class="pick quiet" data-do="open" data-kind="stStreet">${K.icon} The street</button>${HOUSE[h.kind].table ? '<button class="pick quiet" data-do="open" data-kind="stHost">🍽️ Have people round</button>' : ''}</div></div>`;
      return out;
    },
    css: `
.st-me .picks { margin-top: 6px; }
.st-mline { margin-top: 6px; }
.st-bar { display: block; margin: 3px 0 6px; }
.st-could > summary { list-style: none; cursor: pointer; margin: 4px 0 8px; padding: 12px 14px; border-radius: 14px; text-align: center; font-weight: 800; font-size: 14px; background: #fff; box-shadow: 0 2px 0 var(--line); }
.st-links { margin: 0 0 8px; }
.st-av { width: 44px; height: 44px; flex: none; display: grid; place-items: center; }
.st-av i { font-style: normal; font-size: 26px; }
.st-nb .item-top { align-items: flex-start; }
.st-ft .st-grow { display: block; margin-top: 8px; }
.st-old { font-style: normal; font-size: 11px; font-weight: 700; color: var(--muted); }
.st-count { margin: 4px 2px; font-size: 13px; font-weight: 800; color: var(--teal-d); }
.st-guests { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 6px; }
.st-gst { display: flex; align-items: center; gap: 6px; min-height: 52px; padding: 4px 6px; border: 0; border-radius: 14px; background: #fff; box-shadow: 0 2px 0 var(--line); font: inherit; color: var(--ink); text-align: left; }
.st-gst .st-av { width: 36px; height: 36px; }
.st-gst span:last-child { display: grid; min-width: 0; }
.st-gst b { font-size: 13.5px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-gst small { font-size: 11.5px; font-weight: 700; color: var(--muted); }
.st-gst.on { box-shadow: 0 0 0 2.5px var(--teal); background: #eaf6f4; }
.st-lay { margin-top: 10px; }
.st-lay.off { opacity: .55; }
.st-seat { display: grid; gap: 8px; }
.st-tbl { position: relative; width: 100%; max-width: 340px; height: 240px; margin: 0 auto; }
.st-cloth { position: absolute; left: 22%; right: 22%; top: 24%; bottom: 24%; border-radius: 50%; background: #fffaf0; box-shadow: inset 0 0 0 3px #e8dcc2, 0 3px 0 #d9c9a6; display: grid; place-items: center; font-size: 18px; }
.st-chair { position: absolute; transform: translate(-50%, -50%); width: 58px; min-height: 58px; padding: 2px; border: 0; border-radius: 16px; background: #f3ead6; display: grid; justify-items: center; gap: 1px; font: inherit; color: var(--ink); }
.st-chair .st-ava.b { width: 40px; height: 40px; display: grid; place-items: center; }
.st-chair .st-ava i { font-style: normal; font-size: 24px; }
.st-chair small { font-size: 10.5px; font-weight: 800; line-height: 1.05; max-width: 58px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-chair small em { display: block; font-style: normal; font-size: 10px; }
.st-chair.host { background: #ffe9c7; }
.st-chair.ok { box-shadow: 0 0 0 2.5px #4fb38a; }
.st-chair.sore { box-shadow: 0 0 0 3px var(--coral); }
.st-chair.on { outline: 3px dashed var(--teal); }
.st-empty { display: grid; place-items: center; width: 40px; height: 40px; font-size: 22px; font-weight: 900; color: #b8a77f; }
.st-tray { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; min-height: 52px; }
.st-guest { display: flex; align-items: center; gap: 4px; min-height: 48px; padding: 3px 8px 3px 3px; border: 0; border-radius: 14px; background: #fff; box-shadow: 0 2px 0 rgba(0,0,0,.12); font: inherit; color: var(--ink); }
.st-guest .st-ava.s { width: 34px; height: 34px; display: grid; place-items: center; }
.st-guest .st-ava i { font-style: normal; font-size: 22px; }
.st-guest b { font-size: 13px; }
.st-guest em { font-style: normal; font-size: 12px; }
.st-guest.on { box-shadow: 0 0 0 3px var(--teal); }
.st-rules { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; font-size: 12.5px; font-weight: 700; }
.st-rules li { padding: 3px 6px; border-radius: 8px; background: rgba(255,255,255,.6); }
.st-rules li.kept { color: #2f8a64; }
.st-serve[disabled] { opacity: .5; }
@media (max-width: 340px) { .st-tbl { height: 220px; } .st-chair { width: 52px; min-height: 54px; } .st-chair .st-ava.b { width: 34px; height: 34px; } }
`,
  };
}
