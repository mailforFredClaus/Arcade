// New in Town: the screen. Shows the life in engine.js: the town map, the
// sheets that slide up for places and people, the cards for events, the
// start of a life and the end of one. Nothing here decides anything; it
// asks the Life what can be done and shows what happened.

import { Life } from './engine.js';
import {
  money, cashShort, SEASONS, SEASON_ICON, STATS, STAT_NAME, STAT_ICON, PLACES, CAREERS, COURSES, HOMES, ITEMS,
  STOCKS, PROPS, PETS, TRAITS, BACKGROUNDS, LOOKS, DREAMS, QUESTS, TROPHIES, RIBBONS, RIBBON, NAMES, SAVINGS_RATE, LOAN_RATE,
} from './data.js';
import { townSvg, face, spark, placeTier } from './art.js';
import { store, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, confetti, toast, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (p) => `${Math.round(p * 100)}%`;
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;
$('sheetBackBtn').innerHTML = ICON.back;

// ---- saved things -----------------------------------------------------------------------

// life: the one being lived. meta: kept across every life (trophies,
// ribbons, the family's history). next: what the next life starts with.
const SAVE_KEY = 'newintown';
const save = Object.assign({ life: null, next: null, card: null }, store.get(SAVE_KEY, {}) || {});
save.meta = Object.assign({ lives: 0, ribbons: {}, ach: {}, best: 0, hall: [] }, save.meta || {});
let life = save.life ? new Life(save.life) : null;

function persist() {
  save.life = life ? life.s : null;
  if (life) {
    Object.assign(save.meta.ach, life.s.ach);
    save.card = { name: life.s.name, age: life.s.age, gen: life.s.gen, title: life.s.dead ? '' : life.jobTitle() || (life.s.retired ? 'Retired' : '') };
  } else save.card = null;
  if (!store.set(SAVE_KEY, save)) toast('Could not save: storage is full or blocked.');
}

// ---- what is on screen ------------------------------------------------------------------

let tab = 'town';
let here = 'station'; // where you are standing on the map
let sheets = []; // the sheets open, one on top of another: { kind, id }
let result = null; // what the last action said, shown at the top of the sheet
let busy = false;
let mapKey = '';

function render() {
  if (!life) return;
  renderTop();
  renderPanel();
  renderSheet();
}

function renderTop() {
  const s = life.s;
  $('app').className = `app s${life.season}`;
  $('ava').innerHTML = face(s.look, s.age, s.happy);
  $('whoName').textContent = s.name;
  $('whoSub').textContent = `Age ${s.age} · ${life.jobTitle() || (s.retired ? 'Retired' : 'Between jobs')}`;
  $('cash').textContent = cashShort(s.cash);
  $('date').textContent = `${SEASON_ICON[life.season]} ${SEASONS[life.season]}, year ${life.year}`;
  meter('mHealth', s.health, life.healthCap());
  meter('mHappy', s.happy, 100);
  const max = Math.max(life.timeMax(), s.time);
  $('pips').innerHTML = `<small>Time</small>${Array.from({ length: max }, (_, i) => `<i class="${i < s.time ? 'on' : ''}"></i>`).join('')}`;
  const q = QUESTS[s.quest];
  const todo = $('todo');
  if (s.ill) { todo.className = 'todo ill'; todo.innerHTML = `<i>🤒</i><span>You have ${esc(s.ill.name)}. The hospital can treat it.</span>`; }
  else if (q) { todo.className = 'todo'; todo.innerHTML = `<i>🎯</i><span>${esc(q.text)}</span><b>${money(q.cash)}</b>`; }
  else { todo.className = 'todo'; todo.innerHTML = `<i>✨</i><span>Dreams: ${s.dreams.map((id) => `${DREAMS[id].icon}${s.dreamDone[id] ? '✓' : ''}`).join(' ')}</span>`; }
  $('nextSub').textContent = SEASONS[(life.season + 1) % 4].toLowerCase();
  $('nextBtn').classList.toggle('ready', s.time === 0);
  for (const b of document.querySelectorAll('.tab')) b.classList.toggle('on', b.dataset.tab === tab);
  // Sheets slide up as far as the bottom of this bar, so it always shows.
  document.documentElement.style.setProperty('--top-h', `${document.querySelector('.top').offsetHeight}px`);
}

function meter(id, v, cap) {
  const el = $(id);
  el.querySelector('.bar > span').style.width = `${Math.max(0, Math.min(100, v))}%`;
  el.querySelector('.bar').style.setProperty('--cap', `${cap}%`);
  el.querySelector('b').textContent = Math.round(v);
  el.classList.toggle('low', v < 25);
}

function renderPanel() {
  for (const [k, id] of [['town', 'pTown'], ['me', 'pMe'], ['people', 'pPeople'], ['journal', 'pJournal']]) $(id).hidden = tab !== k;
  if (tab === 'town') renderMap();
  else if (tab === 'me') $('pMe').innerHTML = meHtml();
  else if (tab === 'people') $('pPeople').innerHTML = peopleHtml();
  else $('pJournal').innerHTML = journalHtml();
}

// ---- the map ----------------------------------------------------------------------------

function renderMap() {
  const s = life.s, work = s.job ? CAREERS[s.job.c].place : null;
  const key = `${placeTier(s.home)}|${work}|${!!s.course}`;
  if (key !== mapKey) {
    mapKey = key;
    $('mapArt').innerHTML = townSvg({ tier: placeTier(s.home), work, study: !!s.course });
  }
  $('me').innerHTML = face(s.look, s.age, s.happy);
  placeMe();
  fitMap();
}

function placeMe() {
  const p = PLACES[here];
  $('me').style.left = `${(p.x + (p.x > 300 ? -34 : 34)) / 4}%`;
  $('me').style.top = `${(p.y + 2) / 6}%`;
}

// The map keeps its shape and fits the space between the bars.
function fitMap() {
  const box = $('pTown');
  const w = box.clientWidth, h = box.clientHeight;
  if (!w || !h) return;
  const mw = Math.min(w, h * 2 / 3);
  $('map').style.width = `${mw}px`;
  $('map').style.height = `${mw * 1.5}px`;
}
window.addEventListener('resize', fitMap);

function goTo(place) {
  if (busy || !life || life.s.dead) return;
  sfx('tap');
  const far = here !== place;
  here = place;
  placeMe();
  $('me').classList.remove('hop');
  void $('me').offsetWidth;
  $('me').classList.add('hop');
  busy = true;
  setTimeout(() => { busy = false; openSheet({ kind: 'place', id: place }, true); }, far ? 330 : 60);
}

// ---- sheets -----------------------------------------------------------------------------

function openSheet(sh, fresh = false) {
  if (fresh) sheets = [];
  sheets.push(sh);
  result = null;
  renderSheet();
  $('sheetBody').scrollTop = 0;
}
function closeSheets() { sheets = []; result = null; renderSheet(); }
function backSheet() { sheets.pop(); result = null; renderSheet(); }

const chip = (cls, text) => `<i class="chip ${cls}">${text}</i>`;
const jx = (x) => (x === undefined ? '' : ` data-x="${esc(JSON.stringify(x))}"`);

// One row for something you can do.
function actRow(a, o = {}) {
  const off = !!a.why;
  const cost = [a.time ? chip('time', `⏱ ${a.time}`) : '', a.cost ? chip('cash', cashShort(a.cost)) : ''].join('');
  const attrs = a.open ? `data-do="open" data-kind="${a.open}"` : `data-do="act" data-id="${a.id}"${jx(o.x !== undefined ? o.x : a.x)}`;
  return `<button class="act${off ? ' off' : ''}${a.id === 'work' ? ' work' : ''}" ${attrs}>
    <span class="act-ico">${a.icon || '•'}</span>
    <span class="act-main"><b>${esc(a.title)}</b><small>${esc(off && !a.owned ? a.why : a.desc)}</small></span>
    <span class="act-cost">${a.owned ? chip('have', 'Owned') : a.open ? '<i class="go">›</i>' : cost}</span>
  </button>`;
}
function sections(list) {
  let out = '', sec = null;
  for (const a of list) {
    if (a.sec !== sec) { sec = a.sec; out += `<h3>${esc(sec || '')}</h3>`; }
    out += actRow(a);
  }
  return out;
}
// Buttons along the bottom of a card in a list.
const pick = (label, id, x, why, cls = '') => `<button class="pick ${cls}${why ? ' off' : ''}" data-do="act" data-id="${id}"${jx(x)}${why ? ` data-why="${esc(why)}"` : ''}>${label}</button>`;
const needChips = (list) => list.map((n) => `<i class="need ${n.ok ? 'ok' : ''}">${n.ok ? '✓' : '○'} ${esc(n.text)}</i>`).join('');

const SHEET = {
  place(id) {
    const p = PLACES[id], s = life.s;
    let sub = p.blurb, title = p.name;
    if (id === 'home') { title = HOMES[s.home].name; sub = `${s.owned ? 'Yours' : `Rent ${money(HOMES[s.home].rent)} a season`}. ${HOMES[s.home].blurb}`; }
    return { icon: p.icon, title, sub, body: sections(life.placeActions(id)) };
  },

  jobs() {
    const s = life.s;
    let body = '<p class="lead">Every career is a ladder. Skills, courses and shifts worked take you up it; your job is done at the place it belongs to.</p>';
    for (const [c, car] of Object.entries(CAREERS)) {
      const mine = s.job && s.job.c === c, why = life.can('apply', c);
      const first = car.rungs[0], last = car.rungs[car.rungs.length - 1];
      body += `<div class="item${mine ? ' mine' : ''}">
        <div class="item-top"><span class="act-ico">${car.icon}</span><div><b>${car.name}</b><small>${esc(car.blurb)}</small></div></div>
        <div class="facts"><span>At ${PLACES[car.place].name}</span><span>${first.title} ${money(first.pay)}</span><span>${last.title} ${cashShort(last.pay)}</span></div>
        <details><summary>The whole ladder</summary>${car.rungs.map((r, i) => `<div class="rung${mine && s.job.r === i ? ' now' : ''}"><b>${i + 1}. ${r.title}</b><span>${money(r.pay)} a shift</span><div>${needChips(life.needs(r.need)) || '<i class="need ok">Open to all</i>'}</div></div>`).join('')}${car.clean ? '<p class="fine">Needs a clean record.</p>' : ''}${car.retire ? `<p class="fine">Players retire at ${car.retire}.</p>` : ''}${car.summer ? '<p class="fine">Long summer holidays: extra time every summer.</p>' : ''}</details>
        <div class="picks">${mine ? '<span class="note">This is your job</span>' : pick(`Apply ${chip('time', '⏱ 1')}`, 'apply', c, why)}${why && !mine ? `<span class="note">${esc(why)}</span>` : ''}</div>
      </div>`;
    }
    return { icon: '📋', title: 'The job board', sub: s.job ? `You are ${life.jobTitle()}` : 'You are between jobs', body };
  },

  courses() {
    const s = life.s;
    let body = '<p class="lead">One course at a time. You pay class by class, and each class takes two blocks of time at the college.</p>';
    for (const [id, c] of Object.entries(COURSES)) {
      const done = s.edu[id], on = s.course && s.course.id === id, why = life.can('enrol', id);
      const uses = [];
      for (const car of Object.values(CAREERS)) for (const r of car.rungs) if (r.need.edu === id) uses.push(r.title);
      body += `<div class="item${on ? ' mine' : ''}">
        <div class="item-top"><span class="act-ico">${c.icon}</span><div><b>${c.name}</b><small>${c.classes} classes at ${money(life.classFee(id))} each${uses.length ? `. For: ${uses.join(', ')}` : c.degree ? '. Counts as a degree' : ''}</small></div></div>
        <div class="facts">${needChips(life.needs(c.need))}</div>
        <div class="picks">${done ? '<span class="note ok">✓ You have this</span>' : on ? `<span class="note">${s.course.p} of ${c.classes} classes done</span>${pick('Drop it', 'drop', undefined, null, 'quiet')}` : pick('Sign up', 'enrol', id, why)}${why && !done && !on ? `<span class="note">${esc(why)}</span>` : ''}</div>
      </div>`;
    }
    return { icon: '🎓', title: 'Courses', sub: s.course ? `You are taking the ${COURSES[s.course.id].name}` : 'Starling College prospectus', body };
  },

  homes() {
    const s = life.s;
    let body = `<p class="lead">A better home lifts your mood every season, and you need room for a family. Buying takes a fifth down; the bank lends the rest.</p>`;
    for (const [id, h] of Object.entries(HOMES)) {
      const mine = s.home === id;
      const rentWhy = life.can('move', { id, buy: false }), buyWhy = life.can('move', { id, buy: true });
      const plan = h.price != null ? life.buyPlan(id) : null;
      body += `<div class="item${mine ? ' mine' : ''}">
        <div class="item-top"><span class="act-ico">${h.icon}</span><div><b>${h.name}</b><small>${esc(h.blurb)}</small></div></div>
        <div class="facts"><span>Comfort ${'★'.repeat(Math.max(1, Math.round(h.comfort / 4.4)))}</span><span>${h.kids ? `Room for ${h.kids} ${h.kids > 1 ? 'children' : 'child'}` : id === 'hostel' ? 'Just you' : 'Room for two'}</span></div>
        <div class="picks">
          ${mine ? `<span class="note ok">You live here${s.owned ? ', and own it' : ''}</span>` : ''}
          ${h.rent != null && !(mine && !s.owned) ? pick(`Rent · ${money(h.rent)} a season`, 'move', { id, buy: false }, rentWhy) : ''}
          ${plan && !(mine && s.owned) ? pick(`Buy · ${cashShort(plan.price)}${plan.loan ? ` (${cashShort(Math.max(0, plan.cash))} down)` : ''}`, 'move', { id, buy: true }, buyWhy) : ''}
        </div>
      </div>`;
    }
    return { icon: '📦', title: 'Move house', sub: 'Tidewater Estates', body };
  },

  pets() {
    let body = '<p class="lead">A pet lifts your mood every season, and costs $200 a season to keep.</p>';
    for (const [k, p] of Object.entries(PETS)) {
      const why = life.can('pet', k);
      body += `<div class="item"><div class="item-top"><span class="act-ico">${p.icon}</span><div><b>A ${p.name}</b><small>${{ dog: 'Loves walks in the park, and you.', cat: 'Tolerates you. That is love, from a cat.', rabbit: 'Soft, quiet, eats your cables.', parrot: 'Will outlive you, and repeat everything.' }[k]}</small></div></div>
        <div class="picks">${pick(`Adopt · $150 ${chip('time', '⏱ 1')}`, 'pet', k, why)}${why ? `<span class="note">${esc(why)}</span>` : ''}</div></div>`;
    }
    return { icon: '🐾', title: 'Pawprints shelter', sub: 'Everyone here is looking for a home', body };
  },

  bank() {
    const s = life.s, lim = life.creditLimit(), room = Math.max(0, lim - s.debt);
    const amounts = (id, max, all) => [1000, 10000, 100000].filter((n) => n < max).map((n) => pick(cashShort(n), id, n)).join('') + (max >= 1 ? pick(all, id, Math.floor(max)) : '<span class="note">Nothing to move</span>');
    const body = `
      <div class="item"><div class="item-top"><span class="act-ico">🐷</span><div><b>Savings: ${money(s.bank)}</b><small>Earns ${SAVINGS_RATE * 100}% every season, and cannot be burgled. Anything your cash will not cover is paid from here. Cash on you: ${money(s.cash)}.</small></div></div>
        <h4>Pay in</h4><div class="picks">${amounts('deposit', s.cash, 'All')}</div>
        <h4>Take out</h4><div class="picks">${amounts('withdraw', s.bank, 'All')}</div></div>
      <div class="item"><div class="item-top"><span class="act-ico">🧾</span><div><b>Loan: ${money(s.debt)}</b><small>Costs ${LOAN_RATE * 100}% every season. The bank will lend you up to ${money(lim)}, going by your pay and what you own. Owe more than that and it starts selling your things.</small></div></div>
        <h4>Borrow</h4><div class="picks">${amounts('borrow', room, 'Max')}</div>
        ${s.debt ? `<h4>Pay back</h4><div class="picks">${amounts('repay', Math.min(s.cash, s.debt), 'All I can')}</div>` : ''}</div>`;
    return { icon: '🏦', title: 'Savings and loans', sub: `Worth ${money(life.netWorth())} all told`, body };
  },

  stocks() {
    const s = life.s, k = s.stk;
    let body = '<p class="lead">Prices move every season. Buy low, sell high, hold your nerve.</p>';
    for (const [sym, st] of Object.entries(STOCKS)) {
      const p = k.p[sym], h = k.h[sym], prev = h.length > 1 ? h[h.length - 2] : p, own = k.own[sym] || 0;
      const move = (p - prev) / prev, worth = own * p, gain = own ? worth - (k.paid[sym] || 0) : 0;
      const have = s.cash + s.bank, maxQ = Math.floor(have / p);
      const buy = (n) => { const q = Math.floor(n / p); return q >= 1 && (n === 1000 || have >= n) ? pick(`Buy ${cashShort(n)}`, 'shares', { sym, n: q }, life.can('shares', { sym, n: q })) : ''; };
      body += `<div class="item">
        <div class="item-top"><span class="act-ico">${st.icon}</span><div><b>${st.name}</b><small>${sym} · ${esc(st.blurb)}</small></div>
          <div class="quote"><b>$${p.toFixed(2)}</b><small class="${move >= 0 ? 'up' : 'down'}">${move >= 0 ? '▲' : '▼'} ${Math.abs(move * 100).toFixed(1)}%</small></div></div>
        ${spark(h, 300, 34)}
        ${own ? `<div class="facts"><span>You hold ${own.toLocaleString()}, worth ${cashShort(worth)}</span><span class="${gain >= 0 ? 'up' : 'down'}">${gain >= 0 ? 'Up' : 'Down'} ${cashShort(Math.abs(gain))}</span></div>` : ''}
        <div class="picks">${buy(1000)}${buy(10000)}${buy(100000)}${maxQ >= 1 && have > 1000 ? pick('Buy all I can', 'shares', { sym, n: maxQ }) : ''}
          ${own ? pick('Sell half', 'sellShares', { sym, n: Math.max(1, Math.floor(own / 2)) }, null, 'quiet') + pick('Sell all', 'sellShares', { sym, n: own }, null, 'quiet') : ''}</div>
      </div>`;
    }
    return { icon: '📈', title: 'Shares', sub: `Yours are worth ${money(life.sharesWorth())}. To spend: ${money(s.cash + s.bank)}`, body };
  },

  props() {
    const s = life.s;
    let body = '<p class="lead">Buy somewhere and rent it out. The rent comes in every season, and property mostly creeps up in value.</p>';
    for (const [id, p] of Object.entries(PROPS)) {
      const own = s.props[id] || 0, price = life.propPrice(id), why = life.can('buyProp', id);
      body += `<div class="item${own ? ' mine' : ''}">
        <div class="item-top"><span class="act-ico">${p.icon}</span><div><b>${p.name}</b><small>Brings in about ${money(price * p.earn)} a season${own ? `. You own ${own}` : ''}</small></div></div>
        <div class="picks">${pick(`Buy · ${cashShort(price)} ${chip('time', '⏱ 1')}`, 'buyProp', id, why)}${own ? pick(`Sell · ${cashShort(price * 0.96)}`, 'sellProp', id, null, 'quiet') : ''}${why ? `<span class="note">${esc(why)}</span>` : ''}</div>
      </div>`;
    }
    return { icon: '🏘️', title: 'Property', sub: `Yours brings in ${money(life.propIncome())} a season`, body };
  },

  slots() {
    const s = life.s, o = slotShow;
    const bets = [50, 500, 5000, 50000].filter((b) => b <= 500 || s.cash + s.bank >= b);
    const body = `<div class="reels${spinning ? ' spin' : ''}">${(o ? o.reels : ['🍒', '💎', '7️⃣']).map((r, i) => `<span style="--i:${i}">${r}</span>`).join('')}</div>
      <p class="slot-say ${o && o.win ? 'won' : ''}">${spinning ? '…' : o ? (o.win ? `You win ${money(o.win)}!` : 'Nothing. Go again?') : 'Pick your stake and pull.'}</p>
      <div class="picks mid">${bets.map((b) => pick(`Spin ${cashShort(b)}`, 'slots', b, life.can('slots', b))).join('')}</div>
      <p class="fine mid">Three alike pay: 🍒 5 · 🍋 8 · 🔔 15 · ⭐ 30 · 7️⃣ 80 · 💎 400 times your stake. Two cherries pay double.<br>You have ${money(s.cash)} on you.</p>`;
    return { icon: '🎰', title: 'The slots', sub: 'The Lucky Gull', body };
  },

  hilo() {
    const s = life.s, h = s.hilo;
    const name = (c) => ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[c] || c);
    const bets = [50, 500, 5000, 50000].filter((b) => b <= 500 || s.cash + s.bank >= b);
    let body;
    if (h) {
      const hi = life.hiloOdds('hi'), lo = life.hiloOdds('lo');
      body = `<div class="cardface">${name(h.card)}<small>♠</small></div>
        <p class="slot-say">The pot is <b>${money(h.pot)}</b>${h.streak ? ` · ${h.streak} right in a row` : ''}</p>
        <div class="picks mid">${pick(`▲ Higher · ${pct(hi)}`, 'hiloGuess', 'hi', hi <= 0 ? 'Nothing is higher.' : null)}${pick(`▼ Lower · ${pct(lo)}`, 'hiloGuess', 'lo', lo <= 0 ? 'Nothing is lower.' : null)}</div>
        <div class="picks mid">${pick(`Take the ${money(h.pot)}`, 'hiloCash', undefined, null, 'quiet')}</div>`;
    } else {
      body = `<div class="cardface ${hiloShow && hiloShow.lost ? 'lost' : 'back'}">${hiloShow && hiloShow.lost ? `${name(hiloShow.card)}<small>♠</small>` : '🂠'}</div>
        <p class="slot-say">${hiloShow && hiloShow.lost ? 'Bad luck. Again?' : 'Will the next card be higher or lower?'}</p>
        <div class="picks mid">${bets.map((b) => pick(`Bet ${cashShort(b)}`, 'hiloStart', b, life.can('hiloStart', b))).join('')}</div>`;
    }
    body += `<p class="fine mid">Aces are low. Each right call grows the pot: the longer the odds, the more it grows. A wrong call, or the same card again, loses the lot.<br>You have ${money(s.cash)} on you.</p>`;
    return { icon: '🃏', title: 'Higher or Lower', sub: 'The Lucky Gull', body };
  },

  person(id) {
    const p = life.person(id);
    if (!p) return null;
    const body = `<div class="bondbar big"><span style="width:${p.bond}%"></span></div><p class="lead">${bondWord(p)} · bond ${Math.round(p.bond)}${p.kind !== 'child' && p.kind !== 'parent' ? ` · ${TRAITS[p.trait].icon} ${TRAITS[p.trait].name}` : ''}</p>${life.personActions(p).map((a) => actRow(a, { x: p.id })).join('')}`;
    return { icon: face(p.look, p.age, 40 + p.bond * 0.6), title: p.name, sub: `${relation(p)}, ${p.age}`, body };
  },
};

