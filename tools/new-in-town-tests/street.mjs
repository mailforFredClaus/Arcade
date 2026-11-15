// Where you live (street.js): a house that ages and goes wrong, builders and landlords,
// building work, a garden that grows, the neighbours and their stories, and having people
// round with a seating plan (street-games.js keeps the plan's rules; street-lib.js solves it).
import { TROPHIES, HOMES } from '../../games/new-in-town/js/data.js';
import { FAULTS, STREETS, ROLES, MENUS, NB_FIRST, NB_LAST, tableRules, bestTable, ruleKept } from '../../games/new-in-town/js/street-lib.js';
import { TALES, TALE_CARDS } from '../../games/new-in-town/js/street-tales.js';
import { HOUSE_CARDS } from '../../games/new-in-town/js/street-cards.js';
import { FOLK } from '../../games/new-in-town/js/folk-cast.js';
import { NAMES_M, NAMES_F, SURNAMES } from '../../games/new-in-town/js/data.js';

export default function ({ check, fresh, Life }) {
  const clean = (t) => typeof t === 'string' && t.length > 0 && !/undefined|NaN|\[object|\s\s|null/.test(t);
  const reset = (L) => { L.s.use = {}; L.s.time = L.timeMax(); L.s.pend = []; };
  const turn = (L) => { L.endSeason(); L.s.pend = []; reset(L); };
  // Brings a card up and reads it, as the screen would.
  const show = (L, id, x) => { L.s.pend = [{ id, x: { k: L.s.street.at, v: L.s.t, ...x } }]; return L.event(); };
  const rich = (o) => { const L = fresh(o); L.s.cash = 3e6; return L; };
  const own = (L, kind = 'cottage') => { const r = L.act('buyHome', { id: kind }); L.s.pend = []; reset(L); return r; };

  // ---- the lists hang together ----
  {
    const cards = new Set([...HOUSE_CARDS, ...TALE_CARDS].map((e) => e.id));
    for (const [role, list] of Object.entries(TALES)) for (const t of list) if (typeof t.card === 'string') check(cards.has(t.card), `${role}: ${t.card} is a card`);
    for (const k of Object.keys(HOMES)) check(STREETS[k] && [...STREETS[k].always, ...STREETS[k].pool].every((r) => ROLES[r] && TALES[r]), `${k}: has a street of real people`);
    for (const e of [...HOUSE_CARDS, ...TALE_CARDS]) check(!e.w && e.opts.length >= 1 && (e.ok || e.id === 'stDoctor'), `${e.id}: is only ever brought up, and goes if it no longer fits`);
    for (const id of ['stBloom', 'stShow', 'stHost', 'stMend', 'stBuild', 'stApple', 'stDoor', 'stEye']) check(TROPHIES[id], `trophy ${id} is in the cabinet`);
    // Nobody on a street shares a name with the townsfolk, or with the people one meets.
    const town = Object.values(FOLK).map((f) => f.name || '').join(' ');
    for (const n of [...Object.values(NB_FIRST).flat(2), ...NB_LAST]) check(!town.includes(n) && !NAMES_M.includes(n) && !NAMES_F.includes(n) && !SURNAMES.includes(n), `${n}: is nobody else’s name`);
  }

  // ---- old saves and new ----
  {
    const L = fresh();
    check(L.s.street && L.stHouse() && L.stHouse().kind === 'hostel' && L.stNbs().length === 3, 'a new life starts in Dormitory B, with three bunkmates');
    delete L.s.street;
    const O = new Life(JSON.parse(JSON.stringify(L.s)));
    check(O.s.street && O.stHouse() && O.stNbs().length === 3 && O.s.log.length === L.s.log.length, 'a life saved before the street was thought of opens with one, quietly');
  }

  // ---- moving: a new street each time, and names never reused ----
  {
    const L = rich(), names = new Set(L.stNbs().map((n) => n.name));
    check(L.act('rentHome', 'flat').ok, 'renting a flat');
    const flat = L.stHouse();
    check(flat.kind === 'flat' && flat.ll && L.stNbs().some((n) => n.role === 'couple'), 'the flat has a landlord, and a couple upstairs');
    check(L.s.log.some((e) => e.t.startsWith('New neighbours, on Harbour Court')), 'the new neighbours go in the journal');
    for (const n of L.stNbs()) { check(!names.has(n.name), `${n.name}: a new name`); names.add(n.name); }
    reset(L);
    own(L, 'cottage');
    check(L.stOwned() && L.stHouse().kind === 'cottage' && !L.stHouse().ll && L.s.street.at === `e${L.s.homeAt}`, 'a cottage of your own, with no landlord');
    for (const n of L.stNbs()) { check(!names.has(n.name), `${n.name}: a new name again`); names.add(n.name); }
    check(L.stHouse().g && L.stHouse().g.ft.lawn, 'the cottage comes with a lawn');
    const firsts = L.s.street.used.map((n) => n.split(' ')[0]);
    check(new Set(firsts).size === firsts.length, 'no two people from here share a first name');
    // Mrs Pargeter's: her house, her rules.
    const R = rich();
    if (R.can('rentHome', 'room') === null) { R.act('rentHome', 'room'); check(R.stHouse().kind === 'room' && !R.stHouse().ll && R.stTableSize() === 0, 'a room at Mrs Pargeter’s has no landlord but her, and no dinner parties'); }
  }

  // ---- the house goes wrong ----
  {
    const L = rich();
    own(L, 'townhouse');
    const h = L.stHouse(), e = L.homeEntry(), v0 = L.propValue(e);
    // Something goes wrong, sooner or later, in an old house.
    let n = 0;
    while (!Object.values(h.f).some((r) => r.st === 'left') && n++ < 200) { L.s.wx = 'storm'; L.s.pend = []; L.endSeason(); reset(L); if (Object.values(h.f).some((r) => r.st === 'left')) break; }
    const wrong = Object.entries(h.f).find(([, r]) => r.st === 'left');
    check(!!wrong, `a townhouse goes wrong in time (${n} seasons)`);
    if (wrong) {
      const [f] = wrong;
      h.f[f].ask = 1; L.s.pend = []; L.s.street.next = 0; L.endSeason();
      check(L.s.pend.some((q) => q.id === 'stFault' && q.x.f === f), 'and a card says so');
      const ev = show(L, 'stFault', { f, ask: 1 });
      check(ev && ev.opts.length >= 4 && ev.opts.every((o) => clean(o.t)) && clean(ev.text), 'with ways to see to it, in words');
      // Left, it knocks the price, and gets worse.
      L.stLeave(f);
      const v1 = L.propValue(e);
      check(v1 < v0 || FAULTS[f].knock === 0, `a fault left knocks the price (${v0} to ${v1})`);
      h.f[f].at = L.s.t - 20; h.f[f].sev = 2;
      check(L.propValue(e) < v1, 'and knocks it more as it gets worse');
      check(L.stFaultCost(f, 'sound') > L.stFaultCost(f, 'cheap') && L.stFaultCost(f, 'cheap') > L.stFaultCost(f, 'patch'), 'Penwarden & Sons cost more than Daz, who costs more than a patch');
      // Done properly, it stays done.
      reset(L);
      const r = L.act('stFix', { f, b: 'sound' });
      check(r.ok && h.f[f].st === 'fixed' && clean(r.text), 'Penwarden & Sons do it properly');
      check(L.act('stFix', { f, b: 'sound' }).ok === false, 'and there is nothing left to fix');
    }
    // The charming one, with half up front.
    const J = rich();
    own(J, 'cottage');
    const hj = J.stHouse();
    hj.f.damp = { st: 'left', sev: 1, at: J.s.t, back: 0, ask: 0 };
    const ev = show(J, 'stFault', { f: 'damp', ask: 1 });
    const i = ev.opts.findIndex((o) => /have a look/.test(o.t));
    const cash = J.s.cash + J.s.bank;
    check(i >= 0 && J.choose(i).ok && hj.job && J.s.cash + J.s.bank < cash, 'the charming one takes half up front');
    J.s.pend = []; J.endSeason();
    check(J.s.pend.some((q) => q.id === 'stJob'), 'and comes back, or does not, the next season');
    const jev = J.event();
    if (jev && jev.id === 'stJob') { const k = jev.opts.findIndex((o) => !o.why); J.choose(k); }
    check(!hj.job, 'either way, it is settled');
  }

  // ---- landlords ----
  {
    const L = rich();
    L.act('rentHome', 'flat');
    const h = L.stHouse();
    h.ll.kind = 'sharp';
    const before = L.bills().reduce((a, [, n]) => a + n, 0);
    const ev = show(L, 'stLLRent', { by: 0.12 });
    check(ev && clean(ev.text) && L.choose(0).ok && h.ll.up > 0.1, 'the rent goes up');
    check(L.bills().some(([w]) => w === 'A rise in the rent') && L.bills().reduce((a, [, n]) => a + n, 0) > before, 'and the bills say so');
    // Asked to leave: another flat, on another street.
    const at = L.s.street.at;
    const nev = show(L, 'stLLNotice', {});
    check(nev && L.choose(0).ok && L.s.street.at !== at && L.s.home === 'flat' && L.stHouse().ll && L.stHouse().ll.up === 0, 'turned out, you find somewhere like it, on another street, at the old rent');
    // The good landlady sells to a good tenant.
    const G = fresh();
    G.s.cash = 40000;
    G.act('rentHome', 'flat');
    const g = G.stHouse();
    Object.assign(g.ll, { kind: 'good', tn: 80, since: G.s.t - 20 });
    const sev = show(G, 'stLLSell', {});
    check(sev && /a tenth down/.test(sev.text) && !sev.opts[0].why, `she offers it to you, a tenth down (${sev && sev.opts[0].cost})`);
    const worth = G.netWorth();
    G.choose(0);
    check(G.s.owned && G.stHouse() === G.s.street.homes[G.s.street.at] && G.stHouse().nb.length >= 3 && G.s.street.owe.length === 1 && G.s.ach.stDoor, 'you own it: the same house, the same street, and a debt to her');
    check(G.netWorth() > worth, 'which leaves you better off, on paper');
    check(G.bills().some(([w]) => w.startsWith('Paying')), 'paid back a season at a time');
  }

  // ---- building work ----
  {
    const L = rich();
    own(L, 'cottage');
    const h = L.stHouse(), e = L.homeEntry(), v0 = L.propValue(e), m0 = L.moodBase();
    check(L.can('stProject', { id: 'pool', b: 'sound' }), 'a pool would not suit a cottage');
    const r = L.act('stProject', { id: 'loft', b: 'sound' });
    check(r.ok && h.proj && clean(r.text), 'Penwarden & Sons start on a loft room');
    check(L.moodBase() < m0, 'living on a building site wears on you');
    check(L.can('stProject', { id: 'conserv', b: 'sound' }) === 'One lot of builders at a time.', 'one lot of builders at a time');
    for (let i = 0; i < 8 && h.proj; i++) turn(L);
    check(!h.proj && h.done.loft && L.s.street.n.built === 1, 'and in time it is finished');
    check(L.propValue(e) > v0, `it adds to the price (${v0} to ${L.propValue(e)})`);
    const m1 = L.moodBase(), loft = h.done.loft; delete h.done.loft;
    check(m1 > L.moodBase(), 'and to how you feel about the place');
    h.done.loft = loft;
    // Doing it yourself.
    const D = rich();
    own(D, 'cottage');
    D.s.st.craft = 70;
    check(D.act('stProject', { id: 'workshop', b: 'diy' }).ok, 'a workshop, built yourself');
    let n = 0;
    while (D.stHouse().proj && n++ < 10) { reset(D); D.act('stBuild'); turn(D); }
    check(D.stHouse().done.workshop && n <= 5, `built a weekend at a time (${n} seasons)`);
    reset(D);
    const c0 = D.s.cash, made = D.act('stMake');
    check(made.ok && D.s.cash > c0 && !D.act('stMake').ok, 'the workshop makes things to sell, once a season');
    // The charming one vanishes.
    const V = rich();
    own(V, 'townhouse');
    V.act('stProject', { id: 'conserv', b: 'charm' });
    const was = V.chance;
    V.chance = () => true; V.endSeason(); V.endSeason(); V.chance = was;
    check(V.stHouse().proj && V.stHouse().proj.gone && V.s.street.vanish, 'the charming builder can vanish with the deposit');
    V.s.pend = [];
    const vev = show(V, 'stVanish', { ...V.s.street.vanish });
    check(vev && V.choose(vev.opts.length - 1).ok && !V.stHouse().proj, 'and the site is cleared, to start again');
    // A home of your own, done up, counts a step up for somebody of means (comfort.js).
    check(L.stHomeLift() === 0, 'one lot of work and a lawn is not a step up');
    h.done.conserv = { v: 20000, q: 1, b: 'sound', t: L.s.t };
    check(L.stHomeLift() === 1, 'two lots of work on a sound house is');
  }

  // ---- the garden ----
  {
    const L = rich();
    own(L, 'cottage');
    const g = L.stGardenOf();
    check(L.can('stPlant', 'greenhouse') && !L.can('stPlant', 'veg'), 'a cottage garden has room for a vegetable patch, not a greenhouse');
    for (const id of ['veg', 'roses', 'fruit', 'pond']) { reset(L); check(L.act('stPlant', id).ok, `planting ${id}`); }
    check(L.act('stPlant', 'veg').ok === false, 'once is enough');
    reset(L);
    check(L.act('stDig').ok && L.act('stDig').ok && !L.act('stDig').ok, 'working in the garden: twice a season');
    for (let i = 0; i < 14; i++) { reset(L); L.act('stDig'); L.s.t = L.s.t; turn(L); }
    check(g.ft.fruit.m >= 1 && g.ft.roses.m >= 1, 'roses come on in two summers, fruit in three years');
    check(L.stScore() >= 50, `a garden kept and planted looks it (${L.stScore()})`);
    L.s.t = L.s.t - (L.s.t % 4) + 1;
    check(L.stFood() > 0 && L.bills().find(([w]) => w === 'Food and bills'), 'in summer it comes off the food bill');
    check(L.stShowable().length >= 2, 'and there is something for the Harvest Show');
    // Neglected, it goes wild.
    for (let i = 0; i < 10; i++) turn(L);
    check(g.care < 15 && L.stScoreWord() === 'Gone wild', 'left alone, it goes wild');
    // Moving on, it stays with the house.
    const at = L.s.street.at;
    L.act('rentHome', 'flat');
    check(L.s.street.homes[at] && L.s.street.homes[at].g.ft.roses, 'the garden stays with the house you own');
    check(L.stGardenOf() && L.stFeatures().every((id) => ['pots', 'boxes'].includes(id)), 'a flat has window boxes');
  }

  // ---- the street ----
  {
    const L = rich();
    own(L, 'cottage');
    const n = L.stNbs()[0], st = n.st;
    reset(L);
    const r = L.act('stCall', n.id);
    check(r.ok && n.st > st && n.know && clean(r.text) && !L.act('stCall', n.id).ok, 'popping round: once a season, and you learn what they want');
    // A feud begun, and made up.
    const f = L.stNbs().find((q) => q.role === 'fence');
    check(!!f, 'Ropewalk Lane always has somebody with views on hedges');
    const ev = show(L, 'stHedge1', { n: f.id });
    check(ev && ev.opts.every((o) => clean(o.t)) && clean(ev.text), 'the hedge, in words');
    L.choose(1);
    check(f.feud === 1 && f.st < 0, 'a feud begins');
    show(L, 'stHedge3', { n: f.id });
    L.choose(0);
    check(f.feud === 0 && f.st >= 30 && L.s.ach.stMend, 'and is made up, years later');
    // The milk on the step.
    const M = rich();
    M.act('rentHome', 'cottage');
    const old = M.stNbs()[1];
    Object.assign(old, { role: 'milk', st: 60, late: 'Albert' });
    show(M, 'stMilk2', { n: old.id });
    const was = M.chance; M.chance = () => true; M.choose(0); M.chance = was;
    check(old.f.saved && M.s.ach.stEye, 'you notice the milk in time');
    // Somebody new where somebody went.
    M.stGone(old, 'moved');
    let k = 0;
    while (!M.stNbs().some((q) => q.role === 'newfam') && k++ < 12) turn(M);
    check(M.stNbs().some((q) => q.role === 'newfam'), 'and a new family moves in');
    // Cards about one street go quietly when you move to another.
    const q = M.stNbs()[0];
    M.s.pend = [{ id: 'stHedge1', x: { k: M.s.street.at, v: 0, n: q.id } }];
    M.act('rentHome', 'flat');
    check(!M.event() || M.event().id !== 'stHedge1', 'and a card about the old street goes when you move');
    // Every neighbour's story, read, in words.
    const T = rich();
    own(T, 'townhouse');
    for (const e of TALE_CARDS) {
      const nb = T.stNbs()[0];
      Object.assign(nb, { feud: 1, f: { lent: T.s.t - 8, join: 1, saved: 1, beaten: 1 }, kid: { name: 'Tyler', sex: 'm', age: 22 }, other: 'Craig', late: 'Albert', st: 40 });
      const ev2 = show(T, e.id, { n: nb.id });
      if (!ev2) continue;
      check(clean(ev2.title) && clean(ev2.text) && ev2.opts.every((o) => clean(o.t)), `${e.id}: reads well`);
    }
  }

  // ---- having people round ----
  {
    const L = rich();
    own(L, 'cottage');
    const a = L.meet({ bond: 50, trait: 'kind' }), b = L.meet({ bond: 50, trait: 'bookish' }), c = L.meet({ bond: 50, trait: 'witty' });
    const nb = L.stNbs()[0];
    nb.st = -30;
    const keys = [`p${a.id}`, `p${b.id}`, `p${c.id}`, `n${nb.id}`];
    const table = L.stTable(keys), rules = tableRules(table), best = bestTable(table, rules);
    check(rules.some((r) => r.t === 'apart' && (r.a === 'you' || r.b === 'you')) && rules.some((r) => r.t === 'kind') && rules.some((r) => r.t === 'quiet'), 'a table with a feud, a shy guest and a loud one');
    check(best.max === rules.length && rules.every((r) => ruleKept(r, best.order, table)), 'and a way to seat them all happily');
    check(L.can('stHost', { g: keys, m: 'show' }) === null && L.can('stHost', { g: [...keys, 'x', 'y'], m: 'roast' }), 'the guests must be real, and fit round the table');
    reset(L);
    L.s.st.craft = 100;
    const cost = L.stHostCost({ g: keys, m: 'show' }), c0 = L.s.cash + L.s.bank, b0 = a.bond;
    const r = L.act('stHost', { g: keys, m: 'show', o: best.order });
    check(r.ok && clean(r.text) && L.s.cash + L.s.bank <= c0 - cost + 1, `a dinner for five (${cost})`);
    check(a.bond > b0 && nb.st >= 30 && L.s.street.n.mended === 1, 'friends grow closer, and a feud ends over a good dinner');
    check(!L.act('stHost', { g: keys, m: 'simple' }).ok, 'once a season');
    // With no plan (the practice players, or the same again), whoever is closest comes.
    const P = rich();
    own(P, 'cottage');
    P.meet({ bond: 60 });
    reset(P);
    const pr = P.act('stHost');
    check(pr.ok && clean(pr.text), 'a party with no plan still happens');
    check(fresh().can('stHost') === 'Not in a hostel bunk.', 'nobody comes round to a hostel bunk');
    // Badly seated, it goes badly.
    const B = rich();
    own(B, 'cottage');
    const x = B.meet({ bond: 50, trait: 'bookish' }), y = B.meet({ bond: 50, trait: 'witty' });
    reset(B);
    const by = x.bond;
    B.act('stHost', { g: [`p${x.id}`, `p${y.id}`], m: 'roast', o: ['you', `p${x.id}`, `p${y.id}`] });
    check(x.bond - by < 10, 'a shy guest beside a loud one has a poor evening');
    check(Object.values(MENUS).every((m) => m.each > 0), 'every menu costs something');
  }

  // ---- the seating plan's rules ----
  {
    const g = [{ k: 'you', tags: [], vs: [] }, { k: 'a', tags: ['honour'], vs: [] }, { k: 'b', tags: ['bore'], vs: [] }, { k: 'c', tags: ['shy'], vs: [] }, { k: 'd', tags: ['loud'], vs: [] }];
    const rules = tableRules(g), best = bestTable(g, rules);
    check(best.max <= rules.length && best.order[0] === 'you' && best.order.length === 5, 'the best plan puts you at the head');
    check(!ruleKept({ t: 'honour', a: 'a' }, ['you', 'b', 'a', 'c', 'd'], g) && ruleKept({ t: 'honour', a: 'a' }, ['you', 'b', 'c', 'd', 'a'], g), 'the table is round: the last chair is beside the first');
  }

  // ---- a long life, and no farming ----
  {
    const L = rich();
    own(L, 'villa');
    let guard = 0;
    while (!L.s.dead && guard++ < 120) {
      reset(L);
      L.act('stDig');
      L.endSeason();
      let ev, k = 0;
      while ((ev = L.event()) && k++ < 10) { const i = ev.opts.findIndex((o) => !o.why); if (i < 0 || !L.choose(i).ok) break; }
    }
    check(Number.isFinite(L.netWorth()) && L.stHouse() && L.s.street.homes[L.s.street.at] === L.stHouse(), 'thirty years in a villa, and the sums still add up');
    check(L.s.log.filter((e) => e.t.startsWith('New neighbours')).length <= 3, 'no more streets than moves');
  }
}

// What the practice players may try that is not on a place's list: now and then, not every season.
export function moves(L) {
  const s = L.s, h = L.stHouse && L.stHouse(), out = [];
  if (!h || s.gaol) return out;
  if (h.g && s.t % 3 === 0) out.push(['stDig']);
  if (h.g && s.t % 7 === 2) { const id = L.stFeatures().find((q) => !h.g.ft[q] && q !== 'walled'); if (id) out.push(['stPlant', id]); }
  const n = L.stNbs()[s.t % Math.max(1, L.stNbs().length)];
  if (n && s.t % 4 === 1) out.push(['stCall', n.id]);
  if (s.t % 6 === 3) out.push(['stHost']);
  const w = L.stWrong()[0];
  if (w && s.t % 5 === 0) out.push(['stFix', { f: w[0], b: s.owned ? (s.t % 2 ? 'cheap' : 'sound') : 'll' }]);
  if (s.owned && s.t % 11 === 4 && s.cash + s.bank > 200000) { const id = L.stProjects().find((q) => !h.done[q]); if (id) out.push(['stProject', { id, b: ['sound', 'cheap', 'charm'][s.t % 3] }]); }
  if (h.proj && h.proj.b === 'diy') out.push(['stBuild']);
  if (h.proj && h.proj.gone) out.push(['stDrop']);
  if (h.done.workshop && s.t % 2) out.push(['stMake']);
  return out;
}
