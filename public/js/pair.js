// Together: two phones, one grid. No DOM: the rules of a shared puzzle, used by the
// Worker's room (src/pair-room.js, which holds the game) and the phones (which draw it).
//
// Each player's numbers are in their own ink, and the finished painting remembers whose
// hand placed each square. Moves, notes, Undo and Ziggy's hints are shared: Undo takes
// back the last move, whoever made it. Pair games never go to the family board.
import { PUZZLES } from './puzzles.js';
import { LEVELS, parse, format, solve, candidates, nextPlacement, PEERS, bit, rng } from './sudoku.js';
import { dailyIndex } from './days.js';

/** The two inks: the first player's is Heidi's emerald, the second's a deep rose. */
export const INKS = ['#1d6b5f', '#9b3d5a'];
export const MAX_NAME = 20;
const CODE = { sketch: 's', study: 't', composition: 'c', masterpiece: 'm' };

/** A room code: four letters, none easily mistaken for another. */
export const CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export const isCode = (s) => typeof s === 'string' && s.length === 4 && [...s].every((c) => CODE_LETTERS.includes(c));
export function newCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < 4; i++) s += CODE_LETTERS[Math.floor(rand() * CODE_LETTERS.length)];
  return s;
}

export function cleanName(s) {
  const t = String(s ?? '').replace(/[^\p{L}\p{N} '’-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  return t || null;
}

const seedOf = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const shuffle = (xs, rnd) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/**
 * Today's pair puzzle at a level: the day's puzzle in disguise (numbers swapped round,
 * rows and columns shuffled within their bands, perhaps turned on its side). It needs
 * exactly the same thinking, but doesn't give away the solo daily, which does go to the
 * board. Key "p" + level letter + day, e.g. "pm27".
 */
export function pairKey(level, day) { return `p${CODE[level]}${day}`; }
export function pairFromKey(key) {
  const m = /^p([stcm])(\d{1,5})$/.exec(String(key));
  if (!m) return null;
  const level = LEVELS.find((l) => CODE[l] === m[1]);
  const day = Number(m[2]);
  const puzzle = disguise(PUZZLES[level][dailyIndex(level, day)], `${key}:together`);
  return { key, level, day, puzzle };
}

export function disguise(puzzle, seed) {
  const rnd = rng(seedOf(seed));
  const digits = [0, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rnd)];
  const lines = () => shuffle([0, 1, 2], rnd).flatMap((b) => shuffle([0, 1, 2], rnd).map((r) => b * 3 + r));
  const rows = lines(), cols = lines();
  const turn = rnd() < 0.5;
  const g = parse(puzzle);
  const out = new Array(81);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = g[rows[r] * 9 + cols[c]];
      out[turn ? c * 9 + r : r * 9 + c] = digits[v];
    }
  }
  return format(out);
}

/** Whose hand placed each square, as 81 characters ('0' a given or empty, '1' or '2'). */
export const encodeHands = (by) => Array.from(by, (x) => String(x || 0)).join('');
export const decodeHands = (s) => Int8Array.from({ length: 81 }, (_, i) => (s && /[12]/.test(s[i]) ? Number(s[i]) : 0));

/** One shared puzzle. */
export class PairGame {
  constructor({ key }) {
    const f = pairFromKey(key);
    if (!f) throw new Error('bad key');
    this.key = key;
    this.level = f.level;
    this.day = f.day;
    this.givens = parse(f.puzzle);
    this.solution = solve(this.givens);
    this.values = this.givens.slice();
    this.by = new Int8Array(81); // 1 or 2: which player placed it
    this.notes = new Int16Array(81);
    this.undo = [];
    this.hints = 0;
    this.pending = null; // Ziggy's hint, shown on both phones
    this.players = []; // [{ id, name, sel }]: seat 1 is players[0]
    this.done = false;
    this.secs = 0; // time on the clock, counted while anyone's connected
    this.n = 0; // goes up with every change
    this.last = null; // what just happened, for sounds and words on the other phone
  }

  /** Take a seat (or find yours again). Two at most. */
  join(id, name) {
    if (typeof id !== 'string' || !/^[\w-]{6,40}$/.test(id)) return { ok: false, why: 'bad' };
    let p = this.players.find((x) => x.id === id);
    if (!p) {
      if (this.players.length >= 2) return { ok: false, why: 'full' };
      p = { id, name: null, sel: -1 };
      this.players.push(p);
    }
    p.name = cleanName(name) || p.name || `Player ${this.players.indexOf(p) + 1}`;
    this.n++;
    return { ok: true, seat: this.players.indexOf(p) + 1 };
  }

  seatOf(id) { const i = this.players.findIndex((p) => p.id === id); return i < 0 ? 0 : i + 1; }

  snap() { return { v: this.values.slice(), b: Int8Array.from(this.by), n: Int16Array.from(this.notes) }; }
  push() { this.undo.push(this.snap()); if (this.undo.length > 300) this.undo.shift(); }

