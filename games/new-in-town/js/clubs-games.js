// New in Town: the clubs’ games, played at each club’s big occasion (and in
// practice). They join the work games in mini.js and are played by the same
// frame (playMini): a penalty shoot-out for the Rovers, holding a note for
// the choir, learning your lines for the Players, racing round Gorse Head for
// the sailing club, and a quiz for the quiz team and the book club.
//
// Each is built on api.stage and returns { score, auto }, as in mini.js.
// Their styles are in GAME_CSS, which the clubs’ screen (clubs-ui.js) adds
// to the page. The questions, the scripts and the sums for the boats are
// plain data and functions here, so the checks can look at them.

import { GAMES } from './mini.js';
import { grade } from './minilogic.js';
import { sfx, haptic } from '../../../shared/arcade.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const press = (node, fn) => node.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });
const shuffle = (rnd, list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// The banner at the end of a game says how a shift went; a club’s day is
// not a shift, so these games say it their own way.
const WORDS = {
  clubPens: ['Not your day', 'Some went in', 'Cool from the spot', 'Never in doubt'],
  clubHymn: ['Rather flat', 'Mostly in tune', 'Sweetly sung', 'Like an angel'],
  clubLines: ['Dried', 'A few prompts', 'Nearly word-perfect', 'Word-perfect'],
  clubTack: ['Becalmed', 'Round in the end', 'Well sailed', 'First round the mark'],
  clubQuiz: ['Not your night', 'A fair score', 'A strong round', 'Full marks'],
  clubBooks: ['Not your night', 'A fair score', 'A strong round', 'Full marks'],
};
function ownWords(api, id) {
  const finish = api.finish;
  api.finish = (q) => {
    finish(q);
    const b = document.querySelector('#mini .mini-end > b');
    if (b) b.textContent = WORDS[id][grade(clamp(q, 0, 1))];
  };
}

// ---- the quiz ----------------------------------------------------------------------------

// [question, the right answer, and three wrong ones], in three tiers. All fair
// for anybody who has lived a while in Britain and read a newspaper.
export const QUIZ = {
  easy: [
    ['How many sides does a hexagon have?', 'Six', 'Five', 'Seven', 'Eight'],
    ['Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Mercury'],
    ['What is the capital of Scotland?', 'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee'],
    ['How many days are there in a leap year?', '366', '364', '365', '367'],
    ['What colour do you get by mixing blue and yellow?', 'Green', 'Purple', 'Orange', 'Brown'],
    ['How many players does a football side have on the pitch?', 'Eleven', 'Nine', 'Ten', 'Twelve'],
    ['In which sport would you use a shuttlecock?', 'Badminton', 'Squash', 'Tennis', 'Table tennis'],
    ['What is the largest ocean on Earth?', 'The Pacific', 'The Atlantic', 'The Indian', 'The Arctic'],
    ['Which animal is called the ship of the desert?', 'The camel', 'The horse', 'The elephant', 'The donkey'],
    ['How many minutes are there in an hour and a half?', '90', '60', '75', '120'],
    ['What do bees make?', 'Honey', 'Syrup', 'Butter', 'Treacle'],
    ['What is the capital of France?', 'Paris', 'Lyon', 'Marseille', 'Nice'],
    ['Which month has the fewest days?', 'February', 'April', 'June', 'November'],
    ['How many legs does a spider have?', 'Eight', 'Six', 'Ten', 'Twelve'],
    ['What is the main ingredient of guacamole?', 'Avocado', 'Peas', 'Cucumber', 'Lime'],
    ['In which country are the pyramids of Giza?', 'Egypt', 'Mexico', 'Peru', 'Greece'],
    ['What is the largest planet in the solar system?', 'Jupiter', 'Saturn', 'Neptune', 'Earth'],
    ['Which fruit is traditional marmalade made from?', 'Oranges', 'Apples', 'Plums', 'Cherries'],
    ['What is a baby sheep called?', 'A lamb', 'A kid', 'A calf', 'A foal'],
    ['How many strings does an ordinary guitar have?', 'Six', 'Four', 'Five', 'Seven'],
    ['At what temperature in Celsius does water freeze?', '0 degrees', '10 degrees', '32 degrees', '−10 degrees'],
    ['What is celebrated in Britain on the 5th of November?', 'Bonfire Night', 'Halloween', 'May Day', 'Twelfth Night'],
    ['Who wrote “Romeo and Juliet”?', 'William Shakespeare', 'Charles Dickens', 'Geoffrey Chaucer', 'Christopher Marlowe'],
    ['Which sea creature has eight arms?', 'The octopus', 'The jellyfish', 'The starfish', 'The crab'],
    ['What is the capital of Wales?', 'Cardiff', 'Swansea', 'Newport', 'Bangor'],
    ['Which tree do acorns come from?', 'The oak', 'The ash', 'The beech', 'The elm'],
    ['Which flower is worn in Britain for Remembrance?', 'The poppy', 'The rose', 'The daisy', 'The tulip'],
    ['How many weeks are there in a year?', '52', '48', '50', '56'],
    ['What is a baby kangaroo called?', 'A joey', 'A cub', 'A kit', 'A pup'],
    ['What animal is on the flag of Wales?', 'A dragon', 'A lion', 'A unicorn', 'An eagle'],
    ['How many years are there in a century?', '100', '10', '50', '1,000'],
    ['What is the capital of Spain?', 'Madrid', 'Barcelona', 'Seville', 'Valencia'],
  ],
  medium: [
    ['What is the capital of Australia?', 'Canberra', 'Sydney', 'Melbourne', 'Perth'],
    ['Which element has the chemical symbol Fe?', 'Iron', 'Lead', 'Fluorine', 'Tin'],
    ['How many bones are there in an adult human body?', '206', '186', '226', '246'],
    ['In which year was the Battle of Hastings?', '1066', '1166', '966', '1215'],
    ['Who painted the Mona Lisa?', 'Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Botticelli'],
    ['What is the largest animal that has ever lived?', 'The blue whale', 'The African elephant', 'The sperm whale', 'The giraffe'],
    ['How many players are there in a rugby union side?', '15', '11', '13', '18'],
    ['What is the hardest natural substance?', 'Diamond', 'Granite', 'Quartz', 'Iron'],
    ['In which city is the Colosseum?', 'Rome', 'Athens', 'Naples', 'Milan'],
    ['What is the square root of 144?', '12', '11', '14', '16'],
    ['Which gas do plants take from the air to make their food?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Helium'],
    ['Which country gave the Statue of Liberty to the United States?', 'France', 'Britain', 'Spain', 'The Netherlands'],
    ['Which king of England had six wives?', 'Henry VIII', 'Henry VII', 'Edward VI', 'Charles II'],
    ['What is the currency of Japan?', 'The yen', 'The yuan', 'The won', 'The baht'],
    ['What is the capital of Canada?', 'Ottawa', 'Toronto', 'Vancouver', 'Montreal'],
    ['Which ocean lies between Africa and Australia?', 'The Indian Ocean', 'The Atlantic', 'The Pacific', 'The Southern Ocean'],
    ['Who composed the “Moonlight Sonata”?', 'Beethoven', 'Mozart', 'Chopin', 'Bach'],
    ['Which city does the River Liffey flow through?', 'Dublin', 'Cork', 'Belfast', 'Galway'],
    ['What is a group of lions called?', 'A pride', 'A pack', 'A herd', 'A troop'],
    ['How many pints are there in an imperial gallon?', 'Eight', 'Four', 'Six', 'Ten'],
    ['In which country is the city of Marrakesh?', 'Morocco', 'Algeria', 'Tunisia', 'Egypt'],
    ['What do you call a word that reads the same backwards, like “level”?', 'A palindrome', 'An anagram', 'A homophone', 'An acronym'],
    ['Which liner sank on her first voyage, in 1912?', 'The Titanic', 'The Lusitania', 'The Mary Rose', 'The Bismarck'],
    ['What is the line of latitude at 0 degrees called?', 'The Equator', 'The Tropic of Cancer', 'The Prime Meridian', 'The Arctic Circle'],
    ['Which metal is a liquid at room temperature?', 'Mercury', 'Lead', 'Tin', 'Zinc'],
    ['Who was the first person to walk on the Moon?', 'Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'],
    ['Which seabird is sometimes called the “sea parrot”?', 'The puffin', 'The gannet', 'The cormorant', 'The guillemot'],
    ['Which river flows through Paris?', 'The Seine', 'The Loire', 'The Rhône', 'The Rhine'],
    ['How many squares are there on a chessboard?', '64', '32', '48', '81'],
    ['Which vitamin does your skin make in sunlight?', 'Vitamin D', 'Vitamin A', 'Vitamin C', 'Vitamin K'],
    ['What is the capital of Norway?', 'Oslo', 'Bergen', 'Stockholm', 'Copenhagen'],
    ['What is the Roman numeral for 50?', 'L', 'V', 'X', 'C'],
    ['What is the name of our galaxy?', 'The Milky Way', 'Andromeda', 'Triangulum', 'The Whirlpool'],
    ['What does a barometer measure?', 'Air pressure', 'Temperature', 'Humidity', 'Wind speed'],
    ['How many players does a netball side have on court?', 'Seven', 'Five', 'Six', 'Nine'],
    ['Which painter cut off part of his own ear?', 'Vincent van Gogh', 'Claude Monet', 'Paul Cézanne', 'Edgar Degas'],
    ['Which bird lays the largest egg?', 'The ostrich', 'The emu', 'The swan', 'The albatross'],
    ['Which is the only mammal that can truly fly?', 'The bat', 'The flying squirrel', 'The sugar glider', 'The flying lemur'],
    ['In tennis, what is a score of nothing called?', 'Love', 'Nil', 'Duck', 'Zip'],
    ['How many sides does a heptagon have?', 'Seven', 'Six', 'Eight', 'Nine'],
  ],
  hard: [
    ['What is the capital of New Zealand?', 'Wellington', 'Auckland', 'Christchurch', 'Dunedin'],
    ['In which year did the First World War end?', '1918', '1916', '1919', '1921'],
    ['What is the chemical symbol for gold?', 'Au', 'Ag', 'Gd', 'Go'],
    ['How many hearts does an octopus have?', 'Three', 'One', 'Two', 'Four'],
    ['What is the highest mountain in the British Isles?', 'Ben Nevis', 'Snowdon', 'Scafell Pike', 'Ben Macdui'],
    ['What does a philatelist collect?', 'Stamps', 'Coins', 'Butterflies', 'Matchboxes'],
    ['Which of Shakespeare’s plays has the line “Out, damned spot”?', 'Macbeth', 'Hamlet', 'King Lear', 'Othello'],
    ['Which gas makes up most of the Earth’s air?', 'Nitrogen', 'Oxygen', 'Argon', 'Carbon dioxide'],
    ['What is a group of crows called?', 'A murder', 'A parliament', 'An unkindness', 'A clamour'],
    ['In which year was the Great Fire of London?', '1666', '1566', '1766', '1606'],
    ['Which planet takes longer to spin once than to go round the Sun?', 'Venus', 'Jupiter', 'Mars', 'Neptune'],
    ['What is the capital of Turkey?', 'Ankara', 'Istanbul', 'Izmir', 'Antalya'],
    ['Who composed “The Four Seasons”?', 'Vivaldi', 'Handel', 'Haydn', 'Bach'],
    ['What is the commonest element in the universe?', 'Hydrogen', 'Helium', 'Oxygen', 'Carbon'],
    ['Which English king died at the Battle of Bosworth Field?', 'Richard III', 'Henry VI', 'Edward IV', 'Richard II'],
    ['What is the study of fungi called?', 'Mycology', 'Ornithology', 'Entomology', 'Petrology'],
    ['In which county is Stonehenge?', 'Wiltshire', 'Somerset', 'Dorset', 'Hampshire'],
    ['What is the largest island in the Mediterranean?', 'Sicily', 'Sardinia', 'Cyprus', 'Crete'],
    ['Which Scottish city is known as the Granite City?', 'Aberdeen', 'Edinburgh', 'Inverness', 'Dundee'],
    ['In which decade was Everest first climbed?', 'The 1950s', 'The 1920s', 'The 1930s', 'The 1960s'],
    ['What colour is an aeroplane’s “black box” flight recorder?', 'Orange', 'Black', 'Red', 'Yellow'],
    ['Holst called which planet “the Bringer of War”?', 'Mars', 'Jupiter', 'Saturn', 'Uranus'],
    ['Which bone is better known as the collarbone?', 'The clavicle', 'The scapula', 'The sternum', 'The patella'],
    ['The stars of the Plough are part of which constellation?', 'The Great Bear', 'Orion', 'Cassiopeia', 'The Little Bear'],
    ['Which gemstone marks a 40th wedding anniversary?', 'Ruby', 'Pearl', 'Sapphire', 'Emerald'],
    ['Which of these is a sea area in the shipping forecast?', 'Dogger', 'Pebble', 'Marlin', 'Brindle'],
    ['What is Britain’s largest native land mammal?', 'The red deer', 'The badger', 'The fox', 'The otter'],
    ['Who wrote the music for “The Nutcracker”?', 'Tchaikovsky', 'Prokofiev', 'Stravinsky', 'Rachmaninov'],
    ['How many teaspoons make a tablespoon?', 'Three', 'Two', 'Four', 'Five'],
  ],
};
// The book club’s quiz at the Lit Fest: books and poems.
export const BOOK_QUIZ = {
  easy: [
    ['Who wrote “Oliver Twist”?', 'Charles Dickens', 'Thomas Hardy', 'Jane Austen', 'Anthony Trollope'],
    ['Which detective lived at 221B Baker Street?', 'Sherlock Holmes', 'Hercule Poirot', 'Lord Peter Wimsey', 'Father Brown'],
    ['Who wrote “Pride and Prejudice”?', 'Jane Austen', 'Charlotte Brontë', 'George Eliot', 'Elizabeth Gaskell'],
    ['Which bear came to London from “darkest Peru”?', 'Paddington', 'Rupert', 'Winnie-the-Pooh', 'Baloo'],
    ['In “Alice’s Adventures in Wonderland”, who is always late?', 'The White Rabbit', 'The Mad Hatter', 'The Cheshire Cat', 'The March Hare'],
    ['In “Peter Pan”, what is the fairy called?', 'Tinker Bell', 'Wendy', 'Tiger Lily', 'Nana'],
    ['Who wrote the “Harry Potter” books?', 'J. K. Rowling', 'Roald Dahl', 'Philip Pullman', 'C. S. Lewis'],
    ['Who wrote “Charlie and the Chocolate Factory”?', 'Roald Dahl', 'Enid Blyton', 'C. S. Lewis', 'Lewis Carroll'],
  ],
  medium: [
    ['Which of the Brontë sisters wrote “Jane Eyre”?', 'Charlotte', 'Anne', 'Emily', 'Maria'],
    ['Who wrote “Nineteen Eighty-Four”?', 'George Orwell', 'Aldous Huxley', 'H. G. Wells', 'Ray Bradbury'],
    ['In which city is “Romeo and Juliet” set?', 'Verona', 'Venice', 'Padua', 'Florence'],
    ['Who wrote “The Hobbit”?', 'J. R. R. Tolkien', 'C. S. Lewis', 'T. H. White', 'Mervyn Peake'],
    ['Which Dickens story has Ebenezer Scrooge in it?', 'A Christmas Carol', 'Bleak House', 'Great Expectations', 'Hard Times'],
    ['Who created the detective Hercule Poirot?', 'Agatha Christie', 'Dorothy L. Sayers', 'Arthur Conan Doyle', 'Margery Allingham'],
    ['How many lines does a sonnet have?', '14', '10', '12', '16'],
    ['What is Captain Hook’s ship called?', 'The Jolly Roger', 'The Hispaniola', 'The Nautilus', 'The Pequod'],
    ['Who wrote “Frankenstein”?', 'Mary Shelley', 'Bram Stoker', 'Emily Brontë', 'Ann Radcliffe'],
    ['In “Treasure Island”, what is the one-legged pirate called?', 'Long John Silver', 'Captain Flint', 'Billy Bones', 'Blind Pew'],
  ],
  hard: [
    ['Which novel begins “It was a bright cold day in April, and the clocks were striking thirteen”?', 'Nineteen Eighty-Four', 'Brave New World', 'Animal Farm', 'Brighton Rock'],
    ['Who wrote “Middlemarch”?', 'George Eliot', 'Elizabeth Gaskell', 'Thomas Hardy', 'Anthony Trollope'],
    ['In “Moby-Dick”, what is the captain called?', 'Ahab', 'Starbuck', 'Queequeg', 'Nemo'],
    ['Who wrote the poem that begins “I wandered lonely as a cloud”?', 'William Wordsworth', 'John Keats', 'Samuel Taylor Coleridge', 'Percy Bysshe Shelley'],
    ['Thomas Hardy set his novels in an imaginary county called what?', 'Wessex', 'Barsetshire', 'Mercia', 'Loamshire'],
    ['In “Pride and Prejudice”, what is the Bennets’ house called?', 'Longbourn', 'Pemberley', 'Netherfield', 'Rosings'],
    ['Who wrote “The Canterbury Tales”?', 'Geoffrey Chaucer', 'Edmund Spenser', 'Thomas Malory', 'John Gower'],
    ['Which novel opens “Last night I dreamt I went to Manderley again”?', 'Rebecca', 'Jamaica Inn', 'Jane Eyre', 'Wuthering Heights'],
    ['Who wrote “The Lady of Shalott”?', 'Alfred, Lord Tennyson', 'Robert Browning', 'Lord Byron', 'John Keats'],
    ['In “Jane Eyre”, what is Mr Rochester’s house called?', 'Thornfield Hall', 'Wuthering Heights', 'Manderley', 'Bleak House'],
    ['Who wrote “Brave New World”?', 'Aldous Huxley', 'George Orwell', 'H. G. Wells', 'Evelyn Waugh'],
  ],
};
// How many of each tier a round has, by level (0 to 5): harder as you go up.
const MIX = [[5, 3, 0], [4, 3, 1], [3, 3, 2], [2, 4, 2], [2, 3, 3], [1, 3, 4]];
const asked = new Set();
// Eight questions for a round: the mix for the level, none asked lately if it can be helped.
export function pickQuestions(bank, level, rnd, n = 8) {
  const mix = MIX[clamp(level, 0, 5)], out = [];
  ['easy', 'medium', 'hard'].forEach((tier, i) => {
    const all = bank[tier].map((q, k) => ({ q, key: `${tier}${k}${q[0].length}` }));
    let fresh = all.filter((x) => !asked.has(x.key));
    if (fresh.length < mix[i]) { for (const x of all) asked.delete(x.key); fresh = all; }
    for (const x of shuffle(rnd, fresh).slice(0, mix[i])) { asked.add(x.key); out.push(x.q); }
  });
  return shuffle(rnd, out).slice(0, n);
}

// ---- the script --------------------------------------------------------------------------

// [who gives the cue, the cue, your line]. A {this|that} in a line is a word
// you might get wrong: the first is right.
export const SCRIPT = [
  ['THE INSPECTOR', 'Where were you on the night of the storm?', 'In the {boathouse|lighthouse}, mending the {oars|nets}.'],
  ['LADY ASHCOMBE', 'Did you see who took the necklace?', 'I saw a {glove|hand} at the {window|door}, and nothing more.'],
  ['THE MAID', 'The vicar is dead, Inspector!', 'Then nobody leaves this {house|room} until {morning|dawn}.'],
  ['EDWIN', 'Will you marry me?', 'Ask me again when the {tide|moon} is {out|full}.'],
  ['THE SENTRY', 'Who goes there?', 'A friend, with {news|word} from the {harbour|castle}.'],
  ['THE BISHOP', 'Is the tea still hot, Mrs Pengelly?', 'Hot enough to {scald|burn} a {bishop|curate}.'],
  ['YOUR FATHER', 'I promised you the farm, and I meant it.', 'You promised me the {cows|sheep}, not the {fields|barn}.'],
  ['THE BOSUN', 'The ship is sinking, Captain!', 'Then {save|fetch} the {charts|cat} and say nothing.'],
  ['NELL', 'How long have you known?', 'Since the {letter|parcel} came on {Tuesday|Friday}.'],
  ['THE STRANGER', 'Why do you keep a candle in the window?', 'For a {sailor|soldier} who never came {home|back}.'],
  ['THE GARDENER', 'I found this in the rose bed.', 'That {key|ring} belonged to my {aunt|sister}.'],
  ['THE BUTLER', 'Shall I send for the doctor?', 'Send for the {vicar|doctor}, and put the {kettle|lamp} on.'],
  ['MR CRABBE', 'What on earth is that smell?', 'Burnt {toast|pastry}, and a {guilty|nervous} conscience.'],
  ['THE CHILD', 'Are you a ghost?', 'Only on {Thursdays|Sundays}, and only {after|before} supper.'],
  ['THE COLONEL', 'You dropped your glove.', 'Keep it. I have {another|a pair} at {home|the inn}.'],
  ['THE COOK', 'The orchard is on fire!', 'Ring the {bell|alarm}, and wake the {village|household}.'],
  ['ROSALIND', 'Can you ever forgive me?', 'Ask me in the {spring|summer}, when the {roses|apples} come.'],
  ['THE DUCHESS', 'Who painted this portrait?', 'A {stranger|traveller} who left without his {hat|coat}.'],
  ['THE LAWYER', 'Where is the will, Mr Crabbe?', 'Under the {clock|piano} in the {parlour|hall}.'],
  ['YOUR MOTHER', 'Do you love her?', 'More than {herring|cocoa}, and less than {cricket|my mother}.'],
  ['THE HOUSEKEEPER', 'The guests are arriving!', 'Hide the {sherry|silver} and smile at the {Colonel|Duchess}.'],
  ['THE MAYOR', 'Is it true you were a pirate?', 'For {three|two} weeks, in a {borrowed|rented} hat.'],
  ['MADAME ZARA', 'Shall I read your fortune?', 'Tell me to beware of {gulls|geese} and men called {Gerald|Norman}.'],
  ['THE CURATE', 'I have a confession to make.', 'Then make it {quickly|quietly}: the {bus|train} is due.'],
];
// A line as it should be said, and the ways to get it nearly right.
export function lineChoices(line) {
  const slots = [...line.matchAll(/\{([^}]+)\}/g)].map((m) => m[1].split('|'));
  const say = (pickOf) => { let i = 0; return line.replace(/\{([^}]+)\}/g, () => slots[i][pickOf(i++)]); };
  return { right: say(() => 0), wrong: [say((i) => (i === 0 ? 1 : 0)), say((i) => (i === 1 ? 1 : 0)), say(() => 1)] };
}

