// The Sudoku engine: no DOM, so it runs in the game, the tests and the puzzle generator.
//
// A grid is 81 numbers, row by row, 0 for an empty square. Candidates are bit masks
// (bit d set = d is still possible), so "every number but 3 and 7" is a single number.
//
// Two solvers:
//  - countSolutions(): fast backtracking, to check a puzzle has exactly one answer.
//  - the human solver (grade(), nextStep()): solves the way a person does, one named
//    technique at a time, always trying the easiest first. The hardest technique a
//    puzzle needs sets its level, and the same steps give the hints.

export const LEVELS = ['sketch', 'study', 'composition', 'masterpiece'];

// --- the board ---------------------------------------------------------------------------
export const rowOf = (i) => (i / 9) | 0;
export const colOf = (i) => i % 9;
export const boxOf = (i) => ((rowOf(i) / 3) | 0) * 3 + ((colOf(i) / 3) | 0);

/** The 27 units: rows 0–8, columns 9–17, boxes 18–26, each a list of 9 squares. */
export const UNITS = [];
for (let r = 0; r < 9; r++) UNITS.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
for (let c = 0; c < 9; c++) UNITS.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
for (let b = 0; b < 9; b++) {
  const r0 = ((b / 3) | 0) * 3, c0 = (b % 3) * 3;
  UNITS.push(Array.from({ length: 9 }, (_, k) => (r0 + ((k / 3) | 0)) * 9 + c0 + (k % 3)));
}
export const unitsOf = (i) => [rowOf(i), 9 + colOf(i), 18 + boxOf(i)];
/** Every square's 20 peers: the squares sharing its row, column or box. */
export const PEERS = Array.from({ length: 81 }, (_, i) => {
  const s = new Set();
  for (const u of unitsOf(i)) for (const j of UNITS[u]) if (j !== i) s.add(j);
  return [...s];
});
const SEES = Array.from({ length: 81 }, (_, i) => { const a = new Uint8Array(81); for (const p of PEERS[i]) a[p] = 1; return a; });
export const sees = (a, b) => SEES[a][b] === 1;

export const ALL = 0b1111111110;
export const bit = (d) => 1 << d;
export const popcount = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
export const digitsOf = (m) => { const out = []; for (let d = 1; d <= 9; d++) if (m & (1 << d)) out.push(d); return out; };
const lowDigit = (m) => { for (let d = 1; d <= 9; d++) if (m & (1 << d)) return d; return 0; };

export function parse(s) {
  const g = new Array(81);
  for (let i = 0; i < 81; i++) { const ch = s[i]; g[i] = ch >= '1' && ch <= '9' ? ch.charCodeAt(0) - 48 : 0; }
  return g;
}
export const format = (g) => g.map((v) => (v ? String(v) : '.')).join('');

/** Squares that clash: the same number twice in a row, column or box. */
export function conflicts(g) {
  const bad = new Set();
  for (const u of UNITS) {
    const seen = new Map();
    for (const i of u) {
      if (!g[i]) continue;
      if (seen.has(g[i])) { bad.add(i); bad.add(seen.get(g[i])); } else seen.set(g[i], i);
    }
  }
  return bad;
}

/** Candidates for every empty square, from the numbers placed so far. */
export function candidates(g) {
  const cand = new Int16Array(81);
  for (let i = 0; i < 81; i++) {
    if (g[i]) continue;
    let m = ALL;
    for (const p of PEERS[i]) if (g[p]) m &= ~bit(g[p]);
    cand[i] = m;
  }
  return cand;
}

// --- the fast solver ---------------------------------------------------------------------
/** How many answers the grid has, counting up to `limit`; and the first answer found. */
export function countSolutions(grid, limit = 2) {
  const g = grid.slice();
  const R = new Int16Array(9), C = new Int16Array(9), B = new Int16Array(9);
  for (let i = 0; i < 81; i++) {
    const d = g[i];
    if (!d) continue;
    const m = bit(d), r = rowOf(i), c = colOf(i), b = boxOf(i);
    if ((R[r] | C[c] | B[b]) & m) return { count: 0, solution: null };
    R[r] |= m; C[c] |= m; B[b] |= m;
  }
  let count = 0;
  let solution = null;
  const rec = () => {
    let best = -1, bestMask = 0, bestN = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = ALL & ~(R[rowOf(i)] | C[colOf(i)] | B[boxOf(i)]);
      const n = popcount(m);
      if (n === 0) return;
      if (n < bestN) { best = i; bestMask = m; bestN = n; if (n === 1) break; }
    }
    if (best < 0) { count++; if (!solution) solution = g.slice(); return; }
    const r = rowOf(best), c = colOf(best), b = boxOf(best);
    for (let d = 1; d <= 9; d++) {
      const m = bit(d);
      if (!(bestMask & m)) continue;
      g[best] = d; R[r] |= m; C[c] |= m; B[b] |= m;
      rec();
      g[best] = 0; R[r] &= ~m; C[c] &= ~m; B[b] &= ~m;
      if (count >= limit) return;
    }
  };
  rec();
  return { count, solution };
}
export const solve = (g) => countSolutions(g, 1).solution;

