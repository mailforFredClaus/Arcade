// New in Town: the coast. Gorse Head and Smugglers’ Cove, up the hill.
//
// Gorse Head has birds to watch (and a book to keep them in, better with
// binoculars from the warden’s hut) and the caves under it, felt through
// by lantern before the tide comes back. The cove has a strandline that
// is best after a gale, rock pools, the beach huts’ sandcastle cup every
// summer, and the lifeboat, which wants crew: train, then go when the
// pagers go, in whatever weather sent for you.
//
// And the town’s great mystery: the brig Merrow, lost on the Mare’s Teeth
// with something valuable aboard. Its clues are spread across the town
// and across years (old Marlow by the fire in winter, the archives at the
// library, the burial register at St Brigid’s, a chart that may turn up at
// Mr Pym’s, Captain Quinn’s old tide tables, marks in the caves), and they
// point, if you read them right, to one of eight places. Which one, and
// what is there, is drawn afresh for every life from the life’s own dice,
// so an heir has a different mystery. Dig or dive in the wrong place and
// it costs you; find it and what happens next is yours to decide.
//
// Everything is kept in s.coast. The screen is coast-ui.js; the cave and
// sandcastle games are in coast-games.js.

import { TROPHIES, ITEMS, SEASONS, money, an } from './data.js';

// ---- the coast's own tables -----------------------------------------------------------------

// Birds. where: 'head' (Gorse Head) or 'cove'. when: the seasons it is
// about (none: all year). w: how often it is seen. rare: 0 common, 1
// scarce, 2 rare, 3 very rare. wx: the weather that brings it (much
// likelier then); only: it is never seen in any other.
export const BIRDS = {
  gull: { name: 'Herring gull', icon: '🐦', where: 'head', w: 30, rare: 0 },
  fulmar: { name: 'Fulmar', icon: '🐦', where: 'head', when: [0, 1, 2], w: 16, rare: 0 },
  kittiwake: { name: 'Kittiwake', icon: '🕊️', where: 'head', when: [0, 1], w: 14, rare: 0 },
  kestrel: { name: 'Kestrel', icon: '🦅', where: 'head', w: 10, rare: 0 },
  gannet: { name: 'Gannet', icon: '🕊️', where: 'head', when: [1, 2], w: 10, rare: 0 },
  raven: { name: 'Raven', icon: '🐦', where: 'head', w: 6, rare: 1 },
  peregrine: { name: 'Peregrine falcon', icon: '🦅', where: 'head', w: 3, rare: 1 },
  puffin: { name: 'Puffin', icon: '🐧', where: 'head', when: [1], w: 4, rare: 1 },
  chough: { name: 'Chough', icon: '🐦', where: 'head', w: 1.5, rare: 2 },
  shearwater: { name: 'Manx shearwater', icon: '🐦', where: 'head', when: [1, 2], wx: ['fog', 'storm'], w: 1.5, rare: 2 },
  petrel: { name: 'Leach’s petrel', low: 'Leach’s petrel', icon: '🪶', where: 'head', when: [2], wx: ['storm'], only: true, w: 2, rare: 2 },
  hoopoe: { name: 'Hoopoe', icon: '🐦', where: 'head', when: [0], wx: ['fair', 'hot'], only: true, w: 0.4, rare: 3 },
  albatross: { name: 'Black-browed albatross', icon: '🕊️', where: 'head', when: [2, 3], wx: ['storm'], only: true, w: 0.35, rare: 3 },
  owl: { name: 'Snowy owl', icon: '🦉', where: 'head', when: [3], wx: ['snow'], only: true, w: 0.6, rare: 3 },
  oyc: { name: 'Oystercatcher', icon: '🐦', where: 'cove', w: 24, rare: 0 },
  turnstone: { name: 'Turnstone', icon: '🐦', where: 'cove', when: [0, 2, 3], w: 16, rare: 0 },
  shag: { name: 'Shag', icon: '🐦', where: 'cove', w: 12, rare: 0 },
  sanderling: { name: 'Sanderling', icon: '🐦', where: 'cove', when: [3, 0], w: 9, rare: 0 },
  egret: { name: 'Little egret', icon: '🕊️', where: 'cove', w: 8, rare: 0 },
  curlew: { name: 'Curlew', icon: '🐦', where: 'cove', when: [2, 3], w: 6, rare: 1 },
  eider: { name: 'Eider', icon: '🦆', where: 'cove', when: [3], w: 5, rare: 1 },
  kingfisher: { name: 'Kingfisher', icon: '🐦', where: 'cove', when: [2, 3], w: 1.2, rare: 2 },
  diver: { name: 'Great northern diver', icon: '🦆', where: 'cove', when: [3, 0], wx: ['storm'], w: 1, rare: 2 },
  auk: { name: 'Little auk', icon: '🐧', where: 'cove', when: [3], wx: ['storm'], only: true, w: 1.5, rare: 2 },
  spoonbill: { name: 'Spoonbill', icon: '🦢', where: 'cove', when: [2], w: 0.3, rare: 3 },
};
export const RARITY = ['Common', 'Scarce', 'Rare', 'Very rare'];

// What lives in the rock pools at the cove, and what the tide leaves on
// the strandline. Same shape as the birds (rare is worked out from w).
// pay: what it fetches, if anything.
export const POOLS = {
  anemone: { name: 'Beadlet anemone', icon: '🔴', w: 30 },
  crab: { name: 'Shore crab', icon: '🦀', w: 28 },
  prawn: { name: 'Common prawn', icon: '🦐', w: 22 },
  blenny: { name: 'Blenny', icon: '🐟', w: 18 },
  hermit: { name: 'Hermit crab', icon: '🐚', w: 14 },
  star: { name: 'Cushion star', icon: '⭐', w: 10 },
  snakelocks: { name: 'Snakelocks anemone', icon: '🪸', when: [1, 2], w: 9 },
  velvet: { name: 'Velvet swimming crab', icon: '🦀', w: 5 },
  hare: { name: 'Sea hare', icon: '🐌', when: [0, 1], w: 4 },
  slug: { name: 'Sea slug', icon: '🐛', when: [0, 1], w: 2.5 },
  squat: { name: 'Squat lobster', icon: '🦞', w: 2 },
  cuttle: { name: 'Cuttlefish', icon: '🦑', when: [0, 1], w: 1.4 },
  octopus: { name: 'Curled octopus', icon: '🐙', w: 0.5 },
};
export const STRAND = {
  razor: { name: 'Razor shell', icon: '🐚', w: 22 },
  purse: { name: 'Mermaid’s purse', icon: '👛', w: 20 },
  glass: { name: 'Sea glass', icon: '🟢', w: 20, said: 'a piece of sea glass' },
  cuttlebone: { name: 'Cuttlebone', icon: '🦴', w: 16 },
  hagstone: { name: 'Hag stone', icon: '🪨', w: 8 },
  flipper: { name: 'Plastic flipper', icon: '🧩', w: 6, said: 'a tiny plastic flipper, from a famous spill of toys' },
  fossil: { name: 'Ammonite', icon: '🌀', w: 4 },
  nail: { name: 'Copper sheathing nail', icon: '📌', w: 2 },
  bean: { name: 'Sea bean', icon: '🫘', when: [2, 3], wx: ['storm'], only: true, w: 3 },
  float: { name: 'Glass fishing float', icon: '🔮', wx: ['storm'], w: 0.6, pay: [120, 260] },
  bottle: { name: 'Message in a bottle', icon: '🍾', w: 0.8 },
  ambergris: { name: 'Ambergris', icon: '🧈', wx: ['storm'], w: 0.4, pay: [2500, 5000], said: 'a lump of ambergris' },
};
export const rarityOf = (k) => (k.rare != null ? k.rare : k.w >= 8 ? 0 : k.w >= 2.5 ? 1 : k.w >= 1 ? 2 : 3);

// What a gale may leave at the cove, to be fetched that season.
const WASH = { oranges: 20, timber: 18, barrel: 14, boots: 14, net: 12, curio: 16, figurehead: 2 };

// Lifeboat call-outs. wx: the weather that brings them (none: any).
// dc: how hard the bold way is. saved: how many come home. big: a
// rescue they give medals for. bold, safe: [what you do, how it goes
// well, how it goes badly].
export const SHOUTS = {
  yacht: {
    board: 'A yacht dismasted off the Mare’s Teeth',
    wx: ['storm', 'wet'], dc: 55, saved: 3, big: true,
    text: 'The pagers go at four in the morning. A yacht has lost her mast off the Mare’s Teeth, with three aboard and one of them hurt.',
    bold: ['Go in under the rocks and take them off', 'Quinn holds the bow against the yacht’s side for eleven seconds. You get all three across in nine.', 'A sea comes over the yacht just as you reach for her. You come back aboard the hard way, ribs first, and the others finish the job.'],
    safe: ['Stand off and float a line across', 'The line goes over at the second try, and the yacht comes home on the end of it like a sulky dog.', 'The line parts twice. In the end the helicopter takes them off, and you are thanked for coming.'],
  },
  lilo: {
    board: 'Two children on a lilo, and their father',
    wx: ['hot', 'fair'], dc: 36, saved: 3,
    text: 'Two children on a lilo, going out past the point on the ebb, and their father swimming after them, and losing.',
    bold: ['Over the side, and swim for the father', 'You reach him as he goes under for the second time. He apologises all the way back, through seawater.', 'He fights you, the way drowning people do. The others haul you both out, and he has given you a black eye.'],
    safe: ['Put the boat between the lilo and the open sea', 'The children think it is the best day of their lives. Their father, wrapped in foil, does not.', 'You get the children, but their father is fished out by a man in a pedalo, and the Gazette prefers that story.'],
  },
  trawler: {
    board: 'The Brighter Dawn, aground in fog',
    wx: ['fog'], dc: 50, saved: 4,
    text: 'The trawler Brighter Dawn is aground on the Long Sand in thick fog, with the tide coming in. Her skipper says he will not leave her.',
    bold: ['Go aboard and talk him off', '“Your boat or your grandchildren,” you say. He looks at you for a long time, and then climbs down.', 'You talk until the sea is over her deck, and then all of you have to jump for it. You land badly.'],
    safe: ['Get a tow on her and wait for the tide', 'She floats off at the top of the tide with a groan, and her skipper shakes every hand on the lifeboat twice.', 'The tow parts. She stays where she is, and so, out of loyalty, do you, until the coastguard sends everyone home.'],
  },
  dog: {
    board: 'A dog on a ledge, and its owner',
    dc: 42, saved: 1,
    text: 'A dog has gone over the edge at Gorse Head and is sitting on a ledge, pleased with itself. Its owner is climbing down after it.',
    bold: ['Get ashore on the rocks and climb to the ledge', 'You reach the owner first and the dog second. The dog licks your face all the way down.', 'You slip on the weed and land on the dog’s owner. Everybody is fine except your knee.'],
    safe: ['Talk the owner back up, and wait for the dog', 'The owner climbs back. The dog, bored, comes down by itself and swims out to the boat.', 'The owner will not listen. The cliff team brings them both up, and nobody mentions the lifeboat.'],
  },
  coaster: {
    board: 'The coaster Margit Holm, drifting onto the Head',
    wx: ['storm'], dc: 66, saved: 11, big: true,
    text: 'The coaster Margit Holm has lost her engine in a full gale and is drifting down onto the Head. Eleven crew. Quinn looks at the sea, and then at you.',
    bold: ['Go alongside in her lee and take them off', 'Eleven times the two boats rise together, and eleven times somebody jumps. You catch the last one by the collar.', 'A sea throws the lifeboat against her side and you go down hard. Between the rest of you, everyone is brought off.'],
    safe: ['Stand by while the tug gets a line on her', 'The tow holds. She is dragged off the Head with a hundred yards to spare, and her crew wave their hats.', 'The tow parts in the dark. The helicopter takes her crew off, and the coaster ends up on the Teeth beside the Merrow.'],
  },
  swimmer: {
    board: 'A swimmer swept out at dusk',
    wx: ['fair', 'hot', 'wet'], dc: 44, saved: 1,
    text: 'A swimmer swept out from the cove at dusk. Somebody on the beach is waving a towel, which does not help.',
    bold: ['Go in after him', 'You get an arm round him in the last of the light. He says he does this every evening. Not any more, he does not.', 'The cold takes your breath. You hold on to him and the crew hold on to you, and that is how it ends.'],
    safe: ['Search in lines with the searchlight', 'The light finds a pale face a quarter of a mile out, and you have him aboard in a minute.', 'He has swum ashore further along by the time you find his towel. He is in the pub. He buys nobody a drink.'],
  },
  flares: {
    board: 'Flares off the Head at night',
    wx: ['storm', 'fog', 'wet'], dc: 50, saved: 2, big: true,
    text: 'Red flares seen off the Head at two in the morning. When you get there: nothing but the dark and the sea.',
    bold: ['Keep searching close in, nearer the rocks than Quinn would like', 'At first light you find a dinghy upside down with two people clinging to it, too cold to speak.', 'A sea breaks over the boat close in under the Head. You are thrown against the wheelhouse, and the search goes on without you.'],
    safe: ['Search the open water in a proper pattern', 'Square by square, until there they are: two people on an upturned dinghy, too cold to speak.', 'Nothing, all night. In the morning a fishing boat finds them, alive, and nobody can say how.'],
  },
  canoes: {
    board: 'Canoeists scattered off the point',
    wx: ['wet', 'fair'], dc: 48, saved: 5,
    text: 'A party of canoeists caught by the wind off the point, scattered over a mile of water and getting further apart.',
    bold: ['Go in among the rocks for the ones furthest out', 'One by one you pull them out, and the last one has a flask of soup, which he shares.', 'A canoe comes over a wave and hits you in the face. You get them all, and a broken nose.'],
    safe: ['Round them up from the open-water side', 'You herd them in like sheep. Their leader says he had it under control. Nobody else does.', 'Two get in among the rocks before you can reach them, and the cliff team has to fetch them off.'],
  },
  cave: {
    board: 'Walkers cut off in Hob’s Hole',
    dc: 40, saved: 2,
    text: 'Two walkers cut off by the tide in Hob’s Hole, on the ledge at the back. One of them is still filming.',
    bold: ['Take the small boat into the cave mouth', 'You time it between the waves and bring them out in two trips. The film is very popular.', 'A wave lifts the small boat into the cave roof. You get them out, and the cave gets some of your skin.'],
    safe: ['Wait at the mouth for the tide to turn', 'At slack water they wade out to you, cold and sheepish, and give you the film for nothing.', 'They try to swim for it before you are ready. You pull them out, but it is not tidy.'],
  },
};
export const LB_RANKS = ['Trainee', 'Crew', 'Helm', 'Second coxswain'];
const TRAINING = 4; // sessions before your first shout

