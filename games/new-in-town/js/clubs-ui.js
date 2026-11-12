// New in Town: the clubs’ screen. A Clubs box on the Me tab, a sheet for
// each club (standing, rank, what the next rank needs, the members you know,
// the trophy cabinet), a sheet of all six, and the library’s reading list.
// The big occasions and practice nights are played by hand first (the games
// are in clubs-games.js); the rules are in clubs.js.

import { CLUBS, CLUB_IDS, BOOKS, BOOK_IDS, BOOK_KINDS, CLUB_READS, VETS_AGE } from './clubs.js';
import { PLACES, SEASONS, STAT_NAME } from './data.js';
import { GAME_CSS } from './clubs-games.js';

const cap = (t) => t[0].toUpperCase() + t.slice(1);
const GAME_NAME = { clubPens: 'a penalty shoot-out', clubHymn: 'holding your note', clubLines: 'learning your lines', clubTack: 'racing on the wind shifts', clubQuiz: 'eight questions', clubBooks: 'eight questions on books' };

export default function (kit) {
  const { esc, money, pick, needChips, face, actRow, sections } = kit;

  // When the club’s big day is, from where you stand.
  const when = (life, id) => {
    const o = life.clubOcc(id), here = life.season;
    if (id === 'rovers' && life.clubMem(id) && !o.open && here !== 1) return life.clubCupWord().replace(/\.$/, '');
    if (o.open) return `${cap(o.name)} is this ${SEASONS[o.season].toLowerCase()}`;
    return `${cap(o.name)}: ${o.season > here ? 'this' : 'next'} ${SEASONS[o.season].toLowerCase()}`;
  };
  const bar = (ico, label, v, cls = '') => `<div class="skill cl-bar ${cls}"><i>${ico}</i><span>${esc(label)}</span><span class="bar"><span style="width:${Math.max(0, Math.min(100, v))}%"></span></span><b>${Math.round(v)}</b></div>`;
  // What a book leaves behind, in a few words.
  const gives = (b) => {
    const g = b.give || {}, out = [];
    for (const k of Object.keys(g.st || {})) out.push(STAT_NAME[k]);
    for (const k of Object.keys(g.sk || {})) out.push(CLUBS[k].skill);
    if (g.fav) out.push('a lasting lift');
    if (g.sleep) out.push('better sleep');
    if (g.karma) out.push('your good name');
    return out.join(', ');
  };
  // The club’s own rows (night, practice, the occasion, the top job), as on its place’s sheet.
  const rows = (life, id) => life.placeActions(CLUBS[id].place).filter((a) => a.sec === CLUBS[id].sec && a.id !== `clubAbout_${id}`);

  function clubSheet(id) {
    const life = kit.life, s = life.s, c = CLUBS[id], m = life.clubMem(id), o = life.clubOcc(id), sk = life.clubSkill(id);
    let body = `<p class="lead">${esc(c.blurb)}</p>`;
    if (m) {
      const need = life.clubNeeds(id), part = life.clubPart(id);
      const role = id === 'rovers' ? { play: 'Plays for the first team', vets: `Plays for the veterans (over ${VETS_AGE})`, coach: 'Coaches the side' }[m.mode] : '';
      body += `<div class="item mine"><div class="item-top"><span class="act-ico">${c.icon}</span><div><b>${esc(cap(c.ranks[m.r]))}</b><small>${esc(life.clubStandWord(id))} · ${m.n} club night${m.n === 1 ? '' : 's'}${role ? ` · ${role}` : ''}</small></div></div>
        ${bar('🤝', 'Standing', m.st)}${bar(c.icon, c.skill, sk, 'own')}
        ${m.miss ? `<p class="fine warn">They have not seen you for ${m.miss} season${m.miss > 1 ? 's' : ''}. Standing slips every season you stay away, and after a year and a half they stop expecting you.</p>` : ''}
        ${need ? `<p class="sub">Next: <b>${esc(cap(c.ranks[m.r + 1]))}</b>. ${esc(c.opens[m.r + 1])}</p><div class="needs">${needChips(need)}</div>` : `<p class="sub">You are at the top. ${esc(c.opens[m.r])}</p>`}
      </div>`;
      body += `<p class="fine pad">${esc(when(life, id))}. ${part > 0 ? `Your part: played by hand (${GAME_NAME[o.game]}).` : part < 0 ? 'You pick the team talk.' : 'You have no part to play in it yet.'}</p>`;
      body += sections(rows(life, id));
      if (life.s.clubs.past[id] && life.s.clubs.past[id].r > m.r) body += `<p class="fine pad">You were ${esc(c.ranks[life.s.clubs.past[id].r])} once.</p>`;
    } else {
      body += `<div class="facts"><span>Meets at ${esc(PLACES[c.place].name)}</span><span>${c.fee ? `${money(c.fee)} to join` : 'Free to join'}</span><span>${money(c.subs)} a year</span><span>Trains ${esc(c.skill)} and ${STAT_NAME[c.stat]}</span></div>`;
      body += `<p class="fine pad">${esc(when(life, id))}, played by hand (${GAME_NAME[c.occ.game]}) once you have a part.${life.clubSkill(id) ? ` You have ${esc(c.skill)} ${Math.round(life.clubSkill(id))} already.` : ''}</p>`;
      body += actRow(life.look(`clubJoin_${id}`));
    }
    body += `<h3>The ranks</h3>${c.ranks.map((r, i) => `<div class="rung${m && m.r === i ? ' now' : ''}"><b>${i + 1}. ${esc(cap(r))}</b><span>${c.parts[i] ? '★'.repeat(c.parts[i]) : ''}</span><div><small class="cl-opens">${esc(c.opens[i] || 'Where everybody starts.')}</small></div></div>`).join('')}
      <p class="fine">Each rank needs standing, ${esc(c.skill)} and club nights. The stars are your part in ${esc(o.name)}.</p>`;
    const fr = life.clubFriends(id);
    body += `<h3>Members you know</h3>${fr.length ? fr.map((p) => `<button class="act cl-mate" data-do="person" data-id="${p.id}"><span class="ava">${face(p.look, p.age, 40 + p.bond * 0.6, p.sex)}</span><span class="act-main"><b>${esc(p.name)}</b><small>Bond ${Math.round(p.bond)}</small></span><span class="act-cost"><i class="go">›</i></span></button>`).join('') : '<p class="fine pad">Nobody you know yet. Turn up, and you will get talking.</p>'}`;
    const cab = s.clubs.cab.filter((e) => e.c === id);
    body += `<h3>The trophy cabinet</h3>${cab.length ? `<div class="things cl-cab">${cab.map((e) => `<span>${e.icon}<small>${esc(cap(e.name))}<br>at ${e.a}</small></span>`).join('')}</div>` : `<p class="fine pad">Empty, for now. ${esc(cap(o.prize))} would look well in it.</p>`}`;
    // (Years of standing go with it, so it asks twice.)
    if (m) body += `<div class="picks mid"><button class="pick quiet" data-do="clubLeaveAsk" data-club="${id}">Leave the club</button></div>`;
    return { icon: c.icon, title: c.name, sub: m ? `You are ${c.ranks[m.r]}` : `Meets at ${PLACES[c.place].name}`, body };
  }

  const sheets = {
    clubsAll() {
      const life = kit.life;
      let body = '<p class="lead">Six clubs meet about the town. Join one and turn up about once a season: your standing grows, and a skill of its own, and the ranks open up a part in the club’s big day of the year. Stay away and they stop expecting you.</p>';
      for (const id of CLUB_IDS) {
        const c = CLUBS[id], m = life.clubMem(id);
        body += `<button class="item cl-club${m ? ' mine' : ''}" data-do="clubOpen" data-club="${id}"><div class="item-top"><span class="act-ico">${c.icon}</span><div><b>${esc(c.name)}</b><small>${m ? `You are ${esc(c.ranks[m.r])}` : `${esc(PLACES[c.place].name)} · ${c.fee ? money(c.fee) : 'free'} to join, ${money(c.subs)} a year`}</small></div><i class="go">›</i></div>
          <div class="facts"><span>${c.occ.icon} ${esc(cap(c.occ.name))}, every ${SEASONS[c.occ.season].toLowerCase()}</span><span>${esc(c.skill)}</span></div></button>`;
      }
      return { icon: '📋', title: 'Clubs and societies', sub: `You belong to ${Object.keys(life.s.clubs.m).length || 'none'} of the six`, body };
    },
    readingList() {
      const life = kit.life, s = life.s, c = s.clubs, now = life.bookNow(), book = life.clubMem('book');
      let body = `<p class="lead">Miss Achterberg’s list: ${BOOK_IDS.length} books worth the time. Borrow one (the card is free), read it at home, two sittings a season at most, and finish it within the year. Each leaves something behind the first time: a skill, a habit, a lasting lift.</p>`;
      if (now) {
        body += `<div class="item mine"><div class="item-top"><span class="act-ico">📖</span><div><b>${esc(now.t)}</b><small>${esc(now.by)} · ${now.p} of ${now.len} sittings</small></div></div>
          <div class="cl-prog">${Array.from({ length: now.len }, (_, i) => `<i class="${i < now.p ? 'on' : ''}"></i>`).join('')}</div>
          ${actRow(life.look('bookRead'))}<div class="picks">${pick('Take it back', 'bookReturn', undefined, null, 'quiet')}</div></div>`;
      }
      if (book) {
        // (The club meets on each book twice, over two seasons: half of it read will do. See bookOfSeason in clubs.js.)
        const ia = life.bookOfSeason(), ib = life.bookOfSeason(life.bookNextAt()), a = BOOKS[ia], b = BOOKS[ib], both = life.bookNextAt() - s.t > 1;
        const mark = (id) => { const p = life.bookPart(id); return p >= 1 ? ' ✓' : p >= 0.5 ? ' (half read)' : ''; };
        body += `<div class="item"><div class="item-top"><span class="act-ico">☕</span><div><b>The book club</b><small>${both ? 'This season and next' : 'This season'}: ${esc(a.t)}${mark(ia)}. Then: ${esc(b.t)}${mark(ib)}. Half a book read is enough to hold your own.</small></div></div>${book.r >= 3 ? '<p class="fine">You choose the books: tap “Choose” on any novel below to make it the next one.</p>' : ''}</div>`;
      }
      for (const [kind, name] of Object.entries(BOOK_KINDS)) {
        body += `<h3>${name}</h3>`;
        for (const id of BOOK_IDS.filter((k) => BOOKS[k].kind === kind)) {
          const b = BOOKS[id], read = c.read[id], out = c.book && c.book.id === id, why = life.can('bookBorrow', id);
          const choose = book && book.r >= 3 && CLUB_READS.includes(id) ? pick('Choose', 'bookChoose', id, life.can('bookChoose', id), 'quiet') : '';
          body += `<div class="cl-book${read ? ' read' : ''}${out ? ' out' : ''}"><div><b>${esc(b.t)}${read ? ' <em>✓</em>' : ''}</b><small>${esc(b.by)} · ${b.len} sittings${c.prog[id] ? ` · ${c.prog[id]} read` : ''}</small><p>${esc(b.blurb)}</p><small class="cl-gives">${read ? `Read at ${read.a}${read.again ? `, and again since` : ''}` : `Good for: ${esc(gives(b))}`}</small></div>
            <div class="cl-bk">${out ? '<span class="note">Out now</span>' : pick(read ? 'Read again' : 'Borrow', 'bookBorrow', id, why, read ? 'quiet' : '')}${choose}</div></div>`;
        }
      }
      const log = Object.entries(c.read).sort((p, q) => p[1].t - q[1].t);
      body += `<h3>Your reading log</h3>${log.length ? log.map(([id, r]) => `<p class="cl-log"><b>${r.a}</b> ${esc(BOOKS[id].t)}, <i>${esc(BOOKS[id].by)}</i></p>`).join('') : '<p class="fine pad">Nothing yet. Every book you finish goes down here.</p>'}`;
      return { icon: '📚', title: 'The reading list', sub: `${life.booksRead()} of ${BOOK_IDS.length} read${now ? ` · reading ${now.t}` : ''}`, body };
    },
  };
  for (const id of CLUB_IDS) sheets[`club_${id}`] = () => clubSheet(id);

  // An occasion or a practice night: the game first, then the action with how it went.
  const play = (id, what) => {
    const life = kit.life, act = `club${what === 'occ' ? 'Occ' : 'Drill'}_${id}`, why = life.can(act, 0.5);
    if (why) { kit.sfx('nope'); kit.toast(why); return; }
    // (No part to play, or managing from the touchline: nothing to play.)
    if (what === 'occ' && life.clubPart(id) <= 0) { kit.doAct(act, null); return; }
    kit.playMini(life.clubGame(id, what), (score) => { if (score != null && kit.life) kit.doAct(act, score); });
  };
  const act = {};
  for (const id of CLUB_IDS) { act[`clubOcc_${id}`] = () => play(id, 'occ'); act[`clubDrill_${id}`] = () => play(id, 'drill'); }

  return {
    sheets,
    act,
    do: {
      clubOpen(el) { kit.sfx('tap'); kit.openSheet({ kind: `club_${el.dataset.club}` }); },
      clubLeaveAsk(el) {
        if (el.dataset.sure) { kit.doAct('clubLeave', el.dataset.club); return; }
        kit.sfx('tap'); el.dataset.sure = '1'; el.textContent = 'Tap again to leave';
        setTimeout(() => { if (el.isConnected) { delete el.dataset.sure; el.textContent = 'Leave the club'; } }, 2500);
      },
    },
    marks(life) { return CLUB_IDS.filter((id) => life.clubOcc(id).open).map((id) => [CLUBS[id].place, CLUBS[id].occ.icon]); },
    // Friends made through a club, by club (they are in the lists above too).
    people(life) {
      const groups = CLUB_IDS.map((id) => [id, life.clubFriends(id)]).filter(([, l]) => l.length);
      if (!groups.length) return '';
      return `<h3 class="group">Through your clubs</h3><div class="box cl-people">${groups.map(([id, l]) => `<div class="cl-pgroup"><b>${CLUBS[id].icon} ${esc(CLUBS[id].name)}</b><div>${l.map((p) => `<button class="pick quiet" data-do="person" data-id="${p.id}">${esc(p.name.split(' ')[0])}</button>`).join('')}</div></div>`).join('')}</div>`;
    },
    me(life) {
      const c = life.s.clubs, mine = Object.keys(c.m), now = life.bookNow();
      let html = '<div class="box cl-me"><h3>Clubs and reading</h3>';
      html += mine.length ? mine.map((id) => {
        const k = CLUBS[id], m = c.m[id];
        return `<button class="cl-row" data-do="clubOpen" data-club="${id}"><i>${k.icon}</i><span><b>${esc(k.name)}</b><small>${esc(cap(k.ranks[m.r]))} · ${esc(when(life, id))}</small><span class="bar"><span style="width:${m.st}%"></span></span></span><em class="go">›</em></button>`;
      }).join('') : '<p class="sub">You belong to no club. The choir meets at St Brigid’s, the Players at the Pavilion, the Rovers at their ground, the book club at the library, the sailing club at the harbour, and the quiz team at the Gull & Anchor.</p>';
      html += `<div class="line"><span>${now ? `📖 Reading ${esc(now.t)}` : '📚 Books read'}</span><b>${now ? `${now.p} of ${now.len}` : `${life.booksRead()} of ${BOOK_IDS.length}`}</b></div>`;
      if (c.cab.length) html += `<div class="line"><span>🏆 Club silverware</span><b>${c.cab.length}</b></div>`;
      html += '<div class="cl-btns"><button class="btn btn-soft" data-do="open" data-kind="clubsAll">📋 All the clubs</button><button class="btn btn-soft" data-do="open" data-kind="readingList">📚 Reading list</button></div></div>';
      return html;
    },
    css: `${GAME_CSS}
.cl-bar > span:nth-child(2) { width: auto !important; flex: 0 0 96px; font-size: 13px; }
.cl-bar.own .bar > span { background: var(--sun); }
.fine.warn { color: var(--bad); }
.cl-opens { font-size: 12px; font-weight: 700; color: var(--muted); }
.cl-mate { margin-top: 6px; }
.cl-mate .ava { width: 40px; height: 40px; }
.cl-cab { grid-template-columns: repeat(3, 1fr); }
.cl-cab span { box-shadow: 0 2px 0 var(--line); font-size: 28px; }
.cl-club { display: block; width: 100%; text-align: left; }
.cl-club .go { font-style: normal; font-weight: 900; color: var(--muted); }
.cl-prog { display: flex; gap: 5px; margin: 8px 0 2px; }
.cl-prog i { flex: 1; height: 8px; border-radius: 4px; background: #efe6d3; }
.cl-prog i.on { background: var(--teal); }
.cl-book { display: flex; gap: 10px; align-items: center; padding: 10px; margin-bottom: 7px; border-radius: 14px; background: #fff; box-shadow: 0 2px 0 var(--line); }
.cl-book > div:first-child { flex: 1; min-width: 0; display: grid; gap: 2px; }
.cl-book b { font-size: 14.5px; font-weight: 900; line-height: 1.25; }
.cl-book b em { font-style: normal; color: var(--good); }
.cl-book small { font-size: 12px; font-weight: 700; color: var(--muted); }
.cl-book p { margin: 2px 0 0; font-size: 12.5px; font-weight: 600; color: #4d566e; line-height: 1.35; }
.cl-book .cl-gives { color: var(--teal-d); font-weight: 800; }
.cl-book.read { background: #f7fbf6; }
.cl-book.out { box-shadow: 0 0 0 2.5px var(--teal); }
.cl-bk { flex: none; display: grid; gap: 6px; justify-items: end; }
.cl-bk .pick { min-height: 44px; }
.cl-log { margin: 4px 2px; font-size: 13px; font-weight: 700; color: #4d566e; }
.cl-log b { display: inline-block; min-width: 26px; color: var(--teal-d); }
.cl-me .cl-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 0; text-align: left; border-bottom: 1.5px solid var(--line); }
.cl-row > i { font-style: normal; font-size: 24px; width: 34px; text-align: center; }
.cl-row > span { flex: 1; min-width: 0; display: grid; gap: 1px; }
.cl-row b { font-size: 14.5px; font-weight: 800; }
.cl-row small { font-size: 12.5px; font-weight: 700; color: var(--muted); }
.cl-row .bar { height: 6px; margin-top: 4px; }
.cl-row .bar > span { background: var(--teal); }
.cl-row .go { font-style: normal; font-weight: 900; color: var(--muted); }
.cl-pgroup + .cl-pgroup { margin-top: 10px; }
.cl-pgroup b { font-size: 13.5px; font-weight: 900; }
.cl-pgroup > div { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.cl-pgroup .pick { min-height: 44px; }
.cl-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.cl-btns .btn { min-height: 44px; font-size: 14px; }
`,
  };
}
