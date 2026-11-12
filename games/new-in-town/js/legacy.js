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

import { GIFTS, SIDELINES, CAREERS, COURSES, FISH, money, an, lowJob } from './data.js';

export function install({ def, A, Life, clamp, hooks }) {
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
      const s = this.s, out = [], m = s.sex !== 'f', He = m ? 'He' : 'She', he = He.toLowerCase(), his = m ? 'his' : 'her', him = m ? 'him' : 'her';
      const first = s.name.split(' ')[0];
      const count = (n, one, many) => (n === 1 ? one : `${['', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'][n] || n} ${many}`);
      // A list in which anything with a comma of its own is closed off before the "and".
      const list = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')}${l.slice(0, -1).some((t) => t.includes(',')) ? ',' : ''} and ${l[l.length - 1]}`);
      const jobs = Object.keys(s.worked).filter((c) => CAREERS[c]).sort((x, y) => s.worked[y] - s.worked[x]);
      const kids = this.kids(), grand = this.grandkids().length;
      const spouse = s.people.find((p) => p.kind === 'spouse'), partner = s.people.find((p) => p.kind === 'partner');
      // (An heir who grew up in the Bay did not come on the train: chapters.js says how such a life began.)
      out.push((this.chapOpening && this.chapOpening()) || `${s.name}, who came to Starling Bay at eighteen with one suitcase${s.gen > 1 ? ', as the family had before' : ''}, has died at ${s.age}.`);
      if (jobs.length) {
        const c = jobs[0], title = lowJob(CAREERS[c].rungs[s.worked[c]].title);
        if (CAREERS[c].shady) out.push(`${He} was known to the police, and to Sal, in whose service ${he} rose to ${title}.`);
        else if (s.worked[c] === CAREERS[c].rungs.length - 1) out.push(`${He} rose to be ${title}, which is as far as that road goes in this town.`);
        else out.push(s.n.shifts < 24 ? `${He} had not been long at work, as ${an(title)}.` : `${He} worked as ${an(title)}.`);
      } else out.push(`${He} was never known to hold a job, and did not seem to miss one.`);
      if (s.f.mogul) out.push(`${He} built a business from a single pitch into the biggest of its kind in the Bay.`);
      else if (s.biz) out.push(`${He} was ${his} own boss, and leaves ${an(lowJob(this.bizName()))}.`);
      if (Object.keys(s.edu).length >= 3) out.push(`${He} never stopped studying, and held ${count(Object.keys(s.edu).length, 'a qualification', 'qualifications')}${this.hasDegree() ? `, among them ${Object.keys(s.edu).filter((id) => COURSES[id].degree).length > 1 ? 'more than one degree' : 'a degree'}` : ''}.`);
      const works = [];
      if (s.n.books) works.push(s.n.books === 1 ? `wrote a novel${s.f.bestseller ? ' that everybody has read' : ''}` : `wrote ${count(s.n.books, '', 'novels')}${s.f.bestseller ? ', one of which everybody has read' : ''}`);
      if (s.n.albums) works.push(s.n.albums === 1 ? `made a record${s.f.hit ? ' that everybody can hum' : ''}` : `made ${count(s.n.albums, '', 'records')}${s.f.hit ? ', one of which everybody can hum' : ''}`);
      if (works.length) out.push(`${He} ${list(works)}.`);
      if (this.followers() >= 100000) out.push(`${this.followers() >= 1e6 ? 'More than a million' : 'A hundred thousand'} strangers followed ${his} every word on Chirper. The Gazette has 212.`);
      else if (s.fame >= 50) out.push(`${He} was, for a while, the best-known face in the Bay.`);
      // (Not "served as mayor" when the line about work has just said so.)
      if (s.f.wasMayor) out.push(/\bbe mayor\b|\ba mayor\b/.test(out[1] || '') ? `The Town Hall clock ran four minutes slow throughout ${his} time in office.` : `${He} served as mayor, and the Town Hall clock ran four minutes slow throughout.`);
      const made = Object.keys(s.gave);
      if (made.length) out.push(`The town owes ${him} ${list(made.map((id) => GIFTS[id].said))}.`);
      else if ((s.n.given || 0) >= 100000) out.push(`${He} gave away more than most people earn.`);
      if (s.n.inside) out.push(`${He} spent ${count(s.n.inside, 'a season', 'seasons')} in Starling Gaol${s.f.escaped ? ', and left once without asking' : s.f.parole ? `, where the governor spoke well of ${him}` : ''}.`);
      else if (s.n.crimes >= 20) out.push('The police have closed a number of files.');
      if (s.f.heist) out.push('The Harbour Bank robbery remains unsolved.');
      const hobbies = [];
      if (Object.keys(s.fishbook).length >= Object.keys(FISH).length - 1) hobbies.push('had caught nearly everything that swims in the bay');
      if (s.f.marrow) hobbies.push('once beat Mrs Pargeter at the Harvest Show');
      if (s.f.patron || (s.n.sets || 0) >= 1) hobbies.push('could not pass Mr Pym’s window');
      if (Object.keys(s.trips).length >= 6) hobbies.push('had seen a good deal of the world and come back every time');
      if (hobbies.length) out.push(`${He} ${list(hobbies)}.`);
      // (The newer parts of town have their say: see HOOKS in engine.js.)
      for (const f of hooks.epitaph) f(this, out);
      // Who is left.
      const kin = [];
      if (spouse) kin.push(`a ${spouse.sex === 'm' ? 'husband' : 'wife'}, ${spouse.name.split(' ')[0]}`);
      else if (partner) kin.push(`${partner.eng ? (partner.sex === 'm' ? 'a fiancé' : 'a fiancée') : 'a sweetheart'}, ${partner.name.split(' ')[0]}`);
      if (kids.length) kin.push(kids.length === 1 ? `a ${kids[0].sex === 'm' ? 'son' : 'daughter'}, ${kids[0].name.split(' ')[0]}` : count(kids.length, '', 'children'));
      if (grand) kin.push(count(grand, 'a grandchild', 'grandchildren'));
      if (s.pet) kin.push(`${s.pet.name}, who is waiting by the door`);
      if (kin.length) out.push(`${He} leaves ${list(kin)}.`);
      if (!spouse && !partner) {
        // (By how the last marriage ended, not by whether an earlier one did; and nothing that says it did not speak of a marriage the Gazette has just spoken of.)
        const end = (this.chapWedEnd && this.chapWedEnd()) || (s.f.divorced ? { how: 'divorced' } : { how: 'widowed' });
        if (s.f.wed) {
          if (end.how === 'widowed') out.push(end.t != null && s.t - end.t < 8 ? `${He} had been widowed only lately.` : `${He} had been a ${m ? 'widower' : 'widow'} for some years.`);
          // (If the Gazette has already named the one married to, through the years together, it cannot say it was never spoken of.)
          else if (out.some((t) => / married to /.test(t))) { /* said already */ } else if (out.some((t) => /stood behind |sailed round the world with /.test(t))) out.push(`${He} had been married, and it did not last.`);
          else out.push(`${He} had been married, and did not speak of it.`);
        } else if (!kin.length || (kin.length === 1 && s.pet)) out.push(this.friends().length >= 3 ? `${He} never married, and was never short of company.` : `${He} kept ${his} own company.`);
      }
      const worth = this.netWorth();
      out.push(worth >= 1e6 ? `${first} died rich, which surprised nobody.` : worth >= 50000 ? `${first} died comfortably off.` : worth >= 0 ? `${first} leaves very little, and owed nothing.` : `${first} leaves debts, which the bank is looking into.`);
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
