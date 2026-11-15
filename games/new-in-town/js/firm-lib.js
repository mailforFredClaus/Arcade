// New in Town: the tables for a business of your own (the rules are in
// firm.js, the cards in firm-tales.js, the screen in firm-ui.js). Nothing in
// here does anything: it is the trades, the sorts of people who come asking
// for work, the names a business might go by, and the numbers.

// ---- the numbers ----------------------------------------------------------------------------

// By size (0 a stall or a van, 3 a group): the staff it needs to meet its trade, the most it can
// usefully take on, how much trade a well-thought-of place sees (in its own spells of work), and
// what the premises cost to keep each season (rent, rates, power, insurance).
export const NEED = [0, 2, 4, 6];
export const MAX = [1, 4, 7, 10];
export const DEMAND = [2.2, 4.4, 9, 14];
export const OVER = [150, 1000, 8000, 30000];
// What one of the staff can serve in a season, in the owner's spells of work, and what they are
// paid for it (both scaled by the size's own takings in data.js, BUSINESSES).
export const SERVE = 2;
export const WAGE = 0.85;
// The manager is paid this much over what they had.
export const MGR_PAY = 1.3;
// Prices: what each sale fetches, and how many come for it. (Dear depends on the name and the
// quality: see firmDear in firm.js.)
export const PRICES = ['Cheap', 'Fair', 'Dear'];
export const PRICE_GET = [0.85, 1, 1.2];
export const PRICE_COME = [1.2, 1];
// Quality: what the stock costs, as a share of what is sold.
export const QUALS = ['Cut corners', 'Standard', 'The best'];
export const STOCK = [0.24, 0.3, 0.4];
// Hours: how many come, and what the premises cost.
export const HOURS = ['Short', 'Regular', 'Long'];
export const HOURS_COME = [0.85, 1, 1.15];
export const HOURS_OVER = [0.92, 1, 1.12];
// A business loan: interest a season, and the share of it paid back each season.
export const LOAN_RATE = 0.025;
export const LOAN_PAY = 0.035;
// The Town Hall's enterprise loan, for somebody who cannot find the money to start: the deposit,
// and its (kinder) rate.
export const SEED_DOWN = 500;
export const SEED_RATE = 0.01;
// After a business has gone under, the bank will not back another for this many seasons.
export const BUST_WAIT = 8;
// A second premises costs this share of the next size up (or of the biggest).
export const BRANCH_COST = 0.4;

// ---- the trades -------------------------------------------------------------------------------

