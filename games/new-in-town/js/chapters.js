// New in Town: the chapters of a life, old age, and what you leave behind.
//
// Chapters: at thirty, forty-five and sixty a crossroads card looks back on
// the chapter just gone, in a few plain sentences made from what actually
// happened (the journal's big moments are kept as they happen: see marks),
// and offers new dreams in place of those that came true or are out of
// reach now. A few dreams are for later life only.
//
// Old age: from about sixty-five there is play of its own. A hip, and a
// heart, that want operating on (and a choice about each); memoirs to
// write; the big house, to keep or to sell; grandchildren to mind; the old
// crowd to have lunch with (soul.js has the funerals, when they go); one
// last adventure; the solicitor. The body slows, and it says so. When a
// natural death is due (the old-age dice, or health run out after 65) it is
// held off and becomes a last illness instead: the doctor's news, met with
// grace or fought, a few seasons of goodbyes (a party, a last summer, a
// letter to whoever carries on), and a last morning. The end is seen coming.
//
// The will: who carries on, who gets the house, the business, the money and
// the keepsakes, and whether the town gets something with your name on it.
// Death duty is plain: the first $250,000 is free, half is taken of the rest
// up to $2,000,000, and four-fifths of anything above that. The family home
// and a business handed on pass free of it, so does anything left to the
// town, and so does money given to the family in life, up to $25,000 a year
// each, if you live five years after giving it. The Me tab says, all along,
// what the heir would get.
//
// The heir: the next life is a real person from this one. A grown child (or
// grandchild) starts at their own age, in town, with their own job, family
// and home, and whatever the will gave them; one who was still a child comes
// back to the Bay at eighteen; with nobody at all, a distant cousin steps off
// the train as before. Heirlooms and ribbons are untouched.
//
// Everything is kept in s.chap.

import { DREAMS, TROPHIES, HOMES, ITEMS, CAREERS, PLACES, COURSES, GIFTS, BUSINESSES, STATS, STAT_NAME, BACKGROUNDS, QUESTS, SHIFTS_FOR_RUNG, money, low, an, lowJob } from './data.js';

// ---- the plain numbers ------------------------------------------------------------------

