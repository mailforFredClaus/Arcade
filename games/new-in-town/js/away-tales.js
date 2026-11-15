// New in Town: going away, the cards. tripCards are the pools a trip is dealt
// from (see deal in away.js): each is { id, kinds ('*' or a list), w (or
// w(L, tr)), when(L, tr), ctx(L, tr) (whatever the card needs decided when it
// is dealt: who gets sunburnt, which festival; the words themselves must not
// throw dice), icon, title, text(L, tr, c), opts }, and every option is handed
// the trip under way (tr) and what was dealt (c). After any of them, the next
// card comes, and after the last evening, home. lifeCards are the ones that
// come over the years: the day a booked trip comes round, the honeymoon, the
// romance that follows you home and the one that should not, the cruise
// brochures, the family caravan, and the place of your own away.

import { SEASONS, NAMES_F, money } from './data.js';
import {
  KINDS, OWN, SOUVENIRS, SOUV_COST, POSTCARDS, WONDERS, FESTIVALS, LET_SHARE,
  clamp, first, he, He, his, him, cap, list, nth,
} from './away-lib.js';

// Who someone is, in a sentence: Mum and Dad are Mum and Dad.
const nm = (p) => (/^(Mum|Dad)$/.test(p.name) ? p.name : first(p));
// Pronouns for somebody who is not (yet) anybody in the life: { sex }.
const pr = (sex) => (sex === 'm' ? { he: 'he', He: 'He', his: 'his', him: 'him' } : { he: 'she', He: 'She', his: 'her', him: 'her' });
// The place, short: "Greece", "Pendrift Sands", "the fells of the north".
const short = (tr) => tr.at.split(',')[0];
// What the little things cost somebody of your means (the taxi, the thank-you, the souvenir): see midSpend in midlife.js.
const spend = (L, n) => Math.round(n * Math.min(4, L.midSpend ? L.midSpend() : 1) / 10) * 10;

