// New in Town: a stretch in Starling Gaol worth living through. inside.js
// has the rules of prison as they were (the record, your standing, the
// block, the board, the wall); heists.js has your cellmates and who is at
// the gate. This adds what a long sentence is made of:
//
// Work. Everybody starts in the laundry. You can put in for the kitchens,
// the library, the gardens or the workshop (each wants a better record than
// the last), rise in it a shift at a time, be paid for it, and lose it again
// (the block, a fight, a hacksaw blade in your shoe). The kitchens' hotplate
// can be played by hand (gaol2-games.js).
//
// The landing. Six people with wants of their own, who remember what you did
// across a sentence and the next one, and some of them outside: Lenny the Tin,
// who runs the tobacco; Ossie, a lifer with a canary and a daughter in the Bay
// who will not answer his letters; Winston, who says he did not do it; Jamie,
// who cannot read his little girl's letters; and the Bay lads and the
// Kettleby lot, at war over a pool table.
//
// Change. Courses (free, or by post for a fee), the chaplain, Mrs Abernethy's
// group, letters to the people you love and visits from them, which keep them
// or do not.
//
// The board. A plan for outside (somewhere to live, work, somebody to speak
// for you), arranged on visits, through your job and the chaplain, and the
// record of your seasons inside, which the board reads.
//
// The wall. A route (dug in inside.js), tools, the guards' habits, somebody
// to go with, and the night: odds that can be made good. On the run after,
// a few cards of their own.
//
// Variety: cards of their own for life inside, dealt here and not drawn,
// that know how long you have been in, how many times, and what you did
// there; none twice in a sentence. The old prison cards in events.js come
// up at most once a sentence each.
//
// Everything is kept in s.gaol2 (cur: this sentence, null outside). The
// cards are in gaol2-tales.js; the screen is gaol2-ui.js.

import { COURSES, CAREERS, TROPHIES, money } from './data.js';
import { gaolTales } from './gaol2-tales.js';

// ---- prison jobs ------------------------------------------------------------------------

// ranks: the places in it, from the bottom. pay: a shift at each (paid into your account outside).
// good: the record each place needs. stats: what a shift trains. course: the certificate its
// shifts count towards. out: the work it can lead to outside, if the boss will say so.
export const JOBS = {
  laundry: {
    name: 'The laundry', icon: '🧺', ranks: ['Laundry hand', 'On the big machines', 'Laundry orderly'], pay: [30, 40, 55], good: [0, 30, 45],
    stats: [['craft', 0.7], ['fitness', 0.4]], boss: 'Mrs Treloar', out: { c: 'retail', at: 'the dry cleaner’s on the High Street' },
    blurb: 'Where everybody starts: sheets, steam, and a mangle called Doris. The orderly does the officers’ shirts, and hears everything.',
    lines: ['Four hundred sheets. You fold the last one into a swan.', 'The mangle has a name. The name is Doris.', 'Somebody’s socks come back pink. Nobody saw anything.', 'The governor’s shirts, twelve of them, starched until they could stand up on their own and leave.', 'Doris the mangle breaks down, and you mend her with a hairgrip. You are a hero until teatime.', 'Pillowcases all morning. You find a betting slip, a love letter and half a biscuit, and keep quiet about all three.', 'Mrs Treloar sings hymns over the steam presses, all the verses, and nobody dares ask her to stop.'],
  },
  kitchen: {
    name: 'The kitchens', icon: '🍲', ranks: ['Pot wash', 'On the hotplate', 'Cook', 'Number one cook'], pay: [35, 45, 60, 80], good: [40, 45, 55, 65],
    stats: [['craft', 0.9], ['charm', 0.3]], course: 'culinary', boss: 'Chef', out: { c: 'kitchen', at: 'the Gull & Anchor’s kitchen' },
    blurb: 'Six hundred dinners a day, and the best-fed men in the building. Shifts count towards a Culinary Certificate.',
    lines: ['Potatoes, a mountain of them, and a peeler with a mind of its own.', 'Chef tastes the gravy, says nothing, and adds salt. That is praise.', 'Shepherd’s pie for six hundred. You will dream about mince.', 'The custard has a skin you could stand on. Chef says that is how B wing likes it.', 'A tray of rock cakes, and every one of them accounted for twice before they leave the kitchen.', 'Fish on Friday, as ever. The whole building smells of it until Sunday.'],
  },
  library: {
    name: 'The library', icon: '📚', ranks: ['On the trolley', 'Library orderly', 'Letter writer'], pay: [30, 40, 55], good: [50, 55, 60], smarts: 25,
    stats: [['smarts', 1.1], ['charm', 0.3]], boss: 'Miss Achterberg', out: { c: 'retail', at: 'the bookshop on the High Street' },
    blurb: 'Quiet, warm, and a typewriter. Miss Achterberg comes in from the town library on Wednesdays. The letter writer writes for the men who cannot, and the whole landing owes him.',
    lines: ['The trolley round: westerns to the twos, romances to the threes, and one book on beekeeping to a man who has asked for it every week for a year.', 'Miss Achterberg’s Wednesday: she reshelves everything you shelved, in silence, and nods.', 'You mend the spine of a dictionary with tape and patience.', 'A man on the fours wants anything with a horse in it. You find him eleven.', 'You type a letter to a housing office for a man who cannot spell “housing”. He can now.', 'Overdue notices, to men who cannot leave. You write them anyway. Miss Achterberg insists.'],
  },
  gardens: {
    name: 'The gardens', icon: '🌱', ranks: ['Weeding', 'Gardener', 'Trusty'], pay: [30, 45, 60], good: [60, 65, 75],
    stats: [['fitness', 0.8], ['craft', 0.6]], boss: 'Mr Bolitho', out: { c: 'trades', at: 'a landscape gardener on the Kettleby road' },
    blurb: 'Fresh air, the governor’s roses and the vegetable beds, for men the governor trusts. A trusty works outside the wall.',
    lines: ['Weeding the governor’s gravel, on your knees, in the sun. There are worse places to be on your knees.', 'Mr Bolitho shows you how to prune a rose. Cut above an outward bud, he says, as if it mattered more than anything.', 'Leeks, in rows so straight Mr Bolitho checks them with string.', 'A robin follows you the length of the bed, waiting for worms. You find it some.', 'Barrowloads of muck for the onion bed. It is honest work, and it smells it.', 'Rain in the gardens, and Mr Bolitho says gardeners do not stop for rain. You do not stop for rain.'],
  },
  workshop: {
    name: 'The workshop', icon: '🔧', ranks: ['Sweeper', 'Bench hand', 'Instructor’s orderly'], pay: [35, 50, 70], good: [35, 45, 55],
    stats: [['craft', 1.2], ['smarts', 0.2]], course: 'trade', boss: 'Mr Prothero', out: { c: 'trades', at: 'the boatyard' },
    blurb: 'Benches, lathes and a tool board where every tool has its painted outline. Shifts count towards Trade Papers.',
    lines: ['Sawdust, all morning. You sweep it into a pile, and the pile into a sack, and the sack into another sack.', 'Mr Prothero counts the chisels back onto the board, and so do you, out loud, together.', 'A bird table, for the governor’s wife. Mr Prothero says the joints are “not bad”, which from him is a medal.', 'Dovetails. Your first three are firewood. The fourth would hold a ship together.', 'Garden benches for the council, twenty of them, with a brass plate that says nothing about where they were made.', 'You sharpen every plane in the shop. Mr Prothero runs his thumb along one and says, “Hm.”'],
  },
};
export const JOB_IDS = Object.keys(JOBS);
// Shifts at a place before the next one up; and shifts a season.
const SH = [4, 6, 8];
const SHIFTS = 2;
// Who says so, when the boss offers to put in a word for you outside.
const BOSS_SAYS = {
  laundry: 'Mrs Treloar’s sister runs the dry cleaner’s on the High Street.',
  kitchen: 'Chef was at catering college with the cook at the Gull & Anchor.',
  library: 'Miss Achterberg has written to the bookshop on the High Street.',
  gardens: 'Mr Bolitho knows a landscape gardener on the Kettleby road who is always short of hands.',
  workshop: 'Mr Prothero has telephoned the boatyard.',
};

// ---- the landing ------------------------------------------------------------------------

