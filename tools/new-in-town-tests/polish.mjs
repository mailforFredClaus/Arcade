// Polish after the third playtest: the same cards over and over in a long life, heirs who
// replayed the parent's town, favours that blocked a story for decades, traits that missed
// long commitments, the book club nobody could keep up with, clubs that dropped you without a
// word, Sal's men among the choir, and the seams in the text (a Chief Surgeon on her own
// waiting list, a deputy mayor made redundant, the mayor's name, a porter told to stitch).
import { EVENTS } from '../../games/new-in-town/js/events.js';
import { STORIES } from '../../games/new-in-town/js/careers.js';
import { CAREERS, GIFTS, TROPHIES, PLACES, jobGame, an, lowJob } from '../../games/new-in-town/js/data.js';
import { SHOPS, PREMISES } from '../../games/new-in-town/js/wants-lib.js';
import { BOOKS, CLUB_READS } from '../../games/new-in-town/js/clubs.js';
import { FOLK_IDS, FAV_NUDGE, FAV_LAPSE } from '../../games/new-in-town/js/folk.js';
import { FAM_ONCE } from '../../games/new-in-town/js/chapters.js';

const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const BAD = /undefined|NaN|\[object|\s\s|\.\./;
const text = (t) => (Array.isArray(t) ? t.join(' ') : String(t));

export default function ({ check, fresh, Life }) {
  // A season goes by: the cards that came are noted, and put aside.
  const turn = (L, keep = 100) => { const s = L.s; s.health = Math.max(s.health, keep); const r = L.endSeason(); const ids = s.pend.map((q) => q.id); s.pend = []; s.time = L.timeMax(); s.use = {}; return { ids, news: (r && r.news) || [] }; };
  const kid = (L, o) => { const p = L.makePerson({ kind: 'child', single: false, bond: 80, ...o }); L.s.people.push(p); return p; };
  const heirOf = (L, o = {}) => {
    const nx = L.chapNextLife(0);
    const H = Life.create({ seed: 31, name: nx.name || 'Heir', sex: nx.sex || 'f', look: nx.look, gen: nx.gen, inherit: nx.inherit, parent: nx.parent, raised: nx.st, gifts: nx.gifts, sibs: nx.sibs || [], dreams: [], ...o });
    H.chapBegin(JSON.parse(JSON.stringify(nx.carry)), []);
    return H;
  };
  // Answers the card at the front with the option whose words match (or the first).
  const answer = (L, re) => { const ev = L.event(); if (!ev) return null; const i = re ? Math.max(0, ev.opts.findIndex((o) => re.test(o.t))) : 0; return { ev, r: L.choose(i) }; };

  // ---- the draw: a card seen many times comes up less often ----
  {
    const L = fresh({ seed: 21 });
    L.s.age = 40; L.s.cash = 50000; L.s.t = 40; L.s.home = 'flat';
    const draws = (seen) => {
      const n = {};
      for (let i = 0; i < 500; i++) { L.s.cd = {}; L.s.seen = { ...seen }; L.s.pend = []; L.s.rng = 7000 + i * 13; L.drawEvent(); const q = L.s.pend[0]; if (q) n[q.id] = (n[q.id] || 0) + 1; }
      return n;
    };
    const base = draws({}), top = Object.keys(base).filter((id) => !EV[id].once).sort((a, b) => base[b] - base[a])[0], damped = draws({ [top]: 8 });
    check(base[top] >= 10 && (damped[top] || 0) <= base[top] * 0.45 && (damped[top] || 0) > 0, `a card seen eight times comes up far less often, but still can (${top}: ${base[top]} then ${damped[top] || 0} in 500)`);
    L.s.cd = {}; L.s.seen = { [top]: 3 };
    for (let i = 0; i < 400 && !(L.s.pend[0] && L.s.pend[0].id === top); i++) { L.s.pend = []; L.s.cd = {}; L.s.rng = 300 + i; L.drawEvent(); }
    check(L.s.seen[top] === 4, 'and each showing is counted');
    check(EVENTS.filter((e) => e.w).every((e) => e.once || e.cd == null || e.cd >= 2), 'every card that can come again has a cooldown of its own, or the usual six years');
  }

  // ---- friends who ask things: not twenty pianos, and none at seventy-seven ----
  {
    const ask = (age, fAge, seed) => {
      const L = fresh({ seed }), s = L.s;
      s.age = age; s.cash = 1e6; s.home = 'cottage';
      for (let i = 0; i < 10; i++) L.meet({ kind: 'friend', age: fAge, bond: 70 });
      const n = {};
      for (let i = 0; i < 64; i++) { for (const id of turn(L).ids) n[id] = (n[id] || 0) + 1; for (const p of L.friends()) p.bond = 70; }
      return n;
    };
    const young = [3, 4, 5].map((seed) => ask(30, 30, seed)), old = ask(77, 78, 3);
    const most = (k) => Math.max(...young.map((n) => n[k] || 0));
    check(young.some((n) => n.wantsMoving) && most('wantsMoving') <= 3, `ten friends move house, and you carry furniture now and then, not for all ten (at most ${most('wantsMoving')} in sixteen years)`);
    check(most('wantsSaid') <= 2 && most('wantsNight') <= 3 && most('wantsLoan') + 0 <= 4, `nor do all ten fall out with you, ring at three in the morning or want a loan (${most('wantsSaid')}, ${most('wantsNight')}, ${most('wantsLoan')})`);
    check(!old.wantsMoving, 'and nobody asks a seventy-seven-year-old to lift a piano');
    const P = fresh(), f = P.meet({ kind: 'friend', bond: 70 });
    P.queue('wantsMoving', { p: f.id, big: 'a chest freezer' });
    const ev = P.event();
    check(ev.title === 'There is a chest freezer' && /chest freezer/.test(text(ev.text)) && !BAD.test(text(ev.text)), 'and it is not always a piano');
    P.s.pend = []; P.queue('wantsMoving', { p: f.id });
    check(P.event().title === 'There is a piano', 'though an old save’s card still is');
    // The little loan in events.js and the friend's loan in wants.js keep out of each other's way.
    const Q = fresh(); Q.s.cash = 5000; Q.meet({ kind: 'friend', bond: 60 });
    check(EV.loan.when(Q) && EV.loan.title !== 'Could you possibly...?', 'a friend short this month has a card of its own');
    Q.s.wants.kindT = { loan: Q.s.t };
    check(!EV.loan.when(Q), 'and not hard on the heels of another loan');
  }

  // ---- names that recur: the shop, the bakery ----
  {
    check(Object.values(SHOPS).every((k) => k.signs.length >= 4 && k.signs.includes(k.sign)) && PREMISES.length >= 4, 'a partner’s shop can be called many things, in many places');
    const signs = new Set(), where = new Set();
    for (let seed = 1; seed <= 12; seed++) {
      const L = fresh({ seed }), s = L.s;
      s.home = 'cottage';
      const p = L.meet({ kind: 'spouse', trait: 'kind', age: 30, single: false }); p.live = true;
      s.wants.p[p.id] = { been: [], since: -20, wed: -16 };
      turn(L);
      const r = s.wants.p[p.id];
      if (r.shop) { signs.add(r.shop.sign); where.add(r.shop.where); }
    }
    check(signs.size >= 3 && where.size >= 3, `not every bakery is called Crumbs, nor in the old chandlery (${[...signs].join(', ')})`);
  }

  // ---- the book club: a book you can read in time, and never the same telling-off ----
  {
    const L = fresh({ seed: 9 }), s = L.s;
    L.act('clubJoin_book');
    const t0 = s.t - (s.t % 2), bk = L.bookOfSeason(t0);
    check(L.bookOfSeason(t0 + 1) === bk && L.bookOfSeason(t0 + 2) !== bk && L.bookNextAt(t0) === t0 + 2, 'the club stays with a book for two seasons');
    const len = BOOKS[bk].len;
    check(2 * 2 >= Math.ceil(len / 2), 'two sittings a season for two seasons gets you at least half of any of them');
    const Half = new Life(JSON.parse(JSON.stringify(s))), Not = new Life(JSON.parse(JSON.stringify(s)));
    Half.s.clubs.book = { id: bk, p: Math.ceil(len / 2), since: s.t, warned: 0 };
    Half.act('clubNight_book'); Not.act('clubNight_book');
    check(Half.clubMem('book').st >= Not.clubMem('book').st + 5, 'half of it read is enough to hold your own');
    check(/half/.test(L.look('clubNight_book').desc), 'and the club says so');
    const said = new Set();
    for (let i = 0; i < 10; i++) { const r = L.act('clubNight_book'); if (r.ok) said.add(r.text.replace(/ You get talking.*$/, '').replace(/ (Became|Moved|Made|Given|Took).*$/, '')); turn(L); }
    check(said.size >= 4 && [...said].every((t) => !BAD.test(t)), `ten evenings without reading the book, and not the same line every time (${said.size} different)`);
    const D = fresh({ seed: 10 }); D.act('clubJoin_choir');
    const drill = new Set();
    for (let i = 0; i < 10; i++) { const r = D.act('clubDrill_choir', 0.7); if (r.ok) drill.add(r.text.replace(/ (Moved|Made|Became).*$/, '')); turn(D); }
    check(drill.size >= 4, `and a practice with the organist reads differently from one week to the next (${drill.size} in ten)`);
  }

  // ---- the library book that was renewed for ever ----
  {
    const L = fresh({ seed: 12 }), s = L.s;
    L.act('bookBorrow', 'harrowdene');
    let cards = 0, news = [];
    for (let i = 0; i < 24; i++) {
      s.cash = 5000;
      const r = turn(L);
      news = news.concat(r.news.map((q) => q.text));
      if (r.ids.includes('clubOverdue')) { cards++; s.pend = [{ id: 'clubOverdue', x: null }]; answer(L, /fine/); }
    }
    check(cards === 2 && !s.clubs.book, `renewed twice, the book goes back and the postcards stop (${cards} postcards)`);
    check(s.log.some((e) => /Miss Achterberg came for The Mill at Harrowdene/.test(e.t)) && news.some((t) => /gone back to the library/.test(t)), 'and you are told so');
  }

  // ---- a club that lets you go says so ----
  {
    const L = fresh({ seed: 14 }), s = L.s;
    L.act('clubJoin_choir');
    // (A member of some standing: a brand-new one who never comes is simply let go at three seasons.)
    L.clubMem('choir').st = 60;
    let cards = 0, news = [];
    for (let i = 0; i < 40 && L.clubMem('choir'); i++) {
      const r = turn(L);
      news = news.concat(r.news.map((q) => q.text));
      if (r.ids.includes('clubMissYou')) { cards++; s.pend = [{ id: 'clubMissYou', x: 'choir' }]; const a = answer(L, /back/); check(a && !BAD.test(text(a.ev.text)), 'the card from the club reads properly'); }
    }
    check(!L.clubMem('choir') && cards >= 1 && cards <= 2, `stay away and, after a card or two (${cards}), the choir lets you go`);
    check(s.log.some((e) => /^Dropped from St Brigid’s Choir/.test(e.t)) && news.some((t) => /has let you go/.test(t)), 'in so many words, in the journal and the news');
    L.act('clubJoin_choir');
    check(L.clubMem('choir').warned >= 1, 'and joining again straight away, they remember the cards they sent');
    // A new member who never came at all: let go, and told so.
    const Q = fresh({ seed: 14 });
    Q.act('clubJoin_quiz');
    let told = [];
    for (let i = 0; i < 8 && Q.clubMem('quiz'); i++) told = told.concat(turn(Q).news.map((q) => q.text));
    check(!Q.clubMem('quiz') && told.some((t) => /has let you go/.test(t)), 'and a new member who never came is told plainly too');
  }

  // ---- favours: remembered, then let go ----
  {
    const L = fresh({ seed: 15 }), s = L.s;
    L.folkChat('hollis'); s.folk.p.hollis.f = 20;
    L.folkAsk('hollis', 1, 'tin');
    check(L.folkFavours()[0].asked === 'asked this season', 'a favour says when it was asked');
    const left = [];
    for (let i = 0; i < FAV_LAPSE + 1; i++) { const r = turn(L); left.push(...r.ids); if (i === FAV_NUDGE) check(s.log.some((e) => /asked after the favour/.test(e.t)) && /years? ago/.test(L.folkFavours()[0].asked), `after two years, the vicar asks after it (${L.folkFavours()[0].asked})`); }
    check(left.includes('fkLapse'), 'after four, she lets it go');
    s.pend = [{ id: 'fkLapse', x: { fid: 'tin' } }];
    const a = answer(L, /sorry/);
    check(a && !BAD.test(text(a.ev.text)) && /Rattle the roof tin/.test(text(a.ev.text)), `gently (${a && text(a.ev.text)})`);
    check(!L.folkFavOf('tin') && s.folk.p.hollis.stage === 1 && s.folk.lapsed === 1 && !L.folkFav('hollis'), 'and her story moves on without it');
    s.folk.p.hollis.f = 40; s.folk.p.hollis.at = -99; s.folk.p.hollis.off = 0;
    check(L.folkNext('hollis') === 'fk_hollis2', 'to the next chapter, when you call');
    // A favour with a date on it is still let slip the old way; and an old save's favour from long ago lapses at once.
    const O = fresh({ seed: 16 });
    O.folkChat('hollis');
    O.s.folk.fav.push({ id: 'tin', n: 1, at: -60, due: null, base: null });
    check(turn(O).ids.includes('fkLapse'), 'a favour sixty seasons old, in an old save, is let go at the next turn of the season');
    // Saying no, again and again: they ask less often.
    const N = fresh({ seed: 17 });
    N.folkChat('hollis');
    N.folkNo('hollis', ''); const one = N.s.folk.p.hollis.off - N.s.t;
    N.folkNo('hollis', ''); const two = N.s.folk.p.hollis.off - N.s.t;
    check(one === 4 && two === 8, 'and each no puts the next asking further off');
    check(L.folkStory('hollis')[0].said === 'Somebody else saw to it, in the end.', 'a chapter let go is not told as if you had done it');
    // Three times no to the same chapter, and she finds somebody else; what it would have brought is not yours.
    const R = fresh({ seed: 17 }), rp = R.s.folk.p.hollis;
    R.folkChat('hollis'); Object.assign(rp, { stage: 1, f: 80 });
    R.folkNo('hollis', ''); R.folkNo('hollis', '');
    const third = R.folkNo('hollis', 'She goes herself.');
    check(rp.stage === 2 && rp.skip[2] && /last time she will ask/.test(third) && !R.folkHas('honey') && R.s.log.some((e) => /found somebody else/.test(e.t)), 'say no three times and the story moves on without you, and without the honey');
  }

  // ---- traits from long commitments ----
  {
    const years = (setup, each, trait) => {
      const L = fresh({ seed: 18 }), s = L.s;
      s.cash = 100000;
      setup(L);
      for (let t = 0; t < 40; t++) { each(L); turn(L); if (L.soulHas(trait)) return t / 4; }
      return null;
    };
    const choir = years((L) => L.act('clubJoin_choir'), (L) => L.act('clubNight_choir'), 'churchgoer');
    const book = years((L) => L.act('clubJoin_book'), (L) => L.act('clubNight_book'), 'bookish');
    const crew = years(() => {}, (L) => { L.s.job = { c: 'crew', r: 2, n: 0, perf: 60, raise: 0 }; }, 'daredevil');
    const drink = years(() => {}, (L) => { L.s.habit.drink = 50; }, 'nightowl');
    const bets = years(() => {}, (L) => { L.s.flutter.h = 50; }, 'daredevil');
    check(choir != null && choir <= 5, `years in the choir make you a churchgoer (after ${choir} years)`);
    check(book != null && book <= 5, `years in the book club make you bookish (${book})`);
    check(crew != null && crew <= 6 && drink != null && drink <= 6 && bets != null && bets <= 6, `years on Sal’s books, in the bottle, at the tables (${crew}, ${drink}, ${bets})`);
    check(choir >= 1, 'though not overnight');
    const L = fresh({ seed: 19 });
    L.act('clubJoin_choir'); L.s.soul.has.churchgoer = 0; L.die('old age');
    check(L.epitaph().some((t) => /sang in the choir at St Brigid’s/.test(t)) && !L.epitaph().some((t) => /louder than the choir/.test(t)), 'and a choir member is not said to have sung louder than the choir');
  }

  // ---- the people you meet: rarely Sal's men ----
  {
    const L = fresh({ seed: 20 });
    let crew = 0;
    for (let i = 0; i < 600; i++) if (L.makePerson().job === 'crew') crew++;
    check(crew > 0 && crew <= 18, `a stranger is rarely in Sal’s crew (${crew} in 600)`);
    check(Array.from({ length: 200 }, () => L.makePerson({ club: 'choir' })).every((p) => p.job !== 'crew'), 'and nobody met at choir practice is');
    L.meet({ kind: 'friend', job: 'crew', bond: 50 });
    check(Array.from({ length: 300 }, () => L.makePerson()).every((p) => p.job !== 'crew'), 'and a respectable life with one such friend already makes no more');
    const R = fresh({ seed: 20 }); R.s.n.crimes = 12;
    let low = 0;
    for (let i = 0; i < 600; i++) if (R.makePerson().job === 'crew') low++;
    check(low > crew, `those who keep low company meet more of it (${low})`);
  }

  // ---- heirs: the family's town, and the town's family ----
  {
    const L = fresh({ sex: 'f', name: 'Nell Hartley', seed: 22 }), s = L.s;
    s.age = 79; s.cash = 200000;
    Object.assign(s.folk.p.hollis, { met: 2, f: 80, stage: 3, seen: s.t });
    Object.assign(s.folk.p.betty, { met: 2, f: 60, stage: 1, shut: 1, seen: s.t });
    Object.assign(s.folk.p.windle, { met: 2, f: 70, stage: 5, seen: s.t });
    Object.assign(s.folk.p.marlow, { met: 2, f: 50, stage: 3, seen: s.t }); s.f.marlow = 3;
    s.seen.stray1 = 1; s.f.stray = 3; s.seen.motorBarn = 1; s.seen.cafe = 1;
    s.chap.old.adv = { age: 69, said: 'went up in a hot-air balloon over the Regatta' };
    kid(L, { name: 'Dev Hartley', sex: 'm', age: 50, job: 'law' });
    check(L.folkHas('field'), 'Tom Windle made the bottom field over to her');
    L.die('old age');
    const H = heirOf(L), h = H.s;
    check(H.chapHow() === 'home' && h.age === 50, 'her son, fifty, carries on at home');
    check(FOLK_IDS.filter((id) => id !== 'parg').every((id) => h.folk.p[id].met != null && h.folk.p[id].f >= 10), 'born here, he knows every one of the townsfolk, and they know him');
    check(H.look('fkChat_hollis').title.startsWith('Chat with') && h.folk.p.hollis.f >= 20 && h.folk.p.hollis.f <= 45, 'the vicar who buried his mother needs no introduction, and is a friend, though not the friend she was to his mother');
    check(h.folk.p.hollis.stage === 3 && h.folk.p.hollis.inh === 3 && H.folkNext('hollis') !== 'fk_hollis1', 'her story goes on from where it had got to, not from the start');
    check(H.folkPlace('betty') === 'church', 'Betty’s café is still gone: she does the teas in the church hall');
    check(h.folk.p.windle.stage === 5 && !H.folkHas('field') && !TROPHIES.folkStory.test(H), 'the field was his mother’s, and the whole story was hers to hear');
    check(h.f.marlow === 3 && !h.pend.some((q) => /^marlow/.test(q.id)), 'old Marlow is an old friend, not a stranger with nets');
    check(FAM_ONCE.includes('stray1') && h.seen.stray1 && h.seen.cafe && !h.seen.whale, 'the brown dog from the quay, and Betty’s closing, do not happen to the town twice');
    check(H.chapFamWho('motorBarn') === 'your mum', 'the family remembers who had the car out of Tom Windle’s barn');
    // (The car under the hay: Tom remembers whose it was.)
    const barn = text(EV.motorBarn.text(H, EV.motorBarn.ctx(H)));
    check(/Your mum had the last one out of my barn/.test(barn) && !BAD.test(barn), `and Tom Windle remembers the last car out of his barn (${barn.slice(0, 80)})`);
    // The balloon, as his mother did.
    h.age = 72; h.health = 90; h.cash = 5000; h.pend = [{ id: 'chapAdventure', x: null }];
    const a = answer(H, /balloon/);
    check(a && a.r.ok && /You think of your mum, who did the same at 69/.test(a.r.text), 'up in a balloon, as his mother was before him');
    H.die('old age');
    const ep = H.epitaph();
    check(ep.some((t) => /went up in a hot-air balloon over the Regatta, as his mother had at 69/.test(t)) && !ep.some((t) => /one suitcase/.test(t)), `and the Gazette does not print the same line about him as about her (${ep.find((t) => /balloon/.test(t))})`);
    // His first vote is not his first; and the hostel was never his.
    const V = heirOf(L);
    let poll = null;
    for (let i = 0; i < 20 && !poll; i++) { const r = turn(V); if (r.ids.includes('anPoll')) { V.s.pend = [{ id: 'anPoll', x: null }]; poll = V.event(); } }
    check(poll && !/Your first vote/.test(text(poll.text)) && /since you were eighteen/.test(text(poll.text)), `polling day, for one who has voted here for thirty years (${poll && text(poll.text).slice(0, 60)})`);
    const hostel = STORIES.politics.ch.find((c) => c.title === 'The hostel'), k = { M: { name: 'Councillor Ruth Penrose', first: 'Ruth' } };
    check(!/where you slept your first nights/.test(hostel.text(V, k)) && /where you slept your first nights/.test(hostel.text(fresh(), k)), 'nor does the council’s hostel remember him sleeping there');
    check(/new in town/.test(EV.birthday100.opts[0].run(fresh())) && !/new in town/.test(EV.birthday100.opts[0].run(V)), 'and at a hundred he does not claim to have been new in town');
  }

  // ---- the seams ----
  {
    // A Chief Surgeon does not join her own waiting list.
    const D = fresh({ sex: 'f', seed: 23 });
    D.s.age = 70; D.s.job = { c: 'medicine', r: 5, n: 0, perf: 60, raise: 0 }; D.s.worked.medicine = 5;
    D.s.pend = [{ id: 'chapHip', x: null }];
    const hip = D.event();
    check(!hip.opts.some((o) => o.t === 'Go on the waiting list') && hip.opts.some((o) => /Wait your turn/.test(o.t)) && /down the corridor/.test(text(hip.text)), 'the Chief Surgeon is not sent a number in the post by her own hospital');
    const P = fresh({ seed: 23 }); P.s.age = 70; P.s.pend = [{ id: 'chapHip', x: null }];
    check(P.event().opts.some((o) => o.t === 'Go on the waiting list'), 'everybody else is');
    // Restructuring is for firms.
    const C = fresh(); C.s.t = 20;
    C.s.job = { c: 'politics', r: 3, n: 0, perf: 50, raise: 0 };
    const deputy = EV.cuts.when(C);
    C.s.job = { c: 'retail', r: 1, n: 0, perf: 50, raise: 0 };
    check(!deputy && EV.cuts.when(C), 'a memo about synergy goes to a shop, not to the deputy mayor');
    // The mayor's name is whoever holds the chain.
    const M = fresh(); M.s.annals.mayor = { k: 'c9', name: 'Sam Singh', sex: 'm', age: 50, at: 0, since: 0, plat: 'steady' };
    const tk = EVENTS.find((e) => e.id === 'motorTicket').text;
    check(/Mayor Sam Singh’s new wardens/.test(tk(M)) && /Mayor Pennington’s new wardens/.test(tk(fresh())), 'the parking wardens are the sitting mayor’s');
    check(!/Pennington/.test(text(EV.mktPath.text)), 'and Tom Windle’s footpath is the council’s doing, whoever the mayor is');
    // A porter steers beds; a surgeon stitches.
    check(/beds/.test(jobGame('medicine', 0).title) && jobGame('medicine', 4).title === 'Do the stitching yourself' && jobGame('police', 0).title !== jobGame('police', 3).title && jobGame('law', 0).title === jobGame('law', 4).title, 'a shift done by hand fits the rung');
    const W = fresh(); W.s.job = { c: 'medicine', r: 0, n: 0, perf: 50, raise: 0 }; W.s.time = 6;
    const porter = W.look('workPlay');
    const shift = W.act('workPlay', 1);
    check(/beds/.test(porter.title) && shift.ok && !/stitch/i.test(shift.text), `a porter is not told to do the stitching (${porter.title})`);
    check(an(lowJob(CAREERS.tech.rungs[0].title)) === 'an IT support assistant', 'and nobody is “an IT helpdesk”');
    // No sleep, and no work to go to.
    const N = fresh(), pal = N.meet({ kind: 'friend', bond: 60 });
    N.s.pend = [{ id: 'wantsNight', x: { p: pal.id, why: 'The dog has gone.' } }];
    const night = answer(N, /Go round now/);
    check(night && !/go to work/.test(night.r.text), 'out all night with no job to go to, you do not go to work on no sleep');
    check(!/grandparents/.test(GIFTS.pier.blurb), 'the pier was not shut in the grandparents’ day of somebody who has none here');
    // A student loan survives bankruptcy, and it is said so.
    const B = fresh(); B.s.sloan = 8000; B.s.debt = 1e7;
    B.bailiffs();
    const bust = B.event();
    check(bust && bust.id === 'bust' && /student loan/.test(text(bust.text)) && B.s.log.some((e) => /student loan/.test(e.t)) && B.s.sloan > 0, 'bankrupt, the student loan is the one debt left, and you are told why');
    // Putting things in order, in proportion.
    const rich = fresh(); rich.s.age = 70; rich.s.bank = 2000000;
    for (let i = 0; i < 3; i++) kid(rich, { age: 40 });
    rich.s.pend = [{ id: 'will', x: null }];
    const will = rich.event(), poor = fresh(); poor.s.age = 70; poor.s.cash = 30000; kid(poor, { age: 40 }); poor.s.pend = [{ id: 'will', x: null }];
    const pw = poor.event();
    check(will.opts[0].cost === 60000 && will.opts[1].cost === 39000 && pw.opts[0].cost === 10000 && pw.opts[1].cost === 3000, `the solicitor suggests what fits the money (${will.opts[0].cost}, ${will.opts[1].cost}; ${pw.opts[0].cost}, ${pw.opts[1].cost})`);
    const kids = rich.kids();
    rich.choose(1);
    check(kids.every((k) => k.purse === 13000), 'and what each child is given is theirs, and counted for duty like any gift');
  }

  // ---- the obituary tells the truth ----
  {
    const L = fresh({ sex: 'f', seed: 24 }), s = L.s;
    s.age = 80;
    const ann = kid(L, { name: 'Ann Vale', sex: 'f', age: 50, job: 'medicine' }), ben = kid(L, { name: 'Ben Vale', sex: 'm', age: 47, job: 'retail' });
    s.wants.p[ann.id] = { been: [], dream: 1, hope: ['a doctor', 'medicine'] };
    s.wants.p[ben.id] = { been: [], dream: 1, hope: ['a footballer', 'sports'] };
    s.gave.wing = 1; s.gifts.wing = 1;
    s.careers.st.medicine = { gaz: '{He} once turned down a whole new wing for St Wren’s rather than let a rich man jump the queue.' };
    s.worked.medicine = 4;
    s.annals.n.votes = 8;
    L.die('old age');
    const ep = L.epitaph();
    check(ep.some((t) => t === 'Of her children, Ann grew up to do exactly what she said she would at six.') && !ep.some((t) => /Ben grew up/.test(t)), `of her children, only the one who did is said to have done what she said at six (${ep.find((t) => /at six/.test(t))})`);
    check(ep.some((t) => /turned down a rich man’s new wing for St Wren’s .* and later paid for one herself\./.test(t)) && ep.some((t) => /The town owes her a wing of St Wren’s/.test(t)), 'the wing she turned down and the wing she gave are both true at once');
    check(ep.some((t) => /voted in 8 elections/.test(t)) && !ep.some((t) => /never missed an election/.test(t)), 'eight votes in sixty years is not never missing one');
    check(ep.every((t) => /[.]$/.test(t) && !BAD.test(t)), 'and it reads properly');
  }

  // ---- prison, and other things that come round more than once ----
  {
    const G = fresh({ seed: 25 });
    G.jail(12);
    G.s.pend = [{ id: 'parole', x: null }];
    const one = G.event();
    answer(G, /changed/);
    if (G.s.gaol) { G.s.pend = [{ id: 'parole', x: null }]; }
    const two = G.s.gaol ? G.event() : null;
    check(one.title === 'The board will see you now' && (!two || (two.title === 'Before the board again' && text(two.text) !== text(one.text))), 'the parole board remembers you, and so does the card');
    const P = fresh({ seed: 26 }); P.jail(12); P.s.st.craft = 100;
    P.s.pend = [{ id: 'gPoem', x: null }];
    answer(P, /true/);
    P.s.pend = [{ id: 'gPoem', x: null }];
    const again = P.event();
    check(P.s.f.hartley === 2 && again.title === 'The Hartley prize, again' && again.opts.some((o) => /new ones/.test(o.t)), 'the Hartley prize, a second time, knows you won it');
    // Sal's lads: the fifth knock is the last.
    const S = fresh({ seed: 27 }); S.s.shark = 5000; S.s.bank = 2000; S.s.cash = 0;
    S.s.sharkN = 5; S.s.pend = [{ id: 'legbreakers', x: null }];
    const k5 = S.event();
    check(k5.title === 'Sal’s last word' && k5.opts.length === 1, 'the fifth knock is Sal himself, and there is nothing to discuss');
    S.choose(0);
    check(S.s.shark === 0 && S.s.bank === 0 && !S.s.sharkN, 'he takes what there is, and that is the end of it');
    const T = fresh({ seed: 27 }); T.s.shark = 3000; T.s.cash = 1000; T.s.bank = 5000; T.s.sharkN = 1; T.s.pend = [{ id: 'legbreakers', x: null }];
    const r1 = answer(T, /all you have/);
    check(T.s.shark === 0 && T.s.bank === 3000 && /Harbour Bank/.test(r1.r.text), 'and all you have includes your savings: they walk you to the bank');
    // Old Col, a second sentence on.
    const C = fresh({ seed: 29 }); C.jail(8); C.s.heists.lag.foes.col = C.s.t + 40;
    C.s.pend = [{ id: 'lagFoe', x: { k: 'col', n: 1 } }];
    const col1 = text(C.event().text);
    C.s.pend = [{ id: 'lagFoe', x: { k: 'col', n: 2 } }];
    check(col1 !== text(C.event().text) && !BAD.test(text(C.event().text)), 'Big Col, a second time, is not met in the same words');
    // Inside, where the years are long and the cards few: when it has all happened before, less of it happens.
    const quiet = (seen) => { const Q = fresh({ seed: 30 }); Q.jail(40); let n = 0; for (let i = 0; i < 300; i++) { Q.s.cd = {}; Q.s.pend = []; Q.s.seen = { ...seen }; Q.s.rng = 900 + i * 7; Q.drawEvent(); if (Q.s.pend.length) n++; } return n; };
    const fresh0 = quiet({}), stale = quiet(Object.fromEntries(EVENTS.filter((e) => e.gaol).map((e) => [e.id, 12])));
    check(stale < fresh0 * 0.6 && stale > 0, `a long stretch inside is not the same eight cards over and over (${fresh0} cards, then ${stale}, in 300 draws)`);
    // Cards that come round again have other words for it.
    const B = fresh({ seed: 31 }); B.s.seen.bootSale = 1; B.s.pend = [{ id: 'bootSale', x: null }];
    const boot1 = text(B.event().text);
    B.s.seen.bootSale = 2;
    check(/OLD TAT/.test(boot1) && !/OLD TAT\. \$40 THE LOT/.test(text(B.event().text)) && EVENTS.filter((e) => e.again).length >= 8, 'the car boot sale, the second time, is a different Sunday');
    // Old Marlow remembers you made a mess of his nets.
    const O = fresh({ seed: 28 }); O.s.st.craft = 0; O.s.st.fitness = 0;
    O.s.f.marlowTry = 1; O.s.pend = [{ id: 'marlow1', x: null }];
    check(!/Sixty years I have been mending/.test(text(O.event().text)), 'and old Marlow remembers your last try at his nets');
  }

  // ---- long lives: nothing over and over ----
  {
    const INHERENT = new Set(['anPoll', 'date', 'busted', 'inside', 'parole', 'lagGate', 'coastShout', 'grandchild', 'baby', 'wedding', 'chapCross']);
    const shown = {};
    for (const seed of [41, 42, 43]) {
      const L = Life.create({ seed, name: 'Long', sex: seed % 2 ? 'f' : 'm' }), s = L.s, n = {};
      let guard = 0, last = null;
      while (!s.dead && ++guard < 400) {
        for (let k = 0; k < 40; k++) {
          const ev = L.event();
          if (!ev) break;
          if (s.pend[0] !== last) { n[ev.id] = (n[ev.id] || 0) + 1; last = s.pend[0]; }
          const open = ev.opts.map((o, i) => ({ o, i })).filter(({ o }) => !o.why);
          L.choose(open[Math.floor(L.rnd() * open.length)].i);
        }
        if (s.dead) break;
        for (let k = 0; k < 8 && s.time > 0; k++) {
          const opts = [];
          for (const p of Object.keys(PLACES)) for (const a of L.placeActions(p)) if (!a.why && !a.open && !['Vices', 'Light fingers', 'Behave badly', 'Under the pier', 'Work for Sal', 'Sal’s money'].includes(a.sec)) opts.push([a.id, a.x]);
          if (!opts.length) break;
          const [id, x] = opts[Math.floor(L.rnd() * opts.length)];
          L.act(id, x);
          if (L.event()) break;
        }
        if (!L.event()) L.endSeason();
      }
      for (const [id, v] of Object.entries(n)) if (!INHERENT.has(id)) shown[id] = Math.max(shown[id] || 0, v);
    }
    const worst = Object.entries(shown).sort((a, b) => b[1] - a[1]);
    check(worst.length > 20 && worst[0][1] <= 12, `in a long life, no card comes up more than a dozen times (the most: ${worst.slice(0, 4).map(([k, v]) => `${k} ${v}`).join(', ')})`);
    check((shown.wantsMoving || 0) <= 3 && (shown.clubOverdue || 0) <= 4 && (shown.loan || 0) + (shown.wantsLoan || 0) <= 7, 'not the piano, nor the library book, nor a loan, over and over');
  }
}