function relation(p) {
  if (p.kind === 'friend') return p.spark && !life.partner() ? 'Friend (there might be a spark)' : 'Friend';
  if (p.kind === 'partner') return p.eng ? 'Your fiancé(e)' : p.live ? 'Your partner (you live together)' : 'Your partner';
  if (p.kind === 'spouse') return 'Married to you';
  if (p.kind === 'child') return p.age < 18 ? 'Your child' : 'Your grown-up child';
  return 'Your parent';
}
const bondWord = (p) => (p.bond >= 80 ? 'Adores you' : p.bond >= 60 ? 'Very close' : p.bond >= 40 ? 'Close' : p.bond >= 20 ? 'Friendly' : 'Drifting away');

function renderSheet() {
  const back = $('sheetBack');
  let sh = sheets[sheets.length - 1], v = null;
  while (sh && !(v = SHEET[sh.kind](sh.id))) { sheets.pop(); sh = sheets[sheets.length - 1]; }
  if (!sh || !life) { back.hidden = true; return; }
  const body = $('sheetBody'), keep = body.scrollTop;
  back.hidden = false;
  $('sheetBackBtn').hidden = sheets.length < 2;
  $('sheetIco').innerHTML = v.icon;
  $('sheetTitle').textContent = v.title;
  $('sheetSub').textContent = v.sub || '';
  body.innerHTML = v.body;
  body.scrollTop = keep;
  const r = $('result');
  if (result) {
    r.hidden = false;
    r.innerHTML = `<p>${esc(result.text)}</p><div class="chgs">${chips(result.changes)}</div>`;
    if (result.fresh) { r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash'); result.fresh = false; }
  } else r.hidden = true;
}

// What changed, as little coloured tags.
function chips(changes) {
  const ico = { health: '❤️', happy: '🙂', fame: '🌟', ...STAT_ICON };
  return (changes || []).map(({ k, d }) => {
    const up = d > 0, n = Math.abs(d);
    if (k === 'cash') return n >= 1 ? `<i class="chg ${up ? 'up' : 'down'}">${up ? '+' : '−'}${money(n).replace('−', '')}</i>` : '';
    if (k === 'karma') return `<i class="chg ${up ? 'up' : 'down'}">${up ? '😇 Your good name grows' : '😈 Your good name suffers'}</i>`;
    if (n < 0.2) return '';
    const num = n >= 10 || Math.abs(n - Math.round(n)) < 0.05 ? Math.round(n) : n.toFixed(1);
    return `<i class="chg ${up ? 'up' : 'down'}">${ico[k]} ${up ? '+' : '−'}${num}</i>`;
  }).join('');
}

// ---- doing things -----------------------------------------------------------------------

let slotShow = null, hiloShow = null, spinning = false;

function doAct(id, x) {
  if (!life || busy || spinning) return;
  const r = life.act(id, x);
  if (!r.ok) { sfx('nope'); toast(r.why); return; }
  haptic();
  if (id === 'slots') return spin(r);
  if (id === 'hiloGuess' || id === 'hiloStart' || id === 'hiloCash') hiloShow = r.out;
  if (id === 'move' || id === 'apply' || id === 'enrol' || id === 'pet') { while (sheets.length > 1) sheets.pop(); }
  if (PERSON_GONE.includes(id) && !life.person(x)) sheets.pop();
  landed(r);
}
const PERSON_GONE = ['split'];

// After anything has happened: save, redraw, make the right noise, and show what follows.
function landed(r, quiet = false) {
  result = { text: r.text, changes: r.changes, fresh: true };
  persist();
  render();
  if (!sheets.length && r.text) toast(r.text, 3200);
  const kinds = (r.news || []).map((n) => n.kind);
  const cash = (r.changes || []).find((c) => c.k === 'cash');
  if (!quiet) {
    if (kinds.includes('promo')) sfx('cheer');
    else if (kinds.includes('dream') || kinds.includes('trophy')) sfx('win');
    else if (kinds.includes('quest')) sfx('goal');
    else if (kinds.includes('good')) sfx('pop');
    else if (r.win === false) sfx('wrong');
    else if (cash && cash.d > 0) sfx('coin');
    else if ((r.changes || []).some((c) => STATS.includes(c.k) && c.d > 0)) sfx('fill');
    else sfx('tap');
  }
  showNews(r.news);
  pump();
}

function spin(r) {
  spinning = true;
  slotShow = null;
  renderSheet();
  sfx('flip');
  const t = setInterval(() => { sfx('tap'); for (const el of document.querySelectorAll('.reels span')) el.textContent = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '💎'][Math.floor(Math.random() * 6)]; }, 90);
  setTimeout(() => {
    clearInterval(t);
    spinning = false;
    slotShow = r.out;
    landed(r, true);
    result = null;
    renderSheet();
    if (r.out.win > 0) { sfx(r.out.reels[0] === '💎' && r.out.reels[1] === '💎' && r.out.reels[2] === '💎' ? 'cheer' : 'coin'); if (r.out.win >= 5000) confetti(); }
  }, 700);
}

