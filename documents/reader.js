// The reading pages: progress bar, contents, text size, light or dark, and
// picking up where you left off. Everything is saved under 'arcade:reader'.
(() => {
  const KEY = 'arcade:reader';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
  const state = load();
  state.docs = state.docs || {};
  const root = document.documentElement;
  const doc = document.body.dataset.doc;
  const page = document.body.dataset.page || '1';
  const pageKey = `${doc}#${page}`;

  // ---------- text size ----------
  const sizeNow = () => parseFloat(getComputedStyle(root).getPropertyValue('--size')) || 18;
  const setSize = (px) => {
    px = Math.max(14, Math.min(28, px));
    root.style.setProperty('--size', `${px}px`);
    state.size = px;
    save(state);
  };
  document.getElementById('smaller').addEventListener('click', () => setSize(sizeNow() - 1));
  document.getElementById('bigger').addEventListener('click', () => setSize(sizeNow() + 1));

  // ---------- light or dark ----------
  const dark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.getElementById('theme').addEventListener('click', () => {
    root.dataset.theme = dark() ? 'light' : 'dark';
    state.theme = root.dataset.theme;
    save(state);
  });

  // ---------- contents ----------
  const toc = document.getElementById('toc');
  const tocBtn = document.getElementById('tocBtn');
  if (toc && tocBtn) {
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    document.body.appendChild(scrim);
    const open = (yes) => {
      document.body.classList.toggle('toc-open', yes);
      tocBtn.setAttribute('aria-expanded', String(yes));
    };
    tocBtn.addEventListener('click', () => open(!document.body.classList.contains('toc-open')));
    scrim.addEventListener('click', () => open(false));
    toc.addEventListener('click', (e) => { if (e.target.closest('a')) open(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
  }

  // Highlight the section you're reading.
  const links = toc ? [...toc.querySelectorAll('.sections a')] : [];
  const heads = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  let here = null;
  const mark = () => {
    let cur = heads[0];
    for (const h of heads) if (h.getBoundingClientRect().top < 110) cur = h;
    if (cur === here) return;
    here = cur;
    for (const a of links) a.classList.toggle('here', cur && a.hash === `#${cur.id}`);
    const a = links.find((l) => l.classList.contains('here'));
    if (a && toc.scrollHeight > toc.clientHeight && getComputedStyle(toc).position === 'sticky') {
      const r = a.getBoundingClientRect(), t = toc.getBoundingClientRect();
      if (r.top < t.top + 40 || r.bottom > t.bottom - 40) toc.scrollTop += r.top - t.top - t.height / 3;
    }
  };

  // ---------- progress and where you left off ----------
  const bar = document.querySelector('.bar');
  const fill = document.getElementById('progress');
  const title = document.querySelector('.doc h1');
  const entry = state.docs[doc] = state.docs[doc] || {};
  entry.pages = entry.pages || {};
  let saveTimer = 0;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? Math.min(1, scrollY / max) : 1;
    fill.style.width = `${pct * 100}%`;
    bar.classList.toggle('scrolled', title ? title.getBoundingClientRect().bottom < 60 : scrollY > 10);
    mark();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const p = entry.pages[page] = entry.pages[page] || {};
      p.y = Math.round(scrollY);
      p.pct = Math.max(p.pct || 0, Math.round(pct * 100));
      entry.page = page;
      entry.at = Date.now();
      state.last = doc;
      save(state);
    }, 250);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  // Come back to the same spot, unless the address points at a section.
  const saved = entry.pages[page];
  if (!location.hash && saved && saved.y > 200) {
    history.scrollRestoration = 'manual';
    requestAnimationFrame(() => scrollTo(0, saved.y));
  }
  // Opening a page counts as reading it, even before you scroll.
  entry.page = page;
  entry.at = Date.now();
  state.last = doc;
  save(state);
  onScroll();
  void pageKey;
})();
