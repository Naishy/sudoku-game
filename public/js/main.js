// carry.js must come first: it restores progress carried into an installed copy
// eslint-disable-next-line import/order
import { restored as carried, refreshInstallAddress, setHandoff } from './carry.js';
import { parse, solve, conflicts, candidates, nextPlacement, UNITS, PEERS, unitsOf, rowOf, colOf, boxOf, bit } from './sudoku.js';
import { LEVELS, LEVEL_INFO, CODE, dayNumber, dateOfDay, keyOf, fromKey, dailyIndex, extraIndex, scoreFor, clock, longTime } from './days.js';
import { PALETTES, paletteFor, paint, titleOf, STYLES, hexA } from './painting.js';
import * as store from './store.js';
import * as L from './lines.js';
import { Sound } from './audio.js';
import { Haptics } from './haptics.js';
import { Telemetry, VERSION } from './telemetry.js';
import { GIFT, shouldShowGift, markGiftSeen, fromCard } from './gift.js';
import { drawHeidi } from './cast.js';
import { drawZiggy, ZIGGY_BOX } from './ziggy.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const params = new URLSearchParams(location.search);
const DPR = Math.min(3, window.devicePixelRatio || 1);

let S = store.settings();
const sound = new Sound();
const haptics = new Haptics();
const tel = new Telemetry();
const applySettings = () => { sound.enabled = S.sound; haptics.enabled = S.haptics; };
applySettings();
tel.log('open', { v: VERSION, w: innerWidth, h: innerHeight, works: store.works().length, inducted: store.inducted() });

// iPhone taps play as the finger lifts
window.addEventListener('pointerup', () => haptics.flush(), true);

let updateReady = false; // a new version is waiting (see the end)
const SCREENS = ['home', 'play', 'finish', 'works', 'work'];
let screen = 'home';
function show(name) {
  screen = name;
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== name);
  if (name === 'home') { renderHome(); if (updateReady) location.reload(); }
}
const modalOpen = () => ['welcome', 'how', 'settings', 'menu', 'install', 'gift'].some((m) => !$(m).classList.contains('hidden'));

// --- the cast, drawn small ------------------------------------------------------------------
function face(canvas, who, px) {
  // Ziggy sits whole beside the bubble (no circle round her); Heidi's portrait is round
  const w = who === 'ziggy' ? Math.round(px * 0.84) : px;
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(px * DPR);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${px}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, w, px);
  if (who === 'ziggy') {
    const B = ZIGGY_BOX;
    const s = Math.min(w / (B.right - B.left + 6), px / (B.bottom - B.top + 6));
    drawZiggy(ctx, (3 - B.left) * s + (w - (B.right - B.left + 6) * s) / 2, (3 - B.top) * s, s, { body: true });
  }
  else drawHeidi(ctx, px / 2, px * 0.5, px / 150, { body: true, mood: 'happy' });
}

// --- today ----------------------------------------------------------------------------------
const today = () => { const day = dayNumber(); return { day, date: dateOfDay(day), palette: paletteFor(day, dateOfDay(day)) }; };
const DATE = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

function renderHome() {
  const { day, date, palette } = today();
  $('today-date').textContent = DATE(date);
  const sw = $('today-swatches');
  sw.innerHTML = '';
  for (const c of PALETTES[palette].colours) { const i = el('i'); i.style.background = c; sw.append(i); }
  $('today-palette').textContent = `Today's colours: ${PALETTES[palette].name}`;
  face($('portrait'), 'heidi', 96);
  const works = store.works();
  const done = new Map(works.map((w) => [w.key, w]));
  const holder = $('levels');
  holder.innerHTML = '';
  let doneToday = 0;
  for (const level of LEVELS) {
    const info = LEVEL_INFO[level];
    const key = keyOf(level, dailyIndex(level, day));
    const w = done.get(key);
    const p = store.progress(key);
    const b = el('button', 'level');
    let thumb;
    if (w) {
      doneToday++;
      thumb = paintingCanvas(key, w.palette, 64);
      thumb.className = 'thumb';
    } else thumb = el('span', 'thumb blank');
    const mid = el('div');
    const name = el('div', 'name', info.name);
    name.append(el('span', 'dots', '●'.repeat(info.dots) + '○'.repeat(4 - info.dots)));
    mid.append(name, el('div', 'blurb', info.blurb));
    const status = el('div', `status${w ? ' done' : ''}`);
    if (w) { status.textContent = 'Hung'; status.append(el('small', null, clock(w.secs))); } else if (p) { status.textContent = 'Carry on'; status.append(el('small', null, clock(p.s))); } else status.textContent = 'New';
    b.append(thumb, mid, status);
    b.onclick = () => { sound.tap(); haptics.tap(); if (w) openWork(w); else openPuzzle(key, { daily: true, day, palette }); };
    holder.append(b);
    if (w) {
      // done today: offer another at this level
      const more = el('button', 'link another', `Another ${info.name.toLowerCase()} →`);
      more.onclick = () => {
        const keys = new Set(store.works().map((x) => x.key));
        const pending = Object.keys(store.allProgress()).find((k) => k[0] === CODE[level] && !keys.has(k) && k !== key);
        openPuzzle(pending || keyOf(level, extraIndex(level, day, keys)), { daily: false, day, palette });
      };
      holder.append(more);
    }
  }
  $('home-note').textContent = L.homeNote(doneToday, LEVELS.length);
  $('works-count').textContent = works.length ? `(${works.length})` : '';
}

