// New in Town: a story for every career. Forty years in one job should have
// a plot, so each career (and Sal's crew) has one: five or six chapters that
// come as you rise through the rungs and the years go by, each a card with a
// real choice in it. Somebody who taught you the job and somebody who wanted
// it more than you did turn up all the way through, and remember what you
// did. A choice can cost you your standing, your name, the job itself or, for
// the worst of them, the right to work in that line again; another can put
// the top job in your hands years early. Retire from a career you rose in and
// there is a proper send-off. The stories themselves are in careers-tales.js
// and careers-tales2.js; this is how they are told.
//
// Everything is kept in s.careers:
//   st[career]: { n: chapters told (or passed over, from: the chapter a story taken
//                 up partway began at), q: seasons worked in it, at: when the last
//                 chapter came, f: what was decided (each story's own notes),
//                 mn: the mentor, rv: the rival ({ id, name, sex, age, t, v }:
//                 id among your people while they are about, age at season t,
//                 v how they feel about you, dead: when they died), gaz: a line
//                 for the Gazette, sent: given a send-off, gift: what they gave
//                 you, retired: the season you retired from it (no going back) }
//   bar[career]: { until, why }  not to be taken on again until season `until`
//   job: the job as last seen ({ c, r }), so a retirement knows what it ended
//   n: { arcs, sendoffs, peace, fast, sacked }  for trophies

import { CAREERS, TROPHIES, NAMES_M, NAMES_F, money } from './data.js';
import { tales as talesA } from './careers-tales.js';
import { tales as talesB } from './careers-tales2.js';

// A chapter comes at the earliest GAP seasons after the last, and then with
// PACE's chance each season (so every three or four years).
const GAP = 8, PACE = 0.3;
// The seasons in the job each chapter waits for, unless it says otherwise: the
// whole story takes twenty years or so, if you rise as you go.
const Y = [2, 12, 28, 46, 64, 84];
// For good: a bar this long is never lifted.
const EVER = 4000;
// Names for the people you work with (not the town's own families).
const SURN = ['Pengelly', 'Trevithick', 'Rowe', 'Nance', 'Polglase', 'Hocking', 'Kitto', 'Jago', 'Rosewarne', 'Treloar', 'Bolitho', 'Chenoweth', 'Tonkin', 'Pascoe', 'Trewin', 'Carne', 'Lanyon', 'Retallick', 'Spargo', 'Vosper', 'Hosking', 'Angwin', 'Curnow', 'Clemo', 'Annear', 'Bray', 'Opie', 'Tregear'];

const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
const blank = () => ({ st: {}, bar: {}, job: null, n: { arcs: 0, sendoffs: 0, peace: 0, fast: 0, sacked: 0 } });
const cap = (t) => t[0].toUpperCase() + t.slice(1);
const trait = (L, id) => !!(L.soulHas && L.s.soul && L.soulHas(id));
// A trait's mark on a choice that only those with it are offered (as soul.js does it).
const MARK = { grafter: '🛠️', idler: '🛋️', kind: '💗', hothead: '🌶️', charmer: '😏', daredevil: '🪂', bookish: '📚', thrifty: '🪙', joker: '🃏', romantic: '🌹', churchgoer: '⛪', sporty: '🏃', loner: '🌫️', nightowl: '🦉' };
const T = (id, text) => `${MARK[id] || ''} ${text}`;

// ---- the people at work ------------------------------------------------------------------

