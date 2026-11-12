// New in Town: the screen for who you become, St Brigid's, and the mind
// (the rules are in soul.js). A Character box on the Me tab, the parish
// noticeboard and the churchyard as sheets, the people you have lost on
// the People tab, and a game for bell practice.

import { GAMES } from './mini.js';
import { SEASONS } from './data.js';
import { CHARACTER, GAIN, ROOF } from './soul.js';
import { settings, sfx, haptic } from '../../../shared/arcade.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const cap = (t) => t[0].toUpperCase() + t.slice(1);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const press = (node, fn) => node.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });

// ---- the bells --------------------------------------------------------------------------

// Six bells, treble to tenor: the top six notes of a major scale.
const HZ = [523.25, 493.88, 440, 392, 349.23, 329.63];
let actx = null;
function ding(i) {
  if (!settings.sound) return;
  try {
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; actx = new AC(); }
    if (actx.state === 'suspended') actx.resume().catch(() => {});
    const t = actx.currentTime, out = actx.createGain();
    out.gain.value = 0.13;
    out.connect(actx.destination);
    // (A bell's partials are not quite in tune with each other, which is what makes it a bell.)
    for (const [r, g, d] of [[0.5, 0.55, 2.4], [1, 1, 1.7], [1.19, 0.45, 1.1], [1.5, 0.3, 0.9], [2, 0.32, 0.8], [2.52, 0.16, 0.5]]) {
      const o = actx.createOscillator(), v = actx.createGain();
      o.frequency.value = HZ[i] * r;
      v.gain.setValueAtTime(0.0001, t);
      v.gain.exponentialRampToValueAtTime(g, t + 0.005);
      v.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(v); v.connect(out);
      o.start(t); o.stop(t + d + 0.05);
    }
  } catch (e) { /* no sound, then */ }
}

// Rounds, then the bells hunt: pairs swap places, row after row.
function rows(n) {
  let r = [0, 1, 2, 3, 4, 5];
  const out = [r];
  for (let k = 1; k < n; k++) {
    r = r.slice();
    for (let i = (k % 2 ? 0 : 1); i + 1 < 6; i += 2) [r[i], r[i + 1]] = [r[i + 1], r[i]];
    out.push(r);
  }
  return out;
}

GAMES.bells = {
  how: 'Six bells, rung in turn, one to each beat. The lit number is the bell whose turn it is: tap that bell before the beat moves on. Each row changes the order a little.',
  time: 60, fixed: true,
  play(api) {
    const beat = clamp(0.95 - api.level * 0.06 + api.ease * 0.18, 0.6, 1.1), plan = rows(7), total = plan.length * 6;
    let row = 0, pos = 0, t = -1.8, struck = false, good = 0, clash = 0, robot = false, over = false;
    const wrap = el('div', 'mg-belltop');
    const strip = el('div', 'mg-bellrow'), next = el('div', 'mg-bellrow mg-bellnext'), call = el('p', 'mg-bellcall', 'Look to…'), tick = el('div', 'mg-bellbeat', '<span></span>');
    wrap.append(call, strip, next, tick);
    const grid = el('div', 'mg-bells'), tally = el('p', 'mg-tally');
    for (let b = 0; b < 6; b++) grid.append(el('button', `b${b}`, `<i>🔔</i><b>${b + 1}</b>`));
    grid.querySelectorAll('button').forEach((btn, b) => { btn.dataset.b = b; });
    api.stage.append(wrap, grid, tally);
    const marks = [];
    const draw = () => {
      strip.innerHTML = plan[row].map((b, i) => `<span class="${marks[i] || ''}${i === pos && t >= 0 ? ' now' : ''}">${b + 1}</span>`).join('');
      next.innerHTML = plan[row + 1] ? plan[row + 1].map((b) => `<span>${b + 1}</span>`).join('') : '';
      tally.textContent = `${good} rung true · ${clash} clash${clash === 1 ? '' : 'es'} · row ${row + 1} of ${plan.length}`;
    };
    const score = () => clamp((good - clash * 0.25) / total, 0, 1);
    const swing = (b) => { const btn = grid.children[b]; btn.classList.remove('swing'); void btn.offsetWidth; btn.classList.add('swing'); };
    const strike = (b) => {
      if (over || t < 0 || struck) return;
      swing(b);
      struck = true;
      if (b === plan[row][pos]) { good++; marks[pos] = 'ok'; ding(b); } else { clash++; marks[pos] = 'bad'; sfx('nope'); haptic(); }
      draw();
    };
    press(grid, (e) => { const btn = e.target.closest('[data-b]'); if (btn) strike(Number(btn.dataset.b)); });
    api.frame((dt) => {
      if (over) return;
      const step = robot ? beat / 4 : beat;
      t += dt;
      if (t < 0) { call.textContent = t < -0.9 ? 'Look to…' : 'Treble’s going…'; return; }
      if (call.textContent !== '') { call.textContent = ''; draw(); }
      if (robot && !struck) strike(plan[row][pos]);
      tick.firstChild.style.width = `${Math.min(1, t / step) * 100}%`;
      if (t < step) return;
      t -= step;
      if (!struck) { marks[pos] = 'bad'; }
      struck = false;
      pos++;
      if (pos >= 6) {
        pos = 0; row++; marks.length = 0;
        if (row >= plan.length) { over = true; api.finish(score()); return; }
      }
      draw();
    });
    draw();
    return { score, auto: () => { robot = true; if (t < 0) t = 0; } };
  },
};

