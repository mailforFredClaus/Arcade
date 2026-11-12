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

// The right one of a and an in front of a word, and a job title said mid-sentence (an IT support assistant).
// (Numbers too: an 8-year-old, an 11-year-old, an 18-year-old.)
export const an = (w) => `${/^([aeiou]|8|1[18](?!\d))/i.test(w) ? 'an' : 'a'} ${w}`;
export const lowJob = (t) => t.toLowerCase().replace(/\bit\b/g, 'IT');

// A crowd, counted: 950, 12.4k, 1.2M.
export function many(n) {
  if (n >= 999500) return `${(n / 1e6).toFixed(n >= 9.95e6 ? 0 : 1)}M`;
  if (n >= 9950) return `${Math.round(n / 1e3)}k`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n));
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
  // Up the hill: the old town, on a map of its own.
  farm: { name: 'Windle Farm', icon: '🐄', area: 'hill', x: 70, y: 112, blurb: 'Sheep, cows, mud, and a farmer with opinions about all three.' },
  church: { name: 'St Brigid’s', icon: '⛪', area: 'hill', x: 196, y: 112, blurb: 'Bells on Sunday, jumble on Saturday, and a vicar who means well.' },
  headland: { name: 'Gorse Head', icon: '🪨', area: 'hill', x: 322, y: 112, blurb: 'Cliffs, gulls, a bench with a view, and caves the tide keeps to itself.' },
  ground: { name: 'Rovers’ Ground', icon: '⚽', area: 'hill', x: 70, y: 228, blurb: 'Home of Starling Rovers, who have not won anything since 1987.' },
  library: { name: 'The Library', icon: '📚', area: 'hill', x: 196, y: 228, blurb: 'Books, newspapers, the town archives, and the warmest radiators in town.' },
  garage: { name: 'Dobbs & Daughter', icon: '🔧', area: 'hill', x: 322, y: 228, blurb: 'Cars mended, cars sold, cars looked at doubtfully.' },
  theatre: { name: 'The Pavilion', icon: '🎭', area: 'hill', x: 70, y: 340, blurb: 'Plays, pantomime, and a bar that opens at the interval.' },
  market: { name: 'Market Square', icon: '🧺', area: 'hill', x: 196, y: 340, blurb: 'Stalls every Saturday, and a fountain nobody has ever seen working.' },
  cove: { name: 'Smugglers’ Cove', icon: '🏖️', area: 'hill', x: 322, y: 340, blurb: 'A sandy cove below the cliffs, with beach huts and the lifeboat station.' },
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
      rung('IT Support Assistant', 1800, { smarts: 25 }),
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
  // (Cars are sold, mended and learned in at Dobbs & Daughter up the hill: see motor.js. Owning
  // one that goes still sets s.items.car, or s.items.sportscar, for the rest of the game.)
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
  BAY: { name: 'Bay 50 Index Fund', icon: '🧺', start: 100, drift: 0.0075, swing: 0, div: 0.004, fund: true, blurb: 'A little of every company in town. The safe way to own shares.' },
  GULL: { name: 'Gull & Co. Fisheries', icon: '🐟', start: 40, drift: 0.005, swing: 0.04, div: 0.008, blurb: 'Steady as the tide, and pays well.' },
  BRCK: { name: 'Bay Brick & Timber', icon: '🧱', start: 60, drift: 0.006, swing: 0.07, div: 0.005, blurb: 'Grows when the town does.' },
  SNCK: { name: 'Snack Shack Holdings', icon: '🍩', start: 25, drift: 0.0065, swing: 0.1, div: 0.003, blurb: 'Doughnuts are a volatile business.' },
  LITE: { name: 'Lighthouse Labs', icon: '💡', start: 80, drift: 0.008, swing: 0.13, div: 0, blurb: 'The future. Probably.' },
  MOON: { name: 'Moonshot Mining', icon: '🚀', start: 10, drift: 0.003, swing: 0.22, div: 0, blurb: 'A fortune or a lesson. Usually both, in turn.' },
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
  crowd: { name: 'Internet famous', icon: '🤳', desc: 'Reach 100,000 followers on Chirper.', test: (L) => L.followers() >= 1e5 },
  record: { name: 'A hit record', icon: '💿', desc: 'Record an album that goes to number one.', test: (L) => !!L.s.f.hit },
  magpie: { name: 'The collector', icon: '🏺', desc: 'Complete two sets of curios.', test: (L) => Object.keys(CURIO_SETS).filter((k) => L.hasSet(k)).length + (L.s.n.sets || 0) >= 2 },
  plot: { name: 'Best in show', icon: '🥒', desc: 'Win the Harvest Show.', test: (L) => !!L.s.f.marrow },
  legacy: { name: 'Something that lasts', icon: '🏗️', desc: 'Give the town a lifeboat, or something bigger.', test: (L) => ['lifeboat', 'scholarship', 'wing', 'pier'].some((id) => L.s.gave[id]),
    // (Not for an heir whose family has already given all there is to give.)
    open: (s) => ['lifeboat', 'scholarship', 'wing', 'pier'].some((id) => !(s.gifts || {})[id]) },
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
  { text: 'With a phone, post something on Chirper (it is at home)', test: (L) => !!L.s.chirp && L.s.chirp.posts > 0, cash: 150 },
  { text: 'Find a curio: Mr Pym on the High Street sells them, and the beach gives them up', test: (L) => Object.keys(L.s.curSeen).length > 0, cash: 200 },
  { text: 'Take an allotment at the park and sow something', test: (L) => (!!L.s.plot && L.s.plot.beds.some(Boolean)) || Object.keys(L.s.grown).length > 0, cash: 150 },
  { text: 'Bring in a harvest from your allotment', test: (L) => Object.keys(L.s.grown).length > 0, cash: 250 },
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
  model: { name: 'Model prisoner', icon: '🪪', desc: 'Be let out early on parole.', test: (L) => !!L.s.f.parole },
  lifer: { name: 'Old lag', icon: '🗝️', desc: 'Spend twenty seasons inside, all told.', test: (L) => (L.s.n.inside || 0) >= 20 },
  daddy: { name: 'Top of the landing', icon: '🥫', desc: 'Run the landing in Starling Gaol.', test: (L) => !!L.s.f.daddy },
  lam: { name: 'Clean away', icon: '🌫️', desc: 'Escape, and stay out until they stop looking.', test: (L) => !!L.s.f.lam },
  nemesis: { name: 'And stay out', icon: '😤', desc: 'See off an enemy.', test: (L) => (L.s.n.seenOff || 0) >= 1 },
  peace: { name: 'Water under the pier', icon: '🕊️', desc: 'Make it up with an enemy.', test: (L) => (L.s.n.mended || 0) >= 1 },
  oldflame: { name: 'Second time lucky', icon: '💐', desc: 'Get back together with an ex.', test: (L) => !!L.s.f.oldflame },
  natural: { name: 'Twenty-one', icon: '♠️', desc: 'Be dealt a blackjack.', test: (L) => !!L.s.f.natural },
  outsider: { name: 'Rank outsider', icon: '🐦', desc: 'Back a winning gull at 8 to 1 or longer.', test: (L) => !!L.s.f.outsider },
  lotto: { name: 'It could be you', icon: '🎟️', desc: 'Win the Bay Lotto jackpot.', test: (L) => !!L.s.f.lotto },
  chirp1k: { name: 'Chirpy', icon: '🐤', desc: 'Reach 1,000 followers on Chirper.', test: (L) => L.followers() >= 1000 },
  chirp100k: { name: 'Influencer', icon: '🤳', desc: 'Reach 100,000 followers.', test: (L) => L.followers() >= 1e5 },
  chirp1m: { name: 'Verified', icon: '☑️', desc: 'Reach a million followers.', test: (L) => L.followers() >= 1e6 },
  viral: { name: 'Gone viral', icon: '🚀', desc: 'Have a post take off.', test: (L) => (L.s.n.viral || 0) >= 1 },
  album: { name: 'On the jukebox', icon: '🎙️', desc: 'Make a record.', test: (L) => (L.s.n.albums || 0) >= 1 },
  hit: { name: 'Number one', icon: '💿', desc: 'Have a hit record.', test: (L) => !!L.s.f.hit },
  grower: { name: 'Green fingers', icon: '🥕', desc: 'Grow every crop there is on your allotment.', test: (L) => Object.keys(CROPS).every((c) => L.s.grown[c]) },
  marrow: { name: 'Best in show', icon: '🥒', desc: 'Win the Harvest Show with a marrow.', test: (L) => !!L.s.f.marrow },
  set: { name: 'The set', icon: '🧩', desc: 'Complete a set of curios.', test: (L) => Object.keys(CURIO_SETS).some((k) => L.hasSet(k)) || (L.s.n.sets || 0) >= 1 },
  curator: { name: 'Magpie', icon: '🏺', desc: 'Find every curio in Starling Bay.', test: (L) => Object.keys(CURIOS).every((c) => L.s.curSeen[c]) },
  patron: { name: 'Patron of the museum', icon: '🏛️', desc: 'Give a whole set of curios to the museum.', test: (L) => !!L.s.f.patron },
  seed: { name: 'Forty years of seed', icon: '🫙', desc: 'Be given Mrs Pargeter’s seed tin.', test: (L) => L.s.f.parg === 3 },
  plaque: { name: 'Your name on it', icon: '🪧', desc: 'Give the town something from the mayor’s appeal.', test: (L) => Object.keys(L.s.gave).length >= 1 },
  benefactor: { name: 'Benefactor', icon: '🏗️', desc: 'Give the town three things.', test: (L) => Object.keys(L.s.gave).length >= 3 },
  pier: { name: 'To the very end', icon: '🎡', desc: 'Rebuild the pier.', test: (L) => !!L.s.gave.pier },
  sides: { name: 'On the side', icon: '🧾', desc: 'Do ten sidelines.', test: (L) => (L.s.n.sides || 0) >= 10 },
  rosette: { name: 'First prize', icon: '🏵️', desc: 'Win something at one of the year’s festivals.', test: (L) => Object.keys(L.s.fests).length >= 1 },
  seasons4: { name: 'A year of rosettes', icon: '🎪', desc: 'Win something at all four festivals.', test: (L) => FESTS.every((f) => f.games.some((g) => L.s.fests[g.id])) },
  reigning: { name: 'Reigning champion', icon: '👑', desc: 'Win the same contest three times.', test: (L) => Object.values(L.s.fests).some((n) => n >= 3) },
  oddjobs: { name: 'Odd-job man', icon: '📌', desc: 'Do twenty jobs from the notice board.', test: (L) => (L.s.n.odd || 0) >= 20 },
  slump: { name: 'Seen it all', icon: '📰', desc: 'Live through a boom and a deep slump.', test: (L) => !!L.s.f.sawBoom && !!L.s.f.sawSlump },
  runner: { name: 'Moonlight', icon: '🌒', desc: 'Bring five loads ashore for Sal.', test: (L) => (L.s.n.runs || 0) >= 5 },
  faker: { name: 'Genuine antique', icon: '🏺', desc: 'Sell Mr Pym something you made last week.', test: (L) => (L.s.n.fakes || 0) >= 1 },
  scraps: { name: 'Nobody’s dog', icon: '🐕', desc: 'Give the brown dog from the quay a home.', test: (L) => L.s.f.stray === 3 },
  mentor: { name: 'Taught by the best', icon: '🧑‍🎓', desc: 'See someone you trained go on to great things.', test: (L) => !!L.s.f.mentor },
  drains: { name: 'Where the money went', icon: '📒', desc: 'Take the mayor’s drains to the Gazette.', test: (L) => L.s.f.drains >= 2 },
  handson: { name: 'Hands on', icon: '🎮', desc: 'Do twenty shifts by hand.', test: (L) => (L.s.n.played || 0) >= 20 },
  blinder: { name: 'A blinder', icon: '🌟', desc: 'Play a shift so well that nobody can fault it.', test: (L) => Object.keys(L.s.aced).length >= 1 },
  blinders: { name: 'Good at everything', icon: '🎖️', desc: 'Play a blinder in four different careers.', test: (L) => Object.keys(L.s.aced).length >= 4 },
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
  { id: 'benefactor', name: 'The Benefactor', icon: '🏗️', desc: 'Gave the town $1,000,000 or more.', test: (L) => (L.s.n.given || 0) >= 1e6,
    heir: { name: 'Brass plaque', icon: '🪧', desc: 'Start out well thought of in the town.' } },
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
  { id: 'sensation', name: 'The Sensation', icon: '🤳', desc: 'A million followers on Chirper.', test: (L) => L.followers() >= 1e6,
    heir: { name: 'Blue tick', icon: '☑️', desc: 'Start with a phone and 2,000 followers, and gather more with every post.' } },
  { id: 'lag', name: 'The Old Lag', icon: '⛓️', desc: 'Twenty seasons or more inside.', test: (L) => (L.s.n.inside || 0) >= 20,
    heir: { name: 'A file in a cake', icon: '🎂', desc: 'Prison sentences are a season shorter, and the wall is easier to climb.' } },
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