// season: how busy each season is (spring, summer, autumn, winter). wx: the weather's say. eco: how
// much the times matter. busy, quiet: said of the trade's best and worst seasons. game: what working
// in it is like (a game in mini.js), with a title for each size and what is said of how it went,
// worst first. ideas: what the staff might suggest. trouble: when something goes wrong for a
// customer. kit: what putting money back in buys. who: the customers. branch: where a second
// premises could go. inspector: who comes to look.
export const TRADES = {
  food: {
    season: [1, 1.3, 0.95, 0.85], wx: { hot: 1.15, wet: 0.9, storm: 0.85, snow: 0.85, fog: 0.95 }, eco: 0.06,
    busy: 'Summer on the front: queues to the sea wall', quiet: 'Winter: the front is shuttered and the locals want soup',
    game: { id: 'pans', titles: ['Work the stall yourself', 'Run the kitchen yourself', 'Run the pass yourself', 'Run the pass yourself'], skill: 'craft',
      said: ['Three burnt, two raw, and a regular who says nothing, which is worse.', 'Everything goes out, and most of it hot.', 'A clean service. Plates come back empty.', 'Not a pan out of place. Somebody asks to see the chef, to say thank you.'] },
    ideas: [
      { id: 'roast', t: 'Sunday roasts', said: 'Sunday roasts, with proper gravy' },
      { id: 'cream', t: 'cream teas on the sea wall', said: 'cream teas served out on the sea wall' },
      { id: 'fishfri', t: 'a fish supper on Fridays', said: 'a fish supper on Fridays, straight off the boats' },
      { id: 'cater', t: 'catering for weddings', said: 'doing the food for weddings and wakes' },
      { id: 'vegan', t: 'a menu with no meat on it', said: 'a menu with no meat on it, for the young ones' },
    ],
    trouble: ['A man from Kettleby says your prawns put him in bed for a week.', 'A whole table is ill after a christening lunch, and the christening party is not quiet about it.', 'A child finds something in a pie that should not be in a pie.'],
    kit: 'new ovens and a walk-in fridge', who: 'customers', branch: ['cove', 'station'], inspector: 'the food inspector',
  },
  shop: {
    season: [0.95, 1.05, 0.9, 1.35], wx: { wet: 0.95, snow: 0.85, storm: 0.9 }, eco: 0.07,
    busy: 'Christmas: everybody wants everything by Thursday', quiet: 'Autumn: people are saving up for Christmas',
    game: { id: 'till', titles: ['Mind the stall yourself', 'Take the till yourself', 'Take a till yourself', 'Take a till yourself'], skill: 'charm',
      said: ['The till is forty dollars out, and nobody can say which way.', 'The till balances, near enough.', 'Right to the penny, with a queue out of the door.', 'Right to the penny all day, and every customer leaves smiling.'] },
    ideas: [
      { id: 'deliver', t: 'deliveries to the hill', said: 'a van doing deliveries up the hill' },
      { id: 'late', t: 'late opening on Thursdays', said: 'staying open late on Thursdays' },
      { id: 'local', t: 'a shelf of things made in the Bay', said: 'a shelf of things made in the Bay' },
      { id: 'loyal', t: 'a loyalty card', said: 'a loyalty card, the tenth one free' },
      { id: 'window', t: 'proper window displays', said: 'proper window displays that change with the seasons' },
    ],
    trouble: ['A kettle bought from you catches fire in a kitchen on Fore Street.', 'A whole box of Christmas lights turns out to be the wrong sort, and they have all been sold.', 'A pram from your shop loses a wheel on the hill, with a baby in it. The baby is fine. The mother is not.'],
    kit: 'new shelving, a proper till and a back room', who: 'customers', branch: ['market', 'station'], inspector: 'trading standards',
  },
  build: {
    season: [1.15, 1.2, 0.95, 0.75], wx: { wet: 0.9, storm: 0.85, snow: 0.7, hot: 1.05 }, eco: 0.09,
    busy: 'Spring and summer: everybody wants their roof done before the winter', quiet: 'Winter: frost on the mortar, and nobody wants builders in at Christmas',
    game: { id: 'pipes', titles: ['Do the plumbing yourself', 'Do the plumbing yourself', 'Get your hands dirty on site', 'Walk the site yourself'], skill: 'fitness',
      said: ['It leaks. It is not supposed to leak.', 'It holds water, which is the main thing.', 'Neat, tight, and done by teatime.', 'Not a drip. The client brings out the good biscuits.'] },
    ideas: [
      { id: 'loft', t: 'loft conversions', said: 'loft conversions, now that everybody wants an extra room' },
      { id: 'roofs', t: 'emergency roof repairs', said: 'a number to ring for emergency roof repairs after a gale' },
      { id: 'green', t: 'solar panels and insulation', said: 'solar panels and insulation for the old houses' },
      { id: 'kitchens', t: 'fitted kitchens', said: 'fitted kitchens, start to finish' },
      { id: 'listed', t: 'work on the old listed buildings', said: 'going after the work on the old listed buildings up the hill' },
    ],
    trouble: ['A garden wall you built on Chapel Street falls into the road one wet night.', 'A ceiling you plastered comes down in somebody’s front room during the Christmas dinner.', 'A new extension lets in water at every corner, and the owners are lawyers.'],
    kit: 'a new van, a mixer and proper scaffolding', who: 'clients', branch: ['farm', 'market'], inspector: 'the building inspector',
  },
  soft: {
    season: [1, 0.95, 1.05, 1], wx: {}, eco: 0.09,
    busy: 'Autumn: budgets to spend before the year end', quiet: 'Summer: half the clients are on holiday',
    game: { id: 'sweep', titles: ['Hunt the bugs yourself', 'Hunt the bugs yourself', 'Hunt the bugs yourself', 'Hunt the bugs yourself'], skill: 'smarts',
      said: ['You fix one bug and let out four.', 'It runs. Nobody asks how.', 'Clean, and out on the day it was promised.', 'Not one bug left alive. The client sends a cake.'] },
    ideas: [
      { id: 'tides', t: 'an app for the tide tables', said: 'an app for the tide tables, for every fisherman and dog walker in the Bay' },
      { id: 'tills', t: 'till software for the High Street', said: 'till software for the shops on the High Street' },
      { id: 'game', t: 'a little game about gulls', said: 'a little game about gulls stealing chips' },
      { id: 'support', t: 'looking after the town’s computers', said: 'a contract to look after the Town Hall’s computers' },
      { id: 'booking', t: 'a booking system for the guesthouses', said: 'one booking system for every guesthouse on the front' },
    ],
    trouble: ['An update you sent out wipes a client’s accounts for March.', 'The booking system you built double-books every room on the front for the Regatta.', 'A client’s website goes down on the morning of their big sale, and stays down.'],
    kit: 'faster machines and a server room that is not a cupboard', who: 'clients', branch: ['library', 'college'], inspector: 'the data inspector',
  },
  fleet: {
    season: [0.95, 1.3, 1, 0.75], wx: { storm: 0.7, fog: 0.88, snow: 0.85, hot: 1.05 }, eco: 0.05,
    busy: 'Summer: the mackerel are in and the sea is kind', quiet: 'Winter: gales, and the boats tied up for days',
    game: { id: 'channel', titles: ['Take the wheel yourself', 'Take the wheel yourself', 'Take a boat out yourself', 'Take a boat out yourself'], skill: 'fitness',
      said: ['You find a rock that is not on the chart. It is now.', 'In, with some new paint needed.', 'In clean, with a full hold.', 'Not a mark on her, and the best catch on the quay.'] },
    ideas: [
      { id: 'trips', t: 'fishing trips for visitors', said: 'taking visitors out fishing in the summer' },
      { id: 'smoke', t: 'a smokehouse on the quay', said: 'a smokehouse on the quay, for kippers' },
      { id: 'direct', t: 'selling straight to the restaurants', said: 'selling straight to the restaurants, and not through the market' },
      { id: 'crab', t: 'crab and lobster pots', said: 'putting down pots for crab and lobster off Gorse Head' },
      { id: 'seals', t: 'boat trips to see the seals', said: 'boat trips round the point to see the seals' },
    ],
    trouble: ['A box of your fish turns out to have been a day older than the label said, and a hotel in Kettleby says so in writing.', 'One of your boats fouls a yacht’s mooring in the Regatta, in front of the whole town.', 'A restaurant sends back a whole delivery: the ice ran out on the way.'],
    kit: 'new nets, radar and a better engine', who: 'buyers', branch: ['cove', 'market'], inspector: 'the fisheries officer',
  },
  design: {
    season: [0.9, 1.05, 0.95, 1.3], wx: { hot: 1.05, wet: 0.95 }, eco: 0.08,
    busy: 'Christmas: presents, cards and calendars', quiet: 'Spring: nobody buys a print in the rain',
    game: { id: 'stall', titles: ['Sell your work yourself', 'Mind the shop yourself', 'Meet the buyers yourself', 'Meet the buyers yourself'], skill: 'charm',
      said: ['You let a print go for the price of the frame.', 'A fair day: enough sold to pay for the ink.', 'Sold well, and to people who will be back.', 'Sold out by teatime, and a list of people wanting more.'] },
    ideas: [
      { id: 'wed', t: 'wedding invitations', said: 'wedding invitations, printed by hand' },
      { id: 'map', t: 'a map of the Bay as a print', said: 'a hand-drawn map of the Bay, as a print' },
      { id: 'classes', t: 'evening classes', said: 'evening classes in the studio, wine included' },
      { id: 'tea', t: 'tea towels with gulls on', said: 'tea towels with gulls on, for the visitors' },
      { id: 'commission', t: 'portraits of people’s houses', said: 'painting people’s houses, to order' },
    ],
    trouble: ['A batch of scarves runs in the wash, and the colour goes everywhere, including on a wedding dress.', 'A print you sold as one of a kind turns up in a shop in Kettleby, as one of fifty.', 'The council’s new sign, which you designed, has a spelling mistake in it twelve feet wide.'],
    kit: 'a printing press and a kiln of your own', who: 'customers', branch: ['theatre', 'market'], inspector: 'trading standards',
  },
};

