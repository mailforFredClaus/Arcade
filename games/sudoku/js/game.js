// Sudoku: fill the grid so every row, column and box has 1 to 9 once.

import { MODES, makePuzzle, nextPlacement, PEERS, UNITS, rowOf, colOf, boxOf, TECH } from './logic.js';
import { store, settings, sfx, haptic, unlockAudio, lockViewport, registerOffline } from '../../../shared/arcade.js';
import { cards, switchRow, toast, confetti, ICON } from '../../../shared/ui.js';

const $ = (id) => document.getElementById(id);
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = ICON[el.dataset.icon];
$('backBtn').innerHTML = ICON.back;
$('menuBtn').innerHTML = ICON.gear;

if (settings.sudokuMistakes === undefined) settings.sudokuMistakes = true;
if (settings.sudokuAutoNotes === undefined) settings.sudokuAutoNotes = true;

const MODE_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' };
const THEME = { easy: '', medium: 'teal', hard: 'red', expert: 'night' };
const bit = (d) => 1 << (d - 1);

// ---- saved progress ----------------------------------------------------------------

// One run per difficulty: the puzzle number you're up to, how many you've
// solved, your best time, and the puzzle in progress.
const SAVE_KEY = 'sudoku';
const save = (() => {
  const s = store.get(SAVE_KEY, {}) || {};
  const out = { mode: MODES.includes(s.mode) ? s.mode : 'easy', seen: s.seen || {}, runs: s.runs || {} };
  for (const m of MODES) out.runs[m] = Object.assign({ n: 1, solved: 0, best: null, play: null }, out.runs[m]);
  return out;
})();
const writeSave = () => store.set(SAVE_KEY, save);

// ---- the game ------------------------------------------------------------------------

let mode = save.mode;
let puzzle = null; // { mode, n, puzzle, answer, ... }
let values = new Int8Array(81); // what's in each cell (clues included)
let notes = new Uint16Array(81); // pencil marks, one bit per digit
let given = new Uint8Array(81);
let selected = -1;
let notesMode = false;
let undoStack = [];
let time = 0, mistakes = 0, hints = 0;
let finished = false;
let loadToken = 0;

function startPuzzle(n, resume = false) {
  n = Math.max(1, Math.floor(n) || 1);
  ui.close();
  const token = ++loadToken;
  const slow = setTimeout(() => $('loading').classList.remove('hide'), 120);
  // Give the spinner a chance to show before the work starts.
  setTimeout(() => {
    const p = makePuzzle(mode, n);
    if (token !== loadToken) return;
    clearTimeout(slow);
    $('loading').classList.add('hide');
    puzzle = p;
    given = Uint8Array.from(p.puzzle, (d) => (d ? 1 : 0));
    values = Int8Array.from(p.puzzle);
    notes = new Uint16Array(81);
    undoStack = [];
    time = mistakes = hints = 0;
    finished = false;
    selected = -1;
    const play = save.runs[mode].play;
    if (resume && play && play.n === n && play.v === p.v) {
      [...play.values].forEach((ch, i) => { if (!given[i]) values[i] = +ch; });
      (play.notes || []).forEach((m, i) => { notes[i] = m; });
      time = play.time || 0;
      mistakes = play.mistakes || 0;
      hints = play.hints || 0;
    }
    for (const t of ['teal', 'red', 'night']) document.body.classList.toggle(`theme-${t}`, THEME[mode] === t);
    $('levelLabel').textContent = `${MODE_NAME[mode].toUpperCase()} ${n}`;
    for (const c of cellEls) c.classList.remove('wave', 'flash');
    render();
    savePlay();
    intro();
  }, 30);
}

function savePlay() {
  if (!puzzle) return;
  save.runs[mode].play = finished ? null : {
    n: puzzle.n, v: puzzle.v, time, mistakes, hints,
    values: Array.from(values, (d, i) => (given[i] ? 0 : d)).join(''),
    notes: notes.some((m) => m) ? Array.from(notes) : [],
  };
  writeSave();
}

// Every change is a list of cells as they were before, for Undo.
function record(cells) {
  undoStack.push(cells.map((i) => ({ i, v: values[i], n: notes[i] })));
}

const isWrong = (i) => {
  if (!values[i] || given[i]) return false;
  if (settings.sudokuMistakes) return values[i] !== puzzle.answer[i];
  // Without mistake checking, only point out clashes you can see.
  return PEERS[i].some((p) => values[p] === values[i]);
};

