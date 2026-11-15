// New in Town: the cards for a business of your own (the rules are in
// firm.js, which puts these up: a name over the door, hands wanted, the
// year's accounts, the staff's stories, what goes wrong, rivals, the chain
// from the city, the board, a son or daughter who wants in, the bank, and a
// way back). None of them is drawn from the town's deck: firm.js decides
// when, from what is going on in the business.
//
// A card's words never roll dice (they are read again each time the card is
// drawn on the screen): where there are several ways of saying a thing, the
// season and who it is about choose between them.

import { BUSINESSES, PLACES, STAT_NAME, money, an, lowJob } from './data.js';
import { TRADES, LOAN_RATE, round10, round100, first, he, him, his, He, years } from './firm-lib.js';

export function firmCards(h) {
  const { clamp, busy, nameIt, queueOnce, opened } = h;
  const C = (L) => L.firmOf();
  const S = (L, x) => L.firmStaffer(typeof x === 'object' && x ? x.id : x);
  const fn = (st) => first(st.name);
  const T = (L) => TRADES[L.s.biz.type];
  const U = (L) => BUSINESSES[L.s.biz.type].take[L.s.biz.lvl];
  // One of several ways of saying it, chosen by the season and a number about who it is (no dice).
  const say = (L, n, list) => list[(L.s.t + (n | 0)) % list.length];
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
  const here = (L) => (C(L) && !L.s.gaol ? C(L) : null);
  const R = (L) => C(L) && C(L).rival;
  const did = (st, k, L) => { st.did[k] = L.s.t; };
  const firmBook = (L) => (L.s.biz.lvl >= 2 ? 'the accountant' : 'you');
  // Where somebody might be offered more.
  const ELSEWHERE = {
    food: ['the hotel on the front', 'the kitchen at the Gull & Anchor', 'a restaurant in Kettleby'],
    shop: ['the supermarket on the ring road', 'a department store in Kettleby', 'the new shop by the station'],
    build: ['a big firm doing the bypass', 'Dobbs & Daughter', 'a developer from the city'],
    soft: ['a company in the city', 'Lighthouse Labs', 'a start-up with a table-tennis table'],
    fleet: ['the big trawlers out of Kettleby', 'Captain Quinn’s boats', 'a fish merchant in the city'],
    design: ['a design house in the city', 'the Pavilion’s scenery shop', 'a gallery in Kettleby'],
  };

  // The name over the door. x: { fid, names }.
  const nameOpt = (i) => ({ t: (L, x) => x.names[i], show: (L, x) => !!x.names[i], run: (L, x) => nameIt(L, x.names[i]) });

  // Somebody to take on, from the card. i: which of the applicants.
  const hireOpt = (i) => ({
    t: (L) => { const a = C(L).apps[i]; return `Take on ${fn(a)}, at ${money(L.firmWage(a))} a season`; },
    show: (L) => !!C(L) && !!C(L).apps[i],
    why: (L) => (C(L).staff.length >= L.firmMax() ? 'No room for more.' : null),
    run(L) {
      const a = C(L).apps[i], st = L.firmTakeOn(a.id);
      return `${st.name} starts on Monday. ${say(L, st.id, [st.nat === 'cousin' ? 'Your aunt rings to say thank you, twice.' : 'First in, which is a good sign.', 'They bring their own mug, and know where to put it.', `${C(L).staff.length > 1 ? 'The others show them where the kettle is.' : 'You show them where the kettle is, and then the rest of it.'}`])}`;
    },
  });

  // What the year's profit comes to, that can be paid out (it may have gone on the loan).
  const payable = (L, x) => Math.max(0, Math.min(x.profit, C(L).till));

  // A member of staff leaving to set up across the road.
  const goRival = (L, st, kind, str) => { L.firmGone(st.id, 'rival'); L.firmRivalOpen({ who: st.name, sex: st.sex, kind, str, from: 'staff' }); };

  // The inspector's verdict: fined (out of the till) and shut for the season.
  const failed = (L, twice = false) => {
    const c = C(L), fine = round100(U(L) * 0.5 * (twice ? 2 : 1));
    c.till -= fine; c.shut = L.s.t;
    L.firmRep(-10);
    L.note(`${c.name} failed an inspection: fined ${money(fine)}, and shut for the season.`);
    return fine;
  };

  return [
    {
      id: 'firmName', icon: '🪧', title: 'A name over the door', w: 0,
      ok: (L, x) => { const c = C(L); return !!c && !!x && c.fid === x.fid && !c.named; },
      text: (L, x) => {
        const p = L.partner();
        return say(L, x.fid, [
          `The signwriter wants to know by Friday what to paint over ${an(L.firmSize())}, and charges by the letter.`,
          p ? `${first(p.name)} has written three names on the back of an envelope, and crossed out a fourth so hard the pen went through.` : 'Three names on the back of an envelope, and a fourth crossed out so hard the pen went through.',
          'Priya Lal says a business without a name is just a table with things on it. Choose.',
        ]);
      },
      opts: [nameOpt(0), nameOpt(1), nameOpt(2)],
    },
    {
      id: 'firmHands', icon: '📋', title: 'Hands wanted', w: 0,
      ok: (L) => !!here(L) && C(L).apps.length > 0 && C(L).staff.length < L.firmMax(),
      text: (L) => {
        const c = C(L), need = L.firmNeed() - c.staff.length;
        const open = say(L, c.fid, [`A card in the window of ${c.name}: HELP WANTED, APPLY WITHIN. Three apply within.`, `An advertisement in the Gazette, and by Thursday three letters, one of them in green ink.`, `Word gets round that ${c.name} is taking people on. Three turn up on the step.`]);
        return `${open}${need > 0 ? ` (It needs ${need} more to meet its trade.)` : ''} ${c.apps.map((a) => `${a.name}, ${a.age}: ${a.hint}`).join(' ')}`;
      },
      opts: [hireOpt(0), hireOpt(1), hireOpt(2), { t: 'Nobody yet', run: (L) => say(L, 1, ['You keep the card in the window.', 'You will manage a while longer.', 'You thank them all for coming, and mean it.']) }],
    },
    {
      id: 'firmBooks', icon: '📒', w: 0, title: (L, x) => (x.profit >= 0 ? 'The year’s accounts' : 'The year’s accounts, in red'),
      ok: (L) => !!here(L),
      text: (L, x) => {
        const c = C(L), who = firmBook(L);
        const open = who === 'you' ? say(L, c.fid, ['You do the books at the kitchen table, with a calculator and a sigh.', 'A shoebox of receipts, a long Sunday, and the books are done.', 'You do the books in the back after closing, with the radio on.'])
          : say(L, c.fid, ['The accountant comes in a good coat and goes through it all twice.', 'The accountant’s report is forty pages long. Page one is the one that matters.', 'The accountant takes off her glasses, which is either good or bad.']);
        const lines = [`takings ${money(x.take)}`, `wages ${money(x.wages)}`, `stock ${money(x.stock)}`, `the premises ${money(x.over)}`];
        if (x.interest) lines.push(`the bank ${money(x.interest)}`);
        if (x.other) lines.push(`${money(x.other)} that went missing or to a partner`);
        return `${open} ${cap(lines.join(', '))}. ${x.profit >= 0 ? `A profit of ${money(x.profit)}` : `A loss of ${money(-x.profit)}`}, and ${c.till >= 0 ? `${money(c.till)} in the till` : `${money(-c.till)} overdrawn`}.`;
      },
      opts: [
        { t: (L, x) => `Pay yourself ${money(payable(L, x))}`, show: (L, x) => payable(L, x) > 0,
          run(L, x) { const c = C(L), n = payable(L, x); c.till -= n; L.cash(n); L.joy(3); return say(L, c.fid, [`${money(n)} into your own account. You buy something you have wanted for a year.`, `${money(n)}, yours. You take everybody you love out for dinner.`, `${money(n)}: the year’s work, in one transfer.`]); } },
        { t: (L) => `Put it back in: ${T(L).kit}`, show: (L, x) => x.profit > 0 && C(L).fit < 5 && C(L).till >= L.firmKitCost(),
          run(L) { const c = C(L), n = L.firmKitCost(); c.till -= n; c.fit++; L.firmRep(2); L.firmCheerAll(4); return `${money(n)} back into ${c.name}: ${T(L).kit}. More gets done, better, and everybody notices.`; } },
        { t: 'A bonus for the staff, the rest to you', show: (L, x) => payable(L, x) > 0 && C(L).staff.length > 0,
          run(L, x) {
            const c = C(L), n = payable(L, x), bonus = Math.min(n, round10(Math.max(150 * c.staff.length, n * 0.15)));
            c.till -= n; L.cash(n - bonus); L.karma(1);
            for (const st of c.staff) { st.bonus = L.s.t; L.firmCheer(st, 12); }
            return `${money(bonus)} shared between the staff, in envelopes, and ${money(n - bonus)} to you. ${say(L, c.fid, ['Somebody cries. Somebody else pretends not to.', 'They club together and buy you a mug that says BEST BOSS. It is the cheapest mug in the Bay, and you use it every day.', 'Nobody is late for a month.'])}`;
          } },
        { t: 'Pay off some of the loan', show: (L) => C(L).loan > 0 && C(L).till > 0,
          run(L) { const c = C(L), n = Math.min(c.till, c.loan); c.till -= n; c.loan -= n; if (!c.loan) c.seed = false; return c.loan ? `${money(n)} off the loan. ${money(c.loan)} still owing.` : 'The loan is paid off. You frame the letter from the bank.'; } },
        { t: (L) => `Put in ${money(-C(L).till)} of your own`, show: (L) => C(L).till < 0, cost: (L) => Math.max(0, -C(L).till),
          run(L) { C(L).till = 0; return 'You put your own money in, and the business starts the year square.'; } },
        { t: 'Let the newest go', show: (L, x) => x.profit < 0 && C(L).staff.length > 0,
          run(L) { const c = C(L), st = c.staff.slice().sort((a, b) => b.since - a.since)[0]; L.firmGone(st.id, 'sacked'); L.firmCheerAll(-5); return `Last in, first out. You tell ${st.name} on a Friday, which does not make it any better.`; } },
        { t: 'Cheaper suppliers, for now', show: (L, x) => x.profit < 0 && C(L).qual > 0,
          run(L) { L.firmSet('qual', C(L).qual - 1); return 'A man in a van, cash on delivery, no questions. It will do, for now.'; } },
        { t: (L, x) => (x.profit < 0 ? 'Ride it out' : 'Leave it in the till'),
          run(L, x) { if (x.profit < 0) { L.joy(-2); return say(L, 2, ['Next year will be better. It has to be.', 'You tell yourself it was the weather.', 'Every business has a bad year. You have had one.']); } return say(L, 3, ['A rainy-day fund. In the Bay, it will rain.', 'You leave it where it is, against a bad winter.', 'It stays in the business, earning nothing and worrying nobody.']); } },
      ],
    },
    {
      id: 'firmRise', icon: '💷', title: 'A word about money', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x),
      text: (L, x) => { const st = S(L, x); return say(L, st.id, [`${fn(st)} asks for a word, and closes the door. ${He(st)} has been at ${C(L).name} for ${years(L.s.t - st.since)}, and ${his(st)} rent has gone up twice.`, `${fn(st)} brings you a cup of tea, which is how you know. ${He(st)} would like a rise.`, `${fn(st)} has done the sums on the back of the rota, and shows you them. They are good sums.`]); },
      opts: [
        { t: 'Give it', run(L, x) { const st = S(L, x); st.pay = Math.min(1.6, (st.pay || 1) + 0.12); L.firmCheer(st, 18); did(st, 'rise', L); return `${fn(st)} shakes your hand, and then, after a moment, hugs you. ${money(L.firmWage(st))} a season from now on.`; } },
        { t: 'A one-off bonus instead', cost: (L, x) => round10(L.firmWage(S(L, x)) * 0.3), run(L, x) { const st = S(L, x); L.firmCheer(st, 6); did(st, 'rise', L); return `An envelope, and a promise to look again next year. ${fn(st)} takes both.`; } },
        { t: 'Not this year', run(L, x) {
          const st = S(L, x); L.firmCheer(st, -14); did(st, 'rise', L);
          if ((st.nat === 'grafter' || st.nat === 'prickly') && L.chance(0.3)) { L.firmGone(st.id, 'left'); return `${fn(st)} says nothing, and hands in ${his(st)} notice on Monday. ${He(st)} is at ${say(L, st.id, ELSEWHERE[C(L).type])} by the spring.`; }
          return `${fn(st)} says ${he(st)} understands, in a voice that means ${he(st)} does not.`;
        } },
      ],
    },
    {
      id: 'firmPoach', icon: '🎣', title: 'An offer elsewhere', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x) && (x.by !== 'rival' || !!R(L)),
      text: (L, x) => {
        const st = S(L, x), r = R(L);
        if (x.by === 'rival' && r) return `${r.who} from ${r.name} has offered ${fn(st)} a third more to come across the road. ${fn(st)} has told you, which is something.`;
        if (x.by === 'city') return `${fn(st)} has been offered a job in the city: more money, a car, and a desk with a view of another desk. ${He(st)} has not said yes.`;
        return `${cap(say(L, st.id, ELSEWHERE[C(L).type]))} wants ${fn(st)}, and has put a number on it. It is a good number.`;
      },
      opts: [
        { t: 'Match it', run(L, x) { const st = S(L, x); st.pay = Math.min(1.7, (st.pay || 1) + 0.25); L.firmCheer(st, 10); did(st, 'poach', L); return `${fn(st)} stays, on ${money(L.firmWage(st))} a season. ${say(L, st.id, ['The others do not find out. Mostly.', 'You will feel it in the wages. You would feel it more without them.', 'Worth every penny, you tell yourself, and it is.'])}`; } },
        { t: 'Remind them what they would be leaving', check: ['charm', 50],
          run(L, x, win) {
            const st = S(L, x); did(st, 'poach', L);
            if (win) { L.firmCheer(st, 8); return `You talk about the early days, and the regulars, and the time with the fire extinguisher. ${fn(st)} stays.`; }
            L.firmGone(st.id, 'poached');
            if (x.by === 'rival' && R(L)) R(L).str = clamp(R(L).str + 8, 0, 100);
            return `${fn(st)} listens, and nods, and goes anyway. ${x.by === 'rival' ? 'You see them through the window across the road, laughing at something.' : 'The leaving card has every name on it but yours, because you bought it.'}`;
          } },
        { t: 'Wish them well', run(L, x) { const st = S(L, x); L.firmGone(st.id, 'poached'); L.karma(1); if (x.by === 'rival' && R(L)) R(L).str = clamp(R(L).str + 6, 0, 100); return `A reference that says everything good and nothing else, and a drink after work. ${fn(st)} will be missed.`; } },
      ],
    },
    {
      id: 'firmLove', icon: '💘', title: 'Something in the stockroom', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x.a) && !!S(L, x.b),
      text: (L, x) => {
        const a = S(L, x.a), b = S(L, x.b);
        return say(L, a.id, [
          `${fn(a)} and ${fn(b)} have started arriving together, leaving together, and not quite looking at each other in between.`,
          `You walk into the back and ${fn(a)} and ${fn(b)} spring apart like a pair of startled cats.`,
          `${fn(a)} has started bringing ${fn(b)} a sandwich. The whole place knows what that means except, apparently, ${fn(b)}.`,
        ]);
      },
      opts: [
        { t: 'Be glad for them', run(L, x) { const a = S(L, x.a), b = S(L, x.b); pair(L, a, b); L.firmCheer(a, 8); L.firmCheer(b, 8); return 'You say nothing at all, except, once, "About time." They both go pink.'; } },
        { t: 'A word about keeping it out of work', run(L, x) { const a = S(L, x.a), b = S(L, x.b); pair(L, a, b); L.firmCheer(a, -3); L.firmCheer(b, -3); return 'A short talk, which you all find harder than it needs to be. The stockroom door stays open from now on.'; } },
        { t: 'Put them in different places', show: (L) => !!C(L).branch, run(L, x) { const a = S(L, x.a), b = S(L, x.b); pair(L, a, b); L.firmCheer(a, 4); return `${fn(a)} moves to the other place. They meet for lunch, halfway, every day.`; } },
      ],
    },
    {
      id: 'firmLove2', icon: '💍', w: 0, title: (L, x) => (wed(L, x) ? 'Wedding bells at work' : 'Not speaking'),
      ok: (L, x) => !!here(L) && !!S(L, x.a) && !!S(L, x.b),
      text: (L, x) => {
        const a = S(L, x.a), b = S(L, x.b);
        if (wed(L, x)) return `${fn(a)} and ${fn(b)} are getting married, on the beach at Smugglers’ Cove, and they would like you to say a few words. They met at ${C(L).name}, after all.`;
        return `${fn(a)} and ${fn(b)} are not speaking. They are not speaking very loudly, in front of customers.`;
      },
      opts: [
        { t: 'Say a few words', show: (L, x) => wed(L, x), check: ['charm', 45],
          run(L, x, win) { const a = S(L, x.a), b = S(L, x.b); done2(L, a, b); L.firmCheerAll(win ? 6 : 3); L.joy(win ? 5 : 2); return win ? 'You keep it short, and it is the best speech of the day. The groom’s grandmother asks for a copy.' : 'You tell the story about the walk-in fridge. Nobody had told the bride’s mother. It goes quiet, and then it goes very well.'; } },
        { t: (L) => `The reception at ${C(L).name}, on the house`, show: (L, x) => wed(L, x), cost: (L) => round100(U(L) * 0.25),
          run(L, x) { const a = S(L, x.a), b = S(L, x.b); done2(L, a, b); L.firmCheerAll(10); L.firmRep(2); L.joy(4); return 'Fairy lights, a borrowed band and the whole staff dancing. Half the town is there, and half of them come back as customers.'; } },
        { t: 'Send a card', show: (L, x) => wed(L, x), run(L, x) { const a = S(L, x.a), b = S(L, x.b); done2(L, a, b); L.firmCheer(a, -2); L.firmCheer(b, -2); return 'A card, with a cheque in it. They are kind about it.'; } },
        { t: 'Sit them both down', show: (L, x) => !wed(L, x), check: ['charm', 50],
          run(L, x, win) { const a = S(L, x.a), b = S(L, x.b); done2(L, a, b); a.pair = null; b.pair = null; if (win) { L.firmCheer(a, 4); L.firmCheer(b, 4); return 'An hour in the office with the door shut. They come out not friends, but colleagues, which is what you needed.'; } const go = a.since > b.since ? a : b; L.firmGone(go.id, 'left'); return `It does not work. ${fn(go)} leaves at the end of the month, and takes the good stapler.`; } },
        { t: 'Different shifts, and say no more', show: (L, x) => !wed(L, x), run(L, x) { const a = S(L, x.a), b = S(L, x.b); done2(L, a, b); a.pair = null; b.pair = null; L.firmCheer(a, -2); L.firmCheer(b, -2); return 'A new rota, and an understanding. It holds.'; } },
      ],
    },
    {
      id: 'firmIll', icon: '🤒', title: 'Off sick', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x),
      text: (L, x) => { const st = S(L, x); return say(L, st.id, [`${fn(st)} rings in at seven, sounding like a seal. ${He(st)} will be off for weeks, the doctor says.`, `${fn(st)} goes over in the stockroom on a busy Saturday. It is ${his(st)} back, and it is going to take a while.`, `${fn(st)} has to have an operation: nothing too serious, but ${he(st)} will be off for most of the season.`]); },
      opts: [
        { t: 'Full pay while they are off', cost: (L, x) => round10(L.firmWage(S(L, x)) * 0.5), run(L, x) { const st = S(L, x); did(st, 'ill', L); L.firmCheer(st, 15); L.firmCheerAll(4, st.id); L.karma(1); return `${fn(st)} sends a card, and then comes back early, which you tell ${him(st)} off for.`; } },
        { t: 'Cover for them yourself', run(L, x) { const st = S(L, x); did(st, 'ill', L); busy(L, 2); L.firmCheer(st, 8); return `You do ${fn(st)}’s shifts as well as your own. You had forgotten how hard ${he(st)} works.`; } },
        { t: 'Sick pay, and not a penny more', run(L, x) { const st = S(L, x); did(st, 'ill', L); L.firmCheer(st, -12); L.firmCheerAll(-3, st.id); return 'The rules are the rules. Everybody notices that you kept to them.'; } },
      ],
    },
    {
      id: 'firmTheft', icon: '🫙', title: 'The till is short again', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x),
      text: (L, x) => { const st = S(L, x); return say(L, st.id, [`The till has been short four weeks out of the last ten. ${fn(st)} has been on every one of those days.`, `Stock is going missing: a little, often, and always on ${fn(st)}’s shifts.`, `A regular takes you aside. She saw ${fn(st)} put a twenty in ${his(st)} sock, and does not think it was ${his(st)} twenty.`]); },
      opts: [
        { t: 'Have it out with them', run(L, x) {
          const st = S(L, x); did(st, 'caught', L); st.known = true; st.stolen = 0;
          if (L.chance(0.5)) { st.nat = 'steady'; L.firmCheer(st, -5); return `${fn(st)} goes white, and then red, and then owns up. ${He(st)} pays it back out of ${his(st)} wages, a bit at a time, and the till is right from then on.`; }
          L.firmGone(st.id, 'theft'); return `${fn(st)} denies everything, loudly, and walks out. The till is right the next week, and every week after.`;
        } },
        { t: 'Call the police', run(L, x) { const st = S(L, x); L.firmGone(st.id, 'theft'); L.firmCheerAll(-3); L.firmRep(-1); return `A constable, a statement, and ${fn(st)} leaving in the back of a car. The others are quiet for a week. Word gets round, both ways.`; } },
        { t: 'Count the till yourself, and say nothing', run(L, x) { const st = S(L, x); did(st, 'caught', L); st.known = true; st.stolen = 0; if (L.chance(0.5)) { st.nat = 'steady'; return `You count it in front of ${fn(st)}, twice a day, without a word. It stops.`; } return 'You count it twice a day. It is still short, now and then, and now you know it.'; } },
      ],
    },
    {
      id: 'firmIdea', icon: '💡', title: 'An idea', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x) && !!ideaOf(L, x),
      text: (L, x) => { const st = S(L, x), idea = ideaOf(L, x); return say(L, st.id, [`${fn(st)} has an idea: ${idea.said}. ${He(st)} has done the sums on a napkin, and they add up, nearly.`, `${fn(st)} corners you by the bins. ${He(st)} has been thinking about ${idea.said}, and cannot stop.`, `"Hear me out," says ${fn(st)}, which nobody ever says before a bad idea: ${idea.said}.`]); },
      opts: [
        { t: 'Back it properly', cost: (L) => round100(U(L) * 0.6), odds: (L, x) => ideaOdds(L, x),
          run(L, x, win) { return tried(L, x, win, 3); } },
        { t: 'Try it in a small way', cost: (L) => round100(U(L) * 0.2), odds: (L, x) => ideaOdds(L, x) - 0.15,
          run(L, x, win) { return tried(L, x, win, 1); } },
        { t: 'Not now', run(L, x) { const st = S(L, x); did(st, 'idea', L); C(L).ideaT = L.s.t; L.firmCheer(st, -6); return `"Not now," you say. ${fn(st)} folds the napkin up very small.`; } },
      ],
    },
    {
      id: 'firmLeave', icon: '🚪', title: 'Going it alone', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x) && !R(L),
      text: (L, x) => { const st = S(L, x); return `${fn(st)} has handed in ${his(st)} notice. After ${years(L.s.t - st.since)} at ${C(L).name}, ${he(st)} is opening ${an(L.firmSize())} of ${his(st)} own, ${say(L, st.id, ['across the road', 'two doors down', 'on the corner, where everybody passes'])}, and taking everything ${he(st)} learned with ${him(st)}.`; },
      opts: [
        { t: 'Wish them well', run(L, x) { const st = S(L, x); goRival(L, st, 'proper', 30 + st.skill / 4); L.karma(1); return `You shake hands, and mean it. ${fn(st)} sends a bunch of flowers on ${his(st)} opening day, with a card that says "Thank you, and sorry".`; } },
        { t: 'Offer a partnership if they stay', check: ['charm', 55],
          run(L, x, win) { const st = S(L, x); if (win) { st.pay = Math.min(1.8, (st.pay || 1) + 0.4); L.firmCheer(st, 25); did(st, 'leave', L); return `A share of the profits and ${his(st)} name on the letterhead. ${fn(st)} tears up the lease on the place across the road.`; } goRival(L, st, 'proper', 35 + st.skill / 4); return `${fn(st)} thinks about it overnight, and says no, kindly. ${He(st)} wants ${his(st)} own name over a door.`; } },
        { t: 'Remind them of the clause in their contract', odds: () => 0.5,
          run(L, x, win) { const st = S(L, x); L.karma(-2); if (win) { L.firmCheer(st, -25); did(st, 'leave', L); return `The solicitor’s letter does it. ${fn(st)} stays, and does not speak to you for a month, and then only about stock.`; } goRival(L, st, 'sly', 45); return `The clause does not hold. ${fn(st)} opens anyway, and tells everybody why.`; } },
      ],
    },
    {
      id: 'firmRetire', icon: '🥂', title: 'A send-off', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x),
      text: (L, x) => { const st = S(L, x); return say(L, st.id, [`${fn(st)} has been at ${C(L).name} for ${years(L.s.t - st.since)}, and is retiring at the end of the season. ${He(st)} says ${he(st)} wants no fuss.`, `${fn(st)} is ${st.age}, and has been at ${C(L).name} longer than the till. ${He(st)} is going to grow tomatoes, ${he(st)} says, and has bought the hat.`, `After ${years(L.s.t - st.since)}, ${fn(st)} is hanging up ${his(st)} apron. The regulars have started a collection without being asked.`]); },
      opts: [
        { t: 'A proper do at the Gull & Anchor', cost: (L) => round100(400 + U(L) * 0.15),
          run(L, x) { const st = S(L, x), c = C(L); L.firmGone(st.id, 'retired'); L.firmCheerAll(10); L.joy(5); L.s.firm.f.sendoff = 1; L.s.firm.n.retired++; L.note(`Gave ${st.name} a send-off after ${years(L.s.t - st.since)} at ${c.name}.`, 'big'); return `The back room of the Gull, a cake in the shape of ${an(L.firmSize())}, and a speech that makes ${fn(st)} cry. Every regular in the Bay is there, and three who moved away years ago.`; } },
        { t: 'A card and a cake', run(L, x) { const st = S(L, x); L.firmGone(st.id, 'retired'); L.firmCheerAll(3); L.s.firm.n.retired++; return `A card signed by everybody, a cake from the bakery, and a handshake at the door. ${fn(st)} looks back once, and waves.`; } },
        { t: 'Ask them to stay on, part-time', run(L, x) { const st = S(L, x); did(st, 'retire', L); st.part = true; L.firmCheer(st, 6); return `${fn(st)} says ${he(st)} will think about it, and is in on Tuesday, and Thursday, and most Fridays.`; } },
      ],
    },
    {
      id: 'firmLate', icon: '⏰', title: 'Late again', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x),
      text: (L, x) => { const st = S(L, x); return say(L, st.id, [`${fn(st)} is late again. Today it was the ferry. Yesterday it was a goat.`, `${fn(st)} arrives at half past ten with a coffee, a pastry and an explanation involving a man on a ladder.`, `Thirty-one minutes late. ${fn(st)} says the clock in the kitchen is fast. It is not.`]); },
      opts: [
        { t: 'A quiet word', check: ['charm', 40], run(L, x, win) { const st = S(L, x); did(st, 'late', L); st.known = true; if (win) { st.nat = 'steady'; L.firmCheer(st, -2); return `${fn(st)} buys an alarm clock, and then a second one, and is on time from then on. Nearly.`; } L.firmCheer(st, -4); return `${fn(st)} nods, and is on time on Monday, and late on Tuesday.`; } },
        { t: 'Let it go: they stay late to make up', run(L, x) { const st = S(L, x); did(st, 'late', L); st.known = true; L.firmCheer(st, 5); L.firmCheerAll(-3, st.id); return `${fn(st)} works till eight to make up for it. The others, who come in on time, notice.`; } },
        { t: 'Dock their pay', run(L, x) { const st = S(L, x); did(st, 'late', L); st.known = true; st.pay = Math.max(0.7, (st.pay || 1) - 0.1); L.firmCheer(st, -10); return `A tenth off, until it stops. ${fn(st)} says that is fair, through ${his(st)} teeth.`; } },
      ],
    },
    {
      id: 'firmClash', icon: '🗯️', title: 'Words at work', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x.a) && !!S(L, x.b),
      text: (L, x) => { const a = S(L, x.a), b = S(L, x.b); return say(L, a.id, [`${fn(a)} has told ${fn(b)}, in front of a customer, exactly what ${he(a)} thinks of ${his(b)} work. ${fn(b)} has told ${fn(a)} where to put it.`, `${fn(a)} has redone everything ${fn(b)} did yesterday, and left a note saying why. ${fn(b)} has found the note.`, `${fn(b)} says ${he(b)} will not work another shift with ${fn(a)}. ${fn(a)} says that suits ${him(a)} fine.`]); },
      opts: [
        { t: (L, x) => `Side with ${fn(S(L, x.a))}`, run(L, x) { const a = S(L, x.a), b = S(L, x.b); C(L).clashT = L.s.t; L.firmCheer(a, 6); L.firmCheer(b, -15); return `${fn(a)} is right, and you say so. ${fn(b)} does not forget it.`; } },
        { t: (L, x) => `Side with ${fn(S(L, x.b))}`, run(L, x) { const a = S(L, x.a), b = S(L, x.b); C(L).clashT = L.s.t; L.firmCheer(b, 6); L.firmCheer(a, -15); if (L.chance(0.3)) { L.firmGone(a.id, 'left'); return `${fn(a)} hears you out, takes off ${his(a)} apron, and leaves. You will miss the work, if not the rest.`; } return `${fn(a)} takes it, just. There is a new frost in the place.`; } },
        { t: 'Knock their heads together', check: ['charm', 55], run(L, x, win) { const a = S(L, x.a), b = S(L, x.b); C(L).clashT = L.s.t; if (win) { L.firmCheer(a, 5); L.firmCheer(b, 5); return 'A pint each, after closing, and you in the middle. By the second one they are laughing at you instead, which will do.'; } L.firmCheer(a, -8); L.firmCheer(b, -8); return 'You try. They agree on one thing: that it is none of your business.'; } },
      ],
    },
    {
      id: 'firmStrike', icon: '🪧', title: 'Out on the pavement', w: 0,
      ok: (L) => !!here(L) && C(L).staff.length >= 2,
      text: (L) => { const c = C(L); return `The staff of ${c.name} are on the pavement with a placard made from ${say(L, c.fid, ['the back of a menu', 'a cardboard box', 'a bedsheet'])}. They want ${c.hours === 2 ? 'shorter hours' : 'more money'}, and they want it in writing.`; },
      opts: [
        { t: 'Give them what they want', run(L) { const c = C(L); c.strikeT = L.s.t; if (c.hours === 2) L.firmSet('hours', 1); for (const st of c.staff) { st.pay = Math.min(1.7, (st.pay || 1) + 0.08); L.firmCheer(st, 25); } return 'You sign it on the pavement, on somebody’s back. The kettle goes on, and nobody mentions it again.'; } },
        { t: 'Talk to them, one by one', check: ['charm', 55], run(L, x, win) { const c = C(L); c.strikeT = L.s.t; if (win) { L.firmCheerAll(15); return 'You listen more than you talk. They come back in by teatime, with some of what they asked for and all of what they needed.'; } c.strike = L.s.t; L.firmCheerAll(-4); return 'It goes badly. They stay out, and the place stays shut, for the season.'; } },
        { t: 'Sit it out', run(L) { const c = C(L); c.strikeT = L.s.t; c.strike = L.s.t; L.firmRep(-4); return `${c.name} is shut for the season, with the staff outside it. The Gazette sends a photographer.`; } },
      ],
    },
    {
      id: 'firmQuit', icon: '📨', title: 'Handing in notice', w: 0,
      ok: (L, x) => !!here(L) && !!S(L, x),
      text: (L, x) => { const st = S(L, x); return say(L, st.id, [`${fn(st)} has handed in ${his(st)} notice. ${He(st)} is not happy at ${C(L).name}, and has not been for a while.`, `${fn(st)} leaves a letter on your desk, in an envelope, which is how you know it is serious.`, `"I’ve had enough," says ${fn(st)}, and you can see that it is true.`]); },
      opts: [
        { t: 'Ask what it would take', run(L, x) { const st = S(L, x); st.pay = Math.min(1.7, (st.pay || 1) + 0.15); L.firmCheer(st, 25); return `More money, and to be asked now and then. ${fn(st)} tears the letter up, which you had not known people did.`; } },
        { t: 'Let them go', run(L, x) { const st = S(L, x); L.firmGone(st.id, 'left'); L.firmCheerAll(-2); return `${fn(st)} works ${his(st)} notice, and goes. The place feels different, and not better.`; } },
      ],
    },
    {
      id: 'firmInspect', icon: '🔦', w: 0, title: (L) => `${cap(T(L).inspector)} calls`,
      ok: (L) => !!here(L),
      text: (L) => { const c = C(L); return `${cap(T(L).inspector)} arrives at ${c.name} unannounced, with a clipboard and a torch, and looks in the places nobody looks.${c.qual === 0 ? ' You think about the boxes from the man in the van.' : ''}`; },
      opts: [
        { t: 'Show them round', odds: (L) => [0.35, 0.75, 0.92][C(L).qual] + (L.s.st.smarts - 50) / 300,
          run(L, x, win) { if (win) { L.firmRep(3); return say(L, 1, ['A clean bill of health, and a certificate for the window.', 'Not a mark against you. The inspector very nearly smiles.', 'Passed, with a note to say so. You frame it.']); } const fine = failed(L); return `Failed. A fine of ${money(fine)}, out of the till, and ${C(L).name} shut until the season is out. It is in the Gazette by Thursday.`; } },
        { t: 'A cup of tea and a quiet word', odds: () => 0.6,
          run(L, x, win) { L.karma(-3); if (win) return 'The tea is accepted, and so is the envelope under the saucer. The report is very short.'; L.karma(-3); const fine = failed(L, true); return `The inspector puts the envelope in an evidence bag. A fine of ${money(fine)}, and the season shut, and everybody knows why.`; } },
      ],
    },
    {
      id: 'firmPoorly', icon: '🚑', w: 0, title: (L) => (L.s.biz.type === 'food' ? 'Taken ill' : 'A complaint'),
      ok: (L) => !!here(L),
      text: (L, x) => `${T(L).trouble[x % T(L).trouble.length]}${C(L).qual === 0 ? ' It is hard not to think of the cheaper stock.' : ''}`,
      opts: [
        { t: 'Pay up, and say sorry', run(L) { const c = C(L), n = round100(U(L) * 0.4); c.till -= n; L.firmRep(-3); return `${money(n)} out of the till, a letter, and flowers. It is the right thing, and it is not cheap.`; } },
        { t: 'Deny everything', run(L) { L.karma(-2); if (L.chance(0.5)) { L.firmRep(-12); return 'It gets out anyway, and the denying looks worse than whatever it was.'; } return 'Nothing more comes of it. You do not sleep well for a week.'; } },
        { t: 'Go round and put it right yourself', check: ['charm', 50], run(L, x, win) { busy(L, 1); if (win) { L.firmRep(1); return 'You go round in person, and listen, and put it right. They are customers for life now, and tell people so.'; } const c = C(L), n = round100(U(L) * 0.3); c.till -= n; L.firmRep(-6); return `They are not interested in sorry. ${money(n)}, through a solicitor.`; } },
      ],
    },
    {
      id: 'firmReview', icon: '📰', w: 0, title: (L, x) => (x.good ? 'A rave in the Gazette' : 'Panned in the Gazette'),
      ok: (L) => !!here(L),
      text: (L, x) => {
        const c = C(L), col = { food: 'food writer', shop: 'shopping column', build: 'homes page', soft: 'business pages', fleet: 'business pages', design: 'arts page' }[c.type];
        if (x.good) return `The Gazette’s ${col} has been to ${c.name}, and ${say(L, c.fid, ['calls it "the best thing to happen to the Bay since the railway"', 'gives it five gulls out of five, the most there are', 'has nothing bad to say about it at all, which has never happened'])}.`;
        const why = c.qual === 0 ? 'mentions the cheap stock by name' : c.price === 2 ? 'calls the prices "ambitious"' : c.staff.length < L.firmNeed() ? 'says the wait was forty minutes' : 'did not like the colour of the door';
        return `The Gazette’s ${col} has been to ${c.name}, and ${why}, and then says a good deal more.`;
      },
      opts: [
        { t: 'Frame it by the till', show: (L, x) => x.good, run(L) { L.firmRep(6); L.joy(3); return 'It goes up by the till, in a frame from Mr Pym’s. People read it while they wait.'; } },
        { t: 'Put your prices up', show: (L, x) => x.good && C(L).price < 2, run(L) { L.firmRep(4); L.firmSet('price', 2); return 'Five gulls out of five is worth a few dollars more. The queue does not seem to mind.'; } },
        { t: 'Write to the editor', show: (L, x) => !x.good, check: ['smarts', 50], run(L, x, win) { if (win) { L.firmRep(2); return 'Your letter is printed the next week, under the heading A RIGHT OF REPLY. It is better written than the review.'; } L.firmRep(-4); return 'Your letter is printed, with a reply from the writer underneath it. You lose twice.'; } },
        { t: 'Put right what they found', show: (L, x) => !x.good, run(L) { busy(L, 1); const c = C(L); if (c.qual === 0) L.firmSet('qual', 1); L.firmRep(1); return 'It stung because some of it was true. You put it right.'; } },
        { t: 'Ignore it', show: (L, x) => !x.good, run(L) { L.firmRep(-6); return 'Trade is thin for a while.'; } },
      ],
    },
    {
      id: 'firmRival', icon: '🏴', title: 'Across the road', w: 0,
      ok: (L) => !!here(L) && !!R(L),
      text: (L) => {
        const r = R(L), c = C(L), where = say(L, c.fid, ['across the road from', 'two doors down from', 'round the corner from']);
        const how = { cheap: 'with everything a little cheaper than yours, and a sign in the window saying so', flash: 'with balloons, a man on stilts and an opening offer', sly: `and came round with a bottle of wine to say there was room enough for both of you`, proper: 'and it is good. You went in. You had to.' }[r.kind];
        return `${r.who} has opened ${r.name}, ${where} ${c.name}, ${how}.`;
      },
      opts: [
        { t: 'Undercut them', run(L) { const r = R(L); r.beat = L.s.t; r.war = true; L.firmSet('price', 0); r.str = clamp(r.str - 4, 0, 100); return 'Your prices come down the same day. It will cost you; it will cost them more.'; } },
        { t: 'Be better, not cheaper', run(L) { const r = R(L); r.beat = L.s.t; L.firmSet('qual', 2); r.str = clamp(r.str - 3, 0, 100); return 'The best of everything, from now on. Let them have the bargain hunters.'; } },
        { t: 'Go over and say hello', check: ['charm', 45], run(L, x, win) { const r = R(L); r.beat = L.s.t; r.known = true; if (win) { r.str = clamp(r.str - 6, 0, 100); return `A cup of tea in ${r.name}. ${r.who} is ${RIVAL_WORD[r.kind]}, and you know where you stand.`; } return `${r.who} is busy, and says so, and keeps you on the step.`; } },
        { t: 'Pay them no attention', run(L) { R(L).beat = L.s.t; return 'You do not look across the road. You do not look across the road a great deal.'; } },
      ],
    },
    {
      id: 'firmWar', icon: '⚔️', w: 0, title: (L) => (R(L) && R(L).kind === 'cheap' ? 'A price war' : 'Competition'),
      ok: (L) => !!here(L) && !!R(L),
      text: (L) => { const r = R(L); return r.kind === 'cheap' ? `${r.name} has cut its prices again. There is a queue outside it, and some of the faces in it are yours.` : say(L, r.str | 0, [`${r.name} is doing well: a write-up in the Gazette, and a queue on Saturdays.`, `${r.who} has taken on two more staff at ${r.name}, and had the front painted.`, `Some of your regulars have started going to ${r.name} on Fridays. They say it is for a change.`]); },
      opts: [
        { t: 'Match them', run(L) { const r = R(L), c = C(L); r.beat = L.s.t; L.firmSet('price', 0); r.str = clamp(r.str - 6, 0, 100); const n = round100(U(L) * 0.3); c.till -= n; return `Price for price, all season. It costs ${c.name} ${money(n)}, and costs ${r.name} more.`; } },
        { t: 'Hold your nerve', odds: (L) => clamp(0.3 + L.s.biz.rep / 150 + [-0.1, 0, 0.12][C(L).qual], 0.1, 0.9), run(L, x, win) { const r = R(L); r.beat = L.s.t; if (win) { r.str = clamp(r.str - 8, 0, 100); return 'Your regulars stay your regulars. The ones who went come back, sheepish.'; } r.str = clamp(r.str + 6, 0, 100); L.firmRep(-3); return 'Trade slips across the road, a customer at a time.'; } },
        { t: (L) => `Make ${R(L).who} an offer for it`, show: (L) => R(L).str < 70, cost: (L) => L.firmRivalPrice(), run(L) { return L.firmBought(); } },
      ],
    },
    {
      id: 'firmRumour', icon: '🗣️', title: 'Talk in the town', w: 0,
      ok: (L) => !!here(L) && !!R(L),
      text: (L) => {
        const r = R(L), c = C(L);
        const what = { food: 'there are rats in the kitchen', shop: 'half the stock fell off a lorry', build: 'your walls are held up by hope', soft: 'your software sends people’s bank details to Belgium', fleet: 'your fish is a week old under the ice', design: 'your prints are bought in from abroad' }[c.type];
        return `Somebody is saying ${what} at ${c.name}. Somebody, you happen to know, who runs ${r.name}.`;
      },
      opts: [
        { t: (L) => `Have it out with ${R(L).who}`, check: ['charm', 50], run(L, x, win) { const r = R(L); r.beat = L.s.t; if (win) { r.str = clamp(r.str - 8, 0, 100); return `You say it to ${r.who}’s face, in front of ${his(r)} customers, calmly. The talk stops.`; } L.firmRep(-4); return `${r.who} looks hurt, and surprised, and says so to everybody. Now you are the one making a fuss.`; } },
        { t: 'Put your side in the Gazette', cost: 300, run(L) { const r = R(L); r.beat = L.s.t; r.str = clamp(r.str - 3, 0, 100); L.firmRep(2); return 'Half a page, with a photograph of you in a clean apron. Most people believe it.'; } },
        { t: 'Dig up some dirt of your own', odds: () => 0.55, run(L, x, win) { const r = R(L); r.beat = L.s.t; L.karma(-3); if (win) { r.str = clamp(r.str - 20, 0, 100); return `It turns out ${r.who} has a past, and a county court judgment, and now so does everybody else.`; } L.firmRep(-8); L.karma(-2); return 'It comes out that you went digging. That is the story now.'; } },
        { t: 'Rise above it', run(L) { R(L).beat = L.s.t; L.firmRep(-3); return 'You say nothing. Some of it sticks.'; } },
      ],
    },
    {
      id: 'firmDeal', icon: '🤝', w: 0, title: (L) => (R(L) && R(L).str <= 50 ? 'Closing down?' : 'A proposal'),
      ok: (L) => !!here(L) && !!R(L),
      text: (L) => {
        const r = R(L), c = C(L);
        if (r.str <= 50) return `${r.who} catches you in the street. ${r.name} is not doing well, and ${he(r)} wants out. Would you buy it, at ${money(L.firmRivalPrice())}?`;
        return `${r.who} has the better of you, and knows it, and is decent about it: why not join forces? One business, with both names on the door, and ${r.who} running it alongside you for a quarter of the profits.`;
      },
      opts: [
        { t: 'Buy them out', show: (L) => R(L).str <= 50, cost: (L) => L.firmRivalPrice(), run(L) { return L.firmBought(); } },
        { t: 'Let them go under', show: (L) => R(L).str <= 50, run(L) { R(L).str = 0; L.firmRivalEnd('off'); L.joy(2); return 'You wish them luck, and do not buy. The shutters come down on a wet Thursday.'; } },
        { t: 'Merge', show: (L) => R(L).str > 50,
          run(L) {
            const r = R(L), c = C(L), s = L.s;
            L.firmRivalEnd('merged');
            c.partner = { name: r.who, share: 0.25 };
            const st = L.firmMakeStaff({ name: r.who, sex: r.sex, nat: 'grafter', skill: 65, age: L.int(30, 55) });
            st.known = true; c.staff.push(st); c.mgr = st.id; s.biz.mgr = true;
            L.firmRep(8); c.fit = Math.min(5, c.fit + 1);
            L.note(`${c.name} and ${r.name} became one business, with ${r.who} as a partner.`, 'big');
            return `Two signs become one, with both names on it. ${r.who} brings ${his(r)} regulars, ${his(r)} best ideas and a quarter share, and runs the place alongside you.`;
          } },
        { t: 'Sell up to them', show: (L) => R(L).str > 50, run(L) { const r = R(L), c = C(L), n = round100(L.bizWorth() * 0.9), name = c.name; L.firmSellTo(n, r.name); L.note(`Sold ${name} to ${r.who} of ${r.name} for ${money(n)}.`, 'big'); return `${money(n)}, and a handshake. ${r.who} keeps the name, out of respect, or because the sign was expensive.`; } },
        { t: 'Not while you have breath in you', run(L) { const r = R(L); r.beat = L.s.t; r.str = clamp(r.str + (r.str > 50 ? 2 : -4), 0, 100); return r.str > 50 ? 'You will fight it out. You are not sure you will win.' : `${r.who} shrugs, and soldiers on.`; } },
      ],
    },
    {
      id: 'firmChain', icon: '🏙️', title: 'An offer from the city', w: 0,
      ok: (L, x) => !!here(L) && !!x,
      text: (L, x) => `A man from ${x.chain}, in a suit that cost more than your van, has been to ${C(L).name} three times this month. ${x.chain} would like to buy it: ${money(x.offer)}, and your name stays over the door, under theirs.`,
      opts: [
        { t: (L, x) => `Sell, for ${money(x.offer)}`, run(L, x) { const c = C(L), name = c.name; L.firmSellTo(x.offer, x.chain); L.s.firm.past[L.s.firm.past.length - 1].how = 'chain'; L.joy(6); L.note(`Sold ${name} to ${x.chain} for ${money(x.offer)}.`, 'big'); return `You sign in triplicate. ${money(x.offer)}, and a new sign over the door with your old name in small letters under theirs.`; } },
        { t: 'Haggle', check: ['charm', 55], run(L, x, win) { const c = C(L), name = c.name; c.chainT = L.s.t; if (win) { const n = round100(x.offer * 1.15); L.firmSellTo(n, x.chain); L.s.firm.past[L.s.firm.past.length - 1].how = 'chain'; L.joy(8); L.note(`Sold ${name} to ${x.chain} for ${money(n)}.`, 'big'); return `You say no twice, and they come back a third time: ${money(n)}. You shake on it.`; } return 'You push, and they walk. The man in the suit leaves his card, in case.'; } },
        { t: 'Not for sale', run(L, x) { const c = C(L); c.chainT = L.s.t; L.s.firm.f.chain = 1; if (!c.rival && L.chance(0.4)) { L.firmRivalOpen({ who: x.chain, sex: 'm', kind: 'flash', str: 60, from: 'chain' }); return `"A pity," says the man in the suit. Three months later ${x.chain} opens ${R(L).name} across the road, with balloons.`; } return '"A pity," says the man in the suit, and means it. You feel ten feet tall for a week.'; } },
      ],
    },
    {
      id: 'firmBoard', icon: '🪑', title: 'The board meets', w: 0,
      ok: (L, x) => !!here(L) && !!C(L).board && L.s.biz.lvl === 3 && !!x,
      text: (L, x) => {
        const B = C(L).board, [d1, d2, d3] = B.who;
        if (x.k === 'chair') return `The board would like you to step back to chairman, and let somebody from outside run ${C(L).name}. ${d1} has a name in mind. ${d2} looks at the table. ${d3} looks at you.`;
        if (x.k === 'cut') return `A poor year, and the board wants cuts: jobs, and the cheaper suppliers. ${d1} has a list. ${d2} has a longer one.`;
        return `${d1} wants to spend; ${d2} wants to put the profits in the bank; ${d3} wants to know what is for lunch.`;
      },
      opts: [
        { t: (L) => `Back ${C(L).board.who[0]}: new kit`, show: (L, x) => x.k === 'grow', run(L) { const c = C(L), n = L.firmKitCost(); c.board.t = L.s.t; if (c.till >= n && c.fit < 5) { c.till -= n; c.fit++; c.board.mood = clamp(c.board.mood + 8, 0, 100); return `${money(n)} on ${T(L).kit}. The board approves itself.`; } c.board.mood = clamp(c.board.mood + 2, 0, 100); return 'There is not the money in the till for it this year. The minutes say "deferred".'; } },
        { t: (L) => `Back ${C(L).board.who[1]}: caution`, show: (L, x) => x.k === 'grow', run(L) { const c = C(L); c.board.t = L.s.t; c.board.mood = clamp(c.board.mood + 4, 0, 100); return 'The money stays in the bank. Everybody feels sensible.'; } },
        { t: (L) => `Back ${C(L).board.who[2]}: lunch`, show: (L, x) => x.k === 'grow', run(L) { const c = C(L); c.board.t = L.s.t; c.board.mood = clamp(c.board.mood + 2, 0, 100); L.joy(2); return 'Lunch is very good. Nothing is decided, which may be the best decision.'; } },
        { t: 'Agree to the cuts', show: (L, x) => x.k === 'cut', run(L) { const c = C(L); c.board.t = L.s.t; for (const st of c.staff.slice().sort((a, b) => b.since - a.since).slice(0, 2)) L.firmGone(st.id, 'sacked'); L.firmSet('qual', 0); L.firmCheerAll(-8); c.board.mood = clamp(c.board.mood + 15, 0, 100); return 'Two jobs, and the cheaper suppliers. The numbers look better. The place does not.'; } },
        { t: 'Refuse', show: (L, x) => x.k === 'cut', run(L) { const c = C(L); c.board.t = L.s.t; c.board.mood = clamp(c.board.mood - 15, 0, 100); L.firmCheerAll(4); return 'You refuse, and it is minuted. The staff hear about it, which you did not intend and do not mind.'; } },
        { t: 'Step back to chairman', show: (L, x) => x.k === 'chair', run(L) { return chair(L, 3); } },
        { t: 'Fight it', show: (L, x) => x.k === 'chair', check: ['charm', 60], run(L, x, win) { const c = C(L); if (win) { c.board.t = L.s.t; c.board.mood = clamp(c.board.mood + 20, 0, 100); return 'You speak for twenty minutes without notes. The vote is four to one, and the one abstains.'; } return chair(L, 8); } },
        { t: 'Buy the board out', show: (L, x) => x.k === 'chair' || x.k === 'cut', cost: (L) => round100(L.bizWorth() * 0.2), run(L) { const c = C(L); c.board = null; L.joy(4); return 'You buy back every share, and the boardroom becomes a stockroom again. It is yours, all of it.'; } },
      ],
    },
    {
      id: 'firmKin', icon: '👪', w: 0, title: (L, x) => { const p = L.person(x); return p ? (keen(L, p) ? `${first(p.name)} wants to come in` : `${first(p.name)}, and the family business`) : 'The family business'; },
      ok: (L, x) => !!here(L) && !!L.person(x) && L.person(x).kind === 'child',
      text: (L, x) => {
        const p = L.person(x), c = C(L);
        if (keen(L, p)) return say(L, p.id, [`${first(p.name)} has been doing Saturdays at ${c.name} since ${he(p)} was fourteen, and wants to come in properly.`, `${first(p.name)} has a notebook full of ideas for ${c.name}, and has been waiting for the right moment. This is it, apparently.`, `${first(p.name)} asks, over Sunday lunch, whether there would be a place for ${him(p)} at ${c.name}. ${He(p)} has clearly practised.`]);
        return say(L, p.id, [`You ask ${first(p.name)}, over Sunday lunch, whether ${he(p)} would ever think of coming into ${c.name}. ${He(p)} says ${he(p)} would rather eat the menu.`, `You leave a set of keys to ${c.name} on ${first(p.name)}’s plate, as a joke that is not a joke. ${He(p)} hands them back.`, `${first(p.name)} has ${his(p)} own life, and says so, gently, when you ask about ${c.name}.`]);
      },
      opts: [
        { t: 'Take them on', show: (L, x) => keen(L, L.person(x)), why: (L) => (C(L).staff.length >= L.firmMax() ? 'No room for more.' : null),
          run(L, x) {
            const p = L.person(x), c = C(L), s = L.s, k = BUSINESSES[s.biz.type];
            const skill = p.st ? Math.round((p.st[k.stats[0]] * 0.6 + p.st[k.stats[1]] * 0.4)) : 40;
            const st = L.firmMakeStaff({ name: p.name, sex: p.sex, age: p.age, look: p.look, nat: 'kin', kin: p.id, skill: clamp(skill, 20, 90) });
            c.staff.push(st); c.kin[p.id] = s.t; L.bond(p, 6); s.firm.f.family = 1; s.firm.n.kin++;
            L.note(`${p.name} came into the family business, ${c.name}.`, 'big');
            return `${first(p.name)} starts on Monday, at the bottom, which is where you started. By Friday ${he(p)} has rearranged the stockroom, and it is better.`;
          } },
        { t: 'Tell them to see the world first', show: (L, x) => keen(L, L.person(x)), run(L, x) { const p = L.person(x); C(L).kin[p.id] = L.s.t; L.bond(p, -2); return `"It will still be here," you say. ${first(p.name)} is not sure that is the point.`; } },
        { t: 'Let it go', show: (L, x) => !keen(L, L.person(x)), run(L, x) { const p = L.person(x); C(L).kin[p.id] = L.s.t; L.bond(p, 3); return `You let it go, and are glad you did. ${first(p.name)} brings friends in for lunch instead, and tells them it is yours.`; } },
        { t: 'Press them', show: (L, x) => !keen(L, L.person(x)), odds: () => 0.35, why: (L) => (C(L).staff.length >= L.firmMax() ? 'No room for more.' : null),
          run(L, x, win) {
            const p = L.person(x), c = C(L); c.kin[p.id] = L.s.t;
            if (win) { const st = L.firmMakeStaff({ name: p.name, sex: p.sex, age: p.age, look: p.look, nat: 'kin', kin: p.id, skill: 35 }); st.mor = 40; c.staff.push(st); L.s.firm.f.family = 1; L.s.firm.n.kin++; L.bond(p, -4); return `${first(p.name)} gives in, for a year, ${he(p)} says. ${He(p)} is good at it, which annoys ${him(p)}.`; }
            L.bond(p, -8); return `${first(p.name)} says no again, louder. Sunday lunch is quieter for a while.`;
          } },
      ],
    },
    {
      id: 'firmBroke', icon: '🏦', title: 'A letter from the bank', w: 0,
      ok: (L) => !!C(L) && C(L).till < 0,
      text: (L) => `${C(L).name} is ${money(-C(L).till)} overdrawn, and the bank would like to know how you mean to put that right. ${say(L, C(L).fid, ['Wages are due on Friday.', 'The letter is on thick paper, which is never good.', 'The bank manager has signed it himself, which is worse.'])}`,
      opts: [
        { t: 'Put in money of your own', cost: (L) => Math.max(0, -C(L).till), run(L) { C(L).till = 0; return 'Your own savings, into the business. The bank writes again to say thank you, on thinner paper.'; } },
        { t: 'Borrow to cover it', show: (L) => !L.blacklisted() && C(L).loan - C(L).till + 1000 <= L.firmLimit(), run(L) { const c = C(L), n = -c.till + 1000; c.loan += n; c.till = 1000; c.seed = false; return `A loan of ${money(n)} to clear it, to be paid back out of the till. It buys time, at ${LOAN_RATE * 100}% a season.`; } },
        { t: 'Let somebody go', show: (L) => C(L).staff.length > 0, run(L) { const c = C(L), st = c.staff.slice().sort((a, b) => b.since - a.since)[0]; L.firmGone(st.id, 'sacked'); L.firmCheerAll(-6); return `${st.name} goes, with a reference and an apology. It helps the wages, and nothing else.`; } },
        { t: 'Let it go under', run(L) { const left = L.firmBust(); return `It is over. The bailiffs take the till, the stock and the sign.${left > 0 ? ` ${money(left)} of what it owed is yours to pay.` : ''}`; } },
        { t: 'Ride it out', run(L) { L.joy(-3); return 'You write back to say things are looking up. You are not sure they are.'; } },
      ],
    },
    {
      id: 'firmAgain', icon: '🌱', title: 'A second go', w: 0,
      ok: (L) => !L.s.biz && !L.s.gaol && !!L.s.firm.fail,
      text: (L) => {
        const f = L.s.firm.fail;
        return say(L, f.t, [`Priya Lal has a spare pitch on Market Square, a trestle table and an awning, and says you can pay her when it has paid you. "Everybody goes bust once," she says. "${f.name} was a good name."`, `A note through the door from somebody who worked at ${f.name}: if you ever start again, they would like to come back. It is written on the back of an old menu.`, `The Reverend Hollis has been asking around. There is a pitch going on Market Square, rent-free for a season, for somebody who deserves a second go.`]);
      },
      opts: [
        { t: (L) => `Start again, small: ${an(lowJob(BUSINESSES[againType(L)].names[0]))}`, why: (L) => { const k = BUSINESSES[againType(L)]; return L.s.st[k.stats[0]] < k.skill[0] ? `Needs ${STAT_NAME[k.stats[0]]} ${k.skill[0]}.` : null; },
          run(L) { L.s.firm.fail = null; L.joy(6); return `${opened(L, againType(L), false)} This time, you tell yourself, you will read every letter from the bank.`; } },
        { t: 'Not yet', run() { return 'Not yet. But you keep the note.'; } },
      ],
    },
  ];

  // ---- the helpers the cards share ----

  function pair(L, a, b) { a.pair = b.id; b.pair = a.id; a.pairAt = b.pairAt = L.s.t; a.did.love = b.did.love = L.s.t; C(L).loveT = L.s.t; }
  function done2(L, a, b) { a.did.love2 = b.did.love2 = L.s.t; }
  // Whether two who fell for each other have lasted (no dice: how happy they have been at work, and who they are).
  function wed(L, x) { const a = S(L, x.a), b = S(L, x.b); return !!a && !!b && (a.mor + b.mor) / 2 + ((a.id + b.id) % 3) * 6 >= 52; }
  // The idea one of the staff brings: one the business has not tried yet.
  function ideaOf(L, x) { const st = S(L, x), c = C(L); if (!st || !c) return null; const left = T(L).ideas.filter((i) => !c.tried.includes(i.id)); return left.length ? left[st.id % left.length] : null; }
  function ideaOdds(L, x) { const st = S(L, x), k = BUSINESSES[L.s.biz.type]; return clamp(0.3 + st.skill / 200 + L.s.st[k.stats[0]] / 300 + (st.mor - 50) / 200, 0.15, 0.9); }
  function tried(L, x, win, big) {
    const st = S(L, x), c = C(L), idea = ideaOf(L, x);
    did(st, 'idea', L); c.ideaT = L.s.t; c.tried.push(idea.id);
    if (win) {
      c.lines.push(idea.id);
      L.firmRep(big); L.firmCheer(st, 12);
      L.note(`Started ${idea.t} at ${c.name}: ${st.name}’s idea.`, 'big');
      return `${cap(idea.t)}, at ${c.name}. ${say(L, st.id, ['It takes off by the second month.', 'It is the talk of the High Street.', 'People come from Kettleby for it.'])} ${fn(st)} pretends not to be pleased.`;
    }
    L.firmCheer(st, -4);
    return `${cap(idea.t)}: it does not take. ${say(L, st.id, ['You were right to try.', `${fn(st)} takes it hard, and then takes it well.`, 'The napkin goes on the noticeboard, as a warning, or a memorial.'])}`;
  }
  // A grown child who wants to come into it (no dice: how close you are, and what they are good at).
  function keen(L, p) {
    if (!p) return false;
    const k = BUSINESSES[L.s.biz.type], best = p.st ? Object.keys(p.st).sort((a, b) => p.st[b] - p.st[a])[0] : null;
    return (p.bond >= 55 && (p.id + p.age) % 3 !== 0) || (!!best && k.stats.includes(best) && p.bond >= 35);
  }
  // Stepping back: somebody from outside runs it, for good pay. pain: how much it hurts.
  function chair(L, pain) {
    const c = C(L), s = L.s;
    c.board.t = s.t; c.board.mood = clamp(c.board.mood + 25, 0, 100);
    const st = L.firmMakeStaff({ nat: 'grafter', skill: L.int(70, 82), age: L.int(40, 55) });
    st.known = true; st.pay = 1.4; c.staff.push(st); c.mgr = st.id; s.biz.mgr = true;
    L.joy(-pain);
    return `${st.name} arrives from the city with a laptop and a plan, and runs ${c.name} from Monday. You keep your shares, your name on the door, and a very good parking space.`;
  }
  function againType(L) { const p = L.s.firm.past.slice().reverse().find((q) => q.how === 'bust'); return p && BUSINESSES[p.type] ? p.type : 'shop'; }
}

const RIVAL_WORD = { cheap: 'all about price, and proud of it', flash: 'all big talk, and less behind it than it looks', sly: 'charming, and you would not turn your back', proper: 'good at it, and decent with it' };
