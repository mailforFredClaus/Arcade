// Nonogram: fill in squares so every row and column matches its clue, and a
// picture appears. Every puzzle can be solved line by line, with no guessing.

import { MODES, SIZES, makePuzzle, solveLine, doneRuns, runsOf, nextStep, UNKNOWN, FILL, EMPTY } from './logic.js';
import { store, settings, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, toast, confetti, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = ICON[el.dataset.icon];
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

if (settings.nonogramMistakes === undefined) settings.nonogramMistakes = true;
if (settings.nonogramAutoCross === undefined) settings.nonogramAutoCross = true;
if (settings.nonogramLongPress === undefined) settings.nonogramLongPress = true;

const MODE_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard', huge: 'Huge' };
const THEME = { easy: '', medium: 'teal', hard: 'red', huge: 'night' };
const canvas = $('stage');
const g = canvas.getContext('2d');

// What's on each square. A wrong fill (with mistakes shown) turns into a red
// cross, as the square is really empty; a wrong cross shows the square
// filled, marked red. Those two are settled and can't be changed.
const BLANK = 0, FILLED = 1, CROSSED = 2, WRONG_FILL = 3, WRONG_CROSS = 4;
const isFilled = (m) => m === FILLED || m === WRONG_CROSS;
const isOut = (m) => m === CROSSED || m === WRONG_FILL;
const settled = (m) => m === WRONG_FILL || m === WRONG_CROSS;
const knownOf = (m) => (isFilled(m) ? FILL : isOut(m) ? EMPTY : UNKNOWN);

// ---- saved progress ----------------------------------------------------------------

// One run per size: the puzzle you're up to, how many you've solved (and
// which), your best time, the puzzle in progress, and a few others you've
// started and left (so trying another number doesn't lose one).
const SAVE_KEY = 'nonogram';
const KEEP = 5;
const save = (() => {
  const s = store.get(SAVE_KEY, {}) || {};
  const out = { mode: MODES.includes(s.mode) ? s.mode : 'easy', seen: s.seen || {}, runs: s.runs || {} };
  for (const m of MODES) out.runs[m] = Object.assign({ n: 1, solved: 0, won: [], best: null, play: null, kept: [] }, out.runs[m]);
  return out;
})();
const writeSave = () => store.set(SAVE_KEY, save);

// A fingerprint of a puzzle's clues: a save only fits the puzzle it was made on.
function clueKey(p) {
  let h = 0x811c9dc5;
  for (const ch of JSON.stringify([p.rowClues, p.colClues])) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return (h >>> 0).toString(36);
}

const started = (play) => !!play && /[1-4]/.test(play.marks || '');

// Put the puzzle in progress aside before another number starts.
function stash(run, n) {
  const p = run.play;
  run.play = null;
  if (!started(p) || p.n === n) { run.play = p && p.n === n ? p : null; return; }
  run.kept = [p, ...run.kept.filter((q) => q.n !== p.n)].slice(0, KEEP);
}

// The saved progress on puzzle n, if there is any (taking it off the kept list).
function takeSaved(run, n) {
  if (run.play && run.play.n === n) return run.play;
  const k = run.kept.findIndex((q) => q.n === n);
  return k < 0 ? null : run.kept.splice(k, 1)[0];
}

// ---- the game ------------------------------------------------------------------------

let mode = save.mode;
let puzzle = null;
let cols = 0, rows = 0, N = 0;
let marks = new Uint8Array(0);
let undoStack = []; // each step: a list of [square, what it was]
let time = 0, mistakes = 0, hints = 0;
let finished = false;
let revealAt = 0; // when the finished picture starts colouring in
let crossMode = false;
// For each line: which clue numbers are done, whether it can't be right as
// marked, and whether it's complete.
const lines = { row: [], col: [] };
let hintInfo = null; // { cell, kind, index, at }
let flashes = []; // lines just finished: { kind, index, at }
let playToken = 0; // changes with each puzzle, so a late "solved!" card can tell it's stale

function startPuzzle(n, resume = true) {
  n = Math.max(1, Math.floor(n) || 1);
  ui.close();
  playToken++;
  const run = save.runs[mode];
  stash(run, n);
  const play = resume ? takeSaved(run, n) : null;
  if (!resume) run.kept = run.kept.filter((q) => q.n !== n);
  puzzle = makePuzzle(mode, n);
  cols = puzzle.cols;
  rows = puzzle.rows;
  N = cols * rows;
  marks = new Uint8Array(N);
  undoStack = [];
  time = mistakes = hints = 0;
  finished = false;
  hintInfo = null;
  flashes = [];
  gesture = null;
  let keptView = null;
  if (play && play.v === puzzle.v && play.c === clueKey(puzzle) && play.marks && play.marks.length === N) {
    for (let i = 0; i < N; i++) marks[i] = Math.min(4, Math.max(0, play.marks.charCodeAt(i) - 48));
    time = play.time || 0;
    mistakes = play.mistakes || 0;
    hints = play.hints || 0;
    keptView = play.view || null;
  }
  for (const t of ['teal', 'red', 'night']) document.body.classList.toggle(`theme-${t}`, THEME[mode] === t);
  $('levelLabel').textContent = `${MODE_NAME[mode].toUpperCase()} ${n}`;
  $('tierTag').textContent = mode === 'huge' ? `${cols}×${rows}` : '';
  colours = null;
  refreshLines();
  layout(true, keptView);
  updateHud();
  // A puzzle saved already complete (it can't normally happen) is won now.
  if (isSolved()) return win();
  savePlay();
  intro();
}

function savePlay() {
  if (!puzzle) return;
  save.runs[mode].play = finished ? null : {
    n: puzzle.n, v: puzzle.v, c: clueKey(puzzle), time, mistakes, hints,
    marks: Array.from(marks, (m) => String(m)).join(''),
    view: zoomable() ? { s: view.s, fx: (area.x + area.w / 2 - view.ox) / view.s, fy: (area.y + area.h / 2 - view.oy) / view.s } : null,
  };
  writeSave();
}

// ---- lines ---------------------------------------------------------------------------

const lineCells = (kind, i) => (kind === 'row'
  ? Array.from({ length: cols }, (_, c) => i * cols + c)
  : Array.from({ length: rows }, (_, r) => r * cols + i));
const clueOf = (kind, i) => (kind === 'row' ? puzzle.rowClues[i] : puzzle.colClues[i]);

function lineState(kind, i) {
  const cells = lineCells(kind, i), clue = clueOf(kind, i);
  const line = cells.map((j) => knownOf(marks[j]));
  const runs = runsOf(line.map((s) => (s === FILL ? 1 : 0)));
  const full = runs.length === clue.length && runs.every((b, j) => b === clue[j]);
  // With mistakes hidden you can mark a line so it can't possibly be right:
  // its clue turns red.
  const bad = !settings.nonogramMistakes && !solveLine(clue, line, new Uint8Array(line.length));
  return { done: doneRuns(clue, line), full, bad };
}

function refreshLines(kind, index) {
  if (kind === undefined) {
    lines.row = Array.from({ length: rows }, (_, r) => lineState('row', r));
    lines.col = Array.from({ length: cols }, (_, c) => lineState('col', c));
  } else lines[kind][index] = lineState(kind, index);
}

// After squares change: update their lines, cross off the rest of any line
// that's now complete (if that's switched on), and say which lines just got
// finished. full0 says which lines were complete before (a drag updates them
// as it goes). Returns the extra squares crossed, for Undo.
function linesChanged(cells, full0 = null) {
  const touched = { row: new Set(), col: new Set() };
  for (const i of cells) { touched.row.add((i / cols) | 0); touched.col.add(i % cols); }
  const extra = [];
  let finishedLine = false;
  for (const kind of ['row', 'col']) {
    for (const index of touched[kind]) {
      const was = full0 ? full0[kind][index] : lines[kind][index].full;
      refreshLines(kind, index);
      if (!lines[kind][index].full || was) continue;
      finishedLine = true;
      flashes.push({ kind, index, at: performance.now() });
      if (!settings.nonogramAutoCross) continue;
      for (const j of lineCells(kind, index)) {
        if (marks[j] !== BLANK) continue;
        extra.push([j, BLANK]);
        marks[j] = CROSSED;
      }
    }
  }
  // Squares crossed off can finish other lines too.
  if (extra.length) {
    for (const [j] of extra) {
      for (const [kind, index] of [['row', (j / cols) | 0], ['col', j % cols]]) {
        const was = lines[kind][index].full;
        refreshLines(kind, index);
        if (lines[kind][index].full && !was) flashes.push({ kind, index, at: performance.now() });
      }
    }
  }
  return { extra, finishedLine };
}

// ---- marking squares -----------------------------------------------------------------

let sfxAt = 0, hapticAt = 0;

// A stroke: a tap, or a drag along a row or column. What it does is set by
// the first square: from a blank square it fills (or crosses out) blank
// squares; from a marked square it clears squares marked the same way. Only
// squares like the first one change, so dragging over crosses doesn't wipe
// them.
function beginStroke(press) {
  const first = marks[press.cell];
  if (settled(first)) {
    sfx('nope');
    say(first === WRONG_FILL ? 'That square is empty: it was a mistake, so it’s been settled.' : 'That square is filled: it was a mistake, so it’s been settled.');
    gesture = { kind: 'done' };
    return false;
  }
  const tool = press.cross ? CROSSED : FILLED;
  hintInfo = null;
  gesture = {
    kind: 'stroke', id: press.id, x0: press.x0, y0: press.y0, moved: !!press.moved,
    start: press.cell, from: first, to: first === BLANK ? tool : BLANK,
    axis: null, end: press.cell, before: new Map(), stopped: false, changed: false,
    full0: { row: lines.row.map((l) => l.full), col: lines.col.map((l) => l.full) },
  };
  extendStroke(press.cell);
  return true;
}

function extendStroke(end) {
  const st = gesture;
  if (!st || st.kind !== 'stroke' || st.stopped || end < 0) return;
  const sr = (st.start / cols) | 0, sc = st.start % cols;
  let er = (end / cols) | 0, ec = end % cols;
  // The way the finger has moved since it went down picks row or column.
  if (!st.axis && end !== st.start) {
    const dx = lastPoint ? Math.abs(lastPoint.x - st.x0) : Math.abs(ec - sc), dy = lastPoint ? Math.abs(lastPoint.y - st.y0) : Math.abs(er - sr);
    st.axis = dx >= dy ? 'row' : 'col';
  }
  if (st.axis === 'row') er = sr;
  else if (st.axis === 'col') ec = sc;
  const len = Math.max(Math.abs(er - sr), Math.abs(ec - sc));
  const dr = Math.sign(er - sr), dc = Math.sign(ec - sc);
  const want = [];
  for (let k = 0; k <= len; k++) want.push((sr + dr * k) * cols + (sc + dc * k));
  // Squares the finger has moved back off go back to how they were.
  const keep = new Set(want);
  const changed = [];
  for (const [i, old] of st.before) {
    if (keep.has(i) || settled(marks[i])) continue;
    marks[i] = old;
    st.before.delete(i);
    changed.push(i);
  }
  for (const i of want) {
    if (st.before.has(i) || marks[i] !== st.from) continue;
    let next = st.to;
    if (settings.nonogramMistakes && next === FILLED && !puzzle.solution[i]) next = WRONG_FILL;
    if (settings.nonogramMistakes && next === CROSSED && puzzle.solution[i]) next = WRONG_CROSS;
    st.before.set(i, marks[i]);
    marks[i] = next;
    st.changed = true;
    changed.push(i);
    if (settled(next)) {
      // A mistake ends the stroke there.
      mistakes++;
      st.stopped = true;
      st.end = i;
      wrongAt = { cell: i, at: performance.now() };
      sfx('wrong');
      haptic();
      updateHud();
      break;
    }
    const now = performance.now();
    if (now - sfxAt > 45) { sfx(next === FILLED ? 'fill' : next === CROSSED ? 'cross' : 'tap'); sfxAt = now; }
    if (next === FILLED && now - hapticAt > 70) { haptic(); hapticAt = now; }
  }
  if (!st.stopped) st.end = want[want.length - 1];
  for (const i of changed) {
    refreshLines('row', (i / cols) | 0);
    refreshLines('col', i % cols);
  }
  requestDraw();
}

function commitStroke() {
  const st = gesture;
  gesture = null;
  if (!st || st.kind !== 'stroke' || !st.changed) return;
  const step = [...st.before];
  const { extra, finishedLine } = linesChanged(step.map(([i]) => i), st.full0);
  undoStack.push(step.concat(extra));
  if (finishedLine && !isSolved()) setTimeout(() => sfx('chime'), 40);
  afterChange();
}

// Put a stroke back as if it never happened (a long-press turned into a pinch).
function cancelStroke() {
  const st = gesture;
  if (!st || st.kind !== 'stroke') return;
  for (const [i, old] of st.before) if (!settled(marks[i])) marks[i] = old;
  refreshLines();
  gesture = null;
}

function afterChange() {
  if (isSolved()) return win();
  updateHud();
  savePlay();
  requestDraw();
}

function isSolved() {
  for (let i = 0; i < N; i++) if (isFilled(marks[i]) !== !!puzzle.solution[i]) return false;
  return true;
}

function undo() {
  if (finished || !undoStack.length) return;
  const step = undoStack.pop();
  for (let k = step.length - 1; k >= 0; k--) marks[step[k][0]] = step[k][1];
  refreshLines();
  hintInfo = null;
  sfx('tap');
  updateHud();
  savePlay();
  requestDraw();
}

function toggleCross() {
  crossMode = !crossMode;
  sfx('tap');
  updateHud();
}

// A message that isn't about any square: in its usual place.
function say(msg, ms) {
  const el = $('toast');
  el.style.top = el.style.bottom = '';
  toast(msg, ms);
}

// A hint's message goes just above or below the square it marks (where the
// view is heading, if it's moving), so it never covers that square or the
// clues along its row.
function hintToast(msg, cell, ms = 4400) {
  const el = $('toast');
  const v = anim ? anim.to : view;
  const top = v.oy + ((cell / cols) | 0) * v.s, bottom = top + v.s;
  if (top + v.s / 2 > area.y + area.h / 2) {
    el.style.top = 'auto';
    el.style.bottom = `${Math.round(Math.min(H - 70, H - top + 10))}px`;
  } else {
    el.style.bottom = 'auto';
    el.style.top = `${Math.round(Math.min(H - 70, bottom + 10))}px`;
  }
  toast(msg, ms);
}

function hint() {
  if (finished || !puzzle || ui.isOpen()) return;
  // A wrong mark gets taken off first (only possible with mistakes hidden).
  for (let i = 0; i < N; i++) {
    const wrongFill = marks[i] === FILLED && !puzzle.solution[i], wrongCross = marks[i] === CROSSED && puzzle.solution[i];
    if (!wrongFill && !wrongCross) continue;
    const before = marks[i];
    marks[i] = BLANK;
    const { extra, finishedLine } = linesChanged([i]);
    undoStack.push([[i, before], ...extra]);
    hints++;
    hintInfo = { cell: i, kind: null, at: performance.now() };
    show(i);
    hintToast(wrongFill ? 'That square shouldn’t be filled, so it’s been cleared.' : 'That square shouldn’t be crossed out, so the cross is gone.', i, 3200);
    sfx('hint');
    if (finishedLine && !isSolved()) setTimeout(() => sfx('chime'), 300);
    afterChange();
    return;
  }
  const step = nextStep(puzzle, Uint8Array.from(marks, knownOf));
  if (!step) return;
  const i = step.cell;
  const before = marks[i];
  marks[i] = step.value === FILL ? FILLED : CROSSED;
  const { extra, finishedLine } = linesChanged([i]);
  undoStack.push([[i, before], ...extra]);
  hints++;
  hintInfo = { cell: i, kind: step.kind, index: step.index, at: performance.now() };
  show(i);
  hintToast(step.why, i);
  sfx('hint');
  if (finishedLine && !isSolved()) setTimeout(() => sfx('chime'), 300);
  afterChange();
}

function updateHud() {
  $('timer').textContent = clock(time);
  $('undoBtn').disabled = finished || !undoStack.length;
  $('markBtn').classList.toggle('on', crossMode);
  $('markLabel').textContent = crossMode ? 'Cross' : 'Fill';
  $('markIco').innerHTML = crossMode
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
    : '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="currentColor"/></svg>';
  $('viewBtn').hidden = !zoomable();
}

// ---- winning ---------------------------------------------------------------------------

const REVEAL_STEP = 26, REVEAL_CELL = 360; // ms between diagonals, and per square

function win() {
  finished = true;
  gesture = null;
  hover = -1;
  hintInfo = null;
  const run = save.runs[mode];
  // Each number counts once, however many times it's solved.
  if (!run.won.includes(puzzle.n)) {
    run.won.push(puzzle.n);
    run.solved++;
  }
  run.kept = run.kept.filter((q) => q.n !== puzzle.n);
  const best = run.best === null || time < run.best;
  if (best) run.best = time;
  run.n = Math.max(run.n, puzzle.n + 1);
  run.play = null;
  writeSave();
  updateHud();
  $('toast').classList.remove('show');
  // Step back to see the whole picture, then colour it in.
  if (zoomable() && view.s > fitS * 1.01) animateTo(fitted());
  revealAt = performance.now() + 250;
  const sweep = 250 + (rows + cols) * REVEAL_STEP + REVEAL_CELL;
  sfx('cheer');
  requestDraw();
  const token = playToken;
  setTimeout(() => { if (token === playToken) { sfx('win'); haptic(); confetti(); } }, sweep - 150);
  setTimeout(() => {
    if (token !== playToken) return;
    ui.show(`<h2>${MODE_NAME[mode]} ${puzzle.n} solved!</h2>
      <img class="pic" src="${pictureUrl()}" alt="The finished picture">
      <p class="pic-name">${puzzle.title}</p>
      <div class="stats"><div><b>${clock(time)}</b><span>Time</span></div><div><b>${mistakes}</b><span>Mistakes</span></div><div><b>${hints}</b><span>Hints</span></div></div>
      <p class="best">${best ? 'A new best time!' : `Best time: ${clock(run.best)}`}</p>
      <div class="actions"><button class="btn btn-primary" data-action="next">Next puzzle</button></div>`);
  }, sweep + 700);
}

function pictureUrl() {
  const c = document.createElement('canvas');
  const k = Math.max(4, Math.ceil(132 / Math.max(cols, rows)));
  c.width = cols * k;
  c.height = rows * k;
  const p = c.getContext('2d');
  for (let i = 0; i < N; i++) {
    p.fillStyle = puzzle.solution[i] ? puzzle.fg[i] : puzzle.bg[i];
    p.fillRect((i % cols) * k, ((i / cols) | 0) * k, k, k);
  }
  return c.toDataURL();
}

// ---- view: where the grid sits, and how big a square is --------------------------------

let W = 0, H = 0, dpr = 1;
let area = { x: 0, y: 0, w: 0, h: 0 };
let view = { ox: 0, oy: 0, s: 20 };
let fitS = 20;
let anim = null;
const MAX_S = 46, COMFY = 30;

// The clue numbers, sized to go with squares of size s.
function metricsFor(s) {
  const f = Math.max(7.5, Math.min(17, s * 0.56));
  const gap = f * 0.38;
  const numW = (v) => (v >= 10 ? f * 1.22 : f * 0.7);
  let stripW = 0, deep = 1;
  for (const clue of puzzle.rowClues) {
    const list = clue.length ? clue : [0];
    stripW = Math.max(stripW, list.reduce((sum, v) => sum + numW(v) + gap, 0));
  }
  for (const clue of puzzle.colClues) deep = Math.max(deep, clue.length || 1);
  const lineH = f * 1.12;
  return { f, gap, numW, lineH, stripW: stripW + f * 0.45, stripH: deep * lineH + f * 0.5 };
}

function fitScale() {
  let s = Math.min(area.w / cols, area.h / rows);
  for (let k = 0; k < 8; k++) {
    const m = metricsFor(s);
    s = Math.min((area.w - m.stripW) / cols, (area.h - m.stripH) / rows, MAX_S);
  }
  return Math.max(4, s);
}

const zoomable = () => puzzle && fitS < COMFY * 0.92;
const maxS = () => Math.max(fitS, MAX_S);

function layout(reset = false, kept = null) {
  W = innerWidth;
  H = innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  if (!puzzle) return;
  const centre = reset ? null : { fx: (area.x + area.w / 2 - view.ox) / view.s, fy: (area.y + area.h / 2 - view.oy) / view.s, s: view.s };
  const wasFitted = !reset && view.s <= fitS * 1.01;
  const top = $('topbar').getBoundingClientRect().bottom + 12;
  const bottom = $('tools').getBoundingClientRect().top - 12;
  area = { x: 11, y: top, w: W - 22, h: bottom - top };
  fitS = fitScale();
  anim = null;
  if (reset && kept && zoomable()) view = centredOn(kept.fx, kept.fy, Math.max(fitS, Math.min(maxS(), kept.s)));
  else if (reset) {
    // Big grids start zoomed in at the top left, where you'd start reading.
    view = zoomable() && fitS < 14 ? centredOn(0, 0, Math.min(maxS(), 28)) : fitted();
  } else if (!zoomable() || wasFitted) view = fitted();
  else view = centredOn(centre.fx, centre.fy, Math.max(fitS, Math.min(maxS(), centre.s)));
  updateHud();
  requestDraw();
}

function fitted() {
  const m = metricsFor(fitS);
  const v = { s: fitS, ox: 0, oy: 0 };
  v.ox = area.x + (area.w - m.stripW - cols * fitS) / 2 + m.stripW;
  v.oy = area.y + (area.h - m.stripH - rows * fitS) / 2 + m.stripH;
  return v;
}

// Grid point (fx, fy), in squares, in the middle of the view.
function centredOn(fx, fy, s) {
  const v = { s, ox: area.x + area.w / 2 - fx * s, oy: area.y + area.h / 2 - fy * s };
  clampView(v);
  return v;
}

// Keep the grid in sight, with the clues stuck to the edges when zoomed in.
function clampView(v) {
  const m = metricsFor(v.s);
  const gw = v.s * cols, gh = v.s * rows;
  if (gw + m.stripW <= area.w) v.ox = area.x + (area.w - m.stripW - gw) / 2 + m.stripW;
  else v.ox = Math.min(area.x + m.stripW, Math.max(area.x + area.w - gw, v.ox));
  if (gh + m.stripH <= area.h) v.oy = area.y + (area.h - m.stripH - gh) / 2 + m.stripH;
  else v.oy = Math.min(area.y + m.stripH, Math.max(area.y + area.h - gh, v.oy));
}

function zoomAt(s, x, y) {
  if (!zoomable()) return;
  s = Math.max(fitS, Math.min(maxS(), s));
  const k = s / view.s;
  view = { s, ox: x - (x - view.ox) * k, oy: y - (y - view.oy) * k };
  clampView(view);
  anim = null;
  requestDraw();
}

function animateTo(to) {
  anim = { from: { ...view }, to, start: performance.now() };
  requestDraw();
}

// Bring square i into view: scroll to it if it's off screen, and zoom in if
// the squares are too small to see properly.
function show(i) {
  if (!zoomable()) return;
  const r = (i / cols) | 0, c = i % cols;
  const m = metricsFor(view.s);
  const x = view.ox + (c + 0.5) * view.s, y = view.oy + (r + 0.5) * view.s;
  const left = Math.max(area.x, view.ox - m.stripW) + m.stripW, topY = Math.max(area.y, view.oy - m.stripH) + m.stripH;
  const inside = x > left + view.s / 2 && x < area.x + area.w - view.s / 2 && y > topY + view.s / 2 && y < area.y + area.h - view.s / 2;
  const small = view.s < 14;
  if (inside && !small) return;
  const s = small ? Math.min(maxS(), 26) : view.s;
  const mm = metricsFor(s);
  const v = { s, ox: area.x + mm.stripW + (area.w - mm.stripW) / 2 - (c + 0.5) * s, oy: area.y + mm.stripH + (area.h - mm.stripH) / 2 - (r + 0.5) * s };
  clampView(v);
  animateTo(v);
}

// The square at a point, or -1 if there's no square on show there (off the
// grid, on the clues, or past the edge of the board, where a zoomed-in grid
// carries on out of sight). With clamp, the nearest square on show instead.
function cellAt(x, y, clamp = false) {
  const m = metricsFor(view.s);
  const left = Math.max(area.x, view.ox - m.stripW) + m.stripW, top = Math.max(area.y, view.oy - m.stripH) + m.stripH;
  const right = Math.min(area.x + area.w, view.ox + cols * view.s), bottom = Math.min(area.y + area.h, view.oy + rows * view.s);
  if (clamp) {
    x = Math.max(left + 0.5, Math.min(right - 0.5, x));
    y = Math.max(top + 0.5, Math.min(bottom - 0.5, y));
  } else if (x < left || y < top || x >= right || y >= bottom) return -1;
  const c = Math.floor((x - view.ox) / view.s), r = Math.floor((y - view.oy) / view.s);
  if (c < 0 || r < 0 || c >= cols || r >= rows) return clamp ? Math.max(0, Math.min(rows - 1, r)) * cols + Math.max(0, Math.min(cols - 1, c)) : -1;
  return r * cols + c;
}

// ---- touch and mouse ---------------------------------------------------------------------

const pointers = new Map();
let gesture = null;
let pressTimer = 0;
let hover = -1; // the square under the finger or mouse: its row and column light up
let lastPoint = null;
let wrongAt = null;

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!puzzle || ui.isOpen()) return;
  try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported */ }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    clearTimeout(pressTimer);
    lastPoint = { x: e.clientX, y: e.clientY };
    const cell = finished ? -1 : cellAt(e.clientX, e.clientY);
    const pan = e.pointerType === 'mouse' && (e.button === 1 || (e.button === 0 && e.shiftKey));
    if (pan || cell < 0) {
      // Dragging on the clues (or with Shift) moves the view.
      gesture = { kind: 'pan' };
      return;
    }
    gesture = { kind: 'press', id: e.pointerId, cell, cross: crossMode || e.button === 2, x0: e.clientX, y0: e.clientY, moved: false };
    hover = cell;
    if (!gesture.cross && settings.nonogramLongPress && e.pointerType !== 'mouse') {
      const press = gesture;
      pressTimer = setTimeout(() => {
        if (gesture !== press) return;
        press.cross = true;
        haptic();
        beginStroke(press);
      }, 400);
    }
    requestDraw();
  } else if (pointers.size === 2) {
    // A second finger: pinch to zoom, unless a drag is already under way
    // (then it's left out, and the drag carries on with the first finger).
    if (gesture && gesture.kind === 'stroke' && gesture.axis) return;
    clearTimeout(pressTimer);
    if (gesture && gesture.kind === 'stroke') cancelStroke();
    const [a, b] = [...pointers.values()];
    gesture = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), s0: view.s, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, ox: view.ox, oy: view.oy };
    hover = -1;
    requestDraw();
  }
});

canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) {
    // A mouse just moving over the grid lights up its row and column.
    if (e.pointerType === 'mouse' && puzzle && !finished && !ui.isOpen()) {
      const c = cellAt(e.clientX, e.clientY);
      if (c !== hover) { hover = c; requestDraw(); }
    }
    return;
  }
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (!gesture) return;
  const drawing = gesture.kind === 'press' || gesture.kind === 'stroke';
  // Only the finger that started a drag moves it.
  if (drawing && gesture.id !== e.pointerId) return;
  if (drawing) {
    lastPoint = { x: e.clientX, y: e.clientY };
    // A finger that has moved isn't long-pressing.
    if (!gesture.moved && Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > 6) {
      gesture.moved = true;
      clearTimeout(pressTimer);
    }
  }
  if (gesture.kind === 'press') {
    const c = cellAt(e.clientX, e.clientY, true);
    if (c !== gesture.cell && gesture.moved && beginStroke(gesture)) extendStroke(c);
  } else if (gesture.kind === 'stroke') {
    extendStroke(cellAt(e.clientX, e.clientY, true));
    hover = gesture ? gesture.end : -1;
  } else if (gesture.kind === 'pan') {
    if (!zoomable()) return;
    view.ox += dx;
    view.oy += dy;
    clampView(view);
    anim = null;
    requestDraw();
  } else if (gesture.kind === 'pinch' && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (!zoomable()) return;
    const s = Math.max(fitS, Math.min(maxS(), (gesture.s0 * d) / Math.max(1, gesture.d0)));
    const k = s / gesture.s0;
    view = { s, ox: mx - (gesture.mx - gesture.ox) * k, oy: my - (gesture.my - gesture.oy) * k };
    clampView(view);
    anim = null;
    requestDraw();
  }
});

