// Where the parts of the town meet: the storm and the flood shut whatever is at the
// pier or on the High Street, wherever it is listed; an heir's town is the town the
// last life left; the drains take down whoever holds the chain; Sal is in one place
// at a time; and the politics story keeps to the election calendar.
import { EVENTS } from '../../games/new-in-town/js/events.js';
import { STORIES } from '../../games/new-in-town/js/careers.js';
import { BUSINESSES } from '../../games/new-in-town/js/data.js';

const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

export default function ({ check, fresh, Life }) {
  const turn = (L) => { L.endSeason(); const ids = L.s.pend.map((e) => e.id); L.s.pend = []; L.s.time = 20; return ids; };
  const till = (L, t) => { while (L.s.t < t) turn(L); };
  const rigged = (L, yes, f) => { const was = L.chance; L.chance = () => yes; try { return f(); } finally { L.chance = was; } };
  const open = (L, place) => L.placeActions(place).filter((a) => !a.why).map((a) => a.id);

  // ---- the storm and the flood shut what is there, however it is listed ----
  {
    // A business on the High Street, a chat with Betty and Mr Pym, the books: all shut by the flood.
    const L = fresh({ seed: 3 });
    L.s.cash = 500000; L.s.st.craft = 60; L.s.st.charm = 60;
    const food = Object.keys(BUSINESSES).find((k) => BUSINESSES[k].place === 'highstreet');
    L.act('bizStart', food); L.s.home = 'flat';
    L.s.time = 20; L.s.use = {};
    const before = open(L, 'highstreet');
    check(['bizWork', 'fiddle', 'fkChat_betty', 'fkChat_pym'].every((id) => before.includes(id)), 'a business on the High Street, its books and its shopkeepers, on a dry day');
    L.annalsStart('flood'); L.s.pend = [];
    check(!open(L, 'highstreet').length && /flood/.test(L.can('bizWork')) && /flood/.test(L.can('fiddle')) && /flood/.test(L.can('fkChat_betty')), 'the flood shuts all of them, not only what is listed there by name');
    turn(L);
    check(!L.can('bizWork'), 'and a season later the High Street is open again');
    // The storm: the counting-room job is off, and so is casing it.
    const G = fresh();
    G.s.n.crimes = 30; G.s.cash = 50000;
    G.act('heistsPick', 'gull');
    const p = G.s.heists.plan;
    G.annalsStart('storm'); G.s.pend = []; G.s.time = 20;
    const cage = [0, 1, 2].find((i) => G.heistFact(i).place === 'casino');
    check(/shut/.test(G.can(`heistsCase${cage}`)) && !open(G, 'casino').length, 'with the pier wrecked, nobody cases the Lucky Gull’s cage');
    for (const f of ['cage', 'staff', 'under']) p.know[f] = 2;
    G.act('heistsSet', { way: 'floor' }); G.act('heistsSet', { ride: 'foot' }); G.act('heistsSelf', 'hands');
    check(/boarded up/.test(G.heistReady()) && G.can('heistsGo'), 'and the counting-room job waits for the pier to be mended');
    G.act('heistsDrop');
    check(/boarded up/.test(G.heistWhy('gull')) && !G.act('heistsPick', 'gull').ok, 'nor can it be planned while the pier is shut');
    G.s.annals.ev.storm.due = G.s.t + 1; G.s.time = 0; turn(G);
    check(!G.s.annals.ev.storm.shut && G.heistWhy('gull') === null, 'once it is mended, the Lucky Gull is worth robbing again');
    // Your patch on the pier pays nothing while there is no pier.
    const Y = fresh();
    Y.s.heists.rival.end = 'yours'; Y.s.heists.rival.patch = true; Y.s.heists.rival.stage = 4;
    const pays = (X) => (X.income().find(([w]) => /patch on the pier/.test(w)) || [0, 0])[1];
    check(pays(Y) > 0, 'the pier is yours, and pays');
    Y.annalsStart('storm'); Y.s.pend = [];
    check(!pays(Y), 'until the storm takes it');
    // The mayor's appeal speaks of the storm this life has seen, not of one in your grandparents' day.
    check(/^The far end/.test(fresh().annalsGiftBlurb('pier') || 'The far end') && /great storm of/.test(Y.annalsGiftBlurb('pier')) && !/grandparents/.test(Y.annalsGiftBlurb('pier')), 'the appeal for the pier speaks of the storm you lived through');
  }

  // ---- an heir's town is the town the last life left ----
  {
    const L = fresh({ seed: 11 });
    L.s.cash = 1e6;
    till(L, 120);
    L.annalsStart('storm'); L.s.pend = [];
    const an = L.s.annals;
    const kid = L.makePerson({ kind: 'child', sex: 'f', age: 40, bond: 70, single: true });
    L.s.people.push(kid);
    L.s.age = 70;
    const was = { mayor: an.mayor.name, penn: an.penn, built: Object.keys(an.built).sort().join(), ev: Object.keys(an.ev).sort().join(), shops: an.shops.map((x) => x.n).join(), bar: an.bar.map((r) => r.n).join(), poll: an.poll - Math.ceil(L.s.t / 4) * 4 };
    L.die('old age');
    const heir = (X, i = 0, o = {}) => {
      const nx = X.chapNextLife(i);
      const H = Life.create({ name: 'Heir', sex: nx.sex || 'f', dreams: [], inherit: nx.inherit, gen: nx.gen, parent: nx.parent, raised: nx.st, gifts: nx.gifts, sibs: nx.sibs || [], seed: 99, ...o });
      H.chapBegin(JSON.parse(JSON.stringify(nx.carry)), []);
      return H;
    };
    const H = heir(L), ha = H.s.annals;
    check(H.chapHow() === 'home' && H.s.age === 40, 'a daughter of forty carries on, at home');
    check(ha.mayor.name === was.mayor && ha.penn === was.penn && Object.keys(ha.built).sort().join() === was.built && Object.keys(ha.ev).sort().join() === was.ev, `and the town is as her mother left it: the same mayor (${ha.mayor.name}), what was built and what happened`);
    check(ha.shops.map((x) => x.n).join() === was.shops && ha.bar.map((r) => r.n).join() === was.bar && ha.poll === was.poll, 'the same shops on the High Street, the same faces at the Gull, and the same polling day');
    check(ha.ev.storm.shut && /shut/.test(H.can('slots', 50)) && ha.ev.storm.t <= 0 && Object.values(ha.ev).every((e) => e.t <= 0), 'the pier still wrecked, by a storm that came before her own story began');
    check(H.folkName('penn') === L.folkName('penn') && H.annalsAge(ha.mayor) >= 18, 'and Mayor Pennington is not back in office, younger than before');
    check(ha.from === -160 && H.annalsLived().length > 0, 'she lived through what the town did while she grew up here');
    check(ha.yr.length > 0 && ha.yr.every((y) => y.a >= 10 && y.a < 40 && y.h && !y.m) && !ha.n.votes && !Object.keys(ha.gave).length, 'her album has the town’s headlines for the years she was here; her votes and gifts are her own');
    H.s.age = 70;
    check(!EV.anFifty.ok(H), 'and nobody tells her she stepped off the train fifty years ago');
    // She plays on in it.
    const H2 = heir(L);
    let ok = true;
    try { till(H2, 40); } catch (e) { ok = false; console.log(e); }
    check(ok && H2.s.annals.yr.some((y) => y.a >= 40 && y.h) && !H2.s.annals.ev.storm.shut, 'and her town goes on: the pier is mended in time, and the headlines carry on');
    // Somebody who left as a child comes back at eighteen, years later: the town has moved on.
    const B = fresh({ seed: 12 });
    till(B, 60);
    B.s.people.push(B.makePerson({ kind: 'child', sex: 'm', age: 10, bond: 70 }));
    B.s.age = 70;
    const bp = B.s.annals.poll, bt = B.s.t;
    B.die('old age');
    const BB = heir(B, 0, { sex: 'm' });
    check(BB.chapHow() === 'back' && BB.s.annals.from === 0 && BB.s.annals.poll === bp - Math.ceil(bt / 4) * 4 - 32 && !BB.s.annals.yr.length, 'one who comes home at eighteen, eight years on, finds the town’s calendar eight years on');
    let ok2 = true;
    try { turn(BB); turn(BB); } catch (e) { ok2 = false; console.log(e); }
    check(ok2 && BB.s.annals.poll > BB.s.t, 'and the next election is put on the calendar');
    BB.s.age = 68;
    check(EV.anFifty.ok(BB) && /came home/.test(EV.anFifty.text(BB)), 'fifty years on, the Gazette knows the train brought him home');
    // The one who died held the chain: the deputy minds the shop for the heir.
    const M = fresh({ seed: 13 });
    till(M, 30);
    M.s.job = { c: 'politics', r: 4, n: 0, perf: 60, raise: 0 }; M.s.f.elected = 1; turn(M);
    check(M.s.annals.mayor.k === 'you', 'a mayor dies in office');
    M.s.age = 60;
    M.s.people.push(M.makePerson({ kind: 'child', sex: 'f', age: 30, bond: 70, single: true }));
    M.die('old age');
    const MM = heir(M);
    check(MM.s.annals.mayor.k !== 'you' && MM.s.annals.mayor.acting && MM.s.annals.plan.every((w) => w.by !== 'you') && (!MM.s.annals.race || !MM.s.annals.race.c.some((c) => c.k === 'you')), 'and the heir’s town has an acting mayor, not the dead one');
    // A distant cousin off the train finds the same town, and it is all before his time.
    const C = fresh({ seed: 14 });
    till(C, 40);
    const cm = C.s.annals.mayor.name;
    C.die('old age');
    const CC = heir(C, 0, { sex: 'm' });
    check(CC.chapHow() === 'train' && CC.s.annals.mayor.name === cm && CC.s.annals.from === 0 && !CC.s.annals.yr.length, 'a cousin off the train finds the town as it was left, and an album of his own to fill');
    // A save made for the next life before the town was carried still begins (with a fresh town).
    const nx = C.chapNextLife(0); delete nx.carry.town;
    const O = Life.create({ name: 'Old', sex: 'm', dreams: [], gen: nx.gen, gifts: nx.gifts, sibs: [], seed: 5 });
    O.chapBegin(nx.carry, []);
    check(O.s.annals.mayor.k === 'penn', 'and an heir from an older save starts with the town as it used to');
  }

  // ---- the drains take down whoever holds the chain, and never you ----
  {
    const L = fresh({ seed: 1 });
    till(L, 44);
    const an = L.s.annals;
    if (an.mayor.k === 'penn') { an.penn = 'out'; an.mayor = { k: 'c99', name: 'Mei Abara', sex: 'f', age: 50, at: L.s.t, job: 'a nurse', plat: 'steady', since: L.s.t, terms: 1 }; }
    L.s.st.smarts = 50; L.s.age = 30;
    check(EV.drains1.when(L), 'the drains are found under whoever is mayor');
    L.queue('drains1');
    check(L.event().text.includes(L.annalsMayorTitle()), `and the ledger names them (${L.annalsMayorTitle()})`);
    L.choose(0);
    L.queue('drains2');
    const e2 = L.event();
    check(EV.drains2.when(L) && /she says/.test(e2.text) && !/Pennington/.test(e2.text), 'the mayor who would like a word is the mayor, and is a she');
    L.choose(1);
    check(an.mayor.k !== 'c99' && an.mayor.acting && L.enemies().some((p) => p.name === 'Mei Abara') && !L.enemies().some((p) => /Pennington/.test(p.name)), 'the Gazette, and she resigns: an acting mayor, and an enemy who is the right person');
    check(EV.drains3.when(L) && /Mei Abara has resigned/.test(EV.drains3.text(L)) && /her family/.test(EV.drains3.text(L)), 'and the vacancy is hers');
    // Not the drains of somebody who has lost the chain since; and never when you hold it.
    const N = fresh({ seed: 2 });
    N.s.st.smarts = 50; N.s.age = 30; N.s.f.drains = 1; N.s.f.drainsM = 'c42';
    check(!EV.drains2.when(N), 'a mayor who is gone by the time it comes out is nobody’s story');
    const Y = fresh({ seed: 2 });
    Y.s.st.smarts = 60; Y.s.age = 30;
    Y.s.job = { c: 'politics', r: 4, n: 0, perf: 60, raise: 0 }; turn(Y);
    check(Y.s.annals.mayor.k === 'you' && !EV.drains1.when(Y), 'and nobody finds the drains under their own chain');
    // Pennington's own drains still make him plain Mr Pennington.
    const P = fresh({ seed: 3 });
    P.s.f.drains = 1; P.queue('drains2'); P.choose(1);
    check(P.folkName('penn') === 'Mr Pennington' && P.s.annals.drained && /Pennington/.test(P.s.annals.drained.n), 'when it is Pennington’s, he goes');
  }

  // ---- Sal is in one place at a time ----
  {
    // Put away at the end of the feud: his back room is shut, his cards stop, and the crew lies low.
    const L = fresh({ seed: 21 });
    const s = L.s, H = s.heists;
    s.n.crimes = 30; s.cash = 5000; s.age = 30; H.sal = 60; H.det.met = 0;
    s.job = { c: 'crew', r: 2, n: 4, perf: 60, raise: 0 }; s.worked.crew = 2;
    H.rival.stage = 2; H.rival.side = 'nan';
    L.queue('carneSitdown');
    L.choose(L.event().opts.findIndex((o) => /Sal will be carrying/.test(o.t)));
    check(L.salWhere() === 'inside' && !s.job && !H.rival.kept, 'Sal goes down, and the crew lies low: no work in it while he is inside');
    for (const id of ['errand', 'deal', 'shark2000', 'shark10000', 'twoc', 'bout0', 'joinCrew']) check(/inside/.test(L.can(id) || ''), `${id}: not while Sal is inside`);
    check(['alibi', 'salDeal', 'gParcel'].every((id) => !EV[id].when(L)), 'and none of his cards come: no alibi, no proposition, no cake');
    s.shark = 5000; s.cash = 6000;
    check(L.act('sharkBack').ok && !s.shark, 'though what you owe him can still be paid');
    L.jail(6); s.pend = []; L.endSeason(); s.pend = [];
    check(s.gaol.mate === 'sal' && !EV.gParcel.when(L), 'and with Sal in the bunk below, no cake comes from him outside');
    // Not the one who put him there: the old chair kept for one who did not.
    const K = fresh({ seed: 22 });
    K.s.n.crimes = 30; K.s.heists.sal = 60; K.s.job = { c: 'crew', r: 3, n: 2, perf: 70, raise: 0 }; K.s.worked.crew = 3;
    K.s.heists.rival.stage = 3; K.s.heists.rival.wars = 1;
    let gone = null;
    for (let i = 0; i < 30 && !gone; i++) { const X = new Life(JSON.parse(JSON.stringify(K.s))); X.s.rng = i * 7 + 3; X.queue('carneWar'); X.choose(X.event().opts.findIndex((o) => o.t === 'Keep your head down')); if (X.s.heists.rival.end === 'sal') gone = X; }
    check(gone && !gone.s.job && gone.s.heists.rival.kept && gone.s.heists.rival.kept.r === 3, 'Sal arrested in the war: the crew lies low, and your chair is kept');
    gone.s.t = gone.s.heists.rival.back; gone.s.pend = [];
    gone.queue('salHome');
    gone.choose(0);
    check(gone.s.job && gone.s.job.c === 'crew' && gone.s.job.r === 3 && gone.salHere(), 'and when he comes home, it is waiting');
    // Retired to Spain, and the Boss of the Bay is you: his errands and his loans are not yours to take; his lads and his fronts are.
    const B = fresh({ seed: 23 });
    B.s.n.crimes = 40; B.s.age = 40; B.s.heists.sal = 30; B.s.f.kingpin = 1;
    B.s.job = { c: 'crew', r: 5, n: 0, perf: 60, raise: 0 }; B.s.worked.crew = 5;
    check(B.salWhere() === 'spain' && B.salYours(), 'Boss of the Bay: Sal is in Spain, and the back room is yours');
    check(/give out the errands/.test(B.can('errand')) && /Spain/.test(B.can('shark2000')) && B.watcher() !== 'Sal', 'no errands for Sal, no loans from him, and nobody called Sal watching your shifts');
    B.act('heistsPick', 'villa');
    check(B.act('heistsLad', 'muscle').ok && !B.heistCuts().some(([w]) => w === 'Sal'), 'your lads are yours to send, and Sal takes no cut from Spain');
    B.s.heists.hot = 50000;
    check(!B.can('heistsWashSal'), 'and the crew’s fronts wash for you');
    B.s.cash = 5000;
    check(['alibi', 'salDeal'].every((id) => !EV[id].when(B)), 'none of Sal’s cards');
    // No feud over Sal's patch with Sal in Spain; one under way ends, with Nan calling on the new boss.
    let arrive = 0;
    for (let i = 0; i < 80; i++) { const X = new Life(JSON.parse(JSON.stringify(B.s))); X.s.rng = i * 13 + 1; X.s.heists.plan = null; X.s.time = 0; X.s.t = 20 + i; X.endSeason(); if (X.s.pend.some((e) => /^carne/.test(e.id))) arrive++; }
    check(!arrive, 'Nan Carne’s lot do not come for Sal’s patch with Sal in Spain');
    const W = new Life(JSON.parse(JSON.stringify(B.s)));
    W.s.heists.plan = null; W.s.heists.rival.stage = 3;
    for (let i = 0; i < 8 && !W.s.pend.some((e) => e.id === 'carneBoss'); i++) { W.s.pend = []; W.s.time = 0; W.endSeason(); }
    check(W.s.pend.some((e) => e.id === 'carneBoss'), 'and if it was under way, Nan calls on the new boss');
    W.s.pend = W.s.pend.filter((e) => e.id === 'carneBoss');
    W.choose(0);
    check(W.s.heists.rival.end === 'truce' && !W.s.log.some((e) => /between Sal and Nan/.test(e.t)), 'and settles it with you, not with Sal');
    // Somebody else has the chair: the feud fizzles quietly, and there is no trophy in that.
    const R = fresh({ seed: 24 });
    R.s.heists.rival.stage = 2; R.s.careers.st.crew = { n: 6, q: 90, at: 0, f: { chair: 'rival' }, mn: null, rv: null, gaz: '', sent: 0, gift: '' };
    for (let i = 0; i < 8 && !R.s.heists.rival.end; i++) { R.s.pend = []; R.s.time = 0; R.endSeason(); }
    check(R.salWhere() === 'spain' && R.s.heists.rival.end === 'spain' && !R.s.ach.heistCarne, 'with Sal in Spain and the chair somebody else’s, Nan Carne’s lot go home');
    // The crew's story: chapters with Sal in them wait while he is inside, and are passed over once he is in Spain.
    const C = fresh({ seed: 25 });
    C.s.n.crimes = 40; C.s.karma = -40; C.s.job = { c: 'crew', r: 3, n: 0, perf: 60, raise: 0 }; C.s.careers.job = { c: 'crew', r: 3 };
    C.careerNext(true); C.s.pend = [];
    C.s.heists.rival.end = 'sal'; C.s.heists.rival.back = C.s.t + 10;
    check(!C.careerNext(true), 'no chapter with Sal in it while he is inside');
    C.s.heists.rival.back = null; C.s.f.kingpin = 1; C.s.job.r = 5;
    check(C.careerNext(true) && C.s.careers.st.crew.n === 5 && /from Spain/.test(C.event().text), 'and once he is in Spain the story goes straight to its last chapter');
  }

  // ---- the politics story keeps to the election calendar ----
  {
    const ch = STORIES.politics.ch, folder = ch.findIndex((c) => c.title === 'The folder'), four = ch.findIndex((c) => c.title === 'Four days to go');
    const L = fresh({ seed: 3 });
    till(L, 21);
    L.s.job = { c: 'politics', r: 3, n: 10, perf: 60, raise: 0 }; L.s.worked.politics = 3;
    L.careerNext(true); L.s.pend = [];
    L.careerStory('politics').n = four;
    check(!L.annalsRace() && !L.careerNext(true), 'four days before polling does not come the season after an election');
    L.careerStory('politics').n = folder;
    check(!L.careerNext(true), 'nor does choosing the candidate');
    let seen = 0;
    for (let i = 0; i < 20 && seen < 2; i++) {
      const j = L.s.job; L.s.job = null; L.s.time = 0; L.endSeason(); L.s.pend = []; L.s.job = j;
      const n = L.careerStory('politics').n;
      if (L.careerNext(true)) {
        const r = L.annalsRace();
        if (n === folder) { check(r && L.annalsNoms(), 'the party chooses its candidate while nominations are open'); L.choose(0); L.careerStory('politics').n = four; seen++; } else { check(r && L.s.t === L.s.annals.poll, 'and the scandal breaks four days before polling'); seen++; L.s.pend = []; }
      }
    }
    check(seen === 2, 'both come, at election time');
  }
}
