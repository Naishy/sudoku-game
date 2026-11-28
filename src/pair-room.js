// One Together room: a Durable Object holding a shared puzzle (public/js/pair.js) and the
// two phones' live connections. Every change goes to both phones. The game is kept in the
// room's storage (a few writes a minute at most), so it survives both phones going to sleep;
// a room clears itself out two days after it was last used.
import { DurableObject } from 'cloudflare:workers';
import { PairGame, pairFromKey } from '../public/js/pair.js';

const SAVE_EVERY_MS = 8000;
const KEEP_MS = 2 * 24 * 3600 * 1000;

export class PairRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.game = null;
    this.socks = new Map(); // WebSocket -> player id (null until they've joined)
    this.since = 0; // when the clock last started (someone connected)
    this.saveTimer = null;
    ctx.blockConcurrencyWhile(async () => {
      const o = await ctx.storage.get('game');
      if (o) { try { this.game = PairGame.fromJSON(o); } catch { this.game = null; } }
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a websocket', { status: 426 });
    const key = url.searchParams.get('key');
    if (url.searchParams.get('create') === '1') {
      if (!pairFromKey(key)) return new Response('Bad puzzle', { status: 400 });
      if (this.game && this.socks.size) return new Response('Room in use', { status: 409 });
      this.game = new PairGame({ key });
      await this.ctx.storage.put('game', this.game.toJSON());
    }
    if (!this.game) return new Response('No such room', { status: 404 });
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    this.socks.set(server, null);
    server.addEventListener('message', (e) => this.onMessage(server, e.data));
    const gone = () => this.onClose(server);
    server.addEventListener('close', gone);
    server.addEventListener('error', gone);
    this.clock();
    await this.ctx.storage.setAlarm(Date.now() + KEEP_MS);
    return new Response(null, { status: 101, webSocket: client });
  }

  onMessage(ws, data) {
    let m;
    try { m = JSON.parse(data); } catch { return; }
    const g = this.game;
    if (!g) return;
    if (m.t === 'ping') return;
    if (m.t === 'join') {
      const r = g.join(m.id, m.name);
      if (!r.ok) { this.tell(ws, { t: 'nope', why: r.why }); return; }
      this.socks.set(ws, m.id);
      this.tell(ws, { t: 'joined', seat: r.seat });
      this.broadcast();
      this.saveSoon();
      return;
    }
    const seat = g.seatOf(this.socks.get(ws));
    if (!seat) return;
    this.clock();
    const r = g.apply(seat, m);
    if (!r.ok) { this.tell(ws, { t: 'nope', why: r.why, to: m.t }); return; }
    this.broadcast();
    if (!r.quiet) this.saveSoon();
    if (g.done) this.save();
  }

  onClose(ws) {
    const id = this.socks.get(ws);
    this.socks.delete(ws);
    const p = this.game?.players.find((x) => x.id === id);
    if (p && ![...this.socks.values()].includes(id)) p.sel = -1;
    this.clock();
    this.broadcast();
    if (!this.socks.size) this.save();
  }

  // the clock runs while anyone's connected and the puzzle isn't finished
  clock() {
    const g = this.game;
    if (!g) return;
    const now = Date.now();
    if (this.since) g.secs += (now - this.since) / 1000;
    this.since = this.socks.size && !g.done ? now : 0;
  }

  view() {
    this.clock();
    const v = this.game.view();
    const online = new Set(this.socks.values());
    v.players = v.players.map((p, i) => ({ ...p, online: online.has(this.game.players[i].id) }));
    return v;
  }

  tell(ws, msg) { try { ws.send(JSON.stringify(msg)); } catch { /* gone */ } }

  broadcast() {
    if (!this.game) return;
    const msg = JSON.stringify({ t: 'state', view: this.view() });
    for (const ws of this.socks.keys()) { try { ws.send(msg); } catch { /* gone */ } }
  }

  saveSoon() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => this.save(), SAVE_EVERY_MS);
  }

  save() {
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (!this.game) return;
    this.clock();
    this.ctx.storage.put('game', this.game.toJSON()).catch(() => {});
  }

  async alarm() {
    if (this.socks.size) { await this.ctx.storage.setAlarm(Date.now() + KEEP_MS); return; }
    this.game = null;
    await this.ctx.storage.deleteAll();
  }
}
