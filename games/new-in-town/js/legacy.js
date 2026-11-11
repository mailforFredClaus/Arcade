// New in Town: what you leave behind, and a little extra on the side.
//
// The mayor's appeal: things the town needs and cannot pay for, from a
// bench on the sea wall to a new pier. Whoever pays has their name on it,
// and it stays: an heir who carries on the family finds it still there,
// and still doing them good. Money, in the end, is for something.
//
// A sideline: every career has one piece of work on the side for those
// who have got somewhere in it. And when the life is over, the Gazette
// prints what it made of you.

import { GIFTS, SIDELINES, CAREERS, COURSES, FISH, money } from './data.js';

export function install({ def, A, Life, clamp }) {
  Object.assign(Life.prototype, {
    // Something the town was given, by you or by your family before you.
    gift(id) { return this.s.gifts[id] || null; },
    // What is written on it.
    plaque(id) { return GIFTS[id].plaque(this.s.gifts[id]); },
    // What stands at a place on the map.
    plaques(place) { return Object.keys(GIFTS).filter((id) => GIFTS[id].at === place && this.s.gifts[id]).map((id) => this.plaque(id)); },
    // The turn of a season: the band plays in summer.
    legacySeason() {
      if (this.s.gifts.bandstand && this.season === 1 && !this.s.gaol) { this.joy(4); this.say('🎺', 'The band is playing in the park, every Sunday until autumn', 'good'); }
    },
    sideline() { const j = this.s.job, k = j && SIDELINES[j.c]; return k && j.r >= k.r ? k : null; },

    // What the Gazette prints when a life is over: a few plain sentences.
    epitaph() {
      const s = this.s, out = [], He = s.sex === 'f' ? 'She' : 'He', his = s.sex === 'f' ? 'her' : 'his';
      const first = s.name.split(' ')[0];
      const jobs = Object.keys(s.worked).filter((c) => CAREERS[c]).sort((a, b) => s.worked[b] - s.worked[a]);
      const kids = this.kids(), spouse = s.people.find((p) => p.kind === 'spouse');
      out.push(`${s.name}, who came to Starling Bay at eighteen with one suitcase${s.gen > 1 ? ', as the family had before' : ''}, has died at ${s.age}.`);
      if (jobs.length) {
        const c = jobs[0], title = CAREERS[c].rungs[s.worked[c]].title.toLowerCase();
        if (CAREERS[c].shady) out.push(`${He} was known to the police, and to Sal, for whom ${He.toLowerCase()} rose to ${title}.`);
        else out.push(s.worked[c] === CAREERS[c].rungs.length - 1 ? `${He} rose to be ${title}, which is as far as ${CAREERS[c].name.toLowerCase()} goes in this town.` : `${He} worked for many years in ${CAREERS[c].name.toLowerCase()}, as ${/^[aeiou]/.test(title) ? 'an' : 'a'} ${title}.`);
      } else out.push(`${He} was never known to hold a job, and did not seem to miss one.`);
      if (s.f.mogul) out.push(`${He} built a business from a single pitch into the biggest of its kind in the Bay.`);
      else if (s.biz) out.push(`${He} was ${his} own boss, and leaves a ${this.bizName().toLowerCase()}.`);
      if (Object.keys(s.edu).length >= 3) out.push(`${He} never stopped studying, and held ${Object.keys(s.edu).length} qualifications${this.hasDegree() ? `, among them ${Object.keys(s.edu).filter((id) => COURSES[id].degree).length > 1 ? 'more than one degree' : 'a degree'}` : ''}.`);
      if (s.n.books || s.n.albums) out.push(`${He} ${[s.n.books ? `wrote ${s.n.books === 1 ? `a novel${s.f.bestseller ? ' that everybody has read' : ''}` : `${s.n.books} novels${s.f.bestseller ? ', one of which everybody has read' : ''}`}` : '', s.n.albums ? `made ${s.n.albums === 1 ? `a record${s.f.hit ? ' that everybody can hum' : ''}` : `${s.n.albums} records${s.f.hit ? ', one of which everybody can hum' : ''}`}` : ''].filter(Boolean).join(' and ')}.`);
      if (this.followers() >= 100000) out.push(`${this.followers() >= 1e6 ? 'More than a million' : 'A hundred thousand'} strangers followed ${his} every word on Chirper. The Gazette has 212.`);
      else if (s.fame >= 50) out.push(`${He} was, for a while, the best-known face in the Bay.`);
      if (s.f.wasMayor) out.push(`${He} served as mayor, and the Town Hall clock ran four minutes slow throughout.`);
      const made = Object.keys(s.gave);
      if (made.length) out.push(`The town owes ${s.sex === 'f' ? 'her' : 'him'} ${made.length === 1 ? GIFTS[made[0]].said : `${made.slice(0, -1).map((id) => GIFTS[id].said).join(', ')} and ${GIFTS[made[made.length - 1]].said}`}.`);
      else if ((s.n.given || 0) >= 100000) out.push(`${He} gave away more than most people earn.`);
      if (s.n.inside) out.push(s.f.escaped ? `${He} spent ${s.n.inside} season${s.n.inside === 1 ? '' : 's'} in Starling Gaol, and left once without asking.` : `${He} spent ${s.n.inside} season${s.n.inside === 1 ? '' : 's'} in Starling Gaol${s.f.parole ? ', where the governor spoke well of ' + (s.sex === 'f' ? 'her' : 'him') : ''}.`);
      else if (s.n.crimes >= 20) out.push('The police have closed a number of files.');
      if (s.f.heist) out.push('The Harbour Bank robbery remains unsolved.');
      const hobbies = [];
      if (Object.keys(s.fishbook).length >= Object.keys(FISH).length - 1) hobbies.push('had caught nearly everything that swims in the bay');
      if (s.f.marrow) hobbies.push('once beat Mrs Pargeter at the Harvest Show');
      if (s.f.patron || (s.n.sets || 0) >= 1) hobbies.push('could not pass Mr Pym’s window');
      if (Object.keys(s.trips).length >= 6) hobbies.push('had seen a good deal of the world and come back every time');
      if (hobbies.length) out.push(`${He} ${hobbies.length === 1 ? hobbies[0] : `${hobbies.slice(0, -1).join(', ')} and ${hobbies[hobbies.length - 1]}`}.`);
      if (spouse || kids.length) out.push(`${He} leaves ${[spouse ? `a ${spouse.sex === 'm' ? 'husband' : 'wife'}, ${spouse.name.split(' ')[0]}` : '', kids.length ? (kids.length === 1 ? `a ${kids[0].sex === 'm' ? 'son' : 'daughter'}, ${kids[0].name.split(' ')[0]}` : `${['', '', 'two', 'three', 'four', 'five', 'six'][kids.length] || 'many'} children`) : ''].filter(Boolean).join(' and ')}${s.pet ? `, and ${s.pet.name}, who is waiting by the door` : ''}.`);
      else if (s.pet) out.push(`${He} leaves ${s.pet.name}, who is waiting by the door.`);
      else out.push(this.friends().length >= 3 ? `${He} never married, and was never short of company.` : `${He} kept ${his} own company.`);
      const worth = this.netWorth();
      out.push(worth >= 1e6 ? `${first} died rich, which surprised nobody.` : worth >= 50000 ? `${first} died comfortably off.` : worth > 0 ? `${first} leaves very little, and owed nothing.` : `${first} leaves debts, which the bank is looking into.`);
      out.push(s.karma >= 40 ? 'The whole town is expected at the funeral.' : s.karma <= -40 ? 'The funeral is on Thursday. A constable will attend, to be sure.' : 'The funeral is on Thursday, at the church on the hill.');
      return out;
    },
  });

  // -- the mayor's appeal
  def('giftsOpen', { place: 'townhall', sec: 'Doing good', icon: '🏗️', title: 'The mayor’s appeal', desc: 'What the town needs, and cannot pay for. Your name goes on it.', time: 0, open: 'gifts' });
  def('fund', {
    cost: (L, id) => (GIFTS[id] ? GIFTS[id].cost : 0),
    why: (L, id) => (!GIFTS[id] ? 'Fund what?' : L.s.gifts[id] ? 'It has been given.' : null),
    run(L, id) {
      const s = L.s, g = GIFTS[id];
      s.gifts[id] = s.name; s.gave[id] = 1;
      s.giftAt = { t: s.t, id };
      s.n.given = (s.n.given || 0) + g.cost;
      L.karma(g.karma); L.fame(g.fame); L.joy(6 + g.karma / 2);
      L.note(`Gave the town ${g.said}.`, 'big');
      L.say(g.icon, L.plaque(id), 'dream');
      return g.done;
    },
  });

  // -- a sideline
  def('sideline', {
    place: (L) => (L.sideline() ? CAREERS[L.s.job.c].place : null), sec: 'Work', per: 1, time: 2,
    icon: (L) => L.sideline().icon, title: (L) => L.sideline().title,
    desc: (L) => { const k = L.sideline(); return `${k.desc} ${k.pay ? `About ${money(L.shiftPay() * k.pay)}` : 'No fee, and it is noticed'} if it goes well (${Math.round(L.checkOdds(k.stat, k.dc) * 100)}%).`; },
    show: (L) => !!L.sideline(),
    run(L) {
      const s = L.s, k = L.sideline(), won = L.chance(L.checkOdds(k.stat, k.dc));
      L.gain(k.stat, 1); L.joy(won ? 2 : -2);
      const pay = Math.round(L.shiftPay() * k.pay * (won ? 0.9 + L.rnd() * 0.3 : 0.35) / 10) * 10;
      if (pay) { L.cash(pay); s.n.earned += pay; }
      if (won) { if (k.karma) L.karma(k.karma); if (k.fame) L.fame(k.fame); s.job.perf = clamp(s.job.perf + 2, 0, 100); }
      s.n.sides = (s.n.sides || 0) + 1;
      return `${won ? k.win : k.lose}${pay ? ` ${money(pay)}.` : ''}`;
    },
  });
}
