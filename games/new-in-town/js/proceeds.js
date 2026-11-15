// New in Town: the proceeds of crime. What the low road pays, and what it
// can cost, so that it is a gamble that can come off but on average does no
// better than an honest career, and now and then ruins somebody.
//
// The money. Whatever crime brings in (a shift for Sal, a burglary, an
// errand, a fiddle at work) is traceable for a while: it fades by a
// twentieth a season as it is spent and mixed with the rest. Sent down for
// anything serious, the court may come after it with a confiscation order,
// and the thicker the detective's file, the likelier it is to. When the
// detective finally puts you away for a long stretch, she has the bank
// statements going back years: the order is for all of it.
//
// Sal. His trust in you (kept in heists.js) is the job, in his crew: below
// RISE he will not move you up, below DOCK he gives you the worst rounds and
// docks your pay, and below OUT he wants you gone. Telling the police it was
// all Sal works less well each time (they have heard it before), and costs
// you with Sal every time it works: a word with him, and a price.
//
// Running from an arrest works less well each time too, for a couple of
// years: they send two constables, and the fast one.
//
// The older rules call in here at a few marked places: the 'busted' card in
// events.js asks proBlameDc and proRunDc for its odds. Everything is kept in
// s.proceeds.

import { CAREERS, money } from './data.js';

// What crime brings in; and the shifts, which are crime only in Sal's crew.
const DIRTY = ['lift', 'dip', 'errand', 'deal', 'burgle0', 'burgle1', 'burgle2', 'twoc', 'smuggle', 'torch', 'graft', 'fiddle', 'forge'];
const SHIFT = ['work', 'workHard', 'workEasy', 'workPlay'];
// Sal's trust (0 to 100), and what it takes.
export const RISE = 45, DOCK = 35, OUT = 15;

