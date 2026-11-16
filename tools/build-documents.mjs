// Builds the reading pages in documents/ from Claude Docs exports kept in
// tools/documents/<slug>/:
//   meta.json      the doc's name, its id and its tabs (names, order, nesting)
//   <tab id>.html  each tab's HTML export
//   figures.json   its diagrams and charts, { "node/<id>": "<JSX source>" }
// tools/documents/list.json says which documents to show, and in what order.
// It also writes the Documents list on the home page (index.html).
//
// Run:  npm install                      (once, for esbuild and katex)
//       node tools/build-documents.mjs
//       node tools/build-sw.mjs          (so the pages are kept for offline reading)
//
// Maths becomes MathML and diagrams become plain SVG here, so the pages need
// nothing from the internet and work with no signal.

import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';
import katex from 'katex';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'tools', 'documents');
const out = join(root, 'documents');
const list = JSON.parse(await readFile(join(src, 'list.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const strip = (s) => decode(s.replace(/<[^>]+>/g, ''));
const slugify = (s) => strip(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';

// ---------- diagrams: JSX source -> SVG markup ----------

// SVG attributes that keep their capitals; other camelCase names become kebab-case.
const KEEP = new Set(['viewBox', 'refX', 'refY', 'markerWidth', 'markerHeight', 'markerUnits', 'gradientUnits',
  'gradientTransform', 'patternUnits', 'patternContentUnits', 'patternTransform', 'preserveAspectRatio', 'pathLength',
  'stdDeviation', 'textLength', 'lengthAdjust', 'clipPathUnits', 'spreadMethod', 'startOffset', 'baseFrequency',
  'numOctaves', 'filterUnits', 'primitiveUnits', 'kernelMatrix', 'tableValues', 'attributeName', 'repeatCount',
  'keyTimes', 'keySplines', 'calcMode']);
const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'col', 'wbr']);
const RAW = Symbol('raw');
const raw = (html) => ({ [RAW]: html });
const kebab = (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const Fragment = Symbol('Fragment');

function kids(list) {
  let s = '';
  for (const c of [list].flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    s += typeof c === 'object' && RAW in c ? c[RAW] : esc(c);
  }
  return s;
}
function h(tag, props, ...children) {
  props = props || {};
  if (!children.length && props.children != null) children = [props.children];
  if (typeof tag === 'function') return tag({ ...props, children: children.length > 1 ? children : children[0] });
  if (tag === Fragment) return raw(kids(children));
  let attrs = '';
  for (let [k, v] of Object.entries(props)) {
    if (k === 'key' || k === 'ref' || k === 'children' || v == null || v === false || typeof v === 'function') continue;
    if (k === 'dangerouslySetInnerHTML') { children = [raw(v.__html)]; continue; }
    if (k === 'style' && typeof v === 'object') v = Object.entries(v).map(([a, b]) => `${a.startsWith('--') ? a : kebab(a)}:${b}`).join(';');
    const name = k === 'className' ? 'class' : k === 'htmlFor' ? 'for' : k === 'xlinkHref' ? 'href'
      : KEEP.has(k) || k.startsWith('data-') || k.startsWith('aria-') ? k : kebab(k);
    attrs += v === true ? ` ${name}` : ` ${name}="${esc(v)}"`;
  }
  if (VOID.has(tag)) return raw(`<${tag}${attrs}>`);
  return raw(`<${tag}${attrs}>${kids(children)}</${tag}>`);
}
const React = {
  createElement: h, Fragment,
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useMemo: (f) => f(), useCallback: (f) => f, useRef: (v) => ({ current: v }),
  useEffect: () => {}, useLayoutEffect: () => {}, useId: () => 'id',
};
// Charts hand their data to a function that draws them; here it is drawn once, as it first appears.
const claude = {
  Visualize: ({ sources = {}, children }) => {
    const data = Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, v && 'data' in v ? v.data : v]));
    const draw = [children].flat().find((c) => typeof c === 'function');
    return draw ? draw({ ...data, datum: () => ({}) }) : raw('');
  },
};

