// New in Town: the rules, with no screen. One Life is one person's whole
// life in Starling Bay, from stepping off the train at 18 to the end.
//
// Time moves a season at a time. Each season you get a few blocks of time
// and spend them on actions (act): work a shift, study, see a friend. When
// you're done, endSeason pays the bills, moves the markets, ages everyone
// and may bring an event: a card with choices (event, choose).
//
// The people, property, businesses and fishing are in living.js, and the
// low road (crime, vice and the law) in vice.js. Prison is inside.js, exes
// and enemies feuds.js, the pier's other games pier.js, followers and
// royalties fame.js, and the economy, the Gazette, the allotment and the
// curio shop town.js. All of them add to what is here.
// Everything about the life is in this.s, which is plain data and is what gets saved. The random numbers come from a seed kept there too, so the
// same seed and the same choices always give the same life.

import {
  SEASONS, STATS, STAT_NAME, PLACES, CAREERS, SHIFTS_FOR_RUNG, COURSES, GRADES, STUDENT_RATE, HOMES, UPGRADES, FOOD, INSURANCE, ITEMS, TRIPS,
  SAVINGS_RATE, LOAN_RATE, STOCKS, HEADLINES, PLOT_RENT, NAMES_M, NAMES_F, PET_NAMES, PETS, BACKGROUNDS, LOOKS,
  DREAMS, QUESTS, TROPHIES, RIBBONS, money, cashShort,
} from './data.js';
import { EVENTS } from './events.js';
import { install } from './living.js';
import { install as installVice } from './vice.js';
import { install as installInside } from './inside.js';
import { install as installFeuds } from './feuds.js';
import { install as installPier } from './pier.js';
import { install as installFame } from './fame.js';
import { install as installTown } from './town.js';
import { install as installLegacy } from './legacy.js';
import { install as installKin } from './kin.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const val = (v, L, x, y) => (typeof v === 'function' ? v(L, x, y) : v);

const EVENT = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const FIRST_TIME = 6;

// ---- actions ----------------------------------------------------------------------------

// Everything you can do. place: where it shows up on the map (people and
// lists have none). who: it is done with a person. time and cost may depend on the life and on what the
// action is aimed at (x). why: a reason it can't be done just now.
// per: how many times a season. run does it and returns what to say.
const A = {};
const def = (id, o) => { A[id] = Object.assign({ id, time: 1, cost: 0 }, o); };

// -- home
def('rest', {
  place: 'home', sec: 'At home', icon: '🛋️', title: 'Put your feet up', desc: 'Good for body and mood.',
  run(L) {
    const s = L.s, quilt = s.heir === 'quiet' ? 2 : 0;
    L.hp(4 + (s.items.bed ? 2 : 0) + quilt);
    L.joy(3 + (s.items.tv ? 2 : 0) + quilt + HOMES[s.home].comfort / 6);
    return L.pick(['You do nothing at all, and do it well.', 'A long lie-in, a longer bath.', 'You nap like it is your job.', 'Slippers on. World off.']);
  },
});
def('cook', {
  place: 'home', sec: 'At home', icon: '🍲', title: 'Cook a proper dinner', desc: 'A little Craft, and it does you good.', cost: 40,
  why: (L) => (L.s.home === 'hostel' ? 'The hostel kitchen is a kettle.' : null),
  run(L) {
    L.gain('craft', 1.5); L.joy(2); L.hp(1);
    const p = L.partner();
    if (p && p.live) { L.bond(p, 2); return `You cook for ${p.name}. Seconds are requested.`; }
    return L.pick(['It looks nothing like the picture and tastes wonderful.', 'You make enough for four and eat it all.', 'Only one pan is ruined.']);
  },
});
def('practise', {
  place: 'home', sec: 'At home', icon: '🎸', title: 'Practise guitar', desc: 'Craft.',
  show: (L) => !!L.s.items.guitar,
  run(L) { L.gain('craft', 3); L.joy(1); return L.pick(['Your fingers hurt. That means it is working.', 'The chord change finally lands.', 'A neighbour bangs on the wall, in time.']); },
});
def('weights', {
  place: 'home', sec: 'At home', icon: '🏋️', title: 'Work out at home', desc: 'Fitness, for nothing.',
  show: (L) => !!L.s.items.weights,
  run(L) { L.gain('fitness', 2.5); L.hp(1); return L.pick(['Sweat on the carpet.', 'One more set. Then one more.', 'You are sore in places you had not met.']); },
});
def('freelance', {
  place: 'home', sec: 'At home', icon: '💻', title: 'Take a freelance gig', desc: 'Pays by how sharp you are.', time: 2,
  show: (L) => !!L.s.items.laptop,
  why: (L) => (L.s.st.smarts < 30 ? 'Needs Smarts 30.' : null),
  run(L) {
    const s = L.s, pay = Math.round((250 + s.st.smarts * 22 + s.st.craft * 6) * (0.8 + L.rnd() * 0.4) / 10) * 10;
    L.cash(pay); s.n.earned += pay; L.gain('smarts', 0.6); L.joy(-1);
    return `${L.pick(['A website for a dog groomer.', 'Spreadsheets for a man who fears them.', 'A logo. Then the same logo, bigger.', 'You fix somebody else’s "quick fix".'])} It pays ${money(pay)}.`;
  },
});
def('novel', {
  place: 'home', sec: 'At home', icon: '✍️', title: (L) => (L.s.novel.p ? `Work on your novel (${L.s.novel.p}/10)` : 'Start writing a novel'), desc: 'Ten sittings to finish. Better with Craft and Smarts.',
  show: (L) => !!L.s.items.laptop,
  run(L) {
    const s = L.s, nv = s.novel;
    nv.p++; nv.q += s.st.craft * 0.7 + s.st.smarts * 0.3;
    L.gain('craft', 1.8);
    if (nv.p < 10) return L.pick(['Two thousand words, some of them good.', 'You delete a chapter. It was the right thing to do.', 'A character surprises you.', 'You stare at the cursor. It stares back. You win.']);
    const q = nv.q / 10 + L.int(-12, 12);
    s.novel = { p: 0, q: 0 };
    s.n.books++;
    const boost = s.heir === 'artist' ? 1.5 : 1;
    if (q >= 78) {
      const pay = Math.round(60000 * boost * (1 + s.fame / 60));
      L.cash(pay); L.fame(12); L.joy(15); s.f.bestseller = 1; L.earnFrom('novel', 2500 * boost);
      L.note(`Published a novel. It became a bestseller and earned ${money(pay)}.`, 'big');
      return `You type THE END. A publisher snaps it up, and then so does everybody else: a bestseller! It earns ${money(pay)}.`;
    }
    if (q >= 50) {
      const pay = Math.round(9000 * boost * (1 + s.fame / 60));
      L.cash(pay); L.fame(4); L.joy(10); L.earnFrom('novel', 300 * boost);
      L.note(`Published a novel. It sold respectably and earned ${money(pay)}.`, 'big');
      return `You type THE END. A small press publishes it to kind reviews. It earns ${money(pay)}.`;
    }
    const pay = Math.round(600 * boost);
    L.cash(pay); L.fame(1); L.joy(6);
    L.note('Published a novel. Your mum bought six copies.', 'big');
    return `You type THE END, and publish it yourself. It sells dozens of copies and earns ${money(pay)}. The next one will be better.`;
  },
});
def('party', {
  place: 'home', sec: 'At home', icon: '🎉', title: 'Throw a party', desc: 'Every friend grows closer.', cost: 400, per: 1,
  why: (L) => (L.s.home === 'hostel' ? 'Not in a hostel bunk.' : !L.friends().length ? 'You would need some friends to invite.' : null),
  run(L) {
    for (const p of L.s.people) if (p.kind === 'friend' || p.kind === 'partner' || p.kind === 'spouse') L.bond(p, 6);
    L.gain('charm', 2); L.joy(6);
    return L.pick(['Someone brings a trifle. Someone else sits in it.', 'It ends at dawn with everyone singing on the stairs.', 'The neighbours complain, then come in.']);
  },
});
def('homes', { place: 'home', sec: 'Moving', icon: '📦', title: 'Move house', desc: 'See what the estate agent has.', time: 0, open: 'homes' });
def('foodOpen', { place: 'home', sec: 'At home', icon: '🧺', title: 'Housekeeping', desc: (L) => `How you eat: ${FOOD[L.s.food].name.toLowerCase()}.`, time: 0, open: 'food' });

// -- town hall
def('jobs', { place: 'townhall', sec: 'Work', icon: '📋', title: 'Look at the job board', desc: 'Every career in town starts here.', time: 0, open: 'jobs' });
def('quit', {
  place: 'townhall', sec: 'Work', icon: '🚪', title: 'Hand in your notice', desc: 'Leave your job.', time: 0,
  show: (L) => !!L.s.job,
  run(L) { const t = L.jobTitle(); L.s.job = null; L.note(`Quit as ${t}.`); return `You leave your job as ${t}. The leaving card has four signatures.`; },
});
def('retire', {
  place: 'townhall', sec: 'Work', icon: '🌅', title: 'Retire', desc: (L) => `Stop work, on a pension of ${money(Math.max(L.pensionFor(), L.s.f.jobPension || 0))} a season.`, time: 0,
  show: (L) => !!L.s.job && L.s.age >= 65 && !CAREERS[L.s.job.c].shady,
  run(L) {
    // (Only the best pension you have earned counts: retiring twice doesn't pay twice.)
    const s = L.s, t = L.jobTitle(), had = s.f.jobPension || 0, p = Math.max(L.pensionFor(), had);
    s.pension += p - had; s.f.jobPension = p; s.job = null;
    if (!s.retired) L.joy(8);
    s.retired = true;
    L.note(`Retired as ${t} on a pension of ${money(p)} a season.`, 'big');
    return `They give you a clock and a cake. After all those years as ${t}, your time is your own.`;
  },
});
def('volunteer', {
  place: 'townhall', sec: 'Doing good', icon: '🥫', title: 'Help at the food bank', desc: 'Good for the town, and for your name.',
  run(L) { L.karma(4); L.gain('charm', 0.8); L.joy(2); return L.pick(['You stack tins and carry bags. People say thank you and mean it.', 'A long morning of sorting donations. You feel useful.']); },
});
for (const [amt, k] of [[100, 1], [1000, 3], [10000, 6], [100000, 12]]) {
  def(`give${amt}`, {
    place: 'townhall', sec: 'Doing good', icon: '🎁', title: `Donate ${money(amt)}`, desc: 'To the lifeboat, the shelter and the library fund.', time: 0, cost: amt, per: 1,
    show: (L) => amt <= 1000 || L.s.cash + L.s.bank >= amt,
    run(L) { L.karma(k); L.joy(1 + k / 2); L.s.n.given += amt; return amt >= 10000 ? 'They put your name on a small brass plaque.' : 'The collection tin rattles gratefully.'; },
  });
}
def('adopt', {
  place: 'townhall', sec: 'Family', icon: '🧸', title: 'Ask about adopting a child', desc: 'A child who needs a home comes to live with you.', cost: 5000,
  show: (L) => L.s.age >= 25,
  why: (L) => (L.s.age > 55 ? 'The agency prefers younger parents.' : L.s.due ? 'There is already a little one on the way.' : L.s.record ? 'Your record counts against you.' : L.s.karma < 0 ? 'The agency has heard things about you.' : L.partner() && L.partner().live && !L.partner().wish ? `${L.partner().name} does not want children.` : L.roomForKid() ? null : 'You need a home with room for a child.'),
  run(L) { L.s.due = { t: L.s.t + 1, adopt: true }; return 'Forms, interviews, more forms. Then: a yes. A child will join you next season.'; },
});
def('mayor', {
  place: 'townhall', sec: 'Work', icon: '🗳️', title: 'Stand for mayor', desc: (L) => `Run a campaign. Your chances: ${Math.round(L.mayorOdds() * 100)}%.`, cost: 20000, time: 2,
  show: (L) => L.s.job && L.s.job.c === 'politics' && L.s.job.r === 3 && !L.s.f.elected,
  why(L) {
    if (L.s.t - (L.s.f.ran ?? -99) < 8) return 'The next election is a while off.';
    const miss = L.nextRung().list.find((n) => !n.ok && !n.text.startsWith('Win'));
    return miss ? `First: ${miss.text}.` : null;
  },
  run(L) {
    L.s.f.ran = L.s.t;
    if (L.chance(L.mayorOdds())) {
      L.s.f.elected = 1; L.fame(6); L.joy(12);
      L.note('Won the election for mayor of Starling Bay.', 'big');
      return 'The count goes on past midnight. Then the returning officer clears her throat, and reads your name. You have won! Work one more shift to take office.';
    }
    L.joy(-8);
    return 'You shake every hand in town. It is not enough: you lose by a few hundred votes. There is always next time.';
  },
});

