// New in Town: wheels. Learning to drive with Jess Dobbs, owning a car, and
// everything that comes with one: Dobbs & Daughter's forecourt up the hill,
// the yearly MOT, breakdowns and repairs, day trips out of town, lifts for
// the people you know, a little evening work behind the wheel, an old
// classic to bring back to life in Len's back bay, and the darker side:
// speeding, crashes, and the drive home from the pub.
//
// All of it lives in s.motor. The rest of the game knows a car by two old
// flags, s.items.car and s.items.sportscar: they give the two extra blocks of
// time, the sports car's charm and cheer, its running costs, the crunch in
// the car park and so on. Here those flags mean "a car you can drive just
// now", and motorSync keeps them in step: a car that has broken down, failed
// its MOT or belongs to somebody who is banned gives nothing until it is put
// right. The screen is motor-ui.js, and the two driving tests motor-games.js.

import { CAREERS, TROPHIES, money } from './data.js';
import { grade } from './minilogic.js';

// What Jess can sell you new. price: on the road. rel: how seldom it goes
// wrong (1 is ordinary). sport: a sports car (heads turn; dear to run).
// big: room for a load, which the chip shop pays a little more for.
export const MODELS = {
  pip: { make: 'Corvan', name: 'Pip', icon: '🚗', body: 'little hatchback', price: 15500, rel: 1 },
  kite: { make: 'Tamura', name: 'Kite', icon: '🚙', body: 'hatchback', price: 18500, rel: 1.35 },
  minster: { make: 'Albright', name: 'Minster', icon: '🚘', body: 'saloon', price: 21000, rel: 0.8 },
  seabird: { make: 'Corvan', name: 'Seabird', icon: '🚙', body: 'estate', price: 23000, rel: 0.95, big: true },
  hauler: { make: 'Bexley', name: 'Hauler', icon: '🚐', body: 'little van', price: 19500, rel: 1.05, big: true },
  graf: { make: 'Hessler', name: 'Graf', icon: '🚘', body: 'executive saloon', price: 41000, rel: 1.15 },
  vela: { make: 'Varenna', name: 'Vela', icon: '🏎️', body: 'sports car', price: 85000, rel: 0.75, sport: true },
};
// Old cars for the back bay. top: what one is worth done perfectly; wreck:
// what one costs as found; part: the thing nobody has.
export const CLASSICS = {
  swallow: { make: 'Albright', name: 'Swallow', icon: '🚗', body: 'sixties roadster', top: 32000, wreck: 3200, part: 'a pair of twin carburettors' },
  ranger: { make: 'Corvan', name: 'Ranger', icon: '🚙', body: 'fifties estate with wooden sides', top: 24000, wreck: 2300, part: 'a dashboard clock that works' },
  lucia: { make: 'Varenna', name: 'Lucia', icon: '🏎️', body: 'sixties coupé', top: 56000, wreck: 6400, part: 'a cylinder head' },
};
// The work, in order. n: sittings; cost: parts, as a share of what the car is worth done.
export const STAGES = [
  { name: 'Strip it down', fin: 'It is in pieces now, every one of them labelled.', icon: '🪛', n: 1, cost: 0.01, says: ['Every nut is rusted to its bolt. Len lends you a hammer called Gerald.', 'You bag and label four hundred parts. Jess labels the bags you labelled.'] },
  { name: 'Cut out the rust', fin: 'The rust is gone.', icon: '🔥', n: 2, cost: 0.05, says: ['Sparks, welding rods and a smell like a bonfire night that went wrong.', 'You cut out the rot and let in new steel. The sills are sills again.'] },
  { name: 'Rebuild the engine', fin: 'The engine is done.', icon: '⚙️', n: 3, cost: 0.07, says: ['The engine is in pieces on a blanket. So, briefly, is your patience.', 'Pistons, rings, gaskets. Len points at one and says "That’s your problem." It is.', 'It turns over, coughs, and runs. The whole workshop stops to listen.'] },
  { name: 'Brakes and wiring', fin: 'It stops, and the lights come on.', icon: '🔌', n: 2, cost: 0.04, says: ['The wiring loom looks like spaghetti that has had a fright. You untangle it.', 'New brake lines, bled twice. It stops now, which is a start.'] },
  { name: 'Paint', fin: 'The paint is on.', icon: '🎨', n: 2, cost: 0.06, says: ['Filler, sanding, more filler, more sanding. Your arms will never forgive you.', 'Three coats in the old colour. It shines like a conker.'] },
  { name: 'Trim and chrome', fin: '', icon: '✨', n: 2, cost: 0.05, says: ['New leather on the seats and a headlining with no stains of mystery.', 'The chrome goes back on, bumper by bumper. You keep seeing yourself in it.'] },
];
const PART_STAGE = 2;
// Days out in the car. A trip takes most of a day, burns a little petrol and
// puts a few miles on the car. only: the seasons it makes sense in.
export const DRIVES = {
  moor: { name: 'Rook Moor', icon: '🐎', cost: 30, joy: 6, stat: 'fitness', blurb: 'Heather, wild ponies and a wind with opinions.' },
  castle: { name: 'Hythe Castle', icon: '🏰', cost: 45, joy: 5, stat: 'smarts', blurb: 'Half a castle and a whole tea room.' },
  fair: { name: 'The antiques fair at Kettleby', icon: '🏺', cost: 60, joy: 5, stat: 'charm', blurb: 'A field of trestle tables. You might find something for Mr Pym.' },
  sands: { name: 'Pellow Sands', icon: '🏖️', cost: 25, joy: 7, stat: 'fitness', only: [0, 1, 2], blurb: 'Two miles of beach and an ice-cream van.' },
  museum: { name: 'The motor museum at Brackenford', icon: '🏁', cost: 40, joy: 5, stat: 'craft', blurb: 'A hundred years of cars, and a café in an old garage. Good for ideas.' },
  garden: { name: 'Fernleigh garden centre', icon: '🪴', cost: 30, joy: 4, stat: null, blurb: 'Len Dobbs’s idea of a big day out. Take your mum.' },
};
const COLOURS = ['red', 'navy', 'silver', 'white', 'bottle-green', 'mustard', 'black', 'sky-blue', 'maroon', 'grey', 'orange'];
const LIFT_TO = ['to the station for the early train', 'to the hospital for an appointment', 'to a job interview in Kettleby', 'to the vet, with a cat in a box', 'to the tip, with a sofa', 'to the airport, two hours away', 'to the dentist', 'to a wedding in the next county', 'to the big supermarket out of town', 'home from a party at two in the morning'];

const r10 = (n) => Math.round(n / 10) * 10;
const r50 = (n) => Math.round(n / 50) * 50;
const MOT_FEE = 55;
const NUM = ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const LESSON = 80;
// What a car loses with the years: about a seventh a year, down to scrap.
const dep = (age) => Math.max(0.1, 0.86 ** age);
// What a car is worth, and the most a car its age can be brought back to.
export const carValue = (c) => r10(MODELS[c.m].price * dep(c.age) * (0.45 + 0.55 * c.cond / 100));
export const condCap = (c) => Math.max(50, 100 - c.age * 2.5);
// Jess gives three quarters of what a car is worth; she has to sell it on.
export const tradeIn = (c) => r10(carValue(c) * 0.75);
const An = (w) => `${/^[aeiou]/i.test(w) ? 'An' : 'A'} ${w}`;
const carName = (c) => `${MODELS[c.m].make} ${MODELS[c.m].name}`;
const classicName = (p) => `${CLASSICS[p.m].make} ${CLASSICS[p.m].name}`;

