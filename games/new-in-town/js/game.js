// New in Town: the screen. Shows the life in engine.js: the town map, the
// sheets that slide up for places and people, the cards for events, the
// start of a life and the end of one. Nothing here decides anything; it
// asks the Life what can be done and shows what happened.

import { Life } from './engine.js';
import {
  money, cashShort, SEASONS, SEASON_ICON, STATS, STAT_NAME, STAT_ICON, PLACES, CAREERS, COURSES, GRADES, STUDENT_RATE, HOMES, UPGRADES, FOOD, INSURANCE, ITEMS,
  STOCKS, PROPS, BUSINESSES, FISH, OUTINGS, PERKS, PETS, TRAITS, BACKGROUNDS, LOOKS, DREAMS, QUESTS, TROPHIES, RIBBONS, RIBBON, NAMES_M, NAMES_F, LOAN_RATE,
  CROPS, PLOT_RENT, CURIOS, CURIO_SETS, GIFTS, many, an, lowJob,
} from './data.js';
import { handTotal } from './pier.js';
import { CHIRPS } from './fame.js';
import { playMini, quitMini } from './mini.js';
import { SCREENS } from './ui-mods.js';
import { townSvg, gaolSvg, face, spark, placeTier } from './art.js';
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
let area = 'bay'; // which map is showing: the bay, or the old town up the hill
let MODS = []; // the screens for the newer parts of town (ui-mods.js), once they are set up
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
  $('ava').innerHTML = face(s.look, s.age, s.happy, s.sex);
  $('whoName').textContent = s.name;
  $('whoSub').textContent = `Age ${s.age} · ${s.gaol ? 'Starling Gaol' : life.jobTitle() || (s.retired ? 'Retired' : 'Between jobs')}`;
  $('cash').textContent = cashShort(s.cash);
  $('date').textContent = `${SEASON_ICON[life.season]} ${SEASONS[life.season]}, year ${life.year}${s.wx !== 'fair' ? ` ${life.weather().icon}` : ''}`;
  meter('mHealth', s.health, life.healthCap());
  meter('mHappy', s.happy, 100);
  const max = Math.max(life.timeMax(), s.time);
  $('pips').innerHTML = `<small>Time</small>${Array.from({ length: max }, (_, i) => `<i class="${i < s.time ? 'on' : ''}"></i>`).join('')}`;
  const q = QUESTS[s.quest];
  const todo = $('todo');
  if (s.gaol) { todo.className = 'todo ill'; todo.innerHTML = `<i>⛓️</i><span>${s.gaol.left} season${s.gaol.left > 1 ? 's' : ''} to serve. ${esc(life.goodWord())}.</span>`; }
  else if (s.run) { todo.className = 'todo ill'; todo.innerHTML = '<i>🚨</i><span>On the run. Lie low until the law loses interest.</span>'; }
  else if (s.ill) { todo.className = 'todo ill'; todo.innerHTML = `<i>🤒</i><span>${esc(s.ill.name[0].toUpperCase() + s.ill.name.slice(1))}: the hospital can treat it.</span>`; }
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
  const inside = !!life.s.gaol;
  $('map').hidden = inside; $('gaol').hidden = !inside;
  if (tab === 'town') { if (inside) renderGaol(); else renderMap(); }
  else if (tab === 'me') $('pMe').innerHTML = meHtml();
  else if (tab === 'people') $('pPeople').innerHTML = peopleHtml();
  else $('pJournal').innerHTML = journalHtml();
}

// ---- prison -----------------------------------------------------------------------------

// Inside there is no map: the town tab is the cell, and everything there is to do.
function renderGaol() {
  const s = life.s, q = s.gaol, box = $('gaol'), keep = box.scrollTop;
  const bar = (ico, label, v, word, colour) => `<div class="skill"><i>${ico}</i><span>${label}</span><span class="bar"><span style="width:${v}%;background:${colour}"></span></span><b>${Math.round(v)}</b></div><p class="fine">${word}</p>`;
  box.innerHTML = `<div class="box cell">${gaolSvg(life.season, q.served)}<div class="cell-text"><h2>Starling Gaol</h2><p>${q.left} season${q.left > 1 ? 's' : ''} to serve, ${q.served} done${q.inSol ? ' · in the block this season' : ''}</p></div></div>
    ${result && !sheets.length ? `<div class="box said${result.fresh ? ' flash' : ''}"><p>${esc(result.text)}</p><div class="chgs">${chips(result.changes)}</div></div>` : ''}
    <div class="box">${bar('📋', 'Record', q.good, `${life.goodWord()}. This is what the parole board reads.`, 'var(--teal)')}${bar('🥫', 'Standing', q.rep, `${life.repWord()}. This is what keeps you safe on the landing.`, 'var(--coral)')}
      ${q.total >= 3 && q.served * 2 < q.total ? `<p class="fine">The parole board sits once half your time is done: about ${Math.round(life.paroleOdds() * 100)}% they would let you go, as things stand.</p>` : ''}</div>
    <div class="acts">${sections(life.placeActions('gaol'))}</div>`;
  if (result) result.fresh = false;
  box.scrollTop = keep;
}

// ---- the map ----------------------------------------------------------------------------

function renderMap() {
  const s = life.s, work = s.job ? CAREERS[s.job.c].place : null, biz = s.biz ? BUSINESSES[s.biz.type].place : null;
  const ripe = !!s.plot && (s.plot.beds.some((b) => life.bedRipe(b)) || (life.season === 2 && s.marrow > 0));
  const fest = s.use.fest ? null : life.fest().at;
  const marks = {}, mark = (id, e, cls) => { if (id) (marks[id] = marks[id] || []).push(cls ? [e, cls] : [e]); };
  mark(work, '💼'); mark(biz, '🏪'); mark(fest, '🎪', 'fest');
  if (ripe) mark('park', '🥕');
  if (s.course) mark('college', '✏️');
  for (const m of MODS) if (m.marks) for (const [id, e] of m.marks(life) || []) mark(id, e);
  const key = `${area}|${placeTier(s.home)}|${JSON.stringify(marks)}`;
  if (key !== mapKey) {
    mapKey = key;
    $('mapArt').innerHTML = townSvg({ area, tier: placeTier(s.home), marks });
    $('pTown').classList.toggle('hill', area === 'hill');
    $('mapGo').innerHTML = area === 'bay' ? '⛰️ <b>Up the hill</b>' : '⚓ <b>Down to the bay</b>';
    // (A badge on the other map is worth knowing about.)
    $('mapGo').classList.toggle('dot', Object.keys(marks).some((id) => (PLACES[id].area || 'bay') !== area));
  }
  $('me').innerHTML = face(s.look, s.age, s.happy, s.sex);
  placeMe();
  fitMap();
}