// -- college
def('library', {
  place: 'college', sec: 'Study', icon: '📖', title: 'Study in the library', desc: 'Smarts, for nothing.',
  run(L) { L.gain('smarts', 2.6); return L.pick(['Three hours and one very good idea.', 'You read until the lights flick off and on at you.', 'Mrs Okafor the librarian slides you a better book.', 'It goes in. Some of it stays in.']); },
});
def('tutor', {
  place: 'college', sec: 'Study', icon: '🧑‍🏫', title: 'Hire a tutor', desc: 'Smarts, much faster.', cost: 250,
  run(L) { L.gain('smarts', 4.2); return L.pick(['The tutor explains it once, properly. Oh. OH.', 'An hour of being wrong in useful ways.']); },
});
def('courses', { place: 'college', sec: 'Courses', icon: '🎓', title: 'See the courses', desc: 'A qualification lets you start a career partway up.', time: 0, open: 'courses' });

// -- gym
def('workout', {
  place: 'gym', sec: 'Train', icon: '🏃', title: 'Work out', desc: 'Fitness.', cost: 60,
  run(L) { L.gain('fitness', 3); L.hp(1); return L.pick(['The treadmill wins, but only on points.', 'You lift a thing, then put it down again, many times.', 'Lengths of the pool until your arms hum.']); },
});
def('trainer', {
  place: 'gym', sec: 'Train', icon: '🥊', title: 'Session with a trainer', desc: 'Fitness, much faster.', cost: 350,
  run(L) { L.gain('fitness', 4.6); L.hp(2); return L.pick(['"Ten more," says the trainer, who cannot count.', 'You discover three new muscles, all furious.']); },
});
def('yoga', {
  place: 'gym', sec: 'Train', icon: '🧘', title: 'Yoga class', desc: 'Health and calm.', cost: 80,
  run(L) { L.hp(3); L.joy(3); L.gain('fitness', 1); return L.pick(['You fall asleep in the lying-down bit. Everyone does.', 'For one whole minute your mind is quiet.']); },
});
def('race', {
  place: 'gym', sec: 'Compete', icon: '🏅', title: 'Enter the Bay Fun Run', desc: 'Every summer. Prizes for the quick.', cost: 50, per: 1,
  show: (L) => L.season === 1,
  run(L) {
    const sc = L.s.st.fitness + L.int(-15, 15);
    L.gain('fitness', 1.5);
    if (sc >= 85) { L.cash(2500); L.fame(1); L.joy(8); return 'You break the tape with the town cheering. First place, and $2,500!'; }
    if (sc >= 55) { L.cash(600); L.joy(5); return 'A place on the podium, a medal, and $600.'; }
    L.joy(2);
    return 'You finish, red in the face, behind a man dressed as a lobster.';
  },
});

// -- pub
def('chat', {
  place: 'pub', sec: 'Mingle', icon: '💬', title: 'Chat with the regulars', desc: 'Charm. You might make a friend.', cost: 40,
  run(L) {
    L.gain('charm', 2.6); L.joy(2);
    const p = L.maybeMeet(0.3);
    return p ? `You get talking to ${p.name} at the bar, and do not stop.` : L.pick(['You hear a story about a whale that cannot possibly be true.', 'Someone explains the tides to you at great length.', 'You laugh in the right places.']);
  },
});
def('round', {
  place: 'pub', sec: 'Mingle', icon: '🍻', title: 'Buy a round', desc: 'More Charm, and everybody is your friend.', cost: 220,
  run(L) {
    L.gain('charm', 3.6); L.joy(3);
    for (const p of L.friends()) L.bond(p, 2);
    const p = L.maybeMeet(0.55);
    return p ? `A cheer goes up. ${p.name} insists on buying you one back.` : 'A cheer goes up. You are, briefly, the most popular person in Starling Bay.';
  },
});
def('quiz', {
  place: 'pub', sec: 'Games', icon: '❓', title: 'Pub quiz night', desc: 'Win the $400 pot with Smarts.', cost: 20, per: 1,
  run(L) {
    L.gain('smarts', 1.2);
    if (L.chance(clamp(0.12 + L.s.st.smarts / 120, 0.1, 0.9))) { L.cash(400); L.joy(4); return 'It comes down to a tie-break on the capital of Burkina Faso. You know it. The $400 pot is yours!'; }
    L.joy(1);
    return 'Beaten again by the table of retired teachers.';
  },
});
def('wrestle', {
  place: 'pub', sec: 'Games', icon: '💪', title: 'Arm-wrestle Big Tam', desc: '$100 says you cannot.', cost: 100, per: 2, time: 0,
  run(L) {
    if (L.chance(clamp(0.1 + (L.s.st.fitness - 25) / 70, 0.05, 0.9))) { L.cash(200); L.joy(3); return 'A long, shaking minute. Then Big Tam’s knuckles touch the table. He pays up, looking thoughtful.'; }
    L.joy(-1);
    return 'Big Tam does not appear to notice you are trying.';
  },
});
def('openmic', {
  place: 'pub', sec: 'Games', icon: '🎤', title: 'Play the open mic', desc: 'Craft decides how it goes.', per: 1,
  why: (L) => (L.s.st.craft < 20 ? 'Needs Craft 20.' : null),
  run(L) {
    const sc = L.s.st.craft + L.int(-20, 20);
    if (sc >= 60) { L.fame(1); L.gain('charm', 1.5); L.joy(5); L.cash(150); return 'You bring the house down. People put $150 in a pint glass for you.'; }
    if (sc >= 35) { L.fame(0.3); L.gain('charm', 1); L.joy(2); return 'Polite, warm applause. One person whoops.'; }
    L.gain('charm', 0.5); L.joy(-2);
    return 'A man boos. It is the landlord.';
  },
});

// -- park
def('jog', {
  place: 'park', sec: 'Fresh air', icon: '👟', title: 'Go for a run', desc: 'Fitness, for nothing.',
  run(L) { L.gain('fitness', 2); L.hp(1); return L.pick(['Twice round the pond. The ducks are unimpressed.', 'You are overtaken by a pensioner, and then inspired by her.', 'Legs like jelly, head like a clear sky.']); },
});
def('bench', {
  place: 'park', sec: 'Fresh air', icon: '🦆', title: 'Sit by the pond', desc: 'Lifts your mood.',
  run(L) {
    L.joy(4 + (L.s.gifts.bench ? 2 : 0)); L.hp(1);
    const p = L.maybeMeet(0.12);
    return p ? `${p.name} sits down at the other end of the bench. By the end you are sharing sandwiches.` : L.pick(['The light on the water. A dog with a stick far too big for it.', 'You watch the clouds and think about nothing.', 'A duck looks at you as if you owe it money.']);
  },
});
def('busk', {
  place: 'park', sec: 'Hobbies', icon: '🎶', title: 'Busk by the bandstand', desc: 'Coins in the case, by Craft.',
  show: (L) => !!L.s.items.guitar,
  run(L) {
    const s = L.s, pay = Math.round((30 + s.st.craft * 6) * (0.6 + L.rnd() * 0.8) * (1 + s.fame / 80));
    L.cash(pay); s.n.earned += pay; L.gain('craft', 1.6);
    if (s.st.craft > 50) L.fame(0.2);
    return `${L.pick(['A small crowd gathers.', 'A toddler dances. It counts.', 'Somebody requests a song you hate. You play it beautifully.'])} You make ${money(pay)}.`;
  },
});
def('paint', {
  place: 'park', sec: 'Hobbies', icon: '🖌️', title: 'Paint the view', desc: 'Craft, and a painting to sell at the studios.',
  show: (L) => !!L.s.items.easel,
  run(L) { L.gain('craft', 3); L.joy(1); L.s.paintings++; return L.pick(['The sea will not sit still, but you get it down.', 'A passer-by says it is "very blue". It is.', 'Your best yet. You sign it small in the corner.']); },
});
def('dogwalk', {
  place: 'park', sec: 'Fresh air', icon: '🐕', title: (L) => `Walk ${L.s.pet.name}`, desc: 'Good for both of you.',
  show: (L) => L.s.pet && L.s.pet.kind === 'dog',
  run(L) {
    L.joy(4); L.gain('fitness', 1.5); L.hp(1);
    const p = L.maybeMeet(0.15);
    return p ? `${L.s.pet.name} makes friends with another dog, which means you meet ${p.name}.` : `${L.s.pet.name} chases every gull in the park and catches none.`;
  },
});
def('litter', {
  place: 'park', sec: 'Doing good', icon: '🧤', title: 'Join the litter pick', desc: 'Good for the town, and for your name.',
  run(L) { L.karma(3); L.joy(2); L.gain('fitness', 0.8); return L.pick(['Four bags of rubbish and one traffic cone.', 'The beach looks better. So do you, in the hi-vis.']); },
});
def('surf', {
  place: 'park', sec: 'Fresh air', icon: '🏄', title: 'Surf the bay', desc: 'Fitness and a big grin.',
  show: (L) => !!L.s.items.surfboard,
  why: (L) => (L.season === 3 ? 'Not in winter. You like your toes.' : null),
  run(L) { L.gain('fitness', 2.2); L.joy(5); return L.pick(['You stand up for four whole seconds!', 'A clean green wave, all the way in.', 'The sea puts you through the wash. You come up laughing.']); },
});
def('pets', { place: 'park', sec: 'Pawprints shelter', icon: '🐾', title: 'Visit the animal shelter', desc: 'Someone is waiting for you.', time: 0, open: 'pets', show: (L) => !L.s.pet });

// -- harbour
def('crates', {
  place: 'harbour', sec: 'Odd jobs', icon: '📦', title: 'Unload crates', desc: 'Cash in hand, by Fitness. Anyone can.', time: 2,
  run(L) {
    const s = L.s, pay = Math.round((600 + s.st.fitness * 7) / 10) * 10;
    L.cash(pay); s.n.earned += pay; L.gain('fitness', 1.4); L.joy(-1);
    return `A day of hauling fish boxes. Your back complains; your wallet does not. ${money(pay)}.`;
  },
});
def('marlow', {
  place: 'harbour', sec: 'The water', icon: '🧓', title: 'Chat with old Marlow', desc: 'He has fished here for sixty years.', per: 1,
  run(L) {
    const s = L.s, st = s.f.marlow || 0;
    if (st === 0) { L.queue('marlow1'); return 'An old man in a blue jersey is glaring at a heap of tangled net.'; }
    if (st === 1) { L.queue('marlow2'); return 'Marlow nods you over to the end of the pier.'; }
    if (st === 2 && s.n.fish >= 15) { L.queue('marlow3'); return 'Marlow is sitting on an upturned crate, looking at his boat.'; }
    L.joy(2);
    if (st === 2) return `"You've the makings," says Marlow. "Come back when you've landed a few more." (${s.n.fish} of 15 fish caught.)`;
    return L.pick(['Marlow tells you about the winter of the great storm. The waves get bigger every telling.', '"Red sky at night," says Marlow, "means it’s night."', 'You share a flask of tea and watch the boats come in.']);
  },
});
def('sail', {
  place: 'harbour', sec: 'The water', icon: '⛵', title: 'Take your boat out', desc: 'Nothing lifts the spirits like it.',
  show: (L) => !!L.s.items.boat,
  run(L) { L.joy(8); L.gain('fitness', 1); L.hp(1); return L.pick(['Wind on the beam, the town small behind you.', 'A seal pops up to look at you. You look back.', 'You round the lighthouse with the sails singing.']); },
});

// -- studios
def('artclass', {
  place: 'studios', sec: 'Make things', icon: '🏺', title: 'Take an art class', desc: 'Craft.', cost: 120,
  run(L) { L.gain('craft', 3.6); L.joy(2); return L.pick(['Your pot is lopsided and you love it.', 'Life drawing. You get the hands right for once.', 'Printmaking: ink to the elbows.']); },
});
def('sellart', {
  place: 'studios', sec: 'Make things', icon: '🖼️', title: (L) => `Sell a painting (you have ${L.s.paintings})`, desc: (L) => `The gallery takes two a season. Worth about ${money(L.artPrice())}.`, time: 0, per: 2,
  show: (L) => L.s.paintings > 0,
  run(L) {
    const pay = Math.round(L.artPrice() * (0.7 + L.rnd() * 0.6) / 10) * 10;
    L.s.paintings--; L.cash(pay); L.s.n.earned += pay; L.joy(2);
    return `${L.pick(['A couple from the city fall for it.', 'It goes to a dentist’s waiting room.', 'A red dot appears beside it within the hour.'])} ${money(pay)}.`;
  },
});
def('exhibit', {
  place: 'studios', sec: 'Make things', icon: '🥂', title: 'Hold an exhibition', desc: 'Shows three paintings. Fame, and good sales.', cost: 500, per: 1, time: 2,
  show: (L) => !!L.s.items.easel,
  why: (L) => (L.s.st.craft < 50 ? 'Needs Craft 50.' : L.s.paintings < 3 ? 'Needs three paintings.' : null),
  run(L) {
    const pay = Math.round(L.artPrice() * 4.5 / 10) * 10;
    L.s.paintings -= 3; L.cash(pay); L.s.n.earned += pay; L.fame(4); L.joy(8); L.s.f.exhibited = 1;
    return `Warm white wine, cold feet, and then: red dots on all three. The night makes ${money(pay)}.`;
  },
});
def('demo', {
  place: 'studios', sec: 'Make things', icon: '🎙️', title: 'Record a demo', desc: 'Could get you noticed.', cost: 800, per: 1, time: 2,
  show: (L) => !!L.s.items.guitar,
  why: (L) => (L.s.st.craft < 40 ? 'Needs Craft 40.' : null),
  run(L) {
    const sc = L.s.st.craft + L.int(-15, 15);
    L.gain('craft', 1.5);
    if (sc >= 70) { L.fame(3); L.cash(2000); return 'A late-night radio DJ plays it twice. Royalties of $2,000 trickle in, and people start to know your name.'; }
    if (sc >= 50) { L.fame(1); return 'It gets passed around town. People hum it in the chip shop queue.'; }
    L.fame(0.3);
    return 'You listen back. It is... a start.';
  },
});