const solutions = new Map();
function solutionOf(key) {
  if (!solutions.has(key)) { const f = fromKey(key); solutions.set(key, f ? solve(parse(f.puzzle)) : null); }
  return solutions.get(key);
}
function paintingCanvas(key, palette, px) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(px * DPR); cv.height = Math.round(px * DPR);
  cv.style.width = `${px}px`; cv.style.height = `${px}px`;
  const ctx = cv.getContext('2d');
  ctx.scale(DPR, DPR);
  const f = fromKey(key);
  const sol = solutionOf(key);
  if (f && sol) paint(ctx, sol, { size: px, level: f.level, palette, seed: key });
  return cv;
}

// --- playing ---------------------------------------------------------------------------------
let G = null; // the puzzle being played
const cells = [];
const keys = [];

function buildBoard() {
  const grid = $('grid');
  for (let i = 0; i < 81; i++) {
    const c = el('div', 'cell');
    if (colOf(i) === 2 || colOf(i) === 5) c.classList.add('br');
    if (rowOf(i) === 2 || rowOf(i) === 5) c.classList.add('bb');
    c.setAttribute('role', 'gridcell');
    c.addEventListener('pointerdown', (e) => { e.preventDefault(); select(i); });
    grid.append(c);
    cells.push(c);
  }
  const pad = $('pad');
  for (let d = 1; d <= 9; d++) {
    const k = el('button', 'key');
    k.append(el('span', 'num', String(d)), el('span', 'left'), el('span', 'sw'));
    k.addEventListener('pointerdown', (e) => { e.preventDefault(); input(d); });
    pad.append(k);
    keys.push(k);
  }
  $('t-undo').onclick = undo;
  $('t-erase').onclick = erase;
  $('t-notes').onclick = toggleNotes;
  $('t-hint').onclick = hint;
}
buildBoard();

function openPuzzle(key, { daily, day, palette, tutorial = null }) {
  const f = tutorial ? null : fromKey(key);
  const givens = tutorial ? tutorial.givens : parse(f.puzzle);
  const solution = tutorial ? tutorial.solution : solutionOf(key);
  const p = tutorial ? null : store.progress(key);
  G = {
    key, level: tutorial ? 'sketch' : f.level, daily, day: p?.d ?? day, palette: p?.p ?? palette,
    givens, solution, values: givens.slice(), notes: new Int16Array(81),
    secs: p?.s || 0, hints: p?.h || 0, sel: -1, digit: 0, notesMode: false, undo: [], pending: null, done: false, tutorial,
  };
  if (p?.v) { const v = parse(p.v); for (let i = 0; i < 81; i++) if (!givens[i] && v[i]) G.values[i] = v[i]; }
  if (p?.n) G.notes = store.decodeNotes(p.n);
  const info = LEVEL_INFO[G.level];
  $('play-level').textContent = tutorial ? 'Your first grid' : info.name;
  $('play-sub').textContent = tutorial ? 'A quick guide' : daily ? `Today's ${info.name.toLowerCase()} · ${PALETTES[G.palette].name}` : `Another ${info.name.toLowerCase()} · ${PALETTES[G.palette].name}`;
  say(null);
  $('coach-skip').classList.toggle('hidden', !tutorial);
  $('timer').classList.toggle('hidden', !!tutorial);
  show('play');
  render();
  fitGrid();
  tick();
  if (!tutorial) tel.log('start', { key, level: G.level, daily, resume: !!p, secs: G.secs });
  if (tutorial) coachStep(0);
}

function snapshot() { return { v: G.values.slice(), n: Int16Array.from(G.notes) }; }
function pushUndo() { G.undo.push(snapshot()); if (G.undo.length > 400) G.undo.shift(); }
function save() {
  if (!G || G.done || G.tutorial) return;
  const v = G.values.map((x, i) => (G.givens[i] ? 0 : x));
  store.saveProgress(G.key, { v: v.map((x) => (x ? String(x) : '.')).join(''), n: store.encodeNotes(G.notes), s: G.secs, h: G.hints, d: G.day, p: G.palette });
}

function select(i) {
  if (!G || G.done) return;
  G.sel = G.sel === i && !G.values[i] ? -1 : i;
  G.digit = G.sel >= 0 ? G.values[G.sel] : 0;
  sound.tap();
  render();
  coachEvent('select', i);
}