// ---- a first date -----------------------------------------------------------------------

// Five ways to play it, one for each kind of person. t: what you do.
// hint: how such a person looks across a bar. good: how it goes with the
// right person. bad: how it goes with anybody else.
const dHe = (p) => (p.sex === 'm' ? 'He' : 'She'), dhe = (p) => (p.sex === 'm' ? 'he' : 'she'), dhim = (p) => (p.sex === 'm' ? 'him' : 'her'), dhis = (p) => (p.sex === 'm' ? 'his' : 'her');
export const DATE_LINES = {
  bookish: {
    t: () => 'Talk about books',
    hint: (p) => `${dHe(p)} has a paperback open on the bar and has not looked up in ten minutes.`,
    good: () => 'You argue about an ending until the bell goes for last orders.',
    bad: (p) => `You talk about a novel for twenty minutes before it comes out that ${dhe(p)} has not read one since school.`,
  },
  sporty: {
    t: (p) => `Dare ${dhim(p)} to race you to the end of the pier`,
    hint: (p) => `${dHe(p)} is in running shoes, drinking a pint of water, looking pleased with ${dhim(p)}self.`,
    good: () => 'You lose by a yard and are told, with a grin, that you can have a rematch.',
    bad: (p) => `${dHe(p)} looks at ${dhis(p)} shoes, then at you, then at the rain.`,
  },
  witty: {
    t: (p) => `Try to make ${dhim(p)} laugh`,
    hint: (p) => `${dHe(p)} is doing the landlord’s voice for the whole end of the bar, and it is very good.`,
    good: () => 'It takes three goes. The third gets the real laugh, the one with the snort in it.',
    bad: (p) => `${dHe(p)} smiles politely, the way people do at a child’s recorder concert.`,
  },
  arty: {
    t: (p) => `Ask what ${dhe(p)} is making these days`,
    hint: (p) => `${dHe(p)} has paint on one sleeve and is drawing the barmaid on a beer mat.`,
    good: (p) => `${dHe(p)} shows you a sketchbook that nobody else has seen.`,
    bad: (p) => `"Making?" says ${dhe(p)}. "Tea, mostly."`,
  },
  kind: {
    t: (p) => `Ask about ${dhim(p)}, and listen`,
    hint: (p) => `${dHe(p)} has just carried an old boy’s shopping in out of the rain, and waved away the thanks.`,
    good: (p) => `You hear about ${dhis(p)} gran, ${dhis(p)} dog and ${dhis(p)} worst job. ${dHe(p)} notices that you listened.`,
    bad: (p) => `${dHe(p)} would rather you said something. Anything. The silence gets long.`,
  },
};