// stay: how long they are in for when you first meet them (lifer: no end in sight). back: the chance
// they are inside again in a later sentence of yours, once they have been out.
export const LANDING = {
  lenny: { name: 'Lenny Truscott', first: 'Lenny', icon: '🥫', age: 48, job: 'crew', trait: 'witty', stay: [8, 20], back: 0.35, wants: 'A runner, and a mattress to keep things under', blurb: 'Runs the tobacco on B wing, the canteen sheet and most of the card schools. Known as the Tin. Never raises his voice.' },
  ossie: { name: 'Ossie Pengelly', first: 'Ossie', icon: '🐤', age: 74, job: 'sea', trait: 'kind', lifer: true, wants: 'A word with his daughter June, in the Bay, who has not answered a letter since 1979', blurb: 'Forty years in, for something that happened in 1971. Keeps a canary called Pip, by special permission of three governors.' },
  winston: { name: 'Winston Jory', first: 'Winston', icon: '📑', age: 41, job: 'law', trait: 'bookish', stay: [24, 48], back: 0, wants: 'Somebody to read his papers properly', blurb: 'Says he did not do it, and has said so every day for nine years, mostly in writing.' },
  jamie: { name: 'Jamie Nance', first: 'Jamie', icon: '🧸', age: 23, job: 'trades', trait: 'sporty', stay: [5, 10], back: 0.45, wants: 'To read his little girl’s letters himself', blurb: 'Twenty-three, first time in, with a little girl outside called Kayleigh. Keeps her letters in his sock, because he cannot read them.' },
  stevie: { name: 'Stevie Rowe', first: 'Stevie', icon: '⚓', age: 31, job: 'sea', trait: 'witty', stay: [6, 16], back: 0.4, wants: 'Men at the pool table, against the Kettleby lot', blurb: 'Grew up on Net Loft Lane, and leads the Bay lads on B wing by being the loudest of them.' },
  reece: { name: 'Reece Jago', first: 'Reece', icon: '🦈', age: 35, job: 'crew', trait: 'sporty', stay: [8, 20], back: 0.3, wants: 'The pool table, and the Bay lads off it', blurb: 'The Kettleby lot’s man on B wing. Quiet, polite, and best avoided.' },
};
export const LANDING_IDS = Object.keys(LANDING);
// Each one's story, a card at a time (Reece is in Stevie's: the feud is told from the pool table).
const ARCS = {
  lenny: ['g2Len0', 'g2Len1', 'g2Len2', 'g2Len3'],
  ossie: ['g2Oss0', 'g2Oss1', 'g2Oss2', 'g2Oss3'],
  winston: ['g2Win0', 'g2Win1', 'g2Win2'],
  jamie: ['g2Jam0', 'g2Jam1'],
  stevie: ['g2Feud0', 'g2Feud1', 'g2Feud2'],
};
// Seasons at least between two cards of one person's story.
const GAP = 2;
// Who would come over the wall with you, and what they are worth on the night (your cellmate, from
// heists.js, or somebody from the landing); and who would not, and why.
const OVER = { moss: 0.1, tiny: 0.08, kev: 0.05, danny: 0.06, stranger: 0.03, stevie: 0.06, reece: 0.07, jamie: 0.02 };
const STAY = {
  bernard: '“I have four years left and a library card,” says Bernard. “I shall use both.”',
  sal: 'Sal looks at you over his glasses. “I have people for that sort of thing. They are outside.”',
  lenny: '“And leave the business?” says Lenny. “Do not be daft.”',
  ossie: '“Where would I go?” says Ossie. “Pip would not like it.”',
  winston: '“If I go over the wall,” says Winston, “I am guilty. I am not guilty.”',
};
const MATE_NAME = { moss: 'Old Moss', tiny: 'Tiny Doyle', kev: 'Kev Rudd', danny: 'Danny Carne', stranger: 'your cellmate', bernard: 'Bernard', sal: 'Sal' };
// Courses by post (the fee is half the college's; a trust pays the rest), as well as the free ones the education wing runs.
export const POST = ['coding', 'business'];
const FREE = ['trade', 'culinary', 'firstaid', 'skipper'];
// The old prison cards (events.js and folk-tales.js): once each a sentence, now that there are more.
const OLD = ['gPudding', 'gRiot', 'gVisit', 'gSearch', 'gGarden', 'gPoem', 'gParcel', 'fk_cell'];
// Who can be sent a visiting order, or written to.
const KIN = ['partner', 'spouse', 'parent', 'child', 'sibling', 'grandchild'];
const writable = (p) => KIN.includes(p.kind) || p.kind === 'friend';
const visitable = (p) => (KIN.includes(p.kind) && (!['child', 'grandchild'].includes(p.kind) || p.age >= 14)) || p.kind === 'friend';

const blank = () => ({
  cur: null, // this sentence (see freshCur), or null outside
  folk: {}, // the landing: { v: what they think of you (-100..100), st: how far their story has got, at: when its last card came, met, out, back, gone, pid, f: {} }
  best: {}, // the highest place reached in each prison job, all sentences
  feud: null, // the pool table: 'bay', 'kett', 'peace' or 'out' (you kept out of it)
  run: null, // over the wall: { t, mate, hid, n, said }
  later: [], // cards for outside, to be dealt when the time comes: { id, t, x }
  last: null, // how the last sentence ended: { t, served, how, job, rank }
  n: { terms: 0, seasons: 0, shifts: 0, promos: 0, sacked: 0, letters: 0, visits: 0, chap: 0, xmas: 0, hobbs: 0, walls: 0 },
  f: {}, // milestones: top, reader, quashed, planned, peace, sorry, june...
});
const freshCur = (s) => ({
  t: s.t, job: { k: 'laundry', r: 0, n: 0, perf: 50 }, moved: s.t - 2, rec: '',
  plan: { home: null, work: null, vouch: null },
  esc: { tools: 0, hw: 0, habits: 0, mate: null, seen: 0 },
  course: null, chap: 0, change: 0, vo: null, reply: null, vis: {}, wrote: {}, here: [],
  seen: {}, old: {}, last: s.t, xmas: 0, long: 0, tin: false, learnt: [], f: {},
});
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
// Whether the board would sit at the turn of a season, with this much served, in season t (as gaolSeason in inside.js has it).
const sits = (q, served, t) => q.total >= 3 && served * 2 >= q.total && (q.board == null || t - q.board >= 4);
const first = (p) => p.name.split(' ')[0];