function endPointer(e, cancelled) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  const drawing = gesture && (gesture.kind === 'press' || gesture.kind === 'stroke');
  if (drawing && gesture.id === e.pointerId) {
    // The finger that owns the drag lifting ends it.
    clearTimeout(pressTimer);
    if (gesture.kind === 'press') { if (!cancelled && beginStroke(gesture)) commitStroke(); }
    else commitStroke();
    gesture = pointers.size ? { kind: 'done' } : null;
    if (e.pointerType !== 'mouse') hover = -1;
    savePlay();
  } else if (drawing) {
    // Another finger lifting: the drag carries on.
  } else if (pointers.size === 0) {
    gesture = null;
    if (e.pointerType !== 'mouse') hover = -1;
    savePlay();
  } else if (gesture && gesture.kind === 'pinch') gesture = { kind: 'done' };
  requestDraw();
}
canvas.addEventListener('pointerup', (e) => endPointer(e, false));
canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
canvas.addEventListener('pointerleave', (e) => {
  if (e.pointerType === 'mouse' && !pointers.size && hover >= 0) { hover = -1; requestDraw(); }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (puzzle) zoomAt(view.s * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
}, { passive: false });

// ---- drawing ------------------------------------------------------------------------------

const INK = '#2f3656';
const FONT = 'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", sans-serif';
let raf = 0;
let colours = null; // the picture's colours as [r, g, b], for the reveal

function requestDraw() {
  if (!raf) raf = requestAnimationFrame(frame);
}

function frame(now) {
  raf = 0;
  if (draw(now)) requestDraw();
}

const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const mixRgb = (a, b, k) => `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)}, ${Math.round(a[1] + (b[1] - a[1]) * k)}, ${Math.round(a[2] + (b[2] - a[2]) * k)})`;
const WHITE = [255, 255, 255], INK_RGB = rgb(INK);

// While dragging near the edge of a zoomed-in grid, it scrolls along the
// line being drawn. (Not for a finger held still, like a long-press.)
function edgeScroll() {
  if (!gesture || gesture.kind !== 'stroke' || !gesture.axis || !gesture.moved || gesture.stopped || !lastPoint || !zoomable()) return false;
  const m = metricsFor(view.s);
  const left = Math.max(area.x, view.ox - m.stripW) + m.stripW, topY = Math.max(area.y, view.oy - m.stripH) + m.stripH;
  const edge = 30, speed = 7;
  let dx = 0, dy = 0;
  if (gesture.axis === 'row') {
    if (lastPoint.x < left + edge) dx = speed;
    else if (lastPoint.x > area.x + area.w - edge) dx = -speed;
  } else if (lastPoint.y < topY + edge) dy = speed;
  else if (lastPoint.y > area.y + area.h - edge) dy = -speed;
  if (!dx && !dy) return false;
  const before = { ...view };
  view.ox += dx;
  view.oy += dy;
  clampView(view);
  if (view.ox === before.ox && view.oy === before.oy) return false;
  extendStroke(cellAt(lastPoint.x, lastPoint.y, true));
  return true;
}

function draw(now) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  if (!puzzle) return false;
  let moving = false;
  if (anim) {
    const k = Math.min(1, (now - anim.start) / 300), e = k * k * (3 - 2 * k);
    view = {
      s: anim.from.s + (anim.to.s - anim.from.s) * e,
      ox: anim.from.ox + (anim.to.ox - anim.from.ox) * e,
      oy: anim.from.oy + (anim.to.oy - anim.from.oy) * e,
    };
    if (k >= 1) anim = null;
    moving = true;
  }
  if (edgeScroll()) moving = true;
  const { s } = view;
  const m = metricsFor(s);
  // Squares' edges land on whole device pixels, so the lines stay crisp.
  const X = (c) => Math.round((view.ox + c * s) * dpr) / dpr;
  const Y = (r) => Math.round((view.oy + r * s) * dpr) / dpr;
  const stripX = Math.max(area.x, view.ox - m.stripW), stripY = Math.max(area.y, view.oy - m.stripH);
  const gx0 = stripX + m.stripW, gy0 = stripY + m.stripH; // where the visible grid starts
  const bx0 = stripX - 5, by0 = stripY - 5;
  const bx1 = Math.min(area.x + area.w + 4, view.ox + cols * s + 5), by1 = Math.min(area.y + area.h + 4, view.oy + rows * s + 5);
  const reveal = finished ? Math.max(0, now - revealAt) : -1;
  const revealDone = reveal >= (rows + cols) * REVEAL_STEP + REVEAL_CELL;
  if (finished && !revealDone) moving = true;
  if (finished && !colours) colours = { fg: puzzle.fg.map((c) => c && rgb(c)), bg: puzzle.bg.map((c) => c && rgb(c)) };

  // The board.
  g.save();
  g.shadowColor = 'rgba(59, 71, 196, 0.18)';
  g.shadowBlur = 24;
  g.shadowOffsetY = 8;
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.roundRect(bx0, by0, bx1 - bx0, by1 - by0, 16);
  g.fill();
  g.restore();
  g.save();
  g.beginPath();
  g.roundRect(bx0, by0, bx1 - bx0, by1 - by0, 16);
  g.clip();

  const c0 = Math.max(0, Math.floor((gx0 - view.ox) / s)), c1 = Math.min(cols - 1, Math.floor((bx1 - view.ox) / s));
  const r0 = Math.max(0, Math.floor((gy0 - view.oy) / s)), r1 = Math.min(rows - 1, Math.floor((by1 - view.oy) / s));
  const hr = hover >= 0 ? (hover / cols) | 0 : -1, hc = hover >= 0 ? hover % cols : -1;
  const hintLine = hintInfo && hintInfo.kind && now - hintInfo.at < 6000 ? hintInfo : null;

  // Squares.
  g.save();
  g.beginPath();
  g.rect(gx0, gy0, bx1 - gx0, by1 - gy0);
  g.clip();
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const i = r * cols + c, mk = marks[i];
      const x = X(c), y = Y(r), w = X(c + 1) - x, h = Y(r + 1) - y;
      let k = -1;
      if (finished) {
        const t = reveal - (r + c) * REVEAL_STEP;
        k = t <= 0 ? 0 : Math.min(1, t / REVEAL_CELL);
      }
      // Background, lit up along the row and column under the finger.
      let bg = '#ffffff';
      if (k < 0) {
        const lit = (r === hr) + (c === hc);
        if (lit === 2) bg = '#dbe4ff';
        else if (lit === 1) bg = '#e9efff';
        if (hintLine && ((hintLine.kind === 'row' && r === hintLine.index) || (hintLine.kind === 'col' && c === hintLine.index))) bg = '#ffe4f1';
        if (mk === WRONG_FILL) bg = '#ffe3e6';
        g.fillStyle = bg;
      } else {
        g.fillStyle = puzzle.solution[i] ? '#ffffff' : mixRgb(WHITE, colours.bg[i], k);
      }
      g.fillRect(x, y, w, h);
      if (isFilled(mk)) {
        const ins = k < 0 ? Math.max(1, s * 0.07) : Math.max(1, s * 0.07) * (1 - k);
        g.fillStyle = k < 0 ? INK : mixRgb(INK_RGB, colours.fg[i], k);
        g.beginPath();
        g.roundRect(x + ins, y + ins, w - 2 * ins, h - 2 * ins, s * 0.16 * (k < 0 ? 1 : 1 - k));
        g.fill();
        if (k < 0 && s >= 12) {
          g.fillStyle = 'rgba(255, 255, 255, 0.13)';
          g.fillRect(x + ins * 1.8, y + ins * 1.6, w - ins * 3.6, (h - 2 * ins) * 0.3);
        }
        if (mk === WRONG_CROSS && k < 0) {
          // A red corner: this one was crossed out by mistake.
          g.fillStyle = '#ff4d5e';
          g.beginPath();
          g.moveTo(x + w - ins, y + ins);
          g.lineTo(x + w - ins - s * 0.36, y + ins);
          g.lineTo(x + w - ins, y + ins + s * 0.36);
          g.closePath();
          g.fill();
        }
      } else if (isOut(mk) && k < 1) {
        const a = k < 0 ? 1 : 1 - k;
        g.strokeStyle = mk === WRONG_FILL ? `rgba(224, 48, 63, ${a})` : `rgba(150, 160, 195, ${a})`;
        g.lineWidth = Math.max(1.2, s * (mk === WRONG_FILL ? 0.1 : 0.075));
        g.lineCap = 'round';
        const p = s * 0.3;
        g.beginPath();
        g.moveTo(x + p, y + p);
        g.lineTo(x + w - p, y + h - p);
        g.moveTo(x + w - p, y + p);
        g.lineTo(x + p, y + h - p);
        g.stroke();
      }
    }
  }
  // Lines that just got finished glow for a moment.
  flashes = flashes.filter((f) => now - f.at < 650);
  for (const f of flashes) {
    moving = true;
    const a = 0.55 * (1 - (now - f.at) / 650);
    g.fillStyle = `rgba(255, 214, 102, ${a})`;
    if (f.kind === 'row') g.fillRect(X(0), Y(f.index), X(cols) - X(0), Y(f.index + 1) - Y(f.index));
    else g.fillRect(X(f.index), Y(0), X(f.index + 1) - X(f.index), Y(rows) - Y(0));
  }
  // Grid lines: thin ones, a heavier one every five squares, fading away as
  // the finished picture colours in.
  const lineAlpha = finished ? Math.max(0, 1 - reveal / ((rows + cols) * REVEAL_STEP * 0.8)) : 1;
  if (lineAlpha > 0) {
    g.globalAlpha = lineAlpha;
    g.fillStyle = '#d6dcec';
    for (let c = c0; c <= c1 + 1; c++) if (c % 5) g.fillRect(X(c) - 0.5, Y(r0), 1, Y(r1 + 1) - Y(r0));
    for (let r = r0; r <= r1 + 1; r++) if (r % 5) g.fillRect(X(c0), Y(r) - 0.5, X(c1 + 1) - X(c0), 1);
    const heavy = Math.max(1.5, Math.min(2.5, s * 0.09));
    g.fillStyle = '#7c86a8';
    for (let c = c0; c <= c1 + 1; c++) if (c % 5 === 0 && c > 0 && c < cols) g.fillRect(X(c) - heavy / 2, Y(r0), heavy, Y(r1 + 1) - Y(r0));
    for (let r = r0; r <= r1 + 1; r++) if (r % 5 === 0 && r > 0 && r < rows) g.fillRect(X(c0), Y(r) - heavy / 2, X(c1 + 1) - X(c0), heavy);
    g.globalAlpha = 1;
  }
  g.strokeStyle = '#3a4266';
  g.lineWidth = 2.5;
  g.strokeRect(X(0), Y(0), X(cols) - X(0), Y(rows) - Y(0));
  // The hinted square pulses.
  if (hintInfo && now - hintInfo.at < 6000) {
    moving = true;
    const pulse = 0.5 + 0.5 * Math.sin((now - hintInfo.at) / 160);
    const r = (hintInfo.cell / cols) | 0, c = hintInfo.cell % cols;
    g.strokeStyle = `rgba(255, 56, 150, ${0.5 + 0.45 * pulse})`;
    g.lineWidth = Math.max(2.5, s * 0.13);
    g.beginPath();
    g.roundRect(X(c) + 1, Y(r) + 1, X(c + 1) - X(c) - 2, Y(r + 1) - Y(r) - 2, s * 0.18);
    g.stroke();
  } else if (hintInfo) hintInfo = null;
  // A mistake shakes its square.
  if (wrongAt && now - wrongAt.at < 500) {
    moving = true;
    const t = (now - wrongAt.at) / 500;
    const r = (wrongAt.cell / cols) | 0, c = wrongAt.cell % cols;
    g.strokeStyle = `rgba(224, 48, 63, ${1 - t})`;
    g.lineWidth = Math.max(2, s * 0.1);
    const d = Math.sin(t * Math.PI * 6) * (1 - t) * s * 0.12;
    g.strokeRect(X(c) + 1 + d, Y(r) + 1, X(c + 1) - X(c) - 2, Y(r + 1) - Y(r) - 2);
  }
  g.restore();

  drawClues(m, X, Y, stripX, stripY, r0, r1, c0, c1, hr, hc, hintLine, finished ? Math.min(1, reveal / 600) : 0);
  drawCorner(m, stripX, stripY, reveal);
  g.restore();

  // While dragging a run, a bubble says how long it is.
  if (gesture && gesture.kind === 'stroke' && gesture.axis && lastPoint && !finished) {
    const sr = (gesture.start / cols) | 0, sc = gesture.start % cols, er = (gesture.end / cols) | 0, ec = gesture.end % cols;
    const len = Math.max(Math.abs(er - sr), Math.abs(ec - sc)) + 1;
    const text = String(len), bw = 26 + (len >= 10 ? 9 : 0), bh = 26;
    const bx = Math.max(6, Math.min(W - bw - 6, lastPoint.x - bw / 2)), by = Math.max(6, lastPoint.y - 74);
    g.fillStyle = 'rgba(29, 35, 64, 0.88)';
    g.beginPath();
    g.roundRect(bx, by, bw, bh, 13);
    g.fill();
    g.fillStyle = '#fff';
    g.font = `900 15px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, bx + bw / 2, by + bh / 2 + 1);
  }
  return moving;
}

// The clue numbers: down the left for rows, along the top for columns. When
// zoomed in they stick to the edges of the view.
function drawClues(m, X, Y, stripX, stripY, r0, r1, c0, c1, hr, hc, hintLine, fade) {
  const { f, gap, numW, lineH, stripW, stripH } = m;
  g.font = `800 ${Math.round(f * 10) / 10}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lit = (kind, i) => (hintLine && hintLine.kind === kind && hintLine.index === i ? '#ffd9ec' : (kind === 'row' ? i === hr : i === hc) ? '#dfe7ff' : null);
  const colour = (state, j) => (state.bad ? '#e0303f' : state.done[j] || state.full ? '#b5bdd6' : '#1d2340');

  // Rows.
  g.save();
  g.beginPath();
  g.rect(stripX, stripY + stripH, stripW, area.y + area.h + 10 - stripY - stripH);
  g.clip();
  g.fillStyle = '#f2f5fd';
  g.fillRect(stripX, Y(r0), stripW, Y(r1 + 1) - Y(r0));
  for (let r = r0; r <= r1; r++) {
    const bg = lit('row', r);
    if (bg) { g.fillStyle = bg; g.fillRect(stripX, Y(r), stripW, Y(r + 1) - Y(r)); }
    if (r % 5 === 0 && r > 0) { g.fillStyle = '#c3cae0'; g.fillRect(stripX, Y(r) - 0.75, stripW, 1.5); }
  }
  g.globalAlpha = 1 - fade * 0.6;
  for (let r = r0; r <= r1; r++) {
    const clue = puzzle.rowClues[r].length ? puzzle.rowClues[r] : [0];
    const state = lines.row[r];
    let x = stripX + stripW - f * 0.3;
    const y = (Y(r) + Y(r + 1)) / 2 + f * 0.04;
    for (let j = clue.length - 1; j >= 0; j--) {
      const w = numW(clue[j]);
      g.fillStyle = colour(state, j);
      g.fillText(String(clue[j]), x - w / 2, y);
      x -= w + gap;
    }
  }
  g.globalAlpha = 1;
  g.restore();

  // Columns.
  g.save();
  g.beginPath();
  g.rect(stripX + stripW, stripY, area.x + area.w + 10 - stripX - stripW, stripH);
  g.clip();
  g.fillStyle = '#f2f5fd';
  g.fillRect(X(c0), stripY, X(c1 + 1) - X(c0), stripH);
  for (let c = c0; c <= c1; c++) {
    const bg = lit('col', c);
    if (bg) { g.fillStyle = bg; g.fillRect(X(c), stripY, X(c + 1) - X(c), stripH); }
    if (c % 5 === 0 && c > 0) { g.fillStyle = '#c3cae0'; g.fillRect(X(c) - 0.75, stripY, 1.5, stripH); }
  }
  g.globalAlpha = 1 - fade * 0.6;
  for (let c = c0; c <= c1; c++) {
    const clue = puzzle.colClues[c].length ? puzzle.colClues[c] : [0];
    const state = lines.col[c];
    const x = (X(c) + X(c + 1)) / 2;
    let y = stripY + stripH - f * 0.25 - lineH / 2;
    for (let j = clue.length - 1; j >= 0; j--) {
      g.fillStyle = colour(state, j);
      g.fillText(String(clue[j]), x, y + f * 0.04);
      y -= lineH;
    }
  }
  g.globalAlpha = 1;
  g.restore();
  // The edges between the clues and the grid.
  g.fillStyle = '#c3cae0';
  g.fillRect(stripX + stripW - 1, stripY + stripH, 1, Y(r1 + 1) - stripY - stripH);
  g.fillRect(stripX + stripW, stripY + stripH - 1, X(c1 + 1) - stripX - stripW, 1);
}