function input(d) {
  if (!G || G.done) return;
  const i = G.sel;
  if (i < 0 || G.givens[i]) {
    // no square chosen: show where this number already is
    G.digit = G.digit === d ? 0 : d;
    if (i >= 0) G.sel = -1;
    haptics.tap();
    render();
    return;
  }
  if (G.notesMode) {
    if (G.values[i]) return;
    pushUndo();
    G.notes[i] ^= bit(d);
    sound.note(); haptics.note();
    G.digit = d;
    afterChange();
    coachEvent('note', i);
    return;
  }
  pushUndo();
  if (G.values[i] === d) { G.values[i] = 0; sound.erase(); G.digit = 0; afterChange(); return; }
  G.values[i] = d;
  G.notes[i] = 0;
  if (S.tidy) for (const p of PEERS[i]) G.notes[p] &= ~bit(d);
  G.digit = d;
  sound.place(d); haptics.place();
  // a row, column or box finished (and right): a little run and a shimmer
  for (const u of unitsOf(i)) {
    if (UNITS[u].every((j) => G.values[j] && G.values[j] === G.solution[j])) {
      setTimeout(() => { for (const j of UNITS[u]) { cells[j].classList.remove('shimmer'); void cells[j].offsetWidth; cells[j].classList.add('shimmer'); } }, 60);
      sound.unit(d); haptics.unit();
    }
  }
  afterChange();
  coachEvent('place', i, d);
}

function erase() {
  if (!G || G.done) return;
  const i = G.sel;
  if (i < 0 || G.givens[i] || (!G.values[i] && !G.notes[i])) return;
  pushUndo();
  G.values[i] = 0;
  G.notes[i] = 0;
  G.digit = 0;
  sound.erase(); haptics.tap();
  afterChange();
}

function undo() {
  if (!G || G.done || !G.undo.length) return;
  const s = G.undo.pop();
  G.values = s.v; G.notes = s.n;
  G.digit = G.sel >= 0 ? G.values[G.sel] : 0;
  sound.erase(); haptics.tap();
  G.pending = null;
  render(); save();
}

function toggleNotes() {
  if (!G || G.done) return;
  G.notesMode = !G.notesMode;
  haptics.tap(); sound.tap();
  render();
  coachEvent('notes', G.notesMode);
}

function afterChange() {
  G.pending = null;
  render();
  save();
  checkDone();
}

// --- Ziggy's hints ----------------------------------------------------------------------------
function hint() {
  if (!G || G.done) return;
  sound.hint(); haptics.hint();
  const p = G.pending;
  // second tap: do it
  if (p && p.stage === 1) {
    if (p.wrong) {
      pushUndo();
      for (const i of p.wrong) G.values[i] = 0;
      G.pending = null;
      say('ziggy', 'There. Off you go again!');
      render(); save();
      return;
    }
    const [i, d] = p.h.place;
    pushUndo();
    G.values[i] = d;
    G.notes[i] = 0;
    if (S.tidy) for (const q of PEERS[i]) G.notes[q] &= ~bit(d);
    G.sel = i; G.digit = d;
    G.pending = null;
    sound.place(d);
    say('ziggy', L.revealText(p.h));
    render(); save();
    coachEvent('place', i, d);
    checkDone();
    return;
  }
  // first tap: where to look. Mistakes first, if there are any.
  const wrong = [];
  for (let i = 0; i < 81; i++) if (G.values[i] && !G.givens[i] && G.values[i] !== G.solution[i]) wrong.push(i);
  if (!G.tutorial) { G.hints++; save(); }
  if (wrong.length) {
    G.pending = { stage: 1, wrong, glow: wrong, hl: [] };
    say('ziggy', L.mistakeText(wrong.length));
    tel.log('hint', { key: G.key, mistakes: wrong.length });
    render();
    return;
  }
  const h = nextPlacement(G.values);
  if (!h) { say('ziggy', L.STUCK); tel.log('hint', { key: G.key, stuck: true }); return; }
  const target = h.place[0];
  let hl = [];
  let glow = [target];
  if (h.tech === 'hiddenSingle') { hl = UNITS[h.unit]; glow = []; } else if (h.via) { hl = h.via.cells; }
  G.pending = { stage: 1, h, hl, glow };
  G.sel = -1; G.digit = 0; // so the hint's squares stand out
  say('ziggy', L.hintText(h));
  tel.log('hint', { key: G.key, tech: h.tech, level: G.level });
  render();
  coachEvent('hint');
}

