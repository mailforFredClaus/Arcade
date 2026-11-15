// New in Town: the house, the garden and the street, as tables (the rules are in
// street.js, the cards in street-cards.js and street-tales.js, the screen in
// street-ui.js, the seating plan in street-games.js). Nothing in here changes a
// life: it is what the rules and the screen both need to know.

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
// A sum at today's prices, to the nearest ten (or hundred).
export const fee = (L, n) => Math.round(n * L.s.idx / 10) * 10;
export const big = (L, n) => Math.round(n * L.s.idx / 100) * 100;
export const he = (p) => (p.sex === 'm' ? 'he' : 'she');
export const He = (p) => (p.sex === 'm' ? 'He' : 'She');
export const him = (p) => (p.sex === 'm' ? 'him' : 'her');
export const his = (p) => (p.sex === 'm' ? 'his' : 'her');
export const His = (p) => (p.sex === 'm' ? 'His' : 'Her');
export const first = (p) => p.name.split(' ')[0];
export const cap = (t) => t[0].toUpperCase() + t.slice(1);
export const list = (l) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}` : l[0] || '');

// ---- the house ----------------------------------------------------------------------------

// What each kind of home is like to live in. built: about how old it is, in years, when you
// move in. size: how much garden (0 none; a half is pots or window boxes). scale: what work on
// it costs, against a cottage. table: how many guests sit round it.
export const HOUSE = {
  hostel: { built: 90, size: 0, scale: 0, table: 0 },
  bedsit: { built: 120, size: 0.5, scale: 0.4, table: 2 },
  flat: { built: 55, size: 0.5, scale: 0.6, table: 4 },
  cottage: { built: 190, size: 2, scale: 1, table: 5 },
  townhouse: { built: 140, size: 3, scale: 1.4, table: 6 },
  villa: { built: 25, size: 4, scale: 2, table: 7 },
  manor: { built: 300, size: 6, scale: 4, table: 7 },
};

// What goes wrong with a house. cost: having it done properly, on a cottage, today (scaled by
// the house). diy: the Craft it takes to do it yourself (null: a job for professionals).
// knock: what it takes off the price, a share of it, for each step it is left to get worse.
// hurt: what doing it yourself can do to you if it goes wrong. saw: how it shows itself;
// back: when a patch gives up; worse: when it is left; done: when it is done properly.
export const FAULTS = {
  damp: {
    name: 'Damp', icon: '💧', cost: 3000, diy: 35, knock: 0.02, mood: 1,
    saw: [
      'A black bloom has come up in the corner of the bedroom, behind the wardrobe, and the wallpaper there has begun to curl like a sandwich left out.',
      'There is a smell in the back bedroom, like a church in February. Behind the chest of drawers the wall is wet to the touch.',
      'The plaster under the window has gone soft and bubbled, and your shoes in the hall cupboard have grown a fine grey fur.',
    ],
    back: 'The damp is back. The paint that went over it has come up in blisters, as if it never believed a word of it.',
    worse: ['The damp has crept along the whole back wall now. Everything in that room smells of it, and so, a little, do you.', 'The damp has got into the bedroom carpet and the bottom of the curtains. You have started sleeping in the front room.'],
    done: ['They find a cracked downpipe and a gutter full of moss, and fix both, and then the wall. It dries out over a month and stays dry.', 'A damp course, a new gutter and a week of fans. The bedroom smells of nothing at all, which is the best smell there is.'],
  },
  roof: {
    name: 'The roof', icon: '🏚️', cost: 9000, diy: 55, knock: 0.04, mood: 1, hurt: [10, 'a fall from a roof'],
    saw: [
      'Rain in the night, and a drip on the landing into a saucepan: plink, plonk, plink, all night. In the morning there is daylight between two slates.',
      'A slate has come down in the wind and smashed on the path. Then you notice the brown stain on the bedroom ceiling, the shape of Australia.',
      'There is a bucket on the landing now, and a second one in the spare room. The roof is letting the weather in, and seems pleased with itself.',
    ],
    back: 'The patch on the roof has given way in the first proper gale. The buckets come out of the cupboard like old friends.',
    worse: ['The ceiling under the leak has started to sag, like a hammock with somebody in it.', 'There is moss growing on the inside of the bedroom ceiling now. Moss, indoors. It is almost pretty.'],
    done: ['Scaffolding for a fortnight, men whistling at a height, and a roof that keeps the rain where it belongs.', 'New battens, new felt, the old slates back on where they were good and new ones where they were not. You stand in the garden in the next downpour and listen to it not coming in.'],
  },
  boiler: {
    name: 'The boiler', icon: '🔥', cost: 2800, diy: 50, knock: 0.01, mood: 1,
    saw: [
      'The boiler has started knocking at night, like somebody wanting to be let in, and the hot water comes and goes as it pleases.',
      'The radiators are cold at the top and hot at the bottom, and the boiler makes a noise like a seal clearing its throat.',
      'No hot water this morning. The pilot light is out, and will not stay lit, however nicely you ask it.',
    ],
    back: 'The boiler is knocking again. It has the air of something that was only ever pretending to be mended.',
    worse: ['The boiler now works only if you kick it in the right place at the right time. Everywhere else in the house is cold.', 'You are boiling kettles for a bath. It takes eleven kettles. You have counted.'],
    done: ['A new boiler, small and white and silent. You keep going to look at it, the way people look at a new baby.', 'Two days without heat while they fit it, and then warm radiators in every room and hot water that comes when it is called.'],
  },
  wiring: {
    name: 'The wiring', icon: '⚡', cost: 6000, diy: 65, knock: 0.03, mood: 1, hurt: [8, 'a shock from the mains'],
    saw: [
      'The lights dim when the kettle goes on, and the socket in the kitchen is warm to the touch, which a socket should not be.',
      'A fuse blows whenever the toaster and the hairdryer are on at once. The fuse box is older than you are, and made of something brown.',
      'There is a smell of hot plastic from behind the light switch in the hall. When you flick it, it fizzes.',
    ],
    back: 'The lights have started flickering again, in a way that a ghost story would find a use for.',
    worse: ['Half the sockets have stopped working, and the half that work make a small, worried buzzing.', 'You run the whole house off two extension leads and a prayer.'],
    done: ['A week of floorboards up and dust everywhere, and then a fuse box that is grey and modern and has little switches with labels on.', 'The electrician shows you a length of the old wire, crumbling in her hand, and says you were lucky. You believe her.'],
  },
  subs: {
    name: 'Subsidence', icon: '🧱', cost: 25000, diy: null, knock: 0.08, mood: 1,
    saw: [
      'A crack has opened above the back door, running up the wall at an angle, wide enough to post a coin into. The door has started to stick.',
      'The doors upstairs will not shut any more, and a marble set down at one end of the landing rolls, with purpose, to the other.',
      'There is a crack in the front wall shaped like a bolt of lightning. People walking past have started to look at it.',
    ],
    back: 'The crack is back, through the filler, exactly where it was. It has the look of something that was never going to listen.',
    worse: ['The crack is wider. You can see the garden through it, if you put your eye to it, which you do more often than is healthy.', 'The kitchen floor now slopes towards the sea. Things put down on the table make their way, in time, to the door.'],
    done: ['Underpinning: men digging holes under your house for a month and filling them with concrete. The crack is filled and painted, and stays filled.', 'The surveyor comes back, puts a marble on the landing, and it stays where it is put. You may never have been happier to see a marble do nothing.'],
  },
  wall: {
    name: 'The shared wall', icon: '🧱', cost: 7000, diy: 45, knock: 0.03, mood: 1, shared: true,
    saw: [
      'The wall you share with next door has a damp stain coming through and a crack along the top, and you can hear their radio more clearly than you would like.',
      'The chimney breast you share with next door is leaning, very slightly, towards you. Builders call it a party wall. There is nothing party about it.',
      'Something has given way in the shared wall: the plaster has come off in a sheet, and behind it the bricks are crumbling like old cake.',
    ],
    back: 'The shared wall has cracked again along the line of the repair. Next door has noticed too.',
    worse: ['The crack in the shared wall goes right through now. You can hear next door’s kettle.', 'Next door has hung a picture over their side of the crack. You have hung one over yours. Neither picture is helping.'],
    done: ['The wall is taken down to the bad bricks and built back up, both sides, and plastered smooth. You cannot hear next door at all now, and rather miss it.', 'Tied in, repointed and plastered. Next door brings round a bottle to mark the occasion.'],
  },
};
// How often each thing goes wrong, a season, in each kind of home (a house that is not looked
// after goes wrong more often: see stWear). The manor's roof goes on going wrong until it is done.
export const FAULT_ODDS = {
  bedsit: { damp: 0.02, boiler: 0.014, wiring: 0.01 },
  flat: { damp: 0.012, boiler: 0.012, wiring: 0.006, wall: 0.008 },
  cottage: { damp: 0.018, roof: 0.012, boiler: 0.01, wiring: 0.008, subs: 0.003, wall: 0.004 },
  townhouse: { damp: 0.012, roof: 0.012, boiler: 0.01, wiring: 0.01, subs: 0.004, wall: 0.008 },
  villa: { damp: 0.006, roof: 0.004, boiler: 0.008, wiring: 0.003, subs: 0.007 },
  manor: { damp: 0.018, roof: 0.03, boiler: 0.014, wiring: 0.012, subs: 0.004 },
};
// How long a patch lasts, in seasons, and how long a proper job keeps a thing from going wrong.
export const PATCH = [6, 14];
export const PROPER = 40;

// Who does the work. mult: what they charge against the going rate. sure: how often what they
// do is done properly (the rest is a patch in disguise). deposit: what they want up front.
// run: a share of the time they vanish with it. slow: seasons added to building work.
export const BUILDERS = {
  sound: { name: 'Penwarden & Sons', short: 'Penwarden & Sons', icon: '🧰', mult: 1.35, sure: 1, slow: 1, blurb: 'Reliable and dear. Old Mr Penwarden walks round with his hands behind his back, sucks his teeth, and gives you a price that makes you sit down. Then he keeps to it.' },
  cheap: { name: 'Daz Coombe', short: 'Daz', icon: '🚐', mult: 0.7, sure: 0.5, slow: 0, blurb: 'Cheap and quick, and cash. Daz is in and out in a day, in a van held together with stickers. Some of his work lasts.' },
  charm: { name: null, short: null, icon: '😎', mult: 0.85, sure: 0.9, slow: 0, deposit: 0.5, run: 0.35, blurb: 'Charming, with a lovely van and lovelier opinions about your cornicing. Wants half up front, for materials.' },
};
// The charming ones: a new name each time, because the last one is not coming back.
export const CHARMERS = ['Rory Ashdown', 'Lance Pettigrew', 'Jase Moyle', 'Troy Carlyon', 'Shane Hosken', 'Kirk Bastian'];

// Building work beyond the four improvements in data.js, chosen to suit the house. kinds: the
// homes it suits. cost: on a house of that kind, today's prices are added. seasons: with a
// builder who keeps time. comfort: added to how the house lifts your mood. value: what it adds
// to the price, as a share of what it cost. diy: the Craft to build it yourself (null: never).
export const PROJECTS = {
  knock: { name: 'Knock through to the kitchen', icon: '🔨', kinds: ['flat'], cost: 9000, seasons: 1, comfort: 1, value: 1.1, diy: 45, blurb: 'The wall between the kitchen and the front room comes out, and the flat fills up with light.' },
  loft: { name: 'A loft room', icon: '🪜', kinds: ['cottage', 'townhouse'], cost: 38000, seasons: 3, comfort: 1.5, value: 1.25, diy: 65, blurb: 'A room up under the roof, with a skylight you can see the stars through.' },
  conserv: { name: 'A conservatory', icon: '🪴', kinds: ['cottage', 'townhouse', 'villa'], cost: 24000, seasons: 2, comfort: 1.5, value: 0.8, diy: 55, blurb: 'Glass on three sides, a cane chair, and a tomato plant that will try to take over.' },
  workshop: { name: 'A workshop at the end of the garden', icon: '🪚', kinds: ['cottage', 'townhouse', 'villa', 'manor'], cost: 16000, seasons: 2, comfort: 0.5, value: 0.9, diy: 45, blurb: 'A proper shed: a bench, a vice, a radio and a door that shuts. Somewhere to make things, and sell them.' },
  annexe: { name: 'A granny annexe', icon: '🏠', kinds: ['cottage', 'townhouse', 'villa', 'manor'], cost: 65000, seasons: 4, comfort: 0.5, value: 1.15, diy: 75, blurb: 'A little house of its own at the end of the garden: for a parent getting on, or to let to holidaymakers.' },
  pool: { name: 'A swimming pool', icon: '🏊', kinds: ['villa'], cost: 95000, seasons: 3, comfort: 2, value: 0.9, diy: null, blurb: 'Blue water on the edge of the cliff, and the sea below it, bluer.' },
  roof: { name: 'A new roof for the manor', icon: '🏰', kinds: ['manor'], cost: 420000, seasons: 6, comfort: 1, value: 0.9, diy: null, blurb: 'A roof the size of a field: every slate off, every beam looked at, and put back for another three hundred years. Until it is done, the old one will go on leaking.' },
};

// ---- the garden ---------------------------------------------------------------------------

// What each kind of home has for a garden.
export const GARDENS = {
  bedsit: { name: 'A share of the yard', icon: '🪴', said: 'your two pots in the yard behind the chip shop' },
  flat: { name: 'Window boxes', icon: '🌼', said: 'your window boxes' },
  cottage: { name: 'The little garden', icon: '🏡', said: 'the little garden' },
  townhouse: { name: 'The long garden', icon: '🌳', said: 'the long garden' },
  villa: { name: 'The cliff garden', icon: '🌅', said: 'the cliff garden' },
  manor: { name: 'The grounds', icon: '🏰', said: 'the grounds' },
};
// What can go in a garden. min/max: the size of garden it needs. grow: seasons to come to its
// best (fruit trees take years to bear). w: how much it counts for in how the garden looks.
// food: what it saves on the food bill in summer and autumn, at its best. show: its class at
// the Harvest Show.
export const FEATURES = {
  pots: { name: 'Tomatoes in pots', icon: '🍅', cost: 40, min: 0.5, max: 0.5, grow: 2, w: 30, food: 40, show: 'veg', blurb: 'Two pots and a cane. In August, tomatoes that taste of something.' },
  boxes: { name: 'Geraniums and herbs', icon: '🌼', cost: 80, min: 0.5, max: 0.5, grow: 2, w: 40, blurb: 'Red geraniums, a bit of thyme, and a reason to open the window.' },
  lawn: { name: 'A lawn', icon: '🟩', cost: 600, min: 2, grow: 2, w: 14, blurb: 'Somewhere to put a deckchair, and something to mow.' },
  veg: { name: 'A vegetable patch', icon: '🥕', cost: 300, min: 2, grow: 2, w: 14, food: 120, show: 'veg', blurb: 'Potatoes, beans and onions, and the slugs’ share.' },
  roses: { name: 'A rose bed', icon: '🌹', cost: 500, min: 2, grow: 6, w: 18, show: 'roses', blurb: 'Old roses that smell the way roses used to. Two summers before they are at their best.' },
  fruit: { name: 'Fruit trees', icon: '🍎', cost: 900, min: 2, grow: 12, w: 18, food: 90, show: 'fruit', blurb: 'An apple and a pear. Three years before they bear, and then for the rest of your life.' },
  pond: { name: 'A pond', icon: '🐸', cost: 1500, min: 2, grow: 4, w: 14, blurb: 'A pond with a little beach for the hedgehogs. Wait a year, and the frogs find it.' },
  greenhouse: { name: 'A greenhouse', icon: '🪟', cost: 2600, min: 3, grow: 1, w: 10, food: 60, blurb: 'Tomatoes in July, chillies in September, and somewhere warm to sit in March.' },
  walled: { name: 'The walled garden', icon: '🧱', cost: 60000, min: 6, grow: 8, w: 40, food: 200, blurb: 'Two acres behind a brick wall, gone to brambles since the war. Brought back, it would be the finest garden in the Bay.' },
};
// The Harvest Show's garden classes (FESTS in data.js has the rest of the show).
export const CLASSES = {
  roses: { name: 'the roses', icon: '🌹', prize: 200 },
  fruit: { name: 'the fruit', icon: '🍎', prize: 200 },
  veg: { name: 'the vegetables', icon: '🥕', prize: 150 },
};

// ---- the street ---------------------------------------------------------------------------

// Who lives near each kind of home. always: one of these is always there. pool: the rest are
// drawn from these. n: how many neighbours. where: what to call it; their: where they live.
export const STREETS = {
  hostel: { name: 'Dormitory B', icon: '🛏️', said: 'the bunkroom', their: 'the next bunk', n: 3, always: ['sailor'], pool: ['ladder', 'student', 'singer'] },
  bedsit: { name: 'Over the chip shop', icon: '🍟', said: 'the landing', their: 'across the landing', n: 3, always: ['chippy'], pool: ['singer', 'student', 'milk'] },
  flat: { name: 'Harbour Court', icon: '🏢', said: 'Harbour Court', their: 'downstairs', n: 4, always: ['couple'], pool: ['milk', 'teen', 'watch', 'ladder', 'parking'] },
  cottage: { name: 'Ropewalk Lane', icon: '🏡', said: 'the lane', their: 'next door', n: 4, always: ['fence'], pool: ['milk', 'teen', 'ladder', 'watch'] },
  townhouse: { name: 'The top of the High Street', icon: '🏘️', said: 'the top of the High Street', their: 'next door', n: 4, always: ['parking'], pool: ['fence', 'teen', 'watch', 'milk', 'ladder'] },
  villa: { name: 'The cliff road', icon: '🌅', said: 'the cliff road', their: 'along the cliff road', n: 3, always: ['posh'], pool: ['judge', 'fence', 'milk'] },
  manor: { name: 'Up the hill', icon: '🏰', said: 'the hill', their: 'up the hill', n: 3, always: ['lady', 'keeper'], pool: ['posh', 'judge'] },
};
// Names for neighbours, by how old they are: [men, women]. None of these is anybody else’s in
// town, and the surnames are not those of the townsfolk or of people you meet.
export const NB_FIRST = {
  old: [['Cyril', 'Wilfred', 'Reg', 'Stanley', 'Arnold', 'Horace', 'Ernest', 'Walter', 'Albert'], ['Mavis', 'Hilda', 'Ivy', 'Winifred', 'Elsie', 'Vera', 'Dilys', 'Nora', 'Phyllis']],
  mid: [['Gary', 'Trevor', 'Nigel', 'Colin', 'Barry', 'Graham', 'Clifford', 'Kenneth'], ['Sandra', 'Lorraine', 'Denise', 'Julie', 'Tracey', 'Gail', 'Lesley', 'Pauline']],
  young: [['Craig', 'Wayne', 'Dale', 'Stuart', 'Ricky', 'Jamal'], ['Gemma', 'Tash', 'Stacey', 'Jodie', 'Shona', 'Chantelle']],
  posh: [['Piers', 'Jolyon', 'Crispin', 'Tarquin', 'Hector', 'Rollo'], ['Camilla', 'Hermione', 'Philippa', 'Araminta', 'Sybil', 'Letitia']],
  teen: [['Tyler', 'Brandon', 'Jayden', 'Kai-Leon', 'Mason'], ['Courtney', 'Demi', 'Kelsey', 'Tia', 'Paige']],
};
export const NB_LAST = ['Gedge', 'Pask', 'Trudgeon', 'Hext', 'Bunt', 'Rowse', 'Pengilly', 'Chubb', 'Scobie', 'Rescorla', 'Cundy', 'Rodda', 'Tremayne', 'Pethick', 'Blewett', 'Mounce', 'Penberthy', 'Trebilcock', 'Carveth', 'Treweek', 'Kellow', 'Nankivell', 'Rickard', 'Sleeman', 'Uren', 'Jewell', 'Glanville'];
export const NB_POSH = ['Ffoulkes', 'Ainsworth', 'Lisle', 'Carbery', 'Harcourt', 'Fairfax'];

// The people on a street, by what they are like. age: [from, to]. names: which pool.
// seat: how they are at a dinner table (see SEAT). st: how they feel about you to begin
// with. quirk: what you notice. want: what they want (known once you have been round).
// vs: who they cannot abide, if they share a street.
export const ROLES = {
  fence: { age: [55, 75], names: 'mid', seat: 'bore', st: 5, vs: ['parking', 'posh'], quirk: 'Measures the hedge with a tape measure on Sunday mornings.', want: 'Everything kept below the sill of the kitchen window, the hedge included.' },
  parking: { age: [40, 60], names: 'mid', seat: 'loud', st: 8, vs: ['fence', 'watch'], quirk: 'Owns a camper van called Brenda, and parks it wherever it will fit, and some places it will not.', want: 'The space outside your front door, for Brenda.' },
  teen: { age: [38, 48], names: 'mid', seat: 'kind', st: 10, vs: ['watch'], quirk: 'Works nights at St Wren’s and sleeps in the day, mostly. Has a teenager, mostly.', want: 'For the teenager to make something of themselves.' },
  ladder: { age: [45, 70], names: 'mid', seat: 'kind', st: 12, vs: [], quirk: 'Cannot pass a shed without wondering what is in it, and whether it could be borrowed.', want: 'To finish the extension started in 1998.' },
  milk: { age: [76, 84], names: 'old', seat: 'shy', st: 14, vs: ['couple'], quirk: 'Talks to the robins, and they, it seems, talk back.', want: 'Somebody to talk to, now and then.' },
  watch: { age: [55, 72], names: 'mid', seat: 'bore', st: 6, vs: ['teen', 'singer'], quirk: 'Keeps a log of every car that comes up the road, with the time.', want: 'More members for the Neighbourhood Watch, and a crime to report.' },
  couple: { age: [24, 32], names: 'young', seat: 'loud', st: 10, vs: ['milk'], quirk: 'Dances to the radio on Friday nights, directly over your bed.', want: 'A house with a garden, one day.' },
  newfam: { age: [30, 42], names: 'young', seat: 'kind', st: 8, vs: [], quirk: 'Three children, two dogs, and a great many shoes in the hall.', want: 'To be made welcome.' },
  chippy: { age: [45, 62], names: 'mid', seat: 'kind', st: 15, vs: [], quirk: 'Calls everybody “my lover”, including the man from the council.', want: 'A night off, one day, and somebody to leave the shop to.' },
  singer: { age: [35, 60], names: 'mid', seat: 'loud', st: 6, vs: ['student', 'watch'], quirk: 'Sings opera in the bath, all of it, at seven in the morning.', want: 'An audience.' },
  sailor: { age: [60, 72], names: 'old', seat: 'bore', st: 12, vs: [], quirk: 'Has been everywhere twice, and says the second time was worse.', want: 'One more ship.' },
  student: { age: [19, 23], names: 'young', seat: 'shy', st: 8, vs: ['singer'], quirk: 'Revises with a highlighter in each hand and a third behind one ear.', want: 'To be a doctor, and to sleep.' },
  posh: { age: [38, 52], names: 'posh', seat: 'loud', st: 6, vs: ['judge', 'lady', 'fence'], quirk: 'Has a hot tub with lights in it that change colour, all night.', want: 'To be asked to things.' },
  judge: { age: [70, 82], names: 'old', seat: 'bore', st: 5, vs: ['posh'], quirk: 'Plays the same Bach every evening at six, loud enough to count as a public service.', want: 'Silence, and the view, as they were in 1974.' },
  lady: { age: [64, 78], names: 'posh', seat: 'bore', st: 4, vs: ['posh'], quirk: 'Has won the big gardens at Bay in Bloom thirty-one years running.', want: 'Thirty-two.' },
  keeper: { age: [58, 70], names: 'old', seat: 'shy', st: 15, vs: [], quirk: 'Has lived at the lodge for forty years and knows where every pipe on the estate runs.', want: 'A roof on the lodge that does not leak. (You are his landlord.)' },
};
// The thing that gets borrowed, by where you live.
export const LENT = { hostel: 'kettle', bedsit: 'iron', flat: 'drill' };
export const lent = (kind) => LENT[kind] || 'ladder';

// How somebody on your street stands with you, in words.
export function standWord(st) {
  return st <= -40 ? 'At war' : st < -10 ? 'Frosty' : st < 15 ? 'Nodding terms' : st < 40 ? 'Friendly' : st < 70 ? 'Good neighbours' : 'Firm friends';
}

// The landlord, for a home you rent. good: fixes things; slack: does not; sharp: puts the rent
// up. odds: that a call gets something done.
export const LANDLORDS = {
  good: { word: 'fixes things before you have finished telling her about them', odds: 0.95 },
  slack: { word: 'says he will send somebody', odds: 0.25 },
  sharp: { word: 'is very interested in the rent', odds: 0.55 },
};

// ---- having people round ------------------------------------------------------------------

// What you could give them. each: a head, at today's prices (the dear ones more for the rich).
// dc: the Craft it takes to pull off (null: brought in). good/bad: how the food comes out.
export const MENUS = {
  simple: { name: 'Something simple', icon: '🍲', each: 25, dc: 22, good: 0.7, bad: 0.45, said: ['a big pot of chilli', 'a cottage pie and peas', 'a fish pie with too much mash', 'sausages and a mountain of onions'] },
  roast: { name: 'A proper roast', icon: '🍗', each: 60, dc: 40, good: 0.85, bad: 0.35, said: ['roast chicken and all the trimmings', 'roast lamb with rosemary', 'a nut roast that converts a sceptic', 'roast pork and crackling you can hear across the room'] },
  show: { name: 'Something to remember', icon: '🦞', each: 140, dc: 60, good: 1, bad: 0.15, rich: true, said: ['a whole salmon, dressed', 'beef Wellington', 'lobster off the harbour boats that morning', 'a soufflé that stands up'] },
  bought: { name: 'Have it brought in', icon: '🧑‍🍳', each: 260, dc: null, good: 0.75, bad: 0.75, rich: true, said: ['the caterers from Kettleby, in white jackets', 'a chef from the Harbour Lights with his own knives'] },
};
// How guests are at a table, and what the seating plan asks for them.
export const SEAT = {
  kind: { icon: '💛', word: 'Kind', rule: 'puts a shy guest at ease' },
  shy: { icon: '🫣', word: 'Shy', rule: 'wants somebody kind beside them, and nobody loud' },
  loud: { icon: '📢', word: 'Loud', rule: 'should not be next to anyone shy' },
  bore: { icon: '🥱', word: 'A talker', rule: 'should not be next to the guest of honour' },
  honour: { icon: '⭐', word: 'Guest of honour', rule: 'should sit next to you' },
};

// The rules a seating plan has to keep, from who is coming. guests: [{ k, tags: [...], vs: [keys] }],
// with you as k 'you'. A rule is one of:
//   apart a b: these two are at odds: not side by side
//   kind a:    a (shy) wants a kind guest beside them
//   quiet a b: a (shy) should not be beside b (loud)
//   honour a:  a sits beside you
//   bore a b:  a (a talker) should not be beside b (the guest of honour)
export function tableRules(guests) {
  const out = [], has = (g, t) => g.tags.includes(t), seen = new Set();
  for (const g of guests) {
    for (const k of g.vs || []) {
      const key = [g.k, k].sort().join('|');
      if (seen.has(key) || !guests.some((h) => h.k === k)) continue;
      seen.add(key);
      out.push({ t: 'apart', a: g.k, b: k });
    }
    if (has(g, 'shy') && guests.some((h) => h !== g && has(h, 'kind'))) out.push({ t: 'kind', a: g.k });
    if (has(g, 'shy')) for (const h of guests) if (h !== g && has(h, 'loud')) out.push({ t: 'quiet', a: g.k, b: h.k });
    if (has(g, 'honour')) out.push({ t: 'honour', a: g.k });
    if (has(g, 'bore')) for (const h of guests) if (h !== g && has(h, 'honour')) out.push({ t: 'bore', a: g.k, b: h.k });
  }
  return out;
}
// Whether a rule holds with everybody seated in order round the table (seat 0 is yours; the
// last seat is beside the first). order: keys, by seat.
export function ruleKept(rule, order, guests) {
  const n = order.length, at = (k) => order.indexOf(k);
  const beside = (a, b) => { const i = at(a), j = at(b); return i >= 0 && j >= 0 && (Math.abs(i - j) === 1 || Math.abs(i - j) === n - 1); };
  const nextTo = (a) => { const i = at(a); return i < 0 ? [] : [order[(i + 1) % n], order[(i + n - 1) % n]].filter((k) => k != null); };
  const g = (k) => guests.find((h) => h.k === k);
  if (at(rule.a) < 0) return false;
  if (rule.t === 'apart') return at(rule.b) >= 0 && !beside(rule.a, rule.b);
  if (rule.t === 'kind') return nextTo(rule.a).some((k) => g(k) && g(k).tags.includes('kind'));
  if (rule.t === 'quiet') return at(rule.b) >= 0 && !beside(rule.a, rule.b);
  if (rule.t === 'honour') return beside(rule.a, 'you');
  if (rule.t === 'bore') return at(rule.b) >= 0 && !beside(rule.a, rule.b);
  return true;
}
// The best that can be done: every way round the table, with you at the head.
// Returns { order, max }: max is how many of the rules can be kept at once.
export function bestTable(guests, rules = tableRules(guests)) {
  const rest = guests.filter((g) => g.k !== 'you').map((g) => g.k);
  let best = null, max = -1;
  const perm = (done, left) => {
    if (max === rules.length) return;
    if (!left.length) {
      const order = ['you', ...done], n = rules.filter((r) => ruleKept(r, order, guests)).length;
      if (n > max) { max = n; best = order; }
      return;
    }
    for (let i = 0; i < left.length; i++) perm([...done, left[i]], [...left.slice(0, i), ...left.slice(i + 1)]);
  };
  perm([], rest);
  return { order: best || ['you'], max: Math.max(0, max) };
}
// What a rule says, for the screen. name(k): what to call a guest.
export function ruleSaid(rule, name) {
  return {
    apart: () => `${name(rule.a)} and ${name(rule.b)} are at odds: not side by side.`,
    kind: () => `${name(rule.a)} is shy: put somebody kind beside them.`,
    quiet: () => `${name(rule.a)} is shy, and ${name(rule.b)} is loud: keep them apart.`,
    honour: () => `${name(rule.a)} is the guest of honour: beside you.`,
    bore: () => `${name(rule.a)} will talk, and ${name(rule.b)} is the guest of honour: keep them apart.`,
  }[rule.t]();
}
