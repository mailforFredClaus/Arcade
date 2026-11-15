// New in Town: where you live, as a place with a life of its own. (The tables are in
// street-lib.js, the cards in street-cards.js and street-tales.js, the screen in
// street-ui.js and the seating plan in street-games.js.)
//
// The house ages. Damp, the roof, the boiler, the wiring, subsidence and the shared wall go
// wrong as a house gets older and as you live in it, each a card: have it done properly
// (Penwarden & Sons, reliable and dear), cheaply (Daz, some of whose work lasts), by a charming
// man who wants half up front, or yourself, by Craft; patch it; or leave it, and it gets worse,
// and knocks the price when you sell. Renters have a landlord instead: one who fixes things, one
// who says he will send somebody, one who is very interested in the rent; the rent goes up, and
// now and then you are asked to leave, or, if you have been good tenants a long while, offered
// the place to buy.
//
// Building work beyond the four improvements in data.js, to suit the house: a loft room, a
// conservatory, a workshop, a granny annexe, a pool at the villa, a roof for the manor. It takes
// seasons, you live on a building site meanwhile, and it adds comfort and value.
//
// The garden grows year on year from what you put into it: a lawn, a vegetable patch, roses,
// fruit trees that take years to bear, a pond the frogs find, a greenhouse; window boxes or two
// pots in the yard where there is no garden. It saves a little on food, goes to the Harvest
// Show and Bay in Bloom, and stays with the house when you move.
//
// The street: three or four neighbours, a different set for each kind of home and a new street
// each move, each with a name, a quirk, a want of their own and a standing with you. Their
// stories run over years (the hedge, the van, the teenager, the ladder, the milk on the step,
// the Neighbourhood Watch, the new family), one card at a time; feuds escalate, and can turn.
// You can have people round: choose the guests and the food, and seat them (street-games.js).
//
// The rich have a big house to keep up: a gardener, a housekeeper, a roof the size of a field,
// open days. The poor have the landlord, the shared bathroom and the kindness of neighbours, a
// landlady who might sell to a good tenant, and a chip shop that might want a new owner.
//
// Everything is kept in s.street:
//   at: where you live now (a key into homes); lease: counts the places rented
//   homes[key]: a house (newHouse below): its age, what is wrong (f), building work (proj, done),
//     the garden (g), help (staff), the annexe (ann), the neighbours (nb), the landlord (ll)
//   nid: the next neighbour's id; used: names given out in this life
//   next: no card from here before this season (unless it cannot wait)
//   means: what you can afford, as the town sees it (1 to 8)
//   charm: which charming builder is about; owe: money owed privately [{ what, left, each }]
//   past: old neighbours who may turn up again; cutting: a rose brought from the last garden
//   fin, vanish: building work just finished, a builder just gone (for the card)
//   n, f: counts and flags, for trophies; *T: when something last happened

import { HOMES, CAREERS, TROPHIES, money, low } from './data.js';
import {
  clamp, fee, HOUSE, FAULTS, FAULT_ODDS, PATCH, PROPER, BUILDERS, CHARMERS, PROJECTS, GARDENS, FEATURES, STREETS,
  NB_FIRST, NB_LAST, NB_POSH, ROLES, LANDLORDS, MENUS, first, list, standWord, tableRules, ruleKept, bestTable,
} from './street-lib.js';
import { HOUSE_CARDS } from './street-cards.js';
import { TALE_CARDS, TALES } from './street-tales.js';

// At most one card from here every other season, this often when one is due (unless something
// cannot wait).
const GAP = 2, ODDS = 0.5;
const MINE = new Set([...HOUSE_CARDS, ...TALE_CARDS].map((e) => e.id));
const FAMILY = ['parent', 'sibling', 'child', 'grandchild'];

