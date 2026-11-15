// What the fourth playtest found, and its mending: the trust's accounts, parents who died in one season,
// the crisis cards of the middle years and a rut that bites, Nan Carne's lot and respectable people,
// a family's town (its name, its calendar, the names it has given), the role cards told in other words
// over a long life, club leaders who come to know their members, and a handful of smaller faults.
import { EVENTS } from '../../games/new-in-town/js/events.js';
import { QUESTS, CAREERS } from '../../games/new-in-town/js/data.js';
import { SHOUTS, SHOUT_ALT } from '../../games/new-in-town/js/coast.js';
import { RUNS } from '../../games/new-in-town/js/clubs.js';
import midlifeUi from '../../games/new-in-town/js/midlife-ui.js';

const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const bad = (t) => typeof t !== 'string' || /undefined|NaN|null|\[object|\s\s/.test(t);
const rig = (X, yes, f) => { const was = X.chance; X.chance = () => yes; try { return f(); } finally { X.chance = was; } };
const kid = (L, o) => { const p = L.makePerson({ kind: 'child', single: false, ...o }); L.s.people.push(p); return p; };
const kitFor = (L) => ({ life: L, esc: (t) => String(t), money: (n) => `$${Math.round(n).toLocaleString('en-US')}`, cashShort: (n) => `$${n}`, chip: (k, t) => `(${t})`, pick: (label) => `[${label}]`, actRow: (a) => `<div class="act">${a.title} ${a.desc || ''} ${a.why || ''}</div>` });
const strip = (h) => h.split(/<[^>]*>/).join(' ').split(/\s+/).join(' ');
// The most times any one string turns up in a list.
const most = (l) => { const n = {}; for (const t of l) n[t] = (n[t] || 0) + 1; return Math.max(0, ...Object.values(n)); };
// Answers whatever is waiting, the first choice that can be taken.
const answer = (L) => { let ev, n = 0; while ((ev = L.event()) && n++ < 30) { const i = ev.opts.findIndex((o) => !o.why); if (!L.choose(i < 0 ? 0 : i).ok) L.s.pend.shift(); } };
// The next life, begun as game.js begins it (the name box holds sixteen letters).
function next(D, i = 0, seed = 5, typed = null) {
  const nx = D.chapNextLife(i);
  const L = D.constructor.create({ name: (typed != null ? typed : nx.name || 'Cousin').trim().slice(0, 16), sex: nx.sex || 'f', look: nx.look, gen: nx.gen, inherit: nx.inherit, parent: nx.parent, raised: nx.st, gifts: nx.gifts, sibs: nx.sibs || [], seed });
  L.chapBegin(nx.carry, []);
  return { L, nx };
}

export default function ({ check, fresh, Life, ACTIONS }) {
  // ---- 1. the trust's accounts: once in a lapse, a loss the size of the fund, and the Me tab warns ----
  {
    const L = fresh({ name: 'Ada Pengelly' }), s = L.s;
    s.age = 52; s.cash = 3e6; s.mid.means = L.midCalcMeans();
    L.act('midFound', 'books');
    const t = s.mid.trust;
    check(t && t.fund >= 40000 && ACTIONS.midTopUp.title && !bad(L.look('midTopUp').title), 'the trust’s top-up has a name on the sheet');
    let books = 0, xs = [];
    for (let i = 0; i < 40; i++) { s.pend = []; rig(L, true, () => L.endSeason()); for (const q of s.pend) if (q.id === 'midTrustBooks') { books++; xs.push(q.x); } }
    check(books === 1, `a trust nobody chairs tempts its treasurer once in a lapse, not every year (${books} in ten years)`);
    check(xs[0] && xs[0].n > 0 && xs[0].n <= t.start * 0.2 && xs[0].n < s.cash / 50, `and what goes is a share of the fund, not of your purse (${xs[0] && xs[0].n} of ${t.start})`);
    s.pend = []; L.queue('midTrustBooks', xs[0]);
    const ev = L.event();
    check(ev && ev.opts[0].cost === xs[0].n && !/from now on/.test(ev.opts.map((o) => o.t).join()) && !bad(ev.text), 'putting it back costs what went');
    const r = L.choose(0);
    check(r.ok && !/from now on/.test(r.text) && L.midChairDue() >= 4, 'and promises nothing it does not do');
    const me = strip(midlifeUi(kitFor(L)).me(L));
    check(/trustees have not seen you/.test(me), 'the Me tab says when the chair is due');
    const sheet = strip(midlifeUi(kitFor(L)).sheets.midPlans().body);
    check(!/undefined/.test(sheet) && /Put more into the fund/.test(sheet), 'and the sheet’s top-up row is named');
    // Chair a meeting, and a later lapse may tempt him again.
    s.time = 6; s.use = {};
    check(L.act('midChair').ok && L.midChairDue() === 0, 'chairing is seen');
    books = 0;
    for (let i = 0; i < 40 && !books; i++) { s.pend = []; rig(L, true, () => L.endSeason()); if (s.pend.some((q) => q.id === 'midTrustBooks')) books++; }
    check(books === 1, 'and after a new lapse, the treasurer may be tempted again');
    // A card queued in an old save, without the sum: a tenth of the fund.
    s.pend = []; L.queue('midTrustBooks');
    check(L.event() && L.event().opts[0].cost > 0 && L.event().opts[0].cost <= t.fund, 'an old save’s card still knows what went');
  }

  // ---- 2. a mother and father do not die in the same season ----
  {
    let close = 0, both = 0, tales = 0, told = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const L = fresh({ seed });
      const s = L.s;
      for (const p of s.people) if (p.kind === 'parent') p.age = 84;
      const died = [];
      for (let i = 0; i < 80 && s.people.some((p) => p.kind === 'parent'); i++) {
        s.time = 0; L.endSeason();
        let ev, n = 0;
        while ((ev = L.event()) && n++ < 20) {
          if (ev.id === 'parentDies') died.push({ t: s.t, age: L.person(s.pend[0].x).age });
          if (ev.id === 'wantsLastTalk') { const k = ev.opts.findIndex((o) => /life before/.test(o.t)); const r = L.choose(k < 0 ? 0 : k); if (k >= 0) { tales++; told += 1; s.f.tales = [...(s.f.tales || []), r.text]; } continue; }
          L.choose(Math.max(0, ev.opts.findIndex((o) => !o.why)));
        }
      }
      if (died.length === 2) { both++; if (died[1].t - died[0].t < 12 && died[1].age < 96) close++; }
      const t = s.f.tales || [];
      if (t.length === 2 && t[0].split('.')[0] === t[1].split('.')[0]) close += 100;
    }
    check(both >= 30 && close === 0, `the second parent does not follow the first within three years (${close} too close of ${both}), and tells a different story`);
    check(tales > 0 && told > 0, 'and a parent near the end still asks for you');
  }

  // ---- 3. the crisis cards share one cooldown, and are worded for the life lived ----
  {
    const L = fresh(), s = L.s;
    s.age = 49; s.t = 124; s.cash = 50000;
    s.job = { c: 'medicine', r: 3, n: 0, perf: 60, raise: 0 };
    check(EV.midlife.when(L), 'Is this it? can come at forty-nine');
    L.queue('midlife'); L.choose(0);
    check(s.mid.crisis === s.t && L.midHad('bike'), 'a motorbike bought in a crisis is remembered');
    check(!EV.midlife.when(L), 'and the card does not come round again soon');
    s.age = 50; L.queue('birthday50');
    const fifty = L.event();
    check(fifty && !fifty.opts.some((o) => /motorbike/.test(o.t)) && !bad(fifty.text), 'Fifty does not offer a second red one so soon');
    L.choose(0);
    // The same week again waits its turn.
    s.mid.rut = 6; s.pend = [];
    for (let i = 0; i < 8; i++) { s.time = 0; L.endSeason(); }
    check(!s.pend.some((q) => q.id === 'midWobble') && L.midCrisisAgo() < 16, 'nor does The same week again, within four years of another crisis');
    s.mid.crisis = s.t - 20; s.mid.wob = null; s.mid.rut = 6; s.pend = [];
    let wob = null;
    for (let i = 0; i < 4 && !wob; i++) { s.time = 0; L.endSeason(); if (s.pend.some((q) => q.id === 'midWobble')) wob = true; }
    check(wob, 'after four years it may come');
    s.job = null; s.retired = false; s.plot = null;
    s.pend = s.pend.filter((q) => q.id === 'midWobble');
    const w = L.event();
    check(w && w.id === 'midWobble' && !/go to work/.test(w.text) && !w.opts.some((o) => /red Varenna/.test(o.t)), `with no job it does not say you go to work, and offers no second red one (${w && w.text.slice(0, 60)})`);
    // The rut bites in a flat life, and a varied one keeps it off.
    const flat = fresh({ seed: 31 }), busy = fresh({ seed: 31 });
    for (const X of [flat, busy]) { X.s.age = 39; X.s.t = 84; X.s.cash = 1e5; X.s.job = { c: 'tech', r: 3, n: 0, perf: 60, raise: 0 }; X.s.home = 'flat'; }
    // (The busy one tries two things each spring it has not done in years: a dozen, taken in turn.)
    const VARY = ['library', 'workout', 'volunteer', 'chat', 'quiz', 'jog', 'bench', 'litter', 'yoga', 'artclass', 'cliffWalk', 'seeShow'].filter((id) => ACTIONS[id]);
    let tried = 0;
    for (let i = 0; i < 4 * 12; i++) {
      for (const X of [flat, busy]) { X.s.time = X.timeMax(); X.s.use = {}; X.act('work'); }
      flat.act('rest');
      if (busy.season === 0) for (const id of [VARY[(i / 2) % VARY.length], VARY[(i / 2 + 1) % VARY.length]]) if (busy.act(id).ok) tried++; else busy.act('rest');
      for (const X of [flat, busy]) { X.s.pend = []; X.endSeason(); X.s.pend = []; }
    }
    check(flat.s.mid.rut >= 5 && busy.s.mid.rut <= 2 && tried >= 20, `a flat life wears into a rut (${flat.s.mid.rut}); one with new things in it does not (${busy.s.mid.rut}, ${tried} new things)`);
    const O = fresh(); delete O.s.mid.yr; delete O.s.mid.last; delete O.s.mid.crisis;
    const R = new Life(JSON.parse(JSON.stringify(O.s)));
    check(R.s.mid.yr && R.s.mid.last && R.midCrisisAgo() === 999, 'a life saved before all this opens with it');
  }

  // ---- 4. Nan Carne's lot are no business of respectable people ----
  {
    let arrive = 0;
    for (let i = 0; i < 6; i++) {
      const L = fresh({ seed: 60 + i }), s = L.s, H = s.heists;
      // A surgeon who did a few silly things when young, and nothing since.
      s.age = 60; s.t = 168; s.n.crimes = 14; H.crimes = 14; H.clean = 60; H.sal = 60;
      s.job = { c: 'medicine', r: 5, n: 0, perf: 60, raise: 0 };
      for (let k = 0; k < 60; k++) { s.pend = []; s.time = 0; L.endSeason(); if (s.pend.some((q) => /^carne/.test(q.id))) arrive++; }
      check(!L.heistLow() && H.rival.stage === 0, 'a surgeon with a quiet past is not on the low road');
    }
    check(arrive === 0, `and Nan Carne never comes calling (${arrive})`);
    const W = fresh(), H = W.s.heists;
    W.s.n.crimes = 20; W.s.t = 40; W.s.age = 30; H.rival.stage = 2; H.rival.next = 0; H.crimes = 20; H.clean = 0;
    W.s.job = { c: 'crew', r: 1, n: 0, perf: 50, raise: 0 };
    check(W.heistLow(), 'on Sal’s books is the low road');
    W.s.job = { c: 'medicine', r: 1, n: 0, perf: 50, raise: 0 };
    for (let k = 0; k < 24 && !H.rival.end; k++) { W.s.pend = []; W.s.time = 0; W.endSeason(); }
    check(H.rival.end === 'apart' && !W.s.ach.heistCarne && !W.epitaph().some((t) => /pier/.test(t)), `gone straight, the feud is settled without you (${H.rival.end}), with no trophy and nothing in the obituary`);
    const P = fresh(); P.s.heists.rival.end = 'yours'; P.s.heists.rival.patch = false;
    check(P.epitaph().some((t) => /gave it back/.test(t)) && !P.epitaph().some((t) => /ran the pier/.test(t)), 'a pier given back is not a pier run for years');
  }

  // ---- 8. a family's town: its name, its calendar, and the names it has given ----
  {
    const D = fresh({ name: 'Maud Ellery', sex: 'f', seed: 81 }), s = D.s;
    check(D.year === 1 && D.yearOf(4) === 2 && s.y0 == null, 'a first life’s calendar starts at year one, as it always did');
    s.age = 81; s.t = 252; s.cash = 5000;
    const will = kid(D, { name: 'Will', sex: 'm', age: 50, bond: 80, job: 'teaching' });
    const pet = D.chapGiveName('pet', ['Scraps', 'Biscuit']), shop = D.chapGiveName('shop', ['Steam & Strings', 'Spoons'], true);
    check(pet && shop === 'Steam & Strings', 'the family gives names in the town');
    s.annals.poll = s.t + 6; s.annals.race = null;
    const pollSaid = D.annalsWhen(s.annals.poll), deathYear = D.year;
    D.die('old age');
    const { L, nx } = next(D, 0, 5);
    check(nx.name === 'Will Ellery' && L.s.name === 'Will Ellery' && L.chapSurname() === 'Ellery' && L.midTrustName() === 'The Ellery Trust', `the heir keeps the family’s name (${L.s.name}, ${L.midTrustName()})`);
    check(L.year === deathYear && L.s.y0 === 63, `and the town’s calendar runs on (year ${L.year}, the last life ended in year ${deathYear})`);
    check(L.annalsWhen(L.s.annals.poll) === pollSaid, `polling day is the same day in both lives (${L.annalsWhen(L.s.annals.poll)}, was ${pollSaid})`);
    check(L.chapNameFree('pet', ['Scraps', 'Biscuit']).length === 1 && L.chapGiveName('shop', ['Steam & Strings', 'Spoons'], true) === 'Spoons', 'and a name the family has given is not given again');
    // Named only by a first name in the name box, or cut short by it: the family's name is put right.
    const { L: B } = next(D, 0, 6, 'Bill');
    check(B.s.name === 'Bill Ellery', `a first name alone takes the family’s (${B.s.name})`);
    const Long = fresh({ name: 'Ann Winterbourne', sex: 'f', seed: 82 });
    Long.s.age = 80; Long.s.t = 248; kid(Long, { name: 'Gabriel', sex: 'm', age: 50, bond: 80 });
    Long.die('old age');
    const { L: G, nx: gx } = next(Long, 0, 7);
    check(gx.name === 'Gabriel Winterbourne' && G.s.name === 'Gabriel Winterbourne', `a name too long for the box is mended (${G.s.name})`);
    // An old save from before: no running year, and the calendar as it was.
    const Old = new Life(JSON.parse(JSON.stringify(L.s)));
    delete Old.s.y0;
    check(Old.year === Math.floor(Old.s.t / 4) + 1, 'a life saved before the calendar ran on keeps its own count');
    // The gazette, the annals and the obituary all read the same year.
    check(L.annalsWhen(L.s.t) === `${['spring', 'summer', 'autumn', 'winter'][L.season]}, year ${L.year}`, 'the annals date things by the same year as the header');
    // A memory of the town is never from before you were born.
    const M = fresh({ seed: 84 });
    M.s.age = 60; M.s.t = 100; M.s.annals.from = -60 * 4; M.chapHow = () => 'home';
    M.s.annals.built.bypass = -200; M.s.annals.built.lido = -40;
    const mem = [];
    for (let i = 0; i < 20; i++) { const x = EV.anRemember.ctx(M); if (x) mem.push(x.a); }
    check(mem.length === 20 && mem.every((a) => a >= 6), `a memory of the town is from an age you could have it, never before you were born (${[...new Set(mem)].join(', ')})`);
  }

  // ---- 9. the role cards, told in other words over a long life ----
  {
    // Forty years on the lifeboat: the same kind of shout, many times over.
    const L = fresh({ seed: 91 }), s = L.s;
    s.st.fitness = 70; s.coast.lb = { at: 0, train: 4, rank: 1, stand: 60, calls: 0, saved: 0, medal: 0, bigs: 0, miss: 0, log: [], act: 0, left: null, done: null };
    for (const id of Object.keys(SHOUTS)) check(SHOUT_ALT[id] && SHOUT_ALT[id].length >= 2 && SHOUT_ALT[id].every((a) => a.text && a.bold.length === 2 && a.safe.length === 2), `the ${id} shout has other words`);
    const texts = [], outs = [];
    for (let i = 0; i < 30; i++) {
      s.time = 6; s.t += 3; s.pend = [];
      L.queue('coastShout', ['dog', 'cave', 'yacht'][i % 3]);
      const ev = L.event();
      texts.push(ev.text);
      const r = L.choose(i % 2);
      outs.push(r.text.split(' Afterwards')[0].split(' “Second cox')[0]);
    }
    check(most(texts) <= 4 && most(outs) <= 4, `thirty shouts of three kinds read differently (the same opening at most ${most(texts)} times, the same ending ${most(outs)})`);
    // The pagers mostly send a kind you have seen least.
    const kinds = {};
    for (let i = 0; i < 60; i++) { s.wx = 'storm'; const k = L.coastShoutPick(); kinds[k] = (kinds[k] || 0) + 1; }
    check(Object.keys(kinds).length >= 3, 'and the kinds of shout come round in turn');

    // A dozen arrests by the same detective, talked out of every one.
    const K = fresh({ seed: 92 }), H = K.s.heists;
    K.s.st.charm = 100; H.det.file = 70; H.det.met = 0; H.det.off = 0;
    const nicked = [];
    for (let i = 0; i < 12; i++) {
      K.s.t += 3; K.s.pend = []; K.s.f.salOff = 0; H.det.file = 70;
      K.queue('busted', { what: 'a crate of brandy', sev: 2 });
      const ev = K.event();
      nicked.push(ev.text);
      const j = ev.opts.findIndex((o) => /all Sal/.test(o.t));
      const r = rig(K, true, () => K.choose(j));
      if (i === 0) check(/lift home/.test(r.text) && !/the constable gives you a lift/.test(r.text), `the detective who arrested you drives you home (${r.text.slice(0, 70)})`);
    }
    check(most(nicked) <= 3 && H.n.nicked === 12, `twelve arrests, not the same night twelve times (at most ${most(nicked)} alike)`);
    // A dozen times out of the gate.
    const G = fresh({ seed: 93 }), lag = G.s.heists.lag, gates = [];
    for (let n = 5; n <= 16; n++) { G.s.t += 5; lag.n = n; lag.gate = { who: 'none', pid: null, also: null, served: 2, how: 'time' }; gates.push(EV.lagGate.text(G).split(' Nobody is waiting')[0]); }
    check(most(gates) <= 3 && gates.every((t) => !bad(t)), `the gate, many times over, in other words (at most ${most(gates)} alike)`);
    // Forty years married: the anniversary dinner is not the same evening twice running.
    const A = fresh({ seed: 94 }), sp = A.meet({ kind: 'spouse', bond: 80, single: false });
    sp.live = true; A.s.cash = 1e6;
    const dinners = [];
    for (let y = 1; y <= 40; y++) { A.s.pend = []; A.queue('wantsAnniv', { p: sp.id, y }); const r = A.choose(0); dinners.push(r.text); }
    check(dinners.every((t, i) => !i || t !== dinners[i - 1]) && most(dinners) <= 7, `forty anniversaries, forty evenings (at most ${most(dinners)} alike)`);
    // Four years on, and on: each term's end in its own words, and none past seventy-two.
    const C = fresh({ seed: 95 }), titles = [];
    C.s.age = 40; C.s.cash = 1e6;
    C.s.mid.seat = { since: 0, until: 100, miss: 0, att: 0, ward: 0, votes: [], terms: 0 };
    for (let n = 0; n < 5; n++) { C.s.mid.seat.terms = n; C.s.pend = []; C.queue('midTerm'); const ev = C.event(); titles.push(`${ev.title}|${ev.text}`); }
    check(new Set(titles).size === 5, 'five terms on the council, five ways of saying it');
    C.s.age = 74; C.s.pend = []; C.queue('midTerm');
    check(!C.event().opts.some((o) => o.t === 'Stand again') && /younger/.test(C.event().opts.map((o) => o.t).join()), 'and past seventy-two there is no standing again');
    // Somebody on the sea wall: a different somebody, each time it comes.
    const S = fresh({ seed: 96 }), who = [];
    for (let i = 0; i < 3; i++) { S.s.pend = []; const x = EV.soulSeaWall.ctx(S); S.s.seen.soulSeaWall = (S.s.seen.soulSeaWall || 0) + 1; S.queue('soulSeaWall', x); who.push(S.event().text); const r = S.choose(0); check(!bad(r.text), 'and the sitting with them reads right'); }
    check(new Set(who).size === 3, 'three times on the sea wall, three different people');
  }

  // ---- 9, again: a whole long life with the roles in it, lived season by season ----
  {
    const ROLE = new Set(['coastShout', 'busted', 'lagGate', 'wantsAnniv', 'midTerm', 'soulSeaWall', 'wantsLastTalk', 'midWobble', 'midTrustBooks']);
    const L = Life.create({ seed: 2, name: 'Long Life', sibs: [] }), s = L.s;
    s.quest = QUESTS.length; s.age = 25; s.t = 28; s.cash = 3e5; s.home = 'townhouse'; s.st.fitness = 60; s.st.charm = 60;
    s.coast.lb = { at: 0, train: 4, rank: 1, stand: 60, calls: 0, saved: 0, medal: 0, bigs: 0, miss: 0, log: [], act: 0, left: null, done: null };
    const sp = L.meet({ kind: 'spouse', bond: 85, single: false }); sp.live = true;
    if (s.wants) s.wants.p[sp.id] = { been: [], wed: 0, since: -4 };
    const opens = [], ends = [];
    for (let i = 0; i < 4 * 55 && !s.dead; i++) {
      s.time = L.timeMax(); s.use = {};
      L.act('out', { p: sp.id, a: 'walk' });
      if (s.age >= 40 && s.age <= 70 && !L.midSeat() && !L.can('midStand')) L.act('midStand');
      if (L.midSeat()) L.act('midCouncil');
      s.coast.lb.act = s.t; L.coastStand(3);
      L.endSeason();
      let ev, n = 0;
      while ((ev = L.event()) && n++ < 30) {
        const k = ev.opts.findIndex((o) => !o.why);
        if (ROLE.has(ev.id)) opens.push(`${ev.id}: ${ev.text}`);
        const r = L.choose(k < 0 ? 0 : ev.id === 'coastShout' ? i % 2 : k);
        if (!r.ok) { s.pend.shift(); continue; }
        if (ROLE.has(ev.id)) ends.push(`${ev.id}: ${r.text}`);
      }
    }
    check(s.coast.lb.calls >= 20 && opens.length >= 40, `a long life with the lifeboat, a marriage and the council in it (${s.coast.lb.calls} shouts, ${opens.length} role cards)`);
    check(most(opens) <= 3 && most(ends) <= 4, `and no role card reads the same more than a few times in it (${most(opens)} openings alike, ${most(ends)} endings)`);
  }

  // ---- 10. the club's leader comes to know you ----
  {
    for (const [club, who] of Object.entries(RUNS)) {
      const L = fresh({ seed: 100 }), s = L.s;
      s.cash = 1e5; s.st.fitness = 60; s.age = 30;
      s.time = 6;
      if (!L.act(`clubJoin_${club}`).ok) { check(false, `could not join ${club}`); continue; }
      for (let i = 0; i < 40; i++) { s.time = 6; s.use = {}; L.act(`clubNight_${club}`); s.pend = []; L.endSeason(); s.pend = []; }
      const f = s.folk.p[who];
      check(f.met != null && f.f >= 25 && f.f <= 60, `${who}, who runs ${club}, knows you after years of it (${Math.round(f.f)}: ${L.folkWord(f.f)})`);
    }
  }

  // ---- the smaller faults ----
  {
    // Nobody you live with, and no child, drifts for want of your time.
    const L = fresh(), s = L.s;
    s.age = 60; s.home = 'flat'; s.cash = 1e5;
    const sp = L.meet({ kind: 'spouse', bond: 95, single: false }); sp.live = true;
    const g = L.makePerson({ kind: 'grandchild', bond: 90, age: 7, single: false }); s.people.push(g);
    const f = L.meet({ bond: 95 });
    for (let i = 0; i < 6; i++) { s.pend = []; s.time = 0; L.endSeason(); }
    check(!L.midDrifting(sp) && !L.midDrifting(g) && L.midDrifting(f), 'the Me tab’s drift list is for those who live elsewhere, and are grown');
    // A politician is told why not.
    s.job = { c: 'politics', r: 4, n: 0, perf: 60, raise: 0 };
    check(/politics already/.test(L.can('midStand') || ''), 'a Deputy Mayor is told they are in politics already');
    // On Sal's books, Sal has not washed his hands of you.
    const V = fresh(); V.s.job = { c: 'crew', r: 1, n: 0, perf: 50, raise: 0 }; V.s.heists.sal = 5;
    check(!/nothing to do with you/.test(V.salWord()), `in the crew, Sal ${V.salWord().toLowerCase()}`);
    // The to-do list is for getting started.
    const T = Life.create({ seed: 7, name: 'Rich', sibs: [] });
    T.s.quest = 4; T.s.cash = 219000; T.s.age = 40; T.s.time = 6;
    const c0 = T.s.cash; T.act('rest');
    check(T.s.quest > 8 && T.s.cash === c0, `a life worth $219,000 is not told to buy a bicycle, nor paid to save (${QUESTS[T.s.quest] ? QUESTS[T.s.quest].text : 'done'})`);
    const U = Life.create({ seed: 7, name: 'Fen', sibs: [] });
    U.s.quest = 7; U.s.age = 65; U.s.time = 6; U.act('rest');
    check(U.s.quest > 7, 'nor told to earn a promotion at sixty-five with no job');
    const N = Life.create({ seed: 7, name: 'New', sibs: [] });
    N.s.quest = 4; N.s.time = 6; N.act('rest');
    check(N.s.quest === 4, 'but somebody just off the train still has the list');
    // At the top of the ladder, a shift does not count towards a promotion there is not.
    const Top = fresh(); Top.s.job = { c: 'medicine', r: CAREERS.medicine.rungs.length - 1, n: 0, perf: 60, raise: 0 };
    check(!/promotion/.test(Top.look('workHard').desc) && /promotion/.test(fresh({ seed: 3 }).s && (() => { const X = fresh(); X.s.job = { c: 'medicine', r: 1, n: 0, perf: 60, raise: 0 }; return X.look('workHard').desc; })()), 'going the extra mile at the top says what it is for');
    // A man is not cast as a woman with a basket; the children are not fed where there are none.
    const Fen = fresh({ sex: 'm', seed: 97 }); Fen.s.st.charm = 100;
    for (let i = 0; i < 12; i++) { Fen.s.pend = []; Fen.s.annals.ev.film = { t: Fen.s.t, part: 0 }; const op = EV.anFilm && EV.anFilm.opts.find((o) => /extra/.test(o.t)); if (op) { const r = rig(Fen, true, () => op.run(Fen, null, true)); check(!/Woman|Wife|Fishwife/.test(r), 'an extra’s part fit for a man'); } }
    const Pt = fresh({ seed: 98 }), wife = Pt.meet({ kind: 'spouse', bond: 80, single: false });
    Pt.s.wants.p[wife.id] = { been: [], inl: { mum: 'Pat', dad: 'Les', age: 90, left: 0, last: null, w: 50, help: 0 } };
    Pt.queue('wantsInlawsGone', { p: wife.id, mum: true, name: 'Pat', age: 90 });
    const ev = Pt.event();
    if (ev) { const r = Pt.choose(ev.opts.findIndex((o) => /going at home/.test(o.t))); check(!/children/.test(r.text), `no children, none to feed (${r.text.slice(0, 60)})`); }
    // Chasing a loss out of the cash in your pocket.
    const Ch = fresh(); Ch.s.cash = 65000; Ch.s.bank = 0; Ch.s.flutter.h = 80;
    Ch.queue('flChase', 15000);
    const o = Ch.event().opts.find((q) => /what you have|savings/.test(q.t));
    check(o && !o.why, 'with money in your pocket, it can be chased out of that');
    // One parent, one pronoun.
    const Fr = fresh(); const mum = Fr.s.people.find((p) => p.kind === 'parent' && p.sex === 'f');
    Fr.s.wants.p[mum.id] = { need: 1, ask: 1 }; Fr.queue('wantsFrail', { p: mum.id });
    check(Fr.event() && !Fr.event().opts.some((q) => /\bthem\b/.test(q.t)), 'a mother who is not managing is her, not them');
  }
}
