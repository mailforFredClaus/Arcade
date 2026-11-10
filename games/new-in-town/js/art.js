// New in Town: the pictures. The map of Starling Bay, drawn as one SVG
// (400 wide, 600 tall, with each place a group you can tap), and the faces
// of the people in it.

import { PLACES, LOOKS, HOMES } from './data.js';

const SHORT = {
  home: 'Home', college: 'College', hospital: 'Hospital', studios: 'Studios', townhall: 'Town Hall', bank: 'Bank', gym: 'Gym',
  park: 'Park', highstreet: 'High Street', pub: 'Gull & Anchor', station: 'Station', labs: 'Labs', casino: 'Lucky Gull', harbour: 'Harbour',
};

// ---- small parts ------------------------------------------------------------------------

const win = (x, y, w = 7, h = 8) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" class="win"/>`;
const door = (x, y, w = 8, h = 12, c = '#6b4a36') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c}"/>`;
// A snow cap along a roof line (only shows in winter).
const snow = (d) => `<path d="${d}" class="snow"/>`;
const tree = (x, y, r = 9) => `<g class="tree"><rect x="${x - 1.5}" y="${y}" width="3" height="${r * 0.9}" fill="#8a6142"/><circle cx="${x}" cy="${y - r * 0.2}" r="${r}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.5}" r="${r * 0.45}" class="tree-hi"/></g>`;
const pine = (x, y, h = 20) => `<g class="pine"><rect x="${x - 1.5}" y="${y}" width="3" height="5" fill="#8a6142"/><path d="M${x} ${y - h} ${x + h * 0.42} ${y} ${x - h * 0.42} ${y}Z"/></g>`;
const cloud = (x, y, s = 1, cls = '') => `<g class="cloud ${cls}" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="20" ry="8"/><ellipse cx="-9" cy="-5" rx="10" ry="7"/><ellipse cx="6" cy="-7" rx="12" ry="8"/></g>`;
const boat = (x, y, c, cls = '') => `<g class="boat ${cls}" transform="translate(${x} ${y})"><path d="M-12 0h24l-4 7h-16z" fill="${c}"/><path d="M-12 0h24" stroke="#fff" stroke-width="1.6"/><path d="M0 -1v-17" stroke="#6b4a36" stroke-width="1.6"/><path d="M1.500 -17 11 -3H1.500z" fill="#fff"/></g>`;

// A plain building: walls, a pitched or flat roof, then whatever goes on the front.
function block(w, h, wall, roof, o = {}) {
  const x = -w / 2, y = 18 - h, over = o.over ?? 4;
  const top = o.flat
    ? `<rect x="${x - 2}" y="${y - 5}" width="${w + 4}" height="6" rx="2" fill="${roof}"/>${snow(`M${x - 2} ${y - 4}h${w + 4}`)}`
    : `<path d="M${x - over} ${y + 1} 0 ${y - (o.pitch ?? 14)} ${-x + over} ${y + 1}Z" fill="${roof}"/>${snow(`M${x - over + 2} ${y - 0.5} 0 ${y - (o.pitch ?? 14) + 1} ${-x + over - 2} ${y - 0.5}`)}`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${wall}"/><rect x="${x}" y="${16}" width="${w}" height="2" fill="rgba(0,0,0,.12)"/>${top}`;
}

// ---- the buildings ----------------------------------------------------------------------