function placeMe() {
  const p = PLACES[here];
  $('me').hidden = (p.area || 'bay') !== area;
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
  if (busy || !life || life.s.dead || life.s.gaol) return;
  sfx('tap');
  const far = here !== place;
  here = place;
  area = PLACES[place].area || 'bay';
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
  return `<button class="act${off ? ' off' : ''}${a.id === 'work' ? ' work' : ''}${a.id === 'workPlay' ? ' play' : ''}${a.id === 'workPlay' && life.playDue() ? ' due' : ''}" ${attrs}>
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
    if (id === 'home') { title = HOMES[s.home].name; sub = `${s.owned ? 'Yours' : `Rent ${money(life.rentOf(s.home))} a season`}. ${HOMES[s.home].blurb}`; }
    const plaques = life.plaques(id).map((t) => `<p class="plaque">🪧 ${esc(t)}</p>`).join('');
    return { icon: p.icon, title, sub, body: plaques + sections(life.placeActions(id)) };
  },

  jobs() {
    const s = life.s;
    let body = '<p class="lead">Every career is a ladder. Skills and shifts worked take you up it, and the right qualification lets you start partway up. Your job is done at the place it belongs to.</p>';
    for (const [c, car] of Object.entries(CAREERS)) {
      if (car.shady) continue; // (Sal does not advertise.)
      const mine = s.job && s.job.c === c, why = life.can('apply', c), start = life.startRung(c);
      const last = car.rungs[car.rungs.length - 1];
      const ways = Object.entries(car.entry || {}).map(([q, r]) => `<i class="need ${(q === 'degree' ? life.hasDegree() : life.hasEdu(q)) ? 'ok' : ''}">${q === 'degree' ? 'Any degree' : COURSES[q].name} → ${car.rungs[r].title}</i>`).join('');
      body += `<div class="item${mine ? ' mine' : ''}">
        <div class="item-top"><span class="act-ico">${car.icon}</span><div><b>${car.name}</b><small>${esc(car.blurb)}</small></div></div>
        <div class="facts"><span>At ${PLACES[car.place].name}</span><span>Top: ${last.title} ${cashShort(last.pay)}</span>${life.perk(c) ? '<span class="up">You know someone here</span>' : ''}</div>
        <details><summary>The whole ladder</summary>${car.rungs.map((r, i) => `<div class="rung${mine && s.job.r === i ? ' now' : ''}"><b>${i + 1}. ${r.title}</b><span>${money(r.pay)} a shift</span><div>${needChips(life.needs(r.need)) || '<i class="need ok">Open to all</i>'}</div></div>`).join('')}
          ${ways ? `<p class="fine">Ways in higher up:</p><div class="needs">${ways}</div>` : ''}${car.clean ? '<p class="fine">Needs a clean record.</p>' : ''}${car.retire ? `<p class="fine">Players retire at ${car.retire}.</p>` : ''}${car.summer ? '<p class="fine">Long summer holidays: extra time every summer.</p>' : ''}</details>
        <div class="picks">${mine ? '<span class="note">This is your job</span>' : why ? `<span class="note">${esc(why)}</span>` : `${pick(`Start as ${car.rungs[start].title} ${chip('time', '⏱ 1')}`, 'apply', c)}<span class="note${start ? ' ok' : ''}">${money(car.rungs[start].pay)} a shift${start ? ': no starting at the bottom' : ''}${life.entryMiss(c) ? `. ${esc(life.entryMiss(c))}` : ''}</span>`}</div>
      </div>`;
    }
    return { icon: '📋', title: 'The job board', sub: s.job ? `You are ${life.jobTitle()}` : 'You are between jobs', body };
  },

  courses() {
    const s = life.s;
    let body = `<p class="lead">One course at a time. Each class takes two blocks of time, then there is an exam: revise for a better mark. Pay class by class, or put it all on a student loan (${STUDENT_RATE * 100}% a season, paid back out of your wages).</p>`;
    for (const [id, c] of Object.entries(COURSES)) {
      const done = s.edu[id], on = s.course && s.course.id === id, why = life.can('enrol', { id });
      const opens = [], needed = [];
      for (const car of Object.values(CAREERS)) {
        if (car.entry && car.entry[id]) opens.push(car.rungs[car.entry[id]].title);
        for (const r of car.rungs) if (r.need.edu === id) needed.push(r.title);
      }
      const good = [opens.length ? `Start as: ${opens.join(', ')}` : '', needed.filter((t) => !opens.includes(t)).length ? `Needed for: ${needed.filter((t) => !opens.includes(t)).join(', ')}` : '', c.degree ? 'Counts as a degree' : ''].filter(Boolean).join('. ');
      body += `<div class="item${on ? ' mine' : ''}">
        <div class="item-top"><span class="act-ico">${c.icon}</span><div><b>${c.name}</b><small>${c.classes} classes at ${money(life.classFee(id))} each (${cashShort(life.classFee(id) * c.classes)} in all)</small></div></div>
        <p class="fine">${good}.</p>
        <div class="facts">${needChips(life.needs(c.need))}</div>
        <div class="picks">${done ? `<span class="note ok">✓ You have this: ${GRADES[done.g]}</span>` : on ? `<span class="note">${s.course.exam ? 'Only the exam to go' : `${s.course.p} of ${c.classes} classes done`}${s.course.loan ? ', on your student loan' : ''}</span>${pick('Drop it', 'drop', undefined, null, 'quiet')}` : why ? `<span class="note">${esc(why)}</span>` : `${pick('Sign up', 'enrol', { id })}${pick('Sign up on a student loan', 'enrol', { id, loan: true }, null, 'quiet')}`}</div>
      </div>`;
    }
    return { icon: '🎓', title: 'Courses', sub: s.course ? `You are taking the ${COURSES[s.course.id].name}` : 'Starling College prospectus', body };
  },

  homes() {
    const s = life.s, mine = life.homeEntry();
    let body = `<p class="lead">A better home lifts your mood every season, and you need room for a family. Buying takes a fifth down; the bank lends the rest. Buy a second home and the first stays yours, to let out or sell.</p>`;
    if (s.estate.length) body += `<button class="act" data-do="open" data-kind="estate"><span class="act-ico">🏘️</span><span class="act-main"><b>Your property</b><small>${s.estate.length} owned. Move in, let out or sell.</small></span><span class="act-cost"><i class="go">›</i></span></button>`;
    for (const [id, h] of Object.entries(HOMES)) {
      const here = s.home === id;
      const plan = h.price != null ? life.buyPlan(id, false) : null, trade = plan && mine && mine.kind !== id ? life.buyPlan(id, true) : null;
      const how = (p) => (p.loan ? `${cashShort(Math.max(0, p.cash))} down, ${cashShort(p.loan)} borrowed` : p.cash > 0 ? `${cashShort(p.cash)} outright` : `${cashShort(-p.cash)} back in your pocket`);
      body += `<div class="item${here ? ' mine' : ''}">
        <div class="item-top"><span class="act-ico">${h.icon}</span><div><b>${h.name}</b><small>${esc(h.blurb)}</small></div></div>
        <div class="facts"><span>Comfort ${'★'.repeat(Math.max(1, Math.round(h.comfort / 4.4)))}</span><span>${h.kids ? `Room for ${h.kids} ${h.kids > 1 ? 'children' : 'child'}` : id === 'hostel' ? 'Just you' : 'Room for two'}</span>${plan ? `<span>Sells for ${cashShort(plan.price)}</span>` : ''}</div>
        <div class="picks">
          ${here ? `<span class="note ok">You live here${s.owned ? ', and own it' : ''}</span>` : ''}
          ${h.rent != null && !(here && !s.owned) ? pick(`Rent · ${money(life.rentOf(id))} a season ${chip('time', '⏱ 1')}`, 'rentHome', id, life.can('rentHome', id)) : ''}
          ${plan && !(here && s.owned) ? pick(`Buy and move in ${chip('time', '⏱ 1')}`, 'buyHome', { id }, life.can('buyHome', { id })) : ''}
          ${trade ? pick(`Trade in the ${life.propSaid(mine)} ${chip('time', '⏱ 1')}`, 'buyHome', { id, trade: true }, life.can('buyHome', { id, trade: true }), 'quiet') : ''}
        </div>
        ${plan && !(here && s.owned) ? `<p class="fine">To buy: ${how(plan)}${mine && !trade ? '' : ''}.${trade ? ` Trading in: ${how(trade)}.` : mine ? ` Your ${life.propSaid(mine)} stays yours.` : ''}</p>` : ''}
      </div>`;
    }
    return { icon: '📦', title: 'Move house', sub: 'Tidewater Estates', body };
  },

  estate() {
    const s = life.s;
    let body = '<p class="lead">Everything you own. Live in one; let the others out for rent, or sell them. Property mostly creeps up in value, and the bank will lend against it.</p>';
    if (s.estate.length) body += '<h3>Yours</h3>';
    for (const e of s.estate) {
      const k = HOMES[e.kind] || PROPS[e.kind], home = e.id === s.homeAt, ups = Object.keys(e.ups);
      body += `<div class="item${home ? ' mine' : ''}">
        <div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${k.name}</b><small>Worth ${money(life.propValue(e))}${ups.length ? `, with ${ups.map((u) => UPGRADES[u].name.toLowerCase()).join(', ')}` : ''}</small></div></div>
        <div class="facts"><span class="${home ? '' : e.let ? 'up' : 'down'}">${home ? 'You live here' : e.let ? `Let: ${money(life.propEarn(e))} a season` : `Empty: costs ${money(life.propValue(e) * 0.003)} a season`}</span></div>
        <div class="picks">${home ? '' : `${HOMES[e.kind] ? pick(`Move in ${chip('time', '⏱ 1')}`, 'moveIn', e.id, life.can('moveIn', e.id)) : ''}${e.let ? (PROPS[e.kind] ? '' : pick('Stop letting', 'letProp', e.id, null, 'quiet')) : pick(`Let it out · ${money(life.propEarn(e))} a season`, 'letProp', e.id)}${pick(`Sell · ${cashShort(life.propValue(e) * 0.96)}`, 'sellEstate', e.id, null, 'quiet')}`}</div>
      </div>`;
    }
    body += '<h3>To buy and let out</h3>';
    for (const [kind, k] of [...Object.entries(PROPS), ...Object.entries(HOMES).filter(([, h]) => h.price != null)]) {
      const price = life.propPrice(kind), why = life.can('buyLet', kind), plan = life.buyPlan(kind, false);
      body += `<div class="item">
        <div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${k.name}</b><small>${cashShort(price)}. Brings in about ${money(price * k.earn)} a season</small></div></div>
        <div class="picks">${pick(`Buy to let ${chip('time', '⏱ 1')}`, 'buyLet', kind, why)}<span class="note">${why ? esc(why) : plan.loan ? `${cashShort(plan.cash)} down, ${cashShort(plan.loan)} borrowed` : 'Paid outright'}</span></div>
      </div>`;
    }
    return { icon: '🏘️', title: 'Property', sub: s.estate.length ? `Worth ${money(life.estateWorth())}. Rent coming in: ${money(life.letIncome())} a season` : 'You own no property yet', body };
  },

  sal() {
    const s = life.s, crew = CAREERS.crew, mine = s.job && s.job.c === 'crew';
    const body = `<p class="lead">Every crime blackens your name and draws the law’s eye, and the more it is watching, the likelier the next one goes wrong. It cools off if you keep your nose clean for a while. Small things are a fine; big ones are prison.</p>
      <div class="facts"><span>🚨 The law: ${life.lawWord().toLowerCase()}</span><span>${s.n.crimes} crime${s.n.crimes === 1 ? '' : 's'} to your name</span>${s.record ? `<span class="down">Record: ${s.record}</span>` : ''}${s.shark ? `<span class="down">You owe Sal ${money(s.shark)}</span>` : ''}</div>
      ${sections(life.placeActions('sal'))}
      <div class="item${mine ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${crew.icon}</span><div><b>The crew</b><small>${esc(crew.blurb)} Every shift is a crime.</small></div></div>
        ${crew.rungs.map((r, i) => `<div class="rung${mine && s.job.r === i ? ' now' : ''}"><b>${i + 1}. ${r.title}</b><span>${money(r.pay)} a shift</span><div>${needChips(life.needs(r.need))}</div></div>`).join('')}</div>`;
    return { icon: '🦊', title: 'Sal’s back room', sub: 'Behind the ice house. Knock twice.', body };
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
      <div class="item"><div class="item-top"><span class="act-ico">🐷</span><div><b>Savings: ${money(s.bank)}</b><small>Earns ${+(life.savingsRate() * 100).toFixed(1)}% every season, and cannot be burgled. Anything your cash will not cover is paid from here. Cash on you: ${money(s.cash)}.</small></div></div>
        <h4>Pay in</h4><div class="picks">${amounts('deposit', s.cash, 'All')}</div>
        <h4>Take out</h4><div class="picks">${amounts('withdraw', s.bank, 'All')}</div></div>
      <div class="item"><div class="item-top"><span class="act-ico">🧾</span><div><b>Loan: ${money(s.debt)}</b><small>Costs ${LOAN_RATE * 100}% every season. The bank will lend you up to ${money(lim)}, going by your pay and what you own. Owe more than that and it starts selling your things.</small></div></div>
        <h4>Borrow</h4><div class="picks">${amounts('borrow', room, 'Max')}</div>
        ${s.debt ? `<h4>Pay back</h4><div class="picks">${amounts('repay', Math.min(s.cash, s.debt), 'All I can')}</div>` : ''}</div>
      ${s.sloan ? `<div class="item"><div class="item-top"><span class="act-ico">🎓</span><div><b>Student loan: ${money(s.sloan)}</b><small>Grows by ${STUDENT_RATE * 100}% a season. A tenth of every pay packet goes towards it; you can pay more here.</small></div></div>
        <h4>Pay back</h4><div class="picks">${amounts('repayStudent', Math.min(s.cash, s.sloan), 'All I can')}</div></div>` : ''}`;
    return { icon: '🏦', title: 'Savings and loans', sub: `Worth ${money(life.netWorth())} all told`, body };
  },

  stocks() {
    const s = life.s, k = s.stk;
    let body = '<p class="lead">Prices jump about from season to season, but over the years they climb. The index fund holds a little of everything: slower, and much steadier. Some shares also pay you a dividend every season.</p>';
    if (k.news.length) body += `<div class="item"><h4>In the papers</h4>${k.news.slice(0, 4).map((n) => `<p class="entry"><i class="${n.up ? 'up' : 'down'}">${n.up ? '▲' : '▼'}</i>${esc(n.text)}${s.t - n.t > 1 ? ` (${s.t - n.t} seasons ago)` : ''}</p>`).join('')}</div>`;
    for (const [sym, st] of Object.entries(STOCKS)) {
      const p = k.p[sym], h = k.h[sym], prev = h.length > 1 ? h[h.length - 2] : p, own = k.own[sym] || 0;
      const move = (p - prev) / prev, worth = own * p, gain = own ? worth - (k.paid[sym] || 0) : 0, long = h.length > 4 ? (p - h[0]) / h[0] : null;
      const have = s.cash + s.bank, maxQ = Math.floor(have / p);
      const buy = (n) => { const q = Math.floor(n / p); return q >= 1 && (n === 1000 || have >= n) ? pick(`Buy ${cashShort(n)}`, 'shares', { sym, n: q }, life.can('shares', { sym, n: q })) : ''; };
      body += `<div class="item${st.fund ? ' fund' : ''}">
        <div class="item-top"><span class="act-ico">${st.icon}</span><div><b>${st.name}</b><small>${sym} · ${esc(st.blurb)}</small></div>
          <div class="quote"><b>$${p.toFixed(2)}</b><small class="${move >= 0 ? 'up' : 'down'}">${move >= 0 ? '▲' : '▼'} ${Math.abs(move * 100).toFixed(1)}%</small></div></div>
        ${spark(h, 300, 34)}
        <div class="facts">${long != null ? `<span class="${long >= 0 ? 'up' : 'down'}">${long >= 0 ? 'Up' : 'Down'} ${Math.abs(long * 100).toFixed(0)}% in ${h.length - 1 >= 40 ? 'ten years' : `${h.length - 1} seasons`}</span>` : ''}<span>${st.div ? `Pays ${(st.div * 100).toFixed(1)}% a season` : 'No dividend'}</span>
          ${own ? `<span>You hold ${own.toLocaleString()}, worth ${cashShort(worth)}</span><span class="${gain >= 0 ? 'up' : 'down'}">${gain >= 0 ? 'Up' : 'Down'} ${cashShort(Math.abs(gain))} on what you paid</span>` : ''}</div>
        <div class="picks">${buy(1000)}${buy(10000)}${buy(100000)}${maxQ >= 1 && have > 1000 ? pick('Buy all I can', 'shares', { sym, n: maxQ }) : ''}
          ${own ? pick('Sell half', 'sellShares', { sym, n: Math.max(1, Math.floor(own / 2)) }, null, 'quiet') + pick('Sell all', 'sellShares', { sym, n: own }, null, 'quiet') : ''}</div>
      </div>`;
    }
    return { icon: '📈', title: 'Shares', sub: `Yours are worth ${money(life.sharesWorth())}${life.dividends() ? `, paying ${money(life.dividends())} a season` : ''}. To spend: ${money(s.cash + s.bank)}`, body };
  },

  insure() {
    const s = life.s;
    let body = '<p class="lead">A premium every season, against the day something goes wrong.</p>';
    for (const [id, c] of Object.entries(INSURANCE)) {
      body += `<div class="item${s.ins[id] ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${c.icon}</span><div><b>${c.name}</b><small>${money(c.cost)} a season. ${c.blurb}</small></div></div>
        <div class="picks">${s.ins[id] ? `<span class="note ok">✓ You are covered</span>${pick('Cancel', 'insure', id, null, 'quiet')}` : pick('Take it out', 'insure', id)}</div></div>`;
    }
    return { icon: '☂️', title: 'Insurance', sub: 'Harbour Bank', body };
  },

  food() {
    const s = life.s;
    let body = '<p class="lead">How you eat shows up in your bills, your health and your mood, every season.</p>';
    FOOD.forEach((f, i) => {
      body += `<div class="item${s.food === i ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${f.icon}</span><div><b>${f.name}</b><small>${f.blurb} ${f.cost ? `${f.cost > 0 ? `${money(f.cost)} more` : `${money(-f.cost)} less`} a season.` : ''}</small></div></div>
        <div class="facts">${f.hp ? `<span class="${f.hp > 0 ? 'up' : 'down'}">❤️ ${f.hp > 0 ? 'Good' : 'Bad'} for your health</span>` : ''}${f.mood ? `<span class="${f.mood > 0 ? 'up' : 'down'}">🙂 ${f.mood > 0 ? 'Lifts' : 'Lowers'} your mood</span>` : '<span>Neither here nor there</span>'}</div>
        <div class="picks">${s.food === i ? '<span class="note ok">✓ This is how you eat</span>' : pick('Eat like this', 'food', i)}</div></div>`;
    });
    return { icon: '🧺', title: 'Housekeeping', sub: 'What goes in the shopping basket', body };
  },

  biz() {
    let body = '<p class="lead">Start small. Work in it to bring in money and build its name; when the name is good enough, pay to grow it. From the second size it earns a little without you, and with a manager, a lot.</p>';
    for (const [type, k] of Object.entries(BUSINESSES)) {
      const why = life.can('bizStart', type);
      body += `<div class="item"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${k.names[0]}</b><small>Grows into: ${k.names.slice(1).join(', ').toLowerCase()}</small></div></div>
        <div class="facts"><span>At ${PLACES[k.place].name}</span><span>${STAT_ICON[k.stats[0]]} ${STAT_NAME[k.stats[0]]} and ${STAT_ICON[k.stats[1]]} ${STAT_NAME[k.stats[1]]}</span></div>
        <div class="picks">${pick(`Start · ${money(life.bizCost(0))} ${chip('time', '⏱ 1')}`, 'bizStart', type, why)}${why ? `<span class="note">${esc(why)}</span>` : ''}</div></div>`;
    }
    return { icon: '🏪', title: 'Start a business', sub: 'Be your own boss', body };
  },

  fishbook() {
    const s = life.s, when = (f) => (f.when ? f.when.map((q) => SEASONS[q].toLowerCase()).join(', ') : 'all year');
    const where = (f) => (f.where.length === 2 ? 'the wall or a boat' : f.where[0] === 'wall' ? 'the harbour wall' : f.where[0] === 'boat' ? 'a boat' : 'nobody knows where');
    let body = '<p class="lead">Every kind of fish you have landed. What bites depends on the season, and on whether you fish from the wall or from a boat.</p><div class="things fish">';
    for (const [id, f] of Object.entries(FISH)) {
      const n = s.fishbook[id];
      body += `<span class="${n ? '' : 'unknown'}">${n ? f.icon : '❔'}<b>${n ? f.name : '???'}</b><small>${n ? `Caught ${n}` : id === 'bream' ? 'A legend' : `From ${where(f)}`}<br>${id === 'bream' ? (n ? 'Once in a lifetime' : 'Ask old Marlow') : when(f)}</small></span>`;
    }
    return { icon: '📒', title: 'Your fish book', sub: `${Object.keys(s.fishbook).length} of ${Object.keys(FISH).length} kinds caught`, body: `${body}</div>` };
  },

  dating() {
    const list = life.prospects(), odds = pct(life.wooOdds());
    let body = `<p class="lead">Three new faces every season. A first date costs $60 and an evening. Whether there is a second is down to charm (yours gives you about a ${odds} chance), and to reading the person: the profile says what they are like, so play to it.</p>`;
    list.forEach((p, i) => {
      body += `<div class="item"><div class="item-top"><span class="ava">${face(p.look, p.age, 70, p.sex)}</span><div><b>${esc(p.name)}, ${p.age} ${sexMark(p)}</b><small>${p.sex === 'm' ? 'He' : 'She'} is ${TRAITS[p.trait].name.toLowerCase()}, and works as ${an(lowJob(life.jobOf(p)))}</small></div></div>
        <div class="facts"><span>${TRAITS[p.trait].icon} ${TRAITS[p.trait].name}</span><span>Loves ${OUTINGS[p.likes[0]].icon} ${OUTINGS[p.likes[0]].name.toLowerCase()}</span></div>
        <div class="picks">${pick(`Ask on a date · $60 ${chip('time', '⏱ 1')}`, 'match', i, life.can('match', i))}</div></div>`;
    });
    if (!list.length) body += '<div class="item"><p class="sub">Nobody left to ask this season.</p></div>';
    body += `<div class="picks mid">${pick(`Look for new faces ${chip('time', '⏱ 1')}`, 'rematch', undefined, life.can('rematch'), 'quiet')}</div>`;
    return { icon: '💘', title: 'Seaside Singles', sub: 'Swipe right for a walk on the pier', body };
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

  blackjack() {
    const s = life.s, h = s.bj, o = h ? null : bjShow;
    const one = (c, i) => `<span class="pc${i % 2 ? ' red' : ''}">${{ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[c] || c}<small>${'♠♥♣♦'[i % 4]}</small></span>`;
    const blank = '<span class="pc back"></span>';
    const hand = (cards, hide) => (cards.length ? cards.map((c, i) => (hide && i === 1 ? blank : one(c, i))).join('') : blank + blank);
    const bets = [50, 500, 5000, 50000].filter((b) => b <= 500 || s.cash + s.bank >= b);
    const me = h ? h.me : o ? o.me : [], dl = h ? h.dl : o ? o.dl : [];
    let body = `<p class="hand-of">Dealer${dl.length ? ` · ${h ? '?' : handTotal(dl)}` : ''}</p><div class="hand">${hand(dl, !!h)}</div>
      <p class="hand-of">You${me.length ? ` · ${handTotal(me)}` : ''}</p><div class="hand">${hand(me, false)}</div>`;
    if (h) body += `<p class="slot-say">Your stake is ${money(h.bet)}</p><div class="picks mid">${pick('Hit', 'bjHit')}${pick('Stand', 'bjStand', undefined, null, 'quiet')}${h.me.length === 2 ? pick(`Double · ${cashShort(h.bet)}`, 'bjDouble', undefined, life.can('bjDouble'), 'quiet') : ''}</div>`;
    else body += `<p class="slot-say ${o && o.pay > o.bet ? 'won' : ''}">${o ? esc(o.text) : 'Closest to twenty-one wins.'}</p><div class="picks mid">${bets.map((b) => pick(`Deal ${cashShort(b)}`, 'bjStart', b, life.can('bjStart', b))).join('')}</div>`;
    body += `<p class="fine mid">Picture cards count ten; an ace is one or eleven. The dealer draws to 17. Blackjack (an ace and a ten, dealt) pays three to two. Double: twice the stake, for exactly one more card.<br>You have ${money(s.cash)} on you.</p>`;
    return { icon: '♠️', title: 'Blackjack', sub: 'The Lucky Gull', body };
  },

  races() {
    const s = life.s, o = raceShow;
    const bets = [50, 500, 5000, 50000].filter((b) => b <= 500 || s.cash + s.bank >= b);
    if (!bets.includes(raceStake)) raceStake = 50;
    let body;
    if (o) {
      const place = (i) => o.out.order.indexOf(i);
      body = `<div class="lanes ${o.running ? 'go' : 'done'}">${o.out.card.map((g, i) => `<div class="lane${i === o.out.pick ? ' mine' : ''}${!o.running && place(i) === 0 ? ' won' : ''}"><small>${esc(g.name)}${i === o.out.pick ? ' ★' : ''}</small><span class="track"><i style="--d:${(2 + place(i) * 0.34).toFixed(2)}s">🐦</i></span><b>${o.running ? '' : ['1st', '2nd', '3rd', '4th', '5th'][place(i)]}</b></div>`).join('')}</div>
        <p class="slot-say ${!o.running && o.out.pay ? 'won' : ''}">${o.running ? 'And they are off!' : esc(o.text)}</p>
        ${o.running ? '' : '<div class="picks mid"><button class="pick" data-do="again">Next race</button></div>'}`;
    } else {
      const order = life.raceCard().map((g) => g.pays).sort((a, b) => a - b);
      const form = (g) => (g.pays === order[0] ? 'The favourite. Eats first, asks later.' : g.pays === order[4] ? 'Has never been known to hurry.' : g.pays === order[1] ? 'Fancied. Has been seen near a chip before.' : 'Has its days.');
      body = `<p class="lead">Five gulls on the rail, and one chip thrown from the end of the pier. First bird to it wins. Pick your stake, then your gull.</p>
        <div class="picks mid">${bets.map((b) => `<button class="pick ${b === raceStake ? '' : 'quiet'}" data-do="stake" data-v="${b}">${cashShort(b)}</button>`).join('')}</div>
        <h3>On the rail</h3>${life.raceCard().map((g, i) => `<button class="act" data-do="act" data-id="raceBet"${jx({ i, bet: raceStake })}><span class="act-ico">🐦</span><span class="act-main"><b>${esc(g.name)}</b><small>${form(g)}</small></span><span class="act-cost">${chip('cash', `pays ×${g.pays}`)}</span></button>`).join('')}`;
    }
    body += `<p class="fine mid">A winner pays your stake times the number shown.<br>You have ${money(s.cash)} on you.</p>`;
    return { icon: '🐦', title: 'The gull races', sub: 'Off the end of the pier', body };
  },

  chirper() {
    const s = life.s, n = life.followers(), used = s.use.chirp || 0;
    const rows = [...Object.keys(CHIRPS).map((k) => life.look('chirp', k)), life.look('chirpSpon'), life.look('chirpShill'), life.look('chirpTroll')];
    const body = `<div class="bigstat"><b>${n.toLocaleString('en')}</b><small>follower${n === 1 ? '' : 's'}${s.chirp && s.chirp.ban ? ' · your account is suspended' : ''}</small></div>
      <p class="lead">Post what you are good at: each kind of post leans on a different skill, and the bigger the crowd, the faster it grows. Four posts a season at most (${Math.max(0, 4 - used)} left). Go a season without posting and people drift off. From 5,000 followers, companies will pay you.</p>
      ${sections(rows)}`;
    return { icon: '🐤', title: 'Chirper', sub: n >= 1e6 ? 'You are verified' : n >= 1e5 ? 'You are an influencer' : n >= 1000 ? 'You have a following' : 'Say something', body };
  },

  gazette() {
    const g = life.gazette();
    const body = `<div class="paper"><p class="mast">The Starling Bay Gazette</p><p class="dateline">${SEASONS[life.season]}, year ${life.year} · Twenty cents</p>
      <h2>${g.lead.icon} ${esc(g.lead.h)}</h2><p class="story">${esc(g.lead.t)}</p>
      ${g.items.map((it) => `<div class="col"><h4>${it.icon} ${esc(it.h)}</h4><p>${esc(it.t)}</p></div>`).join('')}</div>`;
    return { icon: '📰', title: 'The Gazette', sub: 'All the news that fits', body };
  },

  plot() {
    const s = life.s, p = s.plot, q = life.season;
    const when = (list) => list.map((k) => SEASONS[k].toLowerCase()).join(' or ');
    const almanac = `<details><summary>The almanac: what to sow, and when</summary>${Object.entries(CROPS).map(([id, c]) => `<div class="rung"><b>${c.icon} ${c.name}</b><span>${c.show ? 'for the Harvest Show' : `about ${money(c.pay)}`}</span><div><i class="need ${c.sow.includes(q) ? 'ok' : ''}">Sow in ${when(c.sow)}</i><i class="need">Ready ${c.ripe === 1 ? 'the next season' : 'two seasons on'}</i>${s.grown[id] ? '<i class="need ok">✓ Grown</i>' : ''}</div></div>`).join('')}
      <p class="fine">A crop keeps for the season it is ready and the one after; then it is lost. Weeding and watering (twice a season is all a bed can use) makes for a bigger harvest.</p></details>`;
    if (!p) return { icon: '🥕', title: 'The allotments', sub: 'Behind Pebble Park', body: `<p class="lead">Three beds, a shed and a water butt for ${money(PLOT_RENT)} a season. What you can sow depends on the time of year. Look after it and it pays you back in vegetables, fresh air and Craft.</p><div class="picks mid">${pick('Take a plot', 'plotRent', undefined, life.can('plotRent'))}</div>${almanac}` };
    let body = '<p class="lead">Sow in the right season, weed and water, and bring it in when it is ready.</p>';
    p.beds.forEach((b, i) => {
      if (b) {
        const c = CROPS[b.c], left = c.ripe - b.age, care = Math.round(life.bedCare(b) * 100);
        body += `<div class="item${left <= 0 ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${c.icon}</span><div><b>${c.name}</b><small>${left > 0 ? `Ready in ${left} season${left > 1 ? 's' : ''}` : b.age > c.ripe ? 'Ready, and it will not keep another season' : 'Ready to bring in'}</small></div></div>
          <div class="skill"><i>💧</i><span>Looked after</span><span class="bar"><span style="width:${care}%"></span></span><b>${care}%</b></div></div>`;
      } else {
        const can = Object.keys(CROPS).filter((c) => CROPS[c].sow.includes(q));
        body += `<div class="item"><div class="item-top"><span class="act-ico">🟫</span><div><b>An empty bed</b><small>${can.length ? 'Sow something:' : 'Nothing can be sown this season.'}</small></div></div>
          <div class="picks">${can.map((c) => pick(`${CROPS[c].icon} ${CROPS[c].name} · ${money(CROPS[c].seed)} ${chip('time', '⏱ 1')}`, 'sow', { b: i, c }, life.can('sow', { b: i, c }))).join('')}</div></div>`;
      }
    });
    body += actRow(life.look('tend')) + actRow(life.look('reap'));
    if (s.marrow) body += `<p class="sub">🥒 A ${s.marrow} kg marrow is in the shed, for the Harvest Show at the park in autumn.</p>`;
    body += `${almanac}<details><summary>Had enough?</summary><p class="fine">Whatever is in the ground goes with it.</p><div class="picks">${pick('Give up the plot', 'plotQuit', undefined, null, 'quiet')}</div></details>`;
    return { icon: '🥕', title: 'Your allotment', sub: `Plot 14 · ${money(PLOT_RENT)} a season`, body };
  },

  gifts() {
    const s = life.s;
    let body = '<p class="lead">The mayor keeps a list of things Starling Bay needs and cannot afford. Pay for one and your name goes on it, for good: if your family carries on here, it will still be standing, and most of them will still be doing your heirs good.</p>';
    for (const [id, g] of Object.entries(GIFTS)) {
      const by = s.gifts[id], why = life.can('fund', id);
      body += `<div class="item${by ? ' mine' : ''}"><div class="item-top"><span class="act-ico">${g.icon}</span><div><b>${g.name}</b><small>${esc(by ? life.plaque(id) : g.blurb)}</small></div>${by ? '' : `<div class="quote"><b>${cashShort(g.cost)}</b></div>`}</div>
        <div class="facts"><span class="${by && !(g.own && !s.gave[id]) ? 'up' : ''}">${by && !(g.own && !s.gave[id]) ? '✓ ' : ''}${by && g.own && !s.gave[id] ? 'The seat on the pier company’s board went with the one who paid for it.' : g.perk}</span></div>
        ${by ? '' : `<div class="picks">${pick(`Pay for it · ${cashShort(g.cost)} ${chip('time', '⏱ 1')}`, 'fund', id, why)}${why ? `<span class="note">${esc(why)}</span>` : ''}</div>`}</div>`;
    }
    return { icon: '🏗️', title: 'The mayor’s appeal', sub: `${Object.keys(s.gifts).length} of ${Object.keys(GIFTS).length} given`, body };
  },

  barber() {
    const s = life.s, look = s.look;
    const here = ' data-why="That is how it is now."';
    const cuts = Array.from({ length: LOOKS.styles }, (_, i) => `<button class="cut${look.style === i ? ' on' : ''}" data-do="act" data-id="restyle"${jx({ k: 'style', v: i })}${look.style === i ? here : ''}><span class="ava">${face({ ...look, style: i }, s.age, 70, s.sex)}</span></button>`).join('');
    const sw = (key, list) => `<div class="swatches">${list.map((c, i) => `<button class="sw${look[key] === i ? ' on' : ''}" style="background:${c}" data-do="act" data-id="restyle"${jx({ k: key, v: i })}${look[key] === i ? here : ''} aria-label="${key} ${i + 1}"></button>`).join('')}</div>`;
    const body = `<div class="mirror"><span class="ava huge">${face(look, s.age, s.happy, s.sex)}</span></div>
      <p class="lead mid">Every change is ${money(40)}. A new look cheers you up, the first time each season.</p>
      <h3>The cut</h3><div class="cuts">${cuts}</div>
      <h3>The colour</h3>${sw('hair', LOOKS.hair)}
      <h3>What you wear</h3>${sw('top', LOOKS.top)}
      ${s.sex === 'm' ? `<div class="picks mid">${pick(look.beard ? 'Shave it off' : 'Grow a beard', 'restyle', { k: 'beard' }, null, 'quiet')}</div>` : ''}`;
    return { icon: '💈', title: 'Curl Up & Dye', sub: 'A whole new you', body };
  },

  curios() {
    const s = life.s, cur = s.cur;
    if (life.pymShut()) return { icon: '🏺', title: 'Pym’s Curios', sub: 'Closed, to you', body: '<p class="lead">The card in the door says OPEN. Mr Pym, seeing you through the glass, turns it round. He has not forgotten the tea caddy, and will not for a while yet.</p>' };
    let body = '<p class="lead">Mr Pym buys and sells old things, and his prices wander: the guide price is what a thing is really worth. Four of a kind make a set, and a set is worth twice its parts to a collector.</p><h3>In the window</h3>';
    cur.stock.forEach((c, i) => {
      const k = CURIOS[c.id];
      body += `<div class="item"><div class="item-top"><span class="act-ico">${k.icon}</span><div><b>${k.name}</b><small>${CURIO_SETS[k.set]}${s.curios[c.id] ? ` · you have ${s.curios[c.id]}` : s.curSeen[c.id] ? '' : ' · new to you'}</small></div><div class="quote"><b>${money(c.ask)}</b><small class="${c.ask <= k.worth ? 'up' : 'down'}">guide ${money(k.worth)}</small></div></div>
        <div class="picks">${pick(`Buy · ${money(c.ask)}`, 'curioBuy', i, life.can('curioBuy', i))}</div></div>`;
    });
    body += cur.stock.length ? `<div class="picks mid">${pick('Haggle over the lot', 'haggle', undefined, life.can('haggle'), 'quiet')}</div>` : '<div class="item"><p class="sub">The window is empty until next season.</p></div>';
    body += '<h3>Your collection</h3>';
    for (const [k, name] of Object.entries(CURIO_SETS)) {
      const ids = Object.keys(CURIOS).filter((id) => CURIOS[id].set === k), full = life.hasSet(k);
      body += `<div class="item${full ? ' mine' : ''}"><div class="item-top"><div><b>${name}</b><small>${full ? 'Complete!' : `${ids.filter((id) => s.curios[id]).length} of 4`} · this season Mr Pym pays ${Math.round(cur.bid[k] * 100)}% of guide</small></div></div>
        <div class="things cur">${ids.map((id) => { const c = CURIOS[id], n = s.curios[id] || 0; return n ? `<button data-do="act" data-id="curioSell"${jx(id)}>${c.icon}<small>${c.name}${n > 1 ? ` ×${n}` : ''}</small><em>Sell ${cashShort(life.curioBid(id))}</em></button>` : `<span class="${s.curSeen[id] ? 'had' : 'unknown'}">${s.curSeen[id] ? c.icon : '❔'}<small>${s.curSeen[id] ? c.name : '???'}</small></span>`; }).join('')}</div>
        ${full ? `<div class="picks">${pick(`Sell the set · ${cashShort(life.setWorth(k) * 2)}`, 'setSell', k)}${pick('Give it to the museum', 'setGive', k, null, 'quiet')}</div>` : ''}</div>`;
    }
    const mine = Object.keys(s.items).filter((id) => ITEMS[id]);
    if (mine.length) body += `<details><summary>Sell your own things</summary><p class="fine">Mr Pym will take anything, for a good deal less than you paid.</p><div class="things cur">${mine.map((id) => `<button data-do="act" data-id="pawn"${jx(id)}${life.can('pawn', id) ? ` data-why="${esc(life.can('pawn', id))}"` : ''}>${ITEMS[id].icon}<small>${ITEMS[id].name}</small><em>Sell ${cashShort(life.pawnPrice(id))}</em></button>`).join('')}</div></details>`;
    return { icon: '🏺', title: 'Pym’s Curios', sub: `${Object.keys(s.curSeen).length} of ${Object.keys(CURIOS).length} found`, body };
  },

  person(id) {
    const p = life.person(id);
    if (!p) return null;
    const He = p.sex === 'm' ? 'He' : 'She', first = esc(p.name.split(' ')[0]);
    const facts = [];
    if (p.kind === 'child' && p.age < 18) {
      facts.push(...STATS.map((k) => `<span>${STAT_ICON[k]} ${STAT_NAME[k]} ${Math.floor(p.st[k])}</span>`));
      if (p.priv) facts.push('<span>🏫 At St Wren’s School</span>');
    } else if (p.kind === 'grandchild' && p.age < 18) {
      facts.push(`<span>${p.age < 1 ? 'A new baby' : p.age < 5 ? 'Into everything' : p.age < 13 ? 'At school' : 'A teenager'}</span>`);
    } else if (p.kind !== 'parent') {
      if (p.job) facts.push(`<span>💼 ${life.jobOf(p)}</span>`);
      if (p.kind !== 'child') facts.push(`<span>${TRAITS[p.trait].icon} ${TRAITS[p.trait].name}</span>`);
      if (p.kind === 'friend' && life.fancy(p)) facts.push(p.single ? '<span class="up">💗 Single</span>' : '<span>Spoken for</span>');
      const loves = (p.likes || []).filter((a) => p.known[a]);
      if (loves.length) facts.push(`<span>Loves ${loves.map((a) => OUTINGS[a].icon).join(' ')}</span>`);
      if ((p.kind === 'partner' || p.kind === 'spouse') && p.bond >= 50) facts.push(`<span>${p.wish ? 'Wants children' : 'Does not want children'}</span>`);
    }
    const foe = p.kind === 'enemy';
    const perk = p.job && !['parent', 'ex', 'enemy'].includes(p.kind) && p.age >= 18 ? `<p class="fine">${life.perk(p.job) && p.bond >= 60 ? '✓ ' : ''}Someone close in ${CAREERS[p.job].name.toLowerCase()} (60 bond) gets you ${PERKS[p.job]}.</p>` : '';
    const body = `<div class="bondbar big${foe ? ' grudge' : ''}"><span style="width:${foe ? p.grudge : p.bond}%"></span></div><p class="lead">${bondWord(p)} · ${foe ? `grudge ${Math.round(p.grudge)}. It cools with time, faster if the town thinks well of you; while it lasts, ${p.sex === 'm' ? 'he' : 'she'} will do you small harms.` : `bond ${Math.round(p.bond)}`}${p.kind === 'child' && p.age >= 18 ? ` · ${He} takes after what you taught ${p.sex === 'm' ? 'him' : 'her'}` : ''}</p>
      <div class="facts">${facts.join('')}</div>${perk}${p.kind === 'child' && p.age < 18 ? `<p class="fine">What ${first} learns now, ${p.sex === 'm' ? 'he' : 'she'} keeps: a child who carries on the family starts with some of it.</p>` : ''}
      ${sections(life.personActions(p))}`;
    return { icon: face(p.look, p.age, foe ? 12 : 40 + p.bond * 0.6, p.sex), title: p.name, sub: `${p.sex === 'm' ? '♂' : '♀'} ${relation(p)}, ${p.age}`, body };
  },
};

