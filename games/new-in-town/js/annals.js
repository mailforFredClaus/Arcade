// New in Town: the annals of Starling Bay. The town grows old with you.
//
// Every four years the Bay elects a mayor (Mayor Pennington, to begin
// with). Those who stand make a promise that would change the town: a lido
// on the front, a car park on the green, a bypass, a tidal barrier, the
// pier rebuilt, lower rates, a new estate, the supermarket, the railway
// saved. You can vote, campaign, put money on it at the bookmaker's and,
// once politics has made you Deputy Mayor, stand yourself (the Town Hall's
// "Stand for mayor" in engine.js is put on this calendar here). Whoever
// wins keeps the promise, or does not, over the years that follow; what
// gets built changes prices, places, mood and the cards that come.
//
// Across the decades bigger things happen: a great storm that takes the
// pier (and shuts the Lucky Gull until it is rebuilt), a supermarket out
// on the ring road, a film crew, a new estate, the railway threatened with
// closure, a flood, a royal visit, a long hot summer. Each lasts seasons
// or years and changes something real.
//
// The High Street's shops close and open, and the regulars at the Gull &
// Anchor grow old and are replaced by younger faces (the thirteen
// townsfolk of folk.js are left to their own stories). The Gazette keeps a
// timeline, Years in the Bay: a headline for every year of your life here,
// the town's and your own, to read back like a family album.
//
// Everything is kept in s.annals:
//   from: the season the town's own record begins (0, or when an old save first opened)
//   mayor: who holds the chain { k: 'penn', 'you' or a candidate's key, name, sex, age, at, job, plat, since, terms }
//   penn: 'out' once Mayor Pennington has lost, stood down or resigned. cid: the next candidate's number
//   poll: the season of the next polling day. race: the election on now, or null. last: the last result
//   mayors: everybody who has held the chain in your time. plan: promises being kept, or not
//   built: what the promises built, and when. ev: the big events, each with a little state of its own
//   next: when the next big event may come. later: cards to send for in seasons to come
//   shops, gone, shopNext: the High Street. bar, hooks: the Gull's regulars, and the tankards of those who have gone
//   yr: Years in the Bay [{ a: age, i: icon, h: the town's headline, m: yours }]. news: this year's happenings
//   lead: the Gazette's lead story. gave: what you gave to the appeals. n: counts. seen: one-off cards. era: the last card of its kind

import { TROPHIES, NAMES_M, NAMES_F, SURNAMES, SEASONS, ECO, ITEMS, BUSINESSES, money } from './data.js';

const ELECT = 16; // seasons from one polling day to the next
const NOMS = 2; // nominations open this many seasons before polling day
const round10 = (n) => Math.round(n / 10) * 10;
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const list = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);
const has = (L, id) => L.s.annals.built[id] != null;
const ev = (L, id) => L.s.annals.ev[id] || null;
const ago = (L, t) => L.s.t - t;
const recent = (L, id, n) => { const e = ev(L, id); return !!e && ago(L, e.t) <= n; };
const pierShut = (L) => { const e = ev(L, 'storm'); return !!e && !!e.shut; };
const lineThreat = (L) => { const e = ev(L, 'line'); return !!e && e.shut == null && !e.saved; };
const lineShut = (L) => { const e = ev(L, 'line'); return !!e && e.shut != null && e.back == null; };
const marketOpen = (L) => { const e = ev(L, 'market'); return !!e && e.open != null; };
const ratesCut = (L) => has(L, 'rates') && ago(L, L.s.annals.built.rates) < ELECT;
const drives = (L) => !!(L.s.items.car || L.s.items.sportscar);
// How the life began (chapters.js): off the train at eighteen, home again at eighteen, or here all along.
const how = (L) => (L.chapHow ? L.chapHow() : 'train');
const onHigh = (L) => { const b = L.s.biz; return !!b && BUSINESSES[b.type].place === 'highstreet'; };
const inPolitics = (L) => !!L.s.job && L.s.job.c === 'politics';
// A trait of yours (soul.js) can open a choice of its own on a card, marked with its icon there.
const trait = (L, id) => !!L.soulHas && L.soulHas(id);
const TRAIT_ICON = { daredevil: '🪂', joker: '🃏', churchgoer: '⛪' };
const tr = (id, t) => `${TRAIT_ICON[id]} ${t}`;
// What somebody stands for, in a sentence: "for a lido on the front", "for things as they are".
const said = (p) => PLATS[p].said || PLATS[p].name.toLowerCase();

// ---- what candidates promise -------------------------------------------------------------

// base: how well it goes down; pop: how much better just now. keep: the chance it is kept.
// works: seasons to build it; rates: what it costs every household while it is built.
// done and drop: [icon, headline, story] when it is finished, or quietly given up.
export const PLATS = {
  steady: { name: 'Steady as she goes', said: 'things as they are', icon: '⚓', pitch: 'Nothing will change, and that is a promise.', base: 20, keep: 1, works: 0, pop: (L) => (L.s.eco >= 1 ? 8 : 0) },
  lido: {
    name: 'A lido on the front', icon: '🏊', pitch: 'A heated pool by the sea wall, open from May to September.', base: 23, keep: 0.7, works: 8, rates: 30,
    ok: (L) => !has(L, 'lido'), pop: (L) => (L.s.eco >= 1 ? 6 : 0) + (recent(L, 'heat', 16) ? 6 : 0),
    done: ['🏊', 'The lido opens on the front', 'A sheet of blue between the sea wall and the sea, and children in it before the speeches are over.'],
    drop: ['The lido is quietly shelved', 'The drawings go back in a drawer at the Town Hall. "Not this year," says the council, which is what it says.'],
  },
  carpark: {
    name: 'A car park on the green', icon: '🅿️', pitch: 'Two hundred spaces where the green is, and shoppers back on the High Street.', base: 19, keep: 0.8, works: 3,
    ok: (L) => !has(L, 'carpark'), pop: (L) => (marketOpen(L) ? 9 : 0),
    done: ['🅿️', 'Car park opens on the green', 'Two hundred spaces, a pay machine that takes no coins, and the bandstand marooned in the middle of it.'],
    drop: ['No car park on the green after all', 'The surveyors find the green is mostly an old pond. The council decides it likes it as a green.'],
  },
  green: {
    name: 'Give back the green', icon: '🌳', pitch: 'Dig up the car park on the green and put the grass back.', base: 26, keep: 0.85, works: 3,
    ok: (L) => has(L, 'carpark'), pop: (L) => (ago(L, L.s.annals.built.carpark) > 24 ? 6 : 0),
    done: ['🌳', 'The green is green again', 'The tarmac comes up, the turf goes down, and on the first Sunday there are deckchairs and a dog chasing a frisbee where the pay machine was.'],
    drop: ['The car park stays', 'Ripping it up, the council finds, would cost more than putting it down. The pay machine is given a fresh coat of paint instead.'],
  },
  bypass: {
    name: 'A bypass', icon: '🛣️', pitch: 'The lorries round the back of the town, and the High Street quiet again.', base: 20, keep: 0.6, works: 12,
    ok: (L) => !has(L, 'bypass'),
    done: ['🛣️', 'The bypass opens', 'The lorries go round the back of the town now. On the High Street you can hear the gulls again, and the shops are not sure whether to be pleased.'],
    drop: ['Bypass plans abandoned', 'The money runs out somewhere near the roundabout. The bypass stops in a field, where it is visited by cows.'],
  },
  barrier: {
    name: 'A tidal barrier', icon: '🚧', pitch: 'Steel gates across the harbour mouth, before the sea comes in.', base: 12, keep: 0.75, works: 12, rates: 40,
    ok: (L) => !has(L, 'barrier'), pop: (L) => { const f = ev(L, 'flood'); return (f && !f.held ? 32 : 0) + (pierShut(L) ? 6 : 0); },
    done: ['🚧', 'The tidal barrier is finished', 'Two steel gates the height of a house, across the harbour mouth. They are closed once for the cameras, and Captain Quinn watches with her arms folded.'],
    drop: ['No barrier, says the council', 'The engineers want twice what was promised. The council decides the sea can wait.'],
  },
  pier: {
    name: 'Rebuild the pier', icon: '🎡', pitch: 'The pier mended, and the Lucky Gull open again by next summer.', base: 40, keep: 0.85, works: 5,
    ok: (L) => pierShut(L),
    drop: ['The pier stays shut', 'The council’s engineers say the ironwork cannot be saved for the money. It is left to the Pier Trust, and the gulls.'],
  },
  rates: {
    name: 'Lower rates', icon: '✂️', pitch: 'Ninety dollars a season back in every household, and no frills.', base: 19, keep: 0.9, works: 1,
    ok: (L) => !ratesCut(L), pop: (L) => (L.s.eco <= -1 ? 12 : 0),
    done: ['✂️', 'Council rates cut', 'Ninety dollars a season back in every household. The public toilets on the front close, and the Christmas lights are cut to one string.'],
    drop: ['The rates cut that never was', 'There is a hole in the budget, the council finds, roughly the shape of the promise.'],
  },
  homes: {
    name: 'Homes for local people', icon: '🏘️', pitch: 'A new estate on the old brickworks, so the young can afford to stay.', base: 19, keep: 0.8, works: 2,
    ok: (L) => !ev(L, 'estate'), pop: (L) => (L.s.idx >= 1.5 ? 10 : 0),
    drop: ['No new homes on the brickworks', 'The developer and the council fall out over the roundabout. The brickworks stays a place for teenagers and buddleia.'],
  },
  jobs: {
    name: 'Bring in the jobs', icon: '🛒', pitch: 'Say yes to the big supermarket out on the ring road.', base: 15, keep: 0.9, works: 2,
    ok: (L) => !ev(L, 'market'), pop: (L) => (L.s.eco <= -1 ? 12 : 0),
    drop: ['The supermarket goes elsewhere', 'The supermarket builds in Kettleby instead. The High Street does not hide its relief.'],
  },
  line: {
    name: 'Save the railway', icon: '🚂', pitch: 'Keep the trains running to the city, whatever it costs.', base: 40, keep: 0.8, works: 4,
    ok: (L) => lineThreat(L) || lineShut(L),
    drop: ['The railway promise comes to nothing', 'Letters are written to the ministry. The ministry writes back, eventually, to say it has received them.'],
  },
};

// Who stands: [what they do, sex or null for either].
const STANDERS = [
  ['who runs the chemist’s', 'f'], ['a retired headmistress', 'f'], ['a fisherman’s son with a voice for a gale', 'm'], ['the estate agent whose face is on every board', null],
  ['a nurse from St Wren’s', null], ['a builder who has fixed half the roofs in town', 'm'], ['the woman from the caravan park', 'f'], ['a councillor of twenty years, and it shows', null],
  ['who owns the Seaview Hotel', null], ['a former Rovers goalkeeper', 'm'], ['a young teacher at the primary school', null], ['who runs the bakery, and gets up at four', null],
  ['a solicitor with a very good umbrella', null], ['the lifeboat’s former second coxswain', null],
];
// (Names the town already has a use for are left out.)
const SURN = SURNAMES.filter((n) => !['Marlow', 'Achebe', 'Kowalski', 'Okafor', 'Larkin', 'Quayle', 'Drake', 'Thackeray', 'Fairweather', 'Tregenza', 'Hartley', 'Brightwater'].includes(n));

// ---- the High Street and the Gull --------------------------------------------------------

// The shops that come and go (Betty's, Mr Pym's, the barber's and the newsagent stay). since: in seasons before the start.
const SHOPS0 = [['Fairweather’s Shoes', 248], ['Tregenza & Sons, the ironmonger’s', 300], ['the Seaview Bookshop', 92], ['Hartley’s the butcher’s', 164], ['Noah’s Ark Toys', 120], ['Brightwater’s Rock & Fudge', 204]];
const NEW_SHOPS = {
  slump: ['a charity shop for the lifeboat', 'a pound shop', 'a bookmaker’s', 'a shop with whitewash on the windows and TO LET in one corner', 'a carpet shop that has been closing down for years', 'a shop that sells everything for under five dollars'],
  steady: ['a florist’s', 'a launderette', 'a card shop', 'a pet shop', 'a phone repair shop', 'a Chinese takeaway', 'a shoe repairer’s that also cuts keys', 'a wool shop', 'a fish and chip shop', 'a hardware shop'],
  boom: ['a delicatessen', 'a wine bar', 'an artisan bakery with a queue', 'a gallery of seascapes', 'a surf shop', 'a coffee roaster’s', 'an estate agent’s', 'a boutique that sells one dress at a time', 'a cheese shop that is not Priya’s'],
};
const SHUT_WHY = {
  old: ['The owner is retiring, and nobody wants the business.', 'The family has run out of family who want it.', 'Nobody, it turns out, wanted to learn the trade.'],
  rent: ['The landlord has doubled the rent.', 'The building has been sold to a man from the city.'],
  slump: ['Trade had dried up.', 'The slump did it, in the end.'],
  market: ['The supermarket on the ring road sells the same for less.'],
  flood: ['The flood was the last straw.'],
};
// The regulars, as they are when you first walk in. since: seasons they have been coming.
const BAR0 = [
  { n: 'Big Tam', sex: 'm', age: 34, does: 'arm-wrestles anybody for a hundred dollars', tam: 1, since: 48 },
  { n: 'Mick Quayle', sex: 'm', age: 57, does: 'keeps the bar, and boos the open mic', host: 1, since: 100 },
  { n: 'Dot Hennessy', sex: 'f', age: 71, does: 'plays dominoes for pennies, and wins', since: 204 },
  { n: 'Ken Larkin', sex: 'm', age: 66, does: 'does the crossword in ink, out loud', since: 160 },
  { n: 'Fred Pascoe', sex: 'm', age: 59, does: 'tells the one about the whale', since: 140 },
  { n: 'Shirley Drake', sex: 'f', age: 47, does: 'explains the tides to anybody who stands still', since: 80 },
];
const DOES = [
  'comes in after night shifts at St Wren’s and dozes in the corner', 'brings a laptop from Lighthouse Labs and is asked to put it away', 'sings sea shanties, mostly in tune',
  'runs the darts team, and the darts team’s grudges', 'has a dog better known than they are', 'is learning the accordion, in public', 'knows the football results before they happen, and says so',
  'is saving up to sail round the world, and has been for some time', 'reads poetry at the open mic and is not booed', 'keeps a tally of gulls on a beer mat', 'collects the empty glasses for nothing, out of kindness',
  'argues about the council with anybody', 'tells the one about the whale now, and tells it better', 'explains the tides now, to anybody who stands still',
];
const GONE = {
  old: ['went to live with a daughter in Kettleby', 'moved into the home on Cliff Road, and sends regards', 'gave up drinking on doctor’s orders, and sits in the window of the café instead'],
  young: ['moved to the city for work', 'married somebody from the next town along', 'went to sea, on a boat out of Falmouth', 'emigrated, and sends postcards of a beach that is not as good as this one'],
};

// ---- the town's own luck -----------------------------------------------------------------

// The big events, and the seasons they can start in. w: how likely, when more than one is due.
const BIG = {
  storm: { w: 3, q: [2, 3], ok: (L) => !ev(L, 'storm') },
  market: { w: 3, q: [0, 1, 2, 3], ok: (L) => !ev(L, 'market') },
  film: { w: 2, q: [0], ok: (L) => !ev(L, 'film') },
  estate: { w: 2, q: [0, 1, 2, 3], ok: (L) => !ev(L, 'estate') },
  line: { w: 2, q: [0, 1, 2, 3], ok: (L) => !ev(L, 'line') },
  flood: { w: 2, q: [2, 3], ok: (L) => !ev(L, 'flood') },
  royal: { w: 2, q: [0, 1], ok: (L) => !ev(L, 'royal') },
  heat: { w: 2, q: [1], ok: (L) => { const e = ev(L, 'heat'); return !e || (e.n < 2 && ago(L, e.t) >= 60); } },
};
// The seasons an event keeps (moved along when the town is handed on to an heir).
const EV_TIMES = ['t', 'due', 'end', 'open', 'air', 'aired', 'done', 'decide', 'shut', 'back'];
// How the obituary speaks of them.
const LIVED = {
  storm: (L) => (ev(L, 'storm').held ? 'the great storm that the pier rode out' : 'the great storm that took the pier'),
  flood: (L) => (ev(L, 'flood').held ? 'the great flood tide that the barrier kept out' : 'the flood'), market: 'the coming of the supermarket', film: 'the summer the film crew came', line: (L) => (ev(L, 'line').saved ? 'the fight to save the railway' : 'the closing of the railway'),
  estate: 'the building of the new estate', royal: 'a royal visit', heat: 'the long hot summer', lido: 'the opening of the lido', bypass: 'the building of the bypass', barrier: 'the building of the tidal barrier',
};

// ---- a few things worth having to hand ---------------------------------------------------

