// New in Town: the things that happen to you. Each event is a card with a
// few choices. Some turn up at random as the seasons go by (w: how often;
// when: who they can happen to); others are sent for by the rules in
// engine.js (w: 0): a wedding, a new baby, old Marlow on the pier.
//
// A choice may have a cost, or be a gamble: check: [skill, how hard] rolls
// against one of your skills, odds: gives the chance outright. run does the
// choice and returns what to say (win: whether the gamble came off).
// L is the Life; x is whatever the event is about (often a person's id).

import { money, CAREERS, NAMES, PETS, STATS, STAT_NAME, BUSINESSES, CURIOS, aCurio } from './data.js';

const P = (L, id) => L.person(id) || { name: 'Someone', sex: 'm', bond: 0, age: 30 };
// He or she, him or her, his or her: for whoever a card is about.
const he = (p) => (p.sex === 'm' ? 'he' : 'she');
const He = (p) => (p.sex === 'm' ? 'He' : 'She');
const him = (p) => (p.sex === 'm' ? 'him' : 'her');
const his = (p) => (p.sex === 'm' ? 'his' : 'her');
// Someone you could fall for.
const catchEye = (L, o) => L.meet({ sex: L.s.into === 'b' ? (L.chance(0.5) ? 'm' : 'f') : L.s.into, single: true, ...o });
// Home insurance pays for most of a mishap.
const covered = (L) => !!L.s.ins.home;
const has = (L, id) => !!L.person(id);
// Still your sweetheart (not an ex by now).
const mine = (L, id) => has(L, id) && ['partner', 'spouse'].includes(L.person(id).kind);
// Someone who might take you aside: a friend, a sweetheart, family.
const close = (p) => ['friend', 'partner', 'spouse', 'parent'].includes(p.kind) || (p.kind === 'child' && p.age >= 18);
const aFriend = (L) => { const f = L.friends(); return f.length ? L.pick(f).id : null; };
const aKid = (lo, hi) => (L) => { const k = L.kids().filter((c) => c.age >= lo && c.age <= hi); return k.length ? L.pick(k).id : null; };
const aParent = (L) => { const k = L.s.people.filter((p) => p.kind === 'parent'); return k.length ? L.pick(k).id : null; };
const inJob = (L, ...ids) => !!L.s.job && (!ids.length || ids.includes(L.s.job.c));
const pay = (L) => (L.s.job ? CAREERS[L.s.job.c].rungs[L.s.job.r].pay : 0);
const busy = (L, n) => { L.s.time = Math.max(0, L.s.time - n); };
const credit = (L, n) => { if (L.s.job) L.s.job.n += n; };
const fire = (L) => { if (L.s.job) { L.note(`Sacked as ${L.jobTitle()}.`, 'big'); L.s.job = null; } };
// How serious an offence is: 1 petty, 4 the bank.
const sev = (x) => (x && x.sev) || 2;
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
      { t: 'Walk them where they are going', run(L) { L.karma(1); const p = L.meet({ bond: 25 }); return `It turns out ${p.name} is moving here. You are the first person ${he(p)} knows in town.`; } },
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
      { t: 'Claim on the insurance', show: covered, run() { return 'A man in a van, a new boiler, and nothing to pay. For once the small print was on your side.'; } },
      { t: 'Call the plumber', cost: 2500, show: (L) => !covered(L), run() { return 'He sucks his teeth for an hour and charges you $2,500.'; } },
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
      { t: 'Call the police', odds: () => 0.35, run(L, x, win) { const n = Math.min(20000, Math.round(L.s.cash * 0.3)); if (win) return 'They catch him on the station platform with your money still in his sock.'; if (covered(L)) { L.cash(-200); return 'They take a statement. The insurance pays out, all but the first $200.'; } L.cash(-n); L.joy(-4); return 'They take a statement. That is all they take. (Money in the bank cannot be burgled, and insurance would have covered it.)'; } },
      { t: 'Go after him yourself', check: ['fitness', 55], run(L, x, win) { const n = Math.min(20000, Math.round(L.s.cash * 0.3)); if (win) { L.fame(1); L.joy(4); return 'You run him down on the beach and sit on him until the constable arrives.'; } L.cash(covered(L) ? -200 : -n); L.hp(-8, 'a burglar'); return covered(L) ? 'He is faster than he looks, and he bites. At least the insurance pays out, all but the first $200.' : 'He is faster than he looks, and he bites. (Money in the bank cannot be burgled.)'; } },
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
      { t: 'Ask for a dance', check: ['charm', 40], run(L, x, win) { if (win) { const p = catchEye(L, { bond: 32 }); L.joy(5); return `Three dances later you know that ${p.name} hates olives, loves the sea, and is not seeing anyone.`; } L.joy(-1); return 'You tread on a foot, twice. It is taken very nicely.'; } },
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
      { t: 'See the dentist', cost: (L) => L.medCost(300), run() { return 'Twenty unpleasant minutes and it is over.'; } },
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
      { t: 'See a physio', cost: (L) => L.medCost(400), run(L) { L.hp(2); return 'She does something terrible to your spine and you can stand again.'; } },
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
      { t: 'Go straight to St Wren’s', cost: (L) => L.medCost(1200), run(L) { L.hp(5); return 'Tests, tablets, and a talking-to. Caught early.'; } },
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
      { t: 'Say you cannot', run(L, x) { const p = P(L, x); L.bond(p, -8); return `${He(p)} says ${he(p)} understands.`; } },
    ],
  },
  {
    id: 'pals', icon: '💒', title: 'Save the date', w: 2, ctx: aFriend, ok: has,
    text: (L, x) => `${P(L, x).name} is getting married, and you are invited.`,
    opts: [
      { t: 'Go, with a good present', cost: 200, run(L, x) { P(L, x).single = false; L.bond(P(L, x), 10); L.joy(5); const p = L.maybeMeet(0.35); return p ? `You are put on the odd-ones-out table, which is how you meet ${p.name}.` : 'You cry at the vows and dance to everything.'; } },
      { t: 'Send your regrets', run(L, x) { P(L, x).single = false; L.bond(P(L, x), -6); return 'You see the photographs afterwards.'; } },
    ],
  },
  {
    id: 'trip', icon: '🚙', title: 'Get in, we are going', w: 2, ctx: aFriend, ok: has,
    text: (L, x) => `${P(L, x).name} is outside in a borrowed car, engine running. "Road trip. No, I will not tell you where."`,
    opts: [
      { t: 'Get in', run(L, x) { busy(L, 2); L.bond(P(L, x), 10); L.joy(10); if (L.chance(0.2)) { L.gain('charm', 1); return 'You come home three days later with a tattoo of an anchor and no memory of choosing it.'; } return 'Three days, four hundred miles, one flat tyre. The best.'; } },
      { t: 'Be sensible', run(L, x) { L.bond(P(L, x), -3); return `${He(P(L, x))} goes without you and sends pictures.`; } },
    ],
  },
  {
    id: 'crisis', icon: '📱', title: '3 a.m.', w: 2, ctx: aFriend, ok: has,
    text: (L, x) => `Your phone lights up. ${P(L, x).name}: "Are you awake? I am having a really bad night."`,
    opts: [
      { t: 'Go round', run(L, x) { L.bond(P(L, x), 12); L.karma(3); L.hp(-1); return 'Tea, toast, and talking until it gets light.'; } },
      { t: 'Reply in the morning', run(L, x) { L.bond(P(L, x), -5); return `By morning ${he(P(L, x))} says it is all fine. It does not sound fine.`; } },
    ],
  },
  {
    id: 'away', icon: '🚆', title: 'Moving on', w: 1, ctx: (L) => { const f = L.friends().filter((p) => p.bond < 45); return f.length ? L.pick(f).id : null; }, ok: has,
    text: (L, x) => `${P(L, x).name} has been offered a job in the city, and is taking it.`,
    opts: [
      { t: 'Throw a send-off', cost: 150, run(L, x) { const p = P(L, x); L.s.people.splice(L.s.people.indexOf(p), 1); L.joy(3); L.karma(1); return `Half the pub turns out. ${p.name} promises to write, and for a while, does.`; } },
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
      { t: 'Send flowers', cost: 60, run(L, x) { L.bond(P(L, x), 3); return `A nice thought, ${he(P(L, x))} says.`; } },
      { t: 'Too busy just now', run(L, x) { L.bond(P(L, x), -6); return '"Of course, love. Another time."'; } },
    ],
  },
  {
    id: 'play', icon: '🎭', title: 'The school play', w: 3, ctx: aKid(5, 11), ok: has,
    text: (L, x) => `${P(L, x).name} is in the school play. The part is Second Tree. They have been practising standing still for weeks.`,
    opts: [
      { t: 'Front row', run(L, x) { busy(L, 1); L.bond(P(L, x), 8); L.joy(5); return 'The best tree you have ever seen. You tell everyone near you whose tree that is.'; } },
      { t: 'Work comes first', run(L, x) { L.bond(P(L, x), -7); return `${He(P(L, x))} says it does not matter. ${He(P(L, x))} looked for you from the stage.`; } },
    ],
  },
  {
    id: 'teen', icon: '🚪', title: 'A letter from school', w: 3, ctx: aKid(12, 17), ok: has,
    text: (L, x) => `${P(L, x).name} has been skipping lessons to sit on the harbour wall with friends.`,
    opts: [
      { t: 'A long talk', check: ['charm', 45], run(L, x, win) { const p = P(L, x); if (win) { L.bond(p, 8); return 'It takes an hour to get past the shrugging. Then it all comes out, and you sort it together.'; } L.bond(p, -3); return 'A door slams. Music comes on, loud.'; } },
      { t: 'Grounded', run(L, x) { L.bond(P(L, x), -5); return `${He(P(L, x))} does go to school. ${He(P(L, x))} does not speak to you.`; } },
      { t: 'You did the same at that age', run(L, x) { const p = P(L, x); L.bond(p, 3); L.karma(-1); return `You say nothing. ${He(p)} looks at you with new interest.`; } },
    ],
  },
  {
    id: 'gift', icon: '🎻', title: 'A knack for it', w: 2, ctx: aKid(6, 15), ok: has,
    text: (L, x) => `${P(L, x).name}'s teacher takes you aside. Your child has a real gift, and it ought to be encouraged.`,
    opts: [
      { t: 'Pay for lessons', cost: 800, run(L, x) { const p = P(L, x); L.bond(p, 6); L.joy(3); if (p.st) p.st.craft = Math.min(100, p.st.craft + 6); return 'The house fills up with scales, played badly, then less badly.'; } },
      { t: (L, x) => `Teach ${him(P(L, x))} yourself`, run(L, x) { const p = P(L, x); busy(L, 1); L.bond(p, 10); L.joy(4); if (p.st) p.st.craft = Math.min(100, p.st.craft + 4); return 'Saturday mornings, just the two of you.'; } },
    ],
  },
  {
    id: 'deposit', icon: '🏦', title: 'Mum? Dad?', w: 2, ctx: aKid(22, 45), ok: has, when: (L) => L.s.cash + L.s.bank >= 5000,
    text: (L, x) => `${P(L, x).name} has found a little flat, and is $5,000 short of the deposit.`,
    opts: [
      { t: (L, x) => `Give ${him(P(L, x))} the $5,000`, cost: 5000, run(L, x) { const p = P(L, x); L.bond(p, 12); L.joy(4); return `${He(p)} hugs you so hard your glasses come off.`; } },
      { t: 'Lend half', cost: 2500, run(L, x) { L.bond(P(L, x), 4); return `It helps. ${He(P(L, x))} will pay you back, ${he(P(L, x))} says, and sort of does.`; } },
      { t: (L, x) => `${He(P(L, x))} must stand on ${his(P(L, x))} own feet`, run(L, x) { const p = P(L, x); L.bond(p, -8); return `${He(p)} says ${he(p)} understands. The flat goes to someone else.`; } },
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
      { t: 'Join', run(L) { L.gain('fitness', 1.5); L.joy(5); const p = L.maybeMeet(0.9); return p ? `It is ferocious. Your doubles partner, ${p.name}, has not lost since the seventies.` : 'It is ferocious. You love it.'; } },
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

  // ---- property, business and love: the newer cards ----
  {
    id: 'tenantFix', icon: '🚿', title: 'A call from your tenant', w: 4, cd: 10, when: (L) => L.s.estate.some((e) => e.let),
    text: 'The roof is leaking into the back bedroom, and has been since Tuesday.',
    opts: [
      { t: 'Send a roofer round today', cost: 1800, run(L) { L.karma(2); return 'Fixed by teatime. A good landlord is rarer than a good tenant.'; } },
      { t: 'Go up the ladder yourself', check: ['craft', 45], run(L, x, win) { if (win) { L.cash(-200); L.gain('craft', 1.5); return 'A tube of sealant, six slates, and a very fine view of the bay.'; } L.cash(-2600); L.hp(-4, 'a fall'); return 'You put your foot through the ceiling. The roofer charges extra for laughing.'; } },
      { t: 'It can wait', run(L) { L.karma(-3); L.cash(-900); return 'It cannot. The tenant withholds a month’s rent, which is fair.'; } },
    ],
  },
  {
    id: 'tenantRent', icon: '📭', title: 'The rent is late', w: 3, cd: 12, when: (L) => L.s.estate.some((e) => e.let),
    text: 'Your tenant has lost a job, and is two months behind. There is a child’s bicycle in the hall.',
    opts: [
      { t: 'Give them time', run(L) { L.karma(5); L.cash(-1200); return 'They catch up by Christmas, mostly, and send you a cake.'; } },
      { t: 'Work something out', check: ['charm', 45], run(L, x, win) { if (win) { L.karma(2); return 'Half now, the rest in the spring. Everybody keeps their dignity.'; } L.cash(-1200); return 'A long, awkward talk, and no money at the end of it.'; } },
      { t: 'Out by Friday', run(L) { L.karma(-6); return 'You have new tenants within the week. People in the Gull & Anchor have heard about it.'; } },
    ],
  },
  {
    id: 'bizReview', icon: '📰', title: 'A stinker in the Gazette', w: 4, cd: 10, when: (L) => !!L.s.biz,
    text: (L) => `"Disappointing," says the Starling Bay Gazette of your ${L.bizName().toLowerCase()}, and then says a good deal more.`,
    opts: [
      { t: 'Invite the writer back', check: ['charm', 50], run(L, x, win) { const b = L.s.biz; if (win) { b.rep = Math.min(100, b.rep + 10); return 'A second visit, a second review: "I was wrong." Framed, by the till.'; } b.rep = Math.max(0, b.rep - 6); return 'The second review is shorter and worse.'; } },
      { t: 'Fix what was wrong', run(L) { const b = L.s.biz; busy(L, 1); b.rep = Math.min(100, b.rep + 4); return 'It stung because some of it was true. You put it right.'; } },
      { t: 'Ignore it', run(L) { L.s.biz.rep = Math.max(0, L.s.biz.rep - 8); return 'Trade is thin for a while.'; } },
    ],
  },
  {
    id: 'bizOrder', icon: '📦', title: 'The big order', w: 4, cd: 10, when: (L) => !!L.s.biz,
    text: 'The Regatta committee wants you to supply the whole weekend. It is three times what you can comfortably do.',
    opts: [
      { t: 'Take it, and work all hours', run(L) { const b = L.s.biz, n = Math.round(L.bizTake() * 2.2 / 10) * 10; busy(L, 2); L.cash(n); L.hp(-3, 'overwork'); b.rep = Math.min(100, b.rep + 6); return `You do not sleep for four days. It goes off without a hitch: ${money(n)}, and the whole town saw.`; } },
      { t: 'Take half of it', run(L) { const n = Math.round(L.bizTake() / 10) * 10; L.cash(n); return `Sensible. ${money(n)}, and a rival does the rest.`; } },
      { t: 'Say no', run() { return 'You watch the weekend from behind your own counter.'; } },
    ],
  },
  {
    id: 'bizRival', icon: '🏴', title: 'Competition', w: 3, cd: 14, when: (L) => !!L.s.biz && L.s.biz.lvl >= 1,
    text: (L) => `A shiny new rival has opened across the way from your ${L.bizName().toLowerCase()}, with balloons.`,
    opts: [
      { t: 'Cut your prices', run(L) { L.cash(-Math.round(L.bizTake() / 2)); L.s.biz.rep = Math.min(100, L.s.biz.rep + 3); return 'It costs you, but your regulars stay your regulars.'; } },
      { t: 'Be better, not cheaper', odds: (L) => 0.5 + (L.s.st[BUSINESSES[L.s.biz.type].stats[0]] - 55) / 60, run(L, x, win) { const b = L.s.biz; if (win) { b.rep = Math.min(100, b.rep + 8); return 'By the summer the balloons have gone down, and so has the rival.'; } b.rep = Math.max(0, b.rep - 8); return 'They are good. Annoyingly good. You lose some trade.'; } },
    ],
  },
  {
    id: 'sacked', icon: '📦', title: 'A word in the office', ok: (L) => inJob(L),
    text: 'The boss does not ask you to sit down. "It is not working out," is how it begins.',
    opts: [
      { t: 'Plead for one more chance', check: ['charm', 55], run(L, x, win) { if (win) { L.s.job.perf = 35; return '"One more chance. One." You have rarely been so glad to keep something you were so careless with.'; } fire(L); L.joy(-10); return 'It was decided before you walked in. You clear your desk into a carrier bag.'; } },
      { t: 'Take it on the chin', run(L) { fire(L); L.joy(-8); return 'You shake hands, which surprises you both, and clear your desk into a carrier bag.'; } },
    ],
  },
  {
    id: 'setup', icon: '💌', title: 'You two should meet', w: 4, cd: 8, ctx: (L) => { const f = L.friends().filter((p) => p.bond >= 40); return f.length ? L.pick(f).id : null; }, ok: has, when: (L) => !L.partner() && L.s.age < 75,
    text: (L, x) => `${P(L, x).name} has that look. "I know someone. You would be perfect for each other. Say you will come to dinner."`,
    opts: [
      { t: 'Go on, then', run(L, x) { const p = catchEye(L, { bond: 28 }); L.bond(P(L, x), 3); L.joy(3); return `It is not a disaster. ${p.name}: ${he(p)} is funny, a little shy, and single. You swap numbers under the table.`; } },
      { t: 'Absolutely not', run(L, x) { return `${P(L, x).name} sighs, and says ${he(P(L, x))} will try again next year.`; } },
    ],
  },
  {
    id: 'tempted', icon: '🫣', title: 'A look across the room', w: 2, when: (L) => !!L.partner() && L.s.age < 70,
    text: (L) => `Someone at the bar has been catching your eye all evening, and now comes over. ${L.partner().name} is at home.`,
    opts: [
      { t: 'Talk about your other half, fondly', run(L) { L.bond(L.partner(), 4); L.karma(1); return 'They take the hint, and you go home feeling rather pleased with your life.'; } },
      { t: 'Flirt back', odds: () => 0.7, run(L, x, win) { const p = L.partner(); L.karma(-4); L.joy(3); if (win) return 'A drink, a laugh, nothing more. Nobody need ever know.'; L.bond(p, -30); return `Starling Bay is a small town. ${p.name} has heard by breakfast.`; } },
    ],
  },
  {
    id: 'studyGroup', icon: '📚', title: 'A study group', w: 5, cd: 8, when: (L) => !!L.s.course,
    text: 'Three people from your course are meeting in the library on Thursdays. There is a spare chair.',
    opts: [
      { t: 'Take the chair', run(L) { const k = L.s.course; k.mark += 6 * Math.max(1, k.p) / 4; L.gain('smarts', 1.5); const p = L.maybeMeet(0.6); return p ? `You learn as much from ${p.name} as from the lecturer, and ${he(p)} from you.` : 'Explaining it to the others is how you find out you understand it.'; } },
      { t: 'You work better alone', run(L) { L.gain('smarts', 0.8); return 'Just you, a desk lamp, and the sound of the sea.'; } },
    ],
  },
  {
    id: 'grant', icon: '🏦', title: 'A letter about your student loan', w: 2, once: true, when: (L) => L.s.sloan >= 5000,
    text: 'The town’s old Seafarers’ Fund helps students who stay and work in Starling Bay. You qualify.',
    opts: [{ t: 'Fill in the form', run(L) { const n = Math.min(L.s.sloan, 3000); L.s.sloan -= n; L.joy(4); return `${money(n)} comes off what you owe, with the compliments of some long-dead sea captains.`; } }],
  },

  // ---- the low road ----
  {
    id: 'hooked', icon: '🫗', title: 'A quiet word', w: 6, cd: 8, when: (L) => (L.hooked('drink') || L.hooked('dust')) && L.s.people.some(close),
    ctx: (L) => { const l = L.s.people.filter(close).sort((a, b) => b.bond - a.bond); return l.length ? l[0].id : null; }, ok: (L, x) => has(L, x) && close(P(L, x)),
    text: (L, x) => `${P(L, x).name} sits you down. "I have been watching you. It is ${L.hooked('dust') ? 'that stuff from under the pier' : 'the drink'}, and it is getting worse. Let me take you to St Wren’s."`,
    opts: [
      { t: 'Go to the clinic', cost: (L) => L.medCost(3500), run(L, x) { busy(L, 3); L.s.habit = {}; L.s.f.clean = 1; L.bond(P(L, x), 8); L.hp(6); L.note('Got clean at St Wren’s.', 'big'); return `Three hard weeks. ${P(L, x).name} is there on visiting days, every one.`; } },
      { t: 'I can stop whenever I like', run(L, x) { L.bond(P(L, x), -10); return 'You both know what that is worth.'; } },
      { t: 'Mind your own business', run(L, x) { L.bond(P(L, x), -20); L.joy(2); return `${P(L, x).name} leaves without another word.`; } },
    ],
  },
  {
    id: 'protection', icon: '🧱', title: 'Nice place you have here', w: 3, cd: 12, when: (L) => !!L.s.biz,
    text: (L) => `Two of Sal’s lads admire your ${L.bizName().toLowerCase()}. "Lot of glass. Be a shame if there was an accident. Sal can see that there is not."`,
    opts: [
      { t: 'Pay up', cost: (L) => Math.round(L.bizTake() / 100) * 100, run() { return 'An envelope changes hands. You are, apparently, now insured.'; } },
      { t: 'Show them the door', check: ['fitness', 55], run(L, x, win) { const b = L.s.biz; if (win) { b.rep = Math.min(100, b.rep + 4); L.joy(4); return 'They leave faster than they came. Word gets round, and people rather like it.'; } L.rough(12, 'Sal’s lads'); b.rep = Math.max(0, b.rep - 10); return 'They break the window, and then, for completeness, your nose.'; } },
      { t: '"I work for Sal"', show: (L) => inJob(L, 'crew'), run() { return 'A long pause. "Our mistake," says the big one, and straightens your sign on the way out.'; } },
    ],
  },
  {
    id: 'blackmail', icon: '🗳️', title: 'Through a lit window', w: 2, once: true,
    text: 'Late, behind the Town Hall, a lit window: Councillor Pemberton, alone, stuffing voting papers into his own briefcase.',
    opts: [
      { t: 'Ask him what your silence is worth', odds: () => 0.65, run(L, x, win) { L.karma(-6); if (win) { L.cash(5000); return 'It turns out to be worth $5,000, in a carrier bag, and a look you will remember.'; } L.s.n.crimes++; L.queue('busted', { what: 'a note made of letters cut out of the Gazette', sev: 2 }); return 'He has friends at the station. Demanding money with menaces, they call it.'; } },
      { t: 'Tell the Gazette', run(L) { L.karma(4); L.fame(3); return 'Front page. He resigns "to spend more time with his family", who look alarmed.'; } },
      { t: 'Walk on', run() { return 'You saw nothing. You tell yourself that for a week.'; } },
    ],
  },
  {
    id: 'crunch', icon: '🚗', title: 'A small crunch', w: 2, when: (L) => !!L.s.items.car || !!L.s.items.sportscar,
    text: 'Backing out by the chandlery there is a crunch. A parked car, its light in pieces. Nobody about.',
    opts: [
      { t: 'Leave a note with your number', cost: 400, run(L) { L.karma(3); return 'The owner rings, astonished. You pay for the light, and are bought a pint.'; } },
      { t: 'Drive off', odds: () => 0.75, run(L, x, win) { L.karma(-3); if (win) return 'Nobody saw. The gulls are not talking.'; L.cash(-1200); L.warm(8); return 'A curtain twitched. A $1,200 fine, and the whole street knows.'; } },
    ],
  },
  {
    id: 'tin', icon: '🥫', title: 'The lifeboat tin', w: 2,
    text: 'The landlord has gone down to the cellar. On the bar, at your elbow, the lifeboat collection tin. It is heavy.',
    opts: [
      { t: 'Put a note in', cost: 20, run(L) { L.karma(2); return 'It rattles gratefully.'; } },
      { t: 'Tip it into your pocket', run(L) { L.karma(-5); if (L.crime(0.1, 1, 'your pockets, jingling')) return 'The landlord comes back up for the bottle opener.'; L.cash(180); return '$180, mostly in coppers. You clank all the way home.'; } },
      { t: 'Leave it be', run() { return 'You straighten it on the bar, for some reason.'; } },
    ],
  },
  {
    id: 'snitch', icon: '🕵️', title: 'A detective buys you a tea', w: 3, once: true, when: (L) => L.s.record >= 1 && L.s.n.crimes >= 5,
    text: '"We do not want you," says the detective. "We want Sal. Tell me about the ice house, and that record of yours could get lost."',
    opts: [
      { t: 'Tell her everything', run(L) { L.s.record = 0; L.s.heat = 0; L.cash(3000); L.s.f.salOff = L.s.t + 24; L.karma(2); if (inJob(L, 'crew')) { L.s.job = null; } return 'You talk for three hours. Your record vanishes, $3,000 appears, and you would do well to stay away from the harbour for a few years.'; } },
      { t: 'You know nothing', run(L) { L.warm(6); return '"Suit yourself," she says, and leaves you with the bill.'; } },
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
      { t: 'Sit down and play', run(L) { L.s.f.dee = 1; L.gain('craft', 2.5); L.joy(5); L.meet({ name: 'Dee Calloway', sex: 'f', trait: 'arty', job: 'arts', bond: 30, single: false }); return 'An hour goes by like a minute. Her name is Dee, and she says you are not bad.'; } },
      { t: 'Shake your head', run() { return 'She shrugs and plays on.'; } },
    ],
  },
  {
    id: 'dee2', icon: '🎤', title: 'Dee has an idea', w: 6, cd: 6, when: (L) => L.s.f.dee === 1 && L.s.st.craft >= 40 && L.s.people.some((p) => p.name === 'Dee Calloway'),
    text: '"A drummer, a bass, you and me," says Dee. "I have even got the name. The Tidal Waves."',
    opts: [
      { t: 'Let us do it', run(L) { L.s.f.dee = 2; L.s.f.band = 1; L.fame(3); L.joy(8); L.note('Formed a band: The Tidal Waves.', 'big'); return 'Rehearsals in a net loft that smells of tar. You are terrible. Then, one night, you are not.'; } },
      { t: 'I am more of a solo act', run(L) { L.s.f.dee = 9; return 'Dee looks at you for a moment. "Suit yourself."'; } },
    ],
  },
  {
    id: 'dee3', icon: '🎸', title: 'The big stage', w: 6, cd: 6, when: (L) => L.s.f.dee === 2 && L.s.st.craft >= 55 && L.s.people.some((p) => p.name === 'Dee Calloway'),
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
    text: (L, x) => `A hand on your collar. "Well now," says the constable, looking at ${x && x.what ? x.what : 'what you are carrying'}. "And what have we here?"`,
    opts: [
      { t: 'Come quietly', run(L, x) { return L.sentence(sev(x)); } },
      { t: 'Run for it', check: ['fitness', 55], run(L, x, win) { if (win) { L.warm(15); return 'Over the nets, round the ice house, and away. Your heart does not slow down for an hour. They will be looking for you now.'; } L.hp(-6, 'a fall'); return `You make it thirty yards before a lobster pot brings you down. Resisting arrest, on top of the rest. ${L.sentence(sev(x) + 1)}`; } },
      { t: 'Slip the constable something', cost: (L, x) => 1500 * sev(x), odds: (L) => 0.25 + L.s.st.charm / 250 + (L.perk('police') ? 0.2 : 0), run(L, x, win) { L.karma(-2); if (win) return 'The constable looks at the notes, then at the sea, then at nothing at all. "Mind how you go."'; return `"Attempting to bribe an officer," the constable writes, slowly. ${L.sentence(sev(x) + 1)}`; } },
      { t: 'Say nothing, and send for a good lawyer', cost: (L, x) => (L.perk('law') ? 2000 : 4000) * sev(x), run(L, x) { return `She costs a fortune and earns it. ${L.sentence(sev(x) - 1)}`; } },
      { t: 'It was all Sal', check: ['charm', 60], show: (L, x) => sev(x) === 2, run(L, x, win) { L.s.f.salOff = L.s.t + 8; if (win) return 'You are so convincing that the constable gives you a lift home. Sal will not be pleased.'; return `Sal has an alibi, and three witnesses. ${L.sentence(sev(x) + 1)}`; } },
    ],
  },
  {
    id: 'inside', icon: '⛓️', title: 'Starling Gaol',
    text: (L, x) => `${x.n} season${x.n > 1 ? 's' : ''}. The gate shuts behind you, and a voice from the landing shouts something unrepeatable. You will live every one of them: there is a yard, a library, a workshop, and a great many men with time on their hands. How do you mean to start?`,
    opts: [
      { t: 'Head down, library card out', run(L, x) { L.jail(x.n); L.behave(15); return 'You say "sir" to everybody, including a plumber. The governor makes a small note against your name. The good kind.'; } },
      { t: 'Fall in with the hard cases', run(L, x) { L.jail(x.n); L.respect(20); L.s.gaol.good = Math.min(L.s.gaol.good, 35); L.karma(-3); return 'By lights out you have a nickname, a seat at the back table, and a debt of two cigarettes. It is a start.'; } },
      { t: 'Look for the way out', run(L, x) { L.jail(x.n); L.s.gaol.dig = Math.max(L.s.gaol.dig, 1); L.s.gaol.good = Math.min(L.s.gaol.good, 45); return 'You count the paces between the towers, twice, and notice a grating behind the laundry that nobody else seems to have noticed.'; } },
    ],
  },
  {
    id: 'parole', icon: '🪪', title: 'The board will see you now', ok: (L) => !!L.s.gaol,
    text: (L) => `Three people behind a long table, with your file open between them. On it: "${L.goodWord()}." ${L.s.gaol.left} season${L.s.gaol.left > 1 ? 's' : ''} left to serve.`,
    opts: [
      { t: (L) => `Tell them you are a changed ${L.s.sex === 'f' ? 'woman' : 'man'}`, odds: (L) => L.paroleOdds() - L.luck(), run(L, x, win) { if (win) { L.release(true); return '"Parole granted." You are on licence for two years: one more conviction in that time and the rest comes back, with interest.'; } L.joy(-5); return '"Not at this time." The chairman does not look up. They will see you again in a year, if you are still here.'; } },
      { t: 'Tell them what you think of them', run(L) { L.respect(12); L.behave(-12); L.joy(5); return 'It takes four minutes, and you do not repeat yourself once. Parole is refused. The landing gives you a round of applause.'; } },
    ],
  },
  {
    id: 'gateOut', icon: '🚪', title: 'The gate', log: false,
    text(L, x) {
      const pt = L.partner(), folk = L.s.people.find((p) => p.kind === 'parent' && p.bond >= 30) || L.s.people.find((p) => p.kind === 'child' && p.age >= 18 && p.bond >= 30);
      const who = pt && pt.bond >= 25 ? `${pt.name} is leaning on the bonnet of a borrowed car, trying not to cry.` : folk ? `${folk.name} is waiting across the road, with a flask and your old coat.` : L.s.n.crimes >= 10 ? 'A long black car is waiting at the kerb. The window comes down an inch. "Sal sends his regards."' : 'Nobody is waiting. The bus is in forty minutes.';
      return `They give you back your watch, your shoelaces and $46. The small door in the big gate opens. ${who}${x && x.early ? ' You are out on licence: keep your nose clean for two years.' : ''}`;
    },
    opts: [{ t: 'Breathe', run(L) { const pt = L.partner(); L.joy(pt && pt.bond >= 25 ? 14 : 8); if (pt) L.bond(pt, 6); return ''; } }],
  },
  {
    id: 'recapture', icon: '🔦', title: 'A torch in your face', ok: (L) => !!L.s.run,
    text: '"Stay where you are." Two constables, a van, and a dog that has clearly been told about you.',
    opts: [
      { t: 'Run', check: ['fitness', 60], run(L, x, win) { if (win) { L.warm(10); return 'Through a garden, over a wall, along the railway. The dog gives up at the river. You do not stop until dawn.'; } const n = L.s.run.owe + 2; L.jail(n); return `The dog is faster than you. So, it turns out, is the fat constable. Back inside: ${n} seasons.`; } },
      { t: 'Talk your way out of it', check: ['charm', 70], run(L, x, win) { if (win) { L.warm(-15); return 'You are, you explain, your own cousin, and often mistaken for yourself. They apologise for troubling you.'; } const n = L.s.run.owe + 1; L.jail(n); return `"Nice try," says the constable, almost fondly. Back inside: ${n} seasons.`; } },
      { t: 'Hold out your wrists', run(L) { const n = L.s.run.owe; L.jail(n); return `You are tired of looking over your shoulder. Back inside: ${n} seasons, and no more for coming quietly.`; } },
    ],
  },
  // ---- prison ----
  {
    id: 'gCellmate', icon: '🛏️', title: 'A new cellmate', gaol: true, w: 4, cd: 6,
    text: '"Books" Bernard: sixty, mild, in for something involving a pension fund. He takes the bottom bunk without asking and lays out a travelling chess set.',
    opts: [
      { t: 'Let him teach you chess', run(L) { L.gain('smarts', 2.5); L.joy(2); return 'You lose forty games running. The forty-first is a draw, and you think about it for a week.'; } },
      { t: 'Let him teach you bookkeeping', run(L) { L.gain('smarts', 1.5); L.gain('charm', 1); return '"There are two columns," he says, "and the art is in the second one."'; } },
      { t: 'Tell him which bunk is whose', run(L) { L.respect(4); return 'He moves without a word. You feel about two inches tall, which in here passes for respect.'; } },
    ],
  },
  {
    id: 'gPudding', icon: '🍮', title: 'Treacle sponge', gaol: true, w: 4, cd: 5,
    text: 'A man the size of a wardrobe sits down opposite and puts his spoon in your pudding. The whole table has stopped eating.',
    opts: [
      { t: 'Tell him where to put the spoon', check: ['fitness', 48], run(L, x, win) { L.behave(-6); if (win) { L.respect(12); return 'It is brief. He eats his own pudding from now on, and nobody else’s spoon comes near yours.'; } L.rough(10, 'a beating in Starling Gaol'); L.respect(3); return 'You wake up in the infirmary. Still: you said it, and that was noticed.'; } },
      { t: 'Eat it very fast, looking him in the eye', odds: () => 0.5, run(L, x, win) { if (win) { L.respect(6); L.joy(3); return 'He starts to laugh. Then the table laughs. You have, apparently, got some neck.'; } L.respect(-3); return 'He takes tomorrow’s as well, in advance.'; } },
      { t: 'Push the bowl across', run(L) { L.respect(-7); return 'He takes it. Tomorrow someone else will take your bread.'; } },
    ],
  },
  {
    id: 'gRiot', icon: '🔥', title: 'B wing goes up', gaol: true, w: 2, cd: 12,
    text: 'It starts over the hot water and by noon there are mattresses burning on the landing and a guard locked in the tea room.',
    opts: [
      { t: 'Join in', run(L) { L.respect(15); L.behave(-30); L.joy(4); if (L.chance(0.4)) { L.extra(2); return 'You are on the roof by teatime, and in the Gazette by morning, waving a table leg. Two seasons are added to your sentence.'; } return 'You throw a great many things off a great height, and nobody can say afterwards who threw what.'; } },
      { t: 'Stay in your cell with the door shut', run(L) { L.behave(3); return 'You read the same page of a western for six hours.'; } },
      { t: 'Get the guard out of the tea room', run(L) { L.behave(25); L.respect(-15); L.karma(4); const q = L.s.gaol; if (q.left > 1 && L.chance(0.5)) { L.extra(-1); return 'You walk Mr Hobbs out through the kitchens with a tea towel over his head. The governor takes a season off your sentence. The landing takes note too.'; } return 'You walk Mr Hobbs out through the kitchens with a tea towel over his head. He never mentions it again, but your tea is always hot.'; } },
    ],
  },
  {
    id: 'gVisit', icon: '🪟', title: 'Visiting day', gaol: true, w: 4, cd: 3,
    ctx: (L) => { const l = L.s.people.filter((p) => ['partner', 'spouse', 'parent', 'friend'].includes(p.kind) || (p.kind === 'child' && p.age >= 16)).filter((p) => p.bond >= 25); return { p: l.length ? L.pick(l).id : 0 }; },
    text: (L, x) => (has(L, x.p) ? `${P(L, x.p).name} is on the other side of the glass, in ${his(P(L, x.p))} good coat, holding the telephone as if it might bite.` : 'Nobody has put in to see you. The chaplain, who has noticed, sits down instead and asks how you are keeping.'),
    opts: [
      { t: 'Put a brave face on it', run(L, x) { L.joy(4); if (has(L, x.p)) { L.bond(P(L, x.p), 8); return 'You talk about the weather, the neighbours, the dog. Twenty minutes. It is the best twenty minutes of the season.'; } return 'He talks about cricket. It is oddly restful.'; } },
      { t: 'Tell the truth about this place', run(L, x) { L.joy(-1); if (has(L, x.p)) { L.bond(P(L, x.p), 13); return `${P(L, x.p).name} puts ${his(P(L, x.p))} hand flat on the glass. Neither of you says anything for a while.`; } L.karma(1); L.joy(4); return 'He listens. Nobody has, for a while. You feel lighter going back up the stairs.'; } },
    ],
  },
  {
    id: 'gSearch', icon: '🔦', title: 'Spin', gaol: true, w: 3, cd: 6, when: (L) => L.s.gaol.dig > 0 || L.s.gaol.rep >= 25,
    text: 'Six in the morning: boots on the landing, every door open, every mattress on the floor. They are turning the whole wing over.',
    opts: [
      { t: 'Stand by your door and look bored', check: ['charm', 45], run(L, x, win) { if (win) return 'Mr Hobbs taps the wall an inch from the loose brick, looks at you, and moves on.'; const q = L.s.gaol; L.behave(-12); if (q.dig > 0) { q.dig = 0; L.extra(1); return 'They find it: the spoon, the mortar, the lot. One more season, and you start again from nothing.'; } return 'They find three ounces of tobacco that you honestly had forgotten about.'; } },
      { t: 'Start an argument two cells down', check: ['smarts', 50], run(L, x, win) { if (win) { L.respect(3); return 'By the time it is sorted out the search party is behind schedule and skips the end of the row. Your end.'; } L.behave(-8); return 'They search yours first after that. Thoroughly.'; } },
    ],
  },
  {
    id: 'gGarden', icon: '🌹', title: 'The governor’s roses', gaol: true, w: 3, cd: 10, when: (L) => L.s.gaol.good >= 60,
    text: 'The governor wants somebody trustworthy for the garden: fresh air, no supervision to speak of, and tea with the cook.',
    opts: [
      { t: 'Take it', run(L) { L.gain('craft', 3); L.joy(7); L.hp(3); L.behave(5); L.respect(-4); return 'You prune, you mulch, you sit on an upturned bucket in the sun. The roses take second prize at the county show and nobody mentions who grew them.'; } },
      { t: 'Not for you', run(L) { L.respect(5); return '"Suit yourself." The landing approves. The roses get greenfly.'; } },
    ],
  },
  {
    id: 'gPoem', icon: '🖋️', title: 'The Hartley prize', gaol: true, w: 3, cd: 10,
    text: 'A notice by the library trolley: a national prize for writing from prisons. Poems, stories, anything. Closing date Friday.',
    opts: [
      { t: 'Write something true', check: ['craft', 50], run(L, x, win) { L.gain('craft', 1.5); if (win) { L.cash(250); L.fame(2); L.joy(7); L.behave(4); L.note('Won a prize for writing in prison.', 'big'); return 'Fourteen lines about the sound of the gate. It wins. $250, and a letter from a lady novelist, which you keep.'; } L.joy(1); return 'Highly commended, along with four hundred others. You keep the pencil.'; } },
      { t: 'Write a limerick about the governor', run(L) { L.respect(8); L.behave(-6); L.joy(4); return 'It does not win the prize. It is, however, on every wall of the wing by Thursday, and the governor’s name does rhyme with it rather well.'; } },
    ],
  },
  {
    id: 'gParcel', icon: '🎂', title: 'A cake from outside', gaol: true, w: 3, cd: 10, when: (L) => L.s.n.crimes >= 5,
    text: 'A fruit cake, already cut open by the gate staff and put back together. They missed the bottom. Under the marzipan: $500 and a note. "Keep your mouth shut. S."',
    opts: [
      { t: 'Keep it', run(L) { L.cash(500); return 'You eat the cake, too. It is not a good cake.'; } },
      { t: 'Share it along the landing', run(L) { L.respect(14); L.joy(3); return 'Tobacco for everybody, and a slice each. For one evening the wing is nearly cheerful.'; } },
      { t: 'Hand it in', run(L) { L.behave(15); L.respect(-10); L.s.f.salOff = L.s.t + 12; return 'The governor is very interested in the handwriting. Sal will hear about that.'; } },
    ],
  },
  {
    id: 'gWilf', icon: '✉️', title: 'Old Wilf', gaol: true, w: 3, once: true,
    text: 'Wilf is eighty-one and has been in since before decimal coinage. He will not be going out. He holds out an envelope, sealed, with an address on the cliff road. "When you are out. By hand, mind."',
    opts: [
      { t: 'Give him your word', run(L) { L.s.f.wilf = 1; L.karma(1); return 'He nods, once, and goes back to his jigsaw.'; } },
      { t: 'Tell him to use the post like everybody else', run(L) { L.respect(1); return '"The post," says Wilf, "is read." He gives it to somebody else.'; } },
    ],
  },
  {
    id: 'wilfLetter', icon: '✉️', title: 'Wilf’s letter', w: 8, once: true, when: (L) => L.s.f.wilf === 1,
    text: 'It is still in the lining of your coat. The address is a cottage at the top of the cliff road, with a blue door.',
    opts: [
      { t: 'Take it there, as you promised', run(L) { L.karma(6); L.joy(5); L.s.f.wilf = 2; const p = L.friends().length < 20 ? L.meet({ sex: 'f', age: 50, trait: 'kind', bond: 32, single: false }) : null; const c = L.gotCurio('bottle'); return `His daughter reads it standing in the doorway, twice. Then she makes tea, and gives you ${c.a} from the mantelpiece. "He made it in there. He would want you to have it."${p ? ` Her name is ${p.name}.` : ''}`; } },
      { t: 'Put a stamp on it', run(L) { L.karma(2); L.s.f.wilf = 2; return 'Into the box outside the station. Near enough.'; } },
      { t: 'Steam it open', run(L) { L.karma(-6); L.cash(4000); L.s.f.wilf = 2; return 'One line of writing, and a left-luggage ticket for the station. In the locker: $4,000 in notes they stopped printing twenty years ago. The bank changes them without a word.'; } },
    ],
  },
  // ---- Mrs Pargeter ----
  {
    id: 'parg1', icon: '👒', title: 'Mrs Pargeter', w: 6, once: true, when: (L) => !!L.s.plot && L.s.plot.beds.some(Boolean),
    text: 'A shadow falls across your beans. Mrs Pargeter of plot 9, six times champion of the Harvest Show, is looking at your allotment the way a heron looks at a pond.',
    opts: [
      { t: 'Ask her advice', check: ['charm', 40], run(L, x, win) { L.s.f.parg = 1; if (win) { for (const b of L.s.plot.beds) if (b) b.care += 2; L.gain('craft', 2); return 'She tells you three things about watering, two about slugs and one about the onion man. Your beds are better for it by the weekend.'; } return 'She says "Hm," twice, and moves on. It is, you are told later, more than most people get.'; } },
      { t: 'Ask her if she has lost something', run(L) { L.s.f.parg = -1; L.joy(3); return 'Nobody has spoken to Mrs Pargeter like that since 1974. The onion man shakes your hand behind the water butt.'; } },
    ],
  },
  {
    id: 'parg2', icon: '🥀', title: 'The greenhouse', w: 6, once: true, when: (L) => L.s.f.parg === 1 && !!L.s.plot,
    text: 'Somebody’s dog has been through plot 9 in the night. Mrs Pargeter is standing in what was her greenhouse, with a seed tray in each hand, not saying anything.',
    opts: [
      { t: 'Roll up your sleeves', run(L) { busy(L, 2); L.karma(4); L.gain('craft', 1.5); L.s.f.parg = 2; return 'It takes two days: glass, canes, forty pots. She makes tea in a flask and does not say thank you. She does save you the last biscuit.'; } },
      { t: 'Leave her to it', run(L) { L.karma(-1); L.s.f.parg = 0; return 'You find something to do at the far end of your own plot.'; } },
      { t: 'Pocket a few of her seeds while she is not looking', run(L) { L.karma(-5); L.s.f.seed = 1; L.s.f.parg = 0; if (L.enemies().length < 3 && L.chance(0.35)) { const p = L.foe({ name: 'Edna Pargeter', sex: 'f', age: 71, grudge: 80, hard: 20 }); return `Forty years of saved seed, in your jacket pocket. And ${p.name} turns round at exactly the wrong moment.`; } return 'Forty years of saved seed, in your jacket pocket. Your marrows will be the better for it. You, less so.'; } },
    ],
  },
  {
    id: 'parg3', icon: '🫙', title: 'An old tobacco tin', w: 6, once: true, when: (L) => L.s.f.parg === 2 && !!L.s.plot && L.s.t - L.s.plot.since >= 8,
    text: 'Mrs Pargeter is giving up plot 9. Her knees, she says, as if they had let her down personally. She holds out an old tobacco tin with a rubber band round it. "Forty years of saved seed. Do not waste it."',
    opts: [
      { t: 'Take it, and promise', run(L) { L.s.f.seed = 1; L.s.f.parg = 3; L.joy(6); const p = L.friends().length < 20 ? L.meet({ name: 'Edna Pargeter', sex: 'f', age: 78, trait: 'kind', bond: 45, single: false, job: 'teaching' }) : null; L.note('Mrs Pargeter gave you her seed tin.', 'big'); return `Your marrows will never be the same again.${p ? ' Nor, it turns out, will your Sundays: she expects a visit, and a report.' : ''}`; } },
    ],
  },
  {
    id: 'headhunt', icon: '🤝', title: 'A word in your ear', w: 4, cd: 16, when: (L) => L.s.eco >= 1 && inJob(L) && !CAREERS[L.s.job.c].shady && L.s.job.perf >= 50,
    text: 'Business is booming and good people are hard to find. An outfit up the coast has been asking about you, and has written a number on a napkin.',
    opts: [
      { t: 'Show the napkin to your boss', check: ['charm', 50], run(L, x, win) { const j = L.s.job; if (win) { j.raise = Math.min(0.4, (j.raise || 0) + 0.08); return `Your boss goes pale, then generous. ${money(L.shiftPay())} a shift from now on.`; } j.perf = Math.max(0, j.perf - 10); return '"If you want to go, go," says your boss. You do not, as it happens. It is a long week.'; } },
      { t: 'Do a few weekends for them on the quiet', run(L) { const n = pay(L) * 3; L.cash(n); busy(L, 2); L.joy(-2); return `Moonlighting is exhausting, and it pays ${money(n)}.`; } },
      { t: 'You are happy where you are', run(L) { L.s.job.perf = Math.min(100, L.s.job.perf + 6); L.joy(2); return 'You say so, out loud, at work. People look at you oddly, but the boss hears of it.'; } },
    ],
  },
  // ---- bad blood ----
  {
    id: 'spite', icon: '😠', title: 'Bad blood', ok: (L, x) => has(L, x.p) && P(L, x.p).kind === 'enemy',
    text: (L, x) => `${P(L, x.p).name} ${x.what}`,
    opts: [
      { t: 'Rise above it', run(L, x) { const p = P(L, x.p); L.karma(1); p.grudge = Math.max(1, p.grudge - 6); return 'You say nothing, and go on saying it. It is harder than it sounds.'; } },
      { t: 'Get your own back', run(L, x) { const p = P(L, x.p); L.joy(4); L.karma(-1); p.grudge = Math.min(100, p.grudge + 10); return L.rattle(p) ? `Prawns, sewn into ${his(p)} curtain hems. ${L.seeOff(p)}` : `Prawns, sewn into ${his(p)} curtain hems. It will be weeks before ${he(p)} finds them.`; } },
      { t: 'Go to the constable', check: ['charm', 50], run(L, x, win) { const p = P(L, x.p); if (win) { p.grudge = Math.min(100, p.grudge + 4); return L.rattle(p) ? `The constable has a long word with ${him(p)}. ${L.seeOff(p)}` : `The constable has a long word with ${him(p)}, and writes it all down.`; } return '"A civil matter," says the constable, who is eating a sandwich.'; } },
    ],
  },
  {
    id: 'rivalWork', icon: '🗂️', title: 'Credit where it is due', w: 3, cd: 20, when: (L) => inJob(L) && !CAREERS[L.s.job.c].shady && L.enemies().length < 3,
    text: 'Your idea, your late nights, your name nowhere on it. A colleague is standing in front of the boss, taking a bow.',
    opts: [
      { t: 'Say so, in front of everyone', check: ['charm', 50], run(L, x, win) { const p = L.foe({ job: L.s.job.c, grudge: 50 }); if (win) { L.s.job.perf = Math.min(100, L.s.job.perf + 12); return `The boss looks from one of you to the other and works it out. ${p.name} will not forget this.`; } L.s.job.perf = Math.max(0, L.s.job.perf - 6); return `It comes out shrill. ${p.name} looks hurt, and very pleased.`; } },
      { t: 'Let it go', run(L) { L.joy(-3); return 'You tell yourself the work speaks for itself. It does not, as a rule.'; } },
      { t: 'Take the credit for something of theirs', run(L) { const p = L.foe({ job: L.s.job.c, grudge: 60 }); L.karma(-3); L.s.job.perf = Math.min(100, L.s.job.perf + 8); return `Two can play. ${p.name} finds out on Friday.`; } },
    ],
  },
  {
    id: 'chipQueue', icon: '🍟', title: 'The queue at Harry’s', w: 3, cd: 16, when: (L) => L.enemies().length < 3,
    text: 'Friday, half past six, the queue out of the door. A man in a camel coat walks straight to the front and orders for six.',
    opts: [
      { t: 'Say something', check: ['charm', 45], run(L, x, win) { if (win) { L.joy(3); L.fame(0.5); return 'You are so polite about it that he goes to the back. The queue applauds. Harry gives you a free pickled egg.'; } const p = L.foe({ sex: 'm', grudge: 40 }); return `It becomes a discussion, then a scene. His name is ${p.name}, he says, and you have not heard the last of this.`; } },
      { t: 'Tip his chips on the floor', run(L) { const p = L.foe({ sex: 'm', grudge: 65 }); L.joy(5); L.karma(-2); return `Six cod suppers, face down. The queue is thrilled. ${p.name} is not.`; } },
      { t: 'Mutter', run(L) { L.joy(-1); return 'You mutter. Everyone mutters. He gets his chips.'; } },
    ],
  },
  {
    id: 'exText', icon: '📱', title: 'Two in the morning', w: 3, cd: 8, when: (L) => L.exes().length > 0 && !!L.s.items.phone,
    ctx: (L) => L.pick(L.exes()).id, ok: (L, x) => has(L, x) && P(L, x).kind === 'ex',
    text: (L, x) => `Your phone lights up on the bedside table. ${P(L, x).name}: "u up?"`,
    opts: [
      { t: 'Answer', run(L, x) { const p = P(L, x); L.bond(p, 10); p.grudge = Math.max(0, p.grudge - 12); if (L.partner()) L.karma(-2); return 'You talk until four, about nothing, the way you used to. Neither of you mentions it afterwards.'; } },
      { t: 'Turn the phone over', run(L) { L.joy(1); return 'You lie awake anyway.'; } },
      { t: 'Block the number', run(L, x) { L.gone(P(L, x)); L.joy(2); return 'Gone. You sleep like a child.'; } },
    ],
  },
  {
    id: 'exWedding', icon: '💌', title: 'A thick cream envelope', w: 3, cd: 12, when: (L) => L.exes().some((p) => L.s.t - p.since >= 6),
    ctx: (L) => L.pick(L.exes().filter((p) => L.s.t - p.since >= 6)).id, ok: (L, x) => has(L, x) && P(L, x).kind === 'ex',
    text: (L, x) => `${P(L, x).name} is getting married, to someone called ${P(L, x).sex === 'm' ? 'Fenella' : 'Giles'}. You are, astonishingly, invited.`,
    opts: [
      { t: 'Go, and be gracious', cost: 150, run(L, x) { const p = P(L, x); L.gone(p); L.karma(3); L.joy(-2); return `You bring a toaster and dance with ${his(p)} aunt. It is, on the whole, a relief.`; } },
      { t: 'Go, and make a speech', cost: 150, check: ['charm', 55], run(L, x, win) { const p = P(L, x); L.gone(p); if (win) { L.joy(6); L.fame(1); return 'It is funny, warm, and four minutes long. The best man asks if you do bookings.'; } L.karma(-5); L.joy(-6); return 'You begin "I suppose I should say a few words." You are helped down from the table some time later.'; } },
      { t: 'Send your regrets', run(L, x) { L.gone(P(L, x)); return 'A card, a cheque, and a long walk on the beach.'; } },
    ],
  },
  // ---- Chirper ----
  {
    id: 'chViral', icon: '🐦', title: 'Caught on camera', w: 3, cd: 12, when: (L) => !!L.s.items.phone,
    text: 'A gull takes a whole pasty out of a councillor’s hand, lands on his hat to eat it, and you have filmed every second.',
    opts: [
      { t: 'Put it on Chirper', run(L) { const n = Math.round(300 + L.followers() * 0.4); L.crowd(n); L.s.n.viral = (L.s.n.viral || 0) + 1; L.fame(2); L.joy(5); return `It is everywhere by teatime. ${n.toLocaleString('en')} new followers, and the councillor is trending.`; } },
      { t: 'Sell it to the Gazette', run(L) { L.cash(300); return 'Front page, with the headline PASTY SNATCH. $300, and the councillor nods to you stiffly in the street.'; } },
    ],
  },
  {
    id: 'chTroll', icon: '👹', title: 'BayTruth99', w: 3, cd: 12, when: (L) => L.followers() >= 2000,
    text: 'An account with no picture replies to everything you post. Your spelling, your face, your mother. It has been going on for weeks.',
    opts: [
      { t: 'Block, and think no more about it', run(L) { L.joy(1); return 'You think about it a little more. Then no more.'; } },
      { t: 'Reply, once, and well', check: ['charm', 50], run(L, x, win) { if (win) { const n = Math.round(200 + L.followers() * 0.08); L.crowd(n); L.joy(5); return `Eleven words. It is screenshotted, framed and sold on a mug. ${n.toLocaleString('en')} new followers.`; } L.crowd(-Math.round(L.followers() * 0.05)); L.joy(-4); return 'You reply nine times before breakfast. Nobody comes out of it well, but you come out of it worse.'; } },
      { t: 'Find out who it is', check: ['smarts', 55], show: (L) => L.enemies().length < 3, run(L, x, win) { if (!win) return 'The trail ends at the library computers. It could be anybody. It could be the librarian.'; const p = L.foe({ grudge: 50 }); return `It is ${p.name}, from three doors down, who has never liked the way you park. Now you both know.`; } },
    ],
  },
  {
    id: 'chCollab', icon: '🎬', title: 'A message from somebody with a blue tick', w: 3, cd: 16, when: (L) => L.followers() >= 20000,
    text: 'A proper Chirper celebrity is coming down for the day and wants you in the video: "ur the one from the pier right?? would be SO fun."',
    opts: [
      { t: 'Do it', run(L) { busy(L, 2); const n = Math.round(L.followers() * 0.25); L.crowd(n); L.fame(3); L.joy(4); return `You eat a stick of rock on camera forty times. ${n.toLocaleString('en')} new followers overnight.`; } },
      { t: 'Ask what the fee is', check: ['charm', 55], run(L, x, win) { if (win) { busy(L, 2); L.cash(5000); L.crowd(Math.round(L.followers() * 0.15)); return '"Lol ok." $5,000, and they still tag you.'; } return 'They do it with a man dressed as a lobster instead.'; } },
      { t: 'You are busy', run(L) { return 'You are not busy. But you have your pride.'; } },
    ],
  },
  // ---- finds, the plot, and the times ----
  {
    id: 'bootSale', icon: '🚗', title: 'Car boot sale', w: 4, cd: 8,
    text: 'Sunday morning on the cliff car park. Under a trestle table: a cardboard box marked "OLD TAT. $40 THE LOT."',
    opts: [
      { t: 'Buy the box', cost: 40, odds: (L) => 0.3 + L.s.st.smarts / 250, run(L, x, win) { if (win) { const c = L.gotCurio(L.anyCurio()); return `Under a jigsaw and four odd saucers: ${c.a}. The man is already counting your $40 and does not look up.`; } return 'A jigsaw of the Matterhorn with 998 of its 1,000 pieces, four odd saucers, and a mug that says WORLD’S OKAYEST GRANDAD.'; } },
      { t: 'Walk on', run() { return 'You buy a bacon roll instead, which is at least what it says it is.'; } },
    ],
  },
  {
    id: 'pymOffer', icon: '🧐', title: 'A gentleman from the city', w: 3, cd: 10, when: (L) => Object.keys(L.s.curios).length > 0,
    ctx: (L) => L.pick(Object.keys(L.s.curios)), ok: (L, x) => L.s.curios[x] > 0,
    text: (L, x) => `He has heard, from Mr Pym, that you have ${aCurio(x)}. He would like it very much, and has brought ${money(Math.round(CURIOS[x].worth * 1.6))} in an envelope to show how much.`,
    opts: [
      { t: 'Sell', run(L, x) { const s = L.s; if (--s.curios[x] <= 0) delete s.curios[x]; L.cash(Math.round(CURIOS[x].worth * 1.6)); return 'He wraps it in his own scarf and goes back up on the 4.15.'; } },
      { t: 'It is not for sale', run(L) { L.joy(2); return 'He leaves a card. You use it as a bookmark.'; } },
    ],
  },
  {
    id: 'slugs', icon: '🐌', title: 'Slugs', w: 4, cd: 6, when: (L) => !!L.s.plot && L.s.plot.beds.some(Boolean),
    text: 'A wet week, and something has been at your allotment in the night. Silver trails, and lace where there were leaves.',
    opts: [
      { t: 'Go out after dark with a torch and a bucket', run(L) { busy(L, 1); for (const b of L.s.plot.beds) if (b) b.care++; L.joy(1); return 'Two hundred and eleven. You count them. The onion man, also out with a torch, salutes.'; } },
      { t: 'Beer traps', cost: 30, odds: () => 0.6, run(L, x, win) { if (win) { for (const b of L.s.plot.beds) if (b) b.care++; return 'They die happy. Your beds pull through.'; } for (const b of L.s.plot.beds) if (b) b.care = Math.max(0, b.care - 1); return 'A hedgehog drinks the lot and sleeps it off in your cold frame. The slugs carry on.'; } },
      { t: 'Let nature take its course', run(L) { for (const b of L.s.plot.beds) if (b) b.care = Math.max(0, b.care - 2); return 'Nature takes most of it.'; } },
    ],
  },
  {
    id: 'syndicate', icon: '🎟️', title: 'The syndicate', w: 3, cd: 12, when: (L) => inJob(L) && !CAREERS[L.s.job.c].shady,
    text: 'Somebody at work is going round with an envelope: the lotto syndicate. Fifty dollars for the season, shared eleven ways.',
    opts: [
      { t: 'Put in', cost: 50, odds: () => 0.05, run(L, x, win) { if (win) { const got = L.int(4, 20) * 1000; L.cash(got); L.joy(12); return `Five numbers and the bonus! Your share is ${money(got)}. Nobody does any work until Thursday.`; } return 'Three numbers. Your share buys a doughnut, which you eat with dignity.'; } },
      { t: 'Not for you', run(L) { if (L.chance(0.96)) return 'They win nothing, as usual. You feel very wise.'; L.joy(-10); return 'They win. All of them. Ten resignation letters on one morning, and you are asked to cover.'; } },
    ],
  },
  {
    id: 'laidOff', icon: '📉', title: 'The slump reaches your desk', ok: (L) => inJob(L),
    text: 'Half the department is called in, one at a time. Then it is your turn. "It is not you," says the boss, which is what makes it worse.',
    opts: [
      { t: 'Take the pay-off', run(L) { const n = L.shiftPay() * 4, t = L.jobTitle(); L.s.job = null; L.cash(n); L.joy(-8); L.note(`Laid off as ${t}, with ${money(n)}.`, 'big'); return `${money(n)} and a reference. You carry a pot plant home on the bus.`; } },
      { t: 'Make the case for keeping you', check: ['charm', 60], run(L, x, win) { if (win) { L.s.job.perf = Math.min(100, L.s.job.perf + 10); return 'You talk for ten minutes about what only you know how to do. Somebody else carries the pot plant home.'; } const n = L.shiftPay() * 3, t = L.jobTitle(); L.s.job = null; L.cash(n); L.joy(-10); L.note(`Laid off as ${t}.`, 'big'); return `The boss lets you finish, out of kindness. ${money(n)}, and the door.`; } },
    ],
  },
  {
    id: 'midlife', icon: '🏍️', title: 'Is this it?', w: 5, once: true, when: (L) => L.s.age >= 40 && L.s.age <= 52,
    text: 'You catch sight of yourself in the window of the chemist’s and, for a moment, do not know who it is.',
    opts: [
      { t: 'Buy a motorbike', cost: 6000, run(L) { L.joy(12); L.gain('charm', 1.5); if (L.chance(0.2)) { L.rough(12, 'a motorbike'); return 'It is magnificent for five weeks. Then there is a patch of wet leaves on the cliff road. You sell it from a hospital bed.'; } return 'It is loud, it is red, and it is the best idea you have had in twenty years. Everybody says so, except everybody.'; } },
      { t: 'Take up the saxophone', cost: 800, run(L) { L.gain('craft', 4); L.joy(7); return 'The first month is hard on the street. By the third, somebody opens a window to listen.'; } },
      { t: 'Enter the Bay marathon', check: ['fitness', 50], run(L, x, win) { L.gain('fitness', 3); if (win) { L.joy(10); L.fame(1); return 'Four hours and nine minutes. You cry at the finish, and again when you try the stairs.'; } L.joy(2); return 'You get as far as the lighthouse, and a bus brings you back. Next year.'; } },
      { t: 'Have a quiet word with yourself', run(L) { L.gain('smarts', 1.5); L.joy(3); return 'You go home, put the kettle on, and count what you have. It comes to more than you thought.'; } },
    ],
  },
  {
    id: 'highRoller', icon: '🎩', title: 'With the compliments of the house', w: 3, once: true, when: (L) => Math.abs(L.s.n.casino) >= 20000,
    text: 'A card under your door, gold edged. The Lucky Gull would like to offer one of its most valued guests the Admiral’s Suite, dinner, and $1,000 in chips.',
    opts: [
      { t: 'Accept', run(L) { L.joy(9); const kept = L.chance(0.3); if (kept) L.cash(1000); return kept ? 'Lobster, a bed the size of a boat, and for once you walk out with the chips still in your pocket.' : 'Lobster, a bed the size of a boat, and the $1,000 back across the table by midnight. They know their business.'; } },
      { t: 'Use the card to scrape ice off the windscreen', run(L) { L.joy(1); L.gain('smarts', 0.5); return 'It is very good for that.'; } },
    ],
  },
  {
    id: 'legbreakers', icon: '🦈', title: 'A knock at the door', ok: (L) => L.s.shark > 0,
    text: (L) => `Two of Sal’s lads fill your doorway. "It is about the ${money(L.s.shark)}. Sal has been ever so patient."`,
    opts: [
      { t: 'Hand over all you have', show: (L) => L.s.cash > 0, run(L) { const s = L.s, n = Math.min(s.cash, s.shark); s.cash -= n; s.shark -= n; if (!s.shark) s.sharkT = 0; return s.shark ? `They count it on your kitchen table. ${money(s.shark)} to go. "See you soon."` : 'They count it twice, and one of them wipes his feet on the way out.'; } },
      { t: 'Ask for more time', check: ['charm', 50], run(L, x, win) { if (win) { L.s.sharkT = 0; return '"Sal likes you," says the big one, doubtfully. You have a few more seasons.'; } L.rough(20, 'Sal’s lads'); return 'They are very sorry about your kneecap. It is nothing personal.'; } },
      { t: 'Throw the first punch', check: ['fitness', 65], run(L, x, win) { if (win) { L.s.sharkT = 3; L.joy(5); L.s.n.fights = (L.s.n.fights || 0) + 1; return 'One goes into the hedge and the other thinks better of it. They will be back, and there will be more of them.'; } const s = L.s; L.rough(25, 'Sal’s lads'); const n = Math.min(s.cash, s.shark); s.cash -= n; s.shark -= n; return 'It is a short fight. They help themselves to your wallet on the way out.'; } },
    ],
  },
  {
    id: 'caughtOut', icon: '💔', title: 'A small town', ok: mine,
    text: (L, x) => `${P(L, x).name} puts down the telephone very carefully. "That was a friend of mine. She was on the pier last night. So, it seems, were you."`,
    opts: [
      { t: 'Beg forgiveness', check: ['charm', 55], run(L, x, win) { const p = P(L, x); if (win) { L.bond(p, -20); return `Tears, promises, a week on the sofa. ${p.name} stays. It will be a long time before ${he(p)} trusts you.`; } return L.split(p, false, 70); } },
      { t: 'Deny everything', odds: () => 0.4, run(L, x, win) { const p = P(L, x); L.karma(-2); if (win) { L.bond(p, -8); return `You are so wounded and so plausible that ${p.name} ends up apologising. You feel dreadful. Not dreadful enough.`; } L.bond(p, -45); return `${p.name} has a photograph.`; } },
      { t: 'Shrug', run(L, x) { return L.split(P(L, x), false, 80); } },
    ],
  },
  {
    id: 'dumped', icon: '💔', title: 'We need to talk', ok: (L, x) => has(L, x) && P(L, x).kind === 'partner',
    text: (L, x) => `${P(L, x).name} is sitting very straight, with ${his(P(L, x))} coat already on.`,
    opts: [{ t: 'Oh', run(L, x) { return `"You are never here. Not really." ${L.split(P(L, x), false)}`; } }],
  },
  {
    id: 'divorce', icon: '💔', title: 'It has not been right for a long time', ok: (L, x) => has(L, x) && P(L, x).kind === 'spouse',
    text: (L, x) => `${P(L, x).name} puts a solicitor's letter on the kitchen table, between the salt and the pepper.`,
    inText: (L, x) => `A solicitor's letter, already opened by the censor. ${P(L, x).name} wants a divorce.`,
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
    text: (L, x) => (x.adopt ? `The agency rings. A ${x.age}-year-old ${x.sex === 'm' ? 'boy' : 'girl'} is waiting to come home with you. What will you call ${x.sex === 'm' ? 'him' : 'her'}?` : `A ${x.sex === 'm' ? 'boy' : 'girl'}! Seven pounds, furious, and perfect. What will you call ${x.sex === 'm' ? 'him' : 'her'}?`),
    opts: [
      { t: (L, x) => x.names[0], run(L, x) { return born(L, x, 0); } },
      { t: (L, x) => x.names[1], run(L, x) { return born(L, x, 1); } },
    ],
  },
  {
    id: 'kid18', icon: '🎒', title: 'Eighteen', ok: has,
    text: (L, x) => `${P(L, x).name} is eighteen today, with a place at college in the city. It costs a fortune.`,
    inText: (L, x) => `A letter from outside: ${P(L, x).name} is eighteen, with a place at college in the city. It costs a fortune.`,
    opts: [
      { t: (L, x) => `Pay ${his(P(L, x))} way`, cost: 20000, run(L, x) { const p = P(L, x); L.bond(p, 15); L.joy(6); if (p.st) p.st.smarts = Math.min(100, p.st.smarts + 10); return 'You wave from the platform until the train is out of sight, then cry in the car park.'; } },
      { t: 'Help a little', cost: 5000, run(L, x) { L.bond(P(L, x), 5); L.joy(3); return `${He(P(L, x))} will work evenings to make up the rest, and be proud of that, later.`; } },
      { t: (L, x) => `${He(P(L, x))} can make ${his(P(L, x))} own way, like you did`, run(L, x) { const p = P(L, x); L.bond(p, -8); return `${He(p)} gets a job on the boats instead, and says it is fine.`; } },
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
    opts: [{ t: 'Goodbye', run(L, x) { const p = P(L, x), n = Math.round((3000 + p.bond * 120) / 100) * 100; L.s.people.splice(L.s.people.indexOf(p), 1); L.joy(-16); L.cash(n); return `The funeral is on a bright, windy day. ${He(p)} left you ${money(n)}, and ${his(p)} good watch.`; } }],
  },
  {
    id: 'spouseDies', icon: '🕊️', title: 'The empty chair', ok: mine,
    text: (L, x) => `${P(L, x).name} has died, at ${P(L, x).age}, with you beside ${him(P(L, x))}.`,
    inText: (L, x) => `The chaplain comes to your cell with his hat in his hands. ${P(L, x).name} has died, at ${P(L, x).age}. You were not there.`,
    opts: [{ t: 'Goodbye, my love', run(L, x) { const p = P(L, x); L.s.people.splice(L.s.people.indexOf(p), 1); L.joy(-28); return L.s.gaol ? 'They let you out for the funeral: two hours, in handcuffs, with Mr Hobbs standing at the back.' : `The house is very quiet. ${He(p)[0] === 'H' ? 'His' : 'Her'} coat is still on its hook.`; } }],
  },
  {
    id: 'petDies', icon: '🐾', title: 'A good friend', ok: (L) => !!L.s.pet,
    text: (L) => `${L.s.pet.name} the ${PETS[L.s.pet.kind].name} has died, old and well loved.`,
    inText: (L) => `Word comes from outside: ${L.s.pet.name} the ${PETS[L.s.pet.kind].name} has died, old and well loved.`,
    opts: [{ t: 'Goodbye, old friend', run(L) { const n = L.s.pet.name; L.s.pet = null; L.joy(-14); return L.s.gaol ? `A neighbour buried ${n} under an apple tree, and sent you the collar.` : `You bury ${n} at the bottom of the garden, under the apple tree.`; } }],
  },
  {
    id: 'sportsRetire', icon: '🦵', title: 'Time, gentlemen', ok: (L) => inJob(L, 'sports'),
    text: 'The physio shakes her head. The young ones are faster every year, and your knees are not. It is time to hang up your boots.',
    opts: [{ t: 'One last lap of honour', run(L) { const n = pay(L) * 6; L.cash(n); L.fame(4); L.joy(4); const t = L.jobTitle(); L.s.job = null; L.note(`Retired from sport as ${t}.`, 'big'); return `A testimonial match, a standing ovation, and ${money(n)}. Now: what next?`; } }],
  },
  {
    id: 'birthday30', icon: '🎈', title: 'Thirty', free: true,
    text: 'The big three-oh. Where did the twenties go? What do you want from the next ten years?',
    opts: [
      { t: 'To be better at what I am worst at', run(L) { const k = lowest(L); L.gain(k, 5); return `You make a resolution about your ${STAT_NAME[k]}, and for once you keep it.`; } },
      { t: 'To look after myself', run(L) { L.hp(10); return 'You eat a salad. On purpose.'; } },
      { t: 'A really good party', run(L) { L.joy(12); for (const p of L.friends()) L.bond(p, 4); return 'It is a really good party.'; } },
    ],
  },
  {
    id: 'birthday50', icon: '🏍️', title: 'Fifty', free: true,
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
  const s = L.s, name = x.names[i], boy = x.sex === 'm';
  const look = L.randomLook(x.sex);
  look.skin = s.look.skin;
  if (L.chance(0.5)) look.hair = s.look.hair;
  look.beard = false;
  s.people.push(L.makePerson({ name, sex: x.sex, kind: 'child', bond: 60, age: x.age || 0, look, single: false }));
  L.joy(15);
  L.note(x.adopt ? `Adopted ${name}.` : `${name} was born.`, 'love');
  return x.adopt ? `${name} walks in holding a carrier bag of everything ${boy ? 'he' : 'she'} owns, and looks at ${boy ? 'his' : 'her'} new room for a long time.` : `${name}. It suits ${boy ? 'him' : 'her'}. Nobody in your house will sleep for a year.`;
}
