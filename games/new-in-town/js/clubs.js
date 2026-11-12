// New in Town: clubs and societies, and reading. Six clubs meet about the
// town: the choir at St Brigid’s, the Pavilion Players, Starling Rovers, the
// library’s book club, the sailing club at the harbour and the Gull’s quiz
// team. Join one (a fee, then a year’s subs), turn up about once a season,
// and your standing in it grows, and a skill of its own. Ranks open things
// up: a part in the club’s big occasion of the year, which is played by hand
// (the games are in clubs-games.js), then the solo, the armband, the chair.
// Drift away and standing falls, and in the end they stop expecting you.
//
// The library has a reading list too: borrow a book (the card is free), read
// it at home a sitting at a time, and finishing it leaves something behind.
//
// All of it lives in s.clubs:
//   m: { club: membership }   st standing 0-100, r rank, n club nights, since, last
//                             (the season you last turned up), miss (seasons in a
//                             row without), occ (the year of the last occasion),
//                             lead (when you last did the top rank’s job), and for
//                             the Rovers mode (play, vets, coach) and cup (this year’s run)
//   sk: { club: skill }       the club’s own skill, kept even if you leave
//   past: { club: { n, r } }  what you had when you last left
//   cab: [{ c, y, a, name, icon }]   silverware won
//   book: { id, p, since, warned } | null   the library book you have out
//   prog: { id: sittings }    books taken back unfinished
//   read: { id: { a, t } }    the reading log
//   card, fav (favourites read: a lasting lift), pick (the next book for the
//   book club, if you choose them), f (flags), n (counts)

import { TROPHIES, STAT_NAME, money } from './data.js';

const cap = (t) => t[0].toUpperCase() + t.slice(1);

// What each rank asks for: standing, the club’s skill, and club nights.
// (The top of a club is years of Thursdays away: six or seven, turning up every season.)
const NEED5 = { st: [0, 25, 40, 55, 70], sk: [0, 12, 30, 50, 70], n: [0, 3, 8, 16, 26] };
const NEED4 = { st: [0, 30, 50, 70], sk: [0, 15, 40, 65], n: [0, 4, 12, 24] };
// Rovers: the age you go to the veterans’ side, and the age you only coach.
export const VETS_AGE = 40;
export const COACH_AGE = 60;

// ---- the clubs ----------------------------------------------------------------------------

// place: where it meets. stat, also: what a club night trains. fee: to join;
// subs: a year, due each year on the season you joined. night: what a club
// night costs. time: how long one takes. parts: your part in the occasion at
// each rank (0 none, 1 small, 2 main, 3 the star). req: skills a rank also needs.
// occ: the big occasion, once a year in its own season, and its game (clubs-games.js).
// drill: practice, played by hand. lead: what the top rank does once a year.
export const CLUBS = {
  choir: {
    name: 'St Brigid’s Choir', the: 'the choir', place: 'church', icon: '🎼', sec: 'St Brigid’s Choir',
    skill: 'Voice', stat: 'craft', also: 'charm', fee: 20, subs: 40, night: 0, time: 1,
    blurb: 'Thursday practice in the vestry, Sunday services, and a tin of shortbread that is never empty. The Reverend Alice Hollis conducts, with feeling and a pencil.',
    ranks: ['a new voice', 'in the back row', 'in the front row', 'a section leader', 'the soloist'],
    parts: [0, 1, 1, 2, 3],
    opens: ['', 'A place in the choir at the contest in Aldermouth.', 'The front row, where the judges can see your face.', 'The descant, and the new voices to bring on.', 'The solo, at the contest and at evensong.'],
    up: ['', 'Moved up to the back row of St Brigid’s Choir.', 'Moved to the front row of St Brigid’s Choir.', 'Made a section leader in St Brigid’s Choir.', 'Became the soloist of St Brigid’s Choir.'],
    req: [{}, {}, {}, { craft: 30 }, { craft: 40 }],
    nightT: 'Go to choir practice', nightD: 'An evening in the vestry. Builds your Voice and your standing in the choir. Good for Craft and the mood.',
    occ: { season: 0, name: 'the Choir Contest', where: 'at Aldermouth Cathedral', prize: 'the Aldermouth Rose Bowl', icon: '🏆', game: 'clubHymn', gameIcon: '🎶',
      titles: ['Hand out programmes at the Choir Contest', 'Sing at the Choir Contest', 'Sing at the Choir Contest', 'Sing at the Choir Contest', 'Sing the solo at the Choir Contest'] },
    drill: { title: 'Practise with the organist', icon: '🎹', game: 'clubHymn', desc: 'Played by hand. Builds your Voice.' },
    lead: { title: 'Sing the solo at evensong', icon: '🕯️', desc: 'Once a year. Good for the mood and your name.' },
  },
  players: {
    name: 'The Pavilion Players', the: 'the Players', place: 'theatre', icon: '🎭', sec: 'The Pavilion Players',
    skill: 'Stagecraft', stat: 'charm', also: 'craft', fee: 40, subs: 80, night: 0, time: 2,
    blurb: 'The town’s amateur dramatic society: a summer play, a great many rehearsals, and Desmond Achebe, who once understudied in the West End and will tell you about it.',
    ranks: ['in the chorus', 'a speaking part', 'a lead', 'Desmond’s first choice'],
    parts: [0, 1, 2, 3],
    opens: ['', 'Lines of your own in the summer play.', 'A lead in the summer play.', 'Top billing, and a one-act play of your own to direct each year.'],
    up: ['', 'Given a speaking part by the Pavilion Players.', 'Cast as a lead by the Pavilion Players.', 'Became Desmond Achebe’s first choice for every lead.'],
    req: [{}, {}, { charm: 30 }, { charm: 40 }],
    nightT: 'Go to rehearsal', nightD: 'A long evening at the Pavilion. Builds your Stagecraft and your standing with Desmond. Good for Charm.',
    occ: { season: 1, name: 'the summer play', where: 'at the Pavilion', prize: 'the Bay Drama Award', icon: '🎭', game: 'clubLines', gameIcon: '📜',
      titles: ['Sing in the chorus of the summer play', 'Take your part in the summer play', 'Play the lead in the summer play', 'Top the bill in the summer play'] },
    drill: { title: 'Run your lines with Desmond', icon: '📜', game: 'clubLines', desc: 'Played by hand. Builds your Stagecraft.' },
    lead: { title: 'Direct a one-act play', icon: '🎬', desc: 'Once a year, for the spring festival in Aldermouth.' },
  },
  rovers: {
    name: 'Starling Rovers Sunday XI', the: 'the Rovers', place: 'ground', icon: '⚽', sec: 'Starling Rovers',
    skill: 'Footwork', stat: 'fitness', also: 'charm', fee: 30, subs: 120, night: 10, time: 2,
    blurb: 'Sunday league football on a pitch with a slope you could ski down. Gaz Kowalski manages, on hope and meat pies. Over forty, there is the veterans’ side; after that, coaching.',
    ranks: ['on the bench', 'a regular', 'vice-captain', 'captain'],
    parts: [0, 1, 2, 3],
    opens: ['', 'A shirt in the cup run, and a penalty if it comes to that.', 'The armband when the captain is away, and a say in the team.', 'The armband, the last penalty, and the juniors on Saturday mornings.'],
    up: ['', 'Became a regular in the Starling Rovers side.', 'Made vice-captain of Starling Rovers.', 'Made captain of Starling Rovers.'],
    req: [{}, { fitness: 25 }, { fitness: 35 }, { fitness: 40, charm: 35 }],
    nightT: 'Play for the Rovers', nightD: 'Sunday’s match, and training on Wednesday. Builds your Footwork and your place in the side. Good for Fitness.',
    occ: { season: 0, name: 'the Coast Cup final', where: 'at Penhallow Park', prize: 'the Coast Cup', icon: '🏆', game: 'clubPens', gameIcon: '🥅',
      titles: ['Sit on the bench for the Coast Cup final', 'Play in the Coast Cup final', 'Play in the Coast Cup final', 'Captain the side in the Coast Cup final'] },
    vets: { name: 'the Veterans’ Shield final', prize: 'the Veterans’ Shield', icon: '🛡️' },
    drill: { title: 'Penalty practice after training', icon: '🥅', game: 'clubPens', desc: 'Played by hand. Builds your Footwork.' },
    lead: { title: 'Run the juniors on Saturday morning', icon: '🧒', desc: 'Once a year, a term of it. Good for your name in town.' },
  },
  book: {
    name: 'The Library Book Club', the: 'the book club', place: 'library', icon: '📖', sec: 'The Book Club',
    skill: 'Close reading', stat: 'smarts', also: 'charm', fee: 0, subs: 20, night: 0, time: 1,
    blurb: 'First Tuesday of the month in the reading room, after hours, with tea, biscuits and Miss Achterberg’s eyebrows. One book a season, from the library’s list: read it first.',
    ranks: ['a newcomer', 'a regular', 'a voice at the table', 'the one who chooses the books', 'in the chair'],
    parts: [0, 1, 1, 2, 3],
    opens: ['', 'A place on the club’s team at the Lit Fest quiz.', 'People wait to hear what you think.', 'You choose the book of the season.', 'The chair, and an author evening to host each year.'],
    up: ['', 'Became a regular at the library’s book club.', 'Became a voice to be reckoned with at the book club.', 'Given the choosing of the book club’s books.', 'Took the chair of the library’s book club.'],
    req: [{}, {}, {}, { smarts: 30 }, { smarts: 40 }],
    nightT: 'Go to the book club', nightD: 'An evening on the book of the season. Better if you have read it. Good for Smarts.',
    occ: { season: 2, name: 'the Lit Fest quiz', where: 'in the library', prize: 'the Silver Quill', icon: '🪶', game: 'clubBooks', gameIcon: '📚',
      titles: ['Help out at the Lit Fest', 'Join the team for the Lit Fest quiz', 'Join the team for the Lit Fest quiz', 'Captain the team at the Lit Fest quiz', 'Chair the Lit Fest, and its quiz'] },
    drill: { title: 'Brush up for the Lit Fest quiz', icon: '🔖', game: 'clubBooks', desc: 'Played by hand. Builds your Close reading.' },
    lead: { title: 'Host an author evening', icon: '🎤', desc: 'Once a year. Good for Charm and your name.' },
  },
  sailing: {
    name: 'Bay Sailing Club', the: 'the sailing club', place: 'harbour', icon: '⛵', sec: 'Bay Sailing Club',
    skill: 'Seamanship', stat: 'fitness', also: 'smarts', fee: 250, subs: 300, night: 0, time: 2,
    blurb: 'A clubhouse on stilts, a fleet of elderly dinghies, and a bar with a view of the whole bay. Captain Quinn watches the racing from the harbour wall and says nothing.',
    ranks: ['crew', 'a helm', 'race skipper', 'on the committee', 'commodore'],
    parts: [0, 1, 2, 2, 3],
    opens: ['', 'A dinghy of your own in the Gorse Head Race.', 'The club’s best boat for the race.', 'A vote on the committee, and the good mooring.', 'The commodore’s cap, and the beginners’ course to teach.'],
    up: ['', 'Given a dinghy to helm at the Bay Sailing Club.', 'Became a race skipper at the Bay Sailing Club.', 'Voted onto the committee of the Bay Sailing Club.', 'Elected commodore of the Bay Sailing Club.'],
    req: [{}, { fitness: 25 }, { fitness: 30 }, {}, { fitness: 35 }],
    nightT: 'Go sailing with the club', nightD: 'An evening on the water, or in the clubhouse when it blows. Builds your Seamanship. Good for Fitness.',
    occ: { season: 2, name: 'the Gorse Head Race', where: 'round Gorse Head and back', prize: 'the Gorse Head Salver', icon: '🥈', game: 'clubTack', gameIcon: '⛵',
      titles: ['Crew in the Gorse Head Race', 'Sail in the Gorse Head Race', 'Skipper the club’s best boat round Gorse Head', 'Skipper the club’s best boat round Gorse Head', 'Lead the fleet round Gorse Head'] },
    drill: { title: 'Practise starts in the bay', icon: '🚩', game: 'clubTack', desc: 'Played by hand. Builds your Seamanship.' },
    lead: { title: 'Teach the beginners’ course', icon: '🛟', desc: 'Once a year, a weekend of it. Good for your name in town.' },
  },
  quiz: {
    name: 'The Gull & Anchor Quiz Team', the: 'the quiz team', place: 'pub', icon: '🧠', sec: 'The quiz team',
    skill: 'General knowledge', stat: 'smarts', also: 'charm', fee: 10, subs: 40, night: 5, time: 1,
    blurb: 'The Know-It-Gulls: four chairs, one table by the dartboard, and the Bay & District Quiz League every other Wednesday. Not to be confused with quiz night, which is for amateurs.',
    ranks: ['a reserve', 'on the team', 'captain', 'question setter'],
    parts: [0, 1, 2, 3],
    opens: ['', 'A seat at the table in the league final.', 'The answer sheet, and the last word.', 'The Gull’s own quiz night, set and run by you once a year.'],
    up: ['', 'Got a seat on the Gull & Anchor’s quiz team.', 'Made captain of the Gull & Anchor’s quiz team.', 'Became the Gull & Anchor’s question setter.'],
    req: [{}, {}, { smarts: 35 }, { smarts: 45 }],
    nightT: 'Play in the quiz league', nightD: 'A league night with the team. Builds your General knowledge. Good for Smarts.',
    occ: { season: 3, name: 'the league final', where: 'at the Gull & Anchor', prize: 'the Bay League Shield', icon: '🛡️', game: 'clubQuiz', gameIcon: '❓',
      titles: ['Sit in as reserve at the league final', 'Play in the league final', 'Captain the team in the league final', 'Captain the team in the league final'] },
    drill: { title: 'Swot up with the team', icon: '📝', game: 'clubQuiz', desc: 'Played by hand. Builds your General knowledge.' },
    lead: { title: 'Set and run the Gull’s quiz night', icon: '🎙️', desc: 'Once a year. The pot goes to the lifeboat.' },
  },
};
export const CLUB_IDS = Object.keys(CLUBS);
// The Players’ summer plays, one a year.
export const PLAYS = ['Murder at Gull Cottage', 'The Lighthouse Keeper’s Daughter', 'A Month of Wet Sundays', 'Fog on the Esplanade', 'The Vicar’s Last Bicycle', 'The Mayor’s Trousers', 'Ghosts of the Merrow', 'Three Weeks in Weston', 'Tea at the Winter Gardens', 'The Bishop Who Came to Lunch'];
export const playOf = (year) => PLAYS[year % PLAYS.length];