// A man or a woman, at a glance.
const sexMark = (p) => `<i class="sx ${p.sex}">${p.sex === 'm' ? '♂' : '♀'}</i>`;

function relation(p) {
  const m = p.sex === 'm';
  if (p.kind === 'friend') return 'Friend';
  if (p.kind === 'sibling') return m ? 'Your brother' : 'Your sister';
  if (p.kind === 'grandchild') return m ? 'Your grandson' : 'Your granddaughter';
  if (p.kind === 'enemy') return 'No friend of yours';
  if (p.kind === 'ex') return p.was === 'spouse' ? (m ? 'Your ex-husband' : 'Your ex-wife') : `Your ex-${m ? 'boyfriend' : 'girlfriend'}`;
  if (p.kind === 'partner') return p.eng ? (m ? 'Your fiancé' : 'Your fiancée') : `Your ${m ? 'boyfriend' : 'girlfriend'}${p.live ? ' (you live together)' : ''}`;
  if (p.kind === 'spouse') return m ? 'Your husband' : 'Your wife';
  if (p.kind === 'child') return m ? 'Your son' : 'Your daughter';
  return m ? 'Your father' : 'Your mother';
}
const bondWord = (p) => (p.kind === 'enemy' ? (p.grudge >= 70 ? 'Hates the sight of you' : p.grudge >= 40 ? 'Bears a grudge' : 'Still sore') : p.kind === 'ex' ? (p.grudge >= 60 ? 'Still furious with you' : p.grudge >= 30 ? 'Hurt' : 'No hard feelings') : p.bond >= 80 ? 'Adores you' : p.bond >= 60 ? 'Very close' : p.bond >= 40 ? 'Close' : p.bond >= 20 ? 'Friendly' : 'Drifting away');

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

