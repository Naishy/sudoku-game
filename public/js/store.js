// What the phone remembers: puzzles in progress, the collection of works, the best
// score and the settings. All in localStorage under "gw.", kept small so an iPhone
// install can carry it across (see carry.js).

const K = { progress: 'gw.progress', works: 'gw.works', best: 'gw.best', settings: 'gw.settings', inducted: 'gw.inducted' };
export const KEYS = K;

const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* full or private */ } };
const json = (k, fallback) => { try { const v = JSON.parse(get(k)); return v ?? fallback; } catch { return fallback; } };

// --- settings ------------------------------------------------------------------------------
export const DEFAULTS = { mistakes: false, timer: true, colours: true, tidy: true, same: true, sound: true, haptics: true };
export function settings() { return { ...DEFAULTS, ...json(K.settings, {}) }; }
export function saveSettings(s) { set(K.settings, JSON.stringify(s)); }

// --- puzzles in progress ------------------------------------------------------------------
// { key: { v: '81 chars, . for empty (the player's numbers only)', n: '162 chars of notes', s: secs, h: hints, d: day } }
const NOTE = (m) => m.toString(36).padStart(2, '0');
export function encodeNotes(notes) { return Array.from(notes, NOTE).join(''); }
export function decodeNotes(s) {
  const out = new Int16Array(81);
  if (typeof s === 'string' && s.length === 162) for (let i = 0; i < 81; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 36) || 0;
  return out;
}
export function allProgress() { return json(K.progress, {}); }
export function progress(key) { return allProgress()[key] || null; }
export function saveProgress(key, p) {
  const all = allProgress();
  all[key] = p;
  // keep the most recent dozen
  const keys = Object.keys(all);
  if (keys.length > 12) for (const k of keys.sort((a, b) => (all[a].d ?? 0) - (all[b].d ?? 0)).slice(0, keys.length - 12)) delete all[k];
  set(K.progress, JSON.stringify(all));
}
export function clearProgress(key) { const all = allProgress(); delete all[key]; set(K.progress, JSON.stringify(all)); }

// --- the works ------------------------------------------------------------------------------
// One per finished puzzle: "key.day.secs.hints.score.palette" (numbers in base 36),
// joined with commas.
export function encodeWork(w) { return [w.key, w.day, w.secs, w.hints, w.score, w.palette].map((x, i) => (i ? Number(x).toString(36) : x)).join('.'); }
export function decodeWork(s) {
  const [key, ...rest] = String(s).split('.');
  const [day, secs, hints, score, palette] = rest.map((x) => parseInt(x, 36));
  if (!key || [day, secs, hints, score, palette].some((x) => !Number.isFinite(x))) return null;
  return { key, day, secs, hints, score, palette };
}
export function works() { return (get(K.works) || '').split(',').filter(Boolean).map(decodeWork).filter(Boolean); }
export function addWork(w) {
  const list = works().filter((x) => x.key !== w.key);
  list.push(w);
  set(K.works, list.map(encodeWork).join(','));
}
/** Two lists of works together: one per puzzle, the better score kept. */
export function mergeWorks(a, b) {
  const by = new Map();
  for (const w of [...a, ...b]) { const x = by.get(w.key); if (!x || w.score > x.score) by.set(w.key, w); }
  return [...by.values()].sort((x, y) => x.day - y.day);
}

// --- best and the guide ------------------------------------------------------------------
export function best() { return Number(get(K.best)) || 0; }
export function saveBest(n) { set(K.best, String(n)); }
export const inducted = () => get(K.inducted) === '1';
export const markInducted = () => set(K.inducted, '1');
