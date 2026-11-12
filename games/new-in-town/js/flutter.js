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
// The house watches too: nets, what was won or lost at the pier in each of the
// last eight seasons; lim: the season a limit on your stakes runs out; house: the
// bar is the Lucky Gull's idea, not yours; warned: how often the manager has had a word;
// base: what you stood at, at the pier, when she last did (her books on you start from there).

import { TROPHIES, money } from './data.js';

// Placing a bet: these build the habit. (Turning a card over in the middle of a hand does not.)
const BETS = ['slots', 'hiloStart', 'bjStart', 'raceBet', 'lotto'];
// The pier's games, which a bar keeps you from (the lotto is sold at the newsagent's, and is not).
const PIER = ['slots', 'hiloStart', 'bjStart', 'raceBet'];
const HOOKED = 60;
// What Sal's man will lend to chase a loss of x: the loss, up to $20,000, and never past what Sal
// lets anybody owe him (vice.js), with his fifth on top.
const chaseLoan = (L, x) => Math.max(0, Math.min(20000, Math.round(x / 100) * 100, Math.floor((L.sharkRoom ? L.sharkRoom() : 30000) / 1.2 / 100) * 100));
// The Lucky Gull minds a customer who keeps winning: up NOTICE on the house over all (or YEAR in a
// single year) and the manager has a word, and keeps your stakes to LIMIT for two years; still
// up that much once the two years are over, and you are asked, very politely, to take your
// custom elsewhere for three.
const NOTICE = 100000, YEAR = 150000, LIMIT = 500;
const stakeOf = (id, x) => (id === 'raceBet' ? (x && x.bet) || 0 : typeof x === 'number' ? x : 0);

