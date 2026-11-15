// New in Town: money for the comfortable, on screen. A Living well box on
// the Me tab, for somebody of means: what a person like you is used to,
// what is missing and what it weighs, and the yacht if there is one. The
// rules are in comfort.js.

export default function (kit) {
  const { esc, money } = kit;
  return {
    me(life) {
      const s = life.s, c = s.comfy;
      if (!c) return '';
      const wants = life.comfyWants(), y = c.yacht;
      if (!wants.length && !y) return '';
      let html = '<div class="box cf-me"><h3>Living well</h3>';
      if (wants.length) {
        const gap = life.comfyGap();
        html += `<p class="fine">With what you have, you are used to these. ${gap ? `What is missing weighs on you, ${gap} off your mood, and you will not be happier than ${life.comfyCap()} without it.` : 'You have them all.'}</p>`;
        html += wants.map((w) => `<div class="line cf-want${w.ok ? ' ok' : ''}"><span>${w.icon} ${esc(w.text)}</span><b>${w.ok ? '✓' : '○'}</b></div>`).join('');
      }
      if (y) html += `<div class="line"><span>🛥️ The ${esc(y.name)}</span><b>${money(life.comfyYachtValue())}</b></div><p class="fine">On her mooring at the harbour. ${c.n.cruises ? `Along the coast with the family ${c.n.cruises === 1 ? 'once' : `${c.n.cruises} times`}.` : 'Take the family along the coast, spring to autumn.'}</p>`;
      return `${html}</div>`;
    },
    css: '.cf-me .cf-want span{opacity:.75}.cf-me .cf-want.ok span{opacity:1}.cf-me .cf-want b{min-width:1.5em;text-align:right}.cf-me .cf-want.ok b{color:var(--teal)}',
  };
}