// ---- the reading list --------------------------------------------------------------------

// len: sittings to read it. give: what finishing it the first time leaves you:
// st (skills), sk (a club’s skill), fav (a favourite: a lasting lift to the
// mood), sleep (you sleep better from then on: a little health every season),
// karma. Clementine Vane is a pen name.
export const BOOK_KINDS = { classic: 'Classics', poetry: 'Poetry', thriller: 'Thrillers', romance: 'Romance', local: 'Local history', practical: 'Practical' };
export const BOOKS = {
  harrowdene: { t: 'The Mill at Harrowdene', by: 'Eliza Thornbury', kind: 'classic', len: 5, blurb: 'Three sisters, one mill, and a will nobody can find. Nine hundred pages, every one of them worth it.', give: { st: { smarts: 3 }, sk: { book: 6 } }, done: 'The will was in the flour bin all along. You knew it would be. You weep anyway.' },
  coldharbour: { t: 'A Winter in Coldharbour', by: 'Thomas Fenwick', kind: 'classic', len: 4, blurb: 'A young doctor, a snowbound village, and a year of small kindnesses.', give: { karma: 2, fav: 1 }, done: 'The thaw comes on the last page, and you find you have been holding your breath since chapter one.' },
  cartographer: { t: 'The Cartographer’s Wife', by: 'Ada Penrose', kind: 'classic', len: 4, blurb: 'She drew the maps. He took the credit. Then he went to sea, and she kept drawing.', give: { st: { smarts: 2, craft: 1 } }, done: 'The last map is of her own garden, drawn to scale. You look at your own windowsill differently.' },
  afternoon: { t: 'The Long Afternoon', by: 'Gideon Strand', kind: 'classic', len: 4, blurb: 'A country house, one hot summer, and everybody pretending not to know what is coming.', give: { st: { smarts: 2 }, fav: 1 }, done: 'Nothing happens, beautifully, for three hundred pages. Then everything does.' },
  ashby: { t: 'Ten Bells for Mr Ashby', by: 'Hugh Lattimer', kind: 'classic', len: 3, blurb: 'A comic novel about a bell-ringer, a feud, and a peal that takes four hours.', give: { st: { charm: 1 }, fav: 1 }, done: 'You laugh out loud on the bus, twice, and a stranger asks what you are reading.' },
  drowned: { t: 'The Drowned Parish', by: 'Morwenna Trask', kind: 'classic', len: 4, blurb: 'Three generations of boatbuilders, and the village the sea took back.', give: { st: { craft: 2, smarts: 1 } }, done: 'The last boat is launched on the last page. You can smell the tar.' },
  smallhours: { t: 'Small Hours', by: 'Iris Calloway', kind: 'poetry', len: 2, blurb: 'Short poems for the middle of the night: kettles, foxes, and the people we miss.', give: { st: { craft: 1 }, fav: 1 }, done: 'You copy one out and stick it on the fridge.' },
  salt: { t: 'Salt, and Other Poems', by: 'Ewan Blackmore', kind: 'poetry', len: 2, blurb: 'Poems of the coast, written to be read aloud, preferably into a gale.', give: { sk: { players: 4, choir: 2 } }, done: 'You start reading them aloud, and find you cannot stop. The neighbours have opinions.' },
  dunmore: { t: 'Dead Calm at Dunmore Point', by: 'Jack Harrow', kind: 'thriller', len: 3, blurb: 'A body in a lobster pot, and a detective who gets seasick.', give: { st: { smarts: 2 }, sk: { quiz: 3 } }, done: 'It was the harbourmaster. It is always the harbourmaster. You are glad, on the whole, that it is only a book.' },
  ninth: { t: 'The Ninth Signal', by: 'Rhona Kerr', kind: 'thriller', len: 3, blurb: 'A spy, a lighthouse, and a message in a code nobody has used since the war.', give: { st: { smarts: 2 }, sk: { quiz: 3 } }, done: 'You stay up until two to finish it, and then lie awake decoding the clock.' },
  coldtea: { t: 'Cold Tea at the Vicarage', by: 'D. M. Bellweather', kind: 'thriller', len: 2, blurb: 'A murder at the church fête. The vicar is not a suspect; the vicar’s bees are.', give: { fav: 1 }, done: 'Solved by the vicar’s housekeeper, over a scone. Exactly as it should be.' },
  coastroad: { t: 'Black Ice on the Coast Road', by: 'Frank Sallis', kind: 'thriller', len: 3, blurb: 'A night drive, a stranger in the back seat, and forty miles of cliff.', give: { st: { smarts: 1.5, fitness: 0.5 } }, done: 'You will never drive the coast road at night again, or not without the radio on.' },
  accountant: { t: 'The Quiet Accountant', by: 'Harriet Vale', kind: 'thriller', len: 3, blurb: 'Fraud, fear and spreadsheets: the most exciting book about double-entry ever written.', give: { st: { smarts: 3 } }, done: 'The ledger balances on the last page, and so, nearly, does justice.' },
  overboard: { t: 'Overboard', by: 'Callum Rees', kind: 'thriller', len: 3, blurb: 'A yacht race, a crew of six, and five of them come home.', give: { st: { smarts: 1 }, sk: { sailing: 4 } }, done: 'You learn a great deal about knots, and more than you wanted about being in the sea at night.' },
  vane1: { t: 'The Lighthouse Keeper’s Heart', by: 'Clementine Vane', kind: 'romance', len: 3, blurb: 'A lonely keeper, a lost yachtswoman, and a storm that lasts exactly long enough.', give: { st: { charm: 2 }, fav: 1 }, done: 'They kiss on the gallery with the lamp going round. You pretend you are not moved. You are moved.' },
  vane2: { t: 'A Kiss at Low Tide', by: 'Clementine Vane', kind: 'romance', len: 3, blurb: 'Two rival cockle-pickers, one sandbank, and the tide coming in.', give: { st: { charm: 2 } }, done: 'Rescued by the lifeboat in the last chapter, in each other’s arms. The coxswain says nothing, which seems right.' },
  vane3: { t: 'Summer of the Swarm', by: 'Clementine Vane', kind: 'romance', len: 3, blurb: 'A vicar who keeps bees, a beekeeper who does not believe, and a very hot July.', give: { st: { charm: 2 } }, done: 'The vicar in it is a lot like somebody, though you could not say who, and would not.' },
  gentleman: { t: 'The Gentleman Farmer', by: 'Lavinia Rose', kind: 'romance', len: 3, blurb: 'A brooding farmer, a footpath, and a woman from the council.', give: { st: { charm: 1.5 } }, done: 'The farmer in it is nothing like Tom Windle. He talks to people, for a start.' },
  seaview: { t: 'Second Chances at the Seaview', by: 'Polly Marchmont', kind: 'romance', len: 2, blurb: 'A seaside guest house, two old flames, and a breakfast that goes on until lunch.', give: { fav: 1 }, done: 'Warm as toast, and you finish it in the bath.' },
  waltz: { t: 'The Last Waltz at the Winter Gardens', by: 'Lavinia Rose', kind: 'romance', len: 3, blurb: 'A dance hall on the pier, the summer of 1951, and a band that will not stop playing.', give: { st: { charm: 1 }, sk: { players: 3 } }, done: 'You find yourself practising a box step in the kitchen.' },
  objects: { t: 'Starling Bay in Forty Objects', by: 'R. Achterberg', kind: 'local', len: 4, blurb: 'The town’s history, told through forty things in the archive: a ship’s bell, a ration book, a mayor’s false teeth.', give: { st: { smarts: 2 }, sk: { quiz: 4 } }, done: 'The author thanks “the patience of the Town Archive”, which is to say herself.' },
  merrow: { t: 'The Loss of the Merrow', by: 'Josiah Tregenza', kind: 'local', len: 3, blurb: 'The wreck that every old fisherman in the Bay has a story about. This is the version with footnotes.', give: { st: { smarts: 1.5 }, fav: 1 }, done: 'Old Marlow’s version has more sea serpents. You prefer his, but you are glad to know.' },
  knots: { t: 'The Pocket Book of Knots', by: 'Cdr R. Pascoe', kind: 'practical', len: 2, blurb: 'Every knot worth tying, with pictures, and a few that are only for showing off.', give: { st: { craft: 1 }, sk: { sailing: 6 } }, done: 'You can tie a bowline behind your back. You do, often, unasked.' },
  voice: { t: 'Sing Out! A Book of the Voice', by: 'Dame Hester Lyle', kind: 'practical', len: 3, blurb: 'Breathing, posture, and why you must never sing with a cold or a cheese sandwich.', give: { st: { craft: 1 }, sk: { choir: 6 } }, done: 'You sing in the shower with your feet planted, as instructed. It is noticeably better.' },
  fright: { t: 'Stage Fright and How to Beat It', by: 'Max Ferrante', kind: 'practical', len: 2, blurb: 'A short, kind book for anybody whose knees have ever knocked.', give: { st: { charm: 1 }, sk: { players: 6 } }, done: 'Picture the audience in their pyjamas, it says. You try it on the bus. It works too well.' },
  ninety: { t: 'Ninety Minutes: Football from the Grass Up', by: 'Ron Gilchrist', kind: 'practical', len: 3, blurb: 'A life in the lower leagues, and everything it taught one man about passing.', give: { st: { fitness: 1 }, sk: { rovers: 6 } }, done: 'Pass and move, he says, pass and move. You find yourself doing it in the supermarket.' },
  facts: { t: 'Ten Thousand Things Worth Knowing', by: 'compiled by Mabel Quayle', kind: 'practical', len: 4, blurb: 'Rivers, kings, capitals, knots, birds and bones. Arranged for dipping into.', give: { st: { smarts: 1 }, sk: { quiz: 8 } }, done: 'You now know the collective noun for crows, and cannot stop telling people.' },
  talk: { t: 'How to Talk to Anyone at All', by: 'Celia Moon', kind: 'practical', len: 2, blurb: 'Questions to ask, names to remember, and how to leave a conversation without a fire alarm.', give: { st: { charm: 3 } }, done: 'You remember the name of the man in the paper shop. He is visibly moved.' },
  bench: { t: 'The Woodworker’s Bench Book', by: 'Ezra Dunn', kind: 'practical', len: 3, blurb: 'Joints, planes, and a whole chapter on sharpening, which is the important bit.', give: { st: { craft: 3 } }, done: 'You make a small shelf. It is level. You check it every day for a week.' },
  sleep: { t: 'A Good Night’s Sleep', by: 'Dr Anwen Price', kind: 'practical', len: 2, blurb: 'No screens, a cool room, and a cup of something warm. Simple, and it works.', give: { sleep: 1 }, done: 'You fall asleep reading the last chapter, which the author would take as a compliment.' },
  couch: { t: 'From the Sofa to the Cliff Path', by: 'Dr Anwen Price', kind: 'practical', len: 2, blurb: 'Nine weeks from a walk to the end of the road to a run along Gorse Head.', give: { st: { fitness: 3 } }, done: 'You try week one. Then, somewhat to your surprise, week two.' },
};
export const BOOK_IDS = Object.keys(BOOKS);
// What the book club reads: everything but the practical books.
export const CLUB_READS = BOOK_IDS.filter((id) => BOOKS[id].kind !== 'practical');
const VANE = ['vane1', 'vane2', 'vane3'];
// Every book on the list, for the trophy.
export const READ_ALL = BOOK_IDS.length;