function enter(d) {
  if (finished || !puzzle) return;
  if (selected < 0 || given[selected]) {
    // Nothing to write in: show where that number already is.
    highlight = d;
    render();
    return;
  }
  const i = selected;
  if (notesMode) {
    if (values[i]) return;
    record([i]);
    notes[i] ^= bit(d);
    sfx('tap');
  } else if (values[i] === d) {
    record([i]);
    values[i] = 0;
    sfx('tap');
  } else {
    const touched = [i];
    if (settings.sudokuAutoNotes) for (const p of PEERS[i]) if (notes[p] & bit(d)) touched.push(p);
    record(touched);
    values[i] = d;
    notes[i] = 0;
    if (settings.sudokuAutoNotes) for (const p of PEERS[i]) notes[p] &= ~bit(d);
    if (d !== puzzle.answer[i] && settings.sudokuMistakes) {
      mistakes++;
      sfx('wrong');
      haptic();
    } else {
      sfx('write');
      pop(i);
      celebrate(i);
    }
  }
  render();
  savePlay();
  checkDone();
}

function erase() {
  if (finished || selected < 0 || given[selected]) return;
  const i = selected;
  if (!values[i] && !notes[i]) return;
  record([i]);
  if (values[i]) values[i] = 0;
  else notes[i] = 0;
  sfx('tap');
  render();
  savePlay();
}

function undo() {
  if (finished || !undoStack.length) return;
  for (const c of undoStack.pop()) { values[c.i] = c.v; notes[c.i] = c.n; }
  sfx('tap');
  render();
  savePlay();
}

function toggleNotes() {
  notesMode = !notesMode;
  sfx('tap');
  render();
}

function select(i) {
  selected = i;
  highlight = 0;
  render();
}

// A row, column or box just completed: a little flash.
function celebrate(i) {
  let any = false;
  for (const u of [rowOf(i), 9 + colOf(i), 18 + boxOf(i)]) {
    if (!UNITS[u].every((j) => values[j] === puzzle.answer[j])) continue;
    any = true;
    for (const j of UNITS[u]) {
      const el = cellEls[j];
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    }
  }
  if (any && !values.every((d, j) => d === puzzle.answer[j])) setTimeout(() => sfx('chime'), 60);
}

function pop(i) {
  const el = cellEls[i];
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

function checkDone() {
  if (!values.every((d, i) => d === puzzle.answer[i])) return;
  finished = true;
  selected = -1;
  const run = save.runs[mode];
  run.solved++;
  const best = run.best === null || time < run.best;
  if (best) run.best = time;
  run.n = Math.max(run.n, puzzle.n + 1);
  run.play = null;
  writeSave();
  render();
  // A ripple across the grid from the last number placed.
  cellEls.forEach((el, j) => {
    el.style.animationDelay = `${(Math.abs(rowOf(j) - 4) + Math.abs(colOf(j) - 4)) * 45}ms`;
    el.classList.remove('flash');
    el.classList.add('wave');
  });
  setTimeout(() => { sfx('win'); haptic(); confetti(); }, 300);
  setTimeout(() => {
    ui.show(`<h2>${MODE_NAME[mode]} ${puzzle.n} solved!</h2>
      <div class="stats"><div><b>${clock(time)}</b><span>Time</span></div><div><b>${mistakes}</b><span>Mistakes</span></div><div><b>${hints}</b><span>Hints</span></div></div>
      <p class="best">${best ? 'A new best time!' : `Best time: ${clock(run.best)}`}</p>
      <div class="actions"><button class="btn btn-primary" data-action="next">Next puzzle</button></div>`);
  }, 1300);
}

const UNIT_NAME = ['row', 'column', 'box'];

function hint() {
  if (finished || !puzzle) return;
  // A wrong number gets taken out first.
  for (let i = 0; i < 81; i++) {
    if (given[i] || !values[i] || values[i] === puzzle.answer[i]) continue;
    selected = i;
    record([i]);
    values[i] = 0;
    hints++;
    toast('That number wasn’t right, so it’s been taken out.');
    sfx('hint');
    render();
    savePlay();
    return;
  }
  const grid = Int8Array.from(values);
  const next = nextPlacement(grid);
  let i, d, why;
  if (next) {
    ({ cell: i, digit: d } = next);
    if (next.tech === 'nakedSingle') why = `Only ${d} fits here: its row, column and box already have every other number.`;
    else why = `${d} can only go here in its ${UNIT_NAME[Math.floor(next.unit / 9)]}.`;
    if (next.along.length) why = `A tricky one (it takes a ${TECH[next.along[next.along.length - 1]].name}). ${why}`;
  } else {
    // Shouldn't happen with these puzzles, but never leave a hint empty.
    i = selected >= 0 && !values[selected] ? selected : values.findIndex((v) => !v);
    d = puzzle.answer[i];
    why = `This one is ${d}.`;
  }
  selected = i;
  const touched = [i];
  if (settings.sudokuAutoNotes) for (const p of PEERS[i]) if (notes[p] & bit(d)) touched.push(p);
  record(touched);
  values[i] = d;
  notes[i] = 0;
  if (settings.sudokuAutoNotes) for (const p of PEERS[i]) notes[p] &= ~bit(d);
  hints++;
  sfx('hint');
  toast(why, 4200);
  pop(i);
  celebrate(i);
  render();
  savePlay();
  checkDone();
}

// ---- drawing the board ------------------------------------------------------------------

let highlight = 0; // a digit picked on the pad with no cell selected
const cellEls = [];
const lastHtml = [], lastClass = [];
const board = $('board');
for (let i = 0; i < 81; i++) {
  const el = document.createElement('div');
  el.className = `cell r${rowOf(i)} c${colOf(i)}`;
  el.setAttribute('role', 'gridcell');
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!finished) select(i);
  });
  board.appendChild(el);
  cellEls.push(el);
}
const pad = $('pad');
const keys = [];
for (let d = 1; d <= 9; d++) {
  const b = document.createElement('button');
  b.className = 'key';
  b.innerHTML = `<b>${d}</b><small></small>`;
  b.addEventListener('click', () => enter(d));
  pad.appendChild(b);
  keys.push(b);
}

