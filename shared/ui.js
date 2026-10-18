// Pieces of screen shared by the newer games: pop-up cards, toasts and
// confetti. (Arrow Cube has its own copies.)

import { settings, saveSettings, sfx, haptic } from './arcade.js';

const $ = (id) => document.getElementById(id);

// Pop-up cards. Buttons inside carry data-action="name"; actions[name] runs
// when one is tapped. Switches with data-setting="sound" etc. change settings.
export function cards(actions) {
  const overlay = $('overlay'), card = $('card');
  const ui = {
    isOpen: () => !overlay.hidden,
    show(html) {
      card.innerHTML = html;
      overlay.hidden = false;
    },
    close() { overlay.hidden = true; },
  };
  card.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    sfx('tap');
    if (el.dataset.action === 'close') ui.close();
    else actions[el.dataset.action]?.(el);
  });
  card.addEventListener('change', (e) => {
    const key = e.target.dataset.setting;
    if (!key) return;
    settings[key] = e.target.checked;
    saveSettings();
    if (key === 'haptics' && settings.haptics) haptic();
    if (key === 'sound') sfx('tap');
    actions.setting?.(key);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && card.querySelector('[data-action="close"]')) ui.close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ui.isOpen() && card.querySelector('[data-action="close"]')) ui.close();
  });
  return ui;
}

export const switchRow = (label, key) =>
  `<label class="row">${label} <input type="checkbox" class="toggle" data-setting="${key}" ${settings[key] ? 'checked' : ''}></label>`;

let toastTimer = 0;
export function toast(msg, ms = 2400) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

export function confetti() {
  const c = $('confetti'), g = c.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
  c.width = W * dpr;
  c.height = H * dpr;
  const colors = ['#5463ee', '#ffd12e', '#22c55e', '#f2576d', '#9b4dff', '#10a5f5'];
  const bits = Array.from({ length: 120 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 90, y: H * 0.4,
    vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 12 - 4,
    r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, c: colors[(Math.random() * colors.length) | 0],
  }));
  const t0 = performance.now();
  const step = (now) => {
    const t = now - t0;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.globalAlpha = Math.max(0, 1 - t / 2400);
    for (const b of bits) {
      b.vy += 0.34; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.fillStyle = b.c;
      g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); g.restore();
    }
    if (t < 2400) requestAnimationFrame(step);
    else g.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(step);
}

// The standard top bar and tool row icons.
export const ICON = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5 7.5 12l7 7"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" stroke-width="3.6" stroke-dasharray="2.9 2.9"/><circle cx="12" cy="12" r="6.2" fill="currentColor"/><circle cx="12" cy="12" r="2.5" class="gear-hole"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 4.5 4 9l4.5 4.5"/><path d="M4.5 9H14a5.5 5.5 0 0 1 0 11h-3.5"/></svg>',
  hint: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.4a6.6 6.6 0 0 0-4 11.9c.7.5 1.1 1.3 1.1 2.1v.9h5.8v-.9c0-.8.4-1.6 1.1-2.1A6.6 6.6 0 0 0 12 2.4z"/><rect x="9.1" y="18.6" width="5.8" height="2.9" rx="1.3"/></svg>',
  restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.2 3.8v4.6h4.6"/></svg>',
};