export function install({ def, A, Life, clamp, hooks, addEvents }) {
  const F = (L) => L.s.flutter;

  hooks.load.push((L) => {
    if (!L.s.flutter) L.s.flutter = { h: 0, last: L.s.n.casino || 0, bet: null, barred: null, down: 0, was: false, n: 0 };
    const f = L.s.flutter;
    if (!f.nets) Object.assign(f, { nets: [], lim: null, house: false, warned: 0, base: 0 });
  });

  Object.assign(Life.prototype, {
    flHooked() { return F(this).h >= HOOKED; },
    flBarred() { const b = F(this).barred; return b != null && this.s.t < b; },
    // The most the Lucky Gull will take from you on one bet just now (null: as much as you like).
    flLimit() { const l = F(this).lim; return l != null && this.s.t < l ? LIMIT : null; },
    // What the pier's games have come to over the last year.
    flYear() { return F(this).nets.slice(-4).reduce((a, n) => a + n, 0); },
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
    // A habit with hold of you follows you to work: the mind is on the next bet.
    if (f.h >= HOOKED && s.job && !jailed) s.job.perf = clamp(s.job.perf - (f.h >= 85 ? 3 : 1.5), 0, 100);
    // The house keeps its own books on you.
    f.nets.push(net);
    if (f.nets.length > 8) f.nets.shift();
    // (Over all: since the house last had a word; each word starts its books on you afresh.)
    const year = L.flYear(), all = (s.n.casino || 0) - (f.base || 0), free = !L.flBarred() && !s.pend.some((q) => q.id === 'flLimit' || q.id === 'flBan');
    if (!jailed && free && fed) {
      const up = year >= YEAR || all >= NOTICE;
      if (up && f.warned === 0) L.queue('flLimit', Math.max(year, all));
      else if (up && L.flLimit() == null) L.queue('flBan', Math.max(year, all));
    }
  });

  // It weighs on you, a little, all the time it has hold.
  hooks.mood.push((L) => (L.s.flutter && L.flHooked() ? -3 : 0));

  // The pier's games will not take your money once you have asked them not to, or once
  // the house has asked you; and while the manager is keeping an eye, only small stakes.
  for (const id of [...PIER, 'slotsOpen', 'hiloOpen', 'bjOpen', 'raceOpen']) {
    const a = A[id];
    if (!a) continue;
    const why = a.why;
    a.why = (L, x) => {
      if (L.flBarred()) return F(L).house ? 'The Lucky Gull has asked you, very politely, to take your custom elsewhere for a while.' : 'The Lucky Gull has your photograph behind the counter. You asked them to.';
      if (PIER.includes(id) && L.flLimit() != null && stakeOf(id, x) > L.flLimit()) return `The manager will take no more than ${money(L.flLimit())} a time from you just now.`;
      return why ? why(L, x) : null;
    };
  }
  // (Doubling a hand of blackjack is a bigger stake too.)
  const dbl = A.bjDouble;
  if (dbl) { const why = dbl.why; dbl.why = (L, x) => (L.flLimit() != null && L.s.bj && L.s.bj.bet * 2 > L.flLimit() ? `The manager will take no more than ${money(L.flLimit())} a hand from you just now.` : why ? why(L, x) : null); }

  def('flBar', {
    place: 'casino', sec: 'If it has stopped being fun', icon: '✋', title: 'Ask them to bar you', time: 0,
    desc: 'Two years without the pier’s games: they put your photograph behind the counter. It cannot be undone.',
    show: (L) => L.s.flutter.h >= 25 && !L.flBarred(),
    run(L) {
      const f = F(L);
      f.barred = L.s.t + 8; f.house = false;
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
    // The house notices a winner.
    {
      id: 'flLimit', icon: '🎩', title: 'A word from the manager', w: 0, ok: (L) => !L.flBarred() && !L.s.gaol,
      text: (L, x) => `The manager of the Lucky Gull, a tall woman in a velvet jacket, asks if you have a moment, and takes you up to an office over the slot machines. You are ${money(x)} up on the house, she says, which is lovely for you. From now on she would be grateful if you kept your stakes to ${money(LIMIT)} a time.`,
      opts: [
        { t: 'Agree, graciously', run(L) { const f = F(L); f.lim = L.s.t + 8; f.warned++; f.base = L.s.n.casino; f.nets = []; L.karma(1); L.note(`The Lucky Gull limited my stakes to ${money(LIMIT)} for two years: I had been winning.`); return 'She shakes your hand and gives you a voucher for the café. You are, for the first time in your life, a known face at a casino, and not in a good way.'; } },
        { t: 'Argue that a casino ought to take its losses', check: ['charm', 60], run(L, x, win) { const f = F(L); f.warned++; f.base = L.s.n.casino; f.nets = []; if (win) { f.lim = L.s.t + 4; return 'She hears you out, smiles, and settles on a year. “I like you,” she says. “I just do not like paying you.”'; } f.lim = L.s.t + 8; L.joy(-2); return '“Of course,” she says, in the voice of somebody who has had this conversation a hundred times. Two years, then.'; } },
        { t: 'Take your winnings and walk away for good', run(L) { const f = F(L); f.barred = L.s.t + 8; f.house = false; f.warned++; f.base = L.s.n.casino; f.nets = []; f.h = Math.max(0, f.h - 10); L.joy(3); L.karma(1); L.note('Walked away from the Lucky Gull while I was ahead.', 'big'); return 'You cash your chips, thank her, and walk out along the pier with the gulls going over and your pockets full. It is the best bet you have ever made.'; } },
      ],
    },
    {
      id: 'flBan', icon: '🚪', title: 'Your custom, elsewhere', w: 0, ok: (L) => !L.flBarred() && !L.s.gaol,
      text: (L, x) => `The manager is waiting at the door this time, with two large men in bow ties a little way behind her. You are ${money(x)} up on the Lucky Gull, she says, and the Lucky Gull is a small business. She would be very grateful if you took your custom elsewhere for a few years.`,
      opts: [
        { t: 'Go quietly', run(L) { const f = F(L); f.barred = L.s.t + 12; f.house = true; f.warned++; f.base = L.s.n.casino; f.nets = []; L.note('Asked, politely, to stay away from the Lucky Gull for three years: I kept winning.', 'big'); return 'Your photograph goes up behind the counter, next to a man in a hat. The men in bow ties see you to the end of the pier, very courteously.'; } },
        { t: 'Make a scene', run(L) { const f = F(L); f.barred = L.s.t + 16; f.house = true; f.warned++; f.base = L.s.n.casino; f.nets = []; L.karma(-3); L.joy(-4); return 'There is a scene. It is in the Gazette on Friday, under SORE WINNER. You are barred for four years now, not three.'; } },
      ],
    },
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