// -- labs
def('hack', {
  place: 'labs', sec: 'Open house', icon: '🧑‍💻', title: 'Go to hack night', desc: 'Smarts, pizza, and people.', per: 1,
  run(L) {
    L.gain('smarts', 3);
    const p = L.maybeMeet(0.2);
    return p ? `You and ${p.name} build a toaster that tweets. Friends for life.` : L.pick(['You build something pointless and wonderful.', 'Someone shows you a trick that saves you hours.']);
  },
});
def('cabinet', {
  place: 'labs', sec: 'Open house', icon: '🕹️', title: 'Play the old Star Swarm cabinet', desc: 'In the lobby. Takes a coin.', cost: 5, time: 0, per: 3,
  run(L) { L.joy(1.5); return L.pick(['You get to stage nine. The initials at the top say MRL. Marlow?', 'One more go. One more. One more.', 'New high score! Nobody is there to see it.']); },
});
def('pitch', {
  place: 'labs', sec: 'Open house', icon: '🚀', title: 'Pitch a start-up', desc: (L) => `Stake $50,000 on an idea. Your chances: ${Math.round(L.pitchOdds() * 100)}%.`, cost: 50000, time: 2,
  why: (L) => (L.s.st.smarts < 60 ? 'Needs Smarts 60.' : L.s.t - (L.s.f.pitched ?? -99) < 12 ? 'The investors want a rest from you.' : null),
  run(L) {
    L.s.f.pitched = L.s.t;
    if (L.chance(L.pitchOdds())) {
      const pay = 50000 * L.int(4, 9);
      L.cash(pay); L.fame(3); L.joy(12);
      L.note(`Sold a start-up for ${money(pay)}.`, 'big');
      return `It works. It actually works. A bigger company buys the lot for ${money(pay)}.`;
    }
    L.joy(-8);
    return 'Eighteen months of work, and it turns out nobody wanted an app for that. The $50,000 is gone.';
  },
});

// -- hospital
def('checkup', {
  place: 'hospital', sec: 'Care', icon: '🩺', title: 'Have a check-up', desc: 'Health, and it clears up small things.', cost: (L) => L.medCost(200),
  run(L) {
    const s = L.s;
    L.hp(6 * L.medBoost());
    if (s.ill && s.ill.sev <= 1) { const n = s.ill.name; s.ill = null; return `The doctor sorts out your ${n} and tells you to eat a vegetable.`; }
    return L.pick(['"You will live," says the doctor, sounding faintly surprised.', 'Blood pressure fine. Lecture about sleep delivered.']);
  },
});
def('treat', {
  place: 'hospital', sec: 'Care', icon: '💊', title: (L) => `Get your ${L.s.ill.name} treated`, desc: 'Cures it.', cost: (L) => L.medCost(700 * L.s.ill.sev),
  show: (L) => !!L.s.ill,
  run(L) { const n = L.s.ill.name; L.s.ill = null; L.hp(8 * L.medBoost()); return `A course of treatment and the ${n} is gone.`; },
});
def('spa', {
  place: 'hospital', sec: 'Care', icon: '🏥', title: 'Full health programme', desc: 'A lot of Health.', cost: (L) => L.medCost(2500), per: 1, time: 2,
  run(L) { L.hp(20 * L.medBoost()); return 'Scans, physiotherapy, a diet sheet. You walk out feeling ten years younger.'; },
});
def('therapy', {
  place: 'hospital', sec: 'Care', icon: '🛋️', title: 'Talk to a counsellor', desc: 'Lifts your mood.', cost: (L) => L.medCost(350),
  run(L) { L.joy(10 * L.medBoost()); return L.pick(['You say something out loud for the first time, and it weighs less.', 'An hour of untangling. Worth every penny.']); },
});
def('blood', {
  place: 'hospital', sec: 'Doing good', icon: '🩸', title: 'Give blood', desc: 'You get a biscuit.', per: 1,
  why: (L) => (L.s.health < 40 ? 'You need it more than they do.' : null),
  run(L) { L.karma(2); L.hp(-2); L.joy(1); return 'A pint lighter. The biscuit is a custard cream.'; },
});

// -- bank
def('bankOpen', { place: 'bank', sec: 'Your money', icon: '🐷', title: 'Savings and loans', desc: 'Pay in, take out, borrow, pay back.', time: 0, open: 'bank' });
def('stocksOpen', { place: 'bank', sec: 'Your money', icon: '📈', title: 'Shares', desc: 'An index fund and five local companies.', time: 0, open: 'stocks' });
def('propsOpen', { place: 'bank', sec: 'Your money', icon: '🏘️', title: 'Property', desc: 'What you own, and places to buy and let out.', time: 0, open: 'estate' });
def('insureOpen', { place: 'bank', sec: 'Your money', icon: '☂️', title: 'Insurance', desc: 'Cover for your health and your home.', time: 0, open: 'insure' });

// -- station
def('folks', {
  place: 'station', sec: 'Family', icon: '👪', title: 'Visit your parents', desc: 'They would love to see you.', cost: 200, time: 2,
  show: (L) => L.s.people.some((p) => p.kind === 'parent'),
  run(L) {
    for (const p of L.s.people) if (p.kind === 'parent') L.bond(p, 14);
    L.joy(6);
    return L.pick(['Your old room is a sewing room now. The dinner is exactly the same.', 'You are sent home with a carrier bag of food and a houseplant.', 'Nobody lets you wash up.']);
  },
});

// -- the casino
def('slotsOpen', { place: 'casino', sec: 'Games', icon: '🎰', title: 'Play the slots', desc: 'Three diamonds pay 400 to 1.', time: 0, open: 'slots' });
def('hiloOpen', { place: 'casino', sec: 'Games', icon: '🃏', title: 'Higher or Lower', desc: 'Call the next card. Cash out any time.', time: 0, open: 'hilo' });
const REEL = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '💎'];
const REEL_ODDS = [0.3, 0.25, 0.18, 0.14, 0.09, 0.04];
const REEL_PAYS = [5, 8, 15, 30, 80, 400];
def('slots', {
  time: 0, cost: (L, bet) => bet,
  why: (L, bet) => ([50, 500, 5000, 50000].includes(bet) ? null : 'Pick a stake.'),
  run(L, bet) {
    const s = L.s, reels = [];
    for (let i = 0; i < 3; i++) {
      let r = L.rnd(), k = 0;
      while (k < 5 && r >= REEL_ODDS[k]) r -= REEL_ODDS[k++];
      reels.push(k);
    }
    let mult = 0;
    if (reels[0] === reels[1] && reels[1] === reels[2]) mult = REEL_PAYS[reels[0]];
    else if (reels.filter((k) => k === 0).length === 2) mult = s.heir === 'rogue' ? 2.5 : 2;
    const win = bet * mult;
    s.n.casino += win - bet;
    L.out = { reels: reels.map((k) => REEL[k]), win };
    if (win) { L.cash(win); L.joy(mult >= 15 ? 6 : 0.5); } else L.joy(-0.3);
    if (reels[0] === 5 && mult) { s.f.jackpot = 1; L.note(`Hit the jackpot on the slots: ${money(win)}.`, 'big'); return `JACKPOT! Three diamonds! ${money(win)}!`; }
    return win ? `A win! ${money(win)}.` : L.pick(['Nothing.', 'So close.', 'Not this time.', 'The machine plays a sad little tune.']);
  },
});
def('hiloStart', {
  time: 0, cost: (L, bet) => bet,
  why: (L, bet) => (L.s.hilo ? 'Finish the hand you are playing.' : [50, 500, 5000, 50000].includes(bet) ? null : 'Pick a stake.'),
  run(L, bet) { L.s.hilo = { bet, pot: bet, card: L.int(1, 13), streak: 0 }; return 'The dealer turns a card.'; },
});
def('hiloGuess', {
  time: 0,
  why: (L, dir) => (!L.s.hilo ? 'Place a bet first.' : L.hiloOdds(dir) <= 0 ? 'Nothing beats that.' : null),
  run(L, dir) {
    const s = L.s, h = s.hilo, next = L.int(1, 13), p = L.hiloOdds(dir);
    const won = dir === 'hi' ? next > h.card : next < h.card;
    if (!won) {
      s.n.casino -= h.bet; s.hilo = null; L.joy(-0.5);
      L.out = { card: next, lost: true };
      return next === h.card ? 'The same again: the house takes ties. Your stake is gone.' : 'Wrong way. Your stake is gone.';
    }
    h.pot = Math.round(h.pot * (s.heir === 'rogue' ? 1 : 0.97) / p);
    h.card = next; h.streak++;
    s.n.streak = Math.max(s.n.streak, h.streak);
    L.out = { card: next };
    return `Right! The pot is ${money(h.pot)}.`;
  },
});
def('hiloCash', {
  time: 0,
  why: (L) => (L.s.hilo ? null : 'Nothing to cash.'),
  run(L) { const h = L.s.hilo; L.s.hilo = null; L.cash(h.pot); L.s.n.casino += h.pot - h.bet; if (h.streak >= 3) L.joy(Math.min(6, h.streak)); return `You walk away with ${money(h.pot)}.`; },
});

// -- lists: jobs, courses, shops, trips, pets, the bank
def('apply', {
  why: (L, c) => L.applyWhy(c),
  run(L, c) {
    const s = L.s, car = CAREERS[c], r = L.startRung(c);
    // (Leaving and coming back does not wipe the slate: the boss remembers.)
    s.job = { c, r, n: 0, perf: Math.min(50, s.stand[c] ?? 50), raise: 0 };
    s.worked[c] = Math.max(s.worked[c] ?? 0, r);
    s.retired = false;
    L.note(`Started work as ${car.rungs[r].title}.`);
    return `You start as ${car.rungs[r].title} at ${PLACES[car.place].name}: ${money(L.shiftPay())} a shift.${r > 0 && !(s.worked[c] > r) ? ' No starting at the bottom for you.' : ''}`;
  },
});
// Three ways to do a shift. n: how much it counts towards promotion.
const EFFORT = {
  work: { n: 1, stress: 1, perf: 1, icon: '💼', title: (L) => `Work a shift as ${L.jobTitle()}`, desc: (L) => `Pays about ${money(L.shiftPay())}.` },
  workHard: { n: 1.5, stress: 1.8, perf: 5, hp: -1, icon: '🔥', title: () => 'Go the extra mile', desc: () => 'Same pay, but it counts as a shift and a half towards promotion, and the boss notices. Tiring.' },
  workEasy: { n: 0.5, stress: 0.3, perf: -5, icon: '🫖', title: () => 'Coast through a shift', desc: () => 'Same pay and hardly any strain, but it counts for half, and the boss notices that too.' },
};
for (const [id, e] of Object.entries(EFFORT)) {
  def(id, {
    place: (L) => (L.s.job ? CAREERS[L.s.job.c].place : null), sec: 'Work', icon: e.icon, time: 2, title: e.title,
    desc: (L) => ((L.s.use.work || 0) >= 3 ? 'You are worn out: more shifts this season will cost your health.' : e.desc(L)),
    show: (L) => !!L.s.job,
    run: (L) => L.work(e),
  });
}
def('raise', {
  place: (L) => (L.s.job ? CAREERS[L.s.job.c].place : null), sec: 'Work', icon: '💷', title: 'Ask for a pay rise', time: 0,
  desc: (L) => `Your chances: ${Math.round(L.raiseOdds() * 100)}%. Better if the boss thinks well of you.`,
  show: (L) => !!L.s.job,
  why: (L) => (L.s.job.raise >= 0.4 ? 'You are at the top of the pay scale for this job.' : L.s.t - (L.s.job.asked ?? -99) < 8 ? 'You asked not long ago.' : null),
  run(L) {
    const j = L.s.job;
    j.asked = L.s.t;
    if (L.chance(L.raiseOdds())) { j.raise = Math.min(0.4, j.raise + 0.08); L.joy(4); return `The boss sighs, and nods. ${money(L.shiftPay())} a shift from now on.`; }
    j.perf = clamp(j.perf - 4, 0, 100); L.joy(-2);
    return '"The budget will not stretch to it." You both pretend the conversation did not happen.';
  },
});

