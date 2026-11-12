// The people of the town: friendship, chats and presents, their stories,
// the favours they ask, what they give back, and how it all fits the
// stories already told (old Marlow, Mrs Pargeter, Betty’s café, the mayor).
import { FOLK, FOLK_IDS, GOODS, STORIES, FAVOURS, KEEPSAKES, BOONS, CORNERS } from '../../games/new-in-town/js/folk.js';
import { PLACES, CURIOS, TROPHIES, CROPS } from '../../games/new-in-town/js/data.js';
import { EVENTS } from '../../games/new-in-town/js/events.js';

const clone = (Life, L) => new Life(JSON.parse(JSON.stringify(L.s)));
// The next season, with no chance cards in the way.
const turn = (L) => { L.endSeason(); L.s.pend = []; };

export default function ({ check, fresh, Life }) {
  const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

  // ---- the lists hang together ------------------------------------------------------------
  check(FOLK_IDS.length >= 12, 'a dozen or so townsfolk');
  check(!FOLK_IDS.includes('sal') && !FOLK_IDS.includes('hobbs'), 'Sal and Mr Hobbs are left to their own stories');
  for (const id of FOLK_IDS) {
    const k = FOLK[id], st = STORIES[id];
    check(PLACES[k.place] && k.name && k.call && k.Call && k.blurb && ['m', 'f'].includes(k.sex), `${id}: a real person at a real place`);
    check(CORNERS[k.corner], `${id}: belongs to a corner of town`);
    check(k.up.length === 4 && k.up.every(Boolean), `${id}: is up to something every season`);
    if (id !== 'marlow') check(k.meet && k.lines.length === 3 && k.lines.every((l) => l.length >= 3) && k.seasons.length === 4, `${id}: has things to say, to a stranger and to a friend, in every season`);
    for (const r of ['love', 'like', 'hate']) for (const g of k.gifts[r]) check(GOODS[g] || g === 'cur' || (g.startsWith('cur:') && Object.values(CURIOS).some((c) => c.set === g.slice(4))), `${id}: ${r}s something that can be given (${g})`);
    check(k.gifts.love.length >= 2 && k.gifts.hate.length >= 1, `${id}: loves some things and cannot abide others`);
    const all = [...k.gifts.love, ...k.gifts.like, ...k.gifts.hate];
    check(new Set(all).size === all.length, `${id}: does not both love and hate a thing`);
    check(st && st.length === 5, `${id}: a story in five chapters`);
    let need = 0;
    st.forEach((c, i) => {
      check(c.title && c.said, `${id}: chapter ${i + 1} has a title and a summary`);
      if (c.flag) return;
      check(c.need > need, `${id}: chapter ${i + 1} asks more friendship than the last`);
      need = c.need;
      const e = EV[`fk_${id}${i + 1}`];
      check(e && e.w === 0 && e.opts.length >= 1 && e.opts.every((o) => o.t && o.run), `${id}: chapter ${i + 1} is a card, dealt only by the rules`);
    });
  }
  check(STORIES.marlow.slice(0, 3).every((c) => c.flag) && STORIES.parg.slice(0, 3).every((c) => c.flag), 'Marlow’s and Mrs Pargeter’s first chapters are the stories already told');
  for (const [fid, F] of Object.entries(FAVOURS)) {
    check(FOLK[F.who], `favour ${fid}: for somebody real`);
    check(F.goal ? !F.at : !!PLACES[F.at], `favour ${fid}: done somewhere real`);
    check(!F.at || F.at !== FOLK[F.who].place || fid === 'trip', `favour ${fid}: takes you somewhere other than their own door (Marlow’s takes you out to sea)`);
    check(typeof F.done === 'function' && F.set && F.gain > 0, `favour ${fid}: has a reward`);
  }
  for (const [b, B] of Object.entries(BOONS)) check(FOLK[B.who] && B.at >= 1 && B.at <= 5 && B.name && B.said, `boon ${b}: from somebody, at a chapter`);
  for (const [k, K] of Object.entries(KEEPSAKES)) check(FOLK[K.from] && K.name && K.icon, `keepsake ${k}: from somebody`);
  for (const t of ['folkStory', 'folkFavours', 'folkCorners', 'folkLoves']) check(TROPHIES[t], `trophy ${t} is there`);
  for (const [g, G] of Object.entries(GOODS)) check(G.own ? !G.cost : G.cost > 0 && G.cost <= 40, `${g}: bought cheaply, or one of your own`);

  // ---- meeting people -----------------------------------------------------------------------
  {
    const L = fresh(), s = L.s;
    check(s.folk && FOLK_IDS.every((id) => s.folk.p[id] && s.folk.p[id].met == null && s.folk.p[id].f === 0), 'a new life knows nobody yet');
    const church = L.placeActions('church').map((a) => a.id);
    check(church.includes('fkChat_hollis') && !church.includes('fkSee_hollis'), 'the vicar can be met at the church');
    check(!L.placeActions('park').some((a) => a.id === 'fkChat_parg'), 'Mrs Pargeter is not met by knocking: she finds you, at the allotments');
    check(!L.placeActions('harbour').some((a) => a.id.startsWith('fkChat')), 'old Marlow keeps his own chat on the quay');
    check(L.can('folkGive', { w: 'hollis', g: 'flowers' }), 'no presents for strangers');
    const t = s.time, r = L.act('fkChat_hollis');
    check(r.ok && s.time === t - 1 && s.folk.p.hollis.met === s.t && s.folk.p.hollis.f === 6, 'introducing yourself takes a block of time and makes a start');
    check(L.placeActions('church').some((a) => a.id === 'fkSee_hollis'), 'and then she has a row of her own at the church');
    check(!L.act('fkChat_hollis').ok, 'one chat a season');
    check(L.folkNext('hollis') === null, 'and nobody tells you their story on the first day');
    // A slow friendship: a chat every season for two years is not enough to know somebody well.
    for (let i = 0; i < 8; i++) { turn(L); L.act('fkChat_hollis'); answerNo(L); }
    const f = s.folk.p.hollis.f;
    check(f > 20 && f < 45, `two years of chats make a friendly acquaintance, not a friend (${f.toFixed(1)})`);
    check(L.s.log.some((e) => e.t.includes('Met The Reverend Hollis')), 'the journal remembers meeting her');
  }

  // ---- presents -----------------------------------------------------------------------------
  {
    const L = fresh(), s = L.s;
    L.act('fkChat_hollis');
    const p = s.folk.p.hollis, cash = s.cash + s.bank, f0 = p.f;
    let r = L.act('folkGive', { w: 'hollis', g: 'flowers' });
    check(r.ok && s.cash + s.bank === cash - 25 && p.f > f0 + 7 && p.known.flowers === 'love', 'a bunch of flowers for the vicar: paid for, loved, and now you know');
    check(r.text.includes('Now you know'), 'and you are told what you have learnt');
    check(!L.act('folkGive', { w: 'hollis', g: 'shortbread' }).ok, 'one present a season each');
    turn(L);
    s.cash = 2000;
    const f1 = p.f;
    r = L.act('folkGive', { w: 'hollis', g: 'rum' });
    check(r.ok && p.f < f1 && p.known.rum === 'hate', 'rum for the vicar goes down badly');
    turn(L);
    const a = p.f; L.act('folkGive', { w: 'hollis', g: 'shortbread' }); const first = p.f - a;
    turn(L);
    const b = p.f; L.act('folkGive', { w: 'hollis', g: 'shortbread' }); const second = p.f - b;
    check(first > 5 && second < first * 0.6, 'the same present twice running counts for less');
    turn(L);
    for (const g of ['fish', 'veg', 'honey', 'painting', 'marrow', 'c:bell']) check(L.can('folkGive', { w: 'hollis', g }), `cannot give what you have not got (${g})`);
    for (const x of [null, { w: 'nobody', g: 'flowers' }, { w: 'hollis', g: 'gold' }, { w: 'hollis', g: 'c:nothing' }, { w: 'hollis' }]) check(L.can('folkGive', x), `a muddled present is refused (${JSON.stringify(x)})`);
    // Things of your own.
    L.act('fkChat_desmond'); L.act('fkChat_quinn');
    s.paintings = 1;
    const d0 = s.folk.p.desmond.f;
    r = L.act('folkGive', { w: 'desmond', g: 'painting' });
    check(r.ok && s.paintings === 0 && s.folk.p.desmond.f - d0 > 10, 'a painting for Desmond: gone from your stack, and worth more than flowers');
    s.curios.bell = 1;
    r = L.act('folkGive', { w: 'quinn', g: 'c:bell' });
    check(r.ok && !s.curios.bell && s.folk.p.quinn.known['cur:sea'] === 'love', 'a ship’s bell for Captain Quinn: a maritime piece, loved');
    turn(L);
    check(L.folkGifts('quinn').some((g) => g.g === 'fish' && g.known === null) === false, 'fish are not on offer until you have caught some');
    s.items.rod = 1;
    let tries = 0;
    while (L.folkFish() === 0 && tries++ < 30) { s.time = 6; L.act('fish', 2); }
    check(L.folkFish() >= 1, 'a fish you catch can be kept back for somebody');
    const kept = L.folkFish();
    r = L.act('folkGive', { w: 'quinn', g: 'fish' });
    check(r.ok && L.folkFish() === kept - 1 && s.folk.p.quinn.known.fish === 'like', 'and given');
    s.folk.bag.fish = 3;
    turn(L);
    check(L.folkFish() === 0, 'fish do not keep to the next season');
    // Vegetables from the plot.
    L.act('plotRent');
    s.plot.beds[0] = { c: 'toms', age: 1, care: 2 };
    s.time = 6; L.act('reap');
    check(L.folkVeg() && L.folkVeg().c === 'toms', 'what you bring in from the allotment goes in the basket');
    turn(L); turn(L);
    check(!L.folkVeg(), 'and goes over after a season or so');
  }

  // ---- stories and favours ------------------------------------------------------------------
  {
    const L = fresh(), s = L.s, p = s.folk.p.hollis;
    L.act('fkChat_hollis');
    turn(L);
    p.f = 12;
    let r = L.act('fkChat_hollis');
    check(r.ok && L.event() && L.event().id === 'fk_hollis1', 'a friend of long enough standing tells you the next chapter when you call');
    check(L.event().opts.length === 2, 'and you may take the favour on or not');
    L.choose(0);
    check(L.folkFav('hollis') && L.folkFav('hollis').id === 'tin' && L.folkFavours().length === 1, 'the favour goes on your list');
    check(L.placeActions('highstreet').some((a) => a.id === 'fv_tin' && !a.why), 'and is done on the High Street');
    check(!L.placeActions('church').some((a) => a.id === 'fv_tin'), 'not at her own door');
    check(L.folkNext('hollis') === null, 'nobody asks a second favour before the first is done');
    const done = s.folk.done;
    r = L.act('fv_tin');
    check(r.ok && p.stage === 1 && s.folk.done === done + 1 && !L.folkFav('hollis'), 'done: the chapter closes');
    check(!L.placeActions('highstreet').some((a) => a.id === 'fv_tin') && !L.act('fv_tin').ok, 'and it cannot be done twice');
    check(s.log.some((e) => e.t.startsWith('Did a favour for The Reverend Hollis')), 'the journal remembers it');
    // Saying no: she asks again, but not for a while.
    p.f = 30; p.at = s.t - 5;
    L.queue(L.folkNext('hollis'));
    L.choose(L.event().opts.length - 1);
    check(!L.folkFav('hollis') && p.off === s.t + 4 && L.folkNext('hollis') === null, 'turned down, she does not ask again for a year');
    for (let i = 0; i < 4; i++) turn(L);
    p.f = 30;
    check(L.folkNext('hollis') === 'fk_hollis2', 'and then she does');
    // A favour left too long.
    L.queue('fk_hollis2'); L.choose(0);
    check(L.folkFav('hollis').due === s.t + 2, 'the swarm must be fetched within two seasons');
    const f = p.f, failed = s.folk.failed;
    turn(L);
    check(L.folkFav('hollis'), 'one season on, it can still be done');
    turn(L);
    check(!L.folkFav('hollis') && s.folk.failed === failed + 1 && p.f < f - 5 && p.stage === 1 && p.off === s.t + 3, 'two seasons on, she has given up on you: the chapter is still to come, and further off');
    check(s.log.some((e) => e.t.startsWith('Let The Reverend Hollis down')), 'and the journal says so');
    // A card whose moment has passed is not shown.
    L.queue('fk_hollis1');
    check(L.event() === null, 'a chapter already told is not told again');
    // Some chapters can be settled with money instead of a favour, if you have it.
    const M = fresh();
    M.act('fkChat_hollis');
    Object.assign(M.s.folk.p.hollis, { f: 50, stage: 2, at: M.s.t - 5 });
    M.s.cash = 1000; M.s.bank = 0;
    M.queue('fk_hollis3');
    check(M.event().opts[0].why, 'no cheque for the roof without the money');
    M.s.cash = 3000;
    const given = M.s.n.given || 0;
    M.choose(0);
    check(M.s.folk.p.hollis.stage === 3 && M.s.cash === 1500 && M.s.n.given === given + 1500 && M.s.folk.p.achterberg.met != null, 'with it, the roof is saved, and you meet the librarian over it');
  }

  // ---- every story can be told to the end ---------------------------------------------------
  const used = new Set();
  let gained = 0;
  const satisfy = (L, fid) => {
    const s = L.s;
    ({
      stacks: () => { s.folk.read += 3; }, crew: () => { s.st.fitness = Math.max(s.st.fitness, 45); },
      fishpie: () => { s.folk.bag.fish = 2; s.folk.bag.fishT = s.t; }, picture: () => { s.paintings = 1; },
      peas: () => { s.grown.peas = (s.grown.peas || 0) + 1; s.folk.grown.peas = s.grown.peas; }, spuds: () => { s.grown.spuds = (s.grown.spuds || 0) + 1; s.folk.grown.spuds = s.grown.spuds; },
      veg: () => { s.folk.bag.veg = { c: 'leeks', n: 1, t: s.t }; }, appeal: () => { s.n.given = (s.n.given || 0) + 1000; },
    }[fid] || (() => {}))();
  };
  // Picks a choice that moves the story on: a favour if there is one (to try them all).
  const onward = (L) => {
    const ev = L.event(), ok = [];
    for (let i = 0; i < ev.opts.length; i++) {
      if (ev.opts[i].why) continue;
      const T = clone(L.constructor, L), who = ev.id.replace(/^fk_/, '').replace(/\d$/, ''), st = T.folk(who).stage;
      T.choose(i);
      if (T.folkFav(who)) return L.choose(i);
      if (T.folk(who).stage > st) ok.push(i);
    }
    return L.choose(ok.length ? ok[0] : 0);
  };
  function tellAll(L, id) {
    const s = L.s, p = L.folk(id);
    for (let guard = 0; guard < 30 && p.stage < 5; guard++) {
      if (p.met == null && id !== 'marlow' && id !== 'parg') L.folkIntro(id);
      s.cash = 1e6; s.time = 9; s.use = {}; s.wx = 'fair'; p.f = 100; p.at = s.t - 4; p.off = 0;
      if (id === 'marlow' && p.stage < 3) { s.f.marlow = p.stage + 1; L.folkSync(); continue; }
      if (id === 'parg' && p.stage < 3) { s.f.parg = p.stage + 1; L.folkSync(); continue; }
      const card = L.folkNext(id);
      if (!card) return `chapter ${p.stage + 1} would not come`;
      const c0 = s.cash + s.bank;
      L.queue(card);
      onward(L);
      while (L.event()) L.choose(0);
      const fav = L.folkFav(id);
      if (fav) {
        used.add(fav.id);
        satisfy(L, fav.id);
        const r = L.act(`fv_${fav.id}`);
        if (!r.ok) return `favour ${fav.id}: ${r.why}`;
        while (L.event()) L.choose(0);
      }
      gained += Math.max(0, s.cash + s.bank - c0);
      turn(L);
    }
    return p.stage === 5 ? null : 'it never ended';
  }
  {
    const L = fresh(), s = L.s;
    s.items.rod = 1; s.items.easel = 1;
    L.act('plotRent');
    for (const id of FOLK_IDS) {
      const why = tellAll(L, id);
      check(!why, `${id}: the whole story can be told${why ? ` (${why})` : ''}`);
    }
    for (const fid of Object.keys(FAVOURS)) check(used.has(fid), `favour ${fid} is asked by somebody`);
    check(Object.keys(KEEPSAKES).every((k) => s.folk.keep[k] != null || ['cafebell', 'spanner'].includes(k)), 'every story leaves a keepsake');
    check(s.ach.folkStory && s.ach.folkFavours, 'trophies for a whole story, and for ten favours');
    check(s.log.filter((e) => e.k === 'big' && e.t.startsWith('Heard the whole of')).length === FOLK_IDS.length, 'each ending is a milestone in the journal');
    for (const b of Object.keys(BOONS)) if (b !== 'pilot') check(L.folkHas(b) || ['lake'].includes(b), `boon ${b} is had at the end`);
    check(L.folkHas('lake') === !!s.items.rod, 'the lake wants a rod');
    check(gained > 0 && gained < 5000, `all those stories pay little in cash (${gained})`);
    check(s.plot.beds.length === 4, 'Mrs Pargeter’s strip of plot 9 is a fourth bed');
    check(s.biz && s.biz.type === 'food' && s.biz.lvl === 1, 'you can take on Betty’s Café');
    check(s.items.car, 'Jess sees you right for a car');
    // What it all lasts as.
    check(L.income().some(([w, n]) => w.includes('bottom field') && n === 350), 'Tom pays rent on the bottom field');
    const W = clone(Life, L);
    W.s.folk.p.windle.stage = 4;
    check(L.netWorth() - W.netWorth() >= 30000, 'and the field is worth something');
    const bills = (X) => Object.fromEntries(X.bills());
    const N = clone(Life, L);
    N.s.folk.p.betty.f = 10; N.s.folk.p.jess.f = 10;
    check(bills(N)['Food and bills'] - bills(L)['Food and bills'] === 120 && bills(N)['Running the car'] - bills(L)['Running the car'] === 120, 'Betty feeds you for less, and Jess keeps the car going for less, while you keep in touch');
    check(L.placeActions('farm').some((a) => a.id === 'fkLake') && L.placeActions('cove').some((a) => a.id === 'fkDrill') && L.placeActions('theatre').some((a) => a.id === 'fkRehearse'), 'a lake to fish, a lifeboat to go out in and a play to rehearse');
    for (const [id, place] of [['fkLake', 'farm'], ['fkDrill', 'cove'], ['fkRehearse', 'theatre']]) {
      s.time = 6; s.use = {};
      check(L.act(id).ok && !L.act(id).ok, `${id}: once a season, at ${place}`);
    }
    // Twins, one with the boons and one without, to see each tell.
    const pair = (setup, act, x) => { const A = clone(Life, L), B = clone(Life, L); for (const id of FOLK_IDS) B.s.folk.p[id].stage = 0; setup(A); setup(B); const a0 = A.s.cash + A.s.bank, b0 = B.s.cash + B.s.bank; A.act(act, x); B.act(act, x); return { A, B, da: A.s.cash + A.s.bank - a0, db: B.s.cash + B.s.bank - b0 }; };
    let t = pair((X) => { X.s.happy = 50; X.s.time = 6; X.s.use = {}; }, 'pew');
    check(t.A.s.happy - t.B.s.happy >= 2.9, 'your pew at St Brigid’s does you more good');
    t = pair((X) => { X.s.time = 6; X.s.use = {}; }, 'watchRovers');
    check(t.da === 0 && t.db === -15, 'a season ticket for the Rovers');
    t = pair((X) => { X.s.time = 6; X.s.use = {}; X.s.happy = 50; }, 'browseMarket');
    check(t.A.s.happy - t.B.s.happy >= 1.9, 'the fountain lifts a walk round the market');
    t = pair((X) => { X.s.time = 6; X.s.health = 50; X.s.happy = 50; X.s.home = 'bedsit'; }, 'cook');
    check(t.A.s.health > t.B.s.health && t.A.s.happy > t.B.s.happy, 'Betty’s recipes make a better dinner');
    t = pair((X) => { X.s.time = 6; X.s.items.laptop = 1; X.s.novel = { p: 2, q: 100 }; }, 'novel');
    check(Math.abs(t.A.s.novel.q - t.B.s.novel.q - 40) < 1e-6, 'Miss Achterberg’s red pencil');
    let fishy = 0;
    for (let i = 0; i < 12 && !fishy; i++) {
      t = pair((X) => { X.s.time = 6; X.s.rng = 1000 + i; }, 'fish', 1);
      if (t.A.s.n.fish > L.s.n.fish) fishy = t.da - t.db;
    }
    check(fishy === 40, 'Marlow’s marks: a fish fetches $40 more');
    t = pair((X) => { X.s.plot.beds = [{ c: 'leeks', age: 2, care: 4 }, null, null, null]; X.s.time = 6; }, 'reap');
    check(t.da - t.db === Math.round(CROPS.leeks.pay * 0.25 / 10) * 10, 'Priya sells the best of your crop on her stall');
    const G = clone(Life, L);
    G.s.plot.beds = [{ c: 'leeks', age: 0, care: 0 }, null, null, null]; G.s.wx = 'fair';
    G.endSeason();
    check(G.s.plot.beds[0].care === 1, 'her greenhouse looks after your beds');
    // Mr Pym’s window, a tenth off, and a fair price.
    const P = clone(Life, L), Q = clone(Life, L);
    Q.s.folk.p.pym.stage = 0;
    P.endSeason(); Q.endSeason();
    check(P.s.cur.stock.every((c, i) => c.ask === Math.round(Q.s.cur.stock[i].ask * 0.9 / 10) * 10), 'Mr Pym knocks a tenth off his window for a friend');
    check(Object.keys(P.s.cur.bid).every((k) => Math.abs(P.s.cur.bid[k] - Q.s.cur.bid[k] - 0.1) < 0.011), 'and pays a fair price');
    // The mayor’s freedom, and good friends, lift the mood a little; no more.
    const M = clone(Life, L);
    for (const id of FOLK_IDS) M.s.folk.p[id] = { ...M.s.folk.p[id], f: 0, stage: 0 };
    check(L.moodBase() - M.moodBase() === 4, 'a town full of friends is worth a little happiness, not a lot');
    // Honey at the end of summer, and the pilot on loan.
    const H = clone(Life, L);
    H.s.t = H.s.t - (H.s.t % 4) + 1; H.s.folk.bag.honey = 0; H.s.folk.book = 2;
    const sm = H.s.st.smarts;
    H.endSeason();
    check(H.s.folk.bag.honey === 2 && H.s.st.smarts > sm && H.s.folk.book === 1, 'two jars of honey at the end of summer, and a little Smarts from the Admiralty pilot');
    // A fresh plot, and the strip of plot 9 comes back with it.
    const R = clone(Life, L);
    R.act('plotQuit'); R.act('plotRent');
    check(R.s.plot.beds.length === 4, 'the fourth bed comes with any plot you take');
  }

  // ---- friendship fades, but slowly, and not below what a story has made of it ----------------
  {
    const L = fresh(), s = L.s;
    L.act('fkChat_gaz');
    const p = s.folk.p.gaz;
    p.f = 40;
    turn(L);
    check(p.f === 40, 'a season away is nothing');
    for (let i = 0; i < 6; i++) turn(L);
    check(p.f < 40 && p.f >= 33, `half a dozen seasons away and the friendship cools a little (${p.f})`);
    p.stage = 5; p.f = 31;
    for (let i = 0; i < 12; i++) turn(L);
    check(p.f === 30, 'but a story told to the end is not forgotten');
    s.time = 6; L.act('fkChat_gaz');
    turn(L); turn(L);
    check(p.f > 30, 'calling again stops the rot');
  }

  // ---- the stories already told -------------------------------------------------------------
  {
    const L = fresh(), s = L.s;
    // Old Marlow: his chat on the quay is a call.
    let r = L.act('marlow');
    check(r.ok && L.event() && L.event().id === 'marlow1' && s.folk.p.marlow.met === s.t && s.folk.p.marlow.f > 0, 'chatting with old Marlow on the quay is how you get to know him');
    L.choose(0);
    s.f.marlow = 1; L.folkSync();
    check(s.folk.p.marlow.stage === 1, 'his nets are the first chapter');
    check(L.placeActions('harbour').some((a) => a.id === 'fkSee_marlow'), 'and he has a row of his own on the quay');
    s.f.marlow = 3; L.folkSync();
    check(s.folk.p.marlow.stage === 3 && s.folk.p.marlow.f >= 40, 'the Peggy Sue is the third, and you know him well by then');
    // Mrs Pargeter: parg1 is how you meet her; parg3 makes her a friend, who is one of the townsfolk.
    s.plot = { beds: [{ c: 'toms', age: 0, care: 0 }, null, null], since: s.t };
    L.queue('parg1');
    L.choose(1); // (asking her if she has lost something)
    check(s.f.parg === -1 && s.folk.p.parg.met === s.t && s.folk.p.parg.stage === 0, 'meeting Mrs Pargeter badly is still meeting her');
    check(L.placeActions('park').some((a) => a.id === 'fkChat_parg'), 'and she can be called on at the allotments');
    s.folk.p.parg.f = 30; s.folk.p.parg.at = s.t - 3;
    check(L.folkNext('parg') === 'fk_parg0', 'she gives you a second chance, in time');
    L.queue('fk_parg0'); L.choose(0);
    check(s.f.parg === 1 && s.folk.p.parg.stage === 1, 'and her own story picks up again');
    check(EV.parg2.when(L), 'the greenhouse can happen now');
    L.queue('parg2'); L.choose(0);
    s.plot.since = s.t - 9;
    L.queue('parg3'); L.choose(0);
    const edna = s.people.find((p) => p.name === 'Edna Pargeter');
    check(s.f.parg === 3 && s.folk.p.parg.stage === 3 && edna && edna.kind === 'friend' && s.folk.p.parg.f >= 45 && edna.bond === s.folk.p.parg.f, 'the seed tin makes her a friend, and her friendship is one and the same');
    s.time = 6; s.use = {}; s.cash = 1000;
    L.act('out', { p: edna.id, a: 'coffee' });
    check(s.folk.p.parg.f === edna.bond && edna.bond > 45, 'a coffee with Edna counts with Mrs Pargeter');
    const fb = s.folk.p.parg.f;
    s.folk.p.parg.seen = s.t;
    turn(L);
    s.time = 6; L.act('rest');
    check(edna.bond === s.folk.p.parg.f && s.folk.p.parg.f === fb, 'and she does not drift off like other friends while you call on her');
    // Betty’s café.
    const B = fresh();
    B.s.eco = -1; B.queue('cafe'); B.choose(2);
    check(B.folkPlace('betty') === 'church' && B.placeActions('church').some((a) => a.id === 'fkChat_betty') && !B.placeActions('highstreet').some((a) => a.id === 'fkChat_betty'), 'if nobody saves the café, Betty does the teas at the church hall');
    const C = fresh();
    C.s.cash = 5000; C.s.eco = -1; C.queue('cafe'); C.choose(0);
    check(C.s.folk.p.betty.stage === 1 && C.s.folk.p.betty.f >= 30 && C.folkPlace('betty') === 'highstreet', 'if you saved it, Betty knows you already');
    // The mayor, after the drains.
    const D = fresh();
    D.s.f.drains = 1; D.queue('drains2'); D.choose(1);
    check(D.folkName('penn') === 'Mr Pennington' && D.folkShut('penn') && D.can('fkChat_penn'), 'after the drains, Mr Pennington is no longer mayor, and not speaking to you');
    D.s.people = D.s.people.filter((p) => p.name !== 'Mayor Pennington');
    check(!D.can('fkChat_penn'), 'until the grudge is over');
    // Mr Pym, after the tea caddy.
    const E = fresh();
    E.s.f.pymOff = E.s.t + 3;
    check(E.can('fkChat_pym') && E.folkShut('pym'), 'Mr Pym will not see you while he remembers the tea caddy');
  }

  // ---- the townsfolk in the rest of your life -----------------------------------------------
  {
    const L = fresh(), s = L.s;
    for (const id of ['fk_visit', 'fk_lane', 'fk_lights', 'fk_cell']) check(EV[id] && EV[id].w > 0, `${id}: a chance card`);
    s.ill = { name: 'a cold', sev: 1 }; s.wx = 'wet'; s.cash = 5000;
    check(!EV.fk_visit.when(L) && !EV.fk_lane.when(L) && !EV.fk_lights.when(L), 'nobody calls on a stranger');
    L.act('fkChat_betty'); s.folk.p.betty.f = 50;
    check(EV.fk_visit.when(L) && EV.fk_visit.ctx(L) === 'betty', 'a friend hears you are poorly');
    L.queue('fk_visit', 'betty');
    check(L.event().text.includes('soup'), 'and Betty brings soup');
    const hp = s.health, f = s.folk.p.betty.f;
    L.choose(0);
    check(s.health > hp && s.folk.p.betty.f > f, 'letting her in does you good, and her');
    L.act('fkChat_windle'); s.folk.p.windle.f = 30;
    check(EV.fk_lane.when(L), 'in a wet season Tom’s sheep need help');
    L.queue('fk_lane'); L.choose(1);
    check(s.folk.p.windle.f < 30, 'staying dry is noticed');
    L.act('fkChat_gaz'); s.folk.p.gaz.f = 30;
    const cash = s.cash + s.bank, given = s.n.given || 0;
    L.queue('fk_lights'); L.choose(0);
    check(s.cash + s.bank === cash - 500 && s.n.given === given + 500, 'keeping the Rovers’ lights on is giving to the town');
    s.gaol = { left: 2, total: 2, served: 0, good: 50, rep: 20 };
    check(EV.fk_cell.when(L), 'a friend visits you inside');
    L.queue('fk_cell', 'betty');
    const joy = s.happy;
    check(L.event() && L.event().id === 'fk_cell', 'at visiting hour');
    L.choose(0);
    check(s.happy > joy, 'and it lifts you');
  }

  // ---- prison, and old saves ----------------------------------------------------------------
  {
    const L = fresh(), s = L.s;
    L.act('fkChat_jess');
    s.folk.p.jess.f = 50; s.folk.p.jess.at = s.t - 5;
    L.queue('fk_jess1');
    s.gaol = { left: 2, total: 2, served: 0, good: 50, rep: 20 };
    check(L.event() === null, 'a chapter is not told in a cell');
    check(!L.act('fkChat_jess').ok && !!L.can('folkGive', { w: 'jess', g: 'tea' }), 'and nobody calls on anybody from Starling Gaol');
  }
  {
    const L = fresh(), s = L.s;
    L.act('fkChat_betty');
    s.folk.p.betty.f = 20; s.folk.p.betty.at = s.t - 3;
    turn(L);
    const keep = JSON.stringify(s);
    // A life saved before the townsfolk existed, with the old stories well along.
    const old = JSON.parse(keep);
    delete old.folk;
    Object.assign(old.f, { marlow: 3, parg: 3, cafe: 1 });
    old.items.boat = 1;
    old.people.push({ id: 99, name: 'Edna Pargeter', sex: 'f', kind: 'friend', bond: 52, age: 78, trait: 'kind', look: { skin: 0, hair: 0, top: 0, style: 0, beard: false }, single: false, job: 'teaching', likes: ['coffee', 'walk'], known: {}, wish: false });
    const O = new Life(old);
    check(O.s.folk && FOLK_IDS.every((id) => O.s.folk.p[id]), 'an old save gets the townsfolk');
    check(O.s.folk.p.marlow.stage === 3 && O.s.folk.p.parg.stage === 3 && O.s.folk.p.parg.f >= 52 && O.s.folk.p.parg.pid === 99 && O.s.folk.p.betty.stage === 1, 'with what was done before counted');
    check(O.folkNext('marlow') === null && O.folkNext('parg') === null, 'and nothing hurried');
    turn(O);
    O.s.time = 6;
    check(O.act('fkChat_betty').ok && O.act('marlow').ok, 'and it plays on');
    // The same save, reopened, is the same.
    const S = new Life(JSON.parse(keep));
    check(JSON.stringify(S.s) === keep, 'a saved life opens exactly as it was');
  }

  // ---- nothing for nothing ------------------------------------------------------------------
  {
    const L = fresh(), s = L.s;
    for (const id of FOLK_IDS) if (id !== 'marlow' && id !== 'parg') { s.time = 6; L.act(`fkChat_${id}`); }
    const st = { ...s.st }, happy = s.happy, cash = s.cash + s.bank;
    // A season spent chatting to everybody: no skill jumps, no money.
    turn(L);
    s.time = 8;
    for (const id of FOLK_IDS) if (id !== 'marlow' && id !== 'parg') L.act(`fkChat_${id}`);
    check(s.st.charm - st.charm < 6 && s.cash + s.bank <= cash, 'chatting is pleasant, not profitable');
    check(happy <= 100, 'still sane');
    // Presents cost what they give.
    s.cash = 10;
    s.bank = 0;
    check(L.can('folkGive', { w: 'hollis', g: 'rum' }), 'no rum without the money for it');
    // No favour, no deed.
    for (const fid of Object.keys(FAVOURS)) check(!L.act(`fv_${fid}`).ok, `${fid}: not done until somebody asks`);
  }
}

// Answers whatever cards are up with the last choice (no, thank you).
function answerNo(L) { let ev, n = 0; while ((ev = L.event()) && n++ < 10) L.choose(ev.opts.length - 1); }

// For the random players: a present now and then, for somebody they know.
export function moves(L) {
  const met = FOLK_IDS.filter((id) => L.folk(id).met != null);
  if (!met.length) return [];
  const w = met[L.s.t % met.length], goods = Object.keys(GOODS), c = Object.keys(L.s.curios)[0];
  // (One present on offer at a time, something different each season; now and then a curio.)
  return [['folkGive', { w, g: c && L.s.t % 7 === 3 ? `c:${c}` : goods[(L.s.t * 5) % goods.length] }]];
}

