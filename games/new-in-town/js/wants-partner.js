// New in Town: the cards about the person you share your life with (the
// rules that bring them up are in wants.js). Their ambitions, each a chain
// of cards over years; wanting a child, or not; anniversaries remembered
// and forgotten; rough patches; somebody at their work; their parents; and
// an illness to see them through.

import { ITEMS, money } from './data.js';
import {
  clamp, he, He, him, his, His, first, cap, P, isLove, rec, been, price, fee, busy, perf, grow, young, tr, ti, trait,
  AMBITIONS, SHOPS, DEGREE_JOB, MILESTONES, ORD,
} from './wants-lib.js';

// Still yours, and not inside.
const mine = (L, x) => { const p = L.person(x && x.p); return !!p && isLove(p) && !L.s.gaol; };
const amb = (L, x) => (rec(L, P(L, x)).am || []).find((a) => a.id === x.a) || null;
// This ambition, at this stage, still waiting.
const at = (i) => (L, x) => { if (!mine(L, x)) return false; const a = amb(L, x); return !!a && a.out == null && a.st === i; };
const next = (L, a, lo, hi) => { a.st++; a.at = L.s.t + L.int(lo, hi); };
// An ambition comes to an end. out: won, lost, held (you held them back), home.
export function endAmb(L, p, a, out) {
  const r = rec(L, p), W = L.s.wants;
  a.out = out; a.at = null; a.end = L.s.t;
  const n = (r.am || []).find((q) => q.out == null && q !== a);
  if (n && n.at == null) n.at = L.s.t + L.int(8, 16);
  if (out === 'won') {
    W.n.amb++;
    L.say(AMBITIONS[a.id].icon, `${first(p)}’s dream came true`, 'good');
    const said = { band: `a record with ${r.band}`, city: 'a career in the city', study: 'a degree', shop: `the opening of ${r.shop ? r.shop.sign : 'a shop'}`, sail: 'a voyage round the world', garden: 'the making of a garden' }[a.id];
    const T = W.tales, t = `stood behind ${first(p)} through ${said}`;
    if (!T.includes(t)) T.push(t);
    if (T.length > 6) T.shift();
  }
}
// Money a partner brings home, by what it comes from: { band: { n, until }, ... }.
const earn = (r, k, n, until) => { r.inc = r.inc || {}; r.inc[k] = { n, until }; };
const sup = (a, d) => { a.sup = (a.sup || 0) + d; };
const sore = (r, d) => { r.sore = Math.max(0, (r.sore || 0) + d); };
const kidsLine = (L, t) => (young(L, 12).length ? ` ${t}` : '');
// Ending things, as the card that does it says so. The one who strayed takes less: the judge sees to that.
function leave(L, p, theirFault) {
  const s = L.s, had = s.cash + s.bank;
  const said = L.split(p, !theirFault, theirFault ? 60 : 30);
  const took = had - (s.cash + s.bank);
  if (theirFault && took > 0) { L.cash(Math.round(took / 2)); return `${said} The judge, who has heard the whole story, sees that you keep more than most.`; }
  return said;
}