// What a life of a given age makes of polling day.
const nth = (n) => ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][n - 1] || `${n}th`;
// The common odds a bookmaker chalks up, as [to win, staked].
const ODDS = [[1, 5], [1, 4], [2, 7], [1, 3], [2, 5], [1, 2], [4, 7], [4, 6], [4, 5], [10, 11], [1, 1], [6, 5], [5, 4], [11, 8], [6, 4], [13, 8], [7, 4], [2, 1], [9, 4], [5, 2], [3, 1], [7, 2], [4, 1], [9, 2], [5, 1], [6, 1], [7, 1], [8, 1], [10, 1], [12, 1], [16, 1], [20, 1], [25, 1], [33, 1]];
const STAKES = [100, 500];
// How a journal line ranks as the thing to remember a year by.
const MINE = [[/married|wedding/i, 10], [/was born|joined the family|adopted|a baby/i, 10], [/^Died|has died|died at/i, 8], [/mayor/i, 8], [/bestseller|number one|jackpot|start-up|hit record/i, 7],
  [/prison|gaol|bankrupt|arrested/i, 7], [/dream came true/i, 6], [/^Retired/i, 6], [/^Promoted/i, 5], [/whole story|Freedom of/i, 5], [/^Earned|^Published|novel/i, 4], [/^Bought|moved/i, 4], [/^Started work/i, 3]];
// The headline of a year when nothing much happened in town.
const SMALL_NEWS = [
  ['⚽', 'Rovers finish fourth, of six'], ['💡', 'Lighthouse repainted, the same colour'], ['🪑', 'Deckchairs go up by ten cents; letters page in uproar'], ['🐋', 'A whale off Gorse Head, or a large rock'],
  ['🕰️', 'Town Hall clock put right; town complains; clock put back'], ['🦭', 'Seal pup on the slipway draws crowds'], ['🚏', 'New bus shelter "a triumph", says council'], ['🍟', 'Longest chip queue on record'],
  ['🎄', 'Christmas tree on the green falls over, twice'], ['🌫️', 'Fog shuts the harbour for a week; nobody notices'], ['🚤', 'Lifeboat called out forty times; nobody lost'], ['🐝', 'The vicar’s bees swarm on the Town Hall'],
  ['🐦', 'Gulls declared a protected nuisance'], ['🇫🇷', 'Starling Bay twinned with a French town that has not been told'], ['🥧', 'Rovers sign a goalkeeper with a pie clause'], ['🏖️', 'Beach hut sells for the price of a house'],
  ['🛷', 'Snow at last: sledging on the cemetery hill'], ['🌷', 'Starling Bay in Bloom comes second, to a town with more money'], ['🍦', 'Ice-cream van chimes ruled "too cheerful"'], ['🎣', 'The fleet has its best season in years'],
  ['🥇', 'The Gull & Anchor’s pies win a prize'], ['🎺', 'Silver Band plays the wrong anthem at the Regatta'], ['🧀', 'Cheese stolen from Market Square; Priya Lal "not amused"'], ['🦆', 'Duck elected honorary member of the bowls club'],
];
const QUIET = ['A quiet year, and none the worse for it.', 'Nothing much happened, which was nice.', 'The days went by, as they do.', 'A year of ordinary weather and ordinary days.'];