const BUILD = {
  home(tier) {
    switch (tier) {
      case 0: // the hostel
        return `${block(58, 26, '#e8d3b0', '#b5654a', { pitch: 10 })}${win(-24, -1)}${win(-13, -1)}${win(7, -1)}${win(18, -1)}${door(-4, 6)}<rect x="-16" y="-17" width="32" height="8" rx="2" fill="#fff"/><text x="0" y="-11" class="sign">HOSTEL</text>`;
      case 1: // over the chip shop
        return `${block(34, 40, '#f3e2c4', '#7a5a8c')}${win(-11, -17)}${win(4, -17)}<path d="M-17 -4h34v5q-4.250 4 -8.500 0q-4.250 4 -8.500 0q-4.250 4 -8.500 0q-4.250 4 -8.500 0z" fill="#ff6b5e"/><path d="M-8.500 -4v6M8.500 -4v6" stroke="#fff" stroke-width="8.500" opacity=".85"/>${win(-12, 5, 10, 9)}${door(4, 6)}`;
      case 2: // a flat
        return `${block(40, 50, '#dfe7f0', '#5d7391', { flat: true })}${[-28, -17, -6].map((y) => win(-14, y) + win(-3.500, y) + win(7, y)).join('')}${door(-4, 6)}<rect x="-17" y="-8" width="34" height="1.500" fill="#5d7391"/>`;
      case 3: // a cottage
        return `${block(46, 26, '#fff4dc', '#b98a4a', { pitch: 18, over: 6 })}<rect x="10" y="-26" width="7" height="12" fill="#b5654a"/><g class="smoke"><circle cx="13.500" cy="-31" r="3"/><circle cx="16" cy="-37" r="4"/></g>${win(-17, -2)}${win(9, -2)}${door(-4, 5, 8, 13, '#2a8f7a')}<circle cx="-19" cy="14" r="4" fill="#f28ab2"/><circle cx="19" cy="14" r="4" fill="#ffc93c"/>`;
      case 4: // a townhouse
        return `${block(34, 54, '#c9705a', '#4a4f6b', { pitch: 10 })}${[-30, -18, -6].map((y) => win(-11, y) + win(4, y)).join('')}${door(-4, 5, 8, 13, '#1f2a44')}<path d="M-8 5h16" stroke="#fff" stroke-width="2"/>`;
      case 5: // the villa
        return `${block(62, 30, '#ffffff', '#3d4a6b', { flat: true })}<rect x="-27" y="-8" width="30" height="18" rx="2" class="win"/><rect x="8" y="-8" width="19" height="10" rx="2" class="win"/><rect x="-2" y="-26" width="28" height="16" rx="2" fill="#fff"/><rect x="-4" y="-29" width="32" height="4" rx="2" fill="#3d4a6b"/><rect x="2" y="-22" width="20" height="9" rx="1.500" class="win"/>${door(10, 6, 8, 12, '#3d4a6b')}`;
      default: // the manor
        return `<rect x="-38" y="-26" width="12" height="44" rx="2" fill="#e9dcc3"/><rect x="26" y="-26" width="12" height="44" rx="2" fill="#e9dcc3"/><path d="M-41 -25l9-13 9 13zM23 -25l9-13 9 13z" fill="#5a4a7a"/>${block(58, 36, '#f3e8d2', '#5a4a7a', { pitch: 16 })}${[-12, 0].map((y) => win(-23, y) + win(-12, y) + win(5, y) + win(16, y)).join('')}${win(-35.500, -14, 7, 9)}${win(28.500, -14, 7, 9)}${door(-5, 3, 10, 15, '#5a4a7a')}<circle cx="0" cy="-22" r="4" class="win"/><path d="M0 -40v-9" stroke="#6b4a36" stroke-width="1.500"/><path d="M0 -49h9l-3 3 3 3H0z" fill="#ff6b5e"/>`;
    }
  },
  college: () => `${block(60, 30, '#c9705a', '#6b4a36', { pitch: 9 })}<rect x="-8" y="-34" width="16" height="24" fill="#c9705a"/><path d="M-11 -33 0 -45 11 -33z" fill="#6b4a36"/>${snow('M-9 -34 0 -44 9 -34')}<circle cx="0" cy="-25" r="5" fill="#fff"/><path d="M0 -25v-3M0 -25h2.500" stroke="#1f2a44" stroke-width="1.200" stroke-linecap="round"/>${win(-26, -4)}${win(-16, -4)}${win(9, -4)}${win(19, -4)}${door(-5, 3, 10, 15)}<path d="M-5 3a5 5 0 0 1 10 0" fill="#6b4a36"/>`,
  hospital: () => `${block(56, 38, '#ffffff', '#9fb4c8', { flat: true })}${[-14, -3].map((y) => win(-24, y) + win(-14, y) + win(7, y) + win(17, y)).join('')}<rect x="-9" y="-36" width="18" height="18" rx="3" fill="#fff" stroke="#e8eef4" stroke-width="1.500"/><path d="M0 -33v12M-6 -27h12" stroke="#f2576d" stroke-width="4.500"/><rect x="-7" y="5" width="14" height="13" rx="2" class="win"/><rect x="-11" y="2" width="22" height="3" rx="1.500" fill="#f2576d"/>`,
  studios: () => `<path d="M-30 -8l14-12v12l14-12v12l14-12v12l14-12v30h-56z" fill="#e2a25c"/><path d="M-30 -8l14-12v12zM-2 -8v-12l14 12zM-16 -8l14-12v12zM12 -8v-12l14 12z" fill="#b5654a" opacity=".55"/>${snow('M-30 -8l14-12M-16 -8l14-12M-2 -8l14-12M12 -8l14-12')}<rect x="-30" y="16" width="56" height="2" fill="rgba(0,0,0,.12)"/><circle cx="-18" cy="6" r="5" fill="#ff6b5e"/><circle cx="-8" cy="3" r="4" fill="#ffc93c"/><circle cx="-11" cy="10" r="4" fill="#2aa7b8"/>${door(6, 3, 12, 15, '#3d4a6b')}<rect x="26" y="-30" width="6" height="48" fill="#b5654a"/><rect x="25" y="-32" width="8" height="4" fill="#8a4a36"/>`,
  townhall: () => `${block(64, 30, '#f3ead6', '#8fa3b8', { pitch: 12, over: 2 })}<path d="M-12 -12a12 12 0 0 1 24 0z" fill="#59b8a8"/><rect x="-1" y="-36" width="2" height="13" fill="#6b4a36"/><path d="M1 -36h10l-3 3.500 3 3.500H1z" fill="#ff6b5e" class="flag"/>${[-26, -16, 10, 20].map((x) => `<rect x="${x}" y="-10" width="5" height="26" rx="1.500" fill="#fff"/>`).join('')}${door(-6, 0, 12, 18, '#6b4a36')}<circle cx="0" cy="-6" r="0" /><rect x="-32" y="14" width="64" height="4" fill="#d9cdb4"/>`,
  bank: () => `${block(52, 32, '#e6e0d2', '#7d8a6b', { pitch: 12, over: 2 })}${[-20, -10, 5, 15].map((x) => `<rect x="${x}" y="-12" width="5" height="26" rx="1.500" fill="#fff"/>`).join('')}<circle cx="0" cy="-17" r="6.500" fill="#ffc93c"/><text x="0" y="-13.500" class="sign" style="font-size:10px;fill:#7a5600">$</text>${door(-4, 2, 8, 16, '#3d4a6b')}<rect x="-26" y="14" width="52" height="4" fill="#cfc8b6"/>`,
  gym: () => `${block(54, 30, '#6cc3d8', '#2a7f93', { flat: true })}<rect x="-22" y="-7" width="22" height="14" rx="2" class="win"/>${door(8, 4, 12, 14, '#1f5f70')}<g transform="translate(0 -22)"><rect x="-18" y="-7" width="36" height="13" rx="3" fill="#fff"/><path d="M-9 -0.500h18" stroke="#2a7f93" stroke-width="2.500"/><rect x="-12" y="-4.500" width="4" height="8" rx="1" fill="#2a7f93"/><rect x="8" y="-4.500" width="4" height="8" rx="1" fill="#2a7f93"/></g>`,
  park: () => `<ellipse cx="-16" cy="6" rx="20" ry="10" class="pond"/><ellipse cx="-20" cy="4" rx="7" ry="2.500" fill="#fff" opacity=".35"/><g transform="translate(24 -2)"><rect x="-13" y="6" width="26" height="5" rx="1" fill="#e9dcc3"/><path d="M-11 6v-13M11 6v-13M-4 6v-13M4 6v-13" stroke="#fff" stroke-width="2"/><path d="M-15 -6 0 -18 15 -6z" fill="#ff6b5e"/>${snow('M-13 -7 0 -17 13 -7')}<circle cx="0" cy="-19" r="2" fill="#ffc93c"/></g><g class="duck"><ellipse cx="-12" cy="6" rx="4" ry="2.500" fill="#fff"/><circle cx="-8.500" cy="3.500" r="2" fill="#fff"/><path d="M-6.800 3.500h2.500" stroke="#ff9a3c" stroke-width="1.500" stroke-linecap="round"/></g>`,
  highstreet: () => [[-21, '#ff6b5e', '#f6d9c8'], [0, '#2aa7b8', '#d6ecf0'], [21, '#ffc93c', '#f7ecc4']].map(([x, c, wall], i) => `<g transform="translate(${x})"><rect x="-10" y="${-14 - i % 2 * 5}" width="20" height="${32 + i % 2 * 5}" rx="2" fill="${wall}"/><rect x="-11" y="${-17 - i % 2 * 5}" width="22" height="5" rx="2" fill="#6b4a36"/>${snow(`M-11 ${-16.500 - i % 2 * 5}h22`)}${win(-3.500, -9 - i % 2 * 4, 7, 7)}<path d="M-10 0h20v4q-3.300 3 -6.600 0q-3.300 3 -6.600 0q-3.400 3 -6.800 0z" fill="${c}"/><rect x="-7" y="7" width="8" height="8" rx="1" class="win"/><rect x="3" y="7" width="5" height="11" rx="1" fill="#6b4a36"/></g>`).join(''),
  pub: () => `${block(52, 30, '#fff4dc', '#5b3d2e', { pitch: 16, over: 5 })}<path d="M-26 -1h52M-13 -12v30M13 -12v30M-26 -12l13 11M26 -12 13 -1" stroke="#5b3d2e" stroke-width="2.200" fill="none"/>${win(-23, 4, 8, 8)}${win(15, 4, 8, 8)}${door(-5, 4, 10, 14, '#2a6f4f')}<path d="M26 -8h10v2" stroke="#5b3d2e" stroke-width="1.800" fill="none"/><rect x="31" y="-6" width="11" height="13" rx="2" fill="#2a6f4f" class="swing"/><circle cx="36.500" cy="0.500" r="3" fill="#ffc93c" class="swing"/>`,
  station: () => `<path d="M-44 20h88" stroke="#8a7f72" stroke-width="5"/><path d="M-44 20h88" stroke="#5a5148" stroke-width="5" stroke-dasharray="2 5"/>${block(50, 22, '#e2b98a', '#a8483c', { pitch: 8, over: 8 })}${win(-20, 0)}${win(13, 0)}${door(-5, 3, 10, 13, '#a8483c')}<circle cx="0" cy="-6" r="0"/><rect x="-3" y="-20" width="6" height="8" fill="#e2b98a"/><circle cx="0" cy="-22" r="5" fill="#fff" stroke="#a8483c" stroke-width="1.500"/><path d="M0 -22v-3M0 -22h2" stroke="#1f2a44" stroke-width="1" stroke-linecap="round"/><g class="train" transform="translate(-58 9)"><rect x="0" y="0" width="20" height="9" rx="2" fill="#2a6f4f"/><rect x="13" y="-4" width="7" height="6" rx="1" fill="#2a6f4f"/><rect x="2" y="-3" width="3" height="4" fill="#1f2a44"/><circle cx="5" cy="10" r="2.500" fill="#1f2a44"/><circle cx="15" cy="10" r="2.500" fill="#1f2a44"/></g>`,
  labs: () => `<rect x="-30" y="-4" width="34" height="22" rx="2" fill="#dbe9f2"/><rect x="-32" y="-7" width="38" height="5" rx="2" fill="#3d4a6b"/>${snow('M-32 -6h38')}<rect x="-26" y="1" width="26" height="11" rx="1.500" class="win"/><path d="M8 18 11 -30h10l3 48z" fill="#fff"/><path d="M9.400 -4h13.200l.700 11H8.700zM10.700 -26h10.600l.600 10H10.100z" fill="#f2576d"/><rect x="8" y="-36" width="16" height="7" rx="1.500" fill="#3d4a6b"/><rect x="11" y="-42" width="10" height="7" rx="1" class="lamp"/><path d="M10 -42l6-6 6 6z" fill="#f2576d"/><path d="M21 -38.500 46 -46v15z" class="beam"/>${door(12, 7, 7, 11, '#3d4a6b')}`,
  casino: () => `<rect x="-26" y="-2" width="52" height="20" rx="2" fill="#f7e6ef"/><path d="M-26 -2h52" stroke="#d94a8c" stroke-width="3"/>${[-22, -13, -4, 5, 14].map((x, i) => `<rect x="${x}" y="-2" width="9" height="20" fill="${i % 2 ? '#fff' : '#f28ab2'}" opacity=".9"/>`).join('')}<path d="M-18 -2a18 16 0 0 1 36 0z" fill="#d94a8c"/>${snow('M-16 -5a17 14 0 0 1 32 0')}<circle cx="0" cy="-20" r="3" fill="#ffc93c"/>${door(-5, 5, 10, 13, '#7a2a5a')}${[-22, -11, 0, 11, 22].map((x, i) => `<circle cx="${x}" cy="-2" r="2" class="bulb b${i % 2}"/>`).join('')}`,
  harbour: () => `<rect x="-34" y="-2" width="26" height="20" rx="2" fill="#7fa3b5"/><path d="M-37 -1l16-12 16 12z" fill="#4f7386"/>${snow('M-35 -2l14-10 14 10')}${door(-26, 5, 10, 13, '#35566a')}<path d="M4 16v-34h16" stroke="#e08a3c" stroke-width="3" fill="none"/><path d="M18 -18v10" stroke="#5a5148" stroke-width="1.200"/><rect x="14" y="-8" width="8" height="6" fill="#b5654a"/><rect x="-2" y="8" width="9" height="8" fill="#ff6b5e"/><rect x="8" y="10" width="8" height="6" fill="#ffc93c"/>`,
};

