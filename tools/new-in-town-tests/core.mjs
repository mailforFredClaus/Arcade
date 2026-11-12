// Things a playtest found in the older parts of the game, and their fixes: the slots' jackpot, a
// pension drawn while back at work, an overdraft that never cleared, moods that sat near the top,
// a share market with no brakes, habits with no consequences, and "a 8-year-old".
import { STOCKS, an } from '../../games/new-in-town/js/data.js';

export default function ({ check, fresh, Life }) {
  // The jackpot is three diamonds and nothing else.
  {
    let fakes = 0, real = 0;
    for (let seed = 1; seed < 400; seed++) {
      const L = fresh({ seed }); L.s.cash = 1e6;
      for (let i = 0; i < 40; i++) {
        L.s.f.jackpot = 0;
        L.act('slots', 50);
        const r = L.out.reels;
        if (L.s.f.jackpot && !(r[0] === r[1] && r[1] === r[2])) fakes++;
        if (L.s.f.jackpot) real++;
      }
    }
    check(fakes === 0, `a diamond and two cherries is not the jackpot (${fakes} false jackpots)`);
  }

  // A job's pension is not paid while you are back at work.
  {
    const L = fresh();
    L.s.age = 66; L.s.job = { c: 'medicine', r: 4, n: 0, perf: 60, raise: 0 };
    L.act('retire');
    const p = L.income().find(([w]) => w === 'Pension');
    check(p && p[1] > 0, 'a pension once retired');
    L.s.job = { c: 'medicine', r: 4, n: 0, perf: 60, raise: 0 };
    check(!L.income().some(([w]) => w === 'Pension'), 'but not while back at work');
    L.s.age = 67; L.s.pension += 1500;
    check((L.income().find(([w]) => w === 'Pension') || [0, 0])[1] === 1500, 'though the state pension is still paid');
    const big = L.s.log.filter((e) => e.k === 'big' && e.t.startsWith('Retired')).length;
    L.act('retire');
    check(L.s.log.filter((e) => e.k === 'big' && e.t.startsWith('Retired')).length === big, 'and retiring a second time is not a new milestone');
  }

  // An overdraft run up paying the bills clears itself once there is money; a loan you took does not.
  {
    const L = fresh();
    L.s.cash = 0; L.s.bank = 0;
    L.endSeason();
    const od = L.s.debt;
    check(od > 0 && L.s.f.od === od, 'short at the end of a season: on the overdraft');
    L.s.cash = od + 5000;
    L.endSeason();
    check(L.s.debt === 0 && !L.s.f.od, `with money spare the overdraft is paid off (${L.s.debt} left)`);
    L.s.cash = 3000;
    L.act('borrow', 1000);
    L.s.cash += 20000;
    L.endSeason();
    check(L.s.debt === 1000, 'a loan you chose to take is yours to pay off');
  }

  // A good thing lifts you less the happier you already are.
  {
    const L = fresh();
    L.s.happy = 40; L.joy(10); const low = L.s.happy - 40;
    L.s.happy = 90; L.joy(10); const high = L.s.happy - 90;
    L.s.happy = 90; L.joy(-10);
    check(low === 10 && high > 0 && high < 4 && L.s.happy === 80, 'a lift counts for less near the top, and a blow for just as much');
  }

  // Shares: prices are pulled back towards what a company is worth, and a company can go bust.
  {
    let busts = 0, biggest = 0;
    for (let i = 0; i < 120; i++) {
      const L = fresh({ seed: 300 + i });
      L.s.stk.own.MOON = 100;
      for (let t = 0; t < 240; t++) {
        L.moveMarkets();
        if (L.s.stk.news[0] && /administration/.test(L.s.stk.news[0].text)) busts++;
      }
      biggest = Math.max(biggest, L.s.stk.p.MOON / STOCKS.MOON.start);
      check(Object.values(L.s.stk.p).every((p) => p >= 0.5 && Number.isFinite(p)), 'share prices stay real numbers');
    }
    check(busts > 0, `over sixty years a company now and then goes bust (${busts} in 120 lives)`);
    check(biggest < 3000, `the wildest share does not run away for ever (best x${Math.round(biggest)} in sixty years)`);
    const L = fresh(); L.s.stk.own.SNCK = 10; L.s.stk.paid.SNCK = 250; L.s.stk.f = { ...L.s.stk.p, SNCK: 1 };
    L.moveMarkets();
    check(!L.s.stk.own.SNCK && L.s.stk.p.SNCK === STOCKS.SNCK.start, 'a company that sinks far enough goes bust, and your shares with it');
    const old = fresh(); delete old.s.stk.f; old.moveMarkets();
    check(old.s.stk.f && Object.keys(old.s.stk.f).length === Object.keys(STOCKS).length, 'a life saved before this starts from its prices');
  }

  // Years of heavy drinking bring on an illness the hospital can treat.
  {
    let ill = 0;
    for (let i = 0; i < 40; i++) {
      const L = fresh({ seed: 700 + i });
      L.s.habit.drink = 95; L.s.cash = 1e6;
      for (let t = 0; t < 80 && !L.s.ill && !L.s.dead; t++) { L.s.use = { drink: 1 }; L.s.health = 80; L.viceSeason(); }
      if (L.s.ill && L.s.ill.name === 'liver disease') ill++;
    }
    check(ill >= 30, `twenty years of heavy drinking catch up with nearly everybody (${ill} of 40)`);
  }

  // A and an, with numbers.
  check(an('8-year-old car') === 'an 8-year-old car' && an('11-year-old') === 'an 11-year-old' && an('12-year-old') === 'a 12-year-old' && an('egg') === 'an egg', 'an 8-year-old, an 11-year-old, a 12-year-old');
}