// The top-left corner shows a little picture of the squares filled so far
// (and, zoomed in, which part of the grid you're looking at).
function drawCorner(m, stripX, stripY, reveal) {
  const { stripW, stripH } = m;
  g.fillStyle = '#ffffff';
  g.fillRect(stripX, stripY, stripW, stripH);
  const pad = 6;
  const k = Math.min((stripW - pad * 2) / cols, (stripH - pad * 2) / rows);
  if (k < 1) return;
  const w = k * cols, h = k * rows;
  const x0 = stripX + (stripW - w) / 2, y0 = stripY + (stripH - h) / 2;
  g.fillStyle = '#eef2fb';
  g.fillRect(x0, y0, w, h);
  for (let i = 0; i < N; i++) {
    const done = finished && reveal > 0;
    if (!isFilled(marks[i]) && !done) continue;
    g.fillStyle = done ? (puzzle.solution[i] ? puzzle.fg[i] : puzzle.bg[i]) : INK;
    g.fillRect(x0 + (i % cols) * k, y0 + ((i / cols) | 0) * k, Math.ceil(k), Math.ceil(k));
  }
  if (zoomable() && view.s > fitS * 1.05 && !finished) {
    const mm = metricsFor(view.s);
    const vx0 = (Math.max(area.x, view.ox - mm.stripW) + mm.stripW - view.ox) / view.s;
    const vy0 = (Math.max(area.y, view.oy - mm.stripH) + mm.stripH - view.oy) / view.s;
    const vx1 = (area.x + area.w - view.ox) / view.s, vy1 = (area.y + area.h - view.oy) / view.s;
    g.strokeStyle = '#ff3896';
    g.lineWidth = 1.5;
    g.strokeRect(x0 + Math.max(0, vx0) * k, y0 + Math.max(0, vy0) * k, (Math.min(cols, vx1) - Math.max(0, vx0)) * k, (Math.min(rows, vy1) - Math.max(0, vy0)) * k);
  }
}

