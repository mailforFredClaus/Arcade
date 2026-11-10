// New in Town: the things that happen to you. Each event is a card with a
// few choices. Some turn up at random as the seasons go by (w: how often;
// when: who they can happen to); others are sent for by the rules in
// engine.js (w: 0): a wedding, a new baby, old Marlow on the pier.
//
// A choice may have a cost, or be a gamble: check: [skill, how hard] rolls
// against one of your skills, odds: gives the chance outright. run does the
// choice and returns what to say (win: whether the gamble came off).
// L is the Life; x is whatever the event is about (often a person's id).

import { money, CAREERS, NAMES, PETS, STATS, STAT_NAME } from './data.js';

const P = (L, id) => L.person(id) || { name: 'Someone', bond: 0, age: 30 };
const has = (L, id) => !!L.person(id);
const aFriend = (L) => { const f = L.friends(); return f.length ? L.pick(f).id : null; };
const aKid = (lo, hi) => (L) => { const k = L.kids().filter((c) => c.age >= lo && c.age <= hi); return k.length ? L.pick(k).id : null; };
const aParent = (L) => { const k = L.s.people.filter((p) => p.kind === 'parent'); return k.length ? L.pick(k).id : null; };
const inJob = (L, ...ids) => !!L.s.job && (!ids.length || ids.includes(L.s.job.c));
const pay = (L) => (L.s.job ? CAREERS[L.s.job.c].rungs[L.s.job.r].pay : 0);
const busy = (L, n) => { L.s.time = Math.max(0, L.s.time - n); };
const credit = (L, n) => { if (L.s.job) L.s.job.n += n; };
const fire = (L) => { if (L.s.job) { L.note(`Sacked as ${L.jobTitle()}.`, 'big'); L.s.job = null; } };
const lowest = (L) => STATS.slice().sort((a, b) => L.s.st[a] - L.s.st[b])[0];