// Little notices that drop down: a new friend, a trophy, a dream come true.
// Three at a time; the rest wait their turn.
const newsQueue = [];
function showNews(list) {
  newsQueue.push(...(list || []));
  nextNews();
}
function nextNews() {
  while (newsQueue.length && $('news').children.length < 3) {
    const n = newsQueue.shift();
    const el = document.createElement('div');
    el.className = `news-item k-${n.kind}`;
    el.innerHTML = `<i>${n.icon}</i><span>${esc(n.text)}</span>`;
    $('news').appendChild(el);
    setTimeout(() => el.classList.add('gone'), 2600);
    setTimeout(() => { el.remove(); nextNews(); }, 3000);
    if (n.kind === 'dream' || n.kind === 'promo') confetti();
  }
}

// ---- events -----------------------------------------------------------------------------

// Shows whatever is waiting: the end of the life, or the next event card.
function pump() {
  if (!life || ui.isOpen()) return;
  if (life.s.dead) { showEnd(); return; }
  const ev = life.event();
  if (ev) showEvent(ev);
}

function showEvent(ev) {
  sfx('hint');
  ui.show(`<div class="ev-ico">${ev.icon}</div><h2>${esc(ev.title)}</h2><p class="ev-text">${esc(ev.text)}</p>
    <div class="actions">${ev.opts.map((o, i) => `<button class="btn ${i === 0 && ev.opts.length === 1 ? 'btn-primary' : 'btn-soft'} opt${o.why ? ' off' : ''}" data-action="opt" data-i="${i}">
      <b>${esc(o.t)}</b>${o.cost || o.chance != null || o.why ? `<small>${o.why ? esc(o.why) : [o.cost ? money(o.cost) : '', o.chance != null ? `${o.stat ? `${STAT_ICON[o.stat]} ${STAT_NAME[o.stat]}: ` : ''}${pct(o.chance)} chance` : ''].filter(Boolean).join(' · ')}</small>` : ''}
    </button>`).join('')}</div>`);
}

