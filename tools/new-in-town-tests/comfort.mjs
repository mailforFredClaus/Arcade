// Money for the comfortable: what the town asks of somebody of means (care,
// presents, a night out, a wedding, a university), what a person of means is
// used to and what its lack does to the mood, and a yacht at the harbour.
import { CARE, price } from '../../games/new-in-town/js/wants-lib.js';
import { YACHT, homeFor } from '../../games/new-in-town/js/comfort.js';
import { HOMES, TROPHIES } from '../../games/new-in-town/js/data.js';

export default function ({ check, fresh, Life }) {
  // A life of a given fortune, in the bank, with the town's sense of its means brought up to date.
  const rich = (bank, o = {}) => { const L = fresh(o); L.s.bank = bank; L.s.mid.means = L.midCalcMeans(); L.s.time = 8; return L; };
  const P = rich(0), R = rich(1600000), V = rich(12000000);

  // ---- what the town asks of you ----
  {
    check(P.midSpend() === 1 && P.midPrice(1000) === 1000, 'ordinary means pay ordinary prices');
    check(R.midSpend() > R.midMeans() * 1.4 && V.midSpend() === 10, `the comfortable spend more than their means alone would say, up to ten times (${R.midSpend().toFixed(2)} at $1.6M)`);
    check(price(R, 300) >= 1400 && price(P, 300) <= 300, `a night out to make more of an effort is ${price(R, 300)} to somebody with $1.6M`);
    // Care for a parent: the agency with the good carers, the room with the view.
    const care = (L) => { const m = L.s.people.find((p) => p.kind === 'parent'); L.s.wants.p[m.id] = { been: [], care: 'carer' }; return L.bills().find(([w]) => w.includes(m.name.split(' ')[0]) || w.toLowerCase().includes('carer')); };
    const pc = care(rich(0)), rc = care(rich(1600000));
    check(pc && rc && rc[1] >= pc[1] * 3 && pc[1] <= CARE.carer.cost * 1.5, `a carer costs ${pc && pc[1]} a season for most people, ${rc && rc[1]} for the comfortable`);
    check(R.look('gift', R.s.people[0].id).cost >= 300 && P.look('gift', P.s.people[0].id).cost === 80, 'a present from somebody comfortable is expected to look it');
    // A child's place at university in the city.
    const kid = (L) => { const k = L.meet({ kind: 'child', sex: 'f', age: 18, bond: 60 }); L.queue('kid18', k.id); return L.event().opts[0].cost; };
    check(kid(rich(0)) === 20000 && kid(rich(1600000)) >= 60000 && kid(rich(12000000)) === 80000, 'and the university a family of means chooses costs what it can afford, up to four times as much');
  }

  // ---- living well ----
  {
    check(P.comfyWants().length === 0 && P.comfyGap() === 0 && P.comfyCap() === 100, 'ordinary means: nothing to live up to');
    const L = rich(2000000), s = L.s;
    s.home = 'flat';
    const w = L.comfyWants();
    check(w.length === 4 && w.every((x) => !x.ok) && L.comfyGap() === L.comfyWeight() && L.comfyWeight() >= 5, `a fortune, a flat and nothing done with it: everything missing (${L.comfyGap()})`);
    const base = L.moodBase();
    s.happy = 70;
    for (let i = 0; i < 6; i++) { s.time = 2; L.act('rest'); }
    check(s.happy <= L.comfyCap() && L.comfyCap() <= 90, `and no amount of putting your feet up gets you past ${L.comfyCap()}`);
    // A home to match: the townhouse, at these means.
    check(homeFor(L.midMeans()) === 4 && homeFor(rich(4000000).midMeans()) === 5 && w[0].text.includes(HOMES.townhouse.name.slice(1)), 'a home to match is the townhouse, at two million (and the villa at four)');
    s.home = 'townhouse';
    check(L.comfyWants()[0].ok, 'and a townhouse is that');
    // A holiday.
    s.time = 6; L.act('trip', 'camping');
    check(L.comfyWants()[1].ok, 'a holiday counts, for a year');
    // Something given: to the family, or to the town.
    const k = L.meet({ kind: 'child', sex: 'm', age: 30, bond: 60 });
    s.age = 50;
    L.act('chapSettle', { p: k.id, n: 25000 });
    check(L.comfyWants()[2].ok, 'money given to the family, which the will counts');
    // Something for the fun of it: a yacht.
    s.time = 6;
    const price0 = L.comfyYachtPrice(), c0 = s.cash + s.bank;
    check(L.act('comfyYachtBuy').ok && s.comfy.yacht && s.cash + s.bank === c0 - price0 && L.comfyWants()[3].ok, 'a yacht is had built at the harbour');
    check(!L.placeActions('harbour').some((a) => a.id === 'comfyYachtBuy'), 'one is enough');
    check(L.comfyGap() === 0 && L.comfyCap() === 100 && L.moodBase() > base, 'with all of it, nothing is missing, and life is better for it');
    check(L.bills().some(([wh, n]) => wh.includes(s.comfy.yacht.name) && n === L.comfyMooring()) && L.comfyYachtValue() === price0, 'she has her mooring to pay for, and is worth what she cost, new');
    // A season or two on.
    for (let i = 0; i < 4; i++) { L.endSeason(); s.pend = []; }
    check(!L.comfyWants()[1].ok && !L.comfyWants()[2].ok && L.comfyYachtValue() < price0 && L.comfyYachtValue() > price0 * 0.9, 'a year on, it is time for another holiday, and to give something again; and the yacht is worth a little less');
    s.age = 60; s.time = 8; s.t = 1;
    // A week along the coast with the family: spring to autumn, and only with somebody to take.
    const bond = k.bond;
    check(L.act('comfyCruise').ok && k.bond >= bond + 7 && L.comfyWants()[1].ok && s.comfy.n.cruises === 1 && TROPHIES.comfyCruise.test(L), 'the family along the coast in her: closer, and a holiday as well');
    check(L.can('comfyCruise') === 'Once a season.', 'once a season');
    s.t = 3; s.use = {};
    check(!L.placeActions('harbour').some((a) => a.id === 'comfyCruise'), 'not in winter');
    s.t = 1;
    const fund = L.act('fund', 'bench');
    check(fund.ok && L.comfyWants().every((x) => x.ok) && TROPHIES.comfyWell.test(L), 'a bench by the pond is something given to the town, and with it, living well at sixty');
    const sold = L.comfyYachtValue(), c1 = s.cash;
    check(L.act('comfyYachtSell').ok && !s.comfy.yacht && s.cash === c1 + sold && !L.comfyWants()[3].ok, 'she can be sold, to a broker in Kettleby');
    // Inside, none of it counts.
    s.gaol = { left: 2, total: 2, served: 0, good: 50, rep: 30 };
    check(L.comfyWants().length === 0 && L.comfyGap() === 0, 'none of it matters in a cell');
    s.gaol = null;
  }

  // ---- with nobody to take ----
  {
    const L = rich(3000000), s = L.s;
    s.people = []; s.cash = 400000; s.t = 1;
    L.act('comfyYachtBuy');
    check(L.can('comfyCruise').includes('nobody'), 'a cruise wants somebody in the family to take');
    s.wx = 'storm';
    check(L.can('comfySail').includes('Not in this'), 'and nobody sails in a gale');
    s.wx = 'fair'; s.time = 4;
    const r = L.act('comfySail');
    check(r.ok && s.comfy.n.sails === 1 && L.can('comfySail') === 'Once a season.', 'but an afternoon round the bay is yours alone');
  }

  // ---- an old save ----
  {
    const L = rich(3000000);
    delete L.s.comfy;
    const O = new Life(JSON.parse(JSON.stringify(L.s)));
    check(O.s.comfy && O.s.comfy.yacht === null && O.comfyWants().length === 4 && Number.isFinite(O.netWorth()), 'a life saved before any of this opens with nothing done yet');
    check(YACHT.names.length >= 6 && YACHT.price > 100000, 'there are yachts to be had, at a price');
  }
}
