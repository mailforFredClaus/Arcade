// New in Town: the screen for people who want things (the rules are in
// wants.js). A short "What your people are hoping for" box on the People
// tab, and on each person's own sheet: what they are hoping for now, how
// their dreams went, any arrangement for their care, money between you, and
// what the two of you have been through together.

import { CARE, PATHS, AMBITIONS, fee } from './wants-lib.js';

const EXAM_SAID = ['failed most of the exams', 'scraped through the exams', 'did well in the exams', 'got top marks in nearly everything'];
const OUT = { won: 'came true', lost: 'did not work out', held: 'you asked them not to', home: 'came home instead' };

export default function (kit) {
  const { esc, money } = kit;

  // One row: an icon, and a sentence.
  const row = (icon, html, cls = '') => `<div class="wants-row${cls ? ` ${cls}` : ''}"><i>${icon}</i><span>${html}</span></div>`;

  function person(life, p) {
    const r = life.wantsRec(p);
    if (!r) return '';
    const s = life.s, t = s.t, rows = [], first = esc(p.name.split(' ')[0]);
    const h = life.wantsHope(p);
    if (h) rows.push(row(h.icon, `<b>${esc(h.text)}</b>`, 'hope'));
    if ((p.kind === 'partner' || p.kind === 'spouse') && r.am) {
      for (const a of r.am.filter((q) => q.out)) rows.push(row(AMBITIONS[a.id].icon, `${esc(AMBITIONS[a.id].name)}: ${OUT[a.out] || 'over'}`, a.out === 'won' ? 'done' : 'past'));
      if (r.wed != null && p.kind === 'spouse' && t > r.wed) { const y = Math.floor((t - r.wed) / 4); if (y >= 1) rows.push(row('💍', `Married ${y} year${y === 1 ? '' : 's'}${r.forgot ? `, and you forgot the last anniversary` : ''}`)); }
      if (r.inl && r.inl.left > 0) rows.push(row('🫖', `${first}’s ${r.inl.left === 2 ? `parents, ${esc(r.inl.mum.split(' ')[0])} and ${esc(r.inl.dad.split(' ')[0])}` : `${r.inl.last === r.inl.mum ? 'mother' : 'father'}, ${esc((r.inl.last || '').split(' ')[0])}`}, ${r.inl.w >= 70 ? 'think the world of you' : r.inl.w >= 40 ? 'get on with you' : 'have their reservations'}${r.inl.help ? ', and have the little one on Thursdays' : ''}`));
    }
    if (p.kind === 'child') {
      if (p.age >= 6 && p.age < 17 && r.hope && !(h && h.text.includes(r.hope[0]))) rows.push(row('🌟', `Says ${p.sex === 'm' ? 'he' : 'she'} will be ${esc(r.hope[0])}`));
      if (r.ex != null) rows.push(row('✉️', `At sixteen, ${p.sex === 'm' ? 'he' : 'she'} ${EXAM_SAID[r.ex]}`));
      if (r.path && p.age >= 18 && PATHS[r.path]) rows.push(row('🧭', esc(PATHS[r.path].said)));
      if (r.path === 'crew') rows.push(row('🦊', 'Works for Sal'));
      if (r.dream) rows.push(row('✨', `Became ${esc(r.hope[0].replace(/, like .*$/, ''))}, as ${p.sex === 'm' ? 'he' : 'she'} always said`, 'done'));
      if (p.age < 5 && r.care) rows.push(row('🧸', { nursery: 'At the Bayview Nursery three days a week', gran: 'With Gran three days a week', home: 'At home with you' }[r.care] || ''));
    }
    if (p.kind === 'parent' && r.care) {
      const c = CARE[r.care], half = r.care !== 'with' && life.siblings().some((q) => q.bond >= 50);
      rows.push(row('🫖', `${esc(c.said)}${c.cost ? ` · ${money(Math.round(fee(life, c.cost) / (half ? 2 : 1)))} a season${half ? ', your half' : ''}` : ''}${r.care === 'you' ? ' · it takes a block of your time each season' : ''}`));
    }
    if (p.kind === 'friend') {
      const ln = s.wants.loans.find((q) => q.p === p.id), v = s.wants.ven;
      if (ln) rows.push(row('🫴', `Borrowed ${money(ln.n)}, to be paid back ${ln.due <= t ? 'by now' : ln.due - t === 1 ? 'next season' : `in ${ln.due - t} seasons`}`));
      if (v && v.p === p.id) rows.push(row('📈', `Your ${money(v.stake)} is in ${esc(v.name)}: ${v.hp >= 65 ? 'doing well' : v.hp >= 40 ? 'getting by' : 'struggling'}${v.got ? `, ${money(v.got)} back so far` : ''}`));
      if ((r.owe || 0) >= 2) rows.push(row('🤝', `${first} has not forgotten what you did for ${p.sex === 'm' ? 'him' : 'her'}`));
    }
    const been = life.wantsBeen(p);
    if (!rows.length && !been.length) return '';
    let html = `<div class="item wants-item">${rows.join('')}`;
    if (been.length) html += `<h4>What you have been through together</h4><ul class="wants-been">${been.slice().reverse().map((b) => `<li><em>${b.a}</em>${esc(b.t)}</li>`).join('')}</ul>`;
    return `${html}</div>`;
  }

  return {
    people(life) {
      if (!life.s.wants) return '';
      const l = life.wantsLines();
      if (!l.length) return '';
      return `<h3 class="group">What your people are hoping for</h3><div class="box wants-box">${l.map((q) => `<button class="wants-line" data-do="person" data-id="${q.p.id}"><i>${q.icon}</i><span><b>${esc(q.p.name.split(' ')[0])}</b> ${esc(q.text.replace(/^./, (c) => c.toLowerCase()))}</span><em>›</em></button>`).join('')}</div>`;
    },

    person(life, p) { return life.s.wants ? person(life, p) : ''; },

    css: `
.wants-item { margin-top: 10px; }
.wants-row { display: flex; align-items: flex-start; gap: 8px; padding: 4px 0; font-size: 13.5px; font-weight: 700; color: var(--ink); line-height: 1.35; }
.wants-row > i { flex: none; width: 24px; font-style: normal; font-size: 18px; text-align: center; line-height: 1.2; }
.wants-row.hope b { font-weight: 900; }
.wants-row.done span { color: var(--good); }
.wants-row.past span { color: var(--muted); }
.wants-item h4 { margin: 10px 2px 4px; }
.wants-been { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
.wants-been li { display: flex; gap: 8px; font-size: 12.5px; font-weight: 700; color: var(--muted); line-height: 1.35; }
.wants-been em { flex: none; min-width: 26px; font-style: normal; font-weight: 900; color: #9a8f78; }
.wants-box { padding: 4px 12px; }
.wants-line { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 6px 0; text-align: left; font-size: 13.5px; font-weight: 700; color: var(--ink); line-height: 1.3; }
.wants-line + .wants-line { border-top: 1.5px solid var(--line); }
.wants-line > i { flex: none; width: 26px; font-style: normal; font-size: 19px; text-align: center; }
.wants-line > span { flex: 1; min-width: 0; }
.wants-line b { font-weight: 900; }
.wants-line > em { flex: none; font-style: normal; font-weight: 900; color: #b5aa90; }
`,
  };
}