// ---- the Merrow ---------------------------------------------------------------------------

// The eight places the Merrow’s cargo could lie. What each is like is the
// same in every life; which one it is, is not.
//   water: 'sea' (always under it), 'tide' (between the tides), 'dry'
//   light: 'lit' (the old lighthouse shines on it) or 'dark'
//   ground: 'rock', 'sand' or 'earth'
//   side: 'out' (the open-sea side of the Head) or 'in' (the cove side)
//   cover: 'open' (to the sky) or 'under' (a roof or rock overhead)
export const SITES = {
  teeth: { name: 'The Mare’s Teeth', icon: '🦷', water: 'sea', light: 'lit', ground: 'rock', side: 'out', cover: 'open', text: 'The reef off the end of the Head where the Merrow struck. Thirty feet down at low water, and the old lighthouse sweeps right over it.' },
  hob: { name: 'Hob’s Hole', icon: '🕳️', water: 'tide', light: 'dark', ground: 'sand', side: 'out', cover: 'under', text: 'The big sea cave under the Head, on the open-sea side. Its sandy floor is dry only at the bottom of the lowest tides.' },
  longsand: { name: 'The Long Sand', icon: '🏝️', water: 'tide', light: 'lit', ground: 'sand', side: 'in', cover: 'open', text: 'A bar of sand across the mouth of the cove that shows only at the bottom of a spring tide. The lighthouse can be seen from it.' },
  kiln: { name: 'The old lime kiln', icon: '🧱', water: 'dry', light: 'lit', ground: 'rock', side: 'out', cover: 'under', text: 'A stone kiln on the cliff path, on the open-sea side. Inside, a vault cut into the rock; outside, a view of the lighthouse.' },
  watch: { name: 'The Watch House', icon: '🛖', water: 'dry', light: 'lit', ground: 'earth', side: 'out', cover: 'under', text: 'The old coastguard hut on top of the Head, with an earth floor and a window that looks straight at the lighthouse.' },
  grave: { name: 'The sailors’ grave', icon: '🪦', water: 'dry', light: 'dark', ground: 'earth', side: 'in', cover: 'open', text: 'In St Brigid’s churchyard, under the sky: the grave where the drowned of the Merrow were laid. The Head hides the lighthouse from it.' },
  stair: { name: 'The Smugglers’ Stair', icon: '🪜', water: 'dry', light: 'dark', ground: 'rock', side: 'in', cover: 'under', text: 'Steps cut in the rock behind the beach huts at the cove, and a hollow under them. Dry, dark, and out of sight of the lighthouse.' },
  seal: { name: 'Seal Pool', icon: '🦭', water: 'sea', light: 'dark', ground: 'sand', side: 'in', cover: 'open', text: 'A deep pool off the point of the cove, always under the sea, with a sandy bottom. The Head hides the lighthouse.' },
};
// How each way a place can be is shown on the clue board.
export const ATTRS = {
  water: { name: 'The tide', vals: { sea: ['🌊', 'Always under the sea'], tide: ['↕️', 'Between the tides'], dry: ['⛱️', 'Above the tide'] } },
  light: { name: 'The lighthouse', vals: { lit: ['💡', 'The light shines on it'], dark: ['🌑', 'Out of sight of the light'] } },
  ground: { name: 'The ground', vals: { rock: ['🪨', 'Rock'], sand: ['🏖️', 'Sand'], earth: ['🟫', 'Earth'] } },
  side: { name: 'Which side', vals: { out: ['🧭', 'The open-sea side'], in: ['🏘️', 'The cove side'] } },
  cover: { name: 'Overhead', vals: { open: ['☁️', 'Open to the sky'], under: ['⛰️', 'A roof or rock over it'] } },
};
// What she was carrying: one of these, in each life.
export const CARGO = [
  { name: 'the pay chest of the 32nd Foot', short: 'gold', icon: '🪙', what: 'four thousand gold sovereigns, still in their rotten canvas bags', worth: 320000 },
  { name: 'a bishop’s silver', short: 'silver', icon: '🏆', what: 'plate, candlesticks and a chalice the size of a bucket, black with the years', worth: 190000 },
  { name: 'two chests of Spanish dollars', short: 'dollars', icon: '💰', what: 'Spanish silver dollars by the thousand, fused into lumps by the sea', worth: 240000 },
  { name: 'Lady Penrose’s jewels', short: 'jewels', icon: '💎', what: 'a rosewood box of rings and brooches, and a necklace of emeralds, with a letter in it nobody can read without crying', worth: 270000 },
  { name: 'a merchant’s casket of pearls', short: 'pearls', icon: '🦪', what: 'a lead-lined casket of pearls, some of them as big as a thumbnail', worth: 220000 },
];
// Where a clue may come from, and in what order the clue board lists them.
// hint: what the board says while it is still to be followed.
export const LEADS = {
  marlow: { icon: '🍺', name: 'Old Marlow’s story', hint: 'Old Marlow knows more than he says. He tells the old stories in winter, by the fire at the Gull & Anchor.' },
  paper: { icon: '📰', name: 'The old Gazettes', hint: 'Miss Achterberg keeps the town’s archives at the library, for readers she knows. The bound Gazettes are in there.' },
  archive: { icon: '🗄️', name: 'The inquest', hint: 'The coroner’s papers are in the archives too, somewhere at the bottom.' },
  register: { icon: '📜', name: 'The burial register', hint: 'St Brigid’s has buried the town’s dead for three hundred years. You would need a name and a date.' },
  chart: { icon: '🗺️', name: 'An old chart', hint: 'Old charts of this coast turn up in Mr Pym’s window now and then.' },
  quinn: { icon: '📘', name: 'The old tide tables', hint: 'Captain Quinn keeps the harbour’s old tide tables, for her own lifeboat crew.' },
  marks: { icon: '🕯️', name: 'Marks in the caves', hint: 'The survivors sheltered in the caves under Gorse Head. People say they left their marks.' },
};
const OLD_FIRST = ['Josiah', 'Tobias', 'Elias', 'Silas', 'Amos', 'Ezra', 'Jem', 'Nathaniel', 'Reuben', 'Abel', 'Caleb', 'Zebedee', 'Obadiah', 'Jabez'];
const OLD_LAST = ['Penhallow', 'Tregenza', 'Thackeray', 'Quayle', 'Larkin', 'Whitlock', 'Fairweather', 'Pascoe', 'Rowe', 'Trevaskis', 'Polglaze', 'Hocking', 'Jago', 'Nance'];
const PORTS = ['Falmouth', 'Cork', 'Lisbon', 'Bristol', 'Plymouth', 'Bordeaux', 'Swansea', 'Corunna'];
const MONTHS = ['October', 'November', 'December', 'January', 'February'];
const JUNK = ['a clay pipe', 'half a bicycle', 'a ginger beer bottle from 1911', 'a bucket with no bottom', 'a great many crab shells', 'a set of false teeth', 'a horseshoe', 'a tin of corned beef, unopened', 'a lead soldier', 'the lid of a kettle'];
const SEARCHED = ['a dead dog and a broken lantern', 'an old boot and a quantity of rats', 'a smugglers’ keg, empty', 'the bones of a sheep'];

// The clues, by where they come from and what they speak to. Each is a
// function of the life’s Merrow (m) and the value the hoard really has.
const MARLOW = {
  light: { lit: '“My grandad had it from the boy himself,” says Marlow. “They worked all night with the lighthouse going round over their heads, and every time it came by they lay flat and cursed it. Lit them up like a stage, he said.”', dark: '“My grandad had it from the boy himself,” says Marlow. “Where they put it, the lighthouse could not find them. Black as your hat, he said, and they were glad of it, with the owners’ men out on the Head with lanterns.”' },
  water: { sea: '“My grandad had it from the boy himself,” says Marlow. “They never carried it ashore at all. Let it go where it would lie under the water for good, where nobody could ever walk out to it.”', tide: '“My grandad had it from the boy himself,” says Marlow. “They waited for the tide to go out, and they had to be quick, for it came back in over the place before they had done. Wet to the waist, he said.”', dry: '“My grandad had it from the boy himself,” says Marlow. “They carried it up above where any tide could reach. The boy remembered his legs giving out, and the sea a long way below.”' },
};
const QUINN = {
  water: { sea: 'M. — no tide uncovers it. Not the lowest of the year.', tide: 'M. — uncovered at the bottom of the great ebbs only. Two hours, no more.', dry: 'M. — no tide reaches it. Not the highest of the year, with a gale behind it.' },
  side: { out: 'M. — the open-sea side. Mind the Teeth.', in: 'M. — the cove side. Under the town’s nose.' },
};
const CHART = {
  side: { out: 'Someone has inked a small chest on the open-sea side of the Head, where the reef is.', in: 'Someone has inked a small chest on the cove side of the Head, the side that looks back at the town.' },
  light: { lit: 'Someone has ruled the beam of the old lighthouse across it in red ink, and drawn a small chest inside the beam.', dark: 'Someone has ruled the beam of the old lighthouse across it in red ink, and drawn a small chest well outside it, in the Head’s shadow.' },
};
const INQUEST = {
  ground: { rock: 'they “had to wedge it in among the rock, and it took the skin off their hands.”', sand: 'they “sank it in the sand, and the sand closed over it like water.”', earth: 'they “put it in soft black earth, full of worms.”' },
  cover: { open: 'it “rained on them all the while, and they saw the stars come out over them at the end.”', under: 'they “were out of the rain, at least, and had to go on their knees to get in.”' },
};
const SEXTON = {
  cover: { open: 'it lies with nothing over it but the sky', under: 'it lies where no rain can ever fall on it' },
  ground: { rock: 'they wedged it in the living rock', sand: 'it lies in sand, and sand keeps a secret', earth: 'it lies in honest earth, like a Christian' },
};
const MARKS = {
  water: { sea: 'a chest drawn under three wavy lines', tide: 'a chest with one wavy line drawn right through the middle of it', dry: 'a chest drawn high above a wavy line' },
  light: { lit: 'a chest with the rays of a star drawn reaching right down to it', dark: 'a chest, and a star whose rays stop well short of it' },
  ground: { rock: 'a chest inside a jagged shape, cut deep', sand: 'a chest sitting on rows of little dots', earth: 'a chest under a spade and the curl of a root' },
  side: { out: 'the hump of the Head, with an arrow pointing away from the cove, out to sea', in: 'the hump of the Head, with an arrow curling round towards the cove' },
  cover: { open: 'a chest with nothing over it but a crescent moon', under: 'a chest with a little roof drawn over it' },
};

