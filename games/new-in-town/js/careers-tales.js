// New in Town: the stories of seven careers (the other seven are in
// careers-tales2.js; how they are told is in careers.js).
//
// Each career has a party and a gift for the send-off, and five or six
// chapters. A chapter waits for a rung (r) and for seasons in the job (y, or
// the usual in careers.js), and is a card: text(L, k) and opts, as in
// events.js, where k is what the chapter knows: k.M the mentor and k.R the
// rival (name, first, last, he, his, him, He, His, v: how they feel about you,
// here: still in your life, dead), k.f the story's own notes, k.title your job,
// k.top at the top of the ladder, k.next the rung above.

export function tales({ perf, credit, bonus, busy, mentor, rival, sack, up, gaz, trait, T, money }) {
  const EVER = 4000;
  // Sister or Charge Nurse, as the case may be.
  const sister = (M) => (M.sex === 'f' ? 'Sister' : 'Charge Nurse');

  return {
    // ---- the kitchen at the Gull & Anchor: a critic, a rival's restaurant, and whose book it is ----
    kitchen: {
      party: 'The kitchen at the Gull & Anchor cooks for you, for once: the crab, the stew, and a cake in the shape of a fish kettle.',
      gift: 'a copper pan with your name stamped in the handle',
      ch: [
        {
          r: 0, icon: '🍳', title: 'The pass',
          text: (L, k) => `The kitchen at the Gull & Anchor runs on shouting and on Chef ${k.M.last}, who has cooked there for twenty years. Tonight ${k.R.name}, who started the same week as you, has split the hollandaise five minutes before forty covers.`,
          opts: [
            { t: (L, k) => `Whisk ${k.R.him} a new one, quietly`, check: ['craft', 30], run(L, k, win) { mentor(L, k, 4); if (win) { rival(L, k, 20); return `Yours holds. ${k.R.first} takes it to the pass without a word, and buys you a pint after service. Chef ${k.M.last} saw, and says nothing, which is the point.`; } rival(L, k, 12); perf(L, -2); return 'Yours splits too. You are both shouted at in front of the waiters, which turns out to be the start of a friendship.'; } },
            { t: 'Tell Chef before it goes out', run(L, k) { mentor(L, k, 8); rival(L, k, -25); perf(L, 3); return `Chef ${k.M.last} sends it back to the sink without looking up, and nods at you. ${k.R.first} does not forget who said.`; } },
            { t: 'Keep your head down and plate your own', run(L, k) { mentor(L, k, 2); rival(L, k, -5); perf(L, 1); return `${k.R.first} gets the shouting. Your plates go out hot. Nobody thanks anybody.`; } },
          ],
        },
        {
          r: 1, icon: '🐟', title: 'The walk-in',
          text: (L, k) => `The walk-in fridge died in the night. By morning the day’s fish has sat for six hours as warm as a bath. Chef ${k.M.last} sniffs a sea bass, shrugs, and says it is going in the stew. “Nobody will know.”`,
          opts: [
            { t: 'Put it all in the bin', run(L, k) { mentor(L, k, -8); perf(L, -3); L.karma(2); return `Four hundred dollars of fish into the bins behind the Gull. Chef ${k.M.last} does not speak to you for a week. Nobody is ill.`; } },
            {
              t: 'Do as Chef says', odds: () => 0.7,
              run(L, k, win) {
                L.karma(-2);
                if (win) { mentor(L, k, 5); return `Nobody is ill. Chef ${k.M.last} claps you on the back and calls you a proper cook, which feels worse than it should.`; }
                mentor(L, k, -6); k.f.fish = 1;
                sack(L, k, `Sacked as ${k.title}, after the business with the fish.`, { bar: 6, why: 'The landlord of the Gull has not forgotten the fish' });
                return `By midnight table four is very ill, and so is table seven. The inspector shuts the kitchen for a week, and Chef ${k.M.last} tells the landlord whose hands were on the fish. You are out.`;
              },
            },
            { t: 'Ring the inspector yourself', run(L, k) { mentor(L, k, -20); perf(L, -4); L.karma(4); return `The kitchen is shut for three days, and the walk-in is replaced. The landlord thanks you through his teeth. Chef ${k.M.last} will not have you on the same shift for a month.`; } },
          ],
        },
        {
          r: 2, icon: '📰', title: 'A critic in the house',
          text: (L, k) => `A whisper at the pass: the man alone at table six, with the notebook and the good shoes, is Julian Thorne of the Sunday paper. ${k.r >= 4 ? 'It is your kitchen, and your name on the menu.' : `Chef ${k.M.last} is off with ${k.M.his} back, and the kitchen is yours tonight.`}`,
          opts: [
            { t: 'Cook the menu as it stands', check: ['craft', 50], run(L, k, win) { if (win) { perf(L, 6); L.fame(3); k.f.review = 4; return 'Four stars, and a whole paragraph about the crab that the landlord has framed by the till. The telephone does not stop for a month.'; } perf(L, -3); k.f.review = 3; return 'Three stars, and the word “competent”. You read it forty times. It does not get any better.'; } },
            {
              t: 'Throw away the menu and cook what the boats brought in', check: ['craft', 65],
              run(L, k, win) {
                if (win) { perf(L, 10); L.fame(6); mentor(L, k, 6); k.f.review = 5; gaz(L, k, '{He} once cooked a dinner at the Gull & Anchor that the Sunday papers called the best in the county.'); return 'Five stars. “Go,” it says. “Go now, before everybody else does.” People drive down from the city to sit at table six.'; }
                perf(L, -8); L.fame(-2); k.f.review = 2;
                return 'Two stars, and the word “ambitious”, which in a review is not a compliment. The landlord pins it to the kitchen door where you will see it every day.';
              },
            },
            { t: T('charmer', 'Go out to table six and talk to him about the crab'), show: (L) => trait(L, 'charmer'), check: ['charm', 35], run(L, k, win) { if (win) { perf(L, 5); L.fame(3); k.f.review = 4; return 'He came for the food and stays for the conversation. Four stars, and a line about “the warmest kitchen in the county”.'; } perf(L, -2); k.f.review = 3; return 'He would rather eat in peace, he says, pointedly. Three stars.'; } },
            { t: 'Send out a bottle of the good wine, on the house', odds: () => 0.5, run(L, k, win) { L.karma(-1); if (win) { perf(L, 4); L.fame(1); k.f.review = 4; return 'Four stars. The wine is mentioned, warmly, and so is the halibut.'; } perf(L, -5); L.fame(-1); k.f.review = 3; return '“The kitchen,” he writes, “was keen to be liked.” Everybody in town knows what that means.'; } },
          ],
        },
        {
          r: 3, icon: '⛵', title: 'Across the harbour',
          text: (L, k) => (k.R.v >= 0
            ? `${k.R.name} has found an old sail loft on the quay and wants to make it a restaurant of ${k.R.his} own: twelve tables, a wood oven, the catch of the day on a slate. ${k.R.He} needs $15,000, and a partner who can cook.`
            : `${k.R.name} has opened a restaurant of ${k.R.his} own across the harbour, the Saltings, with a wood oven and your old pastry cook, whom ${k.R.he} hired away on Tuesday. There is a fish stew on the menu that looks very like yours.`),
          opts: [
            {
              t: 'Put in the $15,000', cost: 15000, odds: () => 0.55, show: (L, k) => k.R.v >= 0,
              run(L, k, win) {
                if (win) { rival(L, k, 15); L.cash(36000); return `The Saltings is full every night by summer. Your share of the first year is ${money(36000)}, and ${k.R.first} names a pudding after you.`; }
                rival(L, k, 10);
                return `It is a good restaurant in a bad year. It closes by Christmas, owing the fish merchant, and your $15,000 goes with it. ${k.R.first} cries in your kitchen, and you open a bottle.`;
              },
            },
            { t: (L, k) => `Wish ${k.R.him} well, and stay where you are`, show: (L, k) => k.R.v >= 0, run(L, k) { rival(L, k, 4); perf(L, 4); return `${k.R.first} is a little hurt, and then very busy. On your night off you eat there and are given the best table, by the window.`; } },
            { t: (L, k) => `Out-cook ${k.R.him}`, check: ['craft', 60], show: (L, k) => k.R.v < 0, run(L, k, win) { if (win) { perf(L, 8); L.fame(2); rival(L, k, -10); return `By the autumn the Saltings has empty tables on a Friday, and the Gull & Anchor has a waiting list. ${k.R.first} walks past your kitchen door very fast.`; } perf(L, -8); rival(L, k, -5); return `${k.R.His} stew is better than yours. You know it, the town knows it, and half your Friday regulars eat across the water now.`; } },
            { t: (L, k) => `Go over and shake ${k.R.his} hand`, check: ['charm', 50], show: (L, k) => k.R.v < 0, run(L, k, win) { if (win) { rival(L, k, 45); L.joy(4); return `You eat at the Saltings on the opening night, and say so in the Gazette. By Christmas the two of you are swapping fish and gossip at six in the morning on the quay.`; } rival(L, k, -5); return `${k.R.first} takes the hand, and the compliment, and gives you nothing back. Still: you went.`; } },
          ],
        },
        {
          r: 4, icon: '🎥', title: 'The cameras',
          text: (L, k) => `A television company has eaten at the Gull & Anchor and wants to make a programme there: a cookery series, twelve weeks of filming, your kitchen on every screen in the country.${k.top ? ' Your name is already over the door; this would put it on the side of buses.' : ''}`,
          opts: [
            {
              t: 'Do it', check: ['charm', 55],
              run(L, k, win) {
                if (!win) { L.fame(2); perf(L, -3); return 'You freeze whenever the red light comes on. The producer gives most of the programme to a man in a bow tie, and you five minutes at the end.'; }
                L.fame(8); mentor(L, k, -4);
                const rose = !k.top && up(L, k);
                return `It goes out on Thursday nights and the country falls in love with crab. ${rose ? `You are ${L.jobTitle()} now, and` : 'Now'} people stop you in the supermarket to ask about their sauces.`;
              },
            },
            { t: 'The kitchen comes first', run(L, k) { perf(L, 6); mentor(L, k, 8); L.karma(1); return 'The cameras go to a man in Kettleby with a bow tie. Your kitchen goes on as it was, which is to say very well, with nobody watching but the people eating.'; } },
            { t: (L, k) => `Put ${k.R.first} forward instead`, show: (L, k) => !k.R.dead && k.R.v >= 20, run(L, k) { rival(L, k, 25); L.karma(2); return `${k.R.first} is a natural, and a nightmare, and a star by Easter. A hamper comes from ${k.R.him} every Christmas after, with a note: “Your fault.”`; } },
          ],
        },
        {
          r: 4, icon: '📒', title: 'Chef’s book',
          text: (L, k) => (k.M.dead
            ? `${k.M.name}’s daughter brings you a school exercise book with a fish kettle drawn on the cover: forty years of recipes in ${k.M.his} handwriting, one of them just the word NO. A publisher in the city will print it, if your name goes on the cover. It will sell on yours.`
            : `${k.M.name}, long retired, has written down forty years of recipes in a school exercise book and wants them printed. A publisher in the city will do it, if your name goes on the cover. It will sell on yours, they say.`),
          opts: [
            { t: (L, k) => `${k.M.His} name, and only ${k.M.his}`, run(L, k) { mentor(L, k, 15); L.karma(3); gaz(L, k, `{He} cooked at the Gull & Anchor for most of {his} life, and saw to it that ${k.M.name} got the credit for the stew.`); return `It sells eleven hundred copies, nearly all of them in Starling Bay. ${k.M.dead ? 'There is a launch at the Gull, with the stew, and an empty chair at the end of the table.' : `${k.M.first} signs every one at a table in the Gull, slowly, in fountain pen.`}`; } },
            { t: 'Both names on the cover', run(L, k) { mentor(L, k, 5); L.fame(2); L.karma(1); const n = bonus(L, 3); return `Both names, ${k.M.his} first. It sells well enough to pay for a new range at the Gull, with ${n} left over.`; } },
            { t: 'Yours: it is the only way it sells', run(L, k) { mentor(L, k, -30); L.karma(-4); L.fame(4); const n = bonus(L, 8); gaz(L, k, '{He} wrote a famous cookery book, though people who knew the kitchen at the Gull & Anchor say it was not all {his} own.'); return `It sells forty thousand copies, and pays ${n}. ${k.M.dead ? `${k.M.first}’s daughter sends back the copy you gave her.` : `${k.M.first} does not come to the launch, and sends back the copy you gave ${k.M.him}, unopened.`}`; } },
          ],
        },
      ],
    },

    // ---- Tremlett's on the High Street: a till, three names, and a shop that is to close ----
    retail: {
      party: 'The staff room at Tremlett’s has balloons in it, and a cake from the bakery counter with your name spelled nearly right.',
      gift: 'a gold watch, from stock, with the price still on it',
      ch: [
        {
          r: 0, icon: '🧥', title: 'Under the jumper',
          text: (L, k) => `Tremlett’s on the High Street has sold everything from buttons to bicycles since 1890, and ${k.M.name} has walked its floors for thirty years, seeing everything. This afternoon a boy of twelve or so has put a tin of baby milk up his school jumper. ${k.R.name}, on the next till, has seen him too.`,
          opts: [
            { t: 'Call the manager', run(L, k) { perf(L, 3); L.karma(-2); rival(L, k, 6); return 'The police come, then his mother, then the reason, which is a baby sister and no money until Thursday. You wish you had not.'; } },
            { t: 'Ring it through and pay for it yourself', cost: 15, run(L, k) { L.karma(4); mentor(L, k, 8); return `Fifteen dollars, from your own pocket. The boy goes red, and runs. ${k.M.Mr} ${k.M.last} saw, says nothing, and later gives you a biscuit from the good tin.`; } },
            { t: 'Look the other way', odds: () => 0.6, run(L, k, win) { L.karma(1); if (win) return 'He is out of the door and gone. Nobody saw a thing, except you, and you were not looking.'; rival(L, k, -15); perf(L, -5); return `${k.R.first} saw you see, and mentions it to the manager, kindly, in front of everyone, as something you will surely want to learn from.`; } },
          ],
        },
        {
          r: 1, icon: '💵', title: 'Forty dollars short',
          text: (L, k) => `For the third Friday running, the till you share with ${k.R.name} is forty dollars short at closing. ${k.R.first} has a new coat.`,
          opts: [
            { t: 'Tell the manager what you think', run(L, k) { rival(L, k, -30); perf(L, 4); k.f.till = 'told'; return `${k.R.first} is moved to the stockroom, and the till balances from then on. ${k.R.He} never says a word to you about it, which is worse than if ${k.R.he} had.`; } },
            { t: (L, k) => `Have it out with ${k.R.him}, privately`, check: ['charm', 40], run(L, k, win) { if (win) { rival(L, k, 22); L.karma(2); k.f.till = 'kept'; return `${k.R.He} goes white, then red, and then tells you: a mother in a home up the coast, and fees ${k.R.he} cannot meet. It stops. You keep it between the two of you, and ${k.R.he} knows you did.`; } rival(L, k, -15); perf(L, -2); k.f.till = 'denied'; return `${k.R.He} denies the lot, loudly, and from then on watches you as if you were the one with the new coat.`; } },
            { t: 'Make it up from your own pocket, and say nothing', cost: 120, run(L, k) { L.karma(1); k.f.till = 'paid'; return 'It stops being short when you stop looking. You never find out, and you are never quite sure you wanted to.'; } },
          ],
        },
        {
          r: 2, icon: '📋', title: 'Three names',
          text: (L, k) => `Head office has sent a manager down from the city with a laminated chart, and he wants three names by Friday for what he calls rightsizing. One name is on his list already: ${k.M.dead ? 'old Archie in the stockroom, two years off his pension' : `${k.M.name}, two years off ${k.M.his} pension`}.`,
          opts: [
            { t: 'Give him the names he wants', run(L, k) { perf(L, 6); mentor(L, k, -30); L.karma(-4); return `${k.M.dead ? 'Archie' : k.M.first} takes early retirement, and the carriage clock, and does not look at you at the presentation. The chart goes back to the city with a tick on it.`; } },
            { t: 'Refuse to give him any', check: ['charm', 50], run(L, k, win) { mentor(L, k, 10); L.karma(3); if (win) { perf(L, 2); return 'You tell him what each of them does that is not on his chart. He crosses out two names, and goes home on the 4.15. Nobody ever knows how near it was.'; } perf(L, -10); return 'He writes your name down instead, in a different colour. Everybody keeps their jobs, you only just, and the city knows who you are now.'; } },
            { t: T('kind', 'Offer to take a pay cut, so that nobody has to go'), show: (L) => trait(L, 'kind'), run(L, k) { L.cash(-L.shiftPay() * 2); L.karma(4); mentor(L, k, 10); perf(L, -2); return 'He looks at you as if you had offered him a live fish. Then he does the sums, and nobody goes. Two others offer the same, once they hear.'; } },
            { t: (L, k) => `Give him ${k.R.first}’s name`, show: (L, k) => !k.R.dead && k.R.v < 20, run(L, k) { rival(L, k, -30); perf(L, 4); L.karma(-4); return `${k.R.first} goes, with a month’s pay and a look. Your corner of the shop floor is very quiet afterwards.`; } },
          ],
        },
        {
          r: 3, icon: '🏬', title: 'Everything must go',
          text: () => 'You read it in the Gazette before anybody tells you: head office means to close Tremlett’s on the High Street and open a shed by the bypass, with a car park. A hundred and thirty years. Forty jobs.',
          opts: [
            {
              t: 'Fight for the shop', check: ['charm', 55],
              run(L, k, win) {
                if (win) { perf(L, 8); L.karma(4); L.fame(2); k.f.shop = 'saved'; gaz(L, k, '{He} saved Tremlett’s on the High Street when the city wanted it shut.'); return 'The figures, the petition, the mayor, and a front page with a photograph of the shop in 1912. The city backs down, sulking. Tremlett’s stays, and the High Street knows whose doing it was.'; }
                perf(L, -4); L.karma(2); L.joy(-6); k.f.shop = 'closed';
                return 'You fight, and lose. The last day is a Saturday, with everything half price and the staff in their best clothes. You are kept on at the shed by the bypass, which has no windows.';
              },
            },
            { t: 'Close it well', run(L, k) { L.karma(3); perf(L, 5); k.f.shop = 'closed'; return 'Everybody leaves with a reference, a month’s pay and a party in the empty shop. People come in all day to say goodbye to the lift.'; } },
            {
              t: 'Sign off the closure, and take the job they dangle', show: (L, k) => !!k.next,
              run(L, k) { L.karma(-4); mentor(L, k, -10); k.f.shop = 'sold'; const rose = up(L, k); return `You sign. The city likes people who sign. ${rose ? `You are ${L.jobTitle()} by the summer, in an office by the bypass,` : 'They say there will be something for you soon,'} and the old shop becomes a telephone shop.`; },
            },
          ],
        },
        {
          r: 4, icon: '🧶', title: 'Half price',
          text: () => 'A supplier offers you jumpers at half what anybody else charges: good wool, good stitching, a fortune at Christmas. You have seen photographs of the factory. The people in them are about twelve.',
          opts: [
            {
              t: 'Buy them', odds: () => 0.65,
              run(L, k, win) {
                L.karma(-6);
                if (win) { perf(L, 8); const n = bonus(L, 3); return `They sell out by October. Nobody asks where they came from, and you do not tell them. A bonus of ${n}.`; }
                sack(L, k, `Sacked as ${k.title}, over the jumpers.`, { bar: 8, why: 'Tremlett’s will not have your name near the shop again' });
                return 'A reporter from the city has the same photographs. Your name is in the story, under the word Tremlett’s. The board needs somebody to blame by Monday, and it is you.';
              },
            },
            { t: 'Turn them down', run(L) { perf(L, -3); L.karma(3); return 'You pay more for jumpers that cost more. The board grumbles about the margin.'; } },
            { t: 'Turn them down, and tell the Gazette', run(L) { perf(L, -6); L.karma(6); L.fame(2); return 'The Gazette runs it, then the city papers, and the supplier is dropped by everybody. The board is furious with you for a month and proud of you in public for a year.'; } },
          ],
        },
        {
          r: 4, icon: '🏛️', title: (L, k) => (k.top ? 'An offer for Tremlett’s' : 'The boardroom'),
          text: (L, k) => (k.top
            ? 'A company from the city wants to buy Tremlett’s: every shop, every lease, every carrier bag. The offer would make you rich, and the shops would be theirs.'
            : `The Chief Executive is retiring, and the board must choose between you and ${k.R.name}, who went up through head office while you were on the shop floor, and has friends on the board.`),
          opts: [
            { t: 'Sell', show: (L, k) => k.top, run(L, k) { const n = bonus(L, 20); L.karma(-3); sack(L, k, 'Sold Tremlett’s, and stepped down as Chief Executive.', { bar: 16, stand: 60, why: 'You sold Tremlett’s; it is not yours to come back to' }); return `You sign, and are paid ${n}, and are thanked, and are shown out. The shops get new signs within the month.`; } },
            { t: 'Keep it in the town', show: (L, k) => k.top, run(L, k) { perf(L, 6); L.karma(4); gaz(L, k, '{He} ran Tremlett’s, and turned down a fortune to keep it in Starling Bay.'); return 'You turn them down by letter, and put the letter in the window. People come in to read it, and stay to buy socks.'; } },
            {
              t: 'Make your case: the shops, and the people in them', check: ['charm', 60], show: (L, k) => !k.top,
              run(L, k, win) {
                if (!win) { rival(L, k, -5); L.joy(-5); return `${k.R.first} gets it, by one vote. ${k.R.His} first memo is about the colour of the carrier bags.`; }
                rival(L, k, -10);
                const rose = up(L, k);
                return `The board listens for an hour and votes in ten minutes. ${rose ? `You are ${L.jobTitle()}.` : 'You win the room, if not yet the chair.'} ${k.R.first} shakes your hand, hard.`;
              },
            },
            {
              t: 'Remind the board about the till', odds: () => 0.6, show: (L, k) => !k.top && (k.f.till === 'told' || k.f.till === 'kept'),
              run(L, k, win) { L.karma(-6); rival(L, k, -40); if (win) { const rose = up(L, k); return `It is an old story, and it is enough. ${rose ? `You are ${L.jobTitle()}.` : 'The board thanks you for your candour.'} You do not enjoy it as much as you thought you would.`; } perf(L, -10); return 'It looks exactly like what it is. The board gives the job to somebody from outside, and remembers you for the wrong reason.'; },
            },
            { t: (L, k) => `Back ${k.R.first} for it`, show: (L, k) => !k.top && !k.R.dead, run(L, k) { rival(L, k, 30); L.karma(3); L.s.job.raise = Math.min(0.4, (L.s.job.raise || 0) + 0.08); return `${k.R.first} gets it, and does not forget who stood up for ${k.R.him}. Your pay goes up the following week, which is a coincidence, ${k.R.he} says.`; } },
          ],
        },
      ],
    },

    // ---- the building trade: a corner to cut, and a gale that finds it ----
    trades: {
      party: 'The boatyard has a barrel on a trestle and a hog roast on the slipway, and the whole firm in clean shirts.',
      gift: 'a spirit level, engraved: STRAIGHT AND TRUE',
      ch: [
        {
          r: 0, icon: '🪜', title: 'The tower',
          text: (L, k) => `The firm is ${k.M.name}’s in all but name: ${k.M.he} has been foreman for twenty-six years and has a word for every tool, most of them rude. ${k.R.name}, who started a month before you and wants you to know it, has left the scaffold tower unpinned again, and ${k.M.first} is coming round the corner.`,
          opts: [
            { t: 'Pin it yourself, quickly', run(L, k) { rival(L, k, 15); mentor(L, k, 2); return `${k.M.first} walks past, looks up, and says nothing. ${k.R.first} buys the teas all week.`; } },
            { t: (L, k) => `Tell ${k.M.first}`, run(L, k) { mentor(L, k, 8); rival(L, k, -20); perf(L, 3); return `${k.M.first} has ${k.R.first} up and down the tower forty times, pinning and unpinning. You are not popular in the hut.`; } },
            { t: 'Leave it', odds: () => 0.7, run(L, k, win) { if (win) return 'Nothing happens. Nothing usually does.'; rival(L, k, 5); mentor(L, k, -5); perf(L, -4); return `The tower shifts with ${k.R.first} at the top of it. ${k.R.He} comes down the quick way and lands on a heap of old sails, which saves ${k.R.his} neck and ruins the sails. ${k.M.first} looks at you both for a long time.`; } },
          ],
        },
        {
          r: 1, icon: '🦴', title: 'Under the floor',
          text: () => 'You are digging out the floor of the old chapel hall for new footings when your spade turns up a jawbone, and then the rest of somebody. The job is a week behind already, and the boss is on the telephone asking why.',
          opts: [
            { t: 'Stop, and ring the police', run(L, k) { perf(L, -4); L.karma(3); mentor(L, k, 4); return 'He is three hundred years old, a sailor by the look of him, and the Reverend Hollis buries him again at St Brigid’s with a proper service. The job is a fortnight late. The boss sends you the bill for your conscience, in the form of a long face.'; } },
            { t: 'Cover him up, and pour the concrete', odds: () => 0.7, run(L, k, win) { L.karma(-5); if (win) { perf(L, 4); return 'He lies under the new hall still. The job is done on time, and nobody knows but you, and the floor.'; } perf(L, -10); return 'A man from the museum hears about it from somebody who heard about it from you. There is a dig, a fuss and a fine for the firm, which the boss takes out of your hide.'; } },
            { t: (L, k) => `Ask ${k.M.first} what to do`, run(L, k) { mentor(L, k, 6); perf(L, -1); L.karma(2); return `${k.M.first} takes off ${k.M.his} cap, which you have never seen ${k.M.him} do. Then ${k.M.he} rings the police and the Reverend Hollis, in that order, and tells the boss to put the delay on ${k.M.his} account.`; } },
          ],
        },
        {
          r: 2, icon: '🌬️', title: 'Wind on the tower',
          text: (L, k) => `The scaffold on St Brigid’s tower must be up by Friday or the firm pays a penalty. It is Thursday, and the wind is getting up off the sea. ${k.M.first} says leave it. The boss says the penalty will come out of somebody’s wages.`,
          opts: [
            { t: 'Go up anyway', check: ['fitness', 50], run(L, k, win) { if (win) { perf(L, 6); credit(L, 2); mentor(L, k, -4); return `You finish it in the last of the light, roped on and soaked through. The boss buys the first round. ${k.M.first} does not drink with you.`; } L.hp(-14, 'a fall from a scaffold'); L.sicken('broken wrist', 2); perf(L, -2); return 'A gust takes a board out of your hands and you go after it, as far as your harness lets you. Your wrist meets the tower on the way. Six weeks in plaster.'; } },
            { t: T('daredevil', 'Go up, and enjoy every minute'), show: (L) => trait(L, 'daredevil'), check: ['fitness', 40], run(L, k, win) { L.joy(4); if (win) { perf(L, 7); credit(L, 2); return 'You whoop at the gulls from the top of the tower. It is done by dusk. The boss cannot decide whether to promote you or have you seen to.'; } L.hp(-10, 'a fall from a scaffold'); perf(L, -2); return 'The wind wins this one. You come down bruised, laughing, and in a good deal of trouble.'; } },
            { t: 'Wait for the wind to drop', run(L, k) { perf(L, -5); mentor(L, k, 8); return 'The firm pays the penalty, and the boss tells everybody whose fault it is. On Saturday the gale takes the weathervane off the tower and drops it where the scaffold would have been.'; } },
          ],
        },
        {
          r: 3, icon: '🏗️', title: 'What nobody sees',
          text: () => 'The harbour-front flats are the biggest job the firm has had, and they are yours to run. The developer, Mr Fyfe, takes you aside. The steel in the footings, the fire doors, the damp course: “What nobody sees,” he says, “nobody pays for.” There would be something in it for you.',
          opts: [
            { t: 'Build it properly', run(L, k) { perf(L, -6); L.karma(3); k.f.flats = 'sound'; return 'It runs over, and over budget, and Mr Fyfe stops sending you Christmas cards. Every bolt is where the drawings say.'; } },
            { t: 'Cut what nobody sees', run(L, k) { L.karma(-8); perf(L, 6); k.f.flats = 'cut'; const n = bonus(L, 4); return `Finished in March, and under budget. Mr Fyfe’s envelope holds ${n}. The flats look very fine from the harbour.`; } },
            { t: 'Report him to the council', run(L, k) { L.karma(6); L.fame(1); perf(L, -10); k.f.flats = 'sound'; return 'The council sends an inspector, the inspector sends Mr Fyfe a letter, and the firm loses a month and the developer’s goodwill. The boss does not speak to you until June.'; } },
          ],
        },
        {
          r: 3, icon: '🌊', title: 'The great gale',
          text: (L, k) => (k.f.flats === 'cut'
            ? 'The worst gale in forty years comes in on a spring tide. At two in the morning a crack opens down the harbour-front flats from the roof to the car park, and forty families stand in the rain in their dressing gowns while the fire brigade looks at the footings you signed off.'
            : 'The worst gale in forty years comes in on a spring tide, and roofs go all along the front. In the morning the harbour-front flats are the only building on the quay with every window in, and the town notices whose they are.'),
          opts: [
            {
              t: 'Tell the inquiry the truth', show: (L, k) => k.f.flats === 'cut',
              run(L, k) { L.karma(4); gaz(L, k, '{He} built the harbour-front flats, and told the truth about them at the inquiry, which cost {him} everything but {his} name.'); sack(L, k, 'Finished in the building trade, after the inquiry into the harbour-front flats.', { bar: 16, why: 'No firm in the Bay will touch you after the flats' }); return 'You tell them everything: the steel, the envelope, Mr Fyfe. He goes to prison. You do not, quite; but no firm in the Bay will have you for a long time.'; },
            },
            {
              t: 'Say nothing', odds: () => 0.45, show: (L, k) => k.f.flats === 'cut',
              run(L, k, win) {
                L.karma(-4);
                if (win) return 'The inquiry blames the gale, the sea and the drawings, in that order. You sleep badly for a year.';
                sack(L, k, 'Sacked from the building trade over the harbour-front flats.', { bar: EVER, why: 'No firm will have you after the flats' });
                L.s.n.crimes++; L.queue('busted', { what: 'a developer’s envelope, and forty families in the rain', sev: 3 });
                return 'Mr Fyfe kept every letter. He gives them to the inquiry to save himself, and they are mostly about you.';
              },
            },
            {
              t: 'Take the credit', show: (L, k) => k.f.flats !== 'cut',
              run(L, k) { L.fame(3); perf(L, 8); const rose = !k.top && up(L, k); return `The Gazette prints a photograph of the flats standing in a sea of broken roofs. ${rose ? `By the summer you are ${L.jobTitle()}, a good deal sooner than anybody expected.` : 'The owner of the firm takes you to lunch and talks about the future, by which he means yours.'}`; },
            },
            {
              t: (L, k) => `Give the credit to ${k.M.first}, who taught you to build like that`, show: (L, k) => k.f.flats !== 'cut',
              run(L, k) { mentor(L, k, 15); L.karma(3); perf(L, 4); return `“Every bolt where the drawings say,” you tell the Gazette, “because ${k.M.first} would have had my hide.” ${k.M.dead ? 'They print it beside an old photograph of the firm, with you at the back.' : `${k.M.first} has it framed.`}`; },
            },
          ],
        },
        {
          r: 4, icon: '🧱', title: 'The last wall',
          text: (L, k) => (k.M.dead
            ? `The harbour wall needs rebuilding after the gale, and the council wants concrete. ${k.M.name} always said it should be done the old way, in granite, by hand, as it was built. ${k.M.He} did not live to see it done either way.`
            : `The harbour wall needs rebuilding after the gale, and the council wants concrete. ${k.M.name}, retired and bored, wants to do it the old way, in granite, by hand, as it was built: one last job, with you, before ${k.M.his} knees go for good.`),
          opts: [
            { t: 'The old way', run(L, k) { busy(L, 3); L.karma(5); L.fame(2); mentor(L, k, 15); perf(L, -2); gaz(L, k, '{He} rebuilt the harbour wall in granite, by hand, the old way, and it is standing yet.'); return `A whole summer of it, block by block, ${k.M.dead ? `with ${k.M.first}’s old mallet` : `with ${k.M.first} on a folding chair telling you that you are doing it wrong`}. It will outlast all of you.`; } },
            { t: 'Concrete: quicker, and the council is paying', run(L, k) { perf(L, 6); const n = bonus(L, 2); return `Done by August, with ${n} for the firm’s trouble and yours. It does the job. ${k.M.dead ? 'Nobody minds but you.' : `${k.M.first} walks along it once, and says it is very smooth.`}`; } },
          ],
        },
      ],
    },

    // ---- Lighthouse Labs: a startup in a net loft, and what the code really does ----
    tech: {
      party: 'They hold it at the top of the lighthouse, where the lamp used to be, with pizza and a cake shaped like a floppy disk that nobody under forty understands.',
      gift: 'the first keyboard you ever broke, mounted on a plaque',
      prep(L, st) { if (st.n === 4 && st.f.loft == null) st.f.loft = L.chance(0.45) ? 'sold' : 'bust'; },
      ch: [
        {
          r: 0, icon: '🗒️', title: 'The sticky note',
          text: (L, k) => `Lighthouse Labs keeps its servers where the lamp used to be, and ${k.M.name} keeps the servers, with the master password on a sticky note on ${k.M.his} screen. ${k.R.name}, who started when you did and has opinions about everything, wants your help teaching ${k.M.first} a lesson.`,
          opts: [
            { t: 'Help with the lesson', run(L, k) { rival(L, k, 15); mentor(L, k, -8); perf(L, -2); return `You change every password in the building to “stickynote”. ${k.M.first} spends a whole Tuesday getting back into ${k.M.his} own machines, and then laughs, eventually.`; } },
            { t: (L, k) => `Tell ${k.M.first}, quietly, to change it`, run(L, k) { mentor(L, k, 10); rival(L, k, -12); return `${k.M.first} changes it, and writes the new one on a sticky note under the keyboard, which is progress. ${k.R.first} calls you teacher’s pet in the kitchen.`; } },
            { t: 'Stay out of it', run(L, k) { return `Somebody else helps ${k.R.first}. It is very funny, from a distance.`; } },
          ],
        },
        {
          r: 1, icon: '🐛', title: 'Friday afternoon',
          text: () => 'The new booking system for the Lucky Gull goes out on Friday. On Thursday night you find a bug that charges anybody called O’Something twice. The manager wants it out on time. “We will fix it on Monday.”',
          opts: [
            { t: 'Ship it', odds: () => 0.65, run(L, k, win) { L.karma(-1); if (win) { perf(L, 4); return 'Nobody called O’Anything books a room all weekend. You fix it on Monday, and nobody ever knows.'; } perf(L, -10); return 'Mrs O’Hare is charged twice, then her son is, then the Gazette is. Your name is on the release.'; } },
            { t: 'Hold it back', run(L, k) { perf(L, -4); mentor(L, k, 6); L.karma(1); return 'It goes out a week late, and right. The manager does not forgive you for the week.'; } },
            { t: 'Fix it tonight', check: ['smarts', 50], run(L, k, win) { L.hp(-2); if (win) { perf(L, 6); credit(L, 1); return 'Four in the morning, three cups of tea and one apostrophe. It goes out on time, and right, and you sleep through Saturday.'; } perf(L, -2); return 'You are still at it when the sun comes up over the lamp room, and it goes out late anyway.'; } },
            { t: T('nightowl', 'Fix it tonight, when you work best anyway'), show: (L) => trait(L, 'nightowl'), run(L) { perf(L, 7); credit(L, 1); return 'Midnight is your hour. It is fixed by two, and you are at the Gull for last orders, nearly.'; } },
          ],
        },
        {
          r: 2, icon: '🧺', title: 'The net loft',
          text: (L, k) => `${k.R.name} is leaving to start a company in a net loft on the quay: an app for booking the ferry, the water taxi, and anything else with an engine. ${k.R.He} wants you in it: your savings and your evenings, for a fifth of whatever it becomes.`,
          opts: [
            { t: 'Put in $15,000, and your evenings', cost: 15000, run(L, k) { busy(L, 2); rival(L, k, 20); k.f.stake = 1; return 'Nights in a loft that smells of tar, pizza on a fish box, and a whiteboard nobody is allowed to rub out. It is the most fun you have had in years. It may also be the most expensive.'; } },
            { t: 'Your name and your advice, not your money', run(L, k) { rival(L, k, 8); k.f.stake = 2; return `You go round on Thursday nights and tell ${k.R.him} what is wrong with it. ${k.R.He} gives you a small share, and a T-shirt.`; } },
            { t: (L, k) => `Wish ${k.R.him} luck`, run(L, k) { rival(L, k, -8); k.f.stake = 0; return `${k.R.first} goes off to the net loft. You keep your savings and your evenings, and wonder, now and then.`; } },
          ],
        },
        {
          r: 3, icon: '👁️', title: 'What it really does',
          text: () => 'The new app for the Lucky Gull is nearly done, and the client wants one more thing: quietly, it should note down everything people type and who they are with, and sell it on. “Everybody does it,” says the manager. Your name will be on the code.',
          opts: [
            { t: 'Build it', run(L, k) { perf(L, 6); L.karma(-5); k.f.data = 1; return 'It goes out in the spring and makes the Lucky Gull a great deal of money. You stop using the app yourself.'; } },
            { t: 'Refuse', check: ['charm', 50], run(L, k, win) { L.karma(3); if (win) { perf(L, -2); return 'You put it in writing, with the law attached. The client drops it, and the manager drops the subject.'; } perf(L, -10); return 'The manager gives it to somebody who does not refuse, and gives you the jobs nobody wants, for a year.'; } },
            {
              t: 'Tell the Gazette', odds: () => 0.5,
              run(L, k, win) {
                L.karma(6); L.fame(2);
                if (win) { perf(L, -2); return `The story runs on a Friday, and the Lucky Gull drops the plan by Monday. Nobody finds out who rang the Gazette, though ${k.M.first} winks at you in the lift.`; }
                sack(L, k, `Sacked as ${k.title}, for talking to the Gazette.`, { bar: 8, why: 'Lighthouse Labs does not take back people who talk to the papers' });
                return 'They find out by Tuesday. You leave with a cardboard box and a clear conscience, which does not pay the rent.';
              },
            },
          ],
        },
        {
          r: 3, icon: '☎️', title: 'The net loft, again',
          text: (L, k) => {
            const R = k.R, sold = k.f.loft === 'sold';
            if (sold && k.f.stake) return `${R.name} rings at seven in the morning, which ${R.he} never does. The ferry app has been bought by a company in California for a sum with a great many noughts in it, and ${k.f.stake === 1 ? 'a fifth of it is yours' : 'a small piece of it is yours'}.`;
            if (sold) return `The ferry app ${R.name} started in a net loft has been bought by a company in California for a sum with a great many noughts in it. ${R.first} sends you a postcard from a beach.`;
            return `The ferry app has run out of money. The bank wants the net loft back${k.f.stake === 1 ? ', your $15,000 has gone with the rest,' : ''} and ${R.name} is in your office, asking for a job.`;
          },
          opts: [
            { t: 'Bank it', show: (L, k) => k.f.loft === 'sold' && !!k.f.stake, run(L, k) { const n = k.f.stake === 1 ? 180000 : 20000; L.cash(n); L.joy(10); rival(L, k, 10); gaz(L, k, '{He} put {his} savings into an app in a net loft on the quay, and did very well out of it.'); return `${money(n)}. You go into work as usual, and sit at your desk, and laugh at nothing for about an hour.`; } },
            { t: 'Give a slice of it to the lifeboat', show: (L, k) => k.f.loft === 'sold' && !!k.f.stake, run(L, k) { const n = k.f.stake === 1 ? 140000 : 14000; L.cash(n); L.karma(6); L.joy(8); rival(L, k, 10); L.s.n.given = (L.s.n.given || 0) + (k.f.stake === 1 ? 40000 : 6000); return `${money(n)} for you, and a new inshore boat for the lifeboat, with the name of the app painted on the side, which ${k.R.first} thinks is very funny.`; } },
            { t: (L, k) => `Ring ${k.R.first} and congratulate ${k.R.him}`, show: (L, k) => k.f.loft === 'sold' && !k.f.stake, run(L, k) { rival(L, k, 12); L.joy(-2); return `${k.R.He} is very gracious about it, which is almost the worst part.`; } },
            { t: 'Pretend you never heard', show: (L, k) => k.f.loft === 'sold' && !k.f.stake, run(L, k) { rival(L, k, -5); L.joy(-3); return 'You hear about nothing else for a month.'; } },
            { t: (L, k) => `Give ${k.R.him} a job`, show: (L, k) => k.f.loft !== 'sold', run(L, k) { rival(L, k, 25); L.karma(2); perf(L, 2); return `${k.R.first} is very good, and very humble for about a fortnight, and then very good.`; } },
            { t: 'Not on your team', show: (L, k) => k.f.loft !== 'sold', run(L, k) { rival(L, k, -15); return `${k.R.first} gets a job in the city in the end. ${k.R.He} does not send a postcard.`; } },
          ],
        },
        {
          r: 4, icon: '💡', title: (L, k) => (k.top ? 'The old lighthouse' : 'The top of the lighthouse'),
          text: (L, k) => {
            if (k.top) return 'A company from the city wants to buy Lighthouse Labs, move everybody to an office park by the motorway and turn the old lighthouse into a café. You would be very rich, and somewhere else.';
            const back = k.f.data ? ' The same week a journalist rings: she has the Lucky Gull’s logs, and your name is in them.' : '';
            return `The Chief Technology Officer is leaving for the city, and the board wants somebody who knows where everything is plugged in.${k.M.dead || !k.M.here ? '' : ` ${k.M.name}, who has never once been asked, tells them it should be you.`}${back}`;
          },
          opts: [
            { t: 'Own it, in public', show: (L, k) => !k.top && !!k.f.data, run(L, k) { L.karma(6); L.fame(-2); perf(L, -10); gaz(L, k, '{He} stood up in public and owned a thing {he} had built and should not have.'); return 'You say it all on the record. The board admires your honesty, and gives the job to somebody else.'; } },
            { t: 'Blame the old manager', odds: () => 0.5, show: (L, k) => !k.top && !!k.f.data, run(L, k, win) { L.karma(-5); if (win) { const rose = up(L, k); return `He has gone to Canada, which is convenient. ${rose ? `You are ${L.jobTitle()} by the summer.` : 'The board believes you, for now.'}`; } sack(L, k, `Sacked as ${k.title}, over the Lucky Gull’s logs.`, { bar: 8, why: 'Lighthouse Labs remembers the Lucky Gull’s logs' }); return 'The journalist has his emails too, and they mention you by name, warmly.'; } },
            { t: 'Put your hand up', check: ['smarts', 70], show: (L, k) => !k.top && !k.f.data, run(L, k, win) { if (!win) { perf(L, 2); return 'They give it to a woman from the city with a very good haircut. She is, annoyingly, excellent.'; } mentor(L, k, 6); const rose = up(L, k); return `${rose ? `You are ${L.jobTitle()}.` : 'The board likes you, and says so.'} ${k.M.dead || !k.M.here ? 'You think of the old sticky note, and smile.' : `${k.M.first} brings you a sticky note with the master password on it, framed.`}`; } },
            { t: 'Not for you: you would rather be where the work is', show: (L, k) => !k.top && !k.f.data, run(L, k) { perf(L, 4); L.joy(3); return 'You tell the board you would rather stay up the lighthouse with the servers. They look at you as if you had declined a knighthood, which, in a way, you have.'; } },
            { t: 'Fight the sale', check: ['charm', 60], show: (L, k) => k.top, run(L, k, win) { if (win) { perf(L, 8); L.karma(4); gaz(L, k, '{He} kept Lighthouse Labs in the lighthouse, where it belongs.'); return 'You win the board round, one by one, over a month of breakfasts. The lighthouse stays a lighthouse, more or less.'; } perf(L, -6); return 'You lose the vote, and then the lighthouse. The café is very good, which is no comfort at all.'; } },
            { t: 'Sell', show: (L, k) => k.top, run(L, k) { const n = bonus(L, 20); L.karma(-2); sack(L, k, 'Sold Lighthouse Labs, and left.', { bar: 16, stand: 60, why: 'You sold Lighthouse Labs; it is not yours to come back to' }); return `You sign, and are paid ${n}, and on the last day you climb to the top of the lighthouse and look at the bay for an hour.`; } },
          ],
        },
      ],
    },

    // ---- St Wren's: a mistake, a famous face, a death on the table, and an inquiry ----
    medicine: {
      party: 'The doctors’ mess at St Wren’s, with a cake iced like an X-ray and everybody’s bleeper going off in turn.',
      gift: 'your first stethoscope, framed, with a little brass plate',
      ch: [
        {
          r: 0, icon: '🌙', title: 'Nights on Gannet Ward',
          text: (L, k) => `Your first nights at St Wren’s. Gannet Ward belongs to ${sister(k.M)} ${k.M.last}, who runs it like the bridge of a ship. At three in the morning ${k.R.name}, who started with you, is asleep in the linen cupboard, and the drip in bed four has run dry.`,
          opts: [
            { t: (L, k) => `Wake ${k.R.first}, and say nothing`, run(L, k) { rival(L, k, 15); L.karma(1); return `${k.R.first} is at bed four before ${k.R.he} is properly awake. In the morning ${k.R.he} brings you a bacon roll from the canteen, which is how it starts.`; } },
            { t: (L, k) => `See to the drip, and tell ${sister(k.M)}`, run(L, k) { mentor(L, k, 8); rival(L, k, -20); perf(L, 3); return `${sister(k.M)} ${k.M.last} writes it in the big book. ${k.R.first} has a very bad morning, and so, from then on, do you, whenever ${k.R.he} can manage it.`; } },
            { t: (L, k) => `See to the drip, and let ${k.R.him} sleep`, run(L, k) { L.karma(2); mentor(L, k, 3); perf(L, 1); return `You do both your jobs until six. ${sister(k.M)} ${k.M.last} notices the drip charts, and the dark under your eyes, and puts you on days.`; } },
          ],
        },
        {
          r: 1, icon: '💊', title: 'Ten times',
          text: (L, k) => `${sister(k.M)} ${k.M.last} has been on for fourteen hours. You look at the chart for bed eleven, an old man with a bad chest, and see that ${k.M.he} has written him up for ten times the dose.`,
          opts: [
            { t: (L, k) => `Tell ${k.M.him}, quietly`, run(L, k) { mentor(L, k, 12); L.karma(2); return `${k.M.He} goes white, puts it right, and goes into the sluice for five minutes. Then ${k.M.he} buys you a coffee, and you never speak of it again.`; } },
            { t: 'Report it to the consultant', run(L, k) { mentor(L, k, -15); perf(L, 5); L.karma(1); return `It is the right thing. ${k.M.He} is sent on a course, and is very correct with you for a year. Bed eleven goes home on Thursday.`; } },
            { t: (L, k) => `Assume ${k.M.he} knows best`, odds: () => 0.5, run(L, k, win) { if (win) return 'The pharmacist catches it at the hatch, and sends it back with a note.'; perf(L, -10); L.karma(-4); mentor(L, k, -5); return `He is very ill for three days, and then better, slowly. There is an incident form with your initials on it, as well as ${k.M.his}.`; } },
          ],
        },
        {
          r: 2, icon: '🕶️', title: 'Under another name',
          text: () => 'A face the whole country knows has been brought in under another name after a bad night in the city, and is in the side room on your ward. A man from a Sunday paper is in the car park with an envelope. A photograph would do.',
          opts: [
            { t: 'Keep it to yourself', run(L, k) { L.karma(3); perf(L, 2); L.fame(1); return 'You keep the blinds down and the visitors out. Three weeks later a hamper comes for the ward, with a card in a handwriting you have seen on record sleeves.'; } },
            {
              t: 'Take the envelope', odds: () => 0.6,
              run(L, k, win) {
                L.karma(-8);
                const n = bonus(L, 5);
                if (win) return `The photograph is on the front page on Sunday. Nobody can say who took it, though everybody wonders. The envelope had ${n} in it.`;
                sack(L, k, `Struck off at St Wren’s, for selling a patient’s photograph.`, { bar: 20, why: 'Struck off' });
                return `The envelope had ${n} in it. The paper protects its source; the hospital does not need it to, since only one person on the ward was on that night. You are struck off.`;
              },
            },
            { t: 'Ask for an autograph, for your mum', run(L) { L.joy(3); L.karma(-1); perf(L, -2); return 'Signed, on a sick bag. Sister finds out, and you are on bedpans for a month.'; } },
          ],
        },
        {
          r: 3, icon: '🫀', title: 'On the table',
          text: (L, k) => `A routine operation: a fisherman of sixty-one, a hernia, his wife in the waiting room. It goes wrong in a way nobody saw coming, and he dies at ten past four. ${k.R.name} gave the anaesthetic after twenty hours on shift. Now there are the notes to write.`,
          opts: [
            { t: 'Write it down exactly as it happened', run(L, k) { L.karma(2); L.joy(-8); k.f.op = 'true'; return 'Every minute, every mistake, including yours. It takes until midnight. The family want an inquiry, and will have one.'; } },
            { t: 'Leave out what looks bad', run(L, k) { L.karma(-4); L.joy(-8); k.f.op = 'tidy'; return 'A few minutes here and there, a reading you did not quite take. It reads well. The family want an inquiry, and will have one.'; } },
            { t: (L, k) => `Make sure the notes show it was ${k.R.first}`, run(L, k) { L.karma(-8); L.joy(-8); rival(L, k, -30); k.f.op = 'blame'; return 'Twenty hours on shift. It is all there, in your neat writing. The family want an inquiry, and will have one.'; } },
          ],
        },
        {
          r: 3, y: 38, gap: 4, icon: '⚖️', title: 'The inquiry',
          text: (L, k) => `The inquiry sits for three days in the boardroom at St Wren’s, with the widow in the front row in her good coat. ${k.f.op === 'tidy' ? 'The monitor kept its own record, and it does not agree with your notes. The chairman has noticed.' : k.f.op === 'blame' ? `${k.R.name}’s union has found the time stamps, and so has the chairman.` : 'The panel has your notes, the monitor’s own record, and a great many questions.'}`,
          opts: [
            { t: 'Answer every question', check: ['smarts', 60], show: (L, k) => k.f.op === 'true', run(L, k, win) { if (win) { perf(L, 8); L.karma(2); gaz(L, k, '{He} faced an inquiry at St Wren’s, was cleared, and never once blamed anybody else.'); return 'Cleared, and the chairman says your notes are the best he has read. The widow shakes your hand on the way out, which is the hardest thing of all.'; } perf(L, -6); return 'A reprimand, and a line in your file about the readings. You keep your job. The widow does not look at you.'; } },
            { t: 'Go and see the widow first', show: (L, k) => k.f.op === 'true', run(L, k) { L.karma(5); L.joy(3); perf(L, -2); gaz(L, k, '{He} faced an inquiry at St Wren’s, and went to see the widow before {he} went to see the panel.'); return 'You sit in her kitchen and tell her everything, before the panel does. The inquiry clears you. She is the one you remember.'; } },
            { t: 'Tell them what you left out', show: (L, k) => k.f.op === 'tidy', run(L, k) { L.karma(3); sack(L, k, 'Suspended from medicine for two years, after the inquiry at St Wren’s.', { bar: 8, why: 'Suspended by the medical council' }); return 'They thank you, coldly, and suspend you for two years. It is fair, and it does not feel it.'; } },
            { t: 'Hold your line', odds: () => 0.45, show: (L, k) => k.f.op === 'tidy', run(L, k, win) { L.karma(-2); if (win) return 'The monitor is “unreliable”, a man from the company says. Cleared. You do not sleep well for a long time.'; L.karma(-3); gaz(L, k, '{He} was struck off after the inquiry at St Wren’s, and did not talk about it.'); sack(L, k, 'Struck off the medical register, after the inquiry at St Wren’s.', { bar: EVER, why: 'Struck off the medical register' }); return 'The chairman reads out the times, one by one. You are struck off the register.'; } },
            { t: 'Say it was your mistake', show: (L, k) => k.f.op === 'blame', run(L, k) { L.karma(6); rival(L, k, 30); sack(L, k, 'Suspended from medicine for two years, after the inquiry at St Wren’s.', { bar: 8, why: 'Suspended by the medical council' }); return `You stand up on the second day and say it. ${k.R.first} is cleared, and does not know what to say to you. Nor do you. You are suspended for two years.`; } },
            { t: 'Stand by your notes', odds: () => 0.5, show: (L, k) => k.f.op === 'blame', run(L, k, win) { if (win) { rival(L, k, -20); L.karma(-3); return `${k.R.first} is suspended for a year, and leaves medicine soon after. You get on, and do not think about it, mostly.`; } gaz(L, k, '{He} was struck off after the inquiry at St Wren’s, and did not talk about it.'); sack(L, k, 'Struck off the medical register, after the inquiry at St Wren’s.', { bar: EVER, why: 'Struck off the medical register' }); return `The time stamps say otherwise. You are struck off. ${k.R.first} is cleared, and does not come to watch, which is the only kindness either of you manages.`; } },
          ],
        },
        {
          r: 4, icon: '🩻', title: 'The scanner',
          text: (L, k) => `A shipping man with a bad heart and a great deal of money needs an operation, and the list is eight months long. He will give St Wren’s a new scanner if he can go to the front of the queue. ${k.top ? 'As Chief Surgeon, it is your decision.' : 'The Chief Surgeon retires in the spring, and the board is watching you.'}`,
          opts: [
            { t: 'The list is the list', run(L, k) { L.karma(5); perf(L, -4); mentor(L, k, 6); gaz(L, k, '{He} once turned down a whole new wing for St Wren’s rather than let a rich man jump the queue.'); return 'He waits his turn, grumbling, and has his operation in the autumn. He does not buy the scanner. The woman who was ahead of him on the list sends you a card.'; } },
            { t: 'Take the scanner', run(L, k) { L.karma(-5); perf(L, 6); const rose = !k.top && up(L, k); return `He has his operation on Tuesday and his photograph in the Gazette on Friday, beside the scanner. ${rose ? `The board is delighted with you: you are ${L.jobTitle()}.` : 'The board is delighted with you.'} The woman who was ahead of him waits a little longer.`; } },
            { t: T('grafter', 'Operate on him on Saturdays, your own time, and keep the list as it is'), show: (L) => trait(L, 'grafter'), run(L, k) { busy(L, 2); L.karma(3); perf(L, 8); const rose = !k.top && up(L, k); return `Nobody loses their place. He is so struck by it that he buys the scanner anyway. ${rose ? `The board makes you ${L.jobTitle()}, and you are back in theatre on Monday.` : 'You are back in theatre on Monday.'}`; } },
          ],
        },
      ],
    },

    // ---- the police: a tin of salmon, Thursday nights, a bag in a car, and men from the city ----
    police: {
      party: 'The station canteen, with a cake in the shape of a helmet, and the cells unlocked for the afternoon so everybody can come.',
      gift: 'your old whistle, mounted on a plaque',
      ch: [
        {
          r: 0, icon: '🥫', title: 'Mrs Hadley’s salmon',
          text: (L, k) => `Sergeant ${k.M.last} has walked the streets of Starling Bay for thirty years and knows which dogs bite. This week ${k.M.he} walks them with you. In the Co-op, Mrs Hadley, eighty-four, has a tin of salmon in her coat, and ${k.R.name}, who joined with you, has ${k.R.his} notebook out.`,
          opts: [
            { t: 'A word with her, and pay for the salmon', cost: 6, run(L, k) { L.karma(3); mentor(L, k, 8); rival(L, k, -5); return `It is her husband’s birthday, she says. He liked salmon, and he is dead. You walk her home. Sergeant ${k.M.last} says nothing for a street, and then says “Good.”`; } },
            { t: 'Book her: the law is the law', run(L, k) { perf(L, 4); L.karma(-3); rival(L, k, 10); mentor(L, k, -6); return `She cries at the station. ${k.R.first} says well done. Sergeant ${k.M.last} says nothing at all.`; } },
            { t: (L, k) => `Leave it to ${k.R.first}`, run(L, k) { rival(L, k, 5); L.karma(-1); return `${k.R.first} books her. Sergeant ${k.M.last} looks at you, not at ${k.R.first}, which you think about later.`; } },
          ],
        },
        {
          r: 1, icon: '🍺', title: 'After hours',
          text: (L, k) => `Gone midnight, and the lights are still on in the back bar of the Gull & Anchor: a lock-in. You can hear the landlord laughing, and ${k.M.name}, who is not on duty, laughing louder.`,
          opts: [
            { t: 'Knock on the door', run(L, k) { mentor(L, k, -4); perf(L, 3); L.karma(1); return `Everybody is very polite, and goes home. ${k.M.first} does not speak to you for a fortnight, then buys you a pint, at a proper hour, and says you did right.`; } },
            { t: 'Walk on by', run(L, k) { mentor(L, k, 4); return `It is a small town. You walk on. ${k.M.first} never mentions it, and nor do you.`; } },
            { t: 'Go in for one', odds: () => 0.65, run(L, k, win) { mentor(L, k, 6); if (win) { L.joy(3); return `One becomes three. ${k.M.first} tells stories about the old days that you could not possibly repeat, and you do not.`; } perf(L, -8); return 'The inspector, who lives over the chemist’s, sees you come out at two. It goes on your file, under “judgement”.'; } },
          ],
        },
        {
          r: 2, icon: '🚐', title: 'Thursday nights',
          text: () => 'The inspector takes you aside in the yard. A van comes in to the old ice house on Thursday nights, and it is not to be stopped. “Friends of friends,” he says. “It keeps the peace. There will be a little something at Christmas.”',
          opts: [
            { t: 'Go over his head', run(L, k) { L.karma(4); perf(L, -6); k.f.whistle = 1; return 'Two quiet men from the city take a very long statement. Then nothing happens for a long time, which is how these things go.'; } },
            { t: 'Do as you are told', run(L, k) { L.karma(-6); perf(L, 6); k.f.bent = 1; const n = bonus(L, 2); return `On Thursday nights you take the other road. At Christmas there is an envelope in your locker with ${n} in it, and a card with a robin on it.`; } },
            { t: 'Stop the van anyway', check: ['fitness', 50], run(L, k, win) { k.f.straight = 1; if (win) { L.karma(5); L.fame(2); perf(L, -8); return 'Forty cases of whisky with no duty paid, and two of Sal’s lads, very surprised. The inspector congratulates you in front of everyone, with cold eyes. You are on nights for a year.'; } L.karma(3); perf(L, -12); return 'The van is empty, the driver is polite, and by Monday you are on the night shift. Somebody told them you were coming.'; } },
          ],
        },
        {
          r: 3, icon: '🧊', title: 'The ice house',
          text: (L, k) => `The case against Lenny Drake, who drives for Sal, is nearly there and not quite. The inspector has a suggestion: a bag of something, found in Drake’s car, would close it by Friday.${k.f.bent ? ' He says it as if the two of you were old friends.' : ''}`,
          opts: [
            { t: 'Build it properly', check: ['smarts', 55], run(L, k, win) { if (win) { perf(L, 10); L.fame(3); L.karma(2); return 'Three months of statements, and a witness who needed a great deal of tea. Drake goes down for four years, and every word of it stands up.'; } perf(L, -4); return 'Three months of work, and then the witness goes to Spain. Drake walks out of court and waves at you.'; } },
            { t: 'Find the bag', odds: () => 0.6, run(L, k, win) { L.karma(-8); k.f.planted = 1; if (win) { perf(L, 8); return 'Drake goes down for four years for something he did not do, instead of the things he did. The inspector calls it a result.'; } perf(L, -10); return 'Drake’s lawyer asks why the bag has your fingerprints on the inside. The case is thrown out, and you are not, quite.'; } },
            { t: 'Wait for him to slip', run(L) { perf(L, -2); return 'He slips in the spring, on the coast road, drunk, with the boot full. Somebody else makes the arrest.'; } },
          ],
        },
        {
          r: 3, icon: '🕴️', title: 'Two men from the city',
          text: (L, k) => (k.f.bent || k.f.planted
            ? `Two officers from the city are in the inspector’s office with the door shut, and they want you next. They know about the Thursday van${k.f.planted ? ', and about the bag in Drake’s car' : ''}.`
            : k.M.dead ? 'Two officers from the city want you to give evidence against the inspector, about the Thursday van. The old sergeant knew all along, it turns out, and took it to the grave.' : `Two officers from the city want you to give evidence against the inspector, about the Thursday van, and against ${k.M.name}, who, it turns out, knew all along.`),
          opts: [
            { t: 'Tell them everything, and resign', show: (L, k) => !!(k.f.bent || k.f.planted), run(L, k) { L.karma(4); gaz(L, k, '{He} served in the police, and when it came to it, told the truth about the ice house and handed in {his} warrant card.'); sack(L, k, 'Resigned from the police, and told the inquiry everything.', { bar: EVER, why: 'Not with what the police know about you' }); return 'You tell them all of it. The inspector goes to prison; you go home, and do not go back.'; } },
            {
              t: 'Give them the inspector, and keep your head down', check: ['charm', 55], show: (L, k) => !!(k.f.bent || k.f.planted),
              run(L, k, win) {
                L.karma(-2);
                if (win) { perf(L, -6); return 'You give them the inspector, and they give you a second chance, with a look that says it is the last.'; }
                sack(L, k, `Dismissed from the police as ${k.title}.`, { bar: EVER, why: 'Not with what the police know about you' });
                L.s.n.crimes++; L.queue('busted', { what: 'an envelope with a robin on it, and your initials', sev: 2 });
                return 'They have the Christmas cards. All of them.';
              },
            },
            {
              t: 'Deny everything', odds: () => 0.4, show: (L, k) => !!(k.f.bent || k.f.planted),
              run(L, k, win) {
                if (win) return 'They go back to the city with nothing. The inspector retires, early, on a full pension.';
                sack(L, k, `Dismissed from the police as ${k.title}.`, { bar: EVER, why: 'Not with what the police know about you' });
                L.s.n.crimes++; L.queue('busted', { what: 'an envelope with a robin on it, and your initials', sev: 2 });
                return 'The inspector has already told them everything, mostly about you.';
              },
            },
            { t: (L, k) => (k.M.dead ? 'Give evidence' : 'Give evidence against them both'), show: (L, k) => !(k.f.bent || k.f.planted), run(L, k) { L.karma(5); mentor(L, k, -40); perf(L, 6); gaz(L, k, '{He} gave evidence against {his} own inspector, and was never forgiven for it at the station, nor ashamed of it.'); const rose = !k.top && up(L, k); return `The inspector goes to prison${k.M.dead ? '' : `, and ${k.M.first} loses ${k.M.his} pension`}. The station is a cold place for a while. ${rose ? `Then you are made ${L.jobTitle()}, into the hole they left.` : 'Then, slowly, it warms up.'}`; } },
            { t: (L, k) => `Against the inspector, and not ${k.M.first}`, check: ['charm', 50], show: (L, k) => !(k.f.bent || k.f.planted) && !k.M.dead, run(L, k, win) { if (win) { L.karma(3); perf(L, 6); mentor(L, k, 10); return `They take the inspector, and leave the old sergeant to ${k.M.his} allotment. ${k.M.first} never says thank you, and sends you a marrow every autumn.`; } perf(L, -6); return 'They want both or neither, and in the end they get neither. Nobody at the station is quite sure whose side you were on.'; } },
            { t: 'Refuse', show: (L, k) => !(k.f.bent || k.f.planted), run(L, k) { perf(L, -8); mentor(L, k, 5); L.karma(-2); return 'You will not do it. The inspector retires at Christmas with his pension and a carriage clock, and you are passed over for a long time.'; } },
          ],
        },
        {
          r: 4, icon: '⭐', title: (L, k) => (k.top ? 'The station on the High Street' : 'The chief’s chair'),
          text: (L, k) => (k.top
            ? 'The council wants to close the police station on the High Street and run Starling Bay from Kettleby, forty minutes away on a good day.'
            : `The Chief of Police is retiring, and the Police Committee meets on Tuesday. The other name on the list is ${k.R.name}. And the mayor has let it be known that a chief who took no great interest in the council’s accounts would find the committee very friendly.`),
          opts: [
            { t: 'Promise the mayor a quiet life', show: (L, k) => !k.top, run(L, k) { L.karma(-6); const rose = up(L, k); rival(L, k, -10); return `${rose ? `The committee is very friendly. You are ${L.jobTitle()}, and the council’s accounts are nobody’s business.` : 'The committee is very friendly, and says so, and asks you to wait a little.'}`; } },
            { t: 'Promise the committee the truth, about everybody', check: ['charm', 60], show: (L, k) => !k.top, run(L, k, win) { if (!win) { rival(L, k, -5); return `They choose ${k.R.first}. The mayor sends you a Christmas card anyway, which you take as a threat.`; } L.karma(3); const rose = up(L, k); gaz(L, k, '{He} rose to the top of the police in Starling Bay without owing the mayor a thing.'); return rose ? `You are ${L.jobTitle()}. The mayor does not come to the ceremony.` : 'They are impressed, and say so, and ask you to wait a year. The mayor sends a Christmas card, which you take as a threat.'; } },
            { t: (L, k) => `Back ${k.R.first} for it`, show: (L, k) => !k.top && !k.R.dead && k.R.v >= 15, run(L, k) { rival(L, k, 20); L.karma(2); return `${k.R.first} gets it, and asks you to be ${k.R.his} deputy on the first morning.`; } },
            { t: 'Fight to keep it', check: ['charm', 60], show: (L, k) => k.top, run(L, k, win) { if (win) { perf(L, 8); L.karma(4); L.fame(2); gaz(L, k, '{He} kept the police station on the High Street open when the council wanted it shut.'); return 'A petition, a march, and a front page of the Gazette with a photograph of the blue lamp. The station stays.'; } perf(L, -4); return 'It closes in the spring. The blue lamp goes to the museum, and you go to Kettleby on the bus.'; } },
            { t: 'Make it work', show: (L, k) => k.top, run(L, k) { perf(L, 4); L.karma(-3); return 'It saves money and costs everything else. The town goes on, more slowly, and calls Kettleby when it has to.'; } },
          ],
        },
      ],
    },

    // ---- chambers over the chemist's: a letter in a box, a will, and a man nobody will defend ----
    law: {
      party: 'Chambers over the chemist’s, with sherry in the good glasses and a great many speeches, all of them too long.',
      gift: 'your wig, in its tin box, with a card in the lid that says “At last”',
      ch: [
        {
          r: 0, icon: '📜', title: 'The wrong date',
          text: (L, k) => `Chambers is three rooms over the chemist’s. ${k.M.name} has been a barrister in Starling Bay for thirty years and has lost, by ${k.M.his} own count, four cases. ${k.R.name}, whose father is a judge, has put the wrong date in a brief that goes to court in the morning.`,
          opts: [
            { t: 'Fix it, and say nothing', run(L, k) { rival(L, k, 15); return `You change a 3 to an 8 and put the brief back on the pile. ${k.R.first} wins, finds out a month later, and does not know what to do about it.`; } },
            { t: (L, k) => `Tell ${k.M.first}`, run(L, k) { mentor(L, k, 8); rival(L, k, -20); perf(L, 3); return `${k.M.first} reads it, raises one eyebrow, and has ${k.R.first} in ${k.M.his} room for an hour. You are given better briefs after that, and colder looks.`; } },
            { t: 'Let it go to court', odds: () => 0.5, run(L, k, win) { if (win) return 'Nobody spots it. Nobody ever reads the dates.'; rival(L, k, -10); L.karma(-2); return `The other side spots it in the first five minutes. ${k.R.first} is mortified, and finds out afterwards that you had seen it.`; } },
          ],
        },
        {
          r: 1, icon: '📦', title: 'The letter in the box',
          text: () => 'Going through forty boxes for a case, you find a letter that sinks your own client: a builder who swears blind he was never told the roof was unsafe. He was told, in writing, twice.',
          opts: [
            { t: 'Hand it over to the other side', run(L, k) { L.karma(4); perf(L, -4); mentor(L, k, 8); return `Your client loses, and calls you things in the corridor. ${k.M.first} says it is the best thing you have done in chambers.`; } },
            { t: 'Put it back in the box', run(L, k) { L.karma(-6); perf(L, 6); k.f.buried = 1; return 'Your client wins, and buys the whole of chambers lunch. You do not eat much.'; } },
            { t: (L, k) => `Ask ${k.M.first}`, run(L, k) { mentor(L, k, 4); L.karma(3); perf(L, -2); return `${k.M.first} reads it twice, says “Well, there it is,” and walks it across to the other side’s chambers in ${k.M.his} slippers.`; } },
          ],
        },
        {
          r: 2, icon: '🐈', title: 'Of sound mind',
          text: () => 'Old Mrs Boase wants to leave everything to the cats’ home and nothing to her nephew. The nephew has been in first, with a good bottle, to ask whether his aunt is quite right in the head, and to say he would be grateful to anybody who thought not.',
          opts: [
            { t: 'Draw it up as she asks', run(L) { L.karma(3); return 'The cats’ home gets a new roof. The nephew contests the will, and loses, and you are there to see his face.'; } },
            { t: 'Suggest a doctor sees her first', run(L) { L.karma(1); perf(L, 2); return 'The doctor says she is sharper than the pair of you. The will stands, and nobody can argue with it.'; } },
            {
              t: 'Accept the nephew’s gratitude', odds: () => 0.7,
              run(L, k, win) {
                L.karma(-8);
                if (win) { const n = bonus(L, 4); return `The will is “reconsidered”. The nephew’s gratitude comes in an envelope: ${n}.`; }
                gaz(L, k, '{He} practised law in Starling Bay until the business of Mrs Boase’s will.');
                sack(L, k, 'Struck off as a solicitor, over Mrs Boase’s will.', { bar: EVER, why: 'Struck off the roll' });
                return 'The cats’ home has a lawyer too, and she is very good. You are struck off.';
              },
            },
          ],
        },
        {
          r: 3, icon: '🔥', title: 'Nobody will take it',
          text: () => 'The net lofts on the quay went up in March, and two boats with them. The whole town has decided it was Dennis Pook, a surly man who had words with half the fleet. Nobody in Starling Bay will defend him. The judge asks you.',
          opts: [
            { t: 'Take the case', run(L, k) { k.f.case = 1; L.joy(-3); for (const p of L.friends()) L.bond(p, -2); return 'The Gull goes quiet when you walk in. Somebody writes something on your car. You start reading the fire brigade’s report, slowly, every word.'; } },
            { t: 'Refuse it', run(L, k) { k.f.case = 0; mentor(L, k, -6); return `The judge finds somebody from the city, who meets his client once, on the steps. ${k.M.dead ? 'You can imagine what old ' + k.M.first + ' would have said.' : `${k.M.first} says nothing, in a way you can hear.`}`; } },
            { t: 'Take it, and get him to plead guilty', run(L, k) { k.f.case = 2; L.karma(-3); perf(L, 2); return 'It is quick, and quiet, and he goes down for six years, and the town buys you drinks.'; } },
          ],
        },
        {
          r: 3, y: 40, gap: 4, icon: '🏛️', title: (L, k) => (k.f.case === 1 ? 'The verdict' : 'The wiring'),
          text: (L, k) => (k.f.case === 1
            ? 'Day nine of the trial. The jury has heard the fire brigade, the coxswain and the man who sold Pook his matches. Now it is your turn, and the whole town is in the public gallery to watch you lose.'
            : `Two years on, an electrician from Kettleby admits that the wiring in the net lofts was his. Dennis Pook ${k.f.case === 2 ? 'has served two years of six, on your advice' : 'is two years into six, defended by a man from the city who met him once'}.`),
          opts: [
            { t: 'Tell them about the wiring', check: ['smarts', 60], show: (L, k) => k.f.case === 1, run(L, k, win) { if (win) { L.karma(8); L.fame(5); perf(L, 10); mentor(L, k, 8); gaz(L, k, '{He} defended Dennis Pook when nobody else in Starling Bay would, and was right to.'); return 'Not guilty. A month later an electrician from Kettleby admits the wiring was his. The town buys you drinks for a year, which is how it says sorry.'; } L.joy(-6); perf(L, -2); return 'Guilty. You are sure he did not do it. You start on the appeal that night.'; } },
            { t: 'Tell them about the man', check: ['charm', 60], show: (L, k) => k.f.case === 1, run(L, k, win) { if (win) { L.karma(8); L.fame(5); perf(L, 10); gaz(L, k, '{He} defended Dennis Pook when nobody else in Starling Bay would, and was right to.'); return 'You tell them about a lonely, rude, frightened man who has never been to a party. Not guilty. Pook shakes your hand on the steps, and says he still does not like you.'; } L.joy(-6); perf(L, -2); return 'Guilty. The jury liked you, and did not like him, and in the end that was what it came to.'; } },
            { t: 'Take on his appeal, for nothing', show: (L, k) => k.f.case !== 1, run(L, k) { L.karma(6); perf(L, 4); mentor(L, k, 6); return 'He is out by Christmas, with an apology from the court that he does not read. You buy him a pint. He does not say thank you, which is fair.'; } },
            { t: 'Keep out of it', show: (L, k) => k.f.case !== 1, run(L) { L.karma(-2); return 'Somebody else takes the appeal. Pook is out by Christmas. You cross the road when you see him.'; } },
          ],
        },
        {
          r: 3, icon: '🧑‍⚖️', title: (L, k) => (k.top ? 'In your own court' : 'The bench'),
          text: (L, k) => (k.top
            ? `${k.R.name} is in the dock in your court: fraud, two hundred thousand dollars of other people’s savings. By rights you should step aside. Nobody has asked you to.`
            : `There is a place on the bench, and the Lord Chancellor’s people have your name, and ${k.R.name}’s. The interview is in the city on Thursday, and they will want to know about everything.${k.f.buried ? ' Everything includes a builder’s roof, and a letter in a box.' : ''}`),
          opts: [
            { t: 'Tell them everything', check: ['charm', 55], show: (L, k) => !k.top, run(L, k, win) { if (k.f.buried) L.karma(4); if (!win) { rival(L, k, -5); return `They choose ${k.R.first}. The letter tells you that you were “a very strong second”, which is no use to anybody.`; } const rose = up(L, k); return `${rose ? `You are sworn in as ${L.jobTitle()} in the spring, in a wig that is far too big.` : 'They like you, and say so, and say there will be another place.'}${k.M.dead || !k.M.here ? '' : ` ${k.M.first} cries at the swearing-in, and blames the hay fever.`}`; } },
            { t: (L, k) => `Let ${k.R.first} have it`, show: (L, k) => !k.top && !k.R.dead && k.R.v >= 15, run(L, k) { rival(L, k, 20); L.karma(2); return `You withdraw on the Wednesday. ${k.R.first} finds out why, much later, and is a very good judge, partly out of embarrassment.`; } },
            { t: 'Stay at the bar, where the arguing is', show: (L, k) => !k.top, run(L, k) { perf(L, 4); L.joy(3); mentor(L, k, 4); return 'You withdraw your name. Judges have to be quiet, and you have never been quiet in your life.'; } },
            { t: 'Step aside', show: (L, k) => k.top, run(L, k) { L.karma(3); perf(L, 2); return 'Somebody else hears it. He is found guilty anyway, and sends you a letter from prison thanking you for stepping aside.'; } },
            { t: 'Sit, and be fair', check: ['smarts', 70], show: (L, k) => k.top, run(L, k, win) { if (win) { L.fame(2); perf(L, 6); gaz(L, k, '{He} sat as a judge in Starling Bay, and was fair even to people who had not been fair to {him}.'); return 'You are so careful that the appeal court cannot find a hair out of place. He goes down, and agrees, privately, that it was fair.'; } perf(L, -10); return 'The appeal court thinks you should have stepped aside, and says so, in a judgment the whole profession reads.'; } },
            { t: 'Sit, and settle the score', odds: () => 0.5, show: (L, k) => k.top, run(L, k, win) { L.karma(-10); rival(L, k, -40); if (win) return 'Seven years. You enjoy it more than a judge should, and it shows.'; sack(L, k, 'Removed from the bench.', { bar: EVER, why: 'Removed from the bench' }); return 'The appeal court finds that you should never have sat, and why you did. You are removed from the bench.'; } },
          ],
        },
      ],
    },
  };
}
