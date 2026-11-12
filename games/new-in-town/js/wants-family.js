// New in Town: the cards about your children, your parents and your
// friends (the rules that bring them up are in wants.js). Children are
// asked about at each stage of growing up, and what you choose shapes
// their skills and what becomes of them; parents grow old and need looking
// after; friends ask for money, for help, for a speech, and remember who
// came round at three in the morning.

import { money } from './data.js';
import {
  clamp, he, He, him, his, His, first, P, rec, been, price, fee, busy, perf, grow, young, tr, ti, trait, spareRooms,
  HOPES, PATHS, EXAM, CARE, GRADUATE,
} from './wants-lib.js';

const kid = (lo, hi) => (L, x) => { const p = L.person(x && x.p); return !!p && p.kind === 'child' && p.age >= lo && p.age <= hi && !L.s.gaol; };
const par = (L, x) => { const p = L.person(x && x.p); return !!p && p.kind === 'parent' && !L.s.gaol; };
const pal = (L, x) => { const p = L.person(x && x.p); return !!p && p.kind === 'friend' && !L.s.gaol; };
const top = (p) => Object.keys(p.st || { smarts: 1 }).sort((a, b) => p.st[b] - p.st[a])[0];
// Somebody of yours who could have the baby: a parent who is well, and fond of you.
export const granny = (L) => L.s.people.find((q) => q.kind === 'parent' && q.bond >= 40 && !(rec(L, q).need > 0)) || null;
const owe = (L, f, n) => { const r = rec(L, f); r.owe = Math.max(0, (r.owe || 0) + n); };
// A brother or sister who might share the load.
const sib = (L) => L.siblings().filter((q) => q.bond >= 50).sort((a, b) => b.bond - a.bond)[0] || null;
const youSaid = (L) => (L.s.sex === 'f' ? 'Mum' : 'Dad');

// What a child grown up does, and whether it is what they said they would do at six.
export function settle(L, p, job) {
  const r = rec(L, p);
  if (job) p.job = job;
  if (r.hope && p.job === r.hope[1] && !r.dream) {
    r.dream = 1; L.s.wants.n.hopes++; L.joy(4);
    L.note(`${first(p)} grew up to be ${r.hope[0].replace(/, like .*$/, '').replace(/, in a .*$/, '')}, just as ${he(p)} always said.`, 'big');
    L.say('🌟', `${first(p)} did what ${he(p)} said ${he(p)} would`, 'good');
  }
}
// A degree leads somewhere that wants one.
function degreeJob(L, p, r) {
  if (r.hope && GRADUATE.includes(r.hope[1])) return r.hope[1];
  const k = top(p);
  return { smarts: ['medicine', 'law', 'tech', 'finance'], charm: ['politics', 'law'], craft: ['tech', 'teaching'], fitness: ['teaching', 'medicine'] }[k][p.id % 2] || 'teaching';
}