function chooseOpt(el) {
  const i = Number(el.dataset.i), ev = life.event();
  if (!ev) { ui.close(); return; }
  if (ev.opts[i].why) { sfx('nope'); toast(ev.opts[i].why); return; }
  const r = life.choose(i);
  if (!r.ok) { sfx('nope'); toast(r.why); return; }
  haptic();
  persist();
  render();
  showNews(r.news);
  if (r.win === true) sfx('chime'); else if (r.win === false) sfx('wrong'); else sfx('tap');
  if (!r.text) { ui.close(); pump(); return; }
  ui.show(`<div class="ev-ico">${r.win === true ? '🎉' : r.win === false ? '😬' : ev.icon}</div><h2>${esc(ev.title)}</h2><p class="ev-text">${esc(r.text)}</p><div class="chgs mid">${chips(r.changes)}</div>
    <div class="actions"><button class="btn btn-primary" data-action="evDone">Carry on</button></div>`);
}

// ---- the seasons ------------------------------------------------------------------------

function nextSeason() {
  if (!life || busy || spinning || ui.isOpen()) return;
  if (life.s.dead || life.event()) { pump(); return; }
  closeSheets();
  const worthWas = life.netWorth();
  const r = life.endSeason();
  persist();
  tab = 'town';
  render();
  sfx('whoosh');
  haptic();
  showNews(r.news);
  const net = r.lines.reduce((a, [, n]) => a + n, 0), short = r.lines.some(([what]) => what.startsWith('Short'));
  const b = $('season');
  b.innerHTML = `<i>${SEASON_ICON[life.season]}</i><b>${SEASONS[life.season]}</b><small>${life.s.dead ? '' : `Age ${life.s.age} · bills and income ${net >= 0 ? '+' : '−'}${money(Math.abs(net))}${short ? ' · you are overdrawn!' : ''}`}</small>`;
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
  busy = true;
  setTimeout(() => {
    busy = false;
    if (life.s.dead) { sfx('lose'); showEnd(); } else if (r.birthday) showBirthday(worthWas); else pump();
  }, life.s.dead ? 1200 : 650);
}

