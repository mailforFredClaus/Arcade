// New in Town: money for the comfortable. A fortune left idle is no use to
// anybody, and from the middle of a life it was easy to have one and want
// for nothing.
//
// Living well. Somebody of means gets used to things: a home to match them,
// a holiday a year, something given (to the family, the town, a cause of
// their own), something just for the fun of it. Each that is missing weighs
// on the mood a little, the more the richer you are (comfyGap), and keeps
// it from the very top (comfyCap: put your feet up all you like), and each
// is something the town already has: the homes and the estate agent
// (living.js), the holidays at the station, Mrs Gale's gifts to the family
// that the will counts (chapters.js), the mayor's appeal (legacy.js), a
// trust (midlife.js), a boat or a sports car. A box on the Me tab says what
// is missing (comfort-ui.js).
//
// A yacht. What was missing: thirty-eight feet of teak and brass at the
// harbour, with a mooring to pay for, to sail on your own and to take the
// family along the coast in, once a summer.
//
// Everything is kept in s.comfy: trip: when you last went away; gave: when
// you last gave something; yacht: { name, at, paid } or null; n: counts.

import { HOMES, TROPHIES, money, low } from './data.js';

export const YACHT = { price: 180000, mooring: 1200, names: ['Halcyon', 'Sea Holly', 'Westerly', 'Fair Isle', 'Morwenna', 'Lady Grace', 'Second Spring', 'Kestrel'] };
// What counts as giving: Mrs Gale's gifts to the family, the mayor's appeal, a big donation, a trust.
const GAVE = new Set(['chapSettle', 'fund', 'give10000', 'give100000', 'midFound', 'midTopUp']);
// What counts as a holiday.
const AWAY = new Set(['trip', 'comfyCruise']);
// The home somebody of your means is used to: a cottage, then the townhouse, then the villa.
export const homeFor = (means) => (means >= 4 ? 5 : means >= 2.5 ? 4 : 3);

