// New in Town: going away, the tables. What there is to go on (a borrowed
// tent up to the trip of a lifetime), who can come, how grandly, what it
// costs, where it goes this year; the places of your own away; the days out
// on the coach; and the bits of words the cards are made from. The rules are
// in away.js, the cards in away-tales.js, the screen in away-ui.js.

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const first = (p) => p.name.split(' ')[0];
export const he = (p) => (p.sex === 'm' ? 'he' : 'she');
export const He = (p) => (p.sex === 'm' ? 'He' : 'She');
export const his = (p) => (p.sex === 'm' ? 'his' : 'her');
export const him = (p) => (p.sex === 'm' ? 'him' : 'her');
export const cap = (t) => t[0].toUpperCase() + t.slice(1);
// A list, said: "Sam, Kit and Jo".
export const list = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);
// One of a list, by a number already decided (the cards' words must not throw dice each time they are read).
export const nth = (l, n) => l[((n % l.length) + l.length) % l.length];

// The eight holidays, from cheap to grand, and two more for some lives. (The eight keep their count in
// s.trips, which the old trophies, the to-do list and the Globetrotter ribbon go by.)
//   time: blocks of the season; fixed + per a head: the price for one class, in an ordinary season;
//   n: how many cards the trip is (the last evening is always one of them); joy, hp: what it does you,
//   a good one; bond: what it does for those who came; stat: [skill, how much]; months: the seasons it
//   runs in (0 spring … 3 winter); peak / off: summer and winter prices; road: you drive there;
//   abroad: you need a passport; cls: what each class is (the price goes up by clsX);
//   where: this year's places to go (a different one each year).
export const KINDS = {
  tent: {
    name: 'A borrowed tent', icon: '⛺', time: 2, fixed: 30, per: 30, n: 2, joy: 6, hp: 1, bond: 4, months: [0, 1, 2], road: true,
    blurb: 'Two nights in a field somewhere, under canvas that smells of somebody else’s holidays. Cheap, and the stars are free.',
    cls: ['A tent with one pole missing'], clsX: [1],
    where: ['a farmer’s field above Carrow Cove', 'the woods by Lostwell Water', 'the dunes at Marram Point', 'a field by the river at Hensby', 'a hollow on Rook Moor', 'an orchard near Kettleby'],
    trip: (at) => `two nights under canvas in ${at}`, mem: (at) => `the nights in ${at}`, last: 'one last look at the stars',
    shut: 'Not in winter. You like your toes.',
  },
  caravan: {
    name: 'A caravan by the sea', icon: '🚐', time: 3, fixed: 380, per: 60, n: 3, joy: 8, hp: 3, bond: 6, months: [0, 1, 2], road: true, peak: 1.3,
    blurb: 'A week in a caravan at a sandy bay in the next county. Rain on the roof, chips on the front, and a beach that goes on for ever.',
    cls: ['An old van at the back of the park', 'A new van by the dunes', 'A lodge with a hot tub'], clsX: [1, 1.6, 2.8],
    trip: (at) => `a week in a caravan at ${at}`, mem: (at) => `the week at ${at}`, last: 'one last walk along the sands',
    shut: 'The caravan parks are shut for the winter.',
  },
  coach: {
    name: 'A coach tour', icon: '🚌', time: 3, fixed: 0, per: 420, n: 3, joy: 7, hp: 2, bond: 5, months: [0, 1, 2], stat: [['smarts', 1.5]],
    blurb: 'Six days, five hotels, a driver called Ken and a microphone he is very fond of. Somebody else does the driving and the worrying.',
    cls: ['Two-star hotels and a packed lunch', 'Better hotels, and the front seats'], clsX: [1, 1.5],
    where: ['the cathedral towns', 'the lakes and mountains', 'the Highlands', 'the bulb fields of Holland', 'the castles of the Rhine', 'the old towns of Belgium'],
    trip: (at) => `a coach tour of ${at}`, mem: (at) => `the coach tour of ${at}`, last: 'one last sing-song on the coach',
    shut: 'The coach tours stop for the winter.',
  },
  walk: {
    name: 'A walking week in the hills', icon: '🥾', time: 3, fixed: 150, per: 380, n: 3, joy: 8, hp: 3, bond: 6, months: [0, 1, 2, 3], stat: [['fitness', 2]], road: true,
    blurb: 'A long path, a map in a plastic bag, and a different bed every night. Good for the legs and better for the head.',
    cls: ['Youth hostels and farmhouse B&Bs', 'Inns, with your bags carried on ahead', 'A guide, and a country-house hotel'], clsX: [1, 1.6, 3],
    where: ['the fells of the north', 'the mountains of Wales', 'the high moors', 'the border hills', 'the hills three counties up', 'the lake country'],
    trip: (at) => `a walking week in ${at}`, mem: (at) => `the week walking in ${at}`, last: 'one last climb, for the view',
  },
  city: {
    name: 'A city weekend', icon: '🌆', time: 2, fixed: 250, per: 320, n: 2, joy: 8, hp: 1, bond: 5, months: [0, 1, 2, 3], stat: [['charm', 1], ['smarts', 1]],
    blurb: 'Museums, a show, a meal you will talk about for a year, and very sore feet.',
    cls: ['A small hotel near the station', 'A good hotel in the old town', 'A suite, and a table at the place everyone talks about'], clsX: [1, 1.7, 3.5],
    where: ['the capital', 'a city of canals, in Holland', 'an old city in Italy', 'a grand old city in France', 'a city of bridges, in Hungary', 'a city of spires, in Czechia'],
    trip: (at) => `a weekend in ${at}`, mem: (at) => `the weekend in ${at}`, last: 'one last stroll through the old streets',
  },
  sun: {
    name: 'A fortnight in the sun', icon: '🏖️', time: 4, fixed: 300, per: 1200, n: 3, joy: 11, hp: 5, bond: 6, months: [0, 1, 2, 3], abroad: true, peak: 1.25, off: 0.85,
    blurb: 'Two weeks abroad: a pool, a beach, a bar with a view, and a sunburnt man from somewhere near you in it.',
    cls: ['A package apartment, two streets back', 'A hotel on the beach', 'A villa with a pool of its own'], clsX: [1, 1.7, 3.5],
    where: ['Spain', 'Greece', 'Portugal', 'Italy', 'Cyprus', 'Turkey', 'Croatia', 'Malta'],
    trip: (at) => `a fortnight in ${at}`, mem: (at) => `the fortnight in ${at}`, last: 'one last swim, at dusk',
  },
  cruise: {
    name: 'A cruise', icon: '🛳️', time: 4, fixed: 0, per: 4200, n: 4, joy: 11, hp: 6, bond: 6, months: [0, 1, 2, 3], abroad: true, peak: 1.2, stat: [['charm', 1]],
    blurb: 'A floating hotel with fourteen restaurants, a different port every morning, and dancing every night whether you like it or not.',
    cls: ['An inside cabin, and the second sitting', 'A cabin with a balcony', 'A suite, and the captain’s table'], clsX: [1, 1.8, 4],
    where: ['the fjords of Norway', 'the islands of Greece', 'the Mediterranean', 'the coast of Croatia', 'the Baltic', 'the Caribbean'],
    trip: (at) => `a cruise to ${at}`, mem: (at) => `the cruise to ${at}`, last: 'one last turn round the deck',
  },
  far: {
    name: 'The trip of a lifetime', icon: '🌏', time: 5, fixed: 2000, per: 9000, n: 4, joy: 16, hp: 4, bond: 8, months: [0, 1, 2, 3], abroad: true, stat: [['smarts', 2], ['charm', 2]],
    blurb: 'Somewhere you have only ever seen on the television. Three weeks on the other side of the world.',
    cls: ['Trains, guesthouses and a rucksack', 'Good hotels, and a driver', 'Private guides, and the best rooms there are'], clsX: [1, 1.6, 3],
    where: ['Japan, in cherry-blossom time', 'Kenya, on safari', 'New Zealand, end to end', 'Canada, coast to coast by train', 'Peru, and the mountains', 'India, and its temples', 'Australia, the reef and the outback'],
    trip: (at) => `three weeks in ${at}`, mem: (at) => `the three weeks in ${at.split(',')[0]}`, last: 'one last look, to keep',
  },
  // For the young: a season away with a rucksack (no job, no course, under twenty-six).
  gap: {
    name: 'A season with a rucksack', icon: '🎒', time: 5, fixed: 0, per: 2400, n: 4, joy: 12, hp: 0, bond: 8, months: [0, 1, 2, 3], abroad: true, young: true, stat: [['charm', 3], ['smarts', 2]],
    blurb: 'Three months, one bag, a rail pass and no plan. You come back browner, thinner and somebody slightly different.',
    cls: ['Hostels, night buses and bread'], clsX: [1],
    where: ['Europe, by train', 'south-east Asia, by bus', 'South America, on a shoestring', 'the islands of Greece, by ferry'],
    trip: (at) => `a season round ${at}`, mem: (at) => `the season round ${at.split(',')[0]}`, last: 'one last night under foreign stars',
  },
};
// The eight that count towards the old trophies (and the to-do list's "Take a holiday from the station").
export const EIGHT = ['tent', 'caravan', 'coach', 'walk', 'city', 'sun', 'cruise', 'far'];