// --- drawing the board ---------------------------------------------------------------------------
function render() {
  if (!G) return;
  const clash = conflicts(G.values);
  const sel = G.sel;
  const P = PALETTES[G.palette].colours;
  const hl = new Set(G.pending?.hl || []);
  const glow = new Set(G.pending?.glow || []);
  for (let i = 0; i < 81; i++) {
    const c = cells[i];
    const v = G.values[i];
    const peer = sel >= 0 && i !== sel && (rowOf(i) === rowOf(sel) || colOf(i) === colOf(sel) || boxOf(i) === boxOf(sel));
    const same = S.same && G.digit && v === G.digit;
    c.className = 'cell';
    if (colOf(i) === 2 || colOf(i) === 5) c.classList.add('br');
    if (rowOf(i) === 2 || rowOf(i) === 5) c.classList.add('bb');
    if (G.givens[i]) c.classList.add('given'); else if (v) c.classList.add('mine');
    if (i === sel) c.classList.add('sel');
    if (same && i !== sel) c.classList.add('same');
    if (v && clash.has(i)) c.classList.add('clash');
    else if (S.mistakes && v && !G.givens[i] && v !== G.solution[i]) c.classList.add('wrong');
    if (hl.has(i)) c.classList.add('hl');
    if (glow.has(i)) c.classList.add('hl-cell', 'glow');
    if (G.tutorial?.glow === i) c.classList.add('hl-cell', 'glow');
    // colours as you go: each number tints its square in the day's palette
    let bg = '';
    if (v && S.colours) bg = hexA(P[v - 1], (same ? 0.5 : G.givens[i] ? 0.2 : 0.3) + (peer ? 0.06 : 0));
    else if (peer) bg = '#f1eee8';
    else if (same) bg = '#efe9df';
    c.style.backgroundColor = bg;
    // contents
    if (v) {
      if (c.dataset.v !== String(v) || c.firstChild?.className === 'notes') c.textContent = String(v);
      c.dataset.v = String(v);
    } else if (G.notes[i]) {
      const n = el('div', 'notes');
      for (let d = 1; d <= 9; d++) {
        const s = el('span', null, G.notes[i] & bit(d) ? String(d) : '');
        if (S.same && G.digit === d && G.notes[i] & bit(d)) s.className = 'on-same';
        n.append(s);
      }
      c.textContent = '';
      c.append(n);
      c.dataset.v = '';
    } else { c.textContent = ''; c.dataset.v = ''; }
  }
  // the number pad: how many of each are left, and the number's colour
  const count = new Array(10).fill(0);
  for (const v of G.values) count[v]++;
  keys.forEach((k, j) => {
    const d = j + 1;
    k.classList.toggle('used', count[d] >= 9 && !G.notesMode);
    k.classList.toggle('notes-mode', G.notesMode);
    k.querySelector('.left').textContent = count[d] >= 9 ? '' : String(9 - count[d]);
    k.querySelector('.sw').style.background = S.colours ? P[d - 1] : 'transparent';
    k.classList.toggle('glow', G.tutorial?.glowKey === d);
  });
  $('t-notes').classList.toggle('on', G.notesMode);
  $('notes-state').textContent = G.notesMode ? 'on' : 'off';
  for (const t of ['t-undo', 't-erase', 't-notes', 't-hint']) $(t).classList.toggle('glow', G.tutorial?.glowTool === t);
}

// the grid takes whatever height is left once everything else is laid out
function fitGrid() {
  if (screen !== 'play') return;
  const play = $('play');
  const cs = getComputedStyle(play);
  let used = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  for (const child of play.children) {
    if (child.classList.contains('grid-wrap') || child.classList.contains('hidden')) continue;
    const st = getComputedStyle(child);
    // the tools' top margin is 'auto' (it pins them to the bottom): that's spare space, not used
    used += child.offsetHeight + (child.classList.contains('tools') ? 0 : parseFloat(st.marginTop)) + parseFloat(st.marginBottom);
  }
  const size = Math.floor(Math.min(play.clientWidth - 20, 540, play.clientHeight - used - 2));
  $('grid').style.setProperty('--size', `${Math.max(220, size)}px`);
}
window.addEventListener('resize', fitGrid);

const sayFaceSize = () => (innerHeight <= 700 ? 76 : 86);
function say(who, text, { coach = false } = {}) {
  const box = $('say');
  box.classList.toggle('coach', coach);
  if (!who) { box.classList.remove('on'); return; }
  face($('say-face'), who, sayFaceSize());
  $('say-text').textContent = text;
  box.classList.add('on');
}

// --- the clock ---------------------------------------------------------------------------------
function tick() {
  if (!G) return;
  const t = $('timer');
  t.textContent = clock(G.secs);
  t.classList.toggle('off', !S.timer);
}
setInterval(() => {
  if (!G || G.done || screen !== 'play' || document.hidden || modalOpen()) return;
  G.secs++;
  tick();
  if (G.secs % 5 === 0) save();
}, 1000);
$('timer').onclick = () => { S.timer = !S.timer; store.saveSettings(S); tick(); };

// --- finishing -----------------------------------------------------------------------------------
function checkDone() {
  if (!G.values.every((v) => v)) return;
  if (G.values.some((v, i) => v !== G.solution[i])) { say('ziggy', L.FULL_BUT_WRONG); return; }
  G.done = true;
  G.sel = -1; G.digit = 0;
  render();
  sound.finish(); haptics.finish();
  if (G.tutorial) { setTimeout(() => finishTutorial(), 700); return; }
  store.clearProgress(G.key);
  const score = scoreFor(G.level, G.secs, G.hints);
  const prevBest = store.best();
  const newBest = score > prevBest;
  if (newBest) store.saveBest(score);
  const work = { key: G.key, day: G.day, secs: G.secs, hints: G.hints, score, palette: G.palette };
  store.addWork(work);
  refreshInstallAddress();
  tel.log('finish', { key: G.key, level: G.level, daily: G.daily, secs: G.secs, hints: G.hints, score, best: newBest });
  setTimeout(() => showFinish(work, { score, newBest, fresh: true }), 700);
  submitFamilyScore(score, work, newBest);
}