export const EVENTS = [
  // ---- luck, good and bad ----
  {
    id: 'wallet', icon: '👛', title: 'A lost wallet', w: 3,
    text: 'On the sea wall, half under a bench: a fat leather wallet. No one is about.',
    opts: [
      { t: 'Hand it in at the Town Hall', run(L) { L.karma(5); if (L.chance(0.45)) { L.cash(150); return 'The owner tracks you down a week later and presses $150 into your hand.'; } return 'The clerk writes it in a ledger. You walk home taller.'; } },
      { t: 'Keep the cash', run(L) { L.cash(320); L.karma(-5); return 'There is $320 in it. You post the cards back, at least.'; } },
    ],
  },
  {
    id: 'gull', icon: '🐦', title: 'Daylight robbery', w: 3,
    text: 'You are two bites into a bag of chips on the pier when a gull the size of a small dog takes the lot.',
    opts: [
      { t: 'Give chase', check: ['fitness', 35], run(L, x, win) { if (win) { L.joy(4); L.gain('fitness', 0.8); return 'You sprint the length of the pier and it drops the bag. The whole promenade applauds.'; } L.joy(-1); return 'It circles once, to gloat.'; } },
      { t: 'Laugh it off', run(L) { L.joy(2); return 'You had to admire the technique.'; } },
    ],
  },
  {
    id: 'bikeGone', icon: '🚲', title: 'Where did I leave it?', w: 2,
    when: (L) => L.s.items.bike && !L.s.items.car && !L.s.items.sportscar,
    text: 'You come out of the shop to an empty lamp post and a cut lock.',
    opts: [
      { t: 'Buy another, and a better lock', cost: 450, run() { return 'The new one has a bell. You ring it at everything.'; } },
      { t: 'Ask around the harbour', check: ['smarts', 40], run(L, x, win) { if (win) { L.joy(3); return 'A trail of clues leads to a shed behind the chandlery. Bike recovered, culprit aged nine.'; } delete L.s.items.bike; busy(L, 1); L.joy(-3); return 'Nobody saw a thing. You are on foot again.'; } },
      { t: 'Walk from now on', run(L) { delete L.s.items.bike; busy(L, 1); L.joy(-3); return 'Everything is further away than it was.'; } },
    ],
  },
  {
    id: 'refund', icon: '✉️', title: 'A brown envelope', w: 2, when: (L) => L.s.n.earned > 5000,
    text: 'From the tax office. You open it with dread. It turns out they owe YOU money.',
    opts: [{ t: 'Frame it', run(L) { const n = L.int(3, 9) * 100; L.cash(n); return `A refund of ${money(n)}.`; } }],
  },
  {
    id: 'scam', icon: '📧', title: 'An exciting opportunity', w: 2, when: (L) => L.s.cash + L.s.bank >= 500,
    text: 'A prince, temporarily embarrassed, needs only $500 to release his fortune. He will share it with you. He has found you by email.',
    opts: [
      { t: 'Send the $500', cost: 500, run(L) { L.gain('smarts', 1.5); L.joy(-3); return 'You never hear from the prince again. You have, however, learned something.'; } },
      { t: 'Delete it', run() { return 'Gone. Somewhere a prince sighs.'; } },
      { t: 'Report it', run(L) { L.karma(1); return 'The constable says you are the fourth this week.'; } },
    ],
  },
  {
    id: 'lostTourist', icon: '🗺️', title: 'Excuse me...', w: 3, when: (L) => L.friends().length < 8,
    text: 'Someone with a suitcase is turning a map round and round outside the station.',
    opts: [
      { t: 'Walk them where they are going', run(L) { L.karma(1); const p = L.meet({ bond: 25 }); return `It turns out ${p.name} is moving here. You are the first person they know in town.`; } },
      { t: 'Point vaguely up the hill', run() { return 'They set off in entirely the wrong direction.'; } },
    ],
  },
  {
    id: 'lostDog', icon: '🐕', title: 'A dog with no collar', w: 2,
    text: 'A wet, hopeful dog has been following you along the beach for half an hour.',
    opts: [
      { t: 'Find its owner', run(L) { L.karma(4); if (L.chance(0.5)) { L.cash(100); return 'Posters, phone calls, and at last a tearful reunion. They insist on giving you $100.'; } return 'Posters, phone calls, and at last a tearful reunion.'; } },
      { t: 'Take it home', show: (L) => !L.s.pet && L.s.home !== 'hostel', run(L) { const name = L.pick(['Lucky', 'Driftwood', 'Sandy', 'Tide']); L.s.pet = { kind: 'dog', name, age: 3, since: L.s.t }; L.joy(8); L.karma(-1); return `Nobody comes looking. You call the dog ${name}.`; } },
      { t: 'Keep walking', run(L) { L.joy(-1); return 'It watches you go.'; } },
    ],
  },
  {
    id: 'scratch', icon: '🎟️', title: 'Feeling lucky?', w: 2,
    text: 'The newsagent waves a scratch card at you. "Last one on the roll. That is always the winner."',
    opts: [
      { t: 'Go on then', cost: 20, odds: () => 0.16, run(L, x, win) { if (win) { const n = L.pick([200, 500, 500, 1000, 5000]); L.cash(n); L.joy(4); return `Three anchors in a row! ${money(n)}!`; } return 'Two anchors and a crab. So close.'; } },
      { t: 'No thanks', run() { return 'The next customer buys it. You do not look.'; } },
    ],
  },
  {
    id: 'snorer', icon: '😴', title: 'The Snorer', w: 4, cd: 10, when: (L) => L.s.home === 'hostel',
    text: 'Bunk nine is at it again. It sounds like someone sawing a wardrobe in half, slowly.',
    opts: [
      { t: 'Buy earplugs', cost: 10, run(L) { L.joy(3); return 'Blessed silence.'; } },
      { t: 'Have a word', check: ['charm', 30], run(L, x, win) { if (win) { L.joy(5); return 'He is mortified, and sleeps on his side from then on.'; } L.joy(-3); return 'He denies everything, and snores at you on purpose.'; } },
      { t: 'Lie awake hating', run(L) { L.joy(-3); L.hp(-2); return 'You count the cracks in the ceiling. There are forty-one.'; } },
    ],
  },
  {
    id: 'rentUp', icon: '🏠', title: 'A letter from the landlord', w: 2, when: (L) => !L.s.owned && L.s.home !== 'hostel',
    text: '"Owing to market conditions," it begins, which is never good.',
    opts: [
      { t: 'Talk them round', check: ['charm', 45], run(L, x, win) { if (win) return 'You mention the damp, the boiler and the gulls in the loft. The matter is dropped.'; L.cash(-600); return 'They mention the deposit. You pay an extra $600 this season.'; } },
      { t: 'Pay up', cost: 400, run() { return '$400 for "administration".'; } },
    ],
  },
  {
    id: 'boiler', icon: '🔧', title: 'Clank. Hiss. Silence.', w: 2, when: (L) => L.s.owned,
    text: 'The boiler has made its last noise. It is, of course, the coldest week of the year.',
    opts: [
      { t: 'Call the plumber', cost: 2500, run() { return 'He sucks his teeth for an hour and charges you $2,500.'; } },
      { t: 'Fix it yourself', check: ['craft', 50], run(L, x, win) { if (win) { L.cash(-300); L.joy(4); return 'A $300 part, a borrowed spanner, and warm radiators. You are insufferable for a week.'; } L.cash(-5000); L.joy(-5); return 'There is water coming through the kitchen ceiling. The real plumber costs $5,000.'; } },
    ],
  },
  {
    id: 'adrift', icon: '⛵', title: 'Adrift!', w: 2, when: (L) => !!L.s.items.boat,
    text: 'A gale in the night has snapped your mooring. Your boat is bobbing out past the harbour mouth.',
    opts: [
      { t: 'Swim out to her', check: ['fitness', 55], run(L, x, win) { if (win) { L.joy(5); L.fame(1); return 'Cold enough to stop your heart, but you haul yourself aboard and sail her home.'; } L.hp(-14, 'the cold sea'); delete L.s.items.boat; return 'The cold turns you back, half drowned. The boat is gone by morning.'; } },
      { t: 'Pay for a tow', cost: 1500, run() { return 'The harbour master brings her in, smirking.'; } },
      { t: 'Let her go', run(L) { delete L.s.items.boat; L.joy(-8); return 'You watch until you cannot see her any more.'; } },
    ],
  },
  {
    id: 'jury', icon: '⚖️', title: 'Jury service', w: 1, when: (L) => L.s.age >= 22 && !L.s.record,
    text: 'A summons. The Crown versus a man accused of stealing forty lobsters.',
    opts: [
      { t: 'Do your duty', run(L) { busy(L, 2); L.karma(3); L.gain('smarts', 1.5); return 'Two weeks in a stuffy room. Guilty: he had a lobster in his pocket at the time.'; } },
      { t: 'Wriggle out of it', check: ['charm', 50], run(L, x, win) { if (win) return 'You explain, at length, how busy you are. They excuse you just to make it stop.'; L.cash(-300); return 'The clerk has heard them all. A $300 fine, and you serve anyway.'; } },
    ],
  },
  {
    id: 'whale', icon: '🐋', title: 'On the sands', w: 1, once: true,
    text: 'A young whale is stranded on the beach below the cliffs. Half the town is down there with buckets.',
    opts: [
      { t: 'Help, all night if need be', run(L) { L.hp(-4); L.karma(6); L.joy(8); const p = L.maybeMeet(0.6); return `At dawn the tide lifts her and she is away. ${p ? `You and ${p.name}, soaked and grinning, go for breakfast.` : 'You will remember it all your life.'}`; } },
      { t: 'Watch from the sea wall', run(L) { L.joy(1); return 'They get her off at dawn. You wish you had gone down.'; } },
    ],
  },
  {
    id: 'film', icon: '🎬', title: 'Lights, camera', w: 1,
    text: 'A film crew has taken over the harbour. They need extras, and locations.',
    opts: [
      { t: 'Audition', check: ['charm', 45], run(L, x, win) { if (win) { L.cash(800); L.fame(3); L.joy(5); return 'You are "Fisherman Two". You have a line! It is "Aye." $800.'; } L.joy(-2); return 'They say they will be in touch. They will not.'; } },
      { t: 'Rent them your place', show: (L) => L.s.home !== 'hostel', run(L) { L.cash(1500); return '$1,500 for three days. They leave it tidier than they found it.'; } },
      { t: 'Keep out of the way', run() { return 'You see the back of a famous head.'; } },
    ],
  },
  {
    id: 'fair', icon: '🎪', title: 'The Spring Fair', w: 4, cd: 12, when: (L) => L.season === 0,
    text: 'Bunting on the green, a brass band, and three ways to make a fool of yourself.',
    opts: [
      { t: 'Enter the bake-off', check: ['craft', 40], run(L, x, win) { if (win) { L.cash(300); L.joy(5); L.gain('craft', 1); return 'First prize, a rosette and $300. The vicar asks for the recipe.'; } L.joy(-1); return 'The judge says "interesting" and moves on quickly.'; } },
      { t: 'Join the tug of war', check: ['fitness', 40], run(L, x, win) { if (win) { L.cash(200); L.joy(5); return 'Your side drags the fire brigade through the mud. $200 and glory.'; } L.joy(1); return 'You are dragged through the mud by the fire brigade.'; } },
      { t: 'Run the tombola', check: ['charm', 35], run(L, x, win) { L.karma(2); if (win) { L.gain('charm', 1.5); L.joy(3); return 'You sell every ticket. Someone wins a tin of peaches from 1987.'; } return 'A slow day at the tombola, but all for a good cause.'; } },
    ],
  },
  {
    id: 'regatta', icon: '🚣', title: 'Regatta Day', w: 4, cd: 12, when: (L) => L.season === 1,
    text: 'The whole bay is out: flags, boats, ice cream and shouting.',
    opts: [
      { t: 'Row in the big race', check: ['fitness', 50], run(L, x, win) { if (win) { L.cash(1000); L.fame(1); L.joy(6); return 'Your crew wins by half a length. $1,000 and a silver cup for the pub shelf.'; } L.gain('fitness', 1); return 'Fourth. Out of four. Your hands are blisters.'; } },
      { t: 'Bet $200 on the lifeboat crew', cost: 200, odds: () => 0.45, run(L, x, win) { if (win) { L.cash(500); return 'They storm it. You collect $500.'; } return 'They catch a crab at the turn. So does your $200.'; } },
      { t: 'Sell ice creams', check: ['charm', 35], run(L, x, win) { if (win) { L.cash(400); return 'You sell out by two o’clock. $400.'; } L.cash(100); return 'It rains. You make $100 and eat the stock.'; } },
    ],
  },
  {
    id: 'gala', icon: '🎄', title: 'The Winter Gala', w: 4, cd: 12, when: (L) => L.season === 3,
    text: 'The lifeboat fundraiser at the Town Hall: the one night Starling Bay dresses up.',
    opts: [
      { t: 'Buy a ticket', cost: 500, run(L) { L.gain('charm', 2); L.karma(2); L.joy(4); const p = L.maybeMeet(0.5); return p ? `You are seated next to ${p.name} and talk straight through the speeches.` : 'You win a hamper in the raffle and dance until your feet hurt.'; } },
      { t: 'Volunteer in the cloakroom', run(L) { L.karma(3); L.joy(1); return 'Four hundred coats, and you lose only one.'; } },
      { t: 'Stay in by the fire', run(L) { L.joy(2); L.hp(1); return 'You can hear the band from here, faintly. It is rather nice.'; } },
    ],
  },
  {
    id: 'snow', icon: '🌨️', title: 'Snowed in', w: 2, when: (L) => L.season === 3,
    text: 'A foot of snow overnight. Nothing is moving. A week indoors, then.',
    opts: [
      { t: 'Read everything in the house', run(L) { L.gain('smarts', 3); return 'Including the instructions for the toaster.'; } },
      { t: 'Press-ups and star jumps', run(L) { L.gain('fitness', 3); return 'The people downstairs think you are moving furniture.'; } },
      { t: 'Sleep like a bear', run(L) { L.hp(6); L.joy(3); return 'You wake up in what might be Thursday.'; } },
    ],
  },
  {
    id: 'heat', icon: '🥵', title: 'Heatwave', w: 2, when: (L) => L.season === 1,
    text: 'The hottest week anyone can remember. The tarmac is soft and the beach is full.',
    opts: [
      { t: 'To the beach', run(L) { L.joy(6); L.hp(-1); return 'You swim, doze, and burn your nose.'; } },
      { t: 'Pick up extra hours while everyone bunks off', show: (L) => inJob(L), run(L) { const n = Math.round(pay(L) / 2); L.cash(n); credit(L, 1); L.joy(-2); return `The boss notices who turned up. ${money(n)} extra.`; } },
    ],
  },
  {
    id: 'burglar', icon: '🪟', title: 'A broken window', w: 2, when: (L) => L.s.home !== 'hostel' && L.s.cash >= 3000,
    text: (L) => `You come home to a broken window, and a gap where you keep your cash. ${money(Math.min(20000, Math.round(L.s.cash * 0.3)))} gone.`,
    opts: [
      { t: 'Call the police', odds: () => 0.35, run(L, x, win) { const n = Math.min(20000, Math.round(L.s.cash * 0.3)); if (win) return 'They catch him on the station platform with your money still in his sock.'; L.cash(-n); L.joy(-4); return 'They take a statement. That is all they take. (Money in the bank cannot be burgled.)'; } },
      { t: 'Go after him yourself', check: ['fitness', 55], run(L, x, win) { const n = Math.min(20000, Math.round(L.s.cash * 0.3)); if (win) { L.fame(1); L.joy(4); return 'You run him down on the beach and sit on him until the constable arrives.'; } L.cash(-n); L.hp(-8, 'a burglar'); return 'He is faster than he looks, and he bites. (Money in the bank cannot be burgled.)'; } },
    ],
  },
  {
    id: 'kindness', icon: '💐', title: 'What goes around', w: 2, when: (L) => L.s.karma >= 25,
    text: 'You go to pay at the café and find it has been paid. So has next month. "People remember," says the owner.',
    opts: [{ t: 'Well, I never', run(L) { L.cash(500); L.joy(6); return 'A bit of a collection has been got up for you, too: $500.'; } }],
  },
  {
    id: 'whispers', icon: '🤫', title: 'Whispers', w: 2, when: (L) => L.s.karma <= -25,
    text: 'Conversations stop when you walk into the Gull & Anchor. Someone moves their handbag.',
    opts: [
      { t: 'Make amends: give $1,000 to the lifeboat', cost: 1000, run(L) { L.karma(8); L.s.n.given += 1000; return 'It is a start. Somebody nods at you.'; } },
      { t: 'Let them talk', run(L) { L.lose('charm', 2); L.joy(-4); return 'They do.'; } },
    ],
  },
  {
    id: 'aunt', icon: '📜', title: 'Great-Aunt Hester', w: 1, once: true, when: (L) => L.s.age >= 24 && L.s.age <= 55,
    text: 'A solicitor’s letter. A great-aunt you met twice has died and left you $8,000, "and my companion, Admiral".',
    opts: [
      { t: 'Take the money and the cat', show: (L) => !L.s.pet && L.s.home !== 'hostel', run(L) { L.cash(8000); L.s.pet = { kind: 'cat', name: 'Admiral', age: 6, since: L.s.t }; L.joy(5); return 'Admiral inspects your home and finds it adequate.'; } },
      { t: 'Take the money', run(L) { L.cash(8000); return 'Admiral goes to a cousin. You raise a glass to Hester.'; } },
    ],
  },
  {
    id: 'tip', icon: '🚀', title: 'A sure thing', w: 2, when: (L) => L.s.cash >= 2000 && L.s.stk.p.MOON < 500,
    text: 'A man at the bar leans in. "Moonshot Mining. They have found something. You did not hear it from me."',
    opts: [
      { t: 'Put $1,000 in', cost: 1000, run(L) { const k = L.s.stk, n = Math.floor(1000 / k.p.MOON); k.own.MOON = (k.own.MOON || 0) + n; k.paid.MOON = (k.paid.MOON || 0) + 1000; return `You now own ${n} shares of Moonshot Mining. Time will tell.`; } },
      { t: 'Nod politely', run() { return 'He tells the next person the same thing.'; } },
    ],
  },
  {
    id: 'poker', icon: '🃏', title: 'The back room', w: 1, when: (L) => L.s.cash >= 1000 && L.s.age >= 21,
    text: 'The landlord lifts the bar flap. "Private game tonight. A thousand to sit down."',
    opts: [
      { t: 'Sit down', cost: 1000, check: ['smarts', 55], run(L, x, win) { if (win) { L.cash(4000); L.s.n.casino += 3000; L.joy(5); return 'You read the vet like a book. You leave at 3am with $4,000.'; } L.s.n.casino -= 1000; L.joy(-3); return 'The vet reads YOU like a book.'; } },
      { t: 'Not tonight', run() { return 'You hear them laughing through the wall.'; } },
    ],
  },
  {
    id: 'crateTv', icon: '📺', title: 'Fell off a boat', w: 1, when: (L) => !L.s.items.tv,
    text: 'A man with a van has brand-new televisions, in boxes, for $200. "Fell off a boat," he says. They are dry.',
    opts: [
      { t: 'Buy one', cost: 200, run(L) { L.s.items.tv = 1; L.karma(-2); if (L.chance(0.12)) { L.cash(-500); return 'A constable calls round a week later. You keep the television but pay a $500 fine.'; } return 'It works perfectly. You do not ask.'; } },
      { t: 'Tell the constable', run(L) { L.karma(3); return 'The van is gone by the time she gets there.'; } },
      { t: 'Walk on', run() { return 'None of your business.'; } },
    ],
  },
  {
    id: 'salDeal', icon: '🦊', title: 'Sal has a proposition', w: 1, when: (L) => L.s.n.crimes >= 2 && L.s.cash >= 3000,
    text: '"Three grand buys you a third of a container," says Shady Sal. "What is in it? Opportunity."',
    opts: [
      { t: 'I am in', cost: 3000, odds: () => 0.35, run(L, x, win) { L.karma(-2); if (win) { L.cash(9000); return 'The container is full of trainers. Real ones, even. Your share is $9,000.'; } return 'The container is full of left shoes.'; } },
      { t: 'Not this time, Sal', run() { return '"Your loss," says Sal, as always.'; } },
    ],
  },
  {
    id: 'ball', icon: '💃', title: 'The Pier Ball', w: 3, when: (L) => !L.partner() && L.s.age < 70 && L.friends().length < 8,
    text: 'Fairy lights on the pier, a band, and across the floor someone is looking at you.',
    opts: [
      { t: 'Ask them to dance', check: ['charm', 40], run(L, x, win) { if (win) { const p = L.meet({ spark: true, bond: 30 }); L.joy(5); return `Three dances later you know that ${p.name} hates olives and loves the sea.`; } L.joy(-1); return 'You tread on their foot, twice. They are very nice about it.'; } },
      { t: 'Hold up the wall', run() { return 'You eat nine sausage rolls.'; } },
    ],
  },
  {
    id: 'scholar', icon: '🏅', title: 'A letter from the Dean', w: 3, once: true, when: (L) => L.s.course && L.s.st.smarts >= 55,
    text: 'Your marks have been noticed. The college is awarding you the Starling Scholarship.',
    opts: [{ t: 'Accept graciously', run(L) { L.cash(4000); L.joy(6); return '$4,000 towards your studies, and your name on a board in the hall.'; } }],
  },

  // ---- body and mind ----
  {
    id: 'tooth', icon: '🦷', title: 'Toothache', w: 2,
    text: 'It started as a twinge. It is now the only thing you can think about.',
    opts: [
      { t: 'See the dentist', cost: 300, run() { return 'Twenty unpleasant minutes and it is over.'; } },
      { t: 'It will pass', run(L) { L.sicken('toothache', 1); L.joy(-3); return 'It does not pass.'; } },
    ],
  },
  {
    id: 'flu', icon: '🤧', title: 'Something going round', w: 3, when: (L) => L.season >= 2,
    text: 'Half the town has it. Now your head is full of wet sand and your bones ache.',
    opts: [
      { t: 'Go to bed until it is gone', run(L) { busy(L, 2); L.hp(2); return 'Soup, sleep, and daytime television.'; } },
      { t: 'Soldier on', run(L) { L.sicken('flu', 1); L.hp(-4, 'flu'); return 'You give it to everyone you meet.'; } },
    ],
  },
  {
    id: 'back', icon: '🧍', title: 'Your back has opinions', w: 2, when: (L) => L.s.age >= 36,
    text: 'You bent down to pick up a sock. You are still down there.',
    opts: [
      { t: 'See a physio', cost: 400, run(L) { L.hp(2); return 'She does something terrible to your spine and you can stand again.'; } },
      { t: 'Lie on the floor for a week', run(L) { busy(L, 2); return 'You learn every inch of the ceiling.'; } },
      { t: 'Ignore it', run(L) { L.sicken('bad back', 1); return 'You walk like a question mark.'; } },
    ],
  },
  {
    id: 'ankle', icon: '🦶', title: 'A wrong step', w: 2, when: (L) => L.s.st.fitness >= 30,
    text: 'Out running, your foot finds a rabbit hole. There is a noise like a celery stick.',
    opts: [
      { t: 'Rest it properly', run(L) { busy(L, 1); return 'A week with your foot on a cushion.'; } },
      { t: 'Run it off', check: ['fitness', 50], run(L, x, win) { if (win) return 'It loosens up by the second mile. Tough as old boots, you.'; L.sicken('torn ligament', 2); L.lose('fitness', 2); return 'It does not loosen up. It was a ligament.'; } },
    ],
  },
  {
    id: 'scare', icon: '💓', title: 'A tightness in the chest', w: 2, when: (L) => L.s.age >= 50,
    text: 'Halfway up the hill you have to stop and hold the railing. It passes. Probably nothing.',
    opts: [
      { t: 'Go straight to St Wren’s', cost: 1200, run(L) { L.hp(5); return 'Tests, tablets, and a talking-to. Caught early.'; } },
      { t: 'Probably nothing', odds: () => 0.5, run(L, x, win) { if (win) return 'It was nothing. This time.'; L.sicken('heart trouble', 3); L.hp(-15, 'heart trouble'); return 'It was not nothing.'; } },
    ],
  },
  {
    id: 'burnout', icon: '🕯️', title: 'Running on empty', w: 5, cd: 8, when: (L) => inJob(L) && L.s.happy < 24,
    text: 'You stare at the same task for an hour. You cannot remember the last time you laughed.',
    opts: [
      { t: 'Take some leave', run(L) { busy(L, 3); L.joy(14); L.hp(3); return 'You sleep, walk, and stare at the sea. Slowly the colour comes back.'; } },
      { t: 'Push through', run(L) { L.hp(-8, 'overwork'); L.joy(-5); credit(L, 1); return 'You get it done. It costs more than it should.'; } },
      { t: 'Walk out and do not go back', run(L) { const t = L.jobTitle(); L.s.job = null; L.joy(12); L.note(`Walked out of the job as ${t}.`); return 'You leave your lanyard on the desk. The air outside tastes different.'; } },
    ],
  },
  {
    id: 'marathon', icon: '🏃', title: 'The Coast Marathon', w: 2, when: (L) => L.s.st.fitness >= 50 && L.s.age < 70,
    text: 'Twenty-six miles of cliff path, in aid of the lifeboat. There is a place if you want it.',
    opts: [
      { t: 'Run it', check: ['fitness', 65], run(L, x, win) { L.karma(2); if (win) { L.fame(2); L.joy(10); return 'You cross the line with your arms in the air. The medal weighs a ton and you wear it for a week.'; } L.hp(-6, 'a marathon'); L.joy(2); return 'You finish, eventually, on legs made of string.'; } },
      { t: 'Sponsor a friend instead', cost: 100, run(L) { L.karma(2); return 'You shout from the roadside, holding an orange slice.'; } },
    ],
  },

  // ---- work ----
  {
    id: 'credit', icon: '🙋', title: 'That was MY idea', w: 3, when: (L) => inJob(L),
    text: 'In front of everyone, a workmate presents your idea as their own. The boss is delighted.',
    opts: [
      { t: 'Set the record straight', check: ['charm', 45], run(L, x, win) { if (win) { credit(L, 2); L.joy(3); return 'Calmly, with dates. The boss takes note of who really did the work.'; } L.joy(-4); return 'It comes out petty. You wish you had said nothing.'; } },
      { t: 'Let it go', run(L) { L.joy(-2); L.karma(1); return 'You know. They know. That will have to do.'; } },
      { t: 'Get even', run(L) { L.karma(-4); L.joy(2); return 'Their stapler is found in a jelly. Nobody can prove a thing.'; } },
    ],
  },
  {
    id: 'overtime', icon: '🌙', title: 'A favour', w: 3, when: (L) => inJob(L),
    text: '"I hate to ask," says the boss, who does not hate to ask, "but could you come in over the weekend? Unpaid, I am afraid."',
    opts: [
      { t: 'Of course', run(L) { busy(L, 2); credit(L, 2); L.joy(-2); return 'It is noticed. It will count when promotions come round.'; } },
      { t: 'Say no, nicely', check: ['charm', 40], run(L, x, win) { if (win) return 'You are so gracious about it that the boss apologises to YOU.'; L.joy(-3); return 'A chill settles over your corner for a while.'; } },
    ],
  },
  {
    id: 'mistake', icon: '😬', title: 'Oh no', w: 3, when: (L) => inJob(L),
    text: 'You have made a mistake at work. A real one. Nobody has spotted it yet.',
    opts: [
      { t: 'Own up', odds: () => 0.7, run(L, x, win) { L.karma(3); if (win) return 'The boss sighs, and helps you fix it. "Thank you for telling me."'; const n = Math.round(pay(L) / 2); L.cash(-n); return `The boss is fair but firm: ${money(n)} docked from your pay.`; } },
      { t: 'Cover it up', check: ['smarts', 55], run(L, x, win) { L.karma(-3); if (win) return 'By Friday there is no trace of it. Your pulse returns to normal by Sunday.'; fire(L); L.joy(-10); return 'The cover-up is worse than the mistake. You are sacked.'; } },
    ],
  },
  {
    id: 'poach', icon: '🤝', title: 'A quiet word', w: 2, when: (L) => inJob(L) && L.s.job.r >= 2,
    text: 'A rival outfit takes you to lunch. They would like you to come and work for them.',
    opts: [
      { t: 'Use it to ask for a bonus', check: ['charm', 50], run(L, x, win) { if (win) { const n = pay(L) * 2; L.cash(n); return `Your boss goes pale and finds ${money(n)} from somewhere.`; } L.joy(-2); return '"Then go," says your boss. You do not go. It is awkward.'; } },
      { t: 'Stay loyal, say nothing', run(L) { L.karma(1); L.joy(1); return 'A free lunch is a free lunch.'; } },
    ],
  },
  {
    id: 'party', icon: '🥳', title: 'The works do', w: 2, when: (L) => inJob(L),
    text: 'The annual staff party. There is a free bar and a karaoke machine.',
    opts: [
      { t: 'Go all in', odds: () => 0.75, run(L, x, win) { L.gain('charm', 2); if (win) { L.joy(5); credit(L, 1); return 'Your duet with the boss is the stuff of legend.'; } L.joy(-3); return 'You remember nothing after the conga. People keep winking at you.'; } },
      { t: 'One drink and home', run(L) { L.gain('charm', 0.8); return 'Sensible. You miss the bit with the fire extinguisher.'; } },
    ],
  },
  {
    id: 'hurt', icon: '🩹', title: 'An accident at work', w: 2, when: (L) => inJob(L, 'trades', 'sea', 'sports', 'kitchen'),
    text: 'One slip. You know before you look that it is going to need more than a plaster.',
    opts: [
      { t: 'Take time off to mend', run(L) { L.hp(-6, 'an accident at work'); busy(L, 2); return 'Signed off. You watch a great deal of snooker.'; } },
      { t: 'Strap it up and carry on', run(L) { L.hp(-10, 'an accident at work'); L.sicken('bad shoulder', 2); credit(L, 1); return 'The boss is impressed. Your shoulder is not.'; } },
    ],
  },
  {
    id: 'gale', icon: '🌊', title: 'Caught out', w: 3, when: (L) => inJob(L, 'sea'),
    text: 'The forecast was wrong. Ten miles out the sky goes black, and the sea stands up.',
    opts: [
      { t: 'Ride it out and save the catch', check: ['fitness', 50], run(L, x, win) { if (win) { credit(L, 2); L.fame(1); L.joy(4); return 'Nine hours at the wheel. You bring boat, crew and catch home. They buy your drinks for a month.'; } L.hp(-15, 'a storm at sea'); return 'A wave takes you off your feet and into the winch. You are lucky to come home at all.'; } },
      { t: 'Cut the nets and run for harbour', run(L) { const n = Math.round(pay(L) / 2); L.cash(-n); return `Everyone is safe. The lost gear comes out of the wages: ${money(n)}.`; } },
    ],
  },
  {
    id: 'fire', icon: '🔥', title: 'Fire in the kitchen', w: 3, when: (L) => inJob(L, 'kitchen'),
    text: 'The fryer goes up with a WHUMP. Flames are licking the extractor.',
    opts: [
      { t: 'Grab the fire blanket', check: ['fitness', 35], run(L, x, win) { if (win) { L.cash(500); L.karma(2); credit(L, 1); return 'Out in seconds. The landlord gives you $500 and a new nickname.'; } L.hp(-8, 'a kitchen fire'); return 'You put it out, and lose both eyebrows doing it.'; } },
      { t: 'Get everybody out', run(L) { L.karma(3); return 'You clear the pub in a minute flat. The fire brigade does the rest.'; } },
    ],
  },
  {
    id: 'vip', icon: '🕶️', title: 'Is that...?', w: 2, when: (L) => inJob(L, 'kitchen', 'retail', 'arts'),
    text: 'Dark glasses, a hat, and a face off the television. They have come in, and you are the one serving.',
    opts: [
      { t: 'Turn on the charm', check: ['charm', 50], run(L, x, win) { if (win) { L.cash(500); L.fame(2); return 'They leave a $500 tip and mention you in an interview.'; } L.joy(-2); return 'You call them by the name of a different famous person.'; } },
      { t: 'Treat them like anyone else', run(L) { L.karma(1); L.joy(2); return 'They seem grateful. On the way out, a small nod.'; } },
    ],
  },
  {
    id: 'bribe', icon: '💼', title: 'An envelope', w: 2, when: (L) => inJob(L, 'police', 'politics', 'law'),
    text: 'A developer slides an envelope across the table. "For your trouble. Nobody need know." It is thick.',
    opts: [
      { t: 'Take it', odds: () => 0.72, run(L, x, win) { L.karma(-10); if (win) { L.cash(10000); return '$10,000. You do not sleep well.'; } fire(L); L.s.record++; L.joy(-15); return 'It was a sting. You are sacked, charged, and in the papers.'; } },
      { t: 'Report it', run(L) { L.karma(6); credit(L, 2); return 'The developer is arrested at his golf club. Your name is mentioned upstairs, approvingly.'; } },
    ],
  },
  {
    id: 'outage', icon: '🚨', title: 'It is all on fire', w: 3, when: (L) => inJob(L, 'tech'),
    text: 'Two in the morning. Your phone is buzzing itself off the bedside table. Everything is down.',
    opts: [
      { t: 'Fix it', check: ['smarts', 55], run(L, x, win) { if (win) { const n = pay(L); L.cash(n); credit(L, 1); return `One missing semicolon. You are a hero by breakfast, with a ${money(n)} bonus.`; } L.joy(-4); return 'It takes you until noon, and someone else to spot it.'; } },
      { t: 'Blame the intern', run(L) { L.karma(-4); return 'The intern cries. You feel like a heel, because you are one.'; } },
    ],
  },
  {
    id: 'ward', icon: '🌃', title: 'A long night on the ward', w: 3, when: (L) => inJob(L, 'medicine'),
    text: 'Your shift ended an hour ago. An old man in bed six has nobody, and is frightened.',
    opts: [
      { t: 'Sit with him', run(L) { L.hp(-2); L.karma(4); credit(L, 1); return 'You hold his hand until morning. He tells you about the war, and his wife, and the sea.'; } },
      { t: 'Go home', run() { return 'You need your sleep too. You think about him on the bus.'; } },
    ],
  },
  {
    id: 'deal', icon: '📊', title: 'The big one', w: 3, when: (L) => inJob(L, 'finance', 'retail') && L.s.job.r >= 2,
    text: 'A deal lands on your desk that could make your year, or end your career.',
    opts: [
      { t: 'Go for it', check: ['smarts', 60], run(L, x, win) { if (win) { const n = pay(L) * 3; L.cash(n); credit(L, 2); return `It comes off. A bonus of ${money(n)}, and your name in the newsletter.`; } const n = pay(L); L.cash(-n); L.joy(-5); return `It unravels. ${money(n)} is clawed back from your pay.`; } },
      { t: 'Play it safe', run() { return 'Someone else takes it. You will never know.'; } },
    ],
  },
  {
    id: 'final', icon: '🏟️', title: 'The Cup Final', w: 4, cd: 8, when: (L) => inJob(L, 'sports') && L.s.job.r >= 2,
    text: 'Ninety minutes gone, the scores level, and the ball comes to you.',
    opts: [
      { t: 'Take the shot', check: ['fitness', 70], run(L, x, win) { if (win) { const n = pay(L) * 2; L.cash(n); L.fame(5); L.joy(10); return `Top corner. The stadium comes down. A win bonus of ${money(n)}.`; } L.joy(-4); return 'Row Z. They will show it on blooper reels for years.'; } },
      { t: 'Pass', run(L) { L.karma(1); return 'A team player. Your team-mate hits the post.'; } },
    ],
  },
  {
    id: 'tour', icon: '🚐', title: 'On the road', w: 3, when: (L) => inJob(L, 'arts') && L.s.job.r >= 1,
    text: 'A band you love needs a support act for a national tour. It pays in petrol and exposure.',
    opts: [
      { t: 'Get in the van', run(L) { busy(L, 3); L.fame(6); L.gain('craft', 2.5); L.joy(6); return 'Thirty towns, thirty service stations. Every night a few more people sing along.'; } },
      { t: 'Stay home', run() { return 'You see the photographs. It looks cold, and wonderful.'; } },
    ],
  },
  {
    id: 'strike', icon: '🪧', title: 'Everybody out', w: 2, when: (L) => inJob(L, 'trades', 'medicine', 'teaching', 'retail', 'sea'),
    text: 'The union has called a strike. There is a picket line at the gate, and a brazier.',
    opts: [
      { t: 'Join the picket', run(L) { L.cash(-Math.round(pay(L) / 2)); L.karma(3); const p = L.maybeMeet(0.4); return p ? `Cold hands, hot tea, and ${p.name}, who has a megaphone and is not afraid to use it.` : 'Cold hands and hot tea. You lose some pay and win the argument.'; } },
      { t: 'Go in to work', run(L) { L.cash(pay(L)); L.karma(-4); return 'Double pay for the day. Nobody will sit with you at lunch.'; } },
    ],
  },
  {
    id: 'cuts', icon: '✂️', title: 'Restructuring', w: 2, when: (L) => inJob(L) && L.s.job.r <= 3 && L.s.t > 12,
    text: 'A memo full of words like "synergy". Your job is "at risk".',
    opts: [
      { t: 'Fight for your job', check: ['charm', 50], run(L, x, win) { if (win) { credit(L, 1); return 'You make your case so well that they keep you and lose your manager instead.'; } const n = pay(L) * 2; L.cash(n); fire(L); L.joy(-8); return `It was decided before the meeting began. You leave with ${money(n)}.`; } },
      { t: 'Take the pay-off', run(L) { const n = pay(L) * 4; L.cash(n); const t = L.jobTitle(); L.s.job = null; L.note(`Made redundant as ${t}.`); return `You leave with ${money(n)} and a box of your things.`; } },
    ],
  },

  // ---- friends and lovers ----
  {
    id: 'loan', icon: '🫴', title: 'Could you possibly...?', w: 3, ctx: aFriend, ok: has, when: (L) => L.s.cash >= 500,
    text: (L, x) => `${P(L, x).name} is short this month, and embarrassed about it. Could you lend $500?`,
    opts: [
      { t: 'Lend it', cost: 500, odds: () => 0.6, run(L, x, win) { const p = P(L, x); if (win) { L.cash(500); L.bond(p, 10); return `${p.name} pays back every penny, with a bottle of wine on top.`; } L.bond(p, 4); L.karma(2); return `You do not see the money again, but ${p.name} will not forget it.`; } },
      { t: 'Say you cannot', run(L, x) { L.bond(P(L, x), -8); return 'They say they understand.'; } },
    ],
  },
  {
    id: 'pals', icon: '💒', title: 'Save the date', w: 2, ctx: aFriend, ok: has,
    text: (L, x) => `${P(L, x).name} is getting married, and you are invited.`,
    opts: [
      { t: 'Go, with a good present', cost: 200, run(L, x) { L.bond(P(L, x), 10); L.joy(5); const p = L.maybeMeet(0.35); return p ? `You are put on the odd-ones-out table, which is how you meet ${p.name}.` : 'You cry at the vows and dance to everything.'; } },
      { t: 'Send your regrets', run(L, x) { L.bond(P(L, x), -6); return 'You see the photographs afterwards.'; } },
    ],
  },
  {
    id: 'trip', icon: '🚙', title: 'Get in, we are going', w: 2, ctx: aFriend, ok: has,
    text: (L, x) => `${P(L, x).name} is outside in a borrowed car, engine running. "Road trip. No, I will not tell you where."`,
    opts: [
      { t: 'Get in', run(L, x) { busy(L, 2); L.bond(P(L, x), 10); L.joy(10); if (L.chance(0.2)) { L.gain('charm', 1); return 'You come home three days later with a tattoo of an anchor and no memory of choosing it.'; } return 'Three days, four hundred miles, one flat tyre. The best.'; } },
      { t: 'Be sensible', run(L, x) { L.bond(P(L, x), -3); return 'They go without you and send pictures.'; } },
    ],
  },
  {
    id: 'crisis', icon: '📱', title: '3 a.m.', w: 2, ctx: aFriend, ok: has,
    text: (L, x) => `Your phone lights up. ${P(L, x).name}: "Are you awake? I am having a really bad night."`,
    opts: [
      { t: 'Go round', run(L, x) { L.bond(P(L, x), 12); L.karma(3); L.hp(-1); return 'Tea, toast, and talking until it gets light.'; } },
      { t: 'Reply in the morning', run(L, x) { L.bond(P(L, x), -5); return 'By morning they say they are fine. They do not sound it.'; } },
    ],
  },
  {
    id: 'away', icon: '🚆', title: 'Moving on', w: 1, ctx: (L) => { const f = L.friends().filter((p) => p.bond < 45); return f.length ? L.pick(f).id : null; }, ok: has,
    text: (L, x) => `${P(L, x).name} has been offered a job in the city, and is taking it.`,
    opts: [
      { t: 'Throw them a send-off', cost: 150, run(L, x) { const p = P(L, x); L.s.people.splice(L.s.people.indexOf(p), 1); L.joy(3); L.karma(1); return `Half the pub turns out. ${p.name} promises to write, and for a while, does.`; } },
      { t: 'Wave from the platform', run(L, x) { const p = P(L, x); L.s.people.splice(L.s.people.indexOf(p), 1); return 'The train gets small, and then it is gone.'; } },
    ],
  },
  {
    id: 'surprise', icon: '🎂', title: 'SURPRISE!', w: 2, cd: 40, when: (L) => L.friends().filter((p) => p.bond >= 50).length >= 3,
    text: 'You open your front door to darkness, a muffled giggle, and then every light at once.',
    opts: [{ t: 'You shouldn’t have!', run(L) { L.joy(12); for (const p of L.friends()) L.bond(p, 3); return 'They did, though. There is a cake shaped like a lighthouse.'; } }],
  },
  {
    id: 'row', icon: '💢', title: 'A row', w: 3, when: (L) => !!L.partner(),
    text: (L) => `It starts over the washing-up and ends up about everything. ${L.partner().name} is in the other room with the door shut.`,
    opts: [
      { t: 'Say sorry first', run(L) { L.bond(L.partner(), 5); return 'It was never about the washing-up. You talk until late.'; } },
      { t: 'Stand your ground', check: ['charm', 50], run(L, x, win) { const p = L.partner(); if (win) { L.bond(p, 3); return `You make your case without raising your voice. ${p.name} comes round.`; } L.bond(p, -10); return 'You win the argument. It does not feel like winning.'; } },
      { t: 'Sulk', run(L) { L.bond(L.partner(), -5); L.joy(-2); return 'Two days of very polite silence.'; } },
    ],
  },
  {
    id: 'anniv', icon: '🌹', title: 'An anniversary', w: 3, when: (L) => L.partner()?.kind === 'spouse',
    text: (L) => `It is your wedding anniversary on Saturday. ${L.partner().name} has not mentioned it. This is a test.`,
    opts: [
      { t: 'Grand gesture', cost: 800, run(L) { L.bond(L.partner(), 12); L.joy(6); return 'A table at the good restaurant, and the song from your wedding.'; } },
      { t: 'Make something by hand', check: ['craft', 35], run(L, x, win) { const p = L.partner(); if (win) { L.bond(p, 12); return `${p.name} cries, and puts it on the mantelpiece.`; } L.bond(p, 3); return 'It is the thought that counts, you are told, kindly.'; } },
      { t: 'It will be fine', run(L) { L.bond(L.partner(), -12); return 'It was not fine.'; } },
    ],
  },
  {
    id: 'inlaws', icon: '🫖', title: 'The in-laws are coming', w: 2, when: (L) => L.partner()?.kind === 'spouse',
    text: 'For a fortnight. They have opinions about your curtains.',
    opts: [
      { t: 'Be the perfect host', check: ['charm', 45], run(L, x, win) { const p = L.partner(); L.joy(-2); if (win) { L.bond(p, 8); return 'By the end they are calling you "our favourite".'; } L.bond(p, -2); return 'You smile until your face aches. It is not quite enough.'; } },
      { t: 'Find a lot to do at work', run(L) { L.bond(L.partner(), -6); return 'You come home each night after they have gone to bed.'; } },
    ],
  },

  // ---- family ----
  {
    id: 'home', icon: '☎️', title: 'A call from home', w: 3, ctx: aParent, ok: has,
    text: (L, x) => `It is ${P(L, x).name}. Nothing is wrong, exactly. But could you come for a few days?`,
    opts: [
      { t: 'Go', run(L, x) { busy(L, 2); for (const p of L.s.people) if (p.kind === 'parent') L.bond(p, 12); L.joy(3); return 'You fix a shelf, eat too much, and are glad you went.'; } },
      { t: 'Send flowers', cost: 60, run(L, x) { L.bond(P(L, x), 3); return 'A nice thought, they say.'; } },
      { t: 'Too busy just now', run(L, x) { L.bond(P(L, x), -6); return '"Of course, love. Another time."'; } },
    ],
  },
  {
    id: 'play', icon: '🎭', title: 'The school play', w: 3, ctx: aKid(5, 11), ok: has,
    text: (L, x) => `${P(L, x).name} is in the school play. The part is Second Tree. They have been practising standing still for weeks.`,
    opts: [
      { t: 'Front row', run(L, x) { busy(L, 1); L.bond(P(L, x), 8); L.joy(5); return 'The best tree you have ever seen. You tell everyone near you whose tree that is.'; } },
      { t: 'Work comes first', run(L, x) { L.bond(P(L, x), -7); return 'They say it does not matter. They looked for you from the stage.'; } },
    ],
  },
  {
    id: 'teen', icon: '🚪', title: 'A letter from school', w: 3, ctx: aKid(12, 17), ok: has,
    text: (L, x) => `${P(L, x).name} has been skipping lessons to sit on the harbour wall with friends.`,
    opts: [
      { t: 'A long talk', check: ['charm', 45], run(L, x, win) { const p = P(L, x); if (win) { L.bond(p, 8); return 'It takes an hour to get past the shrugging. Then it all comes out, and you sort it together.'; } L.bond(p, -3); return 'A door slams. Music comes on, loud.'; } },
      { t: 'Grounded', run(L, x) { L.bond(P(L, x), -5); return 'They do go to school. They do not speak to you.'; } },
      { t: 'You did the same at their age', run(L, x) { L.bond(P(L, x), 3); L.karma(-1); return 'You say nothing. They look at you with new interest.'; } },
    ],
  },
  {
    id: 'gift', icon: '🎻', title: 'A knack for it', w: 2, ctx: aKid(6, 15), ok: has,
    text: (L, x) => `${P(L, x).name}'s teacher takes you aside. Your child has a real gift, and it ought to be encouraged.`,
    opts: [
      { t: 'Pay for lessons', cost: 800, run(L, x) { L.bond(P(L, x), 6); L.joy(3); return 'The house fills up with scales, played badly, then less badly.'; } },
      { t: 'Teach them yourself', run(L, x) { busy(L, 1); L.bond(P(L, x), 10); L.joy(4); return 'Saturday mornings, just the two of you.'; } },
    ],
  },
  {
    id: 'deposit', icon: '🏦', title: 'Mum? Dad?', w: 2, ctx: aKid(22, 45), ok: has, when: (L) => L.s.cash + L.s.bank >= 5000,
    text: (L, x) => `${P(L, x).name} has found a little flat, and is $5,000 short of the deposit.`,
    opts: [
      { t: 'Give them the $5,000', cost: 5000, run(L, x) { L.bond(P(L, x), 12); L.joy(4); return 'They hug you so hard your glasses come off.'; } },
      { t: 'Lend half', cost: 2500, run(L, x) { L.bond(P(L, x), 4); return 'It helps. They will pay you back, they say, and sort of do.'; } },
      { t: 'They must stand on their own feet', run(L, x) { L.bond(P(L, x), -8); return 'They say they understand. The flat goes to someone else.'; } },
    ],
  },
  {
    id: 'visit', icon: '🧒', title: 'Little visitors', w: 4, cd: 10, when: (L) => !!L.s.f.grand,
    text: 'The grandchildren are here for the weekend. Something is already broken.',
    opts: [
      { t: 'Tell them stories of the old days', run(L) { L.joy(8); return 'They do not believe a word about life before telephones.'; } },
      { t: 'Slip them $50 each', cost: 100, run(L) { L.joy(6); for (const k of L.kids()) L.bond(k, 2); return '"Do not tell your parents." They tell their parents.'; } },
    ],
  },
  {
    id: 'bowls', icon: '🎳', title: 'The Bowls Club', w: 3, once: true, when: (L) => L.s.age >= 62,
    text: 'The Starling Bay Bowls Club is short of a fourth. They have been eyeing you up.',
    opts: [
      { t: 'Join', run(L) { L.gain('fitness', 1.5); L.joy(5); const p = L.maybeMeet(0.9); return p ? `It is ferocious. Your partner, ${p.name}, has not lost since the seventies.` : 'It is ferocious. You love it.'; } },
      { t: 'Not yet, thank you', run() { return 'You are not that old. Are you?'; } },
    ],
  },
  {
    id: 'fan', icon: '🖊️', title: 'Aren’t you...?', w: 3, cd: 10, when: (L) => L.s.fame >= 30,
    text: 'A stranger stops dead in the street, points, and says your name.',
    opts: [
      { t: 'Sign whatever they have', run(L) { L.joy(3); L.fame(0.5); L.karma(1); return 'It is a parking ticket. You sign it with a flourish.'; } },
      { t: 'Pretend to be your own cousin', run() { return '"People say that all the time," you tell them.'; } },
    ],
  },
  {
    id: 'press', icon: '📰', title: 'In the papers', w: 2, when: (L) => L.s.fame >= 55,
    text: 'A tabloid has printed a story about you. Very little of it is true and the photograph is dreadful.',
    opts: [
      { t: 'Laugh it off in public', check: ['charm', 55], run(L, x, win) { if (win) { L.fame(3); return 'Your reply goes further than the story did. People like you more than before.'; } L.fame(-3); L.joy(-5); return 'Your joke falls flat, and now that is a story too.'; } },
      { t: 'Sue', cost: 5000, odds: () => 0.5, run(L, x, win) { if (win) { L.cash(25000); return 'They settle on the court steps: $25,000 and an apology on page two.'; } return 'The judge calls it "fair comment". The lawyers keep your $5,000.'; } },
    ],
  },

  {
    id: 'reunion', icon: '🏫', title: 'Class reunion', w: 2, once: true, when: (L) => L.s.age >= 28 && L.s.age <= 50,
    text: 'An invitation, on school notepaper. Everyone you sat next to at fourteen, in one room, with name badges.',
    opts: [
      { t: 'Go, and hold your head up', check: ['charm', 45], run(L, x, win) { if (win) { L.joy(6); const p = L.maybeMeet(0.6); return p ? `You were dreading it. Then ${p.name}, who you barely knew back then, turns out to be the best company in the room.` : 'You were dreading it. It is a riot. Nobody has changed and everybody has.'; } L.joy(-2); return 'You spend the evening being told how well everyone else is doing.'; } },
      { t: 'Send a postcard instead', run() { return '"Wish you were here," you write, from here.'; } },
    ],
  },
  {
    id: 'choir', icon: '🎶', title: 'The Harbour Singers', w: 2, once: true, when: (L) => L.s.age >= 22,
    text: 'A notice in the chandlery window: "Choir wants voices. Enthusiasm essential. Talent optional."',
    opts: [
      { t: 'Turn up on Thursday', run(L) { L.gain('craft', 2.5); L.joy(5); const p = L.maybeMeet(0.7); return p ? `You are put in the back row next to ${p.name}, who cannot sing either. You have a wonderful time.` : 'Forty people singing sea shanties, slightly flat, at the top of their lungs. Glorious.'; } },
      { t: 'Walk on by', run() { return 'You hum all the way home, though.'; } },
    ],
  },
  {
    id: 'hedge', icon: '🌳', title: 'The hedge', w: 2, when: (L) => ['flat', 'cottage', 'townhouse', 'villa', 'manor'].includes(L.s.home),
    text: 'Your neighbour says your hedge is on his side. You say it is not. This has now been going on for a month.',
    opts: [
      { t: 'Talk it out over the fence', check: ['charm', 45], run(L, x, win) { if (win) { L.joy(4); L.karma(1); return 'It ends with a handshake and a jar of his chutney.'; } L.joy(-4); return 'It ends with a slammed gate.'; } },
      { t: 'Trim it into something splendid', check: ['craft', 50], run(L, x, win) { if (win) { L.joy(5); L.fame(0.5); return 'It is now a peacock. He is speechless. People come to look at it.'; } L.joy(-2); return 'It was meant to be a peacock. It is not a peacock.'; } },
      { t: 'Send a solicitor’s letter', cost: 800, run(L) { L.karma(-1); return 'You win, on paper. He never speaks to you again.'; } },
    ],
  },
  {
    id: 'nights', icon: '🌙', title: 'Night feeds', w: 5, cd: 6, ctx: aKid(0, 1), ok: has,
    text: (L, x) => `It is ten past three. ${P(L, x).name} is wide awake and wishes everybody to know it.`,
    opts: [
      { t: 'Take turns', show: (L) => !!L.partner(), run(L, x) { L.hp(-1); L.bond(L.partner(), 4); return 'You pass each other in the hall like ghosts. You have never been more of a team.'; } },
      { t: 'I have got this', run(L, x) { L.hp(-4, 'exhaustion'); L.bond(P(L, x), 6); return 'You walk the floor until the birds start. A small hand holds your thumb the whole time.'; } },
    ],
  },
  {
    id: 'steps', icon: '👣', title: 'First steps', w: 5, once: true, ctx: aKid(1, 2), ok: has,
    text: (L, x) => `${P(L, x).name} lets go of the sofa, looks at you, and sets off across the room.`,
    opts: [{ t: 'Hold out your arms', run(L, x) { L.joy(10); L.bond(P(L, x), 5); return 'Four steps, and into your arms. You will remember this when you are ninety.'; } }],
  },
  {
    id: 'fall', icon: '🪜', title: 'The front step', w: 3, when: (L) => L.s.age >= 74,
    text: 'Frost on the step, and your foot goes from under you.',
    opts: [
      { t: 'Grab the rail', check: ['fitness', 35], run(L, x, win) { if (win) return 'You catch yourself. Heart going like a drum, but still standing. All those walks paid off.'; L.hp(-12, 'a fall'); L.sicken('broken hip', 2); return 'You go down hard. The ambulance crew are very kind.'; } },
    ],
  },
  {
    id: 'memoir', icon: '🗞️', title: 'The Starling Bay Gazette', w: 3, once: true, when: (L) => L.s.age >= 68,
    text: 'The editor of the Gazette would like to print your memories of the town, a chapter a week.',
    opts: [
      { t: 'Tell them everything', run(L) { L.fame(2); L.joy(6); return 'People stop you in the street to argue about what really happened in the year of the big snow.'; } },
      { t: 'Some things are best forgotten', run(L) { L.joy(1); return 'You tell them about the weather instead.'; } },
    ],
  },
  {
    id: 'will', icon: '📜', title: 'Putting things in order', w: 3, once: true, when: (L) => L.s.age >= 60 && L.s.cash + L.s.bank >= 20000,
    text: 'The solicitor uncaps her pen. "And is there anything you would like to do with your money while you are still here to enjoy it?"',
    opts: [
      { t: 'A new boat for the lifeboat station', cost: 10000, run(L) { L.karma(8); L.s.n.given += 10000; L.joy(5); return 'They name her after you. You launch her with a bottle of the cheap stuff.'; } },
      { t: 'Something for each of the children', cost: 6000, show: (L) => L.kids().length > 0, run(L) { for (const k of L.kids()) L.bond(k, 8); L.joy(4); return 'They say you should not have. You tell them to hush.'; } },
      { t: 'I plan to live for ever', run(L) { L.joy(2); return '"Very good," says the solicitor, and writes that down.'; } },
    ],
  },

  // ---- three longer stories ----
  {
    id: 'bottle1', icon: '🍾', title: 'A bottle on the tideline', w: 2, once: true,
    text: 'Green glass, sealed with wax, rolling in the foam. There is a paper inside.',
    opts: [
      { t: 'Break the seal', run(L) { L.s.f.bottle = 1; return 'Half a map, in brown ink, and a line of verse that makes no sense at all. You keep it in your coat.'; } },
      { t: 'Leave it for the next tide', run() { return 'Some things are better as mysteries.'; } },
    ],
  },
  {
    id: 'bottle2', icon: '🗺️', title: 'The map', w: 6, cd: 4, when: (L) => L.s.f.bottle === 1,
    text: 'You take out the map again. "Where the wren sleeps and the starling turns..." There must be a way to read it.',
    opts: [
      { t: 'Puzzle it out', check: ['smarts', 45], run(L, x, win) { if (win) { L.s.f.bottle = 2; L.gain('smarts', 1); return 'St Wren’s. Starling Point. Draw the line between them and it crosses the cliffs, right at the old smugglers’ cave.'; } return 'You get as far as deciding it is not a recipe.'; } },
      { t: 'Put it away again', run() { return 'Another day.'; } },
    ],
  },
  {
    id: 'bottle3', icon: '⛏️', title: 'The smugglers’ cave', w: 6, cd: 4, when: (L) => L.s.f.bottle === 2,
    text: 'Low tide, a lantern, a spade. The cave floor is wet sand and round stones. Somewhere under here...',
    opts: [
      { t: 'Dig', check: ['fitness', 40], run(L, x, win) { if (win) { L.s.f.bottle = 3; L.s.f.treasure = 1; L.cash(25000); L.joy(12); L.fame(2); L.note('Dug up the smugglers’ treasure: $25,000 in old gold.', 'big'); return 'Four feet down the spade rings on iron. A chest, and in it gold coins with a king on them nobody remembers. The museum pays you $25,000.'; } return 'The tide turns before you are deep enough. You run for it, wet to the knees. Next time.'; } },
      { t: 'Too risky today', run() { return 'The tide waits for no one. Another day.'; } },
    ],
  },
  {
    id: 'dee1', icon: '🎷', title: 'The busker', w: 5, once: true, when: (L) => L.s.items.guitar && L.s.st.craft >= 25 && L.friends().length < 8,
    text: 'By the bandstand a woman with a battered saxophone nods at your guitar case. "Know any blues?"',
    opts: [
      { t: 'Sit down and play', run(L) { L.s.f.dee = 1; L.gain('craft', 2.5); L.joy(5); L.meet({ name: 'Dee Calloway', trait: 'arty', bond: 30, spark: false }); return 'An hour goes by like a minute. Her name is Dee, and she says you are not bad.'; } },
      { t: 'Shake your head', run() { return 'She shrugs and plays on.'; } },
    ],
  },
  {
    id: 'dee2', icon: '🎤', title: 'Dee has an idea', w: 6, cd: 6, when: (L) => L.s.f.dee === 1 && L.s.st.craft >= 40,
    text: '"A drummer, a bass, you and me," says Dee. "I have even got the name. The Tidal Waves."',
    opts: [
      { t: 'Let us do it', run(L) { L.s.f.dee = 2; L.s.f.band = 1; L.fame(3); L.joy(8); L.note('Formed a band: The Tidal Waves.', 'big'); return 'Rehearsals in a net loft that smells of tar. You are terrible. Then, one night, you are not.'; } },
      { t: 'I am more of a solo act', run(L) { L.s.f.dee = 9; return 'Dee looks at you for a moment. "Suit yourself."'; } },
    ],
  },
  {
    id: 'dee3', icon: '🎸', title: 'The big stage', w: 6, cd: 6, when: (L) => L.s.f.dee === 2 && L.s.st.craft >= 55,
    text: 'The Tidal Waves are top of the bill at the Regatta. Four thousand people. Dee counts you in.',
    opts: [
      { t: 'Play like you mean it', check: ['craft', 60], run(L, x, win) { L.s.f.dee = 3; if (win) { L.fame(8); L.cash(3000); L.joy(12); return 'The whole bay sings the last chorus back at you. $3,000 each, and a man from a record label at the side of the stage.'; } L.fame(2); L.joy(3); return 'A string breaks in the second song. You get through it. Dee says there will be other nights.'; } },
    ],
  },

  // ---- sent for by the rules ----
  {
    id: 'marlow1', icon: '🧓', title: 'Old Marlow', log: false,
    text: '"Sixty years I have been mending these," he says, not looking up, "and they still tangle the moment I turn my back."',
    opts: [
      { t: 'Offer to help', odds: (L) => 0.3 + Math.max(L.s.st.craft, L.s.st.fitness) / 100, run(L, x, win) { L.karma(2); if (win) { L.s.f.marlow = 1; L.gain('craft', 1.5); return 'It takes all afternoon. At the end he grunts, which you gather is high praise. "Come back sometime. I might teach you something."'; } return 'You make it rather worse. He laughs until he coughs. "Come back when you have got your fingers sorted."'; } },
      { t: 'Leave him to it', run() { return 'He mutters at the nets, and they mutter back.'; } },
    ],
  },
  {
    id: 'marlow2', icon: '🎣', title: 'A lesson', log: false,
    text: '"Fishing is not about the fish," says Marlow. "It is about knowing where the fish would rather be."',
    opts: [
      { t: 'Listen and learn', run(L) { const gave = !L.s.items.rod; L.s.items.rod = 1; L.s.f.marlow = 2; L.gain('smarts', 1.5); L.gain('fitness', 1); return `He shows you the knots, the tides, the mark off the lighthouse where the bass lie. ${gave ? 'He gives you his spare rod. ' : ''}"And if you ever see a gold one," he says, "be quick. I saw her once. Once."`; } },
    ],
  },
  {
    id: 'marlow3', icon: '⛵', title: 'The Peggy Sue',
    text: '"My knees are done," says Marlow. "The Peggy Sue needs someone who will take her out. I have watched you fish."',
    opts: [
      { t: 'Accept her, with thanks', show: (L) => !L.s.items.boat && L.s.karma >= 15, run(L) { L.s.items.boat = 1; L.s.f.marlow = 3; L.joy(12); L.note('Old Marlow gave you his boat, the Peggy Sue.', 'big'); return '"I will not take money from a friend," he says. He stands on the quay a long time, watching you sail her out.'; } },
      { t: 'Buy her', cost: 9000, show: (L) => !L.s.items.boat && L.s.karma < 15, run(L) { L.s.items.boat = 1; L.s.f.marlow = 3; L.joy(8); L.note('Bought the Peggy Sue from old Marlow.', 'big'); return 'A fifth of what she is worth. He pats her bow as he hands you the painter.'; } },
      { t: 'Take his old sextant instead', show: (L) => !!L.s.items.boat, run(L) { L.s.f.marlow = 3; L.gain('smarts', 3); L.joy(5); return '"You have a boat. Have this, then. Got me home more times than I can count."'; } },
      { t: 'She should stay with you', run(L) { L.s.f.marlow = 3; L.karma(3); return 'He nods slowly. "Maybe so." You help him aboard, and the two of you take her round the bay.'; } },
    ],
  },
  {
    id: 'busted', icon: '🚔', title: 'Evening, all',
    text: '"Well now," says the constable. "And what might be in the crate?"',
    opts: [
      { t: 'Come quietly', run(L) { if (L.s.record >= 1) { L.jail(2); return 'Second time. The magistrate is not amused: two seasons inside.'; } L.s.record++; L.cash(-4000); if (L.s.job && CAREERS[L.s.job.c].clean) fire(L); return 'A $4,000 fine and a criminal record. Sal has never heard of you.'; } },
      { t: 'Run for it', check: ['fitness', 55], run(L, x, win) { if (win) return 'Over the nets, round the ice house, and away. Your heart does not slow down for an hour.'; L.hp(-6, 'a fall'); L.jail(2); return 'You make it thirty yards before a lobster pot brings you down. Two seasons inside.'; } },
      { t: 'It was all Sal', check: ['charm', 60], run(L, x, win) { L.s.f.salOff = L.s.t + 8; if (win) return 'You are so convincing that the constable gives you a lift home. Sal will not be pleased.'; L.jail(3); return 'Sal has an alibi, and three witnesses. You get three seasons, and no friends at the harbour.'; } },
    ],
  },
  {
    id: 'dumped', icon: '💔', title: 'We need to talk', ok: (L, x) => has(L, x) && P(L, x).kind === 'partner',
    text: (L, x) => `${P(L, x).name} is sitting very straight, with their coat already on.`,
    opts: [{ t: 'Oh', run(L, x) { return `"You are never here. Not really." ${L.split(P(L, x), false)}`; } }],
  },
  {
    id: 'divorce', icon: '💔', title: 'It has not been right for a long time', ok: (L, x) => has(L, x) && P(L, x).kind === 'spouse',
    text: (L, x) => `${P(L, x).name} puts a solicitor's letter on the kitchen table, between the salt and the pepper.`,
    opts: [
      { t: 'Beg for another chance', check: ['charm', 60], run(L, x, win) { const p = P(L, x); if (win) { L.bond(p, 25); return 'You talk all night, properly, for the first time in years. The letter goes in the drawer.'; } return L.split(p, false); } },
      { t: 'Sign', run(L, x) { return L.split(P(L, x), false); } },
    ],
  },
  {
    id: 'wedding', icon: '💒', title: 'The wedding', ok: (L, x) => has(L, x) && P(L, x).kind === 'partner',
    text: (L, x) => `You and ${P(L, x).name} are getting married! What sort of day shall it be?`,
    opts: [
      { t: 'The registry office, and chips after', run(L, x) { return wed(L, x, 4, 8, 'Two witnesses off the street, and fish and chips in your finery on the sea wall. Perfect.'); } },
      { t: 'The village hall, and everyone you know', cost: 8000, run(L, x) { for (const p of L.friends()) L.bond(p, 6); return wed(L, x, 10, 14, 'A hog roast, a ceilidh, an uncle asleep under a table. The whole town is there.'); } },
      { t: 'A grand wedding on the cliffs', cost: 40000, run(L, x) { for (const p of L.friends()) L.bond(p, 8); L.fame(2); return wed(L, x, 16, 20, 'A marquee, a string quartet, fireworks over the bay. People will talk about it for years.'); } },
      { t: 'Call it off', run(L, x) { const p = P(L, x); p.eng = false; L.bond(p, -30); L.joy(-10); return `${p.name} does not speak to you for a long time.`; } },
    ],
  },
  {
    id: 'baby', icon: '🍼', title: (L, x) => (x.adopt ? 'A new member of the family' : 'A new arrival'),
    text: (L, x) => (x.adopt ? `The agency rings. A ${x.age}-year-old is waiting to come home with you. What will you call them?` : 'Seven pounds, furious, and perfect. What will you call your baby?'),
    opts: [
      { t: (L, x) => x.names[0], run(L, x) { return born(L, x, 0); } },
      { t: (L, x) => x.names[1], run(L, x) { return born(L, x, 1); } },
    ],
  },
  {
    id: 'kid18', icon: '🎒', title: 'Eighteen', ok: has,
    text: (L, x) => `${P(L, x).name} is eighteen today, with a place at college in the city. It costs a fortune.`,
    opts: [
      { t: 'Pay their way', cost: 20000, run(L, x) { L.bond(P(L, x), 15); L.joy(6); return 'You wave from the platform until the train is out of sight, then cry in the car park.'; } },
      { t: 'Help a little', cost: 5000, run(L, x) { L.bond(P(L, x), 5); L.joy(3); return 'They will work evenings to make up the rest. They are proud of that, later.'; } },
      { t: 'They can make their own way, like you did', run(L, x) { L.bond(P(L, x), -8); return 'They get a job on the boats instead, and say it is fine.'; } },
    ],
  },
  {
    id: 'grandchild', icon: '👶', title: 'News!', ok: has,
    text: (L, x) => `${P(L, x).name} rings, hardly able to speak. You have a grandchild.`,
    opts: [{ t: 'Wonderful!', run(L, x) { L.s.f.grand = 1; L.joy(12); L.bond(P(L, x), 6); return `They are calling the baby ${L.pick(NAMES)}. You start knitting at once, despite not knowing how.`; } }],
  },
  {
    id: 'parentDies', icon: '🕊️', title: 'A phone call in the night', ok: has,
    text: (L, x) => `${P(L, x).name} has died, peacefully, at ${P(L, x).age}.`,
    opts: [{ t: 'Goodbye', run(L, x) { const p = P(L, x), n = Math.round((3000 + p.bond * 120) / 100) * 100; L.s.people.splice(L.s.people.indexOf(p), 1); L.joy(-16); L.cash(n); return `The funeral is on a bright, windy day. They left you ${money(n)}, and their good watch.`; } }],
  },
  {
    id: 'spouseDies', icon: '🕊️', title: 'The empty chair', ok: has,
    text: (L, x) => `${P(L, x).name} has died, at ${P(L, x).age}, with you beside them.`,
    opts: [{ t: 'Goodbye, my love', run(L, x) { const p = P(L, x); L.s.people.splice(L.s.people.indexOf(p), 1); L.joy(-28); return 'The house is very quiet. Their coat is still on its hook.'; } }],
  },
  {
    id: 'petDies', icon: '🐾', title: 'A good friend', ok: (L) => !!L.s.pet,
    text: (L) => `${L.s.pet.name} the ${PETS[L.s.pet.kind].name} has died, old and well loved.`,
    opts: [{ t: 'Goodbye, old friend', run(L) { const n = L.s.pet.name; L.s.pet = null; L.joy(-14); return `You bury ${n} at the bottom of the garden, under the apple tree.`; } }],
  },
  {
    id: 'sportsRetire', icon: '🦵', title: 'Time, gentlemen', ok: (L) => inJob(L, 'sports'),
    text: 'The physio shakes her head. The young ones are faster every year, and your knees are not. It is time to hang up your boots.',
    opts: [{ t: 'One last lap of honour', run(L) { const n = pay(L) * 6; L.cash(n); L.fame(4); L.joy(4); const t = L.jobTitle(); L.s.job = null; L.note(`Retired from sport as ${t}.`, 'big'); return `A testimonial match, a standing ovation, and ${money(n)}. Now: what next?`; } }],
  },
  {
    id: 'birthday30', icon: '🎈', title: 'Thirty',
    text: 'The big three-oh. Where did the twenties go? What do you want from the next ten years?',
    opts: [
      { t: 'To be better at what I am worst at', run(L) { const k = lowest(L); L.gain(k, 5); return `You make a resolution about your ${STAT_NAME[k]}, and for once you keep it.`; } },
      { t: 'To look after myself', run(L) { L.hp(10); return 'You eat a salad. On purpose.'; } },
      { t: 'A really good party', run(L) { L.joy(12); for (const p of L.friends()) L.bond(p, 4); return 'It is a really good party.'; } },
    ],
  },
  {
    id: 'birthday50', icon: '🏍️', title: 'Fifty',
    text: 'Half a century. You catch sight of yourself in a shop window and wonder who that is.',
    opts: [
      { t: 'Buy a motorbike', cost: 9000, run(L) { L.joy(14); L.gain('charm', 1); return 'It is red and ridiculous and you adore it.'; } },
      { t: 'Learn something completely new', run(L) { const k = lowest(L); L.gain(k, 6); L.joy(5); return `It is never too late. Your ${STAT_NAME[k]} surprises everybody, you most of all.`; } },
      { t: 'Count your blessings', run(L) { L.joy(8); L.karma(2); return 'There are more of them than you thought.'; } },
    ],
  },
  {
    id: 'birthday100', icon: '💯', title: 'One hundred',
    text: 'A card from the palace, a cake with too many candles to light safely, and the town band on the lawn.',
    opts: [{ t: 'Make a speech', run(L) { L.joy(15); L.fame(5); return '"The secret," you tell them, "is to be new in town, and stay."'; } }],
  },
  {
    id: 'bailiffs', icon: '📉', title: 'The bank calls in its loan', log: false,
    text: (L, x) => `You owed more than the bank would stand. It has sold ${x} to bring the debt down.`,
    opts: [{ t: 'Tighten your belt', run() { return ''; } }],
  },
  {
    id: 'bust', icon: '🕳️', title: 'Bankrupt', log: false,
    text: (L, x) => `There was nothing left to pay with${x ? `, even after selling ${x}` : ''}. The court wipes out your debts, and nearly everything else with them.`,
    opts: [{ t: 'Start again', run() { return ''; } }],
  },
];

function wed(L, id, bond, joy, text) {
  const p = P(L, id);
  p.kind = 'spouse'; p.eng = false; p.live = L.s.home !== 'hostel';
  L.bond(p, bond); L.joy(joy);
  L.s.f.wed = 1;
  L.note(`Married ${p.name}.`, 'love');
  return text;
}

function born(L, x, i) {
  const s = L.s, name = x.names[i];
  s.people.push({ id: s.pid++, name, kind: 'child', bond: 60, age: x.age || 0, trait: L.pick(['bookish', 'sporty', 'witty', 'arty', 'kind']), look: { skin: s.look.skin, hair: L.chance(0.5) ? s.look.hair : L.int(0, 5), top: L.int(0, 7), style: L.int(0, 5) } });
  L.joy(15);
  L.note(x.adopt ? `Adopted ${name}.` : `${name} was born.`, 'love');
  return x.adopt ? `${name} walks in holding a carrier bag of everything they own, and looks at their new room for a long time.` : `${name}. It suits them. Nobody in your house will sleep for a year.`;
}