// Who comes. pay: how many heads you pay for is worked out in away.js (partyFor).
export const WHO = {
  solo: { name: 'Just you', icon: '🧍' },
  pair: { name: 'The two of you', icon: '💑' },
  family: { name: 'The family', icon: '👨‍👩‍👧' },
  clan: { name: 'The whole family, on you', icon: '👪' },
  friends: { name: 'With friends', icon: '🧑‍🤝‍🧑' },
  parent: { name: 'Taking a parent', icon: '🧓' },
};
export const WHO_ORDER = ['solo', 'pair', 'family', 'clan', 'friends', 'parent'];

// The caravan park in the next county: one for each life (and for the family after, if the tradition carries on).
export const PARKS = ['Pendrift Sands', 'Gullhaven Sands', 'Kittle Bay', 'Brannock Sands', 'Marram Bay', 'Polgwyn Sands', 'Sanderling Bay', 'Whitlow Sands'];
// The next bay up the coast, where the cottages are.
export const BAYS = ['Polwenna', 'Trevanna Cove', 'Saltcombe', 'Porthellis', 'Gannet Cove', 'Hollow Bay'];
// Where the villas are.
export const ABROAD = ['Spain', 'Portugal', 'Italy', 'Greece', 'France', 'Croatia'];

// A place of your own away. price: to buy, in an ordinary year (the cottage and villa follow the price of
// houses); upkeep: each season (site fees, the agent, the pool man); let: what it brings in a year let to
// holidaymakers, in good repair (most of it in the summer); keep: what it fetches when sold, of what it is worth.
export const OWN = {
  static: { name: 'static caravan', icon: '🚐', price: 24000, upkeep: 320, let: 3400, keep: 0.85, time: 2, fare: [20, 15], need: 40000,
    blurb: 'A caravan of your own on the park, with a veranda and a view of the sea if you lean. It loses a little value every year, as caravans do.' },
  cottage: { name: 'cottage', icon: '🏡', price: 240000, upkeep: 850, let: 15000, keep: 0.92, time: 2, fare: [20, 15], need: 400000,
    blurb: 'Two up, two down, a stable door and a garden full of thrift, forty minutes up the coast. It goes up with the price of houses.' },
  villa: { name: 'villa', icon: '🏝️', price: 680000, upkeep: 2600, let: 36000, keep: 0.92, time: 3, fare: [300, 450], need: 1100000,
    blurb: 'White walls, blue shutters, a pool and a fig tree. Somebody else’s problem eleven months of the year, mostly. Its worth goes up and down with the money over there.' },
};
// How a year's letting falls across the seasons.
export const LET_SHARE = [0.22, 0.48, 0.2, 0.1];