// ---- the mayor's appeal -----------------------------------------------------------------

// Things the town can be given. at: where it stands. said: how it is
// spoken of. perk: what it does for the giver, and for the family after.
export const GIFTS = {
  bench: { name: 'A bench by the pond', icon: '🪑', at: 'park', cost: 2500, karma: 3, fame: 0, said: 'a bench by the pond',
    blurb: 'Somewhere to sit and watch the ducks.', perk: 'Sitting by the pond does you more good.',
    plaque: (n) => `On the bench by the pond, a small brass plate: "${n} loved this view."`, done: 'Oak, with a brass plate. You sit on it first, to be sure.' },
  bandstand: { name: 'Mend the bandstand', icon: '🎺', at: 'park', cost: 40000, karma: 6, fame: 2, said: 'its bandstand back',
    blurb: 'It has been roped off since the roof came in.', perk: 'Every summer the band plays, and it lifts your mood.',
    plaque: (n) => `The ${n} Bandstand: brass on Sundays, all summer.`, done: 'New lead on the roof, new paint, and the Silver Band playing "Sussex by the Sea" slightly too fast.' },
  lifeboat: { name: 'A new lifeboat', icon: '🚤', at: 'harbour', cost: 150000, karma: 12, fame: 5, said: 'a lifeboat',
    blurb: 'The old one is older than its coxswain.', perk: 'The crew tell you where the fish are: fishing pays a fifth more.',
    plaque: (n) => `The lifeboat ${n} rides at her mooring.`, done: 'She is launched with a bottle of the good stuff, which is your doing too. The coxswain cannot speak.' },
  scholarship: { name: 'A scholarship at the college', icon: '🎓', at: 'college', cost: 300000, karma: 12, fame: 4, said: 'a scholarship at the college',
    blurb: 'Two students a year who could not otherwise go.', perk: 'Your courses cost a quarter less, and so will your heirs’. So does sending a child of yours to college.',
    plaque: (n) => `The ${n} Scholarship sends two students a year.`, done: 'The first two are announced at assembly. One of them wants to be a marine biologist. The other wants to be you.' },
  wing: { name: 'A new wing for St Wren’s', icon: '🏥', at: 'hospital', cost: 750000, karma: 18, fame: 8, said: 'a wing of St Wren’s',
    blurb: 'Forty beds, and a roof that does not leak.', perk: 'Hospital visits cost you, and your family, half.',
    plaque: (n) => `The ${n} Wing has forty beds and a view of the sea.`, done: 'A ribbon, a pair of gold scissors, and a matron who shakes your hand as though she means to keep it.' },
  pier: { name: 'Rebuild the pier', icon: '🎡', at: 'casino', cost: 2000000, karma: 20, fame: 15, said: 'its pier',
    blurb: 'The far end has been shut since a storm long before your time: the Lucky Gull is as far as anybody goes.', own: true, perk: 'A seat on the pier company’s board: $6,000 a season for the rest of your life (yours alone: it is not passed on).',
    plaque: (n) => `A stone at the pier gates: "Rebuilt by ${n}, for the town."`, done: 'New ironwork to the very end, a carousel, and lights you can see from the lighthouse. The whole Bay walks out along it on the first night.' },
};