let figureCount = 0;
function renderFigure(code) {
  const js = transformSync(code, { loader: 'jsx', jsx: 'transform', jsxFactory: '__jsx', jsxFragment: '__Fragment', format: 'cjs' }).code;
  const module = { exports: {} };
  const req = (name) => (name === 'react' ? { ...React, default: React } : {});
  // Hooks and React are passed in only where the diagram doesn't declare its own of that name.
  const extra = Object.entries(React).filter(([k]) => k !== 'createElement' && !new RegExp(`\\b(?:const|let|var|function)\\s+${k}\\b`).test(js));
  new Function('module', 'exports', 'require', '__jsx', '__Fragment', 'React', 'claude', ...extra.map(([k]) => k), js)(
    module, module.exports, req, h, Fragment, React, claude, ...extra.map(([, v]) => v));
  const Comp = module.exports.default || module.exports;
  let svg = kids([typeof Comp === 'function' ? Comp({}) : Comp]);
  // Give each diagram's ids their own prefix so two diagrams on a page never clash.
  const p = `f${++figureCount}-`;
  for (const id of new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))) {
    const e = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    svg = svg.replace(new RegExp(`(\\sid=")${e}"`, 'g'), `$1${p}${id}"`)
      .replace(new RegExp(`url\\(#${e}\\)`, 'g'), `url(#${p}${id})`)
      .replace(new RegExp(`(href=")#${e}"`, 'g'), `$1#${p}${id}"`);
  }
  return svg;
}

// ---------- one tab's body ----------

const tex = (source, display) => katex.renderToString(decode(source), { displayMode: display, output: 'mathml', throwOnError: false, strict: 'ignore' });

function body(html, ctx) {
  // The byline: drop the account mention and the date (the page shows its own line under the title).
  html = html.replace(/<span data-atom="mention"[^>]*>[\s\S]*?<\/span>/g, '');
  html = html.replace(/<p>\s*(?:<time[^>]*>[\s\S]*?<\/time>)?\s*(?:·\s*)?<\/p>/g, '');
  // Maths.
  html = html.replace(/<pre><code class="language-(?:latex|tex|math|katex)">([\s\S]*?)<\/code><\/pre>/g, (_, t) => `<div class="math">${tex(t, true)}</div>`);
  html = html.replace(/<(span|code) (?:data-atom="math"|class="(?:math|language-latex)[^"]*")[^>]*>([\s\S]*?)<\/\1>/g, (_, __, t) => tex(t, false));
  // Diagrams and charts.
  html = html.replace(/<figure data-embed="([^"]+)"[^>]*>([\s\S]*?)<\/figure>/g, (_, ref, inner) => {
    const code = ctx.figures[ref];
    const cap = (inner.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [])[1];
    if (!code) { ctx.problems.push(`missing diagram ${ref}`); return ''; }
    let svg;
    try { svg = renderFigure(code); } catch (e) { ctx.problems.push(`diagram ${ref}: ${e.message}`); return ''; }
    return `<figure class="diagram"><div class="diagram-art">${svg}</div>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
  });
  // Links to other tabs and other documents.
  html = html.replace(/<a data-atom="(?:ref|container)" data-ref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, ref, label) => {
    const [kind, id] = ref.split('/');
    const target = kind === 'file' ? ctx.tabHref(id) : kind === 'project' ? ctx.docHref(id) : null;
    if (kind === 'project' && label === ref) label = esc(ctx.docTitle(id) || 'the companion guide');
    return target ? `<a href="${target}">${label}</a>` : label;
  });
  html = html.replace(/<a href="https:\/\/claude\.ai\/artifact\/([\w-]+)(?:#([\w-]+))?"/g, (m, art, tab) => {
    const target = art === ctx.artifact && tab ? ctx.tabHref(tab) : ctx.docHrefByArtifact(art);
    return target ? `<a href="${target}"` : m;
  });
  // Tables scroll sideways on a narrow screen instead of squashing.
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  html = html.replace(/<pre><code class="language-([\w+-]+)">/g, '<pre data-lang="$1"><code>');
  // Links to other sites open in a new tab.
  html = html.replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"');
  return html;
}

// ---------- the page ----------

const minutesFor = (html) => Math.max(1, Math.round(strip(html.replace(/<math[\s\S]*?<\/math>|<svg[\s\S]*?<\/svg>/g, ' ')).split(/\s+/).filter(Boolean).length / 230));

function page({ doc, tab, tabs, index, bodyHtml }) {
  const book = tabs.length > 1;
  // The title comes from the h1; the contents from the h2s and h3s.
  let html = bodyHtml.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/, '');
  const used = new Set();
  const toc = [];
  html = html.replace(/<h([23])(?: id="([^"]*)")?>([\s\S]*?)<\/h\1>/g, (_, level, id, inner) => {
    let s = id || slugify(inner);
    while (used.has(s)) s += '-2';
    used.add(s);
    toc.push({ level: +level, id: s, text: strip(inner) });
    return `<h${level} id="${s}"><a class="anchor" href="#${s}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${level}>`;
  });
  const title = book ? tab.name : doc.title;
  const minutes = minutesFor(html);
  const sections = toc.length >= 2 ? `<div class="sections">${book ? '<p class="toc-head">On this page</p>' : '<p class="toc-head">Contents</p>'}<ol>${toc.map((t) => `<li class="l${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></div>` : '';
  const chapters = book ? `<div class="chapters"><p class="toc-head">${esc(doc.title)}</p><ol>${tabs.map((t, i) =>
    `<li${t.parent ? ' class="sub"' : ''}><a href="${t.href}"${i === index ? ' class="current" aria-current="page"' : ''}>${esc(t.name)}</a></li>`).join('')}</ol></div>` : '';
  const hasToc = Boolean(sections || chapters);
  const prev = tabs[index - 1], next = tabs[index + 1];
  const nav = book ? `<nav class="chapter-nav">${prev ? `<a class="prev" href="${prev.href}"><small>← Previous</small><b>${esc(prev.name)}</b></a>` : ''}${next ? `<a class="next" href="${next.href}"><small>Next →</small><b>${esc(next.name)}</b></a>` : ''}</nav>` : '';
  const meta = book ? `${esc(doc.title)}<span class="dot">·</span>${index + 1} of ${tabs.length}<span class="dot">·</span>${minutes} min read` : `${minutes} min read`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Arcade">
  <meta name="theme-color" content="#f6f3ec" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#15171c" media="(prefers-color-scheme: dark)">
  <title>${esc(book && index > 0 ? `${tab.name} · ${doc.title}` : doc.title)}</title>
  <link rel="icon" href="../../icons/icon-192.png">
  <link rel="apple-touch-icon" href="../../icons/apple-touch-icon.png">
  <link rel="stylesheet" href="../reader.css">
  <script>try{var s=JSON.parse(localStorage.getItem('arcade:reader'))||{};if(s.theme)document.documentElement.dataset.theme=s.theme;if(s.size)document.documentElement.style.setProperty('--size',s.size+'px')}catch(e){}</script>
