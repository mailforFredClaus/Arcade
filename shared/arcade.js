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

export function sfx(name) {
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
