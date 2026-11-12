// New in Town: the people of the town, as they are. Who each of them is,
// where to find them, how they look, what they say to you as you get to
// know them, and what they make of a present. Their stories, and the
// favours they ask, are in folk.js; this is only who they are.
//
// look: as for anybody else (see LOOKS in data.js), plus wear: something
// of their own drawn on top (folk-ui.js). corner: which part of town they
// belong to, for the trophy. gifts: what they love, like and cannot abide
// (a curio is 'cur' or 'cur:<set>'). lines: what they say to a stranger,
// to a friend, and to a good friend. life: what they say about yours.

const theirs = (p) => (p.sex === 'm' ? 'him' : 'her');

export const FOLK = {
  hollis: {
    name: 'The Reverend Hollis', call: 'the vicar', Call: 'The vicar', sex: 'f', place: 'church', icon: '🐝', corner: 'old', age: 52,
    look: { skin: 0, hair: 2, top: 4, style: 2, beard: false }, wear: 'collar',
    blurb: 'Vicar of St Brigid’s: kind, flustered, keeps bees, and is forever raising money for the roof.',
    gifts: { love: ['shortbread', 'flowers'], like: ['tea', 'seeds', 'painting'], hate: ['rum', 'honey'] },
    up: ['Up a ladder in the churchyard, counting slates.', 'In a veil among the hives behind the vestry.', 'Running the harvest festival, slightly behind.', 'Rehearsing the carols with a choir of seven.'],
    meet: 'You introduce yourself to the vicar, who shakes your hand with both of hers and has sold you two raffle tickets before you let go.',
    ask: 'Then she takes you by the elbow: there is something she wants to ask.',
    lines: [
      ['"Do you like jumble?" asks the vicar. "Everybody says they don’t, and then they come."', 'The vicar is chasing a hymn sheet across the churchyard. You catch it. She is so grateful you feel you ought to have caught two.', 'She tells you about the roof. Then she tells you about the roof again, in case the first time was not clear. It was clear.'],
      ['She makes tea in the vestry in a pot the size of a font, and tells you which of the bell-ringers are not speaking.', '"The bees are cross this week," she says. "So is the churchwarden. I am not sure which caught it from which."', 'You fold two hundred parish magazines with her. She tells you the gossip, and then, guiltily, asks God to disregard it.'],
      ['She asks your advice about a sermon. You suggest it could be shorter. She laughs for a long time, and then makes it shorter.', 'You sit on the bench by the hives with a cup of tea, and for once she does not rush off anywhere.', '"You are one of the good ones," she says, apropos of nothing, and then is very busy with the teapot.'],
    ],
    seasons: ['Daffodils in jam jars on the altar, and lambs on the hill. She is in the best of moods.', 'The bees are flying, the roses are out, and she has a sunburnt nose.', 'Marrows on the font for the harvest festival. She is praying nobody brings another one.', 'The church is perishing. She wears two cardigans under her cassock and still means every word of the carols.'],
    life: [
      (L) => (L.partner() && L.partner().eng ? 'She asks, very casually, whether you have thought about a date for the wedding. She has a free Saturday in June. She has looked.' : null),
      (L) => (L.kids().some((k) => k.age < 2) ? 'She asks after the baby, and offers to christen it, and then to mind it, and then, more realistically, to christen it.' : null),
      (L) => (L.s.ill ? `She says she will pray for your ${L.s.ill.name}. Then, more practically, she presses a jar of honey on you.` : null),
      (L) => (L.s.record ? 'She says nothing about your record, kindly and at some length.' : null),
      (L) => (L.s.karma >= 40 ? '"People talk about you," she says. "Nicely. It makes a change."' : null),
    ],
    loved: { shortbread: 'She has eaten two before she remembers to offer you one. "Oh dear," she says, and has a third.', flowers: 'She puts them on the altar on Sunday, and tells the whole congregation who brought them.' },
    hated: { rum: 'She holds the rum at arm’s length, as though it might start something.', honey: 'It is her own honey. She recognises the label, because she wrote it.' },
  },

  achterberg: {
    name: 'Miss Achterberg', call: 'Miss Achterberg', Call: 'Miss Achterberg', sex: 'f', place: 'library', icon: '📚', corner: 'old', age: 59,
    look: { skin: 1, hair: 0, top: 6, style: 2, beard: false }, wear: 'specs',
    blurb: 'The librarian, and keeper of the town archives. Strict about silence. Rumoured to have a secret.',
    gifts: { love: ['novel', 'cur:book'], like: ['shortbread', 'tea', 'flowers', 'honey'], hate: ['fish', 'pies'] },
    up: ['Stamping returns with tremendous force.', 'Cataloguing the town archives, in a cardigan, in July.', 'Writing something in a notebook, which she covers with her hand.', 'Guarding the radiators from people who only come in to be warm. She lets them.'],
    meet: '"We whisper in here," whispers Miss Achterberg, who heard you breathing from the other end of the room. You whisper your name. She writes it down.',
    ask: 'She beckons you into the back office, which nobody is allowed into.',
    lines: [
      ['She looks at you over her glasses, then at your hands, then at the book in your hands, as though it might come to harm.', 'You ask where the history section is. She tells you, and also where you went wrong in asking.', '"Shh," says Miss Achterberg. You had not said anything. "Pre-emptively," she explains.'],
      ['She lets you into the archive room, where the town is kept in grey boxes. "Do not breathe on the parish registers."', 'She recommends you a book, with a face that says she will know if you have not read it.', 'You catch her reading a novel with a ship and a coastguard with no shirt on the cover. She turns it face down, with dignity.'],
      ['She tells you, in a whisper, the full and dreadful story of the 1953 overdue fines amnesty.', '"You are a reader," she says. From her it is a knighthood.', 'She makes you a cup of tea in the back office and asks your opinion on a chapter. Of what, she does not say.'],
    ],
    seasons: ['The library smells of floor polish and new books. She has had a window open, which she regards as reckless.', 'Holidaymakers keep coming in to ask for the toilets. She sends them to the poetry section.', 'Rain on the long windows and the radiators clanking. Her favourite time of year, though she would not say so.', 'The reading room is full of old men pretending to read the newspapers and actually asleep. She lets them.'],
    life: [
      (L) => (L.s.n.books >= 1 ? 'She has read your novel. "The second chapter," she says, "is very nearly good." You will treasure this all your life.' : null),
      (L) => (L.s.course ? 'She asks how your course is going, and lends you a book on it you did not know you needed.' : null),
      (L) => (L.s.st.smarts >= 70 ? 'She asks your opinion on a crossword clue. Nobody has ever seen her ask anybody anything.' : null),
      (L) => (L.partner() ? `She asks after ${L.partner().name.split(' ')[0]} with a romantic gleam, which she quickly puts out.` : null),
    ],
    loved: { novel: 'She puts it in her handbag very fast and says it is not the sort of thing she reads. She has finished it by Tuesday.', 'cur:book': 'She holds it the way other people hold babies.' },
    hated: { fish: '"Not in the library," she says, and points at the door until it has gone.', pies: '"Crumbs," she says. "In a library." It is the worst thing she can think of.' },
  },

  windle: {
    name: 'Tom Windle', call: 'Tom Windle', Call: 'Tom Windle', sex: 'm', place: 'farm', icon: '🐄', corner: 'edge', age: 63,
    look: { skin: 2, hair: 1, top: 3, style: 0, beard: true }, wear: 'flatcap',
    blurb: 'Of Windle Farm. Gruff, talks to his cows, and has been at war with the council over a footpath since before you were born.',
    gifts: { love: ['pies', 'rum'], like: ['shortbread', 'tea', 'marrow'], hate: ['flowers', 'veg'] },
    up: ['Up all night with the lambing, and not pleased about it.', 'Making hay and glaring at the sky.', 'Writing to the council again, in capitals.', 'Breaking the ice on the troughs and telling the cows it is their own fault.'],
    meet: '"Footpath’s that way," says Tom Windle, before you have opened your mouth. "And it isn’t a footpath." You say you only came to say hello. He looks at you as if he will believe it when he sees it.',
    ask: 'He leans on the gate beside you, which means he has something to say.',
    lines: [
      ['He is talking to a cow called Margaret. He stops when he sees you, and then, after a while, carries on.', '"You’ll be from the council," he says. You are not. He goes on looking at you as though you might be.', 'He nods. You nod. A cow says something. Neither of you can top it.'],
      ['He introduces you to every cow by name: Margaret, Little Margaret, Mrs Hennessy and Gladys, who bites.', 'He tells you what the council has done this time. It involves a letter, a stile and the word "alleged".', 'You lean on the gate with him and say nothing for twenty minutes. It is, apparently, a very good conversation.'],
      ['He gives you a lift in the Land Rover and lets you work the gears, which he has never let anybody do.', 'He tells you about his wife, Mary, nine years gone. Then he goes and does something to a fence for a while.', '"You’ll do," he says, which from Tom Windle is a speech.'],
    ],
    seasons: ['Lambs everywhere, all of them trying to die in new and ingenious ways. He has not slept since March.', 'The hay is in, or it is not, and either way it is the weather’s fault.', 'The council has written again. He reads you the letter, and then his reply, which is better.', 'Mud to the knee and a north wind. He says it is mild for the time of year.'],
    life: [
      (L) => (L.s.plot ? 'He asks what you are growing on that allotment, and snorts at every answer, kindly.' : null),
      (L) => (L.s.items.sportscar ? 'He looks at your sports car for a long time. "Wouldn’t get up my lane," he says, with satisfaction.' : null),
      (L) => (L.s.wx === 'wet' ? '"Rain’s good for the grass," he says, as it runs off his cap. "Not for anything else."' : null),
      (L) => (L.s.job && L.s.job.c === 'politics' ? '"Politics," he says, as though naming a disease of sheep.' : null),
    ],
    loved: { pies: 'He eats one on the spot, standing up, and makes a noise like a contented bull.', rum: '"Medicinal," he says, and puts it in the dresser with the others.' },
    hated: { flowers: 'He looks at them as though they were a summons.', veg: '"I grow my own," he says. "And a field of them."' },
  },

  jess: {
    name: 'Jess Dobbs', call: 'Jess', Call: 'Jess', sex: 'f', place: 'garage', icon: '🔧', corner: 'edge', age: 31,
    look: { skin: 1, hair: 5, top: 7, style: 1, beard: false }, wear: 'smudge',
    blurb: 'The daughter of Dobbs & Daughter, and the one who knows what she is doing. Her dad Len mostly drinks tea and points.',
    gifts: { love: ['tea', 'pies', 'cur:toy'], like: ['shortbread', 'rum'], hate: ['flowers', 'novel'] },
    up: ['Under a tractor, by the sound of it.', 'Fixing the ice-cream van for the third time this summer.', 'Putting winter tyres on half the town.', 'Jump-starting everybody, in the dark, in a hat.'],
    meet: 'A pair of boots sticks out from under a van. "Pass us the ten-mil," says the van. You pass the wrong one. "Other ten-mil." Jess slides out, wipes her hand on a rag that makes it dirtier, and shakes yours.',
    ask: 'Len points at you, then at Jess, then at a chair. You sit.',
    lines: [
      ['Len, in a chair by the door with a mug, points at a car and says "That’s your trouble, there." Jess, under a different car entirely, says "Thanks, Dad."', 'Jess asks what you are driving. You tell her. She makes a small, sad noise.', '"Don’t touch that," says Jess. "Or that. Or, actually, anything."'],
      ['You hold the lamp while Jess explains what is wrong with the world, using a carburettor as a diagram.', 'Len makes you a cup of tea strong enough to strip paint, and tells you about the 1976 Rally of the Bay, which he very nearly won.', 'Jess lets you start a car she has spent three weeks on. It coughs, and then purrs. She punches your arm, which hurts.'],
      ['Jess says she was going to be an engineer, a proper one, in the city, and then Mum died and somebody had to stay. "Don’t tell Dad," she says. "He thinks I like it." She does like it. That is the funny thing.', 'Len points at you and says "That one’s all right." Jess says it is the nicest thing she has ever heard him say about anybody, her included.', 'You eat chips on the forecourt, sitting on two tyres, and watch the sun go down over the pumps.'],
    ],
    seasons: ['The MOTs are due and everybody in Starling Bay has left it to the last week.', 'Tourists with flat tyres and faces to match. Jess charges a little extra for the faces.', 'Leaves in every gutter and a queue of cars with their lights out.', 'Flat batteries all down the High Street. Jess goes out with the jump leads at seven and comes back at dark.'],
    life: [
      (L) => (!L.s.items.car && !L.s.items.sportscar ? '"Still on foot?" says Jess. "I could find you something. Something with most of its wheels."' : null),
      (L) => (L.s.items.sportscar ? 'She walks all the way round your sports car, slowly. "Who services it?" she asks, in a voice like a doctor’s.' : null),
      (L) => (L.s.items.bike && !L.s.items.car && !L.s.items.sportscar ? 'She oils your bicycle chain without asking and adjusts something, and suddenly it is a different bicycle.' : null),
      (L) => (L.s.job && L.s.job.c === 'trades' ? 'She asks how the trade is treating you, and you compare cuts on your knuckles.' : null),
    ],
    loved: { tea: '"Dad’ll be pleased," she says, and puts it on her own shelf.', pies: 'Gone before you have finished saying "pie".', 'cur:toy': 'She has the back off it inside a minute, to see how it goes. It goes beautifully.' },
    hated: { flowers: '"Where am I meant to put those," says Jess, "in the sump?"', novel: 'She uses it to prop up a wobbly bench. She does say thank you.' },
  },

  quinn: {
    name: 'Captain Quinn', call: 'Captain Quinn', Call: 'Captain Quinn', sex: 'f', place: 'cove', icon: '⚓', corner: 'water', age: 49,
    look: { skin: 3, hair: 0, top: 6, style: 0, beard: false }, wear: 'peaked',
    blurb: 'Harbourmaster, and coxswain of the lifeboat at Smugglers’ Cove. A woman of very few words.',
    gifts: { love: ['rum', 'cur:sea'], like: ['fish', 'shortbread', 'tea'], hate: ['flowers', 'novel'] },
    up: ['Painting the lifeboat. Not talking.', 'Pulling holidaymakers off sandbanks, unsmiling.', 'Watching the glass. Watching the sea.', 'On call every night, in a chair by the radio.'],
    meet: 'You tell Captain Quinn your name. She looks at you for a while. "Quinn," she says. That appears to be the introduction over.',
    ask: '"Word," says Quinn, which means she wants one.',
    lines: [
      ['"Aye," says Captain Quinn. That is the conversation.', 'She nods at you. You nod at her. Somewhere, a gull says more than both of you.', '"Wind’s backing," she says, looking at the sky. You look at it too. You have no idea what she means.'],
      ['She lets you hold one end of a rope while she coils the other. "Good," she says. You glow for a week.', '"Tea?" she says. Twenty minutes later: "More?" By her standards it is a gossip.', 'She points out a seal, a cormorant, and a man on the end of the pier who should not be on the end of the pier.'],
      ['She tells you about a rescue in ’92. It takes four sentences. You will never forget any of them.', '"You’ll do," she says. Then, after a while: "Crew could use you."', 'You sit on the slipway in the evening and watch the light go. She says nothing at all, and it is very companionable.'],
    ],
    seasons: ['"Fog later," she says. There is fog later.', '"Holidaymakers," she says, the way other people say "rats".', '"Equinox," she says, looking at the sea. "Big tides." She checks the moorings twice.', 'She has not slept in her own bed since November. "Weather," she says, by way of explanation.'],
    life: [
      (L) => (L.s.items.boat ? 'She looks at your boat on its mooring. "Chafe on the bow line," she says. You go and look. There is chafe on the bow line.' : null),
      (L) => (L.s.gifts.lifeboat ? 'She looks at the new lifeboat, and then at you. "Thank you," she says. You have never heard her spend two words on one subject.' : null),
      (L) => (L.s.job && L.s.job.c === 'sea' ? '"Sea’s a good life," she says. "Hard. Good." That is three sentences.' : null),
      (L) => (L.s.wx === 'storm' ? 'Gale warning. She is in her oilskins already, and looks at you as though you should be indoors. You go indoors.' : null),
    ],
    loved: { rum: '"Ah," she says, and very nearly smiles.', 'cur:sea': 'She turns it over in her hands a long time. "Grandfather had one," she says.' },
    hated: { flowers: 'She puts them in a bucket on the slipway, where the gulls eat them.', novel: '"No time," she says, and gives it back.' },
  },

  marlow: {
    name: 'Old Marlow', call: 'old Marlow', Call: 'Old Marlow', sex: 'm', place: 'harbour', icon: '🧓', corner: 'water', age: 78, sec: 'The water',
    look: { skin: 2, hair: 0, top: 6, style: 0, beard: true }, wear: 'beanie',
    blurb: 'An old fisherman in a blue jersey, sixty years on the quay. Full of stories about the wreck of the Merrow.',
    gifts: { love: ['rum', 'tea'], like: ['shortbread', 'pies', 'honey'], hate: ['fish', 'flowers'] },
    up: ['Mending nets on the quay, and the nets winning.', 'Watching the boats come in and saying it was better in his day.', 'On an upturned crate, telling the gulls about the Merrow.', 'By the fire in the Gull & Anchor, with a flask of something.'],
    lines: [[], [], []], seasons: [], life: [],
    loved: { rum: '"Now you’re talking," says Marlow, and pockets it with a speed that does him credit at his age.', tea: 'He sniffs the packet. "Proper tea," he says. "Not dust in a bag."' },
    hated: { fish: '"You don’t give a fisherman a fish," says Marlow, pained. He takes it, though.', flowers: '"I’m not dead yet," says Marlow.' },
  },

  betty: {
    name: 'Betty', call: 'Betty', Call: 'Betty', sex: 'f', place: 'highstreet', icon: '☕', corner: 'bay', age: 66, sec: 'Betty’s Café',
    look: { skin: 1, hair: 3, top: 5, style: 3, beard: false }, wear: 'apron',
    blurb: 'Betty Shaw of Betty’s Café on the High Street. Calls everybody love. Has fed the town for forty years.',
    gifts: { love: ['honey', 'flowers', 'veg'], like: ['fish', 'seeds', 'painting'], hate: ['tea', 'shortbread'] },
    up: ['Making hot cross buns from four in the morning.', 'Serving ninety cream teas a day, and smiling at most of them.', 'Trying out a pumpkin scone, against advice.', 'Doing Christmas dinners for anybody with nowhere to go.'],
    meet: '"What can I get you, love?" says Betty, before you are through the door. She calls everybody love. She called the bailiff love.',
    ask: 'She sits down across from you, which she never does.',
    lines: [
      ['Betty gives you a teacake you did not order. "You looked like you needed it," she says. You did.', '"New, are you?" says Betty. "Thought so. You’ve still got that look. It goes."', 'Betty tells you the soup of the day. It is whatever there was yesterday, and it is wonderful.'],
      ['Betty tells you who is courting whom on the High Street, and who should not be, and who would be if they had any sense.', 'She sits down with you for five minutes and puts her feet on a chair. "Don’t tell anybody," she says.', '"Your usual," says Betty, and puts it down. You did not know you had a usual. You do now.'],
      ['She tells you about her Ron, who proposed in this very café in 1971 with a ring in a scone. She nearly broke a tooth on it and said yes anyway.', 'Betty saves you the last slice of lemon drizzle, which she does for nobody, not even the vicar.', '"You’re like one of mine," she says, and squeezes your hand with a hand like a warm loaf.'],
    ],
    seasons: ['Hot cross buns in the window, and the smell of them halfway down the High Street.', 'Every table full of sunburnt families. Betty moves among them like a battleship among dinghies.', 'Steam on the windows and soup on the stove. Betty’s best time of year.', 'Tea cosies on every pot, knitted by Betty in every colour there is.'],
    life: [
      (L) => (L.s.happy < 30 ? 'Betty takes one look at you and brings soup without being asked. "On the house," she says. "Don’t argue."' : null),
      (L) => (L.partner() ? `"Bring ${L.partner().name.split(' ')[0]} in," she says. "I want a look at ${theirs(L.partner())}."` : null),
      (L) => (L.s.f.cafe ? '"Still here, thanks to you," says Betty, and will not let you pay.' : null),
      (L) => (L.s.biz && L.s.biz.type === 'food' ? '"I hear you’re in the trade now," she says. "Watch your scones. Everybody’s a critic."' : null),
    ],
    loved: { honey: '"Proper honey," says Betty, holding it to the light. "That’s next week’s scones sorted."', flowers: 'She puts them in the window in a milk bottle, where they stay until they are dust.', veg: '"Soup," says Betty, looking into the basket with love. "Soup for a week."' },
    hated: { tea: '"I sell tea, love," says Betty, quite kindly.', shortbread: 'She turns the tin over and reads the label. "Shop-bought," she says, and puts it under the counter.' },
  },

  pym: {
    name: 'Mr Pym', call: 'Mr Pym', Call: 'Mr Pym', sex: 'm', place: 'highstreet', icon: '🏺', corner: 'bay', age: 71, sec: 'Pym’s Curios',
    look: { skin: 0, hair: 0, top: 4, style: 4, beard: false }, wear: 'bowtie',
    blurb: 'Of Pym’s Curios on the High Street. Old things, bought and sold, and a man who knows the price of all of them.',
    gifts: { love: ['cur:art', 'cur:coin', 'shortbread'], like: ['cur', 'tea'], hate: ['fish', 'pies'] },
    up: ['Polishing the brass in the window, and the window.', 'Telling holidaymakers that no, it is not a gift shop.', 'At house sales in a hat that has been to a great many.', 'Asleep in a wing chair among the clocks, all of which are wrong.'],
    meet: 'Mr Pym looks at you over his half-moon glasses, as though deciding what period you are from. "Do not touch the clocks," he says, and then, "Pym."',
    ask: 'He turns the sign on the door to CLOSED, which means he wants a word.',
    lines: [
      ['He shows you a teapot that once belonged to a duke, or possibly to a man called Duke. "The provenance," he says, "is evolving."', '"Do not touch the clocks," says Mr Pym, before you have thought of touching the clocks.', 'He tells you what everything in the window is worth. Then what it is really worth. Then what he will take for it.'],
      ['He teaches you to tell real Georgian silver from a good fake. "Bite it," he says. "No. That was a joke."', 'He makes tea in a pot worth more than your bicycle, and pours it with a hand that does not shake at all.', 'He tells you the story of every clock in the shop. They all stopped at different times, each for a sadder reason than the last.'],
      ['He calls you "my dear", which he has never called anybody, and seems as surprised as you are.', 'He shows you the drawer of things he will never sell. It is full of postcards from one woman, sent in the 1960s.', '"You have an eye," he says. "Not a good one. But an eye." It is the warmest thing he has ever said.'],
    ],
    seasons: ['Spring cleaning. He has dusted one shelf and found three things he forgot he had.', 'Tourists pick things up and put them down in the wrong place. He follows them round, putting them back.', 'House-sale season. He comes back from the country with a carload and a cold.', 'The shop is freezing, because the paraffin heater "is Victorian, and so am I".'],
    life: [
      (L) => ((L.s.n.fakes || 0) >= 1 ? 'He picks up a vase, turns it over and looks at you. "I know about the tea caddy," he says mildly. "Everybody tries it once."' : null),
      (L) => (Object.values(L.s.curios).reduce((a, n) => a + n, 0) >= 8 ? '"You are becoming a collector," he says, gravely, as though diagnosing something.' : null),
      (L) => (L.s.f.patron ? 'He has seen your set in the museum. "Glass case," he says. "Brass plate. Very good." He is moved, and tries not to show it.' : null),
      (L) => (L.s.fame >= 40 ? '"I could get a good price for your autograph," he says. "Do not give it to anybody else."' : null),
    ],
    loved: { shortbread: 'He keeps it, you discover later, in a Georgian tea caddy, which is the only one in the shop he trusts.', cur: 'He turns it over three times and does not name a price, which is how you know.' },
    hated: { fish: '"In a shop full of silk," he says faintly.', pies: 'He holds the bag well away from the china.' },
  },

  parg: {
    name: 'Mrs Pargeter', call: 'Mrs Pargeter', Call: 'Mrs Pargeter', sex: 'f', place: 'park', icon: '👒', corner: 'bay', age: 76, sec: 'The allotments',
    look: { skin: 0, hair: 0, top: 3, style: 2, beard: false }, wear: 'sunhat',
    blurb: 'Of plot 9, six times champion of the Harvest Show. Looks at an allotment the way a heron looks at a pond.',
    gifts: { love: ['seeds', 'tea'], like: ['honey', 'shortbread', 'veg'], hate: ['flowers', 'marrow'] },
    up: ['Inspecting everybody’s seedlings, whether or not they asked.', 'Watering at six in the morning, in a hat.', 'Measuring other people’s marrows with a tape and a face.', 'Turning compost in a coat older than you are.'],
    meet: 'Mrs Pargeter looks at your hands. "Soft," she says. It is not a compliment.',
    ask: 'She sits down on her bench and pats the place beside her, once.',
    lines: [
      ['"Slugs," says Mrs Pargeter darkly, apropos of nothing, and walks on.', 'She tells you what you are doing wrong. It is everything, but she lists it in order of importance.', 'She looks at your rows. "Hm," she says. You are told later that this was encouraging.'],
      ['She shows you how to pinch out a tomato, and then how not to, which is apparently what you were doing.', '"Mr Pargeter grew leeks," she says. "Champion leeks. 1968 to 1979." She does not say what happened in 1980, and you do not ask.', 'She lends you a hoe older than the allotments, and wants it back by Thursday, clean.'],
      ['She tells you, in strict confidence, the onion man’s real name. It is not what you expected.', '"You have green fingers," she says. "Greenish." She pats your arm.', 'You share a flask of tea on her bench. She says nothing about your beans, which is the nicest thing she has ever done.'],
    ],
    seasons: ['"Too early for beans," she says, watching somebody plant beans. There is a frost on Thursday.', 'She has been up since five, watering, and is disgusted to find you were not.', 'Harvest Show season. She has the look of a general before a battle.', '"Nothing to do in winter," she says, doing six things.'],
    life: [
      (L) => (L.s.plot && L.s.plot.beds.some((b) => L.bedRipe(b)) ? 'She looks at your plot. "You want to get those in," she says, "before they go woody. Today."' : null),
      (L) => (!L.s.plot ? '"No plot?" she says. "No plot. Well." It is the saddest thing she has heard all week.' : null),
      (L) => (L.s.f.marrow ? '"Beginner’s luck," she says of your rosette. She says it every time, and every time she looks a little prouder.' : null),
    ],
    loved: { seeds: 'She reads the packet twice, sniffs it, and puts it in her apron pocket. "These," she says, "are proper."', tea: 'Into the flask it goes, there and then.' },
    hated: { flowers: '"Shop flowers," she says. "Grown under lights."', marrow: 'She weighs it in her hand. "Hm," she says.' },
  },

  gaz: {
    name: 'Gaz Kowalski', call: 'Gaz', Call: 'Gaz', sex: 'm', place: 'ground', icon: '⚽', corner: 'edge', age: 44,
    look: { skin: 1, hair: 1, top: 1, style: 0, beard: false }, wear: 'scarf',
    blurb: 'Manager of Starling Rovers, who have not won anything since 1987. Lives on hope and meat pies.',
    gifts: { love: ['pies', 'shortbread'], like: ['rum', 'tea', 'honey'], hate: ['novel', 'seeds'] },
    up: ['Working out how to stay up, on the back of a programme.', 'Pre-season training: four men, a dog and a pie.', 'Shouting at the referee, the linesman and the sky.', 'Sweeping snow off the pitch with his own brush.'],
    meet: '"Rovers fan?" says Gaz, through a pie. You hesitate. "You will be," he says. "Nobody’s born one. You catch it."',
    ask: 'Gaz puts down his pie, which means it is serious.',
    lines: [
      ['Gaz explains a formation with the crumbs of a pie. It is either four-four-two or a seagull.', '"We’re a young side," says Gaz. The goalkeeper is fifty-three.', 'Gaz tells you the Rovers are "building". It is not clear what.'],
      ['He tells you about 1987, when the Rovers won the Coastal League Shield. He was a ball boy. He still has the ball.', 'You help him paint the lines on the pitch. They are not straight. "Character," says Gaz.', 'He asks your opinion on the team, writes it on a pie bag, and puts it in his pocket.'],
      ['Gaz says he has never once believed the Rovers would lose, not even at six–nil down. "What’s the point otherwise?" It is the most sensible thing anybody has said to you in years.', 'He shares his last pie with you, which is a sacrament.', 'He tells you you are the club’s twelfth man. There are only nine regular players, so you are, technically, the tenth.'],
    ],
    seasons: ['Three games left and the Rovers need four points. Gaz has done the sums on a napkin. They come out differently every time.', 'No football. Gaz mows the pitch twice a week to feel useful.', 'A new season, new hope, the same players.', 'The pitch is frozen and the match is off. Gaz stands in the middle of it anyway, just in case.'],
    life: [
      (L) => (L.s.st.fitness >= 60 ? 'He looks you up and down. "Ever played?" he asks, in the voice of a man who has seen a vision.' : null),
      (L) => (L.s.job && L.s.job.c === 'sports' ? '"A professional," says Gaz, in a hushed voice, and asks for your autograph for the clubhouse wall. He has it framed.' : null),
      (L) => (L.kids().some((k) => k.age >= 4 && k.age < 12) ? '"Bring the little ’uns Saturday," he says. "Mascots. Free pie."' : null),
      (L) => (L.s.eco <= -1 ? 'Gate receipts are down to forty-one and a dog. Gaz says the dog is the most loyal fan they have.' : null),
    ],
    loved: { pies: 'He eats two before you have finished handing them over, and saves the third for "the lads".', shortbread: '"Half-time," he says, reverently. "That’s half-time sorted."' },
    hated: { novel: 'He turns it over, looking for the pictures.', seeds: '"What am I meant to do with these," says Gaz, "grow a pitch?"' },
  },

  desmond: {
    name: 'Desmond Achebe', call: 'Desmond', Call: 'Desmond', sex: 'm', place: 'theatre', icon: '🎭', corner: 'old', age: 57,
    look: { skin: 5, hair: 0, top: 4, style: 0, beard: true }, wear: 'cravat',
    blurb: 'Director of the Pavilion Players. Once understudied in the West End, and mentions it.',
    gifts: { love: ['painting', 'flowers'], like: ['novel', 'rum', 'shortbread', 'cur:art'], hate: ['fish', 'pies'] },
    up: ['Casting the summer play, and recasting it.', 'Directing Shakespeare on the lawn, against the gulls.', 'Writing a play he will not let anybody read.', 'Directing the pantomime, and playing the back end of the cow.'],
    meet: '"Desmond Achebe," he says, shaking your hand as if at a curtain call. "I understudied in the West End, you know." You did not know. You do now.',
    ask: 'He takes you by both shoulders and steers you into the empty stalls.',
    lines: [
      ['He looks at you with one eye shut, as if framing a shot. "You have a face," he says. "Of some kind."', 'He is rehearsing six pensioners in a sword fight. Nobody has been hurt yet, but the morning is young.', 'He mentions the West End. Twice.'],
      ['He tells you about the night in 1989 when he very nearly went on as Third Lord in Macbeth. The lead made a full recovery. Desmond has never forgiven him.', 'You run lines with him in the empty theatre. He does all the other parts, beautifully.', 'He takes you up into the flies, where the old painted scenery hangs: a Venice, a forest, a drawing room, and Starling Bay in 1952.'],
      ['He tells you the Pavilion has lost money every year since 1931, and that it is the most important building in the town. You believe him.', '"You have presence," he says. "Not much. But it is there. We can work with it."', 'He takes his hat off to you, which he does for nobody, and keeps it off for a whole sentence.'],
    ],
    seasons: ['Auditions for the summer play. He has watched forty people do the same speech, and calls it "the most beautiful torture".', 'Shakespeare on the Pavilion lawn. A gull has taken a part, and is better than two of the cast.', 'The leaves come down outside the stage door, and he quotes something about them that you do not quite catch.', 'Pantomime season. He is writing it, directing it, and once again playing the back end of the cow.'],
    life: [
      (L) => (L.s.fame >= 30 ? 'He has seen you in the Gazette. "Fame," he says, "is a fickle mistress. I would know."' : null),
      (L) => (L.s.job && L.s.job.c === 'arts' ? '"A fellow artist," he says, and clasps both your hands. It goes on for some time.' : null),
      (L) => (L.s.f.exhibited ? 'He has seen your exhibition, and would like to talk to you about scenery.' : null),
      (L) => (L.s.fests.panto ? 'He saw your dame. "Brave," he says. "Bold. Broad." Then: "Again next year."' : null),
    ],
    loved: { painting: '"A backcloth," he breathes. "For the second act." It will be a forest by Friday.', flowers: 'He takes a bow over them. Several bows.' },
    hated: { fish: '"Not in a theatre," he says. "Never in a theatre. It is worse luck than whistling."', pies: '"The Pavilion," he says, "is not a football ground." He gives them to the stage crew.' },
  },

  priya: {
    name: 'Priya Lal', call: 'Priya', Call: 'Priya', sex: 'f', place: 'market', icon: '🧀', corner: 'old', age: 38,
    look: { skin: 3, hair: 6, top: 0, style: 5, beard: false }, wear: null,
    blurb: 'Runs the cheese stall on Market Square and, unofficially, Market Square.',
    gifts: { love: ['veg', 'honey'], like: ['tea', 'flowers', 'painting'], hate: ['pies', 'rum'] },
    up: ['Settling a dispute between the egg woman and the other egg woman.', 'Selling cheese to tourists who ask if it is vegan.', 'Running the Saturday market from a deckchair, with a clipboard.', 'Selling mulled cider from a stall that is not, officially, hers.'],
    meet: '"Try this," says Priya, holding out a cube of cheese on a stick. It is the best thing you have ever eaten. "Three dollars," she says. "For the cube. Welcome to the square."',
    ask: 'She hands her clipboard to the egg woman and takes you to one side.',
    lines: [
      ['Priya waves a delivery van into a space it cannot possibly fit. It fits.', '"You’ve got the new face," says Priya. "Go and see the record man. He’ll tell you everything about everybody, mostly wrong."', 'Priya is selling a cheese she describes as "shy". It sells out.'],
      ['She gives you a clipboard to hold for an hour. You do not know what it is for. It is clearly very important.', 'Priya tells you which stallholder is feuding with which, and why, and who is winning. The marrow man is winning.', 'She leaves you minding the stall while she goes to shout at somebody. You sell a whole Stilton to a man from the city.'],
      ['"Unofficially," she says, "you’re on the committee." There is no committee. There is Priya.', 'You sit on the dry edge of the fountain and share a pork pie and the last of the Wensleydale, and watch the square empty out.', 'She tells you what every stallholder takes in a week. It is a sign of great trust, or of nobody else listening.'],
    ],
    seasons: ['First market of the spring. Priya has repainted the stall, and the lines of everybody else’s.', 'The square is full of tourists, and Priya is selling cheese at tourist prices. You are not allowed to tell anyone.', 'Apples, pumpkins, and the cider man is back. So is the man with one very large marrow.', 'A Christmas market, with lights Priya put up herself on a ladder nobody would hold.'],
    life: [
      (L) => (L.s.biz ? 'She asks how business is, and then tells you how business is, which is more use.' : null),
      (L) => (L.s.eco >= 1 ? '"Good times," she says, counting a fat cash box. "Make hay. It never lasts."' : null),
      (L) => (L.s.eco <= -1 ? '"Slow," she says, looking at the empty square. "It comes back. Cheese always comes back."' : null),
      (L) => (L.s.plot ? '"What are you growing?" she asks. "Bring me some. I’ll sell it."' : null),
    ],
    loved: { veg: 'She weighs them by eye and puts them straight on the stall, priced. "Thank you," she says. "Also, you are owed nothing."', honey: 'She tastes it off her finger. "Heather," she says. "From up by the church. I know those bees."' },
    hated: { pies: '"I know the man who makes these," says Priya. "I know what goes in them."', rum: '"I sell cheese," she says, "to people who drink that. I have seen what it does."' },
  },

  penn: {
    name: 'Mayor Pennington', call: 'the mayor', Call: 'The mayor', sex: 'm', place: 'townhall', icon: '🎩', corner: 'bay', age: 61,
    look: { skin: 0, hair: 1, top: 6, style: 4, beard: false }, wear: 'chain',
    blurb: 'Mayor of Starling Bay, like his father and his grandfather before him. Has never knowingly missed a photograph.',
    gifts: { love: ['rum', 'painting', 'cur:art'], like: ['flowers', 'shortbread'], hate: ['fish', 'veg'] },
    up: ['Opening things. Anything. He opened a bin last week.', 'Judging the sandcastles at the Regatta, and getting it wrong.', 'Writing a speech for the Harvest Show that runs to four pages.', 'Switching on the Christmas lights, at the second attempt.'],
    meet: '"Pennington," says the mayor, shaking your hand while looking over your shoulder for a photographer.',
    ask: 'He shows you into the parlour and closes the door.',
    lines: [
      ['He tells you the Town Hall clock is four minutes slow on purpose, "so that people are early for me".', 'He asks what you do, and then what your parents do, and then whether you vote.', 'He tells you about the new litter bins. He tells you a great deal about the new litter bins.'],
      ['He shows you the mayor’s parlour: oak, a portrait of every mayor since 1832, and a drinks cabinet he opens with a little key.', 'He tells you a long story about a ribbon he once cut that turned out to be holding up a marquee.', '"Between ourselves," he says, and tells you something the whole town knows.'],
      ['He takes off the chain of office and lets you hold it. It is very heavy. "That," he says, "is the point."', 'He calls you by your first name, and then looks round, as though he might be overheard being human.', 'He admits he cannot stand brass bands. He has opened forty-one brass band contests.'],
    ],
    seasons: ['He has been asked to judge the bonny babies at the Spring Fair, and is terrified.', 'A new hat for Regatta Day, a speech for Regatta Day, and a deep fear of boats.', 'Budget week. He has the look of a man who has seen the figures.', 'He switches the Christmas lights on, and they go off, and he switches them on again. The town applauds, from habit.'],
    life: [
      (L) => (L.s.job && L.s.job.c === 'politics' && L.s.job.r < 4 ? '"A colleague," he says, with the expression of a man spotting a rival.' : null),
      (L) => (L.s.f.drains === -1 ? 'He winks at you. You wish he would not.' : null),
      (L) => (L.s.karma >= 40 ? '"The town thinks well of you," he says. "Have you ever thought of standing for something? Not my seat. Something else."' : null),
      (L) => (L.s.fame >= 30 ? 'He would like a photograph with you, for the parlour. And for the Gazette. And for his mother.' : null),
    ],
    loved: { rum: 'He unlocks the drinks cabinet with the little key and puts it in, reverently.', painting: '"For the parlour!" he says, and hangs it next to his grandfather.', 'cur:art': '"For the parlour!" he says, and hangs it next to his grandfather.' },
    hated: { fish: '"Constituents," he says heavily, "are always giving me fish."', veg: '"Constituents," he says heavily, "are always giving me vegetables."' },
  },
};

