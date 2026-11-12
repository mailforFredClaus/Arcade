// New in Town: the bits and pieces shared by the rules and the cards of
// "people who want things" (wants.js, wants-partner.js, wants-family.js).
// Plain helpers and tables only: nothing here changes a life by itself.

import { CAREERS, HOMES } from './data.js';

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const he = (p) => (p.sex === 'm' ? 'he' : 'she');
export const He = (p) => (p.sex === 'm' ? 'He' : 'She');
export const him = (p) => (p.sex === 'm' ? 'him' : 'her');
export const his = (p) => (p.sex === 'm' ? 'his' : 'her');
export const His = (p) => (p.sex === 'm' ? 'His' : 'Her');
export const first = (p) => p.name.split(' ')[0];
export const cap = (t) => t[0].toUpperCase() + t.slice(1);
// The person a card is about (x is { p: their id, ... }); a stand-in if they have gone.
export const P = (L, x) => L.person(x && typeof x === 'object' ? x.p : x) || { id: -1, name: 'Someone', sex: 'm', bond: 0, age: 30, kind: 'friend', st: {}, look: {} };
export const isLove = (p) => p.kind === 'partner' || p.kind === 'spouse';

// What is known about one person, kept in s.wants.p by their id.
export function rec(L, p) {
  const W = L.s.wants;
  return W.p[p.id] || (W.p[p.id] = { been: [] });
}
// Something the two of you went through, for their sheet.
export function been(L, p, t) {
  const r = rec(L, p);
  r.been.push({ a: L.s.age, t });
  if (r.been.length > 8) r.been.shift();
}

// Money: what things cost grows with what you earn, so a choice still bites
// at fifty as it did at twenty-five. (Care homes and nurseries charge
// everybody the same, and only follow prices: see fee.)
export function scale(L) {
  const s = L.s, pay = s.job ? CAREERS[s.job.c].rungs[s.job.r].pay : s.pension || 0;
  return clamp(pay / 2500, 0.8, 3);
}
export const price = (L, n) => Math.round(n * scale(L) / 50) * 50;
export const fee = (L, n) => Math.round(n * L.s.idx / 10) * 10;

// Time taken out of the season you are about to have.
export const busy = (L, n) => { L.s.time = Math.max(0, L.s.time - n); };
// How the boss sees you.
export function perf(L, d) {
  const j = L.s.job;
  if (!j) return;
  j.perf = clamp(j.perf + d, 0, 100);
  L.s.stand[j.c] = j.perf;
}
// A child's skill, as they grow.
export const grow = (p, k, d) => { if (p.st) p.st[k] = clamp(p.st[k] + d, 0, 100); };
// Children still at home (under eighteen), and under a given age.
export const young = (L, age = 18) => L.kids().filter((k) => k.age < age);

// A choice only some characters would think of (the traits are soul.js's).
const TICON = { romantic: '🌹', joker: '🃏', kind: '💗', hothead: '🌶️', bookish: '📚', daredevil: '🪂', thrifty: '🪙', spender: '💸', homebody: '🏡', churchgoer: '⛪', charmer: '😏', grafter: '🛠️', loner: '🌫️', sporty: '🏃' };
export const trait = (L, id) => typeof L.soulHas === 'function' && L.soulHas(id);
export const tr = (id) => (L) => trait(L, id);
export const ti = (id, t) => `${TICON[id]} ${t}`;

// A spare bedroom: what a home has for children, less the children in it
// and anybody else who has moved in.
export function spareRooms(L) {
  const s = L.s, e = L.homeEntry(), rooms = HOMES[s.home].kids + (e && e.ups.extension ? 1 : 0);
  const lodged = Object.entries(s.wants.p).filter(([id, r]) => r.care === 'with' && L.person(Number(id))).length;
  return rooms - young(L).length - lodged;
}

// ---- the partner's ambitions -------------------------------------------------------------