let slotShow = null, hiloShow = null, bjShow = null, raceShow = null, raceStake = 50, spinning = false;

function doAct(id, x) {
  if (!life || busy || spinning) return;
  // Fishing is done by hand, unless you would rather not watch the float.
  if ((id === 'fish' || id === 'fishBoat') && x === undefined && !save.autoFish) return castLine(id);
  // A shift done by hand is played first, and marked on how it went.
  if (id === 'workPlay' && x === undefined) return playShift();
  // The newer parts of town may want to play something first, too.
  const mod = x === undefined && MODS.find((m) => m.act && m.act[id]);
  if (mod) return mod.act[id]();
  const r = life.act(id, x);
  if (!r.ok) { sfx('nope'); toast(r.why); return; }
  haptic();
  if (id === 'slots') return spin(r);
  if (id === 'raceBet') return race(r);
  if (id.startsWith('bj')) return dealt(r);
  if (id === 'hiloGuess' || id === 'hiloStart' || id === 'hiloCash') hiloShow = r.out;
  // Some things are best seen from the place you set out from.
  if (['rentHome', 'buyHome', 'moveIn', 'apply', 'enrol', 'pet', 'bizStart'].includes(id) || (id === 'match' && life.partner())) { while (sheets.length > 1) sheets.pop(); }
  const top = sheets[sheets.length - 1];
  if (top && top.kind === 'person' && !life.person(top.id)) sheets.pop();
  landed(r);
}