function labelFor(work, f) {
  const date = dateOfDay(work.day);
  const artist = Family?.player?.name || 'Heidi';
  return {
    artist: artist === 'Heidi' ? 'Heidi (b. Canberra)' : artist,
    title: titleOf(f.level, work.palette),
    year: `, ${date.getFullYear()}`,
    medium: `${STYLES[f.level].medium}. Solved in ${longTime(work.secs)}${work.hints ? `, with ${work.hints} hint${work.hints > 1 ? 's' : ''}` : ''}, ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.`,
  };
}

function frameSize() { return Math.min(300, innerWidth - 90, Math.round(innerHeight * 0.4)); }

function animatePainting(canvas, key, level, palette, px, ms = 1700) {
  canvas.width = Math.round(px * DPR); canvas.height = Math.round(px * DPR);
  canvas.style.width = `${px}px`; canvas.style.height = `${px}px`;
  const ctx = canvas.getContext('2d');
  const sol = solutionOf(key) || G?.solution;
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, px, px);
    paint(ctx, sol, { size: px, level, palette, seed: key, reveal: k });
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function showFinish(work, { score, newBest }) {
  const f = fromKey(work.key);
  const lab = labelFor(work, f);
  $('fin-artist').textContent = lab.artist;
  $('fin-title').textContent = lab.title;
  $('fin-year').textContent = lab.year;
  $('fin-medium').textContent = lab.medium;
  $('fin-line').textContent = `${LEVEL_INFO[f.level].name} · ${clock(work.secs)}${work.hints ? ` · ${work.hints} hint${work.hints > 1 ? 's' : ''}` : ''}`;
  $('fin-points').textContent = String(score);
  $('fin-best').textContent = newBest ? 'Your best yet!' : '';
  $('fin-heidi').textContent = `“${L.finishLine(f.level, { who: Family?.player?.name, hints: work.hints, christmas: dateOfDay(work.day).getMonth() === 11 && dateOfDay(work.day).getDate() === 25 })}” Heidi`;
  $('finish').querySelector('.finish-score').classList.remove('hidden');
  $('fin-save').classList.remove('hidden');
  $('fin-home').textContent = 'Lovely';
  show('finish');
  animatePainting($('finish-canvas'), work.key, f.level, work.palette, frameSize());
  $('fin-save').onclick = () => savePicture(work);
}

// --- the gallery ---------------------------------------------------------------------------------
function renderWorks() {
  const list = store.works().slice().sort((a, b) => b.day - a.day || b.score - a.score);
  const grid = $('works-grid');
  grid.innerHTML = '';
  $('works-empty').classList.toggle('hidden', list.length > 0);
  $('works-sub').textContent = list.length ? `${list.length} work${list.length > 1 ? 's' : ''}` : '';
  const px = Math.min(150, Math.floor((Math.min(innerWidth, 560) - 32 - 18) / 2) - 16);
  for (const w of list) {
    const f = fromKey(w.key);
    if (!f) continue;
    const b = el('button', 'work-tile');
    const fr = el('div', 'mini-frame');
    fr.append(paintingCanvas(w.key, w.palette, px));
    const cap = el('div', 'cap');
    cap.append(el('i', null, titleOf(f.level, w.palette)), el('br'), document.createTextNode(`${dateOfDay(w.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${clock(w.secs)}`));
    b.append(fr, cap);
    b.onclick = () => openWork(w);
    grid.append(b);
  }
}
function openWork(w) {
  const f = fromKey(w.key);
  const lab = labelFor(w, f);
  $('work-artist').textContent = lab.artist;
  $('work-title').textContent = lab.title;
  $('work-year').textContent = lab.year;
  $('work-medium').textContent = lab.medium;
  show('work');
  const px = frameSize();
  const cv = $('work-canvas');
  cv.width = Math.round(px * DPR); cv.height = Math.round(px * DPR);
  cv.style.width = `${px}px`; cv.style.height = `${px}px`;
  const ctx = cv.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  paint(ctx, solutionOf(w.key), { size: px, level: f.level, palette: w.palette, seed: w.key });
  $('work-save').onclick = () => savePicture(w);
  tel.log('work-view', { key: w.key });
}
$('btn-works').onclick = () => { sound.tap(); renderWorks(); show('works'); tel.log('works', { n: store.works().length }); };
$('works-back').onclick = () => show('home');
$('work-back').onclick = () => { renderWorks(); show('works'); };

