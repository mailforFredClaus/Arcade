// New in Town: the people of the town. A dozen of Starling Bay’s regulars,
// each to be found at a place of their own: the vicar, the librarian, the
// farmer, the woman at the garage, the harbourmaster, old Marlow, Betty,
// Mr Pym, Mrs Pargeter, the football manager, the theatre man, the cheese
// woman and the mayor. Who they are is in folk-cast.js; their stories and
// the favours they ask are in folk-tales.js. This is how it all works.
//
// Friendship (0 to 100, shown as five hearts) grows a little each time you
// call (a chat, once a season) and with a present they like (once a season;
// you learn what they think of a thing by giving it). It fades slowly if you
// stay away. As it grows, each tells you their story, a chapter at a time,
// on cards; many chapters ask a favour of you, done elsewhere in town, and
// some have to be done in time. What they give back lasts: a boon (a
// discount, a perk, a place to fish), a keepsake, an introduction.
//
// Everything is kept in s.folk:
//   p[id]: { f: friendship, met: the season you met, seen: the season you last
//            called, stage: chapters done, at: when the last one was, off: no
//            asking again until then, known: { gift: what they thought }, last:
//            the last thing given, said: the start of the last thing they said;
//            Mrs Pargeter’s pid: her id among your friends, once she is one }
//   fav: favours on the go: { id, n: the chapter it closes, at, due, base }
//   done, failed: favours done and let slip
//   bag: what you have to give: fish (caught in season fishT), veg { c, n, t },
//        honey (jars)
//   nfish, grown: what had been caught and grown when last looked, to see what is new
//   read: visits to the reading room. keep: keepsakes. book: seasons left with the pilot.

import { TROPHIES, PLACES, CROPS, CURIOS, CURIO_SET_SAID, SEASONS, money } from './data.js';
import { FOLK, GOODS, CORNERS } from './folk-cast.js';
import { STORIES, FAVOURS, KEEPSAKES, BOONS, PARG_AGAIN, CHANCES } from './folk-tales.js';

export { FOLK, GOODS, CORNERS, STORIES, FAVOURS, KEEPSAKES, BOONS, CHANCES };

export const FOLK_IDS = Object.keys(FOLK);
const KEEP_IN_TOUCH = 30;
// A friendship grows quickly at first and slowly once it is deep.
const scale = (f) => Math.max(0.35, Math.min(1.05, 1.15 - f / 100));
const WORDS = [[85, 'Like family'], [65, 'A good friend'], [45, 'A friend'], [25, 'Friendly'], [10, 'A nodding acquaintance'], [0, 'A stranger']];
const round10 = (n) => Math.round(n / 10) * 10;
// "on the High Street", "at the Station", "in Market Square", "at Windle Farm".
const AT = { highstreet: 'on the High Street', townhall: 'at the Town Hall', market: 'in Market Square', park: 'in Pebble Park', headland: 'on Gorse Head' };
export const folkAt = (place) => { const n = PLACES[place].name; return AT[place] || (n.startsWith('The ') ? `at the ${n.slice(4)}` : `at ${n}`); };
const giftKey = (g) => (g.startsWith('c:') ? `cur:${CURIOS[g.slice(2)].set}` : g);
const UP_OUT = ['Writing his memoirs, which are mostly about other people.', 'Opening his own garden fête, uninvited.', 'Writing letters to the Gazette about the council.', 'Watching the Christmas lights go on from the back of the crowd.'];

