// Where the parts of the town meet: the will and the next life (chapters.js),
// the people who want things (wants.js), the career stories (careers.js), the
// town's own cards (events.js) and the Gazette (legacy.js and every part's
// lines). Each block here is something that once went wrong between two of them.
import { dutyOn, TEACH_AGE } from '../../games/new-in-town/js/chapters.js';
import { STORIES } from '../../games/new-in-town/js/careers.js';
import { CAREERS, QUESTS } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';
import chaptersUi from '../../games/new-in-town/js/chapters-ui.js';
import wantsUi from '../../games/new-in-town/js/wants-ui.js';

const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const bad = (t) => typeof t !== 'string' || /undefined|NaN|null|\[object|\s\s|\bthe (the|a|an)\b|\ba a\b|\.\.(?!\.)| ,/.test(t);
const kid = (L, o) => { const p = L.makePerson({ kind: 'child', single: false, ...o }); L.s.people.push(p); return p; };
// Answers whatever is waiting: the first choice that can be taken, or the one a card is given.
function clear(L, prefer = {}, seen = []) {
  let ev, n = 0;
  while ((ev = L.event()) && n++ < 40) {
    seen.push(ev);
    let i = prefer[ev.id] != null ? prefer[ev.id] : ev.opts.findIndex((o) => !o.why);
    if (typeof i === 'function') i = i(ev);
    const r = L.choose(i);
    if (!r.ok) throw new Error(`${ev.id}: ${r.why}`);
  }
  return seen;
}
// The next life, begun as game.js begins it.
function next(D, i = 0, seed = 5, dreams = []) {
  const nx = D.chapNextLife(i);
  const L = D.constructor.create({ name: nx.name || 'Cousin', sex: nx.sex || 'f', look: nx.look, gen: nx.gen, inherit: nx.inherit, parent: nx.parent, raised: nx.st, gifts: nx.gifts, sibs: nx.sibs || [], seed, dreams });
  L.chapBegin(nx.carry, dreams);
  return { L, nx };
}
// A screen kit, enough for the sheets to be read as text.
const kitFor = (L) => ({ life: L, esc: (t) => String(t), money: (n) => `$${Math.round(n).toLocaleString('en-US')}`, cashShort: (n) => `$${n}`, an: (t) => `a ${t}`, pick: (label) => `[${label}]`, face: () => '' });
const strip = (h) => h.split(/<[^>]*>/).join(' ').split(/\s+/).join(' ');

export default function ({ check, fresh, Life }) {
  // ---- everything left to a husband or wife still comes down to whoever carries on ----
  {
    const mk = (kids = 1) => {
      const D = fresh({ sex: 'f', name: 'Joan Hale' });
      D.s.age = 86; D.s.bank = 1000000;
      const bert = D.meet({ kind: 'spouse', name: 'Bert Hale', sex: 'm', age: 87, single: false }); bert.live = true;
      const ann = kid(D, { name: 'Ann Hale', sex: 'f', age: 61, bond: 70, job: 'kitchen' });
      for (let i = 1; i < kids; i++) kid(D, { name: `Bob${i} Hale`, sex: 'm', age: 58 - i, bond: 40, job: 'sea' });
      const nico = D.grandchild(ann); nico.age = 32; nico.bond = 60; D.fillPerson(nico);
      return { D, bert, ann, nico };
    };
    const { D, bert, ann, nico } = mk();
    check(D.chapHeir() === nico && D.chapSpouseCan() && D.act('chapWill', { k: 'split', v: 'spouse' }).ok, 'with a grandchild carrying on, everything can still be left to the husband');
    const est = D.chapEstate();
    check(est.toSpouse && est.duty === 0 && est.shares.length === 1 && est.shares[0].p === bert.id && est.via && est.via.p === ann.id && est.via.n === est.left, 'it goes to him free of duty, and the daughter’s part of it is known');
    const ui = chaptersUi(kitFor(D));
    const sheet = strip(ui.sheets.chapWill().body), me = strip(ui.me(D));
    const nn = nico.name.split(' ')[0];
    check(/All to Bert/.test(sheet) && sheet.includes(`Ann’s part ($1,001,500 today) comes down to ${nn} in the next life`) && me.includes(`comes down to ${nn} in the end`),`and the will says so, plainly (${me.match(/The money goes[^.]*\./)})`);
    D.die('old age');
    const c = D.obituary().carry[0];
    check(c.rel.startsWith('grand') && c.parent && c.parent.name === 'Ann Hale' && c.parPurse === est.left && /Ann has \$1,001,500 put by/.test(D.chapStartSaid(c)), `the grandson’s mother holds it for him (${D.chapStartSaid(c)})`);
    const { L, nx } = next(D);
    const mum = L.s.people.find((p) => p.kind === 'parent');
    check(mum && mum.name === 'Ann Hale' && L.s.chap.par && L.s.chap.par.pid === mum.id && L.s.chap.par.purse === est.left && /Mum has \$1,001,500 put by/.test(nx.carry.said), `and in the next life it comes down when she dies (${nx.carry.said})`);
    const before = L.s.cash + L.s.bank;
    L.s.pend = []; L.queue('parentDies', mum.id); L.choose(0);
    check(L.s.cash + L.s.bank - before >= est.left - dutyOn(est.left), 'after duty, then');
    // With a brother too, she has her part of it: "and the children after".
    const two = mk(2);
    two.D.act('chapWill', { k: 'split', v: 'spouse' });
    const e2 = two.D.chapEstate();
    check(e2.via.n === Math.floor(e2.left / 2), 'with two children, the grandson’s mother has half of what comes down');
    // With nobody to carry on, the husband cannot be left it: it goes to the cousin who does.
    const N = fresh({ sex: 'f' });
    N.s.age = 80; N.s.bank = 900000;
    N.meet({ kind: 'spouse', name: 'Len Shaw', sex: 'm', age: 82, single: false });
    check(!N.chapSpouseCan() && /never reach/.test(N.can('chapWill', { k: 'split', v: 'spouse' })), 'with no children or grandchildren, it cannot be left to the husband to pass down');
    N.s.chap.will.split = 'spouse';
    const ne = N.chapEstate();
    check(!ne.toSpouse && ne.shares.length === 1 && ne.shares[0].p === null && ne.shares[0].n === ne.left && ne.left === ne.money - ne.duty, 'and a will that said so before still leaves it to the cousin, after duty');
    check(/whatever is left goes to the cousin/.test(strip(chaptersUi(kitFor(N)).sheets.chapWill().body)), 'the will sheet says so');
    N.die('old age');
    check(N.chapNextLife(0).inherit === ne.left, 'and the cousin has it all');
    // An old will, read before this was so, is not lost on the cousin either.
    const O = fresh(); O.s.age = 80; O.s.bank = 500000;
    const ob = O.meet({ kind: 'spouse', name: 'Pat Dee', sex: 'f', age: 79, single: false });
    O.die('old age');
    O.s.chap.out = { ...O.s.chap.out, toSpouse: true, duty: 0, left: O.s.chap.out.money, shares: [{ p: ob.id, n: O.s.chap.out.money }] };
    check(O.obituary().carry[0].money === O.s.chap.out.money, 'a will read under the old rules still reaches the cousin');
    // A grandchild whose mother and father are gone: the money could never reach them through the husband.
    const G = mk();
    G.D.s.people.splice(G.D.s.people.indexOf(G.ann), 1);
    check(G.D.chapHeir() === G.nico && !G.D.chapSpouseCan() && !G.D.chapEstate().toSpouse, 'nor through a mother who has died');
  }

  // ---- one arrangement for minding the grandchildren at a time ----
  {
    let both = 0, any = 0;
    for (let seed = 1; seed <= 16; seed++) {
      const L = Life.create({ seed, name: 'Gran', sex: 'f', sibs: [] });
      const s = L.s; s.age = 58; s.t = 160; s.cash = 50000; s.quest = QUESTS.length;
      const k = kid(L, { name: 'Ann Hale', sex: 'f', age: 30, bond: 70, job: 'kitchen' });
      L.grandchild(k).age = 0; L.grandchild(k).age = 4;
      for (let i = 0; i < 40 && !s.dead; i++) {
        s.time = 0; s.health = 80; L.endSeason();
        clear(L, { wantsMinding: 0, chapMind: 0 });
        const O = s.chap.old.mind;
        if (s.wants.mind || (O && O.on)) any++;
        if (s.wants.mind && O && O.on) both++;
      }
    }
    check(any > 0 && both === 0, `the grandchildren are minded, but never on two arrangements at once (${both} of ${any} seasons)`);
    const L = fresh(); L.s.age = 60;
    const k = kid(L, { name: 'Ann', sex: 'f', age: 30, bond: 70 });
    const g = L.grandchild(k); g.age = 0;
    L.s.wants.mind = g.id;
    check(!EV.chapMind.when(L) && !EV.chapMind.ok(L, k.id), 'Tuesdays and Thursdays are not asked for while you have the baby on Thursdays');
    L.s.wants.mind = null; L.s.chap.old.mind = { on: true, light: false, t: L.s.t, kid: k.id };
    check(!L.wantsBeats().some((b) => b.id === 'wantsMinding') && !EV.wantsMinding.ok(L, { p: g.id }), 'nor Thursdays while you have them on Tuesdays and Thursdays');
  }

  // ---- an heir’s husband or wife was married to them years ago ----
  {
    const D = fresh({ sex: 'f' });
    D.s.age = 80;
    const ann = kid(D, { name: 'Ann Hale', sex: 'f', age: 48, bond: 70, job: 'kitchen' });
    for (const a of [20, 23]) { const g = D.grandchild(ann); g.age = a; D.fillPerson(g); }
    D.die('old age');
    const { L } = next(D, 0, 99);
    const pt = L.partner(), r = pt && L.wantsRec(pt);
    check(pt && pt.kind === 'spouse' && r && r.wed < 0 && (L.s.t - r.wed) / 4 >= 20 && r.since < r.wed, `she has been married since before the children were born (${r && (L.s.t - r.wed) / 4} years)`);
    const seen = [];
    for (let i = 0; i < 16; i++) { L.s.time = 0; L.s.health = 80; L.endSeason(); clear(L, {}, seen); }
    const said = strip(wantsUi({ esc: (t) => String(t), money: (n) => `$${n}` }).person(L, pt));
    check(/Married (2\d|3\d) years/.test(said), `and her husband’s sheet says how long (${said.match(/Married[^,]*/)})`);
    const ann1 = seen.filter((e) => /^wants(Anniv|Forgot)$/.test(e.id));
    check(ann1.length >= 1 && ann1.every((e) => !/ a year this week| 1 year/.test(e.text)), `no first anniversary for a marriage of twenty years (${ann1.map((e) => e.title).join(', ')})`);
    // Married in the last life, to the one the wedding card named.
    const M = fresh({ sex: 'f' });
    M.s.age = 64; M.s.t = 184;
    const kate = kid(M, { name: 'Kate Hale', sex: 'f', age: 33, bond: 70, job: 'law' });
    M.s.wants.p[kate.id] = { been: [], ms: { wantsChildWed: 1 }, wed: 170, fiance: 'Sam' };
    const lone = kid(M, { name: 'Lou Hale', sex: 'f', age: 35, bond: 20, job: 'law' });
    M.s.wants.p[lone.id] = { been: [], ms: {}, wedRoll: false };
    M.die('old age');
    let same = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const { L: K } = next(M, 0, seed);
      const p = K.partner(), w = p && K.wantsRec(p);
      if (p && p.name.split(' ')[0] === 'Sam' && p.sex === 'm' && w.wed === K.s.t - (184 - 170)) same++;
    }
    check(same === 6, `Kate starts married to Sam, from the wedding in the last life (${same}/6)`);
    const lc = M.obituary().carry.find((q) => q.name === 'Lou');
    check(lc && lc.single && !lc.wed, 'and her sister, who never married, starts single');
    // Thirty years married before the life began: the Gazette knows it, but the trophy is for reaching it.
    const T = fresh({ sex: 'm' });
    T.s.age = 85; T.s.t = 200;
    const tom = kid(T, { name: 'Tom Hale', sex: 'm', age: 56, bond: 70, job: 'sea' });
    T.s.wants.p[tom.id] = { been: [], ms: { wantsChildWed: 1 }, wed: 80, fiance: 'Jo' };
    T.die('old age');
    const { L: J } = next(T, 0, 3);
    for (let i = 0; i < 4; i++) { J.s.time = 0; J.s.health = 80; J.endSeason(); clear(J); }
    check(J.partner() && J.partner().name.startsWith('Jo ') && J.partner().sex === 'f' && J.s.wants.f.silver === 2 && !J.s.ach.wantsSilver && J.s.wants.tales.some((t) => /married to Jo for more than twenty-five/.test(t)), 'thirty years married already: the Gazette will say so, but no silver trophy for it');
  }

  // ---- a career story taken up partway ----
  {
    const D = fresh({ sex: 'f' });
    D.s.age = 80;
    const ann = kid(D, { name: 'Ann Hale', sex: 'f', age: 48, bond: 70, job: 'kitchen' });
    D.grandchild(ann).age = 20;
    D.die('old age');
    const { L } = next(D, 0, 99);
    const st = L.careerStory('kitchen'), j = L.s.job, M = L.careerView('kitchen', 'm');
    check(j && j.r === 4 && st && st.n === 4 && st.from === 4 && M && (M.age >= 66 || M.dead) && L.careerView('kitchen', 'r'), `a head chef of forty-eight starts the kitchen’s story at her own rung, taught by somebody long retired (${M && M.age})`);
    const seen = [];
    for (let i = 0; i < 24 && L.s.job; i++) { L.s.time = 0; L.s.health = 80; L.endSeason(); L.s.pend = L.s.pend.filter((q) => q.id.startsWith('career')); clear(L, {}, seen); }
    const told = seen.filter((e) => e.id.startsWith('career_kitchen')).map((e) => e.id);
    check(told.length >= 1 && !told.includes('career_kitchen0') && told[0] === 'career_kitchen4', `and its first chapter is one for her rung, not her first week (${told.join(', ')})`);
    check(!seen.some((e) => /started the same week as you|cooked there for twenty years/.test(e.text)), 'nobody started the same week as she did');
    check(L.s.careers.n.arcs === 0, 'and a story heard only from its middle is not the whole story, for the trophy');
    // Let in high by a qualification.
    const Q = fresh();
    Q.s.age = 26; Q.s.edu.medicine = { a: 25, g: 1 }; Q.s.edu.nursing = { a: 22, g: 1 }; Q.s.edu.firstaid = { a: 20, g: 1 };
    for (const k of ['smarts', 'fitness', 'charm', 'craft']) Q.s.st[k] = 70;
    Q.s.time = 6;
    const ok = Q.act('apply', 'medicine');
    const qs = Q.careerStory('medicine'), r0 = Q.s.job && Q.s.job.r;
    check(ok.ok && r0 >= 2 && qs && qs.from === STORIES.medicine.ch.findIndex((ch) => (ch.r || 0) >= r0) && qs.mn && qs.rv, `one let in as ${Q.jobTitle()} starts the story there (chapter ${qs && qs.from})`);
    let first = null;
    for (let i = 0; i < 12 && !first; i++) { Q.s.time = 0; Q.s.health = 80; Q.endSeason(); first = Q.s.pend.find((q) => q.id.startsWith('career_')); Q.s.pend = Q.s.pend.filter((q) => q.id.startsWith('career_')); clear(Q); }
    check(first && first.id === `career_medicine${qs.from}`, `and is not long in coming (${first && first.id})`);
    check(Q.careerView('medicine', 'm').here, 'and the one who taught you comes into your life with it');
    // One who starts at the bottom starts at the beginning.
    const B = fresh(); B.s.time = 6;
    B.act('apply', 'retail');
    check(!B.careerStory('retail') || (B.careerStory('retail').n === 0 && !B.careerStory('retail').from), 'one who starts at the bottom starts at the first chapter');
    // From wherever a story is taken up, every chapter after it has a choice that can be taken.
    let stuck = [];
    for (const [c, tale] of Object.entries(STORIES)) {
      const car = CAREERS[c];
      for (let r = 1; r < car.rungs.length; r++) {
        const X = fresh({ seed: 40 + r });
        X.s.age = 18 + r * 7; X.s.cash = 400000; X.s.st = { smarts: 70, fitness: 70, charm: 70, craft: 70 };
        X.s.job = { c, r, n: 0, perf: 60, raise: 0 }; X.s.worked[c] = r; X.s.careers.job = { c, r };
        X.careerJoin(c, r, r * 7);
        for (let n = 0; n < tale.ch.length + 2; n++) {
          const k = X.s.careers.st[c];
          if (!X.s.job || X.s.job.c !== c || k.n >= tale.ch.length) break;
          X.s.job.r = Math.max(X.s.job.r, tale.ch[k.n].r || 0);
          X.s.pend = [];
          if (!X.careerNext(true)) break;
          const ev = X.event();
          if (!ev || !ev.opts.some((o) => !o.why) || bad(ev.text) || ev.opts.some((o) => bad(o.t))) { stuck.push(`${c}@${r}:${k.n}`); break; }
          X.choose(ev.opts.findIndex((o) => !o.why));
        }
      }
    }
    check(!stuck.length, `a story taken up at any rung can be told to its end (${stuck.join(' ')})`);
  }

  // ---- a fall at seventy is not a last illness ----
  {
    for (const [cause, dusk] of [['a fall', false], ['a beating in Starling Gaol', false], ['the cold sea', false], ['old age', true], ['heart trouble', true], ['flu', true], ['the drink', true]]) {
      const L = fresh({ seed: 5 });
      L.s.age = 72; L.s.health = 3; L.s.pend = [];
      L.hp(-10, cause); L.after();
      const ev = L.event();
      if (dusk) check(!L.s.dead && ev && ev.id === 'chapDusk' && !bad(ev.text) && !/It is the (a|an|the) /.test(ev.text), `${cause} at seventy-two is held off as a last illness (${ev && ev.text.split('. ')[1]})`);
      else check(L.s.dead && L.s.dead.cause === cause && !L.s.chap.dusk && !L.epitaph().some((t) => /last illness/.test(t)), `${cause} at seventy-two ends the life, as it always did`);
    }
    // A fall during a last illness still ends it, and the Gazette says which it was.
    const D = fresh({ seed: 5, sex: 'f' });
    D.s.age = 80; D.s.health = 3; D.s.pend = [];
    D.hp(-10, 'old age'); D.after();
    D.choose(0);
    D.s.health = 1; D.hp(-10, 'a fall'); D.after();
    const de = D.epitaph();
    check(D.s.dead && D.s.dead.cause === 'a fall' && de.some((t) => t === 'She had a last illness, and in the end it was a fall, not the illness, that took her.') && !de.some((t) => /met her last illness/.test(t)), `a fall in a last illness (${de.filter((t) => /illness/.test(t)).join(' | ')})`);
    // Inside, the prison doctor's words read properly too.
    const P = fresh(); P.s.age = 70; P.s.health = 2; P.s.pend = [];
    P.s.gaol = { left: 6, total: 6, served: 0, good: 50, rep: 10, dig: 0, study: 0, sol: false, inSol: false, appeal: false, board: null, tat: false };
    P.hp(-10, 'liver disease'); P.after();
    const pe = P.event();
    check(pe && pe.id === 'chapDusk' && /It is your liver\./.test(pe.text), `and from a cell (${pe && pe.text.split('. ')[1]})`);
  }

  // ---- the start screen offers no dream the heir already has ----
  {
    let offered = 0, instant = 0, same = 0;
    for (let n = 0; n < 12; n++) {
      const D = Life.create({ seed: 100 + n, name: 'Old', sex: 'f', sibs: [] });
      D.s.age = 90;
      const k = kid(D, { name: 'Ann Hale', sex: 'f', age: 58 + (n % 4), bond: 70, job: 'teaching' });
      for (const a of [28 + (n % 7), 31 + (n % 5)]) { const g = D.grandchild(k); g.age = a; D.fillPerson(g); g.bond = 10; }
      D.die('old age');
      const nx = D.chapNextLife(0);
      const off = Life.chapOffer(nx, () => 0.5, [], 40);
      const counts = [];
      for (let seed = 1; seed <= 5; seed++) {
        const { L } = next(D, 0, seed * 7919, off.slice(0, 3));
        counts.push(L.grandkids().length);
        if (off.includes('chapGrand')) { L.s.dreams = ['chapGrand', ...L.s.dreams.filter((d) => d !== 'chapGrand').slice(0, 2)]; L.act('rest'); if (L.s.dreamDone.chapGrand != null) instant++; }
      }
      if (off.includes('chapGrand')) offered++;
      if (counts.every((v) => v === counts[0])) same++;
    }
    check(same === 12 && instant === 0, `an heir’s grandchildren are the same however the dice fall, and a dream on offer is not already come true (${offered} offered, ${instant} at once)`);
  }

  // ---- the town’s old cards and wants.js’s ----
  {
    const L = fresh({ sex: 'f' }); L.s.age = 50; L.s.t = 128;
    const sp = L.meet({ kind: 'spouse', name: 'Ron Hale', sex: 'm', age: 52, single: false }); sp.live = true;
    check(!EV.anniv.when(L), 'the town’s anniversary card is retired: wants.js keeps the anniversaries, in their season');
    check(EV.inlaws.when(L), 'the in-laws can come to stay');
    L.s.wants.p[sp.id] = { been: [], since: 0, wed: 20, inl: { mum: 'Pat Hale', dad: 'Les Hale', age: 90, left: 0, last: null, w: 50, help: 0 } };
    check(!EV.inlaws.when(L), 'but not once both of them have died');
    L.s.wants.p[sp.id].inl.left = 1;
    check(EV.inlaws.when(L), 'while one of them is living, they can');
  }

  // ---- sport retires you at thirty-eight, with a send-off ----
  {
    const L = fresh(); const s = L.s;
    s.age = 37; s.t = 79; s.job = { c: 'sports', r: 3, n: 0, perf: 60, raise: 0 }; s.worked.sports = 3; s.careers.job = { c: 'sports', r: 3 };
    s.pend = []; s.time = 0;
    L.endSeason();
    const seen = clear(L, {}, []).map((e) => e.id);
    check(seen.includes('sportsRetire') && seen.includes('careerSendoff') && s.careers.n.sendoffs === 1 && s.careers.st.sports.retired != null && /framed|shirt/.test(s.careers.st.sports.gift), `hanging up your boots brings the party and the present (${s.careers.st.sports.gift})`);
  }

  // ---- the Gazette says each thing once ----
  {
    // A mayor, once.
    const L = fresh({ sex: 'f', name: 'Mae' }); const s = L.s;
    s.age = 50; s.job = { c: 'politics', r: 4, n: 0, perf: 60, raise: 0 }; s.worked.politics = 4; s.f.wasMayor = 1; s.n.shifts = 300;
    const i = STORIES.politics.ch.findIndex((c) => c.title === 'The sea wall');
    s.careers.st.politics = { n: i, q: 200, at: -99, f: {}, mn: null, rv: null, gaz: '', sent: 0, gift: '' };
    s.pend = []; L.careerNext(true); L.choose(0);
    L.die('old age');
    const ep = L.epitaph();
    check(ep.filter((t) => /\bmayor\b/.test(t) && !/mayors come and go/.test(t)).length === 1 && ep.some((t) => /sea wall/.test(t)) && ep.some((t) => /Town Hall clock/.test(t)), `she was mayor, and it is said once (${ep.filter((t) => /mayor|sea wall|clock/.test(t)).join(' | ')})`);
    // A partner's dreams, gathered into one sentence.
    const P = fresh({ name: 'Ned' });
    P.s.age = 80;
    const lily = P.meet({ kind: 'spouse', name: 'Lily Ross', sex: 'f', age: 79, single: false });
    P.s.wants.tales = ['stood behind Lily through a record with The Undertow', 'stood behind Lily through a degree', 'was married to Lily for fifty years and more', 'looked after an ageing parent at home to the very end'];
    P.die('old age');
    const pe = P.epitaph(), lines = pe.filter((t) => /Lily|ageing parent/.test(t) && !/ leaves /.test(t));
    check(lines.length === 2 && lines[0] === 'He was married to Lily for fifty years and more, and stood behind her through a record with The Undertow and a degree.' && lines[1] === 'He looked after an ageing parent at home to the very end.', `and everything with Lily is said in one sentence (${lines.join(' | ')})`);
    check(!pe.some((t) => /widow|did not speak of it/.test(t)) && lily, 'with her still living, nothing about being widowed');
    // Divorced once, and later widowed: it is the last marriage that counts.
    const W = fresh({ sex: 'f', name: 'Wyn' });
    W.s.age = 82; W.s.f.wed = 1; W.s.f.divorced = 1;
    W.note('Divorced Al Bray.', 'love');
    W.s.t += 40;
    W.note('Lost Mo Kerr, your husband.', 'love');
    W.s.t += 30;
    W.s.wants.tales = ['was married to Mo for fifty years and more'];
    W.die('old age');
    const we = W.epitaph();
    check(we.some((t) => /married to Mo/.test(t)) && we.some((t) => /widow for some years/.test(t)) && !we.some((t) => /did not speak of it/.test(t)), `a widow, though she was divorced once before (${we.filter((t) => /Mo|widow|speak/.test(t)).join(' | ')})`);
    const V = fresh({ sex: 'f', name: 'Val' });
    V.s.age = 60; V.s.f.wed = 1; V.s.f.divorced = 1;
    V.note('Lost Mo Kerr, your husband.', 'love');
    V.s.t += 40;
    V.note('Divorced Al Bray.', 'love');
    V.die('old age');
    check(V.epitaph().some((t) => /did not speak of it/.test(t)), 'and one whose last marriage ended in divorce still does not speak of it');
    // Big families in words.
    const F = fresh(); F.s.age = 80;
    const fk = kid(F, { name: 'Fay', sex: 'f', age: 50, bond: 60 });
    for (let n = 0; n < 9; n++) F.grandchild(fk).age = 10 + n;
    F.die('old age');
    check(F.epitaph().some((t) => /nine grandchildren/.test(t)), 'nine grandchildren, in words');
  }

  // ---- small things said wrongly ----
  {
    // A hip that is slow to mend (the private operation, until it is one of those).
    const L = fresh(); L.s.age = 70; L.s.cash = 500000;
    for (let i = 0; i < 30 && !L.s.ill; i++) { L.s.chap.old.hip = null; L.s.pend = []; L.queue('chapHip'); L.choose(0); }
    check(L.s.ill && L.s.ill.name === 'stiff hip' && /the stiff hip is gone/.test(L.act('treat').text), 'a hip that is slow to mend is a stiff hip, and the hospital can see to it');
    // A baby is minded, not taught.
    const M = fresh(); M.s.age = 62;
    const k = kid(M, { name: 'Ann Hale', sex: 'f', age: 30, bond: 70 });
    const baby = M.grandchild(k); baby.age = 0;
    M.s.chap.old.mind = { on: true, light: false, t: M.s.t, kid: k.id };
    check(!EV.chapMindDay.when(M) && !EV.chapMindDay.ok(M, baby.id), 'a day with the little ones is not a day of lessons for a baby');
    baby.age = TEACH_AGE;
    M.s.pend = [{ id: 'chapMindDay', x: baby.id }];
    const ev = M.event();
    M.choose(2);
    check(ev && /who is 3 /.test(ev.text) && M.s.chap.n.taught === 1, 'but one of three is old enough to learn something, and to ask about the moon');
    // Gran, or Grandad.
    const G = fresh({ sex: 'f', name: 'Kim' }); G.s.age = 30;
    G.s.people = G.s.people.filter((p) => p.name !== 'Mum');
    G.s.people.find((p) => p.name === 'Dad').bond = 70;
    const sp = G.meet({ kind: 'spouse', sex: 'm', age: 31, single: false }); sp.live = true;
    const ivy = kid(G, { name: 'Ivy Hale', sex: 'f', age: 1, bond: 60 });
    G.s.pend = [{ id: 'wantsNursery', x: { p: ivy.id } }];
    G.choose(1);
    const said = strip(wantsUi({ esc: (t) => String(t), money: (n) => `$${n}` }).person(G, ivy));
    check(/With Grandad three days a week/.test(said), `the baby is with Grandad when it is Grandad who has her (${said.trim()})`);
  }
}

// The random players sometimes leave it all to the husband or wife, to see it come down.
export function moves(L) {
  const s = L.s;
  if (s.age < 55 || s.t % 11 || !L.chapSpouseCan()) return [];
  return [['chapWill', { k: 'split', v: 'spouse' }]];
}