// The corners of town, for "a friend in every corner".
export const CORNERS = { water: 'down by the water', bay: 'in the middle of the Bay', old: 'in the old town', edge: 'on the edge of town' };

// What can be given. Some things are bought for the purpose (cost); the
// rest are things of your own, while you have them.
export const GOODS = {
  flowers: { name: 'A bunch of flowers', said: 'flowers', icon: '💐', cost: 25 },
  shortbread: { name: 'A tin of shortbread', said: 'shortbread', icon: '🍪', cost: 15 },
  tea: { name: 'Good loose tea', said: 'good tea', icon: '🫖', cost: 12 },
  pies: { name: 'A bag of meat pies', said: 'meat pies', icon: '🥧', cost: 12 },
  rum: { name: 'A bottle of dark rum', said: 'rum', icon: '🥃', cost: 35 },
  novel: { name: 'A romantic novel', said: 'romantic novels', icon: '📕', cost: 18 },
  seeds: { name: 'Heritage seeds', said: 'seeds', icon: '🌱', cost: 10 },
  fish: { name: 'Fish from your catch', said: 'fresh fish', icon: '🐟', own: 'Fish you caught this season.' },
  veg: { name: 'Vegetables from your plot', said: 'vegetables', icon: '🧺', own: 'From your allotment, this season or last.' },
  honey: { name: 'A jar of the vicar’s honey', said: 'honey', icon: '🍯', own: 'The vicar’s bees make it.' },
  painting: { name: 'One of your paintings', said: 'paintings', icon: '🖼️', own: 'Paint the view in the park.' },
  marrow: { name: 'Your show marrow', said: 'marrows', icon: '🥒', own: 'From your allotment, in autumn.' },
};
