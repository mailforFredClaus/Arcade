// New in Town: being known. Chirper, on your phone: post, gather
// followers, and be paid to hold things up to the camera. And the long
// tail of anything you make: a book or a record that sells goes on paying
// royalties for years, a little less each season.

import { STAT_NAME, money, many } from './data.js';

// The kinds of thing you can post. stat: what makes you good at it;
// lo, hi: how much luck there is in it; viral, flak: the chances it takes
// off, or blows up in your face.
export const CHIRPS = {
  dinner: { name: 'A photo of your dinner', icon: '🍝', stat: 'craft', lo: 0.6, hi: 1.2, viral: 0.02, flak: 0, say: ['Forty people like your shepherd’s pie.', 'The light was good. The lasagne was better.', 'Somebody asks for the recipe. You make one up.'] },
  joke: { name: 'Something funny', icon: '😄', stat: 'charm', lo: 0.4, hi: 1.8, viral: 0.05, flak: 0.02, say: ['A pun about herring. It does numbers.', 'Your impression of the harbourmaster is shared by the harbourmaster.', 'It is funnier than you meant, which you take credit for.'] },
  take: { name: 'A strong opinion', icon: '🔥', stat: 'smarts', lo: 0.3, hi: 2.2, viral: 0.06, flak: 0.07, say: ['You are right about the one-way system, and say so at length.', 'A thread, numbered, on what is wrong with the pier.', 'Strangers argue under it for three days.'] },
  selfie: { name: 'A picture from the gym', icon: '🤳', stat: 'fitness', lo: 0.6, hi: 1.5, viral: 0.03, flak: 0.01, say: ['The mirror is flattering and so are the comments.', 'You pretend not to know the camera is there.', 'Mid-press-up. It took eleven goes.'] },
};
const MAX = 5000000;

