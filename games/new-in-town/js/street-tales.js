// New in Town: the neighbours' stories (street.js brings them up, a card at a time, and the
// people themselves are made there). Each kind of neighbour has a story of two or three cards
// that runs over years (TALES: which card comes next, how long after the last, and when):
// the hedge and the van that turn into feuds, which can be made up; the teenager who grows up
// and is lovely; the ladder that never comes back; the milk on the step; the Neighbourhood
// Watch; the couple upstairs; the new family; the chip shop downstairs; the shared bathroom;
// the old sailor and the student in the hostel; the hot tub and the judge on the cliff road;
// the lady at the Grange and the man at the lodge. What you chose is remembered on the
// neighbour (n.f, n.feud) and decides what comes next.

import { money, HOMES } from './data.js';
import { clamp, fee, STREETS, lent, first, he, him, his, He, His } from './street-lib.js';

const S = (L) => L.s.street;
const N = (L, x) => L.stNb(x.n) || { name: 'Somebody', sex: 'm', st: 0, f: {}, vs: [], role: 'any', age: 60, kid: { name: 'the boy', sex: 'm', age: 20 } };
const by = (x, l) => l[Math.abs(x.v || 0) % l.length];
const busy = (L, n) => { L.s.time = Math.max(0, L.s.time - n); };
const f = (n) => first(n);
const where = (L) => STREETS[L.stHouse() ? L.stHouse().kind : 'cottage'].their;
const thing = (L) => lent(L.stHouse() ? L.stHouse().kind : 'cottage');
// Still about somebody on the street you live in, and you are not in a cell.
const okN = (g) => (L, x) => !L.s.gaol && !!x && !!L.s.street && L.s.street.at === x.k && !!L.stNb(x.n) && (!g || !!g(L, L.stNb(x.n), x));
const warm = (L, x, d) => L.stWarm(N(L, x), d);
const K = (n) => n.kid || { name: 'the boy', sex: 'm', age: 20 };
const kHe = (n) => He(K(n)), khe = (n) => he(K(n)), khim = (n) => him(K(n));

// Which card comes next for each kind of neighbour. card: its id (or which, by what has gone
// before; null: the story is over). gap: seasons after the last before it may come. when: and
// not until this is so. u: it cannot wait (somebody new at the door).
export const TALES = {
  fence: [{ card: 'stHedge1' }, { card: (L, n) => (n.feud ? 'stHedge2' : 'stHedge2b'), gap: [8, 14] }, { card: (L, n) => (n.feud ? 'stHedge3' : null), gap: [10, 18] }],
  parking: [{ card: 'stVan1' }, { card: (L, n) => (n.feud ? 'stVan2' : 'stVan2b'), gap: [6, 12] }, { card: (L, n) => (n.feud ? 'stVan3' : null), gap: [10, 18] }],
  teen: [{ card: 'stTeen1', when: (L, n) => K(n).age >= 14 }, { card: 'stTeen2', gap: [6, 10], when: (L, n) => K(n).age >= 16 }, { card: 'stTeen3', gap: [12, 24], when: (L, n) => K(n).age >= 21 }],
  ladder: [{ card: 'stLadder1' }, { card: (L, n) => (n.f.lent != null ? 'stLadder2' : null), gap: [6, 10] }, { card: (L, n) => (n.f.lent != null && !n.f.back ? 'stLadder3' : null), gap: [10, 20] }],
  milk: [{ card: 'stMilk1' }, { card: 'stMilk2', gap: [8, 20], when: (L, n) => n.age >= 82 }, { card: (L, n) => (n.f.saved ? 'stMilk3' : null), gap: [6, 12] }],
  watch: [{ card: 'stWatch1' }, { card: (L, n) => (n.f.join ? 'stWatch2' : 'stWatch2b'), gap: [6, 12] }, { card: (L, n) => (n.f.join ? 'stWatch3' : null), gap: [8, 16] }],
  couple: [{ card: 'stUp1' }, { card: 'stUp2', gap: [6, 10] }, { card: 'stUp3', gap: [8, 14] }],
  newfam: [{ card: 'stNew1', u: true }, { card: 'stNew2', gap: [6, 12] }],
  chippy: [{ card: 'stChip1' }, { card: 'stChip2', gap: [6, 10] }, { card: (L, n) => (n.st >= 35 && !L.s.biz ? 'stChip3' : null), gap: [10, 20] }],
  singer: [{ card: 'stBath1' }, { card: 'stBath2', gap: [4, 8] }, { card: 'stBath3', gap: [6, 12] }],
  sailor: [{ card: 'stSailor1' }, { card: 'stSailor2', gap: [3, 6] }, { card: 'stSailor3', gap: [6, 10] }],
  student: [{ card: 'stStudent1' }, { card: 'stStudent2', gap: [3, 6] }],
  posh: [{ card: 'stPosh1' }, { card: 'stPosh2', gap: [6, 12] }, { card: (L, n) => (n.feud ? 'stPosh3' : null), gap: [10, 18] }],
  judge: [{ card: 'stJudge1' }, { card: 'stJudge2', gap: [8, 14] }],
  lady: [{ card: 'stLady1' }, { card: 'stLady2', gap: [8, 16], when: (L, n) => !!n.f.beaten || n.st >= 40 }],
  keeper: [{ card: 'stLodge1' }, { card: 'stLodge2', gap: [8, 14] }],
};

// A feud begun, or deepened.
const feud = (L, x, by2, d) => { const n = N(L, x); n.feud = Math.max(n.feud, by2); L.stWarm(n, d); };