const clock = (t) => (t >= 3600 ? `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}` : `${Math.floor(t / 60)}`) + `:${String(t % 60).padStart(2, '0')}`;

// ---- timer ------------------------------------------------------------------------------

setInterval(() => {
  if (!puzzle || finished || document.hidden || ui.isOpen()) return;
  time++;
  $('timer').textContent = clock(time);
  if (time % 10 === 0) savePlay();
}, 1000);

// ---- cards ------------------------------------------------------------------------------

// A little row of squares for the How to play card. cells: '#' filled,
// 'x' crossed, '.' blank; clue: the numbers in front.
function rowArt(clue, cells, extra = '') {
  let s = `<text x="9" y="30" font-size="12" font-weight="800" fill="#1d2340" text-anchor="middle">${clue}</text>`;
  [...cells].forEach((ch, k) => {
    const x = 18 + k * 9;
    s += `<rect x="${x}" y="19" width="9" height="15" fill="#fff" stroke="#c9d1e8" stroke-width="1"/>`;
    if (ch === '#') s += `<rect x="${x + 1}" y="20.5" width="7" height="12" rx="1.6" fill="${INK}"/>`;
    if (ch === 'x') s += `<path d="M${x + 2.5} 23.5l4 6M${x + 6.5} 23.5l-4 6" stroke="#96a0c3" stroke-width="1.4" stroke-linecap="round"/>`;
  });
  return `<svg viewBox="0 0 64 48">${s}${extra}</svg>`;
}