export function install({ def, A, Life, clamp }) {
  Object.assign(Life.prototype, {
    followers() { return this.s.chirp ? this.s.chirp.n : 0; },
    // What one post of a kind would usually bring in.
    chirpGain(kind) {
      const s = this.s, k = CHIRPS[kind], st = s.st[k.stat], n = this.followers();
      return (6 + st * 0.7 + s.fame * 4 + n * 0.02 * (0.4 + st / 100)) * (s.heir === 'sensation' ? 1.25 : 1);
    },
    // Adds (or loses) followers, and the fame that comes with a crowd.
    crowd(d) {
      const s = this.s;
      if (!s.chirp) s.chirp = { n: 0, posts: 0, ban: 0 };
      s.chirp.n = Math.round(clamp(s.chirp.n + d, 0, MAX));
      return s.chirp.n;
    },
    sponPay(mult = 1) { return Math.min(50000, Math.round(this.followers() * 0.02 * mult / 10) * 10); },
    royalties() { return Math.floor(this.s.roy.reduce((a, r) => a + r.a, 0)); },
    // Something you made starts to earn.
    earnFrom(what, a) { this.s.roy.push({ t: what, a }); },
    fameSeason() {
      const s = this.s;
      for (const r of s.roy) r.a *= 0.93;
      s.roy = s.roy.filter((r) => r.a >= 20);
      if (s.chirp) {
        if (!s.use.chirp) s.chirp.n = Math.round(s.chirp.n * 0.97);
        if (s.chirp.ban > 0) s.chirp.ban--;
      }
    },
  });

  def('chirpOpen', { place: 'home', sec: 'On your phone', icon: '🐤', title: 'Chirper', desc: (L) => (L.followers() ? `${many(L.followers())} followers.` : 'Everybody is on it. Nobody will say why.'), time: 0, open: 'chirper', show: (L) => !!L.s.items.phone });
  def('chirp', {
    sec: 'Post', title: (L, kind) => CHIRPS[kind].name, icon: (L, kind) => CHIRPS[kind].icon,
    desc: (L, kind) => `Leans on ${STAT_NAME[CHIRPS[kind].stat]}. About ${many(L.chirpGain(kind) * (CHIRPS[kind].lo + CHIRPS[kind].hi) / 2)} new followers${CHIRPS[kind].flak >= 0.05 ? ', unless it goes wrong' : ''}.`,
    why: (L, kind) => (!CHIRPS[kind] ? 'Post what?' : !L.s.items.phone ? 'You need a phone.' : L.s.chirp && L.s.chirp.ban ? 'Your account is suspended this season.' : (L.s.use.chirp || 0) >= 4 ? 'Enough for one season. Put the phone down.' : null),
    run(L, kind) {
      const s = L.s, k = CHIRPS[kind];
      L.crowd(0);
      s.use.chirp = (s.use.chirp || 0) + 1; s.chirp.posts++;
      L.gain(k.stat, 0.4);
      let gain = L.chirpGain(kind) * (k.lo + L.rnd() * (k.hi - k.lo));
      const r = L.rnd();
      if (r < k.flak) {
        const lost = Math.round(s.chirp.n * 0.15);
        L.crowd(-lost); L.joy(-6); L.karma(-1);
        return `It reads very differently to how you meant it. By morning you are the main character on Chirper, and ${lost ? `${lost.toLocaleString('en')} followers have left` : 'not in a good way'}.`;
      }
      const viral = r > 1 - k.viral;
      if (viral) { gain = gain * 8 + 400; s.n.viral = (s.n.viral || 0) + 1; L.joy(6); }
      gain = Math.round(gain);
      const n = L.crowd(gain);
      L.fame(clamp(Math.log10(n + 1) - 2, 0, 4) * (viral ? 1 : 0.25));
      L.joy(0.5);
      return viral ? `It takes off. Your phone gets hot. ${gain.toLocaleString('en')} new followers by the weekend.` : `${L.pick(k.say)} ${gain.toLocaleString('en')} new follower${gain === 1 ? '' : 's'}.`;
    },
  });
  def('chirpTroll', {
    sec: 'Behave badly', title: 'Pick a fight with a stranger', icon: '👹', desc: 'Cruel, cheap, and it works. Chirper may suspend you.',
    why: (L) => A.chirp.why(L, 'joke'),
    run(L) {
      const s = L.s;
      L.crowd(0);
      s.use.chirp = (s.use.chirp || 0) + 1; s.chirp.posts++; s.n.trolls = (s.n.trolls || 0) + 1;
      L.karma(-3); L.joy(2);
      if (L.chance(0.1)) { s.chirp.ban = 2; return 'You go too far, as was always the plan. Chirper suspends your account until the season after next.'; }
      const gain = Math.round(L.chirpGain('joke') * (0.5 + L.rnd() * 1.5));
      L.crowd(gain);
      return `${L.pick(['You find a man who is wrong about gulls and ruin his week.', 'A local councillor blocks you. You frame the screenshot.', 'You reply "ratio" to a lifeboat appeal. It works, which is the worst part.'])} ${gain.toLocaleString('en')} new followers, of a certain kind.`;
    },
  });
  def('chirpSpon', {
    sec: 'Cash in', title: 'Do a sponsored post', icon: '💷', per: 1, time: 0, desc: (L) => (L.followers() >= 5000 ? `About ${money(L.sponPay())}. A few followers roll their eyes and leave.` : 'Companies pay to borrow your crowd.'),
    why: (L) => (L.followers() < 5000 ? 'Nobody will pay you until you have 5,000 followers.' : A.chirp.why(L, 'joke')),
    run(L) {
      const s = L.s, pay = Math.round(L.sponPay(0.7 + L.rnd() * 0.6) / 10) * 10;
      s.use.chirp = (s.use.chirp || 0) + 1;
      L.cash(pay); s.n.earned += pay; L.crowd(-Math.round(s.chirp.n * 0.02));
      return `${L.pick(['A mattress company.', 'A meal kit. You burn it, off camera.', 'Trainers you would never wear.', 'A bank, of all things.'])} You hold it up and smile: ${money(pay)}.`;
    },
  });
  def('chirpShill', {
    sec: 'Cash in', title: 'Sell Dr Kelp’s Slimming Tea', icon: '🍵', per: 1, time: 0, desc: (L) => (L.followers() >= 5000 ? `About ${money(L.sponPay(2.5))}, for telling people something that is not true.` : 'It pays far better than honest products. Funny, that.'),
    why: (L) => (L.followers() < 5000 ? 'Nobody will pay you until you have 5,000 followers.' : A.chirp.why(L, 'joke')),
    run(L) {
      const s = L.s, pay = Math.round(L.sponPay(2.5) / 10) * 10;
      s.use.chirp = (s.use.chirp || 0) + 1;
      L.cash(pay); s.n.earned += pay; L.karma(-4); L.crowd(-Math.round(s.chirp.n * 0.05));
      if (L.chance(0.1)) { L.fame(-5); L.karma(-4); return `${money(pay)}, and then the Gazette prints what is actually in it. Seaweed, mostly. And something they use on boats.`; }
      return `It does not slim anybody and it is barely tea. ${money(pay)}, though.`;
    },
  });

  // -- a record
  def('album', {
    place: 'studios', sec: 'Music', icon: '🎙️', cost: 1500, time: 2,
    title: (L) => (L.s.album.p ? `Record your album (${L.s.album.p}/4)` : 'Record an album'),
    desc: 'Four sessions in the old smokehouse. Better with Craft and Charm; a hit pays for years.',
    show: (L) => !!L.s.items.guitar || !!L.s.items.piano,
    why: (L) => (L.s.st.craft < 45 ? 'Needs Craft 45.' : null),
    run(L) {
      const s = L.s, al = s.album;
      al.p++; al.q += s.st.craft * 0.6 + s.st.charm * 0.4;
      L.gain('craft', 2);
      if (al.p < 4) return L.pick(['Eleven takes of the first verse. The twelfth is the one.', 'The engineer says "interesting". You do it again.', 'A gull gets into the live room. You keep the take.', 'Somebody’s cousin plays the saxophone on it. It is too late to stop him.']);
      const q = al.q / 4 + L.int(-12, 12), boost = (s.heir === 'star' ? 1.4 : 1) * (1 + s.fame / 60);
      s.album = { p: 0, q: 0 };
      s.n.albums = (s.n.albums || 0) + 1;
      if (q >= 75) {
        const pay = Math.round(40000 * boost);
        L.cash(pay); s.n.earned += pay; L.fame(14); L.joy(15); s.f.hit = 1; L.earnFrom('album', 2200 * boost);
        L.note(`Made a record. It went to number one and earned ${money(pay)}.`, 'big');
        return `It is on the wireless in every shop on the High Street. Number one! ${money(pay)} now, and royalties for years.`;
      }
      if (q >= 50) {
        const pay = Math.round(6000 * boost);
        L.cash(pay); s.n.earned += pay; L.fame(5); L.joy(9); L.earnFrom('album', 320 * boost);
        L.note(`Made a record. It sold steadily and earned ${money(pay)}.`, 'big');
        return `Good reviews, a slot on local radio, a small tour of large pubs. ${money(pay)}, and a little in royalties.`;
      }
      L.cash(500); L.fame(1); L.joy(5);
      L.note('Made a record. The Gull & Anchor has it on the jukebox.', 'big');
      return 'It sells at gigs, mostly to people you know. $500. The next one will be better.';
    },
  });
}
