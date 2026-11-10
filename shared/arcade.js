// Shared helpers for every game in the arcade: saved data, settings,
// sound effects, haptic taps, and offline support.

const NS = 'arcade:';
const ROOT = new URL('../', import.meta.url);

export const rootUrl = (path = '') => new URL(path, ROOT).href;

export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(NS + key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  // Returns false if it couldn't be saved (storage full or blocked).
  set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};

export const settings = Object.assign({ sound: true, haptics: true }, store.get('settings', {}));
export const saveSettings = () => store.set('settings', settings);

// ---- sound --------------------------------------------------------------

let ctx = null, master = null, noiseBuf = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.45;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// iOS only lets audio start from inside a tap, so wake it on the first one.
export function unlockAudio() {
  const events = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
  const wake = () => {
    const a = audio();
    if (!a) return;
    const src = a.createBufferSource();
    src.buffer = a.createBuffer(1, 1, 22050);
    src.connect(master);
    src.start(0);
    if (a.state === 'running') events.forEach((ev) => window.removeEventListener(ev, wake, true));
  };
  events.forEach((ev) => window.addEventListener(ev, wake, true));
}

function tone(a, { f = 440, f2 = f, type = 'sine', t = 0, d = 0.15, g = 0.3 }) {
  const at = a.currentTime + t;
  const o = a.createOscillator(), v = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, at);
  if (f2 !== f) o.frequency.exponentialRampToValueAtTime(f2, at + d);
  v.gain.setValueAtTime(0.0001, at);
  v.gain.exponentialRampToValueAtTime(g, at + 0.008);
  v.gain.exponentialRampToValueAtTime(0.0001, at + d);
  o.connect(v);
  v.connect(master);
  o.start(at);
  o.stop(at + d + 0.03);
}

function hiss(a, { t = 0, d = 0.25, g = 0.25, f0 = 500, f1 = 2500, q = 1.1 }) {
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const at = a.currentTime + t;
  const src = a.createBufferSource(), bp = a.createBiquadFilter(), v = a.createGain();
  src.buffer = noiseBuf;
  bp.type = 'bandpass';
  bp.Q.value = q;
  bp.frequency.setValueAtTime(f0, at);
  bp.frequency.exponentialRampToValueAtTime(f1, at + d);
  v.gain.setValueAtTime(0.0001, at);
  v.gain.exponentialRampToValueAtTime(g, at + d * 0.3);
  v.gain.exponentialRampToValueAtTime(0.0001, at + d);
  src.connect(bp);
  bp.connect(v);
  v.connect(master);
  src.start(at, Math.random() * 0.5);
  src.stop(at + d + 0.03);
}