// How somebody from a story stands: alive among your people, or remembered.
function present(L, rec) {
  if (!rec || rec.id == null) return null;
  const p = L.person(rec.id);
  return p && p.name === rec.name ? p : null;
}
// What they think of you: for a rival, below nothing is a grudge.
function stance(L, rec) {
  const p = present(L, rec);
  if (!p) return rec.v;
  if (p.kind === 'enemy') return -p.grudge;
  if (p.kind === 'ex') return -(p.grudge || 0);
  return p.bond;
}
// What a story needs to know of somebody, to talk about them.
function view(L, rec) {
  if (!rec) return null;
  const p = present(L, rec), m = rec.sex === 'm', [first, ...rest] = rec.name.split(' ');
  return {
    name: rec.name, first, last: rest.join(' '), sex: rec.sex, p, here: !!p, dead: rec.dead != null,
    age: p ? p.age : rec.age + Math.floor((L.s.t - rec.t) / 4), v: stance(L, rec),
    he: m ? 'he' : 'she', He: m ? 'He' : 'She', him: m ? 'him' : 'her', his: m ? 'his' : 'her', His: m ? 'His' : 'Her',
    man: m ? 'man' : 'woman', Mr: m ? 'Mr' : 'Mrs',
  };
}
function freshName(L, sex) {
  const used = new Set(L.s.people.map((p) => p.name));
  for (const st of Object.values(L.s.careers.st)) for (const r of [st.mn, st.rv]) if (r) used.add(r.name);
  const names = sex === 'm' ? NAMES_M : NAMES_F;
  for (let i = 0; i < 40; i++) { const n = `${L.pick(names)} ${L.pick(SURN)}`; if (!used.has(n)) return n; }
  return `${L.pick(names)} ${L.pick(SURN)}`;
}
const person = (L, sex, age) => ({ id: null, name: freshName(L, sex), sex, age, t: L.s.t, v: 0 });

// ---- the kit the stories are told with ---------------------------------------------------

function stOf(L, c) {
  const all = L.s.careers.st;
  if (!all[c]) all[c] = { n: 0, q: 0, at: -99, f: {}, mn: null, rv: null, gaz: '', sent: 0, gift: '' };
  return all[c];
}
// How you stand with the boss.
function perf(L, d) {
  const j = L.s.job;
  if (!j) return;
  j.perf = clampN(j.perf + d, 0, 100);
  L.s.stand[j.c] = j.perf;
}
const credit = (L, n) => { if (L.s.job) L.s.job.n = Math.max(0, L.s.job.n + n); };
const raise = (L, d) => { const j = L.s.job; if (j) j.raise = clampN((j.raise || 0) + d, 0, 0.4); };
// A bonus of n shifts' pay. Returns how much, written out.
const bonus = (L, n) => { const got = L.s.job ? Math.round(L.shiftPay() * n / 10) * 10 : 0; L.cash(got); L.s.n.earned += got; return money(got); };
const busy = (L, n) => { L.s.time = Math.max(0, L.s.time - n); };

