// New in Town: Starling Moor, the third map. Beyond Windle Farm the road
// climbs out of the old town onto the moor: Haverleigh Hall and the
// Askwiths, Blackrake Quarry, Fennick Water and the village drowned under
// it, the Gossips (a ring of standing stones), Hollowell Wood, the Askwith
// Observatory, Curlew Camp, Sallow Halt and its viaduct, and the village of
// Moor End.
//
// Getting there is a trip: the first thing done on the moor each season
// takes a block of time more, unless you drive (or ride a bicycle and are
// fit for the hill). Snow shuts the moor road to cars, fog can lose you for
// an hour, and a hot summer can set the heather alight.
//
// What there is to work towards, over years:
//   the walks: ten named walks, each walked once for the record;
//   finds: fossils from the quarry and old things from the moor;
//   the star log: twelve constellations, joined up by hand at the observatory, and a comet once in a life;
//   the Askwiths: favour at the Hall, a story in five chapters, a gun in the syndicate, gifts, and the Hall's future;
//   the quarry: from labourer to foreman;
//   Fennick: the drowned village, and what became of its bells and of Agnes Dyer;
//   the Curlew Award: bronze, silver and gold, for you while you are young, and for your children.
// The cards are in moor-tales.js, the games played by hand in moor-games.js,
// the screens in moor-ui.js. Everything is kept in s.moor.

import { TROPHIES, PLACES, money } from './data.js';
import { DEEDS } from './soul.js'; // (what the moor says about who you are: the traits in soul.js grow from it)
import { moorTales } from './moor-tales.js';

// ---- the places ------------------------------------------------------------------------------

export const MOOR_PLACES = ['observatory', 'stones', 'quarry', 'reservoir', 'camp', 'wood', 'halt', 'village', 'hall'];

// ---- the people of the moor (they keep their ages, as the townsfolk do) -----------------------

export const MOOR_FOLK = {
  kit: {
    name: 'Kit Askwith', call: 'Kit', sex: 'f', age: 44, place: 'hall', look: { skin: 0, hair: 2, top: 4, style: 1, beard: false },
    blurb: 'Runs Haverleigh Hall, its leaks, its debts and its Land Rover, which is held together with baler twine. Brisk, kind and broke.',
    up: ['Up a ladder in the long gallery with a bucket.', 'Selling cream teas to a coach party and smiling through it.', 'Counting pheasants and bills, in that order.', 'Wrapped in three jumpers, writing to the bank.'],
  },
  dot: {
    name: 'Dot Henshaw', call: 'Dot', sex: 'f', age: 56, place: 'quarry', look: { skin: 3, hair: 0, top: 6, style: 0, beard: false },
    blurb: 'Foreman at Blackrake. Six foot in her boots, swears like a poet, and keeps budgerigars, whom she talks to more kindly than to anybody.',
    up: ['Blasting on Thursday. She has told everybody twice, and the budgies three times.', 'Shouting at a dumper truck, which is shouting back.', 'Doing the quarry’s books in pencil, licking it.', 'Gritting the haul road herself, at six in the morning, singing.'],
  },
  lamb: {
    name: 'Dr Hester Lamb', call: 'Dr Lamb', sex: 'f', age: 74, place: 'observatory', look: { skin: 1, hair: 4, top: 1, style: 5, beard: false },
    blurb: 'The astronomer at the Askwith Observatory. She has named her three telescopes after her three husbands, and prefers the telescopes.',
    up: ['Polishing Gerald, the big refractor, with a chamois.', 'Asleep in a deckchair at noon, after a clear night.', 'Writing to the Bulletin about a smudge that might be a comet.', 'Up all night under the dome, in a balaclava, happy.'],
  },
  abel: {
    name: 'Abel Ruddock', call: 'Abel', sex: 'm', age: 69, place: 'wood', look: { skin: 2, hair: 3, top: 3, style: 0, beard: true },
    blurb: 'The charcoal burner in Hollowell Wood. Says about four words a week and knows every mushroom in the wood by its first name.',
    up: ['Cutting coppice and stacking it to season.', 'Minding the kiln through the night, smoking a pipe that is never lit.', 'Out before dawn after ceps, and back with a basket he will not show you.', 'Mending his hut roof with a sheet of tin from somewhere.'],
  },
  nance: {
    name: 'Nance Dyer', call: 'Nance', sex: 'f', age: 66, place: 'village', look: { skin: 1, hair: 5, top: 2, style: 2, beard: false },
    blurb: 'Postmistress of Moor End, keeper of the gossip and of a shoebox of photographs of Fennick, where her family came from before the water.',
    up: ['Selling stamps, string and the news, in that order.', 'Running the tombola at the fête with a rod of iron.', 'Sorting the post and reading the postcards, as is her right.', 'Keeping the post office open through the snow, for anybody who needs a warm.'],
  },
  barn: {
    name: 'Barnaby Cole', call: 'Barnaby', sex: 'm', age: 71, place: 'stones', look: { skin: 0, hair: 1, top: 5, style: 4, beard: true },
    blurb: 'A retired dentist, and Chief Shadow of the Order of the Long Shadow, who meet at the Gossips. He dowses for everything, including his car keys.',
    up: ['Measuring the shadows of the stones with a tape, very seriously.', 'Leading the Order round the ring at dawn, in a cloak over his anorak.', 'Dowsing the car park for his reading glasses.', 'Giving a talk in the Drovers on ley lines, to three people and a dog.'],
  },
};
export const MOOR_FOLK_IDS = Object.keys(MOOR_FOLK);
// The Askwiths at the Hall who are only met in the story.
export const ASKWITHS = {
  lady: { name: 'Lady Honoria Askwith', sex: 'f', age: 88, look: { skin: 0, hair: 4, top: 2, style: 2, beard: false } },
  hugo: { name: 'Hugo Askwith', sex: 'm', age: 47, look: { skin: 0, hair: 2, top: 0, style: 0, beard: false } },
};
export const WARM_WORDS = [[80, 'Like family'], [55, 'A good friend'], [30, 'A friend'], [12, 'Friendly'], [0, 'A nodding acquaintance']];

// ---- the walks -------------------------------------------------------------------------------

// fit: the Fitness it wants. kit: what you need from the post office. only: the seasons it can be
// walked in. not: weather it cannot. time: blocks (and the trip up, as ever).
export const WALKS = {
  ring: { name: 'Round the Gossips', icon: '🪨', from: 'stones', miles: 3, fit: 0, kit: [], blurb: 'Three miles of sheep track round the stones and back. A walk to start with.', said: ['Round the stones and out along the ridge. The sheep watch you go, and watch you come back, and say nothing about it.', 'A lark goes up from under your feet and keeps going up.', 'You count the stones on the way round, and again on the way back, and get a different number. Everybody does.'] },
  water: { name: 'Round Fennick Water', icon: '💧', from: 'reservoir', miles: 6, fit: 15, kit: [], blurb: 'Six miles of shore path, over the dam and back through the plantation.', said: ['Over the dam, along the shore and back through the pines. A heron stands in the shallows the whole way round, as if waiting for you to finish.', 'The water is flat as a plate. Somebody in a dinghy is not getting anywhere, very contentedly.', 'You stop on the dam to look down at the water and think about the village under it.'] },
  line: { name: 'The old line and Sallow viaduct', icon: '🚂', from: 'halt', miles: 5, fit: 15, kit: [], blurb: 'Along the old railway, over the viaduct a hundred feet above the gill, and back by the stream.', said: ['Across the viaduct with the gill a hundred feet below. You do not look down, and then you do.', 'Along the old line between the cuttings, ferns on both sides, nobody else at all.', 'A steam special goes by below the path in a cloud of its own, and everybody on it waves.'] },
  wood: { name: 'Hollowell Wood and the falls', icon: '🌳', from: 'wood', miles: 4, fit: 20, kit: [], blurb: 'Under the old oaks, down to the falls and up the other side.', said: ['Down through the oaks to the falls, where the spray hangs in the air like a held breath.', 'You lose the path twice and find a better one.', 'The wood is so quiet you can hear a leaf land.'], spring: 'Bluebells, the whole floor of the wood blue, and the smell of it.' },
  rim: { name: 'Blackrake quarry rim', icon: '⛏️', from: 'quarry', miles: 4, fit: 25, kit: [], not: ['fog', 'storm'], blurb: 'Round the edge of the quarry, with the fence on one side and the drop on the other.', said: ['Round the rim with a hundred feet of nothing on your left. The dumper trucks below look like toys.', 'You watch a peregrine leave the quarry face and go through a flock of pigeons like a thrown stone.', 'The flooded old pit is a perfect blue from up here. It looks lovely. It is not.'] },
  edge: { name: 'Along Raven Edge', icon: '🪶', from: 'hall', miles: 7, fit: 35, kit: ['boots'], blurb: 'The gritstone escarpment above Haverleigh, with the whole moor below it.', said: ['Along the Edge with the wind trying to have your hat. The Hall below looks like a dropped wedding cake.', 'Two ravens go by upside down, for fun. You did not know they did that.', 'You eat your sandwiches on the trig point with the whole moor laid out like a map.'] },
  moss: { name: 'Across Black Moss', icon: '🌫️', from: 'camp', miles: 8, fit: 35, kit: ['map'], not: ['wet'], blurb: 'Eight miles across the bog by the old flagstone causeway. Keep to the stones.', said: ['Flagstone to flagstone across the bog, with the cotton grass nodding either side and the peat black under it.', 'You put a foot off the causeway once, and the moss takes your boot to the knee and gives it back reluctantly.', 'Miles of nothing but bog and sky and the call of a curlew.'] },
  beacon: { name: 'Up to Hob’s Beacon', icon: '🔥', from: 'observatory', miles: 9, fit: 45, kit: ['map', 'boots'], not: ['snow'], blurb: 'The highest point on the moor, where they lit the beacon for the Armada and every coronation since.', said: ['Up and up to the beacon, where the wind takes your breath and gives it back with interest. You can see the sea.', 'At the top a man is having a flask of tea in a deckchair he has carried up. He offers you a cup.', 'You touch the trig point, as you must, and look at four counties.'] },
  lantern: { name: 'The Lantern Walk', icon: '🏮', from: 'observatory', miles: 4, fit: 20, kit: [], only: [3], blurb: 'In winter, with Dr Lamb and a dozen lanterns, out to the stones and back by the stars. Cocoa provided.', said: ['Out across the dark moor with lanterns, Dr Lamb naming the stars as they come out. Cocoa at the stones.', 'Frost on the heather, Orion over the observatory, and a hot cocoa that tastes better than anything ever has.', 'Somebody’s lantern goes out and you all stand in the dark, and the sky is suddenly enormous.'] },
  round: { name: 'The Starling Round', icon: '🏅', from: 'village', miles: 24, fit: 60, kit: ['map', 'boots'], only: [1], time: 3, blurb: 'The whole moor in a day, every summit and the stones, twenty-four miles from the Drovers and back. Your name goes on the board in the pub.', said: ['Twenty-four miles, from first light to the last of it. The Drovers ring the bell when you come in, and the landlord chalks your name up on the board.', 'Every summit, the stones, the dam and back, in fourteen hours. You cannot feel your feet. The whole pub stands up.'] },
};
export const WALK_IDS = Object.keys(WALKS);
// Tom Windle's old drove road, if it is opened (see the drove cards in moor-tales.js): a walk, but not one for the record.
export const DROVE = { name: 'The old drove road', icon: '🐄', from: 'village', miles: 6, fit: 20, kit: [], blurb: 'Down through Windle land the way the drovers came, opened at last.', said: ['Down the old drove road between its walls, the way the cattle came to market three hundred years ago. Tom Windle’s cows watch you over the wall with suspicion.', 'Along the drove road, past the stile Tom put up with his own hands. It has a sign on it: PATH. He has underlined it.'] };

