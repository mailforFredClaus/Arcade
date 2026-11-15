// New in Town: the cards about the house you live in (street.js brings them up, one at a
// time): what goes wrong with it and who mends it, the landlord, building work, the garden
// and its shows, and the street as a whole. The neighbours' own stories are in
// street-tales.js. Every card is about the place you lived when it came up (x.k), and goes
// quietly if you have moved since. x.v: which wording, so the words keep still on screen.

import { HOMES, money, low, an } from './data.js';
import { clamp, fee, HOUSE, FAULTS, BUILDERS, PROJECTS, FEATURES, CLASSES, LANDLORDS, first, he, him, his, He, cap } from './street-lib.js';

const H = (L) => L.stHouse();
const S = (L) => L.s.street;
// Still about where you live, and you are not in a cell.
const here = (L, x) => !L.s.gaol && !!x && !!L.s.street && L.s.street.at === x.k && !!L.stHouse();
const at = (f) => (L, x) => here(L, x) && (!f || !!f(L, x));
const by = (x, l) => l[Math.abs(x.v || 0) % l.length];
const busy = (L, n) => { L.s.time = Math.max(0, L.s.time - n); };
const homeSaid = (L) => low(HOMES[L.s.home].name);
const LL = (L) => (H(L) && H(L).ll) || { name: 'The landlord', sex: 'm', kind: 'slack', tn: 40, up: 0 };
const llHe = (ll) => (ll.agency ? 'they' : ll.sex === 'm' ? 'he' : 'she');

// ---- what goes wrong, and who mends it -----------------------------------------------------

// The ways of seeing to a fault, for an owner: properly, cheaply, the charming one, yourself, a patch, or not.
function mendOpts(worse) {
  const F = (x) => FAULTS[x.f];
  return [
    {
      t: (L, x) => `Penwarden & Sons, and done properly${L.stOnlyPatch(x.f) ? ' (a roof like this can only be patched, until it is done whole)' : ''}`, cost: (L, x) => L.stFaultCost(x.f, 'sound'),
      run(L, x) { L.stMend(x.f, 'proper'); L.joy(2); return `Old Mr Penwarden sucks his teeth, names a price, and keeps to it. ${L.pick(F(x).done)}`; },
    },
    {
      t: 'Ring Daz', cost: (L, x) => L.stFaultCost(x.f, 'cheap'),
      run(L, x) { const ok = L.chance(BUILDERS.cheap.sure); L.stMend(x.f, ok ? 'proper' : 'patch'); L.joy(1); return `Daz is round the same afternoon, in a van held together with stickers. ${ok ? L.pick(['It looks fine, and, to everybody’s surprise, it is.', 'In and out in a day, cash, and it holds.']) : L.pick(['It looks fine. Whether it is fine, time will tell.', 'Cash, no receipt, and a thumbs up from the van as he goes.'])}`; },
    },
    {
      t: (L) => `Let ${L.stCharmer()} have a look (half up front)`, cost: (L, x) => Math.round(L.stFaultCost(x.f, 'charm') / 2),
      show: (L, x) => !L.stOnlyPatch(x.f) && !H(L).job,
      run(L, x) {
        const full = L.stFaultCost(x.f, 'charm'), who = L.stCharmer();
        H(L).job = { f: x.f, at: L.s.t, who, owed: full - Math.round(full / 2), paid: Math.round(full / 2) };
        return `${who} has a lovely van, a lovelier smile, and opinions about your cornicing. He takes half up front, for materials, and will be back “first thing next week”.`;
      },
    },
    {
      t: (L, x) => `Do it yourself (Craft ${FAULTS[x.f].diy})`, cost: (L, x) => L.stFaultCost(x.f, 'diy'),
      odds: (L, x) => L.checkOdds('craft', FAULTS[x.f].diy) - L.luck(),
      show: (L, x) => FAULTS[x.f].diy != null,
      run(L, x, win) {
        const f = F(x);
        busy(L, 1); L.gain('craft', 2); S(L).f.diy = 1;
        if (win) { L.stMend(x.f, 'proper'); L.joy(4); return L.pick(['A weekend in old clothes, a borrowed tool, a long phone call to somebody who knows, and it is done, properly. You are insufferable for a week.', 'It takes three goes, two trips to the hardware shop and a plaster on your thumb. Then it is mended, and stays mended.']); }
        let hurt = '';
        if (f.hurt && L.chance(0.4)) { L.hp(-f.hurt[0], f.hurt[1]); hurt = x.f === 'roof' ? ' You also come off the ladder, which you will feel for a month.' : ' You also find out, the hard way, which wire was live.'; }
        L.stMend(x.f, 'patch'); L.joy(-2);
        return `It is not mended so much as hidden. It will hold for a while.${hurt}`;
      },
    },
    { t: 'Patch it for now', cost: (L, x) => L.stFaultCost(x.f, 'patch'), run(L, x) { L.stMend(x.f, 'patch'); return L.pick(['A tin of something, a roll of something else, and it will do for now.', 'Filler, tape and optimism. It looks all right from the door.', 'A patch. It will hold, for a while, the way patches do.']); } },
    { t: worse ? 'Leave it be, still' : 'Leave it', run(L, x) { L.stLeave(x.f); L.joy(-1); return worse ? 'You shut the door on that room and do not go in.' : L.pick(['It will keep. Things like this keep, mostly.', 'You move a chair in front of it.', 'You make a note to see to it, and lose the note.']); } },
  ];
}
// Sudden damage the insurers will cover (for the excess).
const insureOpt = {
  t: 'Claim on the house insurance', cost: () => 0, show: (L, x) => !!L.s.ins.home && (x.f === 'subs' || x.f === 'roof') && !L.stOnlyPatch(x.f),
  run(L, x) { L.cash(-fee(L, 500)); L.stMend(x.f, 'proper'); return `A loss adjuster comes, measures everything twice, and takes four months to agree. Then they pay, all but the first ${money(fee(L, 500))}. ${L.pick(FAULTS[x.f].done)}`; },
};
const CRISIS = {
  damp: 'You have a cough that will not shift, and the doctor asks whether your house is damp.',
  roof: 'In the night the bedroom ceiling came down, in one piece, onto a bed you were, by luck, not in.',
  boiler: 'A week of cold baths, three jumpers in bed and breath you can see in the kitchen.',
  wiring: 'There was a fire: a small one, in the wall behind the fridge, put out by you, a tea towel and the fire brigade, in that order.',
  subs: 'A surveyor from the bank has been round, and the word he used, twice, was “structural”.',
  wall: 'Next door came round about the wall. It did not go well.',
};

