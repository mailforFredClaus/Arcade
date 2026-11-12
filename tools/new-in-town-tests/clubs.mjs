// Clubs and societies, and the library's reading list: joining and subs,
// club nights, standing and ranks, drifting away, the big occasion of each
// club's year, the Rovers' cup run and age limit, the trophy cabinet, the
// cards, reading, old saves, and that none of it can be farmed.
import { PLACES, FESTS, TROPHIES, STATS } from '../../games/new-in-town/js/data.js';
import { CLUBS, CLUB_IDS, BOOKS, BOOK_IDS, CLUB_READS, BOOK_KINDS, PLAYS, VETS_AGE, COACH_AGE } from '../../games/new-in-town/js/clubs.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';

export default async function ({ check, fresh, Life, ACTIONS }) {
  const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
  // A life with money and time to spare, standing in a given season.
  const life = (o = {}) => { const L = fresh(o); L.s.cash = 100000; L.s.st.fitness = Math.max(L.s.st.fitness, 30); return L; };
  // (Skipping ahead counts as having turned up to every club meanwhile, so that nobody lapses.)
  const toSeason = (L, q) => { while (L.season !== q) { for (const m of Object.values(L.s.clubs.m)) m.last = L.s.t; L.s.time = 0; L.endSeason(); L.s.pend = []; } L.s.time = L.timeMax(); };
  const next = (L) => { L.endSeason(); L.s.pend = []; L.s.time = L.timeMax(); };
  const clone = (L) => new Life(JSON.parse(JSON.stringify(L.s)));

  // ---- the lists hang together ----
  check(CLUB_IDS.length === 6, 'six clubs');
  for (const [id, c] of Object.entries(CLUBS)) {
    check(PLACES[c.place], `${id}: meets at a real place`);
    check(STATS.includes(c.stat) && STATS.includes(c.also), `${id}: trains real skills`);
    check(c.ranks.length >= 4 && c.parts.length === c.ranks.length && c.opens.length === c.ranks.length && c.up.length === c.ranks.length && c.req.length === c.ranks.length, `${id}: every rank has a part, a reward and a note`);
    check(c.occ.titles.length === c.ranks.length, `${id}: every rank has a title for the occasion`);
    check(c.parts[0] === 0 && c.parts[c.parts.length - 1] === 3 && c.parts.every((p, i) => !i || p >= c.parts[i - 1]), `${id}: parts grow with rank, up to the star of the show`);
    check(c.occ.season >= 0 && c.occ.season <= 3 && c.occ.game && c.drill.game && c.lead.title, `${id}: an occasion in a season, a game, and a job for the top`);
    // (No clash with the festivals: none of them happens at the same place in the same season.)
    check(!(FESTS[c.occ.season].at === c.place), `${id}: its occasion does not share a place and season with ${FESTS[c.occ.season].name}`);
    for (const k of ['clubAbout_', 'clubJoin_', 'clubNight_', 'clubDrill_', 'clubOcc_', 'clubLead_']) check(ACTIONS[k + id], `${id}: has ${k}`);
  }
  check(new Set(CLUB_IDS.map((id) => CLUBS[id].occ.season)).size === 4, 'there is a club occasion in every season of the year');
  check(BOOK_IDS.length >= 30 && Object.values(BOOKS).every((b) => b.t && b.by && BOOK_KINDS[b.kind] && b.len >= 2 && b.len <= 5 && b.blurb && b.done && b.give), 'thirty books, each with an author, a kind, a length and something to leave you with');
  check(Object.values(BOOKS).every((b) => Object.keys(b.give.st || {}).every((k) => STATS.includes(k)) && Object.keys(b.give.sk || {}).every((k) => CLUBS[k])), 'books teach real skills');
  check(BOOK_IDS.filter((id) => BOOKS[id].by === 'Clementine Vane').length === 3, 'Clementine Vane wrote three of them');
  check(CLUB_READS.length >= 20 && !CLUB_READS.some((id) => BOOKS[id].kind === 'practical'), 'the book club reads novels, not manuals');
  check(PLAYS.length >= 8, 'the Players have plays enough for years');
  for (const t of ['clubSilver', 'clubCabinet', 'clubTop', 'clubJoiner', 'clubCup', 'readTen', 'readAll', 'readSecret']) check(TROPHIES[t], `trophy ${t}`);
  for (const id of ['clubMissYou', 'clubOverdue', 'clubVane', 'clubTeamTalk']) check(EV[id] && !EV[id].w, `the rules send for card ${id}`);
  check(EVENTS.filter((e) => e.id.startsWith('club') && e.w).length >= 12, 'a dozen club cards turn up by chance');

  // ---- joining ----
  {
    const L = fresh(), s = L.s;
    check(L.placeActions('church').some((a) => a.id === 'clubJoin_choir') && !L.placeActions('church').some((a) => a.id === 'clubNight_choir'), 'a club night is for members');
    const cash = s.cash;
    const r = L.act('clubJoin_choir');
    check(r.ok && s.cash === cash - CLUBS.choir.fee && s.time === L.timeMax(), 'joining costs the fee and no time');
    check(L.clubMem('choir') && L.clubRankName('choir') === 'a new voice' && !L.placeActions('church').some((a) => a.id === 'clubJoin_choir'), 'you start at the bottom, and only join once');
    check(s.log.some((e) => e.t.includes('Joined St Brigid’s Choir')), 'the journal remembers');
    const W = fresh(); W.s.st.fitness = 12;
    check(W.can('clubJoin_sailing').includes('Fitness'), 'the sailing club wants you able to hang off a dinghy');
    check(!W.can('clubJoin_book') && CLUBS.book.fee === 0, 'the book club is free to join');
  }

  // ---- a club night ----
  {
    const L = life(), s = L.s;
    L.act('clubJoin_rovers');
    const st = L.clubMem('rovers').st, fit = s.st.fitness, time = s.time, cash = s.cash, happy = s.happy;
    const r = L.act('clubNight_rovers');
    const m = L.clubMem('rovers');
    check(r.ok && s.time === time - 2 && s.cash === cash - 10, 'a match takes two blocks and a match fee');
    check(m.st > st && L.clubSkill('rovers') > 3 && s.st.fitness > fit && s.happy > happy && m.n === 1, 'and builds standing, Footwork, Fitness and the mood');
    check(!L.act('clubNight_rovers').ok && L.can('clubNight_rovers').includes('season'), 'once a season');
    // About as good as the other things to do with an evening: no better.
    const J = life(), jf = J.s.st.fitness; J.act('jog'); J.act('jog');
    check(s.st.fitness - fit <= (J.s.st.fitness - jf) + 0.5, 'a match does Fitness no more good than two runs in the park');
    check(s.happy - happy <= 6, 'and it is a lift, not a cure');
  }

  // ---- rising through the ranks, and drifting away ----
  {
    const L = life(), s = L.s;
    L.act('clubJoin_quiz');
    let seasons = 0;
    while (L.clubMem('quiz').r < 3 && seasons < 80) { L.act('clubNight_quiz'); L.act('clubDrill_quiz', 1); next(L); seasons++; }
    check(L.clubMem('quiz').r === 3 && seasons >= 20, `the top of a club takes years of turning up (${seasons} seasons)`);
    check(s.clubs.f.top && s.ach.clubTop && s.log.some((e) => e.t.includes('question setter')), 'and reaching it is a trophy and a milestone');
    check(!L.can('clubLead_quiz'), 'the top rank opens a job of its own');
    const k = s.karma; L.act('clubLead_quiz');
    check(s.karma > k && L.can('clubLead_quiz').includes('year'), 'once a year');
    const night = () => { L.act('clubNight_quiz'); next(L); };
    night(); night(); night();
    check(L.can('clubLead_quiz').includes('year'), 'not again until a year has gone by');
    night();
    check(!L.can('clubLead_quiz'), 'and then it can be done again');
    // Now stay away.
    const before = L.clubMem('quiz').st;
    next(L);
    check(L.clubMem('quiz').st < before && L.clubMem('quiz').miss === 1, 'a season away and your standing slips');
    next(L); next(L);
    check(L.clubMem('quiz').r < 3 || L.clubMem('quiz').st < before - 15, 'stay away and it falls further');
    for (let i = 0; i < 4 && L.clubMem('quiz'); i++) next(L);
    check(!L.clubMem('quiz') && s.clubs.past.quiz.r === 3 && s.log.some((e) => e.t.includes('stopped expecting you')), 'and in the end they stop expecting you');
    L.act('clubJoin_quiz');
    check(L.clubMem('quiz').r === 0 && L.clubMem('quiz').n >= 24 && L.clubSkill('quiz') > 60, 'come back and you start at the bottom, but keep your nights and your skill');
    L.act('clubNight_quiz');
    check(L.clubMem('quiz').r === 0 || L.clubMem('quiz').r === 1, 'and climb back one rank at a time');
  }
  {
    // A card through the door, and a choice.
    const L = life(), s = L.s;
    L.act('clubJoin_book'); L.clubMem('book').st = 50;
    for (let i = 0; i < 4; i++) { L.endSeason(); if (i < 3) s.pend = []; }
    check(s.pend.some((p) => p.id === 'clubMissYou' && p.x === 'book'), 'three seasons away and the club writes');
    while (s.pend.length && s.pend[0].id !== 'clubMissYou') s.pend.shift();
    const ev = L.event();
    check(ev && ev.id === 'clubMissYou', 'the card comes up');
    L.choose(1);
    check(!L.clubMem('book') && s.log.some((e) => e.t.includes('Left The Library Book Club')), 'let it go, and you leave');
    const Q = life();
    Q.act('clubJoin_choir');
    check(Q.act('clubLeave', 'choir').ok && !Q.clubMem('choir') && !Q.act('clubLeave', 'choir').ok, 'you can leave a club whenever you like');
  }

  // ---- subs ----
  {
    const L = life(), s = L.s;
    L.act('clubJoin_sailing');
    const due = () => L.bills().some(([w]) => w.includes('Bay Sailing Club'));
    let seen = [];
    for (let i = 0; i < 9; i++) { if (due()) seen.push(s.t); L.act('clubNight_sailing'); next(L); }
    check(seen.length === 2 && seen[0] === 3 && seen[1] === 7, `a year’s subs, once a year, on the anniversary (seasons ${seen.join(', ')})`);
    s.gaol = { left: 2, total: 2, served: 0, good: 50, rep: 30 };
    check(!L.bills(true).some(([w]) => w.includes('Sailing')), 'no subs from a prison cell');
  }

  // ---- the big occasion ----
  {
    const L = life(), s = L.s;
    L.act('clubJoin_players');
    toSeason(L, 2);
    check(!L.placeActions('theatre').some((a) => a.id === 'clubOcc_players'), 'the summer play is only in summer');
    toSeason(L, 1);
    check(L.placeActions('theatre').some((a) => a.id === 'clubOcc_players'), 'and there it is');
    check(L.clubPart('players') === 0 && L.look('clubOcc_players').time === 1, 'in the chorus there is nothing to play, and it takes one block');
    const r = L.act('clubOcc_players');
    check(r.ok && /chorus/.test(r.text) && !L.placeActions('theatre').some((a) => a.id === 'clubOcc_players'), 'once a year');
    next(L);
    check(!L.placeActions('theatre').some((a) => a.id === 'clubOcc_players'), 'not again this year');
    // A part to play: how the game goes decides it, more than luck.
    const A = life(); A.act('clubJoin_players');
    const m = A.clubMem('players'); m.r = 3; m.st = 70; m.n = 30; A.s.clubs.sk.players = 70;
    toSeason(A, 1);
    check(A.clubPart('players') === 3 && A.look('clubOcc_players').time === 2, 'Desmond’s first choice tops the bill');
    let good = 0, bad = 0, joyGood = 0, joyBad = 0;
    for (let i = 0; i < 40; i++) {
      const G = clone(A), B = clone(A);
      G.s.rng = B.s.rng = 1000 + i * 7919;
      const h0 = G.s.happy;
      G.act('clubOcc_players', 1); B.act('clubOcc_players', 0);
      good += G.s.clubs.cab.length; bad += B.s.clubs.cab.length;
      joyGood += G.s.happy - h0; joyBad += B.s.happy - h0;
    }
    check(good >= 30 && bad <= 6 && joyGood > joyBad, `played well, the summer play is a triumph; played badly, it is not (${good} and ${bad} awards in 40)`);
    const E = clone(A);
    check(E.act('clubOcc_players').ok, 'and it can be done without a game (a fair night)');
    check(!clone(A).act('clubOcc_players', 7).ok && !clone(A).act('clubOcc_players', 'x').ok, 'but not with a nonsense score');
    const W = clone(A); W.s.rng = 1000; W.act('clubOcc_players', 1);
    check(W.s.clubs.cab.length === 1 && W.s.clubs.cab[0].c === 'players' && W.s.ach.clubSilver, 'a win goes in the cabinet, and is a trophy');
    check(W.s.fame > A.s.fame && W.s.fame - A.s.fame < 3, 'and brings a little fame, not a lot');
    // Missing it, with a part to play, is noticed.
    const N = clone(A), st = N.clubMem('players').st;
    N.act('clubNight_players'); N.endSeason();
    const O = clone(A); O.act('clubNight_players'); O.act('clubOcc_players', 0.5); O.endSeason();
    check(N.clubMem('players').st === O.clubMem('players').st || N.clubMem('players').st >= st, 'turning up to rehearsal keeps you in good standing');
    const M = clone(A); M.endSeason();
    const M2 = clone(A); M2.s.clubs.m.players.occ = M2.year; M2.endSeason();
    check(M.clubMem('players').st < M2.clubMem('players').st, 'but missing the play itself costs more than missing a rehearsal');
  }

  // ---- the Rovers: the cup run, and the age limit ----
  {
    const L = life(), s = L.s;
    toSeason(L, 1);
    L.act('clubJoin_rovers');
    const m = L.clubMem('rovers');
    m.r = 3; m.st = 80; s.clubs.sk.rovers = 80; s.st.fitness = 60; s.st.charm = 50;
    let finals = 0, years = 0;
    for (let i = 0; i < 40; i++) {
      if (L.season === 0 && L.clubMem('rovers').cup && L.clubMem('rovers').cup.y === L.year - 1) years++;
      if (!L.can('clubOcc_rovers')) { finals++; L.act('clubOcc_rovers', 1); }
      L.act('clubNight_rovers');
      next(L);
    }
    check(years >= 9 && finals >= 2 && finals < years, `Rovers reach the Coast Cup final some years, not all (${finals} of ${years})`);
    check(s.clubs.cab.some((e) => e.c === 'rovers' && e.name === 'the Coast Cup') && s.ach.clubCup, 'and a final played well is won');
    check(s.log.some((e) => e.t.includes('reached the final')), 'the cup run is in the journal');
    // Forty: the veterans; sixty: the touchline.
    const V = life(); V.act('clubJoin_rovers');
    V.s.age = VETS_AGE - 1; V.s.t = 3; V.endSeason(); V.s.pend = [];
    check(V.clubMem('rovers').mode === 'vets' && V.look('clubNight_rovers').title.includes('veterans'), 'at forty you play for the veterans');
    check(V.clubOcc('rovers').prize === 'the Veterans’ Shield', 'who have their own cup');
    check(!V.can('roversCoach'), 'and you may hang up your boots');
    V.act('roversCoach');
    check(V.clubMem('rovers').mode === 'coach' && V.clubPart('rovers') === -1 && V.look('clubNight_rovers').title.includes('Coach'), 'and coach instead');
    check(!V.can('roversBoots'), 'or pull them back on, under sixty');
    V.s.age = COACH_AGE - 1; V.s.t = 7; V.act('roversBoots'); V.endSeason(); V.s.pend = [];
    check(V.clubMem('rovers').mode === 'coach' && V.can('roversBoots'), 'at sixty it is the touchline for good');
    // A coach picks the team talk.
    const C = clone(V), cm = C.clubMem('rovers');
    toSeason(C, 0); cm.cup = { y: C.year - 1, r: 2, out: false, p: [0, 1] };
    check(C.clubOcc('rovers').open && C.clubOcc('rovers').prize === 'the Coast Cup', 'the coach takes the first team to the final');
    C.act('clubOcc_rovers');
    const ev = C.event();
    check(ev && ev.id === 'clubTeamTalk' && ev.opts.length === 3 && ev.opts.every((o) => o.chance > 0), 'and picks the team talk');
    const n = C.s.clubs.n.occ || 0; C.choose(0);
    check((C.s.clubs.n.occ || 0) === n + 1, 'which settles the final');
    // Joining in the spring, the cup run is over.
    const S = life(); S.act('clubJoin_rovers');
    check(!S.clubOcc('rovers').open && /without you/.test(S.clubCupWord()), 'join in the spring and the cup run has gone on without you');
  }

  // ---- reading ----
  {
    const L = life(), s = L.s;
    check(!L.placeActions('home').some((a) => a.id === 'bookRead'), 'nothing to read until you borrow something');
    check(L.placeActions('library').some((a) => a.id === 'bookList' && a.open === 'readingList'), 'the reading list is at the library');
    let r = L.act('bookBorrow', 'knots');
    check(r.ok && s.clubs.card && /card/.test(r.text) && s.time === L.timeMax(), 'the library card is free, and borrowing takes no time');
    check(!L.act('bookBorrow', 'voice').ok && !L.act('bookBorrow', 'nonsense').ok, 'one book at a time, and a real one');
    const sail = L.clubSkill('sailing'), craft = s.st.craft;
    r = L.act('bookRead');
    check(r.ok && s.clubs.book.p === 1 && s.time === L.timeMax() - 1, 'a sitting takes a block of time');
    check(L.act('bookRead').ok && !s.clubs.book && s.clubs.read.knots, 'a short book is done in two');
    check(L.clubSkill('sailing') >= sail + 5 && s.st.craft > craft, 'and leaves you knowing your knots');
    check(!L.act('bookRead').ok, 'nothing more to read');
    next(L);
    L.act('bookBorrow', 'knots');
    const again = L.clubSkill('sailing');
    L.act('bookRead'); L.act('bookRead');
    check(L.clubSkill('sailing') === again && s.clubs.read.knots.again === 1, 'reading it again is a pleasure, not a lesson');
    next(L);
    L.act('bookBorrow', 'harrowdene'); L.act('bookRead'); L.act('bookRead');
    check(!L.act('bookRead').ok, 'two sittings a season at most');
    L.act('bookReturn');
    check(!s.clubs.book && s.clubs.prog.harrowdene === 2, 'take it back half-read and they keep your place');
    L.act('bookBorrow', 'harrowdene');
    check(s.clubs.book.p === 2, 'and you pick up where you left off');
    // A favourite lifts the mood for good.
    const F = life(), b0 = F.moodBase();
    F.act('bookBorrow', 'coldtea'); F.act('bookRead'); F.act('bookRead');
    check(F.s.clubs.fav === 1 && F.moodBase() === b0 + 1, 'a favourite lifts the mood, season after season');
    // A good night’s sleep, from then on.
    const Z = life(), Y = clone(Z);
    Z.act('bookBorrow', 'sleep'); Z.act('bookRead'); Z.act('bookRead');
    Y.act('bookBorrow', 'talk'); Y.act('bookRead'); Y.act('bookRead');
    Z.s.health = Y.s.health = 60;
    for (let i = 0; i < 4; i++) { Z.s.rng = Y.s.rng = 99 + i; next(Z); next(Y); }
    check(Z.s.health > Y.s.health, 'a book about sleep goes on doing you good');
    // Overdue.
    const O = life();
    O.act('bookBorrow', 'harrowdene');
    for (let i = 0; i < 5; i++) { O.endSeason(); if (i < 4) O.s.pend = []; }
    check(O.s.pend.some((p) => p.id === 'clubOverdue'), 'keep a book a year and the library writes');
    // The book club’s book of the season.
    const B = life();
    B.act('clubJoin_book');
    const bk = B.bookOfSeason();
    check(CLUB_READS.includes(bk) && B.bookOfSeason(B.s.t + 1) !== bk, 'the book club reads a different book each season');
    const Read = clone(B), Not = clone(B);
    Read.s.clubs.read[bk] = { a: 18, t: 0 };
    Read.act('clubNight_book'); Not.act('clubNight_book');
    check(Read.clubMem('book').st > Not.clubMem('book').st + 4 && Read.clubSkill('book') > Not.clubSkill('book'), 'having read it makes for a better evening');
    // Whoever chooses the books, chooses them.
    const m = B.clubMem('book'); m.r = 3;
    const pick = CLUB_READS.find((id) => id !== B.bookOfSeason(B.s.t + 1));
    check(!B.can('bookChoose', pick) && B.can('bookChoose', 'knots'), 'the one who chooses picks novels, not manuals');
    B.act('bookChoose', pick);
    check(B.bookOfSeason(B.s.t + 1) === pick && B.can('bookChoose', pick), 'next season’s book is yours, once a season');
    // Miss Achterberg’s secret.
    const V = life();
    let sent = 0;
    for (const id of ['vane1', 'vane2', 'vane3']) { V.act('bookBorrow', id); V.act('bookRead'); V.act('bookRead'); next(V); V.act('bookRead'); sent += V.s.pend.filter((p) => p.id === 'clubVane').length; next(V); }
    check(sent === 1, 'read all three Clementine Vanes and you notice something, once');
    // Reading it all.
    const All = life();
    for (const id of BOOK_IDS) { All.s.clubs.book = { id, p: BOOKS[id].len - 1, since: All.s.t, warned: 0 }; All.s.time = 6; All.s.use = {}; All.act('bookRead'); All.s.pend = []; }
    check(All.booksRead() === BOOK_IDS.length && All.s.ach.readTen && All.s.ach.readAll, 'every book read is two trophies');
    check(STATS.every((k) => All.s.st[k] <= 100) && All.s.clubs.fav <= 12, 'and nothing runs over');
  }

  // ---- cards ----
  {
    for (const e of EVENTS.filter((q) => q.id.startsWith('club'))) {
      // Each one can be answered in every way without trouble, by a member of every club.
      for (let i = 0; i < e.opts.length; i++) {
        const L = life();
        for (const id of CLUB_IDS) { L.act(`clubJoin_${id}`); L.clubMem(id).r = 2; L.clubMem(id).st = 50; }
        L.meet({ club: 'quiz' }); L.meet({ club: 'choir' });
        L.act('bookBorrow', 'vane1');
        // (Each in a season and weather it can happen in.)
        for (const [t, wx] of [[4, 'fair'], [5, 'fair'], [6, 'wet'], [7, 'wet']]) { L.s.t = t; L.s.wx = wx; if (!e.when || e.when(L)) break; }
        const x = e.ctx ? e.ctx(L) : e.id === 'clubMissYou' ? 'choir' : null;
        L.s.pend = [{ id: e.id, x }];
        const v = L.event();
        if (!v) { check(false, `card ${e.id} comes up`); break; }
        const r = L.choose(i);
        check(r.ok && typeof r.text === 'string' && r.text.length > 10 && !/undefined|NaN/.test(r.text), `card ${e.id}: choice ${i} works`);
      }
    }
    const L = life(); L.act('clubJoin_quiz'); L.clubMem('quiz').r = 1;
    toSeason(L, 3);
    check(EV.clubPhone.when(L) && !EV.clubPhone.when(life()), 'the phone in the gents is for the quiz team, in the week of the final');
  }

  // ---- old saves, and the screen’s numbers ----
  {
    const L = life();
    L.act('clubJoin_choir'); L.act('clubNight_choir');
    delete L.s.clubs;
    const R = new Life(JSON.parse(JSON.stringify(L.s)));
    R.s.use = {};
    check(R.s.clubs && R.s.clubs.m && Array.isArray(R.s.clubs.cab) && R.s.clubs.bco >= 0, 'a life saved before the clubs existed opens with room for them');
    check(R.act('clubJoin_choir').ok && R.act('clubNight_choir').ok && R.act('bookBorrow', 'talk').ok, 'and can join one, and borrow a book');
    R.s.time = 0; R.endSeason();
    check(R.s.t === L.s.t + 1, 'and carries on');
    const P = new Life(JSON.parse(JSON.stringify(R.s)));
    check(JSON.stringify(P.s) === JSON.stringify(R.s), 'loading a life changes nothing in it');
    for (const id of CLUB_IDS) {
      const g = R.clubGame(id, 'occ'), d = R.clubGame(id, 'drill');
      check(g.id && g.title && g.icon && g.ease >= 0 && g.ease <= 1 && g.level >= 0 && g.level <= 5 && d.id === CLUBS[id].drill.game, `${id}: the screen knows which game to play`);
    }
  }

  // ---- nothing for nothing ----
  {
    // A year in every club at once, played well, against a year of the plain things.
    const L = life(), s = L.s;
    for (const id of CLUB_IDS) L.act(`clubJoin_${id}`);
    const cash = s.cash + s.bank;
    for (let i = 0; i < 4; i++) { for (const id of CLUB_IDS) { L.act(`clubNight_${id}`); L.act(`clubDrill_${id}`, 1); } L.s.time = 0; next(L); }
    check(s.cash + s.bank < cash, 'clubs cost money; they do not make it');
    // Joining and leaving over and over gets you nothing.
    const J = life(); const before = JSON.stringify([J.s.st, J.s.happy, J.s.fame, J.s.karma]);
    for (let i = 0; i < 10; i++) { J.act('clubJoin_book'); J.act('clubLeave', 'book'); }
    check(JSON.stringify([J.s.st, J.s.fame, J.s.karma]) === JSON.stringify(JSON.parse(before).filter((_, i) => i !== 1)) && J.s.happy <= JSON.parse(before)[1], 'joining and leaving gets you nothing');
    // Drills are once a season too.
    const D = life(); D.act('clubJoin_choir');
    check(D.act('clubDrill_choir', 1).ok && !D.act('clubDrill_choir', 1).ok, 'practice once a season');
    // Borrowing and returning a book gets you nothing.
    const B = life(); const b0 = JSON.stringify(B.s.st);
    for (let i = 0; i < 5; i++) { B.act('bookBorrow', 'talk'); B.act('bookReturn'); }
    check(JSON.stringify(B.s.st) === b0, 'borrowing and returning a book teaches nothing');
  }
}

// For the random players: the things done from a list, not from a place.
export function moves(L) {
  const out = [];
  const c = L.s.clubs;
  if (!c) return out;
  if (!c.book) out.push(['bookBorrow', BOOK_IDS[(L.s.t * 7 + L.s.age) % BOOK_IDS.length]]);
  else if (L.s.t % 6 === 0) out.push(['bookReturn']);
  if (L.s.t % 12 === 0) for (const id of Object.keys(c.m)) out.push(['clubLeave', id]);
  if (L.clubMem('book') && L.clubMem('book').r >= 3) out.push(['bookChoose', CLUB_READS[L.s.t % CLUB_READS.length]]);
  return out;
}
