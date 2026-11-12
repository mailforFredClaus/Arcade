// New in Town: the people of the town, on screen. A Townsfolk section on
// the People tab (a face, hearts, what they are up to), a sheet for each of
// them (a chat, presents, what they like, their story so far, the favour
// they have asked and what they have given you), a Favours box on the Me
// tab, and badges on the map where a favour is waiting or somebody has
// something to ask. The rules are in folk.js.

import { FOLK, FOLK_IDS, FAVOURS, folkAt } from './folk.js';
import { PLACES } from './data.js';

// Something of their own, drawn over the face (64 by 64; the head sits at 32, 27).
const WEAR = {
  collar: '<rect x="27.5" y="43.6" width="9" height="3.4" rx="1.4" fill="#fff"/>',
  specs: '<g fill="none" stroke="#3d4a6b" stroke-width="1.3"><circle cx="26.5" cy="27" r="4.3"/><circle cx="37.5" cy="27" r="4.3"/><path d="M30.8 27h2.4"/></g>',
  flatcap: '<path d="M16.4 22a15.6 12.5 0 0 1 31.2 0z" fill="#6b5a44"/><path d="M15 21.2h28q8 0 10.5 3.2h-38.5z" fill="#4d4033"/>',
  peaked: '<path d="M15.6 21a16.4 11 0 0 1 32.8 0z" fill="#1f2a44"/><rect x="15.6" y="18.4" width="32.8" height="3.4" fill="#fff"/><path d="M18 21.6h28q-3 4.6-14 4.6t-14-4.6z" fill="#11151f"/><circle cx="32" cy="14.6" r="2" fill="#ffc93c"/>',
  beanie: '<path d="M16 22a16 15.5 0 0 1 32 0z" fill="#2f4a7a"/><rect x="15" y="18.6" width="34" height="5.4" rx="2.2" fill="#253c66"/><circle cx="32" cy="6.6" r="2.6" fill="#253c66"/>',
  smudge: '<path d="M37.6 31.6q2.8-1.4 5.2.6" stroke="#4a4a4a" stroke-width="1.7" fill="none" opacity=".55" stroke-linecap="round"/>',
  apron: '<path d="M24 50h16v14h-16z" fill="#fff" opacity=".9"/><path d="M24 50l-4-4M40 50l4-4" stroke="#fff" stroke-width="1.6"/>',
  bowtie: '<path d="M32 47.4l-5.4-3.2v6.4zM32 47.4l5.4-3.2v6.4z" fill="#b5432e"/><circle cx="32" cy="47.4" r="1.4" fill="#8a2f20"/>',
  sunhat: '<ellipse cx="32" cy="17.6" rx="23" ry="4.6" fill="#e8c36a"/><path d="M21 17.6a11 9.5 0 0 1 22 0z" fill="#f0d488"/><rect x="21" y="14.6" width="22" height="2.6" fill="#7cc36a"/>',
  scarf: '<path d="M21 43.4h22v5.6h-22z" fill="#2aa7b8"/><path d="M25 43.4h4v5.6h-4zM33 43.4h4v5.6h-4z" fill="#ffc93c"/><path d="M36 48.6h5v10h-5z" fill="#2aa7b8"/><path d="M36 52h5v2.6h-5z" fill="#ffc93c"/>',
  cravat: '<path d="M29 43.4h6l-1.2 4.2 2.2 6.4h-8l2.2-6.4z" fill="#b5432e"/>',
  chain: '<path d="M18.6 51.4Q32 62 45.4 51.4" stroke="#e8c36a" stroke-width="2.1" fill="none" stroke-dasharray="2.2 1.2"/><circle cx="32" cy="58" r="3.2" fill="#e8c36a" stroke="#b08a2a" stroke-width="1"/>',
};

const HEART = { love: '♥', like: '✓', meh: '·', hate: '✗' };
const AREA = (place) => (PLACES[place].area === 'hill' ? 'up the hill' : 'in the Bay');

