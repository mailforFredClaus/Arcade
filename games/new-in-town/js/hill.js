// New in Town: up the hill. The old town above the bay has its own map:
// St Brigid's, the library, the Pavilion, the Rovers' ground, Market Square,
// Windle Farm, Gorse Head, Smugglers' Cove and Dobbs & Daughter's garage.
// This file gives each of them something plain to do; the bigger things up
// here (clubs, the people of the town, the coast, cars, the market) have
// files of their own, listed in mods.js.

export function install({ def }) {
  def('pew', {
    place: 'church', sec: 'St Brigid’s', icon: '🕯️', title: 'Sit a while in the quiet', desc: 'Nobody wants anything from you in here. Good for the mood.', per: 1,
    run(L) {
      L.joy(5); L.hp(1);
      return L.pick(['The light comes through the window in coloured squares. You watch them move.', 'Somebody is practising the organ, badly, and it is lovely.', 'You sit at the back and think about nothing much. It helps.']);
    },
  });
  def('readingRoom', {
    place: 'library', sec: 'The reading room', icon: '📖', title: 'Read in the reading room', desc: 'Warm radiators and a dictionary the size of a dog. Good for Smarts.',
    run(L) {
      L.gain('smarts', 2.4); L.joy(1);
      return L.pick(['You read about the Romans until the librarian rings the little bell.', 'A book on bridges. You will never look at a bridge the same way.', 'You fall asleep on an atlas and wake up in Peru, more or less.']);
    },
  });
  def('seeShow', {
    place: 'theatre', sec: 'Tonight', icon: '🎟️', title: 'See a show', desc: 'Whatever is on. A good night out.', cost: 40, per: 1,
    run(L) {
      L.joy(7); L.gain('charm', 0.5);
      return L.pick(['A murder mystery. You guessed the butler. It was the vicar.', 'The leading man forgets his lines and the audience feed them to him.', 'A comedian from up north. You laugh until you cough.']);
    },
  });
  def('watchRovers', {
    place: 'ground', sec: 'Match day', icon: '📣', title: 'Watch the Rovers', desc: 'A pie, a cup of tea, and ninety minutes of hope.', cost: 15, per: 1,
    run(L) {
      const won = L.chance(0.4);
      L.joy(won ? 7 : 2);
      return won ? L.pick(['Rovers win 2–1, the winner off somebody’s shin. You hug a stranger.', 'A late penalty, and the whole ground sings. You do too.']) : L.pick(['Nil–nil. The pie was good.', 'Rovers lose 3–0 and the man behind you explains why, at length.']);
    },
  });
  def('browseMarket', {
    place: 'market', sec: 'The stalls', icon: '🧺', title: 'Wander round the stalls', desc: 'Cheese, old records, and a man selling one very large marrow.', per: 1,
    run(L) {
      L.joy(3); L.gain('charm', 0.6);
      return L.pick(['You try six cheeses and buy none of them. The cheese man knows.', 'Somebody is selling every record you owned as a teenager.', 'A woman tells you your fortune for nothing. It is mostly about weather.']);
    },
  });
  def('farmGate', {
    place: 'farm', sec: 'The farm gate', icon: '🥚', title: 'Buy from the farm gate', desc: 'Eggs, milk and whatever is in season. Good for you.', cost: 30, per: 1,
    run(L) {
      L.hp(2); L.joy(2);
      return L.pick(['A dozen brown eggs, one with a feather still on.', 'New potatoes with the soil still on, and a pint of milk with the cream on top.', 'The honesty box says PLEASE PAY. You do.']);
    },
  });
  def('cliffWalk', {
    place: 'headland', sec: 'Gorse Head', icon: '🥾', title: 'Walk the cliff path', desc: 'Wind, gulls and the whole bay below you. Good for Fitness.',
    run(L) {
      L.gain('fitness', 2.4); L.joy(L.s.wx === 'storm' ? 1 : 4);
      return L.s.wx === 'storm' ? 'You lean into the wind at an angle that would be impressive if anyone could see.' : L.pick(['You can see three counties and a ferry.', 'A kestrel hangs over the gorse, perfectly still, then drops.', 'Up and down, up and down. Your legs file a complaint.']);
    },
  });
  def('seaSwim', {
    place: 'cove', sec: 'Smugglers’ Cove', icon: '🏊', title: 'Swim in the sea', desc: 'Bracing at best. Good for Fitness and the mood, if you live.', per: 1,
    run(L) {
      const cold = L.season === 3 || L.s.wx === 'snow';
      L.gain('fitness', 2.6); L.joy(cold ? 3 : 6); L.hp(cold ? -1 : 1);
      return cold ? 'The sea in winter is a kind of shouting. You come out pink and very much alive.' : L.pick(['You float on your back and the gulls look down at you.', 'Twenty strokes out, twenty back, and a jellyfish you decide not to mention.']);
    },
  });
  def('garageWatch', {
    place: 'garage', sec: 'The workshop', icon: '🔧', title: 'Watch Dobbs at work', desc: 'Pass the spanners, learn a thing or two. Good for Craft.', per: 1,
    run(L) {
      L.gain('craft', 1.8);
      return L.pick(['"That’s your problem," says Dobbs, pointing at something black. You nod.', 'You hold a torch for an hour and learn what a gasket is.', 'Dobbs’s daughter fixes in five minutes what Dobbs has been at all morning.']);
    },
  });
}