/** The work on a gallery wall with its label, as a picture to keep or send. */
async function savePicture(w) {
  const f = fromKey(w.key);
  const lab = labelFor(w, f);
  const W = 1200, H = 1500;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#efece6'; ctx.fillRect(0, 0, W, H);
  const size = 820, x = (W - size) / 2, y = 170;
  ctx.fillStyle = 'rgba(40,30,20,0.16)'; ctx.fillRect(x - 40 + 12, y - 40 + 30, size + 80, size + 80);
  ctx.fillStyle = '#fff'; ctx.fillRect(x - 40, y - 40, size + 80, size + 80);
  paint(ctx, solutionOf(w.key), { x, y, size, level: f.level, palette: w.palette, seed: w.key });
  ctx.fillStyle = '#cfc7b8'; ctx.fillRect(x, y + size + 110, 4, 170);
  ctx.fillStyle = '#26221e';
  ctx.font = '700 34px "DM Sans", sans-serif'; ctx.fillText(lab.artist, x + 30, y + size + 140);
  ctx.font = 'italic 44px Fraunces, Georgia, serif'; ctx.fillText(lab.title, x + 30, y + size + 195);
  const tw = ctx.measureText(lab.title).width;
  ctx.font = '400 40px Fraunces, Georgia, serif'; ctx.fillText(lab.year, x + 30 + tw, y + size + 195);
  ctx.fillStyle = '#7a7166'; ctx.font = '400 30px "DM Sans", sans-serif';
  wrap(ctx, lab.medium, x + 30, y + size + 245, size - 40, 38);
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  if (!blob) return;
  const name = `${lab.title.replace(/[^\w &]+/g, '').trim()}.png`;
  const file = new File([blob], name, { type: 'image/png' });
  tel.log('save-picture', { key: w.key });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: lab.title }); return; }
  } catch { return; /* cancelled */ }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function wrap(ctx, text, x, y, w, lh) {
  let line = '';
  for (const word of text.split(' ')) {
    const t = line ? `${line} ${word}` : word;
    if (ctx.measureText(t).width > w && line) { ctx.fillText(line, x, y); y += lh; line = word; } else line = t;
  }
  if (line) ctx.fillText(line, x, y);
}

// --- the guide (first go) ---------------------------------------------------------------------------
// A nearly finished grid: one square to find, notes to try, a hint from Ziggy, then the rest.
const T_SOLUTION = parse('534678912672195348198342567859761423426853791713924856961537284287419635345286179');
const T_BLANKS = [2, 40, 39, 80, 24];
const STEPS = [
  { text: 'This is Ziggy, who\'ll show you round. Every row, column and 3×3 box holds 1 to 9, once each. Tap the glowing square.', glow: 2, done: (e, i) => e === 'select' && i === 2 },
  { text: 'Its row has every number but one. Which is missing? Tap it below.', glow: 2, done: (e, i, d) => e === 'place' && i === 2 && d === 4 },
  { text: 'Lovely! When you\'re not sure, pencil in notes. Tap Notes.', glowTool: 't-notes', done: (e, on) => e === 'notes' && on },
  { text: 'Tap the glowing square, then tap 5 and 8 to pencil them in.', glow: 40, done: () => (G.notes[40] & (bit(5) | bit(8))) === (bit(5) | bit(8)) },
  { text: 'Now tap Notes again to go back to numbers.', glowTool: 't-notes', done: (e, on) => e === 'notes' && !on },
  { text: 'Stuck? Tap Hint and Ziggy shows you where to look.', glowTool: 't-hint', done: (e) => e === 'hint' },
  { text: 'Tap Hint again to fill it in, or pop it in yourself.', keep: true, glowTool: 't-hint', done: () => G.pending == null },
  { text: 'Now fill in the last squares. Watch the colours come in.', done: () => false },
];
function startTutorial() {
  const givens = T_SOLUTION.slice();
  for (const i of T_BLANKS) givens[i] = 0;
  const { palette, day } = today();
  tel.log('guide', { step: 'start' });
  openPuzzle('guide', { daily: false, day, palette, tutorial: { givens, solution: T_SOLUTION, step: 0 } });
}
function coachStep(n) {
  const t = G.tutorial;
  t.step = n;
  const s = STEPS[n];
  // Ziggy shows you round
  say('ziggy', s.keep ? `${$('say-text').textContent} ${s.text}` : s.text, { coach: !s.keep });
  t.glow = s.glow ?? -1;
  t.glowTool = s.glowTool || null;
  render();
  fitGrid();
}
function coachEvent(e, a, b) {
  const t = G?.tutorial;
  if (!t || t.step >= STEPS.length) return;
  const s = STEPS[t.step];
  if (t.step === 1 && e === 'place' && a === 2 && b !== 4) {
    say('ziggy', 'Nearly! Look along the row for the number that isn\'t there yet.', { coach: true });
    setTimeout(() => { if (G?.tutorial && G.values[2] !== 4) { G.values[2] = 0; render(); } }, 700);
    return;
  }
  if (s.done(e, a, b)) { tel.log('guide', { step: t.step }); if (t.step + 1 < STEPS.length) coachStep(t.step + 1); }
}
function finishTutorial() {
  store.markInducted();
  refreshInstallAddress();
  tel.log('guide', { step: 'done' });
  $('fin-artist').textContent = Family?.player?.name || 'Heidi (b. Canberra)';
  $('fin-title').textContent = 'First Sketch';
  $('fin-year').textContent = `, ${new Date().getFullYear()}`;
  $('fin-medium').textContent = 'Watercolour on paper. Every grid you finish becomes a painting like this, in the day\'s colours.';
  $('finish').querySelector('.finish-score').classList.add('hidden');
  $('fin-heidi').textContent = '“Thanks heaps. Now try today\'s Sketch.” Heidi';
  $('fin-save').classList.add('hidden');
  $('fin-home').textContent = 'To today\'s puzzles';
  show('finish');
  const px = frameSize();
  const cv = $('finish-canvas');
  cv.width = Math.round(px * DPR); cv.height = Math.round(px * DPR);
  cv.style.width = `${px}px`; cv.style.height = `${px}px`;
  const ctx = cv.getContext('2d');
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 1700);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, px, px);
    paint(ctx, T_SOLUTION, { size: px, level: 'sketch', palette: G.palette, seed: 'guide', reveal: k });
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
$('coach-skip').onclick = () => { store.markInducted(); tel.log('guide', { step: 'skip', at: G?.tutorial?.step }); G = null; show('home'); };
$('fin-home').onclick = () => { G = null; show('home'); };

