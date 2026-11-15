// A living off the land, for a life with no career: a cheap room with a
// kitchen at Mrs Pargeter's, a few hens in the corner of Tom Windle's yard,
// jam and baking in Tom's farmhouse kitchen or the church hall, holly
// wreaths to sell in winter; and a practice life that works the farm, the
// allotment and a Saturday stall, and makes a modest living of it.
import { HOMES, CROPS } from '../../games/new-in-town/js/data.js';
import { BEASTS, GOODS, ROOM, PADDOCK, grazeFee } from '../../games/new-in-town/js/market.js';

export default function ({ check, fresh, Life }) {
  const turn = (L) => { L.endSeason(); L.s.pend = []; L.s.wx = 'fair'; L.s.time = 20; };

  // ---- a room at Mrs Pargeter's ----
  {
    const r = HOMES.room;
    check(r && r.rent > HOMES.hostel.rent && r.rent < HOMES.bedsit.rent && r.price == null && r.kids === 0, 'a room at Mrs Pargeter’s is dearer than a bunk and cheaper than the bedsit');
    const L = fresh(), s = L.s;
    s.cash = 5000;
    check(L.act('rentHome', 'room').ok && s.home === 'room' && L.bills().find(([w]) => w === 'Rent')[1] === L.rentOf('room'), 'anybody can take it');
    check(!L.can('cook') && !L.can('mktJam'), 'it has the use of a kitchen');
    check(L.mktRoom('hens') === ROOM.room.hens && L.mktRoom('bees') === 0, 'and a corner of the garden for a few hens');
    const P = fresh();
    P.s.cash = 5000;
    P.meet({ sex: 'f', kind: 'partner', bond: 80 }).live = true;
    check(P.can('rentHome', 'room').includes('Pargeter'), 'but not for two');
  }

  // ---- hens in the corner of Tom's yard ----
  {
    const L = fresh(), s = L.s;
    s.cash = 5000; s.mkt.farm = BEASTS.hens.skill - 1;
    check(!!L.can('beastBuy', 'hens'), 'Tom sells hens to nobody who has not learned');
    s.mkt.farm = BEASTS.hens.skill;
    check(!L.can('beastBuy', 'hens') && L.mktWhere('hens') === 'farm' && !!L.can('beastBuy', 'goat'), 'then a hostel bunk is no bar to hens: they live at Tom’s (a goat still waits for Farming 40)');
    L.act('beastBuy', 'hens'); L.act('beastBuy', 'hens');
    const h = s.mkt.herd.hens;
    check(h.where === 'farm' && h.n === PADDOCK.hens && !!L.can('beastBuy', 'hens'), `six of them, and no more (${h.n})`);
    check(L.bills().some(([w, n]) => w.includes('Grazing') && n === PADDOCK.hens * grazeFee('hens')) && grazeFee('hens') < grazeFee('goat'), 'for a little towards their corn, far less than a goat’s grazing');
    h.care = 0; s.t = 0;
    turn(L);
    check(s.mkt.herd.hens && s.mkt.herd.hens.care >= 40 && s.mkt.ready.eggs && s.mkt.ready.eggs.n > 10, 'Tom keeps an eye on them, and they lay');
    check(L.act('beastCollect').ok && s.mkt.stock.eggs.n > 10, 'and the eggs are yours to collect');
    // Moving somewhere with a garden: they can come home.
    s.home = 'cottage';
    check(L.mktRoom('hens') === 6 && s.mkt.herd.hens.where === 'farm', 'a garden does not fetch them home by itself');
  }

  // ---- other people's kitchens ----
  {
    const L = fresh(), s = L.s;
    s.cash = 5000; s.t = 0;
    check(L.can('mktJam') === 'The hostel kitchen is a kettle.', 'no jam in the hostel kitchen');
    check(L.can('mktJamFarm').includes('Do a day on the farm first') && !L.can('mktJamHall'), 'Tom’s kitchen is for the people who work for him; the church hall is for anybody');
    s.mkt.days = 1;
    const c0 = s.cash;
    check(L.act('mktJamFarm').ok && s.cash === c0 - 90 - 20 && s.mkt.stock.jam.n >= 18, 'a batch of jam in Tom’s farmhouse kitchen, with something for the gas');
    const c1 = s.cash;
    check(L.act('mktJamHall').ok && s.cash === c1 - 90 - 15, 'and another in the church hall, with something for the roof');
    check(L.can('mktJamFarm') === 'Twice a season is plenty of jam.' && L.can('mktJamHall') === 'Twice a season is plenty of jam.', 'twice a season, wherever it is made');
    s.home = 'bedsit';
    check(L.can('mktJam') === 'Twice a season is plenty of jam.', 'even with a kitchen of your own');
    s.mkt.stock.eggs = { n: 4, q: 0.7 };
    const c2 = s.cash;
    check(L.act('mktBakeHall').ok && s.cash === c2 - 45 - 15 && s.mkt.stock.cake.n >= 12 && s.mkt.stock.eggs.n === 2, 'baking in the church hall, with your own eggs');
    check(L.act('mktBake').ok && !L.act('mktBakeFarm').ok, 'and baking is twice a season too');
    turn(L);
    check(!L.can('mktJam') && !L.can('mktBakeFarm'), 'until the next season');
  }

  // ---- holly wreaths in winter ----
  {
    const L = fresh(), s = L.s;
    s.cash = 5000; s.mkt.days = 1; s.st.craft = 50;
    s.t = 1;
    check(!L.placeActions('farm').some((a) => a.id === 'mktWreath'), 'no holly wreaths in summer');
    s.t = 3;
    check(L.act('mktWreath').ok && s.mkt.stock.wreath.n === 13 && !L.act('mktWreath').ok, 'in winter, a morning in Tom’s barn makes a dozen wreaths, once a season');
    L.act('mktJoin', 0);
    L.s.mkt.stall.rep = 60;
    const c0 = s.cash, r = L.act('mktTrade', 0.7);
    check(r.ok && s.cash - c0 > 200 && !(s.mkt.stock.wreath && s.mkt.stock.wreath.n >= 13), `and they sell on the square in winter (${s.cash - c0} after Priya’s fee)`);
    check(GOODS.wreath.fresh && GOODS.wreath.dem[3] > GOODS.wreath.dem[1] * 5, 'and are no use come the spring');
  }

  // ---- a life saved before any of this ----
  {
    const L = fresh();
    L.s.mkt.herd.hens = { n: 3, care: 60, where: 'home', age: 2, fat: 0, since: 0 };
    L.s.home = 'cottage';
    const R = new Life(JSON.parse(JSON.stringify(L.s)));
    R.s.home = 'hostel'; R.s.time = 6;
    R.act('rest');
    check(R.s.mkt.herd.hens && R.s.mkt.herd.hens.where === (R.s.mkt.farm >= BEASTS.hens.skill ? 'farm' : 'home') || !R.s.mkt.herd.hens, 'an old life’s hens find a home, or go back to Tom');
  }

  // ---- a restless life that works at it ----
  // No career: two days a season on Tom's farm, an allotment, a Saturday stall with what it makes,
  // hens as soon as Tom will sell them, a room with a kitchen once there is a little put by.
  {
    const answer = (L) => { let e, n = 0; while ((e = L.event()) && n++ < 50) { const open = e.opts.map((o, i) => ({ o, i })).filter(({ o }) => !o.why); const cheap = open.filter(({ o }) => o.cost <= Math.max(300, (L.s.cash + L.s.bank) * 0.1)); L.choose((cheap.length ? cheap : open).sort((a, b) => (b.o.chance ?? 0.75) - (a.o.chance ?? 0.75))[0].i); } };
    const live = (seed) => {
      const L = Life.create({ seed, name: 'Fen', bg: 'maker' }), s = L.s, m = s.mkt;
      let over = 0, n = 0, at40 = null;
      const go = (id, x) => { const r = L.act(id, x); if (r.ok) answer(L); return r.ok; };
      while (!s.dead && s.age < 41) {
        answer(L);
        if (s.age === 40 && at40 == null) at40 = L.netWorth();
        if (s.gaol || s.dead) { L.endSeason(); continue; }
        n++;
        if (s.ill && !L.can('treat')) go('treat');
        if (!s.items.bike && s.cash > 1200) go('buy', 'bike');
        if (s.debt > 0 && s.cash > 1500) go('repay', Math.min(s.debt, s.cash - 1000));
        if (s.home === 'hostel' && s.cash + s.bank > 3000) go('rentHome', 'room');
        if (!s.plot && s.cash + s.bank > 300) go('plotRent');
        if (!m.stall && s.cash + s.bank > 600 && Object.keys(m.stock).length) go('mktJoin', 0);
        go('beastBuy', 'hens');
        let farm = 0, made = 0, sold = 0;
        for (let i = 0; i < 14 && s.time > 0 && !s.dead; i++) {
          if (s.health < 40) { if (!go('rest')) break; continue; }
          if (s.happy < 30) { if (!go('bench')) break; continue; }
          if (L.mktHasReady() && go('beastCollect')) continue;
          if (m.herd.hens && m.herd.hens.care < 60 && go('beastCare')) continue;
          if (s.plot && s.plot.beds.some((b) => L.bedRipe(b)) && go('reap')) continue;
          const free = s.plot ? s.plot.beds.findIndex((b) => !b) : -1;
          if (free >= 0) { const c = Object.keys(CROPS).filter((k) => !CROPS[k].show && CROPS[k].sow.includes(L.season)).sort((a, b) => CROPS[b].pay - CROPS[a].pay)[0]; if (c && go('sow', { b: free, c })) continue; }
          if (farm < 2 && s.time >= 2 && go('windleWork', 0.6)) { farm++; continue; }
          if (!made && ['mktBake', 'mktBakeFarm', 'mktWreath', 'mktJam', 'mktJamFarm'].some((id) => (id.startsWith('mktBake') && !m.stall ? false : go(id)))) { made++; continue; }
          if (m.stall && !sold && s.time >= 2 && L.mktOnStall().length && go('mktTrade', 0.6)) { sold++; continue; }
          if (s.plot && s.plot.beds.some(Boolean) && go('tend')) continue;
          if (['odd0', 'odd1', 'odd2'].some((id) => go(id))) continue;
          if (s.time >= 2 && go('crates')) continue;
          if (!go('rest')) break;
        }
        if (s.cash > 3000) L.act('deposit', s.cash - 2000);
        if (s.debt > 0) over++;
        L.endSeason();
      }
      return { worth: at40 ?? L.netWorth(), over: over / Math.max(1, n), L };
    };
    const lives = [31, 32, 33, 34, 35].map(live), worth = lives.map((r) => r.worth).sort((a, b) => a - b);
    const over = lives.reduce((a, r) => a + r.over, 0) / lives.length;
    check(worth[2] >= 25000 && over <= 0.1, `a restless life that works at it makes a modest, secure living: worth ${worth.map((w) => `$${Math.round(w / 1000)}k`).join(', ')} at forty, overdrawn ${Math.round(over * 100)}% of seasons`);
    check(lives.some((r) => r.L.s.mkt.herd.hens || r.L.s.log.some((e) => e.t.includes('hens'))), 'and keeps hens long before it has a garden');
  }
}