// ---- the boats ---------------------------------------------------------------------------

// The wind comes from w degrees off the line to the mark (positive: from the
// right). A boat sails 45 degrees off it, on one tack (+1, heading right of
// the wind) or the other (-1): this is how much of its speed takes it towards the mark.
export const towards = (w, tack) => Math.cos((w + tack * 45) * Math.PI / 180);
// The tack that takes you there faster.
export const lifted = (w) => (w > 0 ? -1 : 1);

// ---- the games ---------------------------------------------------------------------------

const KEEPER = '<svg viewBox="0 0 60 80"><path d="M19 31 L5 13 M41 31 L55 13" stroke="#2fb36b" stroke-width="8" stroke-linecap="round"/><circle cx="5" cy="11" r="6" fill="#ffc93c"/><circle cx="55" cy="11" r="6" fill="#ffc93c"/><rect x="17" y="24" width="26" height="31" rx="7" fill="#2fb36b"/><rect x="20" y="54" width="9" height="24" rx="4" fill="#1f2a44"/><rect x="31" y="54" width="9" height="24" rx="4" fill="#1f2a44"/><circle cx="30" cy="14" r="10" fill="#e9b88d"/><path d="M21 11 Q30 2 39 11" fill="#5a3b22"/></svg>';
const BOAT = (sail) => `<svg viewBox="-16 -18 32 36"><path d="M0 -16 C7 -7 7 9 5 14 L-5 14 C-7 9 -7 -7 0 -16Z" fill="#fffaf0" stroke="#1f2a44" stroke-width="1.6"/><path class="cg-sail" d="M0 -6 L0 11" stroke="${sail}" stroke-width="4" stroke-linecap="round"/></svg>`;