/** A complete random grid (rnd: a function returning 0..1). */
export function randomFull(rnd) {
  const g = new Array(81).fill(0);
  const R = new Int16Array(9), C = new Int16Array(9), B = new Int16Array(9);
  const rec = (i) => {
    if (i === 81) return true;
    const r = rowOf(i), c = colOf(i), b = boxOf(i);
    const opts = digitsOf(ALL & ~(R[r] | C[c] | B[b]));
    for (let k = opts.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [opts[k], opts[j]] = [opts[j], opts[k]]; }
    for (const d of opts) {
      const m = bit(d);
      g[i] = d; R[r] |= m; C[c] |= m; B[b] |= m;
      if (rec(i + 1)) return true;
      g[i] = 0; R[r] &= ~m; C[c] &= ~m; B[b] &= ~m;
    }
    return false;
  };
  rec(0);
  return g;
}

// --- the human solver ----------------------------------------------------------------------
// Each technique looks at the grid and its candidates and returns one step, or null:
//   { tech, place: [square, digit] }          a number that must go somewhere
//   { tech, elim: [[square, mask], …] }       candidates it rules out
// plus `cells` (the squares that prove it) and `unit`/`digit` where that helps a hint.

export const TECHNIQUES = {
  nakedSingle: { level: 1, name: 'Only one number fits' },
  hiddenSingle: { level: 1, name: 'Only one place' },
  pointing: { level: 2, name: 'Pointing' },
  claiming: { level: 2, name: 'Box and line' },
  nakedPair: { level: 2, name: 'Pair' },
  hiddenPair: { level: 2, name: 'Hidden pair' },
  nakedTriple: { level: 3, name: 'Triple' },
  hiddenTriple: { level: 3, name: 'Hidden triple' },
  xWing: { level: 3, name: 'X-Wing' },
  nakedQuad: { level: 3, name: 'Quad' },
  hiddenQuad: { level: 3, name: 'Hidden quad' },
  xyWing: { level: 4, name: 'XY-Wing' },
  swordfish: { level: 4, name: 'Swordfish' },
  xyzWing: { level: 4, name: 'XYZ-Wing' },
};

const unitName = (u) => (u < 9 ? 'row' : u < 18 ? 'column' : 'box');

function positions(cand, unit, d) {
  const m = bit(d);
  const out = [];
  for (const i of UNITS[unit]) if (cand[i] & m) out.push(i);
  return out;
}

function* combos(arr, k, start = 0, pick = []) {
  if (pick.length === k) { yield pick.slice(); return; }
  for (let i = start; i <= arr.length - (k - pick.length); i++) {
    pick.push(arr[i]);
    yield* combos(arr, k, i + 1, pick);
    pick.pop();
  }
}

function nakedSingle(g, cand) {
  for (let i = 0; i < 81; i++) {
    if (!g[i] && popcount(cand[i]) === 1) return { tech: 'nakedSingle', place: [i, lowDigit(cand[i])], cells: [i] };
  }
  return null;
}

function hiddenSingle(g, cand) {
  // boxes first: that's where people look
  for (const u of [18, 19, 20, 21, 22, 23, 24, 25, 26, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]) {
    for (let d = 1; d <= 9; d++) {
      const p = positions(cand, u, d);
      if (p.length === 1) return { tech: 'hiddenSingle', place: [p[0], d], unit: u, digit: d, cells: [p[0]] };
    }
  }
  return null;
}

function elimStep(tech, elims, extra) {
  const e = elims.filter(([, m]) => m);
  return e.length ? { tech, elim: e, ...extra } : null;
}

function pointing(g, cand) {
  for (let b = 18; b < 27; b++) {
    for (let d = 1; d <= 9; d++) {
      const p = positions(cand, b, d);
      if (p.length < 2) continue;
      for (const [line, of] of [[rowOf, 0], [colOf, 9]]) {
        const l = line(p[0]);
        if (!p.every((i) => line(i) === l)) continue;
        const elims = UNITS[of + l].filter((i) => !p.includes(i) && cand[i] & bit(d)).map((i) => [i, bit(d)]);
        const s = elimStep('pointing', elims, { unit: b, digit: d, cells: p });
        if (s) return s;
      }
    }
  }
  return null;
}

