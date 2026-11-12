// New in Town: the middle of a life. Forty to sixty-five should still have
// something to push against, and things worth wanting that cost real money
// and real time, and can go wrong.
//
// People who need tending: a present, a party or a round keeps a friendship
// warm, but only time together (an outing, a call, a club night, a card about
// them) keeps anybody close. Somebody left without your time for a while
// drifts back towards where acquaintances sit, and the closer they were, the
// faster; a few people who really know you lift your mood. So a full address
// book is a choice about who to give your seasons to.
//
// The same again: from forty, a year in which nothing new happens (nothing big
// enough for the journal) wears at you, a little more each year, until
// something changes. The cure is in your hands: a wobble when it gets bad
// enough (a red car, the Coast Marathon, a band, a long talk), or something
// bigger of your own. A seat on the council, four years of Thursday evenings
// and votes that please some people and not others; a year out of your job,
// travelling or learning or at home; a trust in your name, endowed and then
// kept going; a grown child's first house, given or lent.
//
// Costs that follow the life you lead: what you are worth sets the town's
// sense of what you can afford (midPrice): the solicitor's suggestions, the
// appeals, what a child's wedding comes to. A big house costs more to run, a
// comfortable home's children cost more to raise, and a boat wants a mooring.
//
// Everything is kept in s.mid:
//   seen: { person id: the season you last had time with them }
//   rut: the same again (0 to 8); big: the season something new last happened; rutT: when it last grew
//   means: what the town thinks you can afford, for this season (1 to 8)
//   plan: the wobble being seen through: { id: 'run' | 'band', n, at }
//   seat: the council: { since, until, miss, att, ward, votes, terms } or null; ran: when you last stood
//   sab: a year out: { until, how, c } or null
//   trust: something in your name: { name, cause, fund, start, at, chair, good, n } or null
//   lent: money lent to a grown child for a house: [{ p, n, left, each }]
//   nest: { person id: what you did about their house }
//   done: { what: the age it was done }, n: counts

import { CAREERS, HOMES, TROPHIES, money } from './data.js';
import { MODELS } from './motor.js';

// Where somebody left without your time settles, and how fast they drift there (a share of the
// distance, each season after the first without you): friends furthest, family least.
export const REST = { friend: 55, partner: 65, spouse: 65, child: 50, sibling: 50, parent: 50, grandchild: 50 };
const RATE = { friend: 0.08, partner: 0.06, spouse: 0.06, child: 0.04, sibling: 0.04, parent: 0.04, grandchild: 0.04 };
// Presents, parties and rounds do their full good up to here, and a quarter of it above.
export const WARM = 70;
// A bond this high, or higher, is somebody who really knows you.
export const CLOSE = 85;
// What is not time together, though it is done with somebody.
const COLD = new Set(['split', 'forget', 'thump', 'rumour', 'prank', 'scrounge', 'lean', 'gift', 'school']);
const RUT_MAX = 8;
// The council: a term is four years; a seat pays a small allowance.
const TERM = 16, ALLOWANCE = 800;
// What a trust in your name is for.
export const CAUSES = {
  sail: { name: 'a sailing school for the Bay’s children', short: 'sailing school', icon: '⛵', good: ['Twelve children who had never been on the water sail round the lighthouse and back, and one of them cries when it is over.', 'The sailing school’s dinghy comes second in the Kettleby regatta, crewed by two eleven-year-olds who argue all the way round.', 'A boy from the estate who would not say a word in September is teaching the new ones to tack by July.'] },
  books: { name: 'bursaries at the college', short: 'bursaries', icon: '🎓', good: ['A girl whose mother cleans the Town Hall starts at the college in September, on your money, and comes top in her first exams.', 'Your first bursary student writes to say she has qualified as a nurse. She has enclosed a photograph, in uniform.', 'Three students this year. One of them stops you in the street to tell you what he is going to do, and it takes twenty minutes.'] },
  soup: { name: 'the soup run and the night shelter', short: 'shelter', icon: '🍲', good: ['The shelter stays open every night of a hard winter, and nobody sleeps under the pier.', 'A man the soup run fed for two winters comes back to volunteer, in a clean shirt, and does not mention it.', 'The night shelter gets new mattresses and a boiler that works. The Reverend Hollis cries a little, and blames the cold.'] },
  arts: { name: 'a youth theatre at the Pavilion', short: 'youth theatre', icon: '🎭', good: ['The youth theatre does a Dream on the green. A fairy forgets her lines and makes up better ones.', 'Desmond Achebe says one of your youth theatre has "the thing", and that he has only seen it twice. He means it, this time.', 'Forty children, a borrowed lighting rig and a play they wrote themselves about the gulls. It is sold out for three nights.'] },
};
// What the council votes on, each year of a term: what each way pleases, and whom it vexes.
// folk: one of the townsfolk who minds (folk.js), and how much.
const VOTES = {
  path: { icon: '🥾', title: 'the footpath', text: 'Walkers want a footpath opened along the edge of Tom Windle’s bottom field, to the cliffs. Tom has put up a sign about it, and then another.', opts: [['Open the footpath', 'The walkers cheer. Tom Windle drives his tractor along the new footpath, very slowly, every Sunday morning.', { karma: 2, ward: 4, folk: ['windle', -8] }], ['Leave Tom’s field alone', 'Tom sends a dozen eggs to the Town Hall, addressed to you. The Ramblers write to the Gazette.', { ward: -2, folk: ['windle', 6] }]] },
  green: { icon: '🅿️', title: 'a car park on the green', text: 'The shopkeepers on the High Street want the green by the harbour made into a car park. The people who sit on the green in summer would rather it stayed a green.', opts: [['The shops need the trade', 'The tarmac goes down in a week. Trade is up, and so is the shouting.', { fame: 1, karma: -2, ward: -3, folk: ['betty', 4] }], ['Keep the green', 'The shopkeepers are cross for a month. The children play football on the green all summer.', { karma: 2, ward: 4 }]] },
  rents: { icon: '🧀', title: 'the rents on Market Square', text: 'The council could double the pitch rents on Market Square, which would pay for the new lights on the front. Priya Lal has views on this, and has shared them with everybody.', opts: [['Hold the rents', 'Priya sends a cheese to the Town Hall, for you, with a note that says only THANK YOU in capitals.', { ward: 2, folk: ['priya', 8] }], ['Raise them: the front needs its lights', 'The lights go up along the front, and very pretty they are. Two stalls on the square close.', { ward: -2, fame: 1, folk: ['priya', -10] }]] },
  homes: { icon: '🏘️', title: 'houses on the cliff road', text: 'A builder wants to put forty houses on the field above the cliff road: homes young families could afford, and the end of the view from Gorse Head.', opts: [['Let them build', 'The houses go up in a year. Young families move in, and the school takes on another teacher.', { karma: 3, ward: -2 }], ['Keep the view', 'The field stays a field. A young couple you know move to Kettleby, because they cannot afford anything here.', { ward: 3, karma: -1 }]] },
  roof: { icon: '⛪', title: 'a grant for St Brigid’s roof', text: 'The Reverend Hollis has asked the council for a grant towards the roof. Some on the council say the church should mend its own roof.', opts: [['Give the grant', 'The roof is mended before the winter. The vicar shakes your hand for a long time.', { karma: 2, ward: 1, folk: ['hollis', 8] }], ['The church must find its own money', 'The buckets stay under the drips another year. The vicar says she understands, kindly, which is worse.', { ward: -1, folk: ['hollis', -6] }]] },
  library: { icon: '📚', title: 'the library’s hours', text: 'To save money, the library could close on Saturdays. Miss Achterberg has written to every councillor, by hand, in green ink.', opts: [['Keep it open', 'The library stays open on Saturdays. Miss Achterberg nods to you in the street, which from her is a garland.', { karma: 2, ward: 2, folk: ['achterberg', 8] }], ['Close it on Saturdays', 'The money goes on potholes, which are filled. The library is shut on Saturdays, and the Gazette prints a photograph of a child at the locked door.', { ward: -3, folk: ['achterberg', -10] }]] },
  bus: { icon: '🚌', title: 'the Sunday bus', text: 'The Sunday bus up the hill costs the council more than it takes. Eleven people use it, every one of them over seventy, and every one of them votes.', opts: [['Keep the bus running', 'The bus keeps running. The eleven send you a card, signed by all of them, in eleven different inks.', { karma: 2, ward: 3 }], ['Cut it: the money is needed elsewhere', 'The money goes to the swimming baths. Mrs Pargeter walks up the hill every Sunday now, and makes sure you see her do it.', { ward: -3, folk: ['parg', -6] }]] },
  lights: { icon: '🎄', title: 'the Christmas lights', text: 'The Christmas lights along the front need replacing. The lifeboat station needs a new winch. There is money for one of them.', opts: [['The lights: the town needs cheering', 'The lights go up in December, blue and silver all along the front, and the whole Bay comes out to see them switched on.', { fame: 1, ward: 3 }], ['The winch: it saves lives', 'The front is dark this Christmas. The new winch is fitted in January, and in February it brings a fishing boat in through a gale.', { karma: 3, ward: -1, folk: ['quinn', 6] }]] },
  pitch: { icon: '⚽', title: 'the Rovers’ ground', text: 'A supermarket wants to buy the Rovers’ ground and build on it, and would give the club a new pitch out on the ring road. Gaz Kowalski has not slept since he heard.', opts: [['Keep the Rovers where they are', 'The supermarket goes elsewhere. Gaz hugs you in the street, smelling of pies.', { ward: 2, karma: 1, folk: ['gaz', 10] }], ['Let the supermarket have it', 'The supermarket brings eighty jobs, and the Rovers play on the ring road in front of a crowd of nine. Gaz does not speak to you again.', { ward: -2, fame: 1, folk: ['gaz', -12] }]] },
};