// What a stall at the market sells, for the game (as in market.js: { g, icon, name, one, q, each: [cheap, fair, dear] }).
export const DESIGN_GOODS = [
  { g: 'print', icon: '🖼️', name: 'Prints', one: 'print of the harbour', q: 0.7, each: [24, 32, 45] },
  { g: 'scarf', icon: '🧣', name: 'Scarves', one: 'hand-dyed scarf', q: 0.6, each: [18, 26, 38] },
  { g: 'mug', icon: '☕', name: 'Mugs', one: 'mug with a gull on', q: 0.5, each: [8, 12, 17] },
  { g: 'card', icon: '💌', name: 'Cards', one: 'card', q: 0.5, each: [3, 4, 6] },
];

// ---- who comes asking for work ------------------------------------------------------------------

// out: how much they get through; pay: what they ask, against the going rate; mor: where their
// spirits settle, give or take. hints: what you notice at the interview (the sort of person they are
// is not on the form, unless it is your cousin). word: what you call them once you know.
export const NATURES = {
  steady: { out: 1, pay: 1, mor: 0, word: 'Steady', hints: ['Nothing special, and says so.', 'Neat, polite, and has brought a pen.', 'Asks sensible questions about the hours.'] },
  grafter: { out: 1.25, pay: 1.05, mor: 3, word: 'A grafter', hints: ['Was at the cannery eleven years, and never missed a day.', 'Asks what time you open, and whether they could come in earlier.', 'Has hands like shovels, and a firm handshake to go with them.'] },
  fingers: { out: 1.05, pay: 0.95, mor: 0, word: 'Light-fingered', hints: ['References glowing, if a little vague about dates.', 'Very interested in where the safe is, for safety reasons.', 'Has done a bit of everything, and left every job in a hurry, for good reasons.'] },
  charmer: { out: 1.1, pay: 1.05, mor: 4, word: 'Lovely with customers', hints: ['Has you laughing inside a minute.', 'Remembers your name, and your mother’s, and asks after her.', 'The dog outside wags at them on the way in.'] },
  late: { out: 0.82, pay: 0.85, mor: 2, word: 'Always late', hints: ['Turns up twenty minutes late to the interview, with a very good story.', 'Says they are a night person, as if that settled it.', 'Phones to say they are on their way, from bed.'] },
  prickly: { out: 1.45, pay: 1.25, mor: -6, word: 'Brilliant, but prickly', hints: ['Tells you three things wrong with the place before sitting down. Two of them are right.', 'Was the best at the last place, and the last place was glad to see the back of them.', 'Corrects your spelling on the advert.'] },
  cousin: { out: 0.8, pay: 0.75, mor: 6, word: 'Your cousin', hints: ['Your aunt has rung twice about it.', 'Was always round at yours as a child, and still has a key.', 'Has had a difficult year, says your aunt, and would be ever so grateful.'] },
  kin: { out: 1.05, pay: 0.9, mor: 6, word: 'Family', hints: ['Your own flesh and blood.', 'Your own flesh and blood.', 'Your own flesh and blood.'] },
};