// ---- a sideline -------------------------------------------------------------------------

// One piece of work on the side for each career, for those who have got
// as far as rung r. pay: in shifts' worth. A skill decides how it goes.
export const SIDELINES = {
  kitchen: { r: 2, icon: '🍰', title: 'Cater a wedding', desc: 'A marquee, a hundred covers, one oven.', stat: 'craft', dc: 45, pay: 2, win: 'The bride’s mother asks for the recipe. You say it is a secret. It is tinned.', lose: 'The oven trips the generator during the speeches. Cold beef, then.' },
  retail: { r: 2, icon: '🏷️', title: 'Run a clearance sale', desc: 'Everything must go, and you are on commission.', stat: 'charm', dc: 45, pay: 1.8, win: 'You sell a man a lawnmower. He lives in a flat.', lose: 'A long day beside a rail of beige slacks.' },
  trades: { r: 1, icon: '🔧', title: 'Do a job on the side', desc: 'A foreigner, they call it: somebody’s kitchen, at the weekend, for cash.', stat: 'craft', dc: 40, pay: 2, win: 'Level, square and done by Sunday teatime.', lose: 'The wall was not where the plans said it was. Putting it right takes most of the fee.' },
  tech: { r: 2, icon: '🖥️', title: 'Fix the Town Hall computers', desc: 'They have been "meaning to back things up".', stat: 'smarts', dc: 50, pay: 2.2, win: 'You turn it off and on again, then charge for a day.', lose: 'You are there until three in the morning, and the printer still hates everyone.' },
  medicine: { r: 3, icon: '🌙', title: 'Cover a night as a locum', desc: 'The next town along is short of doctors too.', stat: 'smarts', dc: 55, pay: 1.6, win: 'A quiet night, a good breakfast, a fat envelope.', lose: 'Three ambulances at once. You earn every penny and remember none of it.' },
  police: { r: 1, icon: '🕴️', title: 'Work the door at the regatta ball', desc: 'In a borrowed dinner jacket.', stat: 'fitness', dc: 45, pay: 1.5, win: 'You see a councillor into a taxi and forget what you saw.', lose: 'Somebody’s uncle gets past you twice, in two different hats.' },
  law: { r: 2, icon: '⚖️', title: 'Take a case for nothing', desc: 'Somebody who needs a lawyer and cannot pay for one.', stat: 'smarts', dc: 55, pay: 0, karma: 6, win: 'You win. She brings a cake to the office every Friday for a year.', lose: 'You lose, narrowly, and stay up all night writing the appeal.' },
  arts: { r: 1, icon: '🎶', title: 'Play a wedding', desc: 'They want the one everybody wants.', stat: 'craft', dc: 45, pay: 2, fame: 1, win: 'You play it three times, and the last one is the best you have ever played anything.', lose: 'A child is sick on the monitor during the first dance.' },
  sports: { r: 2, icon: '✂️', title: 'Open a supermarket', desc: 'A ribbon, a photograph, a cheque.', stat: 'charm', dc: 40, pay: 2, fame: 1, win: 'You sign forty autographs and a cabbage.', lose: 'They spell your name wrong on the banner, and you cut the wrong ribbon.' },
  teaching: { r: 1, icon: '📝', title: 'Tutor privately', desc: 'A boy whose father has plans for him.', stat: 'smarts', dc: 45, pay: 1.8, win: 'He passes. His father shakes your hand; the boy winks.', lose: 'The boy teaches you three card tricks, and learns nothing.' },
  sea: { r: 2, icon: '🎣', title: 'Take anglers out for the day', desc: 'Six men from the city, in new waterproofs.', stat: 'fitness', dc: 45, pay: 2, win: 'Everybody catches something. One of them catches the sun as well.', lose: 'A swell gets up. Nobody catches anything, and nobody keeps their lunch.' },
  finance: { r: 2, icon: '🧾', title: 'Do the fishermen’s tax returns', desc: 'A carrier bag of receipts each. Some of the receipts are wet.', stat: 'smarts', dc: 50, pay: 1.8, win: 'Every one of them is owed a refund. You are bought a great deal of rum.', lose: 'One carrier bag turns out to be bait.' },
  politics: { r: 1, icon: '🎪', title: 'Open the church fête', desc: 'A short speech and a long afternoon.', stat: 'charm', dc: 45, pay: 0, karma: 3, fame: 2, win: 'You guess the weight of the cake to the ounce. People talk of little else.', lose: 'You call the vicar by the last vicar’s name. Twice.' },
};