def('enrol', {
  time: 0,
  why(L, x) {
    const c = COURSES[x.id];
    if (!c) return 'No such course.';
    if (L.s.edu[x.id]) return 'You already have it.';
    if (L.hasEdu(x.id)) return 'You hold something better.';
    if (L.s.course) return 'One course at a time.';
    const miss = L.needs(c.need).find((n) => !n.ok);
    return miss ? `Needs ${miss.text}.` : null;
  },
  run(L, x) {
    L.s.course = { id: x.id, p: 0, mark: 0, rev: 0, loan: !!x.loan };
    return `You sign up for the ${COURSES[x.id].name}. Classes are at the college${x.loan ? ', and the fees go on a student loan' : `: ${money(L.classFee(x.id))} each`}.`;
  },
});
def('drop', {
  time: 0, why: (L) => (L.s.course ? null : 'You are not on a course.'),
  run(L) { const c = COURSES[L.s.course.id]; L.s.course = null; return `You drop the ${c.name}.`; },
});
def('class', {
  place: 'college', sec: 'Your course', icon: '✏️', time: 2,
  title: (L) => `Go to class: ${COURSES[L.s.course.id].name}`,
  desc: (L) => `${L.s.course.p} of ${COURSES[L.s.course.id].classes} done${L.s.course.loan ? '. On your student loan' : ''}.`,
  cost: (L) => (L.s.course.loan ? 0 : L.classFee(L.s.course.id)),
  show: (L) => !!L.s.course && !L.s.course.exam,
  run(L) {
    const s = L.s, k = s.course, c = COURSES[k.id];
    if (k.loan) s.sloan += L.classFee(k.id);
    k.p++;
    k.mark += L.classMark(k.id);
    L.gain(L.courseStat(k.id), 1.6);
    if (k.p < c.classes) return L.pick(['Notes taken. Some of them legible.', 'A good class. You ask a question and it is not a silly one.', 'Homework. At your age.', 'It is starting to make sense.']);
    k.exam = true;
    return 'That is the last class. Only the exam stands between you and the piece of paper. Revise first, or walk straight in?';
  },
});
def('revise', {
  place: 'college', sec: 'Your course', icon: '📝', title: 'Revise', time: 1,
  desc: (L) => `Lifts your mark in the exam (it is heading for ${L.gradeWord(L.examMark())}).`,
  show: (L) => !!L.s.course,
  why: (L) => (L.s.course.rev >= 4 ? 'You know it backwards. More would not help.' : null),
  run(L) { const k = L.s.course; k.rev++; L.gain(L.courseStat(k.id), 1.2); return L.pick(['Flash cards. Highlighters. A wall of sticky notes.', 'You teach it to the cat, which is how you know you know it.', 'Past papers until your eyes cross.']); },
});
def('exam', {
  place: 'college', sec: 'Your course', icon: '🎓', title: 'Sit the exam', time: 1,
  desc: (L) => `You are heading for ${L.gradeWord(L.examMark())}. Revising first would help.`,
  show: (L) => !!L.s.course && !!L.s.course.exam,
  run(L) {
    const s = L.s, k = s.course, c = COURSES[k.id], mark = L.examMark() + L.int(-10, 10);
    if (mark < 40) {
      k.exam = false; k.p = c.classes - 2; k.mark *= k.p / c.classes; L.joy(-6);
      return 'You turn over the paper and your mind goes white. A fail. Two more classes, and then you can sit it again.';
    }
    const g = mark >= 72 ? 2 : mark >= 58 ? 1 : 0;
    s.edu[k.id] = { a: s.age, g };
    s.course = null;
    L.joy(8 + 3 * g);
    if (g === 2) L.cash(1000);
    L.note(`Earned a ${c.name}${g ? `, with ${GRADES[g].toLowerCase()}` : ''}.`, 'big');
    L.say('🎓', `${c.name}: ${GRADES[g]}!`, 'good');
    return `${['A pass. It will do nicely.', 'A merit! Better than you dared hope.', 'A distinction! Top of the year, and a $1,000 prize.'][g]} You hold the ${c.name} in both hands for a while.${g ? ' Employers pay a little more for marks like that.' : ''}`;
  },
});

def('buy', {
  time: 0, cost: (L, id) => L.itemPrice(id),
  why: (L, id) => (L.s.items[id] ? 'You have one.' : id === 'car' && L.s.items.sportscar ? 'You have something faster.' : null),
  run(L, id) {
    const s = L.s, it = ITEMS[id];
    s.items[id] = 1;
    if (id === 'sportscar') L.joy(8);
    if (id === 'bike' || id === 'car' || id === 'sportscar') { const was = L.timeMaxWithout(id); s.time += L.timeMax() - was; }
    s.use[`got_${id}`] = 1;
    return `You buy the ${it.name.toLowerCase()}. ${it.blurb}`;
  },
});
def('trip', {
  time: (L, id) => TRIPS[id].time, cost: (L, id) => L.tripCost(id),
  why: (L, id) => (TRIPS[id].only != null && TRIPS[id].only !== L.season ? `Only in ${SEASONS[TRIPS[id].only].toLowerCase()}.` : null),
  run(L, id) {
    const s = L.s, t = TRIPS[id], first = !s.trips[id];
    s.trips[id] = (s.trips[id] || 0) + 1;
    L.joy(t.joy * (first ? 1 : 0.7));
    if (t.hp) L.hp(t.hp);
    if (t.stat) L.gain(t.stat, 2.5);
    const p = L.partner();
    if (p) L.bond(p, 6);
    for (const k of L.kids()) if (k.age < 18) L.bond(k, 4);
    if (first) L.note(`Went on holiday: ${t.name.toLowerCase()}.`);
    return `${t.name}: ${L.pick(['you come back with sand in everything.', 'you send nine postcards and arrive home before any of them.', 'the best week in a long while.', 'you take four hundred photographs, three of them good.'])}${p ? ` ${p.name} came too.` : ''}`;
  },
});
def('pet', {
  time: 1, cost: 150,
  why: (L) => (L.s.pet ? 'You already have a pet.' : L.s.home === 'hostel' ? 'No pets in the hostel.' : null),
  run(L, kind) {
    const s = L.s;
    s.pet = { kind, name: L.pick(PET_NAMES), age: L.int(1, 3), since: s.t };
    L.joy(8);
    L.note(`Adopted ${s.pet.name} the ${PETS[kind].name}.`);
    return `A ${PETS[kind].name} called ${s.pet.name} looks at you through the bars, and that is that. You are a family now.`;
  },
});
def('deposit', {
  time: 0, why: (L, n) => (n > 0 && n <= L.s.cash ? null : 'You do not have that much on you.'),
  run(L, n) { L.s.cash -= n; L.s.bank += n; return `${money(n)} into savings.`; },
});
def('withdraw', {
  time: 0, why: (L, n) => (n > 0 && n <= L.s.bank ? null : 'There is not that much in savings.'),
  run(L, n) { L.s.bank -= n; L.s.cash += n; return `${money(n)} out of savings.`; },
});
def('borrow', {
  time: 0, why: (L, n) => (L.blacklisted() ? 'The bank remembers your bankruptcy. Try again in a few years.' : n > 0 && L.s.debt + n <= L.creditLimit() ? null : 'The bank will not lend you that much.'),
  run(L, n) { L.s.debt += n; L.s.cash += n; return `The bank lends you ${money(n)}. Interest is ${LOAN_RATE * 100}% a season.`; },
});
def('repay', {
  time: 0, why: (L, n) => (n > 0 && n <= L.s.cash && n <= L.s.debt ? null : 'Check the amount.'),
  run(L, n) { L.s.cash -= n; L.s.debt -= n; return L.s.debt ? `${money(n)} paid off. ${money(L.s.debt)} to go.` : 'Paid off in full. You owe the bank nothing.'; },
});
def('repayStudent', {
  time: 0, why: (L, n) => (n > 0 && n <= L.s.cash && n <= L.s.sloan ? null : 'Check the amount.'),
  run(L, n) { L.s.cash -= n; L.s.sloan -= n; return L.s.sloan ? `${money(n)} off your student loan. ${money(L.s.sloan)} to go.` : 'Your student loan is cleared. A weight you had stopped noticing is gone.'; },
});
def('shares', {
  time: 0, cost: (L, x) => Math.ceil(x.n * L.s.stk.p[x.sym]),
  why: (L, x) => (x.n >= 1 && STOCKS[x.sym] ? null : 'How many?'),
  run(L, x) {
    const k = L.s.stk, cost = Math.ceil(x.n * k.p[x.sym]);
    k.own[x.sym] = (k.own[x.sym] || 0) + x.n;
    k.paid[x.sym] = (k.paid[x.sym] || 0) + cost;
    return `Bought ${x.n.toLocaleString()} ${x.sym} for ${money(cost)}.`;
  },
});
def('sellShares', {
  time: 0, why: (L, x) => (x.n >= 1 && (L.s.stk.own[x.sym] || 0) >= x.n ? null : 'You do not hold that many.'),
  run(L, x) {
    const k = L.s.stk, got = Math.floor(x.n * k.p[x.sym]), had = k.own[x.sym];
    k.paid[x.sym] = Math.round(k.paid[x.sym] * (1 - x.n / had));
    k.own[x.sym] = had - x.n;
    L.s.cash += got;
    return `Sold ${x.n.toLocaleString()} ${x.sym} for ${money(got)}.`;
  },
});
def('insure', {
  time: 0, why: (L, id) => (INSURANCE[id] ? null : 'No such cover.'),
  // (The first premium is paid on the spot, so cover can't be had for nothing.)
  cost: (L, id) => (INSURANCE[id] && !L.s.ins[id] ? INSURANCE[id].cost : 0),
  run(L, id) { const on = (L.s.ins[id] = !L.s.ins[id]); return on ? `You take out ${INSURANCE[id].name.toLowerCase()}: ${money(INSURANCE[id].cost)} a season.` : `You cancel the ${INSURANCE[id].name.toLowerCase()}.`; },
});
def('food', {
  time: 0, why: (L, n) => (FOOD[n] ? (L.s.food === n ? 'This is how you eat now.' : null) : 'No such thing.'),
  run(L, n) { L.s.food = n; return `${FOOD[n].name} it is. ${FOOD[n].blurb}`; },
});

// ---- a life -----------------------------------------------------------------------------

export class Life {
  constructor(state) {
    this.s = state;
    this.news = [];
    this.out = null;
    if ((state.v || 1) < 2) this.upgrade();
    // (Four to-do items were added before the last; a life that had finished the list has finished it still.)
    if (state.v < 3) { state.v = 3; if (state.quest >= 12) state.quest += 4; }
    const later = { gifts: {}, gave: {}, fests: {}, heat: 0, shark: 0, habit: {}, stand: {}, eco: 0, roy: [], album: { p: 0, q: 0 }, lot: { n: 0, pot: 100000 }, curios: {}, curSeen: {}, grown: {}, marrow: 0 };
    for (const [k, v] of Object.entries(later)) if (state[k] == null) state[k] = v;
    if (!state.cur) this.restock();
  }