export function install({ def, Life, clamp, hooks, addEvents }) {
  Object.assign(TROPHIES, {
    clubSilver: { name: 'Silverware', icon: '🏆', desc: 'Win something with a club.', test: (L) => (L.s.clubs ? L.s.clubs.cab.length : 0) >= 1 },
    clubCabinet: { name: 'A full cabinet', icon: '🗄️', desc: 'Win eight pieces of club silverware in one life.', test: (L) => (L.s.clubs ? L.s.clubs.cab.length : 0) >= 8 },
    clubTop: { name: 'Pillar of the club', icon: '🎖️', desc: 'Rise to the top of a club.', test: (L) => !!(L.s.clubs && L.s.clubs.f.top) },
    clubJoiner: { name: 'Joiner', icon: '📋', desc: 'Belong to four clubs at once.', test: (L) => !!L.s.clubs && Object.keys(L.s.clubs.m).length >= 4 },
    clubLong: { name: 'Long service', icon: '📜', desc: 'Twenty years in one club.', test: (L) => !!L.s.clubs && (L.s.clubs.f.long || 0) >= 20 },
    clubCup: { name: 'Since 1987', icon: '⚽', desc: 'Win a cup with Starling Rovers.', test: (L) => !!L.s.clubs && L.s.clubs.cab.some((e) => e.c === 'rovers') },
    readTen: { name: 'Bookworm', icon: '🐛', desc: 'Finish ten books from the library’s reading list.', test: (L) => !!L.s.clubs && Object.keys(L.s.clubs.read).length >= 10 },
    readAll: { name: 'Read the lot', icon: '📚', desc: 'Finish every book on the library’s reading list.', test: (L) => !!L.s.clubs && Object.keys(L.s.clubs.read).length >= READ_ALL },
    readSecret: { name: 'Sworn to secrecy', icon: '🤫', desc: 'Keep Miss Achterberg’s secret.', test: (L) => !!(L.s.clubs && L.s.clubs.f.secret) },
  });

  // ---- what a Life can tell you about its clubs -------------------------------------------

  Object.assign(Life.prototype, {
    clubMem(id) { return this.s.clubs.m[id] || null; },
    clubSkill(id) { return this.s.clubs.sk[id] || 0; },
    clubRankName(id) { const m = this.clubMem(id); return m ? CLUBS[id].ranks[m.r] : ''; },
    // Your part in the occasion: 0 none, 1 to 3 a bigger one; -1 the Rovers’ coach.
    clubPart(id) {
      const m = this.clubMem(id);
      if (!m) return 0;
      if (id === 'rovers' && m.mode === 'coach') return -1;
      return CLUBS[id].parts[m.r];
    },
    // The occasion as it stands for you: its name, prize and icon (the Rovers’
    // veterans have their own), whether it is on now, and whether you have been.
    clubOcc(id) {
      const c = CLUBS[id], m = this.clubMem(id), vets = id === 'rovers' && !!m && m.mode === 'vets';
      const o = vets ? { ...c.occ, ...c.vets } : c.occ;
      const now = this.season === o.season, done = !!m && m.occ === this.year;
      return { ...o, now, done, open: now && !done && !!m && (id !== 'rovers' || this.clubCupFinal()) };
    },
    // The Rovers’ cup run: rounds in the autumn and winter, the final in the spring.
    clubCupYear() { return this.season >= 2 ? this.year : this.year - 1; },
    clubCupFinal() { const m = this.clubMem('rovers'), k = m && m.cup; return !!k && k.y === this.year - 1 && k.r >= 2 && !k.out; },
    clubCupWord() {
      const m = this.clubMem('rovers'), k = m && m.cup, y = this.clubCupYear(), cup = m && m.mode === 'vets' ? 'the Veterans’ Shield' : 'the Coast Cup';
      if (this.season === 1) return `The first round of ${cup} is in the autumn.`;
      if (!k || k.y !== y || k.late) return this.season === 0 ? 'The cup run went on without you this year. It starts again in the autumn.' : `The first round of ${cup} is this autumn.`;
      if (k.out) return `Out of ${cup} in the ${k.r ? 'semi-final' : 'first round'}. Next autumn, perhaps.`;
      if (k.r >= 2) return this.season === 0 ? (m.occ === this.year ? 'The final has been played.' : `Rovers are in the final of ${cup}, this spring.`) : 'Through to the final, in the spring.';
      return k.r === 1 ? 'Through to the semi-final, in the winter.' : `The first round of ${cup} is this autumn.`;
    },
    // What the next rank asks for, as a checklist; null at the top.
    clubNeeds(id) {
      const c = CLUBS[id], m = this.clubMem(id);
      if (!m) return null;
      const i = m.r + 1, T = c.ranks.length === 5 ? NEED5 : NEED4;
      if (!c.ranks[i]) return null;
      const sk = this.clubSkill(id), out = [
        { text: `Standing ${T.st[i]}`, ok: m.st >= T.st[i] },
        { text: `${c.skill} ${T.sk[i]}`, ok: sk >= T.sk[i] },
        { text: `${T.n[i]} club nights (${Math.min(m.n, T.n[i])} so far)`, ok: m.n >= T.n[i] },
      ];
      for (const [k, v] of Object.entries(c.req[i] || {})) out.push({ text: `${STAT_NAME[k]} ${v}`, ok: this.s.st[k] >= v });
      return out;
    },
    clubStandWord(id) { const m = this.clubMem(id), v = m ? m.st : 0; return v >= 80 ? 'One of the pillars' : v >= 60 ? 'Well thought of' : v >= 40 ? 'One of the regulars' : v >= 20 ? 'A familiar face' : 'Hardly known yet'; },
    // Fellow members you know: friends (and anyone closer) tagged with the club.
    clubFriends(id) { return this.s.people.filter((p) => p.club === id && ['friend', 'partner', 'spouse'].includes(p.kind)); },
    // What the screen needs to play a club’s game: for the occasion or for practice.
    clubGame(id, what) {
      const c = CLUBS[id], m = this.clubMem(id), part = Math.max(0, this.clubPart(id));
      const ease = clamp(0.65 * this.clubSkill(id) / 100 + 0.35 * this.s.st[c.stat] / 100, 0, 1);
      if (what === 'occ') { const o = this.clubOcc(id); return { id: o.game, title: cap(o.name), icon: o.gameIcon, level: clamp(1 + part, 0, 5), ease, skill: c.skill }; }
      return { id: c.drill.game, title: c.drill.title, icon: c.drill.icon, level: clamp(m ? m.r : 0, 0, 5), ease, skill: c.skill };
    },
    // The library book you have out, with its progress.
    bookNow() { const b = this.s.clubs.book; return b ? { ...BOOKS[b.id], id: b.id, p: b.p } : null; },
    // What the book club is reading in season t (yours, if you chose it).
    bookOfSeason(t = this.s.t) { const c = this.s.clubs; return c.pick && c.pick.t === t ? c.pick.id : CLUB_READS[(c.bco + t) % CLUB_READS.length]; },
    booksRead() { return Object.keys(this.s.clubs.read).length; },
  });

  // ---- the workings -----------------------------------------------------------------------

  const mem = (L, id) => L.s.clubs.m[id];
  // A club’s own skill grows more slowly the higher it is.
  const learn = (L, id, base) => { const c = L.s.clubs, v = c.sk[id] || 0; c.sk[id] = clamp(v + base * (1 - v / 110), 0, 100); };
  const stand = (m, d) => { m.st = clamp(m.st + d, 0, 100); };
  const fellows = (L, id, d) => { for (const p of L.clubFriends(id)) L.bond(p, d); };
  // Sometimes a fellow member becomes a friend.
  const meetOne = (L, id, ch) => (L.friends().length < 20 && L.chance(ch) ? L.meet({ club: id }) : null);
  const turnUp = (L, m) => { m.last = L.s.t; m.miss = 0; };

  // Up a rank, if every need is met: one step at a time.
  function promote(L, id) {
    const s = L.s, c = CLUBS[id], m = mem(L, id), need = L.clubNeeds(id);
    if (!need || !need.every((n) => n.ok)) return '';
    m.r++;
    s.clubs.past[id] = { n: m.n, r: Math.max(m.r, (s.clubs.past[id] || {}).r || 0) };
    if (m.r === c.ranks.length - 1) s.clubs.f.top = 1;
    L.joy(5);
    L.note(c.up[m.r], 'big');
    L.say(c.icon, `${c.name}: ${c.ranks[m.r]}`, 'promo');
    return ` ${c.up[m.r]} ${c.opens[m.r]}`;
  }

  // Leaving, or being let go: what you had is remembered, the standing is not.
  function lapse(L, id, left) {
    const s = L.s, m = mem(L, id), c = CLUBS[id], was = s.clubs.past[id] || {};
    s.clubs.past[id] = { n: m.n, r: Math.max(m.r, was.r || 0) };
    delete s.clubs.m[id];
    L.note(left ? `Left ${c.name}.` : `${c.name} stopped expecting you.`);
  }

  // One round of the Rovers’ cup run. here: you played in it (a club night).
  function cupRound(L, here) {
    const s = L.s, m = mem(L, 'rovers'), y = L.clubCupYear(), k = L.season === 2 ? 0 : 1;
    if (!m.cup || m.cup.y !== y) m.cup = { y, r: 0, out: false, p: [] };
    const cup = m.cup;
    if (cup.out || cup.p.includes(k) || cup.r < k) return '';
    cup.p.push(k);
    const part = L.clubPart('rovers'), sk = L.clubSkill('rovers');
    const p = !here ? 0.45 : part < 0 ? 0.52 + sk / 600 + s.st.charm / 700 : 0.5 + 0.05 * part + sk / 600;
    const cupName = m.mode === 'vets' ? 'the Veterans’ Shield' : 'the Coast Cup';
    if (L.chance(clamp(p, 0.2, 0.85))) {
      cup.r++;
      if (cup.r >= 2) { L.note(`Starling Rovers reached the final of ${cupName}.`); return ` And it was a cup tie: Rovers are through to the final of ${cupName}, in the spring.`; }
      return ` And it was a cup tie: Rovers are through to the semi-final of ${cupName}.`;
    }
    cup.out = true;
    return here ? ` It was a cup tie, and Rovers go out of ${cupName}.` : '';
  }

  // How the big day went. res: 0 a poor night, 1 a good showing, 2 a win.
  // Rewards rise with your part in it (1 to 3).
  function settle(L, id, res, part, text) {
    const s = L.s, c = CLUBS[id], m = mem(L, id), o = L.clubOcc(id);
    L.joy([-1, 4 + part, 8 + 2 * part][res]);
    L.fame([0, 0.2 * part, 0.4 + 0.4 * part][res]);
    stand(m, [1, 5, 10 + 2 * part][res]);
    learn(L, id, [1.5, 2.5, 3.5][res]);
    fellows(L, id, [1, 3, 6][res]);
    L.gain(c.stat, 1.2);
    s.clubs.n.occ = (s.clubs.n.occ || 0) + 1;
    if (res === 2) {
      s.clubs.cab.push({ c: id, y: L.year, a: s.age, name: o.prize, icon: o.icon });
      L.note(`Won ${o.prize} with ${c.name}.`, 'big');
      L.say(o.icon, `${cap(o.prize)}!`, 'good');
    }
    const p = meetOne(L, id, [0.1, 0.2, 0.35][res]);
    if (p) text += ` Afterwards, ${p.name} buys you a drink and does not stop talking until closing time. A friend.`;
    return text + promote(L, id);
  }

  // ---- what you can do --------------------------------------------------------------------

  for (const [id, c] of Object.entries(CLUBS)) {
    const place = c.place, sec = c.sec;
    def(`clubAbout_${id}`, {
      place, sec, icon: c.icon, title: c.name, time: 0, open: `club_${id}`,
      desc: (L) => { const m = L.clubMem(id); return m ? `You are ${c.ranks[m.r]}. ${L.clubStandWord(id)}.` : `What it is, what it costs, and who is in it. To join: ${c.fee ? money(c.fee) : 'free'}, then ${money(c.subs)} a year.`; },
    });
    def(`clubJoin_${id}`, {
      place, sec, icon: '✍️', title: `Join ${c.name}`, time: 0, cost: c.fee,
      desc: `${c.fee ? money(c.fee) : 'Free'} to join, then ${money(c.subs)} a year in subs. Turn up about once a season, or they stop expecting you.`,
      show: (L) => !L.clubMem(id),
      why: (L) => (id === 'sailing' && L.s.st.fitness < 20 ? 'Needs Fitness 20: you will be hanging off the side of a dinghy.' : null),
      run(L) {
        const s = L.s, was = s.clubs.past[id];
        const m = { st: was ? 15 : 10, r: 0, n: was ? was.n : 0, since: s.t, last: s.t, miss: 0, occ: -1, lead: -99 };
        if (id === 'rovers') {
          m.mode = s.age >= COACH_AGE ? 'coach' : s.age >= VETS_AGE ? 'vets' : 'play';
          // (Joining partway through a cup run: in the winter they are already through a round; in the spring it is over.)
          if (L.season === 3) m.cup = { y: L.year, r: 1, out: false, p: [0] };
          else if (L.season === 0) m.cup = { y: L.year - 1, r: 0, out: true, p: [0, 1], late: 1 };
        }
        s.clubs.m[id] = m;
        if (!s.clubs.joined[id]) { s.clubs.joined[id] = 1; L.note(`Joined ${c.name}.`); }
        else L.note(`Joined ${c.name} again.`);
        const hi = { choir: 'The Reverend Hollis listens to you sing a scale, says “lovely” in a voice that means “we will work on it”, and finds you a cassock.',
          players: 'Desmond looks at you for a long time, then says, “Yes. Yes, I see it.” What he sees, he does not say.',
          rovers: m.mode === 'coach' ? 'Gaz shakes your hand, gives you a clipboard and a whistle, and says the youngsters need someone who will not shout.' : m.mode === 'vets' ? 'Gaz looks at your knees, then at you, and signs you up for the veterans’ side.' : 'Gaz looks you up and down, offers you a pie, and gives you a shirt with the number 14 on it, and a hole.',
          book: 'Miss Achterberg writes your name in the club’s book in green ink, and hands you a list of the season’s reading.',
          sailing: 'The commodore issues you with a life jacket, a locker key, and a warning about the boom.',
          quiz: 'The team looks you over, asks you the capital of Peru, and makes room at the table.' };
        return `${hi[id]}${was ? ' It is good to be back.' : ''}`;
      },
    });
    def(`clubNight_${id}`, {
      place, sec, icon: c.icon, time: c.time, cost: c.night, per: 1,
      title: (L) => (id === 'rovers' && L.clubMem(id) ? { play: 'Play for the Rovers', vets: 'Turn out for the Rovers’ veterans', coach: 'Coach the Rovers’ youngsters' }[L.clubMem(id).mode] : c.nightT),
      desc: (L) => {
        const m = L.clubMem(id);
        if (id === 'book' && m) { const b = BOOKS[L.bookOfSeason()]; return `This season: ${b.t}, by ${b.by}.${L.s.clubs.read[L.bookOfSeason()] ? ' You have read it.' : ' Read it first, from the library.'}`; }
        if (id === 'rovers' && m && m.mode === 'coach') return 'Drills, team talks and a great deal of standing in the cold. Builds your Footwork and your standing. Good for Charm.';
        return m && m.miss >= 2 ? `They have not seen you for ${m.miss} seasons. Your standing is slipping.` : c.nightD;
      },
      show: (L) => !!L.clubMem(id),
      run: (L) => night(L, id),
    });
    def(`clubDrill_${id}`, {
      place, sec, icon: c.drill.icon, title: c.drill.title, desc: c.drill.desc, time: 1, per: 1,
      show: (L) => !!L.clubMem(id),
      why: (L, x) => (x == null || (typeof x === 'number' && x >= 0 && x <= 1) ? null : 'Not like that.'),
      run(L, x) {
        const s = L.s, m = mem(L, id), q = typeof x === 'number' ? x : 0.5;
        learn(L, id, 1.5 + 3.5 * q);
        L.gain(c.stat, 0.8); L.joy(1 + 2 * q);
        if (q >= 0.65) stand(m, 1);
        const said = q >= 0.9 ? 'You could not have done it better.' : q >= 0.65 ? 'A good session.' : q >= 0.35 ? 'Some of it went in.' : 'Not your night, but it all counts.';
        return `${said} ${{ choir: 'The organist plays it once more, slowly, and nods.', players: 'Desmond reads every other part, with feeling.', rovers: 'The keeper is Gaz’s nephew, and he is getting better too.', book: 'Miss Achterberg sets the questions and marks them, in green.', sailing: 'Start after start, until the gun stops making you jump.', quiz: 'Rivers, kings, flags and birds, until closing time.' }[id]}${promote(L, id)}`;
      },
    });
    def(`clubOcc_${id}`, {
      place, sec, icon: c.occ.icon,
      title: (L) => { const m = L.clubMem(id), o = L.clubOcc(id); if (id === 'rovers' && m && m.mode === 'coach') return `Manage the side in ${o.name}`; return m ? c.occ.titles[m.r].replace(c.occ.name, o.name) : cap(o.name); },
      desc: (L) => { const part = L.clubPart(id), o = L.clubOcc(id); return part > 0 ? `Once a year, ${o.where}, played by hand. How it goes is up to you, your ${c.skill} and your standing. Fame, friends, and ${o.prize} if you win.` : part < 0 ? `Once a year, ${o.where}. You pick the team talk.` : `Once a year, ${o.where}. You have no part to play yet, but it would be noticed if you were not there.`; },
      time: (L) => (L.clubPart(id) === 0 ? 1 : 2), per: 1,
      show: (L) => L.clubOcc(id).open,
      why: (L, x) => (x == null || (typeof x === 'number' && x >= 0 && x <= 1) ? null : 'Not like that.'),
      run: (L, x) => occasion(L, id, x),
    });
    def(`clubLead_${id}`, {
      place, sec, icon: c.lead.icon, title: c.lead.title, desc: c.lead.desc, time: 2,
      show: (L) => { const m = L.clubMem(id); return !!m && m.r === c.ranks.length - 1; },
      why: (L) => (L.s.t - L.clubMem(id).lead < 4 ? 'Once a year: not again until next year.' : null),
      run: (L) => lead(L, id),
    });
  }
  def('clubLeave', {
    time: 0,
    why: (L, id) => (CLUBS[id] && L.clubMem(id) ? null : 'You are not a member.'),
    run(L, id) { lapse(L, id, true); L.joy(-1); return `You hand back the ${{ choir: 'cassock', players: 'script', rovers: 'shirt', book: 'reading list', sailing: 'locker key', quiz: 'pencil' }[id]}. ${CLUBS[id].name} wishes you well, and means it.`; },
  });
  // The Rovers: hang up your boots and coach, or pull them back on.
  def('roversCoach', {
    place: 'ground', sec: 'Starling Rovers', icon: '📋', title: 'Hang up your boots and coach', time: 0,
    desc: 'Stop playing and coach the side instead: Charm counts for more than legs.',
    show: (L) => { const m = L.clubMem('rovers'); return !!m && m.mode !== 'coach' && (L.s.age >= 35 || m.r >= 2); },
    run(L) { mem(L, 'rovers').mode = 'coach'; L.note('Hung up your boots, and started coaching Starling Rovers.'); return 'You hang your boots on a nail in the clubhouse. Gaz gives you a whistle on a string, which is as near as he comes to a ceremony.'; },
  });
  def('roversBoots', {
    place: 'ground', sec: 'Starling Rovers', icon: '👟', title: (L) => (L.s.age >= VETS_AGE ? 'Play for the veterans again' : 'Pull your boots back on'), time: 0,
    desc: (L) => (L.s.age >= VETS_AGE ? 'Back on the pitch with the over-forties.' : 'Back on the pitch with the first team.'),
    show: (L) => { const m = L.clubMem('rovers'); return !!m && m.mode === 'coach' && L.s.age < COACH_AGE; },
    run(L) { const m = mem(L, 'rovers'); m.mode = L.s.age >= VETS_AGE ? 'vets' : 'play'; return 'The boots come down off the nail. They are stiffer than you remember, and so are you.'; },
  });

  const NIGHT = {
    choir: ['An hour on one bar of the Magnificat. By the end, it is the best bar in the county.', 'The Reverend Hollis conducts with a pencil, and drops it twice. You sing better every time.', 'You are told to breathe from your feet. Nobody knows what this means. Everybody tries.', 'Tea, shortbread, and the old argument about whether to do the Stanford again.', 'A new anthem, sung at sight. Somebody turns two pages at once, and so, loyally, does everybody else.'],
    players: ['A read-through that goes on until ten. Desmond does all the voices, including yours.', 'Two hours painting a door that will be on stage for four minutes. It is a very good door.', '“In the West End,” says Desmond, “we did this scene in one take.” You do it in eleven.', 'Blocking: who stands where. You stand in the wrong place with total conviction.', 'A costume fitting, a wig that smells of mothballs, and an argument about a ruff.'],
    rovers: ['A 3–1 defeat, but you hit the bar once, and the bar is still shaking.', 'Training in the dark, under one floodlight and a car’s headlamps. Gaz shouts “SHAPE!” at intervals.', 'A scrappy 1–0 win over the Fire Brigade XI. You are hosed down afterwards, which is a tradition.', 'Ninety minutes on the slope: downhill in the first half, and uphill, with feeling, in the second.', 'A 2–2 draw, both goals from a corner nobody was marking. Gaz eats a celebratory pie.'],
    vets: ['The veterans: walking pace, a great deal of shouting, and a strict rule against slide tackles.', 'Forty minutes each way for the over-forties, and a long sit down after.', 'You score with a header you will describe, for years, as deliberate.', 'Rovers Vets 1, Gullhaven Vets 1, and two hamstrings.'],
    coach: ['You run a session on passing. They pass mostly to the other team, but with more confidence.', 'You take the youngsters through their drills. One of them can really play.', 'Half-time team talk: you say “calm” eleven times. It works, more or less.', 'You stand on the touchline in the rain with a clipboard, and are, for ninety minutes, completely happy.'],
    sailing: ['Club racing round the buoys in the bay. You gybe at the wrong mark, but you gybe beautifully.', 'A long reach out to the point and back, the boat humming and the spray in your teeth.', 'An evening on the slipway varnishing a mast, and the bar opens at seven, as it always has.', 'You crew for the commodore, who shouts “Lee-oh!” as if it were a personal insult.'],
    quiz: ['A league night. You know the capital of Mongolia, and say so in a whisper, with great force.', 'Second to the Fire Brigade by a point, lost on the year of a battle you were sure of.', 'A win! The picture round is birds, and somebody on the team turns out to be very good at birds.', 'A long argument about whether a tomato is a fruit. You all write fruit, and are right.'],
  };

  // A club night.
  function night(L, id) {
    const s = L.s, c = CLUBS[id], m = mem(L, id), sk = L.clubSkill(id);
    m.n++; turnUp(L, m);
    let up = 7 + sk / 20 + s.st.charm / 40, learnt = 3 + s.st[c.stat] / 30, joy = 4, text;
    let stat = c.stat, also = c.also;
    const calm = !['storm', 'snow'].includes(s.wx);
    if (id === 'rovers') {
      if (m.mode === 'coach') { stat = 'charm'; also = 'smarts'; }
      text = s.wx === 'snow' ? 'The match is snowed off, so it is five-a-side in the church hall, round the trestle tables.' : L.season === 1 ? 'The close season: five-a-side on the sand, and Gaz’s fitness drills, which are mostly running towards pies.' : m.mode === 'play' && m.r === 0 && L.chance(0.5) ? 'Eighty-five minutes on the bench, five on the pitch, and one touch of the ball. It was a good touch.' : L.pick(NIGHT[m.mode === 'play' ? 'rovers' : m.mode]);
      if (L.season >= 2) text += cupRound(L, true);
    } else if (id === 'sailing') {
      if (!calm || L.season === 3) { learnt *= 0.6; text = L.season === 3 ? 'The boats are laid up for the winter, so it is splicing in the clubhouse and stories round the stove.' : 'No boats out in this. You learn three new knots in the clubhouse and forget two on the way home.'; } else text = L.pick(NIGHT.sailing);
    } else if (id === 'book') {
      const b = L.bookOfSeason(), bk = BOOKS[b], read = !!s.clubs.read[b], mine = s.clubs.pick && s.clubs.pick.t === s.t;
      if (read) { up += 4 + (mine ? 3 : 0); learnt += 2; joy += 2; text = L.pick([`You have read ${bk.t}, and it shows. You say something about the ending that silences the room, in a good way.`, `${bk.t}: you came with notes. Miss Achterberg looks at you as if you were a first edition.`]); if (mine) text += ' It was your choice, and it goes down well.'; }
      else if (s.clubs.book && s.clubs.book.id === b) { up += 1; text = `You are partway through ${bk.t}, so you nod at the bits about the ending and hope for the best.`; }
      else { up -= 4; learnt *= 0.6; text = L.pick([`You have not read ${bk.t}. Nobody can tell for twenty minutes, and then everybody can.`, `You have not read ${bk.t}. You eat a great many biscuits, thoughtfully.`]); }
    } else text = L.pick(NIGHT[id]);
    stand(m, up);
    learn(L, id, learnt);
    L.gain(stat, 1.6); L.gain(also, 0.6); L.joy(joy);
    fellows(L, id, 3);
    const p = meetOne(L, id, 0.2);
    if (p) text += ` You get talking to ${p.name} afterwards, and it turns out you live four streets apart.`;
    return text + promote(L, id);
  }

  const OCC_SAID = {
    choir: {
      help: (won) => `Too new to sing at the contest, you hand out programmes in the cathedral porch and shush a man with a cough. ${won ? 'St Brigid’s take the Rose Bowl, and you cheer louder than anyone.' : 'St Brigid’s come third of five. The cake on the coach home is excellent.'}`,
      0: (part) => (part === 3 ? 'Your solo comes. Your voice cracks on the high G and does not quite come back. The choir carries you home, the way choirs do.' : 'A nervous night: the sopranos come in a bar early, you come in with them, and the Aldermouth Singers win by a mile.'),
      1: (part) => `A lovely sound under the cathedral roof, and second place by a whisker. The judges single out ${part === 3 ? 'the soloist, kindly' : 'the altos'}.`,
      2: (part) => (part === 3 ? 'Your solo rises up into the roof of Aldermouth Cathedral, and for a moment nobody breathes. St Brigid’s take the Rose Bowl.' : 'St Brigid’s sing like a choir twice their size, and take the Aldermouth Rose Bowl home on the coach, wrapped in a cardigan.'),
    },
    players: {
      help: (won, L) => `You are in the chorus of ${playOf(L.year)}: a villager, a sailor, and for one scene a bush. ${won ? 'It is a hit, and the bush gets a laugh.' : 'It goes well enough, and nobody complains about the bush.'}`,
      0: (part, L) => (part >= 2 ? `You dry in the second act of ${playOf(L.year)}, completely. The prompter has lost her place. Desmond, in the wings, mouths something that is either your line or a prayer.` : `${playOf(L.year)} has its moments, most of them not in the script. A door sticks; a ghost sneezes; you say your line to the wrong person.`),
      1: (part, L) => `${playOf(L.year)} goes down well: full houses for three nights, and a kind notice in the Gazette.${part >= 2 ? ' Your name is in it, spelt nearly right.' : ''}`,
      2: (part, L) => (part === 3 ? `${playOf(L.year)} is the talk of the town. You take four curtain calls, and the Players take the Bay Drama Award. Desmond says it is the best thing he has seen since the West End, and means it.` : `${playOf(L.year)} is a triumph, and the Pavilion Players take the Bay Drama Award. You have ${part === 2 ? 'the second-best part' : 'six lines'}, and the audience loves every one.`),
    },
    rovers: {
      help: (won, L) => `You are on the bench for ${L.clubOcc('rovers').name}, and stay there. ${won ? 'Rovers win on penalties, and you are in the photograph, at the edge, grinning.' : 'Rovers lose on penalties. Gaz sits in the centre circle for a long time.'}`,
      0: (part) => (part === 3 ? 'It comes down to the last penalty, and the captain takes it. You. It hits the post, and the post wins.' : 'It goes to penalties, and yours is saved, low to the keeper’s left. Rovers lose. The keeper shakes your hand, which is worse.'),
      1: () => 'A 2–2 draw and penalties. You score yours, but somebody does not. Runners-up, a medal anyway, and a long night at the Gull.',
      2: (part, L, first) => `${part === 3 ? 'You take the last penalty, and roll it into the corner as if you were posting a letter.' : 'It goes to penalties. You score, the keeper guesses wrong, and when the last one goes in the whole ground comes onto the pitch.'} ${cap(L.clubOcc('rovers').prize)} is Starling Rovers’${first ? ' first silverware since 1987' : ' again'}, and Gaz cannot speak.`,
    },
    book: {
      help: (won) => `You set out chairs for the Lit Fest and sell raffle tickets at the door. ${won ? 'The book club wins the quiz, and Miss Achterberg allows herself a small smile.' : 'The book club comes third in the quiz, beaten by the Aldermouth Poetry Circle on a question about Wordsworth.'}`,
      0: (part) => `${part === 3 ? 'In the chair, you introduce the visiting author by the wrong name. ' : ''}The Lit Fest quiz goes badly. You confuse two Brontës, and then a third.`,
      1: () => 'A respectable second in the Lit Fest quiz, and a long, happy argument afterwards about whether Hardy is ever cheerful.',
      2: (part) => `${part === 3 ? 'You chair the Lit Fest, and the author signs your copy “to the best chair I have ever had”. ' : ''}The book club wins the Lit Fest quiz, and the Silver Quill comes home to the library, where Miss Achterberg polishes it with a cloth she keeps for the purpose.`,
    },
    sailing: {
      help: (won) => `You crew for the commodore round Gorse Head, and do as you are told, at volume. ${won ? 'You win the Salver, and the commodore gives you a nod you will remember.' : 'Fourth, and the commodore blames the wind, the tide and the French.'}`,
      0: () => 'The wind dies off Gorse Head and you sit in a hole while the fleet sails past. You finish in the dusk, to polite applause from the clubhouse.',
      1: () => 'A close race round Gorse Head. You round the buoy second and stay there, a boat’s length behind, all the way home.',
      2: () => 'You catch the shift off Gorse Head that nobody else sees, and come home a minute clear. The bar cheers you up the slipway, and Captain Quinn, on the harbour wall, raises one hand. Briefly.',
    },
    quiz: {
      help: (won) => `You sit at the next table as reserve, mouthing answers at the team and eating their crisps. ${won ? 'They win the league, and you are in the photograph.' : 'They lose on a tie-break about the height of a mountain.'}`,
      0: () => 'A bad night in the league final: you knew the one about the Tudors, and wrote down the wrong Henry.',
      1: () => 'Runners-up in the league final, beaten on the very last question. The landlord says it is the closest he has ever seen.',
      2: () => 'The Know-It-Gulls win the league final by four points. The Bay League Shield goes up behind the bar of the Gull & Anchor, next to the lifeboat tin.',
    },
  };

  // The big day of the club’s year. x: how the game went (0 to 1; left out, a fair one).
  function occasion(L, id, x) {
    const s = L.s, m = mem(L, id), part = L.clubPart(id), sk = L.clubSkill(id), said = OCC_SAID[id];
    m.occ = L.year; turnUp(L, m);
    if (part < 0) {
      L.queue('clubTeamTalk');
      return `${cap(L.clubOcc(id).name)}, on Saturday. You spend the week picking the side, and the night before not sleeping.`;
    }
    if (part === 0) {
      stand(m, 4); L.joy(3); fellows(L, id, 2);
      return said.help(L.chance(0.3), L) + promote(L, id);
    }
    const q = typeof x === 'number' ? clamp(x, 0, 1) : 0.5;
    const perf = clamp(0.55 * q + 0.25 * sk / 100 + 0.2 * m.st / 100, 0, 1);
    // How much of it is down to you, and how the rest of them do on the night.
    const w = [0, 0.3, 0.42, 0.55][part];
    const team = 0.25 + L.rnd() * 0.45 + (m.boost === L.year ? 0.05 : 0) + (m.cheat === L.year ? 0.06 : 0);
    const sum = w * perf + (1 - w) * team;
    let res = sum >= 0.62 ? 2 : sum >= 0.45 ? 1 : 0, extra = '';
    if (id === 'quiz' && res === 2 && m.dock === L.year) { res = 1; extra = ' The five points you were docked turn out to be the difference.'; }
    if (id === 'quiz' && res === 2 && m.cheat === L.year && L.chance(0.4)) {
      stand(m, -10); L.joy(-6); L.karma(-3);
      return 'You win by two points. Then the other team’s captain stands up and says something about a phone in the gents. The Shield goes to Aldermouth, and nobody at the Gull mentions it again.';
    }
    const first = id === 'rovers' && !s.clubs.cab.some((e) => e.c === 'rovers');
    return settle(L, id, res, part, said[res](part, L, first) + extra);
  }

  // Once a year, for whoever is at the top.
  function lead(L, id) {
    const s = L.s, m = mem(L, id);
    m.lead = s.t; turnUp(L, m);
    stand(m, 5); learn(L, id, 2); fellows(L, id, 3); L.gain('charm', 1.5);
    if (id === 'players') {
      if (L.chance(L.checkOdds('craft', 45 - L.clubSkill(id) / 5))) { L.fame(1); L.joy(8); return 'Your one-act play wins the spring festival in Aldermouth. Desmond is extremely gracious about it, for nearly a whole evening.'; }
      L.joy(2); L.fame(0.2);
      return 'Your one-act play is called “brave”, “unusual” and “certainly forty minutes long”. You learn a great deal.';
    }
    L.joy(5);
    if (id === 'choir') { L.fame(0.3); L.karma(1); return L.pick(['You sing the solo at evensong in a church lit by candles and three radiators. Mrs Pargeter weeps, and says it is the cold.', 'The Nunc Dimittis, by yourself, in the half-dark. Afterwards the Reverend Hollis just squeezes your hand.']); }
    if (id === 'rovers') { L.karma(3); return L.pick(['A term of Saturday mornings with the juniors: twenty small children and one ball. By the end, two of them can trap it.', 'You run the juniors. A small girl scores past you three times and tells everyone, and you could not be prouder.']); }
    if (id === 'book') { L.fame(0.5); return 'You host an author evening: a crime writer from the city, forty chairs and a plate of sandwiches. Somebody asks the question everybody wanted asked, and it is you.'; }
    if (id === 'sailing') { L.karma(3); return 'You teach the beginners’ course: six nervous adults, three dinghies and only one swim. By Sunday they are sailing, and one of them cries.'; }
    L.karma(2);
    return 'You set and run the Gull’s quiz night. The picture round is all lighthouses, there is a tie-break about the Merrow, and $300 goes in the lifeboat tin.';
  }

  // ---- reading ----------------------------------------------------------------------------

  def('bookList', {
    place: 'library', sec: 'Lending library', icon: '📚', title: 'The reading list', time: 0, open: 'readingList',
    desc: (L) => { const b = L.bookNow(); return b ? `You have ${b.t} out (${b.p} of ${b.len} sittings).` : `Borrow a book: the card is free. ${L.booksRead()} of ${BOOK_IDS.length} read.`; },
  });
  def('bookBorrow', {
    time: 0,
    why: (L, id) => (!BOOKS[id] ? 'No such book.' : L.s.clubs.book ? (L.s.clubs.book.id === id ? 'You have it out.' : 'One book at a time: take the other one back first.') : null),
    run(L, id) {
      const c = L.s.clubs, b = BOOKS[id], first = !c.card;
      c.card = 1;
      c.book = { id, p: c.prog[id] || 0, since: L.s.t, warned: 0 };
      delete c.prog[id];
      const card = first ? 'Miss Achterberg makes you a library card, free of charge, and explains about the silence. ' : '';
      return `${card}${b.t}, by ${b.by}: ${c.read[id] ? 'an old friend, to read again.' : `${b.len} sittings, she reckons, and it is due back within the year.`} Stamped, with feeling.`;
    },
  });
  def('bookReturn', {
    time: 0,
    why: (L) => (L.s.clubs.book ? null : 'You have nothing out.'),
    run(L) { const c = L.s.clubs, b = c.book; if (b.p) c.prog[b.id] = b.p; c.book = null; return `You take ${BOOKS[b.id].t} back${b.p ? ', with a bus ticket in it to keep your place' : ''}.`; },
  });
  def('bookRead', {
    place: 'home', sec: 'Your library book', icon: '📖', time: 1, per: 2,
    title: (L) => { const b = L.bookNow(); return `Read ${b.t} (${b.p} of ${b.len})`; },
    desc: 'A sitting with your library book. Good for the mood; finish it for whatever it has to teach.',
    show: (L) => !!L.s.clubs.book,
    run(L) {
      const s = L.s, c = s.clubs, b = c.book, bk = BOOKS[b.id];
      b.p++;
      L.joy(['romance', 'thriller', 'poetry'].includes(bk.kind) ? 2 : 1.5);
      L.gain(Object.keys((bk.give && bk.give.st) || { smarts: 1 })[0], 0.5);
      if (b.p < bk.len) return L.pick(['A chapter, a cup of tea, and the world goes quiet.', 'You read until the light goes, and then a bit more.', 'You fall asleep with it on your chest, and lose your place, and find it again.', 'Forty pages, and one sentence you read three times because it is so good.']);
      return finishBook(L, b.id);
    },
  });
  def('bookChoose', {
    time: 0,
    why: (L, id) => { const m = L.clubMem('book'); return !m || m.r < 3 ? 'Only whoever chooses the book club’s books.' : !CLUB_READS.includes(id) ? 'The club reads novels, poems and history, not manuals.' : L.s.clubs.pick && L.s.clubs.pick.t === L.s.t + 1 ? 'You have chosen next season’s book already.' : null; },
    run(L, id) { L.s.clubs.pick = { t: L.s.t + 1, id }; return `You pin it on the noticeboard: next season, the book club reads ${BOOKS[id].t}. Miss Achterberg orders six more copies.`; },
  });

  function finishBook(L, id) {
    const s = L.s, c = s.clubs, bk = BOOKS[id], first = !c.read[id];
    c.book = null;
    if (!first) { L.joy(3); c.read[id].again = (c.read[id].again || 0) + 1; return `${bk.done} Just as good the second time.`; }
    c.read[id] = { a: s.age, t: s.t };
    const g = bk.give || {};
    for (const [k, n] of Object.entries(g.st || {})) L.gain(k, n);
    for (const [k, n] of Object.entries(g.sk || {})) learn(L, k, n);
    if (g.karma) L.karma(g.karma);
    if (g.fav) c.fav++;
    if (g.sleep) c.f.sleep = 1;
    L.joy(g.fav ? 6 : 4);
    const n = L.booksRead();
    L.note(`Read ${bk.t}, by ${bk.by}.`, n === 1 || n === 10 || n === READ_ALL ? 'big' : '');
    if (VANE.every((v) => c.read[v]) && VANE.includes(id) && !c.f.vane) { c.f.vane = 1; L.queue('clubVane'); }
    const left = [g.fav ? 'One for the shelf of favourites.' : '', g.sleep ? 'You sleep better from now on.' : '', Object.keys(g.sk || {}).map((k) => `Good for your ${CLUBS[k].skill}.`).join(' ')].filter(Boolean).join(' ');
    return `${bk.done} You take it back to the library.${left ? ` ${left}` : ''}`;
  }

  // ---- the turn of the season -------------------------------------------------------------

  hooks.load.push((L) => {
    const s = L.s;
    if (!s.clubs) s.clubs = {};
    const c = s.clubs;
    for (const [k, v] of Object.entries({ m: {}, sk: {}, past: {}, joined: {}, cab: [], book: null, prog: {}, read: {}, card: 0, fav: 0, pick: null, f: {}, n: {} })) if (c[k] === undefined) c[k] = v;
    // (Which book the club starts on depends on the life; no dice are thrown for it.)
    if (c.bco == null) c.bco = (s.rng >>> 0) % CLUB_READS.length;
  });
  hooks.season.push((L, lines, jailed) => {
    const s = L.s, c = s.clubs;
    for (const id of Object.keys(c.m)) {
      const m = c.m[id], club = CLUBS[id];
      // Every ten years in one club is remembered.
      const years = (s.t + 1 - m.since) / 4;
      if (years > 0 && years % 10 === 0) { L.note(`${years} years with ${club.name}.`, 'big'); m.long = Math.max(m.long || 0, years); c.f.long = Math.max(c.f.long || 0, years); }
      // The cup goes on, with you or without you.
      if (id === 'rovers' && L.season >= 2) cupRound(L, false);
      if (m.last === s.t) continue;
      m.miss++;
      // Missing the big day itself, with a part to play, is noticed most of all.
      const missedBig = L.clubOcc(id).open && L.clubPart(id) !== 0;
      stand(m, -(2 + 2 * m.miss + (missedBig ? 6 : 0)));
      if (m.miss >= 6 || (m.miss >= 3 && m.st <= 0)) { lapse(L, id, false); continue; }
      if (m.miss === 3 && !jailed) L.queue('clubMissYou', id);
      // Let your standing fall far enough and somebody else gets your place.
      const T = club.ranks.length === 5 ? NEED5 : NEED4;
      if (m.r > 0 && m.st < T.st[m.r] - 20) { m.r--; L.note(`${club.name}: gave your place to somebody who turns up. You are ${club.ranks[m.r]} again.`); }
    }
    if (c.f.sleep && !jailed) L.hp(0.4);
    const b = c.book;
    if (b && !b.warned && s.t - b.since >= 4 && !jailed) { b.warned = 1; L.queue('clubOverdue'); }
  });
  // A year’s subs, on the anniversary of joining (the joining fee covers the first year).
  hooks.bills.push((L, out, jailed) => {
    if (jailed) return;
    const t = L.s.t + 1;
    for (const [id, m] of Object.entries(L.s.clubs.m)) if (t > m.since && (t - m.since) % 4 === 0) out.push([`${CLUBS[id].name}: a year’s subs`, CLUBS[id].subs]);
  });
  // Forty: the veterans. Sixty: the touchline.
  hooks.year.push((L) => {
    const m = L.s.clubs.m.rovers;
    if (!m) return;
    if (L.s.age >= COACH_AGE && m.mode !== 'coach') { m.mode = 'coach'; L.note('Sixty: Gaz takes your boots away, gently, and gives you the youngsters to coach.'); }
    else if (L.s.age >= VETS_AGE && m.mode === 'play') { m.mode = 'vets'; L.note('Forty: Gaz moves you to the Rovers’ veterans’ side, with a speech about experience.'); }
  });
  // Belonging somewhere, and a shelf of favourite books.
  hooks.mood.push((L) => { const c = L.s.clubs; return Math.min(4, Math.min(3, Object.values(c.m).filter((m) => m.st >= 40).length) + Math.min(2, c.fav)); });

  // ---- cards ------------------------------------------------------------------------------

  const inClub = (L, id, r = 0) => !!L.s.clubs.m[id] && L.s.clubs.m[id].r >= r;
  const he = (p) => (p.sex === 'm' ? 'he' : 'she');
  const him = (p) => (p.sex === 'm' ? 'him' : 'her');
  // A fellow member to mention, if you know one (else 0).
  const mate = (L, id) => { const f = L.clubFriends(id).filter((p) => p.kind === 'friend'); return f.length ? L.pick(f).id : 0; };
  const P = (L, x) => (x && x.p ? L.person(x.p) : null);
  const M = (L, id) => L.s.clubs.m[id] || { st: 0, r: 0 };
  const busy = (L, n) => { L.s.time = Math.max(0, L.s.time - n); };
  const yours = (L, r = 0) => CLUB_IDS.filter((id) => inClub(L, id, r));

  addEvents([
    {
      id: 'clubFlu', icon: '🤧', title: 'The show must go on', w: 4, cd: 16,
      when: (L) => L.season === 1 && inClub(L, 'players') && M(L, 'players').occ !== L.year,
      ok: (L) => inClub(L, 'players'),
      text: (L) => `Two days before the summer play, the ${L.s.sex === 'f' ? 'leading lady' : 'leading man'} has flu. Desmond rings you at seven in the morning. “You have been at every rehearsal. You must know the lines. I once went on in the West End with a temperature of a hundred and two.”`,
      opts: [
        { t: 'Go on in the part', check: ['charm', 40], run(L, x, win) { const m = M(L, 'players'); if (win) { stand(m, 12); learn(L, 'players', 4); L.fame(1); L.joy(8); m.boost = L.year; return 'You go on with the script hidden in a fan, and by the second act you do not need it. Desmond cries at the curtain call, and so, briefly, do you.'; } stand(m, 5); L.joy(-2); return 'You go on with the book in your hand. The audience is very kind about it, which is somehow worse.'; } },
        { t: 'Sit up all night learning it', check: ['smarts', 40], run(L, x, win) { const m = M(L, 'players'); busy(L, 2); if (win) { stand(m, 10); learn(L, 'players', 5); L.fame(0.5); L.joy(5); m.boost = L.year; return 'By dawn you are word-perfect and slightly mad. You are very good, and sleep for most of the following week.'; } stand(m, 4); L.joy(-1); return 'By dawn you know the first act. The second act is, as Desmond puts it afterwards, “improvised, and bold”.'; } },
        { t: 'Say you are not ready', run(L) { stand(M(L, 'players'), -4); return 'Desmond goes on himself, in a wig. It is talked about for years.'; } },
      ],
    },
    {
      id: 'clubCapsize', icon: '🌊', title: 'Over she goes', w: 4, cd: 16,
      when: (L) => inClub(L, 'sailing') && L.season <= 2,
      ok: (L) => inClub(L, 'sailing'),
      text: 'A squall comes round Gorse Head out of a clear sky, and over you go. The dinghy is on her side, the water is colder than it has any right to be, and the club launch is a long way off.',
      opts: [
        { t: 'Stand on the centreboard and right her', check: ['fitness', 40], run(L, x, win) { const m = M(L, 'sailing'); if (win) { learn(L, 'sailing', 3); stand(m, 5); L.joy(4); return 'You haul on the side and up she comes, full of water and dignity. You sail her home bailing with your hat.'; } L.hp(-4, 'a ducking'); L.joy(-3); return 'She comes up, and goes straight over the other way. You are rescued in the end, and spoken to.'; } },
        { t: 'Stay with the boat and wait', run(L) { stand(M(L, 'sailing'), 2); learn(L, 'sailing', 1); L.joy(-2); return 'Captain Quinn comes alongside in the launch, looks at you, and hands you a blanket. “Stayed with the boat,” she says. It is the most she has ever said to you.'; } },
        { t: 'Swim for the shore', check: ['fitness', 60], run(L, x, win) { stand(M(L, 'sailing'), -6); if (win) { L.gain('fitness', 1.5); return 'You make it, and are told off by everyone, at length: you never leave the boat.'; } L.hp(-10, 'the cold sea'); return 'The lifeboat picks you up halfway, blue. You never leave the boat, they tell you, wrapping you in foil.'; } },
      ],
    },
    {
      id: 'clubPhone', icon: '📱', title: 'Question nine', w: 5, cd: 12,
      when: (L) => L.season === 3 && inClub(L, 'quiz', 1) && M(L, 'quiz').occ !== L.year,
      ctx: (L) => ({ p: mate(L, 'quiz') }),
      ok: (L) => inClub(L, 'quiz'),
      text: (L, x) => { const p = P(L, x); return `The night of the league final. In the gents between rounds, ${p ? `${p.name}, of your own team,` : 'your own team’s best player'} is sitting on the radiator, looking up the answer to question nine on a phone.`; },
      opts: [
        { t: 'Tell the quizmaster yourself', run(L, x) { const m = M(L, 'quiz'), p = P(L, x); m.dock = L.year; L.karma(4); stand(m, -3); if (p) L.bond(p, -8); return 'The Gull & Anchor is docked five points. You may not win now, but you can look the landlord in the eye, and he buys you a half to prove it.'; } },
        { t: 'Have a quiet word', check: ['charm', 40], run(L, x, win) { const m = M(L, 'quiz'), p = P(L, x); if (win) { if (p) L.bond(p, 3); return 'The phone goes back in a pocket and stays there. Nobody else ever knows.'; } if (p) L.bond(p, -6); m.cheat = L.year; return `${p ? `${p.name} says` : 'You are told'} everybody does it. The phone stays out, under the table, all night.`; } },
        { t: 'Say nothing', run(L) { M(L, 'quiz').cheat = L.year; L.karma(-3); return 'You wash your hands for a long time, and go back to the table, and say nothing.'; } },
      ],
    },
    {
      id: 'clubRival', icon: '🎶', title: 'The Aldermouth Singers', w: 4, cd: 16,
      when: (L) => L.season === 0 && inClub(L, 'choir') && M(L, 'choir').occ !== L.year,
      ok: (L) => inClub(L, 'choir'),
      text: 'The Aldermouth Singers have hired a professional tenor from the city for the contest, and their conductor has told the Gazette that St Brigid’s “sound like a choir that has only recently met a hymn book”.',
      opts: [
        { t: 'Write to the Gazette in reply', check: ['smarts', 40], run(L, x, win) { if (win) { L.fame(0.5); stand(M(L, 'choir'), 4); L.joy(3); return 'Your letter is printed in full under CHOIR ROW: ST BRIGID’S HITS BACK. The Reverend Hollis pins it up in the vestry, slightly guiltily.'; } L.joy(-1); return 'The Gazette prints it, with two spelling mistakes that were not yours.'; } },
        { t: 'Call extra practices', run(L) { const m = M(L, 'choir'); busy(L, 1); learn(L, 'choir', 3); stand(m, 5); m.boost = L.year; return 'Three extra evenings, a great deal of shortbread, and a sound you did not know you had in you.'; } },
        { t: 'Rise above it', run(L) { L.joy(1); return 'You hum, loudly, in the direction of Aldermouth.'; } },
      ],
    },
    {
      id: 'clubRain', icon: '🌧️', title: 'Away at Penhallow Moor', w: 5, cd: 12,
      when: (L) => inClub(L, 'rovers') && M(L, 'rovers').mode !== 'coach' && (L.season === 2 || L.season === 3) && ['wet', 'storm'].includes(L.s.wx),
      ok: (L) => inClub(L, 'rovers'),
      text: 'Away at Penhallow Moor. It has rained since Tuesday, the pitch is a pond with goalposts in it, and Gaz is two players short and on his second pie.',
      opts: [
        { t: 'Play the full ninety minutes', check: ['fitness', 40], run(L, x, win) { const m = M(L, 'rovers'); if (win) { stand(m, 8); L.gain('fitness', 1.5); L.joy(4); return 'A 1–0 win, the goal going in off your knee. Gaz hugs you. You both smell of mud.'; } stand(m, 3); L.sicken('a heavy cold', 1); return 'You lose 4–0, and bring home a cold that lasts until spring.'; } },
        { t: 'Go in goal', run(L) { stand(M(L, 'rovers'), 6); L.joy(1); return 'Nobody ever wants to go in goal. You let in five, and are made man of the match for bravery.'; } },
        { t: 'Cry off with a sniffle', run(L) { stand(M(L, 'rovers'), -5); L.hp(1); return 'Gaz says “no bother” in a voice that means the opposite.'; } },
      ],
    },
    {
      id: 'clubSubs', icon: '🫙', title: 'The missing subs', w: 3, cd: 24,
      when: (L) => yours(L, 1).length > 0,
      ctx: (L) => { const c = L.pick(yours(L, 1)); return { c, p: mate(L, c) }; },
      ok: (L, x) => inClub(L, x.c),
      text: (L, x) => { const p = P(L, x); return `The treasurer of ${CLUBS[x.c].name}${p ? `, your friend ${p.name},` : ''} has not banked the subs since March. The cash tin is empty, and the club’s account holds $14 and a button.`; },
      opts: [
        { t: 'Have a word in private', check: ['charm', 40], run(L, x, win) { const p = P(L, x), m = M(L, x.c), who = p ? p.name : 'The treasurer'; if (win) { L.karma(3); if (p) L.bond(p, 5); return `${who} goes very red, and then tells you about the vet’s bills. It is all paid back by the summer, and nobody else need ever know.`; } stand(m, -3); if (p) L.bond(p, -8); return `There is a scene in the car park. ${who} resigns, and does not speak to you for a long time.`; } },
        { t: 'Tell the committee', run(L, x) { const p = P(L, x); L.karma(2); stand(M(L, x.c), 5); if (p) L.bond(p, -10); return 'An emergency meeting, a great deal of tutting, and a vote. You are the new treasurer, as is the custom with whoever spoke up.'; } },
        { t: 'Put the money back yourself', cost: 300, run(L, x) { L.karma(5); stand(M(L, x.c), 8); L.joy(2); return 'You top up the tin, quietly, and say nothing. Somehow everybody knows by Thursday, and thinks the better of you.'; } },
      ],
    },
    {
      id: 'clubDesmond', icon: '💡', title: 'Desmond has a vision', w: 3, cd: 20,
      when: (L) => inClub(L, 'players') && L.season !== 1,
      ok: (L) => inClub(L, 'players'),
      text: 'Desmond Achebe takes you aside after rehearsal. He has a vision for next summer’s play: modern dress, a revolving stage made from a roundabout, and you as a talking lighthouse.',
      opts: [
        { t: 'Throw yourself into it', check: ['craft', 35], run(L, x, win) { const m = M(L, 'players'); if (win) { learn(L, 'players', 4); stand(m, 6); L.fame(0.3); return 'You build the costume yourself, with a working lamp. The Gazette calls your performance “luminous”, which you choose to take well.'; } stand(m, 2); L.joy(-2); return 'The lamp shorts in the dress rehearsal. You finish in the dark, which some people say is an improvement.'; } },
        { t: 'Tell him, gently, it will not work', check: ['charm', 45], run(L, x, win) { const m = M(L, 'players'); if (win) { stand(m, 5); return 'He is quiet for a long moment. Then he says, “You are right. I said the same to a knight of the realm once.” You are given a proper part.'; } stand(m, -5); return 'He is quiet for a long moment. Then he casts you as the roundabout.'; } },
        { t: 'Agree, and hope he forgets', run(L) { L.joy(1); return 'He does not forget. Desmond never forgets.'; } },
      ],
    },
    {
      id: 'clubGaz', icon: '🥧', title: 'It’s Gullhaven', w: 4, cd: 16,
      when: (L) => inClub(L, 'rovers', 1) && M(L, 'rovers').mode !== 'coach' && L.season !== 1,
      ok: (L) => inClub(L, 'rovers'),
      text: 'Gaz Kowalski, smelling faintly of pie, wants you to play on Sunday with your ankle strapped up. “It’s Gullhaven,” he says. “We can’t lose to Gullhaven. Not again. Not this year.”',
      opts: [
        { t: 'Play through it', check: ['fitness', 45], run(L, x, win) { const m = M(L, 'rovers'); if (win) { stand(m, 8); L.joy(5); return 'You hobble through ninety minutes and the Rovers win 2–1. Gaz buys everyone a pie, which is how he says thank you.'; } L.hp(-6, 'a bad ankle'); L.sicken('a twisted ankle', 1); stand(m, 3); return 'Twenty minutes in, the ankle goes. You watch the rest from the bench with a bag of frozen peas.'; } },
        { t: 'Sit it out', run(L) { stand(M(L, 'rovers'), -2); return 'Rovers lose 3–0 to Gullhaven. Gaz does not blame you, out loud.'; } },
        { t: 'Run the line instead', run(L) { stand(M(L, 'rovers'), 3); L.joy(1); return 'You run the line with a flag on a stick, and are shouted at by both sides, which is how you know you are doing it right.'; } },
      ],
    },
    {
      id: 'clubRoof', icon: '⛪', title: 'Twelve hours for the roof', w: 3, cd: 20,
      when: (L) => inClub(L, 'choir'),
      ok: (L) => inClub(L, 'choir'),
      text: 'The Reverend Alice Hollis wants the choir to sing for twelve hours without stopping, to raise money for the roof. She has made a rota. Your name is down for four in the morning.',
      opts: [
        { t: 'Sing the four o’clock shift', check: ['fitness', 30], run(L, x, win) { const m = M(L, 'choir'); if (win) { L.karma(4); stand(m, 6); L.joy(3); return 'Four in the morning, a cold church and three other voices. It is, unexpectedly, one of the loveliest hours of your life. The roof gets $2,000.'; } L.karma(2); stand(m, 2); return 'You fall asleep during the Nunc Dimittis, upright, and are allowed to.'; } },
        { t: 'Sponsor the others', cost: 100, run(L) { L.karma(3); return 'You pledge a dollar a hymn. There turn out to be a hundred of them.'; } },
        { t: 'Make the tea all night', run(L) { L.karma(2); stand(M(L, 'choir'), 3); busy(L, 1); return 'Forty cups of tea and a plate of biscuits on the hour. The singing gets stronger every time you go round.'; } },
      ],
    },
    {
      id: 'clubUnread', icon: '📕', title: 'Nobody has read it', w: 4, cd: 16,
      when: (L) => inClub(L, 'book'),
      ok: (L) => inClub(L, 'book'),
      text: 'Nobody at the book club has read the book. Not one of you. Miss Achterberg, who has read it twice, is the last to arrive, and sits down with a little sigh of pleasure.',
      opts: [
        { t: 'Bluff', check: ['smarts', 40], run(L, x, win) { const m = M(L, 'book'); if (win) { stand(m, 4); learn(L, 'book', 1); return 'You talk for ten minutes about the weather as a metaphor. Miss Achterberg nods slowly. You may have got away with it.'; } stand(m, -3); return '“And the twist?” she asks. There is no twist. You are, it turns out, describing a different book.'; } },
        { t: 'Own up', run(L) { stand(M(L, 'book'), 2); learn(L, 'book', 2); return 'Honesty is rewarded with a forty-minute summary, chapter by chapter, with readings. You go home wanting very much to read it.'; } },
        { t: 'Suggest you read it aloud, together', check: ['charm', 35], run(L, x, win) { if (win) { stand(M(L, 'book'), 5); L.joy(3); fellows(L, 'book', 3); return 'Six of you, the radiators on, a chapter each. It is the best meeting the club has had in years.'; } L.joy(-1); return 'It turns out nobody else wants to read aloud. You read the whole of chapter one by yourself, to the sound of biscuits.'; } },
      ],
    },
    {
      id: 'clubNewcomer', icon: '🛍️', title: 'Somebody new', w: 3, cd: 16,
      when: (L) => yours(L, 1).length > 0 && L.friends().length < 20,
      ctx: (L) => ({ c: L.pick(yours(L, 1)) }),
      ok: (L, x) => inClub(L, x.c),
      text: (L, x) => `At ${CLUBS[x.c].the} there is somebody new, standing at the edge of things with a carrier bag and the look of someone who wishes they had not come.`,
      opts: [
        { t: 'Take them under your wing', run(L, x) { L.karma(1); stand(M(L, x.c), 2); if (L.friends().length >= 20) return 'You find them a seat and a cup of tea, and they stay to the end.'; const p = L.meet({ club: x.c }); return `You find ${him(p)} a seat, a cup of tea and the one person who will not talk about their knee. By the end of the evening ${p.name} is laughing, and ${he(p)} comes back next time.`; } },
        { t: 'Leave them to it', run() { return 'They do not come back. Somebody says afterwards that they seemed nice.'; } },
      ],
    },
    {
      id: 'clubQuizmaster', icon: '🌊', title: 'The card is never wrong', w: 3, cd: 20,
      when: (L) => inClub(L, 'quiz'),
      ok: (L) => inClub(L, 'quiz'),
      text: 'Question fourteen: “What is the largest ocean?” Your team writes the Pacific. The quizmaster, reading carefully from his card, says the answer is the Atlantic.',
      opts: [
        { t: 'Challenge it', check: ['charm', 40], run(L, x, win) { const m = M(L, 'quiz'); if (win) { stand(m, 4); learn(L, 'quiz', 1); return 'You make your case, politely, with an atlas from behind the bar. The point is given, and the quizmaster buys you a half.'; } stand(m, -2); return '“The card,” he says, “is never wrong.” The card is wrong.'; } },
        { t: 'Let it go', run(L) { L.joy(-1); return 'You lose by a point. You will think about the Pacific for some time.'; } },
      ],
    },
    // ---- sent for by the rules ----
    {
      id: 'clubMissYou', icon: '💌', title: 'We have missed you', w: 0,
      ok: (L, x) => !L.s.gaol && inClub(L, x),
      text: (L, x) => `A card through the door from ${CLUBS[x].name}: “We have missed you. Is everything all right? Do come back.” It is signed by everybody, including somebody you do not remember.`,
      opts: [
        { t: 'Promise to go back', run(L, x) { const m = M(L, x); m.miss = Math.max(0, m.miss - 2); return 'You write back that you will. Now you will have to.'; } },
        { t: 'Let it go', run(L, x) { lapse(L, x, true); L.joy(-1); return 'You write a kind note back. It is the end of something, and you both know it.'; } },
      ],
    },
    {
      id: 'clubOverdue', icon: '📮', title: 'Overdue', w: 0,
      ok: (L) => !L.s.gaol && !!L.s.clubs.book,
      text: (L) => `A postcard from the library, in green ink: ${BOOKS[L.s.clubs.book.id].t} is overdue. It does not say “very overdue”, but the handwriting does.`,
      opts: [
        { t: 'Pay the fine', cost: 15, run(L) { const b = L.s.clubs.book; b.since = L.s.t; b.warned = 0; return 'Miss Achterberg takes your $15 as if it were evidence, and stamps the book for another year.'; } },
        { t: 'Ask for longer', check: ['charm', 35], run(L, x, win) { const b = L.s.clubs.book; b.since = L.s.t; b.warned = 0; if (win) return 'She renews it, with a look that says she will be keeping an eye on you.'; L.cash(-15); return 'She renews it, and fines you anyway.'; } },
        { t: 'Take it back unfinished', run(L) { const c = L.s.clubs, b = c.book; if (b.p) c.prog[b.id] = b.p; c.book = null; return 'You hand it over. Miss Achterberg checks every page for damage, and finds a crumb.'; } },
      ],
    },
    {
      id: 'clubVane', icon: '🖋️', title: 'Green ink', w: 0, once: true,
      ok: (L) => !L.s.gaol,
      text: 'Taking back the last of Clementine Vane’s novels, you notice that the library’s copy has notes in the margins: small corrections to the author’s own words, in green ink, in a hand you know very well. Miss Achterberg, behind the desk, has gone quite still.',
      opts: [
        { t: 'Say nothing, and keep her secret', run(L) { const c = L.s.clubs; c.f.secret = 1; L.karma(3); L.joy(2); if (c.book) c.book.since = L.s.t; return 'You hand the book over without a word. She stamps your card, and then, after a moment, adds a second date a month later. You will never mention it, and she knows you never will.'; } },
        { t: 'Ask her, quietly', check: ['charm', 50], run(L, x, win) { const c = L.s.clubs; if (win) { c.f.secret = 2; L.joy(5); return 'She goes pink to the ears. Then she signs the flyleaf, “C. V.”, and makes you promise. You promise.'; } if (L.clubMem('book')) stand(L.clubMem('book'), -5); L.joy(-1); return 'She looks at you as if you had spoken in the reading room, and says she has no idea what you mean. The temperature in the library drops by several degrees, and stays down for a season.'; } },
        { t: 'Tell the book club', run(L) { L.karma(-4); L.s.clubs.f.told = 1; if (L.clubMem('book')) stand(L.clubMem('book'), 3); return 'There is a delighted silence, and then everybody talks at once. Miss Achterberg does not come to the next meeting, or the one after.'; } },
      ],
    },
    {
      id: 'clubTeamTalk', icon: '📋', title: 'The team talk', w: 0, free: true,
      ok: (L) => inClub(L, 'rovers'),
      text: (L) => `${cap(L.clubOcc('rovers').name)}. In the dressing room before kick-off, eleven people in clean shirts are looking at you, and so is Gaz.`,
      opts: [
        { t: 'Tell them to enjoy it', check: ['charm', 40], run: (L, x, win) => talk(L, win, 'You tell them it is a game, and that they are good at it, and to go and enjoy themselves.') },
        { t: 'Go through the plan, carefully', check: ['smarts', 40], run: (L, x, win) => talk(L, win, 'You go through the plan on a whiteboard: who marks whom, and what to do at corners.') },
        { t: 'Shout', check: ['fitness', 45], run: (L, x, win) => talk(L, win, 'You kick the kit bag across the room and shout about pride. The kit bag was full of oranges.') },
      ],
    },
  ]);

  // How a final goes when you are managing it.
  function talk(L, win, said) {
    if (!inClub(L, 'rovers')) return said;
    const sum = 0.38 + (win ? 0.22 : 0) + L.rnd() * 0.25 + L.clubSkill('rovers') / 1000;
    const res = sum >= 0.6 ? 2 : sum >= 0.45 ? 1 : 0, prize = L.clubOcc('rovers').prize;
    const how = [' It does not work: Rovers lose 3–0, and the dressing room afterwards is very quiet.', ' A 2–2 draw, then penalties, and Rovers lose by one. You tell them you are proud of them, and are.', ` It works. Rovers win 2–1, and lift ${prize}. Gaz lifts you.`][res];
    return settle(L, 'rovers', res, 2, said + how);
  }
}