// ---- the year's four festivals ----------------------------------------------------------

// One each season (the list is in season order), at a place on the map,
// with three things to enter: one go a year. A skill decides it, and a
// reigning champion is given less room every time.
export const FESTS = [
  { id: 'fair', name: 'The Spring Fair', icon: '🎪', at: 'park', where: 'in Pebble Park', blurb: 'Bunting on the green, and a brass band.', games: [
    { id: 'bake', icon: '🧁', title: 'Enter the bake-off', stat: 'craft', dc: 30, prize: 300, win: 'First prize and a rosette. The vicar asks for the recipe.', lose: 'The judge says "interesting" and moves on quickly.' },
    { id: 'tug', icon: '🪢', title: 'Pull in the tug of war', stat: 'fitness', dc: 30, prize: 250, win: 'Your side drags the fire brigade through the mud.', lose: 'You are dragged through the mud by the fire brigade.' },
    { id: 'tombola', icon: '🎟️', title: 'Run the tombola', stat: 'charm', dc: 25, prize: 0, karma: 3, win: 'You sell every ticket. Somebody wins a tin of peaches from 1987.', lose: 'A slow day at the tombola, but all in a good cause.' },
  ] },
  { id: 'regatta', name: 'Regatta Day', icon: '🚣', at: 'harbour', where: 'at the harbour', blurb: 'The whole bay is out: flags, boats, ice cream and shouting.', games: [
    { id: 'row', icon: '🚣', title: 'Row in the big race', stat: 'fitness', dc: 38, prize: 600, fame: 1, win: 'Your crew wins by half a length, and there is a silver cup for the pub shelf.', lose: 'Fourth. Out of four. Your hands are blisters.' },
    { id: 'castle', icon: '🏰', title: 'Enter the sandcastle contest', stat: 'craft', dc: 30, prize: 250, win: 'A scale model of the Town Hall, with the clock four minutes slow. The judges are speechless.', lose: 'The tide has views about your east tower.' },
    { id: 'ices', icon: '🍦', title: 'Sell ice creams along the front', stat: 'charm', dc: 28, prize: 400, win: 'You sell out by two o’clock.', lose: 'It rains. You eat the stock.' },
  ] },
  { id: 'harvest', name: 'The Harvest Show', icon: '🌾', at: 'park', where: 'in Pebble Park', blurb: 'A big tent, long tables, and vegetables being taken very seriously.', games: [
    { id: 'quiz', icon: '❓', title: 'Captain a team in the harvest quiz', stat: 'smarts', dc: 35, prize: 300, win: 'It comes down to the capital of Peru. You know the capital of Peru.', lose: 'You change a right answer to a wrong one, and your team watches you do it.' },
    { id: 'pies', icon: '🥧', title: 'Enter the pie-eating', stat: 'fitness', dc: 28, prize: 150, win: 'Eleven. A parish record. You may never eat again.', lose: 'Beaten by a girl of nine, who then asks for pudding.' },
    { id: 'jams', icon: '🍓', title: 'Judge the jams', stat: 'charm', dc: 33, prize: 0, karma: 2, fame: 1, win: 'You find something kind and true to say about forty jams. It is an art.', lose: 'You call Mrs Hadley’s damson "brave". She has not forgiven you.' },
  ] },
  { id: 'lights', name: 'The Winter Lights', icon: '🎄', at: 'highstreet', where: 'on the High Street', blurb: 'The lights go on along the High Street, usually at the second try.', games: [
    { id: 'carols', icon: '🎶', title: 'Sing the solo at the carol concert', stat: 'craft', dc: 35, prize: 200, fame: 1, win: 'The last verse, unaccompanied, in the cold. Nobody coughs.', lose: 'You come in a bar early and stay there.' },
    { id: 'swim', icon: '🥶', title: 'Take the New Year swim', stat: 'fitness', dc: 33, prize: 200, win: 'In, out, and a bacon roll. You feel immortal for about a week.', lose: 'You get as far as your knees, and make a noise people remember.' },
    { id: 'panto', icon: '🎭', title: 'Play the dame in the pantomime', stat: 'charm', dc: 38, prize: 350, fame: 2, win: '"Oh no it isn’t!" Six nights and a matinee, and the best fun you have had in years.', lose: 'The wig comes off in the second act. The children think it is the best bit.' },
  ] },
];

// ---- the notice board -------------------------------------------------------------------

