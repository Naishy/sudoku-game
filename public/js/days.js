// The levels, today's puzzles and the scoring. No DOM.
import { PUZZLES } from './puzzles.js';
import { LEVELS } from './sudoku.js';

// Four levels, named like the stages of a painting. Par is the time (minutes) a keen
// player might take: faster scores more, slower scores less, never below half.
export const LEVEL_INFO = {
  sketch: { name: 'Sketch', blurb: 'Gentle. Every number can be found by looking.', dots: 1, base: 100, par: 8 },
  study: { name: 'Study', blurb: 'A little thinking: pairs and pointing.', dots: 2, base: 200, par: 12 },
  composition: { name: 'Composition', blurb: 'Hard. Triples and X-Wings.', dots: 3, base: 350, par: 20 },
  masterpiece: { name: 'Masterpiece', blurb: 'Fiendish. XY-Wings and swordfish.', dots: 4, base: 500, par: 30 },
};
export { LEVELS };

export const CFG = {
  HINT_COST: 0.12, // each hint takes 12% off (up to half)
  MIN_FACTOR: 0.5, // slow is fine: never less than half the level's points
  MAX_FACTOR: 2, // twice as fast as par doubles them
};

// Day 0 is 1 November 2026, in the phone's own time zone.
const EPOCH = Date.UTC(2026, 10, 1);
export function dayNumber(now = new Date()) {
  return Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - EPOCH) / 86400000);
}
export function dateOfDay(day) {
  const d = new Date(EPOCH + day * 86400000);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** A puzzle's key: the level's letter + bank index, e.g. "t12" (Study No. 12). */
export const CODE = { sketch: 's', study: 't', composition: 'c', masterpiece: 'm' };
export const keyOf = (level, index) => `${CODE[level]}${index}`;
export function fromKey(key) {
  const level = LEVELS.find((l) => CODE[l] === key[0]);
  const index = Number(key.slice(1));
  if (!level || !Number.isInteger(index) || !PUZZLES[level][index]) return null;
  return { level, index, puzzle: PUZZLES[level][index] };
}

/** Today's puzzle at a level: the same for everyone, all day. */
export function dailyIndex(level, day) {
  const n = PUZZLES[level].length;
  return ((day % n) + n) % n;
}

/** Another puzzle at this level (not a daily one for a long while), skipping any done. */
export function extraIndex(level, day, done) {
  const n = PUZZLES[level].length;
  for (let k = 1; k < n; k++) {
    const i = n - k;
    if (i === dailyIndex(level, day)) continue;
    if (!done.has(keyOf(level, i))) return i;
  }
  return (dailyIndex(level, day) + 1) % n;
}

/** Points for a solve: the level's points, scaled by speed, less a bit per hint. */
export function scoreFor(level, secs, hints = 0) {
  const info = LEVEL_INFO[level];
  const t = Math.max(30, secs);
  const speed = Math.min(CFG.MAX_FACTOR, Math.max(CFG.MIN_FACTOR, (info.par * 60) / t));
  const help = Math.max(0.5, 1 - CFG.HINT_COST * hints);
  return Math.round(info.base * speed * help);
}

export function clock(secs) {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export function longTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  if (m === 0) return `${s} seconds`;
  if (m >= 60) return `${Math.floor(m / 60)} h ${m % 60} min`;
  return s ? `${m} min ${s} s` : `${m} min`;
}