// ---- the map ----------------------------------------------------------------------------

// tier: which home to draw. work: the place you work at (gets a badge).
// study: true if you're on a course.
export function townSvg({ tier = 0, work = null, study = false } = {}) {
  const road = (d) => `<path d="${d}" class="road-edge"/><path d="${d}" class="road"/>`;
  let out = `<svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" class="town" xmlns="http://www.w3.org/2000/svg">`;
  // Sky, far hills, the green, the sand and the sea.
  out += `<rect width="400" height="80" class="sky"/><circle cx="330" cy="26" r="13" class="sun"/>${cloud(70, 24, 1, 'c1')}${cloud(250, 16, 0.7, 'c2')}`;
  out += `<path d="M0 62q50-34 110-10t100-8 90 6 100-14v40H0z" class="hill-far"/>`;
  out += `<path d="M0 70q60-26 130-6t130-10 140 8v540H0z" class="land"/>`;
  out += `<path d="M0 500q40-12 80-4t80-2 80 6 80-6 80 2v104H0z" class="sand"/>`;
  out += `<path d="M0 520q40-10 80-2t80-4 80 6 80-6 80 2v84H0z" class="sea"/>`;
  out += `<path d="M0 548q30-6 60 0t60 0 60 0 60 0 60 0 60 0 60 0M-20 574q30-6 60 0t60 0 60 0 60 0 60 0 60 0 60 0" class="wave"/>`;
  // The pier and the quay.
  out += `<rect x="86" y="486" width="24" height="76" rx="3" fill="#b98a5a"/><path d="M86 496h24M86 508h24M86 520h24M86 532h24M86 544h24" stroke="#8a6142" stroke-width="1"/><rect x="60" y="540" width="76" height="24" rx="4" fill="#b98a5a"/>`;
  out += `<path d="M206 500h120v22h-22v36h-14v-36h-84z" fill="#a9a59c"/><path d="M206 500h120" stroke="#8d897f" stroke-width="3"/>`;
  out += boat(342, 548, '#ff6b5e', 'bob1') + boat(236, 572, '#2aa7b8', 'bob2') + boat(170, 560, '#ffc93c', 'bob3');
  // Roads.
  out += road('M200 120V478');
  out += road('M72 136H328');
  out += road('M64 248H336');
  out += road('M66 358H336');
  out += road('M70 462H338');
  out += road('M72 136V462');
  out += road('M330 136V462');
  out += road('M98 462V492');
  out += road('M262 462V502');
  // The park's grass, and trees about the place.
  out += `<rect x="150" y="288" width="100" height="62" rx="26" class="lawn"/>`;
  out += [[28, 96], [118, 78], [286, 82], [372, 92], [130, 186], [270, 190], [26, 282], [118, 298], [282, 292], [374, 290], [128, 396], [272, 400], [30, 396], [372, 392], [156, 304], [244, 300], [238, 344], [26, 470], [374, 468], [150, 476]].map(([x, y], i) => (i % 4 === 3 ? pine(x, y) : tree(x, y, 8 + (i % 3)))).join('');
  // The places.
  for (const [id, p] of Object.entries(PLACES)) {
    const art = id === 'home' ? BUILD.home(tier) : BUILD[id]();
    const label = SHORT[id], w = label.length * 5.600 + 14;
    out += `<g class="place" data-place="${id}" transform="translate(${p.x} ${p.y})" role="button" aria-label="${p.name}">`;
    out += `<ellipse cx="0" cy="19" rx="34" ry="5" class="shade"/>${art}`;
    out += `<g class="tag"><rect x="${-w / 2}" y="24" width="${w}" height="15" rx="7.500"/><text x="0" y="34.600">${label}</text></g>`;
    if (id === work) out += `<g class="mark"><circle cx="30" cy="-24" r="10"/><text x="30" y="-20">💼</text></g>`;
    if (id === 'college' && study) out += `<g class="mark"><circle cx="-30" cy="-24" r="10"/><text x="-30" y="-20">✏️</text></g>`;
    out += `<rect x="-40" y="-46" width="80" height="88" fill="transparent"/></g>`;
  }
  out += `<g class="flakes">${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 67) % 400}" cy="${(i * 131) % 600}" r="${1.200 + (i % 3) * 0.500}"/>`).join('')}</g>`;
  return `${out}</svg>`;
}

export const placeTier = (home) => HOMES[home].tier;

// ---- faces ------------------------------------------------------------------------------

// look: { skin, hair, top, style }. Hair greys with age; mood (0 to 100)
// sets the mouth.
export function face(look, age = 30, mood = 60) {
  const skin = LOOKS.skin[look.skin % LOOKS.skin.length], top = LOOKS.top[look.top % LOOKS.top.length];
  const hair = age >= 72 ? '#f2f2f2' : age >= 58 ? '#aab0ba' : LOOKS.hair[look.hair % LOOKS.hair.length];
  const child = age < 13, r = child ? 16 : 15, cy = child ? 29 : 27;
  const style = age < 2 ? 4 : look.style % LOOKS.styles;
  let back = '', front = '';
  switch (style) {
    case 0: front = `<path d="M${32 - r} ${cy - 2}a${r} ${r} 0 0 1 ${2 * r} 0q-4-9-${r}-8t-${r} 8z" fill="${hair}"/>`; break;
    case 1: back = `<path d="M${32 - r - 2} ${cy}a${r + 2} ${r + 2} 0 0 1 ${2 * r + 4} 0v20h-${2 * r + 4}z" fill="${hair}"/>`; front = `<path d="M${32 - r} ${cy - 1}a${r} ${r} 0 0 1 ${2 * r} 0q-8-8-${r + 3}-6t-${r - 3} 6z" fill="${hair}"/>`; break;
    case 2: back = `<circle cx="32" cy="${cy - r - 3}" r="6.500" fill="${hair}"/>`; front = `<path d="M${32 - r} ${cy - 2}a${r} ${r} 0 0 1 ${2 * r} 0q-6-7-${r}-7t-${r} 7z" fill="${hair}"/>`; break;
    case 3: back = [[-13, -6], [-8, -13], [0, -16], [8, -13], [13, -6], [-15, 2], [15, 2]].map(([dx, dy]) => `<circle cx="${32 + dx}" cy="${cy + dy}" r="6.500" fill="${hair}"/>`).join(''); front = `<path d="M${32 - r + 1} ${cy - 5}q${r - 1}-9 ${2 * r - 2} 0q-6-5-${r - 1}-5t-${r - 1} 5z" fill="${hair}"/>`; break;
    case 4: front = `<path d="M${32 - r} ${cy - 3}a${r} ${r} 0 0 1 ${2 * r} 0q-${r}-11-${2 * r} 0z" fill="${hair}" opacity=".55"/>`; break;
    default: back = `<rect x="${32 - r - 2}" y="${cy - r}" width="${2 * r + 4}" height="${r + 13}" rx="11" fill="${hair}"/>`; front = `<path d="M${32 - r} ${cy - 1}a${r} ${r} 0 0 1 ${2 * r} 0q-${r}-7-${2 * r} 0z" fill="${hair}"/>`;
  }
  const mouth = mood >= 60 ? `<path d="M26.500 ${cy + 6}q5.500 5 11 0" class="f-line"/>` : mood >= 35 ? `<path d="M27.500 ${cy + 7.500}h9" class="f-line"/>` : `<path d="M27 ${cy + 9}q5-4.500 10 0" class="f-line"/>`;
  const eyes = `<circle cx="26.500" cy="${cy}" r="${child ? 2.200 : 1.800}" fill="#1f2a44"/><circle cx="37.500" cy="${cy}" r="${child ? 2.200 : 1.800}" fill="#1f2a44"/>`;
  const extra = (child ? `<circle cx="23" cy="${cy + 5}" r="2.600" fill="#ff8a7a" opacity=".5"/><circle cx="41" cy="${cy + 5}" r="2.600" fill="#ff8a7a" opacity=".5"/>` : '')
    + (age >= 62 ? `<g fill="none" stroke="#3d4a6b" stroke-width="1.300"><circle cx="26.500" cy="${cy}" r="4.300"/><circle cx="37.500" cy="${cy}" r="4.300"/><path d="M30.800 ${cy}h2.400"/></g>` : '')
    + (age >= 68 ? `<path d="M21.500 ${cy + 3}l-2 1.500M42.500 ${cy + 3}l2 1.500M28 ${cy - 8}h8" class="f-line" opacity=".35"/>` : '');
  return `<svg viewBox="0 0 64 64" class="face" xmlns="http://www.w3.org/2000/svg">${back}<path d="M10 64q0-17 22-17t22 17z" fill="${top}"/><rect x="28" y="${cy + r - 4}" width="8" height="9" rx="3" fill="${skin}"/><circle cx="32" cy="${cy}" r="${r}" fill="${skin}"/><circle cx="${32 - r}" cy="${cy + 1}" r="2.600" fill="${skin}"/><circle cx="${32 + r}" cy="${cy + 1}" r="2.600" fill="${skin}"/>${front}${eyes}${mouth}${extra}</svg>`;
}

// A small line chart of a share's price.
export function spark(list, w = 84, h = 26) {
  if (list.length < 2) return `<svg viewBox="0 0 ${w} ${h}" class="spark"></svg>`;
  const lo = Math.min(...list), hi = Math.max(...list), span = hi - lo || 1;
  const pts = list.map((v, i) => `${(i / (list.length - 1) * (w - 4) + 2).toFixed(1)} ${(h - 3 - (v - lo) / span * (h - 6)).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" class="spark ${list[list.length - 1] >= list[0] ? 'up' : 'down'}"><polyline points="${pts}"/></svg>`;
}