// ---- what turns up -------------------------------------------------------------------------

// r: how often (higher is commoner). where: the quarry (fossils) or the moor (walks, the wood).
// worth: what a spare fetches at the quarry's visitor hut. blast: only after a blasting day.
export const FINDS = {
  ammonite: { name: 'Ammonite', icon: '🐚', r: 10, where: 'quarry', worth: 20, said: 'a coiled ammonite, like a stone ram’s horn' },
  crinoid: { name: 'Crinoid', icon: '⭐', r: 10, where: 'quarry', worth: 15, said: 'crinoid stems, like a string of stone beads' },
  shell: { name: 'Brachiopod', icon: '🦪', r: 9, where: 'quarry', worth: 15, said: 'a little stone cockle, a brachiopod, ribbed and perfect' },
  coral: { name: 'Fossil coral', icon: '🪸', r: 5, where: 'quarry', worth: 40, said: 'a piece of fossil coral, from when all of this was a warm sea' },
  urchin: { name: 'Sea urchin', icon: '🔘', r: 4, where: 'quarry', worth: 50, said: 'a fossil sea urchin, what the old quarrymen called a shepherd’s crown' },
  fern: { name: 'Fern', icon: '🌿', r: 4, where: 'quarry', worth: 45, said: 'a fern frond pressed into the shale, every leaf of it' },
  fish: { name: 'Fossil fish', icon: '🐟', r: 2, where: 'quarry', worth: 120, said: 'a whole fossil fish, scales and all, mouth open in surprise' },
  trilobite: { name: 'Trilobite', icon: '🪲', r: 2, where: 'quarry', worth: 150, said: 'a trilobite, curled up like a woodlouse four hundred million years ago' },
  ichthy: { name: 'Ichthyosaur bone', icon: '🦴', r: 1, where: 'quarry', blast: true, worth: 300, said: 'an ichthyosaur’s backbone, a stone disc the size of a biscuit' },
  flint: { name: 'Flint arrowhead', icon: '🔺', r: 5, where: 'moor', worth: 60, said: 'a flint arrowhead, as sharp as the day it was knapped' },
  coin: { name: 'Roman coin', icon: '🪙', r: 2, where: 'moor', worth: 140, said: 'a Roman coin, worn nearly smooth, an emperor’s nose just showing' },
  badge: { name: 'Pilgrim’s badge', icon: '📛', r: 2, where: 'moor', worth: 110, said: 'a lead pilgrim’s badge, dropped on the old road to the abbey six hundred years ago' },
};
export const FIND_IDS = Object.keys(FINDS);

// ---- the stars -------------------------------------------------------------------------------

// q: the seasons it is well up in the evening sky. stars: where each star sits (0 to 100 across and
// down); lines: which are joined. bright: the one to name.
export const SKY = {
  plough: { name: 'The Plough', q: [0, 1, 2, 3], stars: [[8, 38], [24, 32], [38, 38], [50, 46], [54, 66], [76, 68], [80, 48]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]], said: 'Seven stars and a handle, the one everybody knows, pointing the way to the Pole Star.' },
  cassiopeia: { name: 'Cassiopeia', q: [0, 1, 2, 3], stars: [[8, 30], [28, 62], [48, 40], [68, 66], [90, 34]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]], said: 'A W, or an M, depending which way up you are. A queen in a chair, says Dr Lamb.' },
  orion: { name: 'Orion', q: [3], stars: [[28, 10], [70, 14], [40, 46], [50, 50], [60, 54], [30, 88], [72, 86]], lines: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]], said: 'The hunter, with his belt of three, striding over the observatory every winter.' },
  cygnus: { name: 'Cygnus', q: [1, 2], stars: [[50, 8], [50, 38], [50, 62], [50, 92], [16, 30], [84, 46]], lines: [[0, 1], [1, 2], [2, 3], [4, 1], [1, 5]], said: 'The swan, flying down the Milky Way with its neck out. Some call it the Northern Cross.' },
  lyra: { name: 'Lyra', q: [1, 2], stars: [[28, 10], [46, 34], [66, 38], [40, 68], [60, 74]], lines: [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4]], said: 'A little harp with Vega at the top, the brightest star of a summer night.' },
  leo: { name: 'Leo', q: [0], stars: [[16, 30], [26, 14], [42, 16], [46, 32], [40, 50], [74, 44], [88, 62]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [4, 6]], said: 'The lion of spring: a backwards question mark for his mane, and Regulus at his heart.' },
  taurus: { name: 'Taurus', q: [2, 3], stars: [[12, 18], [36, 44], [50, 60], [62, 46], [88, 20]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]], said: 'The bull’s face, a V of stars with Aldebaran glowing red in one eye.' },
  gemini: { name: 'Gemini', q: [0, 3], stars: [[28, 10], [34, 44], [40, 86], [60, 8], [64, 42], [72, 84]], lines: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3]], said: 'The twins, Castor and Pollux, holding hands at the top.' },
  pegasus: { name: 'Pegasus', q: [2], stars: [[18, 26], [62, 26], [62, 68], [18, 68], [88, 84]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4]], said: 'The great square of autumn, with the horse’s neck running off one corner.' },
  bootes: { name: 'Boötes', q: [0, 1], stars: [[50, 8], [34, 30], [66, 30], [36, 60], [64, 60], [50, 92]], lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]], said: 'The herdsman, a kite of stars with orange Arcturus at its tail.' },
  corona: { name: 'Corona Borealis', q: [1], stars: [[10, 36], [22, 58], [40, 70], [60, 70], [78, 58], [90, 36]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], said: 'The northern crown, a little arc of jewels. Dr Lamb says it is her favourite and will not say why.' },
  auriga: { name: 'Auriga', q: [3], stars: [[50, 8], [86, 34], [72, 80], [28, 80], [14, 34]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], said: 'The charioteer, a lopsided pentagon, with yellow Capella high overhead in winter.' },
};
export const SKY_IDS = Object.keys(SKY);

// ---- the Curlew Award --------------------------------------------------------------------------

export const AWARD = [
  { name: 'Bronze', icon: '🥉', train: 2, fit: 15, kit: [], route: 'two days and a night at Curlew Camp, with a map, a stove and somebody else’s tent' },
  { name: 'Silver', icon: '🥈', train: 3, fit: 25, kit: ['map'], route: 'three days across the moor by map and compass, two nights out' },
  { name: 'Gold', icon: '🥇', train: 4, fit: 35, kit: ['map', 'boots'], route: 'four days over the whole moor, wild camping, no help and no phones' },
];
export const AWARD_AGE = [13, 24];

// ---- Haverleigh Hall ---------------------------------------------------------------------------

// The Askwiths' story: each chapter wants this much favour, and a year after the one before.
export const HALL_NEED = [8, 22, 40, 60, 80];
export const HALL_TITLES = ['Buckets in the long gallery', 'Tea with the dowager', 'The Lady in Grey', 'The dowager’s last summer', 'The future of Haverleigh'];
export const HALL_WORDS = [[80, 'One of the family'], [60, 'A great friend of the house'], [40, 'Welcome at the back door'], [22, 'Known to the family'], [8, 'A familiar face'], [0, 'A visitor']];
// What it costs to keep a gun in the syndicate, a season.
export const SYND_FEE = 450;
export const STEWARD_PAY = 1200;
export const QUARRY_RANKS = ['Labourer', 'Driller', 'Shotfirer', 'Foreman'];
// Days worked (and what else) for each step up at the quarry.
export const QUARRY_UP = [null, { days: 8, fitness: 30 }, { days: 20, craft: 32, smarts: 28 }, { days: 40, dot: 55 }];
export const FOREMAN_PAY = 500;

// ---- Fennick -----------------------------------------------------------------------------------

// The drowned village's story, a clue at a time. where: how it is found.
export const CLUES = {
  nance: { name: 'Nance’s shoebox', icon: '🗃️', where: 'Get to know Nance Dyer at the Moor End post office.', text: 'Fennick was drowned in the spring of 1938, when the dam was finished. Two hundred people were moved out to the new houses at Moor End. One stayed: Agnes Dyer, nineteen, Nance’s great-aunt, who would not leave and was never seen again. Everybody said the water took her. The bells of St Oda’s were never seen again either.' },
  spire: { name: 'The empty tower', icon: '⛪', where: 'In a drought, walk down to the drowned village; or, in summer, dive to the spire from the sailing club’s boat (Fitness 45).', text: 'The tower of St Oda’s has no bells in it. The bell frame is there, and the bolts that held them were undone with a spanner and laid in a neat row on the beam. Nobody does that in a hurry, and water does not do it at all.' },
  register: { name: 'The register', icon: '📜', where: 'Ask Miss Achterberg at the library for the Fennick registers.', text: 'The last page of St Oda’s register, in the vicar’s hand: “Bells taken down for safe keeping, April 1938, by E.A. and others.” There is no burial for Agnes Dyer. There is, on the same page, a marriage, crossed out so hard the pen went through the paper.' },
  papers: { name: 'The Askwith papers', icon: '🗝️', where: 'At Haverleigh Hall, once the family trust you with its secrets (the third chapter of their story).', text: 'Sir Ralph Askwith sold the Fennick valley to the water board in 1937 and saved the Hall with the money. His younger son, Edmund, was cut off without a penny the next spring “for the theft of church property and for disgracing the name”. There is a photograph of Edmund in the drawer. He looks kind, and very angry.' },
  dowse: { name: 'The rods cross', icon: '🪄', where: 'Dowse with the Order at the stones, once you know the bells are missing and have a feel for it.', text: 'Barnaby’s rods swing shut over and over at the same place: the mouth of the old drift at Blackrake, bricked up since before the war. “Metal,” says Barnaby. “A great deal of it. Bronze, I should think.” He is never wrong about bronze, he says, only about keys.' },
  letter: { name: 'A letter from Manitoba', icon: '✉️', where: 'Word gets round, once you know enough. Somebody, a long way off, is listening.', text: 'Agnes did not drown. She and Edmund Askwith were married in secret, took the bells down with half the village to keep them from the water, hid them, and left for Canada the night the valley flooded, letting everybody think she had gone under rather than be followed. Her granddaughter wrote, sixty years too late for Agnes’s mother.' },
};
export const CLUE_IDS = Object.keys(CLUES);

// ---- small helpers -----------------------------------------------------------------------------

const m_ = (L) => L.s.moor;
const r10 = (n) => Math.round(n / 10) * 10;
const r100 = (n) => Math.round(n / 100) * 100;
const r1000 = (n) => Math.round(n / 1000) * 1000;
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
// What the moor's prices are scaled to: what you could lay your hands on, and what you are worth.
export const moorMeans = (L) => Math.max(0, Math.max(L.s.cash + L.s.bank, L.netWorth() * 0.6));
// Places the heather fire shuts, while it burns.
const FIRE_SHUT = new Set(['wood', 'stones']);

