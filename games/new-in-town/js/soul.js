// New in Town: who you become, St Brigid's, and the ups and downs of the mind.
//
// Character: everything you do is counted towards a leaning (the hooks
// acted and chose see every action and every card). A leaning that is kept
// up for a year or two becomes a trait: Bookish, Night owl, Grafter... At
// most three at once; one you stop living up to fades. Each does a little
// something (to your mood, your time, your odds, your money, how people
// take to you) and opens extra choices on some cards.
//
// St Brigid's: the Sunday service, the soup run and the jumble sale, the
// bells, the harvest supper and the carols, and the vicar, the Reverend
// Alice Hollis. Life's big days follow the cards that already bring them
// (the chose hook): a church wedding, a christening, and a funeral with a
// eulogy you choose, and a grave in the churchyard to visit afterwards.
//
// The mind: a long stretch of very low mood may become a low spell, and a
// long run of overwork may end in burnout. Either takes time and spirits
// until it lifts, which time does slowly and people, exercise, the vicar
// and a counsellor do faster.
//
// Everything is kept in s.soul.

import { TROPHIES, CAREERS, money } from './data.js';

// ---- the traits ------------------------------------------------------------------------

// word: how the Gazette says it. known: what it says of someone who was it (He, he, his, him).
// hint: how a leaning shows before it has a name. does: what it does, said plainly.
export const CHARACTER = {
  bookish: { name: 'Bookish', icon: '📚', word: 'bookish', blurb: 'Never without something to read, and usually two.', does: 'Studying and reading teach you a little more.', hint: 'You have had your nose in a book a good deal lately.', known: (p) => `${p.He} read everything, including the small print, and the reading room has kept ${p.his} chair.` },
  sporty: { name: 'Sporty', icon: '🏃', word: 'sporty', blurb: 'Restless unless you have been out in the wind today.', does: 'Exercise lifts your mood, and the years are kinder to your body.', hint: 'Your trainers are wearing out faster than they used to.', known: (p) => `${p.He} was out on the cliff path most mornings, whatever the weather.` },
  nightowl: { name: 'Night owl', icon: '🦉', word: 'a night owl', blurb: 'You come alive after dark, and are no use at all before ten.', does: 'An extra block of time in the long winter evenings, though late nights cost a little health.', hint: 'You know the last bus home by heart.', known: (p) => `${p.He} was seldom seen before ten in the morning, and seldom missed last orders.` },
  kind: { name: 'Kind-hearted', icon: '💗', word: 'kind-hearted', blurb: 'You notice who needs a hand, and give it.', does: 'Friends drift away more slowly, and doing good does you good.', hint: 'People keep thanking you in the street.', known: (p) => `Half the town has a story about something ${p.he} did for them and never mentioned.` },
  hothead: { name: 'Hothead', icon: '🌶️', word: 'quick-tempered', blurb: 'Quick to boil, slow to cool, and everybody knows it.', does: 'Enemies would rather not cross you, so their grudges cool faster; but friends drift away a little faster too.', hint: 'Your fuse seems to be getting shorter.', known: (p) => `${p.He} had a famous temper, and nobody who saw it has forgotten.` },
  thrifty: { name: 'Thrifty', icon: '🪙', word: 'careful with money', blurb: 'A penny saved is a penny you can find again later.', does: 'Careful housekeeping takes a little off your food and bills.', hint: 'You have started saving the string off parcels.', known: (p) => `${p.He} never paid full price for anything, and was proud of it.` },
  spender: { name: 'Big spender', icon: '💸', word: 'free with money', blurb: 'Money is for spending, and you are very good at it.', does: 'Treats lift you more, and life feels good; little luxuries cost $250 a season.', hint: 'The shop assistants on the High Street know you by name.', known: (p) => `${p.He} never saw the point of money in the bank, and the High Street will miss ${p.him}.` },
  daredevil: { name: 'Daredevil', icon: '🪂', word: 'fearless', blurb: 'Tell you not to, and you will.', does: 'Fortune favours you: slightly better odds whenever you take a chance, and the thrill of it.', hint: 'You keep taking chances, and some of them come off.', known: (p) => `${p.He} would try anything once, and most things twice.` },
  homebody: { name: 'Homebody', icon: '🏡', word: 'a homebody', blurb: 'The best place in the world is your own armchair.', does: 'Home lifts your mood, and resting does you more good.', hint: 'Your slippers are getting a lot of wear.', known: (p) => `${p.He} was happiest at home, with the door shut and the kettle on.` },
  charmer: { name: 'Charmer', icon: '😏', word: 'charming', blurb: 'Strangers tell you their life stories at bus stops.', does: 'Everything you do with someone brings you a little closer.', hint: 'You seem to know everybody in the Gull.', known: (p) => `${p.He} could talk to anybody, and usually did.` },
  grafter: { name: 'Grafter', icon: '🛠️', word: 'a grafter', blurb: 'Give you a job and it gets done, and then some.', does: 'The boss notices every shift, but you find it hard to switch off.', hint: 'You have not had a proper weekend in a while.', known: (p) => `${p.He} was first in and last out for most of ${p.his} working life.` },
  idler: { name: 'Idler', icon: '🛋️', word: 'in no hurry about anything', blurb: 'Why run, when you could stroll?', does: 'Nothing much gets you down, but the boss notices how little you do.', hint: 'There is a dip in the sofa the exact shape of you.', known: (p) => `${p.He} never once hurried, and saw no reason to start.` },
  romantic: { name: 'Romantic', icon: '🌹', word: 'a romantic', blurb: 'Candles, poems, and flowers on a Tuesday.', does: 'Your sweetheart never feels taken for granted.', hint: 'You catch yourself humming love songs.', known: (p) => `${p.He} kept every letter ${p.he} was ever sent.` },
  loner: { name: 'Loner', icon: '🌫️', word: 'a private soul', blurb: 'Your own company suits you down to the ground.', does: 'Being on your own does not get you down, and quiet pursuits lift you.', hint: 'You have been keeping yourself to yourself.', known: (p) => `${p.He} kept ${p.his} own counsel, and walked the cliffs alone.` },
  joker: { name: 'Joker', icon: '🃏', word: 'a joker', blurb: 'Life is serious. You are not.', does: 'When a gamble goes wrong, you laugh it off.', hint: 'People have started grinning when they see you coming.', known: (p) => `${p.He} could make a room laugh, usually when it least expected to.` },
  churchgoer: { name: 'Churchgoer', icon: '⛪', word: 'a faithful churchgoer', blurb: 'Sunday mornings at St Brigid’s steady the week.', does: 'A little more peace, and dark spells lift sooner.', hint: 'The Reverend Hollis has started saving you a hymn book.', known: (p, L) => (L && L.s.clubs && (L.s.clubs.m.choir || L.s.clubs.past.choir) ? `${p.He} sang in the choir at St Brigid’s most Sundays for years, and could be heard from the lychgate.` : `${p.He} was in the third pew at St Brigid’s most Sundays, and sang louder than the choir.`) },
};
const IDS = Object.keys(CHARACTER);
// Two that cannot be held at once: the stronger wins.
const OPPOSITE = { thrifty: 'spender', spender: 'thrifty', grafter: 'idler', idler: 'grafter', homebody: 'nightowl', nightowl: 'homebody', charmer: 'loner', loner: 'charmer' };
// A leaning becomes a trait at GAIN and fades below FADE; each season it slips back a little.
export const GAIN = 60;
// (PACE: how much each deed counts. Two related things a season make a trait in two or three years; one a season never quite does.)
const FADE = 28, MOST = 3, DECAY = 0.92, PACE = 1.6;
// Someone who is like you takes to you faster (the people's own traits, in data.js).
const LIKE = { bookish: 'bookish', sporty: 'sporty', joker: 'witty', kind: 'kind' };