// The mentor thinks more (or less) of you. Somebody who has drifted out of
// your life comes back into it if you give them reason to.
function mentor(L, k, d, meet = false) {
  const rec = k.st.mn;
  if (!rec || rec.dead != null) return null;
  let p = present(L, rec);
  const was = stance(L, rec);
  if (p) {
    if (p.kind === 'enemy') p.grudge = clampN(p.grudge - d, 1, 100);
    else L.bond(p, d);
  } else if ((d > 0 || meet) && was + d >= 12 && L.friends().length < 20) {
    p = L.meet({ name: rec.name, sex: rec.sex, age: view(L, rec).age, job: k.c, bond: clampN(was + d, 12, 75), single: false, trait: rec.trait || 'kind' });
    rec.id = p.id;
  }
  rec.v = p ? stance(L, rec) : clampN(was + d, -100, 100);
  return p;
}
// The rival warms to you, or takes against you: a friend, an enemy (see
// feuds.js), or for a while nobody in particular.
function rival(L, k, d) {
  const rec = k.st.rv;
  if (!rec || rec.dead != null) return null;
  let p = present(L, rec);
  const was = stance(L, rec), age = view(L, rec).age;
  if (p && p.kind === 'enemy') {
    p.grudge = clampN(p.grudge - d, 0, 100);
    if (d > 0 && p.grudge <= 10) {
      // Made it up: from now on a friend, of a sort.
      for (const key of ['grudge', 'nerve', 'hard', 'since']) delete p[key];
      Object.assign(p, { kind: 'friend', bond: clampN(15 + d / 2, 15, 45), single: false });
    }
  } else if (p && p.kind === 'friend') {
    if (d < 0 && p.bond + d <= 0) L.turnFoe(p, clampN(20 - d - p.bond, 20, 90));
    else L.bond(p, d);
  } else if (p) L.bond(p, d);
  else if (d <= -10 && L.enemies().length < 4) { p = L.foe({ name: rec.name, sex: rec.sex, age, job: k.c, grudge: clampN(25 - was - d, 20, 90) }); rec.id = p.id; }
  else if (d >= 10 && L.friends().length < 20) { p = L.meet({ name: rec.name, sex: rec.sex, age, job: k.c, bond: clampN(18 + was + d, 18, 60), single: false }); rec.id = p.id; }
  rec.v = p ? stance(L, rec) : clampN(was + d, -100, 100);
  if (was < 0 && rec.v >= 15 && !k.st.f.peace) { k.st.f.peace = 1; L.s.careers.n.peace++; }
  return p;
}
// Could you step straight up a rung, if they let you? (Everything but the shifts.)
function canRise(L) {
  const j = L.s.job;
  if (!j) return false;
  const next = CAREERS[j.c].rungs[j.r + 1];
  return !!next && L.needs(next.need).every((n) => n.ok);
}
// Up a rung now, with the shifts waived: done as a shift does it (Life.work in engine.js).
function promote(L) {
  const s = L.s, j = s.job, car = CAREERS[j.c];
  j.r++; j.n = 0; j.raise = 0; j.auto = 0;
  s.worked[j.c] = Math.max(s.worked[j.c] ?? 0, j.r);
  s.f.promoted = 1;
  L.joy(8);
  if (j.r === car.rungs.length - 1) s.f.top = 1;
  if (j.c === 'crew' && j.r === car.rungs.length - 1) s.f.kingpin = 1;
  if (j.c === 'medicine' && j.r >= 4) s.f.wasDoctor = 1;
  if (j.c === 'sea' && j.r >= 4) s.f.wasCaptain = 1;
  if (j.c === 'politics' && j.r >= 4) s.f.wasMayor = 1;
  s.careers.n.fast++;
  L.note(`Promoted to ${car.rungs[j.r].title}.`, 'big');
  L.say('📈', `Promoted to ${car.rungs[j.r].title}!`, 'promo');
  s.careers.job = { c: j.c, r: j.r };
}
// A chance at the next rung: taken if you are ready for it, or a long step towards it if not.
function up(L, k) {
  if (canRise(L)) { promote(L); return true; }
  credit(L, 8); perf(L, 8);
  return false;
}
// Out of the door. bar: seasons before they would have you back (EVER for good).
function sack(L, k, said, o = {}) {
  const s = L.s, j = s.job;
  if (!j) return;
  const t = L.jobTitle();
  s.job = null;
  s.stand[j.c] = Math.min(s.stand[j.c] ?? 50, o.stand ?? 20);
  const bar = o.bar ?? 4;
  if (bar) s.careers.bar[j.c] = { until: s.t + bar, why: o.why || 'They will not have you back' };
  s.careers.n.sacked++;
  s.careers.job = null;
  L.note(said || `Sacked as ${t}.`, 'big');
}
// A line for the Gazette, when the time comes ({He}, {he}, {his}, {him} filled in then).
const gaz = (L, k, text) => { k.st.gaz = text; };

// ---- the stories, put together ------------------------------------------------------------

const KIT = { perf, credit, raise, bonus, busy, mentor, rival, sack, up, canRise, gaz, trait, T, cap, money };
export const STORIES = { ...talesA(KIT), ...talesB(KIT) };
const cardId = (c, i) => `career_${c}${i}`;