// Small jobs pinned up outside the Town Hall: three each season, each to
// be done once. A skill decides how well it goes (and so what it pays).
export const ODD_JOBS = {
  fence: { icon: '🪚', title: 'Mend Mrs Hadley’s fence', stat: 'craft', dc: 25, pay: 180, win: 'Straight as a die. She pays you, and sends you home with a marrow.', lose: 'It stands up, if nobody leans on it.' },
  cat: { icon: '🐈', title: 'Find a cat called Admiral', stat: 'smarts', dc: 25, pay: 120, karma: 1, win: 'He is in the last place anybody would look: at home, behind the boiler.', lose: 'You find a cat. It is not Admiral, and it is not pleased.' },
  piano: { icon: '🎹', title: 'Help shift a piano up three flights', stat: 'fitness', dc: 35, pay: 200, win: 'Up it goes, round both corners, without a scratch on it or you.', lose: 'It is up. So is your back.' },
  leaflets: { icon: '📬', title: 'Deliver leaflets for the regatta committee', stat: 'fitness', dc: 20, pay: 100, win: 'Every door in the Bay by teatime, and only one dog.', lose: 'You do the same street twice and miss the whole of the Old Town.' },
  twins: { icon: '👶', title: 'Mind the Pascoe twins for an evening', stat: 'charm', dc: 30, pay: 140, win: 'Both asleep by eight. You do not say how.', lose: 'They are still up when the Pascoes get home. So is the cat, on the curtain rail.' },
  bingo: { icon: '🔢', title: 'Call the bingo at the church hall', stat: 'charm', dc: 25, pay: 110, karma: 1, win: '"Two fat ladies" gets a cheer and a tut, as it should.', lose: 'You call 66 as 99, twice, and there is very nearly a riot.' },
  gutters: { icon: '🪜', title: 'Clear the gutters at the vicarage', stat: 'fitness', dc: 28, pay: 160, win: 'Forty years of leaves, a tennis ball and a hymn book.', lose: 'The ladder and you part company at the porch. No harm done, to the porch.' },
  sign: { icon: '🖌️', title: 'Repaint the sign of the Gull & Anchor', stat: 'craft', dc: 35, pay: 260, win: 'The gull has never looked so pleased with itself.', lose: 'The landlord looks at it for a long time. "Is that a gull?"' },
  books: { icon: '📒', title: 'Sort out the cricket club’s accounts', stat: 'smarts', dc: 35, pay: 240, win: 'You find $300 they did not know they had, in a tea urn.', lose: 'They balance, in the end, if you squint.' },
  dogs: { icon: '🐕', title: 'Walk five dogs at once', stat: 'fitness', dc: 30, pay: 130, win: 'Five dogs out, five dogs back, and only one of them wet.', lose: 'For a time, on the beach, the dogs walk you.' },
  wedding: { icon: '🚗', title: 'Drive the wedding car', stat: 'charm', dc: 30, pay: 220, need: 'car', win: 'Ribbons on the bonnet, and the bride gets there exactly four minutes late, as is proper.', lose: 'You take the scenic route by mistake. The vicar starts without her.' },
  letters: { icon: '✉️', title: 'Write letters for old Mr Pring', stat: 'smarts', dc: 20, pay: 90, karma: 2, win: 'Three to his sister and one, very firm, to the gas board.', lose: 'He dictates faster than you write, and a good deal ruder.' },
  cakes: { icon: '🧁', title: 'Bake for the lifeboat coffee morning', stat: 'craft', dc: 28, pay: 0, karma: 4, win: 'Yours goes first. The coxswain has three slices and names the next rescue after you.', lose: 'It is eaten, out of loyalty.' },
  knots: { icon: '🪢', title: 'Teach the Sea Scouts their knots', stat: 'charm', dc: 35, pay: 150, win: 'Twelve bowlines, and nobody tied to a chair.', lose: 'You are tied to a chair.' },
  windows: { icon: '🧽', title: 'Clean the windows of the lighthouse', stat: 'fitness', dc: 40, pay: 300, win: 'All of them, right to the lamp room. You can see France. Probably.', lose: 'You do the bottom forty steps’ worth and call it a day.' },
  census: { icon: '📋', title: 'Count the gulls for the council', stat: 'smarts', dc: 30, pay: 170, win: 'Four thousand, two hundred and six. You are fairly sure about the six.', lose: 'They will not keep still. You put "many".' },
};

// ---- the weather ------------------------------------------------------------------------

// Each season has its weather, and some of it matters. odds: how likely
// each kind is in spring, summer, autumn and winter.
export const WEATHER = {
  fair: { name: 'Fair', icon: '🌤️', odds: [5, 6, 4, 4], text: 'A fair season, and nothing to complain of, though people will.' },
  wet: { name: 'Wet', icon: '🌧️', odds: [4, 1, 3, 2], text: 'Rain most days. The allotments water themselves, and nobody is sitting in the park for pleasure.' },
  hot: { name: 'A heatwave', icon: '🥵', odds: [0, 3, 0, 0], text: 'The hottest season anyone remembers. The surf is perfect, and a bed that is not watered will suffer.' },
  storm: { name: 'Gales', icon: '🌬️', odds: [1, 0, 3, 2], text: 'Gales from the south-west. No boats are going out, and the tide is leaving all sorts on the beach.' },
  fog: { name: 'Fog', icon: '🌫️', odds: [1, 0, 2, 1], text: 'Fog off the sea for days on end. The lighthouse is working overtime, and a constable cannot see his own boots.' },
  snow: { name: 'Snow', icon: '🌨️', odds: [0, 0, 0, 3], text: 'Deep snow. A bicycle is no use at all, and the town is very quiet.' },
};

// ---- a shift done by hand ---------------------------------------------------------------