export function tripCards(H) {
  const who = (L, tr) => H.people(L, tr);
  const kidsOn = (L, tr) => who(L, tr).filter((p) => p.kind === 'child' && p.age < 18);
  const ptOn = (L, tr) => who(L, tr).find((p) => p.kind === 'partner' || p.kind === 'spouse') || null;
  const heads = (tr) => 1 + tr.who.length;
  const bondAll = (L, tr, d) => { for (const p of who(L, tr)) tr.b[p.id] = (tr.b[p.id] || 0) + d; };
  const bondOne = (tr, p, d) => { if (p) tr.b[p.id] = (tr.b[p.id] || 0) + d; };
  const K = (L, tr) => L.awayKind(tr.k) || KINDS.caravan;
  const abroad = (L, tr) => !!K(L, tr).abroad;
  const road = (L, tr) => !!K(L, tr).road;
  const P = (L, id) => (id == null ? null : L.person(id));
  // The people at home: postcards and telephone calls go to them.
  const atHome = (L, tr) => L.s.people.filter((p) => !tr.who.includes(p.id) && (['partner', 'spouse', 'child', 'parent', 'sibling', 'grandchild'].includes(p.kind) || (p.kind === 'friend' && p.bond >= 40))).sort((a, b) => b.bond - a.bond).slice(0, 4);
  // A friend lost touch with, who could turn up anywhere.
  const lostFriend = (L) => {
    const s = L.s, met = s.away.met || [];
    for (let i = s.log.length - 1; i >= 0; i--) {
      const m = /^Lost touch with (.+)\.$/.exec(s.log[i].t);
      if (m && !s.people.some((p) => p.name === m[1]) && !met.includes(m[1])) return m[1];
    }
    return null;
  };
  const sexOf = (name) => (NAMES_F.includes(name.split(' ')[0]) ? 'f' : 'm');

  return [
    // ---- something left behind (always, if the case was packed badly; never, if it was packed well) ----
    {
      id: 'awForgot', kinds: '*', w: 0.7, when: (L, tr) => tr.k !== 'own',
      ctx: (L, tr) => ({ v: L.int(0, 99), p: tr.who.length ? L.pick(tr.who) : null, thing: abroad(L, tr) ? L.pick(['the passports', 'the tickets', 'the swimming things']) : tr.k === 'tent' ? L.pick(['the tent pegs', 'the sleeping bags', 'the tin opener']) : tr.k === 'walk' ? L.pick(['your walking boots', 'the map', 'the waterproofs']) : L.pick(['the towels', 'your good shoes', 'the bag with all the chargers in']) }),
      icon: '🧳', title: 'Something left behind',
      text: (L, tr, c) => (/passports|tickets/.test(c.thing)
        ? `Halfway to the airport, somebody asks who has ${c.thing}. Nobody has ${c.thing}. ${cap(c.thing)} are on the hall table, next to the sandwiches.`
        : nth([`You arrive, unpack, and find that ${c.thing} ${/s$/.test(c.thing) ? 'are' : 'is'} at home, in the hall, exactly where you put ${/s$/.test(c.thing) ? 'them' : 'it'} so as not to forget.`, `There is a moment, an hour after you set off, when everybody goes quiet and thinks about ${c.thing}. ${cap(c.thing)} ${/s$/.test(c.thing) ? 'are' : 'is'} at home.`, `“Who packed ${c.thing}?” Nobody packed ${c.thing}.`], c.v)),
      opts: [
        { t: 'Turn round and go back for them', show: (L, tr, c) => /passports|tickets/.test(c.thing), run(L, tr) { tr.q -= 1; return 'You make it with four minutes to spare, no breakfast and nobody speaking to you.'; } },
        { t: 'Buy new when you get there', show: (L, tr, c) => !/passports|tickets/.test(c.thing), cost: (L, tr) => spend(L, 25 * heads(tr)), run() { return 'It costs twice what it would at home, and is not as good, and you will have two now.'; } },
        { t: 'Ring a neighbour and beg', show: (L, tr, c) => /passports|tickets/.test(c.thing), check: ['charm', 40], run(L, tr, c, win) { if (win) { H.mem(tr, 'the neighbour in the dressing gown', 2); return `Your neighbour arrives in a dressing gown with ${c.thing} in a carrier bag, and will not hear of thanks. You owe her for ever.`; } tr.q -= 2; L.cash(-40 * heads(tr)); return 'Nobody answers. You go back for them yourself, miss it, and pay to go the next day.'; } },
        { t: 'Make do', show: (L, tr, c) => !/passports|tickets/.test(c.thing), run(L, tr, c) { tr.q -= 1; H.mem(tr, `the year we forgot ${c.thing.replace(/^your /, 'the ')}`, 2); return 'You make do. It becomes a family story, always told against you.'; } },
        { t: 'Blame somebody else', show: (L, tr, c) => !!P(L, c.p), run(L, tr, c) { const p = P(L, c.p); bondOne(tr, p, -3); return `${nm(p)} did not pack it, and says so, often, for the rest of the week.`; } },
      ],
    },

    // ---- lost luggage ----
    {
      id: 'awLuggage', kinds: ['sun', 'cruise', 'far', 'city', 'coach'], w: 1.1,
      icon: '🧳', title: 'The case that went somewhere else',
      text(L, tr) {
        const kids = kidsOn(L, tr).length, pt = ptOn(L, tr);
        const more = kids ? ' It is the one with the children’s swimming things in it, and the suncream.' : pt ? ` It is the one with both your things in it, because packing one case seemed so sensible at the time.` : '';
        if (tr.k === 'coach') return `At the second hotel your case is not in the hold. Ken the driver is very sorry, and very sure it was there this morning.${more}`;
        if (tr.k === 'city') return `Somebody has got off the train with your case and left you theirs. Theirs is the same colour, and has a set of bagpipes in it.${more}`;
        return `The carousel goes round and round. Everybody else’s case comes out, and a set of golf clubs, twice. Yours does not.${more}`;
      },
      opts: [
        { t: 'Buy what you need, and claim it back', cost: (L, tr) => spend(L, 60 * heads(tr) * (1 + tr.c)), run() { return 'A day in the shops buying the same things you already own, in brighter colours. The insurance pays back about half, eventually.'; } },
        { t: 'Make do with what you stand up in', run(L, tr) { tr.q -= 1; H.mem(tr, 'the week in borrowed clothes', 3); return 'You spend the week in one shirt and a pair of shorts from the hotel shop. By Wednesday you smell of airports, and by Friday you have never felt so free.'; } },
        { t: 'Spend a day chasing it', check: ['smarts', 40], run(L, tr, c, win) { if (win) return 'It turns up in the end, in a taxi, with a man who wants a tip.'; tr.q -= 1; return 'Nobody has heard of your case, or of you. It comes home a week after you do, with a label from somewhere you have never been.'; } },
      ],
    },

    // ---- sunburn ----
    {
      id: 'awSunburn', kinds: ['sun', 'cruise', 'far', 'gap', 'caravan', 'tent', 'own'], w: (L, tr) => (['sun', 'cruise', 'far', 'gap'].includes(tr.k) || (tr.k === 'own' && L.s.away.own && L.s.away.own.kind === 'villa') || L.season === 1 ? 1.3 : 0),
      ctx: (L, tr) => ({ v: L.int(0, 99), p: tr.who.length && L.chance(0.6) ? L.pick(tr.who) : null }),
      icon: '☀️', title: 'Burnt',
      text(L, tr, c) {
        const p = P(L, c.p);
        if (!p) return nth(['You fall asleep by the pool with a book open on your face, and wake up with the shape of the book on it, in red.', 'You meant to turn over after twenty minutes. You wake up two hours later, the colour of a pillar box, with a crease where your watch was.', 'You tell everyone you never burn. By teatime you cannot sit down, and everyone knows why.'], c.v);
        if (p.kind === 'child' && p.age < 13) return `${first(p)} would not keep a hat on, and is now pink from the neck up and very cross about it.`;
        return `${nm(p)} insists ${he(p)} does not burn, ${he(p)} goes brown. By teatime ${he(p)} is the colour of a pillar box and cannot sit down.`;
      },
      opts: [
        { t: 'Calamine, and a day in the shade', run(L, tr, c) { tr.q -= 1; L.hp(1); bondOne(tr, P(L, c.p), 2); return 'A day indoors with the shutters closed and a fan going. It is actually rather nice.'; } },
        { t: 'Laugh about it', run(L, tr, c) { const p = P(L, c.p); if (p) { bondOne(tr, p, -2); H.mem(tr, `the year ${nm(p)} got burnt`, 2); } else H.mem(tr, 'the year of the sunburn', 1); return 'There are photographs. There will always be photographs.'; } },
        { t: (L, tr) => (abroad(L, tr) ? 'Find a chemist, in your best foreign' : 'Find a chemist'), check: ['smarts', 35], run(L, tr, c, win) { if (win) { tr.q += 1; return 'The chemist understands at once, and sells you something green that works like magic.'; } tr.q -= 1; return 'You mime sunburn at the chemist for some time, and come away with something for indigestion.'; } },
      ],
    },

    // ---- a row in the car ----
    {
      id: 'awRow', kinds: ['tent', 'caravan', 'walk', 'own'], w: 1.4, when: (L, tr) => tr.who.length > 0 && road(L, tr),
      ctx: (L, tr) => { const ps = who(L, tr); const first2 = ps.find((p) => p.kind === 'partner' || p.kind === 'spouse') || ps.find((p) => p.kind === 'parent') || L.pick(ps); return { v: L.int(0, 99), p: first2 ? first2.id : null }; },
      icon: '🚗', title: 'The row in the car',
      text(L, tr, c) {
        const p = P(L, c.p);
        if (!p) return 'Two hours in, somebody says something about the map, and somebody else says something about the somebody, and it goes on from there.';
        if (p.kind === 'partner' || p.kind === 'spouse') return `Two hours in, somewhere past a roundabout you have been round twice, ${first(p)} says ${he(p)} would have gone left. You say you know. ${He(p)} says ${he(p)} knows you know. It goes on from there.`;
        if (p.kind === 'child') return p.age < 13 ? `${first(p)} has asked if you are nearly there forty-one times. You are not nearly there. You are not anywhere.` : `${first(p)} has had headphones on since you left, and takes them off only to tell you your driving is embarrassing.`;
        if (p.kind === 'parent') return `${nm(p)} has views on your driving, on the lane you are in, and on the radio station, and has shared all of them by the first services.`;
        return `${first(p)} has control of the music, and has chosen whale song. For the whole way.`;
      },
      opts: [
        { t: 'Pull into a lay-by and sort it out', check: ['charm', 40], run(L, tr, c, win) { const p = P(L, c.p); if (win) { bondOne(tr, p, 3); tr.q += 1; return 'Ten minutes in a lay-by, a flask of tea and a proper talk. The rest of the drive is the best part of the holiday.'; } bondOne(tr, p, -3); tr.q -= 1; return 'It is a very long lay-by, and a very long ten minutes.'; } },
        { t: 'Turn the radio up', run(L, tr, c) { bondOne(tr, P(L, c.p), -1); return 'Nobody speaks until the sea comes into view, and then everybody does, at once.'; } },
        { t: 'Stop for chips', cost: (L, tr) => spend(L, 8 * heads(tr)), run(L, tr) { tr.q += 1; bondAll(L, tr, 1); return 'Chips in a car park with the windows steaming up. Nobody remembers what it was about.'; } },
      ],
    },

    // ---- the children at the pool ----
    {
      id: 'awPool', kinds: ['sun', 'caravan', 'cruise', 'own'], w: 1.6, when: (L, tr) => kidsOn(L, tr).some((p) => p.age >= 3 && p.age < 14),
      icon: '🏊', title: 'The children and the pool',
      text(L, tr) {
        const ks = kidsOn(L, tr).filter((p) => p.age >= 3 && p.age < 14), names = ks.length > 2 ? 'The children' : list(ks.map(first));
        const pool = tr.k === 'caravan' ? 'the park’s indoor pool, the one with the wave machine that goes on at three,' : tr.k === 'cruise' ? 'the pool on the top deck' : 'the pool';
        return `${names} ${ks.length > 1 ? 'have' : 'has'} been in ${pool} since breakfast, and show${ks.length > 1 ? '' : 's'} no sign of coming out. There is a family from up north, and a lilo shaped like a crocodile.`;
      },
      opts: [
        { t: 'Get in with them', run(L, tr) { for (const p of kidsOn(L, tr)) bondOne(tr, p, 4); tr.q += 1; L.gain('fitness', 0.5); H.mem(tr, 'the summer of the crocodile lilo', 2); return 'You are the crocodile for most of the afternoon. It is the best afternoon of the year.'; } },
        { t: 'A lounger, a book, and one eye open', run(L, tr) { L.hp(2); tr.q += 1; return 'You read four chapters and count heads every two pages.'; } },
        { t: 'Sign them up for the kids’ club', cost: (L, tr) => spend(L, 30 * kidsOn(L, tr).length), run(L, tr) { tr.q += 1; const pt = ptOn(L, tr); if (pt) { bondOne(tr, pt, 3); return `An afternoon to yourselves, for the first time in about a year. You and ${first(pt)} have a long lunch and talk about something other than the children, mostly the children.`; } return 'An afternoon to yourself. You do not know what to do with it, and then you do: nothing at all.'; } },
      ],
    },

    // ---- the storm ----
    {
      id: 'awStorm', kinds: ['tent', 'caravan', 'walk', 'cruise', 'own'], w: (L, tr) => (L.season === 3 || L.s.wx === 'storm' ? 2.2 : 1), when: (L, tr) => tr.k !== 'own' || (L.s.away.own && L.s.away.own.kind !== 'villa'),
      icon: '⛈️', title: 'The storm',
      text(L, tr) {
        if (tr.k === 'tent') return 'At two in the morning the wind gets under the flysheet, and the tent tries to leave for the next county with you in it.';
        if (tr.k === 'walk') return 'On the third day the cloud comes down on the tops, then the rain comes sideways, and the path you were on is a stream.';
        if (tr.k === 'cruise') return 'A gale in the night. The ship pitches and rolls, the bottles in the bar sing, and half the passengers are not seen at breakfast.';
        if (tr.k === 'own' && L.s.away.own && L.s.away.own.kind === 'cottage') return 'A storm takes the power out on the first night. Candles, a tin of soup, and a door that bangs until you wedge it with a boot.';
        return 'The storm comes in off the sea after dark. The caravan rocks like a boat, the rain on the roof is like gravel, and somebody’s awning goes past the window.';
      },
      opts: [
        { t: 'Sit it out: cards, cocoa and a torch', run(L, tr) { if (tr.who.length) { bondAll(L, tr, 2); H.mem(tr, 'the night of the storm', 3); return 'Rummy by torchlight until the wind drops. Everybody remembers it as the best night of the week.'; } L.joy(1); H.mem(tr, 'the night of the storm', 2); return 'You read by torchlight until the wind drops, warm and dry and very pleased with yourself.'; } },
        { t: 'Pack up and go home early', run(L, tr) { tr.cut = true; tr.q -= 1; return 'You are home by lunchtime, damp and relieved. It was not really a holiday, but it was something.'; } },
        { t: 'Go out in it', check: ['fitness', 45], run(L, tr, c, win) { if (win) { tr.q += 2; H.mem(tr, `the storm at ${short(tr)}`, 4); return 'You stand in it with the whole sky going mad, and laugh until you are hoarse.'; } L.hp(-3, 'a soaking'); tr.q -= 1; return 'You come back soaked to the bone, with a cold that lasts a month.'; } },
      ],
    },

    // ---- rain ----
    {
      id: 'awRain', kinds: ['tent', 'caravan', 'walk', 'city', 'coach', 'own'], w: (L) => (L.s.wx === 'wet' ? 2.5 : 1), when: (L, tr) => tr.k !== 'own' || (L.s.away.own && L.s.away.own.kind !== 'villa'),
      ctx: (L) => ({ v: L.int(0, 99) }),
      icon: '🌧️', title: 'Rain',
      text: (L, tr, c) => nth([`It rains on the Monday. It rains on the Tuesday, harder. By Wednesday the whole place has the look of somewhere that has given up on ${L.season === 1 ? 'summer' : 'everything'}.`, 'It rains so hard that the drains give up and the gulls sit it out. The forecast says “bright spells”. There are no bright spells.', 'It has rained every day since you got here. The local paper says it is the wettest week since records began, as if that helps.'], c.v),
      opts: [
        { t: 'Board games, and a jigsaw with a piece missing', run(L, tr) { if (tr.who.length) { bondAll(L, tr, 2); return 'Monopoly, three times, and a jigsaw of a sunny beach with one piece of sky missing. Nobody sulks for long.'; } L.joy(1); return 'You do a jigsaw of a sunny beach on your own, and find the missing piece in your sock.'; } },
        { t: 'Go out in it anyway', check: ['fitness', 30], run(L, tr, c, win) { if (win) { tr.q += 1; H.mem(tr, 'the waterfall in the rain', 2); return 'A waterfall in full spate, and nobody else there to see it. You come back wet and glowing.'; } tr.q -= 1; L.hp(-1); return 'You come back wet through, with a cold coming on and nothing to show for it but wet socks.'; } },
        { t: 'The amusement arcade', cost: (L, tr) => spend(L, 15 * heads(tr)), run(L, tr) { tr.q += 1; for (const p of kidsOn(L, tr)) bondOne(tr, p, 2); return 'Two hours, a bag of tokens, and a plastic watch from the grabber that stops on the way home.'; } },
      ],
    },

    // ---- a holiday romance (if single) ----
    {
      id: 'awRomance', kinds: ['sun', 'cruise', 'city', 'far', 'gap', 'caravan', 'walk', 'coach'], w: 1.6,
      when: (L, tr) => !L.partner() && (tr.w === 'solo' || tr.w === 'friends') && L.s.age <= 70 && !L.s.away.rom,
      ctx: (L) => { const s = L.s, sex = s.into === 'b' ? (L.chance(0.5) ? 'm' : 'f') : s.into || (s.sex === 'm' ? 'f' : 'm'); return { sex, name: L.freshName(sex), age: clamp(s.age + L.int(-4, 4), 18, 90), from: L.pick(['Denmark', 'Ireland', 'Canada', 'Italy', 'Germany', 'Australia', 'Holland', 'Sweden', 'New Zealand']) }; },
      icon: '🌹', title: 'Somebody at the next table',
      text: (L, tr, c) => { const p = pr(c.sex); return `${c.name} is on holiday too, from ${c.from}. ${p.He} laughs at your jokes, which is a start, and has been at the next table at breakfast every morning, which may not be an accident.`; },
      opts: [
        { t: 'A holiday romance', run(L, tr, c) { const s = L.s, n = c.name.split(' ')[0]; tr.q += 2; L.joy(3); H.mem(tr, `the ${SEASONS[L.season].toLowerCase()} of ${n}`, 5); s.away.rom = { name: c.name, sex: c.sex, age: c.age, from: c.from, at: short(tr), t: s.t, due: s.t + L.int(1, 3), follow: L.chance(0.5) }; return 'Long dinners, late swims, and promises that are easy to make in the sun. You exchange addresses on the last morning, and mean it, at the time.'; } },
        { t: 'One dance, and a kiss goodnight', run(L, tr, c) { tr.q += 1; H.mem(tr, `the last dance with ${c.name.split(' ')[0]}`, 2); return 'One dance on the terrace, a kiss at the door, and nothing more. It is perfect, as it is.'; } },
        { t: 'Not on holiday', run() { return 'You are polite, and go to bed early, and are slightly sorry.'; } },
      ],
    },

    // ---- temptation (if not single, and they are at home) ----
    {
      id: 'awTempt', kinds: ['sun', 'cruise', 'city', 'far', 'caravan', 'walk', 'coach'], w: 1.1,
      when: (L, tr) => { const pt = L.partner(); return !!pt && !tr.who.includes(pt.id) && L.s.age <= 75 && !L.s.away.secret; },
      ctx: (L) => { const s = L.s; return { sex: s.into === 'b' ? (L.chance(0.5) ? 'm' : 'f') : s.into || (s.sex === 'm' ? 'f' : 'm') }; },
      icon: '🍸', title: 'A long way from home',
      text: (L, tr, c) => { const pt = L.partner(), p = pr(c.sex); return `There is somebody at the bar who has been catching your eye all week, and tonight ${p.he} sends a drink over.${pt ? ` ${first(pt)} is a long way away, and would never know.` : ''}`; },
      opts: [
        { t: 'Send it back, and ring home', run(L) { const pt = L.partner(); if (pt) L.bond(pt, 3); L.karma(1); return pt ? `You ring ${first(pt)} from the lobby and talk for an hour about nothing. It costs a fortune, and is worth it.` : 'You send it back, with a smile, and go up to bed.'; } },
        { t: 'One drink, and a long talk about nothing', run(L, tr) { tr.q += 1; return 'A nice evening, and nothing more. You go up to bed alone, and pleased with yourself.'; } },
        { t: 'Stray', run(L, tr) { const s = L.s, pt = L.partner(); tr.q += 1; L.joy(2); L.karma(-3); if (pt) s.away.secret = { p: pt.id, t: s.t, due: s.t + L.int(1, 4), at: short(tr), out: L.chance(0.45) }; return 'You are not proud of it in the morning, and less proud of it every morning after.'; } },
      ],
    },

    // ---- a stranger's kindness ----
    {
      id: 'awKind', kinds: '*', w: 1,
      icon: '🤝', title: 'A kindness',
      text(L, tr) {
        if (road(L, tr)) return 'The car dies on a lane with grass up the middle. A farmer on a tractor tows you three miles to his yard, mends it with a coat hanger, and will not take a penny.';
        if (abroad(L, tr)) return 'You are lost, hot and arguing about the map when an old woman leans out of a window and calls you up for lemonade. Her grandson draws you a better map, with pictures.';
        return 'You leave your wallet on a bench. A boy runs after you for two streets to give it back, and will not take a reward.';
      },
      opts: [
        { t: 'Thank them properly', cost: (L) => spend(L, 30), run(L, tr) { L.karma(1); tr.q += 1; H.mem(tr, road(L, tr) ? 'the farmer with the coat hanger' : abroad(L, tr) ? 'the lemonade lady' : 'the boy with the wallet', 2); return 'A bottle of something and a card. They are embarrassed, which makes you both feel better.'; } },
        { t: 'Promise yourself to do the same for somebody', run(L, tr) { L.karma(2); tr.q += 1; return 'And you do: a lost family on the harbour wall in the Bay, the summer after. You think of the stranger as you point the way.'; } },
        { t: 'Accept, gratefully', run(L, tr) { tr.q += 1; return 'You say thank you more times than is strictly necessary. It is still not enough.'; } },
      ],
    },

    // ---- a local festival ----
    {
      id: 'awFestival', kinds: ['sun', 'city', 'walk', 'coach', 'far', 'cruise', 'gap'], w: 1.2,
      ctx: (L) => ({ v: L.int(0, FESTIVALS.length - 1) }),
      icon: '🎆', title: 'The festival',
      text: (L, tr, c) => `By luck, you have arrived on the day of the festival: ${nth(FESTIVALS, c.v)}.`,
      opts: [
        { t: 'Join in', check: ['charm', 35], run(L, tr, c, win) { if (win) { tr.q += 2; L.joy(2); bondAll(L, tr, 1); H.mem(tr, 'the night of the festival', 4); return 'By midnight you are in the thick of it, dancing with strangers who are not strangers any more.'; } tr.q += 1; return 'You join the wrong procession, and walk very solemnly for an hour behind what turns out to be a funeral.'; } },
        { t: 'Watch from a café table', run(L, tr) { tr.q += 1; return 'The best seat in town, and a waiter who keeps the glasses coming.'; } },
        { t: '🪂 Climb the greasy pole for the ham', show: (L) => !!(L.soulHas && L.soulHas('daredevil')), odds: () => 0.4, run(L, tr, c, win) { if (win) { tr.q += 2; L.joy(4); H.mem(tr, 'the ham on the greasy pole', 5); return 'Three tries, a great deal of grease, and the whole square roaring. You carry the ham home on your shoulder.'; } L.hp(-2, 'a fall'); tr.q += 1; return 'You get further than anyone has all day, and then you do not. The crowd loves you anyway.'; } },
      ],
    },

    // ---- a food mishap ----
    {
      id: 'awFood', kinds: '*', w: 1,
      ctx: (L, tr) => ({ v: L.int(0, 99), p: tr.who.length && L.chance(0.5) ? L.pick(tr.who) : null }),
      icon: '🍤', title: 'Something you ate',
      text(L, tr, c) {
        const food = tr.k === 'tent' ? 'the sausages, which were black outside and pink inside' : nth(['the prawns', 'the mussels', 'something from a stall that nobody could name'], c.v), p = P(L, c.p);
        return p ? `${nm(p)} had ${food}. Everybody said not to have ${food.replace(/,.*$/, '')}.` : `You had ${food}. Everybody said not to have ${food.replace(/,.*$/, '')}.`;
      },
      opts: [
        { t: 'Ride it out', run(L, tr, c) { tr.q -= 1; if (!P(L, c.p)) L.hp(-3, 'something you ate'); return 'Two days nobody wants to talk about, and nobody makes anybody.'; } },
        { t: 'Try the local remedy', odds: () => 0.6, run(L, tr, c, win) { if (win) return 'A glass of something black that the landlady’s mother swears by. It is disgusting, and it works.'; tr.q -= 1; if (!P(L, c.p)) L.hp(-4, 'something you ate'); return 'A glass of something black that the landlady’s mother swears by. It does not work, and it is disgusting.'; } },
        { t: (L, tr, c) => (P(L, c.p) ? `Sit up with ${nm(P(L, c.p))}` : 'Toast and water for the rest of the week'), run(L, tr, c) { const p = P(L, c.p); tr.q -= 1; if (p) { bondOne(tr, p, 4); return `You sit up all night with a bucket and a cold flannel. ${He(p)} will not forget it.`; } L.hp(-1); return 'Toast and water, then toast and tea, then, on the last day, very cautiously, an egg.'; } },
      ],
    },

    // ---- the last train ----
    {
      id: 'awTrain', kinds: ['city', 'walk', 'coach', 'far', 'gap'], w: 1,
      icon: '🚉', title: 'The last train',
      text: (L, tr) => `The train is at 6:12. At 6:11 you are at the wrong end of the station${tr.who.length ? `, ${tr.said},` : ''} with a case whose wheel has stopped going round.`,
      opts: [
        { t: 'Run for it', check: ['fitness', 40], run(L, tr, c, win) { if (win) { tr.q += 1; return 'You fall into the carriage as the whistle goes, and laugh for twenty minutes.'; } L.cash(-60 * heads(tr)); tr.q -= 1; return 'The doors close in your face. A night in the station hotel, with views of the car park, and a fresh fare in the morning.'; } },
        { t: 'A taxi, whatever it costs', cost: (L) => spend(L, 90), run() { return 'The taxi driver takes the long way, and the long way is beautiful.'; } },
        { t: 'Shrug, and find somewhere for tea', run(L, tr) { H.mem(tr, 'the café by the station', 2); return 'You find a café by the station that does the best cake you have ever eaten, and catch the 8:40.'; } },
      ],
    },

    // ---- a burglary at home ----
    {
      id: 'awBurgle', kinds: ['tent', 'caravan', 'coach', 'walk', 'city', 'sun', 'cruise', 'far', 'own'], w: 0.5, when: (L) => L.s.home !== 'hostel',
      ctx: (L) => ({ loss: [0, 600, 1200, 2400, 4000, 7000, 12000][(L.s.home && { bedsit: 1, flat: 2, cottage: 3, townhouse: 4, villa: 5, manor: 6 }[L.s.home]) || 1] }),
      icon: '🏠', title: 'A call from home',
      text: (L) => `Your neighbour rings: somebody has been in through the back window while you were away. The television has gone, and the good spoons, and the jar of coins for the electric.${L.s.ins.home ? ' You are insured, thank goodness.' : ' You are not insured.'}`,
      opts: [
        { t: 'Come home at once', run(L, tr, c) { tr.cut = true; tr.q -= 1; L.cash(L.s.ins.home ? -200 : -Math.round(c.loss * 0.6)); return L.s.ins.home ? 'You are home by midnight. The insurers pay all but the first $200, and a man comes to fix the window.' : 'You are home by midnight, in time to stop the rest going. It is not as bad as you feared, and worse than you hoped.'; } },
        { t: 'Ask the neighbour to board it up, and stay', run(L, tr, c) { tr.q -= 1; L.cash(L.s.ins.home ? -200 : -c.loss); return 'You lie by the pool and try not to think about it. You think about it.'; } },
      ],
    },

    // ---- an old friend met abroad ----
    {
      id: 'awOldFriend', kinds: ['sun', 'city', 'cruise', 'far', 'coach'], w: 1.4, when: (L) => !!lostFriend(L),
      ctx: (L) => { const name = lostFriend(L); return { v: L.int(0, 99), name, sex: name ? sexOf(name) : 'f' }; },
      icon: '👋', title: 'A face from the past',
      text: (L, tr, c) => `Somebody shouts your name across ${nth(['a square', 'the deck', 'a hotel lobby', 'a crowded market'], c.v)}. It is ${c.name}, whom you lost touch with years ago: browner, wider, and exactly the same.`,
      opts: [
        { t: 'Dinner, and all the news', run(L, tr, c) { const s = L.s; (s.away.met = s.away.met || []).push(c.name); if (!s.people.some((p) => p.name === c.name)) L.meet({ name: c.name, sex: c.sex, bond: 40 }); tr.q += 2; H.mem(tr, `running into ${c.name.split(' ')[0]} in ${short(tr)}`, 4); return 'You talk until the waiters stack the chairs round you, and swap numbers, and this time you mean it.'; } },
        { t: 'A drink, for old times’ sake', run(L, tr, c) { const s = L.s; (s.away.met = s.away.met || []).push(c.name); if (!s.people.some((p) => p.name === c.name)) L.meet({ name: c.name, sex: c.sex, bond: 26 }); tr.q += 1; return 'One drink, then another, and the years fall away. You promise to write.'; } },
        { t: 'Hide behind a menu', run(L, tr, c) { const s = L.s; (s.away.met = s.away.met || []).push(c.name); return 'Some people are better left in the past, or at least in another bar.'; } },
      ],
    },

    // ---- the teenager ----
    {
      id: 'awTeen', kinds: ['caravan', 'sun', 'cruise', 'walk', 'own', 'coach', 'city'], w: (L, tr) => (tr.trad ? 3 : 1.5), when: (L, tr) => kidsOn(L, tr).some((p) => p.age >= 13),
      ctx: (L, tr) => ({ p: kidsOn(L, tr).filter((p) => p.age >= 13).sort((a, b) => b.age - a.age)[0].id }),
      icon: '🎧', title: 'Somebody would rather be elsewhere',
      text: (L, tr, c) => { const p = P(L, c.p); return p ? `${first(p)} is ${p.age}, and has made it clear that this place is boring, that the family is embarrassing, and that everybody ${he(p)} knows is at home having the best summer of their lives.` : 'Somebody would rather be anywhere else, and says so.'; },
      opts: [
        { t: 'Let them go off on their own for the day', run(L, tr, c) { const p = P(L, c.p); bondOne(tr, p, 4); H.mem(tr, 'the tattoo that washed off', 2); return p ? `${He(p)} comes back at teatime with a tan, a new friend and a tattoo that turns out, thank goodness, to wash off.` : 'They come back at teatime, happier.'; } },
        { t: 'They are coming with us, and they will enjoy it', odds: () => 0.5, run(L, tr, c, win) { const p = P(L, c.p); if (win) { bondOne(tr, p, 4); tr.q += 1; return p ? `By Thursday ${he(p)} is first into the sea and last out of it.` : 'By Thursday they are enjoying it.'; } bondOne(tr, p, -5); tr.q -= 1; return p ? `${He(p)} does not enjoy it, and makes sure you know, every hour, on the hour.` : 'They do not enjoy it.'; } },
        { t: 'Next time, they can bring a friend', run(L, tr, c) { const p = P(L, c.p); bondOne(tr, p, 3); return p ? `${He(p)} has a list of friends drawn up before you get home.` : 'There is a list of friends by the end of the day.'; } },
      ],
    },

    // ---- taking a parent ----
    {
      id: 'awParent', kinds: '*', w: 1.8, when: (L, tr) => who(L, tr).some((p) => p.kind === 'parent'),
      ctx: (L, tr) => ({ v: L.int(0, 2), p: L.pick(who(L, tr).filter((p) => p.kind === 'parent')).id }),
      icon: '🧓', title: (L, tr, c) => { const p = P(L, c.p); return p ? `${nm(p)}’s holiday` : 'A day out of the holiday'; },
      text(L, tr, c) {
        const p = P(L, c.p);
        if (!p) return 'Somebody is tired, and pretends not to be.';
        return nth([`${nm(p)} wants to find the guest house where ${he(p)} stayed on ${his(p)} own honeymoon. ${He(p)} is sure it was near here. ${He(p)} is sure it had a blue door.`, `${nm(p)} has made friends with every waiter in the place, and told all of them about you, with photographs.`, `${nm(p)} gets tired in the afternoons now, and pretends not to. You notice anyway.`], c.v);
      },
      opts: [
        { t: 'An afternoon, just the two of you', run(L, tr, c) { const p = P(L, c.p); bondOne(tr, p, 6); tr.q += 1; if (!p) return 'A long afternoon, and a lot said.'; H.mem(tr, nth([`finding ${nm(p)}’s blue door`, `${nm(p)} and the waiters`, `the afternoon with ${nm(p)}`], c.v), 4); return nth([`You find it on the fourth street: a blue door, still a guest house, and a woman who lets you both look round. ${nm(p)} sits on the bed and does not say anything for a long time.`, `You let ${nm(p)} introduce you to every one of them. By the end of the afternoon you are friends with the whole kitchen.`, `You sit on a bench in the shade together, and ${nm(p)} tells you things about your childhood you never knew.`], c.v); } },
        { t: 'Let them rest, and bring them a cup of tea', run(L, tr, c) { bondOne(tr, P(L, c.p), 3); L.hp(1); return 'A pot of tea on the balcony, the paper, and a nap for both of you.'; } },
        { t: 'Go off on your own for a bit', run(L, tr, c) { bondOne(tr, P(L, c.p), -1); tr.q += 1; return 'An afternoon to yourself, and a slightly guilty conscience.'; } },
      ],
    },

    // ---- a perfect evening ----
    {
      id: 'awView', kinds: '*', w: 1,
      icon: '🌅', title: 'A perfect evening',
      text: (L, tr) => `One evening the light goes gold ${tr.k === 'city' ? 'over the rooftops' : tr.k === 'walk' ? 'over the hills' : tr.k === 'cruise' ? 'over the water' : tr.k === 'coach' ? 'over a lake' : 'over the sea'}, and for an hour nobody wants anything and nothing hurts.`,
      opts: [
        { t: 'Stay out until it is dark', run(L, tr) { tr.q += 2; bondAll(L, tr, 2); H.mem(tr, 'the evening the light went gold', 3); return 'You stay until the last of it has gone, and the first stars come out, and nobody says a word.'; } },
        { t: 'Take a photograph', run(L, tr) { tr.q += 1; return 'It does not come out. It never does. You remember it anyway.'; } },
        { t: 'Ring home', show: (L, tr) => atHome(L, tr).length > 0, run(L, tr) { const ps = atHome(L, tr); for (const p of ps) L.bond(p, 2); tr.q += 1; return `You ring home and talk to ${list(ps.map(nm))}. Everybody is fine, and misses you, a bit.`; } },
      ],
    },

    // ---- the cruise: the captain's table, and a day ashore ----
    {
      id: 'awCaptain', kinds: ['cruise'], w: (L, tr) => (tr.c >= 1 || L.s.age >= 60 ? 2.5 : 0.8),
      icon: '⚓', title: 'The captain’s table',
      text: () => 'You are asked to dine at the captain’s table, between a retired judge and a widow who has been on forty-one cruises and has opinions on all of them.',
      opts: [
        { t: 'Dress up, and be charming', check: ['charm', 40], run(L, tr, c, win) { if (win) { tr.q += 2; L.gain('charm', 1); H.mem(tr, 'dinner at the captain’s table', 3); if (L.friends().length < 20) L.meet({ sex: 'f', age: clamp(L.s.age + 8, 40, 95), bond: 28 }); return 'The judge tells a story about a parrot that brings the house down, and the widow decides you are her new best friend. She writes to you for years.'; } return 'You spill the soup on the judge, who is very good about it, in a judicial sort of way.'; } },
        { t: 'Plead seasickness', run(L) { L.hp(1); return 'You eat a sandwich on your own and watch the sea, which is what you came for.'; } },
      ],
    },
    {
      id: 'awShore', kinds: ['cruise'], w: 2,
      icon: '⛵', title: 'Ashore',
      text: () => 'The ship docks at eight and sails at five sharp, with or without you. There is a whole town to see.',
      opts: [
        { t: 'Wander off the beaten track', odds: () => 0.7, run(L, tr, c, win) { if (win) { tr.q += 2; H.mem(tr, 'the little harbour where nobody else went', 3); return 'A little harbour, a café with three tables, and grilled fish that ruins every other fish for you. You are back with twenty minutes to spare.'; } L.cash(-250); tr.q -= 1; return 'They are pulling up the gangway as you arrive in a borrowed fishing boat. The whole ship cheers.'; } },
        { t: 'The organised excursion', cost: (L, tr) => spend(L, 60 * heads(tr)), run(L, tr) { tr.q += 1; return 'Forty of you behind a woman with an umbrella held high. You see everything, at speed.'; } },
        { t: 'Stay aboard, and have the pool to yourself', run(L, tr) { L.hp(2); tr.q += 1; return 'Everybody else is ashore. You float in the pool with the whole ship humming round you.'; } },
      ],
    },

    // ---- the trip of a lifetime: the thing you went all that way to see ----
    {
      id: 'awWonder', kinds: ['far'], w: 1,
      icon: '✨', title: 'What you came for',
      text: (L, tr) => nth(WONDERS, tr.di || 0),
      opts: [
        { t: 'Stand and look', run(L, tr) { tr.q += 3; L.joy(3); H.mem(tr, `the three weeks in ${short(tr)}`, 6); return 'You stand there until your legs ache, and do not regret a minute or a penny of it.'; } },
        { t: (L, tr) => { const p = ptOn(L, tr) || who(L, tr)[0]; return p ? `Take ${nm(p)}’s hand` : 'Take it all in'; }, show: (L, tr) => tr.who.length > 0, run(L, tr) { tr.q += 3; bondAll(L, tr, 4); H.mem(tr, `${short(tr)}, together`, 6); return 'Neither of you says anything. You do not need to.'; } },
        { t: 'Photograph everything', run(L, tr) { tr.q += 2; H.mem(tr, `the three weeks in ${short(tr)}`, 5); return 'Four hundred photographs. Not one of them is it.'; } },
      ],
    },

    // ---- a season with a rucksack ----
    {
      id: 'awHostel', kinds: ['gap'], w: 2,
      icon: '🛏️', title: 'Fourteen to a room',
      text: () => 'The hostel has fourteen beds to a room and three languages snoring in them. In the kitchen, somebody is making a curry for everybody, out of one onion.',
      opts: [
        { t: 'Muck in, and make friends', run(L, tr) { L.gain('charm', 1.5); tr.q += 1; if (L.friends().length < 20) L.meet({ age: clamp(L.s.age + L.int(-3, 3), 18, 30), bond: 30 }); return 'You end up travelling together for a fortnight, and writing for years.'; } },
        { t: 'Earplugs, and an early start', run(L) { L.hp(1); return 'You are on the first bus out, with the sunrise and a bread roll.'; } },
      ],
    },
    {
      id: 'awGapWork', kinds: ['gap'], w: 2,
      icon: '🍇', title: 'Running low',
      text: () => 'The money is running out faster than the map. A man in a café says they want pickers on a farm up the valley, cash at the end of the week.',
      opts: [
        { t: 'Pick grapes for a week', run(L, tr) { L.cash(400); L.gain('fitness', 1); tr.q += 1; H.mem(tr, 'the week picking grapes', 3); return 'Purple to the elbows, burnt across the shoulders, and paid in cash and wine.'; } },
        { t: 'Ring home for money', show: (L) => L.s.people.some((p) => p.kind === 'parent'), run(L) { const p = L.s.people.find((q) => q.kind === 'parent'); L.bond(p, -2); L.cash(500); return 'There is a long silence on the line, and then the money arrives, with a note.'; } },
        { t: 'Live on bread and oranges', run(L) { L.hp(-2, 'living on bread and oranges'); return 'You get very thin and very wise about oranges.'; } },
      ],
    },

    // ---- the last evening (always last) ----
    {
      id: 'awLast', kinds: '*', w: 0,
      icon: '🌇', title: 'The last evening',
      text: (L, tr) => `The last evening. The cases are half packed, ${tr.k === 'city' ? 'the streets are lighting up' : tr.k === 'walk' ? 'your boots are by the door' : tr.k === 'cruise' ? 'the ship is turning for home' : 'the sun is going down'}, and there is still time for one more thing.`,
      opts: [
        { t: 'Buy a souvenir', cost: (L, tr) => spend(L, SOUV_COST[tr.k] || 10), run(L, tr) {
          const A = L.s.away, [i, name] = L.pick(SOUVENIRS[tr.k] || SOUVENIRS.own);
          A.souv.push({ i, name, at: short(tr), age: L.s.age });
          if (A.souv.length > 12) A.souv.shift();
          tr.souv = name;
          return `${cap(name)}. It will look lovely on the mantelpiece for thirty years.`;
        } },
        { t: 'Write the postcards', run(L, tr) {
          const A = L.s.away, band = tr.q >= 3 ? 3 : tr.q >= 0 ? 2 : tr.q >= -2 ? 1 : 0, line = L.pick(POSTCARDS[band]), ps = atHome(L, tr);
          for (const p of ps) L.bond(p, 2);
          A.fridge.push({ at: short(tr), line, age: L.s.age });
          if (A.fridge.length > 8) A.fridge.shift();
          return `${ps.length ? `Postcards to ${list(ps.map(nm))}, and one` : 'One postcard'} for your own fridge, written at a café table: “${line}”`;
        } },
        { t: (L, tr) => cap((L.awayKind(tr.k) || KINDS.caravan).last), run(L, tr) { tr.q += 1; return 'Worth it. Worth every minute.'; } },
      ],
    },
  ];
}