export function install({ def, Life, clamp, val, hooks, addEvents }) {
  Object.assign(Life.prototype, {
    // ---- who they are to you ----
    folk(id) { return this.s.folk.p[id]; },
    // The mayor stops being mayor, if he resigned over the drains, or you took the chain yourself.
    folkPennOut() { const s = this.s; return (s.f.drains || 0) >= 2 || !!s.f.wasMayor || (!!s.job && s.job.c === 'politics' && s.job.r >= 4); },
    folkName(id) { return id === 'penn' && this.folkPennOut() ? 'Mr Pennington' : FOLK[id].name; },
    folkCall(id, cap = false) { return id === 'penn' && this.folkPennOut() ? 'Mr Pennington' : cap ? FOLK[id].Call : FOLK[id].call; },
    folkBlurb(id) { return id === 'penn' && this.folkPennOut() ? 'Mayor of Starling Bay until lately, like his father and his grandfather before him.' : FOLK[id].blurb; },
    // Betty does the teas in the church hall if her café closed.
    folkPlace(id) { return id === 'betty' && this.folk('betty').shut ? 'church' : FOLK[id].place; },
    // Why somebody will not talk to you just now.
    folkShut(id) {
      if (id === 'pym' && this.pymShut()) return 'Mr Pym turns the sign to CLOSED when he sees you coming.';
      const foe = (name) => this.s.people.some((p) => p.kind === 'enemy' && p.name === name);
      if (id === 'penn' && foe('Mayor Pennington')) return 'He crosses the road when he sees you coming. He has not forgotten the drains.';
      if (id === 'parg' && foe('Edna Pargeter')) return 'Mrs Pargeter looks straight through you. She has not forgotten her seeds.';
      return null;
    },
    folkWord(f) { return WORDS.find(([n]) => f >= n)[1]; },
    folkHearts(id) { const n = Math.round(this.folk(id).f / 20); return '♥'.repeat(n) + '♡'.repeat(5 - n); },
    folkUp(id) {
      const s = this.s, fav = this.folkFav(id);
      if (fav) return `Waiting on you: ${val(FAVOURS[fav.id].title, this).replace(/^./, (c) => c.toLowerCase())}.`;
      if (this.folkNext(id)) return `${FOLK[id].sex === 'm' ? 'He' : 'She'} has something to ask you.`;
      if (id === 'betty' && this.folk('betty').shut) return 'Doing the teas in the church hall, since the café went.';
      return (id === 'penn' && this.folkPennOut() ? UP_OUT : FOLK[id].up)[s.t % 4];
    },
    // Changes a friendship (more slowly the deeper it already is).
    folkWarm(id, d, scaled = true) {
      const s = this.s, p = this.folk(id);
      if (p.met == null && d > 0) { p.met = s.t; p.at = s.t; p.seen = s.t; }
      p.f = clamp(p.f + (d > 0 && scaled ? d * scale(p.f) : d), 0, 100);
      if (id === 'parg') this.folkEdna(true);
    },
    // Mrs Pargeter, among your friends as Edna: her bond there and her friendship
    // here are kept as one (an outing with her counts; her drifting off does not).
    folkEdna(mine = false) {
      const g = this.folk('parg'), e = g.pid && this.s.people.find((p) => p.id === g.pid && p.kind === 'friend');
      if (!e) return null;
      if (!mine && e.bond > g.f) g.f = e.bond;
      e.bond = g.f;
      return e;
    },
    // Somebody introduces you to somebody else.
    folkIntro(id) {
      const s = this.s, p = this.folk(id);
      if (p.met != null) { this.folkWarm(id, 2); return; }
      Object.assign(p, { met: s.t, at: s.t, seen: s.t, f: Math.max(p.f, 8) });
      this.say(FOLK[id].icon, `You have met ${this.folkName(id)}`, 'good');
    },
    // What they say when you call.
    folkLine(id) {
      const k = FOLK[id], p = this.folk(id), tier = p.f >= 65 ? 2 : p.f >= 25 ? 1 : 0;
      const life = k.life.map((f) => f(this)).filter(Boolean), r = this.rnd();
      const pool = life.length && r < 0.4 ? life : r < 0.62 ? [k.seasons[this.season], ...k.lines[tier].slice(0, 1)] : k.lines[tier];
      let line = this.pick(pool);
      if (line.slice(0, 30) === p.said && pool.length > 1) line = this.pick(pool.filter((t) => t !== line));
      p.said = line.slice(0, 30);
      return line;
    },
    folkChat(id) {
      const s = this.s, k = FOLK[id], p = this.folk(id);
      let text;
      if (p.met == null) {
        Object.assign(p, { met: s.t, at: s.t });
        this.folkWarm(id, 6, false);
        text = id === 'penn' && this.folkPennOut() ? '"Pennington," he says. "I used to be mayor." He says it the way other people say they used to smoke.' : k.meet;
        this.note(`Met ${this.folkName(id)}.`);
      } else {
        this.folkWarm(id, 2.5 + s.st.charm / 60);
        text = this.folkLine(id);
      }
      p.seen = s.t;
      this.joy(2); this.gain('charm', 0.6);
      return text + this.folkDeal(id);
    },
    // If they have the next chapter of their story ready, it is told.
    folkDeal(id) {
      const card = this.folkNext(id);
      if (!card || this.s.pend.some((e) => e.id === card)) return '';
      this.queue(card);
      return ` ${FOLK[id].ask || ''}`.trimEnd();
    },
    // The card for the next chapter, if it is ready to be told.
    folkNext(id) {
      const s = this.s, p = this.folk(id);
      if (p.met == null || p.stage >= 5 || this.folkFav(id) || s.t < p.off || this.folkShut(id)) return null;
      if (s.t - p.at < (p.stage ? 3 : 1)) return null;
      if (id === 'parg' && p.stage < 3) return (s.f.parg === -1 || s.f.parg === 0) && s.plot && !p.again && p.f >= PARG_AGAIN.need ? 'fk_parg0' : null;
      const st = STORIES[id][p.stage];
      if (!st || st.flag || p.f < st.need || (st.when && !st.when(this))) return null;
      return `fk_${id}${p.stage + 1}`;
    },
    // A chapter is done.
    folkStep(id, n, gain) {
      const s = this.s, p = this.folk(id);
      if (n <= p.stage) return;
      p.stage = n; p.at = s.t; p.seen = s.t;
      this.folkWarm(id, gain);
      if (n === 5) {
        this.note(`Heard the whole of ${this.folkName(id)}’s story: ${STORIES[id][4].title.toLowerCase()}.`, 'big');
        this.say(FOLK[id].icon, `${this.folkName(id)}: the whole story`, 'dream');
      }
    },
    // A favour taken on, or not.
    folkAsk(id, n, fid) {
      const s = this.s, F = FAVOURS[fid], f = { id: fid, n, at: s.t, due: F.by ? s.t + F.by : null, base: F.base ? F.base(this) : null };
      s.folk.fav.push(f);
      this.folk(id).seen = s.t;
      this.folkWarm(id, 1);
      return `${F.set} It goes on your list of favours${f.due != null ? `, to be done ${this.folkDue(f)}` : ''}.`;
    },
    folkNo(id, said) {
      const s = this.s, p = this.folk(id);
      p.off = s.t + 4;
      this.folkWarm(id, -1);
      return said;
    },
    folkFav(id) { return this.s.folk.fav.find((f) => FAVOURS[f.id].who === id) || null; },
    folkFavOf(fid) { return this.s.folk.fav.find((f) => f.id === fid) || null; },
    folkDue(f) {
      if (f.due == null) return '';
      const last = f.due - 1, s = this.s;
      return last <= s.t ? 'by the end of this season' : last === s.t + 1 ? 'by the end of next season' : `by the end of ${SEASONS[last % 4].toLowerCase()}`;
    },
    // How far along a favour is: { text, ready, have, want }.
    folkProg(f) {
      const F = FAVOURS[f.id];
      if (!F.goal) return { text: `Done ${folkAt(F.at)}`, ready: true, have: 0, want: 1 };
      const g = F.goal(this, f);
      return { ...g, ready: g.have >= g.want };
    },
    // Every favour on the go, as the screen wants it.
    folkFavours() {
      return this.s.folk.fav.map((f) => {
        const F = FAVOURS[f.id];
        return { id: f.id, who: F.who, icon: F.icon, title: val(F.title, this), due: this.folkDue(f), prog: this.folkProg(f), where: folkAt(F.goal ? this.folkPlace(F.who) : F.at) };
      });
    },
    folkFavDone(fid, win) {
      const s = this.s, F = FAVOURS[fid], i = s.folk.fav.findIndex((f) => f.id === fid), f = s.folk.fav[i];
      s.folk.fav.splice(i, 1);
      if (F.take) F.take(this);
      s.folk.done++;
      const said = F.done(this, win);
      this.folkStep(F.who, f.n, F.gain);
      this.note(`Did a favour for ${this.folkName(F.who)}: ${val(F.title, this).replace(/^./, (c) => c.toLowerCase())}.`);
      return said;
    },
    // ---- what friendship is good for ----
    folkHas(b) {
      const B = BOONS[b], p = this.folk(B.who);
      if (p.stage < B.at || (B.keep && p.f < KEEP_IN_TOUCH) || (B.on && !B.on(this))) return false;
      return !(B.who === 'pym' && this.pymShut());
    },
    folkKeep(k) { if (this.s.folk.keep[k] == null) this.s.folk.keep[k] = this.s.t; },
    // Jess (or Len) sees you right for a car, if you have none. Returns whether they did.
    // Whether you have a car at all, even one that will not go just now (see motor.js).
    folkHasCar() { const s = this.s; return !!(s.items.car || s.items.sportscar || (s.motor && s.motor.car)); },
    // (What to add when a car is handed over to somebody who cannot yet drive it.)
    folkCarWait() { return this.motorLicensed && !this.motorLicensed() ? ' It will wait on the forecourt until you have passed your test.' : ''; },
    folkCar(old = false) {
      const s = this.s;
      if (this.folkHasCar()) return false;
      // (Through the garage's own books, so that it is a real car with a condition and an MOT:
      // see motor.js. Without a licence it waits for you on the forecourt.)
      if (this.motorTake) {
        this.motorTake(old ? { m: 'seabird', age: 26, cond: 82, col: 'bottle-green' } : { m: 'pip', age: 6, cond: 88, col: 'sky-blue' });
        this.motorSync(true);
        return true;
      }
      const was = this.timeMaxWithout('car');
      s.items.car = 1;
      s.time += this.timeMax() - was;
      return true;
    },
    // The strip of plot 9: a fourth bed on your allotment.
    folkPlotBed() { const p = this.s.plot; if (p && p.beds.length < 4) p.beds.push(null); },
    // ---- presents ----
    // What you have to give, put straight (fish keep a season, vegetables two).
    folkBag() {
      const s = this.s, b = s.folk.bag;
      if (b.fishT !== s.t) { b.fish = 0; b.fishT = s.t; }
      if (b.veg && s.t - b.veg.t > 1) b.veg = null;
      return b;
    },
    folkFish() { const b = this.s.folk.bag; return b.fishT === this.s.t ? b.fish : 0; },
    folkVeg() { const b = this.s.folk.bag; return b.veg && this.s.t - b.veg.t <= 1 ? b.veg : null; },
    // What they think of a thing: love, like, meh or hate.
    folkReact(id, g) {
      const key = giftKey(g), G = FOLK[id].gifts;
      for (const r of ['love', 'like', 'hate']) if (G[r].includes(key)) return r;
      if (key.startsWith('cur:')) for (const r of ['love', 'like', 'hate']) if (G[r].includes('cur')) return r;
      return 'meh';
    },
    folkGiftWhy(id, g) {
      const s = this.s, p = this.folk(id);
      if (p.met == null) return 'You have not met yet.';
      if (s.use[`fkGift_${id}`]) return 'One present a season is plenty.';
      if (g.startsWith('c:')) return CURIOS[g.slice(2)] ? (s.curios[g.slice(2)] > 0 ? null : 'You have not got one.') : 'Give what?';
      if (!GOODS[g]) return 'Give what?';
      if (GOODS[g].own && !this.folkHave(g)) return { fish: 'No fish from this season’s catch.', veg: 'Nothing fresh from your allotment.', honey: 'No honey in the cupboard.', painting: 'No paintings to hand.', marrow: 'No marrow in the shed.' }[g];
      return null;
    },
    // Whether you have one of your own things to give.
    folkHave(g) {
      const s = this.s;
      return { fish: () => this.folkFish() > 0, veg: () => !!this.folkVeg(), honey: () => s.folk.bag.honey > 0, painting: () => s.paintings > 0, marrow: () => s.marrow > 0 }[g]();
    },
    // The presents you could give somebody: [{ g, name, icon, cost, why, known }].
    folkGifts(id) {
      const s = this.s, p = this.folk(id), out = [];
      for (const [g, k] of Object.entries(GOODS)) {
        if (k.own && !this.folkHave(g) && !p.known[g]) continue;
        out.push({ g, name: k.name, icon: k.icon, cost: k.cost || 0, why: this.folkGiftWhy(id, g), known: p.known[g] || null });
      }
      for (const c of Object.keys(s.curios)) if (s.curios[c] > 0) out.push({ g: `c:${c}`, name: CURIOS[c].name, icon: CURIOS[c].icon, cost: 0, why: this.folkGiftWhy(id, `c:${c}`), known: p.known[giftKey(`c:${c}`)] || null });
      return out;
    },
    // What you have learnt of their tastes: { love: [...], like, meh, hate } of things said plainly.
    folkTastes(id) {
      const out = { love: [], like: [], meh: [], hate: [] };
      for (const [key, r] of Object.entries(this.folk(id).known)) out[r].push(key.startsWith('cur:') ? { icon: '🏺', said: CURIO_SET_SAID[key.slice(4)] } : { icon: GOODS[key].icon, said: GOODS[key].said });
      return out;
    },
    // Their story, as far as it has gone: [{ n, title, said, done }].
    folkStory(id) {
      const p = this.folk(id);
      return STORIES[id].map((st, i) => ({ n: i + 1, title: st.title, said: st.said, done: p.stage > i, need: st.need || 0 }));
    },
    // What they have given you that lasts.
    folkBoons(id) { return Object.entries(BOONS).filter(([, B]) => B.who === id && this.folk(id).stage >= B.at).map(([b, B]) => ({ id: b, ...B, on: this.folkHas(b) })); },
    folkKeeps(id) { return Object.entries(KEEPSAKES).filter(([k, K]) => (!id || K.from === id) && this.s.folk.keep[k] != null).map(([k, K]) => ({ id: k, ...K })); },
    // Keeps the old stories (Marlow’s, Mrs Pargeter’s, Betty’s café) in step with this one.
    folkSync() {
      const s = this.s, f = s.f, m = this.folk('marlow'), g = this.folk('parg'), b = this.folk('betty');
      if ((f.marlow || 0) >= 1) {
        if (m.met == null) Object.assign(m, { met: s.t, at: s.t, seen: s.t });
        if (m.stage < f.marlow) Object.assign(m, { stage: f.marlow, at: s.t, f: Math.max(m.f, 8 + 12 * f.marlow) });
      }
      if (f.parg != null && g.met == null) Object.assign(g, { met: s.t, at: s.t, seen: s.t });
      if (f.parg >= 1 && g.stage < f.parg) Object.assign(g, { stage: f.parg, at: s.t, f: Math.max(g.f, 10 * f.parg + 5) });
      // (Once she has given you the seed tin she is a friend as well: one person, one friendship.)
      if (!g.pid) { const edna = s.people.find((p) => p.kind === 'friend' && p.name === 'Edna Pargeter'); if (edna) { g.pid = edna.id; g.seen = s.t; } }
      this.folkEdna();
      if (f.cafe && !b.saved) {
        b.saved = 1;
        if (b.met == null) Object.assign(b, { met: s.t, at: s.t, seen: s.t });
        b.f = Math.max(b.f, 30);
        if (b.stage < 1) b.stage = 1;
      }
    },
  });

  // ---- at their places ----
  for (const id of FOLK_IDS) {
    const k = FOLK[id], place = (L) => L.folkPlace(id), sec = k.sec || ((L) => L.folkName(id));
    def(`fkSee_${id}`, {
      place, sec, icon: k.icon, time: 0, open: `folk_${id}`,
      title: (L) => L.folkName(id), desc: (L) => `${L.folkHearts(id)} ${L.folkUp(id)}`,
      show: (L) => L.folk(id).met != null,
    });
    if (id === 'marlow') continue; // (he has a chat of his own already, on the quay)
    def(`fkChat_${id}`, {
      place, sec, icon: '💬', time: 1, per: 1,
      title: (L) => (L.folk(id).met == null ? `Introduce yourself to ${L.folkCall(id)}` : `Chat with ${L.folkCall(id)}`),
      desc: (L) => (L.folk(id).met == null ? L.folkBlurb(id) : L.folkNext(id) ? `${k.sex === 'm' ? 'He' : 'She'} has something to ask you.` : 'Pass the time of day. A little closer, every season you call.'),
      show: (L) => id !== 'parg' || L.folk(id).met != null,
      why: (L) => L.folkShut(id),
      run: (L) => L.folkChat(id),
    });
  }

  // A present. x: { w: who, g: what (a GOODS id, or c:<curio>) }.
  def('folkGive', {
    time: 0, cost: (L, x) => (x && GOODS[x.g] ? GOODS[x.g].cost || 0 : 0),
    why: (L, x) => (!x || !FOLK[x.w] || typeof x.g !== 'string' ? 'Give what, to whom?' : L.folkShut(x.w) || L.folkGiftWhy(x.w, x.g)),
    run(L, x) {
      const s = L.s, { w, g } = x, k = FOLK[w], p = L.folk(w), key = giftKey(g), r = L.folkReact(w, g), again = p.last === key, first = !p.known[key];
      s.use[`fkGift_${w}`] = 1;
      const b = L.folkBag();
      if (g === 'fish') b.fish--;
      else if (g === 'veg') b.veg = null;
      else if (g === 'honey') b.honey--;
      else if (g === 'painting') s.paintings--;
      else if (g === 'marrow') s.marrow = 0;
      else if (g.startsWith('c:') && --s.curios[g.slice(2)] <= 0) delete s.curios[g.slice(2)];
      // (Something precious counts for more; the same thing twice running, for less.)
      const big = g.startsWith('c:') || g === 'painting';
      const d = { love: 7, like: 3.5, meh: 1, hate: -5 }[r] * (big && r !== 'hate' ? 1.5 : 1) * (again && r !== 'hate' ? 0.5 : 1);
      L.folkWarm(w, d);
      p.known[key] = r; p.last = key; p.seen = s.t;
      L.joy(r === 'love' ? 3 : r === 'hate' ? -1 : 1);
      const Call = L.folkCall(w, true), call = L.folkCall(w);
      const said = r === 'love' ? (k.loved[key] || k.loved[key.startsWith('cur:') ? 'cur' : ''] || `${Call} ${L.pick(['lights up', 'is delighted, and does not try to hide it', 'is touched, and says so'])}.`)
        : r === 'hate' ? (k.hated[key] || `${Call} looks at it, then at you, and says thank you in a voice like a closing door.`)
        : r === 'like' ? L.pick([`"How kind," says ${call}, and means it.`, `${Call} is pleased, and says so.`]) : L.pick([`${Call} says thank you, and puts it somewhere.`, `${Call} says it is very kind, in the voice people keep for socks.`]);
      const thing = key.startsWith('cur:') ? CURIO_SET_SAID[key.slice(4)] : GOODS[key].said;
      const learnt = first ? ` (Now you know: ${call} ${{ love: 'loves', like: 'likes', meh: 'does not much mind', hate: 'cannot abide' }[r]} ${thing}.)` : again && r !== 'hate' ? ' Mind you, it is what you gave last time.' : '';
      return said + learnt + L.folkDeal(w);
    },
  });

  // ---- the favours: each a row at the place where it is done ----
  for (const [fid, F] of Object.entries(FAVOURS)) {
    const goal = !!F.goal;
    def(`fv_${fid}`, {
      place: goal ? (L) => L.folkPlace(F.who) : F.at, sec: 'Favours', icon: F.icon, title: (L) => val(F.title, L),
      time: F.time || 0, cost: F.cost || 0,
      desc: (L) => { const f = L.folkFavOf(fid); return f ? `For ${L.folkName(F.who)}${f.due != null ? `, ${L.folkDue(f)}` : ''}.${F.check ? ' How well it goes is down to you.' : ''}` : ''; },
      show: (L) => !!L.folkFavOf(fid),
      why(L) {
        const f = L.folkFavOf(fid);
        if (!f) return 'Nobody has asked you.';
        const pr = L.folkProg(f);
        if (!pr.ready) return `${pr.text}.`;
        return (F.why && F.why(L)) || L.folkShut(F.who);
      },
      run(L) { return L.folkFavDone(fid, F.check ? L.chance(L.checkOdds(F.check[0], F.check[1])) : true); },
    });
  }

  // ---- what friendship brings ----
  def('fkLake', {
    place: 'farm', sec: 'Tom Windle', icon: '🎣', title: 'Fish Windle’s lake', desc: 'Quiet water, fat trout, and nobody else allowed. Once a season.', per: 1,
    show: (L) => L.folkHas('lake') && !!L.s.items.rod,
    run(L) {
      const s = L.s;
      L.joy(4); L.hp(1);
      if (L.chance(0.25)) return L.pick(['Nothing bites, and you do not mind at all. A heron fishes the far bank and does no better.', 'Margaret the cow comes down to the water to watch, and the trout go and hide.']);
      const pay = L.int(6, 16) * 10;
      s.n.fish++; L.cash(pay); s.n.earned += pay;
      return `${L.pick(['A brown trout, fat and speckled, off the willow bank.', 'Two hours of nothing, then a carp the size of a loaf.', 'A rainbow trout on the first cast. Tom, watching from the gate, says nothing, which is praise.'])} The hotel buys it for ${money(pay)}.`;
    },
  });
  def('fkDrill', {
    place: 'cove', sec: 'Captain Quinn', icon: '🛟', title: 'Go out on lifeboat exercise', desc: 'With the crew, in all weathers. Good for Fitness, and for the town. Once a season.', per: 1,
    // (Crew on the lifeboat's books train with coast.js's station instead.)
    show: (L) => L.folkHas('drill') && !(L.coastOnBooks && L.coastOnBooks()),
    run(L) {
      L.gain('fitness', 2.8); L.karma(0.5); L.joy(2); L.hp(1);
      return L.s.wx === 'storm' ? 'Exercise in a real gale. You come back soaked to the bone and lit up like a lamp.' : L.pick(['Launch, man overboard drill, recover, again. Quinn times you on a stopwatch and says nothing, which is good.', 'Rowing the inshore boat round the point and back. Your arms are no longer your own.', 'You practise with the line-throwing gun and hit a buoy, a gull, and, on the third try, the target.']);
    },
  });
  def('fkRehearse', {
    place: 'theatre', sec: 'Desmond Achebe', icon: '🎭', title: 'Rehearse with the Players', desc: 'Tuesdays at the Pavilion. Good for Charm. Once a season.', per: 1,
    show: (L) => L.folkHas('players'),
    run(L) {
      L.gain('charm', 2.4); L.joy(3); L.fame(0.1);
      return L.pick(['Voice exercises with Desmond: you say "red lorry, yellow lorry" until the words lose all meaning.', 'You play a butler, a fishwife and a tree, all in one evening.', 'Desmond stops the rehearsal to tell you that you have "found something". Neither of you knows what.']);
    },
  });

  // ---- the cards ----
  const cards = [];
  for (const [id, list] of Object.entries(STORIES)) {
    list.forEach((st, i) => {
      if (st.flag) return;
      const n = i + 1;
      cards.push({ id: `fk_${id}${n}`, w: 0, icon: st.card.icon, title: st.title, text: st.card.text, opts: st.card.opts, ok: (L) => !L.s.gaol && L.folk(id).stage === n - 1 && !L.folkFav(id) });
    });
  }
  cards.push({
    id: 'fk_parg0', w: 0, icon: PARG_AGAIN.icon, title: PARG_AGAIN.title, text: PARG_AGAIN.text,
    ok: (L) => !L.s.gaol && (L.s.f.parg === -1 || L.s.f.parg === 0) && !L.folk('parg').again,
    opts: [
      { t: 'Help her put it back up', run(L) { const s = L.s; s.time = Math.max(0, s.time - 1); s.f.parg = s.f.parg === -1 ? 1 : 2; L.folk('parg').again = 1; L.folkSync(); L.folkWarm('parg', 6); L.gain('fitness', 0.6); return 'A morning with a hammer, a spirit level and Mrs Pargeter telling you where the hammer goes. At the end she looks at the shed, and then at you, and says "Hm." The onion man, passing, says that is a great deal from her.'; } },
      { t: 'Leave her to it', run: (L) => L.folkNo('parg', 'She has it back up by teatime, alone, and does not look your way.') },
    ],
  });
  addEvents([...cards, ...CHANCES]);

  // ---- trophies ----
  const corners = (L) => new Set(FOLK_IDS.filter((id) => L.s.folk.p[id].f >= 60).map((id) => FOLK[id].corner));
  Object.assign(TROPHIES, {
    folkStory: { name: 'The whole story', icon: '📖', desc: 'Hear one of the townsfolk’s stories to the end.', test: (L) => !!L.s.folk && FOLK_IDS.some((id) => L.s.folk.p[id].stage >= 5) },
    folkFavours: { name: 'Good neighbour', icon: '🤝', desc: 'Do ten favours for the townsfolk.', test: (L) => !!L.s.folk && L.s.folk.done >= 10 },
    folkCorners: { name: 'A friend in every corner', icon: '🗺️', desc: 'Have a good friend (three hearts) down by the water, in the Bay, in the old town and out on its edge.', test: (L) => !!L.s.folk && corners(L).size >= Object.keys(CORNERS).length },
    folkLoves: { name: 'Just what I wanted', icon: '🎁', desc: 'Find something that each of eight townsfolk loves.', test: (L) => !!L.s.folk && FOLK_IDS.filter((id) => Object.values(L.s.folk.p[id].known).includes('love')).length >= 8 },
  });

  // ---- the rules hung on the rest of the town ----
  hooks.load.push((L) => {
    const s = L.s;
    if (!s.folk) s.folk = { p: {}, fav: [], done: 0, failed: 0, bag: { fish: 0, fishT: -1, veg: null, honey: 0 }, nfish: s.n.fish || 0, grown: { ...s.grown }, read: 0, keep: {}, book: 0 };
    for (const id of FOLK_IDS) if (!s.folk.p[id]) s.folk.p[id] = { f: 0, met: null, seen: null, stage: 0, at: 0, off: 0, known: {}, last: null };
    // (A favour nobody can do any more is let go quietly.)
    s.folk.fav = s.folk.fav.filter((f) => FAVOURS[f.id]);
    L.folkSync();
  });

  hooks.acted.push((L, id) => {
    const s = L.s, fk = s.folk;
    if (fk.p.parg.pid) L.folkEdna();
    // Old Marlow’s chat on the quay counts as a call.
    if (id === 'marlow') {
      const p = L.folk('marlow');
      if (p.met == null) { Object.assign(p, { met: s.t, at: s.t }); L.folkWarm('marlow', 6, false); } else L.folkWarm('marlow', 2.5 + s.st.charm / 60);
      p.seen = s.t;
      L.folkDeal('marlow');
    }
    // Fish landed (anywhere) go in the bag for the season, and Marlow’s marks pay.
    if (s.n.fish > fk.nfish) {
      const n = s.n.fish - fk.nfish, b = L.folkBag();
      b.fish = Math.min(6, b.fish + n);
      if (L.folkHas('marks')) { L.cash(40 * n); s.n.earned += 40 * n; }
    }
    fk.nfish = s.n.fish;
    // A crop brought in fills the basket, and Priya sells the best of it.
    const got = Object.keys(s.grown).filter((c) => (s.grown[c] || 0) > (fk.grown[c] || 0));
    if (got.length) {
      fk.bag.veg = { c: got[0], n: got.length, t: s.t };
      if (L.folkHas('stall')) { const extra = got.reduce((a, c) => a + round10(CROPS[c].pay * 0.25), 0); L.cash(extra); s.n.earned += extra; L.say('🧀', `Priya sold the best of it on her stall: ${money(extra)} more`, 'good'); }
      fk.grown = { ...s.grown };
    }
    if (id === 'readingRoom') fk.read++;
    if (id === 'pew' && L.folkHas('pew')) L.joy(3);
    if (id === 'cook' && L.folkHas('cook')) { L.hp(1); L.joy(2); }
    if (id === 'watchRovers' && L.folkHas('ticket')) L.cash(15);
    if (id === 'browseMarket' && L.folkHas('fountain')) L.joy(2);
    if (id === 'novel' && L.folkHas('pencil') && s.novel.p > 0) s.novel.q += 40;
    if (id === 'plotRent' && L.folkHas('bed')) L.folkPlotBed();
  });

  hooks.chose.push((L, id, x, i, win) => {
    if (/^(marlow|parg)\d$/.test(id) || id === 'cafe') L.folkSync();
    // Betty’s café, if nobody saved it, is gone; she does the teas at the church hall.
    if (id === 'cafe' && (i === 2 || (i === 1 && win === false))) L.folk('betty').shut = 1;
  });

  hooks.season.push((L) => {
    const s = L.s, fk = s.folk;
    if (L.season === 1 && L.folkHas('honey')) { fk.bag.honey = Math.min(6, fk.bag.honey + 2); L.note('Two jars of honey on the step, from the vicar’s bees.'); }
    if (fk.book > 0) { L.gain('smarts', 1.2); if (--fk.book === 0) L.note('Gave the Admiralty pilot of 1820 back to Miss Achterberg, read properly.'); }
    if (L.folkHas('glass') && s.plot) for (const b of s.plot.beds) if (b) b.care++;
    L.folkEdna();
    // Friendship fades if you stay away, but never below what a long story has made of it.
    for (const id of FOLK_IDS) {
      const p = fk.p[id];
      if (p.met == null) continue;
      if (p.seen == null) p.seen = p.met;
      const gap = s.t - p.seen;
      if (gap >= 2) p.f = Math.max(p.f - (gap >= 8 ? 1.5 : 1), Math.min(p.f, p.stage * 6));
    }
    L.folkEdna(true);
    // Favours left too long are let slip.
    for (const f of fk.fav.slice()) {
      if (f.due == null || s.t + 1 < f.due) continue;
      const F = FAVOURS[f.id], p = fk.p[F.who];
      fk.fav.splice(fk.fav.indexOf(f), 1);
      fk.failed++;
      p.off = s.t + 4;
      L.folkWarm(F.who, -8);
      L.note(`Let ${L.folkName(F.who)} down: never got round to it (${val(F.title, L).replace(/^./, (c) => c.toLowerCase())}).`);
      L.say('😞', `You let ${L.folkName(F.who)} down`, 'bad');
    }
  });

  // Mr Pym’s window is new every season: a tenth off it, and a fair price, for a friend.
  hooks.late.push((L) => {
    const cur = L.s.cur;
    if (!cur) return;
    if (L.folkHas('tenth')) for (const c of cur.stock) c.ask = round10(c.ask * 0.9);
    if (L.folkHas('fair')) for (const k of Object.keys(cur.bid)) cur.bid[k] = Math.round((cur.bid[k] + 0.1) * 100) / 100;
  });

  hooks.bills.push((L, out, jailed) => {
    const row = (what) => out.find((r) => r[0] === what);
    if (!jailed && L.folkHas('feed') && row('Food and bills')) row('Food and bills')[1] = Math.max(0, row('Food and bills')[1] - 120);
    if (L.folkHas('rates')) {
      const car = row('Running the car') || row('Running the sports car');
      if (car) car[1] = Math.max(0, car[1] - (car[0] === 'Running the car' ? 120 : 400));
    }
  });
  hooks.income.push((L, out) => { if (L.folkHas('field')) out.push(['Grazing rent from the bottom field', 350]); });
  hooks.worth.push((L) => (L.folkHas('field') ? Math.round(35000 * L.s.idx / 1000) * 1000 : 0));
  hooks.mood.push((L) => Math.min(3, FOLK_IDS.filter((id) => L.s.folk.p[id].f >= 50).length) + (L.folkHas('freedom') ? 1 : 0));
}