Object.assign(GAMES, {
  // ---- the Rovers: five penalties against a keeper who gives himself away ----
  clubPens: {
    how: 'Five penalties. Watch the keeper: he leans the way he means to dive. Tap where to shoot when the bar is in the green. A top corner with perfect timing cannot be stopped.', time: 45, fixed: true,
    play(api) {
      ownWords(api, 'clubPens');
      const kicks = 5, honest = clamp(0.78 - api.level * 0.06 + api.ease * 0.12, 0.5, 0.92);
      // (The needle swings once every two seconds or so: quicker, and the green narrower, in a bigger game.)
      const mid = 0.68, g = clamp(0.1 + api.ease * 0.06 - api.level * 0.01, 0.07, 0.16), speed = 0.5 + api.level * 0.06;
      let k = 0, goals = 0, state = 'ready', t = 0, lean = 1, power = 0, ended = false;
      const marks = [];
      const box = el('div', 'cg-pens', `<div class="cg-goal"><div class="cg-net"></div><div class="cg-keeper">${KEEPER}</div><div class="cg-zones">${[0, 1, 2, 3, 4, 5].map((z) => `<button data-z="${z}" aria-label="Shoot ${['top left', 'top middle', 'top right', 'low left', 'low middle', 'low right'][z]}"></button>`).join('')}</div></div>
        <i class="cg-ball">⚽</i><div class="cg-meter"><span class="cg-sweet" style="left:${(mid - g) * 100}%;width:${g * 200}%"><span style="left:25%;width:50%"></span></span><i class="cg-needle"></i></div><p class="cg-say"></p><p class="mg-tally"></p>`);
      api.stage.append(box);
      const keeper = box.querySelector('.cg-keeper'), ball = box.querySelector('.cg-ball'), needle = box.querySelector('.cg-needle'), say = box.querySelector('.cg-say'), tally = box.querySelector('.mg-tally');
      const goal = box.querySelector('.cg-goal');
      const draw = () => { tally.textContent = Array.from({ length: kicks }, (_, i) => (i < marks.length ? (marks[i] ? '⚽' : '✖️') : '◦')).join(' '); };
      const pose = (x, r, y = 0) => { keeper.style.transform = `translateX(calc(-50% + ${x}%)) translateY(${y}%) rotate(${r}deg)`; };
      const score = () => goals / kicks;
      const finish = () => { if (ended) return; ended = true; api.finish(score()); };
      const reset = () => {
        state = 'ready'; t = 0; power = 0;
        lean = Math.floor(api.rnd() * 3); // 0 left, 1 middle, 2 right
        box.classList.remove('shot');
        // (The ball goes back to the spot at once, not rolling.)
        ball.style.transition = 'none'; ball.style.transform = ''; void ball.offsetWidth; ball.style.transition = '';
        pose(0, 0); say.textContent = k ? `Penalty ${k + 1} of ${kicks}` : 'Place the ball…'; draw();
      };
      const shoot = (z) => {
        if (state !== 'aim' || ended) return;
        state = 'flight'; t = 0;
        const col = z % 3, top = z < 3, off = Math.abs(power - mid);
        // The keeper goes the way he leaned, mostly.
        const dive = api.rnd() < honest ? lean : [0, 1, 2].filter((c) => c !== lean)[Math.floor(api.rnd() * 2)];
        let res;
        if (top && power > mid + g) res = 'over';
        else if (power < mid - g) res = dive === col || (Math.abs(dive - col) === 1 && api.rnd() < 0.5) ? 'saved' : 'goal';
        else if (dive !== col) res = 'goal';
        else res = top && col !== 1 && off <= g / 2 ? 'goal' : 'saved';
        // Where it all goes.
        const gb = goal.getBoundingClientRect(), zb = box.querySelector(`[data-z="${z}"]`).getBoundingClientRect(), ob = ball.getBoundingClientRect();
        const tx = zb.left + zb.width / 2 - (ob.left + ob.width / 2), ty = (res === 'over' ? gb.top - 26 : zb.top + zb.height / 2) - (ob.top + ob.height / 2);
        ball.style.transform = `translate(${tx}px, ${ty}px) scale(.55)`;
        box.classList.add('shot');
        pose([-118, 0, 118][dive], [-70, 0, 70][dive], dive === 1 ? -6 : top ? -14 : 8);
        const ok = res === 'goal';
        api.after(560, () => {
          marks.push(ok); if (ok) goals++;
          say.textContent = ok ? 'GOAL!' : res === 'over' ? 'Over the bar!' : 'Saved!';
          say.className = `cg-say ${ok ? 'good' : 'bad'}`;
          if (ok) sfx('goal'); else { sfx('nope'); haptic(); }
          draw();
          api.after(850, () => { k++; say.className = 'cg-say'; if (k >= kicks) finish(); else reset(); });
        });
      };
      press(box.querySelector('.cg-zones'), (e) => { const b = e.target.closest('[data-z]'); if (b) shoot(Number(b.dataset.z)); });
      api.frame((dt) => {
        if (ended) return;
        t += dt;
        if (state === 'ready') {
          pose(0, 0, Math.sin(t * 12) * 2);
          if (t > 0.9) { state = 'aim'; t = 0; say.textContent = 'Shoot!'; }
        } else if (state === 'aim') {
          // He shifts his weight the way he means to go (a clearer tell, the better you are).
          const shift = Math.min(1, t / 0.35) * (14 + api.ease * 10);
          pose([-shift, 0, shift][lean], [-shift, 0, shift][lean] * 0.8, lean === 1 ? Math.sin(t * 14) * 3 : 0);
          power = 0.5 - 0.5 * Math.cos(t * speed * Math.PI * 2);
          needle.style.left = `${power * 100}%`;
          // (Dither too long and you have to hit it anyway.)
          if (t > 5) shoot(4);
        }
      });
      reset();
      return { score, auto: () => { goals = kicks; marks.length = 0; for (let i = 0; i < kicks; i++) marks.push(true); draw(); finish(); } };
    },
  },

  // ---- the choir: hold your note in the band ----
  clubHymn: {
    how: 'Hold a finger down to bring your note up, and let go to let it fall. Keep it inside the golden band as the tune moves.', time: 24, fixed: true,
    play(api) {
      ownWords(api, 'clubHymn');
      const W = 300, H = 360, NOW = 90, BACK = 1, AHEAD = 2.6, IN = 1.6;
      const half = clamp(0.1 + api.ease * 0.05 - api.level * 0.008, 0.07, 0.15);
      // The tune: notes held for a moment, with a glide between.
      const notes = [];
      let at = 0, y = 0.5;
      while (at < api.total + AHEAD) {
        const dur = clamp(1.6 - api.level * 0.12 + api.rnd() * 0.5, 0.7, 2.1);
        notes.push({ t: at, dur, y });
        at += dur;
        const step = (0.12 + api.rnd() * 0.22) * (api.rnd() < 0.5 ? -1 : 1);
        y = clamp(y + step, 0.16, 0.84);
        if (y === 0.16 || y === 0.84) y = clamp(y - step * 0.8, 0.16, 0.84);
      }
      const target = (time) => {
        let i = 0;
        while (i < notes.length - 1 && notes[i + 1].t <= time) i++;
        const n = notes[i], prev = notes[Math.max(0, i - 1)], glide = Math.min(0.3, n.dur / 3);
        const f = clamp((time - n.t) / glide, 0, 1);
        return prev.y + (n.y - prev.y) * (f * f * (3 - 2 * f));
      };
      let t = 0, v = 0, me = 0.6, held = null, inTune = 0, sung = 0, ended = false;
      const trail = [];
      const box = el('div', 'cg-hymn', `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${[1, 2, 3, 4, 5].map((i) => `<line x1="0" x2="${W}" y1="${i * H / 6}" y2="${i * H / 6}" class="stave"/>`).join('')}<polygon class="band"/><line class="now" x1="${NOW}" x2="${NOW}" y1="0" y2="${H}"/><polyline class="trail"/><circle class="cg-me" r="11" cx="${NOW}"/></svg><p class="cg-say">The organ gives you the note…</p><p class="mg-tally"></p>`);
      api.stage.append(box);
      const band = box.querySelector('.band'), trailEl = box.querySelector('.trail'), dot = box.querySelector('.cg-me'), say = box.querySelector('.cg-say'), tally = box.querySelector('.mg-tally');
      const X = (time) => NOW + (time - t) / (BACK + AHEAD) * W;
      const score = () => (sung ? inTune / sung : 0) * Math.min(1, t / (api.total - 0.6));
      const finish = (q) => { if (ended) return; ended = true; api.finish(q); };
      box.addEventListener('pointerdown', (e) => { e.preventDefault(); held = e.pointerId; box.classList.add('held'); if (box.setPointerCapture) try { box.setPointerCapture(e.pointerId); } catch { /* not every browser will */ } });
      const drop = (e) => { if (e.pointerId === held) { held = null; box.classList.remove('held'); } };
      box.addEventListener('pointerup', drop); box.addEventListener('pointercancel', drop);
      api.frame((dt) => {
        if (ended) return;
        t += dt;
        // Holding sends the note up; letting go lets it fall, both with a little weight to them.
        const want = held != null ? -0.62 : 0.62;
        v += clamp(want - v, -3.4 * dt, 3.4 * dt);
        me += v * dt;
        if (me < 0.04 || me > 0.96) { me = clamp(me, 0.04, 0.96); v = 0; }
        const aim = target(t), ok = Math.abs(me - aim) <= half;
        if (t > IN) { sung += dt; if (ok) inTune += dt; }
        trail.push([t, me]);
        while (trail.length && trail[0][0] < t - BACK) trail.shift();
        const pts = [];
        for (let i = 0; i <= 40; i++) { const tt = t - BACK + i / 40 * (BACK + AHEAD); pts.push([X(tt), target(tt)]); }
        band.setAttribute('points', [...pts.map(([x, a]) => `${x.toFixed(1)},${((a - half) * H).toFixed(1)}`), ...pts.reverse().map(([x, a]) => `${x.toFixed(1)},${((a + half) * H).toFixed(1)}`)].join(' '));
        trailEl.setAttribute('points', trail.map(([tt, yy]) => `${X(tt).toFixed(1)},${(yy * H).toFixed(1)}`).join(' '));
        dot.setAttribute('cy', (me * H).toFixed(1));
        box.classList.toggle('sweet', ok);
        if (t > IN) { say.textContent = ok ? 'In tune' : me < aim ? 'Too sharp: let go' : 'Too flat: hold'; tally.textContent = `In tune ${Math.round(inTune / Math.max(0.01, sung) * 100)}%`; }
        if (t >= api.total - 0.4) finish(score());
      });
      return { score, auto: () => { inTune = sung = Math.max(1, sung); t = api.total; finish(1); } };
    },
  },

  // ---- the Players: learn the page, then say the right line ----
  clubLines: {
    how: 'Learn your lines: read the page, then tap “I know them”. Then Desmond gives you each cue, and you pick your line, word for word.', time: 80,
    play(api) {
      ownWords(api, 'clubLines');
      // (Never more than three to a page, so that a page fits a small phone: the bigger parts have more pages.)
      const per = api.level <= 1 ? 2 : 3, pages = api.level >= 4 ? 3 : 2, total = per * pages, opts = api.level >= 3 ? 4 : 3;
      const lines = shuffle(api.rnd, SCRIPT).slice(0, total);
      let page = 0, right = 0, done = 0, ended = false, order = [], at = 0, busy = false;
      const box = el('div', 'cg-lines');
      api.stage.append(box);
      const score = () => right / total;
      const finish = () => { if (ended) return; ended = true; api.finish(score()); };
      const study = () => {
        const set = lines.slice(page * per, page * per + per);
        box.innerHTML = `<p class="cg-head">Page ${page + 1} of ${pages}: learn your lines</p><div class="cg-script">${set.map(([who, cue, line]) => `<div class="cg-pair"><p class="cue"><small>${who}</small>${esc(cue)}</p><p class="mine"><small>YOU</small>${esc(lineChoices(line).right)}</p></div>`).join('')}</div><button class="mg-go cg-ready">I know them</button><p class="mg-tally">${done ? `${right} of ${done} right so far` : ''}</p>`;
        box.querySelector('.cg-ready').addEventListener('click', recall, { once: true });
        // (The page is taken away after a while, whether you are ready or not.)
        const mine = page;
        api.after((2.8 + api.ease * 1.4) * per * 1000 + 1500, () => { if (page === mine && !order.length && !ended) recall(); });
      };
      const recall = () => {
        if (order.length || ended) return;
        sfx('flip');
        order = shuffle(api.rnd, lines.slice(page * per, page * per + per)); at = 0;
        ask();
      };
      const ask = () => {
        const [who, cue, line] = order[at], c = lineChoices(line);
        const choices = shuffle(api.rnd, [c.right, ...shuffle(api.rnd, c.wrong).slice(0, opts - 1)]);
        box.innerHTML = `<p class="cg-head">Your cue</p><p class="cg-bigcue"><small>${who}</small>${esc(cue)}</p><div class="cg-opts">${choices.map((t) => `<button data-ok="${t === c.right ? 1 : 0}">${esc(t)}</button>`).join('')}</div><p class="mg-tally">Line ${done + 1} of ${total}</p>`;
        busy = false;
      };
      press(box, (e) => {
        const b = e.target.closest('[data-ok]');
        if (!b || busy || ended) return;
        busy = true; done++;
        const ok = b.dataset.ok === '1';
        if (ok) { right++; sfx('pop'); } else { sfx('nope'); haptic(); }
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) box.querySelector('[data-ok="1"]').classList.add('right');
        api.after(ok ? 450 : 900, () => {
          at++;
          if (at < order.length) return ask();
          page++; order = [];
          if (page < pages) study(); else finish();
        });
      });
      study();
      return { score, auto: () => { right = total; done = total; finish(); } };
    },
  },

  // ---- the sailing club: round Gorse Head on the shifts ----
  clubTack: {
    how: 'Race the other boats to the buoy off Gorse Head. The wind keeps shifting: when the gauge says “Headed”, tap Tack to go about. Every tack costs a moment, so pick your time.', time: 44, fixed: true,
    play(api) {
      ownWords(api, 'clubTack');
      const V = 4.7, turnFor = 0.45 - api.ease * 0.15;
      const me = { y: 0, x: 50, tack: 1, turn: 0, hd: 45 };
      const rivals = [0.68, 0.72].map((f, i) => ({ f: f + api.level * 0.008 - api.ease * 0.02, y: 0, x: 38 + i * 24, ph: api.rnd() * 6, t: 0 }));
      let w = -10, aim = -10, shift = 1.6, t = 0, ended = false, place = 0;
      const box = el('div', 'cg-tack', `<div class="cg-sea"><span class="cg-buoy"><i></i><small>Gorse Head</small></span>${rivals.map((r, i) => `<i class="cg-boat r${i}">${BOAT(['#2aa7b8', '#f08a24'][i])}</i>`).join('')}<i class="cg-boat cg-mine">${BOAT('#ff6b5e')}</i><div class="cg-wind"><svg viewBox="-30 -30 60 60"><circle r="27" class="dial"/><g class="arrow"><path d="M0 -24 L0 16 M-8 6 L0 18 L8 6" /></g></svg><b></b></div></div><button class="mg-go cg-tackbtn">Tack</button><p class="mg-tally"></p>`);
      api.stage.append(box);
      const sea = box.querySelector('.cg-sea'), mine = box.querySelector('.cg-boat.cg-mine'), boats = [...box.querySelectorAll('.cg-boat.r0, .cg-boat.r1')];
      const arrow = box.querySelector('.arrow'), word = box.querySelector('.cg-wind b'), btn = box.querySelector('.cg-tackbtn'), tally = box.querySelector('.mg-tally');
      const tack = () => { if (me.turn > 0 || ended) return; me.tack = -me.tack; me.turn = turnFor; sfx('flip'); };
      press(btn, tack);
      const ahead = () => rivals.filter((r) => r.y > me.y).length;
      const score = () => {
        if (place) return place === 1 ? clamp(0.82 + 0.18 * (100 - Math.max(...rivals.map((r) => r.y))) / 8, 0.82, 1) : place === 2 ? 0.58 : 0.34;
        return [0.6, 0.45, 0.3][ahead()] * clamp(me.y / 100, 0, 1);
      };
      const finish = () => { if (ended) return; ended = true; api.finish(score()); };
      const show = (node, x, y, hd) => { node.style.left = `${x}%`; node.style.top = `${92 - clamp(y, 0, 100) * 0.84}%`; node.style.transform = `translate(-50%, -50%) rotate(${hd}deg)`; };
      api.frame((dt) => {
        if (ended) return;
        t += dt;
        // The wind swings one way, then mostly back the other.
        shift -= dt;
        if (shift <= 0) { shift = clamp(2.6 + api.rnd() * 1.6 - api.level * 0.15, 1.8, 4.2); const side = api.rnd() < 0.75 ? -Math.sign(aim || 1) : Math.sign(aim || 1); aim = side * (12 + api.rnd() * 14); }
        w += clamp(aim - w, -24 * dt, 24 * dt);
        // You.
        const goal = w + me.tack * 45;
        me.hd += clamp(goal - me.hd, -260 * dt, 260 * dt);
        let v = V;
        if (me.turn > 0) { me.turn -= dt; v *= 0.45; }
        me.y += v * Math.cos(me.hd * Math.PI / 180) * dt;
        me.x += v * Math.sin(me.hd * Math.PI / 180) * 0.8 * dt;
        // (Too near the rocks either side and you have to go about.)
        if ((me.x < 8 && me.tack < 0) || (me.x > 92 && me.tack > 0)) tack();
        me.x = clamp(me.x, 6, 94);
        // Them: steady, never brilliant.
        for (const r of rivals) { if (r.y < 100) { r.y += V * r.f * dt; if (r.y >= 100) r.t = t; } }
        rivals.forEach((r, i) => { const s = Math.sin(t * 0.55 + r.ph); show(boats[i], r.x + 16 * s, r.y, Math.cos(t * 0.55 + r.ph) > 0 ? 45 + w : -45 + w); });
        show(mine, me.x, me.y, me.hd);
        arrow.setAttribute('transform', `rotate(${w})`);
        const good = me.turn > 0 || me.tack === lifted(w) || Math.abs(w) < 2;
        word.textContent = me.turn > 0 ? 'Tacking…' : good ? 'Lifted' : 'Headed';
        sea.classList.toggle('headed', !good);
        btn.classList.toggle('off', me.turn > 0);
        tally.textContent = `${['1st', '2nd', '3rd'][ahead()]} · ${Math.round(clamp(me.y, 0, 100))}% of the way`;
        if (me.y >= 100) { place = 1 + rivals.filter((r) => r.y >= 100).length; finish(); }
      });
      return { score, auto: () => { me.y = 100; for (const r of rivals) r.y = Math.min(r.y, 90); place = 1; finish(); } };
    },
  },

  // ---- the quiz team and the book club: eight questions ----
  clubQuiz: { how: 'Eight questions from the quizmaster. Tap the answer you think is right. Think, but not for too long: the clock is running.', time: 75, play: (api) => quiz(api, QUIZ, 'clubQuiz') },
  clubBooks: { how: 'Eight questions about books and poems. Tap the answer you think is right. Think, but not for too long: the clock is running.', time: 75, play: (api) => quiz(api, BOOK_QUIZ, 'clubBooks') },
});

