// New in Town: the townsfolk’s stories, and the favours they ask. Each of
// them has five chapters, told on cards (folk.js deals them out when you
// call and they know you well enough: need is the friendship it takes).
// Many chapters end in a favour: something to be done elsewhere in the town
// (a deed, done at a place) or something to bring them (a goal, handed over
// at their own place). A favour with by: has that many seasons to be done in.
//
// Old Marlow’s first three chapters, and Mrs Pargeter’s, are the stories
// already told elsewhere (his nets, his rod and the Peggy Sue in engine.js
// and events.js; her advice, her greenhouse and her seed tin in events.js):
// flag marks them, and they are counted, not told again.

import { CROPS, money } from './data.js';

// A choice that takes the favour on, one that turns it down, and one that
// simply moves the story on (gain: friendship; fn: anything else, and what to say).
const yes = (who, n, fav, t) => ({ t, run: (L) => L.folkAsk(who, n, fav) });
const no = (who, t, said) => ({ t, run: (L) => L.folkNo(who, said) });
const on = (who, n, gain, t, fn, extra = {}) => ({ t, ...extra, run(L, x, win) { const said = fn(L, win); L.folkStep(who, n, gain); return said; } });

export const STORIES = {
  hollis: [
    { need: 10, title: 'The thermometer', said: 'You rattled a tin for the church roof.', card: {
      icon: '🌡️', text: 'Outside St Brigid’s stands a board painted like a thermometer. The red has crept up to $12,000; the top says $40,000. "It is the roof," says the vicar. "It is always the roof. Would you rattle a tin for us on the High Street? People are kinder to a face they don’t know."',
      opts: [yes('hollis', 1, 'tin', 'Of course'), no('hollis', 'Not just now', 'She says she quite understands, and gives you a parish magazine for the road.')] } },
    { need: 25, title: 'A swarm', said: 'You fetched her bees out of the Town Hall porch. There is honey on your step every summer’s end.', card: {
      icon: '🐝', text: 'The vicar arrives at a run, in a veil. "My bees have swarmed," she says, "into the porch of the Town Hall. The mayor has locked himself in his office. If somebody does not fetch them out soon, he is going to call a man with a can."',
      opts: [yes('hollis', 2, 'swarm', 'Fetch them'), no('hollis', 'You are not a bee person', 'She goes herself, with a cardboard box and a prayer. You hear about it for weeks.')] } },
    { need: 45, title: 'Not another winter', said: 'You helped save the roof of St Brigid’s, and met Miss Achterberg over it.', card: {
      icon: '🏚️', text: 'The man from the diocese has been up the tower and come down shaking his head. The roof will not see another winter, and the fund is $6,000 short. The vicar is being brave about it, which is worse than if she cried.',
      opts: [
        on('hollis', 3, 8, 'Put $1,500 towards it', (L) => { L.karma(4); L.s.n.given = (L.s.n.given || 0) + 1500; L.folkIntro('achterberg'); return 'She hugs you, which surprises you both. With your cheque and a jumble sale the roofers are up the tower by the end of the month. At the jumble sale she introduces you to the librarian, Miss Achterberg, who is buying a hat she will never wear.'; }, { cost: 1500 }),
        yes('hollis', 3, 'swim', 'Do a sponsored swim from the cove'),
        no('hollis', 'There is nothing you can do', 'She says of course there isn’t, and the Lord will provide. He seems to be taking His time.'),
      ] } },
    { need: 65, title: 'Eleven years', said: 'She told you about Mr Featherstone the organist, who has been waiting eleven years for an answer.', card: {
      icon: '🎹', text: 'She has had a sherry, which she does not usually. "Mr Featherstone the organist," she says, "asked me to marry him eleven years ago. I said I would think about it." A pause. "I have been thinking about it." Another pause. "He plays wrong notes on purpose, you know, so as to have a reason to stay late and practise."',
      opts: [
        on('hollis', 4, 6, 'Tell her eleven years is long enough', () => '"Do you think so?" she says, and then, mostly to herself: "Yes. Yes, I suppose it is."'),
        on('hollis', 4, 4, 'Tell her to take all the time she needs', () => '"That is what I keep telling myself," she says. "He keeps telling me too. That is the trouble with kind men."'),
      ] } },
    { need: 85, title: 'A wedding at St Brigid’s', said: 'You read the lesson at her wedding. There is a brass plate with your name on the back pew.', card: {
      icon: '💒', text: 'The banns have been read three Sundays running, and the bishop himself is coming to do it, since a vicar cannot very well marry herself. She asks you to read the lesson.',
      opts: [
        on('hollis', 5, 6, 'Read it', (L, win) => {
          L.folkKeep('service');
          if (win) { L.fame(1); L.karma(2); L.joy(10); return 'You read it without a stumble, and look up at the end to find the whole church in tears, the bishop included. Mr Featherstone plays the wedding march without a single wrong note, which is how everybody knows how much it means.'; }
          L.joy(8);
          return 'You lose your place twice, and the second time the vicar mouths the next line at you from the altar. Nobody minds. Mr Featherstone plays one wrong note on purpose, to make you feel better.';
        }, { check: ['charm', 40] }),
      ] } },
  ],

  achterberg: [
    { need: 10, title: 'The rules', said: 'She gave you a library ticket, with two sides of rules, and you used it.', card: {
      icon: '📚', text: 'Miss Achterberg slides a card across the desk: a library ticket, with your name typed on it and two sides of rules on the back. "Use it," she says. "Read in the reading room. Three times, and I shall know you meant it."',
      opts: [yes('achterberg', 1, 'stacks', 'You will'), no('achterberg', 'You are not much of a reader', 'She takes the ticket back, and files it, under "Pending".')] } },
    { need: 25, title: 'The parish registers', said: 'You brought the parish registers back to the archives, in a tea towel.', card: {
      icon: '🗃️', text: 'The parish registers of St Brigid’s go back to 1580, and are supposed to live in the library archives. For some reason they live in the vicar’s vestry under a pot plant. Miss Achterberg would like them back, and would rather not go herself. "The vicar," she says, "will offer me sherry."',
      opts: [yes('achterberg', 2, 'registers', 'Fetch them'), no('achterberg', 'Not your fight', '"No," she agrees. "It is a war."')] } },
    { need: 45, title: 'Tempest at Tidewater Hall', said: 'You found her novel in the returns trolley. Her secret is safe with you.', card: {
      icon: '💌', text: 'In the returns trolley, between a book on drains and a book on bees, there is a typed manuscript: Tempest at Tidewater Hall, a novel, by R. A. The first line reads: "Lady Arabella had never seen a coastguard’s shoulders quite like it."',
      opts: [
        on('achterberg', 3, 8, 'Put it back on her desk, without a word', () => 'The next morning there is a cup of tea waiting for you on the reading room table. Nobody else, in the history of the library, has ever been given one.'),
        on('achterberg', 3, 6, 'Read it first', (L) => { L.joy(4); return 'You read all of it in the reading room, and she watches you do it from the desk, white as a sheet. At the end you look up and tell her it is good. It is good. She has to go and sit in the back office for a while.'; }),
        on('achterberg', 3, 10, 'Tell her you write too', () => 'You compare rejection letters. She has forty-one. You are suitably impressed, and she is suitably pleased that you are.', { show: (L) => (L.s.n.books || 0) >= 1 }),
        on('achterberg', 3, -6, 'Ask her about the coastguard', (L) => { L.karma(-1); return 'She takes the manuscript back without a word. The temperature in the library drops by several degrees, and stays there for some time.'; }),
      ] } },
    { need: 65, title: 'A brown paper parcel', said: 'You posted her manuscript to London, because her hand would not let go of it. She lent you the Admiralty pilot of 1820.', card: {
      icon: '📮', text: 'A publisher in London has asked to see the whole of her novel. It has been on her desk in brown paper and string for a fortnight. "I cannot post it," she says. "Every time I get to the box my hand will not let go. Would you?"',
      opts: [yes('achterberg', 4, 'post', 'Take it to the station'), no('achterberg', 'It should be her who posts it', '"Yes," she says. "It should." It stays on the desk.')] } },
    { need: 85, title: 'Published', said: 'Her novel came out under her own name, dedicated to you. She reads your drafts now.', card: {
      icon: '📕', text: 'A launch, in the library, with sherry, because the vicar insisted. Tempest at Tidewater Hall, by Ruth Achterberg: her own name on the cover after all. She signs your copy first. The dedication reads: For the reader in the reading room, who did not laugh.',
      opts: [
        on('achterberg', 5, 6, 'Make a little speech', (L, win) => {
          L.folkKeep('signed');
          if (win) { L.fame(0.5); L.joy(8); return 'You say she is the best-read woman in Starling Bay, and now the best-written. She says "Shh," and then cries a little, which nobody has ever seen.'; }
          L.joy(6);
          return 'You knock over the sherry. She says it is the most exciting thing that has ever happened in the library, and means it.';
        }, { check: ['charm', 35] }),
      ] } },
  ],

  windle: [
    { need: 10, title: 'Not a footpath', said: 'You found the 1952 map that proves the footpath was moved.', card: {
      icon: '🥾', text: 'There is a stile in Tom Windle’s bottom field, a sign the council put up saying PUBLIC FOOTPATH, and a sign Tom put up under it saying IS IT. "It was moved," he says. "In my father’s time. There’s a map at the Town Hall says so, if anybody could be bothered to look."',
      opts: [yes('windle', 1, 'map', 'You can be bothered'), no('windle', 'It is not a fight you want to be in', '"Nobody does," says Tom, darkly. "That’s how they win."')] } },
    { need: 25, title: 'Three in the morning', said: 'You helped Margaret the cow with a calf that was coming wrong. The calf is named after you.', card: {
      icon: '🐄', text: 'You are at the gate when Tom comes out of the cowshed at a run. "Margaret’s calving, and it’s coming wrong, and the vet’s in the next county. Roll your sleeves up."',
      opts: [
        on('windle', 2, 8, 'Roll them up', (L, win) => { if (win) { L.gain('craft', 1.5); return 'Two hours, a rope, and a great deal of language. Then a wet black calf on the straw, staggering up. Tom names her after you. She bites, like Gladys.'; } L.hp(-2, 'a cow'); return 'It comes right in the end, no thanks to you: you are kicked across the shed in the first ten minutes. Tom names the calf after you anyway, for the bruise.'; }, { check: ['craft', 30] }),
        on('windle', 2, 5, 'Hold the torch', () => 'You hold the torch, and the calf comes, and Tom says you held it very well, as torches go.'),
      ] } },
    { need: 45, title: 'Where the path went', said: 'Old Marlow remembered the old path, and the council dropped the case. You may fish Tom’s lake.', card: {
      icon: '🗺️', text: 'The council wants a witness that the path was moved, and the only man alive who would remember is old Marlow, who walked it to school. "He won’t talk to me," says Tom. "We had words in 1974. About a dog."',
      opts: [yes('windle', 3, 'path', 'Ask Marlow'), no('windle', 'Leave the two of them to it', '"Fifty years," says Tom. "Over a dog. Well. It was a good dog."')] } },
    { need: 65, title: 'Sweet peas', said: 'You grew sweet peas for Mary, as she used to.', card: {
      icon: '💐', text: '"Mary grew sweet peas," says Tom, out of nowhere, looking at the field. "Up the side of the house, every year. I can’t get them to take. I’ve tried." He does not ask. He would never ask.',
      opts: [yes('windle', 4, 'peas', 'Grow some for her'), no('windle', 'Say nothing', 'You say nothing. After a while, so does he.')] } },
    { need: 85, title: 'The bottom field', said: 'He signed the bottom field and the lake over to you, on condition the path stays open.', card: {
      icon: '📜', text: 'Tom Windle has been to the solicitor in town, in a tie. He puts a long envelope on the gate between you. "Bottom field," he says. "And the lake. My nephew would only sell them. They’re yours, now, on one condition: the path stays open."',
      opts: [
        on('windle', 5, 6, 'Take it, and promise', (L) => { L.karma(3); L.joy(10); L.folkKeep('deeds'); return 'You shake on it over the gate, which is the only way Tom will do anything. He grazes it still, and insists on paying you rent for it. "Proper," he says. "Or the nephew’ll have something to say."'; }),
      ] } },
  ],

  jess: [
    { need: 10, title: 'That’s your trouble', said: 'You settled an argument about a carburettor, after a fashion. Len took you to see the Rovers.', card: {
      icon: '🔧', text: 'Jess and Len are not speaking, which in practice means Len is pointing more. The argument is about a carburettor, and they would like you to settle it. Neither of them will tell you what the argument is.',
      opts: [
        on('jess', 1, 5, 'Side with Jess', (L) => { L.folkIntro('gaz'); return 'Len points at you, then at the door, then at the kettle. You are forgiven by the second cup, and on Saturday he takes you to see the Rovers, where he introduces you to Gaz, the manager, as "the one who’s wrong about carburettors".'; }),
        on('jess', 1, 4, 'Side with Len', (L) => { L.folkIntro('gaz'); return 'Jess looks at you for a long moment. "He’s right," she says. "Don’t tell him." Len takes you to see the Rovers on Saturday, and introduces you to Gaz, the manager.'; }),
        on('jess', 1, 6, 'Admit you know nothing about carburettors', (L) => { L.folkIntro('gaz'); return '"Thank God," says Jess. "An honest one." Len points at you approvingly, and on Saturday takes you to see the Rovers, where he introduces you to Gaz, the manager.'; }),
      ] } },
    { need: 25, title: 'Off the 4:15', said: 'You fetched a gearbox off the train. She looks after your car for mates’ rates.', card: {
      icon: '🚂', text: 'A gearbox is coming in on the 4:15 from the city for the vet’s Land Rover. Jess cannot leave the garage and Len cannot lift it. "It’s heavy," she says. "Bring a trolley. Bring a friend."',
      opts: [yes('jess', 2, 'gearbox', 'Fetch it'), no('jess', 'Not today', '"Dad," says Jess, "you’re going to have to point at it very hard."')] } },
    { need: 45, title: 'Most of its wheels', said: 'She built a car out of three dead ones, and let you have the first drive.', card: {
      icon: '🚗', text: (L) => (L.s.items.car || L.s.items.sportscar ? 'Jess has been building a little blue hatchback out of three dead ones, and wants somebody to take it for its first drive who will not mind if a door comes off.' : 'Jess has been building a little blue hatchback out of three dead ones. "It’s yours if you want it," she says. "Cost price. Five thousand, and you never tell anybody it was ever three cars."'),
      opts: [
        on('jess', 3, 6, 'Buy it', (L) => { L.folkCar(); L.joy(6); return 'You drive it off the forecourt with Len pointing you out all the way to the corner. It goes beautifully. One of the doors is a slightly different blue.'; }, { cost: 5000, show: (L) => !L.s.items.car && !L.s.items.sportscar }),
        on('jess', 3, 2, 'You will manage without', () => '"Your loss," says Jess. It goes to the vicar, who drives it everywhere in second gear.', { show: (L) => !L.s.items.car && !L.s.items.sportscar }),
        on('jess', 3, 6, 'Take it round the bay', (L) => { L.joy(6); return 'Round the bay and up the hill and back, with Jess in the passenger seat listening to the engine like a doctor with a stethoscope. Nothing falls off. "Huh," she says.'; }, { show: (L) => !!(L.s.items.car || L.s.items.sportscar) }),
      ] } },
    { need: 65, title: 'A letter from the city', said: 'A chain wanted to buy the garage, and you helped Len see it off.', card: {
      icon: '✉️', text: 'Len takes you to one side, which takes a while. A garage chain from the city has offered to buy Dobbs & Daughter. He has not told Jess. He would like you to look over the figures at the bank, quietly, before he does anything.',
      opts: [
        yes('jess', 4, 'ledgers', 'Go over the books at the bank'),
        on('jess', 4, 4, 'Tell Jess', () => 'Jess reads the letter, tears it in half, and puts the halves in Len’s tea. Len points at the tea, then at Jess, and then laughs until he has to sit down.'),
        no('jess', 'Keep out of it', 'Len nods slowly, and puts the letter in his top pocket, where it stays.'),
      ] } },
    { need: 85, title: 'Under new management', said: 'Len retired, and you made the speech. You have his pointing spanner.', card: {
      icon: '🪧', text: 'Len is retiring, properly, which means he will now sit in the same chair but on the other side of the door. There is a party on the forecourt, and Jess asks you to make the speech, because she will cry and Len will point.',
      opts: [
        on('jess', 5, 6, 'Make the speech', (L, win) => {
          L.folkKeep('spanner');
          const gift = L.folkCar() ? ' Afterwards Len gives you the keys to his old Rover, which he has not driven since 1998 and which Jess has secretly kept running all this time.' : (L.cash(2500), ' Afterwards Len gives you an envelope with $2,500 in it, "for petrol", and will not take it back.');
          if (win) { L.fame(0.5); L.joy(8); return `You tell the story of the carburettor, and the whole forecourt laughs, and Len points at you all the way through, delighted.${gift}`; }
          L.joy(6);
          return `You forget most of it and say "Len" a great deal. It does not matter. Len points at you at the end, which is a standing ovation.${gift}`;
        }, { check: ['charm', 40] }),
      ] } },
  ],

  quinn: [
    { need: 10, title: 'Crew’s short', said: 'You got fit enough for the shore crew, and signed on, in pencil.', card: {
      icon: '🛟', text: 'Captain Quinn looks you up and down the way she would look at a boat somebody wanted to sell her. "Crew’s short," she says. "Shore crew. Need to be fit." She nods at the slipway. "Fitness forty. Come back then."',
      opts: [yes('quinn', 1, 'crew', 'You will'), no('quinn', 'It is not your sort of thing', '"Aye," says Quinn. It is impossible to tell what she means by it.')] } },
    { need: 25, title: 'A shout', said: 'You went out on a shout with the lifeboat.', card: {
      icon: '📟', text: 'Two maroons go up over the cove, a bang and a white star. A yacht is on the rocks under Gorse Head and Captain Quinn is short-handed. She looks at you and jerks her head at the tractor.',
      opts: [
        on('quinn', 2, 8, 'Launch with them', (L, win) => { if (win) { L.karma(4); L.fame(1); L.joy(6); return 'Spray, dark, a rope, and a man in a red jacket hauled over the side like a wet sack. Back on the slipway at two in the morning, Quinn hands you a mug of tea and says "Well done." Two words. You frame them, in your head.'; } L.karma(2); L.hp(-4, 'the sea'); return 'You go over the side once yourself, and are hauled back by the scruff of the neck by Quinn, who does not mention it again, ever, which is worse.'; }, { check: ['fitness', 45] }),
        on('quinn', 2, 6, 'Work the radio on the shore', (L, win) => { L.karma(3); if (win) L.gain('smarts', 1); return win ? 'You keep the coastguard, the boat and the ambulance talking to each other all night. Quinn listens to the tape the next morning and nods once.' : 'You get the coastguard and the chip shop mixed up, briefly. Everybody is saved anyway.'; }, { check: ['smarts', 35] }),
      ] } },
    { need: 45, title: 'Raffle tickets', said: 'You sold the lifeboat raffle in the Gull & Anchor. You go out on exercise with the crew.', card: {
      icon: '🎟️', text: 'The lifeboat needs a new engine, the engine needs money, and the raffle needs selling. Quinn holds out a book of tickets as though it were something that had died. "Gull and Anchor," she says. "You talk. I don’t."',
      opts: [yes('quinn', 3, 'raffle', 'Sell them'), no('quinn', 'Talking is not your strong suit either', 'She looks at the book of tickets, and then at the sea, as though the sea might buy one.')] } },
    { need: 65, title: 'The Merrow', said: 'You asked old Marlow what happened the night the Merrow went down, and told her.', card: {
      icon: '⚓', text: 'Late, by the radio, she says more than you have ever heard her say. Her grandfather was the Merrow’s engineer, in 1961. They never found him. Nobody would ever tell her what happened that night. "Marlow was on the quay," she says. "He won’t talk to me. You ask him."',
      opts: [yes('quinn', 4, 'merrow', 'Ask him'), no('quinn', 'Some things are best left', '"Aye," says Quinn, and goes back to the radio.')] } },
    { need: 85, title: 'Grandfather’s medal', said: 'She gave you her grandfather’s lifeboat medal. You are proper crew now.', card: {
      icon: '🎖️', text: 'Captain Quinn gives you a small box. Inside, on a faded ribbon, is a lifeboat medal: her grandfather’s, for the winter of 1947. "Crew," she says. "Proper crew now. Yours." She goes before you can say anything, which is as well.',
      opts: [
        on('quinn', 5, 6, 'Wear it on the next shout', (L) => { L.gotCurio('medal'); L.folkKeep('crew'); L.karma(4); L.joy(8); return 'Your name goes up on the crew board at the station, in paint, not pencil. When you look, Quinn is pretending to be busy with a rope.'; }),
      ] } },
  ],

  marlow: [
    { flag: true, title: 'The nets', said: 'You helped him untangle his nets.' },
    { flag: true, title: 'A lesson', said: 'He taught you where the fish would rather be.' },
    { flag: true, title: 'The Peggy Sue', said: 'He offered you his boat, the Peggy Sue.' },
    { need: 55, title: 'Where the Merrow lies', said: 'You took him out to where the Merrow went down. He showed you his marks.', when: (L) => L.s.f.marlow === 3, card: {
      icon: '🌊', text: 'Marlow does not look at you. "March 1961," he says. "I was fourteen, on the quay. The Merrow went down off the Head with eleven men, and the lifeboat couldn’t get out past the bar." A long silence. "I’d like to see where she lies. Once. On a fair day. Before I can’t."',
      opts: [yes('marlow', 4, 'trip', 'Take him out'), no('marlow', 'Some other time', '"Aye," says Marlow. "Some other time." He says it as if there might not be many.')] } },
    { need: 85, title: 'The bell', said: 'He showed you the Merrow’s bell, which he raised in 1970 and never told a soul.', card: {
      icon: '🔔', text: 'Marlow takes you to his shed and pulls a tarpaulin off something in the corner. A ship’s bell, green with age: MERROW 1938. "Raised her in ’70, with a mate who’s gone now. Never told a soul. Nobody would have known what to do with it." He pats it. "You will."',
      opts: [
        on('marlow', 5, 6, 'Keep it safe', (L) => { L.gotCurio('bell'); L.folkKeep('merrow'); L.joy(8); return 'You carry it home between you on a wheelbarrow, through the whole of the High Street, and Marlow tells everybody who asks that it is a coal scuttle.'; }),
        on('marlow', 5, 6, 'Give it to the lifeboat station', (L) => { L.folkKeep('merrow'); L.karma(6); L.joy(8); if (L.folk('quinn').met != null) L.folkWarm('quinn', 10, false); return 'Captain Quinn hangs it on the station wall, beside the board of the lost, where it rings by itself in a south-westerly. She stands looking at it a long time. Marlow stands beside her. Neither of them says anything, and that is right.'; }),
      ] } },
  ],

  betty: [
    { need: 10, title: 'The seaweed scone', said: 'You tasted her seaweed scone, and she introduced you to Mr Pym.', card: {
      icon: '🧁', text: 'Betty puts a plate in front of you: a scone, faintly green. "Seaweed," she says. "It’s the coming thing. Be honest."',
      opts: [
        on('betty', 1, 6, 'Be honest', (L) => { L.folkIntro('pym'); return '"Thought so," says Betty, and puts the rest in the bin. "You’ll do, love. Honest is rare." Mr Pym from the curio shop comes in for his bun at eleven sharp, and she introduces you.'; }),
        on('betty', 1, 4, 'Have another', (L) => { L.folkIntro('pym'); return 'You have three. She is so pleased she puts them on the menu, where they stay, unbought, for eleven years. Mr Pym comes in for his bun at eleven sharp, and she introduces you.'; }),
      ] } },
    { need: 25, title: 'Fish pie Friday', said: 'You brought her two fish of your own catching. She feeds you for less.', card: {
      icon: '🥧', text: 'Betty’s fish man has retired, and the new one sells her fish she says she would not give a cat. "Bring us two fresh ones off your own line," she says, "and I’ll see you right."',
      opts: [yes('betty', 2, 'fishpie', 'Two fish for Betty'), no('betty', 'You do not fish', '"Shame," says Betty. "Fish pie’s off, then."')] } },
    { need: 45, title: 'A bare wall', said: 'Your painting hangs over the counter in Betty’s.', card: {
      icon: '🖼️', text: 'There is a pale square on the café wall where a picture of the old pier used to hang, before the damp got it. "Something local," says Betty, looking at you. "Something somebody local did."',
      opts: [yes('betty', 3, 'picture', 'Paint her something'), no('betty', 'You cannot paint', '"Nobody can, love," says Betty. "That’s never stopped anybody."')] } },
    { need: 65, title: 'All up here', said: 'You wrote her recipes down for her, in the library.', card: {
      icon: '📖', text: 'Betty tells you, very quietly, that she cannot read much. Never could. Forty years of recipes, every one of them in her head, and lately, she says, the head has been mislaying things. "Would you write them down? In the library, where nobody will see me telling you?"',
      opts: [yes('betty', 4, 'recipes', 'Of course'), no('betty', 'Suggest she asks her nephew', '"Him?" says Betty. "He puts ketchup on scones."')] } },
    { need: 85, title: 'Betty hangs up her apron', said: 'Betty has retired at last.', card: {
      icon: '☕', text: (L) => (L.folk('betty').shut
        ? 'Betty has been doing the teas in the church hall since the café went, and she has had enough of the urn. "There’s a shop come empty on the High Street," she says. "If somebody with a bit of money took it on, I’d come and do the baking, mornings, for nothing. Eight thousand would see it open."'
        : 'Betty is seventy, and her feet have voted. She is selling up. "I’d rather it went to somebody who knows what a scone should be," she says. "Eight thousand, and the recipes come with it. Or my nephew can have it, and do coffee in buckets."'),
      opts: [
        on('betty', 5, 6, 'Take on Betty’s', (L) => { L.s.biz = { type: 'food', lvl: 1, rep: 65, mgr: false, age: 0, at: L.s.t }; L.folkKeep('cafebell'); L.joy(10); L.note('Took on Betty’s Café.', 'big'); return 'Your name goes over the door, under hers, which stays. Betty comes in every morning at four to do the scones and tell the new girl she is doing it wrong. The café is yours to run: work in it on the High Street.'; }, { cost: 8000, show: (L) => !L.s.biz }),
        on('betty', 5, 6, 'Let her nephew have it', (L) => { L.folkKeep('cafebell'); L.joy(4); return 'The nephew has it, and does coffee in buckets, and it does rather well. On her last day Betty unscrews the brass bell from over the door and gives it to you. "Forty years that’s rung," she says. "Ring it now and then."'; }),
      ] } },
  ],

  pym: [
    { need: 10, title: 'The guide price', said: 'He taught you what things are worth. He introduced you to the mayor.', card: {
      icon: '🏷️', text: 'Mr Pym takes a willow-pattern plate from the window and hands it to you. "What would you give for that?" You say a number. He sighs, and then explains, for an hour, why it is the wrong number.',
      opts: [
        on('pym', 1, 5, 'Listen', (L) => { L.gain('smarts', 1.5); L.folkIntro('penn'); return 'By the end you could price a willow-pattern plate in your sleep, and do, for a week. The mayor comes in at closing to look at Georgian silver he cannot afford, and Mr Pym introduces you.'; }),
        on('pym', 1, 3, 'Say you came about the clocks', (L) => { L.folkIntro('penn'); return 'He shows you the clocks. All of them. He winds one, and it plays a hymn backwards. The mayor comes in at closing, and Mr Pym introduces you, over the hymn.'; }),
      ] } },
    { need: 25, title: 'Box lot', said: 'You bid at a sale for him with a straight face. He knocks a tenth off his window for you.', card: {
      icon: '📦', text: 'There is a sale on Market Square on Saturday, and a box lot of oddments Mr Pym wants. He cannot be seen bidding for it himself. "They know me," he says darkly. "They put the price up."',
      opts: [yes('pym', 2, 'boxlot', 'Bid for him'), no('pym', 'Not your sort of thing', '"No," says Mr Pym. "I can see that it is not."')] } },
    { need: 45, title: 'The stern captain', said: 'He showed you the portrait he keeps turned to the wall: his great-grandfather, hanged for smuggling.', card: {
      icon: '👨‍✈️', text: 'After closing, Mr Pym shows you a portrait he keeps turned to the wall: a stern sea captain in a blue coat. "My great-grandfather," he says. "Hanged for smuggling at Gorse Head, in 1841. The family never spoke of it. I have never shown anyone."',
      opts: [
        on('pym', 3, 8, 'Say he has the same eyebrows', () => 'He looks at the portrait, then at himself in the glass of a clock. "So I have," he says, and laughs, really laughs, for the first time you have heard.'),
        on('pym', 3, 6, 'Ask what he smuggled', () => 'Brandy, lace and, on one occasion, a bishop. Mr Pym tells you the whole story, with relish, until gone midnight.'),
      ] } },
    { need: 65, title: 'A house on the cliff road', said: 'You helped him clear a cottage on the cliff road, and found something under the stairs.', card: {
      icon: '🏚️', text: 'An old lady has died in a cottage on the cliff road, and Mr Pym has been asked to clear it. "Her nephew wants it done by Friday," he says. "I want it done properly. Those are not the same thing. Will you help?"',
      opts: [yes('pym', 4, 'clearance', 'Help him'), no('pym', 'Not this time', 'He goes alone, and comes back three days later with a cold and a stuffed pike.')] } },
    { need: 85, title: 'The captain comes down', said: 'He retired, more or less, and gave his great-grandfather a better wall. He gives you a fair price now.', card: {
      icon: '🖼️', text: 'Mr Pym is retiring, he says, which means he will open three days a week instead of six. He takes down the portrait of the stern captain and puts it in your arms. "He should hang somewhere he is not ashamed of," he says. "And you will want a fair price, now and then. You shall have one."',
      opts: [
        on('pym', 5, 6, 'Take the captain home', (L) => { L.gotCurio('captain'); L.joy(8); return 'He hangs on your wall now, glaring at visitors. Mr Pym comes round once to see him, and stands in front of him for a long time with his hat in his hands.'; }),
        on('pym', 5, 8, 'Hang him in the shop window, where he belongs', (L) => { L.karma(3); L.joy(6); return 'You hang him in the window, facing the street, with a card underneath in Mr Pym’s hand: CAPTAIN JOSIAH PYM, SMUGGLER. NOT FOR SALE. People come from three towns away to look at him.'; }),
      ] } },
  ],

  parg: [
    { flag: true, title: 'A shadow on the beans', said: 'She looked over your allotment, and you asked her advice.' },
    { flag: true, title: 'The greenhouse', said: 'You helped her rebuild her greenhouse.' },
    { flag: true, title: 'An old tobacco tin', said: 'She gave you forty years of saved seed.' },
    { need: 55, title: 'Mr Pargeter’s potatoes', said: 'You grew potatoes from her seed, exactly as Mr Pargeter did. The strip of plot 9 by your fence is yours.', when: (L) => L.s.f.parg === 3, card: {
      icon: '🥔', text: 'Mrs Pargeter wants to see what you have done with her seed. "Potatoes," she says. "Pink Fir Apple. Mr Pargeter’s. Grow me a bed, and bring me one, and I shall know whether to trust you with the rest."',
      opts: [yes('parg', 4, 'spuds', 'Grow her a bed of potatoes'), no('parg', 'Not this year', '"Next year, then," she says, in a voice that means this year.')] } },
    { need: 85, title: 'The Pargeter Cup', said: 'She gave the Harvest Show a cup, and gave you her greenhouse.', card: {
      icon: '🏆', text: 'Mrs Pargeter has given the Harvest Show a cup: silver, very large, engraved THE PARGETER CUP FOR LEEKS. "Mr Pargeter’s leeks," she says. Then she gives you the key to her greenhouse. "My knees won’t do the glass any more. The onion man has offered to carry it over to your plot. I have told him he may."',
      opts: [
        on('parg', 5, 6, 'Promise to win the cup', (L) => { L.folkKeep('hoe'); L.joy(8); return 'The greenhouse goes up beside your shed in a weekend, the onion man carrying and Mrs Pargeter supervising from a deckchair. Everything in it does better. She gives you her hoe as well, "on loan", which means for ever.'; }),
      ] } },
  ],

  gaz: [
    { need: 10, title: 'A man short', said: 'You turned out for the Rovers when they were a man short. Desmond did the announcements.', card: {
      icon: '⚽', text: 'Gaz grabs your arm on the touchline. "Lenny’s done his hamstring getting off the bus. You’ve got legs. Have you got boots? Never mind. You’ve got legs."',
      opts: [
        on('gaz', 1, 7, 'Get changed', (L, win) => { L.folkIntro('desmond'); if (win) { L.fame(0.5); L.joy(8); return 'Eighty-ninth minute, a corner, and a header that is mostly your face. It goes in. Gaz runs the length of the pitch and lies down in the centre circle. Desmond Achebe, who does the announcements, calls you "a revelation", and introduces himself afterwards.'; } L.joy(4); return 'You touch the ball twice, both times by accident, and the Rovers lose four–nil. Gaz says you were the best player on the pitch, and he believes it. The announcer, Desmond Achebe, introduces himself afterwards and says you have stage presence, which is no help on a football pitch.'; }, { check: ['fitness', 35] }),
        on('gaz', 1, 3, 'Make your excuses', (L) => { L.folkIntro('desmond'); return 'Gaz plays himself. He is forty-four and has a knee. They draw one–all, and he scores, and cannot walk for a week. In the clubhouse afterwards he introduces you to Desmond Achebe, who does the announcements.'; }),
      ] } },
    { need: 25, title: 'New shirts', said: 'You got Lighthouse Labs to sponsor the shirts. You watch the Rovers for nothing.', card: {
      icon: '👕', text: 'The Rovers’ shirts are older than some of the players, and see-through in the rain. Gaz has heard the people at Lighthouse Labs have money. "You talk to them," he says. "They’ll only give me a lanyard."',
      opts: [yes('gaz', 2, 'shirts', 'Talk to them'), no('gaz', 'It is not your department', '"Nobody’s department," says Gaz. "That’s the trouble with football."')] } },
    { need: 45, title: 'Between the posts', said: 'You found the Rovers a goalkeeper in the Gull & Anchor, and they stayed up.', card: {
      icon: '🧤', text: 'The Rovers’ goalkeeper has retired at fifty-four, and there is a relegation decider in a fortnight. "Anybody tall," says Gaz. "Anybody brave. Anybody at all, really. Try the Gull and Anchor."',
      opts: [yes('gaz', 3, 'keeper', 'Find him a keeper'), no('gaz', 'You cannot help', 'He goes in goal himself. They lose six–nil, and he says he has never been prouder.')] } },
    { need: 65, title: 'The trial', said: 'He told you about the trial he never had, and chose the Rovers anyway.', card: {
      icon: '🩼', text: 'Gaz shows you an old cutting: SCHOOLBOY KOWALSKI FOR TRIAL WITH CITY. "Broke my leg the week before," he says. "Never got another." He folds it away. "City want me back. Coaching the youth team. Proper money." He has not told the Rovers.',
      opts: [
        on('gaz', 4, 6, 'Tell him to go', () => 'He goes for a week, and comes back. "They had a nutritionist," he says, appalled. "No pies." He is the Rovers’ manager for life now, by his own choice, which is different.'),
        on('gaz', 4, 6, 'Ask him to stay', () => 'He stays. "Somebody has to believe," he says, and eats a pie as though it were a promise.'),
      ] } },
    { need: 85, title: 'The County Cup', said: 'You gave the team talk at the County Cup final. Your name is on the honours board.', card: {
      icon: '🏆', text: 'The Rovers are in the final of the County Cup for the first time since 1987. Gaz asks you to give the team talk. "I’ll only cry," he says, "and they’ve seen that."',
      opts: [
        on('gaz', 5, 6, 'Give the team talk', (L, win) => {
          L.folkKeep('ball');
          if (win) { L.fame(2); L.joy(12); return 'You tell them about 1987, and the ball boy who still has the ball. They win two–one. Gaz is carried round the pitch by a fifty-four-year-old goalkeeper, and afterwards he gives you the ball from 1987, signed by both teams. Your name goes on the honours board, under "Team talk".'; }
          L.joy(8);
          return 'You forget everything you meant to say and shout "Come on!" several times. They lose on penalties, and it is still the best day of Gaz’s life. He gives you the ball from 1987, and your name goes on the honours board anyway.';
        }, { check: ['charm', 45] }),
      ] } },
  ],

  desmond: [
    { need: 10, title: 'An audition', said: 'You auditioned for the Pavilion Players. Priya does the costumes.', card: {
      icon: '🎭', text: 'Desmond has decided you will audition for the winter show, and Desmond’s decisions are like the tide. He hands you a speech. "From the top," he says. "With feeling. Any feeling."',
      opts: [
        on('desmond', 1, 7, 'Give it everything', (L, win) => { L.folkIntro('priya'); if (win) { L.gain('charm', 1.5); L.joy(4); return 'He listens with his eyes shut. At the end there is a long pause. "Second Fishwife," he says. "And understudy for the First. I understudied, you know." The costumes are by Priya Lal of the cheese stall, who measures you as if you were a wheel of Cheddar.'; } return 'You dry halfway through. "Everyone dries," says Desmond kindly. "I once dried in the West End. In the wings. During somebody else’s speech." Priya Lal of the cheese stall, who does the costumes, gives you a consoling piece of Wensleydale.'; }, { check: ['charm', 35] }),
        on('desmond', 1, 4, 'Offer to paint the scenery instead', (L) => { L.gain('craft', 1); L.folkIntro('priya'); return 'You paint a forest. It looks like broccoli, but very good broccoli. Priya Lal of the cheese stall, who does the costumes, says so.'; }),
      ] } },
    { need: 25, title: 'Posters', said: 'You put up his posters along the High Street. You rehearse with the Players.', card: {
      icon: '📜', text: 'The summer play opens in a fortnight and nobody knows, because the posters are still in a box in Desmond’s office. "The High Street," he says. "Every window. Charm them. I would, but they know me."',
      opts: [yes('desmond', 2, 'posters', 'Put them up'), no('desmond', 'It is not your sort of thing', '"Nobody’s sort of thing," says Desmond. "That is why it is theatre."')] } },
    { need: 45, title: 'The stage door', said: 'He told you the truth about the West End. You have kept it.', card: {
      icon: '🤫', text: 'After a show, in the empty bar, Desmond has had two brandies. "I never understudied in the West End," he says. "I was the stage-door keeper. At the Strand. Eleven years. I watched every performance from the corridor." He looks at you. "Nobody here knows."',
      opts: [
        on('desmond', 3, 9, 'Say the stage door is the best seat in the house', () => 'He looks at you for a long time, then laughs the big laugh, the one from the panto. "It is," he says. "It really is."'),
        on('desmond', 3, 7, 'Promise to keep it to yourself', (L) => { L.karma(1); return '"Thank you," he says, and then, recovering: "Of course, I also understudied."'; }),
      ] } },
    { need: 65, title: 'A play about the Merrow', said: 'Old Marlow came to tell the Players about the Merrow.', card: {
      icon: '✒️', text: 'Desmond has written a play at last: about the wreck of the Merrow in 1961, and the night the lifeboat could not get out. "But I have it from the newspapers," he says. "I need it from somebody who was there. Marlow was there. Will you ask him to come and talk to us?"',
      opts: [yes('desmond', 4, 'marlowTalk', 'Ask Marlow'), no('desmond', 'It is not your story to ask for', '"No," says Desmond, after a while. "Perhaps it is not mine, either."')] } },
    { need: 85, title: 'Opening night', said: 'The Merrow opened at the Pavilion, and you were in it.', card: {
      icon: '🌹', text: 'The Merrow opens at the Pavilion. Every seat is sold; Marlow is in the front row in his tie. And the man playing the coxswain has lost his voice, and Desmond is looking at you.',
      opts: [
        on('desmond', 5, 6, 'Go on', (L, win) => {
          L.folkKeep('poster');
          if (win) { L.fame(4); L.joy(12); return 'You get through it on nerve and Desmond whispering from the prompt corner. At the end there is silence, and then the whole Pavilion is on its feet, and Marlow is crying, and so is Desmond, and so, it turns out, are you.'; }
          L.fame(2); L.joy(8);
          return 'You miss a cue, then another, and then the lines come back and you mean every one of them. The Gazette calls it "raw". Desmond frames the review.';
        }, { check: ['charm', 50] }),
        on('desmond', 5, 6, 'Let Desmond go on', (L) => { L.folkKeep('poster'); L.joy(8); return 'Desmond plays the coxswain himself, script in hand, and is magnificent. "I understudied," he says afterwards, and for once it is perfectly true.'; }),
      ] } },
  ],

  priya: [
    { need: 10, title: 'The marrow man', said: 'You held the marrow while she settled a dispute.', card: {
      icon: '🥒', text: 'There is a row in Market Square over a pitch by the fountain: the record man says it has been his since 1979, the marrow man says it is his because he is standing on it. Priya hands you the marrow. "Hold this," she says. "Don’t let him have it."',
      opts: [
        on('priya', 1, 7, 'Hold the marrow', (L, win) => { L.joy(3); return win ? 'You hold it for forty minutes. Priya settles it: they share the pitch on alternate Saturdays, and the marrow is sold to a tourist.' : 'You drop it. It does not break, which says something about the marrow. Priya settles it anyway.'; }, { check: ['fitness', 30] }),
        on('priya', 1, 7, 'Make the peace yourself', (L, win) => { if (win) L.gain('charm', 1); return win ? 'You suggest alternate Saturdays. Both of them say it was their idea. Priya looks at you with new respect.' : 'Both of them turn on you. Priya settles it in thirty seconds while they are busy doing that.'; }, { check: ['charm', 40] }),
      ] } },
    { need: 25, title: 'Fresh from the plot', said: 'You brought her vegetables you grew yourself. She sells the best of your crops on her stall.', card: {
      icon: '🧺', text: '"Everything at the veg end comes from a wholesaler in the city," says Priya, with disgust. "Bring me something you grew yourself. If it’s good, I’ll take the best of all you grow, every year."',
      opts: [yes('priya', 2, 'veg', 'Bring her something'), no('priya', 'You do not grow anything', '"Everybody grows something," says Priya. "Even if it is only older."')] } },
    { need: 45, title: 'The council', said: 'You spoke up for the market at the council meeting.', card: {
      icon: '🏛️', text: 'The council wants to charge every stall in Market Square a pitch fee, which would close half of them. There is a meeting at the Town Hall. "I can’t speak," says Priya. "I’ll shout. Will you?"',
      opts: [yes('priya', 3, 'council', 'Speak up for the market'), no('priya', 'It is not your fight', '"It is everybody’s fight," says Priya. "That is the trouble with it."')] } },
    { need: 65, title: 'Twelve years in chambers', said: 'She told you she was a barrister in London, once.', card: {
      icon: '⚖️', text: 'Closing up, Priya tells you something nobody in the square knows. She was a barrister in London for twelve years, and a good one, and one day in court she found she could not remember why. She came to Starling Bay for a weekend and bought a cheese stall the same afternoon. "My mother thinks I am still in chambers," she says. "She writes to me there. A friend sends the letters on."',
      opts: [
        on('priya', 4, 6, 'Tell her she should tell her mother', () => '"You sound like my mother," she says. A month later her mother comes to stay, buys a deckchair, and is running the egg end of the market within a week.'),
        on('priya', 4, 8, 'Keep her secret', () => '"Thank you," she says, and gives you a cheese you could not afford if you saved for a year.'),
      ] } },
    { need: 85, title: 'The fountain', said: 'You found the fountain’s plans, and it played for the first time since 1912.', card: {
      icon: '⛲', text: 'Nobody alive has seen the fountain in Market Square working. Priya has decided that this is the year. "The plans will be in the town archives," she says. "If Miss Achterberg lets anybody near them."',
      opts: [yes('priya', 5, 'plans', 'Find the plans'), no('priya', 'Some things are better as they are', '"A dry fountain is not a thing," says Priya. "It is a seat."')] } },
  ],

  penn: [
    { need: 10, title: 'A photograph', said: 'You were in the Gazette, shaking his hand. He introduced you to the vicar.', card: {
      icon: '📸', text: (L) => (L.folkPennOut() ? 'Mr Pennington, who used to be mayor, would like to be photographed with you for the Gazette’s "Where are they now?" column. "Shake my hand," he says, "and look as if I am still somebody."' : 'The Gazette is doing a piece on newcomers to Starling Bay, and the mayor would like to be photographed welcoming one. You will do. "Shake my hand," he says, "and look grateful."'),
      opts: [
        on('penn', 1, 5, 'Look grateful', (L) => { L.fame(0.3); L.folkIntro('hollis'); return 'The photograph is on page four: him beaming, you looking grateful and slightly alarmed. Your mother cuts it out. Outside, he introduces you to the vicar, who has been waiting for him with a collecting tin.'; }),
        on('penn', 1, 2, 'Look unimpressed', (L) => { L.joy(2); L.folkIntro('hollis'); return 'They print it anyway. You look like somebody being handed a parking ticket. People stop you in the street to say well done. Outside, he introduces you to the vicar, who has been waiting for him with a collecting tin.'; }),
      ] } },
    { need: 25, title: 'A letter for Windle Farm', said: 'You took a letter up to Tom Windle that nobody else would carry.', card: {
      icon: '✉️', text: (L) => (L.folkPennOut() ? 'Mr Pennington has written to Tom Windle about the footpath: an apology, thirty years late. He cannot face taking it up the hill himself. "You seem," he says, "the sort of person a farmer would not stab."' : 'The council has a letter for Tom Windle about the footpath, and no officer of the council will take it up the hill since the business with the pitchfork. "You seem," says the mayor, "the sort of person a farmer would not stab."'),
      opts: [yes('penn', 2, 'letter', 'Take it'), no('penn', 'Not on your life', '"No," he says. "No, I suppose not. I shall post it, and hope."')] } },
    { need: 45, title: 'The chain', said: 'He told you he had always wanted to be a vet.', card: {
      icon: '⛓️', text: (L) => (L.folkPennOut() ? 'Late, in his front room, Mr Pennington shows you the photograph of himself in the chain of office. "My father wore it, and his father," he says. "I never once enjoyed it. In a way I was glad when it was over. I wanted to be a vet."' : 'In the parlour, late, the mayor takes off the chain of office and puts it on the desk between you. "My father wore it, and his father," he says. "I have never once enjoyed it. I wanted to be a vet."'),
      opts: [
        on('penn', 3, 8, 'Say it is not too late', () => 'He laughs. Then he stops laughing, and is quiet for a while. The next week he is seen at the vet’s on a Saturday morning, in an apron, holding a Labrador very carefully.'),
        on('penn', 3, 6, 'Say the town needs him', () => 'He straightens his tie. "Yes," he says. "I suppose it does. Somebody has to cut the ribbons."'),
      ] } },
    { need: 65, title: 'The appeal', said: 'You led the way with the town’s appeal, and forty people followed.', card: {
      icon: '🏗️', text: '"Nobody gives," he says, "until they see somebody they know give first. A thousand dollars, to the town, to anything: the food bank, the appeal, the lifeboat. It is the example that counts."',
      opts: [yes('penn', 4, 'appeal', 'Lead by example'), no('penn', 'It is not your money to throw about', '"Quite right," he says. "Mine either. That was rather the trouble, once."')] } },
    { need: 85, title: 'The freedom of the town', said: 'You were given the Freedom of Starling Bay, the first since 1946.', card: {
      icon: '📜', text: (L) => `In the council chamber, in front of everybody, ${L.folkPennOut() ? 'Mr Pennington, asked back for the day as the oldest former mayor,' : 'the mayor'} reads from a scroll: the Freedom of Starling Bay, the first given since 1946, and it goes to you. It entitles you, he explains, to graze sheep on the green and to be rude to the mayor. "Use the second sparingly," he says.`,
      opts: [
        on('penn', 5, 6, 'Accept it', (L) => { L.karma(5); L.fame(3); L.joy(10); L.folkKeep('freedom'); return 'The whole chamber stands. People you have never spoken to nod to you in the street for weeks afterwards, and call you by name, and the feeling does not wear off.'; }),
      ] } },
  ],
};