// What a chapter is handed: the career, its notes, and the people in it.
function ctx(L, x) {
  const st = stOf(L, x.c), j = L.s.job, car = CAREERS[x.c];
  return {
    c: x.c, n: x.n, st, f: st.f, M: view(L, st.mn), R: view(L, st.rv),
    title: L.jobTitle(), r: j ? j.r : 0, top: !!j && j.r === car.rungs.length - 1,
    next: j && car.rungs[j.r + 1] ? car.rungs[j.r + 1].title : null, rise: canRise(L), car,
  };
}
// Still in the job the chapter was written for, and it has not been told yet.
const fits = (L, x) => !L.s.gaol && !L.s.dead && !!L.s.job && L.s.job.c === x.c && !!L.s.careers && stOf(L, x.c).n === x.n;

function chapterCard(c, i, ch) {
  const wrapT = (t) => (typeof t === 'function' ? (L, x) => t(L, ctx(L, x)) : t);
  return {
    id: cardId(c, i), icon: ch.icon, title: wrapT(ch.title), ok: fits,
    text: (L, x) => ch.text(L, ctx(L, x)),
    opts: ch.opts.map((o) => ({
      t: wrapT(o.t),
      check: o.check, cost: o.cost && wrapT(o.cost),
      odds: o.odds && ((L, x) => o.odds(L, ctx(L, x))),
      show: o.show && ((L, x) => o.show(L, ctx(L, x))),
      why: o.why && ((L, x) => o.why(L, ctx(L, x))),
      run(L, x, win) {
        const k = ctx(L, x), st = k.st;
        st.n = i + 1;
        const said = o.run(L, k, win) || '';
        // (The first chapter told is where you meet them: the mentor is in your life from now on.)
        if (i === (st.from || 0) && st.mn && st.mn.id == null) mentor(L, k, 0, true);
        // (The whole story, for the trophy, is one heard from its first chapter.)
        if (st.n >= STORIES[c].ch.length && !st.f.done) { st.f.done = 1; if (!st.from) L.s.careers.n.arcs++; }
        if (L.s.job) L.s.careers.job = { c: L.s.job.c, r: L.s.job.r };
        return said;
      },
    })),
  };
}

// The party, the speech and the present, the first time you retire from a career you rose in.
function sendOffCard() {
  const K = (L, x) => ctx(L, { c: x.c, n: -1 });
  return {
    id: 'careerSendoff', icon: '🎉', title: 'A send-off', ok: (L) => !L.s.gaol && !L.s.dead,
    text(L, x) {
      const k = K(L, x), tale = STORIES[x.c], M = k.M, R = k.R;
      const who = M && M.dead ? `There is a photograph of ${M.name} on the table, and a glass poured for ${M.him}.` : M && M.here ? `${M.name}, ${M.age} now and in ${M.his} good coat, has come in specially.` : M ? `A card has come from ${M.name}, who could not be there: “I always said.”` : '';
      const foe = R && !R.dead && R.v < 0 ? ` ${R.name} is at the back, by the door, and has not taken off ${R.his} coat.` : R && !R.dead && R.v >= 20 ? ` ${R.name} has organised the whole thing, and will not admit it.` : '';
      return `Your last day as ${x.title}. ${tale.party} ${who}${foe} They give you ${tale.gift}, and then everybody looks at you.`;
    },
    opts: [
      { t: 'Make a speech', check: ['charm', 45], run(L, x, win) { const k = K(L, x); for (const p of L.friends()) if (p.job === x.c) L.bond(p, 6); mentor(L, k, 6); return sent(L, x, win ? 9 : 5, win ? 'You tell the story about your first week, and it is funnier than you remembered. They laugh in the right places, and one person cries in the right place.' : 'You thank everybody, including the photocopier, and lose your place twice. Nobody minds. They clap as if you had said something wonderful.'); } },
      { t: 'Keep it short', run(L, x) { return sent(L, x, 6, 'Two sentences, both true. The applause goes on a good deal longer than the speech did.'); } },
      { t: (L, x) => `Raise a glass to ${K(L, x).M.name}, who taught you`, show: (L, x) => { const M = K(L, x).M; return !!M && (M.here || M.dead); }, run(L, x) { const k = K(L, x), M = k.M; if (!M.dead) mentor(L, k, 12); L.karma(1); return sent(L, x, 8, M.dead ? `“To ${M.first},” you say, “who would have told me I was holding the glass wrong.” The whole room drinks to ${M.him}.` : `${M.first} pretends to be annoyed at being made a fuss of, and is not. ${M.He} keeps the napkin you wrote the speech on.`); } },
      { t: (L, x) => `Raise a glass to ${K(L, x).R.name}`, show: (L, x) => { const R = K(L, x).R; return !!R && !R.dead && R.v < 0; }, run(L, x) { const k = K(L, x), R = k.R; rival(L, k, 30); L.karma(2); return sent(L, x, 7, `${R.first} looks at the floor for a long moment, then raises ${R.his} glass back. Whatever it was, all those years, it is over.`); } },
    ],
  };
}
function sent(L, x, joy, text) {
  const s = L.s, st = stOf(L, x.c), tale = STORIES[x.c];
  st.sent = 1; st.gift = tale.gift;
  s.careers.n.sendoffs++;
  L.joy(joy);
  L.note(`Retired as ${x.title}: a party, a speech and ${tale.gift}.`, 'big');
  return text;
}

