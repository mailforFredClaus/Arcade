// New in Town: everything there is in Starling Bay, as plain lists. The
// places on the map, the careers and their ladders, the college courses,
// homes, things to buy, holidays, shares, and the goals, trophies and
// ribbons. The rules that use them are in engine.js.

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const SEASON_ICON = ['🌸', '☀️', '🍂', '❄️'];
export const STATS = ['smarts', 'fitness', 'charm', 'craft'];
export const STAT_NAME = { smarts: 'Smarts', fitness: 'Fitness', charm: 'Charm', craft: 'Craft' };
export const STAT_ICON = { smarts: '🧠', fitness: '💪', charm: '💬', craft: '🎨' };

// ---- money, written out ----------------------------------------------------------------

export function money(n) {
  const v = Math.round(Math.abs(n));
  return (n < 0 ? '−$' : '$') + v.toLocaleString('en-US');
}
// Short, for tight corners: $1.2M, $34k.
export function cashShort(n) {
  const v = Math.abs(n), sign = n < 0 ? '−' : '';
  if (v >= 1e9) return `${sign}$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${sign}$${(v / 1e6).toFixed(v >= 1e7 ? 1 : 2)}M`;
  if (v >= 1e5) return `${sign}$${Math.round(v / 1e3)}k`;
  return money(n);
}

// ---- the town ---------------------------------------------------------------------------

// x, y: where the place sits on the map (art.js draws it 400 wide, 600 tall).
export const PLACES = {
  home: { name: 'Home', icon: '🏠', x: 200, y: 92, blurb: 'Wherever you hang your hat.' },
  college: { name: 'Starling College', icon: '🎓', x: 72, y: 104, blurb: 'Courses, a quiet library, and a cafeteria best avoided.' },
  hospital: { name: "St Wren's Hospital", icon: '🏥', x: 328, y: 104, blurb: 'Patched up half the town at one time or another.' },
  studios: { name: 'Cannery Studios', icon: '🎨', x: 64, y: 216, blurb: 'An old fish cannery, now full of paint, clay and noise.' },
  townhall: { name: 'Town Hall', icon: '🏛️', x: 200, y: 204, blurb: 'The job board, the council, and a clock that is always four minutes slow.' },
  bank: { name: 'Harbour Bank', icon: '🏦', x: 336, y: 216, blurb: 'Savings, loans, shares and property.' },
  gym: { name: 'Tidewater Gym', icon: '🏋️', x: 66, y: 326, blurb: 'Smells of chlorine and effort.' },
  park: { name: 'Pebble Park', icon: '🌳', x: 200, y: 322, blurb: 'A pond, a bandstand, and ducks with no manners.' },
  highstreet: { name: 'High Street', icon: '🛍️', x: 336, y: 326, blurb: 'If Starling Bay sells it, it sells it here.' },
  pub: { name: 'The Gull & Anchor', icon: '🍻', x: 70, y: 432, blurb: 'Everyone ends up here sooner or later.' },
  station: { name: 'The Station', icon: '🚂', x: 204, y: 428, blurb: 'Trains out of town, and back again.' },
  labs: { name: 'Lighthouse Labs', icon: '💡', x: 338, y: 424, blurb: 'A tech company in the old lighthouse. Free snacks.' },
  casino: { name: 'The Lucky Gull', icon: '🎰', x: 98, y: 532, blurb: 'Bright lights on the end of the pier.' },
  harbour: { name: 'The Harbour', icon: '⚓', x: 262, y: 536, blurb: 'Boats, nets, rope, and gossip.' },
};

// ---- careers ----------------------------------------------------------------------------

// Each career is a ladder. A rung needs skills (and sometimes a course or
// something else) plus a number of shifts worked on the rung below.
// pay: for one shift. stress: how much a shift wears on your mood.
const rung = (title, pay, need = {}) => ({ title, pay, need });
export const SHIFTS_FOR_RUNG = [0, 6, 14, 26, 40, 56];