export const FAMILY_CARDS = [
  // ---- children ----
  {
    id: 'wantsNursery', icon: '🧸', title: (L, x) => `Somebody to mind ${first(P(L, x))}`, ok: kid(0, 4),
    text: (L, x) => { const p = P(L, x), g = granny(L); return `${first(p)} is into everything: cupboards, plant pots, the cat. The Bayview Nursery has a place three days a week, for ${money(fee(L, 600))} a season, which would give you some of your days back.${g ? ` ${first(g)} has offered to have ${him(p)} for nothing, and has already bought a stairgate.` : ''}`; },
    opts: [
      { t: 'The Bayview Nursery', run(L, x) { const p = P(L, x); rec(L, p).care = 'nursery'; grow(p, 'charm', 2); return `${first(p)} cries for a week at the door, then not at all, and comes home with paint in places paint should not go.`; } },
      { t: (L, x) => `${first(granny(L))} will have ${him(P(L, x))}`, show: (L) => !!granny(L), run(L, x) { const p = P(L, x), g = granny(L); rec(L, p).care = 'gran'; L.bond(g, 6); grow(p, 'smarts', 1); grow(p, 'charm', 1); return `${first(p)} comes back from ${first(g)}’s three days a week fatter, happier and knowing all the words to songs from 1958.`; } },
      { t: 'Keep them at home with you', run(L, x) { const p = P(L, x); rec(L, p).care = 'home'; L.bond(p, 6); grow(p, 'craft', 2); grow(p, 'smarts', 1); return 'Playdough, puddles, the swings, the ducks, the swings again. You are exhausted by eleven, every day, and would not swap it.'; } },
    ],
  },
  {
    id: 'wantsSchool', icon: '🎒', title: 'The first day', ok: kid(3, 6),
    text: (L, x) => { const p = P(L, x); return `${first(p)} has a new lunchbox, a coat with ${his(p)} name sewn in, and a great many questions about whether there will be a dragon. Which school is it to be?`; },
    opts: [
      { t: 'The village school, and walk them to the gate', run(L, x) { const p = P(L, x); p.priv = false; busy(L, 1); L.bond(p, 6); been(L, p, `You walked ${first(p)} to the gate on the first day of school.`); return `${first(p)} lets go of your hand at the gate, then runs back for one more hug. Then ${he(p)} is gone, and you stand there like a lemon.`; } },
      { t: 'St Wren’s, in a blazer two sizes too big', run(L, x) { const p = P(L, x); p.priv = true; L.bond(p, 3); return `${first(p)} looks very small in the blazer, and very proud. The fees are $2,500 a season, and the hat alone cost forty dollars.`; } },
      { t: 'Let them walk in on their own', run(L, x) { const p = P(L, x); p.priv = false; L.bond(p, 2); grow(p, 'charm', 2); return `${first(p)} does not look back once. You are very proud. You are also, a little, crushed.`; } },
    ],
  },
  {
    id: 'wantsBully', icon: '🧥', title: 'A torn blazer', ok: kid(6, 12),
    text: (L, x) => { const p = P(L, x); return `${first(p)} has come home with a torn blazer and a scraped knee, and says ${he(p)} fell over. ${He(p)} has fallen over three times this month. A big lad called Kyle, it turns out, is the one doing the pushing.`; },
    opts: [
      { t: 'Go up to the school', check: ['charm', 45], run(L, x, win) { const p = P(L, x); if (win) { L.bond(p, 6); grow(p, 'charm', 2); return 'The head teacher is on it by Monday. Kyle is moved to another table, and later, to a better attitude.'; } L.bond(p, 2); L.joy(-2); return 'The head teacher promises to "keep an eye on it". The eye is not kept. It stops in the end, on its own, as these things sometimes do.'; } },
      { t: 'Teach them to stand up for themselves', odds: () => 0.7, run(L, x, win) { const p = P(L, x); grow(p, 'fitness', 4); L.bond(p, 4); return win ? 'Boxing club on Tuesdays, and a lot of talk about standing tall. Kyle tries it once more, and thinks better of it.' : `It ends in a scuffle by the bike sheds, a black eye each, and a letter home. ${first(p)} is secretly delighted.`; } },
      { t: 'Invite Kyle round for tea', odds: (L) => (trait(L, 'kind') ? 0.85 : 0.55), run(L, x, win) { const p = P(L, x); if (win) { grow(p, 'charm', 3); L.bond(p, 4); L.karma(1); return `Kyle eats four fish fingers and turns out to be lonely. He and ${first(p)} are thick as thieves by the summer.`; } L.bond(p, -2); return 'Kyle eats four fish fingers and breaks the telly. It does not stop.'; } },
      { t: ti('hothead', 'Have a word with Kyle’s father'), show: tr('hothead'), odds: () => 0.5, run(L, x, win) { const p = P(L, x); L.karma(-1); if (win) { L.bond(p, 6); return 'Kyle’s father turns out to be a reasonable man under all the shouting. So do you. It stops.'; } L.bond(p, -2); return `There is shouting in the street, and ${first(p)} has to change schools in the end.`; } },
      { t: 'Tell them to ignore it', run(L, x) { const p = P(L, x); L.bond(p, -6); return `It does not stop. ${first(p)} stops telling you things, which is worse.`; } },
    ],
  },
  {
    id: 'wantsCrowd', icon: '🌃', title: 'Sal’s lads', ok: kid(12, 17),
    text: (L, x) => { const p = P(L, x); return `${first(p)} has started hanging round the harbour after dark with some of Sal’s lads: older boys in good trainers who never seem to be at school and always seem to have money. A neighbour mentioned it. Twice.`; },
    opts: [
      { t: 'Go down to the harbour and fetch them home', check: ['charm', 45], run(L, x, win) { const p = P(L, x), r = rec(L, p); if (win) { L.bond(p, 2); return `${first(p)} is mortified, and furious, and home by nine for the rest of the year.`; } L.bond(p, -8); r.bad = (r.bad || 0) + 1; return `You march down there in your slippers. ${first(p)} will never, ever forgive you, and goes back the next night out of spite.`; } },
      { t: 'Find them a Saturday job at Dobbs & Daughter', run(L, x) { const p = P(L, x), r = rec(L, p); grow(p, 'craft', 3); grow(p, 'charm', 1); L.bond(p, 4); r.jess = 1; return `Jess Dobbs needs somebody to sweep up and make the tea. Within a month ${first(p)} is changing oil, and has opinions about gaskets.`; } },
      { t: 'Take them to meet Mr Hobbs at the gaol', odds: () => 0.7, run(L, x, win) { const p = P(L, x), r = rec(L, p); if (win) { L.bond(p, -2); grow(p, 'smarts', 1); return `Mr Hobbs shows ${first(p)} a cell, the slop bucket and the visiting room, without a word. ${first(p)} never goes near Sal’s lads again.`; } r.bad = (r.bad || 0) + 1; return `${first(p)} thinks Mr Hobbs is a laugh, and says so, at length, to Sal’s lads.`; } },
      { t: 'Leave it: you did the same at that age', run(L, x) { const p = P(L, x), r = rec(L, p); L.bond(p, 2); r.bad = (r.bad || 0) + 2; return 'You say nothing. It may be nothing.'; } },
    ],
  },
  {
    id: 'wantsNick', icon: '🚔', title: 'A knock at midnight', ok: kid(12, 18),
    text: (L, x) => { const p = P(L, x); return `A constable is on the doorstep at midnight, with ${first(p)} by the collar. ${He(p)} was caught with Sal’s lads, and a van full of somebody else’s outboard motors.`; },
    opts: [
      { t: 'Pay the fine, and have it out at home', cost: 600, run(L, x) { const p = P(L, x), r = rec(L, p); r.bad = 0; r.sal = 0; L.bond(p, -4); grow(p, 'smarts', 1); return 'The fine is the easy part. The talk at the kitchen table goes on until two, and some of it goes in.'; } },
      { t: 'Stand by them in front of the magistrate', run(L, x) { const p = P(L, x), r = rec(L, p); r.bad = 0; r.sal = 0; busy(L, 1); L.bond(p, 6); return `${first(p)} gets a warning, and a long look from the magistrate, and holds your hand on the steps outside, which ${he(p)} has not done since ${he(p)} was eight.`; } },
      { t: 'Let them stew in a cell overnight', run(L, x) { const p = P(L, x), r = rec(L, p); r.bad = 0; r.sal = 0; L.bond(p, -8); return `A night on a plastic mattress, with a drunk singing next door. ${first(p)} comes out very quiet, and stays that way.`; } },
      { t: 'Ask Sal to look after them', show: (L) => L.s.n.crimes >= 3, run(L, x) { const p = P(L, x), r = rec(L, p); r.sal = 2; L.karma(-3); L.bond(p, 4); return `Sal says ${first(p)} has promise. You are not sure whether to be proud. The charges go away.`; } },
    ],
  },
  {
    id: 'wantsMocks', icon: '📚', title: 'The mocks', ok: kid(14, 16),
    text: (L, x) => { const p = P(L, x), s = p.st.smarts; return `${first(p)}’s mock exams have come back, and the teacher would like a word. ${s >= 50 ? 'Clever, she says, and coasting.' : s >= 35 ? 'Bright enough, she says, but not working.' : 'Struggling, she says, and too proud to ask for help.'} The real ones are next summer. Reading together helps, she adds, more than people think.`; },
    opts: [
      { t: 'Pay for a tutor', cost: (L) => price(L, 800), run(L, x) { const p = P(L, x), r = rec(L, p); r.rev = (r.rev || 0) + 2; grow(p, 'smarts', 4); return `A retired maths teacher called Mrs Penhallow comes on Wednesdays. ${first(p)} hates her for a month, then quotes her for the rest of ${his(p)} life.`; } },
      { t: 'Sit with them every evening', check: ['smarts', 40], run(L, x, win) { const p = P(L, x), r = rec(L, p); busy(L, 1); L.bond(p, 6); if (win) { r.rev = (r.rev || 0) + 2; grow(p, 'smarts', 3); L.gain('smarts', 0.5); return 'Flash cards on the fridge, past papers at the kitchen table, and you remember more of it than you expected.'; } r.rev = (r.rev || 0) + 1; grow(p, 'smarts', 1); return `You have forgotten all of it, and are told so. But you are there, every evening, and ${first(p)} notices.`; } },
      { t: 'Promise a reward for good results', run(L, x) { const p = P(L, x), r = rec(L, p); r.rev = (r.rev || 0) + 1; r.bribe = 1; return `"How much?" says ${first(p)}, instantly. Negotiations go on into the night.`; } },
      { t: 'Leave them to it: it is their life', run(L, x) { L.bond(P(L, x), 2); return 'You do not mention exams once. Neither, worryingly, does anybody else.'; } },
    ],
  },
  {
    id: 'wantsResults', icon: '✉️', title: 'The envelope', ok: (L, x) => kid(15, 17)(L, x) && rec(L, P(L, x)).ex != null,
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return `Results day. ${first(p)} opens the envelope in the kitchen with ${his(p)} eyes shut, and then opens them. ${He(p)} has ${EXAM[r.ex]}.`; },
    opts: [
      { t: 'Fish and chips on the sea wall, to celebrate', show: (L, x) => rec(L, P(L, x)).ex >= 2, run(L, x) { const p = P(L, x); L.bond(p, 6); L.joy(6); paid(L, p); return 'Fish and chips on the sea wall, with the envelope weighed down by the salt. A gull steals a chip and nobody minds.'; } },
      { t: 'Tell them you knew they would', show: (L, x) => rec(L, P(L, x)).ex >= 2, run(L, x) { const p = P(L, x); L.bond(p, 4); L.joy(4); paid(L, p); return `"No you didn’t," says ${first(p)}, delighted.`; } },
      { t: 'Tell them it is not the end of the world', show: (L, x) => rec(L, P(L, x)).ex <= 1, run(L, x) { const p = P(L, x); L.bond(p, 8); return 'It is not. You have known people who failed everything at sixteen and run half of Starling Bay now. You name them.'; } },
      { t: 'Resits, and a tutor', show: (L, x) => rec(L, P(L, x)).ex <= 1, cost: (L) => price(L, 600), run(L, x) { const p = P(L, x), r = rec(L, p); r.ex += 1; grow(p, 'smarts', 3); L.bond(p, -2); return `${first(p)} groans, and does them, and does better.`; } },
      { t: 'Say they could have done better', run(L, x) { const p = P(L, x); L.bond(p, -8); grow(p, 'smarts', 2); return `${He(p)} goes upstairs without a word. ${He(p)} works much harder next year, and you are never quite sure whether it was because of you or to spite you.`; } },
    ],
  },
  {
    id: 'wantsCar', icon: '🚗', title: 'Can I learn to drive?', ok: kid(16, 18),
    text: (L, x) => { const p = P(L, x); return `${first(p)} is seventeen, and has been leaving pictures of cars around the house where you will find them. ${He(p)} would like to learn to drive. Jess Dobbs gives lessons, up the hill.`; },
    opts: [
      { t: 'Pay for lessons with Jess', cost: (L) => price(L, 600), run(L, x) { const p = P(L, x); rec(L, p).drives = 1; grow(p, 'craft', 2); L.bond(p, 5); return `Jess says ${first(p)} is "a natural, mostly". ${He(p)} passes first time, and drives you to the shops very slowly, indicating at everything.`; } },
      { t: 'Teach them yourself', show: (L) => typeof L.motorUsable === 'function' && L.motorUsable(), odds: () => 0.8, run(L, x, win) { const p = P(L, x); rec(L, p).drives = 1; busy(L, 1); L.bond(p, 10); if (win) return 'Sunday mornings in the empty car park behind the station. You only shout twice, and one of those was at a pigeon.'; L.cash(-300); return 'It goes well until the bins. The bins cost you $300, and the neighbour still mentions it.'; } },
      { t: 'Buy them a little car of their own', cost: (L) => price(L, 4000), odds: () => 0.8, run(L, x, win) { const p = P(L, x); rec(L, p).drives = 1; L.bond(p, 12); grow(p, 'craft', 1); if (win) return `A twelve-year-old hatchback with a dent, and ${first(p)} would not swap it for a sports car.`; return `Three weeks later it is in a hedge on the Kettleby road. ${first(p)} walks away without a scratch, and with a great deal more respect for hedges.`; } },
      { t: 'When you can pay for it yourself', run(L, x) { const p = P(L, x); L.bond(p, -4); grow(p, 'craft', 1); grow(p, 'fitness', 1); return `${first(p)} gets a paper round and a job washing up at the Gull, and passes ${his(p)} test a year later with ${his(p)} own money. ${He(p)} mentions this often.`; } },
    ],
  },
  {
    id: 'wantsNext', icon: '🧭', title: 'What next?', ok: kid(16, 17),
    text: (L, x) => { const p = P(L, x), r = rec(L, p), ex = r.ex == null ? 1 : r.ex; return `${first(p)} is seventeen, and the forms have come home: university, an apprenticeship, a job, or a year with a rucksack. ${ex >= 2 ? `With ${his(p)} results, the university in the city would have ${him(p)}.` : ex === 1 ? `The university might take ${him(p)}, at a push.` : 'University is not likely, with those results.'} ${He(p)} wants to know what you think, and is pretending not to.`; },
    opts: [
      { t: 'University in the city', why: (L, x) => (rec(L, P(L, x)).ex === 0 ? 'Not with those results.' : null), run(L, x) { const p = P(L, x), r = rec(L, p); r.path = 'uni'; r.sal = 0; L.bond(p, 4); grow(p, 'smarts', 2); return `A personal statement written eleven times, an interview in a borrowed jacket, and a place. ${He(p)} goes next year.`; } },
      { t: 'An apprenticeship with Jess Dobbs at the garage', run(L, x) { const p = P(L, x), r = rec(L, p); r.path = 'app-trades'; r.sal = 0; L.bond(p, r.jess ? 6 : 3); grow(p, 'craft', 3); return r.jess ? `Jess says she had been wondering when you would ask. So had ${first(p)}.` : `Jess looks ${first(p)} up and down, hands ${him(p)} a spanner, and says "We’ll see." It is a yes.`; } },
      { t: 'A start on Captain Quinn’s boats', run(L, x) { const p = P(L, x), r = rec(L, p); r.path = 'app-sea'; r.sal = 0; L.bond(p, 3); grow(p, 'fitness', 3); return `Captain Quinn says "Hm." ${first(p)} decides it was a welcome, and is probably right.`; } },
      { t: 'The kitchen at the Gull', run(L, x) { const p = P(L, x), r = rec(L, p); r.path = 'app-kitchen'; r.sal = 0; L.bond(p, 3); grow(p, 'craft', 2); grow(p, 'charm', 1); return 'The head chef shouts at everybody, and is the kindest man in Starling Bay. He takes one look at the way ' + first(p) + ' holds a knife, and nods.'; } },
      { t: 'A year away first, with a rucksack', cost: (L) => price(L, 2500), run(L, x) { const p = P(L, x), r = rec(L, p); r.path = 'gap'; L.bond(p, 6); grow(p, 'charm', 4); return `${first(p)} spreads a map on the kitchen floor and draws a line through nine countries. You draw a second line, home, at the end.`; } },
      {
        t: (L, x) => `Whatever ${he(P(L, x))} wants`,
        run(L, x) {
          const p = P(L, x), r = rec(L, p), k = top(p), ex = r.ex == null ? 1 : r.ex;
          r.path = (k === 'smarts' || k === 'charm') && ex >= 1 ? 'uni' : k === 'fitness' ? 'app-sea' : k === 'craft' ? 'app-trades' : 'work';
          if (r.path !== 'work') r.sal = 0;
          L.bond(p, 8);
          return `"Really?" says ${first(p)}, and goes away and thinks about it, and comes back with ${{ uni: 'a university prospectus', 'app-sea': 'a berth on Captain Quinn’s boats', 'app-trades': 'an apprenticeship at Dobbs & Daughter', work: 'a job, already' }[r.path]}. It suits ${him(p)}.`;
        },
      },
    ],
  },
  {
    id: 'wantsEighteen', icon: '🎂', title: 'Eighteen', ok: (L, x) => kid(17, 19)(L, x),
    text: (L, x) => {
      const p = P(L, x), r = rec(L, p), f = first(p);
      if (r.sal === 2) return `${f} is eighteen, and has started doing "a bit of work" for Sal. ${He(p)} has a new phone and a good coat, and does not say where either came from.`;
      return {
        'app-trades': `${f} is eighteen, and starts at Dobbs & Daughter on Monday. Jess says tools are ${his(p)} own business. Len says ${he(p)} will need a flask.`,
        'app-sea': `${f} is eighteen, and signs on with Captain Quinn’s boats at five o’clock on Monday morning. ${He(p)} has bought a woolly hat, and is very serious about it.`,
        'app-kitchen': `${f} is eighteen, and starts in the kitchen at the Gull on Monday, at the bottom, washing pans. ${He(p)} has bought ${his(p)} own knives.`,
        gap: `${f} is eighteen, and flies out on Tuesday with a rucksack bigger than ${he(p)} is, and a list of your rules in the front pocket.`,
      }[r.path] || `${f} is eighteen, and has a job: ${p.job ? `starting at the bottom, as ${L.jobOf(p).toLowerCase()}` : 'and a plan'}. ${He(p)} has worked it all out.`;
    },
    opts: [
      { t: 'Buy them a proper start: the tools, the kit, the lot', show: (L, x) => rec(L, P(L, x)).sal !== 2, cost: (L) => price(L, 600), run(L, x) { const p = P(L, x); L.bond(p, 8); grow(p, top(p), 3); return `${first(p)} lays it all out on the bed and looks at it for a long time.`; } },
      { t: 'A good breakfast and a lift on the first day', show: (L, x) => rec(L, P(L, x)).sal !== 2, run(L, x) { const p = P(L, x); L.bond(p, 4); return `Bacon sandwiches, and the radio on, and ${first(p)} pretending not to be nervous all the way there.`; } },
      { t: 'Have it out with Sal', show: (L, x) => rec(L, P(L, x)).sal === 2, check: ['charm', 55], run(L, x, win) { const p = P(L, x), r = rec(L, p); if (win) { r.sal = 0; p.job = { smarts: 'tech', fitness: 'trades', charm: 'retail', craft: 'trades' }[top(p)]; L.bond(p, 4); return `Sal hears you out in the back room, then laughs, and lets ${first(p)} go. "Your ${youSaid(L).toLowerCase()} has more nerve than you, kid." ${first(p)} finds honest work by the summer.`; } L.bond(p, -6); L.hp(-3); return 'Sal hears you out in the back room, then has you shown the door, quite firmly. ' + first(p) + ' keeps working for him.'; } },
      { t: (L, x) => `${He(P(L, x))} can stand on ${his(P(L, x))} own feet`, run(L, x) { const p = P(L, x); L.bond(p, -2); grow(p, 'charm', 1); return `${He(p)} does. ${He(p)} would have liked a bit of help, all the same.`; } },
    ],
  },
  {
    id: 'wantsGrad', icon: '🎓', title: (L, x) => (rec(L, P(L, x)).path === 'uni' ? 'Graduation day' : 'Qualified'), ok: kid(19, 25),
    text: (L, x) => {
      const p = P(L, x), r = rec(L, p);
      if (r.path === 'uni') return `${first(p)} graduates on Friday, in the big hall in the city, in a gown and a hat with a tassel. ${r.paid ? `Three years of evening shifts paid for most of it, and ${he(p)} is very proud of that.` : 'You paid for every term, and would again.'}${p.st.smarts >= 70 ? ' With a first, it turns out.' : ''}`;
      return `${first(p)} has passed ${his(p)} final exams. ${{ 'app-trades': `Jess Dobbs has offered ${him(p)} a proper job, and a van with "& Daughter" crossed out and "& Co" written in.`, 'app-sea': `Captain Quinn has given ${him(p)} a berth of ${his(p)} own, and said "Good." Once.`, 'app-kitchen': `The head chef at the Gull has made ${him(p)} a chef de partie, and shouted it across the kitchen.` }[r.path] || 'There is a certificate, and a job.'}`;
    },
    opts: [
      { t: 'Be there, with a camera', cost: (L) => price(L, 150), run(L, x) { const p = P(L, x); busy(L, 1); L.bond(p, 10); L.joy(8); qualify(L, p); been(L, p, `You were there the day ${first(p)} ${rec(L, p).path === 'uni' ? 'graduated' : 'qualified'}.`); return 'You take two hundred photographs, all of them slightly blurred by you waving. It is the best day in years.'; } },
      { t: 'Send a card with money in it', cost: (L) => price(L, 300), run(L, x) { const p = P(L, x); L.bond(p, 4); qualify(L, p); return `${first(p)} rings to say thank you, and you can hear the party behind ${him(p)}.`; } },
      { t: 'You cannot get away', run(L, x) { const p = P(L, x); L.bond(p, -8); qualify(L, p); return `${He(p)} sends a photograph of ${him(p)}self holding the certificate. There is a space next to ${him(p)} where you would have been.`; } },
    ],
  },
  {
    id: 'wantsLeave', icon: '📦', title: 'Leaving home', ok: kid(18, 23),
    text: (L, x) => { const p = P(L, x); return `${first(p)} has found a room in a shared house in ${['Kettleby', 'the city', 'the old town up the hill'][p.id % 3]}, with three people ${he(p)} met on the internet and a landlord called Mr Flint. ${He(p)} moves on Saturday.`; },
    opts: [
      { t: 'Help them move, and borrow a van', run(L, x) { const p = P(L, x); busy(L, 1); L.bond(p, 8); L.gain('fitness', 0.5); been(L, p, `You moved ${first(p)} into ${his(p)} first place.`); return 'Four flights of stairs, a futon that will not bend, and a takeaway on the floor of the new room. You drive home with the van empty and a lump in your throat.'; } },
      { t: 'Pay the deposit', cost: (L) => price(L, 1000), run(L, x) { const p = P(L, x); L.bond(p, 8); return `Mr Flint counts it twice. ${first(p)} hugs you on the pavement, in front of everybody.`; } },
      { t: 'A box of tins, a saucepan and a cookbook', run(L, x) { const p = P(L, x); L.bond(p, 4); return `The saucepan is used. The cookbook is not. You find out later the tins kept ${him(p)} going all of the first winter.`; } },
      { t: 'Turn their room into a study by Sunday', run(L, x) { const p = P(L, x); L.joy(3); L.bond(p, -4); return `${first(p)} comes home for Christmas and finds a desk where ${his(p)} bed was. The look is one you will remember.`; } },
    ],
  },
  {
    id: 'wantsBack', icon: '🧳', title: 'Just for a while', ok: kid(22, 34),
    text: (L, x) => { const p = P(L, x), why = [`The job in the city has gone.`, `It is over with the person ${he(p)} was living with.`, 'The rent went up again.'][p.id % 3]; return `${first(p)} is on the doorstep with two suitcases and a houseplant. ${why} "Just for a few months," ${he(p)} says. "Until I sort myself out."`; },
    opts: [
      { t: 'Their old room is waiting', run(L, x) { const p = P(L, x), r = rec(L, p); r.back = L.s.t + 4; L.bond(p, 10); return 'The houseplant goes on the landing, the suitcases go on the bed, and by the evening it is as if ' + first(p) + ' never left, including the towels on the floor.'; } },
      { t: 'Yes, but they pay their way', run(L, x) { const p = P(L, x), r = rec(L, p); r.back = L.s.t + 4; r.rent = 1; L.bond(p, 3); grow(p, 'smarts', 1); return `${first(p)} pays rent on a Friday, in cash, with a sigh. It does ${him(p)} good, and you both know it.`; } },
      { t: 'Help them find a place of their own', cost: (L) => price(L, 1500), run(L, x) { const p = P(L, x); L.bond(p, 5); return 'A bedsit over the launderette, warm in winter and smelling of soap. You pay the first month.'; } },
      { t: 'No: they need to stand on their own feet', run(L, x) { const p = P(L, x); L.bond(p, -12); return `${He(p)} sleeps on a friend’s sofa, and does sort ${him(p)}self out, eventually. ${He(p)} does not come to you first again.`; } },
    ],
  },
  {
    id: 'wantsBackOut', icon: '🔑', title: 'A place of their own', ok: kid(22, 40),
    text: (L, x) => { const p = P(L, x); return `${first(p)} has found a place of ${his(p)} own, and a better job to pay for it. The house is going to be very quiet without the music.`; },
    opts: [
      { t: 'Help them move', run(L, x) { const p = P(L, x); rec(L, p).back = null; busy(L, 1); L.bond(p, 5); return 'You carry the same houseplant down the same stairs. It has grown.'; } },
      { t: 'Throw a leaving do', cost: (L) => price(L, 200), run(L, x) { const p = P(L, x); rec(L, p).back = null; L.bond(p, 6); L.joy(3); return 'A cake that says GOOD LUCK (AGAIN). Everybody laughs, ' + first(p) + ' loudest.'; } },
      { t: 'Turn the music up yourself', run(L, x) { rec(L, P(L, x)).back = null; L.joy(3); return 'Your own music, for once, as loud as you like.'; } },
    ],
  },
  {
    id: 'wantsChildWed', icon: '💒', title: 'Wedding bells', ok: kid(22, 45),
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return `${first(p)} is getting married to ${r.fiance}, who is ${['a nurse from Kettleby with a loud laugh', 'a quiet sort who fixes boats', 'a teacher who has already met everybody', 'an accountant, and kinder than that sounds'][p.id % 4]}. The wedding is in the summer, and there has been a lot of talk about marquees.`; },
    opts: [
      { t: 'Pay for the whole thing', cost: (L) => price(L, 8000), run(L, x) { const p = P(L, x), r = rec(L, p); r.wed = L.s.t; L.bond(p, 14); L.joy(8); been(L, p, `You gave ${first(p)} the wedding of ${his(p)} dreams.`); return 'A marquee on the cliffs, a band, a cake in four tiers, and you dancing with everybody, badly. Worth every penny.'; } },
      { t: 'Put something towards it', cost: (L) => price(L, 2500), run(L, x) { const p = P(L, x), r = rec(L, p); r.wed = L.s.t; L.bond(p, 8); L.joy(6); return `It pays for the flowers and the band. ${first(p)} cries when you give it, and again at the wedding.`; } },
      { t: 'Give the speech', check: ['charm', 45], run(L, x, win) { const p = P(L, x), r = rec(L, p); r.wed = L.s.t; if (win) { L.bond(p, 12); L.joy(6); L.fame(0.3); been(L, p, `You made the speech at ${first(p)}’s wedding.`); return `You tell the story of ${first(p)} and the school play, and the whole marquee is in tears, laughing.`; } L.bond(p, 3); return `You tell the story of ${first(p)} and the school play. ${first(p)} had hoped you would not.`; } },
      { t: 'Say you cannot afford it just now', run(L, x) { const p = P(L, x), r = rec(L, p); r.wed = L.s.t; L.bond(p, -6); return 'They have it in the village hall, with a buffet. It is lovely. You are reminded that it was lovely for some time.'; } },
    ],
  },
  {
    id: 'wantsMinding', icon: '🧸', title: (L, x) => `Thursdays with ${first(P(L, x))}`, ok: (L, x) => { const g = L.person(x && x.p); return !!g && g.kind === 'grandchild' && g.age < 5 && !L.s.gaol; },
    text: (L, x) => { const g = P(L, x), k = L.person(g.of); return `${k ? first(k) : 'Your child'} is going back to work, and asks, carefully, whether you could have little ${first(g)} on Thursdays.`; },
    opts: [
      { t: 'Every Thursday, gladly', run(L, x) { const g = P(L, x), k = L.person(g.of); L.s.wants.mind = g.id; L.bond(g, 6); if (k) L.bond(k, 6); return `Thursdays become the best day of the week. ${first(g)} learns to say your name, and to post things through the cat flap.`; } },
      { t: 'When you can', run(L, x) { const g = P(L, x), k = L.person(g.of); L.bond(g, 3); if (k) L.bond(k, 2); return 'Every other Thursday, and the odd Saturday. It works, more or less.'; } },
      { t: 'Your Thursdays are spoken for', run(L, x) { const g = P(L, x), k = L.person(g.of); if (k) L.bond(k, -5); return 'They find a childminder. You hear all about her.'; } },
    ],
  },

  // ---- parents ----
  {
    id: 'wantsFrail', icon: '🫖', title: (L, x) => `${first(P(L, x))} is not managing`, ok: par,
    text: (L, x) => {
      const p = P(L, x), r = rec(L, p), f = first(p);
      if (x.why === 'room') return `There is no longer room for ${f} at yours. Something else will have to be worked out, and soon.`;
      if (r.need >= 2) return `${f} has had another fall, and this time it was an hour before a neighbour heard. ${He(p)} needs looking after properly now, day and night.${sib(L) ? ` ${first(sib(L))} says ${he(sib(L))} will go halves on whatever it costs.` : ''}`;
      return `${f} has had a fall in the kitchen. Nothing broken, the doctor says, this time. But ${he(p)} has been forgetting things: the gas, the cat, your birthday. ${He(p)} is not managing on ${his(p)} own any more, and will not say so.${sib(L) ? ` ${first(sib(L))} says ${he(sib(L))} will go halves on whatever it costs.` : ''}`;
    },
    opts: [
      { t: (L, x) => (rec(L, P(L, x)).need >= 2 ? 'Look after them yourself' : 'Go round every day yourself'), run(L, x) { const p = P(L, x); setCare(L, p, 'you'); L.bond(p, 6); return rec(L, p).need >= 2 ? `You are there every morning and every evening, and on the phone in between. It takes most of what you have. ${first(p)} knows.` : `Shopping, pills, a hot dinner, and the crossword done together. An hour a day, more on Sundays. ${first(p)} grumbles, and looks forward to it.`; } },
      { t: (L) => `A carer to come in (${money(fee(L, CARE.carer.cost))} a season)`, why: (L, x) => (rec(L, P(L, x)).need >= 2 ? 'It needs more than a carer now.' : null), run(L, x) { const p = P(L, x); setCare(L, p, 'carer'); L.bond(p, 2); return `A carer called Wendy comes in twice a day. ${first(p)} pretends to resent her, and saves her the best biscuits.`; } },
      { t: (L) => `Seaview House (${money(fee(L, CARE.home.cost))} a season)`, run(L, x) { const p = P(L, x); setCare(L, p, 'home'); L.bond(p, -6); return `A room with a view of the bay, a hairdresser on Tuesdays and bingo on Fridays. ${first(p)} hates it for a month, and then, rather to ${his(p)} own surprise, does not.`; } },
      { t: 'Move them in with you', why: (L, x) => (spareRooms(L) < 1 ? 'You would need a spare room.' : null), run(L, x) { const p = P(L, x), pt = L.partner(); setCare(L, p, 'with'); L.bond(p, 10); if (pt && pt.kind !== 'parent') L.bond(pt, -4); L.note(`${first(p)} came to live with you.`); return `${first(p)} arrives with a suitcase, a clock and a lifetime of opinions about how you load the dishwasher.${pt ? ` ${first(pt)} is very good about it, mostly.` : ''}`; } },
      { t: (L) => `Ask ${first(sib(L))} to take a turn`, show: (L) => !!sib(L), odds: () => 0.5, run(L, x, win) { const p = P(L, x), q = sib(L); if (win) { setCare(L, p, 'sib'); L.bond(q, -3); return `${first(q)} takes ${first(p)} in for now. "Your turn next," ${he(q)} says, and means it.`; } L.bond(q, -8); rec(L, p).ask = 1; return `${first(q)} cannot, and says why at length. You will have to think again, next season.`; } },
    ],
  },
  {
    id: 'wantsLastTalk', icon: '🕯️', title: (L, x) => `${first(P(L, x))} asks for you`, ok: par,
    text: (L, x) => { const p = P(L, x); return `${first(p)} has been very tired lately, and sleeps most of the day. This afternoon ${he(p)} is awake and clear as a bell, and asks you to sit on the bed. ${He(p)} wants to tell you something.`; },
    opts: [
      { t: (L, x) => `Ask about ${his(P(L, x))} life before you were born`, run(L, x) { const p = P(L, x); rec(L, p).talk = 'story'; L.gain('smarts', 0.5); L.joy(2); const tale = L.pick(['a dance hall in 1962, and a borrowed dress', 'a summer picking fruit, and a boy with a motorbike', 'a brother nobody ever mentioned, who went to sea and did not come back', 'how the two of them met at a bus stop, in the snow']); been(L, p, `${first(p)} told you about ${tale}.`); return `${He(p)} tells you about ${tale}. You have never heard a word of it before. You hold on to every one.`; } },
      { t: (L, x) => `Tell ${him(P(L, x))} what ${he(P(L, x))} has meant to you`, run(L, x) { const p = P(L, x); rec(L, p).talk = 'said'; L.bond(p, 10); return `You say it badly, and all of it. ${first(p)} pats your hand and says, "I know, love. I always knew."`; } },
      { t: 'Make your peace about the old quarrel', show: (L, x) => P(L, x).bond < 55, run(L, x) { const p = P(L, x); rec(L, p).talk = 'peace'; L.bond(p, 20); L.karma(1); return 'Neither of you can remember, in the end, quite what it was about. You both apologise anyway, and laugh, and it is gone.'; } },
      { t: ti('bookish', 'Read to them, as they once read to you'), show: tr('bookish'), run(L, x) { const p = P(L, x); rec(L, p).talk = 'read'; L.bond(p, 8); return `The same book, the same voices for the same characters. ${first(p)} mouths the words along with you, and falls asleep smiling before the end.`; } },
      { t: 'There will be time for that', run(L, x) { rec(L, P(L, x)).talk = 'later'; return 'You talk about the weather and the bins. There is not more time, as it turns out.'; } },
    ],
  },
  {
    id: 'wantsSuitor', icon: '🎩', title: 'Somebody new', ok: par,
    text: (L, x) => { const p = P(L, x); return `${first(p)} has met somebody at the bowls club. ${x.him ? 'His' : 'Her'} name is ${x.name}, ${x.him ? 'he' : 'she'} is a retired ${x.was}, and ${x.him ? 'he' : 'she'} does magic tricks. ${first(p)} has started making an effort for the shops.`; },
    opts: [
      { t: 'Be glad for them', run(L, x) { const p = P(L, x), r = rec(L, p); r.suitor = 2; r.with = x.name; L.bond(p, 8); L.joy(3); L.note(`${first(p)} married ${x.name}, at the registry office, with a magic trick at the end.`); return `They marry at the registry office in the spring. ${x.name} produces the rings from behind the registrar’s ear, and ${first(p)} has not looked so happy in years.`; } },
      { t: ti('kind', 'Invite them both to Sunday lunch'), show: tr('kind'), run(L, x) { const p = P(L, x), r = rec(L, p); r.suitor = 2; r.with = x.name; L.bond(p, 12); L.joy(4); return `${x.name} brings a trifle and does a trick with the gravy boat. By the pudding you are on first-name terms, and by the summer you are family.`; } },
      { t: 'Ask a few questions about where their money is', check: ['charm', 45], run(L, x, win) { const p = P(L, x), r = rec(L, p); if (win) { r.suitor = 2; r.with = x.name; L.bond(p, 2); return `${x.name} turns out to have more money than ${first(p)} does, and a bad knee, and no secrets worth the name. They marry in the spring.`; } r.suitor = 2; r.with = x.name; L.bond(p, -6); return `${first(p)} hears exactly what you are asking, and does not thank you for it. They marry anyway.`; } },
      { t: 'Warn them off', run(L, x) { const p = P(L, x), r = rec(L, p); L.bond(p, -12); if (L.chance(0.5)) { r.suitor = 3; return `${first(p)} stops going to the bowls club. ${He(p)} does not mention ${x.name} again, and is lonelier for it.`; } r.suitor = 2; r.with = x.name; return `${first(p)} marries ${x.name} anyway, at the registry office, and you find out from a neighbour.`; } },
    ],
  },
  {
    id: 'wantsParentMoney', icon: '🧾', title: 'A worry', ok: par,
    text: (L, x) => {
      const p = P(L, x), f = first(p);
      return [
        `${f} has been taken in by a man who knocked on the door about the driveway. It needed doing, he said. It has cost ${him(p)} ${money(x.n)} of ${his(p)} savings, and the driveway is now a different colour and slightly lower.`,
        `${f} has won a prize draw ${he(p)} never entered, and has sent ${money(x.n)} "in fees" to a very polite man in another country to release the prize. The prize has not come. The polite man has stopped answering.`,
        `${f} lent ${money(x.n)} to the nephew of a neighbour, for "a sure thing" involving greyhounds. The greyhound was not sure, and nor, now, is anybody where the nephew has gone.`,
      ][p.id % 3];
    },
    opts: [
      { t: 'Make it good yourself', cost: (L, x) => x.n, run(L, x) { const p = P(L, x); L.bond(p, 10); L.karma(1); return `${first(p)} will not hear of it, and then cries, and then hears of it.`; } },
      { t: 'Get on to the bank and the police', check: ['smarts', 45], run(L, x, win) { const p = P(L, x); busy(L, 1); if (win) { L.bond(p, 8); return 'Letters, phone calls, an afternoon at the police station. They catch up with the culprit in the next county, and most of the money comes back.'; } L.bond(p, 3); return 'Letters, phone calls, an afternoon at the police station. The money has vanished, and so has whoever took it. But you tried, and it is noticed.'; } },
      { t: 'Let them learn from it', run(L, x) { const p = P(L, x); L.bond(p, -6); return `${first(p)} goes without a holiday that year, and does not complain, which is worse.`; } },
    ],
  },

  // ---- friends ----
  {
    id: 'wantsLoan', icon: '🫴', title: 'Could you possibly...?', ok: pal,
    text: (L, x) => { const p = P(L, x); return `${first(p)} is on your sofa, turning a mug round and round. ${x.why} Could you lend ${him(p)} ${money(x.n)}? ${He(p)} will pay you back in a year, ${he(p)} says, without fail.`; },
    opts: [
      { t: 'Lend it', cost: (L, x) => x.n, run(L, x) { const p = P(L, x); L.s.wants.loans.push({ p: p.id, n: x.n, due: L.s.t + L.int(3, 5), back: L.chance(reliable(L, p)) }); L.bond(p, 6); return `${He(p)} writes you an IOU on the back of an envelope, and signs it with a flourish.`; } },
      { t: 'Give it, and say no more about it', cost: (L, x) => x.n, run(L, x) { const p = P(L, x); L.bond(p, 14); L.karma(2); owe(L, p, 2); return `${first(p)} cannot speak for a moment. Then ${he(p)} says, "I will not forget this," and does not.`; } },
      { t: 'Lend half', cost: (L, x) => Math.round(x.n / 2), run(L, x) { const p = P(L, x); L.s.wants.loans.push({ p: p.id, n: Math.round(x.n / 2), due: L.s.t + L.int(3, 5), back: L.chance(reliable(L, p) + 0.1) }); L.bond(p, 2); return 'It is not all of it. It helps.'; } },
      { t: 'Say you cannot', run(L, x) { const p = P(L, x); L.bond(p, -6); return `${He(p)} says ${he(p)} understands, and talks about something else very quickly.`; } },
    ],
  },
  {
    id: 'wantsLoanDue', icon: '✉️', title: 'About that money', ok: (L, x) => pal(L, x) && !!loanOf(L, x),
    text: (L, x) => { const p = P(L, x), ln = loanOf(L, x); return ln.back ? `${first(p)} turns up on the doorstep with an envelope and a bottle of something good. "Every penny," ${he(p)} says, "and the bottle is the interest."` : `The year has come and gone, and so has the ${money(ln.n)}. ${first(p)} has started crossing the road when ${he(p)} sees you coming, which in Starling Bay takes some doing.`; },
    opts: [
      { t: 'Take it, and open the bottle', show: (L, x) => loanOf(L, x).back, run(L, x) { const p = P(L, x), ln = done(L, x); L.cash(ln.n); L.bond(p, 6); L.joy(2); return 'You open it there and then, on the step, and drink it out of mugs.'; } },
      { t: 'Tell them to keep it', show: (L, x) => loanOf(L, x).back, run(L, x) { const p = P(L, x); done(L, x); L.bond(p, 12); L.karma(2); owe(L, p, 2); return `${first(p)} argues, and loses, and takes the envelope home again, and the bottle.`; } },
      { t: 'Ask for it back, nicely', show: (L, x) => !loanOf(L, x).back, check: ['charm', 50], run(L, x, win) { const p = P(L, x), ln = done(L, x); if (win) { L.cash(Math.round(ln.n / 2)); L.bond(p, -2); return `"Half now," ${he(p)} says, red in the face, "and half when I can." You never see the second half, and decide not to mind.`; } L.bond(p, -8); return `${He(p)} has not got it, and says so, and you both stand there not knowing where to look.`; } },
      { t: 'Let it go', show: (L, x) => !loanOf(L, x).back, run(L, x) { const p = P(L, x); done(L, x); L.bond(p, 6); L.karma(2); owe(L, p, 1); return 'You tear up the IOU in front of ' + first(p) + ', who looks as if a piano has been lifted off ' + his(p) + ' chest.'; } },
      { t: 'Have it out in the Gull', show: (L, x) => !loanOf(L, x).back, odds: () => 0.4, run(L, x, win) { const p = P(L, x), ln = done(L, x); L.karma(-2); L.bond(p, -25); if (win) { L.cash(ln.n); return 'Everybody hears. The money is on the bar by closing time. So is the end of the friendship.'; } return 'Everybody hears. The money does not appear, and nor does ' + first(p) + ', after that.'; } },
    ],
  },
  {
    id: 'wantsVenture', icon: '📈', title: 'A share in it', ok: (L, x) => pal(L, x) && !L.s.wants.ven,
    text: (L, x) => { const p = P(L, x); return `${first(p)} is opening ${x.what}, and has been going round everybody ${he(p)} knows with a business plan and the face of somebody asking a stranger to dance. Would you put in ${money(x.n)} for a quarter share?`; },
    opts: [
      { t: 'Put in what they ask', cost: (L, x) => x.n, run(L, x) { const p = P(L, x); venture(L, p, x, x.n, 0); L.bond(p, 8); return `${first(p)} shakes your hand for a full minute. ${x.name} opens in the spring.`; } },
      { t: 'Look over the plan, then put in what they ask', cost: (L, x) => x.n, check: ['smarts', 50], run(L, x, win) { const p = P(L, x); venture(L, p, x, x.n, win ? 18 : 0); L.bond(p, 8); return win ? 'You find a better supplier, a cheaper lease and a mistake in the VAT. The plan comes back from you looking twice as good.' : 'You read the plan twice and nod a lot. It looks fine to you, which may not mean much.'; } },
      { t: 'Put in twice that', cost: (L, x) => x.n * 2, run(L, x) { const p = P(L, x); venture(L, p, x, x.n * 2, 5); L.bond(p, 10); return `${first(p)} has to sit down. With money like that, ${x.name} can open properly, with a sign that lights up.`; } },
      { t: 'Wish them luck, and keep your money', run(L, x) { L.bond(P(L, x), -2); return 'You buy something on the opening day, and tell everybody you know.'; } },
      { t: 'Tell them it will never work', run(L, x) { const p = P(L, x); L.bond(p, -8); rec(L, p).doubt = 1; return `${first(p)} does it anyway, without you, and never quite forgives you for saying so, whichever way it goes.`; } },
    ],
  },
  {
    id: 'wantsVenWinter', icon: '🧮', title: (L) => `${cap1(L.s.wants.ven ? L.s.wants.ven.name : 'the business')}, a year on`, ok: (L, x) => pal(L, x) && !!L.s.wants.ven && L.s.wants.ven.p === x.p,
    text: (L, x) => { const p = P(L, x), v = L.s.wants.ven; return v.hp >= 45 ? `A year in, and ${v.name} is doing better than anyone expected, ${first(p)} included. There is a queue on Saturdays. ${He(p)} asks whether you would like your share of the takings each season, or left in to grow the place.` : `A year in, and ${v.name} is struggling. The winter was long and the summer was wet, and ${first(p)} needs another ${money(Math.round(v.stake / 2))} to keep the doors open.`; },
    opts: [
      { t: 'Your share each season, please', show: (L) => L.s.wants.ven.hp >= 45, run(L, x) { L.s.wants.ven.st = 1; L.bond(P(L, x), 2); return 'The first envelope comes at the end of the season, with a handwritten note: "Told you."'; } },
      { t: 'Leave it in, to grow', show: (L) => L.s.wants.ven.hp >= 45, run(L, x) { const v = L.s.wants.ven; v.st = 1; v.hp = Math.min(100, v.hp + 12); v.wait = L.s.t + 4; L.bond(P(L, x), 4); return `${first(P(L, x))} puts it into a second oven and a better sign.`; } },
      { t: 'Put in more', show: (L) => L.s.wants.ven.hp < 45, cost: (L) => Math.round(L.s.wants.ven.stake / 2), run(L, x) { const v = L.s.wants.ven; v.stake += Math.round(v.stake / 2); v.hp = Math.min(100, v.hp + 25); v.st = 1; L.bond(P(L, x), 6); return 'It buys a new boiler and another season. You try not to think about good money and bad.'; } },
      { t: 'Roll up your sleeves and help on Saturdays', show: (L) => L.s.wants.ven.hp < 45, run(L, x) { const v = L.s.wants.ven; busy(L, 2); v.hp = Math.min(100, v.hp + 12); v.st = 1; L.bond(P(L, x), 6); L.gain('charm', 1); return 'You take the money, you make the tea, you tell everybody who comes in about it. Saturdays pick up.'; } },
      { t: 'Not another penny', show: (L) => L.s.wants.ven.hp < 45, run(L, x) { const v = L.s.wants.ven; v.hp -= 10; v.st = 1; L.bond(P(L, x), -4); return `${first(P(L, x))} nods, and says ${he(P(L, x))} understands, and goes back to doing the sums.`; } },
    ],
  },
  {
    id: 'wantsVenEnd', icon: '🏁', title: (L) => (L.s.wants.ven && L.s.wants.ven.hp <= 0 ? 'The shutters' : 'An offer'), ok: (L, x) => !!L.s.wants.ven && L.s.wants.ven.p === x.p && !L.s.gaol,
    text: (L, x) => { const p = P(L, x), v = L.s.wants.ven; return v.hp <= 0 ? `The shutters are down on ${v.name}. ${first(p)} tried everything, and says so, and you believe ${him(p)}. Your ${money(v.stake)} has gone with it.` : `A chain from the city has made ${first(p)} an offer for ${v.name}: enough to buy everybody out, you included, at ${v.mult} times what you put in.`; },
    opts: [
      { t: 'Tell them it was worth a try', show: (L) => L.s.wants.ven.hp <= 0, run(L, x) { const p = P(L, x); endVen(L); L.bond(p, 6); return `"It was, wasn’t it," ${he(p)} says, and you go for a drink on what is left.`; } },
      { t: 'Ask what is left to sell', show: (L) => L.s.wants.ven.hp <= 0, run(L, x) { const p = P(L, x), n = Math.round(L.s.wants.ven.stake * 0.1); L.cash(n); L.s.wants.ven.got += n; endVen(L); L.bond(p, -3); return `A coffee machine, two tables and a sign. Your share comes to ${money(n)}.`; } },
      { t: 'Sell your share', show: (L) => L.s.wants.ven.hp > 0, run(L, x) { const p = P(L, x), v = L.s.wants.ven, n = Math.round(v.stake * v.mult); L.cash(n); v.got += n; endVen(L); L.bond(p, 4); been(L, p, `Backed ${first(p)}’s ${v.name.replace(/^the /, '')}, and saw it sold to a chain.`); return `The cheque is for ${money(n)}. ${first(p)} stays on to run the place, in a polo shirt with somebody else’s name on it.`; } },
      { t: 'Keep your share, and the takings', show: (L) => L.s.wants.ven.hp > 0, run(L, x) { const p = P(L, x), v = L.s.wants.ven; v.st = 2; v.wait = 0; L.bond(p, 8); been(L, p, `Backed ${first(p)}’s ${v.name.replace(/^the /, '')} from the start.`); return `${first(p)} turns them down, grinning. "Not for sale," ${he(p)} says. "Not to them."`; } },
    ],
  },
  {
    id: 'wantsBest', icon: '🤵', title: 'Something to ask', ok: pal,
    text: (L, x) => { const p = P(L, x); return `${first(p)} is getting married in the spring, to ${x.name}, and would like you to be ${role(L, p)}. There is a speech involved. There is also a ${L.s.sex === 'f' ? 'hen' : 'stag'} do, in Kettleby, which nobody will ever speak of again.`; },
    opts: [
      { t: 'I would be honoured', run(L, x) { const p = P(L, x), r = rec(L, p); r.best = 1; r.bestAt = L.s.t + 1; p.single = false; L.bond(p, 8); L.joy(3); return `${first(p)} hugs you, and then, slightly embarrassed, shakes your hand as well.`; } },
      { t: 'I would rather not, but I will be there', run(L, x) { const p = P(L, x), r = rec(L, p); r.best = 2; p.single = false; L.bond(p, -6); return `${He(p)} asks somebody from work instead. You are seated at table nine, near the kitchen.`; } },
    ],
  },
  {
    id: 'wantsSpeech', icon: '🥂', title: 'The speech', ok: (L, x) => pal(L, x) && rec(L, P(L, x)).best === 1,
    text: (L, x) => { const p = P(L, x); return `The reception is in a marquee on the cliffs, and the wind is trying to take it to France. ${first(p)} catches your eye across the top table. It is time for the speech.`; },
    opts: [
      { t: 'From the heart', check: ['charm', 40], run(L, x, win) { const p = P(L, x); speech(L, p); if (win) { L.bond(p, 10); L.joy(6); return 'You keep it short and you mean every word. There is not a dry eye in the marquee, including the caterers.'; } L.bond(p, 4); return 'You lose your place, then your notes, then your nerve. You finish with "Anyway", and sit down. People are very kind.'; } },
      { t: 'Go for the laughs', check: ['charm', 55], run(L, x, win) { const p = P(L, x); speech(L, p); if (win) { L.bond(p, 14); L.joy(8); L.fame(0.5); L.s.wants.n.speech++; been(L, p, `Brought the house down as ${role(L, p)} at ${first(p)}’s wedding.`); return 'You bring the house down. The story about the canoe goes round the Bay for years. Three people ask if you do bookings.'; } L.bond(p, -4); L.joy(-4); return 'The story about the canoe does not go down as you hoped, particularly with the bride’s mother.'; } },
      { t: 'Read a poem you found on the internet', run(L, x) { const p = P(L, x); speech(L, p); L.bond(p, 4); return 'It is about two oak trees. It is fine. Several people say it was "lovely", which is what people say.'; } },
      { t: ti('joker', 'The speech of your life'), show: tr('joker'), run(L, x) { const p = P(L, x); speech(L, p); L.bond(p, 15); L.joy(10); L.s.wants.n.speech++; been(L, p, `Brought the house down as ${role(L, p)} at ${first(p)}’s wedding.`); return 'Eleven minutes, and every one of them gets a laugh. The groom’s grandmother has to be helped to a chair. You will be asked to do it again for everybody you know.'; } },
    ],
  },
  {
    id: 'wantsMoving', icon: '🎹', title: 'There is a piano', ok: pal,
    text: (L, x) => { const p = P(L, x); return `${first(p)} is moving house on Saturday, and has asked, very casually, whether you have "a strong back and a free morning". There is a piano.`; },
    opts: [
      { t: 'Lift with your knees', check: ['fitness', 40], run(L, x, win) { const p = P(L, x); owe(L, p, 1); if (win) { L.bond(p, 8); L.gain('fitness', 1); return 'Up two flights, round a corner nobody measured, and into the front room, in one piece. You are given a bacon sandwich and the best seat.'; } L.rough(4, 'a piano'); L.bond(p, 6); return 'The piano makes it. Your back does not, quite. You spend a week on the floor, and ' + first(p) + ' brings you soup every day.'; } },
      { t: 'Bring the car, and do the boxes', show: (L) => typeof L.motorUsable === 'function' && L.motorUsable(), run(L, x) { const p = P(L, x); busy(L, 1); L.bond(p, 7); owe(L, p, 1); return 'Nine trips, forty boxes, one goldfish in a jam jar on your lap. The piano is somebody else’s problem.'; } },
      { t: 'Send round pizza at lunchtime', cost: 40, run(L, x) { L.bond(P(L, x), 3); return 'The pizza is a great success. You are forgiven, mostly.'; } },
      { t: 'Have a prior engagement', run(L, x) { L.bond(P(L, x), -4); return 'You hear about the piano for years.'; } },
    ],
  },
  {
    id: 'wantsSaid', icon: '🗯️', title: 'Something you said', ok: pal,
    text: (L, x) => { const p = P(L, x); return `Something you said in the Gull about ${first(p)}’s ${x.thing} has got back to ${him(p)}, with a few words added on the way. ${He(p)} has not answered your last three messages.`; },
    opts: [
      { t: 'Go round and apologise properly', run(L, x) { const p = P(L, x); L.bond(p, -2); L.karma(1); return `${first(p)} lets you in, eventually, and makes you say it twice. Then ${he(p)} puts the kettle on.`; } },
      { t: 'Explain what you actually meant', check: ['charm', 50], run(L, x, win) { const p = P(L, x); if (win) { L.bond(p, 2); return 'It sounds better the way you meant it. Not much better, but enough.'; } L.bond(p, -12); return 'It sounds worse the way you meant it.'; } },
      { t: 'Stand by it', run(L, x) { const p = P(L, x); L.bond(p, -20); rec(L, p).fell = L.s.t; return `It was true. That is rather the problem. ${first(p)} stops speaking to you.`; } },
      { t: ti('hothead', 'Say it again, louder, to their face'), show: tr('hothead'), run(L, x) { const p = P(L, x); L.bond(p, -30); L.joy(2); rec(L, p).fell = L.s.t; return 'You feel much better for about an hour.'; } },
    ],
  },
  {
    id: 'wantsMend', icon: '🚏', title: 'At the bus stop', ok: (L, x) => pal(L, x) && rec(L, P(L, x)).fell != null,
    text: (L, x) => { const p = P(L, x); return `It has been a long time. Then one wet morning you and ${first(p)} are at the same bus stop, under the same bit of shelter, and the bus is late.`; },
    opts: [
      { t: 'Say you were sorry', run(L, x) { const p = P(L, x); rec(L, p).fell = null; L.bond(p, 15); L.joy(4); return `"So was I," says ${first(p)}. You miss the bus, and the next one, and go to Betty’s instead.`; } },
      { t: 'Talk about the weather', run(L, x) { const p = P(L, x); rec(L, p).fell = null; L.bond(p, 5); return 'You agree that it is very wet. It is a start.'; } },
      { t: 'Get a taxi', run(L, x) { rec(L, P(L, x)).fell = null; return 'Some bridges stay burnt.'; } },
    ],
  },
  {
    id: 'wantsNight', icon: '📞', title: 'Three in the morning', ok: pal,
    text: (L, x) => { const p = P(L, x); return `It is three in the morning, and ${first(p)} is on the phone, not making much sense. ${x.why}`; },
    opts: [
      { t: 'Go round now', run(L, x) { const p = P(L, x); L.hp(-2); busy(L, 1); L.bond(p, 12); L.karma(2); owe(L, p, 2); been(L, p, `You went round at three in the morning when ${first(p)} needed you.`); return 'Tea, toast, a blanket on the sofa, and talking until the gulls start. You go to work on no sleep, and do not regret it.'; } },
      { t: 'Talk until it gets light', run(L, x) { const p = P(L, x); L.hp(-1); L.bond(p, 8); owe(L, p, 1); return 'Three hours on the phone. By the end of it you are both laughing about something, which is how you know it will be all right.'; } },
      { t: 'Say you will call in the morning', run(L, x) { const p = P(L, x); L.bond(p, -6); return `By morning ${he(p)} says it is all fine. It does not sound fine.`; } },
    ],
  },
  {
    id: 'wantsTurn', icon: '🍲', title: 'My turn', ok: pal,
    text: (L, x) => { const p = P(L, x); return `${first(p)} is on your doorstep with a casserole and an overnight bag. "Do you remember when you were there for me?" ${he(p)} says. "My turn." ${He(p)} does not leave until ${he(p)} is satisfied, which takes the weekend.`; },
    opts: [
      { t: 'Let them in', run(L, x) { const p = P(L, x), S = L.s.soul; rec(L, p).owe = 0; L.joy(8); L.hp(2); L.bond(p, 6); if (S) { if (S.mind && S.mind.spell) { S.mind.spell.depth = Math.max(0, S.mind.spell.depth - 2); S.mind.spell.by.talk = (S.mind.spell.by.talk || 0) + 2; } S.grief = Math.max(0, Math.round((S.grief - 1.5) * 100) / 100); } been(L, p, `${first(p)} turned up with a casserole when you needed it most.`); return `${He(p)} washes up, walks you round the harbour, and makes you laugh at something for the first time in weeks. You will not forget it.`; } },
      { t: 'Say you are fine, really', run(L, x) { const p = P(L, x); owe(L, p, -1); L.joy(2); return `${He(p)} leaves the casserole anyway, and rings every day for a week.`; } },
    ],
  },
];