  /** A move from a seat. Returns { ok, why }. */
  apply(seat, m) {
    if (seat !== 1 && seat !== 2) return { ok: false, why: 'seat' };
    if (!m || typeof m !== 'object') return { ok: false, why: 'bad' };
    if (m.t === 'sel') {
      const i = Number.isInteger(m.i) && m.i >= -1 && m.i < 81 ? m.i : -1;
      this.players[seat - 1].sel = i;
      this.n++;
      return { ok: true, quiet: true };
    }
    if (this.done) return { ok: false, why: 'done' };
    const i = m.i, d = m.d;
    const cell = Number.isInteger(i) && i >= 0 && i < 81;
    const digit = Number.isInteger(d) && d >= 1 && d <= 9;
    let ev = null;
    switch (m.t) {
      case 'place': {
        if (!cell || !digit || this.givens[i]) return { ok: false, why: 'bad' };
        this.push();
        if (this.values[i] === d) { this.values[i] = 0; this.by[i] = 0; ev = { kind: 'erase', i }; break; }
        this.values[i] = d;
        this.by[i] = seat;
        this.notes[i] = 0;
        if (m.tidy !== false) for (const p of PEERS[i]) this.notes[p] &= ~bit(d);
        ev = { kind: 'place', i, d };
        break;
      }
      case 'note': {
        if (!cell || !digit || this.values[i]) return { ok: false, why: 'bad' };
        this.push();
        this.notes[i] ^= bit(d);
        ev = { kind: 'note', i, d };
        break;
      }
      case 'erase': {
        if (!cell || this.givens[i] || (!this.values[i] && !this.notes[i])) return { ok: false, why: 'bad' };
        this.push();
        this.values[i] = 0; this.by[i] = 0; this.notes[i] = 0;
        ev = { kind: 'erase', i };
        break;
      }
      case 'undo': {
        const s = this.undo.pop();
        if (!s) return { ok: false, why: 'empty' };
        this.values = s.v; this.by = s.b; this.notes = s.n;
        ev = { kind: 'undo' };
        break;
      }
      case 'fillNotes': {
        this.push();
        const cand = candidates(this.values);
        for (let j = 0; j < 81; j++) if (!this.values[j]) this.notes[j] = cand[j];
        ev = { kind: 'notes' };
        break;
      }
      case 'clearNotes': {
        this.push();
        this.notes = new Int16Array(81);
        ev = { kind: 'notes' };
        break;
      }
      case 'restart': {
        this.push();
        this.values = this.givens.slice();
        this.by = new Int8Array(81);
        this.notes = new Int16Array(81);
        ev = { kind: 'restart' };
        break;
      }
      case 'hint': return this.hint(seat);
      default: return { ok: false, why: 'bad' };
    }
    this.pending = null;
    this.changed(seat, ev);
    return { ok: true };
  }

  /** Ziggy: the first tap shows where to look (mistakes first), the second fills it in. */
  hint(seat) {
    const p = this.pending;
    if (p) {
      this.push();
      if (p.wrong) {
        for (const i of p.wrong) { this.values[i] = 0; this.by[i] = 0; }
        this.pending = null;
        this.changed(seat, { kind: 'cleared' });
        return { ok: true };
      }
      const [i, d] = p.h.place;
      this.values[i] = d; this.by[i] = seat; this.notes[i] = 0;
      for (const q of PEERS[i]) this.notes[q] &= ~bit(d);
      this.pending = null;
      this.changed(seat, { kind: 'reveal', i, d, h: p.h });
      return { ok: true };
    }
    const wrong = [];
    for (let i = 0; i < 81; i++) if (this.values[i] && !this.givens[i] && this.values[i] !== this.solution[i]) wrong.push(i);
    this.hints++;
    if (wrong.length) this.pending = { id: this.n + 1, wrong };
    else {
      const h = nextPlacement(this.values);
      if (!h) { this.changed(seat, { kind: 'stuck' }); return { ok: true }; }
      this.pending = { id: this.n + 1, h: plain(h) };
    }
    this.changed(seat, { kind: 'hint' });
    return { ok: true };
  }

  changed(seat, ev) {
    this.n++;
    this.last = ev ? { ...ev, seat, n: this.n } : null;
    if (this.values.every((v, i) => v === this.solution[i])) { this.done = true; this.pending = null; }
  }

  /** What each phone sees. */
  view() {
    return {
      key: this.key, level: this.level, day: this.day, n: this.n,
      givens: format(this.givens), values: format(this.values), by: encodeHands(this.by),
      notes: Array.from(this.notes), hints: this.hints, secs: Math.floor(this.secs), done: this.done,
      pending: this.pending, last: this.last, canUndo: this.undo.length > 0,
      players: this.players.map((p) => ({ name: p.name, sel: p.sel })),
    };
  }

  /** For keeping the room's game while both phones are asleep. */
  toJSON() {
    return {
      key: this.key, values: format(this.values), by: encodeHands(this.by), notes: Array.from(this.notes),
      hints: this.hints, secs: this.secs, done: this.done, players: this.players.map((p) => ({ id: p.id, name: p.name })),
      undo: this.undo.slice(-60).map((s) => [format(s.v), encodeHands(s.b), Array.from(s.n)]),
    };
  }

  static fromJSON(o) {
    const g = new PairGame({ key: o.key });
    g.values = parse(o.values);
    g.by = decodeHands(o.by);
    g.notes = Int16Array.from(o.notes || []);
    if (g.notes.length !== 81) g.notes = new Int16Array(81);
    g.hints = o.hints | 0;
    g.secs = Number(o.secs) || 0;
    g.done = !!o.done;
    g.players = (o.players || []).slice(0, 2).map((p) => ({ id: p.id, name: p.name, sel: -1 }));
    g.undo = (o.undo || []).map(([v, b, n]) => ({ v: parse(v), b: decodeHands(b), n: Int16Array.from(n) }));
    return g;
  }
}

// a hint as plain data (it goes down the wire)
function plain(h) { return JSON.parse(JSON.stringify(h)); }