export const CAREERS = {
  kitchen: {
    name: 'Kitchens', icon: '🍳', place: 'pub', stats: ['craft', 'charm'], stress: 2,
    blurb: 'From the sink to the pass at the Gull & Anchor.',
    rungs: [
      rung('Pot Washer', 1300),
      rung('Waiter', 1700, { charm: 20 }),
      rung('Line Cook', 2300, { craft: 34 }),
      rung('Sous Chef', 3400, { craft: 50, charm: 30, edu: 'culinary' }),
      rung('Head Chef', 5400, { craft: 68, charm: 40 }),
      rung('Celebrity Chef', 10000, { craft: 85, charm: 60 }),
    ],
  },
  retail: {
    name: 'Retail', icon: '🏪', place: 'highstreet', stats: ['charm', 'smarts'], stress: 2,
    blurb: 'Shelves today, the boardroom tomorrow.',
    rungs: [
      rung('Shelf Stacker', 1300),
      rung('Sales Assistant', 1700, { charm: 20 }),
      rung('Supervisor', 2400, { charm: 35, smarts: 20 }),
      rung('Store Manager', 3700, { charm: 50, smarts: 35 }),
      rung('Regional Manager', 6200, { charm: 62, smarts: 50, edu: 'business' }),
      rung('Chief Executive', 14000, { charm: 80, smarts: 70 }),
    ],
  },
  trades: {
    name: 'Building trades', icon: '🔨', place: 'harbour', stats: ['fitness', 'craft'], stress: 2,
    blurb: 'The boatyard always needs another pair of hands.',
    rungs: [
      rung('Labourer', 1500),
      rung('Apprentice', 1900, { fitness: 22 }),
      rung('Carpenter', 2800, { fitness: 35, craft: 30, edu: 'trade' }),
      rung('Site Foreman', 4000, { fitness: 45, craft: 45 }),
      rung('Master Builder', 6400, { craft: 62, fitness: 50 }),
      rung('Construction Boss', 11500, { craft: 75, charm: 45 }),
    ],
  },
  tech: {
    name: 'Tech', icon: '💻', place: 'labs', stats: ['smarts', 'craft'], stress: 2,
    blurb: 'Turning it off and on again, professionally.',
    rungs: [
      rung('IT Helpdesk', 1800, { smarts: 25 }),
      rung('Junior Developer', 2800, { smarts: 40, edu: 'coding' }),
      rung('Developer', 4300, { smarts: 55 }),
      rung('Senior Engineer', 6800, { smarts: 68, edu: 'compsci' }),
      rung('Tech Lead', 10000, { smarts: 80, charm: 35 }),
      rung('Chief Technology Officer', 17000, { smarts: 90, charm: 50 }),
    ],
  },
  medicine: {
    name: 'Medicine', icon: '🩺', place: 'hospital', stats: ['smarts', 'charm'], stress: 3,
    blurb: 'Long hours, and it matters.',
    rungs: [
      rung('Hospital Porter', 1500),
      rung('Care Assistant', 1900, { smarts: 22, edu: 'firstaid' }),
      rung('Nurse', 3300, { smarts: 45, edu: 'nursing' }),
      rung('Junior Doctor', 5800, { smarts: 65, edu: 'medicine' }),
      rung('Doctor', 9500, { smarts: 78, charm: 35 }),
      rung('Chief Surgeon', 19000, { smarts: 92, charm: 45 }),
    ],
  },
  police: {
    name: 'Police', icon: '👮', place: 'townhall', stats: ['fitness', 'smarts'], stress: 3, clean: true,
    blurb: 'Mostly lost cats and parking. Mostly.',
    rungs: [
      rung('Security Guard', 1500, { fitness: 18 }),
      rung('Constable', 2400, { fitness: 35, smarts: 25 }),
      rung('Sergeant', 3500, { fitness: 45, smarts: 38 }),
      rung('Detective', 5200, { smarts: 55, fitness: 45 }),
      rung('Inspector', 7600, { smarts: 68, charm: 45 }),
      rung('Chief of Police', 11500, { smarts: 78, charm: 60 }),
    ],
  },
  law: {
    name: 'Law', icon: '⚖️', place: 'townhall', stats: ['smarts', 'charm'], stress: 3, clean: true,
    blurb: 'Wigs are optional until they are not.',
    rungs: [
      rung('Legal Clerk', 1900, { smarts: 28 }),
      rung('Paralegal', 2900, { smarts: 42 }),
      rung('Solicitor', 5800, { smarts: 60, edu: 'law' }),
      rung('Barrister', 9500, { smarts: 74, charm: 55 }),
      rung('Judge', 16000, { smarts: 88, charm: 60, karma: 10 }),
    ],
  },
  arts: {
    name: 'Music', icon: '🎸', place: 'studios', stats: ['craft', 'charm'], stress: 1, fame: true, swing: 0.4,
    blurb: 'Feast or famine, and loud either way.',
    rungs: [
      rung('Street Performer', 900, { craft: 12 }),
      rung('Gig Musician', 1700, { craft: 28, item: 'guitar' }),
      rung('Band Member', 2800, { craft: 45, charm: 30 }),
      rung('Recording Artist', 5500, { craft: 62, charm: 45 }),
      rung('Headliner', 13000, { craft: 78, charm: 60, fame: 35 }),
      rung('Living Legend', 26000, { craft: 92, charm: 75, fame: 70 }),
    ],
  },
  sports: {
    name: 'Sport', icon: '⚽', place: 'gym', stats: ['fitness', 'charm'], stress: 2, fame: true, retire: 38,
    blurb: 'A short career. Make it count.',
    rungs: [
      rung('Gym Assistant', 1400),
      rung('Personal Trainer', 2200, { fitness: 35, charm: 20 }),
      rung('Semi-Pro Athlete', 3300, { fitness: 55 }),
      rung('Pro Athlete', 8500, { fitness: 72 }),
      rung('Team Captain', 17000, { fitness: 85, charm: 50 }),
      rung('National Champion', 34000, { fitness: 95, charm: 60 }),
    ],
  },
  teaching: {
    name: 'Teaching', icon: '🍎', place: 'college', stats: ['smarts', 'charm'], stress: 1, summer: true,
    blurb: 'Long summers. You will earn them.',
    rungs: [
      rung('Teaching Assistant', 1600, { smarts: 25 }),
      rung('Teacher', 2900, { smarts: 45, edu: 'teachdip' }),
      rung('Senior Teacher', 4000, { smarts: 55, charm: 40 }),
      rung('Lecturer', 5600, { smarts: 68, degree: true }),
      rung('Professor', 8800, { smarts: 82, charm: 50 }),
      rung('Dean', 13000, { smarts: 90, charm: 65 }),
    ],
  },
  sea: {
    name: 'The sea', icon: '🎣', place: 'harbour', stats: ['fitness', 'smarts'], stress: 2,
    blurb: 'Cold, wet, and the best office in the world.',
    rungs: [
      rung('Deckhand', 1600, { fitness: 15 }),
      rung('Fisher', 2300, { fitness: 30 }),
      rung('Bosun', 3300, { fitness: 45, smarts: 25 }),
      rung('Skipper', 5200, { fitness: 50, smarts: 40, edu: 'skipper' }),
      rung('Captain', 8200, { smarts: 55, charm: 40 }),
      rung('Harbour Master', 12000, { smarts: 68, charm: 55 }),
    ],
  },
  finance: {
    name: 'Banking', icon: '📈', place: 'bank', stats: ['smarts', 'charm'], stress: 3,
    blurb: "Other people's money, carefully.",
    rungs: [
      rung('Bank Teller', 1800, { smarts: 22, charm: 15 }),
      rung('Loan Officer', 2800, { smarts: 38, charm: 30 }),
      rung('Analyst', 4600, { smarts: 55, edu: 'business' }),
      rung('Fund Manager', 9500, { smarts: 70, charm: 45 }),
      rung('Bank Director', 17000, { smarts: 82, charm: 60 }),
      rung('Chair of the Bank', 29000, { smarts: 92, charm: 72 }),
    ],
  },
  politics: {
    name: 'Politics', icon: '🗳️', place: 'townhall', stats: ['charm', 'smarts'], stress: 2, clean: true, fame: true,
    blurb: 'Bins, potholes, and one day the big chain of office.',
    rungs: [
      rung('Campaign Volunteer', 800),
      rung('Council Aide', 2100, { charm: 30 }),
      rung('Councillor', 3900, { charm: 50, smarts: 35, karma: 10 }),
      rung('Deputy Mayor', 6800, { charm: 68, smarts: 50, karma: 25 }),
      rung('Mayor', 11500, { charm: 82, smarts: 60, karma: 35, flag: 'elected' }),
    ],
  },
};

