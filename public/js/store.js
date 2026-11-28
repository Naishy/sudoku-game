// What the phone remembers: puzzles in progress, the collection of works, the best
// score and the settings. All in localStorage under "gw.", kept small so an iPhone
// install can carry it across (see carry.js).

const K = {
  progress: 'gw.progress', works: 'gw.works', best: 'gw.best', settings: 'gw.settings', inducted: 'gw.inducted',
  pairs: 'gw.pairs', name: 'gw.name', pid: 'gw.pid', pairing: 'gw.pairing',
};
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

// --- Together ---------------------------------------------------------------------------------
// Works painted with someone else: "key.secs.hints.me.hands.name1.name2" (numbers in base 36,
// hands packed three squares to a character, names URI-encoded). Kept apart from the solo
// works: they never go to the board or count towards the best.
const packHands = (h) => { let s = ''; for (let i = 0; i < 81; i += 3) s += (Number(h[i]) * 9 + Number(h[i + 1]) * 3 + Number(h[i + 2])).toString(36); return s; };
const unpackHands = (s) => { let h = ''; for (const ch of s) { const n = parseInt(ch, 36); h += `${Math.floor(n / 9)}${Math.floor(n / 3) % 3}${n % 3}`; } return h; };
export function encodePairWork(w) {
  return [w.key, w.secs.toString(36), w.hints.toString(36), w.me, packHands(w.hands), encodeURIComponent(w.names[0]), encodeURIComponent(w.names[1])].join('.');
}
export function decodePairWork(s) {
  const [key, secs, hints, me, hands, a, b] = String(s).split('.');
  const w = { key, secs: parseInt(secs, 36), hints: parseInt(hints, 36), me: Number(me), hands: unpackHands(hands || ''), pair: true };
  try { w.names = [decodeURIComponent(a ?? ''), decodeURIComponent(b ?? '')]; } catch { return null; }
  if (!/^p[stcm]\d+$/.test(key || '') || !Number.isFinite(w.secs) || !Number.isFinite(w.hints) || w.hands.length !== 81 || ![1, 2].includes(w.me)) return null;
  w.day = Number(key.slice(2));
  return w;
}
export function pairWorks() { return (get(K.pairs) || '').split(',').filter(Boolean).map(decodePairWork).filter(Boolean); }
export function addPairWork(w) {
  const list = pairWorks().filter((x) => x.key !== w.key);
  list.push(w);
  set(K.pairs, list.map(encodePairWork).join(','));
}
/** Two lists of pair works together, one per puzzle (the first kept). */
export function mergePairWorks(a, b) {
  const by = new Map();
  for (const w of [...a, ...b]) if (!by.has(w.key)) by.set(w.key, w);
  return [...by.values()].sort((x, y) => x.day - y.day);
}
export const myName = () => get(K.name) || '';
export const saveName = (n) => set(K.name, n);
/** This phone's id in a room. */
export function pairId() {
  let id = get(K.pid);
  if (!id) { id = `p${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`; set(K.pid, id); }
  return id;
}
/** The Together grid this phone is part of, if it isn't finished: { code, key, at }. */
export const pairing = () => json(K.pairing, null);
export const savePairing = (p) => (p ? set(K.pairing, JSON.stringify(p)) : (() => { try { localStorage.removeItem(K.pairing); } catch { /* fine */ } })());