function claiming(g, cand) {
  for (let u = 0; u < 18; u++) {
    for (let d = 1; d <= 9; d++) {
      const p = positions(cand, u, d);
      if (p.length < 2) continue;
      const b = boxOf(p[0]);
      if (!p.every((i) => boxOf(i) === b)) continue;
      const elims = UNITS[18 + b].filter((i) => !p.includes(i) && cand[i] & bit(d)).map((i) => [i, bit(d)]);
      const s = elimStep('claiming', elims, { unit: u, digit: d, cells: p });
      if (s) return s;
    }
  }
  return null;
}

function nakedSubset(k, tech) {
  return (g, cand) => {
    for (let u = 0; u < 27; u++) {
      const open = UNITS[u].filter((i) => !g[i] && popcount(cand[i]) >= 2 && popcount(cand[i]) <= k);
      if (open.length < k) continue;
      for (const set of combos(open, k)) {
        let m = 0;
        for (const i of set) m |= cand[i];
        if (popcount(m) !== k) continue;
        const elims = UNITS[u].filter((i) => !g[i] && !set.includes(i) && cand[i] & m).map((i) => [i, cand[i] & m]);
        const s = elimStep(tech, elims, { unit: u, cells: set });
        if (s) return s;
      }
    }
    return null;
  };
}

function hiddenSubset(k, tech) {
  return (g, cand) => {
    for (let u = 0; u < 27; u++) {
      const ds = [];
      for (let d = 1; d <= 9; d++) { const n = positions(cand, u, d).length; if (n >= 2 && n <= k) ds.push(d); }
      if (ds.length < k) continue;
      for (const set of combos(ds, k)) {
        const cells = new Set();
        for (const d of set) for (const i of positions(cand, u, d)) cells.add(i);
        if (cells.size !== k) continue;
        let keep = 0;
        for (const d of set) keep |= bit(d);
        const elims = [...cells].map((i) => [i, cand[i] & ~keep]);
        const s = elimStep(tech, elims, { unit: u, cells: [...cells] });
        if (s) return s;
      }
    }
    return null;
  };
}

function fish(size, tech) {
  return (g, cand) => {
    for (let d = 1; d <= 9; d++) {
      for (const [base, cover] of [[0, 9], [9, 0]]) { // rows as base, then columns
        const lines = [];
        for (let l = 0; l < 9; l++) {
          const p = positions(cand, base + l, d);
          if (p.length >= 2 && p.length <= size) lines.push(l);
        }
        if (lines.length < size) continue;
        const crossOf = base === 0 ? colOf : rowOf;
        for (const set of combos(lines, size)) {
          const cross = new Set();
          const cells = [];
          for (const l of set) for (const i of positions(cand, base + l, d)) { cross.add(crossOf(i)); cells.push(i); }
          if (cross.size !== size) continue;
          const elims = [];
          for (const x of cross) for (const i of UNITS[cover + x]) if (!cells.includes(i) && cand[i] & bit(d)) elims.push([i, bit(d)]);
          const s = elimStep(tech, elims, { digit: d, cells });
          if (s) return s;
        }
      }
    }
    return null;
  };
}

function xyWing(g, cand) {
  for (let p = 0; p < 81; p++) {
    if (g[p] || popcount(cand[p]) !== 2) continue;
    const [a, b] = digitsOf(cand[p]);
    const wings = PEERS[p].filter((i) => !g[i] && popcount(cand[i]) === 2 && popcount(cand[i] & cand[p]) === 1);
    for (const w1 of wings) {
      if (!(cand[w1] & bit(a))) continue;
      const c = lowDigit(cand[w1] & ~bit(a));
      for (const w2 of wings) {
        if (w2 === w1 || cand[w2] !== (bit(b) | bit(c))) continue;
        const elims = [];
        for (let i = 0; i < 81; i++) if (i !== p && i !== w1 && i !== w2 && !g[i] && cand[i] & bit(c) && sees(i, w1) && sees(i, w2)) elims.push([i, bit(c)]);
        const s = elimStep('xyWing', elims, { digit: c, cells: [p, w1, w2] });
        if (s) return s;
      }
    }
  }
  return null;
}

function xyzWing(g, cand) {
  for (let p = 0; p < 81; p++) {
    if (g[p] || popcount(cand[p]) !== 3) continue;
    const wings = PEERS[p].filter((i) => !g[i] && popcount(cand[i]) === 2 && (cand[i] & ~cand[p]) === 0);
    for (const [w1, w2] of combos(wings, 2)) {
      if ((cand[w1] | cand[w2]) !== cand[p] || cand[w1] === cand[w2]) continue;
      const z = lowDigit(cand[w1] & cand[w2]);
      if (!z) continue;
      const elims = [];
      for (let i = 0; i < 81; i++) if (i !== p && i !== w1 && i !== w2 && !g[i] && cand[i] & bit(z) && sees(i, p) && sees(i, w1) && sees(i, w2)) elims.push([i, bit(z)]);
      const s = elimStep('xyzWing', elims, { digit: z, cells: [p, w1, w2] });
      if (s) return s;
    }
  }
  return null;
}