export function install({ def, Life, clamp, hooks, addEvents }) {

  // ---- the life's own sums ----
  Object.assign(Life.prototype, {
    motorCar() { return this.s.motor.car; },
    motorLicensed() { return this.s.motor.lic != null; },
    motorBanned() { return this.s.motor.ban > this.s.t; },
    // A car you can drive just now.
    motorUsable() { const m = this.s.motor, c = m.car; return !!c && !c.off && m.lic != null && !(m.ban > this.s.t); },
    motorPoints() { return this.s.motor.pts.reduce((a, [, n]) => a + n, 0); },
    motorCarName(c = this.s.motor.car) { return c ? carName(c) : ''; },
    motorShort(c = this.s.motor.car) { return c ? MODELS[c.m].name : ''; },
    motorValue(c = this.s.motor.car) { return c ? carValue(c) : 0; },
    motorTrade(c = this.s.motor.car) { return c ? tradeIn(c) : 0; },
    motorCap(c = this.s.motor.car) { return c ? condCap(c) : 0; },
    motorServiceCost(c = this.s.motor.car) { return c ? r10(120 + MODELS[c.m].price * 0.003) : 0; },
    // A used car on the forecourt, or a new one, less what Jess gives for yours.
    motorNet(price) { return price - (this.s.motor.car ? tradeIn(this.s.motor.car) : 0); },
    // What Jess thinks of you, in a word.
    motorJessWord() { const j = this.motorJessAll(); return j >= 75 ? 'practically a Dobbs' : j >= 50 ? 'a friend of the family' : j >= 25 ? 'a regular' : 'a customer'; },
    motorJess(d) {
      const m = this.s.motor;
      m.jess = clamp(m.jess + d, 0, 100);
      // (Jess is one of the townsfolk too: what she thinks of you there and here is one thing. See folk.js.)
      if (this.folkWarm && this.s.folk && this.s.folk.p.jess && this.s.folk.p.jess.met != null) this.folkWarm('jess', d / 2, false);
    },
    // What Jess thinks of you, all told: the garage's dealings or her friendship, whichever is warmer.
    motorJessAll() { const f = this.s.folk && this.s.folk.p.jess; return Math.max(this.s.motor.jess, f && f.met != null ? f.f : 0); },
    // Whether Jess thinks you are ready for your test.
    motorReady() { return this.s.motor.drv >= 55; },
    // The classic in the back bay: what it would fetch now, done or not.
    motorProjValue(p = this.s.motor.proj) {
      if (!p) return 0;
      const k = CLASSICS[p.m];
      if (p.done) return r10(k.top * (0.3 + 0.7 * this.motorQuality(p) / 100));
      return r10(p.paid * 0.6 + p.spent * 0.4);
    },
    motorQuality(p = this.s.motor.proj) { return p && p.n ? clamp(p.q / p.n + (p.b || 0), 0, 100) : 0; },
    motorStage(p = this.s.motor.proj) { return p && !p.done ? STAGES[p.st] : null; },
    motorStageCost(p = this.s.motor.proj) { return p && !p.done && !p.got ? r10(CLASSICS[p.m].top * STAGES[p.st].cost) : 0; },
    // The forecourt this season: a few used cars, and now and then something sorry in the back.
    motorYard() {
      const s = this.s, m = s.motor;
      if (m.yard && m.yard.t === s.t) return m.yard;
      // (Some of last season's are still there; the rest have gone.)
      const cars = m.yard ? m.yard.cars.filter((c) => !c.held && this.chance(0.35)).slice(0, 2) : [];
      const n = this.int(3, 4);
      while (cars.length < n) cars.push(this.motorUsedCar());
      m.yard = { t: s.t, cars, classic: !m.proj && this.chance(0.22) ? this.pick(Object.keys(CLASSICS)) : null };
      return m.yard;
    },
    // tag: a bargain (a part-exchange Jess wants rid of) or a lemon (it
    // looks better than it is: real is how it truly is).
    motorUsedCar(tag) {
      const m = this.s.motor, ids = Object.keys(MODELS).filter((id) => !MODELS[id].sport);
      const id = this.chance(0.12) ? 'vela' : this.pick(ids), age = this.int(1, 13);
      let cond = clamp(Math.round(93 - age * 3.3 + this.gauss() * 8), 22, 97);
      if (tag === undefined) { const r = this.rnd(); tag = r < 0.13 ? 'bargain' : r < 0.27 ? 'lemon' : null; }
      const real = tag === 'lemon' ? clamp(cond - this.int(28, 42), 12, 45) : cond;
      if (tag === 'lemon') cond = Math.max(cond, this.int(70, 84));
      const price = r50(carValue({ m: id, age, cond }) * (tag === 'bargain' ? 0.86 : 1.15));
      return { id: m.nid++, m: id, age, cond, real, col: this.pick(COLOURS), price, tag };
    },
    // What you might notice about a car on the forecourt.
    motorHint(c) {
      if (c.tag === 'bargain') return 'A part-exchange. Jess wants the space, and it shows in the price.';
      if (c.tag !== 'lemon') return null;
      if (this.motorJessAll() >= 40) return 'Jess catches your eye and shakes her head, very slightly.';
      if (this.s.st.craft >= 55) return 'You do not like the sound of the engine, or the fresh paint on the sills.';
      return null;
    },
    // Up to two people who could do with a lift this season.
    motorAsks() {
      if (!this.motorUsable()) return [];
      const near = this.s.people.filter((p) => p.age >= 16 && ((['friend', 'partner', 'spouse'].includes(p.kind) && p.bond >= 15) || ['parent', 'sibling'].includes(p.kind) || ((p.kind === 'child' || p.kind === 'grandchild') && p.age >= 18)));
      const out = [];
      for (const p of near) if (out.length < 2 && this.chance(0.3)) out.push({ p: p.id, to: this.pick(LIFT_TO) });
      return out;
    },
    // Odds of getting home from the pub without anything happening.
    // (On a Friday night the police are out on Harbour Hill, and the bend at the bottom is sharper than it looks: never better than seven in ten.)
    motorPubOdds() { return clamp(0.86 - this.riskOf(0.14) - 0.08, 0.3, 0.7); },
    // Odds of losing the police if you put your foot down. (A card adds the gambler’s luck itself.)
    motorFleeOdds() { const s = this.s, c = s.motor.car; return clamp(0.18 + s.motor.drv / 300 + (c && MODELS[c.m].sport ? 0.15 : 0) - s.heat / 300, 0.06, 0.55); },

    // Keeps the old flags in step with the car you can drive. mid: in the middle of
    // a season, when a car that starts or stops being usable gives or takes its time
    // there and then (the time it gives, only once a season).
    motorSync(mid = false) {
      const s = this.s, m = s.motor;
      if (!m) return;
      // (A car that turned up some other way becomes a real one.)
      if (!m.car && (s.items.car || s.items.sportscar)) this.motorAdopt(s.items.sportscar ? 'vela' : 'pip');
      const was = mid && !s.gaol ? this.timeMax() : 0;
      const use = this.motorUsable(), sport = use && !!MODELS[m.car.m].sport;
      if (use && !sport) s.items.car = 1; else delete s.items.car;
      if (sport) s.items.sportscar = 1; else delete s.items.sportscar;
      if (!mid || s.gaol) return;
      const d = this.timeMax() - was;
      if (d > 0 && !s.use.motorT) { s.use.motorT = 1; s.time += d; } else if (d < 0) s.time = Math.max(0, s.time + d);
    },
    // A car from before there was a garage to buy one from (or from somewhere
    // else in the game): it is yours, and so is a licence to drive it.
    motorAdopt(id) {
      const s = this.s, m = s.motor;
      m.car = { m: id, age: id === 'vela' ? 3 : 7, cond: 75, col: COLOURS[s.t % COLOURS.length], since: s.t, mot: (s.t + 1) % 4, off: null, fix: 0 };
      if (m.lic == null) { m.lic = s.t - 8; m.old = true; m.drv = Math.max(m.drv, 60); m.th = true; }
    },
    // Hands over a car: from the forecourt, new from the dealer, or anywhere.
    motorTake(c) {
      const s = this.s, m = s.motor, had = m.car;
      // (What Jess gives for the old one has already come off the price.)
      m.car = { m: c.m, age: c.age, cond: c.real ?? c.cond, col: c.col, since: s.t, mot: (s.t + 3) % 4, off: null, fix: 0 };
      s.use.motorGot = 1;
      m.n.cars++;
      this.motorJess(3);
      if (MODELS[c.m].sport) this.joy(8);
      if (m.n.cars === 1) this.note(`Bought a car: ${an(`${c.age ? `${c.age}-year-old ` : 'brand new '}${c.col} ${carName(c)}`)}.`, 'big');
      return had;
    },
    // The car goes (sold, written off, taken): and the time it gave goes with it.
    motorDrop() {
      const s = this.s, m = s.motor, was = s.gaol ? 0 : this.timeMax();
      m.car = null; m.asks = [];
      delete s.items.car; delete s.items.sportscar;
      if (!s.gaol) s.time = Math.max(0, s.time - (was - this.timeMax()));
    },
    // Penalty points; twelve in three years and you are off the road for six months.
    motorAddPoints(n) {
      const s = this.s, m = s.motor;
      m.pts.push([s.t, n]);
      if (this.motorPoints() < 12) return `${n} points on your licence (${this.motorPoints()} in all)`;
      m.pts = [];
      this.motorBan(2);
      this.note('Banned from driving for six months: twelve points on the licence.', 'big');
      return `${n} more points, which makes twelve: a six-month ban`;
    },
    motorBan(n) { const s = this.s, m = s.motor; m.ban = Math.max(m.ban, s.t + n); m.n.bans++; m.asks = []; },
    // Caught over the limit: a fine, a ban, a record, and the town knows.
    motorDrunk(extra = 0) {
      const s = this.s, m = s.motor, again = m.n.dui > 0, fine = (this.perk('law') ? 1500 : 2500) + extra * 1000;
      m.n.dui++;
      this.cash(-fine); s.record++; this.karma(-6); this.warm(10); this.joy(-10);
      const n = again ? 12 : 4 + extra * 2;
      this.motorBan(n);
      this.motorJess(-10);
      let text = `Drink-driving: a ${money(fine)} fine, a criminal record, and a ban of ${n === 12 ? 'three years, this being the second time' : n === 4 ? 'a year' : `${n * 3} months`}.`;
      if (s.job && CAREERS[s.job.c].clean) { this.note(`Sacked as ${this.jobTitle()}, for drink-driving.`, 'big'); s.job = null; text += ' Your employer reads about it in the Gazette, and you are sacked.'; }
      this.note(`Convicted of drink-driving and banned from the road.`, 'big');
      return text;
    },
    // Into something, hard. drunk: the insurers want nothing to do with it.
    // Returns what happened to the car.
    motorSmash(drunk, hard = 1) {
      const s = this.s, m = s.motor, c = m.car;
      this.rough(this.int(6, 12) * hard, 'a car crash');
      if (!c) return '';
      const before = carValue(c), dmg = Math.round(this.int(25, 42) * hard);
      c.cond = Math.max(5, c.cond - dmg);
      const cost = r10(MODELS[c.m].price * 0.0045 * dmg);
      if (cost > before * 0.8) {
        this.motorDrop();
        if (drunk) return `The ${MODELS[c.m].name} is a write-off, and the insurers will not pay a penny.`;
        this.cash(before - 400);
        return `The ${MODELS[c.m].name} is a write-off. The insurers pay ${money(before - 400)} for it, after the excess.`;
      }
      c.off = 'crash';
      if (drunk) { c.fix = cost; return `The ${MODELS[c.m].name} needs ${money(cost)} of work, and the insurers will not touch it.`; }
      c.fix = 0;
      this.cash(-400);
      return `The insurers will have the ${MODELS[c.m].name} mended by next season. The excess is ${money(400)}.`;
    },
    // For the practice players and anyone else who wants a car: the next step towards one.
    motorPlan() {
      const m = this.s.motor;
      if (m.lic == null) return !m.th ? (m.les >= 2 ? ['motorTheory'] : ['motorLesson']) : this.motorReady() ? ['motorTest'] : ['motorLesson'];
      if (!m.car) { const y = this.motorYard().cars.filter((c) => c.tag !== 'lemon' && !MODELS[c.m].sport).sort((a, b) => a.price - b.price); return y.length ? ['motorBuy', y[0].id] : ['motorNew', 'pip']; }
      if (m.car.off) return ['motorFix'];
      return null;
    },
  });
  const an = (w) => `${/^[aeiou]/i.test(w) ? 'an' : 'a'} ${w}`;
  const car = (L) => L.s.motor.car;
  const first = (p) => p.name.split(' ')[0];

  // ---- learning to drive ----
  def('motorLesson', {
    place: 'garage', sec: 'Learning to drive', icon: '🚦', title: 'A driving lesson with Jess', cost: LESSON, per: 2,
    desc: (L) => { const m = L.s.motor; return m.les ? `${m.les} lesson${m.les > 1 ? 's' : ''} so far. ${L.motorReady() ? 'Jess says you are ready for your test, near enough.' : m.drv >= 35 ? 'Getting there, says Jess.' : 'Still finding the pedals.'}` : 'An hour in Jess’s little Pip with an L-plate on each end. Two a season.'; },
    show: (L) => L.s.motor.lic == null,
    run(L) {
      const s = L.s, m = s.motor, was = m.drv;
      m.les++;
      m.drv = clamp(m.drv + (14 - m.drv / 9) * (0.85 + s.st.fitness / 400 + s.st.smarts / 400), 0, 100);
      L.motorJess(2); L.joy(was < 20 ? -1 : 1);
      if (!L.motorReady() || was >= 55) {
        if (m.drv < 25) return L.pick(['Jess shows you which pedal is which. You stall eleven times on Chapel Lane, once outside the vicarage.', 'Mirror, signal, manoeuvre. You do all three, in a different order each time.', 'You find second gear, lose it, and find it again by the church.']);
        if (m.drv < 55) return L.pick(['A three-point turn in Church Lane. It takes seven points, and a man on a bench applauds.', 'Hill starts on Harbour Hill. The car rolls back only once, and only a little.', 'Round the roundabout by the station, four times, before you find the exit. Jess says nothing, loudly.', 'You reverse round the corner by the chapel. The kerb survives.']);
        return L.pick(['You drive Jess to Gorse Head and back, and she never once reaches for the handbrake.', 'A mock test. Jess marks you on a clipboard she has drawn herself. Two minors.', 'Len comes along in the back and points at things. You ignore him beautifully.']);
      }
      return '"You’re ready," says Jess, getting out. "Book your test before you go off the boil." From Jess, that is a speech.';
    },
  });
  // x: how the test went, from 0 to 1 (played on screen). Left out, it is rolled on your Smarts.
  def('motorTheory', {
    place: 'garage', sec: 'Learning to drive', icon: '📝', title: 'Sit the theory test', cost: 40, per: 1,
    desc: 'Ten questions on the rules of the road, in the room above the garage. Eight right is a pass.',
    show: (L) => L.s.motor.lic == null && !L.s.motor.th,
    why: (L, x) => (x === undefined || x === -1 || (typeof x === 'number' && x >= 0 && x <= 1) ? null : 'Pencils down.'),
    run(L, x) {
      const s = L.s, m = s.motor;
      // (-1: walked out before the end.)
      if (x === -1) { L.joy(-2); return 'You put your pencil down, push your chair back and walk out, with three questions you could not face still on the paper. Jess says you can book again next season.'; }
      if (x === undefined) x = L.chance(L.checkOdds('smarts', 22)) ? 0.65 + L.rnd() * 0.35 : L.rnd() * 0.6;
      const right = x >= 0.65 ? 8 + Math.round((x - 0.65) / 0.175) : Math.min(7, Math.floor(x / 0.6 * 8));
      L.gain('smarts', 0.8);
      if (grade(x) < 2) { L.joy(-3); return `${NUM[right]} out of ten. ${L.pick(['You mix up a give-way line and a stop line, and a horse with a cyclist.', 'You were sure about the stopping distances. You were sure wrongly.', 'The room above the garage smells of oil and nerves, mostly yours.'])} You can sit it again next season.`; }
      m.th = true; L.joy(4);
      L.note('Passed the driving theory test.');
      return `${NUM[right]} out of ten: a pass. ${L.pick(['You now know more about stopping a lorry in fog than anyone needs to.', 'Len, who invigilates, wakes up in time to congratulate you.', 'Jess pins the certificate to the board between a calendar and a fan belt.'])} Next, the real thing.`;
    },
  });
  def('motorTest', {
    place: 'garage', sec: 'Learning to drive', icon: '🚗', title: 'Take your driving test', cost: 120, per: 1,
    desc: (L) => (L.motorReady() ? 'Twenty minutes round town with an examiner and a clipboard. Jess thinks you are ready.' : 'Twenty minutes round town with an examiner and a clipboard. Jess would like a few more lessons first.'),
    show: (L) => L.s.motor.lic == null,
    why: (L, x) => (!L.s.motor.th ? 'Pass the theory test first.' : L.s.motor.les < 2 ? 'Jess will not put you in for it without a lesson or two.' : x === undefined || x === -1 || (typeof x === 'number' && x >= 0 && x <= 1) ? null : 'Mirror, signal.'),
    run(L, x) {
      const s = L.s, m = s.motor;
      if (x === -1) { m.tries++; L.joy(-3); return 'You pull over, turn the engine off and tell the examiner you would like to stop. She writes something down, not unkindly, and walks back to the test centre. You can book again next season.'; }
      if (x === undefined) x = L.chance(clamp(0.1 + m.drv / 110 + L.luck(), 0.1, 0.92)) ? 0.65 + L.rnd() * 0.35 : L.rnd() * 0.62;
      m.tries++;
      m.drv = clamp(m.drv + 2, 0, 100);
      if (grade(x) < 2) {
        L.joy(-6);
        return `${x < 0.35 ? L.pick(['The examiner’s pen moves, and does not stop moving. A serious fault: it is over before the end of Chapel Lane.', 'There is a cyclist, and then there is a lot of shouting, some of it yours. A fail.']) : L.pick(['Six minor faults: one too many. "So close," says the examiner, kindly. He has said it before.', 'Nearly. You wandered over the line once too often.'])} Book again next season.`;
      }
      const minors = Math.max(0, Math.round((1 - x) / 0.07));
      m.lic = s.t; m.passed = true; m.drv = Math.max(m.drv, 55);
      if (m.tries === 1) m.first = true;
      L.motorJess(4); L.joy(12);
      L.note(`Passed the driving test${m.tries === 1 ? ', first time' : ` at the ${['', 'first', 'second', 'third', 'fourth', 'fifth'][m.tries] || `${m.tries}th`} attempt`}.`, 'big');
      L.say('🚗', 'You passed your driving test!', 'good');
      return `"I’m pleased to tell you," says the examiner, "that you have passed." ${minors ? `${minors} minor fault${minors > 1 ? 's' : ''}, and none that matter.` : 'Not a single fault. He looks almost cheated.'} Jess Dobbs hands you a tin of travel sweets. Now you need a car.`;
    },
  });

  // ---- buying and selling ----
  const yardCar = (L, id) => L.motorYard().cars.find((c) => c.id === id) || null;
  const canBuy = (L) => (L.s.motor.lic == null ? 'Jess will not let you drive it off the forecourt without a licence.' : L.motorBanned() ? '"You’re banned, love," says Jess.' : L.s.use.motorGot ? 'One car a season is plenty.' : null);
  def('motorYardOpen', {
    place: 'garage', sec: 'The forecourt', icon: '🏷️', title: 'Look round the forecourt', time: 0, open: 'motorYard',
    desc: (L) => (L.s.motor.lic == null ? 'Used cars, new ones to order, and something sorry in the back now and then. You will need a licence to drive one away.' : 'A few used cars every season, each with a story, and new ones to order.'),
  });
  // (Cars used to be sold on the High Street: this says where they went.)
  def('motorHigh', {
    place: 'highstreet', sec: 'Getting about', icon: '🚗', title: 'A car', time: 0, open: 'motorYard',
    desc: 'Sold, mended and learned in at Dobbs & Daughter, up the hill. Two more blocks of time every season.',
  });
  def('motorBuy', {
    time: 0, cost: (L, id) => { const c = yardCar(L, id); return c ? Math.max(0, L.motorNet(c.price)) : 0; },
    why: (L, id) => (!yardCar(L, id) ? 'That one has gone.' : canBuy(L)),
    run(L, id) {
      const c = yardCar(L, id), y = L.motorYard(), net = L.motorNet(c.price);
      if (net < 0) L.cash(-net);
      y.cars.splice(y.cars.indexOf(c), 1);
      const had = L.motorTake(c);
      const warned = c.tag === 'lemon' && L.motorHint(c);
      const tail = c.tag === 'lemon' ? (warned ? ' Jess hands over the keys without a word, which says plenty.' : ` It is only on the way home that you notice the smell, and the noise, and that the oil on the dipstick looks like gravy. It is not ${c.cond} out of 100. It is more like ${c.real}.`) : c.tag === 'bargain' ? ' A bargain, and you both know it.' : '';
      return `${had ? `Jess takes your ${MODELS[had.m].name} in part-exchange. ` : ''}The ${c.col} ${carName(c)} is yours. ${L.pick(['Jess gives it a pat on the bonnet, as if to say goodbye.', 'Len shows you where the spare wheel is, and the crisps somebody left under the seat.', 'It smells of somebody else’s dog, but only faintly.'])}${tail}`;
    },
  });
  def('motorNew', {
    time: 0, cost: (L, id) => (MODELS[id] ? Math.max(0, L.motorNet(MODELS[id].price)) : 0),
    why: (L, id) => (!MODELS[id] ? 'No such car.' : canBuy(L)),
    run(L, id) {
      const k = MODELS[id], net = L.motorNet(k.price);
      if (net < 0) L.cash(-net);
      const had = L.motorTake({ m: id, age: 0, cond: 100, col: L.pick(COLOURS) });
      return `${had ? `Your ${MODELS[had.m].name} goes in part-exchange. ` : ''}Jess rings the dealer in Kettleby, and a brand new ${L.s.motor.car.col} ${k.make} ${k.name} comes up the hill on a lorry the next morning. It smells of nothing at all, which is what new smells like.`;
    },
  });
  def('motorSell', {
    time: 0,
    why: (L) => (!car(L) ? 'You have no car.' : L.s.use.motorGot ? 'You have only just bought it.' : null),
    run(L) {
      const c = car(L), pay = tradeIn(c);
      L.motorDrop(); L.cash(pay);
      return `Jess walks round the ${MODELS[c.m].name} twice, kicks a tyre, and offers ${money(pay)}. ${c.cond < 40 ? '"For the parts," she says.' : '"I’ll have it sold by Friday," she says.'} You are on foot again.`;
    },
  });

  // ---- keeping it on the road ----
  def('motorDesk', {
    place: 'garage', sec: 'Your car', icon: '📋', time: 0, open: 'motorGarage',
    title: (L) => (car(L) ? `Your ${L.motorCarName()}` : 'Your licence and your car'),
    desc: (L) => { const c = car(L); return c ? `${c.off ? 'Off the road. ' : ''}Condition ${Math.round(c.cond)}. Worth about ${money(tradeIn(c))} to Jess.` : 'Lessons, tests, points on your licence, and the car when you have one.'; },
  });
  def('motorService', {
    place: 'garage', sec: 'Your car', icon: '🛢️', cost: (L) => L.motorServiceCost(), per: 1,
    title: (L) => `Have the ${L.motorShort() || 'car'} serviced`,
    desc: (L) => (car(L) ? `Oil, filters, a look at everything. Condition ${Math.round(car(L).cond)}, and a car its age can be brought up to ${Math.round(L.motorCap())}.` : ''),
    show: (L) => !!car(L) && !car(L).off,
    why: (L) => (car(L) && car(L).cond >= L.motorCap() - 2 ? 'It is running as well as a car its age can.' : null),
    run(L) {
      const c = car(L);
      c.cond = Math.min(L.motorCap(), c.cond + 22);
      L.motorJess(2);
      return L.pick(['Jess has it up on the ramp for an hour. Len watches from a deckchair and points at things with his mug.', `"Your brakes were nearly down to the metal," says Jess, cheerfully. They are not now.`, 'New oil, new plugs, and a little air freshener shaped like a pine tree that nobody asked for.']);
    },
  });
  def('motorFix', {
    place: 'garage', sec: 'Your car', icon: '🔧', time: 0, cost: (L) => (car(L) ? car(L).fix : 0),
    title: (L) => `Have Jess fix the ${L.motorShort() || 'car'}`,
    desc: (L) => (car(L) && car(L).off ? `${{ broken: 'It broke down', mot: 'It failed its MOT', crash: 'It came off worst in a crash' }[car(L).off]}. ${car(L).fix ? `${money(car(L).fix)} puts it right.` : 'The insurers are paying; it will be ready next season.'}` : ''),
    show: (L) => !!car(L) && !!car(L).off,
    why: (L) => (!car(L).fix ? 'It will be ready next season.' : null),
    run(L) {
      const c = car(L);
      c.off = null; c.fix = 0; c.cond = Math.max(c.cond, Math.min(L.motorCap(), 55));
      L.motorJess(2);
      return L.pick([`Jess has the ${MODELS[c.m].name} running by teatime. "You were lucky," she says. "Next time, listen to it."`, 'Two days, one part from a scrapyard in Kettleby, and a lot of swearing in the inspection pit. It starts first time.']);
    },
  });
  def('motorDiy', {
    place: 'garage', sec: 'Your car', icon: '🪛', time: 2, cost: (L) => (car(L) ? r10(car(L).fix * 0.35) : 0),
    title: 'Fix it yourself, in the yard',
    desc: (L) => `Parts only, and Jess’s tools. ${Math.round(L.checkOdds('craft', 45) * 100)}% you manage it; if not, the parts are wasted.`,
    show: (L) => !!car(L) && !!car(L).off && car(L).fix > 0,
    run(L) {
      const c = car(L);
      L.gain('craft', 1.6);
      if (!L.chance(L.checkOdds('craft', 45))) { L.joy(-2); return 'Two hours under the car, and you put it all back with one piece over. It still does not go. Jess raises an eyebrow and says nothing.'; }
      c.off = null; c.fix = 0; c.cond = Math.max(c.cond, Math.min(L.motorCap(), 50));
      L.joy(3); L.motorJess(2);
      return 'Oil to the elbows, a borrowed socket set, and then the sweet sound of it starting. Jess, passing, nods. That nod is worth more than money.';
    },
  });

  // ---- the back bay: a classic to bring back ----
  const proj = (L) => L.s.motor.proj;
  def('motorClassicBuy', {
    time: 0, cost: (L, id) => (CLASSICS[id] ? CLASSICS[id].wreck : 0),
    why: (L, id) => (!CLASSICS[id] ? 'No such car.' : proj(L) ? 'Len’s bay only takes one at a time.' : L.motorYard().classic !== id ? 'It is not on the forecourt this season.' : null),
    run(L, id) { L.motorYard().classic = null; return L.motorStart(id, CLASSICS[id].wreck); },
  });
  Object.assign(Life.prototype, {
    motorStart(id, paid) {
      const m = this.s.motor, k = CLASSICS[id];
      m.proj = { m: id, st: 0, p: 0, q: 0, n: 0, b: 0, need: null, got: false, done: false, paid, spent: 0, at: this.s.t };
      this.note(`Bought a rusty ${k.make} ${k.name} to restore.`, 'big');
      return `${An(k.body)} with grass growing out of the seats, and the ${k.make} badge still on the bonnet. Len pushes it into the back bay and looks at it the way other men look at puppies.`;
    },
  });
  def('motorWork', {
    place: 'garage', sec: 'The back bay', icon: (L) => (L.motorStage() || STAGES[0]).icon, per: 2, cost: (L) => L.motorStageCost(),
    title: (L) => (L.motorStage() ? `${L.motorStage().name}: the ${CLASSICS[proj(L).m].name}` : 'Work on the car in the back bay'),
    desc: (L) => { const p = proj(L), g = L.motorStage(); return g ? `Stage ${p.st + 1} of ${STAGES.length}, ${p.p} of ${g.n} done${!p.got ? '. Parts for this stage are paid when you start it' : ''}. Better with Craft.` : ''; },
    show: (L) => !!proj(L) && !proj(L).done,
    why: (L) => (proj(L).need ? `First you need ${proj(L).need}.` : null),
    run(L) {
      const s = L.s, m = s.motor, p = m.proj, g = STAGES[p.st], k = CLASSICS[p.m];
      if (!p.got) { p.spent += L.motorStageCost(); p.got = true; }
      const said = g.says[Math.min(p.p, g.says.length - 1)];
      p.p++; p.n++;
      p.q += clamp(s.st.craft + 8 + L.gauss() * 10 + (L.motorJessAll() >= 50 ? 5 : 0), 5, 100);
      L.gain('craft', 1.7); L.joy(2); L.motorJess(1);
      if (p.p < g.n) return said;
      p.st++; p.p = 0; p.got = false;
      if (p.st === PART_STAGE) p.need = k.part;
      if (p.st < STAGES.length) return `${said} ${g.fin}${p.need ? ` Next the engine, and for that you need ${p.need}, which nobody has.` : ''}`;
      p.done = true; m.n.restored++;
      L.joy(10); L.fame(1);
      L.note(`Finished restoring a ${k.make} ${k.name}. It is worth ${money(L.motorProjValue())}.`, 'big');
      L.say(k.icon, `The ${k.name} is finished`, 'good');
      return `${said} And then there is nothing left to do. You wheel the ${k.name} out into the sun, and Jess and Len and a man who was passing stand and look at it for a long while. It is worth about ${money(L.motorProjValue())}.`;
    },
  });
  def('motorHunt', {
    place: 'market', sec: 'The autojumble', icon: '🔩', per: 1, cost: 20,
    title: (L) => `Hunt for ${(proj(L) && proj(L).need) || 'parts'}`,
    desc: (L) => `The car-boot men on the far side of the square, on Sundays. About ${Math.round(L.motorHuntOdds() * 100)}% you find one, cheap.`,
    show: (L) => !!proj(L) && !!proj(L).need,
    run(L) {
      const p = proj(L), k = CLASSICS[p.m];
      L.gain('charm', 0.6);
      if (!L.chance(L.motorHuntOdds())) return L.pick(['Boxes of spark plugs, a stuffed owl, and a man who had one last week. Not this week.', 'You find one. It is for a tractor. Priya Lal sells you a cheese to make up for it.']);
      const pay = r10(k.top * 0.012), got = p.need;
      L.cash(-pay); p.spent += pay; p.need = null;
      return `Under a trestle table, wrapped in an old copy of the Gazette: ${got}. The man wants ${money(pay)}, and you do not argue.`;
    },
  });
  Life.prototype.motorHuntOdds = function () { return clamp(0.22 + this.s.st.charm / 220 + this.s.st.smarts / 400 + this.luck(), 0.1, 0.8); };
  def('motorPartOrder', {
    place: 'garage', sec: 'The back bay', icon: '📦', time: 0, cost: (L) => (proj(L) ? r10(CLASSICS[proj(L).m].top * 0.07) : 0),
    title: (L) => `Have Jess find ${(proj(L) && proj(L).need) || 'the part'}`,
    desc: 'There is a man in Wales who has one. He knows it.',
    show: (L) => !!proj(L) && !!proj(L).need,
    run(L) { const p = proj(L), k = CLASSICS[p.m]; p.spent += r10(k.top * 0.07); p.need = null; return `Jess makes three phone calls and one of them is in Welsh. ${k.part[0].toUpperCase()}${k.part.slice(1)} arrives in a box full of straw.`; },
  });
  def('motorClassicSell', {
    time: 0,
    why: (L) => (!proj(L) ? 'There is nothing in the back bay.' : proj(L).at === L.s.t ? 'You have only just bought it.' : null),
    run(L) {
      const m = L.s.motor, p = m.proj, k = CLASSICS[p.m], pay = L.motorProjValue();
      m.proj = null; L.cash(pay);
      if (p.done) { m.n.sold++; L.note(`Sold the ${k.make} ${k.name} you restored, for ${money(pay)}.`, 'big'); return `A collector comes down from the city in a camel coat, walks round the ${k.name} three times, and writes a cheque for ${money(pay)} without haggling. You watch it go down the hill with a lump in your throat.`; }
      return `Jess finds a man who likes a project. He gives you ${money(pay)} for the ${k.name} as it stands, and tows it away on a trailer.`;
    },
  });
  def('motorShow', {
    place: 'ground', sec: 'The car show', icon: '🏆', cost: 50, per: 1,
    title: (L) => `Show the ${proj(L) ? CLASSICS[proj(L).m].name : 'car'} at the County Classic Car Show`,
    desc: (L) => (proj(L) ? `Every summer on the Rovers’ pitch: rosettes, a brass band, and a judge with a torch. Your ${CLASSICS[proj(L).m].name} is ${L.motorQuality() >= 85 ? 'a contender' : L.motorQuality() >= 70 ? 'in with a chance' : 'there to be admired, mostly'}.` : ''),
    show: (L) => !!proj(L) && proj(L).done && L.season === 1,
    why: (L) => (L.s.motor.shown === L.year ? 'Once a summer.' : null),
    run(L) {
      const s = L.s, m = s.motor, k = CLASSICS[m.proj.m], sc = L.motorQuality() + L.gauss() * 7 + s.st.charm / 12 - 4;
      m.shown = L.year; m.n.shows++;
      L.joy(5);
      if (sc >= 84) { m.n.wins++; L.cash(2000); L.fame(2); L.joy(8); L.note(`Best in show at the County Classic Car Show, with the ${k.name}.`, 'big'); return `The judge looks under the ${k.name} with his torch for a long time, then straightens up and pins a red rosette on the wing mirror. Best in show, and ${money(2000)}. Gaz Kowalski buys you a pie to celebrate.`; }
      if (sc >= 74) { L.cash(800); L.fame(0.6); return `Second in show, behind a man who has been polishing the same car since 1987. A blue rosette and ${money(800)}.`; }
      if (sc >= 64) { L.cash(300); L.fame(0.3); return `Third: a yellow rosette and ${money(300)}. A small boy asks if he can sit in it, and you let him.`; }
      return 'No rosette this year. But people stop and look, and three of them tell you about the one their dad had.';
    },
  });

  // ---- out on the road ----
  def('motorTripsOpen', {
    place: 'home', sec: 'Out in the car', icon: '🗺️', title: 'Go for a day out in the car', time: 0, open: 'motorTrips',
    desc: (L) => `Somewhere out of town and back by dark. ${Object.keys(L.s.motor.trips).length} of ${Object.keys(DRIVES).length} places been to so far.`,
    show: (L) => L.motorUsable(),
  });
  def('motorTrip', {
    time: 2, cost: (L, id) => (DRIVES[id] ? DRIVES[id].cost : 0), per: 1,
    why: (L, id) => (!DRIVES[id] ? 'No such place.' : !L.motorUsable() ? 'You need a car that goes.' : DRIVES[id].only && !DRIVES[id].only.includes(L.season) ? 'Not in winter. The ice-cream van has gone south.' : null),
    run(L, id) {
      const s = L.s, m = s.motor, t = DRIVES[id], c = m.car, firstTime = !m.trips[id];
      m.trips[id] = (m.trips[id] || 0) + 1; m.n.trips++;
      c.cond = Math.max(5, c.cond - 1.5);
      m.drv = clamp(m.drv + 0.5, 0, 100);
      L.joy(t.joy * (firstTime ? 1 : 0.8));
      if (t.stat) L.gain(t.stat, 1.5);
      const pt = L.partner(), kids = L.kids().filter((k) => k.age < 18);
      if (pt) L.bond(pt, 5);
      for (const k of kids) L.bond(k, 3);
      if (firstTime) L.note(`Drove out for the day to ${t.name.replace(/^The /, 'the ')}.`);
      let said;
      if (id === 'moor') said = s.wx === 'fog' ? 'Fog comes down on Rook Moor like a lid. You are lost for an hour, and then a pony walks out of the murk and looks at you as if you are the strange one.' : L.pick(['The ponies come right up to the car. One of them licks the wing mirror.', 'You walk to the trig point and back. The wind takes your hat, and nearly you.', 'A skylark goes up and up and does not stop singing. Neither, for once, do your thoughts.']);
      else if (id === 'castle') said = L.pick(['The guide knows everything about the siege of 1643 and tells you most of it.', 'Half a castle, a whole tea room. You do both justice.', 'You stand on the battlements and imagine boiling oil. It helps with a few things at work.']);
      else if (id === 'fair') {
        if (L.chance(0.25)) { const k = L.gotCurio(L.anyCurio()), pay = r10(k.worth * 0.35); L.cash(-pay); said = `On a stall between the horse brasses and the tea towels: ${k.a}. The woman wants ${money(pay)}. Mr Pym would want a great deal more.`; }
        else said = L.pick(['A field of trestle tables, and on every one a thing your gran had.', 'You very nearly buy a stuffed pike. You buy a cake instead.', 'Mr Pym is there, in a panama hat, pretending not to see you.']);
      } else if (id === 'sands') said = s.wx === 'hot' ? (L.joy(4), 'The hottest day of the year. The sea is like a bath that somebody else has been in. Bliss.') : L.pick(['Two miles of sand and nearly nobody on it.', 'You build a sandcastle with a moat, and the sea comes in exactly when it said it would.', 'An ice cream with a flake, eaten too quickly, in the wind.']);
      else if (id === 'museum') {
        const p = m.proj;
        if (p && !p.done && (p.b || 0) < 6) { p.b = (p.b || 0) + 3; said = `There is a ${CLASSICS[p.m].name} on a plinth, restored by somebody who knew what they were doing. You take forty photographs of the way they did the trim.`; }
        else said = L.pick(['A hundred years of cars, all polished, none of them yours.', 'A steam car from 1904 that a volunteer starts every hour, to applause.', 'You sit in a racing car from the fifties. Getting out is harder.']);
      } else {
        const folk = s.people.filter((p) => p.kind === 'parent');
        for (const p of folk) L.bond(p, 6);
        L.hp(1);
        said = folk.length ? `You take ${folk[0].name} for scones and a look at the bedding plants. ${folk[0].name} buys a hydrangea and talks about it all the way home.` : 'Scones, a look at the bedding plants, and a man trying very hard to sell you a hot tub.';
      }
      if (L.chance(0.1)) L.queue('motorCoast');
      return `${said}${pt ? ` ${first(pt)} came too.` : ''}`;
    },
  });
  def('motorLift', {
    who: true, sec: 'Lifts', icon: '🚗', time: 1,
    title: (L, p) => `Give ${first(p)} a lift`,
    desc: (L, p) => { const a = L.s.motor.asks.find((q) => q.p === p.id); return a ? `${first(p)} needs a lift ${a.to}.` : ''; },
    show: (L, p) => L.motorUsable() && L.s.motor.asks.some((q) => q.p === p.id),
    run(L, p) {
      const m = L.s.motor, a = m.asks.find((q) => q.p === p.id);
      m.asks = m.asks.filter((q) => q !== a); m.n.lifts++;
      m.car.cond = Math.max(5, m.car.cond - 0.5);
      L.bond(p, 8); L.joy(2); L.karma(1); L.gain('charm', 0.5);
      return `You run ${first(p)} ${a.to}. ${L.pick([`${first(p)} insists on paying for the petrol, then forgets.`, `You talk the whole way, about everything, and both of you are sorry to arrive.`, `${first(p)} chooses the music. You do not mention it.`, `${first(p)} says you are a lifesaver, and seems to mean it.`])}`;
    },
  });
  def('motorCab', {
    place: 'station', sec: 'The taxi rank', icon: '🚕', time: 1, per: 2,
    title: 'Drive Doris for the evening',
    desc: (L) => `Doris is Dobbs & Daughter’s old taxi, an estate with a light on the roof. Fares and tips, better with Charm: about ${money(L.motorCabPay())}.`,
    show: (L) => L.s.motor.lic != null,
    why: (L) => (L.motorBanned() ? 'Not while you are banned from driving.' : L.s.t - L.s.motor.lic < 4 ? 'Len’s insurers want a year’s driving first.' : L.motorPoints() > 6 ? 'Not with that many points on your licence.' : null),
    run(L) {
      const s = L.s, m = s.motor, r = L.rnd();
      let pay = r10(L.motorCabPay() * (0.8 + L.rnd() * 0.45)), said;
      if (r < 0.05) { pay = 0; L.joy(-2); said = 'Your last fare of the night gets out at the lights by the chip shop and runs. He was quicker than he looked.'; }
      else if (r < 0.11) { pay = Math.max(0, pay - 40); said = 'A stag party, singing. One of them is sick on the back seat. You spend the end of the night and $40 of your takings on Doris’s upholstery.'; }
      else if (r < 0.18) { pay += 250; said = 'A woman who has missed the last train pays you to take her all the way to the city, and tips like royalty.'; }
      else if (r < 0.26 && L.friends().length < 20) { const p = L.meet(); said = `Your fare is ${p.name}, who talks all the way up the hill and gives you ${p.sex === 'm' ? 'his' : 'her'} number at the end.`; }
      else said = L.pick(['The pub, the station, the pub, the hospital, the pub.', 'An old man going to see his sister, who tells you about every house you pass.', 'Two nurses off a late shift, asleep before the first roundabout.', 'A quiet night. You do the crossword on the rank with Len, who knows none of the answers and all of the gossip.']);
      s.n.earned += pay; L.cash(pay);
      m.n.drives++; m.drv = clamp(m.drv + 0.4, 0, 100); L.motorJess(0.5); L.gain('charm', 0.5);
      return `${said} ${pay ? `${money(pay)} for the night.` : 'Nothing for the night.'}`;
    },
  });
  Life.prototype.motorCabPay = function () { return r10(170 + this.s.st.charm * 3.2); };
  def('motorDeliver', {
    place: 'highstreet', sec: 'Deliveries', icon: '🍟', time: 1, per: 2,
    title: 'Deliver fish suppers for the chip shop',
    desc: (L) => `In your own car, paid by the drop. About ${money(L.motorDropPay())}, less the petrol.`,
    show: (L) => L.s.motor.lic != null,
    why: (L) => (!L.motorUsable() ? (L.motorBanned() ? 'Not while you are banned from driving.' : 'You need a car of your own that goes.') : null),
    run(L) {
      const s = L.s, m = s.motor, pay = r10(L.motorDropPay() * (0.85 + L.rnd() * 0.4)) - 15;
      m.car.cond = Math.max(5, m.car.cond - 1);
      s.n.earned += pay; L.cash(pay);
      m.n.drives++; m.drv = clamp(m.drv + 0.4, 0, 100);
      if (L.chance(0.12)) L.queue('motorCoast', { late: true });
      return `${L.pick(['Cod and chips to forty doors, and you only get lost in the new estate twice.', 'A man in a dressing gown tips you a pound and a pickled egg.', 'The back of the car will smell of vinegar until the spring. It is worth it.', 'Up the hill, down to the harbour, up the hill again. Everybody is pleased to see you, or at least your carrier bag.'])} ${money(pay)}, after the petrol.`;
    },
  });
  Life.prototype.motorDropPay = function () { const s = this.s, c = s.motor.car; return r10((150 + s.motor.drv * 2.2 + s.st.fitness * 0.8) * (c && MODELS[c.m].big ? 1.15 : 1)); };

  // ---- the rules hung on the turn of the season ----
  hooks.load.push((L) => {
    const s = L.s;
    if (!s.motor) {
      s.motor = { drv: 0, les: 0, th: false, tries: 0, lic: null, passed: false, first: false, old: false, pts: [], ban: 0, car: null, yard: null, nid: 1, proj: null, jess: 20, asks: [], trips: {}, shown: null, pub: -9, n: { cars: 0, drives: 0, lifts: 0, trips: 0, shows: 0, wins: 0, restored: 0, sold: 0, bans: 0, dui: 0, got: 0 } };
      // A life that already had a car keeps it, and is given a licence for it.
      // (Both, and Jess takes the hatchback off your hands.)
      if (s.items.car || s.items.sportscar) {
        L.motorAdopt(s.items.sportscar ? 'vela' : 'pip');
        if (s.items.car && s.items.sportscar) { const pay = tradeIn({ m: 'pip', age: 7, cond: 75 }); s.cash += pay; L.note(`Jess Dobbs took the old hatchback off your hands for ${money(pay)}.`); }
        L.motorSync(false);
      }
    }
  });
  hooks.bills.push((L, out, jailed) => {
    const m = L.s.motor, c = m.car;
    if (c && c.age >= 3 && L.season === c.mot && !jailed) out.push([`MOT test for the ${MODELS[c.m].name}`, MOT_FEE]);
    // (A car left at home while you are inside costs only its tax and insurance.)
    if (c && (!L.motorUsable() || jailed)) out.push([`Tax and insurance on the ${MODELS[c.m].name}, off the road`, 90]);
    if (m.proj) out.push([`Len’s back bay, for the ${CLASSICS[m.proj.m].name}`, 120]);
  });
  hooks.season.push((L, lines, jailed) => {
    const s = L.s, m = s.motor, c = m.car;
    if (!c) return;
    const use = L.motorUsable();
    c.cond = clamp(c.cond - (jailed ? 2 : use ? 1.3 + c.age * 0.12 : 0.6), 5, 100);
    if (jailed) return;
    // The yearly MOT, once a car is three years old. (The fee is in the bills.)
    if (c.age >= 3 && L.season === c.mot) {
      if (L.chance(clamp(0.25 + c.cond / 90 - c.age * 0.01, 0.1, 0.97))) { c.motAt = s.t; return; }
      const fix = r10(140 + MODELS[c.m].price * 0.0025 * (100 - c.cond) / 10);
      if (!c.off) { c.off = 'mot'; c.fix = fix; } else c.fix += fix;
      L.queue('motorMot', { fix: c.fix });
      return;
    }
    // A car that is not looked after lets you down.
    if (use && L.chance(clamp(0.02 + (72 - c.cond) / 160, 0.02, 0.4) / MODELS[c.m].rel)) L.queue('motorBreakdown', { fix: r10(80 + MODELS[c.m].price * 0.003 * (100 - c.cond) / 10) });
  });
  hooks.late.push((L, jailed) => {
    const s = L.s, m = s.motor;
    if (m.ban && s.t >= m.ban) { m.ban = 0; if (m.lic != null) { L.note('The driving ban came to an end.'); L.say('🚗', 'Your driving ban is over', 'good'); } }
    m.pts = m.pts.filter(([t]) => s.t - t < 12);
    if (m.car && m.car.off === 'crash' && !m.car.fix) { m.car.off = null; m.car.cond = Math.max(m.car.cond, Math.min(condCap(m.car), 60)); }
    m.jess = Math.max(0, m.jess - 0.5);
    m.asks = jailed ? [] : L.motorAsks();
    L.motorSync(false);
  });
  hooks.year.push((L) => { const c = L.s.motor.car; if (c) c.age++; });
  hooks.worth.push((L) => L.motorTrade() + L.motorProjValue());
  // The bailiffs take the car, and then the classic.
  hooks.seize.push((L) => {
    const m = L.s.motor;
    if (m.car) { const c = m.car, pay = tradeIn(c); L.motorDrop(); L.motorSync(false); return [`your ${carName(c)}`, pay]; }
    if (m.proj) { const p = m.proj, pay = L.motorProjValue(); m.proj = null; return [`the ${classicName(p)} in the back bay`, pay]; }
    return null;
  });
  // After the pub, the car is still parked outside.
  const PUB = { binge: 0.4, round: 0.15, chat: 0.08, quiz: 0.08, openmic: 0.08, wrestle: 0.06 };
  hooks.acted.push((L, id) => {
    const s = L.s, m = s.motor;
    if (PUB[id] && L.motorUsable() && !s.use.motorPub && s.t - m.pub >= 2 && L.chance(PUB[id])) { s.use.motorPub = 1; m.pub = s.t; L.queue('motorPub'); }
    L.motorSync(true);
  });
  hooks.chose.push((L) => L.motorSync(true));

  // ---- the cards ----
  const off = (L, why, fix) => { const c = car(L); if (!c) return; c.off = why; c.fix = fix; };
  const stopped = (why) => (L) => L.queue('motorStopped', { why });
  addEvents([
    {
      id: 'motorBreakdown', icon: '💨', title: 'Steam from under the bonnet', ok: (L) => !!car(L) && !car(L).off,
      text: (L, x) => `${L.pick(['Halfway up Harbour Hill', 'On the coast road, miles from anywhere', 'In the middle of the High Street on market day'])}, the ${L.motorShort()} coughs, bangs and gives up. Jess reckons ${money(x.fix)} would see to it.`,
      opts: [
        { t: 'Ring Jess to come out', cost: (L, x) => x.fix + 60, run(L) { const c = car(L); c.cond = Math.min(condCap(c), c.cond + 8); L.motorJess(1); return 'Jess arrives in the breakdown truck with Len asleep in the passenger seat. Twenty minutes with her head under your bonnet, and it runs.'; } },
        { t: 'Have a look yourself', check: ['craft', 40], run(L, x, win) { L.gain('craft', 1); if (win) { L.cash(-30); return 'A split hose. You bind it with tape from the glovebox and limp to the garage for a new one. Thirty dollars, and enormous pride.'; } off(L, 'broken', r10(x.fix * 1.3)); return 'You fiddle with something you should not have fiddled with. It now does not go in a new and more expensive way. Jess tows it in.'; } },
        { t: 'Leave it, and walk', run(L, x) { off(L, 'broken', x.fix + 60); L.joy(-2); return 'You leave it with its hazard lights on and walk. Jess tows it up to the garage, where it will wait until you can pay to have it put right.'; } },
      ],
    },
    {
      id: 'motorMot', icon: '📋', title: 'It failed its MOT', ok: (L) => !!car(L) && car(L).off === 'mot',
      text: (L, x) => `Jess hands you the list. It is long: brakes, a tyre, something called a track rod end, and a headlamp pointing at the sky. ${money(x.fix)} to put it right. Until then, the ${L.motorShort()} is off the road.`,
      opts: [
        { t: 'Have it all put right', cost: (L, x) => x.fix, run(L) { const c = car(L); c.off = null; c.fix = 0; c.cond = Math.min(condCap(c), c.cond + 10); c.motAt = L.s.t; L.motorJess(1); return 'Two days on the ramp. It passes the retest, and Jess gives you the certificate as if it were a school report.'; } },
        { t: 'Leave it off the road for now', run() { return 'It sits in the yard with a sheet over it. You can have it fixed at the garage when you are ready.'; } },
        { t: 'Sell it to Jess as it stands', run(L) { const c = car(L), pay = Math.max(100, r10(tradeIn(c) - c.fix)); L.motorDrop(); L.cash(pay); return `"For the parts," says Jess, and gives you ${money(pay)}.`; } },
      ],
    },
    {
      id: 'motorPub', icon: '🍺', title: 'Closing time', ok: (L) => !!car(L),
      text: (L) => `The landlord is ringing the bell. Your ${L.motorShort()} is parked outside on the quay, and it is a long ${L.s.wx === 'wet' || L.s.wx === 'storm' ? 'wet ' : ''}walk home. You feel fine. You always feel fine.`,
      opts: [
        { t: 'Leave it, and walk home', run(L) { if (L.s.wx === 'wet' || L.s.wx === 'storm' || L.s.wx === 'snow') L.joy(-1); else L.hp(0.5); return L.pick(['You walk home along the sea wall, singing a little. In the morning the car is where you left it, wearing a seagull.', 'It takes forty minutes and clears your head. You collect the car in the morning, with a clear conscience.']); } },
        { t: 'Ring for Doris, the taxi', cost: 35, run() { return 'Len Dobbs drives you home at eleven miles an hour, explaining the offside rule.'; } },
        { t: 'Drive. It is only a mile.', odds: (L) => L.motorPubOdds(), run(L, x, win) {
          const m = L.s.motor;
          L.karma(-3);
          if (win) { m.n.got++; return L.pick(['You get home. You do not remember the drive, which should frighten you more than it does.', 'Home, with one wheel on the kerb most of the way. Nobody saw. This time.']); }
          if (L.chance(0.35)) { L.queue('motorCrash'); return 'The bend at the bottom of Harbour Hill comes sooner than it used to.'; }
          stopped('drink')(L);
          return 'Blue lights fill the mirror before you are past the chandlery.';
        } },
      ],
    },
    {
      id: 'motorCrash', icon: '💥', title: 'The lamp post at the bottom of the hill', ok: (L) => !!car(L),
      text: 'It was there all along, of course. The bonnet is folded like a letter, steam is coming from somewhere, and lights are going on in the houses.',
      opts: [
        { t: 'Wait for the police', run(L) { const said = L.motorSmash(true); return `${L.motorDrunk(0)} ${said}`; } },
        { t: 'Walk away, and say it was stolen', odds: (L) => clamp(0.45 - L.s.heat / 200, 0.1, 0.6), run(L, x, win) {
          L.karma(-8); L.s.n.crimes++;
          const said = L.motorSmash(true, 0.8);
          if (win) { L.warm(20); return `Nobody saw a thing. You report it stolen in the morning, with a straight face. ${said}`; }
          L.motorBan(12);
          L.queue('busted', { what: 'a crumpled car, a lamp post, and your breath', sev: 3 });
          return `A neighbour in a dressing gown saw everything, and took the number. ${said}`;
        } },
      ],
    },
    {
      id: 'motorStopped', icon: '🚓', title: 'Blue lights in the mirror', ok: (L) => !!car(L),
      text: (L, x) => (x && x.why === 'drink' ? 'The constable leans in at the window and sniffs, theatrically. "Been anywhere nice tonight?"' : '"Do you know how fast you were going?" says the constable. You do. That is the trouble.'),
      opts: [
        { t: 'Blow into the bag', show: (L, x) => x && x.why === 'drink', run(L) { return L.motorDrunk(0); } },
        { t: 'Take the points', show: (L, x) => !x || x.why !== 'drink', cost: 100, run(L) { return `A ${money(100)} fine and ${L.motorAddPoints(3)}.`; } },
        { t: 'Talk your way out of it', check: ['charm', 72], run(L, x, win) {
          if (win) { L.warm(4); return x && x.why === 'drink' ? 'You are so charming and so plausible that the constable drives you home himself, and tells you to fetch the car in the morning. Lucky. Very lucky.' : 'A warning, and a long look. You drive home at exactly the limit.'; }
          if (x && x.why === 'drink') return L.motorDrunk(1);
          L.cash(-200); return `"Save it for the magistrate." A ${money(200)} fine and ${L.motorAddPoints(4)}.`;
        } },
        { t: 'Put your foot down', odds: (L) => L.motorFleeOdds(), run(L, x, win) {
          const s = L.s;
          s.n.crimes++; L.karma(-6);
          if (win) { L.warm(25); L.joy(3); return 'Down Chapel Lane with the lights off, round the back of the farm, into Tom Windle’s barn. You sit in the dark among the cows until the sirens fade. They will be looking for you now.'; }
          const said = L.motorSmash(x && x.why === 'drink', 1.3);
          L.motorBan(12);
          L.queue('busted', { what: 'a police chase, a hedge and a car on its roof', sev: 3 });
          return `You make it as far as the bend by Windle Farm. The hedge stops you; the police car stops behind it. ${said}`;
        } },
      ],
    },
    {
      id: 'motorCoast', icon: '🛣️', title: 'An empty road', w: 3, when: (L) => L.motorUsable(),
      text: (L, x) => (x && x.late ? 'You are late with six fish suppers going cold on the back seat, and the coast road is empty for miles.' : `The coast road is empty for miles, the ${L.motorShort()} is purring, and you are late.`),
      opts: [
        { t: 'Put your foot down', odds: (L) => clamp(0.72 - L.s.heat / 300, 0.4, 0.72), run(L, x, win) {
          const sport = MODELS[car(L).m].sport;
          if (win) { L.joy(sport ? 6 : 3); return sport ? 'The Vela was made for this road and you were made for the Vela. For four minutes you are completely happy.' : 'The sea flashes by on your left. You arrive on time, and slightly too pleased with yourself.'; }
          if (L.chance(0.6)) { L.cash(-100); return `A flash from a grey box on a pole. A week later, a letter: a ${money(100)} fine and ${L.motorAddPoints(3)}.`; }
          stopped('speed')(L);
          return 'A police car pulls out of a lay-by behind you, very calmly.';
        } },
        { t: 'Keep to the limit', run(L) { L.karma(0.5); return L.pick(['You get stuck behind a tractor for six miles. It is quite a nice tractor.', 'You arrive late, and alive, and apologise. Nobody minds as much as you feared.']); } },
      ],
    },
    {
      id: 'motorPullOut', icon: '🚐', title: 'Out of nowhere', w: 2, when: (L) => L.motorUsable(),
      text: 'A van pulls out of Chapel Lane without looking, straight across your bonnet.',
      opts: [
        { t: 'Stand on the brakes', odds: (L) => clamp(0.35 + L.s.motor.drv / 160 + car(L).cond / 300, 0.3, 0.95), run(L, x, win) {
          if (win) { L.joy(-1); return 'You stop with an inch to spare. The van driver gives you a cheery wave, as if you had let him out.'; }
          return `A crunch, a jolt, a lot of glass. You are shaken and bruised. ${L.motorSmash(false, 0.7)}`;
        } },
        { t: 'Swerve for the verge', check: ['fitness', 40], run(L, x, win) {
          if (win) { L.joy(1); return 'You put two wheels on the grass and miss him by a coat of paint. The cows in the next field barely look up.'; }
          return `You miss the van and find the ditch. ${L.motorSmash(false, 0.6)}`;
        } },
      ],
    },
    {
      id: 'motorHitcher', icon: '👍', title: 'A thumb in the rain', w: 2, when: (L) => L.motorUsable(),
      text: 'On the moor road, in the rain: somebody with a rucksack and a thumb out, and the look of a person who has been there a while.',
      opts: [
        { t: 'Pull over', run(L) {
          L.karma(2);
          const r = L.rnd();
          if (r < 0.12) { const lost = Math.min(L.s.cash, 80); L.s.cash -= lost; return `Pleasant company all the way to Kettleby. It is only later that you notice the ${money(lost)} that was in the glovebox has gone with them.`; }
          if (r < 0.5 && L.friends().length < 20) { const p = L.meet(); return `It is ${p.name}, walking the coast path for charity. You talk all the way into town, and arrange to meet for a drink.`; }
          L.joy(2);
          return L.pick(['A student going home to surprise her mum. She sleeps most of the way, then thanks you three times.', 'An old man who used to drive buses. He corrects your gear changes, kindly, and tells you about 1962.']);
        } },
        { t: 'Drive on', run() { return 'You tell yourself somebody else will stop. Somebody probably will.'; } },
      ],
    },
    {
      id: 'motorVicar', icon: '⛪', title: 'The vicar’s flat tyre', w: 2, when: (L) => L.motorUsable(),
      text: 'The Reverend Alice Hollis is standing beside her ancient Albright on Church Lane, looking at a flat tyre as if it had let her down personally. There is a hive of bees in a box on the back seat.',
      opts: [
        { t: 'Change the wheel for her', check: ['craft', 25], run(L, x, win) { L.karma(3); if (win) { L.joy(3); return 'Ten minutes, a wheel brace and some language you keep under your breath. She gives you a jar of honey and a leaflet about the church roof.'; } L.joy(-1); return 'The jack slips, the hubcap rolls into the churchyard, and in the end you ring Jess. The vicar thanks you anyway, warmly, and the bees do not.'; } },
        { t: 'Ring Jess for her', run(L) { L.karma(1); L.motorJess(1); return 'Jess comes out and has it done in five minutes, while you and the vicar talk about bees.'; } },
        { t: 'Wave, and drive on', run(L) { L.karma(-1); return 'She waves back, bravely. You feel bad until about Tuesday.'; } },
      ],
    },
    {
      id: 'motorTicket', icon: '🎫', title: 'Under the windscreen wiper', w: 2, when: (L) => L.motorUsable(),
      text: 'A parking ticket. Mayor Pennington’s new wardens have been out on the High Street, and they have been thorough.',
      opts: [
        { t: 'Pay it', cost: 70, run() { return 'You pay it at the Town Hall. The clerk says that is the eleventh today, with some satisfaction.'; } },
        { t: 'Appeal', check: ['charm', 40], run(L, x, win) { if (win) return 'A strongly worded letter about the faded yellow lines. It is cancelled.'; L.cash(-140); return `Your appeal is turned down, and the fine has doubled to ${money(140)} while you were writing it.`; } },
        { t: 'Ignore it', odds: () => 0.5, run(L, x, win) { if (win) return 'Nothing happens. Nothing at all. You are a little disappointed.'; L.cash(-210); L.warm(3); return `A letter, then a firmer letter, then a man at the door. ${money(210)}, with costs.`; } },
      ],
    },
    {
      id: 'motorBarn', icon: '🌾', title: 'Something under the hay', w: 1.5, cd: 16, when: (L) => !L.s.motor.proj && L.s.cash + L.s.bank >= 4000 && (L.s.motor.lic != null || L.s.st.craft >= 30),
      ctx: (L) => L.pick(Object.keys(CLASSICS)),
      text: (L, id) => `Tom Windle stops you by the farm gate. "There’s a car in my top barn," he says. "Been there since my father. Cows don’t like it." Under the hay and the hens is an old ${CLASSICS[id].make} ${CLASSICS[id].name}, a ${CLASSICS[id].body}. He wants ${money(CLASSICS[id].wreck)} for it, and it gone by Friday.`,
      opts: [
        { t: 'Buy it, and have Jess tow it to the garage', cost: (L, id) => CLASSICS[id].wreck, why: (L) => (L.s.motor.proj ? 'Len’s bay only takes one at a time.' : null), run(L, id) { L.motorJess(2); return L.motorStart(id, CLASSICS[id].wreck); } },
        { t: 'Leave it to the hens', run() { return '"Suit yourself," says Tom, and goes back to talking to a cow called Margaret.'; } },
      ],
    },
    {
      id: 'motorTip', icon: '☎️', title: 'Jess rings', w: 2, cd: 12, when: (L) => L.motorJessAll() >= 55 && L.s.motor.lic != null && !L.motorBanned(),
      ctx: (L) => { const c = L.motorUsedCar('bargain'); c.price = r50(carValue(c) * 0.8); c.held = true; return c; },
      text: (L, c) => `"A part-exchange came in this morning," says Jess. "${an(`${c.age}-year-old ${c.col} ${carName(c)}`).replace(/^a/, 'A')}, one owner, a retired vet. I’m keeping it back for you, if you want it." She means ${money(c.price)}, which is less than it is worth.`,
      opts: [
        { t: 'Ask her to put it on the forecourt for you', run(L, c) { const y = L.motorYard(); if (!y.cars.some((q) => q.id === c.id)) y.cars.unshift({ ...c }); L.motorJess(1); return 'It is at the front of the forecourt with a SOLD sign on it that is not quite true. It will be there this season.'; } },
        { t: 'Thank her, but no', run(L) { L.motorJess(0.5); return '"Your loss," says Jess, cheerfully.'; } },
      ],
    },
  ]);

  // ---- trophies ----
  Object.assign(TROPHIES, {
    motorPass: { name: 'Full licence', icon: '🚗', desc: 'Pass your driving test.', test: (L) => !!L.s.motor && !!L.s.motor.passed },
    motorFirst: { name: 'First time', icon: '🔰', desc: 'Pass your driving test at the first attempt.', test: (L) => !!L.s.motor && !!L.s.motor.first },
    motorTrips: { name: 'Day tripper', icon: '🗺️', desc: 'Drive out to every place on the day-trip list.', test: (L) => !!L.s.motor && Object.keys(DRIVES).every((id) => L.s.motor.trips[id]) },
    motorCabbie: { name: 'The knowledge', icon: '🚕', desc: 'Spend 25 evenings driving for money.', test: (L) => !!L.s.motor && L.s.motor.n.drives >= 25 },
    motorRestored: { name: 'Barn find', icon: '🧰', desc: 'Bring a classic car back to life.', test: (L) => !!L.s.motor && L.s.motor.n.restored >= 1 },
    motorBest: { name: 'Best in show', icon: '🏆', desc: 'Win the County Classic Car Show.', test: (L) => !!L.s.motor && L.s.motor.n.wins >= 1 },
  });
}