// What each thing you do says about you.
export const DEEDS = {
  library: { bookish: 3 }, readingRoom: { bookish: 3 }, tutor: { bookish: 2 }, class: { bookish: 3 }, revise: { bookish: 2 }, exam: { bookish: 1 }, cheat: { daredevil: 2 },
  hack: { bookish: 2, nightowl: 1 }, novel: { bookish: 2, homebody: 1 }, freelance: { grafter: 2, bookish: 1 }, gLib: { bookish: 2 }, gStudy: { bookish: 3 }, quiz: { bookish: 2, nightowl: 1 },
  workout: { sporty: 3 }, trainer: { sporty: 3 }, jog: { sporty: 3 }, weights: { sporty: 3, homebody: 1 }, yoga: { sporty: 2 }, race: { sporty: 3 }, surf: { sporty: 2, daredevil: 2 },
  cliffWalk: { sporty: 2 }, seaSwim: { sporty: 2, daredevil: 1 }, gYard: { sporty: 2 }, dogwalk: { sporty: 1, homebody: 1 }, watchRovers: { sporty: 1, charmer: 1 },
  binge: { nightowl: 3, spender: 1 }, round: { nightowl: 2, charmer: 2, spender: 2 }, chat: { nightowl: 1, charmer: 2 }, chatup: { nightowl: 2, charmer: 2, romantic: 1 }, openmic: { nightowl: 2, joker: 2 },
  fling: { nightowl: 2, daredevil: 1 }, seeShow: { nightowl: 2, spender: 1 }, drinks: { nightowl: 2, charmer: 1 }, cabinet: { nightowl: 1 }, dust: { nightowl: 2, daredevil: 2 },
  volunteer: { kind: 3 }, litter: { kind: 2 }, blood: { kind: 3 }, give100: { kind: 1 }, give1000: { kind: 2 }, give10000: { kind: 3 }, give100000: { kind: 4 }, fund: { kind: 4 },
  brawl: { hothead: 4, nightowl: 1 }, thump: { hothead: 4 }, prank: { hothead: 2, joker: 2 }, rumour: { hothead: 2 }, chirpTroll: { hothead: 3 }, lean: { hothead: 2 }, gFight: { hothead: 3 },
  wrestle: { hothead: 1, daredevil: 1 }, bout0: { hothead: 2, daredevil: 2 }, bout1: { hothead: 2, daredevil: 2 }, bout2: { hothead: 2, daredevil: 3 },
  cook: { thrifty: 1.5, homebody: 2 }, deposit: { thrifty: 1 }, repay: { thrifty: 1 }, repayStudent: { thrifty: 1 }, haggle: { thrifty: 2 }, comb: { thrifty: 1 }, farmGate: { homebody: 1 },
  buy: { spender: 2 }, trip: { spender: 2 }, party: { spender: 1, charmer: 2, homebody: 1, nightowl: 1 }, restyle: { spender: 1 }, curioBuy: { spender: 1 },
  slots: { daredevil: 0.5 }, hiloStart: { daredevil: 0.5 }, bjStart: { daredevil: 0.5 }, raceBet: { daredevil: 0.5 }, lotto: { daredevil: 0.3 }, pitch: { daredevil: 4 }, mayor: { daredevil: 1, charmer: 1 },
  // (heistsGo: the night of a job planned in heists.js, which took the place of the one-tap bank job.)
  heistsGo: { daredevil: 5 }, burgle0: { daredevil: 2 }, burgle1: { daredevil: 2 }, burgle2: { daredevil: 3 }, twoc: { daredevil: 2 }, smuggle: { daredevil: 2, nightowl: 1 }, torch: { daredevil: 2 }, lift: { daredevil: 1 }, dip: { daredevil: 1 },
  gBreak: { daredevil: 4 }, gDig: { daredevil: 1 }, sail: { daredevil: 1 },
  rest: { homebody: 1, idler: 1 }, practise: { homebody: 1 }, kid: { homebody: 2 }, tend: { homebody: 1 }, sow: { homebody: 1 }, reap: { homebody: 1 }, bench: { idler: 1 }, gCoast: { idler: 3 },
  work: { grafter: 2 }, workHard: { grafter: 4 }, workEasy: { idler: 4 }, workPlay: { grafter: 2 }, bizWork: { grafter: 3 }, crates: { grafter: 3, sporty: 1 }, sideline: { grafter: 2 },
  odd0: { grafter: 1.5 }, odd1: { grafter: 1.5 }, odd2: { grafter: 1.5 }, gWork: { grafter: 2 },
  askout: { romantic: 2, charmer: 1 }, movein: { romantic: 2 }, propose: { romantic: 4 }, match: { romantic: 1 }, winback: { romantic: 2 }, mend: { kind: 3 }, forget: { loner: 3 },
  fest00: { homebody: 1 }, fest01: { sporty: 2 }, fest02: { kind: 2, charmer: 1 }, fest10: { sporty: 2 }, fest12: { charmer: 2 }, fest20: { bookish: 2 }, fest21: { sporty: 1, joker: 1 },
  fest22: { kind: 1, charmer: 1 }, fest30: { churchgoer: 1 }, fest31: { daredevil: 2, sporty: 1 }, fest32: { joker: 3, charmer: 1 },
  // (A night with one of the clubs says something too: see CLUB_LEAN for what years of them say.)
  clubNight_choir: { churchgoer: 1.5 }, clubNight_players: { charmer: 1.5 }, clubNight_rovers: { sporty: 1.5 }, clubNight_book: { bookish: 1.5 }, clubNight_sailing: { sporty: 1, daredevil: 0.5 }, clubNight_quiz: { bookish: 1, nightowl: 1 },
  pew: { churchgoer: 2, loner: 1 }, soulService: { churchgoer: 4 }, soulCarols: { churchgoer: 3 }, soulSupper: { churchgoer: 3, charmer: 1 }, soulSoup: { churchgoer: 2, kind: 3 },
  soulVisit: { churchgoer: 2, kind: 3 }, soulJumble: { churchgoer: 2, kind: 1, thrifty: 1 }, soulRoofGive: { churchgoer: 1, kind: 2 }, soulVicar: { churchgoer: 2 }, soulBells: { churchgoer: 3 }, soulGrave: { churchgoer: 1 },
};
const CHIRP_DEEDS = { joke: { joker: 2 }, take: { hothead: 1.5 }, selfie: { sporty: 1 }, dinner: { homebody: 1 } };
const OUTING_DEEDS = { pub: { nightowl: 1.5 }, walk: { sporty: 1 }, talk: { bookish: 1 }, dinner: { spender: 1 }, dance: { romantic: 0.5 }, film: { nightowl: 0.5 } };
// What some of the town's cards say about you, by the option taken.
const CARD_DEEDS = { date: [{ romantic: 2 }, { romantic: 2 }, { romantic: 2 }], wedding: [{ romantic: 3 }, { romantic: 3 }, { romantic: 3, spender: 2 }], anniv: [{ romantic: 2, spender: 1 }, { romantic: 2 }], row: [{ kind: 1 }, { hothead: 2 }, { hothead: 1 }], gull: [null, { joker: 3 }], surprise: [{ charmer: 1 }] };

// Kinds of things, for the rest of the rules.
const set = (s) => new Set(s.split(' '));
const STUDY = set('library readingRoom tutor class revise gLib gStudy hack');
const MOVE = set('workout trainer jog weights yoga race surf cliffWalk seaSwim gYard dogwalk');
const GOOD = set('volunteer litter blood soulSoup soulVisit soulJumble soulRoofGive give100 give1000 give10000 give100000 fund');
const TREATS = set('buy trip round party seeShow restyle curioBuy');
const SOLO = set('readingRoom library cliffWalk fish fishBoat comb paint pew bench sail novel jog soulGrave practise seaSwim');
const SOCIAL = set('chat round chatup party drinks quiz soulSupper match askout watchRovers seeShow');
const NIGHTS = set('binge round chat chatup quiz openmic fling brawl seeShow drinks dust hack cabinet');
const LUXURY = set('buy trip round party seeShow restyle curioBuy out binge dust slots hiloStart bjStart raceBet lotto farmGate watchRovers chatup chat cabinet');
const SHIFTS = set('work workHard workEasy workPlay');
const WORK_BLOCKS = { work: 2, workHard: 2, workEasy: 2, workPlay: 2, bizWork: 2, crates: 2, freelance: 2, sideline: 2, errand: 2, odd0: 1, odd1: 1, odd2: 1 };
// What helps a low spell or burnout, once a season each: [for a low spell, for burnout].
const HELP = { talk: [1, 1], vicar: [1.5, 1], move: [1, 0.5], care: [2, 2], quiet: [0.5, 0.5], rest: [0.25, 0.75], away: [1, 2] };
const HELPS = { soulVicar: 'vicar', therapy: 'care', gDoc: 'care', rest: 'rest', trip: 'away', gLetters: 'talk', soulService: 'quiet', soulCarols: 'quiet', pew: 'quiet', soulGrave: 'quiet', bench: 'quiet', sail: 'quiet', soulBells: 'quiet', soulVisit: 'quiet', soulSoup: 'quiet' };
const HELP_SAID = { talk: 'someone close', vicar: 'the Reverend Hollis', move: 'fresh air and exercise', care: 'the counsellor at St Wren’s', quiet: 'quiet hours', rest: 'rest', away: 'getting away' };
const CLOSE = ['friend', 'partner', 'spouse', 'parent', 'sibling', 'child', 'grandchild'];
const KIN = ['partner', 'spouse', 'parent', 'sibling', 'child', 'grandchild'];
// Someone you could pour your heart out to (not a toddler).
const confidant = (p) => CLOSE.includes(p.kind) && p.bond >= 30 && ((p.kind !== 'child' && p.kind !== 'grandchild') || p.age >= 16);
// Deaths the town's cards bring, and how hard each is felt.
const DEATHS = { parentDies: 5, spouseDies: 8, sibDies: 4 };
const GRIEF = { parent: 5, spouse: 8, partner: 8, sibling: 4, friend: 3 };
export const ROOF = 15000;
const DEPTH = { low: 8, burn: 6 };
// How much strain it takes: a season with no time spare at all is 2.5 (working a fourth shift, 2 more), so most of two years of it.
const BURN = 16;

// ---- the pieces ------------------------------------------------------------------------

const he = (p) => (p.sex === 'm' ? 'he' : 'she');
const him = (p) => (p.sex === 'm' ? 'him' : 'her');
const his = (p) => (p.sex === 'm' ? 'his' : 'her');
const cap = (t) => t[0].toUpperCase() + t.slice(1);
const P = (L, id) => L.person(id) || { name: 'Someone', sex: 'm', bond: 0, age: 30, kind: 'friend' };
const worthNow = (s) => s.cash + s.bank - s.debt - s.sloan - (s.shark || 0);
const fresh = () => ({ wb: 0, hard: 0, easy: 0, fumes: 0, soc: 0, sol: 0, nights: 0, home: 0, spent: 0, away: 0, help: {} });

function blank(L) {
  const s = L.s;
  return {
    lean: Object.fromEntries(IDS.map((id) => [id, 0])), has: {}, ever: {},
    ss: fresh(), m: worthNow(s), k: s.karma,
    parish: 0, roof: 0, grief: 0, graves: [], dying: {}, days: [],
    bells: { best: 0 }, n: { service: 0, vol: 0, bells: 0, visits: 0, through: 0, words: 0 },
    mind: { run: 0, strain: 0, spell: null, last: -99, spare: 2 }, banns: null, f: {},
  };
}

// ---- long commitments ----
// What years in each club say about you.
const CLUB_LEAN = { choir: { churchgoer: 1 }, players: { charmer: 1 }, rovers: { sporty: 1 }, book: { bookish: 1 }, sailing: { sporty: 0.7, daredevil: 0.4 }, quiz: { bookish: 0.7, nightowl: 0.5 } };
// How much a season of a long commitment counts, at full weight (before PACE).
const LONG = 4;
// Everything you might be committed to, and whether you are this season: [key, kept up, what it says].
function commitments(L, cm) {
  const s = L.s, S = s.soul, out = [], c = s.clubs;
  for (const [id, o] of Object.entries(CLUB_LEAN)) { const m = c && c.m && c.m[id]; out.push([`club:${id}`, !!m && m.last != null && s.t - m.last <= 1, o]); }
  out.push(['crew', !!s.job && !!CAREERS[s.job.c] && !!CAREERS[s.job.c].shady, { daredevil: 1, nightowl: 0.5 }]);
  // (A life of crime: a crime in the last year, kept up year after year.)
  const crimes = s.n.crimes || 0;
  if (crimes > (cm.$crimes ?? crimes)) cm.$crimeT = s.t;
  cm.$crimes = crimes;
  out.push(['crime', cm.$crimeT != null && s.t - cm.$crimeT <= 3, { daredevil: 1 }]);
  out.push(['drink', ((s.habit && s.habit.drink) || 0) >= 25, { nightowl: 1 }]);
  out.push(['dust', ((s.habit && s.habit.dust) || 0) >= 25, { nightowl: 0.6, daredevil: 0.6 }]);
  out.push(['tables', !!s.flutter && s.flutter.h >= 25, { daredevil: 1, spender: 0.4 }]);
  // (Sunday by Sunday: a service this season.)
  const svc = S.n.service || 0;
  out.push(['church', svc > (cm.$svc ?? svc), { churchgoer: 1 }]);
  cm.$svc = svc;
  return out;
}

// Adds what a deed says to your leanings.
function deed(L, o, k = 1) {
  if (!o) return;
  const lean = L.s.soul.lean;
  for (const [id, v] of Object.entries(o)) lean[id] = Math.min(100, Math.max(0, (lean[id] || 0) + v * k * PACE));
}
const has = (L, id) => !!L.s.soul && L.s.soul.has[id] != null;
const help = (L, kind) => {
  const S = L.s.soul, sp = S.mind.spell;
  if (sp) S.ss.help[kind] = HELP[kind][sp.k === 'low' ? 0 : 1];
};
const parish = (L, n) => { const S = L.s.soul; S.parish = Math.min(100, Math.max(0, S.parish + n)); };

// A grave in the churchyard, the grief that goes with it, and the funeral to come.
function mourn(L, info) {
  const s = L.s, S = s.soul;
  const g = { name: info.name, kind: info.kind, sex: info.sex, age: info.age, t: s.t, said: null, visits: 0 };
  S.graves.push(g);
  if (S.graves.length > 24) S.graves.shift();
  const hurt = (GRIEF[info.kind] || 3) * Math.min(1.4, Math.max(0.5, 0.5 + (info.bond || 40) / 100));
  S.grief = Math.min(10, Math.max(S.grief, hurt) + Math.min(S.grief, hurt) * 0.3);
  // (Straight after the card that brought it, before anything else the season has dealt.)
  if (!s.gaol && !s.dead) s.pend.unshift({ id: 'soulFuneral', x: { ...info, g: S.graves.length - 1 } });
}
const aboutOf = (p) => ({ name: p.name, kind: p.kind, sex: p.sex, age: p.age, bond: p.bond });

