// New in Town: the stories of the other seven careers, Sal's crew among them
// (the first seven are in careers-tales.js, which says how a chapter is
// written; how they are told is in careers.js).

const BOATS = ['Morwenna', 'Kittiwake', 'Silver Spray', 'Lowena', 'Girl Jenny', 'Boy Daniel', 'Sea Holly'];

export function tales({ perf, credit, bonus, busy, mentor, rival, sack, up, gaz, trait, T, money }) {
  const EVER = 4000;
  // Leaving of your own accord, with no hard feelings: out of the job, and not back for a
  // while (why: what the job board says), so that a fond farewell cannot be had twice.
  const leave = (L, k, said, why, bar = 16) => sack(L, k, said, { bar, stand: 60, why });
  // Somebody's pupil, from the teaching story.
  const pupil = (k) => { const p = k.f.pupil || { name: 'Jamie Rowe', sex: 'm' }, m = p.sex === 'm'; return { ...p, first: p.name.split(' ')[0], he: m ? 'he' : 'she', He: m ? 'He' : 'She', him: m ? 'him' : 'her', his: m ? 'his' : 'her' }; };
  // How it went with the pupil: 1 helped, 0 left be, -1 sent to the Principal.
  const helped = (k) => (k.f.pupil ? k.f.pupil.n || 0 : 0);
  const setPupil = (k, n) => { if (!k.f.pupil) k.f.pupil = { name: 'Jamie Rowe', sex: 'm' }; k.f.pupil.n = n; };
  // What the Gazette has found, four days before polling: [about, coming clean, the proof].
  const SCANDAL = {
    folder: ['the folder, and who leaked it', 'You tell the Gazette where the folder came from, and that you should have burned it.', 'the note that came with the folder, in your handwriting,'],
    record: ['your criminal record, which it has printed in full', 'You talk about it on the radio for an hour: what you did, and what you did after.', 'the court records'],
    past: ['things people say you did, years ago, behind the ice house', 'You tell the Gazette what you did behind the ice house, and that you have not been back.', 'a photograph of you behind the ice house'],
    duck: ['your expenses, and in particular a claim for a duck house', 'You give the Gazette every receipt, and a photograph of the duck house, which you have since given to the park.', 'the receipt for the duck house'],
  };
  const scandal = (L, k) => (k.f.dirty ? 'folder' : L.s.record ? 'record' : L.s.n.crimes >= 3 ? 'past' : 'duck');
  // The partner who has read the Sunday papers, if there is one.
  const sweetheart = (L) => { const p = L.partner(); return p && (p.kind === 'partner' || p.kind === 'spouse') ? p : null; };
  // Sal behind the ice house (salIn), or retired to Spain for good (salSpain): see salWhere in heists.js.
  const salIn = (L) => !L.salWhere || L.salWhere() === 'here';
  const salSpain = (L) => !!L.salWhere && L.salWhere() === 'spain';

  return {
    // ---- music: a borrowed tune, a deal for one, the Sunday papers, and the old band ----
    arts: {
      party: 'Cannery Studios, where the band plays your songs back at you, slightly wrong, and the whole of the Gull comes to sing along.',
      gift: 'a gold disc, a real one, with a dent in it from the post',
      ch: [
        {
          r: 0, icon: '🎤', title: 'Friday at the Gull',
          text: (L, k) => `${k.M.name} played on records you have heard of, and will not say which. These days ${k.M.he} plays the Gull on Fridays and lets the young ones on in the interval. This week there is room for one, and ${k.R.name}, who plays your songs but louder, is already tuning up.`,
          opts: [
            { t: 'Ask to play together', check: ['charm', 35], run(L, k, win) { mentor(L, k, 4); if (win) { rival(L, k, 18); return `You do three songs badly, then one very well. The bar notices. ${k.R.first} buys the drinks, then you do, and then it is two in the morning.`; } rival(L, k, 6); return `${k.R.first} says no, then lets you play the tambourine. You play it with real feeling.`; } },
            { t: 'Get on first', run(L, k) { rival(L, k, -15); perf(L, 3); mentor(L, k, 2); return `You are on before ${k.R.first} has finished tuning. It goes well. ${k.R.first} watches the whole thing with ${k.R.his} arms folded.`; } },
            { t: (L, k) => `Let ${k.R.first} have it, and listen`, run(L, k) { rival(L, k, 6); mentor(L, k, 6); return `${k.R.first} is better than you thought. ${k.M.first} sits next to you and talks all the way through, about chords.`; } },
          ],
        },
        {
          r: 1, icon: '📀', title: 'That tune',
          text: (L, k) => `The song people shout for is yours, and it is good. Then one night ${k.M.name} puts on a record from 1979, and halfway through the second side there it is, your tune, note for note, with ${k.M.first} on guitar.`,
          opts: [
            { t: (L, k) => `Put ${k.M.his} name on it`, run(L, k) { mentor(L, k, 12); L.karma(2); return `${k.M.first} shrugs and says you can have it. You put ${k.M.his} name on it anyway. ${k.M.He} pretends not to be pleased.`; } },
            { t: 'Say nothing', odds: () => 0.6, run(L, k, win) { if (win) { L.fame(2); return 'Nobody else has heard that record. Nobody else ever will, probably.'; } mentor(L, k, -20); L.fame(-1); return `${k.M.first} hears it on the radio and rings you. ${k.M.He} does not shout, which is worse.`; } },
            { t: 'Rewrite it until it is yours', check: ['craft', 45], run(L, k, win) { L.gain('craft', 1.5); if (win) { perf(L, 4); return 'A new middle, a different key, a line about the harbour. It is yours now, and better.'; } return 'You rewrite it into something nobody shouts for.'; } },
          ],
        },
        {
          r: 2, icon: '✍️', title: 'Just you',
          text: (L, k) => `A man from a London label has heard the band at the Regatta and taken you for a curry. He wants you: not the band, you. ${k.R.name}, who sings with you and wrote half the songs, is waiting outside in the van.`,
          opts: [
            { t: 'Sign, on your own', run(L, k) { L.fame(5); perf(L, 6); rival(L, k, -30); k.f.deal = 'solo'; return `You sign on a paper napkin. The band finds out from the Gazette. ${k.R.first} keeps the van.`; } },
            { t: 'The band, or nobody', run(L, k) { rival(L, k, 15); L.karma(2); L.fame(1); k.f.deal = 'band'; return `He goes back to London on the late train. The band plays the Gull on Friday as usual, and ${k.R.first} knows why.`; } },
            { t: (L, k) => `Ask ${k.M.first} to read the contract first`, show: (L, k) => !k.M.dead, run(L, k) { mentor(L, k, 6); L.fame(3); perf(L, 3); k.f.deal = 'careful'; return `${k.M.first} reads it with a pencil and crosses out a third of it. The man from London goes pale, then agrees to the band as well, and to the songs staying yours.`; } },
          ],
        },
        {
          r: 3, icon: '📰', title: 'The Sunday papers',
          text: (L) => `A Sunday paper has photographs of you at a party in the city at four in the morning, with somebody else’s husband and a mirror on a table that should not have been on a table.${sweetheart(L) ? ` ${sweetheart(L).name} has seen them.` : ''}`,
          opts: [
            { t: 'Say sorry, in public, and mean it', run(L) { L.fame(-2); L.karma(2); const p = sweetheart(L); if (p) L.bond(p, -8); return 'You say it on the radio, plainly. It is a story for a week, and then it is not.'; } },
            { t: 'Deny it all', odds: () => 0.5, run(L, k, win) { if (win) { L.fame(1); return 'Your lawyer has a word, the paper prints a correction on page thirty-one, and everybody believes the photographs anyway.'; } L.fame(-6); perf(L, -8); const p = sweetheart(L); if (p) L.bond(p, -15); return 'The paper has more photographs.'; } },
            { t: T('joker', 'Go on the radio and make it the funniest thing anybody has heard all year'), show: (L) => trait(L, 'joker'), run(L) { L.fame(3); L.joy(3); const p = sweetheart(L); if (p) L.bond(p, -5); return 'You do the mirror, the husband and the four in the morning as a turn, with voices. By Tuesday it is your story, not theirs.'; } },
            { t: 'Say nothing, and write a song about it', check: ['craft', 60], run(L, k, win) { if (win) { L.fame(6); const n = bonus(L, 3); return `It is the best thing you have ever written, and the country sings it back at you all summer. ${n} by Christmas.`; } L.fame(-3); return 'It is not the best thing you have ever written. The paper prints the words, with notes.'; } },
          ],
        },
        {
          r: 4, icon: '🎪', title: 'Top of the bill',
          text: (L, k) => `The biggest festival in the country wants you to headline on the Saturday night. It is the same night as ${k.M.dead ? `the concert at the Gull in memory of ${k.M.name}` : `${k.M.name}’s farewell gig at the Gull & Anchor: fifty years of Fridays, and ${k.M.he} asked you first`}.`,
          opts: [
            { t: 'The festival', run(L, k) { L.fame(6); mentor(L, k, -20); const n = bonus(L, 4); const rose = !k.top && up(L, k); return `A hundred thousand people, and the sound they make. You ring the Gull from the side of the stage, and nobody can hear you. ${n} for the night.${rose ? ` The papers call you a ${L.jobTitle()} on Monday, and mean it.` : ''}`; } },
            { t: 'The Gull', run(L, k) { mentor(L, k, 20); L.karma(3); L.fame(3); return `Eighty people, ${k.M.dead ? `${k.M.first}’s old guitar on a stand` : `${k.M.first}’s old Stratocaster, and you on second guitar`}. Somebody films the last song on a telephone, and a million people have watched it by Tuesday.`; } },
            { t: (L, k) => `Both: bring ${k.M.first} to the festival`, check: ['charm', 55], show: (L, k) => !k.M.dead, run(L, k, win) { if (!win) { mentor(L, k, 5); L.fame(3); return `${k.M.first} will not go. “Fields are for cows.” You play the festival and dedicate the last song to the Gull.`; } mentor(L, k, 15); L.fame(5); const rose = !k.top && up(L, k); gaz(L, k, `{He} once brought ${k.M.name} on stage in front of a hundred thousand people, to play the song {he} had borrowed.`); return `You bring ${k.M.first} on for the last song. ${k.M.He} plays the solo from 1979, and the field goes quiet, and then it does not.${rose ? ` You are a ${L.jobTitle()} by Monday.` : ''}`; } },
          ],
        },
        {
          r: 4, icon: '🚐', title: 'One more time',
          text: (L, k) => (k.R.v < 0
            ? `${k.R.name} has written a book about the old band, and you are in most of it, not kindly. It is called The Van.`
            : `${k.R.name} rings, twenty years on: the old band, one more tour, the same van if it still goes.`),
          opts: [
            { t: 'For the money', show: (L, k) => k.R.v >= 0, run(L, k) { L.fame(3); rival(L, k, 10); const n = bonus(L, 10); return `Twenty towns, the old songs, and the van breaks down outside Kettleby as it always did. It pays ${n}.`; } },
            { t: 'For nothing: for the lifeboat', show: (L, k) => k.R.v >= 0, run(L, k) { L.karma(6); L.fame(4); rival(L, k, 15); gaz(L, k, '{He} played the old songs one last time, for the lifeboat, and the whole of Starling Bay sang them back.'); return 'The last night is at the Gull, and the lifeboat crew carry the van the last hundred yards. It raises enough for a new engine.'; } },
            { t: 'No: leave it where it was', show: (L, k) => k.R.v >= 0, run(L, k) { rival(L, k, -10); return 'Some things are better remembered. You put the old record on instead, and it is.'; } },
            { t: 'Sue', cost: 5000, odds: () => 0.5, show: (L, k) => k.R.v < 0, run(L, k, win) { rival(L, k, -15); if (win) { L.cash(20000); return 'Chapter nine is withdrawn, and you are paid $20,000 to stop talking about it. The book sells twice as well.'; } return 'The judge has read the book, and laughed in the wrong places. Your $5,000 goes on the lawyers.'; } },
            { t: 'Read it, and laugh', check: ['charm', 50], show: (L, k) => k.R.v < 0, run(L, k, win) { if (win) { rival(L, k, 45); L.fame(2); return `You review it for the Sunday paper: “mostly true, and very funny.” ${k.R.first} rings, and you talk for two hours.`; } L.joy(-3); return 'You laugh in public and seethe in private. The book is everywhere.'; } },
            { t: 'Answer it with a song', check: ['craft', 65], show: (L, k) => k.R.v < 0, run(L, k, win) { rival(L, k, -10); if (win) { L.fame(5); return 'It is called The Other Van. It is better than the book, and everybody says so.'; } return 'It is a song about a book. Nobody wants a song about a book.'; } },
          ],
        },
      ],
    },

    // ---- sport: a place on the team, a knee, a man with a bag, and one last summer ----
    sports: {
      party: 'The Tidewater Gym, with a cake in the shape of a running track and the whole squad in tracksuits.',
      gift: 'your old shirt, framed, with everybody’s names on the back',
      ch: [
        {
          r: 0, icon: '⏱️', title: 'Six in the morning',
          text: (L, k) => `Coach ${k.M.last} nearly went to the Olympics in 1990 and does not want to talk about it. ${k.M.He} runs the squad from the Tidewater Gym at six in the morning, and has put you in a lane next to ${k.R.name}, who is younger and a good deal faster and knows it.`,
          opts: [
            { t: (L, k) => `Race ${k.R.him} flat out, every morning`, check: ['fitness', 40], run(L, k, win) { if (win) { rival(L, k, -10); perf(L, 4); return `By the end of the month you beat ${k.R.him} once. ${k.R.He} does not speak to you for a week. Coach writes something on the clipboard.`; } rival(L, k, -5); L.joy(-2); return `${k.R.He} beats you every morning, and waves.`; } },
            { t: (L, k) => `Train with ${k.R.him}, not against ${k.R.him}`, run(L, k) { rival(L, k, 15); return `You pace each other all winter. By the spring you are both faster, and ${k.R.first} has stopped waving.`; } },
            { t: 'Ask Coach for extra sessions', run(L, k) { mentor(L, k, 10); L.hp(-1); credit(L, 1); return 'Five in the morning, then. Coach is there before you every time, with a flask.'; } },
          ],
        },
        {
          r: 1, icon: '📋', title: 'Selection',
          text: (L, k) => `One place on the county team for the championships, and two names: yours and ${k.R.name}’s. Coach will pick on Saturday, after the time trial.`,
          opts: [
            { t: 'Run your race', check: ['fitness', 55], run(L, k, win) { if (win) { perf(L, 6); L.fame(1); rival(L, k, -8); return `You win by a vest, and you are in. ${k.R.first} shakes your hand and means about half of it.`; } L.joy(-4); rival(L, k, 5); return `${k.R.first} wins by a vest. You shake hands. It is the right thing to do, and it hurts.`; } },
            { t: (L, k) => `Mention that ${k.R.first} was at the Gull until two on Thursday`, run(L, k) { L.karma(-4); rival(L, k, -25); perf(L, 4); return `It is true, and Coach picks you, and ${k.R.first} knows exactly who told.`; } },
            { t: (L, k) => `Tell Coach to take ${k.R.first}`, run(L, k) { rival(L, k, 20); L.karma(3); perf(L, -2); mentor(L, k, 4); return `Coach looks at you for a long moment, and takes ${k.R.first}, and remembers.`; } },
          ],
        },
        {
          r: 2, y: 20, icon: '🦵', title: 'The knee',
          text: () => 'A bad landing in training, and your knee goes sideways and stays there. The surgeon says six months out and a long way back. The club doctor says there are injections, and a big meeting in three weeks.',
          opts: [
            { t: 'The operation, and the long way back', run(L, k) { busy(L, 3); perf(L, -5); L.hp(-4, 'an operation'); k.f.knee = 'fixed'; return 'Six months on crutches, then a bicycle that goes nowhere. You are slower when you come back, and then, one morning, you are not.'; } },
            { t: 'The injections, and run', odds: () => 0.6, run(L, k, win) { if (win) { perf(L, 6); L.fame(2); return 'You run. You win. The knee holds, for now, and you try not to think about it.'; } L.lose('fitness', 8); L.sicken('bad knee', 2); perf(L, -6); k.f.knee = 'bad'; return 'The knee goes again on the last bend, worse. It will never be what it was.'; } },
            { t: 'Ask Coach what to do', run(L, k) { mentor(L, k, 6); busy(L, 2); perf(L, -3); k.f.knee = 'fixed'; return 'Coach says the operation, and drives you to every appointment, and sits in the waiting room doing the crossword.'; } },
          ],
        },
        {
          r: 3, y: 30, icon: '💉', title: 'A doctor with no surname',
          text: (L, k) => `A man with a doctor’s bag and no surname is in the car park after training. Something that helps with recovery, he says: half the league is on it, and ${k.R.name} certainly is.`,
          opts: [
            { t: 'Refuse', run(L) { L.karma(1); return 'You go home and have a bath, like a normal person.'; } },
            { t: 'Take it', run(L, k) { L.gain('fitness', 6); perf(L, 8); L.karma(-4); k.f.doped = 1; return 'You recover from training in a night instead of a week. You are faster than you have been since you were twenty. You do not look too closely at why.'; } },
            { t: 'Report him, and say who else', run(L, k) { L.karma(4); rival(L, k, -30); perf(L, -4); k.f.reported = 1; return `The man with the bag is gone by Monday. So, for two years, is ${k.R.first}. The changing room is a cold place for a while.`; } },
          ],
        },
        {
          r: 3, y: 34, gap: 4, icon: '🧪', title: 'Six in the morning, again',
          text: (L, k) => (k.f.doped
            ? 'Six in the morning, and there are two testers at the gym door with clipboards and little plastic pots. Nobody knew they were coming. That is the point of them.'
            : `Six in the morning, and there are two testers at the gym door with clipboards and little plastic pots. You hand yours over without a thought. ${k.f.reported ? `${k.R.name}, back from ${k.R.his} ban, hands over ${k.R.his} and looks straight at you.` : `${k.R.name}, beside you, goes very pale.`}`),
          opts: [
            { t: 'Give your sample', odds: () => 0.5, show: (L, k) => !!k.f.doped, run(L, k, win) { if (win) return 'Clean. Whatever it was had gone through. You stop taking it that afternoon, and your hands shake for a week.'; L.fame(-10); L.karma(-5); gaz(L, k, '{He} was banned from sport for four years, which {he} did not talk about either.'); sack(L, k, `Banned from sport for four years, as ${k.title}.`, { bar: 16, why: 'Banned from sport' }); return 'Positive. A four-year ban, your name in every paper, and your medals in a drawer.'; } },
            { t: 'Climb out of the changing-room window', odds: () => 0.3, show: (L, k) => !!k.f.doped, run(L, k, win) { if (win) return 'You are “ill”. They come back in a month, by which time you are clean, and very lucky.'; L.fame(-12); L.karma(-5); sack(L, k, `Banned from sport for four years, as ${k.title}.`, { bar: 16, why: 'Banned from sport' }); return 'Missing a test counts as failing one, and climbing out of a window counts as a story.'; } },
            { t: 'Say nothing', show: (L, k) => !k.f.doped, run(L) { perf(L, 2); return 'You run your session and go home. What anybody else had in their pot is between them and the pot.'; } },
            { t: (L, k) => `Have a quiet word with ${k.R.him} first`, show: (L, k) => !k.f.doped && !k.f.reported, run(L, k) { rival(L, k, 22); L.karma(2); return `${k.R.He} tells you everything in the car park. ${k.R.He} owns up before the result comes, gets two years instead of four, and sends you a card from wherever ${k.R.he} is.`; } },
            { t: 'Tell Coach what you saw', show: (L, k) => !k.f.doped, run(L, k) { rival(L, k, -20); mentor(L, k, 5); perf(L, 4); return `Coach already knew. ${k.R.first} is not picked again, and blames you for it.`; } },
          ],
        },
        {
          r: 3, y: 44, icon: '🏅', title: 'One last summer',
          text: (L, k) => `You are ${L.s.age}. The national championships are in August, and Coach thinks there is one more good summer in your legs${k.f.knee === 'bad' ? ', whatever your knee thinks' : ''}. ${k.R.name} is entered too.`,
          opts: [
            { t: 'Go for the title', check: ['fitness', 75], run(L, k, win) { if (!win) { perf(L, -2); return `Fourth. ${k.R.first} gets the bronze, and finds you in the car park after, and does not say anything, which is kind.`; } L.fame(4); mentor(L, k, 8); const rose = !k.top && up(L, k); gaz(L, k, '{He} won the national championships one August, and fell over the line laughing.'); return `You win by a stride, fall over the line, and lie on the track laughing. ${rose ? `${L.jobTitle()}.` : 'Another medal for the drawer.'} ${k.M.dead ? 'You dedicate it to Coach, who would have said you went off too fast.' : 'Coach cries, and says it is the wind.'}`; } },
            { t: 'Go out on top', run(L, k) { L.fame(3); const n = bonus(L, 6); L.joy(6); leave(L, k, `Retired from sport as ${k.title}, on top.`, 'You have hung up your boots', EVER); return `A testimonial at the Tidewater, a lap of honour on a borrowed track, and ${n}. Now: what next?`; } },
            { t: (L, k) => `Coach ${k.R.first} instead`, show: (L, k) => !k.R.dead && k.R.v >= 0, run(L, k) { rival(L, k, 25); mentor(L, k, 6); return `You spend the summer at the side of the track with a stopwatch. ${k.R.first} wins silver, and gives you the ribbon.`; } },
          ],
        },
      ],
    },

    // ---- teaching: a boy at the back, the marks, a stolen chapter, and the college ----
    teaching: {
      party: 'The staff room at Starling College, with the good biscuits out for once, and a row of former pupils who have come back to say you were strict.',
      gift: 'a book of letters from forty years of pupils, some of them spelled correctly',
      prep(L, st) { if (!st.f.pupil) { const sex = L.chance(0.5) ? 'm' : 'f'; st.f.pupil = { name: `${L.pick(sex === 'm' ? ['Danny', 'Liam', 'Kieran', 'Jordan', 'Callum', 'Ryan'] : ['Shannon', 'Kayleigh', 'Jade', 'Chloe', 'Leanne', 'Megan'])} ${L.pick(['Rowe', 'Tonkin', 'Opie', 'Clemo', 'Annear', 'Bray'])}`, sex }; } },
      ch: [
        {
          r: 0, icon: '🎒', title: 'The back row',
          text: (L, k) => { const P = pupil(k); return `${k.M.name} has taught at Starling College for thirty-one years and still reads poems aloud as if they were new. ${k.R.name}, who laminates everything, shares your room. And in the back row sits ${P.name}, sixteen, from the catering course, who has handed nothing in since September.`; },
          opts: [
            { t: (L, k) => `Stay behind with ${pupil(k).him} on Thursdays`, run(L, k) { const P = pupil(k); busy(L, 1); mentor(L, k, 8); L.karma(2); setPupil(k, 1); return `It takes a term to get a sentence out of ${P.him}, and another to get a paragraph. Then one Thursday ${P.he} hands in four pages about ${P.his} grandad’s boat, and you have to go and sit in the car for a bit.`; } },
            { t: (L, k) => `Leave ${pupil(k).him} be`, run(L, k) { const P = pupil(k); setPupil(k, 0); return `${P.He} drifts, and leaves at Easter. You think of ${P.him} sometimes, when you look at the empty desk.`; } },
            { t: (L, k) => `Send ${pupil(k).him} to the Principal`, run(L, k) { const P = pupil(k); perf(L, 2); rival(L, k, 6); setPupil(k, -1); return `${P.He} is suspended for a week, and comes back worse. ${k.R.first} says you did the right thing.`; } },
          ],
        },
        {
          r: 1, icon: '📝', title: 'The inspectors',
          text: (L, k) => `The inspectors are coming on Monday. ${k.R.name} has been rehearsing the same lesson with ${k.R.his} class for a fortnight, down to who puts a hand up when.`,
          opts: [
            { t: 'Teach as you always do', check: ['smarts', 45], run(L, k, win) { if (win) { perf(L, 8); return 'The inspector sits at the back, stops writing after ten minutes, and listens. “Outstanding,” she writes, and underlines it.'; } perf(L, -4); return 'A wasp gets in. The inspector writes “requires improvement”, and something about the wasp.'; } },
            { t: T('bookish', 'Teach them the poem you love best'), show: (L) => trait(L, 'bookish'), run(L) { perf(L, 8); return 'Twenty minutes on one poem, and a girl at the back who has never said a word reads it out loud. The inspector puts her pen down.'; } },
            { t: 'Rehearse a lesson too', run(L) { perf(L, 4); L.karma(-2); return 'It goes like clockwork, which is what it was. The class is very good at it by now.'; } },
            { t: (L, k) => `Tell the inspector about ${k.R.first}’s rehearsals`, run(L, k) { rival(L, k, -25); L.karma(1); perf(L, 2); return `The inspector asks ${k.R.first}’s class to do something else instead, and they cannot. ${k.R.first} knows who told.`; } },
          ],
        },
        {
          r: 2, icon: '📊', title: 'The marks',
          text: () => 'The Principal calls you in. The college’s money for next year depends on this year’s marks, and this year’s marks are not what they need to be. Could you look at yours again, generously?',
          opts: [
            { t: 'Look at them again, generously', run(L, k) { perf(L, 8); L.karma(-6); k.f.marks = 1; return 'Forty students do a good deal better than they did. The college gets its money. You do not look at the marks again.'; } },
            { t: 'Refuse', check: ['charm', 50], run(L, k, win) { L.karma(3); mentor(L, k, 6); if (win) { perf(L, -2); return 'You explain, very politely, what the inspectors would say. The Principal finds the money somewhere else.'; } perf(L, -10); return 'The Principal finds somebody who will, and gives you the timetable nobody wants.'; } },
            { t: 'Do it, and keep a copy of the memo', run(L, k) { perf(L, 5); L.karma(-2); k.f.memo = 1; return 'You do it, and put the Principal’s memo in a shoebox under your bed, where it waits.'; } },
          ],
        },
        {
          r: 3, icon: '📚', title: 'Chapter four',
          text: (L, k) => `${k.R.name}’s new book is out, to good reviews. Chapter four is yours: your research, your sentences, your joke about the Romans, with ${k.R.his} name on the cover.`,
          opts: [
            { t: 'Take it to the Dean', check: ['smarts', 55], run(L, k, win) { if (win) { rival(L, k, -30); perf(L, 8); L.fame(1); return `The Dean compares the two, page by page, with a ruler. ${k.R.first} withdraws the book and apologises in the staff room, at length, to the wall.`; } rival(L, k, -20); perf(L, -4); return 'The Dean calls it “a matter between colleagues” and goes to lunch. Now everybody knows, and nobody can prove it.'; } },
            { t: (L, k) => `Have it out with ${k.R.him}`, check: ['charm', 50], run(L, k, win) { if (win) { rival(L, k, 22); return `${k.R.He} goes very red, then tells you about the deadline, and the divorce, and the night ${k.R.he} did it. The second edition has your name on it, beside ${k.R.his}.`; } rival(L, k, -15); return `${k.R.He} says great minds think alike. You say one of them is not great, and not a mind. It goes downhill from there.`; } },
            { t: 'Let it go, and write a better one', run(L) { L.gain('smarts', 2); perf(L, 3); L.fame(2); return 'It takes three years. It is better. Nobody remembers the other one.'; } },
          ],
        },
        {
          r: 3, icon: '🚪', title: 'Somebody to see you',
          text: (L, k) => { const P = pupil(k); return helped(k) > 0 ? `There is somebody at your door: ${P.name}, from the back row, thirty now, in a suit that fits. ${P.He} is head chef at a restaurant in the city with a star, and has come to ask you to the opening of ${P.his} second.` : `A letter from a solicitor in Kettleby. ${P.name}, who sat in the back row of your class, is in court next month for breaking into the post office, and has asked for a character reference from the only teacher ${P.he} remembers.`; },
          opts: [
            { t: 'Go to the opening', show: (L, k) => helped(k) > 0, run(L, k) { const P = pupil(k); busy(L, 1); L.joy(10); L.karma(2); L.s.f.mentor = 1; gaz(L, k, '{He} taught at Starling College for many years, and one of {his} pupils has never stopped sending a card at Christmas.'); return `${P.He} has put your four pages about ${P.his} grandad’s boat in a frame by the door. You have to go and sit in the car for a bit.`; } },
            { t: (L, k) => `Ask ${pupil(k).him} to come and talk to your students`, show: (L, k) => helped(k) > 0, run(L, k) { const P = pupil(k); perf(L, 6); L.fame(1); L.s.f.mentor = 1; return `${P.He} tells them about the back row, and about Thursdays. Three of them hand their homework in the next week.`; } },
            { t: 'Write it, and mean it', show: (L, k) => helped(k) <= 0, run(L, k) { const P = pupil(k); L.karma(4); return `${P.He} gets a suspended sentence and a place on a course. ${P.He} writes to you once, on lined paper, to say so.`; } },
            { t: (L, k) => `Go to court and speak for ${pupil(k).him}`, show: (L, k) => helped(k) <= 0, run(L, k) { const P = pupil(k); busy(L, 1); L.karma(6); L.joy(3); gaz(L, k, `{He} once stood up in court for a pupil everybody else had given up on.`); return `You tell the court about the back row, and about the empty desk. ${P.He} gets a course instead of prison, and finishes it.`; } },
            { t: (L, k) => `You hardly knew ${pupil(k).him}`, show: (L, k) => helped(k) <= 0, run(L) { L.karma(-2); return 'You put the letter in a drawer, and it stays there, and so does the feeling.'; } },
          ],
        },
        {
          r: 4, icon: '🏫', title: 'The college',
          text: (L, k) => (k.top
            ? 'The county means to merge Starling College into the big college at Kettleby and sell the building for flats. You are the Dean, and it is your signature they want.'
            : 'The county means to merge Starling College into the big college at Kettleby and sell the building for flats. The Dean retires in June, and whoever comes next will have to make it happen, or stop it.'),
          opts: [
            { t: 'Fight it', check: ['charm', 60], run(L, k, win) { if (!win) { perf(L, -4); return 'The county wins. The college moves to Kettleby, and the old building becomes flats called The Old College, which is something.'; } L.karma(4); L.fame(2); const rose = !k.top && up(L, k); gaz(L, k, '{He} saved Starling College from the county, and has a lecture theatre named after {him} to prove it.'); return `A year of meetings, petitions and one memorable evening with the county treasurer. The college stays.${rose ? ` And you are ${L.jobTitle()}, which is what you get for winning.` : ''}`; } },
            { t: 'Make it work', run(L, k) { L.karma(-3); const rose = !k.top && up(L, k); return `${rose ? `You are ${L.jobTitle()}, of a college with two buildings and one name.` : 'You sign.'} The merger goes smoothly, which is the worst thing anybody says about it.`; } },
            { t: 'Go back to the classroom', run(L, k) { perf(L, 2); L.joy(4); mentor(L, k, 6); return 'You do not want the chair. You want room twelve, and a class, and a poem to read aloud. You get all three.'; } },
          ],
        },
      ],
    },

    // ---- the sea: a winch, the quota, a man overboard, and a mayday off the Shrikes ----
    sea: {
      party: 'The Gull & Anchor, with the whole fleet in, every skipper buying a round, and a cake in the shape of a trawler.',
      gift: 'a brass barometer that has never once been right',
      prep(L, st) { if (!st.f.boat) { const two = BOATS.slice(); st.f.boat = two.splice(L.int(0, two.length - 1), 1)[0]; st.f.rboat = L.pick(two); } },
      ch: [
        {
          r: 0, icon: '⚙️', title: 'The winch',
          text: (L, k) => `${k.M.name} has skippered the ${k.f.boat} out of Starling Bay for twenty-five years, and has opinions about knots that ${k.M.he} shares with anybody. Ten miles out on your third trip, the winch jams with a full net, and ${k.R.name}’s sleeve is caught in it.`,
          opts: [
            { t: 'Cut the net', run(L, k) { rival(L, k, 20); mentor(L, k, 5); perf(L, -3); return `A day’s catch gone to the bottom, and ${k.R.first} with both arms. ${k.M.first} says nothing about the money, all the way home.`; } },
            { t: 'Get the sleeve free by hand', check: ['fitness', 35], run(L, k, win) { if (win) { rival(L, k, 15); perf(L, 3); return `You get ${k.R.him} out, and the catch in. ${k.M.first} gives you the first cup from the flask, which on the ${k.f.boat} is a medal.`; } L.hp(-8, 'a winch'); rival(L, k, 12); return `You get ${k.R.him} out, and leave a slice of your thumb in the winch.`; } },
            { t: 'Shout for the skipper', run(L, k) { rival(L, k, 4); return `${k.M.first} has it stopped in a second. “Next time,” ${k.M.he} says, “you do that.”`; } },
          ],
        },
        {
          r: 1, icon: '🐟', title: 'Over the quota',
          text: (L, k) => `The hold is full, and a third of it is cod you have no quota for. ${k.M.first} says it goes over the side, dead, as the rules say. ${k.R.name} says there is a man with a van on the quay who pays cash and asks nothing.`,
          opts: [
            { t: 'Over the side', run(L) { L.karma(-1); return 'A carpet of dead cod on the sea, for the gulls. It is the law. It feels like something else.'; } },
            { t: 'The man with the van', run(L, k) { L.karma(-2); rival(L, k, 10); mentor(L, k, -8); k.f.van = 1; const n = bonus(L, 2), caught = L.crime(0.12, 1, 'forty boxes of cod with no paperwork'); return `Your share is ${n}, in a carrier bag.${caught ? ' And then a fisheries officer with a torch.' : ' Nobody asks where it came from. Somebody always knows.'}`; } },
            { t: 'Land it, declare it, and take the fine', run(L, k) { perf(L, -4); L.karma(3); mentor(L, k, -3); return `${k.M.first} pays the fine and tells you what ${k.M.he} thinks of it for a week. The fisheries office writes your name down, the good way.`; } },
          ],
        },
        {
          r: 2, icon: '🛟', title: 'Man overboard',
          text: (L, k) => `A green sea comes over the bow in the dark and takes ${k.R.name} over the side with it. ${k.R.He} is ten yards off and drifting, and ${k.R.his} lifejacket has not gone off.`,
          opts: [
            { t: (L, k) => `Go in after ${k.R.him}`, check: ['fitness', 55], run(L, k, win) { if (win) { rival(L, k, 40); L.fame(3); perf(L, 6); gaz(L, k, '{He} once went over the side into a winter sea after a shipmate, and brought the shipmate back.'); return `You get an arm round ${k.R.him} and the crew get a line round you both. The Gazette calls it heroic. ${k.R.first} calls it daft, and never stops buying your drinks.`; } L.hp(-20, 'the winter sea'); rival(L, k, 30); return `The cold stops your heart for a second. ${k.M.first} brings the boat round and hauls you both out with a boathook, and you spend a week in St Wren’s in the next bed to ${k.R.first}.`; } },
            { t: 'Throw the ring, and bring her round', check: ['smarts', 45], run(L, k, win) { if (win) { rival(L, k, 20); perf(L, 4); return `The ring lands a yard from ${k.R.him}. Two minutes, by ${k.M.first}’s watch. It feels like two hours.`; } rival(L, k, 10); perf(L, -2); return `It takes three passes and twenty minutes. ${k.R.first} is in hospital for a week with the cold, and alive.`; } },
          ],
        },
        {
          r: 3, icon: '📒', title: 'The quota men',
          text: (L, k) => `The fisheries officers come aboard at the harbour mouth: two of them, with clipboards and a camera. Your logbook says one thing, and your hold says something else, a little.${k.f.van ? ' They have also heard things about a man with a van.' : ''}`,
          opts: [
            { t: 'Show them everything', run(L) { L.cash(-L.shiftPay() * 2); L.karma(2); perf(L, -3); return 'A fine, a warning, and a handshake on the way off. They will be back.'; } },
            { t: 'Talk them round', check: ['charm', 55], run(L, k, win) { if (win) return 'By the time they leave they have had tea, two mackerel each and a story about a whale. Nothing is written down.'; L.cash(-L.shiftPay() * 4); perf(L, -8); return 'They write down the whale as well. A heavy fine, and your licence watched.'; } },
            { t: 'Offer them a box of lobsters', odds: () => 0.5, run(L, k, win) { L.karma(-3); if (win) return 'The lobsters go home in the boot of a car. Nothing is written down.'; perf(L, -10); L.s.n.crimes++; L.queue('busted', { what: 'a box of lobsters and a fisheries officer who did not want them', sev: 2 }); return 'They write down the lobsters as well.'; } },
          ],
        },
        {
          r: 4, icon: '🌩️', title: 'The Shrikes',
          text: (L, k) => `Force ten, and the radio crackles. The ${k.f.rboat}, ${k.R.name}’s boat, has lost her engine on the Shrikes with four aboard. The lifeboat is an hour away. You are ten minutes away, with a full hold and a crew who want to go home.`,
          opts: [
            { t: 'Go to them', check: ['smarts', 55], run(L, k, win) { L.karma(5); rival(L, k, 35); if (win) { L.fame(6); perf(L, 8); gaz(L, k, '{He} took {his} own boat onto the Shrikes in a force ten to bring four men off, and the whole Bay knows it.'); return 'A line across on the third try, and you tow them off the rocks into deep water, where Captain Quinn and the lifeboat find you both. Quinn says “Well done.” It is the longest speech anybody has heard from her.'; } L.hp(-10, 'a storm at sea'); L.cash(-L.shiftPay() * 3); L.fame(3); return 'You get them off, but the line fouls your propeller and the Shrikes take your nets and half your rudder. The lifeboat tows you both home. It was worth every penny of the repairs.'; } },
            { t: 'Stand by until the lifeboat comes', run(L, k) { L.karma(1); rival(L, k, 5); return 'You stand off in the dark with your searchlight on them for an hour, which is all you can safely do, and more than nothing. The lifeboat takes them off.'; } },
            { t: 'Run for harbour', run(L, k) { L.karma(-6); rival(L, k, -40); perf(L, -6); return 'The lifeboat gets them off, just. Nobody in the Gull says anything to you about it, which is how you know.'; } },
          ],
        },
        {
          r: 4, icon: '⚓', title: (L, k) => (k.top ? 'The inner harbour' : 'The harbour'),
          text: (L, k) => (k.top
            ? 'The harbour board wants to fill in the old inner harbour for a car park. The fleet wants to know whose side you are on.'
            : 'Captain Quinn has told the harbour board, in four words, that she cannot run the lifeboat and the harbour both. They want a Harbour Master, somebody the fleet will listen to, and your name keeps coming up in the Gull.'),
          opts: [
            { t: 'Put your name forward', check: ['charm', 55], show: (L, k) => !k.top, run(L, k, win) { if (!win) { perf(L, 2); return 'They pick a man from the city with a laminated chart of the tides. The fleet ignores him beautifully.'; } const rose = up(L, k); mentor(L, k, 6); return `${rose ? `You are ${L.jobTitle()}, with a cap and an office with a view of everything.` : 'They like you, and say there will be another time.'} Quinn nods to you on the quay, which is as good as a speech.`; } },
            { t: 'Stay at sea', show: (L, k) => !k.top, run(L, k) { L.joy(6); perf(L, 4); return 'You do not want a desk. You want the wind and the dark and the lights of the town coming up over the bow. You keep them.'; } },
            { t: 'The fleet’s side', show: (L, k) => k.top, run(L, k) { L.karma(4); L.fame(2); perf(L, -4); gaz(L, k, '{He} kept the inner harbour for the boats when the board wanted a car park.'); return 'The inner harbour stays water. The board is cool with you for a year, and the fleet sends a crate of crab to your door every Friday.'; } },
            { t: 'The board’s side', show: (L, k) => k.top, run(L, k) { perf(L, 6); L.karma(-4); return 'The car park is very useful, and very ugly. The fleet moors outside, in the swell, and says so.'; } },
          ],
        },
      ],
    },

    // ---- the Harbour Bank: a boatyard's loan, a whisper, a bubble, and the chair ----
    finance: {
      party: 'The boardroom at the Harbour Bank, with champagne the bank pays for, which has never happened before.',
      gift: 'a fountain pen that cost more than your first car',
      ch: [
        {
          r: 0, icon: '🏦', title: 'The small print',
          text: (L, k) => `${k.M.name} has managed the Harbour Bank for twenty years and knows every account in town by its owner’s handwriting. ${k.R.name}, on the next counter, wears braces, calls money “liquidity”, and is selling old Mr Rundle an insurance policy he does not need and cannot read.`,
          opts: [
            { t: 'Read it to Mr Rundle, slowly', run(L, k) { L.karma(3); mentor(L, k, 6); rival(L, k, -10); return `He tears it up at the counter, with great dignity. ${k.R.first} loses the commission, and does not forget whose fault that was.`; } },
            { t: 'Mind your own counter', run(L, k) { rival(L, k, 8); L.karma(-1); return `${k.R.first} makes the sale, and the target, and buys you a sandwich.`; } },
            { t: (L, k) => `Tell ${k.M.first}`, run(L, k) { mentor(L, k, 8); rival(L, k, -20); perf(L, 3); return `${k.M.first} has a quiet word with Mr Rundle, and a loud one with ${k.R.first}.`; } },
          ],
        },
        {
          r: 1, icon: '⛵', title: 'Dawe’s boatyard',
          text: (L, k) => `Dawe’s boatyard needs $60,000 to see out the winter, and the rules from head office say no. ${k.M.name} says the rules were written in the city by people who have never seen a boatyard. It is your signature, though.`,
          opts: [
            { t: 'Lend it anyway', odds: () => 0.6, run(L, k, win) { if (win) { L.karma(5); perf(L, 6); mentor(L, k, 5); return 'Dawe’s pays back every cent by the summer, and builds the lifeboat a new tender for nothing.'; } perf(L, -14); L.karma(2); return 'Dawe’s goes under in February anyway, with the bank’s $60,000 in it. Head office writes to you, at length.'; } },
            { t: 'Refuse', run(L) { L.karma(-3); perf(L, 2); return 'Dawe’s closes in March. Twelve jobs. The audit from head office is very pleased with you.'; } },
            { t: 'A smaller loan, and a payment holiday', check: ['smarts', 50], run(L, k, win) { if (win) { L.karma(3); perf(L, 4); return 'It is fiddly, and it works. Dawe’s limps through the winter and sails out of the spring.'; } perf(L, -4); return 'Not enough, and too late. Dawe’s closes anyway, more slowly.'; } },
          ],
        },
        {
          r: 2, icon: '🤫', title: 'Friday',
          text: (L, k) => `${k.R.name} leans across the coffee machine. “Kettleby Cables is being bought on Friday. The whole floor knows. Buy today.”`,
          opts: [
            { t: 'You did not hear it', run(L) { L.karma(2); return 'You change the subject to the weather, which in Starling Bay is always available.'; } },
            {
              t: 'Buy as much as you dare',
              run(L, k) {
                const n = bonus(L, 5), caught = L.crime(0.18, 2, 'a share order dated the day before the news');
                if (!caught) return `${n} by Friday afternoon. Nobody asks. You check, every morning, for a year.`;
                sack(L, k, `Sacked as ${k.title}, for dealing on a whisper.`, { bar: EVER, why: 'No bank will employ you now' });
                return `${n} by Friday afternoon. Then a letter from the exchange, which has people whose whole job is to look at Thursdays.`;
              },
            },
            { t: (L, k) => `Report ${k.R.first} to compliance`, run(L, k) { rival(L, k, -35); L.karma(3); perf(L, 4); return `${k.R.first} is walked out of the building on Monday with a cardboard box. The floor goes quiet when you walk past, and stays quiet.`; } },
          ],
        },
        {
          r: 3, icon: '🌊', title: 'Tidal Power',
          text: (L, k) => `Everybody is buying shares in Tidal Power, which means to light the whole coast with the sea. ${k.R.name}’s fund is up forty per cent. Your clients ring every morning to ask why theirs is not.`,
          opts: [
            { t: 'Buy in, heavily', run(L, k) { perf(L, 8); k.f.bubble = 1; return 'Up twenty per cent in a month. Your clients stop ringing, except to say thank you.'; } },
            { t: 'Stay out', run(L, k) { perf(L, -8); k.f.bubble = 0; return `You are an old stick-in-the-mud, ${k.R.first} says, at lunch. Two of your clients move their money to ${k.R.him}.`; } },
            { t: T('thrifty', 'Put them in the dull old index fund, and wait'), show: (L) => trait(L, 'thrifty'), run(L, k) { perf(L, -4); k.f.bubble = 0; return 'Your clients grumble about the dull old index fund. You tell them dull is the point, and buy your own lunch.'; } },
            { t: 'Bet against it', run(L, k) { perf(L, -4); k.f.bubble = 2; return 'You quietly bet that it will fall. It does not, for months. The risk committee asks to see you.'; } },
          ],
        },
        {
          r: 3, y: 40, gap: 4, icon: '📉', title: 'The tide goes out',
          text: (L, k) => `Tidal Power’s turbines turn out to work only in a laboratory in Kettleby, and the shares go from thirty dollars to forty cents in a week. ${k.f.bubble === 1 ? 'Your clients have lost most of their savings, and the town knows whose advice they took.' : k.f.bubble === 2 ? 'Your bet against it pays the bank a fortune, and you a bonus with a great many noughts.' : `Your clients are the only people in Starling Bay who still have their savings. ${k.R.name}’s are not.`}`,
          opts: [
            { t: 'Face them, one by one', show: (L, k) => k.f.bubble === 1, run(L, k) { perf(L, -14); L.karma(4); gaz(L, k, '{He} lost a good deal of the town’s money in the Tidal Power crash, and went round to say sorry to every one of them.'); return 'You go round to every one of them, with the figures and no excuses. Some of them forgive you. Mr Rundle makes you a cup of tea.'; } },
            { t: 'Blame the market', odds: () => 0.5, show: (L, k) => k.f.bubble === 1, run(L, k, win) { L.karma(-3); if (win) { perf(L, -6); return 'The market is blamed, by everybody, which is convenient. You keep your job, and your clients keep their distance.'; } sack(L, k, `Sacked as ${k.title}, after the Tidal Power crash.`, { bar: 8, why: 'The Harbour Bank has not forgotten Tidal Power' }); return 'The board needs a name for the newspapers, and yours is the one with the most clients on it.'; } },
            { t: 'Take the bonus', show: (L, k) => k.f.bubble === 2, run(L, k) { const n = bonus(L, 12); L.karma(-3); perf(L, 8); return `${n}. People in the Gull look at your new car and do the sums.`; } },
            { t: 'Give half of it to the town’s hardship fund', show: (L, k) => k.f.bubble === 2, run(L, k) { const n = bonus(L, 6); L.karma(6); perf(L, 8); L.s.n.given = (L.s.n.given || 0) + L.shiftPay() * 6; gaz(L, k, '{He} made a fortune when Tidal Power crashed, and gave half of it to the people who had lost theirs.'); return `${n} for you, and the same again to the families who lost their savings. Nobody in the Gull does the sums about your car.`; } },
            { t: 'Say nothing, and look modest', show: (L, k) => !k.f.bubble, run(L, k) { perf(L, 10); L.fame(2); const rose = !k.top && up(L, k); return `The board notices who kept their head. ${rose ? `You are ${L.jobTitle()} by the spring.` : 'So does the town.'}`; } },
            { t: '“I did say.”', show: (L, k) => !k.f.bubble, run(L, k) { perf(L, 8); rival(L, k, -20); L.joy(5); return `At lunch, to ${k.R.first}, across a very small table. It is not big and it is not clever, and it is lovely.`; } },
          ],
        },
        {
          r: 4, icon: '🪑', title: (L, k) => (k.top ? 'An offer for the bank' : 'The chair'),
          text: (L, k) => (k.top
            ? 'A bank from the city wants to buy the Harbour Bank. The price is very good, and the first thing they would close is the branch on the harbour.'
            : `The Chair of the Harbour Bank is retiring, and the board wants growth: branches closed, the harbour office sold, the town run from a call centre.${k.M.dead || !k.M.here ? '' : ` ${k.M.name}, long retired, writes to you in fountain pen: keep the bank on the harbour.`}`),
          opts: [
            { t: 'Promise them growth', show: (L, k) => !k.top, run(L, k) { L.karma(-4); mentor(L, k, -10); const rose = up(L, k); return `${rose ? `You are ${L.jobTitle()}.` : 'The board likes the sound of you.'} The harbour office becomes a wine bar.`; } },
            { t: 'Promise them the town', check: ['charm', 60], show: (L, k) => !k.top, run(L, k, win) { if (!win) { perf(L, -4); return 'The board chooses growth, and a man who promises it. You keep your seat, and your counsel.'; } L.karma(3); mentor(L, k, 8); const rose = up(L, k); gaz(L, k, '{He} kept the Harbour Bank on the harbour.'); return `${rose ? `You are ${L.jobTitle()}.` : 'The board listens, for once.'} The harbour office stays, with its brass rail and its clock.`; } },
            { t: (L, k) => `Back ${k.R.first} for it`, show: (L, k) => !k.top && !k.R.dead && k.R.v >= 15, run(L, k) { rival(L, k, 20); L.karma(2); L.s.job.raise = Math.min(0.4, (L.s.job.raise || 0) + 0.08); return `${k.R.first} gets it, and gives you a rise in ${k.R.his} first week, and calls it liquidity.`; } },
            { t: 'Sell', show: (L, k) => k.top, run(L, k) { const n = bonus(L, 20); L.karma(-3); leave(L, k, 'Sold the Harbour Bank, and stepped down as Chair.', 'You sold the Harbour Bank; it is not yours to come back to'); return `You sign, and are paid ${n}. The harbour branch closes within the year.`; } },
            { t: 'Keep it local', show: (L, k) => k.top, run(L, k) { perf(L, 6); L.karma(4); gaz(L, k, '{He} kept the Harbour Bank on the harbour.'); return 'You turn them down. The brass rail stays, and the clock, and the man who has known your account since you opened it.'; } },
          ],
        },
      ],
    },

    // ---- politics: leaflets, the hostel, the meadow, a folder, and polling day ----
    politics: {
      party: 'The council chamber, with the mayor’s own sherry, and a speech from every member of the council, some of them about you.',
      gift: 'a small bronze gull from the council chamber, which nobody will miss',
      ch: [
        {
          r: 0, icon: '📮', title: 'Leaflets',
          text: (L, k) => `Councillor ${k.M.name} has represented the harbour ward since before the harbour, and runs ${k.M.his} campaigns from a kitchen table under a drift of leaflets. ${k.R.name}, the other volunteer, means to be prime minister, and is putting the other side’s leaflets in the recycling.`,
          opts: [
            { t: (L, k) => `Help ${k.R.him}`, run(L, k) { rival(L, k, 12); L.karma(-2); return `It takes all evening. ${k.R.first} says you are a natural.`; } },
            { t: (L, k) => `Stop ${k.R.him}`, run(L, k) { rival(L, k, -10); mentor(L, k, 4); L.karma(1); return `${k.R.first} calls you a boy scout. ${k.M.first} hears about it, and gives you the whole ward to deliver.`; } },
            { t: (L, k) => `Tell ${k.M.first}`, run(L, k) { mentor(L, k, 8); rival(L, k, -20); return `${k.M.first} makes ${k.R.first} deliver the other side’s leaflets, all of them, by hand, in the rain.`; } },
          ],
        },
        {
          r: 1, icon: '🛏️', title: 'The hostel',
          // (Only one who came on the train slept there: an heir who grew up in the Bay knows it from the outside. See chapHow in chapters.js.)
          text: (L, k) => `The council means to close the hostel by the station, ${!L.chapHow || L.chapHow() === 'train' ? 'where you slept your first nights in Starling Bay' : 'where everybody who comes to the Bay with one suitcase sleeps their first nights'}, and sell it for holiday flats. You are writing ${k.M.name}’s speech for the meeting. The party wants it closed.`,
          opts: [
            { t: 'Write it for the hostel', run(L, k) { L.karma(3); perf(L, -2); mentor(L, k, 4); return `${k.M.first} reads it out word for word, including ${!L.chapHow || L.chapHow() === 'train' ? 'the bit about your first night and the man in bunk nine' : 'the bit about the man in bunk nine, who has been there since before you were born'}. The hostel stays open. The party is not pleased with either of you.`; } },
            { t: 'Write it for the party', run(L) { perf(L, 4); L.karma(-1); return 'It is a good speech about tourism. The hostel becomes four holiday flats with a hot tub each. You walk the long way round.'; } },
            { t: 'Write it so it says nothing at all', run(L) { perf(L, 2); return 'Nobody can disagree with it, because nobody can find anything in it. The vote is put off until the spring. You have a gift.'; } },
          ],
        },
        {
          r: 2, icon: '🌾', title: 'Gull Meadow',
          text: () => 'The planning committee meets on Thursday. A developer wants Gull Meadow for two hundred houses. Half the town needs a house; the other half walks its dog there. Your vote decides it.',
          opts: [
            { t: 'Vote for the houses', run(L, k) { perf(L, 6); L.karma(-1); k.f.meadow = 'houses'; return 'Two hundred houses, and forty of them cheap. Young couples write to thank you. The dog walkers write too.'; } },
            { t: 'Vote for the meadow', run(L, k) { L.karma(3); perf(L, -4); k.f.meadow = 'kept'; return 'The meadow stays a meadow, with its skylarks and its dog walkers. The young couples stay in their parents’ back bedrooms, and write to you too.'; } },
            { t: 'Ask for a smaller scheme, on the far field', check: ['charm', 55], run(L, k, win) { if (win) { L.karma(3); perf(L, 4); k.f.meadow = 'both'; return 'Eighty houses on the far field, and the meadow left alone. Nobody gets everything, which is how you know it was fair.'; } perf(L, -2); k.f.meadow = 'houses'; return 'The developer will not have it, and the committee votes without you. Two hundred houses.'; } },
          ],
        },
        {
          // (The party chooses its candidate while nominations are open: see the election calendar in annals.js.)
          r: 3, icon: '📁', title: 'The folder', pace: 1, when: (L) => !L.annalsNoms || L.annalsNoms(),
          text: (L, k) => `The party must choose who stands for mayor: you or ${k.R.name}. ${k.R.first} has a folder about you, everybody says. Somebody has left a folder about ${k.R.him} in your pigeonhole.`,
          opts: [
            { t: 'Burn it', run(L, k) { L.karma(4); k.f.clean = 1; return 'In the grate at home, page by page, without reading it. Whatever happens now, it happens without that.'; } },
            { t: 'Use it', run(L, k) { L.karma(-8); rival(L, k, -40); L.fame(2); perf(L, 4); k.f.dirty = 1; return `It is all true, and it is all in the Gazette by Friday. ${k.R.first} withdraws “for family reasons”. The party chooses you, and wipes its hands.`; } },
            { t: (L, k) => `Give it back to ${k.R.first}, unread`, check: ['charm', 55], run(L, k, win) { L.karma(3); k.f.clean = 1; if (win) { rival(L, k, 35); return `${k.R.first} looks at it, and at you, and then puts ${k.R.his} own folder on the table between you. You burn them together in the car park.`; } rival(L, k, -5); return `${k.R.first} takes it without a word, and keeps ${k.R.his} own.`; } },
          ],
        },
        {
          // (In the polling-day season of an election, or once won and not yet sworn in.)
          r: 3, icon: '🗳️', title: 'Four days to go', pace: 1,
          when: (L) => !L.annalsRace || (!!L.annalsRace() && L.s.t === L.s.annals.poll) || (!!L.s.f.elected && !!L.s.job && L.s.job.r < 4),
          text: (L, k) => `${L.s.f.elected ? 'You have won the election, and are not yet in office' : 'Four days before polling'}, and the Gazette has a front page about ${SCANDAL[scandal(L, k)][0]}.`,
          opts: [
            { t: 'Come clean, in full', run(L, k) { L.karma(6); L.fame(2); perf(L, -2); return `${SCANDAL[scandal(L, k)][1]} The town likes honesty, mostly.`; } },
            { t: 'Deny everything', odds: () => 0.5, run(L, k, win) { if (win) { L.fame(1); return 'The story runs out of legs by Tuesday. Nobody quite believes you, and nobody quite cares.'; } L.karma(-10); L.fame(-3); return `The Gazette prints ${SCANDAL[scandal(L, k)][2]} on Wednesday.`; } },
            { t: T('charmer', 'Go on the radio, and talk to the whole town'), show: (L) => trait(L, 'charmer'), check: ['charm', 40], run(L, k, win) { if (win) { L.fame(3); L.karma(2); return 'An hour of phone-ins. You talk to a fisherman, two grandmothers and a man about a dog, and by the end nobody remembers what the story was.'; } L.fame(-2); return 'The third caller is your old landlord.'; } },
            { t: (L, k) => `Smear ${k.R.first} back`, show: (L, k) => !k.R.dead, run(L, k) { L.karma(-8); rival(L, k, -30); L.fame(3); return `It is very effective, and very nasty, and everybody in the Gull knows exactly who started it.`; } },
          ],
        },
        {
          r: 4, icon: '🏛️', title: 'The sea wall',
          text: () => 'Your first winter in the chain of office, and the sea wall below the front is failing. Mending it means a rise in everybody’s rates. A developer will mend it for nothing, if he can build a marina with flats on it.',
          opts: [
            { t: 'Mend the wall, and raise the rates', run(L, k) { L.karma(5); L.fame(2); perf(L, -4); gaz(L, k, '{He} mended the sea wall when nobody wanted to pay for it, and everybody was glad of it in the end.'); return 'The rates go up, and so does the wall. The Gazette is furious for a month. The next gale breaks on it and goes home.'; } },
            { t: 'Let him build the marina', run(L, k) { perf(L, 6); L.karma(-4); return 'The wall is mended, the marina is full of boats from the city, and the flats are empty most of the year. The view is not what it was.'; } },
            { t: 'Ask the town', check: ['charm', 60], run(L, k, win) { if (win) { L.karma(4); L.fame(3); perf(L, 2); return 'A town meeting, a vote, and a jumble sale. They choose the wall, and a fifth of the money comes from the jumble sale. It is the best night of your time in office.'; } perf(L, -6); return 'The meeting goes on until two in the morning and decides to have another meeting.'; } },
          ],
        },
      ],
    },

    // ---- Sal's crew: a dropped bag, a grass, a baker, Sal's turn, a way out, and the chair by the stove ----
    // (Sal is in every chapter but the last, in person: while he is inside, they wait; once he has
    // gone to Spain, they are passed over. See salWhere in heists.js.)
    crew: {
      party: 'The back room of the ice house, with a crate of something on the table and Sal’s best glasses.',
      gift: 'a gold lighter with somebody else’s initials on it',
      ch: [
        {
          r: 0, icon: '👜', title: 'The bag', when: salIn, skip: salSpain,
          text: (L, k) => `${k.M.name} has done every kind of job in the Bay, and two stretches for them, and is the one Sal listens to. ${k.R.name}, Sal’s ${k.R.sex === 'm' ? 'nephew' : 'niece'}, thinks the crew will be ${k.R.sex === 'm' ? 'his' : 'hers'} one day. Tonight ${k.R.first} has dropped the bag behind the chandlery, and a torch is coming down the lane.`,
          opts: [
            { t: 'Grab the bag and run', check: ['fitness', 40], run(L, k, win) { if (win) { rival(L, k, 15); perf(L, 4); return `Over the wall, round the ice house, the bag under your arm. ${k.R.first} owes you, and knows it.`; } const caught = L.crime(0.5, 2, 'a bag of somebody else’s silver'); rival(L, k, 10); return caught ? 'You trip over a lobster pot, and the torch finds you on your back with the bag on your chest.' : 'You drop it twice, and get away by the skin of your teeth. Sal hears about the dropping.'; } },
            { t: (L, k) => `Leave ${k.R.first} to it`, run(L, k) { rival(L, k, -30); perf(L, -2); return `You are three streets away by the time the torch finds ${k.R.first}. ${k.R.He} does a month, and comes out knowing exactly who ran.`; } },
            { t: 'Tell Sal whose fault it was', run(L, k) { perf(L, 4); rival(L, k, -25); mentor(L, k, 4); return `Sal listens, and nods, and ${k.R.first} is put on counting crates. ${k.M.first} says you have the makings, which from ${k.M.him} is a medal.`; } },
          ],
        },
        {
          r: 1, icon: '🐀', title: 'Somebody’s talking', when: salIn, skip: salSpain,
          text: (L, k) => `Somebody has been talking to the police. Sal wants a name by the weekend, and ${k.R.name} has given him one: yours.`,
          opts: [
            { t: 'Find the real one', check: ['smarts', 50], run(L, k, win) { if (win) { perf(L, 8); rival(L, k, -15); return `It is the man on the whelk stall, who has a cousin in the force. Sal deals with it. You do not ask how. ${k.R.first} keeps out of your way.`; } L.rough(12, 'Sal’s lads'); perf(L, -6); return 'You cannot prove anything, and Sal is not a patient man. Two of his lads explain this to you behind the ice house.'; } },
            { t: 'Go to Sal, and look him in the eye', check: ['charm', 50], run(L, k, win) { if (win) { perf(L, 4); return 'Sal looks back for a long time. Then he pours you a drink, and that is the end of it.'; } L.rough(8, 'Sal’s lads'); perf(L, -8); return 'Sal looks back for a long time, and then nods to somebody behind you.'; } },
            { t: (L, k) => T('hothead', `Have it out with ${k.R.first}, behind the ice house`), show: (L) => trait(L, 'hothead'), check: ['fitness', 45], run(L, k, win) { if (win) { rival(L, k, -20); perf(L, 6); return `${k.R.first} takes it back, from the ground. Sal hears about it, and rather likes it.`; } L.rough(10, 'a fight behind the ice house'); rival(L, k, -10); perf(L, -4); return `${k.R.first} was ready for you.`; } },
            { t: (L, k) => `Ask ${k.M.first} to speak for you`, run(L, k) { mentor(L, k, 4); perf(L, 2); k.f.owe = 1; return `${k.M.first} has a word. Sal listens to ${k.M.first}. ${k.M.He} says you owe ${k.M.him} one now, and will be wanting it.`; } },
          ],
        },
        {
          r: 2, icon: '🥖', title: 'The baker', when: salIn, skip: salSpain,
          text: () => 'Sal wants a debt collected: two thousand dollars, from a baker on Fore Street with a bad back, a bad year and three children.',
          opts: [
            { t: 'Collect it, the hard way', run(L, k) { perf(L, 8); L.karma(-8); const caught = L.crime(0.1, 2, 'two thousand dollars and a baker’s black eye'); return caught ? 'He pays. His neighbour rings the police.' : 'He pays. You do not look at the children on the stairs.'; } },
            { t: 'Pay half yourself, and tell Sal he paid it all', cost: 1000, run(L, k) { L.karma(3); perf(L, 2); return 'Sal never knows. A loaf is left on your step every Saturday for a year, with no note.'; } },
            { t: 'Tell him to get out of town', odds: () => 0.6, run(L, k, win) { L.karma(4); if (win) { perf(L, -4); return 'He is gone by Monday, with the children and the bread. Sal shrugs. Bakers come and go.'; } L.rough(15, 'Sal’s lads'); perf(L, -12); return 'Sal finds out where the baker went, and who told him to go.'; } },
          ],
        },
        {
          r: 3, icon: '🏥', title: 'Sal’s turn', when: salIn, skip: salSpain,
          text: (L, k) => `Sal has had a turn: a long week in St Wren’s, under another name. While he is in there, somebody has to run things, and ${k.R.name} thinks it should be ${k.R.him}.`,
          opts: [
            { t: 'Take the reins', run(L, k) { perf(L, 10); rival(L, k, -30); credit(L, 4); return 'A month of it. Nothing goes missing and nobody gets hurt, which Sal says is a first.'; } },
            { t: (L, k) => `Back ${k.R.first}`, run(L, k) { rival(L, k, 30); perf(L, -4); return `${k.R.first} makes a mess of it, but a loyal one, and is grateful to you, which in this line of work is worth a good deal.`; } },
            { t: 'Use the month to help yourself', odds: () => 0.6, run(L, k, win) { if (win) { L.karma(-3); const n = bonus(L, 4); return `${n}, a little from every pocket. Sal comes out thinner, and does not notice.`; } L.rough(20, 'Sal’s lads'); perf(L, -20); return 'Sal comes out of hospital and reads the books before he takes his coat off.'; } },
          ],
        },
        {
          r: 3, icon: '🚪', title: 'The way out', when: salIn, skip: salSpain,
          text: (L, k) => (k.M.dead
            ? `${k.M.name} always said there was a way out, if you wanted one: you go to Sal, you say it to his face, and you never come back to the ice house. ${k.M.He} never took it ${k.M.him}self. You could.`
            : `${k.M.name} is getting out: a caravan up the coast, ${k.M.his} grandchildren, and a name nobody up there knows. ${k.M.He} says you could get out too. Nobody hands in their notice to Sal, but ${k.M.first} thinks there is a way, if you go together.`),
          opts: [
            {
              t: 'Go straight',
              run(L, k) {
                mentor(L, k, 20); L.karma(8); L.warm(-30);
                L.s.f.salOff = Math.max(L.s.f.salOff || 0, L.s.t + 40);
                gaz(L, k, '{He} worked for Sal for a time, and then, one night, walked away from it.');
                leave(L, k, 'Walked away from Sal’s crew, and went straight.', 'You walked away from Sal');
                return `You go to Sal together, and say it. Sal looks at you both for a long time, and then says “Go on, then.” Somebody leaves your old jacket on your step the next morning, folded, which you take to mean goodbye.`;
              },
            },
            { t: 'Stay', run(L, k) { perf(L, 6); mentor(L, k, -5); return `${k.M.dead ? 'You stay.' : `${k.M.first} goes without you.`} The crew is a little colder after.`; } },
            { t: (L, k) => `Tell Sal ${k.M.first} means to go`, show: (L, k) => !k.M.dead, run(L, k) { mentor(L, k, -60); L.karma(-8); perf(L, 12); return `Sal has a word with ${k.M.first}. ${k.M.first} stays, and never speaks to you again, not once, not even to say why.`; } },
          ],
        },
        {
          r: 4, icon: '🪑', title: (L, k) => (k.top ? 'Men from the city' : 'The chair by the stove'), when: (L, k) => k.top || salIn(L),
          text: (L, k) => (k.top
            ? `A crew from the city wants the harbour. ${k.R.name} says fight. Sal, by postcard from Spain, says nothing at all, which is like him.`
            : `Sal is retiring to a villa in Spain with a pool shaped like a fish. The chair by the stove in the ice house goes to you or to ${k.R.name}, and Sal wants it settled without anybody bleeding on his floor.`),
          opts: [
            { t: 'Make your case to Sal', check: ['charm', 60], show: (L, k) => !k.top, run(L, k, win) { if (!win) { rival(L, k, -10); k.f.chair = 'rival'; return `${k.R.first} gets the chair. You work for ${k.R.him} now, and ${k.R.he} enjoys it.`; } rival(L, k, -10); const rose = up(L, k); if (rose) k.f.chair = 'you'; return `${rose ? `The chair is yours. You are ${L.jobTitle()}.` : 'Sal likes what he hears, and says to wait.'} ${k.R.first} shakes your hand, and counts ${k.R.his} fingers afterwards.`; } },
            { t: (L, k) => `Settle it with ${k.R.first}, outside`, check: ['fitness', 60], show: (L, k) => !k.top && !k.R.dead, run(L, k, win) { if (!win) { L.rough(20, 'a fight behind the ice house'); rival(L, k, -10); return `${k.R.first} has been waiting for this for years, and it shows.`; } rival(L, k, -30); const rose = up(L, k); if (rose) k.f.chair = 'you'; return `It is short, and nobody bleeds on Sal’s floor. ${rose ? `The chair is yours: ${L.jobTitle()}.` : 'Sal says he will think about it.'}`; } },
            {
              t: 'Hand the whole crew to the police, and walk away',
              run(L, k) {
                L.s.record = 0; L.warm(-100); L.karma(10); k.f.chair = 'police';
                L.s.f.salOff = Math.max(L.s.f.salOff || 0, L.s.t + 80);
                gaz(L, k, '{He} brought Sal’s crew down from the inside, and lived quietly ever after, mostly.');
                leave(L, k, 'Handed Sal’s crew to the police, and walked away.', 'You handed the crew to the police', EVER);
                return 'A long night at the station, and a new name on a form. Sal goes to Spain early, and in a hurry, and the crew scatters. Your record is lost, very carefully, in a filing cabinet.';
              },
            },
            { t: 'Fight for the harbour', check: ['fitness', 60], show: (L, k) => k.top, run(L, k, win) { if (win) { perf(L, 10); rival(L, k, 10); return 'One long night on the quay. In the morning the men from the city are on the first train, and the harbour is still yours.'; } L.rough(25, 'men from the city'); perf(L, -15); return 'You lose the fish market, and two teeth. The harbour is shared, now, which nobody likes.'; } },
            { t: 'Make them an offer', check: ['charm', 60], show: (L, k) => k.top, run(L, k, win) { if (win) { perf(L, 6); bonus(L, 3); return 'They take the casino, you keep the harbour, and everybody shakes hands in a lay-by at midnight.'; } perf(L, -8); return 'They take the offer, and then the rest.'; } },
          ],
        },
      ],
    },
  };
}
