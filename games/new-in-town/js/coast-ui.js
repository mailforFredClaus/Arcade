// New in Town: the coast on screen. The coast book (birds, rock pools and
// the strandline), the Merrow notebook with its clues and the eight places
// the treasure might lie, the lifeboat station, a box on the Me tab, and
// marks on the map: something washed up at the cove after a gale, a rare
// bird on the Head, and a magnifying glass wherever a lead on the Merrow
// can be followed up today. The caves and the Sandcastle Cup are played by
// hand (coast-games.js). The rules are in coast.js.

import { BIRDS, POOLS, STRAND, SITES, ATTRS, CARGO, LEADS, SHOUTS, LB_RANKS, RARITY, rarityOf, whenSaid, siteSaid } from './coast.js';
import { GAME_CSS } from './coast-games.js';

export default function (kit) {
  const { esc, money, cashShort, pick, chip, actRow } = kit;
  let page = 'birds'; // which page of the coast book is open

  const BOOK = {
    birds: { name: 'Birds', icon: '🐦', list: BIRDS, got: (c) => c.birds, lead: 'Every bird you have seen on Gorse Head and at the cove. What turns up depends on the season and the weather, and the far-off rare ones want binoculars, patience and luck.' },
    pools: { name: 'Pools', icon: '🦀', list: POOLS, got: (c) => c.pools, lead: 'What lives in the rock pools at the cove, at low tide. Some only come inshore in spring and summer.' },
    strand: { name: 'Shore', icon: '🐚', list: STRAND, got: (c) => c.strand, lead: 'What the sea leaves along the top of the beach at the cove. A gale brings in far more, and stranger things.' },
  };
  const where = (k) => (k.where ? (k.where === 'head' ? 'Gorse Head' : 'The cove') : '');
  const hintOf = (k) => [where(k), whenSaid(k)].filter(Boolean).join(': ') || 'Any time';

  // ---- the coast book ----
  function coastBook() {
    const L = kit.life, c = L.s.coast, b = BOOK[page], got = b.got(c);
    const tabs = Object.entries(BOOK).map(([id, v]) => `<button class="cb-tab${id === page ? ' on' : ''}" data-do="coastTab" data-v="${id}">${v.icon} ${v.name}<small>${Object.keys(v.got(c)).length} of ${Object.keys(v.list).length}</small></button>`).join('');
    const cells = Object.entries(b.list).map(([id, k]) => {
      const n = got[id], r = RARITY[rarityOf(k)];
      return n ? `<span>${k.icon}<b>${esc(k.name)}</b><small>${n === 1 ? 'Once' : `${n} times`}<br>${r}</small></span>`
        : `<span class="unknown">❔<b>???</b><small>${esc(hintOf(k))}<br>${r}</small></span>`;
    }).join('');
    const tip = page === 'birds' ? (L.s.items.binoculars ? '<p class="fine">🔭 Your binoculars make out the far-off ones, and find more of the rare.</p>' : '<p class="fine">🔭 Without binoculars the far-off rare ones are a blur. The warden’s hut on Gorse Head sells them.</p>') : '';
    const all = Object.values(BOOK).reduce((a, v) => a + Object.keys(v.got(c)).length, 0), of = Object.values(BOOK).reduce((a, v) => a + Object.keys(v.list).length, 0);
    return { icon: '📗', title: 'Your coast book', sub: `${all} of ${of} found`, body: `<div class="cb-tabs">${tabs}</div><p class="lead">${b.lead}</p><div class="things fish">${cells}</div>${tip}` };
  }

  // ---- the Merrow notebook ----
  function coastBoard() {
    const L = kit.life, s = L.s, m = s.coast.m;
    if (!m || m.on == null) return { icon: '📓', title: 'The Merrow', sub: 'A story everybody knows', body: '<p class="lead">There is a stone on Gorse Head with names on it. Start there.</p>' };
    const k = CARGO[m.cargo];
    let body = `<p class="lead">The brig Merrow, ${esc(m.from)} for ${esc(m.to)}, struck the Mare’s Teeth off Gorse Head on the night of ${esc(L.coastDate())} with ${esc(k.name)} aboard. Three came ashore; the ${k.short} never did. If it lies anywhere, it lies in one of the eight places below, and each clue rules some of them out.</p>`;
    if (m.found != null) {
      const end = { keep: `You sold it, for ${money(k.worth)}.`, museum: 'You gave it to the town museum, where it has a room of its own.', town: 'You shared it with the town: St Brigid’s has its roof, the lifeboat new gear, and the library a new wing.' }[m.end] || 'What happens to it now is up to you.';
      body += `<div class="item mine cb-found"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>Found, at ${esc(siteSaid(m.ans))}</b><small>${esc(end)}</small></div></div></div>`;
    }
    const keys = Object.keys(LEADS), have = keys.filter((key) => m.clues[key] != null).sort((a, b) => m.clues[a] - m.clues[b]);
    body += '<h3>What you know</h3>';
    body += have.length ? have.map((key) => { const cl = L.coastClue(key); return `<div class="cb-note"><b>${cl.icon} ${esc(cl.name)}</b><p>${esc(cl.text)}</p></div>`; }).join('') : '<p class="sub">Nothing yet but the story everybody tells.</p>';
    if (m.rival) body += `<div class="cb-note"><b>🎙️ Darren Pike’s podcast</b><p>${esc(`He dug at ${siteSaid(m.rival)} for a week, live, and found a ring pull.`)}</p></div>`;
    const left = keys.filter((key) => m.clues[key] == null);
    if (left.length && m.found == null) {
      body += '<h3>Leads to follow</h3>';
      body += left.map((key) => {
        const v = LEADS[key], prog = key === 'marlow' && m.pints ? ` (${m.pints} of 3 evenings)` : (key === 'paper' || key === 'archive') && m.arch ? ` (${m.arch} of 8 boxes)` : key === 'chart' && m.chart && m.chart.t === s.t ? ' It is in his window now.' : key === 'quinn' && L.coastTrusted() ? ' She will see you now.' : '';
        return `<div class="cb-lead"><i>${v.icon}</i><div><b>${esc(v.name)}</b><small>${esc(v.hint + prog)}</small></div></div>`;
      }).join('');
    }
    body += `<h3>Where it might be</h3><p class="fine">Tap to rule a place out as you go. Nobody gives you leave to dig until you have followed up four leads, one of them from somebody who knows this coast; a wrong guess costs money, and the council makes you wait a year for the next permit, and longer each time after that.${L.coastMisses() ? ` Holes dug for nothing so far: ${L.coastMisses()}.` : ''}</p>`;
    for (const [id, p] of Object.entries(SITES)) {
      const how = L.coastDigHow(id), gone = m.dug[id] != null || m.rival === id, out = gone || !!m.x[id] || (m.found != null && id !== m.ans);
      const chips = Object.keys(ATTRS).map((a) => { const [ic, label] = ATTRS[a].vals[p[a]]; return `<span>${ic} ${label}</span>`; }).join('');
      const said = m.dug[id] != null && id !== m.ans ? 'You dug here. Nothing.' : m.rival === id ? 'Darren Pike dug here. Nothing.' : '';
      const note = { tide: 'Uncovered only by the great ebbs of spring and autumn.', dive: 'A dive: not in winter or rough weather, and it wants Fitness 30.', grave: 'The church will want four leads followed, and good reason.', dig: 'A permit, two hired men and a day’s digging.' }[how];
      let picks = '';
      if (m.found == null && !gone) {
        const why = L.can('coastDig', id);
        picks = `<p class="fine">${esc(why || note)}</p><div class="picks">${pick(`${how === 'dive' ? 'Dive' : 'Dig'} here · ${cashShort(L.coastDigCost(id))} ${chip('time', '⏱ 2')}`, 'coastDig', id, why)}${pick(m.x[id] ? 'Rule it back in' : 'Rule it out', 'coastCross', id, null, 'quiet')}</div>`;
      }
      body += `<div class="item cb-site${out ? ' out' : ''}${m.found != null && id === m.ans ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${p.icon}</span><div><b>${esc(p.name)}</b><small>${esc(said || p.text)}</small></div></div>
        <div class="facts">${chips}</div>${picks}</div>`;
    }
    return { icon: '📓', title: 'The Merrow', sub: m.found != null ? 'Found' : `${have.length} of ${keys.length} leads followed`, body };
  }

  // ---- the lifeboat station ----
  function coastLifeboat() {
    const L = kit.life, s = L.s, lb = s.coast.lb;
    let body = '<p class="lead">The Starling Bay lifeboat goes out in whatever weather sends for it: most often in gales and fog, now and then on a summer evening for somebody on a lilo. The crew are volunteers and are not paid. Captain Quinn, the coxswain, picks them, and says very little about it.</p>';
    if (!lb) return { icon: '🚤', title: 'The lifeboat station', sub: 'Volunteers wanted', body: body + actRow(L.look('coastJoin')) };
    const word = lb.done != null ? 'Stood down, with thanks' : lb.left != null ? 'Not on the crew just now' : LB_RANKS[lb.rank];
    body += `<div class="item mine"><div class="item-top"><span class="act-ico">🛟</span><div><b>${esc(word)}</b><small>${lb.calls ? `${lb.calls} shout${lb.calls > 1 ? 's' : ''}, ${lb.saved} people brought home` : lb.rank ? 'No shouts yet. Keep the pager on you.' : `${lb.train} of 4 training sessions done`}${lb.medal ? ` · ${lb.medal > 1 ? 'silver' : 'bronze'} medal for gallantry` : ''}</small></div></div>
      <div class="skill"><i>⚓</i><span>With the crew</span><span class="bar"><span style="width:${lb.stand}%"></span></span><b>${Math.round(lb.stand)}</b></div>
      <p class="fine">${esc(L.coastStandWord())}. Training and good shouts raise it; missing a shout, or a season out of her sight, lowers it.</p></div>`;
    const ladder = [['Four training sessions', lb.train >= 4], ['Standing 60, and six shouts', lb.rank >= 2], ['Standing 85, and fifteen shouts', lb.rank >= 3]];
    body += `<details><summary>The crew, from the bottom up</summary>${LB_RANKS.map((r, i) => `<div class="rung${lb.rank === i && lb.left == null && lb.done == null ? ' now' : ''}"><b>${i + 1}. ${r}</b><div>${i ? `<i class="need${ladder[i - 1][1] ? ' ok' : ''}">${ladder[i - 1][1] ? '✓' : '○'} ${ladder[i - 1][0]}</i>` : '<i class="need ok">Anyone with Fitness 25</i>'}</div></div>`).join('')}
      <p class="fine">The pagers go more often in bad weather. A bold rescue is the likelier to win a medal, and the likelier to hurt. Fitness counts for the bold way, Smarts for the careful one; working at sea, or a boat of your own, helps with both.</p></details>`;
    if (lb.log.length) body += `<h3>The board</h3>${lb.log.map((e) => `<p class="entry"><i>${e.saved}</i>${esc(SHOUTS[e.id] ? SHOUTS[e.id].board : 'A shout')}.</p>`).join('')}<p class="fine">The number is how many came home.</p>`;
    if (L.coastOnBooks()) body += `<h3>At the station</h3>${actRow(L.look('coastTrain'))}<div class="picks">${pick('Step down from the crew', 'coastQuit', undefined, null, 'quiet')}</div>`;
    else if (lb.done == null) body += actRow(L.look('coastJoin'));
    return { icon: '🚤', title: 'The lifeboat station', sub: lb.calls ? `${lb.calls} shouts · ${lb.saved} brought home` : word, body };
  }

  // ---- the Me tab ----
  function me(L) {
    const c = L.s.coast, m = c.m, lb = c.lb;
    const birds = Object.keys(c.birds).length, shore = Object.keys(c.pools).length + Object.keys(c.strand).length;
    if (!birds && !shore && !lb && !(m && m.on != null) && !c.caves.n && !c.castle.wins) return '';
    const line = (label, v) => `<div class="line"><span>${label}</span><b>${v}</b></div>`;
    let out = '';
    if (birds || shore) out += line('🐦 Birds seen', `${birds} of ${Object.keys(BIRDS).length}`) + line('🦀 Shore finds', `${shore} of ${Object.keys(POOLS).length + Object.keys(STRAND).length}`);
    if (c.caves.n) out += line('🕯️ Trips into the caves', `${c.caves.n}${c.caves.cut ? `, cut off ${c.caves.cut === 1 ? 'once' : `${c.caves.cut} times`}` : ''}`);
    if (c.castle.wins) out += line('🏰 Sandcastle Cups', c.castle.wins);
    if (lb) {
      out += line('🛟 The lifeboat', lb.done != null ? 'Stood down' : lb.left != null ? 'Not on the crew' : LB_RANKS[lb.rank]);
      if (lb.calls) out += line('🌊 Shouts', `${lb.calls}, and ${lb.saved} brought home`);
      if (lb.medal) out += line('🎖️ Medal for gallantry', lb.medal > 1 ? 'Silver' : 'Bronze');
      if (L.coastOnBooks()) out += `<div class="skill"><i>⚓</i><span>With the crew</span><span class="bar"><span style="width:${lb.stand}%"></span></span><b>${Math.round(lb.stand)}</b></div>`;
    }
    if (m && m.on != null) out += line('⚓ The Merrow', m.end ? { keep: 'Found, and sold', museum: 'Found, and in the museum', town: 'Found, and shared' }[m.end] : m.found != null ? 'Found!' : `${L.coastClues()} of ${Object.keys(LEADS).length} leads followed`);
    const btn = (kind, label) => `<button class="btn btn-soft" data-do="open" data-kind="${kind}">${label}</button>`;
    return `<div class="box"><h3>The coast</h3>${out}<div class="cb-btns">${birds || shore ? btn('coastBook', '📗 Book') : ''}${m && m.on != null ? btn('coastBoard', '📓 Merrow') : ''}${lb ? btn('coastLifeboat', '🚤 Lifeboat') : ''}</div></div>`;
  }

  // ---- the map ----
  function marks(L) {
    const s = L.s, c = s.coast, out = [];
    if (c.wash && c.wash.t === s.t && !c.wash.got) out.push(['cove', '📦']);
    else if (L.season === 1 && c.castle.last !== L.year) out.push(['cove', '🏰']);
    if (c.rare && c.rare.t === s.t) out.push(['headland', '🐦']);
    // (A lead on the Merrow that can be followed up today.)
    for (const [id, place] of [['coastPint', 'pub'], ['coastArchive', 'library'], ['coastRegister', 'church'], ['coastChart', 'highstreet'], ['coastQuinn', 'harbour']]) if (!L.can(id)) out.push([place, '🔎']);
    return out;
  }

  // ---- played by hand ----
  const play = (id, mini) => {
    const L = kit.life, why = L.can(id, 0.5);
    if (why) { kit.sfx('nope'); kit.toast(why); return; }
    // (Giving up in the caves is walking back out with what you hold, not being cut off by the tide.)
    kit.playMini(mini(L), (score, gaveUp) => { if (score != null && kit.life) kit.doAct(id, gaveUp && id === 'coastCave' ? Math.max(0.2, score) : score); });
  };

  return {
    sheets: { coastBook, coastBoard, coastLifeboat },
    do: { coastTab(el) { page = el.dataset.v in BOOK ? el.dataset.v : 'birds'; kit.sfx('tap'); kit.renderSheet(); } },
    act: {
      coastCaves: () => play('coastCaves', (L) => ({ id: 'coastCaves', title: 'Hob’s Hole', icon: '🕯️', level: L.coastCaveLevel(), ease: L.s.st.fitness / 100, skill: 'Fitness' })),
      coastCastle: () => play('coastCastle', (L) => ({ id: 'coastCastle', title: 'The Sandcastle Cup', icon: '🏰', level: Math.min(5, L.s.coast.castle.wins), ease: L.s.st.craft / 100, skill: 'Craft' })),
    },
    me,
    marks,
    css: `${GAME_CSS}
.cb-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 2px 0 4px; }
.cb-tab { display: grid; justify-items: center; gap: 1px; min-height: 48px; padding: 6px 4px; border-radius: 12px; background: #f1eadb; color: #6b6048; font-size: 13px; font-weight: 900; }
.cb-tab small { font-size: 11px; font-weight: 800; opacity: .8; }
.cb-tab.on { background: var(--teal); color: #fff; box-shadow: 0 3px 0 var(--teal-edge); }
.cb-note { margin: 0 0 8px; padding: 10px 12px 10px 14px; border-radius: 4px; background: #fbf6e9; box-shadow: 0 2px 0 var(--line), inset 0 0 0 1px #e9dfc6, inset 4px 0 0 #d9b56a; }
.cb-note b { display: block; font-size: 12px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; color: #8a6a3a; }
.cb-note p { margin: 4px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: 14.5px; line-height: 1.42; color: #2b2a26; }
.cb-lead { display: flex; gap: 10px; align-items: flex-start; padding: 8px 4px; border-bottom: 1px dashed #e4d9bf; }
.cb-lead i { font-style: normal; font-size: 22px; line-height: 1.1; }
.cb-lead b { display: block; font-size: 14px; font-weight: 900; }
.cb-lead small { display: block; font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.35; }
.cb-site .facts span { font-size: 11.5px; padding: 3px 7px; }
.cb-site.out { opacity: .5; }
.cb-site.out .item-top b { text-decoration: line-through; text-decoration-thickness: 2px; }
.cb-site .picks .pick { min-height: 44px; }
.cb-found { margin-top: 4px; }
.cb-btns { display: grid; grid-template-columns: repeat(auto-fit, minmax(76px, 1fr)); gap: 6px; margin-top: 10px; }
.cb-btns .btn { min-height: 44px; padding: 8px 4px; font-size: 13.5px; white-space: nowrap; }
`,
  };
}
