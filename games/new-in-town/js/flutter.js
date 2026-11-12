// New in Town: the flutter. A bet now and then is a bit of fun; a bet every
// season, chasing what was lost last season, is a habit, and a habit that has
// taken hold makes a season without one miserable, and starts to cost more
// than money. The Lucky Gull will bar you if you ask, and there is a group that
// meets in the church hall.
//
// State, in s.flutter: h, the habit (0 to 100: hooked from 60); last, the
// casino's running total (s.n.casino) when the season began, to see what was
// won or lost; bet: the season a bet was last placed; barred: the season the
// Lucky Gull's bar runs out; down: how deep the worst hole was; was: hooked once.

import { TROPHIES, money } from './data.js';

// Placing a bet: these build the habit. (Turning a card over in the middle of a hand does not.)
const BETS = ['slots', 'hiloStart', 'bjStart', 'raceBet', 'lotto'];
// The pier's games, which a bar keeps you from (the lotto is sold at the newsagent's, and is not).
const PIER = ['slots', 'hiloStart', 'bjStart', 'raceBet'];
const HOOKED = 60;
// What Sal's man will lend to chase a loss of x: the loss, up to $20,000, and never past what Sal
// lets anybody owe him (vice.js), with his fifth on top.
const chaseLoan = (L, x) => Math.max(0, Math.min(20000, Math.round(x / 100) * 100, Math.floor((L.sharkRoom ? L.sharkRoom() : 30000) / 1.2 / 100) * 100));