// A day out on the coach: the seaside in spring and summer (where the hard part is finding your lot again on
// a crowded beach), the lights in autumn, the pantomime in winter.
export const RESORTS = ['Skelmouth', 'Brinecombe', 'Westerly Sands'];
export const DAYS = [
  { icon: '🏖️', beach: true, title: (r) => `A day at ${r}`, blurb: (r) => `The coach to the big beach at ${r}: donkeys, a pier, and a thousand windbreaks. Lunch is sandwiches with sand in.` },
  { icon: '🏖️', beach: true, title: (r) => `A day at ${r}`, blurb: (r) => `The coach to the big beach at ${r}, with half the county. Find your spot early, and remember where it is.` },
  { icon: '💡', title: (r) => `The lights at ${r}`, blurb: (r) => `The coach to see the illuminations along the front at ${r}: six miles of bulbs, chips in paper, and home by midnight.` },
  { icon: '🎭', title: () => 'The pantomime in the city', blurb: () => 'The coach to the pantomime in the city: a dame, a cow with two people in it, and shouting “behind you” until you are hoarse.' },
];

// What comes home on the mantelpiece.
export const SOUVENIRS = {
  tent: [['🌰', 'a pine cone'], ['🪨', 'a smooth grey pebble'], ['☕', 'a mug from the farm shop']],
  caravan: [['🍭', 'a stick of rock with the park’s name all the way through it'], ['🔮', 'a snow globe of the beach'], ['🐚', 'a box covered in shells']],
  coach: [['🧺', 'a tea towel with every castle on it'], ['🥄', 'a little spoon for the spoon rack'], ['🪡', 'a thimble']],
  walk: [['🦯', 'a carved walking stick'], ['📛', 'a badge for your rucksack'], ['🍯', 'a jar of heather honey']],
  city: [['🧲', 'a fridge magnet of a cathedral'], ['🎟️', 'the programme from the show'], ['🍪', 'a tin of very fancy biscuits']],
  sun: [['🫏', 'a straw donkey'], ['🍶', 'a bottle of something you will never drink'], ['🍽️', 'a painted plate']],
  cruise: [['🚢', 'a ship in a bottle'], ['🧣', 'a silk scarf from a market'], ['📸', 'a photograph of you with the captain']],
  far: [['🪭', 'a hand-painted fan'], ['🎭', 'a carved mask'], ['🧶', 'a rug that will not fit anywhere']],
  gap: [['🧵', 'a woven bracelet you will never take off'], ['🗺️', 'a map with the route drawn on it in biro'], ['👒', 'a hat you will never wear here']],
  own: [['🍓', 'a jar of jam from the farm down the lane'], ['🪵', 'a driftwood gull'], ['🌿', 'a cutting from the garden']],
};
// What it costs to bring one home.
export const SOUV_COST = { tent: 5, caravan: 10, coach: 15, walk: 20, city: 25, sun: 25, cruise: 40, far: 80, gap: 10, own: 10 };