  // name, sex ('m' or 'f'), into: who you fall for ('m', 'f' or 'b' for both),
  // look {skin, hair, top, style, beard}, bg: a background from data.js,
  // sibs: your brothers and sisters, if they are known (else it is left to chance),
  // gifts: what the family has given the town before now ({ id: whose name is on it }),
  // dreams: three ids, heir: the heirloom brought along (a ribbon id),
  // inherit: money left by the last life, gen: which generation this is,
  // parent: one still living from the life before, raised: the skills you
  // were brought up with, if you are the child of the last life.
  static create({ name = 'Sam', sex = 'm', into = null, look = null, bg = 'allrounder', dreams = [], heir = null, inherit = 0, gen = 1, seed = 1, parent = null, raised = null, gifts = null, sibs = null } = {}) {
    const s = {
      v: 3, rng: seed >>> 0, name, sex, into: into || (sex === 'm' ? 'f' : 'm'), look, bg, gen, heir,
      t: 0, age: 18, time: 0,
      cash: 1500 + inherit, bank: 0, debt: 0, sloan: 0, idx: 1,
      health: heir === 'young' ? 100 : 90, happy: 62,
      st: {}, karma: 0, fame: 0, record: 0,
      job: null, worked: {}, pension: 0, retired: false,
      edu: {}, course: null,
      home: 'hostel', owned: false, homeAt: null, estate: [], eid: 1, items: {}, food: 1, ins: {},
      people: [], pid: 1, pet: null, due: null, matches: null,
      stk: { p: {}, h: {}, own: {}, paid: {}, news: [] },
      biz: null, fishbook: {}, hist: [], heat: 0, habit: {}, shark: 0, stand: {},
      gaol: null, run: null, eco: 0, chirp: null, roy: [], album: { p: 0, q: 0 }, bj: null, race: null, lot: { n: 0, pot: 100000 },
      plot: null, grown: {}, marrow: 0, curios: {}, curSeen: {}, cur: null, gifts: { ...(gifts || {}) }, gave: {}, fests: {},
      paintings: 0, novel: { p: 0, q: 0 }, trips: {}, ill: null, hilo: null,
      f: {}, n: { shifts: 0, earned: 0, fish: 0, crimes: 0, books: 0, given: 0, casino: 0, streak: 0 },
      use: {}, cd: {}, seen: {},
      quest: 0, dreams: dreams.filter((d) => DREAMS[d]).slice(0, 3), dreamDone: {}, ach: {},
      log: [], pend: [], dead: null, hurt: '',
    };
    const L = new Life(s);
    if (!s.look) s.look = L.randomLook(sex);
    for (const k of STATS) s.st[k] = 10 + L.int(0, 6) + (raised ? Math.min(28, Math.round((raised[k] || 0) * 0.4)) : 0);
    for (const [k, v] of Object.entries(BACKGROUNDS[bg]?.give || {})) {
      if (k === 'cash') s.cash += v; else s.st[k] += v;
    }
    if (heir === 'tycoon') s.cash += 6000;
    if (heir === 'star') s.items.guitar = 1;
    if (heir === 'artist') s.items.easel = 1;
    if (heir === 'salt') s.items.rod = 1;
    if (heir === 'kingpin') { s.n.crimes = 5; s.karma = -15; }
    if (heir === 'benefactor') s.karma = 25;
    if (heir === 'sensation') { s.items.phone = 1; s.chirp = { n: 2000, posts: 0, ban: 0 }; }
    while (s.dreams.length < 3) {
      const id = L.pick(Object.keys(DREAMS));
      if (!s.dreams.includes(id)) s.dreams.push(id);
    }
    // The first of a family has a mum and dad back home; later ones may have
    // a parent still living from the life before.
    if (parent) s.people.push(L.makePerson({ name: parent.name, sex: parent.sex || (NAMES_M.includes(parent.name.split(' ')[0]) ? 'm' : 'f'), kind: 'parent', bond: 60, age: Math.max(40, parent.age), trait: 'kind', look: parent.look, single: false }));
    else if (gen === 1) {
      for (const [who, x] of [['Mum', 'f'], ['Dad', 'm']]) s.people.push(L.makePerson({ name: who, sex: x, kind: 'parent', bond: 60, age: 18 + L.int(24, 32), trait: 'kind', single: false }));
    }
    L.addSiblings(sibs);
    for (const [sym, k] of Object.entries(STOCKS)) { s.stk.p[sym] = k.start; s.stk.h[sym] = [k.start]; }
    s.time = L.timeMax();
    L.note(`Stepped off the train at Starling Bay with one suitcase and ${money(s.cash)}.`, 'big');
    return L;
  }

  toJSON() { return this.s; }

  // Brings a life saved by the first version of the game up to date.
  upgrade() {
    const s = this.s;
    s.v = 2;
    s.sex = null; s.into = null; // (the screen asks, the first time)
    s.sloan = 0; s.food = 1; s.ins = {}; s.matches = null; s.biz = null; s.fishbook = {}; s.hist = [];
    s.estate = []; s.eid = 1; s.homeAt = null;
    if (s.owned) { s.estate.push({ id: s.eid++, kind: s.home, ups: {}, let: false }); s.homeAt = s.estate[0].id; }
    for (const [kind, n] of Object.entries(s.props || {})) for (let i = 0; i < n; i++) s.estate.push({ id: s.eid++, kind, ups: {}, let: true });
    delete s.props;
    s.stk.news = [];
    for (const [sym, k] of Object.entries(STOCKS)) if (s.stk.p[sym] == null) { s.stk.p[sym] = k.start; s.stk.h[sym] = [k.start]; }
    for (const id of Object.keys(s.edu)) s.edu[id] = { a: typeof s.edu[id] === 'number' ? s.edu[id] : s.age, g: 0 };
    if (s.course) Object.assign(s.course, { mark: s.course.p * 50, rev: 0, loan: false });
    if (s.job) Object.assign(s.job, { perf: 50, raise: 0 });
    if (s.biz && s.biz.at == null) s.biz.at = s.t;
    for (const p of s.people) {
      const first = p.name.split(' ')[0];
      p.sex = first === 'Mum' ? 'f' : first === 'Dad' ? 'm' : NAMES_F.includes(first) ? 'f' : NAMES_M.includes(first) ? 'm' : p.id % 2 ? 'f' : 'm';
      p.single = p.kind === 'friend' && !!p.spark;
      delete p.spark;
      this.fillPerson(p);
    }
    if (s.n.fish) s.fishbook.mackerel = s.n.fish;
    if (s.f.bream) s.fishbook.bream = 1;
  }
  // Sets who you are and who you fall for (asked once of a life from the
  // first version). Anyone you are with becomes someone you would be with.
  setSex(sex, into) {
    const s = this.s;
    s.sex = sex; s.into = into;
    const p = this.partner();
    if (p && into !== 'b' && p.sex !== into) {
      p.sex = into;
      const [first, ...rest] = p.name.split(' ');
      if ((into === 'f' ? NAMES_M : NAMES_F).includes(first)) {
        p.name = [this.pick(into === 'f' ? NAMES_F : NAMES_M), ...rest].join(' ');
        this.note(`${first} goes by ${p.name.split(' ')[0]} these days.`);
      }
      p.look.style = this.pick(LOOKS[into]);
      p.look.beard = false;
    }
  }

  // ---- chance ----