function quiz(api, bank, id) {
  ownWords(api, id);
  const qs = pickQuestions(bank, api.level, api.rnd), n = qs.length;
  let at = 0, right = 0, busy = false, ended = false;
  const box = el('div', 'cg-quiz');
  api.stage.append(box);
  const score = () => right / n;
  const finish = () => { if (ended) return; ended = true; api.finish(score()); };
  const ask = () => {
    const [q, good, ...bad] = qs[at];
    box.innerHTML = `<p class="cg-head">Question ${at + 1} of ${n}</p><p class="cg-q">${esc(q)}</p><div class="cg-ans">${shuffle(api.rnd, [good, ...bad]).map((a) => `<button data-ok="${a === good ? 1 : 0}">${esc(a)}</button>`).join('')}</div><p class="mg-tally">${right} right</p>`;
    busy = false;
  };
  press(box, (e) => {
    const b = e.target.closest('[data-ok]');
    if (!b || busy || ended) return;
    busy = true;
    const ok = b.dataset.ok === '1';
    if (ok) { right++; sfx('pop'); } else { sfx('nope'); haptic(); }
    b.classList.add(ok ? 'right' : 'wrong');
    if (!ok) box.querySelector('[data-ok="1"]').classList.add('right');
    api.after(ok ? 500 : 1000, () => { at++; if (at < n) ask(); else finish(); });
  });
  ask();
  return { score, auto: () => { right = n; finish(); } };
}