// ---- college ----------------------------------------------------------------------------

// classes: how many times you attend before it's done. cost: for the whole
// course, paid a class at a time.
export const COURSES = {
  firstaid: { name: 'First Aid Certificate', icon: '🩹', cost: 400, classes: 2, need: {} },
  culinary: { name: 'Culinary Certificate', icon: '🔪', cost: 1600, classes: 4, need: {} },
  trade: { name: 'Trade Papers', icon: '📐', cost: 1600, classes: 4, need: {} },
  skipper: { name: "Skipper's Ticket", icon: '🧭', cost: 2000, classes: 4, need: {} },
  coding: { name: 'Coding Bootcamp', icon: '⌨️', cost: 2500, classes: 5, need: { smarts: 30 } },
  teachdip: { name: 'Teaching Diploma', icon: '🍎', cost: 5600, classes: 8, need: { smarts: 40 } },
  nursing: { name: 'Nursing Diploma', icon: '💉', cost: 6400, classes: 8, need: { smarts: 40, edu: 'firstaid' } },
  finearts: { name: 'Fine Arts Degree', icon: '🖼️', cost: 10000, classes: 10, need: { craft: 40 }, degree: true },
  business: { name: 'Business Degree', icon: '📊', cost: 14400, classes: 12, need: { smarts: 45 }, degree: true },
  compsci: { name: 'Computer Science Degree', icon: '🖥️', cost: 16800, classes: 12, need: { smarts: 55 }, degree: true },
  law: { name: 'Law Degree', icon: '📜', cost: 22400, classes: 14, need: { smarts: 55 }, degree: true },
  medicine: { name: 'Medical Degree', icon: '🧬', cost: 40000, classes: 20, need: { smarts: 62 }, degree: true },
};

// ---- homes ------------------------------------------------------------------------------

// rent: each season. price: to buy (null if it can only be rented).
// comfort lifts your mood; kids: how many children there's room for.
export const HOMES = {
  hostel: { name: 'Bunk at the Seagull Hostel', icon: '🛏️', rent: 500, price: null, comfort: 0, kids: 0, tier: 0, blurb: 'Eleven roommates. One of them snores in Morse code.' },
  bedsit: { name: 'Bedsit over the chip shop', icon: '🍟', rent: 1200, price: null, comfort: 5, kids: 0, tier: 1, blurb: 'Yours alone. Everything you own smells of vinegar.' },
  flat: { name: 'Harbour-view flat', icon: '🏢', rent: 2400, price: 140000, comfort: 9, kids: 1, tier: 2, blurb: 'One bedroom and, if you lean out, the sea.' },
  cottage: { name: "Fisherman's cottage", icon: '🏡', rent: 3600, price: 260000, comfort: 13, kids: 2, tier: 3, blurb: 'Low beams, a wood stove and a little garden.' },
  townhouse: { name: 'High Street townhouse', icon: '🏘️', rent: 6000, price: 480000, comfort: 16, kids: 3, tier: 4, blurb: 'Four floors. You will lose your keys on all of them.' },
  villa: { name: 'Clifftop villa', icon: '🌅', rent: null, price: 1200000, comfort: 19, kids: 4, tier: 5, blurb: 'Glass, sky and sea. The gulls look up to you now.' },
  manor: { name: 'Starling Manor', icon: '🏰', rent: null, price: 4000000, comfort: 22, kids: 6, tier: 6, blurb: 'The big house on the hill. It has a name. It has a maze.' },
};