export const HOUSE_CARDS = [
  {
    id: 'stFault', log: false, icon: (L, x) => FAULTS[x.f].icon, title: (L, x) => (x.ask === 3 ? `${FAULTS[x.f].name}, again` : FAULTS[x.f].name),
    ok: at((L, x) => L.stOwned() && H(L).f[x.f] && H(L).f[x.f].st === 'left'),
    text: (L, x) => {
      const F = FAULTS[x.f], h = H(L), first2 = Object.values(S(L).homes).length <= 1 && S(L).n.fixed === 0 && x.ask !== 3;
      const said = x.ask === 3 ? F.back : by(x, F.saw);
      const nb = F.shared ? L.stNbs().find((n) => n.role !== 'newfam') : null;
      return `${said}${h.kind === 'manor' && x.f === 'roof' && !h.done.roof ? ' It is the manor roof: there is always something, somewhere, on an acre of slate.' : ''}${nb ? ` ${first(nb)} next door has noticed it too.` : ''}${first2 ? ' It is your house: whatever is done, or not done, is yours to pay for, and shows in the price when you sell.' : ''}`;
    },
    opts: [...mendOpts(false).slice(0, 5), insureOpt, mendOpts(false)[5]],
  },
  {
    id: 'stWorse', log: false, icon: (L, x) => FAULTS[x.f].icon, title: (L, x) => `${FAULTS[x.f].name}: worse`,
    ok: at((L, x) => L.stOwned() && H(L).f[x.f] && H(L).f[x.f].st === 'left'),
    text: (L, x) => { const r = H(L).f[x.f], F = FAULTS[x.f]; return `${by(x, F.worse)}${r.sev >= 3 ? ` ${CRISIS[x.f]}` : ''} It will cost more to put right now than it would have, and an estate agent would take one look.`; },
    opts: [...mendOpts(true).slice(0, 5), insureOpt, mendOpts(true)[5]],
  },
  {
    // The charming one comes back. Or does not.
    id: 'stJob', log: false, icon: (L) => (H(L).job && H(L).job.res === 'ran' ? '🚐' : '😎'), title: (L) => (H(L).job && H(L).job.res === 'ran' ? 'First thing next week' : 'He is back'),
    ok: at((L) => !!H(L).job && !!H(L).job.res),
    text: (L, x) => {
      const j = H(L).job;
      if (j.res === 'ran') return `It is three weeks since ${j.who} took ${money(j.paid)} for materials. His telephone rings out. His van has been seen in Kettleby, and then not seen at all. Somebody at the Gull says he has a brother in Spain.`;
      return `${j.who} is back, as promised, with the materials and a radio, and does a lovely job of it, whistling. He would like the other ${money(j.owed)}.`;
    },
    opts: [
      { t: 'Pay him the rest', show: (L) => H(L).job.res === 'done', cost: (L) => H(L).job.owed, run(L) { const j = H(L).job, ok = L.chance(BUILDERS.charm.sure); H(L).job = null; L.stMend(j.f, ok ? 'proper' : 'patch'); L.joy(2); return `He shakes your hand, calls you a gentleman${L.s.sex === 'f' ? ', which you let go' : ''}, and is gone in a cloud of aftershave. ${ok ? L.pick(FAULTS[j.f].done) : 'It looks lovely. Whether it is, time will tell.'}`; } },
      { t: 'Say he will get the rest when it has lasted a winter', show: (L) => H(L).job.res === 'done', check: ['charm', 45], run(L, x, win) { const j = H(L).job; H(L).job = null; if (win) { L.stMend(j.f, 'proper'); L.cash(-Math.round(j.owed * 0.5)); return `He laughs, and agrees, and you pay him half now and half in the spring. It lasts the winter. ${L.pick(FAULTS[j.f].done)}`; } L.stMend(j.f, 'patch'); L.cash(-j.owed); return 'His smile goes out like a light. He finishes it off in an hour, takes the money, and you have the feeling he did not finish it at all.'; } },
      { t: 'Go after him', show: (L) => H(L).job.res === 'ran', odds: () => 0.3, run(L, x, win) { const j = H(L).job; H(L).job = null; S(L).charm++; if (win) { L.cash(Math.round(j.paid / 2)); L.joy(2); return `You find his van outside a bungalow in Kettleby, and him inside it, and you do not leave until you have ${money(Math.round(j.paid / 2))} of it back in your hand.`; } L.joy(-4); return 'You drive round Kettleby for a day looking for a white van. Kettleby is full of white vans.'; } },
      { t: 'Tell the police', show: (L) => H(L).job.res === 'ran', odds: () => 0.2, run(L, x, win) { const j = H(L).job; H(L).job = null; S(L).charm++; if (win) { L.cash(j.paid); L.joy(4); return `It turns out he has done it to eleven people. He is caught at Plymouth with a ferry ticket, and in the spring a cheque comes for all ${money(j.paid)}.`; } L.joy(-3); return 'They take a statement, and tell you he has done it to eleven people. That is all they take.'; } },
      { t: 'Put it down to experience', show: (L) => H(L).job.res === 'ran', run(L) { H(L).job = null; S(L).charm++; L.joy(-4); L.gain('smarts', 0.5); return 'You put it down to experience. Experience, it turns out, is expensive.'; } },
    ],
  },

  // ---- building work ----
  {
    id: 'stVanish', icon: '🚐', title: 'The builder has gone',
    ok: at((L, x) => !!H(L).proj && H(L).proj.gone && H(L).proj.id === x.p),
    text: (L, x) => `${x.who} has not been seen for three weeks. There is half a skip on the drive and a hole where the ${PROJECTS[x.p].name.replace(/^An? /, '').toLowerCase()} was to be, his telephone rings out, and somebody at the Gull says he has a brother in Spain. He took ${money(x.n)} with him.`,
    opts: [
      { t: 'Go after him', check: ['charm', 50], run(L, x, win) { H(L).proj = null; if (win) { L.cash(Math.round(x.n / 2)); L.joy(-2); return `You find him in a caravan behind a pub near Bodmin, and you do not leave until half of it is back in your hand. The hole in the garden is still there.`; } L.joy(-6); return 'You find the caravan. You do not find him. The man in the next caravan says he left in a hurry, with a lady and a parrot.'; } },
      { t: 'Tell the police', odds: () => 0.25, run(L, x, win) { H(L).proj = null; if (win) { L.cash(Math.round(x.n * 0.6)); L.joy(-1); return 'He is picked up at Portsmouth with a ferry ticket and eleven deposits. In time, some of yours comes back.'; } L.joy(-6); return 'They take a statement. He is, they say, “known to them”. That is all they take.'; } },
      { t: 'Put it down to experience', run(L) { H(L).proj = null; L.joy(-6); L.gain('smarts', 0.6); return 'You fill in the hole yourself, over a weekend, and do not talk about it.'; } },
    ],
  },
  {
    id: 'stFind', icon: '🔦', title: (L, x) => by(x, ['Under the floor', 'Behind the wall', 'The beam']),
    ok: at((L, x) => !!H(L).proj && H(L).proj.id === x.id && !H(L).proj.gone),
    text: (L, x) => by(x, [
      'The builders lift the old floor and find a well under it: forty feet deep, brick-lined, with a bucket still on the rope. The foreman would like to know what you want done about it, ideally by lunchtime.',
      'Behind the plaster the builders find a fireplace that was bricked up long ago, and on its ledge, a bundle of letters tied with a ribbon, dated 1911.',
      'The builders have found that the old beam everything rests on is rotten right through. You could put your thumb in it. The foreman puts his thumb in it, to show you.',
    ]),
    opts: [
      { t: 'Have it capped with glass, and lit', show: (L, x) => x.v % 3 === 0, cost: (L, x) => Math.round(L.stProjCost(x.id, 'sound') * 0.06 / 10) * 10, run(L) { L.joy(4); const d = H(L).proj; if (d) d.q = Math.min(1.1, (d.q || 1) + 0.05); return 'A thick glass lid and a light at the bottom. Guests stand on it and scream, and you never tire of it.'; } },
      { t: 'Fill it in', show: (L, x) => x.v % 3 === 0, run() { return 'Forty tons of hardcore, and it is a floor again. You think about it sometimes, down there.'; } },
      { t: 'Read them', show: (L, x) => x.v % 3 === 1, run(L) { L.joy(4); L.gain('smarts', 0.6); return 'Love letters, from a fisherman to a girl in this house, who said yes in the last one. You read them all in one sitting and then sit for a while.'; } },
      { t: 'Take them to Miss Achterberg for the archives', show: (L, x) => x.v % 3 === 1, run(L) { L.karma(2); if (L.folkWarm && L.s.folk) L.folkWarm('achterberg', 6); return 'Miss Achterberg puts on white gloves to receive them, and whispers that they are the most romantic thing she has ever held. Then she asks you never to tell anyone she said so.'; } },
      { t: 'Replace the beam', show: (L, x) => x.v % 3 === 2, cost: (L, x) => Math.round(L.stProjCost(x.id, 'sound') * 0.15 / 10) * 10, run() { return 'A new oak beam, craned in through the roof, with half the street watching. It will see the rest of you out.'; } },
      { t: 'Paint over it and say nothing', show: (L, x) => x.v % 3 === 2, run(L) { L.karma(-1); const d = H(L).proj; if (d) d.q = Math.max(0.5, (d.q == null ? 1 : d.q) - 0.25); const h = H(L); h.snag = { id: d ? d.id : x.id, t: L.s.t + L.int(6, 12) }; return 'The foreman looks at you for a long moment, and then at the paint, and does as he is told.'; } },
    ],
  },
  {
    id: 'stSnag', icon: '🪣', title: 'Daz’s work',
    ok: at((L, x) => L.stOwned() && !!H(L).done[x.id]),
    text: (L, x) => `${by(x, ['The new', 'Your'])} ${PROJECTS[x.id].name.replace(/^An? /, '').toLowerCase()} has started to show its seams: a drip when it rains, a crack along the corner, a door that does not quite shut. Daz’s work, it turns out, was quick in more ways than one.`,
    opts: [
      { t: 'Have Penwarden & Sons put it right', cost: (L, x) => Math.round(L.stProjCost(x.id, 'sound') * 0.2 / 10) * 10, run(L, x) { const d = H(L).done[x.id]; d.q = Math.max(d.q, 1); d.v = Math.round(PROJECTS[x.id].cost * PROJECTS[x.id].value); return 'Mr Penwarden’s sons take it half apart and put it back together properly, tutting. It is right now.'; } },
      { t: 'Ring Daz', odds: () => 0.4, run(L, x, win) { if (win) return 'Daz comes back, to everyone’s surprise, and fixes it for nothing, saying it is “a point of pride”. Nobody had suspected Daz of pride.'; const d = H(L).done[x.id]; d.q -= 0.15; d.v = Math.round(d.v * 0.85); L.joy(-2); return 'Daz’s telephone says he is on holiday. It has said so for a month.'; } },
      { t: 'Live with it', run(L, x) { const d = H(L).done[x.id]; d.q -= 0.15; d.v = Math.round(d.v * 0.85); L.joy(-1); return 'You put a bucket under the drip, and a draught excluder against the door, and call it character.'; } },
    ],
  },
  {
    id: 'stPlan', icon: '📜', title: 'An objection',
    ok: at((L, x) => !!H(L).proj && H(L).proj.id === x.id && !!L.stNb(x.n)),
    text: (L, x) => { const n = L.stNb(x.n); return `${n.name} has written to the council objecting to your ${PROJECTS[x.id].name.replace(/^An? /, '').toLowerCase()}: ${by(x, [`it will take the light from ${his(n)} kitchen`, `it will spoil the view ${he(n)} has had since 1974`, 'it is, in a word, vulgar', 'nobody asked'])}. ${He(n)} has also told the whole street.`; },
    opts: [
      { t: 'Go round and talk it through', check: ['charm', 45], run(L, x, win) { const n = L.stNb(x.n); if (win) { L.stWarm(n, 12); return `Over a cup of tea you show ${him(n)} the drawings, and move a window, and ${he(n)} withdraws it. ${He(n)} also asks if ${his(n)} nephew could have a look round when it is done.`; } L.stWarm(n, -10); H(L).proj.stop = 1; return `It does not go well. The objection stays, and the work stops for a season while the council thinks about it.`; } },
      { t: 'Fight it at the planning meeting', check: ['charm', 40], run(L, x, win) { const n = L.stNb(x.n); n.feud = Math.max(n.feud, 1); L.stWarm(n, -18); if (win) return `You speak well, and the committee waves it through. ${first(n)} does not look at you on the way out, or, as it turns out, for some time after.`; H(L).proj.cut = 1; H(L).proj.q = Math.min(H(L).proj.q == null ? 1 : H(L).proj.q, 0.85); return 'The committee likes it, but not that much of it. You build it smaller, and it shows.'; } },
      { t: 'Make it smaller, to keep the peace', run(L, x) { const n = L.stNb(x.n); L.stWarm(n, 8); H(L).proj.q = Math.min(H(L).proj.q == null ? 1 : H(L).proj.q, 0.85); return `You lose a window and a few feet. ${first(n)} sends round a note that says only “Thank you”, underlined.`; } },
    ],
  },
  {
    id: 'stDone', icon: (L, x) => PROJECTS[x.id].icon, title: (L, x) => (x.b === 'diy' ? 'Built with your own hands' : 'The builders are out'),
    ok: at((L, x) => !!H(L).done[x.id]),
    text: (L, x) => {
      const said = {
        knock: 'The wall is gone, and the flat is twice the size it was, and full of light. You keep walking through where the wall was, for the pleasure of it.',
        loft: 'The loft room is finished: white walls, a skylight full of sky, and stairs you can walk up without bending. At night you can see the stars through the glass.',
        conserv: 'The conservatory is finished: glass on three sides, a cane chair, a tomato plant with ambitions. In the rain it sounds like being inside a drum.',
        workshop: 'The workshop at the end of the garden is finished: a bench, a vice, a radio and a door that shuts. It smells of sawdust and possibility.',
        annexe: 'The annexe is finished: a little house of its own at the end of the garden, with a kitchen and a door and a window box.',
        pool: 'The pool is filled: blue water on the edge of the cliff, with the sea below it, bluer. You swim the first length at dawn, alone, and float on your back.',
        roof: 'The scaffolding comes down at last. Six seasons, eleven men, forty thousand slates and a family of jackdaws relocated at great expense. The manor has a roof that will see out the century.',
      }[x.id];
      return `${said}${x.b === 'diy' ? ' Every bit of it is yours.' : x.q < 0.9 ? ' It is not quite what was on the drawings, but it is there.' : ''}`;
    },
    opts: [
      { t: 'Ask the street round to see it', cost: (L) => fee(L, 300), show: (L, x) => x.id !== 'annexe' && L.stNbs().length > 0, run(L) { for (const n of L.stNbs()) L.stWarm(n, n.st < -10 ? 2 : 6); L.joy(4); return 'Wine in plastic cups and the neighbours admiring it, some more sincerely than others. Everybody goes home wanting one.'; } },
      { t: (L) => { const p = L.s.people.find((q) => q.kind === 'parent' && q.age >= 65); return p ? `Ask ${first(p)} to move in` : 'Ask a parent to move in'; }, show: (L, x) => x.id === 'annexe' && L.s.people.some((q) => q.kind === 'parent' && q.age >= 65), run(L) { const p = L.s.people.find((q) => q.kind === 'parent' && q.age >= 65); H(L).ann = { p: p.id, let: false, asked: L.s.t }; L.bond(p, 10); L.joy(3); L.note(`${first(p)} moved into the annexe at the end of the garden.`); return `${first(p)} looks round it twice, opens all the cupboards, and says it will do. ${He(p)} moves in with a clock, a kettle and a lifetime of opinions about your garden.`; } },
      { t: 'Let it to holidaymakers', show: (L, x) => x.id === 'annexe', run(L) { H(L).ann = { p: null, let: true, asked: L.s.t }; return 'A key safe, clean towels and a visitors’ book. The first couple write “Lovely!” in it, and take a towel.'; } },
      { t: 'Just enjoy it', run(L) { L.joy(3); return 'You sit in it with a cup of tea and do nothing at all. That was the point.'; } },
    ],
  },

  // ---- the landlord ----
  {
    id: 'stLLFault', log: false, icon: (L, x) => FAULTS[x.f].icon, title: (L, x) => (x.ask === 2 ? `${FAULTS[x.f].name}: worse` : FAULTS[x.f].name),
    ok: at((L, x) => !L.s.owned && !!H(L).ll && H(L).f[x.f] && H(L).f[x.f].st === 'left'),
    text: (L, x) => {
      const F = FAULTS[x.f], ll = LL(L), said = x.ask === 2 ? by(x, F.worse) : x.ask === 3 ? F.back : by(x, F.saw);
      return `${said} It is not your house: it is ${ll.agency ? 'Tidewater Lettings’' : `${ll.name}’s`}${ll.known ? `, who ${LANDLORDS[ll.kind].word}` : ''}.`;
    },
    opts: [
      {
        t: (L) => `Ring ${LL(L).name}`, odds: (L) => clamp(LANDLORDS[LL(L).kind].odds + (LL(L).tn >= 60 ? 0.1 : 0) - L.luck(), 0.05, 0.98),
        run(L, x, win) {
          const ll = LL(L), F = FAULTS[x.f];
          ll.known = 1;
          if (win) { L.stMend(x.f, 'proper'); ll.tn = clamp(ll.tn + 2, 0, 100); return ll.kind === 'good' ? `${ll.name} is round within the hour with a man and a ladder, and apologises as if it were her fault. ${L.pick(F.done)}` : `${ll.name} sends somebody, eventually. ${L.pick(F.done)}`; }
          L.stLeave(x.f);
          return L.pick([`${ll.name} says ${llHe(ll)} will send somebody on Tuesday. Tuesday comes and goes, as Tuesdays do.`, `${ll.name} says it is “wear and tear”, which seems to mean yours.`, `${ll.name}’s answering machine is full, and has been since the spring.`]);
        },
      },
      {
        t: (L, x) => `Fix it yourself (Craft ${FAULTS[x.f].diy})`, show: (L, x) => FAULTS[x.f].diy != null, cost: (L, x) => Math.round(L.stFaultCost(x.f, 'diy') * 0.6 / 10) * 10,
        odds: (L, x) => L.checkOdds('craft', FAULTS[x.f].diy) - L.luck(),
        run(L, x, win) {
          const ll = LL(L);
          busy(L, 1); L.gain('craft', 2); ll.known = 1;
          if (win) { L.stMend(x.f, 'proper'); ll.tn = clamp(ll.tn + 4, 0, 100); L.joy(3); return `You do it yourself, on a Saturday, and do it properly, and send ${ll.name} the receipt. ${ll.kind === 'good' ? 'She takes it off the rent and sends a card.' : ll.kind === 'sharp' ? 'The receipt is not acknowledged.' : 'He says “good, good”.'}`; }
          L.stMend(x.f, 'patch'); L.joy(-2);
          return 'It is not mended so much as hidden. It will hold, for a while.';
        },
      },
      {
        t: 'Report it to the council', show: (L, x) => LL(L).kind !== 'good' && (x.ask >= 2 || LL(L).known), odds: () => 0.65,
        run(L, x, win) { const ll = LL(L); ll.tn = clamp(ll.tn - 25, 0, 100); if (win) { L.stMend(x.f, 'proper'); return `A woman from the council with a clipboard and a damp meter visits ${ll.name}, and then a builder visits you. ${ll.name} does not visit, or speak, or send a Christmas card.`; } return `The council writes to ${ll.name}, who writes back. It goes on like that. Nothing is mended, and ${ll.name} knows who complained.`; },
      },
      { t: 'Put up with it', run(L, x) { L.stLeave(x.f); L.joy(-1); return L.pick(['You put a towel along the bottom of it and get on with your life.', 'You learn to live with it. People can learn to live with nearly anything.', 'You move the bed.']); } },
    ],
  },
  {
    id: 'stLLRent', icon: '✉️', title: (L) => (LL(L).agency ? 'A letter from Tidewater Lettings' : `A letter from ${LL(L).name}`),
    ok: at((L) => !L.s.owned && !!H(L).ll && HOMES[L.s.home].rent != null),
    text: (L, x) => {
      const ll = LL(L), now = Math.round(L.rentOf(L.s.home) * (1 + ll.up) / 10) * 10, then = Math.round(L.rentOf(L.s.home) * (1 + ll.up + x.by) / 10) * 10;
      const how = ll.kind === 'good' ? by(x, ['She is ever so sorry, and the rates have gone up, and so must the rent, a little.', 'She hates to ask. The roof insurance has doubled, she says, and she has to.']) : ll.kind === 'sharp' ? by(x, ['“In line with the market,” it says, which is never good.', '“Following a review,” it says. Nobody reviewed anything with you.', '“Regrettably,” it begins, and does not seem to regret anything.']) : by(x, ['It has taken him three drafts and a lot of crossings out.', 'It is on the back of an old gas bill.']);
      return `${how} The rent is to go up from ${money(now)} to ${money(then)} a season.`;
    },
    opts: [
      { t: 'Pay it', run(L, x) { const ll = LL(L); ll.up += x.by; ll.tn = clamp(ll.tn + 2, 0, 100); ll.known = 1; return 'You pay it. You always do. That is rather the trouble.'; } },
      { t: 'Haggle', check: ['charm', 45], run(L, x, win) { const ll = LL(L); ll.known = 1; if (win) { ll.up += x.by / 2; return `You meet ${ll.agency ? 'the agent' : ll.name} halfway, which is a good deal more than halfway from where ${llHe(ll)} started.`; } ll.up += x.by; ll.tn = clamp(ll.tn - 5, 0, 100); return 'You do not haggle well. The rise goes through, and you have a feeling it has been noted.'; } },
      { t: 'Say you will go elsewhere', odds: (L) => ({ good: 0.8, slack: 0.5, sharp: 0.25 })[LL(L).kind], run(L, x, win) { const ll = LL(L); ll.known = 1; if (win) return ll.kind === 'good' ? 'She would hate to lose you, she says, and forgets all about it.' : `${ll.name} thinks about it, and decides you are less trouble than an empty flat.`; ll.up += x.by; ll.tn = clamp(ll.tn - 15, 0, 100); return `“Go, then,” is the gist of the reply. You do not go. The rise goes through, and ${ll.name} will remember.`; } },
    ],
  },
  {
    id: 'stLLNotice', icon: '📬', title: 'Notice to quit',
    ok: at((L) => !L.s.owned && !!H(L).ll),
    text: (L, x) => { const ll = LL(L); return `${ll.agency ? 'Tidewater Lettings write that the owner' : ll.name} ${by(x, ['is selling up', 'wants the place for a nephew who is “starting out”', 'is “taking it back into the family”'])}, and would like you out by the end of the season. ${ll.kind === 'good' ? 'There is a box of shortbread with the letter, which does not help.' : 'There is nothing else with the letter.'}`; },
    opts: [
      { t: 'Find somewhere like it', cost: (L) => Math.round(L.rentOf(L.s.home) / 2), run(L) { const was = HOMES[L.s.home].name; S(L).lease++; L.joy(-3); L.note(`Had to leave the ${low(was)}, and found another.`); return `A week of viewings, a van, a lot of boxes, and you are in another ${low(was)}, on another street, with other neighbours. It takes a while to stop going to the old one.`; } },
      {
        t: (L) => { const k = cheaper(L); return k ? `Take somewhere cheaper: ${an(low(HOMES[k].name))}` : 'Take somewhere cheaper'; }, show: (L) => !!cheaper(L),
        run(L) { const k = cheaper(L); S(L).lease++; L.settleIn(k, null); L.note(`Had to leave, and moved into the ${low(HOMES[k].name)}.`); return `You take the ${low(HOMES[k].name)}. It is smaller. The rent is smaller too, and that will have to do.`; },
      },
      {
        t: 'Offer to buy it', show: (L) => HOMES[L.s.home].price != null, why: (L) => (L.s.estate.length >= 12 ? 'You have property enough.' : L.planWhy(L.buyPlan(L.s.home, false))),
        run(L) { const p = L.buyPlan(L.s.home, false); L.pay(p); own(L, p.price); return `${LL(L).name} is so surprised ${llHe(LL(L))} says yes before thinking. You buy the ${homeSaid(L)} you were being turned out of${p.loan ? `, ${money(p.loan)} of it borrowed` : ''}. You have never enjoyed a cup of tea so much.`; },
      },
      { t: 'Plead to stay', check: ['charm', 50], run(L, x, win) { const ll = LL(L); if (win) { ll.up += 0.1; ll.told = 0; return `${ll.name} gives in, on condition the rent goes up. It goes up. You stay.`; } S(L).lease++; L.joy(-5); L.note('Turned out of a rented home, and found another like it.'); return 'It does no good. At the end of the season the van comes, and you are in another place, on another street, starting again.'; } },
    ],
  },
  {
    // The good landlady, retiring, would rather sell to the tenant who never gave her trouble.
    id: 'stLLSell', icon: '🔑', title: 'An offer',
    ok: at((L) => !L.s.owned && !!H(L).ll && H(L).ll.kind === 'good' && HOMES[L.s.home].price != null),
    text: (L) => { const ll = LL(L), p = sellPrice(L); return `${ll.name} is retiring to her sister’s in Kettleby, and selling up. She would rather sell to you than to strangers: ${money(p)}, which is a good deal under what it would fetch, with a tenth down and the rest paid to her, ${money(Math.ceil((p - Math.round(p / 10)) / 40 / 10) * 10)} a season over ten years, and no interest, “because you have always paid on time and never once rung me about nothing”.`; },
    opts: [
      {
        t: 'Shake on it', cost: (L) => Math.round(sellPrice(L) / 10), why: (L) => (L.s.estate.length >= 12 ? 'You have property enough.' : null),
        run(L) {
          const ll = LL(L), p = sellPrice(L), down = Math.round(p / 10), what = `Paying ${ll.name} for the ${homeSaid(L)}`;
          S(L).owe.push({ what, left: p - down, each: Math.ceil((p - down) / 40 / 10) * 10 });
          own(L, p);
          S(L).f.bought = 1;
          L.joy(10);
          return `You shake on it in her kitchen, and she cries, and you nearly do. The ${homeSaid(L)} is yours: the same rooms, the same view, and the strangest feeling that the walls have changed.`;
        },
      },
      { t: 'Thank her, but no', run(L) { const h = H(L); h.ll = { ...h.ll, kind: 'sharp', name: 'Tidewater Lettings', agency: true, up: h.ll.up, tn: 40, since: L.s.t, nextUp: L.s.t + 4, offered: L.s.t, known: 0 }; return 'She sells to a company in Exeter. The new landlord is Tidewater Lettings, who write to introduce themselves, and to mention the rent.'; } },
    ],
  },

  // ---- the garden ----
  {
    id: 'stShow', icon: '🏵️', title: 'The Harvest Show',
    ok: at((L) => L.season === 2 && L.stShowable().length > 0),
    text: (L, x) => `${by(x, ['The big tent in Pebble Park, long tables, and the garden classes, judged by a retired headmaster with a magnifying glass.', 'The Harvest Show again: the tent smells of crushed grass and onions, and the judges are already muttering.', 'Trestle tables in the big tent, rows of entries on white paper plates, and a great deal of looking without seeming to look.'])} Your ${L.stShowable().map(([c]) => CLASSES[c].name.replace(/^the /, '')).join(' and ')} could go in.${Object.values(S(L).shows).some((n) => n) ? ' They remember your name from before.' : ''}`,
    opts: [...Object.keys(CLASSES).map((c) => ({
      t: () => `Enter ${CLASSES[c].name}`, show: (L) => L.stShowable().some((o) => o[0] === c),
      odds: (L) => { const q = (L.stShowable().find((o) => o[0] === c) || [0, 0])[1]; return clamp(0.12 + q * 0.5 + L.s.st.craft / 400 - 0.06 * (S(L).shows[c] || 0), 0.05, 0.9); },
      run(L, x, win) {
        const S2 = S(L);
        L.joy(win ? 6 : 1);
        if (!win) return L.pick([`Highly commended, on a little card. The winner has been growing ${c === 'roses' ? 'roses' : c === 'fruit' ? 'pears' : 'leeks'} since 1961.`, 'Third, behind two people who have clearly been doing this for a very long time and want you to know it.', 'Nothing this year. The judge pauses at yours, though, and you are sure of it.']);
        S2.shows[c] = (S2.shows[c] || 0) + 1; S2.n.shows++;
        L.cash(fee(L, CLASSES[c].prize)); L.fame(0.5);
        if (S2.n.shows === 1) L.note(`Took a first for ${CLASSES[c].name} at the Harvest Show, with ${c === 'roses' ? 'roses' : c === 'fruit' ? 'apples' : 'vegetables'} grown at home.`, 'big');
        return `First! A red rosette and ${money(fee(L, CLASSES[c].prize))}${c === 'fruit' ? ' for a plate of five apples, polished on your sleeve' : c === 'roses' ? ' for three blooms in a jam jar, and the vicar asks for a cutting' : ' for a basket of vegetables with the soil washed off'}. You pretend to be calm about it.`;
      },
    })), { t: 'Just go and look', run(L) { L.joy(2); return 'You look at the winners and think, next year.'; } }],
  },
  {
    id: 'stBloom', icon: '🌸', title: 'Bay in Bloom',
    ok: at((L) => L.season === 1 && !!H(L).g),
    text: (L, x) => {
      const small = x.size < 1, lady = L.stNbs().find((n) => n.role === 'lady');
      if (small) return `Bay in Bloom has a class for window boxes and yards this year, and three judges in sun hats are working their way down ${H(L).kind === 'bedsit' ? 'the alley behind the chip shop' : 'Harbour Court'} with clipboards.`;
      return `The Bay in Bloom judges are doing the rounds: three of them, in hats, with clipboards, and a photographer from the Gazette.${lady ? ` ${lady.name} of the Grange has won the big gardens ${31 + (L.s.street.n.bloomLost || 0)} years running, and is watching from her gate.` : ''}`;
    },
    opts: [
      { t: 'Show them round', odds: (L) => bloomOdds(L, 0), run: (L, x, win) => bloomGo(L, x, win) },
      { t: 'Tidy up first, then show them round', odds: (L) => bloomOdds(L, 0.12), run: (L, x, win) => { busy(L, 1); L.gain('fitness', 0.5); return bloomGo(L, x, win); } },
      { t: 'Hide behind the curtains', run() { return 'They look over the wall, write something down, and move on. You never find out what.'; } },
    ],
  },
  {
    id: 'stFrogs', icon: '🐸', title: 'Frogs',
    ok: at((L) => !!H(L).g && !!H(L).g.ft.pond),
    text: 'The frogs have found the pond. One morning there are eleven of them in it, sitting with their noses out, looking at you as if you were the one who had moved in.',
    opts: [
      { t: 'Fetch the children', show: (L) => L.kids().some((k) => k.age >= 2 && k.age < 13), run(L) { for (const k of L.kids()) if (k.age >= 2 && k.age < 13) L.bond(k, 6); L.joy(5); return 'The children lie on their stomachs by the pond for an hour, naming them. The biggest is called Mr Wobbly. You are not consulted.'; } },
      { t: 'Sit and watch them', run(L) { L.joy(4); return 'You sit on the edge with a cup of tea until it goes cold. One of them blinks at you, slowly, and you blink back.'; } },
    ],
  },
  {
    id: 'stApple', icon: '🍏', title: 'The first apple',
    ok: at((L) => !!H(L).g && !!H(L).g.ft.fruit),
    text: 'The tree you planted has given you its first apple: small, red on one side, with a bit of it a bird has had. Three years, the man at the nursery said, the way people say “one day”. It has been three years.',
    opts: [
      { t: 'Eat it there and then', run(L) { S(L).n.apples++; L.joy(6); L.note('Ate the first apple off the tree you planted.', 'big'); return 'You eat it standing under the tree, core and all. It is the best apple there has ever been, and you will not hear otherwise.'; } },
      { t: (L) => `Give it to ${first(L.partner() || L.kids()[0] || { name: 'somebody' })}`, show: (L) => !!(L.partner() || L.kids().length), run(L) { const p = L.partner() || L.kids()[0]; S(L).n.apples++; L.bond(p, 6); L.joy(5); L.note(`Gave ${first(p)} the first apple off the tree you planted.`, 'big'); return `${first(p)} eats it slowly, very seriously, and says it is the best apple ${he(p)} has ever had. ${He(p)} may even mean it.`; } },
      { t: 'Wait for more, and make a pie', run(L) { S(L).n.apples++; L.gain('craft', 1); L.joy(4); L.note('Made a pie with the first apples off the tree you planted.', 'big'); return 'You wait a fortnight, pick nine, and make a pie. It is lopsided and wonderful, and the kitchen smells of it for a day.'; } },
    ],
  },
  {
    id: 'stOpenDay', icon: '🎟️', title: 'Open gardens',
    ok: at((L) => L.stOwned() && L.season === 1),
    text: (L) => `The Open Gardens people would like to put ${H(L).kind === 'manor' ? 'the grounds' : 'your garden'} in their little yellow book: a Sunday in June, teas on the lawn, and the public walking round your borders with their hands behind their backs.`,
    opts: [
      { t: 'Open it for St Brigid’s roof', run(L) { const n = fee(L, H(L).kind === 'manor' ? 2400 : 1200); L.karma(3); L.fame(1); L.joy(5); L.s.n.given = (L.s.n.given || 0) + n; if (L.folkWarm && L.s.folk && L.folk('hollis').met != null) L.folkWarm('hollis', 6); return `Four hundred people, eleven cakes, one lost child (found), and ${money(n)} for the church roof. The Reverend Hollis hugs you at the gate, and then the gatepost, for good measure.`; } },
      { t: 'Open it, and charge at the gate', run(L) { const n = fee(L, H(L).kind === 'manor' ? 3000 : 1500); L.cash(n); L.fame(1); L.joy(3); L.s.n.earned += n; return `${money(n)} at the gate, and a visitors’ book full of compliments and one complaint about the slope.`; } },
      { t: 'Keep it to yourself', run() { return 'You say no thank you. On the Sunday you sit in it, alone, which was what it was for.'; } },
    ],
  },
  {
    id: 'stWild', icon: '🌿', title: 'Gone wild',
    ok: at((L) => !!H(L).g),
    text: (L, x) => by(x, ['The garden has gone its own way: brambles over the path, nettles at the back door, and a family of foxes living in what was the lawn. Next door has noticed.', 'You can no longer see the end of the garden from the house. Something has been nesting in the shed. The neighbours have started to look over the wall with expressions.']),
    opts: [
      { t: 'Get a man in to clear it', cost: (L) => fee(L, 220 * L.stSize()), run(L) { H(L).g.care = 60; for (const n of L.stNbs()) L.stWarm(n, 2); return 'A man with a strimmer and a skip, two days, and the garden comes back out from underneath, blinking.'; } },
      { t: 'Clear it yourself', run(L) { busy(L, 2); L.gain('fitness', 1.5); L.hp(-1); H(L).g.care = 55; return 'Two days in gloves, scratched to the elbow, with a bonfire at the end of it. The garden is back, more or less, and so are you.'; } },
      { t: 'Let it be a meadow', run(L) { H(L).g.wild = -16; L.joy(2); for (const n of L.stNbs()) if (['fence', 'watch', 'lady'].includes(n.role)) L.stWarm(n, -5); return 'You call it a meadow, and buy a book about meadows. The bees come, and the butterflies, and a man from the council, once.'; } },
    ],
  },
  {
    id: 'stCutting', icon: '🌹', title: 'A cutting',
    ok: at((L) => !!H(L).g && L.stSize() >= 2),
    text: 'In a bucket by the back door is a cutting from the roses at your last house, dug up on the last morning with the van at the gate. It has two leaves and a look of determination.',
    opts: [
      { t: 'Plant it', run(L) { const g = H(L).g; if (!g.ft.roses) g.ft.roses = { at: L.s.t, m: 0.4, mine: 1 }; else g.ft.roses.m = Math.min(1, g.ft.roses.m + 0.2); L.joy(4); return 'You plant it by the door, where you will pass it every day. By the summer it has a bud, and by the next it has twenty.'; } },
      { t: 'Give it to a neighbour', show: (L) => L.stNbs().length > 0, run(L) { const n = L.stNbs().slice().sort((a, b) => b.st - a.st)[0]; L.stWarm(n, 8); L.joy(2); return `You give it to ${first(n)}, who plants it by ${his(n)} gate. You see it every time you go out.`; } },
    ],
  },
  {
    id: 'stGardener', icon: '🧑‍🌾', title: (L, x) => first({ name: x.name }),
    ok: at((L, x) => !!H(L).staff.gardener && H(L).staff.gardener === x.name),
    text: (L, x) => by(x, [`${x.name} has entered your dahlias in the Harvest Show, under his own name, and won. He is very pleased. The dahlias are in the Gazette, with him standing next to them.`, `${x.name} would like to retire. His knees have handed in their notice, he says, and the rest of him is following. He has a nephew, who is keen.`]),
    opts: [
      { t: 'Let him have the glory', show: (L, x) => x.v % 2 === 0, run(L) { L.joy(2); L.karma(1); return 'He brings you the rosette, in the end, and puts it on the kitchen windowsill, where it stays.'; } },
      { t: 'Have a word', show: (L, x) => x.v % 2 === 0, run(L) { H(L).g.care = Math.max(0, H(L).g.care - 15); return 'He sulks for a month. The garden can tell.'; } },
      { t: 'Take on the nephew', show: (L, x) => x.v % 2 === 1, run(L) { const h = H(L), old = h.staff.gardener.split(' ').slice(1).join(' '); h.staff.gardener = `${L.pick(['Ollie', 'Kit', 'Robbie', 'Sam'])} ${old}`; h.staff.gAt = L.s.t; h.staff.gT = 0; return `${h.staff.gardener.split(' ')[0]} turns out to be keen in a way that involves a podcast about soil. The garden has never looked better.`; } },
      { t: 'See to it yourself from now on', show: (L, x) => x.v % 2 === 1, run(L) { H(L).staff.gardener = null; L.joy(1); return 'You give him a bottle and a card and his kneeler, which he leaves behind on purpose, for you.'; } },
    ],
  },
  {
    id: 'stKeeper', icon: '🧹', title: (L, x) => x.name,
    ok: at((L, x) => !!H(L).staff.keeper && H(L).staff.keeper === x.name),
    text: (L, x) => by(x, [`${x.name} knows everything about everybody on the street, and has started, over the ironing, to tell you.`, `${x.name} has found a box in the attic: photographs of the house a hundred years ago, with a family on the steps in their best clothes, squinting.`]),
    opts: [
      { t: 'Listen', show: (L, x) => x.v % 2 === 0, run(L) { L.joy(2); L.gain('charm', 0.6); return 'You learn who is not speaking to whom, why, and what was said at the bowls club in 1998. You will never look at the street the same way.'; } },
      { t: 'Ask her, kindly, not to', show: (L, x) => x.v % 2 === 0, run(L) { L.karma(1); return 'She says of course, and does not, but more quietly.'; } },
      { t: 'Frame the best of them for the hall', show: (L, x) => x.v % 2 === 1, run(L) { L.joy(4); return 'The family on the steps hang in your hall now. Visitors ask if they are yours. In a way, you say.'; } },
      { t: 'Give them to Miss Achterberg', show: (L, x) => x.v % 2 === 1, run(L) { L.karma(2); if (L.folkWarm && L.s.folk) L.folkWarm('achterberg', 5); return 'Miss Achterberg identifies everybody on the steps by name within the week, and writes you a letter about them in green ink.'; } },
    ],
  },
  {
    id: 'stAnnexe', icon: '🏠', title: 'The annexe',
    ok: at((L) => !!H(L).ann && H(L).ann.p == null && L.s.people.some((p) => p.kind === 'parent' && p.age >= 68)),
    text: (L) => { const p = L.s.people.find((q) => q.kind === 'parent' && q.age >= 68); return `The annexe at the end of the garden ${H(L).ann.let ? 'has had holidaymakers in it all summer' : 'stands empty'}, and ${first(p)} is ${p.age} now, on ${his(p)} own, and says ${he(p)} is managing, in a voice that says ${he(p)} is not, quite.`; },
    opts: [
      { t: (L) => `Ask ${first(L.s.people.find((q) => q.kind === 'parent' && q.age >= 68))} to move in`, run(L) { const p = L.s.people.find((q) => q.kind === 'parent' && q.age >= 68); H(L).ann.p = p.id; H(L).ann.let = false; L.bond(p, 10); L.joy(3); L.note(`${first(p)} moved into the annexe at the end of the garden.`); return `${first(p)} says ${he(p)} would not want to be a nuisance, and is packed by Thursday. ${He(p)} has opinions about your roses within the week.`; } },
      { t: 'Leave it as it is', run() { return 'You leave it be. There is time, you tell yourself.'; } },
    ],
  },

  // ---- the street as a whole ----
  {
    id: 'stParty', icon: '🎉', title: 'A street party',
    ok: at((L) => L.season === 1 && L.stNbs().length >= 2),
    text: (L, x) => by(x, ['Somebody has had the idea of a street party for the summer: bunting, trestle tables down the middle of the road, and the council’s permission, which has been asked for twice.', 'There is to be a street party, if anybody can be found to organise it. Everybody is looking at everybody else.']),
    opts: [
      { t: 'Organise it yourself', cost: (L) => fee(L, 250), check: ['charm', 40], run(L, x, win) { for (const n of L.stNbs()) L.stWarm(n, win ? (n.st < -10 ? 8 : 12) : 5); L.joy(win ? 7 : 2); if (win) { L.karma(1); return 'Bunting from lamp-post to lamp-post, three hundred sandwiches, a man with an accordion and children asleep under the tables by nine. The street talks about it for years.'; } return 'It rains from eleven until four. Everybody crowds into two front rooms with the sausage rolls, and it is, somehow, lovely anyway.'; } },
      { t: 'Bring a dish', check: ['craft', 30], run(L, x, win) { for (const n of L.stNbs()) L.stWarm(n, win ? 6 : 2); L.joy(4); return win ? 'Your dish is gone in ten minutes, and three people want the recipe.' : 'Your dish is the one left at the end, but people are kind about it.'; } },
      { t: 'Stay in with the curtains drawn', run(L) { for (const n of L.stNbs()) L.stWarm(n, -3); return 'You hear it all through the window: the accordion, the laughing, your name, once.'; } },
    ],
  },
  {
    id: 'stDoctor', icon: '🩺', title: 'A familiar face',
    ok: (L) => !L.s.gaol && !!L.s.ill,
    text: (L, x) => `The young doctor who comes round the ward at St Wren’s has a face you know: ${x.name}, who used to revise in the next bunk with a highlighter in each hand. ${x.sex === 'm' ? 'He' : 'She'} knows you at once.`,
    opts: [{ t: 'Ask how it all turned out', run(L, x) { const n = L.s.ill ? L.s.ill.name : 'trouble'; if (L.s.ill && L.s.ill.sev <= 2) L.s.ill = null; L.hp(4); L.joy(5); return `${x.sex === 'm' ? 'He' : 'She'} sorts out your ${n}, sits on the end of your bed for ten minutes when ${x.sex === 'm' ? 'he' : 'she'} should not, and will not hear of thanks. “You tested me on the bones of the hand,” ${x.sex === 'm' ? 'he' : 'she'} says. “Every one.”`; } }],
  },
];

