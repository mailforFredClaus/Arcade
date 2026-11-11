// New in Town: the bigger parts of a life. The people in it (friends,
// sweethearts, children), the property you own, a business of your own,
// and the fish in the bay. engine.js hands over its tools and these are
// added to them: more actions, and more that a Life can do.

import {
  STATS, STAT_NAME, PLACES, CAREERS, HOMES, UPGRADES, PROPS, BUSINESSES, FISH, OUTINGS, KID_PLAY, TRAITS,
  NAMES_M, NAMES_F, SURNAMES, DATE_LINES, money, low,
} from './data.js';

export function install({ def, A, Life, clamp }) {
  const kindOf = (k) => HOMES[k] || PROPS[k];
  const he = (p) => (p.sex === 'm' ? 'he' : 'she');
  const his = (p) => (p.sex === 'm' ? 'his' : 'her');
  const CLOSE = ['friend', 'partner', 'spouse'];

  // ---- people -----------------------------------------------------------------------------

  Object.assign(Life.prototype, {
    freshName(sex) {
      const used = new Set(this.s.people.map((p) => p.name)), names = sex === 'm' ? NAMES_M : NAMES_F;
      for (let i = 0; i < 30; i++) {
        const n = `${this.pick(names)} ${this.pick(SURNAMES)}`;
        if (!used.has(n)) return n;
      }
      return `${this.pick(names)} ${this.pick(SURNAMES)}`;
    },
    // Someone new, not yet anybody to you. o: anything already decided.
    makePerson(o = {}) {
      const s = this.s, sex = o.sex || (this.chance(0.5) ? 'm' : 'f');
      const p = Object.assign({
        id: s.pid++, name: o.name || this.freshName(sex), sex, kind: 'friend', bond: 18,
        age: clamp(s.age + this.int(-5, 5), 18, 95), trait: this.pick(Object.keys(TRAITS)),
        look: this.randomLook(sex), single: this.chance(0.55),
      }, o);
      p.sex = sex;
      if (!p.look) p.look = this.randomLook(sex);
      return this.fillPerson(p);
    },
    // The rest of a person: a job, what they love doing, whether they want children.
    fillPerson(p) {
      if (p.kind === 'child') {
        if (!p.st) p.st = Object.fromEntries(STATS.map((k) => [k, Math.min(40, 5 + p.age * 1.4)]));
        if (p.age < 18) return p;
      }
      if (p.kind === 'grandchild' && p.age < 18) return p;
      if (!p.job) p.job = this.pick(Object.keys(CAREERS));
      if (!p.likes) {
        const first = { bookish: 'talk', sporty: 'walk', witty: 'pub', arty: 'film', kind: 'coffee' }[p.trait];
        const a = this.chance(0.6) ? first : this.pick(Object.keys(OUTINGS));
        p.likes = [a, this.pick(Object.keys(OUTINGS).filter((k) => k !== a))];
      }
      if (!p.known) p.known = {};
      if (p.wish == null) p.wish = this.chance(0.75);
      return p;
    },
    meet(o = {}) {
      const p = this.makePerson(o);
      this.s.people.push(p);
      if (p.kind === 'friend') this.say('👋', `You made a friend: ${p.name}`, 'good');
      return p;
    },
    maybeMeet(ch) { return this.friends().length < 20 && this.chance(ch) ? this.meet() : null; },
    // Could you fall for them?
    fancy(p) { return this.s.into === 'b' || this.s.into === p.sex; },
    // What their job is called.
    jobOf(p) {
      if (!p.job || !CAREERS[p.job]) return '';
      const r = CAREERS[p.job].rungs;
      return r[clamp(Math.floor((p.age - 18) / 7), 0, r.length - 2)].title;
    },
    wooOdds() { const s = this.s; return clamp(0.3 + s.st.charm / 170 + s.fame / 300 + (s.items.suit ? 0.04 : 0) + this.luck(), 0.1, 0.92); },
    // ---- a first date: s.date is who it is with (p: someone new, or id: a friend) ----
    dateWith() { const d = this.s.date; return d ? d.p || this.person(d.id) : null; },
    // The three things you might try: the one that suits them and two that
    // do not, in an order that depends on who it is. (No dice: reading them is up to you.)
    dateLines() {
      const p = this.dateWith(), wrong = Object.keys(DATE_LINES).filter((k) => k !== p.trait), n = p.id + p.age;
      const three = [p.trait, wrong[n % 4], wrong[(n % 4 + 1 + (n >> 2) % 3) % 4]];
      return [0, 1, 2].map((i) => three[(i + n) % 3]).map((k) => ({ k, t: DATE_LINES[k].t(p) }));
    },
    // How the date goes, having tried approach k.
    dateGo(k) {
      const s = this.s, d = s.date, p = this.dateWith();
      s.date = null;
      if (!p || this.partner()) return 'You think better of it.';
      const right = k === p.trait, friend = d.from === 'friend';
      const said = right ? DATE_LINES[k].good(p) : DATE_LINES[k].bad(p);
      if (!this.chance(clamp((friend ? this.askOdds(p) : this.wooOdds()) + (right ? 0.22 : -0.15), 0.04, 0.97))) {
        if (friend) { p.single = false; this.bond(p, -6); this.joy(-4); return `${said} ${p.name} is kind about it afterwards. Friends, then.`; }
        this.joy(-1);
        return `${said} ${d.from === 'pub' ? this.pick(['"I am waiting for someone," comes next, and then nobody arrives.', 'You knock a drink into a lap. It does not recover from there.', 'The taxi is called early.']) : this.pick([`${p.name} never replies to your message.`, `The rest is forty minutes about ${his(p)} ex.`, `${p.name} cancels the second date, twice, then moves to the city.`])}`;
      }
      if (friend) { this.bond(p, 10); return this.startSeeing(p, `${said} ${p.name} says ${he(p)} thought you would never ask.`); }
      Object.assign(p, { kind: 'partner', bond: right ? 28 : 22, single: false });
      s.people.push(p);
      return this.startSeeing(p, d.from === 'pub' ? `${said} ${p.name}: ${TRAITS[p.trait].name.toLowerCase()}, ${this.jobOf(p).toLowerCase()}, and free on Friday.` : `${said} Neither of you looks at a phone once. You are seeing ${p.name} again on Saturday.`);
    },
    askOdds(p) { return clamp(0.25 + (this.s.st.charm - 30) / 110 + (p.bond - 30) / 110 + this.luck(), 0.1, 0.95); },
    proposeOdds(p) { return clamp((p.bond - 45) / 50 + this.luck(), 0.2, 1); },
    // Three people on the dating app, new every season.
    prospects() {
      const s = this.s;
      if (!s.matches) {
        s.matches = [];
        for (let i = 0; i < 3; i++) {
          const sex = s.into === 'b' ? (this.chance(0.5) ? 'm' : 'f') : s.into;
          s.matches.push(this.makePerson({ sex, single: true, age: clamp(s.age + this.int(-6, 6), 18, 90) }));
        }
      }
      return s.matches;
    },
    // Whether the two of you could have a baby the usual way.
    conceiveWhy(p) {
      const s = this.s, mum = s.sex === 'f' ? s : p;
      if (s.sex === p.sex) return 'You two would adopt: ask at the Town Hall.';
      if (mum.age > 45) return 'It is too late for that. You could adopt: ask at the Town Hall.';
      return null;
    },
    startSeeing(p, how) {
      p.kind = 'partner'; p.single = false;
      this.joy(8);
      this.note(`Started seeing ${p.name}.`, 'love');
      this.say('💘', `You are seeing ${p.name}`, 'good');
      return how;
    },
    // yours: it was your doing. grudge: how hard they take it.
    split(p, yours, grudge = yours ? 30 : 15) {
      const s = this.s;
      let text;
      // A baby on the way goes with its mother.
      if (s.due && !s.due.adopt && s.sex !== 'f') s.due = null;
      if (p.kind === 'spouse') {
        const half = Math.round((s.cash + s.bank) * (this.perk('law') ? 0.3 : 0.4));
        const fromCash = Math.min(s.cash, half);
        s.cash -= fromCash; s.bank -= half - fromCash;
        for (const k of this.kids()) this.bond(k, -15);
        this.joy(-15);
        s.f.divorced = 1;
        this.note(`Divorced ${p.name}.`, 'love');
        text = `It is over. The lawyers take their time and ${p.name} takes ${money(half)}.`;
        this.makeEx(p, Math.max(45, grudge));
        return text;
      }
      this.joy(yours ? -5 : -10);
      this.note(`Split up with ${p.name}.`, 'love');
      // After a gentle parting you may stay friends.
      if (yours && p.bond >= 40 && !p.eng) {
        Object.assign(p, { kind: 'friend', bond: 30, single: true, live: false });
        return `You tell ${p.name} it is not working. A long evening, but ${he(p)} takes it well: friends, then.`;
      }
      this.makeEx(p, grudge);
      return yours ? `You tell ${p.name} it is not working. It is a long evening.` : `${p.name} is gone.`;
    },
    // A child, a year older.
    growUp(p) {
      if (p.age <= 18) {
        for (const k of STATS) p.st[k] = Math.min(100, p.st[k] + 1.4 + (TRAITS[p.trait].stat === k ? 0.6 : 0) + (p.bond >= 60 ? 0.3 : 0));
      }
      if (p.age === 18) {
        // They go into whatever they are best at.
        const top = STATS.slice().sort((a, b) => p.st[b] - p.st[a])[0];
        p.job = this.pick({ smarts: ['tech', 'medicine', 'law', 'teaching', 'finance'], fitness: ['sports', 'trades', 'sea', 'police'], charm: ['retail', 'politics'], craft: ['kitchen', 'arts'] }[top]);
        p.priv = false;
        this.fillPerson(p);
        this.queue('kid18', p.id);
      }
      if (p.age >= 26 && p.age <= 38 && (p.gk || 0) < 3 && this.chance(0.12)) { p.gk = (p.gk || 0) + 1; this.queue('grandchild', p.id); }
    },
    // What you can do with someone, for their sheet.
    personActions(p) {
      const out = [];
      for (const a of PEOPLE.map((id) => A[id]).filter(Boolean)) {
        if (a.id === 'out') { for (const k of Object.keys(OUTINGS)) if (a.show(this, p)) out.push(this.view(a, { p: p.id, a: k })); }
        else if (a.id === 'kid') { for (const k of Object.keys(KID_PLAY)) if (a.show(this, p)) out.push(this.view(a, { p: p.id, a: k })); }
        else if (!a.show || a.show(this, p, {})) out.push(this.view(a, p.id));
      }
      return out;
    },
  });

  def('out', {
    who: true, sec: 'Do something together',
    icon: (L, p, x) => OUTINGS[x.a].icon, title: (L, p, x) => OUTINGS[x.a].name, cost: (L, p, x) => OUTINGS[x.a].cost,
    desc: (L, p, x) => (p.known[x.a] ? (p.likes.includes(x.a) ? `♥ ${p.name.split(' ')[0]} loves this.` : 'Pleasant enough.') : 'See how it goes down.'),
    show: (L, p) => CLOSE.includes(p.kind) || p.kind === 'sibling' || ((p.kind === 'child' || p.kind === 'grandchild') && p.age >= 18),
    why: (L, p, x) => (!OUTINGS[x.a] ? 'No such thing.' : OUTINGS[x.a].not === L.season ? 'Not in winter.' : null),
    run(L, p, x) {
      const o = OUTINGS[x.a], loved = p.likes.includes(x.a), first = !p.known[x.a];
      p.known[x.a] = 1;
      L.bond(p, (o.big ? 9 : 7) * (loved ? 1.6 : 1) + (p.trait === 'kind' ? 2 : 0));
      L.joy(loved ? 5 : 3);
      if (o.stat) L.gain(o.stat, 1.2);
      if (TRAITS[p.trait].stat) L.gain(TRAITS[p.trait].stat, 0.6);
      return `${L.pick(o.text)}${loved ? (first ? ` You have found something ${p.name.split(' ')[0]} loves.` : ` ${p.name.split(' ')[0]} is in ${his(p)} element.`) : ''}`;
    },
  });
  def('kid', {
    who: true, sec: 'Time together',
    icon: (L, p, x) => KID_PLAY[x.a].icon, title: (L, p, x) => KID_PLAY[x.a].name, cost: (L, p, x) => KID_PLAY[x.a].cost || 0,
    desc: (L, p, x) => (KID_PLAY[x.a].stat ? `Brings on ${his(p)} ${STAT_NAME[KID_PLAY[x.a].stat]} (${Math.floor(p.st[KID_PLAY[x.a].stat])}).` : 'Just for the fun of it.'),
    show: (L, p) => p.kind === 'child' && p.age < 18,
    why: (L, p, x) => (!KID_PLAY[x.a] ? 'No such thing.' : KID_PLAY[x.a].stat && p.age < 2 ? `${p.name} is too little yet.` : null),
    run(L, p, x) {
      const k = KID_PLAY[x.a];
      L.bond(p, k.stat ? 7 : 10); L.joy(k.stat ? 4 : 6);
      if (k.stat) p.st[k.stat] = Math.min(100, p.st[k.stat] + 2.5);
      return k.text;
    },
  });
  def('school', {
    who: true, sec: 'Schooling', icon: '🏫', time: 0,
    title: (L, p) => (p.priv ? 'Back to the village school' : 'Send to St Wren’s School'),
    desc: (L, p) => (p.priv ? `Free, and all ${his(p)} friends are there.` : `$2,500 a season. ${he(p) === 'he' ? 'His' : 'Her'} Smarts and Charm grow faster.`),
    show: (L, p) => p.kind === 'child' && p.age >= 4 && p.age < 18,
    run(L, p) { p.priv = !p.priv; return p.priv ? `${p.name} looks very small in the blazer.` : `${p.name} is back with the old gang by lunchtime.`; },
  });
  def('call', {
    who: true, sec: 'Keep in touch', title: 'Call for a chat', icon: '📞', desc: 'A good long natter.',
    show: (L, p) => p.kind === 'parent' || p.kind === 'sibling' || ((p.kind === 'child' || p.kind === 'grandchild') && p.age >= 16),
    run(L, p) { L.bond(p, 7); L.joy(2); return p.kind === 'parent' ? `${p.name} asks if you are eating properly. You lie.` : `${p.name} tells you all ${his(p)} news. You hang up smiling.`; },
  });
  def('gift', {
    who: true, sec: 'Keep in touch', title: 'Give a present', icon: '🎁', desc: 'Once a season.', time: 0, cost: 80,
    show: (L, p) => p.kind !== 'ex' && p.kind !== 'enemy' && (p.kind !== 'child' || p.age >= 3),
    why: (L, p) => (L.s.use[`gift${p.id}`] ? 'Once a season.' : null),
    run(L, p) { L.s.use[`gift${p.id}`] = 1; L.bond(p, 6); return `${p.name} ${L.pick(['is delighted', 'pretends to be surprised', 'says you should not have, twice'])}.`; },
  });
  def('askout', {
    who: true, sec: 'Love', title: (L, p) => `Ask ${p.sex === 'm' ? 'him' : 'her'} out`, icon: '💐', desc: (L, p) => `About ${Math.round(L.askOdds(p) * 100)}%, and better if you play it the way ${he(p)} would like.`,
    show: (L, p) => p.kind === 'friend' && p.single && L.fancy(p) && !L.partner(),
    why: (L, p) => (p.bond < 30 ? 'Get to know each other a little first (30 bond).' : null),
    run(L, p) { L.s.date = { id: p.id, from: 'friend' }; L.queue('date'); return `${p.name} looks surprised, then pleased. "Friday?"`; },
  });
  def('movein', {
    who: true, sec: 'Love', title: 'Move in together', icon: '🔑', desc: 'Share a home, and the bills.', time: 0,
    show: (L, p) => p.kind === 'partner' && !p.live,
    why: (L, p) => (L.s.home === 'hostel' ? 'Not into a hostel bunk.' : p.bond < 60 ? 'Too soon (60 bond).' : null),
    run(L, p) { p.live = true; L.joy(5); L.note(`Moved in with ${p.name}.`, 'love'); return `${p.name} arrives with eleven boxes and a lamp you hate. Home feels more like home.`; },
  });
  def('propose', {
    who: true, sec: 'Love', title: 'Propose', icon: '💍', desc: (L, p) => `You will need a ring. Your chances: ${Math.round(L.proposeOdds(p) * 100)}%.`, time: 0,
    show: (L, p) => p.kind === 'partner' && !p.eng,
    why: (L, p) => (p.bond < 75 ? 'Not yet (75 bond).' : !L.s.items.ring ? 'Buy a ring on the High Street first.' : null),
    run(L, p) {
      if (L.chance(L.proposeOdds(p))) { p.eng = true; delete L.s.items.ring; L.joy(12); L.bond(p, 6); L.note(`Got engaged to ${p.name}.`, 'love'); return `Down on one knee on the pier. ${p.name} says yes before you finish the question. The wedding is next season!`; }
      L.bond(p, -12); L.joy(-8);
      return `${p.name} takes your hands and says: not yet. You keep the ring.`;
    },
  });
  def('baby', {
    who: true, sec: 'Love', title: 'Try for a baby', icon: '🍼', desc: 'A big step.',
    show: (L, p) => p.kind === 'spouse' || (p.kind === 'partner' && p.live),
    why: (L, p) => L.conceiveWhy(p) || (!p.wish ? `${p.name} does not want children.` : L.s.due ? 'There is already a little one on the way.' : L.roomForKid() ? null : 'You need a home with room for a child.'),
    run(L, p) {
      if (L.chance(0.55)) { L.s.due = { t: L.s.t + 3 }; L.joy(8); L.bond(p, 4); return `Good news: you and ${p.name} are expecting!`; }
      L.bond(p, 2);
      return 'Not this time. These things take a while.';
    },
  });
  def('split', {
    who: true, sec: 'Love', title: (L, p) => (p.kind === 'spouse' ? 'Divorce' : 'Break up'), icon: '💔', desc: (L, p) => (p.kind === 'spouse' ? `${he(p) === 'he' ? 'He keeps' : 'She keeps'} ${L.perk('law') ? '30' : '40'}% of your money.` : 'End it.'), time: 0,
    show: (L, p) => p.kind === 'partner' || p.kind === 'spouse',
    run(L, p) { return L.split(p, true); },
  });
  def('forget', {
    who: true, sec: (L, p) => (p.kind === 'ex' ? 'Old flames' : 'Keep in touch'), title: (L, p) => (p.kind === 'ex' ? `Lose ${p.sex === 'm' ? 'his' : 'her'} number` : 'Lose touch'), icon: '👋', desc: (L, p) => (p.kind === 'ex' ? 'It is over. Let it be over.' : 'Let this friendship go.'), time: 0,
    show: (L, p) => p.kind === 'friend' || p.kind === 'ex',
    run(L, p) { L.s.people.splice(L.s.people.indexOf(p), 1); return p.kind === 'ex' ? `You tear the page out of your address book. ${p.name} is the past.` : `You stop calling. So does ${p.name}. It happens.`; },
  });
  const PEOPLE = ['out', 'kid', 'askout', 'movein', 'propose', 'baby', 'split', 'school', 'call', 'gift', 'treat', 'winback', 'oldtimes', 'mend', 'prank', 'rumour', 'thump', 'lean', 'forget', 'scrounge'];

  // Meeting someone with romance in mind, no friendship first.
  def('chatup', {
    place: 'pub', sec: 'Mingle', icon: '😉', title: 'Chat someone up', cost: 30,
    desc: (L) => `Buy a drink for someone who has caught your eye. About ${Math.round(L.wooOdds() * 100)}%, and better if you read them right.`,
    show: (L) => !L.partner(),
    run(L) {
      const s = L.s, sex = s.into === 'b' ? (L.chance(0.5) ? 'm' : 'f') : s.into;
      L.gain('charm', 1);
      s.date = { p: L.makePerson({ sex, single: true, age: clamp(s.age + L.int(-5, 5), 18, 90) }), from: 'pub' };
      L.queue('date');
      return 'You take your drink along the bar.';
    },
  });
  def('datingOpen', { place: 'home', sec: 'At home', icon: '💘', title: 'Seaside Singles', desc: 'The dating app. Three new faces every season.', time: 0, open: 'dating', show: (L) => !!L.s.items.phone && !L.partner() });
  def('match', {
    title: 'Ask on a date', cost: 60,
    why: (L, i) => (L.partner() ? 'You are spoken for.' : L.prospects()[i] ? null : 'They have gone.'),
    run(L, i) {
      const s = L.s, p = s.matches.splice(i, 1)[0];
      s.date = { p, from: 'app' };
      L.queue('date');
      return `${p.name} says yes to a coffee.`;
    },
  });
  def('rematch', {
    title: 'Look for new faces',
    run(L) { L.s.matches = null; L.prospects(); return 'You swipe until your thumb aches. Three new faces.'; },
  });

  // ---- property ---------------------------------------------------------------------------

  Object.assign(Life.prototype, {
    estateOf(id) { return this.s.estate.find((e) => e.id === id) || null; },
    // The home you live in, if it is yours.
    homeEntry() { return this.estateOf(this.s.homeAt); },
    owns(kind) { return this.s.estate.some((e) => e.kind === kind); },
    propName(e) { return kindOf(e.kind).name; },
    // As said in the middle of a sentence.
    propSaid(e) { return low(kindOf(e.kind).name); },
    // What a home costs to rent today: rents rise with prices.
    rentOf(kind) { return Math.round(HOMES[kind].rent * this.s.idx / 10) * 10; },
    // What a kind of property sells for today.
    propPrice(kind) { return Math.round(kindOf(kind).price * this.s.idx / 1000) * 1000; },
    // What one of yours is worth, with whatever has been done to it.
    propValue(e) {
      const more = Object.keys(e.ups).reduce((a, id) => a + UPGRADES[id].cost, 0);
      return Math.round((kindOf(e.kind).price + more) * this.s.idx / 1000) * 1000;
    },
    // What it brings in each season, let out.
    propEarn(e) { return Math.round(this.propValue(e) * kindOf(e.kind).earn); },
    estateWorth() { return this.s.estate.reduce((a, e) => a + this.propValue(e), 0); },
    letIncome() { return this.s.estate.reduce((a, e) => a + (e.let ? this.propEarn(e) : 0), 0); },
    homeWorth() { const e = this.homeEntry(); return e ? this.propValue(e) : 0; },
    comfort() { const e = this.homeEntry(); return HOMES[this.s.home].comfort + (e ? Object.keys(e.ups).reduce((a, id) => a + UPGRADES[id].comfort, 0) : 0); },
    kidRoom() { const e = this.homeEntry(); return HOMES[this.s.home].kids + (e && e.ups.extension ? 1 : 0); },
    roomForKid() { return this.kids().filter((k) => k.age < 18).length < this.kidRoom(); },
    // How a purchase would be paid for: outright if you can; otherwise a
    // fifth down and the rest on a loan. trade: your present home is sold
    // towards it.
    buyPlan(kind, trade) {
      const s = this.s, price = this.propPrice(kind), old = trade ? this.homeEntry() : null;
      const sale = old ? Math.round(this.propValue(old) * 0.97) : 0, have = s.cash + s.bank;
      if (have + sale >= price) return { price, cash: price - sale, loan: 0, sale, ok: true };
      const down = Math.ceil(price * 0.2), put = Math.max(down, sale), loan = price - put;
      const limit = this.creditLimit() - (old ? 0.8 * this.propValue(old) : 0) + 0.8 * price;
      return { price, down, cash: put - sale, loan, sale, ok: have >= put - sale && s.debt + loan <= limit && !this.blacklisted() };
    },
    planWhy(p) {
      const s = this.s;
      if (p.ok) return null;
      return s.cash + s.bank < p.cash ? `You need ${money(p.cash)} towards it (a fifth has to be paid down).` : this.blacklisted() ? 'The bank remembers your bankruptcy.' : 'The bank will not lend you enough.';
    },
    // Why you couldn't live in a kind of home (the family, mostly).
    // e: the property itself, if it is one of yours (it may have an extra bedroom).
    liveWhy(kind, e = null) {
      const s = this.s, h = HOMES[kind];
      if (!h) return 'Nobody could live there.';
      const room = h.kids + (e && e.ups.extension ? 1 : 0), young = this.kids().filter((k) => k.age < 18).length;
      if (young > room) return 'No room for the children there.';
      if (s.due && young + 1 > room) return 'No room there for the little one on the way.';
      if (kind === 'hostel' && this.partner()?.live) return 'Your other half will not live in a hostel.';
      if (kind === 'hostel' && s.pet) return 'No pets in the hostel.';
      return null;
    },
    settleIn(kind, e) {
      const s = this.s, was = HOMES[s.home].tier;
      s.home = kind; s.homeAt = e ? e.id : null; s.owned = !!e;
      for (const p of s.people) if (p.kind === 'spouse') p.live = kind !== 'hostel';
      this.joy(HOMES[kind].tier > was ? 6 : HOMES[kind].tier < was ? -3 : 0);
    },
    pay(p) { if (p.cash < 0) this.s.cash -= p.cash; else this.cash(-p.cash); this.s.debt += p.loan; },
    // Work that could be done on the home you own and live in, as rows for its sheet.
    homeWorks() {
      const e = this.homeEntry(), out = [];
      if (!e) return out;
      for (const [id, u] of Object.entries(UPGRADES)) {
        const done = !!e.ups[id];
        const row = (diy) => Object.assign(this.view(A.improve, { id, diy }), { icon: u.icon, sec: 'Improvements', owned: done, title: diy ? `${u.name}: do it yourself` : u.name, desc: diy && !done ? `${u.blurb} Needs Craft ${u.diy}.` : u.blurb });
        out.push(row(false));
        if (u.diy && !done) out.push(row(true));
      }
      return out;
    },
  });

  def('rentHome', {
    cost: (L, kind) => (HOMES[kind] && HOMES[kind].rent != null ? Math.round(L.rentOf(kind) / 2) : 0),
    why(L, kind) {
      const h = HOMES[kind];
      if (!h || h.rent == null) return 'Not on offer.';
      if (L.s.home === kind && !L.s.owned) return 'You live here.';
      return L.liveWhy(kind);
    },
    run(L, kind) {
      const s = L.s, old = L.homeEntry(), h = HOMES[kind];
      L.settleIn(kind, null);
      L.note(`Moved into the ${low(h.name)}.`);
      return `You move into the ${low(h.name)}. ${h.blurb}${old ? ` Your ${L.propSaid(old)} stands empty: let it out or sell it, under Your property.` : ''}`;
    },
  });
  // x: { id: the kind of home, trade: sell the one you live in towards it }.
  def('buyHome', {
    selfPay: true, cost: (L, x) => Math.max(0, L.buyPlan(x.id, x.trade).cash),
    why(L, x) {
      const h = HOMES[x.id], home = L.homeEntry();
      if (!h || h.price == null) return 'Not for sale.';
      if (home && home.kind === x.id) return 'You own one, and live in it.';
      if (x.trade && !home) return 'You have no home of your own to trade in.';
      if (!x.trade && L.s.estate.length >= 12) return 'A dozen properties is plenty to look after.';
      return L.liveWhy(x.id) || L.planWhy(L.buyPlan(x.id, x.trade));
    },
    run(L, x) {
      const s = L.s, h = HOMES[x.id], p = L.buyPlan(x.id, x.trade), old = L.homeEntry();
      L.pay(p);
      if (x.trade) s.estate.splice(s.estate.indexOf(old), 1);
      const e = { id: s.eid++, kind: x.id, ups: {}, let: false };
      s.estate.push(e);
      L.settleIn(x.id, e);
      L.note(`Bought the ${low(h.name)} for ${money(p.price)}.`, 'big');
      const how = p.loan ? `${money(p.price - p.loan)} down and ${money(p.loan)} borrowed` : `${money(p.price)}, paid outright`;
      if (x.trade) return `You sell the ${L.propSaid(old)} for ${money(p.sale)} and get the keys to the ${low(h.name)}: ${how}.`;
      return `You get the keys to the ${low(h.name)}: ${how}.${old ? ` The ${L.propSaid(old)} is still yours: let it out or sell it, under Your property.` : ''}`;
    },
  });
  // Buying somewhere to let out, not to live in.
  def('buyLet', {
    selfPay: true, cost: (L, kind) => Math.max(0, L.buyPlan(kind, false).cash),
    why(L, kind) {
      const k = kindOf(kind);
      if (!k || k.price == null) return 'Not for sale.';
      if (L.s.estate.length >= 12) return 'A dozen properties is plenty to look after.';
      return L.planWhy(L.buyPlan(kind, false));
    },
    run(L, kind) {
      const s = L.s, p = L.buyPlan(kind, false);
      L.pay(p);
      const e = { id: s.eid++, kind, ups: {}, let: true };
      s.estate.push(e);
      L.note(`Bought a ${L.propSaid(e)} to let out.`);
      return `The ${L.propSaid(e)} is yours${p.loan ? ` (${money(p.loan)} of it borrowed)` : ''}, and a tenant moves in. It should bring in about ${money(L.propEarn(e))} a season.`;
    },
  });
  def('letProp', {
    time: 0,
    why(L, id) {
      const e = L.estateOf(id);
      if (!e) return 'It is not yours.';
      if (e.id === L.s.homeAt) return 'You live there.';
      return e.let && PROPS[e.kind] ? 'It is no use to anyone empty.' : null;
    },
    run(L, id) { const e = L.estateOf(id); e.let = !e.let; return e.let ? `A tenant takes the ${L.propSaid(e)}: about ${money(L.propEarn(e))} a season.` : `You give the tenant notice. The ${L.propSaid(e)} stands empty.`; },
  });
  def('sellEstate', {
    time: 0,
    why(L, id) {
      const e = L.estateOf(id);
      if (!e) return 'It is not yours.';
      return e.id === L.s.homeAt ? 'You live there. Move out first, or trade it in when you buy.' : null;
    },
    run(L, id) {
      const s = L.s, e = L.estateOf(id), got = Math.round(L.propValue(e) * 0.96);
      s.estate.splice(s.estate.indexOf(e), 1);
      s.cash += got;
      // The bank takes back whatever it would no longer lend against.
      const over = Math.min(got, Math.max(0, s.debt - L.creditLimit()));
      s.cash -= over; s.debt -= over;
      return `The ${L.propSaid(e)} sells for ${money(got)} after fees${over ? ` (${money(over)} of it goes to the bank, towards your loan)` : ''}.`;
    },
  });
  def('moveIn', {
    why(L, id) {
      const e = L.estateOf(id);
      if (!e) return 'It is not yours.';
      if (e.id === L.s.homeAt) return 'You live there.';
      return L.liveWhy(e.kind, e);
    },
    run(L, id) {
      const e = L.estateOf(id), was = e.let, old = L.homeEntry();
      e.let = false;
      L.settleIn(e.kind, e);
      L.note(`Moved into the ${L.propSaid(e)}.`);
      return `${was ? 'The tenant moves out, and you' : 'You'} move into your ${L.propSaid(e)}.${old ? ` The ${L.propSaid(old)} stands empty.` : ''}`;
    },
  });
  // x: { id: which improvement, diy: do it yourself }.
  def('improve', {
    time: (L, x) => (x.diy ? UPGRADES[x.id].time : 0),
    cost: (L, x) => Math.round(UPGRADES[x.id].cost * (x.diy ? 1 / 3 : 1) * (L.perk('trades') ? 0.7 : 1)),
    why(L, x) {
      const u = UPGRADES[x.id], e = L.homeEntry();
      if (!u) return 'No such work.';
      if (!e) return 'Only in a home you own.';
      if (e.ups[x.id]) return 'Done already.';
      if (x.diy && !u.diy) return 'That is a job for the professionals.';
      return x.diy && L.s.st.craft < u.diy ? `Needs Craft ${u.diy}.` : null;
    },
    run(L, x) {
      const u = UPGRADES[x.id], e = L.homeEntry();
      e.ups[x.id] = 1;
      L.joy(4);
      if (!x.diy) return `The builders are in for a fortnight. Then: a ${u.name.toLowerCase()}. ${u.blurb}`;
      L.gain('craft', 2.5); L.s.f.diy = 1;
      return `Weekends of sawdust and swearing, and it is done: a ${u.name.toLowerCase()}, built with your own hands. ${u.blurb}`;
    },
  });
  def('estateOpen', { place: 'home', sec: 'Moving', icon: '🏘️', title: 'Your property', desc: 'What you own: live in it, let it out, or sell it.', time: 0, open: 'estate', show: (L) => L.s.estate.length > 0 });

  // ---- a business of your own -------------------------------------------------------------

  Object.assign(Life.prototype, {
    bizName() { const b = this.s.biz; return b ? BUSINESSES[b.type].names[b.lvl] : ''; },
    // What a good spell of work in it brings in.
    bizTake() {
      const s = this.s, b = s.biz;
      if (!b) return 0;
      const k = BUSINESSES[b.type], skill = s.st[k.stats[0]] * 0.6 + s.st[k.stats[1]] * 0.4;
      return k.take[b.lvl] * (0.5 + skill / 100) * (0.7 + b.rep / 200) * (s.heir === 'founder' ? 1.15 : 1) * (1 + 0.07 * s.eco);
    },
    // What it earns in a season without you: nothing while it is only you,
    // a little once there are staff, most of it with a manager.
    bizIdle() { const b = this.s.biz; return b && b.lvl >= 1 ? Math.round(this.bizTake() * (b.mgr ? 0.8 : 0.25) / 10) * 10 : 0; },
    bizWorth() {
      const b = this.s.biz;
      if (!b) return 0;
      const k = BUSINESSES[b.type];
      // (Its goodwill is worth nothing until it has been going a while.)
      return Math.round((k.cost.slice(0, b.lvl + 1).reduce((a, n) => a + n, 0) * 0.6 + this.bizTake() * Math.min(4, b.age / 2)) / 100) * 100;
    },
    bizCost(lvl) { return Math.round(BUSINESSES.food.cost[lvl] * (lvl === 0 && this.s.heir === 'founder' ? 0.5 : 1)); },
    // The end of a season in the life of the business.
    bizSeason() {
      const b = this.s.biz;
      if (!b) return;
      b.age++;
      if (this.s.use.biz) return;
      b.rep = clamp(b.rep + (b.mgr ? Math.sign(55 - b.rep) * 2 : -4), 0, 100);
    },
  });
  const bizPlace = (L) => (L.s.biz ? BUSINESSES[L.s.biz.type].place : null);
  def('bizOpen', { place: 'townhall', sec: 'Work', icon: '🏪', title: 'Start a business', desc: 'Be your own boss.', time: 0, open: 'biz', show: (L) => !L.s.biz });
  def('bizStart', {
    cost: (L) => L.bizCost(0),
    why(L, type) {
      const k = BUSINESSES[type];
      if (!k) return 'No such trade.';
      if (L.s.biz) return 'One business is plenty.';
      return L.s.st[k.stats[0]] < k.skill[0] ? `Needs ${STAT_NAME[k.stats[0]]} ${k.skill[0]}.` : null;
    },
    run(L, type) {
      const k = BUSINESSES[type];
      L.s.biz = { type, lvl: 0, rep: 30, mgr: false, age: 0, at: L.s.t };
      L.joy(6);
      L.note(`Went into business: a ${k.names[0].toLowerCase()}.`, 'big');
      return `You are in business. Your ${k.names[0].toLowerCase()} is at ${PLACES[k.place].name}: work in it to bring in money and build its name.`;
    },
  });
  def('bizWork', {
    place: bizPlace, sec: 'Your business', icon: (L) => BUSINESSES[L.s.biz.type].icon, time: 2,
    title: (L) => `Work in your ${L.bizName().toLowerCase()}`,
    desc: (L) => `Should bring in about ${money(L.bizTake())}, and builds its name (${Math.round(L.s.biz.rep)} of 100).`,
    show: (L) => !!L.s.biz,
    run(L) {
      const s = L.s, b = s.biz, k = BUSINESSES[b.type];
      const got = Math.round(L.bizTake() * (0.85 + L.rnd() * 0.3) / 10) * 10;
      L.cash(got); s.n.earned += got;
      b.rep = clamp(b.rep + (2 + (s.st[k.stats[0]] + s.st[k.stats[1]]) / 80) / (1 + b.lvl * 0.4), 0, 100);
      L.gain(k.stats[0], 0.9); L.gain(k.stats[1], 0.45); L.joy(-1);
      s.use.biz = 1;
      return `${L.pick(['Flat out from open to close.', 'A good week: people are starting to recommend you.', 'Two complaints, twenty compliments.', 'You count the till twice, grinning.'])} ${money(got)}.`;
    },
  });
  def('bizGrow', {
    place: bizPlace, sec: 'Your business', icon: '📈',
    title: (L) => `Grow it into a ${BUSINESSES[L.s.biz.type].names[L.s.biz.lvl + 1].toLowerCase()}`,
    desc: 'More takings, and it starts to earn without you.',
    cost: (L) => L.bizCost(L.s.biz.lvl + 1),
    show: (L) => !!L.s.biz && L.s.biz.lvl < 3,
    why(L) {
      const s = L.s, b = s.biz, k = BUSINESSES[b.type], left = k.wait[b.lvl + 1] - (s.t - b.at);
      if (b.rep < 70) return 'Build its name first (70 of 100).';
      if (s.st[k.stats[0]] < k.skill[b.lvl + 1]) return `Needs ${STAT_NAME[k.stats[0]]} ${k.skill[b.lvl + 1]}.`;
      return left > 0 ? `It needs ${left} more season${left > 1 ? 's' : ''} to find its feet first.` : null;
    },
    run(L) {
      const b = L.s.biz;
      b.lvl++; b.rep = 45; b.at = L.s.t; L.joy(8);
      if (b.lvl === 3) L.s.f.mogul = 1;
      L.note(`The business grew into a ${L.bizName().toLowerCase()}.`, 'big');
      return `New premises, new staff, your name over the door in bigger letters. You now run a ${L.bizName().toLowerCase()}.`;
    },
  });
  def('bizMgr', {
    place: bizPlace, sec: 'Your business', icon: '🧑‍💼', time: 0,
    title: (L) => (L.s.biz.mgr ? 'Let the manager go' : 'Hire a manager'),
    desc: (L) => (L.s.biz.mgr ? 'Back to a little coming in when you are not there.' : 'It earns three times as much without you, and keeps its name.'),
    show: (L) => !!L.s.biz && L.s.biz.lvl >= 1,
    run(L) { const b = L.s.biz; b.mgr = !b.mgr; return b.mgr ? `Your new manager has a clipboard and a firm handshake. The ${L.bizName().toLowerCase()} should now bring in about ${money(L.bizIdle())} a season by itself.` : 'You shake hands and part. You will be doing the rota yourself again.'; },
  });
  def('bizSell', {
    place: bizPlace, sec: 'Your business', icon: '🤝', time: 0,
    title: 'Sell the business', desc: (L) => `Someone would give ${money(L.bizWorth())} for it.`,
    show: (L) => !!L.s.biz,
    run(L) {
      const got = L.bizWorth(), name = L.bizName().toLowerCase();
      L.s.cash += got; L.s.biz = null;
      L.note(`Sold the ${name} for ${money(got)}.`, 'big');
      return `You hand over the keys to the ${name}, and bank ${money(got)}.`;
    },
  });

  // ---- fishing ----------------------------------------------------------------------------

  // where: 'wall' or 'boat'.
  // strike: how well the bite was struck (2 cleanly, 1 well enough, 0 badly).
  Life.prototype.goFishing = function goFishing(where, strike = 1) {
    const s = this.s, clean = strike === 2, fluffed = strike === 0, mult = (clean ? 1.15 : 1) * (where === 'boat' ? 1.3 : 1) * (s.heir === 'salt' ? 2 : 1) * (this.perk('sea') ? 1.3 : 1);
    const wise = (s.f.marlow || 0) >= 2;
    this.joy(3);
    const land = (id) => {
      const first = !s.fishbook[id];
      s.fishbook[id] = (s.fishbook[id] || 0) + 1; s.n.fish++;
      if (first) this.say(FISH[id].icon, `New in your fish book: ${FISH[id].name}`, 'good');
    };
    if (wise && !s.f.bream && !fluffed && this.chance((where === 'boat' ? 0.06 : 0.03) * (clean ? 1.5 : 1))) {
      s.f.bream = 1; land('bream'); this.cash(5000 * mult); this.fame(3); this.joy(10);
      this.note('Caught the golden bream of Starling Bay.', 'big');
      return `The line goes tight and stays tight. Half an hour later a fish the colour of a sunrise is in your net. The golden bream! The aquarium pays ${money(5000 * mult)} for it.`;
    }
    if (fluffed && this.chance(0.7)) return this.pick(['You strike a moment wrong, and whatever it was is gone.', 'The float bobs up again, empty. It was a good one, too. They always are.', 'You pull the hook clean out of its mouth.']);
    if (this.chance((wise ? 0.2 : 0.3) * (clean ? 0.35 : 1))) return this.pick(['Nothing bites. The sea keeps its secrets.', 'You catch a boot. It is not even your size.', 'Something steals your bait and waves a claw.']);
    const pool = Object.keys(FISH).filter((id) => FISH[id].where.includes(where) && (!FISH[id].when || FISH[id].when.includes(this.season)));
    let r = this.rnd() * pool.reduce((a, id) => a + FISH[id].w, 0), id = pool[0];
    for (const q of pool) { id = q; r -= FISH[q].w; if (r < 0) break; }
    const f = FISH[id], pay = Math.round(this.int(f.pay[0], f.pay[1]) * mult * (s.gifts.lifeboat ? 1.2 : 1) / 10) * 10;
    land(id);
    this.cash(pay);
    return `${clean ? 'A clean strike. ' : fluffed ? 'A clumsy strike, but it holds. ' : ''}You land ${/^[aeiou]/i.test(f.name) ? 'an' : 'a'} ${f.name.toLowerCase()} and sell it on the quay for ${money(pay)}.`;
  };
  def('fish', {
    place: 'harbour', sec: 'The water', icon: '🎣', title: 'Fish off the harbour wall', desc: 'Sell what you catch. What is biting changes with the seasons.',
    show: (L) => !!L.s.items.rod,
    run: (L, x) => L.goFishing('wall', x === 0 || x === 2 ? x : 1),
  });
  def('fishBoat', {
    place: 'harbour', sec: 'The water', icon: '🚤', title: 'Fish out in the bay', desc: 'Bigger fish, from your boat.',
    show: (L) => !!L.s.items.rod && !!L.s.items.boat,
    run: (L, x) => L.goFishing('boat', x === 0 || x === 2 ? x : 1),
  });
  def('fishbookOpen', { place: 'harbour', sec: 'The water', icon: '📒', title: 'Your fish book', desc: (L) => `${Object.keys(L.s.fishbook).length} of ${Object.keys(FISH).length} kinds caught.`, time: 0, open: 'fishbook', show: (L) => !!L.s.items.rod });
}
