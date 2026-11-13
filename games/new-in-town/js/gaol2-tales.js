// New in Town: the cards for a stretch in Starling Gaol (the rules are in
// gaol2.js, which deals them: none of these is drawn at random). The
// landing's stories, a card at a time; visits and letters; the job; the
// board; the days that are not like the others; and, outside, the gate's
// promises kept, Ossie's letter, and life on the run.
//
// h: what gaol2.js hands over (its tables and helpers).

import { COURSES, CAREERS, PLACES } from './data.js';

export function gaolTales(h) {
  const { JOBS, LANDING, cur, fk, meetFolk, warm, here, cellmate, clampN, first, KIN, hire } = h;
  const P = (L, id) => L.person(id) || { id: -1, name: 'Somebody', sex: 'm', bond: 0, age: 30, kind: 'friend' };
  const he = (p) => (p.sex === 'm' ? 'he' : 'she');
  const He = (p) => (p.sex === 'm' ? 'He' : 'She');
  const him = (p) => (p.sex === 'm' ? 'him' : 'her');
  const his = (p) => (p.sex === 'm' ? 'his' : 'her');
  const G = (L) => L.s.gaol2;
  const q = (L) => L.s.gaol;
  const terms = (L) => L.s.gaol2.n.terms;
  const has = (L, x) => !!x && !!L.person(x.p);
  const onLanding = (L, x) => !!L.s.gaol && !!x && here(L, x.k);
  // A trait from soul.js opens a choice of its own (marked as soul.js marks them).
  const MARK = { kind: '💗', hothead: '🌶️', charmer: '😏', bookish: '📚', churchgoer: '⛪', joker: '🃏', loner: '🌫️' };
  const trait = (id) => (L) => !!L.soulHas && !!L.s.soul && L.soulHas(id);
  const T = (id, t) => `${MARK[id]} ${t}`;
  const folkWarm = (L, id, d) => { if (L.s.folk && L.folkWarm && L.s.folk.p[id]) L.folkWarm(id, d); };
  // (Telling Mr Hobbs things makes enemies who wait for you: Big Col, in heists.js.)
  const grassed = (L) => { const H = L.s.heists; if (H && L.chance(0.5)) H.lag.foes.col = L.s.t + L.int(16, 40); };
  // Somebody from the landing seen again, a sentence later: a word for it, the first time (gaol2.js marks the card x.again when it deals it).
  const again = (x, id) => {
    if (!x || !x.again) return '';
    return { lenny: 'Lenny the Tin is still on B wing, greyer, and still in the cardigan. ', ossie: 'Ossie is still in the end cell, as if he had never moved, which he has not. ', winston: 'Winston Jory is still here, with more papers. ', jamie: 'Jamie Nance is back, older and harder, with a tattoo he did not have. ', stevie: 'Stevie Rowe is back on B wing, louder than ever. ' }[id] || '';
  };
  const end = (L, id) => { const C = cur(L); if (C) C.here = C.here.filter((k) => k !== id); };
  const friendOf = (L, id, extra = {}) => {
    const p = fk(L, id), k = LANDING[id];
    if (p.pid || L.friends().length >= 20) return null;
    const f = L.meet({ name: k.name, sex: 'm', job: k.job, trait: k.trait, age: Math.max(19, k.age + Math.floor((L.s.t - p.met) / 4)), bond: 35 + Math.round(Math.max(0, p.v) / 5), single: false, ...extra });
    p.pid = f.id;
    return f;
  };
  const vic = (L) => {
    const H = L.s.heists, j = H && H.jobs.length ? H.jobs[H.jobs.length - 1].k : null;
    return { villa: 'Mrs Kemp, the judge’s housekeeper, who found the study the next morning', van: 'Dennis, the guard with the bad knee, from the van', gull: 'Marguerite, the croupier, who lost her job over the counting room', bank: 'Mr Lusty, the bank’s night cashier' }[j] || 'Mrs Doreen Coad from Net Loft Lane, whose window it was';
  };
  // What a visitor could do for your plan, if anything: the first thing missing that they could give.
  const askFor = (L, p) => {
    const C = cur(L);
    if (!C || !p) return null;
    const P0 = C.plan;
    if (!L.g2HomeOk() && (p.kind === 'partner' || p.kind === 'spouse' || p.kind === 'parent' || p.kind === 'sibling' || (p.kind === 'child' && p.age >= 21))) return 'home';
    if (!P0.work && p.age >= 18 && p.job && L.g2JobOk(p.job) && p.bond >= 40 && !['child', 'grandchild'].includes(p.kind)) return 'work';
    if (!P0.vouch && p.bond >= 30 && p.age >= 18) return 'vouch';
    return null;
  };
  const seasonWord = ['spring', 'summer', 'autumn', 'winter'];
  // Where a career's work is, said after "at".
  const workAt = (c) => { const pl = CAREERS[c].place, n = PLACES[pl].name; return pl === 'highstreet' ? 'a shop on the High Street' : pl === 'harbour' ? 'the harbour' : n.startsWith('The ') ? `the ${n.slice(4)}` : n; };

  return [
    // ==== the landing: Lenny the Tin ====
    {
      id: 'g2Len0', icon: '🥫', title: 'The Tin', gaol: true, ok: onLanding,
      text: (L, x) => `${again(x, 'lenny')}A man in a cardigan, with a tobacco tin and a little notebook, sits down next to you at dinner: Lenny Truscott, who runs B wing’s tobacco, its canteen sheet and most of its card schools. “An ounce to get you started,” he says. “Two back by Friday. Everybody does it.”`,
      opts: [
        { t: 'Take the ounce', run(L) { const p = warm(L, 'lenny', 6); p.f.tick = 1; p.st = 1; L.respect(3); L.joy(2); return 'You pay back two ounces on Friday, as everybody does. Lenny ticks you off in the notebook, and smiles. “Now we know each other,” he says.'; } },
        { t: 'No thank you, Lenny', run(L) { const p = warm(L, 'lenny', 2); p.st = 1; return 'He writes something in the little notebook. “Polite,” he says. “I like polite. It is rarer in here than tobacco.”'; } },
        { t: 'Tell him where to put his tin', check: ['fitness', 50], run(L, x, win) { const p = warm(L, 'lenny', win ? -30 : -15); p.st = 1; if (win) { L.respect(8); return 'The table goes quiet. Lenny looks at you for a long moment, and then laughs, and moves to another table. He does not raise his voice. He never does.'; } L.rough(8, 'a beating in Starling Gaol'); return 'He does not raise his voice. Two men you have never seen before do it for him, in the showers, the next morning.'; } },
      ],
    },
    {
      id: 'g2Len1', icon: '🛏️', title: 'Under the mattress', gaol: true, ok: onLanding,
      due: (L, p) => p.v > -25 && (p.f.tick || q(L).rep >= 15),
      text: (L, x) => `${again(x, 'lenny')}“There is a spin coming Thursday,” says Lenny, very quietly, over the tea urn. “I need a mattress for a parcel, one night. Eighty dollars, and I do not forget a favour.”${fk(L, 'lenny').f.tick ? ' He taps the notebook. “Not that you owe me one. But you do.”' : ''}`,
      opts: [
        { t: 'Keep it under yours', odds: (L) => clampN(0.7 + cur(L).esc.habits * 0.05 + q(L).rep / 400, 0.5, 0.92), run(L, x, win) {
          const p = fk(L, 'lenny'); p.st = 2;
          if (win) { warm(L, 'lenny', 15); L.cash(80); L.respect(4); return 'Thursday comes. Mr Hobbs turns over every mattress on the landing but yours, because yours has you sitting on it reading the Bible. The parcel goes back to Lenny with a bow on it.'; }
          warm(L, 'lenny', 8); L.extra(1); L.behave(-15); L.g2Sack('a parcel under the mattress');
          return 'They find it. You say nothing about whose it is, for six hours, to three different officers. A season on your sentence, your job gone, and Lenny’s undying gratitude.';
        } },
        { t: 'Not this time, Lenny', run(L) { const p = warm(L, 'lenny', -8); p.st = 2; return 'Lenny nods, and writes in the notebook. You have a feeling it is your name, with a line under it.'; } },
        { t: 'Tell Mr Hobbs about it', run(L) { const p = warm(L, 'lenny', -60); p.st = 9; L.behave(15); L.respect(-20); L.karma(-1); grassed(L); p.out = L.s.t; end(L, 'lenny'); return 'Mr Hobbs listens, and thanks you, and on Thursday they find Lenny’s parcel, and Lenny is moved to another wing. His friends are not.'; } },
      ],
    },
    {
      id: 'g2Len2', icon: '📒', title: 'What is owed', gaol: true, ok: onLanding,
      due: (L, p) => p.v > -25,
      text: (L, x) => `${again(x, 'lenny')}${here(L, 'jamie') && fk(L, 'jamie') ? '“Jamie Nance owes me eight ounces,” says Lenny, “and has done since Easter.' : '“A lad on the threes owes me eight ounces,” says Lenny, “and has done since Easter.'} I would take it kindly if you collected. You can keep two.”`,
      opts: [
        { t: 'Lean on him', run(L) { const p = warm(L, 'lenny', 10); p.st = 3; L.karma(-4); L.respect(5); L.cash(100); if (here(L, 'jamie') && fk(L, 'jamie')) { const j = warm(L, 'jamie', -30); j.f.leant = 1; return 'Jamie pays, in the end, in tobacco and a photograph of Kayleigh he has to ask for back. He does not look at you again for a long time.'; } return 'The lad pays, in tobacco and a watch that does not go. You keep two ounces, as agreed, and feel about two inches tall.'; } },
        { t: 'Pay it yourself', cost: 120, run(L) { const p = warm(L, 'lenny', 4); p.st = 3; L.karma(2); if (here(L, 'jamie') && fk(L, 'jamie')) { warm(L, 'jamie', 20); return 'You pay Lenny out of your account. Jamie finds out, as people do in here, and leaves an orange on your bunk without a word.'; } return 'You pay Lenny out of your account. The lad on the threes never knows who to thank, which is as it should be.'; } },
        { t: 'Tell Lenny to collect his own debts', run(L) { const p = fk(L, 'lenny'); p.st = 3; if (q(L).rep >= 40) { warm(L, 'lenny', -6); L.respect(4); return 'Lenny looks at you for a long moment. “Fair,” he says. He never asks you again.'; } warm(L, 'lenny', -12); L.rough(5, 'a beating in Starling Gaol'); return '“Fair,” says Lenny. On Saturday somebody spills tea on you, very hot, and apologises, very slowly.'; } },
      ],
    },
    {
      id: 'g2Len3', icon: '🐄', title: 'The Tin moves on', gaol: true, ok: onLanding,
      due: (L, p) => q(L).served >= 4,
      text: (L) => (fk(L, 'lenny').v >= 10 ? 'Lenny is being moved to an open prison, with a view of some cows. The tin, the notebook and the card schools will need somebody to look after them, and he is looking at you.' : 'Lenny is being moved to an open prison, with a view of some cows. The tin, the notebook and the card schools will need somebody to look after them, and he is not looking at you. He is looking at Reece Jago.'),
      opts: [
        { t: 'Take the business on', show: (L) => fk(L, 'lenny').v >= 10, why: (L) => (q(L).rep < 40 ? 'The landing would not stand for it (standing 40).' : null), run(L) { const C = cur(L), p = fk(L, 'lenny'); C.tin = true; p.st = 4; p.out = L.s.t; p.f.moved = 1; end(L, 'lenny'); L.respect(10); L.karma(-2); L.note('Took over the Tin’s business on B wing.', 'big'); return 'Lenny hands you the notebook, and the tin, which is empty, and his cardigan, which is not part of the deal but which you keep. Every season it pays, until the season it does not.'; } },
        { t: 'Let Reece Jago have it', run(L) { const p = fk(L, 'lenny'); p.st = 4; p.out = L.s.t; p.f.moved = 1; end(L, 'lenny'); if (fk(L, 'reece')) warm(L, 'reece', 10); if (fk(L, 'stevie')) warm(L, 'stevie', -5); return 'The Kettleby lot have the tobacco now. The Bay lads are not pleased, and say so, at the pool table, at length.'; } },
        { t: 'Wish him luck', run(L) { const p = warm(L, 'lenny', 10); p.st = 4; p.out = L.s.t; p.f.moved = 1; end(L, 'lenny'); return 'You shake his hand. He gives you his address in Kettleby, “for after”: a bungalow called Dunroamin, which he says is a joke, and is not.'; } },
      ],
    },

    // ==== Ossie, and June in Gull Terrace ====
    {
      id: 'g2Oss0', icon: '🐤', title: 'Pip', gaol: true, ok: onLanding,
      text: (L, x) => `${again(x, 'ossie')}Ossie Pengelly has the end cell, and has had it since 1981. He is going over to the hospital wing for his chest, and holds out a cage with a small yellow bird in it. “Pip,” he says. “She likes the wireless. Not the news.”`,
      opts: [
        { t: 'Look after her', run(L) { const p = warm(L, 'ossie', 15); p.f.pip = 1; p.st = 1; L.joy(4); return 'Pip sings all week, mostly along to the shipping forecast. When Ossie comes back she flies straight to his finger, and he pretends not to be pleased.'; } },
        { t: 'Ask him how long he has been in', run(L) { const p = warm(L, 'ossie', 6); p.st = 1; L.gain('smarts', 0.5); return 'Since before you were born. The pier had a ballroom then. There was his brother-in-law, a bottle, a step down to the beach in the dark. “Forty years is a long time to be sorry,” he says. “But I am.”'; } },
        { t: 'Find him somebody else', run(L) { const p = warm(L, 'ossie', -3); p.st = 1; return 'Kev on the twos takes her. She sulks the whole week and will not sing for anybody, and Ossie says that is loyalty.'; } },
      ],
    },
    {
      id: 'g2Oss1', icon: '✉️', title: 'A letter for June', gaol: true, ok: onLanding,
      text: (L, x) => `${again(x, 'ossie')}Ossie’s hands shake too much to write now. His daughter June lives in Gull Terrace, in the Bay, and has not answered a letter since 1979. He would like to try once more, while there is time, and he would like you to hold the pen.`,
      opts: [
        { t: 'Write it down as he says it', run(L) { const p = warm(L, 'ossie', 10); p.f.letter = 1; p.st = 2; return '“Dear June,” he says, and then nothing for a long time, and then all of it at once. You write as fast as you can. It is not a good letter. It is a true one.'; } },
        { t: 'Help him find the words', check: ['smarts', 45], run(L, x, win) { const p = warm(L, 'ossie', win ? 14 : 8); p.f.letter = win ? 2 : 1; p.st = 2; return win ? 'Three drafts, over three evenings. The third one says he is sorry without asking for anything back, which is the hard part. He signs it “Dad”, and then crosses it out, and then writes it again.' : 'You try. The words come out stiff, the way his did, and in the end he says, “Just put that I am sorry.” You put that he is sorry.'; } },
        { t: 'Tell him to let it lie', run(L) { const p = warm(L, 'ossie', -10); p.f.letter = 0; p.st = 2; return 'He nods, and folds the blank paper, and puts it in his Bible. It is still there, you suspect.'; } },
      ],
    },
    {
      id: 'g2Oss2', icon: '🏘️', title: 'Gull Terrace', gaol: true, ok: onLanding,
      dealt: (L, p) => { p.f.june = L.chance(p.f.letter === 2 ? 0.65 : p.f.letter === 1 ? 0.3 : 0) ? 'wrote' : 'none'; },
      text: (L, x) => (fk(L, 'ossie').f.june === 'wrote' ? `${again(x, 'ossie')}A letter for Ossie, in round blue handwriting, with a Bay postmark. He cannot open it. You open it for him. “Dear Dad,” it begins, and he has to sit down on the end of the bunk.` : `${again(x, 'ossie')}No answer from Gull Terrace. Ossie says he did not expect one, and stops listening for the post, which is how you know he did. “When you are out,” he says, “would you take one by hand? She might not open the door. But she might.”`),
      opts: [
        { t: 'Read it to him', show: (L) => fk(L, 'ossie').f.june === 'wrote', run(L) { const p = warm(L, 'ossie', 10); p.st = 3; L.joy(5); L.karma(2); return 'She has two boys, it turns out, Ossie’s grandsons, and one of them is called Oswald. Ossie makes you read that bit four times.'; } },
        { t: 'Help him write back', show: (L) => fk(L, 'ossie').f.june === 'wrote', run(L) { const p = warm(L, 'ossie', 12); p.st = 3; L.gain('smarts', 0.5); L.joy(3); return 'Three drafts. The third says what he means, which is mostly “thank you”, eleven different ways.'; } },
        { t: 'Promise to take it by hand', show: (L) => fk(L, 'ossie').f.june !== 'wrote', run(L) { const p = warm(L, 'ossie', 12); p.f.hand = 1; p.st = 3; L.karma(1); return 'He sews the letter into the lining of your coat himself, with very small stitches, on a visit to the property store that Mr Hobbs arranges and does not mention.'; } },
        { t: 'Tell him it is no good', show: (L) => fk(L, 'ossie').f.june !== 'wrote', run(L) { const p = warm(L, 'ossie', -8); p.st = 3; L.joy(-2); return '“No,” he says. “I suppose not.” He turns the wireless up a little, and Pip sings, and he does not.'; } },
      ],
    },
    {
      id: 'g2Oss3', icon: '🕊️', title: (L) => (fk(L, 'ossie').f.june === 'wrote' ? 'Going home' : 'The end cell'), gaol: true, ok: onLanding,
      due: (L, p) => L.s.t - p.at >= 4,
      text: (L) => (fk(L, 'ossie').f.june === 'wrote' ? 'June has asked for her father to come home to Gull Terrace, and the Home Office, after only eleven months of thinking about it, has said yes. Ossie packs his things into a carrier bag: a Bible, a wireless, and Pip.' : 'Ossie died in the night, in the end cell, with the wireless on low. The chaplain holds a service in the chapel on Friday. Half the landing comes, in clean shirts. Pip is in her cage by the altar, and sings all the way through the second hymn.'),
      opts: [
        { t: 'Carry his bag to the gate', show: (L) => fk(L, 'ossie').f.june === 'wrote', run(L) { const p = warm(L, 'ossie', 10); p.st = 4; p.gone = 'home'; end(L, 'ossie'); L.joy(6); L.karma(2); L.note('Carried Ossie Pengelly’s bag to the gate, when he went home to his daughter.'); return 'He shakes your hand at the gate. June is waiting in a little blue car. She gets out, and stands there, and then she runs.'; } },
        { t: 'Say a few words', show: (L) => fk(L, 'ossie').f.june !== 'wrote', check: ['charm', 40], run(L, x, win) { const p = fk(L, 'ossie'); p.st = 4; p.gone = 'dead'; end(L, 'ossie'); L.joy(-3); if (win) { L.respect(5); L.karma(2); return 'You talk about the shipping forecast, and German Bight, and a man who was sorry for forty years. Nobody on B wing has ever seen Lenny the Tin cry before.'; } return 'You get as far as “Ossie was” and cannot go on. The chaplain puts a hand on your shoulder, and the landing waits, and that says it.'; } },
        { t: 'Take Pip', show: (L) => fk(L, 'ossie').f.june !== 'wrote' && !!fk(L, 'ossie').f.pip, run(L) { const p = fk(L, 'ossie'); p.st = 4; p.gone = 'dead'; end(L, 'ossie'); cur(L).f.pip = 1; L.joy(2); return 'Mr Hobbs allows it, unofficially. She lives on your windowsill for the rest of your sentence, and sings at the gulls on the wall, who do not deserve it.'; } },
        { t: 'Sit at the back', show: (L) => fk(L, 'ossie').f.june !== 'wrote', run(L) { const p = fk(L, 'ossie'); p.st = 4; p.gone = 'dead'; end(L, 'ossie'); L.joy(-4); return 'You sit at the back, by the radiator, and think about forty years, and about how many you have left of yours.'; } },
      ],
    },

    // ==== Winston, who did not do it ====
    {
      id: 'g2Win0', icon: '📑', title: 'The 4.15 from Kettleby', gaol: true, ok: onLanding,
      due: (L, p) => !p.f.no || L.s.t - p.f.no >= 12,
      text: (L, x) => `${again(x, 'winston')}Winston Jory has a carrier bag of papers, a theory, and nine years of being told to keep his voice down about it. “The 4.15 from Kettleby,” he says. “Ask me about the 4.15.”`,
      opts: [
        { t: 'Ask him about the 4.15', run(L) { const p = warm(L, 'winston', 10); p.f.listen = 1; p.st = 1; return 'It takes an hour and a half. At the end of it you are not sure he is innocent, but you are sure somebody should look properly, and that nobody has.'; } },
        { t: 'Read his papers properly', show: (L) => (L.g2Job() && L.g2Job().k === 'library') || L.s.st.smarts >= 40, run(L) { const p = warm(L, 'winston', 15); p.f.listen = 1; p.f.work = 1; p.f.q = 1; p.st = 1; L.gain('smarts', 1); return 'You take the first box back to the library and read it from the top, with a pencil. Winston hovers in the doorway all afternoon, pretending to want a western.'; } },
        { t: 'Everybody in here is innocent, Winston', run(L) { const p = warm(L, 'winston', -6); p.f.no = L.s.t; return '“I know,” says Winston. “That is the trouble.” He goes and tells somebody else about the bus.'; } },
      ],
    },
    {
      id: 'g2Win1', icon: '🚌', title: 'Page 212', gaol: true, ok: onLanding,
      due: (L, p) => (p.f.work || 0) >= 3,
      text: (L) => {
        const p = fk(L, 'winston');
        if ((p.f.q || 0) >= 2) return 'It is there, on page 212: the witness saw Winston on the quay at twenty past four. The 4.15 from Kettleby did not get in until twenty to five that day, because of the snow; it is in the bus company’s log, which nobody ever asked for. Winston reads it three times and then sits down on the floor.';
        return (p.f.tries || 0) ? 'Through it all again, and still nothing that a judge would call new. Winston thanks you, politely, as if you had lent him a pen.' : 'Three boxes, and you have found nothing anybody would call new. Winston says that is fine, that is how it goes, and goes very quiet.';
      },
      opts: [
        { t: 'Write to his solicitor', show: (L) => (fk(L, 'winston').f.q || 0) >= 2, run(L) { const p = warm(L, 'winston', 20); p.f.found = 1; p.st = 2; return 'Four pages, in your best hand, with the page numbers. The solicitor writes back in a week, which is a record, with the word “interesting” underlined.'; } },
        { t: 'Write to the Gazette as well', show: (L) => (fk(L, 'winston').f.q || 0) >= 2, run(L) { const p = warm(L, 'winston', 15); p.f.found = 2; p.st = 2; L.fame(1); L.behave(-5); return 'The Gazette runs it on page five: THE BUS THAT NEVER CAME. The governor does not care for prisoners in the newspapers, and says so. Winston has it pinned above his bunk.'; } },
        { t: 'Go through it all again', show: (L) => (fk(L, 'winston').f.q || 0) < 2, run(L) { const p = warm(L, 'winston', 5); p.f.work = 0; p.f.q = 0; p.f.tries = (p.f.tries || 0) + 1; return 'Back to the first box. Winston brings you a mug of tea and a pencil sharpener, which is his way of saying thank you.'; } },
        { t: 'Tell him you are sorry', show: (L) => (fk(L, 'winston').f.q || 0) < 2, run(L) { const p = warm(L, 'winston', 5); p.st = 9; return 'He nods. “Nine years,” he says. “Another nine, then.” He puts the papers back in the carrier bag, very neatly, in order.'; } },
      ],
    },
    {
      id: 'g2Win2', icon: '⚖️', title: 'The Court of Appeal', gaol: true, ok: onLanding,
      dealt: (L, p) => { const j = L.g2Job(); p.f.won = L.chance(clampN(0.35 + (p.f.q || 0) * 0.1 + (p.f.found === 2 ? 0.1 : 0) + (j && j.k === 'library' ? 0.05 : 0) - (p.f.tries || 0) * 0.05, 0.2, 0.85)) ? 1 : 0; },
      text: (L) => (fk(L, 'winston').f.won ? 'The Court of Appeal takes eleven minutes. “Unsafe,” says the judge, and Winston, who has waited nine years for the word, does not hear it, and has to be told it by his barrister, twice.' : '“Dismissed.” Winston comes back from the court in the van and goes straight to his cell, and does not come out for his tea, or for the next one.'),
      opts: [
        { t: 'Shake his hand at the gate', show: (L) => !!fk(L, 'winston').f.won, run(L) {
          const p = warm(L, 'winston', 25); p.st = 3; p.gone = 'free'; p.f.quashed = 1; end(L, 'winston');
          G(L).f.quashed = 1; L.fame(1); L.karma(3); L.joy(8);
          L.note('Helped Winston Jory win his appeal.', 'big');
          const f = friendOf(L, 'winston', { job: 'law' });
          return `He walks out with the carrier bag of papers, because he cannot think what else to do with them. “I owe you nine years,” he says.${f ? ' He means to train as a solicitor’s clerk. He will write.' : ''}`;
        } },
        { t: 'Sit with him', show: (L) => !fk(L, 'winston').f.won, run(L) { const p = warm(L, 'winston', 12); p.st = 9; L.joy(-2); return 'You sit with him for an evening without saying much. Towards midnight he says, “The 4.15,” to nobody, and laughs, and that is the worst of it over.'; } },
        { t: 'Start again from the first box', show: (L) => !fk(L, 'winston').f.won, run(L) { const p = warm(L, 'winston', 8); p.st = 1; p.f.work = 0; p.f.q = 0; p.f.tries = (p.f.tries || 0) + 1; return '“There is always another box,” says Winston, and there is.'; } },
      ],
    },

    // ==== Jamie, who cannot read ====
    {
      id: 'g2Jam0', icon: '🧸', title: 'Kayleigh’s letters', gaol: true, ok: onLanding,
      text: (L, x) => `${again(x, 'jamie')}Jamie Nance sits on the end of your bunk with a letter in a pink envelope, holding it the way you would hold something hot. “Read it us,” he says, not looking at you. “I cannot, see. Never could.”`,
      opts: [
        { t: 'Offer to teach him to read it himself', run(L) { const p = warm(L, 'jamie', 15); p.f.teach = 1; p.st = 1; return 'He laughs, and then he does not. “Go on, then,” he says. “But if you tell anybody.” You do not tell anybody.'; } },
        { t: 'Read it to him', run(L) { const p = warm(L, 'jamie', 10); p.st = 9; L.karma(1); L.joy(2); return 'It is about a hamster called Biscuit, and a tooth, and it ends with eleven kisses. He makes you read the kisses out too, one at a time.'; } },
        { t: T('kind', 'Read it to him, and the next one, and every one after'), show: trait('kind'), run(L) { const p = warm(L, 'jamie', 18); p.f.teach = 1; p.st = 1; L.karma(3); return 'You read him every letter he has, from the bottom of the sock up. Then, because he asks, the first one again, slowly, with his finger following.'; } },
        { t: 'Tell the landing', run(L) { const p = warm(L, 'jamie', -40); p.st = 9; L.respect(4); L.karma(-4); return 'It gets a laugh at dinner. Jamie does not laugh, and does not forget, and Kayleigh’s letters go back in his sock unread.'; } },
      ],
    },
    {
      id: 'g2Jam1', icon: '✏️', title: '“Dear Kayleigh”', gaol: true, ok: onLanding,
      due: (L, p) => (p.f.les || 0) >= 4,
      text: 'Jamie writes to Kayleigh himself: four lines, in capitals, with a drawing of a dog that he says is Biscuit, though Biscuit is a hamster. He reads it to you twice before he seals it, with his finger under every word.',
      opts: [
        { t: 'Tell him it is the best letter you ever read', run(L) { const p = warm(L, 'jamie', 20); p.f.read = 1; p.st = 2; G(L).f.reader = 1; L.karma(3); L.joy(6); L.note('Taught Jamie Nance to read, in Starling Gaol.', 'big'); return 'He goes red to the ears. A fortnight later a letter comes back, and he reads it himself, on his own, in his cell, with the door shut.'; } },
        { t: 'Help him with the spelling first', run(L) { const p = warm(L, 'jamie', 12); p.f.read = 1; p.st = 2; G(L).f.reader = 1; L.karma(2); L.joy(4); L.note('Taught Jamie Nance to read, in Starling Gaol.', 'big'); return '“Hamster” has an S in it, it turns out. He puts one in, very carefully, and then two more, for luck.'; } },
      ],
    },

    // ==== the pool table: the Bay lads and the Kettleby lot ====
    {
      id: 'g2Feud0', icon: '🎱', title: 'The pool table', gaol: true, ok: onLanding,
      due: (L) => here(L, 'reece'),
      text: (L, x) => `${again(x, 'stevie')}On B wing there are two sorts of men: the Bay lads, who have the pool table, and the Kettleby lot, who would like it. Stevie Rowe pulls out a chair for you by the pool table. Across the landing, Reece Jago looks up from his chess to see whether you sit in it.`,
      opts: [
        { t: 'Sit with the Bay lads', run(L) { meetFolk(L, 'reece'); warm(L, 'stevie', 15).st = 1; warm(L, 'reece', -15); G(L).feud = 'bay'; L.respect(6); return 'Stevie slaps you on the back and introduces you to everybody, all of whom are cousins. Reece Jago goes back to his chess.'; } },
        { t: 'Sit with the Kettleby lot', run(L) { meetFolk(L, 'reece'); warm(L, 'reece', 15); warm(L, 'stevie', -15).st = 1; G(L).feud = 'kett'; L.respect(6); return 'You walk past Stevie’s chair and sit down by the chessboard. Reece Jago moves a pawn, and nods. The Bay lads remember it.'; } },
        { t: 'Pull up a chair between them', check: ['charm', 55], run(L, x, win) { meetFolk(L, 'reece'); const s = warm(L, 'stevie', win ? 5 : -5); s.st = 1; warm(L, 'reece', win ? 5 : -5); G(L).feud = win ? 'broker' : 'out'; if (win) { L.respect(4); return 'You put your chair in the middle of the landing and your tray on your knees. By the end of the week both sides are telling you their side of it, which is a start.'; } return 'You sit in the middle of the landing. Both sides decide you are a spy for the other.'; } },
        { t: 'Take your tray back to your cell', run(L) { meetFolk(L, 'reece'); warm(L, 'stevie', -3).st = 1; G(L).feud = 'out'; L.respect(-3); return 'Your own company, a plate of mince, and the sound of the pool table through the door.'; } },
      ],
    },
    {
      id: 'g2Feud1', icon: '🔥', title: 'Trouble at the hotplate', gaol: true, ok: onLanding,
      due: (L) => here(L, 'reece'),
      text: (L) => {
        const j = L.g2Job();
        if (j && j.k === 'kitchen') return 'The Kettleby lot say the Bay lads get bigger portions, and since you are on the hotplate, they are saying it to you, with a ladle.';
        return 'Somebody has put a pool cue through the television. The Kettleby lot say it was the Bay lads; the Bay lads say it was the cue’s own fault. By teatime both sides are looking at you.';
      },
      opts: [
        { t: 'Stand with your side', show: (L) => ['bay', 'kett'].includes(G(L).feud), check: ['fitness', 50], run(L, x, win) { const mine = G(L).feud === 'bay' ? 'stevie' : 'reece', theirs = mine === 'stevie' ? 'reece' : 'stevie'; fk(L, 'stevie').st = 2; L.behave(-10); warm(L, theirs, -10); if (win) { warm(L, mine, 10); L.respect(10); return 'It is over by the time the bell goes, and your side has the pool table and the television, what is left of it.'; } warm(L, mine, 4); L.rough(10, 'a fight in Starling Gaol'); return 'You end up under a table with a split lip and a cue ball in your pocket, and nobody knows how it got there.'; } },
        { t: 'Keep out of it', run(L) { const f = G(L).feud; fk(L, 'stevie').st = 2; if (f === 'bay') warm(L, 'stevie', -12); else if (f === 'kett') warm(L, 'reece', -12); return f === 'bay' || f === 'kett' ? 'You stay in your cell with a western. Your side notices, and says so, at length.' : 'You stay in your cell with a western. Nobody expected anything else of you.'; } },
        { t: 'Tell Mr Hobbs what is coming', run(L) { fk(L, 'stevie').st = 2; L.behave(12); L.respect(-15); warm(L, 'stevie', -10); warm(L, 'reece', -10); grassed(L); return 'There are officers on the landing all evening, and nothing happens. Everybody knows why. Everybody knows who.'; } },
        { t: 'Get them both round a table', show: (L) => G(L).feud === 'broker' || L.s.st.charm >= 50, run(L) { fk(L, 'stevie').st = 2; cur(L).f.talks = 1; warm(L, 'stevie', 5); warm(L, 'reece', 5); return 'You talk to Stevie at breakfast and Reece at dinner, and by Sunday they have both agreed to be in the same room, if it is not the other one’s idea.'; } },
      ],
    },
    {
      id: 'g2Feud2', icon: '⛪', title: (L) => (cur(L).f.talks || G(L).feud === 'broker' ? 'Peace talks in the chapel' : 'A score to settle'), gaol: true, ok: onLanding,
      due: (L) => here(L, 'reece'),
      text: (L) => (cur(L).f.talks || G(L).feud === 'broker' ? 'The Reverend Penrose lends you the chapel for an hour, and a plate of biscuits. Stevie Rowe sits in the front pew, Reece Jago in the back one, and you stand in the middle with the biscuits.' : `The ${G(L).feud === 'kett' ? 'Bay lads' : 'Kettleby lot'} have not forgotten which chair you sat in${G(L).feud === 'out' ? ', or that you would not sit in theirs' : ''}. Three of them are waiting by the showers, with their towels over their shoulders and nothing in their hands yet.`),
      opts: [
        { t: 'Make the case for peace', show: (L) => !!cur(L).f.talks || G(L).feud === 'broker', odds: (L) => clampN(0.25 + L.s.st.charm / 150 + (fk(L, 'stevie').v + fk(L, 'reece').v) / 400 + (cur(L).chap >= 2 ? 0.1 : 0), 0.1, 0.9), run(L, x, win) {
          fk(L, 'stevie').st = 3;
          if (win) { G(L).feud = 'peace'; G(L).f.peace = 1; L.respect(12); L.behave(10); L.karma(3); warm(L, 'stevie', 10); warm(L, 'reece', 10); L.note('Made peace between the Bay lads and the Kettleby lot on B wing.', 'big'); return 'Half an hour of shouting, ten minutes of sulking, and then Reece Jago picks up a cue. They play a frame. Nobody wins: the black goes down by accident, and both of them laugh. B wing has a rota for the pool table now, written out in your hand.'; }
          G(L).feud = 'out'; L.queue('gRiot');
          return 'It goes wrong over the last biscuit, of all things. By the next morning there is smoke coming out of B wing.';
        } },
        { t: 'Fight', show: (L) => !cur(L).f.talks && G(L).feud !== 'broker', check: ['fitness', 55], run(L, x, win) { fk(L, 'stevie').st = 3; L.behave(-12); if (win) { L.respect(14); return 'Three of them, and you, and a wet floor. Afterwards they let it be known that it was a misunderstanding.'; } L.rough(15, 'a beating in Starling Gaol'); return 'Three of them, and you, and a wet floor. You wake up in the hospital wing with a view of the car park.'; } },
        { t: 'Ask Tiny to stand with you', show: (L) => !cur(L).f.talks && G(L).feud !== 'broker' && !!cellmate(L) && cellmate(L).id === 'tiny' && (cellmate(L).m || {}).bond >= 40, run(L) { fk(L, 'stevie').st = 3; L.respect(6); return 'Tiny Doyle walks to the showers with you, and stands there with his towel, filling the doorway. The three of them remember somewhere else they need to be.'; } },
        { t: 'Pay them to forget it', show: (L) => !cur(L).f.talks && G(L).feud !== 'broker', cost: 200, run(L) { fk(L, 'stevie').st = 3; L.respect(-4); return 'Two hundred dollars, into three different accounts outside, and the matter is closed. It is never closed, quite, but it is shut.'; } },
        { t: 'Ask to be moved to another landing', show: (L) => !cur(L).f.talks && G(L).feud !== 'broker', run(L) { fk(L, 'stevie').st = 3; L.behave(5); L.respect(-12); end(L, 'stevie'); end(L, 'reece'); G(L).feud = 'out'; return 'The governor moves you to C wing, where nobody plays pool and everybody plays dominoes, very seriously, for matches.'; } },
      ],
    },

    // ==== somebody from the landing goes home ====
    {
      id: 'g2Bye', icon: '🚪', title: (L, x) => `${LANDING[x.k].first} goes home`, gaol: true, ok: (L, x) => onLanding(L, x) && !!fk(L, x.k),
      text: (L, x) => {
        const p = fk(L, x.k), v = p.v;
        const T = {
          lenny: 'Lenny’s time is up. He leaves his notebook to nobody and his cardigan to the laundry, and shakes hands along the landing like a man leaving a wedding.',
          winston: 'Winston Jory has served every day of it, and walks out with his carrier bag of papers. “Still innocent,” he says at the gate. “Just out.”',
          jamie: p.f.read ? 'Jamie Nance is going home to Kayleigh. He gives you the drawing she sent of you, a stick man with a crown on, and reads you what she wrote on the back, himself.' : 'Jamie Nance is going home. He shakes your hand, a bit too hard, and says he will see you. In here, people mean different things by that.',
          stevie: 'Stevie Rowe is out on Monday. He hands the pool table on to the Bay lads in a speech that lasts longer than some sentences.',
          reece: 'Reece Jago is going back to Kettleby. He shakes hands with everybody, the Bay lads included, and says nothing at all.',
        };
        return `${T[x.k] || `${LANDING[x.k].name} is going home.`}${v >= 50 ? ' “Look me up,” he says, and means it.' : v <= -40 ? ' He does not look at you as he goes, which is a kind of looking.' : ''}`;
      },
      opts: [
        { t: 'Shake his hand', run(L, x) { const p = fk(L, x.k); end(L, x.k); if (p.v >= 50) { const f = friendOf(L, x.k); return f ? `You will look ${LANDING[x.k].first} up. You have his address on the back of a canteen sheet.` : 'You shake on it.'; } warm(L, x.k, 3); return 'He nods. The landing is a little quieter, for about a day.'; } },
        { t: 'Watch him go from the landing', run(L, x) { end(L, x.k); return 'You watch from the rail as he goes down the stairs with his bag, and then you go back to whatever you were doing, which was nothing.'; } },
      ],
    },
    {
      // (A man you helped, out and a solicitor's clerk now, comes to see you when you are back inside.)
      id: 'g2WinBack', icon: '💼', title: 'A visit from Winston', gaol: true,
      text: 'Winston Jory is on the other side of the visiting table, in a suit, with a briefcase that has nothing in it but your file. He is a solicitor’s clerk now. “Nine years,” he says. “I said I owed you.”',
      opts: [
        { t: 'Let him look at your case', run(L) { const p = fk(L, 'winston'), f = p && p.pid ? L.person(p.pid) : null; if (f) L.bond(f, 10); q(L).appeal = false; L.joy(5); return 'He reads every page, with a pencil, the way you once read his. “There is an appeal in this,” he says. “Not a good one. But there is one.” You can try again.'; } },
        { t: 'Ask him how it feels, outside', run(L) { const p = fk(L, 'winston'), f = p && p.pid ? L.person(p.pid) : null; if (f) L.bond(f, 6); L.joy(4); return '“Loud,” he says. “And everybody is in such a hurry. I still get up at seven for the count.”'; } },
      ],
    },

    // ==== visits and letters ====
    {
      id: 'g2Visit', icon: '🪟', title: (L, x) => `Visiting day: ${first(P(L, x.p))}`, gaol: true, ok: has,
      text(L, x) {
        const p = P(L, x.p), C = cur(L), n = C.vis[p.id] || 0, sv = q(L).served;
        const gift = { partner: 'a bag of satsumas', spouse: 'a bag of satsumas', parent: 'a cake that was searched and has nothing in it but cake', child: 'a drawing', sibling: 'the local paper', grandchild: 'a drawing', friend: 'a paperback and a lot of gossip' }[p.kind] || 'news';
        const open = n === 0 ? `${p.name} is on the other side of the table, in ${his(p)} good coat, holding a plastic cup of tea from the machine as if it might bite.`
          : n === 1 ? `${first(p)} again, in the same chair as last time, with ${gift}.`
            : [`${first(p)} knows the visiting hall now: which machine takes coins, which officer smiles.`, `${first(p)} is the first in the queue today, and waves through the glass before they open the door.`, `${first(p)} has brought ${gift}, as ${he(p)} does, and the officer on the door says hello to ${him(p)} by name.`][n % 3];
        let body = '';
        if (p.kind === 'partner' || p.kind === 'spouse') body = L.kids().some((k) => k.age < 18) ? ` ${He(p)} tells you about the children, and the boiler, and who said what at the school gate.${sv >= 8 ? ` ${He(p)} looks tired. ${He(p)} has been doing this a long time.` : ''}` : ` ${He(p)} tells you about the neighbours, and the boiler, and does not ask how you are, because ${he(p)} can see.`;
        else if (p.kind === 'parent') body = p.age >= 75 ? ` ${He(p)} needed a stick to get here, and will not say so.` : ` ${He(p)} has brought a photograph of the garden, which has done well this year.`;
        else if (p.kind === 'child' || p.kind === 'grandchild') body = p.age < 18 ? ` ${first(p)} is taller than when you last saw ${him(p)}, and does not know where to look.` : ` ${first(p)} is grown up now, and talks to you the way you used to talk to your own parents.`;
        else body = ` ${He(p)} tells you who is doing what in the Bay, which is mostly the same things as before.`;
        const ask = askFor(L, p);
        const tail = ask === 'home' ? ' You have something to ask, before the bell.' : ask === 'work' ? ` ${He(p)} mentions work, and you think about it.` : '';
        return `${open}${body}${tail}`;
      },
      opts: [
        { t: 'Talk about home', run(L, x) { const p = P(L, x.p), C = cur(L); C.vis[p.id] = (C.vis[p.id] || 0) + 1; G(L).n.visits++; L.bond(p, 7); L.joy(4); return 'The weather, the neighbours, the price of things. Two hours go in twenty minutes, and then the bell.'; } },
        { t: 'Tell the truth about this place', run(L, x) { const p = P(L, x.p), C = cur(L); C.vis[p.id] = (C.vis[p.id] || 0) + 1; G(L).n.visits++; L.bond(p, 11); L.joy(-1); return `${first(p)} puts ${his(p)} hand flat on the table, next to yours, which is as near as the rules allow. Neither of you says anything for a while.`; } },
        { t: (L, x) => { const p = P(L, x.p), a = askFor(L, p); return a === 'home' ? (p.kind === 'partner' || p.kind === 'spouse' ? (p.live ? `Ask ${him(p)} to keep the home going for you` : `Ask if you can come home to ${him(p)}`) : `Ask if you can stay with ${him(p)} when you are out`) : a === 'work' ? `Ask if there might be work where ${he(p)} works` : `Ask ${him(p)} to write to the parole board for you`; },
          show: (L, x) => !!askFor(L, P(L, x.p)),
          odds: (L, x) => { const p = P(L, x.p), a = askFor(L, p); return a === 'home' ? clampN(0.15 + p.bond / 110 + (p.kind === 'spouse' ? 0.1 : 0), 0.05, 0.92) : a === 'work' ? clampN(0.1 + p.bond / 120 + L.s.st.charm / 300, 0.05, 0.85) : clampN(0.3 + p.bond / 100, 0.1, 0.95); },
          run(L, x, win) {
            const p = P(L, x.p), C = cur(L), a = askFor(L, p);
            C.vis[p.id] = (C.vis[p.id] || 0) + 1; G(L).n.visits++;
            if (!win) { L.bond(p, -2); return a === 'home' ? `${first(p)} looks at the table for a long time. “I need to think about it,” ${he(p)} says. You know what that means, and so does ${he(p)}.` : a === 'work' ? `“I will ask,” says ${first(p)}, “but they will not have anybody with a record. You know what people are.”` : `“I am not much of a letter writer,” says ${first(p)}, which is not what you asked.`; }
            L.bond(p, 3);
            if (a === 'home') {
              const kept = (p.kind === 'partner' || p.kind === 'spouse') && p.live;
              C.plan.home = { k: kept ? 'kept' : 'kin', p: p.id, txt: kept ? `home, with ${p.name}, who has kept it going` : `${p.name}’s spare room` };
              return kept ? `“Where else would you go?” says ${first(p)}. “I have kept your side of the bed.”` : `“The spare room is full of boxes,” says ${first(p)}. “I will move the boxes.”`;
            }
            if (a === 'work') { C.plan.work = { c: p.job, r: 0, at: workAt(p.job), who: p.name, p: p.id }; return `${first(p)} has a word with ${his(p)} boss, who has a word with somebody else, and a letter comes: there will be a start for you, if you keep your nose clean.`; }
            C.plan.vouch = { p: p.id, name: p.name };
            return `${first(p)} writes to the board that week: two sides, in ${his(p)} best handwriting, about who you were before, and who you could be.`;
          } },
      ],
    },
    {
      id: 'g2Reply', icon: '💌', title: (L, x) => `A letter from ${first(P(L, x.p))}`, gaol: true, ok: has,
      text(L, x) {
        const p = P(L, x.p), n = first(p), C = cur(L);
        if (p.kind === 'partner' || p.kind === 'spouse') return p.bond >= 45 ? `${n} writes about the boiler, the neighbours and the price of everything, and at the end, smaller, as if it were an afterthought: “I miss you. It is very quiet.”` : `${n}’s letter is a page long, and most of it is about the weather. It is signed “love”, which it always is, with nothing after it, which it never was.`;
        if ((p.kind === 'child' || p.kind === 'grandchild') && p.age < 13) return `A letter from ${n}, in felt pen: a drawing of you, with a beard you do not have, and COME HOME SOON in letters of every size.`;
        if (p.kind === 'child' || p.kind === 'grandchild') return `${n} writes four careful lines about school and two careless ones about you, which are the ones you read again.`;
        if (p.kind === 'parent') return `${p.sex === 'f' ? 'Your mum' : 'Your dad'} writes about the garden, and the neighbours, and the doctor, and does not once mention where you are, which is a kind of love.${C && C.learnt.length ? ' Except at the end: “Proud of you for the certificate.”' : ''}`;
        return `${n} writes with all the news of the Bay: who is courting, who has fallen out, and what the Rovers did on Saturday, which was lose.`;
      },
      opts: [
        { t: (L, x) => `Ask ${him(P(L, x.p))} to wait for you`, show: (L, x) => ['partner', 'spouse'].includes(P(L, x.p).kind), run(L, x) { const p = P(L, x.p); if (p.bond >= 45) { L.bond(p, 6); L.joy(3); return `${first(p)} writes back by return: “Where else would I be?”`; } L.bond(p, -4); return `It is a lot to ask, and ${first(p)} does not answer that part of the letter.`; } },
        { t: (L, x) => `Tell ${him(P(L, x.p))} not to wait`, show: (L, x) => ['partner', 'spouse'].includes(P(L, x.p).kind), run(L, x) { const p = P(L, x.p); L.joy(-8); L.karma(2); if (L.makeEx) L.makeEx(p, 0); L.note(`Told ${p.name} not to wait.`, 'big'); return `You write that ${he(p)} should go and be happy. ${He(p)} cries, ${he(p)} says, and then, after a while, ${he(p)} does.`; } },
        { t: 'Send a drawing back', show: (L, x) => ['child', 'grandchild'].includes(P(L, x.p).kind) && P(L, x.p).age < 16, run(L, x) { const p = P(L, x.p); L.bond(p, 8); L.joy(3); return `You draw the gulls on the wall, and Pip, and a cake with ${first(p)}’s name on it. It is not a good drawing. It goes on a fridge.`; } },
        { t: 'Tell them about the course', show: (L, x) => P(L, x.p).kind === 'parent' && !!L.gaolCourse(), run(L, x) { const p = P(L, x.p); L.bond(p, 6); return 'The next letter has a newspaper cutting in it about somebody who got a degree in prison. Your mum has underlined “degree”, twice.'; } },
        { t: 'Write back the same night', run(L, x) { const p = P(L, x.p); L.bond(p, 5); L.s.time = Math.max(0, L.s.time - 1); return 'You write back that night, by the light from the landing, and post it before you can think better of any of it.'; } },
        { t: 'Keep it for the bad days', run(L) { L.joy(3); return 'It goes under your pillow, with the others. On the bad days you read them in order.'; } },
      ],
    },
    {
      id: 'g2Fade', icon: '🍂', title: 'Shorter letters', gaol: true, ok: (L, x) => has(L, x) && ['partner', 'spouse'].includes(P(L, x.p).kind),
      text: (L, x) => { const p = P(L, x.p); return `The letters from ${first(p)} have got shorter, and further apart. The last one was a postcard of the harbour, with nothing on the back but the weather. ${He(p)} has not been to visit since the ${seasonWord[(L.s.t + 2) % 4]}.`; },
      opts: [
        { t: 'Write the longest letter of your life', check: ['charm', 50], run(L, x, win) { const p = P(L, x.p); L.bond(p, win ? 15 : 4); return win ? `Eleven pages, about the first time you saw ${him(p)}, and everything since. ${first(p)} writes back: “You never said any of that before.”` : `Eleven pages. ${first(p)} writes back a postcard. It is a different postcard. That is something.`; } },
        { t: 'Send a visiting order, and hope', run(L, x) { const p = P(L, x.p), C = cur(L); L.bond(p, 2); if (!C.vo) C.vo = { p: p.id, t: L.s.t }; return 'You fill it in, and post it, and do not let yourself think about Thursday week.'; } },
        { t: (L, x) => `Tell ${him(P(L, x.p))} to go and be happy`, run(L, x) { const p = P(L, x.p); L.joy(-8); L.karma(3); if (L.makeEx) L.makeEx(p, 0); L.note(`Let ${p.name} go, from Starling Gaol.`, 'big'); return `You write it in four lines, because more would not be fair. ${first(p)} cries, ${he(p)} says, and then, after a while, ${he(p)} does go and be happy, which is what you wanted, and is terrible.`; } },
      ],
    },

    // ==== the board ====
    {
      id: 'g2Prep', icon: '🗂️', title: 'The board sits next season', gaol: true,
      text(L) {
        const gaps = [];
        if (!L.g2HomeOk()) gaps.push('where you will live');
        if (!cur(L).plan.work) gaps.push('what you will do');
        if (!cur(L).plan.vouch) gaps.push('who will speak for you');
        const n = L.s.n.boards || 0, open = [
          'The parole board sits next season. Mrs Abernethy says what everybody says: get your house in order. They will read your file, and the record of every season you have been in.',
          'The board again next season. The chaplain says the second time is easier, and then says he does not know why he said that.',
          `Another board next season, the ${['third', 'fourth', 'fifth', 'sixth', 'seventh'][n - 2] || 'next'} time. Mr Hobbs reminds you, kindly, to wear a clean shirt.`,
          'The board sits next season. You know the drill now: the long table, the fountain pen, the question about where you will live.',
        ][Math.min(n, 3)];
        return `${n >= 3 ? `${open} ${L.s.gaol.served} seasons served.` : open}${gaps.length ? ` They will ask ${gaps.length > 1 ? `${gaps.slice(0, -1).join(', ')} and ${gaps[gaps.length - 1]}` : gaps[0]}, and you do not have an answer yet.` : ' And you have an answer for everything they will ask, for once.'}`;
      },
      opts: [
        { t: 'Write a statement with the chaplain', show: (L) => cur(L).chap >= 1, run(L) { cur(L).f.stmt = 1; L.gain('smarts', 0.5); return 'One side of paper, after four drafts. The Reverend Penrose crosses out every “I know I have done wrong” but the first one. “Once is enough,” he says. “Then tell them what you will do.”'; } },
        { t: 'Ask Mr Hobbs for a report', show: (L) => q(L).good >= 50, odds: (L) => clampN(0.3 + q(L).good / 200, 0.3, 0.85), run(L, x, win) { if (win) { cur(L).f.report = 1; return 'Mr Hobbs writes it that night, in pencil, then in ink. He does not show it to you. He does tell you that he spelt your name right.'; } return '“I will see,” says Mr Hobbs, which from Mr Hobbs is neither yes nor no, and in the end is no.'; } },
        { t: 'Read your file through', run(L) { L.gain('smarts', 0.5); return 'Every page of it. It is not a pleasant read. But you know now what they know, and that is worth something on the day.'; } },
        { t: 'Leave it to chance', run(L) { L.joy(1); return 'You have been before boards before. They will think what they think.'; } },
      ],
    },
    {
      id: 'g2Offer', icon: '📨', title: (L) => `A word from ${JOBS[L.g2Job().k].boss}`, gaol: true, ok: (L) => !!L.g2Job(),
      text(L) { const j = L.g2Job(), J = JOBS[j.k]; return `${J.boss} keeps you back after your shift. ${h.BOSS_SAYS[j.k]} “If you keep your nose clean,” ${['Mrs Treloar', 'Miss Achterberg'].includes(J.boss) ? 'she' : 'he'} says, “there could be a start for you there, when you are out. I would put it in writing.”`; },
      opts: [
        { t: 'Thank them, and mean it', run(L) { const j = L.g2Job(), J = JOBS[j.k]; cur(L).plan.work = { c: J.out.c, r: j.r >= 2 ? 1 : 0, at: J.out.at, who: J.boss }; L.behave(3); return 'The letter comes on headed paper, which you keep flat under your mattress, and read more often than you would admit.'; } },
        { t: 'Say you have other plans', run(L) { L.respect(2); return '“Suit yourself,” says the boss, and you go back to the landing feeling, for some reason, worse.'; } },
      ],
    },
    {
      id: 'g2ChapAsk', icon: '🕯️', title: 'The Reverend Penrose', gaol: true,
      text: (L) => (cur(L).f.ca2 ? 'The chaplain is fixing his motorbike in the car park, and calls you over to hold a spanner. “Have you thought any more,” he says, “about what happens after?”' : 'After the service, the chaplain asks you to stay behind and help stack the chairs. “You have been coming a while now,” he says. “Can I do anything for you? Outside, I mean. I know people. It is most of what I do.”'),
      opts: [
        { t: 'Ask him to speak for you at the board', show: (L) => !cur(L).plan.vouch, run(L) { cur(L).plan.vouch = { p: null, name: 'the Reverend Hugh Penrose' }; L.joy(3); return '“I would be glad to,” he says. “I shall wear the collar. They like the collar.”'; } },
        { t: 'Ask about somewhere to live, for after', show: (L) => !L.g2HomeOk(), run(L) { cur(L).plan.home = { k: 'room', p: null, txt: 'a room over the chip shop, through the Mariners’ Trust' }; L.joy(3); return 'The Mariners’ Trust has a room over the chip shop on the harbour, he says. It smells of vinegar. They will pay the first season. He writes your name on the list while you watch.'; } },
        { t: 'Just stack the chairs', run(L) { L.joy(3); L.karma(1); return 'You stack the chairs, and he talks about his motorbike, and for half an hour nobody needs anything from anybody.'; } },
      ],
    },
    {
      id: 'g2Sorry', icon: '🤝', title: 'The other side of it', gaol: true,
      text: (L) => `Mrs Abernethy asks whether you would meet somebody: ${vic(L)}. A room with a box of tissues and three chairs, and nobody has to say anything they do not want to.`,
      opts: [
        { t: 'Meet them', run(L) { G(L).f.sorry = 1; const C = cur(L); C.change = Math.min(100, C.change + 15); L.karma(6); L.behave(6); L.joy(4); L.note('Met somebody on the other side of what you did, in Starling Gaol.', 'big'); return 'An hour. You say sorry, which you had practised, and then a great deal you had not. At the end they shake your hand, not because they forgive you, they say, but because they want to be the sort of person who would.'; } },
        { t: 'Write to them instead', run(L) { const C = cur(L); C.change = Math.min(100, C.change + 5); L.karma(3); return 'Two sides of paper. Mrs Abernethy posts it. You never hear back, and you did not expect to, and it still matters that you wrote.'; } },
        { t: 'Not yet', run(L) { return '“That is an answer too,” says Mrs Abernethy, and writes nothing down.'; } },
      ],
    },
    {
      id: 'g2Mercy', icon: '🕊️', title: 'Compassionate release', gaol: true,
      text: 'The governor has seen the doctor’s letter, and has put in for your release on compassionate grounds: to die at home, he says, as gently as anybody has ever said anything in this building.',
      opts: [
        { t: 'Let him try', odds: (L) => clampN(0.35 + q(L).good / 200 - Math.min(4, L.s.record) * 0.04 - (L.s.f.escaped ? 0.2 : 0), 0.1, 0.9), run(L, x, win) { if (win) { L.release(true); return 'The Home Office takes six weeks, which for the Home Office is a sprint. Mr Hobbs carries your bag to the gate himself.'; } L.joy(-4); return 'The Home Office says no, in a letter with a reference number. The governor is angrier about it than you are.'; } },
        { t: 'Stay where your friends are', run(L) { L.joy(6); L.karma(1); return 'You thank the governor, and say no. The landing is where your people are now, for what time there is.'; } },
      ],
    },

    // ==== the job ====
    {
      id: 'g2J_laundry', icon: '👔', title: 'The officers’ shirts', gaol: true, ok: (L) => !!L.g2Job() && L.g2Job().k === 'laundry',
      text: 'In the breast pocket of an officer’s shirt, folded small: next month’s rota for the night shift, in Mr Hobbs’s handwriting.',
      opts: [
        { t: 'Read it, and remember it', run(L) { const e = cur(L).esc; e.hw += 2; e.habits = Math.min(2, Math.floor(e.hw / 2)); L.gain('smarts', 0.5); return 'Who is on the gate, which nights, and who has Tuesdays off for his allotment. You put it back in the pocket, and starch the shirt beautifully.'; } },
        { t: 'Hand it to Mrs Treloar', run(L) { L.behave(5); const j = L.g2Job(); j.perf = Math.min(100, j.perf + 10); return 'Mrs Treloar gives it back to Mr Hobbs, who goes pink. Your shirts are always done first, after that.'; } },
        { t: 'Sell it to Lenny', show: (L) => here(L, 'lenny') && !!fk(L, 'lenny'), run(L) { warm(L, 'lenny', 10); L.cash(50); L.karma(-1); return 'Lenny reads it twice, and gives you fifty dollars and a look that says you will go far, or at least to the end of the landing.'; } },
      ],
    },
    {
      id: 'g2J_kitchen', icon: (L) => (L.g2Job().r >= 2 ? '🍷' : '🍐'), title: (L) => (L.g2Job().r >= 2 ? 'The governor’s dinner' : 'A smell of pear drops'), gaol: true, ok: (L) => !!L.g2Job() && L.g2Job().k === 'kitchen',
      text: (L) => (L.g2Job().r >= 2 ? 'The Board of Visitors dines with the governor on Friday: six of them, including the woman from the parole board with the fountain pen. Chef wants you on the soup.' : 'Yeast and sugar have been going missing from the stores, a little at a time, and there is a smell of pear drops behind the boiler. The brew is nearly ready, and the brewer would like a hand.'),
      opts: [
        { t: 'Make the soup of your life', show: (L) => L.g2Job().r >= 2, check: ['craft', 50], run(L, x, win) { if (win) { cur(L).f.dinner = 1; L.behave(6); L.joy(4); return 'Leek and potato, with a little nutmeg. The woman with the fountain pen asks who made it, and writes your name down, and underlines it.'; } L.behave(-2); return 'Too much salt. Chef says nothing, which is worse than anything he could have said.'; } },
        { t: 'Keep your head down and serve', show: (L) => L.g2Job().r >= 2, run(L) { L.behave(3); return 'You serve the soup, and the fish, and a trifle with a cherry on each portion, and nobody notices you at all, which is what you wanted.'; } },
        { t: 'Help with the brew', show: (L) => L.g2Job().r < 2, run(L) { L.respect(6); if (L.chance(0.25)) { L.behave(-15); L.g2Sack('a still behind the boiler'); return 'Mr Hobbs follows his nose to the boiler room. The brew goes down the drain, and you go back to the wing without a job.'; } L.cash(60); return 'It tastes of pear drops and regret. B wing drinks every drop on Saturday night, and sings, badly, and you are owed a great many favours.'; } },
        { t: 'Pour it down the drain', show: (L) => L.g2Job().r < 2, run(L) { L.respect(-6); L.behave(5); return 'Down the drain, all of it. The brewer finds out by Sunday, and so does everybody else.'; } },
        { t: 'Say nothing', show: (L) => L.g2Job().r < 2, run(L) { return 'You see nothing, smell nothing and say nothing, which is the kitchen’s oldest recipe.'; } },
      ],
    },
    {
      id: 'g2J_library', icon: '🗄️', title: 'Miss Achterberg’s Wednesday', gaol: true, ok: (L) => !!L.g2Job() && L.g2Job().k === 'library',
      text: 'Miss Achterberg arrives from the town library with a box from the archive that needs cataloguing, a flask of tea, and a look that makes the whole room whisper.',
      opts: [
        { t: 'Catalogue it properly', run(L) { L.gain('smarts', 1.5); L.behave(4); folkWarm(L, 'achterberg', 5); const j = L.g2Job(); j.perf = Math.min(100, j.perf + 8); return 'Ship’s manifests from 1890, and a love letter tucked into one of them. You catalogue the letter too. Miss Achterberg reads it twice, and files it under “Correspondence, Romantic”, and goes slightly pink.'; } },
        { t: 'Ask her what she is writing', check: ['charm', 50], run(L, x, win) { if (win) { folkWarm(L, 'achterberg', 8); L.joy(3); return '“Nothing,” she says, and then, very quietly, “A novel. There is a lighthouse keeper.” She lends you the first chapter, in a brown envelope. It is extremely romantic.'; } return '“Silence in the library,” says Miss Achterberg, which is an answer of sorts.'; } },
        { t: 'Hide a romance under the counter for Del', run(L) { L.respect(3); L.behave(-1); return 'Del on the twos likes his romances, and is too shy to ask for them. Miss Achterberg sees, and says nothing, and next week there are two.'; } },
      ],
    },
    {
      id: 'g2J_gardens', icon: '🥬', title: 'The county show', gaol: true, ok: (L) => !!L.g2Job() && L.g2Job().k === 'gardens',
      text: 'The county show has a class for leeks, and Mr Bolitho has entered the prison’s. So, he says darkly, has Mrs Pargeter of plot 9, who has won it six times.',
      opts: [
        { t: 'Grow the leeks of your life', check: ['craft', 50], run(L, x, win) { if (win) { L.joy(6); L.behave(5); L.fame(1); folkWarm(L, 'parg', 3); return 'Second prize, behind Mrs Pargeter, by a quarter of an inch. She sends a note to the prison: “Not bad. Who grew them?” Mr Bolitho has it framed.'; } L.joy(1); return 'Highly commended. Mrs Pargeter wins, as she always does. Mr Bolitho says next year, and means it.'; } },
        { t: 'Let Mr Bolitho take the credit', run(L) { L.behave(4); const j = L.g2Job(); j.perf = Math.min(100, j.perf + 10); return 'He goes up for the rosette in his good tweed. When he comes back, he gives it to you, in the potting shed, and says nothing.'; } },
      ],
    },
    {
      id: 'g2J_workshop', icon: '⛵', title: 'Something to take home', gaol: true, ok: (L) => !!L.g2Job() && L.g2Job().k === 'workshop',
      text: (L) => { const k = L.kids().find((c) => c.age < 14), pt = L.partner(); return k ? `Mr Prothero lets the men make something for home, in the last week before Christmas. You have the wood for a boat for ${first(k)}, with a sail made out of a handkerchief.` : pt ? `Mr Prothero lets the men make something for home, in the last week before Christmas. You have the wood for a little box for ${first(pt)}, with a lid that fits.` : 'Mr Prothero lets the men make something for home, in the last week before Christmas. You have nobody to make it for, so you make a bird table for the chaplain.'; },
      opts: [
        { t: 'Make it with care', check: ['craft', 45], run(L, x, win) { const k = L.kids().find((c) => c.age < 14), pt = L.partner(), p = k || pt; if (p) L.bond(p, win ? 12 : 6); else L.karma(2); L.gain('craft', 1); return win ? (p ? `It is the best thing you have ever made. ${first(p)} writes that it has pride of place, and you believe it.` : 'The chaplain puts it outside the chapel. The robins approve.') : (p ? 'The lid does not quite fit. It is the not quite fitting that makes it yours, the letter says.' : 'It leans a little. The robins do not mind.'); } },
        { t: 'Sell it on the landing', run(L) { L.cash(40); L.respect(2); return 'Forty dollars, from a man on the fours who has a grandson and no idea about wood.'; } },
      ],
    },

    // ==== the days that are not like the others ====
    {
      id: 'g2Year', icon: '🗓️', title: 'A year inside', gaol: true,
      text(L) {
        const C = cur(L), j = C.job, n = terms(L);
        const what = j ? ` ${JOBS[j.k].boss} has you down as “${L.g2JobTitle()}”, in ${JOBS[j.k].name.toLowerCase()}${C.learnt.length ? `, and you have a ${COURSES[C.learnt[0]].name}` : ''}.` : '';
        const open = n === 1 ? 'A year today, by your count: four seasons, three hundred and sixty-five dinners, and one escape attempt, by somebody else. You make a mark on the wall, which everybody does, and Mr Hobbs pretends not to see.'
          : n === 2 ? 'A year in, again. You know where everything is this time, which is worse, in a way.'
            : `A year in. You stopped making marks on the wall ${n >= 4 ? 'several sentences ago' : 'last time'}.`;
        return `${open}${what}`;
      },
      opts: [
        { t: 'Make a mark on the wall', run(L) { L.joy(1); return 'A small mark, by the bunk, with the end of a spoon. Next to it, fainter, somebody else’s marks, from long ago. There are a great many of them.'; } },
        { t: 'Write down what this year was for', run(L) { L.gain('smarts', 0.8); L.joy(2); return 'One page. Some of it is better than you expected. Some of it is not, and you write that down too.'; } },
        { t: T('loner', 'Spend the day alone with it'), show: trait('loner'), run(L) { L.joy(3); return 'You turn down the yard, the library and the pool table, and spend the day with your own thoughts, which are better company than they used to be.'; } },
      ],
    },
    {
      id: 'g2Long', icon: '⏳', title: (L) => ['Three years', 'Six years', 'Ten years', 'Fifteen years'][Math.max(0, cur(L).long - 1)] || 'A long time', gaol: true,
      text: (L) => [
        'Three years. Men who came in after you have gone out before you. A new lad asks you where the library is, and you hear yourself say “down the end, past the chapel, mind Doris,” as if you had always lived here.',
        'Six years. The officers who were new when you came are not new now, and two of them call you by your first name. The wall outside your window has been repainted, the same grey.',
        'Ten years. You have outlasted three governors, a great many cellmates and the old boiler. The young officers ask you how things were done, before.',
        'Fifteen years. There is a photograph of B wing’s five-a-side team in the corridor, and you are in it, twice, a long way apart.',
      ][Math.max(0, cur(L).long - 1)] || 'A long time inside.',
      opts: [
        { t: 'Show the new ones the ropes', run(L) { L.behave(4); L.respect(4); L.karma(2); return 'Which landing to keep off, which officer to say good morning to, and how to make tea in a sock. They write it down, as you did, once.'; } },
        { t: 'Keep yourself to yourself', run(L) { L.joy(2); return 'You have seen them come and go. You let them come and go.'; } },
      ],
    },
    {
      id: 'g2Xmas', icon: '🎄', title: 'Christmas on B wing', gaol: true,
      text(L) {
        const g = G(L), c = cur(L);
        const open = ['Christmas on B wing: paper chains made of canteen sheets, and a tree in the chapel with one string of lights, half of which work.', 'Christmas again. The kitchens have done turkey, of a sort, and the chaplain has done carols, of a sort.', 'Christmas. Somebody has drawn holly on the window of every cell door with toothpaste.', 'Christmas morning, and Mr Hobbs comes round with a tin of chocolates and a face that dares anybody to say anything.', 'Christmas, and snow on the wall, and the whole wing at the windows like children.', 'Christmas, and the Salvation Army band in the yard, playing “Silent Night” to men who have not had a silent night in years.'][g.n.xmas % 6];
        const more = ['Lenny gives everybody half an ounce, for once, without writing it down.', 'You get a card from the Bay with a robin on it.', 'Somebody sings, after lights out, and nobody tells him to shut up.', 'The pudding has a sixpence in it, and the man who finds it nearly breaks a tooth, and is very pleased.', 'Pip, if it is Pip, sings along to the King’s speech.', 'There is a telephone queue that goes all the way down the stairs.', 'The Bay lads and the Kettleby lot share a tin of biscuits, and nobody comments.', 'You think about Christmases outside, and then you stop.'][c.xmas % 8];
        return `${open} ${more}`;
      },
      opts: [
        { t: 'Go to the carol service', run(L) { G(L).n.xmas++; cur(L).xmas++; L.joy(5); L.karma(1); return 'You sing all the verses of “Hark the Herald”, including the one nobody knows, and the chaplain beams at you from the front.'; } },
        { t: 'Ring home', show: (L) => L.s.people.some((p) => ['partner', 'spouse', 'child', 'parent'].includes(p.kind) && p.bond >= 30), run(L) { G(L).n.xmas++; cur(L).xmas++; const p = L.s.people.filter((x) => ['partner', 'spouse', 'child', 'parent'].includes(x.kind)).sort((a, b) => b.bond - a.bond)[0]; L.bond(p, 6); L.joy(4); return `Four minutes in the queue for every minute on the telephone. ${p.name} answers on the second ring, as if ${he(p)} had been sitting by it, which ${he(p)} had.`; } },
        { t: 'Help Chef with the dinner', show: (L) => !!L.g2Job() && L.g2Job().k === 'kitchen', run(L) { G(L).n.xmas++; cur(L).xmas++; L.behave(4); L.respect(3); L.gain('craft', 1); return 'Six hundred dinners and a hundred and ten pounds of sprouts. Chef gives you the wishbone.'; } },
        { t: 'Sit it out in your cell', run(L) { G(L).n.xmas++; cur(L).xmas++; L.joy(-2); return 'You sit it out. It is only a day, you tell yourself, all day.'; } },
      ],
    },
    {
      id: 'g2Bday', icon: '🎂', title: (L) => `${L.s.age} today`, gaol: true,
      text(L) {
        const cards = L.s.people.filter((p) => ['partner', 'spouse', 'parent', 'child', 'sibling', 'friend', 'grandchild'].includes(p.kind) && p.bond >= 40);
        const n = cur(L).seen.g2Bday || 0, sv = q(L).served;
        const from = cards.length ? `${cards.length === 1 ? `A card from ${cards[0].name}` : `${cards.length} cards, from ${cards.slice(0, 3).map((p) => first(p)).join(', ')}${cards.length > 3 ? ' and more' : ''}`}, opened by the censor and stuck down again with tape.` : 'No cards. The post comes and goes, and you stop listening for it by Tuesday.';
        const how = [`${L.s.age} in Starling Gaol.`, `Another birthday inside: ${L.s.age}.`, `${L.s.age}, and ${sv} season${sv === 1 ? '' : 's'} of this one done.`, `${L.s.age} today. Mr Hobbs knows, because it is on your file, and nods.`, `Your birthday: ${L.s.age}. The landing sings, badly, because Stevie Rowe makes them.`][n % 5];
        return `${how} ${from}`;
      },
      opts: [
        { t: 'Read them twice', run(L) { L.joy(3); return 'And then a third time, after lights out, by the light from the landing.'; } },
        { t: 'Share out what came with them', show: (L) => L.s.people.some((p) => ['partner', 'spouse', 'parent'].includes(p.kind) && p.bond >= 40), run(L) { L.respect(2); L.joy(2); return 'A tin of shortbread, round the landing, one each. Lenny takes two, and pays for the second in tobacco.'; } },
        { t: 'Treat it like any other day', run(L) { L.behave(2); return 'It is any other day. That is the trick of it.'; } },
      ],
    },
    {
      id: 'g2Window', icon: '🪟', title: 'Through the window', gaol: true,
      text: (L) => ['Spring through the window: gulls nesting on the top of the wall, in the razor wire, which you would think they would mind. The chicks are out by May.', 'Summer through the window: the cell is an oven, and through the bars you can hear the fair on the pier, the organ and the screaming, very faint.', 'Autumn through the window: the smell of the sea on the wind, and leaves from somewhere, though there is not a tree for half a mile.', 'Winter through the window: the light goes at four, and the frost is on the inside of the glass by morning.'][L.season],
      opts: [
        { t: 'Watch for a while', run(L) { L.joy(3); return 'You watch until the count. It is the most of the outside you have had in a long time.'; } },
        { t: 'Draw it', run(L) { L.gain('craft', 1); L.joy(2); return 'In biro, on the back of a canteen sheet. You put it on the wall by the bunk, where the window would be if the window were there.'; } },
      ],
    },
    {
      id: 'g2Rovers', icon: '⚽', title: 'Starling Rovers come to play', gaol: true,
      text: 'Starling Rovers have sent a team to play the prison eleven in the yard, which happens once a year and is talked about for the other three hundred and sixty-four days. Gaz Kowalski, their manager, is on the touchline with a meat pie in each hand.',
      opts: [
        { t: 'Play', check: ['fitness', 45], run(L, x, win) { L.gain('fitness', 1.5); L.respect(4); if (win) { L.joy(6); folkWarm(L, 'gaz', 6); return 'You score with your knee, which counts. Gaz Kowalski shakes your hand afterwards and says, through a pie, “When you are out, son. Come and train.”'; } L.joy(2); return 'You play left back, and are left behind, mostly. The prison loses seven–two. It is the best day of the year.'; } },
        { t: 'Shout from the wall', run(L) { L.joy(4); return 'You shout yourself hoarse. The referee is a prison officer, and the abuse is the most fun anybody has had in months.'; } },
      ],
    },
    {
      id: 'g2Play', icon: '🎭', title: 'The Pavilion Players', gaol: true,
      text: 'Desmond Achebe of the Pavilion Players has brought a play to the chapel, as he does every year, and mentions twice that he once understudied in the West End. He needs a prisoner for a small part: a footman, with one line.',
      opts: [
        { t: 'Take the part', check: ['charm', 45], run(L, x, win) { L.gain('charm', 1); folkWarm(L, 'desmond', 5); if (win) { L.joy(6); L.fame(0.5); return '“The carriage is at the door, my lady.” You say it with such feeling that the chapel applauds, and Desmond Achebe says you have presence, and that he means it.'; } L.joy(2); return 'You forget the line. You make up another one. Desmond says afterwards that it was better, and does not mean it, and it does not matter.'; } },
        { t: 'Watch from the back', run(L) { L.joy(3); return 'It is a murder mystery. B wing guesses the murderer in the first scene, out loud, and is wrong.'; } },
      ],
    },
    {
      id: 'g2Hobbs', icon: '👮', title: 'Mr Hobbs', gaol: true,
      text: (L) => ['Mr Hobbs is limping. His back, he says, from lifting a marrow at the county show. It came third.', 'Mr Hobbs has a photograph of a new granddaughter in his top pocket, and shows it to the whole landing, one at a time, very sternly.', 'Mr Hobbs has twenty-five years in, and the governor gives him a medal for it, on the landing, in front of everybody. He looks as if he would like the floor to open.', 'Mr Hobbs is talking about retiring. He has been talking about retiring for eleven years. Nobody believes him, least of all Mr Hobbs.', 'Mr Hobbs has a cold, and comes in anyway, because, he says, who else would do it properly.'][G(L).n.hobbs % 5],
      opts: [
        { t: 'Ask after it', run(L) { G(L).n.hobbs++; L.behave(3); L.joy(2); return 'He tells you, at some length. Nobody has asked him anything in years, you suspect, that was not about keys.'; } },
        { t: 'Rib him about it', run(L) { G(L).n.hobbs++; L.respect(3); L.behave(-1); return 'The landing laughs. So, after a moment, does Mr Hobbs, though he writes something down.'; } },
      ],
    },
    {
      id: 'g2Flu', icon: '🤧', title: 'Flu on the wing', gaol: true,
      text: 'Flu goes through B wing like a rumour: half the landing is in bed by Wednesday, and the hospital wing is full of men pretending to be sicker than they are, and some who are not pretending.',
      opts: [
        { t: 'Keep to your cell', run(L) { L.hp(-1); return 'You keep your door shut and wash your hands until they are raw. You get a cold, which is a victory of sorts.'; } },
        { t: 'Help the nurse with the trays', run(L) { L.karma(3); L.behave(5); if (L.chance(0.4)) { L.sicken('flu', 1); L.hp(-4); return 'Soup to the threes, soup to the fours. On Friday it is your turn for the soup.'; } return 'Soup to the threes, soup to the fours, and somehow you never catch it. The nurse says you have the constitution of a mule, which she means kindly.'; } },
      ],
    },
    {
      id: 'g2News', icon: '🗞️', title: 'The Gazette', gaol: true,
      text(L) {
        const f = L.friends().find((p) => p.bond >= 30);
        const bits = ['the Rovers have lost again, nine–one, and Gaz Kowalski has said he is “cautiously optimistic”', 'there is a row at the council about a footpath, and Tom Windle has written a letter about it that the Gazette has printed with the worst words taken out', 'the lifeboat went out twice in one night, and Captain Quinn said “It is what we do,” which was all she said'];
        const b = bits[L.s.t % bits.length];
        return `The library’s copy of the Starling Gazette, a week old and read to tatters. ${b[0].toUpperCase()}${b.slice(1)}.${f ? ` And on page nine, a photograph of ${f.name}, at a wedding, laughing at something.` : ''} The Bay is getting on without you.`;
      },
      opts: [
        { t: 'Read every word', run(L) { L.gain('smarts', 0.5); L.joy(2); return 'Even the small advertisements. Somebody is selling a pram, and somebody else a canary, and you think of Pip.'; } },
        { t: 'Cut out the crossword', run(L) { L.gain('smarts', 1); return 'It takes you four days. The last clue is “a place of confinement (4)”, which you think is a bit much.'; } },
      ],
    },
    {
      id: 'g2Spin', icon: '🔦', title: 'Three in the morning', gaol: true,
      text: 'They know something. Mr Hobbs and two officers you have never seen before, at three in the morning, and they go past every other cell on the landing and straight to yours.',
      opts: [
        { t: 'Keep very still', check: ['charm', 50], run(L, x, win) { const C = cur(L), Q = q(L); if (win) { C.esc.seen = Math.max(0, C.esc.seen - 20); return 'They tap every wall, and move every brick but one. Mr Hobbs looks at you for a long time, and then he goes.'; } Q.dig = Math.max(0, Q.dig - 2); C.esc.seen = 0; L.behave(-10); return 'They find the loose brick, and behind it most of your work. Not all of it. They do not know how far you got.'; } },
        { t: 'Have Lenny start something on the twos', show: (L) => here(L, 'lenny') && (fk(L, 'lenny') || { v: 0 }).v >= 20, odds: () => 0.75, run(L, x, win) { const C = cur(L); warm(L, 'lenny', -5); if (win) { C.esc.seen = Math.max(0, C.esc.seen - 25); return 'A fire alarm, a flood on the twos and a man on the fours who has suddenly found religion, loudly. By the time it is sorted out, it is six, and the search is called off.'; } q(L).dig = Math.max(0, q(L).dig - 1); return 'Lenny’s diversion is a good one, and only half works. They take your spoon.'; } },
        { t: 'Let them find the tobacco instead', run(L) { const C = cur(L); C.esc.seen = Math.max(0, C.esc.seen - 30); L.behave(-6); return 'Three ounces, in the mattress, where they were always going to look. They take it, and are pleased with themselves, and do not look any further.'; } },
      ],
    },

    // ==== outside: what was promised ====
    {
      id: 'g2Start', icon: '💼', title: 'Monday morning', ok: (L) => !L.s.gaol && !L.s.run,
      text: (L, x) => `${x.who ? `${x.who} was as good as the letter.` : 'The letter was not just a letter.'} There is a job for you at ${x.at}, starting Monday, as ${CAREERS[x.c].rungs[Math.min(x.r, CAREERS[x.c].rungs.length - 1)].title.toLowerCase()}. ${L.s.job ? 'You have work already, of a sort.' : 'Nobody else is offering.'}`,
      opts: [
        { t: 'Start on Monday', why: (L, x) => (!L.g2JobOk(x.c) ? 'They will not have you now.' : L.s.job && L.s.job.c === x.c ? 'This is your work already.' : null), run(L, x) { const said = hire(L, x.c, x.r); L.joy(5); return `${said} Seven sharp, in a clean shirt, and nobody asks where you have been, though everybody knows.`; } },
        { t: 'Thank them, and say not yet', run(L) { L.joy(-1); return 'You write back, and thank them, and say not yet. The letter goes in a drawer, and stays there.'; } },
      ],
    },
    {
      id: 'g2June', icon: '🏘️', title: 'Gull Terrace', ok: (L) => !L.s.gaol && !L.s.run,
      text: 'Ossie’s letter is still sewn into the lining of your coat. Gull Terrace is the row of pink houses behind the lifeboat station. Number nine has a ship in a bottle in the front window, and a doorbell that plays a tune.',
      opts: [
        { t: 'Ring the bell', run(L) { const g = G(L), o = fk(L, 'ossie'); o.f.hand = 2; o.f.june = 'wrote'; g.f.june = 1; L.karma(6); L.joy(5); const p = L.friends().length < 20 ? L.meet({ name: 'June Pengelly', sex: 'f', age: Math.max(40, L.s.age + 6), trait: 'kind', bond: 30, single: false }) : null; L.note('Took Ossie Pengelly’s letter to his daughter June, by hand.', 'big'); return `She reads it on the doorstep, twice, with her hand over her mouth. Then she asks you in, and puts the kettle on, and asks you everything about him, and you tell her about Pip.${p ? ' June Pengelly. She says you must come again.' : ''}`; } },
        { t: 'Put it through the letterbox', run(L) { const o = fk(L, 'ossie'); o.f.hand = 2; o.f.june = 'wrote'; L.karma(3); return 'Through the letterbox, and away up the hill before anybody comes to the door. A curtain moves as you go.'; } },
        { t: 'Keep walking', run(L) { fk(L, 'ossie').f.hand = 3; L.karma(-3); return 'You walk past number nine, and keep walking. The letter stays in the lining of your coat, and gets heavier.'; } },
      ],
    },

    // ==== on the run ====
    {
      id: 'g2Lam0', icon: '🌒', title: 'Somewhere to sleep', ok: (L) => !!L.s.run && !!L.s.gaol2.run,
      text: 'A week of hedges, barns and a bus shelter on the Kettleby road, and every police car in the county has your photograph. You need somewhere to sleep that is not a hedge, for as long as this lasts.',
      opts: [
        { t: (L) => { const p = L.partner() && L.partner().bond >= 40 ? L.partner() : L.s.people.find((x) => ['parent', 'sibling'].includes(x.kind) && x.bond >= 40); return `Go home to ${p ? first(p) : 'family'}`; }, show: (L) => (L.partner() && L.partner().bond >= 40) || L.s.people.some((x) => ['parent', 'sibling'].includes(x.kind) && x.bond >= 40), run(L) { const R = G(L).run, p = L.partner() && L.partner().bond >= 40 ? L.partner() : L.s.people.find((x) => ['parent', 'sibling'].includes(x.kind) && x.bond >= 40); R.hid = 'kin'; R.hp = p.id; L.joy(6); return `${first(p)} opens the door in ${his(p)} dressing gown, and goes white, and then pulls you in by the collar before anybody sees. It is the first place they will look. It is also home.`; } },
        { t: 'The caves under Gorse Head', run(L) { G(L).run.hid = 'caves'; L.hp(-2, 'a night in a cave'); return 'A cave under Gorse Head that the smugglers used, with a ledge above the high-water mark. Cold, damp, and nobody comes here but the seals.'; } },
        { t: 'Sal’s boat shed', show: (L) => !!L.salHere && L.salHere() && L.s.heists && L.s.heists.sal >= 40, run(L) { G(L).run.hid = 'sal'; if (L.salTrust) L.salTrust(-4); return 'Sal’s boat shed, behind the ice house. Sal’s man brings soup and a sleeping bag and says Sal says this is a favour, and Sal remembers favours.'; } },
        { t: 'A room in Kettleby, under another name', cost: 300, run(L) { G(L).run.hid = 'room'; return 'A room over a launderette in Kettleby, paid weekly in cash, under the name of a footballer nobody remembers. The landlady does not ask.'; } },
      ],
    },
    {
      id: 'g2Lam1', icon: '📰', title: 'Your face in the Gazette', ok: (L) => !!L.s.run,
      text: 'There you are on the front of the Gazette: ESCAPED, over a photograph of you that was not your best day. Betty has it pinned up behind the counter, people say, next to the specials.',
      opts: [
        { t: 'Grow a beard', show: (L) => L.s.sex === 'm' && L.s.look && !L.s.look.beard, run(L) { L.s.look.beard = true; L.warm(-10); return 'It comes in grey at the sides, which you had not expected, and makes you look like somebody’s uncle, which is the idea.'; } },
        { t: 'Change your hair', cost: 20, run(L) { if (L.s.look) L.s.look.hair = ((L.s.look.hair || 0) + 3) % 9; L.warm(-8); return 'A packet of dye from the chemist in Kettleby and an afternoon over a sink. You do not recognise yourself, which is the idea, and is also unsettling.'; } },
        { t: 'Brazen it out', check: ['charm', 55], run(L, x, win) { if (win) { L.warm(-12); return 'You walk into Betty’s and order a tea, under your own photograph. Betty looks at you, and at the photograph, and says, “Milk, love?”'; } L.warm(15); return 'A woman in the queue at the post office looks at you, and at the Gazette, and at you, and goes very quietly to the telephone.'; } },
      ],
    },
    {
      id: 'g2Lam2', icon: '📮', title: (L) => `${L.g2MateName(G(L).run.mate) || 'Your partner'} from the wall`, ok: (L) => !!L.s.run && !!L.s.gaol2.run && !!L.s.gaol2.run.mate,
      text: (L) => { const R = G(L).run, n = L.g2MateName(R.mate); return R.mateEnd === 'caught' ? `They have picked up ${n} in a bus shelter in Kettleby, the Gazette says, “tired and hungry and asking for a cup of tea”.` : R.mateEnd === 'spain' ? `A postcard, no name on it, from a place in Spain with a lot of vowels. A picture of a donkey, and on the back: “Wish you were here. Glad you are not.” It is ${n}’s handwriting.` : `${n} turns up at dusk, thinner, in somebody else’s coat, wanting money. “Just to get across the water,” he says. “I would do the same for you.”`; },
      opts: [
        { t: 'Hope he keeps his mouth shut', show: (L) => G(L).run.mateEnd === 'caught', run(L) { const R = G(L).run, bond = R.mate && L.s.gaol2.folk[R.mate] ? L.s.gaol2.folk[R.mate].v : L.s.heists && L.s.heists.lag.mates[R.mate] ? L.s.heists.lag.mates[R.mate].bond : 30; if (L.chance(clampN(0.35 + bond / 100, 0.2, 0.95))) return 'He does. Not a word, for three days, to anybody. You owe him, and you know it.'; L.warm(25); R.hid = null; return 'He does not. By the end of the week they know where you have been sleeping, and you are sleeping somewhere else, if you are sleeping.'; } },
        { t: 'Keep the postcard', show: (L) => G(L).run.mateEnd === 'spain', run(L) { L.joy(3); return 'You keep it in your wallet. On the bad nights, you look at the donkey.'; } },
        { t: 'Give him what you can', show: (L) => G(L).run.mateEnd === 'back', cost: 400, run(L) { L.karma(2); L.joy(2); return 'Four hundred dollars, and your second-best coat. He goes off into the dark towards the harbour. You never hear from him again, which is good news, probably.'; } },
        { t: 'Send him away', show: (L) => G(L).run.mateEnd === 'back', run(L) { if (L.chance(0.3)) { L.warm(15); return 'He goes, swearing. Two days later there are police at both ends of your street. You do not think it is a coincidence.'; } return 'He goes, swearing. You do not sleep well, for a while.'; } },
      ],
    },
    {
      id: 'g2Lam3', icon: '🏠', title: 'Home', ok: (L) => !!L.s.run && !!L.s.gaol2.run,
      text: (L) => { const k = L.kids().find((c) => c.age < 18), pt = L.partner(); return k ? `It is in the paper, and ${first(k)} is getting it at school. ${pt ? `${first(pt)} says so on the telephone, in a voice you have not heard before.` : 'A neighbour tells you, in the street, as if it were your fault, which it is.'}` : `${first(pt)} says it on the telephone, very quietly: “I cannot do this any more. The police are round every week. Either come home properly, or do not come home.”`; },
      opts: [
        { t: 'Hand yourself in', run(L) { const s = L.s, n = Math.max(1, s.run.owe - 2); s.run = null; L.s.gaol2.run = null; const pt = L.partner(); if (pt) L.bond(pt, 10); L.karma(3); L.queue('inside', { n }); return `You walk into the police station on a Tuesday, and put your hands on the desk. Sergeant Pascoe looks at you over his glasses. “Well,” he says. “That saves us all a lot of bother.” ${n} season${n === 1 ? '' : 's'}, less than it would have been.`; } },
        { t: 'Stay out', run(L) { const pt = L.partner(); if (pt) L.bond(pt, -8); for (const k of L.kids()) L.bond(k, -4); L.joy(-4); return 'You stay out. You tell yourself it is for them. You are not sure, any more, who you are telling.'; } },
      ],
    },
  ];
}