// A second chance with Mrs Pargeter, for anybody who started badly with her
// (or left her standing in her broken greenhouse).
export const PARG_AGAIN = {
  need: 25, icon: '🏚️', title: 'The shed', text: 'Mrs Pargeter’s shed has blown over in the night, onto her runner beans. She is standing looking at it with her arms folded. She has not asked anybody to help, and she will not.',
};

// ---- the townsfolk in the rest of your life: cards that turn up by chance ---------------

// Somebody you know well enough (n: how well) who is not cross with you.
const aFriendOf = (n) => (L) => { const ids = Object.keys(STORIES).filter((id) => L.folk(id).f >= n && !L.folkShut(id)); return ids.length ? L.pick(ids) : null; };
const has = (n) => (L) => Object.keys(STORIES).some((id) => L.folk(id).f >= n && !L.folkShut(id));
const BRINGS = {
  hollis: 'a jar of honey, a casserole and a leaflet about the roof', achterberg: 'three library books she has chosen for you, and a look that says they are due back on Tuesday',
  windle: 'a dozen eggs and a bottle of something that will either cure you or not', jess: 'a flask of Len’s tea, which could strip paint', quinn: 'a thermos, and no conversation at all, which is exactly right',
  marlow: 'a mackerel and a story', betty: 'a pan of soup the size of a bucket', pym: 'a Victorian hot-water bottle, on loan', parg: 'a basket of whatever is in season, and an opinion of your guttering',
  gaz: 'two meat pies and last Saturday’s programme', desmond: 'grapes, and a dramatic reading', priya: 'a cheese that will make you feel better or worse, quickly', penn: 'a signed photograph of himself, framed',
};
export const CHANCES = [
  {
    id: 'fk_visit', icon: '🧺', title: 'A knock at the door', w: 3, cd: 12,
    when: (L) => (!!L.s.ill || L.s.happy < 30) && has(20)(L), ctx: aFriendOf(20), ok: (L, x) => !!x && L.folk(x).f > 0,
    text: (L, x) => `${L.folkName(x)} has heard you are ${L.s.ill ? 'poorly' : 'low'}, and is on your doorstep with ${BRINGS[x]}.`,
    opts: [
      { t: 'Let them in', run(L, x) { L.hp(L.s.ill ? 4 : 1); L.joy(6); L.folkWarm(x, 4); L.folk(x).seen = L.s.t; return 'An hour, a pot of tea, and you are made to sit down and be looked after. You feel better before the door has shut behind them.'; } },
      { t: 'Say you are fine, through the letterbox', run(L, x) { L.folkWarm(x, -2); return 'They leave it on the step and go. You are not fine. You eat it all.'; } },
    ],
  },
  {
    id: 'fk_lane', icon: '🐑', title: 'Over the lane', w: 3, cd: 16,
    when: (L) => L.s.wx === 'wet' && L.folk('windle').f >= 10 && !L.s.gaol,
    text: 'A week of rain, and the lane up to Windle Farm is a river. Tom Windle’s sheep are on the wrong side of it, and Tom is on the right side, swearing.',
    opts: [
      { t: 'Wade in and help', check: ['fitness', 35], run(L, x, win) { L.folk('windle').seen = L.s.t; if (win) { L.folkWarm('windle', 6); L.karma(2); L.gain('fitness', 1); return 'Two hours up to your thighs in brown water, and forty-one sheep on the right side. Tom counts them twice and says "Forty-one." It is thanks.'; } L.folkWarm('windle', 4); L.hp(-3, 'a chill'); return 'You fall in. Twice. The sheep get across on their own in the end, mostly by walking round you.'; } },
      { t: 'Stay dry', run(L) { L.folkWarm('windle', -1); return 'Tom gets them across with a dog and a great deal of language. He sees you watching from the bridge.'; } },
    ],
  },
  {
    id: 'fk_lights', icon: '💡', title: 'The floodlights', w: 3, cd: 16,
    when: (L) => L.folk('gaz').f >= 10 && L.s.cash + L.s.bank >= 600,
    text: 'Gaz is outside the clubhouse with a bucket. The Rovers cannot pay the electricity, and the floodlights go off on Friday unless somebody finds $500.',
    opts: [
      { t: 'Find the $500', cost: 500, run(L) { L.folkWarm('gaz', 6); L.karma(2); L.s.n.given = (L.s.n.given || 0) + 500; L.folk('gaz').seen = L.s.t; return 'The lights stay on for Friday. Gaz names a stand after you. It is a bench, but it is a stand to Gaz.'; } },
      { t: 'Put a twenty in the bucket', cost: 20, run(L) { L.folkWarm('gaz', 1); return '"Every little helps," says Gaz, and means it. They play Friday’s match by the light of the car park.'; } },
      { t: 'Walk on', run(L) { L.folkWarm('gaz', -2); return 'You hear the bucket rattle behind you all the way down the hill.'; } },
    ],
  },
  {
    id: 'fk_cell', icon: '🫖', title: 'Visiting hour', w: 4, cd: 6, gaol: true,
    when: has(20), ctx: aFriendOf(20), ok: (L, x) => !!x,
    text: (L, x) => `Visiting hour. Across the table, in a coat still wet from the bus, is ${L.folkName(x)}.`,
    opts: [
      { t: 'Talk until the bell', run(L, x) { L.joy(6); L.folkWarm(x, 3); L.folk(x).seen = L.s.t; return x === 'hollis' ? 'The vicar does not ask what you did. She tells you about the roof instead, and the bees, and you laugh for the first time in weeks. The cake she brought is searched, and has nothing in it but cake.' : `${L.folkName(x)} does not ask what you did, and tells you what the town has been up to instead. You laugh for the first time in weeks.`; } },
    ],
  },
];