export function install({ A, Life, clamp, hooks, addEvents }) {
  hooks.load.push((L) => {
    const s = L.s;
    if (!s.proceeds || typeof s.proceeds !== 'object') s.proceeds = {};
    // dirty: traceable money from crime; all: everything crime ever brought in; blamed: times you have said it was all Sal; ran: recent runs from
    // an arrest (ranT: when that last changed); seized: what the court has taken, all told; word, out: when
    // Sal last sent for you.
    const P = s.proceeds, b = { dirty: 0, all: 0, blamed: 0, ran: 0, ranT: 0, seized: 0, orders: 0, word: null, out: null };
    for (const [k, v] of Object.entries(b)) if (P[k] == null) P[k] = v;
  });

  const P = (L) => L.s.proceeds;
  const liquid = (L) => L.s.cash + L.s.bank - L.s.debt;
  const trust = (L) => (L.s.heists ? L.s.heists.sal : 50);
  // In Sal's crew, with Sal behind the ice house to answer to.
  const crewSal = (L) => { const j = L.s.job; return !!j && j.c === 'crew' && (!L.salHere || L.salHere()); };
  const round = (n, to = 100) => Math.round(n / to) * to;

  Object.assign(Life.prototype, {
    // What the court could trace, of what you have.
    // (all: everything the detective can trace, when she has had years to do it.)
    proTraceable(all = false) { const s = this.s, p = s.proceeds; return Math.max(0, Math.min(all ? p.all - p.seized : p.dirty, s.cash + s.bank)); },
    // How hard it is to make "It was all Sal" stick, and to get away on foot (as checks: see the 'busted' card).
    proBlameDc() { return 60 + 20 * this.s.proceeds.blamed; },
    proRunDc() { return 55 + 12 * this.s.proceeds.ran; },
    // Docked: Sal gives you the worst rounds.
    proDocked() { return crewSal(this) && trust(this) < DOCK; },
    // After a conviction for something serious: the court may come after the money as well.
    // nailed: the detective has just put you away for the long stretch she was building towards.
    proSeizeMaybe(sev, nailed) {
      const s = this.s, n = this.proTraceable(nailed), file = s.heists ? s.heists.det.file : 0;
      if (n < 2000) return;
      if (nailed) { this.queue('proSeize', { n: round(n), all: 1 }); return; }
      if (!this.chance(clamp(0.3 + file / 100 + Math.min(4, s.record) * 0.05, 0.3, 0.9))) return;
      this.queue('proSeize', { n: round(n * (sev >= 4 ? 1 : sev >= 3 ? 0.8 : 0.5)) });
    },
    // The order carried out: from savings first, then cash. Returns what was taken.
    proSeize(n) {
      const s = this.s, from = Math.min(s.bank, n), rest = Math.min(s.cash, n - from), got = from + rest;
      s.bank -= from; s.cash -= rest;
      const p = s.proceeds;
      p.dirty = Math.max(0, p.dirty - got); p.seized += got; p.orders++;
      if (got) this.note(`A confiscation order took ${money(got)}, as the proceeds of crime.`, 'bad');
      return got;
    },
  });

  // Money from crime is counted as it comes in.
  for (const id of [...DIRTY, ...SHIFT]) {
    const a = A[id];
    if (!a) continue;
    const run = a.run;
    a.run = function (L, ...rest) {
      const crew = !SHIFT.includes(id) || (!!L.s.job && L.s.job.c === 'crew'), docked = SHIFT.includes(id) && L.proDocked(), was = liquid(L);
      let text = run.call(this, L, ...rest);
      const got = liquid(L) - was;
      if (crew && got > 0) { P(L).dirty += got; P(L).all += got; }
      if (docked && typeof text === 'string') text += ` ${L.pick(['Sal docks a fifth of it. He has not forgotten.', 'The worst round, and a fifth less for it: Sal is making a point.', 'Sal pays you last, and short. Nobody else in the crew looks at you.'])}`;
      return text;
    };
  }

  // Sal decides who goes up in his crew, and what they are paid.
  const nextRung = Life.prototype.nextRung;
  Life.prototype.nextRung = function () {
    const r = nextRung.call(this);
    if (r && crewSal(this)) {
      r.list.push({ text: `Sal trusts you enough (${Math.round(trust(this))} of ${RISE})`, ok: trust(this) >= RISE });
      r.ready = r.list.every((n) => n.ok);
    }
    return r;
  };
  const shiftPay = Life.prototype.shiftPay;
  Life.prototype.shiftPay = function () {
    const pay = shiftPay.call(this);
    return this.proDocked() ? Math.round(pay * 0.8 / 10) * 10 : pay;
  };
  // Sent down for something serious: the money may go too.
  const sentence = Life.prototype.sentence;
  Life.prototype.sentence = function (sev) {
    const s = this.s, had = s.pend.length, d = s.heists && s.heists.det, nailed = d ? d.nailed : 0, text = sentence.call(this, sev);
    if (sev >= 2 && s.pend.slice(had).some((q) => q.id === 'inside')) this.proSeizeMaybe(Math.min(4, sev), !!d && d.nailed > nailed);
    return text;
  };

  hooks.season.push((L, lines, jailed) => {
    const s = L.s, p = P(L);
    // (Money spent and mixed in with the rest gets harder to trace.)
    if (p.dirty) p.dirty = p.dirty < 200 ? 0 : Math.round(p.dirty * 0.95);
    // (A run from the law is remembered for a couple of years.)
    if (p.ran > 0 && s.t - p.ranT >= 8) { p.ran--; p.ranT = s.t; }
    // Sal wants you out of his crew.
    if (!jailed && crewSal(L) && trust(L) < OUT && (p.out == null || s.t - p.out >= 4) && !s.pend.some((q) => q.id === 'proSalOut')) { p.out = s.t; L.queue('proSalOut'); }
  });
  hooks.chose.push((L, id, x, i, win) => {
    if (id !== 'busted') return;
    const p = P(L), s = L.s;
    // (The options are: come quietly, run, a bribe, a lawyer, and, when it is shown, "It was all Sal".)
    if (i === 4) {
      p.blamed++;
      if (s.job && s.job.c === 'crew' && L.salHere && L.salHere() && (p.word == null || p.word !== s.t)) { p.word = s.t; L.queue('proSalWord'); }
    } else if (i === 1 && win) { p.ran++; p.ranT = s.t; }
  });

  const job = (L) => L.s.job;
  const demote = (L) => {
    const j = job(L);
    if (!j || j.r <= 0) return null;
    j.r--; j.n = 0; j.raise = 0;
    const t = CAREERS.crew.rungs[j.r].title;
    L.note(`Put back to ${t} in Sal’s crew.`, 'bad');
    return t;
  };
  const leave = (L, why) => { const t = L.jobTitle(); L.s.job = null; L.note(why || `Left Sal’s crew, as ${t}.`, 'big'); return t; };

  addEvents([
    {
      id: 'proSeize', icon: '⚖️', title: 'A confiscation order', w: 0, ok: (L, x) => !!x && x.n > 0,
      text: (L, x) => (x.all
        ? `${L.lawWho ? L.lawWho(true) : 'The detective'} was not only building a case. There is a fifth box file, of bank statements going back years, every deposit marked in green ink. The court makes a confiscation order for everything crime ever paid you that you still have: ${money(x.n)}.`
        : `A letter from the court, in a brown envelope with a window. The prosecution has been through your bank statements, and the magistrate has listened: money that came from crime belongs to the Crown. ${money(x.n)} of yours, says the order, unless you can show where it came from.`),
      opts: [
        { t: 'Hand it over', run(L, x) { const got = L.proSeize(x.n); L.joy(-6); return got ? `${money(got)} goes, a cheque at a time, to the Crown. It is gone as if it had never been, which, the magistrate would say, is the point.` : 'They look, and there is nothing left to take. The order is for a sum you no longer have.'; } },
        { t: 'Fight it, with a good lawyer', cost: (L, x) => Math.max(2000, round(x.n * 0.08)), odds: (L) => clamp(0.55 - (L.s.heists ? L.s.heists.det.file : 0) / 250 - Math.min(5, L.s.record) * 0.05 + (L.perk('law') ? 0.1 : 0), 0.08, 0.6), run(L, x, win) { if (win) return 'She finds a receipt for everything, and a wedding present from an aunt in Canada for the rest. The order is set aside.'; const got = L.proSeize(x.n); L.joy(-8); return `The magistrate has read the bank statements too. ${money(got)} goes to the Crown, and her bill on top of it.`; } },
        { t: 'Say it was a big night at the Lucky Gull', check: ['charm', 75], run(L, x, win) { if (win) { const got = L.proSeize(round(x.n / 2)); L.joy(-3); return `Nobody believes you entirely, but nobody can prove otherwise. The court settles for half: ${money(got)}.`; } const got = L.proSeize(x.n); L.joy(-8); return `The Lucky Gull keeps very good records, it turns out, and you are not in them. ${money(got)} goes to the Crown.`; } },
      ],
    },
    {
      id: 'proSalWord', icon: '🦊', title: 'Sal wants a word', w: 0, ok: (L) => !L.s.gaol && !!job(L) && job(L).c === 'crew' && (!L.salHere || L.salHere()),
      text: (L) => {
        const n = P(L).blamed;
        const said = n <= 1 ? '"They tell me you told the constable it was all me," he says. "All of it. Every crate."' : n === 2 ? '"Again," he says. "You told them it was me, again. They are starting to believe you, which is a problem for me."' : `"That is ${['', 'once', 'twice', 'three times', 'four times', 'five times'][n] || `${n} times`} now," he says, and does not say anything else for a while.`;
        return `Sal’s nephew is waiting by your door, and walks you down to the ice house without a word. Sal does not get up. ${said}`;
      },
      opts: [
        { t: 'Make it right: pay for his trouble', cost: (L) => Math.max(3000, round(L.shiftPay() * 4)), run(L) { L.salTrust(10); return '"That is the trouble paid for," says Sal, and puts the envelope in a drawer without counting it. "Not the rest. The rest you work off."'; } },
        { t: 'Take what is coming to you', run(L) { L.rough(16, 'a word with Sal'); L.salTrust(6); const t = demote(L); return `It is quick, and professional, and the nephew apologises afterwards.${t ? ` You are back to ${t}, and grateful for it.` : ''} "We will say no more about it," says Sal, who will.`; } },
        { t: 'Walk out of his crew, while you can', run(L) { leave(L, 'Walked out of Sal’s crew, after telling the police it was all him.'); L.salTrust(-5); return 'You put your keys on the table and walk out backwards. Nobody stops you. That is somehow worse.'; } },
      ],
    },
    {
      id: 'proSalOut', icon: '🧊', title: 'Your rounds have gone to somebody else', w: 0, ok: (L) => !L.s.gaol && crewSal(L) && trust(L) < OUT,
      text: (L) => `Sal’s new lad is doing your round, and doing it badly. Sal has not looked at you in a month. "${L.s.sex === 'f' ? 'She' : 'He'} is not one of us any more," you hear him say, through the door, to somebody who agrees.`,
      opts: [
        { t: 'Go, before you are pushed', run(L) { leave(L); return 'You leave the ice house for the last time, and nobody looks up from the cards.'; } },
        { t: 'Ask him for one more chance', check: ['charm', 65], run(L, x, win) { if (win) { const t = demote(L); L.s.heists.sal = Math.max(L.s.heists.sal, 25); return `Sal looks at you for a long time. "${t || 'Lookout'}," he says. "And if I hear your name from a policeman again, you will not hear anything for a while."`; } leave(L, 'Put out of Sal’s crew.'); L.s.f.salOff = Math.max(L.s.f.salOff || 0, L.s.t + 8); return '"No," says Sal, and that is all. Your coat is on the step when you get home.'; } },
        { t: 'Make it worth his while', cost: (L) => Math.max(5000, round(L.shiftPay() * 5)), run(L) { L.s.heists.sal = Math.max(L.s.heists.sal, 30); return 'An envelope, on the table by the stove. Sal leaves it there all afternoon, so that everybody sees it. You keep your place, just, and you are reminded of it.'; } },
      ],
    },
  ]);
}
