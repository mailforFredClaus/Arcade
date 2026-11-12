// New in Town: more ways to lose money by the sea. Blackjack and the gull
// races at the Lucky Gull, and the Bay Lotto from the newsagent on the
// High Street. Like the slots, none of it takes any time, and all of it
// favours the house.

import { money } from './data.js';

const STAKES = [50, 500, 5000, 50000];
const GULLS = ['Kevin', 'Admiral Beaky', 'Chip Thief', 'Sir Flaps-a-Lot', 'Mrs Higgins', 'The Duchess', 'Salty Pete', 'Greased Lightning', 'Old Stinky', 'Battered Sausage', 'Tuppence', 'Windy Miller', 'Lord Squawk', 'Pasty Bandit'];
const LOTTO_START = 100000;
// The most the Lucky Gull pays out on any one bet, over the stake, however much is staked.
export const HOUSE_MAX = 100000;

// What a hand of cards is worth: aces are 11, or 1 if that would go bust.
export const handTotal = (cards) => {
  let t = 0, aces = 0;
  for (const c of cards) { t += c > 10 ? 10 : c === 1 ? 11 : c; if (c === 1) aces++; }
  while (t > 21 && aces) { t -= 10; aces--; }
  return t;
};

export function install({ def, A, Life, clamp }) {
  Object.assign(Life.prototype, {
    // Ends a hand of blackjack. how: 'bust', 'stand' or 'natural'.
    bjSettle(how) {
      const s = this.s, h = s.bj;
      let res, pay = 0;
      if (how === 'bust') res = 'bust';
      else {
        while (how !== 'natural' && handTotal(h.dl) < 17) h.dl.push(this.int(1, 13));
        const me = handTotal(h.me), dl = handTotal(h.dl), dealerNatural = dl === 21 && h.dl.length === 2;
        // (A blackjack pays six to five at the Lucky Gull: it says so on the felt, in small letters.)
        if (how === 'natural') { res = dealerNatural ? 'push' : 'natural'; pay = dealerNatural ? h.bet : Math.min(h.bet + this.houseMax(), h.bet * 2.2); }
        else if (dl > 21 || me > dl) { res = 'win'; pay = Math.min(h.bet + this.houseMax(), h.bet * 2); }
        else if (me === dl && !dealerNatural) { res = 'push'; pay = h.bet; }
        else res = 'lose';
      }
      s.bj = null;
      s.n.casino += pay - h.bet;
      if (pay) this.cash(pay);
      if (res === 'natural') { s.f.natural = 1; this.thrill(3); } else if (res === 'win') { if (h.bet >= 5000) this.thrill(3); } else if (res !== 'push') this.joy(-0.4);
      this.out = { me: h.me, dl: h.dl, res, pay, bet: h.bet };
      return { bust: 'Bust! The dealer takes your chips without looking up.', natural: `Blackjack! It pays six to five: ${money(pay)}.`, win: `You win ${money(pay)}.`, push: 'A tie. You get your stake back.', lose: `The dealer has ${handTotal(h.dl)}. Your stake is gone.` }[res];
    },
    // The most the house pays out on one bet, over the stake.
    houseMax() { return HOUSE_MAX; },
    // The lift of a win, which only works once a season.
    thrill(n) { if (!this.s.use.thrill) { this.s.use.thrill = 1; this.joy(n); } },
    // Today's card at the gull races: five birds and what they pay.
    raceCard() {
      const s = this.s;
      if (!s.race) {
        const names = [];
        while (names.length < 5) { const n = this.pick(GULLS); if (!names.includes(n)) names.push(n); }
        const w = names.map(() => 0.4 + this.rnd() ** 2 * 3), sum = w.reduce((a, b) => a + b, 0);
        s.race = names.map((name, i) => ({ name, p: w[i] / sum, pays: Math.max(1.3, Math.round(0.86 / (w[i] / sum) * 10) / 10) }));
      }
      return s.race;
    },
    lottoPot() { return this.s.lot.pot; },
    // The end of a season on the pier: an unfinished hand is played out, and the lotto is drawn.
    pierSeason() {
      const s = this.s;
      if (s.bj) { const said = this.bjSettle('stand'); this.say('♠️', `The hand you left on the table was played out. ${said}`, this.out.pay ? 'good' : 'bad'); }
      const lot = s.lot;
      let won = 0, jackpot = false;
      for (let i = 0; i < lot.n; i++) {
        const r = this.rnd();
        if (r < 1 / 25000) { jackpot = true; won += lot.pot; } else if (r < 1 / 200) won += 500; else if (r < 1 / 12) won += 50;
      }
      if (won) {
        this.cash(won); this.joy(jackpot ? 30 : won >= 500 ? 4 : 1);
        if (jackpot) { s.f.lotto = 1; this.note(`Won the Bay Lotto jackpot: ${money(won)}!`, 'big'); this.say('🎟️', `JACKPOT! You have won ${money(won)} on the Bay Lotto`, 'dream'); } else this.say('🎟️', `Your lotto ticket came up: ${money(won)}`, 'good');
      }
      // Somebody else wins it now and then.
      if (jackpot || this.chance(0.1)) lot.pot = LOTTO_START; else lot.pot = Math.min(2000000, lot.pot + 10000);
      lot.n = 0;
    },
  });

  // -- blackjack
  def('bjOpen', { place: 'casino', sec: 'Games', icon: '♠️', title: 'Blackjack', desc: 'Beat the dealer to twenty-one.', time: 0, open: 'blackjack' });
  def('bjStart', {
    time: 0, cost: (L, bet) => bet,
    why: (L, bet) => (L.s.bj ? 'Finish the hand you are playing.' : STAKES.includes(bet) ? null : 'Pick a stake.'),
    run(L, bet) {
      const s = L.s;
      s.bj = { bet, me: [L.int(1, 13), L.int(1, 13)], dl: [L.int(1, 13), L.int(1, 13)] };
      L.out = null;
      if (handTotal(s.bj.me) === 21) return L.bjSettle('natural');
      return 'Two cards each. One of the dealer’s is face down.';
    },
  });
  def('bjHit', {
    time: 0, why: (L) => (L.s.bj ? null : 'Place a bet first.'),
    run(L) { const h = L.s.bj; h.me.push(L.int(1, 13)); const t = handTotal(h.me); return t > 21 ? L.bjSettle('bust') : t === 21 ? L.bjSettle('stand') : `You have ${t}.`; },
  });
  def('bjStand', { time: 0, why: (L) => (L.s.bj ? null : 'Place a bet first.'), run: (L) => L.bjSettle('stand') });
  def('bjDouble', {
    time: 0, cost: (L) => (L.s.bj ? L.s.bj.bet : 0),
    why: (L) => (!L.s.bj ? 'Place a bet first.' : L.s.bj.me.length > 2 ? 'Only on your first two cards.' : null),
    run(L) { const h = L.s.bj; h.bet *= 2; h.me.push(L.int(1, 13)); return handTotal(h.me) > 21 ? L.bjSettle('bust') : L.bjSettle('stand'); },
  });

  // -- the gull races
  def('raceOpen', { place: 'casino', sec: 'Games', icon: '🐦', title: 'The gull races', desc: 'Five gulls, one chip, the length of the pier.', time: 0, open: 'races' });
  def('raceBet', {
    time: 0, cost: (L, x) => (x && x.bet) || 0,
    why: (L, x) => (x && STAKES.includes(x.bet) && L.raceCard()[x.i] ? null : 'Pick a gull and a stake.'),
    run(L, x) {
      const s = L.s, card = L.raceCard(), left = card.map((g, i) => i), order = [];
      // Each place goes to one of the birds still flying, the likelier ones more often.
      while (left.length) {
        let r = L.rnd() * left.reduce((a, i) => a + card[i].p, 0), k = 0;
        while (k < left.length - 1 && r >= card[left[k]].p) r -= card[left[k++]].p;
        order.push(left.splice(k, 1)[0]);
      }
      const won = order[0] === x.i, pay = won ? Math.min(x.bet + L.houseMax(), Math.round(x.bet * card[x.i].pays)) : 0;
      s.n.casino += pay - x.bet;
      if (pay) { L.cash(pay); if (card[x.i].pays >= 6) L.thrill(5); if (card[x.i].pays >= 8) s.f.outsider = 1; } else L.joy(-0.3);
      L.out = { card, order, pick: x.i, pay };
      s.race = null;
      return won ? `${card[x.i].name} by a beak! You collect ${money(pay)}.` : `${card[order[0]].name} takes the chip. ${card[x.i].name} ${order.indexOf(x.i) === 4 ? 'is still on the railing, looking at the sea' : `comes in ${['', 'second', 'third', 'fourth'][order.indexOf(x.i)]}`}.`;
    },
  });

  // -- the lotto
  def('lotto', {
    place: 'highstreet', sec: 'Bay Lotto', icon: '🎟️', title: 'Buy a lotto ticket', cost: 20, time: 0, per: 5,
    desc: (L) => `Drawn at the end of the season. The jackpot stands at ${money(L.lottoPot())}.${L.s.lot.n ? ` You hold ${L.s.lot.n}.` : ''}`,
    run(L) { L.s.lot.n++; return L.pick(['Six numbers. Your birthday, mostly.', 'The newsagent wishes you luck, as he does everybody.', 'You fold it into your wallet behind the library card.', 'Somebody has to win it.']); },
  });
}
