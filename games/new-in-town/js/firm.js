// New in Town: a business worth running. The business of your own in
// living.js (s.biz: six trades, four sizes, work in it, grow it, a manager,
// sell it) becomes a game of its own, with people, decisions and stories.
//
// A name over the door, chosen from three made up for the trade, and never
// the same name twice in a family's lives.
//
// Staff, taken on from whoever answers the card in the window: each with a
// name, a wage, and a nature you find out by having them (a grafter, a
// light-fingered one, one lovely with customers, one always late, one
// brilliant but prickly, your cousin). They have spirits that rise and fall
// with the pay, the hours and whether you are ever there, and stories: a rise
// asked for, an offer from elsewhere, two of them falling for each other, an
// illness, the till coming up short, an idea of their own, one leaving to
// open up across the road, a long-server's send-off. The size of the place
// says how many it needs; the manager is one of them.
//
// How it is run, on the office's sheet: prices (cheap, fair, dear),
// quality (cut corners, standard, the best) and hours (short, regular,
// long). They move the takings, the name and the risks: an inspection
// failed, a stinker in the Gazette, a customer taken ill, a walkout. Trade
// has seasons (the front in summer, building in spring, presents at
// Christmas), and the times matter: a slump can sink a firm that has
// borrowed too much.
//
// Money: what the staff take goes into the business's own till, less
// wages, stock and the premises; at the end of each year the accounts come
// in and you decide: take it, put it back in, give the staff a bonus, or
// leave it for a rainy day. A spell of work in it yourself is played (each
// trade has a game from the careers) and pays you directly, as before.
// Growing can be done on a business loan; a till that runs dry and a bank
// that calls in what is owed is the end of it, and the debt is yours. After
// a while, somebody offers a way back.
//
// Rivals open nearby (cheap, flash, sly or simply good): see them off, buy
// them out or merge. A chain from the city bids for a business that is going
// places, and at the biggest size there is a board. A grown son or daughter
// may want to come into it, and whoever carries on inherits it with its name
// and its people (see the will in chapters.js).
//
// Everything is kept in s.firm: cur (the business now, matched to s.biz by
// s.biz.fid), past (the ones before), used (the names this family has had
// over doors), and counts and flags for trophies. s.biz keeps what it always
// had, so everything that reads it still can.

import { BUSINESSES, PLACES, TROPHIES, NAMES_M, NAMES_F, SURNAMES, STAT_NAME, money, an, lowJob } from './data.js';
import { grade } from './minilogic.js';
// (Only to say the business's name in the three cards about a business that were here before: see below.)
import { EVENTS } from './events.js';
import {
  NEED, MAX, DEMAND, OVER, SERVE, WAGE, MGR_PAY, PRICE_GET, PRICE_COME, STOCK, HOURS_COME, HOURS_OVER, LOAN_RATE, LOAN_PAY, SEED_DOWN, SEED_RATE, BUST_WAIT, BRANCH_COST,
  TRADES, NATURES, CHAINS, DIRECTORS, RIVAL_KINDS, NAMES, TAKEN, round10, round100, first, surname, years, atPlace,
} from './firm-lib.js';
import { firmCards } from './firm-tales.js';

const blank = () => ({ v: 1, cur: null, past: [], used: [], fid: 1, sid: 1, next: 0, fail: null, again: null, seeded: 0, n: { hired: 0, retired: 0, off: 0, bought: 0, sold: 0, bust: 0, kin: 0 }, f: {} });
const zeroYr = () => ({ take: 0, wages: 0, stock: 0, over: 0, interest: 0, other: 0, profit: 0, n: 0 });
const NATURE_W = [['steady', 30], ['grafter', 18], ['fingers', 9], ['charmer', 14], ['late', 11], ['prickly', 8]];
// For names that are not on a list, once a family has used up the lists.
const ADJ = ['Blue', 'Silver', 'Golden', 'Little', 'Old', 'Salt', 'Harbour', 'North', 'Copper', 'Green', 'Red', 'Morning'];
const NOUN = ['Anchor', 'Lantern', 'Kettle', 'Compass', 'Gull', 'Rope', 'Shell', 'Mast', 'Oar', 'Buoy', 'Heron', 'Wren'];
const TAIL = { food: '', shop: ' Stores', build: ' Builders', soft: ' Software', fleet: ' Fishing', design: ' Studio' };