// Each is a chain of cards (wants<Name>1, 2, 3) that comes up over the years.
// hope: what their sheet says they are hoping for, stage by stage.
export const AMBITIONS = {
  band: { icon: '🎸', name: 'The band', cards: ['wantsBand1', 'wantsBand2', 'wantsBand3'], hope: [(r) => `To play with ${r.band} again`, (r) => `To take ${r.band} on tour`, (r) => `To see what comes of ${r.band}`] },
  city: { icon: '🏙️', name: 'A job in the city', cards: ['wantsCity1', 'wantsCity2', 'wantsCity3'], hope: [() => 'A big job in the city', () => 'To make the city work', () => 'To get on in the city'] },
  study: { icon: '🎓', name: 'A degree', cards: ['wantsStudy1', 'wantsStudy2', 'wantsStudy3'], hope: [() => 'A degree, at last', () => 'To finish the degree', () => 'To graduate'] },
  shop: { icon: '🏪', name: 'A business of their own', cards: ['wantsShop1', 'wantsShop2', 'wantsShop3'], hope: [(r) => `To open ${r.shop.a}`, (r) => `To keep ${r.shop.sign} going`, (r) => `For ${r.shop.sign} to make it`] },
  sail: { icon: '⛵', name: 'Round the world', cards: ['wantsSail1', 'wantsSail2', 'wantsSail3'], hope: [() => 'To sail round the world', () => 'A summer at sea, first', () => 'The big voyage'] },
  garden: { icon: '🌻', name: 'A garden', cards: ['wantsGarden1', 'wantsGarden2'], hope: [() => 'Somewhere with a garden', () => 'To make something of the garden'] },
};
export const BANDS = ['The Undertow', 'Low Tide Lights', 'Gull Patrol', 'The Breakwaters', 'Saltmarsh Radio', 'The Harbour Lights'];
export const INSTRUMENTS = ['the bass', 'the drums', 'the keyboards', 'the fiddle', 'lead guitar'];
export const BOATS = ['Kittiwake', 'Second Wind', 'Merry Dancer', 'Curlew', 'Lark'];
// A business of their own, after the sort of person they are.
export const SHOPS = {
  kind: { a: 'a bakery', sign: 'Crumbs', job: 'kitchen' },
  bookish: { a: 'a secondhand bookshop', sign: 'Spine & Tide', job: 'retail' },
  sporty: { a: 'a bike shop', sign: 'Freewheel', job: 'retail' },
  arty: { a: 'a pottery with a little gallery', sign: 'Kiln Cottage', job: 'arts' },
  witty: { a: 'a café with music on Fridays', sign: 'The Blue Kettle', job: 'kitchen' },
};
// What a partner who goes back to study comes out as.
export const DEGREE_JOB = { bookish: 'law', sporty: 'teaching', witty: 'politics', arty: 'teaching', kind: 'medicine' };

// Wedding anniversaries with a name of their own.
export const MILESTONES = { 1: 'paper', 5: 'wood', 10: 'tin', 15: 'crystal', 20: 'china', 25: 'silver', 30: 'pearl', 40: 'ruby', 50: 'gold', 60: 'diamond' };
export const ORD = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;

// ---- children ----------------------------------------------------------------------------

// What a child says they will be, by what they are best at: [said, the career it is].
export const HOPES = {
  smarts: [['a vet', 'medicine'], ['an astronaut', 'tech'], ['a doctor', 'medicine'], ['a judge, in a wig', 'law'], ['a teacher', 'teaching']],
  fitness: [['a footballer', 'sports'], ['a lifeboat coxswain, like Captain Quinn', 'sea'], ['a police officer', 'police'], ['an Olympic swimmer', 'sports']],
  charm: [['prime minister', 'politics'], ['on the television', 'arts'], ['the mayor', 'politics'], ['a shopkeeper with a big till', 'retail']],
  craft: [['an artist', 'arts'], ['a chef', 'kitchen'], ['a builder', 'trades'], ['an inventor', 'tech']],
};
// Careers that want a degree, for a child who goes to university.
export const GRADUATE = ['medicine', 'law', 'tech', 'teaching', 'finance', 'politics'];
// The ways a child can go at eighteen.
export const PATHS = {
  uni: { said: 'Off to university in the city' },
  'app-trades': { said: 'Apprenticed at Dobbs & Daughter', job: 'trades' },
  'app-sea': { said: 'Crewing on Captain Quinn’s boats', job: 'sea' },
  'app-kitchen': { said: 'In the kitchen at the Gull', job: 'kitchen' },
  work: { said: 'Straight into work' },
  gap: { said: 'A year away with a rucksack' },
  sea: { said: 'On the boats' },
};
export const EXAM = ['failed most of them', 'scraped through', 'done well', 'got top marks in nearly everything'];

// ---- parents -----------------------------------------------------------------------------

// Who looks after a parent who cannot manage: what it is called, what it costs a season.
export const CARE = {
  you: { said: 'You go round every day', cost: 0 },
  carer: { said: 'A carer comes in', cost: 800 },
  home: { said: 'At Seaview House', cost: 2000 },
  with: { said: 'Living with you', cost: 250 },
  sib: { said: 'Your family are taking turns', cost: 0 },
};