// --- buttons, menus, settings -------------------------------------------------------------------
$('btn-back').onclick = () => {
  if (G && !G.done && !G.tutorial) { save(); tel.log('leave', { key: G.key, secs: G.secs, filled: G.values.filter((v, i) => v && !G.givens[i]).length }); }
  if (G?.tutorial) store.markInducted();
  G = null;
  show('home');
};
$('btn-menu').onclick = () => $('menu').classList.remove('hidden');
$('m-close').onclick = () => $('menu').classList.add('hidden');
$('m-notes').onclick = () => {
  $('menu').classList.add('hidden');
  if (!G || G.done) return;
  pushUndo();
  const cand = candidates(G.values);
  for (let i = 0; i < 81; i++) if (!G.values[i]) G.notes[i] = cand[i];
  tel.log('fill-notes', { key: G.key });
  afterChange();
};
$('m-clear-notes').onclick = () => {
  $('menu').classList.add('hidden');
  if (!G || G.done) return;
  pushUndo();
  G.notes = new Int16Array(81);
  afterChange();
};
$('m-restart').onclick = () => {
  $('menu').classList.add('hidden');
  if (!G || G.done) return;
  pushUndo();
  G.values = G.givens.slice();
  G.notes = new Int16Array(81);
  G.sel = -1; G.digit = 0;
  say('ziggy', 'A fresh start. (Undo brings it all back.)');
  afterChange();
};
$('m-settings').onclick = () => { $('menu').classList.add('hidden'); openSettings(); };
$('btn-settings').onclick = openSettings;
$('btn-how').onclick = () => $('how').classList.remove('hidden');
$('how-close').onclick = () => $('how').classList.add('hidden');
$('how-guide').onclick = () => { $('how').classList.add('hidden'); startTutorial(); };
$('welcome-guide').onclick = () => { $('welcome').classList.add('hidden'); sound.unlock(); startTutorial(); };
$('welcome-skip').onclick = () => { $('welcome').classList.add('hidden'); store.markInducted(); refreshInstallAddress(); tel.log('guide', { step: 'knows' }); };

const SETTINGS = [
  ['mistakes', 'Show mistakes', 'Mark numbers that don\'t match the answer'],
  ['timer', 'Show the clock'],
  ['colours', 'Colours as you go', 'Each number tints its square in the day\'s palette'],
  ['tidy', 'Tidy notes automatically', 'Placing a number takes it out of the notes around it'],
  ['same', 'Highlight matching numbers'],
  ['sound', 'Sound'],
  ['haptics', 'Vibration'],
];
function openSettings() {
  const list = $('settings-list');
  list.innerHTML = '';
  for (const [k, label, sub] of SETTINGS) {
    if (k === 'haptics' && !haptics.supported) continue;
    const row = el('label', 'setting');
    const t = el('div', null, label);
    if (sub) t.append(el('small', null, sub));
    const c = el('input');
    c.type = 'checkbox';
    c.setAttribute('switch', '');
    c.checked = !!S[k];
    c.onchange = () => { S[k] = c.checked; store.saveSettings(S); applySettings(); refreshInstallAddress(); render(); tick(); tel.log('setting', { k, on: c.checked }); };
    row.append(t, c);
    list.append(row);
  }
  $('settings').classList.remove('hidden');
}
$('settings-close').onclick = () => $('settings').classList.add('hidden');