export const TALE_CARDS = [
  // ---- the hedge ----
  {
    id: 'stHedge1', icon: '🌳', title: 'The hedge', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${n.name}, ${where(L)}, is standing at your hedge with a tape measure and a face like a shut shop. The hedge, ${he(n)} says, is eleven inches over the line, and has been taking ${his(n)} light since Easter.`; },
    opts: [
      { t: 'Cut it back, and offer the clippings', run(L, x) { const n = N(L, x); warm(L, x, 8); L.gain('fitness', 0.5); n.f.hedge = 'cut'; return `It takes all afternoon and two of ${f(n)}’s inspections. ${He(n)} takes the clippings for ${his(n)} compost and nods, which you gather is a great deal, from ${him(n)}.`; } },
      { t: 'Say the hedge was there first', run(L, x) { const n = N(L, x); feud(L, x, 1, -15); return `${f(n)} writes the date in a little notebook. You have a feeling it is the first entry of many.`; } },
      { t: 'Suggest a fence, and going halves', cost: (L) => fee(L, 600), run(L, x) { const n = N(L, x); warm(L, x, 4); n.f.hedge = 'fence'; return `A fence goes up, paid half each, and the hedge comes out. ${f(n)} seems almost sorry to have nothing left to measure.`; } },
    ],
  },
  {
    id: 'stHedge2', icon: '🌳', title: 'The hedge, continued', ok: okN((L, n) => n.feud >= 1),
    text: (L, x) => { const n = N(L, x); return `You come home to find your side of the hedge cut back hard, right into the brown, and a letter from ${f(n)} under the door about your ${by(x, ['gutters', 'bins', 'apple tree', 'bonfire'])}. It has been copied to the council.`; },
    opts: [
      { t: 'Plant leylandii along the line', run(L, x) { feud(L, x, 2, -20); L.joy(2); return 'Twelve leylandii, eight feet each, off the back of a lorry. You plant them on a Sunday, slowly, while you are watched.'; } },
      { t: 'Knock on the door and talk it out', check: ['charm', 45], run(L, x, win) { const n = N(L, x); if (win) { L.stMended(n); return `It comes out, over a pot of tea, that the hedge was planted by ${his(n)} late wife, and it is not about the hedge at all. You go home with a jar of chutney and a feeling you were not expecting.`.replace('late wife', n.sex === 'm' ? 'late wife' : 'late husband'); } feud(L, x, 2, -10); return 'Voices are raised, and a door is closed with some force. Neither of you remembers afterwards who closed it.'; } },
      { t: 'Send a solicitor’s letter of your own', cost: (L) => fee(L, 800), run(L, x) { feud(L, x, 2, -25); L.karma(-1); return 'Your solicitor writes to theirs, who writes back. The hedge is still there. So are the solicitors.'; } },
    ],
  },
  {
    id: 'stHedge2b', icon: '🌳', title: 'Over the hedge', ok: okN((L, n) => !n.feud),
    text: (L, x) => { const n = N(L, x); return `${f(n)} leans over the hedge, which is now exactly the right height, and offers you cuttings from ${his(n)} fuchsias and, without being asked, a lesson in pruning.`; },
    opts: [
      { t: 'Take the lesson', run(L, x) { warm(L, x, 8); L.gain('craft', 1.5); const g = L.stGardenOf(); if (g) g.care = clamp(g.care + 10, 0, 100); return 'Cut above an outward bud, at an angle, so the rain runs off. You will never prune anything again without hearing it said.'; } },
      { t: 'Take the cuttings, and skip the lesson', run(L, x) { warm(L, x, 3); L.joy(1); return 'The cuttings take. You do not tell anybody how.'; } },
    ],
  },
  {
    id: 'stHedge3', icon: '🌳', title: (L, x) => by(x, ['After the storm', 'The lawn']), ok: okN((L, n) => n.feud >= 1),
    text: (L, x) => { const n = N(L, x); return by(x, [`A gale in the night has flattened the fence between you and taken a corner off ${f(n)}’s greenhouse. In the morning ${he(n)} is out there in a dressing gown, trying to lift a panel on ${his(n)} own, and ${he(n)} is not as young as the feud.`, `${f(n)} has been taken into St Wren’s with ${his(n)} heart. The curtains have been shut for a week, and ${his(n)} lawn, for the first time in living memory, needs cutting.`]); },
    opts: [
      { t: (L, x) => by(x, ['Go and help', 'Cut the lawn while they are in']), run(L, x) { const n = N(L, x); L.stMended(n); warm(L, x, 10); L.joy(3); return by(x, [`You lift the other end without a word. By lunchtime the fence is up, and by teatime you are in ${f(n)}’s kitchen. Nobody mentions the hedge, then or ever again.`, `You cut it in stripes, the way ${he(n)} does. When ${he(n)} comes home ${he(n)} stands at the gate and looks at it for a long time, and then comes round with a bottle of something from 1987.`]); } },
      { t: 'Leave them to it', run(L, x) { warm(L, x, -5); return 'You watch from the window. It is hard to say who it costs more.'; } },
    ],
  },

  // ---- the van ----
  {
    id: 'stVan1', icon: '🚐', title: 'Brenda', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${n.name}’s camper van, which ${he(n)} calls Brenda, is parked ${L.s.home === 'flat' ? 'across your space in the car park' : 'across your front window'} again. You have not seen the sea from your front room since Tuesday.`; },
    opts: [
      { t: 'Ask nicely', check: ['charm', 35], run(L, x, win) { const n = N(L, x); if (win) { warm(L, x, 6); return `${f(n)} moves Brenda, and leaves a bag of fudge from ${his(n)} holidays on your step.`; } feud(L, x, 1, -8); return `${f(n)} says Brenda has as much right to the road as you do. Brenda does not move.`; } },
      { t: 'Put out traffic cones', run(L, x) { feud(L, x, 1, -12); return 'The cones are back on your step in the morning, in a neat stack, with a note that says TUT.'; } },
      { t: 'Let it go: it is only a view', run(L, x) { warm(L, x, 3); L.joy(-2); return 'You look at Brenda instead. Brenda has a sticker that says “I ❤️ Tenby”.'; } },
    ],
  },
  {
    id: 'stVan2', icon: '🚐', title: 'Four flat tyres', ok: okN((L, n) => n.feud >= 1),
    text: (L, x) => { const n = N(L, x); return `Somebody has let down all of Brenda’s tyres in the night. ${f(n)} thinks it was you. It was not you.`; },
    opts: [
      { t: 'Help pump them up', run(L, x) { const n = N(L, x); L.gain('fitness', 0.6); L.stMended(n); return `Forty minutes with a foot pump, in turns, not speaking, and then speaking. By the fourth tyre you are both laughing at something. It was the boy from number twelve, it turns out.`; } },
      { t: 'Swear it was not you', check: ['charm', 40], run(L, x, win) { if (win) { warm(L, x, 5); return 'You are believed, nearly.'; } feud(L, x, 2, -10); return 'The more you swear, the less you are believed. It is a law of nature.'; } },
      { t: 'Shrug', run(L, x) { feud(L, x, 2, -15); return 'A shrug, it turns out, says a great deal.'; } },
    ],
  },
  {
    id: 'stVan2b', icon: '🚐', title: 'A weekend in Brenda', ok: okN((L, n) => !n.feud),
    text: (L, x) => { const n = N(L, x); return `${f(n)} is taking Brenda to a campsite in Wales where the toilets are, and this is a quote, “a revelation”, and there is room for one more.`; },
    opts: [
      { t: 'Go', cost: (L) => fee(L, 60), run(L, x) { busy(L, 1); warm(L, x, 14); L.joy(6); L.gain('fitness', 0.5); return 'Two days of rain on a tin roof, bacon at dawn and a game of cards that lasts until two. The toilets are, in fairness, a revelation.'; } },
      { t: 'Wave them off', run(L, x) { warm(L, x, 1); return 'Brenda goes off up the road with a noise like a cough, and comes back on Monday with a noise like a worse cough.'; } },
    ],
  },
  {
    id: 'stVan3', icon: '🚐', title: 'The end of Brenda', ok: okN((L, n) => n.feud >= 1),
    text: (L, x) => { const n = N(L, x); return `Brenda has finally died, at the end of the road, with steam coming out of her. ${f(n)} is sitting in her with the door open, and has been for an hour.`; },
    opts: [
      { t: `Sit with them a while`, run(L, x) { const n = N(L, x); L.stMended(n); L.joy(2); return `You sit on the step of the van. ${f(n)} tells you about every trip Brenda ever made, and you listen to all of them. When the tow truck comes you help push.`; } },
      { t: 'Leave them be', run() { return 'Some things are private, even on a street.'; } },
    ],
  },

  // ---- the teenager ----
  {
    id: 'stTeen1', icon: '🥁', title: 'The drums', ok: okN(),
    text: (L, x) => { const n = N(L, x), k = K(n); return `It is half past eleven on a school night, and ${L.s.home === 'flat' ? 'through the floor' : 'through the wall'}, ${k.name} ${where(L)} is learning the drums. ${kHe(n)} is not, yet, very good at the drums. ${kHe(n)} is, however, very keen.`; },
    opts: [
      { t: 'Bang on the wall', run(L, x) { warm(L, x, -6); N(L, x).f.cross = 1; L.joy(1); return 'The drumming stops. Then it starts again, in time with your banging. It is, you have to admit, quite good.'; } },
      { t: (L, x) => `Go round and have a word with ${f(N(L, x))}`, check: ['charm', 30], run(L, x, win) { const n = N(L, x); if (win) { warm(L, x, 5); return `${f(n)} is mortified, and puts it to ${K(n).name}, firmly: before nine on school nights. ${K(n).name} keeps to it, mostly.`; } warm(L, x, -5); return `${f(n)} has just come off a night shift and is not in the mood. Neither, it turns out, are you.`; } },
      { t: 'Offer the shed, afternoons', show: (L) => L.stSize() >= 2, run(L, x) { const n = N(L, x); n.f.kind = 1; warm(L, x, 10); L.joy(-1); return `${K(n).name} practises in your shed every afternoon after school. You learn to love the sound, mostly, from the far end of the house.`; } },
      { t: 'Buy earplugs and say nothing', cost: (L) => fee(L, 10), run(L) { L.joy(-1); return 'Foam earplugs, in a little tub. You hear the drums anyway, in your teeth.'; } },
    ],
  },
  {
    id: 'stTeen2', icon: '📐', title: (L, x) => `${K(N(L, x)).name} at the door`, ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${K(n).name} ${where(L)} is on your step, taller than last year and trying to look as if ${khe(n)} is not there. ${kHe(n)} has a maths exam on Monday, and has worked out, in a panic, that you are the only grown-up ${khe(n)} knows who might understand simultaneous equations.`; },
    opts: [
      { t: (L, x) => `Sit down with ${khim(N(L, x))} and the equations`, check: ['smarts', 40], run(L, x, win) { const n = N(L, x); n.f.kind = (n.f.kind || 0) + 1; warm(L, x, win ? 8 : 4); L.gain('smarts', 0.5); return win ? `${K(n).name} passes. You hear about it through the wall, by drum.` : 'You both learn a great deal that evening, most of it about despair. The exam goes as well as can be expected.'; } },
      { t: (L, x) => `Tell ${khim(N(L, x))} to ask ${his(K(N(L, x)))} mum`, run(L, x) { return `${K(N(L, x)).name} goes, slowly, with the face of somebody who already has.`; } },
    ],
  },
  {
    id: 'stTeen3', icon: '🧰', title: (L, x) => `${K(N(L, x)).name}, grown up`, ok: okN(),
    text: (L, x) => {
      const n = N(L, x), k = K(n), job = k.sex === 'm' ? 'an electrician now' : 'a nurse at St Wren’s now';
      return `There is a tall young ${k.sex === 'm' ? 'man' : 'woman'} at your door, and it takes you a moment: ${k.name} ${where(L)}, all grown up, ${job}. ${n.f.kind ? `“You let me use your shed,” ${khe(n)} says, “when nobody else could stand me.”` : `“I was a nightmare,” ${khe(n)} says. “Mum says I owe the whole street.”`}`;
    },
    opts: [
      { t: (L, x) => { const w = L.stWrong()[0]; return `Let ${khim(N(L, x))} have a look at ${w ? `the ${w[0] === 'wall' ? 'wall' : w[0] === 'subs' ? 'crack' : w[0]}` : 'things'}`; }, show: (L, x) => L.stWrong().some(([id]) => id !== 'subs'), run(L, x) { const n = N(L, x), w = L.stWrong().find(([id]) => id !== 'subs'); L.stMend(w[0], 'proper'); warm(L, x, 12); L.joy(5); return `${K(n).name} sees to it in an afternoon, properly, and will not take a penny. “Call it rent,” ${khe(n)} says, “for the shed.”`; } },
      { t: 'Put the kettle on', run(L, x) { const n = N(L, x); warm(L, x, 12); L.joy(5); return `${K(n).name} stays an hour, and tells you about everything, and still plays the drums, in a band at the Gull on Fridays. You go, the next Friday. ${kHe(n)} is very good.`; } },
    ],
  },

  // ---- the ladder ----
  {
    id: 'stLadder1', icon: '🪜', title: 'Just for the afternoon', ok: okN(),
    text: (L, x) => { const n = N(L, x), t = thing(L); return `${n.name}, ${where(L)}, would like to borrow your ${t}. Just for the afternoon. ${He(n)} has ${({ ladder: 'a gutter that is behaving very oddly', drill: 'a shelf that is not going to put itself up', iron: 'an interview in the morning, and a shirt that has seen better decades', kettle: 'a Pot Noodle emergency' })[t]}.`; },
    opts: [
      { t: 'Of course', run(L, x) { N(L, x).f.lent = L.s.t; warm(L, x, 6); return 'You hand it over. It is the last you see of it for some time.'; } },
      { t: 'Of course, and write your name on it first', run(L, x) { const n = N(L, x); n.f.lent = L.s.t; n.f.named = 1; warm(L, x, 3); return 'You write your name on it in marker, twice. You are not proud of it. You do it anyway.'; } },
      { t: 'Say you are using it', run(L, x) { warm(L, x, -4); return 'You are not using it. You both know you are not using it.'; } },
    ],
  },
  {
    id: 'stLadder2', icon: '🪜', title: (L) => `Your ${thing(L)}`, ok: okN((L, n) => n.f.lent != null),
    text: (L, x) => { const n = N(L, x), y = Math.max(1, Math.round((L.s.t - n.f.lent) / 4)); return `You need your ${thing(L)}. It has been at ${f(n)}’s for ${y === 1 ? 'a year' : `${y} years`} now, and you have seen it go past the window on three occasions, carried by people you do not know.`; },
    opts: [
      { t: 'Ask for it back', check: ['charm', 30], run(L, x, win) { const n = N(L, x); if (win) { n.f.back = 1; warm(L, x, 3); return `${f(n)} fetches it at once, full of apology, with a new rung where the old one was loose and a tin of biscuits.`; } return `${f(n)} cannot think where it has got to. ${He(n)} will have a look. ${He(n)} does not have a look.`; } },
      { t: 'Climb over and take it', check: ['fitness', 35], run(L, x, win) { const n = N(L, x); if (win) { n.f.back = 1; warm(L, x, -8); return `In and out over the fence in two minutes, with it under your arm. ${f(n)} saw. Neither of you says anything, then or ever.`; } L.hp(-3); warm(L, x, -10); return `You are halfway over the fence when ${f(n)} comes out with a cup of tea. It is a long moment. You are still holding the fence.`; } },
      { t: 'Buy another', cost: (L) => fee(L, thing(L) === 'ladder' ? 150 : 40), run(L, x) { N(L, x).f.bought = 1; L.joy(-1); return 'You buy another. It is a little galling to pay twice for one thing, but only a little, and only every time you use it.'; } },
    ],
  },
  {
    id: 'stLadder3', icon: '🪜', title: 'It comes home', ok: okN((L, n) => !n.f.back),
    text: (L, x) => { const n = N(L, x); return `${f(n)} is moving to be near ${his(n)} daughter in Kettleby. On the morning the van comes, ${he(n)} ${L.s.home === 'hostel' ? 'comes to your bunk' : 'knocks on your door'} with your ${thing(L)}, painted a cheerful blue, and a tin of shortbread taped to it.`; },
    opts: [
      { t: 'Wave them off', run(L, x) { const n = N(L, x); n.f.back = 1; L.joy(4); L.stGone(n, 'moved'); L.note(`${n.name} moved away, and gave you back your ${thing(L)}, painted blue.`); return `You stand at the gate with the ${thing(L)} until the van has gone round the corner. It is the best ${thing(L)} on the street now.`; } },
      { t: 'Tell them to keep it', run(L, x) { const n = N(L, x); L.karma(1); L.joy(3); L.stGone(n, 'moved'); L.note(`${n.name} moved away, with your ${thing(L)}, which you told ${him(n)} to keep.`); return `${f(n)} goes pink, and hugs you, and the ${thing(L)} goes into the van on top of everything else, where it belongs.`; } },
    ],
  },

  // ---- the milk on the step ----
  {
    id: 'stMilk1', icon: '🫖', title: 'Over the wall', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${n.name}, ${where(L)}, has asked if you would mind reaching a jar down from a top shelf, and then if you would like a cup of tea, and then it is four o’clock and you know everything about ${his(n)} late ${n.sex === 'm' ? 'wife' : 'husband'}, ${n.late}, who ${by(x, ['was in the merchant navy', 'ran the post office for forty years', 'could whistle any tune you named', 'grew the best leeks in the county'])}.`; },
    opts: [
      { t: 'Stay for another cup', run(L, x) { busy(L, 1); warm(L, x, 12); L.joy(3); return 'The photographs come out. You stay until the light goes, and are given a slice of cake to take home in a paper napkin.'; } },
      { t: 'Say you will come on Sundays', run(L, x) { const n = N(L, x); n.f.sunday = 1; warm(L, x, 15); L.joy(2); return `${f(n)} says there is no need, and has the good cups out by Sunday.`; } },
      { t: 'Make your excuses', run(L, x) { warm(L, x, 2); return 'You say you must be getting on. You both pretend you have somewhere to be.'; } },
    ],
  },
  {
    id: 'stMilk2', icon: '🥛', title: 'The milk', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `Two pints of milk on ${f(n)}’s step this morning, and yesterday’s two beside them. The curtains are still drawn. It is eleven o’clock.`; },
    opts: [
      { t: 'Knock, and if there is no answer, break the door in', odds: (L, x) => { const n = N(L, x); return clamp(0.5 + n.st / 200 + (n.f.sunday ? 0.15 : 0), 0.2, 0.92); }, run: (L, x, win) => milk(L, x, win, 'door') },
      { t: (L, x) => `Ring ${his(N(L, x))} son`, odds: () => 0.35, run: (L, x, win) => milk(L, x, win, 'son') },
      { t: 'They will have gone to their sister’s', odds: () => 0.3, run(L, x, win) { const n = N(L, x); if (win) { warm(L, x, 2); return `${f(n)} comes home on Thursday from ${his(n)} sister’s with a stick of rock for you, and is touched that you noticed the milk.`; } L.karma(-1); return milk(L, x, false, 'late'); } },
    ],
  },
  {
    id: 'stMilk3', icon: '🌡️', title: 'The barometer', ok: okN((L, n) => !!n.f.saved),
    text: (L, x) => { const n = N(L, x); return `${f(n)} has decided to go into Seaview House, “before somebody has to break the door in again”. ${He(n)} wants you to have the barometer that has hung in ${his(n)} hall since 1958. It has said CHANGE every day for sixty years.`; },
    opts: [
      { t: 'Take it, and promise to visit', run(L, x) { const n = N(L, x); L.joy(5); L.karma(1); L.stGone(n, 'moved'); L.note(`${n.name} went into Seaview House, and gave you ${his(n)} barometer.`); return `It hangs in your hall now, saying CHANGE. You visit ${f(n)} at Seaview on the first Sunday of the month, and ${he(n)} tells the whole lounge who you are.`; } },
      { t: 'Ask them to stay, and say you will look in every day', check: ['charm', 40], run(L, x, win) { const n = N(L, x); if (win) { warm(L, x, 10); n.f.stay = 1; L.joy(3); return `${f(n)} stays. You look in every morning on your way out, and ${he(n)} has the kettle on before you knock.`; } L.joy(3); L.stGone(n, 'moved'); return `${f(n)} has made up ${his(n)} mind. The barometer comes to you anyway, and says CHANGE.`; } },
    ],
  },

  // ---- the Neighbourhood Watch ----
  {
    id: 'stWatch1', icon: '📋', title: 'The Neighbourhood Watch', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${n.name} is on your step with a clipboard. The Neighbourhood Watch meets on the first Tuesday of the month in ${his(n)} front room, there are biscuits, and the membership, at present, is ${f(n)}.`; },
    opts: [
      { t: 'Join', run(L, x) { N(L, x).f.join = 1; warm(L, x, 10); L.karma(1); return 'You are given a sticker for the window, a whistle, and the minutes of the last eleven meetings, to catch up.'; } },
      { t: 'Join, for the biscuits', run(L, x) { N(L, x).f.join = 1; warm(L, x, 6); L.joy(1); return 'The biscuits are very good. You attend faithfully.'; } },
      { t: 'Say you are out on Tuesdays', run(L, x) { warm(L, x, -5); return 'It goes in the log.'; } },
    ],
  },
  {
    id: 'stWatch2', icon: '🔦', title: 'On patrol', ok: okN((L, n) => !!n.f.join),
    text: (L, x) => { const n = N(L, x); return `You are on patrol with ${f(n)} and a torch when you see a figure climbing in through a back window, three doors down.`; },
    opts: [
      { t: 'Tackle them', check: ['fitness', 45], run(L, x, win) { if (win) { warm(L, x, 10); L.fame(1); L.karma(3); L.joy(5); return 'A real burglar, with a bag that says SWAG on it, more or less. You sit on him until the police come. The Gazette calls you “a have-a-go hero”.'; } L.hp(-2); L.joy(-2); return 'It is the vicar, locked out of her sister’s, in her cassock. She is very good about the bruise.'; } },
      { t: 'Write it in the log', run(L, x) { warm(L, x, 6); return 'It turns out to be the man at number nine, who has lost his keys again. It goes in the log, with the time.'; } },
      { t: 'Ring the police', odds: () => 0.5, run(L, x, win) { if (win) { warm(L, x, 8); L.karma(2); return 'They catch him at the end of the road with a television under each arm. The Watch is mentioned in the Gazette, which is framed.'; } warm(L, x, 2); return 'It is the window cleaner, working late. He is very nice about it, and does your windows free.'; } },
    ],
  },
  {
    id: 'stWatch2b', icon: '🗑️', title: 'Bin day', ok: okN((L, n) => !n.f.join),
    text: (L, x) => { const n = N(L, x); return `${f(n)} has put a note through your door about your bins, which have been out since Thursday, which is not bin day. It is signed “The Neighbourhood Watch”, which is ${f(n)}.`; },
    opts: [
      { t: 'Bring them in', run(L, x) { warm(L, x, 3); return 'You bring them in. A tick appears in a little book, somewhere.'; } },
      { t: 'Leave them out', run(L, x) { warm(L, x, -6); return 'The bins stay out. So, behind a net curtain, does a pair of binoculars.'; } },
    ],
  },
  {
    id: 'stWatch3', icon: '🐈', title: 'The split', ok: okN((L, n) => !!n.f.join),
    text: (L, x) => { const n = N(L, x); return `The Neighbourhood Watch has split down the middle over a cat that may or may not be leaving things on doorsteps, and ${f(n)} wants you to chair the meeting that will settle it.`; },
    opts: [
      { t: 'Chair it', check: ['charm', 45], run(L, x, win) { const n = N(L, x); if (win) { warm(L, x, 10); L.fame(0.5); L.karma(1); n.f.chair = 1; return 'By the end there is one Watch again, the cat has a name, and you are its chair, which you did not see coming.'; } warm(L, x, -3); return 'By the end there are two Watches, who patrol opposite sides of the road and do not wave.'; } },
      { t: 'Side with the cat', run(L, x) { warm(L, x, -8); L.joy(3); return 'You say the cat has as much right to the street as anybody. The cat, sitting on your wall, agrees.'; } },
    ],
  },

  // ---- the couple upstairs ----
  {
    id: 'stUp1', icon: '💃', title: 'Upstairs', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `It is Friday night, and upstairs ${f(n)} and ${n.other} are dancing again. It sounds like two people doing the foxtrot in wellingtons. Your lampshade is swinging.`; },
    opts: [
      { t: 'Go up and join in', check: ['charm', 30], run(L, x, win) { if (win) { warm(L, x, 12); L.joy(5); return 'You dance until one. Your lampshade, below, swings for three.'; } warm(L, x, 2); return 'They think you have come to complain, and turn it down, so embarrassed that you leave before you can say otherwise.'; } },
      { t: 'Bang on the ceiling with a broom', run(L, x) { warm(L, x, -8); return 'The foxtrot stops. A slow waltz begins, on tiptoe, which is somehow worse.'; } },
      { t: 'Put your own radio on', run(L) { L.joy(1); return 'You dance on your own in the kitchen. Nobody below you minds, because nobody is below you.'; } },
    ],
  },
  {
    id: 'stUp2', icon: '👶', title: 'A pram in the hall', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `There is a pram in the hall, and a very small person upstairs who does not believe in sleep. ${f(n)} catches you on the stairs, grey with tiredness, and asks if you would ever mind, just for an hour, so that ${n.other} and ${f(n)} could sleep.`; },
    opts: [
      { t: 'Mind the baby for an afternoon', run(L, x) { busy(L, 1); warm(L, x, 15); L.joy(3); return 'The baby sleeps the whole afternoon, on you, on the sofa, with a fist round your finger. Upstairs, so do they.'; } },
      { t: 'Say you have a cold', run(L, x) { warm(L, x, -3); return 'You cough, unconvincingly, for a week, whenever you meet on the stairs.'; } },
    ],
  },
  {
    id: 'stUp3', icon: '📦', title: 'Moving on', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)} and ${n.other} have bought a house with a garden, out on the Kettleby road. On the last morning they leave you the cheese plant, a key to nothing in particular, and a drawing of you by the baby, which is mostly circles.`; },
    opts: [
      { t: 'Help carry the boxes', run(L, x) { const n = N(L, x); L.gain('fitness', 0.5); L.joy(3); L.stGone(n, 'moved'); L.note(`${f(n)} and ${n.other} from upstairs moved out to a house with a garden.`); return 'Eleven boxes of books, a sofa that will not go round the bend in the stairs and then does. You wave them off with a cheese plant in your arms.'; } },
      { t: 'Wave from the window', run(L, x) { const n = N(L, x); L.joy(1); L.stGone(n, 'moved'); return 'The flat upstairs goes quiet. You find, after a week, that you miss the foxtrot.'; } },
    ],
  },

  // ---- the new family ----
  {
    id: 'stNew1', icon: '🏡', title: 'The new family', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `A removal van ${where(L)}, and a family unloading it in the rain: ${n.name}, ${his(n)} ${n.sex === 'm' ? 'wife' : 'husband'}, three children and a rabbit in a box marked FRAGILE.`; },
    opts: [
      { t: 'Take round a cake', check: ['craft', 25], run(L, x, win) { warm(L, x, win ? 15 : 6); return win ? 'The children eat it in the back of the van, with their hands. You are a hit.' : 'It is a little flat, but it is the thought, and the thought goes down well.'; } },
      { t: 'Lend a hand with the boxes', run(L, x) { warm(L, x, 10); L.gain('fitness', 0.5); return 'You carry boxes until dark. One of them clinks, all the way up the stairs.'; } },
      { t: 'Wave from the window', run(L, x) { warm(L, x, 1); return 'They wave back. The rabbit, in its box, does not.'; } },
    ],
  },
  {
    id: 'stNew2', icon: '🧒', title: 'A favour', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)} has a job interview in Kettleby on Thursday, and nobody to have the children.`; },
    opts: [
      { t: 'Have them for the day', run(L, x) { busy(L, 1); warm(L, x, 15); for (const k of L.kids()) if (k.age >= 3 && k.age < 13) L.bond(k, 3); L.joy(L.chance(0.5) ? 3 : -1); return `Three children, a den made of every cushion you own, and fish fingers twice. ${f(N(L, x))} gets the job.`; } },
      { t: 'You cannot, this week', run(L, x) { warm(L, x, -2); return 'They find somebody. You hear the interview went well, and are glad, and a little sorry.'; } },
    ],
  },

  // ---- the chip shop downstairs ----
  {
    id: 'stChip1', icon: '🍟', title: 'The end of the fryer', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `Closing time downstairs, and ${n.name} knocks with a paper parcel: the end of the fryer, too good to throw away. ${He(n)} wants nothing for it but the company, “my lover”.`; },
    opts: [
      { t: 'Eat them on the stairs together', run(L, x) { warm(L, x, 10); L.joy(3); L.hp(-0.5); return 'Chips on the stairs at half past eleven, with too much vinegar and the whole of the High Street’s gossip. It becomes a Friday thing.'; } },
      { t: 'Say thank you, and save them for tomorrow', run(L, x) { warm(L, x, 5); return 'Cold chips for breakfast. You would not swap them for anything.'; } },
    ],
  },
  {
    id: 'stChip2', icon: '🐟', title: 'Mind the shop', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)}’s ${by(x, ['daughter has gone into labour', 'back has gone, halfway through lifting a sack of potatoes'])}, and the Friday queue is out of the door. ${He(n)} looks up the stairs at you with the face of somebody drowning in batter.`; },
    opts: [
      { t: 'Put on the apron', check: ['craft', 30], run(L, x, win) { if (win) { L.cash(fee(L, 80)); warm(L, x, 20); L.gain('craft', 1); return 'A hundred and forty portions, and only one complaint, from a man who complains everywhere. There is an envelope for you afterwards, and free chips for life.'; } warm(L, x, 8); return 'You burn the batter, the fish and very nearly yourself, but the queue is served, and the queue is grateful.'; } },
      { t: 'You cannot fry', run(L, x) { warm(L, x, -3); return 'You hear the queue through the floor until ten o’clock, and feel every minute of it.'; } },
    ],
  },
  {
    id: 'stChip3', icon: '🍟', title: 'The chip shop', ok: okN((L) => !L.s.biz),
    text: (L, x) => { const n = N(L, x); return `${f(n)} is hanging up the apron. Thirty years of fish on Fridays, and ${his(n)} knees have had enough. ${He(n)} would rather the shop went to somebody ${he(n)} knows than to a chain: ${money(chipPrice(L))}, and ${he(n)} will take it out of the takings if you are short.`; },
    opts: [
      { t: 'Take it on, and pay now', cost: (L) => chipPrice(L), run: (L, x) => chips(L, x, false) },
      { t: 'Take it on, and pay out of the takings', run: (L, x) => chips(L, x, true) },
      { t: 'Wish them well', run(L, x) { const n = N(L, x); warm(L, x, 5); L.stGone(n, 'moved'); return `It goes to a chain from Exeter, who paint it orange. ${f(n)} still comes in on Fridays, to tut at the batter.`; } },
    ],
  },

  // ---- the shared bathroom ----
  {
    id: 'stBath1', icon: '🛁', title: 'The rota', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `There is a rota for the shared ${L.s.home === 'hostel' ? 'shower block' : 'bathroom'}, written by ${n.name} in three colours, and you are on it for Thursdays: the bath, the basin, and the thing behind the pipe that nobody mentions.`; },
    opts: [
      { t: 'Do your Thursdays', run(L, x) { warm(L, x, 6); L.joy(-1); return 'You do your Thursdays. A small gold star appears beside your name.'; } },
      { t: (L, x) => `Swap with ${f(N(L, x))} for Saturdays`, check: ['charm', 30], run(L, x, win) { warm(L, x, win ? 3 : -3); return win ? 'Saturdays it is. You have no idea why that is better, but it feels better.' : 'Swaps, you are told, are for emergencies, in writing, a week ahead.'; } },
      { t: 'Ignore the rota', run(L, x) { warm(L, x, -8); N(L, x).f.rota = 1; return 'A note appears on the bathroom door, in red, underlined.'; } },
    ],
  },
  {
    id: 'stBath2', icon: '🎶', title: 'Seven o’clock', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)} is in the bath at seven in the morning, singing the whole of ${by(x, ['Tosca', 'The Pirates of Penzance', 'Carmen'])}, including the bits for the orchestra. You need the bathroom at five past.`; },
    opts: [
      { t: 'Join in from the landing', check: ['craft', 35], run(L, x, win) { if (win) { warm(L, x, 12); L.joy(4); return 'A duet, through the door. Somebody on the landing applauds, and then everybody does.'; } warm(L, x, 4); return 'You do not know the words. The words, it turns out, are mostly Italian.'; } },
      { t: 'Bang on the door', run(L, x) { warm(L, x, -6); return 'The singing stops, mid-note. It is a very pointed silence.'; } },
      { t: 'Buy them a waterproof radio, as a hint', cost: (L) => fee(L, 25), run(L, x) { warm(L, x, 4); return 'The hint is not taken. The radio is played very loud, and sung along to.'; } },
    ],
  },
  {
    id: 'stBath3', icon: '🎭', title: 'The audition', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)} has an audition for the Pavilion Players and wants you to run lines, every evening for a week, in the bathroom, for the acoustics.`; },
    opts: [
      { t: 'Run the lines', check: ['charm', 35], run(L, x, win) { busy(L, 1); if (win) { warm(L, x, 15); L.joy(4); return 'The part is theirs. You are in the front row on the first night, and Desmond Achebe says he has not heard the like since the West End, where, he reminds everybody, he understudied.'; } warm(L, x, 8); return 'They do not get it, but they are given a very good small part, with a hat, and you are in the front row for that.'; } },
      { t: 'Say you are busy', run(L, x) { warm(L, x, -4); return 'The lines are run with the mirror, which, you hear, is a poor feed.'; } },
    ],
  },

  // ---- the hostel ----
  {
    id: 'stSailor1', icon: '⚓', title: 'The albatross', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${n.name}, in the bunk below, has been everywhere twice, and tonight ${he(n)} is telling the whole of Dormitory B about the albatross. Again. With actions.`; },
    opts: [
      { t: 'Ask about the albatross', run(L, x) { warm(L, x, 10); L.joy(3); L.gain('smarts', 0.3); return 'It is a different albatross from last time, and a better one. You are asleep before the end, and dream about it.'; } },
      { t: 'Put the pillow over your head', run(L, x) { warm(L, x, -3); return 'You hear it anyway, through the pillow, with the actions.'; } },
    ],
  },
  {
    id: 'stSailor2', icon: '⚓', title: 'A word in your ear', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)} leans over at breakfast: the harbour wants hands for the night tide on Thursday, cash, and ${he(n)} has put your name in.`; },
    opts: [
      { t: 'Go down at five in the morning', run(L, x) { busy(L, 1); const pay = fee(L, 450); L.cash(pay); L.s.n.earned += pay; L.gain('fitness', 1); warm(L, x, 5); return `Cold, wet, heavy work, and the best bacon roll of your life at the end of it, and ${money(pay)} in your hand.`; } },
      { t: 'Thank them, but no', run(L, x) { warm(L, x, -2); return 'There will be other tides, says the old sailor. There always are.'; } },
    ],
  },
  {
    id: 'stSailor3', icon: '🚢', title: 'A ship', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)} has a ship at last: a coaster out of Falmouth, bound for Bilbao and then anywhere. ${He(n)} is leaving you ${his(n)} sea chest, which ${he(n)} says is worth a fortune, and which holds a compass, a jumper and a tin of humbugs.`; },
    opts: [
      { t: 'See them off at the station', run(L, x) { const n = N(L, x); L.joy(5); L.stGone(n, 'moved'); L.note(`${n.name} went back to sea, and left you a sea chest.`); return 'You carry the bag to the train. The compass points north, more or less, for the rest of your life.'; } },
      { t: 'Wish them a fair wind', run(L, x) { const n = N(L, x); L.joy(3); L.stGone(n, 'moved'); return 'A fair wind, and a following sea. The bunk below is very quiet that night.'; } },
    ],
  },
  {
    id: 'stStudent1', icon: '📚', title: 'Three in the morning', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${n.name}, ${where(L)}, is awake at three in the morning with an anatomy book and a torch, crying very quietly. The exams are on Monday.`; },
    opts: [
      { t: (L, x) => `Test ${him(N(L, x))} on the bones of the hand`, check: ['smarts', 30], run(L, x, win) { const n = N(L, x); n.f.help = 1; warm(L, x, win ? 12 : 6); L.gain('smarts', 0.5); return win ? 'Scaphoid, lunate, triquetrum. By four o’clock you both know them. By five you are both asleep on the book.' : 'You get the bones muddled, and so do they, and then you both laugh, which helps more.'; } },
      { t: 'Make a cup of tea', run(L, x) { warm(L, x, 8); return 'Two sugars, and a biscuit. It does not help with the bones, but it helps.'; } },
      { t: 'Roll over', run(L, x) { warm(L, x, -2); return 'You roll over. The torch goes on until dawn.'; } },
    ],
  },
  {
    id: 'stStudent2', icon: '🎓', title: 'Results', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)} has passed, and been taken at the medical school in the city. ${He(n)} hugs you, which is a first, and leaves you the torch.`; },
    opts: [{
      t: 'Wish them luck',
      run(L, x) {
        const n = N(L, x), S2 = S(L);
        L.joy(3);
        // (Somebody you helped may be at the end of a hospital bed one day: see stDoctor.)
        S2.past.push({ name: n.name, sex: n.sex, role: 'student', st: n.st, f: { doc: n.f.help ? 1 : 0 }, t: L.s.t });
        if (S2.past.length > 12) S2.past.shift();
        L.stGone(n, 'moved');
        return 'You wave the train out. You keep the torch in the drawer by your bed, for no reason you could give.';
      },
    }],
  },

  // ---- the cliff road and the hill ----
  {
    id: 'stPosh1', icon: '🫧', title: 'The hot tub', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `It is two in the morning, and ${n.name}’s hot tub is lit up purple, then green, then purple, and there are people in it singing a song about Ibiza.`; },
    opts: [
      { t: 'Go round in your dressing gown', check: ['charm', 40], run(L, x, win) { if (win) { warm(L, x, 12); L.joy(4); return 'You are handed a glass and a towel, and get in. You are home at four, wrinkled, and on first-name terms with a man who sells yachts.'; } warm(L, x, -6); return 'You are told, kindly, to “chill out”. You go home and do not chill out.'; } },
      { t: 'Ring the council about the noise', run(L, x) { feud(L, x, 1, -15); return 'A man from the council comes, a week later, at noon, when it is very quiet. The lights change colour at you that night, pointedly.'; } },
      { t: 'Put a pillow over your head', run(L) { L.joy(-2); return 'You can see the colours through the pillow.'; } },
    ],
  },
  {
    id: 'stPosh2', icon: '📐', title: 'Plans', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)} has applied to build ${by(x, ['a glass box on the very edge of the cliff', 'a helipad'])}, which will look straight down into your garden.`; },
    opts: [
      { t: 'Object at the planning meeting', check: ['charm', 45], run(L, x, win) { if (win) { feud(L, x, 1, -20); return 'The committee turns it down. You do not look across the room at the end. You do not need to.'; } feud(L, x, 1, -10); L.joy(-3); return 'It goes through. It goes up. It looks straight down into your garden, and at night it glows.'; } },
      { t: 'Ask them to change it', check: ['charm', 40], run(L, x, win) { if (win) { warm(L, x, 6); return 'A row of trees goes in along the boundary, and the glass is frosted on your side. Everybody is a little pleased with themselves.'; } warm(L, x, -4); return 'You are told it is “all about the light”. The light is yours, you say. It is no good.'; } },
      { t: 'Wish them luck with it', run(L, x) { warm(L, x, 10); L.joy(-2); return 'You are asked to the opening, which has a DJ.'; } },
    ],
  },
  {
    id: 'stPosh3', icon: '🌊', title: 'The cliff', ok: okN((L, n) => n.feud >= 1),
    text: (L, x) => { const n = N(L, x); return `The cliff has given way in the night under the end of ${f(n)}’s garden. The hot tub is on the beach, its lights still going, purple and green, and the family is standing in the road in its dressing gowns.`; },
    opts: [
      { t: 'Offer them your spare room', run(L, x) { const n = N(L, x); L.stMended(n); warm(L, x, 10); L.karma(2); return 'They stay a month. By the end of it you know how to work forty-one hot tub settings and they know how to make a pot of tea, and nobody can remember what the fuss was about.'; } },
      { t: 'Watch from the window with a cup of tea', run(L) { L.joy(2); L.karma(-1); return 'It is, you tell yourself, very sad. You have a second cup.'; } },
    ],
  },
  {
    id: 'stJudge1', icon: '🃏', title: 'A fourth for bridge', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${n.name} has lost ${his(n)} fourth for bridge to a hip, and would be obliged if you could make one up on Wednesday. ${He(n)} says it as though handing down a sentence.`; },
    opts: [
      { t: 'Learn the rules', check: ['smarts', 40], run(L, x, win) { L.gain('smarts', 1); if (win) { warm(L, x, 12); return 'You win a rubber. The judge says “well played” in a voice of mild astonishment, and asks you back.'; } warm(L, x, 5); return 'You trump your partner’s ace. The judge says he has seen worse in the dock, though not often.'; } },
      { t: 'Decline', run(L, x) { warm(L, x, -5); return 'The judge inclines his head, as if noting it for sentencing.'; } },
    ],
  },
  {
    id: 'stJudge2', icon: '📜', title: 'The memoirs', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)} has written ${his(n)} memoirs: four hundred pages, typed, mostly about other people, and wants a reader “with no legal training and an open mind”.`; },
    opts: [
      { t: 'Read them', run(L, x) { busy(L, 1); warm(L, x, 10); L.gain('smarts', 1); L.joy(2); return 'The chapter about the goat is the best thing you have ever read. You say so. The judge goes slightly pink.'; } },
      { t: 'Say you are snowed under', run(L, x) { warm(L, x, -4); return 'The memoirs go to the vicar instead, who reads them in a night and is never quite the same.'; } },
    ],
  },
  {
    id: 'stLady1', icon: '🌹', title: 'The Grange', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${n.name} of the Grange has come to look at your garden, which she does from the gate, through a lorgnette, which you had not known people still had.`; },
    opts: [
      { t: 'Show her round', check: ['charm', 45], run(L, x, win) { warm(L, x, win ? 10 : -3); return win ? 'She stops at the roses and says nothing for a long time, which, you are told later, is the highest praise she gives.' : 'She says “how brave” about the borders, and you are not sure, then or later, what she meant.'; } },
      { t: 'Ask her advice', run(L, x) { warm(L, x, 8); L.gain('craft', 1); const g = L.stGardenOf(); if (g) g.care = clamp(g.care + 10, 0, 100); return 'She talks for an hour, in Latin, and you take notes. The garden is the better for it, and you suspect she knows it.'; } },
      { t: 'Say you have no interest in prizes', run(L, x) { warm(L, x, -6); return 'She lowers the lorgnette. “Everybody,” she says, “has an interest in prizes.”'; } },
    ],
  },
  {
    id: 'stLady2', icon: '🍰', title: 'Tea at the Grange', ok: okN(),
    text: (L, x) => { const n = N(L, x); return n.f.beaten ? `${f(n)} has asked you to tea. She has not asked anybody to tea since 1987. Over the cucumber sandwiches she says she has decided that, if she has to be beaten, she would rather it were by you.` : `${f(n)} is giving up the Grange garden at last, to a man with a strimmer, and has asked you, of all people, to take her dahlias. They have names.`; },
    opts: [
      { t: (L, x) => (N(L, x).f.beaten ? 'Go to tea' : 'Take the dahlias'), run(L, x) { const n = N(L, x); if (n.feud) L.stMended(n); warm(L, x, 20); L.joy(4); return n.f.beaten ? 'Tea from cups so thin you can see the sun through them, and a long afternoon. You come away with an ally, and a cake.' : 'Forty dahlias in pots, each with its name on a label in copperplate. You never get them all right. She never stops asking after them.'; } },
    ],
  },
  {
    id: 'stLodge1', icon: '🏚️', title: 'The lodge roof', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${n.name} from the lodge comes up to the house with ${his(n)} cap in ${his(n)} hands. The lodge roof is leaking into the bedroom, and has been since the spring, and ${he(n)} would not ask, only it has got into the bed. You are ${his(n)} landlord.`; },
    opts: [
      { t: 'Have it done properly', cost: (L) => fee(L, 12000), run(L, x) { warm(L, x, 25); L.karma(2); return 'Penwarden & Sons re-roof the lodge in a fortnight. The old man stands in the lane and watches every slate go on.'; } },
      { t: 'Send Daz', cost: (L) => fee(L, 4000), run(L, x) { warm(L, x, 8); return 'Daz patches it in an afternoon. It keeps the rain out of the bed, which was all that was asked.'; } },
      { t: 'Not this year', run(L, x) { warm(L, x, -15); L.karma(-1); N(L, x).f.no = 1; return 'He says he understands, and puts his cap back on, and walks back down to the lodge in the rain.'; } },
    ],
  },
  {
    id: 'stLodge2', icon: '🗝️', title: 'A door in the cellar', ok: okN(),
    text: (L, x) => { const n = N(L, x); return `${f(n)} would like to show you something: a door in the manor cellar that ${he(n)} says nobody has opened since ${his(n)} grandfather’s time.`; },
    opts: [
      { t: 'Open it', odds: () => 0.5, run(L, x, win) { warm(L, x, 6); if (win) { const n2 = fee(L, 8000); L.cash(n2); L.joy(6); return `A rack of port laid down in 1927, and a painting in a sheet. The port goes to auction in London for ${money(n2)}, and the painting, which is of a horse, goes in your hall.`; } L.joy(2); return 'Coal, a dead rat, and the smell of 1927. You are both a little disappointed, and laugh about it all the way up the stairs.'; } },
      { t: 'Leave it shut', run(L, x) { warm(L, x, 3); L.joy(1); return 'Some doors are better shut. The old man agrees, and seems relieved.'; } },
    ],
  },
];