// ---- things to buy ----------------------------------------------------------------------

export const ITEMS = {
  bike: { name: 'Bicycle', icon: '🚲', price: 400, at: 'highstreet', sec: 'Getting about', blurb: 'One more block of time every season.' },
  car: { name: 'Second-hand hatchback', icon: '🚗', price: 9000, at: 'highstreet', sec: 'Getting about', blurb: 'Two more blocks of time every season. Costs $300 a season to run.' },
  sportscar: { name: 'Sports car', icon: '🏎️', price: 85000, at: 'highstreet', sec: 'Getting about', blurb: 'Two more blocks of time, heads turn (Charm grows faster), and it cheers you up.' },
  phone: { name: 'Phone', icon: '📱', price: 600, at: 'highstreet', sec: 'Handy', blurb: 'Friends drift away more slowly, and you can try the dating app.' },
  laptop: { name: 'Laptop', icon: '💻', price: 1400, at: 'highstreet', sec: 'Handy', blurb: 'Take freelance gigs, and write a novel at home.' },
  books: { name: 'Shelf of good books', icon: '📚', price: 450, at: 'highstreet', sec: 'Handy', blurb: 'Smarts grows a little faster.' },
  suit: { name: 'Tailored outfit', icon: '👔', price: 1200, at: 'highstreet', sec: 'Handy', blurb: 'Charm grows a little faster.' },
  guitar: { name: 'Guitar', icon: '🎸', price: 500, at: 'highstreet', sec: 'Hobbies', blurb: 'Practise at home, busk in the park.' },
  easel: { name: 'Easel and paints', icon: '🖌️', price: 300, at: 'highstreet', sec: 'Hobbies', blurb: 'Paint in the park, and sell what you paint.' },
  rod: { name: 'Fishing rod', icon: '🎣', price: 250, at: 'highstreet', sec: 'Hobbies', blurb: 'Fish off the harbour wall.' },
  weights: { name: 'Home gym', icon: '🏋️', price: 900, at: 'highstreet', sec: 'Hobbies', blurb: 'Work out at home for nothing.' },
  surfboard: { name: 'Surfboard', icon: '🏄', price: 700, at: 'highstreet', sec: 'Hobbies', blurb: 'Surf the bay (not in winter).' },
  tv: { name: 'Big television', icon: '📺', price: 1000, at: 'highstreet', sec: 'For the home', blurb: 'Resting at home cheers you up more.' },
  bed: { name: 'Proper mattress', icon: '🛌', price: 1500, at: 'highstreet', sec: 'For the home', blurb: 'Resting at home does your health more good.' },
  piano: { name: 'Upright piano', icon: '🎹', price: 6000, at: 'highstreet', sec: 'For the home', blurb: 'Craft grows a little faster.' },
  ring: { name: 'Engagement ring', icon: '💍', price: 3000, at: 'highstreet', sec: 'Special', blurb: 'For asking a very big question.' },
  watch: { name: 'Gold watch', icon: '⌚', price: 15000, at: 'highstreet', sec: 'Special', blurb: 'Tells the time, expensively. Charm grows a little faster.' },
  boat: { name: 'Little sailing boat', icon: '⛵', price: 45000, at: 'harbour', sec: 'Special', blurb: 'Sail the bay whenever you like, and better fishing.' },
};

// ---- holidays ---------------------------------------------------------------------------

export const TRIPS = {
  camping: { name: 'Camping up the coast', icon: '⛺', cost: 300, time: 2, joy: 8, hp: 3 },
  city: { name: 'Weekend in the big city', icon: '🌆', cost: 900, time: 2, joy: 10, stat: 'charm' },
  lakes: { name: 'Walking in the lakes', icon: '🥾', cost: 1400, time: 3, joy: 12, hp: 5, stat: 'fitness' },
  ski: { name: 'Skiing in the mountains', icon: '⛷️', cost: 3800, time: 3, joy: 15, stat: 'fitness', only: 3 },
  islands: { name: 'Tropical islands', icon: '🏝️', cost: 5200, time: 3, joy: 20, hp: 5 },
  museums: { name: 'Old cities and museums', icon: '🏛️', cost: 6500, time: 3, joy: 15, stat: 'smarts' },
  safari: { name: 'Safari', icon: '🦒', cost: 12000, time: 3, joy: 22, stat: 'craft' },
  world: { name: 'Round the world', icon: '🌍', cost: 32000, time: 5, joy: 32, hp: 4, stat: 'charm' },
};

// ---- the bank ---------------------------------------------------------------------------

export const SAVINGS_RATE = 0.01; // a season
export const LOAN_RATE = 0.02;

// drift and swing: how a share's price moves each season.
export const STOCKS = {
  GULL: { name: 'Gull & Co. Fisheries', icon: '🐟', start: 40, drift: 0.007, swing: 0.025, blurb: 'Steady as the tide.' },
  BRCK: { name: 'Bay Brick & Timber', icon: '🧱', start: 60, drift: 0.008, swing: 0.07, blurb: 'Grows when the town does.' },
  SNCK: { name: 'Snack Shack Holdings', icon: '🍩', start: 25, drift: 0.007, swing: 0.1, blurb: 'Doughnuts are a volatile business.' },
  LITE: { name: 'Lighthouse Labs', icon: '💡', start: 80, drift: 0.01, swing: 0.13, blurb: 'The future. Probably.' },
  MOON: { name: 'Moonshot Mining', icon: '🚀', start: 10, drift: -0.012, swing: 0.24, blurb: 'Either a fortune or a lesson.' },
};

