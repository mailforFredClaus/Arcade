// New in Town: the flutter on screen (the rules are in flutter.js): a line on the Me tab once a
// habit has started, saying how strong it is and what can be done about it.

export default function (kit) {
  const { esc } = kit;
  return {
    me(life) {
      const f = life.s.flutter;
      if (!f || (f.h < 15 && !f.was && !(f.warned > 0))) return '';
      const hooked = life.flHooked();
      return `<div class="box"><h3>The flutter</h3>
        <div class="skill"><i>🎲</i><span>${esc(life.flWord())}</span><span class="bar"><span style="width:${Math.round(f.h)}%"></span></span><b>${Math.round(f.h)}</b></div>
        ${life.flBarred() ? `<p class="sub">${f.house ? '🚪 Asked to stay away from' : '✋ Barred from'} the pier’s games for ${f.barred - life.s.t} more season${f.barred - life.s.t > 1 ? 's' : ''}.</p>` : ''}
        ${life.flLimit() != null && !life.flBarred() ? `<p class="sub">🎩 The manager takes no more than ${kit.money(life.flLimit())} a bet from you, for ${f.lim - life.s.t} more season${f.lim - life.s.t > 1 ? 's' : ''}.</p>` : ''}
        <p class="fine">${hooked ? 'It has hold of you: a season without a bet is a miserable one, and it weighs on you even when you win. A season without it wears it down; the Tuesday group at St Brigid’s wears it down faster, and the Lucky Gull will bar you if you ask.' : 'Every bet feeds it a little, a big stake or chasing a loss a lot. A season without one wears it down.'}</p></div>`;
    },
  };
}