export function install({ def, Life, clamp, hooks }) {
  hooks.load.push((L) => {
    const s = L.s;
    if (!s.comfy || typeof s.comfy !== 'object') s.comfy = {};
    const c = s.comfy, b = { trip: null, gave: null, yacht: null, n: { sails: 0, cruises: 0 } };
    for (const [k, v] of Object.entries(b)) if (c[k] === undefined) c[k] = v;
  });

  const C = (L) => L.s.comfy;
  const means = (L) => (L.midMeans ? L.midMeans() : 1);
  const family = (L) => L.s.people.filter((p) => ['partner', 'spouse', 'child', 'grandchild'].includes(p.kind) && (p.kind === 'partner' ? !!p.live : true));

  Object.assign(Life.prototype, {
    // What somebody of your means is used to, and whether you have it: [{ id, icon, text, ok }]
    // (nothing at all, for ordinary means).
    comfyWants() {
      const s = this.s, c = s.comfy, m = means(this);
      if (m < 1.5 || s.gaol) return [];
      const tier = homeFor(m), name = Object.values(HOMES).find((h) => h.tier === tier).name;
      return [
        // (A home of your own that has been done up, with the building work and the garden, counts a step up: see stHomeLift in street.js.)
        { id: 'home', icon: '🏡', text: `A home to match: ${low(name)}, or better`, ok: HOMES[s.home].tier + (this.stHomeLift ? this.stHomeLift() : 0) >= tier },
        { id: 'trip', icon: '🧳', text: 'A holiday in the last year', ok: c.trip != null && s.t - c.trip < 4 },
        { id: 'gave', icon: '🎁', text: 'Something given in the last year: to the family, to the town, or a trust of your own', ok: (c.gave != null && s.t - c.gave < 4) || !!(s.mid && s.mid.trust) },
        { id: 'fun', icon: '⛵', text: 'Something just for the fun of it: a boat, a yacht or a sports car', ok: !!(s.items.boat || s.items.sportscar || c.yacht) },
      ];
    },
    // How much what is missing weighs on you: up to 10, at the most comfortable.
    comfyWeight() { return clamp(Math.round(2.5 * (means(this) - 1.5)), 0, 10); },
    comfyGap() { const w = this.comfyWants(); return w.length ? Math.round(this.comfyWeight() * w.filter((x) => !x.ok).length / w.length) : 0; },
    // As happy as you can be, with that missing: nobody rests their way past it.
    comfyCap() { return 100 - 2 * this.comfyGap(); },
    comfyClip() { const s = this.s; if (!s.gaol && !s.dead && s.comfy) { const cap = this.comfyCap(); if (s.happy > cap) s.happy = cap; } },
    // The yacht: what one costs now, and what yours would fetch (a little less each year).
    comfyYachtPrice() { return Math.round(YACHT.price * this.s.idx / 1000) * 1000; },
    comfyMooring() { return Math.round(YACHT.mooring * this.s.idx / 10) * 10; },
    comfyYachtValue() { const y = this.s.comfy.yacht; return y ? Math.round(y.paid * 0.95 ** ((this.s.t - y.at) / 4) / 100) * 100 : 0; },
  });

  hooks.acted.push((L, id) => {
    const c = C(L);
    if (AWAY.has(id) || (id === 'midYearOut' && L.s.mid && L.s.mid.sab && L.s.mid.sab.how === 'travel')) c.trip = L.s.t;
    if (GAVE.has(id)) c.gave = L.s.t;
    L.comfyClip();
  });
  hooks.chose.push((L, id, x, i) => {
    // (A grown child's first house, given or lent; another few years for a trust.)
    if ((id === 'midNest' && (i === 0 || i === 1)) || (id === 'midTrustLow' && i === 0)) C(L).gave = L.s.t;
    L.comfyClip();
  });
  hooks.mood.push((L) => -L.comfyGap());
  hooks.late.push((L) => L.comfyClip());
  hooks.bills.push((L, out, jailed) => { if (C(L).yacht) out.push([`The ${C(L).yacht.name}: a mooring, a man to see to her, and the varnish`, L.comfyMooring() * (jailed ? 0.5 : 1)]); });
  hooks.worth.push((L) => L.comfyYachtValue());
  hooks.epitaph.push((L, out) => {
    const y = C(L).yacht, He = L.s.sex === 'f' ? 'She' : 'He';
    if (y) out.push(`${He} kept a yacht called the ${y.name} in the harbour${C(L).n.cruises >= 3 ? ', and took the family along the coast in her every summer' : ''}.`);
  });

  // ---- a yacht of your own ----
  const yacht = (L) => C(L).yacht;
  def('comfyYachtBuy', {
    place: 'harbour', sec: 'A yacht of your own', icon: '🛥️', title: 'Have a yacht built', time: 1,
    cost: (L) => L.comfyYachtPrice(),
    desc: (L) => `Thirty-eight feet of teak and brass from the yard at Kettleby: ${money(L.comfyYachtPrice())}, and ${money(L.comfyMooring())} a season for the mooring and the upkeep. Sail her when you like, and take the family along the coast in summer.`,
    show: (L) => !yacht(L) && (means(L) >= 2 || L.s.cash + L.s.bank >= L.comfyYachtPrice()),
    run(L) {
      const s = L.s, name = L.pick(YACHT.names);
      s.comfy.yacht = { name, at: s.t, paid: L.comfyYachtPrice() };
      L.joy(10);
      L.note(`Had a yacht built, and called her the ${name}.`, 'big');
      return `She comes round the Head on a bright morning with the yard’s skipper at the helm: the ${name}, blue hull, cream sails, your name on the papers. Captain Quinn walks the length of the pontoon to look at her, and says “Hm,” which from Quinn is a sonnet.`;
    },
  });
  def('comfySail', {
    place: 'harbour', sec: 'A yacht of your own', icon: '⛵', title: (L) => `Take the ${yacht(L).name} out`, per: 1,
    desc: 'An afternoon round the bay. Good for the spirits, and for anybody you take with you.',
    show: (L) => !!yacht(L),
    why: (L) => (L.s.wx === 'storm' ? 'Not in this. Even Quinn has her boat tied up.' : L.s.wx === 'fog' ? 'Fog to the end of the pier. She stays on her mooring.' : null),
    run(L) {
      const s = L.s, pt = L.partner(), y = yacht(L);
      s.comfy.n.sails++;
      L.joy(s.wx === 'hot' || s.wx === 'fair' ? 8 : 5); L.gain('fitness', 0.8); L.hp(1); s.use.fit = 1;
      if (pt && pt.live) { L.bond(pt, 4); if (L.midSaw) L.midSaw(pt); }
      return `${L.pick([`The ${y.name} heels over in a stiff westerly and you let her run, past the lighthouse and out to where the water goes dark.`, 'A slow afternoon with the sails barely filling, a flask of tea and nothing to do but watch the town get smaller.', 'Dolphins off Gorse Head, three of them, keeping pace with the bow for a mile and then gone.', 'You tack up the bay and back four times for no reason at all, and it is the best afternoon in months.'])}${pt && pt.live ? ` ${pt.name.split(' ')[0]} takes the helm on the way home, and will not give it back.` : ''}`;
    },
  });
  def('comfyCruise', {
    place: 'harbour', sec: 'A yacht of your own', icon: '🧭', title: 'A week along the coast, with the family', time: 3, per: 1,
    cost: (L) => (L.midPrice ? L.midPrice(600) : 600),
    desc: (L) => `Spring to autumn: harbours you have never seen from the sea, and everybody you can fit aboard (${family(L).length || 'nobody'} of the family, just now). Provisions, harbour dues and fish suppers to pay for.`,
    show: (L) => !!yacht(L) && L.season !== 3,
    why: (L) => (L.s.wx === 'storm' ? 'Not in a gale.' : !family(L).length ? 'There is nobody in the family to take.' : null),
    run(L) {
      const s = L.s, fam = family(L), first = !s.comfy.n.cruises;
      s.comfy.n.cruises++;
      for (const p of fam) { L.bond(p, 8); if (L.midSaw) L.midSaw(p); }
      L.joy(12); L.hp(2);
      if (first) L.note(`Took the family along the coast in the ${yacht(L).name}.`, 'big');
      const who = fam.slice(0, 3).map((p) => p.name.split(' ')[0]), said = who.length < 2 ? who[0] : `${who.slice(0, -1).join(', ')} and ${who[who.length - 1]}`;
      return `${L.pick(['Gullhaven, Polwenna, a cove with no name and a seal in it, and a night at anchor with the stars right down to the water.', 'Rain for two days, sun for five. Everybody learns a knot, and somebody falls in, and it is the story told every Christmas afterwards.', 'A week of crab sandwiches, sunburn and harbourmasters, and the long run home with the wind behind you.'])} ${said} ${who.length > 1 ? 'talk' : 'talks'} about it for a year.`;
    },
  });
  def('comfyYachtSell', {
    place: 'harbour', sec: 'A yacht of your own', icon: '🏷️', title: (L) => `Sell the ${yacht(L).name}`, time: 0,
    desc: (L) => `A broker in Kettleby would give ${money(L.comfyYachtValue())} for her.`,
    show: (L) => !!yacht(L),
    run(L) {
      const y = yacht(L), got = L.comfyYachtValue();
      L.s.comfy.yacht = null; L.cash(got); L.joy(-4);
      L.note(`Sold the ${y.name}, for ${money(got)}.`);
      return `A man in a blazer counts out ${money(got)} and takes her round the Head to her new owner. You watch from the end of the pier until she is out of sight, which takes longer than you expected.`;
    },
  });

  Object.assign(TROPHIES, {
    comfyCruise: { name: 'All hands', icon: '🧭', desc: 'Take the family along the coast in a yacht of your own.', test: (L) => !!L.s.comfy && L.s.comfy.n.cruises >= 1 },
    comfyWell: { name: 'Living well', icon: '🥂', desc: 'At sixty or over, with means, have everything a person of means is used to.', test: (L) => !!L.s.comfy && L.s.age >= 60 && L.comfyWants().length > 0 && L.comfyWants().every((w) => w.ok) },
  });
}