function showBirthday() {
  const s = life.s, was = save.yearWorth ?? life.netWorth(), now = life.netWorth();
  save.yearWorth = now;
  const big = s.log.filter((e) => e.a === s.age - 1 && (e.k === 'big' || e.k === 'love')).slice(-4);
  sfx('star');
  if (s.age % 10 === 0) confetti();
  ui.show(`<div class="ev-ico">🎂</div><h2>Happy birthday!</h2><p class="ev-text">You are ${s.age} today.</p>
    <div class="stats"><div><b>${cashShort(now)}</b><span>Worth</span></div><div><b class="${now >= was ? 'up' : 'down'}">${now >= was ? '+' : '−'}${cashShort(Math.abs(now - was)).replace('−', '')}</b><span>This year</span></div><div><b>${Math.round(s.health)}</b><span>Health</span></div></div>
    ${big.length ? `<ul class="year">${big.map((e) => `<li>${esc(e.t)}</li>`).join('')}</ul>` : ''}
    <div class="actions"><button class="btn btn-primary" data-action="evDone">Onwards</button></div>`);
}

// ---- the Me, People and Journal tabs ----------------------------------------------------

function meHtml() {
  const s = life.s, next = life.nextRung(), job = s.job && CAREERS[s.job.c];
  const rep = s.karma >= 60 ? 'A saint' : s.karma >= 20 ? 'Well thought of' : s.karma > -20 ? 'Nobody special' : s.karma > -50 ? 'A bit shifty' : 'Notorious';
  const row = (label, n, cls = '') => (n ? `<div class="line ${cls}"><span>${label}</span><b>${money(n)}</b></div>` : '');
  const bills = life.bills(), out = bills.reduce((a, [, n]) => a + n, 0);
  const comeIn = (s.pension || 0) + life.propIncome() + Math.floor(s.bank * SAVINGS_RATE);
  const items = Object.keys(s.items).filter((id) => ITEMS[id]);
  return `
  <div class="box hero"><span class="ava big">${face(s.look, s.age, s.happy)}</span><div><h2>${esc(s.name)}</h2><p>Age ${s.age}${s.gen > 1 ? ` · generation ${s.gen}` : ''}<br>${rep}${s.fame >= 1 ? ` · 🌟 Fame ${Math.round(s.fame)}` : ''}${s.record ? ' · has a record' : ''}</p></div></div>
  ${s.ill ? `<div class="box warn">🤒 You have ${esc(s.ill.name)}. It costs you health every season${s.ill.sev >= 3 ? ', and it could kill you' : ''}. St Wren’s can treat it.</div>` : ''}
  <div class="box"><h3>Skills</h3>${STATS.map((k) => `<div class="skill"><i>${STAT_ICON[k]}</i><span>${STAT_NAME[k]}</span><span class="bar"><span style="width:${s.st[k]}%"></span></span><b>${Math.floor(s.st[k])}</b></div>`).join('')}
    <p class="fine">Skills grow by doing things, more slowly the higher they get, and faster when you are happy.</p></div>
  <div class="box"><h3>Work</h3>${job ? `<div class="line"><span>${job.icon} ${life.jobTitle()}, ${PLACES[job.place].name}</span><b>${money(life.shiftPay())} a shift</b></div>
      ${next ? `<p class="sub">Next: <b>${next.title}</b> (${money(next.pay)} a shift)</p><div class="needs">${needChips(next.list)}</div>` : '<p class="sub">You are at the very top. 🏆</p>'}`
    : s.retired ? `<p class="sub">Retired, on a pension of ${money(s.pension)} a season.</p>` : '<p class="sub">Between jobs. The Town Hall has a job board, and the harbour always wants crates unloading.</p>'}</div>
  <div class="box"><h3>Study</h3>${s.course ? `<div class="line"><span>${COURSES[s.course.id].icon} ${COURSES[s.course.id].name}</span><b>${s.course.p} of ${COURSES[s.course.id].classes}</b></div>` : ''}
    ${Object.keys(s.edu).length ? `<div class="needs">${Object.keys(s.edu).map((id) => `<i class="need ok">${COURSES[id].icon} ${COURSES[id].name}</i>`).join('')}</div>` : s.course ? '' : '<p class="sub">No qualifications yet. The college has courses.</p>'}</div>
  <div class="box"><h3>Money</h3>
    ${row('Cash on you', s.cash) || '<div class="line"><span>Cash on you</span><b>$0</b></div>'}${row('Savings', s.bank)}${row('Shares', life.sharesWorth())}${row('Rental property', life.propsWorth())}${row('Your home', life.homeWorth())}${row('Loan', -s.debt, 'down')}
    <div class="line total"><span>Worth, all told</span><b>${money(life.netWorth())}</b></div>
    <h4>Every season</h4>${bills.map(([what, n]) => row(esc(what), -n, 'down')).join('')}${row('Pension', s.pension, 'up')}${row('Rent from property', life.propIncome(), 'up')}${row('Savings interest', Math.floor(s.bank * SAVINGS_RATE), 'up')}
    <div class="line total"><span>Before any work</span><b>${money(comeIn - out)}</b></div></div>
  <div class="box"><h3>Dreams</h3>${s.dreams.map((id) => `<div class="dream${s.dreamDone[id] ? ' done' : ''}"><i>${DREAMS[id].icon}</i><div><b>${DREAMS[id].name}</b><small>${s.dreamDone[id] ? `Came true at ${s.dreamDone[id]}` : DREAMS[id].desc}</small></div><em>${s.dreamDone[id] ? '✓' : ''}</em></div>`).join('')}</div>
  <div class="box"><h3>Belongings</h3>${items.length ? `<div class="things">${items.map((id) => `<span title="${ITEMS[id].name}">${ITEMS[id].icon}<small>${ITEMS[id].name}</small></span>`).join('')}</div>` : '<p class="sub">One suitcase. The High Street can fix that.</p>'}
    ${s.paintings ? `<p class="sub">🖼️ ${s.paintings} painting${s.paintings > 1 ? 's' : ''} to sell at the studios.</p>` : ''}${s.novel.p ? `<p class="sub">✍️ Novel: ${s.novel.p} of 10 sittings done.</p>` : ''}</div>
  <div class="box"><button class="btn btn-soft wide" data-do="trophies">🏆 Trophies and ribbons</button></div>`;
}