export function install({ def, A, Life, clamp, hooks, addEvents }) {
  // ---- the state, for new lives and old ones (and an old one saved in prison) ----
  hooks.load.push((L) => {
    const s = L.s;
    if (!s.gaol2) s.gaol2 = blank();
    const G = s.gaol2, b = blank();
    for (const k of Object.keys(b)) if (G[k] === undefined) G[k] = b[k];
    for (const k of Object.keys(b.n)) if (G.n[k] == null) G.n[k] = 0;
    if (s.gaol && !G.cur) {
      // (Saved in a cell before any of this: the laundry, and the landing as it is.)
      G.cur = freshCur(s);
      G.cur.here = LANDING_IDS.filter((id) => !G.folk[id]);
      G.n.terms = Math.max(G.n.terms, 1);
    }
    if (G.cur) { const c = freshCur(s); for (const k of Object.keys(c)) if (G.cur[k] === undefined) G.cur[k] = c[k]; }
    if (!s.gaol && G.cur) G.cur = null;
    if (!s.run && G.run) G.run = null;
  });

  const cur = (L) => L.s.gaol2.cur;
  const fk = (L, id) => L.s.gaol2.folk[id];
  // Somebody from the landing, met for the first time (or again).
  const meetFolk = (L, id) => {
    const G = L.s.gaol2, k = LANDING[id];
    if (!G.folk[id]) G.folk[id] = { v: 0, st: 0, at: null, met: L.s.t, out: k.lifer ? null : L.s.t + L.int(k.stay[0], k.stay[1]), back: 0, gone: null, pid: null, f: {} };
    return G.folk[id];
  };
  const here = (L, id) => { const C = cur(L); return !!C && C.here.includes(id); };
  const warm = (L, id, d) => { const p = meetFolk(L, id); p.v = clampN(p.v + d, -100, 100); return p; };
  // A cellmate from heists.js, if heists.js is there.
  const cellmate = (L) => (L.s.gaol && L.s.gaol.mate && L.s.heists ? { id: L.s.gaol.mate, m: L.s.heists.lag.mates[L.s.gaol.mate] } : null);

  Object.assign(Life.prototype, {
    // ---- the job ----
    g2Job() { const C = cur(this); return C ? C.job : null; },
    g2JobTitle(j = this.g2Job()) { return j ? JOBS[j.k].ranks[j.r] : 'On the wing, with no work'; },
    g2Pay(j = this.g2Job()) { return j ? JOBS[j.k].pay[j.r] : 0; },
    g2JobIcon() { const j = this.g2Job(); return j ? JOBS[j.k].icon : '🚪'; },
    g2JobAct() { const j = this.g2Job(); return j ? `Work a shift: ${this.g2JobTitle(j).toLowerCase()}` : 'Work a shift'; },
    g2JobDesc() {
      const j = this.g2Job();
      if (!j) return 'You have no work: put in for a job.';
      const next = this.g2Next();
      return `${money(this.g2Pay(j))} a shift, into your account, and the governor notices.${next ? ` ${next}` : ''}`;
    },
    // What the next place up still needs, in words.
    g2Next() {
      const j = this.g2Job(), J = j && JOBS[j.k];
      if (!J || j.r >= J.ranks.length - 1) return j ? 'You are as high as it goes.' : '';
      const want = SH[j.r], need = [];
      if (j.n < want) need.push(`${want - j.n} more shift${want - j.n === 1 ? '' : 's'}`);
      if (j.perf < 55) need.push('a better name with the boss');
      if (this.s.gaol.good < J.good[j.r + 1]) need.push(`a record of ${J.good[j.r + 1]}`);
      return need.length ? `${J.ranks[j.r + 1]}: ${need.join(', ')}.` : `${J.ranks[j.r + 1]} next.`;
    },
    g2ShiftWhy() {
      const s = this.s;
      if (!this.g2Job()) return 'You have no work: put in for a job.';
      return (s.use.g2shift || 0) >= SHIFTS ? 'Two shifts a season is all the work there is.' : null;
    },
    // A shift. x: how well it went, from 0 to 1 (the hotplate by hand), or a plain shift.
    g2Shift(x) {
      const s = this.s, C = cur(this), j = C.job, J = JOBS[j.k], q = s.gaol;
      const played = x !== undefined;
      const k = played ? 0.5 + x : 1;
      const pay = Math.round(J.pay[j.r] * k / 5) * 5;
      this.cash(pay);
      for (const [st, n] of J.stats) this.gain(st, n);
      this.behave(2 + (j.r >= 2 ? 1 : 0));
      j.n++; s.gaol2.n.shifts++; s.use.g2shift = (s.use.g2shift || 0) + 1;
      j.perf = clamp(j.perf + (played ? 1 + 8 * x : 4), 0, 100);
      if (j.k === 'kitchen') this.hp(1);
      if (j.k === 'gardens') this.joy(1);
      // (The kitchens count towards the Culinary Certificate, the workshop towards Trade Papers, if that is the course.)
      let extra = '';
      if (J.course && this.gaolCourse() === J.course && this.chance(0.35)) extra = this.gaolLearn(1) ? ` ${COURSES[J.course].name}: passed, between shifts.` : ' It counts towards your course.';
      // Up a place.
      let up = '';
      if (j.r < J.ranks.length - 1 && j.n >= SH[j.r] && j.perf >= 55 && q.good >= J.good[j.r + 1]) {
        j.r++; j.n = 0; s.gaol2.n.promos++;
        const G = s.gaol2;
        G.best[j.k] = Math.max(G.best[j.k] || 0, j.r);
        if (j.r === J.ranks.length - 1) G.f.top = 1;
        this.respect(3);
        this.note(`Made ${J.ranks[j.r].toLowerCase()} in ${J.name.toLowerCase()} at Starling Gaol.`, 'big');
        this.say(J.icon, `${J.ranks[j.r]}: ${money(J.pay[j.r])} a shift`, 'good');
        up = ` ${J.boss} stops you on the way out: from Monday you are ${J.ranks[j.r].toLowerCase()}.`;
      }
      const line = played ? (x >= 0.8 ? 'Not a tray sent back, and Chef says “all right” twice.' : x >= 0.5 ? 'A steady service. Two complaints, both from men who complain about everything.' : 'Half the wing gets beans it did not ask for. Chef has words.') : this.pick(J.lines);
      return `${line} ${money(pay)}.${extra}${up}`;
    },
    g2JobWhy(k) {
      const s = this.s, C = cur(this), J = JOBS[k], q = s.gaol;
      if (!C) return 'Not just now.';
      if (q.inSol) return 'Not from the block.';
      if (C.job && C.job.k === k) return 'This is your job.';
      if (s.t - C.moved < 2) return 'The labour board will not move you again so soon.';
      const start = this.g2Start(k);
      if (q.good < J.good[start]) return `They want a record of ${J.good[start]}.`;
      if (J.smarts && s.st.smarts < J.smarts) return `They want somebody who can read well (Smarts ${J.smarts}).`;
      return null;
    },
    // Where you would start: a place below the best you reached there before, in an earlier sentence.
    g2Start(k) { const b = this.s.gaol2.best[k] || 0; return Math.max(0, b - 1); },
    // Out of work: the block, a fight, a blade in a shoe.
    g2Sack(why) {
      const C = cur(this);
      if (!C || !C.job) return;
      const J = JOBS[C.job.k];
      this.note(`Lost the job in ${J.name.toLowerCase()} at Starling Gaol: ${why}.`);
      C.job = null; C.moved = this.s.t; this.s.gaol2.n.sacked++;
    },

    // ---- courses ----
    g2Course() { const C = cur(this); return C && C.course && !this.hasEdu(C.course) ? C.course : null; },
    g2Sittings(id) { return id && POST.includes(id) ? COURSES[id].classes : 5; },
    g2CourseDesc() { const id = this.gaolCourse(); return id && POST.includes(id) ? 'By post, from the Open College, marked in red ink by somebody in Kettleby. A real qualification at the end of it.' : 'The education wing. Free, and you walk out with a real qualification.'; },
    // (Better grades for the better students.)
    g2Grade() { const m = this.s.st.smarts; return m >= 60 ? 2 : m >= 40 ? 1 : 0; },
    g2Learnt(id) { const C = cur(this); if (C) C.learnt.push(id); },
    g2CourseFee(id) { return POST.includes(id) ? Math.round(COURSES[id].cost / 2) : 0; },
    g2CourseWhy(id) {
      const s = this.s, C = cur(this), c = COURSES[id];
      if (!C) return 'Not just now.';
      if (!FREE.includes(id) && !POST.includes(id)) return 'Not taught in here.';
      if (this.hasEdu(id)) return 'You have it already.';
      if (this.gaolCourse() === id) return 'You are studying for it now.';
      const miss = Object.entries(c.need).find(([k, n]) => k !== 'edu' && k !== 'degree' && s.st[k] < n);
      if (miss) return `Needs ${miss[0][0].toUpperCase()}${miss[0].slice(1)} ${miss[1]}.`;
      return null;
    },

    // ---- the landing ----
    g2Here(id) { return here(this, id); },
    g2Folk(id) { return fk(this, id) || null; },
    g2Word(v) { return v >= 60 ? 'Would do anything for you' : v >= 30 ? 'On your side' : v >= 8 ? 'Friendly' : v > -8 ? 'Knows your face' : v > -40 ? 'Does not like you' : 'Has it in for you'; },
    // What somebody on the landing is after just now, if there is something you can do about it today.
    g2Favour(id) {
      const p = fk(this, id);
      if (!p || !here(this, id)) return null;
      if (id === 'winston' && p.st === 1 && p.f.listen && (p.f.work || 0) < 3) return { title: `Go through Winston’s papers (${p.f.work || 0}/3)`, desc: 'The witness statements, the bus timetable and nine years of letters. Takes Smarts.' };
      if (id === 'jamie' && p.st === 1 && p.f.teach && (p.f.les || 0) < 4) return { title: `Teach Jamie his letters (${p.f.les || 0}/4)`, desc: 'An hour after tea, with Kayleigh’s letters and a pencil. Patience counts as much as Smarts.' };
      return null;
    },
    g2Wants(id) {
      const p = fk(this, id), k = LANDING[id];
      if (!p) return k.wants;
      if (p.gone) return null;
      if (id === 'ossie' && p.f.june === 'wrote') return 'Nothing much, now that June writes';
      if (id === 'winston' && p.f.quashed) return null;
      if (id === 'jamie' && p.f.read) return 'To get home to Kayleigh';
      if (id === 'stevie' && this.s.gaol2.feud === 'peace') return 'A quiet game of pool, at last';
      return k.wants;
    },

    // ---- the plan for outside ----
    g2Plan() { const C = cur(this); return C ? C.plan : null; },
    g2PlanCount() { const P = this.g2Plan(); return P ? (this.g2HomeOk() ? 1 : 0) + (P.work ? 1 : 0) + (P.vouch ? 1 : 0) : 0; },
    // Somewhere to live: your own home, or what was arranged (and is still good: the person is still yours).
    g2HomeOk() {
      const s = this.s, P = this.g2Plan();
      if (s.owned) return true;
      const h = P && P.home;
      if (!h) return false;
      if (h.k === 'room') return true;
      const p = this.person(h.p);
      return !!p && (h.k !== 'kept' || ['partner', 'spouse'].includes(p.kind));
    },
    g2Housed() { const h = this.g2Plan() && this.g2Plan().home; return !!h && h.k === 'kept' && this.g2HomeOk(); },
    // A career that would take you on, for a plan's work: honest, not barred, and not one that will not have a record.
    g2JobOk(c) { const car = CAREERS[c]; return !!car && !car.shady && !car.clean && !(this.s.careers && this.careerBarred && this.careerBarred(c)); },
    // What the board makes of it all, on top of your record and your charm (paroleOdds in inside.js).
    g2BoardPlus() {
      const C = cur(this);
      if (!C) return 0;
      const P = C.plan, j = C.job, recent = C.rec.slice(-4);
      let b = (this.g2HomeOk() ? 0.07 : -0.05) + (P.work ? 0.07 : -0.03) + (P.vouch ? 0.05 : 0);
      b += j ? Math.min(0.06, j.r * 0.02) : -0.02;
      b += C.change >= 50 ? 0.05 : C.change >= 25 ? 0.02 : 0;
      b += C.learnt.length ? 0.03 : 0;
      b += (C.f.stmt ? 0.03 : 0) + (C.f.report ? 0.04 : 0) + (C.f.dinner ? 0.03 : 0);
      b -= 0.03 * [...recent].filter((m) => m === 't' || m === 'b').length;
      return b;
    },
    // What the board reads out (the parole card in events.js asks for this).
    g2BoardText() {
      const s = this.s, q = s.gaol, C = cur(this), n = s.n.boards || 0;
      const left = `${q.left} season${q.left > 1 ? 's' : ''} left to serve.`;
      if (!C) return `Three people behind a long table, with your file open between them. On it: "${this.goodWord()}." ${left}`;
      const OPEN = [
        'The same long table, and two of the same three faces. The chairman finds your name in his notes from last time, and reads them again.',
        'A new member of the board this time, a woman with a fountain pen, who reads every page of your file while the others wait.',
        `Your file has its own elastic band now. The chairman weighs it in his hand before he opens it.`,
        '“We have met,” says the chairman, “a number of times.” He says it without unkindness.',
        'The board sits in the chapel this year, because the roof of the board room is being mended. The chairman sits under the window with the saint in it.',
        'The chairman is new: the old one has retired to grow dahlias. The new one has read your file on the train, and has underlined things.',
      ];
      const open = n === 0 ? 'Three people behind a long table, with your file open between them.' : OPEN[(n - 1 + s.gaol2.n.terms) % OPEN.length];
      const rec = C.rec, clean = [...rec].filter((m) => m !== 't' && m !== 'b').length;
      const file = `On it: “${this.goodWord()}.”${rec.length ? ` ${rec.length} season${rec.length === 1 ? '' : 's'} inside, ${clean === rec.length ? (rec.length === 1 ? 'without a mark against you' : 'not one of them with a mark against you') : `${clean} of them without a mark against you`}.` : ''}`;
      const job = C.job ? ` ${JOBS[C.job.k].boss} has you down as “${this.g2JobTitle()}”, in ${JOBS[C.job.k].name.toLowerCase()}.` : ' No work: behind your door most of the day.';
      const learnt = C.learnt.length ? ` ${C.learnt.map((id) => `A ${COURSES[id].name}`).join(', ')}, passed inside.` : '';
      const ch = C.change >= 50 ? ' A letter from Mrs Abernethy about the work you have done in her group.' : '';
      const P = C.plan, home = this.g2HomeOk() ? ` Somewhere to go: ${s.owned && !(P.home) ? 'your own home' : P.home.txt}.` : ' Where will you live? You have no answer, and the woman with the pen writes that down.';
      const work = P.work ? ` Work waiting, at ${P.work.at}${P.work.who ? `, through ${P.work.who}` : ''}.` : ' Work? Nothing lined up.';
      const vouch = P.vouch ? ` And somebody to speak for you: ${P.vouch.name}.` : '';
      return `${open} ${file}${job}${learnt}${ch}${home}${work}${vouch} ${left}`;
    },
    // When the board sits next, in seasons from now (null if it will not, this sentence).
    g2BoardIn() {
      const s = this.s, q = s.gaol;
      if (!q) return null;
      for (let k = 1; k < q.left; k++) if (sits(q, q.served + k, s.t + k)) return k;
      return null;
    },

    // ---- the wall ----
    g2Mate() { const C = cur(this); return C && C.esc.mate; },
    g2MateName(id = this.g2Mate()) { return !id ? null : LANDING[id] ? LANDING[id].name : MATE_NAME[id] || 'your cellmate'; },
    g2WallPlus() {
      const s = this.s, C = cur(this);
      if (!C) return 0;
      const e = C.esc;
      return e.tools * 0.05 + e.habits * 0.06 + (OVER[e.mate] || 0) + (s.wx === 'fog' ? 0.06 : s.wx === 'storm' ? 0.04 : 0) - e.seen / 500;
    },
    g2DigRisk() {
      const s = this.s, C = cur(this);
      if (!C) return 0.15;
      const e = C.esc;
      return clamp(0.05 + e.seen / 250 - e.habits * 0.015 - (e.mate ? 0.02 : 0) + (s.gaol.rep < 20 ? 0.04 : 0), 0.03, 0.3);
    },
    g2Dug() { const C = cur(this); if (C) C.esc.seen = Math.min(100, C.esc.seen + 8); },
    // Found out: the dig (they find the hole and your spoon), or the wall itself (they find everything).
    g2Foiled(how) {
      const s = this.s, C = cur(this);
      if (!C) return;
      const e = C.esc;
      e.seen = 0;
      if (how === 'dig') { e.tools = Math.max(0, e.tools - 1); return; }
      e.tools = 0;
      if (e.mate) {
        // (Whoever came with you is in the block too, and blames you.)
        if (LANDING[e.mate]) warm(this, e.mate, -20);
        else if (s.heists && s.heists.lag.mates[e.mate]) s.heists.lag.mates[e.mate].bond = Math.max(0, s.heists.lag.mates[e.mate].bond - 15);
        e.mate = null;
      }
      if (C.job) this.g2Sack('caught on the wall');
      s.gaol2.n.walls++;
    },
    // The night, told from the plan.
    g2WallTale(won) {
      const s = this.s, C = cur(this);
      if (!C) return null;
      const e = C.esc, who = this.g2MateName();
      const kit = e.tools >= 2 ? 'a hacksaw blade and a key cast in soap' : e.tools ? 'a hacksaw blade in the sole of your shoe' : 'a spoon and a lot of hope';
      const knew = e.habits >= 2 ? 'Mr Hobbs stops for his cigarette at ten past, as he has every night for a year, and the man on the gate is asleep by half past.' : e.habits ? 'You know when the round comes past, near enough.' : 'You do not really know when the round comes past.';
      const sky = s.wx === 'fog' ? ' Fog comes in off the sea at midnight, thick as wool, as you hoped.' : s.wx === 'storm' ? ' The storm covers every sound you make.' : '';
      if (won) return `${knew}${sky} The grating, the chute, the wall, with ${kit}.${who ? ` ${who} goes over first and reaches down for you.` : ''} A laundry van is leaving as you land, and you leave with it. Every constable in the Bay will have your photograph by morning.`;
      return `${knew}${sky} The grating, the chute, the wall, with ${kit}.${who ? ` ${who} is halfway up when the bell goes.` : ''} The searchlight comes round early, for the first time in a year. Four more seasons, and the block.`;
    },
    // On the run: how much likelier they are to find you, for where you are lying low.
    g2LamRisk() { const R = this.s.gaol2.run; return !R ? 1 : { kin: 1.5, caves: 0.6, sal: 0.5, room: 0.8 }[R.hid] || 1; },

    // ---- the record of the seasons ----
    g2Rec() { const C = cur(this); return C ? C.rec : ''; },
  });

  // ---- a fresh sentence, and the gate ----
  Object.assign(Life.prototype, {
    g2Jail() {
      const s = this.s, G = s.gaol2;
      G.n.terms++;
      G.run = null;
      G.cur = freshCur(s);
      const C = G.cur;
      // (Back in the kitchens where you left off, near enough, if they will have you: no, the laundry first. Everybody starts there.)
      for (const id of LANDING_IDS) {
        const p = G.folk[id], k = LANDING[id];
        if (!p) { C.here.push(id); continue; }
        if (p.gone) continue;
        if (k.lifer || (p.out != null && p.out > s.t)) { C.here.push(id); continue; }
        // Out, and back inside again, as some are.
        const back = id === 'jamie' && p.f.read ? 0.1 : k.back;
        if (back && this.chance(back)) { p.out = s.t + this.int(k.stay[0], k.stay[1]); p.back = (p.back || 0) + 1; p.at = null; C.here.push(id); }
      }
      // The pool table is somebody else's business when neither of them is in.
      if (!C.here.includes('stevie')) C.here = C.here.filter((id) => id !== 'reece');
    },
    // Out: by the gate (how: 'parole' or 'served') or over the wall.
    g2Free(q, how) {
      const s = this.s, G = s.gaol2, C = G.cur;
      if (!C) return;
      G.last = { t: s.t, served: q.served, how, job: C.job ? C.job.k : null, rank: C.job ? C.job.r : 0 };
      // Those from the landing who took to you, and are out themselves, look you up; one or two who did not, too.
      for (const id of LANDING_IDS) {
        const p = G.folk[id], k = LANDING[id];
        if (!p || p.pid || p.gone === 'dead' || (p.out != null && p.out > s.t && !p.gone) || k.lifer) continue;
        if (p.v >= 50 && this.friends().length < 20) {
          const f = this.meet({ name: k.name, sex: 'm', job: k.job, trait: k.trait, age: Math.max(19, k.age + Math.floor((s.t - p.met) / 4)), bond: 35 + Math.round(p.v / 5), single: false });
          p.pid = f.id;
        } else if (p.v <= -50 && !p.f.foe && this.enemies && this.enemies().length < 3 && this.chance(0.5)) {
          p.f.foe = 1;
          this.foe({ name: k.name, sex: 'm', age: Math.max(19, k.age + Math.floor((s.t - p.met) / 4)), grudge: 40 + Math.round(-p.v / 4) });
        }
      }
      if (how === 'wall') {
        G.run = { t: s.t, mate: C.esc.mate || null, hid: null, n: 0, said: {} };
        G.n.walls++;
      } else {
        const P = C.plan;
        if (P.home && this.g2HomeOk()) {
          const p = P.home.p != null ? this.person(P.home.p) : null;
          if (P.home.k === 'room' && !s.owned) {
            s.home = 'bedsit';
            this.cash(this.rentOf('bedsit'));
            this.note('The Mariners’ Trust found a room over the chip shop, and paid the first season’s rent.');
          } else if (P.home.k === 'kin' && p) { this.bond(p, 6); this.cash(300); }
        }
        if (P.vouch && P.vouch.p != null && this.person(P.vouch.p)) this.bond(this.person(P.vouch.p), 4);
        if (P.work && this.g2JobOk(P.work.c)) this.queue('g2Start', { ...P.work });
        if (how === 'parole' && this.g2PlanCount() >= 3) G.f.planned = 1;
        if (fk(this, 'ossie') && fk(this, 'ossie').f.hand === 1) G.later.push({ id: 'g2June', t: s.t + 2 });
      }
      G.cur = null;
    },
  });

  // ---- actions --------------------------------------------------------------------------

  // As in inside.js: from the block, only what can be done alone (sol).
  const gaol = (o) => {
    const why = o.why;
    return Object.assign({ gaol: true }, o, { why: (L, x, y) => (!cur(L) ? 'Not just now.' : L.s.gaol.inSol && !o.sol ? 'Not from the block.' : why ? why(L, x, y) : null) });
  };

  // -- work
  def('g2Plate', gaol({
    place: 'gaol', sec: 'Work', icon: '🍛', title: 'Serve on the hotplate, by hand',
    desc: 'Six hundred dinners and everybody’s menu sheet. Done well, it pays up to half as much again, and Chef notices; done badly, the wing notices.',
    show: (L) => { const j = L.g2Job(); return !!j && j.k === 'kitchen' && j.r >= 1; },
    why: (L) => L.g2ShiftWhy(),
    run: (L, x) => L.g2Shift(x === undefined ? 0.5 : clampN(Number(x) || 0, 0, 1)),
  }));
  def('g2Jobs', { place: 'gaol', gaol: true, sec: 'Work', icon: '📋', open: 'g2Jobs', title: (L) => (L.g2Job() ? 'Put in for different work' : 'Put in for work'), desc: (L) => `The laundry, the kitchens, the library, the gardens and the workshop. Now: ${L.g2JobTitle().toLowerCase()}.`, show: (L) => !!cur(L) });
  def('g2Apply', gaol({
    time: 0,
    why: (L, k) => (!JOBS[k] ? 'No such work.' : L.g2JobWhy(k)),
    run(L, k) {
      const C = cur(L), J = JOBS[k], r = L.g2Start(k), was = C.job;
      C.job = { k, r, n: 0, perf: 50 }; C.moved = L.s.t;
      L.note(`Started work in ${J.name.toLowerCase()} at Starling Gaol.`);
      return `${was ? `You hand in your ${JOBS[was.k].name.slice(4)} apron. ` : ''}${J.boss} looks you up and down. ${r ? `“I remember you,” ${J.boss === 'Mrs Treloar' || J.boss === 'Miss Achterberg' ? 'she' : 'he'} says. “${J.ranks[r]}, and do not make me sorry.”` : `“${J.ranks[0]},” ${J.boss === 'Mrs Treloar' || J.boss === 'Miss Achterberg' ? 'she' : 'he'} says. “Monday, seven sharp.”`}`;
    },
  }));

  // -- the day
  def('g2Course', gaol({
    time: 0, cost: (L, id) => L.g2CourseFee(id),
    why: (L, id) => (COURSES[id] ? L.g2CourseWhy(id) : 'No such course.'),
    run(L, id) {
      const C = cur(L), was = L.gaolCourse(), q = L.s.gaol;
      C.course = id; q.study = 0;
      return POST.includes(id) ? `The first envelope from the Open College comes on Tuesday: a reading list, a timetable, and a letter that calls you “Dear Student”.${was && was !== id ? ' What you had done on the other course is set aside.' : ''}` : `The tutor writes your name on the list for the ${COURSES[id].name}.${was && was !== id ? ' What you had done on the other course is set aside.' : ''}`;
    },
  }));
  def('g2Chap', gaol({
    place: 'gaol', sol: true, sec: 'The day', icon: '🕯️', title: (L) => (L.s.gaol.inSol ? 'Ask for the chaplain' : 'See the chaplain'), per: 1,
    desc: 'The Reverend Hugh Penrose: a big man with a beard and a motorbike, who visits the block as well. Good for the mood, and he knows people.',
    run(L) {
      const C = cur(L), s = L.s, n = ++C.chap;
      s.gaol2.n.chap++;
      L.joy(4); L.karma(1); L.behave(1);
      if (s.gaol.inSol) return L.pick(['He sits on the floor of the cell in the block, because there is only one chair and it is bolted down, and talks to you about motorbikes for an hour.', 'He brings a flask of tea into the block, which is not allowed, and a crossword, which is.']);
      const early = ['The chapel is cold and the chaplain is not. He asks what you would like to talk about, and then waits, which nobody has done for a while.', 'He talks about his motorbike, a 1962 Norton, for twenty minutes. Then he asks about your family, and you find you tell him.', 'You sit at the back of the chapel. He is mending a hymn book with glue. He does not ask you anything, and it is the best hour of the week.'];
      const later = ['“Same time next week?” says the Reverend Penrose, and you realise you were going to come anyway.', 'He tells you about the men he has seen go out and not come back, which he says is most of them, if they want it badly enough.', 'You talk about what you will do when you are out. He writes some of it down, which makes it more real.', 'He has brought you a book of poems from his own shelf. One of them has a pencil mark beside it. You do not ask whose.'];
      return n <= 2 ? L.pick(early) : L.pick(later);
    },
  }));
  def('g2Group', gaol({
    place: 'gaol', sec: 'The day', icon: '🫖', title: (L) => (cur(L) && cur(L).change >= 50 ? 'Go back to Mrs Abernethy’s group' : 'Join Mrs Abernethy’s group'), per: 1,
    desc: (L) => `Thursdays: thinking things through, with biscuits. Good for your record and the board, and for any habit you brought in with you.${cur(L) ? ` (${Math.min(100, Math.round(cur(L).change))}% of the way through)` : ''}`,
    run(L) {
      const s = L.s, C = cur(L), was = C.change;
      C.change = Math.min(100, C.change + 6 + s.st.smarts / 25 + s.st.charm / 50);
      L.behave(3); L.gain('charm', 0.4);
      for (const k of Object.keys(s.habit)) s.habit[k] = Math.max(0, s.habit[k] - 8);
      if (was < 50 && C.change >= 50) { L.note('Finished Mrs Abernethy’s course in Starling Gaol.', 'big'); L.say('🫖', 'Through Mrs Abernethy’s course', 'good'); L.joy(4); return 'The last session. Mrs Abernethy shakes everybody’s hand, and gives each of you a certificate she has written out herself, in ink.'; }
      const lines = C.change < 25 ? ['Eight men in a circle, and a flip chart. Nobody says anything for twenty minutes. Then a man called Del talks about his dad, and nobody stops him.', 'Mrs Abernethy asks what you were thinking, the night you did it. You say you were not thinking. She says, “Exactly.”', 'A worksheet with boxes on it: what happened, what you felt, what you did. You fill in the third box first.']
        : ['You talk about the night it all went wrong, out loud, to eight men and a plate of custard creams. It is easier the second time.', 'Mrs Abernethy draws a circle on the flip chart and writes “choices” in it. Somebody draws a face on it. She leaves it.', 'A role play: you are the person on the other end of what you did. You do not like it. That is the point, she says.', 'Del is out next week. He hands round a packet of biscuits he has saved, and says thank you to everybody, and cannot finish.'];
      return L.pick(lines);
    },
  }));
  def('g2Post', { place: 'gaol', gaol: true, sec: 'The day', icon: '📮', open: 'g2Post', title: 'Letters and visits', desc: 'Write to somebody in particular, or send them a visiting order. The people outside keep you, or forget you.', show: (L) => !!cur(L) });
  def('g2Write', gaol({
    sol: true,
    why: (L, pid) => { const p = L.person(pid), C = cur(L); return !p || !writable(p) ? 'Not somebody you can write to.' : C.wrote[pid] === L.s.t ? 'You have written to them this season.' : Object.values(C.wrote).filter((t) => t === L.s.t).length >= 2 ? 'Two letters a season is all the paper there is.' : null; },
    run(L, pid) {
      const s = L.s, C = cur(L), p = L.person(pid), G = s.gaol2;
      C.wrote[pid] = s.t; G.n.letters++;
      L.bond(p, KIN.includes(p.kind) ? 8 : 6); L.joy(1);
      if (!C.reply && L.chance(0.5)) C.reply = { p: pid, t: s.t };
      const n = first(p);
      const lines = p.kind === 'partner' || p.kind === 'spouse' ? [`Six pages to ${n}. You cross out the bit about the showers, and the bit about the food, and most of the bit about missing them, which is still there underneath.`, `A letter to ${n}, with a pressed daisy from the yard in it. The censor lets the daisy through.`, `You write to ${n} about the day you met, in more detail than you knew you remembered.`]
        : p.kind === 'child' || p.kind === 'grandchild' ? [`A letter to ${n}, with a drawing of the view from your window. You make the wall smaller than it is.`, `You write to ${n} about the gulls on the wall and the man with the canary, and not about anything else.`]
          : p.kind === 'parent' ? [`You write to ${first(p)} that the food is fine. The censor underlines it and adds a question mark.`, `Two pages to ${first(p)}, about the course and the job and the chaplain. It is the first letter in years that you are not ashamed to send.`]
            : [`A letter to ${n}, mostly jokes. One of them is even true.`, `You write to ${n} about the people on the landing, which is better than a novel, and about yourself, which is not.`];
      return L.pick(lines);
    },
  }));
  def('g2VO', gaol({
    time: 0, per: 1,
    why: (L, pid) => { const p = L.person(pid), C = cur(L); return !p || !visitable(p) ? 'Not somebody who can visit.' : C.vo ? 'One visiting order at a time.' : null; },
    run(L, pid) {
      const C = cur(L), p = L.person(pid);
      C.vo = { p: pid, t: L.s.t };
      return `You fill in the visiting order for ${p.name}, in your best handwriting, and post it. Thursday week, two till four, if they come.`;
    },
  }));

  // -- the landing
  def('g2Landing', { place: 'gaol', gaol: true, sec: 'The landing', icon: '👥', open: 'g2Landing', title: 'Who is who on the landing', desc: 'The people you share a wing with, what they want, and what they think of you.', show: (L) => !!cur(L) });
  def('g2Sit', gaol({
    per: 1,
    why: (L, id) => (!LANDING[id] || !here(L, id) ? 'They are not on the landing.' : fk(L, id) && fk(L, id).gone ? 'They are not on the landing.' : null),
    run(L, id) {
      const s = L.s, p = warm(L, id, 4 + s.st.charm / 40), k = LANDING[id];
      L.joy(1); L.gain('charm', 0.3);
      const T = {
        lenny: ['Lenny teaches you gin rummy, and takes four ounces off you, and gives three of them back. “Lesson,” he says.', 'Lenny talks about his mother’s pasties, at length, with his eyes shut.'],
        ossie: ['You listen to Pip sing along to the shipping forecast. Ossie knows every sea area by heart: “German Bight,” he says, as if it were a prayer.', 'Ossie tells you about the Bay as it was in 1960, when the pier had a ballroom and he could dance.'],
        winston: ['Winston explains the law of evidence to you, using sugar lumps as witnesses. You understand it, briefly.', 'Winston reads you a letter he has written to the Home Secretary. It is his three hundred and twelfth.'],
        jamie: ['Jamie shows you a photograph of Kayleigh, on a swing, with no front teeth. He has shown it to you before. You look at it as if he had not.', 'You and Jamie play table tennis with a ball that has a dent in it. It goes everywhere but where it should.'],
        stevie: ['Stevie Rowe tells you which Net Loft Lane families are related to which, which is all of them.', 'Pool with Stevie and the Bay lads. You lose, but loudly, which counts.'],
        reece: ['Reece Jago plays chess with you in total silence, and wins in eleven moves, and shakes your hand.', 'Reece tells you about Kettleby, where, he says, nobody locks a door, because nobody would dare.'],
      };
      return `${L.pick(T[id])}${p.v >= 60 ? ` ${k.first} would walk through a wall for you now.` : ''}`;
    },
  }));
  def('g2Help', gaol({
    why: (L, id) => (!L.g2Favour(id) ? 'Nothing to do for them just now.' : id === 'winston' && L.s.st.smarts < 30 ? 'The law is too much for you yet (Smarts 30).' : null),
    run(L, id) {
      const s = L.s, p = fk(L, id);
      if (id === 'winston') {
        const ok = L.chance(L.checkOdds('smarts', 45));
        p.f.work = (p.f.work || 0) + 1; p.f.q = (p.f.q || 0) + (ok ? 1 : 0);
        warm(L, id, 5); L.gain('smarts', 1.2); L.behave(1);
        if (p.f.work >= 3) return 'The last box. Somewhere in it, you are sure now, is the thing that does not add up. You go to sleep with the bus timetable under your pillow.';
        return ok ? L.pick(['Page by page through the witness statements. On page 212, a time: twenty past four. You underline it.', 'You make a chart of where everybody was that afternoon, in pencil, on the back of a menu sheet. Winston looks at it for a long time.']) : L.pick(['Three hours of legal language, and you are not sure you understood any of it. Winston says that is how it is meant to feel.', 'You read the same statement four times and fall asleep on it. Winston covers you with a blanket, which is touching, and keeps reading.']);
      }
      if (id === 'jamie') {
        const ok = L.chance(clampN(0.35 + s.st.smarts / 200 + s.st.charm / 200, 0.2, 0.92));
        if (ok) p.f.les = (p.f.les || 0) + 1;
        warm(L, id, 4); L.karma(1); L.gain('charm', 0.5);
        if (p.f.les >= 4) return 'He reads a whole page of Kayleigh’s letter out loud, by himself, with his finger under every word. Then he reads it again, faster, and then he has to go back to his cell for a bit.';
        return ok ? L.pick(['C-A-T. D-O-G. K-A-Y-L-E-I-G-H, which is a lot of letters for a little girl. He gets it on the third go.', 'He reads the first line of her letter: “Dear Daddy.” He stops there for a while.', 'Big letters on the back of a canteen sheet. He copies them out until the pencil is a stub.']) : L.pick(['A bad night. He throws the pencil across the cell and says he is thick, he has always been thick. You pick it up and wait.', 'He cannot settle tonight: a letter from Kayleigh’s mum that he cannot read, and is afraid of. You read it to him. It is only about shoes.']);
      }
      return '';
    },
  }));

  // -- getting out
  def('g2PlanRow', { place: 'gaol', gaol: true, sec: 'Getting out', icon: '🗺️', open: 'g2Plan', title: 'Your plan for outside', desc: (L) => `Somewhere to live, work, somebody to speak for you: what the board wants to see, and what you will need. ${L.g2PlanCount()} of 3 arranged.`, show: (L) => !!cur(L) });
  def('g2WallRow', { place: 'gaol', gaol: true, sec: 'Getting out', icon: '🌙', open: 'g2Wall', title: 'The way over the wall', desc: (L) => `The route, the tools, the guards’ habits, and who goes with you. About ${Math.round(L.breakOdds() * 100)}% on the night, as things stand.`, show: (L) => !!cur(L) && (L.s.gaol.dig > 0 || cur(L).esc.tools > 0 || cur(L).esc.habits > 0) });
  def('g2Watch', gaol({
    place: 'gaol', sec: 'Getting out', icon: '🔭', title: 'Watch the guards', per: 1,
    desc: 'From the window, the yard, the laundry: when the rounds come, who stops for a cigarette, who sleeps on the gate. Every night you know is better odds.',
    show: (L) => L.s.gaol.dig > 0 || cur(L).esc.habits > 0,
    why: (L) => (cur(L).esc.habits >= 2 ? 'You know their habits by heart.' : null),
    run(L) {
      const C = cur(L), e = C.esc, j = C.job;
      e.hw += 1 + (j && (j.k === 'laundry' || j.k === 'gardens') ? 1 : 0);
      const was = e.habits;
      e.habits = Math.min(2, Math.floor(e.hw / 2));
      e.seen = Math.min(100, e.seen + 3);
      L.gain('smarts', 0.4);
      if (e.habits > was) return e.habits >= 2 ? 'You have it now: the new officer on the gate falls asleep after his sandwich, at half past one, every night but Fridays.' : 'Mr Hobbs does his round at ten past, every night, and stops for a cigarette at the far end, under the light.';
      return L.pick(['You count the seconds between the searchlight’s passes. Forty-one, every time.', 'From the laundry window you watch the van come and go: Tuesdays and Fridays, at nine, and the driver never locks the back.', 'A night awake, listening. Keys at two, boots at three, and nothing at all at four.']);
    },
  }));
  def('g2Tools', gaol({
    place: 'gaol', sec: 'Getting out', icon: '🪚', title: 'Get hold of something useful', per: 1,
    cost: (L) => (cur(L) && cur(L).esc.tools < 2 && !(L.g2Job() && L.g2Job().k === 'workshop') && here(L, 'lenny') && (fk(L, 'lenny') || { v: 0 }).v >= 0 && cur(L).esc.tools >= 1 ? 200 : 0),
    desc: (L) => (L.g2Job() && L.g2Job().k === 'workshop' ? 'A hacksaw blade from the workshop, in the sole of your shoe. Mr Prothero counts them.' : here(L, 'lenny') ? 'A spoon sharpened on the yard wall, or something better from Lenny the Tin, for a price.' : 'A spoon sharpened on the yard wall: better than nothing.'),
    show: (L) => L.s.gaol.dig > 0,
    why: (L) => { const e = cur(L).esc, j = L.g2Job(); return e.tools >= 2 ? 'You have all you can hide.' : e.tools >= 1 && !(j && j.k === 'workshop') && !(here(L, 'lenny') && (fk(L, 'lenny') || { v: 0 }).v >= 0) ? 'Nothing better to be had, without the workshop or the Tin.' : null; },
    run(L) {
      const C = cur(L), e = C.esc, j = C.job;
      if (j && j.k === 'workshop') {
        if (L.chance(0.12)) { e.seen = Math.min(100, e.seen + 20); L.behave(-15); L.g2Sack('a hacksaw blade in a shoe'); return 'Mr Prothero counts the blades back onto the board, and counts again, and looks at your shoes. You are back on the wing by teatime, with no job and a great deal of attention.'; }
        e.tools++;
        return e.tools >= 2 ? 'A bar of soap, a key left on the bench for a minute, and a very good impression of it. Mr Prothero never knows.' : 'A hacksaw blade, snapped short, in the sole of your shoe. You walk very carefully for a week.';
      }
      if (e.tools >= 1) { e.tools++; warm(L, 'lenny', 2); e.seen = Math.min(100, e.seen + 5); return 'Lenny does not ask what it is for. A key, cast in soap by somebody in the workshop who owes him, wrapped in a page of the Gazette.'; }
      e.tools = 1;
      return 'A spoon, and an hour on the yard wall when nobody is looking, and you have an edge on it you could shave with.';
    },
  }));
  def('g2Ask', gaol({
    time: 0,
    why: (L, id) => {
      const C = cur(L), cm = cellmate(L);
      if (C.esc.mate) return `${L.g2MateName()} is coming with you already.`;
      if (id === 'mate') { if (!cm) return 'You have no cellmate to ask.'; if (STAY[cm.id]) return STAY[cm.id]; return null; }
      if (!LANDING[id] || !here(L, id) || !fk(L, id)) return 'They are not on the landing.';
      if (STAY[id]) return STAY[id];
      return fk(L, id).v < 10 ? `${LANDING[id].first} does not trust you enough to ask.` : null;
    },
    run(L, id) {
      const s = L.s, C = cur(L), cm = cellmate(L), mine = id === 'mate', who = mine ? cm.id : id;
      const bond = mine ? (cm.m ? cm.m.bond : 20) : fk(L, id).v;
      // (Somebody who does not much like you may tell Mr Hobbs instead.)
      if (bond < 30 && L.chance(0.25)) { C.esc.seen = Math.min(100, C.esc.seen + 40); if (!mine) warm(L, id, -10); return `${L.g2MateName(who)} listens, says nothing, and the next morning Mr Hobbs is very interested in your wall. Somebody has talked.`; }
      if (!L.chance(clampN(0.3 + bond / 100, 0.15, 0.95))) return `${L.g2MateName(who)} thinks about it for a whole night, and says no. “Not with my luck,” ${mine ? 'he says' : 'he says'}. “And not with yours.”`;
      C.esc.mate = who;
      return `${L.g2MateName(who)} spits on his hand and holds it out. “When?” ${who === 'moss' ? 'Old Moss has been over three walls in his time. “Leave the corner by the bins to me,” he says.' : who === 'tiny' ? 'Tiny could lift you over the wall on his own, he says, and you believe him.' : 'You shake on it.'}`;
    },
  }));

  // ---- the turn of the season --------------------------------------------------------------

  hooks.season.push((L, lines, jailed) => {
    const s = L.s, G = s.gaol2, C = G.cur;
    if (!jailed || !C || !s.gaol) return;
    // The record of the season: worked, studied, quiet, trouble, or the block.
    const u = s.use, m = s.gaol.inSol ? 'b' : u.trouble ? 't' : u.g2shift ? 'w' : u.g2study || u.g2Group ? 's' : 'q';
    C.rec += m;
    G.n.seasons++;
    // A season off work is noticed.
    if (C.job && !u.g2shift && !s.gaol.inSol) C.job.perf = Math.max(0, C.job.perf - 4);
    // The Tin's business, if it is yours now.
    if (C.tin) {
      if (L.chance(0.12)) { C.tin = false; L.extra(1); L.behave(-15); L.g2Sack('a cell search'); L.note('Lost the Tin’s business to a cell search, and a season was added to the sentence.'); L.say('🥫', 'A cell search: the Tin’s business is gone, and a season is added', 'bad'); } else {
        const n = L.int(15, 30) * 10;
        L.cash(n); lines.push(['The Tin’s business, on B wing', n]); L.respect(2); L.behave(-2);
      }
    }
    C.esc.seen = Math.max(0, C.esc.seen - 6);
  });

  hooks.late.push((L, jailed) => {
    const s = L.s, G = s.gaol2;
    if (s.dead) return;
    if (G.run && !s.run) G.run = null;
    if (s.gaol && G.cur) { gaolTurn(L); return; }
    if (s.run && G.run) { runTurn(L); return; }
    if (G.later.length && !s.gaol && !s.pend.length) {
      const i = G.later.findIndex((c) => c.t <= s.t);
      if (i >= 0) { const c = G.later.splice(i, 1)[0]; L.queue(c.id, c.x || null); }
    }
  });

  // A card of ours, inside: counted, so that it is not dealt again this sentence.
  const put = (L, id, x = null) => { const C = cur(L); C.seen[id] = (C.seen[id] || 0) + 1; C.last = L.s.t; L.queue(id, x); return true; };
  const year = (L) => Math.floor(L.s.t / 4);

  function gaolTurn(L) {
    const s = L.s, G = s.gaol2, C = G.cur, q = s.gaol;
    // The old cards: once a sentence each.
    for (const id of Object.keys(C.old)) s.cd[id] = s.t;
    // Going to the block next season: the job does not wait for you.
    if (q.sol && C.job) {
      C.job.perf = Math.max(0, C.job.perf - 25);
      if (C.job.r > 0 && L.chance(0.5)) { C.job.r--; C.job.n = 0; }
      if (C.job.perf < 20) L.g2Sack('a spell in the block');
    }
    // A visiting order sent this season: they come, or they do not.
    if (C.vo) {
      const p = L.person(C.vo.p), seen = p ? C.vis[p.id] || 0 : 0;
      C.vo = null;
      if (p) {
        const come = clampN(0.3 + p.bond / 90 + (KIN.includes(p.kind) ? 0.15 : 0) - seen * 0.04, 0.1, 0.95);
        if (L.chance(come)) put(L, 'g2Visit', { p: p.id });
        else {
          L.bond(p, -1); L.joy(-2);
          L.say('🪑', `${p.name} did not come to the visiting hall`, 'bad');
          L.note(`Sent ${p.name} a visiting order. ${p.sex === 'm' ? 'He' : 'She'} did not come.`);
        }
      }
    }
    // The first season: the cellmate and the gate are enough (heists.js deals those).
    if (s.t - C.t <= 1) return;
    if (s.pend.length >= 3) return;
    // What cannot wait (one of these a season at most, and then perhaps a story as well).
    const urgent = () => {
      if (s.chap && s.chap.dusk && !C.f.mercy) { C.f.mercy = 1; return put(L, 'g2Mercy'); }
      if (C.reply && C.reply.t < s.t) { const p = L.person(C.reply.p); C.reply = null; if (p) return put(L, 'g2Reply', { p: p.id }); }
      // (This turn has not counted its season yet: the board sits at the next turn, and not at this one.)
      if (q.left > 2 && !sits(q, q.served + 1, s.t) && sits(q, q.served + 2, s.t + 1) && C.f.prepAt !== s.t) { C.f.prepAt = s.t; return put(L, 'g2Prep'); }
      for (const id of C.here) {
        const p = fk(L, id);
        if (p && !p.gone && !LANDING[id].lifer && p.out != null && p.out <= s.t && p.met != null) return put(L, 'g2Bye', { k: id });
      }
      const pt = L.partner();
      if (pt && pt.bond < 30 && q.served >= 3 && !C.f.fade) { C.f.fade = 1; return put(L, 'g2Fade', { p: pt.id }); }
      return false;
    };
    const busy = urgent() || s.pend.some((e) => e.id === 'g2Visit');
    // Otherwise, now and then, something: somebody's story, the job, or a day that is not like the others.
    // (Not in the last season: by then your head is outside already.)
    if (q.left <= 2 || s.pend.length >= 2 || !L.chance(busy ? 0.4 : 0.8)) return;
    const pool = [];
    const add = (w, id, x = null) => { if (w > 0) pool.push([w, id, x]); };
    for (const id of C.here) {
      const p = fk(L, id), arc = ARCS[id];
      if (!arc) continue;
      const st = p ? p.st : 0;
      if (st >= arc.length || (p && p.gone)) continue;
      if (p && p.at != null && s.t - p.at < GAP) continue;
      const card = EV[arc[st]];
      if (card.due && !card.due(L, p || { v: 0, st: 0, f: {} })) continue;
      add(3, arc[st], { k: id });
    }
    const j = C.job, seen = (id) => !!C.seen[id];
    if (j && j.r >= 1 && !C.plan.work && !C.f.offer && L.g2JobOk(JOBS[j.k].out.c)) add(4, 'g2Offer');
    if (j && !seen(`g2J_${j.k}`) && j.n + j.r * 3 >= 3) add(2, `g2J_${j.k}`);
    if (C.chap >= 3 && !C.f.ca1) add(5, 'g2ChapAsk');
    else if (C.chap >= 6 && !C.f.ca2 && (!C.plan.vouch || !L.g2HomeOk())) add(5, 'g2ChapAsk');
    if (C.change >= 60 && !G.f.sorry && !seen('g2Sorry')) add(4, 'g2Sorry');
    if (q.served >= 4 && !seen('g2Year')) add(6, 'g2Year');
    const longAt = [12, 24, 40, 60].filter((n) => q.served >= n).length;
    if (longAt > C.long) add(4, 'g2Long');
    if (L.season === 3 && C.xmasAt !== year(L)) add(6, 'g2Xmas');
    if (!seen('g2Window') && q.served >= 2) add(1, 'g2Window');
    if (!seen('g2Rovers') && (L.season === 1 || L.season === 2)) add(1.5, 'g2Rovers');
    if (!seen('g2Play') && q.served >= 3) add(1.2, 'g2Play');
    if (!seen('g2Hobbs')) add(1, 'g2Hobbs');
    if (!seen('g2Flu') && L.season === 3) add(1, 'g2Flu');
    if (!seen('g2News') && q.served >= 2) add(1.3, 'g2News');
    if (C.esc.seen >= 40 && q.dig > 0 && !seen('g2Spin')) add(3, 'g2Spin');
    if (!pool.length) return;
    let r = L.rnd() * pool.reduce((a, [w]) => a + w, 0), pick = pool[0];
    for (const it of pool) { pick = it; r -= it[0]; if (r < 0) break; }
    const [, id, x] = pick;
    if (x && x.k) { const p = meetFolk(L, x.k); p.at = s.t; if (EV[id].dealt) EV[id].dealt(L, p); }
    if (id === 'g2Xmas') C.xmasAt = year(L);
    if (id === 'g2Long') C.long = longAt;
    if (id === 'g2Offer') C.f.offer = 1;
    if (id === 'g2ChapAsk') { if (!C.f.ca1) C.f.ca1 = 1; else C.f.ca2 = 1; }
    put(L, id, x);
  }

  // Over the wall: a season at a time, until they find you or stop looking.
  function runTurn(L) {
    const s = L.s, R = s.gaol2.run;
    R.n++;
    // (The first nights out: where to sleep.)
    if (R.n === 1) { L.queue('g2Lam0'); return; }
    const p = R.hp != null ? L.person(R.hp) : null;
    if (R.hid === 'kin' && p) L.bond(p, -3);
    if (R.hid === 'caves') { L.hp(-2, 'a winter in a cave'); L.joy(-2); }
    if (R.hid === 'room') { if (s.cash + s.bank >= 300) L.cash(-300); else R.hid = null; }
    if (s.pend.length) return;
    if (R.n === 2 && !R.said.paper) { R.said.paper = 1; L.queue('g2Lam1'); return; }
    if (R.n >= 3 && R.mate && !R.said.mate) { R.said.mate = 1; L.queue('g2Lam2'); return; }
    if (R.n >= 4 && !R.said.home && (L.partner() || L.kids().length)) { R.said.home = 1; L.queue('g2Lam3'); }
  }

  // ---- what other things do --------------------------------------------------------------

  hooks.chose.push((L, id, x, i) => {
    const s = L.s, C = s.gaol2.cur;
    if (!C || !s.gaol) return;
    if (OLD.includes(id)) C.old[id] = 1;
    // The governor's roses (events.js) are the gardens, if you take them.
    if (id === 'gGarden' && i === 0 && (!C.job || C.job.k !== 'gardens')) { C.job = { k: 'gardens', r: L.g2Start('gardens'), n: 0, perf: 55 }; C.moved = s.t; }
  });
  // (A sitting in the education wing goes on the record of the season.)
  hooks.acted.push((L, id) => { if (id === 'gStudy' && L.s.gaol) L.s.use.g2study = 1; });
  hooks.year.push((L) => { const C = L.s.gaol2.cur; if (C && L.s.gaol && !L.s.dead) put(L, 'g2Bday'); });
  hooks.epitaph.push((L, out) => {
    const s = L.s, G = s.gaol2, He = s.sex === 'f' ? 'She' : 'He', bits = [];
    if (G.f.reader) bits.push('taught a man to read');
    if (G.f.quashed) bits.push('helped a man win his appeal');
    if (G.f.top) bits.push('rose as high as a prisoner can');
    if (G.f.peace) bits.push('made peace on B wing');
    if (bits.length) out.push(`In Starling Gaol ${He.toLowerCase()} ${bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}` : bits[0]}.`);
  });

  // ---- the cards ----
  // Taken on outside, through a plan made inside (as the job board would, and at a rung above the
  // bottom if the promise was for one and you are up to it).
  const hire = (L, c, r) => {
    const s = L.s, was = s.job, car = CAREERS[c];
    const said = A.apply.run(L, c);
    const j = s.job;
    if (r > j.r && car.rungs[r] && L.needs(car.rungs[r].need).every((n) => n.ok)) { j.r = r; s.worked[c] = Math.max(s.worked[c] ?? 0, r); }
    if (j.r > 0 && L.careerJoin && !(was && was.c === c)) L.careerJoin(c, j.r, 0);
    if (s.careers) s.careers.job = { c, r: j.r };
    return `${was ? 'You hand in your notice. ' : ''}${j.r > L.startRung(c) ? `You start as ${car.rungs[j.r].title}, as promised.` : said}`;
  };
  const EV = {};
  const cards = gaolTales({ JOBS, LANDING, BOSS_SAYS, cur, fk, meetFolk, warm, here, cellmate, clampN, first, KIN, SHIFTS, year, hire });
  for (const c of cards) EV[c.id] = c;
  addEvents(cards);

  Object.assign(TROPHIES, {
    g2Top: { name: 'Trusted with the keys', icon: '🗝️', desc: 'Rise to the top of a job in Starling Gaol.', test: (L) => !!L.s.gaol2 && !!L.s.gaol2.f.top },
    g2Reader: { name: 'Dear Daddy', icon: '✏️', desc: 'Teach a man on the landing to read.', test: (L) => !!L.s.gaol2 && !!L.s.gaol2.f.reader },
    g2Quashed: { name: 'Unsafe', icon: '⚖️', desc: 'Help a man on the landing win his appeal.', test: (L) => !!L.s.gaol2 && !!L.s.gaol2.f.quashed },
    g2Planned: { name: 'A plan for outside', icon: '🗺️', desc: 'Walk out on parole with somewhere to live, work, and somebody to speak for you.', test: (L) => !!L.s.gaol2 && !!L.s.gaol2.f.planned },
    g2Peace: { name: 'The pool table', icon: '🎱', desc: 'Make peace between the Bay lads and the Kettleby lot.', test: (L) => !!L.s.gaol2 && !!L.s.gaol2.f.peace },
  });
}