export const CROSS = [30, 45, 60];
export const DUTY = { free: 250000, mid: 2000000, low: 0.5, high: 0.8 };
export const SETTLE = [5000, 25000]; // what can be given each year, to each of the family
export const GIFT_YEARS = 5; // a gift is free of duty once you have lived this long after it
export const MEMO = 8; // sittings to write your memoirs
// What passes to the heir with the house: things a family keeps.
export const KEEPSAKES = ['watch', 'ring', 'piano', 'guitar', 'easel', 'books', 'rod', 'boat', 'surfboard', 'weights'];
const AGE_WORD = { 30: 'thirty', 45: 'forty-five', 60: 'sixty' };
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = (n) => NUM[n] || (n > 20 && n < 100 ? `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${NUM[n % 10]}` : ''}` : String(n));
const cap = (t) => t[0].toUpperCase() + t.slice(1);
const list = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);
const first = (p) => p.name.split(' ')[0];
const he = (p) => (p.sex === 'm' ? 'he' : 'she');
const him = (p) => (p.sex === 'm' ? 'him' : 'her');
const his = (p) => (p.sex === 'm' ? 'his' : 'her');
const He = (p) => cap(he(p));
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
export const homeSaid = (kind) => (kind === 'manor' ? 'Starling Manor' : `the ${low(HOMES[kind].name)}`);

// What the town takes of money left behind.
export function dutyOn(n) {
  const v = Math.max(0, n);
  if (v <= DUTY.free) return 0;
  return Math.round((Math.min(v, DUTY.mid) - DUTY.free) * DUTY.low + Math.max(0, v - DUTY.mid) * DUTY.high);
}

// ---- dreams for later in life -----------------------------------------------------------

// open(s): whether it could be dreamt yet (never at eighteen: s.age is missing on the start screen).
const older = (s, n) => (s.age || 18) >= n;
export const LATE_DREAMS = {
  chapClear: { name: 'Free and clear', icon: '🔑', desc: 'Own the home you live in, and owe nobody a penny.', test: (L) => L.s.owned && L.s.debt <= 0 && L.s.sloan <= 0 && !(L.s.shark > 0), open: (s) => older(s, 30) },
  chapMend: { name: 'Bury the hatchet', icon: '🕊️', desc: 'Make peace with somebody you fell out with.', test: (L) => (L.s.n.mended || 0) >= 1, open: (s) => older(s, 30) && (s.people || []).some((p) => p.kind === 'enemy' || p.kind === 'ex') },
  chapGrand: { name: 'Grandchildren', icon: '👶', desc: 'Hold a grandchild of your own.', test: (L) => L.grandkids().length >= 1, open: (s) => older(s, 40) && (s.people || []).some((p) => p.kind === 'child') },
  chapTeach: { name: 'Pass it on', icon: '🧶', desc: 'Teach a grandchild something you know.', test: (L) => (L.s.chap.n.taught || 0) >= 1, open: (s) => older(s, 50) && (s.people || []).some((p) => p.kind === 'grandchild' || p.kind === 'child') },
  chapMemoir: { name: 'My life in print', icon: '📜', desc: 'Write your memoirs.', test: (L) => !!L.s.chap.memo.done, open: (s) => older(s, 45) },
  chapAdventure: { name: 'One last adventure', icon: '🎈', desc: 'Have one more great adventure, after seventy.', test: (L) => !!L.s.chap.old.adv, open: (s) => older(s, 55) },
  chapOrder: { name: 'Affairs in order', icon: '🗝️', desc: 'Make a will, and give something to the family while you are here to see it.', test: (L) => !!L.s.chap.will.made && (L.s.chap.n.settled || 0) > 0, open: (s) => older(s, 50) },
  chapNinety: { name: 'A good innings', icon: '🎂', desc: 'Live to ninety.', test: (L) => L.s.age >= 90, open: (s) => older(s, 55) },
};
const LATE = new Set(Object.keys(LATE_DREAMS));

// Dreams that are as good as out of reach, at this point in a life.
const inJob = (L, c, r = 0) => !!L.s.job && L.s.job.c === c && L.s.job.r >= r;
const FAR = {
  doctor: (L) => L.s.age >= 62 || (L.s.age >= 42 && !inJob(L, 'medicine')) || (L.s.retired && !inJob(L, 'medicine')),
  mayor: (L) => L.s.age >= 64 || (L.s.age >= 50 && !inJob(L, 'politics')),
  top: (L) => L.s.age >= 62 || (L.s.retired && !L.s.job),
  family: (L) => (L.kids().length < 2 && L.s.age >= 56) || (!L.s.f.wed && !L.partner() && L.s.age >= 60),
  iron: (L) => L.s.age >= 60 || (L.s.age >= 50 && L.s.st.fitness < 75),
  star: (L) => L.s.age >= 70 && L.s.fame < 40,
  crowd: (L) => L.s.age >= 70 && L.followers() < 20000,
  record: (L) => L.s.age >= 70 && !L.s.f.hit,
  pet: (L) => L.s.age >= 82 && !(L.s.pet && L.s.t - L.s.pet.since >= 24),
  degree: (L) => L.s.age >= 75,
  boss: (L) => L.s.age >= 75 && !L.s.biz,
  chapAdventure: (L) => L.s.age >= 86 || L.s.health < 30,
  chapNinety: () => false,
};
const far = (L, id) => !!FAR[id] && !L.s.dreamDone[id] && FAR[id](L);
const holds = (L, id) => { try { return !!DREAMS[id].test(L); } catch (e) { return false; } };
const opens = (s, id) => !DREAMS[id].open || DREAMS[id].open(s);

// ---- the moments that matter ------------------------------------------------------------

// How much a line in the journal counts towards the story of a life: [pattern, weight, group, which of a group to keep].
// A group keeps one line: the first, the last, or the biggest. Lines with no group are kept once each.
const WEIGH = [
  [/^Died at /, 0],
  [/^Married /, 10],
  [/^Won the election for mayor/, 10, 'mayor'],
  [/ was born\.$|^Adopted /, 9],
  [/^Lost /, 9],
  [/^A dream came true/, 8],
  [/bestseller|went to number one|golden bream|treasure of the Merrow|medal for gallantry|Robbed Harbour Bank|Supreme champion|Lotto jackpot|clean peal/i, 8],
  [/^Gave the town |^Left the town /, 7],
  [/^Divorced /, 7],
  [/^Bought (the|Starling) .*(villa|Manor)/, 7, 'home', 'max'],
  [/^Bought the .* for \$/, 4, 'home', 'max'],
  [/^One last adventure/, 7],
  [/^Wrote (your|his|her) memoirs/, 6],
  [/^Declared bankrupt/, 6, 'bust', 'first'],
  [/^Sent to Starling Gaol/, 6, 'gaol', 'first'],
  [/^Published a novel/, 6, 'novel', 'max'],
  [/^Made a record/, 6, 'record', 'max'],
  [/^Retired/, 6, 'retired', 'first'],
  [/^Promoted to /, 5, 'promo', 'last'],
  [/^Went into business|^The business grew|^Took on Betty/, 5, 'biz', 'last'],
  [/^Passed out as crew|^Made second coxswain|^Made Helm/, 5, 'lifeboat', 'last'],
  [/^Had a new (hip|heart)/, 3, 'op', 'max'],
  [/^Sacked as|^Laid off as/, 4, 'sacked', 'first'],
  [/^Got engaged/, 4],
  [/^Heard the whole of/, 4, 'story', 'first'],
  [/^Moved in with/, 3],
  [/^Stepped off the train|^Took up the family|^Came back to Starling Bay/, 3, 'start', 'first'],
  [/^Won a red rosette/, 3, 'rosette', 'first'],
  [/^Walked out of Starling Gaol/, 2, 'out', 'last'],
  [/^Started seeing |^Split up with /, 2],
];
// (The fourth thing given back is the kind of moment it is: the highlights of a life take a few of each kind.)
function weigh(text, kind) {
  for (let i = 0; i < WEIGH.length; i++) { const [re, w, g, keep] = WEIGH[i]; if (re.test(text)) return [w, g || null, keep || 'max', i]; }
  return [kind === 'love' || kind === 'big' ? 4 : 0, null, 'max', -1];
}
function mark(C, e, t) {
  const [w, g, keep] = weigh(e.t, e.k);
  if (w <= 0 || C.marks.some((o) => o.x === e.t)) return;
  const m = { a: e.a, t, x: e.t, w, g };
  if (g) {
    const i = C.marks.findIndex((o) => o.g === g);
    if (i >= 0) {
      const o = C.marks[i];
      if (keep === 'last' ? m.w >= o.w : keep === 'max' ? m.w > o.w : false) C.marks[i] = m;
      return;
    }
  }
  C.marks.push(m);
  if (C.marks.length > 80) {
    let lo = 0;
    for (let i = 1; i < C.marks.length; i++) if (C.marks[i].w < C.marks[lo].w) lo = i;
    C.marks.splice(lo, 1);
  }
}

// ---- the state --------------------------------------------------------------------------

function blank() {
  return {
    v: 1, cross: {}, snap: null, past: [], was: [], marks: [], start: null,
    will: { made: null, heir: null, home: 'heir', biz: 'heir', split: 'fair', town: null },
    gifts: [], yr: {}, memo: { p: 0, q: 0, done: null },
    old: { hip: null, hipAt: null, mend: null, heart: null, mind: null, lunch: null, adv: null, down: null, kid: null, lift: 0 },
    dusk: null, letter: null, par: null, out: null,
    n: { taught: 0, minded: 0, settled: 0 },
  };
}

// Where a chapter starts from, to see later what came of it.
function snapNow(L) {
  const s = L.s, j = s.job;
  return {
    t: s.t, age: s.age, worth: L.netWorth(), home: s.home, owned: !!s.owned, shifts: s.n.shifts, retired: !!s.retired,
    job: j ? { c: j.c, r: j.r, title: CAREERS[j.c].rungs[j.r].title } : null, biz: s.biz ? s.biz.lvl : null,
    pt: L.partner() ? L.partner().id : null,
  };
}

const KIN_KIND = (p) => p.kind === 'child' || p.kind === 'grandchild';
const relOf = (p) => (p.kind === 'child' ? (p.sex === 'm' ? 'son' : 'daughter') : p.kind === 'grandchild' ? (p.sex === 'm' ? 'grandson' : 'granddaughter') : 'cousin');
// What the heir called the one who died.
const calledBy = (s, kind) => (kind === 'grandchild' ? (s.sex === 'f' ? 'Gran' : 'Grandad') : s.sex === 'f' ? 'Mum' : 'Dad');

// How likely somebody is to carry on, all else equal: close, and with some life ahead of them.
function heirScore(p) {
  const young = p.age < 18 ? 0 : p.age < 45 ? 15 : p.age < 55 ? 5 : -15;
  return p.bond + young + (p.kind === 'child' ? 5 : 0);
}

// The grown-up stats of somebody from the last life, for an heir who starts at their own age.
function grownStats(p) {
  const st = {};
  const job = p.job && CAREERS[p.job] && !CAREERS[p.job].shady ? CAREERS[p.job] : null;
  const yrs = clampN(p.age - 18, 0, 30);
  for (const k of STATS) {
    let v = p.st ? p.st[k] : 14 + Math.min(18, p.age) * 1.1 + (p.taught === k ? 12 : 0);
    if (p.age >= 18) v += job && job.stats.includes(k) ? yrs * 1.1 : yrs * 0.35;
    st[k] = Math.round(clampN(v, 5, job && job.stats.includes(k) ? 82 : 60));
  }
  return st;
}

// ---- install ----------------------------------------------------------------------------

export function install({ def, A, Life, clamp, val, hooks, addEvents }) {
  Object.assign(DREAMS, LATE_DREAMS);

  Object.assign(Life.prototype, {
    // ---- chapters ----
    chapNext() { return CROSS.find((a) => this.s.chap.cross[a] == null) || null; },
    chapName(age = this.s.age) { return age < 30 ? 'Finding your feet' : age < 45 ? 'The thick of it' : age < 60 ? 'The long middle' : age < 75 ? 'The long view' : 'The last stretch'; },
    // The biggest moments of the life, in the order they happened (never the same line twice).
    // (Each further moment of the same kind counts for a little less, so that six dreams come true do not crowd out a wedding.)
    chapHighlights(n = 9) {
      const C = this.s.chap, seen = new Set(), took = {}, top = [];
      const pool = C.marks.filter((m) => (seen.has(m.x) ? false : (seen.add(m.x), true)));
      while (top.length < n && pool.length) {
        let best = -1, bw = -Infinity;
        pool.forEach((m, i) => { const k = weigh(m.x, 'big')[3], v = m.w - 2.5 * (took[k] || 0); if (v > bw || (v === bw && m.t < pool[best].t)) { bw = v; best = i; } });
        const m = pool.splice(best, 1)[0], k = weigh(m.x, 'big')[3];
        took[k] = (took[k] || 0) + 1;
        top.push(m);
      }
      return top.sort((a, b) => a.t - b.t || a.a - b.a).map((m) => ({ a: m.a, t: m.x }));
    },
    chapFar(id) { return far(this, id); },

    // ---- the will ----
    // Who could carry on: children and grandchildren.
    chapCands() { return this.s.people.filter(KIN_KIND); },
    // Who will carry on: the one the will names, or else the likeliest.
    chapHeir() {
      const s = this.s, w = s.chap.will, named = w.heir != null ? this.person(w.heir) : null;
      if (named && KIN_KIND(named)) return named;
      const c = this.chapCands();
      if (!c.length) return null;
      const best = (l) => l.slice().sort((a, b) => heirScore(b) - heirScore(a) || a.id - b.id)[0];
      const kid = best(c.filter((p) => p.kind === 'child'));
      // (A child of sixty or more would have little life left to play: a grown grandchild who is close carries on instead.)
      const gk = kid && kid.age >= 60 ? best(c.filter((p) => p.kind === 'grandchild' && p.age >= 18 && p.bond >= 30)) : null;
      return gk || kid || best(c);
    },
    chapSpouse() { return this.s.people.find((p) => p.kind === 'spouse') || null; },
    // What the will would do if it were read today.
    chapEstate() {
      const s = this.s, C = s.chap, w = C.will, heir = this.chapHeir(), spouse = this.chapSpouse();
      const worth = this.netWorth(), homeE = this.homeEntry();
      let home = homeE && heir && w.home === 'heir' ? { kind: homeE.kind, value: this.propValue(homeE), ups: { ...homeE.ups } } : null;
      let biz = s.biz && heir && w.biz === 'heir' ? { ...s.biz, value: this.bizWorth(), name: this.bizName() } : null;
      let money = worth - (home ? home.value : 0) - (biz ? biz.value : 0);
      // (Debts are paid first: if the money will not stretch, the business and then the house are sold.)
      if (money < 0 && biz) { money += biz.value; biz = null; }
      if (money < 0 && home) { money += home.value; home = null; }
      let town = null;
      if (w.town && GIFTS[w.town] && !s.gifts[w.town]) {
        const cost = GIFTS[w.town].cost;
        town = { id: w.town, cost, ok: money >= cost };
        if (town.ok) money -= cost;
      }
      money = Math.max(0, money);
      const recent = C.gifts.filter((g) => s.t - g.t < GIFT_YEARS * 4).reduce((a, g) => a + g.n, 0);
      const toSpouse = w.split === 'spouse' && !!spouse;
      const duty = toSpouse ? 0 : Math.min(money, Math.round(dutyOn(money + recent) - dutyOn(recent)));
      const left = money - duty;
      // Who gets what of the money.
      const shares = [];
      const kids = this.kids();
      if (toSpouse) shares.push({ p: spouse.id, n: left });
      else if (!heir) shares.push({ p: null, n: left });
      else {
        const all = kids.slice();
        if (!all.includes(heir)) all.push(heir);
        if (w.split === 'heir' && all.length > 1) {
          // (Half to the one who carries on, and the other half shared among them all.)
          const half = Math.round(left / 2), each = Math.floor((left - half) / all.length);
          for (const p of all) shares.push({ p: p.id, n: p === heir ? half + each : each });
        } else for (const p of all) shares.push({ p: p.id, n: Math.floor(left / all.length) });
      }
      const keep = heir || !kids.length ? KEEPSAKES.filter((id) => s.items[id]) : [];
      const mine = shares.find((q) => q.p === (heir ? heir.id : null));
      return { worth, heir: heir ? heir.id : null, home, biz, town, money, recent, duty, left, shares, keep, toSpouse, heirMoney: mine ? mine.n : 0 };
    },
    // A one-line summing-up of what someone would be left: "the cottage, your guitar and $84,000".
    chapLeaves(est, pid, mine = true) {
      const s = this.s, out = [];
      if (pid === est.heir || (pid == null && est.heir == null)) {
        if (est.home) out.push(homeSaid(est.home.kind));
        if (est.biz) out.push(`the ${lowJob(est.biz.name)}`);
        const k = est.keep.map((id) => low(ITEMS[id].name));
        if (k.length) out.push(`${mine ? 'your' : s.sex === 'f' ? 'her' : 'his'} ${k.length > 3 ? `${k.slice(0, 2).join(', ')} and other keepsakes` : list(k)}`);
      }
      const sh = est.shares.find((q) => q.p === pid);
      if (sh && sh.n > 0) out.push(money(sh.n));
      return out;
    },
    // Money given to each of the family in life, and whether it is clear of duty yet.
    chapGiven(pid) { return this.s.chap.gifts.filter((g) => g.p === pid); },

    // ---- old age ----
    chapDusk() { return this.s.chap.dusk; },
    chapDuskWord() {
      const D = this.s.chap.dusk;
      if (!D) return '';
      return D.left >= 6 ? 'more than a year, the doctor thinks' : D.left >= 4 ? 'a year or so, the doctor thinks' : D.left >= 2 ? 'a few months, the doctor thinks' : 'not long now';
    },
    chapMindKids() { return this.grandkids().filter((g) => g.age < 11); },

    // ---- the start of a life: the heir, in their own circumstances ----
    // carry: from chapCarry in the life before (see the obituary). dreams: the three chosen.
    chapBegin(carry, dreams) {
      const s = this.s, C = s.chap;
      const log0 = s.log.find((e) => /^Stepped off the train/.test(e.t));
      const relabel = (text) => {
        if (log0) { C.marks = C.marks.filter((m) => m.x !== log0.t); log0.t = text; mark(C, log0, s.t); }
      };
      if (!carry) { C.start = { how: 'train', age: 18 }; C.snap = snapNow(this); return; }
      C.start = { how: carry.how, age: carry.how === 'home' ? carry.age : 18, rel: carry.rel, from: carry.from, called: carry.called, left: carry.how === 'back' ? 18 - (carry.gap || 0) : null, said: carry.said || '', letter: carry.letter || null };
      // The town is the one the last life left (annals.js).
      if (carry.town && this.annalsTakeOn) this.annalsTakeOn(carry.town, carry.how, carry.how === 'home' ? clampN(Math.round(carry.age), 18, 95) : 18);
      // Keepsakes come with whoever carries on.
      for (const id of carry.items || []) if (ITEMS[id]) s.items[id] = 1;
      const moveIn = (h) => {
        if (!h || !HOMES[h.kind]) return null;
        const e = { id: s.eid++, kind: h.kind, ups: { ...(h.ups || {}) }, let: false };
        s.estate.push(e);
        return e;
      };
      if (carry.how === 'train') { C.snap = snapNow(this); return; }
      // What came in the will is in the bank.
      const inherited = Math.max(0, Math.round(carry.money || 0));
      s.cash = Math.max(0, s.cash - inherited);
      s.bank += inherited + Math.max(0, Math.round(carry.purse || 0));
      if (carry.biz && BUSINESSES[carry.biz.type]) s.biz = { type: carry.biz.type, lvl: carry.biz.lvl, rep: carry.biz.rep, mgr: carry.how === 'back' ? true : !!carry.biz.mgr, age: carry.biz.age || 0, at: s.t };
      if (carry.how === 'back') {
        // Grown up somewhere else, and back at eighteen; the house was let in the meantime.
        const e = moveIn(carry.home);
        if (e && !this.liveWhy(e.kind, e)) this.settleIn(e.kind, e); else if (e) e.let = true;
        relabel(`Came back to Starling Bay at eighteen, where you were born, with one suitcase and ${money(s.cash + s.bank)}.`);
        C.snap = snapNow(this);
        return;
      }
      // A grown-up who has always lived here.
      const age = clampN(Math.round(carry.age), 18, 95);
      s.age = age;
      s.health = Math.round(Math.min(this.healthCap(), 94 - Math.max(0, age - 30) * 0.45 + (s.heir === 'young' ? 6 : 0)));
      const give = (BACKGROUNDS[s.bg] && BACKGROUNDS[s.bg].give) || {};
      for (const k of STATS) s.st[k] = clampN(Math.max(s.st[k], (carry.st ? carry.st[k] : 0) + (give[k] || 0)), 0, 95);
      s.quest = QUESTS.length;
      s.bank += Math.min(60000, (age - 18) * 1500);
      s.n.shifts = Math.min(200, (age - 18) * 8);
      // Work: the job they had, as far up as their years would have taken them.
      const car = carry.job && CAREERS[carry.job] && !CAREERS[carry.job].shady ? CAREERS[carry.job] : null;
      if (car) {
        let r = clampN(Math.floor((age - 18) / 7), 0, car.rungs.length - 2);
        while (r > 0 && Object.keys(car.rungs[r].need).some((k) => ['flag', 'crimes', 'bad'].includes(k))) r--;
        const need = car.rungs[r].need;
        for (const k of STATS) if (need[k] && s.st[k] < need[k]) s.st[k] = need[k];
        for (let i = 1; i <= r; i++) { const e = car.rungs[i].need.edu; if (e && !this.hasEdu(e)) s.edu[e] = { a: 21, g: 1 }; }
        if (need.degree && !this.hasDegree()) s.edu.business = { a: 22, g: 1 };
        if (need.item) s.items[need.item] = 1;
        if (need.karma) s.karma = Math.max(s.karma, need.karma);
        if (need.fame) s.fame = Math.max(s.fame, need.fame);
        s.worked[carry.job] = r;
        if (car.retire && age >= car.retire) s.job = null;
        else if (age >= 66) { s.retired = true; s.pension = Math.round(car.rungs[r].pay * 1.2 / 10) * 10 + (age >= 67 ? 1500 : 0); s.f.jobPension = s.pension - (age >= 67 ? 1500 : 0); }
        else s.job = { c: carry.job, r, n: Math.floor((SHIFTS_FOR_RUNG[r + 1] || 0) * 0.4), perf: 55, raise: 0 };
      } else if (age >= 67) { s.retired = true; s.pension = 1500; }
      // Their own family.
      const pt = !carry.single && age >= 22 ? this.makePerson({ kind: 'spouse', sex: s.into === 'b' ? (this.chance(0.5) ? 'm' : 'f') : s.into, age: clampN(age + this.int(-4, 4), 20, 95), bond: 64, single: false }) : null;
      if (pt) { s.people.push(pt); s.f.wed = 1; }
      for (const k of carry.kids || []) {
        const p = this.makePerson({ name: k.name, sex: k.sex, kind: 'child', bond: 58, age: k.age, look: k.look, single: k.age >= 18 && this.chance(0.5), ...(k.age >= 18 && k.job ? { job: k.job } : {}), ...(k.trait ? { trait: k.trait } : {}) });
        if (k.age >= 18) p.st = p.st || Object.fromEntries(STATS.map((q) => [q, 30]));
        s.people.push(p);
        // (Grown children of their own may have made them a grandparent already.)
        if (k.age >= 27) {
          p.gk = this.int(0, Math.min(2, Math.floor((k.age - 23) / 4)));
          for (let i = 0; i < p.gk; i++) { const g = this.grandchild(p); g.age = this.int(0, k.age - 26); g.bond = 45; if (g.age >= 18) { g.single = true; this.fillPerson(g); } }
        }
      }
      // Two old friends from school, still about.
      for (let i = 0; i < 2; i++) s.people.push(this.makePerson({ kind: 'friend', bond: 40 + this.int(0, 12), age: clampN(age + this.int(-3, 3), 18, 95) }));
      // Somewhere to live: the family home if it was left to them and the children fit, else a rented place.
      const young = this.kids().filter((k) => k.age < 18).length;
      const e = moveIn(carry.home);
      if (e && !this.liveWhy(e.kind, e)) this.settleIn(e.kind, e);
      else {
        if (e) e.let = true;
        const r = s.job ? s.job.r : 2;
        const want = ['bedsit', 'flat', 'cottage', 'townhouse'].find((k) => HOMES[k].kids >= young && HOMES[k].tier >= (r >= 4 ? 3 : r >= 2 ? 2 : 1)) || 'townhouse';
        this.settleIn(want, null);
      }
      for (const p of s.people) if (p.kind === 'spouse') p.live = s.home !== 'hostel';
      // Brothers and sisters remember how the will went.
      for (const p of this.siblings()) if (carry.sibBond) p.bond = carry.sibBond;
      // Money left to the parent who is still living comes down in time.
      const par = s.people.find((p) => p.kind === 'parent');
      if (par && carry.parPurse > 0) C.par = { pid: par.id, purse: Math.round(carry.parPurse) };
      // The town has known them all their life.
      if (s.folk && carry.folk && this.folkWarm) for (const [id, f] of Object.entries(carry.folk)) if (s.folk.p[id] && id !== 'parg') this.folkWarm(id, f, false);
      for (const a of CROSS) if (age >= a) C.cross[a] = -1;
      relabel(`Took up the family’s story at ${age}, after ${carry.called}’s funeral.`);
      if (dreams && dreams.length) {
        const keep = [...new Set(dreams.filter((id) => DREAMS[id]))].slice(0, 3);
        for (const id of s.dreams) if (keep.length < 3 && !keep.includes(id)) keep.push(id);
        s.dreams = keep;
      }
      s.time = this.timeMax();
      C.snap = snapNow(this);
    },
    // The card that begins a life: null for one that steps off the train.
    chapIntro() {
      const s = this.s, C = s.chap, st = C.start;
      if (!st || st.how === 'train') return null;
      const ltr = st.letter || null;
      const left = st.said || '';
      if (st.how === 'back') {
        return {
          icon: '🚂', title: 'Starling Bay, again',
          text: [`You were ${num(st.left)} when ${st.called} died, and you went to live with family up the line. Now the train brings you back, eighteen, with one suitcase.`, `${left}${s.owned ? ` The house is yours: the tenants have gone, and Betty at the café has kept the keys for you.` : ''} The gulls have not changed at all.`],
          letter: ltr,
          btn: 'Pick up the suitcase',
        };
      }
      const fam = [];
      const pt = this.partner();
      if (pt) fam.push(first(pt));
      const kids = this.kids();
      if (kids.length) fam.push(kids.length === 1 ? first(kids[0]) : `the ${num(kids.length)} children`);
      return {
        icon: '🕯️', title: 'After the funeral',
        text: [`Everybody has gone home from St Brigid’s. You are ${s.age}, ${s.job ? an(lowJob(this.jobTitle())) : s.retired ? 'retired' : 'between jobs'}, back in ${homeSaid(s.home)}${fam.length ? ` with ${list(fam)}` : ''}, and it is very quiet.`, `${left} The rest is up to you.`],
        letter: ltr,
        btn: 'Carry on',
      };
    },
  });

  // ---- the Gazette, at the end ----

  // How the obituary's first line begins, for a life that did not start on the train.
  Life.prototype.chapOpening = function () {
    const s = this.s, st = s.chap && s.chap.start;
    if (!st || st.how === 'train') return null;
    if (st.how === 'back') return `${s.name}, who was born in Starling Bay, left it as a child and came back at eighteen, has died at ${s.age}.`;
    return `${s.name}, who was born in Starling Bay and lived there all ${s.sex === 'f' ? 'her' : 'his'} life, has died at ${s.age}.`;
  };
  // How the life began: 'train' (off the train at 18), 'back' (born here, home again at 18) or 'home' (lived here all along).
  Life.prototype.chapHow = function () { const st = this.s.chap && this.s.chap.start; return (st && st.how) || 'train'; };
  // How the end screen says where the life began.
  Life.prototype.chapOrigin = function () {
    const st = this.s.chap && this.s.chap.start;
    if (!st || st.how === 'train') return 'Came to Starling Bay at 18.';
    return st.how === 'back' ? 'Born in Starling Bay; came home at 18.' : `Born in Starling Bay; took up the family’s story at ${st.age}.`;
  };

  // ---- the heir, and what comes with them ----

  // Everything the next life needs to start as person p (or as a distant cousin, with p null).
  function carryFor(L, est, p) {
    const s = L.s, w = s.chap.will, mineIs = (q) => q && q.id === est.heir;
    const kids = L.kids(), named = mineIs(p);
    const sh = est.shares.find((q) => q.p === (p ? p.id : null));
    const moneyIn = sh ? sh.n : 0;
    const base = { from: s.name, fromSex: s.sex, gen: s.gen + 1, items: named || !p ? est.keep.slice() : [], money: moneyIn, home: named && est.home ? { kind: est.home.kind, ups: est.home.ups } : null, biz: named && est.biz ? { type: est.biz.type, lvl: est.biz.lvl, rep: est.biz.rep, mgr: est.biz.mgr, age: est.biz.age } : null };
    if (!p) return { ...base, how: 'train', rel: 'cousin', called: 'your cousin', age: 18, purse: 0, sibs: null, parent: null, st: null };
    const gap = p.age < 18 ? 18 - p.age : 0;
    const how = gap ? 'back' : 'home';
    const called = calledBy(s, p.kind);
    // Brothers and sisters: the others of the same generation.
    const same = p.kind === 'child' ? kids.filter((k) => k !== p) : L.grandkids().filter((g) => g !== p && g.of === p.of);
    const sibs = same.filter((k) => k.age + gap >= 18).slice(0, 3).map((k) => ({ name: first(k), sex: k.sex, age: k.age + gap, look: k.look, job: k.job, trait: k.trait }));
    // A parent still living: the husband or wife left behind, or the grandchild's own mother or father.
    const spouse = L.chapSpouse();
    let parent = null, parPurse = 0;
    if (p.kind === 'child' && spouse) { parent = { name: spouse.name, age: spouse.age + gap, look: spouse.look, sex: spouse.sex }; if (est.toSpouse) parPurse = est.left; }
    if (p.kind === 'grandchild') {
      const mum = L.person(p.of);
      if (mum) { parent = { name: mum.name, age: mum.age + gap, look: mum.look, sex: mum.sex }; const m = est.shares.find((q) => q.p === mum.id); parPurse = (m ? m.n : 0) + (mum.purse || 0); }
    }
    const fair = !est.toSpouse && w.split === 'heir' && sibs.length ? (named ? 22 : 40) : 50;
    const st = how === 'home' ? grownStats(p) : (p.st ? Object.fromEntries(STATS.map((k) => [k, Math.min(100, p.st[k] + gap * 1.4)])) : Object.fromEntries(STATS.map((k) => [k, 20 + (p.taught === k ? 14 : 0)])));
    const own = how === 'home' ? L.grandkids().filter((g) => g.of === p.id).map((g) => ({ name: first(g), sex: g.sex, age: g.age, look: g.look, job: g.job, trait: g.trait })) : [];
    // (Nobody in the last life knew whether a grown child had married: those with children had, and some others.)
    const single = how !== 'home' || p.age < 24 ? true : own.length ? false : (p.id * 7 + p.age) % 3 === 0;
    const folk = {};
    if (how === 'home' && s.folk) for (const [id, f] of Object.entries(s.folk.p)) if (f.f >= 25) folk[id] = Math.min(30, Math.round(f.f * 0.4));
    return {
      ...base, how, pid: p.id, rel: relOf(p), called, age: p.age + gap, gap, name: first(p), sex: p.sex, look: p.look, job: p.age >= 18 ? p.job : null,
      single, kids: own, sibs, parent, parPurse, purse: p.purse || 0, st, sibBond: fair, folk,
      letter: s.chap.letter && s.chap.letter.to === p.id ? s.chap.letter.text : null,
    };
  }
  // A short "Mum left you..." line for the start of the next life.
  function leftSaid(carry) {
    const things = [];
    if (carry.home) things.push(homeSaid(carry.home.kind));
    if (carry.biz) things.push(`the ${lowJob(BUSINESSES[carry.biz.type].names[carry.biz.lvl])}`);
    const k = (carry.items || []).map((id) => low(ITEMS[id].name)), her = carry.fromSex === 'f' ? 'her' : 'his';
    if (k.length) things.push(k.length > 3 ? `${her} ${k.slice(0, 2).join(', ')} and other keepsakes` : `${her} ${list(k)}`);
    if (carry.money > 0) things.push(money(carry.money));
    const who = carry.how === 'train' ? 'Your cousin' : carry.called;
    const and = carry.purse > 0 ? ` The ${money(carry.purse)} ${who === 'Your cousin' ? 'given you' : `${who} gave you`} over the years is in the bank too.` : '';
    // (A list in which anything with an "and" of its own is closed off before the last "and".)
    const said = things.length < 2 ? things.join('') : `${things.slice(0, -1).join(', ')}${things.slice(0, -1).some((x) => x.includes(' and ')) ? ',' : ''} and ${things[things.length - 1]}`;
    return things.length ? `${who} left you ${said}.${and}` : `${who} left you nothing much but a good name.${and}`;
  }
  // How carrying on as someone would begin, in a line for the end screen.
  Life.prototype.chapStartSaid = function (c) {
    const things = [];
    if (c.home) things.push(homeSaid(c.home.kind));
    if (c.biz) things.push(`the ${lowJob(BUSINESSES[c.biz.type].names[c.biz.lvl])}`);
    if (c.items && c.items.length) things.push(c.items.length === 1 ? `the ${low(ITEMS[c.items[0]].name)}` : 'the keepsakes');
    if (c.money > 0) things.push(money(c.money));
    const w = things.length ? `with ${list(things)}` : 'with nothing much from the will';
    if (c.how === 'home') return `Starts at ${c.age}, at home in the Bay, ${w}${c.kids && c.kids.length ? `, and ${c.kids.length === 1 ? 'a child' : `${num(c.kids.length)} children`} of ${c.sex === 'm' ? 'his' : 'her'} own` : ''}`;
    if (c.how === 'back') return `Comes back to the Bay at eighteen, ${w}`;
    return `Steps off the train at eighteen, ${w}`;
  };
  // The next life, as person i of the obituary's list (0: the one the will names).
  Life.prototype.chapNextLife = function (i = 0) {
    const o = this.obituary(), c = o.carry[Math.max(0, Math.min(o.carry.length - 1, i | 0))];
    const carry = { ...c, said: leftSaid(c) };
    // (The town goes on as this life left it: its mayor, what was built, its shops and its regulars: annals.js.)
    if (this.annalsHandOn) carry.town = this.annalsHandOn(c);
    return {
      sibs: carry.sibs, gifts: o.gifts, gen: this.s.gen + 1, inherit: carry.money, from: this.s.name,
      name: carry.name || '', look: carry.look || null, sex: carry.sex || null, st: carry.how === 'home' ? null : carry.st, parent: carry.parent, carry, age: carry.age,
    };
  };
  // The dreams to offer at the start of a life: none that the life already holds, and none out of its reach.
  // nx: what the last life left (or null); rand: a random number (the screen's own); keep: those already chosen.
  Life.chapOffer = function (nx, rand, keep = [], n = 6) {
    const P = Life.create({ seed: 1, name: 'Probe', sex: (nx && nx.sex) || 'm', gen: nx ? nx.gen : 1, gifts: nx ? nx.gifts : null, parent: nx ? nx.parent : null, raised: nx ? nx.st : null, sibs: nx && nx.sibs ? nx.sibs : nx ? [] : null, inherit: nx ? nx.inherit : 0 });
    P.chapBegin(nx ? nx.carry : null, []);
    const ok = Object.keys(DREAMS).filter((id) => !keep.includes(id) && opens(P.s, id) && !holds(P, id) && !far(P, id));
    const out = [];
    while (out.length < n - keep.length && ok.length) out.push(ok.splice(Math.floor(rand() * ok.length), 1)[0]);
    return out;
  };

  // ---- remembering ----

  // (Where the first chapter starts from: once every part has its state, since it counts what you are worth.)
  hooks.ready.push((L) => { if (!L.s.chap.snap) L.s.chap.snap = snapNow(L); });
  hooks.load.push((L) => {
    const s = L.s, was = !!s.chap;
    if (!s.chap) s.chap = blank();
    const C = s.chap, b = blank();
    for (const k of Object.keys(b)) if (C[k] === undefined) C[k] = b[k];
    for (const k of ['will', 'memo', 'old', 'n']) for (const [q, v] of Object.entries(b[k])) if (C[k][q] === undefined) C[k][q] = v;
    if (!C.start) C.start = { how: 'train', age: 18 };
    if (!was && s.t > 0) {
      // (A life already under way when the chapters began: its first chapter is counted from the train.)
      C.snap = { t: 0, age: 18, worth: s.hist && s.hist.length && s.age < 118 ? s.hist[0] : 1500, home: 'hostel', owned: false, shifts: 0, retired: false, job: null, biz: null, pt: null };
    }
    if (!was) {
      // A life saved before the chapters began: crossroads long past are passed over, and the journal's big moments are kept.
      for (const a of CROSS) if (s.age >= a + 4) C.cross[a] = -1;
      for (const e of s.log || []) if (e.k === 'big' || e.k === 'love') mark(C, e, Math.max(0, (e.a - 18) * 4 + (e.q || 0)));
    }
  });
  hooks.noted.push((L, e) => { if (L.s.chap && (e.k === 'big' || e.k === 'love')) mark(L.s.chap, e, L.s.t); });

  // A natural death that is due is held off, and becomes a last illness: the end is seen coming.
  hooks.reprieve.push((L, cause) => {
    const s = L.s, C = s.chap;
    if (!C || s.dead) return false;
    if (C.dusk) return s.health > 0; // (its own time is kept, but health run out ends it)
    if (s.age < 65) return false;
    startDusk(L, cause);
    return true;
  });

  // The will is carried out.
  hooks.died.push((L) => {
    const s = L.s, C = s.chap;
    if (!C || C.out) return;
    const est = L.chapEstate();
    if (est.town && est.town.ok) {
      const g = GIFTS[est.town.id];
      s.gifts[est.town.id] = s.name; s.gave[est.town.id] = 1;
      s.n.given = (s.n.given || 0) + g.cost;
      L.note(`Left the town ${g.said}, in the will.`, 'big');
    }
    C.out = est;
  });

  // The obituary: who carries on, and with what; every dream of the life; the moments that mattered.
  hooks.obit.push((L, o) => {
    const s = L.s, C = s.chap;
    const est = C.out || L.chapEstate();
    const heir = est.heir != null ? L.person(est.heir) : null;
    const others = L.chapCands().filter((p) => p !== heir).sort((a, b) => heirScore(b) - heirScore(a) || a.id - b.id).slice(0, 3);
    o.estate = est;
    o.carry = heir ? [carryFor(L, est, heir), ...others.map((p) => carryFor(L, est, p))] : [carryFor(L, est, null)];
    const c = o.carry[0];
    o.inherit = c.money;
    if (heir) {
      o.heir = { name: first(heir), look: heir.look, sex: heir.sex, st: heir.st || c.st, rel: c.rel, age: c.age, how: c.how };
      o.sibs = c.sibs; o.parent = c.parent;
    } else { o.heir = null; o.parent = null; }
    o.dreams = [...C.was.map((d) => ({ id: d.id, done: d.done != null, was: true })), ...s.dreams.map((id) => ({ id, done: !!s.dreamDone[id] }))].filter((d) => DREAMS[d.id]);
    o.highlights = L.chapHighlights();
  });

  // ---- the turn of the season ----

  hooks.season.push((L, lines, jailed) => {
    const s = L.s, C = s.chap, O = C.old;
    // Gifts older than five years are clear of duty, and need no keeping.
    C.gifts = C.gifts.filter((g) => s.t - g.t < GIFT_YEARS * 4);
    if (jailed) return;
    // Minding the grandchildren.
    if (O.mind && O.mind.on) {
      const small = L.chapMindKids();
      if (!small.length || C.dusk) { O.mind.on = false; if (!C.dusk) L.queue('chapMindEnd', O.mind.kid); }
      else { for (const g of small) L.bond(g, O.mind.light ? 1 : 2); C.n.minded++; }
    }
    // The waiting list comes good, in the end.
    if (O.hip === 'wait' && O.hipAt != null && s.t >= O.hipAt) { O.hipAt = null; L.queue('chapHipDone'); }
    // A stick on a frosty step.
    if (O.hip === 'stick' && s.age >= 74 && L.season === 3 && L.chance(0.08)) L.queue('fall');
  });

  hooks.late.push((L, jailed) => {
    const s = L.s, C = s.chap, D = C.dusk;
    // A crossroads, in the summer after the birthday.
    let a = L.chapNext();
    if (a && s.age >= a && !jailed && !D && L.season === 1 && !s.pend.some((q) => q.id === 'chapCross')) {
      // (One missed altogether, after a long spell inside say, is passed over for the one that is due.)
      while (a && CROSS.some((b) => b > a && s.age >= b)) { C.cross[a] = -1; a = L.chapNext(); }
      C.cross[a] = s.t;
      L.queue('chapCross', { a, text: lookBack(L), age: s.age });
    }
    // The last illness.
    if (D && !s.dead && D.at !== s.t) {
      D.left--;
      const cap = L.healthCap(), left = Math.max(0, D.left);
      s.health = clamp(s.health, Math.min(cap, 3 + left * 3), Math.min(cap, 14 + left * 9));
      if (!jailed) {
        if (D.left === 2 && !D.done.party) { D.done.party = s.t; L.queue('chapFarewell'); }
        if (L.season === 1 && D.left >= 1 && !D.done.summer) { D.done.summer = s.t; L.queue('chapSummer'); }
        const h = L.chapHeir();
        if (D.left <= 3 && D.left >= 1 && !D.done.letter && h && h.age >= 8) { D.done.letter = s.t; L.queue('chapLetter', h.id); }
      }
      if (D.left <= 0 && !D.done.last) { D.done.last = s.t; L.queue('chapLast', lastMorning(L)); }
      if (D.left <= -3) L.die(D.cause);
    }
    // Later life has things of its own to bring.
    if (s.age >= 65 && !jailed && !D && !s.dead && !s.pend.length && L.chance(0.2)) laterCard(L);
  });

  hooks.time.push((L) => {
    const s = L.s, C = s.chap;
    if (!C) return 0;
    const O = C.old, D = C.dusk;
    let t = 0;
    if (D) t -= D.treat != null && D.treat >= s.t ? 2 : 1;
    if (O.hip === 'wait') t -= 1;
    if (O.mend != null && O.mend >= s.t) t -= 1;
    if (O.mind && O.mind.on && !O.mind.light) t -= 1;
    if (O.kid != null && L.person(O.kid)) t += 1;
    return t;
  });

  hooks.mood.push((L) => {
    const C = L.s.chap;
    if (!C) return 0;
    const O = C.old, D = C.dusk;
    let b = 0;
    if (D) b += D.way === 'grace' ? 5 : D.way === 'fight' ? -2 : 0;
    if (O.hip === 'wait') b -= 3; else if (O.hip === 'stick') b -= 1;
    if (O.heart === 'pills') b -= 1;
    if (O.mind && O.mind.on) b += 2;
    if (O.lunch != null && L.person(O.lunch)) b += 2;
    if (O.kid != null && L.person(O.kid)) b += 2;
    if (C.memo.done) b += 1;
    return b;
  });

  hooks.chose.push((L, id, x, i) => {
    const s = L.s, C = s.chap;
    // A husband or wife gone is one of the biggest things in a life (soul.js has dug the grave by now).
    if (id === 'spouseDies' && s.soul) {
      const g = s.soul.graves[s.soul.graves.length - 1];
      if (g && (g.kind === 'spouse' || g.kind === 'partner') && g.t === s.t) L.note(`Lost ${g.name}, ${g.sex === 'm' ? 'your husband' : 'your wife'}${g.kind === 'partner' ? ' in all but name' : ''}.`, 'love');
    }
    // What a parent from the life before had put by comes down, after duty, shared with any brothers and sisters.
    if (id === 'parentDies' && C.par && C.par.pid === x) {
      const pot = C.par.purse, n = Math.round((pot - dutyOn(pot)) / (1 + L.siblings().length) / 100) * 100;
      C.par = null;
      if (n > 0) { L.cash(n); L.note(`Your share of what your parent had been left, after duty: ${money(n)}.`, 'big'); L.say('📜', `The will: ${money(n)} comes to you`, 'good'); }
    }
    // The town's cards that give money to the children count as gifts made in life.
    if (id === 'will' && i === 1 && L.kids().length) { const ks = L.kids(); for (const k of ks) settle(L, k, Math.floor(6000 / ks.length), false); }
    if (id === 'deposit' && i === 0) { const k = L.person(x); if (k) settle(L, k, 5000, false); }
  });

  // What the Gazette has to say.
  hooks.epitaph.push((L, out) => {
    const s = L.s, C = s.chap, m = s.sex !== 'f', He2 = m ? 'He' : 'She', his2 = m ? 'his' : 'her';
    if (C.memo.done) out.push(C.memo.done.how === 'published' ? `${cap(his2)} memoirs, ${C.memo.done.title}, were published in the city and sold out at the Bay bookshop in a week.` : C.memo.done.how === 'archive' ? `${cap(his2)} memoirs, ${C.memo.done.title}, are in the town archive, where Miss Achterberg will let you read them if you are quiet.` : `${cap(his2)} memoirs, ${C.memo.done.title}, are on the family’s shelves.`);
    if (C.old.adv) out.push(`At ${C.old.adv.age} ${m ? 'he' : 'she'} ${C.old.adv.said}, and talked of nothing else for a month.`);
    const D = C.dusk;
    if (D && s.dead) out.push(D.way === 'grace' ? `${He2} met ${his2} last illness with grace, and a pot of tea, and saw everybody ${m ? 'he' : 'she'} wanted to see.` : D.way === 'fight' ? `${He2} fought ${his2} last illness to the end, and the nurses at St Wren’s say ${m ? 'he' : 'she'} was the best company on the ward.` : `${He2} kept ${his2} last illness to ${m ? 'himself' : 'herself'} for as long as ${m ? 'he' : 'she'} could.`);
    const est = C.out;
    if (est && est.heir != null) {
      const h = L.person(est.heir);
      if (h && (est.home || est.biz)) out.push(`${est.home ? cap(homeSaid(est.home.kind)) : `The ${lowJob(est.biz.name)}`} passes to ${his2} ${relOf(h)}, ${first(h)}.`);
    }
  });

  // ---- the pieces ----

  // Money settled on one of the family (counted for duty until five years have passed).
  function settle(L, p, n, mine = true) {
    const s = L.s, C = s.chap;
    if (!p || n <= 0) return;
    p.purse = (p.purse || 0) + n;
    C.gifts.push({ p: p.id, n, t: s.t });
    C.n.settled = (C.n.settled || 0) + n;
    if (mine) C.yr[p.id] = s.age;
  }

  function startDusk(L, cause) {
    const s = L.s, C = s.chap;
    const why = !cause || /^(poor health|ill health|exhaustion|overwork)$/.test(cause) ? 'old age' : cause;
    C.dusk = { at: s.t, cause: why, left: L.int(3, 6), way: null, treat: null, done: {} };
    if (C.old.mind && C.old.mind.on) C.old.mind.on = false;
    if (s.health < 14) s.health = Math.min(L.healthCap(), 14 + L.int(0, 8));
    s.pend.unshift({ id: 'chapDusk', x: { cause: why } });
  }

  // The look back at a crossroads: a few plain sentences from what actually happened.
  function lookBack(L) {
    const s = L.s, C = s.chap, sn = C.snap, out = [];
    const yrs = Math.max(1, s.age - sn.age), Y = `${cap(num(yrs))} year${yrs === 1 ? '' : 's'}`;
    const firstOne = !C.past.length;
    if (firstOne && C.start.how === 'train' && sn.age <= 19) out.push(`${Y} since you stepped off the train with one suitcase.`);
    else if (firstOne && C.start.how === 'back' && sn.age <= 19) out.push(`${Y} since you came home to the Bay at eighteen.`);
    else if (firstOne && C.start.how === 'home') out.push(`${Y} since you took up the family’s story.`);
    else if (firstOne) out.push(`${Y} of your life in the Bay, at the last count.`);
    else out.push(`${Y} since you last took stock, at ${AGE_WORD[C.past[C.past.length - 1].a] || C.past[C.past.length - 1].age}.`);
    // Work.
    const j = s.job, now = j ? CAREERS[j.c].rungs[j.r].title : null, where = j ? (CAREERS[j.c].shady ? ' in Sal’s crew' : ` at ${PLACES[CAREERS[j.c].place].name.replace(/^The /, 'the ')}`) : '';
    if (j && sn.job && sn.job.c === j.c && j.r > sn.job.r) out.push(`You went from ${lowJob(sn.job.title)} to ${lowJob(now)}${where}.`);
    else if (j && sn.job && sn.job.c === j.c) out.push(`You are ${an(lowJob(now))}${where} still, ${Math.max(0, s.n.shifts - sn.shifts)} shifts on.`);
    else if (j && sn.job) out.push(`You left ${lowJob(sn.job.title)} behind, and you are ${an(lowJob(now))} now.`);
    else if (j) out.push(`You found your work: ${an(lowJob(now))}${where}.`);
    else if (s.retired && !sn.retired) out.push('You have retired, and the clock they gave you keeps very good time.');
    else if (s.biz) out.push(`You work for yourself: ${an(lowJob(L.bizName()))}.`);
    else if (s.retired) out.push('Your time is your own, and you are getting good at spending it.');
    else out.push('No job has held you for long.');
    // Love and family.
    const win = C.marks.filter((m) => m.t >= sn.t);
    const grab = (re) => win.map((m) => (m.x.match(re) || [])[1]).filter(Boolean);
    const wed = grab(/^Married (.+?)(?: at St Brigid’s)?\.$/), born = grab(/^(.+) was born\.$/), took = grab(/^Adopted (.+)\.$/), parted = grab(/^Divorced (.+)\.$/), lost = grab(/^Lost (.+?), your/);
    const fam = [];
    if (wed.length) fam.push(`you married ${list(wed)}`);
    if (born.length) fam.push(`${list(born)} ${born.length > 1 ? 'were' : 'was'} born`);
    if (took.length) fam.push(`you adopted ${list(took)}`);
    if (parted.length) fam.push(`you and ${list(parted.map((n) => n.split(' ')[0]))} went your separate ways`);
    if (lost.length) fam.push(`you lost ${list(lost.map((n) => n.split(' ')[0]))}`);
    const pt = L.partner();
    if (fam.length) out.push(`${cap(fam.join(', and '))}.`);
    else if (pt && sn.pt === pt.id) out.push(`You and ${first(pt)} are still together.`);
    else if (pt) out.push(`You are seeing ${first(pt)}.`);
    else if (s.f.wed) out.push('You are on your own now.');
    else out.push('Nobody special yet, and that is all right.');
    // Home and money.
    const worth = L.netWorth(), w = worth < 0 ? `you owe ${money(-worth)} all told, where you had ${money(sn.worth)}` : `you are worth ${money(worth)}, where you had ${money(sn.worth)}`;
    if (s.home !== sn.home) out.push(`You moved from ${homeSaid(sn.home)} to ${homeSaid(s.home)}${s.owned && !sn.owned ? ', which is yours' : ''}, and ${w}.`);
    else out.push(`You are in ${homeSaid(s.home)} still, and ${w}.`);
    // One thing the journal will not let you forget.
    const plain = /^(Married|Promoted|Bought the|A dream came true|Started seeing|Moved in|Got engaged|Stepped off|Took up|Came back|Adopted|Divorced|Lost|Split up)| was born\.$/;
    const star = win.filter((m) => !plain.test(m.x)).sort((a, b) => b.w - a.w)[0];
    if (star) out.push(`One page of the journal stands out: “${star.x.replace(/\.$/, '')}.”`);
    // Dreams.
    const done = s.dreams.filter((id) => s.dreamDone[id] != null && s.dreamDone[id] >= sn.age).map((id) => DREAMS[id].name);
    const gone = s.dreams.filter((id) => s.dreamDone[id] == null && far(L, id)).map((id) => DREAMS[id].name);
    const wait = s.dreams.filter((id) => s.dreamDone[id] == null && !far(L, id)).map((id) => DREAMS[id].name);
    const d = [];
    if (done.length) d.push(`${list(done)} came true`);
    if (gone.length) d.push(`${list(gone)} ${gone.length > 1 ? 'look' : 'looks'} out of reach now`);
    if (wait.length) d.push(`${list(wait)} still ${wait.length > 1 ? 'wait' : 'waits'}`);
    if (d.length) out.push(`${cap(d.join('; '))}.`);
    return out.join(' ');
  }

  // The chapter just gone is put away, and the next begins.
  function newChapter(L, x) {
    const s = L.s, C = s.chap;
    C.past.push({ a: x.a, age: x.age, text: x.text });
    C.snap = snapNow(L);
  }
  // The dreams that could make way at a crossroads: those come true first, then those out of reach.
  function slots(L) {
    const s = L.s;
    return [...s.dreams.map((id, i) => [i, s.dreamDone[id] != null ? 'done' : null]).filter(([, w]) => w), ...s.dreams.map((id, i) => [i, s.dreamDone[id] == null && far(L, id) ? 'far' : null]).filter(([, w]) => w)];
  }
  // A few dreams that fit this point in a life.
  function offer(L, n) {
    const s = L.s, gone = new Set(C0(L).was.map((d) => d.id));
    const pool = Object.keys(DREAMS).filter((id) => !s.dreams.includes(id) && s.dreamDone[id] == null && !gone.has(id) && opens(s, id) && !far(L, id) && !holds(L, id));
    const out = [];
    while (out.length < n && pool.length) {
      const wt = pool.map((id) => (LATE.has(id) ? (s.age >= 55 ? 3 : 1.2) : s.age >= 58 ? 0.6 : 1));
      let r = L.rnd() * wt.reduce((a, v) => a + v, 0), k = 0;
      while (k < pool.length - 1 && (r -= wt[k]) >= 0) k++;
      out.push(pool.splice(k, 1)[0]);
    }
    return out;
  }
  const C0 = (L) => L.s.chap;
  function dreamNext(L, rest) {
    while (rest.length) {
      const [slot, why] = rest[0];
      const off = offer(L, 3);
      if (off.length) { L.queue('chapDream', { slot, why, was: L.s.dreams[slot], offer: off, rest: rest.slice(1) }); return; }
      rest = rest.slice(1);
    }
  }

  // The last morning: who is there, and what you are thinking of. (Put together when it is queued, so it reads the same each time.)
  function lastMorning(L) {
    const s = L.s, D = s.chap.dusk, pt = L.partner();
    const kids = L.kids().slice().sort((a, b) => b.bond - a.bond), gk = L.grandkids(), pal = L.friends().slice().sort((a, b) => b.bond - a.bond)[0];
    const scene = [
      'The window is open a crack, and the gulls are making a racket over the harbour.',
      'It is already warm. Somebody has put sweet peas in a jam jar by the bed.',
      'The light is low and gold, and the leaves are coming down past the window.',
      'There is frost on the inside of the glass, and the radiator is ticking.',
    ][L.season];
    const where = s.gaol ? 'the hospital wing at Starling Gaol, and Mr Hobbs has brought you a proper cup of tea' : D && D.way === 'fight' ? 'a side room at St Wren’s, with a view of the harbour' : `your own bed, in ${homeSaid(s.home)}`;
    let who = pt ? `${first(pt)} is holding your hand` : kids.length ? `${first(kids[0])} is holding your hand` : pal ? `${first(pal)} has been reading you the Gazette, doing all the voices` : 'The nurse has the radio on, low';
    if (gk.length && !s.gaol) who += `, and ${first(gk[gk.length - 1])} is asleep in the chair`;
    else if (s.pet && !s.gaol) who += `, and ${s.pet.name} is lying across your feet`;
    const born = C0(L).marks.find((m) => / was born\.$/.test(m.x));
    const think = s.f.wed && pt ? `the day you married ${first(pt)}` : born ? `the night ${born.x.replace(/ was born\.$/, '')} was born` : C0(L).start.how === 'train' ? 'the day you stepped off the train with one suitcase' : 'the harbour wall, and the summer you learned to fish off it';
    return { cause: D ? D.cause : 'old age', text: `${scene} You are in ${where}. ${who}. You are thinking about ${think}, and you are not afraid.` };
  }

  // ---- the actions ----

  def('chapMemoir', {
    place: 'home', sec: 'Later life', icon: '📜', time: 1, per: 1,
    title: (L) => (L.s.chap.memo.p ? `Work on your memoirs (${L.s.chap.memo.p}/${MEMO})` : 'Begin your memoirs'),
    desc: `Everything you remember, written down before it goes. ${num(MEMO)[0].toUpperCase() + num(MEMO).slice(1)} sittings; better with Smarts and Craft.`,
    show: (L) => L.s.age >= 60 && !L.s.chap.memo.done,
    run(L) {
      const s = L.s, M = s.chap.memo, pt = L.partner(), kid = L.kids()[0];
      M.p++; M.q += s.st.smarts * 0.5 + s.st.craft * 0.5;
      L.gain('craft', 0.8); L.gain('smarts', 0.5); L.joy(2);
      if (M.p < MEMO) {
        const lines = ['The year of the big storm. Your version and Old Marlow’s do not agree, and yours has fewer sea monsters.', 'You find you remember every teacher you ever had, and none of their names.', 'A whole afternoon on one Christmas, and you are still not finished with it.'];
        if (s.chap.start.how === 'train') lines.push('The day you stepped off the train. You had forgotten the colour of the suitcase, and then, all at once, you remember it.');
        else lines.push('The harbour wall, and the summer you learned to fish off it. You can smell the bait.');
        if (pt) lines.push(`A chapter about ${first(pt)}. You cross half of it out, then put it back.`);
        if (kid) lines.push(`The night ${first(kid)} was born. Your handwriting goes to pieces, and you leave it like that.`);
        if (s.n.shifts > 100) lines.push(`${s.n.shifts} shifts, give or take. You write about the people, not the work.`);
        return L.pick(lines);
      }
      const titles = [s.chap.start.how === 'train' ? 'One Suitcase' : 'Born on the Quay', 'Salt in the Air', 'The View from the Pier', 'Gulls and All', 'Mostly Weather', 'A Life in the Bay'];
      L.queue('chapMemoirDone', { q: M.q / MEMO, title: L.pick(titles) });
      return 'You write the last line, read the whole thing through, and sit for a while with your hand on the pile.';
    },
  });

  def('chapWillOpen', { place: 'highstreet', sec: 'Mrs Gale, solicitor', icon: '📜', title: 'Your will', desc: 'Who carries on, who gets what, and what the town takes.', time: 0, open: 'chapWill', show: (L) => L.s.age >= 30 || L.chapCands().length > 0 });

  // x: { k: what part of the will, v: what it is to be }.
  def('chapWill', {
    time: 0,
    why(L, x) {
      const s = L.s, sp = L.chapSpouse();
      if (!x || typeof x !== 'object') return 'Change what?';
      if (x.k === 'heir') { const p = L.person(x.v); return p && KIN_KIND(p) ? null : 'Only a child or a grandchild can carry on the family.'; }
      if (x.k === 'home' || x.k === 'biz') return ['heir', 'sell'].includes(x.v) ? null : 'Leave it how?';
      if (x.k === 'split') return x.v === 'fair' || x.v === 'heir' || (x.v === 'spouse' && sp) ? null : 'Not like that.';
      if (x.k === 'town') return x.v == null || (GIFTS[x.v] && !s.gifts[x.v]) ? null : 'The town has that already.';
      return 'Change what?';
    },
    run(L, x) {
      const s = L.s, w = s.chap.will;
      const fresh = !w.made;
      w[x.k] = x.v;
      if (fresh) w.made = s.t;
      if (x.k === 'heir') { const p = L.person(x.v); return `Mrs Gale writes ${p.name} in, in her best hand. “The one who carries on,” she says. “Very good.”`; }
      if (x.k === 'home') return x.v === 'heir' ? 'The house will go to whoever carries on, free of duty.' : 'The house will be sold, and the money shared.';
      if (x.k === 'biz') return x.v === 'heir' ? 'The business will go to whoever carries on, free of duty.' : 'The business will be sold, and the money shared.';
      if (x.k === 'split') return x.v === 'fair' ? 'The money will be shared fairly among the children.' : x.v === 'heir' ? 'Half the money will go to whoever carries on, and the rest be shared.' : `Everything will go to ${first(L.chapSpouse())}, with no duty to pay, and to the children after.`;
      return x.v ? `The town will have ${GIFTS[x.v].said}, with your name on it, if the money stretches that far.` : 'Nothing will be left to the town.';
    },
  });

  // Money given to one of the family now, while you are here to see it.
  def('chapSettle', {
    who: true, time: 0,
    cost: (L, p, y) => (SETTLE.includes(y.n) ? y.n : 0),
    why(L, p, y) {
      if (!SETTLE.includes(y.n)) return 'How much?';
      if (!KIN_KIND(p)) return 'This is for your children and grandchildren.';
      if (L.s.age < 40) return 'Plenty of time for that.';
      if (L.s.chap.yr[p.id] === L.s.age) return `${first(p)} has had something this year already.`;
      return null;
    },
    run(L, p, y) {
      settle(L, p, y.n);
      L.bond(p, y.n >= 25000 ? 6 : 3); L.joy(2);
      if (p.age < 18) return `Into a savings account for ${first(p)}, for when ${he(p)} is grown. Mrs Gale makes you sign in three places.`;
      return L.pick([`${first(p)} says you should not have, and then that it will make all the difference.`, `${first(p)} goes very quiet, and then hugs you for longer than usual.`, `${first(p)} tries to give it back. You will not take it.`]);
    },
  });

  // ---- the cards ----

  const tr = (id) => (L) => !!L.soulHas && L.soulHas(id);
  const pick3 = (L) => L.chapMindKids().slice(0, 3).map(first);
  const op = (L, base) => clamp(base + L.s.health / 400 + L.s.st.fitness / 500 + (L.perk('medicine') ? 0.05 : 0) + (L.s.gifts.wing ? 0.04 : 0), 0.3, 0.95);

  const CARDS = [
    // ---- chapters ----
    {
      id: 'chapCross', icon: (L, x) => ({ 30: '🛤️', 45: '⛰️', 60: '🌅' }[x.a] || '🛤️'),
      title: (L, x) => ({ 30: 'A crossroads at thirty', 45: 'Halfway up the hill', 60: 'Sixty, and the long view' }[x.a] || 'A crossroads'),
      text: (L, x) => x.text,
      opts: [
        {
          t: 'Look ahead: dream something new', show: (L) => slots(L).length > 0,
          run(L, x) { newChapter(L, x); dreamNext(L, slots(L)); L.joy(3); return 'You take out the old list, cross some things off with great satisfaction, and leave a space at the bottom.'; },
        },
        {
          t: 'Hold on to the dreams you have', show: (L) => L.s.dreams.some((id) => L.s.dreamDone[id] == null),
          run(L, x) { newChapter(L, x); L.joy(3); return 'They are still worth having. You fold the list up small and put it back in your wallet.'; },
        },
        { t: ic('bookish', 'Write it all down, and read it back'), show: tr('bookish'), run(L, x) { newChapter(L, x); L.gain('smarts', 1); L.joy(4); return 'Three pages in a notebook, in your smallest writing. Reading it back, it seems to have happened to somebody braver than you.'; } },
        { t: ic('loner', 'Walk out to Gorse Head alone, and think'), show: tr('loner'), run(L, x) { newChapter(L, x); L.gain('fitness', 1); L.joy(4); return 'Wind, gulls, the whole bay below. By the time you come down you know what you want, more or less.'; } },
        { t: 'Look back, and be glad of it', run(L, x) { newChapter(L, x); L.joy(5); return 'Not all of it went to plan. Most of it was better than the plan.'; } },
      ],
    },
    {
      id: 'chapDream', icon: '✨', title: 'Something to dream of', log: false,
      ok: (L, x) => L.s.dreams[x.slot] === x.was,
      text: (L, x) => (x.why === 'done' ? `${DREAMS[x.was].name} came true at ${L.s.dreamDone[x.was]}. What will you dream of in its place?` : `${DREAMS[x.was].name} looks out of reach now. Let it go, and dream of something else?`),
      opts: [0, 1, 2].map((i) => ({
        t: (L, x) => (x.offer[i] ? `${DREAMS[x.offer[i]].icon} ${DREAMS[x.offer[i]].name}: ${DREAMS[x.offer[i]].desc.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase())}` : ''),
        show: (L, x) => !!x.offer[i],
        run(L, x) {
          const s = L.s, id = x.offer[i];
          s.chap.was.push({ id: x.was, done: s.dreamDone[x.was] ?? null, at: s.age, why: x.why });
          s.dreams[x.slot] = id;
          L.note(`Took up a new dream at ${s.age}: ${DREAMS[id].name.toLowerCase()}.`);
          dreamNext(L, x.rest);
          return `${DREAMS[id].name}. You say it out loud, to see how it sounds. It sounds right.`;
        },
      })).concat([{
        t: (L, x) => (x.why === 'done' ? 'Leave it be: it is a good thing to have done' : `Keep dreaming of it: ${DREAMS[x.was].name.toLowerCase()}`),
        run(L, x) { dreamNext(L, x.rest); return x.why === 'done' ? 'Some things are worth looking at for a while.' : 'Stranger things have happened, and most of them in Starling Bay.'; },
      }]),
    },

    // ---- the body ----
    {
      id: 'chapSlower', icon: '🦯', title: 'Slower than you were', w: 3, once: true, when: (L) => L.s.age >= 75 && !L.s.gaol && !L.s.chap.dusk,
      text: 'You notice it on the way up the hill: you are slower than you were. The stairs, the shopping, the walk to the Gull. It all still gets done; it just takes longer. (From now on every season has one block of time less in it, and at eighty-five, one less again.)',
      opts: [
        { t: 'Have a stair lift put in', cost: 4000, show: (L) => L.s.owned && HOMES[L.s.home].tier >= 3, run(L) { L.s.chap.old.lift = 1; L.joy(4); return 'You ride it up and down nine times on the first day, waving.'; } },
        { t: 'Walk every day, to keep it at bay', run(L) { L.gain('fitness', 2); L.hp(3); return 'Twice round the pond before breakfast, every day, rain or shine. The ducks know your step.'; } },
        { t: 'Take up a walking stick, and swing it', run(L) { L.joy(3); return 'Ash, with a brass ferrule. You point at things with it. It is surprisingly satisfying.'; } },
        { t: ic('joker', 'Race the postman up the hill, and lose'), show: tr('joker'), run(L) { L.joy(5); L.hp(-1); return 'He lets you win the first time. The second time he does not, and you both have to sit on the wall.'; } },
      ],
    },
    {
      id: 'chapHip', icon: '🦴', title: 'The hip', w: 3, once: true, when: (L) => L.s.age >= 66 && L.s.age <= 90 && !L.s.gaol && !L.s.chap.dusk && !L.s.chap.old.hip,
      text: 'Your hip has been grumbling for a year, and now it shouts on the stairs. Mr Adeyemi, the consultant at St Wren’s, a cheerful man with cold hands, says it ought to be replaced.',
      opts: [
        {
          t: 'Have it done privately, now', cost: (L) => L.medCost(7000), odds: (L) => op(L, 0.62),
          run(L, x, win) {
            const O = L.s.chap.old;
            O.hip = 'new'; O.mend = L.s.t + 1;
            L.note('Had a new hip.', 'big');
            if (win) { L.joy(6); L.hp(4); return 'Six weeks on crutches, and then one morning you take the stairs two at a time without thinking. You stop halfway up, astonished.'; }
            L.hp(-5, 'a hip operation'); L.sicken('a slow recovery', 1); return 'It takes. It just takes a long time, and a physiotherapist called Bev who shows no mercy at all.';
          },
        },
        { t: 'Go on the waiting list', run(L) { const O = L.s.chap.old; O.hip = 'wait'; O.hipAt = L.s.t + L.int(3, 6); L.joy(-2); return 'A letter with a number on it. The number is large. Until then, the hip has opinions about everything.'; } },
        { t: 'Manage with a stick', run(L) { L.s.chap.old.hip = 'stick'; return 'A stick, a cushion on every chair, and a firm view that it is not that bad. It is a bit that bad.'; } },
        { t: ic('sporty', 'Have it done, and do every exercise on the sheet'), show: tr('sporty'), cost: (L) => L.medCost(7000), run(L) { const O = L.s.chap.old; O.hip = 'new'; O.mend = L.s.t; L.joy(8); L.gain('fitness', 1); L.note('Had a new hip.', 'big'); return 'You do the exercises twice a day and then some. Bev the physiotherapist says you are the first patient who has ever frightened her.'; } },
      ],
    },
    {
      id: 'chapHipDone', icon: '🦴', title: 'A letter from St Wren’s', ok: (L) => L.s.chap.old.hip === 'wait',
      text: 'Your name has come to the top of the list. Mr Adeyemi can do the hip a week on Tuesday.',
      opts: [
        { t: 'Yes, and gladly', odds: (L) => op(L, 0.6), run(L, x, win) { const O = L.s.chap.old; O.hip = 'new'; O.mend = L.s.t + 1; L.note('Had a new hip.', 'big'); if (win) { L.joy(8); return 'It was worth the wait. You walk to the end of the pier and back for no reason at all.'; } L.hp(-6, 'a hip operation'); return 'A slow recovery, and Bev the physiotherapist, but it takes, and the shouting on the stairs stops.'; } },
        { t: 'You have got used to it now', run(L) { L.s.chap.old.hip = 'stick'; return 'You take your name off the list. The hip says nothing, which is suspicious.'; } },
      ],
    },
    {
      id: 'chapHeart', icon: '🫀', title: 'A tired valve', w: 2, once: true, when: (L) => L.s.age >= 68 && !L.s.gaol && !L.s.chap.dusk && (L.s.health < 60 || (L.s.ill && /heart/.test(L.s.ill.name))),
      text: 'After the tests, the cardiologist at St Wren’s draws you a heart on the back of an envelope, then a valve, then a cross through the valve. “It is tired,” she says. “A new one would give you years. The operation is not a small one.”',
      opts: [
        {
          t: 'Have the operation', cost: (L) => L.medCost(9000), odds: (L) => op(L, 0.52),
          run(L, x, win) {
            const O = L.s.chap.old;
            if (win) { O.heart = 'mended'; O.mend = L.s.t + 1; if (L.s.ill && /heart/.test(L.s.ill.name)) L.s.ill = null; L.hp(14); L.joy(8); L.note('Had a new heart valve, and years with it.', 'big'); return 'You wake up with a zip down your chest and a heart that ticks like a good clock. The cardiologist shakes your hand as though you had done the work.'; }
            O.heart = 'pills'; L.hp(-12, 'heart trouble'); L.joy(-6); return 'It does not go as it should. They bring you home on tablets, and you understand without being told that the valve has had its say.';
          },
        },
        { t: 'Tablets, and a quieter life', run(L) { L.s.chap.old.heart = 'pills'; L.joy(-1); return 'A tablet in the morning, another at night, and no more running for buses. You were never much good at catching them anyway.'; } },
        { t: ic('churchgoer', 'Ask the Reverend Hollis to pray for the surgeon’s hands, and have it done'), show: tr('churchgoer'), cost: (L) => L.medCost(9000), odds: (L) => op(L, 0.56), run(L, x, win) { const O = L.s.chap.old; if (win) { O.heart = 'mended'; O.mend = L.s.t + 1; L.hp(14); L.joy(9); L.note('Had a new heart valve, and years with it.', 'big'); return 'The Reverend Hollis is in the waiting room the whole six hours, knitting something that turns out to be for you.'; } O.heart = 'pills'; L.hp(-12, 'heart trouble'); return 'It does not go as it should. The Reverend Hollis drives you home very slowly, and stays for supper.'; } },
      ],
    },

    // ---- home and family ----
    {
      id: 'chapDownsize', icon: '🏚️', title: 'Too much house', w: 3, once: true,
      when: (L) => L.s.age >= 66 && L.s.owned && HOMES[L.s.home].tier >= 3 && !L.kids().some((k) => k.age < 18) && !L.s.gaol && !L.s.chap.dusk,
      text: (L) => `${cap(homeSaid(L.s.home))} has room for a family, and you live in two rooms of it. The stairs have opinions. An estate agent with very white teeth has been round, uninvited, to say what it would fetch: ${money(Math.round(L.homeWorth() * 0.97))}.`,
      opts: [
        {
          t: 'Sell up, and buy a harbour-view flat', show: (L) => L.s.home !== 'flat' && !L.liveWhy('flat'),
          run(L) {
            const s = L.s, old = L.homeEntry(), got = Math.round(L.propValue(old) * 0.97), price = L.propPrice('flat');
            s.estate.splice(s.estate.indexOf(old), 1);
            const e = { id: s.eid++, kind: 'flat', ups: {}, let: false };
            s.estate.push(e);
            L.settleIn('flat', e);
            L.cash(got - price);
            s.chap.old.down = 'sold';
            L.note(`Sold ${homeSaid(old.kind)} and moved to a harbour-view flat.`);
            return `It sells in a week. The flat has a lift, a view of every boat in the harbour, and ${money(got - price)} left over. You miss the garden more than you expected, and the stairs not at all.`;
          },
        },
        { t: 'Keep it: it is the family home', run(L) { const s = L.s; s.chap.old.down = 'kept'; s.chap.will.home = 'heir'; for (const k of L.kids()) L.bond(k, 3); L.joy(2); return 'The grandchildren will have Christmas here, and so will everyone else. The house will pass to whoever carries on, free of duty.'; } },
        {
          t: (L) => { const k = L.kids().filter((q) => q.age >= 18).sort((a, b) => b.bond - a.bond)[0]; return `Ask ${k ? first(k) : 'one of the children'} and family to move in`; },
          show: (L) => L.kids().some((q) => q.age >= 18 && q.bond >= 40),
          run(L) {
            const s = L.s, k = L.kids().filter((q) => q.age >= 18).sort((a, b) => b.bond - a.bond)[0];
            s.chap.old.down = 'kid'; s.chap.old.kid = k.id;
            if (!s.chap.will.made) s.chap.will.heir = k.id;
            L.bond(k, 10); L.joy(4);
            return `${first(k)} says yes before you have finished asking. The house is loud again, there are shoes all over the hall, and somebody else does the bins.`;
          },
        },
        { t: 'Think about it another year', run() { return 'The estate agent leaves his card. You use it as a bookmark.'; } },
      ],
    },
    {
      id: 'chapMind', icon: '🧸', title: 'Could you have them?', w: 4, cd: 40,
      when: (L) => L.s.age >= 55 && !L.s.gaol && !L.s.chap.dusk && !(L.s.chap.old.mind && L.s.chap.old.mind.on) && L.chapMindKids().some((g) => L.person(g.of)),
      ctx: (L) => { const g = L.chapMindKids().find((q) => L.person(q.of)); return g ? g.of : null; },
      ok: (L, x) => !!L.person(x) && L.chapMindKids().length > 0,
      text: (L, x) => { const k = L.person(x); return `${first(k)} rings. The childminder has given notice, and ${he(k)} wonders, very carefully, whether you might possibly have ${list(pick3(L))} on Tuesdays and Thursdays.`; },
      opts: [
        { t: 'Tuesdays and Thursdays it is', run(L, x) { const k = L.person(x); L.s.chap.old.mind = { on: true, light: false, t: L.s.t, kid: x }; L.bond(k, 8); for (const g of L.chapMindKids()) L.bond(g, 6); L.joy(4); return `${first(k)} cries a little on the phone. On Tuesday the house fills up with small shoes, raisins and questions.`; } },
        { t: 'Fridays, and some of the holidays', run(L, x) { const k = L.person(x); L.s.chap.old.mind = { on: true, light: true, t: L.s.t, kid: x }; L.bond(k, 4); for (const g of L.chapMindKids()) L.bond(g, 3); L.joy(2); return 'Fridays are yours and theirs: the beach, the park, the library. The rest of the week is yours alone, and you know exactly what to do with it.'; } },
        { t: 'You have done your share of nappies', run(L, x) { L.bond(L.person(x), -5); L.joy(1); return `${first(L.person(x))} says that is fair, in the voice that means it is not.`; } },
      ],
    },
    {
      id: 'chapMindDay', icon: '🪣', title: 'A day with the little ones', w: 4, cd: 6,
      when: (L) => !!L.s.chap.old.mind && L.s.chap.old.mind.on && L.chapMindKids().length > 0 && !L.s.gaol,
      ctx: (L) => L.pick(L.chapMindKids()).id,
      ok: (L, x) => !!L.person(x),
      text: (L, x) => { const g = L.person(x); return `It is your day with ${first(g)}, who is ${g.age} and has already asked eleven questions about the moon. What shall the two of you do?`; },
      opts: [
        { t: 'Rock pools at the cove, and a bucket', run(L, x) { return teach(L, x, 'fitness', 'Crabs, a blenny, and a starfish that you put back very gently. You come home wet to the knees and sandy everywhere else.'); } },
        { t: 'Bake scones, and lick the bowl', run(L, x) { return teach(L, x, 'craft', 'Flour on the ceiling, somehow. The scones are like rocks and you both eat three.'); } },
        { t: 'The library, and the big atlas', run(L, x) { return teach(L, x, 'smarts', 'You look up every country with a funny name. Miss Achterberg glares, and then brings you a book about volcanoes.'); } },
        { t: 'The market, and say hello to everyone', run(L, x) { return teach(L, x, 'charm', 'Priya gives you both a piece of cheese, Mr Pym a marble, and the fish man a wink. You are introduced to the whole Square as “my best friend”.'); } },
        { t: 'Teach them to fish off the harbour wall', show: (L) => !!L.s.items.rod, run(L, x) { return teach(L, x, 'craft', 'Three mackerel and a crab that did not want to come. You have never seen anybody so proud of anything.'); } },
      ],
    },
    {
      id: 'chapMindEnd', icon: '🎒', title: 'Big school', ok: (L, x) => !!L.person(x),
      text: (L, x) => `The youngest starts at the big school in September, and does not need minding any more. ${first(L.person(x))} gives you a card. It says THANK YOU, in letters of every colour, and there is a drawing of you with very long arms.`,
      opts: [{ t: 'Put it on the mantelpiece', run(L, x) { L.joy(4); L.bond(L.person(x), 4); L.note('Finished minding the grandchildren.'); return 'Tuesdays are very quiet now. You find you still buy raisins.'; } }],
    },
    {
      id: 'chapOldCrowd', icon: '🍺', title: 'The last of the old crowd', w: 2, once: true,
      when: (L) => L.s.age >= 70 && !L.s.gaol && !L.s.chap.dusk && L.friends().some((p) => p.age >= 62 && p.bond >= 30),
      ctx: (L) => { const p = L.friends().filter((q) => q.age >= 62 && q.bond >= 30).sort((a, b) => a.id - b.id)[0]; return p ? p.id : null; },
      ok: (L, x) => !!L.person(x),
      text: (L, x) => { const p = L.person(x); return `${p.name} rings to say ${he(p)} has been counting, and the two of you are the last of the old crowd who still live in the Bay. ${He(p)} thinks this calls for lunch.`; },
      opts: [
        { t: 'The Gull, the first Friday of every month', run(L, x) { const p = L.person(x); L.s.chap.old.lunch = x; L.bond(p, 10); L.joy(5); return `Fish pie, a half of bitter, and the same three stories every time. You would not change a word of any of them.`; } },
        { t: 'Round up everyone who is left, and those who moved away', check: ['charm', 45], run(L, x, win) { const p = L.person(x); L.bond(p, 6); if (win) { for (const q of L.friends()) L.bond(q, 4); L.joy(9); return 'Fourteen of you in the back room of the Gull, two from as far as Canada. Somebody brings photographs. The landlord has to ask you to leave, which has not happened in forty years.'; } L.joy(3); return 'Four people come, one of them by mistake. It is a lovely afternoon all the same.'; } },
        { t: 'You are not one for reunions', run(L, x) { L.bond(L.person(x), -3); return 'You send a postcard. It has a picture of the Gull on it, which you think is quite funny.'; } },
      ],
    },
    {
      id: 'chapAdventure', icon: '🎈', title: 'One more thing', w: 3, once: true,
      when: (L) => L.s.age >= 68 && L.s.age <= 88 && L.s.health >= 35 && !L.s.gaol && !L.s.chap.dusk && L.s.cash + L.s.bank >= 1000,
      text: 'You wake up one morning with a feeling you have not had for years. There is one more thing you always meant to do, and if not now, when?',
      opts: [
        { t: 'Sail round to the islands, on your own', show: (L) => !!L.s.items.boat, odds: (L) => clamp(0.55 + L.s.st.fitness / 300 + L.s.st.craft / 400, 0.3, 0.92), run(L, x, win) { if (win) return adv(L, 16, 'sailed alone to the islands and back', 'Three days of wind and sea and nobody, and puffins, and the lighthouse winking you home. You come in on the evening tide and the harbour is lined with people.'); L.hp(-4, 'a cold night at sea'); L.joy(4); return 'The wind drops, then turns. Captain Quinn and the lifeboat bring you home, and she says nothing at all, which is worse than anything.'; } },
        { t: 'See the Northern Lights', cost: 6000, run(L) { L.hp(-2); return adv(L, 14, 'went north to see the Northern Lights', 'A week of cold, and a night when the whole sky moves, green and silent. You stand in the snow until your feet go, and do not care.'); } },
        { t: 'Go up in a balloon at the Regatta', cost: 900, run(L) { return adv(L, 12, 'went up in a hot-air balloon over the Regatta', 'Up and up, and the whole Bay laid out below like a map of your life. You can see the Gull, the church, your own roof. You wave. Somebody waves back.'); } },
        { t: 'Swim across the bay for the lifeboat', check: ['fitness', 32], run(L, x, win) { if (win) { L.karma(3); L.fame(1); return adv(L, 14, 'swam across the bay for the lifeboat', 'Two hours, a jellyfish, and the whole town on the far beach with towels. You raise $3,000 for the lifeboat and a cheer you will remember for ever.'); } L.hp(-5, 'a cold swim'); L.joy(4); return 'You swim half of it, and are towed the rest by a very kind man in a canoe. They still give you a medal.'; } },
        { t: ic('daredevil', 'Jump out of an aeroplane'), show: tr('daredevil'), cost: 1200, odds: () => 0.9, run(L, x, win) { if (win) { L.fame(1); return adv(L, 18, 'jumped out of an aeroplane', 'The door opens, and the sky comes in, and you go. For a whole minute you are a bird. The Gazette puts you on the front page.'); } L.hp(-6, 'a hard landing'); return 'The landing is not what they promised. The view was, though.'; } },
        { t: 'Perhaps next year', run() { return 'You make a list. The list goes in a drawer. The drawer is full of lists.'; } },
      ],
    },
    {
      id: 'chapAffairs', icon: '📜', title: 'A letter from Mrs Gale', w: 3, once: true,
      when: (L) => L.s.age >= 62 && !L.s.chap.will.made && !L.s.gaol && (L.chapCands().length > 0 || L.netWorth() >= 100000),
      text: 'Mrs Gale, the solicitor on the High Street, writes to say she does not like to be morbid, but at your age, and with what you have, have you thought about a will? She can see you on Thursday.',
      opts: [
        { t: 'See her on Thursday', cost: 400, run(L) { L.s.chap.will.made = L.s.t; L.joy(3); return 'An hour in an office that smells of old paper. Your will is in her tin box now, and you can change it whenever you like: it is on the Me tab, and at her office on the High Street.'; } },
        { t: 'Do it yourself, from a form at the post office', check: ['smarts', 40], run(L, x, win) { L.s.chap.will.made = L.s.t; if (win) { L.joy(2); return 'Witnessed by the postmistress and a man buying stamps. Mrs Gale reads it later and says, grudgingly, that it will do.'; } L.cash(-400); return 'You fill it in wrong in two places. Mrs Gale puts it right for $400, and a look.'; } },
        { t: 'You plan to live for ever', run(L) { L.joy(1); return 'Mrs Gale writes back that she admires the plan, and that her door is open.'; } },
      ],
    },
    {
      id: 'chapRivalry', icon: '🫖', title: 'What is in the will', w: 2, once: true,
      when: (L) => L.s.age >= 55 && L.s.chap.will.split === 'heir' && !!L.chapHeir() && L.kids().filter((k) => k.age >= 18 && k !== L.chapHeir()).length > 0 && !L.s.gaol,
      ctx: (L) => { const h = L.chapHeir(), o = L.kids().filter((k) => k.age >= 18 && k !== h); return o.length ? o[0].id : null; },
      ok: (L, x) => !!L.person(x) && L.s.chap.will.split === 'heir',
      text: (L, x) => { const p = L.person(x), h = L.chapHeir(); return `${first(p)} has found out that half of everything goes to ${h ? first(h) : 'the heir'}. ${He(p)} does not shout. ${He(p)} goes very quiet, which is worse.`; },
      opts: [
        { t: 'Explain why', check: ['charm', 50], run(L, x, win) { const p = L.person(x); if (win) { L.bond(p, -2); return `You tell ${him(p)} why, all of it. ${He(p)} does not like it, but ${he(p)} understands, and stays for tea.`; } L.bond(p, -12); return `It comes out wrong. ${first(p)} leaves before the kettle boils.`; } },
        { t: 'Change it: share it fairly', run(L, x) { const p = L.person(x), h = L.chapHeir(); L.s.chap.will.split = 'fair'; L.bond(p, 6); if (h) L.bond(h, -3); return 'You ring Mrs Gale the same afternoon. Everybody gets the same, and nobody is entirely happy, which she says is how she knows it is fair.'; } },
        { t: 'It is your money', run(L, x) { L.bond(L.person(x), -15); L.joy(-3); return 'It is. That does not make Sunday lunch any easier.'; } },
      ],
    },
    {
      id: 'chapMemoirDone', icon: '📜', title: (L, x) => x.title,
      text: (L, x) => `Your memoirs are finished: ${MEMO * 30} pages in a box file, called ${x.title}. What will you do with them?`,
      opts: [
        { t: 'Have copies printed for the family', cost: 300, run(L, x) { done(L, x, 'family'); for (const p of L.s.people) if (['child', 'grandchild', 'sibling', 'spouse', 'partner'].includes(p.kind)) L.bond(p, 6); L.joy(6); return 'A copy each, with a ribbon. Your grandson reads his under the table at dinner, and laughs out loud at the bit about the vicar.'; } },
        { t: 'Give them to Miss Achterberg for the town archive', run(L, x) { done(L, x, 'archive'); L.karma(3); L.joy(4); if (L.folkWarm && L.s.folk) L.folkWarm('achterberg', 6); return 'Miss Achterberg reads the first page standing up, then sits down and reads the rest. She files it under the history of the town, and says nothing about the romantic parts.'; } },
        { t: 'Send them to a publisher in the city', odds: (L, x) => clamp(0.12 + x.q / 160 + L.s.fame / 200, 0.1, 0.85), run(L, x, win) { if (win) { done(L, x, 'published'); const n = Math.round((4000 + L.s.fame * 150) / 100) * 100; L.cash(n); L.fame(3); L.joy(10); return `A letter from the city: they will publish. The Bay bookshop orders forty copies and sells out in a week. ${money(n)}, and a signing at the library.`; } done(L, x, 'family'); L.joy(1); return '“Very personal,” the publisher writes, which you take to mean no. You have copies made for the family instead, and they are very glad of them.'; } },
      ],
    },

    // ---- the end ----
    {
      id: 'chapDusk', icon: '🩺', title: 'What the doctor said',
      text: (L, x) => `Dr Shah at St Wren’s sits down, which is how you know. ${/heart/.test(x.cause) ? 'Your heart is tired, she says, and there is nothing left to mend in it.' : x.cause === 'old age' ? 'Nothing is wrong, exactly: everything is wearing out at once, the way it does.' : `It is the ${x.cause}, she says, and it is not going to get better now.`} She thinks you have a year, perhaps a little more. She says it very kindly, and then she says it again, because nobody hears it the first time.`,
      inText: (L, x) => `The prison doctor sits down on the end of your bunk, which is how you know. ${/heart/.test(x.cause) ? 'It is your heart.' : x.cause === 'old age' ? 'Everything is wearing out at once.' : `It is the ${x.cause}.`} A year, perhaps. Mr Hobbs brings you a cup of tea afterwards and does not say anything, which is kind of him.`,
      opts: [
        { t: 'Meet it with grace', run(L) { dusk(L, 'grace'); L.joy(4); return 'You walk home the long way, along the front, and buy an ice cream, because why ever not.'; } },
        {
          t: 'Fight it, with everything St Wren’s has', show: (L) => !L.s.gaol, cost: (L) => L.medCost(6000), odds: (L) => clamp(0.3 + L.s.health / 250 + L.s.st.fitness / 400, 0.2, 0.75),
          run(L, x, win) {
            const D = dusk(L, 'fight');
            D.treat = L.s.t + 1;
            if (win) { D.left += L.int(4, 8); L.hp(10); L.joy(-2); return 'Six weeks of treatment that is worse than the illness, and then Dr Shah smiles for the first time: it has worked, for now. More time. You mean to use it.'; }
            L.hp(-4); L.joy(-6); return 'It does not work. You are glad, in a way, that you tried, and gladder that it is over.';
          },
        },
        { t: 'Tell nobody yet', run(L) { dusk(L, 'quiet'); return 'You fold the letter small and put it in your coat pocket, and you carry on exactly as before, which is harder than it sounds.'; } },
        { t: ic('churchgoer', 'Ask the Reverend Hollis to call'), show: tr('churchgoer'), run(L) { dusk(L, 'grace'); L.joy(6); return 'She comes that afternoon with a jar of honey and no pamphlets at all, and stays until it is dark. You talk about bees, mostly. It is exactly right.'; } },
        { t: (L) => ic('romantic', `Go home and tell ${first(L.partner())} first`), show: (L) => tr('romantic')(L) && !!L.partner() && !L.s.gaol, run(L) { dusk(L, 'grace'); L.bond(L.partner(), 10); L.joy(5); return `${first(L.partner())} holds both your hands across the kitchen table and does not let go for a long time.`; } },
      ],
    },
    {
      id: 'chapFarewell', icon: '🎉', title: 'A party', ok: (L) => !!L.s.chap.dusk && !L.s.gaol,
      text: (L) => { const p = L.partner() || L.kids().slice().sort((a, b) => b.bond - a.bond)[0]; return `${p ? first(p) : 'Betty from the café'} wants to throw you a party. Not a goodbye party, ${p ? he(p) : 'she'} says firmly. Just a party. Everybody knows what kind of party it is.`; },
      opts: [
        { t: 'The Gull, and everyone', cost: 800, run(L) { for (const p of L.s.people) if (['friend', 'child', 'grandchild', 'sibling', 'spouse', 'partner'].includes(p.kind)) L.bond(p, 6); L.joy(10); L.note('A party at the Gull, with everyone.', 'big'); return 'Betty does the sandwiches. Old Marlow tells the story about the Merrow. Captain Quinn says eleven words, which counts as a speech. You dance once, carefully, and it is the best night in years.'; } },
        { t: 'Just the family, at home', run(L) { for (const p of L.s.people) if (['child', 'grandchild', 'sibling', 'spouse', 'partner'].includes(p.kind)) L.bond(p, 8); L.joy(8); return 'A long table, the good plates, and everybody talking at once. Someone brings out the old photographs and nobody can agree who anybody is.'; } },
        { t: 'No party. A walk on the beach instead', run(L) { L.joy(6); return 'The tide out, the sand hard and ribbed, the sky enormous. You walk as far as the rocks and back. It is all the party you want.'; } },
      ],
    },
    {
      id: 'chapSummer', icon: '☀️', title: 'One more summer', ok: (L) => !!L.s.chap.dusk && !L.s.gaol,
      text: 'The sea is warm enough at last, and so is the bench by the pond. Everybody seems to know this summer is a particular one, and nobody says so.',
      opts: [
        { t: 'The beach, with everyone', run(L) { for (const p of L.s.people) if (['child', 'grandchild', 'spouse', 'partner'].includes(p.kind)) L.bond(p, 5); L.joy(8); return 'Deckchairs, a windbreak that will not stay up, sandwiches with sand in, and every one of them there. You paddle, and the cold makes you shout.'; } },
        { t: 'The garden, with a book you have been saving', run(L) { L.hp(2); L.joy(7); return 'A deckchair under the apple tree and a book you were saving for best. You read it slowly, to make it last.'; } },
        { t: 'Out in the boat, one more time', show: (L) => !!L.s.items.boat, run(L) { L.joy(10); return 'Wind on the beam, the town small behind you, a seal looking up as if it knew. You stay out until the light goes.'; } },
      ],
    },
    {
      id: 'chapLetter', icon: '✉️', title: (L, x) => `A letter to ${first(L.person(x))}`, ok: (L, x) => !!L.person(x) && !!L.s.chap.dusk,
      text: (L, x) => `You sit down to write to ${first(L.person(x))}. Not the will: Mrs Gale has that. The other thing.`,
      opts: [
        { t: 'Tell them what you are proud of', run(L, x) { return letter(L, x, 'proud'); } },
        { t: 'Tell them where you went wrong, so they need not', run(L, x) { return letter(L, x, 'wrong'); } },
        { t: 'Tell them where the good fishing is, and the key to the shed', run(L, x) { return letter(L, x, 'shed'); } },
        { t: 'Do not write. They know.', run() { return 'You put the pen down. Some things are better said, and you say them, over the next few weeks, one at a time.'; } },
      ],
    },
    {
      id: 'chapLast', icon: '🕯️', title: 'The last morning', log: false,
      text: (L, x) => x.text,
      opts: [
        { t: 'Let go', run(L, x) { L.die(x.cause); return ''; } },
        { t: 'Say one last thing', run(L, x) { const said = L.pick(['“Mind the step,” you say, and everyone laughs, and then nobody does.', '“Look after each other,” you say. “And the boat.”', '“It was a good life,” you say. “Tell the Gull.”', '“Put the kettle on,” you say, and they do.']); L.die(x.cause); return said; } },
      ],
    },

    // ---- the everyday of later life (these come round again) ----
    {
      id: 'chapBench', icon: '🦆', title: 'The bench by the pond', w: 3, cd: 14, when: (L) => L.s.age >= 65 && !L.s.gaol && !L.s.chap.dusk,
      text: (L) => `You are on ${L.s.gifts.bench ? `the bench with ${L.s.gifts.bench === L.s.name ? 'your own name' : `${L.s.gifts.bench}’s name`} on it` : 'the bench by the pond'}, with a paper bag of bread for the ducks. A young couple with a pushchair sit down at the other end, and the woman asks if you have lived here long.`,
      opts: [
        { t: 'Tell them how the Bay was when you first knew it', run(L) { L.gain('charm', 0.5); L.joy(4); const p = L.maybeMeet(0.25); return p ? `The Gull before the jukebox, the winter the harbour froze, the pier with its far end still open. They stay an hour, and ${p.name} asks if you will be here next week.` : 'The Gull before the jukebox, the winter the harbour froze, the pier with its far end still open. They stay an hour, and the baby sleeps through all of it.'; } },
        { t: 'Ask about them instead', run(L) { L.joy(3); L.karma(1); return 'Two years here, from the city, and a baby who will not sleep. You tell them the pond is the best place in the Bay for that, and it is: she is asleep before the bread runs out.'; } },
        { t: (L) => { const g = L.grandkids().filter((q) => q.age < 13)[0]; return `Fetch ${g ? first(g) : 'a grandchild'} to feed the ducks with you`; }, show: (L) => L.grandkids().some((q) => q.age < 13), run(L) { const g = L.grandkids().filter((q) => q.age < 13)[0]; L.bond(g, 5); L.joy(5); return `${first(g)} throws the whole bag in at once, bread and all, and a swan takes it personally. You laugh until you have to sit back down.`; } },
        { t: ic('loner', 'Say you have, and go back to the ducks'), show: tr('loner'), run(L) { L.joy(4); return 'They take the hint, kindly. The ducks, who have no tact at all, do not.'; } },
      ],
    },
    {
      id: 'chapAdvice', icon: '🫖', title: 'Asking your advice', w: 3, cd: 16,
      when: (L) => L.s.age >= 62 && !L.s.gaol && !L.s.chap.dusk,
      ctx: (L) => { const l = L.s.people.filter((p) => ((p.kind === 'child' && p.age >= 18) || (p.kind === 'grandchild' && p.age >= 16)) && p.bond >= 30); return l.length ? { p: L.pick(l).id, d: L.int(0, 3) } : null; },
      ok: (L, x) => !!L.person(x.p),
      text: (L, x) => { const p = L.person(x.p); return `${first(p)} comes round with a cake from Betty’s and the look of somebody with a decision to make: ${['a job in the city, a good one, a long way from the sea', 'whether to marry the one ' + he(p) + ' has been seeing, who is lovely and also a drummer', 'whether to put everything into a little business of ' + his(p) + ' own', 'whether to buy a house that needs everything doing'][x.d]}. ${He(p)} wants to know what you think.`; },
      opts: [
        { t: 'Say what you would do', check: ['charm', 45], run(L, x, win) { const p = L.person(x.p); if (win) { L.bond(p, 6); L.joy(2); return `You say it plainly and kindly, and ${first(p)} nods slowly, as though you had said what ${he(p)} already knew.`; } L.bond(p, -2); return `It comes out as a lecture. ${first(p)} eats the cake politely and goes home none the wiser.`; } },
        { t: 'Tell them what you did, and how it turned out', run(L, x) { const p = L.person(x.p); L.bond(p, 5); L.joy(2); return `You tell ${him(p)} the whole story, the bits that went wrong too. ${He(p)} has never heard most of it, and listens to all of it.`; } },
        { t: 'Ask what they want, and say nothing else', run(L, x) { const p = L.person(x.p); L.bond(p, 5); return `${He(p)} talks for an hour and answers the question ${him(p)}self. You only had to pour the tea.`; } },
        { t: 'Give them something towards it', cost: 2000, show: (L) => L.s.age >= 40, run(L, x) { const p = L.person(x.p); settle(L, p, 2000, false); L.bond(p, 8); return `${first(p)} says you cannot, and you say you can, and that is the end of it.`; } },
      ],
    },
    {
      id: 'chapKnees', icon: '🦵', title: 'The knees have opinions', w: 3, cd: 12, when: (L) => L.s.age >= 70 && !L.s.gaol && !L.s.chap.dusk,
      text: 'Your knees have started forecasting the weather, and they are more reliable than the man on the radio.',
      opts: [
        { t: 'A course of physio at St Wren’s', cost: (L) => L.medCost(600), run(L) { L.hp(5); return 'Bev the physiotherapist gives you exercises with names like "the duck" and "the drawbridge". They work, which you find annoying.'; } },
        { t: 'Swim at the cove every morning', check: ['fitness', 35], run(L, x, win) { if (win) { L.hp(4); L.gain('fitness', 1.5); L.joy(3); return 'Cold enough to stop your heart, and then it starts again, better. The knees go quiet.'; } L.hp(-2); L.joy(1); return 'Two mornings, a cold you do not need, and a firm resolution to try again in June.'; } },
        { t: ic('sporty', 'Join the over-seventies tai chi in the park'), show: tr('sporty'), run(L) { L.hp(3); L.joy(3); const p = L.maybeMeet(0.4); return p ? `Slow, careful, and surprisingly hard. ${p.name}, on the next mat, wobbles worse than you, and you are friends by Friday.` : 'Slow, careful, and surprisingly hard. A heron watches the whole class with contempt.'; } },
        { t: 'Ignore them', run(L) { L.hp(-2); return 'They do not like being ignored, and tell you so on the stairs.'; } },
      ],
    },
  ];
  addEvents(CARDS);
  const CARD = Object.fromEntries(CARDS.map((e) => [e.id, e]));
  // The cards of later life, which come round more often after sixty-five than the town's chance would bring them.
  const LATER = ['chapHip', 'chapHeart', 'chapDownsize', 'chapMind', 'chapMindDay', 'chapOldCrowd', 'chapAdventure', 'chapAffairs', 'chapSlower', 'chapRivalry', 'chapBench', 'chapAdvice', 'chapKnees'];
  function laterCard(L) {
    const s = L.s;
    const pool = LATER.map((id) => CARD[id]).filter((e) => !(e.once && s.seen[e.id]) && !(s.cd[e.id] != null && s.t - s.cd[e.id] < (e.cd ?? 24)) && (!e.when || e.when(L)));
    if (!pool.length) return;
    const e = L.pick(pool), x = e.ctx ? e.ctx(L) : null;
    if (e.ctx && x == null) return;
    s.cd[e.id] = s.t; s.seen[e.id] = 1;
    L.queue(e.id, x);
  }

  // ---- what the cards do ----

  function ic(id, t) { const icon = { bookish: '📚', loner: '🌫️', joker: '🃏', sporty: '🏃', churchgoer: '⛪', romantic: '🌹', daredevil: '🪂' }[id]; return `${icon} ${t}`; }
  function teach(L, x, k, said) {
    const g = L.person(x), C = L.s.chap;
    L.bond(g, 5); L.joy(4); L.hp(1);
    if (!g.taught) { g.taught = k; C.n.taught++; }
    return `${said} (${first(g)} is learning ${STAT_NAME[k]} from you.)`;
  }
  function adv(L, joy, said, text) {
    L.s.chap.old.adv = { age: L.s.age, said };
    L.joy(joy);
    L.note(`One last adventure: ${said}, at ${L.s.age}.`, 'big');
    return text;
  }
  function done(L, x, how) {
    const C = L.s.chap;
    C.memo.done = { title: x.title, how, age: L.s.age };
    L.note(`Wrote your memoirs, ${x.title}.`, 'big');
  }
  function dusk(L, way) {
    const D = L.s.chap.dusk || (L.s.chap.dusk = { at: L.s.t, cause: 'old age', left: 4, way: null, treat: null, done: {} });
    D.way = way;
    L.note(way === 'quiet' ? 'The doctor gave you a year, perhaps. You kept it to yourself.' : `The doctor gave you a year, perhaps. You chose to ${way === 'grace' ? 'meet it with grace' : 'fight it'}.`, 'big');
    return D;
  }
  function letter(L, x, kind) {
    const s = L.s, p = L.person(x), me = calledBy(s, p.kind), C = s.chap;
    const proud = [];
    if (p.job && p.age >= 18) proud.push(`how you made your own way as ${an(lowJob(L.jobOf(p)))}`);
    if (L.grandkids().some((g) => g.of === p.id)) proud.push('the way you are with the children');
    if (p.taught) proud.push(`how quickly you took to ${STAT_NAME[p.taught]} when you were small`);
    proud.push('the way you laugh, which is my mother’s laugh exactly');
    const top = C.marks.slice().sort((a, b) => b.w - a.w).find((m) => /^(Declared|Sent to|Sacked|Divorced|Split)/.test(m.x));
    const text = kind === 'proud' ? `I am proud of you. I never said it enough, so here it is in ink: I am proud of ${proud[0]}${proud[1] ? `, and of ${proud[1]}` : ''}. Be kind to yourself. Love, ${me}.`
      : kind === 'wrong' ? `I got some things wrong${top ? `: “${top.x.replace(/\.$/, '')}” is in the journal, and there is more that is not` : ''}. Do not be too proud to say sorry, and do not wait for the right moment, because it does not come. Love, ${me}.`
      : `The bass come in under the harbour wall on a rising tide in August; use a bit of mackerel. The key to the shed is under the third flowerpot, not the second. The rest you know. Love, ${me}.`;
    C.letter = { to: p.id, text };
    L.bond(p, 6); L.joy(3);
    return kind === 'shed' ? 'Two pages of instructions, and a map of the harbour in biro. Somehow it is the most loving thing you have ever written.' : `You write it twice, and post neither. Then you put the second one in an envelope with ${first(p)}’s name on it, and give it to Mrs Gale to keep.`;
  }

  // ---- trophies ----
  Object.assign(TROPHIES, {
    chapNew: { name: 'A new chapter', icon: '🛤️', desc: 'Take up a new dream at a crossroads.', test: (L) => !!L.s.chap && L.s.chap.was.length >= 1 },
    chapWords: { name: 'In my own words', icon: '📜', desc: 'Write your memoirs.', test: (L) => !!L.s.chap && !!L.s.chap.memo.done },
    chapOrder: { name: 'Affairs in order', icon: '🗝️', desc: 'Make a will, and give the family something while you are here to see it.', test: (L) => !!L.s.chap && !!L.s.chap.will.made && (L.s.chap.n.settled || 0) > 0 },
    chapMinder: { name: 'Tuesdays and Thursdays', icon: '🧸', desc: 'Mind the grandchildren for two years.', test: (L) => !!L.s.chap && (L.s.chap.n.minded || 0) >= 8 },
    chapLate: { name: 'Never too late', icon: '🎈', desc: 'Have one last adventure after sixty-eight.', test: (L) => !!L.s.chap && !!L.s.chap.old.adv },
    chapGrace: { name: 'At peace', icon: '🕊️', desc: 'Meet the end with grace.', test: (L) => !!L.s.chap && !!L.s.dead && !!L.s.chap.dusk && L.s.chap.dusk.way === 'grace' },
  });
}