function peopleHtml() {
  const s = life.s;
  const order = { spouse: 0, partner: 0, child: 1, friend: 2, parent: 3 };
  const list = s.people.slice().sort((a, b) => order[a.kind] - order[b.kind] || b.bond - a.bond);
  let out = '';
  if (s.due) out += `<div class="box warn good">🍼 ${s.due.adopt ? 'A child is coming to live with you soon.' : 'A baby is on the way!'}</div>`;
  if (s.pet) out += `<div class="box person pet"><span class="act-ico">${PETS[s.pet.kind].icon}</span><div><b>${esc(s.pet.name)}</b><small>Your ${PETS[s.pet.kind].name}, ${s.pet.age}. Always pleased to see you.</small></div></div>`;
  for (const p of list) {
    out += `<button class="box person" data-do="person" data-id="${p.id}"><span class="ava">${face(p.look, p.age, 40 + p.bond * 0.6)}</span>
      <div><b>${esc(p.name)}</b><small>${relation(p)}, ${p.age}</small><span class="bondbar"><span style="width:${p.bond}%"></span></span></div><i class="go">›</i></button>`;
  }
  if (!list.length) out += '<div class="box"><p class="sub">You do not know a soul in Starling Bay yet. Chat to the regulars at the Gull & Anchor, sit by the pond in the park, or go to hack night at the Labs.</p></div>';
  else out += '<p class="fine pad">People drift away unless you keep in touch. Tap someone to spend time with them.</p>';
  return out;
}

function journalHtml() {
  const s = life.s;
  let out = '', age = null;
  for (let i = s.log.length - 1; i >= 0; i--) {
    const e = s.log[i];
    if (e.a !== age) { if (age !== null) out += '</div>'; age = e.a; out += `<div class="box"><h3>Age ${age}</h3>`; }
    out += `<p class="entry ${e.k}"><i>${SEASON_ICON[e.q]}</i>${esc(e.t)}</p>`;
  }
  return `${out}</div>`;
}

// ---- cards ------------------------------------------------------------------------------

const ui = cards({
  opt: chooseOpt,
  evDone() { ui.close(); pump(); },
  how: showHow,
  trophies: showTrophies,
  family: showFamily,
  menu: showMenu,
  fresh() {
    ui.show(`<h2>Start a new life?</h2><p>${esc(life.s.name)}'s story will end here, unfinished. Trophies and ribbons you have earned are kept.</p>
      <div class="actions"><button class="btn btn-primary" data-action="freshYes">Yes, start again</button><button class="btn btn-soft" data-action="menu">No, go back</button></div>`);
  },
  freshYes() { ui.close(); life = null; save.next = null; persist(); showStart(); },
  begin() { ui.close(); sfx('win'); pump(); },
});

function showMenu() {
  ui.show(`<h2>New in Town</h2>
    ${switchRow('Sound', 'sound')}${switchRow('Haptics', 'haptics')}
    <div class="actions">
      <button class="btn btn-soft" data-action="how">How to play</button>
      <button class="btn btn-soft" data-action="trophies">Trophies and ribbons</button>
      <button class="btn btn-soft" data-action="family">Family history</button>
      ${life ? '<button class="btn btn-soft" data-action="fresh">Start a new life</button>' : ''}
      <button class="btn btn-primary" data-action="close">Back to it</button>
    </div>`);
}

function showHow() {
  ui.show(`<h2>How to play</h2><div class="how">
    <p><b>One life, a season at a time.</b> Each season you get a few blocks of time ⏱. Tap a place on the map and spend them: work, study, train, see people. Tap <b>Next</b> when you are done; time left over is rest.</p>
    <p><b>Four skills</b> open doors: 🧠 Smarts, 💪 Fitness, 💬 Charm and 🎨 Craft. Every career is a ladder that asks for skills, shifts worked, and sometimes a course from the college.</p>
    <p><b>Look after yourself.</b> ❤️ Health falls with age and overwork; if it runs out, so do you. 🙂 Mood follows how life is going: a better home, friends, love, a pet.</p>
    <p><b>Bills fall due every season.</b> Save at the bank, buy shares or property, or borrow. A bicycle or a car gives you more time.</p>
    <p><b>Life happens.</b> Cards turn up with choices. A percentage shows your chance where a skill decides it.</p>
    <p><b>At the end</b> your life earns a ribbon, and each ribbon unlocks an heirloom that a later life can carry. Your heir inherits a share of what you leave.</p></div>
    <div class="actions"><button class="btn btn-primary" data-action="${life ? 'close' : 'close'}">Got it</button></div>`);
}

function showTrophies() {
  const m = save.meta;
  const got = Object.keys(TROPHIES).filter((id) => m.ach[id]).length;
  ui.show(`<h2>Trophies</h2><p>${got} of ${Object.keys(TROPHIES).length}, across all your lives.</p>
    <div class="trophies">${Object.entries(TROPHIES).map(([id, t]) => `<div class="trophy${m.ach[id] ? ' got' : ''}"><i>${m.ach[id] ? t.icon : '🔒'}</i><b>${t.name}</b><small>${t.desc}</small></div>`).join('')}</div>
    <h2>Ribbons</h2><p>Every life ends with one. Each unlocks an heirloom for the lives that follow.</p>
    <div class="trophies">${RIBBONS.map((r) => `<div class="trophy${m.ribbons[r.id] ? ' got' : ''}"><i>${m.ribbons[r.id] ? r.icon : '🔒'}</i><b>${r.name}${m.ribbons[r.id] > 1 ? ` ×${m.ribbons[r.id]}` : ''}</b><small>${r.desc}${m.ribbons[r.id] ? ` Heirloom: ${r.heir.icon} ${r.heir.name}.` : ''}</small></div>`).join('')}</div>
    <div class="actions"><button class="btn btn-primary" data-action="close">Close</button></div>`);
}