// k picks a variation for the sounds that have them (for 'match', how many
// cascades in a row: each one rings a step higher).
export function sfx(name, k = 0) {
  if (!settings.sound) return;
  const a = audio();
  if (!a || a.state !== 'running') return;
  switch (name) {
    case 'whoosh':
      hiss(a, { d: 0.22, g: 0.32, f0: 380, f1: 2600 });
      tone(a, { f: 520, f2: 880, type: 'triangle', d: 0.09, g: 0.07 });
      break;
    case 'bump':
      tone(a, { f: 170, f2: 70, d: 0.18, g: 0.5 });
      tone(a, { f: 95, f2: 60, type: 'triangle', t: 0.01, d: 0.12, g: 0.25 });
      break;
    case 'flip':
      tone(a, { f: 760, f2: 1140, type: 'triangle', d: 0.08, g: 0.08 });
      break;
    case 'tap':
      tone(a, { f: 900, type: 'triangle', d: 0.04, g: 0.08 });
      break;
    case 'hint':
      tone(a, { f: 880, d: 0.18, g: 0.12 });
      tone(a, { f: 1320, t: 0.09, d: 0.22, g: 0.1 });
      break;
    case 'star':
      tone(a, { f: 440, f2: 330, type: 'triangle', d: 0.22, g: 0.12 });
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(a, { f, type: 'triangle', t: i * 0.09, d: 0.32, g: 0.16 }));
      tone(a, { f: 1568, t: 0.36, d: 0.5, g: 0.07 });
      break;
    case 'pour':
      // A few glugs and a trickle.
      hiss(a, { d: 0.45, g: 0.1, f0: 1400, f1: 700, q: 3 });
      [0, 0.11, 0.21, 0.3].forEach((t, i) => tone(a, { f: 260 + i * 40, f2: 520 + i * 60, t, d: 0.07, g: 0.12 }));
      break;
    case 'pop':
      tone(a, { f: 480, f2: 1300, type: 'triangle', d: 0.07, g: 0.16 });
      tone(a, { f: 1760, t: 0.06, d: 0.18, g: 0.06 });
      break;
    case 'nope':
      tone(a, { f: 220, f2: 160, type: 'triangle', d: 0.12, g: 0.18 });
      break;
    case 'write':
      tone(a, { f: 1250, f2: 1100, type: 'triangle', d: 0.05, g: 0.07 });
      break;
    case 'wrong':
      tone(a, { f: 300, f2: 200, type: 'square', d: 0.14, g: 0.07 });
      tone(a, { f: 150, t: 0.02, d: 0.12, g: 0.2 });
      break;
    case 'chime':
      tone(a, { f: 988, type: 'triangle', d: 0.18, g: 0.1 });
      tone(a, { f: 1318, t: 0.08, d: 0.3, g: 0.08 });
      break;
    case 'swap':
      hiss(a, { d: 0.12, g: 0.1, f0: 900, f1: 2200, q: 1.4 });
      tone(a, { f: 620, f2: 780, type: 'triangle', d: 0.06, g: 0.06 });
      break;
    case 'match': {
      // A bright pluck that climbs a whole step with each cascade.
      const f = 523.25 * 2 ** ((Math.min(12, k) * 2) / 12);
      tone(a, { f, type: 'triangle', d: 0.16, g: 0.12 });
      tone(a, { f: f * 1.5, t: 0.03, d: 0.18, g: 0.06 });
      tone(a, { f: f * 2, t: 0.05, d: 0.22, g: 0.035 });
      break;
    }
    case 'line':
      // A zap down a whole row or column.
      tone(a, { f: 1700, f2: 260, type: 'sawtooth', d: 0.3, g: 0.045 });
      hiss(a, { d: 0.32, g: 0.16, f0: 3200, f1: 500, q: 0.8 });
      break;
    case 'bomb':
      tone(a, { f: 130, f2: 38, d: 0.55, g: 0.6 });
      tone(a, { f: 80, f2: 30, type: 'triangle', t: 0.02, d: 0.5, g: 0.3 });
      hiss(a, { d: 0.6, g: 0.42, f0: 1300, f1: 110, q: 0.6 });
      break;
    case 'flutter':
      // Wings beating, then off it goes.
      [0, 0.055, 0.11, 0.165].forEach((t) => hiss(a, { t, d: 0.05, g: 0.1, f0: 1400, f1: 2600, q: 2 }));
      tone(a, { f: 700, f2: 1500, type: 'triangle', t: 0.1, d: 0.25, g: 0.05 });
      break;
    case 'prism':
      // A shimmering run up two octaves.
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(a, { f: 880 * 2 ** (s / 12), type: 'triangle', t: i * 0.04, d: 0.24, g: 0.055 }));
      hiss(a, { d: 0.5, g: 0.06, f0: 6000, f1: 9000, q: 4 });
      break;
    case 'crate':
      // A knock on wood.
      tone(a, { f: 250, f2: 130, type: 'square', d: 0.07, g: 0.07 });
      hiss(a, { d: 0.11, g: 0.22, f0: 750, f1: 280, q: 2 });
      break;
    case 'ice':
      // Glass cracking.
      tone(a, { f: 2500, f2: 1700, type: 'triangle', d: 0.09, g: 0.06 });
      hiss(a, { d: 0.16, g: 0.16, f0: 5200, f1: 2400, q: 3 });
      break;
    case 'coin':
      tone(a, { f: 988, type: 'square', d: 0.07, g: 0.045 });
      tone(a, { f: 1319, type: 'square', t: 0.07, d: 0.24, g: 0.045 });
      break;
    case 'goal':
      // One of the goals ticked off.
      tone(a, { f: 784, type: 'triangle', d: 0.12, g: 0.1 });
      tone(a, { f: 1175, type: 'triangle', t: 0.07, d: 0.28, g: 0.09 });
      break;
    case 'lose':
      [392, 349, 311, 262].forEach((f, i) => tone(a, { f, type: 'triangle', t: i * 0.15, d: 0.32, g: 0.12 }));
      break;
    case 'slide':
      // Something sliding along wood.
      hiss(a, { d: 0.16, g: 0.11, f0: 450, f1: 950, q: 1.6 });
      break;
    case 'clack':
      // Something knocking into place.
      tone(a, { f: 380, f2: 200, type: 'triangle', d: 0.06, g: 0.16 });
      hiss(a, { d: 0.05, g: 0.12, f0: 1500, f1: 800, q: 2 });
      break;
    case 'fill':
      tone(a, { f: 660, f2: 590, type: 'triangle', d: 0.05, g: 0.08 });
      break;
    case 'cross':
      tone(a, { f: 430, f2: 370, type: 'triangle', d: 0.04, g: 0.06 });
      break;
    // Star Swarm.
    case 'laser':
      tone(a, { f: 1500, f2: 520, type: 'square', d: 0.09, g: 0.045 });
      break;
    case 'burst': {
      // k: how big the thing that blew up was.
      const f = [760, 560, 330, 620, 440][Math.min(4, k)] || 500;
      tone(a, { f, f2: f * 0.3, type: 'triangle', d: 0.16, g: 0.16 });
      hiss(a, { d: 0.14 + 0.05 * (k === 2), g: 0.14, f0: 2400, f1: 500, q: 0.9 });
      break;
    }
    case 'clank':
      tone(a, { f: 540, type: 'square', d: 0.05, g: 0.05 });
      tone(a, { f: 810, type: 'square', t: 0.04, d: 0.08, g: 0.04 });
      break;
    case 'swoop':
      tone(a, { f: 1250, f2: 380, d: 0.42, g: 0.05 });
      break;
    case 'tractor':
      // The beam warbling up and down for as long as it's out.
      for (let i = 0; i < 14; i++) tone(a, { f: 330 + (i % 4) * 130, f2: 520 + (i % 4) * 130, type: 'triangle', t: i * 0.2, d: 0.19, g: 0.055 });
      break;
    case 'alarm':
      [880, 740, 622, 523, 440, 370].forEach((f, i) => tone(a, { f, type: 'square', t: i * 0.11, d: 0.1, g: 0.05 }));
      break;
    case 'reunite':
      [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(a, { f, type: 'triangle', t: i * 0.08, d: 0.2, g: 0.11 }));
      break;
    case 'crash':
      tone(a, { f: 220, f2: 36, d: 0.8, g: 0.5 });
      hiss(a, { d: 0.9, g: 0.4, f0: 1800, f1: 90, q: 0.5 });
      hiss(a, { t: 0.15, d: 0.6, g: 0.2, f0: 900, f1: 200, q: 0.8 });
      break;
    case 'stage':
      tone(a, { f: 880, type: 'square', d: 0.07, g: 0.04 });
      tone(a, { f: 1320, type: 'square', t: 0.09, d: 0.12, g: 0.04 });
      break;
    case 'anthem':
      // The start of a game.
      [523, 659, 784, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(a, { f, type: 'square', t: i * 0.13, d: 0.12, g: 0.045 }));
      [262, 330, 392, 523].forEach((f, i) => tone(a, { f, type: 'triangle', t: i * 0.26, d: 0.25, g: 0.09 }));
      break;
    case 'cheer':
      // A big moment: a quick fanfare.
      [659, 784, 988, 1319].forEach((f, i) => tone(a, { f, type: 'triangle', t: i * 0.06, d: 0.22, g: 0.1 }));
      tone(a, { f: 1976, t: 0.24, d: 0.4, g: 0.05 });
      break;
  }
}