// ---- the favours ------------------------------------------------------------------------

// at: where a deed is done (a goal is handed over at the person’s own place).
// time, cost: what it takes. why: anything that stands in the way.
// check: the skill that decides how well it goes (it always gets done).
// goal(L, f): how far along it is: { have, want, text }. take(L): what is
// handed over. done(L, win): the reward, and what to say. gain: friendship.
// set: what is said when it is taken on.
const odd = (L, sets) => L.gotCurio(L.anyCurio(sets));
const fresh = (L) => L.folkFish();
const vegNow = (L) => L.folkVeg();

export const FAVOURS = {
  tin: { who: 'hollis', icon: '🥫', title: 'Rattle the roof tin on the High Street', at: 'highstreet', time: 1, gain: 6, check: ['charm', 35],
    set: 'She gives you a tin with a slot in the lid and a label that says ROOF, underlined twice.',
    done(L, win) { L.karma(2); return win ? 'Three hours outside the bank with the tin. A little girl gives you her pocket money, a man in a suit gives you a twenty, and Mr Pym gives you a lecture on roofs and a dollar. $412 for St Brigid’s.' : 'Three hours outside the bank. People cross the road to avoid you, which on the High Street is a feat. $38 and a button for St Brigid’s. The vicar is thrilled anyway.'; } },
  swarm: { who: 'hollis', icon: '🐝', title: 'Fetch the vicar’s swarm out of the Town Hall porch', at: 'townhall', time: 1, by: 2, gain: 6, check: ['craft', 30],
    set: '"A cardboard box," she says, "a sheet, and no sudden movements. And do not let the mayor help."',
    done(L, win) { L.folkBag().honey++; if (!win) L.hp(-2, 'bees'); return `${win ? 'A box, a sheet and no sudden movements. The swarm walks into the box like a queue onto a bus, and the mayor comes out of his office to shake your hand from a safe distance.' : 'You get most of them. Some of them get you. The vicar dabs your neck with vinegar and calls you very brave.'} She gives you a jar of last year’s honey, and promises more every summer’s end.`; } },
  swim: { who: 'hollis', icon: '🏊', title: 'Do the sponsored swim from Smugglers’ Cove', at: 'cove', time: 2, by: 3, gain: 8, check: ['fitness', 35],
    why: (L) => (L.s.wx === 'storm' ? 'Not in a gale. Even the vicar says so.' : null),
    set: 'She has the sponsorship forms printed by the end of the day. Half the town has signed them by the end of the week.',
    done(L, win) { L.karma(4); L.folkIntro('achterberg'); return `${win ? 'Out to the buoy and back, twice, with half the town on the sand cheering and the vicar ringing a handbell. The forms come to $4,600.' : 'You get as far as the buoy, and hang on to it, and are towed back by Captain Quinn in the inshore boat. The sponsors pay up anyway, laughing: $2,100.'} The roofers are up the tower by the end of the month. At the party for it the vicar introduces you to the librarian, Miss Achterberg, who is holding a sherry as though it were evidence.`; } },

  stacks: { who: 'achterberg', icon: '📖', title: 'Show Miss Achterberg your library ticket', gain: 6,
    goal: (L, f) => ({ have: Math.min(3, L.s.folk.read - f.base), want: 3, text: `Read in the reading room three times (${Math.min(3, L.s.folk.read - f.base)} of 3)` }),
    base: (L) => L.s.folk.read,
    set: 'The ticket has your name on it, typed, and the date stamped in the corner.',
    done(L) { L.gain('smarts', 1); return 'She inspects the date stamps on your ticket. Three. "Hm," she says, and then, very quietly: "Well done."'; } },
  registers: { who: 'achterberg', icon: '🗃️', title: 'Fetch the parish registers from St Brigid’s', at: 'church', time: 1, gain: 6,
    set: '"Do not," she says, "accept the sherry."',
    done(L) { L.gain('smarts', 1); L.folkIntro('hollis'); return 'The vicar offers you sherry, cake, and a long story about the burial in 1580 of a man called Thomas Gull, and at last the registers, wrapped in a tea towel. Miss Achterberg unwraps them as if they were glass. "A tea towel," she says faintly.'; } },
  post: { who: 'achterberg', icon: '📮', title: 'Post Miss Achterberg’s parcel at the station', at: 'station', time: 1, by: 2, gain: 8,
    set: 'She holds on to the parcel a moment too long when she hands it over.',
    done(L) { L.s.folk.book = 8; return 'You push the parcel through the slot at the station and hear it land. When you tell her, she says "Good," and then has to go and reshelve something for half an hour. Afterwards she lends you, as thanks, her great treasure: an Admiralty pilot of 1820, with every rock in the bay drawn in by hand. "Two years," she says. "Read it properly."'; } },

  map: { who: 'windle', icon: '🗺️', title: 'Look out the old footpath map at the Town Hall', at: 'townhall', time: 1, gain: 6, check: ['smarts', 35],
    set: '"Basement," says Tom. "They keep everything in the basement. That’s how you know it’s true."',
    done(L, win) { L.folkIntro('priya'); return `${win ? 'The planning clerk finds the 1952 map in the basement, under a box of Christmas lights. There it is in red ink: the path, moved to the edge of the field, signed and stamped. Tom reads it three times, folds it into his cap, and says "Ha."' : 'Three hours in the basement and no map. But you find the clerk’s notes from 1952, which say "Windle (sen.) very rude about footpath". Tom is delighted.'} He sends you down to Market Square with a churn of milk for Priya Lal’s cheese stall, by way of thanks, and so you meet Priya.`; } },
  path: { who: 'windle', icon: '🧓', title: 'Ask old Marlow where the footpath used to go', at: 'harbour', time: 1, gain: 8,
    set: '"Don’t mention the dog," says Tom.',
    done(L) { L.folkWarm('marlow', 3, false); return 'Marlow takes some persuading. Then he takes a pencil and draws it on the back of a betting slip: the path along the hedge, the stile by the oak, the way he went to school. "Tell Windle," he says, "he still owes me for the dog." The council drops the case within the month, and Tom tells you that you may fish his lake whenever you like. Nobody else may.'; } },
  peas: { who: 'windle', icon: '💐', title: 'Take Tom Windle the sweet peas', gain: 10,
    goal: (L, f) => ({ have: Math.min(1, (L.s.grown.peas || 0) - f.base), want: 1, text: (L.s.grown.peas || 0) > f.base ? 'Sweet peas grown' : `Grow a bed of sweet peas on an allotment (sown in spring or summer)${L.s.plot ? '' : ': you will need a plot'}` }),
    base: (L) => L.s.grown.peas || 0,
    set: 'He does not say anything. He does nod.',
    done(L) { L.joy(4); return 'You bring the sweet peas up the hill in a jam jar. Tom looks at them a long time. Then he takes them round the back of the farmhouse, and you hear him say "There, Mary," and you go and look at the cows for a while.'; } },

  gearbox: { who: 'jess', icon: '⚙️', title: 'Fetch a gearbox off the train for Jess', at: 'station', time: 1, by: 2, gain: 6, check: ['fitness', 30],
    set: '"Lift with your legs," says Jess. Len points at his back, by way of a warning.',
    done(L, win) { if (!win) L.hp(-1, 'a gearbox'); return `${win ? 'You get it off the train, onto a trolley and up the hill with only one rest.' : 'It gets away from you on the hill and you chase it down to the bus stop. It is fine. You are not.'} Jess has it in the Land Rover by teatime, and says she will see you right on your own car from now on.`; } },
  ledgers: { who: 'jess', icon: '🧾', title: 'Go over the garage’s books at Harbour Bank', at: 'bank', time: 1, gain: 8, check: ['smarts', 40],
    set: 'Len gives you a carrier bag. It contains thirty years of receipts and a sandwich.',
    done(L, win) { return win ? 'Two hours with the bank manager and the ledgers: the chain is offering half what the place is worth, and you can prove it. Len reads your sums, points at the bottom line, and tears the letter up.' : 'The figures are beyond you, but not beyond the bank manager, who says it is a poor offer and Len would be daft. Len points at her approvingly and tears the letter up.'; } },

  crew: { who: 'quinn', icon: '🛟', title: 'Sign on as shore crew at the lifeboat station', gain: 6,
    goal: (L) => ({ have: Math.min(40, Math.floor(L.s.st.fitness)), want: 40, text: `Fitness 40 (you have ${Math.floor(L.s.st.fitness)})` }),
    set: 'She writes "40" on the back of your hand in biro, as though you might forget.',
    done(L) { L.karma(2); return 'Quinn watches you run up the slipway with a coil of rope, twice. "Aye," she says, and writes your name on the shore crew list in pencil. Pencil, you learn later, is how everybody starts.'; } },
  raffle: { who: 'quinn', icon: '🎟️', title: 'Sell the lifeboat raffle in the Gull & Anchor', at: 'pub', time: 1, by: 2, gain: 6, check: ['charm', 35],
    set: '"First prize is a hamper," she says. "Second prize is two hampers." It is a joke. You think it is a joke.',
    done(L, win) { L.karma(1); return `${win ? 'You sell every ticket in the book, and a second book, to people who were only in for a pint. Quinn counts it, nods, and says "Talker." It is clearly a compliment.' : 'You sell half the book, mostly to Big Tam, who buys forty and wins the hamper. Quinn says it will do.'} From now on you may come out with the crew on exercise.`; } },
  merrow: { who: 'quinn', icon: '⚓', title: 'Ask old Marlow about the night the Merrow went down', at: 'harbour', time: 1, gain: 10,
    set: '"All of it," says Quinn. "Not the nice version."',
    done(L) { L.karma(2); L.folkWarm('marlow', 3, false); return 'Marlow tells you all of it, slowly, looking at the water: the engine failing, the rockets, the lifeboat beaten back off the bar three times, and the engineer who went below to try one more thing. "Brave man," he says. "Bravest I saw." You tell Quinn every word. She listens to the end, nods once, and goes out alone onto the slipway. In the morning the Merrow’s engineer has his name on the board of the lost, where it was never put.'; } },

  trip: { who: 'marlow', icon: '⛵', title: 'Take Marlow out to where the Merrow lies', at: 'harbour', time: 2, gain: 10,
    why: (L) => (L.s.wx === 'storm' || L.s.wx === 'fog' ? 'Not in this weather. He wants a fair day for it.' : null),
    set: '"First fair day," says Marlow. "I’ll bring the flask."',
    done(L) { L.joy(6); return `Flat calm, and Gorse Head standing over you. ${L.s.items.boat ? 'From your boat' : 'From the Peggy Sue, you at the tiller'}, Marlow drops a sprig of rosemary from his garden over the side and says eleven names, slowly. Then he clears his throat. "Right," he says. "Mackerel." You fish all afternoon, and he shows you marks he has never shown anybody.`; } },

  fishpie: { who: 'betty', icon: '🐟', title: 'Bring Betty two fish for her fish pie', by: 3, gain: 8,
    goal: (L) => ({ have: Math.min(2, fresh(L)), want: 2, text: `Two fish caught this season (${Math.min(2, fresh(L))} of 2)${L.s.items.rod ? '' : ': you will need a rod'}` }),
    take: (L) => { L.folkBag().fish -= 2; },
    set: '"Fresh, mind," she says. "This season’s. I’ll know."',
    done() { return 'Betty holds them up to the light like a jeweller. "Now that," she says, "is a fish." Fish pie is on the board by Friday, and the old fish man is told, at length, why. "And from now on," she says, "you eat here, and you pay what you can."'; } },
  picture: { who: 'betty', icon: '🖼️', title: 'Give Betty a painting for the café wall', gain: 8,
    goal: (L) => ({ have: Math.min(1, L.s.paintings), want: 1, text: L.s.paintings ? 'You have a painting ready' : `One of your own paintings${L.s.items.easel ? ' (paint the view in the park)' : ': an easel from the High Street, then paint the view in the park'}` }),
    take: (L) => { L.s.paintings--; },
    set: '"Something with the sea in," says Betty. "People like the sea. They come here for it."',
    done(L) { L.karma(2); L.fame(0.5); return 'It goes up over the counter, where the old pier used to be. Betty tells everybody who painted it, including people who did not ask and one man who was trying to leave.'; } },
  recipes: { who: 'betty', icon: '📖', title: 'Write out Betty’s recipes in the library', at: 'library', time: 2, gain: 8,
    set: '"Bring a good pen," says Betty. "And a lot of paper. And don’t tell a soul."',
    done(L) { L.folkKeep('recipes'); return 'Two long afternoons in the reading room, Betty whispering and you writing: lemon drizzle, Ron’s birthday cake, the scones, the famous gravy. Miss Achterberg pretends not to hear, and brings you both tea, which she has never done for anybody. At the end Betty holds the book in both hands. "All of me," she says. "In there." She has a copy made, for you.'; } },

  boxlot: { who: 'pym', icon: '📦', title: 'Bid for Mr Pym’s box lot at the market sale', at: 'market', time: 1, cost: 60, gain: 6,
    set: '"Sixty," he says. "Not a penny more. And do not look as though you want it."',
    done(L) { const c = odd(L, ['toy', 'art', 'book']); return `You bid sixty dollars for a tea chest of oddments, with a straight face, against a man in a waxed jacket who folds at fifty-five. Mr Pym goes through it that evening in gloves, and hands one thing back to you: ${c.a}. "Yours," he says. "For the face." From now on, he says, you may have a tenth off anything in the window.`; } },
  clearance: { who: 'pym', icon: '🏚️', title: 'Help Mr Pym clear the cottage on the cliff road', at: 'headland', time: 2, by: 2, gain: 8,
    set: '"Bring gloves," he says. "And patience. Mostly patience."',
    done(L) { const c = odd(L, ['book', 'art', 'toy', 'sea']); return `A cottage on the cliff road with a green door, and eighty years of somebody’s life in it. You carry it down the path box by box, and Mr Pym sorts it on the lawn, gently, into what will sell and what should not. In a hatbox under the stairs you find ${c.a}. "Finder’s fee," says Mr Pym, and will not hear otherwise.`; } },

  spuds: { who: 'parg', icon: '🥔', title: 'Take Mrs Pargeter a potato from her seed', gain: 10,
    goal: (L, f) => ({ have: Math.min(1, (L.s.grown.spuds || 0) - f.base), want: 1, text: (L.s.grown.spuds || 0) > f.base ? 'Potatoes grown' : `Grow a bed of potatoes (sown in spring, ready two seasons on)${L.s.plot ? '' : ': you will need a plot'}` }),
    base: (L) => L.s.grown.spuds || 0,
    set: '"Spring," she says. "Not before. I shall be watching."',
    done(L) { L.folkPlotBed(); return 'She digs her thumbnail into one, sniffs it, and says nothing for so long you think you have failed. Then: "Mr Pargeter’s," she says. "Exactly." She has a word with the allotment committee, which is to say she tells them, and the strip of plot 9 along your fence is yours: a fourth bed.'; } },

  shirts: { who: 'gaz', icon: '👕', title: 'Ask Lighthouse Labs to sponsor the Rovers', at: 'labs', time: 1, gain: 6, check: ['charm', 40],
    set: '"Mention the 1987 Shield," says Gaz. "Everybody remembers the Shield." Nobody remembers the Shield.',
    done(L, win) { return `${win ? 'Lighthouse Labs agree to two sets of kit, home and away, and a new net, provided their logo goes on the front and nobody asks what they do. Gaz cries in the car park.' : 'Lighthouse Labs agree to one set of kit, in a colour called Brand Teal. Gaz says it is the most beautiful colour he has ever seen.'} He gives you a season ticket, for life, and a pie.`; } },
  keeper: { who: 'gaz', icon: '🧤', title: 'Find the Rovers a goalkeeper in the Gull & Anchor', at: 'pub', time: 1, by: 2, gain: 8,
    set: '"Big hands," says Gaz. "Big heart. Big anything."',
    done(L) { L.joy(4); return 'You find him at the bar, as everybody does: Big Tam, who has never played in goal and is roughly the size of one. "Aye, go on," he says. The Rovers stay up by a point, on a clean sheet, and Gaz buys every one of them a pie.'; } },

  posters: { who: 'desmond', icon: '📜', title: 'Put up the Pavilion’s posters on the High Street', at: 'highstreet', time: 1, gain: 6,
    set: 'He gives you a box of posters and a roll of Sellotape, as though handing over a sword.',
    done() { return 'Every window on the High Street, by charm or by Sellotape. Betty takes two. Mr Pym takes one and puts it face to the wall. The summer play sells out for the first time in nine years, and Desmond makes you a member of the Pavilion Players: you may come to any rehearsal you like.'; } },
  marlowTalk: { who: 'desmond', icon: '🧓', title: 'Ask old Marlow to tell the Players about the Merrow', at: 'harbour', time: 1, gain: 8,
    set: '"Tell him," says Desmond, "that there will be biscuits."',
    done(L) { L.folkWarm('marlow', 3, false); return 'It takes two pints and a promise that nobody will make a fuss. Marlow comes up to the Pavilion in a tie, sits on the edge of the stage and talks for an hour. Nobody moves. Desmond rewrites the whole second act that night.'; } },

  veg: { who: 'priya', icon: '🧺', title: 'Bring Priya vegetables from your plot', gain: 6,
    goal: (L) => ({ have: vegNow(L) ? 1 : 0, want: 1, text: vegNow(L) ? `A basket of ${CROPS[vegNow(L).c].name.toLowerCase()}` : `Vegetables from your own allotment${L.s.plot ? ' (bring in a crop)' : ': you will need a plot'}` }),
    take: (L) => { L.folkBag().veg = null; },
    set: '"Not the knobbly ones," she says. "Actually, especially the knobbly ones. Tourists love a knobbly one."',
    done(L) { L.cash(120); return 'Priya weighs them by eye, prices them at twice what you would have dared, and has sold the lot by eleven. She gives you $120 out of the cash box. "From now on," she says, "bring me the best of everything."'; } },
  council: { who: 'priya', icon: '🏛️', title: 'Speak up for the market at the council meeting', at: 'townhall', time: 1, by: 2, gain: 8, check: ['charm', 45],
    set: '"Thursday," says Priya. "Seven o’clock. Wear something that says ‘reasonable’."',
    done(L, win) { L.karma(3); if (win) L.fame(1); return win ? 'You stand up in the public gallery and say what the market is for. You say it well. The pitch fees are voted down nine to two, and Priya is put out of the gallery for cheering.' : 'You say it badly, but you say it, and so do forty stallholders after you. The council "defers the matter", which means it is dead.'; } },
  plans: { who: 'priya', icon: '⛲', title: 'Find the fountain’s plans in the town archives', at: 'library', time: 1, gain: 10,
    set: '"Bring them to me," says Priya, "and a spanner."',
    done(L) { L.folkKeep('penny'); L.joy(10); return 'Miss Achterberg finds them in eleven minutes, in a drawer marked MISC. (WATER). The fountain was turned off in 1912 by a clerk who thought it wasteful, and never on again because nobody could find the tap. The tap is under a drain cover by the cheese stall. On market day Priya turns it, and the water comes up, wobbles, and stands up straight in the sun, and the whole square cheers. She throws in a penny, and then another for you, and gives you the first one back out of the water.'; } },

  letter: { who: 'penn', icon: '✉️', title: (L) => `Take ${L.folkPennOut() ? 'Mr Pennington’s' : 'the mayor’s'} letter up to Windle Farm`, at: 'farm', time: 1, gain: 6,
    set: '"Hand it to him," says the mayor, "and step back."',
    done(L) { L.cash(300); L.folkWarm('windle', 2, false); return 'Tom Windle reads it at the gate, slowly, and then again. "Tell him," he says, "I’ll think about it." From Tom Windle this is a peace treaty. You are given $300 for your trouble out of a petty-cash tin, and a receipt to sign for it.'; } },
  appeal: { who: 'penn', icon: '🏗️', title: (L) => `Tell ${L.folkCall('penn')} you have given to the town`, gain: 8,
    goal: (L, f) => ({ have: Math.min(1000, (L.s.n.given || 0) - f.base), want: 1000, text: `Give $1,000 to the town: at the Town Hall, to the food bank or the appeal (${money(Math.min(1000, (L.s.n.given || 0) - f.base))} so far)` }),
    base: (L) => L.s.n.given || 0,
    set: '"I shall have the Gazette ready," he says.',
    done(L) { L.karma(3); return 'The Gazette prints your name at the top of a list of donors, with a photograph of him shaking your hand. By the end of the month there are forty names under yours.'; } },
};