const HEART_ART = (() => {
  const px = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  const col = ['#ef4d5e', '#ff97a6'];
  let s = '';
  px.forEach((row, r) => [...row].forEach((ch, c) => {
    s += `<rect x="${11 + c * 6}" y="${6 + r * 6}" width="6" height="6" fill="${ch === '#' ? col[r === 1 && c === 1 ? 1 : 0] : '#fff1f3'}"/>`;
  }));
  return `<svg viewBox="0 0 64 48">${s}</svg>`;
})();

function showRules() {
  ui.show(`<h2>How to play</h2>
    <div class="rules">
      <div class="rule">${rowArt('3 1', '###.#')}
        <div><b>The numbers are runs</b><span>Each number is a run of filled squares in that row or column, in order, with at least one gap between runs.</span></div></div>
      <div class="rule">${rowArt('4', '.####', '<path d="M27 42h22" stroke="#ff3896" stroke-width="2.5" stroke-linecap="round"/><path d="M45 38.5l4 3.5-4 3.5" fill="none" stroke="#ff3896" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>')}
        <div><b>Tap or drag to fill</b><span>Drag along a row or column to fill a run in one go. Tap a marked square to clear it.</span></div></div>
      <div class="rule">${rowArt('2', 'xx##x')}
        <div><b>Cross out the empty ones</b><span>Long-press, or switch Fill to Cross, to mark squares you know are empty.</span></div></div>
      <div class="rule">${HEART_ART}
        <div><b>No guessing, ever</b><span>Every puzzle can be worked out line by line, and finishing it shows the picture in colour. Stuck? Hint fills in the next square you can work out, and says why.</span></div></div>
    </div>
    <div class="actions"><button class="btn btn-primary" data-action="close">Got it</button></div>`);
}

