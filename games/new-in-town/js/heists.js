// New in Town: the low road with a plot. Crime as something you plan and
// pay for, not a revolving door.
//
// Jobs. A target is picked in Sal's back room: Highcliff House up the hill,
// the security van on the coast road, the Lucky Gull's counting room,
// Harbour Bank's vault, and the Merrow's treasure if it is in the museum
// (coast.js). It is cased over seasons at the right places (each visit tells
// you something, and may get you noticed), a crew is asked from the people
// you know or borrowed from Sal, a way in and a way out are chosen, and then
// the night itself is a chain of cards: the way in, whatever goes wrong, the
// take, the getaway. A haul is hot money, and has to be washed (through Sal,
// the casino, a business of your own, the bank a little at a time) before it
// can be spent; spending it loose draws the law.
//
// The law. A detective at the Town Hall, Detective Sergeant Edie Kitto,
// keeps a file on you across crimes and years. It makes every crime riskier,
// a lawyer less use and a sentence longer, and in the end, if it is thick
// enough, it puts you away for a long stretch. She can be befriended,
// bought, or sent after somebody else, and she retires one day.
//
// Sal and Nan Carne. Sal's trust in you is kept by keeping your mouth shut;
// it decides whether his car is at the gate when you come out, and your old
// place in the crew with it. A rival crew from Kettleby moves in on his
// patch: a feud over years that ends in a truce, with them gone, with Sal
// gone, or with you in charge of the pier.
//
// Prison remembers you: your standing on the landing, Mr Hobbs, a cellmate
// who may still be there next time, an old enemy or two, and who is waiting
// at the gate.
//
// The older rules call in here at a few marked places: crime(), riskOf()
// and sentence() in vice.js, jail(), release() and breakOut() in inside.js,
// and the 'busted' and 'inside' cards in events.js.
//
// Everything is kept in s.heists. The screen is heists-ui.js.

import { TROPHIES, CAREERS, money } from './data.js';

// ---- the jobs ---------------------------------------------------------------------------

// facts: what can be found out, where (place), and which part of the night
// it helps (stage: in, take or out). seen: how much a visit gets you noticed.
// lines: what you learn the first time, and the second.
// ways: how it could be done. need: crew it cannot be done without; in,
// take, out: what the way does to each part of the night; alarm: how much
// noise it starts with (a loud way is a worse charge if it goes wrong).
// rides: the getaways that make sense. min: crimes behind you before Sal
// will even talk about it. hard: how much harder than a house it is.
export const TARGETS = {
  villa: {
    name: 'Highcliff House', icon: '🏡', loot: 'a pillowcase of the judge’s silver', min: 5, haul: [30000, 80000], sev: 3, hard: 0, rides: ['own', 'hot', 'foot'],
    blurb: 'A Victorian pile on the cliff above Gorse Head: a retired judge’s clocks, his silver and his paintings of horses. He winters in Madeira.',
    facts: [
      { id: 'away', icon: '📅', name: 'When the judge is away', place: 'church', stage: 'in', seen: 3, title: 'Read the parish magazine at St Brigid’s', desc: 'The judge is a churchwarden, and the magazine says where everybody is.',
        lines: [['The parish magazine thanks Judge Hartnell for the new hymn books, and wishes him a restful winter in Madeira, "returning for Lent".', 'A note at the back of the parish magazine: the churchwarden’s flowers will be done by somebody else until March, while he is abroad.'],
          ['You count the weeks on your fingers. Madeira from November, back for Lent, and his housekeeper comes in on Tuesdays only.']] },
      { id: 'dog', icon: '🐕', name: 'The dog', place: 'farm', stage: 'in', seen: 5, title: 'Ask Tom Windle about the dog up at Highcliff', desc: 'Tom Windle knows every dog for five miles, mostly by its teeth.',
        lines: [['Tom Windle leans on his gate. "Judge’s dog? Great soft Alsatian. Bit my collie once. Housekeeper feeds it at six."'],
          ['"Sausages," says Tom Windle darkly, when you ask again. "That dog would sell its own mother for a sausage. Why do you keep asking?"']] },
      { id: 'house', icon: '🗺️', name: 'The lie of the house', place: 'headland', stage: 'take', seen: 7, title: 'Watch Highcliff House from the cliff path', desc: 'The bench on the cliff path looks straight into the judge’s study.',
        lines: [['From the bench on the cliff path you can see into the judge’s study: the clocks, the silver on the sideboard, and a safe behind a painting of a horse, which is where people always put them.'],
          ['A second afternoon on the bench, with a flask. The scullery window has a broken catch, and the lane round the back is out of sight of every house but one.']] },
    ],
    ways: {
      quiet: { name: 'In by the scullery while he is in Madeira', need: ['hands'], in: 0.08, alarm: -10, blurb: 'Slow and quiet, if you know when he is away.' },
      con: { name: 'Ring the bell as the man from the insurance', need: [], stat: 'charm', alarm: -5, take: -0.12, blurb: 'Talk your way in past the housekeeper. Charm does the work; you take only what fits in a briefcase.' },
      smash: { name: 'Through the french windows, and drive', need: ['wheel'], in: 0.15, take: -0.2, alarm: 30, loud: true, blurb: 'Quick, and over before the lights come on.' },
    },
    night: {
      quiet: 'Madeira, in the judge’s case, and a damp night in yours. The scullery window is exactly where you left it.',
      con: 'A clipboard, a borrowed tie and a voice you have practised in the bathroom mirror. The housekeeper opens the door on the chain.',
      smash: 'Gloves, a brick wrapped in a tea towel, and the engine running in the lane.',
      take: 'The study smells of pipe smoke and polish. Clocks on every wall, all ticking slightly out of time, and silver enough to sink a dinghy.',
    },
  },
  van: {
    name: 'The security van', icon: '🚚', loot: 'a sack of the security company’s money', min: 10, haul: [60000, 150000], sev: 4, hard: -0.06, rides: ['own', 'hot'],
    blurb: 'Every Friday a grey van takes the shops’ takings and the Lucky Gull’s to the bank in Kettleby, along the coast road over Gorse Head.',
    facts: [
      { id: 'route', icon: '🕓', name: 'When the van calls', place: 'highstreet', stage: 'in', seen: 6, title: 'Watch the van on its rounds', desc: 'A bench outside the chemist, and a newspaper you are not reading.',
        lines: [['A grey van with no windows: the bank at ten past four, the chemist at twenty past, the Lucky Gull at five to five. Two guards, one of whom eats a pasty at every stop.'],
          ['The next Friday, the same to the minute. The one with the pasty leaves the back door open while he signs for the bags.']] },
      { id: 'guards', icon: '💂', name: 'The guards', place: 'pub', stage: 'take', seen: 5, cost: 40, title: 'Get talking to a guard in the Gull & Anchor', desc: 'He drinks bitter, alone, and would like to tell somebody about his knee.',
        lines: [['His name is Dennis. He has nine years to his pension and a bad knee, and he hates the van, the company and above all the other guard.'],
          ['Dennis, three pints in, tells you the cash box opens with a code that changes on Mondays and is written, every Monday, on the back of his hand.']] },
      { id: 'road', icon: '🛣️', name: 'The coast road', place: 'headland', stage: 'out', seen: 3, title: 'Walk the coast road above Gorse Head', desc: 'Three hairpins, a lot of gorse, and not a house in sight.',
        lines: [['The coast road climbs above the Head in three hairpins. On the second there is a lay-by hidden by gorse, and a farm track that comes out at Windle Farm.'],
          ['You walk it again with a stopwatch. From the hairpin to the farm track is ninety seconds, and from the farm track you could be anywhere.']] },
    ],
    ways: {
      block: { name: 'Block the road at the second hairpin', need: ['muscle', 'wheel'], in: 0.1, take: 0.05, alarm: 30, loud: true, blurb: 'A broken-down lorry, a lot of shouting, and the bags out of the back.' },
      inside: { name: 'A guard who wants to retire early', need: ['inside'], in: 0.18, alarm: -15, blurb: 'Somebody in a guard’s uniform who leaves a door open and gets a share.' },
      swap: { name: 'Swap the bags at the Lucky Gull', need: ['hands'], stat: 'smarts', alarm: -20, take: -0.15, blurb: 'The cleverest and the slowest: nobody knows until Kettleby counts it.' },
    },
    night: {
      block: 'Friday, a quarter past five, and an old lorry broken down across the second hairpin with its bonnet up. The van comes round the bend and stops, because it has to.',
      inside: 'Friday. Your guard has a cold he does not have, and is sitting in the cab with the window down, looking at nothing.',
      swap: 'Five to five at the Lucky Gull, a holdall of newspaper cut to size, and Dennis signing for the bags with his back to the door.',
      take: 'Grey canvas bags with lead seals, stacked like sandbags, each one heavier than it looks.',
    },
  },
  gull: {
    name: 'The Lucky Gull’s counting room', icon: '🎰', loot: 'the Lucky Gull’s weekend takings', min: 10, haul: [90000, 220000], sev: 3, hard: -0.1, rides: ['boat', 'own', 'hot', 'foot'],
    blurb: 'The casino on the end of the pier counts its takings in a room under the floor, and on a bank holiday weekend there is a great deal to count.',
    facts: [
      { id: 'cage', icon: '🪙', name: 'The cage and the counting room', place: 'casino', stage: 'take', seen: 6, cost: 150, title: 'Play the tables, and watch the cage', desc: 'Lose a little money slowly, which is what the tables are for.',
        lines: [['A long night at the tables, a lot of lost hands, and a good look at the cashier’s cage. The bags go down through a hatch behind it at two in the morning.'],
          ['Another long night. The counting room has one door, one guard, and a floor of old pier planks.']] },
      { id: 'staff', icon: '🃏', name: 'The people who work there', place: 'pub', stage: 'in', seen: 5, cost: 40, title: 'Buy a croupier a drink at the Gull & Anchor', desc: 'Off shift, in her waistcoat still, with her shoes off under the table.',
        lines: [['A croupier called Marguerite tells you the guard on the counting room sleeps from three until four, and nobody minds.'],
          ['Marguerite again. The alarm on the hatch, she says, has not worked since the storm of the century, which was last March.']] },
      { id: 'under', icon: '🌊', name: 'Under the pier', place: 'harbour', stage: 'out', seen: 4, title: 'Walk out under the pier at low water', desc: 'Among the iron legs, with the casino floor creaking overhead.',
        lines: [['At low water you can walk out under the pier among the iron legs, with the casino floor creaking overhead and something dripping down your collar.'],
          ['Again at low water, with a torch. Under the counting room the planks are new, nailed and not bolted, and a dinghy could lie against the leg below them unseen.']] },
    ],
    ways: {
      floor: { name: 'Up through the floor from under the pier', need: ['hands'], in: 0.08, alarm: -10, blurb: 'A saw, the tide and a dinghy. Quiet, if the planks are what you think.' },
      inside: { name: 'Somebody inside leaves the hatch open', need: ['inside'], in: 0.15, alarm: -10, blurb: 'Somebody on the staff who wants a share, and a key.' },
      hold: { name: 'Hold up the counting room at closing', need: ['muscle'], in: 0.12, alarm: 35, loud: true, blurb: 'Masks, a lot of shouting, and the counting-room door off its hinges.' },
    },
    night: {
      floor: 'Bank holiday Monday, low water at half past two, and the casino’s floor creaking over your head like a ship.',
      inside: 'Bank holiday Monday. At ten past three, as promised, a light goes on and off once behind the hatch.',
      hold: 'Closing time on bank holiday Monday. Masks on, in the service corridor, with your heart going like a drum.',
      take: 'The counting room: a table, a counting machine still warm, and the whole weekend in bags on the floor.',
    },
  },
  bank: {
    name: 'Harbour Bank’s vault', icon: '🏦', loot: 'a holdall of the county’s wages', min: 15, haul: [250000, 600000], sev: 4, hard: -0.22, rides: ['boat', 'own', 'hot'],
    blurb: 'The big one. Built in 1871, with walls a yard thick and a vault that holds the wages of half the county.',
    facts: [
      { id: 'floor', icon: '👔', name: 'The guards and the floor', place: 'bank', stage: 'in', seen: 8, title: 'Pay in fifty dollars, and watch the floor', desc: 'Fill in a form very slowly by the window.',
        lines: [['Two guards; one changes over at eleven, the other at three. The vault is behind the door marked PRIVATE, and the manager keeps its key on his belt.'],
          ['Another fifty dollars in. The manager has one key and the chief clerk the other, and at half past five they both lock up and go for a sherry.']] },
      { id: 'plans', icon: '📜', name: 'The old plans', place: 'library', stage: ['in', 'out'], seen: 3, title: 'Ask Miss Achterberg for the old town plans', desc: 'The archives have a plan of everything ever built in the Bay.',
        lines: [['The plans of 1871 show the bank, the High Street, and under both of them an old storm drain that runs down to the harbour wall.'],
          ['Miss Achterberg finds you the engineer’s report: the drain passes six feet under the vault, and was bricked up at the harbour end in 1938, badly.']] },
      { id: 'cash', icon: '💼', name: 'When the vault is fullest', place: 'station', stage: 'take', seen: 5, title: 'Watch the money come in on the morning train', desc: 'A platform bench, a cup of tea, and the 7.40 from the city.',
        lines: [['Two men with a box chained between them get off the 7.40 on the last Thursday of the month: the wages, for every firm from here to Kettleby.'],
          ['The last Thursday again. The wages sit in the vault from Thursday morning until the Friday payroll: one night when it holds twice what it usually does.']] },
    ],
    ways: {
      drain: { name: 'Up the old drain from the harbour', need: ['hands'], in: 0.12, alarm: -15, blurb: 'Three seasons of digging in the dark first, and then a very quiet night.' },
      inside: { name: 'A key from somebody inside', need: ['inside'], in: 0.18, alarm: -10, blurb: 'Somebody who works at the bank, and wants a share more than a pension.' },
      masks: { name: 'Masks, at opening time', need: ['muscle'], in: 0.1, take: -0.1, alarm: 40, loud: true, blurb: 'Quick and brutal: in and out before the manager has his coat off.' },
    },
    night: {
      drain: 'The last Thursday of the month. You go in at the harbour wall at midnight, on your knees, with the tide coming in behind you.',
      inside: 'The last Thursday of the month. At two in the morning, a side door that should be locked is not.',
      masks: 'The last Friday of the month, at nine o’clock exactly. The manager is still taking his coat off.',
      take: 'The vault door swings open like a church door. Shelves of canvas bags, and the payroll of half the county in brown envelopes.',
    },
  },
  merrow: {
    name: 'The Merrow Room', icon: '⚓', loot: 'the Merrow’s treasure in a holdall', min: 8, haul: [70000, 120000], sev: 3, hard: -0.06, rides: ['own', 'hot', 'foot'],
    blurb: 'The Merrow’s treasure, under glass in a room of its own at the library, with your own name over the door. Too famous to sell at home; somebody abroad will pay a third of what it is worth.',
    facts: [
      { id: 'glass', icon: '🔍', name: 'The case', place: 'library', stage: 'take', seen: 4, title: 'Stand a long while in front of the case', desc: 'Your own name over the door. Nobody will think it odd.',
        lines: [['You stand in front of the case so long that Miss Achterberg asks if you are feeling quite well. Toughened glass, a lock from 1950, and an alarm wire you can see if you crouch.'],
          ['Another long look. The wire runs to a box behind the door, and the box has a little red light that goes off when the library closes at nine.']] },
      { id: 'porter', icon: '🏏', name: 'The night porter', place: 'pub', stage: 'in', seen: 4, cost: 30, title: 'Buy the library’s night porter a pint', desc: 'Alf, who listens to the cricket from Australia all night.',
        lines: [['The night porter is called Alf. He does a round at eleven and another at three, and in between he listens to the cricket from Australia.'],
          ['Alf again, and the Ashes going badly. He would not hear a brass band in the reading room, he says, not with Australia batting.']] },
      { id: 'buyer', icon: '🚢', name: 'A buyer abroad', place: 'harbour', stage: 'out', seen: 6, title: 'Ask a Dutch skipper about a buyer', desc: 'Something that famous goes abroad, or it goes nowhere.',
        lines: [['A man on a Dutch coaster says he knows a man in Rotterdam who knows a man. Something that famous, he says, goes abroad or nowhere.'],
          ['The Dutchman again. His man in Rotterdam will pay a third of what it is worth, in cash, and collect it from a boat.']] },
    ],
    ways: {
      stay: { name: 'Hide in the stacks at closing time', need: [], stat: 'smarts', in: 0.06, alarm: -10, blurb: 'A long night among the atlases. Smarts does the work.' },
      roof: { name: 'Down through the skylight', need: ['muscle'], stat: 'fitness', alarm: 10, blurb: 'A rope, a glass cutter, and a long drop onto a parquet floor.' },
      copy: { name: 'Leave a copy in the case', need: ['hands'], in: 0.05, alarm: -35, blurb: 'Make a copy good enough to fool the town first. Nobody may notice for months.' },
    },
    night: {
      stay: 'Nine o’clock. Miss Achterberg rings her little bell, and you stay very still behind the bound Gazettes of 1890 to 1910.',
      roof: 'Two in the morning on the library roof, with the whole Bay asleep below you and the skylight frosted with salt.',
      copy: 'Two in the morning, a holdall with the copy wrapped in a towel, and Alf’s radio murmuring about a collapse in the middle order.',
      take: 'The case, and inside it the Merrow’s treasure, which you last saw coming up out of the ground with the town cheering.',
    },
  },
};

// Who does what on the night. Your own part is whatever you take yourself.
export const ROLES = {
  hands: { name: 'Hands', icon: '🔐', blurb: 'Locks, safes and alarms', helps: 'getting in and the take' },
  inside: { name: 'Inside', icon: '🗝️', blurb: 'Somebody who works there', helps: 'getting in, if the plan needs it' },
  muscle: { name: 'Muscle', icon: '💪', blurb: 'Somebody large', helps: 'getting in the loud way, and a little with the getaway' },
  wheel: { name: 'Wheel', icon: '🚗', blurb: 'Somebody to drive, or row', helps: 'the getaway' },
};
// What a job is good for, by line of work.
const FIT = {
  hands: { trades: 2.5, tech: 2.5, crew: 1.5, arts: 1, sea: 1 },
  muscle: { crew: 2.5, sports: 2.5, police: 1.5, trades: 1.5, sea: 1.5, kitchen: 1 },
  wheel: { crew: 1.5, sea: 2, sports: 1.5, police: 2 },
};
// Who could be on the inside of each place.
const INSIDE = { bank: ['finance'], gull: ['kitchen', 'arts', 'retail'], van: ['police'] };
// A share of the take, by part (Sal takes his own if any of his lads are on it).
const CUT = { friend: 0.15, inside: 0.2, lad: 0.1, sal: 0.2 };