export function install({ def, A, Life, clamp, hooks, addEvents }) {
  const M = (L) => L.s.mid;
  const first = (p) => p.name.split(' ')[0];
  const he = (p) => (p.sex === 'm' ? 'he' : 'she'), He = (p) => (p.sex === 'm' ? 'He' : 'She'), him = (p) => (p.sex === 'm' ? 'him' : 'her'), his = (p) => (p.sex === 'm' ? 'his' : 'her');
  const round = (n, to = 50) => Math.round(n / to) * to;
  const folk = (L, id, d) => { const f = L.s.folk && L.s.folk.p[id]; if (L.folkWarm && f && f.met != null) L.folkWarm(id, d, false); };

  hooks.load.push((L) => {
    const s = L.s;
    if (!s.mid || typeof s.mid !== 'object') s.mid = {};
    const m = s.mid, b = { seen: {}, rut: 0, big: s.t || 0, rutT: s.t || 0, means: 1, plan: null, seat: null, ran: null, sab: null, trust: null, lent: [], nest: {}, voted: {}, done: {}, n: { terms: 0, votes: 0, gigs: 0, years: 0 } };
    for (const [k, v] of Object.entries(b)) if (m[k] == null) m[k] = v;
  });
  hooks.ready.push((L) => { if (!(L.s.mid.means >= 1)) L.s.mid.means = L.midCalcMeans(); });

  Object.assign(Life.prototype, {
    // ---- what you can afford, in the town's eyes ----
    // From what you are worth: 1 up to about $150,000, 2 at $600,000, 3 at $1.35M, 4 at $2.4M ... up to 8.
    midCalcMeans() { return Math.round(clamp((Math.max(0, this.netWorth()) / 150000) ** 0.5, 1, 8) * 100) / 100; },
    midMeans() { return (this.s.mid && this.s.mid.means) || 1; },
    // A sum the town would ask of somebody of ordinary means, asked of you.
    midPrice(n) { return round(n * this.midMeans(), n >= 1000 ? 500 : 50); },

    // ---- people ----
    midClose() { return this.s.people.filter((p) => REST[p.kind] != null && !(p.kind === 'child' && p.age < 18) && p.bond >= CLOSE); },
    // Seasons since you last had time with somebody.
    midSince(p) { const v = this.s.mid.seen[p.id]; return v == null ? 0 : this.s.t - v; },
    // Somebody close who is drifting for want of your time.
    midDrifting(p) { return REST[p.kind] != null && !(p.kind === 'child' && p.age < 18) && p.bond > REST[p.kind] + 3 && this.midSince(p) >= 2; },
    midSaw(p) { if (p && p.id != null) this.s.mid.seen[p.id] = this.s.t; },
    // A present, a party or a round: full good up to WARM, a quarter of it above.
    midToken(p, was) {
      const gain = p.bond - was;
      if (gain <= 0 || p.bond <= WARM) return;
      const below = Math.max(0, WARM - was);
      p.bond = Math.min(p.bond, was + below + (gain - below) * 0.25);
    },

    // ---- the same again ----
    midRut() { const s = this.s; return s.age >= 40 ? s.mid.rut : 0; },
    midRutWord() { const r = this.midRut(); return r >= 6 ? 'Every Tuesday the same' : r >= 4 ? 'Restless' : r >= 2 ? 'In a rut' : r >= 1 ? 'Settled' : 'Plenty going on'; },
    midFresh(n = 2) { const m = this.s.mid; m.rut = Math.max(0, m.rut - n); m.big = this.s.t; },

    // ---- the council ----
    midSeat() { const st = this.s.mid.seat; return !!st && this.s.t < st.until; },
    midStandOdds() {
      const s = this.s, st = s.mid.seat;
      const known = Math.min(0.15, this.friends().length / 80) + (st ? clamp(st.ward / 100, -0.2, 0.2) - Math.min(0.2, st.miss * 0.05) : 0);
      return clamp(0.2 + s.st.charm / 220 + s.karma / 160 + s.fame / 250 + known + this.luck(), 0.1, 0.85);
    },
    midStandWhy() {
      const s = this.s;
      if (s.age < 35) return 'The ward likes its councillors with a few grey hairs (35 and over).';
      if (s.age > 72) return 'You have done your bit. Let somebody younger have a go.';
      if (s.job && s.job.c === 'politics') return 'You are in politics already, the other way.';
      if (s.record) return 'Not with your record.';
      if (this.midSeat()) return 'You hold the seat.';
      if (s.mid.ran != null && s.t - s.mid.ran < 8) return 'The ward will not vote again for a while.';
      return null;
    },
    // ---- a year out ----
    midAway() { const sb = this.s.mid.sab; return !!sb && this.s.t < sb.until; },
    midYearWhy() {
      const s = this.s, j = s.job;
      if (!j) return 'You need a job to take a year out of.';
      if (CAREERS[j.c].shady) return 'Sal does not hold with years out.';
      if (s.age < 35 || s.age > 62) return 'A year out is for the middle of a working life (35 to 62).';
      if (j.r < 2 || s.n.shifts < 40) return 'They would not hold your job for you yet (three rungs up, and forty shifts).';
      if (this.midAway()) return 'You are on it.';
      if (s.mid.done.yearOut != null && s.age - s.mid.done.yearOut < 8) return 'You had a year out not long ago.';
      return null;
    },
    midYearCost(how) { return how === 'travel' ? this.midPrice(9000) : how === 'learn' ? this.midPrice(2500) : 0; },
    // ---- the trust ----
    midTrustCost() { return Math.max(40000, this.midPrice(40000)); },
    midTrustName() { const parts = this.s.name.split(' '); return `The ${parts.length > 1 ? parts[parts.length - 1] : parts[0]} Trust`; },
    // ---- money lent to a grown child ----
    midOwed() { return this.s.mid.lent.reduce((a, l) => a + l.left, 0); },
  });

  // ---- tending people ----

  hooks.acted.push((L, id, p, y) => {
    const a = A[id], m = M(L);
    if (a && a.who && p && typeof p === 'object' && p.id != null && !COLD.has(id) && (typeof a.time === 'function' ? a.time(L, p, y) : a.time) > 0) L.midSaw(p);
    // A club night sees the friends you made there.
    const c = /^club(Night|Drill|Occ|Lead)_(.+)$/.exec(id);
    if (c && L.clubFriends) for (const q of L.clubFriends(c[2])) L.midSaw(q);
    void m;
  });
  hooks.chose.push((L, id, x) => {
    const pid = typeof x === 'number' ? x : x && typeof x === 'object' && typeof x.p === 'number' ? x.p : null;
    if (pid != null) { const p = L.person(pid); if (p && REST[p.kind] != null) L.midSaw(p); }
  });
  // Presents, parties and rounds keep people warm; they do not make anybody close.
  for (const id of ['gift', 'party', 'round']) {
    const a = A[id];
    if (!a) continue;
    const run = a.run;
    a.run = function (L, ...rest) {
      const was = new Map(L.s.people.map((q) => [q, q.bond]));
      const text = run.call(this, L, ...rest);
      for (const [q, b] of was) if (REST[q.kind] != null) L.midToken(q, b);
      return text;
    };
  }

  // ---- the turn of the season ----

  hooks.season.push((L, lines, jailed) => {
    const s = L.s, m = M(L);
    // People left without your time drift back towards where acquaintances sit.
    for (const p of s.people) {
      const rest = REST[p.kind];
      if (rest == null || (p.kind === 'child' && p.age < 18)) continue;
      if (m.seen[p.id] == null) { m.seen[p.id] = s.t; continue; }
      if (jailed || s.t - m.seen[p.id] < 2 || p.bond <= rest) continue;
      L.bond(p, -(p.bond - rest) * RATE[p.kind]);
    }
    for (const id of Object.keys(m.seen)) if (!s.people.some((p) => String(p.id) === id)) delete m.seen[id];
    // A year out, a season at a time.
    const sb = m.sab;
    if (sb && s.t < sb.until && !jailed) {
      if (sb.how === 'travel') { L.joy(6); L.gain('charm', 1); }
      else if (sb.how === 'learn') { const k = ['smarts', 'craft', 'fitness', 'charm'].sort((a, b) => s.st[a] - s.st[b])[0]; L.gain(k, 4); L.joy(3); }
      else { L.joy(4); for (const p of s.people) if (['partner', 'spouse', 'child', 'grandchild', 'parent'].includes(p.kind)) { L.bond(p, 5); L.midSaw(p); } }
      if (s.t + 1 >= sb.until) L.queue('midBack');
    }
    // The council: a meeting missed is noticed.
    const st = m.seat;
    if (st && s.t < st.until && !jailed) {
      if (st.att === s.t) st.miss = Math.max(0, st.miss - 1);
      else { st.miss++; if (st.miss === 3) L.queue('midCensure'); }
    }
    // A trust's year: what it did, out of its fund.
    const tr = m.trust;
    if (tr && L.season === 3 && !jailed) {
      const spend = Math.min(tr.fund, round(tr.start * 0.06, 500));
      tr.fund -= spend; tr.n++;
      if (spend > 0) { L.karma(2); L.fame(0.4); L.joy(2); }
      if (tr.fund < tr.start * 0.25) L.queue('midTrustLow');
      else if (tr.chair !== s.t && tr.chair !== s.t - 1 && tr.chair !== s.t - 2 && L.chance(0.35)) L.queue('midTrustBooks');
      // (You hear what it did in its first good years; after that it goes on doing it quietly.)
      else if (spend > 0 && tr.good < CAUSES[tr.cause].good.length) L.queue('midTrustYear', { i: tr.good });
    }
    // Money lent to a grown child for a house, paid back a little each season, mostly.
    for (const l of m.lent.slice()) {
      const p = L.person(l.p);
      if (!p) { m.lent.splice(m.lent.indexOf(l), 1); continue; }
      if (l.late) continue;
      if (L.chance(0.04)) { l.late = 1; L.queue('midNestShort', { p: l.p }); continue; }
      const n = Math.min(l.left, l.each);
      l.left -= n; L.cash(n); lines.push([`${first(p)} pays back a little of the house money`, n]);
      if (l.left <= 0) { m.lent.splice(m.lent.indexOf(l), 1); L.note(`${first(p)} paid back every penny of the money for the house.`); L.bond(p, 4); }
    }
  });
  hooks.late.push((L, jailed) => {
    const s = L.s, m = M(L);
    m.means = L.midCalcMeans();
    // When it has got bad enough, the itch to do something about it.
    if (!jailed && s.age >= 40 && s.age <= 60 && m.rut >= 4 && !m.plan && (m.wob == null || s.t - m.wob >= 16) && !s.pend.some((q) => q.id === 'midWobble')) { m.wob = s.t; L.queue('midWobble'); }
    // The ward wants an answer at the end of a term.
    const st = m.seat;
    if (st && s.t === st.until - 1 && !s.pend.some((q) => q.id === 'midTerm')) L.queue('midTerm');
    // A vote, once a year in office: each question comes before the council once in your time on it.
    if (st && s.t < st.until - 1 && L.season === 1 && !jailed) {
      const voted = m.voted || (m.voted = {});
      const left = Object.keys(VOTES).filter((k) => voted[k] == null);
      if (left.length) { const k = L.pick(left); voted[k] = s.t; st.votes.push(k); L.queue('midVote', { k }); }
    }
  });
  // A birthday: another year of the same, or not.
  hooks.year.push((L) => {
    const s = L.s, m = M(L);
    if (s.age >= 40 && s.age <= 64) {
      if (s.t - m.big >= 4 && !L.midAway()) { m.rut = Math.min(RUT_MAX, m.rut + 1); m.rutT = s.t; if (m.rut === 3) L.note('Forty-something, and the same week again. Something needs to change.'); }
    } else if (s.age >= 65) m.rut = Math.max(0, m.rut - 2);
  });
  // Anything big enough for the journal is something new.
  hooks.noted.push((L, e) => {
    const m = L.s.mid;
    if (!m || (e.k !== 'big' && e.k !== 'love')) return;
    if (m.big !== L.s.t) m.rut = Math.max(0, m.rut - 1);
    m.big = L.s.t;
  });

  // ---- how it feels ----
  hooks.mood.push((L) => {
    const s = L.s, m = M(L);
    if (!m) return 0;
    // (The same again weighs more each year it goes on: a point and a half of mood for each.)
    let b = -Math.round(L.midRut() * 1.5);
    // A few people who really know you.
    b += Math.min(4, L.midClose().length);
    // The person you share your life with, passed in the hall.
    const pt = L.partner();
    if (pt && pt.live && L.midSince(pt) >= 3) b -= 2;
    if (m.trust) b += 2;
    if (L.midSeat()) b += 1;
    return b;
  });

  // ---- money ----
  hooks.bills.push((L, out, jailed) => {
    const s = L.s, h = HOMES[s.home];
    // A big house costs more to run than its upkeep: rates, heating, a man for the garden.
    const rates = [0, 0, 0, 300, 900, 2200, 5500][h.tier] || 0;
    if (rates && !jailed) out.push([h.tier >= 5 ? 'Rates, heating and the gardener' : 'Rates and heating', rates]);
    // A comfortable home's children cost more: the riding, the school trips, the right trainers.
    const young = L.kids().filter((k) => k.age < 18 && k.age >= 3).length, means = L.midMeans();
    if (young && means > 1.2) out.push(['What the children’s friends all have', round(500 * (means - 1) * young, 10)]);
    // A boat wants a mooring, and paint, and a new sail now and then.
    if (s.items.boat) out.push(['A mooring and upkeep for the boat', 350]);
  });
  hooks.income.push((L, out) => { if (L.midSeat() && !L.s.gaol) out.push(['A councillor’s allowance', ALLOWANCE]); });
  hooks.worth.push((L) => L.midOwed());
  // A year out: the job waits, and so does the work.
  hooks.shut.push((L, a) => (L.midAway() && ['work', 'workHard', 'workEasy', 'workPlay', 'raise'].includes(a.id) ? 'You are on a year out. The job will be there when you get back.' : null));

  // ---- the council ----

  def('midStand', {
    place: 'townhall', sec: 'The ward', icon: '🗳️', title: 'Stand for the council', time: 2,
    cost: (L) => L.midPrice(3000),
    desc: (L) => `The harbour ward needs a councillor: leaflets, a hall, a photograph in the Gazette. Four years of Thursday evenings and a vote now and then, and ${money(ALLOWANCE)} a season for it. About ${Math.round(L.midStandOdds() * 100)}%.`,
    show: (L) => L.s.age >= 30 && !L.midSeat() && !(L.s.job && L.s.job.c === 'politics'),
    why: (L) => L.midStandWhy(),
    run(L) {
      const s = L.s, m = M(L), again = !!m.seat;
      m.ran = s.t;
      L.gain('charm', 1.5);
      if (L.chance(L.midStandOdds())) {
        m.seat = { since: s.t, until: s.t + TERM, miss: 0, att: s.t, ward: again ? m.seat.ward : 0, votes: [], terms: (again ? m.seat.terms : 0) };
        L.joy(10); L.fame(2); L.midFresh(4);
        L.note('Elected to the council for the harbour ward.', 'big');
        L.say('🗳️', 'Elected to the council', 'promo');
        return `The count is in the church hall. ${L.pick(['You win by three hundred and four votes, and shake the loser’s hand, and mean it.', 'You win by eleven votes, after two recounts and a sandwich.', 'You win comfortably, which nobody had told you was likely, least of all you.'])} You are the councillor for the harbour ward.`;
      }
      L.joy(-6);
      return L.pick(['Third of four, ahead of a man who stood on the single issue of seagulls. There is always next time.', 'You lose by ninety votes. Your leaflets turn up as lining in the chip shop for weeks.']);
    },
  });
  def('midCouncil', {
    place: 'townhall', sec: 'The ward', icon: '🏛️', title: 'Thursday evening: the council meets', time: 1, per: 1,
    desc: (L) => { const st = M(L).seat; return `${Math.max(0, st.until - L.s.t)} season${st.until - L.s.t === 1 ? '' : 's'} left of your term. Miss three in a row and the Gazette notices.${st.miss ? ` (You have missed ${st.miss}.)` : ''}`; },
    show: (L) => L.midSeat(),
    run(L) {
      const st = M(L).seat;
      st.att = L.s.t;
      L.karma(1); L.gain('smarts', 0.8); L.gain('charm', 0.8);
      return L.pick(['Two hours on bins, one on parking, and five minutes on the thing that matters, at the end, when everybody wants to go home.', 'A member of the public asks a question that takes eleven minutes. It is about a hedge.', 'You get a pothole on Chapel Row filled. It is the proudest moment of your political career so far.', 'The tea is stewed, the biscuits are custard creams, and the motion is carried, seven to six.']);
    },
  });

  // ---- a year out ----

  def('midYearOpen', { place: 'station', sec: 'A year out', icon: '🧳', title: 'Take a year out', desc: 'A year away from work, with your job held for you: to travel, to learn something, or to be at home.', time: 0, open: 'midPlans', show: (L) => L.s.age >= 35 && L.s.age <= 62 && !!L.s.job && !L.midAway() });
  def('midYearOut', {
    time: 0, cost: (L, how) => (['travel', 'learn', 'home'].includes(how) ? L.midYearCost(how) : 0),
    why: (L, how) => (!['travel', 'learn', 'home'].includes(how) ? 'A year out doing what?' : L.midYearWhy()),
    run(L, how) {
      const s = L.s, m = M(L);
      m.sab = { until: s.t + 4, how, c: s.job.c, at: s.t };
      m.done.yearOut = s.age; m.n.years++;
      L.midFresh(5); L.joy(6);
      L.note(`Took a year out from work, ${{ travel: 'to travel', learn: 'to learn something new', home: 'to be at home' }[how]}.`, 'big');
      return { travel: 'A rucksack, a map with a line drawn on it and your job held for you until next year. The boss shakes your hand, looking slightly envious.', learn: 'You sign up for evening classes, day classes and a correspondence course in something you have always meant to understand. The boss holds your job, and your mug.', home: 'No alarm clock for a year. You find out what the house sounds like at eleven in the morning, and who comes to the door.' }[how];
    },
  });

  // ---- a trust in your name ----

  def('midTrustOpen', {
    place: 'townhall', sec: 'In your name', icon: '🏛️', title: (L) => (M(L).trust ? M(L).trust.name : 'Found something in your name'), time: 0, open: 'midPlans',
    desc: (L) => { const t = M(L).trust; return t ? `${CAUSES[t.cause].icon} For ${CAUSES[t.cause].name}. ${money(t.fund)} left in the fund.` : `A trust with your name on it, for something the town needs, endowed with ${money(L.midTrustCost())} or more, and kept going.`; },
    show: (L) => L.s.age >= 35 && (!!M(L).trust || L.s.cash + L.s.bank >= L.midTrustCost() * 0.8),
  });
  def('midFound', {
    time: 1, cost: (L) => L.midTrustCost(),
    why: (L, c) => (!CAUSES[c] ? 'For what?' : M(L).trust ? 'You have a trust already.' : L.s.age < 35 ? 'Later, perhaps.' : null),
    run(L, c) {
      const s = L.s, m = M(L), n = L.midTrustCost(), name = L.midTrustName();
      m.trust = { name, cause: c, fund: n, start: n, at: s.t, chair: s.t, good: 0, n: 0 };
      m.done.trust = s.age;
      s.n.given = (s.n.given || 0) + n;
      L.karma(8); L.fame(3); L.joy(8); L.midFresh(5);
      L.note(`Founded ${name}, for ${CAUSES[c].name}, with ${money(n)}.`, 'big');
      L.say(CAUSES[c].icon, `${name} is founded`, 'dream');
      return `Mrs Gale draws up the deed, the bank opens the account, and the Gazette prints a photograph of you shaking hands with the mayor in front of a cheque the size of a door. ${name} is for ${CAUSES[c].name}, and it starts in the spring.`;
    },
  });
  def('midChair', {
    place: 'townhall', sec: 'In your name', icon: '📑', title: (L) => `Chair the trustees of ${M(L).trust ? M(L).trust.name.replace(/^The /, 'the ') : 'your trust'}`, time: 1, per: 1,
    desc: 'Read the accounts, ask the awkward question, sign the cheques. A trust that is watched is a trust that is kept honest.',
    show: (L) => !!M(L).trust,
    run(L) {
      const t = M(L).trust;
      t.chair = L.s.t;
      L.karma(1); L.gain('smarts', 0.6);
      return L.pick(['The treasurer has done the accounts in three colours of pen. They balance, in all three.', 'You go through every receipt. One is for a parrot, and turns out to be for the youth theatre’s production of Treasure Island.', 'An hour in the back room of the Town Hall, deciding who gets the money this year. It is the hardest hour of the season, and the best.']);
    },
  });
  def('midTopUp', {
    time: 0, cost: (L) => L.midPrice(15000),
    why: (L) => (!M(L).trust ? 'You have no trust.' : null),
    run(L) { const t = M(L).trust, n = L.midPrice(15000); t.fund += n; L.s.n.given = (L.s.n.given || 0) + n; L.karma(2); L.joy(2); return `${money(n)} more into the fund. The treasurer writes it in the book with a flourish.`; },
  });

  // ---- the wobble: seeing it through ----

  def('midTrain', {
    place: 'park', sec: 'The Coast Marathon', icon: '🏃', title: 'Train for the Coast Marathon', time: 1, per: 1,
    desc: (L) => `Long runs along the front, then longer. ${M(L).plan.n} of 4 training runs done; the race is the summer after.`,
    show: (L) => !!M(L).plan && M(L).plan.id === 'run' && M(L).plan.n < 4,
    run(L) {
      const p = M(L).plan;
      p.n++;
      L.gain('fitness', 2.5); L.hp(1); L.s.use.fit = 1;
      if (p.n >= 4) { p.ready = L.s.t; return 'Twenty miles along the cliff road and back, and you can still walk afterwards. You are ready. The race is next summer.'; }
      return L.pick(['Six miles, then eight. A man walking his dog overtakes you on the hill, and you let him.', 'You run in the rain and feel heroic. You run in the sun and feel sick.', 'You buy proper shoes, and your knees write you a thank-you letter.']);
    },
  });
  def('midRehearse', {
    place: 'studios', sec: 'The band', icon: '🎸', title: 'Rehearse with the band', time: 1, per: 1, cost: 40,
    desc: (L) => `In the back room at the studios, too loud. ${M(L).plan.n} of 4 rehearsals; then a gig at the Gull.`,
    show: (L) => !!M(L).plan && M(L).plan.id === 'band' && M(L).plan.n < 4,
    run(L) {
      const p = M(L).plan;
      p.n++;
      L.gain('craft', 2); L.joy(3);
      if (p.n >= 4) { L.queue('midGig'); return 'You get through the whole set without stopping. The drummer says it is "basically there". The landlord of the Gull has given you a Friday.'; }
      return L.pick(['The bass player is an accountant called Clive and very good. The drummer is very loud.', 'You argue for forty minutes about the name of the band and play for twenty.', 'You remember all the words to the second song, and none to the first.']);
    },
  });

  // ---- the cards ----

  const isKid = (L, x) => { const p = L.person(x && x.p); return !!p && p.kind === 'child' && p.age >= 18; };
  addEvents([
    {
      id: 'midWobble', icon: '🪞', title: 'The same week again', w: 0, ok: (L) => !L.s.gaol && !M(L).plan,
      text: (L) => `You are ${L.s.age}. You get up, you go to work, you come home, and the week after is the same week again. ${L.partner() ? `${first(L.partner())} asks if you are all right. You say yes.` : 'Nobody asks if you are all right, which is its own answer.'} Something has to change.`,
      opts: [
        { t: 'The red Varenna on Jess Dobbs’s forecourt', show: (L) => !!A.motorNew && !L.can('motorNew', 'vela'), cost: (L) => Math.max(0, L.motorNet(MODELS.vela.price)),
          run(L) { A.motorNew.run(L, 'vela'); if (L.s.motor && L.s.motor.car) L.s.motor.car.col = 'red'; L.joy(10); L.midFresh(2); const p = L.partner(); if (p) L.bond(p, -3); return `It is red, and low, and goes like a train. ${p ? `${first(p)} looks at it for a long time and says nothing, loudly.` : 'You drive it to the end of the cliff road and back, twice.'} For a few months, it helps.`; } },
        { t: 'Sign up for the Coast Marathon', run(L) { M(L).plan = { id: 'run', n: 0, at: L.s.t }; L.midFresh(2); L.joy(3); return 'You fill in the form before you can think better of it. Twenty-six miles, along the coast road, next summer. Training starts in the park.'; } },
        { t: 'Get a band together', run(L) { M(L).plan = { id: 'band', n: 0, at: L.s.t }; L.midFresh(2); L.joy(4); return 'A card in the window of the music shop: BASS AND DRUMS WANTED, NO TIME-WASTERS. Two time-wasters answer, and you take them both. Rehearsals at the studios.'; } },
        { t: (L) => `Talk it over with ${first(L.partner())}, on the sea wall`, show: (L) => !!L.partner(), run(L) { const p = L.partner(); L.bond(p, 8); L.midSaw(p); L.midFresh(2); L.joy(4); return `You walk to the end of the sea wall and back, twice, and say all of it. ${first(p)} has felt the same, as it turns out, for about a year. It helps more than any car would.`; } },
        { t: 'It will pass', run(L) { L.joy(-2); return 'You buy a better coffee machine. It does not pass.'; } },
      ],
    },
    {
      id: 'midRace', icon: '🏅', title: 'The Coast Marathon', w: 0, ok: (L) => !!M(L).plan && M(L).plan.id === 'run' && !L.s.gaol,
      text: 'Twenty-six miles along the coast road, from Kettleby to the harbour. Four thousand people in shorts, and a man dressed as a lighthouse.',
      opts: [
        { t: 'Run your own race', odds: (L) => clamp(0.35 + L.s.st.fitness / 140 - Math.max(0, L.s.age - 50) / 60, 0.25, 0.92),
          run(L, x, win) { const m = M(L); m.plan = null; m.done.run = L.s.age; L.midFresh(win ? 8 : 3); if (win) { L.joy(12); L.gain('fitness', 3); L.fame(0.5); L.note(`Ran the Coast Marathon, at ${L.s.age}.`, 'big'); return `${L.pick(['Four hours and twenty minutes.', 'Four hours and fifty-one minutes.', 'Three hours and fifty-eight minutes, which you will mention for the rest of your life.'])} You cross the line on the harbour with your arms in the air, and cry, and are given a foil blanket and a banana. The medal goes on the kitchen wall.`; } L.hp(-6, 'the marathon'); L.joy(-3); return 'Something in your calf goes at mile nineteen, with a noise like a twig. You walk the last seven, and finish behind the lighthouse. You get a medal anyway.'; } },
        { t: 'Go off fast with the club runners', odds: (L) => clamp(0.15 + L.s.st.fitness / 130 - Math.max(0, L.s.age - 45) / 50, 0.1, 0.8),
          run(L, x, win) { const m = M(L); m.plan = null; m.done.run = L.s.age; L.midFresh(win ? 8 : 2); if (win) { L.joy(15); L.gain('fitness', 4); L.fame(1.5); L.note(`Ran the Coast Marathon in under three and a half hours, at ${L.s.age}.`, 'big'); return 'Three hours and twenty-four minutes. The Gazette prints your name in the list of local finishers, in the top fifty, in bold.'; } L.hp(-10, 'the marathon'); L.joy(-5); return 'You are on the pace for sixteen miles, and on a stretcher for the seventeenth. Two weeks with your leg up.'; } },
      ],
    },
    {
      id: 'midGig', icon: '🎤', title: 'Friday night at the Gull', w: 0, ok: (L) => !!M(L).plan && M(L).plan.id === 'band' && !L.s.gaol,
      text: (L) => `The back room of the Gull & Anchor, forty people, a borrowed PA. ${L.partner() ? `${first(L.partner())} is at the front.` : 'Half the people you know are at the front.'} The drummer counts you in, wrongly.`,
      opts: [
        { t: 'Play the set you rehearsed', check: ['craft', 40], run(L, x, win) { const m = M(L); m.plan = null; m.done.band = L.s.age; m.n.gigs++; L.midFresh(win ? 8 : 4); if (win) { L.joy(12); L.fame(1.5); L.cash(120); L.note('Played a gig at the Gull & Anchor with my band, in my middle years.', 'big'); return 'They dance. They actually dance. The landlord gives you $120 and asks if you are free next month. You are.'; } L.joy(5); return 'You go wrong in the second song and everybody notices, and you laugh, and so do they, and the rest of it is the best night you have had in years.'; } },
        { t: 'Open with the song you wrote', check: ['craft', 55], run(L, x, win) { const m = M(L); m.plan = null; m.done.band = L.s.age; m.n.gigs++; L.midFresh(win ? 8 : 4); if (win) { L.joy(14); L.fame(3); L.cash(120); L.note('Played a song I wrote, to a full room at the Gull & Anchor.', 'big'); return 'Forty people go quiet, and then they sing the chorus back at you the second time round. Somebody films it. It is on Chirper by morning.'; } L.joy(3); return 'It is a better song in your kitchen. You get through it, and then play the covers, which go down a storm.'; } },
      ],
    },
    {
      id: 'midBack', icon: '💼', title: 'The year is up', w: 0, ok: (L) => !!M(L).sab,
      text: (L) => `Your year out is over. ${{ travel: 'You have a tan, a rucksack of washing and a view on most things.', learn: 'You have a head full of new things, and a certificate.', home: 'The house has never been so tidy, or the family so close.' }[M(L).sab.how]} On Monday the job wants you back.`,
      opts: [
        { t: 'Go back with fresh eyes', run(L) { const s = L.s, m = M(L), sb = m.sab; m.sab = null; L.midFresh(2); if (!s.job || s.job.c !== sb.c) return 'The job has gone on without you, as jobs do.'; if (L.chance(0.25)) { s.job.perf = clamp(s.job.perf - 20, 0, 100); s.stand[s.job.c] = s.job.perf; L.joy(-3); return 'Somebody has been doing your job while you were away, rather well, and has a plant on your desk. It takes a season to get it back.'; } s.job.perf = clamp(s.job.perf + 12, 0, 100); s.stand[s.job.c] = s.job.perf; L.joy(4); return 'You see in a week what nobody had seen in years, and say so, nicely. The boss is very glad you came back.'; } },
        { t: 'Do not go back: hand in your notice', run(L) { const s = L.s, m = M(L); m.sab = null; L.midFresh(4); if (s.job) { L.note(`Did not go back to work as ${L.jobTitle()} after a year out.`, 'big'); s.job = null; } L.joy(3); return 'You write the letter on the kitchen table and post it before you can think better of it. Whatever comes next, it will not be the same week again.'; } },
      ],
    },
    {
      id: 'midVote', icon: (L, x) => VOTES[x.k].icon, title: (L, x) => `The council votes on ${VOTES[x.k].title}`, w: 0, ok: (L, x) => L.midSeat() && !!VOTES[x && x.k],
      text: (L, x) => `${VOTES[x.k].text} The vote is on Thursday, and it is close: yours may be the one that decides it.`,
      opts: [0, 1].map((i) => ({
        t: (L, x) => VOTES[x.k].opts[i][0],
        run(L, x) {
          const [, said, fx] = VOTES[x.k].opts[i], st = M(L).seat;
          if (fx.karma) L.karma(fx.karma);
          if (fx.fame) L.fame(fx.fame);
          if (fx.folk) folk(L, fx.folk[0], fx.folk[1]);
          st.ward += fx.ward || 0; M(L).n.votes++;
          L.joy(1);
          return said;
        },
      })).concat([{ t: 'Abstain, and say you need more information', run(L) { const st = M(L).seat; st.ward -= 2; L.joy(-1); return 'The vote is carried by one, without you. The Gazette prints the names of the councillors who sat on their hands, yours among them.'; } }]),
    },
    {
      id: 'midCensure', icon: '📰', title: 'Where is our councillor?', w: 0, ok: (L) => L.midSeat(),
      text: 'The Gazette has noticed that the councillor for the harbour ward has missed three meetings in a row, and prints your photograph above the words WHERE IS OUR COUNCILLOR?',
      opts: [
        { t: 'Apologise in print, and turn up', run(L) { const st = M(L).seat; st.miss = 1; st.ward -= 3; L.karma(-1); return 'A short letter in the Gazette, and a long Thursday at the Town Hall. Nobody says anything, pointedly.'; } },
        { t: 'Stand down: you cannot give it the time', run(L) { const m = M(L); m.seat.until = L.s.t; L.karma(-2); L.fame(-1); L.note('Stood down from the council before the end of my term.'); return 'There is a by-election in the spring. The new councillor turns up to everything.'; } },
      ],
    },
    {
      id: 'midTerm', icon: '🗳️', title: 'Four years on', w: 0, ok: (L) => !!M(L).seat,
      text: (L) => `Your term as councillor for the harbour ward is nearly over. ${M(L).seat.ward >= 6 ? 'People stop you in the street to say they hope you are standing again.' : M(L).seat.ward <= -4 ? 'There are people in the ward who cross the road to avoid you.' : 'The ward seems neither here nor there about you, which is what a ward is like.'}`,
      opts: [
        { t: 'Stand again', cost: (L) => L.midPrice(2000), odds: (L) => L.midStandOdds() + 0.1,
          run(L, x, win) { const s = L.s, m = M(L), st = m.seat; st.terms++; m.n.terms++; m.done.term = s.age; if (win) { st.since = s.t + 1; st.until = s.t + 1 + TERM; st.votes = []; st.miss = 0; L.joy(6); L.note('Re-elected to the council.', 'big'); return 'Re-elected, by more than last time. You buy the count a round in the church hall, which is technically a breach of something.'; } st.until = s.t + 1; m.ran = s.t; L.joy(-6); return 'You lose, by a few dozen votes, to somebody who promised to do something about the gulls. Four years, and a box of letters from the ward, which you keep.'; } },
        { t: 'Stand down while they still like you', run(L) { const s = L.s, m = M(L); m.seat.terms++; m.n.terms++; m.done.term = s.age; m.seat.until = s.t + 1; L.karma(2); L.joy(2); L.note('Stood down from the council after a full term.'); return 'A farewell at the Town Hall with sherry and a speech by the mayor, who gets your name nearly right.'; } },
      ],
    },
    {
      id: 'midTrustYear', icon: (L) => CAUSES[M(L).trust.cause].icon, title: (L) => M(L).trust.name, w: 0, ok: (L) => !!M(L).trust,
      text: (L, x) => CAUSES[M(L).trust.cause].good[x.i],
      opts: [{ t: 'Worth every penny', run(L) { const t = M(L).trust; t.good++; L.joy(3); return 'You read it twice, and put the letter in the drawer with the others.'; } }],
    },
    {
      id: 'midTrustBooks', icon: '📑', title: 'The trust’s accounts', w: 0, ok: (L) => !!M(L).trust,
      text: (L) => `Nobody has chaired a meeting of ${M(L).trust.name.replace(/^The /, 'the ')} for a year, and the treasurer has been buying a great many things for the office, including a car.`,
      opts: [
        { t: 'Put it right quietly, out of your own pocket', cost: (L) => L.midPrice(8000), run(L) { const t = M(L).trust; t.chair = L.s.t; L.joy(-2); return 'The treasurer resigns for family reasons. You pay back what went, and chair every meeting from now on.'; } },
        { t: 'Call in the police', run(L) { const t = M(L).trust; t.chair = L.s.t; t.fund = Math.max(0, t.fund - round(t.start * 0.15, 500)); L.fame(-1); L.karma(1); return 'The treasurer is in the Gazette, and so, less kindly, are you: TRUST CHIEF “NEVER LOOKED AT THE BOOKS”. Some of the money is never found.'; } },
      ],
    },
    {
      id: 'midTrustLow', icon: '🪫', title: (L) => `${M(L).trust.name}: the fund is running low`, w: 0, ok: (L) => !!M(L).trust,
      text: (L) => `The fund is down to ${money(M(L).trust.fund)}. Another year or two of ${CAUSES[M(L).trust.cause].name}, and then it is gone.`,
      opts: [
        { t: (L) => `Put in ${money(L.midPrice(25000))} more`, cost: (L) => L.midPrice(25000), run(L) { const t = M(L).trust, n = L.midPrice(25000); t.fund += n; L.s.n.given = (L.s.n.given || 0) + n; L.karma(3); L.joy(2); return 'Another few years, then. The children, the students, whoever it is, will not know your name, and that is rather the point.'; } },
        { t: 'Hold a dinner and ask the town', check: ['charm', 55], run(L, x, win) { const t = M(L).trust; if (win) { t.fund += round(t.start * 0.4, 500); L.fame(1); L.joy(4); return 'A dinner at the Gull, speeches, an auction of a signed rugby ball. You raise more than you thought the town had.'; } t.fund += round(t.start * 0.1, 500); L.joy(-1); return 'Thirty people come, and are very generous, and it is not enough.'; } },
        { t: 'Let it run down, and wind it up', run(L) { const m = M(L), t = m.trust; m.trust = null; m.done.trustEnd = L.s.age; L.joy(-4); L.note(`Wound up ${t.name} after ${t.n} year${t.n === 1 ? '' : 's'}.`); return `The last of the money goes where it was meant to. ${t.name} is a line in the Gazette, and a plaque somebody will paint over in time.`; } },
      ],
    },
    {
      id: 'midNest', icon: '🏡', title: 'A house of their own', w: 3, cd: 16,
      when: (L) => L.s.age >= 45 && L.s.cash + L.s.bank >= L.midPrice(20000) * 1.5 && L.kids().some((k) => k.age >= 25 && k.age <= 42 && !M(L).nest[k.id]),
      ctx: (L) => { const k = L.kids().filter((c) => c.age >= 25 && c.age <= 42 && !M(L).nest[c.id]); if (!k.length) return null; const p = L.pick(k); M(L).nest[p.id] = 'asked'; return { p: p.id, n: L.midPrice(20000) }; },
      ok: isKid,
      text: (L, x) => { const p = L.person(x.p); return `${first(p)} has found a house up on Chapel Row: two bedrooms, a yard, and a damp patch the surveyor did not mention. ${He(p)} is ${money(x.n)} short of the deposit, and has not asked, which is how you know.`; },
      opts: [
        { t: (L, x) => `Give ${him(L.person(x.p))} the ${money(x.n)}`, cost: (L, x) => x.n, run(L, x) { const p = L.person(x.p); M(L).nest[p.id] = 'gave'; L.bond(p, 15); L.midSaw(p); L.joy(5); L.midFresh(2); L.note(`Gave ${first(p)} the deposit for a house of ${his(p)} own.`, 'big'); return `${first(p)} cries on the phone, and then again on the doorstep, and then again when ${he(p)} gets the keys. You are given the spare one.`; } },
        { t: 'Lend it, to be paid back over three years', cost: (L, x) => x.n, run(L, x) { const p = L.person(x.p); M(L).nest[p.id] = 'lent'; M(L).lent.push({ p: p.id, n: x.n, left: x.n, each: round(x.n / 12, 10) }); L.bond(p, 6); L.midSaw(p); return `You write it down in a little book, and so does ${first(p)}. ${He(p)} means every word.`; } },
        { t: 'Say it is time they stood on their own feet', run(L, x) { const p = L.person(x.p); M(L).nest[p.id] = 'no'; L.bond(p, -10); return `${first(p)} says ${he(p)} understands. The house on Chapel Row goes to somebody else, and ${he(p)} rents a flat over the launderette for another five years.`; } },
      ],
    },
    {
      id: 'midNestShort', icon: '📒', title: 'A month behind', w: 0, ok: (L, x) => M(L).lent.some((l) => l.p === x.p) && !!L.person(x.p),
      text: (L, x) => { const p = L.person(x.p), l = M(L).lent.find((q) => q.p === x.p); return `${first(p)} rings, which ${he(p)} never does. Work has gone quiet, and there is a baby on the way, or a boiler gone, or both. ${He(p)} still owes you ${money(l.left)} on the house, and cannot find it this year.`; },
      opts: [
        { t: 'Let the rest go: call it a present', run(L, x) { const m = M(L), p = L.person(x.p), l = m.lent.find((q) => q.p === x.p); m.lent.splice(m.lent.indexOf(l), 1); L.bond(p, 10); L.midSaw(p); L.joy(1); return `You tear the page out of the little book while ${he(p)} is on the phone, so ${he(p)} can hear it.`; } },
        { t: 'Give them a year, then the payments start again', run(L, x) { const l = M(L).lent.find((q) => q.p === x.p); l.late = 0; l.each = round(l.each * 1.2, 10); L.bond(L.person(x.p), 2); return 'A year’s grace, and then a little more each season. It is fair, and everybody knows it is fair.'; } },
        { t: 'A loan is a loan', run(L, x) { const l = M(L).lent.find((q) => q.p === x.p); l.late = 0; L.bond(L.person(x.p), -12); return 'The payments go on. So does a certain stiffness at Christmas.'; } },
      ],
    },
  ]);

  // ---- the race and the end of a year out come round on their own ----
  hooks.late.push((L, jailed) => {
    const m = M(L), p = m.plan;
    if (!jailed && p && p.id === 'run' && p.ready != null && L.season === 1 && !L.s.pend.some((q) => q.id === 'midRace')) L.queue('midRace');
    // (A plan nobody has touched in three years is quietly dropped.)
    if (p && L.s.t - p.at >= 12 && !(p.id === 'run' && p.ready != null)) m.plan = null;
  });

  // ---- what the Gazette says ----
  hooks.epitaph.push((L, out) => {
    const s = L.s, m = M(L), He2 = s.sex === 'f' ? 'She' : 'He', he2 = He2.toLowerCase();
    if (m.n.terms) out.push(`${He2} sat on the council for the harbour ward${m.n.terms > 1 ? ` for ${m.n.terms} terms` : ''}, and turned up on Thursdays.`);
    if (m.trust) out.push(`${m.trust.name}, which ${he2} founded, still pays for ${CAUSES[m.trust.cause].name}.`);
    else if (m.done.trust != null) out.push(`${He2} founded a trust in ${s.sex === 'f' ? 'her' : 'his'} name, which did a great deal of good while it lasted.`);
    if (m.done.run != null) out.push(`At ${m.done.run} ${he2} ran the Coast Marathon, and kept the medal on the kitchen wall.`);
    else if (m.done.band != null) out.push(`At ${m.done.band} ${he2} played a gig at the Gull & Anchor with a band of people who should have known better.`);
  });

  Object.assign(TROPHIES, {
    midClose: { name: 'Kept close', icon: '🫂', desc: 'At fifty or over, have five people who really know you (a bond of 85 or more).', test: (L) => !!L.s.mid && L.s.age >= 50 && L.midClose().length >= 5 },
    midTerm: { name: 'For the ward', icon: '🏛️', desc: 'Serve a full term on the council.', test: (L) => !!L.s.mid && L.s.mid.n.terms >= 1 },
    midTrust: { name: 'In your name', icon: '🏛️', desc: 'Found a trust for something the town needs.', test: (L) => !!L.s.mid && L.s.mid.done.trust != null },
    midRun: { name: 'Twenty-six miles', icon: '🏅', desc: 'Run the Coast Marathon in the middle of your life.', test: (L) => !!L.s.mid && L.s.mid.done.run != null },
    midYear: { name: 'A year out', icon: '🧳', desc: 'Take a year away from work, with your job held for you.', test: (L) => !!L.s.mid && L.s.mid.done.yearOut != null },
  });
}
