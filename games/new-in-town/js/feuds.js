// New in Town: old flames and bad blood. People do not always leave your
// life when you fall out with them. A sweetheart you part from badly is
// an ex for a few years: someone to win back, or regret. And now and then
// somebody takes against you (a man you hit in the pub, a colleague you
// crossed) and becomes an enemy, who does you small harms until you make
// it up, see them off, or wait for the grudge to cool.
//
// An enemy has a grudge (how angry, 0 to 100, cooling a little each
// season) and a nerve (how much more they will take before they leave you
// alone for good).

import { CAREERS, money } from './data.js';

const EX_YEARS = 16; // seasons before an ex moves on and away

export function install({ def, A, Life, clamp }) {
  const he = (p) => (p.sex === 'm' ? 'he' : 'she');
  const him = (p) => (p.sex === 'm' ? 'him' : 'her');
  const his = (p) => (p.sex === 'm' ? 'his' : 'her');

  Object.assign(Life.prototype, {
    exes() { return this.s.people.filter((p) => p.kind === 'ex'); },
    enemies() { return this.s.people.filter((p) => p.kind === 'enemy'); },
    // A sweetheart becomes an old flame.
    makeEx(p, grudge) {
      Object.assign(p, { was: p.kind === 'spouse' ? 'spouse' : 'partner', kind: 'ex', bond: Math.min(p.bond, 25), grudge, since: this.s.t, live: false, eng: false, single: true });
      return p;
    },
    // Somebody new takes against you.
    foe(o = {}) {
      const p = this.makePerson({ kind: 'enemy', bond: 0, single: false, grudge: 45, nerve: this.int(2, 4), hard: this.int(30, 65), since: this.s.t, ...o });
      this.s.people.push(p);
      this.say('😠', `${p.name} has taken against you`, 'bad');
      return p;
    },
    // Somebody you know does.
    turnFoe(p, grudge = 50) {
      Object.assign(p, { kind: 'enemy', bond: 0, grudge, nerve: this.int(2, 4), hard: this.int(30, 65), since: this.s.t, live: false, eng: false });
      this.say('😠', `${p.name} has taken against you`, 'bad');
      return p;
    },
    gone(p) { const l = this.s.people, i = l.indexOf(p); if (i >= 0) l.splice(i, 1); },
    // An enemy gives up. Returns what to say.
    seeOff(p) {
      this.gone(p);
      this.s.n.seenOff = (this.s.n.seenOff || 0) + 1;
      this.note(`Saw off ${p.name}.`);
      return `${p.name} crosses the road when ${he(p)} sees you now. That is the end of it.`;
    },
    // Wears an enemy down; true once they have had enough.
    rattle(p, n = 1) { p.nerve -= n; return p.nerve <= 0; },
    mendOdds(p) { return clamp(0.3 + this.s.st.charm / 160 - p.grudge / 170 + this.luck(), 0.05, 0.9); },
    backOdds(p) { return clamp(this.wooOdds() * 0.55 + p.bond / 150 - p.grudge / 120, 0.03, 0.8); },
    // How much an enemy weighs on you.
    feudGloom() { return Math.min(6, this.enemies().filter((p) => p.grudge >= 40).length * 2); },
    // The small harm an enemy does. Returns the sentence that follows their name.
    spite(p) {
      const s = this.s, k = ['rumour', 'paint'];
      if (s.items.car || s.items.sportscar) k.push('tyres');
      if (s.job && !CAREERS[s.job.c].shady) k.push('boss');
      if (s.biz) k.push('review');
      if (s.n.crimes >= 3) k.push('grass');
      switch (this.pick(k)) {
        case 'tyres': this.cash(-320); return `has let down all four of your tyres, thought about it, and then slashed them. ${money(320)} for new ones.`;
        case 'boss': s.job.perf = Math.max(0, s.job.perf - 8); return 'has written to your boss. Three pages, with underlining.';
        case 'review': s.biz.rep = Math.max(0, s.biz.rep - 8); return `has been telling the whole town what ${he(p)} found in something ${he(p)} bought from you.`;
        case 'grass': this.warm(12); return 'has had a word with a constable about where you go at night.';
        case 'paint': this.cash(-90); this.joy(-2); return `has been at your front door with a tin of paint. One word, four letters. ${money(90)} to cover it.`;
        default: this.karma(-3); return 'has been telling the Gull & Anchor a story about you. It is a good story. It is not true.';
      }
    },
    // The turn of a season: grudges cool, enemies get busy, old flames move on.
    feudSeason() {
      const s = this.s;
      let busy = false;
      for (const p of s.people.slice()) {
        if (p.kind === 'ex') {
          p.grudge = Math.max(0, p.grudge - 4);
          if (s.t - p.since >= EX_YEARS) { this.gone(p); this.note(`${p.name} moved away. You heard it from someone else.`); }
        } else if (p.kind === 'enemy') {
          p.grudge -= s.karma >= 30 ? 4 : 2.5;
          if (p.grudge <= 0) { this.gone(p); this.note(`${p.name} seems to have forgotten what it was all about.`); continue; }
          if (!busy && !s.gaol && this.chance(p.grudge / 420)) { busy = true; this.queue('spite', { p: p.id, what: this.spite(p) }); }
        }
      }
    },
  });

  // -- old flames
  def('winback', {
    who: true, sec: 'Old flames', icon: '💐', title: 'Ask for another chance', cost: 80,
    desc: (L, p) => `Flowers, and your best apology. ${Math.round(L.backOdds(p) * 100)}% ${he(p)} says yes.`,
    show: (L, p) => p.kind === 'ex',
    why: (L, p) => (L.partner() ? 'You are spoken for.' : !L.fancy(p) ? 'That is behind you.' : L.s.t - (p.tried ?? -99) < 4 ? `You asked ${him(p)} not long ago.` : null),
    run(L, p) {
      p.tried = L.s.t;
      if (!L.chance(L.backOdds(p))) { p.grudge = Math.min(100, p.grudge + 6); L.joy(-3); return `${p.name} hears you out, and hands back the flowers.`; }
      const was = p.was;
      delete p.grudge; delete p.was; delete p.since; delete p.tried;
      p.bond = 40; L.s.f.oldflame = 1;
      return L.startSeeing(p, `${p.name} looks at you for a long time. "I must be mad," ${he(p)} says, and laughs. You are together again${was === 'spouse' ? ', and nobody mentions the lawyers' : ''}.`);
    },
  });
  def('oldtimes', {
    who: true, sec: 'Old flames', icon: '🌙', title: 'For old times’ sake', cost: 40, per: 1,
    desc: (L, p) => `One night, no promises${L.partner() ? `, and ${L.partner().name} need never know` : ''}. ${Math.round(clamp(0.25 + L.s.st.charm / 250 - p.grudge / 150, 0.03, 0.8) * 100)}% ${he(p)} is of the same mind.`,
    show: (L, p) => p.kind === 'ex' && L.fancy(p),
    run(L, p) {
      const s = L.s, pt = L.partner();
      if (!L.chance(clamp(0.25 + s.st.charm / 250 - p.grudge / 150, 0.03, 0.8))) { p.grudge = Math.min(100, p.grudge + 4); L.joy(-2); return `"No," says ${p.name}, quite kindly, which is worse.`; }
      L.joy(7); L.bond(p, 6);
      if (pt) { L.karma(-4); s.n.flings = (s.n.flings || 0) + 1; if (L.chance(0.35)) L.queue('caughtOut', pt.id); }
      return `${p.name} still has your old jumper. In the morning neither of you knows what to say, so you say nothing.`;
    },
  });

  // -- bad blood
  def('mend', {
    who: true, sec: 'Bad blood', icon: '🕊️', title: 'Bury the hatchet', cost: 60, per: 1,
    desc: (L, p) => `Buy ${him(p)} a drink and say your piece. ${Math.round(L.mendOdds(p) * 100)}% ${he(p)} shakes on it.`,
    show: (L, p) => p.kind === 'enemy',
    run(L, p) {
      const s = L.s;
      if (!L.chance(L.mendOdds(p))) { p.grudge = Math.min(100, p.grudge + 4); return `${p.name} drinks the drink and leaves without a word.`; }
      L.karma(3); L.joy(4);
      s.n.mended = (s.n.mended || 0) + 1;
      L.note(`Made it up with ${p.name}.`);
      if (L.friends().length >= 20) { L.gone(p); return `${p.name} shakes your hand. Neither of you can quite remember how it started.`; }
      for (const k of ['grudge', 'nerve', 'hard', 'since']) delete p[k];
      Object.assign(p, { kind: 'friend', bond: 24, single: L.chance(0.5) });
      return `${p.name} shakes your hand, then buys the next round. Friends, of a sort. Stranger things have happened.`;
    },
  });
  def('prank', {
    who: true, sec: 'Bad blood', icon: '🐟', title: 'Play a dirty trick', per: 1,
    desc: (L, p) => `Petty, and very satisfying. It will not make ${him(p)} like you.`,
    show: (L, p) => p.kind === 'enemy',
    run(L, p) {
      L.joy(5); L.karma(-1);
      p.grudge = Math.min(100, p.grudge + 10);
      const what = L.pick([`A kipper, behind ${his(p)} radiator.`, `You sign ${him(p)} up for forty catalogues and a donkey sanctuary.`, `Cress seeds, in the shape of a rude word, on ${his(p)} front lawn.`, `A small ad in the Gazette, with ${his(p)} telephone number: "Free manure. Collect any time."`]);
      if (L.crime(0.05, 1, 'a kipper and no good explanation', 2)) return `${what} Unfortunately there was a witness.`;
      return L.rattle(p) ? `${what} ${L.seeOff(p)}` : what;
    },
  });
  def('rumour', {
    who: true, sec: 'Bad blood', icon: '🗣️', title: 'Spread a rumour', per: 1,
    desc: (L, p) => `A word in the right ear at the Gull & Anchor (${Math.round(L.checkOdds('charm', 45) * 100)}%). If it is traced to you, it is you who looks bad.`,
    show: (L, p) => p.kind === 'enemy',
    run(L, p) {
      L.karma(-3);
      if (!L.chance(L.checkOdds('charm', 45))) { p.grudge = Math.min(100, p.grudge + 15); if (L.s.job) L.s.job.perf = Math.max(0, L.s.job.perf - 5); return `It gets back to ${p.name} by teatime, with your name on it.`; }
      p.grudge = Math.min(100, p.grudge + 6);
      const text = `By Friday the whole town knows what ${p.name} is supposed to have done with the lifeboat fund.`;
      return L.rattle(p) ? `${text} ${L.seeOff(p)}` : text;
    },
  });
  def('thump', {
    who: true, sec: 'Bad blood', icon: '👊', title: 'Have it out, behind the Gull', per: 1,
    desc: (L, p) => `Settle it the old way. ${Math.round(L.checkOdds('fitness', p.hard) * 100)}% you win.`,
    show: (L, p) => p.kind === 'enemy',
    why: (L) => (L.s.health < 30 ? 'You are in no state to.' : null),
    run(L, p) {
      const s = L.s, won = L.chance(L.checkOdds('fitness', p.hard));
      L.gain('fitness', 0.8);
      const seen = L.crime(0.1, 1, 'skinned knuckles, and somebody groaning in the car park');
      if (!won) { L.rough(12, 'a fight'); p.grudge = Math.min(100, p.grudge + 5); return `${p.name} is a good deal handier than ${he(p)} looks.${seen ? ' And then a constable comes round the corner.' : ''}`; }
      L.joy(4); s.n.fights = (s.n.fights || 0) + 1;
      const text = `${p.name} goes down among the beer crates and stays there.${seen ? ' Then a constable comes round the corner.' : ''}`;
      return L.rattle(p, 2) ? `${text} ${L.seeOff(p)}` : text;
    },
  });
  def('lean', {
    who: true, sec: 'Bad blood', icon: '🦊', title: 'Ask Sal to have a word', cost: 4000, time: 0,
    desc: (L, p) => `Two of Sal’s lads call on ${him(p)}. You will not hear from ${him(p)} again.`,
    show: (L, p) => p.kind === 'enemy' && (L.s.n.crimes >= 3 || (L.s.job && L.s.job.c === 'crew')),
    why: (L) => (L.s.t < (L.s.f.salOff || 0) ? 'Sal is not speaking to you.' : null),
    run(L, p) {
      L.karma(-6);
      const text = L.seeOff(p);
      if (L.crime(0.05, 2, 'a conversation Sal’s lads had on your behalf')) return `${p.name} goes straight to the police, on crutches.`;
      return `Sal’s lads are very polite. ${text}`;
    },
  });
}
