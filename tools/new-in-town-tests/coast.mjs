// The coast: Gorse Head and Smugglers’ Cove (birds, caves, the shore, the
// Sandcastle Cup, the lifeboat) and the mystery of the Merrow.
import { BIRDS, POOLS, STRAND, SITES, ATTRS, CARGO, LEADS, SHOUTS, fits, siteSaid } from '../../games/new-in-town/js/coast.js';
import { makeCave, caveScore, CAVE_W, CAVE_H } from '../../games/new-in-town/js/coast-games.js';
import { GAMES } from '../../games/new-in-town/js/mini.js';
import { ITEMS, TROPHIES, CURIOS, PLACES } from '../../games/new-in-town/js/data.js';

const KEYS = Object.keys(LEADS);
const MAIN = ['marlow', 'quinn', 'chart', 'archive', 'register'];
const clean = (t) => typeof t === 'string' && t.length > 20 && !/undefined|NaN|\[object|\s\s|\.\./.test(t);
// A fresh season with nothing waiting: time back, nothing used.
const reset = (L) => { L.s.use = {}; L.s.time = L.timeMax(); L.s.pend = []; };
// Answers whatever cards are waiting with the first choice that can be taken.
const settle = (L) => { for (let n = 0, ev; (ev = L.event()) && n < 20; n++) L.choose(Math.max(0, ev.opts.findIndex((o) => !o.why))); };

export default function ({ check, fresh, Life, ACTIONS }) {
  // ---- the tables hang together ----
  for (const [id, b] of Object.entries(BIRDS)) check((b.where === 'head' || b.where === 'cove') && b.w > 0 && b.rare >= 0 && b.rare <= 3 && (!b.only || (b.wx && b.wx.length)), `bird ${id}: a proper bird`);
  for (const [id, k] of Object.entries({ ...POOLS, ...STRAND })) check(k.name && k.icon && k.w > 0 && (!k.only || (k.wx && k.wx.length)), `${id}: a proper find`);
  for (let q = 0; q < 4; q++) for (const where of ['head', 'cove']) check(Object.values(BIRDS).filter((b) => b.where === where && (!b.when || b.when.includes(q)) && !b.only).length >= 3, `there are birds to see at the ${where} in season ${q}, whatever the weather`);
  check(Object.keys(BIRDS).length >= 20 && Object.values(BIRDS).filter((b) => b.rare === 3).length >= 3, 'a bird book with twenty kinds and a few very rare ones');
  check(ITEMS.binoculars && ITEMS.binoculars.at === 'headland' && PLACES.headland, 'binoculars are sold on Gorse Head');
  const vec = (k) => Object.keys(ATTRS).map((a) => k[a]).join();
  check(Object.keys(SITES).length === 8 && new Set(Object.values(SITES).map(vec)).size === 8, 'eight places, no two alike in every way');
  for (const [id, k] of Object.entries(SITES)) check(Object.keys(ATTRS).every((a) => ATTRS[a].vals[k[a]]) && clean(k.text), `${id}: a place the clues can speak of`);
  check(Object.values(SHOUTS).every((sc) => sc.board && clean(sc.text) && sc.bold.length === 3 && sc.safe.length === 3 && sc.saved >= 1), 'every call-out has its ways of going');
  check(Object.keys(SHOUTS).some((k) => !SHOUTS[k].wx), 'some call-outs come in any weather');
  for (const id of ['coastTwitcher', 'coastComber', 'coastCaver', 'coastCastle', 'coastShout', 'coastMedal', 'coastMerrow', 'coastShared']) check(TROPHIES[id], `trophy ${id} is in the cabinet`);

  // ---- the Merrow can always be solved, and is different every time ----
  {
    const answers = new Set(), cargos = new Set();
    let ok = true, sure = true, alone = true, texts = true;
    for (let seed = 1; seed <= 400; seed++) {
      const L = fresh({ seed }), m = L.coastMerrow();
      answers.add(m.ans); cargos.add(m.cargo);
      if (fits(m, KEYS).join() !== m.ans) ok = false;
      if (fits(m, MAIN).join() !== m.ans) sure = false;
      // (No one clue gives it away.)
      for (const key of KEYS) if (fits(m, [key]).length < 2) alone = false;
      for (const key of KEYS) if (!clean(L.coastClue(key).text)) { texts = false; console.log(key, L.coastClue(key).text); }
      if (new Set([m.master, m.mate, m.boy]).size !== 3 || m.searched.includes(m.ans)) ok = false;
    }
    check(ok && sure, 'every clue together, or the five main ones alone, point to one place: the right one');
    check(alone, 'and no one clue gives it away');
    check(texts, 'every clue reads properly');
    check(answers.size === 8 && cargos.size === CARGO.length, 'any of the eight places can be the answer, and any cargo');
    // Every clue can be told whichever place it is and whatever it speaks to.
    const L = fresh(), m = L.coastMerrow();
    let all = true;
    for (const ans of Object.keys(SITES)) for (const g1 of [true, false]) for (const g2 of [true, false]) for (const marks of Object.keys(ATTRS)) {
      m.ans = ans;
      m.who = { marlow: g1 ? 'light' : 'water', quinn: g1 ? 'water' : 'side', chart: g1 ? 'side' : 'light', archive: g2 ? 'ground' : 'cover', register: g2 ? 'cover' : 'ground', marks };
      for (const key of KEYS) if (!clean(L.coastClue(key).text)) all = false;
      if (fits(m, MAIN).join() !== ans) all = false;
    }
    check(all, 'every clue reads properly for every answer');
    check(JSON.stringify(fresh({ seed: 9 }).coastMerrow()) === JSON.stringify(fresh({ seed: 9 }).coastMerrow()), 'the same life has the same mystery');
  }

  // ---- a life from before the coast was there ----
  {
    const L = fresh();
    delete L.s.coast;
    const O = new Life(JSON.parse(JSON.stringify(L.s)));
    check(O.s.coast && O.s.coast.caves.n === 0 && O.s.coast.castle.wins === 0 && !O.s.coast.lb && !O.s.coast.m, 'an old life is given an empty coast');
    check(O.act('coastBirds').ok && O.placeActions('cove').length > 0 && O.endSeason(), 'and can use it at once');
    O.s.coast.lb = { rank: 1, stand: 30 };
    const P = new Life(JSON.parse(JSON.stringify(O.s)));
    check(P.s.coast.lb.calls === 0 && Array.isArray(P.s.coast.lb.log) && P.coastCrew(), 'a lifeboat record from before is filled in');
  }

  // ---- birds ----
  {
    const L = fresh(), s = L.s;
    s.t = 1; s.wx = 'fair'; reset(L);
    const sm = s.st.smarts, r = L.act('coastBirds');
    check(r.ok && clean(r.text) && Object.keys(s.coast.birds).length >= 1 && s.st.smarts > sm, 'watching the birds fills the book, and is good for Smarts');
    check(L.act('coastBirds').ok && !L.act('coastBirds').ok, 'twice a season on the Head');
    check(L.act('coastWaders').ok && !L.act('coastWaders').ok, 'and once at the cove');
    // Weather birds only in their weather; very rare ones rarely.
    let wrong = 0, rare = 0, n = 0, glass = 0;
    for (let i = 0; i < 1500; i++) {
      s.t = i % 4; s.wx = ['fair', 'wet', 'fog'][i % 3]; reset(L);
      const before = { ...s.coast.birds };
      L.act(i % 2 ? 'coastBirds' : 'coastWaders'); s.pend = [];
      for (const id of Object.keys(s.coast.birds)) if (s.coast.birds[id] !== before[id]) { n++; const b = BIRDS[id]; if (b.only && !b.wx.includes(s.wx)) wrong++; if (b.when && !b.when.includes(s.t % 4)) wrong++; if (b.rare === 3) rare++; }
    }
    check(!wrong, 'a bird is only seen in its season, and a weather bird only in its weather');
    check(rare < n * 0.02, `very rare birds are very rare (${rare} in ${n})`);
    s.cash = 5000;
    check(L.act('buy', 'binoculars').ok && s.items.binoculars, 'binoculars can be bought on the Head');
    for (let i = 0; i < 400; i++) { s.t = 1; s.wx = 'fair'; reset(L); const b = Object.keys(s.coast.birds).length; L.act('coastBirds'); glass += Object.keys(s.coast.birds).length - b; s.pend = []; }
    check(Object.keys(s.coast.birds).length >= 10, 'and in time the book fills up');
    // A very rare bird brings the twitchers, once.
    const T = fresh(), ts = T.s;
    ts.items.binoculars = 1;
    let seen = false;
    for (let i = 0; i < 4000 && !seen; i++) { ts.t = 3; ts.wx = 'snow'; reset(T); T.act('coastBirds'); if (ts.coast.birds.owl) seen = true; else ts.pend = []; }
    check(seen && ts.coast.rare && ts.coast.rare.id === 'owl' && T.event() && T.event().id === 'coastTwitch', 'a snowy owl in the snow brings the twitchers');
    check(T.choose(1).ok && T.gazette().items.some((it) => /Snowy owl/.test(it.h)), 'and the Gazette has it');
  }

  // ---- the caves ----
  {
    const L = fresh(), s = L.s;
    s.cash = 5000; s.t = 0; s.wx = 'storm'; reset(L);
    check(/sea is in the caves/.test(L.can('coastCaves')), 'no caves in a gale');
    s.wx = 'fair';
    check(L.can('coastCaves', 2) && L.can('coastCaves', 'x') && !L.can('coastCaves', 0.5) && !L.can('coastCaves'), 'a trip into the caves takes a score from 0 to 1, or none');
    const cash = s.cash, r = L.act('coastCaves', 0.05);
    check(r.ok && L.event() && L.event().id === 'coastCutOff' && s.cash === cash - 15, 'staying in too long: cut off by the tide');
    check(!L.act('coastCaves', 1).ok, 'once a season');
    const c2 = s.cash + s.bank - s.debt, ch = L.choose(0);
    check(ch.ok && s.cash + s.bank - s.debt === c2 - 250 && s.coast.caves.cut === 1, 'waiting to be rescued costs a $250 fine');
    const g = L.gazette();
    check(/Hob’s Hole/.test(g.lead.h) && g.items.length > 3, 'and makes the front page of the Gazette');
    // Swimming for it, done badly, still ends with a rescue; done well, with nobody knowing.
    const W = new Life(JSON.parse(JSON.stringify(s)));
    W.queue('coastCutOff'); W.s.st.fitness = 100;
    const w = W.choose(1);
    check(w.ok && (w.win ? W.s.coast.caves.cut === 1 : W.s.coast.caves.cut === 2), 'swimming for it keeps you out of the paper, if it comes off');
    // What comes out of the caves is a pleasant extra, not a living.
    const M = fresh(), ms = M.s;
    ms.cash = 100000;
    let got = 0, trips = 0;
    for (let i = 0; i < 400; i++) {
      ms.t = i; ms.wx = 'fair'; reset(M);
      const before = ms.cash + M.curiosWorth() / 0.8;
      const rr = M.act('coastCaves', 1);
      if (!rr.ok) continue;
      trips++; got += ms.cash + 15 + M.curiosWorth() / 0.8 - before;
      ms.curios = {};
    }
    check(trips === 400 && got / trips > 150 && got / trips < 900, `a perfect trip is worth about ${Math.round(got / trips)} on average, and costs a season’s visit`);
    check(ms.coast.caves.best === 1 && ms.ach.coastCaver, 'coming out with everything wins a trophy');
    const E = fresh(); E.s.t = 0; E.s.wx = 'fair'; reset(E);
    check(E.act('coastCaves').ok && !E.event(), 'a trip played for you is an ordinary one');
    // The cave game: every cave can be got round, finds and all.
    let fine = true;
    for (let i = 0; i < 300; i++) {
      let x = (i * 9301 + 49297) % 233280;
      const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
      const cv = makeCave(rnd, i % 6);
      const open = cv.cells.filter((v) => v > 0).length;
      if (cv.cells.length !== CAVE_W * CAVE_H || !cv.cells[cv.mouth] || open < 12) fine = false;
      if (cv.finds.length < 3 || cv.finds.some((f) => cv.dist[f] < 2 || cv.cells[f] !== 1) || cv.pools.some((p) => cv.finds.includes(p))) fine = false;
      if (cv.cells.some((v, j) => v > 0 && cv.dist[j] < 0)) fine = false;
    }
    check(fine, 'every cave has its mouth, its finds and its pools, all of it reachable');
    check(caveScore(false, 4, 4) < 0.2 && caveScore(true, 0, 3) === 0.4 && caveScore(true, 3, 3) === 1, 'cut off scores under 0.2, out with nothing 0.4, out with everything 1');
    check(GAMES.coastCaves && GAMES.coastCastle && GAMES.coastCaves.words.length === 4 && GAMES.coastCastle.words.length === 4, 'the coast’s games are in the cabinet');
  }

  // ---- the shore ----
  {
    const L = fresh(), s = L.s;
    s.t = 1; s.wx = 'fair'; reset(L);
    check(L.act('coastComb').ok && Object.keys(s.coast.strand).length >= 1 && !L.act('coastComb').ok, 'the strandline, once a season');
    s.pend = [];
    check(L.act('coastPools').ok && Object.keys(s.coast.pools).length >= 1, 'the rock pools');
    s.wx = 'storm'; reset(L);
    check(/over the rocks/.test(L.can('coastPools')), 'but not in a gale');
    let only = true, beans = 0;
    for (let i = 0; i < 2000; i++) {
      s.t = i; s.wx = i % 2 ? 'storm' : 'fair'; reset(L);
      const b = s.coast.strand.bean || 0;
      L.act('coastComb'); s.pend = [];
      if ((s.coast.strand.bean || 0) > b) { beans++; if (s.wx !== 'storm' || ![2, 3].includes(L.season)) only = false; }
    }
    check(only && beans > 0, 'a sea bean only comes in on an autumn or winter gale');
    // What a gale leaves, to be fetched that season and no other.
    let washed = 0, wrong = 0;
    const G = fresh();
    for (let i = 0; i < 160; i++) { G.endSeason(); G.s.pend = []; if (G.s.coast.wash && G.s.coast.wash.t === G.s.t) { washed++; if (G.s.wx !== 'storm') wrong++; } }
    check(washed > 0 && !wrong, 'something washes up at the cove after a gale, and only then');
    s.coast.wash = { t: s.t, k: 'timber', got: 0 }; reset(L);
    const c = s.cash;
    check(L.act('coastWash').ok && s.cash === c + 250 && !L.act('coastWash').ok, 'once fetched, it is gone');
    L.endSeason(); s.pend = [];
    s.coast.wash = { t: s.t - 1, k: 'timber', got: 0 };
    check(L.can('coastWash') === 'Not just now.', 'and if it is not fetched, somebody else has it');
    // A message in a bottle.
    L.queue('coastBottle', { who: 'Alice', addr: '3 Fore Street, Polgarrow', year: 1980, line: 'I want to be a vet.' });
    const ev = L.event();
    check(ev && clean(ev.text) && L.choose(1).ok, 'a message in a bottle can be read and kept');
  }

  // ---- the Sandcastle Cup ----
  {
    const L = fresh(), s = L.s;
    s.t = 0; reset(L);
    check(L.can('coastCastle') === 'Not just now.', 'the Sandcastle Cup is only in summer');
    s.t = 1; reset(L); s.st.craft = 80;
    const c = s.cash;
    const r = L.act('coastCastle', 1);
    check(r.ok && s.coast.castle.last === L.year && !L.act('coastCastle', 1).ok, 'one entry a year');
    s.t = 5; reset(L);
    check(L.act('coastCastle', 1).ok, 'and again the next summer');
    check(s.coast.castle.wins >= 1 && s.cash > c && s.ach.coastCastle, 'a fine castle by a good hand wins the cup');
    const P = fresh(); P.s.t = 1; reset(P); P.s.st.craft = 10;
    let wins = 0;
    for (let y = 0; y < 30; y++) { P.s.t = 1 + 4 * y; reset(P); P.act('coastCastle', 0); wins += P.s.coast.castle.wins ? 1 : 0; }
    check(wins < 15, 'a castle that falls down does not usually win');
  }

  // ---- the lifeboat ----
  {
    const L = fresh(), s = L.s;
    s.st.fitness = 20; reset(L);
    check(/Fitness 25/.test(L.can('coastJoin')), 'the lifeboat wants Fitness 25');
    s.st.fitness = 40;
    check(L.act('coastJoin').ok && s.coast.lb && !L.coastCrew() && L.coastOnBooks(), 'joining makes you a trainee');
    check(L.can('coastJoin') === 'Not just now.', 'and you cannot join twice');
    for (let i = 0; i < 4; i++) { reset(L); check(L.act('coastTrain').ok && !L.act('coastTrain').ok, 'training, once a season'); }
    check(L.coastCrew() && s.coast.lb.rank === 1 && s.coast.lb.stand <= 60, 'four sessions and you are crew');
    // The pagers go far more in a gale than on a fair day.
    let storm = 0, fair = 0, ns = 0, nf = 0;
    const X = new Life(JSON.parse(JSON.stringify(s)));
    for (let i = 0; i < 300; i++) {
      X.s.pend = []; X.s.age = 30;
      X.endSeason();
      const shout = X.s.pend.some((p) => p.id === 'coastShout');
      if (X.s.wx === 'storm') { ns++; storm += shout ? 1 : 0; } else if (X.s.wx === 'fair') { nf++; fair += shout ? 1 : 0; }
      X.coastStand(5); X.s.coast.lb.act = X.s.t;
    }
    check(ns && nf && storm / ns > 0.4 && fair / nf < 0.25, `the pagers go in gales (${storm}/${ns}) more than in fair weather (${fair}/${nf})`);
    // A shout.
    reset(L);
    L.queue('coastShout', 'coaster');
    const ev = L.event();
    check(ev && ev.opts.length === 3 && ev.opts[0].chance > 0 && ev.opts[1].chance > 0 && ev.opts[0].chance < ev.opts[1].chance + 0.5, 'a shout: the bold way, the careful way, or not at all');
    const t = s.time, st = s.coast.lb.stand, r = L.choose(1);
    check(r.ok && s.time === t - 1 && s.coast.lb.calls === 1 && s.coast.lb.log.length === 1 && s.coast.lb.stand > st, 'going takes time, and Quinn notices');
    L.queue('coastShout', 'dog');
    const st2 = s.coast.lb.stand;
    L.choose(2);
    check(s.coast.lb.stand < st2 && s.coast.lb.miss === 1 && s.coast.lb.calls === 1, 'not going, she notices too');
    // Sea work helps; so does a new lifeboat.
    const o = L.coastShoutOdds('coaster', true);
    s.gifts.lifeboat = 'Somebody';
    check(L.coastShoutOdds('coaster', true) > o, 'a new lifeboat makes the bold way safer');
    // Medals.
    s.coast.lb.stand = 90; s.st.fitness = 100;
    let medal = false;
    for (let i = 0; i < 40 && !medal; i++) { reset(L); L.queue('coastShout', 'coaster'); L.choose(0); if (L.event() && L.event().id === 'coastMedal') medal = true; else s.pend = []; }
    check(medal, 'a bold rescue in a big shout can win a medal');
    check(L.choose(1).ok && s.coast.lb.medal === 1 && s.ach.coastMedal, 'and a medal is a trophy');
    // Promotion comes from the sea, not the classroom.
    check(s.coast.lb.rank === 1 || s.coast.lb.calls >= 6, 'Helm wants six shouts at least');
    for (let i = 0; i < 12 && s.coast.lb.rank < 2; i++) { reset(L); L.queue('coastShout', 'swimmer'); L.choose(1); s.pend = []; }
    check(s.coast.lb.rank >= 2 && s.coast.lb.calls >= 6, 'enough good shouts make you Helm');
    // A shout waiting for someone who has left the crew goes away.
    L.queue('coastShout', 'dog');
    L.act('coastQuit');
    check(!L.coastCrew() && !L.event(), 'stepping down takes you off the pager at once');
    check(/back in a hurry/.test(L.can('coastJoin')), 'and Quinn does not take you back in a hurry');
    for (let i = 0; i < 8; i++) { L.endSeason(); s.pend = []; }
    s.st.fitness = 60; s.age = 40; reset(L);
    check(L.act('coastJoin').ok && L.coastCrew(), 'but she does in the end, as crew still');
    s.age = 65; L.endSeason(); s.pend = [];
    check(s.coast.lb.done != null && !L.coastCrew() && L.can('coastJoin') === 'Not just now.', 'at 65 you are stood down, with thanks');
    // Lifeboat Day.
    const D = fresh(); D.s.st.fitness = 40; D.act('coastJoin');
    D.s.t = 1; D.queue('coastDay');
    check(D.event() && D.choose(0).ok, 'Lifeboat Day');
  }

  // ---- the Merrow's leads say what they need, and a player who tries follows them all in years, not decades ----
  {
    const L = fresh({ seed: 21 }), s = L.s;
    s.cash = 1e5; reset(L);
    L.act('coastStone'); L.choose(0);
    const m = s.coast.m;
    for (const key of Object.keys(LEADS)) {
      const need = L.coastLeadNeeds(key);
      check(need.steps.length >= 1 && need.steps.every((st) => st.t && /[a-z]/.test(st.t) && !/undefined|NaN/.test(st.t) && st.ok === false), `the notebook says what ${key} needs, and that you do not have it yet`);
    }
    check(/harbour/.test(L.coastLeadNeeds('marlow').next) && /reading room/.test(L.coastLeadNeeds('paper').next) && L.coastLeadNeeds('register').next === null && L.coastLeadNeeds('quinn').any, 'and what to do about it now');
    s.f.marlow = 1; s.coast.reads = 3;
    check(L.coastLeadNeeds('marlow').steps[0].ok && L.coastLeadNeeds('paper').steps[0].ok && /0 of 3/.test(L.coastLeadNeeds('paper').steps[1].t), 'and ticks off what you have done');
    s.items.boat = 1; s.n.fish = 30;
    check(L.coastTrusted() && L.coastLeadNeeds('quinn').steps[1].ok, 'a skipper with a boat of her own and a good many fish landed is one Quinn knows');
    delete s.items.boat; s.n.fish = 0;
    // A player who tries: chats to Marlow, reads at the library, joins the lifeboat, looks in at Mr Pym's, goes into the caves.
    const years = [];
    for (const seed of [31, 32, 33, 34, 35, 36]) {
      const P = fresh({ seed, bg: 'athlete' }), p = P.s;
      p.cash = 2e5; reset(P);
      P.act('coastStone'); P.choose(0);
      const pm = p.coast.m;
      let t = 0;
      for (; t < 60 && Object.keys(pm.clues).length < 7; t++) {
        reset(P);
        const go = (id, x) => { const r = P.act(id, x); let ev, n = 0; while ((ev = P.event()) && n++ < 10) P.choose(ev.opts.findIndex((o) => !o.why)); return r.ok; };
        if ((p.f.marlow || 0) < 1) go('marlow'); else go('coastPint');
        if (!P.coastReader()) go('readingRoom'); else go('coastArchive');
        go('coastRegister');
        if (P.coastChartUp()) go('coastChart');
        if (!p.coast.lb) go('coastJoin'); else go('coastTrain');
        go('coastQuinn');
        go('coastCaves', 0.6);
        p.cash = 2e5; p.health = 90;
        P.endSeason();
        let ev, n = 0; while ((ev = P.event()) && n++ < 10) P.choose(ev.opts.findIndex((o) => !o.why));
      }
      years.push(t / 4);
    }
    years.sort((a, b) => a - b);
    check(years[years.length - 1] <= 10 && years[0] >= 2, `a player who tries follows all seven leads in two to ten years (${years.join(', ')})`);
  }

  // ---- the Merrow, start to finish ----
  {
    const L = fresh(), s = L.s;
    s.cash = 1e6; s.t = 0; reset(L);
    check(L.can('coastPint') === 'Not just now.' && L.can('coastArchive') === 'Not just now.' && L.can('coastDig', 'hob'), 'no leads before the story has caught you');
    check(L.act('coastStone').ok && L.event().id === 'coastLegend', 'the stone on Gorse Head tells the story');
    L.choose(1);
    check(!L.coastOn() && L.can('coastStone') === null, 'which you may walk away from');
    L.act('coastStone'); L.choose(0);
    const m = s.coast.m;
    check(L.coastOn() && m.on === s.t && L.can('coastStone') === 'Not just now.', 'or start a notebook');
    // Old Marlow: in winter, once he knows you.
    check(/strangers/.test(L.can('coastPint')), 'Marlow will not talk to a stranger');
    s.f.marlow = 1;
    check(/winter/.test(L.can('coastPint')), 'nor about the Merrow, except in winter');
    s.t = 3; reset(L);
    check(L.act('coastPint').ok && !L.act('coastPint').ok && m.pints === 1 && !m.clues.marlow, 'one evening of the story at a time');
    for (const n of [2, 3]) { s.t = 3 + 4 * (n - 1); reset(L); L.act('coastPint'); }
    check(m.clues.marlow != null && L.can('coastPint') === 'Not just now.', 'three winters, and Marlow has told you everything');
    // The archives: Miss Achterberg wants to know you.
    s.st.smarts = 20; reset(L);
    check(/Miss Achterberg/.test(L.can('coastArchive')), 'the archives are for readers Miss Achterberg knows');
    for (let i = 0; i < 3; i++) { reset(L); L.act('readingRoom'); }
    check(s.coast.reads === 3 && !L.can('coastArchive'), 'three sittings in the reading room, and you are one');
    check(/name and a date/.test(L.can('coastRegister')), 'the burial register wants a name and a date');
    let sittings = 0;
    while (m.clues.archive == null && sittings < 10) { reset(L); L.act('coastArchive'); sittings++; }
    check(m.clues.paper != null && m.clues.archive != null && sittings >= 4 && sittings <= 8, `the archives take years (${sittings} seasons)`);
    reset(L);
    check(L.act('coastRegister').ok && m.clues.register != null, 'and then the register gives up its note');
    // The chart turns up at Mr Pym’s, now and then.
    let shown = 0;
    const P = new Life(JSON.parse(JSON.stringify(s)));
    for (let i = 0; i < 80; i++) { P.endSeason(); P.s.pend = []; if (P.s.coast.m.chart && P.s.coast.m.chart.t === P.s.t) shown++; }
    check(shown >= 3 && shown <= 25, `the chart is in Mr Pym’s window now and then (${shown} seasons in 80)`);
    m.chart = { t: s.t, ask: 700 }; reset(L);
    const c0 = s.cash;
    check(L.act('coastChart').ok && s.cash === c0 - 700 && m.clues.chart != null && L.can('coastChart') === 'Not just now.', 'buying the chart');
    // Quinn: crew only.
    check(/crew/.test(L.can('coastQuinn')), 'Quinn keeps her tables for her crew');
    s.job = { c: 'sea', r: 3, n: 0, perf: 50, raise: 0 };
    check(L.coastTrusted(), 'and for a skipper');
    s.job = null;
    s.coast.lb = { at: 0, train: 4, rank: 1, stand: 55, calls: 3, saved: 5, medal: 0, bigs: 0, miss: 0, log: [], act: s.t, left: null, done: null };
    check(L.act('coastQuinn').ok && m.clues.quinn != null, 'and gives them to one she trusts');
    check(fits(m, Object.keys(m.clues)).join() === m.ans, 'five leads are enough to know where it lies');
    // A wrong guess costs, and a year’s wait.
    const wrong = Object.keys(SITES).find((id) => id !== m.ans && L.coastDigHow(id) === 'dig');
    reset(L);
    const c1 = s.cash, k1 = s.karma, cost = L.coastDigCost(wrong);
    const r = L.act('coastDig', wrong);
    check(r.ok && clean(r.text) && s.cash === c1 - cost && L.coastDigCost(wrong) > cost && m.dug[wrong] != null && m.x[wrong] && !m.found, `a dig in the wrong place (${siteSaid(wrong)}) finds nothing`);
    check(/permit/.test(L.can('coastDig', m.ans)) && /already/.test(L.can('coastDig', wrong)), 'and then a year before the next permit, and never the same place twice');
    {
      // A second wrong guess: a longer wait still, and dearer.
      const Q = new Life(JSON.parse(JSON.stringify(s)));
      for (let i = 0; i < 4; i++) { Q.endSeason(); Q.s.pend = []; }
      const other = Object.keys(SITES).find((id) => id !== m.ans && id !== wrong && Q.coastDigHow(id) === 'dig' && !Q.can('coastDig', id));
      if (other) { reset(Q); Q.act('coastDig', other); check(Q.coastDigWait() === 8 && Q.coastDigCost(other) > cost, 'every wrong guess makes the next permit dearer and longer coming'); }
    }
    check(s.karma <= k1 && L.gazette().items.some((it) => /Hole of the week/.test(it.h)), 'and the Gazette enjoys it');
    // The right place, in the right conditions.
    const how = L.coastDigHow(m.ans);
    for (let i = 0; i < 4; i++) { L.endSeason(); s.pend = []; }
    while (L.season !== (how === 'tide' ? 2 : 1)) s.t++;
    s.wx = 'fair'; s.st.fitness = 60; reset(L);
    if (m.ans === 'grave') check(L.coastClues() >= 4, 'the grave needs four leads');
    const r2 = L.act('coastDig', m.ans);
    check(r2.ok && m.found != null && L.event() && L.event().id === 'coastHoard', `the right place: ${siteSaid(m.ans)}`);
    check(L.gazette().lead.h.includes('Merrow') && s.ach.coastMerrow, 'the front page, and a trophy');
    // Three endings, each with what follows.
    const worth = CARGO[m.cargo].worth;
    const end = (i) => { const E = new Life(JSON.parse(JSON.stringify(s))); const before = E.s.cash + E.s.bank - E.s.debt, k = E.s.karma, mood = E.moodBase(); E.choose(i); return { E, got: E.s.cash + E.s.bank - E.s.debt - before, k: E.s.karma - k, mood: E.moodBase() - mood }; };
    const keep = end(0), mus = end(1), town = end(2);
    check(keep.got === worth && keep.k < 0 && keep.E.s.coast.m.end === 'keep', 'sold: all of it, and the town thinks less of you');
    check(mus.got === Math.round(worth * 0.1 / 10) * 10 && mus.k > 0 && mus.mood >= 3 && mus.E.s.ach.coastShared && !mus.E.can('coastMuseum'), 'the museum: a reward, a good name, a room of your own to visit, and a lasting glow');
    check(town.got === Math.round(worth * 0.4 / 10) * 10 && town.k > mus.k && town.E.coastShoutOdds('coaster', true) >= L.coastShoutOdds('coaster', true), 'shared: some of it, the best name in town, and a better-kept lifeboat');
    check(!keep.E.event() && keep.E.s.log.some((e) => e.k === 'big' && /Merrow/.test(e.t)), 'and a big day in the journal');
    // Sold: someone will come asking.
    const K = keep.E;
    let claim = false;
    for (let i = 0; i < 12 && !claim; i++) { K.endSeason(); const p = K.s.pend.find((q) => q.id === 'coastClaim'); if (p) { claim = true; K.s.pend = [p]; } else K.s.pend = []; }
    const kc = K.s.cash + K.s.bank - K.s.debt;
    check(claim && K.choose(0).ok && K.s.cash + K.s.bank - K.s.debt === kc - Math.round(worth * 0.2 / 10) * 10, 'a descendant of the owner comes asking, and is paid off');
    check(K.epitaph().some((t) => /Merrow/.test(t)) && K.epitaph().every((t) => /[.]$/.test(t) && !/undefined|\s\s/.test(t)), 'the obituary remembers the Merrow');
    check(!K.can('coastDig', m.ans) === false && /secret/.test(K.can('coastDig', m.ans)), 'and nobody finds it twice');
  }

  // ---- the man with the podcast ----
  {
    const L = fresh(), s = L.s, m = L.coastMerrow();
    m.on = 0; m.clues = { marlow: 0, paper: 0 };
    const x = L.coastRivalSite();
    check(x && x !== m.ans && !m.searched.includes(x), 'Darren Pike digs somewhere it is not');
    L.queue('coastRival', x);
    L.choose(2);
    check(m.rival === x && m.x[x] && /Pike/.test(L.can('coastDig', x)), 'and so you know it is not there');
  }

  // ---- chance cards ----
  {
    const L = fresh(), s = L.s;
    s.coast.cove = 1; s.wx = 'storm';
    for (const id of ['coastWreck', 'coastSeal']) { s.t = 2; L.queue(id); const ev = L.event(); check(ev && clean(ev.text) && L.choose(ev.opts.length - 1).ok, `${id}: a card that can be answered`); }
  }
}

// For the random players: digging, ruling out, and the games played well and badly.
export function moves(L) {
  // (Cut off now and then, not every season.)
  const out = [['coastCaves', L.s.t % 4 ? 1 : 0.05], ['coastCastle', L.s.t % 8 ? 0.95 : 0.2]];
  if (L.coastHunting()) for (const id of Object.keys(SITES)) out.push(['coastDig', id], ['coastCross', id]);
  if (L.s.t % 17 === 5) out.push(['coastQuit']);
  return out;
}