// ---- the cards that come over the years ----

export function lifeCards(H) {
  const W = (L) => L.s.away;
  const pt = (L) => L.partner();
  const kids = (L) => L.kids().filter((p) => p.age < 18);
  const notAway = (L) => !L.s.gaol && !L.s.dead && !W(L).on;
  // Whether a trip could start from a card now: the usual reasons, and the time left in the season.
  const tripWhy = (L, x) => L.awayWhy(x) || (L.s.time < Math.min(2, L.awayTime(x.k)) ? 'Not enough time left this season.' : null);
  const go = (L, x, o = {}) => H.begin(L, x, { card: true, ...o });
  const own = (L) => W(L).own;
  const ownAt = (o) => `${o.kind === 'villa' ? 'in' : 'at'} ${o.at}`;
  const fix = (L) => Math.round((L.awayOwnWorth() * 0.02 + 200) / 10) * 10;
  // The one partner card about the holiday that should not have happened.
  return [
    // ---- the day a booked trip comes round ----
    {
      id: 'awDepart', icon: '🧳', title: 'Off on holiday', w: 0,
      ok: (L, x) => notAway(L) && !!W(L).book && !!x && W(L).book.id === x.b,
      text(L) { const b = W(L).book, K = L.awayKind(b.k), P = L.awayParty(b.w, b.k); return `The cases are by the door, the taxi is due at six, and the house has been told to behave itself while you are gone: ${K ? K.trip(b.at) : 'away'}, ${P.why ? 'though not everybody who was coming can now' : L.awaySaid(P.ids, b.w)}.`; },
      opts: [
        { t: 'Off we go', show: (L) => !L.awayParty(W(L).book.w, W(L).book.k).why && !!L.awayKind(W(L).book.k),
          cost: (L) => Math.max(0, W(L).book.cost - W(L).book.dep), why: (L) => (L.s.health < 25 ? 'You are not well enough to travel.' : null),
          run(L) { const b = W(L).book; W(L).book = null; return go(L, { k: b.k, w: b.w, c: b.c }, { at: b.at }); } },
        { t: 'Go anyway, on your own', show: (L) => !!L.awayParty(W(L).book.w, W(L).book.k).why && !!L.awayKind(W(L).book.k),
          cost: (L) => { const b = W(L).book; return Math.max(0, L.awayCost({ k: b.k, w: 'solo', c: b.c }) - b.dep); }, why: (L) => (L.s.health < 25 ? 'You are not well enough to travel.' : null),
          run(L) { const b = W(L).book; W(L).book = null; return go(L, { k: b.k, w: 'solo', c: b.c }, { at: b.at }); } },
        { t: 'Cancel, and lose the deposit', run(L) { const b = W(L).book; W(L).book = null; L.joy(-2); for (const id of L.awayParty(b.w, b.k).ids || []) { const p = L.person(id); if (p) L.bond(p, -2); } return `You ring and cancel. The ${money(b.dep)} deposit is not coming back, and nor, for a while, is the mood in the house.`; } },
      ],
    },

    // ---- the honeymoon ----
    {
      id: 'awMoon', icon: '💐', title: 'The honeymoon', w: 0,
      ok: (L, x) => notAway(L) && !!pt(L) && pt(L).kind === 'spouse' && !!x && pt(L).id === x.p && !!W(L).moon,
      text: (L) => `And then there is the honeymoon. ${first(pt(L))} has brochures. You have a figure in your head, and it is smaller than the brochures.`,
      opts: [
        { t: 'A night at the Gull, and a walk along the sands', cost: (L) => spend(L, 180), run(L) {
          const s = L.s, A = W(L), p = pt(L);
          A.moon = null; A.n.moon++;
          L.bond(p, 6); L.joy(4);
          A.hols.push({ k: 'stay', at: 'the Gull', who: `with ${first(p)}`, ids: [p.id], mem: 'the honeymoon night at the Gull', age: s.age, q: 2, t: s.t, hon: 1 });
          L.note(`Honeymoon: a night at the Gull, with ${first(p)}.`, 'big');
          return 'The room at the top of the Gull, with the sloping ceiling and the view of the harbour, and breakfast in bed that the landlord brings up himself, with a wink. You walk the length of the sands and back, and it is enough.';
        } },
        { t: 'A week walking in the hills', cost: (L) => L.awayCost({ k: 'walk', w: 'pair', c: 0 }), why: (L) => tripWhy(L, { k: 'walk', w: 'pair', c: 0 }), run(L) { return go(L, { k: 'walk', w: 'pair', c: 0 }, { hon: true }); } },
        { t: 'A fortnight in the sun', cost: (L) => L.awayCost({ k: 'sun', w: 'pair', c: 0 }), why: (L) => tripWhy(L, { k: 'sun', w: 'pair', c: 0 }), run(L) { return go(L, { k: 'sun', w: 'pair', c: 0 }, { hon: true }); } },
        { t: 'The other side of the world', show: (L) => L.s.cash + L.s.bank >= 2 * L.awayCost({ k: 'far', w: 'pair', c: 0 }), cost: (L) => L.awayCost({ k: 'far', w: 'pair', c: 0 }), why: (L) => tripWhy(L, { k: 'far', w: 'pair', c: 0 }), run(L) { return go(L, { k: 'far', w: 'pair', c: 0 }, { hon: true }); } },
        { t: 'Later, when there is time and money', run() { return 'You put a jar on the mantelpiece marked HONEYMOON. The next time the two of you go anywhere, that is what it will be.'; } },
      ],
    },

    // ---- a romance that follows you home ----
    {
      id: 'awRomanceHome', icon: '✉️', w: 0,
      ok: (L) => notAway(L) && !!W(L).rom && !pt(L),
      title: (L) => (W(L).rom.t % 2 ? 'Somebody at the station' : 'A letter with a foreign stamp'),
      text(L) {
        const r = W(L).rom, p = pr(r.sex);
        return r.t % 2 ? `${r.name}, from the holiday in ${r.at}, is at the station with a rucksack and a hopeful face, having come all the way from ${r.from} on the strength of a fortnight and a postcard.` : `${r.name}, from the holiday in ${r.at}, has written: four pages, both sides. ${p.He} has been thinking about you, and ${p.he} could come over, if you wanted ${p.him} to.`;
      },
      opts: [
        { t: (L) => `Ask ${pr(W(L).rom.sex).him} to stay`, show: (L) => L.fancy({ sex: W(L).rom.sex }), run(L) {
          const s = L.s, r = W(L).rom; W(L).rom = null;
          const p = L.makePerson({ name: s.people.some((q) => q.name === r.name) ? L.freshName(r.sex) : r.name, sex: r.sex, age: r.age, bond: 34, single: true });
          s.people.push(p);
          return L.startSeeing(p, `${first(p)} stays a week, and then a month, and then rents a room over the bakery and finds a job. It turns out the holiday was not a holiday thing after all.`);
        } },
        { t: 'Write back, as a friend', run(L) { const s = L.s, r = W(L).rom; W(L).rom = null; if (!s.people.some((q) => q.name === r.name) && L.friends().length < 20) s.people.push(L.makePerson({ name: r.name, sex: r.sex, age: r.age, bond: 28, single: true })); return 'You write every month for a year, and then every Christmas, with photographs.'; } },
        { t: 'It was a holiday thing', run(L) { W(L).rom = null; L.joy(-1); return 'You keep the letter in a drawer, which is where holiday things go.'; } },
      ],
    },

    // ---- and one that should not have ----
    {
      id: 'awFound', icon: '📷', title: 'A photograph', w: 0,
      ok: (L, x) => notAway(L) && !!W(L).secret && !!pt(L) && !!x && pt(L).id === x.p,
      text: (L) => { const p = pt(L); return `${first(p)} has found a photograph from ${W(L).secret.at} in your jacket: you and somebody ${he(p)} has never met, looking a great deal closer than a photograph should.`; },
      opts: [
        { t: 'Tell the truth', check: ['charm', 50], run(L, x, win) { const p = pt(L); W(L).secret = null; if (win) { L.bond(p, -10); return `It is a terrible evening, and then a long, quiet week. But it is told, and ${he(p)} stays.`; } L.bond(p, -22); return `You tell ${him(p)} all of it. ${He(p)} listens to all of it, and then goes to stay with ${his(p)} sister.`; } },
        { t: 'Say it was nothing', odds: () => 0.5, run(L, x, win) { const p = pt(L); W(L).secret = null; L.karma(-1); if (win) { L.bond(p, -3); return `${He(p)} wants to believe you, and so ${he(p)} does.`; } L.bond(p, -28); L.karma(-1); return `${He(p)} has already rung the hotel.`; } },
        { t: 'Say nothing at all', run(L) { const p = pt(L); W(L).secret = null; L.bond(p, -15); return 'The photograph is on the kitchen table for a week. Then it is not, and neither of you mentions it again, which is not the same as it being forgotten.'; } },
      ],
    },

    // ---- the cruise brochures, after retiring ----
    {
      id: 'awBrochure', icon: '🛳️', title: 'The brochures', w: 0,
      ok: (L) => notAway(L) && !W(L).book,
      text: (L) => `Since you retired, brochures for cruises have started arriving, as if the post office knows.${pt(L) ? ` ${first(pt(L))} has turned down the corner of a page.` : ' One of them has a page turned down at the corner, and you do not remember doing it.'}`,
      opts: [
        ...['pair', 'solo'].map((w) => {
          const x = (L) => ({ k: 'cruise', w, c: 0, at: ((1 - L.season + 4) % 4) || 1 });
          return {
            t: (L) => `Book a cruise for the ${SEASONS[(L.s.t + x(L).at) % 4].toLowerCase()}${w === 'pair' ? ', for two' : ', for yourself'}`,
            show: (L) => (w === 'pair' ? !!pt(L) : !pt(L)),
            cost: (L) => H.deposit(L, x(L)),
            why: (L) => L.awayWhy(x(L), { when: x(L).at, book: true }),
            run(L) { return H.book(L, x(L)); },
          };
        }),
        { t: 'Not yet: there is plenty of time', run() { return 'You keep the brochures, though. You read them in the bath.'; } },
        { t: 'You get seasick in the bath', run(L) { L.joy(1); return 'The brochures go under the short leg of the kitchen table, where they do a great deal of good.'; } },
      ],
    },

    // ---- the family caravan, every summer ----
    {
      id: 'awTradCall', icon: '🚐', title: 'The caravan', w: 0,
      ok: (L) => notAway(L) && W(L).trad.on && kids(L).length > 0 && W(L).last !== L.s.t,
      text(L) {
        const ks = kids(L), A = W(L), n = A.trad.n;
        return `The first week of the summer holidays. The buckets and spades are by the door, ${ks.length > 2 ? 'the children have' : `${list(ks.map(first))} ${ks.length > 1 ? 'have' : 'has'}`} been packed since Tuesday, and ${L.awayPark()} is expecting you, as it has every summer for ${n === 1 ? 'a year' : `${n} years`}.`;
      },
      opts: [
        { t: 'Same as ever', cost: (L) => L.awayCost({ k: 'caravan', w: 'family', c: 0 }), why: (L) => tripWhy(L, { k: 'caravan', w: 'family', c: 0 }), run(L) { return go(L, { k: 'caravan', w: 'family', c: 0 }, { trad: true }); } },
        { t: 'The good van this year, by the dunes', show: (L) => L.s.cash + L.s.bank >= 3 * L.awayCost({ k: 'caravan', w: 'family', c: 1 }), cost: (L) => L.awayCost({ k: 'caravan', w: 'family', c: 1 }), why: (L) => tripWhy(L, { k: 'caravan', w: 'family', c: 1 }), run(L) { return go(L, { k: 'caravan', w: 'family', c: 1 }, { trad: true }); } },
        { t: 'Not this year', run(L) { for (const p of kids(L)) L.bond(p, -3); L.joy(-1); return 'There are tears. Some of them are yours.'; } },
      ],
    },
    // ... and the grandchildren, brought back to the same sands.
    {
      id: 'awTradBack', icon: '🪣', title: 'Back to the sands', w: 0,
      ok: (L, x) => notAway(L) && !!x && !!L.person(x.c) && L.grandkids().some((g) => g.of === x.c),
      text(L, x) {
        const c = L.person(x.c), gs = L.grandkids().filter((g) => g.of === c.id);
        return `${first(c)} rings. ${He(c)} is taking ${gs.length > 2 ? 'the children' : list(gs.map(first))} to ${L.awayPark()} this summer, to the same caravan, or near enough, where ${he(c)} went every summer as a child. ${He(c)} wondered if you would come.`;
      },
      opts: [
        { t: 'Come, and pay for it all', cost: (L, x) => backCost(L, x), why: (L) => tripWhy(L, { k: 'caravan', w: 'solo', c: 0 }), run(L, x) { const c = L.person(x.c), ids = [c.id, ...L.grandkids().filter((g) => g.of === c.id).map((g) => g.id)]; return go(L, { k: 'caravan', w: 'back', c: 0 }, { ids, gr: true }); } },
        { t: 'Come for the weekend, and pay for the ice creams', cost: (L) => spend(L, 60), run(L, x) {
          const s = L.s, A = W(L), c = L.person(x.c), gs = L.grandkids().filter((g) => g.of === c.id);
          s.time = Math.max(0, s.time - 1);
          L.bond(c, 4); for (const g of gs) L.bond(g, 5); L.joy(5);
          A.n.back++;
          A.hols.push({ k: 'caravan', at: L.awayPark(), who: `with ${first(c)} and the grandchildren`, ids: [c.id, ...gs.map((g) => g.id)], mem: `back at ${L.awayPark()} with the grandchildren`, age: s.age, q: 3, t: s.t, gr: 1 });
          L.note(`Went back to ${L.awayPark()} with ${first(c)} and the grandchildren, where ${first(c)} went every summer as a child.`, 'big');
          return `The same sands, the same café, a caravan two along from the old one. ${first(c)} shows ${gs.length > 1 ? 'the children' : first(gs[0])} the rock pool where ${he(c)} caught a crab the size of a dinner plate, which has got bigger every year since.`;
        } },
        { t: 'Not this time', run(L, x) { L.bond(L.person(x.c), -2); return 'You send a bucket and spade in the post instead, which is not the same, and everybody knows it.'; } },
      ],
    },

    // ---- a summer at your own place ----
    {
      id: 'awOwnSummer', icon: '☀️', w: 0,
      ok: (L) => notAway(L) && !!own(L) && !own(L).let && W(L).last !== L.s.t,
      title: (L) => `A summer at the ${OWN[own(L).kind].name}`,
      text: (L) => { const o = own(L); return `Summer, and ${o.at} is waiting: ${o.kind === 'static' ? 'the caravan door that sticks, the gas fire, and the veranda with a view of the sea if you lean' : o.kind === 'cottage' ? 'the stable door, the key under the pot, and the garden gone wild' : 'the shutters, the fig tree, and Tomás with the pool cover off already'}.`; },
      opts: [
        { t: (L) => (kids(L).length ? 'Everybody in the car' : pt(L) ? 'The two of you' : 'Off you go'), cost: (L) => L.awayCost(ownX(L)), why: (L) => tripWhy(L, ownX(L)), run(L) { return go(L, ownX(L)); } },
        { t: 'Let it for the summer instead', run(L) { const o = own(L), n = Math.round(OWN[o.kind].let * LET_SHARE[1] * (0.6 + 0.4 * o.cond / 100) * Math.sqrt(L.s.idx) / 10) * 10; L.cash(n); o.cond = clamp(o.cond - 3, 0, 100); return `The agent finds a family from the city within the hour. They pay ${money(n)}, and send a card at the end saying it was the best summer they ever had.`; } },
        { t: 'Not this year', run() { return 'It sits there all summer with the curtains drawn, waiting.'; } },
      ],
    },

    // ---- a place away wants looking after ----
    {
      id: 'awOwnStorm', icon: '🌪️', title: 'Storm damage', w: 0, ok: (L) => notAway(L) && !!own(L),
      text(L) { const o = own(L); return o.kind === 'static' ? `The warden at ${o.at} rings: last night’s storm had the awning off your caravan and put it on somebody else’s.` : o.kind === 'cottage' ? `A storm along the coast has had slates off the cottage roof at ${o.at}, and the rain has found its way into the back bedroom.` : `The winter storms have been bad in ${o.at} this year. Tomás sends a photograph of the pool, full of a neighbour’s palm tree.`; },
      opts: [
        { t: 'Have it put right properly', cost: fix, run(L) { const o = own(L); o.cond = clamp(o.cond + 15, 0, 100); return 'A man comes, and then another man, and then a bill. It is as good as new.'; } },
        { t: 'Go and patch it up yourself', show: (L) => own(L).kind !== 'villa', check: ['craft', 45], run(L, x, win) { const o = own(L); L.s.time = Math.max(0, L.s.time - 1); o.seen = L.s.t; if (win) { o.cond = clamp(o.cond + 8, 0, 100); L.joy(2); return 'A day up a ladder with a borrowed toolbox. It holds, and you are very pleased with it.'; } o.cond = clamp(o.cond - 10, 0, 100); return 'You make it worse, and then better, and then worse again. You drive home in the dark.'; } },
        { t: 'Leave it till spring', run(L) { const o = own(L); o.cond = clamp(o.cond - 15, 0, 100); return 'It will keep. It does not keep very well.'; } },
      ],
    },
    {
      id: 'awOwnLeak', icon: '💧', title: 'A leak', w: 0, ok: (L) => notAway(L) && !!own(L),
      text(L) { const o = own(L); return o.kind === 'static' ? `A pipe under your caravan at ${o.at} split in the frost. The warden has turned the water off, and has views about lagging.` : o.kind === 'cottage' ? `The cottage at ${o.at} has a leak, somewhere between the bathroom and the kitchen ceiling, which has a brown stain on it now the shape of a sheep.` : `The pool at the villa is losing water, and nobody can say where it is going. Tomás has theories.`; },
      opts: [
        { t: 'Get somebody in', cost: fix, run(L) { const o = own(L); o.cond = clamp(o.cond + 10, 0, 100); return 'Found, and fixed, and paid for. The sheep remains, faintly.'; } },
        { t: 'Fix it yourself', show: (L) => own(L).kind !== 'villa', check: ['craft', 50], run(L, x, win) { const o = own(L); L.s.time = Math.max(0, L.s.time - 1); o.seen = L.s.t; if (win) { o.cond = clamp(o.cond + 6, 0, 100); return 'A new washer, a lot of swearing, and a dry floor.'; } o.cond = clamp(o.cond - 8, 0, 100); return 'The leak moves somewhere else, which is progress of a kind.'; } },
        { t: 'Ignore it', run(L) { const o = own(L); o.cond = clamp(o.cond - 12, 0, 100); return 'Out of sight, out of mind, and into the floorboards.'; } },
      ],
    },
    {
      id: 'awOwnSquat', icon: '🚪', title: 'Somebody is living in it', w: 0, ok: (L) => notAway(L) && !!own(L) && own(L).kind !== 'static',
      text(L) { const o = own(L); return o.kind === 'cottage' ? `A neighbour at ${o.at} writes: there are people living in your cottage. They have put curtains up, and there is a goat.` : 'Tomás writes that a family has moved into the villa, that they seem very nice, and that the law over there takes its time.'; },
      opts: [
        { t: 'Solicitors, and the courts', cost: 2500, run(L) { const o = own(L); o.cond = clamp(o.cond - 10, 0, 100); return 'It takes a season and a great deal of paper. They leave it tidier than you expected, and take the kettle.'; } },
        { t: 'Go and talk to them', check: ['charm', 50], run(L, x, win) { const o = own(L); L.s.time = Math.max(0, L.s.time - 1); o.seen = L.s.t; if (win) { o.cond = clamp(o.cond - 3, 0, 100); L.karma(1); return 'A cup of tea, a long talk, and the name of somebody at the council who can help them. They are gone by the weekend.'; } o.cond = clamp(o.cond - 15, 0, 100); L.cash(-1500); return 'They are not interested in talking. It takes the courts in the end, and costs twice as much.'; } },
        { t: 'Let them stay till spring, and keep an eye on it', run(L) { const o = own(L); o.cond = clamp(o.cond - 6, 0, 100); L.karma(3); return 'They leave in March, with a thank-you note and the fridge full.'; } },
      ],
    },
    {
      id: 'awOwnGuests', icon: '🎉', title: 'The guests from last week', w: 0, ok: (L) => notAway(L) && !!own(L) && own(L).let,
      text: (L) => `The agent rings about last week’s guests ${ownAt(own(L))}: a party of twelve, in a place that sleeps four. There is a hole in a door, and something in the ${own(L).kind === 'villa' ? 'pool' : 'bath'}.`,
      opts: [
        { t: 'Keep their deposit and say no more', run(L) { const o = own(L); L.cash(300); o.cond = clamp(o.cond - 10, 0, 100); return 'The deposit covers the door, more or less. Nobody asks about the bath.'; } },
        { t: 'Have the agent bill them for every bit of it', check: ['smarts', 40], run(L, x, win) { const o = own(L); if (win) { L.cash(1200); o.cond = clamp(o.cond - 3, 0, 100); return 'A letter with every item listed, and photographs. They pay in full, by return, with an apology.'; } L.cash(-600); o.cond = clamp(o.cond - 10, 0, 100); return 'They dispute every word, and the agent charges you for the letters.'; } },
        { t: 'Laugh: it needed a new carpet anyway', run(L) { const o = own(L); o.cond = clamp(o.cond - 14, 0, 100); L.joy(1); return 'It did. It still does.'; } },
      ],
    },
  ];

  // Going to your own place: who would go.
  function ownX(L) { return { k: 'own', w: kids(L).length ? 'family' : pt(L) ? 'pair' : 'solo', c: 0 }; }
  // The grandchildren's trip back to the sands, on you.
  function backCost(L, x) {
    const c = L.person(x.c);
    if (!c) return 0;
    const gs = L.grandkids().filter((g) => g.of === c.id), ids = [c.id, ...gs.map((g) => g.id)];
    const pay = 2 + gs.reduce((a, g) => a + (g.age < 3 ? 0 : g.age < 18 ? 0.5 : 1), 0);
    return L.awayCost({ k: 'caravan', ids, pay, c: 0 });
  }
}
