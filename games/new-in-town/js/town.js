// New in Town: the town getting on with things. The Bay has good years
// and bad ones (the economy), and the Gazette reports them. There is an
// allotment to rent at Pebble Park, where what you can sow depends on the
// season; Mr Pym's shop of curios on the High Street, to collect and to
// trade; and the beach, which is free.

import { CROPS, PLOT_RENT, PLOT_BEDS, CURIOS, CURIO_SETS, ECO, FILLER, SMALL_ADS, FISH, SEASONS, LOOKS, money, many } from './data.js';

const round10 = (n) => Math.round(n / 10) * 10;
const seasonsOf = (list) => list.map((q) => SEASONS[q].toLowerCase()).join(' or ');

export function install({ def, A, Life, clamp }) {
  Object.assign(Life.prototype, {
    // ---- good years and bad ----
    eco() { return ECO[this.s.eco + 2]; },
    // Once a year the mood of the Bay may shift, and tends back towards steady.
    ecoYear() {
      const s = this.s;
      s.idx0 = s.idx;
      if (!this.chance(0.4)) return;
      const was = s.eco;
      s.eco = clamp(s.eco + (this.chance(0.5 - s.eco * 0.17) ? 1 : -1), -2, 2);
      if (s.eco === was) return;
      s.ecoAt = s.t;
      if (s.eco === 2) s.f.sawBoom = 1;
      if (s.eco === -2) s.f.sawSlump = 1;
      this.say(this.eco().icon, `The Gazette: ${this.eco().name.toLowerCase()} in the Bay`, s.eco > was ? 'good' : 'bad');
    },

    // ---- the Gazette: this season's paper, made from how things stand ----
    gazette() {
      const s = this.s, k = s.stk, q = this.season, items = [];
      const turn = (list, salt = 0) => list[(s.t * 7 + salt) % list.length];
      const He = s.sex === 'f' ? 'She' : 'He';
      let lead;
      const market = k.news.find((n) => n.t === s.t - 1 && !n.sym);
      if (s.run) lead = { icon: '🚨', h: 'Escaped prisoner still at large', t: `Police say ${s.name}, who went over the wall of Starling Gaol, should not be approached. ${He} is described as "${s.age >= 50 ? 'older than you would expect' : 'ordinary-looking'}, and in a hurry".` };
      else if (s.gaol) lead = { icon: '⛓️', h: 'Life goes on outside', t: 'A week-old copy, passed along the landing, with the crossword done wrong in biro.' };
      else if (market) lead = { icon: market.up ? '📈' : '📉', h: market.up ? 'Boom on the exchange' : 'Black day on the exchange', t: `${market.text}.` };
      else if (s.ecoAt != null && s.t - s.ecoAt < 2) lead = { icon: this.eco().icon, h: `${this.eco().name} in the Bay`, t: this.eco().text };
      else if (s.heat >= 60) lead = { icon: '🚔', h: 'Police appeal after spate of crime', t: `Officers wish to speak to a ${s.sex === 'f' ? 'woman' : 'man'} seen leaving several scenes "at a brisk walk". The public are asked to check their sheds.` };
      else lead = { icon: '🗞️', h: turn(FILLER[q]), t: 'Full story, such as it is, on page 2.' };

      if (lead.t !== this.eco().text) items.push({ icon: this.eco().icon, h: `Business: ${this.eco().name.toLowerCase()}`, t: this.eco().text });
      for (const n of k.news.filter((v) => v.sym && v.t >= s.t - 1).slice(0, 2)) items.push({ icon: n.up ? '📈' : '📉', h: 'On the exchange', t: `${n.text}.` });
      if (s.idx0) {
        const d = Math.round((s.idx / s.idx0 - 1) * 100);
        items.push({ icon: '🏘️', h: 'Property', t: d ? `House prices are ${d > 0 ? 'up' : 'down'} ${Math.abs(d)}% since the new year.` : 'House prices are where they were at the new year.' });
      }
      const fish = Object.values(FISH).filter((f) => f.when && f.when.includes(q) && f.where.length).slice(0, 3).map((f) => f.name.toLowerCase());
      const sow = Object.values(CROPS).filter((c) => c.sow.includes(q)).map((c) => c.name.toLowerCase());
      items.push({ icon: '🎣', h: 'What is on', t: `${fish.length ? `Biting now: ${fish.join(', ')}. ` : ''}${sow.length ? `On the allotments, it is time to sow ${sow.join(', ')}.` : 'Nothing to sow on the allotments until spring.'}${q === 2 ? ' The Harvest Show is on at Pebble Park: marrows to the big tent.' : ''}` });
      if (s.cur && s.cur.stock.length) {
        const hot = Object.keys(CURIO_SETS).sort((a, b) => s.cur.bid[b] - s.cur.bid[a])[0];
        items.push({ icon: '🏺', h: 'Pym’s Curios', t: `In the window this season: ${s.cur.stock.map((c) => CURIOS[c.id].name.toLowerCase()).join(', ')}. Collectors are paying well for ${CURIO_SETS[hot].toLowerCase()}.` });
      }
      items.push({ icon: '🎟️', h: 'Bay Lotto', t: `This season’s jackpot is ${money(s.lot.pot)}. Tickets from the newsagent on the High Street.` });
      if (s.heat >= 30 && !s.run && !s.gaol && lead.icon !== '🚔') items.push({ icon: '🚔', h: 'Police notebook', t: 'Officers are "following a definite line of enquiry", which is what they say.' });
      if (this.followers() >= 1000) items.push({ icon: '🐤', h: 'Seen on Chirper', t: `Local account ${s.name.split(' ')[0].toLowerCase()}_of_the_bay now has ${many(this.followers())} followers. The Gazette has 212.` });
      const big = s.log.slice().reverse().find((e) => e.k === 'big' && (s.age - e.a) <= 1 && s.log.indexOf(e) > 0);
      if (big && !s.gaol) items.push({ icon: '✒️', h: 'Local notes', t: `Of ${s.name}: "${big.t}"` });
      items.push({ icon: '📌', h: 'Small ads', t: `${turn(SMALL_ADS)} ${turn(SMALL_ADS, 5)}` });
      return { lead, items };
    },

    // ---- the allotment ----
    bedRipe(b) { return !!b && b.age >= CROPS[b.c].ripe; },
    // How well a bed has been kept, 0 to 1: two tendings a season is all it can use.
    bedCare(b) { return clamp(b.care / (CROPS[b.c].ripe * 2), 0, 1); },
    plotSeason() {
      const s = this.s;
      if (s.marrow && this.season === 3) { s.marrow = 0; this.note('Your show marrow went soft in the shed.'); }
      if (!s.plot) return;
      s.plot.beds.forEach((b, i) => {
        if (!b) return;
        b.age++;
        if (b.age > CROPS[b.c].ripe + 1) { s.plot.beds[i] = null; this.note(`Your ${CROPS[b.c].name.toLowerCase()} went over. Nobody picked them.`); }
      });
    },

    // ---- curios ----
    curiosWorth() { return Math.round(Object.entries(this.s.curios).reduce((a, [id, n]) => a + CURIOS[id].worth * n, 0) * 0.8); },
    hasSet(k) { return Object.keys(CURIOS).filter((id) => CURIOS[id].set === k).every((id) => this.s.curios[id] > 0); },
    setWorth(k) { return Object.values(CURIOS).filter((c) => c.set === k).reduce((a, c) => a + c.worth, 0); },
    curioBid(id) { return round10(CURIOS[id].worth * (this.s.cur ? this.s.cur.bid[CURIOS[id].set] : 0.8)); },
    // A curio comes your way.
    gotCurio(id) {
      const s = this.s;
      s.curios[id] = (s.curios[id] || 0) + 1;
      if (!s.curSeen[id]) { s.curSeen[id] = 1; this.say(CURIOS[id].icon, `For your collection: ${CURIOS[id].name.toLowerCase()}`, 'good'); }
      return CURIOS[id];
    },
    // One at random, the humbler things far likelier. sets: only from these.
    anyCurio(sets) {
      const ids = Object.keys(CURIOS).filter((id) => !sets || sets.includes(CURIOS[id].set));
      let r = this.rnd() * ids.reduce((a, id) => a + 1 / CURIOS[id].worth, 0);
      for (const id of ids) { r -= 1 / CURIOS[id].worth; if (r < 0) return id; }
      return ids[0];
    },
    // New things in Pym's window, and a new idea of what each set is worth to him.
    restock() {
      const s = this.s, stock = [];
      while (stock.length < 3) {
        const id = this.pick(Object.keys(CURIOS));
        if (!stock.some((c) => c.id === id)) stock.push({ id, ask: round10(CURIOS[id].worth * (0.55 + this.rnd() * 0.9)) });
      }
      s.cur = { stock, bid: Object.fromEntries(Object.keys(CURIO_SETS).map((k) => [k, Math.round((0.6 + this.rnd() * 0.55) * 100) / 100])), hag: false };
    },

    // The turn of a season in town (the new season has begun).
    townSeason() {
      this.plotSeason();
      this.restock();
    },
  });

  // -- the Gazette
  def('gazette', { place: 'home', sec: 'At home', icon: '📰', title: 'Read the Gazette', desc: 'What Starling Bay is talking about this season.', time: 0, open: 'gazette' });
  def('gazette2', { place: 'station', sec: 'The news stand', icon: '📰', title: 'Read the Gazette', desc: 'What Starling Bay is talking about this season.', time: 0, open: 'gazette' });

  // -- the allotment
  def('plotOpen', {
    place: 'park', sec: 'The allotments', icon: '🥕', time: 0, open: 'plot',
    title: (L) => (L.s.plot ? 'Your allotment' : 'The allotments'),
    desc: (L) => { const p = L.s.plot; if (!p) return `A plot of your own for ${money(PLOT_RENT)} a season.`; const ripe = p.beds.filter((b) => L.bedRipe(b)).length, on = p.beds.filter(Boolean).length; return ripe ? `${ripe} bed${ripe > 1 ? 's' : ''} ready to bring in.` : on ? `${on} bed${on > 1 ? 's' : ''} growing.` : 'Three empty beds.'; },
  });
  def('plotRent', {
    icon: '🥕', title: 'Take a plot', time: 0,
    why: (L) => (L.s.plot ? 'You have one.' : null),
    run(L) { L.s.plot = { beds: Array(PLOT_BEDS).fill(null), since: L.s.t }; return 'Plot 14, between a man who grows only onions and a woman who talks to her beans. A shed comes with it. So do the slugs.'; },
  });
  def('plotQuit', {
    icon: '🚪', title: 'Give up the plot', time: 0,
    why: (L) => (L.s.plot ? null : 'You have no plot.'),
    run(L) { L.s.plot = null; return 'You hand the shed key back. The onion man takes your water butt before you reach the gate.'; },
  });
  def('sow', {
    icon: (L, x) => CROPS[x.c].icon, title: (L, x) => `Sow ${CROPS[x.c].name.toLowerCase()}`, cost: (L, x) => (x && CROPS[x.c] ? CROPS[x.c].seed : 0),
    why(L, x) {
      const p = L.s.plot, c = x && CROPS[x.c];
      if (!p) return 'You have no plot.';
      if (!c || !(x.b >= 0 && x.b < p.beds.length)) return 'Sow what, where?';
      if (p.beds[x.b]) return 'That bed is taken.';
      return c.sow.includes(L.season) ? null : `${c.name} ${c.name.endsWith('s') ? 'are' : 'is'} sown in ${seasonsOf(c.sow)}.`;
    },
    run(L, x) {
      L.s.plot.beds[x.b] = { c: x.c, age: 0, care: 0 };
      L.gain('craft', 0.6); L.joy(1); L.s.use.fit = 1;
      return L.pick(['A straight row, a label, a watering can.', 'You read the back of the packet twice and do the opposite of last year.', 'In they go. Now it is between them and the slugs.']);
    },
  });
  def('tend', {
    icon: '💧', title: 'Weed and water', per: 2, desc: 'Every bed does better for it. So do you.',
    why: (L) => (!L.s.plot ? 'You have no plot.' : L.s.plot.beds.some(Boolean) ? null : 'Nothing is growing.'),
    run(L) {
      for (const b of L.s.plot.beds) if (b) b.care++;
      L.gain('craft', 1.2); L.gain('fitness', 0.5); L.joy(3); L.hp(1);
      return L.pick(['An hour with the hoe and a flask of tea.', 'You win this round against the bindweed.', 'The onion man nods at your rows. High praise.', 'A robin supervises from the fork handle.']);
    },
  });
  def('reap', {
    icon: '🧺', title: 'Bring in what is ready', desc: 'Pick, dig and pull whatever is ripe.',
    why: (L) => (!L.s.plot ? 'You have no plot.' : L.s.plot.beds.some((b) => L.bedRipe(b)) ? null : 'Nothing is ready yet.'),
    run(L) {
      const s = L.s, got = [];
      let cash = 0;
      s.plot.beds.forEach((b, i) => {
        if (!L.bedRipe(b)) return;
        const c = CROPS[b.c], care = L.bedCare(b);
        s.plot.beds[i] = null;
        s.grown[b.c] = (s.grown[b.c] || 0) + 1;
        cash += round10(c.pay * (0.45 + 0.75 * care) * (1 + s.st.craft / 250) * (0.85 + L.rnd() * 0.3));
        got.push(c.name.toLowerCase());
        // (Forty years of saved seed counts for something.)
        if (c.show) s.marrow = Math.round((6 + care * 16 + s.st.craft / 8 + L.rnd() * 8 + (s.f.seed ? 7 : 0)) * 10) / 10;
      });
      L.cash(cash); s.n.earned += cash; L.joy(4); L.hp(1); L.gain('craft', 0.8);
      return `You bring in the ${got.join(' and the ')}: more than you can eat, so the rest goes on a table by the gate with an honesty box. ${money(cash)}.${s.marrow && got.includes('show marrow') ? ` The marrow weighs ${s.marrow} kg. Keep it for the Harvest Show in autumn.` : ''}`;
    },
  });
  def('show', {
    place: 'park', sec: 'The allotments', icon: '🥒', title: 'Enter the Harvest Show',
    desc: (L) => `Your marrow weighs ${L.s.marrow} kg. ${L.s.f.parg === 3 ? 'With Mrs Pargeter retired, it is anybody’s rosette' : 'Mrs Pargeter has won six years running'}.`,
    show: (L) => L.season === 2 && L.s.marrow > 0,
    run(L) {
      const s = L.s, mine = s.marrow, gone = s.f.parg === 3, who = gone ? 'Mr Tibbs' : 'Mrs Pargeter', hers = Math.round((24 - (gone ? 3 : 0) + L.gauss() * 5) * 10) / 10;
      s.marrow = 0;
      if (mine > hers) {
        L.cash(500); L.fame(2); L.joy(10); s.f.marrow = 1;
        L.note(`Won the Harvest Show with a marrow of ${mine} kg.`, 'big');
        return `The judge weighs yours twice. ${mine} kg to ${who}’s ${hers}. First prize, $500, and a rosette the size of a dinner plate.${gone ? ' Mrs Pargeter, in the front row, nods once.' : ' Mrs Pargeter congratulates you through her teeth.'}`;
      }
      L.joy(2);
      return `${who}’s is ${hers} kg. Yours is ${mine}. "A nice little marrow," ${gone ? 'he' : 'she'} says. There is always next year.`;
    },
  });

  // -- a new look
  def('barberOpen', { place: 'highstreet', sec: 'Curl Up & Dye', icon: '💈', title: 'A new look', desc: 'The cut, the colour, the clothes.', time: 0, open: 'barber' });
  def('restyle', {
    time: 0, cost: 40,
    why(L, x) {
      if (!x) return 'Change what?';
      if (x.k === 'beard') return L.s.sex === 'm' ? null : 'Not for you.';
      const max = { style: LOOKS.styles, hair: LOOKS.hair.length, top: LOOKS.top.length }[x.k];
      if (!max || !Number.isInteger(x.v) || x.v < 0 || x.v >= max) return 'Change what?';
      return L.s.look[x.k] === x.v ? 'That is how it is now.' : null;
    },
    run(L, x) {
      const s = L.s;
      if (x.k === 'beard') s.look.beard = !s.look.beard; else s.look[x.k] = x.v;
      // (A new look is a tonic, once.)
      if (!s.use.restyle) { s.use.restyle = 1; L.joy(3); }
      if (x.k === 'top') return L.pick(['New clothes. You walk differently in them.', 'The assistant says it brings out your eyes. She says that to everyone, and you believe her.']);
      if (x.k === 'beard') return s.look.beard ? 'It itches for a fortnight and then it is magnificent.' : 'Your chin sees daylight for the first time in years.';
      return L.pick(['"Going anywhere nice this year?" Forty minutes later you are somebody new.', 'You barely know yourself in the shop windows on the way home.', 'Bold. Everybody says so. Some of them mean it kindly.']);
    },
  });

  // -- Mr Pym
  def('pymOpen', { place: 'highstreet', sec: 'Pym’s Curios', icon: '🏺', title: 'Browse the curios', desc: (L) => `Old things, bought and sold. ${Object.keys(L.s.curSeen).length} of ${Object.keys(CURIOS).length} found.`, time: 0, open: 'curios' });
  def('curioBuy', {
    time: 0, cost: (L, i) => (L.s.cur && L.s.cur.stock[i] ? L.s.cur.stock[i].ask : 0),
    why: (L, i) => (L.s.cur && L.s.cur.stock[i] ? null : 'It has gone.'),
    run(L, i) {
      const [c] = L.s.cur.stock.splice(i, 1), k = L.gotCurio(c.id);
      return `Mr Pym wraps the ${k.name.toLowerCase()} in last week’s Gazette${c.ask < k.worth * 0.75 ? '. You try not to look pleased until you are outside' : c.ask > k.worth * 1.2 ? ', humming' : ''}.`;
    },
  });
  def('haggle', {
    time: 0, per: 1,
    why: (L) => (L.s.cur && L.s.cur.stock.length ? null : 'There is nothing to haggle over.'),
    run(L) {
      const cur = L.s.cur, won = L.chance(L.checkOdds('charm', 50));
      for (const c of cur.stock) c.ask = round10(c.ask * (won ? 0.82 : 1.1));
      L.gain('charm', 0.5);
      return won ? 'You suck your teeth, point out a chip that may or may not be there, and start to leave. Mr Pym knocks a fifth off everything.' : 'Mr Pym has been haggled with by experts. He puts his prices up, out of principle.';
    },
  });
  def('curioSell', {
    time: 0,
    why: (L, id) => (L.s.curios[id] > 0 ? null : 'You have not got one.'),
    run(L, id) {
      const s = L.s, pay = L.curioBid(id);
      if (--s.curios[id] <= 0) delete s.curios[id];
      L.cash(pay);
      return `Mr Pym turns the ${CURIOS[id].name.toLowerCase()} over twice and counts out ${money(pay)}.`;
    },
  });
  const giveUp = (L, k) => { for (const id of Object.keys(CURIOS)) if (CURIOS[id].set === k && --L.s.curios[id] <= 0) delete L.s.curios[id]; L.s.n.sets = (L.s.n.sets || 0) + 1; };
  def('setSell', {
    time: 0,
    why: (L, k) => (CURIO_SETS[k] && L.hasSet(k) ? null : 'You need all four.'),
    run(L, k) { const pay = L.setWorth(k) * 2; giveUp(L, k); L.cash(pay); L.joy(6); L.note(`Sold a complete set of ${CURIO_SETS[k].toLowerCase()} for ${money(pay)}.`); return `A collector comes down from the city by the first train and does not haggle. ${money(pay)} for the set.`; },
  });
  def('setGive', {
    time: 0,
    why: (L, k) => (CURIO_SETS[k] && L.hasSet(k) ? null : 'You need all four.'),
    run(L, k) {
      const s = L.s, worth = L.setWorth(k);
      giveUp(L, k); L.karma(10); L.fame(3); L.joy(8); s.n.given = (s.n.given || 0) + worth; s.f.patron = 1;
      L.note(`Gave a complete set of ${CURIO_SETS[k].toLowerCase()} to the town museum.`, 'big');
      return 'The museum puts them in a glass case in the front room, with your name on a small brass plate. School parties are made to look at it.';
    },
  });

  // -- the shore
  def('comb', {
    place: 'harbour', sec: 'The shore', icon: '🐚', title: 'Comb the beach', desc: 'It is free, and you never know what the tide has left.',
    run(L) {
      const r = L.rnd();
      L.joy(2); L.gain('fitness', 0.4); L.s.use.fit = 1;
      if (r < 0.08) { const k = L.gotCurio(L.anyCurio(['sea', 'coin'])); return `Half buried by the breakwater: a ${k.name.toLowerCase()}. Mr Pym would want to see that.`; }
      if (r < 0.4) { const got = L.int(1, 9) * 10; L.cash(got); return `${L.pick(['Returnable bottles, a whole crate’s worth.', 'A wallet’s worth of loose change under the pier.', 'Sea glass. The gift shop buys it by the jar.'])} ${money(got)}.`; }
      return L.pick(['A good stick, a dead crab, and one shoe.', 'You skim a stone seven times and nobody sees.', 'Shells, mostly. You keep the best one.', 'A seal watches you from the water, and you watch it back.']);
    },
  });
}