function blank() {
  return {
    up: -1, how: '', lost: 0, walks: {}, finds: {}, spare: {}, stars: {}, kit: {}, larder: 0, dowse: 0,
    folk: Object.fromEntries(MOOR_FOLK_IDS.map((id) => [id, -1])), seen: {}, f: {},
    hall: { f: 0, ch: 0, at: -99, seen: -99, gift: -99, given: 0, synd: null, shot: 0, end: null, share: 0, steward: null, lady: 0, hugo: 0, gallery: null, tea: null, loan: null },
    quarry: { days: 0, rank: 0, hurt: 0, ask: null }, blast: -1, dry: -1, fire: -1, comet: null, cometSeen: false, bulletin: false,
    drown: { on: null, clues: {}, end: null, letterAt: null },
    award: {}, fete: { wins: 0 }, cricket: { caps: 0, runs: 0, best: 0 }, drove: { st: 0, due: null, side: null },
    gifts: { scope: false, coll: null },
    n: { trips: 0, walks: 0, swims: 0, camps: 0, steam: 0, stars: 0, forage: 0, lostFound: 0, trout: 0, best: 0 },
  };
}

// ---- the rules ---------------------------------------------------------------------------------

export function install({ def, A, Life, clamp, val, hooks, addEvents }) {
  Object.assign(Life.prototype, {
    // ---- getting there ----
    // The bypass (annals.js), once it is built, makes the moor road an easier climb.
    moorBypass() { const sc = this.annalsScene ? this.annalsScene() : null; return !!(sc && sc.bypass); },
    // How you come up this season: 'car', 'bike', 'push' (a bicycle, pushed), 'foot', or 'snow' (on foot, whatever you have).
    moorHow() {
      const s = this.s, car = !!(s.items.car || s.items.sportscar);
      if (s.wx === 'snow') return car && this.moorBypass() ? 'car' : 'snow';
      if (car) return 'car';
      if (s.items.bike) return s.st.fitness >= 40 || this.moorBypass() ? 'bike' : 'push';
      return 'foot';
    },
    moorUp() { return this.s.moor.up === this.s.t; },
    // What the trip up costs this season, in blocks (nothing once you are up there).
    moorTrip() { if (this.moorUp()) return 0; const h = this.moorHow(); return h === 'car' || h === 'bike' ? 0 : h === 'snow' ? 2 : 1; },
    moorDry() { const d = this.s.moor.dry; return d >= 0 && (this.s.t === d || this.s.t === d + 1); },
    moorFire() { return this.s.moor.fire === this.s.t; },
    moorComet() { const c = this.s.moor.comet; return c != null && this.s.t >= c && this.s.t <= c + 2; },
    moorBlast() { return this.s.moor.blast === this.s.t; },

    // ---- the people ----
    moorMet(id) { return this.s.moor.folk[id] >= 0; },
    moorWarm(id, d) {
      const f = this.s.moor.folk;
      if (f[id] < 0) { f[id] = 0; this.say(PLACES[MOOR_FOLK[id].place].icon, `You have met ${MOOR_FOLK[id].name}`, 'good'); }
      f[id] = clamp(f[id] + (d > 0 ? d * Math.max(0.4, 1.1 - f[id] / 100) : d), 0, 100);
      this.s.moor.seen[id] = this.s.t;
    },
    moorWarmWord(id) { const v = this.s.moor.folk[id]; return WARM_WORDS.find(([n]) => v >= n)[1]; },

    // ---- the walks ----
    moorWalksDone() { return WALK_IDS.filter((id) => this.s.moor.walks[id]).length; },
    moorWalk(id) { return id === 'drove' ? DROVE : WALKS[id]; },
    moorWalkWhy(id) {
      const s = this.s, m = s.moor, w = this.moorWalk(id);
      if (!w || (id === 'drove' && m.drove.side !== 'open')) return 'There is no such walk.';
      if (w.only && !w.only.includes(this.season)) return id === 'lantern' ? 'The Lantern Walk is in winter, when the nights are long.' : 'That one is walked in summer, when the days are long enough for it.';
      if (w.not && w.not.includes(s.wx)) return s.wx === 'fog' ? 'Not in fog, not along there.' : s.wx === 'wet' ? 'Not after this rain: the bog would have you.' : s.wx === 'snow' ? 'Not in snow. Mountain rescue have enough to do.' : 'Not in this wind.';
      if ((id === 'moss' || id === 'edge' || id === 'beacon') && this.moorFire()) return 'The moor is burning out that way.';
      for (const k of w.kit) if (!m.kit[k]) return k === 'map' ? 'You would want a map and compass for that. The post office at Moor End sells them.' : 'Not in those shoes. The post office at Moor End sells walking boots.';
      if (s.st.fitness < w.fit) return `That wants Fitness ${w.fit}.`;
      if (s.age >= 80 && w.fit >= 35) return 'Not on those knees, not any more.';
      return null;
    },

    // ---- finds ----
    moorFindsN() { return Object.keys(this.s.moor.finds).length; },
    moorSpares() { return Object.entries(this.s.moor.spare).reduce((a, [id, n]) => a + n * FINDS[id].worth, 0); },
    moorFind(where, rich = 0) {
      const m = this.s.moor, blast = this.moorBlast();
      const pool = FIND_IDS.filter((id) => FINDS[id].where === where && (!FINDS[id].blast || blast));
      // (Smarts and a good day turn up the rarer ones a little more often.)
      const w = pool.map((id) => FINDS[id].r ** (1 - Math.min(0.5, this.s.st.smarts / 250 + rich)));
      let r = this.rnd() * w.reduce((a, b) => a + b, 0), id = pool[0];
      for (let i = 0; i < pool.length; i++) { id = pool[i]; r -= w[i]; if (r < 0) break; }
      const k = FINDS[id], fresh = !m.finds[id];
      if (fresh) { m.finds[id] = this.s.age; this.note(`Found ${k.said}${where === 'quarry' ? ' at Blackrake' : ' on the moor'}.`); this.say(k.icon, `A find: ${k.name}`, 'good'); }
      else m.spare[id] = (m.spare[id] || 0) + 1;
      return { id, k, fresh };
    },

    // ---- the stars ----
    moorStarsN() { return Object.keys(this.s.moor.stars).length; },
    // The constellation the next good night at the telescope is spent on: one not yet logged that is up this season.
    moorStarNext() {
      const q = this.season, m = this.s.moor, up = SKY_IDS.filter((id) => SKY[id].q.includes(q));
      return up.find((id) => m.stars[id] == null) || up[this.s.t % up.length];
    },
    moorStarEase() { const s = this.s, m = s.moor; return clamp(s.st.smarts / 110 + Math.max(0, m.folk.lamb) / 400 + (m.gifts.scope ? 0.2 : 0), 0, 1); },

    // ---- the Hall ----
    moorHallWord() { return HALL_WORDS.find(([n]) => this.s.moor.hall.f >= n)[1]; },
    moorFavour(d) {
      const h = this.s.moor.hall;
      h.f = clamp(h.f + (d > 0 ? d * Math.max(0.45, 1.1 - h.f / 110) : d), 0, 100);
      h.seen = this.s.t;
      if (d > 0 && this.s.moor.folk.kit < 0 && h.f >= 4) this.moorWarm('kit', 1);
      if (this.s.moor.folk.kit >= 0) this.s.moor.folk.kit = Math.max(this.s.moor.folk.kit, Math.round(h.f));
    },
    // The next chapter of the Askwiths' story, if it is ready: the card for it.
    moorHallNext() {
      const s = this.s, h = s.moor.hall;
      if (h.ch >= 5 || h.f < HALL_NEED[h.ch] || s.t - h.at < 4 || s.gaol) return null;
      if (h.gallery === 'press') return null; // (barred from the house)
      return `moorHall${h.ch + 1}`;
    },
    moorHallDeal() {
      const card = this.moorHallNext();
      if (card && !this.s.pend.some((e) => e.id === card)) { this.queue(card); return ' Kit catches your sleeve on the way out. “Have you got a minute?”'; }
      return '';
    },
    // What a gift to the estate comes to: modest, generous, handsome.
    moorGiftCost(i) { const w = moorMeans(this); return [Math.max(250, r100(w * 0.01)), Math.max(1500, r100(w * 0.04)), Math.max(6000, r1000(w * 0.1))][i]; },
    moorSyndCost() { return Math.max(4000, r1000(moorMeans(this) * 0.012)); },
    moorShareCost() { return Math.max(120000, r1000(moorMeans(this) * 0.22)); },
    moorScopeCost() { return Math.max(10000, r1000(moorMeans(this) * 0.03)); },
    moorBellsCost() { return Math.max(3000, r100(moorMeans(this) * 0.025)); },

    // ---- the quarry ----
    moorQuarryPay() { const s = this.s, q = s.moor.quarry; return r10(450 + s.st.fitness * 7 + q.rank * 160 + (this.moorBlast() ? 150 : 0)); },
    moorQuarryNext() {
      const s = this.s, q = s.moor.quarry, up = QUARRY_UP[q.rank + 1];
      if (!up) return null;
      const need = [[`${up.days} days worked`, q.days >= up.days]];
      for (const k of ['fitness', 'craft', 'smarts']) if (up[k]) need.push([`${k[0].toUpperCase()}${k.slice(1)} ${up[k]}`, s.st[k] >= up[k]]);
      if (up.dot) need.push(['Dot’s trust', s.moor.folk.dot >= up.dot]);
      return { rank: QUARRY_RANKS[q.rank + 1], need, ok: need.every(([, ok]) => ok) };
    },

    // ---- Fennick ----
    moorClues() { return Object.keys(this.s.moor.drown.clues).length; },
    moorHasClue(id) { return this.s.moor.drown.clues[id] != null; },
    moorClue(id) {
      const s = this.s, d = s.moor.drown;
      if (d.clues[id] != null) return false;
      if (d.on == null) d.on = s.t;
      d.clues[id] = s.t;
      this.note(`Fennick: ${CLUES[id].name.toLowerCase()}.`);
      this.say(CLUES[id].icon, `Fennick: ${CLUES[id].name}`, 'good');
      if (this.moorClues() >= 3 && d.letterAt == null) d.letterAt = s.t + 4;
      return true;
    },
    // Whether the old drift at Blackrake can be opened: you know the bells are hidden there, or near enough.
    moorDriftReady() { const d = this.s.moor.drown; return d.end == null && d.clues.spire != null && (d.clues.dowse != null || (d.clues.register != null && d.clues.papers != null)); },

    // ---- the award ----
    // Who can go for it: you while you are young enough, and children and grandchildren of the age.
    moorAwardWho() {
      const s = this.s, out = [];
      if (s.age <= AWARD_AGE[1]) out.push({ key: 'me', name: 'You', fit: s.st.fitness, me: true });
      for (const p of s.people) if ((p.kind === 'child' || p.kind === 'grandchild') && p.age >= AWARD_AGE[0] && p.age <= AWARD_AGE[1]) out.push({ key: String(p.id), name: p.name.split(' ')[0], fit: p.st ? p.st.fitness : 30, p });
      return out;
    },
    moorAward(key) { const a = this.s.moor.award; if (!a[key]) a[key] = { lvl: 0, tr: 0, tt: -1, out: null, name: '' }; return a[key]; },
  });

  // ---- doing things on the moor ----

  // The first thing done on the moor each season: getting there, and what the weather does about it.
  function arrive(L) {
    const s = L.s, m = s.moor;
    if (m.up === s.t) return '';
    const how = L.moorHow(), first = !m.n.trips;
    m.up = s.t; m.how = how; m.n.trips++;
    let said = '';
    if (first) said = how === 'car' ? 'You drive up past Windle Farm, over the cattle grid, and the moor opens out in front of you like a held breath.' : 'The moor road climbs out past Windle Farm, through a gate in the wall, and then the whole moor opens up: heather, sky, and a curlew going up like a question.';
    else if (how === 'snow') said = L.pick(['Snow has shut the moor road at the cattle grid. You walk the rest, up to your knees, in other people’s footprints.', 'The road is under a drift. A snowplough has given up halfway and the driver is having his sandwiches. You walk on past him.', 'Snow to the tops of the walls. It takes you half a day to get up there, and it is worth it.']);
    else if (how === 'push') said = L.pick(['You push the bicycle up most of the moor road, and freewheel the last bit to save face.', 'The hill beats you and the bicycle both. You walk it up, and promise yourselves fitter days.']);
    // (In fog the moor loses people: a map, and knowing the walks, keep you on the road.)
    if (s.wx === 'fog' && how !== 'car') {
      const p = clampN(0.4 - (m.kit.map ? 0.18 : 0) - L.moorWalksDone() * 0.03, 0.05, 0.4);
      if (L.chance(p)) {
        m.lost++; s.time = Math.max(0, s.time - 1);
        said = L.pick(['Fog comes down on the moor like a lid. You are lost for an hour and come out of it by a wall you are sure you have seen before, which you have, three times.', 'You walk into the fog on the moor road and out of it at a sheepfold that is not on any map. It takes an hour to find the road again.', 'Fog. A shape looms up and turns out to be a standing stone that was not there yesterday. It was. You were not. An hour lost.']);
      }
    }
    return said;
  }
  // An action on the moor: the trip up comes on top of the time it takes, the first time each season.
  const mdef = (id, o) => {
    const base = o.time ?? 1;
    def(id, {
      ...o,
      time: (L, x, y) => { const b = val(base, L, x, y); return b > 0 ? b + L.moorTrip() : b; },
      why: (L, x, y) => (L.moorFire() && FIRE_SHUT.has(o.place) ? 'The heather is alight out there, and the fire brigade have the lane shut.' : o.why ? o.why(L, x, y) : null),
      run(L, x, y) {
        const pre = val(base, L, x, y) > 0 ? arrive(L) : '';
        const text = o.run(L, x, y) || '';
        return pre ? `${pre} ${text}` : text;
      },
    });
  };
  // A score from a game played by hand (or the middling one, when it was not).
  const scoreOf = (x) => (typeof x === 'number' && x >= 0 && x <= 1 ? x : 0.5);
  const badScore = (x) => x !== undefined && !(typeof x === 'number' && x >= 0 && x <= 1);
  // Your sweetheart, if they live with you, and the children young enough to come along.
  const party = (L) => { const p = L.partner(); return [...(p && p.live ? [p] : []), ...L.kids().filter((k) => k.age >= 3 && k.age <= 15)]; };

  // ---- Haverleigh Hall ----
  mdef('moorGardens', {
    place: 'hall', sec: 'Haverleigh Hall', icon: (L) => (L.season === 3 ? '🕯️' : '🌹'),
    title: (L) => (L.season === 3 ? 'Christmas at the Hall' : 'Walk round the gardens'),
    desc: (L) => (L.season === 3 ? 'The house by candlelight, with mulled wine in the hall. Good for the mood.' : 'Roses, a maze, a ha-ha and a peacock with a grudge. Good for the mood; the family notice who comes.'),
    cost: (L) => (L.season === 3 ? 25 : 15) * (L.s.moor.hall.end === 'hotel' ? 2 : 1), per: 1,
    run(L) {
      const s = L.s, h = s.moor.hall, q = L.season;
      L.joy(5 + (q === 1 ? 2 : 0)); L.hp(1);
      if (h.f < 20) L.moorFavour(1.6); else h.seen = s.t;
      const said = q === 3 ? L.pick(['Candles in every window and a choir in the hall. Kit Askwith is selling the mulled wine herself, in a paper crown.', 'The long gallery by candlelight, the portraits looking down their noses at the Christmas tree.', 'A carol in the great hall, mince pies, and a draught from somewhere that could take your ears off.'])
        : q === 0 ? L.pick(['The walled garden is all blossom and bees. A gardener tells you the names of things in Latin, kindly.', 'Tulips in rows like soldiers, and a peacock walking among them like a general.', 'You get lost in the maze and are found by a small boy, who is very good about it.'])
          : q === 1 ? L.pick(['The rose garden in full flower and the smell of it all the way to the gate.', 'A wedding on the lawn, not yours. You watch from behind a hedge and cry a bit anyway.', 'You sit on the ha-ha with an ice cream and watch the cows on the other side not fall in.'])
            : L.pick(['The beeches on the drive have gone the colour of marmalade.', 'The gardeners are raking leaves into heaps and the Askwith dogs are raking them out again.', 'Apple day in the walled garden: forty kinds, and you are given a bit of each.']);
      return said + L.moorHallDeal();
    },
  });
  // Played by hand: the dry-stone walling game (moor-games.js).
  mdef('moorEstate', {
    place: 'hall', sec: 'Haverleigh Hall', icon: '🪨', title: 'Work on the estate',
    desc: (L) => `${L.season >= 2 ? 'Walls to mend and beating for the shoot' : 'Walls to mend, hedges and hay'}, at the Askwiths’ rate, which is low. A good day raises your standing with the family. Craft and Fitness.`,
    time: 2, per: 1,
    why: (L, x) => (badScore(x) ? 'Mind how you go.' : L.s.age >= 72 ? 'Kit will not let you lift stones at your age. She gives you a cup of tea instead.' : null),
    run(L, x) {
      const s = L.s, sc = scoreOf(x), q = L.season, shoot = q >= 2;
      const pay = r10((220 + s.st.craft * 3 + s.st.fitness * 3 + (shoot ? 60 : 0)) * (0.6 + 0.6 * sc));
      L.cash(pay); s.n.earned += pay;
      L.gain('craft', 1.2 + sc); L.gain('fitness', 1);
      L.moorFavour(2 + sc * 3);
      if (shoot) s.moor.larder += 30;
      const wall = sc >= 0.75 ? 'The waller looks along your stretch of wall, all the way, and nods. That is all. It is a great deal.' : sc >= 0.4 ? 'A fair stretch of wall, standing, more or less straight.' : 'Your stretch of wall falls down at teatime, quite slowly, with a noise like an apology.';
      const day = shoot ? L.pick(['Then a day beating for the shoot, walking the woods in a line and shouting at pheasants. They pay you in cash and a brace of birds.', 'Then out with the beaters, a flag in your hand, rain down your neck. A pheasant goes up at your feet and nearly kills you with fright.']) : q === 0 ? 'Then a hedge to lay, the old way, with a billhook and a lot of blood.' : 'Then the hay, which has to come in before the rain, which it does, just.';
      return `${wall} ${day} ${money(pay)}.${L.moorHallDeal()}`;
    },
  });
  mdef('moorShoot', {
    place: 'hall', sec: 'Haverleigh Hall', icon: '🎯', title: 'A day with the syndicate',
    desc: 'Your gun on the Haverleigh shoot: tweed, a long lunch and the people who matter round here. Good for the mood and Charm.',
    time: 2, per: 1, show: (L) => L.s.moor.hall.synd != null,
    why: (L) => (L.season < 2 ? 'The shooting season runs through autumn and winter.' : null),
    run(L) {
      const s = L.s, h = s.moor.hall, good = L.chance(L.checkOdds('craft', 40));
      h.shot++;
      L.joy(6); L.gain('charm', 1.2); L.moorFavour(2);
      if (good) L.gain('craft', 0.6);
      const met = L.maybeMeet(0.12);
      return `${good ? L.pick(['A right and left on the second drive. The keeper raises an eyebrow, which is the most he has ever raised.', 'You shoot well all day and are asked to stand next to the colonel at lunch, which is either an honour or a punishment.']) : L.pick(['You miss everything all day, beautifully. Nobody minds: it is the lunch they come for.', 'Two birds all day, and a hat that was not yours. The hat’s owner is very decent about it.'])}${met ? ` At lunch you get talking to ${met.name}, who is in property.` : ''}${L.moorHallDeal()}`;
    },
  });
  def('moorHallBook', { place: 'hall', sec: 'Haverleigh Hall', icon: '🏰', title: 'The Askwiths', desc: 'Your standing with the family, their story so far, the syndicate, and gifts to the estate.', time: 0, open: 'moorHall' });
  // The family's papers: a clue to Fennick, once they trust you.
  mdef('moorPapers', {
    place: 'hall', sec: 'The muniment room', icon: '🗝️', title: 'Look through the family papers', desc: 'Kit has said you may, now. Two hundred years of Askwiths in tin boxes.',
    show: (L) => L.s.moor.drown.on != null && L.s.moor.hall.ch >= 3 && L.s.moor.hall.gallery !== 'press' && !L.moorHasClue('papers'),
    run(L) { L.gain('smarts', 1.5); L.moorClue('papers'); return 'Tin boxes, damp ledgers and a mouse. And then, in a folder marked 1937–8, the sale of the Fennick valley, and a letter cutting off a son.'; },
  });

  // ---- Blackrake Quarry ----
  mdef('moorQuarry', {
    place: 'quarry', sec: 'Blackrake Quarry', icon: '⛏️', title: 'Work a day at the quarry',
    desc: (L) => `Rough work, paid by Fitness: about ${money(L.moorQuarryPay())} a day${L.moorBlast() ? ', more on a blasting day' : ''}. You are ${QUARRY_RANKS[L.s.moor.quarry.rank].toLowerCase()} here. Mind your hands.`,
    time: 2, per: 2,
    why: (L) => (L.s.age >= 64 ? 'Dot will not have you on the face at your age. She says so with feeling.' : null),
    run(L) {
      const s = L.s, m = s.moor, q = m.quarry, blast = L.moorBlast(), pay = L.moorQuarryPay();
      L.cash(pay); s.n.earned += pay; q.days++;
      L.gain('fitness', 1.6); L.joy(-1);
      L.moorWarm('dot', 3);
      let said = blast ? L.pick(['The siren goes, everybody gets behind the wall, and the face comes down with a thump you feel in your teeth. Then the clearing up, all afternoon.', 'Blasting day. Dot counts down on a megaphone, the hill shrugs, and a hundred tons of stone slides down like a curtain.']) : L.pick(['Breaking stone, loading the crusher, and dust in every crease of you.', 'A day on the drill with ear defenders on, thinking about nothing, which is restful.', 'You shift stone all day. Dot calls you a useless article, which from Dot is warm.']);
      // (A day on the face can hurt; the fit less often, and a blasting day more.)
      if (L.chance(clampN(0.045 + (blast ? 0.035 : 0) - s.st.fitness / 2500 - q.rank * 0.006, 0.01, 0.1))) {
        q.hurt++; L.hp(-9, 'an accident at the quarry');
        said += ' ' + L.pick(['A stone turns under your hand and takes the skin off two fingers and the nail off a third.', 'You go over on your ankle on the scree and are carried down by two men and a budgerigar fancier.']);
      }
      if (L.chance(blast ? 0.32 : 0.14)) { const f = L.moorFind('quarry', blast ? 0.15 : 0); said += ` In the rubble: ${f.k.said}.${f.fresh ? '' : ' You have one already; it goes in the spares box.'}`; }
      const nx = L.moorQuarryNext();
      if (nx && nx.ok && s.t - (q.ask ?? -99) >= 4 && !s.pend.some((e) => e.id === 'moorRankUp')) L.queue('moorRankUp');
      return `${said} ${money(pay)}.`;
    },
  });
  mdef('moorFossil', {
    place: 'quarry', sec: 'Blackrake Quarry', icon: '🔨', title: 'Hunt fossils on the spoil heaps',
    desc: (L) => `Free, with Dot’s blessing and a hard hat. Best after rain, and best of all after a blasting day. ${L.moorFindsN()} of ${FIND_IDS.length} finds so far.`,
    per: 1,
    run(L) {
      const s = L.s, blast = L.moorBlast() || s.moor.blast === s.t - 1;
      L.gain('smarts', 0.8); L.joy(2);
      if (L.chance(clampN(0.42 + (blast ? 0.25 : 0) + (s.wx === 'wet' ? 0.1 : 0), 0, 0.85))) {
        const f = L.moorFind('quarry', blast ? 0.2 : 0);
        L.joy(f.fresh ? 4 : 1);
        return f.fresh ? L.pick([`You split a slab along its bedding with one tap, and there it is: ${f.k.said}.`, `Two hours turning over shale, and then, in the last stone you meant to look at, ${f.k.said}.`]) : `${f.k.said[0].toUpperCase()}${f.k.said.slice(1)}. Another one. It goes in the spares box.`;
      }
      return L.pick(['Shale, shale and more shale. A man with a better hammer finds something and will not show you.', 'You find a stone that looks exactly like a fossil and is a stone.', 'Nothing today, but you learn what to look for, which is the same as nothing, only slower.']);
    },
  });
  mdef('moorPit', {
    place: 'quarry', sec: 'Blackrake Quarry', icon: '🏊', title: 'Swim in the flooded pit', desc: 'The old pit: deep, blue, beautiful and colder than anything. Everybody is told not to. A thrill, if you live.',
    per: 1,
    why: (L) => (L.season !== 1 ? 'Not out of summer, unless you want your heart to stop.' : L.s.age >= 65 ? 'Not at your age. Not in that.' : null),
    run(L) {
      const s = L.s;
      s.moor.n.swims++;
      if (L.chance(clampN(0.12 - s.st.fitness / 900, 0.03, 0.12))) {
        if (L.chance(L.checkOdds('fitness', 40))) { L.joy(3); return 'Ten strokes out the cold grips your chest like a fist. You turn, and swim back through it, and lie on the warm rock shaking for an hour. Dot, finding you, says nothing at all, which is worse.'; }
        L.hp(-12, 'cold water'); L.joy(-4);
        return 'The cold takes your breath and then your legs. Dot Henshaw gets you out with a boat hook and a great deal of language, and sits with you in the hut under a blanket until you stop shaking. It is a long time before you go near water again.';
      }
      L.joy(9); L.gain('fitness', 1.6);
      return L.pick(['You jump. The cold is a kind of shouting. Then it is blue all the way down and the sky is very far away.', 'Out to the middle and back, the water so clear you can see the old crane on the bottom, forty feet down.', 'You float on your back in the middle of the pit with the quarry walls going up all round you like a cathedral.']);
    },
  });
  mdef('moorDrift', {
    place: 'quarry', sec: 'The old drift', icon: '🔦', title: 'Open up the old drift with Dot', desc: 'The bricked-up mouth of the old workings. If the bells of Fennick are anywhere, they are in there.',
    time: 2, show: (L) => L.moorDriftReady(),
    why: (L) => (L.s.moor.folk.dot < 15 ? 'Dot will not open old workings for somebody she hardly knows. Work at the quarry a while.' : null),
    run(L) { L.gain('fitness', 1); L.queue('moorBells'); return 'Dot brings a sledgehammer, two lamps and a flask. The bricks come out one by one, and a cold breath comes out of the dark behind them.'; },
  });

  // ---- Fennick Water ----
  mdef('moorTrout', {
    place: 'reservoir', sec: 'Fennick Water', icon: '🎣', title: 'Fly-fish for trout', desc: 'A day permit from the sailing hut, and your rod. What you catch feeds you.', cost: 20, per: 1,
    why: (L) => (!L.s.items.rod ? 'You would need a rod. The tackle shop on the High Street sells them.' : L.s.wx === 'storm' ? 'Not in a gale. The line goes everywhere but the water.' : L.season === 3 ? 'The trout season is closed for the winter.' : null),
    run(L) {
      const s = L.s, m = s.moor;
      L.gain('craft', 0.8); L.joy(3);
      const p = clampN(0.35 + s.st.craft / 220 + (s.wx === 'wet' || s.wx === 'fog' ? 0.1 : 0) - (s.wx === 'hot' ? 0.15 : 0), 0.1, 0.85);
      if (!L.chance(p)) return L.pick(['Not a touch all day. A heron down the bank does better than you, twice.', 'The trout rise all round your fly and none of them take it. You admire their judgement.']);
      const n = L.chance(0.3) ? 2 : 1, lb = Math.round((1 + L.rnd() * 2.5 + (L.chance(0.08) ? 3 : 0)) * 10) / 10;
      m.larder += 35 * n; m.n.trout += n; L.joy(3);
      const best = lb > m.n.best; if (best) m.n.best = lb;
      return `${n > 1 ? 'Two trout' : 'A trout'}, the best of ${lb} lb${best && m.n.trout > 1 ? ', your best yet' : ''}. ${L.pick(['Into the bag with dock leaves, and supper sorted.', 'Speckled like a thrush, and very much annoyed.', 'You thank it, as Abel says you should, and feel foolish and right.'])}`;
    },
  });
  mdef('moorResSwim', {
    place: 'reservoir', sec: 'Fennick Water', icon: '🏊', title: 'Swim in Fennick Water', desc: 'Cold, clean and very deep. Good for Fitness and the mood.', per: 1,
    why: (L) => (L.season === 3 ? 'The water is four degrees. The sailing club have put up a sign about it, and then another.' : L.s.wx === 'storm' ? 'Not with those waves.' : null),
    run(L) {
      const s = L.s;
      s.moor.n.swims++;
      L.gain('fitness', 2.2); L.joy(s.wx === 'hot' ? 9 : 6); L.hp(1);
      if (L.moorDry()) return 'The water is low and warm at the edges. Swimming out, you pass over the drowned lane to Fennick, the hedges standing up out of the water like grey hair.';
      return L.pick(['Out to the buoy and back. Somewhere under you is a whole village. You swim a little faster.', 'You swim across the evening, the water like silk and the sun going down behind the dam.', 'Cold enough to make you shout, and then glorious. A trout jumps beside you, offended.']);
    },
  });
  mdef('moorSpire', {
    place: 'reservoir', sec: 'Fennick', icon: '⛪',
    title: (L) => (L.moorDry() ? 'Walk down to the drowned village' : 'Dive to the spire from the club boat'),
    desc: (L) => (L.moorDry() ? 'The water is down so far that the street of Fennick is out in the air for the first time in years. Go now.' : 'In summer the sailing club will run you out to where the spire is, ten feet under. Fitness 45, and a cool head.'),
    time: 2,
    show: (L) => (L.moorDry() || (L.s.moor.drown.on != null && L.season === 1)) && !L.moorHasClue('spire'),
    why: (L) => (!L.moorDry() && L.s.st.fitness < 45 ? 'The club will not take you down without Fitness 45.' : null),
    run(L) {
      const s = L.s, d = s.moor.drown, start = d.on == null;
      L.moorClue('spire'); L.joy(6);
      if (start && !s.pend.some((e) => e.id === 'moorNance')) L.queue('moorNance');
      return L.moorDry() ? 'You walk down the old lane between drowned hedges, past doorsteps with no doors, to the church. The tower door is open. You climb, and look up at the bell frame, and there are no bells in it.'
        : 'Down through green water to the spire, and in at a louvre. The bell chamber is empty. In the torchlight the bolts that held the bells are laid in a row on the beam, neat as cutlery.';
    },
  });

  // ---- the Gossips ----
  mdef('moorStones', {
    place: 'stones', sec: 'The Gossips', icon: '🪨', title: 'Sit inside the circle', desc: 'Nineteen stones, and a quiet that is not quite empty. Good for the mood, more so if you like your own company.', per: 1,
    run(L) {
      const s = L.s, loner = L.soulHas && L.soulHas('loner'), church = L.soulHas && L.soulHas('churchgoer');
      s.moor.n.stones = (s.moor.n.stones || 0) + 1;
      L.joy(5 + (loner ? 3 : 0)); L.hp(1);
      if (L.season === 1 && s.moor.f.midY !== L.year && !s.pend.some((e) => e.id === 'moorMidsummer')) { s.moor.f.midY = L.year; L.queue('moorMidsummer'); }
      if (s.wx === 'fog') return 'In the fog the stones come and go like people at a party. You count them and get twenty. You count again and get nineteen, and decide to leave it at that.';
      if (church) return L.pick(['You sit against the tallest stone and say a prayer, out of habit, and feel it go somewhere. The Reverend Hollis would have views. You decide not to ask her.', 'The stones were old when St Brigid’s was new. You think about that, and about the people who stood here, and say the Lord’s Prayer for them, in case.']);
      return L.pick(['You sit with your back to a warm stone and the wind goes round the ring like somebody looking for something.', 'A hare sits in the middle of the circle, looks at you for a long time, and goes.', 'You lay your palm on the king stone. It is warm on a cold day. Barnaby says they all are. They are not.']);
    },
  });
  mdef('moorDowse', {
    place: 'stones', sec: 'The Gossips', icon: '🪄', title: 'Dowse with the Order of the Long Shadow',
    desc: (L) => `Barnaby Cole and his friends, two bent coat hangers each, and an open mind. ${L.s.moor.dowse >= 30 ? 'You have a feel for it now.' : 'You may have a feel for it, or not.'}`,
    per: 1, show: (L) => (L.s.moor.n.stones || 0) > 0 || L.s.moor.dowse > 0, // (Barnaby asks you along once he has seen you at the stones.)
    run(L) {
      const s = L.s, m = s.moor, was = m.dowse;
      m.dowse = Math.min(100, m.dowse + 7 + s.st.smarts / 25);
      L.moorWarm('barn', 4); L.joy(3);
      // What the rods find, once you can feel them.
      if (m.dowse >= 30 && m.drown.on != null && L.moorHasClue('spire') && !L.moorHasClue('dowse')) {
        L.moorClue('dowse');
        return 'You walk the moor with the Order all afternoon, thinking about bronze. At the mouth of the old drift at Blackrake the rods swing shut in your hands so hard they pinch. Barnaby’s do the same. He takes his hat off.';
      }
      if (m.dowse >= 20 && !m.f.trough && L.folk && s.folk && L.folk('windle').met != null) {
        m.f.trough = true;
        if (L.folkWarm) L.folkWarm('windle', 4);
        return 'Tom Windle’s top trough has run dry, and he says, with deep scorn, that you may as well try. The rods cross by the old thorn. He digs, scornfully. There is water at four feet. He says nothing at all, and sends round a dozen eggs.';
      }
      if (was < 30 && m.dowse >= 30) return 'The rods move in your hands, all on their own, over a buried pipe nobody knew was there. Barnaby is beside himself. You are not sure what you feel, except that you felt it.';
      return L.pick(['The Order walk the ring in single file with their coat hangers. Yours cross over a sheep, which Barnaby says counts.', 'Barnaby explains ley lines with a biscuit, a teaspoon and the sugar bowl. You follow most of it.', 'An afternoon walking very slowly in straight lines, which is more restful than it has any right to be.']);
    },
  });

  // ---- Hollowell Wood ----
  // Played by hand: the foraging game (moor-games.js). What is found goes in the larder.
  mdef('moorForage', {
    place: 'wood', sec: 'Hollowell Wood', icon: '🍄', title: 'Forage in the wood',
    desc: (L) => `${['Wild garlic and morels', 'Bilberries and chanterelles', 'Mushrooms, blackberries and sweet chestnuts', 'Not much but chestnuts and hope'][L.season]}: food for nothing, if you know the good from the deadly. It comes off the food bill at the end of the season.`,
    per: 1,
    why: (L, x) => (badScore(x) ? 'Mind how you go.' : null),
    run(L, x) {
      const s = L.s, m = s.moor, sc = scoreOf(x);
      m.n.forage++;
      if (m.folk.abel >= 0) L.moorWarm('abel', 1.5);
      L.gain('smarts', 0.8); L.joy(3);
      if (sc < 0.2 && x !== undefined) {
        L.sicken('a bad mushroom', 2); L.joy(-4);
        return 'Something in the basket was not what you thought it was. You are very ill for two days and very sorry for a good deal longer. Abel, when he hears, comes down to the town for the first time since 1990 to give you a lecture.';
      }
      const got = r10([90, 120, 160, 50][L.season] * (0.3 + sc));
      m.larder += got;
      return `${L.pick([['Wild garlic by the armful, the whole wood smelling of it, and three morels like little brains.', 'Nettle tops for soup, and a bag of wild garlic for everything else.'], ['Bilberries until your fingers are purple, and a clump of chanterelles like dropped apricots.', 'Wild strawberries the size of your little fingernail, and worth it.'], ['A basket of ceps, a hat full of blackberries and your pockets full of chestnuts.', 'Field mushrooms, puffballs and the last of the blackberries, before the devil spits on them.'], ['A pocketful of chestnuts and a bunch of holly. Winter in the wood is lean.', 'Chestnuts, rosehips for syrup, and a long walk.']][L.season])} About ${money(got)} of food for nothing.`;
    },
  });
  mdef('moorCharcoal', {
    place: 'wood', sec: 'Hollowell Wood', icon: '🔥', title: 'Help Abel at the charcoal kiln', desc: 'A day and a night minding the burn with Abel Ruddock. Craft, a little pay, and he may teach you the mushrooms.',
    time: 2, per: 1, show: (L) => L.s.moor.n.forage > 0 || L.s.moor.folk.abel >= 0, // (Abel lets you near the kiln once he has seen you in the wood.)
    run(L) {
      const s = L.s, first = s.moor.folk.abel < 0;
      L.moorWarm('abel', 5);
      const pay = 260;
      L.cash(pay); s.n.earned += pay; L.gain('craft', 2); L.hp(-1);
      if (first) return `A hut, a ring of earth smoking like a pudding, and an old man who looks at you for a full minute and hands you a shovel. That is Abel Ruddock. By the morning he has said eleven words to you, which you later learn is a record. ${money(pay)}.`;
      return `${L.pick(['All night by the kiln, closing the vents when the smoke goes blue. Abel shows you which mushroom is which, by pointing.', 'You cut and stack the coppice while the kiln breathes. At dawn Abel makes tea on the embers, and it is the best tea there has ever been.', s.wx === 'wet' ? 'Rain all night and the kiln sulking. Abel talks to it, quietly, and it comes round.' : 'The burn goes well. Abel says "Good", which is a speech.'])} ${money(pay)}.`;
    },
  });

  // ---- Curlew Camp ----
  mdef('moorCamp', {
    place: 'camp', sec: 'Curlew Camp', icon: '⛺', title: 'Camp out under the stars',
    desc: (L) => `A pitch for the night.${party(L).length ? ' Your family come too: good for all of you.' : ' Good for the mood.'}`, cost: 20, per: 1,
    why: (L) => (L.season === 3 ? 'The site is shut until Easter. The hostel is open, but it is not the same.' : L.s.wx === 'storm' ? 'Not in a gale, unless you want to see your tent go to Norway.' : null),
    run(L) {
      const s = L.s, who = party(L), kids = who.filter((p) => p.kind === 'child'), wet = s.wx === 'wet';
      s.moor.n.camps++;
      L.joy(wet ? 3 : 7); L.hp(wet ? -1 : 1);
      for (const p of who) L.bond(p, p.kind === 'child' ? 5 : 4);
      if (kids.length) return wet ? `Rain on the tent all night and ${kids.length > 1 ? 'the children' : kids[0].name.split(' ')[0]} delighted by every drop. Beans from the tin, cards by torchlight, and nobody sleeps.` : L.pick([`Marshmallows on the fire, owls, and ${kids.length > 1 ? 'the children' : kids[0].name.split(' ')[0]} asleep before the stars are all out. You stay up and count them.`, `${kids[0].name.split(' ')[0]} puts the tent up nearly by themselves and is unbearable about it all evening. Rightly.`]);
      if (who.length) return L.pick([`You and ${who[0].name.split(' ')[0]} in one sleeping bag meant for one, looking up through the tent flap at a sky full of stars.`, `Sausages burnt on a stove and eaten anyway, and ${who[0].name.split(' ')[0]} asleep on your shoulder by the fire.`]);
      return wet ? 'A damp night, a leaky tent and a sleeping bag that smells of somebody’s dog. Somehow still a good one.' : L.pick(['Just you, a tent and a lot of sky. A curlew calls in the dark and you lie and listen to it.', 'You cook on a little stove and eat out of the pan and feel like the first person ever to have done it.']);
    },
  });
  def('moorAwardBook', { place: 'camp', sec: 'The Curlew Award', icon: '🧭', title: 'The Curlew Award', desc: 'Bronze, silver and gold, for walkers between thirteen and twenty-four: training days, then an expedition.', time: 0, open: 'moorAward', show: (L) => L.moorAwardWho().length > 0 || Object.keys(L.s.moor.award).length > 0 });
  // Training for the award: x is 'me', or a child's id (as a string).
  mdef('moorTrain', {
    sec: 'The Curlew Award', icon: '🧭', title: (L, x) => (x === 'me' ? 'Train for the Curlew Award' : `Train with ${(L.moorAwardWho().find((w) => w.key === x) || { name: 'them' }).name}`),
    desc: 'A training day on the moor: map reading, pitching a tent in the wind, walking.',
    why: (L, x) => {
      const w = L.moorAwardWho().find((v) => v.key === x);
      if (!w) return 'Only for those between thirteen and twenty-four.';
      const a = L.s.moor.award[x], lv = a ? a.lvl : 0;
      if (lv >= 3) return 'Gold already. There is nothing higher, except mountains.';
      if (a && a.tt === L.s.t) return 'One training day a season is plenty.';
      if (a && a.out != null) return 'The expedition is already planned.';
      return null;
    },
    run(L, x) {
      const s = L.s, w = L.moorAwardWho().find((v) => v.key === x), a = L.moorAward(x), lv = AWARD[a.lvl];
      a.tt = s.t; a.tr++; a.name = w.name;
      L.gain('fitness', 1.2); L.joy(2);
      if (w.p) { L.bond(w.p, 4); if (w.p.st) w.p.st.fitness = Math.min(100, w.p.st.fitness + 1.5); }
      const ready = a.tr >= lv.train && w.fit + (w.p ? 0 : 0) >= lv.fit && lv.kit.every((k) => s.moor.kit[k]);
      if (ready) { a.out = s.t; L.queue('moorExped', x); }
      const who = w.me ? 'You' : w.name;
      const need = !ready && a.tr >= lv.train ? (w.fit < lv.fit ? ` ${who === 'You' ? 'You need' : `${who} needs`} more Fitness for the ${lv.name.toLowerCase()} expedition (${lv.fit}).` : ' The expedition wants a map and compass, and boots for gold: the Moor End post office has them.') : '';
      return `${L.pick([`${who === 'You' ? 'You spend' : `${who} and you spend`} the day finding a trig point by compass, and find a different one.`, `Tent up in the wind at Curlew Camp: ${who === 'You' ? 'your' : `${who}’s`} fourth try stays up.`, 'A day on the moor learning to read contour lines, and the sky, and when to turn back.'])} (${a.tr} of ${lv.train} training days for ${lv.name.toLowerCase()}.)${need}`;
    },
  });

  // ---- Sallow Halt ----
  mdef('moorSteam', {
    place: 'halt', sec: 'Sallow Halt', icon: '🚂', title: (L) => (L.season === 3 ? 'Ride the Christmas special' : 'Ride the steam special'),
    desc: (L) => `${L.season === 3 ? 'Steam, mince pies and a man with a beard in the guard’s van.' : 'Over the viaduct behind a steam engine, with the windows down.'} ${money(18)} a head${party(L).length ? ', and the family come too' : ''}.`,
    cost: (L) => 18 * (1 + party(L).length), per: 1,
    why: (L) => (L.season === 0 || L.season === 2 ? 'The specials run in summer, and at Christmas.' : null),
    run(L) {
      const s = L.s, who = party(L), kids = who.filter((p) => p.kind === 'child');
      s.moor.n.steam++;
      L.joy(6 + (kids.length ? 2 : 0));
      for (const p of who) L.bond(p, 4);
      if (L.season === 3 && kids.length) return `Father Christmas is in the guard’s van, and ${kids[0].name.split(' ')[0]} asks him searching questions about the logistics. Steam on the frosty air and a present each.`;
      return L.pick(['Out over the viaduct with the gill a hundred feet below, the smoke going past the window, and everybody on board seven years old again.', 'You stand in the corridor with your head out like a dog and come home black-faced and grinning.', 'Tea from an urn, scones from a hamper, and the whole moor going by at twenty miles an hour.']);
    },
  });

  // ---- Moor End ----
  mdef('moorDrovers', {
    place: 'village', sec: 'Moor End', icon: '🍺', title: 'A pint at the Drovers', desc: 'Low beams, a fire, and the village’s news, much of it true. Good for the mood and Charm.', cost: 8, per: 1,
    run(L) {
      const s = L.s, m = s.moor;
      L.joy(3); L.gain('charm', 0.8);
      L.moorWarm('nance', 3);
      const met = L.maybeMeet(0.08);
      let said = L.pick(['The landlord tells you about the winter of 1963, when the Drovers was cut off for six weeks and nobody minded.', 'A farmer at the bar explains what is wrong with the sheep this year, and the year before, and the council.', 'Nance Dyer from the post office comes in for her half of stout at six sharp and tells the room who is courting whom.', 'A darts match with Haverleigh’s gamekeeper, who throws like he shoots, which is to say better than you.']);
      // (Nance brings out the shoebox once she knows you; if you would rather not, she waits two years to ask again.)
      if (m.drown.clues.nance == null && m.drown.end == null && m.folk.nance >= 9 && (m.f.nanceNo == null || s.t - m.f.nanceNo >= 8) && !s.pend.some((e) => e.id === 'moorNance')) L.queue('moorNance');
      else if (m.drown.on != null && L.chance(0.35)) said = L.pick(['Somebody says that on stormy nights you can hear the bells of Fennick ringing under the water. Somebody else says that is the wind. Nobody looks at the window.', 'An old man by the fire says his grandmother saw the Fennick bells go up the moor road in a cart, at night, under a tarpaulin. Nobody believes him. You buy him a drink.']);
      if (met) said += ` You end up sharing a table, and then a second pint, with ${met.name}.`;
      return said;
    },
  });
  def('moorWalksBook', { place: 'village', sec: 'Walking', icon: '🥾', title: 'The walks board', desc: (L) => `Ten walks on the moor, from a stroll to the whole Round. You have walked ${L.moorWalksDone()} of them.`, time: 0, open: 'moorWalks' });
  def('moorBuyMap', {
    place: 'village', sec: 'Moor End post office', icon: '🧭', title: 'Buy a moor map and a compass', desc: 'You get lost less in fog, and the longer walks and the silver award want one.', cost: 45, time: 0,
    show: (L) => !L.s.moor.kit.map,
    run(L) { L.s.moor.kit.map = true; L.moorWarm('nance', 1); return 'Nance sells you the map, the compass and twenty minutes on how to fold the map, which nobody has ever managed.'; },
  });
  def('moorBuyBoots', {
    place: 'village', sec: 'Moor End post office', icon: '🥾', title: 'Buy walking boots', desc: 'The rough walks and the gold award want them.', cost: 120, time: 0,
    show: (L) => !L.s.moor.kit.boots,
    run(L) { L.s.moor.kit.boots = true; return 'Proper boots from the back of the post office, where Nance keeps them between the wellingtons and the paraffin. They will hurt for a month and last for twenty years.'; },
  });
  mdef('moorFete', {
    place: 'village', sec: 'The fête', icon: '🎪', title: 'Enter the Moor End fête', desc: 'Cakes, dogs, a tug of war and the welly-throwing. Your best skill decides what you enter.', cost: 5, per: 1,
    why: (L) => (L.season !== 1 ? 'The fête is in July. The bunting is in Nance’s loft until then.' : null),
    run(L) {
      const s = L.s, m = s.moor, top = ['craft', 'fitness', 'charm', 'smarts'].sort((a, b) => s.st[b] - s.st[a])[0];
      const won = L.chance(L.checkOdds(top, 45));
      L.joy(won ? 7 : 3); L.gain(top, 0.8); L.moorWarm('nance', 2);
      if (m.hall.f > 0) L.moorFavour(1);
      if (won) m.fete.wins++;
      const what = { craft: ['the Victoria sponge', 'a jar of bramble jelly'], fitness: ['the tug of war', 'the welly-throwing'], charm: ['the bonniest-pet class with a borrowed dog', 'the raffle, as the man on the microphone'], smarts: ['guess the weight of the cake', 'the treasure hunt'] }[top];
      const it = L.pick(what);
      return won ? `You win ${it}${m.fete.wins > 1 ? `, your ${m.fete.wins === 2 ? 'second' : m.fete.wins === 3 ? 'third' : `${m.fete.wins}th`} rosette at the fête` : ''}. A red rosette, a round of applause and a look from last year’s winner that could curdle milk.` : `You come second in ${it}, to a woman who has won it for nineteen years and will win it for nineteen more.`;
    },
  });
  mdef('moorCricket', {
    place: 'village', sec: 'The fête', icon: '🏏', title: 'Play in the match on the green', desc: 'Moor End against the Haverleigh XI, once a summer. Fitness, nerve, and tea at the interval.', time: 2, per: 1,
    show: (L) => L.moorMet('nance'), // (The village picks its own: somebody who drinks at the Drovers.)
    why: (L) => (L.season !== 1 ? 'The match is in summer, when the green is not a bog.' : L.s.age >= 70 ? 'You umpire now, which is to say you hold the jumpers.' : null),
    run(L) {
      const s = L.s, c = s.moor.cricket, good = L.chance(L.checkOdds('fitness', 40)), runs = good ? L.int(18, 64) : L.int(0, 12), win = L.chance(good ? 0.6 : 0.4);
      c.caps++; c.runs += runs; c.best = Math.max(c.best, runs);
      L.joy(win ? 7 : 3); L.gain('fitness', 1.4); L.gain('charm', 0.6);
      if (s.moor.hall.f > 0) L.moorFavour(1);
      const bat = runs >= 50 ? `You make ${runs}, your first fifty, and the whole green stands up` : runs >= 20 ? `You make ${runs} before Kit Askwith stumps you, grinning` : runs > 0 ? `You make ${runs}, mostly off the edge` : 'You are out first ball, to a man of seventy bowling underarm';
      return `${bat}. ${win ? 'Moor End win by a whisker, and the Drovers stays open late.' : 'Haverleigh win, as Haverleigh usually do, and are very gracious about it, which is worse.'}`;
    },
  });

  // ---- the observatory ----
  // Played by hand: joining up the stars (moor-games.js). A good night logs a constellation.
  mdef('moorStargaze', {
    place: 'observatory', sec: 'The Askwith Observatory', icon: '🔭', title: (L) => (L.moorComet() ? 'See the comet through the big telescope' : 'Look through the big telescope'),
    desc: (L) => `Dr Lamb shows you the sky, and you find the shapes in it. Smarts.${L.moorComet() ? ' The comet is up.' : ''} ${L.moorStarsN()} of ${SKY_IDS.length} constellations logged.`,
    per: 1,
    why: (L, x) => (badScore(x) ? 'Mind how you go.' : ['wet', 'fog', 'storm', 'snow'].includes(L.s.wx) ? 'Cloud. Dr Lamb is doing the crossword under the dome and says to come back on a clear night.' : null),
    run(L, x) {
      const s = L.s, m = s.moor, sc = scoreOf(x), id = L.moorStarNext(), k = SKY[id];
      m.n.stars++;
      L.moorWarm('lamb', 3); L.gain('smarts', 1.4 + sc); L.joy(4);
      let said = '';
      if (sc >= 0.5 && m.stars[id] == null) { m.stars[id] = s.t; said = `Logged: ${k.name}. ${k.said}`; L.joy(2); if (L.moorStarsN() === SKY_IDS.length) L.note('Logged every constellation in Dr Lamb’s book.', 'big'); }
      else if (sc >= 0.5) said = `${k.name} again, as clear as print. ${L.pick(['Dr Lamb hums.', 'Gerald, the big telescope, purrs on his mount.'])}`;
      else said = L.pick(['You lose the shape among all the other stars and Dr Lamb finds it for you, patiently, three times.', 'The cloud comes over just as you have it. Dr Lamb says something to the sky that a doctor of astronomy should not know.']);
      if (L.moorComet() && !m.cometSeen) { m.cometSeen = true; L.joy(8); L.note('Saw the comet through the big telescope at the Askwith Observatory.', 'big'); said = `And then Dr Lamb swings the telescope round, and there it is: the comet, a smudge of light with a tail like a breath on glass, that will not be back for three thousand years. ${said}`; }
      return said;
    },
  });
  def('moorStarBook', { place: 'observatory', sec: 'The Askwith Observatory', icon: '✨', title: 'Your star log', desc: (L) => `${L.moorStarsN()} of ${SKY_IDS.length} constellations logged, and the night sky this season.`, time: 0, open: 'moorStars' });

  // ---- walking ----
  mdef('moorWalk', {
    sec: 'Walking', icon: (L, x) => (L.moorWalk(x) || { icon: '🥾' }).icon, title: (L, x) => (L.moorWalk(x) || { name: 'A walk' }).name,
    desc: (L, x) => (L.moorWalk(x) || { blurb: '' }).blurb,
    time: (L, x) => (L.moorWalk(x) || {}).time || 2, per: 1,
    why: (L, x) => L.moorWalkWhy(x),
    run(L, x) {
      const s = L.s, m = s.moor, w = L.moorWalk(x), first = !m.walks[x];
      m.walks[x] = (m.walks[x] || 0) + 1; m.n.walks++;
      L.gain('fitness', 2 + w.miles / 6 + (m.kit.boots ? 0.4 : 0)); L.joy(first ? 6 : 4); L.hp(1);
      let said = x === 'wood' && L.season === 0 ? w.spring : L.pick(w.said);
      if (first && x !== 'drove') { L.note(`Walked ${w.name.replace(/^The /, 'the ')}.`); L.say(w.icon, `Walked: ${w.name}`, 'good'); if (L.moorWalksDone() === WALK_IDS.length) L.note('Walked every walk on the moor.', 'big'); }
      if (x === 'round' && first) L.fame(1);
      if (x === 'moss' && first && !s.seen.moorBog) L.queue('moorBog');
      else if (L.chance(0.1)) { const f = L.moorFind('moor'); said += ` By the path: ${f.k.said}.`; }
      else if (L.fancy && !L.partner() && L.chance(0.07)) {
        const p = L.meet({ sex: s.into === 'b' ? (L.chance(0.5) ? 'm' : 'f') : s.into, single: true });
        said += ` You fall into step with ${p.name}, who is doing the same walk and is better at it, and you finish it together.`;
      }
      return said;
    },
  });

  // ---- gifts and the syndicate (from the Hall's sheet) ----
  def('moorGift', {
    sec: 'Haverleigh Hall', icon: '🎁', title: (L, x) => ['A gift to the roof fund', 'A gift to restore the gardens', 'A gift to save the long gallery'][x] || 'A gift',
    // (The price is noted as it is asked, so that what was paid is what is recorded.)
    desc: (L, x) => `${['Slates, lead and a gutter or two', 'The walled garden, the glasshouses and the maze', 'The long gallery’s ceiling, before it comes down on the portraits'][x] || 'Something'}. The family notice, and remember.`, time: 0, cost: (L, x) => (x >= 0 && x <= 2 ? (L.s.moor.f.quote = L.moorGiftCost(x)) : 0),
    why: (L, x) => (!(x >= 0 && x <= 2) ? 'Choose a gift.' : L.s.moor.hall.gallery === 'press' ? 'The Askwiths are not taking your money, or your calls.' : L.s.t - L.s.moor.hall.gift < 4 ? 'They are still writing the thank-you letter for the last one. Once a year is generous.' : null),
    run(L, x) {
      const s = L.s, h = s.moor.hall, cost = s.moor.f.quote || L.moorGiftCost(x);
      h.gift = s.t; h.given += cost;
      L.moorFavour([4, 9, 16][x]); L.karma([1, 2, 3][x]); L.joy([2, 4, 6][x]);
      if (x === 2) L.note(`Gave ${money(cost)} to save the long gallery at Haverleigh Hall.`, 'big');
      return [`Kit writes by return, on paper with the family crest and a tea stain: three slates and a gutter, she says, and thank you.`, 'The head gardener sends you a cutting from the old rose, and a list of what your money will buy, in his own spelling.', `Kit drives down in the Land Rover to say thank you in person, which she has never done for anybody, and stands in your doorway saying it twice.`][x];
    },
  });
  def('moorSynd', {
    sec: 'Haverleigh Hall', icon: '🎯', title: 'Take a gun in the Haverleigh syndicate', desc: (L) => `${money(L.moorSyndCost())} to buy in, then ${money(SYND_FEE)} a season. Shoot days in autumn and winter.`,
    time: 0, cost: (L) => L.moorSyndCost(),
    why: (L) => (L.s.moor.hall.synd != null ? 'You have a gun already.' : L.s.moor.hall.f < 10 && L.netWorth() < 100000 ? 'It is by invitation. Kit has to know you a little first, unless you are the sort of money Hugo sells guns to.' : L.s.moor.hall.gallery === 'press' ? 'Not after what you did.' : null),
    run(L) { L.s.moor.hall.synd = L.s.t; L.moorFavour(3); return 'Hugo Askwith takes your cheque in the gun room with a handshake, a large whisky and a story about a duke. Your name goes on the peg board, between a bishop and a man who owns most of Kettleby.'; },
  });
  def('moorSyndQuit', {
    sec: 'Haverleigh Hall', icon: '🎯', title: 'Give up your gun', desc: 'No more fees, and no more shoot days.', time: 0,
    show: (L) => L.s.moor.hall.synd != null,
    run(L) { L.s.moor.hall.synd = null; return 'Your name comes off the peg board. The keeper is sorry to see you go, he says, which you suspect he says to everybody, and means of some.'; },
  });
  def('moorScope', {
    sec: 'The Askwith Observatory', icon: '🔭', title: 'Pay for a new telescope', desc: (L) => `${money(L.moorScopeCost())}. Dr Lamb has wanted one for thirty years. Your name on the brass plate, and the sky a good deal clearer.`,
    time: 0, cost: (L) => L.moorScopeCost(),
    why: (L) => (L.s.moor.gifts.scope ? 'It is up there now, under the dome.' : L.s.moor.folk.lamb < 0 ? 'You have not met Dr Lamb yet.' : null),
    run(L) { const s = L.s; s.moor.gifts.scope = true; L.moorWarm('lamb', 25); L.karma(3); L.joy(6); L.note('Paid for a new telescope at the Askwith Observatory.', 'big'); return 'It comes up the moor road on a low-loader and goes in through the roof. Dr Lamb calls it after you, then, after a decent interval, after her fourth husband, whom she has not met yet. The plate keeps your name.'; },
  });
  // Spares and the collection, from the finds sheet.
  def('moorSellSpares', {
    sec: 'Finds', icon: '🪙', title: 'Sell your spares to the visitor hut', desc: (L) => `Dot sells them on to the tourists. ${money(L.moorSpares())} for the lot.`, time: 0,
    why: (L) => (L.moorSpares() <= 0 ? 'No spares to sell.' : null),
    run(L) { const s = L.s, n = L.moorSpares(); s.moor.spare = {}; L.cash(n); s.n.earned += n; return `Dot counts them out of the box onto the counter, prices them in pencil and pays you ${money(n)} from the tin.`; },
  });
  def('moorGiveFinds', {
    sec: 'Finds', icon: '🏛️', title: 'Give your collection to the town museum', desc: 'A glass case with your name on it. Good for your name.', time: 0,
    why: (L) => (L.s.moor.gifts.coll ? 'It is in its case now.' : L.moorFindsN() < 8 ? 'The museum would like at least eight finds before it gives them a case.' : null),
    run(L) { const s = L.s; s.moor.gifts.coll = 'museum'; L.karma(4); L.fame(1.5); L.joy(5); L.note('Gave a collection of fossils and finds from the moor to the town museum.', 'big'); return 'The curator puts on white gloves to take them, which nobody has ever done for anything of yours. A case by the window, and a card: Collected on Starling Moor, and your name.'; },
  });

  // ---- Fennick, up the hill ----
  def('moorRegister', {
    place: 'library', sec: 'Fennick', icon: '📜', title: 'Ask for the Fennick registers', desc: 'Miss Achterberg keeps the parish books of the drowned village in the archive, in a box marked DAMP.',
    show: (L) => L.s.moor.drown.on != null && !L.moorHasClue('register'),
    run(L) { L.gain('smarts', 1.2); L.moorClue('register'); return 'Miss Achterberg brings the box herself, in gloves, and stands over you while you read, saying “Shh” to nobody. On the last page of the register of St Oda’s, in a careful hand, is the line about the bells.'; },
  });

  // ---- what the moor says about you (soul.js) ----
  Object.assign(DEEDS, {
    moorWalk: { sporty: 2, loner: 1 }, moorStones: { loner: 2 }, moorDowse: { loner: 1, daredevil: 0.5 }, moorStargaze: { bookish: 2, nightowl: 1 },
    moorQuarry: { grafter: 3, sporty: 1 }, moorEstate: { grafter: 2 }, moorForage: { thrifty: 2, loner: 1 }, moorCharcoal: { grafter: 1, loner: 1 },
    moorPit: { daredevil: 3, sporty: 1 }, moorResSwim: { sporty: 2 }, moorTrout: { loner: 1.5 }, moorCamp: { homebody: 1 }, moorDrovers: { charmer: 1, nightowl: 1 },
    moorShoot: { spender: 1, charmer: 1 }, moorGift: { kind: 3 }, moorFete: { charmer: 1 }, moorCricket: { sporty: 2, charmer: 1 }, moorFossil: { bookish: 1, loner: 1 },
  });

  // ---- keeping it ----

  hooks.load.push((L) => {
    const s = L.s, b = blank();
    if (!s.moor) s.moor = b;
    const m = s.moor;
    for (const k of Object.keys(b)) if (m[k] === undefined) m[k] = b[k];
    for (const k of ['hall', 'quarry', 'drown', 'n', 'cricket', 'fete', 'drove', 'gifts']) for (const [q, v] of Object.entries(b[k])) if (m[k][q] === undefined) m[k][q] = v;
    for (const id of MOOR_FOLK_IDS) if (m.folk[id] == null) m.folk[id] = -1;
    // The comet comes once in a life, some years off: an autumn, decided by the seed (and not by the dice, which are the life's own).
    if (m.key == null) m.key = Math.imul((s.rng ^ 0x5bd1e995) >>> 0, 2246822519) >>> 0;
    if (m.comet == null) { const h = Math.imul((s.rng ^ 0x9e3779b9) >>> 0, 2654435761) >>> 0; m.comet = s.t + 12 + (h % 140); m.comet += (2 - (m.comet % 4) + 4) % 4; }
  });

  // The moor's own weather, as it were: blasting days, droughts and fires, settled by the season and the life's
  // key rather than by the life's dice, so that the moor coming into a life does not change its luck elsewhere.
  const roll = (L, salt) => {
    let h = (Math.imul(L.s.moor.key ^ (L.s.t * 0x9e3779b1), 0x85ebca6b) ^ Math.imul(salt, 0xc2b2ae35)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0x27d4eb2f) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  // The turn of the season (the new season's weather is known by now).
  hooks.late.push((L, jailed) => {
    const s = L.s, m = s.moor, q = L.season;
    if (roll(L, 1) < 0.33) m.blast = s.t;
    if (q === 1 && s.wx === 'hot') {
      // A drought: the water goes down and Fennick comes up. (Every hot summer has a fair chance; one is overdue when you are looking for it.)
      const due = m.drown.on != null && m.drown.clues.spire == null && s.t - m.drown.on >= 12;
      if (due || roll(L, 2) < 0.45) m.dry = s.t;
      if (roll(L, 3) < 0.3) { m.fire = s.t; if (!jailed && m.n.trips > 0) L.queue('moorFire'); }
    }
    if (jailed) return;
    if (s.t === m.comet) L.queue('moorComet');
    if (m.drove.due === s.t) L.queue('moorDrove2');
    if (m.drown.letterAt != null && s.t >= m.drown.letterAt && m.drown.clues.letter == null && m.drown.end == null) { m.drown.letterAt = s.t + 4; L.queue('moorLetter'); }
    // Hugo and the money he borrowed: back with something on top, or not at all.
    const loan = m.hall.loan;
    if (loan && loan.due != null && s.t >= loan.due) {
      loan.due = null;
      if (L.chance(0.5)) { L.cash(Math.round(loan.n * 1.1)); L.note(`Hugo Askwith paid back what he owed you, with ${money(Math.round(loan.n * 0.1))} on top and a case of claret.`); }
      else L.note('Hugo Askwith has not paid back what he owes you. You hear he is in Monaco.');
    }
  });
  // What foraging and fishing put in the larder is eaten this season (and what is not, spoils).
  hooks.season.push((L) => { L.s.moor.larder = 0; });
  hooks.year.push((L) => {
    const s = L.s, m = s.moor;
    // (Favour, and friendships, fade a little in a year away.)
    if (m.hall.f > 0 && s.t - m.hall.seen > 6) m.hall.f = Math.max(0, m.hall.f - 2);
    for (const id of MOOR_FOLK_IDS) if (id !== 'kit' && m.folk[id] > 0 && s.t - (m.seen[id] ?? -99) > 6) m.folk[id] = Math.max(0, m.folk[id] - 2);
    // The steward's post is for a working age.
    if (m.hall.steward != null && s.age >= 70) { m.hall.steward = null; L.note('Retired as steward of the Haverleigh estate.'); }
  });
  hooks.income.push((L, out) => {
    const s = L.s, m = s.moor;
    if (m.larder > 0) out.push(['Food from the larder: foraged and caught', Math.min(400, m.larder)]);
    if (m.hall.share > 0) out.push(['Your share in Haverleigh Hall', r10(m.hall.share * 0.008)]);
    if (m.hall.steward != null) out.push(['Steward of the Haverleigh estate', STEWARD_PAY]);
    if (m.quarry.rank >= 3 && s.age < 66) out.push(['Foreman’s money from Blackrake', FOREMAN_PAY]);
  });
  hooks.bills.push((L, out, jailed) => { if (L.s.moor.hall.synd != null && !jailed) out.push(['Your gun in the Haverleigh syndicate', SYND_FEE]); });
  hooks.worth.push((L) => Math.round(L.s.moor.hall.share * 0.85));
  hooks.time.push((L) => (L.s.moor.hall.steward != null ? -1 : 0));
  hooks.mood.push((L) => {
    const m = L.s.moor;
    return (m.hall.share > 0 || m.hall.end === 'trust' ? 2 : 0) + (L.moorWalksDone() >= 5 ? 1 : 0);
  });
  // In prison the syndicate lets your gun go, after a season.
  hooks.late.push((L, jailed) => { const h = L.s.moor.hall; if (jailed && h.synd != null) { h.synd = null; L.note('The Haverleigh syndicate gave your gun to somebody else.'); } });

  addEvents(moorTales({ clamp, money, MOOR_FOLK, WALKS, AWARD, CLUES, QUARRY_RANKS, moorMeans, r100, r1000 }));

  // ---- trophies ----
  Object.assign(TROPHIES, {
    moorWalker: { name: 'Every walk on the moor', icon: '🥾', desc: 'Walk all ten walks on Starling Moor.', test: (L) => !!L.s.moor && L.moorWalksDone() >= WALK_IDS.length },
    moorRock: { name: 'Rock hound', icon: '🐚', desc: 'Find ten different fossils and finds on the moor.', test: (L) => !!L.s.moor && L.moorFindsN() >= 10 },
    moorSky: { name: 'Star chart', icon: '✨', desc: 'Log all twelve constellations at the Askwith Observatory.', test: (L) => !!L.s.moor && L.moorStarsN() >= SKY_IDS.length },
    moorBells: { name: 'The bells of Fennick', icon: '🔔', desc: 'Find out what happened to the drowned village’s bells.', test: (L) => !!L.s.moor && L.s.moor.drown.end != null },
    moorHall: { name: 'Friend of Haverleigh', icon: '🏰', desc: 'See the Askwiths’ story through to the end.', test: (L) => !!L.s.moor && L.s.moor.hall.ch >= 5 },
    moorGold: { name: 'Gold Curlew', icon: '🥇', desc: 'Win the gold Curlew Award, or see a child of yours win it.', test: (L) => !!L.s.moor && Object.values(L.s.moor.award).some((a) => a.lvl >= 3) },
  });
}