function intro() {
  if (!save.seen.rules) {
    save.seen.rules = true;
    writeSave();
    showRules();
  }
}

function showSettings() {
  const tab = (m) => `<button class="seg-btn${m === mode ? ' on' : ''}" data-action="mode" data-mode="${m}">${MODE_NAME[m]}</button>`;
  const run = save.runs[mode], size = SIZES[mode];
  ui.show(`<h2>Settings</h2>
    <div class="seg">${MODES.map(tab).join('')}</div>
    <p class="seg-note tip">${size.cols}×${size.rows} · ${run.solved} solved${run.best !== null ? ` · best ${clock(run.best)}` : ''}${run.kept.length ? ` · also started: ${run.kept.map((q) => q.n).sort((x, y) => x - y).join(', ')}` : ''}</p>
    ${switchRow('Sound', 'sound')}
    ${switchRow('Haptics', 'haptics')}
    ${switchRow('Show mistakes', 'nonogramMistakes')}
    ${switchRow('Cross off finished lines', 'nonogramAutoCross')}
    ${switchRow('Long-press to cross', 'nonogramLongPress')}
    <div class="row">Puzzle <span class="stepper"><button class="btn btn-soft" data-action="num-down" aria-label="Previous">−</button>
      <input id="numInput" type="number" inputmode="numeric" min="1" value="${puzzle ? puzzle.n : run.n}">
      <button class="btn btn-soft" data-action="num-up" aria-label="Next">+</button></span></div>
    <div class="actions">
      <button class="btn btn-primary" data-action="go">Play this puzzle</button>
      <button class="btn btn-soft" data-action="restart">Start this one again</button>
      <button class="btn btn-soft" data-action="rules">How to play</button>
      <button class="btn btn-soft" data-action="close">Close</button>
    </div>`);
}