// Places to rent out. earn: each season, as a share of what it's worth.
export const PROPS = {
  garage: { name: 'Lock-up garage', icon: '🚪', price: 30000, earn: 0.018 },
  rental: { name: 'Rental flat', icon: '🏢', price: 160000, earn: 0.018 },
  guesthouse: { name: 'Seafront guesthouse', icon: '🏨', price: 600000, earn: 0.02 },
  arcade: { name: 'Shopping arcade', icon: '🏬', price: 2400000, earn: 0.021 },
};

// ---- people -----------------------------------------------------------------------------

export const NAMES = ['Alex', 'Sam', 'Robin', 'Jo', 'Casey', 'Morgan', 'Riley', 'Jamie', 'Taylor', 'Charlie', 'Frankie', 'Remi', 'Noor', 'Kit', 'Ash', 'Devon', 'Jules', 'Sasha', 'Nico', 'Quinn', 'Ellis', 'Rowan', 'Harper', 'Indy', 'Lou', 'Max', 'Toni', 'Bobbie', 'Dara', 'Emery', 'Wren', 'Skye', 'Marlo', 'Sunny', 'Ari', 'Billie', 'Cam', 'Drew', 'Eden', 'Flynn', 'Gray', 'Hollis', 'Ira', 'Jesse', 'Kai', 'Lane', 'Mika', 'Nat', 'Ola', 'Pat', 'Rene', 'Sage', 'Tate', 'Uma', 'Val', 'Zia', 'Bao', 'Chidi', 'Dev', 'Eun', 'Femi', 'Goran', 'Hana', 'Imani', 'Jun', 'Kofi', 'Lina', 'Mei', 'Nia', 'Omar', 'Priya', 'Rafa', 'Soren', 'Tariq', 'Yuki', 'Zofia'];
export const SURNAMES = ['Pemberton', 'Okafor', 'Marlow', 'Finch', 'Delgado', 'Winterbourne', 'Achebe', 'Hartley', 'Kowalski', 'Nakamura', 'Brightwater', 'Singh', 'Tregenza', 'Larkin', 'Mbeki', 'Castellan', 'Quayle', 'Fairweather', 'Abara', 'Penhallow', 'Sorensen', 'Whitlock', 'Yamada', 'Oyelaran', 'Drake', 'Calloway', 'Ferreira', 'Nightingale', 'Thackeray', 'Vance'];
export const PET_NAMES = ['Biscuit', 'Pickle', 'Captain', 'Mango', 'Pebble', 'Scampi', 'Noodle', 'Admiral', 'Crumpet', 'Kipper', 'Waffles', 'Barnacle', 'Dumpling', 'Gizmo', 'Marmite', 'Sprout'];
export const PETS = {
  dog: { name: 'dog', icon: '🐕', life: 14 },
  cat: { name: 'cat', icon: '🐈', life: 17 },
  rabbit: { name: 'rabbit', icon: '🐇', life: 9 },
  parrot: { name: 'parrot', icon: '🦜', life: 45 },
};

// What a friend is like: time with them rubs off on you.
export const TRAITS = {
  bookish: { name: 'Bookish', stat: 'smarts', icon: '📖' },
  sporty: { name: 'Sporty', stat: 'fitness', icon: '🏃' },
  witty: { name: 'Witty', stat: 'charm', icon: '😄' },
  arty: { name: 'Arty', stat: 'craft', icon: '🎭' },
  kind: { name: 'Kind', stat: null, icon: '🤗' },
};

// ---- starting out -----------------------------------------------------------------------

export const BACKGROUNDS = {
  bookworm: { name: 'Bookworm', icon: '📚', blurb: 'Smarts +12', give: { smarts: 12 } },
  athlete: { name: 'Athlete', icon: '🏃', blurb: 'Fitness +12', give: { fitness: 12 } },
  charmer: { name: 'Charmer', icon: '😄', blurb: 'Charm +12', give: { charm: 12 } },
  maker: { name: 'Maker', icon: '🛠️', blurb: 'Craft +12', give: { craft: 12 } },
  saver: { name: 'Saver', icon: '🐷', blurb: '$3,000 extra', give: { cash: 3000 } },
  allrounder: { name: 'All-rounder', icon: '⭐', blurb: 'Everything +4', give: { smarts: 4, fitness: 4, charm: 4, craft: 4 } },
};

// The look of a character: indexes into these.
export const LOOKS = {
  skin: ['#ffe0c2', '#f5c9a0', '#dfa678', '#b97a50', '#8a5636', '#5e3a22'],
  hair: ['#2b2118', '#5a3a22', '#8a5a2b', '#c98a3c', '#e8c36a', '#b5432e', '#1d1d2b', '#d95f9c', '#3a8fc9'],
  top: ['#ff6b5e', '#2aa7b8', '#ffc93c', '#7cc36a', '#8a6cf0', '#f28ab2', '#3d4a6b', '#ff9a3c'],
  styles: 6,
};

// ---- dreams -----------------------------------------------------------------------------