// The words on the postcards on the fridge, by how it went (worst first).
export const POSTCARDS = [
  ['Weather awful, food worse. Home Saturday, thank God.', 'Raining. Has been since we got here. Wish you were here instead.', 'Not our finest week. Will explain.'],
  ['Mixed weather, mixed feelings. The view is nice.', 'Bed hard, sea cold, chips good.', 'Lovely when it stops raining.'],
  ['Weather lovely, food strange. Wish you were here.', 'Having a lovely time. Back brown and broke.', 'The sea is very blue here. So is the ink.'],
  ['The best week we have ever had. Do not tell anyone.', 'Perfect. We may not come back.', 'Sun, sea, and nobody wanting anything. Bliss.'],
];
export const BAND_WORD = ['A holiday to forget', 'A mixed week', 'A good holiday', 'One to remember'];

// The highlight of the trip of a lifetime, by where it was.
export const WONDERS = [
  'The blossom is out along the river, and the petals come down like snow on the water, and on you.',
  'At dawn a lioness walks past the jeep, close enough to touch, and does not even look at you.',
  'You stand on a glacier in the sunshine, with the sea on one side and the mountains on the other, and run out of words.',
  'The train climbs into the mountains, and for a whole morning there is nothing outside the window but snow, pine trees and sky.',
  'The cloud lifts off the old stone city on the mountain, all at once, like a curtain going up.',
  'The temple at dawn, with the bells going and the light coming up gold on the water steps.',
  'You float over the reef with a mask on, in water so clear it is like flying, and a turtle looks you in the eye.',
];
// Festivals, wherever you are.
export const FESTIVALS = ['a procession with a saint carried shoulder-high through the streets', 'lanterns floated out on the water at dusk', 'a battle with overripe tomatoes in the square', 'an omelette the size of a roundabout', 'a night of bonfires on the beach', 'a brass band in every square, all playing something different'];