function switchMode(m) {
  if (!MODES.includes(m) || m === mode) return;
  savePlay();
  mode = m;
  save.mode = m;
  writeSave();
  const run = save.runs[m];
  startPuzzle(run.play ? run.play.n : run.n, true);
}

// Switching mistakes on settles any wrong marks already made (without
// counting them), so what's shown can be trusted from then on.
function settingChanged(key) {
  if (key === 'nonogramMistakes' && settings.nonogramMistakes && puzzle && !finished) {
    let any = false;
    for (let i = 0; i < N; i++) {
      if (marks[i] === FILLED && !puzzle.solution[i]) { marks[i] = WRONG_FILL; any = true; }
      if (marks[i] === CROSSED && puzzle.solution[i]) { marks[i] = WRONG_CROSS; any = true; }
    }
    if (any) undoStack = [];
    refreshLines();
    // Settling stray squares can leave the picture complete.
    if (isSolved()) return win();
  }
  if (puzzle) refreshLines();
  updateHud();
  savePlay();
  requestDraw();
}

const ui = cards({
  next: () => startPuzzle(puzzle.n + 1),
  restart: () => { save.runs[mode].play = null; startPuzzle(puzzle.n, false); },
  rules: showRules,
  mode: (el) => switchMode(el.dataset.mode),
  'num-down': () => { const i = $('numInput'); i.value = Math.max(1, (+i.value || 1) - 1); },
  'num-up': () => { const i = $('numInput'); i.value = (+i.value || 0) + 1; },
  go: () => startPuzzle(+$('numInput').value || 1, true),
  setting: settingChanged,
});

$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });
$('undoBtn').addEventListener('click', undo);
$('hintBtn').addEventListener('click', hint);
$('markBtn').addEventListener('click', toggleCross);
$('viewBtn').addEventListener('click', () => {
  if (!zoomable()) return;
  sfx('tap');
  // Between the whole grid and a close-up of the middle of the view.
  if (view.s > fitS * 1.05) animateTo(fitted());
  else {
    const fx = (area.x + area.w / 2 - view.ox) / view.s, fy = (area.y + area.h / 2 - view.oy) / view.s;
    animateTo(centredOn(fx, fy, Math.min(maxS(), 28)));
  }
});
window.addEventListener('keydown', (e) => {
  if (ui.isOpen() || !puzzle) return;
  if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'u') undo();
  else if (e.key === 'h') hint();
  else if (e.key === 'f' || e.key === 'x') toggleCross();
  else if (e.key === '+' || e.key === '=') zoomAt(view.s * 1.2, area.x + area.w / 2, area.y + area.h / 2);
  else if (e.key === '-') zoomAt(view.s / 1.2, area.x + area.w / 2, area.y + area.h / 2);
  else if (e.key.startsWith('Arrow') && zoomable()) {
    const [dx, dy] = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [1, 0], ArrowRight: [-1, 0] }[e.key];
    view.ox += dx * view.s * 3;
    view.oy += dy * view.s * 3;
    clampView(view);
    requestDraw();
  } else return;
  e.preventDefault();
});

// ---- start ------------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', () => layout(false));
document.addEventListener('visibilitychange', () => { if (document.hidden) savePlay(); });

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.nonogram = {
    startPuzzle, hint, undo, toggleCross, cellAt,
    // Mark square i as the picture has it (or with v: 1 fill, 2 cross), as a tap would.
    mark(i, v) {
      const want = v ?? (puzzle.solution[i] ? FILLED : CROSSED);
      if (marks[i] === want) return;
      gesture = null;
      beginStroke({ cell: i, cross: want === CROSSED });
      commitStroke();
    },
    // Fill in the whole picture but one square, ready for a last tap.
    solveAllBut(left = 1) {
      const todo = [];
      for (let i = 0; i < N; i++) if (puzzle.solution[i] && !isFilled(marks[i])) todo.push(i);
      for (const i of todo.slice(0, Math.max(0, todo.length - left))) marks[i] = FILLED;
      refreshLines();
      requestDraw();
      return todo.slice(-left);
    },
    fit() { anim = null; view = fitted(); requestDraw(); },
    cellCentre(i) {
      return { x: view.ox + ((i % cols) + 0.5) * view.s, y: view.oy + (((i / cols) | 0) + 0.5) * view.s };
    },
    get puzzle() { return puzzle; }, get marks() { return marks; }, get view() { return view; },
    get finished() { return finished; }, get mistakes() { return mistakes; }, get fitS() { return fitS; },
  };
}

const params = new URLSearchParams(location.search);
if (MODES.includes(params.get('mode'))) {
  mode = params.get('mode');
  save.mode = mode;
  writeSave();
}
if (location.search) window.history.replaceState(null, '', location.pathname);
const asked = Number(params.get('n'));
if (asked > 0) startPuzzle(asked, true);
else {
  const run = save.runs[mode];
  startPuzzle(run.play ? run.play.n : run.n, true);
}