export default function (kit) {
  const { esc, cashShort, actRow } = kit;
  const L = () => kit.life;

  // Their face, with whatever they always wear (the mayor’s chain only while he is mayor).
  function folkFace(id) {
    const life = L(), k = FOLK[id], p = life.folk(id);
    let svg = kit.face(k.look, k.age, 40 + p.f * 0.6, k.sex);
    const wear = k.wear === 'chain' && life.folkPennOut() ? null : k.wear;
    if (wear && WEAR[wear]) svg = svg.replace(/<\/svg>$/, `${WEAR[wear]}</svg>`);
    return svg;
  }
  // Five hearts, by halves.
  function hearts(f, big = false) {
    const halves = Math.round(f / 10);
    let out = '';
    for (let i = 0; i < 5; i++) out += `<i class="${halves >= i * 2 + 2 ? 'on' : halves === i * 2 + 1 ? 'half' : ''}">♥</i>`;
    return `<span class="fk-hearts${big ? ' big' : ''}" aria-label="${Math.round(f)} of 100">${out}</span>`;
  }
  const him = (id) => (FOLK[id].sex === 'm' ? 'him' : 'her');
  const placeName = (id) => PLACES[L().folkPlace(id)].name;

  // One favour, as a row.
  function favRow(v, open = true) {
    const life = L();
    const tag = open ? `button class="fk-fav" data-do="open" data-kind="folk_${v.who}"` : 'div class="fk-fav"';
    return `<${tag}><span class="act-ico">${v.icon}</span><span class="fk-fav-main"><b>${esc(v.title)}</b>
      <small>For ${esc(life.folkName(v.who))}, ${esc(v.where)}${v.due ? `, ${esc(v.due)}` : v.asked ? ` (${esc(v.asked)})` : ''}</small>
      ${FAVOURS[v.id].goal ? `<small class="${v.prog.ready ? 'fk-ok' : ''}">${v.prog.ready ? '✓ Ready to hand over' : esc(v.prog.text)}</small>` : ''}</span>${open ? '<i class="go">›</i>' : ''}</${open ? 'button' : 'div'}>`;
  }

  function sheet(id) {
    const life = L(), s = life.s, k = FOLK[id], p = life.folk(id), name = life.folkName(id), place = life.folkPlace(id);
    if (p.met == null) {
      return { icon: k.icon, title: name, sub: `${PLACES[place].name}, ${AREA(place)}`, body: `<p class="lead">${esc(life.folkBlurb(id))}</p><p class="sub">You have not met yet. You will find ${him(id)} ${esc(folkAt(place))}, ${AREA(place)}.</p>` };
    }
    const shut = life.folkShut(id), fav = life.folkFavours().find((v) => v.who === id);
    let body = `<div class="fk-top">${hearts(p.f, true)}<div><b>${esc(life.folkWord(p.f))}</b><small>Friendship ${Math.round(p.f)} of 100${s.t - (p.seen ?? s.t) >= 2 ? ' · fading: you have not called lately' : ''}</small></div></div>
      <p class="lead">${esc(life.folkBlurb(id))}</p>
      <p class="fine">📍 ${esc(folkAt(place).replace(/^./, (c) => c.toUpperCase()))}, ${AREA(place)}. ${esc(life.folkUp(id))}</p>`;
    if (shut) body += `<div class="item fk-shut"><p class="sub">${esc(shut)}</p></div>`;
    if (fav) {
      body += `<h3>The favour ${FOLK[id].sex === 'm' ? 'he' : 'she'} asked</h3>${favRow(fav, false)}`;
      // (Something to bring is handed over here, once you have it; a deed is done where it is done.)
      if (FAVOURS[fav.id].goal) { if (fav.prog.ready) body += actRow(life.look(`fv_${fav.id}`)); }
      else body += `<p class="fine">It is done ${esc(fav.where)}: go there, and you will find it under Favours.</p>`;
    }
    body += `<h3>Call</h3>${actRow(life.look(id === 'marlow' ? 'marlow' : `fkChat_${id}`))}`;
    // Presents.
    const gifts = life.folkGifts(id);
    body += `<h3>Give a present</h3><div class="things cur fk-gifts">${gifts.map((g) => {
      const x = esc(JSON.stringify({ w: id, g: g.g })), why = g.why || null;
      const n = g.g.startsWith('c:') ? s.curios[g.g.slice(2)] : g.g === 'fish' ? life.folkFish() : g.g === 'honey' ? s.folk.bag.honey : g.g === 'painting' ? s.paintings : 1;
      const tag = g.cost ? cashShort(g.cost) : n > 1 ? `Yours ×${n}` : 'Yours';
      return `<button data-do="act" data-id="folkGive" data-x="${x}"${why ? ` data-why="${esc(why)}"` : ''} class="${why ? 'off' : ''}">${g.icon}<small>${esc(g.name)}</small><em>${tag}</em>${g.known ? `<i class="fk-k ${g.known}">${HEART[g.known]}</i>` : ''}</button>`;
    }).join('')}</div><p class="fine">One present a season. Give something and you learn what ${life.folkCall(id)} thinks of it: ♥ loves, ✓ likes, · does not mind, ✗ cannot abide. The same thing twice running counts for less.</p>`;
    // What you know of their tastes.
    const t = life.folkTastes(id), row = (label, list, cls) => (list.length ? `<span class="${cls}">${label} ${list.map((v) => `${v.icon} ${esc(v.said)}`).join(', ')}</span>` : '');
    const known = row('♥ Loves', t.love, 'up') + row('✓ Likes', t.like, '') + row('· Does not mind', t.meh, '') + row('✗ Cannot abide', t.hate, 'down');
    body += `<h3>What ${esc(life.folkCall(id))} likes</h3>${known ? `<div class="facts fk-tastes">${known}</div>` : '<p class="sub">You have yet to find out. A present is the way.</p>'}`;
    // The story so far.
    const story = life.folkStory(id), next = story.find((c) => !c.done);
    body += `<h3>${esc(name)}’s story</h3><div class="fk-story">${story.filter((c) => c.done).map((c) => `<p><b>${c.n}. ${esc(c.title)}</b><small>${esc(c.said)}</small></p>`).join('')}
      ${next ? `<p class="fk-next"><b>${next.n}. ?</b><small>${p.stage === 0 && (id === 'marlow' || id === 'parg') ? (id === 'marlow' ? 'Chat with him on the quay.' : 'Keep an allotment going, and she will be along.') : next.need && p.f < next.need ? `When you know each other better (${hearts(next.need)}).` : fav ? 'When the favour is done.' : (id === 'marlow' && s.f.marlow < 3) || (id === 'parg' && p.stage < 3) ? 'It will come, in its own time.' : 'Soon: call, and see.'}</small></p>` : '<p class="fk-next"><small>That is the whole of it.</small></p>'}</div>`;
    // What lasts.
    const boons = life.folkBoons(id), keeps = life.folkKeeps(id);
    if (boons.length || keeps.length) {
      body += `<h3>What you have from ${esc(life.folkCall(id))}</h3>${boons.map((b) => `<div class="fk-boon${b.on ? '' : ' lapsed'}"><span>${b.icon}</span><div><b>${esc(b.name)}</b><small>${esc(b.said)}${b.on ? '' : b.keep ? ' (Lapsed: you have drifted apart. Call again.)' : ''}</small></div></div>`).join('')}
        ${keeps.map((v) => `<div class="fk-boon"><span>${v.icon}</span><div><b>${esc(v.name)}</b><small>${esc(v.said)}</small></div></div>`).join('')}`;
    }
    return { icon: folkFace(id), title: name, sub: `${life.folkWord(p.f)} · ${PLACES[place].name}`, body };
  }

  const sheets = Object.fromEntries(FOLK_IDS.map((id) => [`folk_${id}`, () => sheet(id)]));

  function people(life) {
    const met = FOLK_IDS.filter((id) => life.folk(id).met != null).sort((a, b) => life.folk(b).f - life.folk(a).f);
    const unmet = FOLK_IDS.filter((id) => life.folk(id).met == null);
    let out = `<h3 class="group">Townsfolk (${met.length} of ${FOLK_IDS.length})</h3>`;
    out += met.map((id) => {
      const p = life.folk(id), ask = !!life.folkNext(id), fav = !!life.folkFav(id);
      return `<button class="box person fk-card" data-do="open" data-kind="folk_${id}"><span class="ava">${folkFace(id)}</span>
        <div><b>${esc(life.folkName(id))}${ask ? ' <i class="fk-badge">💬</i>' : fav ? ' <i class="fk-badge">🤝</i>' : ''}</b><small>${esc(placeName(id))} · ${esc(life.folkWord(p.f))}</small>${hearts(p.f)}<small class="fk-up">${esc(life.folkUp(id))}</small></div><i class="go">›</i></button>`;
    }).join('');
    if (unmet.length) {
      const where = (id) => (id === 'parg' ? 'at the allotments in Pebble Park, once you have something growing there' : id === 'marlow' ? 'on the quay at the harbour, mending nets' : `${folkAt(life.folkPlace(id))}, ${AREA(life.folkPlace(id))}`);
      out += `<div class="box fk-unmet"><p class="sub">${met.length ? 'Still to meet' : 'The people who make Starling Bay what it is. Call on them, and you will get to know them, and their stories'}:</p>${unmet.map((id) => `<p class="fk-who"><span>${FOLK[id].icon}</span><span><b>${esc(life.folkName(id))}</b>, ${esc(where(id))}</span></p>`).join('')}</div>`;
    }
    return out;
  }

  function me(life) {
    const fk = life.s.folk;
    if (!FOLK_IDS.some((id) => life.folk(id).met != null)) return '';
    const favs = life.folkFavours(), keeps = life.folkKeeps();
    return `<div class="box fk-me"><h3>Favours</h3>${favs.length ? favs.map((v) => favRow(v)).join('') : '<p class="sub">Nobody has asked you anything just now. As the townsfolk get to know you, they will.</p>'}
      ${fk.done || fk.failed ? `<p class="fine">${fk.done} done${fk.failed ? `, ${fk.failed} let slip` : ''}.</p>` : ''}
      ${keeps.length ? `<h4>Keepsakes</h4><div class="things">${keeps.map((v) => `<span title="${esc(v.said)}">${v.icon}<small>${esc(v.name)}</small></span>`).join('')}</div>` : ''}</div>`;
  }

  // A badge where a favour can be done, or somebody has something to ask.
  function marks(life) {
    const out = [], seen = new Set(), add = (place, e) => { if (!seen.has(place + e)) { seen.add(place + e); out.push([place, e]); } };
    for (const v of life.folkFavours()) if (!FAVOURS[v.id].goal || v.prog.ready) add(FAVOURS[v.id].goal ? life.folkPlace(v.who) : FAVOURS[v.id].at, '🤝');
    for (const id of FOLK_IDS) if (life.folkNext(id)) add(life.folkPlace(id), '💬');
    return out;
  }

  const css = `
.fk-hearts { display: inline-flex; gap: 1px; font-style: normal; line-height: 1; margin-top: 3px; }
.fk-hearts i { font-style: normal; font-size: 13px; color: #e6d8c8; }
.fk-hearts i.on { color: #f2788a; }
.fk-hearts i.half { background: linear-gradient(90deg, #f2788a 50%, #e6d8c8 50%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.fk-hearts.big i { font-size: 24px; }
.fk-top { display: flex; align-items: center; gap: 12px; margin-top: 6px; }
.fk-top > div { display: grid; }
.fk-top b { font-size: 16px; font-weight: 900; }
.fk-top small { font-size: 12.5px; font-weight: 700; color: var(--muted); }
.fk-card .fk-up { margin-top: 3px; line-height: 1.3; }
.fk-badge { font-style: normal; font-size: 13px; }
.fk-unmet { display: grid; gap: 4px; }
.fk-who { display: flex; align-items: baseline; gap: 6px; font-size: 13px; font-weight: 700; color: var(--muted); margin: 0; line-height: 1.35; }
.fk-who > span:first-child { flex: none; width: 22px; text-align: center; }
.fk-who b { font-size: 14px; font-weight: 800; color: var(--ink, #1f2a44); }
.fk-fav { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 9px 10px; margin: 0 0 8px; border: 0; border-radius: 16px; background: #fff; box-shadow: 0 2px 0 var(--line); font: inherit; color: inherit; }
button.fk-fav:active { transform: translateY(2px); box-shadow: none; }
.fk-fav-main { flex: 1; min-width: 0; display: grid; gap: 1px; }
.fk-fav-main b { font-size: 14.5px; font-weight: 800; line-height: 1.25; }
.fk-fav-main small { font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.3; }
.fk-fav-main small.fk-ok { color: var(--good); }
.fk-gifts { margin-top: 6px; }
.fk-gifts button { position: relative; min-height: 76px; }
.fk-gifts button.off { opacity: .5; }
.fk-gifts small { font-size: 10px; }
.fk-k { position: absolute; top: 3px; right: 5px; font-style: normal; font-size: 12px; font-weight: 900; color: #9a8f78; }
.fk-k.love { color: #e2506a; }
.fk-k.like { color: var(--good); }
.fk-k.hate { color: var(--bad); }
.fk-tastes span.up { background: #fde4e8; color: #b8364f; }
.fk-tastes span.down { background: #f3e3e0; color: var(--bad); }
.fk-story p { margin: 0 0 7px; display: grid; gap: 1px; padding-left: 10px; border-left: 3px solid #f2788a; }
.fk-story b { font-size: 14px; font-weight: 800; }
.fk-story small { font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.35; }
.fk-story p.fk-next { border-left-color: #e6d8c8; }
.fk-story p.fk-next .fk-hearts i { font-size: 11px; }
.fk-boon { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.fk-boon > span { font-size: 22px; width: 34px; text-align: center; flex: none; }
.fk-boon > div { display: grid; gap: 1px; }
.fk-boon b { font-size: 14px; font-weight: 800; }
.fk-boon small { font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.3; }
.fk-boon.lapsed { opacity: .55; }
.fk-shut { background: #fff1ee; }
.fk-me h4 { margin: 10px 0 6px; }
`;

  return { sheets, people, me, marks, css };
}

