// The chapters of a life, old age, and what you leave behind (chapters.js).
import { CROSS, DUTY, SETTLE, LATE_DREAMS, KEEPSAKES, dutyOn } from '../../games/new-in-town/js/chapters.js';
import { DREAMS, TROPHIES, HOMES, GIFTS, QUESTS, CAREERS, RIBBONS } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';

const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const bad = (t) => typeof t !== 'string' || /undefined|NaN|null|\[object|\s\s/.test(t);

// Answers whatever is waiting: the option named for a card (an index, or a function of the card), else the first that can be taken.
function clear(L, prefer = {}, seen = []) {
  let ev, n = 0;
  while ((ev = L.event()) && n++ < 40) {
    seen.push(ev.id);
    let i = prefer[ev.id] != null ? prefer[ev.id] : ev.opts.findIndex((o) => !o.why);
    if (typeof i === 'function') i = i(ev);
    const r = L.choose(i);
    if (!r.ok) throw new Error(`${ev.id}: ${r.why}`);
  }
  return seen;
}
// A season gone by with nothing done; only this part's cards are answered (others are dropped).
function turn(L, prefer, seen) { L.s.time = 0; L.endSeason(); L.s.pend = L.s.pend.filter((e) => e.id.startsWith('chap') || e.id === 'soulFuneral'); return clear(L, prefer, seen); }
const optIndex = (re) => (ev) => { const i = ev.opts.findIndex((o) => re.test(o.t) && !o.why); return i >= 0 ? i : ev.opts.findIndex((o) => !o.why); };
const kid = (L, o) => { const p = L.makePerson({ kind: 'child', single: false, ...o }); L.s.people.push(p); return p; };

export default function ({ check, fresh, Life, ACTIONS }) {
  // ---- the lists hang together ----
  for (const [id, d] of Object.entries(LATE_DREAMS)) {
    check(DREAMS[id] === d && d.name && d.icon && d.desc && typeof d.test === 'function', `later dream ${id}: is a dream`);
    check(!d.open({ gifts: {} }) && !d.open({ age: 18, people: [] }), `later dream ${id}: is not dreamt at eighteen`);
  }
  let late = 0;
  for (let i = 0; i < 80; i++) if (Life.create({ seed: 300 + i, name: 'Y' }).s.dreams.some((id) => LATE_DREAMS[id])) late++;
  check(late === 0, 'nobody starts out dreaming of their memoirs');
  for (const id of ['chapCross', 'chapDream', 'chapDusk', 'chapLast', 'chapFarewell', 'chapSummer', 'chapLetter', 'chapHip', 'chapHipDone', 'chapHeart', 'chapDownsize', 'chapMind', 'chapMindDay', 'chapMindEnd', 'chapOldCrowd', 'chapAdventure', 'chapAffairs', 'chapSlower', 'chapRivalry', 'chapMemoirDone']) check(EV[id], `card ${id} exists`);
  for (const id of ['chapNew', 'chapWords', 'chapOrder', 'chapMinder', 'chapLate', 'chapGrace']) check(TROPHIES[id], `trophy ${id}`);
  check(ACTIONS.chapMemoir.place === 'home' && ACTIONS.chapWillOpen.open === 'chapWill' && !ACTIONS.chapWill.place && !ACTIONS.chapSettle.place, 'memoirs are written at home; the will is kept by Mrs Gale');
  const traitOpts = EVENTS.filter((e) => e.id.startsWith('chap')).flatMap((e) => e.opts).filter((o) => o.show && typeof o.t === 'string' && /^\S+ /.test(o.t) && /[\u{1F300}-\u{1FAFF}☀-➿]/u.test(o.t.split(' ')[0]));
  check(traitOpts.length >= 5, `some choices are there only for some characters (${traitOpts.length})`);

  // ---- death duty, in plain numbers ----
  check(dutyOn(DUTY.free) === 0 && dutyOn(1e6) === 375000 && dutyOn(2e6) === 875000 && dutyOn(3e6) === 1675000 && dutyOn(-5) === 0, 'death duty: none on the first $250,000, half to $2M, four-fifths above');

  // ---- an old save ----
  {
    const L = fresh();
    L.s.age = 52;
    L.note('Married Pat Hale.', 'love'); L.note('Promoted to Waiter.', 'big');
    delete L.s.chap;
    const R = new Life(JSON.parse(JSON.stringify(L.s)));
    check(R.s.chap && R.s.chap.cross[30] === -1 && R.s.chap.cross[45] === -1 && R.chapNext() === 60, 'a life saved before the chapters began passes over the crossroads long gone');
    check(R.s.chap.marks.some((m) => m.x === 'Married Pat Hale.') && R.s.chap.start.how === 'train', 'and keeps the big moments already in its journal');
    let ok = true;
    try { for (let i = 0; i < 8; i++) turn(R); } catch (e) { ok = false; console.log(e); }
    check(ok && !R.s.dead, 'and seasons go by');
    // One saved at thirty-two still has its crossroads at thirty, counted from the train.
    const T = fresh(); T.s.age = 32; T.s.t = 56; delete T.s.chap;
    const T2 = new Life(JSON.parse(JSON.stringify(T.s)));
    T2.s.t = 56; T2.s.time = 0; T2.endSeason(); T2.s.pend = T2.s.pend.filter((q) => q.id === 'chapCross');
    const tx = T2.event();
    check(tx && /^Fourteen years since you stepped off the train/.test(tx.text), `a life saved at thirty-two still comes to its crossroads (${tx && tx.text.slice(0, 60)})`);
    const H = fresh();
    delete H.s.chap.will.split; delete H.s.chap.old; delete H.s.chap.n.taught; delete H.s.chap.memo;
    const H2 = new Life(JSON.parse(JSON.stringify(H.s)));
    check(H2.s.chap.will.split === 'fair' && H2.s.chap.old.hip === null && H2.s.chap.n.taught === 0 && H2.s.chap.memo.p === 0, 'and so is a half-filled one');
    // A life that ended before the will was thought of still hands on.
    const D = fresh();
    D.s.age = 70; D.s.cash = 400000;
    kid(D, { name: 'Ann', sex: 'f', age: 40, bond: 70, job: 'law' });
    D.die('old age');
    delete D.s.chap;
    const D2 = new Life(JSON.parse(JSON.stringify(D.s)));
    const o = D2.obituary(), nx = D2.chapNextLife(0);
    check(o.heir && o.heir.name === 'Ann' && o.inherit === D2.netWorth() - dutyOn(D2.netWorth()) && nx.carry.how === 'home' && nx.name === 'Ann', 'and a life that ended before it still hands on, by the will’s plain rules');
    // And a next life saved before the chapters, with nothing to carry, steps off the train.
    const old = Life.create({ seed: 4, name: 'Old', gen: 2, inherit: 5000 });
    old.chapBegin(undefined, []);
    check(old.s.age === 18 && old.s.chap.start.how === 'train' && old.chapIntro() === null && old.s.cash === 6500, 'a next life saved before the chapters steps off the train as before');
  }

  // ---- a crossroads ----
  {
    const L = fresh({ dreams: ['ownhome', 'doctor', 'travel'] });
    const s = L.s;
    L.act('apply', 'kitchen');
    L.note('Caught the golden bream of Starling Bay.', 'big');
    s.age = 29; s.t = 3; s.dreamDone.ownhome = 27;
    const seen = [];
    turn(L, {}, seen); // spring, and thirty
    check(s.age === 30 && !seen.includes('chapCross'), 'no crossroads on the birthday itself, which has a card of its own');
    L.s.time = 0; L.endSeason(); s.pend = s.pend.filter((q) => q.id === 'chapCross');
    const ev = L.event();
    check(ev && ev.id === 'chapCross' && ev.title.includes('thirty') && !bad(ev.text) && /Twelve years since you stepped off the train/.test(ev.text) && ev.text.includes('golden bream') && ev.text.includes('A place of my own came true'), `the summer after, a crossroads looks back on the chapter (${ev && ev.text})`);
    check(L.event().text === ev.text, 'and reads the same each time it is looked at');
    const i = ev.opts.findIndex((o) => /dream something new/.test(o.t));
    L.choose(i);
    const d = L.event();
    check(d && d.id === 'chapDream' && d.text.includes('A place of my own came true at 27') && d.opts.length >= 2, 'and offers new dreams in place of one that came true');
    const pickIt = d.opts.findIndex((o) => !/^Leave it/.test(o.t)), want = L.s.pend[0].x.offer[pickIt];
    L.choose(pickIt);
    check(s.dreams[0] === want && s.chap.was.length === 1 && s.chap.was[0].id === 'ownhome' && s.chap.was[0].done === 27 && !s.dreamDone[want] && !L.chapFar(want), 'the new dream takes its place, and the old one is remembered');
    check(s.chap.past.length === 1 && s.chap.snap.age === 30 && s.ach.chapNew, 'a new chapter begins');
    const o = L.obituary();
    check(o.dreams.length === 4 && o.dreams.some((q) => q.id === 'ownhome' && q.done && q.was), 'the end of a life counts every dream it had');
    // Thirty-one, and nothing more until forty-five.
    let more = 0;
    for (let k = 0; k < 20; k++) { turn(L, {}, seen); if (s.pend.some((q) => q.id === 'chapCross')) more++; }
    check(!seen.includes('chapCross') && more === 0, 'one crossroads at thirty, and only one');
    // A crossroads missed is passed over for the next.
    const M = fresh();
    M.s.age = 47; M.s.t = 0;
    M.s.time = 0; M.s.pend = []; turn(M, {}, seen);
    check(M.s.chap.cross[30] === -1 && M.s.chap.cross[45] > 0 && M.s.chap.past.length === 1, 'a crossroads long gone is passed over, and the next one comes');
    // At sixty, later dreams; a dream out of reach can be let go.
    const S = fresh({ dreams: ['doctor', 'iron', 'travel'] });
    S.s.age = 60; S.s.t = 0; S.s.chap.cross[30] = -1; S.s.chap.cross[45] = -1;
    S.s.time = 0; S.endSeason(); S.s.pend = S.s.pend.filter((q) => q.id === 'chapCross');
    S.choose(S.event().opts.findIndex((o) => /dream something new/.test(o.t)));
    const d2 = S.event();
    check(d2 && d2.id === 'chapDream' && /out of reach/.test(d2.text) && S.s.pend[0].x.offer.every((id) => !S.chapFar(id) && !S.s.dreams.includes(id)), 'at sixty a dream out of reach can make way for another');
    let later = 0;
    for (let i = 0; i < 10; i++) {
      const X = fresh({ seed: 60 + i, dreams: ['doctor', 'iron', 'travel'] });
      X.s.age = 60; X.s.t = 0; X.s.chap.cross[30] = -1; X.s.chap.cross[45] = -1;
      X.s.time = 0; X.endSeason(); X.s.pend = X.s.pend.filter((q) => q.id === 'chapCross');
      X.choose(X.event().opts.findIndex((o) => /dream something new/.test(o.t)));
      if (X.s.pend[0] && X.s.pend[0].x.offer.some((id) => LATE_DREAMS[id])) later++;
    }
    check(later >= 6, `and at sixty, mostly dreams of later life (${later}/10)`);
    S.choose(d2.opts.length - 1);
    check(S.s.dreams.includes('doctor') || S.event(), 'or be kept, if you would rather');
  }

  // ---- the highlights of a life ----
  {
    const L = fresh();
    L.note('Married Sam Reed.', 'love');
    for (let i = 0; i < 9; i++) L.note('Retired as Chief Surgeon on a pension of $9,000 a season.', 'big');
    for (const t of ['Promoted to Waiter.', 'Promoted to Line Cook.', 'Promoted to Sous Chef.', 'Promoted to Head Chef.']) L.note(t, 'big');
    L.note('Ruby was born.', 'love'); L.note('Started seeing Jo.', 'love');
    for (let i = 0; i < 20; i++) L.note(`Won a red rosette at the Windle Show: hen ${i}.`, 'big');
    const h = L.chapHighlights();
    const texts = h.map((e) => e.t);
    check(h.length <= 9 && new Set(texts).size === texts.length, 'the highlights never say the same thing twice');
    check(texts.filter((t) => t.startsWith('Retired')).length === 1 && texts.includes('Married Sam Reed.') && texts.includes('Ruby was born.') && texts.includes('Promoted to Head Chef.') && !texts.includes('Promoted to Waiter.'), 'and are the biggest moments: a wedding, a birth, the top of a career, not nine retirements');
    check(texts.filter((t) => /rosette/.test(t)).length <= 1, 'one rosette is enough');
    const D = fresh();
    for (const id of ['ownhome', 'manor', 'million', 'top', 'boat', 'degree', 'novel']) D.note(`A dream came true: ${id}.`, 'big');
    D.note('Married Kim Hale.', 'love'); D.note('Kit was born.', 'love'); D.note('Promoted to Chief Surgeon.', 'big'); D.note('Published a novel. It became a bestseller and earned $90,000.', 'big');
    const dt = D.chapHighlights().map((e) => e.t);
    check(dt.filter((t) => /^A dream/.test(t)).length <= 4 && dt.includes('Married Kim Hale.') && dt.includes('Kit was born.') && dt.some((t) => /bestseller/.test(t)), `seven dreams come true do not crowd out the rest of a life (${dt.length})`);
  }

  // ---- the end is seen coming ----
  {
    // Young: health run out is the end.
    const Y = fresh();
    Y.s.age = 50; Y.s.health = 1; Y.hp(-5, 'a fall'); Y.after();
    check(Y.s.dead && !Y.s.chap.dusk, 'before sixty-five, health run out is still the end');
    // Old: it becomes a last illness, with the doctor's news first.
    const L = fresh({ sex: 'f' });
    const s = L.s;
    s.age = 78; s.cash = 20000;
    const pt = L.meet({ kind: 'spouse', sex: 'm', name: 'Tom Reed', age: 79, single: false }); pt.live = true;
    kid(L, { name: 'Ann', sex: 'f', age: 50, bond: 80, job: 'teaching' });
    s.health = 0; s.hurt = 'old age';
    L.after();
    check(!s.dead && s.chap.dusk && s.health > 0 && s.pend[0].id === 'chapDusk', 'after sixty-five, a natural death due becomes a last illness, and the doctor says so');
    const ev = L.event();
    check(!bad(ev.text) && /a year, perhaps/.test(ev.text) && ev.opts.some((o) => /grace/.test(o.t)) && ev.opts.some((o) => /Fight/.test(o.t)), 'met with grace, or fought');
    const tm = L.timeMax();
    L.choose(ev.opts.findIndex((o) => /grace/.test(o.t)));
    check(s.chap.dusk.way === 'grace' && L.timeMax() <= tm, 'the body slows');
    const seen = [];
    let n = 0, low = 0;
    while (!s.dead && n++ < 30) { turn(L, {}, seen); if (s.health < 30) low++; }
    check(s.dead && n <= 12 && seen.includes('chapLast') && seen.includes('chapFarewell') && seen.includes('chapLetter') && low > 0, `the last chapter runs a few seasons, with goodbyes, and ends on a last morning (${n} seasons; ${seen.join(', ')})`);
    check(s.ach.chapGrace && /grace/.test(L.epitaph().join(' ')), 'and the Gazette says how it was met');
    const o = L.obituary();
    check(o.carry[0].name === 'Ann' && o.carry[0].letter && /Love, Mum\.$/.test(o.carry[0].letter), 'the one who carries on has a letter waiting');
    // Fighting it buys time, when it works.
    let longer = 0, fought = 0;
    for (let i = 0; i < 30; i++) {
      const F = fresh({ seed: 900 + i });
      F.s.age = 80; F.s.cash = 50000; F.s.health = 0; F.s.hurt = 'old age'; F.after();
      const e = F.event();
      const left = F.s.chap.dusk.left;
      F.choose(e.opts.findIndex((o) => /Fight/.test(o.t)));
      fought++;
      if (F.s.chap.dusk.left > left) longer++;
    }
    check(longer > 3 && longer < fought, `fighting it buys more time, sometimes (${longer}/${fought})`);
    // The old-age dice: always seen coming, and a life always ends.
    let warned = 0, ended = 0;
    for (let i = 0; i < 12; i++) {
      const X = fresh({ seed: 700 + i });
      X.s.age = 94; X.s.health = 40;
      const ids = [];
      for (let k = 0; k < 80 && !X.s.dead; k++) {
        X.s.time = 0; X.endSeason();
        X.s.pend = X.s.pend.filter((q) => q.id.startsWith('chap'));
        clear(X, {}, ids);
      }
      if (X.s.dead) ended++;
      if (X.s.dead && ids.includes('chapDusk') && ids.includes('chapLast')) warned++;
    }
    check(ended === 12 && warned === 12, `at ninety-four the end always comes, and always with a warning (${warned}/${ended})`);
    // A direct end (the tests use it) is still the end, and nobody lives for ever.
    const Z = fresh(); Z.s.age = 75; Z.die('old age');
    check(Z.s.dead, 'death itself is not held off, only a natural one that is due');
  }

  // ---- the will ----
  {
    const L = fresh();
    const s = L.s;
    s.age = 70; s.cash = 3000000;
    const ann = kid(L, { name: 'Ann', sex: 'f', age: 44, bond: 70, job: 'teaching' });
    const bob = kid(L, { name: 'Bob', sex: 'm', age: 41, bond: 50, job: 'sea' });
    const worth = L.netWorth();
    let e = L.chapEstate();
    check(e.heir === ann.id && e.money === worth && e.duty === dutyOn(worth) && e.shares.length === 2 && e.shares.every((q) => Math.abs(q.n - e.left / 2) <= 1), 'without a will, the money is shared fairly among the children after duty');
    // A home of your own passes free of duty to whoever carries on.
    const home = { id: s.eid++, kind: 'cottage', ups: {}, let: false };
    s.estate.push(home); L.settleIn('cottage', home);
    e = L.chapEstate();
    check(e.home && e.home.kind === 'cottage' && e.money === L.netWorth() - L.propValue(home) && L.chapLeaves(e, ann.id).some((t) => /cottage/.test(t)), 'the family home passes to the heir, free of duty');
    L.act('chapWill', { k: 'home', v: 'sell' });
    check(!L.chapEstate().home && s.chap.will.made === s.t, 'or is sold and shared, if the will says so');
    L.act('chapWill', { k: 'home', v: 'heir' });
    // Half to the heir.
    L.act('chapWill', { k: 'split', v: 'heir' });
    e = L.chapEstate();
    check(e.shares.find((q) => q.p === ann.id).n > e.shares.find((q) => q.p === bob.id).n * 1.9, 'or mostly to the one who carries on');
    check(L.can('chapWill', { k: 'split', v: 'spouse' }), 'and not to a husband or wife who is not there');
    // Naming a grandchild.
    const gk = L.grandchild(bob); gk.age = 25; L.fillPerson(gk);
    L.act('chapWill', { k: 'heir', v: gk.id });
    check(L.chapHeir() === gk && L.chapEstate().shares.some((q) => q.p === gk.id), 'a grandchild can be the one who carries on');
    check(L.can('chapWill', { k: 'heir', v: 9999 }) && L.can('chapWill', { k: 'town', v: 'nope' }) && L.can('chapWill', { k: 'what', v: 1 }), 'and nonsense is turned away');
    L.act('chapWill', { k: 'heir', v: ann.id });
    // The town.
    L.act('chapWill', { k: 'town', v: 'lifeboat' });
    e = L.chapEstate();
    check(e.town && e.town.ok && e.money === L.netWorth() - L.propValue(home) - GIFTS.lifeboat.cost, 'something for the town comes off first, free of duty');
    // Gifts in life.
    const cash = s.cash + s.bank;
    check(L.act('chapSettle', { p: bob.id, n: 25000 }).ok && s.cash + s.bank === cash - 25000 && bob.purse === 25000, 'money can be given to the family now');
    check(!L.act('chapSettle', { p: bob.id, n: 5000 }).ok && !L.act('chapSettle', { p: bob.id, n: 1e6 }).ok, 'once a year each, and no more than $25,000');
    check(L.chapEstate().recent === 25000 && L.chapEstate().duty === dutyOn(L.chapEstate().money + 25000) - dutyOn(25000), 'it counts for duty for five years');
    s.age = 60; // (so that the old-age dice keep out of it)
    for (let i = 0; i < 21; i++) { s.time = 0; s.pend = []; s.health = 80; L.endSeason(); }
    s.age = 70;
    check(L.chapEstate().recent === 0 && bob.purse === 25000, 'and is clear of it after');
    const F = fresh(); F.s.age = 30; const fk = kid(F, { name: 'Fi', sex: 'f', age: 5, bond: 60 });
    check(!F.act('chapSettle', { p: fk.id, n: 5000 }).ok, 'it is for later in life');
    // Carried out at the end.
    s.dead = null;
    L.die('old age');
    check(s.gifts.lifeboat === s.name && s.gave.lifeboat && s.chap.out && s.log.some((q) => /Left the town a lifeboat/.test(q.t)), 'when the life ends, the town gets its lifeboat, with the name on it');
    const o = L.obituary();
    check(o.gifts.lifeboat && o.carry[0].name === 'Ann' && o.carry[0].home && o.carry[0].home.kind === 'cottage' && o.carry[1].name === 'Bob' && !o.carry[1].home && o.carry[1].purse === 25000, 'the heir has the house; the others their share');
    check(o.carry[0].sibBond < o.carry[1].sibBond, 'and a brother left the smaller share remembers it');
    // To a husband or wife: no duty now, and it comes down later.
    const W = fresh();
    W.s.age = 75; W.s.cash = 1500000;
    const sp = W.meet({ kind: 'spouse', sex: 'f', name: 'May Hart', age: 74, single: false });
    const son = kid(W, { name: 'Kit', sex: 'm', age: 45, bond: 70, job: 'trades' });
    W.act('chapWill', { k: 'split', v: 'spouse' });
    const we = W.chapEstate();
    check(we.toSpouse && we.duty === 0 && we.shares[0].p === sp.id && we.heirMoney === 0, 'left to a wife, it pays no duty, and the son has none of it yet');
    W.die('old age');
    const wn = W.chapNextLife(0);
    check(wn.carry.parPurse === we.left && wn.parent && wn.parent.name === 'May Hart', 'it stays with his mother');
    const K = Life.create({ seed: 8, name: 'Kit', sex: 'm', gen: 2, inherit: wn.inherit, parent: wn.parent, sibs: wn.sibs, gifts: wn.gifts });
    K.chapBegin(wn.carry, ['travel', 'million', 'novel']);
    const mum = K.s.people.find((p) => p.kind === 'parent');
    check(K.s.chap.par && K.s.chap.par.pid === mum.id, 'in the next life his mother has it');
    const before = K.s.cash + K.s.bank;
    K.queue('parentDies', mum.id); K.choose(0);
    const got = K.s.cash + K.s.bank - before;
    check(got >= we.left - dutyOn(we.left) && !K.s.chap.par, `and when she dies it comes to him, after duty (${got})`);
  }

  // ---- the one who carries on ----
  {
    // A grown son, with a family of his own, at home in the Bay.
    const L = fresh({ sex: 'f', name: 'Ada Lane' });
    const s = L.s;
    s.age = 84; s.cash = 600000;
    s.items.guitar = 1; s.items.watch = 1; s.items.laptop = 1;
    const home = { id: s.eid++, kind: 'townhouse', ups: { garden: 1 }, let: false };
    s.estate.push(home); L.settleIn('townhouse', home);
    const tom = L.meet({ kind: 'spouse', sex: 'm', name: 'Tom Lane', age: 86, single: false }); tom.live = true;
    const ben = kid(L, { name: 'Ben', sex: 'm', age: 52, bond: 80, job: 'law' });
    kid(L, { name: 'Cat', sex: 'f', age: 49, bond: 40, job: 'arts' });
    for (const k of L.kids()) for (const q of ['smarts', 'fitness', 'charm', 'craft']) k.st[q] = 40;
    const g1 = L.grandchild(ben); g1.age = 20; L.fillPerson(g1);
    const g2 = L.grandchild(ben); g2.age = 9;
    s.folk.p.betty.f = 60;
    L.die('old age');
    const o = L.obituary(), c = o.carry[0];
    check(c.name === 'Ben' && c.how === 'home' && c.age === 52 && c.kids.length === 2 && c.items.includes('guitar') && !c.items.includes('laptop') && c.home.kind === 'townhouse', 'the heir is a grown son, with his own children, the house and the keepsakes');
    const nx = L.chapNextLife(0);
    const H = Life.create({ seed: 12, name: nx.name, sex: nx.sex, look: nx.look, gen: nx.gen, inherit: nx.inherit, parent: nx.parent, raised: nx.st, gifts: nx.gifts, sibs: nx.sibs, dreams: ['chapMemoir', 'travel', 'novel'], heir: 'star' });
    H.chapBegin(nx.carry, ['chapMemoir', 'travel', 'novel']);
    const h = H.s;
    check(h.age === 52 && h.job && h.job.c === 'law' && h.job.r >= 2 && CAREERS.law.rungs[h.job.r] && H.needs(CAREERS.law.rungs[h.job.r].need).every((q) => q.ok), `he starts at his own age, in his own work, qualified for it (${H.jobTitle()})`);
    check(h.owned && h.home === 'townhouse' && H.homeEntry().ups.garden && h.items.guitar && h.items.watch, 'in the family home, with the keepsakes');
    check(h.bank >= nx.inherit && h.cash >= 0 && h.quest === QUESTS.length && h.health <= H.healthCap(), 'the money in the bank, and no to-do list for somebody who has lived here all along');
    check(H.kids().length === 2 && H.kids().some((k) => k.age === 20 && k.job) && H.partner() && H.partner().kind === 'spouse' && H.siblings().some((p) => p.name === 'Cat') && h.people.some((p) => p.kind === 'parent' && p.name === 'Tom Lane'), 'his wife and children, his sister, and his father');
    check(h.dreams.includes('chapMemoir') && h.dreams.length === 3 && h.chap.cross[30] === -1 && h.chap.cross[45] === -1 && H.chapNext() === 60, 'his own dreams, and the crossroads still ahead of him');
    check(h.folk.p.betty.f > 0 && h.folk.p.betty.met != null, 'the town has known him all his life');
    check(h.log[0].t.startsWith('Took up the family’s story at 52') && !h.log.some((q) => /Stepped off the train/.test(q.t)), 'and he did not step off any train');
    const intro = H.chapIntro();
    check(intro && intro.title === 'After the funeral' && intro.text.every((t) => !bad(t)) && /Mum left you/.test(intro.text[1]) && /townhouse/.test(intro.text[1]), `the first card tells his story (${intro && intro.text.join(' ')})`);
    check(h.items.guitar && h.heir === 'star', 'heirlooms still come along');
    check(H.chapOrigin().startsWith('Born in Starling Bay'), 'his end will say where he began');
    H.die('old age');
    check(/born in Starling Bay and lived there all his life/.test(H.epitaph()[0]), 'and the Gazette will know it');
    // The offer of dreams for him leaves out what he already has, and what is beyond him.
    const off = Life.chapOffer(nx, () => 0.37);
    check(off.length === 6 && !off.includes('ownhome') && !off.includes('doctor') && !off.includes('family') && off.every((id) => DREAMS[id]), `dreams on offer fit an heir of fifty-two (${off.join(', ')})`);
    // At a great age, with a child past sixty, a grown grandchild who is close carries on.
    const Old = fresh(); Old.s.age = 94;
    const sixty = kid(Old, { name: 'Viv', sex: 'f', age: 66, bond: 85, job: 'law' });
    const gg = Old.grandchild(sixty); gg.age = 35; gg.bond = 50; Old.fillPerson(gg);
    check(Old.chapHeir() === gg, 'with a child past sixty, a grown grandchild carries on');
    sixty.age = 50;
    check(Old.chapHeir() === sixty, 'otherwise the child does');
    // An heir of fifty-eight may be a grandparent already.
    let grands = 0;
    for (let i = 0; i < 12; i++) {
      const O = Life.create({ seed: 50 + i, name: 'Old', sex: 'f', gen: 2, sibs: [] });
      O.chapBegin({ ...nx.carry, age: 58, kids: [{ name: 'Zed', sex: 'm', age: 34 }, { name: 'Amy', sex: 'f', age: 31 }], home: null }, []);
      const gk = O.grandkids();
      if (gk.length) grands++;
      if (gk.some((g) => !O.person(g.of) || g.age < 0 || g.age > 8)) grands = -99;
    }
    check(grands >= 4 && grands < 12, `an heir with grown children is sometimes a grandparent already (${grands}/12)`);
    // Every heirloom still comes along with a grown heir, and does what it did.
    let kept = 0;
    for (const r of RIBBONS) {
      const X = Life.create({ seed: 30, name: nx.name, sex: nx.sex, gen: nx.gen, inherit: nx.inherit, parent: nx.parent, sibs: nx.sibs, gifts: nx.gifts, heir: r.id });
      X.chapBegin(nx.carry, []);
      const xs = X.s;
      const ok = xs.heir === r.id && (r.id !== 'tycoon' || xs.cash >= 6000) && (r.id !== 'star' || xs.items.guitar) && (r.id !== 'artist' || xs.items.easel) && (r.id !== 'salt' || xs.items.rod)
        && (r.id !== 'kingpin' || xs.n.crimes === 5) && (r.id !== 'benefactor' || xs.karma >= 25) && (r.id !== 'sensation' || (xs.items.phone && xs.chirp)) && (r.id !== 'young' || xs.health > h.health - 3);
      if (ok) kept++; else console.log('heirloom', r.id);
    }
    check(kept === RIBBONS.length, `every heirloom still works for an heir who starts at home (${kept}/${RIBBONS.length})`);
    // A business left to him is his to run.
    const Bz = fresh(); Bz.s.age = 80; Bz.s.cash = 50000;
    Bz.s.biz = { type: 'food', lvl: 2, rep: 70, mgr: true, age: 30, at: 0 };
    kid(Bz, { name: 'Dee', sex: 'f', age: 45, bond: 70, job: 'kitchen' });
    const bzWorth = Bz.bizWorth();
    Bz.die('old age');
    const bnx = Bz.chapNextLife(0);
    const Dee = Life.create({ seed: 31, name: 'Dee', sex: 'f', gen: 2, inherit: bnx.inherit, parent: bnx.parent, sibs: bnx.sibs, gifts: bnx.gifts });
    Dee.chapBegin(bnx.carry, []);
    check(bnx.carry.biz && Dee.s.biz && Dee.s.biz.lvl === 2 && Dee.s.biz.type === 'food' && Bz.s.chap.out.money === Bz.netWorth() - bzWorth, 'a business handed on is hers to run, and paid no duty');
    // A grandchild, named in the will instead.
    const G = fresh({ sex: 'f' });
    G.s.age = 88; G.s.cash = 100000;
    const mum = kid(G, { name: 'Jo', sex: 'f', age: 60, bond: 60, job: 'kitchen' });
    const gr = G.grandchild(mum); gr.age = 30; G.fillPerson(gr); gr.taught = 'craft';
    G.act('chapWill', { k: 'heir', v: gr.id });
    G.die('old age');
    const gc = G.obituary().carry[0];
    check(gc.rel.startsWith('grand') && gc.how === 'home' && gc.parent && gc.parent.name === 'Jo' && gc.called === 'Gran' && gc.st.craft > gc.st.smarts, 'a grandchild can carry on, with a mother still living, and what Gran taught');
    // A child still at school comes back at eighteen.
    const B = fresh();
    B.s.age = 66; B.s.cash = 90000;
    const home2 = { id: B.s.eid++, kind: 'cottage', ups: {}, let: false };
    B.s.estate.push(home2); B.settleIn('cottage', home2);
    kid(B, { name: 'Pip', sex: 'm', age: 11, bond: 70 });
    B.die('a fall');
    const bn = B.chapNextLife(0);
    check(bn.carry.how === 'back' && bn.carry.age === 18 && bn.carry.gap === 7, 'a child still at school grows up first');
    const P = Life.create({ seed: 13, name: 'Pip', sex: 'm', gen: 2, inherit: bn.inherit, raised: bn.st, parent: bn.parent, sibs: bn.sibs, gifts: bn.gifts });
    P.chapBegin(bn.carry, []);
    check(P.s.age === 18 && P.s.owned && P.s.home === 'cottage' && P.s.bank >= bn.inherit && P.chapIntro().title === 'Starling Bay, again' && P.s.log[0].t.startsWith('Came back to Starling Bay'), 'and comes back to the Bay at eighteen, to the house that was let while he was away');
    // Nobody at all: a distant cousin, as before.
    const N = fresh();
    N.s.age = 70; N.s.cash = 80000; N.s.items.rod = 1;
    N.die('old age');
    const nn = N.chapNextLife(0);
    check(N.obituary().heir === null && nn.carry.how === 'train' && nn.inherit === N.netWorth() && nn.carry.items.includes('rod'), 'with nobody to carry on, a distant cousin steps off the train with what there is');
  }

  // ---- later life ----
  {
    const L = fresh();
    const s = L.s;
    s.age = 70; s.cash = 60000; s.health = 60;
    const want = (id, x) => { s.pend = []; L.queue(id, x); return L.event(); };
    // The hip.
    let ev = want('chapHip');
    L.choose(ev.opts.findIndex((o) => /waiting list/.test(o.t)));
    const t0 = L.timeMax();
    check(s.chap.old.hip === 'wait' && s.chap.old.hipAt > s.t, 'a hip on the waiting list');
    for (let i = 0; i < 8 && s.chap.old.hip === 'wait'; i++) turn(L, { chapHipDone: 0 });
    check(s.chap.old.hip === 'new' && L.timeMax() >= t0, 'gets done in the end, and the time comes back');
    // The heart.
    s.health = 50;
    ev = want('chapHeart');
    L.choose(ev.opts.findIndex((o) => /Tablets/.test(o.t)));
    check(s.chap.old.heart === 'pills', 'a heart can be lived with');
    // Downsizing.
    const home = { id: s.eid++, kind: 'villa', ups: {}, let: false };
    s.estate.push(home); L.settleIn('villa', home);
    const worth = L.netWorth();
    ev = want('chapDownsize');
    check(EV.chapDownsize.when(L) && !bad(ev.text), 'too much house');
    L.choose(ev.opts.findIndex((o) => /Sell up/.test(o.t)));
    check(s.home === 'flat' && s.owned && L.homeEntry().kind === 'flat' && s.estate.length === 1 && Math.abs(L.netWorth() - worth) < worth * 0.1 && s.cash > 60000, 'sold, and a flat bought, with money over');
    // Grandchildren to mind.
    const k = kid(L, { name: 'Ann', sex: 'f', age: 40, bond: 60, job: 'teaching' });
    const g = L.grandchild(k); g.age = 4;
    ev = want('chapMind', k.id);
    const t1 = L.timeMax();
    L.choose(0);
    check(s.chap.old.mind.on && L.timeMax() === t1 - 1, 'minding the grandchildren takes a block of time');
    ev = want('chapMindDay', g.id);
    L.choose(1);
    check(g.taught === 'craft' && s.chap.n.taught === 1 && LATE_DREAMS.chapTeach.test(L), 'and teaches them something');
    g.age = 11;
    const seen = [];
    turn(L, {}, seen);
    check(!s.chap.old.mind.on && seen.includes('chapMindEnd'), 'until they are too big to mind');
    // The adventure.
    s.health = 60;
    ev = want('chapAdventure');
    L.choose(ev.opts.findIndex((o) => /balloon/.test(o.t)));
    check(s.chap.old.adv && s.chap.old.adv.age === s.age && s.ach.chapLate && /balloon/.test(L.epitaph().join(' ')), 'one last adventure, in the obituary too');
    // The solicitor.
    ev = want('chapAffairs');
    L.choose(0);
    check(s.chap.will.made === s.t, 'the solicitor sees you on Thursday');
    // Memoirs: eight sittings, then something to do with them; once.
    let n = 0;
    while (!s.chap.memo.done && n++ < 12) { s.time = 6; s.use = {}; s.pend = []; L.act('chapMemoir'); if (L.event()) L.choose(1); }
    check(s.chap.memo.done && n === 8 && s.chap.memo.done.how === 'archive' && s.ach.chapWords, 'memoirs take eight sittings, and go to the archive');
    s.time = 6; s.use = {};
    check(!L.act('chapMemoir').ok, 'and are only written once');
    check(L.epitaph().some((t) => /memoirs/.test(t)), 'and the Gazette mentions them');
    // Old friends.
    const pal = L.meet({ kind: 'friend', age: 72, bond: 50 });
    ev = want('chapOldCrowd', pal.id);
    const m0 = L.moodBase();
    L.choose(0);
    check(s.chap.old.lunch === pal.id && L.moodBase() > m0, 'lunch with the last of the old crowd cheers you');
  }

  // ---- later life brings its own cards ----
  {
    const L = fresh();
    L.s.age = 66; L.s.cash = 30000; L.s.health = 70;
    kid(L, { name: 'Ann', sex: 'f', age: 40, bond: 60, job: 'law' });
    const seen = [];
    for (let i = 0; i < 40 && !L.s.dead; i++) { L.s.health = Math.max(L.s.health, 50); turn(L, {}, seen); }
    const mine = new Set(seen.filter((id) => id.startsWith('chap') && id !== 'chapCross' && id !== 'chapDream'));
    check(mine.size >= 6, `ten years after sixty-five bring half a dozen of later life’s own cards (${[...mine].join(', ')})`);
    const Y = fresh();
    Y.s.age = 40;
    const ys = [];
    for (let i = 0; i < 40; i++) turn(Y, {}, ys);
    check(!ys.some((id) => /^chap(Hip|Heart|Downsize|Slower|Bench|Knees|Adventure)/.test(id)), 'and none of them come at forty');
  }

  // ---- nothing to farm ----
  {
    const L = fresh();
    L.s.age = 65; L.s.cash = 5000;
    let ok = 0;
    for (let i = 0; i < 4; i++) if (L.act('chapMemoir').ok) ok++;
    check(ok === 1, 'one sitting of memoirs a season');
    const k = kid(L, { name: 'Q', sex: 'm', age: 30, bond: 50 });
    const w = L.netWorth();
    L.act('chapSettle', { p: k.id, n: 5000 });
    check(L.netWorth() === w - 5000, 'a gift is money given, not made');
    // Every option of every card that can be put up reads properly.
    const M = fresh();
    M.s.age = 76; M.s.cash = 20000; M.s.health = 50;
    const kk = kid(M, { name: 'R', sex: 'f', age: 40, bond: 60, job: 'law' }); const gg = M.grandchild(kk); gg.age = 6;
    let fine = true, shown = 0;
    const look = (id, x) => {
      M.s.pend = []; M.queue(id, x);
      const ev = M.event();
      if (!ev) return;
      shown++;
      if (bad(ev.title) || bad(ev.text) || ev.opts.some((o) => bad(o.t)) || !ev.opts.some((o) => !o.why)) { fine = false; console.log(id, ev); }
    };
    for (const id of ['chapHip', 'chapHeart', 'chapSlower', 'chapAdventure', 'chapAffairs', 'chapBench', 'chapKnees']) look(id);
    look('chapAdvice', { p: kk.id, d: 1 });
    look('chapMind', kk.id);
    M.s.chap.old.mind = { on: true, light: false, t: M.s.t, kid: kk.id };
    look('chapMindDay', gg.id);
    M.s.chap.dusk = { at: M.s.t, cause: 'heart trouble', left: 3, way: 'grace', treat: null, done: {} };
    look('chapDusk', { cause: 'heart trouble' }); look('chapFarewell'); look('chapSummer'); look('chapLetter', kk.id);
    check(fine && shown === 14, `the cards of later life read properly and always leave a choice (${shown})`);
  }
}

// The random players sometimes change their will, and give the family something.
export function moves(L) {
  const s = L.s;
  if (s.age < 50 || s.t % 9) return [];
  const out = [['chapWill', { k: 'split', v: s.t % 2 ? 'fair' : 'heir' }]];
  const k = L.chapCands()[0];
  if (k) out.push(['chapSettle', { p: k.id, n: 5000 }]);
  if (s.t % 27 === 0) out.push(['chapWill', { k: 'town', v: 'bench' }]);
  return out;
}