// Things given to keep, for good.
export const KEEPSAKES = {
  service: { icon: '📜', name: 'The order of service', from: 'hollis', said: 'From the vicar’s wedding, with your name in it, reading the lesson.' },
  signed: { icon: '📕', name: 'Tempest at Tidewater Hall', from: 'achterberg', said: 'Signed, and dedicated to you.' },
  deeds: { icon: '📜', name: 'The deeds to the bottom field', from: 'windle', said: 'And the lake, on condition the path stays open.' },
  spanner: { icon: '🔧', name: 'Len’s spanner', from: 'jess', said: 'The one he pointed with, for forty years.' },
  crew: { icon: '🛟', name: 'Your name on the crew board', from: 'quinn', said: 'In paint, not pencil.' },
  merrow: { icon: '🔔', name: 'The Merrow’s bell', from: 'marlow', said: 'MERROW 1938. Raised in 1970, and never told.' },
  recipes: { icon: '📖', name: 'Betty’s recipes', from: 'betty', said: 'Forty years of them, in your handwriting.' },
  cafebell: { icon: '🛎️', name: 'The bell from Betty’s door', from: 'betty', said: 'Forty years that rang.' },
  hoe: { icon: '🪏', name: 'Mrs Pargeter’s hoe', from: 'parg', said: 'On loan, which means for ever.' },
  ball: { icon: '⚽', name: 'The 1987 ball', from: 'gaz', said: 'From the Coastal League Shield, signed by both teams of the County Cup final.' },
  poster: { icon: '🎭', name: 'A poster for The Merrow', from: 'desmond', said: 'Opening night at the Pavilion, with your name on it.' },
  penny: { icon: '🪙', name: 'The first penny from the fountain', from: 'priya', said: 'Fished out of the water by Priya, for you.' },
  freedom: { icon: '📜', name: 'The Freedom of Starling Bay', from: 'penn', said: 'You may graze sheep on the green, and be rude to the mayor.' },
};