// easiest first
const STEPS = [
  ['hiddenSingle', hiddenSingle], ['nakedSingle', nakedSingle],
  ['pointing', pointing], ['claiming', claiming], ['nakedPair', nakedSubset(2, 'nakedPair')], ['hiddenPair', hiddenSubset(2, 'hiddenPair')],
  ['nakedTriple', nakedSubset(3, 'nakedTriple')], ['hiddenTriple', hiddenSubset(3, 'hiddenTriple')], ['xWing', fish(2, 'xWing')],
  ['nakedQuad', nakedSubset(4, 'nakedQuad')], ['hiddenQuad', hiddenSubset(4, 'hiddenQuad')],
  ['xyWing', xyWing], ['swordfish', fish(3, 'swordfish')], ['xyzWing', xyzWing],
];

/** The easiest next step for this grid and these candidates (or null if stuck). */
export function findStep(g, cand, maxLevel = 4) {
  for (const [name, fn] of STEPS) {
    if (TECHNIQUES[name].level > maxLevel) break;
    const s = fn(g, cand);
    if (s) return s;
  }
  return null;
}

function apply(g, cand, s) {
  if (s.place) {
    const [i, d] = s.place;
    g[i] = d;
    cand[i] = 0;
    for (const p of PEERS[i]) cand[p] &= ~bit(d);
  } else {
    for (const [i, m] of s.elim) cand[i] &= ~m;
  }
}

/**
 * Solve like a person. Returns { solved, level (1–4, or 5 if it needs more than these
 * techniques), steps, uses: { technique: count } }.
 */
export function grade(puzzle, maxLevel = 4) {
  const g = puzzle.slice();
  const cand = candidates(g);
  let level = 1;
  let steps = 0;
  const uses = {};
  for (;;) {
    if (g.every((v) => v)) return { solved: true, level, steps, uses };
    const s = findStep(g, cand, maxLevel);
    if (!s) return { solved: false, level: 5, steps, uses };
    apply(g, cand, s);
    steps++;
    uses[s.tech] = (uses[s.tech] || 0) + 1;
    level = Math.max(level, TECHNIQUES[s.tech].level);
  }
}

/**
 * A hint for the grid as the player has it (their pencil marks aside): the next number
 * a person could place, found the easiest way, and the hardest technique it took to
 * get there. Returns { place: [square, digit], tech, unit, digit, cells } or null.
 */
export function nextPlacement(g0) {
  const g = g0.slice();
  const cand = candidates(g);
  let hardest = null;
  for (let n = 0; n < 400; n++) {
    const s = findStep(g, cand, 4);
    if (!s) return null;
    if (s.place) {
      if (!hardest || TECHNIQUES[s.tech].level >= TECHNIQUES[hardest.tech].level) return s;
      return { ...s, tech: hardest.tech, via: hardest };
    }
    if (!hardest || TECHNIQUES[s.tech].level > TECHNIQUES[hardest.tech].level) hardest = s;
    apply(g, cand, s);
  }
  return null;
}

export const describeUnit = (u) => `${unitName(u)} ${u < 18 ? (u % 9) + 1 : ''}`.trim();
export { unitName };

// --- making puzzles --------------------------------------------------------------------------
/** A seeded random number generator (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// For each level: the hardest technique allowed, and the fewest clues to leave
// (gentle puzzles keep more numbers so there's always something to find).
export const MAKE = {
  sketch: { level: 1, minClues: 36 },
  study: { level: 2, minClues: 28 },
  composition: { level: 3, minClues: 0 },
  masterpiece: { level: 4, minClues: 0 },
};

/**
 * Try to make one puzzle at a level: take clues away in symmetric pairs while it keeps
 * exactly one answer and stays within the level. Returns the puzzle string if its
 * hardest technique is exactly the level's, or null (most tries at the hard levels).
 */
export function makePuzzle(levelName, rnd) {
  const spec = MAKE[levelName];
  const full = randomFull(rnd);
  const g = full.slice();
  const order = [];
  for (let i = 0; i <= 40; i++) order.push(i);
  for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
  let clues = 81;
  for (const i of order) {
    const pair = i === 40 ? [40] : [i, 80 - i];
    if (clues - pair.length < spec.minClues) continue;
    const keep = pair.map((j) => g[j]);
    for (const j of pair) g[j] = 0;
    let ok = countSolutions(g, 2).count === 1;
    if (ok) ok = grade(g, spec.level).solved;
    if (ok) clues -= pair.length;
    else pair.forEach((j, k) => { g[j] = keep[k]; });
  }
  const r = grade(g, spec.level);
  if (!r.solved || r.level !== spec.level) return null;
  return format(g);
}