function render() {
  if (!puzzle) return;
  const sel = selected;
  const focus = sel >= 0 ? values[sel] : highlight;
  for (let i = 0; i < 81; i++) {
    let cls = `cell r${rowOf(i)} c${colOf(i)}`;
    if (given[i]) cls += ' given';
    if (sel === i) cls += ' sel';
    else if (focus && values[i] === focus) cls += ' same';
    else if (sel >= 0 && (rowOf(i) === rowOf(sel) || colOf(i) === colOf(sel) || boxOf(i) === boxOf(sel))) cls += ' peer';
    if (isWrong(i)) cls += ' wrong';
    const el = cellEls[i];
    // Keep any animation that's running.
    for (const a of ['flash', 'wave', 'pop']) if (el.classList.contains(a)) cls += ` ${a}`;
    if (lastClass[i] !== cls) { el.className = cls; lastClass[i] = cls; }
    let html;
    if (values[i]) html = String(values[i]);
    else if (notes[i]) {
      html = '<div class="notes">';
      for (let d = 1; d <= 9; d++) html += notes[i] & bit(d) ? `<span${d === focus ? ' class="hot"' : ''}>${d}</span>` : '<span></span>';
      html += '</div>';
    } else html = '';
    if (lastHtml[i] !== html) { el.innerHTML = html; lastHtml[i] = html; }
  }
  for (let d = 1; d <= 9; d++) {
    let placed = 0;
    for (let i = 0; i < 81; i++) {
      if (values[i] !== d) continue;
      if (!settings.sudokuMistakes || values[i] === puzzle.answer[i]) placed++;
    }
    const left = Math.max(0, 9 - placed);
    keys[d - 1].classList.toggle('done', left === 0);
    keys[d - 1].querySelector('small').textContent = left ? String(left) : '✓';
  }
  pad.classList.toggle('notes-on', notesMode);
  $('notesBtn').classList.toggle('on', notesMode);
  $('notesBadge').textContent = notesMode ? 'ON' : 'OFF';
  $('undoBtn').disabled = !undoStack.length || finished;
  $('timer').textContent = clock(time);
}