// A story taken up partway: the chapters below the rung you start at have happened, or never
// will (somebody let in as a junior doctor was never a porter), so it starts at the first chapter
// for your rung, counting the years behind you, or as good as, so that it is not long in coming.
// The mentor is somebody who taught you when you started: older, and retired by now, or gone, if
// that was long ago; the rival is somebody your own age who has been after the same jobs.
function join(L, c, r, yrs) {
  const s = L.s, tale = STORIES[c];
  if (!tale || r <= 0) return;
  const st = stOf(L, c);
  if (st.n > 0 || st.mn) return;
  let n = tale.ch.findIndex((ch) => (ch.r || 0) >= r);
  if (n < 0) n = tale.ch.length - 1;
  st.n = n; st.from = n;
  st.q = Math.max(st.q, yrs * 4, (tale.ch[n].y ?? Y[n]) - 2);
  const sex = L.chance(0.5) ? 'm' : 'f', age = yrs > 0 ? s.age + L.int(18, 26) : clampN(s.age + L.int(22, 30), 45, 62);
  st.mn = person(L, sex, age);
  st.mn.v = yrs > 0 ? 25 + L.int(0, 20) : 25; st.mn.trait = L.pick(['kind', 'bookish', 'witty']);
  // (Past ninety, the one who taught you has died, and the story knows it: see k.M.dead.)
  if (age >= 90) st.mn.dead = s.t;
  st.rv = person(L, L.chance(0.5) ? 'm' : 'f', clampN(s.age + L.int(-3, 3), 18, 70));
  st.rv.v = yrs > 0 ? L.int(-10, 10) : 0;
}

// ---- install ------------------------------------------------------------------------------

