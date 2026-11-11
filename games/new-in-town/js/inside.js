// New in Town: Starling Gaol. A sentence is not skipped: you live it, a
// season at a time, with less time in each and nowhere to spend it but
// the yard, the library, the workshop and the landing.
//
// Two things matter inside. Your record with the governor (good) is what
// a parole board looks at; your standing on the landing (rep) is what
// keeps your pudding on your own tray. Most things that raise one lower
// the other. There are ways out early: parole, an appeal, or the wall.

import { COURSES, money } from './data.js';

const GAOL_TIME = 4;
// What can be studied for inside, in the order it is offered.
const CLASSES = ['trade', 'culinary', 'firstaid', 'skipper'];
const STUDY = 5;
const DIG = 4;

export function install({ def, A, Life, clamp }) {
  Object.assign(Life.prototype, {
    // Sent down for n seasons (on top of anything still being served).
    jail(n) {
      const s = this.s;
      s.f.jailed = 1; s.record++;
      if (s.job) { this.note(`Lost the job as ${this.jobTitle()}.`); s.job = null; }
      if (s.gaol) { s.gaol.left += n; s.gaol.total += n; return; }
      s.run = null; s.hilo = null; s.bj = null;
      s.gaol = { left: n, total: n, served: 0, good: 50, rep: Math.min(40, (s.worked.crew ?? -1) * 8 + 8), dig: 0, study: 0, sol: false, inSol: false, appeal: false, board: null, tat: false };
      s.time = Math.min(s.time, this.timeMax());
      this.note(`Sent to Starling Gaol for ${n} season${n > 1 ? 's' : ''}.`, 'big');
    },
    gaolTime() { return this.s.gaol.inSol ? 1 : GAOL_TIME; },
    behave(d) { const q = this.s.gaol; q.good = clamp(q.good + d, 0, 100); if (d <= -5) this.s.use.trouble = 1; },
    respect(d) { const q = this.s.gaol; q.rep = clamp(q.rep + d, 0, 100); if (q.rep >= 80) this.s.f.daddy = 1; },
    // More time on the sentence.
    extra(n) { const q = this.s.gaol; q.left += n; q.total += n; },
    goodWord() { const g = this.s.gaol.good; return g >= 80 ? 'A model prisoner' : g >= 60 ? 'Well behaved' : g >= 35 ? 'No trouble to speak of' : g >= 15 ? 'A troublemaker' : 'The governor knows your name'; },
    repWord() { const r = this.s.gaol.rep; return r >= 80 ? 'You run the landing' : r >= 55 ? 'Respected' : r >= 30 ? 'Left alone' : r >= 12 ? 'A new face' : 'Fair game'; },
    // The certificate the education wing would put you in for next.
    gaolCourse() { return CLASSES.find((id) => !this.hasEdu(id)) || null; },
    paroleOdds() { const s = this.s, q = s.gaol; return clamp(q.good / 110 + s.st.charm / 500 - Math.min(4, Math.max(0, s.record - 1)) * 0.04 - (s.f.escaped ? 0.15 : 0) + this.luck(), 0.03, 0.92); },
    breakOdds() { const s = this.s, q = s.gaol; return clamp(0.16 + s.st.fitness / 300 + s.st.smarts / 400 + q.rep / 500 + (s.heir === 'lag' ? 0.12 : 0) + this.luck(), 0.08, 0.85); },

    // The turn of a season, inside.
    gaolSeason() {
      const s = this.s, q = s.gaol;
      q.left--; q.served++;
      s.n.inside = (s.n.inside || 0) + 1;
      if (!s.use.trouble) q.good = clamp(q.good + 3, 0, 100);
      q.inSol = q.sol; q.sol = false;
      // With no standing at all, you are fair game.
      if (q.rep < 12 && !q.inSol && this.chance(0.45)) { this.rough(5, 'a beating in Starling Gaol'); this.joy(-5); this.say('😣', 'You are fair game on the landing: somebody helps himself to your things', 'bad'); }
      // The world outside gets on without you.
      for (const p of s.people) if (p.kind !== 'ex' && p.kind !== 'enemy') this.bond(p, p.kind === 'parent' || p.kind === 'child' ? -2 : -5);
      if (q.left <= 0) { this.release(false); return; }
      // The board sits once half the time is done, and yearly after that.
      if (q.total >= 3 && q.served * 2 >= q.total && (q.board == null || s.t - q.board >= 4)) { q.board = s.t; this.queue('parole'); }
    },
    // Out of the gate. early: on parole, and on licence for two years.
    release(early) {
      const s = this.s, q = s.gaol;
      s.gaol = null;
      if (early) { s.f.licence = s.t + 8; s.f.parole = 1; }
      if (!s.owned && s.home !== 'hostel') this.downAndOut();
      s.cash += 46;
      s.time = this.timeMax();
      this.note(`Walked out of Starling Gaol after ${q.served} season${q.served === 1 ? '' : 's'}${early ? ', on parole' : ''}.`, 'big');
      this.queue('gateOut', { early });
    },
    // Over the wall: free, hunted, and with the rest of the sentence still owing.
    breakOut() {
      const s = this.s, q = s.gaol;
      s.run = { owe: q.left + 4 };
      s.gaol = null;
      s.heat = 100; s.f.escaped = 1;
      if (!s.owned && s.home !== 'hostel') this.downAndOut();
      s.time = Math.min(s.time, 2);
      this.note('Broke out of Starling Gaol.', 'big');
    },
    // A season on the run: they find you, or in the end they stop looking.
    lamSeason() {
      const s = this.s;
      if (!s.run) return;
      if (s.heat < 12) { s.run = null; s.f.lam = 1; this.note('The police have stopped looking for you.', 'big'); this.say('🌫️', 'The trail has gone cold', 'good'); return; }
      if (this.chance(s.heat / 320)) this.queue('recapture');
    },
  });

  const inside = (o) => Object.assign({ place: 'gaol', gaol: true }, o);

  // -- the day
  def('gWork', inside({
    sec: 'The day', icon: '🧺', title: 'Work in the laundry', desc: 'Forty dollars and all the steam you can breathe. The governor notices.',
    run(L) { L.cash(40); L.behave(3); L.gain('craft', 0.8); return L.pick(['Four hundred sheets. You fold the last one into a swan.', 'The mangle has a name. The name is Doris.', 'Somebody’s socks come back pink. Nobody saw anything.']); },
  }));
  def('gYard', inside({
    sec: 'The day', icon: '🏋️', title: 'Hit the yard', desc: 'Fitness. There is very little else to lift in here but weights.',
    run(L) { L.gain('fitness', 2.6); L.respect(1); L.hp(1); return L.pick(['Press-ups until the whistle.', 'Forty laps of a yard the size of a tennis court.', 'A man called Tiny spots for you. Tiny is not tiny.']); },
  }));
  def('gLib', inside({
    sec: 'The day', icon: '📚', title: 'Read what is on the trolley', desc: 'Smarts. Mostly westerns, and one book on tax law.',
    run(L) { L.gain('smarts', 2.4); L.behave(1); L.joy(1); return L.pick(['You read the book on tax law. It is surprisingly gripping.', 'The last page of the western is missing. You write your own.', 'A dictionary, from A as far as M.']); },
  }));
  def('gStudy', inside({
    sec: 'The day', icon: '🎓',
    title: (L) => `Study for the ${COURSES[L.gaolCourse()].name} (${L.s.gaol.study}/${STUDY})`,
    desc: 'The education wing. Free, and you walk out with a real qualification.',
    show: (L) => !!L.gaolCourse(),
    run(L) {
      const s = L.s, q = s.gaol, id = L.gaolCourse();
      L.gain('smarts', 1.5); L.behave(2);
      if (++q.study < STUDY) return L.pick(['The tutor is patient. The man next to you is asleep.', 'You are, it turns out, quite good at this.', 'Homework, in a cell. At least it is quiet.']);
      q.study = 0;
      s.edu[id] = { a: s.age, g: 0 };
      L.note(`Earned ${COURSES[id].name} in Starling Gaol.`, 'big');
      L.say(COURSES[id].icon, `Qualified: ${COURSES[id].name}`, 'good');
      return 'You pass. The governor shakes your hand, and the certificate does not say where you sat the exam.';
    },
  }));
  def('gLetters', inside({
    sec: 'The day', icon: '✉️', title: 'Write home', desc: 'Keeps the people outside from forgetting you.', per: 1,
    why: (L) => (L.s.people.some((p) => ['partner', 'spouse', 'parent', 'child', 'friend'].includes(p.kind)) ? null : 'There is nobody to write to.'),
    run(L) {
      for (const p of L.s.people) if (['partner', 'spouse', 'parent', 'child'].includes(p.kind)) L.bond(p, 7); else if (p.kind === 'friend') L.bond(p, 4);
      L.joy(2);
      return L.pick(['Four pages. You leave out the bit about the showers.', 'You draw the view from your window. It is a wall.', 'You write that the food is fine. The censor underlines it and adds a question mark.']);
    },
  }));
  def('gHead', inside({
    sec: 'The day', icon: '🙇', title: 'Keep your nose clean', desc: 'Yes sir, no sir. It all goes on your record, the good kind.',
    run(L) { L.behave(7); L.joy(-1); return L.pick(['You polish a corridor that was already polished.', 'You say "good morning, Mr Hobbs" to a guard and mean it, nearly.', 'A day with nothing in it at all. That is the idea.']); },
  }));

  def('gDoc', inside({
    sec: 'The day', icon: '🩺', title: 'See the prison doctor', desc: 'Two aspirin and a look over the top of his spectacles. It mostly works.',
    show: (L) => !!L.s.ill || L.s.health < 50,
    run(L) {
      const s = L.s;
      if (!s.ill) { L.hp(8); return 'He listens to your chest, sighs, and signs you off the laundry for a week.'; }
      const name = s.ill.name;
      if (!L.chance(s.ill.sev >= 3 ? 0.5 : 0.85)) { L.hp(3); return `Two aspirin. Your ${name} is unimpressed.`; }
      s.ill = null; L.hp(6);
      return `He turns out to be a better doctor than the room deserves. Your ${name} clears up.`;
    },
  }));

  def('gCoast', inside({
    sec: 'The day', icon: '⏳', title: 'Let the season go by', desc: 'All the time you have left, spent on nothing in particular. No trouble, and a little good on your record.',
    run(L) {
      const s = L.s, n = 1 + s.time;
      s.time = 0;
      L.behave(2 * n); L.gain('fitness', 0.4 * n); L.gain('smarts', 0.4 * n);
      return L.pick(['Slop out, breakfast, yard, dinner, lock-up. And again.', 'You count the bricks in the far wall. There are 2,114.', 'A season of grey porridge and grey sky, and you are a season nearer the gate.']);
    },
  }));

  // -- the landing
  def('gMates', inside({
    sec: 'The landing', icon: '🤝', title: 'Make yourself useful on the landing', desc: 'Favours, errands, keeping watch. The old lags remember who helped.',
    run(L) {
      L.respect(7); L.behave(-2);
      if (L.friends().length < 20 && L.chance(0.22)) {
        const p = L.meet({ job: 'crew', trait: 'witty', sex: L.s.sex, age: clamp(L.s.age + L.int(0, 20), 18, 80), single: false });
        return `${p.name}, three doors down, takes a liking to you. "Look me up when you are out. I know people."`;
      }
      return L.pick(['You keep watch while a card school runs. Nobody tells you the stakes.', 'You write a letter for a man who cannot. He nods to you at dinner now.', 'You learn eleven ways to open a car and one way to make tea in a sock.']);
    },
  }));
  def('gFight', inside({
    sec: 'The landing', icon: '👊', title: 'Fight for your place', per: 1,
    desc: (L) => `In the showers, where the guards do not look. ${Math.round(L.checkOdds('fitness', 50) * 100)}% you win. The block, if you are seen.`,
    why: (L) => (L.s.health < 30 ? 'You would not get up again.' : null),
    run(L) {
      const s = L.s, won = L.chance(L.checkOdds('fitness', 50));
      L.gain('fitness', 0.8); L.behave(-14);
      if (won) { L.respect(14); L.joy(3); s.n.fights = (s.n.fights || 0) + 1; } else { L.rough(14, 'a beating in Starling Gaol'); L.respect(3); }
      const block = L.chance(0.35);
      if (block) s.gaol.sol = true;
      return `${won ? 'It is over in four seconds. People make room for you at dinner.' : 'You lose, but you got one good one in, and that is noticed.'}${block ? ' Then the whistles go: next season you will spend in the block, alone.' : ''}`;
    },
  }));
  def('gDeal', inside({
    sec: 'The landing', icon: '🚬', title: 'Run tobacco', desc: 'The only currency in here. Good money, and a longer stay if they find it.',
    why: (L) => (L.s.gaol.rep < 25 ? 'Nobody trusts you with it yet (standing 25).' : null),
    run(L) {
      L.behave(-4); L.respect(3);
      if (L.chance(0.18)) { L.extra(1); L.behave(-18); return 'A cell search, a loose brick, forty packets. A season is added to your sentence.'; }
      const got = L.int(20, 70) * 10;
      L.cash(got);
      return `${L.pick(['Half an ounce here, half an ounce there.', 'The kitchen orderly is your best customer.', 'Business is brisk on visiting day.'])} ${money(got)}, paid into your account outside by somebody’s sister.`;
    },
  }));
  def('gSnitch', inside({
    sec: 'The landing', icon: '🤫', title: 'Have a quiet word with the governor', per: 1,
    desc: 'What you hear on the landing is worth something upstairs. Nobody loves a grass.',
    run(L) {
      const q = L.s.gaol;
      L.behave(18); L.respect(-30); L.karma(-2);
      const off = q.left > 1 && L.chance(0.5);
      if (off) q.left--;
      const found = L.chance(0.3);
      if (found) L.rough(15, 'a beating in Starling Gaol');
      return `The governor writes it all down and offers you a biscuit.${off ? ' A season comes off your sentence.' : ''}${found ? ' Word gets round. So do three men with a bar of soap in a sock.' : ''}`;
    },
  }));
  def('gTattoo', inside({
    sec: 'The landing', icon: '🖋️', title: 'Get a tattoo', cost: 50, desc: 'A biro, a sewing needle, and a man who says he was an artist outside.',
    show: (L) => !L.s.gaol.tat,
    run(L) {
      L.s.gaol.tat = true; L.s.f.tattoo = (L.s.f.tattoo || 0) + 1; L.respect(8); L.joy(2); L.rough(1, 'a dirty needle');
      return L.pick(['It was meant to be an anchor. It looks like a sad carrot.', 'It says MUM. Underneath, smaller, it says SORRY.', 'A swallow, on your hand. It has three legs.']);
    },
  }));

  // -- getting out
  def('gAppeal', inside({
    sec: 'Getting out', icon: '⚖️', title: 'Appeal', cost: (L) => (L.perk('law') ? 4000 : 8000), time: 2,
    desc: (L) => `A barrister, a technicality, a judge in a good mood: ${Math.round(clamp(0.2 + L.s.st.smarts / 250 + (L.perk('law') ? 0.15 : 0) + L.luck(), 0.05, 0.9) * 100)}% it halves what you have left. One go.`,
    show: (L) => !L.s.gaol.appeal,
    why: (L) => (L.s.gaol.left < 2 ? 'You would be out before the court sat.' : null),
    run(L) {
      const q = L.s.gaol;
      q.appeal = true;
      if (!L.chance(clamp(0.2 + L.s.st.smarts / 250 + (L.perk('law') ? 0.15 : 0) + L.luck(), 0.05, 0.9))) return 'The judge reads for forty minutes and then says "no". Your barrister sends his bill the same afternoon.';
      q.left = Math.ceil(q.left / 2);
      return `"Unsafe," says the judge, about one count out of three. It is enough: ${q.left} season${q.left > 1 ? 's' : ''} left.`;
    },
  }));
  def('gDig', inside({
    sec: 'Getting out', icon: '🥄', title: (L) => `Work on a way out (${L.s.gaol.dig}/${DIG})`, time: 2,
    desc: 'A spoon, a loose grating, patience. Two more seasons if they find it.',
    show: (L) => L.s.gaol.dig < DIG,
    run(L) {
      const q = L.s.gaol;
      L.gain('smarts', 0.5); L.gain('fitness', 0.5);
      if (L.chance(0.15)) { q.dig = 0; q.sol = true; L.extra(2); L.behave(-25); return 'A guard leans on the wrong bit of wall and goes through it up to the elbow. Two more seasons, and the block.'; }
      q.dig++;
      return q.dig >= DIG ? 'It is ready. A grating, a laundry chute, a wall, and forty yards of open ground.' : L.pick(['A mugful of mortar, flushed away a pinch at a time.', 'You know the guards’ rounds better than they do.', 'You make a rope out of sheets, and a dummy out of the rest of the sheets.']);
    },
  }));
  def('gBreak', inside({
    sec: 'Getting out', icon: '🧱', title: 'Go over the wall', time: 2,
    desc: (L) => `Tonight. ${Math.round(L.breakOdds() * 100)}% you make it, and are hunted. Four more seasons if you do not.`,
    show: (L) => L.s.gaol.dig >= DIG,
    run(L) {
      const q = L.s.gaol;
      if (L.chance(L.breakOdds())) { L.breakOut(); return 'The grating, the chute, the wall. A laundry van is leaving as you land, and you leave with it. Every constable in the bay will have your photograph by morning.'; }
      q.dig = 0; q.sol = true; q.good = 0; L.s.use.trouble = 1; L.extra(4); L.rough(8, 'a fall from the wall');
      return 'The sheet rope is four feet too short, and the searchlight is right on time. Four more seasons, and the block.';
    },
  }));
  def('gComfort', inside({
    sec: 'Getting out', icon: '🍫', title: 'Slip a guard something', cost: 400, per: 1, time: 0,
    desc: 'A proper meal, a newspaper, a blind eye. Makes the time pass.',
    run(L) { L.joy(9); L.hp(2); return L.pick(['Fish and chips, still hot, in yesterday’s Gazette.', 'An extra blanket and a wireless that gets one station.', 'Mr Hobbs leaves a bar of chocolate on your bunk and says nothing.']); },
  }));

}