// What a friendship is good for, once you are far enough into the story:
// at: the chapter that brings it. keep: only while you keep in touch (30).
export const BOONS = {
  honey: { who: 'hollis', at: 2, keep: true, icon: '🍯', name: 'The vicar’s honey', said: 'Two jars on your step at the end of every summer.' },
  pew: { who: 'hollis', at: 5, icon: '🪑', name: 'Your name on a pew', said: 'Sitting in the quiet at St Brigid’s does you more good.' },
  pilot: { who: 'achterberg', at: 4, icon: '🧭', name: 'The Admiralty pilot of 1820', said: 'On loan: a little Smarts every season while you have it.', on: (L) => L.s.folk.book > 0 },
  pencil: { who: 'achterberg', at: 5, icon: '✏️', name: 'Her red pencil', said: 'She reads your drafts: every novel you write is a little better.' },
  lake: { who: 'windle', at: 3, icon: '🎣', name: 'Fishing on Windle’s lake', said: 'A quiet morning’s fishing at the farm, if you have a rod.' },
  field: { who: 'windle', at: 5, icon: '🌾', name: 'The bottom field', said: 'Yours: Tom pays $350 a season to graze it.' },
  rates: { who: 'jess', at: 2, keep: true, icon: '🚗', name: 'Mates’ rates', said: 'Your car costs less to run.' },
  drill: { who: 'quinn', at: 3, keep: true, icon: '🛟', name: 'Out with the crew', said: 'Go out on lifeboat exercise at the cove.' },
  marks: { who: 'marlow', at: 4, icon: '🗺️', name: 'Marlow’s marks', said: 'Every fish you land fetches $40 more.' },
  feed: { who: 'betty', at: 2, keep: true, icon: '🍲', name: 'Betty feeds you', said: '$120 off your food bills every season.' },
  cook: { who: 'betty', at: 4, icon: '🍳', name: 'Betty’s recipes', said: 'Cooking a proper dinner does you more good.' },
  tenth: { who: 'pym', at: 2, keep: true, icon: '🏷️', name: 'A tenth off', said: 'A tenth off everything in Mr Pym’s window.' },
  fair: { who: 'pym', at: 5, icon: '⚖️', name: 'A fair price', said: 'Mr Pym pays you a tenth more for curios.' },
  bed: { who: 'parg', at: 4, icon: '🟫', name: 'A strip of plot 9', said: 'A fourth bed on your allotment.' },
  glass: { who: 'parg', at: 5, icon: '🪟', name: 'Her greenhouse', said: 'Every bed on your plot is looked after a little more each season.' },
  ticket: { who: 'gaz', at: 2, keep: true, icon: '🎫', name: 'A season ticket', said: 'Watching the Rovers costs you nothing.' },
  players: { who: 'desmond', at: 2, keep: true, icon: '🎭', name: 'The Pavilion Players', said: 'Rehearse with the Players at the Pavilion, for Charm.' },
  stall: { who: 'priya', at: 2, keep: true, icon: '🧀', name: 'A place on her stall', said: 'Priya sells the best of every crop you bring in, for more.' },
  fountain: { who: 'priya', at: 5, icon: '⛲', name: 'The fountain', said: 'Wandering round the market lifts you more.' },
  freedom: { who: 'penn', at: 5, icon: '📜', name: 'The freedom of the town', said: 'People greet you by name: a little happier, always.' },
};