export function install({ def, A, Life, clamp, hooks, addEvents }) {
  const F = (L) => L.s.firm;
  const busy = (L, n) => { L.s.time = Math.max(0, L.s.time - n); };

  // ---- the business now, and the people in it ----

  Object.assign(Life.prototype, {
    // The business you run, as firm.js knows it (null if there is none, or it has not been set up yet).
    firmOf() { const s = this.s, c = s.firm && s.firm.cur; return c && s.biz && s.biz.fid === c.fid ? c : null; },
    // What it is called: its name, or, before it has one, what it is.
    firmCalled() { const c = this.firmOf(); return c ? c.name : this.s.biz ? an(lowJob(this.bizName())) : ''; },
    // What sort of place it is, in a word: café, building firm.
    firmSize() { return this.s.biz ? lowJob(this.bizName()) : ''; },
    firmWhere() { const b = this.s.biz; return b ? PLACES[BUSINESSES[b.type].place].name : ''; },
    // Where it is, in a sentence: on the High Street, at the Harbour.
    firmAt(id = null) { const b = this.s.biz; return id ? atPlace(PLACES[id].name) : b ? atPlace(PLACES[BUSINESSES[b.type].place].name) : ''; },
    firmStaff() { const c = this.firmOf(); return c ? c.staff : []; },
    firmStaffer(id) { return this.firmStaff().find((q) => q.id === id) || null; },
    firmMgr() { const c = this.firmOf(); return c && c.mgr != null ? this.firmStaffer(c.mgr) : null; },
    firmTill() { const c = this.firmOf(); return c ? c.till : 0; },
    firmLoan() { const c = this.firmOf(); return c ? c.loan : 0; },
    // How many it needs to meet its trade, and how many it could use.
    firmNeed() { const c = this.firmOf(); return c ? NEED[this.s.biz.lvl] + (c.branch ? 2 : 0) : 0; },
    firmMax() { const c = this.firmOf(); return c ? MAX[this.s.biz.lvl] + (c.branch ? 2 : 0) : 0; },
    // One of the staff: how much they get through, and what they cost a season.
    firmOut(st) { return NATURES[st.nat].out * (0.7 + st.skill / 150) * (0.8 + st.mor / 300) * (st.part ? 0.5 : 1); },
    firmWage(st) {
      const b = this.s.biz, c = this.firmOf();
      if (!b || !c) return 0;
      return round10(BUSINESSES[b.type].take[b.lvl] * WAGE * NATURES[st.nat].pay * (0.8 + st.skill / 250) * (st.pay || 1) * (c.mgr === st.id ? MGR_PAY : 1) * (st.part ? 0.5 : 1));
    },
    firmWages() { return this.firmStaff().reduce((a, st) => a + this.firmWage(st), 0); },
    firmMorale() { const l = this.firmStaff(); return l.length ? l.reduce((a, st) => a + st.mor, 0) / l.length : 60; },
    // How dear prices go down: with a good name and good things, people pay.
    firmDear() { const b = this.s.biz, c = this.firmOf(); return clamp(0.6 + (b.rep + [-20, 0, 20][c.qual]) / 300, 0.55, 1); },
    // How busy the trade is this season, with the weather: 1 is an ordinary season.
    firmBusy() { const b = this.s.biz, T = TRADES[b.type]; return T.season[this.season] * (T.wx[this.s.wx] || 1); },
    // How much trade comes its way in a season, in dollars at fair prices.
    firmDemand() {
      const s = this.s, b = s.biz, c = this.firmOf(), k = BUSINESSES[b.type], T = TRADES[b.type];
      const came = c.price === 2 ? this.firmDear() : PRICE_COME[c.price];
      return k.take[b.lvl] * DEMAND[b.lvl] * this.firmBusy() * (1 + T.eco * s.eco) * (0.55 + b.rep / 110) * came * [0.94, 1, 1.06][c.qual] * HOURS_COME[c.hours]
        * (c.rival ? 1 - c.rival.str / 250 : 1) * (c.branch ? 1.4 : 1) * (1 + 0.05 * c.fit) * (1 + 0.06 * c.lines.length);
    },
    // How much the staff can serve: better with you there, or a good manager.
    firmCap(present) {
      const b = this.s.biz, c = this.firmOf(), mgr = this.firmMgr();
      const boss = present ? 1.05 : mgr ? 0.9 + mgr.skill / 500 : 0.8;
      return c.staff.reduce((a, st) => a + this.firmOut(st), 0) * boss * BUSINESSES[b.type].take[b.lvl] * SERVE * [0.95, 1, 1.05][c.hours];
    },
    // A season's trade: { demand, cap, take, stock, wages, over, interest, principal, other, profit }.
    // present: you worked in it this season. noisy: a real season (else an estimate, with no dice).
    firmTrade(present, noisy = false) {
      const s = this.s, b = s.biz, c = this.firmOf();
      const demand = this.firmDemand() * (noisy ? 0.9 + this.rnd() * 0.2 : 1), cap = this.firmCap(present);
      const shut = c.shut === s.t || c.strike === s.t;
      const sold = shut ? 0 : Math.min(demand, cap);
      const take = sold * PRICE_GET[c.price], stock = sold * STOCK[c.qual];
      const wages = c.strike === s.t ? 0 : this.firmWages();
      const over = (c.staff.length || b.lvl > 0 ? OVER[b.lvl] : 0) * HOURS_OVER[c.hours] * (c.branch ? 1.5 : 1);
      const interest = c.loan * (c.seed ? SEED_RATE : LOAN_RATE);
      const principal = Math.min(c.loan, round10(Math.max(c.loan * LOAN_PAY, Math.min(c.loan, 200))));
      // (What goes missing from a till with light fingers near it, and a partner's share of a good season.)
      const fingers = c.staff.filter((st) => st.nat === 'fingers' && !st.part).length;
      const theft = take * 0.04 * fingers;
      const before = take - stock - wages - over - interest - theft;
      const share = c.partner && before > 0 ? before * c.partner.share : 0;
      const r = { demand, cap, take, stock, wages, over, interest, principal, other: theft + share, theft, share, shut };
      for (const k of Object.keys(r)) if (typeof r[k] === 'number') r[k] = round10(r[k]);
      r.profit = r.take - r.stock - r.wages - r.over - r.interest - r.other;
      return r;
    },
    // How the season looks from here, without you and with you.
    firmForecast() { return this.firmOf() ? { away: this.firmTrade(false), there: this.firmTrade(true) } : null; },
    // Short of hands, or with more than the trade needs: -1, 0 or 1.
    firmHands() {
      const c = this.firmOf();
      if (!c) return 0;
      const f = this.firmTrade(true);
      if (c.staff.length < this.firmNeed() || f.demand > f.cap * 1.25) return -1;
      return f.cap > f.demand * 1.35 && c.staff.length > 1 ? 1 : 0;
    },
    // What a second premises would cost, and where it could go.
    firmBranchCost() { const b = this.s.biz; return b ? round100(this.bizCost(Math.max(1, b.lvl)) * BRANCH_COST) : 0; },
    firmBranchPlaces() { const b = this.s.biz; return b ? TRADES[b.type].branch : []; },
    // What putting the year's money back in would buy, and what it costs.
    firmKitCost() { const b = this.s.biz, c = this.firmOf(); return c ? round100(this.bizCost(Math.max(1, b.lvl)) * 0.07 * (c.fit + 1)) : 0; },
    // How much the bank would lend the business, all told.
    firmLimit() { const b = this.s.biz; return b ? round100(BUSINESSES[b.type].cost.slice(0, b.lvl + 2).reduce((a, n) => a + n, 0) * 0.75) : 0; },
    // A rival's buy-out price.
    firmRivalPrice() { const b = this.s.biz, c = this.firmOf(); return c && c.rival ? round100(this.bizCost(Math.max(1, b.lvl)) * (0.12 + c.rival.str / 250)) : 0; },
    // The overdraft the bank will stand on the business before it starts asking questions.
    firmOverdraft() { return Math.max(2000, round100(this.firmWages() + (this.s.biz ? OVER[this.s.biz.lvl] : 0))); },
    // When the bank will look at a new business again, after one went under.
    firmBarred() { const f = this.s.firm && this.s.firm.fail; return f ? Math.max(0, f.t + BUST_WAIT - this.s.t) : 0; },

    // ---- names ----

    // Three names for a new business of this trade, none of them used by the family or in the town.
    firmNames(type, n = 3) {
      const s = this.s, taken = firmTaken(this), out = [];
      const fill = (t) => t.replace('{F}', first(s.name)).replace('{S}', surname(s.name));
      const pool = NAMES[type].map(fill).filter((x) => !taken.has(x.toLowerCase()));
      while (out.length < n && pool.length) out.push(pool.splice(Math.floor(this.rnd() * pool.length), 1)[0]);
      for (let i = 0; out.length < n && i < 200; i++) {
        const x = `The ${this.pick(ADJ)} ${this.pick(NOUN)}${TAIL[type]}`;
        if (!taken.has(x.toLowerCase()) && !out.includes(x)) out.push(x);
      }
      return out;
    },
    // Somebody new to work for you (or to run a rival): a name not already in your life.
    firmFreshName(sex, sur = null) {
      const s = this.s, c = s.firm.cur, used = new Set(s.people.map((p) => p.name));
      if (c) for (const q of [...c.staff, ...c.apps]) used.add(q.name);
      if (c && c.rival) used.add(c.rival.who);
      const names = sex === 'm' ? NAMES_M : NAMES_F;
      for (let i = 0; i < 40; i++) {
        const n = `${this.pick(names)} ${sur || this.pick(SURNAMES)}`;
        if (!used.has(n)) return n;
      }
      return `${this.pick(names)} ${this.pick(SURNAMES)}`;
    },

    // ---- people ----

    // Someone to work for you. o: anything already decided (nat, sex, name, age, skill, kin, look).
    firmMakeStaff(o = {}) {
      const s = this.s, Fm = s.firm;
      const sex = o.sex || (this.chance(0.5) ? 'm' : 'f');
      let nat = o.nat;
      if (!nat) { let x = this.rnd() * NATURE_W.reduce((a, [, w]) => a + w, 0); for (const [k, w] of NATURE_W) { x -= w; if (x < 0) { nat = k; break; } } nat = nat || 'steady'; }
      const skill = o.skill ?? clamp(Math.round(40 + this.gauss() * 12 + { prickly: 18, late: -6, cousin: -8, grafter: 4 }[nat] || 0), 15, 90);
      const age = o.age ?? clamp(Math.round(18 + this.rnd() * 40), 18, 60);
      return {
        id: Fm.sid++, name: o.name || this.firmFreshName(sex, nat === 'cousin' ? surname(s.name) : null), sex, age, look: o.look || this.randomLook(sex), nat, skill: Math.round(skill),
        pay: 1, mor: clamp(60 + NATURES[nat].mor, 20, 90), since: s.t, known: nat === 'cousin' || nat === 'kin', hint: this.pick(NATURES[nat].hints), kin: o.kin ?? null, pair: null, stolen: 0, did: {},
      };
    },
    // Whoever has answered the card in the window: three, now and then a new lot.
    firmApps() {
      const s = this.s, c = this.firmOf();
      if (!c) return [];
      if (!c.apps.length || s.t - c.appT >= 4) drawApps(this);
      return c.apps;
    },
    // Takes somebody on. app: an applicant's id. Returns them.
    firmTakeOn(app) {
      const s = this.s, c = this.firmOf(), i = c.apps.findIndex((q) => q.id === app);
      if (i < 0) return null;
      const st = c.apps.splice(i, 1)[0];
      st.since = s.t; st.mor = clamp(st.mor + 4, 0, 100);
      if (st.nat === 'cousin') c.cousin = true;
      c.staff.push(st);
      s.firm.n.hired++; c.n.hired++;
      if (c.n.hired === 1) this.note(`Took on ${c.name}’s first member of staff: ${st.name}.`);
      return st;
    },
    // Somebody leaves. how: 'sacked', 'left', 'poached', 'retired', 'rival', 'theft', 'died', 'joined' (a merger), 'quiet'.
    firmGone(id, how) {
      const c = this.firmOf();
      if (!c) return;
      const i = c.staff.findIndex((q) => q.id === id);
      if (i < 0) return;
      const st = c.staff.splice(i, 1)[0];
      if (c.mgr === id) { c.mgr = null; this.s.biz.mgr = false; }
      for (const q of c.staff) if (q.pair === id) q.pair = null;
      c.n.gone = (c.n.gone || 0) + 1;
      c.gone = [...(c.gone || []), { name: st.name, how, yrs: Math.floor((this.s.t - st.since) / 4) }].slice(-12);
    },
    // Spirits up or down, for one or for all.
    firmCheer(st, d) { st.mor = clamp(st.mor + d, 0, 100); },
    firmCheerAll(d, but = null) { for (const st of this.firmStaff()) if (st.id !== but) this.firmCheer(st, d); },
    firmRep(d) { const b = this.s.biz; if (b) b.rep = clamp(b.rep + d, 0, 100); },
    // Where a setting stands, and changes it (from the office, or from a card).
    firmSet(k, v) { const c = this.firmOf(); if (c && [0, 1, 2].includes(v)) { c[k] = v; c.set[k] = this.s.t; } },
    // A rival opens. o: { who, sex, kind, str, from, name }.
    firmRivalOpen(o = {}) {
      const s = this.s, c = this.firmOf(), b = s.biz;
      if (!c || c.rival) return null;
      const sex = o.sex || (this.chance(0.5) ? 'm' : 'f');
      const who = o.who || this.firmFreshName(sex);
      const name = o.name || this.firmNames(b.type, 1)[0];
      s.firm.used.push(name);
      c.rival = { name, who, sex, kind: o.kind || this.pick(Object.keys(RIVAL_KINDS)), str: o.str ?? this.int(35, 55), at: s.t, from: o.from || 'new', beat: s.t, war: false, known: false };
      return c.rival;
    },
    // A rival is no more: 'off' (seen off), 'bought', 'merged', 'gone' (they outlasted it, or it was sold).
    firmRivalEnd(how) {
      const s = this.s, c = this.firmOf();
      if (!c || !c.rival) return;
      const r = c.rival;
      c.rival = null; c.rivalT = s.t;
      if (how === 'off') { s.firm.n.off++; s.firm.f.seenOff = 1; this.note(`${r.name} closed its doors. ${c.name} saw it off.`, 'big'); }
      if (how === 'bought' || how === 'merged') { s.firm.n.bought++; s.firm.f.bought = 1; }
    },
    // The business is sold on, at a price (cash to you), by a road other than the "Sell" button.
    firmSellTo(price, to) {
      const s = this.s, c = this.firmOf();
      if (!c) return;
      s.cash += Math.round(price);
      closeDown(this, 'sold', price, to);
    },
    // The business goes under: its things sold for what they fetch, and what it owed is now yours.
    firmBust(why = '') {
      const s = this.s, c = this.firmOf();
      if (!c) return '';
      const name = c.name, fetch = round100(this.bizWorth() * 0.35), owed = Math.max(0, -c.till) + c.loan, n = c.staff.length;
      const left = owed - fetch;
      c.till = 0; c.loan = 0;
      if (left > 0) this.cash(-left); else s.cash += -left;
      closeDown(this, 'bust', 0);
      s.firm.fail = { t: s.t, name };
      s.firm.n.bust++;
      this.joy(-15); this.karma(-1);
      this.note(`${name} went under${why}. ${n ? `${n === 1 ? 'One job' : `${n} jobs`} gone, and ` : ''}${left > 0 ? `${money(left)} owed that is yours to pay now.` : 'what it owned just covered what it owed.'}`, 'big');
      this.say('📉', `${name} has gone under`, 'bad');
      return left;
    },
  });

  // ---- keeping s.firm in step with s.biz ----

  // Names nobody in this family, or this town, may use again.
  function firmTaken(L) {
    const s = L.s, out = new Set([...TAKEN, ...(s.firm ? s.firm.used : [])].map((x) => x.toLowerCase()));
    if (s.mkt && s.mkt.stall && s.mkt.stall.name) out.add(s.mkt.stall.name.toLowerCase());
    if (s.wants) for (const r of Object.values(s.wants.p || {})) if (r && r.shop && r.shop.sign) out.add(r.shop.sign.toLowerCase());
    if (s.annals && s.annals.shops) for (const x of s.annals.shops) if (x.n) out.add(x.n.toLowerCase());
    const c = s.firm && s.firm.cur;
    if (c && c.rival) out.add(c.rival.name.toLowerCase());
    return out;
  }
  function drawApps(L) {
    const s = L.s, c = L.firmOf();
    c.apps = []; c.appT = s.t;
    const family = s.people.some((p) => p.kind === 'parent' || p.kind === 'sibling') || s.gen > 1;
    const cousin = !c.cousin && family && L.chance(0.22);
    for (let i = 0; i < 3; i++) c.apps.push(L.firmMakeStaff(i === 2 && cousin ? { nat: 'cousin' } : {}));
  }
  // A new record for the business in s.biz. name: what it is called. data: carried over from a life before.
  function setUp(L, name, data = null) {
    const s = L.s, Fm = s.firm, b = s.biz;
    b.fid = Fm.fid++;
    const c = {
      fid: b.fid, name, type: b.type, since: s.t, from: s.age, price: 1, qual: 1, hours: 1, set: {}, staff: [], apps: [], appT: -99, handsT: -99, mgr: null,
      till: 0, loan: 0, seed: false, fit: 0, lines: [], tried: [], branch: null, rival: null, rivalT: s.t, chainT: s.t, board: null, partner: null,
      last: null, yr: zeroYr(), years: [], best: 0, black: 0, shut: null, strike: null, strikeT: -99, brokeT: -99, riskT: -99, ideaT: -99, loveT: -99, clashT: -99,
      cousin: false, kin: {}, named: false, n: { hired: 0, gone: 0 }, gone: [],
    };
    if (data) {
      for (const k of ['price', 'qual', 'hours', 'fit', 'lines', 'tried', 'branch', 'cousin', 'board', 'since0', 'from0', 'n0']) if (data[k] != null) c[k] = JSON.parse(JSON.stringify(data[k]));
      c.named = true;
    }
    Fm.cur = c;
    if (name && !Fm.used.includes(name)) Fm.used.push(name);
    return c;
  }
  // A business that came by another road (Betty's, the will, an old save): give it a name and people.
  function adopt(L) {
    const s = L.s, b = s.biz, betty = b.paid != null && b.type === 'food' && s.log.slice(-6).some((e) => /^Took on Betty’s/.test(e.t));
    const name = betty ? 'Betty’s Café' : L.firmNames(b.type, 1)[0];
    const c = setUp(L, name);
    c.named = true;
    const n = betty ? 1 : Math.max(0, NEED[b.lvl] - (b.lvl >= 2 ? 1 : 0));
    for (let i = 0; i < n; i++) c.staff.push(L.firmMakeStaff({ nat: L.pick(['steady', 'steady', 'grafter', 'charmer', 'late']), age: L.int(22, 55) }));
    for (const st of c.staff) { st.since = s.t - L.int(0, 12); st.known = true; }
    if (b.mgr) { if (!c.staff.length) c.staff.push(L.firmMakeStaff({ nat: 'steady', skill: 55, age: L.int(30, 55) })); c.mgr = c.staff.reduce((a, q) => (q.skill > a.skill ? q : a)).id; }
    if (b.lvl >= 3) c.board = { mood: 60, t: s.t, who: pickN(L, DIRECTORS, 3) };
    return c;
  }
  const pickN = (L, list, n) => { const pool = list.slice(), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(L.rnd() * pool.length), 1)[0]); return out; };
  // The business has gone, one way or another: into the record of the past.
  function closeDown(L, how, got = 0, to = null) {
    const s = L.s, Fm = s.firm, c = Fm.cur;
    if (!c) return;
    const lvl = s.biz && s.biz.fid === c.fid ? s.biz.lvl : c.lvl ?? 0;
    // (Whatever was in its till, or owed by it, is yours now; a sale or a failure settles it first.)
    if (how !== 'bust') {
      if (c.till > 0) s.cash += c.till; else if (c.till < 0) L.cash(c.till);
      if (c.loan > 0) L.cash(-c.loan);
    }
    Fm.past.push({ name: c.name, type: c.type, lvl, from: c.from, to: s.age, how, got: Math.round(got), to2: to, staff: c.n.hired, yrs: Math.floor((s.t - c.since) / 4) });
    if (Fm.past.length > 12) Fm.past.shift();
    Fm.cur = null;
    if (s.biz && s.biz.fid === c.fid) s.biz = null;
  }
  // Brings s.firm into line with s.biz: a business gone by some other road is put in the past, and one
  // that came by another road is set up.
  function sync(L) {
    const s = L.s;
    if (!s.firm) s.firm = blank();
    const Fm = s.firm, b = s.biz, c = Fm.cur;
    if (c && (!b || b.fid !== c.fid)) closeDown(L, b ? 'replaced' : s.dead ? 'will' : 'gone');
    if (b && (!Fm.cur || b.fid !== Fm.cur.fid)) adopt(L);
    const now = Fm.cur;
    if (now && s.biz) { now.lvl = s.biz.lvl; s.biz.mgr = now.mgr != null; }
  }

  // ---- the season, the year ----

  function season(L, jailed) {
    const s = L.s, b = s.biz, c = L.firmOf(), Fm = s.firm, k = BUSINESSES[b.type];
    const present = !!s.use.biz && !jailed;
    const r = L.firmTrade(present, true);
    c.till += r.profit - r.principal;
    c.loan = Math.max(0, c.loan - r.principal);
    if (c.till < 0) c.till -= round10(-c.till * 0.03);
    c.last = { ...r, t: s.t, present, profit: r.profit };
    for (const q of ['take', 'wages', 'stock', 'over', 'interest', 'other', 'profit']) c.yr[q] += r[q];
    c.yr.n++;
    const U = k.take[b.lvl], mgr = L.firmMgr();
    // Its name: how it is run, who serves, and whether anybody is minding it.
    const charmers = c.staff.filter((st) => st.nat === 'charmer').length;
    let d = [-1.5, 0, 1.2][c.qual] + (c.price === 0 ? 0.8 : c.price === 2 && c.qual < 2 ? -1 : 0) + charmers * 0.5 + [-0.5, 0, 0.3][c.hours];
    d += present ? 0.5 : mgr ? (mgr.skill - 50) / 40 : b.lvl === 0 && !c.staff.length ? -3 : -2;
    if (!r.shut && r.demand > r.cap * 1.3 && c.staff.length < L.firmNeed()) d -= 1.5;
    if (r.shut) d -= 2;
    d += (50 - b.rep) * 0.02;
    L.firmRep(d);
    // The staff: spirits, light fingers, getting to know them.
    const prickly = c.staff.filter((st) => st.nat === 'prickly').length;
    for (const st of c.staff) {
      let want = 58 + NATURES[st.nat].mor + (present ? 6 : 0) + (mgr && mgr !== st ? (mgr.skill - 50) / 10 : 0) + [6, 0, -10][c.hours] + [-4, 0, 3][c.qual]
        + ((st.pay || 1) - 1) * 60 + (st.bonus != null && s.t - st.bonus < 4 ? 8 : 0) - (prickly - (st.nat === 'prickly' ? 1 : 0)) * 4 + (st.pair ? 4 : 0)
        + (c.till < 0 ? -5 : 0) + (c.staff.length < L.firmNeed() ? -6 : 0) + (c.mgr === st.id ? 5 : 0) + (c.strike === s.t ? -6 : 0);
      want = clamp(want, 5, 95);
      st.mor = clamp(st.mor + (want - st.mor) * 0.3 + L.gauss() * 3, 0, 100);
      if (st.nat === 'fingers') st.stolen = (st.stolen || 0) + r.take * 0.04;
      if (!st.known && s.t - st.since >= 3) st.known = true;
    }
    // A rival: gaining on you, or being seen off.
    if (c.rival) {
      const R = c.rival;
      const mine = (b.rep - 40) / 6 + (c.price === 0 ? 2 : c.price === 2 ? -1 : 0) + (c.qual === 2 ? 1.5 : c.qual === 0 ? -1 : 0) + c.fit * 0.3;
      R.str = clamp(R.str + RIVAL_KINDS[R.kind].pull * 1.5 - mine + (L.rnd() * 6 - 3), 0, 100);
      if (R.str <= 0) L.firmRivalEnd('off');
    } else if (s.t - c.rivalT >= 16 && b.rep >= 35 && L.chance(0.012 + b.rep / 3000 + b.lvl * 0.004)) {
      L.firmRivalOpen();
      queueOnce(L, 'firmRival', null);
    }
    // Hands wanted, and whoever has answered the card in the window.
    if (s.t - c.appT >= 4) drawApps(L);
    if (b.lvl >= 1 && c.staff.length < L.firmNeed() && s.t - c.handsT >= 4 && !jailed) { c.handsT = s.t; queueOnce(L, 'firmHands', null); }
    // What can go wrong, by how it is run. (One thing a season at most.)
    if (!jailed && s.t - c.riskT >= 2) {
      const T = TRADES[b.type], food = b.type === 'food';
      const inspect = (food ? 0.05 : 0.025) * [2.5, 1, 0.5][c.qual] * [0.9, 1, 1.2][c.hours];
      const ill = [0.035, 0.01, 0.003][c.qual] * (food ? 1.5 : 1);
      const avg = L.firmMorale();
      let risk = null;
      if (c.staff.length >= 3 && avg < 32 && s.t - c.strikeT >= 8) risk = ['firmStrike', null];
      else if (L.chance(inspect)) risk = ['firmInspect', null];
      else if (L.chance(ill)) risk = ['firmPoorly', L.int(0, T.trouble.length - 1)];
      else if (b.lvl >= 1 && L.chance(0.035)) risk = ['firmReview', { good: L.chance(clamp(0.25 + b.rep / 200 + [-0.2, 0, 0.15][c.qual] + (c.price === 2 && c.qual < 2 ? -0.15 : 0), 0.05, 0.95)) }];
      else { const low = c.staff.filter((st) => st.mor < 22).sort((a2, b2) => a2.mor - b2.mor)[0]; if (low && L.chance(0.45)) risk = ['firmQuit', low.id]; }
      if (risk) { c.riskT = s.t; queueOnce(L, risk[0], risk[1]); }
    }
    // A till run dry: the bank wants a word, and then it wants its money.
    const od = L.firmOverdraft();
    if (c.till < -od * 3) L.firmBust(', when the bank called in what it was owed');
    else if (c.till < -od && s.t - c.brokeT >= 2) { c.brokeT = s.t; queueOnce(L, 'firmBroke', null); }
    if (!L.firmOf()) return;
    // Things worth a trophy.
    if (b.rep >= 95 && c.qual === 2) Fm.f.best = 1;
    if (c.staff.some((st) => s.t - st.since >= 40)) Fm.f.ten = 1;
    b.mgr = c.mgr != null;
  }
  // (A card of this business's is put up only once at a time.)
  function queueOnce(L, id, x) { if (!L.s.pend.some((e) => e.id === id)) L.queue(id, x); }

  // The stories: at most one every other season, from what is going on in the business.
  function beats(L) {
    const s = L.s, b = s.biz, c = L.firmOf(), out = [], add = (id, x, w) => out.push({ id, x, w });
    const U = BUSINESSES[b.type].take[b.lvl];
    for (const st of c.staff) {
      const yrs = s.t - st.since, family = st.kin != null || st.nat === 'cousin';
      if (yrs >= 6 && s.t - (st.did.rise ?? st.since) >= 10 && st.mor < 80 && st.kin == null) add('firmRise', st.id, 1.5);
      if (st.nat === 'fingers' && (st.stolen || 0) >= U * 0.25 && !st.did.caught) add('firmTheft', st.id, 5);
      if (st.nat === 'late' && st.did.late == null && yrs >= 2) add('firmLate', st.id, 2);
      if (st.mor >= 55 && st.skill >= 45 && c.tried.length < TRADES[b.type].ideas.length && s.t - c.ideaT >= 12 && st.did.idea == null && yrs >= 3) add('firmIdea', st.id, 1.2);
      if (st.age >= 61 && yrs >= 20 && st.did.retire == null) add('firmRetire', st.id, 6);
      if ((st.nat === 'prickly' || st.skill >= 72) && yrs >= 12 && !c.rival && !family && st.mor < 70 && c.mgr !== st.id) add('firmLeave', st.id, 1);
      if (s.t - (st.did.ill ?? st.since) >= 16 && yrs >= 4) add('firmIll', st.id, 0.5);
      if ((st.skill >= 55 || st.nat === 'charmer' || st.nat === 'prickly') && !family && s.t - (st.did.poach ?? st.since) >= 16 && yrs >= 4) add('firmPoach', { id: st.id, by: c.rival && c.rival.kind === 'flash' ? 'rival' : L.chance(0.5) ? 'town' : 'city' }, c.rival && c.rival.kind === 'flash' ? 2.5 : 0.8);
    }
    const free = c.staff.filter((st) => !st.pair && st.kin == null && st.age >= 20 && st.age <= 55 && s.t - st.since >= 4 && st.did.love == null);
    if (free.length >= 2 && s.t - c.loveT >= 30) add('firmLove', { a: free[0].id, b: free[1].id }, 0.8);
    const pair = c.staff.find((st) => st.pair && st.pairAt != null && s.t - st.pairAt >= 8 && st.did.love2 == null);
    if (pair && L.firmStaffer(pair.pair)) add('firmLove2', { a: pair.id, b: pair.pair }, 3);
    const prick = c.staff.find((st) => st.nat === 'prickly' && st.known);
    if (prick && c.staff.length >= 2 && s.t - c.clashT >= 16) add('firmClash', { a: prick.id, b: c.staff.find((q) => q !== prick).id }, 1);
    if (c.rival && s.t - c.rival.beat >= 4) {
      const R = c.rival;
      if (R.str <= 22 || R.str >= 85) add('firmDeal', null, 3);
      else if (R.kind === 'cheap') add('firmWar', null, 2);
      else if (R.kind === 'sly') add('firmRumour', null, 2);
      else add('firmWar', null, 0.8);
    }
    // (What the chain offers and what the board wants are settled only if their card is the one that comes up.)
    if (b.lvl >= 2 && b.rep >= 55 && s.t - c.chainT >= 28) {
      add('firmChain', () => {
        const free = CHAINS.filter((n) => !s.firm.used.includes(n)), chain = free.length ? L.pick(free) : `${L.pick(CHAINS)} ${L.pick(['Holdings', 'Leisure', 'Retail'])}`;
        s.firm.used.push(chain); c.chainT = s.t;
        return { chain, offer: round100(L.bizWorth() * (1.25 + b.rep / 250)) };
      }, 0.7);
    }
    if (b.lvl === 3 && c.board && s.t - c.board.t >= 8) {
      const last = c.years[c.years.length - 1];
      add('firmBoard', () => ({ k: c.board.mood < 35 ? 'chair' : last && last.p < 0 ? 'cut' : 'grow' }), 1.2);
    }
    if (b.lvl >= 1 && c.staff.length < L.firmMax()) {
      const kid = L.kids().find((p) => p.age >= 18 && p.age <= 35 && (c.kin[p.id] == null || s.t - c.kin[p.id] >= 16) && !c.staff.some((st) => st.kin === p.id));
      if (kid) add('firmKin', kid.id, 2);
    }
    return out;
  }

  // ---- hooks ----

  hooks.load.push((L) => { sync(L); });
  hooks.acted.push((L) => { sync(L); });
  hooks.chose.push((L) => { sync(L); });
  hooks.season.push((L, lines, jailed) => { sync(L); if (L.firmOf()) season(L, jailed); });
  hooks.late.push((L, jailed) => {
    const s = L.s, Fm = s.firm;
    sync(L);
    const c = L.firmOf();
    // The way back, a while after a business went under.
    if (!c && Fm.fail && !s.biz && Fm.again !== Fm.fail.t && s.t - Fm.fail.t >= BUST_WAIT && !jailed && s.age < 66 && L.chance(0.35)) { Fm.again = Fm.fail.t; L.queue('firmAgain', null); return; }
    if (!c || jailed || s.t < Fm.next || s.pend.some((e) => /^firm/.test(e.id))) return;
    const list = beats(L);
    if (!list.length || !L.chance(0.55)) return;
    let x = L.rnd() * list.reduce((a, q) => a + q.w, 0), pick = list[0];
    for (const q of list) { pick = q; x -= q.w; if (x < 0) break; }
    Fm.next = s.t + 2;
    L.queue(pick.id, typeof pick.x === 'function' ? pick.x() : pick.x);
  });
  // A birthday: everybody a year older, and the year's accounts.
  hooks.year.push((L) => {
    const s = L.s, c = L.firmOf();
    if (!c) return;
    for (const st of c.staff.slice()) {
      st.age++;
      // (Past retiring age without a send-off: they go quietly, with a card signed by everybody.)
      if (st.age >= 67 && st.kin == null) { L.firmGone(st.id, 'retired'); s.firm.n.retired++; L.note(`${st.name} retired from ${c.name}, after ${years(s.t - st.since)}.`); }
    }
    for (const st of c.staff.slice()) if (st.kin != null && !L.person(st.kin)) L.firmGone(st.id, 'quiet');
    const y = c.yr;
    if (y.n >= 2 && !s.gaol && (y.take > 0 || c.staff.length || c.loan)) {
      c.years.push({ a: s.age - 1, p: y.profit });
      if (c.years.length > 16) c.years.shift();
      c.black = y.profit > 0 ? c.black + 1 : 0;
      if (c.black >= 10) s.firm.f.black = 1;
      if (y.profit > c.best && y.profit >= 20000 && c.years.length >= 3) L.note(`${c.name}’s best year yet: ${money(y.profit)} profit.`, 'big');
      c.best = Math.max(c.best, y.profit);
      if (c.board) c.board.mood = clamp(c.board.mood + clamp((y.profit - OVER[3] * 0.6) / (OVER[3] * 0.6) * 15, -20, 15), 0, 100);
      L.queue('firmBooks', { ...y, till: c.till });
    }
    c.yr = zeroYr();
  });
  hooks.worth.push((L) => { const c = L.firmOf(); return c ? c.till - c.loan : 0; });
  hooks.mood.push((L) => {
    const c = L.firmOf(), Fm = L.s.firm;
    if (!c) return Fm && Fm.fail && L.s.t - Fm.fail.t < 8 ? -3 : 0;
    return (c.till < 0 ? -3 : 0) + (c.strike === L.s.t ? -2 : 0) + (c.years.length && c.years[c.years.length - 1].p > 0 ? 1 : 0);
  });

  // ---- the business's own actions, from living.js, run the firm's way ----
  // (Their names and what they do are kept: chapters.js, heists.js, vice.js and annals.js read them.)

  // Starting out: the Town Hall's list is firm-ui.js's sheet now, and the name is chosen on a card.
  A.bizOpen.open = 'firmStart';
  const startWhy = A.bizStart.why;
  A.bizStart.why = (L, type) => (L.firmBarred() && !L.s.biz ? `The bank will not back a new business for ${L.firmBarred()} more season${L.firmBarred() > 1 ? 's' : ''}.` : startWhy(L, type));
  function opened(L, type, seed) {
    const s = L.s, k = BUSINESSES[type];
    s.biz = { type, lvl: 0, rep: 30, mgr: false, age: 0, at: s.t };
    const names = L.firmNames(type);
    const c = setUp(L, names[0]);
    c.named = false;
    if (seed) { c.loan = L.bizCost(0) - SEED_DOWN; c.seed = true; s.firm.seeded++; }
    drawApps(L);
    L.joy(6);
    L.queue('firmName', { fid: c.fid, names });
    return `You are in business: ${an(k.names[0].toLowerCase())} ${atPlace(PLACES[k.place].name)}${seed ? `, on ${money(c.loan)} from the Town Hall’s enterprise fund` : ''}. It wants a name over the door first. Then work in it to bring in money and build its name.`;
  }
  A.bizStart.run = (L, type) => opened(L, type, false);
  // The same, for somebody who cannot find the money: a small deposit, and the rest lent by the Town Hall, once in a life.
  def('firmSeed', {
    cost: SEED_DOWN, time: 1,
    why(L, type) {
      const k = BUSINESSES[type], s = L.s;
      if (!k) return 'No such trade.';
      if (s.biz) return 'One business is plenty.';
      if (s.firm.seeded) return 'The fund helps each of us once.';
      if (L.firmBarred()) return `Not for ${L.firmBarred()} more season${L.firmBarred() > 1 ? 's' : ''}, after the last one.`;
      if (s.cash + s.bank >= L.bizCost(0)) return 'You can pay for it outright.';
      if (s.record && s.record >= 2) return 'The fund will not lend to somebody with your record.';
      return s.st[k.stats[0]] < k.skill[0] ? `Needs ${STAT_NAME[k.stats[0]]} ${k.skill[0]}.` : null;
    },
    run: (L, type) => opened(L, type, true),
  });
  function nameIt(L, name) {
    const s = L.s, c = L.firmOf(), Fm = s.firm;
    Fm.used = Fm.used.filter((x) => x !== c.name);
    c.name = name; c.named = true;
    if (!Fm.used.includes(name)) Fm.used.push(name);
    L.note(`Went into business: ${an(lowJob(L.bizName()))}, ${name}, ${L.firmAt()}.`, 'big');
    return `The signwriter comes on Tuesday. By Wednesday it says ${name} over the door, in letters you can read from the harbour.`;
  }

  // Working in it: played (firm-ui.js), and paid by how it went. x: the score, from 0 to 1 (left out, a fair spell).
  const SELF = [0.8, 1, 1.15, 1.3];
  A.bizWork.title = (L) => `Work in ${L.firmCalled()}`;
  A.bizWork.desc = (L) => {
    const c = L.firmOf();
    if (!c) return `Should bring in about ${money(L.bizTake())}.`;
    return `${TRADES[L.s.biz.type].game.titles[L.s.biz.lvl]}: about ${money(L.bizTake())}, more if it goes well. Builds its name (${Math.round(L.s.biz.rep)} of 100)${c.staff.length ? ', and the staff work better with you there' : ''}.`;
  };
  A.bizWork.why = (L, x) => {
    const c = L.firmOf();
    if (c && c.shut === L.s.t) return 'Shut by the inspector until the season is out.';
    if (c && c.strike === L.s.t) return 'The staff are out on strike.';
    return x === undefined || (typeof x === 'number' && x >= 0 && x <= 1) ? null : 'Roll your sleeves up.';
  };
  A.bizWork.run = (L, x) => {
    const s = L.s, b = s.biz, k = BUSINESSES[b.type], c = L.firmOf(), g = grade(x === undefined ? 0.5 : x);
    const got = round10(L.bizTake() * (0.9 + L.rnd() * 0.2) * SELF[g]);
    L.cash(got); s.n.earned += got;
    L.firmRep((2 + (s.st[k.stats[0]] + s.st[k.stats[1]]) / 80) / (1 + b.lvl * 0.4) + [-1, 0, 0.6, 1.2][g]);
    L.gain(k.stats[0], 0.9); L.gain(k.stats[1], 0.45); L.joy(-1);
    s.use.biz = (s.use.biz || 0) + 1;
    if (c) for (const st of c.staff) L.firmCheer(st, 1.5);
    const said = c ? TRADES[b.type].game.said[g] : L.pick(['Flat out from open to close.', 'Two complaints, twenty compliments.']);
    return `${said} ${money(got)}${c && c.staff.length && s.use.biz === 1 ? L.pick(['. The staff are glad to see you', '. Everybody works a little faster with you about', ', and the place hums']) : ''}.`;
  };
  // What a spell of your own work brings in: as before, and the way it is run, the season and a rival have a say.
  const take0 = Life.prototype.bizTake;
  Life.prototype.bizTake = function bizTake() {
    const base = take0.call(this), c = this.firmOf();
    if (!c || !base) return base;
    const price = c.price === 2 ? (this.firmDear() >= 0.85 ? 1.1 : 0.95) : [0.92, 1][c.price];
    return base * price * [0.97, 1, 1.04][c.qual] * Math.sqrt(this.firmBusy()) * (1 + 0.03 * c.fit) * (1 + 0.03 * c.lines.length) * (c.rival ? 1 - c.rival.str / 400 : 1);
  };
  // Without you it earns what its staff make of it, into its own till (see season, above), not into your pocket.
  Life.prototype.bizIdle = function bizIdle() { return 0; };
  // What it is worth: as before, and a second premises, the kit and the ideas that took.
  const worth0 = Life.prototype.bizWorth;
  Life.prototype.bizWorth = function bizWorth() {
    const base = worth0.call(this), c = this.firmOf();
    if (!c || !base) return base;
    return round100(base + (c.branch ? this.firmBranchCost() * 0.6 : 0) + c.fit * this.firmKitCost() * 0.15 + c.lines.length * BUSINESSES[this.s.biz.type].take[this.s.biz.lvl] * 0.8);
  };
  // The business's season in living.js: its age. (Its name moves with the season above.)
  Life.prototype.bizSeason = function bizSeason() { if (this.s.biz) this.s.biz.age++; };

  // Growing it: as before, and it needs more people. Or on a loan from the bank.
  const growRun = A.bizGrow.run;
  A.bizGrow.desc = (L) => `More trade, and it needs ${NEED[Math.min(3, L.s.biz.lvl + 1)] + (L.firmOf() && L.firmOf().branch ? 2 : 0)} staff to meet it.`;
  A.bizGrow.run = (L) => grown(L, growRun(L));
  function grown(L, said) {
    const s = L.s, c = L.firmOf(), b = s.biz;
    if (!c) return said;
    // (living.js has written "The business grew into a café." in the journal: the name goes on the end.)
    const e = s.log[s.log.length - 1];
    if (e && /^The business grew into/.test(e.t) && !e.t.includes(c.name)) e.t = e.t.replace(/\.$/, `: ${c.name}.`);
    if (b.lvl === 3 && !c.board) c.board = { mood: 60, t: s.t, who: pickN(L, DIRECTORS, 3) };
    drawApps(L);
    c.handsT = s.t;
    queueOnce(L, 'firmHands', null);
    return `New premises, new faces needed, and ${c.name} over the door in bigger letters. You now run ${an(lowJob(L.bizName()))}: it wants ${L.firmNeed()} staff to meet its trade.`;
  }
  def('firmGrowLoan', {
    time: 1,
    cost: (L) => round100(L.bizCost(Math.min(3, L.s.biz.lvl + 1)) * 0.25),
    show: (L) => !!L.firmOf() && L.s.biz.lvl < 3,
    why(L) {
      const s = L.s, c = L.firmOf(), lent = round100(L.bizCost(s.biz.lvl + 1) * 0.75);
      const w = A.bizGrow.why(L);
      if (w) return w;
      if (L.blacklisted()) return 'The bank remembers your bankruptcy.';
      if (c.till < 0) return 'Not with the business overdrawn.';
      return c.loan + lent > L.firmLimit() ? 'The bank will not lend the business that much.' : null;
    },
    run(L) {
      // (A quarter of the price is this action's cost; the bank's three quarters goes straight to the builders.)
      const c = L.firmOf(), lent = round100(L.bizCost(L.s.biz.lvl + 1) * 0.75);
      const said = grown(L, growRun(L));
      c.loan += lent; c.seed = false;
      return `${said} The bank has lent ${money(lent)} of it, at ${Math.round(LOAN_RATE * 1000) / 10}% a season, paid back out of the till.`;
    },
  });

  // The manager: one of the staff, or somebody from outside. x: who (left out, the best of them).
  A.bizMgr.desc = (L) => {
    const m = L.firmMgr();
    return m ? `${m.name} runs it when you are not there. Let ${m.sex === 'm' ? 'him' : 'her'} go back to the floor.` : 'One of the staff runs it when you are not there, for a third more pay. Without one, it slips.';
  };
  A.bizMgr.title = (L) => (L.firmMgr() ? 'Take back the running of it' : 'Make somebody manager');
  A.bizMgr.run = (L, x) => {
    const s = L.s, c = L.firmOf();
    if (!c) { s.biz.mgr = !s.biz.mgr; return 'Done.'; }
    const m = L.firmMgr();
    if (m && x === undefined) { c.mgr = null; s.biz.mgr = false; L.firmCheer(m, -6); return `${m.name} goes back to the floor, and you are doing the rota yourself again.`; }
    let st = x !== undefined ? L.firmStaffer(typeof x === 'object' ? x.id : x) : c.staff.slice().sort((a, b) => b.skill + b.mor / 4 - (a.skill + a.mor / 4))[0];
    if (m && st && m.id !== st.id) L.firmCheer(m, -8);
    let outside = false;
    if (!st) { st = L.firmMakeStaff({ nat: L.pick(['steady', 'grafter']), skill: L.int(50, 70), age: L.int(30, 55) }); st.known = true; c.staff.push(st); outside = true; s.firm.n.hired++; }
    c.mgr = st.id; s.biz.mgr = true;
    L.firmCheer(st, 12);
    return outside ? `${st.name} comes from a bigger place in Kettleby, with a clipboard and a firm handshake, to run ${c.name} when you are not there: ${money(L.firmWage(st))} a season.`
      : `${st.name} is the manager now, with a third more pay and a set of keys. ${L.pick(['The others pretend not to mind.', 'There is cake.', `${st.name} has the rota up by teatime.`])}`;
  };
  A.bizMgr.why = (L, x) => (x !== undefined && !L.firmStaffer(typeof x === 'object' ? x.id : x) ? 'They do not work for you.' : null);

  // Selling: as before, with its till and loan settled, and its name in the journal.
  A.bizSell.desc = (L) => {
    const c = L.firmOf(), net = L.bizWorth() + (c ? c.till - c.loan : 0);
    return c && (c.till || c.loan) ? `Someone would give ${money(L.bizWorth())} for it; with the till${c.loan ? ' and the loan' : ''} settled, ${money(net)} to you.` : `Someone would give ${money(L.bizWorth())} for it.`;
  };
  A.bizSell.run = (L) => {
    const s = L.s, c = L.firmOf(), got = L.bizWorth(), name = c ? c.name : `the ${L.firmSize()}`;
    s.cash += got;
    s.firm.n.sold++;
    if (c) closeDown(L, 'sold', got); else s.biz = null;
    L.note(`Sold ${name} for ${money(got)}.`, 'big');
    return `You hand over the keys to ${name}, and bank ${money(got)}.${c && c.staff.length ? ' The staff stay on with the new owner, who has changed the coffee.' : ''}`;
  };

  // ---- the office (firm-ui.js's sheet), and what can be done from it ----

  const bizPlace = (L) => (L.s.biz ? BUSINESSES[L.s.biz.type].place : null);
  def('firmOffice', {
    place: bizPlace, sec: 'Your business', icon: '🗝️', time: 0, open: 'firmOffice',
    title: 'The office', desc: (L) => { const c = L.firmOf(); return c ? `Prices, staff, the books${c.rival ? ', and the rival' : ''}. ${c.staff.length} of ${L.firmNeed()} staff; ${money(c.till)} in the till.` : 'Prices, staff and the books.'; },
    show: (L) => !!L.firmOf(),
  });
  // x: { k: 'price' | 'qual' | 'hours', v: 0..2 }.
  def('firmSettle', {
    time: 0,
    why(L, x) {
      const c = L.firmOf();
      if (!c) return 'No business.';
      if (!x || !['price', 'qual', 'hours'].includes(x.k) || ![0, 1, 2].includes(x.v)) return 'Pick one.';
      if (c[x.k] === x.v) return 'That is how it is now.';
      return c.set[x.k] === L.s.t ? 'Changed once already this season.' : null;
    },
    run(L, x) {
      const c = L.firmOf();
      L.firmSet(x.k, x.v);
      const T = TRADES[L.s.biz.type];
      const said = {
        price: ['New prices in the window, all of them lower. The regulars notice by Tuesday.', 'Prices back where most people expect them.', 'New prices in the window, all of them higher. Some people read them twice.'],
        qual: [`Cheaper ${T.who === 'clients' ? 'materials' : 'stock'}, from a man in a van. It will do. Probably.`, 'Back to the usual suppliers.', 'The best you can buy, and you can taste the difference. So can the till.'],
        hours: ['Shorter hours. The staff are pleased; the late crowd go elsewhere.', 'Back to the usual hours.', 'Open early, shut late. More trade, and longer faces.'],
      }[x.k][x.v];
      return `${said} (${c.name}: it shows from next season.)`;
    },
  });
  // x: an applicant's id.
  def('firmHire', {
    time: 0,
    why(L, x) {
      const c = L.firmOf();
      if (!c) return 'No business.';
      if (!c.apps.some((q) => q.id === x)) return 'They have found something else.';
      return c.staff.length >= L.firmMax() ? `No room: ${L.firmMax()} is all it can use.` : null;
    },
    run(L, x) {
      const st = L.firmTakeOn(x), c = L.firmOf();
      return `${st.name} starts on Monday, at ${money(L.firmWage(st))} a season. ${st.nat === 'cousin' ? 'Your aunt rings to say thank you, twice.' : L.pick(['First in, which is a good sign.', 'They bring their own mug.', `${c.staff.length > 1 ? 'The others show them where the kettle is.' : 'You show them where the kettle is.'}`])}`;
    },
  });
  // x: a member of staff's id. Let them go, with a season's pay.
  def('firmSack', {
    time: 0, cost: (L, x) => { const st = L.firmStaffer(x); return st ? L.firmWage(st) : 0; },
    why: (L, x) => (!L.firmStaffer(x) ? 'They do not work for you.' : null),
    run(L, x) {
      const s = L.s, st = L.firmStaffer(x), c = L.firmOf(), yrs = s.t - st.since;
      L.firmGone(st.id, 'sacked');
      L.firmCheerAll(yrs >= 12 ? -10 : -4);
      if (st.nat === 'cousin') { const p = s.people.find((q) => q.kind === 'parent') || s.people.find((q) => q.kind === 'sibling'); if (p) L.bond(p, -10); L.joy(-3); return `You let ${first(st.name)} go. Your aunt does not ring for a year, and then only to say she is not ringing.`; }
      if (st.kin != null) { const p = L.person(st.kin); if (p) L.bond(p, -15); L.joy(-5); return `You tell ${first(st.name)} it is not working. It is the worst conversation you have ever had at a kitchen table.`; }
      if (yrs >= 12) L.karma(-2);
      return `${st.name} clears out ${st.sex === 'm' ? 'his' : 'her'} locker. A season’s pay, a handshake, and ${yrs >= 12 ? `${years(yrs)} of ${c.name} in a carrier bag. The others are very quiet.` : 'no hard feelings, said by both of you.'}`;
    },
  });
  // x: where.
  def('firmBranch', {
    time: 1, cost: (L) => L.firmBranchCost(),
    why(L, x) {
      const c = L.firmOf();
      if (!c) return 'No business.';
      if (L.s.biz.lvl < 2) return `Grow it to ${an(lowJob(BUSINESSES[L.s.biz.type].names[2]))} first.`;
      if (c.branch) return 'One second premises is plenty.';
      if (!L.firmBranchPlaces().includes(x)) return 'Not there.';
      return L.s.biz.rep < 60 ? 'Build its name first (60 of 100).' : null;
    },
    run(L, x) {
      const s = L.s, c = L.firmOf();
      c.branch = { at: x, t: s.t };
      drawApps(L); c.handsT = s.t; queueOnce(L, 'firmHands', null);
      L.joy(6);
      L.note(`Opened a second ${c.name}, ${L.firmAt(x)}.`, 'big');
      return `A second ${c.name}, ${L.firmAt(x)}, with the paint still wet. It wants two more pairs of hands.`;
    },
  });
  // x: dollars. Money from your pocket into the till, or off the loan.
  def('firmPutIn', {
    time: 0, cost: (L, x) => Math.max(0, Math.round(x || 0)),
    why: (L, x) => (!L.firmOf() ? 'No business.' : !(x > 0) ? 'How much?' : null),
    run(L, x) { const c = L.firmOf(); c.till += Math.round(x); return `${money(x)} into ${c.name}’s account. ${c.till >= 0 ? 'The bank stops writing letters.' : 'It helps.'}`; },
  });
  def('firmRepay', {
    time: 0, cost: (L, x) => Math.max(0, Math.min(Math.round(x || 0), L.firmLoan())),
    why: (L, x) => (!L.firmLoan() ? 'The business owes the bank nothing.' : !(x > 0) ? 'How much?' : null),
    run(L, x) { const c = L.firmOf(), n = Math.min(Math.round(x), c.loan); c.loan -= n; if (!c.loan) c.seed = false; return c.loan ? `${money(n)} off the business loan. ${money(c.loan)} still owing.` : `The business loan is paid off. The bank manager shakes your hand, which he has not done before.`; },
  });
  // Buy the rival out, from the office.
  def('firmBuyOut', {
    time: 1, cost: (L) => L.firmRivalPrice(),
    why: (L) => { const c = L.firmOf(); return !c || !c.rival ? 'There is nobody to buy.' : c.rival.str >= 70 ? `${c.rival.who} is doing too well to sell.` : null; },
    run(L) { return L.firmBought(); },
  });
  Life.prototype.firmBought = function firmBought() {
    const s = this.s, c = this.firmOf(), R = c.rival;
    this.firmRivalEnd('bought');
    this.firmRep(5);
    c.fit = Math.min(5, c.fit + 1);
    this.note(`Bought out ${R.name}, the rival across the way. ${c.name} has its customers now.`, 'big');
    return `You buy ${R.name} lock, stock and barrel. ${R.who} shakes your hand on the step, and goes to live by a lake. Their regulars become yours, and so does their ${TRADES[c.type].kit.split(' and ')[0].replace(/^an? /, '')}.`;
  };

  // ---- the old cards about a business say its name now ----
  // (events.js: a stinker in the Gazette, and Sal's lads admiring the glass. Its "competition" card gives way to
  // the rivals here, who have names and stay.)
  const EV = (id) => EVENTS.find((e) => e.id === id);
  const named = (L, t) => { const c = L.firmOf(); return c ? t.replace(`your ${L.bizName().toLowerCase()}`, c.name) : t; };
  for (const id of ['bizReview', 'protection']) { const e = EV(id); if (e && typeof e.text === 'function') { const t0 = e.text; e.text = (L, x) => named(L, t0(L, x)); } }
  if (EV('bizRival')) EV('bizRival').w = 0;

  // ---- the cards ----

  addEvents(firmCards({ clamp, busy, nameIt, queueOnce, opened }));

  // ---- trophies ----

  Object.assign(TROPHIES, {
    firmTen: { name: 'Part of the furniture', icon: '🪑', desc: 'Keep somebody on your staff for ten years.', test: (L) => !!(L.s.firm && L.s.firm.f.ten) },
    firmSendoff: { name: 'A good send-off', icon: '🥂', desc: 'Give one of your staff a retirement do.', test: (L) => !!(L.s.firm && L.s.firm.f.sendoff) },
    firmSeenOff: { name: 'Seen off', icon: '🏁', desc: 'Outlast a rival business.', test: (L) => !!(L.s.firm && L.s.firm.f.seenOff) },
    firmBuyer: { name: 'Lock, stock and barrel', icon: '🔑', desc: 'Buy out a rival, or merge with one.', test: (L) => !!(L.s.firm && L.s.firm.f.bought) },
    firmBest: { name: 'Talk of the Bay', icon: '🌟', desc: 'Run a business with nothing but the best, and a name of 95 or more.', test: (L) => !!(L.s.firm && L.s.firm.f.best) },
    firmBlack: { name: 'In the black', icon: '📒', desc: 'Ten profitable years in a row.', test: (L) => !!(L.s.firm && L.s.firm.f.black) },
    firmPhoenix: { name: 'Back on your feet', icon: '🐦‍🔥', desc: 'Build a business up again after one went under.', test: (L) => !!(L.s.firm && L.s.firm.fail && L.s.biz && L.s.biz.lvl >= 1 && L.firmOf() && L.firmOf().since > L.s.firm.fail.t) },
    firmFamily: { name: 'The family firm', icon: '👪', desc: 'Have a son or daughter come into the business, or carry on the family’s.', test: (L) => !!(L.s.firm && L.s.firm.f.family) },
  });

  // ---- the obituary, and whoever carries on ----

  hooks.epitaph.push((L, out) => {
    const s = L.s, Fm = s.firm, c = L.firmOf();
    if (!Fm) return;
    const He = s.sex === 'f' ? 'She' : 'He', his = s.sex === 'f' ? 'her' : 'his';
    const said = [];
    if (c) {
      const big = s.biz.lvl >= 2;
      said.push(`${He} ran ${c.name}, ${an(lowJob(L.bizName()))} ${big ? 'known all over the Bay' : L.firmAt()}, for ${years(s.t - c.since)}${s.firm.n.hired >= 3 ? `, and gave ${s.firm.n.hired} people a job along the way` : ''}.`);
    }
    const sold = Fm.past.filter((p) => p.how === 'sold' || p.how === 'chain').sort((a, b) => b.got - a.got)[0];
    if (sold && !c) said.push(`${He} built up ${sold.name} and sold it, at ${sold.to}, for ${money(sold.got)}.`);
    const bust = Fm.past.find((p) => p.how === 'bust');
    if (bust) said.push(c || sold ? `Not everything ${he(s)} started lasted: ${bust.name} went under${bust.to ? ` when ${he(s)} was ${bust.to}` : ''}.` : `${bust.name}, ${his} business, went under when ${he(s)} was ${bust.to}.`);
    if (!said.length) return;
    // (In place of living.js's plainer line about the business, where there is one.)
    const i = out.findIndex((t) => /^(He|She) (built a business from a single pitch|was (his|her) own boss)/.test(t));
    if (i >= 0) out.splice(i, 1, ...said); else out.splice(Math.min(out.length, 3), 0, ...said);
  });
  const he = (s) => (s.sex === 'f' ? 'she' : 'he');
  hooks.obit.push((L, o) => {
    const s = L.s, c = L.firmOf(), Fm = s.firm;
    if (c && !s.job && o.title && o.title.startsWith('Ran ')) o.title = `Ran ${c.name}`;
    // What goes with the heir: the names the family has used, and the business as it stands.
    for (const k of o.carry || []) {
      k.firmUsed = Fm ? Fm.used.slice() : [];
      if (k.biz && c) k.firm = carryOf(L, c, k);
    }
  });
  function carryOf(L, c, k) {
    const s = L.s;
    return {
      name: c.name, price: c.price, qual: c.qual, hours: c.hours, fit: c.fit, lines: c.lines.slice(), tried: c.tried.slice(), branch: c.branch, cousin: c.cousin, board: c.board,
      since0: c.since0 ?? c.since, from0: c.from0 ?? c.from, rival: c.rival, mgr: c.mgr,
      staff: c.staff.map((st) => ({ ...JSON.parse(JSON.stringify(st)), heir: st.kin != null && st.kin === k.pid, served: s.t - st.since })),
    };
  }
  // The heir's start (chapters.js): the business comes with its name, its people and its ways.
  const begin0 = Life.prototype.chapBegin;
  if (begin0) {
    Life.prototype.chapBegin = function chapBegin(carry, dreams) {
      const r = begin0.call(this, carry, dreams);
      const s = this.s;
      if (!s.firm) s.firm = blank();
      const Fm = s.firm;
      if (carry && Array.isArray(carry.firmUsed)) for (const n of carry.firmUsed) if (!Fm.used.includes(n)) Fm.used.push(n);
      if (s.biz && carry && carry.firm) {
        const d = carry.firm, gap = carry.gap || 0, ids = {};
        Fm.cur = null;
        const c = setUp(this, d.name, d);
        let was = null;
        for (const q of d.staff || []) {
          if (q.heir) { was = q; continue; }
          const st = JSON.parse(JSON.stringify(q));
          delete st.heir; delete st.served;
          st.age = q.age + gap; st.since = s.t - Math.min(120, (q.served || 0) + gap * 4); st.id = Fm.sid++; st.pair = null;
          ids[q.id] = st.id;
          // (A brother or sister who worked there is still one; otherwise, just somebody who has been there for ever.)
          if (st.kin != null) { const sib = s.people.find((p) => p.kind === 'sibling' && first(p.name) === first(st.name)); st.kin = sib ? sib.id : null; if (!sib) st.nat = 'steady'; }
          if (st.age < 67) c.staff.push(st);
        }
        if (d.mgr != null && ids[d.mgr] != null && c.staff.some((st) => st.id === ids[d.mgr])) c.mgr = ids[d.mgr];
        else if (s.biz.mgr) {
          const m = c.staff.slice().sort((a, b) => b.skill - a.skill)[0];
          if (m) c.mgr = m.id; else { const st = this.firmMakeStaff({ nat: 'steady', skill: 55, age: 45 }); st.known = true; c.staff.push(st); c.mgr = st.id; }
        }
        if (d.rival && carry.how !== 'back') c.rival = { ...d.rival, beat: s.t };
        Fm.f.family = 1;
        drawApps(this);
        this.note(`Took on the family business, ${c.name}${was ? `, where you had worked since you were ${Math.max(18, was.age - Math.floor((was.served || 0) / 4))}` : ''}.`, 'big');
      }
      sync(this);
      return r;
    };
  }
}
