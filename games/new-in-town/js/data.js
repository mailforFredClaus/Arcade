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
// A name said in the middle of a sentence: "the harbour-view flat", but
// "the High Street townhouse".
export const low = (name) => (/^(High Street|Starling)/.test(name) ? name : name[0].toLowerCase() + name.slice(1));
export function cashShort(n) {
  const v = Math.abs(n), sign = n < 0 ? '−' : '';
  if (v >= 1e9) return `${sign}$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${sign}$${(v / 1e6).toFixed(v >= 1e7 ? 1 : 2)}M`;
  if (v >= 999500) return `${sign}$1.00M`;
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
// entry: a qualification lets you start partway up (course: which rung),
// so a medical degree makes you a junior doctor, not a porter.
// pay: for one shift. stress: how much a shift wears on your mood.
const rung = (title, pay, need = {}) => ({ title, pay, need });
export const SHIFTS_FOR_RUNG = [0, 6, 14, 26, 40, 56];

export const CAREERS = {
  kitchen: {
    name: 'Kitchens', entry: { culinary: 2 }, icon: '🍳', place: 'pub', stats: ['craft', 'charm'], stress: 2,
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
    name: 'Retail', entry: { business: 2, mba: 3 }, icon: '🏪', place: 'highstreet', stats: ['charm', 'smarts'], stress: 2,
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
    name: 'Building trades', entry: { trade: 2 }, icon: '🔨', place: 'harbour', stats: ['fitness', 'craft'], stress: 2,
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
    name: 'Tech', entry: { coding: 1, compsci: 2 }, icon: '💻', place: 'labs', stats: ['smarts', 'craft'], stress: 2,
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
    name: 'Medicine', entry: { firstaid: 1, nursing: 2, medicine: 3 }, icon: '🩺', place: 'hospital', stats: ['smarts', 'charm'], stress: 3,
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
    name: 'Police', entry: { academy: 1 }, icon: '👮', place: 'townhall', stats: ['fitness', 'smarts'], stress: 3, clean: true,
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
    name: 'Law', entry: { law: 2 }, icon: '⚖️', place: 'townhall', stats: ['smarts', 'charm'], stress: 3, clean: true,
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
    name: 'Music', entry: { musicdip: 2 }, icon: '🎸', place: 'studios', stats: ['craft', 'charm'], stress: 1, fame: true, swing: 0.4,
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
    name: 'Sport', entry: { sportsdip: 1 }, icon: '⚽', place: 'gym', stats: ['fitness', 'charm'], stress: 2, fame: true, retire: 38,
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
    name: 'Teaching', entry: { teachdip: 1, phd: 3 }, icon: '🍎', place: 'college', stats: ['smarts', 'charm'], stress: 1, summer: true,
    blurb: 'Long summers. You will earn them.',
    rungs: [
      rung('Teaching Assistant', 1600, { smarts: 25 }),
      rung('Teacher', 2900, { smarts: 45, edu: 'teachdip' }),
      rung('Senior Teacher', 4000, { smarts: 55, charm: 40 }),
      rung('Lecturer', 5600, { smarts: 68, degree: true }),
      rung('Professor', 8800, { smarts: 82, charm: 50, edu: 'phd' }),
      rung('Dean', 13000, { smarts: 90, charm: 65 }),
    ],
  },
  sea: {
    name: 'The sea', entry: { skipper: 2 }, icon: '🎣', place: 'harbour', stats: ['fitness', 'smarts'], stress: 2,
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
    name: 'Banking', entry: { business: 2, mba: 3 }, icon: '📈', place: 'bank', stats: ['smarts', 'charm'], stress: 3,
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
  // Not on the job board at the Town Hall: you ask in Sal's back room.
  // Every shift is a crime, and may end with a hand on your collar.
  crew: {
    name: 'Sal\u2019s crew', icon: '🦊', place: 'harbour', stats: ['fitness', 'charm'], stress: 2, shady: true,
    blurb: 'Nobody hands in their notice.',
    rungs: [
      rung('Lookout', 2200, { crimes: 3 }),
      rung('Runner', 3400, { fitness: 30, crimes: 8 }),
      rung('Enforcer', 5600, { fitness: 50, crimes: 15, bad: 10 }),
      rung('Fixer', 9500, { charm: 50, smarts: 45, crimes: 25, bad: 20 }),
      rung('Underboss', 17000, { charm: 65, smarts: 60, bad: 35 }),
      rung('Boss of the Bay', 32000, { charm: 78, smarts: 70, bad: 50 }),
    ],
  },
  politics: {
    name: 'Politics', entry: { degree: 1 }, icon: '🗳️', place: 'townhall', stats: ['charm', 'smarts'], stress: 2, clean: true, fame: true,
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

// classes: how many times you attend before the exam. cost: for the whole
// course, paid a class at a time (or put on a student loan).
// covers: lesser courses this one stands in for wherever they are asked for.
export const COURSES = {
  firstaid: { name: 'First Aid Certificate', icon: '🩹', cost: 400, classes: 2, need: {} },
  culinary: { name: 'Culinary Certificate', icon: '🔪', cost: 1600, classes: 4, need: {} },
  trade: { name: 'Trade Papers', icon: '📐', cost: 1600, classes: 4, need: {} },
  skipper: { name: "Skipper's Ticket", icon: '🧭', cost: 2000, classes: 4, need: {} },
  academy: { name: 'Police Academy', icon: '🚓', cost: 1800, classes: 4, need: { fitness: 30, smarts: 25 } },
  sportsdip: { name: 'Coaching Diploma', icon: '🏃', cost: 2400, classes: 5, need: { fitness: 32 } },
  musicdip: { name: 'Music Diploma', icon: '🎼', cost: 3000, classes: 6, need: { craft: 30 } },
  coding: { name: 'Coding Bootcamp', icon: '⌨️', cost: 2500, classes: 5, need: { smarts: 30 } },
  teachdip: { name: 'Teaching Diploma', icon: '🍎', cost: 5600, classes: 8, need: { smarts: 40 } },
  nursing: { name: 'Nursing Diploma', icon: '💉', cost: 6400, classes: 8, need: { smarts: 40 }, covers: ['firstaid'] },
  finearts: { name: 'Fine Arts Degree', icon: '🖼️', cost: 10000, classes: 10, need: { craft: 40 }, degree: true },
  business: { name: 'Business Degree', icon: '📊', cost: 14400, classes: 12, need: { smarts: 45 }, degree: true },
  compsci: { name: 'Computer Science Degree', icon: '🖥️', cost: 16800, classes: 12, need: { smarts: 55 }, degree: true, covers: ['coding'] },
  law: { name: 'Law Degree', icon: '📜', cost: 22400, classes: 14, need: { smarts: 55 }, degree: true },
  medicine: { name: 'Medical Degree', icon: '🧬', cost: 40000, classes: 20, need: { smarts: 62 }, degree: true, covers: ['nursing', 'firstaid'] },
  mba: { name: 'Master of Business', icon: '💼', cost: 30000, classes: 10, need: { smarts: 60, edu: 'business' }, degree: true, covers: ['business'] },
  phd: { name: 'Doctorate', icon: '🔬', cost: 18000, classes: 12, need: { smarts: 75, degree: true }, degree: true },
};
export const GRADES = ['Pass', 'Merit', 'Distinction'];
export const STUDENT_RATE = 0.01; // a season, on a student loan

// ---- homes ------------------------------------------------------------------------------

// rent: each season, to live there as a tenant. price: to buy (null if it
// can only be rented). comfort lifts your mood; kids: how many children
// there's room for. earn: what it brings in each season when you own it and
// let it out, as a share of what it's worth.
export const HOMES = {
  hostel: { name: 'Bunk at the Seagull Hostel', icon: '🛏️', rent: 500, price: null, comfort: 0, kids: 0, tier: 0, blurb: 'Eleven roommates. One of them snores in Morse code.' },
  bedsit: { name: 'Bedsit over the chip shop', icon: '🍟', rent: 1200, price: null, comfort: 5, kids: 0, tier: 1, blurb: 'Yours alone. Everything you own smells of vinegar.' },
  flat: { name: 'Harbour-view flat', icon: '🏢', rent: 2400, price: 140000, earn: 0.016, comfort: 9, kids: 1, tier: 2, blurb: 'One bedroom and, if you lean out, the sea.' },
  cottage: { name: "Fisherman's cottage", icon: '🏡', rent: 3600, price: 260000, earn: 0.014, comfort: 13, kids: 2, tier: 3, blurb: 'Low beams, a wood stove and a little garden.' },
  townhouse: { name: 'High Street townhouse', icon: '🏘️', rent: 6000, price: 480000, earn: 0.0125, comfort: 16, kids: 3, tier: 4, blurb: 'Four floors. You will lose your keys on all of them.' },
  villa: { name: 'Clifftop villa', icon: '🌅', rent: null, price: 1200000, earn: 0.011, comfort: 19, kids: 4, tier: 5, blurb: 'Glass, sky and sea. The gulls look up to you now.' },
  manor: { name: 'Starling Manor', icon: '🏰', rent: null, price: 4000000, earn: 0.009, comfort: 22, kids: 6, tier: 6, blurb: 'The big house on the hill. It has a name. It has a maze.' },
};

// Work you can have done on a home you own and live in. diy: the Craft it
// takes to do it yourself, for a third of the price and some of your time.
// It adds what it costs the builders to the home's worth, so doing it
// yourself leaves you ahead.
export const UPGRADES = {
  garden: { name: 'Landscaped garden', icon: '🌷', cost: 4000, diy: 30, time: 2, comfort: 1, blurb: 'A lift to your mood every season.' },
  kitchen: { name: 'New kitchen', icon: '🍳', cost: 12000, diy: 50, time: 3, comfort: 1.5, blurb: 'More comfort every season.' },
  solar: { name: 'Solar panels and insulation', icon: '☀️', cost: 9000, diy: 0, time: 0, comfort: 0, bills: 250, blurb: 'Takes $250 a season off your bills.' },
  extension: { name: 'Extra bedroom', icon: '🧱', cost: 30000, diy: 70, time: 4, comfort: 1, kids: 1, blurb: 'Room for one more child.' },
};

// How you eat. cost: on top of the usual bills each season.
export const FOOD = [
  { name: 'Beans on toast', icon: '🥫', cost: -300, hp: -0.8, mood: -3, blurb: 'Cheap. Your body notices.' },
  { name: 'Home cooking', icon: '🍲', cost: 0, hp: 0, mood: 0, blurb: 'Nothing fancy, nothing wrong.' },
  { name: 'The good stuff', icon: '🥗', cost: 600, hp: 0.8, mood: 3, blurb: 'Fresh fish, real coffee, the odd dinner out.' },
];

// Cover you can take out at the bank. cost: each season.
export const INSURANCE = {
  health: { name: 'Health cover', icon: '🩺', cost: 250, blurb: 'The hospital costs you 60% less.' },
  home: { name: 'Home and contents', icon: '🏠', cost: 150, blurb: 'Pays out for burglars and burst boilers.' },
};

// ---- things to buy ----------------------------------------------------------------------

export const ITEMS = {
  bike: { name: 'Bicycle', icon: '🚲', price: 400, at: 'highstreet', sec: 'Getting about', blurb: 'One more block of time every season.' },
  car: { name: 'Second-hand hatchback', icon: '🚗', price: 9000, at: 'highstreet', sec: 'Getting about', blurb: 'Two more blocks of time every season. Costs $300 a season to run.' },
  sportscar: { name: 'Sports car', icon: '🏎️', price: 85000, at: 'highstreet', sec: 'Getting about', blurb: 'Two more blocks of time, heads turn (Charm grows faster), and it cheers you up. Costs $1,200 a season to run.' },
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

// Shares. drift: how fast the price tends to climb each season; swing: how
// much it jumps about; div: paid out to you each season, as a share of what
// your holding is worth. Every one of them tends upwards over the years:
// the steady ones almost surely, the wild ones probably.
export const STOCKS = {
  BAY: { name: 'Bay 50 Index Fund', icon: '🧺', start: 100, drift: 0.011, swing: 0, div: 0.004, fund: true, blurb: 'A little of every company in town. The safe way to own shares.' },
  GULL: { name: 'Gull & Co. Fisheries', icon: '🐟', start: 40, drift: 0.009, swing: 0.04, div: 0.008, blurb: 'Steady as the tide, and pays well.' },
  BRCK: { name: 'Bay Brick & Timber', icon: '🧱', start: 60, drift: 0.011, swing: 0.07, div: 0.005, blurb: 'Grows when the town does.' },
  SNCK: { name: 'Snack Shack Holdings', icon: '🍩', start: 25, drift: 0.012, swing: 0.1, div: 0.003, blurb: 'Doughnuts are a volatile business.' },
  LITE: { name: 'Lighthouse Labs', icon: '💡', start: 80, drift: 0.015, swing: 0.13, div: 0, blurb: 'The future. Probably.' },
  MOON: { name: 'Moonshot Mining', icon: '🚀', start: 10, drift: 0.008, swing: 0.22, div: 0, blurb: 'A fortune or a lesson. Usually both, in turn.' },
};
// What the papers say when one company has a very good or very bad season.
export const HEADLINES = {
  up: ['wins a big contract', 'reports record profits', 'is the talk of the town', 'beats every forecast', 'opens three new sites'],
  down: ['issues a profit warning', 'loses its biggest customer', 'is fined by the council', 'recalls a faulty batch', 'has a boardroom bust-up'],
};

// Places that can only be let out, never lived in. earn: each season, as a
// share of what it's worth.
export const PROPS = {
  garage: { name: 'Lock-up garage', icon: '🚪', price: 30000, earn: 0.018 },
  rental: { name: 'Shop with a flat above', icon: '🏪', price: 180000, earn: 0.018 },
  guesthouse: { name: 'Seafront guesthouse', icon: '🏨', price: 600000, earn: 0.019 },
  arcade: { name: 'Shopping arcade', icon: '🏬', price: 2400000, earn: 0.02 },
};

// ---- a business of your own -------------------------------------------------------------

// Four sizes each. cost: to start, then to grow to each next size.
// take: what a good spell of work brings in at each size. To grow it needs
// a good name, the skill (of its first skill), and wait: seasons at its
// present size.
const SIZES = { cost: [4000, 30000, 160000, 800000], take: [1400, 3000, 6500, 12000], skill: [25, 40, 60, 80], wait: [0, 8, 16, 24] };
export const BUSINESSES = {
  food: { icon: '🍔', place: 'highstreet', stats: ['craft', 'charm'], names: ['Food stall', 'Café', 'Restaurant', 'Restaurant group'], ...SIZES },
  shop: { icon: '🛒', place: 'highstreet', stats: ['charm', 'smarts'], names: ['Market stall', 'Corner shop', 'Department store', 'Chain of stores'], ...SIZES },
  build: { icon: '🚚', place: 'harbour', stats: ['fitness', 'craft'], names: ['Odd-job van', 'Building firm', 'Construction company', 'Development group'], ...SIZES },
  soft: { icon: '📱', place: 'labs', stats: ['smarts', 'craft'], names: ['Freelance desk', 'App studio', 'Software house', 'Tech company'], ...SIZES },
  fleet: { icon: '🛥️', place: 'harbour', stats: ['fitness', 'smarts'], names: ['Day boat', 'Pair of trawlers', 'Fish merchant', 'Fishing fleet'], ...SIZES },
  design: { icon: '✂️', place: 'studios', stats: ['craft', 'charm'], names: ['Market pitch', 'Gallery shop', 'Design studio', 'Design house'], ...SIZES },
};

// ---- fishing ----------------------------------------------------------------------------

// where: 'wall' (off the harbour wall) or 'boat' (out in the bay), or both.
// when: the seasons it runs in (0 spring to 3 winter); none means all year.
// w: how common it is. pay: what the quay gives you for it.
export const FISH = {
  mackerel: { name: 'Mackerel', icon: '🐟', where: ['wall', 'boat'], when: [1, 2], w: 30, pay: [60, 120] },
  whiting: { name: 'Whiting', icon: '🐟', where: ['wall'], when: [2, 3, 0], w: 26, pay: [50, 100] },
  flounder: { name: 'Flounder', icon: '🐠', where: ['wall'], w: 18, pay: [90, 160] },
  crab: { name: 'Brown crab', icon: '🦀', where: ['wall'], when: [0, 1, 2], w: 14, pay: [120, 200] },
  bass: { name: 'Sea bass', icon: '🐟', where: ['wall', 'boat'], when: [1, 2], w: 12, pay: [180, 320] },
  squid: { name: 'Squid', icon: '🦑', where: ['wall', 'boat'], when: [2, 3], w: 8, pay: [200, 340] },
  cod: { name: 'Cod', icon: '🐟', where: ['boat'], when: [3, 0], w: 22, pay: [220, 380] },
  lobster: { name: 'Lobster', icon: '🦞', where: ['boat'], w: 12, pay: [400, 700] },
  turbot: { name: 'Turbot', icon: '🐠', where: ['boat'], when: [0, 1], w: 7, pay: [600, 950] },
  conger: { name: 'Conger eel', icon: '🐍', where: ['wall', 'boat'], when: [1, 2, 3], w: 4, pay: [900, 1500] },
  tuna: { name: 'Bluefin tuna', icon: '🐋', where: ['boat'], when: [1], w: 2, pay: [2500, 4000] },
  bream: { name: 'The golden bream', icon: '🐠', where: [], w: 0, pay: [5000, 5000] },
};

// ---- people -----------------------------------------------------------------------------

export const NAMES_M = ['Alex', 'Sam', 'Robin', 'Casey', 'Morgan', 'Jamie', 'Charlie', 'Kit', 'Ash', 'Devon', 'Jules', 'Nico', 'Ellis', 'Rowan', 'Max', 'Toni', 'Flynn', 'Jesse', 'Kai', 'Tate', 'Bao', 'Chidi', 'Dev', 'Femi', 'Goran', 'Jun', 'Kofi', 'Omar', 'Rafa', 'Soren', 'Tariq', 'Finn', 'Harry', 'Leo', 'Marcus', 'Niall', 'Oscar', 'Pete', 'Tom', 'Will', 'Arthur', 'Ben', 'Dan', 'Ed', 'Gabriel', 'Hugo', 'Isaac', 'Joe', 'Luca', 'Mo'];
export const NAMES_F = ['Jo', 'Riley', 'Taylor', 'Frankie', 'Remi', 'Noor', 'Sasha', 'Quinn', 'Harper', 'Indy', 'Lou', 'Bobbie', 'Dara', 'Wren', 'Skye', 'Sunny', 'Ari', 'Billie', 'Eden', 'Sage', 'Uma', 'Val', 'Zia', 'Eun', 'Hana', 'Imani', 'Lina', 'Mei', 'Nia', 'Priya', 'Yuki', 'Zofia', 'Alice', 'Beth', 'Clara', 'Daisy', 'Ella', 'Freya', 'Grace', 'Holly', 'Iris', 'Kate', 'Lily', 'Maya', 'Nell', 'Olive', 'Poppy', 'Rosa', 'Sophie', 'Tess'];
export const NAMES = [...NAMES_M, ...NAMES_F];
export const SURNAMES = ['Pemberton', 'Okafor', 'Marlow', 'Finch', 'Delgado', 'Winterbourne', 'Achebe', 'Hartley', 'Kowalski', 'Nakamura', 'Brightwater', 'Singh', 'Tregenza', 'Larkin', 'Mbeki', 'Castellan', 'Quayle', 'Fairweather', 'Abara', 'Penhallow', 'Sorensen', 'Whitlock', 'Yamada', 'Oyelaran', 'Drake', 'Calloway', 'Ferreira', 'Nightingale', 'Thackeray', 'Vance'];
export const PET_NAMES = ['Biscuit', 'Pickle', 'Captain', 'Mango', 'Pebble', 'Scampi', 'Noodle', 'Admiral', 'Crumpet', 'Kipper', 'Waffles', 'Barnacle', 'Dumpling', 'Gizmo', 'Marmite', 'Sprout'];
export const PETS = {
  dog: { name: 'dog', icon: '🐕', life: 14 },
  cat: { name: 'cat', icon: '🐈', life: 17 },
  rabbit: { name: 'rabbit', icon: '🐇', life: 9 },
  parrot: { name: 'parrot', icon: '🦜', life: 45 },
};

// What someone is like: time with them rubs off on you.
export const TRAITS = {
  bookish: { name: 'Bookish', stat: 'smarts', icon: '📖' },
  sporty: { name: 'Sporty', stat: 'fitness', icon: '🏃' },
  witty: { name: 'Witty', stat: 'charm', icon: '😄' },
  arty: { name: 'Arty', stat: 'craft', icon: '🎭' },
  kind: { name: 'Kind', stat: null, icon: '🤗' },
};

// Things to do with a friend or a sweetheart. Everybody has two they love.
// not: a season it can't be done in.
export const OUTINGS = {
  coffee: { name: 'Coffee and a catch-up', icon: '☕', cost: 10, text: ['Two hours go in ten minutes.', 'You put the world to rights.'] },
  pub: { name: 'A night at the Gull', icon: '🍻', cost: 40, stat: 'charm', text: ['You close the place, singing.', 'Darts, crisps, and a lot of nonsense talked.'] },
  walk: { name: 'A walk along the cliffs', icon: '🥾', cost: 0, stat: 'fitness', text: ['Wind, gorse, and miles of talk.', 'You get lost, and do not much mind.'] },
  film: { name: 'A film and an argument about it', icon: '🎬', cost: 30, stat: 'craft', text: ['Neither of you can agree what it meant.', 'You both cry and both deny it.'] },
  talk: { name: 'A talk at the college', icon: '🎓', cost: 10, stat: 'smarts', text: ['An hour on the history of lighthouses. Brilliant, somehow.', 'You both leave with a new favourite fact.'] },
  dinner: { name: 'Dinner somewhere nice', icon: '🍝', cost: 150, big: true, text: ['Candles, three courses, no hurry at all.', 'The waiter has to ask you to leave, kindly.'] },
  dance: { name: 'Dancing on the pier', icon: '💃', cost: 50, stat: 'fitness', text: ['Neither of you can dance. Nobody minds.', 'The band plays one more, just for you two.'] },
  beach: { name: 'A day on the beach', icon: '🏖️', cost: 0, not: 3, text: ['Sandwiches with sand in. Perfect.', 'You swim out to the buoy and race back.'] },
};
// Things to do with a child: each brings on one of their skills.
export const KID_PLAY = {
  read: { name: 'Read together', icon: '📚', stat: 'smarts', text: 'One more chapter. Then one more.' },
  ball: { name: 'Kick a ball about', icon: '⚽', stat: 'fitness', text: 'Jumpers for goalposts on the green.' },
  show: { name: 'Put on a show', icon: '🎭', stat: 'charm', text: 'A play in three acts, with the dog as the villain.' },
  make: { name: 'Make something', icon: '🪚', stat: 'craft', text: 'Glue, cardboard, and a great deal of mess.' },
  out: { name: 'A day out', icon: '🎡', cost: 60, text: 'Ice cream, the pier, and asleep in the car home.' },
};

// Knowing the right people. A close friend, sweetheart or grown-up child
// (60 bond) who works in a career gives you its perk.
export const PERKS = {
  kitchen: 'free dinners: $150 off your food bills',
  retail: '15% off in the shops',
  trades: 'home improvements for 30% less',
  tech: 'Smarts grows faster',
  medicine: '30% off at the hospital',
  police: 'Sal’s errands are less likely to go wrong',
  law: 'fines and divorces cost you less',
  arts: 'fame comes quicker',
  sports: 'Fitness grows faster',
  teaching: 'college classes for 20% less',
  sea: 'better catches',
  finance: 'a better rate on your savings',
  politics: 'Charm grows faster',
  crew: 'the law looks the other way a little',
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
  // The hair a man or a woman is given unless you choose otherwise.
  m: [0, 0, 3, 4],
  f: [1, 1, 2, 5, 3],
};

// ---- dreams -----------------------------------------------------------------------------

// A life picks three. test(L) says whether it has come true (L is the Life).
export const DREAMS = {
  ownhome: { name: 'A place of my own', icon: '🏡', desc: 'Own the home you live in.', test: (L) => L.s.owned },
  manor: { name: 'Lord of the manor', icon: '🏰', desc: 'Own Starling Manor.', test: (L) => L.owns('manor') },
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
  boss: { name: 'My own boss', icon: '🏪', desc: 'Build a business to its third size.', test: (L) => L.s.biz && L.s.biz.lvl >= 2 },
  invest: { name: 'Money that works', icon: '📈', desc: 'Hold $500,000 in shares.', test: (L) => L.sharesWorth() >= 5e5 },
};

// ---- the to-do list ---------------------------------------------------------------------

// A guide through the first few years, one step at a time.
export const QUESTS = [
  { text: 'Find work: the Town Hall has a job board', test: (L) => !!L.s.job || L.s.n.shifts > 0, cash: 100 },
  { text: 'Work a shift (your workplace is marked on the map)', test: (L) => L.s.n.shifts > 0, cash: 100 },
  { text: 'Out of time? Tap Next to move on a season', test: (L) => L.s.t > 0, cash: 100 },
  { text: 'Train any skill to 25: try the library, gym, pub or studios', test: (L) => STATS.some((k) => L.s.st[k] >= 25), cash: 200 },
  { text: 'Buy a bicycle on the High Street for more time', test: (L) => L.s.items.bike || L.s.items.car || L.s.items.sportscar, cash: 100 },
  { text: 'Get to know someone: chat to people at the pub or the park', test: (L) => L.s.people.some((p) => p.kind !== 'parent'), cash: 150 },
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
  owner: { name: 'Keys to the door', icon: '🔑', desc: 'Buy a home.', test: (L) => L.s.estate.some((e) => HOMES[e.kind]) },
  manor: { name: 'Lord of the manor', icon: '🏰', desc: 'Own Starling Manor.', test: (L) => L.owns('manor') },
  landlord: { name: 'Landlord', icon: '🏘️', desc: 'Let out three properties.', test: (L) => L.s.estate.filter((e) => e.let).length >= 3 },
  shares: { name: 'Bull market', icon: '🐂', desc: 'Hold $250,000 in shares.', test: (L) => L.sharesWorth() >= 250000 },
  friend: { name: 'A friendly face', icon: '🙂', desc: 'Make a friend.', test: (L) => L.s.people.some((p) => p.kind === 'friend') },
  sweet: { name: 'Butterflies', icon: '💘', desc: 'Start seeing someone.', test: (L) => !!L.partner() },
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
  honours: { name: 'With distinction', icon: '🎖️', desc: 'Pass a course with a distinction.', test: (L) => Object.values(L.s.edu).some((e) => e.g === 2) },
  fund: { name: 'Slow and steady', icon: '🧺', desc: 'Hold $100,000 of the index fund.', test: (L) => (L.s.stk.own.BAY || 0) * L.s.stk.p.BAY >= 1e5 },
  shop: { name: 'Open for business', icon: '🏪', desc: 'Start a business.', test: (L) => !!L.s.biz },
  mogul: { name: 'Mogul', icon: '🏙️', desc: 'Grow a business to its biggest.', test: (L) => L.s.biz && L.s.biz.lvl >= 3 },
  creel: { name: 'The full creel', icon: '🦞', desc: 'Catch every kind of fish in the book.', test: (L) => Object.keys(FISH).every((id) => L.s.fishbook[id]) },
  doer: { name: 'Home improver', icon: '🧰', desc: 'Do up a home with your own hands.', test: (L) => !!L.s.f.diy },
  raised: { name: 'Chip off the old block', icon: '🧒', desc: 'Raise a child with a skill of 60.', test: (L) => L.kids().some((k) => k.age >= 18 && Object.values(k.st || {}).some((v) => v >= 60)) },
  crime: { name: 'First offence', icon: '🧤', desc: 'Commit a crime.', test: (L) => L.s.n.crimes >= 1 },
  thief: { name: 'Light fingers', icon: '👛', desc: 'Steal ten times without being caught.', test: (L) => (L.s.n.thefts || 0) >= 10 },
  brawler: { name: 'Brawler', icon: '🥊', desc: 'Win ten fights.', test: (L) => (L.s.n.fights || 0) >= 10 },
  bent: { name: 'Bent', icon: '🤫', desc: 'Bend the rules at work five times.', test: (L) => (L.s.n.grafts || 0) >= 5 },
  heist: { name: 'The big one', icon: '🏦', desc: 'Rob Harbour Bank and get away with it.', test: (L) => !!L.s.f.heist },
  kingpin: { name: 'Boss of the Bay', icon: '🦊', desc: 'Reach the top of Sal\u2019s crew.', test: (L) => !!L.s.f.kingpin },
  wall: { name: 'Over the wall', icon: '🧱', desc: 'Break out of prison.', test: (L) => !!L.s.f.escaped },
  clean: { name: 'One day at a time', icon: '🧃', desc: 'Get clean at the clinic.', test: (L) => !!L.s.f.clean },
  wanted: { name: 'Wanted', icon: '🚨', desc: 'Have the law hunting for you.', test: (L) => L.s.heat >= 75 },
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
  { id: 'tycoon', name: 'The Tycoon', icon: '👑', desc: 'Died worth $10,000,000 or more.', test: (L) => L.netWorth() >= 1e7,
    heir: { name: 'Signet ring', icon: '💍', desc: 'Start with $6,000 more, and savings earn more.' } },
  { id: 'founder', name: 'The Founder', icon: '🏙️', desc: 'Built a business to its biggest.', test: (L) => !!L.s.f.mogul,
    heir: { name: 'Old shop sign', icon: '🪧', desc: 'A business of yours earns more, and costs half as much to start.' } },
  { id: 'star', name: 'The Star', icon: '🌟', desc: 'Died famous (70 fame).', test: (L) => L.s.fame >= 70,
    heir: { name: 'Signed guitar', icon: '🎸', desc: 'Start with a guitar; Craft grows faster.' } },
  { id: 'mayor', name: 'Pillar of the Bay', icon: '🏛️', desc: 'Was mayor, or loved by the whole town.', test: (L) => !!L.s.f.wasMayor || L.s.karma >= 80,
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
  { id: 'kingpin', name: 'The Kingpin', icon: '🕴️', desc: 'Ran Sal\u2019s crew, or robbed the bank.', test: (L) => !!L.s.f.kingpin || !!L.s.f.heist,
    heir: { name: 'Sal\u2019s little black book', icon: '📓', desc: 'Start with 5 crimes to your name and a bad reputation; the law is slower to notice you.' } },
  { id: 'rogue', name: 'The Rogue', icon: '🦊', desc: 'Two dozen crimes to your name.', test: (L) => (L.s.n.crimes || 0) >= 24,
    heir: { name: 'Loaded dice', icon: '🎲', desc: 'Crime is safer and the casino is kinder.' } },
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
