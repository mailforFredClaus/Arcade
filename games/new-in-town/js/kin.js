// New in Town: the rest of the family. Brothers and sisters, who are
// there from the start (and who, for an heir, are the other children of
// the life before), and grandchildren, who arrive late and make old age
// worth having.

import { NAMES_M, NAMES_F, SURNAMES } from './data.js';

export function install({ def, A, Life, clamp }) {
  const he = (p) => (p.sex === 'm' ? 'he' : 'she');
  const his = (p) => (p.sex === 'm' ? 'his' : 'her');

  Object.assign(Life.prototype, {
    siblings() { return this.s.people.filter((p) => p.kind === 'sibling'); },
    grandkids() { return this.s.people.filter((p) => p.kind === 'grandchild'); },
    // The brothers and sisters a life starts with. list: ones already
    // known ({ name, sex, age, look, job, trait }); otherwise it is down to chance.
    addSiblings(list) {
      const s = this.s;
      if (!list) {
        const n = this.chance(0.6) ? (this.chance(0.3) ? 2 : 1) : 0;
        // (Younger than you or a little older, but never older than a parent could have managed.)
        const oldest = Math.min(29, ...s.people.filter((p) => p.kind === 'parent').map((p) => p.age - 19));
        list = Array.from({ length: n }, () => ({ age: this.int(18, Math.max(18, oldest)) }));
      }
      for (const o of list.slice(0, 3)) {
        const sex = o.sex || (this.chance(0.5) ? 'm' : 'f');
        const taken = [s.name.split(' ')[0], ...s.people.map((q) => q.name.split(' ')[0])];
        let name = o.name;
        for (let i = 0; !name && i < 20; i++) { const n = this.pick(sex === 'm' ? NAMES_M : NAMES_F); if (!taken.includes(n) || i === 19) name = n; }
        const p = this.makePerson({ ...o, sex, name, kind: 'sibling', bond: 48, age: clamp(o.age || 20, 14, 95), single: this.chance(0.5) });
        s.people.push(p);
      }
    },
    // A grandchild is born to one of your children.
    grandchild(parent) {
      const s = this.s, sex = this.chance(0.5) ? 'm' : 'f', last = parent.name.split(' ')[1] || this.pick(SURNAMES);
      const used = new Set(s.people.map((p) => p.name.split(' ')[0]));
      let first = this.pick(sex === 'm' ? NAMES_M : NAMES_F);
      for (let i = 0; i < 8 && used.has(first); i++) first = this.pick(sex === 'm' ? NAMES_M : NAMES_F);
      const p = this.makePerson({ name: parent.name.includes(' ') ? `${first} ${last}` : first, sex, kind: 'grandchild', bond: 35, age: 0, single: false, of: parent.id });
      s.people.push(p);
      s.f.grand = 1;
      return p;
    },
    // A birthday for one of the wider family.
    kinYear(p) {
      if (p.kind === 'grandchild' && p.age === 18) { p.single = true; this.fillPerson(p); }
      if (p.kind === 'sibling' && p.age >= 74 && this.chance((p.age - 72) ** 2 / 2200)) this.queue('sibDies', p.id);
    },
  });

  def('dayout', {
    who: true, sec: 'Do something together', icon: '🍦', cost: 40,
    title: (L, p) => (p.age < 5 ? 'An afternoon with the pram' : p.age < 13 ? 'A day out, your treat' : 'Lunch, and a slipped banknote'),
    desc: (L, p) => `${p.name.split(' ')[0]} thinks the world of you, and it does you more good than ${he(p)} knows.`,
    show: (L, p) => p.kind === 'grandchild' && p.age < 18,
    why: (L, p) => (L.s.use[`dayout${p.id}`] ? `Once a season: ${his(p)} parents have views.` : null),
    run(L, p) {
      L.s.use[`dayout${p.id}`] = 1;
      L.bond(p, 9); L.joy(7); L.hp(1);
      const kid = L.person(p.of);
      if (kid) L.bond(kid, 3);
      const first = p.name.split(' ')[0];
      if (p.age < 5) return L.pick([`Twice round the pond. ${first} sleeps through the ducks and wakes for the ice cream.`, `${first} holds your finger the whole way along the front.`, `You push the pram to the lighthouse and tell ${first} everything you know. ${first} blows a bubble.`]);
      if (p.age < 13) return L.pick([`The arcade, the rock shop and the end of the pier. ${first} wins a rubber shark and gives it to you.`, `You teach ${first} to skim stones. ${first} gets seven; you get two.`, `Fish and chips on the sea wall. A gull gets ${first}’s last chip, and ${first} talks of nothing else all week.`]);
      return L.pick([`${first} tells you things ${he(p)} would never tell ${his(p)} parents. You keep every one of them.`, `${first} lets you win at cards, which you pretend not to notice.`, `You hear all about a band you have never heard of. You nod. You slip ${first} a twenty.`]);
    },
  });
}