// Every career has a game of its own (they are in mini.js). game: which.
// said: how the shift went, from a shift to forget up to a blinder.
// After PLAY_EVERY shifts left to look after themselves the boss wants to
// watch, and the next has to be done by hand.
// low: for the lower rungs, where the top's words would not fit (a porter does
// not stitch): [up to this rung, title, said (or the career's own)]. See jobGame.
export const PLAY_EVERY = 5;
export const JOB_GAMES = {
  kitchen: { game: 'pans', icon: '🍳', title: 'Work the pass yourself', low: [[1, 'Mind the pans yourself'], [2, 'Work the stove yourself']], said: ['Three burnt, two raw, and the head waiter in tears.', 'Everything goes out, and most of it hot.', 'A clean service. The pass is quiet, which is the highest praise there is.', 'Not a pan out of place all night. The kitchen applauds, which never happens.'] },
  retail: { game: 'till', icon: '💵', title: 'Take the till yourself', said: ['The till is forty dollars out, and nobody can say which way.', 'The till balances, near enough.', 'Right to the penny, with a queue out of the door.', 'Right to the penny all day, and every customer leaves smiling.'] },
  trades: { game: 'pipes', icon: '🔧', title: 'Plumb it in yourself', said: ['It leaks. It is not supposed to leak.', 'It holds water, which is the main thing.', 'Neat, tight, and done by teatime.', 'Not a drip. The inspector takes a photograph for his own pleasure.'] },
  tech: { game: 'sweep', icon: '🐛', title: 'Hunt the bugs yourself', said: ['You fix one bug and let out four.', 'It runs. Nobody asks how.', 'Clean, and out on the day it was promised.', 'Not one bug left alive. They name the release after you.'] },
  medicine: { game: 'steady', icon: '🩹', title: 'Do the stitching yourself',
    low: [[0, 'Steer the beds yourself', ['A trolley into a fire door, and the patient on it wide awake now.', 'Down to X-ray and back, with one wrong turn.', 'Every bed where it should be, on time.', 'Not a bump all shift. Sister says you could steer a bed through a keyhole.']],
      [2, 'Do the dressings yourself', ['The dressing comes off before you have finished putting it on.', 'It will hold, more or less.', 'Neat work. Sister says so, and Sister says very little.', 'Dressings so neat the registrar comes down to admire them.']]],
    said: ['The stitches would shame a sailmaker.', 'It will heal, with a scar to talk about.', 'Neat work. Sister says so, and Sister says very little.', 'Stitches so fine the registrar comes down to admire them.'] },
  police: { game: 'lineup', icon: '🕵️', title: 'Run the line-up yourself', low: [[0, 'Spot the shoplifter yourself', ['You stop the store manager.', 'You get there in the end, after a word with the wrong man.', 'Spotted first time, all but once.', 'Right every time. The manager buys the tea.']]], said: ['You arrest the witness.', 'You get there in the end, by elimination.', 'Picked out first time, all but once.', 'Right every time. The sergeant buys the tea.'] },
  law: { game: 'print', icon: '🔎', title: 'Read the small print yourself', said: ['You sign off a contract that sells your client’s house to his tenant.', 'You catch most of it.', 'Nothing gets past you but the tea trolley.', 'Every change found. The other side’s solicitor stops returning your calls.'] },
  arts: { game: 'tune', icon: '🎸', title: 'Play the set yourself', said: ['You are a bar behind the band all night, and the band notices.', 'It hangs together, mostly.', 'Tight. People dance.', 'Not a note wrong. Somebody at the back shouts for more, and means it.'] },
  sports: { game: 'sprint', icon: '🏃', title: 'Run the race yourself', said: ['Last, and passed by a steward.', 'Third, and blowing.', 'Second, by a vest.', 'First by a street, and the clock agrees.'] },
  teaching: { game: 'marking', icon: '✏️', title: 'Do the marking yourself', said: ['You give full marks to seven eights being fifty-four.', 'Marked, more or less fairly.', 'Marked, and fairly, before the bell.', 'Every book marked, and marked right, with a kind word in each.'] },
  sea: { game: 'channel', icon: '⛵', title: 'Take the wheel yourself', low: [[1, 'Take a turn at the wheel yourself']], said: ['You find a rock that is not on the chart. It is now.', 'In, with some new paint needed.', 'In clean, with a story for the Gull.', 'Not a mark on her. The harbourmaster nods, which is his whole vocabulary.'] },
  finance: { game: 'floor', icon: '📈', title: 'Work the floor yourself', low: [[1, 'Watch the markets yourself']], said: ['You buy at the top and sell at the bottom, with great confidence.', 'You end the day about where you began it.', 'Up on the day, and nobody shouting.', 'You call every turn. The floor goes quiet when you pick up the telephone.'] },
  politics: { game: 'room', icon: '🤝', title: 'Work the room yourself', said: ['You shake a tomato, and are hit by a hand.', 'Enough hands shaken to be remembered by some.', 'A good day on the doorsteps.', 'Every hand in the ward, and not a mark on your suit.'] },
  crew: { game: 'safe', icon: '🔐', title: 'Open the safe yourself', low: [[1, 'Have a go at the safe yourself']], said: ['Forty minutes, and the only thing you open is your knuckles.', 'Open in the end, with the night watchman two doors off.', 'Open in good time. Sal nods.', 'Three numbers, three clicks, ninety seconds. Sal very nearly smiles.'] },
};
// A career's game as it is on rung r: its title and what is said of how it went.
export const jobGame = (c, r = 0) => { const k = JOB_GAMES[c], low = (k.low || []).find(([upTo]) => r <= upTo); return low ? { ...k, title: low[1], said: low[2] || k.said } : k; };

// ---- the allotment ----------------------------------------------------------------------

// sow: the seasons it can go in (0 spring). ripe: how many seasons until
// it is ready. pay: what a well-kept bed of it fetches. A crop left a
// season past ripe is lost.
export const CROPS = {
  toms: { name: 'Tomatoes', icon: '🍅', seed: 40, sow: [0], ripe: 1, pay: 380 },
  beans: { name: 'Runner beans', icon: '🫛', seed: 25, sow: [0, 1], ripe: 1, pay: 300 },
  peas: { name: 'Sweet peas', icon: '💐', seed: 30, sow: [0, 1], ripe: 1, pay: 260 },
  spuds: { name: 'Potatoes', icon: '🥔', seed: 30, sow: [0], ripe: 2, pay: 640 },
  pumpkin: { name: 'Pumpkins', icon: '🎃', seed: 50, sow: [1], ripe: 1, pay: 460 },
  leeks: { name: 'Leeks', icon: '🥬', seed: 30, sow: [1, 2], ripe: 2, pay: 600 },
  garlic: { name: 'Garlic', icon: '🧄', seed: 35, sow: [2, 3], ripe: 2, pay: 560 },
  marrow: { name: 'Show marrow', icon: '🥒', seed: 80, sow: [0], ripe: 2, pay: 120, show: true },
};
export const PLOT_RENT = 80;
export const PLOT_BEDS = 3;