export const PARTNER_CARDS = [
  // ---- the band ----
  {
    id: 'wantsBand1', icon: '🎸', title: 'The old band', ok: at(0),
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return `Before you met, ${first(p)} played ${r.inst} in a band called ${r.band}. The others have been in touch: they are getting back together. Practice is Tuesdays and Thursdays, and there is a gig every other Saturday. ${He(p)} is trying very hard to sound as if ${he(p)} does not mind either way.`; },
    opts: [
      { t: 'Go for it, and be at the front for every gig', run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, 2); L.bond(p, 7); L.joy(3); busy(L, 1); next(L, a, 6, 10); been(L, p, `You were at the front for ${r.band}’s first gig back.`); return `The first gig is at the Gull, to forty people and a dog. By the last song you know all the words, and ${first(p)} comes off stage glowing.`; } },
      { t: (L, x) => `Buy ${him(P(L, x))} some proper gear`, cost: (L) => price(L, 600), run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 2); L.bond(p, 8); next(L, a, 6, 10); return `It arrives in a box the size of a wardrobe, and the neighbours have views. ${first(p)} plays you one song on it, very loud, then puts the kettle on as if nothing has happened.`; } },
      { t: 'Of course: go', run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 1); L.bond(p, 3); next(L, a, 6, 10); return `On Tuesdays and Thursdays the house is very quiet, and ${first(p)} comes home humming.`; } },
      { t: 'That is a lot of evenings', run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, -2); L.bond(p, -6); sore(rec(L, p), 1); next(L, a, 8, 12); return `${He(p)} goes to one practice in three, and stops humming.`; } },
    ],
  },
  {
    id: 'wantsBand2', icon: '🚐', title: 'On the road', ok: at(1),
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return `A band you have actually heard of wants ${r.band} as their support act: eleven weeks, thirty towns, and a van with a bunk in the back. ${first(p)} would be gone for the whole season. ${He(p)} has not said yes. ${He(p)} has not said no, either.`; },
    opts: [
      { t: 'Go: we will manage', run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, 2); L.bond(p, 6); r.away = L.s.t + 1; r.awayWhy = 'band'; a.win = L.chance(clamp(0.2 + 0.08 * a.sup, 0.1, 0.65)); next(L, a, 2, 4); return `${He(p)} rings every night from a different car park, and sends a postcard from every town.${kidsLine(L, 'The children cross the days off on the calendar.')}`; } },
      {
        t: 'Go along too, and take unpaid leave', cost: (L) => price(L, 800),
        why: (L) => (young(L, 12).length ? 'Somebody has to mind the children.' : null),
        run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, 3); busy(L, 4); perf(L, -10); L.joy(10); L.bond(p, 12); L.gain('charm', 1); a.win = L.chance(clamp(0.2 + 0.08 * a.sup, 0.1, 0.65)); next(L, a, 2, 4); been(L, p, `Spent a season on tour with ${r.band}, selling T-shirts out of the back of a van.`); return 'Thirty towns, thirty car parks, one van. You sell the T-shirts, you learn to sleep sitting up, and on the last night, in a club in the north, the whole room sings the chorus back at the band. Work has not forgotten you were gone.'; },
      },
      { t: (L, x) => `Ask ${him(P(L, x))} not to go`, run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, -3); L.bond(p, -12); sore(r, 2); endAmb(L, p, a, 'held'); return `${He(p)} does not go. ${He(p)} does not say much about it, then or later. The band goes without ${him(p)}, with a drummer from Kettleby.`; } },
    ],
  },
  {
    id: 'wantsBand3', icon: '🎶', title: (L, x) => (amb(L, x) && amb(L, x).win ? 'A letter from a record label' : 'The end of the band'), ok: at(2),
    text: (L, x) => {
      const p = P(L, x), r = rec(L, p), a = amb(L, x);
      return a && a.win ? `A letter from a record label in the city, on very thick paper. They want ${r.band} to make a record. ${first(p)} reads it four times, then hands it to you without a word.` : `${r.band} have broken up, the way bands do: over the van, a girlfriend, and the order of the songs. ${first(p)} has put ${r.inst === 'the drums' ? 'the drum kit in the loft' : 'the gear under the bed'}, and says it does not matter.`;
    },
    opts: [
      { t: 'Open the good bottle', show: (L, x) => !!(amb(L, x) && amb(L, x).win), run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.bond(p, 8); L.joy(8); p.job = 'arts'; earn(r, 'band', price(L, 350), L.s.t + 16); endAmb(L, p, a, 'won'); been(L, p, `Saw ${r.band} make a record.`); L.note(`${first(p)}’s band, ${r.band}, made a record.`, 'big'); return 'The record comes out in the spring. You hear it on the radio in Betty’s café, and have to sit down. A little money comes in from it, every season, for a few years.'; } },
      { t: 'Read the contract before anybody signs', show: (L, x) => !!(amb(L, x) && amb(L, x).win), check: ['smarts', 45], run(L, x, win) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.bond(p, 6); p.job = 'arts'; earn(r, 'band', price(L, win ? 550 : 300), L.s.t + 16); endAmb(L, p, a, 'won'); been(L, p, `Saw ${r.band} make a record.`); return win ? 'You find clause nineteen, which would have given the label the band’s van, their songs and, arguably, their souls. It comes out. The record does well, and so do they.' : 'It is forty pages long and you understand the first two. They sign anyway. The record does well enough.'; } },
      { t: (L, x) => `Tell ${him(P(L, x))} it was worth it`, show: (L, x) => !(amb(L, x) && amb(L, x).win), run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, a.sup >= 2 ? 9 : 4); L.joy(2); endAmb(L, p, a, 'lost'); been(L, p, `Saw ${first(p)} through the end of the band.`); return `"It was, wasn’t it?" ${he(p)} says, and gets the photographs out, and you look at all of them.`; } },
      { t: 'Frame the last set list, and hang it in the hall', show: (L, x) => !(amb(L, x) && amb(L, x).win), run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, 6); endAmb(L, p, a, 'lost'); return `${first(p)} pretends to find it embarrassing, and straightens it every time ${he(p)} walks past.`; } },
      { t: 'Say you always thought it would end like this', show: (L, x) => !(amb(L, x) && amb(L, x).win), run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, -8); sore(rec(L, p), 1); endAmb(L, p, a, 'lost'); return 'You were right. Nobody thanks you for it.'; } },
    ],
  },

  // ---- a job in the city ----
  {
    id: 'wantsCity1', icon: '🏙️', title: 'An offer from the city', ok: at(0),
    text: (L, x) => { const p = P(L, x); return `${first(p)} has been offered a job with a big firm in the city: twice the money, a desk by a window, and two hours on the train each way. Or a room up there in the week, and home on Friday nights.${kidsLine(L, 'The children would see a lot less of ' + him(p) + '.')}`; },
    opts: [
      { t: 'Take it: home on Fridays', run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, 2); L.bond(p, 3); r.city = { mode: 'week', up: 0, n: price(L, 1200) }; next(L, a, 6, 10); return `The first Sunday night is the worst. After that it is only nearly the worst.${kidsLine(L, 'You do the school run, the bath and the bedtime story, and fall asleep on the sofa by nine.')}`; } },
      { t: 'Take it, and do the train every day', run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, 2); L.bond(p, 4); r.city = { mode: 'train', up: 0, n: price(L, 800) }; next(L, a, 6, 10); return `Up at half past five, home at eight, asleep by nine. The money is very good. ${first(p)} knows everybody on the 6.10 by name.`; } },
      { t: (L, x) => `Ask ${him(P(L, x))} to turn it down`, run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, -3); L.bond(p, -10); sore(r, 2); endAmb(L, p, a, 'held'); return `${He(p)} rings them on Monday and says no. ${He(p)} keeps the letter, though. You find it in a drawer years later, folded very small.`; } },
      {
        t: (L, x) => `Say it is ${his(P(L, x))} decision`,
        run(L, x) {
          const p = P(L, x), r = rec(L, p), a = amb(L, x);
          if (p.bond >= 60) { L.bond(p, 5); endAmb(L, p, a, 'home'); been(L, p, `${first(p)} turned down the city to stay with you.`); return `${He(p)} thinks about it for a week, and turns it down. "Everything I want is here," ${he(p)} says, and seems to mean it.`; }
          sup(a, 1); L.bond(p, 1); r.city = { mode: 'week', up: 0, n: price(L, 1200) }; next(L, a, 6, 10);
          return `${He(p)} thinks about it for a week, and takes it. ${He(p)} would have liked you to ask ${him(p)} to stay, you suspect, and would have gone anyway.`;
        },
      },
    ],
  },
  {
    id: 'wantsCity2', icon: '🚆', title: 'The Friday train', ok: at(1),
    text: (L, x) => { const p = P(L, x); return `${first(p)} has been offered a promotion: more money again, if ${he(p)} moves up to the city for good, and takes a flat that comes with it. ${He(p)} asks, carefully, whether you would ever think of coming too. You both know you would not leave the Bay.`; },
    opts: [
      { t: (L, x) => `Ask ${him(P(L, x))} to come home`, run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.bond(p, (a.sup || 0) >= 2 ? 6 : -3); r.city = null; endAmb(L, p, a, 'home'); been(L, p, `${first(p)} gave up the city and came home.`); return `${He(p)} hands in ${his(p)} notice the next day and comes home with a pot plant, a leaving card and a great many stories about a man called Duncan.`; } },
      { t: 'Take the promotion, and keep the weekends', run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sore(r, 1); r.city = { mode: 'week', up: 1, n: r.city && r.city.n ? r.city.n : price(L, 1200) }; for (const k of young(L)) L.bond(k, -3); a.win = L.chance(0.5); next(L, a, 6, 10); return `The money goes up and the Fridays get later.${kidsLine(L, 'The children save up their news all week, and by Friday night have forgotten half of it.')}`; } },
      {
        t: (L, x) => `Help ${him(P(L, x))} find something nearer home`, check: ['charm', 50],
        run(L, x, win) {
          const p = P(L, x), r = rec(L, p), a = amb(L, x);
          if (win) { L.bond(p, 8); r.city = null; earn(r, 'near', price(L, 400), null); endAmb(L, p, a, 'won'); been(L, p, `Helped ${first(p)} find a good job close to home.`); return 'You ask everybody you know, and one of them knows a firm in Kettleby that needs exactly what the city taught. Twenty minutes on the bus, and home for tea.'; }
          L.bond(p, 1); a.win = L.chance(0.5); next(L, a, 6, 10); return 'You ask everybody you know. Nobody needs what the city taught. The Friday train it is, for now.';
        },
      },
    ],
  },
  {
    id: 'wantsCity3', icon: '🏢', title: (L, x) => (amb(L, x) && amb(L, x).win ? 'A partner in the firm' : 'Home with a box'), ok: at(2),
    text: (L, x) => { const p = P(L, x), a = amb(L, x); return a && a.win ? `The firm has made ${first(p)} a partner. There is a party in the city with canapés nobody can identify, and from now on ${he(p)} can work from home three days a week.` : `The firm has been bought by a bigger firm, and ${first(p)}’s desk by the window has gone to somebody called Duncan. ${He(p)} comes home on a Tuesday, with a box.`; },
    opts: [
      { t: 'Go to the party in your good coat', show: (L, x) => !!(amb(L, x) && amb(L, x).win), run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); busy(L, 1); L.bond(p, 6); L.joy(4); r.city = null; earn(r, 'part', price(L, 900), null); endAmb(L, p, a, 'won'); been(L, p, `Saw ${first(p)} made a partner in the firm.`); return `You eat something that may have been a fig. ${first(p)} introduces you to everybody as "the reason I kept coming home".`; } },
      { t: 'Welcome home, properly', show: (L, x) => !(amb(L, x) && amb(L, x).win), run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.bond(p, 8); r.city = null; endAmb(L, p, a, 'lost'); return `A bath, a curry and an early night. By the weekend ${first(p)} has started to look like ${him(p)}self again.`; } },
      { t: 'Look on the bright side: you get your Fridays back', show: (L, x) => !(amb(L, x) && amb(L, x).win), run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.joy(3); L.bond(p, 3); r.city = null; endAmb(L, p, a, 'lost'); return 'And your Saturdays, and a good part of your Sundays. It takes some getting used to.'; } },
    ],
  },

  // ---- a degree ----
  {
    id: 'wantsStudy1', icon: '🎓', title: 'Back to school', ok: at(0),
    text: (L, x) => { const p = P(L, x); return `${first(p)} left school at sixteen and has minded ever since. The college does a degree in the evenings: three years of essays, a library card, and ${money(price(L, 4000))} in fees.`; },
    opts: [
      { t: 'Pay for it', cost: (L) => price(L, 4000), run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 3); L.bond(p, 8); next(L, a, 4, 6); return `${He(p)} buys a rucksack and a ring binder, and looks about nineteen.`; } },
      { t: ti('bookish', 'Pay for it, and read the reading list too'), show: tr('bookish'), cost: (L) => price(L, 4000), run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 4); L.bond(p, 10); L.gain('smarts', 1); next(L, a, 4, 6); return 'You read every book on the list a week ahead, and argue about all of them over supper. It is the best year the two of you have had for conversation.'; } },
      { t: (L, x) => `${He(P(L, x))} can take a student loan`, run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, 1); L.bond(p, 3); r.sloan = 1; next(L, a, 4, 6); return `${He(p)} signs the forms without a word. The loan will want paying back, out of the house-keeping, for some years after.`; } },
      { t: 'Not now, with money as it is', run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, -2); L.bond(p, -8); sore(rec(L, p), 1); endAmb(L, p, a, 'held'); return `"Not now," you say. "Maybe later." ${He(p)} puts the prospectus in the recycling, and neither of you says "later" again.`; } },
    ],
  },
  {
    id: 'wantsStudy2', icon: '📝', title: 'Three in the morning', ok: at(1),
    text: (L, x) => { const p = P(L, x); return `It is three in the morning and ${first(p)} is at the kitchen table, with a cold cup of tea and ten thousand words of dissertation, crying over a footnote.`; },
    opts: [
      { t: 'Read it through with a red pen', check: ['smarts', 45], run(L, x, win) { const p = P(L, x), a = amb(L, x); L.gain('smarts', 0.5); if (win) { sup(a, 2); L.bond(p, 6); next(L, a, 4, 6); return 'You find the missing reference, two wrong dates and a better title. By breakfast it is finished, and good.'; } L.bond(p, 2); next(L, a, 4, 6); return 'You make it worse, then make toast. It is finished by the deadline, just.'; } },
      { t: 'Take the children out all weekend, so it can get done', show: (L) => young(L, 16).length > 0, run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 1); busy(L, 2); L.bond(p, 6); for (const k of young(L, 16)) L.bond(k, 4); next(L, a, 4, 6); return 'The pier, the castle, the pier again. When you get back the house is silent, and there is a full stop at the end of the last page.'; } },
      { t: 'Make tea, and sit with them', run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 1); L.bond(p, 4); next(L, a, 4, 6); return 'You do not understand a word of it. That is not what is wanted. You sit, and the tea is hot, and the footnote gets done.'; } },
      { t: (L, x) => `Tell ${him(P(L, x))} to pack it in, if it makes ${him(P(L, x))} this unhappy`, run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, -2); if (L.chance(0.5)) { L.bond(p, -6); endAmb(L, p, a, 'lost'); return `${He(p)} looks at you for a long time, then closes the laptop. ${He(p)} never opens that file again.`; } L.bond(p, -3); next(L, a, 4, 6); return `"I am not stopping now," ${he(p)} says, through ${his(p)} teeth, and does not.`; } },
    ],
  },
  {
    id: 'wantsStudy3', icon: '🎓', title: 'Graduation', ok: at(2),
    text: (L, x) => { const p = P(L, x), a = amb(L, x); return `${first(p)} graduates on Thursday, in a gown and a hat with a tassel, in the big hall at the college. ${a && a.sup >= 4 ? 'With first-class honours, no less.' : 'With a good, solid degree, and nobody can take it away.'}`; },
    opts: [
      { t: 'Front row, with a camera', run(L, x) { const p = P(L, x), a = amb(L, x); busy(L, 1); L.joy(6); L.bond(p, 10); graduate(L, p, a); return 'You clap until your hands hurt, and take forty photographs of the back of somebody’s head.'; } },
      { t: 'Throw a party afterwards', cost: (L) => price(L, 500), run(L, x) { const p = P(L, x), a = amb(L, x); L.joy(5); L.bond(p, 8); for (const q of L.friends().slice(0, 8)) L.bond(q, 2); graduate(L, p, a); return `Bunting, a cake shaped like a scroll, and ${first(p)} in the hat all evening.`; } },
      { t: 'You cannot get away from work', run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, -8); perf(L, 2); graduate(L, p, a); return `${He(p)} sends you a photograph. ${He(p)} is smiling in it, mostly.`; } },
    ],
  },

  // ---- a business of their own ----
  {
    id: 'wantsShop1', icon: '🏪', title: 'A ring binder', ok: at(0),
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return `${first(p)} has a plan, and it is in a ring binder: ${r.shop.a} in the old chandlery on Harbour Row, to be called ${r.shop.sign}. ${He(p)} has done the sums twice. ${He(p)} is ${money(price(L, 12000))} short.`; },
    opts: [
      { t: 'Put up all of it', cost: (L) => price(L, 12000), run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, 3); L.bond(p, 10); r.biz = { hp: 55, stake: price(L, 12000) }; next(L, a, 4, 6); L.note(`Put up the money for ${first(p)}’s ${r.shop.a.replace(/^an? /, '')}, ${r.shop.sign}.`); return `${r.shop.sign} opens on a Saturday in the rain. There is a queue anyway, mostly your friends.`; } },
      { t: 'Put up half', cost: (L) => price(L, 6000), run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, 2); L.bond(p, 5); r.biz = { hp: 48, stake: price(L, 6000) }; next(L, a, 4, 6); return `The bank finds the rest, on terms ${first(p)} reads out to you in a funny voice. ${r.shop.sign} opens in the spring.`; } },
      { t: 'Go through the sums with them first', check: ['smarts', 50], run(L, x, win) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, 1); L.bond(p, 4); r.biz = { hp: win ? 62 : 42, stake: 0 }; next(L, a, 4, 6); return win ? 'You find a cheaper oven, a better lease and a grant from the council nobody had heard of. The bank lends the rest without a murmur.' : 'You go through the sums and make them worse. The bank lends the money anyway, at a rate that makes you both wince.'; } },
      {
        t: (L, x) => `Talk ${him(P(L, x))} out of it`, check: ['charm', 50],
        run(L, x, win) {
          const p = P(L, x), r = rec(L, p), a = amb(L, x);
          if (win) { L.bond(p, -4); sore(r, 1); endAmb(L, p, a, 'held'); return 'You talk about recessions, and rents, and Betty’s, which nearly went under. The ring binder goes in the loft.'; }
          sup(a, -2); L.bond(p, -8); r.biz = { hp: 40, stake: 0 }; next(L, a, 4, 6); return `${He(p)} listens politely, and does it anyway, with a loan from ${his(p)} mother.`;
        },
      },
    ],
  },
  {
    id: 'wantsShop2', icon: '🧾', title: 'The first winter', ok: at(1),
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return `The first winter at ${r.shop.sign} is a hard one. Takings are down, the boiler has given up, and ${first(p)} has been doing the books at midnight. ${He(p)} needs ${money(price(L, 4000))} to get through to Easter. ${He(p)} has not asked you for it: you found the letter from the bank.`; },
    opts: [
      { t: 'Put in what it needs', cost: (L) => price(L, 4000), run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); r.biz.stake += price(L, 4000); r.biz.hp += 25; sup(a, 1); L.bond(p, 6); next(L, a, 6, 10); return `${first(p)} cries, says you should not have, and orders a new boiler the same afternoon.`; } },
      { t: 'Work Saturdays in it yourself', run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); busy(L, 2); r.biz.hp += 15; sup(a, 1); L.bond(p, 8); L.gain('charm', 1); L.gain('craft', 1); next(L, a, 6, 10); return `You learn the till, the regulars and how ${first(p)} likes things done, which is exactly. Takings are up by Easter.`; } },
      { t: 'Leave it to them: it is their shop', run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.bond(p, -1); next(L, a, 6, 10); return `${He(p)} gets through it on ${his(p)} own, somehow. ${He(p)} does not mention the letter, and nor do you.`; } },
      { t: (L, x) => `Tell ${him(P(L, x))} it is time to call it a day`, run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.bond(p, -6); sore(r, 1); r.biz.hp -= 15; if (r.biz.hp <= 25) { r.biz = null; endAmb(L, p, a, 'lost'); return `${He(p)} closes ${r.shop.sign} at the end of the month. The sign stays up for a year, because nobody can bear to take it down.`; } next(L, a, 6, 10); return `"Not yet," ${he(p)} says. "Not yet."`; } },
    ],
  },
  {
    id: 'wantsShop3', icon: '🪧', title: (L, x) => (rec(L, P(L, x)).biz && rec(L, P(L, x)).biz.hp >= 50 ? 'A queue on Saturdays' : 'The shutters come down'), ok: at(2),
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return r.biz && r.biz.hp >= 50 ? `${r.shop.sign} has a queue out of the door on Saturdays, a write-up in the Gazette ("worth the wait"), and a cat that has adopted it. ${first(p)} has paid off the bank, and is talking about a second one.` : `The shutters come down on ${r.shop.sign} on a wet Thursday. ${first(p)} has sold the till to Betty and the sign to Mr Pym, and cried in the car.`; },
    opts: [
      { t: 'Raise a glass in the shop after closing', show: (L, x) => !!rec(L, P(L, x)).biz && rec(L, P(L, x)).biz.hp >= 50, run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.joy(6); L.bond(p, 6); shopWon(L, p, r, a); return `Two glasses, the lights low, the street quiet outside. ${first(p)} says, "We did this," and means you too.`; } },
      { t: 'Ask for your money back, with a little on top', show: (L, x) => { const r = rec(L, P(L, x)); return !!r.biz && r.biz.hp >= 50 && r.biz.stake > 0; }, run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x), n = Math.round(r.biz.stake * 1.3); L.cash(n); r.biz.stake = 0; L.bond(p, -2); shopWon(L, p, r, a); return `${He(p)} writes you a cheque for ${money(n)} on the shop’s own cheque book, which ${he(p)} is very proud of, and you are a customer from now on.`; } },
      { t: 'Tell them you are proud of them anyway', show: (L, x) => !(rec(L, P(L, x)).biz && rec(L, P(L, x)).biz.hp >= 50), run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.bond(p, (a.sup || 0) >= 2 ? 10 : 6); r.biz = null; endAmb(L, p, a, 'lost'); been(L, p, `Stood by ${first(p)} when ${r.shop.sign} closed.`); return `"I gave it a go," ${he(p)} says. "Didn’t I?" You did, the two of you.`; } },
      { t: 'Count what it cost you', show: (L, x) => !(rec(L, P(L, x)).biz && rec(L, P(L, x)).biz.hp >= 50), run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.bond(p, -8); L.joy(-3); sore(r, 1); r.biz = null; endAmb(L, p, a, 'lost'); return 'You do it out loud, at the kitchen table. It comes to a lot, and to more than money.'; } },
    ],
  },

  // ---- round the world ----
  {
    id: 'wantsSail1', icon: '🗺️', title: 'Charts on the kitchen table', ok: at(0),
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return L.s.items.boat ? `${first(p)} has spread charts all over the kitchen table, weighed down with mugs. ${He(p)} has always wanted to sail round the world, and has been measuring up your boat for it with a tape and a faraway look.` : `${first(p)} has spread charts all over the kitchen table, weighed down with mugs. ${He(p)} has always wanted to sail round the world, and has found the boat to do it in: a thirty-foot sloop called the ${r.boat}, going for ${money(ITEMS.boat.price)}. ${He(p)} can find half.`; },
    opts: [
      { t: (L, x) => `Buy the ${rec(L, P(L, x)).boat} together`, show: (L) => !L.s.items.boat, cost: () => Math.round(ITEMS.boat.price / 2), run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); L.s.items.boat = 1; sup(a, 3); L.bond(p, 8); L.joy(5); next(L, a, 4, 8); L.note(`Bought a boat, the ${r.boat}, with ${first(p)}.`); return `The ${r.boat} is yours, the two of you, and smells of varnish and old rope. You take her round the bay on the first fine day and both come back sunburnt.`; } },
      { t: 'Fit out your own boat for the open sea', show: (L) => !!L.s.items.boat, cost: (L) => price(L, 3000), run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 3); L.bond(p, 8); next(L, a, 4, 8); return 'New sails, a radio that reaches further than the harbour wall, and a lot of tins. Captain Quinn watches the work from the harbour office, and says nothing, approvingly.'; } },
      { t: 'Learn to sail properly first, together', run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 1); L.bond(p, 5); L.gain('fitness', 1); next(L, a, 6, 10); return 'Saturday mornings at the sailing club, in borrowed waterproofs. You capsize twice. So does the instructor, once, which cheers everyone up.'; } },
      { t: 'Over my dead body', run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, -3); L.bond(p, -10); sore(rec(L, p), 2); endAmb(L, p, a, 'held'); return `${first(p)} folds the charts up very neatly, and puts them away, and you do not see them again.`; } },
    ],
  },
  {
    id: 'wantsSail2', icon: '⛵', title: 'A summer at sea', ok: at(1),
    text: (L, x) => { const p = P(L, x); return `Before the big one, ${first(p)} wants a season at sea: round the islands and back, to see how the boat does, and how ${he(p)} does.`; },
    opts: [
      { t: 'Go too', run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 2); busy(L, 4); perf(L, -8); L.joy(12); L.bond(p, 12); L.gain('fitness', 2); L.hp(2); next(L, a, 4, 8); been(L, p, 'Spent a season sailing round the islands together.'); return 'Dolphins off the bow, a storm you will tell people about for years, and a harbour on an island with one pub and no road. You come home brown, and late for work by a season.'; } },
      { t: 'Wave them off from the harbour wall', run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); sup(a, 1); L.bond(p, 4); r.away = L.s.t + 1; r.awayWhy = 'islands'; next(L, a, 4, 8); return `You wave until the sail is a white speck. ${first(p)} sends a postcard from every harbour, all of them saying the same thing: wish you were here.`; } },
      { t: 'Ask them to wait until the children are older', show: (L) => young(L, 12).length > 0, run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, -4); a.at = L.s.t + 12; return `${He(p)} agrees that it is sensible. ${He(p)} goes down to the harbour most evenings, just to look at the boat.`; } },
      { t: (L, x) => `Ask ${him(P(L, x))} not to go at all`, run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, -8); sore(rec(L, p), 2); endAmb(L, p, a, 'held'); return 'The boat stays in the harbour. She is very well kept, and goes nowhere.'; } },
    ],
  },
  {
    id: 'wantsSail3', icon: '🌍', title: 'The big one', ok: at(2),
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return `The ${r.boat} is provisioned and the harbourmaster has the date in her book: a year round the world, by way of everywhere. Captain Quinn has looked the boat over from stem to stern, said "She’ll do", and walked off. From her, that is a blessing. ${first(p)} wants you to come.`; },
    opts: [
      {
        t: 'Go together', cost: (L) => price(L, 6000),
        why: (L) => (young(L, 16).length ? 'Not with the children still at school.' : null),
        run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); r.voyage = L.s.t + 4; perf(L, -15); L.joy(15); L.bond(p, 15); L.gain('fitness', 2); L.s.wants.f.world = 1; endAmb(L, p, a, 'won'); been(L, p, 'Sailed round the world together.'); L.note(`Set sail round the world with ${first(p)}.`, 'big'); return 'You cast off on the first of May with half the town on the harbour wall. For a year your life is the wind, the watch and the next horizon, with a few weeks at home between the long passages. Nobody at work is pleased. You find you do not much mind.'; },
      },
      { t: 'Wave them off, and write every week', run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); r.away = L.s.t + 4; r.awayWhy = 'voyage'; L.bond(p, 6); L.joy(-2); a.st = 3; a.at = null; return `You stand on the harbour wall until the ${r.boat} is over the horizon. The letters start coming a month later, with foreign stamps, smelling faintly of the sea.`; } },
      { t: (L, x) => `Ask ${him(P(L, x))} not to go`, run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, -14); sore(rec(L, p), 3); endAmb(L, p, a, 'held'); return `${He(p)} sells the boat in the spring, to a dentist from Kettleby, and does not watch it leave.`; } },
    ],
  },
  {
    id: 'wantsSailHome', icon: '⚓', title: 'Home from the sea', ok: (L, x) => mine(L, x) && !!amb(L, x) && amb(L, x).st === 3 && amb(L, x).out == null,
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return `A sail on the horizon, and then the ${r.boat}, a little battered, comes round the harbour wall with ${first(p)} at the tiller, brown as a nut and twice as thin.`; },
    opts: [
      { t: 'Run down to the quay', run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, 10); L.joy(10); endAmb(L, p, a, 'won'); been(L, p, `Waited a year for ${first(p)} to sail home from round the world.`); return `You are in the water up to your knees before the boat is tied up. ${first(p)} has brought you a shell from every ocean, and a parrot, which is not staying.`; } },
      { t: 'Wait at home with the kettle on', run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, 6); L.joy(6); endAmb(L, p, a, 'won'); return 'The door goes, and there is a smell of salt, and then there is nobody you would rather see.'; } },
    ],
  },

  // ---- a garden ----
  {
    id: 'wantsGarden1', icon: '🌻', title: 'Seed catalogues', ok: at(0),
    text: (L, x) => { const p = P(L, x); return `${first(p)} has started reading seed catalogues in bed, and sighing at them. ${He(p)} wants a garden: a proper one, with a shed and a bean row, and somewhere to sit on a summer evening.`; },
    opts: [
      {
        t: 'Move to a fisherman’s cottage with a garden', show: (L) => !L.s.owned && L.s.home !== 'cottage',
        cost: (L) => Math.round(L.rentOf('cottage') / 2), why: (L) => L.liveWhy('cottage'),
        run(L, x) { const p = P(L, x), a = amb(L, x); L.settleIn('cottage', null); L.note('Moved into a fisherman’s cottage, for the garden.'); sup(a, 3); L.bond(p, 10); rec(L, p).grew = 1; next(L, a, 4, 8); return `Low beams, a wood stove, and at the back a long thin garden full of brambles. ${first(p)} is out there in ${his(p)} wellies before the van is unpacked.`; },
      },
      { t: 'Build them a greenhouse', show: (L) => L.s.owned, cost: (L) => price(L, 1500), run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 3); L.bond(p, 8); rec(L, p).grew = 1; next(L, a, 4, 8); return 'It goes up in a weekend, with only one broken pane. By the spring it is full of seed trays, and so is the kitchen.'; } },
      { t: (L, x) => `Give ${him(P(L, x))} half your allotment`, show: (L) => !!L.s.plot, run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 2); L.bond(p, 8); rec(L, p).grew = 1; next(L, a, 4, 8); return `You draw a line down the middle with a stick. Within a month ${first(p)}’s half is better than yours, and ${he(p)} is giving you advice.`; } },
      { t: 'Save up for a place of our own', run(L, x) { const p = P(L, x), a = amb(L, x); sup(a, 1); L.bond(p, 3); next(L, a, 8, 12); return `${He(p)} puts a jam jar on the windowsill with "GARDEN" on it in felt pen.`; } },
      { t: 'Window boxes will have to do', run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, -4); sore(rec(L, p), 1); endAmb(L, p, a, 'held'); return 'The window boxes are very good. Everybody says so. It is not the same.'; } },
    ],
  },
  {
    id: 'wantsGarden2', icon: '🥕', title: (L, x) => (gardened(L, P(L, x)) ? 'The summer show' : 'The jam jar'), ok: at(1),
    text: (L, x) => { const p = P(L, x); return gardened(L, p) ? `${first(p)} has entered ${his(p)} runner beans in the summer show at the church hall, and is pretending not to be nervous. ${He(p)} has polished them.` : `The jam jar on the windowsill that says "GARDEN" has a little money in it, and a lot of dust. ${first(p)} has stopped reading the seed catalogues.`; },
    opts: [
      { t: 'Go to the show and cheer', show: (L, x) => gardened(L, P(L, x)), run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, 8); L.joy(6); L.gain('fitness', 0.5); endAmb(L, p, a, 'won'); been(L, p, `Watched ${first(p)} win a rosette for runner beans.`); return 'Second prize, a red rosette, and a handshake from the Reverend Hollis. The winner, Tom Windle, is gracious about it, for him.'; } },
      { t: 'Promise them a garden one day, and mean it', show: (L, x) => !gardened(L, P(L, x)) && !(amb(L, x) && amb(L, x).again), run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, 2); a.st = 0; a.again = 1; a.at = L.s.t + L.int(8, 12); return `"One day," ${he(p)} says, and puts the jar back on the windowsill.`; } },
      { t: 'Let it go', show: (L, x) => !gardened(L, P(L, x)), run(L, x) { const p = P(L, x), a = amb(L, x); L.bond(p, -3); sore(rec(L, p), 1); endAmb(L, p, a, 'lost'); return 'The jar goes back in the cupboard, and the money goes on the gas bill.'; } },
    ],
  },

  // ---- the road not taken ----
  {
    id: 'wantsRoad', icon: '🛤️', title: 'The road not taken', ok: (L, x) => mine(L, x) && !!amb(L, x) && amb(L, x).out === 'held',
    text: (L, x) => {
      const p = P(L, x), r = rec(L, p), a = amb(L, x);
      const what = { band: `a video of ${r.band} playing at a festival, without ${him(p)}`, city: 'a job advertisement from the same firm in the city', study: 'the college prospectus, with a page folded down', shop: 'the old chandlery on Harbour Row, to let again', sail: 'a boat for sale in the back of a sailing magazine', garden: 'a cottage up the hill with a long garden, for sale' }[a.id];
      return `${first(p)} closes something on the computer when you come in. Later you find it again: ${what}. ${He(p)} has not said a word about it since you asked ${him(p)} not to, years ago.`;
    },
    opts: [
      { t: (L, x) => `Tell ${him(P(L, x))} to go for it, this time`, run(L, x) { const p = P(L, x), r = rec(L, p), a = amb(L, x); a.out = null; a.st = 0; a.sup = 2; a.at = L.s.t + 1; r.sore = 0; L.bond(p, 10); L.joy(3); return `${He(p)} stares at you. Then ${he(p)} laughs, and gets it all out again from where it has been put away, and the years fall off ${him(p)}.`; } },
      { t: 'Say you are sorry, for last time', run(L, x) { const p = P(L, x), r = rec(L, p); sore(r, -1); L.bond(p, 6); return `"It was a long time ago," ${he(p)} says. But ${he(p)} holds your hand on the sofa that evening, which ${he(p)} has not done in a while.`; } },
      { t: 'Say nothing', run(L, x) { sore(rec(L, P(L, x)), 1); return 'You put it back the way you found it.'; } },
    ],
  },

  // ---- children, or not ----
  {
    id: 'wantsBaby', icon: '👶', title: 'A baby?', ok: (L, x) => mine(L, x) && !L.s.due && !L.kids().length,
    text: (L, x) => { const p = P(L, x), n = rec(L, p).kidN || 0; return n ? `${first(p)} has asked again, gently, about a baby. ${He(p)} has stopped pretending it is a passing thought.` : `${first(p)} has been holding other people’s babies for a long time, and handing them back slowly. Tonight ${he(p)} says it out loud: ${he(p)} would like one of your own.`; },
    opts: [
      {
        t: 'Let’s try', show: (L, x) => !L.conceiveWhy(P(L, x)), why: (L) => (L.roomForKid() ? null : 'You would need a home with room for a child first.'),
        run(L, x) { const p = P(L, x), r = rec(L, p); r.kidN = 9; if (L.chance(0.55)) { L.s.due = { t: L.s.t + 3 }; L.joy(8); L.bond(p, 8); return `It happens sooner than either of you expected. ${first(p)} tells you with a cup of tea and a face that gives it away before ${he(p)} says a word: you are expecting.`; } L.bond(p, 6); L.joy(3); return 'Not yet. But you are trying, and you are in it together, and that is its own good news.'; },
      },
      {
        t: 'Let’s adopt', show: (L, x) => !!L.conceiveWhy(P(L, x)), cost: 5000,
        why: (L) => (L.s.age > 55 ? 'The agency prefers younger parents.' : L.s.record ? 'Your record counts against you.' : L.s.karma < 0 ? 'The agency has heard things about you.' : L.roomForKid() ? null : 'You need a home with room for a child.'),
        run(L, x) { const p = P(L, x), r = rec(L, p); r.kidN = 9; L.s.due = { t: L.s.t + 1, adopt: true }; L.bond(p, 8); L.joy(5); return 'Forms, interviews, a social worker who inspects the airing cupboard. Then: a yes. A child will come to live with you next season.'; },
      },
      { t: 'Not yet', run(L, x) { const p = P(L, x), r = rec(L, p); r.kidN = (r.kidN || 0) + 1; r.kidAt = L.s.t + 8; L.bond(p, -4); if (r.kidN >= 3) sore(r, 2); return r.kidN >= 3 ? `"You keep saying that," ${he(p)} says quietly, and goes to bed early.` : `"Not yet, then," ${he(p)} says, and changes the subject, carefully.`; } },
      {
        t: 'I do not want children',
        run(L, x) {
          const p = P(L, x), r = rec(L, p);
          r.kidN = 9; L.bond(p, -15); sore(r, 2);
          if (p.bond < 30) return `There is nothing to argue about, as it turns out. ${leave(L, p, false)}`;
          been(L, p, 'Decided together that there would be no children, which was harder on one of you than the other.');
          return `${He(p)} goes very quiet, and then says ${he(p)} understands. ${He(p)} does, mostly. It is a long time before ${he(p)} holds anybody’s baby again.`;
        },
      },
    ],
  },
  {
    id: 'wantsNoBaby', icon: '🕯️', title: 'Something to say', ok: (L, x) => mine(L, x) && !P(L, x).wish,
    text: (L, x) => { const p = P(L, x); return `${first(p)} has been working up to something all evening, and finally says it: ${he(p)} does not want children. Not now, not later. ${He(p)} wanted you to know before it went any further.`; },
    opts: [
      { t: 'That is all right with me', run(L, x) { const p = P(L, x); rec(L, p).noKid = 1; L.bond(p, 8); return `${He(p)} lets out a breath ${he(p)} seems to have been holding for a year.`; } },
      { t: (L, x) => `Say you hope ${he(P(L, x))} might change ${his(P(L, x))} mind`, run(L, x) { const p = P(L, x), r = rec(L, p); r.noKid = 2; r.turnAt = L.s.t + L.int(6, 12); L.bond(p, -2); return `"Maybe," ${he(p)} says. "But do not count on it."`; } },
      { t: 'Then I am not sure this can work', run(L, x) { const p = P(L, x), r = rec(L, p); r.noKid = 1; if (p.kind === 'partner') return `You talk until three in the morning, and by the end of it you both know. ${leave(L, p, false)}`; L.bond(p, -20); sore(r, 2); return 'It sits between you for a long time after, like a third person at the table.'; } },
    ],
  },

  // ---- anniversaries ----
  {
    id: 'wantsAnniv', icon: '💐', ok: (L, x) => mine(L, x) && P(L, x).kind === 'spouse',
    title: (L, x) => (MILESTONES[x.y] ? `${cap(MILESTONES[x.y])}` : `${ORD(x.y)} anniversary`),
    text: (L, x) => { const p = P(L, x), m = MILESTONES[x.y]; return `It is ${x.y === 1 ? 'a year' : `${x.y} years`} since you married ${first(p)}${m ? ` (${m}, apparently)` : ''}, and for once you have remembered in good time.${x.y >= 25 ? ' Half the town seems to know about it already.' : ''}`; },
    opts: [
      { t: 'The good restaurant, and the song from the wedding', cost: (L, x) => price(L, MILESTONES[x.y] ? 500 : 250), run(L, x) { const p = P(L, x); L.bond(p, MILESTONES[x.y] ? 12 : 8); L.joy(5); return L.pick(['A table by the window, the band plays your song, and the waiter gives you the last of the pudding for nothing.', 'You dance in the restaurant, between the tables, and nobody minds.', 'Three courses, two hours, and not one word about work.']); } },
      { t: 'Make something by hand', check: ['craft', 40], run(L, x, win) { const p = P(L, x); if (win) { L.bond(p, 12); L.joy(3); return `${first(p)} cries, and puts it on the mantelpiece, where it stays.`; } L.bond(p, 3); return 'It is the thought that counts, you are told, kindly.'; } },
      { t: 'A walk to where you first met', run(L, x) { const p = P(L, x); L.bond(p, 6); L.joy(3); L.gain('fitness', 0.5); return L.pick(['It has become a phone shop. You stand outside it holding hands anyway.', 'The bench is still there. So, it turns out, are your initials.', 'You argue about where exactly it was, and both enjoy it very much.']); } },
      { t: 'Renew your vows at St Brigid’s', show: (L, x) => x.y >= 25, cost: (L) => price(L, 1500), run(L, x) { const p = P(L, x); L.bond(p, 15); L.joy(12); been(L, p, `Renewed your vows after ${x.y} years.`); return 'The Reverend Hollis reads the service with her glasses on her head, looking for them. Your old friends fill the front pews, older, and the bells ring as if you were twenty-five.'; } },
      { t: ti('romantic', 'Recreate your first date, down to the last chip'), show: tr('romantic'), run(L, x) { const p = P(L, x); L.bond(p, 12); L.joy(6); return `Same chip shop, same bench, same gull, very possibly. ${first(p)} laughs until ${he(p)} has to sit down.`; } },
    ],
  },
  {
    id: 'wantsForgot', icon: '🕯️', title: 'The good plates', ok: (L, x) => mine(L, x) && P(L, x).kind === 'spouse',
    text: (L, x) => { const p = P(L, x); return `${first(p)} has laid the table with the good plates and lit a candle, and there is an envelope propped against your glass. It takes you one long, terrible second to work out why: it is your ${x.y === 1 ? 'first' : ORD(x.y)} wedding anniversary. You had forgotten.`; },
    opts: [
      { t: 'Own up, and make it up to them', cost: (L) => price(L, 300), run(L, x) { const p = P(L, x); L.bond(p, -3); return L.pick(['You own up. Then you book the good restaurant for Saturday, and buy the flowers on the way home, and say sorry in several ways.', 'You own up. It goes down better than you deserve, and you spend the weekend making sure.']); } },
      { t: 'Say your present has been held up in the post', check: ['charm', 55], run(L, x, win) { const p = P(L, x); if (win) { L.karma(-1); return 'You get away with it, and spend a frantic Saturday morning on the High Street. The present arrives "in the post" on Monday.'; } L.bond(p, -12); sore(rec(L, p), 1); return `${first(p)} works at the post office on Thursdays. ${He(p)} knows exactly what has been held up in it.`; } },
      { t: 'Blame work', run(L, x) { const p = P(L, x); L.bond(p, -10); sore(rec(L, p), 1); return '"It is always work," says ' + first(p) + ', and blows out the candle.'; } },
      { t: ti('joker', 'Make a joke of it'), show: tr('joker'), odds: () => 0.5, run(L, x, win) { const p = P(L, x); if (win) { L.bond(p, 2); return `It is a very good joke. ${first(p)} laughs despite ${him(p)}self, and then makes you pay for dinner for a month.`; } L.bond(p, -8); return 'It is a very good joke. Nobody laughs.'; } },
    ],
  },

  // ---- a rough patch ----
  {
    id: 'wantsRough', icon: '🌧️', title: 'A rough patch', ok: (L, x) => mine(L, x) && !rec(L, P(L, x)).patch,
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return (r.sore || 0) >= 3 ? `Nothing has happened, exactly. But ${first(p)} has gone quiet, the way ${he(p)} does when something has been building for a long time, and the two of you have started eating in front of the television. Things put off and things given up have a way of adding up.` : `You cannot remember the last time you and ${first(p)} did anything together but the shopping. Conversation has shrunk to who is picking up whom, and when. It needs something from you. Time together, these next few seasons, would be a start.`; },
    opts: [
      { t: 'Sit down and talk, properly', check: ['charm', 45], run(L, x, win) { const p = P(L, x); patch(L, p, win ? 1 : 0); if (win) { L.bond(p, 6); return 'It starts badly, and goes on for hours, and somewhere around midnight you both start saying the true things. It is a beginning.'; } L.bond(p, -3); return 'It turns into a row about the bins. You both go to bed angry, at opposite edges.'; } },
      { t: 'Book counselling at St Wren’s', cost: (L) => L.medCost(600), run(L, x) { const p = P(L, x); patch(L, p, 1, true); L.bond(p, 3); return 'A small room, a box of tissues and a woman called Marion who says almost nothing and misses nothing. You go every week.'; } },
      { t: 'A weekend away, just the two of you', cost: (L) => price(L, 700), run(L, x) { const p = P(L, x); busy(L, 1); patch(L, p, 1); L.bond(p, 8); L.joy(4); return 'A hotel with a sea view that is mostly car park, and two days with nobody else to talk to. It helps more than you expected.'; } },
      { t: ti('romantic', 'Court them all over again: flowers, letters, the lot'), show: tr('romantic'), run(L, x) { const p = P(L, x); patch(L, p, 1); L.bond(p, 8); return `A letter under ${his(p)} pillow, every night for a week. On the eighth night there is one under yours.`; } },
      { t: 'Give it time', run(L, x) { patch(L, P(L, x), 0); return 'Time passes. It does not help as much as people say.'; } },
    ],
  },
  {
    id: 'wantsRoughUp', icon: '🌤️', title: 'Out the other side', ok: (L, x) => mine(L, x) && !!rec(L, P(L, x)).patch,
    text: (L, x) => { const p = P(L, x); return `Somewhere along the way, without either of you noticing the day it happened, things have come right. ${first(p)} laughs at something you say at breakfast, and you both stop, and look at each other.`; },
    opts: [
      { t: 'Say it out loud', run(L, x) { const p = P(L, x), r = rec(L, p); r.patch = null; r.sore = 0; L.bond(p, 10); L.joy(6); L.s.wants.n.patches++; been(L, p, 'Came through a rough patch together.'); return `"We nearly lost it, didn’t we," ${he(p)} says. You did. You have not.`; } },
      { t: 'Just pass the marmalade', run(L, x) { const p = P(L, x), r = rec(L, p); r.patch = null; r.sore = 0; L.bond(p, 6); L.joy(4); L.s.wants.n.patches++; been(L, p, 'Came through a rough patch together.'); return 'Some things do not need saying. The marmalade, on the other hand, is passed with real feeling.'; } },
    ],
  },
  {
    id: 'wantsRoughDown', icon: '🌫️', title: 'Like neighbours', ok: (L, x) => mine(L, x) && !!rec(L, P(L, x)).patch,
    text: (L, x) => { const p = P(L, x); return `You are polite to each other now, like neighbours. ${first(p)} has started sleeping in the spare room "because of the snoring", and you have stopped arguing about it.`; },
    opts: [
      { t: 'One last try: counselling, together', cost: (L) => L.medCost(600), odds: () => 0.55, run(L, x, win) { const p = P(L, x), r = rec(L, p); if (win) { r.patch = { at: L.s.t, n: 2, c: 1 }; L.bond(p, 6); return 'Marion at St Wren’s says it is not too late, and for the first time in a long while you both believe her.'; } r.patch = null; r.last = L.s.t; L.bond(p, -8); return 'You go to every session. You are very polite to each other in all of them.'; } },
      { t: 'Agree to go your separate ways', run(L, x) { const p = P(L, x); rec(L, p).patch = null; return `You agree it at the kitchen table, quietly, like grown-ups, which is somehow the worst part. ${leave(L, p, false)}`; } },
      { t: 'Carry on as you are', run(L, x) { const p = P(L, x), r = rec(L, p); r.patch = null; r.last = L.s.t; L.bond(p, -6); sore(r, 1); return 'Plenty of people do. You become two of them.'; } },
    ],
  },

  // ---- somebody at their work ----
  {
    id: 'wantsEye', icon: '📱', title: 'Somebody at work', ok: (L, x) => mine(L, x) && rec(L, P(L, x)).eye === 1,
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return `${first(p)} has mentioned somebody called ${r.eyeName} from work eleven times this week. ${He(p)} laughs at ${his(p)} phone, and puts it face down when you come in.`; },
    opts: [
      {
        t: (L, x) => `Trust ${him(P(L, x))}`,
        run(L, x) {
          const p = P(L, x), r = rec(L, p);
          if (p.bond >= 60) { r.eye = 3; L.bond(p, 4); return `A month later ${first(p)} mentions, in passing, that ${r.eyeName} asked ${him(p)} out for a drink and ${he(p)} said no. ${He(p)} says it as if it were nothing. It is not nothing.`; }
          if (L.chance(0.5)) { r.eye = 2; r.eyeAt = L.s.t + L.int(2, 5); } else r.eye = 3;
          return 'You decide it is nothing. It probably is.';
        },
      },
      { t: (L, x) => `Ask ${him(P(L, x))} straight out`, check: ['charm', 50], run(L, x, win) { const p = P(L, x), r = rec(L, p); if (win) { r.eye = 3; L.bond(p, 4); return `${He(p)} goes pink, and then tells you the truth: there was a spark, nothing more, and it is out now. You believe ${him(p)}, and you are right to.`; } L.bond(p, -6); if (L.chance(0.3)) { r.eye = 2; r.eyeAt = L.s.t + L.int(2, 5); } else r.eye = 3; return 'It comes out as an accusation. It becomes a row, and the row becomes about other things.'; } },
      { t: 'Make more of an effort: flowers, a night out, the works', cost: (L) => price(L, 300), run(L, x) { const p = P(L, x), r = rec(L, p); L.bond(p, 10); if (p.bond < 50 && L.chance(0.15)) { r.eye = 2; r.eyeAt = L.s.t + L.int(2, 5); } else r.eye = 3; return `You take ${first(p)} dancing on the pier, for the first time in years. ${He(p)} has not forgotten how. Neither, it turns out, have you.`; } },
      {
        t: 'Read their messages while they are in the bath',
        run(L, x) {
          const p = P(L, x), r = rec(L, p);
          L.karma(-2);
          if (L.chance(p.bond < 60 ? 0.4 : 0.1)) { r.eye = 2; r.eyeAt = L.s.t; return `It is all there, going back months. You put the phone back exactly where it was, and sit on the bed, and wait for ${first(p)} to come out of the bathroom.`; }
          r.eye = 3;
          if (L.chance(0.5)) { L.bond(p, -10); return `There is nothing there but a lot about the photocopier. ${first(p)} comes out of the bathroom and sees what you are holding.`; }
          return 'There is nothing there but a lot about the photocopier. You feel about two inches tall.';
        },
      },
    ],
  },
  {
    id: 'wantsFound', icon: '💔', title: 'A small town, the other way round', ok: (L, x) => mine(L, x) && rec(L, P(L, x)).eye === 2,
    text: (L, x) => { const p = P(L, x), r = rec(L, p); return `You find out the way you find out anything in Starling Bay: from Betty, at the till in the café, who thought you knew. ${first(p)} and ${r.eyeName}. It has been going on for months.`; },
    opts: [
      { t: 'Forgive them', run(L, x) { const p = P(L, x), r = rec(L, p); r.eye = 3; p.bond = Math.min(p.bond, 40); L.joy(-10); L.karma(1); r.sore = 0; been(L, p, `Forgave ${first(p)}, after ${r.eyeName}.`); return `It takes a long time, and some of it is never quite the same. But ${first(p)} ends it the same night, and stays, and keeps trying.`; } },
      { t: 'Counselling, and time', cost: (L) => L.medCost(600), run(L, x) { const p = P(L, x), r = rec(L, p); r.eye = 3; L.bond(p, -10); L.joy(-8); r.patch = { at: L.s.t, n: 1, c: 1 }; return 'Marion at St Wren’s has seen this before, many times, and says so. That helps more than you would have thought.'; } },
      { t: 'Leave', run(L, x) { const p = P(L, x); rec(L, p).eye = 3; L.joy(-6); return `You pack a bag that night. ${leave(L, p, true)}`; } },
      { t: ti('hothead', 'Throw everything they own out of the bedroom window'), show: tr('hothead'), run(L, x) { const p = P(L, x); rec(L, p).eye = 3; L.joy(2); L.karma(-1); return `Shirts on the hedge, shoes in the road, a lamp in the neighbour’s pond. The whole street comes out to watch. ${leave(L, p, true)}`; } },
    ],
  },

  // ---- their parents ----
  {
    id: 'wantsInlawsKids', icon: '🧶', title: 'Thursdays', ok: (L, x) => mine(L, x) && !!rec(L, P(L, x)).inl,
    text: (L, x) => { const p = P(L, x), i = rec(L, p).inl; return `${first(p)}’s mother, ${i.mum}, rings. She would like to have the little one on Thursdays, every week, "if that is not interfering". It is a bit interfering. It would also be a whole day.`; },
    opts: [
      { t: 'Say yes, gratefully', run(L, x) { const p = P(L, x), i = rec(L, p).inl; i.help = 1; i.w = clamp(i.w + 10, 0, 100); L.bond(p, 4); return 'The baby comes back every Thursday with a new word, a new cardigan, and jam in places jam should not be.'; } },
      { t: 'Say yes, with a list of rules', run(L, x) { const i = rec(L, P(L, x)).inl; i.help = 1; i.w = clamp(i.w + 2, 0, 100); return `${i.mum} reads the list, says "Of course, dear", and does exactly as she likes.`; } },
      { t: 'Say you can manage', run(L, x) { const p = P(L, x), i = rec(L, p).inl; i.w = clamp(i.w - 8, 0, 100); L.bond(p, -2); return `"Of course you can," says ${i.mum}, in a voice that could chill milk.`; } },
    ],
  },
  {
    id: 'wantsInlawsRuby', icon: '💍', title: 'Forty years', ok: (L, x) => mine(L, x) && !!rec(L, P(L, x)).inl && rec(L, P(L, x)).inl.left === 2,
    text: (L, x) => { const p = P(L, x), i = rec(L, p).inl; return `${first(p)}’s parents, ${i.mum} and ${i.dad}, have been married forty years, and there is to be a party in the function room at the Gull. ${first(p)} has been asked to say a few words, and has asked you to say them instead.`; },
    opts: [
      { t: 'Say a few words', check: ['charm', 45], run(L, x, win) { const p = P(L, x), i = rec(L, p).inl; if (win) { i.w = clamp(i.w + 15, 0, 100); L.bond(p, 6); L.joy(4); return `You tell the story of how ${i.dad} proposed on a ferry and dropped the ring overboard. ${i.mum} laughs until her hat comes off.`; } i.w = clamp(i.w + 3, 0, 100); L.bond(p, 2); return `You get ${i.mum}’s name wrong in the first sentence, and never quite recover. They are very nice about it.`; } },
      { t: 'Pay for the band', cost: (L) => price(L, 400), run(L, x) { const p = P(L, x), i = rec(L, p).inl; i.w = clamp(i.w + 10, 0, 100); L.bond(p, 5); return `The band plays everything from 1960 onwards, and ${i.dad} dances with every woman in the room, slowly.`; } },
      { t: 'Go, and stay near the buffet', run(L, x) { const i = rec(L, P(L, x)).inl; i.w = clamp(i.w + 2, 0, 100); return 'Vol-au-vents, a cheese and pineapple hedgehog, and a long talk with an uncle about drainage.'; } },
      { t: 'Have a prior engagement', run(L, x) { const p = P(L, x), i = rec(L, p).inl; i.w = clamp(i.w - 10, 0, 100); L.bond(p, -5); return 'You are missed, and the missing is noted.'; } },
    ],
  },
  {
    id: 'wantsInlawsIll', icon: '🩹', title: 'A fall', ok: (L, x) => mine(L, x) && !!rec(L, P(L, x)).inl && rec(L, P(L, x)).inl.left > 0,
    text: (L, x) => { const p = P(L, x), i = rec(L, p).inl, who = i.left === 1 ? i.last : i.dad; return `${first(p)}’s ${who === i.mum ? 'mother' : 'father'}, ${who}, has had a fall and is in hospital with a broken hip. ${first(p)} wants to go and stay for a few weeks, to help.`; },
    opts: [
      { t: 'Go together', run(L, x) { const p = P(L, x), i = rec(L, p).inl; busy(L, 2); L.bond(p, 8); i.w = clamp(i.w + 10, 0, 100); return 'You make up the spare bed, do the shopping and fix a banister that has been loose since 1974. Nobody asked you to. Everybody notices.'; } },
      { t: 'Hold the fort at home', run(L, x) { const p = P(L, x), i = rec(L, p).inl; busy(L, young(L, 12).length ? 1 : 0); L.bond(p, 5); i.w = clamp(i.w + 4, 0, 100); return `You ring every evening. ${first(p)} comes home three weeks later, exhausted, and finds the house still standing.`; } },
      { t: 'Pay for help to come in', cost: (L) => price(L, 800), run(L, x) { const p = P(L, x), i = rec(L, p).inl; L.bond(p, 4); i.w = clamp(i.w + 6, 0, 100); return 'A carer comes in twice a day for a month. She is very good, and stern, and they are both a little afraid of her.'; } },
      { t: 'Can it not wait?', run(L, x) { const p = P(L, x), i = rec(L, p).inl; L.bond(p, -8); i.w = clamp(i.w - 8, 0, 100); sore(rec(L, p), 1); return `It cannot. ${first(p)} goes anyway.`; } },
    ],
  },
  {
    id: 'wantsInlawsGone', icon: '🕊️', title: (L, x) => `${first(P(L, x))}’s ${x.mum ? 'mother' : 'father'}`, ok: (L, x) => mine(L, x),
    text: (L, x) => { const p = P(L, x); return `${first(p)}’s ${x.mum ? 'mother' : 'father'}, ${x.name}, has died, at ${x.age}. ${first(p)} took the call in the hall, and has been sitting on the stairs ever since.`; },
    opts: [
      { t: 'Sit on the stairs with them', run(L, x) { const p = P(L, x); L.bond(p, 8); been(L, p, `Sat with ${first(p)} the day ${x.name} died.`); return inherit(L, p, x, `You sit there until it gets dark, and nobody turns the light on.`); } },
      { t: 'Take on the arrangements', run(L, x) { const p = P(L, x); busy(L, 2); L.bond(p, 10); L.karma(1); been(L, p, `Saw to everything when ${x.name} died.`); return inherit(L, p, x, 'The undertaker, the vicar, the flowers, the sandwiches, the cousins. You do all of it, so that all ' + first(p) + ' has to do is be sad.'); } },
      { t: 'Keep things going at home', run(L, x) { const p = P(L, x); L.bond(p, 3); return inherit(L, p, x, 'Meals on the table, the bins out, the children fed. It is not nothing, though it feels like it.'); } },
    ],
  },

  // ---- an illness ----
  {
    id: 'wantsIll', icon: '🩺', title: 'The doctor would like to see you both', ok: (L, x) => mine(L, x) && !!rec(L, P(L, x)).ill,
    text: (L, x) => { const p = P(L, x), i = rec(L, p).ill; return `${first(p)} has been for tests, and the doctor at St Wren’s would like to see you both. It is ${i.what}. It will be a long road, the doctor says, but a road.`; },
    opts: [
      { t: 'Take time off and look after them yourself', run(L, x) { const p = P(L, x), i = rec(L, p).ill; perf(L, -8); i.care = 'you'; i.until = L.s.t + L.int(2, 4); L.bond(p, 12); return 'You learn the names of the pills, the visiting hours and which nurse brings the good biscuits. You are there every day.'; } },
      { t: 'Pay to go private', cost: (L) => L.medCost(6000), run(L, x) { const p = P(L, x), i = rec(L, p).ill; i.priv = 1; i.until = L.s.t + L.int(1, 2); L.bond(p, 6); return 'A room with a view of the bay, a consultant with very clean shoes, and no waiting at all.'; } },
      { t: ti('kind', 'Rearrange your whole life round them'), show: tr('kind'), run(L, x) { const p = P(L, x), i = rec(L, p).ill; perf(L, -8); i.care = 'you'; i.until = L.s.t + L.int(2, 3); L.bond(p, 16); L.karma(2); return `You move the bed downstairs, learn to cook what ${first(p)} can eat, and sleep in the armchair beside ${him(p)} for a month.`; } },
      { t: 'Carry on: the hospital will look after them', run(L, x) { const p = P(L, x), i = rec(L, p).ill; i.until = L.s.t + L.int(3, 5); L.bond(p, -6); return 'You visit when you can. It is not as often as either of you would like.'; } },
    ],
  },
  {
    id: 'wantsWell', icon: '🌱', title: (L, x) => `Back on ${his(P(L, x))} feet`, ok: (L, x) => mine(L, x),
    text: (L, x) => { const p = P(L, x); return `${first(p)} is back on ${his(p)} feet: slower on the stairs, quicker to laugh, and very bossy about ${his(p)} pills.`; },
    opts: [
      { t: 'A holiday to celebrate', cost: (L) => price(L, 800), run(L, x) { const p = P(L, x); L.bond(p, 8); L.joy(8); been(L, p, `Saw ${first(p)} through ${x.what}.`); return 'A week somewhere warm with a pool neither of you goes in. You sit in the shade and hold hands like teenagers.'; } },
      { t: 'A quiet night in', run(L, x) { const p = P(L, x); L.bond(p, 5); L.joy(5); been(L, p, `Saw ${first(p)} through ${x.what}.`); return 'Fish and chips on your knees and a film neither of you watches the end of.'; } },
    ],
  },
  {
    id: 'wantsFading', icon: '🕯️', title: 'Time to sit with them', ok: (L, x) => mine(L, x),
    text: (L, x) => { const p = P(L, x); return `${first(p)} has been fading for weeks. This morning the doctor took you into the corridor and said, very gently, that it was time.`; },
    opts: [
      { t: 'Sit with them, and hold their hand', run(L, x) { const p = P(L, x); rec(L, p).bye = 1; L.bond(p, 10); return 'You sit with ' + first(p) + ' all day and all night, and talk about nothing, and everything.'; } },
      { t: 'Tell them everything you never said', run(L, x) { const p = P(L, x); rec(L, p).bye = 1; L.bond(p, 10); return `It takes hours. ${first(p)} listens to all of it with ${his(p)} eyes closed, smiling, and squeezes your hand at the good bits.`; } },
      { t: ti('bookish', 'Read to them, the old favourites'), show: tr('bookish'), run(L, x) { const p = P(L, x); rec(L, p).bye = 1; L.bond(p, 10); return `You read the book you read on your honeymoon. ${first(p)} falls asleep before the end of the chapter, the way ${he(p)} always did.`; } },
    ],
  },
];