function showFamily() {
  const m = save.meta;
  ui.show(`<h2>Family history</h2>${m.hall.length ? `<p>${m.lives} ${m.lives === 1 ? 'life' : 'lives'} lived. Best score: ${m.best.toLocaleString()}.</p>
    <div class="hall">${m.hall.map((h) => `<div class="hall-row"><i>${RIBBON[h.ribbon]?.icon || '🍂'}</i><div><b>${esc(h.name)}</b><small>${RIBBON[h.ribbon]?.name || ''} · lived to ${h.age}${h.title ? ` · ${esc(h.title)}` : ''} · left ${cashShort(h.worth)}${h.gen > 1 ? ` · generation ${h.gen}` : ''}</small></div><em>${h.score.toLocaleString()}</em></div>`).join('')}</div>`
    : '<p>Nobody yet. The lives you finish are remembered here.</p>'}
    <div class="actions"><button class="btn btn-primary" data-action="close">Close</button></div>`);
}

function showGoals() {
  const s = life.s;
  ui.show(`<h2>To do</h2><div class="goals">${QUESTS.map((q, i) => (i > s.quest ? '' : `<div class="goal${i < s.quest ? ' done' : ''}"><i>${i < s.quest ? '✓' : '🎯'}</i><span>${esc(q.text)}</span><b>${money(q.cash)}</b></div>`)).join('')}${s.quest >= QUESTS.length ? '<p>All done. The rest is up to you.</p>' : s.quest < QUESTS.length - 1 ? '<p class="fine">More to come.</p>' : ''}</div>
    <h2>Dreams</h2><div class="goals">${s.dreams.map((id) => `<div class="goal${s.dreamDone[id] ? ' done' : ''}"><i>${DREAMS[id].icon}</i><span><b>${DREAMS[id].name}</b>: ${DREAMS[id].desc}</span><b>${s.dreamDone[id] ? '✓' : ''}</b></div>`).join('')}</div>
    <div class="actions"><button class="btn btn-primary" data-action="close">Close</button></div>`);
}

// ---- starting a life --------------------------------------------------------------------

let draft = null;

function showStart() {
  const nx = save.next, m = save.meta;
  const rand = (n) => Math.floor(Math.random() * n);
  const ids = Object.keys(DREAMS);
  const offered = [];
  while (offered.length < 6) { const id = ids[rand(ids.length)]; if (!offered.includes(id)) offered.push(id); }
  draft = {
    name: nx && nx.name ? nx.name : '',
    look: nx && nx.look ? { ...nx.look } : { skin: rand(LOOKS.skin.length), hair: rand(LOOKS.hair.length), top: rand(LOOKS.top.length), style: rand(LOOKS.styles) },
    bg: 'allrounder', dreams: [], offered, heir: null,
  };
  $('app').hidden = true;
  $('end').hidden = true;
  $('start').hidden = false;
  closeSheets();
  renderStart();
}

function renderStart() {
  const d = draft, nx = save.next, m = save.meta;
  const heirs = RIBBONS.filter((r) => m.ribbons[r.id]);
  const sw = (key, list) => `<div class="swatches">${list.map((c, i) => `<button class="sw${d.look[key] === i ? ' on' : ''}" style="background:${c}" data-do="look" data-key="${key}" data-i="${i}" aria-label="${key} ${i + 1}"></button>`).join('')}</div>`;
  const ready = d.name.trim() && d.dreams.length === 3;
  $('start').innerHTML = `<div class="start-in">
    <div class="start-top"><a class="ico-btn" href="../../index.html" aria-label="Back to the arcade">${ICON.back}</a><button class="ico-btn" data-do="menu" aria-label="Menu">${ICON.gear}</button></div>
    <h1 class="logo"><span>New</span><span>in Town</span></h1>
    <p class="tag">${nx ? `Generation ${nx.gen}. ${esc(nx.from)} left you ${money(nx.inherit)}.` : 'One suitcase. One town. One whole life.'}</p>

    <div class="box"><h3>Who are you?</h3>
      <div class="namer"><span class="ava big">${face(d.look, 18, 70)}</span>
        <div><input id="nameIn" type="text" maxlength="16" placeholder="Your name" value="${esc(d.name)}" autocomplete="off" autocapitalize="words" spellcheck="false">
        <div class="picks"><button class="pick quiet" data-do="rname">🎲 Name</button><button class="pick quiet" data-do="rlook">🎲 Look</button><button class="pick quiet" data-do="style">💇 Hair</button></div></div></div>
      ${sw('skin', LOOKS.skin)}${sw('hair', LOOKS.hair)}${sw('top', LOOKS.top)}</div>

    <div class="box"><h3>What were you like at school?</h3><div class="grid3">${Object.entries(BACKGROUNDS).map(([id, b]) => `<button class="opt-card${d.bg === id ? ' on' : ''}" data-do="bg" data-id="${id}"><i>${b.icon}</i><b>${b.name}</b><small>${b.blurb}</small></button>`).join('')}</div></div>

    <div class="box"><h3>What do you dream of? <em>Pick three</em></h3><div class="grid2">${d.offered.map((id) => `<button class="opt-card wide${d.dreams.includes(id) ? ' on' : ''}" data-do="dream" data-id="${id}"><i>${DREAMS[id].icon}</i><b>${DREAMS[id].name}</b><small>${DREAMS[id].desc}</small></button>`).join('')}</div></div>

    ${heirs.length ? `<div class="box"><h3>An heirloom <em>Pick one to bring</em></h3><div class="grid2">${heirs.map((r) => `<button class="opt-card wide${d.heir === r.id ? ' on' : ''}" data-do="heir" data-id="${r.id}"><i>${r.heir.icon}</i><b>${r.heir.name}</b><small>${r.heir.desc}</small></button>`).join('')}</div></div>` : ''}

    <button class="btn btn-primary go-btn${ready ? '' : ' off'}" data-do="begin">${ready ? 'Catch the train to Starling Bay' : !d.name.trim() ? 'Choose a name' : `Pick ${3 - d.dreams.length} more dream${3 - d.dreams.length > 1 ? 's' : ''}`}</button>
  </div>`;
  const input = $('nameIn');
  input.addEventListener('input', () => {
    const had = !!d.name.trim();
    d.name = input.value;
    if (had !== !!d.name.trim()) { const at = input.selectionStart; renderStart(); $('nameIn').focus(); $('nameIn').setSelectionRange(at, at); }
  });
}

function beginLife() {
  const d = draft, nx = save.next;
  if (!d.name.trim() || d.dreams.length !== 3) { sfx('nope'); toast(!d.name.trim() ? 'Choose a name first.' : 'Pick three dreams.'); return; }
  life = Life.create({
    name: d.name.trim().slice(0, 16), look: d.look, bg: d.bg, dreams: d.dreams, heir: d.heir,
    inherit: nx ? nx.inherit : 0, gen: nx ? nx.gen : 1, parent: nx ? nx.parent : null,
    seed: (Math.random() * 2 ** 32) >>> 0,
  });
  save.next = null;
  save.yearWorth = life.netWorth();
  tab = 'town'; here = 'station'; mapKey = ''; slotShow = null; hiloShow = null;
  persist();
  $('start').hidden = true;
  $('app').hidden = false;
  render();
  const s = life.s;
  ui.show(`<div class="ev-ico">🚂</div><h2>Starling Bay</h2>
    <p class="ev-text">The train pulls out and leaves you on the platform with one suitcase, ${money(s.cash)}, and a bunk booked at the Seagull Hostel.${s.gen > 1 ? ' Your family has history here.' : ' You do not know a soul.'}</p>
    <p class="ev-text">Gulls. Salt in the air. A whole town, and a whole life to live in it.</p>
    <div class="actions"><button class="btn btn-primary" data-action="begin">Pick up the suitcase</button></div>`);
}

