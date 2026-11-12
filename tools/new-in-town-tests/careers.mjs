// A story for every career (careers.js, careers-tales.js, careers-tales2.js),
// and the gating of the work cards in events.js.
import { STORIES } from '../../games/new-in-town/js/careers.js';
import { CAREERS, TROPHIES } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';

const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const bad = (t) => typeof t !== 'string' || /undefined|NaN|null|\[object|\s\s|\.\.(?!\.)| ,/.test(t);
const ends = (t) => /[.”?’!]$/.test(t);

// Puts a life in a job at a rung, as if it had worked its way there.
function hire(L, c, r) {
  const s = L.s;
  s.job = { c, r, n: 0, perf: 50, raise: 0 };
  s.worked[c] = Math.max(s.worked[c] || 0, r);
  s.careers.job = { c, r };
  s.retired = false;
}
// Answers whatever is waiting: the first choice that can be taken, or the one named.
function clear(L, prefer = {}) {
  let ev, n = 0;
  while ((ev = L.event()) && n++ < 30) {
    const i = prefer[ev.id] != null ? prefer[ev.id] : ev.opts.findIndex((o) => !o.why);
    L.choose(i);
  }
}
// A season gone by with nothing done but the work; only this part's cards are answered.
function turn(L, prefer) {
  L.s.time = 0;
  L.endSeason();
  L.s.pend = L.s.pend.filter((e) => e.id.startsWith('career'));
  clear(L, prefer);
}
const able = (L) => { for (const k of ['smarts', 'fitness', 'charm', 'craft']) L.s.st[k] = 99; L.s.karma = 60; L.s.fame = 90; };

export default function ({ check, fresh, Life, ACTIONS }) {
  // ---- the lists hang together ----
  check(Object.keys(CAREERS).every((c) => STORIES[c]), 'every career has a story, Sal’s crew included');
  for (const [c, tale] of Object.entries(STORIES)) {
    const top = CAREERS[c].rungs.length - 1;
    check(tale.ch.length >= 5 && tale.ch.length <= 6, `${c}: five or six chapters (${tale.ch.length})`);
    check(typeof tale.party === 'string' && /\.$/.test(tale.party) && typeof tale.gift === 'string' && !/\.$/.test(tale.gift), `${c}: a party and a present for the send-off`);
    tale.ch.forEach((ch, i) => {
      check((ch.r || 0) <= top && ch.icon && ch.title && typeof ch.text === 'function' && ch.opts.length >= 2, `${c} chapter ${i}: a proper card, at a rung there is`);
      check(i === 0 || (ch.r || 0) >= (tale.ch[i - 1].r || 0), `${c} chapter ${i}: comes no lower down the ladder than the one before`);
      check(EV[`career_${c}${i}`] && !EV[`career_${c}${i}`].w, `${c} chapter ${i}: a card that is only ever sent for`);
    });
  }
  for (const id of ['careerArc', 'careerSendoff', 'careerPeace', 'careerFast']) check(TROPHIES[id], `trophy ${id}`);
  check(EV.careerSendoff && !EV.careerSendoff.w, 'a send-off card, only ever sent for');
  // Stories differ in shape, not just in names: no two careers share a chapter title.
  const titles = Object.values(STORIES).flatMap((t) => t.ch.map((ch) => (typeof ch.title === 'string' ? ch.title : '')).filter(Boolean));
  check(new Set(titles).size === titles.length, 'no two chapters anywhere have the same title');

  // ---- every story can be walked, every way, and reads properly ----
  {
    let shown = 0, problems = [];
    for (const c of Object.keys(STORIES)) {
      for (let path = 0; path < 14; path++) {
        const L = fresh({ seed: 300 + path * 11 + c.length, sex: path % 2 ? 'f' : 'm' });
        const s = L.s;
        for (const k of ['smarts', 'fitness', 'charm', 'craft']) s.st[k] = 25 + ((path * 17 + k.length * 9) % 72);
        s.cash = 60000; s.age = 24; s.karma = (path % 5) * 10 - 10;
        if (path % 3 === 0) s.people.push(L.makePerson({ kind: 'spouse', bond: 60, live: true, single: false }));
        if (path % 4 === 1) for (const t of ['grafter', 'daredevil', 'nightowl', 'charmer', 'kind', 'joker', 'bookish', 'thrifty', 'hothead']) s.soul.has[t] = 0;
        const tale = STORIES[c];
        for (let i = 0; i < tale.ch.length; i++) {
          const ch = tale.ch[i], top = CAREERS[c].rungs.length - 1;
          hire(L, c, Math.min(top, Math.max(ch.r || 0, s.job ? s.job.r : 0) + (path % 5 === 4 && i >= 4 ? 1 : 0)));
          s.pend = []; s.gaol = null; s.time = 6;
          const st = L.careerStory(c) || { n: 0 };
          // (Now and then the mentor, or the rival, has died by the time a chapter comes.)
          for (const [rec, when] of [[st.mn, path % 7 === 3 && i >= 2], [st.rv, path % 7 === 5 && i >= 3]]) {
            if (rec && when && rec.dead == null) { const p = L.person(rec.id); if (p && p.name === rec.name) L.gone(p); rec.dead = s.t; }
          }
          if (st.n !== i) { problems.push(`${c} ${i}: the story is at ${st.n}`); break; }
          if (!L.careerNext(true)) { problems.push(`${c} ${i}: never sent for`); break; }
          const ev = L.event();
          if (!ev || ev.id !== `career_${c}${i}`) { problems.push(`${c} ${i}: ${ev && ev.id} came instead`); break; }
          shown++;
          if (bad(ev.title) || bad(ev.text) || !ends(ev.text)) problems.push(`${c} ${i}: ${ev.text}`);
          const open = ev.opts.map((o, j) => ({ o, j })).filter(({ o }) => !o.why);
          if (ev.opts.length < 2 || !open.length) problems.push(`${c} ${i}: ${ev.opts.length} choices`);
          for (const { o } of open) if (bad(o.t)) problems.push(`${c} ${i}: ${o.t}`);
          const pick = open[(path * 31 + i * 7) % open.length];
          const r = L.choose(pick.j);
          if (!r.ok || bad(r.text) || !ends(r.text)) problems.push(`${c} ${i}: ${pick.o.t} -> ${r.text}`);
          if (!Number.isFinite(s.cash) || !Number.isFinite(s.karma) || s.happy > 100 || s.st.fitness > 100) problems.push(`${c} ${i}: a number went wrong`);
          if (L.careerStory(c).n !== i + 1) problems.push(`${c} ${i}: the story did not move on`);
          s.pend = []; s.gaol = null;
          if (!s.job) break;
        }
      }
    }
    check(!problems.length, `every chapter of every story reads properly, whichever way it goes (${problems.slice(0, 3).join(' | ')})`);
    check(shown > 600, `and a great many were walked through (${shown})`);
  }

  // ---- the people in it: somebody who taught you, somebody who wanted your job ----
  {
    const L = fresh({ seed: 21 });
    hire(L, 'kitchen', 0);
    L.careerNext(true);
    const ev = L.event();
    check(ev && ev.id === 'career_kitchen0' && /Chef/.test(ev.text), 'the first chapter of the kitchen’s story is about the pass, and Chef');
    L.choose(1); // tell Chef: the mentor thinks well of you, the rival does not
    const M = L.careerView('kitchen', 'm'), R = L.careerView('kitchen', 'r');
    check(M.here && M.p.kind === 'friend' && M.p.job === 'kitchen' && M.age > L.s.age + 10, 'the one who taught you is a friend now, older, and in the trade');
    check(R.here && R.p.kind === 'enemy' && R.p.job === 'kitchen' && R.v < 0, 'the one you told on has taken against you');
    check(L.s.people.filter((p) => p.name === R.name).length === 1, 'and is only one person');
    // Making it up later on, in the story, makes a friend of them.
    const card = EV.career_kitchen3, x = { c: 'kitchen', n: 3 };
    L.careerStory('kitchen').n = 3; hire(L, 'kitchen', 3);
    const opt = card.opts.find((o) => typeof o.t === 'function' && /shake/.test(o.t(L, x)));
    check(opt && opt.show(L, x), 'a rival who bears a grudge can be met halfway');
    opt.run(L, x, true);
    const R2 = L.careerView('kitchen', 'r');
    check(R2.here && R2.p.kind === 'friend' && R2.v > 0 && L.s.careers.n.peace === 1, 'and once it is made up, they are a friend, and there is a trophy in it');
    L.after();
    check(L.s.ach.careerPeace, 'Old rivals');
    // Somebody from a story who dies (soul.js sees to the funeral) is remembered as gone.
    const m = L.careerView('kitchen', 'm');
    L.s.pend = [{ id: 'soulFriendGone', x: m.p.id }];
    m.p.age = 80;
    clear(L);
    check(!L.person(m.p.id) && L.careerView('kitchen', 'm').dead, 'a mentor who dies is mourned, and the story knows');
    L.careerStory('kitchen').n = 5; hire(L, 'kitchen', 4); L.s.pend = [];
    L.careerNext(true);
    const book = L.event();
    check(book && /daughter/.test(book.text) && !/long retired/.test(book.text), 'and the last chapter is told without them');
  }

  // ---- the pace of it: a chapter every couple of years, as you rise ----
  {
    const L = fresh({ seed: 33 });
    able(L);
    L.s.cash = 200000;
    L.act('apply', 'police');
    const seen = [];
    for (let q = 0; q < 110 && L.s.job; q++) {
      L.s.time = 6;
      // (When the boss wants to watch, the shift is done by hand.)
      for (let i = 0; i < 2; i++) L.act(L.playDue() ? 'workPlay' : 'work', L.playDue() ? 0.7 : undefined);
      L.s.time = 0;
      L.endSeason();
      L.s.pend = L.s.pend.filter((e) => e.id.startsWith('career'));
      for (const e of L.s.pend) seen.push([e.id, L.s.t]);
      clear(L);
    }
    const ids = seen.map(([id]) => id);
    check(ids.length >= 5 && ids.length === new Set(ids).size, `fifteen-odd years in the police bring the whole story, each chapter once (${ids.length})`);
    check(seen.every(([, t], i) => i === 0 || t - seen[i - 1][1] >= 4), 'and never two chapters close together');
    check(seen[0][1] >= 2 && seen[ids.length - 1][1] >= 40, `spread over the years (from season ${seen[0][1]} to ${seen[ids.length - 1][1]})`);
    check(L.s.careers.n.arcs === 1 || L.careerStory('police').n >= 5, 'and it gets told to the end');
  }

  // ---- never in prison, never without the job, and stale when the job goes ----
  {
    const L = fresh({ seed: 41 });
    hire(L, 'police', 2);
    L.s.gaol = { left: 2, good: 50, rep: 10, dig: 0 };
    check(!L.careerNext(true), 'no chapter comes to a cell');
    L.s.gaol = null; L.s.job = null;
    check(!L.careerNext(true), 'nor to somebody between jobs');
    hire(L, 'police', 2);
    check(L.careerNext(true) && L.event(), 'but to a constable it does');
    L.s.job = null;
    check(!L.event(), 'and if the job goes before it is read, so does the chapter');
    hire(L, 'police', 2);
    L.careerNext(true);
    L.s.gaol = { left: 2, good: 50, rep: 10, dig: 0 };
    check(!L.event(), 'and so it does if you are taken inside first');
    L.s.gaol = null; L.s.pend = [];
    // Chapters wait for the rung.
    const T = fresh({ seed: 42 });
    hire(T, 'medicine', 0);
    T.careerStory('medicine') || T.careerNext(true);
    clear(T);
    T.careerStory('medicine').n = 3;
    check(!T.careerNext(true), 'the death on the table waits for a doctor, not a porter');
    hire(T, 'medicine', 3);
    check(T.careerNext(true), 'and comes to a junior doctor');
  }

  // ---- a bad choice can cost you the job, and the right to come back ----
  {
    const L = fresh({ seed: 51 });
    hire(L, 'kitchen', 1);
    L.careerNext(true); clear(L, { career_kitchen0: 2 });
    const st = L.careerStory('kitchen');
    check(st.n === 1, 'one chapter told');
    L.s.pend = [{ id: 'career_kitchen1', x: { c: 'kitchen', n: 1 } }];
    const opt = EV.career_kitchen1.opts.find((o) => o.t === 'Do as Chef says');
    L.s.pend.shift();
    const said = opt.run(L, { c: 'kitchen', n: 1 }, false);
    check(!L.s.job && /out/.test(said) && L.s.log.some((e) => /Sacked/.test(e.t)), 'serving the bad fish, and losing, is the sack');
    const why = L.can('apply', 'kitchen');
    check(why && /Gull/.test(why) && /year/.test(why), `and the Gull will not have you back for a while (${why})`);
    check(!L.can('apply', 'retail'), 'though the High Street will');
    L.s.t += 7;
    check(!L.can('apply', 'kitchen'), 'and in time, the Gull will too');
    // Struck off for good.
    const D = fresh({ seed: 52 });
    hire(D, 'medicine', 3);
    const ds = D.careerNext(true) && D.careerStory('medicine');
    D.s.pend = [];
    ds.n = 4; ds.f.op = 'tidy';
    const hold = EV.career_medicine4.opts.find((o) => o.t === 'Hold your line');
    check(hold.show(D, { c: 'medicine', n: 4 }), 'a doctor who tidied the notes may hold the line at the inquiry');
    hold.run(D, { c: 'medicine', n: 4 }, false);
    D.s.t += 400;
    check(!D.s.job && /for good/.test(D.can('apply', 'medicine') || ''), 'and if it fails, is struck off for good');
    D.after();
    const words = D.epitaph();
    check(words.some((t) => /struck off/.test(t)) && words.every((t) => !bad(t) && /\.$/.test(t)), 'which the Gazette remembers');
  }

  // ---- a chance at the top job ----
  {
    const L = fresh({ seed: 61 });
    able(L);
    hire(L, 'medicine', 4);
    L.careerNext(true); L.s.pend = [];
    const st = L.careerStory('medicine'); st.n = 5;
    const take = EV.career_medicine5.opts.find((o) => o.t === 'Take the scanner');
    take.run(L, { c: 'medicine', n: 5 }, true);
    L.after();
    check(L.s.job.r === 5 && L.s.f.top && L.s.ach.careerFast && L.s.careers.n.fast === 1, 'the scanner makes a doctor Chief Surgeon on the spot, if ready for it');
    check(L.s.careers.n.arcs === 1 && L.s.ach.careerArc, 'and the story is told to the end');
    const N = fresh({ seed: 62 });
    hire(N, 'medicine', 4);
    N.careerNext(true); N.s.pend = [];
    N.careerStory('medicine').n = 5;
    take.run(N, { c: 'medicine', n: 5 }, true);
    check(N.s.job.r === 4 && N.s.job.n >= 8, 'but not if not: then it is a long step towards it');
    // Politics: the chain of office still needs the election.
    const P = fresh({ seed: 63 });
    able(P);
    hire(P, 'politics', 3);
    P.careerNext(true); P.s.pend = [];
    P.careerStory('politics').n = 4;
    check(P.s.job.r === 3 && !P.s.f.elected, 'nobody becomes mayor except by the election');
  }

  // ---- the send-off ----
  {
    const L = fresh({ seed: 71 });
    able(L);
    L.s.age = 66;
    hire(L, 'sea', 4);
    L.careerNext(true); clear(L);
    L.s.time = 6;
    check(L.act('retire').ok, 'a captain of 66 retires');
    const ev = L.event();
    check(ev && ev.id === 'careerSendoff' && /Captain/.test(ev.text) && /barometer/.test(ev.text) && !bad(ev.text), 'and there is a send-off, with a present');
    const thank = ev.opts.findIndex((o) => /who taught you/.test(o.t));
    check(thank >= 0, 'where you can thank the one who taught you');
    const r = L.choose(thank);
    check(r.ok && !bad(r.text) && L.s.log.some((e) => /Retired as Captain: a party, a speech and a brass barometer/.test(e.t)) && L.careerStory('sea').gift, 'which goes in the journal, with the present');
    L.after();
    check(L.s.ach.careerSendoff, 'A proper send-off');
    check(/clock/.test(L.can('apply', 'sea') || ''), 'and there is no going back to the job you retired from');
    check(!L.can('apply', 'retail'), 'though another job will have you');
    L.act('apply', 'retail');
    L.s.time = 6;
    L.act('retire');
    check(!L.s.pend.some((e) => e.id === 'careerSendoff'), 'no send-off from a job you never rose in');
    // Retiring twice from the same career is not possible, and so is no second party.
    check(L.s.careers.n.sendoffs === 1, 'one party, one present');
  }

  // ---- an old save, from before the stories ----
  {
    const L = fresh({ seed: 81 });
    L.act('apply', 'kitchen');
    delete L.s.careers;
    const R = new Life(JSON.parse(JSON.stringify(L.s)));
    check(R.s.careers && R.s.careers.job && R.s.careers.job.c === 'kitchen' && R.s.careers.n.arcs === 0, 'a life saved before the stories picks them up, job and all');
    let ok = true;
    try { for (let i = 0; i < 30; i++) { R.s.time = 6; R.act(R.playDue() ? 'workPlay' : 'work'); turn(R); } } catch (e) { ok = false; console.log(e); }
    check(ok && R.careerStory('kitchen').q >= 25, 'and the seasons in the job count from then on');
    const H = fresh({ seed: 82 });
    delete H.s.careers.n.peace; delete H.s.careers.bar;
    const H2 = new Life(JSON.parse(JSON.stringify(H.s)));
    check(H2.s.careers.n.peace === 0 && H2.s.careers.bar, 'and a half-filled one is filled in');
  }

  // ---- the cards about work, at the ends of a working life (events.js) ----
  {
    const L = fresh({ seed: 91 });
    const work = ['credit', 'overtime', 'mistake', 'party', 'cuts', 'burnout'];
    L.s.happy = 10; L.s.t = 40;
    check(work.every((id) => !EV[id].when(L)), 'no workplace card for somebody with no job');
    hire(L, 'retail', 2);
    check(work.every((id) => EV[id].when(L)), 'every one of them for somebody with one');
    hire(L, 'crew', 2);
    check(work.every((id) => !EV[id].when(L)), 'and none of them for Sal’s crew, who have no staff party');
    hire(L, 'retail', 2);
    L.s.gaol = { left: 2, good: 50, rep: 10, dig: 0 };
    check(work.every((id) => !EV[id].when(L)) && !EV.strike.when(L) && !EV.hurt.when(L), 'nor in a cell');
    L.s.gaol = null;
    L.s.job = null; L.s.retired = true; L.s.age = 75;
    // A retired life: the play and the in-laws do not talk of work.
    const kid = L.makePerson({ kind: 'child', age: 7, bond: 50 }); L.s.people.push(kid);
    check(EV.play.opts[1].t(L) === 'Something else comes first', 'a parent with no job does not put work first');
    const sp = L.makePerson({ kind: 'spouse', age: 74, bond: 60, live: true, single: false }); L.s.people.push(sp);
    check(!EV.inlaws.when(L), 'nobody’s in-laws come to stay when they would be a hundred');
    sp.age = 40;
    check(EV.inlaws.when(L) && EV.inlaws.opts[1].t(L) === 'Find a lot to do elsewhere', 'though younger ones do, and there is no work to hide at');
    L.s.age = 76;
    check(!EV.jury.when(L), 'and nobody is called for jury service past 75');
    L.s.age = 50;
    check(EV.jury.when(L), 'though at 50 they are');
    // Little visitors, while some of the grandchildren are little.
    L.s.f.grand = 1;
    const g = L.makePerson({ kind: 'grandchild', age: 30, bond: 50 }); L.s.people.push(g);
    check(!EV.visit.when(L), 'grown-up grandchildren are not little visitors');
    g.age = 6;
    check(EV.visit.when(L), 'small ones are');
    // A partner's parents, for Sunday lunch, only while the partner is young enough to have them.
    sp.kind = 'partner'; sp.age = 70; sp.bond = 60;
    check(!EV.meetFolks.when(L), 'nobody is taken to meet the parents of a seventy-year-old');
    sp.age = 35;
    check(EV.meetFolks.when(L), 'though a thirty-five-year-old’s, yes');
  }

  // ---- nothing to farm ----
  {
    // Each chapter comes once; the send-off once a career; and the story's money is bounded.
    const L = fresh({ seed: 101 });
    able(L);
    hire(L, 'tech', 0);
    const was = L.s.cash;
    for (let i = 0; i < 6; i++) {
      hire(L, 'tech', Math.max(L.s.job ? L.s.job.r : 0, STORIES.tech.ch[i].r));
      L.s.pend = [];
      if (!L.careerNext(true)) break;
      clear(L);
    }
    check(L.careerStory('tech').n === 6 && !L.careerNext(true), 'the whole story once, and then no more');
    check(L.s.cash - was < 250000, `and what it pays is bounded (${L.s.cash - was})`);
    check(ACTIONS.apply && !Object.keys(ACTIONS).some((id) => id.startsWith('career')), 'and it adds no buttons of its own');
    // Selling up, going out on top, walking away from Sal: a fond farewell cannot be had twice.
    const S = fresh({ seed: 102 });
    able(S);
    hire(S, 'finance', 5);
    S.careerNext(true); S.s.pend = [];
    S.careerStory('finance').n = 5;
    S.careerNext(true);
    const sell = S.event().opts.findIndex((o) => o.t === 'Sell');
    check(sell >= 0 && S.choose(sell).ok && !S.s.job, 'the Chair can sell the bank, and go');
    check(/sold the Harbour Bank/.test(S.can('apply', 'finance') || ''), 'and cannot walk straight back in to sell it again');
    const A = fresh({ seed: 103 });
    able(A);
    hire(A, 'sports', 3);
    A.careerNext(true); A.s.pend = [];
    A.careerStory('sports').n = 5;
    A.careerNext(true);
    const out = A.event().opts.findIndex((o) => o.t === 'Go out on top');
    A.choose(out);
    A.s.t += 100;
    check(!A.s.job && /boots, for good/.test(A.can('apply', 'sports') || ''), 'an athlete who goes out on top stays out');
    const C = fresh({ seed: 104 });
    hire(C, 'crew', 3);
    C.s.n.crimes = 40; C.s.karma = -40;
    C.careerNext(true); C.s.pend = [];
    C.careerStory('crew').n = 4;
    C.careerNext(true);
    C.choose(C.event().opts.findIndex((o) => o.t === 'Go straight'));
    check(!C.s.job && C.can('joinCrew') && C.can('errand'), 'and somebody who walked away from Sal is not let back into the back room');
  }

  // ---- what you are like has a say ----
  {
    const L = fresh({ seed: 111 });
    hire(L, 'teaching', 1);
    L.careerNext(true); clear(L);
    L.careerStory('teaching').n = 1;
    L.careerNext(true);
    const without = L.event().opts.map((o) => o.t);
    L.s.soul.has.bookish = 0;
    const withIt = L.event().opts.map((o) => o.t);
    check(withIt.length === without.length + 1 && withIt.some((t) => /^📚 /.test(t)), 'a bookish teacher has a choice the others do not');
    const marked = Object.values(STORIES).flatMap((t) => t.ch.flatMap((ch) => ch.opts.filter((o) => o.show && /^\S+ /.test(typeof o.t === 'string' ? o.t : '') && /trait/.test(String(o.show)))));
    check(marked.length >= 6, `several chapters have choices only for some characters (${marked.length})`);
  }
}