</head>
<body data-doc="${esc(doc.slug)}" data-page="${index + 1}">
  <div class="progress" aria-hidden="true"><span id="progress"></span></div>
  <header class="bar">
    <a class="back" href="../../index.html#documents" aria-label="Back to the Arcade">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>Arcade</span>
    </a>
    <span class="bar-title">${esc(title)}</span>
    <div class="tools">
      ${hasToc ? '<button type="button" class="tool toc-btn" id="tocBtn" aria-label="Contents" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>' : ''}
      <button type="button" class="tool" id="smaller" aria-label="Smaller text" title="Smaller text"><span class="aa small">A</span></button>
      <button type="button" class="tool" id="bigger" aria-label="Bigger text" title="Bigger text"><span class="aa">A</span></button>
      <button type="button" class="tool" id="theme" aria-label="Light or dark" title="Light or dark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button>
    </div>
  </header>
  <div class="layout${hasToc ? '' : ' no-toc'}">
    ${hasToc ? `<nav class="toc" id="toc" aria-label="Contents">${chapters}${sections}</nav>` : ''}
    <main class="doc">
      <p class="kicker">${esc(doc.topic)}</p>
      <h1>${esc(title)}</h1>
      <p class="meta">${meta}</p>
${html}
      ${nav}
      <footer class="doc-end">
        <a class="end-link" href="../../index.html#documents">← Back to the Arcade</a>
      </footer>
    </main>
  </div>
  <script src="../reader.js"></script>