const round10 = (n) => Math.round(n / 10) * 10;
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const listOf = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);
// A place’s name in the middle of a sentence: “at the Long Sand”.
export const siteSaid = (id) => SITES[id].name.replace(/^The /, 'the ');
// A bird, a creature or a find, as you would say it: “a fulmar”, “a lump of ambergris”.
export const aThing = (k) => k.said || an(k.low || k.name.toLowerCase());
// Picks one id from [[id, weight], ...] with the life’s dice.
const weighed = (L, list) => {
  let r = L.rnd() * list.reduce((a, [, w]) => a + w, 0);
  for (const [id, w] of list) { r -= w; if (r < 0) return id; }
  return list[list.length - 1][0];
};
const WX_SAID = { fair: 'fair weather', wet: 'the wet', hot: 'a heatwave', storm: 'a gale', fog: 'fog', snow: 'snow' };
// When and where something is to be had, for the book’s empty pages.
export const whenSaid = (k) => [k.when ? k.when.map((q) => SEASONS[q].toLowerCase()).join(', ') : '', k.wx ? `${k.only ? 'only in' : 'best in'} ${k.wx.map((w) => WX_SAID[w]).join(' or ')}` : ''].filter(Boolean).join('; ');

export function install({ def, Life, clamp, hooks, addEvents }) {
  // Binoculars, from the warden’s hut on Gorse Head.
  if (!ITEMS.binoculars) ITEMS.binoculars = { name: 'Binoculars', icon: '🔭', price: 350, at: 'headland', sec: 'The warden’s hut', blurb: 'More birds, and the far-off rare ones made out properly.' };

  Object.assign(Life.prototype, {
    // ---- the state ----
    coast() { return this.s.coast; },
    coastHe() { return this.s.sex === 'f' ? 'she' : 'he'; },
    // Something for the Gazette. lead: it goes on the front page.
    coastNews(icon, h, x, lead = false) {
      const c = this.s.coast;
      c.news.push({ t: this.s.t, icon, h, x, lead });
      if (c.news.length > 8) c.news.splice(0, c.news.length - 8);
    },

    // ---- the lifeboat ----
    coastCrew() { const lb = this.s.coast.lb; return !!lb && lb.rank >= 1 && lb.left == null && lb.done == null; },
    coastOnBooks() { const lb = this.s.coast.lb; return !!lb && lb.left == null && lb.done == null; },
    coastStand(d) { const lb = this.s.coast.lb; if (lb) lb.stand = clamp(lb.stand + d, 0, 100); },
    coastStandWord() {
      const v = this.s.coast.lb ? this.s.coast.lb.stand : 0;
      return v >= 85 ? 'She would trust you with her boat' : v >= 60 ? 'She lets you take the helm' : v >= 40 ? 'She says your name' : v >= 20 ? 'She nods at you' : 'She has not noticed you';
    },
    // How likely a way of doing a rescue is to come off.
    coastShoutOdds(id, bold) {
      const s = this.s, lb = s.coast.lb, sc = SHOUTS[id];
      if (!lb || !sc) return 0.5;
      const bonus = 0.04 * Math.max(0, lb.rank - 1) + (s.job && s.job.c === 'sea' ? 0.08 : 0) + (s.gifts.lifeboat ? 0.05 : 0) + (s.coast.m && s.coast.m.end === 'town' ? 0.05 : 0);
      return clamp((bold ? this.checkOdds('fitness', sc.dc) : this.checkOdds('smarts', sc.dc - 25)) + bonus, 0.05, 0.95);
    },
    // A call-out answered (how: 'bold', 'safe' or 'miss').
    coastShouted(id, how, win) {
      const s = this.s, lb = s.coast.lb, sc = SHOUTS[id];
      lb.act = s.t;
      if (how === 'miss' || !sc) {
        lb.miss++; this.coastStand(-6);
        return this.pick(['The others go without you. Quinn says nothing about it afterwards, which is worse.', 'You hear the maroons from the kitchen and watch the boat go out without you.']);
      }
      s.time = Math.max(0, s.time - 1);
      lb.calls++;
      let saved = 0;
      if (how === 'bold') {
        saved = sc.saved;
        if (win) {
          this.coastStand(6); this.karma(3); this.joy(6); this.gain('fitness', 1);
          if (sc.big) { lb.bigs++; this.fame(1); }
          if (sc.big && ((lb.medal === 0 && lb.stand >= 45) || (lb.medal === 1 && lb.stand >= 75 && lb.bigs >= 3)) && this.chance(0.6)) this.queue('coastMedal');
        } else { this.hp(-(8 + this.int(0, 6)), 'the sea'); this.coastStand(2); this.karma(2); this.joy(-2); }
      } else if (win) { saved = sc.saved; this.coastStand(3); this.karma(2); this.joy(4); } else { this.coastStand(1); this.joy(-1); }
      lb.saved += saved;
      lb.log.unshift({ t: s.t, id, saved });
      lb.log.length = Math.min(lb.log.length, 6);
      if (win && s.job && s.job.c === 'sea') s.job.perf = clamp(s.job.perf + 2, 0, 100);
      let text = sc[how][win ? 1 : 2];
      if (lb.rank === 1 && lb.stand >= 60 && lb.calls >= 6) { lb.rank = 2; text += ' Afterwards, Quinn hands you the wheel to bring her up the slipway. You are Helm now.'; this.note('Made Helm on the Starling Bay lifeboat.', 'big'); this.say('🛟', 'Made Helm on the lifeboat', 'promo'); }
      else if (lb.rank === 2 && lb.stand >= 85 && lb.calls >= 15) { lb.rank = 3; text += ' “Second cox,” says Quinn, and walks off before you can answer.'; this.note('Made second coxswain of the Starling Bay lifeboat.', 'big'); this.say('🛟', 'Made second coxswain of the lifeboat', 'promo'); }
      return text;
    },
    coastTrusted() {
      const s = this.s, lb = s.coast.lb;
      return (!!lb && lb.rank >= 1 && lb.stand >= 50) || (!!s.job && s.job.c === 'sea' && s.job.r >= 3);
    },

    // ---- the caves ----
    coastCaveLevel() { return Math.min(5, Math.floor(this.s.coast.caves.n / 2)); },

    // ---- the Merrow ----
    // Makes up this life’s mystery, the first time it is wanted.
    coastMerrow() {
      const c = this.s.coast;
      if (c.m) return c.m;
      const names = [];
      while (names.length < 4) { const n = `${this.pick(OLD_FIRST)} ${this.pick(OLD_LAST)}`; if (!names.some((o) => o.split(' ')[1] === n.split(' ')[1])) names.push(n); }
      const ids = Object.keys(SITES), ans = this.pick(ids), rest = ids.filter((k) => k !== ans);
      const a = this.pick(rest), b = this.pick(rest.filter((k) => k !== a));
      const g1 = this.chance(0.5), g2 = this.chance(0.5), from = this.pick(PORTS);
      c.m = {
        on: null, ans, cargo: this.int(0, CARGO.length - 1), year: this.int(1790, 1858), day: this.int(2, 28), month: this.pick(MONTHS),
        from, to: this.pick(PORTS.filter((p) => p !== from)), master: names[0], mate: names[1], boy: names[2], owner: names[3].split(' ')[1], crew: this.int(9, 15),
        // Which clue speaks to what. The five main ones cover all five ways a place can be;
        // the marks in the caves say one of them again.
        who: { marlow: g1 ? 'light' : 'water', quinn: g1 ? 'water' : 'side', chart: g1 ? 'side' : 'light', archive: g2 ? 'ground' : 'cover', register: g2 ? 'cover' : 'ground', marks: this.pick(Object.keys(ATTRS)) },
        searched: [a, b], junk: this.pick(SEARCHED),
        clues: {}, x: {}, dug: {}, pints: 0, arch: 0, chart: null, digAt: null, rival: null, told: 0, found: null, end: null, claimAt: null, claimed: 0,
      };
      return c.m;
    },
    coastClues() { const m = this.s.coast.m; return m ? Object.keys(m.clues).length : 0; },
    coastOn() { const m = this.s.coast.m; return !!m && m.on != null; },
    coastHunting() { const m = this.s.coast.m; return !!m && m.on != null && m.found == null; },
    coastDate() { const m = this.s.coast.m; return `${m.day} ${m.month} ${m.year}`; },
    // A clue, as the clue board shows it: { icon, name, text }.
    coastClue(key) {
      const m = this.s.coast.m, k = SITES[m.ans], attr = m.who[key], v = attr ? k[attr] : null, lead = LEADS[key];
      let text = '';
      if (key === 'marlow') text = MARLOW[attr][v];
      else if (key === 'quinn') text = `The harbour’s tide tables for ${m.year}, foxed and swollen, with a note in the margin in faded pencil: “${QUINN[attr][v]}” “Not mine,” says Quinn.`;
      else if (key === 'chart') text = `A sea chart of Gorse Head, much folded, with the Mare’s Teeth drawn in like real teeth. ${CHART[attr][v]}`;
      else if (key === 'archive') text = `The coroner’s notes on the inquest, in brown ink. The boy ${m.boy}, aged fourteen, said ${INQUEST[attr][v]} The coroner, who had his dinner waiting, did not ask what they had been doing.`;
      else if (key === 'register') text = `The burial register, ${m.year + 6}: “${m.mate}, late mate of the brig Merrow, found drowned below the Head.” In the margin, in the sexton’s smaller hand: “He told me in drink, God rest him, that ${SEXTON[attr][v]}.”`;
      else if (key === 'marks') text = `Cut into the wall of the cave, by the light of your lantern: a ship with her mast down, the letter M, and ${MARKS[attr][v]}.`;
      else if (key === 'paper') text = `The Gazette for the week after the wreck, bound in calf and smelling of cellar: “Agents for the owners of the brig Merrow have searched ${siteSaid(m.searched[0])} and ${siteSaid(m.searched[1])} with lanterns and crowbars, and found nothing but ${m.junk}. Her mate, ${m.mate}, and the boy ${m.boy} are recovering at the Ship Inn.”`;
      return { icon: lead.icon, name: lead.name, text };
    },
    coastGot(key) {
      const s = this.s, m = s.coast.m;
      if (m.clues[key] != null) return;
      m.clues[key] = s.t;
      this.note(`Found a clue to the Merrow: ${LEADS[key].name.toLowerCase()}.`);
      this.say(LEADS[key].icon, `A clue to the Merrow: ${LEADS[key].name.toLowerCase()}`, 'good');
    },
    // What a dig at a place would cost, and how it is done.
    coastDigHow(id) { const k = SITES[id]; return id === 'grave' ? 'grave' : k.water === 'sea' ? 'dive' : k.water === 'tide' ? 'tide' : 'dig'; },
    // (Every hole dug for nothing makes the council warier: the next permit costs more, and is longer coming.)
    coastMisses() { const m = this.s.coast.m; return m ? Object.keys(m.dug).filter((k) => k !== m.ans).length : 0; },
    coastDigWait() { const m = this.s.coast.m; return m && m.digAt != null ? Math.max(0, m.digAt + 4 * this.coastMisses() - this.s.t) : 0; },
    coastDigCost(id) { const how = this.coastDigHow(id), base = how === 'dive' ? (this.s.items.boat ? 1200 : 3000) : how === 'tide' ? 600 : how === 'grave' ? 2500 : 900; return round10(base * (1 + 0.5 * this.coastMisses())); },
    // A place the man from the podcast might dig: never the right one.
    coastRivalSite() {
      const m = this.s.coast.m;
      const ok = Object.keys(SITES).filter((k) => k !== m.ans && !m.dug[k] && !m.searched.includes(k));
      return ok.length ? this.pick(ok) : null;
    },
    // How it ends: 'keep' (sell it), 'museum' or 'town' (share it).
    coastEnd(how) {
      const s = this.s, m = s.coast.m, k = CARGO[m.cargo], He = this.coastHe() === 'she' ? 'She' : 'He';
      m.end = how;
      if (how === 'keep') {
        this.cash(k.worth); this.karma(-6); this.fame(6); this.joy(12);
        m.claimAt = s.t + this.int(4, 10);
        this.note(`Sold the treasure of the Merrow for ${money(k.worth)}.`, 'big');
        this.coastNews(k.icon, 'Merrow treasure goes under the hammer', `${cap(k.name)}, found by ${s.name} after two hundred years, has been sold to a buyer abroad for ${money(k.worth)}. ${He} has bought a new kettle. The museum has a photograph.`, true);
        return `Dealers come from London, then from Geneva. When the hammer falls you are ${money(k.worth)} richer, and a little less welcome in the Gull & Anchor.`;
      }
      if (how === 'museum') {
        const pay = round10(k.worth * 0.1);
        this.cash(pay); this.karma(14); this.fame(12); this.joy(14);
        s.n.given = (s.n.given || 0) + k.worth - pay;
        this.note('Gave the treasure of the Merrow to the town museum.', 'big');
        this.coastNews(k.icon, 'The Merrow comes home', `${cap(k.name)}, lost off Gorse Head two hundred years ago and found by ${s.name}, is to go on show in a new room at the library. ${He} has accepted a finder’s reward of ${money(pay)}, and an invitation to cut the ribbon.`, true);
        return `The museum gives it a room of its own at the library, with your name over the door in brass and a finder’s reward of ${money(pay)}. Miss Achterberg allows talking in it, once, at the opening.`;
      }
      const pay = round10(k.worth * 0.4);
      this.cash(pay); this.karma(18); this.fame(8); this.joy(12);
      s.n.given = (s.n.given || 0) + k.worth - pay;
      this.note('Shared the treasure of the Merrow with the town.', 'big');
      this.coastNews(k.icon, 'Merrow treasure shared out', `${s.name}, who found the Merrow’s ${k.short} after two hundred years, has sold it and given most of it away: St Brigid’s has its new roof, the lifeboat station new gear, and the library a new wing. The Reverend Hollis was seen crying in the street.`, true);
      return `You keep ${money(pay)}, and the rest goes where the town needs it: a new roof for St Brigid’s, new gear for the lifeboat, and a wing for the library. The Reverend Hollis cries in the street, and is not embarrassed about it.`;
    },
    // The Gazette, with the coast’s news in it.
    coastPaper(g) {
      const s = this.s, c = s.coast, q = this.season;
      const now = c.news.filter((n) => n.t >= s.t - 1);
      const lead = now.filter((n) => n.lead).pop();
      if (lead && !s.gaol && !s.run) { g.items.unshift({ icon: g.lead.icon, h: g.lead.h, t: g.lead.t }); g.lead = { icon: lead.icon, h: lead.h, t: lead.x }; }
      for (const n of now.filter((v) => v !== lead).slice(-2)) g.items.splice(Math.min(2, g.items.length), 0, { icon: n.icon, h: n.h, t: n.x });
      const birds = ['Kittiwakes are back on the ledges at Gorse Head, and so are the people who count them.', 'Puffins on the Head and gannets diving off it. Binoculars from the warden’s hut.', 'The curlews are back at the cove. After a gale, watch the Head for seabirds blown in from the ocean.', 'Turnstones and sanderlings at the cove. In snow, people say, an owl has been seen on the Head. People say a lot.'][q];
      g.items.push({ icon: '🐦', h: 'On the coast', t: `${birds}${s.wx === 'storm' ? ' Gale warning: the caves at Gorse Head are closed, and the strandline at the cove is worth a look.' : ''}` });
      return g;
    },
  });

  // The Gazette (town.js) gets the coast’s news too.
  const paper = Life.prototype.gazette;
  if (paper) Life.prototype.gazette = function gazette() { return this.coastPaper(paper.call(this)); };
  // And the obituary gets a line, if there is one to give.
  const epitaph = Life.prototype.epitaph;
  if (epitaph) {
    Life.prototype.epitaph = function coastEpitaph() {
      const out = epitaph.call(this), s = this.s, c = s.coast, He = this.coastHe() === 'she' ? 'She' : 'He', his = He === 'She' ? 'her' : 'his', lines = [];
      if (c && c.m && c.m.end) lines.push(`It was ${s.name.split(' ')[0]} who found the treasure of the brig Merrow, after two hundred years, ${c.m.end === 'keep' ? 'and sold it, which the town has not quite forgiven' : c.m.end === 'museum' ? 'and gave it to the town, which still has it' : 'and shared it with the town: St Brigid’s has a roof because of it'}.`);
      if (c && c.lb && c.lb.calls >= 5) lines.push(`${He} went out with the Starling Bay lifeboat ${c.lb.calls} times${c.lb.medal ? `, and wore ${his} medal for gallantry once a year` : ''}.`);
      if (lines.length) out.splice(Math.max(0, out.length - 2), 0, ...lines);
      return out;
    };
  }

  // ---- what is kept ----
  hooks.load.push((L) => {
    const s = L.s;
    s.coast = Object.assign({ birds: {}, pools: {}, strand: {}, rare: null, wash: null, caves: null, castle: null, lb: null, m: null, reads: 0, cove: 0, news: [] }, s.coast || {});
    const c = s.coast;
    c.caves = Object.assign({ n: 0, best: 0, cut: 0 }, c.caves || {});
    c.castle = Object.assign({ last: -1, wins: 0 }, c.castle || {});
    if (c.lb) c.lb = Object.assign({ at: s.t, train: 0, rank: 0, stand: 15, calls: 0, saved: 0, medal: 0, bigs: 0, miss: 0, log: [], act: s.t, left: null, done: null }, c.lb);
  });
  // (Miss Achterberg notices who reads in her reading room.)
  hooks.acted.push((L, id) => {
    if (id === 'readingRoom') L.s.coast.reads++;
    if (id === 'seaSwim') L.s.coast.cove++;
  });
  hooks.mood.push((L) => {
    const c = L.s.coast, end = c.m && c.m.end;
    return (L.coastCrew() ? 2 : 0) + (end === 'museum' ? 3 : end === 'town' ? 2 : 0);
  });

  // The turn of the season (the new season’s weather is in).
  hooks.late.push((L, jailed) => {
    const s = L.s, c = s.coast, m = c.m, lb = c.lb, out = jailed || !!s.gaol;
    // A gale leaves things on the beach at the cove.
    if (s.wx === 'storm' && L.chance(0.75)) { c.wash = { t: s.t, k: weighed(L, Object.entries(WASH)), got: 0 }; if (!out) L.say('🌊', 'The gale has left something on the beach at Smugglers’ Cove', 'good'); }
    if (lb && lb.left == null && lb.done == null) {
      // Standing slips a little in a season you were not seen.
      if (lb.act < s.t - 1) L.coastStand(-1);
      if (s.age >= 65) { lb.done = s.t; L.note(`Stood down from the lifeboat after ${lb.calls} shout${lb.calls === 1 ? '' : 's'}. Captain Quinn shook your hand, which nobody had seen her do.`, 'big'); }
      else if (lb.rank >= 1 && !out) {
        // The pagers go more often when the weather is bad.
        const p = { storm: 0.65, fog: 0.4, wet: 0.2, snow: 0.2, hot: 0.25, fair: 0.1 }[s.wx] ?? 0.1;
        if (L.chance(p)) L.queue('coastShout', L.pick(Object.keys(SHOUTS).filter((k) => !SHOUTS[k].wx || SHOUTS[k].wx.includes(s.wx))));
      }
    }
    if (m && m.on != null && m.found == null && !out) {
      // The chart turns up in Mr Pym’s window now and then.
      if (m.clues.chart == null && s.t - m.on >= 2 && L.chance(0.12)) { m.chart = { t: s.t, ask: 10 * L.int(45, 140) }; L.say('🗺️', 'Mr Pym has an old chart of Gorse Head in his window', 'good'); }
      if (m.clues.quinn == null && !m.told && L.coastTrusted()) { m.told = 1; L.say('📘', 'Captain Quinn wants a word, down at the harbour', 'good'); }
      if (m.clues.marlow == null && L.season === 3 && (s.f.marlow || 0) >= 1) L.say('🍺', 'Old Marlow is by the fire at the Gull & Anchor most nights now', '');
    }
    if (m && m.end === 'keep' && !m.claimed && m.claimAt != null && s.t >= m.claimAt && !out) L.queue('coastClaim');
  });

  // ---- Gorse Head --------------------------------------------------------------------------

  // Two or three birds at a time, from where you are, in this season and this weather.
  const watch = (L, where) => {
    const s = L.s, c = s.coast, glasses = !!s.items.binoculars, q = L.season;
    const pool = Object.entries(BIRDS).filter(([, b]) => b.where === where && (!b.when || b.when.includes(q)) && (!b.only || b.wx.includes(s.wx)))
      .map(([id, b]) => [id, b.w * (b.wx && b.wx.includes(s.wx) && !b.only ? 4 : 1) * (glasses ? [1, 1.8, 2.4, 3][b.rare] : 1)]);
    const seen = [], fresh = [];
    let missed = false, wow = null;
    for (let i = 0; i < (glasses ? 3 : 2); i++) {
      const id = weighed(L, pool), b = BIRDS[id];
      // (Without binoculars the far-off rare ones are a blur.)
      if (b.rare >= 2 && !glasses && L.chance(0.55)) { missed = true; continue; }
      if (!seen.includes(id)) seen.push(id);
      if (!c.birds[id] && !fresh.includes(id)) { fresh.push(id); L.say(b.icon, `New in your bird book: ${b.name}`, 'good'); }
      c.birds[id] = (c.birds[id] || 0) + 1;
      if (b.rare === 3 && !wow) wow = id;
    }
    L.gain('smarts', 1); L.joy(3 + Math.min(4, fresh.length * 2));
    let text = `${where === 'head' ? L.pick(['Two hours on the bench above the cliffs, with a flask.', 'You lie in the heather at the cliff edge and let the wind do the work.', 'The gulls watch you back, which is only fair.', 'A morning of nothing, and then, all at once, everything.']) : L.pick(['You sit on an upturned boat and watch the tide go out.', 'The waders run in and out with the waves like clockwork toys.', 'An hour on the rocks with the wind behind you.'])} `;
    text += seen.length ? `You see ${listOf(seen.map((id) => aThing(BIRDS[id])))}.` : 'Nothing will sit still long enough to be anything.';
    if (missed) text += ' Something far out over the water, too far off to be sure. Binoculars would have settled it.';
    if (fresh.length) text += ` New in your bird book: ${listOf(fresh.map((id) => BIRDS[id].low || BIRDS[id].name.toLowerCase()))}.`;
    if (wow && fresh.includes(wow)) {
      c.rare = { id: wow, t: s.t };
      L.fame(1);
      L.note(`Saw ${aThing(BIRDS[wow])} at ${where === 'head' ? 'Gorse Head' : 'Smugglers’ Cove'}. Nobody believed it until the photographs.`, 'big');
      L.coastNews('🔭', `${BIRDS[wow].name} at ${where === 'head' ? 'Gorse Head' : 'the cove'}`, `${cap(aThing(BIRDS[wow]))}, seen by ${s.name} ${where === 'head' ? 'from the cliff path' : 'on the beach at Smugglers’ Cove'}, is the first in the county for forty years. Birdwatchers are asked not to stand in Tom Windle’s turnips.`);
      L.queue('coastTwitch', wow);
      text += ` And then: ${aThing(BIRDS[wow])}. Here. Your hands shake so much you can hardly hold still to look.`;
    }
    return text;
  };
  def('coastBirds', {
    place: 'headland', sec: 'Birdwatching', icon: '🐦', title: 'Watch the birds', per: 2,
    desc: (L) => `Gulls and falcons, and now and then something nobody here has seen before. Good for Smarts and the mood.${L.s.items.binoculars ? '' : ' Binoculars would help.'}`,
    run: (L) => watch(L, 'head'),
  });
  def('coastBookHead', { place: 'headland', sec: 'Birdwatching', icon: '📗', title: 'Your coast book', desc: (L) => `Birds, rock pools and the strandline. ${Object.keys(L.s.coast.birds).length} of ${Object.keys(BIRDS).length} birds seen.`, time: 0, open: 'coastBook' });

  def('coastCaves', {
    place: 'headland', sec: 'The caves', icon: '🕯️', title: 'Explore the caves', time: 2, cost: 15, per: 1,
    desc: 'Into Hob’s Hole by lantern while the tide is out: coins, curios and older things, if you get back before the sea does. Oil for the lantern, $15.',
    why: (L, x) => (x !== undefined && !(typeof x === 'number' && x >= 0 && x <= 1) ? 'Mind how you go.' : L.s.wx === 'storm' ? 'The sea is in the caves in this weather.' : L.s.age >= 76 ? 'Not on those knees.' : null),
    run(L, x) {
      const s = L.s, c = s.coast, m = c.m, q = x === undefined ? 0.5 : x;
      c.caves.n++; c.cove++;
      L.gain('fitness', 1.2); L.s.use.fit = 1;
      if (q < 0.2) {
        L.queue('coastCutOff');
        return 'You turn for the mouth of the cave and it is not there: only water, white and loud, and coming in.';
      }
      // What you came out with: up to three things worth having, by how much of the cave you went through.
      const n = Math.floor(clamp((q - 0.4) / 0.6, 0, 1) * 3 + 0.7), got = [];
      c.caves.best = Math.max(c.caves.best, q);
      let cash = 0;
      for (let i = 0; i < n; i++) {
        const r = L.rnd();
        if (r < 0.16) got.push(L.gotCurio(L.anyCurio(['sea', 'coin'])).a);
        else if (r < 0.7) cash += L.int(2, 12) * 10;
        else got.push(L.pick(['a clay pipe', 'a brass button with an anchor on it', 'a bottle with something still in it', 'a lead musket ball', 'a tin whistle', 'a small and very old shoe']));
      }
      if (cash) { L.cash(cash); s.n.earned += cash; got.unshift(`${money(cash)} in old coins`); }
      L.joy(2 + n);
      let text = n ? `${L.pick(['Out into the daylight with wet knees and full pockets.', 'You come out blinking, ahead of the tide.', 'Back out before the sea, with sand in everything.'])} Your pockets turn out ${listOf(got)}.` : L.pick(['You come out with nothing but wet feet, and the sea right behind you.', 'Out again, empty-handed. The cave keeps its own.']);
      // The survivors left their marks in here, for anyone who looks.
      if (m && m.on != null && m.found == null && m.clues.marks == null && L.chance(0.15 + 0.5 * clamp((q - 0.4) / 0.6, 0, 1))) {
        L.coastGot('marks');
        text += ` On the way out, low on the wall where the lantern catches it, something carved: a ship with her mast down, and the letter M. You copy it into your notebook with cold fingers.`;
      }
      return text;
    },
  });

  // -- the Merrow’s stone, and the notebook
  def('coastStone', {
    place: 'headland', sec: 'The Merrow', icon: '🪦', title: 'Read the memorial stone', desc: 'A worn stone by the cliff path, with names on it, and a ship.', time: 0,
    show: (L) => !L.coastOn(),
    run(L) {
      const m = L.coastMerrow();
      L.queue('coastLegend');
      return `IN MEMORY OF THE MASTER AND CREW OF THE BRIG MERROW, LOST ON THE MARE’S TEETH, ${m.day} ${m.month.toUpperCase()} ${m.year}. THE SEA GIVES BACK WHAT IT CHOOSES.`;
    },
  });
  def('coastBoardOpen', { place: 'headland', sec: 'The Merrow', icon: '📓', title: 'The Merrow: your notebook', desc: (L) => (L.s.coast.m.found != null ? 'The whole story, and how it ended.' : `${L.coastClues()} of ${Object.keys(LEADS).length} leads followed. Where does it lie?`), time: 0, open: 'coastBoard', show: (L) => L.coastOn() });

  // ---- Smugglers’ Cove ---------------------------------------------------------------------

  def('coastWaders', {
    place: 'cove', sec: 'The shore', icon: '🐦', title: 'Watch the waders', per: 1,
    desc: 'Oystercatchers, turnstones, and whatever the weather blows in. Good for Smarts and the mood.',
    run(L) { L.s.coast.cove++; return watch(L, 'cove'); },
  });
  def('coastComb', {
    place: 'cove', sec: 'The shore', icon: '🐚', title: 'Walk the strandline', per: 1,
    desc: (L) => (L.s.wx === 'storm' ? 'After a gale the tide leaves all sorts. Best now.' : 'See what the tide has left along the top of the beach. Best after a gale.'),
    run(L) {
      const s = L.s, c = s.coast, storm = s.wx === 'storm', q = L.season, got = [];
      c.cove++;
      L.joy(2); L.gain('fitness', 0.4); s.use.fit = 1;
      const pool = Object.entries(STRAND).filter(([, k]) => (!k.when || k.when.includes(q)) && (!k.only || storm)).map(([id, k]) => [id, k.w * (storm && k.wx ? 4 : 1)]);
      let cash = 0, bottle = false;
      for (let i = 0; i < (storm ? 2 : 1); i++) {
        const id = weighed(L, pool), k = STRAND[id];
        if (!c.strand[id]) L.say(k.icon, `New in your coast book: ${k.name}`, 'good');
        c.strand[id] = (c.strand[id] || 0) + 1;
        if (k.pay) cash += round10(L.int(k.pay[0], k.pay[1]));
        if (id === 'bottle') bottle = true;
        got.push(id);
      }
      let text = `${L.pick(['Along the line of weed at the top of the beach, head down.', 'You walk the strandline with a carrier bag and a stick.', 'The tide has been busy.'])} You find ${listOf(got.map((id) => aThing(STRAND[id])))}.`;
      if (got.includes('ambergris')) text += ` It smells of the sea and of church, and a perfumer from the city pays ${money(cash)} for it.`;
      else if (cash) text += ` Mr Pym gives you ${money(cash)} for the float.`;
      if (cash) { L.cash(cash); s.n.earned += cash; }
      if (L.chance(storm ? 0.12 : 0.04)) { const k = L.gotCurio(L.anyCurio(['sea', 'coin'])); text += ` And half buried, ${k.a}.`; }
      else if (L.chance(0.3)) { const n = L.int(1, 6) * 5; L.cash(n); text += ` And ${money(n)} in loose change, which is the beach’s little joke.`; }
      if (bottle) {
        L.queue('coastBottle', { who: L.pick(['Alice', 'Jenny', 'Susan', 'Mandy', 'Karen', 'Lucy']), addr: `${L.int(2, 40)} ${L.pick(['Ship Street', 'Quay Lane', 'Chapel Row', 'Fore Street'])}, Polgarrow`, year: L.int(1972, 1994), line: L.pick(['I have a pony called Toffee.', 'My brother is horrible.', 'We are on holiday and it is raining.', 'I want to be a vet.']) });
        text += ' The bottle has a letter in it.';
      }
      return text;
    },
  });
  def('coastWash', {
    place: 'cove', sec: 'The shore', icon: '🌊', title: 'See what the gale brought in', time: 1,
    desc: 'Something big came ashore in the night. It will not be there long.',
    show: (L) => !!L.s.coast.wash && L.s.coast.wash.t === L.s.t && !L.s.coast.wash.got,
    run(L) {
      const s = L.s, c = s.coast, k = c.wash.k;
      c.wash.got = 1; c.cove++;
      L.joy(2);
      if (k === 'oranges') { L.joy(3); L.karma(1); return 'A whole crate of oranges, from Seville by the stencil. You give most of them away along the front, and the town smells of marmalade for a week.'; }
      if (k === 'timber') { L.cash(250); s.n.earned += 250; return 'A baulk of good oak, twelve feet long. Jess Dobbs gives you $250 for it and says she has plans.'; }
      if (k === 'barrel') { L.cash(180); L.karma(1); return 'A barrel, sound, with something sloshing in it. The Receiver of Wreck’s man takes it, and your name, and later sends $180 for your trouble.'; }
      if (k === 'boots') return 'Forty-one wellington boots, all of them left feet. You take one, on principle.';
      if (k === 'net') { L.karma(3); L.joy(2); return 'A tangle of lost net, and a young seal caught in it, very cross. It takes an hour and your penknife. It does not thank you.'; }
      const id = k === 'figurehead' ? 'figurehead' : L.anyCurio(['sea']);
      const got = L.gotCurio(id);
      return k === 'figurehead' ? 'Face down in the sand, with weed for hair: a ship’s figurehead, a woman with her arms crossed, looking unimpressed. It takes four of you to carry her up the beach.' : `In among the weed: ${got.a}. Mr Pym would want to see that.`;
    },
  });
  def('coastPools', {
    place: 'cove', sec: 'The shore', icon: '🦀', title: 'Go rock-pooling', per: 1,
    desc: (L) => `Low tide, a bucket and a lot of patience. Good for Smarts and the mood${L.kids().some((k) => k.age >= 3 && k.age <= 12) ? ', and children love it' : ''}.`,
    why: (L) => (L.s.wx === 'storm' ? 'The sea is right over the rocks today.' : null),
    run(L) {
      const s = L.s, c = s.coast, q = L.season, got = [];
      c.cove++;
      const pool = Object.entries(POOLS).filter(([, k]) => !k.when || k.when.includes(q)).map(([id, k]) => [id, k.w]);
      for (let i = 0; i < 2; i++) {
        const id = weighed(L, pool), k = POOLS[id];
        if (!c.pools[id]) L.say(k.icon, `New in your coast book: ${k.name}`, 'good');
        c.pools[id] = (c.pools[id] || 0) + 1;
        if (!got.includes(id)) got.push(id);
      }
      L.gain('smarts', 1); L.joy(3);
      const kids = L.kids().filter((k) => k.age >= 3 && k.age <= 12);
      for (const k of kids) L.bond(k, 4);
      let text = `${L.pick(['Flat on your front on the rocks, nose to the water.', 'You lift weed, turn stones, and put every one of them back.', 'An hour of peering, and the pool peers back.'])} You find ${listOf(got.map((id) => aThing(POOLS[id])))}.`;
      if (got.includes('octopus')) text += ' It looks at you with great intelligence and some contempt, and pours itself into a crack.';
      if (kids.length) text += ` ${kids[0].name.split(' ')[0]} names ${got.length > 1 ? 'them all' : 'it'} and wants to take ${got.length > 1 ? 'them' : 'it'} home. You explain about the sea.`;
      return text;
    },
  });
  def('coastBookCove', { place: 'cove', sec: 'The shore', icon: '📗', title: 'Your coast book', desc: (L) => `${Object.keys(L.s.coast.pools).length + Object.keys(L.s.coast.strand).length} of ${Object.keys(POOLS).length + Object.keys(STRAND).length} things found on the shore.`, time: 0, open: 'coastBook' });

  // -- the sandcastle cup, every summer
  def('coastCastle', {
    place: 'cove', sec: 'The Sandcastle Cup', icon: '🏰', title: 'Enter the Sandcastle Cup', time: 1, cost: 10,
    desc: (L) => `The beach huts’ own contest, taken far more seriously than the Regatta’s. Build it by hand; Craft helps. A cup and ${money(200)}.${L.s.coast.castle.wins ? ` You have won it ${L.s.coast.castle.wins === 1 ? 'once' : `${L.s.coast.castle.wins} times`}.` : ''}`,
    show: (L) => L.season === 1,
    why: (L, x) => (x !== undefined && !(typeof x === 'number' && x >= 0 && x <= 1) ? 'Build what?' : L.s.coast.castle.last === L.year ? 'One entry a year. The judges remember faces.' : null),
    run(L, x) {
      const s = L.s, c = s.coast, q = x === undefined ? 0.5 : x, kids = L.kids().filter((k) => k.age >= 3 && k.age <= 12);
      c.castle.last = L.year; c.cove++;
      for (const k of kids) L.bond(k, 5);
      L.gain('craft', 1);
      const score = q * 60 + s.st.craft * 0.45 + (kids.length ? 5 : 0) + L.int(-10, 10), bar = 52 + Math.min(24, c.castle.wins * 6);
      const helped = kids.length ? ` ${kids[0].name.split(' ')[0]} did the moat, and will tell anyone.` : '';
      if (score >= bar) {
        c.castle.wins++; L.cash(200); s.n.earned += 200; L.fame(0.5); L.joy(7);
        if (c.castle.wins === 1) L.note('Won the Sandcastle Cup at Smugglers’ Cove.');
        return `${L.pick(['Four towers, a keep, a drawbridge that works for nearly a minute.', 'A model of St Brigid’s, roof and all, which is more than the real one has.', 'A sea serpent forty feet long, coiled round the beach huts.'])} The judges confer, which they never do. First prize: the cup and ${money(200)}.${helped}`;
      }
      L.joy(2);
      return `${L.pick(['A fine castle, beaten by a retired engineer with a spirit level.', 'The judges like it. They like the one next to it more.', 'Your east tower goes at the first wave, in front of everyone.'])}${helped}`;
    },
  });

  // -- the lifeboat
  def('coastJoin', {
    place: 'cove', sec: 'The lifeboat station', icon: '🛟', title: (L) => (L.s.coast.lb && L.s.coast.lb.left != null ? 'Ask to rejoin the lifeboat crew' : 'Volunteer for the lifeboat crew'),
    desc: 'Training first. Then, when the pagers go, you go, whatever the weather. No pay. Good for Fitness and for your name.', time: 1,
    show: (L) => !L.coastOnBooks() && !(L.s.coast.lb && L.s.coast.lb.done != null),
    why: (L) => {
      const s = L.s, lb = s.coast.lb;
      if (s.age > 55) return 'Captain Quinn takes nobody new over fifty-five.';
      if (lb && lb.left != null && s.t - lb.left < 8) return 'Quinn does not take people back in a hurry.';
      return s.st.fitness < 25 ? 'Needs Fitness 25. Quinn watches you get your breath back on the slipway, and says nothing.' : null;
    },
    run(L) {
      const s = L.s, c = s.coast, back = !!c.lb;
      c.cove++;
      if (back) { c.lb.left = null; c.lb.act = s.t; L.coastStand(-10); return '“Back, are you,” says Quinn. It is not a question, and it is not quite a welcome.'; }
      c.lb = { at: s.t, train: 0, rank: 0, stand: 15, calls: 0, saved: 0, medal: 0, bigs: 0, miss: 0, log: [], act: s.t, left: null, done: null };
      L.note('Volunteered for the Starling Bay lifeboat.');
      return 'Captain Quinn looks you up and down for a long moment. “Tuesday,” she says. “Seven. Bring a towel.”';
    },
  });
  def('coastTrain', {
    place: 'cove', sec: 'The lifeboat station', icon: '⚓', time: 1, per: 1,
    title: (L) => (L.s.coast.lb.rank ? 'Exercise with the crew' : `Train with the crew (${L.s.coast.lb.train} of ${TRAINING})`),
    desc: (L) => (L.s.coast.lb.rank ? 'Keeps you sharp, and Quinn notices who turns up. Good for Fitness.' : `Knots, radio, first aid, and getting wet on purpose. ${TRAINING} sessions and you can go out on a shout. Good for Fitness.`),
    show: (L) => L.coastOnBooks(),
    run(L) {
      const s = L.s, lb = s.coast.lb, sea = s.job && s.job.c === 'sea';
      lb.train++; lb.act = s.t; s.coast.cove++;
      L.gain('fitness', 1.6); L.gain('smarts', 0.6); L.hp(1);
      // (Turning up only takes you so far with Quinn: the rest is done at sea.)
      if (lb.stand < 60) lb.stand = Math.min(60, lb.stand + (sea ? 6 : 4));
      if (!lb.rank && lb.train >= TRAINING) {
        lb.rank = 1;
        L.note('Passed out as crew on the Starling Bay lifeboat.', 'big');
        L.say('🛟', 'You are lifeboat crew', 'promo');
        return `Your last night of training: a capsize drill in the dark, in November water. Afterwards Quinn hands you a pager. “Keep it on you,” she says. “Always.”${sea ? ' Your skipper gives you the morning off.' : ''}`;
      }
      return L.pick(['Man-overboard drill, with you as the man.', 'Two hours of knots in the boathouse while the rain hammers on the roof.', 'Out round the Head and back, flat out, with Quinn timing it and saying nothing.', 'First aid on a dummy called Gerald, who has died eleven times this year.', 'Radio drill. You say “over” at the wrong moment, every time.']);
    },
  });
  def('coastStation', { place: 'cove', sec: 'The lifeboat station', icon: '🚤', title: 'The lifeboat station', desc: (L) => (L.coastOnBooks() ? `${LB_RANKS[L.s.coast.lb.rank]}. ${L.coastStandWord()}.` : 'The boat, the crew, and the board of every shout since 1871.'), time: 0, open: 'coastLifeboat' });
  def('coastQuit', {
    icon: '🚪', title: 'Step down from the crew', time: 0,
    why: (L) => (L.coastOnBooks() ? null : 'You are not on the crew.'),
    run(L) { const lb = L.s.coast.lb; lb.left = L.s.t; L.note('Stepped down from the lifeboat crew.'); return 'You hand back the pager. Quinn puts it in a drawer and closes the drawer, gently.'; },
  });

  // ---- the Merrow’s trail, around the town -------------------------------------------------

  def('coastPint', {
    place: 'pub', sec: 'The Merrow', icon: '🍺', title: 'Buy old Marlow a pint', time: 1, cost: 8, per: 1,
    desc: (L) => (L.s.coast.m.pints ? `He is telling you the story of the Merrow, an evening at a time (${L.s.coast.m.pints} of 3).` : 'He is by the fire, and he knows about the Merrow.'),
    show: (L) => L.coastOn() && L.s.coast.m.clues.marlow == null,
    why: (L) => ((L.s.f.marlow || 0) < 1 ? 'Marlow does not talk about the Merrow to strangers. Get to know him at the harbour first.' : L.season !== 3 ? 'Marlow tells the old stories in winter, by the fire. The rest of the year he talks about the weather.' : null),
    run(L) {
      const m = L.s.coast.m, k = CARGO[m.cargo];
      m.pints++; L.joy(2); L.gain('charm', 0.5);
      if (m.pints === 1) return `“The Merrow,” says Marlow, and drinks a third of his pint before he goes on. “${m.from} for ${m.to}, ${L.coastDate()}. ${cap(k.name)} aboard, and every soul in the Bay knew it, which is the first thing wrong with the story.” He says he will tell you the rest another night.`;
      if (m.pints === 2) return `“Three came ashore,” says Marlow. “The mate, ${m.mate}. The cook, who drank himself to death inside the year. And a boy, ${m.boy}, fourteen. My grandad knew the boy when he was an old man, and the boy told him things he never told the inquest.” He looks at his empty glass until you take the hint.`;
      L.coastGot('marlow');
      return `${MARLOW[m.who.marlow][SITES[m.ans][m.who.marlow]]} Marlow stares into the fire. “That is all I know. All anybody knows, now.”`;
    },
  });
  def('coastArchive', {
    place: 'library', sec: 'The Merrow', icon: '🗄️', title: 'Search the town archives', time: 2, per: 1,
    desc: (L) => `Boxes of the town’s papers, in no order at all. ${L.s.coast.m.arch} of 8 gone through.`,
    show: (L) => L.coastOn() && (L.s.coast.m.clues.paper == null || L.s.coast.m.clues.archive == null),
    why: (L) => (L.s.coast.reads < 3 && L.s.st.smarts < 50 ? 'Miss Achterberg keeps the archives for readers she knows. Read in the reading room a few times first.' : null),
    run(L) {
      const m = L.s.coast.m;
      m.arch = Math.min(8, m.arch + 1 + (L.chance(L.checkOdds('smarts', 60) - 0.3) ? 1 : 0));
      L.gain('smarts', 1.2);
      let text = L.pick(['Miss Achterberg shushes you, though you have said nothing at all.', 'Box after box of parish accounts, and a pressed flower in 1888.', 'There is a romantic novel under Miss Achterberg’s blotter. You say nothing. She sees you say nothing.', 'Dust, mostly, and a lovely letter about drains.']);
      if (m.arch >= 3 && m.clues.paper == null) { L.coastGot('paper'); text += ` And then, in a box marked GAZETTE, bound volumes: the week of the wreck. The owners’ men searched ${siteSaid(m.searched[0])} and ${siteSaid(m.searched[1])}, and found nothing. You copy out the names of the survivors.`; }
      if (m.arch >= 8 && m.clues.archive == null) { L.coastGot('archive'); text += ` At the bottom of the last box: the coroner’s papers on the inquest. The boy ${m.boy} said ${INQUEST[m.who.archive][SITES[m.ans][m.who.archive]]}`; }
      return text;
    },
  });
  def('coastRegister', {
    place: 'church', sec: 'The Merrow', icon: '📜', title: 'Look through the burial register', time: 1, cost: 20, per: 1,
    desc: 'The Reverend Hollis will bring it out for a donation to the roof.',
    show: (L) => L.coastOn() && L.s.coast.m.clues.register == null,
    why: (L) => (L.s.coast.m.clues.paper == null ? 'Three hundred years of burials in six different hands. You would need a name and a date to start from.' : null),
    run(L) {
      const m = L.s.coast.m;
      L.coastGot('register'); L.karma(1);
      return `The Reverend Hollis finds you the year and leaves you with a cup of tea, ${L.pick(['apologising for the bucket under the drip', 'talking about her bees on the way out', 'saying she will pray you find whatever it is'])}. ${m.year + 6}: “${m.mate}, late mate of the brig Merrow, found drowned below the Head.” In the margin, in the sexton’s smaller hand: “He told me in drink, God rest him, that ${SEXTON[m.who.register][SITES[m.ans][m.who.register]]}.”`;
    },
  });
  def('coastChart', {
    place: 'highstreet', sec: 'Pym’s Curios', icon: '🗺️', title: 'The old chart in Mr Pym’s window', time: 0,
    cost: (L) => (L.s.coast.m && L.s.coast.m.chart ? L.s.coast.m.chart.ask : 0),
    desc: 'A sea chart of Gorse Head, much folded. It will not be in the window for long.',
    show: (L) => L.coastHunting() && !!L.s.coast.m.chart && L.s.coast.m.chart.t === L.s.t && L.s.coast.m.clues.chart == null,
    why: (L) => (L.pymShut() ? 'Mr Pym is not at home to you.' : null),
    run(L) {
      L.coastGot('chart');
      return `Mr Pym rolls it up in last week’s Gazette. “It came in a sea chest from a house clearance,” he says. “I had a feeling about it.” ${L.coastClue('chart').text}`;
    },
  });
  def('coastQuinn', {
    place: 'harbour', sec: 'The Merrow', icon: '📘', title: 'Ask Captain Quinn about the old tides', time: 0, per: 1,
    desc: 'She keeps the harbour’s old tide tables in a cupboard nobody else may open.',
    show: (L) => L.coastHunting() && L.s.coast.m.clues.quinn == null,
    why: (L) => (L.coastTrusted() ? null : L.s.coast.lb && L.coastCrew() ? 'Quinn has not made up her mind about you yet.' : 'Captain Quinn keeps the old tide tables for her own crew, and you are not it.'),
    run(L) {
      const m = L.s.coast.m;
      L.coastGot('quinn');
      return `Quinn takes a book down from the top of the cupboard without being asked twice: the harbour’s tide tables for ${m.year}, foxed and swollen. She opens it at ${m.month} and turns it round to face you. In the margin, in faded pencil: “${QUINN[m.who.quinn][SITES[m.ans][m.who.quinn]]}” “Not mine,” says Quinn. That is all she says.`;
    },
  });
  def('coastMuseum', {
    place: 'library', sec: 'The Merrow', icon: '🏛️', title: 'Visit the Merrow Room', time: 1, per: 1,
    desc: 'Your name over the door, and the Merrow’s treasure under glass.',
    show: (L) => !!L.s.coast.m && L.s.coast.m.end === 'museum',
    run(L) { L.joy(4); return L.pick(['A school party is being made to look at it. A small boy asks if you are the one. You say you are.', 'You stand at the glass for a while. Miss Achterberg allows it.', 'Somebody has left flowers by the case, for the crew. You add a few of your own.']); },
  });

  // -- digging, and ruling places out (from the clue board)
  def('coastCross', {
    icon: '✏️', title: 'Rule it out, or back in', time: 0,
    why: (L, x) => (!SITES[x] ? 'Which?' : L.coastHunting() ? null : 'Not now.'),
    run(L, x) { const m = L.s.coast.m; if (m.x[x]) { delete m.x[x]; return `You rub out the line through ${siteSaid(x)}.`; } m.x[x] = 1; return `You put a line through ${siteSaid(x)}.`; },
  });
  def('coastDig', {
    icon: '⛏️', time: 2, title: (L, x) => (SITES[x] ? `${L.coastDigHow(x) === 'dive' ? 'Dive' : 'Dig'} at ${siteSaid(x)}` : 'Dig'),
    cost: (L, x) => (SITES[x] ? L.coastDigCost(x) : 0),
    why(L, x) {
      const s = L.s, m = s.coast.m, k = SITES[x];
      if (!k) return 'Dig where?';
      if (!m || m.on == null) return 'You have no reason to dig there.';
      if (m.found != null) return 'The Merrow has given up her secret.';
      if (m.dug[x] != null) return 'You have dug there already. Nothing.';
      if (m.rival === x) return 'Darren Pike dug it over for his podcast. Nothing there.';
      if (L.coastClues() < 3) return 'Nobody will give you leave to dig on a story. Follow up three leads first.';
      const n = L.coastDigWait();
      if (n) return `The council will not give you another permit for ${n} more season${n > 1 ? 's' : ''}.`;
      if (k.water === 'tide' && L.season % 2) return 'Only the great ebbs of spring and autumn uncover it.';
      if (k.water === 'sea') {
        if (L.season === 3) return 'Nobody dives off the Head in winter.';
        if (['storm', 'fog', 'snow'].includes(s.wx)) return 'Not in this weather.';
        if (s.st.fitness < 30) return 'You would need Fitness 30 to dive it.';
      }
      if (x === 'grave' && L.coastClues() < 4) return 'The Reverend Hollis will not have a grave opened on less than four good reasons.';
      return null;
    },
    run(L, x) {
      const s = L.s, m = s.coast.m, k = SITES[x], how = L.coastDigHow(x), cargo = CARGO[m.cargo];
      m.dug[x] = s.t; m.digAt = s.t;
      if (how === 'dive' && L.chance((1 - L.checkOdds('fitness', 40)) * 0.6)) L.hp(-8, 'a dive gone wrong');
      if (how === 'tide' && L.chance(0.12)) L.hp(-5, 'the cold sea');
      if (x === m.ans) {
        m.found = s.t; delete m.x[x];
        L.joy(10);
        L.note(`Found the treasure of the Merrow at ${siteSaid(x)}.`, 'big');
        L.coastNews(cargo.icon, `Merrow ${cargo.short} found after two hundred years`, `${s.name} has found ${cargo.name}, lost with the brig Merrow on the Mare’s Teeth in ${m.year}, at ${siteSaid(x)}. “I read the clues,” ${L.coastHe()} told the Gazette. Old Marlow, asked for a comment, bought a round.`, true);
        L.queue('coastHoard');
        return { dive: `On the third dive, under the kelp at ${siteSaid(x)}, your hand finds a corner too square to be rock. Then another.`, tide: `With the sea already turning, your spade goes through the sand at ${siteSaid(x)} and strikes wood. Iron-bound wood.`, dig: `Four feet down at ${siteSaid(x)}, the spade rings on iron.`, grave: 'The coffin is far too heavy, and there is no sailor in it.' }[how];
      }
      m.x[x] = 1;
      L.joy(-4);
      const junk = L.chance(0.15) ? L.gotCurio(L.anyCurio(['sea', 'coin'])).a : L.pick(JUNK);
      if (how === 'grave') {
        L.karma(-6);
        L.coastNews('⛪', 'Grave opened in treasure hunt', `A grave at St Brigid’s was opened last week at the request of ${s.name}, who is looking for the Merrow’s ${cargo.short}. It contained a sailor. The Reverend Hollis has asked for prayers, and for people to stop asking her about it.`, true);
        return 'The grave is opened with the Reverend Hollis praying very quietly beside it. There is nobody in it but a sailor of the Merrow, who is put back with an apology and a new stone. The town talks about nothing else for a month.';
      }
      L.coastNews('🕳️', 'Hole of the week', `${s.name} has been ${how === 'dive' ? 'diving' : 'digging'} at ${siteSaid(x)} for the Merrow’s ${cargo.short}, and found ${junk}. “It is a process,” ${L.coastHe()} said.`);
      return { dive: `Two days of diving at ${siteSaid(x)} in water the colour of cold tea. You bring up ${junk}. The Merrow’s ${cargo.short} is not there.`, tide: `You dig at ${siteSaid(x)} for the two hours the sea allows, and then it takes the hole back. ${cap(junk)}, and nothing else.`, dig: `A permit, two hired men and a day of digging at ${siteSaid(x)}. You find ${junk}, and the men find the pub.` }[how];
    },
  });

  // ---- cards -------------------------------------------------------------------------------

  addEvents([
    {
      id: 'coastLegend', w: 0, icon: '⚓', title: 'The Merrow', log: false,
      ok: (L) => !!L.s.coast.m && L.s.coast.m.on == null,
      text: (L) => { const m = L.s.coast.m, k = CARGO[m.cargo]; return `Everybody in the Bay knows the story, and everybody tells it differently. The brig Merrow, ${m.from} for ${m.to}, struck the Mare’s Teeth on the night of ${L.coastDate()} with ${k.name} aboard. Three of her ${['nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'][m.crew - 9] || m.crew} came ashore. The ${k.short} never did, or so they swore at the inquest. People have been looking ever since.`; },
      opts: [
        { t: 'Start a notebook', run(L) { const m = L.s.coast.m; m.on = L.s.t; L.note('Started to wonder about the brig Merrow, and what she was carrying.', 'big'); return 'You buy a notebook at the newsagent and write MERROW on the front. Then, feeling foolish, you write it again, smaller, on the inside. (It is on Gorse Head, by the stone, whenever you want it.)'; } },
        { t: 'Leave the dead in peace', run() { return 'You touch the stone, for luck or for them, and walk on.'; } },
      ],
    },
    {
      id: 'coastShout', w: 0, icon: '🛟', title: 'The pagers go',
      ok: (L, x) => L.coastCrew() && !!SHOUTS[x],
      text: (L, x) => SHOUTS[x].text,
      opts: [
        { t: (L, x) => SHOUTS[x].bold[0], odds: (L, x) => L.coastShoutOdds(x, true), run: (L, x, win) => L.coastShouted(x, 'bold', win) },
        { t: (L, x) => SHOUTS[x].safe[0], odds: (L, x) => L.coastShoutOdds(x, false), run: (L, x, win) => L.coastShouted(x, 'safe', win) },
        { t: 'You cannot get away this time', run: (L, x) => L.coastShouted(x, 'miss') },
      ],
    },
    {
      id: 'coastMedal', w: 0, icon: '🎖️', title: 'For gallantry',
      ok: (L) => !!L.s.coast.lb && L.s.coast.lb.medal < 2,
      text: (L) => `A letter from the lifeboat institution, on very thick paper. For your part in the rescue off Gorse Head you are to be given its ${L.s.coast.lb.medal ? 'silver' : 'bronze'} medal for gallantry. Captain Quinn has had one for thirty years, and has never once mentioned it.`,
      opts: [
        { t: 'Go up to the city to receive it', run(L) { const lb = L.s.coast.lb; lb.medal++; L.s.time = Math.max(0, L.s.time - 2); L.fame(4); L.joy(10); L.karma(4); L.note(`Given the lifeboat institution’s ${lb.medal > 1 ? 'silver' : 'bronze'} medal for gallantry.`, 'big'); L.coastNews('🎖️', 'Medal for Bay lifeboat crew', `${L.s.name} of the Starling Bay lifeboat has been given the ${lb.medal > 1 ? 'silver' : 'bronze'} medal for gallantry. Captain Quinn, asked what she thought, said “Good.”`, true); return 'A hall full of chandeliers, and a duchess who pins it on crooked. Quinn comes too, in a hat nobody knew she owned.'; } },
        { t: 'Ask them to put it in the post', run(L) { const lb = L.s.coast.lb; lb.medal++; L.fame(1); L.karma(6); L.joy(6); L.note(`Given the lifeboat institution’s ${lb.medal > 1 ? 'silver' : 'bronze'} medal for gallantry.`, 'big'); L.coastNews('🎖️', 'Medal for Bay lifeboat crew', `${L.s.name} of the Starling Bay lifeboat has been given the ${lb.medal > 1 ? 'silver' : 'bronze'} medal for gallantry, and asked for it to be posted. Captain Quinn approves.`); return 'It comes in a padded envelope, which the postman signs for himself. Quinn nods at you on the slipway, as if you had done something right twice.'; } },
      ],
    },
    {
      id: 'coastCutOff', w: 0, icon: '🌊', title: 'Cut off',
      text: 'The tide has come round the point while you were inside. The mouth of the cave is a churn of white, and the ledge you are standing on is the highest dry thing there is.',
      opts: [
        { t: 'Wait on the ledge to be rescued', run: (L) => L.coastRescued('wait') },
        { t: 'Swim for it', check: ['fitness', 60], run(L, x, win) { if (win) { L.hp(-5, 'the cold sea'); L.joy(-1); return 'You come out on the sand blue and laughing, and tell nobody, ever.'; } L.hp(-14, 'the cold sea'); return L.coastRescued('swim'); } },
        { t: 'Climb the cliff', check: ['fitness', 50], run(L, x, win) { if (win) { L.hp(-3, 'a fall'); L.gain('fitness', 1); return 'Hand over hand up sixty feet of rock and gull. At the top a man walking his dog asks if you have lost something.'; } L.hp(-16, 'a fall'); return L.coastRescued('climb'); } },
      ],
    },
    {
      id: 'coastHoard', w: 0, icon: '⚓', title: 'The Merrow',
      ok: (L) => !!L.s.coast.m && L.s.coast.m.found != null && !L.s.coast.m.end,
      text: (L) => { const m = L.s.coast.m, k = CARGO[m.cargo]; return `${cap(k.what)}. ${cap(k.name)}, lost with the Merrow on the Mare’s Teeth in ${m.year}, is in your hands, and worth something like ${money(k.worth)}. The Receiver of Wreck has been told. The rest of the town will know by morning. What happens to it now is up to you.`; },
      opts: [
        { t: 'Sell it to the highest bidder', run: (L) => L.coastEnd('keep') },
        { t: 'Give it to the town museum', run: (L) => L.coastEnd('museum') },
        { t: 'Share it with the town', run: (L) => L.coastEnd('town') },
      ],
    },
    {
      id: 'coastClaim', w: 0, icon: '✉️', title: 'A solicitor’s letter',
      ok: (L) => !!L.s.coast.m && L.s.coast.m.end === 'keep' && !L.s.coast.m.claimed,
      text: (L) => { const m = L.s.coast.m; return `A Mrs Rosalind ${m.owner}-Hughes, great-great-great-granddaughter of the man who owned the Merrow, says that ${CARGO[m.cargo].name} was never yours to sell. Her solicitor uses the word “conversion” eleven times.`; },
      opts: [
        { t: 'Settle: pay her a fifth of what it fetched', run(L) { const m = L.s.coast.m, n = round10(CARGO[m.cargo].worth * 0.2); m.claimed = 1; L.cash(-n); L.karma(3); return `${money(n)}, and a letter from her that is almost warm. The Gull & Anchor thinks better of you.`; } },
        { t: 'Fight it in court', check: ['smarts', 55], run(L, x, win) { const m = L.s.coast.m; m.claimed = 1; if (win) { L.joy(4); L.fame(1); return 'The judge finds that two hundred years is a long time to leave a thing lying about. The claim is thrown out.'; } const n = round10(CARGO[m.cargo].worth * 0.35) + 6000; L.cash(-n); L.joy(-8); return `The judge finds for Mrs ${m.owner}-Hughes, with costs. ${money(n)}, all told.`; } },
        { t: 'Ask her to tea', check: ['charm', 50], run(L, x, win) { const m = L.s.coast.m; m.claimed = 1; if (win) { L.karma(5); L.joy(5); return 'She only wanted to be asked. You show her the photographs and give her the letter that was in the box, and she drops the claim before the cake.'; } const n = round10(CARGO[m.cargo].worth * 0.25); L.cash(-n); L.joy(-4); return `She takes the tea, and then she takes ${money(n)}. Her solicitor sends a card at Christmas.`; } },
      ],
    },
    {
      id: 'coastTwitch', w: 0, icon: '🔭', title: 'Twitchers',
      text: (L, x) => `Word of your ${(BIRDS[x] || BIRDS.hoopoe).low || (BIRDS[x] || BIRDS.hoopoe).name.toLowerCase()} gets out. By dawn there are four hundred people on Gorse Head with telescopes on tripods, a man selling bacon rolls, and Tom Windle at his gate, looking at them all.`,
      opts: [
        { t: 'Show them where you saw it', run(L) { L.fame(2); L.gain('charm', 1); L.joy(4); return 'You are photographed pointing at a bush. It is on the front of a magazine you did not know existed.'; } },
        { t: 'Charge them for parking in the lane', run(L) { const n = 10 * L.int(30, 60); L.cash(n); L.karma(-2); return `${money(n)} in a bucket by lunchtime. Tom Windle wants half for the use of his verge, and gets a third.`; } },
        { t: 'Say nothing, and let the bird be', run(L) { L.karma(2); L.joy(2); return 'The crowd finds it anyway, and so it leaves. But you saw it first, in peace, and that was the best of it.'; } },
      ],
    },
    {
      id: 'coastBottle', w: 0, icon: '🍾', title: 'A message in a bottle',
      text: (L, x) => `Inside, rolled tight and only a little damp: “If you find this please write to ${x.who} at ${x.addr}. I am nine. ${x.line}” The date at the top is ${x.year}.`,
      opts: [
        { t: 'Write to the address', check: ['charm', 30], run(L, x, win) { if (win) { L.joy(6); L.karma(1); return `A month later, a letter back. ${x.who} is a grandmother now, and cried at the breakfast table. She sends a photograph of the beach she threw it from.`; } L.joy(1); return 'Your letter comes back marked NOT KNOWN AT THIS ADDRESS. You keep the bottle anyway.'; } },
        { t: 'Keep it on the mantelpiece', run(L) { L.joy(3); return 'It sits between the clock and a photograph, and people ask about it, and you tell them.'; } },
        { t: 'Add a note of your own, and throw it back', run(L) { L.joy(2); L.karma(1); return 'You add a line, cork it, and throw it as far as you can. It comes back in on the next wave. You throw it again.'; } },
      ],
    },
    // -- chance cards
    {
      id: 'coastWreck', w: 5, icon: '📦', title: 'Wreck on the beach',
      when: (L) => L.s.wx === 'storm' && L.s.coast.cove > 0,
      text: 'A container ship lost part of her deck cargo in the gale. Smugglers’ Cove is covered in boxes of brand-new trainers, and half the town is already down there with carrier bags.',
      opts: [
        { t: 'Fill a bag', run(L) { if (L.crime(0.12, 1, 'a carrier bag of trainers off the beach')) return 'A constable with a notebook is taking names at the top of the slipway. Yours is one of them.'; L.cash(300); return 'You sell them at the car boot sale for $300, to people who were also on the beach.'; } },
        { t: 'Help the coastguard stack it all up', run(L) { L.karma(4); L.gain('fitness', 1); L.s.time = Math.max(0, L.s.time - 1); return 'A day of carrying boxes for the Receiver of Wreck. A man from the shipping company shakes your hand and gives you a pair, legally.'; } },
        { t: 'Take one pair, in your size', run(L) { L.karma(-1); L.joy(3); return 'They are both left feet. You keep them anyway, as a lesson.'; } },
      ],
    },
    {
      id: 'coastSeal', w: 4, icon: '🦭', title: 'A seal pup',
      when: (L) => L.season >= 2 && L.s.coast.cove > 0,
      text: 'A grey seal pup alone on the sand at the cove, white and enormous-eyed, and a ring of people with telephones creeping closer.',
      opts: [
        { t: 'Rope off the beach and sit with it until the rescue comes', run(L) { L.karma(4); L.joy(4); L.s.time = Math.max(0, L.s.time - 1); return 'Four hours on a cold beach explaining, politely, to everyone, why not. Its mother comes back at dusk.'; } },
        { t: 'Tell everybody to back off', check: ['charm', 40], run(L, x, win) { if (win) { L.karma(2); L.joy(2); return 'They do. The pup goes to sleep, which is all it wanted.'; } L.joy(-2); return 'A man tells you it is a free country. The pup, disgusted, goes back into the sea.'; } },
        { t: 'Leave it to nature', run() { return 'Nature, in the shape of its mother, turns up in the evening and takes it away.'; } },
      ],
    },
    {
      id: 'coastRival', w: 6, once: true, icon: '🎙️', title: 'A man with a metal detector',
      when: (L) => L.coastHunting() && L.coastClues() >= 2 && !L.s.coast.m.rival,
      ctx: (L) => L.coastRivalSite(),
      text: 'A man in a waxed jacket has been asking about the Merrow in the Gull & Anchor. His name is Darren Pike. He has a metal detector, a podcast, and a sponsor that makes energy drinks.',
      opts: [
        { t: 'Compare notes with him', run(L, x) { const m = L.s.coast.m; m.rival = x; m.x[x] = 1; L.karma(1); L.joy(1); return `He listens to half of what you say and decides it is at ${siteSaid(x)}. He digs there for a week, live, and finds a ring pull. Well: now you know it is not there.`; } },
        { t: 'Send him somewhere useless', run(L, x) { const m = L.s.coast.m; m.rival = x; m.x[x] = 1; L.karma(-1); L.joy(3); return `You tell him, in strict confidence, about ${siteSaid(x)}. He digs it over for a week and finds a ring pull, so it was useless after all, and now you know.`; } },
        { t: 'Have nothing to do with him', run(L, x) { const m = L.s.coast.m; m.rival = x; m.x[x] = 1; L.coastNews('🎙️', 'Podcaster finds ring pull', `Treasure hunter Darren Pike has spent a week digging at ${siteSaid(x)} for the Merrow’s lost cargo, and found a ring pull. “The journey continues,” he said.`); return `He digs at ${siteSaid(x)} anyway, for a week, with a camera on a stick. The Gazette prints a photograph of him holding up a ring pull. It is not there, then.`; } },
      ],
    },
    {
      id: 'coastDay', w: 5, icon: '🚤', title: 'Lifeboat Day',
      when: (L) => L.season === 1 && L.coastOnBooks(),
      text: 'Lifeboat Day at the cove: the boat out on the slipway for children to climb on, a raffle, a cake stall, and a dunk tank that somebody from the crew has to sit in.',
      opts: [
        { t: 'Sit in the dunk tank', run(L) { L.joy(4); L.karma(2); L.coastStand(2); return 'Four hundred throws, eighty-one of them good. The station makes $1,900, and you will never be properly dry again.'; } },
        { t: 'Run the raffle', check: ['charm', 45], run(L, x, win) { if (win) { L.karma(2); L.coastStand(4); L.gain('charm', 1); return 'You sell every ticket in the book, and then a second book. Quinn says “good”, which, for her, is a speech.'; } L.joy(-1); return 'You sell the same ticket to three people, and the first prize goes to the vicar, twice.'; } },
        { t: 'Buy a strip of raffle tickets', cost: 50, run(L) { L.karma(1); L.joy(2); return L.pick(['You win a bottle of whisky, a tin of shortbread and a voucher for a haircut you will never use.', 'You win nothing. The tombola gives you a bottle of bath salts out of pity.', 'You win the cake. The whole crew comes round to help eat it.']); } },
      ],
    },
  ]);

  // Rescued from the ledge: a fine, the lifeboat, and the Gazette.
  Life.prototype.coastRescued = function coastRescued(how) {
    const s = this.s, c = s.coast, crew = this.coastCrew(), He = this.coastHe() === 'she' ? 'She' : 'He';
    c.caves.cut++;
    this.cash(-250); this.joy(-6);
    if (crew) this.coastStand(-8);
    this.note(`Cut off by the tide in Hob’s Hole, and brought off by the lifeboat. Fined $250.`);
    this.coastNews('🛟', how === 'climb' ? 'Cliff rescue at Gorse Head' : 'Caver rescued from Hob’s Hole', `${s.name}, ${s.age}, ${how === 'climb' ? 'was brought down off the cliff below Gorse Head by the coastguard after a climb that went wrong' : how === 'swim' ? 'was pulled out of the sea at the mouth of Hob’s Hole after trying to swim out of the cave' : 'spent four hours on a ledge in Hob’s Hole before being taken off by the lifeboat'}. “There is a sign,” said Captain Quinn. It was her whole statement. ${He} has been fined $250 by the council for ignoring it.`, true);
    const pre = how === 'wait' ? 'Four hours on a wet ledge, singing to keep warm. Then a searchlight, and the lifeboat nosing into the cave mouth.' : how === 'swim' ? 'Halfway out the cold takes the strength from your arms, and the lifeboat picks you out of the water like a sock.' : 'Twenty feet up, the rock comes away in your hand. The cliff team brings you the rest of the way, on a rope, in front of everyone.';
    return `${pre} ${crew ? 'It is your own crew who come for you. Quinn says nothing, all the way home.' : 'Captain Quinn says nothing, all the way home.'} The council fines you $250, and the Gazette has the story.`;
  };

  // ---- trophies ----------------------------------------------------------------------------

  const all = (book, got) => Object.keys(book).every((id) => got && got[id]);
  Object.assign(TROPHIES, {
    coastTwitcher: { name: 'Twitcher', icon: '🔭', desc: 'See every bird in the coast book.', test: (L) => !!L.s.coast && all(BIRDS, L.s.coast.birds) },
    coastComber: { name: 'Beachcomber', icon: '🐚', desc: 'Find everything in the rock pools and on the strandline.', test: (L) => !!L.s.coast && all(POOLS, L.s.coast.pools) && all(STRAND, L.s.coast.strand) },
    coastCaver: { name: 'Lantern and tide', icon: '🕯️', desc: 'Come out of the caves with everything that was in them.', test: (L) => !!L.s.coast && L.s.coast.caves.best >= 0.97 },
    coastCastle: { name: 'King of the castle', icon: '🪣', desc: 'Win the Sandcastle Cup at Smugglers’ Cove.', test: (L) => !!L.s.coast && L.s.coast.castle.wins >= 1 },
    coastShout: { name: 'On the shout', icon: '🛟', desc: 'Go out with the lifeboat ten times.', test: (L) => !!L.s.coast && !!L.s.coast.lb && L.s.coast.lb.calls >= 10 },
    coastMedal: { name: 'For gallantry', icon: '🎖️', desc: 'Win a lifeboat medal.', test: (L) => !!L.s.coast && !!L.s.coast.lb && L.s.coast.lb.medal >= 1 },
    coastMerrow: { name: 'X marks the spot', icon: '⚓', desc: 'Find what the Merrow was carrying.', test: (L) => !!L.s.coast && !!L.s.coast.m && L.s.coast.m.found != null },
    coastShared: { name: 'Finders, sharers', icon: '🤝', desc: 'Give the Merrow’s treasure to the museum, or share it with the town.', test: (L) => !!L.s.coast && !!L.s.coast.m && (L.s.coast.m.end === 'museum' || L.s.coast.m.end === 'town') },
  });
}

// Which places still fit everything a set of clues says (for the checks,
// and for anyone who wants to be sure a mystery can be solved).
export function fits(m, keys) {
  return Object.keys(SITES).filter((id) => keys.every((key) => {
    if (key === 'paper') return !m.searched.includes(id);
    const attr = m.who[key];
    return SITES[id][attr] === SITES[m.ans][attr];
  }));
}