// ---- the screen -------------------------------------------------------------------------

export default function (kit) {
  const { esc, money, pick, chip, sections } = kit;
  const when = (t) => `${SEASONS[t % 4]}, year ${Math.floor(t / 4) + 1}`;
  const dots = (v) => { const n = clamp(Math.floor(v / GAIN * 5), 0, 5); return `<span class="soul-dots" aria-label="${n} of 5">${'●'.repeat(n)}${'○'.repeat(5 - n)}</span>`; };

  // What helps, as ticks for this season.
  const HELPS = {
    low: [['talk', 'Someone close'], ['vicar', 'Tea with the Reverend'], ['move', 'A walk, a swim, the gym'], ['care', 'A counsellor at St Wren’s'], ['quiet', 'A quiet hour']],
    burn: [['rest', 'Rest'], ['away', 'A holiday'], ['care', 'A counsellor at St Wren’s'], ['talk', 'Someone close'], ['move', 'Gentle exercise']],
  };

  function character(life) {
    const held = life.soulTraits(), shaping = life.soulShaping(held.length >= 3 ? 1 : 2);
    let h = '<div class="box soul-char"><h3>Character</h3>';
    if (held.length) {
      h += held.map((id) => {
        const t = CHARACTER[id], v = life.soulLean(id);
        return `<div class="soul-tr"><i>${t.icon}</i><div><b>${t.name}${v < 40 ? ' <em>fading</em>' : ''}</b><small>${esc(t.blurb)}</small><span class="soul-does">${esc(t.does)}</span></div></div>`;
      }).join('');
    } else h += '<p class="sub">Nobody in the Bay has a word for you yet. Who you become grows out of what you do, season after season.</p>';
    if (shaping.length) {
      h += '<h4>Taking shape</h4>' + shaping.map((id) => {
        const t = CHARACTER[id], v = life.soulLean(id), near = v >= 45;
        return `<div class="soul-tr shape"><i>${near ? t.icon : '❔'}</i><div><b>${near ? `${t.name}, nearly` : 'Something is taking shape'}</b><small>${esc(t.hint)}</small></div>${dots(v)}</div>`;
      }).join('');
    }
    h += `<p class="fine">${held.length >= 3 ? 'Three traits is as many as anyone can carry. A new one only pushes out the weakest if you have been living it harder.' : 'At most three traits at once.'} Keep living up to one and it stays; stop, and in time it fades.</p></div>`;
    return h;
  }

  function mind(life) {
    const S = life.s.soul, sp = life.soulSpell();
    let h = '';
    if (sp) {
      const low = sp.k === 'low', full = low ? 8 : 6, done = S.ss.help;
      const lift = clamp(Math.round((1 - sp.depth / full) * 100), 4, 100);
      h += `<div class="box soul-mind"><h3>${low ? '🌧️ A low spell' : '🪫 Burnt out'}</h3>
        <p class="sub">${low ? 'It takes your time and your spirits. It is not your fault, and it does lift.' : 'Working flat out has caught up with you. It takes your time and your spirits, and every spell of work takes more out of you.'}</p>
        <div class="skill"><i>🌤️</i><span>Lifting</span><span class="bar"><span style="width:${lift}%"></span></span></div>
        <p class="fine">What helps, once a season each:</p>
        <div class="needs">${HELPS[sp.k].map(([k, t]) => `<i class="need ${done[k] ? 'ok' : ''}">${done[k] ? '✓' : '○'} ${esc(t)}</i>`).join('')}</div>
        ${low ? '' : `<p class="fine">And leave time spare: ${S.ss.wb} block${S.ss.wb === 1 ? '' : 's'} of work so far this season. Less work, faster mending.</p>`}</div>`;
    }
    const g = S.graves[S.graves.length - 1];
    if (S.grief >= 2 && g) h += `<div class="box soul-mind"><p class="sub">🕊️ Missing ${esc(g.name.split(' ')[0])}. Grief comes in waves. A visit to the churchyard at St Brigid’s helps, and so does time.</p></div>`;
    return h;
  }

  function sayDay(d) {
    return { wed: `💒 You married ${esc(d.name)}`, christening: `🕊️ ${esc(d.name)} was welcomed at the font`, funeral: `🕯️ You spoke at ${esc(d.name.split(' ')[0])}’s funeral` }[d.k] || '';
  }

  return {
    me(life) { return life.s.soul ? character(life) + mind(life) : ''; },

    people(life) {
      const g = life.s.soul ? life.s.soul.graves : [];
      if (!g.length) return '';
      const names = g.slice(-4).reverse().map((q) => q.name.split(' ')[0]);
      return `<h3 class="group">Remembered</h3><button class="box person" data-do="open" data-kind="soulYard"><span class="act-ico">🪦</span><div><b>${esc(names.join(', '))}${g.length > 4 ? '…' : ''}</b><small>In St Brigid’s churchyard</small></div><i class="go">›</i></button>`;
    },

    marks(life) {
      if (!life.s.soul || life.s.gaol) return [];
      if (life.season === 2 && !life.can('soulSupper')) return [['church', '🌾']];
      if (life.season === 3 && !life.can('soulCarols')) return [['church', '🕯️']];
      return [];
    },

    act: {
      soulBells() {
        const life = kit.life, why = life.can('soulBells', 0.5);
        if (why) { kit.sfx('nope'); kit.toast(why); return; }
        kit.playMini({ id: 'bells', title: 'Bell practice', icon: '🔔', level: Math.min(5, Math.floor(life.s.soul.n.bells / 3)), ease: life.s.st.craft / 100, skill: 'Craft' }, (score) => { if (score != null && kit.life && !kit.life.s.dead) kit.doAct('soulBells', score); });
      },
    },

    sheets: {
      soulChurch() {
        const life = kit.life, S = life.s.soul, n = S.n;
        let body = '<p class="lead">The Reverend Alice Hollis has pinned up the week in her round, hurried hand: the service on Sunday, the soup run on Tuesday, bell practice on Thursday, jumble on Saturday, and a thermometer for the roof fund.</p>';
        // (The services and the churchyard are on the church's own sheet too: this is the whole week in one place.)
        body += sections(life.soulRows(['soulService', 'soulCarols', 'soulSupper', 'soulBells', 'soulSoup', 'soulVisit', 'soulJumble', 'soulRoofGive', 'soulYard']));
        const roof = Math.min(S.roof, ROOF);
        body += `<h3>${S.f.roof ? 'The roof' : 'The roof fund'}</h3><div class="item soul-roof">
          <div class="item-top"><span class="act-ico">${S.f.roof ? '⛪' : '🪣'}</span><div><b>${S.f.roof ? 'Mended, and not a drip' : `${money(roof)} of ${money(ROOF)}`}</b><small>${S.f.roof ? 'The jumble sale is raising money for the spire now.' : 'Every jumble sale helps, and so does anything you put in the bucket.'}</small></div></div>
          <div class="soul-therm"><span style="width:${Math.round(roof / ROOF * 100)}%"></span></div></div>`;
        body += `<h3>How the parish knows you</h3><div class="item"><div class="item-top"><span class="act-ico">⛪</span><div><b>${esc(life.soulParishWord())}</b><small>Comes of turning up: services, suppers, and lending a hand.</small></div></div>
          <div class="soul-therm parish"><span style="width:${Math.round(S.parish)}%"></span></div>
          <div class="facts"><span>${n.service} Sunday${n.service === 1 ? '' : 's'}</span><span>${n.vol} time${n.vol === 1 ? '' : 's'} lending a hand</span><span>${n.bells} bell practice${n.bells === 1 ? '' : 's'}${life.soulRinger() ? ', in the band' : ''}</span></div></div>`;
        if (S.days.length) body += `<h3>Big days at St Brigid’s</h3><div class="item">${S.days.slice().reverse().slice(0, 12).map((d) => `<div class="line"><span>${sayDay(d)}</span><b class="soul-when">${when(d.t)}</b></div>`).join('')}</div>`;
        return { icon: '📌', title: 'The parish noticeboard', sub: `St Brigid’s · ${life.soulParishWord()}`, body };
      },

      soulYard() {
        const life = kit.life, S = life.s.soul;
        if (!S.graves.length) return null;
        let body = '<p class="lead">Yew trees, leaning stones, and a bench with the whole bay below it. The Reverend Hollis keeps the grass down with a mower older than she is.</p>';
        body += S.graves.map((g, i) => ({ g, i })).reverse().map(({ g, i }) => `<div class="item soul-grave">
          <div class="item-top"><span class="act-ico">🪦</span><div><b>${esc(g.name)}</b><small>${esc(cap(life.soulRelation(g)))}. Died ${when(g.t).toLowerCase()}, aged ${g.age}.</small></div></div>
          <p class="fine">${esc(life.soulSaid(g))}${g.visits ? ` You have visited ${g.visits === 1 ? 'once' : g.visits === 2 ? 'twice' : `${g.visits} times`}.` : ''}</p>
          <div class="picks">${pick(`Visit ${chip('time', '⏱ 1')}`, 'soulGrave', i, life.can('soulGrave', i))}</div></div>`).join('');
        body += '<p class="fine">One visit a season. Grief eases with time, and with company.</p>';
        return { icon: '🪦', title: 'The churchyard', sub: 'St Brigid’s', body };
      },
    },

    css: `
.soul-tr { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0; }
.soul-tr + .soul-tr { border-top: 1.5px solid var(--line); }
.soul-tr > i { font-style: normal; font-size: 24px; width: 34px; text-align: center; line-height: 1.2; }
.soul-tr > div { flex: 1; min-width: 0; display: grid; gap: 1px; }
.soul-tr b { font-size: 15px; font-weight: 900; }
.soul-tr b em { font-style: normal; font-size: 11.5px; font-weight: 900; color: #9a8f78; text-transform: uppercase; letter-spacing: .05em; margin-left: 4px; }
.soul-tr small { font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.35; }
.soul-does { font-size: 12.5px; font-weight: 800; color: var(--good); line-height: 1.35; margin-top: 2px; }
.soul-tr.shape > i { opacity: .8; }
.soul-tr.shape b { color: #7a6f58; }
.soul-dots { flex: none; align-self: center; font-size: 12px; letter-spacing: 1px; color: var(--teal); white-space: nowrap; }
.soul-mind .sub { margin-top: 0 !important; }
.soul-mind .skill > span:nth-child(2) { width: 62px; }
.soul-mind .skill .bar { flex: 1; }
.soul-mind .skill .bar > span { background: var(--sun); }
.soul-therm { height: 10px; margin-top: 9px; border-radius: 6px; background: #f1eadb; overflow: hidden; }
.soul-therm span { display: block; height: 100%; border-radius: 6px; background: var(--coral); }
.soul-therm.parish span { background: var(--teal); }
.soul-when { font-size: 12.5px; color: var(--muted); font-weight: 800 !important; }
.soul-grave .fine { margin-top: 6px; }

.mg-belltop { display: grid; justify-items: center; gap: 6px; width: min(340px, 100%); }
.mg-bellcall { margin: 0; min-height: 1.4em; font-size: 18px; font-weight: 900; color: var(--teal-d); font-style: italic; }
.mg-bellrow { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; width: 100%; }
.mg-bellrow span { display: grid; place-items: center; height: 44px; border-radius: 12px; background: #fff; box-shadow: 0 2px 0 var(--line); font-size: 22px; font-weight: 900; color: #7a6f58; transition: background .1s, transform .1s; }
.mg-bellrow span.now { background: var(--sun); color: var(--ink); transform: scale(1.08); }
.mg-bellrow span.ok { background: #e4f5ea; color: var(--good); }
.mg-bellrow span.bad { background: #fde8e4; color: var(--bad); }
.mg-bellrow.mg-bellnext span { height: 26px; font-size: 14px; background: transparent; box-shadow: none; color: #b5aa90; }
.mg-bellbeat { width: 100%; height: 6px; border-radius: 3px; background: #efe6d3; overflow: hidden; }
.mg-bellbeat span { display: block; height: 100%; width: 0; background: var(--teal); }
.mg-bells { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: min(340px, 100%); }
.mg-bells button { aspect-ratio: 1; min-height: 72px; border-radius: 22px; display: grid; place-items: center; align-content: center; gap: 2px; box-shadow: 0 5px 0 rgba(0, 0, 0, .22); color: #fff; }
.mg-bells button i { font-style: normal; font-size: 34px; line-height: 1; transform-origin: 50% 10%; }
.mg-bells button b { font-size: 20px; font-weight: 900; }
.mg-bells button:active { transform: translateY(3px); box-shadow: 0 2px 0 rgba(0, 0, 0, .22); }
.mg-bells .b0 { background: #e2b04a; } .mg-bells .b1 { background: #d39c3c; } .mg-bells .b2 { background: #c18a33; }
.mg-bells .b3 { background: #a8742c; } .mg-bells .b4 { background: #8e6127; } .mg-bells .b5 { background: #6f4b21; }
.mg-bells .b5 i { font-size: 40px; }
.mg-bells button.swing i { animation: soul-swing .5s ease-out; }
@keyframes soul-swing { 0% { transform: rotate(0); } 30% { transform: rotate(-24deg); } 65% { transform: rotate(14deg); } 100% { transform: rotate(0); } }
@media (max-height: 600px) { .mg-bells button { min-height: 60px; } .mg-bells { gap: 9px; } .mg-bellrow span { height: 38px; } }
`,
  };
}
