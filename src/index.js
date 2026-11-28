// Grid Works Worker: serves the game (static assets) and records anonymous
// gameplay events at POST /api/log into D1, for tuning during the pilot.

const GAME = 'grid-works'; // board id: tags this game's rows in the shared stats database
const MAX_BODY = 200_000;
const MAX_EVENTS = 200;
const ID = /^[\w-]{6,40}$/;
const CODE = /^[A-HJKMNP-Z]{4}$/; // a Together room's code (see CODE_LETTERS in public/js/pair.js)

export { PairRoom } from './pair-room.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/log') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
      return logEvents(request, env);
    }
    if (url.pathname === '/api/pair') {
      // Together: a phone's live link to its room (src/pair-room.js)
      const code = url.searchParams.get('code');
      if (!CODE.test(code || '')) return new Response('Bad code', { status: 400 });
      if (!env.PAIRS) return new Response('Together is not set up here', { status: 503 });
      return env.PAIRS.get(env.PAIRS.idFromName(code)).fetch(request);
    }
    if (url.pathname === '/app.webmanifest') return manifest(request, env, url);
    return env.ASSETS.fetch(request);
  },
};

// The app manifest with a start address that carries progress and a scoreboard
// handoff (see public/js/carry.js): iPhone home-screen apps don't share Safari's
// storage, so this is how an installed copy keeps them.
async function manifest(request, env, url) {
  const res = await env.ASSETS.fetch(new Request(new URL('/manifest.webmanifest', url), request));
  const m = await res.json();
  const p = new URLSearchParams();
  const carry = url.searchParams.get('carry');
  if (carry && carry.length <= 1800 && /^[\w-]+$/.test(carry)) p.set('carry', carry);
  const handoff = url.searchParams.get('famhandoff');
  if (handoff && /^[A-Za-z0-9]{24}$/.test(handoff)) p.set('famhandoff', handoff);
  const q = p.toString();
  // Only when there's something to carry. Otherwise leave start_url out, so iOS
  // installs from the page's own address (which carry.js keeps up to date).
  if (q) m.start_url = `./?${q}`;
  return new Response(JSON.stringify(m), { headers: { 'content-type': 'application/manifest+json', 'cache-control': 'no-store' } });
}

// Pilot stats go in the shared family-telemetry database (see family-games/telemetry),
// one row per batch of events, tagged with this game's board id.
async function logEvents(request, env) {
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return new Response('Too large', { status: 413 });
    const { sid, did, v, events } = JSON.parse(text);
    if (typeof sid !== 'string' || !ID.test(sid) || !Array.isArray(events)) {
      return new Response('Bad request', { status: 400 });
    }
    if (!env.DB) return new Response(null, { status: 204 }); // no database bound (e.g. a preview)
    const device = typeof did === 'string' && ID.test(did) ? did : null;
    const now = new Date().toISOString();
    // One row per batch (type 'batch', data = the events as a JSON array), not one per
    // event: far fewer database writes (the free plan allows 100,000 a day across the
    // account). The event_rows view shows them one event per row.
    const list = events.slice(0, MAX_EVENTS).map((e) => ({
      n: Number.isFinite(e?.n) ? Math.trunc(e.n) : 0,
      t: Number.isFinite(e?.t) ? e.t : 0,
      type: String(e?.type ?? '').slice(0, 32),
      d: clipData(e?.d),
    }));
    const stmt = env.DB.prepare(
      'INSERT INTO events (game, device_id, session_id, seq, t, type, data, version, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    const rows = [];
    for (let i = 0; i < list.length; i += 100) {
      const chunk = list.slice(i, i + 100);
      rows.push(stmt.bind(GAME, device, sid, chunk[0].n, chunk[0].t, 'batch', JSON.stringify(chunk), v == null ? null : String(v).slice(0, 16), now));
    }
    if (rows.length) await env.DB.batch(rows);
    return new Response(null, { status: 204 });
  } catch {
    return new Response('Bad request', { status: 400 });
  }
}

// An event's detail, kept whole (so the batch stays valid JSON) unless it's huge.
function clipData(d) {
  const text = JSON.stringify(d ?? null);
  return text.length > 4000 ? { truncated: text.length } : d ?? null;
}