// Who buys up a business that is going places: a chain from the city.
export const CHAINS = ['Meridian Group', 'Northgate plc', 'Crestwell Holdings', 'Albany & Lyle', 'Harrowgate Group', 'Brightline Holdings', 'Westmarch plc', 'Corvane Group'];
// The board, at the biggest size: three directors.
export const DIRECTORS = ['Mr Ashdown', 'Mrs Okonedo', 'Sir Rupert Vail', 'Ms Carrow', 'Mr Faulkes', 'Mrs Delacourt', 'Dr Imrie', 'Mr Petheridge'];
// A rival's way of going about things.
export const RIVAL_KINDS = {
  cheap: { word: 'cuts every price', pull: 1.2 },
  flash: { word: 'all balloons and big talk', pull: 1.0 },
  sly: { word: 'friendly to your face', pull: 0.8 },
  proper: { word: 'good, annoyingly', pull: 1.1 },
};

// ---- names over the door -----------------------------------------------------------------------

// {F}: your first name; {S}: your surname. Never the same name twice in a family (firm.js keeps
// count), so there are plenty.
export const NAMES = {
  food: ['The Salt Cellar', 'The Hungry Gull', 'Crumb & Kettle', 'The Brown Teapot', 'Tide Table', 'Pebble & Pan', 'The Galley', 'Driftwood Kitchen', 'The Copper Pot', 'Saltwater', 'The Lobster Pot',
    'Spoon & Anchor', 'The Breakwater', 'Harbour Lights', 'The Little Kitchen', 'The Toasted Crab', 'The Rolling Pin', 'Mackerel Sky', 'The Fat Gull', 'Low Tide', 'The Gravy Boat', 'Sea Biscuit', 'The Kipper House', 'Butter & Brine',
    '{F}’s Kitchen', '{S}’s', '{F}’s on the Front'],
  shop: ['Bits & Bobs', 'The Bay Emporium', 'Odds & Ends', 'The Corner Cupboard', 'Gull Street Stores', 'The Treasure Chest', 'Shipshape Stores', 'Sixpence', 'Tidewater Trading', 'The Ha’penny', 'Anchor Stores',
    'The Lighthouse Shop', 'Pick & Mix', 'The Hold', 'Every Little Thing', 'The Bay Bazaar', 'Fair Exchange', 'The Weather Eye', 'Clove & Twine', 'The Brass Bell', 'Ropes & Ribbons', 'The Glass Float',
    '{S}’s Stores', '{S} & Co.', '{F}’s'],
  build: ['Bay Builders', 'Square & Level', 'Plumb Line', 'Solid Ground', 'Gorse Building', 'Keystone', 'Harbour Wall Builders', 'True North Joinery', 'Cornerstone', 'Sound as a Pound', 'Weatherboard',
    'Stone & Timber', 'Spirit Level', 'Lintel & Sill', 'Bayside Builds', 'Good Footing', 'Bricks & Mortar', 'Dry Stone', 'The Roofers', 'Slate & Lead',
    '{S} Building', '{S} & Sons', '{S} & Daughters', '{F} {S} Builders'],
  soft: ['Tidal Code', 'Byte & Brine', 'Little Gull Apps', 'Sea Change Digital', 'Breakwater Software', 'Pebble Logic', 'Fogbank', 'Starboard Code', 'Driftnet Digital', 'Rockpool', 'Kelp', 'Halyard',
    'Undertow', 'Spindrift', 'Saltbox', 'Bright Buoy', 'Bilge Pump Software', 'Cormorant', 'Seventh Wave', 'Lugsail Labs',
    '{S} Digital', '{S} Software'],
  fleet: ['Bay Fish', 'Good Catch', 'Harbour Fresh', 'The Silver Darlings', 'Tidewater Fish', 'Deep Blue Fisheries', 'North Star Fishing', 'Pilchard & Co', 'The Herring Run', 'Kittiwake Fishing', 'Fair Wind Fishing',
    'Low Water Fish', 'Moonraker Fishing', 'Shoal & Sons', 'Gorse Head Fish', 'Seahorse Fishing', 'Cod & Kin', 'The Briny', 'Spratt & Daughters', 'Rising Tide Fish',
    '{S} Fishing', '{S} & Co, Fish Merchants', '{F}’s Boats'],
  design: ['Ink & Salt', 'Paper Moon', 'The Blue Door', 'Linen & Line', 'Gull & Thimble', 'Driftwood Design', 'Seaglass Studio', 'The Painted Pebble', 'Loom & Lantern', 'Saltmarsh Studio', 'Tidemark', 'Kite & Kestrel',
    'Indigo Bay', 'The Print Room', 'Cut & Cloth', 'Sailcloth', 'Two Hands', 'Seawrack Studio', 'Woodcut & Wave', 'The Kiln House',
    'Studio {S}', '{F} {S} Design', '{F}’s Studio'],
};