export function install({ def, A, Life, clamp, hooks, addEvents }) {
  // ---- who holds the chain ----

  // The mayor, and anybody else who stands: a little record of their own.
  const pennRec = () => ({ k: 'penn', name: 'Mayor Pennington', sex: 'm', age: 61, at: 0, job: 'mayor like his father and his grandfather', plat: 'steady' });
  // field: who else is on the ballot paper.
  function stander(L, o = {}, field = L.s.annals.race ? L.s.annals.race.c : []) {
    const an = L.s.annals, jobs = new Set([...field, an.mayor].map((c) => c.job)), free = STANDERS.filter(([j]) => !jobs.has(j));
    const [job, sx] = o.job ? [o.job, o.sex] : L.pick(free.length ? free : STANDERS), sex = sx || o.sex || (L.chance(0.5) ? 'm' : 'f');
    // (Nobody on the same ballot paper shares a surname: they are spoken of by it.)
    const taken = new Set([...field, an.mayor].map((c) => c.name.split(' ').slice(-1)[0]));
    let name = o.name;
    for (let i = 0; !name || (taken.has(name.split(' ').slice(-1)[0]) && i < 8); i++) name = `${L.pick(sex === 'm' ? NAMES_M : NAMES_F)} ${L.pick(SURN)}`;
    return { k: `c${an.cid++}`, name, sex, age: o.age || L.int(34, 64), at: L.s.t, job, plat: o.plat || 'steady' };
  }
  const youRec = (L) => ({ k: 'you', name: L.s.name, sex: L.s.sex, age: L.s.age, at: L.s.t, job: 'you', plat: L.s.annals.mine || 'steady' });
  const ageOf = (L, c) => (c.k === 'you' ? L.s.age : c.age + Math.floor((L.s.t - c.at) / 4));
  // How a candidate is spoken of: in full, or by surname.
  const full = (L, c) => (c.k === 'you' ? 'you' : c.k === 'penn' ? (L.annalsPennOut() && L.folkName ? L.folkName('penn') : c.name) : c.name);
  const short = (L, c) => (c.k === 'you' ? 'you' : c.k === 'penn' ? 'Pennington' : c.name.split(' ').slice(-1)[0]);
  const he = (c) => (c.sex === 'f' ? 'she' : 'he');

  // The player holds the chain while Mayor (or mayor-elect) in a politics career.
  const youMayor = (L) => inPolitics(L) && (L.s.job.r >= 4 || !!L.s.f.elected);

  // Keeps who holds the chain in step with the rest of the life: you, the drains, the folk.
  function syncMayor(L) {
    const s = L.s, an = s.annals;
    if (youMayor(L) && an.mayor.k !== 'you') {
      if (an.mayor.k === 'penn') an.penn = 'out';
      an.mayor = { ...youRec(L), since: s.t, terms: 1 };
      an.mayors.push(s.name);
      told(L, 7, '🏛️', `${s.name} takes the chain of office`, 'The new mayor is sworn in at the Town Hall, under the portraits of every mayor since 1832. The clock is still four minutes slow.', 'quiet');
    } else if (an.mayor.k === 'you' && !youMayor(L)) {
      // (Out of office one way or another: the deputy minds the shop until the next election.)
      s.f.elected = 0;
      const d = stander(L, { plat: 'steady' });
      an.mayor = { ...d, since: s.t, terms: 0, acting: 1 };
      an.mayors.push(d.name);
      for (const p of an.plan) if (p.by === 'you') p.by = d.k;
      told(L, 6, '🏛️', `${s.name} gives up the chain`, `${d.name}, ${d.job}, is acting mayor until the next election.`);
    } else if (an.mayor.k !== 'you' && (s.f.drains || 0) >= 2 && !an.drained && an.mayor.k === (s.f.drainsM || 'penn')) {
      // (The drains: whoever held the chain when you found the ledger has resigned (see events.js).
      // The woman from the chemist's minds the shop.)
      const was = an.mayor;
      an.drained = { t: s.t, n: L.annalsMayorTitle(was), sex: was.sex };
      if (was.k === 'penn') an.penn = 'out';
      const d = stander(L, { job: 'who runs the chemist’s', sex: 'f', name: 'Iris Penhallow', age: 52 });
      an.mayor = { ...d, since: s.t, terms: 0, acting: 1 };
      an.mayors.push(d.name);
      told(L, 7, '🎩', `${an.drained.n} resigns over the drains`, `${d.name}, ${d.job}, is acting mayor until the next election, and has already asked where the drains are.`);
    }
  }

  // ---- the year's news, and the album ----

  // Something happened in town: into the year's news, the journal and the Gazette's lead.
  // p: how much it matters (the year's headline is the one that mattered most).
  function told(L, p, icon, h, text, kind = '') {
    const s = L.s, an = s.annals;
    an.news.push({ p, i: icon, h });
    if (!an.lead || an.lead.t < s.t || an.lead.p <= p) an.lead = { t: s.t, p, i: icon, h, x: text };
    L.note(`${h}.`, 'town');
    if (kind !== 'quiet') L.say(icon, h, kind);
  }
  // What a year of your own comes down to.
  function mine(L, age) {
    let best = null, top = 0;
    for (const e of L.s.log) {
      if (e.a !== age || (e.k !== 'big' && e.k !== 'love')) continue;
      const m = MINE.find(([re]) => re.test(e.t)), v = m ? m[1] : e.k === 'big' ? 2 : 1;
      if (v > top) { top = v; best = e.t; }
    }
    return best;
  }
  // The year just gone, for the album.
  function closeYear(L) {
    const s = L.s, an = s.annals, age = s.age - 1;
    if (an.yr.some((y) => y.a === age)) return;
    let top = an.news.slice().sort((a, b) => b.p - a.p)[0];
    // (Nothing much? The economy, if it turned, or one of the small things the Gazette lives on.)
    const eco = `${ECO[s.eco + 2].name} in the Bay`, prev = an.yr[an.yr.length - 1];
    if ((!top || top.p < 3) && s.ecoAt != null && s.t - s.ecoAt <= 4 && s.eco !== 0 && !(prev && prev.h === eco)) top = { p: 1, i: ECO[s.eco + 2].icon, h: eco };
    if (!top) { const [i, h] = SMALL_NEWS[(age * 7 + an.from) % SMALL_NEWS.length]; top = { p: 0, i, h }; }
    an.yr.push({ a: age, p: top.p, i: top.i, h: top.h, m: mine(L, age) });
    if (an.yr.length > 110) an.yr.shift();
    an.news = [];
  }

  // ---- the life's methods ----

  Object.assign(Life.prototype, {
    annalsMayor() { const an = this.s.annals; return an.mayor.k === 'you' || youMayor(this) ? { ...an.mayor, ...youRec(this), since: an.mayor.since } : an.mayor; },
    annalsMayorName(c = this.annalsMayor()) { return c.k === 'you' ? this.s.name : full(this, c); },
    annalsShort(c) { return short(this, c); },
    // "Mayor Pennington", "Mayor Sam Singh", "Acting Mayor Iris Penhallow", "You".
    annalsMayorTitle(c = this.annalsMayor()) { return c.k === 'you' ? 'You' : c.k === 'penn' ? full(this, c) : `${c.acting ? 'Acting Mayor' : 'Mayor'} ${c.name}`; },
    annalsAge(c) { return ageOf(this, c); },
    // (For folk.js: Mayor Pennington is plain Mr Pennington once he has lost the chain.)
    // (Not while he still holds it: a mayor who will not stand again is mayor until the count.)
    annalsPennOut() { const an = this.s.annals; return !!an && an.penn === 'out' && an.mayor.k !== 'penn'; },
    // The pier is wrecked, and the Lucky Gull boarded up (heists.js asks, for the counting-room job and the pier's protection money).
    annalsPierShut() { return !!this.s.annals && pierShut(this); },
    // What has changed on the map: drawn by art.js (townSvg's scene).
    annalsScene() {
      const an = this.s.annals;
      if (!an) return {};
      const mk = ev(this, 'market'), es = ev(this, 'estate');
      return {
        wreck: pierShut(this), lido: has(this, 'lido'), barrier: has(this, 'barrier'), carpark: has(this, 'carpark'), bypass: has(this, 'bypass'),
        market: !!mk && mk.open != null, estate: !!es && es.done != null, line: lineShut(this),
      };
    },
    // "spring, year 12": when a season falls.
    // (Before this life began, as an heir's town remembers it: "autumn, 12 years ago".)
    annalsWhen(t) {
      const q = SEASONS[((t % 4) + 4) % 4].toLowerCase();
      if (t >= 0) return `${q}, year ${Math.floor(t / 4) + 1}`;
      const n = Math.max(1, Math.round((this.s.t - t) / 4));
      return `${q}, ${n === 1 ? 'a year' : `${n} years`} ago`;
    },
    // What the mayor's appeal says of the pier, if the great storm has been (game.js shows it).
    annalsGiftBlurb(id) {
      const st = this.s.annals && id === 'pier' ? ev(this, 'storm') : null;
      if (!st) return null;
      if (st.shut) return `The great storm of ${this.annalsWhen(st.t)} tore the middle out of it, and the Lucky Gull is boarded up until it is mended. Pay for the whole pier, and it is mended at once.`;
      return 'Mended after the great storm, as far as the Lucky Gull. Beyond it the far end is still shut, as it has been since the storm of your grandparents’ day.';
    },
    annalsRace() { return this.s.annals.race; },
    // Nominations are open: the two seasons before polling day.
    annalsNoms() { const an = this.s.annals; return !!an.race && this.s.t < an.poll; },
    // The chance each candidate has, as things stand (yours apart, if you stand).
    annalsChances() {
      const r = this.s.annals.race;
      if (!r) return {};
      const others = r.c.filter((c) => c.k !== 'you'), w = others.map((c) => Math.max(1, r.sup[c.k]) ** 2), sum = w.reduce((a, b) => a + b, 0);
      const you = r.you ? this.annalsYourOdds() : 0, out = {};
      others.forEach((c, i) => { out[c.k] = (1 - you) * w[i] / sum; });
      if (r.you) out.you = you;
      return out;
    },
    // Your own chance of the chain, if you stand: the engine's odds and what you have put in.
    annalsYourOdds() {
      const r = this.s.annals.race, an = this.s.annals;
      if (!r || !r.you) return 0;
      const sitting = an.mayor.k === 'you', kept = an.n.kept || 0;
      return clamp(this.mayorOdds() + (r.camp.you || 0) / 100 + (sitting ? 0.15 + (kept > 0 ? 0.05 : -0.05) : 0) + (r.vote === 'you' ? 0.01 : 0), sitting ? 0.15 : 0.1, 0.95);
    },
    // The bookmaker's price: [to win, staked].
    annalsPrice(k) {
      const p = this.annalsChances()[k] || 0.02, d = 0.88 / Math.max(0.02, p) - 1;
      let best = ODDS[0];
      for (const o of ODDS) if (o[0] / o[1] <= d) best = o;
      return best;
    },
    annalsPriceSaid(k) { const [a, b] = this.annalsPrice(k); return a === b ? 'evens' : a < b ? `${b} to ${a} on` : `${a} to ${b}`; },
    // Promises on the go, as the screen wants them: [{ p, icon, name, by, state }].
    annalsWorks() {
      const s = this.s, an = s.annals;
      return an.plan.map((w) => {
        const P = PLATS[w.p], left = w.due - s.t, by = w.by === 'you' ? 'yours' : w.byName;
        return { p: w.p, icon: P.icon, name: P.name, by, state: left <= 0 ? 'Nearly done' : `Promised for ${left <= 1 ? 'next season' : this.annalsWhen(w.due)}` };
      });
    },
    // What is going on in town that you would notice.
    annalsOn() {
      const s = this.s, an = s.annals, out = [];
      const st = ev(this, 'storm'), ln = ev(this, 'line'), mk = ev(this, 'market'), fm = ev(this, 'film'), es = ev(this, 'estate');
      if (st && st.shut) out.push(['⛈️', `The pier has been shut since the storm. The Pier Trust has raised ${money(40000 + 9000 * ago(this, st.t) + 3 * st.trust)}${an.gave.pier ? `, ${money(an.gave.pier)} of it yours` : ''}.`]);
      if (ln && lineThreat(this)) out.push(['🚂', `The railway is to close unless the ministry changes its mind, which it will decide in ${this.annalsWhen(ln.decide)}.`]);
      if (lineShut(this)) out.push(['🚌', 'The railway is shut. The coach to the city costs $150 on top of any trip, and $80 more to visit family.']);
      if (mk && mk.open == null) out.push(['🛒', `A supermarket is coming to the ring road, in ${this.annalsWhen(mk.due)}.`]);
      if (fm && s.t >= fm.t && s.t <= fm.t + 2) out.push(['🎬', 'The film crew is in town, and the cove is full of bonnets.']);
      if (es && es.done == null) out.push(['🏗️', `The new estate on the old brickworks is going up: finished by ${this.annalsWhen(es.due)}.`]);
      return out;
    },
    // Where it shows on the map: a few lines for a place's sheet.
    annalsPlace(id) {
      const s = this.s, an = s.annals, out = [];
      if (!an) return out;
      if (id === 'casino' && pierShut(this)) out.push(['⛈️', 'The storm took the deck from under the Lucky Gull. It is boarded up until the pier is mended: by the Pier Trust in time, sooner if a mayor does it, and at once if somebody pays for the whole pier through the mayor’s appeal.']);
      if (id === 'station' && lineShut(this)) out.push(['🚌', 'No trains: the line is shut. The coach to the city leaves from the forecourt, $150 on top of any trip and $80 more to visit family.']);
      if (id === 'station' && lineThreat(this)) out.push(['📣', 'SAVE OUR LINE, say the posters on every pillar.']);
      if (id === 'park' && has(this, 'carpark')) out.push(['🅿️', 'Half the green is a car park now, with the bandstand in the middle of it.']);
      if (id === 'cove' && ev(this, 'heat') && ev(this, 'heat').t === s.t) out.push(['☀️', 'The cove is towel to towel, and the ice-cream vans are queuing to get into the car park.']);
      if (id === 'cove' && has(this, 'lido')) out.push(['🏊', `The lido on the front has been open since ${this.annalsWhen(an.built.lido)}.`]);
      if (id === 'highstreet' && ev(this, 'flood') && ev(this, 'flood').t === s.t && !ev(this, 'flood').held) out.push(['🌊', 'The High Street is still pumping out after the flood. The shops are shut this season.']);
      if (id === 'highstreet') {
        const betty = s.folk && s.folk.p.betty && s.folk.p.betty.shut ? 'the shop selling telephone cases where Betty’s Café was' : 'Betty’s Café';
        const now = [betty, 'Pym’s Curios', ...an.shops.map((x) => x.n)];
        const fresh = an.gone.filter((g) => ago(this, g.t) <= 8).slice(-2).map((g) => `${g.by} where ${g.n} was`);
        out.push(['🛍️', `Along the High Street: ${list(now)}.${fresh.length ? ` New lately: ${list(fresh)}.` : ''}${marketOpen(this) ? ' The supermarket on the ring road has a free bus, and it is always full.' : ''}`]);
      }
      if (id === 'pub') {
        const bar = an.bar.map((r) => `${r.n}, who ${r.does}`);
        out.push(['🍺', `At the bar: ${list(bar)}.`]);
        if (an.hooks.length) out.push(['🍻', `Over the bar, on their hooks: the tankards of ${list(an.hooks.slice(-5).map((h) => h.n))}.`]);
        if ((an.n.pub || 0) >= 12 && an.bar.every((r) => r.at > 0)) out.push(['🪑', 'Of everybody at the bar, you have been coming in the longest. The stool by the window is understood to be yours.']);
      }
      if (id === 'townhall') {
        const m = this.annalsMayor();
        out.push(['🎩', `${m.k === 'you' ? 'You hold the chain of office' : this.annalsMayorTitle(m)}. ${an.race ? `The election is on: polling day is in ${this.annalsWhen(an.poll)}.` : `The next election is in ${this.annalsWhen(an.poll)}.`}`]);
      }
      return out;
    },
    // Years in the Bay, as far as it goes, with this year so far at the end.
    annalsYears() {
      const s = this.s, an = s.annals, top = an.news.slice().sort((a, b) => b.p - a.p)[0];
      return [...an.yr, { a: s.age, p: top ? top.p : 0, i: top ? top.i : '🗞️', h: top ? top.h : null, m: mine(this, s.age), now: true }];
    },
    annalsQuiet(a) { return QUIET[a % QUIET.length]; },
    // Who is at the bar: [{ n, age, does, fresh }], newest last.
    annalsBar() { return this.s.annals.bar.map((r) => ({ n: r.n, age: r.age, does: r.does, fresh: ago(this, r.at) <= 8 })); },
    // The shops on the High Street, the old favourites first: [{ n, fresh, was }].
    annalsShops() {
      const s = this.s, an = s.annals, betty = s.folk && s.folk.p.betty && s.folk.p.betty.shut;
      return [{ n: betty ? 'a shop selling telephone cases' : 'Betty’s Café', was: betty ? 'Betty’s Café' : null }, { n: 'Pym’s Curios' }, { n: 'Curl Up & Dye' },
        ...an.shops.map((x) => { const g = an.gone.slice().reverse().find((q) => q.by === x.n && q.t === x.since); return { n: x.n, fresh: ago(this, x.since) <= 8, was: g ? g.n : null }; })];
    },
    // The appeals you could give to just now.
    annalsAppeals() { return Object.keys(APPEALS).filter((to) => APPEALS[to].open(this)); },
    // Starts one of the big events now (for the checks in tools/new-in-town-tests/annals.mjs).
    annalsStart(id) { START[id](this); },
    // The town as this life leaves it, for whoever carries on (chapters.js puts it in what is carried
    // to the next life: c is that, with how they begin and their age). Every season in it is
    // counted from the heir's first spring, so that what happened before it is in the past.
    annalsHandOn(c) {
      const s = this.s, an = s.annals;
      if (!an || !c) return null;
      const gap = c.how === 'back' ? (c.gap || 0) : 0, base = Math.ceil(s.t / 4) * 4 + gap * 4;
      const T = JSON.parse(JSON.stringify(an)), sh = (t) => (typeof t === 'number' ? t - base : t);
      T.mayor.at = sh(T.mayor.at); T.mayor.since = sh(T.mayor.since);
      T.poll = sh(T.poll);
      if (T.race) { T.race.at = sh(T.race.at); for (const x of T.race.c) x.at = sh(x.at); }
      if (T.last) T.last.t = sh(T.last.t);
      for (const w of T.plan) { w.at = sh(w.at); w.due = sh(w.due); w.drop = sh(w.drop); delete w.asked; }
      for (const k of Object.keys(T.built)) T.built[k] = sh(T.built[k]);
      for (const e of Object.values(T.ev)) for (const k of EV_TIMES) if (k in e) e[k] = sh(e[k]);
      if (T.ev.film) T.ev.film.part = 0;
      if (T.ev.flood) T.ev.flood.cost = 0;
      if (T.ev.estate) delete T.ev.estate.want;
      T.next = sh(T.next); T.shopNext = sh(T.shopNext); T.sour = sh(T.sour);
      for (const k of Object.keys(T.dropped || {})) T.dropped[k] = sh(T.dropped[k]);
      // (Only the town's own changes wait for later: the cards were this life's.)
      T.later = T.later.filter((q) => q.id === 'anFloodShop' || q.id === 'anParlour').map((q) => ({ ...q, t: sh(q.t) }));
      for (const x of T.shops) x.since = sh(x.since);
      for (const g of T.gone) g.t = sh(g.t);
      for (const r of T.bar) r.at = sh(r.at);
      for (const h of T.hooks) h.t = sh(h.t);
      // The album: for one who grew up here, the town's headlines of the years they were here for.
      const lag = c.how === 'home' ? s.age - Math.round(c.age) : null;
      T.yr = lag == null ? [] : T.yr.filter((y) => y.h && y.a - lag >= 10).map((y) => ({ a: y.a - lag, p: y.p, i: y.i, h: y.h, m: null }));
      return T;
    },
    // The heir takes the town on (from chapBegin in chapters.js): how they began, and at what age.
    annalsTakeOn(T, began, age) {
      if (!T || !T.mayor) return;
      const s = this.s, an = { ...s.annals, ...T };
      // (Born here, they have lived through it all; off the train, or back at eighteen, it starts now.)
      an.from = began === 'home' ? -age * 4 : 0;
      // What this life has done in the town is its own: the votes, the gifts, the counts, the cards seen.
      Object.assign(an, { mine: null, gave: {}, n: {}, seen: {}, era: 0, news: [], lead: null, myVote: null, budget: null, standDown: 0, drained: null });
      delete an.wakeAt;
      if (an.mkept === 'you') an.mkept = null;
      if (an.mbroke === 'you') an.mbroke = null;
      s.annals = an;
      // The one who died held the chain: the deputy minds the shop until the next election.
      if (an.mayor.k === 'you') {
        const d = stander(this, { plat: 'steady' }, []);
        an.mayor = { ...d, since: 0, terms: 0, acting: 1 };
        for (const w of an.plan) if (w.by === 'you') { w.by = d.k; w.byName = d.name; }
      }
      if (an.race) {
        const r = an.race;
        r.c = r.c.filter((x) => x.k !== 'you');
        Object.assign(r, { you: false, vote: null, bet: null, camp: {} });
        // (An election missed altogether while they were away is a thing of the past; one whose
        // polling day is the day they take up the story, they can still vote in.)
        if (!r.c.length || an.poll < 0) an.race = null;
        else if (an.poll === 0 && r.c.length > 1) this.queue('anPoll');
      }
      an.mayors = [this.annalsMayorName(an.mayor)];
    },
    // The town's big moments you lived through, for the obituary and the album.
    annalsLived() {
      const an = this.s.annals, out = [];
      for (const id of ['storm', 'flood', 'line', 'market', 'film', 'estate', 'royal', 'heat']) if (an.ev[id] && an.ev[id].t >= an.from) out.push(typeof LIVED[id] === 'function' ? LIVED[id](this) : LIVED[id]);
      for (const id of ['lido', 'bypass', 'barrier']) if (an.built[id] != null && an.built[id] >= an.from) out.push(LIVED[id]);
      return out;
    },
  });

  // ---- elections ----

  // Nominations open: the field is chosen, and the town starts arguing.
  function openRace(L) {
    const s = L.s, an = s.annals, m = an.mayor, c = [];
    // Who is in already.
    if (m.k === 'you') { if (youMayor(L) && !an.standDown) c.push(youRec(L)); }
    else if (m.k === 'penn') {
      if (ageOf(L, m) >= 69) { an.penn = 'out'; told(L, 6, '🎩', 'Mayor Pennington will not stand again', 'After all these years, he says, he would like to find out what Saturdays are like.'); }
      else c.push(m);
    } else if (!m.acting && ageOf(L, m) < 72 && (m.terms || 0) < 3) c.push(m);
    const used = new Set(c.map((x) => x.plat).concat(an.plan.map((w) => w.p)));
    // (One or two against a sitting mayor; two or three for an open seat.)
    const want = c.length + (L.chance(0.45) ? 2 : 1) + (c.length ? 0 : 1);
    while (c.length < Math.min(3, want)) {
      const can = Object.keys(PLATS).filter((p) => p !== 'steady' && !used.has(p) && (!PLATS[p].ok || PLATS[p].ok(L)));
      const pool = can.length ? can : ['steady'];
      let r = L.rnd() * pool.reduce((a, p) => a + base(L, p), 0), p = pool[0];
      for (const q of pool) { r -= base(L, q); if (r < 0) { p = q; break; } }
      used.add(p);
      c.push(stander(L, { plat: p }, c));
    }
    const sup = {};
    for (const x of c) sup[x.k] = base(L, x.plat) + L.int(-8, 8) + (x === m ? incumbent(L, m) : 0);
    an.race = { c, sup, camp: {}, vote: null, bet: null, you: c.some((x) => x.k === 'you'), at: s.t };
    an.standDown = 0;
    told(L, 2, '🗳️', `The race for mayor: ${list(c.map((x) => cap(short(L, x))))}`, `Polling day is in ${L.annalsWhen(an.poll)}. Standing: ${list(c.map((x) => `${full(L, x)} (${said(x.plat)})`))}.`, 'quiet');
    L.say('🗳️', `Nominations are in for mayor: ${list(c.map((x) => short(L, x)).map(cap))}`);
    if (!s.gaol) {
      if (an.mayor.k === 'you' && youMayor(L)) later(L, 'anIncumbent', s.t);
      const pt = L.partner();
      if (pt && pt.bond >= 30 && L.chance(0.5)) later(L, 'anCause', s.t + 1, { p: pt.id, k: L.pick(c.filter((x) => x.k !== 'you')).k });
    }
  }
  const base = (L, p) => Math.max(4, PLATS[p].base + (PLATS[p].pop ? PLATS[p].pop(L) : 0));
  // What the sitting mayor's record is worth on the doorstep.
  function incumbent(L, m) {
    const an = L.s.annals;
    if (m.k === 'penn') return 16 - Math.max(0, ageOf(L, m) - 63) * 2;
    return 8 + (an.mkept === m.k ? 10 : 0) - (an.mbroke === m.k ? 12 : 0);
  }

  // The count, at the turn of the season after polling day.
  function count(L) {
    const s = L.s, an = s.annals, r = an.race, old = an.mayor;
    // (Somebody who has left politics since putting their name down is not on the paper.)
    if (r.you && !(inPolitics(L) && s.job.r >= 3)) { r.you = false; r.c = r.c.filter((x) => x.k !== 'you'); }
    const yours = r.you ? L.annalsYourOdds() : 0;
    an.race = null;
    an.poll += ELECT;
    let win = null;
    if (r.you && L.chance(yours)) win = r.c.find((x) => x.k === 'you');
    if (!win) {
      const others = r.c.filter((x) => x.k !== 'you');
      if (!others.length) { win = old; }
      else {
        let pick = L.rnd() * others.reduce((a, x) => a + Math.max(1, r.sup[x.k]) ** 2, 0);
        win = others[0];
        for (const x of others) { pick -= Math.max(1, r.sup[x.k]) ** 2; if (pick < 0) { win = x; break; } }
      }
    }
    const same = win.k === old.k && !old.acting;
    an.last = { t: s.t, win: win.k, name: win.k === 'you' ? s.name : win.name, plat: win.plat, c: r.c.map((x) => ({ k: x.k, n: x.k === 'you' ? s.name : full(L, x), plat: x.plat })) };
    // The bookmaker pays out.
    let paid = 0;
    if (r.bet) {
      an.n.bets = (an.n.bets || 0) + 1;
      if (r.bet.on === win.k) { paid = Math.round(r.bet.n * (1 + r.bet.a / r.bet.b)); L.cash(paid); an.n.betWon = (an.n.betWon || 0) + paid - r.bet.n; }
    }
    if (r.camp[win.k]) an.n.backed = (an.n.backed || 0) + 1;
    // What it means for you.
    if (win.k === 'you') {
      if (old.k !== 'you') {
        if (inPolitics(L) && L.s.job.r < 4) s.f.elected = 1;
        L.fame(6); L.joy(12);
        L.note('Won the election for mayor of Starling Bay.', 'big');
        if (old.k === 'penn') an.penn = 'out';
        an.mayor = { ...youRec(L), plat: r.mine || 'steady', since: s.t, terms: 1 };
        an.mayors.push(s.name);
      } else { an.mayor.terms++; an.mayor.plat = r.mine || an.mayor.plat; L.joy(8); L.fame(2); L.note('Re-elected mayor of Starling Bay.', 'big'); }
    } else if (old.k === 'you' && r.you) {
      // (Voted out: back to Deputy Mayor, and another go in four years if you want one.)
      if (inPolitics(L)) { s.job.r = Math.min(s.job.r, 3); s.job.n = 0; }
      s.f.elected = 0; L.joy(-10);
      L.note('Lost the mayoralty at the election, and went back to being Deputy Mayor.', 'big');
    } else if (old.k === 'you') {
      if (inPolitics(L)) { s.job.r = Math.min(s.job.r, 3); s.job.n = 0; }
      s.f.elected = 0;
      L.note('Stood down as mayor at the election.', 'big');
    } else if (r.you) { L.joy(-8); L.note('Stood for mayor, and lost.', 'big'); }
    if (win.k !== 'you' && !same) {
      if (old.k === 'penn') an.penn = 'out';
      an.mayor = { ...win, since: s.t, terms: 1 };
      an.mayors.push(win.name);
    } else if (same && win.k !== 'you') an.mayor.terms = (an.mayor.terms || 1) + 1;
    // Work begun by the last mayor carries on if it is well along; otherwise it is scrapped.
    for (const w of an.plan.slice()) {
      if (w.by === win.k || (w.due - s.t) * 2 <= w.due - w.at) continue;
      an.plan.splice(an.plan.indexOf(w), 1);
      if (w.keep) told(L, 4, PLATS[w.p].icon, `${PLATS[w.p].name}: scrapped by the new mayor`, 'The new mayor has other ideas, and the money with them.', 'quiet');
    }
    promise(L, win);
    const shout = win.k === 'you' ? (old.k === 'you' ? `${s.name} is mayor again` : `${s.name} wins the election for mayor`)
      : same ? `${cap(full(L, win))} is re-elected` : `${cap(full(L, win))} is the new mayor`;
    told(L, win.k === 'you' || !same ? 7 : 4, win.k === 'you' ? '🏛️' : PLATS[win.plat].icon, shout, win.plat === 'steady' ? 'Nothing much will change, the new mayor promises, and means it.' : win.k === 'you' ? `You promised ${said(win.plat)}, and the town will hold you to it.` : `${cap(he(win))} promised ${said(win.plat)}, and the town will hold ${he(win) === 'she' ? 'her' : 'him'} to it.`, win.k === 'you' ? 'dream' : '');
    // A card at the count, for anybody who had a hand in it.
    // (Your own vote, remembered for next time.)
    an.myVote = r.vote && r.vote !== 'you' ? { n: full(L, r.c.find((x) => x.k === r.vote)), p: r.c.find((x) => x.k === r.vote).plat, won: r.vote === win.k ? 1 : 0, t: s.t } : null;
    if (!s.gaol && !s.dead && (r.bet || r.you || Object.keys(r.camp).length)) L.queue('anCount', { win: win.k, paid, bet: r.bet ? 1 : 0, you: r.you ? 1 : 0 });
  }

  // The winner starts on the promise (or will drop it, quietly, some time before the next election).
  function promise(L, c) {
    const s = L.s, an = s.annals, P = PLATS[c.plat];
    if (!P || c.plat === 'steady' || an.plan.some((w) => w.p === c.plat)) return;
    if (P.ok && !P.ok(L)) return;
    const keep = c.k === 'you' ? L.chance(Math.min(0.98, 0.85 + s.st.smarts / 500)) : L.chance(P.keep);
    const due = s.t + P.works + (P.works > 2 ? L.int(0, 2) : 0);
    an.plan.push({ p: c.plat, by: c.k, byName: c.k === 'you' ? s.name : full(L, c), at: s.t, due, keep, drop: keep ? null : s.t + L.int(Math.min(3, P.works), Math.max(4, Math.min(ELECT - 3, P.works + 2))) });
    // (Somebody has to pay: a little on everybody's rates while it is built.)
    if (c.plat === 'lido') later(L, 'anLidoFund', s.t + 1);
  }

  // A promise finished, or given up.
  function worksTick(L) {
    const s = L.s, an = s.annals;
    for (const w of an.plan.slice()) {
      const P = PLATS[w.p];
      // (A promise of yours that is going wrong comes to your desk first.)
      if (!w.keep && w.by === 'you' && !w.asked && s.t >= w.drop - 1 && youMayor(L) && !s.gaol) { w.asked = 1; L.queue('anBudget', w.p); continue; }
      if (!w.keep && s.t >= w.drop) {
        an.plan.splice(an.plan.indexOf(w), 1);
        an.mbroke = w.by; an.sour = s.t;
        (an.dropped = an.dropped || {})[w.p] = s.t;
        if (w.by === 'you') an.n.kept = (an.n.kept || 0) - 1;
        told(L, 5, P.icon, P.drop[0], P.drop[1], 'bad');
        continue;
      }
      if (!w.keep || s.t < w.due) continue;
      an.plan.splice(an.plan.indexOf(w), 1);
      an.mkept = w.by;
      if (w.by === 'you') { an.n.kept = (an.n.kept || 0) + 1; L.karma(3); L.fame(1); L.joy(5); }
      build(L, w.p, w.by);
    }
  }

  // What a kept promise does to the town.
  function build(L, p, by) {
    const s = L.s, an = s.annals, P = PLATS[p];
    if (p === 'pier') { reopenPier(L, 'mayor'); return; }
    // (Unless it has come of its own accord in the meantime.)
    if (p === 'homes') { if (!ev(L, 'estate')) startEstate(L, true); return; }
    if (p === 'jobs') { if (!ev(L, 'market')) startMarket(L, true); return; }
    if (p === 'line') { if (lineShut(L)) reopenLine(L); else if (lineThreat(L)) saveLine(L, true); return; }
    if (p === 'green') delete an.built.carpark;
    an.built[p] = s.t;
    if (p === 'bypass') s.idx *= 1.03;
    told(L, 6, P.done[0], P.done[1], P.done[2], 'good');
    if (p === 'lido' && !s.gaol && ((an.gave.lido || 0) > 0 || by === 'you')) L.queue('anLidoOpen');
  }

  // ---- the big events ----

  function startStorm(L) {
    const s = L.s, an = s.annals;
    s.wx = 'storm';
    if (s.gifts.pier) {
      an.ev.storm = { t: s.t, shut: false, held: 1, end: s.t };
      told(L, 7, '⛈️', 'The great storm: the pier holds', `The worst gale in sixty years. The pier ${s.gave.pier ? 'you' : 'your family'} rebuilt rides it out with its lights on, and half the town watches from the sea wall.`, 'good');
    } else {
      an.ev.storm = { t: s.t, shut: true, due: s.t + L.int(16, 24), trust: 0 };
      told(L, 9, '⛈️', 'Great storm wrecks the pier', 'The worst gale in sixty years tore the middle out of the pier in the night. The Lucky Gull is cut off, and boarded up, until it can be mended.', 'bad');
      later(L, 'anPierFund', s.t + 2);
    }
    if (!s.gaol) L.queue('anStorm');
  }
  function reopenPier(L, how) {
    const s = L.s, e = ev(L, 'storm');
    if (!e || !e.shut) return;
    e.shut = false; e.end = s.t;
    const by = how === 'gift' ? `with money from ${s.gifts.pier}` : how === 'mayor' ? 'on the mayor’s promise' : 'by the Pier Trust, a dollar at a time';
    told(L, 7, '🎡', 'The pier reopens', `Mended ${by}. The Lucky Gull’s lights come on along the front for the first time since the storm.`, 'good');
    if (!s.gaol && (e.trust >= 1000 || how === 'gift')) L.queue('anPierOpen', { how });
  }

  function startMarket(L, mayor = false) {
    const s = L.s, an = s.annals;
    an.ev.market = { t: s.t, open: null, due: s.t + (mayor ? 4 : 6), local: 0, mayor: mayor ? 1 : 0 };
    told(L, 6, '🛒', mayor ? 'Yes to the supermarket on the ring road' : 'Supermarket plans for the ring road', 'Forty thousand square feet, a car park the size of the harbour, and a bakery that is not a bakery. The High Street is holding meetings.', '');
    if (!mayor && !s.gaol) L.queue('anMarket');
  }
  function marketTick(L) {
    const s = L.s, e = ev(L, 'market');
    if (!e || e.open != null || s.t < e.due) return;
    e.open = s.t;
    told(L, 7, '🛒', 'The supermarket opens on the ring road', 'Free parking, a free bus from the station, and everything cheaper than on the High Street. Two of the High Street’s shops have given notice already.', '');
    changeShop(L, 'market');
    later(L, 'anShopLocal', s.t + 2);
    if (s.job && s.job.c === 'retail') later(L, 'anCutbacks', s.t + 1);
  }

  function startFilm(L) {
    const s = L.s;
    s.annals.ev.film = { t: s.t, air: s.t + 6, part: 0 };
    told(L, 6, '🎬', 'A film crew comes to town', 'They are making The Wreckers of Starling Cove, a costume drama with smugglers in it and a great many bonnets, and they will be filming at the harbour and the cove until autumn.', 'good');
    if (!s.gaol) L.queue('anFilm');
  }
  function filmTick(L) {
    const s = L.s, e = ev(L, 'film');
    if (!e || e.aired || s.t < e.air) return;
    e.aired = s.t;
    s.idx *= 1.03;
    told(L, 6, '📺', 'The Wreckers is on television', 'Nine million people watch the Bay play itself in bonnets. By Easter the coaches are coming in to see the cove, and holiday lets are booked to the end of summer.', 'good');
    changeShop(L, 'film');
    if (!s.gaol) L.queue('anFilmAir');
  }

  function startEstate(L, mayor = false) {
    const s = L.s;
    s.annals.ev.estate = { t: s.t, done: null, due: s.t + (mayor ? 8 : 10), said: 0, mayor: mayor ? 1 : 0 };
    told(L, 5, '🏘️', 'Two hundred homes for the old brickworks', 'Brickworks Rise: starter homes, a roundabout, and a play area with a sculpture of a gull that nobody asked for.', '');
    if (!s.gaol) L.queue('anEstate');
  }
  function estateTick(L) {
    const s = L.s, an = s.annals, e = ev(L, 'estate');
    if (!e || e.done != null || s.t < e.due) return;
    e.done = s.t;
    s.idx *= 0.95;
    told(L, 6, '🏘️', 'The new estate is finished', 'Brickworks Rise is full of young families and white vans. With two hundred more homes in the Bay, house prices and rents dip.', '');
    changeShop(L, 'estate');
    newFace(L, 'is from the new estate, and calls the Gull "quaint"');
    if (s.age >= 30 && s.age <= 66) later(L, 'anChair', s.t + 4);
  }

  function startLine(L) {
    const s = L.s;
    s.annals.ev.line = { t: s.t, decide: s.t + 8, effort: 0, shut: null, back: null, saved: false, due: null };
    told(L, 7, '🚂', 'The railway line is to close, says the ministry', 'The line to the city "no longer pays its way". There will be a decision in two years. SAVE OUR LINE posters are up on every pillar of the station by the weekend.', 'bad');
    if (!L.s.gaol) L.queue('anLine');
  }
  function saveLine(L, mayor = false) {
    const s = L.s, e = ev(L, 'line');
    e.saved = true; e.end = s.t;
    told(L, 7, '🚂', 'The railway is saved', mayor ? 'The mayor came back from the ministry with a letter and a smile. The trains will keep running.' : 'The ministry has changed its mind, which it says it never does. The trains will keep running.', 'good');
    if (!s.gaol && e.effort > 0) L.queue('anLineEnd', { saved: 1 });
  }
  function lineTick(L) {
    const s = L.s, e = ev(L, 'line');
    if (!e) return;
    if (lineThreat(L) && s.t >= e.decide) {
      const mayor = L.s.annals.plan.some((w) => w.p === 'line' && w.keep);
      if (L.chance(clamp(0.3 + 0.12 * Math.min(3, e.effort) + (mayor ? 0.3 : 0), 0.1, 0.92))) { saveLine(L, mayor); return; }
      e.shut = s.t; e.due = s.t + L.int(16, 28);
      s.idx *= 0.96;
      told(L, 8, '🚂', 'The last train leaves Starling Bay', 'A brass band on the platform, a wreath on the engine, and the guard in tears. There is a coach to the city from tomorrow.', 'bad');
      if (!s.gaol) L.queue('anLineEnd', { saved: 0 });
    } else if (lineShut(L) && s.t >= e.due) reopenLine(L);
  }
  function reopenLine(L) {
    const s = L.s, e = ev(L, 'line');
    e.back = s.t; e.end = s.t;
    s.idx /= 0.96;
    told(L, 7, '🚂', 'Trains run to Starling Bay again', 'The line is open again: volunteers, a lottery grant and a great deal of paint. The first train is late, and nobody minds.', 'good');
    if (!s.gaol) L.queue('anLineBack');
  }

  function startFlood(L) {
    const s = L.s, an = s.annals, held = has(L, 'barrier');
    s.wx = 'storm';
    an.ev.flood = { t: s.t, held: held ? 1 : 0, cost: 0 };
    if (held) { told(L, 6, '🚧', 'The barrier holds', 'A spring tide and a gale together, the worst in a hundred years. The barrier gates swing shut, and the High Street stays dry. Captain Quinn says "Hm."', 'good'); return; }
    told(L, 9, '🌊', 'The sea comes in', 'A spring tide and a gale together. By midnight the harbour is in the High Street and the High Street is in the park. Nobody is lost; a great deal is.', 'bad');
    // What the water does to your home: low-lying ones flood.
    const low = ['bedsit', 'flat', 'cottage', 'townhouse'].includes(s.home), home = L.homeEntry ? L.homeEntry() : null;
    if (low) {
      const loss = home ? Math.max(2000, Math.round(L.propValue(home) * 0.02 / 100) * 100) : 800, paid = s.ins.home ? (home ? 500 : 100) : loss;
      an.ev.flood.cost = paid;
      L.cash(-paid);
      L.note(`The flood came into your ${home ? 'home' : 'rooms'}. ${s.ins.home ? `The insurance paid for most of it: ${money(paid)} was yours to find.` : `Putting it right cost ${money(paid)}.`}`, 'big');
    }
    later(L, 'anFloodShop', s.t + 1);
    if (!s.gaol) L.queue('anFlood', { low: low ? 1 : 0 });
  }

  function startRoyal(L) {
    const s = L.s;
    s.annals.ev.royal = { t: s.t };
    told(L, 6, '👑', 'A royal visit', 'Her Royal Highness, who is somebody’s cousin, is coming to open the new wing of something. The High Street is painted in a week, and the potholes are filled on her route, and only on her route.', 'good');
    if (!s.gaol) L.queue('anRoyal');
  }
  function startHeat(L) {
    const s = L.s, e = ev(L, 'heat');
    s.annals.ev.heat = { t: s.t, n: (e ? e.n : 0) + 1 };
    s.wx = 'hot';
    told(L, 5, '☀️', e ? 'The hottest summer since the last one' : 'The long hot summer', 'Weeks without a cloud. The cove is towel to towel by nine in the morning, there is a hosepipe ban, and the tar on the coast road is soft enough to keep footprints.', 'good');
    if (!e) later(L, 'anParlour', s.t + 2);
    if (!s.gaol) L.queue('anHeat');
  }
  const START = { storm: startStorm, market: startMarket, film: startFilm, estate: startEstate, line: startLine, flood: startFlood, royal: startRoyal, heat: startHeat };

  // A big event, now and then.
  function bigTick(L) {
    const s = L.s, an = s.annals, q = L.season;
    if (s.t < an.next || (an.race && s.t >= an.poll - NOMS) || s.t === an.poll + 1) return;
    const can = Object.keys(BIG).filter((id) => BIG[id].q.includes(q) && BIG[id].ok(L));
    if (!can.length) return;
    let r = L.rnd() * can.reduce((a, id) => a + BIG[id].w, 0), id = can[0];
    for (const k of can) { r -= BIG[k].w; if (r < 0) { id = k; break; } }
    START[id](L);
    an.next = s.t + L.int(16, 30);
  }

  // ---- the High Street ----

  // One shop goes, and another comes in its place. why: what did for it.
  function changeShop(L, why) {
    const s = L.s, an = s.annals;
    if (!an.shops.length) return;
    const pool = why === 'film' ? ['a Wreckers gift shop, selling tricorn hats'] : why === 'estate' ? ['a nursery and baby shop'] : why === 'heat' ? ['an ice-cream parlour with forty flavours']
      : NEW_SHOPS[why === 'market' || why === 'flood' || s.eco <= -1 ? 'slump' : s.eco >= 1 ? 'boom' : 'steady'];
    const free = pool.filter((n) => !an.shops.some((x) => x.n === n));
    if (!free.length) return;
    // (The oldest is likeliest to go, unless it is trade that did it.)
    const i = why === 'old' ? an.shops.reduce((b, x, k) => (x.since < an.shops[b].since ? k : b), 0) : L.int(0, an.shops.length - 1);
    const shut = an.shops[i], by = L.pick(free), yrs = Math.max(1, Math.round((s.t - shut.since) / 4));
    an.shops[i] = { n: by, since: s.t };
    an.gone.push({ n: shut.n, t: s.t, by });
    an.n.shops = (an.n.shops || 0) + 1;
    if (an.gone.length > 12) an.gone.shift();
    const said = L.pick(SHUT_WHY[why] || SHUT_WHY[s.eco <= -1 ? 'slump' : L.chance(0.5) ? 'old' : 'rent']);
    told(L, 2, '🛍️', `${cap(shut.n)} closes after ${yrs === 1 ? 'a year' : `${yrs} years`}`, `${said} ${cap(by)} is to open in its place.`, 'quiet');
  }

  // ---- the Gull & Anchor ----

  function newFace(L, does) {
    const an = L.s.annals, sex = L.chance(0.5) ? 'm' : 'f', taken = new Set(an.bar.map((r) => r.does));
    const can = DOES.filter((d) => !taken.has(d)), names = new Set(an.bar.map((r) => r.n.split(' ').slice(-1)[0]));
    // (A new surname at the bar, if one can be had: the Gull is not one family's.)
    let last = L.pick(SURN);
    for (let i = 0; names.has(last) && i < 6; i++) last = L.pick(SURN);
    const r = { n: `${L.pick(sex === 'm' ? NAMES_M : NAMES_F)} ${last}`, sex, age: L.int(20, 34), does: does || L.pick(can.length ? can : DOES), at: L.s.t };
    if (an.bar.length >= 7) an.bar.shift();
    an.bar.push(r);
    return r;
  }
  // Once a year: everybody at the bar is a year older, and one may go.
  function barYear(L) {
    const s = L.s, an = s.annals;
    for (const r of an.bar) r.age++;
    const go = an.bar.find((r) => (r.tam && r.age >= 58 && L.chance(0.25)) || (r.host && r.age >= 66 && L.chance(0.3))
      || (!r.tam && !r.host && ((r.age >= 70 && L.chance((r.age - 66) ** 2 / 500)) || (r.age < 50 && L.chance(0.02)))));
    if (!go) return;
    const i = an.bar.indexOf(go);
    if (go.tam) {
      an.bar[i] = { n: 'Big Tam', sex: 'm', age: L.int(24, 28), does: 'arm-wrestles anybody for a hundred dollars, like his father', tam: 1, at: s.t };
      told(L, 2, '💪', 'Big Tam hangs up his arm', 'His son, also Tam, also big, takes over the stool by the dartboard and the hundred-dollar challenge.', 'quiet');
      return;
    }
    if (go.host) {
      const sex = 'm', n = `${L.pick(NAMES_M)} ${go.n.split(' ').slice(-1)[0]}`;
      an.bar[i] = { n, sex, age: L.int(30, 40), does: 'keeps the bar now, and has kept up the booing', host: 1, at: s.t };
      told(L, 2, '🍺', `${go.n} hands over the Gull & Anchor`, `${go.n} has retired after ${Math.round((s.t - go.at) / 4)} years behind the bar. His nephew ${n.split(' ')[0]} takes it on, and promises to change nothing, especially the carpet.`, 'quiet');
      return;
    }
    const died = go.age >= 70 && L.chance(0.6);
    an.bar.splice(i, 1);
    const young = newFace(L);
    if (died) {
      an.hooks.push({ n: go.n, t: s.t });
      told(L, 3, '🍻', `Last orders for ${go.n}`, `${go.n}, who ${go.does}, has died at ${go.age}. The Gull keeps the tankard on its hook over the bar. ${young.n}, who ${young.does}, has the stool now.`, 'quiet');
      if (!s.gaol && (an.n.pub || 0) >= 3 && s.t - (an.wakeAt ?? -99) >= 16) { an.wakeAt = s.t; later(L, 'anWake', s.t, { n: go.n, does: go.does, sex: go.sex }); }
    } else told(L, 2, '🍺', `${go.n} leaves the Gull`, `${go.n} ${L.pick(GONE[go.age >= 60 ? 'old' : 'young'])}. ${young.n}, who ${young.does}, has the stool now.`, 'quiet');
  }

  // ---- cards to come ----

  function later(L, id, t, x = null) { L.s.annals.later.push({ id, t, x }); }
  function laterTick(L, jailed) {
    const s = L.s, an = s.annals;
    for (const c of an.later.slice()) {
      if (c.t > s.t) continue;
      an.later.splice(an.later.indexOf(c), 1);
      if (c.id === 'anFloodShop') { changeShop(L, 'flood'); continue; }
      if (c.id === 'anParlour') { changeShop(L, 'heat'); continue; }
      if (!jailed && !s.dead) L.queue(c.id, c.x);
    }
  }
  // A card for the decade you are in, now and then.
  function eraTick(L, jailed) {
    const s = L.s, an = s.annals;
    if (jailed || s.t - an.era < 10 || !L.chance(0.2)) return;
    const can = ERA.filter((e) => !an.seen[e.id] && e.when(L));
    if (!can.length) return;
    const e = L.pick(can);
    an.seen[e.id] = s.t; an.era = s.t;
    L.queue(e.id, e.ctx ? e.ctx(L) : null);
  }

  // ---- what the town does to you, season by season ----

  hooks.load.push((L) => {
    const s = L.s;
    if (!s.annals) {
      const t = s.t, first = t + 6;
      s.annals = {
        from: t, mayor: { ...pennRec(), since: -40, terms: 3 }, penn: null, cid: 1, poll: first + ((4 - (first % 4)) % 4), race: null, last: null,
        mayors: ['Mayor Pennington'], plan: [], built: {}, ev: {}, next: t + (t ? 6 : 12), later: [], mine: null,
        shops: SHOPS0.map(([n, ago]) => ({ n, since: t - ago })), gone: [], shopNext: t + 10,
        bar: BAR0.map(({ since, ...r }) => ({ ...r, at: t - since })), hooks: [],
        yr: [], news: [], lead: null, gave: {}, n: {}, seen: {}, era: t, sour: null, mkept: null, mbroke: null, standDown: 0,
      };
      // (A life from before the town kept its annals: your own years are in the journal, at least,
      // and whoever holds the chain already holds it.)
      if (t > 0) {
        const an = s.annals;
        for (let a = 18; a < s.age; a++) { const m = mine(L, a); if (m) an.yr.push({ a, i: '📔', h: null, m }); }
        if (youMayor(L)) { an.penn = 'out'; an.mayor = { ...youRec(L), since: t, terms: 1 }; an.mayors.push(s.name); }
        else if ((s.f.drains || 0) >= 2 || s.f.wasMayor) { an.penn = 'out'; an.mayor = { ...stander(L, { job: 'who runs the chemist’s', sex: 'f', name: 'Iris Penhallow', age: 52 }), since: t, terms: 1 }; an.mayors.push('Iris Penhallow'); }
      }
    }
  });

  hooks.late.push((L, jailed) => {
    const s = L.s, an = s.annals;
    if (s.dead) return;
    syncMayor(L);
    if (s.t === an.poll - NOMS && !an.race) openRace(L);
    else if (an.race && s.t === an.poll && !jailed) L.queue('anPoll');
    else if (an.race && s.t > an.poll) count(L);
    // (A life opened part way through a campaign, or in a gap: the calendar is put right.)
    if (!an.race && s.t > an.poll - NOMS) an.poll += Math.ceil((s.t - an.poll + NOMS) / ELECT) * ELECT;
    worksTick(L);
    const st = ev(L, 'storm');
    if (st && st.shut && (s.gifts.pier || s.t >= st.due)) reopenPier(L, s.gifts.pier ? 'gift' : 'trust');
    marketTick(L); filmTick(L); estateTick(L); lineTick(L);
    bigTick(L);
    laterTick(L, jailed);
    eraTick(L, jailed);
  });

  hooks.year.push((L) => {
    const s = L.s, an = s.annals;
    closeYear(L);
    barYear(L);
    if (s.t >= an.shopNext) { changeShop(L, L.chance(0.5) ? 'old' : 'rent'); an.shopNext = s.t + L.int(8, 16); }
  });

  // How the town feels about itself, and so do you.
  hooks.mood.push((L) => {
    const s = L.s, an = s.annals, q = L.season;
    if (!an) return 0;
    let m = 0;
    const st = ev(L, 'storm'), fl = ev(L, 'flood'), fm = ev(L, 'film'), ro = ev(L, 'royal'), ht = ev(L, 'heat'), ln = ev(L, 'line');
    if (st && st.shut && ago(L, st.t) < 4) m -= 1;
    if (fl && !fl.held && ago(L, fl.t) < 2) m -= 2;
    if (ln && ln.shut != null && ln.back == null && ago(L, ln.shut) < 4) m -= 1;
    if (has(L, 'carpark') && !drives(L)) m -= 1;
    if (ratesCut(L)) m -= 1;
    if (an.sour != null && ago(L, an.sour) < 4) m -= 1;
    if (has(L, 'lido') && q === 1) m += 1;
    if (has(L, 'bypass') && ['townhouse', 'bedsit'].includes(s.home)) m += 1;
    if (ro && ro.t === s.t) m += 2;
    if (ht && ht.t === s.t) m += 1;
    if (fm && s.t >= fm.t && s.t <= fm.t + 2) m += 1;
    return clamp(m, -4, 3);
  });

  // Rates while the council builds, and cheaper shopping and dearer trade once the supermarket is open.
  hooks.bills.push((L, out, jailed) => {
    const s = L.s, an = s.annals;
    if (!an) return;
    for (const w of an.plan) if (PLATS[w.p].rates) out.push([`Council rates: towards ${PLATS[w.p].name.replace(/^An? /, 'the ')}`, PLATS[w.p].rates]);
    if (an.budget && s.t < an.budget.until) out.push(['Council rates: your budget rescue', an.budget.n]);
    const mk = ev(L, 'market');
    if (mk && mk.open != null) {
      const food = out.find((r) => r[0] === 'Food and bills');
      if (food && !jailed) food[1] = Math.max(0, food[1] - 80);
      if (onHigh(L) && !jailed) {
        const n = round10(L.bizTake() * (ago(L, mk.open) < 12 ? 0.12 : 0.06) * (mk.local > 0 ? 0.5 : 1));
        if (n > 0) out.push(['Trade lost to the supermarket', n]);
      }
    }
  });
  hooks.income.push((L, out) => {
    const s = L.s, an = s.annals;
    if (!an) return;
    if (ratesCut(L)) out.push(['Council rates cut', 90]);
    if (has(L, 'carpark') && onHigh(L)) { const n = round10(L.bizTake() * 0.08); if (n > 0) out.push(['Shoppers from the car park on the green', n]); }
    const fm = ev(L, 'film');
    if (fm && fm.aired != null && ago(L, fm.aired) < 12) { const n = round10(L.letIncome() * 0.1); if (n > 0) out.push(['Holiday lets: the Wreckers effect', n]); }
  });

  // What is shut, for now.
  const PIER = new Set(['slotsOpen', 'hiloOpen', 'bjOpen', 'raceOpen', 'slots', 'hiloStart', 'hiloGuess', 'bjStart', 'bjHit', 'bjDouble', 'raceBet']);
  hooks.shut.push((L, a, x) => {
    const an = L.s.annals;
    if (!an) return null;
    // (Where it happens, worked out first: a business, a job or a heist takes place wherever it is.)
    const place = typeof a.place === 'function' ? a.place(L) : a.place;
    if ((place === 'casino' || PIER.has(a.id)) && pierShut(L)) return 'The Lucky Gull is shut until the pier is mended.';
    const fl = an.ev.flood;
    if (fl && !fl.held && fl.t === L.s.t && (place === 'highstreet' || (a.id === 'buy' && ITEMS[x] && ITEMS[x].at === 'highstreet'))) return 'The High Street is pumping out after the flood.';
    return null;
  });

  // (The drains in the Gazette: the mayor resigns that day, not at the turn of the season.)
  hooks.chose.push((L, id) => { if (id === 'drains2' && L.s.annals && (L.s.f.drains || 0) >= 2) syncMayor(L); });

  hooks.acted.push((L, id, x) => {
    const s = L.s, an = s.annals;
    // (Somebody paid for the whole pier through the mayor's appeal: it is mended at once.)
    if (id === 'fund' && x === 'pier' && pierShut(L)) reopenPier(L, 'gift');
    if (['chat', 'round', 'quiz', 'wrestle', 'openmic'].includes(id)) an.n.pub = (an.n.pub || 0) + 1;
    // (No trains: the coach costs more, and the price is on the station's board.)
    if (lineShut(L) && (id === 'trip' || id === 'folks')) {
      const n = id === 'trip' ? 150 : 80;
      L.cash(-n);
      L.say('🚌', `The coach, since the trains stopped: ${money(n)} on top`, 'bad');
    }
  });

  // The Gazette: the town's own news, when nothing bigger has happened to you.
  hooks.gazette.push((L, g) => {
    const s = L.s, an = s.annals;
    if (!an) return;
    if (g.quiet && an.lead && s.t - an.lead.t <= 1) g.lead = { icon: an.lead.i, h: an.lead.h, t: an.lead.x };
    const add = [], m = L.annalsMayor();
    if (an.race) {
      const ch = L.annalsChances();
      add.push({ icon: '🗳️', h: 'The election', t: `Polling day is in ${L.annalsWhen(an.poll)}. ${cap(list(an.race.c.map((c) => `${full(L, c)} (${said(c.plat)})`)))}. The bookmaker on the High Street makes it ${list(an.race.c.filter((c) => c.k !== 'you' || an.race.you).sort((a, b) => (ch[b.k] || 0) - (ch[a.k] || 0)).map((c) => `${L.annalsPriceSaid(c.k)} ${c.k === 'you' ? 'you' : short(L, c)}`))}.` });
    } else {
      const w = an.plan[0];
      add.push({ icon: '🏛️', h: 'From the Town Hall', t: `${m.k === 'you' ? 'You hold the chain of office' : `${cap(L.annalsMayorName(m))} is ${m.acting ? 'acting ' : ''}mayor`}${w ? `, and ${PLATS[w.p].name.toLowerCase()} is promised by ${L.annalsWhen(w.due)}` : ''}. The next election is in ${L.annalsWhen(an.poll)}.` });
    }
    for (const [icon, t] of L.annalsOn().slice(0, 2)) add.push({ icon, h: 'Around the Bay', t });
    const shop = an.gone[an.gone.length - 1];
    if (shop && ago(L, shop.t) <= 1) add.push({ icon: '🛍️', h: 'The High Street', t: `${cap(shop.n)} has closed. ${cap(shop.by)} is opening in its place.` });
    // From the files: this year, ten, twenty-five or fifty years ago.
    const back = [50, 25, 10].map((n) => an.yr.find((y) => y.a === s.age - n && y.h)).find(Boolean);
    if (back) add.push({ icon: '🗂️', h: 'From our files', t: `${s.age - back.a} years ago this year: ${back.h}.` });
    g.items.splice(Math.max(0, g.items.length - 1), 0, ...add);
  });

  // The obituary remembers what the town went through with you.
  hooks.epitaph.push((L, out) => {
    const s = L.s, an = s.annals;
    if (!an) return;
    const He = s.sex === 'f' ? 'She' : 'He', lived = L.annalsLived().slice(0, 3), n = new Set(an.mayors).size;
    const mayors = `${['', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'][n] || n} mayors come and go`;
    if (lived.length) out.push(`${He} lived through ${list(lived)}${n >= 3 ? `, and saw ${mayors}` : ''}.`);
    else if (n >= 3) out.push(`${He} saw ${mayors}.`);
    if (an.n.ribbon) out.push(`${He} cut the ribbon on ${an.n.ribbon}, and kept the scissors.`);
    else if ((an.n.votes || 0) >= 8) out.push(`${He} never missed an election, and always said who ${s.sex === 'f' ? 'she' : 'he'} had voted for.`);
  });

  // ---- the Town Hall's "Stand for mayor" (engine.js), on the election calendar ----

  // Nominations are open for two seasons before polling day; standing puts your name down, and the
  // count decides it, on the engine's odds and what you have put in since.
  Object.assign(A.mayor, {
    desc: (L) => (L.annalsNoms() ? `Put your name down. Your chances as things stand: ${Math.round(clamp(L.mayorOdds(), 0.1, 0.95) * 100)}%, more if you campaign.` : `Nominations open in ${L.annalsWhen(L.s.annals.poll - NOMS)}.`),
    why(L) {
      const an = L.s.annals;
      if (!L.annalsNoms()) return `The next election is in ${L.annalsWhen(an.poll)}; nominations open two seasons before.`;
      if (an.race.you) return 'Your name is down. Now get out and campaign.';
      const miss = L.nextRung().list.find((n) => !n.ok && !n.text.startsWith('Win'));
      return miss ? `First: ${miss.text}.` : null;
    },
    run(L) {
      const s = L.s, r = s.annals.race;
      s.f.ran = s.t;
      r.you = true;
      r.c.push(youRec(L));
      r.camp.you = r.camp.you || 0;
      L.queue('anManifesto');
      return 'You hand in the nomination papers, signed by ten people who mean it and two who were passing. Your name goes up on the board outside the Town Hall.';
    },
  });

  // ---- things to do ----

  def('anHall', {
    place: 'townhall', sec: 'The council', icon: '🎩', time: 0, open: 'annalsHall',
    title: (L) => (L.annalsRace() ? 'The election' : 'The council'),
    desc: (L) => { const an = L.s.annals, m = L.annalsMayor(); return an.race ? `Polling day in ${L.annalsWhen(an.poll)}. Who is standing, the odds, and how to help.` : `${m.k === 'you' ? 'You are mayor' : L.annalsMayorTitle(m)}. What was promised, and what came of it.`; },
  });
  def('anYears', { place: 'library', sec: 'The town archives', icon: '🗂️', title: 'Years in the Bay', desc: 'The Gazette’s back numbers: every year you have lived here, in headlines.', time: 0, open: 'annalsYears' });
  def('anYearsHome', { place: 'home', sec: 'At home', icon: '🗂️', title: 'Years in the Bay', desc: 'Your cuttings from the Gazette, a headline for every year here, and what the year was for you.', time: 0, open: 'annalsYears' });

  // Campaign for somebody (x: their key, or 'you'), once a season while the election is on.
  def('anCampaign', {
    time: 1, per: 1,
    why(L, k) {
      const r = L.annalsRace();
      if (!r) return 'There is no election on.';
      if (L.s.t > L.s.annals.poll) return 'The polls have closed.';
      if (!r.c.some((c) => c.k === k)) return 'Campaign for whom?';
      return r.you && k !== 'you' ? 'You are standing yourself.' : null;
    },
    run(L, k) {
      const s = L.s, r = L.annalsRace(), c = r.c.find((x) => x.k === k), n = 3 + s.st.charm / 20 + s.fame / 25 + (inPolitics(L) ? 2 : 0);
      r.sup[k] = (r.sup[k] || 0) + n;
      r.camp[k] = (r.camp[k] || 0) + n;
      s.annals.n.camp = (s.annals.n.camp || 0) + 1;
      L.gain('charm', 0.7); L.joy(1);
      if (inPolitics(L) && s.job.r < 4) s.job.perf = clamp(s.job.perf + 2, 0, 100);
      if (k === 'you') return L.pick(['You knock on two hundred doors. Ninety open. Forty listen. One gives you a cup of tea and a piece of her mind.', 'A morning on a stepladder outside the Co-op with a megaphone that only works when you are not speaking.', 'You shake every hand on the quay, including one that turns out to be a glove on a post.']);
      return `${L.pick(['You push leaflets through letterboxes until a terrier takes one, and your finger with it.', 'An afternoon on the High Street with a rosette and a clipboard. People cross the road, and then cross back to argue.', 'You knock on doors in the rain. One man agrees with everything you say, and then says he is voting for the other one.', 'You stand outside the station with a placard as the commuters come off the train.'])} ${cap(short(L, c))} is grateful.`;
    },
  });
  // A bet at the bookmaker's (x: { k: on whom, n: the stake }), once an election.
  def('anBet', {
    time: 0, cost: (L, x) => (x && STAKES.includes(x.n) ? x.n : 0),
    why(L, x) {
      const r = L.annalsRace();
      if (!r) return 'There is no election on.';
      if (L.s.t > L.s.annals.poll) return 'Betting has closed.';
      if (r.bet) return 'You have a bet on already.';
      if (!x || !STAKES.includes(x.n) || !r.c.some((c) => c.k === x.k)) return 'Bet on whom?';
      return null;
    },
    run(L, x) {
      const r = L.annalsRace(), [a, b] = L.annalsPrice(x.k), c = r.c.find((q) => q.k === x.k);
      r.bet = { on: x.k, n: x.n, a, b };
      return `The man in the bookmaker’s writes it on a slip: ${money(x.n)} on ${x.k === 'you' ? 'yourself' : full(L, c)}, at ${L.annalsPriceSaid(x.k)}. ${x.k === 'you' ? 'He looks at you over his glasses for a while before he takes it.' : 'It would pay ' + money(Math.round(x.n * (1 + a / b))) + '.'}`;
    },
  });
  // A gift to one of the town's appeals (x: { to, n }).
  const APPEALS = {
    pier: { name: 'the Pier Trust', open: (L) => pierShut(L) },
    lido: { name: 'the Lido Fund', open: (L) => L.s.annals.plan.some((w) => w.p === 'lido') },
    line: { name: 'Save Our Line', open: (L) => lineThreat(L) },
  };
  def('anGive', {
    time: 0, per: 1, cost: (L, x) => (x && [100, 1000, 10000].includes(x.n) ? x.n : 0),
    why: (L, x) => (!x || !APPEALS[x.to] || ![100, 1000, 10000].includes(x.n) ? 'Give what, to what?' : APPEALS[x.to].open(L) ? null : 'That appeal has closed.'),
    run(L, x) {
      const s = L.s, an = s.annals;
      an.gave[x.to] = (an.gave[x.to] || 0) + x.n;
      s.n.given = (s.n.given || 0) + x.n;
      L.karma(x.n >= 10000 ? 5 : x.n >= 1000 ? 2 : 0.5); L.joy(1 + Math.log10(x.n) / 2);
      if (x.to === 'pier') { const e = ev(L, 'storm'); e.trust += x.n; e.due = Math.max(s.t + 2, e.due - Math.floor(x.n / 2500)); }
      if (x.to === 'line') { const e = ev(L, 'line'); if (x.n >= 1000) e.effort += x.n >= 10000 ? 1 : 0.5; }
      return `${money(x.n)} to ${APPEALS[x.to].name}. ${x.n >= 10000 ? 'Your name goes at the top of the list in the Gazette, in bold.' : x.n >= 1000 ? 'Your name goes on the list in the Gazette.' : 'A sticker for your coat, and a thank-you.'}`;
    },
  });
  def('anLido', {
    place: 'cove', sec: 'The lido', icon: '🏊', title: 'Swim at the lido', desc: 'Heated, by the sea wall, with a slide. Good for Fitness and the mood.', cost: 6, per: 1,
    show: (L) => has(L, 'lido'),
    why: (L) => (L.season === 3 ? 'The lido is shut for the winter: open May to September.' : null),
    run(L) {
      const hot = L.s.wx === 'hot';
      L.gain('fitness', 2.2); L.joy(hot ? 6 : L.season === 1 ? 5 : 3); L.hp(1);
      return hot ? 'Every child in the Bay is in the lido, and most of the grown-ups. You swim a length in an hour.' : L.pick(['Forty lengths, and then lying on the warm concrete like a seal.', 'You go down the slide. Twice. Nobody stops you, because you are an adult.', 'The water is blue and warm, and on the other side of the wall the sea is grey and not.']);
    },
  });

  // ---- the cards ----

  const voteOpt = (i) => ({
    t: (L) => { const c = L.annalsRace().c.filter((x) => x.k !== 'you')[i]; return `Vote for ${full(L, c)}: ${PLATS[c.plat].name.toLowerCase()}`; },
    show: (L) => { const r = L.annalsRace(); return !!r && !r.you && r.c.filter((x) => x.k !== 'you').length > i; },
    run(L) {
      const s = L.s, an = s.annals, r = an.race, c = r.c.filter((x) => x.k !== 'you')[i];
      r.vote = c.k; r.sup[c.k] += 1.5;
      an.n.votes = (an.n.votes || 0) + 1;
      L.joy(1);
      return L.pick([`You put your cross by ${full(L, c)} in a booth made of three hardboard panels and a curtain, and fold the paper twice, as though it were a secret.`, `A cross by ${full(L, c)}, the pencil on its string, and a sticker from the man at the door.`, `You vote for ${full(L, c)}, and then stand outside the church hall for a while, feeling that you have done something.`]);
    },
  });
  const posterOpt = (i) => ({
    t: (L) => { const c = L.annalsRace().c.filter((x) => x.k !== 'you')[i]; return `Put a poster for ${short(L, c)} in your window`; },
    show: (L) => { const r = L.annalsRace(); return !!r && !r.you && r.c.filter((x) => x.k !== 'you').length > i && L.s.home !== 'hostel'; },
    run(L) { const r = L.annalsRace(), c = r.c.filter((x) => x.k !== 'you')[i]; r.sup[c.k] += 2; r.camp[c.k] = (r.camp[c.k] || 0) + 2; L.joy(1); return `${cap(short(L, c))}’s face goes up in your front window. The neighbours put up the other one. It is all very civil.`; },
  });
  const raceOk = (L) => !L.s.gaol && !!L.annalsRace();

  const CARDS = [
    // ---- elections ----
    {
      id: 'anPoll', icon: '🗳️', title: 'Polling day', ok: raceOk,
      text(L) {
        const s = L.s, an = s.annals, r = an.race, n = (an.n.votes || 0) + 1, m = an.mayor;
        const where = n === 1 ? 'Your first vote in Starling Bay. The polling station is the church hall, and the man at the desk crosses your name off with tremendous ceremony.'
          : s.age >= 70 ? `The church hall again, for the ${nth(n)} time. The pencil on its string is new. Nothing else is.`
            : L.pick(['The church hall again: three booths, a pencil on a string, and a smell of floor polish and squash.', 'Polling day. Somebody has chalked VOTE on the pavement outside the church hall, with an arrow, in case.',
              s.wx === 'wet' ? 'Rain on the church hall roof. Turnout will be low, says the man at the door, as he says every time.' : 'A queue at the church hall, and a man from the Gazette asking people on the way out, who mostly will not say.',
              ev(L, 'estate') && ev(L, 'estate').done != null ? 'The queue at the church hall is longer since Brickworks Rise was built, and younger.' : 'The church hall smells of floor polish and the jumble sale it held yesterday.']);
        const stands = m.k !== 'you' && r.c.some((c) => c.k === m.k);
        const record = !stands ? '' : an.mbroke === m.k ? ' Nobody has forgotten the promise that came to nothing.' : an.mkept === m.k ? ' The mayor would like everybody to remember that the last promise was kept.' : '';
        // (A grown child of yours voting for the first time comes too.)
        const kid = L.kids().find((k) => k.age >= 18 && k.age <= 21);
        const along = kid && !r.you ? ` ${kid.name.split(' ')[0]} walks down with you, voting for the first time, and will not say who for.` : '';
        if (r.you) return `${where}${record} Your own name is on the ballot paper, which looks very strange in print. The bookmaker has you at ${L.annalsPriceSaid('you')}.`;
        // (Who they are is in the council chamber; the paper has their names and what they promise.)
        return `${where}${along}${record}${last(L)} On the paper: ${list(r.c.map((c) => `${cap(short(L, c))} (${said(c.plat)})`))}.`;
      },
      opts: [
        voteOpt(0), voteOpt(1), voteOpt(2),
        { t: 'Vote for yourself', show: (L) => !!L.annalsRace() && L.annalsRace().you, run(L) { const an = L.s.annals; an.race.vote = 'you'; an.n.votes = (an.n.votes || 0) + 1; return 'You put a cross by your own name. It feels both right and faintly ridiculous, like signing your own birthday card.'; } },
        { t: 'Stay at home', run(L) { L.joy(-0.5); return L.pick(['It rains. You tell yourself it would not have made any difference.', 'You mean to go, and then it is ten o’clock and the polls have closed.']); } },
      ],
    },
    {
      id: 'anCount', icon: '🏛️', title: 'The count', ok: (L) => !L.s.gaol && !!L.s.annals.last,
      text(L, x) {
        const last = L.s.annals.last, won = last.win === 'you';
        const by = L.pick(['by a street', 'by a few hundred votes', 'comfortably', 'on the third recount, by eleven votes']);
        const when = L.pick(['At two in the morning', 'Just after midnight, under the portraits in the Town Hall,', 'With the sun coming up over the harbour,']);
        let t = won ? `${when} the returning officer clears her throat, and reads out your name. You have won, ${by}.` : `${when} the returning officer reads out the result: ${last.name} has won, ${by}.`;
        if (x.you && !won) t += ' You shake the winner’s hand, and mean it, mostly.';
        if (x.paid) t += ` The bookmaker pays out ${money(x.paid)}, with bad grace.`;
        else if (x.bet) t += ' Your betting slip goes in the bin.';
        return t;
      },
      opts: [
        { t: (L, x) => (x.win === 'you' ? 'Make a speech' : 'Raise a glass, whoever it was'), run(L, x) { if (x.win === 'you') { L.gain('charm', 1); return 'You thank everybody, including the people who did not vote for you, who look surprised.'; } L.joy(1); return 'The Gull stays open late for the count. It is a good excuse, and a good night.'; } },
        { t: 'Go home to bed', run(L) { L.hp(1); return 'Democracy will still be there in the morning.'; } },
      ],
    },
    {
      id: 'anManifesto', icon: '📜', title: 'Your manifesto', ok: (L) => !!L.annalsRace() && L.annalsRace().you,
      text: 'The Gazette wants your manifesto by Friday, in one sentence, and the printer wants it by Thursday. What do you promise the Bay?',
      opts: [0, 1, 2].map((i) => ({
        t: (L) => { const p = myPlats(L)[i]; return `${PLATS[p].name}: ${PLATS[p].pitch.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase())}`; },
        show: (L) => myPlats(L).length > i,
        run(L) { const p = myPlats(L)[i], s = L.s; s.annals.mine = p; const r = L.annalsRace(); r.c.find((c) => c.k === 'you').plat = p; r.camp.you = (r.camp.you || 0) + 2; return `"${PLATS[p].name}," says the leaflet, under a photograph of you looking out to sea. Your mother has forty of them.`; },
      })).concat([{ t: 'Steady as she goes', run(L) { const s = L.s; s.annals.mine = 'steady'; L.annalsRace().c.find((c) => c.k === 'you').plat = 'steady'; return 'You promise nothing at all, very sincerely. It goes down better than you expected.'; } }]),
    },
    {
      id: 'anIncumbent', icon: '⛓️', title: 'Another four years?', ok: (L) => !L.s.gaol && !!L.annalsRace() && L.annalsRace().you && L.s.annals.mayor.k === 'you',
      text: (L) => `Nominations are open, and the town wants to know whether you will stand again. ${(L.s.annals.n.kept || 0) > 0 ? 'You have something to show for the last four years.' : (L.s.annals.n.kept || 0) < 0 ? 'Not everything you promised last time came off, and the Gazette has a long memory.' : 'The last four years have been, the Gazette says, "steady".'}`,
      opts: [
        { t: 'Stand again, on your record', run(L) { return 'You have the chain polished, and the posters reprinted with a newer photograph.'; } },
        { t: 'Stand again, with a new promise', run(L) { L.queue('anManifesto'); return 'Four more years, and something to show for them. You sit down with a pad of paper.'; } },
        { t: 'Stand down at the election', run(L) { const r = L.annalsRace(); r.you = false; r.c = r.c.filter((c) => c.k !== 'you'); if (!r.c.length) { const d = stander(L, { plat: 'steady' }); r.c.push(d); r.sup[d.k] = base(L, 'steady'); } L.s.annals.standDown = 1; return 'You will hand the chain on in the spring. It is lighter, somehow, already.'; } },
      ],
    },
    {
      id: 'anCause', icon: '📣', title: 'A cause',
      ok: (L, x) => { const p = L.person(x.p), r = L.annalsRace(); return raceOk(L) && !!p && (p.kind === 'partner' || p.kind === 'spouse') && (r.you || r.c.some((c) => c.k === x.k)); },
      text(L, x) {
        const p = L.person(x.p), r = L.annalsRace();
        if (r.you) return `${p.name} has taken a week off work to run your campaign office, which is the kitchen table. There are leaflets in the bread bin and a map of the town on the fridge with pins in it.`;
        const c = r.c.find((q) => q.k === x.k);
        return `${p.name} has come home from a meeting at the church hall with a rosette and a look you know. ${p.sex === 'm' ? 'He' : 'She'} is for ${full(L, c)} and ${PLATS[c.plat].name.toLowerCase()}, heart and soul, and wants you out canvassing on Saturday.`;
      },
      opts: [
        { t: 'Go out canvassing together', run(L, x) { const p = L.person(x.p), r = L.annalsRace(), k = r.you ? 'you' : x.k; L.bond(p, 6); L.joy(2); L.s.time = Math.max(0, L.s.time - 1); r.sup[k] += 3; r.camp[k] = (r.camp[k] || 0) + 3; return `A whole Saturday of doorsteps, side by side. ${p.name} does the talking, you do the dogs. It is the best day you have had together in months.`; } },
        { t: 'Tell them they are backing the wrong horse', show: (L) => !L.annalsRace().you, check: ['charm', 50], run(L, x, win) { const p = L.person(x.p); if (win) { L.bond(p, 2); return `You argue it out over dinner, and pudding, and the washing-up. ${p.name} does not change sides, but does admit you have a point. Two points.`; } L.bond(p, -4); return `It gets heated. ${p.name} goes canvassing alone, and leaves a leaflet on your pillow.`; } },
        { t: 'Leave them to it', run(L, x) { const p = L.person(x.p); L.bond(p, -1); return `${p.name} goes out with a clipboard, and comes back with opinions about everybody in the Bay.`; } },
      ],
    },
    {
      id: 'anBudget', icon: '📉', title: 'Over budget', ok: (L, x) => !L.s.gaol && L.s.annals.plan.some((w) => w.p === x && w.by === 'you' && !w.keep),
      text: (L, x) => `The town clerk lays the figures on your desk: ${PLATS[x].name.toLowerCase()}, your promise, is going to cost half as much again as anybody said. Without more money it will have to be dropped.`,
      opts: [
        { t: 'Put up the rates to pay for it', run(L, x) { const an = L.s.annals, w = an.plan.find((q) => q.p === x); w.keep = true; w.drop = null; an.budget = { n: 60, until: L.s.t + 8 }; L.karma(-1); return 'Sixty dollars a season on everybody’s rates, yours included, for two years. The letters page of the Gazette is very full.'; } },
        { t: 'Find the money in the town’s reserves', check: ['smarts', 60], run(L, x, win) { const an = L.s.annals, w = an.plan.find((q) => q.p === x); if (win) { w.keep = true; w.drop = null; L.gain('smarts', 1); return 'You go through the accounts line by line for a week, and find it: a fund for a statue of a mayor from 1890 that nobody ever built.'; } w.drop = L.s.t; return 'There is no money in the reserves. There is a lot of paper. The promise goes.'; } },
        { t: 'Drop it, and say so', run(L, x) { const w = L.s.annals.plan.find((q) => q.p === x); w.drop = L.s.t; L.karma(1); return 'You stand up in the council chamber and say plainly that it cannot be done. Some people respect that. Most write to the Gazette.'; } },
      ],
    },

    // ---- the pier ----
    {
      id: 'anStorm', icon: '⛈️', title: 'The night of the great storm', ok: (L) => !L.s.gaol,
      text: (L) => (ev(L, 'storm').held ? 'The worst gale anybody can remember. The windows hum all night, slates come off all over the Bay, and in the morning the whole town is out on the front, picking things up.' : 'The worst gale anybody can remember. At two in the morning there is a sound from the front like a train going off a bridge: the middle of the pier has gone, and the Lucky Gull stands out at sea on its own, lit up and empty.'),
      opts: [
        { t: 'Turn out with the lifeboat crew', show: (L) => !!L.coastOnBooks && L.coastOnBooks(), run(L) { L.karma(4); L.fame(1); L.gain('fitness', 1); L.hp(-2, 'a night at sea'); return 'Two boats dragging their moorings, and a man in pyjamas on the end of the pier who went to look. You bring them all in. Captain Quinn says "Good." twice.'; } },
        { t: 'Help fill sandbags on the front', check: ['fitness', 40], run(L, x, win) { L.karma(3); if (win) { L.gain('fitness', 1); L.joy(3); return 'All night in a line of strangers, bag after bag, until the tide turns. By dawn they are not strangers.'; } L.hp(-3, 'a night in a gale'); return 'A wave comes over the sea wall and takes you off your feet. You are fished out, and sent home with a blanket.'; } },
        { t: tr('daredevil', 'Go down to the front and watch it'), show: (L) => trait(L, 'daredevil'), check: ['fitness', 50], run(L, x, win) { if (win) { L.joy(6); L.fame(0.5); return 'You stand on the sea wall in the screaming dark and watch the pier go, piece by piece, lit by the lightning. The Gazette prints a photograph of somebody who looks very like you, and a stern word.'; } L.hp(-6, 'a night on the sea wall'); return 'A wave the size of a bus comes over the wall. You come round in St Wren’s, with a nurse saying things about people who go and look.'; } },
        { t: 'Stay in and listen to it', run(L) { L.joy(-1); return 'You lie awake listening to it go over, and in the morning you go down to look like everybody else.'; } },
      ],
    },
    {
      id: 'anPierFund', icon: '🎡', title: 'The Pier Trust', ok: (L) => !L.s.gaol && pierShut(L),
      text: 'There is a thermometer on a board outside the Town Hall, painted red at the bottom: the Pier Trust, raising money to mend the pier. The vicar has given her harvest collection, and the Rovers a match’s takings.',
      opts: [
        { t: 'Give $1,000', cost: 1000, run(L) { give(L, 'pier', 1000); return 'Your name on the list in the Gazette, and the red goes up the thermometer by a whisker.'; } },
        { t: 'Give $100', cost: 100, run(L) { give(L, 'pier', 100); return 'A sticker for your coat that says I MENDED THE PIER (A BIT).'; } },
        { t: 'Run the sponsored swim', check: ['fitness', 45], run(L, x, win) { if (win) { const e = ev(L, 'storm'); e.due = Math.max(L.s.t + 2, e.due - 1); L.karma(3); L.gain('fitness', 1); return 'Round the end of the broken pier and back, and four thousand dollars in pledges. The Gazette photographs you blue with cold.'; } L.karma(1); return 'You get halfway round, and are fetched back by the lifeboat. You raise four hundred dollars, mostly in sympathy.'; } },
        { t: 'It is not your pier', run() { return 'You walk past the thermometer every day. It goes up slowly without you.'; } },
      ],
    },
    {
      id: 'anPierOpen', icon: '🎡', title: 'The pier reopens', ok: (L) => !L.s.gaol && !pierShut(L),
      text: (L, x) => (x && x.how === 'gift' ? 'The new pier is finished: ironwork to the very end, and the Lucky Gull lit up like a liner. The mayor asks you to walk out along it first.' : `The pier is mended, and the Lucky Gull open again. Everybody who gave to the Pier Trust is invited to walk out along it first, before the public${(ev(L, 'storm').trust || 0) >= 10000 ? ', and you, as the Trust’s biggest giver, are asked to cut the ribbon' : ''}.`),
      opts: [
        { t: (L) => ((ev(L, 'storm').trust || 0) >= 10000 ? 'Cut the ribbon' : 'Walk out to the end'), run(L) { const big = (ev(L, 'storm').trust || 0) >= 10000; L.joy(6); if (big) { ribbon(L, 'the mended pier'); L.fame(2); return 'Gold scissors, a speech that is mercifully short, and the whole town walking out behind you over the sea.'; } return 'Out over the water, with the boards new under your feet and the town behind you, all lit up. You stay until they turn the lights off.'; } },
      ],
    },

    // ---- the supermarket ----
    {
      id: 'anMarket', icon: '🛒', title: 'The planning inquiry', ok: (L) => !L.s.gaol && !!ev(L, 'market') && ev(L, 'market').open == null,
      text: 'The inspector from the ministry is hearing what the town thinks of the supermarket in the Town Hall, all week. The High Street’s shopkeepers sit in a row at the front. The supermarket has sent a man in a very good suit.',
      opts: [
        { t: 'Speak up for the High Street', check: ['charm', 50], run(L, x, win) { const e = ev(L, 'market'); L.karma(2); if (win) { e.local = 1; e.due += 2; L.fame(0.5); return 'You talk about the butcher who knows how you like your bacon, and the toy shop, and the bookshop. The inspector lets them build it anyway, but with a free bus to the High Street and a delay of six months, and the shopkeepers stand you a drink.'; } return 'You lose your thread halfway and find it again too late. The inspector thanks you, and writes something down, and lets them build it.'; } },
        { t: 'Say the town needs cheaper shopping', run(L) { const e = ev(L, 'market'); e.due = Math.max(L.s.t + 1, e.due - 1); return 'Not everybody can pay High Street prices, you say. Half the room glares at you; the other half buys you a cup of tea in the interval.'; } },
        { t: 'Stay away', run() { return 'You read about it in the Gazette. The inspector lets them build it.'; } },
      ],
    },
    {
      id: 'anShopLocal', icon: '🧺', title: 'Shop local', ok: (L) => !L.s.gaol && marketOpen(L) && !ev(L, 'market').campaigned,
      text: 'The High Street is half empty on a Saturday, and the shopkeepers have had leaflets printed: SHOP LOCAL, OR LOSE IT. They want volunteers for a Saturday market and a loyalty card, and somebody to organise it.',
      opts: [
        { t: 'Organise it', check: ['charm', 45], run(L, x, win) { const e = ev(L, 'market'); e.campaigned = 1; L.s.time = Math.max(0, L.s.time - 1); L.karma(3); if (win) { e.local = 1; L.fame(0.5); return 'A loyalty card, a Saturday market, and fairy lights the length of the street. People come back, not all of them, but enough. The High Street will lose less to the ring road.'; } return 'You organise a great deal. It helps a little. The fairy lights are lovely.'; } },
        { t: 'Do your own shopping on the High Street', run(L) { ev(L, 'market').campaigned = 1; L.karma(1); return 'It costs a bit more. The butcher has started saving you the good sausages.'; } },
        { t: 'The supermarket is cheaper', run(L) { ev(L, 'market').campaigned = 1; L.joy(1); return 'It is cheaper, and it has a café, and nobody there knows your name. Some weeks that is a relief.'; } },
      ],
    },
    {
      id: 'anCutbacks', icon: '📉', title: 'Cutbacks', ok: (L) => !L.s.gaol && !!L.s.job && L.s.job.c === 'retail' && marketOpen(L),
      text: 'Since the supermarket opened, trade at work is down by a third. The boss calls everybody in on Monday morning. There will be cuts, and the supermarket on the ring road is hiring.',
      opts: [
        { t: 'Dig in and work harder', check: ['charm', 45], run(L, x, win) { const j = L.s.job; if (win) { j.perf = clamp(j.perf + 6, 0, 100); return 'You run a window display that stops people in the street, and a Saturday offer that brings them in. The boss keeps everybody on, just.'; } j.perf = clamp(j.perf - 8, 0, 100); L.joy(-3); return 'You work harder. So does everybody. It is not enough to stop the cuts, and the boss is short with everybody.'; } },
        { t: 'Go over to the supermarket', run(L) { const j = L.s.job; j.perf = 45; L.joy(-2); L.note('Moved from the High Street to the supermarket on the ring road.'); return 'Same job, more aisles, a badge with your name on it and a smile you are trained to use. The pay is the same. The tea is worse.'; } },
        { t: 'Take voluntary redundancy', run(L) { const n = L.shiftPay() * 5, t = L.jobTitle(); L.s.job = null; L.cash(n); L.joy(-4); L.note(`Took voluntary redundancy as ${t}, with ${money(n)}.`, 'big'); return `${money(n)}, a card signed by everybody, and an empty Monday morning.`; } },
      ],
    },

    // ---- the film ----
    {
      id: 'anFilm', icon: '🎬', title: 'The Wreckers of Starling Cove', ok: (L) => !L.s.gaol && !!ev(L, 'film') && !ev(L, 'film').aired,
      text: (L) => `The film crew has set up in the harbour car park: a catering van, three caravans and a man with a megaphone. They want extras${L.s.age >= 55 ? ', and are especially keen on weathered faces' : ''}, and somewhere to put the leading lady.`,
      opts: [
        { t: 'Queue up to be an extra', check: ['charm', 40], run(L, x, win) { if (win) { ev(L, 'film').part = 1; L.cash(1200); L.fame(2); L.joy(6); L.s.time = Math.max(0, L.s.time - 1); return `Three weeks in a ${L.s.sex === 'f' ? 'bonnet' : 'tricorn hat'}, as ${L.pick(['Villager Four', 'A Wrecker (Background)', 'Woman With Basket', 'Drunk Man At Inn'])}. You are paid ${money(1200)} and fed far too much.`; } return 'They look at you, and at the next person, and take the next person. "Lovely face," says the woman with the clipboard. "Wrong century."'; } },
        { t: 'Let them film in your home', show: (L) => !!L.s.owned && ['cottage', 'townhouse', 'villa', 'manor'].includes(L.s.home), run(L) { L.cash(3000); L.joy(2); return 'Your front room is a smugglers’ den for a week. They pay $3,000, leave a chandelier, and take your cat’s favourite chair, which they say is "very period".'; } },
        { t: 'Cater for the crew', show: (L) => !!L.s.biz && L.s.biz.type === 'food', run(L) { const n = round10(L.bizTake() * 1.5); L.cash(n); L.s.n.earned += n; L.s.time = Math.max(0, L.s.time - 1); return `Bacon rolls at five in the morning for sixty people, every day for a month. ${money(n)}, and the leading man asks for your recipe.`; } },
        { t: 'Watch from the sea wall', run(L) { L.joy(2); return 'You watch them film the same shipwreck eleven times. On the twelfth, a gull walks through it, and that is the one they use.'; } },
      ],
    },
    {
      id: 'anFilmAir', icon: '📺', title: 'On the television', ok: (L) => !L.s.gaol,
      text: (L) => (ev(L, 'film').part ? 'The Wreckers of Starling Cove is on the television on Sunday night, and the whole town watches. And there you are, in the second episode, for two whole seconds, behind a barrel.' : 'The Wreckers of Starling Cove is on the television on Sunday night, and the whole town watches. There is the harbour, and the cove, and the Gull & Anchor with a different sign on it.'),
      opts: [
        { t: 'Watch it at the Gull', run(L) { L.joy(4); const p = ev(L, 'film').part; if (p) { L.fame(1); return 'The pub cheers when you come on, and again when you go off. Somebody has it on video, and plays it back until closing time.'; } return 'Every time somebody recognises somewhere, they shout. It takes a long time to watch an hour.'; } },
        { t: 'Watch it at home', run(L) { L.joy(3); L.hp(1); return 'With the curtains drawn and a cup of tea, and then you go outside to look at the cove, which seems different now.'; } },
      ],
    },

    // ---- the estate ----
    {
      id: 'anEstate', icon: '🏘️', title: 'The brickworks', ok: (L) => !L.s.gaol && !!ev(L, 'estate') && ev(L, 'estate').done == null && !ev(L, 'estate').said,
      text: 'There is a public meeting about the new estate on the old brickworks. Two hundred homes: the young people say at last; the people on Cliff Road say their views; the school says where will it put them all.',
      opts: [
        { t: 'Speak for the new homes', run(L) { const e = ev(L, 'estate'); e.said = 1; e.due = Math.max(L.s.t + 2, e.due - 1); L.karma(2); return 'You say that you came here with one suitcase, and that the town was kind to you, and should be kind to the next lot. There is a silence, and then some applause from the back.'; } },
        { t: 'Object to it', check: ['charm', 45], run(L, x, win) { const e = ev(L, 'estate'); e.said = 1; if (win) { e.due += 2; return 'You talk about the school and the roads, and the planners go away to think again. They come back with a smaller estate, a year later, and a new school classroom.'; } return 'You object at length. The planners thank you for your contribution, and approve it.'; } },
        { t: 'Ask about a home on it', show: (L) => !L.s.owned && L.s.age < 45, run(L) { const e = ev(L, 'estate'); e.said = 1; e.want = 1; return 'The developer’s woman gives you a brochure and a pen. When it is finished, she says, house prices in the Bay will settle, and starter homes go first to people who live here.'; } },
      ],
    },
    {
      id: 'anChair', icon: '📋', title: 'The residents’ association', ok: (L) => !L.s.gaol && !!ev(L, 'estate') && ev(L, 'estate').done != null,
      text: 'The new families on Brickworks Rise have formed a residents’ association, and they need a chair who knows the town: somebody who can tell them who to ring about the bins, and who not to ring about anything.',
      opts: [
        { t: 'Take the chair', run(L) { L.karma(4); L.gain('charm', 1.5); L.s.time = Math.max(0, L.s.time - 1); if (L.friends().length < 20 && L.chance(0.6)) { const p = L.meet({ age: L.int(28, 40) }); return `Meetings in a community room that smells of new carpet. You get the bins sorted, a zebra crossing and a lollipop man. ${p.name}, the secretary, becomes a friend.`; } return 'Meetings in a community room that smells of new carpet. You get the bins sorted, a zebra crossing and a lollipop man.'; } },
        { t: 'Give them a list of numbers instead', run(L) { L.karma(1); return 'The council, the vicar, Jess Dobbs for anything with an engine, and Betty’s for anything else. They are very grateful.'; } },
      ],
    },

    // ---- the railway ----
    {
      id: 'anLine', icon: '🚂', title: 'Save our line', ok: (L) => !L.s.gaol && lineThreat(L),
      text: 'The campaign to save the railway meets in the waiting room at the station, under a timetable nobody has changed since it was put up. They need people: to write letters, to fill a train to the city with protesters, to count passengers on a cold platform at six in the morning.',
      opts: [
        { t: 'Throw yourself into it', check: ['charm', 45], run(L, x, win) { const e = ev(L, 'line'); e.effort += win ? 2 : 1; L.karma(3); L.s.time = Math.max(0, L.s.time - 1); if (win) { L.fame(1); return 'You fill a whole train with protesters in fancy dress and take it to the ministry. It is on the national news, for forty seconds, between a strike and a panda.'; } return 'You count passengers at six in the morning for a month. There are more than the ministry says. Whether it will listen is another matter.'; } },
        { t: 'Sign the petition', run(L) { ev(L, 'line').effort += 0.5; return 'Your name goes on page forty-one, under a man who has signed it twice.'; } },
        { t: 'It is only a railway', run() { return 'You have a bicycle, you think. And there is always the coach.'; } },
      ],
    },
    {
      id: 'anLineEnd', icon: '🚂', title: (L, x) => (x && x.saved ? 'The line is saved' : 'The last train'), ok: (L) => !L.s.gaol,
      text: (L, x) => (x && x.saved ? 'The campaign to save the railway has won. There is a party in the waiting room, with a cake in the shape of an engine and the station master in a paper hat.' : 'The last train to the city leaves on Saturday evening. The whole town is on the platform, and the brass band plays something slow.'),
      opts: [
        { t: (L, x) => (x && x.saved ? 'Have a slice of the engine' : 'Ride the last train'), run(L, x) { if (x && x.saved) { L.joy(5); return 'You have the funnel. It is mostly icing.'; } L.joy(-2); L.gain('charm', 0.5); return 'To the city and back, in a carriage full of people singing. At the end of the line everybody gets off, and nobody quite knows what to do next.'; } },
        { t: 'Stand on the platform', run(L, x) { L.joy(x && x.saved ? 3 : -1); return x && x.saved ? 'The 7.42 comes in, on time for once, and the platform cheers it.' : 'You watch its lights go round the bend by the gasworks, and then it is very quiet.'; } },
      ],
    },
    {
      id: 'anLineBack', icon: '🚂', title: 'The first train', ok: (L) => !L.s.gaol,
      text: 'After years of buses, the line is open again: a lottery grant, volunteers in waistcoats and a great deal of paint. The first train in is late, and decorated with bunting, and nobody minds.',
      opts: [
        { t: 'Volunteer on the line', run(L) { L.karma(3); L.gain('craft', 1); return 'You are given a waistcoat, a whistle and a timetable you are told never to trust. Every second Sunday is yours.'; } },
        { t: 'Be on the first train', run(L) { L.joy(5); return 'To the city and back, with a tea trolley and the guard pointing out the cows.'; } },
      ],
    },

    // ---- the flood, the visit and the summer ----
    {
      id: 'anFlood', icon: '🌊', title: 'The water came up in the night', ok: (L) => !L.s.gaol,
      text: (L, x) => (x && x.low ? `You wake at three to the sound of water where there should not be any. By morning ${L.s.owned ? 'your ground floor' : 'your rooms'} are a foot deep in the sea, and your things are floating.` : 'From up the hill you can see the harbour in the High Street and the High Street in the park. Down in the town people are carrying what they can up the stairs.'),
      opts: [
        { t: 'Go down and help', check: ['fitness', 40], run(L, x, win) { L.karma(5); L.s.time = Math.max(0, L.s.time - 1); if (win) { L.joy(2); L.gain('fitness', 1); return 'Boats in the High Street, and you in one of them, ferrying old people and their cats from upstairs windows. The Gazette prints your photograph, wet through.'; } L.hp(-3, 'a soaking'); return 'You do what you can, which is a lot of carrying and some falling over. You go home soaked and cold and glad you went.'; } },
        { t: tr('churchgoer', 'Open up the church hall with the vicar'), show: (L) => trait(L, 'churchgoer'), run(L) { L.karma(6); L.joy(3); L.s.time = Math.max(0, L.s.time - 1); if (L.folkWarm && L.folk('hollis').met != null) L.folkWarm('hollis', 4); return 'Camp beds, a tea urn the size of a dustbin and the Reverend Hollis in wellingtons, giving orders. Forty people sleep dry, and nobody is allowed to say thank you more than twice.'; } },
        { t: 'Take in a family who have lost everything', show: (L) => L.s.home !== 'hostel', run(L) { L.karma(6); L.joy(1); L.cash(-200); if (L.friends().length < 20 && L.chance(0.5)) { const p = L.meet({ age: L.int(30, 50) }); L.bond(p, 15); return `The ${p.name.split(' ')[1]}s sleep on your floor for a month, and do all the washing-up. ${p.name} becomes a friend for life.`; } return 'A family of four and a dog sleep on your floor for a month, and do all the washing-up. It costs you a bit in food. It is worth it.'; } },
        { t: 'Save what you can of your own', run(L, x) { if (x && x.low) { const back = Math.round((ev(L, 'flood').cost || 0) / 3 / 10) * 10; if (back > 0) L.cash(back); return `You carry what matters up the stairs and save some of it: ${money(back)} of what the water would have cost.`; } L.joy(-1); return 'You stay up the hill and dry. It does not feel as good as you thought it would.'; } },
      ],
    },
    {
      id: 'anRoyal', icon: '👑', title: 'The royal visit', ok: (L) => !L.s.gaol,
      text(L) {
        const s = L.s;
        if (picked(L)) return `A letter from the Town Hall, on the good paper: Her Royal Highness would like to meet some of the people who make Starling Bay what it is, and you are one of them${L.annalsMayor().k === 'you' ? ', not least because you are the mayor' : ''}. There is to be a line on the steps of the Town Hall, and a lot of advice about hats.`;
        return `Her Royal Highness is driving down the High Street on Thursday at eleven, and the town has been out with flags since seven.${s.age >= 70 ? ' It is the third royal car you have waved at in your life, and the first one that has slowed down.' : ''}`;
      },
      opts: [
        { t: 'Bow, or curtsey, and say something', show: picked, check: ['charm', 50], run(L, x, win) { L.joy(6); if (win) { L.fame(2); L.note('Was presented to Her Royal Highness on the steps of the Town Hall.', 'big'); return '"And what do you do?" she asks, and you tell her, and she laughs, properly. The photograph is in the Gazette for a week, and on your mantelpiece for ever.'; } L.fame(1); return 'You get the bow and the curtsey muddled and do a bit of both. She smiles very kindly, as she must have smiled at forty thousand people. You will dine out on it anyway.'; } },
        { t: 'Wave a flag on the High Street', run(L) { L.joy(3); return 'The car slows, a gloved hand waves, and the little girl beside you is convinced it waved at her. It did, probably.'; } },
        { t: 'Go fishing instead', run(L) { L.joy(1); return 'You are the only person on the harbour wall. The fish do not care about royalty either.'; } },
      ],
    },
    {
      id: 'anHeat', icon: '☀️', title: 'The cove is packed', ok: (L) => !L.s.gaol,
      text: (L) => `The hottest summer anybody can remember. The cove is towel to towel by nine, the ice-cream vans are queuing to get into the car park, and there is a hosepipe ban.${has(L, 'lido') ? ' The lido has a queue round the block.' : ''}${L.s.age >= 60 ? ' You remember summers like this, you tell people, and they nod, because they do too.' : ''}`,
      opts: [
        { t: 'Sell ice creams on the beach', check: ['charm', 35], run(L, x, win) { L.s.time = Math.max(0, L.s.time - 1); if (win) { L.cash(900); L.s.n.earned += 900; L.joy(3); return 'A cool box, a parasol and a voice like a foghorn. You sell out every day by two: $900.'; } L.cash(200); L.joy(1); return 'It melts faster than you can sell it. $200, and sticky arms to the elbow.'; } },
        { t: 'Swim at dawn, before the crowds', run(L) { L.joy(4); L.gain('fitness', 1); L.hp(1); return 'The sea flat as a plate, the beach empty, and the sun coming up out of it. You do it every morning until September.'; } },
        { t: 'Stay indoors with the curtains shut', run(L) { L.hp(1); return 'You lie on the kitchen floor, which is the coolest place in the house, and read.'; } },
      ],
    },

    // ---- appeals ----
    {
      id: 'anLidoFund', icon: '🏊', title: 'The Lido Fund', ok: (L) => !L.s.gaol && L.s.annals.plan.some((w) => w.p === 'lido'),
      text: 'The mayor has launched the Lido Fund, to pay for the extras the rates will not: a slide, a café, and changing rooms that do not smell of the sea. Givers will be invited to the opening.',
      opts: [
        { t: 'Give $5,000', cost: 5000, run(L) { L.s.annals.gave.lido = (L.s.annals.gave.lido || 0) + 5000; L.s.n.given = (L.s.n.given || 0) + 5000; L.karma(4); L.joy(3); return 'Your name will go on a tile by the deep end. You choose the font.'; } },
        { t: 'Give $500', cost: 500, run(L) { L.s.annals.gave.lido = (L.s.annals.gave.lido || 0) + 500; L.s.n.given = (L.s.n.given || 0) + 500; L.karma(1.5); return 'A certificate, and a promise of free swims in the first summer.'; } },
        { t: 'Not your sort of thing', run() { return 'You were never much of a swimmer, you tell the woman with the tin.'; } },
      ],
    },
    {
      id: 'anLidoOpen', icon: '🏊', title: 'The lido opens', ok: (L) => !L.s.gaol && has(L, 'lido'),
      text(L) {
        const g = L.s.annals.gave.lido || 0;
        if (g >= 5000 && L.s.age >= 60) return 'The mayor’s office has rung: would you, as one of the lido’s oldest friends and biggest givers, do them the honour of opening it? There will be a ribbon, and a photographer, and a great many children waiting to jump in.';
        if (L.annalsMayor().k === 'you') return 'Your lido is finished: blue water, white tiles, a slide, and the sea wall behind it. The whole town has come to watch you open it.';
        return 'The lido is finished, and everybody who gave to the fund is invited to the opening, in the front row, with a free swim to follow.';
      },
      opts: [
        { t: (L) => ((L.s.annals.gave.lido || 0) >= 5000 && L.s.age >= 60) || L.annalsMayor().k === 'you' ? 'Cut the ribbon, and jump in' : 'Go, and swim', run(L) { const big = ((L.s.annals.gave.lido || 0) >= 5000 && L.s.age >= 60) || L.annalsMayor().k === 'you'; L.joy(6); if (big) { ribbon(L, 'the lido'); L.fame(1.5); return `You cut the ribbon, and then, because somebody has to, you jump in first, in all your clothes. The photograph${L.s.age >= 60 ? ' of you, at ' + L.s.age + ', mid-air,' : ''} is the best thing the Gazette prints all year.`; } return 'A free swim in the first water ever to be in it. It is warm, and blue, and you are the first in the Bay to do a length.'; } },
        { t: 'Watch from the sea wall', run(L) { L.joy(3); return 'From up on the wall you can hear the children before the speeches finish.'; } },
      ],
    },

    // ---- the Gull ----
    {
      id: 'anWake', icon: '🍻', title: (L, x) => `Last orders for ${x.n}`, ok: (L) => !L.s.gaol,
      text: (L, x) => `${x.n}, who ${x.does}, has died. The Gull is holding a wake on Friday. The tankard is already on its hook over the bar, and there is a photograph of ${x.sex === 'f' ? 'her' : 'him'} propped against the till, looking much as ever.`,
      opts: [
        { t: 'Buy a round in their memory', cost: 220, run(L, x) { L.joy(3); L.gain('charm', 1); for (const p of L.friends()) L.bond(p, 1); return `"To ${x.n.split(' ')[0]}," says the whole pub, and drinks. It is a good night, which is what ${x.sex === 'f' ? 'she' : 'he'} would have wanted, or at least would have said.`; } },
        { t: 'Say a few words', check: ['charm', 45], run(L, x, win) { if (win) { L.karma(2); L.joy(4); return `You tell the story everybody knows, and one nobody did. They laugh in the right places and go quiet in the right places.`; } L.joy(1); return 'You stand up, and find you cannot, after all. Somebody pats your arm and takes over.'; } },
        { t: (L, x) => tr('joker', `Tell the joke ${x.sex === 'f' ? 'she' : 'he'} always told, badly`), show: (L) => trait(L, 'joker'), run(L, x) { L.joy(5); for (const p of L.friends()) L.bond(p, 2); return `You get the punchline wrong, the way ${x.n.split(' ')[0]} always did, and the whole pub shouts the right one back at you. It is the best laugh the Gull has had in years.`; } },
        { t: 'Raise a glass, quietly', run(L) { L.joy(1); return 'One drink, in the corner, and then home.'; } },
      ],
    },
  ];

  // Cards for the decade you are in: the scheduler offers one now and then, if it fits.
  const ERA = [
    {
      id: 'anMeeting', icon: '🛣️', title: 'The bypass meeting', when: (L) => L.s.age >= 32 && L.s.age <= 62 && L.s.annals.plan.some((w) => w.p === 'bypass' && w.keep && w.due - L.s.t >= 3),
      text: 'There is a town meeting about the bypass in the Town Hall, standing room only. The plans are pinned on a board: the road would cut across the bottom of Windle Farm, and Tom Windle is sitting in the front row with his arms folded.',
      opts: [
        { t: 'Speak for it: the lorries have to go somewhere', check: ['charm', 45], run(L, x, win) { const w = L.s.annals.plan.find((q) => q.p === 'bypass'); if (win && w) w.due = Math.max(L.s.t + 1, w.due - 2); L.gain('charm', 0.6); return win ? 'You talk about the High Street with the lorries off it, and the room comes round. The council finds the money to start sooner.' : 'You make your case. Tom Windle makes his, louder. Nothing is settled, except that the tea is stewed.'; } },
        { t: 'Speak for moving the route off the farm', check: ['charm', 45], run(L, x, win) { const w = L.s.annals.plan.find((q) => q.p === 'bypass'); L.karma(2); if (win) { if (w) w.due += 2; if (L.folkWarm && L.folk('windle').met != null) L.folkWarm('windle', 5); return 'You ask why it cannot go round the old quarry instead. Nobody has an answer. The route is moved, it will take longer, and Tom Windle nods to you in the street for the first time.'; } return 'You ask why it cannot go round the old quarry. Somebody has an answer, a long one, with a graph.'; } },
        { t: 'Stay at home', run(L) { return 'You watch the meeting on the local news. Tom Windle says a word they have to bleep.'; } },
      ],
    },
    {
      id: 'anRemember', icon: '🍺', title: (L) => (how(L) === 'home' ? 'When you were young' : 'When you first came'), when: (L) => L.s.age >= 52 && memory(L) != null && !L.s.gaol,
      ctx: (L) => memory(L),
      text: (L, x) => `At the Gull, a young ${L.pick(['fisherman', 'nurse from St Wren’s', 'teacher', 'woman from Lighthouse Labs', 'lad who works on the boats'])} asks what the town was like ${how(L) === 'home' ? 'when you were young' : 'when you first came'}. Before you know it you are telling them about ${x.h}, the year you were ${x.a}.`,
      opts: [
        { t: 'Tell it as it was', run(L) { L.joy(4); L.gain('charm', 0.5); return 'They listen to the end, and buy you a drink, and ask what happened next. It is a long time since anybody asked.'; } },
        { t: 'Tell it a bit bigger than it was', check: ['charm', 40], run(L, x, win) { L.joy(win ? 5 : 2); return win ? 'By the end there are six of them listening, and the story has a shark in it. It did not, at the time. It does now.' : 'Somebody at the bar who was there says it was not like that at all. You agree to differ, loudly.'; } },
        { t: 'Say it was all much the same', run(L) { L.joy(1); return 'It was not, though. You think about it all the way home.'; } },
      ],
    },
    {
      id: 'anSchool', icon: '🏫', title: 'The history project', when: (L) => L.s.age >= 64 && L.s.annals.yr.filter((y) => y.h).length >= 25,
      text: (L) => `The primary school is doing a project on "Our Town in Living Memory", and the teacher wonders if you would come in and talk to the children about what Starling Bay was like ${Math.round((L.s.annals.yr.filter((y) => y.h).length) / 10) * 10} years ago.`,
      opts: [
        { t: 'Go in and talk to them', check: ['charm', 40], run(L, x, win) { L.joy(win ? 6 : 3); L.karma(2); return win ? 'Thirty children, cross-legged on the floor. They want to know about the storms, and whether there were cars, and if you knew any pirates. You say you are not allowed to say.' : 'A child asks if you knew the dinosaurs. You answer as honestly as you can.'; } },
        { t: 'Lend your photographs to the library archive', run(L) { L.karma(3); if (L.folkWarm && L.folk('achterberg').met != null) L.folkWarm('achterberg', 4); return 'Miss Achterberg takes your shoebox of photographs as if it were the Domesday Book, and gives you a receipt.'; } },
        { t: 'Say you do not remember much', run(L) { return 'It is not true. You remember all of it.'; } },
      ],
    },
    {
      // (Fifty years since the train brought you, at eighteen: not for one who has lived here all along; see chapHow in chapters.js.)
      id: 'anFifty', icon: '🗞️', title: 'Fifty years in the Bay', when: (L) => L.s.annals.from === 0 && how(L) !== 'home' && L.s.age >= 68 && !L.s.gaol,
      text: (L) => `The Gazette has noticed that ${how(L) === 'back' ? 'you came home to Starling Bay, where you were born,' : 'you stepped off the train at Starling Bay'} fifty years ago this spring, with one suitcase. They would like to do a piece: "Fifty Years in the Bay". There will be a photographer, and they would like you to hold the suitcase, if you still have it.`,
      opts: [
        { t: 'Tell them everything', run(L) { L.fame(2); L.joy(5); return 'Two pages, and a photograph of you on the platform where you got off. People you have never met stop you on the High Street to say they read it.'; } },
        { t: 'Be modest about it', run(L) { L.karma(2); L.joy(3); return 'A short piece, mostly about the town. It is the right length.'; } },
        { t: 'Decline', run() { return 'Fifty years, you say, is nobody’s business but your own. They print a small paragraph anyway.'; } },
      ],
    },
    {
      id: 'anPlay', icon: '🎭', title: 'The school play', when: (L) => !!ev(L, 'storm') && L.kids().some((k) => k.age >= 6 && k.age <= 12),
      ctx: (L) => L.pick(L.kids().filter((k) => k.age >= 6 && k.age <= 12)).id,
      text: (L, x) => `The school is putting on a play about the great storm, and ${L.person(x) ? L.person(x).name.split(' ')[0] : 'your child'} has been cast as the pier. There is a costume to be made out of cardboard, by Thursday, and a performance on Friday at two.`,
      opts: [
        { t: 'Make the costume, and go', run(L, x) { const p = L.person(x); if (p) L.bond(p, 8); L.gain('craft', 1); L.joy(5); L.s.time = Math.max(0, L.s.time - 1); return 'The pier collapses magnificently in the second act, on cue, and gets the biggest cheer of the afternoon.'; } },
        { t: 'Buy a costume, and go', cost: 60, run(L, x) { const p = L.person(x); if (p) L.bond(p, 5); L.joy(4); return 'The shop has no piers. It has a lighthouse. The play is rewritten round it, and is the better for it.'; } },
        { t: 'Miss it for work', run(L, x) { const p = L.person(x); if (p) L.bond(p, -6); if (L.s.job) L.s.job.perf = clamp(L.s.job.perf + 2, 0, 100); return 'You hear it went well. You hear it twice, and the second time it is not about the play.'; } },
      ],
    },
  ];
  for (const e of ERA) e.ok = (L) => !L.s.gaol && (!e.when || e.when(L));

  // (Helpers for the cards above.)
  function myPlats(L) {
    const r = L.annalsRace(), used = new Set(r ? r.c.filter((c) => c.k !== 'you').map((c) => c.plat) : []);
    return Object.keys(PLATS).filter((p) => p !== 'steady' && !used.has(p) && (!PLATS[p].ok || PLATS[p].ok(L))).sort((a, b) => base(L, b) - base(L, a)).slice(0, 3);
  }
  function give(L, to, n) { const an = L.s.annals; an.gave[to] = (an.gave[to] || 0) + n; L.s.n.given = (L.s.n.given || 0) + n; if (to === 'pier') { const e = ev(L, 'storm'); e.trust += n; e.due = Math.max(L.s.t + 2, e.due - Math.floor(n / 2500)); } if (n) L.karma(n >= 1000 ? 2 : 0.5); }
  function ribbon(L, what) { const an = L.s.annals; an.n.ribbon = an.n.ribbon ? an.n.ribbon : what; L.note(`Cut the ribbon to open ${what}.`, 'big'); }
  // Somebody the town would put in front of royalty.
  function picked(L) { const s = L.s; return s.karma >= 30 || s.fame >= 30 || L.annalsMayor().k === 'you' || Object.keys(s.gave).length > 0 || (s.annals.gave.pier || 0) >= 1000; }
  // A year worth telling the young about.
  function memory(L) {
    const s = L.s, an = s.annals, out = [];
    for (const [id, e] of Object.entries(an.ev)) if (LIVED[id] && e.t >= 0 && s.t - e.t >= 40) out.push({ a: s.age - Math.floor((s.t - e.t) / 4), h: typeof LIVED[id] === 'function' ? LIVED[id](L) : LIVED[id] });
    for (const id of ['lido', 'bypass', 'barrier']) if (an.built[id] != null && s.t - an.built[id] >= 40) out.push({ a: s.age - Math.floor((s.t - an.built[id]) / 4), h: LIVED[id] });
    return out.length ? out[L.int(0, out.length - 1)] : null;
  }
  // What came of your vote last time, for polling day.
  function last(L) {
    const an = L.s.annals, v = an.myVote;
    if (!v) return '';
    if (!v.won) return ` Last time your vote went to ${v.n}, who lost.`;
    const what = said(v.p), was = ` Last time you voted for ${v.n}`;
    if (v.p === 'steady') return `${was}, and things stayed much as they were.`;
    if (an.plan.some((w) => w.p === v.p)) return `${was}, and ${what} is on its way, they say.`;
    if ((an.dropped || {})[v.p] >= v.t) return `${was}, and ${what} came to nothing.`;
    return an.built[v.p] != null ? `${was}, and got ${what}.` : `${was}, and got more or less what was promised.`;
  }

  for (const c of CARDS) c.w = 0;
  for (const e of ERA) e.w = 0;
  addEvents([...CARDS, ...ERA]);

  // ---- trophies ----
  Object.assign(TROPHIES, {
    anVoter: { name: 'Every vote counts', icon: '🗳️', desc: 'Vote in six elections for mayor.', test: (L) => !!L.s.annals && (L.s.annals.n.votes || 0) >= 6 },
    anMaker: { name: 'Kingmaker', icon: '🎗️', desc: 'Campaign for the winner at three elections.', test: (L) => !!L.s.annals && (L.s.annals.n.backed || 0) >= 3 },
    anRibbon: { name: 'Cut the ribbon', icon: '✂️', desc: 'Open something you helped the town pay for.', test: (L) => !!L.s.annals && !!L.s.annals.n.ribbon },
    anAlbum: { name: 'Fifty years in the Bay', icon: '🗂️', desc: 'Live fifty years in Starling Bay.', test: (L) => !!L.s.annals && L.s.annals.yr.length >= 50 },
  });
}