// ---- curios -----------------------------------------------------------------------------

// Old things, in five sets of four. worth: the guide price. Mr Pym asks
// more or less than that, and pays more or less, as the mood takes him.
export const CURIO_SETS = { sea: 'Maritime', coin: 'Coins and medals', toy: 'Toys', book: 'Books and maps', art: 'Pictures and china' };
export const CURIOS = {
  bottle: { name: 'Ship in a bottle', icon: '🍾', set: 'sea', worth: 300 },
  sextant: { name: 'Brass sextant', icon: '🧭', set: 'sea', worth: 900 },
  bell: { name: 'Ship’s bell', icon: '🔔', set: 'sea', worth: 1500 },
  figurehead: { name: 'Figurehead', icon: '🧜', set: 'sea', worth: 5200 },
  roman: { name: 'Roman coin', icon: '🪙', set: 'coin', worth: 600 },
  medal: { name: 'Lifeboat medal', icon: '🎖️', set: 'coin', worth: 1400 },
  eight: { name: 'Pieces of eight', icon: '💰', set: 'coin', worth: 2400, art: 'some' },
  sovereign: { name: 'Gold sovereign', icon: '👑', set: 'coin', worth: 4000 },
  robot: { name: 'Tin robot', icon: '🤖', set: 'toy', worth: 350 },
  gull: { name: 'Clockwork gull', icon: '🐦', set: 'toy', worth: 800 },
  bear: { name: 'One-eared bear', icon: '🧸', set: 'toy', worth: 1200 },
  dolls: { name: 'Dolls’ house', icon: '🏠', set: 'toy', worth: 3000 },
  seaweed: { name: 'Album of pressed seaweed', icon: '🌿', set: 'book', worth: 500, art: 'an' },
  atlas: { name: 'Old atlas', icon: '🗺️', set: 'book', worth: 900, art: 'an' },
  first: { name: 'First edition', icon: '📕', set: 'book', worth: 2000 },
  chart: { name: 'Smuggler’s chart', icon: '🏴‍☠️', set: 'book', worth: 3500 },
  plate: { name: 'Willow-pattern plate', icon: '🍽️', set: 'art', worth: 250 },
  dogs: { name: 'Pair of china dogs', icon: '🐕', set: 'art', worth: 700 },
  seascape: { name: 'Seascape in oils', icon: '🖼️', set: 'art', worth: 2600 },
  captain: { name: 'Portrait of a stern captain', icon: '👨‍✈️', set: 'art', worth: 6000 },
};
// How a set, and a curio, are said in the middle of a sentence: "a set of
// maritime pieces", "an old atlas", "the Roman coin".
export const CURIO_SET_SAID = { sea: 'maritime pieces', coin: 'coins and medals', toy: 'toys', book: 'books and maps', art: 'pictures and china' };
const plainCurio = (c) => (c.name.startsWith('Roman') ? c.name : c.name[0].toLowerCase() + c.name.slice(1));
export const aCurio = (id) => `${CURIOS[id].art || 'a'} ${plainCurio(CURIOS[id])}`;
export const theCurio = (id) => `the ${plainCurio(CURIOS[id])}`;
export const curioSaid = (id) => plainCurio(CURIOS[id]);

// ---- the Gazette ------------------------------------------------------------------------

export const ECO = [
  { name: 'A deep slump', icon: '🌧️', text: 'Shops are boarded up along the front. Jobs are being cut, businesses take less and prices are falling.' },
  { name: 'A slump', icon: '🌥️', text: 'Trade is slow. Bosses are careful with pay rises, and some are letting people go.' },
  { name: 'Steady', icon: '⛅', text: 'Business in the Bay is ticking over, as it mostly does.' },
  { name: 'Good times', icon: '🌤️', text: 'The tills are ringing. Businesses take more, and bonuses are easier to come by.' },
  { name: 'A boom', icon: '☀️', text: 'Everybody is hiring and everything is selling. Shares, houses and takings are all up.' },
];
// What fills the front page when nothing has happened, by season.
export const FILLER = [
  ['Lambs on the cliff path: walkers asked to stop naming them', 'Pier to be repainted the same colour, council confirms', 'Record entry expected for bake-off', 'Daffodils "early", says man who says it every year'],
  ['Gull steals mayor’s speech', 'Hottest day since records were found', 'Ice cream van and rival ice cream van in stand-off', 'Deckchair attendant retires after 40 years of sitting down'],
  ['Marrow of "unusual size" reported on the allotments', 'Fog: lighthouse "doing its best"', 'Conker season opens amid safety fears', 'Clocks go back; Town Hall clock unaffected'],
  ['Town Hall clock now five minutes slow', 'Sea "very cold", say swimmers', 'Christmas lights switched on, eventually', 'Snowman on the green "not a likeness", insists councillor'],
];
export const SMALL_ADS = [
  'FOR SALE: wedding dress, worn once, by mistake.',
  'LOST: one parrot. Answers to nothing. Knows too much.',
  'WANTED: man with van. Or just the van.',
  'FOR SALE: complete set of encyclopaedias. No longer needed. Wife knows everything.',
  'FREE to good home: kittens, six. To any home: kittens, six.',
  'Piano lessons. Patient teacher. Detached house.',
  'FOUND: false teeth, on the pier. Smiling.',
  'Tide tables, half price. Last year’s.',
  'LOST: left welly. Sentimental value. Also the right one.',
  'Psychic night cancelled owing to unforeseen circumstances.',
  'FOR HIRE: bouncy castle. Slow puncture. Bouncy cottage.',
  'Trombone for sale. Neighbours will collect.',
  'Lonely lighthouse keeper seeks same. Must like stairs.',
  'FOR SALE: one-man band. Can deliver, slowly.',
];