// The names in town already: the shops on the High Street, Betty's and Pym's, the cast's own.
export const TAKEN = ['Betty’s Café', 'Pym’s Curios', 'Dobbs & Daughter', 'Curl Up & Dye', 'The Gull & Anchor', 'The Lucky Gull', 'Lighthouse Labs', 'Cannery Studios', 'Tidewater Gym', 'Harbour Bank'];

// ---- small helpers -------------------------------------------------------------------------------

// Where somewhere is, as said in a sentence: on the High Street, at the Harbour, at Cannery Studios.
export const atPlace = (name) => (name === 'High Street' ? 'on the High Street' : name === 'Market Square' ? 'in Market Square' : /^The /.test(name) ? `at the ${name.slice(4)}` : `at ${name}`);
export const round10 = (n) => Math.round(n / 10) * 10;
export const round100 = (n) => Math.round(n / 100) * 100;
export const first = (name) => (name || '').split(' ')[0];
export const surname = (name) => { const p = (name || '').trim().split(' '); return p.length > 1 ? p[p.length - 1] : p[0]; };
export const he = (p) => (p.sex === 'm' ? 'he' : 'she');
export const him = (p) => (p.sex === 'm' ? 'him' : 'her');
export const his = (p) => (p.sex === 'm' ? 'his' : 'her');
export const He = (p) => (p.sex === 'm' ? 'He' : 'She');
export const His = (p) => (p.sex === 'm' ? 'His' : 'Her');
export const list = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
export const num = (n) => NUM[n] || String(n);
export const years = (seasons) => { const y = Math.floor(seasons / 4); return y < 1 ? 'less than a year' : y === 1 ? 'a year' : `${num(y)} years`; };