// keyboard (a laptop or an iPad keyboard)
document.addEventListener('keydown', (e) => {
  if (screen !== 'play' || !G || modalOpen()) return;
  const k = e.key;
  if (/^[1-9]$/.test(k)) input(Number(k));
  else if (k === 'Backspace' || k === 'Delete' || k === '0') erase();
  else if (k === 'n' || k === 'N') toggleNotes();
  else if (k === 'z' || k === 'u') undo();
  else if (k === 'h') hint();
  else if (k.startsWith('Arrow')) {
    const i = G.sel < 0 ? 40 : G.sel;
    const r = rowOf(i), c = colOf(i);
    const [dr, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
    G.sel = ((r + dr + 9) % 9) * 9 + ((c + dc + 9) % 9);
    G.digit = G.values[G.sel];
    render();
  } else return;
  e.preventDefault();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { save(); return; }
  if (screen === 'home') renderHome(); // a new day may have started
});

// --- family scoreboard (games.tequinox.net) -----------------------------------------------------
const HUB = location.hostname === 'localhost' ? 'http://localhost:8788' : 'https://games.tequinox.net';
let Family = null;
const familyCode = params.get('family');
const handoffParam = params.get('famhandoff');
const isInstalled = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isPhone = () => isIOS() || /Android/.test(navigator.userAgent);
function offerHandoff() {
  if (!Family?.player || isInstalled() || !isIOS()) return;
  Family.handoff?.().then((token) => { if (token) setHandoff(token); });
}
function tidyUrl() {
  const p = new URLSearchParams(location.search);
  for (const k of ['card', 'family', 'gift', 'carry', 'famhandoff']) p.delete(k);
  const q = p.toString();
  history.replaceState(null, '', location.pathname + (q ? `?${q}` : '') + location.hash);
}
function setupFamily(autoPrompt) {
  if (params.has('nofamily')) { afterStart(); return; }
  import(`${HUB}/family.js`)
    .then((m) => {
      Family = m.Family;
      if (familyCode || handoffParam) {
        const p = new URLSearchParams(location.search);
        if (familyCode) p.set('family', familyCode);
        if (handoffParam) p.set('famhandoff', handoffParam);
        history.replaceState(null, '', `${location.pathname}?${p}`);
      }
      return Family.init({ game: 'grid-works', mount: $('family-slot'), autoPrompt, onChange: offerHandoff })
        .finally(() => { tidyUrl(); refreshInstallAddress(); offerHandoff(); afterStart(); });
    })
    .catch(() => { Family = null; tidyUrl(); refreshInstallAddress(); afterStart(); });
}
function submitFamilyScore(score, work, newBest) {
  const line = $('fin-family');
  line.classList.add('hidden');
  if (!Family?.player) return;
  const f = fromKey(work.key);
  Family.submit(score, { level: f.level, secs: work.secs, hints: work.hints, daily: G?.daily ?? null, day: work.day }).then((r) => {
    if (!r) return;
    line.textContent = Family.describe(r, { best: !newBest });
    line.classList.remove('hidden');
  }).catch(() => {});
}

// --- Christmas gift -------------------------------------------------------------------------------
function setupGift() {
  if (!shouldShowGift()) return false;
  const g = $('gift');
  $('gift-heading').textContent = GIFT.heading;
  for (const line of GIFT.message) $('gift-message').append(el('p', null, line));
  $('gift-signature').textContent = GIFT.signature;
  g.classList.remove('hidden');
  $('gift-box').addEventListener('click', () => {
    if (g.classList.contains('open')) return;
    sound.unlock();
    g.classList.add('open');
    sound.finish();
    haptics.finish();
    markGiftSeen();
    refreshInstallAddress();
    tel.log('gift-opened');
  });
  $('gift-go').addEventListener('click', () => {
    g.classList.add('hidden');
    installTip(() => setupFamily(true));
  });
  return true;
}

// --- "pop it on your home screen" -------------------------------------------------------------------
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });
function installTip(done) {
  if (isInstalled() || !isPhone()) { done(); return; }
  const how = $('install-how');
  const btn = $('btn-install');
  if (installPrompt) {
    how.innerHTML = 'Tap <b>Install</b> and it\'ll sit on your home screen like a proper app.';
    btn.classList.remove('hidden');
  } else if (isIOS()) {
    how.innerHTML = 'Tap the <b>Share</b> button <span class="share-ic">⬆</span> in Safari, then <b>Add to Home Screen</b>. It opens full screen like a proper app, and keeps your works.';
  } else {
    how.innerHTML = 'Tap the browser\'s <b>⋮</b> menu, then <b>Add to Home screen</b>. It opens full screen like a proper app.';
  }
  tel.log('install-tip', { ios: isIOS(), prompt: !!installPrompt });
  const finish = () => { $('install').classList.add('hidden'); done(); };
  btn.onclick = async () => {
    try { installPrompt.prompt(); const r = await installPrompt.userChoice; tel.log('install', { outcome: r?.outcome }); } catch { /* ignore */ }
    installPrompt = null;
    finish();
  };
  $('btn-install-done').onclick = finish;
  $('install').classList.remove('hidden');
}

// first visit: offer the guide (after the gift and the scoreboard sign-in)
let started = false;
function afterStart() {
  if (started) return;
  started = true;
  if (!store.inducted() && screen === 'home') $('welcome').classList.remove('hidden');
}

// --- start ------------------------------------------------------------------------------------
tidyUrl();
refreshInstallAddress();
if (fromCard()) tel.log('card-scan', { family: !!familyCode });
if (carried) tel.log('carry-restore', { keys: carried, handoff: !!handoffParam });
show('home');
if (!setupGift()) setupFamily(true);
(document.fonts?.load?.('600 20px Fraunces') || Promise.resolve()).catch(() => {}).finally(() => { if (screen === 'home') renderHome(); });

// --- auto-update ---------------------------------------------------------------------------------
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !params.has('nosw')) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    updateReady = true;
    if (screen === 'home' && !modalOpen()) location.reload();
    else $('update-note').classList.remove('hidden');
  });
  let reg = null;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => { reg = r; }).catch(() => {});
    setInterval(() => reg?.update().catch(() => {}), 5 * 60 * 1000);
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg?.update().catch(() => {}); });
}