</body>
</html>
`;
}

// ---------- build ----------

// Tabs in reading order: each tab, then the tabs nested under it.
function orderTabs(meta) {
  const all = Object.entries(meta.tabs || {}).map(([id, t]) => ({ id, name: t.name, order: t.order || '', parent: t.subtabOf || null }));
  const kids = (p) => all.filter((t) => t.parent === p).sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
  const outList = [];
  const walk = (p) => { for (const t of kids(p)) { outList.push(t); walk(t.id); } };
  walk(null);
  return outList;
}

const docsMeta = [];
for (const doc of list) {
  const dir = join(src, doc.slug);
  const meta = JSON.parse(await readFile(join(dir, 'meta.json'), 'utf8'));
  const tabs = orderTabs(meta).filter((t) => existsSync(join(dir, `${t.id}.html`)));
  tabs.forEach((t, i) => { t.file = i === 0 ? 'index.html' : `${i + 1}.html`; t.href = i === 0 ? './' : t.file; });
  docsMeta.push({ ...doc, title: doc.title || meta.name, uuid: meta.uuid, tabs, dir });
}
const byUuid = new Map(docsMeta.map((d) => [d.uuid, d]));
const byArtifact = new Map(docsMeta.map((d) => [d.artifact, d]));

const built = [];
let problems = 0;
for (const doc of docsMeta) {
  const figures = existsSync(join(doc.dir, 'figures.json')) ? JSON.parse(await readFile(join(doc.dir, 'figures.json'), 'utf8')) : {};
  await rm(join(out, doc.slug), { recursive: true, force: true });
  await mkdir(join(out, doc.slug), { recursive: true });
  let minutes = 0;
  for (const [index, tab] of doc.tabs.entries()) {
    const ctx = {
      figures, problems: [], artifact: doc.artifact,
      tabHref: (id) => { const t = doc.tabs.find((x) => x.id === id); return t ? t.href : null; },
      docHref: (uuid) => (byUuid.has(uuid) ? `../${byUuid.get(uuid).slug}/` : null),
      docTitle: (uuid) => byUuid.get(uuid)?.title,
      docHrefByArtifact: (art) => (byArtifact.has(art) ? `../${byArtifact.get(art).slug}/` : null),
    };
    const bodyHtml = body(await readFile(join(doc.dir, `${tab.id}.html`), 'utf8'), ctx);
    minutes += minutesFor(bodyHtml);
    await writeFile(join(out, doc.slug, tab.file), page({ doc, tab, tabs: doc.tabs, index, bodyHtml }));
    if (ctx.problems.length) { problems += ctx.problems.length; console.warn(`  !! ${doc.slug} / ${tab.name}: ${ctx.problems.join('; ')}`); }
  }
  built.push({ slug: doc.slug, title: doc.title, group: doc.group, topic: doc.topic, blurb: doc.blurb, minutes, pages: doc.tabs.length });
  console.log(`${doc.slug}: ${doc.tabs.length} page${doc.tabs.length > 1 ? 's' : ''}, ${minutes} min`);
}

// Remove pages for documents no longer in the list.
for (const e of await readdir(out, { withFileTypes: true })) {
  if (e.isDirectory() && !built.some((d) => d.slug === e.name)) await rm(join(out, e.name), { recursive: true });
}

// ---------- the list on the home page ----------

const ICON = {
  'AI and machine learning': '<path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/><rect x="6" y="6" width="12" height="12" rx="2.5"/><path d="M10 10h4v4h-4z" fill="currentColor"/>',
  'Unreal Engine': '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M12 12 20 7.5M12 12 4 7.5M12 12v9"/>',
  'Everything else': '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/>',
};
const groups = [...new Set(built.map((d) => d.group))];
const rows = groups.map((g) => `
        <p class="doc-group">${esc(g)}</p>
${built.filter((d) => d.group === g).map((d) => `        <a class="doc-row" href="documents/${d.slug}/" data-doc="${d.slug}" data-pages="${d.pages}">
          <span class="doc-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${ICON[g] || ICON['Everything else']}</svg></span>
          <span class="doc-text"><b>${esc(d.title)}</b><span>${esc(d.blurb)}</span></span>
          <span class="doc-time">${d.pages > 1 ? `${d.pages} chapters` : `${d.minutes} min`}</span>
        </a>`).join('\n')}`).join('');
const block = `<!-- documents:start (written by tools/build-documents.mjs) -->
    <section class="docs" id="documents" aria-labelledby="docsTitle">
      <div class="docs-head">
        <h2 id="docsTitle">Documents</h2>
        <p class="sub">${built.length} to read, with or without signal.</p>
      </div>
      <a class="doc-continue" id="docContinue" hidden></a>
      <div class="doc-list">${rows}
      </div>
    </section>
    <!-- documents:end -->`;
const indexPath = join(root, 'index.html');
const index = await readFile(indexPath, 'utf8');
if (!/<!-- documents:start[\s\S]*?<!-- documents:end -->/.test(index)) throw new Error('index.html has no documents markers');
await writeFile(indexPath, index.replace(/<!-- documents:start[\s\S]*?<!-- documents:end -->/, block));
console.log(`${built.length} documents written to documents/${problems ? `, ${problems} problems` : ''}`);