// Everyone who would feel a eulogy: the family, and friends.
function moved(L, kin, friends) {
  for (const p of L.s.people) {
    if (KIN.includes(p.kind)) L.bond(p, kin);
    else if (p.kind === 'friend') L.bond(p, friends);
  }
}

// The one you would ask to stand godparent: your oldest friend, or family.
function godparent(L) {
  const l = L.s.people.filter((p) => p.kind === 'friend' || p.kind === 'sibling').sort((a, b) => b.bond - a.bond);
  return l[0] || null;
}

// What the Gazette says, in its own words.
function pron(s) { const m = s.sex !== 'f'; return { He: m ? 'He' : 'She', he: m ? 'he' : 'she', his: m ? 'his' : 'her', him: m ? 'him' : 'her' }; }
const list = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);

// ---- install ---------------------------------------------------------------------------

export function install({ def, A, Life, clamp, val, hooks, addEvents }) {
  Object.assign(Life.prototype, {
    soulHas(id) { return has(this, id); },
    // The traits you have, oldest first.
    soulTraits() { const h = this.s.soul.has; return Object.keys(h).sort((a, b) => h[a] - h[b]); },
    // What is taking shape: leanings that are not traits yet, strongest first.
    soulShaping(n = 2) {
      const S = this.s.soul;
      return IDS.filter((id) => S.has[id] == null && S.lean[id] >= 22 && !(OPPOSITE[id] && S.has[OPPOSITE[id]] != null && S.lean[OPPOSITE[id]] >= S.lean[id])).sort((a, b) => S.lean[b] - S.lean[a]).slice(0, n);
    },
    soulLean(id) { return this.s.soul.lean[id] || 0; },
    soulSpell() { return this.s.soul.mind.spell; },
    soulParishWord() { const p = this.s.soul.parish; return p >= 75 ? 'A pillar of the parish' : p >= 45 ? 'One of the regulars' : p >= 20 ? 'A familiar face' : p > 0 ? 'A new face in the pews' : 'A stranger to the place'; },
    // The bell band will have you once you have been to practice a few times.
    soulRinger() { return this.s.soul.n.bells >= 4; },
    soulRoofDone() { return !!this.s.soul.f.roof; },
    // How someone in the churchyard was to you.
    soulRelation(g) {
      const m = g.sex === 'm';
      return { parent: m ? 'your father' : 'your mother', spouse: m ? 'your husband' : 'your wife', partner: 'your sweetheart', sibling: m ? 'your brother' : 'your sister', friend: 'your friend' }[g.kind] || 'an old friend';
    },
    // What was said at the funeral.
    soulSaid(g) {
      return { laugh: 'You made the church laugh at the funeral.', laughed: 'You tried to make them laugh at the funeral, and nearly did.', plain: 'You said plainly what they meant to you.', read: 'You read a poem at the funeral.', vicar: 'The Reverend Hollis spoke for you.', joke: 'You sent them off laughing, as they asked.', book: 'You read from the book they loved.', letters: 'You read from your old letters.', thanks: 'You thanked everyone who sat with them at the end.', row: 'You told the family a few home truths at the funeral.', hymns: 'You chose the hymns, and led the singing.' }[g.said] || 'You were not there to say goodbye.';
    },
    // Rows for some of these actions, in a sheet of their own (the ones that apply just now).
    soulRows(ids) { return ids.filter((id) => A[id] && (!A[id].show || A[id].show(this))).map((id) => this.view(A[id])); },
  });

  // ---- remembering what you do ----

  hooks.load.push((L) => {
    const s = L.s;
    if (!s.soul) s.soul = blank(L);
    const S = s.soul, b = blank(L);
    for (const [k, v] of Object.entries(b)) if (S[k] == null) S[k] = v;
    for (const id of IDS) if (S.lean[id] == null) S.lean[id] = 0;
    for (const k of Object.keys(b.n)) if (S.n[k] == null) S.n[k] = 0;
    for (const k of Object.keys(b.mind)) if (S.mind[k] === undefined) S.mind[k] = b.mind[k];
    for (const k of Object.keys(b.ss)) if (S.ss[k] == null) S.ss[k] = b.ss[k];
  });

  hooks.acted.push((L, id, p, y) => {
    const s = L.s, S = s.soul, ss = S.ss;
    // Money as it stood before: what went on treats is noticed.
    const m = worthNow(s), dm = m - S.m;
    S.m = m; S.k = s.karma;
    if (dm < 0 && LUXURY.has(id)) ss.spent += -dm;
    deed(L, DEEDS[id]);
    if (id === 'chirp') deed(L, CHIRP_DEEDS[y]);
    if (id === 'workPlay' && typeof y === 'number' && y >= 0.75) deed(L, { grafter: 1 });
    if (SHIFTS.has(id) && (s.use.work || 0) > 3) { deed(L, { grafter: 2 }); ss.fumes++; }
    // Time with people.
    const person = A[id] && A[id].who && p && typeof p === 'object' ? p : null;
    if (person) {
      ss.soc++;
      const love = person.kind === 'partner' || person.kind === 'spouse';
      if (id === 'out') { deed(L, OUTING_DEEDS[y && y.a]); deed(L, love ? { romantic: 2 } : person.kind === 'friend' ? { charmer: 1.5 } : { homebody: 0.5 }); }
      else if (id === 'gift') deed(L, love ? { romantic: 1.5 } : { kind: 0.5 });
      else if (id === 'call' || id === 'dayout') deed(L, { homebody: 0.5, kind: 0.5 });
      if (CLOSE.includes(person.kind) && ['out', 'call', 'dayout', 'kid', 'oldtimes'].includes(id)) help(L, 'talk');
      // People take to some of us faster.
      if (CLOSE.includes(person.kind) && L.s.people.includes(person)) {
        if (has(L, 'charmer')) L.bond(person, 1.5);
        if (Object.keys(S.has).some((t) => LIKE[t] && LIKE[t] === person.trait)) L.bond(person, 1);
      }
    }
    if (SOCIAL.has(id)) ss.soc++;
    if (SOLO.has(id)) ss.sol++;
    if (NIGHTS.has(id)) ss.nights++;
    if (A[id] && A[id].place === 'home') ss.home++;
    if (WORK_BLOCKS[id]) ss.wb += WORK_BLOCKS[id];
    if (id === 'workHard') ss.hard++;
    if (id === 'workEasy') ss.easy++;
    if (id === 'trip') ss.away++;
    // What helps.
    if (HELPS[id]) help(L, HELPS[id]);
    if (MOVE.has(id)) help(L, 'move');
    // What your traits do.
    if (has(L, 'bookish') && STUDY.has(id)) L.gain('smarts', 0.4);
    if (has(L, 'sporty') && MOVE.has(id)) L.joy(1);
    if (has(L, 'kind') && GOOD.has(id)) L.joy(1);
    if (has(L, 'spender') && TREATS.has(id)) L.joy(1.5);
    if (has(L, 'homebody') && id === 'rest') { L.hp(1); L.joy(1); }
    if (has(L, 'loner') && SOLO.has(id)) L.joy(1);
    if (SHIFTS.has(id) && s.job) {
      const d = (has(L, 'grafter') ? 1 : 0) - (has(L, 'idler') ? 1 : 0);
      if (d) { s.job.perf = clamp(s.job.perf + d, 0, 100); s.stand[s.job.c] = s.job.perf; }
    }
    // Burnt out, every shift takes more out of you.
    if (WORK_BLOCKS[id] && S.mind.spell && S.mind.spell.k === 'burn') L.hp(-1, 'overwork');
    S.m = worthNow(s); S.k = s.karma;
  });

  hooks.chose.push((L, id, x, i, win) => {
    const s = L.s, S = s.soul;
    const m = worthNow(s), dm = m - S.m, dk = s.karma - S.k;
    if (dm < 0) S.ss.spent += -dm * 0.5;
    if (dk > 0) deed(L, { kind: Math.min(4, dk * 0.7) });
    if (win !== null && win !== undefined) {
      deed(L, { daredevil: 1.2 });
      if (has(L, 'daredevil')) L.joy(1);
      if (win === false && has(L, 'joker')) L.joy(2);
    }
    const c = CARD_DEEDS[id];
    if (c && c[i]) deed(L, c[i]);
    // Life's big days, after the cards that bring them.
    if (DEATHS[id] && S.dying[x]) { const info = S.dying[x]; delete S.dying[x]; mourn(L, info); }
    if (id === 'baby' && !s.gaol) {
      const kid = L.kids().sort((a, b) => b.id - a.id)[0];
      if (kid) s.pend.unshift({ id: 'soulChristen', x: kid.id });
    }
    if (id === 'wedding') S.banns = null;
    S.m = worthNow(s); S.k = s.karma;
  });

  // ---- the turn of the season ----

  hooks.season.push((L, lines, jailed) => {
    const s = L.s, S = s.soul, ss = S.ss;
    // What this season said about you.
    if (!jailed) {
      if (s.time >= 3) deed(L, { idler: 2 });
      if (!s.job && !s.retired && !s.biz && s.age < 65) deed(L, { idler: 1.5 });
      if (ss.soc === 0) deed(L, { loner: ss.sol >= 2 ? 4 : 3 });
      else if (ss.soc >= 3) deed(L, { loner: -3, charmer: ss.soc >= 5 ? 1 : 0 });
      if (ss.nights === 0 && ss.home >= 3) deed(L, { homebody: 1.5 });
      if (ss.spent < 100) deed(L, { thrifty: s.cash + s.bank >= 5000 ? 2.5 : 2 });
      else if (ss.spent < 300) deed(L, { thrifty: 1 });
      deed(L, { spender: Math.min(6, ss.spent / 700) });
      if (s.food === 0) deed(L, { thrifty: 1.5 });
      if (s.food === 2) deed(L, { spender: 1.5 });
      // How hard you have been working: blocks of time left over, after the work was done.
      const spare = L.timeMax() - ss.wb;
      S.mind.spare = spare;
      S.mind.strain = clamp(S.mind.strain + (spare <= 0 ? 2.5 : spare === 1 ? 0.5 : spare === 2 ? -0.5 : spare === 3 ? -1.5 : -2.5) + ss.hard + ss.fumes * 2 - ss.easy * 0.5 - ss.away * 4, 0, 30);
    } else S.mind.strain = Math.max(0, S.mind.strain - 2);
    // What your traits do to your body, and to the people around you.
    if (has(L, 'sporty')) L.hp(0.5);
    if (has(L, 'nightowl')) L.hp(-0.5);
    for (const p of s.people) {
      if (p.kind === 'friend') L.bond(p, (has(L, 'kind') ? 0.5 : 0) - (has(L, 'hothead') ? 0.5 : 0));
      if (p.kind === 'enemy' && has(L, 'hothead') && p.grudge > 1) p.grudge = Math.max(1, p.grudge - 1.5);
      if ((p.kind === 'partner' || p.kind === 'spouse') && has(L, 'romantic')) L.bond(p, 1);
    }
    S.parish = Math.max(0, S.parish - 1);
    S.grief = Math.max(0, Math.round((S.grief - 1) * 100) / 100);
    // Long commitments say the most about you: years in the choir or on the Rovers' books, on Sal's
    // payroll, at the tables or in the bottle, Sunday after Sunday at St Brigid's. Each season one is
    // kept up it counts for more, the longer it has lasted (full weight after three years), so that a few
    // years of it bring the trait it speaks of. Let go, it is forgotten twice as fast as it was built.
    // (S.cm: seasons each has been kept up, and what is needed to tell.)
    const cm = S.cm || (S.cm = {});
    for (const [k, on, o] of commitments(L, cm)) {
      cm[k] = on ? (cm[k] || 0) + 1 : Math.max(0, (cm[k] || 0) - 2);
      if (on) deed(L, o, LONG * Math.min(1, 0.25 + cm[k] / 16));
      if (!cm[k]) delete cm[k];
    }
    settle(L);
  });

  hooks.late.push((L, jailed) => {
    const s = L.s, S = s.soul, mind = S.mind, sp = mind.spell;
    // The mind.
    if (sp) {
      let d = sp.k === 'low' ? 1 : 0.5 + (mind.spare >= 3 ? 1 : mind.spare === 2 ? 0.5 : mind.spare === 1 ? 0 : -1);
      if (has(L, 'churchgoer')) d += 0.5;
      const helped = Math.min(4, Object.values(S.ss.help).reduce((a, n) => a + n, 0));
      for (const [k, n] of Object.entries(S.ss.help)) sp.by[k] = (sp.by[k] || 0) + n;
      sp.depth = clamp(Math.round((sp.depth - d - helped) * 100) / 100, 0, 10);
      if (sp.depth <= 0) {
        const top = Object.keys(sp.by).sort((a, b) => sp.by[b] - sp.by[a])[0] || null;
        mind.spell = null; mind.last = s.t; mind.run = 0; mind.strain = Math.min(mind.strain, 4);
        L.queue('soulLift', { k: sp.k, top });
      }
      else if (sp.k === 'low' && !jailed && L.chance(0.3)) {
        const p = L.s.people.filter((q) => (q.kind === 'friend' || q.kind === 'partner' || q.kind === 'spouse' || q.kind === 'sibling') && q.bond >= 40);
        if (p.length) L.queue('soulConfide', L.pick(p).id);
      }
    } else if (!jailed) {
      if (s.happy < 25) mind.run++;
      else if (s.happy < 32) mind.run += 0.5;
      else if (s.happy >= 38) mind.run = 0;
      if (mind.run >= 3 && s.t - mind.last >= 12 && L.chance(has(L, 'churchgoer') ? 0.3 : 0.5)) {
        mind.spell = { k: 'low', at: s.t, depth: DEPTH.low, by: {} };
        L.note('A low spell set in.');
        L.queue('soulLow');
      } else if (mind.strain >= BURN && s.happy < 55 && s.t - mind.last >= 8 && L.chance(has(L, 'grafter') ? 0.4 : 0.3)) {
        mind.spell = { k: 'burn', at: s.t, depth: DEPTH.burn, by: {} };
        L.note('Burnt out, after working flat out for too long.');
        L.queue('soulBurn');
      }
    }
    // Who is about to be mourned (the cards that bring a death take the person away with them).
    S.dying = {};
    for (const q of s.pend) if (DEATHS[q.id] && typeof q.x === 'number') { const p = L.person(q.x); if (p) S.dying[q.x] = aboutOf(p); }
    // A wedding coming up: the Reverend Hollis asks first.
    const w = s.pend.findIndex((q) => q.id === 'wedding');
    if (w >= 0 && S.banns !== s.pend[w].x && !jailed) { S.banns = s.pend[w].x; s.pend.splice(w, 0, { id: 'soulBanns', x: s.pend[w].x }); }
    S.ss = fresh();
    S.m = worthNow(s); S.k = s.karma;
  });

  // Old friends go too, in time.
  hooks.year.push((L) => {
    const s = L.s;
    if (s.pend.some((q) => q.id === 'soulFriendGone')) return;
    // (A friend who is also one of the townsfolk has a story of their own to finish: see folk.js.)
    const town = s.folk && s.folk.p && s.folk.p.parg ? s.folk.p.parg.pid : null;
    for (const p of L.friends()) if (p.id !== town && p.age >= 74 && L.chance((p.age - 72) ** 2 / 2600)) { L.queue('soulFriendGone', p.id); break; }
  });

  hooks.mood.push((L) => {
    const s = L.s, S = s.soul;
    if (!S) return 0;
    let b = 0;
    if (has(L, 'spender')) b += 2;
    if (has(L, 'homebody')) b += 1.5;
    if (has(L, 'idler')) b += 2;
    if (has(L, 'grafter')) b -= 1;
    if (has(L, 'churchgoer')) b += 1;
    if (has(L, 'loner') && !L.partner() && L.friends().filter((p) => p.bond >= 40).length < 2) b += 2.5;
    if (S.parish >= 80) b += 2; else if (S.parish >= 50) b += 1;
    const sp = S.mind.spell;
    if (sp) b -= sp.k === 'low' ? 5 : 3;
    return b - S.grief;
  });

  hooks.time.push((L) => {
    const S = L.s.soul;
    if (!S) return 0;
    return (has(L, 'nightowl') && L.season === 3 ? 1 : 0) - (S.mind.spell ? 1 : 0);
  });

  hooks.income.push((L, out) => {
    if (!has(L, 'thrifty')) return;
    const food = L.bills().find(([what]) => what === 'Food and bills');
    if (food) out.push(['Careful housekeeping', Math.round(food[1] * 0.07)]);
  });
  hooks.bills.push((L, out, jailed) => { if (!jailed && has(L, 'spender')) out.push(['Little luxuries', 250]); });

  // (Daredevils' luck: added to every chance the town offers.)
  if (hooks.luck) hooks.luck.push((L) => (has(L, 'daredevil') ? 0.03 : 0));

  // What the Gazette says.
  if (hooks.epitaph) hooks.epitaph.push((L, out) => {
    const s = L.s, S = s.soul, p = pron(s), now = L.soulTraits();
    if (now.length) {
      // (With one trait, its own sentence says it; with more, the list, then the strongest of them.)
      if (now.length > 1) out.push(`${p.He} was ${list(now.map((id) => CHARACTER[id].word))}.`);
      const top = now.slice().sort((a, b) => S.lean[b] - S.lean[a])[0];
      out.push(CHARACTER[top].known(p, L));
    } else {
      const once = Object.keys(S.ever).filter((id) => CHARACTER[id]).sort((a, b) => S.ever[a] - S.ever[b]).slice(0, 3);
      if (once.length) out.push(`In ${p.his} younger days ${p.he} had been ${list(once.map((id) => CHARACTER[id].word))}.`);
    }
    const church = [];
    if (S.n.vol >= 20) church.push('the soup run will be a pair of hands short on Tuesday');
    if (S.n.bells >= 12) church.push(`the bells of St Brigid’s will be rung for ${p.him} by the band ${p.he} rang with`);
    if (church.length) out.push(`${cap(list(church))}.`);
    if (S.n.through) out.push(`${p.He} knew some grey seasons, came through them, and was always kind to anyone going through their own.`);
  });

  // ---- traits come and go ----

  function settle(L) {
    const s = L.s, S = s.soul, lean = S.lean;
    for (const id of IDS) lean[id] = Math.round(lean[id] * DECAY * 100) / 100;
    for (const id of Object.keys(S.has)) {
      if (!CHARACTER[id]) { delete S.has[id]; continue; }
      if (lean[id] < FADE) drop(L, id);
    }
    const cands = IDS.filter((id) => S.has[id] == null && lean[id] >= GAIN).sort((a, b) => lean[b] - lean[a]);
    for (const c of cands) {
      const opp = OPPOSITE[c];
      if (opp && S.has[opp] != null) { if (lean[c] > lean[opp] + 10) drop(L, opp); else continue; }
      const held = Object.keys(S.has).sort((a, b) => lean[a] - lean[b]);
      if (held.length >= MOST) { if (lean[c] > lean[held[0]] + 15) drop(L, held[0]); else continue; }
      const t = CHARACTER[c];
      S.has[c] = s.t;
      if (S.ever[c] == null) S.ever[c] = s.t;
      L.note(`People have started to call you ${t.word}.`);
      L.say(t.icon, `A new trait: ${t.name}`, 'good');
      break;
    }
  }
  function drop(L, id) {
    delete L.s.soul.has[id];
    L.note(`These days nobody would call you ${CHARACTER[id].word}.`);
  }

  // ---- St Brigid's -----------------------------------------------------------------------

  const ring = (L) => (L.soulRinger() ? ' You rang the bells for it first, in the band, and nobody noticed the one you fluffed.' : '');
  def('soulService', {
    place: 'church', sec: 'Sunday', icon: '⛪', title: 'Go to the Sunday service', per: 1,
    desc: 'Hymns, a short sermon, tea and biscuits after. A little peace, and people.',
    run(L) {
      const S = L.s.soul;
      S.n.service++;
      L.joy(L.soulRinger() ? 5 : 4); L.hp(0.5); parish(L, 3);
      const p = L.maybeMeet(0.12);
      const said = L.pick([
        ['The Reverend Hollis loses her place in the Easter sermon, and finds a better one.', 'Easter lilies everywhere, and a child who asks, loudly, whether the vicar is married to God.'],
        ['The doors are propped open, and a sparrow attends the whole service.', 'A hot Sunday. The sermon is short, by popular demand.'],
        ['Harvest festival: tins of beans stacked round the font, and a marrow on the altar that Tom Windle insists on calling "her".', 'The sermon is about seeds. It is really about the roof.'],
        ['Frost on the inside of the windows. Everybody sings louder to keep warm.', 'Advent: one candle lit, and the Reverend’s breath showing as she preaches.'],
      ][L.season].concat(['The sermon is about bees, again. It is better than it sounds.', 'You sing a hymn you have not sung since you were nine, and remember every word.']));
      return `${said}${p ? ` Over the tea urn you get talking to ${p.name}.` : ' Tea after, in cups and saucers.'}${ring(L)}`;
    },
  });
  def('soulCarols', {
    place: 'church', sec: 'Sunday', icon: '🕯️', title: 'Carols by candlelight', per: 1,
    desc: 'Christmas Eve at St Brigid’s: candles, carols, and the whole town in its coat. Good for the mood, and for the family.',
    show: (L) => L.season === 3,
    run(L) {
      L.joy(7); parish(L, 2);
      for (const p of L.s.people) if ((p.kind === 'child' && p.age < 18) || p.kind === 'partner' || p.kind === 'spouse') L.bond(p, 3);
      return L.pick(['The lights go out and four hundred candles come on. The first verse of the first carol is sung by one small boy, and he is perfect.', 'You sing the descant you were never taught, with your whole chest. The man in front turns round, then joins in louder.', 'Mince pies in the porch afterwards, and snow, very nearly.']);
    },
  });
  def('soulSupper', {
    place: 'church', sec: 'Sunday', icon: '🌾', title: 'The harvest supper', per: 1, cost: 10,
    desc: 'Long tables in the church hall, a dish to share, and the whole parish. Good for the mood and for friendships.',
    show: (L) => L.season === 2,
    run(L) {
      L.joy(6); parish(L, 3);
      for (const p of L.friends().slice(0, 10)) L.bond(p, 2);
      const p = L.maybeMeet(0.3);
      const said = L.pick(['Tom Windle brings a ham and a grievance against the council, and shares both.', 'Priya Lal’s cheese board is the size of a door. Nobody leaves hungry.', 'The Reverend Hollis says grace, then auctions a jar of her own honey for the roof. It goes for forty dollars.', 'Somebody’s apple crumble causes a minor stampede.']);
      return `${said}${p ? ` You are sat next to ${p.name}, and by the pudding you are friends.` : ''}`;
    },
  });
  def('soulVicar', {
    place: 'church', sec: 'The vicarage', icon: '🫖', title: 'Tea with the Reverend Hollis', per: 1,
    desc: (L) => (L.soulSpell() ? 'She is a better listener than she lets on, and she will not tell a soul.' : 'She keeps bees, frets about the roof, and is a better listener than she lets on.'),
    run(L) {
      const S = L.s.soul, g = S.graves[S.graves.length - 1];
      L.joy(2); parish(L, 1);
      // (She is one of the townsfolk as well: tea counts towards knowing her. See folk.js.)
      if (L.folkIntro && L.s.folk) L.folkIntro('hollis');
      if (S.mind.spell) return S.mind.spell.k === 'low' ? 'You do not mean to tell her, and then you do. She listens, says very little, and gives you a jar of honey and the number of a counsellor at St Wren’s. "And come back next week," she says. "I mean it."' : '"You look like somebody who has not sat down since Easter," she says, and makes you sit down. You talk about everything except work. It helps more than you expected.';
      if (S.grief >= 2 && g) { S.grief = Math.max(0, S.grief - 1); return `You talk about ${g.name}. She remembers the funeral, and what was said. It helps to hear it back.`; }
      return L.pick(['She shows you the hives. The bees, she says, have opinions about the new hymn book.', 'She lends you a romantic novel by somebody called Clementine Vane. "I have my suspicions about who that is," she says, looking towards the library.', 'The tea is stewed and the biscuits are soft, and you stay two hours.', 'She tells you about the roof. Then she tells you about the roof again, in more detail.']);
    },
  });

  // Lending a hand: these are on the parish noticeboard (the sheet soulChurch).
  def('soulSoup', {
    sec: 'Lending a hand', icon: '🥣', title: 'Help with the soup run', per: 1,
    desc: 'Tuesday nights, in the Reverend’s van, round the people sleeping rough. Good for your name and the mood.',
    run(L) {
      const S = L.s.soul, cold = L.season === 3;
      S.n.vol++;
      L.karma(cold ? 3.5 : 2.5); L.joy(cold ? 3 : 2); L.gain('charm', 0.4); parish(L, 2);
      return cold ? 'Frost on the van windows. The soup goes in four minutes flat, and you wish you had brought more.' : L.pick(['Leek and potato, forty cups, and a man called Spike who tells you the best place in town to watch the sunrise.', 'Rain all night. Nobody complains about the soup, which is a miracle, because it is mostly pepper.', 'You learn everybody’s name, and how they take their tea.']);
    },
  });
  def('soulVisit', {
    sec: 'Lending a hand', icon: '🧓', title: 'Visit someone on the Reverend’s list', per: 1,
    desc: 'People who live alone and do not get many visitors. An hour of yours is the best of their week. Good for your name, your Charm and the mood.',
    run(L) {
      const S = L.s.soul;
      S.n.vol++;
      L.karma(1.5); L.joy(3); L.gain('charm', 0.8); parish(L, 2);
      return L.pick(['Mr Abernethy, who kept the lighthouse for forty years, shows you how to tie a bowline and will not let you leave until you can.', 'Mrs Penrose, who is ninety-one, beats you at cribbage three times and cheats in the fourth.', 'Old Mr Kaur has no family left in the Bay. You look at photographs of his wedding, and he tells you everybody’s name.', 'Miss Dunstan wants the crossword done and does not want any help with it. You make the tea, and she lets you have seven down.']);
    },
  });
  def('soulJumble', {
    sec: 'Lending a hand', icon: '🧺', title: (L) => (L.season === 3 ? 'Run a stall at the Christmas bazaar' : 'Run a stall at the jumble sale'), per: 1,
    desc: (L) => `Saturdays in the church hall. Every dollar goes to ${L.soulRoofDone() ? 'the spire, which is next' : 'the roof fund'}, and the more Charm you have, the more you sell.`,
    run(L) {
      const s = L.s, S = s.soul, raised = Math.round((150 + s.st.charm * 6 + L.rnd() * 100) / 10) * 10;
      S.n.vol++;
      L.karma(1); L.joy(2); parish(L, 2);
      const said = L.pick(['You sell a lampshade to the woman who gave it to the sale last year.', 'Somebody haggles for ten minutes over a jigsaw with three pieces missing.', 'A fur coat, a fondue set and nine copies of the same thriller, all gone by noon.']);
      return `${said} ${money(raised)} for ${S.f.roof ? 'the spire' : 'the roof'}.${raiseRoof(L, raised)}`;
    },
  });
  def('soulRoofGive', {
    sec: 'Lending a hand', icon: '🪣', title: 'Put something in the roof fund', per: 1, cost: 500, time: 0,
    desc: 'A bucket in the north aisle catches the drips. $500 towards the roof.',
    show: (L) => !L.soulRoofDone(),
    run(L) {
      L.karma(1); L.joy(2); parish(L, 1);
      L.s.n.given = (L.s.n.given || 0) + 500;
      return `The Reverend Hollis writes your name in the book, and moves the thermometer up by hand, with great ceremony.${raiseRoof(L, 500)}`;
    },
  });
  // (There is one roof, and one fund for it: the vicar's story in folk-tales.js, the choir and
  // the Merrow's treasure in coast.js all add to it through L.soulRoofAdd(n).)
  Life.prototype.soulRoofAdd = function (n) { return raiseRoof(this, n); };
  Life.prototype.soulRoofLeft = function () { return this.s.soul.f.roof ? 0 : Math.max(0, ROOF - this.s.soul.roof); };
  function raiseRoof(L, n) {
    const s = L.s, S = s.soul;
    if (S.f.roof) return '';
    S.roof += n;
    if (S.roof < ROOF) return '';
    S.f.roof = 1;
    L.joy(5); L.karma(2);
    L.note('Helped St Brigid’s raise enough to mend its roof.', 'big');
    L.say('⛪', 'The roof of St Brigid’s is mended', 'good');
    return ' And that does it: the thermometer reaches the top, and the Reverend Hollis rings the bell herself. "Now," she says, "the spire."';
  }

  def('soulBells', {
    place: 'church', sec: 'The bell tower', icon: '🔔', title: 'Bell practice',
    desc: (L) => (L.soulRinger() ? 'Thursday nights in the tower. You are one of the band now, and ring for Sunday service. Good for Craft and the mood.' : 'Thursday nights in the tower with the band. Ring well a few times and they will have you on Sundays. Good for Craft and the mood.'),
    per: 1,
    why: (L, x) => (x === undefined || (typeof x === 'number' && x >= 0 && x <= 1) ? null : 'Take hold of the sally.'),
    run(L, x) {
      const S = L.s.soul, q = x === undefined ? 0.5 : x, was = L.soulRinger();
      S.n.bells++;
      S.bells.best = Math.max(S.bells.best, q);
      L.gain('craft', 1 + q); L.joy(2 + 3 * q); parish(L, 2);
      let text = q >= 0.9 ? L.pick(['Not one clash all evening. Mr Tregenza, the tower captain, says nothing at all, which from him is a standing ovation.', 'The changes come round clean as a whistle. Down in the square, people stop to listen.']) : q >= 0.6 ? L.pick(['A clash in the third row, but the rest is sound. Mr Tregenza nods.', 'You find the rhythm halfway through and keep it. The tenor ringer gives you a thumbs up.']) : L.pick(['You ring the treble when it should be the fourth, twice. "Lovely enthusiasm," says Mr Tregenza.', 'The rope tries to take you up the tower with it. Everyone remembers their first time.']);
      if (q >= 0.9 && S.n.bells >= 4 && !S.f.peal) { S.f.peal = 1; L.note('Rang a clean peal at St Brigid’s.', 'big'); text += ' The band writes your name in the peal book.'; }
      if (!was && L.soulRinger()) text += ' Afterwards Mr Tregenza asks if you could ring on Sundays.';
      return text;
    },
  });

  def('soulBoard', { place: 'church', sec: 'The parish', icon: '📌', title: 'The parish noticeboard', desc: 'The soup run, visiting, the jumble sale, the roof fund, and the big days.', time: 0, open: 'soulChurch' });
  def('soulYard', {
    place: 'church', sec: 'The churchyard', icon: '🪦', title: 'Walk round the churchyard', time: 0, open: 'soulYard',
    desc: (L) => { const g = L.s.soul.graves; return `Where ${list(g.slice(-3).map((q) => q.name))}${g.length > 3 ? ' and others' : ''} ${g.length > 1 ? 'lie' : 'lies'}. Visit, and tell them the news.`; },
    show: (L) => L.s.soul.graves.length > 0,
  });
  // x: which grave.
  def('soulGrave', {
    sec: 'The churchyard', icon: '💐', per: 1,
    title: (L, i) => `Visit ${L.s.soul.graves[i] ? L.s.soul.graves[i].name : 'a grave'}`,
    desc: 'Once a season. It eases grief, a little at a time.',
    why: (L, i) => (Number.isInteger(i) && L.s.soul.graves[i] ? null : 'There is nobody there you know.'),
    run(L, i) {
      const s = L.s, S = s.soul, g = S.graves[i], recent = s.t - g.t <= 8;
      g.visits++; S.n.visits++;
      L.joy(recent ? 4 : 2);
      S.grief = Math.max(0, Math.round((S.grief - 1.5) * 100) / 100);
      const He = cap(he(g));
      return L.pick({
        parent: [`You tell ${g.name} about work, the house, the weather. ${He} would have had opinions about all of it.`, `You pull the weeds from round the stone, the way ${he(g)} would have wanted, and tell ${him(g)} you are eating properly.`],
        spouse: [`You sit on the bench by ${g.name} and read the paper aloud, the bits ${he(g)} liked.`, `You bring flowers from the garden, the ones ${g.name} planted.`],
        partner: [`You sit with ${g.name} a while, and tell ${him(g)} what you have been up to.`, 'You bring flowers, and stay until the light goes.'],
        sibling: [`You tell ${g.name} the family news. ${He} would have laughed at most of it.`, `You tell ${g.name} something you never told anyone else. ${He} always kept your secrets.`],
        friend: [`You tell ${g.name} what everybody at the Gull is up to.`, `You leave a pebble from the beach on ${g.name}’s stone, for luck.`],
      }[g.kind] || ['The yew tree creaks. A robin watches from the wall. You stay longer than you meant to.']);
    },
  });

  // ---- the cards --------------------------------------------------------------------------

  const tr = (id) => (L) => L.soulHas(id);
  const ic = (id, t) => `${CHARACTER[id].icon} ${t}`;
  const busy = (L, n) => { L.s.time = Math.max(0, L.s.time - n); };

  function churchWed(L, x, vows) {
    const s = L.s, S = s.soul, p = P(L, x);
    p.kind = 'spouse'; p.eng = false; p.live = s.home !== 'hostel';
    L.bond(p, vows ? 14 : 9); L.joy(vows ? 15 : 12); L.karma(1); parish(L, 5);
    for (const q of L.friends()) L.bond(q, 4);
    s.f.wed = 1; S.f.wed = 1;
    S.days.push({ k: 'wed', name: p.name, t: s.t });
    deed(L, { churchgoer: 4, romantic: vows ? 5 : 3 });
    L.note(`Married ${p.name} at St Brigid’s.`, 'love');
    const band = L.soulRinger() ? ', rung by your own band, who will not hear of being paid' : '';
    return vows ? `You both get through the vows you wrote, nearly. ${p.name}’s mother does not even try. The bells ring${band}, and the confetti blows straight back into the porch.` : `The bells ring${band}, the confetti blows straight back into the porch, and the Reverend Hollis forgets ${p.name}’s middle name and makes one up. It is perfect.`;
  }

  function eulogy(L, x, said, o = {}) {
    const S = L.s.soul, g = S.graves[x.g];
    if (g && g.name === x.name) g.said = said;
    S.n.words++;
    if (o.joy) L.joy(o.joy);
    if (o.grief) S.grief = Math.max(0, Math.round((S.grief - o.grief) * 100) / 100);
    if (o.kin || o.friends) moved(L, o.kin || 0, o.friends || 0);
    if (o.karma) L.karma(o.karma);
    if (o.deed) deed(L, o.deed);
    S.days.push({ k: 'funeral', name: x.name, t: L.s.t });
    if (S.days.length > 40) S.days.shift();
  }

  addEvents([
    // ---- life's big days ----
    {
      id: 'soulBanns', icon: '⛪', title: 'The banns', ok: (L, x) => { const p = L.person(x); return !!p && p.kind === 'partner' && !!p.eng && !L.s.gaol; },
      text: (L, x) => `The Reverend Hollis catches you on the High Street. "I hear you and ${P(L, x).name} are getting married. You know you could marry at St Brigid’s? I would read the banns three Sundays running, the bells would ring, and the roof only leaks at the back."`,
      opts: [
        { t: 'Marry at St Brigid’s', cost: 5000, run: (L, x) => churchWed(L, x, false) },
        { t: ic('romantic', 'Marry at St Brigid’s, with vows you wrote yourselves'), show: tr('romantic'), cost: 5000, run: (L, x) => churchWed(L, x, true) },
        { t: 'Thank her, and plan something else', run() { return 'She says the offer stands, and that she does a very good christening too.'; } },
      ],
    },
    {
      id: 'soulChristen', icon: '🕊️', title: (L, x) => (P(L, x).age >= 1 ? 'A service of welcome' : 'A christening'), ok: (L, x) => { const p = L.person(x); return !!p && p.kind === 'child' && !L.s.gaol; },
      text: (L, x) => { const p = P(L, x); return p.age >= 1 ? `The Reverend Hollis asks whether you would like a service of welcome for ${p.name} at St Brigid’s, with godparents, a candle, and tea in the hall after.` : `The Reverend Hollis asks whether you would like ${p.name} christened at St Brigid’s, with godparents, the font, and tea in the hall after.`; },
      opts: [
        {
          t: 'Yes, at St Brigid’s', cost: 250,
          run(L, x) {
            const p = P(L, x), S = L.s.soul, god = godparent(L), pt = L.partner();
            L.joy(5); L.bond(p, 4); parish(L, 3);
            if (pt) L.bond(pt, 3);
            if (god) L.bond(god, 8);
            deed(L, { churchgoer: 3 });
            S.days.push({ k: 'christening', name: p.name, t: L.s.t });
            const first = p.age >= 1 ? `${p.name} holds the candle very seriously, and does not drop it.` : `${p.name} sneezes at the font, which the Reverend Hollis says is a very good sign.`;
            return god ? `${first} ${god.name} makes a solemn and rather tearful godparent.` : first;
          },
        },
        {
          t: ic('churchgoer', 'Ask the Reverend Hollis to be godmother herself'), show: tr('churchgoer'), cost: 250,
          run(L, x) { const p = P(L, x), S = L.s.soul; L.joy(6); L.bond(p, 4); parish(L, 6); deed(L, { churchgoer: 3 }); S.days.push({ k: 'christening', name: p.name, t: L.s.t }); return `She goes pink, says she could not possibly, and then organises everything, including the cake. ${p.name} gets a jar of honey every birthday from now on.`; },
        },
        { t: 'A naming party at home', cost: 300, run(L, x) { const p = P(L, x); L.joy(5); for (const q of L.friends().slice(0, 10)) L.bond(q, 2); deed(L, { charmer: 1, homebody: 1 }); return `Balloons, a cake, and every friend you have passing ${p.name} round like a parcel.`; } },
        { t: 'No fuss', run(L, x) { L.joy(1); return P(L, x).age >= 1 ? 'There is a whole new person to get to know. The rest can wait.' : 'You have a baby to feed. The rest can wait.'; } },
      ],
    },
    {
      id: 'soulFriendGone', icon: '🕊️', title: 'An empty seat at the Gull', ok: (L, x) => { const p = L.person(x); return !!p && p.kind === 'friend'; },
      text: (L, x) => `Word comes round the way it does in a small town: ${P(L, x).name} has died, at ${P(L, x).age}, peacefully, at home.`,
      inText: (L, x) => `A letter from outside: ${P(L, x).name} has died, at ${P(L, x).age}, peacefully, at home.`,
      opts: [{
        t: 'Goodbye, old friend',
        run(L, x) {
          const p = P(L, x), info = aboutOf(p);
          L.gone(p); L.joy(-(5 + p.bond / 10));
          mourn(L, info);
          return `You keep turning to tell ${him(p)} things. ${cap(he(p))} would have had something to say about all of it.`;
        },
      }],
    },
    {
      id: 'soulFuneral', icon: '🕯️', title: 'A few words', ok: (L) => !L.s.gaol,
      text: (L, x) => `At St Brigid’s the Reverend Hollis has left a space for you between the second hymn and the prayers. The church is fuller than you expected. What will you say about ${x.name.split(' ')[0]}?`,
      opts: [
        {
          t: (L, x) => `Tell the story that always made ${him(x)} laugh`, check: ['charm', 40],
          run(L, x, win) {
            if (win) { eulogy(L, x, 'laugh', { joy: 5, grief: 3, kin: 3, friends: 3, deed: { joker: 2 } }); return `The church laughs, then cries, then laughs again. Afterwards a cousin you have never met says it was ${him(x)} exactly.`; }
            eulogy(L, x, 'laughed', { joy: 1, grief: 1 }); return 'You lose your way halfway through. Somebody laughs anyway, kindly, and you finish.';
          },
        },
        { t: (L, x) => `Say plainly what ${he(x)} meant to you`, run(L, x) { eulogy(L, x, 'plain', { joy: 3, grief: 3, kin: 4 }); return 'You keep it short, and you get through it. Afterwards everybody wants to hold your hand.'; } },
        { t: 'Read the poem the Reverend suggests', run(L, x) { eulogy(L, x, 'read', { joy: 2, grief: 2 }); return 'Something about a ship going over the horizon, and still being a ship on the far side. It says it better than you could.'; } },
        { t: (L, x) => ic('joker', `Do as ${he(x)} asked, and send ${him(x)} off laughing`), show: tr('joker'), run(L, x) { eulogy(L, x, 'joke', { joy: 6, grief: 3, kin: 4, friends: 4, deed: { joker: 3 } }); return `Three jokes, two of them ${his(x)}, one of them rude. The Reverend Hollis laughs loudest. Nobody can remember a better funeral.`; } },
        { t: (L, x) => ic('bookish', `Read from the book ${he(x)} loved, and say why`), show: tr('bookish'), run(L, x) { eulogy(L, x, 'book', { joy: 4, grief: 3, kin: 2, deed: { bookish: 2 } }); return `A page from the book on ${his(x)} bedside table, folded at the corner where ${he(x)} left off. You read on to the end of the chapter for ${him(x)}.`; } },
        { t: ic('romantic', 'Read from the letters you sent each other'), show: (L, x) => L.soulHas('romantic') && (x.kind === 'spouse' || x.kind === 'partner'), run(L, x) { eulogy(L, x, 'letters', { joy: 4, grief: 4, kin: 5, deed: { romantic: 3 } }); return 'The first one, from before everything. The church goes very quiet, and somebody in the front pew takes your hand.'; } },
        { t: (L, x) => ic('kind', `Thank everyone who sat with ${him(x)} at the end`), show: tr('kind'), run(L, x) { eulogy(L, x, 'thanks', { joy: 3, grief: 2, kin: 5, friends: 3, karma: 2, deed: { kind: 2 } }); return 'You name every one of them: the nurses, the neighbour with the soup, the man from the paper shop. Each of them cries.'; } },
        { t: ic('hothead', 'Say what you think of the relatives who never visited'), show: tr('hothead'), run(L, x) { eulogy(L, x, 'row', { joy: 3, grief: 2, kin: -5, karma: -2, deed: { hothead: 3 } }); return 'It needed saying. Not everybody agrees that it needed saying at a funeral.'; } },
        { t: ic('churchgoer', 'Choose the hymns yourself, and lead the singing'), show: tr('churchgoer'), run(L, x) { eulogy(L, x, 'hymns', { joy: 4, grief: 3, kin: 2, deed: { churchgoer: 2 } }); parish(L, 4); return 'You choose the ones that make everybody cry and sing at once. The roof very nearly comes off, which would at least settle the matter.'; } },
        { t: 'You cannot. Ask the Reverend to speak', run(L, x) { eulogy(L, x, 'vicar', { grief: 1 }); return `She speaks about ${x.name.split(' ')[0]} as if she had known ${him(x)} all ${his(x)} life. Perhaps she had. You hold the order of service very tightly.`; } },
      ],
    },
    // ---- the mind ----
    {
      id: 'soulLow', icon: '🌧️', title: 'The grey', ok: (L) => !!L.soulSpell() && L.soulSpell().k === 'low',
      text: 'It has crept up on you. Mornings are heavy, the things you used to enjoy feel like chores, and you are tired in a way sleep does not touch. It is not your fault, and it will not last for ever, though it feels as if it might.',
      opts: [
        {
          t: 'Tell someone close', show: (L) => L.s.people.some(confidant),
          run(L) {
            const p = L.s.people.filter(confidant).sort((a, b) => b.bond - a.bond)[0], sp = L.soulSpell();
            L.bond(p, 4); L.joy(2); sp.depth = Math.max(1, sp.depth - 1.5); sp.by.talk = (sp.by.talk || 0) + 1.5;
            return `You tell ${p.name}. ${cap(he(p))} does not try to fix it. ${cap(he(p))} puts the kettle on, and stays.`;
          },
        },
        { t: 'Write down what helps, and put it on the fridge', run(L) { const sp = L.soulSpell(); sp.depth = Math.max(1, sp.depth - 0.5); return 'A walk. A friend. The Reverend Hollis’s terrible tea. The counsellor at St Wren’s. Time. You look at the list most mornings.'; } },
        { t: 'Keep going, and keep it to yourself', run() { return 'You carry it on your own for now. The offer stands, whenever you want it: people are kinder than you expect.'; } },
      ],
    },
    {
      id: 'soulBurn', icon: '🪫', title: 'Nothing left in the tank', ok: (L) => !!L.soulSpell() && L.soulSpell().k === 'burn',
      text: 'You have been running flat out for a long time. Now you sit in the car outside work for twenty minutes before you can make yourself go in, and you cannot remember the last weekend that was not work.',
      opts: [
        { t: 'Tell the boss you need to ease off', show: (L) => !!L.s.job, run(L) { const j = L.s.job, sp = L.soulSpell(); j.perf = clamp(j.perf - 4, 0, 100); L.s.stand[j.c] = j.perf; sp.depth = Math.max(1, sp.depth - 1.5); return 'Your boss is better about it than you feared, and says she wishes you had said sooner.'; } },
        { t: 'Book a week away somewhere quiet', cost: 600, run(L) { const sp = L.soulSpell(); L.joy(4); busy(L, 1); sp.depth = Math.max(1, sp.depth - 2); sp.by.away = (sp.by.away || 0) + 2; return 'A cottage with no signal, a beach with nobody on it, and a great deal of sleep.'; } },
        { t: 'Push on', run() { return 'You tell yourself it is just a busy patch. It is not, quite.'; } },
      ],
    },
    {
      id: 'soulConfide', icon: '🫂', title: 'Are you all right?', ok: (L, x) => !!L.person(x) && !!L.soulSpell(),
      text: (L, x) => `${P(L, x).name} catches your eye over a cup of tea. "You have not been yourself lately," ${he(P(L, x))} says. "Are you all right? Really?"`,
      opts: [
        { t: 'Tell the truth', run(L, x) { const p = P(L, x), sp = L.soulSpell(); L.bond(p, 5); L.joy(3); sp.depth = Math.max(1, sp.depth - 1.5); sp.by.talk = (sp.by.talk || 0) + 1.5; return `It all comes out. ${p.name} listens to every word, and then rings you every few days, just to ask.`; } },
        { t: ic('loner', 'Go for a walk together, and say nothing much'), show: tr('loner'), run(L, x) { const p = P(L, x), sp = L.soulSpell(); L.bond(p, 3); L.joy(2); sp.depth = Math.max(1, sp.depth - 1); return 'Two miles of cliff path in companionable silence. At the end of it you feel lighter, and so, you suspect, does the dog.'; } },
        { t: ic('joker', 'Make a joke of it, then tell the truth'), show: tr('joker'), run(L, x) { const p = P(L, x), sp = L.soulSpell(); L.bond(p, 5); L.joy(4); sp.depth = Math.max(1, sp.depth - 1.5); return `${p.name} laughs, then sees your face, and stops. You talk for a long time.`; } },
        { t: 'Say you are fine, just tired', run(L, x) { L.joy(-1); return `${P(L, x).name} does not believe you, and says so, and lets it go for now.`; } },
      ],
    },
    {
      id: 'soulLift', icon: '🌤️', title: 'The light comes back', log: false,
      text: (L, x) => (x && x.k === 'burn' ? 'You catch yourself whistling on the way to work, and cannot think when that started. The weight has gone.' : 'One morning you notice the light on the bay, and realise you have been noticing it for a while. The grey has lifted.'),
      opts: [{
        t: 'Breathe',
        run(L, x) {
          const S = L.s.soul;
          S.n.through++;
          L.joy(8);
          L.note(x && x.k === 'burn' ? 'Came back from burnout.' : 'Came through a low spell.', 'big');
          return x && HELP_SAID[x.top] ? `It was ${HELP_SAID[x.top]} that helped most, you think, and time. You will remember that, and who stayed.` : 'It was time, mostly, and the people who stayed. You will remember who they were.';
        },
      }],
    },

    // ---- the town, and who you are in it ----
    {
      id: 'soulDrip', icon: '🪣', title: 'The bucket in the north aisle', w: 3, cd: 16, when: (L) => L.s.age >= 20 && !L.soulRoofDone(),
      text: 'The Reverend Hollis is up a stepladder in St Brigid’s, emptying a bucket into another bucket. "Another tile gone," she says. "The fund thermometer has not moved since Easter."',
      // (The second time, and after: see again in engine.js. Chosen by the season, not the dice.)
      again: (L) => ['The bucket in the north aisle has been joined by a second bucket, and a saucepan. The Reverend Hollis is up the stepladder again. "It is always the roof," she says, to the roof.', 'A drip has found the font, which the Reverend Hollis says is at least economical. She is holding the stepladder for the churchwarden, and looks at you hopefully.'][L.s.t % 2],
      opts: [
        { t: 'Put $100 in the tin', cost: 100, run(L) { L.karma(1); L.joy(1); parish(L, 1); L.s.n.given = (L.s.n.given || 0) + 100; return `"Bless you," she says, and means it.${raiseRoof(L, 100)}`; } },
        { t: 'Hold the ladder', run(L) { L.joy(2); parish(L, 2); return 'She hands you the bucket, then the hammer, then her glasses, then the bucket again.'; } },
        { t: ic('daredevil', 'Go up on the roof yourself'), show: tr('daredevil'), odds: () => 0.75, run(L, x, win) { if (win) { parish(L, 5); L.karma(2); L.joy(4); return `You fix three tiles and wave at the whole town from the ridge. That saves the fund a roofer’s fee.${raiseRoof(L, 600)}`; } L.hp(-6, 'a fall from the church roof'); L.joy(-2); return 'A slate slides, and so do you, the last six feet. The Reverend Hollis drives you to St Wren’s, praying aloud at every junction.'; } },
        { t: ic('thrifty', 'Organise a sponsored silence'), show: tr('thrifty'), run(L) { parish(L, 3); L.joy(2); return `Forty people, an afternoon, not a word. It is the quietest the church hall has ever been, and the cheapest fundraiser ever held.${raiseRoof(L, 400)}`; } },
        { t: 'Not today', run() { return 'She says she quite likes the sound of the drips. Nobody believes her.'; } },
      ],
    },
    {
      id: 'soulSwarm', icon: '🐝', title: 'A swarm', w: 2, cd: 24, when: (L) => L.season <= 1,
      text: 'The Reverend Hollis’s bees have swarmed onto the bus shelter on the High Street. The queue for the number twelve is standing very still.',
      opts: [
        { t: 'Help her coax them into a box', check: ['craft', 30], run(L, x, win) { if (win) { L.joy(4); parish(L, 3); return 'You hold the box, she shakes the branch, and the whole humming lot drops in. She gives you a jar of last year’s honey.'; } L.hp(-2); L.joy(-1); return 'Most of them go in the box. Several go up your sleeve.'; } },
        { t: ic('daredevil', 'Scoop them up with your bare hands'), show: tr('daredevil'), odds: () => 0.8, run(L, x, win) { if (win) { L.joy(6); L.fame(0.5); return 'Calm as you like, two handfuls of bees into the box. The bus queue applauds. It is in the Gazette.'; } L.hp(-4); return 'The bees have views about bare hands. So, afterwards, do you.'; } },
        { t: ic('joker', 'Announce that the number twelve is now a hive'), show: tr('joker'), run(L) { L.joy(3); deed(L, { joker: 1 }); return 'The queue laughs, the bees ignore you, and the Reverend Hollis says you are "not helping", while helping.'; } },
        { t: 'Walk the long way round', run() { return 'Wisdom is knowing which bus shelters to avoid.'; } },
      ],
    },
    {
      id: 'soulQuiz', icon: '❓', title: 'One short', w: 3, cd: 16, when: (L) => L.s.age >= 20,
      text: 'The best team at the Gull’s quiz is one short tonight. Miss Achterberg, the librarian, is their captain, and she is looking at you over her glasses.',
      again: (L) => ['Miss Achterberg’s quiz team is one short again: somebody’s mother-in-law has come to stay. She catches your eye across the Gull and raises one eyebrow, which from her is an engraved invitation.', 'One short at the Gull’s quiz again, and the picture round is lighthouses. Miss Achterberg slides a pencil across the table towards you without a word.'][L.s.t % 2],
      opts: [
        { t: 'Make up the numbers', check: ['smarts', 40], run(L, x, win) { if (win) { L.cash(100); L.joy(3); return 'You get the one about volcanoes. Your share of the pot is $100.'; } L.joy(1); return 'Second place, by one point, which was the one about volcanoes.'; } },
        { t: ic('bookish', 'Take the literature round on your own'), show: tr('bookish'), run(L) { L.cash(100); L.joy(5); deed(L, { bookish: 1 }); return 'Ten out of ten. Miss Achterberg nods at you, once. From her, that is a medal. Your share of the pot is $100.'; } },
        { t: ic('nightowl', 'Stay for the lock-in afterwards'), show: tr('nightowl'), run(L) { L.joy(4); L.hp(-1); const p = L.maybeMeet(0.5); return p ? `At two in the morning you and ${p.name} are still arguing about the capital of Australia.` : 'At two in the morning the landlord is teaching everybody a sea shanty with ninety verses.'; } },
        { t: 'Plead an early night', run() { return 'Miss Achterberg says nothing. She does not need to.'; } },
      ],
    },
    {
      id: 'soulLastOne', icon: '🧥', title: 'The last one in the shop', w: 3, cd: 16, when: (L) => L.s.cash + L.s.bank >= 400,
      text: 'In the window of the outfitter’s on the High Street: a good wool coat, exactly your size, the last one. $300.',
      opts: [
        { t: 'Buy it', cost: 300, run(L) { L.joy(4); deed(L, { spender: 1 }); return 'It is the best coat you have ever owned, and the wind off the bay can do its worst.'; } },
        { t: ic('spender', 'Buy it, and the scarf, and the hat'), show: tr('spender'), cost: 600, run(L) { L.joy(7); deed(L, { spender: 1 }); return 'The man in the shop calls you "sir or madam" with real feeling. You look magnificent.'; } },
        { t: ic('thrifty', 'Wait for the sale'), show: tr('thrifty'), odds: () => 0.6, run(L, x, win) { if (win) { L.cash(-150); L.joy(5); return 'A fortnight later it is in the sale at half price. You feel you have beaten the system.'; } L.joy(-1); return 'Somebody else got it. You see it on the bus most mornings.'; } },
        { t: 'Walk on by', run(L) { deed(L, { thrifty: 1 }); return 'Your old coat has a few years in it yet. Probably.'; } },
      ],
    },
    {
      id: 'soulQueue', icon: '😤', title: 'The queue at the post office', w: 3, cd: 16,
      text: 'A man in a golf umbrella walks straight past the queue at the post office and up to the counter. He is not even sorry.',
      again: (L) => ['The post office again, and the man with the golf umbrella again, walking straight past the queue as though it were weather. He is still not sorry.', 'The post office again, on pension day: a man in a flat cap walks straight past the whole queue with a breezy “I only want a stamp.” He wants several stamps, and a word about his pension.'][L.s.t % 2],
      opts: [
        { t: 'Let it go', run(L) { L.joy(-1); return 'You let it go. It follows you home anyway.'; } },
        { t: 'Say something', check: ['charm', 45], run(L, x, win) { if (win) { L.joy(2); return 'You point out the queue, politely. He apologises, and goes to the back. The queue looks at you with love.'; } L.joy(-2); return '"I’m in a hurry," he says, as if nobody else could be.'; } },
        { t: ic('hothead', 'Tell him exactly what you think, loudly'), show: tr('hothead'), run(L) { L.joy(3); L.karma(-1); deed(L, { hothead: 2 }); if (L.chance(0.3) && L.enemies().length < 6) { L.foe({ sex: 'm' }); return 'Everybody hears it. He hears it twice. He turns out to live three doors down from you.'; } return 'Everybody hears it. He goes to the back of the queue, red to the ears, and the postmistress winks at you.'; } },
        { t: ic('joker', 'Make him laugh about it'), show: tr('joker'), run(L) { L.joy(3); deed(L, { joker: 1 }); return 'Something about umbrellas and the meek inheriting the earth. Even he laughs, and goes to the back.'; } },
        { t: ic('kind', 'Notice he looks dreadful, and ask if he is all right'), show: tr('kind'), run(L) { L.karma(2); L.joy(3); const p = L.maybeMeet(0.5); return p ? `His wife is in St Wren’s. He is posting her the crossword. His name is ${p.name}, and you see him most weeks after that.` : 'His wife is in St Wren’s, and he is posting her the crossword. The whole queue lets him go first.'; } },
      ],
    },
    {
      id: 'soulSeaWall', icon: '🌊', title: 'Somebody on the sea wall', w: 2, cd: 20,
      text: 'A young woman is sitting on the sea wall in the drizzle, crying the way people do when they think nobody is looking.',
      opts: [
        { t: 'Sit with her a while', run(L) { L.karma(2); L.joy(1); return 'She does not say much and you do not ask. After a while she says thank you, and goes home.'; } },
        { t: ic('kind', 'Take her to Betty’s for a cup of tea, and listen'), show: tr('kind'), cost: 5, run(L) { L.karma(3); L.joy(4); const p = L.chance(0.4) && L.friends().length < 20 ? L.meet({ sex: 'f', age: L.int(20, 32) }) : null; return p ? `A broken engagement, and a long way from home. By the second pot her name is ${p.name}, and she is laughing at something Betty said.` : 'A broken engagement, and a long way from home. Betty brings cake that nobody ordered.'; } },
        { t: ic('loner', 'Sit nearby, say nothing, and stay'), show: tr('loner'), run(L) { L.karma(1.5); L.joy(2); return 'Twenty minutes of company without a word. When she gets up she nods to you, as if you had agreed something.'; } },
        { t: 'Leave her be', run(L) { L.joy(-1); return 'You think about her on and off all week.'; } },
      ],
    },
    {
      id: 'soulJump', icon: '🌊', title: 'High tide at the harbour', w: 2, cd: 20, when: (L) => L.season === 1 && L.s.age <= 60,
      text: 'Teenagers are jumping off the harbour wall at high tide, shrieking. One of them dares you.',
      opts: [
        { t: 'Tell them to be careful', run() { return 'They roll their eyes so hard you can hear it.'; } },
        { t: 'Jump', check: ['fitness', 40], run(L, x, win) { if (win) { L.joy(6); return 'Feet first, arms in, and the cold takes your breath. You come up to a cheer.'; } L.hp(-5, 'a jump off the harbour wall'); L.joy(-1); return 'You land flat. The sound carries to the far end of the pier.'; } },
        { t: ic('daredevil', 'Go off the lighthouse steps, higher up'), show: tr('daredevil'), odds: () => 0.7, run(L, x, win) { if (win) { L.joy(9); L.fame(1); return 'A long, long drop, and a clean entry. The teenagers speak of you in hushed tones for the rest of the summer.'; } L.hp(-10, 'a dive off the lighthouse steps'); return 'You hit the water wrong. Captain Quinn fishes you out without a word, which is the worst part.'; } },
        { t: ic('joker', 'Bomb, fully clothed'), show: tr('joker'), run(L) { L.joy(5); return 'The splash soaks a man eating chips on the pier. Even he laughs.'; } },
      ],
    },
    {
      id: 'soulTuesday', icon: '🌹', title: 'A wet Tuesday', w: 3, cd: 16, when: (L) => !!L.partner() && !!L.partner().live && !L.s.gaol,
      text: (L) => `Rain on the windows, nothing in the diary, and ${L.partner().name} still asleep.`,
      opts: [
        { t: 'Bring up a cup of tea', run(L) { L.bond(L.partner(), 2); return 'Two sugars, the good mug. A sleepy thank you.'; } },
        { t: ic('romantic', 'Breakfast in bed, and a flower from the garden'), show: tr('romantic'), cost: 20, run(L) { const p = L.partner(); L.bond(p, 7); L.joy(3); deed(L, { romantic: 1 }); return `${p.name} wakes to toast, a boiled egg and a rose with the rain still on it, and looks at you as if it were your wedding day.`; } },
        { t: ic('homebody', 'Declare a day under the duvet for both of you'), show: tr('homebody'), run(L) { const p = L.partner(); L.bond(p, 4); L.joy(4); busy(L, 1); return 'Three films, a pot of tea, and the rain on the window. Neither of you gets dressed.'; } },
        { t: 'Head out early', run(L) { L.bond(L.partner(), -1); return 'You leave a note. It is not quite the same.'; } },
      ],
    },
    {
      id: 'soulBigJob', icon: '📁', title: 'A big job', w: 3, cd: 16, when: (L) => !!L.s.job && !CAREERS[L.s.job.c].shady && !L.s.gaol,
      text: 'The boss calls everyone in. There is a big job coming up, it will mean late nights, and somebody has to lead it.',
      opts: [
        { t: 'Put your hand up', run(L) { const j = L.s.job; j.perf = clamp(j.perf + 4, 0, 100); L.s.stand[j.c] = j.perf; L.s.soul.mind.strain += 3; L.joy(-1); return 'It is a lot. You do it well, and the boss notices.'; } },
        { t: ic('grafter', 'Take it on, and the weekends with it'), show: tr('grafter'), run(L) { const j = L.s.job; j.perf = clamp(j.perf + 8, 0, 100); L.s.stand[j.c] = j.perf; j.n += 0.5; L.s.soul.mind.strain += 5; L.joy(1); deed(L, { grafter: 2 }); return 'Six weeks of it. You enjoy it, oddly. The boss uses the word "indispensable".'; } },
        { t: ic('idler', 'Discover an urgent appointment with the dentist'), show: tr('idler'), run(L) { const j = L.s.job; j.perf = clamp(j.perf - 3, 0, 100); L.s.stand[j.c] = j.perf; L.joy(3); deed(L, { idler: 1 }); return 'The dentist is very surprised to see you. So, a week later, is the boss.'; } },
        { t: 'Keep your head down', run(L) { const j = L.s.job; j.perf = clamp(j.perf - 1, 0, 100); L.s.stand[j.c] = j.perf; return 'Somebody else gets it, and the late nights, and the credit.'; } },
      ],
    },
    {
      id: 'soulInvite', icon: '✉️', title: 'An invitation', w: 3, cd: 16, when: (L) => L.s.age >= 20 && !L.s.gaol,
      text: 'The people at number twelve are having a party on Saturday, and you are invited. You barely know them.',
      opts: [
        { t: 'Go for an hour', run(L) { L.joy(2); const p = L.maybeMeet(0.3); return p ? `You stay three. ${p.name} is the reason.` : 'Crisps, a quiz about the hosts, and an early night.'; } },
        { t: ic('charmer', 'Go, and be the last to leave'), show: tr('charmer'), run(L) { L.joy(5); L.gain('charm', 1); const p = L.maybeMeet(0.6); return p ? `You know everybody by the end of it, and ${p.name} best of all.` : 'You know everybody by the end of it. The hosts ask you to the next one before you have left.'; } },
        { t: ic('homebody', 'Stay in with soup and a good programme'), show: tr('homebody'), run(L) { L.joy(4); L.hp(1); return 'You can hear the party through the wall. You turn the programme up, and are perfectly happy.'; } },
        { t: ic('loner', 'Send a kind note and a bottle'), show: tr('loner'), cost: 15, run(L) { L.joy(2); L.karma(0.5); return 'The note is warm and the bottle is good, and you have the evening to yourself.'; } },
        { t: 'Make your excuses', run() { return 'You were going to wash your hair. You do, in fact, wash your hair.'; } },
      ],
    },
    {
      id: 'soulCarolers', icon: '🎶', title: 'Carol singers', w: 3, cd: 8, when: (L) => L.season === 3 && L.s.home !== 'hostel' && !L.s.gaol,
      text: 'A knock at the door, and the first verse of a carol, slightly flat. The Harbour Singers are collecting for the lifeboat.',
      opts: [
        { t: 'A few dollars and a mince pie each', cost: 10, run(L) { L.joy(2); L.karma(0.5); return 'They sing one more for you, faster, because it is cold.'; } },
        { t: ic('churchgoer', 'Get your coat, and sing the rest of the street with them'), show: tr('churchgoer'), run(L) { L.joy(5); parish(L, 2); L.karma(1); return 'You know all the words. By the end of the street, so do the neighbours.'; } },
        { t: ic('joker', 'Sing back at them, badly'), show: tr('joker'), run(L) { L.joy(4); return 'A duet, of sorts, on the doorstep. The lifeboat does very well out of it.'; } },
        { t: ic('thrifty', 'Turn off the lights and hide'), show: tr('thrifty'), run(L) { L.joy(1); deed(L, { thrifty: 1 }); return 'You crouch behind the sofa until they go. They sing the whole of the second verse at your letterbox anyway.'; } },
        { t: 'Listen from the doorstep', run(L) { L.joy(2); return 'Breath in the cold air, and the lights of the town below. It does something to you.'; } },
      ],
    },
  ]);

  // ---- trophies ----
  Object.assign(TROPHIES, {
    soulCharacter: { name: 'Quite a character', icon: '🎭', desc: 'Have three traits at once.', test: (L) => !!L.s.soul && Object.keys(L.s.soul.has).length >= 3 },
    soulWed: { name: 'Wedding bells', icon: '💍', desc: 'Marry at St Brigid’s.', test: (L) => !!(L.s.soul && L.s.soul.f.wed) },
    soulPeal: { name: 'A clean peal', icon: '🔔', desc: 'Ring the bells at St Brigid’s without a single clash.', test: (L) => !!(L.s.soul && L.s.soul.f.peal) },
    soulParish: { name: 'Pillar of the parish', icon: '🥣', desc: 'Lend a hand at St Brigid’s twenty-five times.', test: (L) => !!L.s.soul && L.s.soul.n.vol >= 25 },
    soulRoof: { name: 'Raise the roof', icon: '⛪', desc: 'Help St Brigid’s raise the money to mend its roof.', test: (L) => !!(L.s.soul && L.s.soul.f.roof) },
    soulThrough: { name: 'Through the grey', icon: '🌤️', desc: 'Come through a low spell, or back from burnout.', test: (L) => !!L.s.soul && L.s.soul.n.through >= 1 },
  });
}