// Somewhere cheaper to rent, that the family would fit in.
function cheaper(L) {
  const now = HOMES[L.s.home].tier;
  return ['townhouse', 'cottage', 'flat', 'bedsit'].find((k) => HOMES[k].tier < now && HOMES[k].rent != null && !L.liveWhy(k)) || null;
}
// What the good landlady would take, from a good tenant.
function sellPrice(L) { return Math.round(L.propPrice(L.s.home) * 0.8 / 1000) * 1000; }
// The rented house you live in becomes yours: the same house, the same street, a key of its own.
function own(L, price) {
  const s = L.s, S2 = S(L), h = H(L), old = S2.at;
  const e = { id: s.eid++, kind: s.home, ups: {}, let: false };
  s.estate.push(e);
  L.settleIn(s.home, e);
  delete S2.homes[old];
  h.owned = true; h.ll = null;
  S2.homes[`e${e.id}`] = h;
  S2.at = `e${e.id}`;
  L.note(`Bought the ${low(HOMES[s.home].name)} you had rented, for ${money(price)}.`, 'big');
}
// Bay in Bloom: how good the garden is, against the field (and the lady at the Grange).
function bloomOdds(L, plus) {
  const S2 = S(L), lady = L.stNbs().find((n) => n.role === 'lady');
  return clamp(0.05 + L.stScore() / 100 * 0.8 + L.s.st.charm / 500 + plus - 0.05 * S2.n.bloom - (lady ? 0.15 : 0), 0.04, 0.9);
}
function bloomGo(L, x, win) {
  const S2 = S(L), lady = L.stNbs().find((n) => n.role === 'lady'), small = x.size < 1;
  if (!win) {
    L.joy(1);
    if (lady) { S2.n.bloomLost = (S2.n.bloomLost || 0) + 1; L.stWarm(lady, 3); return `${first(lady)} wins again. She sends you a note, in very small writing, to say that yours was “very nearly there”, which from her is a medal.`; }
    return L.pick(['Highly commended. The card goes on the fridge.', 'Second, behind a man on the Kettleby road who has a hanging basket the size of a car.', 'Nothing this year, but one of the judges stops to smell something and says “oh”.']);
  }
  S2.n.bloom++;
  L.cash(fee(L, small ? 100 : 250)); L.joy(8); L.fame(1); L.karma(1);
  if (S2.n.bloom === 1) L.note(`Won ${small ? 'the window boxes' : 'the gardens'} at Bay in Bloom.`, 'big');
  if (lady) { L.stWarm(lady, -6); lady.f.beaten = 1; return `First! After thirty-one years, ${lady.name} is second. She shakes your hand at the presentation, firmly, for slightly too long, and says she looks forward to next year.`; }
  return small ? `First prize for the best window boxes in the Bay, and ${money(fee(L, 100))}. The photographer from the Gazette has to lean out of your window to get the shot.` : `First prize, a little brass plaque for the gate, and ${money(fee(L, 250))}. Your photograph is in the Gazette, squinting, holding a trowel you have never used.`;
}

// For street-ui.js: what a fault on your house is, in a line.
export const faultLine = (L, f, r) => {
  const F = FAULTS[f];
  if (r.st === 'patched') return `${F.name}: patched, and it will give way again in time.`;
  return `${F.name}: ${['', 'wants seeing to', 'getting worse', 'bad'][r.sev] || 'wants seeing to'}${r.sev >= 2 ? ', and it shows in the price' : ''}.`;
};
export { HOUSE, FEATURES, cap };