// A life picks three. test(L) says whether it has come true (L is the Life).
export const DREAMS = {
  ownhome: { name: 'A place of my own', icon: '🏡', desc: 'Own your home.', test: (L) => L.s.owned },
  manor: { name: 'Lord of the manor', icon: '🏰', desc: 'Own Starling Manor.', test: (L) => L.s.owned && L.s.home === 'manor' },
  million: { name: 'Millionaire', icon: '💰', desc: 'Be worth $1,000,000.', test: (L) => L.netWorth() >= 1e6 },
  top: { name: 'Top of the ladder', icon: '🪜', desc: 'Reach the top of any career.', test: (L) => !!L.s.f.top },
  family: { name: 'A family of my own', icon: '👨‍👩‍👧', desc: 'Marry and raise two children.', test: (L) => L.s.f.wed && L.kids().length >= 2 },
  doctor: { name: 'Doctor', icon: '🩺', desc: 'Become a doctor.', test: (L) => L.s.job && L.s.job.c === 'medicine' && L.s.job.r >= 4 },
  star: { name: 'Famous', icon: '🌟', desc: 'Reach 60 fame.', test: (L) => L.s.fame >= 60 },
  novel: { name: 'Novelist', icon: '📖', desc: 'Write and publish a novel.', test: (L) => (L.s.n.books || 0) >= 1 },
  travel: { name: 'See the world', icon: '🧳', desc: 'Take six different holidays.', test: (L) => Object.keys(L.s.trips).length >= 6 },
  boat: { name: 'A boat of my own', icon: '⛵', desc: 'Own a sailing boat.', test: (L) => !!L.s.items.boat },
  degree: { name: 'Letters after my name', icon: '🎓', desc: 'Earn a degree.', test: (L) => L.hasDegree() },
  iron: { name: 'Peak condition', icon: '💪', desc: 'Reach 90 Fitness.', test: (L) => L.s.st.fitness >= 90 },
  mayor: { name: 'Mayor of Starling Bay', icon: '🏛️', desc: 'Be elected mayor.', test: (L) => L.s.job && L.s.job.c === 'politics' && L.s.job.r >= 4 },
  beloved: { name: 'Beloved', icon: '💞', desc: 'Have four people who adore you (80 bond).', test: (L) => L.s.people.filter((p) => p.bond >= 80).length >= 4 },
  giver: { name: 'Give it away', icon: '🎁', desc: 'Donate $100,000 to good causes.', test: (L) => (L.s.n.given || 0) >= 1e5 },
  pet: { name: 'Old friends', icon: '🐾', desc: 'Keep a pet for ten years.', test: (L) => L.s.pet && L.s.t - L.s.pet.since >= 40 },
};

// ---- the to-do list ---------------------------------------------------------------------

// A guide through the first few years, one step at a time.
export const QUESTS = [
  { text: 'Find work: the Town Hall has a job board', test: (L) => !!L.s.job || L.s.n.shifts > 0, cash: 100 },
  { text: 'Work a shift (your workplace is marked on the map)', test: (L) => L.s.n.shifts > 0, cash: 100 },
  { text: 'Out of time? Tap Next to move on a season', test: (L) => L.s.t > 0, cash: 100 },
  { text: 'Train any skill to 25: try the library, gym, pub or studios', test: (L) => STATS.some((k) => L.s.st[k] >= 25), cash: 200 },
  { text: 'Buy a bicycle on the High Street for more time', test: (L) => L.s.items.bike || L.s.items.car || L.s.items.sportscar, cash: 100 },
  { text: 'Make a friend: chat to people at the pub or the park', test: (L) => L.s.people.some((p) => p.kind !== 'parent'), cash: 150 },
  { text: 'Move out of the hostel (Home, then Move house)', test: (L) => L.s.home !== 'hostel', cash: 300 },
  { text: 'Earn a promotion (Me shows what the next step needs)', test: (L) => !!L.s.f.promoted, cash: 400 },
  { text: 'Put $2,000 into savings at the bank', test: (L) => L.s.bank >= 2000, cash: 200 },
  { text: 'Finish a course at the college', test: (L) => Object.keys(L.s.edu).length > 0, cash: 500 },
  { text: 'Take a holiday from the station', test: (L) => Object.keys(L.s.trips).length > 0, cash: 300 },
  { text: 'Make one of your dreams come true', test: (L) => Object.keys(L.s.dreamDone).length > 0, cash: 1000 },
];

// ---- trophies ---------------------------------------------------------------------------