// After anything has happened: save, redraw, make the right noise, and show what follows.
function landed(r, quiet = false) {
  result = { text: r.text, changes: r.changes, fresh: true };
  persist();
  render();
  if (!sheets.length && r.text && !(life.s.gaol && tab === 'town' && $('gaol').scrollTop < 90)) toast(r.text, 3200);
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
  persist();
  spinning = true;
  slotShow = null;
  renderSheet();
  sfx('flip');
  const t = setInterval(() => { sfx('tap'); for (const el of document.querySelectorAll('.reels span')) el.textContent = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '💎'][Math.floor(Math.random() * 6)]; }, 90);
  setTimeout(() => {
    clearInterval(t);
    spinning = false;
    if (!life) return;
    slotShow = r.out;
    landed(r, true);
    result = null;
    renderSheet();
    if (r.out.win > 0) { sfx(r.out.reels[0] === '💎' && r.out.reels[1] === '💎' && r.out.reels[2] === '💎' ? 'cheer' : 'coin'); if (r.out.win >= 5000) confetti(); }
  }, 700);
}

// ---- a shift done by hand ---------------------------------------------------------------

function playShift() {
  const why = life.can('workPlay', 0.5);
  if (why) { sfx('nope'); toast(why); return; }
  playMini(life.shiftGame(), (score) => { if (score != null && life && life.s.job) doAct('workPlay', score); });
}

// ---- fishing: watch the float, and strike when it dips ----------------------------------

let cast = null;
function castLine(id) {
  const why = life.can(id);
  if (why) { sfx('nope'); toast(why); return; }
  cast = { id, state: 'wait' };
  $('cast').className = 'cast wait';
  $('cast').hidden = false;
  $('castSay').textContent = 'Wait for the float to dip, then tap.';
  sfx('flip');
  cast.timer = setTimeout(() => {
    if (!cast) return;
    cast.state = 'bite'; cast.at = performance.now();
    $('cast').className = 'cast bite';
    $('castSay').textContent = 'Strike!';
    sfx('pop'); haptic();
    cast.timer = setTimeout(() => reelIn(0), 950);
  }, 1100 + Math.random() * 2600);
}
// A tap on the water: too soon, in time, or right on the dip.
// (The press decides it; the float stays up until the tap that follows has been
// swallowed, so that it cannot land on whatever is underneath.)
function strike() {
  if (!cast || cast.how !== undefined) return;
  clearTimeout(cast.timer);
  cast.how = cast.state === 'wait' ? 0 : performance.now() - cast.at < 400 ? 2 : 1;
  cast.timer = setTimeout(landCast, 350);
}
function landCast() { if (cast && cast.how !== undefined) reelIn(cast.how); }
function reelIn(how) {
  if (!cast) return;
  clearTimeout(cast.timer);
  const id = cast.id;
  cast = null;
  $('cast').hidden = true;
  if (life) doAct(id, how);
}

// A hand of blackjack: what was said goes on the table, not above it.
function dealt(r) {
  bjShow = r.out ? { ...r.out, text: r.text } : null;
  landed(r, true);
  result = null;
  renderSheet();
  if (!r.out) sfx('flip');
  else if (r.out.res === 'natural') { sfx('cheer'); confetti(); } else if (r.out.pay > r.out.bet) { sfx('coin'); if (r.out.pay >= 10000) confetti(); } else if (r.out.pay) sfx('tap'); else sfx('wrong');
}