// ---- haptics ------------------------------------------------------------

// iPhones have no vibration API, but Safari 18+ gives a haptic tick when a
// switch-style checkbox is toggled, which we can do off-screen.
export function haptic() {
  if (!settings.haptics) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try {
    if (typeof navigator.vibrate === 'function') { navigator.vibrate(10); return; }
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.display = 'none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.appendChild(input);
    document.body.appendChild(label);
    label.click();
    label.remove();
  } catch { /* no haptics here */ }
}

// ---- page setup ---------------------------------------------------------

// Stop Safari from zooming the page when pinching or double-tapping.
export function lockViewport() {
  const stop = (e) => e.preventDefault();
  document.addEventListener('gesturestart', stop, { passive: false });
  document.addEventListener('gesturechange', stop, { passive: false });
  document.addEventListener('dblclick', stop, { passive: false });
}

// Offline support. On this computer (localhost) it stays off unless the
// address ends in ?sw=on, so edits always show up straight away.
export function registerOffline() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  const q = location.search;
  if (/[?&]sw=on\b/.test(q)) store.set('sw', true);
  if (/[?&]sw=off\b/.test(q)) store.set('sw', false);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (local && !store.get('sw', false)) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    return Promise.resolve(null);
  }
  return navigator.serviceWorker.register(rootUrl('sw.js'), { scope: rootUrl('') }).catch(() => null);
}