export function install({ def, Life, hooks, addEvents }) {
  const S0 = (L) => L.s.street;

  // ---- making things ----------------------------------------------------------------------

  function blank() {
    return {
      v: 1, at: null, lease: 0, homes: {}, nid: 1, used: [], next: 0, means: 1, charm: 0, owe: [], past: [], cutting: null, fin: null, vanish: null,
      n: { built: 0, mended: 0, saved: 0, hosted: 0, perfect: 0, fixed: 0, apples: 0, bloom: 0, shows: 0 }, f: {}, shows: {}, partyT: -99, openT: -99, kindT: -99, bloomT: -99, showT: -99,
    };
  }
  // A name nobody in this life has had from here, nor anybody you know: no two neighbours,
  // landlords or gardeners in one life share a first name or a surname. whole: a first name and
  // a surname (else one name, from firsts).
  function fresh(L, firsts, lasts, whole = true) {
    const S = S0(L), used = new Set(S.used.flatMap((n) => n.split(' '))), people = new Set(L.s.people.map((p) => p.name));
    for (let i = 0; i < 40; i++) {
      const f = L.pick(firsts), l = whole ? L.pick(lasts) : null, n = whole ? `${f} ${l}` : f;
      if (used.has(f) || (l && used.has(l)) || people.has(n)) continue;
      S.used.push(n);
      if (S.used.length > 300) S.used.shift();
      return n;
    }
    const n = whole ? `${L.pick(firsts)} ${L.pick(lasts)}` : L.pick(firsts);
    S.used.push(n);
    return n;
  }
  function newNb(L, role) {
    const s = L.s, S = S0(L), R = ROLES[role];
    const sex = role === 'lady' ? 'f' : role === 'keeper' || role === 'sailor' ? 'm' : L.chance(0.5) ? 'm' : 'f';
    const pool = NB_FIRST[R.names][sex === 'm' ? 0 : 1];
    const n = {
      id: S.nid++, role, name: fresh(L, pool, R.names === 'posh' ? NB_POSH : NB_LAST), sex, age: L.int(R.age[0], R.age[1]), look: L.randomLook(sex),
      st: R.st + L.int(-3, 3), stage: 0, next: s.t + L.int(2, 6), feud: 0, know: 0, gone: null, vs: [], f: {}, t: s.t,
    };
    if (role === 'teen') { const ks = L.chance(0.5) ? 'm' : 'f'; n.kid = { name: fresh(L, NB_FIRST.teen[ks === 'm' ? 0 : 1], null, false), sex: ks, age: L.int(12, 13) }; }
    if (role === 'couple') n.other = fresh(L, NB_FIRST.young[sex === 'm' ? 1 : 0], null, false);
    if (role === 'milk') n.late = fresh(L, NB_FIRST.old[sex === 'm' ? 1 : 0], null, false);
    return n;
  }
  function newStreet(L, kind) {
    const k = STREETS[kind], roles = [...k.always], pool = k.pool.slice();
    while (roles.length < k.n && pool.length) roles.push(pool.splice(L.int(0, pool.length - 1), 1)[0]);
    const nb = roles.map((r) => newNb(L, r));
    // Those who cannot abide each other, when they find themselves on one street.
    for (const a of nb) for (const b of nb) if (a !== b && ROLES[a.role].vs.includes(b.role) && !a.vs.includes(b.id)) { a.vs.push(b.id); b.vs.push(a.id); }
    return nb;
  }
  function newLandlord(L) {
    const s = L.s, r = L.rnd(), kind = r < 0.36 ? 'good' : r < 0.7 ? 'slack' : 'sharp';
    const sex = kind === 'good' ? 'f' : kind === 'slack' ? 'm' : L.chance(0.5) ? 'm' : 'f';
    const agency = kind === 'sharp' && L.chance(0.4);
    const name = agency ? 'Tidewater Lettings' : `${sex === 'm' ? 'Mr' : 'Mrs'} ${fresh(L, NB_LAST, null, false)}`;
    return { kind, name, sex, agency, since: s.t, up: 0, tn: 40, nextUp: s.t + L.int(6, 14), known: 0, offered: 0, told: 0 };
  }
  // A house, as you find it on moving in.
  function newHouse(L, kind, owned, e) {
    const s = L.s, H = HOUSE[kind];
    const h = { kind, owned, t0: s.t, age: Math.round(H.built * (0.85 + L.rnd() * 0.3)), f: {}, job: null, proj: null, done: {}, g: null, staff: { gardener: null, keeper: null }, ann: null, nb: [], ll: null, arrive: null, left: null };
    for (const f of Object.keys(FAULT_ODDS[kind] || {})) h.f[f] = { st: 'ok', sev: 0, at: s.t, back: 0, ask: 0 };
    if (H.size > 0) {
      h.g = { care: 40, ft: {}, frogs: 0, apple: 0, wild: 0 };
      // What the last people left in it.
      const old = (id, m) => { h.g.ft[id] = { at: s.t, m, old: 1 }; };
      if (kind === 'cottage' || kind === 'townhouse') old('lawn', 0.7);
      if (kind === 'townhouse') old('fruit', 1);
      if (kind === 'villa' || kind === 'manor') { old('lawn', 1); old('roses', 1); h.g.care = 60; }
      if (kind === 'manor') old('fruit', 1);
      if (e && e.ups.garden) { old('lawn', 1); old('roses', 1); }
    }
    h.nb = newStreet(L, kind);
    if (!owned && kind !== 'hostel') h.ll = newLandlord(L);
    return h;
  }
  const kindOf = (h) => h && h.kind;

  // ---- the life's own sums ----------------------------------------------------------------

  Object.assign(Life.prototype, {
    // Where you live, as a key into s.street.homes: a home of your own by its number, a rented
    // one by its kind and which lease it is.
    stKey() { const s = this.s; return s.owned && s.homeAt != null ? `e${s.homeAt}` : `r${s.home}.${s.street ? s.street.lease : 0}`; },
    stHouse() { const S = this.s.street; return (S && S.homes[S.at]) || null; },
    stOwned() { const h = this.stHouse(); return !!h && !!this.s.owned && h.kind === this.s.home; },
    stNbs() { const h = this.stHouse(); return h ? h.nb.filter((n) => !n.gone) : []; },
    stNb(id) { const n = this.stNbs().find((q) => q.id === id); return n || null; },
    stMeans() { return (this.s.street && this.s.street.means) || 1; },
    // (What the town thinks you can afford, from what you are worth: 1 up to about $150,000, 2 at $600,000, 3 at $1.35M ... up to 8.)
    stCalcMeans() { return Math.round(clamp((Math.max(0, this.netWorth()) / 150000) ** 0.5, 1, 8) * 100) / 100; },
    stCharmer() { return CHARMERS[(this.s.street.charm || 0) % CHARMERS.length]; },
    stBuilder(b) { return b === 'charm' ? this.stCharmer() : BUILDERS[b] ? BUILDERS[b].name : 'You'; },
    stScale() { const h = this.stHouse(); return h ? HOUSE[h.kind].scale : 1; },

    // Moving: when where you live has changed, the old place is left behind (yours, if you own it)
    // and the new one found as it is, with its street. quiet: said nothing about it (an old save).
    stSync(quiet = false) {
      const s = this.s, S = s.street;
      if (!S) return;
      for (const k of Object.keys(S.homes)) if (k[0] === 'e' && k !== S.at && !this.estateOf(Number(k.slice(1)))) delete S.homes[k];
      const key = this.stKey();
      if (S.at === key && S.homes[key]) return;
      const old = S.homes[S.at];
      if (old && !quiet) leave(this, old);
      if (old) { if (S.at[0] === 'e' && this.estateOf(Number(S.at.slice(1)))) old.left = s.t; else delete S.homes[S.at]; }
      let h = S.homes[key];
      if (!h) {
        const e = key[0] === 'e' ? this.estateOf(Number(key.slice(1))) : null;
        h = S.homes[key] = newHouse(this, s.home, key[0] === 'e', e);
        if (!quiet && s.t > 0) this.note(s.home === 'hostel' ? `In ${STREETS.hostel.name} at the Seagull: ${list(h.nb.map((n) => n.name))}.` : `New neighbours, on ${STREETS[s.home].name.replace(/^The /, 'the ')}: ${list(h.nb.map((n) => n.name))}.`);
      } else if (h.left != null) {
        // Back in a house of your own: the garden has had its own way meanwhile.
        if (h.g) h.g.care = Math.max(0, h.g.care - (s.t - h.left) * 12);
        h.left = null;
      }
      S.at = key;
    },

    // ---- the house ----
    // How sound it is, 0 to 100, and in words.
    stCond(h = this.stHouse()) {
      if (!h) return 100;
      let c = 100;
      for (const r of Object.values(h.f)) c -= r.st === 'left' ? 12 * r.sev : r.st === 'patched' ? 6 : 0;
      if (h.kind === 'manor' && !h.done.roof) c -= 8;
      return clamp(c, 0, 100);
    },
    stCondWord(h = this.stHouse()) { const c = this.stCond(h); return c >= 95 ? 'Sound' : c >= 80 ? 'A thing or two wants doing' : c >= 60 ? 'Needs work' : c >= 35 ? 'In a bad way' : 'Falling down'; },
    // What is wrong just now: [[id, record]].
    stWrong(h = this.stHouse()) { return h ? Object.entries(h.f).filter(([, r]) => r.st === 'left' || r.st === 'patched') : []; },
    // Having a fault seen to: by Penwarden & Sons, Daz, the charming one, yourself (materials), or a patch.
    stFaultCost(f, b, h = this.stHouse()) {
      const F = FAULTS[f], r = h && h.f[f], worse = r && r.st === 'left' ? 1 + 0.4 * Math.max(0, r.sev - 1) : 1, base = F.cost * HOUSE[h ? h.kind : 'cottage'].scale * worse;
      const m = b === 'patch' ? 0.25 : b === 'diy' ? 0.3 : BUILDERS[b] ? BUILDERS[b].mult : 1;
      return Math.max(50, fee(this, base * m));
    },
    // The roof of the manor can only be patched until it is done properly, as a project.
    stOnlyPatch(f, h = this.stHouse()) { return !!h && h.kind === 'manor' && f === 'roof' && !h.done.roof; },
    // Puts a fault right (how: 'proper' or 'patch').
    stMend(f, how, h = this.stHouse()) {
      const r = h.f[f], s = this.s;
      if (how === 'proper' && this.stOnlyPatch(f, h)) how = 'patch';
      r.ask = 0; r.at = s.t;
      if (how === 'proper') { r.st = 'fixed'; r.sev = 0; S0(this).n.fixed++; } else { r.st = 'patched'; r.sev = 0; r.back = s.t + this.int(PATCH[0], PATCH[1]); }
    },
    // Leaves it be: it gets worse in its own time.
    stLeave(f, h = this.stHouse()) { const r = h.f[f]; r.ask = 0; if (r.st !== 'left') { r.st = 'left'; r.sev = Math.max(1, r.sev); r.at = this.s.t; } },
    // What the work on a house adds to (or takes from) its price, at today's prices.
    stValueAdj(e) {
      const S = this.s.street, h = S && S.homes[`e${e.id}`], k = HOMES[e.kind];
      if (!h || !k || k.price == null) return 0;
      let d = Object.values(h.done).reduce((a, x) => a + (x.v || 0), 0);
      if (h.g && HOUSE[h.kind].size >= 2) d += k.price * 0.03 * this.stScore(h) / 100;
      for (const [f, r] of Object.entries(h.f)) d -= r.st === 'left' ? k.price * FAULTS[f].knock * r.sev : r.st === 'patched' ? k.price * FAULTS[f].knock * 0.5 : 0;
      return Math.round(d * this.s.idx / 1000) * 1000;
    },
    // Building work: what it costs with each builder, and whether it suits.
    stProjCost(id, b, h = this.stHouse()) {
      const P = PROJECTS[id], m = b === 'diy' ? 0.4 : BUILDERS[b].mult;
      return Math.round(P.cost * m * this.s.idx / 100) * 100 * (h && h.kind === 'manor' && id !== 'roof' ? 2 : 1);
    },
    stProjects(h = this.stHouse()) { return h ? Object.keys(PROJECTS).filter((id) => PROJECTS[id].kinds.includes(h.kind)) : []; },
    stBusy(h = this.stHouse()) { return !!h && !!h.proj; },

    // ---- the garden ----
    stGardenOf(h = this.stHouse()) { return h && h.g ? h.g : null; },
    stSize(h = this.stHouse()) { return h ? HOUSE[h.kind].size : 0; },
    stFeatures(h = this.stHouse()) { const z = this.stSize(h); return Object.keys(FEATURES).filter((id) => z >= FEATURES[id].min && (FEATURES[id].max == null || z <= FEATURES[id].max)); },
    // How the garden looks, 0 to 100: what has been put in, how far on it is, and how well kept.
    stScore(h = this.stHouse()) {
      const g = h && h.g;
      if (!g) return 0;
      const can = this.stFeatures(h), most = can.reduce((a, id) => a + FEATURES[id].w, 0);
      if (!most) return 0;
      const got = Object.entries(g.ft).reduce((a, [id, f]) => a + (FEATURES[id] ? FEATURES[id].w * f.m : 0), 0);
      return Math.round(clamp(got / most, 0, 1) * (0.35 + 0.65 * g.care / 100) * 100);
    },
    stScoreWord(h = this.stHouse()) { const g = this.stGardenOf(h); if (!g) return ''; const v = this.stScore(h); return g.care < 15 && Object.keys(g.ft).length ? 'Gone wild' : v >= 75 ? 'A picture' : v >= 50 ? 'Coming on beautifully' : v >= 28 ? 'Coming on' : v >= 10 ? 'Early days' : 'Bare'; },
    // What a feature is up to.
    stFtWord(id, f) {
      if (id === 'fruit') { const y = Math.max(1, Math.ceil((1 - f.m) * FEATURES.fruit.grow / 4)); return f.m >= 1 ? 'Bearing' : `Bears in ${y} year${y > 1 ? 's' : ''}`; }
      if (id === 'pond') return f.m >= 1 ? 'Frogs' : 'Waiting for frogs';
      return f.m >= 1 ? 'At its best' : f.m >= 0.5 ? 'Coming on' : 'Just planted';
    },
    // What it saves on food this season (summer and autumn, a greenhouse longer).
    stFood(h = this.stHouse()) {
      const g = h && h.g, q = this.season;
      if (!g || this.s.gaol) return 0;
      let n = 0;
      for (const [id, f] of Object.entries(g.ft)) {
        const F = FEATURES[id];
        if (!F || !F.food) continue;
        if (id === 'fruit' && f.m < 1) continue;
        if (!(q === 1 || q === 2 || (id === 'greenhouse' && q === 0))) continue;
        n += F.food * f.m * (0.3 + 0.7 * g.care / 100);
      }
      return Math.round(n / 10) * 10;
    },
    // What can go in the Harvest Show: [class, how good].
    stShowable(h = this.stHouse()) {
      const g = h && h.g, out = [];
      if (!g) return out;
      for (const [id, f] of Object.entries(g.ft)) {
        const F = FEATURES[id];
        if (!F || !F.show || f.m < (id === 'fruit' ? 1 : 0.8)) continue;
        const q = clamp(f.m * (0.4 + 0.6 * g.care / 100) + (g.ft.greenhouse && F.show === 'veg' ? 0.15 : 0), 0, 1.15);
        const had = out.find((o) => o[0] === F.show);
        if (!had) out.push([F.show, q]); else had[1] = Math.max(had[1], q);
      }
      return out;
    },

    // ---- the landlord ----
    stLL() { const h = this.stHouse(); return h && !this.s.owned ? h.ll : null; },

    // ---- having people round ----
    stTableSize() { const h = this.stHouse(); return h ? HOUSE[h.kind].table : 0; },
    // Who could come: [{ k, name, first, sex, age, look, who, tags, vs }].
    stGuests() {
      const s = this.s, out = [], h = this.stHouse();
      const tagOf = (p) => ({ kind: ['kind'], witty: ['loud'], bookish: ['shy'] })[p.trait] || [];
      const close = s.people.filter((p) => ['partner', 'spouse', 'parent', 'sibling'].includes(p.kind) || ((p.kind === 'child' || p.kind === 'grandchild') && p.age >= 16));
      const friends = this.friends().slice().sort((a, b) => b.bond - a.bond).slice(0, 8);
      for (const p of [...close, ...friends]) out.push({ k: `p${p.id}`, name: p.name, first: first(p), sex: p.sex, age: p.age, look: p.look, who: p.kind, tags: p.kind === 'parent' ? ['kind'] : tagOf(p), vs: [] });
      // (Brothers and sisters at one table squabble, as they always have.)
      const sibs = out.filter((g) => g.who === 'sibling');
      for (const a of sibs) for (const b of sibs) if (a !== b) a.vs.push(b.k);
      if (h) for (const n of h.nb.filter((q) => !q.gone)) out.push({ k: `n${n.id}`, name: n.name, first: n.name.split(' ')[0], sex: n.sex, age: n.age, look: n.look, who: 'neighbour', tags: [ROLES[n.role].seat], vs: [...n.vs.filter((id) => h.nb.some((q) => q.id === id && !q.gone)).map((id) => `n${id}`), ...(n.st < -10 ? ['you'] : [])], st: n.st });
      if (s.job && CAREERS[s.job.c] && !CAREERS[s.job.c].shady) out.push({ k: 'boss', name: 'Your boss', first: 'The boss', sex: s.job.c.length % 2 ? 'f' : 'm', age: 52, look: null, who: 'boss', tags: ['honour'], vs: [] });
      if (this.folk && s.folk && this.folk('hollis') && this.folk('hollis').met != null) out.push({ k: 'vicar', name: 'The Reverend Hollis', first: 'The vicar', sex: 'f', age: 52, look: null, who: 'vicar', tags: ['kind', 'honour'], vs: [] });
      const pt = this.partner(), r = pt && s.wants && s.wants.p && s.wants.p[pt.id];
      if (r && r.inl && r.inl.mum) out.push({ k: 'inl', name: r.inl.mum, first: r.inl.mum.split(' ')[0], sex: 'f', age: pt.age + 28, look: null, who: 'inlaw', tags: ['honour'], vs: [], of: first(pt) });
      return out;
    },
    // The table for a seating plan: you, and the guests chosen.
    stTable(keys) {
      const all = this.stGuests(), guests = keys.map((k) => all.find((g) => g.k === k)).filter(Boolean);
      return [{ k: 'you', name: this.s.name, first: 'You', sex: this.s.sex, age: this.s.age, look: this.s.look, who: 'you', tags: [], vs: [] }, ...guests];
    },
    // A party the screen did not plan: whoever is closest, and a roast if you can cook one.
    stHostPlan() {
      const all = this.stGuests(), seats = Math.max(1, this.stTableSize());
      const rank = (g) => (g.who === 'partner' || g.who === 'spouse' ? 200 : g.who === 'neighbour' ? 40 + (g.st || 0) / 3 : g.k[0] === 'p' ? (this.person(Number(g.k.slice(1))) || { bond: 0 }).bond : 30);
      const g = all.slice().sort((a, b) => rank(b) - rank(a)).slice(0, Math.min(seats, 4)).map((q) => q.k);
      return { g, m: this.s.st.craft >= 35 ? 'roast' : 'simple' };
    },
    stHostCost(x) {
      const p = x || this.stHostPlan(), m = MENUS[p.m];
      if (!m || !Array.isArray(p.g)) return 0;
      return fee(this, (p.g.length + 1) * m.each * (m.rich ? Math.sqrt(this.stMeans()) : 1));
    },
  });

  // When a house you own changes hands, what was done to it goes with it: the price says so.
  // (Wraps propValue in living.js, as coast.js wraps the Gazette: building work and a good
  // garden add to it; faults left to get worse take from it.)
  const baseValue = Life.prototype.propValue;
  Life.prototype.propValue = function propValue(e) { return Math.max(0, baseValue.call(this, e) + (this.s.street ? this.stValueAdj(e) : 0)); };

  // Leaving a house behind: the garden stays with it, and a word in the journal if it was loved.
  function leave(L, h) {
    const S = S0(L), g = h.g;
    if (g && HOUSE[h.kind].size >= 2) {
      const mine = Object.entries(g.ft).filter(([, f]) => !f.old && f.m >= 0.3).map(([id]) => FEATURES[id].name.toLowerCase().replace(/^an? /, ''));
      if (mine.length) L.note(`Left ${GARDENS[h.kind].said} behind, and the ${list(mine)} in it.`);
      if (g.ft.roses && g.ft.roses.m >= 0.8) S.cutting = { from: h.kind, t: L.s.t };
    }
    // Neighbours who were good to you, and might turn up again.
    for (const n of h.nb) if (!n.gone && n.st >= 35) { S.past.push({ name: n.name, sex: n.sex, role: n.role, st: n.st, f: { ...n.f }, t: L.s.t }); if (S.past.length > 12) S.past.shift(); }
    // (A rent that went up goes with the lease.)
    if (h.ll) h.ll.up = 0;
  }
  // A neighbour moves on, or dies: somebody new arrives in time.
  function goes(L, h, n, how) {
    n.gone = how;
    if (how === 'died' && n.st >= 40) L.joy(-3);
    if (!h.arrive && !h.nb.some((q) => !q.gone && q.role === 'newfam')) h.arrive = L.s.t + L.int(3, 8);
  }
  Life.prototype.stGone = function stGone(n, how) { const h = this.stHouse(); if (h && n) goes(this, h, n, how); };
  Life.prototype.stWarm = function stWarm(n, d) { if (n) n.st = clamp(n.st + (d > 0 && n.st > 40 ? d * (1 - (n.st - 40) / 90) : d), -100, 100); };
  // A feud made up: the trophy, and a word in the journal.
  Life.prototype.stMended = function stMended(n) {
    if (!n) return;
    const was = n.feud;
    n.feud = 0; n.st = Math.max(n.st, 30);
    if (was >= 1) { S0(this).n.mended++; this.karma(2); this.note(`Made it up with ${n.name}, after ${Math.max(1, Math.round((this.s.t - n.t) / 4))} year${this.s.t - n.t >= 6 ? 's' : ''} of not speaking.`, 'big'); }
  };

  // ---- the turn of the season -------------------------------------------------------------

  // How hard a house is being worn, this season.
  function wear(L, h) {
    const s = L.s, e = L.homeEntry();
    let m = (0.7 + h.age / 300) * (1 + Math.min(1, (s.t - h.t0) / 80) * 0.6);
    if (h.staff.keeper) m *= 0.6;
    if ((h.kind === 'villa' || h.kind === 'manor') && h.owned && !h.staff.keeper) m *= 1.25;
    return { m, solar: !!(e && e.ups && e.ups.solar) };
  }
  function faults(L, h) {
    const s = L.s, odds = FAULT_ODDS[h.kind];
    if (!odds) return;
    const { m, solar } = wear(L, h);
    // What was left gets worse, in its own time.
    for (const [f, r] of Object.entries(h.f)) {
      if (r.st !== 'left' || r.sev >= 3 || s.t - r.at < 8 || !L.chance(0.25)) continue;
      r.sev++; r.at = s.t; r.ask = 2;
      if (r.sev === 3) crisis(L, h, f);
    }
    // A patch gives up.
    for (const [f, r] of Object.entries(h.f)) if (r.st === 'patched' && s.t >= r.back && L.chance(0.35)) { r.st = 'left'; r.sev = 1; r.at = s.t; r.ask = 3; return; }
    if (Object.values(h.f).some((r) => r.ask)) return;
    // Something new goes wrong (one thing a season at most).
    for (const [f, p] of Object.entries(odds)) {
      const r = h.f[f];
      if (!r || r.st === 'left' || r.st === 'patched' || (r.st === 'fixed' && s.t - r.at < PROPER)) continue;
      let q = p * m;
      if (f === 'roof' && s.wx === 'storm') q *= 3;
      if (f === 'damp' && s.wx === 'wet') q *= 1.6;
      if (f === 'damp' && solar) q *= 0.7;
      if (f === 'boiler' && (L.season === 3 || s.wx === 'snow')) q *= 1.8;
      if (L.chance(q)) { r.st = 'left'; r.sev = 1; r.at = s.t; r.ask = 1; return; }
    }
  }
  // Left long enough, a fault does something you notice.
  function crisis(L, h, f) {
    const s = L.s, ins = !!s.ins.home && h.owned, sc = HOUSE[h.kind].scale;
    if (f === 'damp') { L.sicken('chest infection', 1); L.hp(-3, 'the damp'); }
    else if (f === 'roof') { L.joy(-6); L.cash(-(ins ? fee(L, 200) : fee(L, 1500 * sc))); }
    else if (f === 'boiler') { L.joy(-3); L.hp(-3, 'the cold'); }
    else if (f === 'wiring') { L.joy(-8); L.hp(-5, 'a fire at home'); L.cash(-(ins ? fee(L, 200) : fee(L, 3000 * sc))); }
    else if (f === 'subs') L.joy(-3);
    else if (f === 'wall') { L.joy(-3); const n = L.stNbs()[0]; if (n) L.stWarm(n, -8); }
  }
  function building(L, h) {
    const s = L.s, S = S0(L), p = h.proj;
    if (!p || p.b === 'diy' || p.gone || p.stop) { if (p && p.stop) p.stop--; return; }
    // The charming one, a season in, may be gone.
    if (p.b === 'charm' && !p.ran && s.t > p.at) {
      p.ran = 1;
      if (L.chance(BUILDERS.charm.run)) { p.gone = 1; S.vanish = { k: S.at, p: p.id, n: p.paid, who: L.stCharmer() }; S.charm++; return; }
    }
    if (p.b === 'cheap' && !p.slip && L.chance(0.25)) { p.slip = 1; return; }
    p.left--;
    if (p.left <= 0) finish(L, h);
  }
  // Building work done: what it adds, and a card to say so.
  function finish(L, h) {
    const s = L.s, S = S0(L), p = h.proj, P = PROJECTS[p.id];
    if (p.owed) L.cash(-p.owed);
    const q = clamp(p.q == null ? (p.b === 'cheap' ? 0.85 : p.b === 'charm' ? 0.95 : 1) : p.q, 0.5, 1.1);
    h.done[p.id] = { v: Math.round(P.cost * (h.kind === 'manor' && p.id !== 'roof' ? 2 : 1) * P.value * q), q, b: p.b, t: s.t };
    if (p.id === 'roof') { const r = h.f.roof; if (r) { r.st = 'fixed'; r.sev = 0; r.at = s.t; r.ask = 0; } }
    if (p.id === 'annexe') h.ann = { p: null, let: false };
    h.proj = null;
    S.n.built++;
    L.joy(6);
    L.note(`Finished: ${P.name.toLowerCase().replace(/^an? /, 'the ')}, ${p.b === 'diy' ? 'built with your own hands' : `by ${p.b === 'charm' ? p.who : BUILDERS[p.b].name}`}.`, 'big');
    S.fin = { k: S.at, id: p.id, b: p.b, q };
    // (Cheap work shows its seams in time.)
    if (p.b === 'cheap' && L.chance(0.4)) h.snag = { id: p.id, t: s.t + L.int(4, 10) };
  }
  Life.prototype.stFinish = function stFinish() { const h = this.stHouse(); if (h && h.proj) finish(this, h); };
  function garden(L, h) {
    const s = L.s, g = h.g;
    if (!g) return;
    const small = HOUSE[h.kind].size < 1;
    // A gardener keeps it; the big houses have one in the rates (see midlife.js).
    const floor = h.staff.gardener ? 70 : h.owned && (h.kind === 'villa' || h.kind === 'manor') ? (h.kind === 'manor' ? 35 : 50) : 0;
    const drop = [14, 18, 12, 6][L.season] * (small ? 0.6 : 1) + (s.wx === 'hot' ? 6 : 0) + (s.wx === 'storm' ? 5 : 0);
    g.care = clamp(Math.max(floor, g.care - drop), 0, 100);
    for (const [id, f] of Object.entries(g.ft)) {
      const F = FEATURES[id];
      if (!F) { delete g.ft[id]; continue; }
      if (g.care >= 30 && f.m < 1) f.m = Math.min(1, f.m + 1 / F.grow);
      else if (g.care < 12 && id !== 'fruit' && id !== 'pond') f.m = Math.max(0.2, f.m - 0.05);
    }
    if (g.care < 12 && Object.keys(g.ft).length) g.wild = Math.max(0, g.wild || 0) + 1; else if (g.wild > 0) g.wild = 0; else if (g.wild < 0) g.wild++;
  }
  function street(L, h) {
    const s = L.s, S = S0(L);
    // Somebody new moves in where somebody went.
    if (h.arrive != null && s.t >= h.arrive) {
      h.arrive = null;
      const n = newNb(L, 'newfam');
      n.next = s.t; n.vs = [];
      h.nb = h.nb.filter((q) => !q.gone).concat(n);
    }
    // Standing drifts back a little with no time given to it.
    for (const n of h.nb) if (!n.gone && n.st > 30 && s.t - (n.seen ?? n.t) >= 4) n.st -= 0.5;
    // Small kindnesses, from people who think well of you.
    const warm = h.nb.filter((n) => !n.gone && n.st >= 40);
    if (warm.length && s.t - S.kindT >= 3 && L.chance(0.06 * warm.length)) {
      const n = L.pick(warm), poor = HOMES[s.home].tier <= 2;
      S.kindT = s.t;
      if (poor) S.kind = s.t;
      L.joy(1.5);
      L.say('💐', kindness(L, n, poor), 'good');
    }
  }
  function kindness(L, n, poor) {
    const f = first(n);
    const lines = {
      chippy: [`${f} has sent up a parcel of chips, “to keep your strength up, my lover”.`],
      milk: [`${f} has left a jar of marmalade on your step, with a label in very careful capitals.`],
      ladder: [`${f} has mowed your grass as well as ${n.sex === 'm' ? 'his' : 'her'} own. Nobody asked ${n.sex === 'm' ? 'him' : 'her'} to. Nobody ever does.`],
      sailor: [`${f} has left you half a fruit cake from his sister, wrapped in a page of the shipping forecast.`],
      student: [`${f} has done your washing-up while you were out, as a thank-you for something you have forgotten.`],
    }[n.role] || [`${f} has taken in a parcel for you, and a casserole has somehow come with it.`, `${f} has left a bag of windfall apples on your step.`, `${f} put your bins out when you forgot. And brought them in.`];
    return `${L.pick(lines)}${poor ? ' It helps, this season more than most.' : ''}`;
  }
  // A tenant who pays, season after season, is a tenant a landlord thinks well of.
  function landlord(L, h) { const ll = h.ll; if (ll && !L.s.owned) ll.tn = clamp(ll.tn + 1, 0, 100); }

  hooks.season.push((L, lines, jailed) => {
    const s = L.s, S = S0(L);
    if (!S || s.dead) return;
    L.stSync();
    const h = L.stHouse();
    // Money owed privately is paid off, a season at a time (the bill is in bills, below).
    for (const o of S.owe) o.left = Math.max(0, o.left - Math.min(o.each, o.left));
    S.owe = S.owe.filter((o) => o.left > 0);
    S.means = L.stCalcMeans();
    if (!h || jailed) { if (h && h.g) garden(L, h); return; }
    if (h.ann && h.ann.p != null && !L.person(h.ann.p)) { h.ann.p = null; h.ann.asked = 0; }
    if (h.ann && h.ann.p != null) { const q = L.person(h.ann.p); if (q) L.bond(q, 1.5); }
    faults(L, h);
    building(L, h);
    garden(L, h);
    street(L, h);
    landlord(L, h);
  });

  // ---- a card from here, when there is something to tell -----------------------------------

  // What could come up now: [{ id, x, w, u (it cannot wait), go (done on choosing it) }].
  Life.prototype.stBeats = function stBeats() {
    const L = this, s = L.s, S = S0(L), h = L.stHouse(), out = [], k = S.at;
    // (v: which of a card's wordings it is given: the season it came up, so the words keep still on screen.)
    const add = (id, x, w, u = false, go = null) => out.push({ id, x: { k, v: s.t, ...x }, w, u, go });
    if (!h) return out;
    const yr = Math.floor(s.t / 4);
    // The house.
    for (const [f, r] of Object.entries(h.f)) {
      if (!r.ask) continue;
      const card = h.owned ? (r.ask === 2 ? 'stWorse' : 'stFault') : 'stLLFault';
      add(card, { f, ask: r.ask }, 8, true, () => { r.ask = 0; });
      break;
    }
    if (S.vanish && S.vanish.k === k) add('stVanish', { ...S.vanish }, 9, true, () => { S.vanish = null; });
    if (S.fin && S.fin.k === k) add('stDone', { id: S.fin.id, b: S.fin.b, q: S.fin.q }, 9, true, () => { S.fin = null; });
    if (h.job && s.t > h.job.at) add('stJob', { f: h.job.f }, 9, true, () => { h.job.res = L.chance(BUILDERS.charm.run) ? 'ran' : 'done'; });
    if (h.proj && !h.proj.gone && !h.proj.found && h.proj.b !== 'diy' && h.proj.total >= 2 && h.proj.left <= h.proj.total - 1 && h.proj.left >= 1) add('stFind', { id: h.proj.id }, 3, false, () => { h.proj.found = 1; });
    if (h.snag && s.t >= h.snag.t && h.done[h.snag.id]) add('stSnag', { id: h.snag.id }, 4, false, () => { h.snag = null; });
    // The landlord.
    const ll = !s.owned ? h.ll : null;
    if (ll) {
      if (s.t >= ll.nextUp && ll.up < 0.45) add('stLLRent', { by: ll.kind === 'sharp' ? 0.12 : ll.kind === 'slack' ? 0.08 : 0.05 }, ll.kind === 'sharp' ? 5 : 2, false, () => { ll.nextUp = s.t + (ll.kind === 'sharp' ? L.int(8, 14) : ll.kind === 'slack' ? L.int(14, 22) : L.int(20, 30)); });
      if (s.t - ll.since >= 10 && !ll.told && (ll.kind === 'sharp' ? ll.tn < 55 : ll.tn < 30) && L.chance(0.08)) add('stLLNotice', {}, 6, true, () => { ll.told = s.t; });
      if (ll.kind === 'good' && HOMES[h.kind].price != null && s.t - ll.since >= 12 && ll.tn >= 60 && !ll.offered) add('stLLSell', {}, 5, false, () => { ll.offered = s.t; });
    }
    // The garden.
    const g = h.g;
    if (g) {
      const score = L.stScore(h), size = HOUSE[h.kind].size;
      if (L.season === 2 && S.showT !== yr && L.stShowable(h).length && L.chance(0.7)) add('stShow', {}, 6, true, () => { S.showT = yr; });
      if (L.season === 1 && S.bloomT !== yr && score >= 35 && L.chance(0.55)) add('stBloom', { size }, 6, true, () => { S.bloomT = yr; });
      if (g.ft.pond && g.ft.pond.m >= 1 && !g.frogs) add('stFrogs', {}, 5, true, () => { g.frogs = 1; });
      if (g.ft.fruit && !g.ft.fruit.old && g.ft.fruit.m >= 1 && !g.apple && (L.season === 1 || L.season === 2)) add('stApple', {}, 6, true, () => { g.apple = 1; });
      if (h.owned && (h.kind === 'villa' || h.kind === 'manor') && L.season === 1 && score >= 55 && s.t - S.openT >= 8) add('stOpenDay', {}, 3, false, () => { S.openT = s.t; });
      if (g.wild >= 4 && size >= 2) add('stWild', {}, 3, false, () => { g.wild = -8; });
      if (S.cutting && size >= 2 && S.cutting.t < s.t) add('stCutting', {}, 4, true, () => { S.cutting = null; });
      if (h.staff.gardener && !h.staff.gT && s.t - (h.staff.gAt || 0) >= 10) add('stGardener', { name: h.staff.gardener }, 2, false, () => { h.staff.gT = s.t; });
    }
    if (h.staff.keeper && !h.staff.kT && s.t - (h.staff.kAt || 0) >= 10) add('stKeeper', { name: h.staff.keeper }, 2, false, () => { h.staff.kT = s.t; });
    // The annexe and a parent getting on.
    if (h.ann && h.ann.p == null && !h.ann.asked && s.people.some((p) => p.kind === 'parent' && p.age >= 68)) add('stAnnexe', {}, 4, false, () => { h.ann.asked = s.t; });
    // The street.
    for (const n of h.nb) {
      if (n.gone || s.t < n.next) continue;
      const tale = TALES[n.role] && TALES[n.role][n.stage];
      if (!tale || (tale.when && !tale.when(L, n))) continue;
      const id = typeof tale.card === 'function' ? tale.card(L, n) : tale.card;
      if (!id) continue;
      add(id, { n: n.id }, tale.w || 3, !!tale.u, () => { n.stage++; n.next = s.t + L.int(...(TALES[n.role][n.stage] || { gap: [8, 12] }).gap); });
    }
    if (L.season === 1 && h.kind !== 'hostel' && h.kind !== 'bedsit' && s.t - S.partyT >= 16 && h.nb.filter((n) => !n.gone && n.st >= 15).length >= 2) add('stParty', {}, 2, false, () => { S.partyT = s.t; });
    // Somebody from an old street, a long way on.
    const doc = S.past.find((p) => p.role === 'student' && p.f.doc && !p.f.met);
    if (doc && s.ill && s.t - doc.t >= 16) add('stDoctor', { name: doc.name, sex: doc.sex }, 7, true, () => { doc.f.met = 1; });
    return out;
  };

  hooks.late.push((L, jailed) => {
    const s = L.s, S = S0(L);
    if (!S || jailed || s.dead || s.gaol) return;
    L.stSync();
    if (s.pend.some((q) => MINE.has(q.id))) return;
    const beats = L.stBeats();
    if (!beats.length) return;
    let b = null;
    const urgent = beats.filter((q) => q.u);
    if (urgent.length) b = urgent.slice().sort((p, q) => q.w - p.w)[0];
    else if (s.t >= S.next && L.chance(ODDS)) {
      let r = L.rnd() * beats.reduce((a, q) => a + q.w, 0);
      for (const q of beats) { b = q; r -= q.w; if (r < 0) break; }
    }
    if (!b) return;
    if (b.go) b.go();
    L.queue(b.id, b.x);
    if (!b.u) S.next = s.t + GAP;
  });

  // ---- the rest of the year ---------------------------------------------------------------

  hooks.year.push((L) => {
    const S = S0(L), h = L.stHouse();
    if (!S) return;
    for (const hh of Object.values(S.homes)) hh.age++;
    if (!h) return;
    for (const n of h.nb) {
      if (n.gone) continue;
      n.age++;
      if (n.kid) n.kid.age++;
      // The old go in time (the old one on your street, whose story is the milk, goes in that story).
      if (n.age >= 86 && n.role !== 'milk' && L.chance((n.age - 84) * 0.03)) { goes(L, h, n, 'died'); L.note(`${n.name} died, at ${n.age}. ${n.st >= 40 ? 'The whole street went to the funeral, and you read a lesson.' : 'Most of the street went to the funeral.'}`); continue; }
      if (!['lady', 'keeper', 'milk', 'chippy'].includes(n.role) && n.stage >= 2 && L.chance(0.03)) { goes(L, h, n, 'moved'); L.note(`${n.name} moved away. ${n.st >= 40 ? 'You miss the wave in the mornings.' : 'The street is quieter.'}`); }
    }
  });

  hooks.mood.push((L) => {
    const s = L.s, h = L.stHouse();
    if (!h || s.gaol) return 0;
    let b = 0;
    if (h.g) b += Math.min(HOUSE[h.kind].size >= 2 ? 2.5 : 1.5, L.stScore(h) / 30);
    b -= Math.min(4, Object.values(h.f).reduce((a, r) => a + (r.st === 'left' ? (r.sev >= 2 ? 1.5 : 1) : 0), 0));
    b += Math.min(2.5, Object.keys(h.done).reduce((a, id) => a + (PROJECTS[id] ? PROJECTS[id].comfort : 0), 0));
    if (h.proj && !h.proj.gone) b -= h.proj.b === 'diy' ? 1.5 : 3;
    const nb = h.nb.filter((n) => !n.gone);
    b += Math.min(2, nb.filter((n) => n.st >= 40).length) - Math.min(3, nb.filter((n) => n.st <= -40).length * 1.5);
    if (h.staff.keeper) b += 1;
    if (h.ann && h.ann.p != null && L.person(h.ann.p)) b += 0.5;
    return b;
  });
  // A housekeeper gives you back some of your week.
  hooks.time.push((L) => { const h = L.stHouse(); return h && h.staff.keeper && h.owned && !L.s.gaol ? 1 : 0; });

  hooks.bills.push((L, out, jailed) => {
    const s = L.s, S = S0(L), h = L.stHouse();
    if (!S) return;
    for (const o of S.owe) out.push([o.what, Math.min(o.each, o.left)]);
    if (!h || jailed) return;
    const ll = !s.owned ? h.ll : null, pt = L.partner(), share = pt && pt.live ? 0.65 : 1;
    if (ll && ll.up > 0 && HOMES[s.home].rent != null) out.push(['A rise in the rent', Math.round(L.rentOf(s.home) * ll.up * share / 10) * 10]);
    if (h.staff.gardener) out.push([`${h.staff.gardener.split(' ')[0]}, who does the garden`, fee(L, h.kind === 'townhouse' ? 500 : 350)]);
    if (h.staff.keeper) out.push([`${h.staff.keeper}, who keeps house`, fee(L, { townhouse: 900, villa: 1400, manor: 2400 }[h.kind] || 900)]);
    // What the garden grows, and what the neighbours bring round, comes off the food bill.
    const food = out.find((r) => r[0] === 'Food and bills');
    if (food) {
      const less = L.stFood(h) + (S.kind === s.t - 1 || S.kind === s.t ? 80 : 0) + (h.nb.some((n) => !n.gone && n.role === 'chippy' && n.st >= 30) ? 60 : 0);
      food[1] = Math.max(0, food[1] - less);
    }
  });
  hooks.income.push((L, out) => {
    const h = L.stHouse();
    if (!h || L.s.gaol) return;
    if (h.ann && h.ann.let && h.done.annexe) out.push(['Holidaymakers in the annexe', Math.round(h.done.annexe.v * 0.016 * L.s.idx / 10) * 10]);
  });
  hooks.worth.push((L) => { const S = S0(L); return S ? -S.owe.reduce((a, o) => a + o.left, 0) : 0; });

  hooks.acted.push((L, id, p, y) => {
    const S = S0(L);
    if (!S) return;
    if (id === 'rentHome') S.lease++;
    L.stSync();
    // A landscaped garden (data.js) is a lawn and roses, there and then.
    if (id === 'improve' && y && y.id === 'garden') { const h = L.stHouse(); if (h && h.g) for (const f of ['lawn', 'roses']) h.g.ft[f] = { at: L.s.t, m: 1, old: 1 }; }
  });
  hooks.chose.push((L) => { if (S0(L)) L.stSync(); });

  hooks.load.push((L) => {
    const s = L.s;
    if (!s.street || typeof s.street !== 'object') s.street = blank();
    const S = s.street, b = blank();
    for (const [k, v] of Object.entries(b)) if (S[k] == null) S[k] = v;
    for (const [k, v] of Object.entries(b.n)) if (S.n[k] == null) S.n[k] = v;
    L.stSync(true);
  });
  hooks.ready.push((L) => { const S = S0(L); if (S && !(S.means > 1)) S.means = L.stCalcMeans(); });

  // ---- what you can do --------------------------------------------------------------------

  const here = (L) => L.stHouse();
  const ownWhy = (L) => (!L.stOwned() ? 'Only in a home of your own.' : null);

  def('stOpen', {
    place: 'home', sec: 'At home', icon: '🏡', time: 0, open: 'stHouse',
    title: (L) => (L.s.home === 'hostel' ? 'Your bunk and your bunkmates' : 'Your house and street'),
    desc: (L) => {
      const h = here(L);
      if (!h) return 'The house, the garden and the neighbours.';
      const bits = [];
      if (h.kind !== 'hostel') bits.push(`${L.stCondWord(h)}.`);
      if (h.proj && !h.proj.gone) bits.push(`${PROJECTS[h.proj.id].name} under way.`);
      if (h.g) bits.push(`The garden: ${L.stScoreWord(h).toLowerCase()}.`);
      bits.push('The neighbours, and having people round.');
      return bits.join(' ');
    },
  });

  // -- the garden
  def('stDig', {
    icon: '🌱', title: 'Work in the garden', time: 1, per: 2,
    desc: (L) => { const g = L.stGardenOf(); return g ? `Weeding, mowing, watering, and talking to things. It keeps the garden going (${Math.round(g.care)} of 100 kept).` : ''; },
    why: (L) => (!L.stGardenOf() ? 'There is no garden here.' : L.stGardenOf().care >= 98 ? 'There is nothing left to do out there this season.' : null),
    run(L) {
      const s = L.s, h = here(L), g = h.g, small = HOUSE[h.kind].size < 1;
      g.care = clamp(g.care + (small ? 45 : 32), 0, 100);
      L.gain('fitness', small ? 0.3 : 0.8); L.gain('craft', 0.5); L.hp(1);
      L.joy(3 + ((L.season === 0 || L.season === 1) && (s.wx === 'fair' || s.wx === 'hot') ? 2 : 0) - (s.wx === 'wet' ? 1 : 0));
      if (small) return L.pick(['You deadhead the geraniums and pinch out the tomatoes, and talk to both of them.', 'Ten minutes with a watering can and a pair of scissors, and the window looks like somebody lives there.', 'You repot the thyme, which has been asking.']);
      const has = Object.keys(g.ft);
      const lines = [
        ['You dig over the bed and find a clay pipe, a marble and a great many worms.', 'Seedlings in, labels on, slugs warned.', 'You mow the lawn in stripes, badly, and are proud of every one.'],
        ['You water everything at dusk, with a cup of tea balanced on the wall, while the swifts go over.', 'An afternoon of weeding in the sun. The robin follows you round like a foreman.', 'You tie in the sweet peas and eat the first strawberry standing up.'],
        ['You rake the leaves into a heap, and a hedgehog moves into it before you have finished.', 'Bulbs in for the spring, in the cold, on your knees, with hope.', 'You cut everything back and it looks dreadful, which, you are told, is the point.'],
        ['There is not much to do but sweep the path, plan, and look at seed catalogues.', 'You mend the shed door and clean the tools and feel very organised.', 'Frost on everything. You walk round with a cup of tea and admire the bones of it.'],
      ][L.season];
      if (has.includes('pond') && L.season === 1) lines.push('You sit by the pond and watch a dragonfly the colour of a petrol pump.');
      if (has.includes('roses') && L.season === 1) lines.push('You deadhead the roses, and the whole garden smells of them.');
      return L.pick(lines);
    },
  });
  def('stPlant', {
    icon: (L, x) => (FEATURES[x] ? FEATURES[x].icon : '🌱'), title: (L, x) => (FEATURES[x] ? FEATURES[x].name : 'Plant something'), time: 1,
    cost: (L, x) => (FEATURES[x] ? fee(L, FEATURES[x].cost) : 0),
    desc: (L, x) => (FEATURES[x] ? FEATURES[x].blurb : ''),
    why(L, x) {
      const F = FEATURES[x], g = L.stGardenOf();
      if (!F) return 'Nothing like that.';
      if (!g) return 'There is no garden here.';
      if (!L.stFeatures().includes(x)) return 'Not in a garden this size.';
      if (g.ft[x]) return 'You have one.';
      if (x === 'walled' && !L.stOwned()) return 'Only in a home of your own.';
      return null;
    },
    run(L, x) {
      const g = L.stGardenOf(), F = FEATURES[x];
      // (A rose brought from the last garden takes a year off the roses.)
      g.ft[x] = { at: L.s.t, m: x === 'roses' && L.s.street.carried ? 0.4 : 0, mine: 1 };
      if (x === 'roses') L.s.street.carried = 0;
      L.joy(2); L.gain('craft', 0.4);
      return {
        pots: 'Two pots, a bag of compost and a cane each. The tomato plants look doubtful, but they always do.',
        boxes: 'Red geraniums and a bit of thyme in the window boxes. The window looks as if somebody loves it.',
        lawn: 'Rolls of turf laid end to end like carpet, and watered every evening for a fortnight. Nobody is allowed to walk on it.',
        veg: 'A bed dug over and edged, with string lines and labels. Potatoes, beans and onions, and a row of something you have forgotten the name of.',
        roses: 'Bare roots in a bucket of water overnight, then into the ground with a handful of bonemeal each. Two summers, the man said.',
        fruit: 'An apple and a pear, staked against the wind. The man at the nursery said three years. He said it the way people say “one day”.',
        pond: 'A hole, a liner, a load of stones and a little beach at one end for the hedgehogs. The water is clear and empty and waiting.',
        greenhouse: 'A greenhouse, in kit form, with four hundred pieces and instructions in seven languages. It goes up in a weekend, and only one pane is broken.',
        walled: 'A gang of men with chainsaws, a skip a week for a month, and under the brambles: paths, old espaliers on the walls, a fig, and a glasshouse with every pane gone. It will take years. It will be the finest garden in the Bay.',
      }[x] || `${F.name}: in.`;
    },
  });

  // -- the house
  def('stFix', {
    icon: (L, x) => (FAULTS[x && x.f] ? FAULTS[x.f].icon : '🔧'), title: 'Have it seen to',
    time: (L, x) => (x && x.b === 'diy' ? 2 : 0),
    cost: (L, x) => (x && FAULTS[x.f] && x.b !== 'll' ? L.stFaultCost(x.f, x.b) : 0),
    why(L, x) {
      const h = here(L), r = h && x && h.f[x.f];
      if (!r || !FAULTS[x.f]) return 'Nothing wrong there.';
      if (r.st !== 'left' && r.st !== 'patched') return 'It is sound.';
      if (h.job && h.job.f === x.f) return 'Somebody is seeing to it.';
      if (x.b === 'll') return L.s.owned || !h.ll ? 'It is yours to mend.' : L.s.use.stAsk ? 'You have asked this season.' : null;
      if (!['sound', 'cheap', 'diy'].includes(x.b)) return 'Who is to do it?';
      if (x.b === 'diy' && FAULTS[x.f].diy == null) return 'That is a job for the professionals.';
      if (!L.s.owned && x.b !== 'diy') return 'It is your landlord’s to mend: ask again, or do it yourself.';
      return null;
    },
    run(L, x) {
      const s = L.s, h = here(L), F = FAULTS[x.f];
      if (x.b === 'll') {
        const ll = h.ll;
        s.use.stAsk = 1;
        if (L.chance(LANDLORDS[ll.kind].odds * (ll.tn >= 60 ? 1.2 : 1))) { L.stMend(x.f, 'proper', h); ll.known = 1; return `${ll.name} sends somebody at last. ${L.pick(F.done)}`; }
        ll.known = 1;
        return L.pick([`${ll.name} says somebody will be round on Tuesday. Tuesday comes and goes, as Tuesdays do.`, `${ll.name} is “looking into it”. You can hear the looking from here.`, `${ll.name}’s answering machine is full.`]);
      }
      if (x.b === 'diy') {
        const ok = L.chance(L.checkOdds('craft', F.diy));
        L.gain('craft', 2);
        if (ok) { L.stMend(x.f, 'proper', h); L.joy(4); s.street.f.diy = 1; return `A weekend in old clothes, a borrowed tool and a long phone call with your dad, and it is done, properly. You are insufferable for a week.`; }
        if (F.hurt && L.chance(0.35)) L.hp(-F.hurt[0], F.hurt[1]);
        L.stMend(x.f, 'patch', h); L.joy(-2);
        return 'It is not done so much as hidden. It will hold for a while.';
      }
      const sure = BUILDERS[x.b].sure;
      L.stMend(x.f, L.chance(sure) ? 'proper' : 'patch', h);
      L.joy(2);
      return x.b === 'sound' ? `Penwarden & Sons are there at eight sharp. ${L.pick(F.done)}` : `Daz is in and out in an afternoon, in a cloud of dust and radio. ${L.pick(['It looks fine. It may be fine.', 'Cash, no receipt, and a thumbs up from the van.', 'He leaves a mug behind, which you keep.'])}`;
    },
  });
  def('stProject', {
    icon: (L, x) => (x && PROJECTS[x.id] ? PROJECTS[x.id].icon : '🏗️'), title: (L, x) => (x && PROJECTS[x.id] ? PROJECTS[x.id].name : 'Building work'), time: 0,
    cost: (L, x) => (x && PROJECTS[x.id] && (BUILDERS[x.b] || x.b === 'diy') ? Math.round(L.stProjCost(x.id, x.b) * (x.b === 'charm' ? BUILDERS.charm.deposit : 1)) : 0),
    why(L, x) {
      const h = here(L), P = x && PROJECTS[x.id];
      if (!P) return 'No such work.';
      if (ownWhy(L)) return ownWhy(L);
      if (!P.kinds.includes(h.kind)) return 'It would not suit this house.';
      if (h.done[x.id]) return 'Done already.';
      if (h.proj) return h.proj.gone ? 'Sort out the last builder first: see the work under way.' : 'One lot of builders at a time.';
      if (!(BUILDERS[x.b] || x.b === 'diy')) return 'Who is to do it?';
      if (x.b === 'diy' && P.diy == null) return 'That is a job for the professionals.';
      if (x.b === 'diy' && L.s.st.craft < P.diy - 15) return `Needs Craft ${P.diy - 15} to start on, and more to do it well.`;
      return null;
    },
    run(L, x) {
      const s = L.s, h = here(L), P = PROJECTS[x.id], total = P.seasons + (x.b === 'sound' ? BUILDERS.sound.slow : 0);
      const full = L.stProjCost(x.id, x.b);
      h.proj = { id: x.id, b: x.b, left: total, total, at: s.t, paid: x.b === 'charm' ? Math.round(full * BUILDERS.charm.deposit) : full, owed: x.b === 'charm' ? full - Math.round(full * BUILDERS.charm.deposit) : 0, who: x.b === 'charm' ? L.stCharmer() : null, q: null, n: 0, need: P.seasons * 2 };
      if (x.b === 'diy') h.proj.q = 0;
      // Somebody on the street may have views on it.
      const big = ['loft', 'conserv', 'annexe', 'pool'].includes(x.id), foe = big && L.stNbs().find((n) => ['judge', 'posh', 'fence', 'lady'].includes(n.role) && n.st < 25);
      if (foe) L.queue('stPlan', { k: s.street.at, v: s.t, n: foe.id, id: x.id });
      L.joy(2);
      if (x.b === 'diy') return `You buy the materials, draw it all out on the back of an envelope, and clear the decks. ${P.name}: by your own hands, a weekend at a time.`;
      if (x.b === 'sound') return `Old Mr Penwarden shakes your hand on it. His sons will start on Monday, and it will take ${total} season${total > 1 ? 's' : ''}, and it will cost what he said.`;
      if (x.b === 'cheap') return `Daz says he can start tomorrow, and does. “${P.seasons > 1 ? `${P.seasons} seasons, give or take` : 'A season, tops'},” he says. He says it with great confidence.`;
      return `${h.proj.who} pockets ${money(h.proj.paid)} for materials with a smile that could sell double glazing to a submarine. He will start “first thing”.`;
    },
  });
  def('stBuild', {
    icon: (L) => (here(L) && here(L).proj ? PROJECTS[here(L).proj.id].icon : '🔨'), title: (L) => (here(L) && here(L).proj ? `Work on the ${PROJECTS[here(L).proj.id].name.replace(/^An? /, '').toLowerCase()}` : 'Work on it'), time: 2, per: 1,
    desc: (L) => { const p = here(L) && here(L).proj; return p ? `By your own hands: ${p.n} of ${p.need} weekends done. Craft makes it better.` : ''; },
    show: (L) => { const p = here(L) && here(L).proj; return !!p && p.b === 'diy'; },
    run(L) {
      const h = here(L), p = h.proj, P = PROJECTS[p.id];
      p.n++;
      p.q += clamp(0.55 + (L.s.st.craft - P.diy) / 70 + L.rnd() * 0.15, 0.4, 1.1);
      L.gain('craft', 2.2); L.hp(-0.5); L.joy(1);
      if (p.n >= p.need) { p.q /= p.n; const q = p.q; finish(L, h); return `The last screw, the last lick of paint, and you stand back. ${P.name}, built by you${q >= 0.9 ? ', and built well' : q < 0.7 ? ', a little wonky in places, which gives it character' : ''}.`; }
      return L.pick(['A weekend of sawdust and swearing. It is coming on.', 'You measure twice and cut once, and it is still wrong, and you fix it.', 'Your hands are sore and your back is sore, and it is a little more there than it was.', 'Somebody from the street leans on the wall and gives advice. Some of it is good.']);
    },
  });
  def('stDrop', {
    icon: '🧾', time: 0, title: (L) => { const p = here(L) && here(L).proj; return p && p.gone ? 'Put it down to experience' : 'Give it up'; },
    desc: (L) => { const p = here(L) && here(L).proj; return p && p.gone ? `${p.who} is not coming back, and nor is the money. Clear the site, and start again with somebody else.` : 'Leave it half done. What you have spent is spent.'; },
    why: (L) => { const p = here(L) && here(L).proj; return !p ? 'Nothing is under way.' : p.gone || p.b === 'diy' ? null : 'The builders are in: they will finish.'; },
    run(L) { const h = here(L), p = h.proj; h.proj = null; L.joy(-2); return p.gone ? 'You sweep up the sand and the broken promises. The site is clear, at least.' : 'You put the tools away and pull a sheet over it. Some other year.'; },
  });
  def('stStaff', {
    icon: (L, x) => (x === 'keeper' ? '🧹' : '🧑‍🌾'), time: 0,
    title: (L, x) => { const h = here(L); return x === 'keeper' ? (h && h.staff.keeper ? `Let ${h.staff.keeper} go` : 'Take on a housekeeper') : (h && h.staff.gardener ? `Let ${h.staff.gardener.split(' ')[0]} go` : 'Take on a gardener'); },
    desc: (L, x) => (x === 'keeper' ? 'Somebody to keep the house: it wears more slowly, and you get a little of your week back.' : 'Somebody one day a week: the garden keeps itself, more or less.'),
    why(L, x) {
      const h = here(L);
      if (ownWhy(L)) return ownWhy(L);
      if (x === 'gardener') return !h.g || !['cottage', 'townhouse'].includes(h.kind) ? (['villa', 'manor'].includes(h.kind) ? 'There is a gardener in the rates already.' : 'Not for a garden this size.') : null;
      if (x === 'keeper') return ['townhouse', 'villa', 'manor'].includes(h.kind) ? null : 'Not in a house this size.';
      return 'Nobody like that.';
    },
    run(L, x) {
      const h = here(L), s = L.s;
      if (x === 'gardener') {
        if (h.staff.gardener) { const n = h.staff.gardener; h.staff.gardener = null; return `${n.split(' ')[0]} takes his flask and his kneeler and goes, saying the roses will miss him. They may.`; }
        h.staff.gardener = fresh(L, NB_FIRST.old[0], NB_LAST); h.staff.gAt = s.t; h.staff.gT = 0;
        return `${h.staff.gardener} comes on Tuesdays, with a flask, a kneeler and opinions about your compost. ${money(fee(L, h.kind === 'townhouse' ? 500 : 350))} a season.`;
      }
      if (h.staff.keeper) { const n = h.staff.keeper; h.staff.keeper = null; return `${n} hands back her keys with a list of where everything is, which is useful, and a look, which is not.`; }
      h.staff.keeper = `Mrs ${fresh(L, NB_LAST, null, false)}`; h.staff.kAt = s.t; h.staff.kT = 0;
      return `${h.staff.keeper} starts on Monday. By Wednesday she knows where everything is and has moved most of it. ${money(fee(L, { townhouse: 900, villa: 1400, manor: 2400 }[h.kind]))} a season.`;
    },
  });
  def('stLetAnnexe', {
    icon: '🏠', time: 0,
    title: (L) => (here(L) && here(L).ann && here(L).ann.let ? 'Stop letting the annexe' : 'Let the annexe to holidaymakers'),
    desc: (L) => { const h = here(L); return h && h.done.annexe ? `About ${money(Math.round(h.done.annexe.v * 0.016 * L.s.idx / 10) * 10)} a season, from people who leave sand in it.` : ''; },
    why: (L) => { const h = here(L); return !h || !h.ann || !L.stOwned() ? 'There is no annexe here.' : h.ann.p != null && L.person(h.ann.p) ? 'Somebody lives in it.' : null; },
    run(L) { const a = here(L).ann; a.p = null; a.let = !a.let; return a.let ? 'A key safe, clean towels, a visitors’ book. The first couple write “Lovely!” in it, and take a towel.' : 'You take the key safe off the wall. The annexe is yours again, and very quiet.'; },
  });
  def('stMake', {
    icon: '🪚', title: 'Make something in the workshop', time: 1, per: 1,
    desc: 'Craft, and something to sell: a chair, a box, a bird table. Better the better you are.',
    show: (L) => { const h = here(L); return !!h && !!h.done.workshop && L.stOwned(); },
    run(L) {
      const s = L.s, n = Math.round((40 + s.st.craft ** 2 * 0.05) * (0.7 + L.rnd() * 0.6) / 10) * 10;
      L.gain('craft', 2); L.joy(2); L.cash(n); s.n.earned += n;
      const what = L.pick(s.st.craft >= 60 ? ['a rocking chair', 'a writing box with a secret drawer', 'a dresser for a woman in Kettleby'] : s.st.craft >= 35 ? ['a bird table', 'a bookcase that stands up straight', 'a chopping board shaped like a fish'] : ['a bird box', 'a stool with three nearly equal legs', 'a box, for things']);
      return `A morning in the workshop with the radio on: ${what}. It sells for ${money(n)}.`;
    },
  });

  // -- the street
  def('stCall', {
    icon: '🚪', title: (L, x) => { const n = L.stNb(x); return n ? `Pop round to ${first(n)}’s` : 'Pop round'; }, time: 1,
    desc: (L, x) => { const n = L.stNb(x); return n ? (n.st < -10 ? 'Try to mend things. It may not go well.' : 'A cup of tea and the news. Good for how you stand, and you find out what they want.') : ''; },
    why(L, x) {
      const n = L.stNb(x);
      if (!n) return 'They are not around.';
      return L.s.use[`stCall${n.id}`] ? 'You have been round this season.' : null;
    },
    run(L, x) {
      const s = L.s, n = L.stNb(x), f = first(n), had = n.know;
      s.use[`stCall${n.id}`] = 1; n.know = 1; n.seen = s.t;
      L.gain('charm', 0.4);
      if (n.st < -10) {
        if (L.chance(L.checkOdds('charm', 40 - n.st / 4))) { L.stWarm(n, 12); L.joy(2); return `${f} opens the door an inch, and then, after a while, the whole way. You do not talk about it. You talk about the weather, and it helps.`; }
        L.stWarm(n, -4); L.joy(-2);
        return `${f} looks at you through the glass, and does not open the door.`;
      }
      L.stWarm(n, 4 + s.st.charm / 20); L.joy(2);
      const want = had ? '' : ` ${n.sex === 'm' ? 'He' : 'She'} wants, it turns out, ${ROLES[n.role].want.replace(/^./, (c) => c.toLowerCase()).replace(/\.$/, '')}.`;
      return `${L.pick(CALLS[n.role] || CALLS.any)(n)}${want}`;
    },
  });
  const CALLS = {
    fence: [(n) => `${first(n)} shows you round the garden, every inch of it, and the hedge twice.`, (n) => `Tea in ${first(n)}’s kitchen, with a view of the hedge, which you discuss.`],
    parking: [(n) => `${first(n)} shows you round Brenda the camper van. It takes some time. There is a lot of Brenda.`, (n) => `${first(n)} tells you about a campsite in Wales where the toilets are, and this is a quote, “a revelation”.`],
    teen: [(n) => `Tea with ${first(n)}, who has just come off a night shift and keeps falling asleep mid-sentence, kindly.`, (n) => `${first(n)} tells you what ${n.kid.name} has done now. You laugh. ${first(n)} does too, eventually.`],
    ladder: [(n) => `${first(n)} shows you the extension, which is a frame and a tarpaulin and a lot of hope.`, (n) => `${first(n)} lends you a book on drystone walling. You did not ask. You will never give it back. Fair is fair.`],
    milk: [(n) => `${first(n)} gets the photographs out: ${n.late}, in uniform, and on a beach, and on a bicycle, laughing.`, (n) => `You do ${first(n)}’s crossword together. ${n.sex === 'm' ? 'He' : 'She'} knows all the old ones and none of the new ones. Between you, it gets done.`],
    watch: [(n) => `${first(n)} reads you the log for the month. A blue car has been seen twice. It is very possibly the postman’s.`, (n) => `Biscuits in ${first(n)}’s front room under a map of the road with pins in it.`],
    couple: [(n) => `Tea upstairs with ${first(n)} and ${n.other}. Their flat is exactly like yours, the other way round, with more plants.`, (n) => `${first(n)} and ${n.other} teach you a dance step. Your ceiling, you realise, has heard it many times.`],
    newfam: [(n) => `${first(n)}’s kitchen is all children and dogs and toast. You come away with a drawing of yourself, as a horse.`, (n) => `A cup of tea with ${first(n)} in a house still half in boxes.`],
    chippy: [(n) => `You sit on an upturned crate in the back of the shop while ${first(n)} cuts potatoes and tells you who owes what.`, (n) => `${first(n)} teaches you the secret of the batter. It is beer. You suspected.`],
    singer: [(n) => `${first(n)} plays you a recording of ${n.sex === 'm' ? 'himself' : 'herself'} singing, made in 1994, at length.`, (n) => `Tea with ${first(n)}, who does the voices of everyone on the landing, and does yours very well.`],
    sailor: [(n) => `${first(n)} tells you about Valparaíso, and then about Valparaíso the second time.`, (n) => `${first(n)} teaches you three knots and one song, and the song is not for mixed company.`],
    student: [(n) => `You test ${first(n)} on the bones of the foot. There are a great many. Neither of you knew.`, (n) => `${first(n)} makes you instant noodles with an egg in, which is, ${n.sex === 'm' ? 'he' : 'she'} says, cooking.`],
    posh: [(n) => `Drinks on ${first(n)}’s terrace, which is larger than your first flat. Everything is glass, including the dog bowl.`, (n) => `${first(n)} shows you the hot tub controls. There are forty-one settings. Nobody knows what most of them do.`],
    judge: [(n) => `Sherry with ${first(n)} at six, and Bach, and a long silence that turns out to be companionable.`, (n) => `${first(n)} tells you about a case from 1971 involving a goat. It is the best story you have ever heard.`],
    lady: [(n) => `${first(n)} walks you round the Grange garden, naming every plant in Latin and every neighbour in a lower voice.`, (n) => `Tea on ${first(n)}’s lawn, out of cups so thin you can see the sun through them.`],
    keeper: [(n) => `${first(n)} shows you where the old ice house is, and the badgers’ path, and a bench nobody has sat on since 1950.`, (n) => `A mug of tea in the lodge kitchen, black as tar, while ${first(n)} tells you which of the chimneys draw.`],
    any: [(n) => `A cup of tea with ${first(n)}, and the news of the street.`],
  };

  // -- having people round
  def('stHost', {
    icon: '🍽️', time: 2, per: 1,
    title: 'Have people round',
    desc: (L) => `Up to ${L.stTableSize()} round your table. Choose the guests and the food, then seat them so that everybody has a good night.`,
    cost: (L, x) => L.stHostCost(x),
    why(L, x) {
      const h = here(L), seats = L.stTableSize();
      if (!h || !seats) return 'Not in a hostel bunk.';
      const p = x || L.stHostPlan();
      if (!MENUS[p.m]) return 'What will you give them?';
      if (!Array.isArray(p.g) || !p.g.length) return 'Invite somebody first.';
      if (p.g.length > seats) return `Your table seats ${seats}.`;
      const all = L.stGuests();
      if (p.g.some((k) => !all.some((g) => g.k === k)) || new Set(p.g).size !== p.g.length) return 'They cannot come.';
      if (MENUS[p.m].rich && L.stMeans() < 1.5 && p.m === 'bought') return 'You cannot run to caterers.';
      return null;
    },
    run(L, x) { return host(L, x || L.stHostPlan()); },
  });

  // The night itself. p: { g: guests' keys, m: the menu, o: where they sat (keys by seat, you first) }.
  function host(L, p) {
    const s = L.s, S = S0(L), m = MENUS[p.m], table = L.stTable(p.g), rules = tableRules(table);
    // Where they sat: as the plan said, or, with no plan, as people do sit, which is anyhow.
    let order = Array.isArray(p.o) && p.o[0] === 'you' ? p.o.filter((k, i, a) => table.some((g) => g.k === k) && a.indexOf(k) === i) : null;
    if (!order) { order = ['you', ...table.slice(1).map((g) => g.k)]; for (let i = order.length - 1; i > 1; i--) { const j = 1 + Math.floor(L.rnd() * i); [order[i], order[j]] = [order[j], order[i]]; } }
    for (const g of table) if (!order.includes(g.k)) order.push(g.k);
    const kept = rules.filter((r) => ruleKept(r, order, table)), max = rules.length ? bestTable(table, rules).max : 0;
    const seat = rules.length ? clamp(kept.length / Math.max(1, max), 0, 1) : 1;
    const sore = new Set();
    for (const r of rules) if (!kept.includes(r)) { sore.add(r.a); if (r.t === 'apart') sore.add(r.b); }
    // The food.
    const e = L.homeEntry(), h = here(L);
    let food = m.good, cooked = m.dc != null;
    if (cooked) {
      const dc = m.dc - (e && e.ups.kitchen ? 6 : 0) - (h && h.g && h.g.ft.veg && h.g.ft.veg.m >= 0.8 ? 3 : 0);
      food = L.chance(L.checkOdds('craft', dc)) ? m.good : m.bad;
    }
    const Q = 0.5 * seat + 0.5 * food, guests = table.slice(1), lunch = guests.every((g) => FAMILY.includes(g.who) || g.who === 'inlaw' || g.who === 'partner' || g.who === 'spouse');
    const out = [];
    out.push(`${lunch ? 'Sunday lunch' : 'Dinner'} for ${guests.length + 1}: ${L.pick(m.said)}${cooked ? (food >= m.good ? `, and ${m.good >= 1 ? 'it is a triumph: people take photographs of it' : 'it is very good indeed'}` : `, and ${m.bad <= 0.2 ? 'it is a catastrophe, quietly scraped into the bin while everyone pretends' : 'it is a little burnt, and everybody says they like it like that'}`) : ', and it arrives on time, which is more than can be said for some of the guests'}.`);
    // Who was happy where they sat.
    const said = (k) => (table.find((g) => g.k === k) || {}).first || 'Somebody';
    const fell = rules.filter((r) => !kept.includes(r));
    if (!rules.length || seat >= 1) out.push(L.pick(['Everybody is sat where they ought to be, and the talk never stops.', 'The seating plan works like a charm: you catch people laughing at the far end of the table.', 'Nobody is stuck, nobody is cornered, and the evening runs itself.']));
    else {
      const r = fell[0];
      out.push({
        apart: `${said(r.a)} and ${said(r.b)} spend the evening side by side, not speaking, very loudly.`,
        kind: `Nobody kind was put next to ${said(r.a)}, who says four words all evening, two of them “thank you”.`,
        quiet: `${said(r.b)} talks across ${said(r.a)} all evening; ${said(r.a)} shrinks a little with every course.`,
        honour: `${said(r.a)} is down at the far end, a long way from you, and notices.`,
        bore: `${said(r.a)} tells ${said(r.b)} the whole of a very long story, twice.`,
      }[r.t] + (fell.length > 1 ? ' It is not the only thing that goes wrong.' : ''));
    }
    // What came of it, person by person.
    const good = (k) => (sore.has(k) ? 0.15 + 0.3 * Q : 0.4 + 0.6 * Q);
    let mended = null, mixed = null;
    for (const g of guests) {
      const v = good(g.k);
      if (g.k[0] === 'p') { const q = L.person(Number(g.k.slice(1))); if (q) L.bond(q, Math.round(3 + 9 * v)); }
      else if (g.k[0] === 'n') {
        const n = L.stNb(Number(g.k.slice(1)));
        if (!n) continue;
        n.seen = s.t;
        if (n.st < -10) { if (!sore.has(g.k) && Q >= 0.6) { L.stMended(n); mended = n; } else L.stWarm(n, sore.has(g.k) ? -8 : 6); }
        else L.stWarm(n, 4 + 14 * v);
      } else if (g.k === 'boss' && s.job) { s.job.perf = clamp(s.job.perf + Math.round(-3 + 10 * v), 0, 100); s.stand[s.job.c] = s.job.perf; }
      else if (g.k === 'vicar' && L.folkWarm) L.folkWarm('hollis', 2 + 6 * v);
      else if (g.k === 'inl') { const pt = L.partner(); if (pt) L.bond(pt, Math.round(2 + 6 * v)); }
    }
    // Two on the street who could not abide each other, sat apart and well fed, may find they can.
    for (const r of rules) if (r.t === 'apart' && kept.includes(r) && r.a[0] === 'n' && r.b[0] === 'n' && Q >= 0.75 && !mixed) {
      const a = L.stNb(Number(r.a.slice(1))), b = L.stNb(Number(r.b.slice(1)));
      if (a && b && L.chance(0.5)) { a.vs = a.vs.filter((id) => id !== b.id); b.vs = b.vs.filter((id) => id !== a.id); mixed = [a, b]; }
    }
    const pt = L.partner();
    if (pt && pt.live && !p.g.includes(`p${pt.id}`)) L.bond(pt, 2);
    L.joy(2 + 6 * Q); L.gain('charm', 0.8 + 1.2 * Q);
    if (cooked) L.gain('craft', 1);
    S.n.hosted++;
    if (mended) out.push(`And ${first(mended)}, who came in like a cat into a bath, leaves shaking your hand at the gate and promising you a jar of something. Whatever it was between you is over.`);
    if (mixed) out.push(`${first(mixed[0])} and ${first(mixed[1])} leave together, arguing amiably about the bins. Something has thawed.`);
    if (p.g.includes('boss') && s.job) out.push(Q >= 0.7 ? 'On Monday the boss mentions it, twice, in front of people.' : Q < 0.4 ? 'On Monday the boss is careful not to mention it at all.' : '');
    if (seat >= 1 && food >= 1 && guests.length >= 6) { S.n.perfect++; out.push('People will talk about this one for years.'); if (S.n.perfect === 1) L.note(`Gave a dinner for ${guests.length} that people talked about for years.`, 'big'); }
    return out.filter(Boolean).join(' ');
  }

  addEvents([...HOUSE_CARDS, ...TALE_CARDS]);

  Object.assign(TROPHIES, {
    stBloom: { name: 'In full bloom', icon: '🌸', desc: 'Win a class at Bay in Bloom.', test: (L) => !!L.s.street && L.s.street.n.bloom >= 1 },
    stShow: { name: 'Best in show', icon: '🏵️', desc: 'Take a first at the Harvest Show with something grown at home.', test: (L) => !!L.s.street && L.s.street.n.shows >= 1 },
    stHost: { name: 'The perfect host', icon: '🕯️', desc: 'Seat six or more without a cross word, and serve a triumph.', test: (L) => !!L.s.street && L.s.street.n.perfect >= 1 },
    stMend: { name: 'Over the fence', icon: '🤝', desc: 'Turn a feud with a neighbour into a friendship.', test: (L) => !!L.s.street && L.s.street.n.mended >= 1 },
    stBuild: { name: 'Built to last', icon: '🏗️', desc: 'See three lots of building work through.', test: (L) => !!L.s.street && L.s.street.n.built >= 3 },
    stApple: { name: 'The first apple', icon: '🍏', desc: 'Eat the first fruit off a tree you planted.', test: (L) => !!L.s.street && L.s.street.n.apples >= 1 },
    stDoor: { name: 'Your own front door', icon: '🚪', desc: 'Buy the home you rent from your landlord.', test: (L) => !!L.s.street && !!L.s.street.f.bought },
    stEye: { name: 'Keeping an eye', icon: '👀', desc: 'Notice in time when a neighbour needs help.', test: (L) => !!L.s.street && L.s.street.n.saved >= 1 },
  });
}

// What a neighbour's standing says, for the screen.
export { standWord };
// Low-level helpers for the cards (they need the life's own methods, which install adds).
export const lowName = (kind) => low(HOMES[kind].name);