// Kept for good, across every life. Checked as you play (and once more at the end).
export const TROPHIES = {
  job: { name: 'Gainfully employed', icon: '💼', desc: 'Get a job.', test: (L) => !!L.s.job },
  promo: { name: 'Moving up', icon: '📈', desc: 'Earn a promotion.', test: (L) => !!L.s.f.promoted },
  top: { name: 'Top of the ladder', icon: '🪜', desc: 'Reach the top of a career.', test: (L) => !!L.s.f.top },
  careers3: { name: 'Jack of all trades', icon: '🃏', desc: 'Work in three different careers in one life.', test: (L) => Object.keys(L.s.worked).length >= 3 },
  shifts: { name: 'Workhorse', icon: '🐴', desc: 'Work 300 shifts in one life.', test: (L) => L.s.n.shifts >= 300 },
  cert: { name: 'Qualified', icon: '📄', desc: 'Finish a course.', test: (L) => Object.keys(L.s.edu).length >= 1 },
  degree: { name: 'Graduate', icon: '🎓', desc: 'Earn a degree.', test: (L) => L.hasDegree() },
  edu4: { name: 'Eternal student', icon: '🦉', desc: 'Finish four courses in one life.', test: (L) => Object.keys(L.s.edu).length >= 4 },
  stat50: { name: 'All-rounder', icon: '⭐', desc: 'Have every skill at 50.', test: (L) => STATS.every((k) => L.s.st[k] >= 50) },
  stat100: { name: 'Mastery', icon: '🏅', desc: 'Take a skill all the way to 100.', test: (L) => STATS.some((k) => L.s.st[k] >= 99.5) },
  k100: { name: 'Six figures', icon: '💵', desc: 'Be worth $100,000.', test: (L) => L.netWorth() >= 1e5 },
  m1: { name: 'Millionaire', icon: '💰', desc: 'Be worth $1,000,000.', test: (L) => L.netWorth() >= 1e6 },
  m10: { name: 'Tycoon', icon: '👑', desc: 'Be worth $10,000,000.', test: (L) => L.netWorth() >= 1e7 },
  owner: { name: 'Keys to the door', icon: '🔑', desc: 'Buy a home.', test: (L) => L.s.owned },
  manor: { name: 'Lord of the manor', icon: '🏰', desc: 'Own Starling Manor.', test: (L) => L.s.owned && L.s.home === 'manor' },
  landlord: { name: 'Landlord', icon: '🏘️', desc: 'Own three places to rent out.', test: (L) => Object.values(L.s.props).reduce((a, n) => a + n, 0) >= 3 },
  shares: { name: 'Bull market', icon: '🐂', desc: 'Hold $250,000 in shares.', test: (L) => L.sharesWorth() >= 250000 },
  friend: { name: 'A friendly face', icon: '🙂', desc: 'Make a friend.', test: (L) => L.s.people.some((p) => p.kind === 'friend') },
  popular: { name: 'Popular', icon: '🎉', desc: 'Have three close friends (70 bond).', test: (L) => L.s.people.filter((p) => p.kind === 'friend' && p.bond >= 70).length >= 3 },
  wed: { name: 'Just married', icon: '💒', desc: 'Get married.', test: (L) => !!L.s.f.wed },
  parent: { name: 'New arrival', icon: '🍼', desc: 'Have a child.', test: (L) => L.kids().length >= 1 },
  grand: { name: 'Grandparent', icon: '👵', desc: 'Become a grandparent.', test: (L) => !!L.s.f.grand },
  pet: { name: 'Best friend', icon: '🐾', desc: 'Adopt a pet.', test: (L) => !!L.s.pet },
  novel: { name: 'Novelist', icon: '📖', desc: 'Publish a novel.', test: (L) => (L.s.n.books || 0) >= 1 },
  best: { name: 'Bestseller', icon: '🏆', desc: 'Write a bestseller.', test: (L) => !!L.s.f.bestseller },
  show: { name: 'Private view', icon: '🖼️', desc: 'Hold an exhibition of your paintings.', test: (L) => !!L.s.f.exhibited },
  band: { name: 'The Tidal Waves', icon: '🎤', desc: 'Form a band with Dee.', test: (L) => !!L.s.f.band },
  famous: { name: 'Household name', icon: '🌟', desc: 'Reach 80 fame.', test: (L) => L.s.fame >= 80 },
  bream: { name: 'The golden bream', icon: '🐠', desc: 'Catch the fish of legend.', test: (L) => !!L.s.f.bream },
  fish: { name: 'Fish supper', icon: '🎣', desc: 'Catch fifty fish in one life.', test: (L) => (L.s.n.fish || 0) >= 50 },
  treasure: { name: 'X marks the spot', icon: '🗺️', desc: 'Follow the bottle to the treasure.', test: (L) => !!L.s.f.treasure },
  marlow: { name: "Marlow's mate", icon: '🧓', desc: 'Earn old Marlow’s trust.', test: (L) => (L.s.f.marlow || 0) >= 3 },
  mayor: { name: 'Chain of office', icon: '🏛️', desc: 'Be elected mayor.', test: (L) => L.s.job && L.s.job.c === 'politics' && L.s.job.r >= 4 },
  trips: { name: 'Globetrotter', icon: '🧳', desc: 'Take all eight holidays.', test: (L) => Object.keys(L.s.trips).length >= 8 },
  jackpot: { name: 'Jackpot!', icon: '💎', desc: 'Hit three diamonds on the slots.', test: (L) => !!L.s.f.jackpot },
  streak: { name: 'On a roll', icon: '🔥', desc: 'Call six cards right in a row at Higher or Lower.', test: (L) => (L.s.n.streak || 0) >= 6 },
  saint: { name: 'Good egg', icon: '😇', desc: 'Be known as a saint.', test: (L) => L.s.karma >= 60 },
  giver: { name: 'Philanthropist', icon: '🎁', desc: 'Donate $100,000.', test: (L) => (L.s.n.given || 0) >= 1e5 },
  jail: { name: 'Jailbird', icon: '⛓️', desc: 'Spend time behind bars.', test: (L) => !!L.s.f.jailed },
  bust: { name: 'Flat broke', icon: '🕳️', desc: 'Go bankrupt.', test: (L) => !!L.s.f.bust },
  dream1: { name: 'Dream come true', icon: '✨', desc: 'Make a dream come true.', test: (L) => Object.keys(L.s.dreamDone).length >= 1 },
  dream3: { name: 'Living the dream', icon: '🌈', desc: 'Make all three dreams come true in one life.', test: (L) => Object.keys(L.s.dreamDone).length >= 3 },
  age90: { name: 'Evergreen', icon: '🌲', desc: 'Live to 90.', test: (L) => L.s.age >= 90 },
  age100: { name: 'Telegram from the palace', icon: '💯', desc: 'Live to 100.', test: (L) => L.s.age >= 100 },
  gen3: { name: 'Dynasty', icon: '🌳', desc: 'Reach the third generation of your family.', test: (L) => L.s.gen >= 3 },
};

