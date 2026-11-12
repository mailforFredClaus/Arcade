// New in Town: on the Me tab, the story of your working life so far (the
// rules are in careers.js): how far each career's story has gone, who taught
// you and who wanted your job and how they feel about you now, what you were
// given when you left, and which trades will not have you back.

import { CAREERS } from './data.js';

const MENTOR = [[70, 'Thinks the world of you'], [45, 'Thinks well of you'], [20, 'Keeps an eye on you'], [0, 'Has lost touch'], [-101, 'Will not speak to you']];
const RIVAL = [[45, 'A friend, after all'], [20, 'A friendly rival'], [0, 'Keeps an eye on you'], [-30, 'Still sore'], [-60, 'Bears a grudge'], [-101, 'Hates the sight of you']];
const word = (list, v) => list.find(([n]) => v >= n)[1];

export default function (kit) {
  const { esc } = kit;
  // A person from a story: their name (a button, if they are still in your life) and how they stand.
  const who = (v, list, role) => {
    if (!v) return '';
    const name = v.here ? `<button class="cr-who" data-do="person" data-id="${v.p.id}">${esc(v.name)}</button>` : `<span class="cr-who">${esc(v.name)}</span>`;
    return `<div class="cr-line"><small>${role}</small>${name}<em>${v.dead ? 'No longer with us' : word(list, v.v)}</em></div>`;
  };

  return {
    me(life) {
      const s = life.s, all = s.careers && s.careers.st;
      if (!all) return '';
      const mine = Object.keys(all).filter((c) => CAREERS[c] && (all[c].n > 0 || all[c].sent));
      const barred = Object.keys(s.careers.bar).filter((c) => CAREERS[c] && life.careerBarred(c));
      if (!mine.length && !barred.length) return '';
      // The job you are in first, then the rest, furthest first.
      const now = s.job && s.job.c;
      mine.sort((a, b) => (b === now) - (a === now) || (s.worked[b] || 0) - (s.worked[a] || 0));
      let html = '<div class="box cr-me"><h3>A working life</h3>';
      for (const c of mine) {
        const st = all[c], car = CAREERS[c], n = life.careerChapters(c);
        // (Chapters passed over, for a story taken up partway, are shown fainter.)
        const pips = Array.from({ length: n }, (_, i) => `<i class="${i < (st.from || 0) ? 'past' : i < st.n ? 'on' : ''}"></i>`).join('');
        html += `<div class="cr-car${c === now ? ' now' : ''}"><div class="cr-head"><span>${car.icon} ${esc(car.name)}</span><span class="cr-pips" title="${st.n} of ${n} chapters">${pips}</span></div>`;
        html += who(life.careerView(c, 'm'), MENTOR, 'Taught you') + who(life.careerView(c, 'r'), RIVAL, 'Wanted your job');
        if (st.gift) html += `<p class="fine">🎁 When you left: ${esc(st.gift)}.</p>`;
        else if (st.f.done && c === now) html += '<p class="fine">That story is told. What happens now is up to you.</p>';
        html += '</div>';
      }
      for (const c of barred) html += `<div class="line down"><span>⛔ ${esc(CAREERS[c].name)}</span><b>${esc(life.careerBarred(c))}</b></div>`;
      return `${html}</div>`;
    },
    css: `
.cr-me { min-width: 0; }
.cr-car { padding: 8px 0; border-bottom: 1.5px solid var(--line); }
.cr-car:last-of-type { border-bottom: 0; }
.cr-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-weight: 900; font-size: 14.5px; }
.cr-pips { display: flex; gap: 4px; flex: none; }
.cr-pips i { width: 14px; height: 8px; border-radius: 4px; background: #efe6d3; }
.cr-pips i.on { background: var(--teal); }
.cr-pips i.past { background: #c9e2dd; }
.cr-line { display: grid; grid-template-columns: minmax(0, max-content) minmax(0, 1fr); column-gap: 10px; align-items: center; margin-top: 6px; }
.cr-line small { grid-column: 1 / -1; font-size: 11.5px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
.cr-who { font: inherit; font-size: 14px; font-weight: 800; text-align: left; padding: 0; background: none; border: 0; color: inherit; }
button.cr-who { min-height: 44px; color: var(--teal-d); text-decoration: underline; text-underline-offset: 3px; }
span.cr-who { min-height: 28px; display: flex; align-items: center; }
.cr-line em { font-style: normal; font-size: 12.5px; font-weight: 700; color: #4d566e; text-align: right; }
.cr-me .line.down { align-items: flex-start; }
.cr-me .line.down b { white-space: normal; font-size: 12.5px; text-align: right; max-width: 62%; }
`,
  };
}