// The old one next door, found or not found.
function milk(L, x, win, how) {
  const n = N(L, x), S2 = S(L);
  if (win) {
    n.f.saved = 1; S2.n.saved++;
    L.stWarm(n, 30); L.karma(4); L.joy(3);
    L.note(`Found ${n.name} after a fall, in time.`, 'big');
    return how === 'door' ? `${f(n)} is on the kitchen floor, cold and cross, with a broken hip, and alive. The ambulance takes ${him(n)} to St Wren’s. A week later there is a fruit cake on your step, with a note: “For the door.”` : `The son rings back within the hour: ${he(n)} has a key and a friend round the corner, who finds ${f(n)} on the floor with a broken hip, alive and furious. There is a fruit cake on your step a week later.`;
  }
  L.joy(-6);
  L.stGone(n, 'died');
  L.note(`${n.name} died, alone, in ${his(n)} chair by the window.`);
  return how === 'late' ? `${He(n)} had not gone to ${his(n)} sister’s. The postman found ${him(n)} on Friday, in ${his(n)} chair by the window. You think about the milk for a long time.` : `You are too late. ${He(n)} went in the night, the doctor says, in ${his(n)} chair by the window, looking at the garden. You go to the funeral. There are four people there, and you are one of them.`;
}
// The chip shop: what it would take, and taking it.
function chipPrice(L) { return fee(L, 6000); }
function chips(L, x, owe) {
  const n = N(L, x), s = L.s, p = chipPrice(L);
  if (owe) s.street.owe.push({ what: `Paying ${f(n)} for the chip shop`, left: p, each: Math.ceil(p / 12 / 10) * 10 });
  s.biz = { type: 'food', lvl: 1, rep: 55, mgr: false, age: 0, at: s.t, paid: p };
  n.f.sold = 1;
  L.stWarm(n, 10); L.joy(10);
  L.note(`Took on the chip shop below the bedsit from ${n.name}.`, 'big');
  return `Your name goes up over the door, under the old one, which stays. ${f(n)} comes in at four every Friday to do the batter and tell you you are doing it wrong. (It is on the books as a café, which it more or less is: work in it on the High Street.)`;
}
export { HOMES };
