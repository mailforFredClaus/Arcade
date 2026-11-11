// New in Town: the low road. Everything a person can do in Starling Bay
// that they shouldn't: theft, burglary, Sal's back room and his crew, bent
// dealings at work, fights, drink and worse, affairs, and what the law
// does about it when it catches you. Added to the engine like living.js.
//
// Every crime blackens your name and draws the law's eye (heat), and heat
// makes the next one riskier until it cools. Get caught and a card decides
// the rest: fines for small things, prison for big ones.

import { CAREERS, ITEMS, money, low } from './data.js';

// What bending the rules looks like in each line of work.
const GRAFT = {
  kitchen: ['Water down the gin', 'Nobody tastes the difference after the second one.'],
  retail: ['Help yourself from the till', 'A note here, a note there. The books almost balance.'],
  trades: ['Sell materials out of the back gate', 'A pallet of bricks goes for a walk.'],
  tech: ['Sell the customer list', 'A stranger in a car park pays cash for a memory stick.'],
  medicine: ['Write a few prescriptions for cash', 'No questions asked, none answered.'],
  police: ['Look the other way, for a price', 'An envelope under the windscreen wiper.'],
  law: ['Pad the client’s bill', 'Six minutes becomes six hours.'],
  arts: ['Sell forged autographs', 'Yours, mostly. Some are better known.'],
  sports: ['Throw a match for a bookmaker', 'You slip, convincingly, at the worst moment.'],
  teaching: ['Sell the exam answers', 'Photocopied, folded small, fifty a time.'],
  sea: ['Land a catch off the books', 'By moonlight, to a man with a van.'],
  finance: ['Trade on what you should not know', 'You buy on Monday what the papers print on Friday.'],
  politics: ['Sell a planning permission', 'A car park where the meadow was.'],
};
const HOUSES = [
  ['A terrace on Net Loft Lane', 0.2, 2, 1000, 3000],
  ['A villa on the cliff road', 0.3, 2, 8000, 20000],
  ['Starling Manor', 0.42, 3, 40000, 90000],
];
const BOUTS = [['Wee Dougie', 35, 500, 10], ['The Ox', 60, 3000, 16], ['Mad Agnes', 85, 15000, 24]];