// The ways out. out: what it does for the getaway.
export const RIDES = {
  own: { name: 'Your own car', icon: '🚗', out: 0.08, blurb: 'Fast, and registered in your name.' },
  hot: { name: 'A car from Sal’s lock-up', icon: '🚙', out: 0.1, cost: 1500, blurb: 'False plates, and burnt out in a quarry afterwards.' },
  boat: { name: 'Your boat', icon: '⛵', out: 0.12, blurb: 'No roads, no road blocks. Not in a gale.' },
  foot: { name: 'On foot', icon: '👟', out: -0.12, blurb: 'Free, and you can carry only so much.' },
};

// How long the town stays jumpy: a place hit once is not hit again for six
// years, and nothing is hit for a year and a half after anything.
const COOL = 24, JUMPY = 6;
// The first letter small, and the rest as it is (names stay capitalised).
const lowFirst = (t) => t[0].toLowerCase() + t.slice(1);

// ---- the law ----------------------------------------------------------------------------

// The detectives at the Town Hall, in the order they arrive (a new one
// comes when the last retires or is sacked).
const DETS = [{ name: 'Edie Kitto', sex: 'f' }, { name: 'Leo Treloar', sex: 'm' }, { name: 'Grace Annear', sex: 'f' }, { name: 'Ray Pascoe', sex: 'm' }];
const RANKS = ['Detective Sergeant', 'Detective Inspector', 'Detective Chief Inspector'];

// Arrested, again: what the officer says, so that it is not the same every time.
const COLLARS = [
  ['Evening, all', (w) => `A hand on your collar. "Well now," says the constable, looking at ${w}. "And what have we here?"`],
  ['A torch in your eyes', (w) => `A torch in your eyes, and behind it a constable who has clearly had a long night. "Put ${w} down," she says. "Slowly."`],
  ['Not again', (w) => `"You again," says the constable, who has arrested you before and remembers it. He looks at ${w} and sighs. "Honestly."`],
  ['Blue lights', (w) => `Blue lights at both ends of the street. A sergeant with a megaphone, which seems a bit much, invites you to stay where you are, and to leave ${w} where it is.`],
  ['Hello, hello', (w) => `The constable who stops you is young enough to be nervous and old enough to have read your file. "Right," he says, looking at ${w}. "Right. Do not move."`],
  ['The desk sergeant', (w) => `Sergeant Pascoe, who has run the front desk for twenty years, has come out from behind it specially. "I said to myself, that will be one of ours," he says, looking at ${w}.`],
];

// ---- prison: the people you share a cell with -------------------------------------------

// long: about how many seasons they have left when you first meet them.
// pal: what they do for a cellmate they like. job, sex: who they are if you
// meet them again outside.
const MATES = {
  bernard: { name: '“Books” Bernard', first: 'Bernard', full: 'Bernard Ashe', icon: '♟️', long: 60, job: 'finance', trait: 'bookish', age: 60 },
  tiny: { name: 'Tiny Doyle', first: 'Tiny', full: 'Tiny Doyle', icon: '🧱', long: 12, job: 'trades', trait: 'sporty', age: 30 },
  kev: { name: 'Kev Rudd', first: 'Kev', full: 'Kev Rudd', icon: '🧢', long: 5, job: 'crew', trait: 'witty', age: 19 },
  moss: { name: 'Old Moss', first: 'Moss', full: 'Arthur Moss', icon: '🗝️', long: 44, job: 'crew', trait: 'witty', age: 70 },
};

// ---- the state --------------------------------------------------------------------------

const blank = () => ({
  plan: null, // the job being planned (see heistsPick)
  jobs: [], // { k, t, how: 'clean' | 'messy' | 'bust', got, crew }
  after: {}, // target: when it was last hit
  away: {}, // person id: when a crew member caught with you is out
  hot: 0, washed: 0, flash: 0, // money still to be washed; washed so far; spent loose lately
  sal: 50, // Sal's trust in you
  det: { i: 0, file: 0, met: null, since: null, bond: 0, bent: null, off: 0, lies: 0, rank: 0, nailed: 0, sent: 0, visits: 0 },
  rival: { stage: 0, side: null, turf: 60, heat: 0, peace: 0, end: null, next: 0, grass: null, back: null, patch: false },
  lag: { n: 0, rep: 0, good: 50, mates: {}, foes: {}, kept: null, gate: null },
  n: { jobs: 0, clean: 0, cased: 0, collared: 0, quiet: 0 },
  f: {}, // milestones
  cd: {}, // when each of the cards here was last dealt
  crimes: 0, clean: 0, // crimes counted at the last turn of the season; seasons since the last one
});