export function install({ A, Life, hooks, addEvents }) {
  Object.assign(Life.prototype, {
    // A career's story so far (the screen shows it).
    careerStory(c) { return this.s.careers.st[c] || null; },
    careerChapters(c) { return STORIES[c] ? STORIES[c].ch.length : 0; },
    careerView(c, who) { const st = this.s.careers.st[c]; return st ? view(this, who === 'm' ? st.mn : st.rv) : null; },
    // Why a career will not take you back just now, if it will not.
    careerBarred(c) {
      const b = this.s.careers.bar[c];
      if (!b || this.s.t >= b.until) return null;
      const yrs = Math.ceil((b.until - this.s.t) / 4);
      return b.until - this.s.t >= EVER / 2 ? `${b.why}, for good.` : `${b.why}: not for another ${yrs === 1 ? 'year' : `${yrs} years`}.`;
    },
    // A career taken up partway, at rung r with yrs years already behind you (an heir, or one let in high by a
    // qualification): its story starts at the chapters that fit, with a mentor who taught you long ago.
    careerJoin(c, r, yrs = 0) { join(this, c, r, yrs); },
  });

  // (A career that struck you off, or sacked you in disgrace, will not take you back for a
  // while; and one you have retired from, with a clock and a cake, will not take you back at all.)
  const applyWhy = A.apply.why;
  A.apply.why = (L, c, y) => (L.s.careers && (L.careerBarred(c) || (L.s.careers.st[c] && L.s.careers.st[c].retired != null && 'You have retired from this, and they gave you the clock.'))) || applyWhy(L, c, y);
  // (Sal's crew is joined in his back room, not at the job board: the same goes there.)
  if (A.joinCrew) { const joinWhy = A.joinCrew.why; A.joinCrew.why = (L, ...a) => (L.s.careers && L.careerBarred('crew')) || joinWhy(L, ...a); }

  hooks.load.push((L) => {
    const s = L.s;
    if (!s.careers) s.careers = blank();
    const b = blank();
    for (const k of Object.keys(b)) if (s.careers[k] == null) s.careers[k] = b[k];
    for (const k of Object.keys(b.n)) if (s.careers.n[k] == null) s.careers.n[k] = 0;
    if (s.job && !s.careers.job) s.careers.job = { c: s.job.c, r: s.job.r };
  });

  // Every season in the job counts towards its story; and the people in it are as they are.
  hooks.season.push((L, lines, jailed) => {
    const s = L.s, j = s.job;
    if (!j || jailed || !STORIES[j.c]) return;
    const st = stOf(L, j.c);
    st.q++;
    for (const rec of [st.mn, st.rv]) if (rec && present(L, rec)) rec.v = stance(L, rec);
    s.careers.job = { c: j.c, r: j.r };
  });

  // The next chapter, if it is due: the right rung, long enough in the job, not
  // too soon after the last, and then a matter of chance. (now: only the rung
  // counts, for the tests.) Returns whether a chapter was sent for.
  Life.prototype.careerNext = function (now = false) {
    const L = this, s = L.s, j = s.job;
    if (s.gaol || s.dead || !j || s.pend.length || !STORIES[j.c]) return false;
    const st = stOf(L, j.c), tale = STORIES[j.c];
    // (A chapter that can no longer happen, as things have turned out, is passed over: Sal's
    // crew without Sal, once he has gone to Spain.)
    while (tale.ch[st.n] && tale.ch[st.n].skip && tale.ch[st.n].skip(L)) st.n++;
    const ch = tale.ch[st.n];
    if (!ch || j.r < (ch.r || 0)) return false;
    if (!now && (st.q < (ch.y ?? Y[st.n]) || s.t - st.at < (ch.gap ?? GAP))) return false;
    if (ch.when && !ch.when(L, ctx(L, { c: j.c, n: st.n }))) return false;
    // (A chapter tied to the calendar, like an election, comes as soon as its moment does.)
    if (!now && !L.chance(ch.pace ?? PACE)) return false;
    // The people in it, the first time.
    if (!st.mn) {
      const sex = L.chance(0.5) ? 'm' : 'f';
      st.mn = person(L, sex, clampN(s.age + L.int(26, 32), 45, 62));
      st.mn.v = 25; st.mn.trait = L.pick(['kind', 'bookish', 'witty']);
    }
    // (A rival who has died is soon replaced: there is always somebody who wants your job.)
    if (!st.rv || st.rv.dead != null) st.rv = person(L, L.chance(0.5) ? 'm' : 'f', clampN(s.age + L.int(-3, 3), 18, 70));
    if (tale.prep) tale.prep(L, st);
    st.at = s.t;
    L.queue(cardId(j.c, st.n), { c: j.c, n: st.n });
    return true;
  };
  hooks.late.push((L, jailed) => { if (!jailed) L.careerNext(); });

  // A retirement: the send-off, the first time, from a career you rose in.
  function retired(L, was) {
    const s = L.s, st = stOf(L, was.c);
    st.retired = s.t;
    if (!st.sent && (s.worked[was.c] || 0) >= 2) { st.sent = 1; L.queue('careerSendoff', { c: was.c, title: CAREERS[was.c].rungs[was.r].title }); }
  }
  hooks.acted.push((L, id) => {
    const s = L.s, was = s.careers.job;
    if (id === 'retire' && was && !s.job && STORIES[was.c]) retired(L, was);
    // (Let in above the bottom rung, by a qualification: the story starts where you do.)
    if ((id === 'apply' || id === 'joinCrew') && s.job && s.job.r > 0 && (!was || was.c !== s.job.c)) join(L, s.job.c, s.job.r, 0);
    s.careers.job = s.job ? { c: s.job.c, r: s.job.r } : null;
  });
  hooks.chose.push((L, id, x) => {
    const s = L.s;
    // (An old friend's funeral: somebody from a story is gone for good.)
    if (id === 'soulFriendGone' && typeof x === 'number') {
      for (const st of Object.values(s.careers.st)) for (const rec of [st.mn, st.rv]) if (rec && rec.id === x) rec.dead = s.t;
    }
    // (Sport retires you itself, at 38, by the town's card: the send-off is for that, as for any other.)
    const was = s.careers.job;
    if (id === 'sportsRetire' && was && was.c === 'sports' && !s.job && STORIES.sports) retired(L, was);
    s.careers.job = s.job ? { c: s.job.c, r: s.job.r } : null;
  });

  // The Gazette remembers the story of the career you went furthest in.
  hooks.epitaph.push((L, out) => {
    const s = L.s, m = s.sex !== 'f';
    const best = Object.keys(s.careers.st).filter((c) => s.careers.st[c].gaz).sort((a, b) => (s.worked[b] || 0) - (s.worked[a] || 0))[0];
    if (!best) return;
    const fill = { He: m ? 'He' : 'She', he: m ? 'he' : 'she', his: m ? 'his' : 'her', him: m ? 'him' : 'her' };
    // (A line kept by a save from before: legacy.js says "served as mayor" itself.)
    // (And the wing turned down, in a life that went on to give St Wren's a wing of its own, is said so, not left to argue with legacy.js.)
    let line = s.careers.st[best].gaz.replace(/^\{He\} served as mayor, and mended/, '{He} mended');
    if (s.gave && s.gave.wing) line = line.replace(/ turned down a whole new wing for St Wren’s rather than let a rich man jump the queue\./, ' turned down a rich man’s new wing for St Wren’s rather than let him jump the queue, and later paid for one {him}self.');
    out.push(line.replace(/\{(He|he|his|him)\}/g, (_, w) => fill[w]));
  });

  addEvents([...Object.entries(STORIES).flatMap(([c, tale]) => tale.ch.map((ch, i) => chapterCard(c, i, ch))), sendOffCard()]);

  Object.assign(TROPHIES, {
    careerArc: { name: 'The whole story', icon: '📖', desc: 'See a career’s story through to its last chapter.', test: (L) => !!L.s.careers && L.s.careers.n.arcs >= 1 },
    careerSendoff: { name: 'A proper send-off', icon: '🎉', desc: 'Retire from a career you rose in, with a party and a speech.', test: (L) => !!L.s.careers && L.s.careers.n.sendoffs >= 1 },
    careerPeace: { name: 'Old rivals', icon: '🤝', desc: 'Make it up with the rival who wanted your job.', test: (L) => !!L.s.careers && L.s.careers.n.peace >= 1 },
    careerFast: { name: 'Over their heads', icon: '🚀', desc: 'Be handed a promotion years early, because of something you did.', test: (L) => !!L.s.careers && L.s.careers.n.fast >= 1 },
  });
}