// ---- ribbons and heirlooms --------------------------------------------------------------

// A life earns one ribbon at its end: the first in this list that fits.
// Earning a ribbon unlocks its heirloom, which a later life can bring along.
export const RIBBONS = [
  { id: 'young', name: 'Gone Too Soon', icon: '🕯️', desc: 'Died before 45.', test: (L) => L.s.age < 45,
    heir: { name: 'Lucky horseshoe', icon: '🧲', desc: 'Start with better health, and it holds up longer.' } },
  { id: 'tycoon', name: 'The Tycoon', icon: '👑', desc: 'Died worth $5,000,000 or more.', test: (L) => L.netWorth() >= 5e6,
    heir: { name: 'Signet ring', icon: '💍', desc: 'Start with $6,000 more, and savings earn more.' } },
  { id: 'star', name: 'The Star', icon: '🌟', desc: 'Died famous (70 fame).', test: (L) => L.s.fame >= 70,
    heir: { name: 'Signed guitar', icon: '🎸', desc: 'Start with a guitar; Craft grows faster.' } },
  { id: 'mayor', name: 'Pillar of the Bay', icon: '🏛️', desc: 'Was mayor, or a saint.', test: (L) => !!L.s.f.wasMayor || L.s.karma >= 80,
    heir: { name: 'Key to the town', icon: '🗝️', desc: 'Charm grows faster.' } },
  { id: 'healer', name: 'The Healer', icon: '🩺', desc: 'Became a doctor.', test: (L) => !!L.s.f.wasDoctor,
    heir: { name: "Old doctor's bag", icon: '💼', desc: 'Hospital visits cost half and do more good.' } },
  { id: 'scholar', name: 'The Scholar', icon: '🎓', desc: 'Smarts of 90, and a degree.', test: (L) => L.s.st.smarts >= 90 && L.hasDegree(),
    heir: { name: 'Annotated library', icon: '📚', desc: 'Smarts grows faster.' } },
  { id: 'champion', name: 'The Champion', icon: '🏆', desc: 'Fitness of 90.', test: (L) => L.s.st.fitness >= 90,
    heir: { name: 'Lucky trainers', icon: '👟', desc: 'Fitness grows faster.' } },
  { id: 'artist', name: 'The Master', icon: '🎨', desc: 'Craft of 90.', test: (L) => L.s.st.craft >= 90,
    heir: { name: 'Paint-stained easel', icon: '🖌️', desc: 'Start with an easel; paintings and novels earn more.' } },
  { id: 'heart', name: 'Heart of the Family', icon: '❤️', desc: 'Married, with two children who love you.', test: (L) => L.s.f.wed && L.kids().filter((k) => k.bond >= 60).length >= 2,
    heir: { name: 'Family album', icon: '📔', desc: 'A happier outlook on everything.' } },
  { id: 'rogue', name: 'The Rogue', icon: '🦊', desc: 'Ran a dozen errands for Shady Sal.', test: (L) => (L.s.n.crimes || 0) >= 12,
    heir: { name: 'Loaded dice', icon: '🎲', desc: 'Sal’s errands are safer and the casino is kinder.' } },
  { id: 'salt', name: 'Old Salt', icon: '⚓', desc: 'Captained a ship, or caught 100 fish.', test: (L) => !!L.s.f.wasCaptain || (L.s.n.fish || 0) >= 100,
    heir: { name: 'Brass compass', icon: '🧭', desc: 'Start with a rod; every catch is worth double.' } },
  { id: 'globe', name: 'The Globetrotter', icon: '🧳', desc: 'Took all eight holidays.', test: (L) => Object.keys(L.s.trips).length >= 8,
    heir: { name: 'Battered suitcase', icon: '🧳', desc: 'Holidays cost half.' } },
  { id: 'gambler', name: 'High Roller', icon: '🎰', desc: 'Left the casino $50,000 up.', test: (L) => (L.s.n.casino || 0) >= 50000,
    heir: { name: 'Lucky coin', icon: '🪙', desc: 'Better odds whenever life asks you to take a chance.' } },
  { id: 'evergreen', name: 'The Evergreen', icon: '🌲', desc: 'Lived to 92.', test: (L) => L.s.age >= 92,
    heir: { name: 'Good genes', icon: '🧬', desc: 'A longer life.' } },
  { id: 'quiet', name: 'A Quiet Life', icon: '🍂', desc: 'Lived, and that was enough.', test: () => true,
    heir: { name: "Grandma's quilt", icon: '🧶', desc: 'Resting does you more good.' } },
];
export const RIBBON = Object.fromEntries(RIBBONS.map((r) => [r.id, r]));
