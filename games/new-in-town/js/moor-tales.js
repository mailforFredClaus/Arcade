// New in Town: the moor's cards. The Askwiths' story in five chapters,
// Fennick and its bells, the quarry, the Curlew Award's expeditions, Tom
// Windle's war over the old drove road, and the moor being the moor: a lost
// walker, a body in the bog, a heather fire, a comet, midsummer at the
// Gossips, courting on Raven Edge. The rules that send for them are in
// moor.js, which hands this file what it needs.

export function moorTales({ clamp, money, AWARD, QUARRY_RANKS, moorMeans, r100 }) {
  const m_ = (L) => L.s.moor;
  const h_ = (L) => L.s.moor.hall;
  const free = (L) => !L.s.gaol && !L.s.dead;
  const first = (p) => p.name.split(' ')[0];
  const he = (p) => (p.sex === 'm' ? 'he' : 'she');
  const He = (p) => (p.sex === 'm' ? 'He' : 'She');
  const his = (p) => (p.sex === 'm' ? 'his' : 'her');
  const him = (p) => (p.sex === 'm' ? 'him' : 'her');
  // A card's other wordings, chosen by the season and how often it has been seen (not by the dice).
  const byTurn = (L, id, l) => l[((L.s.seen[id] || 0) + L.s.t) % l.length];
  // Tom Windle, if you know him (folk.js), and a change in how he takes to you.
  const tom = (L) => !!(L.s.folk && L.folk && L.folk('windle').met != null);
  const warmTom = (L, d) => { if (tom(L) && L.folkWarm) L.folkWarm('windle', d); };
  const busy = (L, n) => { L.s.time = Math.max(0, L.s.time - n); };
  // On the moor last season (the cards come at the turn of the season, when the clock has moved on).
  const wasUp = (L) => L.s.moor.up >= L.s.t - 1;
  // A chapter of the Askwiths' story is done.
  const chapter = (L, n, fav) => { const h = h_(L); h.ch = Math.max(h.ch, n); h.at = L.s.t; if (fav) L.moorFavour(fav); };
  // Who the Curlew card is about.
  const awardee = (L, key) => L.moorAwardWho().find((w) => w.key === key) || null;

  return [
    // ---- the Askwiths ----
    {
      id: 'moorHall1', icon: '🪣', title: 'Buckets in the long gallery', w: 0,
      ok: (L) => free(L) && h_(L).ch === 0,
      text: 'Kit Askwith, in a wax jacket over what may be pyjamas, catches you looking up at the ceiling of the long gallery, where a brown stain the shape of Africa is dripping into a tin bath. “Grab a bucket,” she says. “You look like somebody who can carry a bucket.”',
      opts: [
        { t: 'Grab a bucket', run(L) { chapter(L, 1, 4); L.gain('craft', 1); L.joy(3); return 'An afternoon of buckets, then up into the roof with a torch to find where it comes in. Afterwards she gives you tea in the kitchen with the dogs, which is where the Askwiths actually live. The rest of the house is for visitors and weather.'; } },
        { t: 'Tell her what she ought to do with the old stables', check: ['charm', 35], run(L, x, win) { const h = h_(L); chapter(L, 1, win ? 6 : 2); if (win) { h.tea = L.s.t; return 'A tea room, you say, and a shop, and weddings on the lawn. She writes it on the back of her hand, then on the other hand. By the spring there are scones in the stables and a queue for them.'; } return 'She listens, nods, and says they tried a tea room in 1987 and the scones caught fire. She still lets you carry a bucket.'; } },
        { t: 'Say you are only visiting', run(L) { chapter(L, 1, 1); return '“Quite right,” says Kit. “Nobody sane would do more.” She waves you off from the steps, a bucket in each hand.'; } },
      ],
    },
    {
      id: 'moorHall2', icon: '🫖', title: 'Tea with the dowager', w: 0,
      ok: (L) => free(L) && h_(L).ch === 1,
      text: 'Lady Honoria Askwith, who is eighty-eight, receives you in the morning room with a pot of tea, a plate of very hard biscuits and a game of patience at which she is quite openly cheating. “Kit says you are useful,” she says. “Sit down and be useful at me.”',
      opts: [
        { t: 'Tell her she is cheating', run(L) { chapter(L, 2, 6); h_(L).lady = 1; return 'She looks at you over her glasses for a long time. “Everybody else lets me,” she says. “How very refreshing.” She deals you in, cheats at that too, and tells you there is a painting in the long gallery that is not what it seems, and that you are not to ask her which.'; } },
        { t: 'Let her win', run(L) { chapter(L, 2, 3); h_(L).lady = 1; return 'She wins, and knows that you know, and you are both extremely pleased with yourselves. She asks you back on Thursday.'; } },
        { t: 'Ask her about the portraits', check: ['smarts', 35], run(L, x, win) { chapter(L, 2, win ? 5 : 2); h_(L).lady = 1; if (win) { L.gain('smarts', 1); return 'She takes you round them one by one: the one who lost the family fortune at cards, the one who won it back at cards, the one who ran off with the curate. “And that one,” she says, at the Lady in Grey, and stops, and changes the subject.'; } return 'She tells you their names, and their sins, so fast you remember none of either. “No matter,” she says. “Nobody does. That is what portraits are for.”'; } },
      ],
    },
    {
      id: 'moorHall3', icon: '🖼️', title: 'The Lady in Grey', w: 0,
      ok: (L) => free(L) && h_(L).ch === 2,
      text: (L) => `Kit takes you into the long gallery after the visitors have gone and stands you in front of the Lady in Grey, the painting on every postcard of Haverleigh. “It’s a copy,” she says. “Granny sold the real one in 1974 to pay the death duties, and had this done by a man in Bristol. The insurers don’t know. The public don’t know. And there’s a journalist from the city asking questions.”${L.s.moor.drown.on != null ? ' “And you can look at the family papers, if you’re still asking about Fennick. I know you are. Everybody does.”' : ''}`,
      opts: [
        { t: 'Keep the family’s secret', run(L) { const h = h_(L); h.gallery = 'kept'; chapter(L, 3, 8); L.karma(-1); return 'You say nothing to anybody. The journalist goes back to the city with a story about scones. Kit squeezes your arm in the gallery as you pass, every time, for years.'; } },
        { t: 'Help Kit tell it herself, before he does', check: ['charm', 45], run(L, x, win) { const h = h_(L); h.gallery = 'told'; chapter(L, 3, win ? 10 : 4); L.karma(2); if (win) return 'You sit up with her writing it, and the Gazette prints it in her words: a family, a tax bill and a good copy. The visitors come in their hundreds to see the fake, and buy a postcard of it.'; return 'She tells it, and it comes out badly anyway: FAKE AT THE HALL, on the front page. It blows over by the summer. Kit says she would rather have told it than been caught, and means it.'; } },
        { t: 'Tell the journalist yourself', run(L) { const h = h_(L); h.gallery = 'press'; h.f = 0; chapter(L, 3, 0); L.cash(500); L.fame(1); L.karma(-5); L.note('Told the papers about the painting at Haverleigh Hall. The Askwiths have not spoken to you since.', 'big'); return 'The city paper pays you $500 and spells your name wrong. Kit does not speak to you again. When you pass the Hall, the gates are shut.'; } },
      ],
    },
    {
      id: 'moorHall4', icon: '🕯️', title: 'The dowager’s last summer', w: 0,
      ok: (L) => free(L) && h_(L).ch === 3 && h_(L).gallery !== 'press',
      text: 'Lady Honoria died in her chair in the morning room, with the patience laid out in front of her and, Kit swears, coming out. In her will she has left you her pack of cards and a note in a shaky hand: “Keep an eye on Kit. She will not ask.” Her grandson Hugo has come up from London for the funeral, and is already on the telephone to a hotel group.',
      opts: [
        { t: 'Take the steward’s post Kit offers you', show: (L) => L.s.age < 66 && L.s.moor.hall.steward == null, run(L) { const h = h_(L); h.lady = 2; h.hugo = 1; h.steward = L.s.t; chapter(L, 4, 6); L.joy(4); L.note('Became steward of the Haverleigh estate.', 'big'); return `After the funeral Kit asks if you would be steward of the estate: the rents, the woods, the walls and the arguments. A wage of ${money(1200)} a season, and a day of your time each season, and a key to the estate office she forgets to take back.`; } },
        { t: 'Offer Kit whatever help she needs', run(L) { const h = h_(L); h.lady = 2; h.hugo = 1; chapter(L, 4, 6); L.karma(2); return 'You stand at the back of the church in Moor End, and afterwards in the kitchen, washing up for two hundred. Kit dries. Neither of you says much. It is the right amount.'; } },
        { t: 'Go to the funeral, and leave it there', run(L) { const h = h_(L); h.lady = 2; h.hugo = 1; chapter(L, 4, 2); return 'A fine funeral, with the patience cards on the coffin. You sign the book and go home. Kit writes, a week later, to say thank you for coming, and that she has started cheating at patience herself.'; } },
      ],
    },
    {
      id: 'moorHall5', icon: '🏰', title: 'The future of Haverleigh', w: 0,
      ok: (L) => free(L) && h_(L).ch === 4 && h_(L).end == null,
      text: (L) => `Hugo’s debts have come due. He means to sell his half of Haverleigh to the Larchmont Hotel Group, who would put a spa in the stables and a helipad on the lawn. Kit has until the end of the year to find another way, and is out on the terrace in the dark, smoking, which she gave up in 1999.${h_(L).loan ? ' Hugo has not mentioned the money he owes you. Nor has Kit, though she knows.' : ''}`,
      opts: [
        { t: (L) => `Buy Hugo out yourself (${money(L.moorShareCost())})`, cost: (L) => L.moorShareCost(), show: (L) => moorMeans(L) >= L.moorShareCost() * 0.8, run(L) { const h = h_(L); h.share = L.moorShareCost(); h.end = 'share'; chapter(L, 5, 10); L.karma(3); L.joy(10); L.note('Bought a half share in Haverleigh Hall, and kept it from the hotel men.', 'big'); return 'You and Kit sign in the estate office with Hugo’s fountain pen, which he leaves behind. You own half a stately home: a share of the gate money and the weddings, a vote on the roof, and a peacock that now technically belongs to you, and does not accept it.'; } },
        { t: 'Lead a public appeal, and put the Hall in trust', odds: (L) => clamp(0.3 + (L.s.st.charm - 45) / 90 + (h_(L).tea != null ? 0.12 : 0) + (h_(L).gallery === 'told' ? 0.06 : 0) + L.s.fame / 300, 0.12, 0.88), run(L, x, win) { const h = h_(L); busy(L, 1); if (win) { h.end = 'trust'; chapter(L, 5, 8); L.karma(5); L.fame(1); L.joy(8); L.note('Led the appeal that put Haverleigh Hall in trust for the public.', 'big'); return 'Coffee mornings, a sponsored walk round the Gossips, a concert in the great hall and a letter in every paper. The money is found, Hugo is paid, and the Hall goes into a trust with you and Kit on its board. Nobody is getting a helipad.'; } h.end = 'hotel'; chapter(L, 5, 3); return 'The appeal raises half of it, which is a great deal and not enough. Hugo sells. Kit stays on as manager for the hotel people, in her own house, and says it could have been worse, and on bad days that it could not.'; } },
        { t: 'It is the family’s business, not yours', run(L) { const h = h_(L); h.end = 'hotel'; chapter(L, 5, 0); return 'The Larchmont Hotel Group put a spa in the stables. Kit moves into the lodge at the gate with the dogs. The gardens stay open to the public, at twice the price, and she still waves when you pass.'; } },
      ],
    },
    {
      id: 'moorSyndicate', icon: '🥃', title: 'In the gun room', w: 2, cd: 16,
      when: (L) => free(L) && h_(L).synd != null,
      ctx: (L) => (h_(L).end == null && !h_(L).loan && h_(L).ch >= 1 && L.chance(0.5) ? 'loan' : 'dinner'),
      text: (L, x) => (x === 'loan' ? `Hugo Askwith takes you aside in the gun room after the last drive, pours you a whisky the size of a vase, and asks, very charmingly, whether you could see your way to lending him ${money(Math.max(2000, r100(moorMeans(L) * 0.02)))}. Just until the quarter. It is a matter of honour, he says, and a horse.`
        : byTurn(L, 'moorSyndicate', ['The syndicate dinner, black tie, in the great hall at Haverleigh: twenty guns, a judge, a bishop, a man who owns half of Kettleby and a great deal of claret.', 'The end-of-season dinner in the great hall, with the game pie and the keeper’s speech, which is the same speech every year and none the worse for it.', 'A shoot lunch in the old dairy, the guns in their stockinged feet, and somebody’s Labrador under every chair.'])),
      opts: [
        { t: (L, x) => (x === 'loan' ? `Lend it to him` : 'Go, and enjoy it'), cost: (L, x) => (x === 'loan' ? Math.max(2000, r100(moorMeans(L) * 0.02)) : 120), run(L, x) { const h = h_(L); if (x === 'loan') { h.loan = { n: Math.max(2000, r100(moorMeans(L) * 0.02)), due: L.s.t + 4 }; L.moorFavour(1); return 'He writes you an IOU on the back of a game card, with a flourish, and kisses it.'; } L.joy(5); L.gain('charm', 1); const p = L.maybeMeet(0.25); return p ? `You sit next to ${p.name}, who turns out to be good company and bad at claret.` : 'You laugh at the judge’s jokes and the bishop laughs at yours. Home at two.'; } },
        { t: (L, x) => (x === 'loan' ? 'Say no, nicely' : 'Send your apologies'), run(L, x) { return x === 'loan' ? '“Quite right,” says Hugo, without a flicker. “Never lend money to an Askwith. Granny said so.” He borrows it from the colonel instead.' : 'You stay home in your slippers. The keeper says you were missed, which you doubt, and the soup was cold, which you believe.'; } },
      ],
    },

    // ---- Fennick ----
    {
      id: 'moorNance', icon: '🗃️', title: 'Nance’s shoebox', w: 0,
      ok: (L) => free(L) && !L.moorHasClue('nance') && L.s.moor.drown.end == null,
      text: (L) => `${L.moorHasClue('spire') ? '“You’ve been down to Fennick,” says Nance Dyer, the moment you come into the post office. “Then you’d better see these.”' : 'Nance Dyer locks the post office door behind you and turns the sign to CLOSED.'} She puts a shoebox on the counter. Photographs: a street of stone cottages, a church with a spire, and a girl of nineteen laughing on a gate. “Fennick,” she says. “Under the water. That’s my great-aunt Agnes. She wouldn’t leave when they flooded it, and they say the water took her. And nobody ever found the bells.”`,
      opts: [
        { t: 'Ask her to tell you all of it', run(L) { L.moorClue('nance'); L.moorWarm('nance', 6); return 'She talks for two hours, while somebody knocks on the door and goes away again. The dam, the new houses at Moor End, the vicar who cried, and Agnes, who said she would go when the bells went, and then there were no bells.'; } },
        { t: 'Promise to find out what happened', run(L) { L.moorClue('nance'); L.moorWarm('nance', 9); L.karma(1); return 'She holds your hand across the counter for a moment, then lets go and sells you a stamp, briskly, because a customer has come in.'; } },
        { t: 'Say it is a sad story, and leave it there', run(L) { L.s.moor.f.nanceNo = L.s.t; return 'She puts the lid back on the box and the box back under the counter. “It is,” she says. “It is a sad story.”'; } },
      ],
    },
    {
      id: 'moorLetter', icon: '✉️', title: 'A letter from Manitoba', w: 0,
      ok: (L) => free(L) && !L.moorHasClue('letter') && L.s.moor.drown.end == null,
      text: 'Nance Dyer comes running out of the post office as you pass, waving an airmail envelope. It is addressed to “Whoever is asking about Fennick, care of the Post Office, Moor End, England”, and it has taken a month. Inside, in a round hand: “My grandmother was Agnes Dyer. She did not drown.”',
      opts: [
        { t: 'Read it with Nance, at the counter', run(L) { L.moorClue('letter'); L.moorWarm('nance', 8); L.joy(5); return 'Agnes married Edmund Askwith in secret in the spring of 1938. They took the bells down with half the village, hid them, and left for Canada the night the water came, and let everybody think the water had her rather than be followed. Nance has to sit down on the parcel scales.'; } },
        { t: 'Write back, four pages', run(L) { L.moorClue('letter'); L.moorWarm('nance', 4); L.karma(1); L.gain('charm', 0.6); return 'You write about Fennick, and the water, and Nance, and the bells nobody found. A month later a parcel comes: a photograph of an old woman on a porch in the snow, laughing exactly like the girl on the gate.'; } },
      ],
    },
    {
      id: 'moorBells', icon: '🔔', title: 'The bells of Fennick', w: 0,
      ok: (L) => free(L) && L.s.moor.drown.end == null,
      text: 'Forty yards into the old drift, past a rusted tub and a roof fall, Dot’s lamp finds a tarpaulin gone stiff with eighty years. Under it, packed in straw and sacking, side by side like sleepers: eight bells, green with age, with the name of St Oda’s round the shoulder of each. Dot sits down on a rail and says nothing at all, which is a first.',
      opts: [
        { t: (L) => `Pay to have them hung at Moor End (${money(L.moorBellsCost())})`, cost: (L) => L.moorBellsCost(), run(L) { return bellsHome(L, 'paid'); } },
        { t: 'Lead the village appeal to hang them at Moor End', check: ['charm', 40], run(L, x, win) { if (win) return bellsHome(L, 'appeal'); const d = L.s.moor.drown; d.end = 'brigid'; L.karma(3); L.joy(5); L.note('Found the lost bells of Fennick. They hang at St Brigid’s now.', 'big'); return 'The appeal falls short of a tower, so the Reverend Hollis offers St Brigid’s, which has the frame and the ringers. The bells of Fennick ring out over the bay on Easter morning, and you and Nance stand in the churchyard and hold on to each other.'; } },
        { t: 'Give them to St Brigid’s', run(L) { const d = L.s.moor.drown; d.end = 'brigid'; L.karma(4); L.joy(L.soulHas && L.soulHas('churchgoer') ? 9 : 5); L.note('Found the lost bells of Fennick, and gave them to St Brigid’s.', 'big'); return 'The Reverend Hollis comes up in the church minibus and weeps all the way back down with eight bells in the back. They ring at St Brigid’s on Easter morning, and the whole of Moor End comes down to hear them.'; } },
        { t: 'Sell them to a dealer in church bells', run(L) { const d = L.s.moor.drown, n = 36000; d.end = 'sold'; L.cash(n); L.karma(-8); L.s.moor.folk.nance = Math.max(0, L.s.moor.folk.nance - 40); L.note('Found the lost bells of Fennick, and sold them.', 'big'); return `A man in a Bentley takes them away to somewhere in Surrey and pays ${money(n)}. Nance Dyer serves you in the post office after that, because she has to, and says nothing else, ever.`; } },
      ],
    },

    // ---- the quarry ----
    {
      id: 'moorRankUp', icon: '⛏️', title: (L) => `Blackrake: ${QUARRY_RANKS[L.s.moor.quarry.rank + 1] || 'Foreman'}`, w: 0,
      ok: (L) => free(L) && !!L.moorQuarryNext() && L.moorQuarryNext().ok,
      text: (L) => [
        '',
        'Dot Henshaw watches you work all morning, which she has never done, then walks you up to the drill rig. “You’ve got the hands for it,” she says. “And the ears, for now. Want to learn?”',
        'Dot puts a form on the hut table, weighted with a budgie seed tin: the shotfirer’s ticket. A week’s course in the city, an exam, and then you set the charges. “Pays better,” she says. “And if you get it wrong, you won’t have to worry about the pay.”',
        'Dot is retiring, to her budgerigars and a caravan by the sea. She has told the owners who should run Blackrake after her. “You,” she says, in case you had not followed. “Don’t make me regret it.”',
      ][L.s.moor.quarry.rank + 1] || '',
      opts: [
        { t: `Sit the ticket (${money(400)})`, show: (L) => L.s.moor.quarry.rank === 1, cost: 400, check: ['smarts', 30], run(L, x, win) { return rankUp(L, win); } },
        { t: 'Say yes', show: (L) => L.s.moor.quarry.rank !== 1, run(L) { return rankUp(L, true); } },
        { t: 'Not yet', run(L) { L.s.moor.quarry.ask = L.s.t; return '“Suit yourself,” says Dot. “Offer stands.” She goes back to shouting at a dumper truck.'; } },
      ],
    },

    // ---- the Curlew Award ----
    {
      id: 'moorExped', icon: '🧭', title: (L, x) => { const a = L.s.moor.award[x]; return `The ${AWARD[a ? Math.min(2, a.lvl) : 0].name.toLowerCase()} Curlew expedition`; }, w: 0,
      ok: (L, x) => free(L) && !!awardee(L, x) && !!L.s.moor.award[x] && L.s.moor.award[x].out != null && L.s.moor.award[x].lvl < 3,
      text: (L, x) => {
        const w = awardee(L, x), lv = AWARD[L.s.moor.award[x].lvl];
        if (w.me) return `The ${lv.name.toLowerCase()} Curlew expedition: ${lv.route}. You set off from Curlew Camp at seven in the morning with a rucksack that weighs more than you do and a map in a plastic bag.`;
        return `${w.name} sets off from Curlew Camp at seven in the morning for the ${lv.name.toLowerCase()} Curlew expedition: ${lv.route}. ${He(w.p)} has packed and repacked the rucksack four times and will not let you check it.`;
      },
      opts: [
        { t: 'Navigate carefully, by map and compass', show: (L, x) => x === 'me', check: ['smarts', 30], run(L, x, win) { return exped(L, x, win, win ? 'You hit every checkpoint, by compass in the mist, and walk into camp on the last day to a cheer from the assessors.' : 'You end the second day at the wrong trig point, in the wrong valley, very calmly. The assessors are kind. Next year.'); } },
        { t: 'Push on hard, to beat the weather', show: (L, x) => x === 'me', check: ['fitness', 32], run(L, x, win) { return exped(L, x, win, win ? 'You outwalk the rain three days running and come in sunburnt, with blisters on your blisters.' : 'You push on, and the weather pushes back, and you are fetched off Black Moss in a Land Rover. Next year.'); } },
        { t: 'Wave them off, and wait by the phone', show: (L, x) => x !== 'me', odds: (L, x) => expOdds(L, x, 0), run(L, x, win) { const w = awardee(L, x); return exped(L, x, win, win ? `Four phone calls, all of them short. ${w.name} walks into camp on the last day filthy and unbearable with pride.` : `${w.name} comes back a day early, soaked and furious, with a tent that is now two tents. Next year, ${he(w.p)} says, through ${his(w.p)} teeth.`); } },
        { t: 'Follow at a distance, just in case', show: (L, x) => x !== 'me', odds: (L, x) => expOdds(L, x, 0.12), run(L, x, win) { const w = awardee(L, x), seen = L.chance(0.5); if (seen && w.p) L.bond(w.p, -6); return exped(L, x, win, `${win ? `${w.name} makes it, every checkpoint.` : `${w.name} does not make it this year.`} ${seen ? `${He(w.p)} saw you behind a wall on the second day, and has not forgiven you.` : 'You were never seen. You think.'}`); } },
        { t: 'Pack an extra flapjack, and a note', show: (L, x) => x !== 'me', odds: (L, x) => expOdds(L, x, 0.05), run(L, x, win) { const w = awardee(L, x); if (w.p) L.bond(w.p, 3); return exped(L, x, win, win ? `${w.name} makes it, and keeps the note in ${his(w.p)} wallet for years. You find out much later.` : `${w.name} turns back on the second day, a friend having turned an ankle, which was the right thing. The flapjack is eaten on the bus. Next year.`); } },
      ],
    },

    // ---- Tom Windle's drove road ----
    {
      id: 'moorDrove1', icon: '🐄', title: 'The old drove road', w: 3, once: true,
      when: (L) => free(L) && L.moorWalksDone() >= 2 && L.s.age < 80,
      text: (L) => `The Moor End Ramblers want the old drove road opened again. It runs from Moor End down through Tom Windle’s top fields to the town, and was walked by cattle for three hundred years before anybody thought to ask Tom. Tom has put a bull in the top field, which he says is a coincidence. ${tom(L) ? '“You’re a walker,” he says, catching you on the moor road. He says it like a charge sheet.' : 'Both sides want your name on a petition.'}${L.s.folk && L.folk && L.folk('windle').stage >= 1 ? ' He has the 1952 map in his coat, and shows it to everybody.' : ''}`,
      opts: [
        { t: 'Sign the Ramblers’ petition', run(L) { const d = L.s.moor.drove; d.side = 'ramblers'; d.due = L.s.t + 4; warmTom(L, -6); L.karma(1); return 'Your name goes on the petition at the post office, under Nance’s and above a man who has signed it as Wordsworth. Tom finds out by teatime. The bull is moved nearer the gate.'; } },
        { t: 'Stand with Tom', run(L) { const d = L.s.moor.drove; d.side = 'tom'; d.due = L.s.t + 4; warmTom(L, 6); return 'You sign Tom’s petition, which says CERTAINLY NOT at the top in capitals. The Ramblers look at you in the Drovers as if you had kicked a dog.'; } },
        { t: 'Find a way round: a path along the wall, not across his fields', check: ['charm', 45], run(L, x, win) { const d = L.s.moor.drove; if (win) { d.side = 'deal'; d.due = L.s.t + 4; warmTom(L, 4); L.karma(2); return 'You walk it with both sides: along the wall, round the bull, down by the beck. Tom grunts. The Ramblers chairman grunts. It goes to the inquiry as an agreed route, which nobody has ever heard of.'; } d.side = 'none'; return 'You try. By the end of the meeting both sides think you are with the other, and the bull is still there.'; } },
      ],
    },
    {
      id: 'moorDrove2', icon: '⚖️', title: 'The drove road inquiry', w: 0,
      ok: (L) => free(L) && ['ramblers', 'tom', 'deal'].includes(L.s.moor.drove.side),
      text: (L) => `The inquiry into the old drove road is held in the Drovers, the only room big enough, with the inspector at the dartboard end and Tom Windle in the front row with his arms folded. ${L.s.moor.drove.side === 'deal' ? 'Your path along the wall is on an easel, in felt tip.' : 'Both sides have brought maps, and one side has brought a bull, in a photograph.'}`,
      opts: [
        { t: 'Speak at the inquiry', check: ['charm', 40], run(L, x, win) { return drove(L, win); } },
        { t: 'Sit at the back and let them get on with it', run(L) { return drove(L, L.chance(0.45)); } },
      ],
    },

    // ---- the moor being the moor ----
    {
      id: 'moorLost', icon: '🔦', title: 'Somebody lost on the moor', w: 3, cd: 12,
      when: (L) => free(L) && wasUp(L) && ['fog', 'snow', 'wet', 'storm'].includes(L.s.wx) && L.s.age < 78,
      text: (L) => byTurn(L, 'moorLost', [
        'Coming back off the moor at dusk in the murk you nearly walk into a girl of fifteen sitting on a wall in a Curlew Award cagoule, crying. She has lost her group, her map and one boot, and is very cold.',
        'A man in city shoes is standing in the heather, holding up his phone to the sky as if offering it to the gods. He has been following it for three hours. It has led him to the middle of Black Moss and gone dead.',
        'An elderly rambler is sitting by the path below Raven Edge with a twisted ankle and a flask, very cheerful and very blue about the lips. “Lovely day for it,” she says. It is not.',
      ]),
      opts: [
        { t: 'Get them down off the moor yourself', check: ['fitness', 35], run(L, x, win) { L.s.moor.n.lostFound++; if (win) { L.karma(5); L.joy(5); L.gain('fitness', 0.8); const p = L.chance(0.4) && L.s.age >= 30 ? L.meet({ bond: 30 }) : null; return `You get them down to the Drovers by torchlight, half carrying them the last mile. The landlord puts them by the fire with a brandy.${p ? ` A month later a card comes, and then ${p.name} does, to say thank you properly, and you become friends.` : ''}`; } L.karma(3); L.hp(-6, 'the cold'); return 'The two of you are found by mountain rescue at midnight, sharing your coat behind a wall. They are very kind about it, and give you a leaflet.'; } },
        { t: 'Give them your coat, and go for help', run(L) { L.s.moor.n.lostFound++; L.karma(4); L.hp(-3, 'the cold'); return 'You run for the Drovers in your shirtsleeves. Mountain rescue are out in twenty minutes and back in an hour, with your coat and a very grateful stranger in it.'; } },
        { t: 'Ring mountain rescue', show: (L) => !!L.s.items.phone, run(L) { L.s.moor.n.lostFound++; L.karma(2); return 'One bar of signal, on top of a wall. You stay until the Land Rover comes bouncing over the heather with its blue light going.'; } },
        { t: 'Leave it to somebody better at this', run(L) { L.karma(-3); L.joy(-3); return 'You tell yourself somebody will come along. All the way home you listen to the radio for news, and there is none, and that does not help.'; } },
      ],
    },
    {
      id: 'moorBog', icon: '🖐️', title: 'Something in Black Moss', w: 0,
      ok: (L) => free(L) && !L.s.moor.f.bog,
      text: 'Halfway across Black Moss, where a peat cutter has taken a bite out of the bank, something is sticking out of the black wall: a hand, brown as an old boot, the fingernails still on it. Above it, round what was a neck, a bronze torc gleams in the wet.',
      opts: [
        { t: 'Ring the police, and wait with him', run(L) { const m = L.s.moor; m.f.bog = 'told'; L.karma(2); L.fame(1.5); L.joy(3); L.note('Found the Black Moss Man, two thousand years old, in the peat.', 'big'); return 'The police come in an hour, look, and send for the archaeologists, who come in a day. He is two thousand years old, with his last meal still in him: porridge and seeds. They call him the Black Moss Man. Your photograph is in the Gazette beside his, and he looks better than you do.'; } },
        { t: 'Ease the torc off, and go', run(L) { const m = L.s.moor; m.f.bog = 'torc'; L.cash(2500); L.karma(-8); L.s.heat = Math.min(100, (L.s.heat || 0) + 15); L.note('Took a bronze torc from a body in Black Moss.'); return 'It comes away in your hand, and a man in Mr Pym’s line of business, but not in Mr Pym’s shop, gives you $2,500 for it and no questions. When the Black Moss Man is found the next spring, the papers ask where his torc went. So do the police.'; } },
        { t: 'Walk on, and tell nobody', run(L) { L.s.moor.f.bog = 'left'; L.joy(-2); return 'You walk on. Somebody else finds him the next year. Every time you cross Black Moss after that, you walk a little faster.'; } },
      ],
    },
    {
      id: 'moorFire', icon: '🔥', title: 'The moor is alight', w: 0,
      ok: (L) => free(L) && L.moorFire(),
      text: (L) => byTurn(L, 'moorFire', [
        'A brown smear of smoke over the moor, and then you can smell it in the town: the heather is alight above Hollowell Wood, and the wind is taking it towards the trees. They want everybody who can hold a beater.',
        'Somebody’s disposable barbecue, the Gazette will say. The heather between the Gossips and the wood is burning in a long red line, crackling like a fire in a grate the size of a county.',
        'The moor is burning again, a black scar spreading on the hill and the fire engines nose to tail on the moor road. Dot Henshaw has brought the quarry’s water bowser and is directing the fire brigade, who are letting her.',
      ]),
      opts: [
        { t: 'Grab a beater and help', check: ['fitness', 40], run(L, x, win) { busy(L, 1); if (win) { L.karma(4); L.joy(4); L.gain('fitness', 1); return 'Twelve hours in a line of beaters, smacking out the flames, black to the eyebrows. By dark it is out, short of the wood. The fire officer shakes your hand and leaves soot on it.'; } L.karma(2); L.hp(-8, 'smoke'); return 'You beat for an hour before the smoke gets into you, and they send you down to the ambulance, coughing like a sea lion. It is out by dark, no thanks to your lungs.'; } },
        { t: 'Keep well clear, and ring it in', run(L) { L.karma(1); return 'They know already, but thank you anyway. You watch from the hill road with half the town, the smoke going up like a slow tree.'; } },
        { t: 'Get photographs for the Gazette', run(L) { L.cash(60); L.fame(0.4); return 'The Gazette uses your picture on the front: the fire, the beaters, and a sheep in the foreground looking extremely put out. Sixty dollars.'; } },
      ],
    },
    {
      id: 'moorComet', icon: '☄️', title: 'A comet is coming', w: 0,
      ok: (L) => free(L),
      text: (L) => (L.moorMet('lamb') ? 'Dr Lamb’s letter to the Bulletin was right: the smudge was a comet, and it is coming in. By the autumn it will be the brightest thing in the sky after the moon, and then it will be gone for three thousand years. She is beside herself, in a quiet way, and has had her hair done.' : 'The Gazette has a comet on the front page: a smudge spotted from the Askwith Observatory on the moor, coming in. By the autumn it will be the brightest thing in the sky after the moon, and then gone for three thousand years.'),
      opts: [
        { t: 'Help Dr Lamb with the comet watch', show: (L) => L.moorMet('lamb') && L.moorStarsN() >= 5, run(L) { const m = L.s.moor; m.bulletin = true; busy(L, 1); L.gain('smarts', 2); L.fame(1); L.note('Helped Dr Lamb with the comet watch, and got a name in the Bulletin.', 'big'); return 'Three nights at the eyepiece, timing it against the stars with a stopwatch and a flask. Dr Lamb’s paper in the Bulletin has your name on it, second, in small type. You frame it.'; } },
        { t: 'Put it in the diary, in capitals', run(L) { L.joy(2); return 'You write COMET in the autumn, and underline it. The observatory on the moor is the place to see it, they say, through the big telescope.'; } },
      ],
    },
    {
      id: 'moorMidsummer', icon: '🌅', title: 'Midsummer at the Gossips', w: 0,
      ok: (L) => free(L) && L.season === 1,
      text: (L) => `${byTurn(L, 'moorMidsummer', ['Midsummer Eve at the Gossips. The Order of the Long Shadow are here in cloaks over their anoraks, a man is playing a fiddle not very well, somebody has brought a cool box, and the sun is going down exactly where Barnaby said it would, between the two tallest stones.', 'Midsummer again, and the Order again, in their cloaks and their walking boots. Barnaby has a new tape measure for the shadows and a new theory, which he explains to the sheep.', 'Midsummer Eve, and more people at the stones than ever: the Order, two coachloads from the city, a man selling crystals out of a van and a policeman watching him.'])} They mean to stay up for the dawn.${L.soulHas && L.soulHas('churchgoer') ? ' And at the same hour the Reverend Hollis holds her dawn service at St Brigid’s, as she does every year, in what she calls healthy competition.' : ''}`,
      opts: [
        { t: 'Stay up all night at the stones', run(L) { L.joy(8); L.hp(-1); L.moorWarm('barn', 5); return 'You sit up with the Order and the fiddle and a blanket. At four the sky goes green in the east, then gold, and the sun comes up through the gap between the stones like a coin into a slot. Nobody says anything at all. Then Barnaby cries, and so do you.'; } },
        { t: 'Go down for the vicar’s dawn service instead', show: (L) => !!(L.soulHas && L.soulHas('churchgoer')), run(L) { L.joy(6); L.karma(1); return 'The dawn service in the churchyard at St Brigid’s, the sun coming up over the bay and the vicar’s cassock blowing about. She is very pleased to see you, and says so, and asks with great care whether the stones were nice.'; } },
        { t: 'Bring your sweetheart, and a rug', show: (L) => !!L.partner(), run(L) { const p = L.partner(); L.bond(p, 8); L.joy(7); return `You and ${first(p)} under one rug in the lee of the king stone, the Order chanting politely at a distance. The sun comes up and ${he(p)} is asleep on your shoulder and misses it, and you do not mind at all.`; } },
        { t: 'Go home to bed', run(L) { L.hp(1); return 'You hear in the Drovers that the dawn was the finest in years. It always is, when you have gone to bed.'; } },
      ],
    },
    {
      id: 'moorCourt', icon: '💞', title: (L) => ['Bluebells', 'Raven Edge', 'The heather', 'By the fire at the Drovers'][L.season], w: 3, cd: 16,
      when: (L) => free(L) && !!L.partner() && L.s.moor.n.trips >= 2,
      ctx: (L) => (L.partner() ? L.partner().id : null),
      ok: (L, id) => !!L.partner() && L.partner().id === id,
      text: (L, id) => {
        const p = L.person(id);
        return [
          `Hollowell Wood is blue to the horizon with bluebells, and ${first(p)} has never seen it. You could take ${him(p)}, this week, before they go over.`,
          `A blue, still evening, and Raven Edge in the long light, with the whole moor laid out below and a skylark that will not stop. You could take ${first(p)} up there with a picnic, and nobody else for miles.`,
          `The heather is out on the moor, purple to the sky, and the bees in it so loud you can hear them from the road. ${first(p)} has been working too hard. You could take ${him(p)} up to the stones at dusk.`,
          `Snow on the moor and a fire in the Drovers, and a table in the corner by it that is somehow always free. ${first(p)} has had a long winter. You could drive ${him(p)} up for an evening.`,
        ][L.season];
      },
      opts: [
        { t: 'Take them', run(L, id) { const p = L.person(id); if (!p) return ''; busy(L, 1); L.bond(p, 8); L.joy(5); return [`You walk through the blue with ${first(p)}, not saying much, and ${he(p)} holds your hand the whole way without seeming to notice.`, `Sandwiches on the trig point, and ${first(p)} reading the map upside down on purpose. You stay until the light goes and walk down in the dusk, slowly.`, `The stones at dusk, the heather humming, and ${first(p)} telling you something ${he(p)} has never told anybody.`, `Two pints, a game of dominoes ${he(p)} wins unfairly, and the walk back to the car under a sky full of stars.`][L.season]; } },
        { t: 'Not this week', run(L, id) { const p = L.person(id); if (p) L.bond(p, -1); return 'There will be other weeks. There usually are.'; } },
      ],
    },
    {
      id: 'moorPitKid', icon: '🏊', title: 'The flooded pit', w: 3, cd: 20,
      when: (L) => free(L) && L.s.moor.n.trips >= 1 && L.kids().some((k) => k.age >= 13 && k.age <= 17),
      ctx: (L) => { const k = L.kids().filter((c) => c.age >= 13 && c.age <= 17); return k.length ? L.pick(k).id : null; },
      ok: (L, id) => !!L.person(id),
      text: (L, id) => { const p = L.person(id); return byTurn(L, 'moorPitKid', [`Dot Henshaw rings you from the quarry. ${first(p)} and three friends were swimming in the flooded pit at Blackrake this afternoon, the one with the signs round it, and one of them had to be pulled out. Everybody is fine. Dot is not.`, `${first(p)} comes home with wet hair on a dry day and a look you know from your own face, years ago. Somebody at school has been talking about the flooded pit at Blackrake, and how blue it is.`, `A note from school: a crowd of them were seen going over the quarry fence at Blackrake with towels. ${first(p)} was one of them. ${He(p)} says it is perfectly safe. It is not.`]); },
      opts: [
        { t: 'Ground them for a month', run(L, id) { const p = L.person(id); if (p) L.bond(p, -4); return 'A month of being looked at as if you were the warden of a prison camp. But nobody goes near the pit again, that you know of.'; } },
        { t: 'Sit them down and tell them about the cold, properly', check: ['charm', 35], run(L, id, win) { const p = L.person(id); if (p) L.bond(p, win ? 4 : -1); return win ? 'You tell them what cold water does to a heart and a pair of legs, plainly, without shouting. They go quiet, and then they ask questions. That is all you wanted.' : 'You tell them, and they roll their eyes so far you worry for them. You hope some of it went in.'; } },
        { t: 'Take them to swim at Fennick Water instead, where there is a lifeguard', show: (L) => L.season === 1 || L.season === 0, run(L, id) { const p = L.person(id); busy(L, 1); if (p) L.bond(p, 6); L.joy(4); return 'An afternoon at Fennick Water, all of you, the lifeguard on his tall chair and the water like glass. You race them to the buoy and lose, gloriously.'; } },
      ],
    },
    {
      id: 'moorSheep', icon: '🐑', title: 'A ewe on her back', w: 2, cd: 24,
      when: (L) => free(L) && L.s.moor.n.trips >= 2 && wasUp(L),
      text: (L) => byTurn(L, 'moorSheep', ['On the moor road there is a ewe on her back in the ditch, legs in the air, stuck, looking at the sky with an expression of deep surprise.', 'A sheep has got her head through the wire fence by the cattle grid to reach the grass on the other side, which is the same grass, and now cannot get it back.', 'A ewe stands in the middle of the moor road and will not move for anything: not you, not a tractor, not reason.']),
      opts: [
        { t: 'Sort her out', run(L) { L.karma(1); L.joy(2); return 'She gets up, staggers, and walks off without a word of thanks, as sheep do. Tom Windle would say you have made a friend for life. You have not.'; } },
        { t: 'Leave her to it', run(L) { L.karma(-1); return 'Somebody else will. Somebody usually does. You think about her for the rest of the day.'; } },
      ],
    },
    {
      id: 'moorWisp', icon: '🏮', title: 'A light on Black Moss', w: 2, cd: 24,
      when: (L) => free(L) && L.s.moor.n.trips >= 3 && wasUp(L) && L.s.wx === 'fog',
      text: (L) => byTurn(L, 'moorWisp', ['Crossing the moor at dusk in the fog, you see a light out on Black Moss, a little way off the causeway, bobbing, as if somebody were walking with a lantern. Somebody who is not on the causeway.', 'Fog again, and dusk, and the light again: out on the bog, steady this time, as if whoever carries it has stopped to wait for you.', 'A light on Black Moss, and then a second, and the two of them going along together, slowly, a little way off the causeway, where nobody could walk.']),
      opts: [
        { t: 'Follow it', check: ['smarts', 35], run(L, x, win) { if (win) { L.joy(3); L.gain('smarts', 0.6); return 'You follow it as far as the edge of the stones and no further, which is the clever part. It is marsh gas, Dr Lamb says later: a will-o’-the-wisp. It goes out as you watch, like somebody blowing out a candle.'; } L.hp(-4, 'the bog'); L.joy(-2); return 'You step off the causeway after it and the bog has you to the waist. You get out, without one boot. The light has gone. You walk home in one boot and do not tell anybody.'; } },
        { t: 'Stay on the causeway', run(L) { return 'It goes out. You walk on a little faster than you were.'; } },
      ],
    },
  ];

  // ---- what came of things ----

  // A step up at the quarry (or, for the shotfirer's ticket, not this year).
  function rankUp(L, win) {
    const q = L.s.moor.quarry;
    q.ask = L.s.t;
    if (!win) return 'You fail on the paperwork, not the explosives, which Dot says is the right way round. You can sit it again next year.';
    q.rank++;
    L.note(`Became ${QUARRY_RANKS[q.rank].toLowerCase()} at Blackrake Quarry.`, q.rank >= 3 ? 'big' : '');
    L.joy(5);
    return q.rank === 3 ? `You take the keys from Dot on her last day, and a budgerigar, which she says is on loan. Foreman: better pay for a day on the face, and ${money(500)} a season for keeping the place running.`
      : q.rank === 2 ? 'You pass. Your first shot brings down the face exactly where you said it would, and the whole quarry claps, ironically, and then not.'
        : 'You learn the drill, in both senses. The pay goes up and your hearing goes down.';
  }
  // The bells come home to Moor End.
  function bellsHome(L, how) {
    const d = L.s.moor.drown;
    d.end = 'moorend';
    L.karma(6); L.joy(12); L.fame(1.5); L.moorWarm('nance', 15);
    L.note('Found the lost bells of Fennick, and saw them rung again at Moor End.', 'big');
    return `${how === 'appeal' ? 'Jam jars on every counter, a sponsored walk and a concert in the Drovers, and the village raises it in a year.' : 'You pay, and do not say so.'} The bells of St Oda’s are hung in the chapel tower at Moor End, and on the anniversary of the flood they ring out across Fennick Water for the first time in eighty years. Nance stands by the shore with the shoebox under her arm${d.clues.letter != null ? ', and beside her a woman from Manitoba with Agnes’s laugh' : ''}.`;
  }
  // An expedition, passed or not.
  function exped(L, key, win, said) {
    const a = L.s.moor.award[key], w = awardee(L, key);
    if (!a) return said;
    a.out = null;
    if (!win) { a.tr = Math.max(0, AWARD[a.lvl].train - 1); return said; }
    const lv = AWARD[a.lvl];
    a.lvl++; a.tr = 0;
    if (w && w.p) { L.bond(w.p, 6); if (w.p.st) { w.p.st.fitness = Math.min(100, w.p.st.fitness + 3); w.p.st.smarts = Math.min(100, w.p.st.smarts + 2); } }
    else { L.gain('fitness', 1.5); L.gain('smarts', 1); }
    L.joy(w && w.me ? 6 : 8);
    const who = !w || w.me ? 'Won' : `${w.name} won`;
    L.note(`${who} the ${lv.name.toLowerCase()} Curlew Award.`, a.lvl >= 3 ? 'big' : '');
    L.say(lv.icon, `${!w || w.me ? 'You' : w.name}: the ${lv.name.toLowerCase()} Curlew Award`, 'good');
    return `${said} ${lv.icon} ${lv.name}${a.lvl < 3 ? `: ${AWARD[a.lvl].name.toLowerCase()} next, if ${!w || w.me ? 'you want it' : `${w.p ? he(w.p) : 'they'} want${w.p ? 's' : ''} it`}.` : ', the top of it. There is a badge, a handshake from somebody important, and a photograph on the wall at the camp.'}`;
  }
  // A child's odds on an expedition: their Fitness and Smarts, and the level.
  function expOdds(L, key, plus) {
    const w = awardee(L, key), a = L.s.moor.award[key];
    if (!w || !a) return 0.5;
    const st = w.p && w.p.st ? w.p.st : { fitness: 30, smarts: 30 };
    return clamp(0.42 + (st.fitness + st.smarts) / 400 - a.lvl * 0.07 + plus, 0.15, 0.92);
  }
  // How the drove road inquiry went: for your side, or not.
  function drove(L, win) {
    const d = L.s.moor.drove, side = d.side;
    d.due = null;
    const open = side === 'deal' ? true : side === 'ramblers' ? win : !win;
    d.side = open ? 'open' : 'shut';
    if (side === 'tom') warmTom(L, win ? 6 : -2);
    if (side === 'deal') warmTom(L, 3);
    if (open) {
      L.note('The old drove road was opened again.');
      return side === 'deal' ? 'The inspector approves the path along the wall in eleven minutes. Tom Windle builds the stile on it himself, and paints PATH on it, and underlines it, and is seen leaning on it, watching the walkers go by, with something that is nearly a smile.'
        : side === 'tom' ? 'The inspector finds for the Ramblers. Tom stands up, puts his cap on, and walks out without a word. The path opens in the spring. He puts the bull back.'
          : 'The inspector finds for the Ramblers, quoting the 1952 map, which Tom himself produced, to his very great annoyance. The path opens in the spring. Tom builds the stile himself, because nobody else would do it properly.';
    }
    return side === 'tom' ? 'The inspector finds for Tom: the drove road went out of use in 1952, and that is that. Tom shakes your hand in the car park, which he has done to nobody since the war.' : 'The inspector finds for Tom. The Ramblers go home with their maps. The bull, somehow, looks pleased.';
  }
}