// ---- the pieces ----------------------------------------------------------------------------

// A child's results, and the reward that was promised for them.
function paid(L, p) { const r = rec(L, p); if (r.bribe && r.ex >= 2) { r.bribe = 0; L.cash(-price(L, 300)); } }
// A child comes through university or an apprenticeship, into work.
function qualify(L, p) {
  const r = rec(L, p);
  L.s.wants.n.grad++;
  settle(L, p, r.path === 'uni' ? degreeJob(L, p, r) : (PATHS[r.path] || {}).job || null);
  L.note(`${first(p)} ${r.path === 'uni' ? 'graduated' : 'qualified'}, and went to work as ${L.jobOf(p).toLowerCase()}.`, 'big');
}
// Who looks after a parent now.
function setCare(L, p, care) {
  const r = rec(L, p);
  r.care = care; r.cAt = L.s.t; r.ask = 0;
}
// How likely a friend is to pay back what they borrow.
function reliable(L, p) { return clamp(0.35 + (p.trait === 'kind' ? 0.2 : p.trait === 'witty' ? -0.1 : 0) + p.bond / 250, 0.2, 0.85); }
const loanOf = (L, x) => L.s.wants.loans.find((q) => q.p === x.p) || null;
function done(L, x) { const W = L.s.wants, ln = loanOf(L, x); W.loans = W.loans.filter((q) => q !== ln); return ln; }
// A friend's venture, with your money in it. hp: how it is doing (dead at 0).
function venture(L, p, x, stake, boost) {
  const W = L.s.wants;
  W.ven = { p: p.id, name: x.name, stake, hp: clamp(42 + boost + (['kitchen', 'retail'].includes(p.job) ? 8 : 0) + (p.trait === 'kind' ? 4 : 0), 0, 100), age: 0, st: 0, got: 0, wait: 0, mult: 0 };
  W.n.ven++;
  L.note(`Put ${money(stake)} into ${first(p)}’s ${x.name.replace(/^the /, '')}.`);
}
function endVen(L) {
  const W = L.s.wants, v = W.ven;
  if (v.got > v.stake) W.f.angel = 1;
  W.ven = null;
}
const cap1 = (t) => t[0].toUpperCase() + t.slice(1);
// Best man, chief bridesmaid, or best woman.
function role(L, p) { return L.s.sex !== 'f' ? 'best man' : p.sex === 'f' ? 'chief bridesmaid' : 'best woman'; }
function speech(L, p) { rec(L, p).best = 3; }