const clock = (s) => (s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}` : `${Math.floor(s / 60)}`) + `:${String(s % 60).padStart(2, '0')}`;

// Size the board to fit between the top bar and the buttons.
// Spare height goes into taller number keys (easier to hit), up to a point.
function fit() {
  const play = $('play');
  const cs = getComputedStyle(play);
  const top = parseFloat(cs.paddingTop), bottom = parseFloat(cs.paddingBottom), gap = parseFloat(cs.rowGap) || 14;
  const tools = document.querySelector('.tools-row').offsetHeight;
  const room = innerHeight - top - bottom - tools - gap * 2;
  const size = Math.max(240, Math.min(innerWidth - 20, 540, room - 58));
  const keyH = Math.max(50, Math.min(78, room - size));
  board.style.setProperty('--size', `${size}px`);
  pad.style.setProperty('--key-h', `${keyH}px`);
  pad.style.width = `${Math.min(innerWidth - 20, Math.max(size, 340))}px`;
}

// ---- timer ----------------------------------------------------------------------------

setInterval(() => {
  if (!puzzle || finished || document.hidden || ui.isOpen()) return;
  time++;
  $('timer').textContent = clock(time);
  if (time % 10 === 0) savePlay();
}, 1000);

// ---- cards ----------------------------------------------------------------------------

function showRules() {
  ui.show(`<h2>How to play</h2>
    <div class="rules">
      <div class="rule"><svg viewBox="0 0 64 48"><rect x="2" y="2" width="60" height="44" rx="6" fill="#eef3ff" stroke="#c9d8f3" stroke-width="2"/>
        <text x="16" y="31" font-size="18" font-weight="800" fill="#1d2340" text-anchor="middle">3</text><text x="32" y="31" font-size="18" font-weight="800" fill="#3f4fe0" text-anchor="middle">7</text><text x="48" y="31" font-size="18" font-weight="800" fill="#1d2340" text-anchor="middle">1</text></svg>
        <div><b>1 to 9, once each</b><span>Every row, column and 3×3 box needs each number exactly once.</span></div></div>
      <div class="rule"><svg viewBox="0 0 64 48"><rect x="2" y="2" width="60" height="44" rx="6" fill="#a9bcff"/><text x="32" y="33" font-size="22" font-weight="800" fill="#3f4fe0" text-anchor="middle">5</text></svg>
        <div><b>Tap a square, then a number</b><span>Tap the same number again (or Erase) to clear it.</span></div></div>
      <div class="rule"><svg viewBox="0 0 64 48"><rect x="2" y="2" width="60" height="44" rx="6" fill="#fff" stroke="#c9d8f3" stroke-width="2"/>
        <text x="14" y="18" font-size="11" font-weight="700" fill="#6d7699">1</text><text x="44" y="18" font-size="11" font-weight="700" fill="#6d7699">3</text><text x="29" y="40" font-size="11" font-weight="700" fill="#6d7699">8</text></svg>
        <div><b>Notes</b><span>Turn on Notes to pencil in the numbers a square might be.</span></div></div>
      <div class="rule"><svg viewBox="0 0 64 48"><rect x="2" y="2" width="60" height="44" rx="6" fill="#ffe3e6"/><text x="32" y="33" font-size="22" font-weight="800" fill="#e0303f" text-anchor="middle">4</text></svg>
        <div><b>Mistakes and hints</b><span>Wrong numbers turn red (you can switch that off). Hint shows the next number you can work out, and why.</span></div></div>
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
  const run = save.runs[mode];
  ui.show(`<h2>Settings</h2>
    <div class="seg">${MODES.map(tab).join('')}</div>
    <p class="seg-note tip">${run.solved} solved${run.best !== null ? ` · best time ${clock(run.best)}` : ''}</p>
    ${switchRow('Sound', 'sound')}
    ${switchRow('Haptics', 'haptics')}
    ${switchRow('Show mistakes', 'sudokuMistakes')}
    ${switchRow('Clear notes automatically', 'sudokuAutoNotes')}
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

const ui = cards({
  next: () => startPuzzle(puzzle.n + 1),
  restart: () => { save.runs[mode].play = null; startPuzzle(puzzle.n); },
  rules: showRules,
  mode: (el) => switchMode(el.dataset.mode),
  'num-down': () => { const i = $('numInput'); i.value = Math.max(1, (+i.value || 1) - 1); },
  'num-up': () => { const i = $('numInput'); i.value = (+i.value || 0) + 1; },
  go: () => startPuzzle(+$('numInput').value || 1, true),
  setting: () => render(),
});

$('menuBtn').addEventListener('click', () => { sfx('tap'); showSettings(); });
$('undoBtn').addEventListener('click', undo);
$('eraseBtn').addEventListener('click', erase);
$('notesBtn').addEventListener('click', toggleNotes);
$('hintBtn').addEventListener('click', hint);

window.addEventListener('keydown', (e) => {
  if (ui.isOpen() || !puzzle) return;
  if (e.key >= '1' && e.key <= '9') enter(+e.key);
  else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') erase();
  else if (e.key === 'n' || e.key === 'N') toggleNotes();
  else if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'u') undo();
  else if (e.key === 'h') hint();
  else if (e.key.startsWith('Arrow')) {
    const i = selected < 0 ? 40 : selected;
    const r = rowOf(i), c = colOf(i);
    const [dr, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    select(((r + dr + 9) % 9) * 9 + ((c + dc + 9) % 9));
  } else return;
  e.preventDefault();
});

// Tapping outside the board clears the selection.
$('play').addEventListener('pointerdown', (e) => {
  if (e.target === $('play')) { selected = -1; highlight = 0; render(); }
});

// ---- start ----------------------------------------------------------------------------

lockViewport();
unlockAudio();
registerOffline();
window.addEventListener('resize', fit);
document.addEventListener('visibilitychange', () => { if (document.hidden) savePlay(); });
fit();

// A handle for poking at the game from the browser console while testing on this computer.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  window.sudoku = { enter, select, hint, undo, erase, toggleNotes, startPuzzle, get puzzle() { return puzzle; }, get values() { return values; }, get finished() { return finished; } };
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