export function install({ def, A, Life, clamp, hooks, addEvents }) {
  const F = (L) => L.s.flutter;

  hooks.load.push((L) => {
    if (!L.s.flutter) L.s.flutter = { h: 0, last: L.s.n.casino || 0, bet: null, barred: null, down: 0, was: false, n: 0 };
  });

  Object.assign(Life.prototype, {
    flHooked() { return F(this).h >= HOOKED; },
    flBarred() { const b = F(this).barred; return b != null && this.s.t < b; },
    flWord() { const h = F(this).h; return h >= 80 ? 'It has hold of you' : h >= HOOKED ? 'Hooked' : h >= 35 ? 'More than a flutter' : h >= 15 ? 'A flutter now and then' : 'Nothing to speak of'; },
  });

  // A bet, and how big it is against what you have, and whether you are chasing a loss.
  hooks.acted.push((L, id, x) => {
    if (!BETS.includes(id)) return;
    const s = L.s, f = F(L), stake = id === 'lotto' ? 20 : id === 'raceBet' ? (x && x.bet) || 50 : typeof x === 'number' ? x : 50;
    const have = Math.max(500, s.cash + s.bank), behind = (s.n.casino || 0) - f.last < 0;
    let d = id === 'lotto' ? 0.4 : 1.6;
    if (stake >= have * 0.1) d += 2.5; else if (stake >= have * 0.02) d += 1;
    if (behind) d += 1.2;
    f.h = clamp(f.h + d * (1 - f.h / 140), 0, 100);
    f.bet = s.t;
    f.n++;
  });

  // The turn of the season: a habit fed grows, a habit starved fades (and, once it has hold, hurts).
  hooks.season.push((L, lines, jailed) => {
    const s = L.s, f = F(L), net = (s.n.casino || 0) - f.last;
    f.last = s.n.casino || 0;
    f.down = Math.min(f.down, net);
    const fed = f.bet === s.t;
    if (!fed) f.h = Math.max(0, f.h - (jailed ? 5 : s.use.flGroup ? 10 : 6));
    if (f.h >= HOOKED) {
      f.was = true;
      if (!fed && !jailed) { L.joy(-6); L.say('🎲', 'A season without a bet: the itch is terrible', 'bad'); }
      // Chasing what was lost; and the people at home notice.
      if (!jailed && net < -500 && !s.pend.some((q) => q.id === 'flChase')) L.queue('flChase', -net);
      else if (!jailed && L.partner() && L.chance(0.12)) L.queue('flFound');
    }
    if (f.was && f.h < 10 && !s.f.flFree) { s.f.flFree = 1; L.note('Gave up the gambling for good.', 'big'); L.say('🎲', 'Free of the habit', 'good'); }
  });

  // It weighs on you, a little, all the time it has hold.
  hooks.mood.push((L) => (L.s.flutter && L.flHooked() ? -3 : 0));

  // The pier's games will not take your money once you have asked them not to.
  for (const id of [...PIER, 'slotsOpen', 'hiloOpen', 'bjOpen', 'raceOpen']) {
    const a = A[id];
    if (!a) continue;
    const why = a.why;
    a.why = (L, x) => (L.flBarred() ? 'The Lucky Gull has your photograph behind the counter. You asked them to.' : why ? why(L, x) : null);
  }

  def('flBar', {
    place: 'casino', sec: 'If it has stopped being fun', icon: '✋', title: 'Ask them to bar you', time: 0,
    desc: 'Two years without the pier’s games: they put your photograph behind the counter. It cannot be undone.',
    show: (L) => L.s.flutter.h >= 25 && !L.flBarred(),
    run(L) {
      const f = F(L);
      f.barred = L.s.t + 8;
      L.joy(-2); L.karma(1);
      L.note('Asked the Lucky Gull to bar me for two years.');
      return 'The manager takes your photograph with a little camera, kindly, as if she does this every week. She does. It goes up behind the counter next to a man in a hat.';
    },
  });
  def('flGroup', {
    place: 'church', sec: 'The church hall', icon: '🪑', title: 'The Tuesday group', per: 1,
    desc: 'A circle of chairs, a tea urn and people who have lost more than you. For a habit that has got out of hand.',
    show: (L) => L.s.flutter.h >= 20 || L.s.flutter.was,
    run(L) {
      const f = F(L);
      L.s.use.flGroup = 1;
      f.h = Math.max(0, f.h - 6);
      L.joy(1);
      return L.pick([
        'A retired bank manager tells the story of the night he lost a bus. You laugh, then you do not.',
        'You say your name and how long it has been. Everybody says it back. It helps more than it should.',
        'Somebody has brought a cake. Nobody mentions what it would fetch at odds of five to one.',
      ]);
    },
  });

  addEvents([
    {
      id: 'flChase', icon: '🎲', title: 'One more night', w: 0, ok: (L) => L.flHooked() && !L.s.gaol,
      text: (L, x) => `You are ${money(x)} down this season. One good night would put it right: you can feel it. It is just a matter of going back while your luck is due.`,
      opts: [
        // (Sal's man lends what you lost, up to what Sal will let anybody owe him, at a fifth on top.
        // A win pays the stake back twice and a little over: enough to clear him, and the season with it.)
        { t: 'Borrow from Sal’s man, and go back', show: (L) => !L.flBarred() && (!L.salHere || L.salHere()), why: (L, x) => (chaseLoan(L, x) < 100 ? 'Even Sal has limits.' : null), odds: () => 0.35,
          run(L, x, win) {
            const n = chaseLoan(L, x), owe = Math.round(n * 1.2);
            L.s.shark = (L.s.shark || 0) + owe;
            if (win) { const got = Math.round(n * 2.2); L.cash(got); L.s.n.casino = (L.s.n.casino || 0) + got - n; L.joy(4); F(L).h = Math.min(100, F(L).h + 4); return `You win it back, and a bit over: ${money(got)}, and you walk out at dawn feeling like a genius. Sal’s man will want his ${money(owe)}, and once he has it the season is square.`; }
            L.s.n.casino = (L.s.n.casino || 0) - n; L.joy(-8); F(L).h = Math.min(100, F(L).h + 6);
            return `It goes the way it was always going to go. Now you owe Sal’s man ${money(owe)} as well.`;
          } },
        { t: 'Take it out of your savings, and go back', show: (L) => !L.flBarred(), why: (L, x) => (L.s.bank < x ? 'There is not that much in the bank.' : null), odds: () => 0.4,
          run(L, x, win) {
            if (win) { L.cash(x); L.s.n.casino = (L.s.n.casino || 0) + x; L.joy(3); F(L).h = Math.min(100, F(L).h + 4); return 'You win it back. The relief is so enormous you nearly cry in the car park.'; }
            L.s.bank -= x; L.s.n.casino = (L.s.n.casino || 0) - x; L.joy(-8); F(L).h = Math.min(100, F(L).h + 5);
            return `${money(x)} out of the savings and onto the felt, and none of it comes back.`;
          } },
        { t: 'Leave it. Go for a walk instead', run(L) { F(L).h = Math.max(0, F(L).h - 5); L.joy(-2); return 'You walk all the way to Gorse Head and back in the dark. The wanting does not go, but you get home without having fed it.'; } },
      ],
    },
    {
      id: 'flFound', icon: '🧾', title: 'The statements', w: 0, ok: (L) => !!L.partner() && L.flHooked() && !L.s.gaol,
      text: (L) => `${L.partner().name.split(' ')[0]} is at the kitchen table with the bank statements spread out, and a pen, and has circled every one of the Lucky Gull’s.`,
      opts: [
        { t: 'Tell the truth, all of it', run(L) { const p = L.partner(); L.bond(p, -4); F(L).h = Math.max(0, F(L).h - 12); L.joy(-3); return 'It takes most of the night. At the end of it there is a plan, a joint account, and the number of the Tuesday group stuck to the fridge.'; } },
        { t: 'Explain it away', check: ['charm', 55], run(L, x, win) { const p = L.partner(); if (win) { L.bond(p, -2); return 'A friend’s stag do, a charity night, a mix-up at the bank. It is believed, more or less. You feel worse than if it had not been.'; } L.bond(p, -14); L.joy(-6); return 'The story falls apart at the third statement. What hurts is not the money; it is the lying.'; } },
      ],
    },
  ]);

  Object.assign(TROPHIES, {
    flFree: { name: 'Walked away', icon: '✋', desc: 'Get free of a gambling habit that had hold of you.', test: (L) => !!L.s.f.flFree },
  });
}