// ---- the end of a life ------------------------------------------------------------------

function showEnd() {
  const s = life.s, o = life.obituary(), m = save.meta;
  // Count the life once.
  let fresh = false;
  if (!save.counted) {
    save.counted = true;
    m.lives++;
    fresh = !m.ribbons[o.ribbon.id];
    m.ribbons[o.ribbon.id] = (m.ribbons[o.ribbon.id] || 0) + 1;
    m.best = Math.max(m.best, o.score);
    m.hall.unshift({ name: s.name, age: o.age, ribbon: o.ribbon.id, score: o.score, gen: s.gen, title: o.title, worth: o.worth });
    m.hall.length = Math.min(m.hall.length, 40);
    save.fresh = fresh;
    save.next = { gen: s.gen + 1, inherit: o.inherit, from: s.name, name: o.heir ? o.heir.name : '', look: o.heir ? o.heir.look : null, parent: o.parent };
    persist();
  } else fresh = !!save.fresh;
  closeSheets();
  ui.close();
  newsQueue.length = 0;
  $('news').innerHTML = '';
  const big = s.log.filter((e) => e.k === 'big' || e.k === 'love').slice(1, -1).slice(-9);
  $('end').hidden = false;
  $('end').innerHTML = `<div class="start-in end-in">
    <p class="rip">In loving memory</p>
    <span class="ava huge">${face(s.look, s.age, 70)}</span>
    <h1 class="end-name">${esc(s.name)}</h1>
    <p class="tag">Came to Starling Bay at 18. Died at ${o.age}, of ${esc(o.cause)}.</p>
    <div class="ribbon"><i>${o.ribbon.icon}</i><b>${o.ribbon.name}</b><small>${o.ribbon.desc}</small></div>
    ${fresh ? `<div class="box warn good">New heirloom for the lives to come: ${o.ribbon.heir.icon} <b>${o.ribbon.heir.name}</b>. ${o.ribbon.heir.desc}</div>` : ''}
    <div class="stats"><div><b>${o.score.toLocaleString()}</b><span>Score</span></div><div><b>${cashShort(o.worth)}</b><span>Left behind</span></div><div><b>${o.trophies}</b><span>Trophies</span></div></div>
    <div class="box"><h3>Dreams</h3>${o.dreams.map((d) => `<div class="dream${d.done ? ' done' : ''}"><i>${DREAMS[d.id].icon}</i><div><b>${DREAMS[d.id].name}</b><small>${d.done ? 'Came true' : 'Not this time'}</small></div><em>${d.done ? '✓' : ''}</em></div>`).join('')}</div>
    ${big.length ? `<div class="box"><h3>A life</h3>${big.map((e) => `<p class="entry"><i>${e.a}</i>${esc(e.t)}</p>`).join('')}</div>` : ''}
    <div class="box"><h3>Skills at the end</h3>${STATS.map((k) => `<div class="skill"><i>${STAT_ICON[k]}</i><span>${STAT_NAME[k]}</span><span class="bar"><span style="width:${s.st[k]}%"></span></span><b>${Math.floor(s.st[k])}</b></div>`).join('')}</div>
    <button class="btn btn-primary go-btn" data-do="heirLife">${o.heir ? `Carry on as ${esc(o.heir.name)}, your child` : 'Carry on as a distant cousin'}<small>Inherits ${money(o.inherit)}</small></button>
    <button class="btn btn-soft go-btn" data-do="newFamily">Start a new family from nothing</button>
  </div>`;
  $('end').scrollTop = 0;
  if (fresh) confetti();
}

function afterEnd(keep) {
  if (!keep) save.next = null;
  save.counted = false;
  save.fresh = false;
  life = null;
  persist();
  showStart();
}

// ---- taps and keys ----------------------------------------------------------------------

const DO = {
  tab(el) { tab = el.dataset.tab; sfx('tap'); closeSheets(); render(); },
  next: nextSeason,
  back() { sfx('tap'); backSheet(); },
  close() { sfx('tap'); closeSheets(); },
  open(el) { sfx('tap'); openSheet({ kind: el.dataset.kind }); },
  person(el) { sfx('tap'); openSheet({ kind: 'person', id: Number(el.dataset.id) }, true); },
  act(el) {
    if (el.dataset.why) { sfx('nope'); toast(el.dataset.why); return; }
    doAct(el.dataset.id, el.dataset.x === undefined ? undefined : JSON.parse(el.dataset.x));
  },
  goals() { sfx('tap'); if (life.s.ill) goTo('hospital'); else showGoals(); },
  trophies() { sfx('tap'); showTrophies(); },
  menu() { sfx('tap'); showMenu(); },
  // starting out
  look(el) { draft.look[el.dataset.key] = Number(el.dataset.i); sfx('tap'); renderStart(); },
  style() { draft.look.style = (draft.look.style + 1) % LOOKS.styles; sfx('tap'); renderStart(); },
  rlook() { const r = (n) => Math.floor(Math.random() * n); draft.look = { skin: r(LOOKS.skin.length), hair: r(LOOKS.hair.length), top: r(LOOKS.top.length), style: r(LOOKS.styles) }; sfx('flip'); renderStart(); },
  rname() { draft.name = NAMES[Math.floor(Math.random() * NAMES.length)]; sfx('flip'); renderStart(); },
  bg(el) { draft.bg = el.dataset.id; sfx('tap'); renderStart(); },
  dream(el) {
    const id = el.dataset.id, at = draft.dreams.indexOf(id);
    if (at >= 0) draft.dreams.splice(at, 1);
    else if (draft.dreams.length < 3) draft.dreams.push(id);
    else { sfx('nope'); toast('Three dreams is plenty for one life.'); return; }
    sfx('tap'); renderStart();
  },
  heir(el) { draft.heir = draft.heir === el.dataset.id ? null : el.dataset.id; sfx('tap'); renderStart(); },
  begin: beginLife,
  heirLife() { sfx('tap'); afterEnd(true); },
  newFamily() { sfx('tap'); afterEnd(false); },
};

document.addEventListener('click', (e) => {
  const place = e.target.closest('.place');
  if (place) { goTo(place.dataset.place); return; }
  const el = e.target.closest('[data-do]');
  if (el) { DO[el.dataset.do]?.(el); return; }
  if (e.target === $('sheetBack')) closeSheets();
});

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape' && !ui.isOpen() && sheets.length) closeSheets();
  if ((e.key === 'n' || e.key === 'N' || e.key === 'Enter') && life && !$('app').hidden && !ui.isOpen() && !sheets.length) nextSeason();
});

// ---- off we go --------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();

if (life) {
  $('app').hidden = false;
  render();
  pump();
} else showStart();

// For testing from the browser's console.
window.__town = { get life() { return life; }, save, render, pump };