// The gull races: the result is known at once, and then the birds fly it.
function race(r) {
  persist();
  spinning = true;
  raceShow = { out: r.out, text: r.text, running: true };
  renderSheet();
  $('sheetBody').scrollTop = 0;
  sfx('whoosh');
  const t = setInterval(() => sfx('tap'), 260);
  setTimeout(() => {
    clearInterval(t);
    spinning = false;
    if (!life || !raceShow) return;
    raceShow.running = false;
    landed(r, true);
    result = null;
    renderSheet();
    if (r.out.pay) { sfx(r.out.pay >= r.out.card[r.out.pick].pays * 500 ? 'cheer' : 'coin'); if (r.out.pay >= 5000) confetti(); } else sfx('wrong');
  }, 3600);
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
  if (life.s.sex == null) { askWho(); return; }
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
  const wasIn = !!life.s.gaol;
  const r = life.choose(i);
  if (!r.ok) { sfx('nope'); toast(r.why); return; }
  if (wasIn !== !!life.s.gaol) { sheets = []; result = null; tab = 'town'; }
  if (ev.id === 'date' && life.partner()) sheets = sheets.filter((sh) => sh.kind !== 'dating');
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
  if (life.s.time >= 3 && !save.restTip && !life.s.gaol) { save.restTip = true; toast('Time you do not use is rest: good for health and mood.', 4200); }
  const r = life.endSeason();
  bjShow = null; raceShow = null;
  persist();
  tab = 'town';
  render();
  sfx('whoosh');
  haptic();
  showNews(r.news);
  const net = r.lines.reduce((a, [, n]) => a + n, 0), short = r.lines.some(([what]) => what.startsWith('Short'));
  const b = $('season');
  b.innerHTML = `<i>${SEASON_ICON[life.season]}</i><b>${SEASONS[life.season]}</b><small>${life.s.dead ? '' : `${life.s.wx !== 'fair' ? `${life.weather().icon} ${life.weather().name} · ` : ''}Age ${life.s.age} · bills and income ${net >= 0 ? '+' : '−'}${money(Math.abs(net))}${short ? ' · you are overdrawn!' : ''}`}</small>`;
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
  busy = true;
  setTimeout(() => {
    busy = false;
    if (life.s.dead) { sfx('lose'); showEnd(); } else if (r.birthday) showBirthday(); else pump();
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
  const income = [...life.income(), ['Savings interest', Math.floor(s.bank * life.savingsRate())]], comeIn = income.reduce((a, [, n]) => a + n, 0);
  const items = Object.keys(s.items).filter((id) => ITEMS[id]);
  const perks = Object.keys(PERKS).filter((c) => life.perk(c));
  const ill = s.ill ? esc(s.ill.name[0].toUpperCase() + s.ill.name.slice(1)) : '';
  return `
  <div class="box hero"><span class="ava big">${face(s.look, s.age, s.happy, s.sex)}</span><div><h2>${esc(s.name)}</h2><p>Age ${s.age}${s.gen > 1 ? ` · generation ${s.gen}` : ''}<br>${rep}${s.fame >= 1 ? ` · 🌟 Fame ${Math.round(s.fame)}` : ''}${s.record ? ' · has a record' : ''}</p></div></div>
  ${s.gaol ? `<div class="box warn">⛓️ In Starling Gaol: ${s.gaol.left} season${s.gaol.left > 1 ? 's' : ''} to serve. The Town tab is your cell.</div>` : s.run ? '<div class="box warn">🚨 On the run from Starling Gaol. Every crime is riskier, and they may find you any season, until the law loses interest.</div>' : ''}
  ${s.ill ? `<div class="box warn">🤒 ${ill}: it costs you health every season${s.ill.sev >= 3 ? ', and it could kill you' : ''}. St Wren’s can treat it.</div>` : ''}
  <div class="box"><h3>Skills</h3>${STATS.map((k) => `<div class="skill"><i>${STAT_ICON[k]}</i><span>${STAT_NAME[k]}</span><span class="bar"><span style="width:${s.st[k]}%"></span></span><b>${Math.floor(s.st[k])}</b></div>`).join('')}
    <p class="fine">Skills grow by doing things, more slowly the higher they get, and faster when you are happy.</p></div>
  <div class="box"><h3>Work</h3>${job ? `<div class="line"><span>${job.icon} ${life.jobTitle()}, ${job.shady ? 'Sal’s crew' : PLACES[job.place].name}</span><b>${money(life.shiftPay())} a shift</b></div>
      ${job.shady ? '' : `<div class="line"><span>How you stand</span><b>${life.standing()}</b></div>`}
      ${life.playDue() ? `<p class="sub">👀 ${job.shady ? 'Sal' : 'The boss'} wants to watch your next shift: it has to be done by hand.</p>` : ''}
      ${next ? `<p class="sub">Next: <b>${next.title}</b> (${money(next.pay)} a shift)</p><div class="needs">${needChips(next.list)}</div>` : '<p class="sub">You are at the very top. 🏆</p>'}`
    : s.retired ? `<p class="sub">Retired, on a pension of ${money(s.pension)} a season.</p>` : s.biz ? '<p class="sub">No job: you work for yourself.</p>' : '<p class="sub">Between jobs. The Town Hall has a job board, and the harbour always wants crates unloading.</p>'}
    ${s.biz ? `<div class="line"><span>${BUSINESSES[s.biz.type].icon} Your ${life.bizName().toLowerCase()}, ${PLACES[BUSINESSES[s.biz.type].place].name}</span><b>${s.biz.mgr ? 'Has a manager' : 'Run by you'}</b></div>
      <div class="skill"><i>📣</i><span>Its name</span><span class="bar"><span style="width:${s.biz.rep}%"></span></span><b>${Math.round(s.biz.rep)}</b></div>
      <p class="fine">Worth ${money(life.bizWorth())}. A spell of work in it brings in about ${money(life.bizTake())}${life.bizIdle() ? `; without you it makes ${money(life.bizIdle())} a season` : ''}.</p>` : ''}</div>
  <div class="box"><h3>Study</h3>${s.course ? `<div class="line"><span>${COURSES[s.course.id].icon} ${COURSES[s.course.id].name}</span><b>${s.course.exam ? 'Exam to sit' : `${s.course.p} of ${COURSES[s.course.id].classes}`}</b></div><p class="fine">Heading for ${life.gradeWord(life.examMark())}.</p>` : ''}
    ${Object.keys(s.edu).length ? `<div class="needs">${Object.keys(s.edu).map((id) => `<i class="need ok">${COURSES[id].icon} ${COURSES[id].name}${s.edu[id].g ? `: ${GRADES[s.edu[id].g].toLowerCase()}` : ''}</i>`).join('')}</div>` : s.course ? '' : '<p class="sub">No qualifications yet. The right one lets you start a career partway up.</p>'}</div>
  <div class="box"><h3>Money</h3>
    ${row('Cash on you', s.cash) || '<div class="line"><span>Cash on you</span><b>$0</b></div>'}${row('Savings', s.bank)}${row('Shares', life.sharesWorth())}${row(`Property (${s.estate.length})`, life.estateWorth())}${row('Your business', life.bizWorth())}${row('Curios', life.curiosWorth())}${row('Loan', -s.debt, 'down')}${row('Student loan', -s.sloan, 'down')}${row('Owed to Sal', -s.shark, 'down')}
    <div class="line total"><span>Worth, all told</span><b>${money(life.netWorth())}</b></div>
    ${s.hist.length > 1 ? `${spark([...s.hist, life.netWorth()], 300, 44)}<p class="fine">What you have been worth, year by year.</p>` : ''}
    <h4>Every season</h4>${bills.map(([what, n]) => row(esc(what), -n, 'down')).join('')}${income.map(([what, n]) => row(esc(what), n, 'up')).join('')}
    <div class="line total"><span>Before any work</span><b>${money(comeIn - out)}</b></div></div>
  ${s.n.crimes || s.record || s.heat || Object.keys(s.habit).length ? `<div class="box"><h3>The low road</h3>
    <div class="line"><span>🚨 The law</span><b>${life.lawWord()}</b></div>
    <div class="line"><span>Crimes to your name</span><b>${s.n.crimes}</b></div>${s.record ? `<div class="line down"><span>Criminal record</span><b>${s.record} conviction${s.record > 1 ? 's' : ''}</b></div>` : ''}
    ${Object.keys(s.habit).map((k) => `<div class="skill"><i>${k === 'drink' ? '🥃' : '✨'}</i><span>${k === 'drink' ? 'Drink' : 'Dust'}</span><span class="bar"><span style="width:${Math.min(100, s.habit[k])}%;background:${s.habit[k] >= 60 ? 'var(--bad)' : 'var(--sun)'}"></span></span><b>${Math.round(Math.min(100, s.habit[k]))}</b></div>`).join('')}
    ${life.hooked('drink') || life.hooked('dust') ? '<p class="fine">You are hooked: it costs you health every season, and a season without it is a miserable one. Going without wears it down; the clinic at St Wren’s ends it.</p>' : ''}</div>` : ''}
  <div class="box"><h3>About town</h3>
    <div class="line"><span>${life.eco().icon} Business in the Bay</span><b>${life.eco().name}</b></div>
    ${s.chirp ? `<div class="line"><span>🐤 Chirper</span><b>${many(life.followers())} followers</b></div>` : ''}
    ${s.plot ? `<div class="line"><span>🥕 Allotment</span><b>${s.plot.beds.filter((b) => life.bedRipe(b)).length ? 'Something is ready' : `${s.plot.beds.filter(Boolean).length} of ${s.plot.beds.length} beds sown`}</b></div>` : ''}
    ${Object.keys(s.curSeen).length ? `<div class="line"><span>🏺 Curios found</span><b>${Object.keys(s.curSeen).length} of ${Object.keys(CURIOS).length}</b></div>` : ''}
    ${s.lot.n ? `<div class="line"><span>🎟️ Lotto tickets for this season’s draw</span><b>${s.lot.n}</b></div>` : ''}
    ${s.f.licence > s.t ? '<div class="line down"><span>🪪 Out on licence</span><b>Keep your nose clean</b></div>' : ''}
    <button class="btn btn-soft wide" data-do="open" data-kind="gazette">📰 Read the Gazette</button></div>
  ${perks.length ? `<div class="box"><h3>Friends in the right places</h3>${perks.map((c) => `<div class="line"><span>${CAREERS[c].icon} ${CAREERS[c].name}</span><b class="perk">${PERKS[c]}</b></div>`).join('')}</div>` : ''}
  ${MODS.map((m) => (m.me ? m.me(life) || '' : '')).join('')}
  <div class="box"><h3>Dreams</h3>${s.dreams.map((id) => `<div class="dream${s.dreamDone[id] ? ' done' : ''}"><i>${DREAMS[id].icon}</i><div><b>${DREAMS[id].name}</b><small>${s.dreamDone[id] ? `Came true at ${s.dreamDone[id]}` : DREAMS[id].desc}</small></div><em>${s.dreamDone[id] ? '✓' : ''}</em></div>`).join('')}</div>
  <div class="box"><h3>Belongings</h3>${items.length ? `<div class="things">${items.map((id) => `<span title="${ITEMS[id].name}">${ITEMS[id].icon}<small>${ITEMS[id].name}</small></span>`).join('')}</div>` : '<p class="sub">One suitcase. The High Street can fix that.</p>'}
    ${s.paintings ? `<p class="sub">🖼️ ${s.paintings} painting${s.paintings > 1 ? 's' : ''} to sell at the studios.</p>` : ''}${s.novel.p ? `<p class="sub">✍️ Novel: ${s.novel.p} of 10 sittings done.</p>` : ''}${Object.keys(s.fishbook).length ? `<p class="sub">📒 Fish book: ${Object.keys(s.fishbook).length} of ${Object.keys(FISH).length} kinds caught.</p>` : ''}
    ${Object.keys(INSURANCE).filter((id) => s.ins[id]).map((id) => `<p class="sub">☂️ ${INSURANCE[id].name}.</p>`).join('')}</div>
  <div class="box"><button class="btn btn-soft wide" data-do="trophies">🏆 Trophies and ribbons</button></div>`;
}

function peopleHtml() {
  const s = life.s;
  const card = (p) => `<button class="box person" data-do="person" data-id="${p.id}"><span class="ava">${face(p.look, p.age, p.kind === 'enemy' ? 12 : 40 + p.bond * 0.6, p.sex)}</span>
      <div><b>${esc(p.name)} ${sexMark(p)}</b><small>${relation(p)}, ${p.age}${p.kind === 'friend' && life.fancy(p) && p.single && !life.partner() ? ' · 💗 single' : ''}${p.job && p.kind !== 'parent' && p.age >= 18 ? ` · ${life.jobOf(p)}` : ''}</small><span class="bondbar${p.kind === 'enemy' ? ' grudge' : ''}"><span style="width:${p.kind === 'enemy' ? p.grudge : p.bond}%"></span></span></div><i class="go">›</i></button>`;
  const group = (title, kinds) => { const l = s.people.filter((p) => kinds.includes(p.kind)).sort((a, b) => b.bond - a.bond); return l.length ? `<h3 class="group">${title}</h3>${l.map(card).join('')}` : ''; };
  let out = '';
  if (s.due) out += `<div class="box warn good">🍼 ${s.due.adopt ? 'A child is coming to live with you soon.' : 'A baby is on the way!'}</div>`;
  const love = group('Your sweetheart', ['partner', 'spouse']);
  out += love || `<div class="box"><p class="sub">💘 Nobody special just now. Chat someone up at the Gull & Anchor${s.items.phone ? ', try Seaside Singles at home' : ', buy a phone for the dating app'}, or ask out a friend who is single.</p></div>`;
  out += group('Family', ['child', 'grandchild', 'parent', 'sibling']);
  if (s.pet) out += `<div class="box person pet"><span class="act-ico">${PETS[s.pet.kind].icon}</span><div><b>${esc(s.pet.name)}</b><small>Your ${PETS[s.pet.kind].name}, ${s.pet.age}. Always pleased to see you.</small></div></div>`;
  out += group(`Friends (${life.friends().length})`, ['friend']) || '<div class="box"><p class="sub">No friends in Starling Bay yet. Chat to the regulars at the Gull & Anchor, sit by the pond in the park, or go to hack night at the Labs.</p></div>';
  out += group('Old flames', ['ex']) + group('Bad blood', ['enemy']);
  out += MODS.map((m) => (m.people ? m.people(life) || '' : '')).join('');
  return `${out}<p class="fine pad">People drift away unless you keep in touch. Tap someone to do something together; everyone has things they love doing.</p>`;
}

function journalHtml() {
  const s = life.s;
  let out = '', age = null;
  for (let i = s.log.length - 1; i >= 0; i--) {
    const e = s.log[i];
    if (e.a !== age) { if (age !== null) out += '</div>'; age = e.a; out += `<div class="box"><h3>Age ${age}</h3>`; }
    out += `<p class="entry ${e.k}"><i>${SEASON_ICON[e.q]}</i>${esc(e.t)}</p>`;
  }
  return `<div class="box"><button class="btn btn-soft wide" data-do="open" data-kind="gazette">📰 This season’s Gazette</button></div>${out}</div>`;
}

// ---- cards ------------------------------------------------------------------------------

const ui = cards({
  opt: chooseOpt,
  evDone() { ui.close(); pump(); },
  who(el) { life.setSex(el.dataset.sex, el.dataset.into); persist(); ui.close(); sfx('chime'); render(); pump(); },
  how: showHow,
  fishing() { save.autoFish = !save.autoFish; persist(); sfx('tap'); showMenu(); },
  trophies: showTrophies,
  family: showFamily,
  menu: showMenu,
  fresh() {
    ui.show(`<h2>Start a new life?</h2><p>${esc(life.s.name)}'s story will end here, unfinished. Trophies and ribbons you have earned are kept.</p>
      <div class="actions"><button class="btn btn-primary" data-action="freshYes">Yes, start again</button><button class="btn btn-soft" data-action="menu">No, go back</button></div>`);
  },
  freshYes() { ui.close(); quitMini(true); life = null; sheets = []; raceShow = null; bjShow = null; if (cast) { clearTimeout(cast.timer); cast = null; $('cast').hidden = true; } save.next = null; save.counted = false; save.fresh = false; persist(); showStart(); },
  begin() {
    ui.close(); sfx('win');
    // The very first time, say how it all works.
    if (!save.seenHow) { save.seenHow = true; persist(); showHow(); } else pump();
  },
});

function showMenu() {
  ui.show(`<h2>New in Town</h2>
    ${switchRow('Sound', 'sound')}${switchRow('Haptics', 'haptics')}
    <div class="actions">
      <button class="btn btn-soft" data-action="how">How to play</button>
      <button class="btn btn-soft" data-action="trophies">Trophies and ribbons</button>
      <button class="btn btn-soft" data-action="family">Family history</button>
      <button class="btn btn-soft" data-action="fishing">Fishing: ${save.autoFish ? 'without watching the float' : 'by hand'}</button>
      ${life ? '<button class="btn btn-soft" data-action="fresh">Start a new life</button>' : ''}
      <button class="btn btn-primary" data-action="close">Back to it</button>
    </div>`);
}

// Shown once to a life that was begun before the town grew.
const NEWS = 5;
function showNew() {
  const was = save.seenNew || 0;
  save.seenNew = NEWS;
  persist();
  const hill = `<p><b>⛰️ Up the hill.</b> Tap “Up the hill” at the top of the map for the old town: St Brigid’s, the library, the Pavilion, the Rovers’ ground, Market Square, Windle Farm, Gorse Head, Smugglers’ Cove and Dobbs & Daughter’s garage.</p>
    <p><b>👥 The people of the town.</b> Thirteen townsfolk to get to know: chat, bring presents, hear their stories and do them favours. They are on the People tab.</p>
    <p><b>⚽ Clubs.</b> The choir, the Pavilion Players, the Rovers’ Sunday side, the book club, the sailing club and the pub quiz team: turn up, rise through the ranks, and play your part on the big day. And a reading list at the library.</p>
    <p><b>🌊 The coast.</b> Birds and caves on Gorse Head, beachcombing and the lifeboat at the cove, and the long mystery of the <i>Merrow</i>.</p>
    <p><b>🚗 Driving.</b> Lessons, a theory test and a driving test, then a car from the forecourt, a classic to restore and day trips out. (A car you already had is still yours, with a licence.)</p>
    <p><b>🐓 Farm and market.</b> Seasonal work at Windle Farm, hens and bees at home, and a Saturday stall in Market Square.</p>
    <p><b>🕯️ Who you become.</b> Traits grow out of how you live, there are big days at St Brigid’s, and a low spell needs looking after.</p>`;
  if (was >= 4) {
    ui.show(`<div class="ev-ico">⛰️</div><h2>New in Starling Bay</h2><div class="how">${hill}</div>
      <div class="actions"><button class="btn btn-primary" data-action="evDone">Show me</button></div>`);
    return;
  }
  const hands = '<p><b>🎮 Work can be done by hand.</b> Every career has a game of its own: at your workplace, tap the row that ends “yourself”. Play it well and the shift pays up to half as much again and counts for more. You can leave most shifts to look after themselves, but now and then the boss wants to watch.</p>';
  if (was >= 3) {
    ui.show(`<div class="ev-ico">⛰️</div><h2>New in Starling Bay</h2><div class="how">${hill}${hands}</div>
      <div class="actions"><button class="btn btn-primary" data-action="evDone">Show me</button></div>`);
    return;
  }
  ui.show(`<div class="ev-ico">📰</div><h2>New in Starling Bay</h2><div class="how">${hill}${hands}
    <p><b>⛓️ Prison is lived, not skipped.</b> Get sent down and you serve it a season at a time: behave for parole, fight for your place, study, or dig.</p>
    <p><b>😠 Exes and enemies.</b> A bad break-up leaves an ex you can win back. Cross somebody and they may take against you, until you make peace or see them off.</p>
    <p><b>🐤 Chirper.</b> On your phone, at home: post, gather followers, get paid.</p>
    <p><b>🥕 An allotment</b> at the park, where the season decides what grows. <b>🏺 Mr Pym’s curios</b> on the High Street, to collect and trade. <b>💈 A new look</b> next door.</p>
    <p><b>♠️ Blackjack and the gull races</b> on the pier, and the <b>🎟️ Bay Lotto</b> on the High Street.</p>
    <p><b>🏗️ The mayor’s appeal</b> at the Town Hall: give the town a lifeboat, a hospital wing, a new pier. Your name stays on it for the family that follows.</p>
    <p><b>🌧️ Weather.</b> Rain waters the allotment, gales keep the boats in and leave things on the beach, snow stops a bicycle, fog suits a thief.</p>
    <p><b>🎪 A festival every season</b>, marked on the map: the Spring Fair, Regatta Day, the Harvest Show and the Winter Lights. One entry each.</p>
    <p><b>🎣 Fishing is done by hand:</b> watch the float and tap when it dips. (The menu can turn that off.)</p>
    <p><b>💘 A first date is yours to play.</b> Read the person (a profile, or how they look across the bar) and choose how to go about it.</p>
    <p><b>📰 The Gazette</b> (at home, or from the Me tab) has the news: the Bay now has booms and slumps, and they reach your pay, your shares and your house.</p></div>
    <div class="actions"><button class="btn btn-primary" data-action="evDone">Show me</button></div>`);
}

function showHow() {
  ui.show(`<h2>How to play</h2><div class="how">
    <p><b>One life, a season at a time.</b> Each season you get a few blocks of time ⏱. Tap a place on the map and spend them: work, study, train, see people. Tap <b>Next</b> when you are done; time left over is rest.</p>
    <p><b>Four skills</b> open doors: 🧠 Smarts, 💪 Fitness, 💬 Charm and 🎨 Craft. Every career is a ladder that asks for skills and shifts worked. A course from the college lets you start partway up: a medical degree makes you a junior doctor.</p>
    <p><b>Work by hand.</b> Every career has a game of its own: the row at your workplace that ends “yourself”. Played well, a shift pays up to half as much again and counts for more towards promotion; played badly, less. Most shifts can be left to look after themselves, but every so often the boss wants to watch. The better you are at the job’s skill, the kinder its game is.</p>
    <p><b>Look after yourself.</b> ❤️ Health falls with age and overwork; if it runs out, so do you. 🙂 Mood follows how life is going: a better home, friends, love, a pet. Who you are grows out of what you do: the Me tab shows the traits taking shape, and a long low spell needs looking after.</p>
    <p><b>Bills fall due every season.</b> Save at the bank, buy shares (the index fund is the steady one) or property to let out, start a business, or borrow. A bicycle gives you more time, and so does a car, once you have passed your test at the garage up the hill.</p>
    <p><b>Up the hill</b> (the button at the top of the map) is the old town: the church, the library, the Pavilion, the football ground, the market, a farm, the cliffs, a cove and a garage. Join a club, keep hens, learn to drive, solve the mystery of the <i>Merrow</i>.</p>
    <p><b>The townsfolk</b> have stories of their own. Call on them, bring presents they like, and do them favours: a good friend in town is worth more than money.</p>
    <p><b>People.</b> Friends are made all over town, and everyone has things they love doing. For romance, chat someone up at the pub, try the dating app, or ask out a friend who is single. Close friends in the right jobs do you favours.</p>
    <p><b>Life happens.</b> Cards turn up with choices. A percentage shows your chance where a skill decides it.</p>
    <p><b>Or go bad.</b> Pick pockets at the station, lift from the shops, drink and brawl at the pub, bend the rules at work. Sal’s back room at the harbour has worse: burglary, bare-knuckle fights, his crew, the bank. The law takes an interest.</p>
    <p><b>Get caught</b> and you may go to Starling Gaol, and live every season of it: keep a clean record for parole, or earn your standing on the landing, or dig.</p>
    <p><b>The town has more in it.</b> An allotment at the park, where the seasons decide what grows. Mr Pym’s curios on the High Street, to collect and trade. Chirper on your phone. Blackjack and the gull races on the pier. Good years and slumps: the Gazette has the news.</p>
    <p><b>Money is for something.</b> The mayor’s appeal at the Town Hall lists what the town needs. What you give carries your name, and is still there, and still useful, for an heir.</p>
    <p><b>At the end</b> your life earns a ribbon, and each ribbon unlocks an heirloom that a later life can carry. Your heir inherits a share of what you leave.</p></div>
    <div class="actions"><button class="btn btn-primary" data-action="close">Got it</button></div>`);
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
  const nx = save.next;
  const rand = (n) => Math.floor(Math.random() * n);
  const ids = Object.keys(DREAMS);
  const offered = [];
  // (An heir is not offered a dream the family has already made impossible.)
  const open = (id) => !DREAMS[id].open || DREAMS[id].open({ gifts: (nx && nx.gifts) || {} });
  while (offered.length < 6) { const id = ids[rand(ids.length)]; if (!offered.includes(id) && open(id)) offered.push(id); }
  const sex = nx && nx.sex ? nx.sex : 'm';
  draft = {
    name: nx && nx.name ? nx.name : '', sex, into: sex === 'm' ? 'f' : 'm',
    look: nx && nx.look ? { ...nx.look, beard: false } : { skin: rand(LOOKS.skin.length), hair: rand(LOOKS.hair.length), top: rand(LOOKS.top.length), style: LOOKS[sex][rand(LOOKS[sex].length)], beard: false },
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
  const seg = (what, v, label, on) => `<button class="seg-btn${on ? ' on' : ''}" data-do="${what}" data-v="${v}">${label}</button>`;
  const ready = d.name.trim() && d.dreams.length === 3;
  const raised = nx && nx.st ? STATS.filter((k) => nx.st[k] >= 35).map((k) => STAT_NAME[k]) : [];
  $('start').innerHTML = `<div class="start-in">
    <div class="start-top"><a class="ico-btn" href="../../index.html" aria-label="Back to the arcade">${ICON.back}</a><button class="ico-btn" data-do="menu" aria-label="Menu">${ICON.gear}</button></div>
    <h1 class="logo"><span>New</span><span>in Town</span></h1>
    <p class="tag">${nx ? `Generation ${nx.gen}. ${esc(nx.from)} left you ${money(nx.inherit)}${raised.length ? `, and brought you up with a head start in ${raised.join(' and ')}` : ''}.` : 'One suitcase. One town. One whole life.'}</p>

    <div class="box"><h3>Who are you?</h3>
      <div class="namer"><span class="ava big">${face(d.look, 18, 70, d.sex)}</span>
        <div><input id="nameIn" type="text" maxlength="16" placeholder="Your name" value="${esc(d.name)}" autocomplete="off" autocapitalize="words" spellcheck="false">
        <div class="picks"><button class="pick quiet" data-do="rname">🎲 Name</button><button class="pick quiet" data-do="rlook">🎲 Look</button><button class="pick quiet" data-do="style">💇 Hair</button>${d.sex === 'm' ? `<button class="pick quiet" data-do="beard">🧔 ${d.look.beard ? 'Shave' : 'Beard'}</button>` : ''}</div></div></div>
      <div class="row"><span>I am a</span><div class="seg">${seg('sex', 'm', 'Man', d.sex === 'm')}${seg('sex', 'f', 'Woman', d.sex === 'f')}</div></div>
      <div class="row"><span>I fall for</span><div class="seg">${seg('into', 'f', 'Women', d.into === 'f')}${seg('into', 'm', 'Men', d.into === 'm')}${seg('into', 'b', 'Both', d.into === 'b')}</div></div>
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
    name: d.name.trim().slice(0, 16), sex: d.sex, into: d.into, look: d.look, bg: d.bg, dreams: d.dreams, heir: d.heir,
    inherit: nx ? nx.inherit : 0, gen: nx ? nx.gen : 1, parent: nx ? nx.parent : null, raised: nx ? nx.st : null, gifts: nx ? nx.gifts : null, sibs: nx && nx.sibs ? nx.sibs : nx ? [] : null,
    seed: (Math.random() * 2 ** 32) >>> 0,
  });
  save.next = null;
  save.counted = false;
  save.yearWorth = life.netWorth();
  save.seenNew = NEWS;
  tab = 'town'; here = 'station'; area = 'bay'; mapKey = ''; slotShow = null; hiloShow = null; bjShow = null; raceShow = null;
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

// A life saved before people were men and women is asked, once, who it is.
function askWho() {
  const opt = (sex, into, label) => `<button class="btn btn-soft" data-action="who" data-sex="${sex}" data-into="${into}">${label}</button>`;
  ui.show(`<div class="ev-ico">🪞</div><h2>Starling Bay has grown</h2>
    <p class="ev-text">There is more to do in town now, and the people in it are men and women. So, ${esc(life.s.name)}: who are you?</p>
    <div class="actions">${opt('m', 'f', 'A man who falls for women')}${opt('f', 'm', 'A woman who falls for men')}${opt('m', 'm', 'A man who falls for men')}${opt('f', 'f', 'A woman who falls for women')}${opt('m', 'b', 'A man who falls for either')}${opt('f', 'b', 'A woman who falls for either')}</div>`);
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
    save.next = { sibs: o.sibs, gifts: o.gifts, gen: s.gen + 1, inherit: o.inherit, from: s.name, name: o.heir ? o.heir.name : '', look: o.heir ? o.heir.look : null, sex: o.heir ? o.heir.sex : null, st: o.heir ? o.heir.st : null, parent: o.parent };
    persist();
  } else fresh = !!save.fresh;
  closeSheets();
  ui.close();
  newsQueue.length = 0;
  $('news').innerHTML = '';
  const big = s.log.filter((e) => e.k === 'big' || e.k === 'love').slice(1, -1).slice(-9);
  $('app').hidden = true;
  $('end').hidden = false;
  $('end').innerHTML = `<div class="start-in end-in">
    <p class="rip">In loving memory</p>
    <span class="ava huge">${face(s.look, s.age, 70, s.sex)}</span>
    <h1 class="end-name">${esc(s.name)}</h1>
    <p class="tag">Came to Starling Bay at 18. Died at ${o.age}, of ${esc(o.cause)}.</p>
    <div class="ribbon"><i>${o.ribbon.icon}</i><b>${o.ribbon.name}</b><small>${o.ribbon.desc}</small></div>
    ${fresh ? `<div class="box warn good">New heirloom for the lives to come: ${o.ribbon.heir.icon} <b>${o.ribbon.heir.name}</b>. ${o.ribbon.heir.desc}</div>` : ''}
    <div class="stats"><div><b>${o.score.toLocaleString()}</b><span>Score</span></div><div><b>${cashShort(o.worth)}</b><span>Left behind</span></div><div><b>${o.trophies}</b><span>Trophies</span></div></div>
    <div class="box"><h3>Dreams</h3>${o.dreams.map((d) => `<div class="dream${d.done ? ' done' : ''}"><i>${DREAMS[d.id].icon}</i><div><b>${DREAMS[d.id].name}</b><small>${d.done ? 'Came true' : 'Not this time'}</small></div><em>${d.done ? '✓' : ''}</em></div>`).join('')}</div>
    <div class="paper obit"><p class="mast">The Starling Bay Gazette</p><p class="dateline">${SEASONS[life.season]}, year ${life.year} · Obituaries</p><h2>${esc(s.name)}, ${o.age}</h2>${life.epitaph().slice(1).map((t) => `<p class="story">${esc(t)}</p>`).join('')}</div>
    ${big.length ? `<div class="box"><h3>A life</h3>${big.map((e) => `<p class="entry"><i>${e.a}</i>${esc(e.t)}</p>`).join('')}</div>` : ''}
    <div class="box"><h3>Skills at the end</h3>${STATS.map((k) => `<div class="skill"><i>${STAT_ICON[k]}</i><span>${STAT_NAME[k]}</span><span class="bar"><span style="width:${s.st[k]}%"></span></span><b>${Math.floor(s.st[k])}</b></div>`).join('')}</div>
    <button class="btn btn-primary go-btn" data-do="heirLife">${o.heir ? `Carry on as ${esc(o.heir.name)}, your ${o.heir.sex === 'm' ? 'son' : 'daughter'}` : 'Carry on as a distant cousin'}<small>Inherits ${money(o.inherit)}${o.heir ? ', and what you taught' : ''}</small></button>
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
  area(el) {
    if (busy || !life || life.s.dead || life.s.gaol) return;
    area = el.dataset.area || (area === 'bay' ? 'hill' : 'bay');
    sfx('flip');
    renderMap();
  },
  goals() { sfx('tap'); if (life.s.gaol) { tab = 'town'; closeSheets(); render(); } else if (life.s.ill) goTo('hospital'); else showGoals(); },
  stake(el) { raceStake = Number(el.dataset.v); sfx('tap'); renderSheet(); },
  autofish() { const id = cast && cast.id; if (cast) clearTimeout(cast.timer); cast = null; $('cast').hidden = true; save.autoFish = true; persist(); toast('Fishing will look after itself from now on. The menu changes it back.', 3600); if (id) doAct(id, 1); },
  again() { raceShow = null; sfx('tap'); renderSheet(); },
  miniQuit() { sfx('tap'); quitMini(); },
  trophies() { sfx('tap'); showTrophies(); },
  menu() { sfx('tap'); showMenu(); },
  // starting out
  look(el) { draft.look[el.dataset.key] = Number(el.dataset.i); sfx('tap'); renderStart(); },
  style() { draft.look.style = (draft.look.style + 1) % LOOKS.styles; sfx('tap'); renderStart(); },
  rlook() { const r = (n) => Math.floor(Math.random() * n), st = LOOKS[draft.sex]; draft.look = { skin: r(LOOKS.skin.length), hair: r(LOOKS.hair.length), top: r(LOOKS.top.length), style: st[r(st.length)], beard: draft.sex === 'm' && Math.random() < 0.3 }; sfx('flip'); renderStart(); },
  rname() { const list = draft.sex === 'm' ? NAMES_M : NAMES_F; draft.name = list[Math.floor(Math.random() * list.length)]; sfx('flip'); renderStart(); },
  beard() { draft.look.beard = !draft.look.beard; sfx('tap'); renderStart(); },
  sex(el) {
    const v = el.dataset.v, d = draft;
    if (v === d.sex) return;
    // Who you fall for follows along unless you had already changed it.
    if (d.into === (d.sex === 'm' ? 'f' : 'm')) d.into = v === 'm' ? 'f' : 'm';
    d.sex = v; d.look.style = LOOKS[v][0]; d.look.beard = false;
    sfx('tap'); renderStart();
  },
  into(el) { draft.into = el.dataset.v; sfx('tap'); renderStart(); },
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

// ---- the newer parts of town --------------------------------------------------------------

// Each screen in ui-mods.js is handed this kit, and gives back what it adds:
//   sheets: { kind(id) => { icon, title, sub, body } }, opened by data-do="open" data-kind="kind"
//   do: { name(el) }, run by data-do="name"
//   act: { actionId() }, run instead when that action is tapped (to play something first, say);
//        it should finish with kit.doAct(actionId, what came of it)
//   me(life), people(life): boxes of HTML for the Me and People tabs
//   marks(life): [[place, emoji], ...] for badges on the map
//   css: a stylesheet of its own
const kit = {
  $, esc, pct, money, cashShort, many, an, chip, pick, needChips, actRow, sections, face,
  openSheet, closeSheets, backSheet, renderSheet, render, persist, doAct, landed, toast, sfx, haptic, playMini,
  get life() { return life; }, get here() { return here; }, get cards() { return ui; },
};
MODS = SCREENS.map((make) => make(kit));
for (const m of MODS) {
  for (const k of Object.keys(m.sheets || {})) if (SHEET[k]) throw new Error(`two sheets called ${k}`);
  for (const k of Object.keys(m.do || {})) if (DO[k]) throw new Error(`two handlers called ${k}`);
  Object.assign(SHEET, m.sheets || {});
  Object.assign(DO, m.do || {});
  if (m.css) document.head.append(Object.assign(document.createElement('style'), { textContent: m.css }));
}

$('cast').addEventListener('pointerdown', (e) => { if (!e.target.closest('[data-do]')) { e.preventDefault(); strike(); } });

document.addEventListener('click', (e) => {
  if (e.target.closest('#cast') && !e.target.closest('[data-do]')) { landCast(); return; }
  const place = e.target.closest('.place');
  if (place) { goTo(place.dataset.place); return; }
  const el = e.target.closest('[data-do]');
  if (el) { DO[el.dataset.do]?.(el); return; }
  if (e.target === $('sheetBack')) closeSheets();
});

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape' && !ui.isOpen() && sheets.length) closeSheets();
  if ((e.key === 'n' || e.key === 'N') && life && !$('app').hidden && !ui.isOpen() && !sheets.length) nextSeason();
});

// ---- off we go --------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();

if (life) {
  $('app').hidden = false;
  render();
  if ((save.seenNew || 0) < NEWS && !life.s.dead) showNew(); else pump();
} else showStart();

// For testing from the browser's console.
window.__town = { get life() { return life; }, save, render, pump };