  rnd() {
    const s = this.s;
    let t = (s.rng = (s.rng + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  chance(p) { return this.rnd() < p; }
  int(a, b) { return a + Math.floor(this.rnd() * (b - a + 1)); }
  pick(list) { return list[Math.floor(this.rnd() * list.length)]; }
  gauss() { return Math.sqrt(-2 * Math.log(1 - this.rnd())) * Math.cos(2 * Math.PI * this.rnd()); }
  randomLook(sex) {
    return {
      skin: this.int(0, LOOKS.skin.length - 1), hair: this.int(0, LOOKS.hair.length - 1), top: this.int(0, LOOKS.top.length - 1),
      style: sex ? this.pick(LOOKS[sex]) : this.int(0, LOOKS.styles - 1), beard: sex === 'm' && this.chance(0.3),
    };
  }

  // ---- the numbers that move ----

  get season() { return this.s.t % 4; }
  get year() { return Math.floor(this.s.t / 4) + 1; }

  // Money in (or out: what cash can't cover comes from savings, then a loan).
  cash(d) {
    const s = this.s;
    s.cash += Math.round(d);
    if (s.cash < 0) {
      const take = Math.min(s.bank, -s.cash);
      s.bank -= take; s.cash += take;
      if (s.cash < 0) { s.debt += -s.cash; s.cash = 0; }
    }
  }
  // Skills grow more slowly the higher they are.
  gain(k, base) {
    const s = this.s;
    let m = 1;
    if (s.happy >= 70) m *= 1.15; else if (s.happy < 20) m *= 0.75;
    if (k === 'smarts') m *= (s.items.books ? 1.1 : 1) * (s.heir === 'scholar' ? 1.2 : 1) * (s.age >= 65 ? 0.8 : 1) * (this.perk('tech') ? 1.08 : 1);
    if (k === 'fitness') { m *= (s.heir === 'champion' ? 1.2 : 1) * (s.age >= 75 ? 0.4 : s.age >= 60 ? 0.6 : s.age >= 45 ? 0.85 : 1) * (this.perk('sports') ? 1.08 : 1); s.use.fit = 1; }
    if (k === 'charm') m *= (s.items.suit ? 1.1 : 1) * (s.items.watch ? 1.1 : 1) * (s.items.sportscar ? 1.1 : 1) * (s.heir === 'mayor' ? 1.2 : 1) * (this.perk('politics') ? 1.08 : 1);
    if (k === 'craft') m *= (s.items.piano ? 1.1 : 1) * (s.heir === 'star' ? 1.2 : 1) * (s.age >= 70 ? 0.8 : 1);
    const v = s.st[k];
    s.st[k] = clamp(v + base * m * (1 - v / 105) ** 1.6, 0, 100);
  }
  lose(k, d) { this.s.st[k] = clamp(this.s.st[k] - d, 0, 100); }
  joy(d) { this.s.happy = clamp(this.s.happy + d, 0, 100); }
  hp(d, cause) {
    const s = this.s;
    s.health = clamp(s.health + d, 0, this.healthCap());
    if (d < 0 && cause) s.hurt = cause;
  }
  healthCap() { return 100 - Math.max(0, this.s.age - (this.s.heir === 'young' ? 58 : 50)) * 0.9; }
  // A good name is slow to build past a certain point, and quick to lose.
  karma(d) { const k = this.s.karma; this.s.karma = clamp(k + (d > 0 && k > 0 ? d * (1 - 0.8 * (k / 100) ** 1.2) : d), -100, 100); }
  // Fame is harder to come by the more of it you have.
  fame(d) { const f = this.s.fame; this.s.fame = clamp(f + (d > 0 ? d * (this.perk('arts') ? 1.2 : 1) * (1 - 0.8 * (f / 100) ** 1.5) : d), 0, 100); }
  bond(p, d) { p.bond = clamp(p.bond + d, 0, 100); }

  note(text, kind = '') {
    const s = this.s;
    s.log.push({ a: s.age, q: s.t % 4, t: text, k: kind });
    if (s.log.length > 400) s.log.splice(1, s.log.length - 400);
  }
  // Something to flash up on screen.
  say(icon, text, kind = '') { this.news.push({ icon, text, kind }); }
  queue(id, x = null) { this.s.pend.push({ id, x }); }

  // ---- who and what you have ----

  partner() { return this.s.people.find((p) => p.kind === 'partner' || p.kind === 'spouse') || null; }
  friends() { return this.s.people.filter((p) => p.kind === 'friend'); }
  kids() { return this.s.people.filter((p) => p.kind === 'child'); }
  person(id) { return this.s.people.find((p) => p.id === id) || null; }
  hasDegree() { return Object.keys(this.s.edu).some((id) => COURSES[id].degree); }
  // A course counts if you hold it, or hold something that covers it.
  hasEdu(id) { return !!this.s.edu[id] || Object.keys(this.s.edu).some((k) => (COURSES[k].covers || []).includes(id)); }
  // Knowing the right people: someone close who works in that career.
  perk(c) { return this.s.people.some((p) => p.job === c && p.bond >= 60 && (p.kind === 'friend' || p.kind === 'partner' || p.kind === 'spouse' || p.kind === 'sibling' || ((p.kind === 'child' || p.kind === 'grandchild') && p.age >= 18))); }

  timeMax() { return this.timeMaxWithout(null); }
  timeMaxWithout(skip) {
    const s = this.s, has = (id) => s.items[id] && id !== skip;
    if (s.gaol) return this.gaolTime();
    let t = FIRST_TIME + (has('car') || has('sportscar') ? 2 : has('bike') ? 1 : 0);
    if (this.kids().some((k) => k.age < 6)) t -= 1;
    if (s.age >= 85) t -= 2; else if (s.age >= 75) t -= 1;
    if (s.job && CAREERS[s.job.c].summer && this.season === 1) t += 1;
    if (s.ill && s.ill.sev >= 2) t -= 1;
    return Math.max(3, t);
  }

  savingsRate() { return SAVINGS_RATE + (this.s.heir === 'tycoon' ? 0.004 : 0) + (this.perk('finance') ? 0.002 : 0); }
  // For five years after going bankrupt the bank will not lend.
  blacklisted() { return this.s.f.bustAt != null && this.s.t - this.s.f.bustAt < 20; }
  sharesWorth() { const k = this.s.stk; return Object.keys(k.own).reduce((a, sym) => a + k.own[sym] * k.p[sym], 0); }
  dividends() { const k = this.s.stk; return Math.floor(Object.keys(k.own).reduce((a, sym) => a + k.own[sym] * k.p[sym] * STOCKS[sym].div, 0)); }
  netWorth() { const s = this.s; return Math.round(s.cash + s.bank - s.debt - s.sloan - s.shark + this.sharesWorth() + this.estateWorth() + this.bizWorth() + this.curiosWorth()); }
  creditLimit() {
    const s = this.s, pay = s.job ? CAREERS[s.job.c].rungs[s.job.r].pay : s.pension;
    return Math.round(2000 + 12 * pay + 0.8 * this.estateWorth() + 0.5 * this.sharesWorth());
  }
  // What goes out at the end of every season: [what, how much].
  bills(jailed = !!this.s.gaol) {
    const s = this.s, h = HOMES[s.home], out = [], pt = this.partner(), home = this.homeEntry();
    const share = pt && pt.live ? 0.65 : 1;
    if (home) out.push(['Upkeep on your home', Math.round(this.propValue(home) * 0.003)]);
    else if (!jailed) out.push(['Rent', Math.round(this.rentOf(s.home) * share)]);
    const empty = s.estate.filter((e) => !e.let && e !== home).reduce((a, e) => a + this.propValue(e) * 0.003, 0);
    if (empty) out.push(['Upkeep on empty property', Math.round(empty)]);
    if (!jailed) {
      const food = 700 + 150 * h.tier + FOOD[s.food].cost - (this.perk('kitchen') ? 150 : 0) - (home && home.ups.solar ? UPGRADES.solar.bills : 0);
      out.push(['Food and bills', Math.round(Math.max(200, food) * share)]);
    }
    const young = this.kids().filter((k) => k.age < 18), priv = young.filter((k) => k.priv).length;
    if (young.length) out.push([young.length > 1 ? `Raising ${young.length} children` : 'Raising a child', 1200 * young.length]);
    if (priv) out.push(['School fees', 2500 * priv]);
    if (s.pet) out.push([`${s.pet.name}'s food and vet`, 200]);
    if (s.plot) out.push(['Allotment rent', PLOT_RENT]);
    if (s.items.sportscar) out.push(['Running the sports car', 1200]);
    else if (s.items.car) out.push(['Running the car', 300]);
    for (const id of Object.keys(INSURANCE)) if (s.ins[id]) out.push([INSURANCE[id].name, INSURANCE[id].cost]);
    if (s.debt > 0) out.push(['Loan interest', Math.round(s.debt * LOAN_RATE)]);
    return out;
  }
  // What comes in each season without lifting a finger: [what, how much].
  income() {
    const s = this.s, out = [];
    if (s.pension) out.push(['Pension', s.pension]);
    const rents = this.letIncome(), divs = this.dividends(), biz = this.bizIdle(), roy = this.royalties();
    if (rents) out.push(['Rent from your properties', rents]);
    if (divs) out.push(['Dividends', divs]);
    if (roy) out.push(['Royalties', roy]);
    if (s.gave.pier) out.push(['The pier company’s board', 6000]);
    if (biz) out.push([`Takings from your ${this.bizName().toLowerCase()}`, biz]);
    return out;
  }

  // ---- work ----

  jobTitle() { const j = this.s.job; return j ? CAREERS[j.c].rungs[j.r].title : ''; }
  // The best grade you hold in any course that belongs to a career.
  gradeFor(c) {
    const car = CAREERS[c], ids = new Set([...Object.keys(car.entry || {}), ...car.rungs.map((r) => r.need.edu).filter(Boolean)]);
    return Math.max(0, ...[...ids].map((id) => (this.s.edu[id] ? this.s.edu[id].g : 0)));
  }
  shiftPay() {
    const s = this.s, j = s.job, c = CAREERS[j.c];
    let pay = c.rungs[j.r].pay * (1 + (j.raise || 0)) * (1 + 0.04 * this.gradeFor(j.c));
    if (c.fame) pay *= 1 + s.fame / 200;
    if (s.happy < 20) pay *= 0.85;
    return Math.round(pay / 10) * 10;
  }
  raiseOdds() { const s = this.s; return clamp(0.1 + s.job.perf / 140 + s.st.charm / 300 + 0.04 * s.eco + this.luck(), 0.05, 0.9); }
  standing() { const p = this.s.job.perf; return p >= 80 ? 'The boss’s favourite' : p >= 60 ? 'Well thought of' : p >= 40 ? 'Doing fine' : p >= 20 ? 'On thin ice' : 'One foot out of the door'; }
  pensionFor() { return Math.round(CAREERS[this.s.job.c].rungs[this.s.job.r].pay * 1.2 / 10) * 10; }
  // What something asks for, as a checklist: [{ text, ok }].
  needs(need = {}) {
    const s = this.s, out = [];
    for (const k of STATS) if (need[k]) out.push({ text: `${STAT_NAME[k]} ${need[k]}`, ok: s.st[k] >= need[k] });
    if (need.edu) out.push({ text: COURSES[need.edu].name, ok: this.hasEdu(need.edu) });
    if (need.degree) out.push({ text: 'Any degree', ok: this.hasDegree() });
    if (need.item) out.push({ text: `A ${ITEMS[need.item].name.toLowerCase()}`, ok: !!s.items[need.item] });
    if (need.karma) out.push({ text: 'A good name in town', ok: s.karma >= need.karma });
    if (need.fame) out.push({ text: `Fame ${need.fame}`, ok: s.fame >= need.fame });
    if (need.crimes) out.push({ text: `${need.crimes} crimes to your name (${Math.min(s.n.crimes, need.crimes)} so far)`, ok: s.n.crimes >= need.crimes });
    if (need.bad) out.push({ text: 'A bad name in town', ok: s.karma <= -need.bad });
    if (need.flag === 'elected') out.push({ text: 'Win the election for mayor', ok: !!s.f.elected });
    return out;
  }
  // Where you would start in a career: at the bottom, unless you have done
  // the job before, hold a qualification that lets you in higher up, or
  // know someone who will put in a word.
  startRung(c) {
    const s = this.s, car = CAREERS[c], fits = (i) => this.needs(car.rungs[i].need).every((n) => n.ok);
    let best = 0;
    for (let i = Math.min(s.worked[c] ?? 0, car.rungs.length - 1); i > 0; i--) if (fits(i)) { best = i; break; }
    for (const [q, r] of Object.entries(car.entry || {})) {
      if (!(q === 'degree' ? this.hasDegree() : this.hasEdu(q))) continue;
      for (let i = r; i > best; i--) if (fits(i)) { best = i; break; }
    }
    if (best === 0 && this.perk(c) && fits(1)) best = 1;
    return best;
  }
  // If a qualification you hold would get you in higher than you would
  // start, what is still missing for that rung.
  entryMiss(c) {
    const car = CAREERS[c], start = this.startRung(c);
    let top = 0;
    for (const [q, r] of Object.entries(car.entry || {})) if (q === 'degree' ? this.hasDegree() : this.hasEdu(q)) top = Math.max(top, r);
    if (top <= start) return null;
    const miss = this.needs(car.rungs[top].need).find((n) => !n.ok);
    return miss ? `${car.rungs[top].title} also needs ${miss.text}` : null;
  }
  applyWhy(c) {
    const s = this.s, car = CAREERS[c];
    if (!car) return 'No such job.';
    if (s.job && s.job.c === c) return 'This is your job.';
    if (car.clean && s.record) return 'Not with your record.';
    if (car.retire && s.age >= car.retire) return `They want people under ${car.retire}.`;
    if (this.startRung(c) > 0) return null;
    const miss = this.needs(car.rungs[0].need).find((n) => !n.ok);
    return miss ? `Needs ${miss.text}.` : null;
  }
  // The next step up, and what it still needs.
  nextRung() {
    const j = this.s.job;
    if (!j) return null;
    const c = CAREERS[j.c], r = c.rungs[j.r + 1];
    if (!r) return null;
    const want = SHIFTS_FOR_RUNG[j.r + 1];
    const list = [{ text: `${want} shifts as ${c.rungs[j.r].title} (${Math.min(Math.floor(j.n), want)} done)`, ok: j.n >= want }, ...this.needs(r.need)];
    return { title: r.title, pay: r.pay, list, ready: list.every((n) => n.ok) };
  }
  // e: how hard you work (see EFFORT).
  work(e) {
    const s = this.s, j = s.job, c = CAREERS[j.c];
    let pay = this.shiftPay();
    if (c.swing) pay = Math.round(pay * (1 + (this.rnd() * 2 - 1) * c.swing) / 10) * 10;
    // A tenth of every pay packet goes to a student loan until it's gone.
    const loan = Math.min(s.sloan, Math.round(pay * 0.1));
    s.sloan -= loan;
    this.cash(pay - loan);
    s.n.shifts++; s.n.earned += pay; j.n += e.n;
    j.perf = clamp(j.perf + e.perf + (s.happy >= 60 ? 1 : s.happy < 25 ? -2 : 0), 0, 100);
    s.stand[j.c] = j.perf;
    this.gain(c.stats[0], 0.9 * e.n);
    this.gain(c.stats[1], 0.45 * e.n);
    this.joy(-c.stress * 0.75 * e.stress);
    if (e.hp) this.hp(e.hp, 'overwork');
    if (c.fame && j.r >= 2) this.fame(0.35 * (j.r - 1));
    const how = e.n > 1 ? ['First in, last out.', 'You do the work of two.', 'The boss notices. Good.'] : e.n < 1 ? ['You look busy. It is an art.', 'A long lunch and a short afternoon.', 'You get away with it.'] : ['A solid shift.', 'Busy, but it flies by.', 'A long one.', 'You earn every penny.', 'Nothing goes wrong, which is rare.'];
    let text = `${this.pick(how)} ${money(pay)}${loan ? ` (${money(loan)} of it to your student loan)` : ''}.`;
    s.use.work = (s.use.work || 0) + 1;
    if (s.use.work > 3) { this.hp(-3, 'overwork'); this.joy(-2); text += ' You are running on fumes.'; }
    if (c.shady && this.crime(0.02, 2, 'one of Sal\u2019s little jobs', 2)) text += ' And then, round the corner, a constable.';
    const up = this.nextRung();
    if (up && up.ready) {
      j.r++; j.n = 0; j.raise = 0;
      s.worked[j.c] = Math.max(s.worked[j.c] ?? 0, j.r);
      s.f.promoted = 1;
      this.joy(8);
      if (j.r === c.rungs.length - 1) s.f.top = 1;
      if (j.c === 'crew' && j.r === c.rungs.length - 1) s.f.kingpin = 1;
      if (j.c === 'medicine' && j.r >= 4) s.f.wasDoctor = 1;
      if (j.c === 'sea' && j.r >= 4) s.f.wasCaptain = 1;
      if (j.c === 'politics' && j.r >= 4) s.f.wasMayor = 1;
      this.note(`Promoted to ${up.title}.`, 'big');
      this.say('📈', `Promoted to ${up.title}!`, 'promo');
      text += ` And then the boss calls you in: you are promoted to ${up.title}! ${money(this.shiftPay())} a shift from now on.`;
    }
    return text;
  }

  // ---- study ----

  // The skill a course leans on.
  courseStat(id) { return { finearts: 'craft', musicdip: 'craft', culinary: 'craft', trade: 'craft', sportsdip: 'fitness', academy: 'fitness' }[id] || 'smarts'; }
  // What one class adds to your running mark: 50 if you only just got in.
  // (roll: with the luck of the day, or without it, for looking ahead.)
  classMark(id, roll = true) { const k = this.courseStat(id); return clamp(50 + (this.s.st[k] - (COURSES[id].need[k] || 15)) * 0.9 + (roll ? this.int(-6, 6) : 0), 0, 100); }
  // The mark you are heading for in the exam.
  examMark() {
    const k = this.s.course;
    return (k.p ? k.mark / k.p : this.classMark(k.id, false)) + k.rev * 5;
  }
  gradeWord(mark) { return mark >= 72 ? 'a distinction' : mark >= 58 ? 'a merit' : mark >= 44 ? 'a pass' : 'a narrow pass, or worse'; }

  // ---- odds ----

  luck() { return this.s.heir === 'gambler' ? 0.07 : 0; }
  checkOdds(stat, dc) { return clamp(0.5 + (this.s.st[stat] - dc) / 60 + this.luck(), 0.05, 0.95); }
  mayorOdds() { const s = this.s; return clamp(0.25 + (s.st.charm - 60) / 100 + s.karma / 200 + s.fame / 300 + this.luck(), 0.1, 0.9); }
  pitchOdds() { const s = this.s; return clamp(0.15 + (s.st.smarts - 60) / 100 + s.st.charm / 400 + this.luck(), 0.1, 0.6); }
  hiloOdds(dir) { const h = this.s.hilo; return h ? (dir === 'hi' ? 13 - h.card : h.card - 1) / 13 : 0; }

  // ---- prices ----

  classFee(id) { return Math.round(COURSES[id].cost / COURSES[id].classes * (this.perk('teaching') ? 0.8 : 1) * (this.s.gifts.scholarship ? 0.75 : 1)); }
  itemPrice(id) { return Math.round(ITEMS[id].price * (this.perk('retail') ? 0.85 : 1)); }
  tripCost(id) { return Math.round(TRIPS[id].cost * (this.s.heir === 'globe' ? 0.5 : 1)); }
  medCost(n) { return Math.round(n * (this.s.heir === 'healer' ? 0.5 : 1) * (this.s.ins.health ? 0.4 : 1) * (this.perk('medicine') ? 0.7 : 1) * (this.s.gifts.wing ? 0.5 : 1)); }
  medBoost() { return this.s.heir === 'healer' ? 1.5 : 1; }
  artPrice() { const s = this.s; return Math.round((40 + s.st.craft ** 2 * 0.6) * (1 + s.fame / 50) * (s.heir === 'artist' ? 1.5 : 1) * (s.edu.finearts ? 1.3 : 1)); }

  // Losing a rented home: back to the hostel, or somewhere small if there are children.
  downAndOut() {
    const s = this.s;
    s.owned = false; s.homeAt = null;
    if (this.kids().some((c) => c.age < 18)) { if (HOMES[s.home].tier > HOMES.flat.tier) s.home = 'flat'; return; }
    s.home = 'hostel';
    for (const p of s.people) if (p.kind === 'partner' || p.kind === 'spouse') p.live = false;
    if (s.pet) { this.note(`${s.pet.name} went to live with a neighbour.`); s.pet = null; }
  }
  sicken(name, sev) { if (!this.s.ill || this.s.ill.sev < sev) this.s.ill = { name, sev }; }

  // ---- doing things ----

  // An action about a person is given their id (or { p: id, ... }); its
  // functions are handed the person first, then what was passed.
  aim(a, x) {
    if (!a.who) return [x, x];
    const y = typeof x === 'number' ? { p: x } : x || {};
    return [y.p && typeof y.p === 'object' ? y.p : this.person(y.p), y];
  }
  whyNot(a, x) {
    const s = this.s, [p, y] = this.aim(a, x);
    if (s.dead) return 'Your story has ended.';
    if (!!s.gaol !== !!a.gaol) return s.gaol ? 'Not from a cell in Starling Gaol.' : 'Not just now.';
    if (a.who && !p) return 'They are not around.';
    if (a.show && !a.show(this, p, y)) return 'Not just now.';
    if (a.per && (s.use[a.id] || 0) >= a.per) return a.per === 1 ? 'Once a season.' : 'That is enough for this season.';
    const w = a.why && a.why(this, p, y);
    if (w) return w;
    if (s.time < val(a.time, this, p, y)) return 'Not enough time left this season.';
    // (What cash on you doesn't cover comes out of savings.)
    const cost = val(a.cost, this, p, y);
    if (s.cash + s.bank < cost) return `You need ${money(cost)}.`;
    return null;
  }
  view(a, x) {
    const [p, y] = this.aim(a, x);
    return {
      id: a.id, x: a.who ? { ...y, p: p.id } : x, icon: val(a.icon, this, p, y), sec: val(a.sec, this, p, y), open: a.open || null,
      title: val(a.title, this, p, y), desc: val(a.desc, this, p, y) || '',
      time: val(a.time, this, p, y), cost: val(a.cost, this, p, y), why: this.whyNot(a, x),
    };
  }
  // What can be done at a place on the map.
  placeActions(place) {
    const out = [];
    if (place === 'gaol' && !this.s.gaol) return out;
    for (const a of Object.values(A)) {
      if (!a.place || val(a.place, this) !== place) continue;
      if (a.show && !a.show(this)) continue;
      out.push(this.view(a));
    }
    out.sort((p, q) => (q.id === 'work') - (p.id === 'work'));
    for (const [id, it] of Object.entries(ITEMS)) {
      if (it.at !== place) continue;
      const v = this.view(A.buy, id);
      out.push(Object.assign(v, { icon: it.icon, title: it.name, desc: it.blurb, sec: it.sec, owned: !!this.s.items[id] }));
    }
    if (place === 'station') {
      for (const [id, t] of Object.entries(TRIPS)) {
        const v = this.view(A.trip, id);
        out.push(Object.assign(v, { icon: t.icon, title: t.name, desc: `${this.s.trips[id] ? 'Been before. ' : ''}A real lift${t.stat ? `, and some ${STAT_NAME[t.stat]}` : ''}.`, sec: 'Holidays' }));
      }
    }
    if (place === 'home') out.push(...this.homeWorks());
    // Keep each section's rows together, in the order the sections first appear.
    const secs = [...new Set(out.map((a) => a.sec))];
    out.sort((p, q) => secs.indexOf(p.sec) - secs.indexOf(q.sec));
    return out;
  }
  can(id, x) { return A[id] ? this.whyNot(A[id], x) : 'Nothing happens.'; }
  // One action, as a row to show.
  look(id, x) { return this.view(A[id], x); }

  // Does something. Returns { ok, text, changes, news, out } or { ok: false, why }.
  act(id, x) {
    const s = this.s, a = A[id];
    if (!a || a.open) return { ok: false, why: 'Nothing happens.' };
    const why = this.whyNot(a, x);
    if (why) return { ok: false, why };
    const [p, y] = this.aim(a, x);
    const before = this.snap();
    this.out = null;
    s.time -= val(a.time, this, p, y);
    if (!a.selfPay) this.cash(-val(a.cost, this, p, y));
    if (a.per) s.use[id] = (s.use[id] || 0) + 1;
    const text = a.run(this, p, y) || '';
    this.after();
    return { ok: true, text, changes: this.diff(before), news: this.takeNews(), out: this.out };
  }

  snap() {
    const s = this.s;
    return { cash: s.cash + s.bank - s.debt - s.sloan - s.shark, health: s.health, happy: s.happy, ...s.st, fame: s.fame, karma: s.karma };
  }
  diff(b) {
    const a = this.snap(), out = [];
    for (const k of Object.keys(a)) {
      const d = a[k] - b[k];
      if (Math.abs(d) >= 0.05) out.push({ k, d });
    }
    return out;
  }
  takeNews() { const n = this.news; this.news = []; return n; }

  // Dreams, the to-do list and trophies: checked after anything changes.
  after() {
    const s = this.s;
    for (const id of s.dreams) {
      if (s.dreamDone[id] || !DREAMS[id].test(this)) continue;
      s.dreamDone[id] = s.age;
      this.joy(15);
      this.note(`A dream came true: ${DREAMS[id].name.toLowerCase()}.`, 'big');
      this.say(DREAMS[id].icon, `Dream come true: ${DREAMS[id].name}`, 'dream');
    }
    while (s.quest < QUESTS.length && QUESTS[s.quest].test(this)) {
      const q = QUESTS[s.quest++];
      s.cash += q.cash;
      this.say('✅', `Done! ${money(q.cash)} to help you along`, 'quest');
    }
    for (const [id, t] of Object.entries(TROPHIES)) {
      if (s.ach[id] || !t.test(this)) continue;
      s.ach[id] = 1;
      this.say(t.icon, `Trophy: ${t.name}`, 'trophy');
    }
    if (!s.dead && s.health <= 0) this.die(s.hurt || 'ill health');
  }

  // ---- events ----

  // The card waiting to be answered, if there is one.
  event() {
    const s = this.s;
    // Drop any card that no longer makes sense: its person has gone, or
    // an earlier card changed what it was about.
    // A card for prison is no use outside it, nor the other way about.
    const stale = ({ id, x }) => { const e = EVENT[id]; return !e || (e.gaol && !s.gaol) || ((e.w || e.free) && !e.gaol && s.gaol) || (e.ok && !e.ok(this, x)) || (e.w && e.when && !e.when(this)); };
    while (s.pend.length && stale(s.pend[0])) s.pend.shift();
    if (!s.pend.length || s.dead) return null;
    const { id, x } = s.pend[0], e = EVENT[id];
    return {
      id, icon: val(e.icon, this, x), title: val(e.title, this, x), text: val(s.gaol && e.inText ? e.inText : e.text, this, x),
      opts: e.opts.filter((o) => !o.show || o.show(this, x)).map((o) => ({
        t: val(o.t, this, x),
        cost: val(o.cost, this, x) || 0,
        chance: o.check ? this.checkOdds(o.check[0], o.check[1]) : o.odds ? clamp(o.odds(this, x) + this.luck(), 0.02, 0.98) : null,
        stat: o.check ? o.check[0] : null,
        why: (o.cost && s.cash + s.bank < val(o.cost, this, x) ? `You need ${money(val(o.cost, this, x))}.` : null) || (o.why ? o.why(this, x) : null),
      })),
    };
  }
  choose(i) {
    const s = this.s, v = this.event();
    if (!v) return { ok: false, why: 'Nothing to decide.' };
    const { id, x } = s.pend[0], e = EVENT[id];
    const o = e.opts.filter((q) => !q.show || q.show(this, x))[i];
    if (!o || v.opts[i].why) return { ok: false, why: (o && v.opts[i].why) || 'Pick one.' };
    const before = this.snap();
    s.pend.shift();
    if (v.opts[i].cost) this.cash(-v.opts[i].cost);
    const win = v.opts[i].chance == null ? true : this.chance(v.opts[i].chance);
    const text = o.run ? o.run(this, x, win) || '' : '';
    if (e.log !== false && text && !s.dead) this.note(`${v.title}: ${text}`);
    this.after();
    return { ok: true, text, win: v.opts[i].chance == null ? null : win, changes: this.diff(before), news: this.takeNews() };
  }
  drawEvent() {
    const s = this.s, pool = [];
    let total = 0;
    for (const e of EVENTS) {
      if (!e.w) continue;
      if (e.once && s.seen[e.id]) continue;
      if (s.cd[e.id] != null && s.t - s.cd[e.id] < (e.cd ?? 24)) continue;
      if (!!e.gaol !== !!s.gaol) continue;
      if (e.when && !e.when(this)) continue;
      pool.push(e); total += e.w;
    }
    if (!pool.length) return;
    let r = this.rnd() * total, e = pool[0];
    for (const q of pool) { e = q; r -= q.w; if (r < 0) break; }
    const x = e.ctx ? e.ctx(this) : null;
    if (e.ctx && x == null) return;
    s.cd[e.id] = s.t; s.seen[e.id] = 1;
    this.queue(e.id, x);
  }

  // ---- the turn of the season ----

  // Returns { lines: what came in and went out, birthday, changes, news }.
  endSeason() {
    const s = this.s;
    if (s.dead) return null;
    const before = this.snap(), lines = [], jailed = !!s.gaol;
    if (s.hilo) { this.cash(s.hilo.pot); s.n.casino += s.hilo.pot - s.hilo.bet; s.hilo = null; }
    this.pierSeason();
    // Time left over is rest.
    if (!jailed && s.time > 0) { const r = Math.min(s.time, 4); this.hp(r); this.joy(r); }

    // Money in, money out.
    const interest = Math.floor(s.bank * this.savingsRate());
    s.bank += interest;
    if (interest) lines.push(['Savings interest', interest]);
    for (const [what, n] of this.income()) { s.cash += n; lines.push([what, n]); }
    if (s.sloan > 0) s.sloan = Math.round(s.sloan * (1 + STUDENT_RATE));
    let out = 0;
    for (const [what, n] of this.bills(jailed)) { out += n; lines.push([what, -n]); }
    const owed = s.debt;
    this.cash(-out);
    if (s.debt > owed) lines.push(['Short! Put on your overdraft', 0]);
    if (s.debt > this.creditLimit() * 1.1 + 1000) this.bailiffs();
    this.bizSeason();
    this.viceSeason();
    this.fameSeason();
    this.feudSeason();

    // How you stand at work: a good name earns a bonus, a bad one the sack.
    const j = s.job;
    if (j && !jailed) {
      if (j.perf >= 80 && this.chance(0.25 + 0.06 * s.eco)) { const n = this.shiftPay(); s.cash += n; lines.push(['A bonus for good work', n]); }
      if (j.perf < 12) this.queue('sacked');
      // In a slump the ones who have not shone are the first to go.
      else if (s.eco < 0 && j.perf < 50 && !CAREERS[j.c].shady && this.chance(-0.035 * s.eco)) this.queue('laidOff');
      j.perf += j.perf > 50 ? -1 : j.perf < 50 ? 1 : 0;
      s.stand[j.c] = j.perf;
    }

    // Mood drifts towards how life is going; the body does what bodies do.
    s.happy += (this.moodBase() - s.happy) * 0.25;
    let d = s.age < 40 ? 1 : s.age < 55 ? 0 : s.age < 70 ? -1 : s.age < 80 ? -2 : -3;
    d += s.st.fitness >= 75 ? 1.5 : s.st.fitness >= 45 ? 0.75 : 0;
    d += FOOD[s.food].hp;
    if (s.happy < 20) d -= 2;
    if (s.home === 'hostel') d -= 0.5;
    this.hp(d, s.age >= 65 ? 'old age' : 'poor health');
    if (s.ill) {
      // Only the serious things can kill; the rest just wear you down.
      const hit = [0, 2, 4, 7][s.ill.sev];
      this.hp(s.ill.sev >= 3 ? -hit : -Math.max(0, Math.min(hit, s.health - 20)), s.ill.name);
      if (s.ill.sev <= 2 && this.chance(s.ill.sev === 1 ? 0.45 : 0.2)) { this.note(`Your ${s.ill.name} cleared up.`); s.ill = null; }
    }
    if (s.age >= 40 && !s.use.fit) this.lose('fitness', s.age >= 60 ? 0.8 : 0.4);
    if (s.fame > 0) this.fame(-Math.max(0.25, s.fame * 0.02));

    // Markets.
    this.moveMarkets();

    // People drift unless you keep in touch.
    const phone = s.items.phone ? 0.5 : 1;
    for (const p of s.people.slice()) {
      // A good school shows, a season at a time.
      if (p.kind === 'child' && p.priv) { p.st.smarts = Math.min(100, p.st.smarts + 0.4); p.st.charm = Math.min(100, p.st.charm + 0.15); }
      const drop = p.kind === 'friend' ? 2 * phone : p.kind === 'partner' ? (p.live ? 1 : 2) : ['parent', 'sibling', 'grandchild'].includes(p.kind) ? 0.5 : 1;
      this.bond(p, -drop);
      if (p.kind === 'friend' && p.bond <= 0) {
        s.people.splice(s.people.indexOf(p), 1);
        this.note(`Lost touch with ${p.name}.`);
      } else if (p.kind === 'partner' && p.bond < 15 && !p.eng) this.queue('dumped', p.id);
      else if (p.kind === 'spouse' && p.bond < 12) this.queue('divorce', p.id);
    }

    // The clock.
    s.t++;
    s.matches = null;
    const birthday = s.t % 4 === 0;
    if (birthday) this.newYear();
    if (s.due && s.t >= s.due.t && !jailed) {
      const adopt = !!s.due.adopt, sex = this.chance(0.5) ? 'm' : 'f', names = sex === 'm' ? NAMES_M : NAMES_F;
      s.due = null;
      const one = this.pick(names), two = this.pick(names.filter((n) => n !== one));
      if (this.partner() || adopt || s.sex === 'f') this.queue('baby', { names: [one, two], sex, adopt, age: adopt ? this.int(1, 6) : 0 });
    }
    const fiance = s.people.find((p) => p.eng && p.kind === 'partner');
    if (fiance && !jailed) this.queue('wedding', fiance.id);

    if (!s.dead) {
      this.townSeason();
      this.legacySeason();
      if (s.gaol) this.gaolSeason(); else this.lamSeason();
    }
    if (!s.dead && jailed === !!s.gaol) {
      if (this.chance(0.62)) this.drawEvent();
      if (!jailed && this.chance(0.08)) this.drawEvent();
    }
    s.use = {};
    s.date = null;
    s.time = this.timeMax();
    this.after();
    if (s.dead) s.pend = [];
    return { lines, birthday, changes: this.diff(before), news: this.takeNews() };
  }

  // A birthday: everyone is a year older.
  newYear() {
    const s = this.s;
    s.age++;
    s.hist.push(this.netWorth());
    if (s.hist.length > 100) s.hist.shift();
    if (s.age <= 22 && s.people.some((p) => p.kind === 'parent')) { s.cash += 200; this.note('A birthday card from home, with $200 in it.'); }
    // Good deeds and bad are forgotten, slowly.
    s.karma -= Math.sign(s.karma) * Math.min(1, Math.abs(s.karma));
    this.ecoYear();
    if (s.age === 67) { s.pension += 1500; this.note('The state pension begins: $1,500 a season.'); }
    for (const p of s.people.slice()) {
      p.age++;
      if (p.kind === 'parent' && p.age >= 68 && this.chance((p.age - 66) ** 2 / 1500)) this.queue('parentDies', p.id);
      else if ((p.kind === 'spouse' || p.kind === 'partner') && p.age >= 72 && this.chance((p.age - 70) ** 2 / 2200)) this.queue('spouseDies', p.id);
      else if (p.kind === 'child') this.growUp(p);
      else if (p.kind === 'sibling' || p.kind === 'grandchild') this.kinYear(p);
      // Friends pair off, and come unstuck, without consulting you.
      else if (p.kind === 'friend' && this.chance(0.08)) p.single = !p.single;
    }
    if (s.pet) {
      s.pet.age++;
      if (s.pet.age > PETS[s.pet.kind].life + this.int(-2, 2)) this.queue('petDies');
    }
    const c = s.job && CAREERS[s.job.c];
    if (c && c.retire && s.age >= c.retire && s.job.r >= 2) this.queue('sportsRetire');
    if (s.age === 30 || s.age === 50 || s.age === 100) this.queue(`birthday${s.age}`);
    // Old age.
    if (s.age >= 70) {
      const p = (s.age - 68) ** 2 / 1800 * (1.35 - s.health / 100) * (s.heir === 'evergreen' ? 0.6 : 1);
      if (s.age >= 112 || this.chance(p)) this.die('old age');
    }
  }

  moodBase() {
    const s = this.s, pt = this.partner();
    // Inside, there is not much to be cheerful about but your standing.
    if (s.gaol) return clamp(24 + s.gaol.rep / 6 + (s.gaol.good >= 60 ? 4 : 0) + (pt ? pt.bond / 20 : 0), 10, 55);
    let b = 44 + this.comfort() + FOOD[s.food].mood - this.feudGloom();
    b += Math.min(6, this.friends().filter((p) => p.bond >= 40).length * 2);
    if (pt) b += Math.min(10, pt.bond / 8);
    b += Math.min(6, this.kids().length * 2) + Math.min(3, this.grandkids().length);
    if (s.pet) b += 4;
    if (s.items.sportscar) b += 3;
    if (s.heir === 'heart') b += 6;
    if (s.retired) b += 4;
    if (s.karma >= 30) b += 3;
    if (s.karma <= -30) b -= 3;
    if (s.debt > 3000 && s.debt > this.creditLimit() * 0.6) b -= 8;
    if (s.health < 40) b -= 8;
    if (s.ill) b -= 4;
    if (!s.job && !s.retired && !s.biz && s.age < 65 && s.cash + s.bank < 2000) b -= 6;
    return clamp(b, 10, 95);
  }

  // Share prices: the whole market moves together a little, each company
  // moves on its own a lot, and now and then one makes the news.
  moveMarkets() {
    const s = this.s, k = s.stk;
    let m = 0.004 + 0.003 * s.eco + 0.03 * this.gauss();
    const r = this.rnd();
    if (r < 0.02) { m = -0.22; this.note('The stock market crashed.'); this.say('📉', 'The stock market has crashed', 'bad'); k.news.unshift({ t: s.t, up: false, text: 'Panic on the exchange: everything is down' }); }
    else if (r < 0.04) { m = 0.18; this.note('The stock market boomed.'); this.say('📈', 'The stock market is booming', 'good'); k.news.unshift({ t: s.t, up: true, text: 'Boom! Everything is up' }); }
    const hot = this.chance(0.16) ? this.pick(Object.keys(STOCKS).filter((sym) => !STOCKS[sym].fund)) : null;
    for (const [sym, st] of Object.entries(STOCKS)) {
      let p = k.p[sym] * Math.exp(st.drift + m + st.swing * this.gauss());
      if (sym === 'MOON') { const j = this.rnd(); if (j < 0.03) p *= 2.5; else if (j < 0.06) p *= 0.4; }
      if (sym === hot) {
        const up = this.chance(0.5), by = 0.1 + this.rnd() * 0.18;
        p *= up ? 1 + by : 1 - by;
        k.news.unshift({ t: s.t, sym, up, text: `${st.name} ${this.pick(HEADLINES[up ? 'up' : 'down'])}` });
      }
      k.p[sym] = Math.max(0.5, Math.round(p * 100) / 100);
      k.h[sym].push(k.p[sym]);
      if (k.h[sym].length > 41) k.h[sym].shift();
    }
    k.news.length = Math.min(k.news.length, 6);
    s.idx *= Math.exp(0.005 + 0.003 * s.eco + 0.015 * this.gauss());
  }

  // More owed than the bank will stand: things get sold.
  bailiffs() {
    const s = this.s, k = s.stk, sold = [];
    const settle = () => {
      s.cash += s.bank; s.bank = 0;
      const n = Math.min(s.cash, s.debt);
      s.cash -= n; s.debt -= n;
      return s.debt <= this.creditLimit() * 1.1 + 1000;
    };
    if (settle()) { this.note('The bank took what you owed it straight out of your money.'); return; }
    const worth = this.sharesWorth();
    if (worth > 0) { s.cash += Math.floor(worth); k.own = {}; k.paid = {}; sold.push('your shares'); }
    for (const e of s.estate.filter((q) => q.id !== s.homeAt)) {
      if (settle()) break;
      s.cash += Math.round(this.propValue(e) * 0.9);
      s.estate.splice(s.estate.indexOf(e), 1);
      sold.push(`the ${this.propSaid(e)}`);
    }
    if (!settle() && s.biz) { s.cash += Math.round(this.bizWorth() * 0.8); sold.push(`your ${this.bizName().toLowerCase()}`); s.biz = null; }
    for (const id of ['boat', 'sportscar', 'watch', 'car', 'piano']) {
      if (settle()) break;
      if (s.items[id]) { s.cash += Math.round(ITEMS[id].price * 0.5); delete s.items[id]; sold.push(`the ${ITEMS[id].name.toLowerCase()}`); }
    }
    const home = this.homeEntry();
    if (!settle() && home) {
      s.cash += Math.round(this.propValue(home) * 0.9);
      s.estate.splice(s.estate.indexOf(home), 1);
      s.owned = false; s.homeAt = null; s.home = this.kids().some((c) => c.age < 18) ? 'flat' : 'bedsit';
      sold.push('your home');
    }
    if (!settle()) {
      // (Broke again within a few years of going bankrupt: the same, more quietly.)
      const again = this.blacklisted();
      s.debt = 0; s.cash = 0; s.f.bust = 1; s.f.bustAt = s.t; this.karma(again ? -1 : -5); this.joy(again ? -8 : -20);
      if (!s.owned) this.downAndOut();
      if (again) this.note('Could not pay the bills again. What you owed was written off.');
      else {
        this.note('Declared bankrupt. The debts are wiped, and so is nearly everything else.', 'big');
        this.queue('bust', sold.join(', '));
      }
    } else {
      this.joy(-10);
      this.note(`The bank called in its loan and sold ${sold.join(', ')}.`, 'big');
      this.queue('bailiffs', sold.join(', '));
    }
  }

  // ---- the end ----

  die(cause) {
    const s = this.s;
    if (s.dead) return;
    s.dead = { age: s.age, cause };
    s.pend = []; s.hilo = null; s.bj = null;
    this.note(`Died at ${s.age}, of ${cause}.`, 'big');
    for (const [id, t] of Object.entries(TROPHIES)) if (!s.ach[id] && t.test(this)) s.ach[id] = 1;
  }
  // The life, summed up.
  obituary() {
    const s = this.s, worth = this.netWorth();
    const ribbon = RIBBONS.find((r) => r.test(this));
    const kids = this.kids(), heirKid = kids.slice().sort((a, b) => b.bond - a.bond)[0] || null;
    const spouse = s.people.find((p) => p.kind === 'spouse');
    const score = Math.round(
      60 * Math.log10(Math.max(1000, worth) / 1000) + STATS.reduce((a, k) => a + s.st[k], 0) * 0.5
      + Object.keys(s.dreamDone).length * 80 + Object.keys(s.ach).length * 10
      + Math.min(80, s.people.reduce((a, p) => a + p.bond, 0) / 10) + s.age + Math.max(0, s.karma) * 0.5 + s.fame,
    );
    return {
      name: s.name, age: s.age, cause: s.dead ? s.dead.cause : '', gen: s.gen, worth, score, ribbon,
      title: s.job ? this.jobTitle() : s.biz ? `Ran a ${this.bizName().toLowerCase()}` : s.retired ? 'Retired' : '',
      dreams: s.dreams.map((id) => ({ id, done: !!s.dreamDone[id] })),
      trophies: Object.keys(s.ach).length,
      kids: kids.length, spouse: spouse ? spouse.name : null,
      inherit: Math.max(0, Math.min(kids.length ? 150000 : 60000, Math.round(worth * (kids.length ? 0.1 : 0.05) / 100) * 100)),
      heir: heirKid ? { name: heirKid.name.split(' ')[0], look: heirKid.look, sex: heirKid.sex, st: heirKid.st } : null,
      // An heir's brothers and sisters are the other children, if they are old enough to be out in the world.
      sibs: heirKid ? kids.filter((k) => k !== heirKid && k.age >= 16).slice(0, 3).map((k) => ({ name: k.name.split(' ')[0], sex: k.sex, age: k.age, look: k.look, job: k.job, trait: k.trait })) : null,
      parent: spouse ? { name: spouse.name, age: spouse.age, look: spouse.look, sex: spouse.sex } : null,
      gifts: s.gifts,
    };
  }
}

install({ def, A, Life, clamp });
installVice({ def, A, Life, clamp });
for (const add of [installInside, installFeuds, installPier, installFame, installTown, installLegacy, installKin]) add({ def, A, Life, clamp });

export { A as ACTIONS, money, cashShort };