export function install({ def, A, Life, clamp }) {
  Object.assign(Life.prototype, {
    warm(d) { this.s.heat = clamp(this.s.heat + d, 0, 100); },
    // A beating, a bender: it hurts, but it does not kill you outright.
    rough(d, cause) { this.hp(-Math.min(d, Math.max(0, this.s.health - 8)), cause); },
    // The chance a piece of villainy ends with a hand on your collar.
    riskOf(base) {
      const s = this.s, crew = s.job && s.job.c === 'crew' ? s.job.r * 0.01 : 0;
      return clamp(base + s.heat / 400 + Math.min(4, s.record) * 0.02 - s.st.smarts / 1000 - (this.perk('police') ? 0.04 : 0) - (this.perk('crew') ? 0.03 : 0) - (s.heir === 'rogue' ? 0.06 : 0) - crew, 0.03, 0.85);
    },
    // Commits one: it is counted, your name suffers and the law takes an
    // interest. sev: 1 petty to 4 the bank. Returns true if you were caught
    // (the reckoning is then waiting as a card).
    crime(base, sev, what, heat = 2 + sev * 2) {
      const s = this.s, risk = this.riskOf(base);
      s.n.crimes++;
      this.karma(-(1 + sev));
      this.warm(heat);
      if (!this.chance(risk)) return false;
      this.queue('busted', { what, sev });
      return true;
    },
    // What the magistrate hands down. Small things are a fine; the rest is
    // time, and more of it if you have been here before.
    sentence(sev) {
      const s = this.s, again = s.record >= 1;
      if (sev <= 0) return 'A stern talking-to, and you are let go. This time.';
      const n = [0, 0, 2, 5, 12][Math.min(4, sev)] + (again ? [0, 1, 1, 2, 4][Math.min(4, sev)] : 0);
      if (!n) {
        const fine = this.perk('law') ? 800 : 1500;
        s.record++;
        this.cash(-fine);
        if (s.job && CAREERS[s.job.c].clean) { this.note(`Sacked as ${this.jobTitle()}.`, 'big'); s.job = null; }
        return `A ${money(fine)} fine and a criminal record.`;
      }
      this.queue('inside', { n });
      return `The magistrate does not look up. "${n} seasons."`;
    },
    lawWord() { const h = this.s.heat; return h >= 75 ? 'Hunting for you' : h >= 45 ? 'Wants a word' : h >= 15 ? 'Watching you' : 'No interest in you'; },
    hooked(k) { return (this.s.habit[k] || 0) >= 60; },
    // The end of a season, on the low road: heat cools, habits bite, Sal's interest mounts.
    viceSeason() {
      const s = this.s;
      this.warm(-8);
      for (const k of Object.keys(s.habit)) {
        // (Going without wears a habit down, but hurts while it lasts.)
        const was = s.habit[k];
        if (!s.use[k]) s.habit[k] = Math.max(0, was - 7);
        if (was >= 60) { this.hp(-2, k === 'drink' ? 'the drink' : 'mermaid dust'); if (!s.use[k]) this.joy(-7); }
        if (!s.habit[k]) delete s.habit[k];
      }
      if (s.shark > 0) {
        s.shark = Math.round(s.shark * 1.1);
        s.sharkT = (s.sharkT || 0) + 1;
        if (s.sharkT >= 6 && s.sharkT % 3 === 0) this.queue('legbreakers');
      } else s.sharkT = 0;
    },
  });

  // -- light fingers, about town
  def('lift', {
    place: 'highstreet', sec: 'Light fingers', icon: '🧥', title: 'Shoplift', desc: (L) => `Something small, under the coat. About ${Math.round(L.riskOf(0.2) * 100)}% you are caught.`,
    run(L) {
      const s = L.s;
      L.gain('fitness', 0.5);
      if (L.crime(0.2, 1, 'half the shop under your coat')) return 'A hand lands on your shoulder at the door.';
      s.n.thefts = (s.n.thefts || 0) + 1;
      const take = ['books', 'rod', 'easel', 'guitar', 'phone'].filter((id) => !s.items[id]);
      if (take.length && L.chance(0.5)) { const id = L.pick(take); s.items[id] = 1; return `You walk out with a ${ITEMS[id].name.toLowerCase()} and a hammering heart. Nobody says a word.`; }
      const got = L.int(8, 40) * 10;
      L.cash(got);
      return `Razors, perfume, a ham. Sal gives you ${money(got)} for the lot.`;
    },
  });
  def('dip', {
    place: 'station', sec: 'Light fingers', icon: '👛', title: 'Pick pockets on the platform', desc: (L) => `Tourists, mostly. About ${Math.round(L.riskOf(0.22) * 100)}% you are caught.`,
    run(L) {
      if (L.crime(0.22, 1, 'your hand in a stranger’s jacket')) return 'The wallet is on a chain. The chain is attached to a very large man.';
      const got = Math.round((80 + L.int(0, 50) * 10 + L.s.st.charm * 2) / 10) * 10;
      L.cash(got); L.s.n.thefts = (L.s.n.thefts || 0) + 1;
      return `${L.pick(['A bump, an apology, a wallet.', 'She never feels a thing.', 'The 7.15 is delayed. You are not.'])} ${money(got)}.`;
    },
  });

  // -- Sal's back room
  def('salOpen', { place: 'harbour', sec: 'Odd jobs', icon: '🦊', title: 'Sal’s back room', desc: 'Behind the ice house. Work nobody asks questions about.', time: 0, open: 'sal' });
  def('errand', {
    place: 'sal', sec: 'Work for Sal', icon: '📦', title: 'Run an errand', desc: (L) => `No questions asked. Good money. About ${Math.round(L.riskOf(0.16) * 100)}% it goes wrong.`, time: 2,
    why: (L) => (L.s.t < (L.s.f.salOff || 0) ? 'Sal is not speaking to you.' : null),
    run(L) {
      const s = L.s;
      if (L.crime(0.16, 2, 'a crate that is not yours')) return 'You are halfway down the quay with the crate when a torch clicks on.';
      const pay = Math.min(8000, 2000 + L.int(0, 30) * 100 + s.n.crimes * 100);
      L.cash(pay);
      return `${L.pick(['You drive a van to a lay-by and walk away from it.', 'A crate of "designer" handbags changes hands.', 'You keep watch while some boxes fall off a boat.'])} Sal counts out ${money(pay)}.`;
    },
  });
  def('deal', {
    place: 'sal', sec: 'Work for Sal', icon: '✨', title: 'Sell mermaid dust at the Gull', desc: (L) => `Little paper twists, to people who should know better. About ${Math.round(L.riskOf(0.15) * 100)}% you are caught.`,
    why: (L) => (L.s.t < (L.s.f.salOff || 0) ? 'Sal is not speaking to you.' : null),
    run(L) {
      if (L.crime(0.15, 2, 'a pocketful of mermaid dust')) return 'Your best customer tonight turns out to be a constable in a borrowed anorak.';
      const pay = Math.round((600 + L.s.st.charm * 14) * (0.8 + L.rnd() * 0.5) / 10) * 10;
      L.cash(pay); L.gain('charm', 0.6);
      return `${L.pick(['A good night. Everybody is very friendly.', 'You sell out by ten and spend an hour pretending to drink.', 'The darts team is your best customer. It shows.'])} Your cut is ${money(pay)}.`;
    },
  });
  def('joinCrew', {
    place: 'sal', sec: 'Work for Sal', icon: '🤝', title: 'Join Sal’s crew', desc: 'A career, of a kind. No pension.',
    show: (L) => !(L.s.job && L.s.job.c === 'crew'),
    why: (L) => L.applyWhy('crew'),
    run: (L) => `${A.apply.run(L, 'crew')} "Welcome to the family," says Sal, not smiling.`,
  });
  HOUSES.forEach(([name, base, sev, lo, hi], i) => {
    def(`burgle${i}`, {
      place: 'sal', sec: 'Jobs', icon: i === 2 ? '🏰' : '🏚️', title: `Burgle ${low(name)}`, time: 2,
      desc: (L) => `Worth ${money(lo)} to ${money(hi)} to the right buyer. About ${Math.round(L.riskOf(base) * 100)}% you are caught.`,
      why: (L) => (i === 2 && L.owns('manor') ? 'You would be robbing yourself.' : null),
      run(L) {
        L.gain('fitness', 0.6);
        if (L.crime(base, sev, `${i === 2 ? 'the Manor’s' : 'somebody else’s'} silver in a pillowcase`)) return L.pick(['The dog was not in the plans.', 'You are halfway out of the window when the lights come on.', 'A neighbour, a telephone, a blue lamp.']);
        const got = L.int(lo / 100, hi / 100) * 100;
        L.cash(got); L.s.n.thefts = (L.s.n.thefts || 0) + 1;
        return `${L.pick(['In by the scullery, out by the front door like you own the place.', 'Silver, a clock, and a painting of a horse.', 'You leave the fridge as you found it. You are not an animal.'])} Sal’s man gives you ${money(got)}.`;
      },
    });
  });
  def('twoc', {
    place: 'sal', sec: 'Jobs', icon: '🚗', title: 'Steal a car to order', time: 2,
    desc: (L) => `A list, a colour, a lock-up in the next town. About ${Math.round(L.riskOf(0.28) * 100)}% you are caught.`,
    run(L) {
      if (L.crime(0.28, 2, 'a car with the wrong number plates')) return 'It has a tracker. Of course it has a tracker.';
      const got = L.int(30, 75) * 100;
      L.cash(got); L.s.n.thefts = (L.s.n.thefts || 0) + 1;
      return `Forty seconds with a coat hanger. You deliver it before the owner has finished breakfast: ${money(got)}.`;
    },
  });
  def('torch', {
    place: 'sal', sec: 'Jobs', icon: '🕯️', title: 'An accident with a candle', time: 2,
    desc: (L) => { const e = L.spare(); return e ? `Your ${L.propName(e).toLowerCase()} burns down and the insurance pays out ${money(L.propValue(e))}. About ${Math.round(L.riskOf(0.3) * 100)}% they work it out.` : 'For a property you own, do not live in, and have insured.'; },
    show: (L) => L.s.estate.length > 0,
    why: (L) => (!L.spare() ? 'You need a property you do not live in.' : !L.s.ins.home ? 'It is not insured. That would just be a fire.' : null),
    run(L) {
      const s = L.s, e = L.spare(), value = L.propValue(e), name = L.propName(e).toLowerCase();
      s.estate.splice(s.estate.indexOf(e), 1);
      if (L.crime(0.3, 3, `a petrol can, and your ${name} in ashes`)) return 'The fire investigator finds the candle. Then the second candle. Then the petrol can with your fingerprints on.';
      L.cash(value);
      L.note(`The ${name} burned down. The insurance paid ${money(value)}.`, 'big');
      return `A terrible accident. Everybody says so. The cheque is for ${money(value)}.`;
    },
  });
  def('heist', {
    place: 'sal', sec: 'Jobs', icon: '🏦', title: 'Rob Harbour Bank', time: 3, cost: 10000,
    desc: (L) => `The big one. A quarter of a million or more, or a dozen seasons inside. Your chances: ${Math.round(L.heistOdds() * 100)}%.`,
    why: (L) => (L.s.n.crimes < 15 ? `Sal will not trust you with this yet (${L.s.n.crimes} of 15 crimes).` : L.s.t - (L.s.f.heistAt ?? -99) < 20 ? 'The town is still jumpy from the last time.' : null),
    run(L) {
      const s = L.s;
      s.f.heistAt = s.t; s.n.crimes++; L.karma(-8); L.warm(45);
      if (!L.chance(L.heistOdds())) { L.queue('busted', { what: 'a holdall, a mask, and the alarm ringing', sev: 4 }); return 'The vault opens. So does the door behind you. "Armed police."'; }
      const got = L.int(250, 600) * 1000;
      L.cash(got); s.f.heist = 1; L.joy(12);
      L.note(`Robbed Harbour Bank of ${money(got)}, and got away with it.`, 'big');
      return `Nine minutes, in and out, exactly as drawn on the back of Sal’s beer mat. Your share is ${money(got)}. Try to look surprised when you read about it.`;
    },
  });
  BOUTS.forEach(([name, dc, prize, hurt], i) => {
    def(`bout${i}`, {
      place: 'sal', sec: 'The ring', icon: '🥊', title: `Fight ${name}`, per: 1,
      desc: (L) => `Bare knuckles, in the ice house. ${money(prize)} if you win (${Math.round(L.checkOdds('fitness', dc) * 100)}%). It hurts either way.`,
      why: (L) => (L.s.health < 35 ? 'Not in your state. Sal has standards.' : null),
      run(L) {
        const s = L.s;
        L.gain('fitness', 1.2);
        if (L.chance(L.checkOdds('fitness', dc))) { L.cash(prize); L.rough(hurt / 3, 'a bare-knuckle bout'); L.fame(0.5); L.joy(5); s.n.fights = (s.n.fights || 0) + 1; return `${name} goes down in the ${L.pick(['second', 'fourth', 'ninth'])}. You collect ${money(prize)} with a hand that will not close.`; }
        L.rough(hurt, 'a bare-knuckle bout'); L.joy(-3);
        return `You remember the bell. You do not remember much after the bell. ${name} helps carry you out, which is decent.`;
      },
    });
  });
  for (const amt of [2000, 10000]) {
    def(`shark${amt}`, {
      place: 'sal', sec: 'Sal’s money', icon: '🦈', title: `Borrow ${money(amt)} from Sal`, time: 0,
      desc: 'No forms. 10% a season. Sal sends people round if it drags on.',
      why: (L) => (L.s.shark + amt > 30000 ? 'Even Sal has limits.' : null),
      run(L) { L.s.shark += amt; L.s.cash += amt; return `Sal peels off ${money(amt)} from a roll. "Do not make me come and find you."`; },
    });
  }
  def('sharkBack', {
    place: 'sal', sec: 'Sal’s money', icon: '💸', title: (L) => `Pay Sal back (you owe ${money(L.s.shark)})`, desc: 'All of it, or as much as you have on you.', time: 0,
    show: (L) => L.s.shark > 0,
    why: (L) => (L.s.cash < 1 ? 'You have nothing on you.' : null),
    run(L) { const s = L.s, n = Math.min(s.cash, s.shark); s.cash -= n; s.shark -= n; return s.shark ? `${money(n)} to Sal. ${money(s.shark)} still owing, and counting.` : 'Sal counts it twice. "Pleasure doing business."'; },
  });

  // -- bending the rules at work
  def('graft', {
    place: (L) => (L.s.job && GRAFT[L.s.job.c] ? CAREERS[L.s.job.c].place : null), sec: 'Work', icon: '🤫', per: 1,
    title: (L) => GRAFT[L.s.job.c][0],
    desc: (L) => `About ${money(L.shiftPay() * 1.7)} for you, off the books. About ${Math.round(L.riskOf(0.1) * 100)}% it comes out: the sack, and the law.`,
    show: (L) => !!L.s.job && !!GRAFT[L.s.job.c],
    run(L) {
      const s = L.s, got = Math.round(L.shiftPay() * (1.2 + L.rnd()) / 10) * 10, t = L.jobTitle();
      s.n.grafts = (s.n.grafts || 0) + 1;
      if (L.crime(0.1, 2, GRAFT[s.job.c][0].toLowerCase())) { s.job = null; L.note(`Sacked as ${t}, for having sticky fingers.`, 'big'); return 'An audit. A long silence. Then the boss, and behind the boss, a constable.'; }
      L.cash(got);
      return `${GRAFT[s.job.c][1]} ${money(got)}.`;
    },
  });
  def('cheat', {
    place: 'college', sec: 'Your course', icon: '🫣', title: 'Cheat in the exam', desc: 'Answers up your sleeve: a sure distinction, unless you are seen (one time in four).',
    show: (L) => !!L.s.course && !!L.s.course.exam,
    run(L) {
      const s = L.s, k = s.course;
      L.karma(-4);
      if (L.chance(0.25)) { s.course = null; L.joy(-8); L.note('Thrown off the course for cheating.'); return 'The invigilator stops at your desk and holds out a hand. You are off the course, and the fees are gone.'; }
      k.mark = k.p * 100; k.rev = 4;
      return `Nobody sees a thing. ${A.exam.run(L)}`;
    },
  });
  def('fiddle', {
    place: (L) => (L.s.biz ? A.bizWork.place(L) : null), sec: 'Your business', icon: '📒', title: 'Cook the books', per: 1, time: 0,
    desc: (L) => `Two sets of accounts: about ${money(L.bizTake() * 0.8)} the taxman never sees. About ${Math.round(L.riskOf(0.09) * 100)}% he sees it after all.`,
    show: (L) => !!L.s.biz,
    run(L) {
      const got = Math.round(L.bizTake() * 0.8 / 10) * 10;
      if (L.crime(0.09, 2, 'two sets of account books')) return 'A polite letter. Then a much less polite visit.';
      L.cash(got);
      return `A little creative arithmetic. ${money(got)}.`;
    },
  });
  def('bribeClerk', {
    place: 'townhall', sec: 'Under the counter', icon: '🗄️', title: 'Have your record lost', cost: (L) => 20000 * L.s.record, time: 0,
    desc: 'A clerk with gambling debts, a filing cabinet, a shredder. Usually works.',
    show: (L) => L.s.record > 0,
    run(L) {
      L.karma(-3);
      if (L.chance(0.8)) { L.s.record = 0; return 'The file goes into the shredder a page at a time. As far as Starling Bay knows, you have never put a foot wrong.'; }
      return 'The clerk takes the money and loses his nerve. Your record is exactly where it was.';
    },
  });

  // -- vices
  def('binge', {
    place: 'pub', sec: 'Vices', icon: '🥃', title: 'Drink until closing', desc: 'A wonderful evening. A terrible morning.', cost: 60,
    run(L) {
      const s = L.s;
      L.joy(9); L.rough(3, 'the drink'); L.gain('charm', 0.8);
      s.habit.drink = (s.habit.drink || 0) + 9; s.use.drink = 1;
      const r = L.rnd();
      if (r < 0.08) { const lost = Math.min(s.cash, 150); s.cash -= lost; return `You wake on the beach with one shoe${lost ? `, ${money(lost)} lighter,` : ''} and a traffic cone for a pillow.`; }
      if (r < 0.2) { const p = L.maybeMeet(1); if (p) return `You remember very little, but ${p.name} says you were hilarious, and has your telephone number on ${p.sex === 'm' ? 'his' : 'her'} arm.`; }
      return L.pick(['You sing. You are asked not to sing. You sing.', 'By midnight you love everyone in the Gull & Anchor, and have told them.', 'You win an argument about the offside rule, standing on a chair.']);
    },
  });
  def('brawl', {
    place: 'pub', sec: 'Vices', icon: '👊', title: 'Start a fight', desc: (L) => `Somebody looked at you funny. ${Math.round(L.checkOdds('fitness', 45) * 100)}% you win it.`, per: 2,
    why: (L) => (L.s.health < 30 ? 'You are in no state to.' : null),
    run(L) {
      const s = L.s, won = L.chance(L.checkOdds('fitness', 45));
      L.gain('fitness', 0.8);
      if (won) { L.joy(4); L.fame(0.3); s.n.fights = (s.n.fights || 0) + 1; } else L.rough(10, 'a fight');
      const nicked = L.crime(0.12, 1, 'a broken stool and somebody’s tooth');
      return `${won ? 'One punch, a table of spilled drinks, and he stays down.' : 'He is bigger than he looked sitting down.'}${nicked ? ' And then the constable is in the doorway.' : won ? ' The landlord bars you until Thursday.' : ' The landlord puts a steak on your eye.'}`;
    },
  });
  def('fling', {
    place: 'pub', sec: 'Vices', icon: '💋', title: 'Stray', cost: 30,
    desc: (L) => `Somebody new, just for tonight (${Math.round(L.wooOdds() * 100)}%). ${L.partner().name} need never know. Probably.`,
    show: (L) => !!L.partner(),
    run(L) {
      const s = L.s, p = L.partner();
      if (!L.chance(L.wooOdds())) { L.joy(-1); return 'You are turned down, loudly enough to be embarrassing.'; }
      L.joy(8); L.karma(-4); s.n.flings = (s.n.flings || 0) + 1;
      if (L.chance(0.3)) { L.queue('caughtOut', p.id); return 'A stranger, a wink, a walk along the dark end of the pier. Starling Bay is a very small town.'; }
      return 'A stranger, a wink, a walk along the dark end of the pier. Nobody saw. You think.';
    },
  });
  def('dust', {
    place: 'casino', sec: 'Under the pier', icon: '✨', title: 'Buy mermaid dust from Lenny', cost: 250, time: 0, per: 2,
    desc: 'The best you will feel all year. It takes it back with interest.',
    run(L) {
      const s = L.s;
      L.joy(16); L.rough(4, 'mermaid dust'); L.lose('smarts', 0.2);
      s.habit.dust = (s.habit.dust || 0) + 17; s.use.dust = 1;
      if (L.crime(0.04, 1, 'a paper twist of mermaid dust')) return 'Lenny runs. You are too happy to.';
      return L.pick(['The lights on the pier have never been so beautiful.', 'You understand everything. You forget it by morning.', 'You dance with a fruit machine for an hour.']);
    },
  });
  def('rehab', {
    place: 'hospital', sec: 'Care', icon: '🧃', title: 'Dry out at the clinic', desc: 'Three hard weeks. You come out clean.', cost: (L) => L.medCost(3500), time: 3,
    show: (L) => Object.values(L.s.habit).some((n) => n >= 30),
    run(L) { L.s.habit = {}; L.s.f.clean = 1; L.joy(-4); L.hp(6); L.note('Got clean at St Wren’s.', 'big'); return 'Shaking, sweating, a great deal of tea. And then one morning you notice the birds.'; },
  });

  // -- leaning on people
  def('scrounge', {
    who: true, sec: 'Behave badly', icon: '🫴', title: 'Ask for money', time: 0,
    desc: (L, p) => `You have no intention of paying it back. ${Math.round(L.checkOdds('charm', 45) * 100)}% ${p.sex === 'm' ? 'he' : 'she'} coughs up.`,
    show: (L, p) => p.kind !== 'child' || p.age >= 18,
    why: (L, p) => (L.s.t - (p.asked ?? -99) < 4 ? `You asked ${p.sex === 'm' ? 'him' : 'her'} not long ago.` : p.bond < 15 ? 'You are hardly on speaking terms.' : null),
    run(L, p) {
      p.asked = L.s.t; L.karma(-1);
      if (!L.chance(L.checkOdds('charm', 45))) { L.bond(p, -12); return `${p.name} gives you a long look instead.`; }
      const got = Math.round((p.kind === 'parent' ? 600 : 250) * (1 + p.bond / 40) * (1 + L.rnd()) / 10) * 10;
      L.cash(got); L.bond(p, -8);
      return `${p.name} finds ${money(got)} for you, and says not to worry about it in a voice that means the opposite.`;
    },
  });

  Object.assign(Life.prototype, {
    heistOdds() { const s = this.s; return clamp(0.2 + s.st.smarts / 250 + s.st.fitness / 400 + (s.job && s.job.c === 'crew' ? s.job.r * 0.05 : 0) - s.heat / 400 + this.luck(), 0.08, 0.75); },
    // The property you'd miss least: the most valuable one you don't live in.
    spare() { return this.s.estate.filter((e) => e.id !== this.s.homeAt).sort((a, b) => this.propValue(b) - this.propValue(a))[0] || null; },
  });
}