export function install({ def, A, Life, clamp, val, hooks, addEvents }) {
  // A life saved before any of this: the law already has an idea about you.
  hooks.load.push((L) => {
    const s = L.s;
    if (!s.heists) {
      s.heists = blank();
      const H = s.heists;
      H.crimes = s.n.crimes || 0;
      H.det.file = Math.min(45, Math.round((s.record || 0) * 7 + (s.n.crimes || 0) * 0.6));
      H.lag.n = s.f.jailed ? Math.max(1, s.record || 1) : 0;
      if (s.f.heist) H.f.bank = 1;
    }
    const H = s.heists, b = blank();
    for (const k of Object.keys(b)) if (H[k] == null) H[k] = b[k];
    for (const k of ['det', 'rival', 'lag', 'n']) for (const j of Object.keys(b[k])) if (H[k][j] === undefined) H[k][j] = b[k][j];
  });

  const he = (p) => (p.sex === 'm' ? 'he' : 'she');
  const He = (p) => (p.sex === 'm' ? 'He' : 'She');
  const him = (p) => (p.sex === 'm' ? 'him' : 'her');
  const his = (p) => (p.sex === 'm' ? 'his' : 'her');
  const r100 = (n) => Math.round(n / 100) * 100;
  const P = (L, id) => L.person(id) || { name: 'Somebody', sex: 'm', bond: 0, age: 30 };
  const first = (p) => p.name.split(' ')[0];
  const out = (L) => !L.s.gaol && !L.s.dead;
  // A card of ours, not more often than every n seasons.
  const due = (L, id, n) => L.s.t - (L.s.heists.cd[id] ?? -999) >= n;
  const deal = (L, id, x = null) => { L.s.heists.cd[id] = L.s.t; L.queue(id, x); };
  // A trait from soul.js, if there is one, opens a choice of its own on some cards here.
  const trait = (id) => (L) => !!L.soulHas && L.soulHas(id);
  const list = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);

  Object.assign(Life.prototype, {
    // ---- the detective ----
    lawDet() { const d = this.s.heists.det, k = DETS[d.i % DETS.length]; return { ...k, sur: k.name.split(' ')[1], first: k.name.split(' ')[0], rank: RANKS[d.rank] }; },
    // Kitto, or Detective Inspector Kitto.
    lawWho(full = false) { const k = this.lawDet(); return full ? `${k.rank} ${k.sur}` : k.sur; },
    lawShe() { return this.lawDet().sex === 'm' ? 'he' : 'she'; },
    lawHer() { return this.lawDet().sex === 'm' ? 'his' : 'her'; },
    lawHim() { return this.lawDet().sex === 'm' ? 'him' : 'her'; },
    // How much interest the law takes in you, as a person would put it.
    lawFileWord() {
      const d = this.s.heists.det, f = d.file;
      if (d.bent != null) return 'On your payroll';
      if (d.off > this.s.t) return 'Chasing somebody else';
      return f >= 85 ? `Has your photograph on ${this.lawHer()} wall` : f >= 60 ? 'Wants you badly' : f >= 35 ? 'Has a thick file on you' : f >= 15 ? 'Keeps a file on you' : f > 3 ? 'Knows your name' : 'Has never heard of you';
    },
    lawBondWord() { const b = this.s.heists.det.bond; return b >= 60 ? 'On first-name terms' : b >= 30 ? 'A grudging respect' : b >= 10 ? 'Polite' : null; },
    // More (or less) in the file. A detective off on a false trail notices half as much.
    lawFile(d) {
      const D = this.s.heists.det;
      if (d > 0 && D.off > this.s.t) d /= 2;
      D.file = clamp(Math.round((D.file + d) * 10) / 10, 0, 100);
    },
    // Called for every crime by vice.js: a little suspicion, as much as the crime draws
    // the eye (heat), or for an arrest, evidence.
    lawNoted(sev, caught, heat = 2 + sev * 2) {
      const s = this.s;
      this.lawFile(caught ? 4 + sev * 3 : heat * 0.3 * (s.heat >= 45 ? 1.3 : 1));
    },
    // What the file adds to the chance of being caught (see riskOf in vice.js). The
    // detective has bigger things to think about than the smallest jobs (base: how risky it is anyway).
    lawRisk(base = 0.2) {
      const d = this.s.heists.det, war = this.s.heists.rival.stage === 3 && !this.s.heists.rival.end;
      return d.file / 600 * clamp(base / 0.12, 0.25, 1) - (d.bent != null ? 0.05 : 0) - (d.off > this.s.t ? 0.03 : 0) + (war ? 0.04 : 0);
    },
    // A good brief: what a lawyer can do depends on what they have on you.
    briefOdds(sev) {
      const s = this.s, d = s.heists.det;
      return clamp(0.9 - 0.11 * Math.min(5, s.record) - 0.07 * Math.max(0, sev - 2) - d.file / 170 + (this.perk('law') ? 0.1 : 0) + (d.bent != null ? 0.2 : 0) - (s.t < (s.f.licence || 0) ? 0.15 : 0), 0.05, 0.92);
    },
    // Who has hold of your collar: the detective herself, once the file is thick enough.
    lawCaught(x) { const d = this.s.heists.det; return d.file >= 60 && d.bent == null && d.off <= this.s.t && ((x && x.sev) || 2) >= 2; },
    lawOfficer(x) { return this.lawCaught(x) ? this.lawWho() : 'the constable'; },
    // The officer who arrests you, if it is the detective: harder to bribe, unless already bought.
    lawBribe() { const d = this.s.heists.det; return d.bent != null ? 0.4 : d.file >= 60 && d.off <= this.s.t ? -0.2 : 0; },
    // A thick file makes a long stretch. Returns the seasons added (see sentence in vice.js).
    lawCase(k) {
      const s = this.s, d = s.heists.det;
      if (k < 2 || d.bent != null) return 0;
      if (d.file >= 85) {
        d.nailed++; d.sent = s.t; d.closed = 1;
        this.note(`${this.lawWho(true)} finally put you away for a long stretch.`, 'big');
        return [0, 0, 5, 8, 12][k];
      }
      return d.file >= 60 ? k : d.file >= 40 ? 1 : 0;
    },
    // A conviction goes in the file and stays there: it thins a little, and only
    // the long stretch the detective has been building towards closes the case.
    lawConvicted(k, n) {
      const H = this.s.heists, d = H.det;
      H.n.collared++;
      if (d.closed) { d.closed = 0; d.file = 25; } else d.file = Math.round(d.file * 0.85 * 10) / 10;
    },
    // The arrest itself, worded so that it is not the same night every time.
    lawCollar(x) {
      const s = this.s, H = s.heists, w = x && x.what ? x.what : 'what you are carrying';
      if (this.lawCaught(x)) {
        const who = this.lawWho(true), sh = this.lawShe();
        const said = [
          `${who} is leaning on a police car with the back door already open. "I did wonder when," ${sh} says, looking at ${w}. "In you get."`,
          `A car door, and footsteps you know. ${who} looks at ${w}, then at you, and takes out a notebook that is nearly full. "Go on," ${sh} says. "Tell me it is not what it looks like."`,
          `${who} is sitting on the wall where you will have to pass, finishing a sandwich. ${sh === 'she' ? 'She' : 'He'} folds the paper neatly before ${sh} stands up. "Evening," ${sh} says, with a nod at ${w}. "I have been looking forward to this."`,
        ];
        return { title: who, text: said[H.n.collared % said.length] };
      }
      // (The first time as it always was; after that, round the others in turn.)
      const c = COLLARS[H.n.collared === 0 ? 0 : 1 + ((H.n.collared - 1 + Math.floor(s.t / 9)) % (COLLARS.length - 1))];
      return { title: c[0], text: c[1](w) };
    },
    // ---- Sal ----
    salTrust(d) { const H = this.s.heists; H.sal = clamp(H.sal + d, 0, 100); },
    salWord() { const t = this.s.heists.sal; return t >= 80 ? 'Treats you like family' : t >= 55 ? 'Trusts you' : t >= 35 ? 'Keeps an eye on you' : t >= 15 ? 'Does not trust you' : 'Wants nothing to do with you'; },
    // Sal is away: put inside at the end of the feud with Nan Carne.
    salAway() { const r = this.s.heists.rival; return r.back != null && r.back > this.s.t; },
    // ---- prison ----
    // A fresh sentence (from jail in inside.js): the landing, Mr Hobbs and Sal remember you.
    lagJail(q, was) {
      const s = this.s, H = s.heists, lag = H.lag;
      lag.n++;
      if (lag.n > 1) {
        q.rep = clamp(Math.max(q.rep, Math.round(lag.rep * 0.8)), 0, 100);
        q.good = clamp(Math.round(40 + (lag.good - 50) * 0.4) - Math.min(16, (lag.n - 1) * 4), 0, 100);
      }
      q.mate = null;
      // Sal keeps your place for somebody who kept their mouth shut.
      lag.kept = was && was.c === 'crew' && H.sal >= 45 && !this.salAway() ? { r: was.r, n: was.n, perf: was.perf } : null;
      // What was under the floorboards may not be there when you get back.
      if (H.hot > 0 && this.chance(0.3 + H.det.file / 150)) { this.note(`The police searched the house and found ${money(H.hot)} under the floorboards.`, 'bad'); H.hot = 0; }
      // A job half planned does not wait for you.
      if (H.plan && !H.plan.night) { H.plan = null; this.note('The job you were planning went cold while you were inside.'); }
    },
    // Out (from release and breakOut in inside.js): remember how it went, and see who is at the gate.
    lagFree(q, how) {
      const s = this.s, H = s.heists, lag = H.lag;
      lag.rep = q.rep; lag.good = q.good;
      // Cellmates who took to you, and are out themselves, look you up.
      for (const [id, m] of Object.entries(lag.mates)) {
        if (m.pid || m.bond < 50 || m.out > s.t || !MATES[id] || this.friends().length >= 20) continue;
        const k = MATES[id], p = this.meet({ name: k.full, sex: 'm', job: k.job, trait: k.trait, age: Math.max(19, k.age + Math.floor((s.t - m.met) / 4)), bond: 40, single: false });
        m.pid = p.id;
      }
      if (how === 'wall') return null;
      const pt = this.partner(), kin = s.people.find((p) => p.kind === 'parent' && p.bond >= 30) || s.people.find((p) => p.kind === 'child' && p.age >= 18 && p.bond >= 30);
      const mate = Object.keys(lag.mates).map((id) => ({ id, m: lag.mates[id] })).find(({ m }) => m.pid && m.bond >= 50 && this.person(m.pid) && this.person(m.pid).kind === 'friend');
      const pal = this.friends().filter((p) => p.bond >= 60);
      let who = 'none', pid = null;
      if (pt && pt.bond >= 25) { who = 'love'; pid = pt.id; } else if (kin) { who = 'kin'; pid = kin.id; } else if (mate && this.chance(0.6)) { who = 'mate'; pid = mate.m.pid; } else if (pal.length && this.chance(0.5)) { who = 'pal'; pid = this.pick(pal).id; }
      // And across the road, perhaps, a car.
      let also = null;
      const r = H.rival;
      if (H.sal >= 55 && s.n.crimes >= 10 && !this.salAway() && !(s.t < (s.f.salOff || 0))) also = 'sal';
      else if (r.stage >= 1 && !r.end && r.side !== 'sal' && this.chance(0.5)) also = 'nan';
      else if (H.det.file >= 50 && H.det.bent == null && this.chance(0.4)) also = 'det';
      lag.gate = { who, pid, also, served: q.served, how };
      return 'lagGate';
    },
    // The first card of a sentence, worded for the first time and for the times after.
    lagInText(x) {
      const s = this.s, lag = s.heists.lag, n = x.n, ss = `${n} season${n > 1 ? 's' : ''}`;
      if (lag.n < 1) return `${ss}. The gate shuts behind you, and a voice from the landing shouts something unrepeatable. You will live every one of them: there is a yard, a library, a workshop, and a great many men with time on their hands. How do you mean to start?`;
      const th = ['second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'][lag.n - 1] || `${lag.n + 1}th`;
      const rep = lag.rep >= 55 ? 'Heads nod as you pass. People remember you here.' : lag.rep < 15 ? 'Somebody leaning on the rail remembers you too, and not fondly.' : 'Nobody looks up much.';
      const lines = [
        `${ss}, your ${th} time. Mr Hobbs signs you in without looking up. "Same landing," he says. "Same view. We kept your mug." ${rep}`,
        `${ss}. The gate shuts behind you with a sound you know by heart, now: your ${th} time. ${rep}`,
        `${ss}, and the long walk down B wing for the ${th} time, with your blanket and your plastic cup. ${rep}`,
      ];
      return `${lines[(lag.n + s.t) % lines.length]} How do you mean to start, this time?`;
    },
    // ---- the job ----
    heistTarget(k) { return TARGETS[k] || null; },
    // The parts there are to fill on the job in hand: somebody inside, only where somebody could be.
    heistRoles() { const p = this.s.heists.plan; return p ? Object.keys(ROLES).filter((r) => r !== 'inside' || INSIDE[p.k]) : []; },
    // What a job pays, and how hard the vault is to open by hand (for the screen).
    heistLevel() { const p = this.s.heists.plan; return p ? { villa: 1, van: 2, gull: 3, merrow: 3, bank: 5 }[p.k] : 0; },
    // A target you could start planning now, or why not.
    heistWhy(k) {
      const s = this.s, H = s.heists, T = TARGETS[k];
      if (!T) return 'No such job.';
      if (k === 'merrow' && !(s.coast && s.coast.m && s.coast.m.end === 'museum')) return 'There is nothing in the museum worth the trouble.';
      if (H.plan) return 'One job at a time.';
      if (s.n.crimes < T.min) return `Sal will not talk about this with anybody who has fewer than ${T.min} crimes behind them (${s.n.crimes} so far).`;
      if (s.t - (H.after[k] ?? -999) < COOL) return 'They have not forgotten the last time. Not yet.';
      return null;
    },
    heistList() { const s = this.s; return Object.keys(TARGETS).filter((k) => k !== 'merrow' || (s.coast && s.coast.m && s.coast.m.end === 'museum') || s.heists.after.merrow != null); },
    // The facts there are about the job in hand.
    heistFact(i) { const p = this.s.heists.plan; return p ? TARGETS[p.k].facts[i] || null : null; },
    heistKnow(id) { const p = this.s.heists.plan; return p ? p.know[id] || 0 : 0; },
    // Everybody on the job: [{ r, kind: 'me' | 'friend' | 'lad', p, skill }].
    heistCrew() {
      const p = this.s.heists.plan;
      if (!p) return [];
      return Object.entries(p.crew).map(([r, c]) => ({ r, ...c, who: c.p ? this.person(c.p) : null })).filter((c) => c.kind !== 'friend' || c.who);
    },
    // How good somebody would be at a part (0 to 3).
    heistSkill(r, c) {
      const s = this.s, p = s.heists.plan;
      if (c === 'me') {
        if (r === 'hands') return Math.min(3, (s.st.craft * 0.6 + s.st.smarts * 0.4) / 30);
        if (r === 'muscle') return Math.min(3, s.st.fitness / 30);
        if (r === 'wheel') return Math.min(3, p && p.ride === 'boat' ? s.st.fitness / 35 : (this.motorUsable && this.motorUsable() ? (s.motor.drv || 0) / 30 : s.st.fitness / 50));
        return 0;
      }
      if (c === 'lad') return r === 'inside' ? 0 : 1.5;
      const q = typeof c === 'object' ? c : this.person(c);
      if (!q) return 0;
      if (r === 'inside') return p && (INSIDE[p.k] || []).includes(q.job) ? 2.5 + (q.trait === 'witty' ? 0.5 : 0) : 0;
      const t = { hands: q.trait === 'bookish' || q.trait === 'arty' ? 0.4 : 0, muscle: q.trait === 'sporty' ? 0.5 : 0, wheel: q.trait === 'sporty' ? 0.3 : 0 }[r] || 0;
      return Math.min(3, (FIT[r][q.job] || 0.5) + t);
    },
    // People who could be asked: friends, a sweetheart, brothers and sisters, not already on it or inside.
    heistAskable() {
      const s = this.s, H = s.heists, p = H.plan;
      const on = new Set(Object.values(p ? p.crew : {}).map((c) => c.p).filter(Boolean));
      return s.people.filter((q) => ['friend', 'partner', 'spouse', 'sibling'].includes(q.kind) && q.age >= 18 && !on.has(q.id) && !((H.away[q.id] || 0) > s.t));
    },
    // The best of them for a part, best first.
    heistCandidates(r, n = 4) {
      return this.heistAskable().filter((q) => r !== 'inside' || this.heistSkill('inside', q) > 0).sort((a, b) => this.heistSkill(r, b) - this.heistSkill(r, a) || b.bond - a.bond).slice(0, n);
    },
    // Who you would give a share to, and how much of it.
    heistCuts() {
      const out = [];
      let lad = false;
      for (const c of this.heistCrew()) {
        if (c.kind === 'me') continue;
        if (c.kind === 'lad') { lad = true; out.push([`One of Sal’s lads (${ROLES[c.r].name.toLowerCase()})`, CUT.lad]); } else out.push([`${c.who.name} (${ROLES[c.r].name.toLowerCase()})`, c.r === 'inside' ? CUT.inside : CUT.friend]);
      }
      if (lad) out.push(['Sal', CUT.sal]);
      return out;
    },
    // What a part of the crew adds to a part of the night.
    heistCrewAt(stage) {
      const p = this.s.heists.plan, T = TARGETS[p.k], w = T.ways[p.way] || {};
      const sk = (r) => { const c = p.crew[r]; if (!c || (c.kind === 'friend' && !this.person(c.p))) return 0; return (c.out ? 0 : 1) * this.heistSkill(r, c.kind === 'friend' ? c.p : c.kind); };
      if (stage === 'in') return sk('hands') * 0.04 + sk('inside') * (p.way === 'inside' ? 0.06 : 0.02) + sk('muscle') * (w.loud ? 0.04 : 0.01);
      if (stage === 'take') return sk('hands') * 0.05 + sk('inside') * 0.03 + sk('muscle') * 0.01;
      return sk('wheel') * 0.05 + sk('muscle') * 0.015;
    },
    // The chance of one part of the night going right: what you know, how,
    // who with, how much noise there is already, and how hard the law is looking.
    heistStage(stage, mod = 0) {
      const s = this.s, H = s.heists, p = H.plan;
      if (!p) return 0;
      const T = TARGETS[p.k], w = T.ways[p.way] || {}, n = p.night || { alarm: 0 };
      let o = 0.6 + T.hard + (w[stage] || 0) + mod;
      for (const f of T.facts) if ([].concat(f.stage).includes(stage)) o += (p.know[f.id] || 0) * 0.07;
      if (w.stat && stage === 'in') o += (s.st[w.stat] - 50) / 160;
      o += this.heistCrewAt(stage);
      if (stage === 'out') {
        const rd = RIDES[p.ride];
        o += rd ? rd.out : -0.15;
        if (p.ride === 'boat' && s.wx === 'fog') o += 0.06;
        if (n.slow) o -= 0.06;
      }
      if (stage === 'take' && n.hand != null) o += (n.hand - 0.5) * 0.3;
      if (s.wx === 'fog') o += 0.03;
      o -= H.det.file / 300 + p.noticed / 300 + n.alarm / 250;
      return clamp(o + this.luck(), 0.05, 0.92);
    },
    // About how likely you are to come home with it, as things stand.
    heistChance() {
      const p = this.s.heists.plan;
      if (!p || !p.way) return 0;
      const a = this.heistStage('in'), b = this.heistStage('take'), c = this.heistStage('out');
      return clamp((a + (1 - a) * 0.4) * (b * 0.3 + 0.7) * c * 0.92, 0.02, 0.95);
    },
    // Why the night cannot be tonight, if it cannot.
    heistReady() {
      const s = this.s, H = s.heists, p = H.plan;
      if (!p) return 'There is no job planned.';
      const T = TARGETS[p.k];
      if (p.night) return 'It is tonight already.';
      if (!p.way) return 'Decide how it is to be done.';
      if (!p.ride) return 'Decide how you get away.';
      const w = T.ways[p.way], on = new Set(this.heistCrew().filter((c) => !c.out).map((c) => c.r));
      for (const r of w.need) if (!on.has(r)) return `The plan needs somebody on ${ROLES[r].name.toLowerCase()}.`;
      if (p.way === 'drain' && p.dug < 3) return `The drain is not dug through yet (${p.dug} of 3).`;
      if (p.way === 'copy' && p.copy < 2) return `The copy is not finished (${p.copy} of 2).`;
      if (p.ride === 'own' && !(this.motorUsable && this.motorUsable())) return 'You have no car you can drive.';
      if (p.ride === 'boat' && !s.items.boat) return 'You have no boat.';
      if (p.ride === 'boat' && s.wx === 'storm') return 'Not in a gale. Not in a boat.';
      if (p.ride === 'hot' && (H.sal < 30 || s.t < (s.f.salOff || 0) || this.salAway())) return 'Sal will not lend you a car.';
      const last = H.jobs.length ? H.jobs[H.jobs.length - 1].t : -999;
      if (s.t - last < JUMPY) return 'The town is still jumpy from the last one. Give it time.';
      return null;
    },
    // Hot money waiting to be washed, in words.
    heistHotWord() { const n = this.s.heists.hot; return n >= 100000 ? 'under the floorboards, and in the loft' : n >= 20000 ? 'under the floorboards' : 'in a biscuit tin'; },
  });

  // ---- the turn of a season ----------------------------------------------------------------

  hooks.late.push((L, jailed) => {
    const s = L.s, H = s.heists, d = H.det, r = H.rival;
    if (s.dead) return;
    // A quiet season or two, and the file thins; a run of crime, and it does not.
    if (s.n.crimes > H.crimes) H.clean = 0; else H.clean++;
    H.crimes = s.n.crimes;
    // (Time inside does not count: a detective does not forget somebody just because they are locked up.)
    if (!jailed) L.lawFile(H.clean >= 8 ? -3.5 : H.clean >= 1 ? -2.2 : -1);
    if (d.bent != null) L.lawFile(-1);
    // Money spent faster than anybody honest could earn it is noticed.
    if (H.flash >= 12000) L.lawFile(Math.min(5, H.flash / 6000));
    H.flash = Math.round(H.flash * 0.6);
    if (H.plan && !H.plan.night) {
      H.plan.noticed = Math.max(0, H.plan.noticed - 6);
      // Somebody on the crew who is no longer in your life is no longer on the crew.
      for (const r of Object.keys(H.plan.crew)) { const c = H.plan.crew[r], q = c.kind === 'friend' && L.person(c.p); if (c.kind === 'friend' && (!q || q.kind === 'enemy')) delete H.plan.crew[r]; }
    }
    // Sal's trust settles, slowly; and the landing forgets you, slowly.
    if (H.sal > 60) H.sal -= 0.5; else if (H.sal < 40 && s.t >= (s.f.salOff || 0)) H.sal += 0.5;
    if (!jailed) H.lag.rep = Math.max(0, H.lag.rep - 1);
    if (s.gaol) { gaolTurn(L); return; }
    // At most one of these a season, and not on top of something else.
    if (s.pend.length) return;
    if (d.met == null && d.file >= 18) { deal(L, 'kittoMeet'); return; }
    if (lawTurn(L)) return;
    if (carneTurn(L)) return;
    if (H.plan && !H.plan.night) planTurn(L);
  });

  // Inside: who you share with, and who you meet again.
  function gaolTurn(L) {
    const s = L.s, H = s.heists, lag = H.lag, q = s.gaol;
    if (q.mate == null) {
      q.mate = pickMate(L);
      const m = lag.mates[q.mate];
      if (q.mate === 'bernard' && m.n === 1) L.queue('gCellmate');
      else L.queue('lagMate', { m: q.mate });
      // An old enemy, still on the wing.
      const foe = Object.keys(lag.foes).find((k) => lag.foes[k] > s.t);
      if (foe) L.queue('lagFoe', { k: foe });
      return;
    }
    const m = lag.mates[q.mate];
    if (m) {
      m.bond = Math.min(100, m.bond + 3);
      if (q.mate === 'bernard') L.gain('smarts', 0.5);
      if (q.mate === 'tiny') q.rep = Math.max(q.rep, 30);
      if (q.mate === 'moss' && q.dig > 0 && q.dig < 4 && L.chance(0.15)) q.dig++;
    }
    // The detective who put you here comes to see you, once.
    if (H.det.sent && H.det.sent >= s.t - 4 && !H.det.visit && L.chance(0.5)) { H.det.visit = 1; L.queue('kittoGaol'); }
  }
  // Who you share a cell with this time: an old cellmate who is still in, or somebody new.
  function pickMate(L) {
    const s = L.s, lag = s.heists.lag;
    const known = Object.keys(lag.mates).filter((id) => lag.mates[id].out > s.t);
    let id;
    if (L.salAway() && !lag.mates.sal) { lag.mates.sal = { met: s.t, out: s.heists.rival.back, bond: 20, n: 0 }; id = 'sal'; } else if (known.length) id = L.pick(known);
    else {
      const fresh = Object.keys(MATES).filter((k) => !lag.mates[k]);
      if (s.heists.rival.stage >= 1 && !s.heists.rival.end && !lag.mates.danny && L.chance(0.4)) { lag.mates.danny = { met: s.t, out: s.t + L.int(6, 12), bond: 10, n: 0 }; id = 'danny'; } else if (fresh.length) {
        id = L.pick(fresh);
        lag.mates[id] = { met: s.t, out: s.t + MATES[id].long + L.int(-3, 3), bond: 15, n: 0 };
      } else {
        id = L.pick(Object.keys(MATES));
        lag.mates[id].out = s.t + L.int(4, 12);
      }
    }
    const m = lag.mates[id];
    m.n++;
    if (m.out <= s.t) m.out = s.t + L.int(4, 10);
    return id;
  }

  // The detective's season: a visit, a promotion, a reckoning.
  function lawTurn(L) {
    const s = L.s, H = s.heists, d = H.det;
    if (d.met == null) return false;
    if (d.since == null) d.since = s.t;
    // Bought: and now and then, somebody notices.
    if (d.bent != null && L.chance(0.04) && due(L, 'kittoBent', 8)) { deal(L, 'kittoBent'); return true; }
    // Promoted on the strength of you.
    if ((d.rank === 0 && d.file >= 50 && s.t - d.since >= 12) || (d.rank === 1 && d.file >= 75 && s.t - d.since >= 28)) { deal(L, 'kittoPromo'); return true; }
    // Years go by; detectives retire.
    if (s.t - d.since >= 90 && L.chance(0.15)) { deal(L, 'kittoRetire'); return true; }
    if (H.flash >= 15000 && due(L, 'kittoFlash', 8) && L.chance(0.5)) { deal(L, 'kittoFlash'); return true; }
    if (d.file >= 25 && due(L, 'kittoVisit', 6) && L.chance(0.12 + d.file / 500)) { deal(L, 'kittoVisit'); return true; }
    return false;
  }

  // The job in hand: a crew member who talks to the wrong people, or a target that notices.
  function planTurn(L) {
    const s = L.s, p = s.heists.plan;
    const grass = L.heistCrew().find((c) => c.kind === 'friend' && c.g && !c.known);
    const cased = Object.values(p.know).reduce((a, n) => a + n, 0);
    if (grass && cased >= 2 && L.chance(0.22 + s.st.smarts / 500)) { L.queue('heistGrass', { p: grass.p }); return; }
    if (s.t - p.t >= 16 && due(L, 'heistStale', 12)) deal(L, 'heistStale');
  }

  // Nan Carne's lot: a feud over years, a card every so often.
  function carneTurn(L) {
    const s = L.s, H = s.heists, r = H.rival;
    if (r.end) {
      if (r.end === 'sal' && r.back != null && r.back <= s.t && !H.f.salHome) { H.f.salHome = 1; L.queue('salHome'); return true; }
      if (r.end === 'yours' && r.patch) L.lawFile(1);
      if (r.end === 'yours' && r.patch && L.chance(0.03)) { L.queue('busted', { what: 'an envelope of the pier’s protection money', sev: 2 }); return true; }
      return false;
    }
    if (r.stage === 0) {
      if (s.n.crimes >= 6 && s.age >= 20 && s.t >= 12 && ((s.job && s.job.c === 'crew') || H.sal >= 55 || s.n.crimes >= 12) && L.chance(0.08)) { r.stage = 1; r.next = s.t + L.int(4, 7); deal(L, 'carneArrive'); return true; }
      return false;
    }
    if (s.t < r.next) return false;
    const step = (id, gap) => { r.next = s.t + gap; deal(L, id); return true; };
    if (!H.cd.carneNan) return step('carneNan', L.int(4, 7));
    if (!H.cd.carneFire) { r.stage = 2; return step('carneFire', L.int(4, 7)); }
    if (r.heat >= 30 && r.side !== 'nan' && due(L, 'carneHit', 10) && L.chance(0.5)) return step('carneHit', L.int(3, 5));
    if (!H.cd.carneSitdown) return step('carneSitdown', L.int(4, 8));
    // (A sit-down missed, for whatever reason, is a war by default.)
    if (r.stage === 2) r.stage = 3;
    // While it goes on, a stash of hot money is a temptation to the other side.
    if (H.hot >= 20000 && r.side !== 'nan' && due(L, 'carneStash', 16) && L.chance(0.3)) return step('carneStash', L.int(3, 5));
    if (r.stage === 3) {
      // (A war does not go on for ever: after the third bad winter it ends, whatever you do.)
      if ((r.wars || 0) >= 3) { const how = L.chance(0.55) ? 'gone' : 'sal'; end(L, how); L.say('🏴', how === 'gone' ? 'The war is over: Nan Carne’s lot have gone back to Kettleby' : 'The war is over: Sal has been arrested, and Nan Carne has the pier', 'big'); return true; }
      r.wars = (r.wars || 0) + 1;
      return step('carneWar', L.int(6, 10));
    }
    return false;
  }

  // ---- what you can do: planning a job ------------------------------------------------------

  def('heistsOpen', { place: 'sal', sec: 'Jobs', icon: '🗺️', title: (L) => (L.s.heists.plan ? `The job: ${TARGETS[L.s.heists.plan.k].name}` : 'Plan a proper job'), desc: (L) => (L.s.heists.plan ? 'What you know, who is on it, and how it is to be done.' : 'A big one, done properly: picked, cased, crewed and planned over seasons.'), time: 0, open: 'heistPlan' });

  def('heistsPick', {
    time: 0,
    why: (L, k) => L.heistWhy(k),
    run(L, k) {
      const s = L.s, T = TARGETS[k];
      s.heists.plan = { k, t: s.t, know: {}, noticed: 0, crew: {}, asked: {}, way: null, ride: null, dug: 0, copy: 0, night: null };
      L.note(`Started planning a job: ${T.name}.`);
      return `${T.name}. ${L.pick(['Sal draws it on the back of a beer mat, and then burns the beer mat.', 'You write nothing down. That is the first rule.', 'A good job is nine parts looking and one part doing, Sal says. He has never done the looking himself.'])} First, find out all you can.`;
    },
  });
  def('heistsDrop', {
    time: 0,
    why: (L) => (!L.s.heists.plan ? 'There is no job planned.' : L.s.heists.plan.night ? 'It is too late for that.' : null),
    run(L) {
      const H = L.s.heists, T = TARGETS[H.plan.k];
      for (const c of L.heistCrew()) if (c.kind === 'friend') L.bond(c.who, -3);
      H.plan = null;
      return `You call off ${T.name.replace(/^The /, 'the ')}. ${L.pick(['Nobody says anything, which says it all.', 'Sal shrugs. "Better a job not done than a job done twice."', 'The plans go on the fire. You feel lighter, and poorer.'])}`;
    },
  });

  // Casing: three things to find out about every job, each in its own place.
  for (const i of [0, 1, 2]) {
    def(`heistsCase${i}`, {
      place: (L) => { const f = L.heistFact(i); return f && !L.s.heists.plan.night ? f.place : null; }, sec: 'Casing the job', per: 1,
      icon: (L) => L.heistFact(i).icon,
      title: (L) => L.heistFact(i).title,
      desc: (L) => { const f = L.heistFact(i), k = L.heistKnow(f.id); return `${f.desc} ${k >= 2 ? 'You know all there is to know.' : k ? 'You have a rough idea; another look would make sure.' : 'You know nothing yet.'} The more you are seen, the more likely somebody notices.`; },
      cost: (L) => L.heistFact(i).cost || 0,
      show: (L) => !!L.heistFact(i) && !L.s.heists.plan.night,
      why: (L) => (L.heistKnow(L.heistFact(i).id) >= 2 ? 'You know all there is to know.' : null),
      run(L) {
        const s = L.s, H = s.heists, p = H.plan, f = L.heistFact(i), k = p.know[f.id] || 0;
        // (Sharp eyes take it all in at once.)
        const two = k === 0 && L.chance(L.checkOdds('smarts', 75) * 0.5);
        p.know[f.id] = Math.min(2, k + (two ? 2 : 1));
        H.n.cased++;
        const seen = f.seen * (1 + Math.min(5, s.record) * 0.1 + H.det.file / 100) * (s.wx === 'fog' ? 0.6 : 1) * (1.2 - s.st.smarts / 250) * (0.8 + L.rnd() * 0.4);
        p.noticed = Math.round(p.noticed + seen);
        L.lawFile(seen / 10);
        if (TARGETS[p.k].facts.every((q) => (p.know[q.id] || 0) >= 2)) H.f.homework = 1;
        const said = `${L.pick(f.lines[k === 0 ? 0 : 1])}${two ? ` ${f.lines[1][0]}` : ''}`;
        if (p.noticed >= 100) { L.queue('heistBlown'); return `${said} On the way out, somebody looks at you for a moment too long.`; }
        return said;
      },
    });
  }
  // The bank's old drain, dug in the dark; the Merrow's treasure, copied at the studios.
  def('heistsDig', {
    place: 'harbour', sec: 'Casing the job', icon: '⛏️', time: 2, per: 1,
    title: (L) => `Dig along the old drain (${L.s.heists.plan.dug} of 3)`,
    desc: 'At low water, from the harbour wall towards the bank. Hard, wet, and not a thing to be seen doing.',
    show: (L) => { const p = L.s.heists.plan; return !!p && p.k === 'bank' && p.way === 'drain' && p.dug < 3 && !p.night; },
    why: (L) => (L.heistKnow('plans') < 1 ? 'You do not know where the drain runs. The old plans are at the library.' : L.s.health < 30 ? 'Not in your state.' : null),
    run(L) {
      const p = L.s.heists.plan;
      p.dug++; p.noticed += 6;
      L.gain('fitness', 1.2); L.hp(-2, 'digging in a drain');
      return p.dug >= 3 ? 'The last of the bricks comes away, and you are looking up through a grating at the underside of the vault floor. Six feet of nothing, and then the money.' : L.pick(['Two hours on your knees in water the temperature of a fridge, moving bricks that were laid to stay.', 'You break through into a dry stretch full of rats, who were there first and say so.', 'The tide comes in faster than you thought. You get out with a minute to spare and lose a boot.']);
    },
  });
  def('heistsCopy', {
    place: 'studios', sec: 'Casing the job', icon: '🏺', time: 2, per: 1, cost: 400,
    title: (L) => `Make a copy of the Merrow’s treasure (${L.s.heists.plan.copy} of 2)`,
    desc: 'Plaster, gilt, tea and patience: good enough to fool a town that only looks through glass.',
    show: (L) => { const p = L.s.heists.plan; return !!p && p.k === 'merrow' && p.way === 'copy' && p.copy < 2 && !p.night; },
    why: (L) => (L.s.st.craft < 55 ? 'Needs Craft 55.' : null),
    run(L) {
      const p = L.s.heists.plan;
      p.copy++;
      L.gain('craft', 1.6);
      return p.copy >= 2 ? 'You stand back. In a good light it is the real thing. In the light of the Merrow Room, which is not good, it is better than the real thing.' : 'The moulds, the casting, the first coat of gilt. It looks like a cake. It will not look like a cake for long.';
    },
  });

  // The crew: asking somebody you know, or borrowing one of Sal's lads.
  def('heistsAsk', {
    time: 0, per: 4,
    why(L, x) {
      const s = L.s, p = s.heists.plan;
      if (!p || p.night) return 'There is no job to ask anybody about.';
      if (!x || !ROLES[x.r]) return 'Ask them to do what?';
      if (p.crew[x.r]) return 'Somebody is doing that already.';
      const q = L.person(x.p);
      if (!q || !L.heistAskable().includes(q)) return 'Not somebody you can ask.';
      if (p.asked[q.id]) return 'You have asked already.';
      if (x.r === 'inside' && !L.heistSkill('inside', q)) return `${first(q)} does not work there.`;
      return null;
    },
    run(L, x) {
      const s = L.s, H = s.heists, p = H.plan, q = L.person(x.p);
      p.asked[q.id] = 1;
      const yes = L.chance(clamp(0.25 + q.bond / 150 + (q.job === 'crew' ? 0.3 : 0) + (x.r === 'inside' ? 0.1 : 0) + s.st.charm / 400 - (q.trait === 'kind' ? 0.3 : 0) - (q.job === 'police' ? 0.25 : 0) - (q.kind === 'partner' || q.kind === 'spouse' ? 0.1 : 0), 0.05, 0.92));
      if (!yes) {
        L.bond(q, q.trait === 'kind' ? -12 : -5);
        if (q.job === 'police' && L.chance(0.4)) { L.lawFile(15); p.noticed += 30; return `${q.name} says no, very carefully, and that ${he(q)} never heard you say it. ${He(q)} will have to think about whether that is true.`; }
        return L.pick([`${q.name} laughs, and then sees you are not joking, and stops. "No," ${he(q)} says. "And I wish you had not asked."`, `${q.name} hears you out, and shakes ${his(q)} head. "Not for any money. Not for that money."`, `"You are serious," says ${q.name}. "No. Absolutely not. Is there any more tea?"`]);
      }
      // Some people talk to the police. The thinner the friendship, and the thicker the file, the likelier.
      const g = L.chance(clamp(0.04 + Math.max(0, 55 - q.bond) / 160 + (H.det.file >= 50 ? 0.08 : 0) + (q.job === 'police' ? 0.25 : 0) - (q.kind === 'sibling' || q.kind === 'spouse' ? 0.03 : 0), 0, 0.6));
      p.crew[x.r] = { kind: 'friend', p: q.id, g };
      return L.pick([`${q.name} is quiet for a long moment. Then: "What is my cut?"`, `${q.name} grins. "I wondered when you would ask."`, `${q.name} looks at the door, then at you. "Count me in. And never say it out loud again."`]) + ` (${ROLES[x.r].name}.)`;
    },
  });
  def('heistsLad', {
    time: 0,
    why(L, r) {
      const s = L.s, H = s.heists, p = H.plan;
      if (!p || p.night) return 'There is no job.';
      if (!ROLES[r] || r === 'inside') return 'Sal’s lads do not work in banks.';
      if (p.crew[r]) return 'Somebody is doing that already.';
      if (L.salAway()) return 'Sal is away, and his lads with him.';
      if (H.sal < 40 || s.t < (s.f.salOff || 0)) return 'Sal will not lend you his lads.';
      return null;
    },
    run(L, r) { L.s.heists.plan.crew[r] = { kind: 'lad' }; return `${L.pick(['Sal sends a lad called Mouse, who is six foot four.', 'Sal sends a quiet lad in a flat cap who does not give a name.', 'Sal sends his nephew, with a warning about his nephew.'])} (${ROLES[r].name}. Sal will take his share, and his lad will take one too.)`; },
  });
  def('heistsSelf', {
    time: 0,
    why(L, r) {
      const p = L.s.heists.plan;
      if (!p || p.night) return 'There is no job.';
      if (!ROLES[r] || r === 'inside') return 'You do not work there.';
      if (p.crew[r]) return 'Somebody is doing that already.';
      if (Object.values(p.crew).some((c) => c.kind === 'me')) return 'You can only be in one place at once.';
      return null;
    },
    run(L, r) { L.s.heists.plan.crew[r] = { kind: 'me' }; return `You will do the ${ROLES[r].name.toLowerCase()} yourself.`; },
  });
  def('heistsOff', {
    time: 0,
    why: (L, r) => (!L.s.heists.plan || L.s.heists.plan.night ? 'There is no job.' : !L.s.heists.plan.crew[r] ? 'Nobody is doing that.' : null),
    run(L, r) {
      const p = L.s.heists.plan, c = p.crew[r];
      delete p.crew[r];
      if (c.kind === 'friend' && L.person(c.p)) { const q = L.person(c.p); L.bond(q, -6); return `You tell ${q.name} ${he(q)} is off the job. ${He(q)} takes it well, to your face.`; }
      return 'Somebody else, then.';
    },
  });
  def('heistsSet', {
    time: 0,
    why(L, x) {
      const s = L.s, p = s.heists.plan;
      if (!p || p.night) return 'There is no job.';
      const T = TARGETS[p.k];
      if (x && x.way) return T.ways[x.way] ? (p.way === x.way ? 'That is the plan.' : null) : 'Not a way to do it.';
      if (x && x.ride) return T.rides.includes(x.ride) && RIDES[x.ride] ? (p.ride === x.ride ? 'That is the plan.' : null) : 'Not a way to get away.';
      return 'Decide what?';
    },
    run(L, x) {
      const p = L.s.heists.plan, T = TARGETS[p.k];
      if (x.way) { p.way = x.way; return `The plan: ${lowFirst(T.ways[x.way].name)}.`; }
      p.ride = x.ride;
      return `The getaway: ${lowFirst(RIDES[x.ride].name)}.`;
    },
  });

  // The night itself. x: how well you opened the safe by hand, if you did (0 to 1).
  def('heistsGo', {
    time: 3, per: 1,
    cost: (L) => { const p = L.s.heists.plan; return p && p.ride === 'hot' ? RIDES.hot.cost : 0; },
    why: (L, x) => L.heistReady() || (x === undefined || (typeof x === 'number' && x >= 0 && x <= 1) ? null : 'Steady.'),
    run(L, x) {
      const s = L.s, H = s.heists, p = H.plan, T = TARGETS[p.k], w = T.ways[p.way];
      // The noise there is before you start: how much you were noticed, how loud the way, the weather, and whether the detective is watching.
      const alarm = Math.max(0, Math.round(p.noticed / 3 + (w.alarm || 0) + (H.det.file >= 70 && H.det.off <= s.t && H.det.bent == null ? 10 : 0) - (s.wx === 'fog' ? 10 : 0)));
      p.night = { alarm, take: 1, slow: false, hand: typeof x === 'number' && p.crew.hands && p.crew.hands.kind === 'me' ? x : null, snag: null };
      L.queue('heistIn');
      return L.pick(['You sleep for an hour in the afternoon and dream about nothing.', 'You eat a proper dinner, because you do not know when the next one will be.', 'You check everything twice and then once more, and then it is dark.']);
    },
  });

  // ---- what you can do: hot money ------------------------------------------------------------

  const wash = (L, n, rate, how) => {
    const H = L.s.heists, got = Math.round(n * rate);
    H.hot -= n; H.washed += got;
    L.cash(got);
    return `${how} ${money(got)} comes back clean${rate < 1 ? ` out of ${money(n)}` : ''}.${H.hot ? ` ${money(H.hot)} still to go.` : ''}`;
  };
  def('heistsWashSal', {
    place: 'sal', sec: 'Sal’s money', icon: '🧺', title: 'Let Sal wash it', time: 0, per: 1,
    desc: (L) => `Sal can turn up to ${money(60000)} a season into clean money, and keeps three dollars in ten. You have ${money(L.s.heists.hot)} to wash.`,
    show: (L) => L.s.heists.hot > 0,
    why: (L) => (L.salAway() ? 'Sal is away.' : L.s.heists.sal < 40 || L.s.t < (L.s.f.salOff || 0) ? 'Sal will not touch your money.' : null),
    run(L) { L.salTrust(2); return wash(L, Math.min(60000, L.s.heists.hot), 0.7, L.pick(['A man with a fish lorry takes the bags away. A week later,', 'It goes out through a scampi wholesaler and a dry cleaner in Kettleby, and'])); },
  });
  def('heistsWashChips', {
    place: 'casino', sec: 'Under the pier', icon: '🎲', title: 'Turn it into chips, and cash them in', time: 1, per: 1,
    desc: (L) => `Up to ${money(15000)} a season through the cage, less what you lose pretending to play. About ${Math.round(L.riskOf(0.04) * 100)}% somebody asks where it came from.`,
    show: (L) => L.s.heists.hot > 0,
    run(L) {
      const n = Math.min(15000, L.s.heists.hot);
      if (L.crime(0.04, 2, 'a carrier bag of used notes at the cashier’s cage', 2)) { L.s.heists.hot -= n; return 'The cashier counts it, looks at you, and presses something under the counter. The money stays in the casino.'; }
      return wash(L, n, 0.85, L.pick(['You buy chips, play a few hands badly, and cash in at the cage.', 'An evening at the roulette wheel, betting on red and black at once.']));
    },
  });
  def('heistsWashBiz', {
    place: (L) => (L.s.biz ? A.bizWork.place(L) : null), sec: 'Under the counter', icon: '🧾', title: 'Put it through the books', time: 1, per: 1,
    desc: (L) => `A busy season that never happened: up to ${money(Math.min(40000, L.bizTake() * 4))}, less the tax. About ${Math.round(L.riskOf(0.05) * 100)}% the taxman looks closer.`,
    show: (L) => !!L.s.biz && L.s.heists.hot > 0,
    run(L) {
      const n = Math.min(L.s.heists.hot, Math.max(2000, Math.min(40000, L.bizTake() * 4)));
      if (L.crime(0.05, 2, 'two sets of books and a till that rings when nobody buys anything', 2)) return 'A letter from the tax office, and then two men in a car outside.';
      return wash(L, n, 0.92, L.pick(['Your takings have a very good season on paper.', 'A run of customers nobody remembers, all paying cash.']));
    },
  });
  def('heistsWashBank', {
    place: 'bank', sec: 'Under the counter', icon: '🐖', title: 'Pay it in, a little at a time', time: 0, per: 1,
    desc: `${money(4000)} a season, never more: anything bigger and the bank asks questions. Slow, but it all comes back.`,
    show: (L) => L.s.heists.hot > 0,
    run(L) { if (L.crime(0.02, 1, 'a bag of notes with sand in the folds', 1)) return 'The cashier asks you to wait, and goes to get the manager.'; return wash(L, Math.min(4000, L.s.heists.hot), 1, 'Small notes, a paying-in slip, a smile at the counter.'); },
  });
  // A lock-up or a shop, bought for cash through a cousin of Sal's at the estate agent's, who keeps a fifth.
  const house = (L) => ['rental', 'garage'].find((k) => L.propPrice(k) <= L.s.heists.hot * 0.8) || null;
  def('heistsWashHouse', {
    place: 'bank', sec: 'Under the counter', icon: '🏚️', time: 1, per: 1,
    title: (L) => (house(L) ? `Buy ${house(L) === 'rental' ? 'a shop with a flat above' : 'a lock-up'} for cash` : 'Buy a property for cash'),
    desc: (L) => `Through a cousin of Sal’s at the estate agent’s, who keeps a fifth for the paperwork. ${house(L) ? `${money(Math.round(L.propPrice(house(L)) / 0.8))} of it buys one worth ${money(L.propPrice(house(L)))}, to let out.` : `You would need ${money(Math.round(L.propPrice('garage') / 0.8))} of it for the smallest lock-up.`} About ${Math.round(L.riskOf(0.04) * 100)}% somebody asks questions.`,
    show: (L) => L.s.heists.hot > 0,
    why: (L) => (!house(L) ? 'There is not enough of it for that.' : L.s.estate.length >= 12 ? 'A dozen properties is plenty to look after.' : null),
    run(L) {
      const s = L.s, H = s.heists, kind = house(L), price = L.propPrice(kind), n = Math.round(price / 0.8);
      H.hot -= n;
      if (L.crime(0.04, 2, 'a suitcase of cash on an estate agent’s desk', 2)) return 'The estate agent’s cousin turns out to have a cousin of his own, in the police.';
      H.washed += price;
      const e = { id: s.eid++, kind, ups: {}, let: true };
      s.estate.push(e);
      L.note(`Bought ${kind === 'rental' ? 'a shop with a flat above' : 'a lock-up'} with money that needed somewhere to go.`);
      return `Cash on the desk, a signature, and ${kind === 'rental' ? 'a shop with a flat above' : 'a lock-up'} is yours, with a tenant in it by Friday. ${money(n - price)} of it stays with the cousin.`;
    },
  });
  def('heistsSpend', {
    place: 'home', sec: 'Under the counter', icon: '🪙', title: 'Dig into the stash', time: 0, per: 2,
    desc: (L) => `${money(Math.min(10000, L.s.heists.hot))} of it, to spend as it is. Spending money you cannot account for is how most people get caught.`,
    show: (L) => L.s.heists.hot > 0,
    run(L) {
      const H = L.s.heists, n = Math.min(10000, H.hot);
      H.hot -= n; H.flash += n;
      L.cash(n);
      return `${money(n)} out of ${L.heistHotWord()}. ${L.pick(['It smells faintly of the drain it came out of.', 'Some of the notes are still in bank wrappers. You take the wrappers off.', 'You will have to be careful where you spend it. You know that.'])}`;
    },
  });
  // The detective: a cup of tea at the station, now and then.
  def('heistsTea', {
    place: 'townhall', sec: 'The police station', icon: '🫖', per: 1,
    title: (L) => `Drop in on ${L.lawWho(true)}`,
    desc: (L) => `A cup of tea at the police desk, and a chat about nothing. ${L.lawBondWord() || 'Not friends'}; ${L.lawFileWord().toLowerCase()}. Getting to know the law has its uses, and its risks.`,
    show: (L) => L.s.heists.det.met != null && L.s.heists.det.bent == null,
    run(L) {
      const s = L.s, d = s.heists.det, ok = L.chance(L.checkOdds('charm', 40 + d.file / 3));
      d.bond = Math.min(100, d.bond + (ok ? 6 : 2));
      // (Talking to the police while planning a job is a risk all of its own.)
      if (s.heists.plan && L.chance(0.25)) { s.heists.plan.noticed += 12; L.lawFile(4); return `${L.lawWho()} asks, very casually, what you have been up to lately. You say nothing much. ${L.lawShe() === 'she' ? 'She' : 'He'} writes that down.`; }
      const k = L.lawDet(), her = L.lawHer(), lines = ok
        ? [`${k.sur} tells you about ${her} allotment, ${her} mother, and a case in 1998 that still keeps ${L.lawHim()} up at night.`, `You end up doing the crossword together. ${k.sur} knows all the cricket ones.`, `${k.sur} laughs at one of your jokes, and looks surprised about it.`]
        : [`${k.sur} drinks the tea and watches you over the top of it the whole time.`, `"Is this a social call?" ${L.lawShe()} asks. "Only I have a lot of work on. Some of it is about you."`];
      return L.pick(lines);
    },
  });
  def('heistsPatchOff', {
    place: 'casino', sec: 'Under the pier', icon: '🏳️', title: 'Hand back the pier', time: 0,
    desc: 'Give up the protection money from the pier, and the risk that comes with it.',
    show: (L) => L.s.heists.rival.end === 'yours' && L.s.heists.rival.patch,
    run(L) { L.s.heists.rival.patch = false; L.karma(3); return 'You give the stallholders their money back for the season, which nobody has ever done before. They do not know where to look.'; },
  });

  // ---- money: the season's sums -------------------------------------------------------------

  hooks.worth.push((L) => L.s.heists.hot);
  hooks.bills.push((L, list) => { const d = L.s.heists.det; if (d.bent != null) list.push([`A little something for ${L.lawWho()}`, 1500 * (d.rank + 1)]); });
  hooks.income.push((L, list) => { const r = L.s.heists.rival; if (r.end === 'yours' && r.patch && !L.s.gaol) list.push(['Your patch on the pier', 2400]); });
  hooks.mood.push((L) => { const r = L.s.heists.rival; return r.stage === 3 && !r.end ? -3 : 0; });

  // ---- what other things do to Sal's trust, the file and the cells -------------------------

  hooks.acted.push((L, id) => {
    const s = L.s, H = s.heists;
    if (['work', 'workHard', 'workEasy', 'workPlay'].includes(id) && s.job && s.job.c === 'crew') L.salTrust(0.5);
    else if (['errand', 'deal', 'smuggle'].includes(id)) L.salTrust(0.5);
    // Grassing on the landing makes an enemy who does not forget.
    else if (id === 'gSnitch' && L.chance(0.5)) H.lag.foes.col = s.t + L.int(16, 40);
  });
  hooks.chose.push((L, id, x, i, win) => {
    const s = L.s, H = s.heists;
    if (id === 'busted') {
      if (i === 4) L.salTrust(-30); // "It was all Sal"
      else if (i === 0 && s.job && s.job.c === 'crew') { L.salTrust(4); H.n.quiet++; }
      // (Sent down for a job, the stash goes too, sometimes: see lagJail.)
    } else if (id === 'snitch' && i === 0) { L.salTrust(-60); H.det.bond = Math.min(100, H.det.bond + 15); if (H.det.met == null) H.det.met = s.t; } else if (id === 'gParcel') L.salTrust(i === 2 ? -25 : 3);
    else if (id === 'alibi') L.salTrust(i === 0 ? 5 : -10);
    else if (id === 'legbreakers' && i === 2) L.salTrust(-5);
    else if (id === 'gRiot' && i === 2) H.lag.foes.col = s.t + L.int(16, 40);
  });

  // ---- the cards -----------------------------------------------------------------------------

  const plan = (L) => L.s.heists.plan;
  const night = (L) => !!plan(L) && !!plan(L).night && !L.s.gaol;
  const tgt = (L) => TARGETS[plan(L).k];
  // A crew member who may let you down: the friend on it you are least close to.
  const shaky = (L) => L.heistCrew().filter((c) => c.kind === 'friend' && !c.out).sort((a, b) => a.who.bond - b.who.bond)[0] || null;
  const cmd = (L, r) => { const c = plan(L).crew[r]; return c && !c.out ? (c.kind === 'me' ? 'you' : c.kind === 'lad' ? 'Sal’s lad' : first(P(L, c.p))) : null; };
  // Noise: if there is too much, it is over.
  const noise = (L, n) => { const nt = plan(L).night; nt.alarm = Math.max(0, nt.alarm + n); return nt.alarm >= 100; };
  // Next card of the night (or the end of it).
  const onward = (L, from) => {
    const p = plan(L), nt = p.night;
    if (from === 'in') {
      const snags = SNAGS.filter((sn) => sn.when(L)), forced = snags.find((sn) => sn.must && sn.must(L));
      if (forced || (snags.length && L.chance(0.6))) { nt.snag = (forced || L.pick(snags)).id; L.queue('heistSnag'); return; }
      L.queue('heistTake'); return;
    }
    if (from === 'snag') { L.queue('heistTake'); return; }
    if (from === 'take') { L.queue('heistOut'); return; }
  };
  // Walked away: nothing taken, nothing lost, and the place a little warier.
  const walk = (L, why) => {
    const p = plan(L);
    p.night = null; p.noticed = Math.min(99, p.noticed + 15);
    for (const c of L.heistCrew()) if (c.kind === 'friend') L.bond(c.who, -2);
    return `${why} You can try again another night, if you still want to.`;
  };
  // Caught: the whole crew in the cells, and a hand on your collar.
  const bust = (L, why) => {
    const s = L.s, H = s.heists, p = plan(L), T = tgt(L), w = T.ways[p.way];
    const sev = Math.min(4, T.sev + (w.loud && T.sev < 4 ? 1 : 0));
    const names = [];
    for (const c of L.heistCrew()) {
      if (c.kind === 'friend') { L.bond(c.who, -15); H.away[c.p] = s.t + L.int(8, 16); names.push(first(c.who)); }
      if (c.kind === 'lad') L.salTrust(-8);
    }
    // Somebody always talks: the file is thicker for it.
    L.lawFile(15 + (L.heistCrew().some((c) => c.g) ? 15 : 0));
    H.jobs.push({ k: p.k, t: s.t, how: 'bust', got: 0, crew: names });
    H.after[p.k] = s.t; H.n.jobs++;
    H.plan = null;
    s.n.crimes++; L.karma(-4);
    L.queue('busted', { what: T.loot, sev });
    return `${why}${names.length ? ` ${list(names)} ${names.length > 1 ? 'are' : 'is'} in the van with you.` : ''}`;
  };

  // What may go wrong in the middle of a night. must: it will, if it can (a crew member who talked).
  const SNAGS = [
    { id: 'trap', must: (L) => L.heistCrew().some((c) => c.g), when: (L) => L.heistCrew().some((c) => c.g), icon: '🚨', title: 'Blue lights',
      text: (L) => `Halfway through, a car pulls across the end of the road with its lights off, and then another across the other end. Somebody has talked. ${L.lawWho(true)} gets out of the first car and lights a cigarette.`,
      opts: [
        { t: 'Run for it, and leave everything', check: ['fitness', 60], run(L, x, win) { if (win) { L.lawFile(15); L.warm(20); const g = L.heistCrew().find((c) => c.g); if (g && g.who) { L.bond(g.who, -40); delete plan(L).crew[g.r]; } plan(L).night = null; plan(L).noticed = 99; return `Over a wall, through a garden, along the railway line. You get away with nothing but your liberty, and the name of the one who talked: ${g && g.who ? g.who.name : 'somebody'}.`; } return bust(L, 'You make it as far as the first wall. There is a constable sitting on it.'); } },
        { t: 'Walk out with your hands up', run(L) { return bust(L, `"Evening," says ${L.lawWho()}. "I was told you would be here at two. You are early. I like that."`); } },
      ] },
    { id: 'tip', when: (L) => L.s.heists.det.bond >= 60 && L.s.heists.det.bent == null, icon: '📱', title: 'A text message',
      text: (L) => `Your telephone buzzes in your pocket, from a number you know. Two words: GO HOME. And under them, a single letter: ${L.lawDet().first[0]}.`,
      opts: [
        { t: 'Go home', run(L) { L.s.heists.det.bond = Math.min(100, L.s.heists.det.bond + 4); return walk(L, 'You tell the others something has come up. Something has.'); } },
        { t: 'Carry on regardless', run(L) { const d = L.s.heists.det; d.bond = Math.max(0, d.bond - 25); onward(L, 'snag'); noise(L, 15); return 'You put the telephone away. Somewhere in the town a detective is going to be very disappointed in you.'; } },
      ] },
    { id: 'watch', when: () => true, icon: '🥪', title: 'A night watchman',
      text: (L) => `A watchman who should not be here at all, sitting on an upturned crate in the middle of ${tgt(L).name.replace(/^The /, 'the ')}, eating a sandwich very slowly.`,
      opts: [
        { t: 'Wait in the dark until he goes', check: ['smarts', 50], run(L, x, win) { if (win) { plan(L).night.slow = true; onward(L, 'snag'); return 'Forty minutes, and a second sandwich. Then he folds up his greaseproof paper and goes.'; } if (noise(L, 30)) return bust(L, 'He finishes the sandwich, stands up, and shines his torch straight at you.'); onward(L, 'snag'); return 'He hears something and goes for a look along the far wall. You get past, but he is awake now.'; } },
        { t: 'Deal with him', check: ['fitness', 50], run(L, x, win) { L.karma(-6); if (win) { onward(L, 'snag'); return 'He is tied to his crate with his own scarf before he has swallowed. You leave him the rest of the sandwich.'; } if (noise(L, 50)) return bust(L, 'He is stronger than he looks, and he shouts louder than that.'); onward(L, 'snag'); return 'It is a messy struggle, and somebody somewhere hears it.'; } },
        { t: 'Call it off', run(L) { return walk(L, 'You back out the way you came. He never knows you were there.'); } },
      ] },
    { id: 'nerve', when: (L) => !!shaky(L) && shaky(L).who.bond < 65, icon: '😰', title: 'Cold feet',
      text: (L) => { const c = shaky(L); return `${c.who.name} has gone the colour of a candle and is whispering that ${he(c.who)} cannot do it, ${he(c.who)} has a family, ${he(c.who)} is going home.`; },
      opts: [
        { t: 'Talk them round', check: ['charm', 50], run(L, x, win) { const c = shaky(L); if (win) { L.bond(c.who, 4); onward(L, 'snag'); return `A hand on the shoulder and a few quiet words. ${first(c.who)} takes a breath, and nods.`; } plan(L).crew[c.r].out = true; L.bond(c.who, -8); onward(L, 'snag'); return `${first(c.who)} goes anyway. You carry on a pair of hands short.`; } },
        { t: 'Send them home', run(L) { const c = shaky(L); plan(L).crew[c.r].out = true; onward(L, 'snag'); return `${first(c.who)} goes, with a look of terrible relief. You carry on without.`; } },
        { t: 'Everybody goes home', run(L) { return walk(L, 'It was never going to be tonight. You all go home, and nobody sleeps.'); } },
      ] },
    { id: 'drunk', when: () => true, icon: '🍺', title: 'A drunk',
      text: 'A man on his way home from the Gull & Anchor stops in front of you, swaying, and stops singing. "Wha’ are you doing?" he asks, with enormous interest.',
      opts: [
        { t: 'Give him twenty dollars to forget it', cost: 20, odds: () => 0.8, run(L, x, win) { onward(L, 'snag'); if (win) return 'He takes the money, salutes, and walks into a lamppost. He will remember none of this.'; noise(L, 20); return 'He takes the money and tells everyone in the street about it, loudly.'; } },
        { t: 'Sing along with him', check: ['charm', 45], run(L, x, win) { onward(L, 'snag'); if (win) return 'Two verses of a song about a sailor, arm in arm, and he wanders off happy.'; noise(L, 20); return 'You do not know the words. He takes offence, loudly.'; } },
        { t: 'Ignore him', run(L) { onward(L, 'snag'); if (noise(L, 15)) return bust(L, 'He follows you, asking questions, until somebody comes to a window and then to a telephone.'); return 'He wanders off eventually, to tell somebody else.'; } },
      ] },
    { id: 'dog', when: (L) => plan(L).k === 'villa', icon: '🐕', title: 'The dog',
      text: (L) => (L.heistKnow('dog') >= 2 ? 'The dog is not in Madeira. It is standing in the scullery doorway, enormous, with its head on one side. You brought sausages.' : 'The dog is not in Madeira. It is standing in the scullery doorway, enormous, with its head on one side.'),
      opts: [
        { t: 'Sausages', show: (L) => L.heistKnow('dog') >= 1, odds: (L) => (L.heistKnow('dog') >= 2 ? 0.95 : 0.7), run(L, x, win) { onward(L, 'snag'); if (win) return 'It would sell its own mother for a sausage. It sells you the house for four.'; noise(L, 35); return 'It eats the sausages and then barks anyway, on principle.'; } },
        { t: 'Back away slowly', check: ['smarts', 45], run(L, x, win) { if (win) { onward(L, 'snag'); plan(L).night.slow = true; return 'You go round to the front instead. It takes an age, and the dog watches you all the way.'; } if (noise(L, 45)) return bust(L, 'It barks, and barks, and the lights come on in the lodge.'); onward(L, 'snag'); return 'It barks the house down, and then loses interest. Somebody will have heard.'; } },
      ] },
    { id: 'kitto', when: (L) => L.s.heists.det.file >= 55 && L.s.heists.det.bent == null && L.s.heists.det.off <= L.s.t, icon: '🚗', title: 'A parked car',
      text: (L) => `${L.lawWho(true)}’s car is parked at the end of the road with the engine running and the windows misted up.`,
      opts: [
        { t: 'Wait until it goes', run(L) { plan(L).night.slow = true; onward(L, 'snag'); return 'An hour. Then the engine coughs and the car goes, slowly, the long way round.'; } },
        { t: 'Go round the back way', check: ['smarts', 55], run(L, x, win) { onward(L, 'snag'); if (win) return 'Over two walls and through a churchyard. The car never moves.'; noise(L, 25); return 'A dustbin lid, at the worst possible moment. The car’s lights come on.'; } },
        { t: 'Call it off', run(L) { return walk(L, 'Not with that car there. You go home and lie awake.'); } },
      ] },
    { id: 'storm', when: (L) => plan(L).ride === 'boat' && (L.s.wx === 'wet' || L.s.wx === 'storm'), icon: '🌊', title: 'A sea getting up',
      text: 'The wind has gone round to the south-west, and the sea is getting up. The boat is bumping against the iron leg it is tied to.',
      opts: [
        { t: 'Hurry', run(L) { plan(L).night.take = 0.8; onward(L, 'snag'); return 'You work faster and take less. The boat will not wait.'; } },
        { t: 'Trust the knots', check: ['fitness', 50], run(L, x, win) { onward(L, 'snag'); if (win) return 'The knots hold. Marlow would be proud.'; plan(L).ride = 'foot'; return 'The painter parts, and your getaway goes out with the tide. It will have to be on foot.'; } },
      ] },
    { id: 'car', when: (L) => plan(L).ride === 'own' || plan(L).ride === 'hot', icon: '🔑', title: 'The car',
      text: 'You go to check on the getaway car. It will not start. It coughs, and thinks about it, and will not start.',
      opts: [
        { t: 'Hot-wire it', check: ['craft', 45], run(L, x, win) { onward(L, 'snag'); if (win) return 'Two wires, a spark, and it catches. Nobody needs to know it was ever in doubt.'; plan(L).ride = 'foot'; return 'You get a shock off it, and nothing else. It will have to be on foot.'; } },
        { t: 'Push it down the hill and bump it', check: ['fitness', 45], run(L, x, win) { onward(L, 'snag'); if (win) return 'It catches at the bottom of the hill with a bang like a gun going off. Every dog in the street wakes up.'; plan(L).ride = 'foot'; noise(L, 10); return 'It rolls to the bottom of the hill and stays there. It will have to be on foot.'; } },
      ] },
  ];
  const SNAG = Object.fromEntries(SNAGS.map((sn) => [sn.id, sn]));

  addEvents([
    // ---- the night ----
    {
      id: 'heistIn', icon: (L) => tgt(L).icon, title: (L) => tgt(L).name, ok: night, log: false,
      text: (L) => tgt(L).night[plan(L).way],
      opts: [
        { t: 'Take it slowly', odds: (L) => L.heistStage('in', 0.1) - L.luck(), run(L, x, win) { plan(L).night.slow = true; if (win) { onward(L, 'in'); return L.pick(['Inch by inch, and not a sound.', 'It takes twice as long as it should, and makes no noise at all.']); } if (noise(L, 30)) return bust(L, 'Something gives with a crack that goes through the whole building. Then a bell.'); onward(L, 'in'); return 'Something gives with a crack you feel in your teeth. A light comes on, two houses away, and goes off again.'; } },
        { t: 'Get on with it', odds: (L) => L.heistStage('in') - L.luck(), run(L, x, win) { if (win) { onward(L, 'in'); return L.pick(['In. Nobody stirs.', 'In, quick and clean, the way it was drawn on the beer mat.']); } if (noise(L, 40)) return bust(L, 'It goes wrong at once and all together, the way things do. A bell, a light, a shout.'); onward(L, 'in'); return 'In, but not quietly. Somewhere a dog has started barking and will not stop.'; } },
        { t: (L) => `Leave it to ${cmd(L, plan(L).way === 'inside' ? 'inside' : 'hands')}`, show: (L) => { const r = plan(L).way === 'inside' ? 'inside' : 'hands', c = plan(L).crew[r]; return !!c && c.kind !== 'me' && !c.out; }, odds: (L) => L.heistStage('in', 0.06) - L.luck(), run(L, x, win) { if (win) { onward(L, 'in'); return `${cmd(L, plan(L).way === 'inside' ? 'inside' : 'hands')} makes it look easy, which is what you are paying for.`; } if (noise(L, 35)) return bust(L, 'A fumble, a clatter, a bell. It was always going to be somebody.'); onward(L, 'in'); return 'A fumble and a curse, and too much noise, but you are in.'; } },
      ],
    },
    {
      id: 'heistSnag', icon: (L) => SNAG[plan(L).night.snag].icon, title: (L) => SNAG[plan(L).night.snag].title, ok: (L) => night(L) && !!SNAG[plan(L).night.snag], log: false,
      text: (L) => val(SNAG[plan(L).night.snag].text, L),
      // (Every possible snag's choices, each shown only for its own snag.)
      opts: SNAGS.flatMap((sn) => sn.opts.map((o) => ({ ...o, show: (L, x) => night(L) && plan(L).night.snag === sn.id && (!o.show || o.show(L, x)) }))),
    },
    {
      id: 'heistTake', icon: '💰', title: 'The take', ok: night, log: false,
      text: (L) => { const n = plan(L).night; return `${tgt(L).night.take}${n.hand != null ? (n.hand >= 0.75 ? ' The lock gave in to you in ninety seconds.' : n.hand < 0.3 ? ' The lock took forty minutes and most of your nerve.' : ' The lock took a while, but it gave.') : ''} How much do you take?`; },
      opts: [
        { t: 'What you came for, and no more', run(L) { onward(L, 'take'); return 'You fill the bags you brought, and leave the rest where it is. Greed is how people get caught, Sal says.'; } },
        { t: 'Everything you can carry', odds: (L) => L.heistStage('take', -0.05) - L.luck(), run(L, x, win) { const n = plan(L).night; if (win) { n.take = Math.min(1.35, n.take + 0.35); onward(L, 'take'); return 'Every bag, every pocket, and a pillowcase you brought just in case.'; } if (noise(L, 30)) return bust(L, 'You go back for one more bag. That is the one.'); onward(L, 'take'); return 'You go back for one more bag, and something goes over with a crash. You leave it and run.'; } },
        { t: 'Grab what is nearest and go', run(L) { const n = plan(L).night; n.take = Math.min(n.take, 0.55); n.alarm = Math.max(0, n.alarm - 15); onward(L, 'take'); return 'Two bags, and out. Half a job, done well.'; } },
        { t: '🪂 Go back for the safe in the corner as well', show: trait('daredevil'), odds: (L) => L.heistStage('take', -0.15) - L.luck(), run(L, x, win) { const n = plan(L).night; if (win) { n.take = Math.min(1.7, n.take + 0.7); onward(L, 'take'); return 'Nobody else would have tried it. It opens on the second go, and it is full.'; } if (noise(L, 45)) return bust(L, 'The safe is wired to something. Everything goes off at once.'); onward(L, 'take'); return 'It will not open, and you make a great deal of noise finding that out.'; } },
      ],
    },
    {
      id: 'heistOut', icon: (L) => (RIDES[plan(L).ride] || RIDES.foot).icon, title: 'Away', ok: night, log: false,
      text: (L) => { const p = plan(L), rd = p.ride; return `${rd === 'boat' ? 'Down the ladder to the boat, the bags passed hand to hand, the oars muffled with rags.' : rd === 'foot' ? 'Out into the dark on foot, with a bag in each hand and a long way to go.' : `Into the car, the bags in the boot, ${cmd(L, 'wheel') === 'you' ? 'you' : cmd(L, 'wheel') || 'you'} at the wheel.`}${p.night.alarm >= 50 ? ' Somewhere behind you, a siren.' : p.night.alarm >= 25 ? ' Lights are coming on behind you.' : ' The town is fast asleep.'}`; },
      opts: [
        { t: 'Steady, as if you had every right', odds: (L) => L.heistStage('out', 0.04) - L.luck(), run(L, x, win) { return win ? finish(L, 'You drive like a vicar, all the way, and nobody looks twice.') : bust(L, 'A routine stop on the coast road. The constable shines a torch into the back and then stands back very carefully.'); } },
        { t: 'Put your foot down', odds: (L) => L.heistStage('out', L.s.heists.plan.ride === 'foot' ? -0.05 : 0.01) - L.luck(), run(L, x, win) { if (win) { plan(L).night.alarm = Math.max(0, plan(L).night.alarm - 15); return finish(L, 'Round the bends with the lights off and the bags sliding about. Whatever was behind you is not behind you any more.'); } return bust(L, 'The bend at the bottom of Harbour Hill is sharper than it looks. The hedge stops you; the police car stops behind it.'); } },
        { t: 'Split up, and meet at the lock-up', odds: (L) => L.heistStage('out', 0.08) - L.luck(), run(L, x, win) { if (win) { plan(L).night.take *= 0.85; return finish(L, 'Everybody a different way. Everybody turns up at the lock-up by dawn, one of them a bag lighter and swearing blind.'); } return bust(L, 'Everybody a different way, and the police take them one at a time, starting with you.'); } },
      ],
    },
    {
      id: 'heistDone', icon: '🧮', title: 'The share-out', ok: (L) => !L.s.gaol && L.s.heists.f.last != null, log: false,
      text: (L) => L.s.heists.f.last,
      opts: [
        { t: 'Hide it, and lie low', run(L) { L.s.heists.f.last = null; return 'Under the floorboards. You sleep on top of it for a week, and badly.'; } },
        { t: 'Stand the crew a night out', cost: 600, run(L) { const H = L.s.heists; H.f.last = null; H.flash += 6000; L.joy(5); for (const p of L.friends()) if (H.jobs.length && H.jobs[H.jobs.length - 1].crew.includes(first(p))) L.bond(p, 8); return 'Champagne at the Gull & Anchor, on a Tuesday. People notice. That is the trouble with champagne.'; } },
      ],
    },
    {
      id: 'heistBlown', icon: '👀', title: 'Noticed', ok: (L) => !!plan(L) && !plan(L).night && !L.s.gaol,
      text: (L) => ({ villa: 'A man from an alarm company has been up at Highcliff House all week, and the housekeeper has started coming in every day.', van: 'The security van has started taking a different road on Fridays, and there are three guards now, none of them Dennis.', gull: 'The Lucky Gull has hired two new doormen with no necks, and the counting room has a steel floor now.', bank: 'Harbour Bank has a new guard on the door, and he has been told to look at faces.', merrow: 'The Merrow Room has a new alarm, and Miss Achterberg has started locking the door to it herself.' })[plan(L).k],
      opts: [
        { t: 'Start again from the beginning', run(L) { const p = plan(L); for (const k of Object.keys(p.know)) p.know[k] = Math.max(0, p.know[k] - 1); p.noticed = 50; L.lawFile(6); return 'Everything you knew is out of date. Back to the bench, the bar and the bus stop.'; } },
        { t: 'Drop it', run(L) { L.s.heists.plan = null; return 'You let it go. Some jobs are not meant to be.'; } },
      ],
    },
    {
      id: 'heistGrass', icon: '🫖', title: 'A cup of tea at Betty’s', ok: (L, x) => !!plan(L) && !plan(L).night && !L.s.gaol && !!L.person(x.p) && L.heistCrew().some((c) => c.p === x.p && c.g),
      text: (L, x) => `Through the steamed-up window of Betty’s Café you see ${P(L, x.p).name}, at a corner table, deep in conversation with ${L.lawWho(true)}. Neither of them is drinking their tea.`,
      opts: [
        { t: 'Throw them off the job', run(L, x) { const p = plan(L), q = P(L, x.p); for (const r of Object.keys(p.crew)) if (p.crew[r].p === q.id) delete p.crew[r]; L.bond(q, -30); p.noticed += 20; return `You tell ${q.name} it is off. ${He(q)} goes very white, and does not ask why.`; } },
        { t: 'Feed them the wrong night', check: ['smarts', 50], run(L, x, win) { const p = plan(L), c = L.heistCrew().find((k) => k.p === x.p); p.crew[c.r].known = true; if (win) { p.crew[c.r].g = false; L.s.heists.det.off = L.s.t + 2; L.lawFile(5); return `You tell ${first(P(L, x.p))} the job is next month. ${L.lawWho()} will be sitting in a cold car on the wrong night, and you will be long gone.`; } p.noticed += 30; return `You tell ${first(P(L, x.p))} the job is next month. ${He(P(L, x.p))} does not believe you, and you can see it.`; } },
        { t: 'Have it out with them', check: ['charm', 55], run(L, x, win) { const p = plan(L), q = P(L, x.p); for (const r of Object.keys(p.crew)) if (p.crew[r].p === q.id) delete p.crew[r]; if (win) { L.bond(q, -10); return `${q.name} cries, and tells you everything: ${L.lawWho()} had something on ${him(q)}. You let ${him(q)} go, and nobody else ever knows.`; } L.turnFoe ? L.turnFoe(q, 55) : L.bond(q, -40); return `${q.name} denies it, then stops denying it, then says some things that cannot be unsaid.`; } },
      ],
    },
    {
      id: 'heistStale', icon: '🗓️', title: 'Four years of planning', ok: (L) => !!plan(L) && !plan(L).night && !L.s.gaol,
      text: (L) => `You have been planning ${tgt(L).name.replace(/^The /, 'the ')} for four years. Sal has started calling it “your hobby”.`,
      opts: [
        { t: 'It is nearly ready', run(L) { return 'Nearly. Very nearly. Any season now.'; } },
        { t: 'Let it go', run(L) { L.s.heists.plan = null; L.joy(2); return 'You burn the notes in the grate, and feel ten years younger.'; } },
      ],
    },
    {
      id: 'heistLoose', icon: '🗣️', title: 'Loose talk', ok: (L, x) => !L.s.gaol && !!L.person(x.p),
      text: (L, x) => `${P(L, x.p).name} has been spending money in the Gull & Anchor, and talking, and ${L.lawWho()} has been sitting at the next table.`,
      opts: [
        { t: 'Have a quiet word', check: ['charm', 50], run(L, x, win) { const q = P(L, x.p); if (win) { L.bond(q, -4); return `${q.name} goes pale and promises to keep ${his(q)} mouth shut. ${He(q)} does.`; } L.lawFile(15); L.bond(q, -10); return `${q.name} tells you to mind your own business, loudly, in front of everybody.`; } },
        { t: 'Give them some of your share to go away for a while', cost: 5000, run(L, x) { const q = P(L, x.p); L.bond(q, 4); return `${q.name} goes to stay with an aunt in Wales. The talk stops.`; } },
        { t: 'Let it go', run(L) { L.lawFile(20); return 'It will blow over, you tell yourself. It does not blow over; it goes into a file.'; } },
      ],
    },
  ]);

  // The end of a night that went right: the haul, the shares, and the hot money.
  function finish(L, said) {
    const s = L.s, H = s.heists, p = plan(L), T = tgt(L), nt = p.night;
    const take = p.ride === 'foot' ? Math.min(0.7, nt.take) : nt.take;
    const haul = r100(L.int(T.haul[0] / 100, T.haul[1] / 100) * 100 * take);
    const cuts = L.heistCuts(), shared = cuts.reduce((a, [, c]) => a + c, 0), mine = r100(haul * Math.max(0.2, 1 - shared));
    // (One stumble on the way, and it was not clean: somebody heard something.)
    const clean = nt.alarm < 25;
    const names = L.heistCrew().filter((c) => c.kind === 'friend').map((c) => first(c.who));
    H.hot += mine;
    H.jobs.push({ k: p.k, t: s.t, how: clean ? 'clean' : 'messy', got: mine, crew: names });
    H.after[p.k] = s.t; H.n.jobs++;
    if (clean) H.n.clean++;
    if (names.length >= 3) H.f.firm = 1;
    for (const c of L.heistCrew()) {
      if (c.kind === 'friend') L.bond(c.who, 10);
      if (c.kind === 'lad') L.salTrust(3);
    }
    if (cuts.some(([w]) => w === 'Sal')) L.salTrust(4);
    // She knows. She cannot prove it, yet.
    L.lawFile(clean ? 18 : 35);
    if (p.ride === 'own' && !clean) L.lawFile(15);
    s.n.crimes++; L.karma(-(T.sev * 3 + (p.k === 'merrow' ? 15 : 0))); L.joy(12); L.warm(30);
    if (p.k === 'bank') s.f.heist = 1;
    // The Lucky Gull is under Nan Carne's protection, while she has her eye on the pier.
    const r = H.rival;
    if (p.k === 'gull' && r.stage >= 1 && !r.end) { r.turf = Math.min(100, r.turf + 15); r.heat += 15; if (r.stage === 3) end(L, 'gone'); }
    if (p.k === 'merrow') H.f.merrow = 1;
    L.note(`Pulled off a job: ${T.name}. ${clean ? 'Clean.' : 'Not cleanly.'} Your share: ${money(mine)}.`, 'big');
    // A loose mouth on a messy job.
    const loose = !clean && L.heistCrew().filter((c) => c.kind === 'friend').sort((a, b) => a.who.bond - b.who.bond)[0];
    H.plan = null;
    H.f.last = `${money(haul)} on the kitchen table, all told.${cuts.length ? ` ${cuts.map(([w, c]) => `${w}: ${Math.round(c * 100)}%`).join('; ')}.` : ''} Your share is ${money(mine)}, and every note of it is hot: it will have to be washed before it can be spent, or spent very carefully.${clean ? '' : ' It was not clean, and the police will know whose work it was.'}${p.k === 'merrow' ? ' By Monday there is a very good replica in the case and a notice about cleaning. The museum’s insurers would rather nobody knew.' : ''}`;
    L.queue('heistDone');
    if (loose && L.chance(0.5)) L.queue('heistLoose', { p: loose.p });
    return said;
  }

  // ---- the law's cards ----
  addEvents([
    {
      id: 'kittoMeet', icon: '🕵️', title: 'A woman in a raincoat', ok: out,
      text: (L) => { const k = L.lawDet(); return `Betty’s Café, a wet Tuesday. Somebody in a damp raincoat sits down opposite you without asking, stirs three sugars into a tea you paid for, and puts a card on the table: ${k.rank} ${k.name}, Starling Bay CID. "Nobody special," ${L.lawShe()} says. "I like to put a face to a name, that is all. Yours keeps coming up."`; },
      opts: [
        { t: 'Introduce yourself properly', run(L) { const d = L.s.heists.det; d.met = L.s.t; d.since = L.s.t; d.bond += 6; return `A dry, brief handshake. "Mind how you go," says ${L.lawWho()}, and means it in several ways.`; } },
        { t: 'Ask what name that would be', check: ['charm', 45], run(L, x, win) { const d = L.s.heists.det; d.met = L.s.t; d.since = L.s.t; if (win) { d.bond += 3; L.lawFile(-2); return `${L.lawWho()} laughs, once, as if it had got out without permission. "I like you," ${L.lawShe()} says. "That will make it worse."`; } L.lawFile(3); return `"That one," says ${L.lawWho()}, pointing at you with a teaspoon.`; } },
        { t: 'Get up and leave', run(L) { const d = L.s.heists.det; d.met = L.s.t; d.since = L.s.t; L.lawFile(4); return `${L.lawWho()} finishes your tea.`; } },
      ],
    },
    {
      id: 'kittoVisit', icon: '🕵️', title: (L) => L.lawWho(true), ok: (L) => out(L) && L.s.heists.det.met != null,
      text(L) {
        const s = L.s, d = s.heists.det, k = L.lawDet(), sh = L.lawShe(), Sh = sh === 'she' ? 'She' : 'He';
        const lines = [
          `${k.sur} is leaning on the harbour wall when you come past, eating chips out of the paper. "Funny thing," ${sh} says, not looking up. "Every time something goes missing in this town, somebody saw you in the Gull & Anchor the night before."`,
          `A knock at your door at eight in the morning: ${k.sur}, with a warrant ${sh} does not use and a question ${sh} does. Where were you on Thursday night?`,
          `${k.sur} sits down next to you on the bench in Pebble Park and feeds the ducks a whole sandwich, crust by crust, without a word. Then ${sh} goes.`,
          `You find ${k.sur} in the Gull & Anchor, in your seat, with two pints. One of them is for you. "Sit down," ${sh} says. "I am off duty. That is the worst kind of me."`,
          `${k.sur} is at the next table in Betty’s, reading a file. The file has your name on the front, and ${sh} is holding it so that you can see.`,
        ];
        return `${lines[(d.visits + s.t) % lines.length]}${d.bond >= 60 ? ` ${Sh} looks tired. You have known each other a long time now.` : ''}`;
      },
      opts: [
        { t: 'Offer to buy the tea', check: ['charm', 50], run(L, x, win) { const d = L.s.heists.det; d.visits++; d.bond = Math.min(100, d.bond + (win ? 8 : 2)); return win ? `You talk about the weather, the Rovers and ${L.lawHer()} terrible back. For half an hour neither of you is anything in particular.` : `${L.lawWho()} lets you pay, and watches you count the change.`; } },
        { t: 'Feed a story about somebody else', check: ['smarts', 50], run(L, x, win) { const d = L.s.heists.det; d.visits++; d.lies++; if (win) { d.off = L.s.t + 4; L.lawFile(-10); return `${L.lawWho()} writes it all down: a van, a man from Kettleby, a lock-up behind the station. ${L.lawShe() === 'she' ? 'She' : 'He'} will spend a year on it.`; } L.lawFile(10); d.bond = Math.max(0, d.bond - 5); return `"That is a very good story," says ${L.lawWho()}, "and I have heard it before, from you, about a different man."`; } },
        { t: 'Slip an envelope inside the newspaper', cost: (L) => 2500 * (L.s.heists.det.rank + 1), odds: (L) => clamp(0.12 + L.s.heists.det.bond / 300 - L.s.heists.det.lies * 0.03, 0.05, 0.5), run(L, x, win) { const d = L.s.heists.det; d.visits++; if (win) { d.bent = L.s.t; L.lawFile(-20); L.karma(-5); return `${L.lawWho()} reads the paper for a long time. Then ${L.lawShe()} folds it, envelope and all, and puts it in ${L.lawHer()} coat. "Mind how you go," ${L.lawShe()} says, and from now on it means something else.`; } L.lawFile(15); d.bond = Math.max(0, d.bond - 20); L.s.n.crimes++; L.queue('busted', { what: 'an envelope full of money, held up for the whole café to see', sev: 2 }); return `${L.lawWho()} takes the envelope out, counts it in front of the whole café, and reaches for ${L.lawHer()} handcuffs.`; } },
        { t: 'Give them Nan Carne’s lot', show: (L) => L.s.heists.rival.stage >= 1 && !L.s.heists.rival.end, run(L) { const H = L.s.heists, r = H.rival; H.det.visits++; L.lawFile(-12); H.det.bond = Math.min(100, H.det.bond + 5); r.turf = Math.min(100, r.turf + 12); r.grass = L.s.t; return `Names, dates, the minicab office in Kettleby. ${L.lawWho()} writes it all down, and says nothing, and pays for the tea.`; } },
        { t: (L) => `😏 Make ${L.lawHim()} laugh`, show: trait('charmer'), run(L) { const d = L.s.heists.det; d.visits++; d.bond = Math.min(100, d.bond + 12); return `It takes three goes. On the third, ${L.lawWho()} laughs out loud, and then looks cross about it for the rest of the afternoon.`; } },
        { t: 'Say nothing at all', run(L) { L.s.heists.det.visits++; L.lawFile(1); return L.pick(['You sit in silence until one of you gives up. It is not you.', 'Not a word. It is the only thing they cannot write down.']); } },
      ],
    },
    {
      id: 'kittoFlash', icon: '⌚', title: 'Business must be good', ok: (L) => out(L) && L.s.heists.det.met != null,
      text: (L) => `${L.lawWho()} stops you on the High Street to admire your coat. And your watch. And your shoes. "Lovely," ${L.lawShe()} says. "Business must be good. What business is it again?"`,
      opts: [
        { t: '"A win on the horses"', check: ['charm', 55], run(L, x, win) { if (win) return `"Which horse?" You tell ${L.lawHim()}. It even ran that day.`; L.lawFile(8); return `${L.lawWho()} writes the name of the horse down. You can see ${L.lawShe()} is going to look it up.`; } },
        { t: 'Show the books from your business', show: (L) => !!L.s.biz, run(L) { L.lawFile(-3); return 'Every penny accounted for, on paper. Washed money is just money with paperwork.'; } },
        { t: '"None of yours"', run(L) { L.lawFile(10); return `"Everything is mine," says ${L.lawWho()}. "That is what the job is."`; } },
      ],
    },
    {
      id: 'kittoPromo', icon: '🎖️', title: 'A postcard', ok: out,
      text: (L) => { const d = L.s.heists.det, k = L.lawDet(); return `A postcard through your door, with a picture of the police station on the front. On the back: "Promoted to ${RANKS[Math.min(2, d.rank + 1)]}. I gather I have you to thank. ${k.first[0]}. ${k.sur}."`; },
      opts: [
        { t: 'Put it on the mantelpiece', run(L) { const d = L.s.heists.det; d.rank = Math.min(2, d.rank + 1); L.joy(1); return 'It looks well there, between the clock and the photograph of your mother.'; } },
        { t: 'Send a card back', run(L) { const d = L.s.heists.det; d.rank = Math.min(2, d.rank + 1); d.bond = Math.min(100, d.bond + 5); return 'Congratulations, and a cartoon of a policeman. You do not sign it. You do not need to.'; } },
      ],
    },
    {
      id: 'kittoBent', icon: '🗂️', title: 'Two men in grey suits', ok: (L) => out(L) && L.s.heists.det.bent != null,
      text: (L) => `Two men from Professional Standards are waiting on your doorstep. They are very interested in ${L.lawWho(true)}’s bank account, and in why your name keeps appearing near it.`,
      opts: [
        { t: 'You have never met anybody of that name', check: ['charm', 60], run(L, x, win) { if (win) { const was = L.lawWho(); newDet(L, 0.5); return `They do not believe you, but they cannot prove otherwise. ${was} takes early retirement and a bungalow in Devon. The new detective has read ${L.lawWho() === was ? 'the' : 'the old'} file.`; } L.s.n.crimes++; const was = L.lawWho(); newDet(L, 0.6); L.queue('busted', { what: 'bank statements with your name all over them', sev: 3 }); return `They have photographs. ${was} is suspended that afternoon, and you are arrested the next morning.`; } },
        { t: 'Tell them everything', run(L) { const was = L.lawWho(true); L.karma(-4); newDet(L, 0.25); return `You tell them everything, and they let you go, because it is ${was} they want. You will not be welcome at a police officers’ retirement do again.`; } },
      ],
    },
    {
      id: 'kittoRetire', icon: '🎂', title: 'Thirty years of it', ok: out,
      text: (L) => `${L.lawWho(true)} is retiring. There is a do at the Gull & Anchor, with a cake shaped like a police helmet, and an invitation has come through your door with a note on the back: "Come if you like. I will be off duty for good."`,
      opts: [
        { t: 'Go, and shake hands', run(L) { const d = L.s.heists.det, b = d.bond, was = L.lawWho(); L.joy(b >= 40 ? 5 : 1); newDet(L, 0.4); return b >= 40 ? `${was} makes a speech, and at the end of it raises a glass to "the ones that got away". ${L.lawShe() === 'she' ? 'She' : 'He'} is looking at you when ${L.lawShe()} says it.` : `${was} shakes your hand at the door and says, "Do not make the new one’s life a misery." You promise nothing.`; } },
        { t: 'Send a bottle of something good', cost: 80, run(L) { const was = L.lawWho(); newDet(L, 0.4); return `${was} sends back a note: "Thank you. I shall drink it thinking of all the paperwork you caused me."`; } },
        { t: 'Stay away', run(L) { newDet(L, 0.4); return 'You hear the cheering from the end of the street. Somebody new will have the file now.'; } },
      ],
    },
    {
      id: 'kittoGaol', icon: '🪟', title: 'Visiting day', gaol: true,
      text: (L) => `${L.lawWho(true)} is on the other side of the glass, with a paperback and a bag of humbugs. "Nothing personal," ${L.lawShe()} says. "You know that."`,
      opts: [
        { t: 'Thank them for the book', run(L) { const d = L.s.heists.det; d.bond = Math.min(100, d.bond + 6); L.joy(2); return 'It is a detective novel. You read it in two nights, and the detective in it is not as good.'; } },
        { t: '"I will be out one day"', run(L) { L.respect(4); L.lawFile(3); return `"I know," says ${L.lawWho()}. "I will be waiting." The landing hears about it, and approves.`; } },
      ],
    },
  ]);
  // A new detective: the last one's notes, or some of them, go with the file.
  function newDet(L, keep) {
    const s = L.s, d = s.heists.det;
    s.heists.det = { ...blank().det, i: d.i + 1, file: Math.round(d.file * keep), met: s.t, since: s.t };
  }

  // ---- prison cards ----
  addEvents([
    {
      id: 'lagMate', icon: (L, x) => (MATES[x.m] || { icon: x.m === 'sal' ? '🦊' : '👊' }).icon, title: 'Your cellmate', gaol: true, ok: (L, x) => !!L.s.heists.lag.mates[x.m],
      text(L, x) {
        const s = L.s, m = s.heists.lag.mates[x.m], again = m.n > 1;
        // (Met again, and again: each time a little different.)
        const back = (l) => l[(m.n - 2) % l.length];
        const T = {
          bernard: again ? back(['Bernard looks up from his chess set as the door opens. "Ah," he says. "I kept the bottom bunk warm. Figuratively." He has read the whole library since you were last here, twice.', 'Bernard does not even look up. "Queen’s pawn," he says, and pushes the board across. "You were losing, as I recall."', 'Bernard has a cardigan now, and reading glasses on a string. "We must stop meeting like this," he says, which he has clearly been saving.']) : null,
          tiny: again ? back(['Tiny Doyle lifts you clean off your feet. "They said you were coming back," he says. "I told them not to say it like that."', 'Tiny is doing press-ups when you come in. He does not stop. "Hello again," he says, on about three hundred and twelve.']) : 'Your new cellmate fills the doorway and most of the cell: Tiny Doyle, in for a fight at a wedding that he says was mostly the bride’s family. He asks if you mind him doing press-ups at night. He does four hundred.',
          kev: again ? back([`It is Kev Rudd again, older and a good deal harder. "Thought I would see you," he says. He has a tattoo now, of a swallow with three legs.${m.bond >= 50 ? ' "I kept my head down, like you said. Mostly."' : ''}`, 'Kev Rudd again, with a black eye and a grin. "Car this time," he says. "Proper car. Nearly got to Kettleby."']) : 'Kev Rudd is nineteen and has never been inside before, and it shows: he sits on the edge of the bunk with his bag on his knees, as if waiting for a bus. Six months, for a moped that was not his.',
          moss: again ? back(['Old Moss has not moved, as far as you can tell, since last time. "Back already?" he says. "I remember when I used to do that."', 'Old Moss is asleep in his chair. He opens one eye. "You," he says, and closes it again. It is a kind of welcome.']) : 'Old Moss has done thirty-one years in seven prisons and talks about them like a man listing his holidays. "This one is the friendliest," he says. "The wall is the weakest, too. Not that I would know."',
          sal: 'Your cellmate is Sal. Sal, in prison grey, with a cardigan somebody has knitted him, sitting on the bottom bunk as if it were a throne. "Well," he says. "This is awkward."',
          danny: 'Your new cellmate is Danny Carne, Nan’s youngest grandson, who has a black eye and a grudge, and has not decided yet whether the grudge is about you.',
        };
        return T[x.m] || 'A new cellmate, who says nothing at all for a week.';
      },
      opts: [
        // Bernard (the second time and after: the first is the gCellmate card in events.js)
        { t: 'Set up the board', show: (L, x) => x.m === 'bernard', run(L) { const m = L.s.heists.lag.mates.bernard; m.bond = Math.min(100, m.bond + 6); L.gain('smarts', 2); return 'You lose eleven games running. The twelfth is a draw. Bernard shakes your hand as if you had won.'; } },
        { t: 'Ask about the pension fund', show: (L, x) => x.m === 'bernard', run(L) { L.gain('smarts', 1); L.gain('charm', 1); return '"There are two columns," he says, "and the art is in the second one." He tells you where the money went. It went into a pension fund.'; } },
        // Tiny
        { t: 'Join in the press-ups', show: (L, x) => x.m === 'tiny', run(L) { const m = L.s.heists.lag.mates.tiny; m.bond = Math.min(100, m.bond + 8); L.gain('fitness', 2); L.respect(4); return 'You manage forty. Tiny counts them for you, kindly, and tells the landing you did a hundred.'; } },
        { t: 'Ask him to keep it down', show: (L, x) => x.m === 'tiny', check: ['charm', 45], run(L, x, win) { const m = L.s.heists.lag.mates.tiny; if (win) { m.bond = Math.min(100, m.bond + 3); return 'He keeps it down. He also tells you about his mum, which takes most of the night.'; } return 'He keeps it down. He does it on the floor above your head instead, at four in the morning.'; } },
        // Kev
        { t: 'Show him the ropes', show: (L, x) => x.m === 'kev', run(L) { const m = L.s.heists.lag.mates.kev; m.bond = Math.min(100, m.bond + 12); L.karma(2); L.behave(3); return 'Which landing to keep off, which guard to say good morning to, and how to make tea in a sock. He writes it all down.'; } },
        { t: 'Let him find his own feet', show: (L, x) => x.m === 'kev', run(L) { return 'Everybody has to. You did. He is crying quietly by the second night, and you pretend to be asleep.'; } },
        { t: 'Sell him some protection', show: (L, x) => x.m === 'kev', run(L) { const m = L.s.heists.lag.mates.kev; m.bond = Math.max(0, m.bond - 10); L.cash(60); L.karma(-3); L.respect(4); return 'Sixty dollars, paid by his mum into your account. The landing respects it. Kev never quite looks at you again.'; } },
        // Moss
        { t: 'Ask him about the wall', show: (L, x) => x.m === 'moss', run(L) { const q = L.s.gaol, m = L.s.heists.lag.mates.moss; m.bond = Math.min(100, m.bond + 5); if (q.dig < 4) q.dig++; return 'He draws you a map in porridge: the laundry chute, the grating, the soft corner by the bins. "Not that I would know."'; } },
        { t: 'Ask him about the old days', show: (L, x) => x.m === 'moss', run(L) { const m = L.s.heists.lag.mates.moss; m.bond = Math.min(100, m.bond + 8); L.gain('smarts', 1); L.joy(3); return 'The great mail robbery that never was, a jewel thief who fainted at the sight of blood, and a governor who kept a pet goose. Every word of it true, he says.'; } },
        // Sal
        { t: 'Make him a cup of tea', show: (L, x) => x.m === 'sal', run(L) { L.salTrust(10); L.respect(6); return 'Sal drinks it slowly. "You know," he says, "you are the only one who ever made it the way I like it." It is the closest he has ever come to a thank you.'; } },
        { t: 'Tell him the Bay is doing fine without him', show: (L, x) => x.m === 'sal', run(L) { L.salTrust(-10); L.respect(8); return 'Sal says nothing for a week. Then he says, "We will see," and turns to face the wall.'; } },
        // Danny Carne
        { t: 'Offer him a truce, in here at least', show: (L, x) => x.m === 'danny', check: ['charm', 50], run(L, x, win) { const r = L.s.heists.rival; if (win) { r.peace++; return 'You shake on it. In here, at least, you are just two men sharing a bucket. He writes to his nan about you.'; } return 'He thinks about it, and spits on the floor, and thinks about it some more.'; } },
        { t: 'Make sure he knows his place', show: (L, x) => x.m === 'danny', check: ['fitness', 50], run(L, x, win) { const r = L.s.heists.rival; r.heat += 10; L.behave(-8); if (win) { L.respect(12); return 'He knows it now. So does the whole of B wing.'; } L.rough(10, 'a fight in Starling Gaol'); return 'He fights like his nan talks: quietly, and much harder than you expected.'; } },
        { t: 'Ask him about Nan', show: (L, x) => x.m === 'danny', run(L) { const r = L.s.heists.rival; r.turf = Math.min(100, r.turf + 5); return 'Nan, it turns out, is afraid of exactly one thing: the taxman. He tells you which bingo hall keeps the real books. He did not mean to.'; } },
        // Anyone else
        { t: 'Say hello', show: (L, x) => !['bernard', 'tiny', 'kev', 'moss', 'sal', 'danny'].includes(x.m), run() { return 'He nods.'; } },
      ],
    },
    {
      id: 'lagFoe', icon: '🧼', title: 'An old acquaintance', gaol: true, ok: (L, x) => (L.s.heists.lag.foes[x.k] || 0) > L.s.t,
      text: 'Big Col Mabbott is still on B wing, and he has not forgotten you. He is standing by the showers with a bar of soap in a sock, swinging it gently, like a man waiting for a bus.',
      opts: [
        { t: 'Keep out of his way', run(L) { L.behave(4); L.respect(-6); return 'You shower at odd hours and eat with your back to the wall. It works, mostly.'; } },
        { t: 'Settle it, in the showers', check: ['fitness', 55], run(L, x, win) { const lag = L.s.heists.lag; L.behave(-12); if (win) { delete lag.foes[x.k]; L.respect(14); return 'It is short, and it is final. Big Col asks for a transfer to Dartmoor.'; } L.rough(15, 'a beating in Starling Gaol'); return 'The sock is heavier than it looks. You wake up in the infirmary with the shape of a bar of soap on your forehead.'; } },
        { t: 'Ask Tiny to have a word', show: (L) => L.s.gaol && L.s.gaol.mate === 'tiny' && (L.s.heists.lag.mates.tiny || {}).bond >= 40, run(L, x) { delete L.s.heists.lag.foes[x.k]; return 'Tiny has a word. Nobody hears what it is. Big Col eats his dinner in his cell from then on.'; } },
      ],
    },
    {
      id: 'lagGate', icon: '🚪', title: 'The gate', log: false, ok: (L) => !L.s.gaol && !!L.s.heists.lag.gate,
      text(L, x) {
        const s = L.s, H = s.heists, g = H.lag.gate, n = H.lag.n, q = g.pid ? L.person(g.pid) : null;
        const open = n <= 1 ? 'They give you back your watch, your shoelaces and $46. The small door in the big gate opens.'
          : n === 2 ? 'Mr Hobbs hands back your watch and your shoelaces and counts out $46, slowly. "Mind how you go," he says. The small door in the big gate opens.'
            : n <= 4 ? 'Your watch, your shoelaces, $46. Mr Hobbs does not say "see you soon" any more. He used to think it was a joke. The small door opens.'
              : 'Your property bag is waiting on the desk before you reach it: they keep it on a shelf of its own now. The small door opens, and you know exactly how many steps it is to the road.';
        let who = '';
        if (g.who === 'love' && q) who = `${q.name} is leaning on the bonnet of a borrowed car, trying not to cry.`;
        else if (g.who === 'kin' && q) who = `${q.name} is waiting across the road, with a flask and your old coat.`;
        else if (g.who === 'mate' && q) who = `${q.name}, who shared your cell once, is on the wall opposite in a suit somebody lent him, with two tickets for the pictures.`;
        else if (g.who === 'pal' && q) who = `${q.name} is there, pretending to have been passing.`;
        else who = ['Nobody is waiting. The bus is in forty minutes.', 'Nobody is waiting. It is raining, of course.', 'Nobody is waiting, except a gull on the gatepost, which looks at you as if you owe it money.'][(s.t + n) % 3];
        const also = g.also === 'sal' ? ' A long black car is waiting at the kerb with its engine running. The back window comes down an inch. "Sal sends his regards."'
          : g.also === 'nan' ? ' A pink Rover is parked across the road with its window down, and a voice you know calls, very softly, "Over here, love."'
            : g.also === 'det' ? ` ${L.lawWho(true)} is leaning on a lamppost a little way off. ${L.lawShe() === 'she' ? 'She' : 'He'} does not say anything. ${L.lawShe() === 'she' ? 'She' : 'He'} does not need to.` : '';
        return `${open} ${who}${also}${x && x.early ? ' You are out on licence: keep your nose clean for two years.' : ''}`;
      },
      opts: [
        { t: 'Breathe', run(L) { const g = L.s.heists.lag.gate, q = g.pid ? L.person(g.pid) : null; L.s.heists.lag.gate = null; L.joy(g.who === 'love' ? 14 : g.who === 'none' ? 6 : 9); if (q) L.bond(q, 6); return ''; } },
        { t: '⛪ Walk up the hill to St Brigid’s first', show: trait('churchgoer'), run(L) { const g = L.s.heists.lag.gate, q = g.pid ? L.person(g.pid) : null; L.s.heists.lag.gate = null; L.joy(10); L.karma(2); if (q) L.bond(q, 4); return 'You sit in the back pew for an hour in your prison shoes. The Reverend Hollis brings you a cup of tea and does not ask a single question.'; } },
        { t: 'Get in Sal’s car', show: (L) => (L.s.heists.lag.gate || {}).also === 'sal', run(L) {
          const s = L.s, H = s.heists, g = H.lag.gate, k = H.lag.kept;
          H.lag.gate = null; H.lag.kept = null; L.joy(8); L.salTrust(4);
          // Time served for Sal is paid for, a little; and the old job is still there.
          const pay = Math.min(12000, 800 * (g.served || 1));
          if (k && !s.job) { s.job = { c: 'crew', r: k.r, n: k.n, perf: k.perf, raise: 0 }; s.worked.crew = Math.max(s.worked.crew ?? 0, k.r); s.retired = false; }
          L.cash(pay);
          return `Sal is in the back, with a flask of coffee and an envelope: ${money(pay)}, "for your trouble". ${k ? `"Your job is waiting," he says. "Nobody has touched your chair." You are ${CAREERS.crew.rungs[k.r].title.toLowerCase()} again, as if you had never been away.` : '"There is always work," he says, "for people who keep their mouths shut."'}`;
        } },
        { t: 'Walk past the car', show: (L) => (L.s.heists.lag.gate || {}).also === 'sal', run(L) { L.s.heists.lag.gate = null; L.s.heists.lag.kept = null; L.salTrust(-8); L.joy(6); return 'You walk past it and on down the hill. In the mirror, Sal’s driver watches you all the way to the bus stop.'; } },
        { t: 'Get in the pink Rover', show: (L) => (L.s.heists.lag.gate || {}).also === 'nan', run(L) { const r = L.s.heists.rival; L.s.heists.lag.gate = null; r.side = 'nan'; L.salTrust(-15); L.cash(2000); return 'Nan Carne pours you a cup of tea from a flask and gives you two thousand dollars in a birthday card. "Sal forgot you," she says. "I never forget anybody."'; } },
        { t: 'Nod to the detective', show: (L) => (L.s.heists.lag.gate || {}).also === 'det', run(L) { L.s.heists.lag.gate = null; L.s.heists.det.bond = Math.min(100, L.s.heists.det.bond + 3); L.joy(6); return `${L.lawWho()} nods back, and walks off towards the town. The game is on again, it seems.`; } },
      ],
    },
    {
      id: 'salHome', icon: '🦊', title: 'Sal comes home', ok: out,
      text: (L) => (L.s.heists.rival.grass === 'you' ? 'Sal is back behind the ice house, thinner, older, with a cardigan he did not have before. He knows who put him away. Everybody knows. He looks at you for a long time across the back room.' : 'Sal is back behind the ice house, thinner, older, with a cardigan he did not have before. The lads have hung bunting. Sal pretends not to see it, and keeps the bunting.'),
      opts: [
        { t: 'Welcome him home', show: (L) => L.s.heists.rival.grass !== 'you', run(L) { L.salTrust(12); L.joy(3); return '"Good to be back," says Sal, and pours two glasses of something he has been saving. "Now. What have I missed?"'; } },
        { t: 'Say you are sorry', show: (L) => L.s.heists.rival.grass === 'you', check: ['charm', 70], run(L, x, win) { if (win) { L.salTrust(-10); return '"Sorry," says Sal, as if he were tasting the word. "Well. It is a start." You are not forgiven. You are, for now, not anything worse.'; } L.s.heists.sal = 0; L.s.f.salOff = L.s.t + 40; return '"Get out," says Sal, quite quietly. You will not be welcome behind the ice house for a long, long time.'; } },
        { t: 'Stay away from the harbour', run(L) { if (L.s.heists.rival.grass === 'you') { L.s.heists.sal = 0; L.s.f.salOff = L.s.t + 40; } return 'You find other places to be. The harbour can manage without you.'; } },
      ],
    },
  ]);

  // ---- Nan Carne's lot ----
  const rv = (L) => L.s.heists.rival;
  const end = (L, how) => {
    const s = L.s, H = s.heists, r = H.rival;
    r.end = how; r.stage = 4;
    if (how === 'sal') { r.back = s.t + L.int(16, 24); L.note('Sal went down for a long stretch, and Nan Carne took the pier.', 'big'); }
    if (how === 'gone') { L.salTrust(15); L.note('Nan Carne’s lot were run out of the Bay.', 'big'); }
    if (how === 'truce') { L.salTrust(8); L.note('Brokered a truce between Sal and Nan Carne.', 'big'); }
    if (how === 'yours') { r.patch = true; L.note('Took over the pier from Nan Carne. It is yours now.', 'big'); }
  };
  addEvents([
    {
      id: 'carneArrive', icon: '🏴', title: 'New faces on the pier', ok: out,
      text: 'Two lads in matching tracksuits are selling mermaid dust off the end of the pier in broad daylight, on Sal’s patch. Sal has noticed. Sal has gone quiet, which is worse than shouting. "Find out who they are," he says.',
      opts: [
        { t: 'Ask around the Gull & Anchor', check: ['charm', 45], run(L, x, win) { if (win) { rv(L).turf = Math.min(100, rv(L).turf + 3); L.salTrust(3); return 'Their gran sent them. Nan Carne, who runs Kettleby from a bungalow and a bingo hall, and has decided she would like a sea view.'; } return 'Nobody will say. Everybody looks into their drink. That tells you something too: they are frightened of somebody.'; } },
        { t: 'Ask the lads themselves', check: ['fitness', 50], run(L, x, win) { const r = rv(L); r.heat += 10; L.crime(0.1, 1, 'a fight on the end of the pier'); if (win) { r.turf = Math.min(100, r.turf + 8); L.salTrust(5); return 'One of them goes in the sea. The other tells you everything, including his nan’s name: Carne. Nan Carne, of Kettleby.'; } L.rough(12, 'a fight on the pier'); r.turf -= 5; return 'There are three of them, it turns out, not two. You learn the name Carne the hard way.'; } },
        { t: 'Tell Sal it is none of your business', run(L) { L.salTrust(-8); return '"Everything on my patch is your business," says Sal, "if you want to stay on it."'; } },
      ],
    },
    {
      id: 'carneNan', icon: '👵', title: 'Tea with Nan', ok: out,
      text: 'A pink Rover pulls up beside you on the front and the back window comes down. Nan Carne: seventy-four, a perm like a crash helmet, and the softest voice you ever heard. She pours you tea from a flask. "Sal is getting old, love," she says. "I am older, and I am not tired. There is room in Kettleby for somebody bright."',
      opts: [
        { t: 'Turn her down, politely', run(L) { const r = rv(L); r.side = 'sal'; r.heat += 5; L.salTrust(6); return '"Pity," says Nan, and the window goes up. You have the feeling that you have been written down somewhere.'; } },
        { t: 'Take the envelope, and tell Sal everything', odds: () => 0.6, run(L, x, win) { const r = rv(L); r.side = 'sal'; L.cash(3000); if (win) { L.salTrust(10); r.turf = Math.min(100, r.turf + 5); return 'Three thousand dollars from Nan, and Sal’s gratitude for the story. Being in two places at once pays well, while it lasts.'; } r.heat += 25; L.salTrust(5); return 'You tell Sal. Somebody in Sal’s back room tells Nan you told Sal. Everybody is cross with you now.'; } },
        { t: 'Take the envelope, and say nothing to Sal', run(L) { const r = rv(L); r.side = 'nan'; L.cash(3000); L.salTrust(-10); L.karma(-2); return '"Good," says Nan. "I like a quiet one." You are on her payroll now. Sal does not know. Yet.'; } },
      ],
    },
    {
      id: 'carneFire', icon: '🔥', title: 'The ice house', ok: out,
      text: 'Somebody has put a petrol bomb through the window of Sal’s ice house in the night. Nobody was hurt, apart from forty boxes of frozen scampi. Sal is standing in the wreckage in his slippers, and wants somebody to pay.',
      opts: [
        { t: 'Pay Kettleby a visit', show: (L) => rv(L).side !== 'nan', run(L) { const r = rv(L); r.heat += 20; r.turf = Math.min(100, r.turf + 15); L.salTrust(8); L.karma(-4); if (L.crime(0.2, 2, 'a can of petrol outside a bingo hall')) return 'The bingo hall’s caretaker was not asleep after all.'; return 'The Kettleby bingo hall has new windows now. The old ones are in the car park.'; } },
        { t: 'Talk Sal out of it', show: (L) => rv(L).side !== 'nan', check: ['charm', 55], run(L, x, win) { const r = rv(L); if (win) { r.peace++; r.heat = Math.max(0, r.heat - 10); return '"A war is bad for business," you tell him, and he listens, which surprises you both.'; } L.salTrust(-5); r.heat += 10; return 'He hears you out, and then does it anyway, without you.'; } },
        { t: (L) => `Tell ${L.lawWho()} who did it`, show: (L) => rv(L).side !== 'nan' && L.s.heists.det.met != null, run(L) { const r = rv(L); r.turf = Math.min(100, r.turf + 10); r.grass = L.s.t; L.lawFile(-8); L.s.heists.det.bond = Math.min(100, L.s.heists.det.bond + 5); return `${L.lawWho()} raids the Kettleby bingo hall and finds a great deal of petrol. Nobody knows who told. Not yet.`; } },
        { t: 'Tell Nan where Sal keeps his money', show: (L) => rv(L).side === 'nan', run(L) { const r = rv(L); r.turf = Math.max(0, r.turf - 20); L.cash(5000); L.karma(-6); L.salTrust(-10); return 'Five thousand dollars, in a birthday card again. Sal’s safe is empty by the weekend, and he does not yet know why.'; } },
        { t: 'Warn Sal, and change sides', show: (L) => rv(L).side === 'nan', run(L) { const r = rv(L); r.side = 'sal'; r.heat += 20; L.salTrust(5); return 'You tell Sal everything. He listens with his eyes shut. "Better late," he says, at last.'; } },
      ],
    },
    {
      id: 'carneHit', icon: '🎨', title: 'Nan says hello', ok: out,
      text: (L) => (L.s.items.car || L.s.items.sportscar ? 'You come out in the morning to find your car painted, all over, the exact pink of Nan Carne’s Rover. On the windscreen, under the wiper: NAN SAYS HELLO.' : 'You come home to find your front door painted the exact pink of Nan Carne’s Rover, and a note through the letterbox: NAN SAYS HELLO.'),
      opts: [
        { t: 'Clean it up and say nothing', run(L) { L.cash(-300); L.joy(-3); return 'Three hundred dollars and two days with a scraper. The pink is still in the cracks.'; } },
        { t: '🌶️ Drive to Kettleby, tonight', show: trait('hothead'), run(L) { const r = rv(L); r.heat += 20; r.turf = Math.min(100, r.turf + 10); L.karma(-3); if (L.crime(0.25, 2, 'a cricket bat and the Carnes’ minicab office')) return 'You make your point very clearly. So does the constable who was parked across the road.'; return 'You say what you came to say, at length, with a cricket bat. Nan’s grandsons will think twice. So will you, in the morning.'; } },
        { t: 'Send something back', check: ['fitness', 50], run(L, x, win) { const r = rv(L); r.heat += 10; L.crime(0.15, 2, 'a pot of paint and the Carnes’ minicab office'); if (win) { r.turf = Math.min(100, r.turf + 6); return 'The Kettleby minicab office is a very cheerful pink now too.'; } L.rough(12, 'the Carne boys'); return 'Two of the Carne boys are sitting in the minicab office in the dark, waiting for exactly that.'; } },
        { t: (L) => `Ask ${L.lawWho()} for help`, show: (L) => L.s.heists.det.met != null, run(L) { L.s.heists.det.bond = Math.min(100, L.s.heists.det.bond + 3); L.lawFile(4); return `${L.lawWho()} looks at the paint for a long time. "Interesting friends you have," ${L.lawShe()} says. "Both sets."`; } },
      ],
    },
    {
      id: 'carneStash', icon: '🪜', title: 'The loft hatch', ok: (L) => out(L) && L.s.heists.hot > 0,
      text: (L) => `You come home to find the loft hatch open and the ladder down. ${L.s.heists.hot >= 100000 ? 'Most of the money' : 'The money'} you had hidden up there is gone, and on the top rung somebody has left a bingo dabber. Nan’s lads have been.`,
      opts: [
        { t: 'Go and get it back', check: ['fitness', 55], run(L, x, win) { const H = L.s.heists, r = rv(L), n = Math.round(H.hot * 0.6); r.heat += 15; L.karma(-2); if (win) { r.turf = Math.min(100, r.turf + 8); return 'You find it in the boot of a minicab behind the bingo hall, still in your carrier bags, and take the minicab’s float as well, for your trouble.'; } H.hot -= n; L.rough(15, 'the Carne boys'); return `The minicab office is full of Carnes. You come home with a black eye and without ${money(n)}.`; } },
        { t: 'Let it go: you can hardly tell the police', run(L) { const H = L.s.heists, n = Math.round(H.hot * 0.6); H.hot -= n; L.joy(-6); return `${money(n)}, gone, and nobody to complain to. That is the trouble with money like that.`; } },
      ],
    },
    {
      id: 'carneSitdown', icon: '☕', title: 'A sit-down at Betty’s', ok: out,
      text: 'Neutral ground: Betty’s Café, a Sunday afternoon. Sal at one table, Nan Carne at the other, and you between them with the teapot, because both of them asked for you.',
      opts: [
        { t: 'Broker a peace: the pier for Nan, the harbour for Sal', odds: (L) => clamp(L.checkOdds('charm', 60) + rv(L).peace * 0.1 - rv(L).heat / 300, 0.05, 0.9), run(L, x, win) { const r = rv(L); if (win) { end(L, 'truce'); L.joy(6); return 'An hour of very polite argument, two pots of tea and a scone each, and they shake hands across your table. The Bay is split down the middle of the pier. Betty does not charge you.'; } r.stage = 3; r.heat += 15; return 'Nan says "no" very nicely, and Sal knocks the sugar bowl over. It is war, now.'; } },
        { t: 'Let them fight it out', run(L) { const r = rv(L); r.stage = 3; return 'You put the teapot down and leave them to it. Behind you, somebody throws a scone.'; } },
        { t: (L) => `Tip ${L.lawWho()} off: Sal will be carrying tonight`, show: (L) => (rv(L).side === 'nan' || L.s.heists.sal < 30) && L.s.heists.det.met != null, run(L) { const r = rv(L); r.grass = 'you'; end(L, 'sal'); L.cash(10000); L.lawFile(-15); L.karma(-6); L.salTrust(-40); return `${L.lawWho()} stops Sal’s car on the coast road that night with half the county’s police behind ${L.lawHim()}. Sal goes down for a long time. Nan sends you ten thousand dollars and a box of fudge.`; } },
        { t: (L) => `Tip ${L.lawWho()} off: the Carnes will be carrying tonight`, show: (L) => rv(L).side !== 'nan' && L.s.heists.det.met != null && (L.s.n.crimes >= 20 || (L.s.job && L.s.job.c === 'crew' && L.s.job.r >= 2)), run(L) { const r = rv(L); r.grass = L.s.t; end(L, 'gone'); L.lawFile(-15); L.karma(-2); if (L.enemies().length < 3) L.foe({ name: 'Danny Carne', sex: 'm', grudge: 60 }); return `${L.lawWho()} stops the pink Rover on the coast road with a boot full of things that should not be in a boot. Nan Carne retires to her sister’s in Spain. Her youngest grandson knows who to thank.`; } },
      ],
    },
    {
      id: 'carneWar', icon: '💥', title: 'The Bay at war', ok: (L) => out(L) && rv(L).stage === 3 && !rv(L).end,
      text: (L) => `${[
        'Three things in one week: Sal’s van in the harbour, the Carnes’ minicab office on fire, and a man in St Wren’s with a broken jaw who says he walked into a door.',
        'A second winter of it. The Gull & Anchor has taken to closing at nine. Somebody has put sugar in the tank of every car Sal owns, and a brick through every window of the bingo hall.',
        'A third winter. Sal has stopped sleeping at home, and Nan Carne has been seen buying a padlock the size of a dinner plate. Both of them look tired.',
      ][Math.min(2, (rv(L).wars || 1) - 1)]} ${L.lawWho(true)} is on the evening news asking for calm. Every crime in the Bay is riskier while this goes on.`,
      opts: [
        { t: 'Go and see Nan yourself', check: ['charm', 65], run(L, x, win) { if (win) { end(L, 'yours'); L.joy(8); return 'You drink her tea and tell her she cannot win, and she looks at you for a long time and then laughs. "No," she says. "But you might." She hands you a key on a bingo-hall fob: the pier is yours, and she goes home to Kettleby.'; } L.rough(20, 'the Carne boys'); rv(L).heat += 10; return 'Her grandsons walk you back to your car, the long way, round the back of the bingo hall.'; } },
        { t: 'Finish it: go after their money', check: ['fitness', 60], run(L, x, win) { L.karma(-5); if (L.crime(0.25, 3, 'a crowbar and the Carnes’ safe')) return 'The safe is full of money and the room is full of police: Nan saw you coming a mile off.'; if (win) { end(L, 'gone'); L.cash(15000); return 'The bingo hall’s safe, the minicab office’s float and the dust money from the pier. Without money, Nan’s lot are just a family. They go home to Kettleby.'; } rv(L).heat += 15; return 'You get the safe open. It is empty, and there is a note in it: NICE TRY. NAN.'; } },
        { t: 'Keep your head down', run(L) { const how = L.chance(0.55) ? 'gone' : 'sal'; end(L, how); return how === 'gone' ? 'It goes on all winter without you, and then one morning the pink Rover is gone, and so are the Carnes.' : 'It goes on all winter without you, and then one morning Sal is arrested on the coast road with a boot full of trouble, and Nan Carne owns the pier.'; } },
      ],
    },
  ]);

  // ---- the Gazette, and the obituary ---------------------------------------------------------

  const paper = Life.prototype.gazette;
  if (paper) {
    Life.prototype.gazette = function heistsGazette() {
      const g = paper.call(this), s = this.s, H = s.heists, j = H.jobs[H.jobs.length - 1];
      if (j && s.t - j.t <= 1) {
        const T = TARGETS[j.k];
        const item = j.how === 'bust' ? { icon: '⛓️', h: `Gang caught at ${T.name.replace(/^The /, 'the ')}`, t: `Police were waiting. "A long investigation," says ${this.lawWho(true)}, "and a little help."` }
          : { icon: T.icon, h: `Raid on ${T.name.replace(/^The /, 'the ')}`, t: `${j.how === 'clean' ? 'Police are baffled. ' : ''}${this.lawWho(true)} says enquiries are continuing, and that ${this.lawShe()} has "a fair idea". The public are asked not to spend anything unusual.` };
        if (!s.gaol && !s.run) { g.items.unshift(g.lead); g.lead = item; } else g.items.unshift(item);
      }
      const r = H.rival;
      if (r.stage === 3 && !r.end) g.items.splice(1, 0, { icon: '💥', h: 'Fire at Kettleby bingo hall', t: 'A second fire in a month. A woman of seventy-four was helping police with their enquiries, and gave them a toffee each.' });
      return g;
    };
  }
  hooks.epitaph.push((L, list) => {
    const s = L.s, H = s.heists, m = s.sex !== 'f', He = m ? 'He' : 'She', him = m ? 'him' : 'her';
    const got = H.jobs.filter((j) => j.how !== 'bust' && j.k !== 'bank');
    if (got.length) list.push(`The ${got.map((j) => TARGETS[j.k].name.replace(/^The /, '')).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2).join(' and ')} ${got.length > 1 ? 'robberies remain' : 'robbery remains'} unsolved.`);
    const d = H.det;
    if (d.met != null && d.nailed) list.push(`${L.lawWho(true)}, who put ${him} away, sent a wreath.`);
    else if (d.met != null && d.bond >= 60) list.push(`${L.lawWho(true)}, who never quite caught ${him}, came to the funeral, and sat at the back.`);
    if (H.rival.end === 'yours') list.push(`${He} ran the pier for years, and nobody ever proved it.`);
  });

  // ---- trophies ----
  Object.assign(TROPHIES, {
    heistHomework: { name: 'Done your homework', icon: '🗂️', desc: 'Find out everything there is to know about a job before you pull it.', test: (L) => !!L.s.heists && !!L.s.heists.f.homework },
    heistClean: { name: 'Like clockwork', icon: '⏱️', desc: 'Pull off a job without the alarm ever being raised.', test: (L) => !!L.s.heists && L.s.heists.n.clean >= 1 },
    heistFirm: { name: 'The firm', icon: '🤝', desc: 'Pull off a job with three friends on the crew.', test: (L) => !!L.s.heists && !!L.s.heists.f.firm },
    heistWashed: { name: 'Clean as a whistle', icon: '🧼', desc: 'Launder $100,000.', test: (L) => !!L.s.heists && L.s.heists.washed >= 1e5 },
    heistKitto: { name: 'First-name terms', icon: '🕵️', desc: 'Become friends with the detective who wants you put away.', test: (L) => !!L.s.heists && L.s.heists.det.bond >= 60 },
    heistBent: { name: 'In your pocket', icon: '💼', desc: 'Have a detective on the take.', test: (L) => !!L.s.heists && L.s.heists.det.bent != null },
    heistCarne: { name: 'The Bay is quiet', icon: '🏴', desc: 'See the feud with Nan Carne’s lot through to its end.', test: (L) => !!L.s.heists && !!L.s.heists.rival.end },
  });
}