// A partner who has been through a degree comes out with a better job.
function graduate(L, p, a) {
  const r = rec(L, p);
  p.job = DEGREE_JOB[p.trait] || 'teaching';
  for (const k of young(L)) grow(k, 'smarts', 2);
  if (r.sloan) r.sloan = L.s.t + 10;
  endAmb(L, p, a, 'won');
  been(L, p, `Watched ${first(p)} graduate.`);
  L.note(`${first(p)} graduated, and went on to work as ${L.jobOf(p).toLowerCase()}.`, 'big');
}
function shopWon(L, p, r, a) {
  p.job = r.shop.job;
  earn(r, 'shop', price(L, 400) + Math.round((r.biz.stake || 0) * 0.04), null);
  endAmb(L, p, a, 'won');
  been(L, p, `Saw ${r.shop.sign} through its first hard winter, and out the other side.`);
  L.note(`${first(p)}’s ${r.shop.a.replace(/^an? /, '')}, ${r.shop.sign}, is a success.`, 'big');
}
// Has the garden come about, one way or another?
function gardened(L, p) { const r = rec(L, p); return !!r.grew || (L.s.owned && ['cottage', 'townhouse', 'villa', 'manor'].includes(L.s.home)) || !!L.s.plot; }
// The start of a rough patch. n: progress made already; c: counselling (time together counts double).
function patch(L, p, n, c = false) {
  const R = rec(L, p);
  R.patch = { at: L.s.t, n, c: c ? 1 : 0 };
  R.last = L.s.t;
  R.sore = Math.max(0, (R.sore || 0) - 3);
}
// An in-law dies: the last of them leaves a little to the family.
function inherit(L, p, x, said) {
  const i = rec(L, p).inl;
  if (!i || i.left > 0) return said;
  const n = Math.round((1500 + i.w * 60) / 100) * 100;
  L.cash(n);
  return `${said} When the will is read, there is ${money(n)} for the two of you, "for the children, or the roof".`;
}
