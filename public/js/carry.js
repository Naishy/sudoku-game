// Keeping progress when the game is installed on an iPhone.
//
// A home-screen app on iOS gets its own storage, separate from Safari's, so it would
// start from scratch: the guide again, no works, no best score, signed out of the scoreboard.
// So while the game is open in Safari, the address it would be installed from carries
// a small snapshot of progress (?carry=…) and a scoreboard handoff token
// (?famhandoff=…), both in the page address and in the manifest's start address.
// Whichever iOS saves, the installed copy opens with it and merges it in.
//
// Import this module first: it restores before anything else reads storage.

import { decodeWork, encodeWork, mergeWorks } from './store.js';

const KEYS = ['gw.best', 'gw.inducted', 'gw.works', 'gw.giftSeen', 'gw.device', 'gw.settings'];
export const CARRY_MAX = 1800; // characters: room for the best, the settings and a month or so of works

function get(k) { try { return localStorage.getItem(k); } catch { return null; } }
function set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }

const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function encode(snapshot) { return b64(JSON.stringify(snapshot)); }
export function decode(text) {
  try {
    const o = JSON.parse(unb64(String(text)));
    return o && typeof o === 'object' ? o : null;
  } catch { return null; }
}

/** What to keep from a carried snapshot, given what this copy already has. */
export function merge(have, carried) {
  const out = {};
  const best = (v) => { try { return JSON.parse(v); } catch { return null; } };
  for (const k of KEYS) {
    const a = have[k] ?? null;
    const b = carried[k] ?? null;
    if (b === null || b === a) continue;
    if (k === 'gw.best') {
      if (Number(b) > Number(a ?? 0)) out[k] = b; // higher score wins
    } else if (k === 'gw.works') {
      const list = (s) => String(s ?? '').split(',').filter(Boolean).map(decodeWork).filter(Boolean);
      const merged = mergeWorks(list(a), list(b)).map(encodeWork).join(',');
      if (merged !== a) out[k] = merged; // every work from both, the better score kept
    } else if (k === 'gw.inducted' || k === 'gw.giftSeen') {
      if (b === '1') out[k] = '1'; // done stays done
    } else if (a === null) {
      out[k] = b; // device id, sound and vibration settings: only if not set here
    }
  }
  return out;
}

export function snapshot() {
  const o = {};
  for (const k of KEYS) { const v = get(k); if (v !== null) o[k] = v; }
  return o;
}

// --- restore, at load -------------------------------------------------------------------
const params = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
export const restored = (() => {
  const carried = params.get('carry') && decode(params.get('carry'));
  if (!carried) return null;
  const have = {};
  for (const k of KEYS) have[k] = get(k);
  const changes = merge(have, carried);
  for (const [k, v] of Object.entries(changes)) set(k, v);
  return Object.keys(changes);
})();

// --- keep the install address up to date (iPhone, in Safari) ----------------------------
export const installed = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let handoffToken = null;
export function setHandoff(token) { handoffToken = token || null; refreshInstallAddress(); }

/** Query string for the address an installed copy should open with. */
export function installQuery() {
  const p = new URLSearchParams();
  const c = encode(snapshot());
  if (c.length <= CARRY_MAX) p.set('carry', c);
  if (handoffToken) p.set('famhandoff', handoffToken);
  return p.toString();
}

/** Call after anything worth keeping changes (a work, a best score, the guide, the gift). */
export function refreshInstallAddress() {
  if (!isIOS() || installed()) return;
  const q = installQuery();
  const keep = new URLSearchParams(location.search);
  for (const k of ['carry', 'famhandoff']) keep.delete(k);
  const p = new URLSearchParams(`${keep}&${q}`);
  history.replaceState(null, '', `${location.pathname}?${p}${location.hash}`);
  const link = document.querySelector('link[rel="manifest"]');
  if (link) link.href = `app.webmanifest?${q}`;
}