// ---- how they look -----------------------------------------------------------------------

export const GAME_CSS = `
.cg-say { margin: 0; min-height: 1.4em; font-size: 17px; font-weight: 900; text-align: center; }
.cg-say.good { color: var(--good); } .cg-say.bad { color: var(--bad); }
.cg-head { margin: 0; font-size: 12.5px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; color: #9a8f78; text-align: center; }

/* penalties */
.cg-pens { position: relative; width: min(360px, 100%); display: grid; justify-items: center; gap: 12px; padding: 14px 10px 10px; border-radius: 22px; background: linear-gradient(180deg, #7cc576, #4f9e4b); }
.cg-goal { position: relative; width: 100%; aspect-ratio: 2.25; border: 6px solid #fff; border-bottom: 0; border-radius: 4px 4px 0 0; }
.cg-net { position: absolute; inset: 0; background: repeating-linear-gradient(90deg, #ffffff40 0 1px, transparent 1px 12px), repeating-linear-gradient(0deg, #ffffff40 0 1px, transparent 1px 12px), #3d7a3a55; }
.cg-keeper { position: absolute; left: 50%; bottom: 0; width: 23%; height: 92%; transform: translateX(-50%); transform-origin: 50% 90%; transition: transform .12s; z-index: 1; pointer-events: none; }
.cg-pens.shot .cg-keeper { transition: transform .38s cubic-bezier(.2,.8,.3,1); }
.cg-keeper svg { width: 100%; height: 100%; display: block; }
.cg-zones { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr 1fr; z-index: 2; }
.cg-zones button { min-height: 44px; border: 1px dashed #ffffff55; background: transparent; }
.cg-zones button:active { background: #ffffff33; }
.cg-ball { font-style: normal; font-size: 34px; line-height: 1; transition: transform .5s cubic-bezier(.15,.7,.3,1); z-index: 3; pointer-events: none; }
.cg-meter { position: relative; width: 100%; height: 22px; border-radius: 11px; background: linear-gradient(90deg, #d8433a, #f0b43c 30%, #f0b43c 70%, #d8433a); box-shadow: inset 0 2px 0 rgba(0,0,0,.15); }
.cg-sweet { position: absolute; top: 0; bottom: 0; background: #49c27c; }
.cg-sweet > span { position: absolute; top: 0; bottom: 0; background: #1f9d62; }
.cg-needle { position: absolute; top: -5px; bottom: -5px; width: 5px; margin-left: -2.5px; border-radius: 3px; background: #1f2a44; box-shadow: 0 0 0 2px #fff; }
.cg-pens .mg-tally { color: #fff; font-size: 18px; letter-spacing: 2px; }
.cg-pens .cg-say { color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.25); }
.cg-pens .cg-say.good { color: #fff7c2; } .cg-pens .cg-say.bad { color: #ffd6d2; }

/* holding a note */
.cg-hymn { width: min(380px, 100%); display: grid; gap: 8px; justify-items: center; touch-action: none; cursor: pointer; }
.cg-hymn svg { width: 100%; height: min(56vh, 420px); border-radius: 20px; background: #fffdf6; box-shadow: 0 3px 0 var(--line); }
.cg-hymn .stave { stroke: #e7dcc4; stroke-width: 1.5; }
.cg-hymn .band { fill: #ffc93c66; stroke: #e0a91c; stroke-width: 1.5; }
.cg-hymn.sweet .band { fill: #ffc93c99; }
.cg-hymn .now { stroke: #c9bfa6; stroke-dasharray: 4 5; }
.cg-hymn .trail { fill: none; stroke: #66708c88; stroke-width: 3; stroke-linecap: round; }
.cg-hymn .cg-me { fill: #66708c; stroke: #fff; stroke-width: 3; transition: fill .12s; }
.cg-hymn.sweet .cg-me { fill: var(--good); }
.cg-hymn.held svg { box-shadow: 0 0 0 3px var(--teal); }

/* lines */
.cg-lines { width: min(380px, 100%); max-height: 100%; overflow-y: auto; touch-action: pan-y; display: grid; gap: 8px; }
.cg-script { display: grid; gap: 8px; }
.cg-pair { padding: 8px 11px; border-radius: 14px; background: #fff; box-shadow: 0 2px 0 var(--line); }
.cg-pair p { margin: 0; font-size: 14.5px; font-weight: 700; line-height: 1.3; }
.cg-pair p + p { margin-top: 4px; }
.cg-pair small, .cg-bigcue small { display: block; font-size: 11px; font-weight: 900; letter-spacing: .06em; color: #9a8f78; }
.cg-pair .mine { color: var(--teal-d); font-weight: 900; font-size: 15.5px; }
.cg-ready { justify-self: center; }
.cg-bigcue { margin: 0; padding: 14px; border-radius: 16px; background: #fff; box-shadow: 0 2px 0 var(--line); font-size: 18px; font-weight: 800; line-height: 1.35; }
.cg-opts, .cg-ans { display: grid; gap: 9px; }
.cg-opts button, .cg-ans button { min-height: 52px; padding: 10px 14px; border-radius: 14px; background: #fff; box-shadow: 0 3px 0 #e2d7bf; font-size: 15.5px; font-weight: 800; line-height: 1.3; text-align: left; }
.cg-opts button:active, .cg-ans button:active { transform: translateY(2px); box-shadow: none; }
.cg-opts button.right, .cg-ans button.right { background: #d8f2e2; box-shadow: 0 3px 0 #8cc49b; color: #145c39; }
.cg-opts button.wrong, .cg-ans button.wrong { background: #fde0dc; box-shadow: 0 3px 0 #e8a39b; color: #8f2a22; }

/* the quiz */
.cg-quiz { width: min(380px, 100%); display: grid; gap: 12px; }
.cg-q { margin: 0; min-height: 3.6em; font-size: 19px; font-weight: 900; line-height: 1.3; text-align: center; }
.cg-ans { grid-template-columns: 1fr 1fr; }
.cg-ans button { text-align: center; }

/* sailing */
.cg-tack { width: min(380px, 100%); display: grid; gap: 10px; justify-items: stretch; }
.cg-sea { position: relative; height: min(58vh, 460px); border-radius: 20px; overflow: hidden; background: radial-gradient(circle at 50% 0%, #bfe7ee, #5bb7c8 70%); box-shadow: inset 0 0 0 3px #ffffff55; transition: box-shadow .2s; }
.cg-sea.headed { box-shadow: inset 0 0 0 4px #ff6b5e; }
.cg-buoy { position: absolute; left: 50%; top: 6%; transform: translate(-50%, -50%); display: grid; justify-items: center; gap: 2px; }
.cg-buoy i { width: 18px; height: 18px; border-radius: 50%; background: #ffc93c; box-shadow: 0 0 0 3px #fff, 0 2px 4px rgba(0,0,0,.25); }
.cg-buoy small { font-size: 11px; font-weight: 900; color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.3); }
.cg-boat { position: absolute; width: 34px; height: 38px; transform: translate(-50%, -50%); }
.cg-boat svg { width: 100%; height: 100%; display: block; overflow: visible; }
.cg-boat.cg-mine { width: 42px; height: 46px; z-index: 2; filter: drop-shadow(0 2px 2px rgba(0,0,0,.25)); }
.cg-wind { position: absolute; left: 10px; top: 10px; display: grid; justify-items: center; gap: 3px; padding: 7px 8px; border-radius: 14px; background: #fffaf0e6; }
.cg-wind svg { width: 56px; height: 56px; }
.cg-wind .dial { fill: #fff; stroke: #c9bfa6; stroke-width: 2; }
.cg-wind path { fill: none; stroke: #1f2a44; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.cg-wind b { font-size: 13px; font-weight: 900; color: var(--good); }
.cg-sea.headed .cg-wind b { color: var(--bad); }
.cg-tackbtn { min-height: 64px; font-size: 22px; }
.cg-tackbtn.off { opacity: .5; }
`;
