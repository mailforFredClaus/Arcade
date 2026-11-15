// New in Town: Starling Moor on screen. Sheets for the walks, the finds,
// the star log, the Askwiths at Haverleigh Hall, the drowned village of
// Fennick and the Curlew Award; a box on the Me tab; the moor's people on
// the People tab; what the trip up will cost, at the top of each place on
// the moor; badges and the moor's changes on the map; and the three games
// played by hand (moor-games.js). The rules are in moor.js.

import { MOOR_PLACES, MOOR_FOLK, MOOR_FOLK_IDS, ASKWITHS, WALKS, WALK_IDS, DROVE, FINDS, FIND_IDS, SKY, SKY_IDS, AWARD, AWARD_AGE, HALL_NEED, HALL_TITLES, CLUES, CLUE_IDS, QUARRY_RANKS, SYND_FEE } from './moor.js';
import { GAME_CSS, setSky, skySvg } from './moor-games.js';
import { SEASONS } from './data.js';

export default function (kit) {
  const { esc, money, pick, chip, actRow } = kit;
  const bar = (ico, label, v) => `<div class="skill"><i>${ico}</i><span>${label}</span><span class="bar"><span style="width:${Math.max(0, Math.min(100, v))}%"></span></span><b>${Math.floor(v)}</b></div>`;
  const line = (label, v) => `<div class="line"><span>${label}</span><b>${v}</b></div>`;
  const seasonsSaid = (q) => (q.length === 4 ? 'All year' : q.map((i) => SEASONS[i]).join(' and '));
  const btn = (kind, label) => `<button class="btn btn-soft" data-do="open" data-kind="${kind}">${label}</button>`;

  // ---- the walks ----
  function moorWalks() {
    const L = kit.life, s = L.s, m = s.moor, done = L.moorWalksDone();
    let body = `<p class="lead">The walks board outside the Drovers: ten walks on the moor, from a stroll round the stones to the whole Starling Round in a day. Each is free, and good for Fitness and the mood. Walk them all for the record. One walk a season is a day out; the first thing you do up here takes the trip up as well.</p>
      <div class="facts"><span class="${m.kit.map ? 'up' : ''}">${m.kit.map ? '✓' : '○'} Map and compass</span><span class="${m.kit.boots ? 'up' : ''}">${m.kit.boots ? '✓' : '○'} Walking boots</span><span>💪 Fitness ${Math.floor(s.st.fitness)}</span><span>${done} of ${WALK_IDS.length} walked</span></div>`;
    const ids = [...WALK_IDS, ...(m.drove.side === 'open' ? ['drove'] : [])];
    for (const id of ids) {
      const w = id === 'drove' ? DROVE : WALKS[id], n = m.walks[id] || 0, why = L.can('moorWalk', id), v = L.look('moorWalk', id);
      const facts = [`${w.miles} miles`, w.fit ? `Fitness ${w.fit}` : 'Anyone', ...w.kit.map((k) => (k === 'map' ? 'Map' : 'Boots')), w.only ? seasonsSaid(w.only) : '', PLACES_AT[w.from] ? `From ${PLACES_AT[w.from]}` : ''].filter(Boolean);
      body += `<div class="item mr-walk${n ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${w.icon}</span><div><b>${esc(w.name)}${n ? ' ✓' : ''}</b><small>${esc(w.blurb)}</small></div></div>
        <div class="facts">${facts.map((f) => `<span>${esc(f)}</span>`).join('')}${n ? `<span class="up">Walked ${n === 1 ? 'once' : `${n} times`}</span>` : ''}</div>
        <div class="picks">${pick(`Walk it ${chip('time', `⏱ ${v.time}`)}`, 'moorWalk', id, why)}${why ? `<span class="note">${esc(why)}</span>` : ''}</div></div>`;
    }
    return { icon: '🥾', title: 'The moor walks', sub: `${done} of ${WALK_IDS.length} walked`, body };
  }
  const PLACES_AT = { stones: 'the Gossips', reservoir: 'the dam', halt: 'Sallow Halt', wood: 'Hollowell Wood', quarry: 'Blackrake', hall: 'Haverleigh', camp: 'Curlew Camp', observatory: 'the observatory', village: 'the Drovers' };

  // ---- the finds ----
  function moorFinds() {
    const L = kit.life, m = L.s.moor;
    const cells = FIND_IDS.map((id) => { const k = FINDS[id], n = m.finds[id] != null, sp = m.spare[id] || 0; return n ? `<span>${k.icon}<b>${esc(k.name)}</b><small>${sp ? `+${sp} spare` : 'Found'}</small></span>` : `<span class="unknown">❔<b>???</b><small>${k.where === 'quarry' ? (k.blast ? 'Blackrake, after a blast' : 'Blackrake') : 'On the moor'}</small></span>`; }).join('');
    let body = `<p class="lead">Fossils from Blackrake’s spoil heaps and its working face (best after rain, and best of all after a blasting day), and old things turned up on the moor walks. A second of anything goes in the spares box.</p><div class="things mr-finds">${cells}</div>`;
    body += actRow(L.look('moorSellSpares'));
    body += m.gifts.coll ? '<p class="fine">🏛️ Your collection is in its case at the town museum, by the window.</p>' : actRow(L.look('moorGiveFinds'));
    return { icon: '🐚', title: 'Finds', sub: `${L.moorFindsN()} of ${FIND_IDS.length} found`, body };
  }

  // ---- the star log ----
  function moorStars() {
    const L = kit.life, s = L.s, m = s.moor, q = L.season;
    const up = SKY_IDS.filter((id) => SKY[id].q.includes(q));
    let body = `<p class="lead">Dr Lamb’s book of the sky. On a clear night at the Askwith Observatory you find a shape among the stars and join it up; a good night logs it. What is up depends on the season: ${SEASONS[q].toLowerCase()} has ${up.map((id) => SKY[id].name).join(', ')}.</p>`;
    if (L.moorComet()) body += `<div class="item mine"><div class="item-top"><span class="act-ico">☄️</span><div><b>The comet is up</b><small>${m.cometSeen ? 'You have seen it through the big telescope.' : 'Go and see it through the big telescope before it goes, for three thousand years.'}</small></div></div></div>`;
    else if (m.cometSeen) body += '<p class="fine">☄️ You saw the comet, the one that will not be back for three thousand years.</p>';
    body += `<div class="mr-sky">${SKY_IDS.map((id) => { const k = SKY[id], got = m.stars[id] != null; return `<div class="mr-con${got ? ' got' : ''}${k.q.includes(q) ? ' up' : ''}">${skySvg(k, 'mr-chart')}<b>${got ? esc(k.name) : '???'}</b><small>${got ? 'Logged' : seasonsSaid(k.q)}</small></div>`; }).join('')}</div>`;
    if (m.bulletin) body += '<p class="fine">📰 Your name is in the Astronomical Bulletin, second, in small type, for the comet watch.</p>';
    if (L.moorMet('lamb')) body += `<h3>For the observatory</h3>${m.gifts.scope ? '<p class="fine">🔭 Your telescope is up under the dome, with your name on the brass plate.</p>' : actRow(L.look('moorScope'))}`;
    return { icon: '✨', title: 'Your star log', sub: `${L.moorStarsN()} of ${SKY_IDS.length} logged`, body };
  }

  // ---- Haverleigh Hall ----
  function moorHall() {
    const L = kit.life, s = L.s, h = s.moor.hall;
    const kitFace = kit.face(MOOR_FOLK.kit.look, MOOR_FOLK.kit.age, 40 + h.f / 2, 'f');
    let body = `<div class="item mine"><div class="item-top"><span class="ava mr-ava">${kitFace}</span><div><b>${h.ch ? 'Kit Askwith' : 'The Askwiths'}</b><small>${esc(h.gallery === 'press' ? 'The gates are shut to you, since the business with the painting.' : L.moorHallWord())}</small></div></div>${bar('🏰', 'Standing', h.f)}
      <p class="fine">Visiting the gardens (a little, at first), a good day’s work on the estate, the shoot, the fête and the match, and gifts to the estate all count. A year away and it fades.</p></div>`;
    // The story so far.
    body += '<h3>The Askwiths’ story</h3>';
    for (let i = 0; i < 5; i++) {
      const done = h.ch > i, next = h.ch === i;
      if (!done && !next) break;
      body += `<div class="mr-ch${done ? ' done' : ''}"><i>${done ? '✓' : '○'}</i><div><b>${esc(HALL_TITLES[i])}</b><small>${done ? chapterSaid(L, i) : h.gallery === 'press' ? 'There is no more of this story for you.' : h.f >= HALL_NEED[i] ? (s.t - h.at < 4 ? 'Soon. Give it a little time.' : 'Kit will want a word next time you are at the Hall.') : `When your standing is ${HALL_NEED[i]}.`}</small></div></div>`;
    }
    if (h.ch >= 5) body += `<p class="fine">${{ share: `You own half of Haverleigh: a share of the takings, about ${money(Math.round(h.share * 0.008 / 10) * 10)} a season, and a vote on the roof.`, trust: 'The Hall is in trust for the public, with you and Kit on its board.', hotel: 'The Larchmont Hotel Group own half of it now. Kit lives in the lodge.' }[h.end] || ''}</p>`;
    if (h.steward != null) body += `<p class="fine">🗝️ You are steward of the estate: ${money(1200)} a season, and a block of your time.</p>`;
    // The syndicate.
    if (h.gallery !== 'press') {
      body += `<h3>The shoot</h3>${h.synd != null ? `<p class="fine">You have a gun in the syndicate: ${money(SYND_FEE)} a season, shoot days in autumn and winter.${h.shot ? ` ${h.shot} days out so far.` : ''}</p>${actRow(L.look('moorSyndQuit'))}` : actRow(L.look('moorSynd'))}`;
      // Gifts.
      body += `<h3>A gift to the estate</h3><p class="fine">Once a year, if you like. The roof, the gardens, the long gallery: they need all of it.${h.given ? ` You have given ${money(h.given)} so far.` : ''}</p>`;
      body += [0, 1, 2].map((i) => actRow(L.look('moorGift', i))).join('');
    }
    return { icon: '🏰', title: 'Haverleigh Hall', sub: `The Askwiths · ${L.moorHallWord()}`, body };
  }
  const chapterSaid = (L, i) => {
    const h = L.s.moor.hall;
    return esc([
      h.tea != null ? 'You carried buckets, and gave Kit the idea for the tea room.' : 'You carried buckets in the long gallery.',
      'You had tea with the dowager, Lady Honoria, who cheats at patience.',
      { kept: 'You kept the secret of the Lady in Grey.', told: 'You helped Kit tell the story of the Lady in Grey herself.', press: 'You told the papers about the Lady in Grey.' }[h.gallery] || '',
      'Lady Honoria died, and left you her cards.',
      { share: 'You bought Hugo out.', trust: 'You led the appeal that put the Hall in trust.', hotel: 'The hotel people bought Hugo’s half.' }[h.end] || '',
    ][i]);
  };

  // ---- Fennick ----
  function moorFennick() {
    const L = kit.life, d = L.s.moor.drown;
    let body = '<p class="lead">Under Fennick Water is the village of Fennick, drowned in 1938 when the dam was finished. Its spire shows above the water in a drought year. Its bells were never found, and nor was Agnes Dyer, who would not leave.</p>';
    if (d.end) body += `<div class="item mine"><div class="item-top"><span class="act-ico">🔔</span><div><b>The bells of Fennick</b><small>${esc({ moorend: 'Found, and hung in the chapel tower at Moor End. They ring every year on the anniversary of the flood.', brigid: 'Found, and rung at St Brigid’s.', sold: 'Found, and sold to a man in a Bentley.' }[d.end] || '')}</small></div></div></div>`;
    const have = CLUE_IDS.filter((id) => d.clues[id] != null).sort((a, b) => d.clues[a] - d.clues[b]);
    body += '<h3>What you know</h3>';
    body += have.length ? have.map((id) => `<div class="mr-note"><b>${CLUES[id].icon} ${esc(CLUES[id].name)}</b><p>${esc(CLUES[id].text)}</p></div>`).join('') : '<p class="sub">Nothing yet but the story the Drovers tells on stormy nights.</p>';
    const left = CLUE_IDS.filter((id) => d.clues[id] == null);
    if (left.length && !d.end) body += `<h3>Still to find</h3>${left.map((id) => `<div class="mr-lead"><i>${CLUES[id].icon}</i><div><b>${esc(CLUES[id].name)}</b><small>${esc(CLUES[id].where)}</small></div></div>`).join('')}`;
    if (!d.end) body += `<p class="fine">${L.moorDriftReady() ? '🔦 You know where the bells are. Dot Henshaw at Blackrake could open up the old drift.' : 'Where the bells went is the heart of it: the empty tower first, then where they went.'}</p>`;
    return { icon: '💧', title: 'Fennick', sub: d.end ? 'Found' : `${have.length} of ${CLUE_IDS.length} found out`, body };
  }

  // ---- the Curlew Award ----
  function moorAward() {
    const L = kit.life, s = L.s, m = s.moor, who = L.moorAwardWho();
    let body = `<p class="lead">The Curlew Award: bronze, silver and gold, for walkers from ${AWARD_AGE[0]} to ${AWARD_AGE[1]}. Training days on the moor, then an expedition, which can be failed and tried again. Silver wants a map and compass, gold boots as well.</p>
      <div class="facts">${AWARD.map((a) => `<span>${a.icon} ${a.name}: ${a.train} training days, Fitness ${a.fit}</span>`).join('')}</div>`;
    for (const w of who) {
      const a = m.award[w.key] || { lvl: 0, tr: 0 }, lv = AWARD[Math.min(2, a.lvl)];
      const face = w.p ? kit.face(w.p.look, w.p.age, 60, w.p.sex) : kit.face(s.look, s.age, s.happy, s.sex), why = L.can('moorTrain', w.key), v = L.look('moorTrain', w.key);
      body += `<div class="item${a.lvl ? ' mine' : ''}"><div class="item-top"><span class="ava mr-ava">${face}</span><div><b>${esc(w.me ? 'You' : w.name)}${a.lvl ? ` ${AWARD[a.lvl - 1].icon}` : ''}</b><small>${a.lvl >= 3 ? 'Gold. The top of it.' : `${a.lvl ? `${AWARD[a.lvl - 1].name} done. ` : ''}Going for ${lv.name.toLowerCase()}: ${Math.min(a.tr, lv.train)} of ${lv.train} training days · Fitness ${Math.floor(w.fit)} of ${lv.fit}`}</small></div></div>
        ${a.lvl < 3 ? `<div class="picks">${pick(`${a.out != null ? 'Expedition planned' : 'A training day'} ${chip('time', `⏱ ${v.time}`)}`, 'moorTrain', w.key, why)}${why ? `<span class="note">${esc(why)}</span>` : ''}</div>` : ''}</div>`;
    }
    const past = Object.entries(m.award).filter(([key, a]) => a.lvl > 0 && !who.some((w) => w.key === key));
    if (past.length) body += `<h3>Awards won</h3>${past.map(([key, a]) => line(esc(key === 'me' ? 'You' : a.name || 'One of yours'), `${AWARD[a.lvl - 1].icon} ${AWARD[a.lvl - 1].name}`)).join('')}`;
    if (!who.length) body += '<p class="sub">Nobody in the family is the age for it just now.</p>';
    return { icon: '🧭', title: 'The Curlew Award', sub: 'Curlew Camp, Starling Moor', body };
  }

  // ---- the Me tab ----
  function me(L) {
    const m = L.s.moor;
    if (!m || (!m.n.trips && !L.moorFindsN() && !L.moorStarsN() && m.drown.on == null)) return '';
    let out = line('🥾 Walks on the moor', `${L.moorWalksDone()} of ${WALK_IDS.length}`) + line('🐚 Finds', `${L.moorFindsN()} of ${FIND_IDS.length}`) + line('✨ Stars logged', `${L.moorStarsN()} of ${SKY_IDS.length}`);
    if (m.hall.f > 0 || m.hall.ch) out += line('🏰 The Askwiths', esc(m.hall.gallery === 'press' ? 'Not speaking to you' : L.moorHallWord()));
    if (m.quarry.days) out += line('⛏️ Blackrake', `${QUARRY_RANKS[m.quarry.rank]}, ${m.quarry.days} day${m.quarry.days === 1 ? '' : 's'}`);
    if (m.drown.on != null) out += line('💧 Fennick', m.drown.end ? 'The bells are found' : `${L.moorClues()} of ${CLUE_IDS.length} found out`);
    const aw = Object.entries(m.award).filter(([, a]) => a.lvl > 0);
    for (const [key, a] of aw) out += line(`🧭 Curlew Award${key === 'me' ? '' : `: ${esc(a.name)}`}`, `${AWARD[a.lvl - 1].icon} ${AWARD[a.lvl - 1].name}`);
    if (m.cricket.caps) out += line('🏏 For Moor End', `${m.cricket.caps} match${m.cricket.caps > 1 ? 'es' : ''}, ${m.cricket.runs} runs`);
    if (m.fete.wins) out += line('🎪 Rosettes at the fête', m.fete.wins);
    const btns = [btn('moorWalks', '🥾 Walks'), btn('moorFinds', '🐚 Finds'), btn('moorStars', '✨ Stars'), m.hall.f > 0 || m.hall.ch ? btn('moorHall', '🏰 The Hall') : '', m.drown.on != null ? btn('moorFennick', '💧 Fennick') : '', L.moorAwardWho().length || aw.length ? btn('moorAward', '🧭 Award') : ''].join('');
    return `<div class="box"><h3>Starling Moor</h3>${out}<div class="mr-btns">${btns}</div></div>`;
  }

  // ---- the People tab ----
  function people(L) {
    const m = L.s.moor;
    if (!m) return '';
    const met = MOOR_FOLK_IDS.filter((id) => L.moorMet(id)).sort((a, b) => m.folk[b] - m.folk[a]);
    if (!met.length) return '';
    const h = m.hall;
    let out = `<h3 class="group">On the moor (${met.length})</h3>`;
    out += met.map((id) => {
      const k = MOOR_FOLK[id], v = m.folk[id];
      return `<div class="box person mr-person"><span class="ava">${kit.face(k.look, k.age, 40 + v / 2, k.sex)}</span><div><b>${esc(k.name)}</b><small>${esc(kitPlace[id])} · ${esc(L.moorWarmWord(id))}</small><span class="bondbar"><span style="width:${v}%"></span></span><small class="mr-up">${esc(k.up[L.season])}</small></div></div>`;
    }).join('');
    if (h.lady === 1) out += `<div class="box person mr-person"><span class="ava">${kit.face(ASKWITHS.lady.look, ASKWITHS.lady.age, 55, 'f')}</span><div><b>${esc(ASKWITHS.lady.name)}</b><small>Haverleigh Hall · the dowager</small><small class="mr-up">Playing patience in the morning room, and cheating.</small></div></div>`;
    return out;
  }
  const kitPlace = { kit: 'Haverleigh Hall', dot: 'Blackrake Quarry', lamb: 'The observatory', abel: 'Hollowell Wood', nance: 'Moor End post office', barn: 'The Gossips' };

  // ---- at the top of each place on the moor: what getting there costs ----
  function place(L, id) {
    if (!MOOR_PLACES.includes(id)) return '';
    const how = L.moorHow(), fog = L.s.wx === 'fog' && how !== 'car';
    let t;
    if (L.moorUp()) t = '🥾 You are up on the moor this season: no more time lost getting about.';
    else if (how === 'car') t = `🚗 You drive up: the moor costs you no extra time${L.s.wx === 'snow' ? ', thanks to the gritters on the bypass' : ''}.`;
    else if (how === 'bike') t = '🚲 You cycle up the moor road: no extra time.';
    else if (how === 'snow') t = '❄️ Snow has shut the moor road. Getting up on foot takes two blocks more, on top of the first thing you do up here this season.';
    else t = `🥾 Getting up onto the moor takes a block of time, on top of the first thing you do up here this season. ${how === 'push' ? 'A bicycle only helps the fit: it wants Fitness 40 for the hill.' : 'A car, or a bicycle and Fitness 40, gets you up quicker.'}`;
    if (fog && !L.moorUp()) t += ' There is fog on the moor: you may lose your way.';
    let out = `<p class="mr-trip">${t}</p>`;
    if (L.moorFire() && (id === 'wood' || id === 'stones')) out += '<p class="mr-trip warn">🔥 The heather is burning out here this season. The fire brigade have the lanes shut.</p>';
    if (id === 'reservoir' && L.moorDry()) out += '<p class="mr-trip good">⛪ A drought: the water is down, and the spire of Fennick is standing out of it.</p>';
    if (id === 'quarry' && L.moorBlast()) out += '<p class="mr-trip good">💥 A blasting day: more pay on the face, and the best fossil hunting there is.</p>';
    return out;
  }

  // ---- the map ----
  function marks(L) {
    const s = L.s, m = s.moor, out = [];
    if (!m) return out;
    if (L.moorBlast() && m.quarry.days > 0) out.push(['quarry', '💥']);
    if (L.moorDriftReady()) out.push(['quarry', '🔦']);
    if (L.moorComet() && !m.cometSeen) out.push(['observatory', '☄️']);
    if (L.moorDry() && !L.moorHasClue('spire')) out.push(['reservoir', '⛪']);
    if (L.moorHallNext()) out.push(['hall', '💬']);
    if (L.season === 1 && m.n.trips > 0 && !s.use.moorFete) out.push(['village', '🎪']);
    if (!L.can('moorRegister')) out.push(['library', '📜']);
    if (!L.can('moorPapers')) out.push(['hall', '🗝️']);
    return out;
  }
  // What has changed on the moor's map (art.js draws it).
  function scene(L) {
    const out = {};
    if (!L.s.moor) return out;
    if (L.moorDry()) out.moorDry = true;
    if (L.moorFire()) out.moorFire = true;
    if (L.moorComet()) out.moorComet = true;
    return out;
  }

  // ---- played by hand ----
  const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
  const play = (id, mini) => {
    const L = kit.life, why = L.can(id, 0.5);
    if (why) { kit.sfx('nope'); kit.toast(why); return; }
    kit.playMini(mini(L), (score) => { if (score != null && kit.life) kit.doAct(id, score); });
  };

  return {
    sheets: { moorWalks, moorFinds, moorStars, moorHall, moorFennick, moorAward },
    act: {
      moorForage: () => play('moorForage', (L) => ({ id: 'moorForage', title: 'Hollowell Wood', icon: '🍄', level: Math.min(4, Math.floor(L.s.moor.n.forage / 3)), ease: clampN(L.s.st.smarts / 140 + Math.max(0, L.s.moor.folk.abel) / 120, 0, 1), skill: 'Smarts' })),
      moorStargaze: () => { const L = kit.life; setSky(L.moorStarNext()); play('moorStargaze', () => ({ id: 'moorStars', title: 'The big telescope', icon: '🔭', level: Math.min(4, Math.floor(L.moorStarsN() / 3)), ease: L.moorStarEase(), skill: 'Smarts' })); },
      moorEstate: () => play('moorEstate', (L) => ({ id: 'moorWall', title: 'A length of wall', icon: '🪨', level: Math.min(4, Math.floor(L.s.moor.hall.f / 20)), ease: clampN(L.s.st.craft / 100, 0, 1), skill: 'Craft' })),
    },
    me,
    people,
    place,
    marks,
    scene,
    css: `${GAME_CSS}
.app { --heath: #b2c47e; --heath-hi: #a6bb72; --heather: #9aa36c; --bracken: #a9b86e; }
.app.s1 { --heath: #a9c06c; --heath-hi: #9cb65e; --heather: #b37fb8; --bracken: #8fae5a; }
.app.s2 { --heath: #cdb070; --heath-hi: #bfa060; --heather: #9a6a7a; --bracken: #c47c3a; }
.app.s3 { --heath: #eef2f4; --heath-hi: #e2e8ec; --heather: #d6dbe2; --bracken: #ddd7cd; }
#pTown.moor { background: linear-gradient(180deg, var(--sky1) 0 9%, var(--heath) 9%); }
.town .heath { fill: var(--heath); transition: fill .6s; }
.town .heath-hi { fill: var(--heath-hi); transition: fill .6s; }
.town .heather { fill: var(--heather); opacity: .85; transition: fill .6s; }
.town .bracken { fill: var(--bracken); opacity: .75; transition: fill .6s; }
.town .drystone { fill: none; stroke: #8d877c; stroke-width: 2.6; stroke-linecap: round; stroke-dasharray: 3.500 1.200; }
.town .gill { fill: none; stroke: var(--sea); stroke-width: 4; stroke-linecap: round; transition: stroke .6s; }
.town .rail-bed { fill: none; stroke: #8a7f72; stroke-width: 5; }
.town .rail { fill: none; stroke: #5a5148; stroke-width: 5; stroke-dasharray: 2 5; }
.town .viaduct { fill: #a49d90; }
.town .mud { fill: #a89270; }
.town .flame { fill: #ff7a2a; transform-box: fill-box; transform-origin: 50% 100%; animation: mr-flick .45s ease-in-out infinite alternate; }
.town .moorfire .f1 { animation-delay: .15s; } .town .moorfire .f2 { animation-delay: .3s; }
@keyframes mr-flick { from { transform: scaleY(.8); } to { transform: scaleY(1.15); } }
.town .smoke.big circle { fill: #8d877c; opacity: .5; }
.town .twinkle { fill: #fff; animation: mr-twinkle 2.4s ease-in-out infinite; }
.town .twinkle.t2 { animation-delay: 1.2s; }
@keyframes mr-twinkle { 50% { opacity: .15; } }
.town .signal { fill: #d94a4a; }
.map-go[hidden] { display: none; }
.map-down { top: auto; bottom: 1.5%; left: 50%; translate: -50% 0; white-space: nowrap; }
.mr-trip { margin: 2px 2px 8px; padding: 8px 10px; border-radius: 12px; background: #f1eadb; color: #6b6048; font-size: 13px; font-weight: 800; line-height: 1.35; }
.mr-trip.warn { background: #fde8e4; color: #9b2f25; }
.mr-trip.good { background: #e4f5ea; color: #1f7a4a; }
.mr-walk .picks .pick { min-height: 44px; }
.mr-finds span.unknown { opacity: .55; }
.mr-sky { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.mr-con { display: grid; justify-items: center; gap: 2px; padding: 8px 4px; border-radius: 12px; background: #fff; text-align: center; }
.mr-con b { font-size: 12px; font-weight: 900; line-height: 1.15; }
.mr-con small { font-size: 10.5px; font-weight: 800; color: var(--muted); line-height: 1.15; }
.mr-chart { width: 52px; height: 52px; }
.mr-chart line { stroke: #d6cdb8; stroke-width: 3; stroke-linecap: round; }
.mr-chart circle { fill: #c9c0aa; }
.mr-con.got { background: #1d2547; }
.mr-con.got b { color: #ffe27a; }
.mr-con.got small { color: #b9c2e0; }
.mr-con.got .mr-chart line { stroke: #ffe27a; }
.mr-con.got .mr-chart circle { fill: #fff; }
.mr-con.up:not(.got) { box-shadow: inset 0 0 0 2px #e6d8b8; }
.mr-ava { width: 44px; height: 44px; flex: none; border-radius: 50%; overflow: hidden; background: #fff; }
.mr-ava svg { width: 100%; height: 100%; display: block; }
.mr-ch { display: flex; gap: 10px; align-items: flex-start; padding: 7px 4px; border-bottom: 1px dashed #e4d9bf; }
.mr-ch i { font-style: normal; font-weight: 900; color: #9a8f78; width: 16px; }
.mr-ch.done i { color: var(--teal-d); }
.mr-ch div { display: grid; gap: 1px; }
.mr-ch b { font-size: 14px; font-weight: 900; }
.mr-ch small { font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.35; }
.mr-note { margin: 0 0 8px; padding: 10px 12px 10px 14px; border-radius: 4px; background: #fbf6e9; box-shadow: 0 2px 0 var(--line), inset 0 0 0 1px #e9dfc6, inset 4px 0 0 #6a9ab0; }
.mr-note b { display: block; font-size: 12px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; color: #4a6a7a; }
.mr-note p { margin: 4px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: 14.5px; line-height: 1.42; color: #2b2a26; }
.mr-lead { display: flex; gap: 10px; align-items: flex-start; padding: 8px 4px; border-bottom: 1px dashed #e4d9bf; }
.mr-lead i { font-style: normal; font-size: 22px; line-height: 1.1; opacity: .6; }
.mr-lead div { display: grid; gap: 1px; min-width: 0; }
.mr-lead b { font-size: 14px; font-weight: 900; }
.mr-lead small { font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.35; }
.mr-btns { display: grid; grid-template-columns: repeat(auto-fit, minmax(84px, 1fr)); gap: 6px; margin-top: 10px; }
.mr-btns .btn { min-height: 44px; padding: 8px 4px; font-size: 13.5px; white-space: nowrap; }
.mr-person { cursor: default; }
.mr-person small.mr-up { display: block; margin-top: 3px; font-weight: 700; }
`,
  };
}
