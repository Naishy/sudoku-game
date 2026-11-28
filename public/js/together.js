// Together: a phone's live link to its room (src/pair-room.js). It joins on every
// (re)connect, keeps the line open with a ping, and reconnects by itself when a phone
// sleeps or the wifi drops.
const wsBase = () => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/pair`;

export class PairLink {
  /**
   * code: the room's four letters; key: the puzzle (only when creating the room);
   * id, name: this phone. Callbacks: onState(view), onJoined(seat), onStatus('open' |
   * 'reconnecting' | 'gone' | 'full' | 'failed').
   */
  constructor({ code, key = null, create = false, id, name, onState, onJoined, onStatus }) {
    Object.assign(this, { code, key, create, id, name, onState, onJoined, onStatus });
    this.ws = null;
    this.tries = 0;
    this.everOpen = false;
    this.closed = false;
    this.timer = null;
    this.ping = setInterval(() => this.send({ t: 'ping' }), 25_000);
    this.onVisible = () => { if (document.visibilityState === 'visible' && !this.closed && (!this.ws || this.ws.readyState > 1)) this.connect(); };
    document.addEventListener('visibilitychange', this.onVisible);
    this.connect();
  }

  connect() {
    clearTimeout(this.timer);
    if (this.closed) return;
    const p = new URLSearchParams({ code: this.code });
    // only the very first connection creates the room; after that it's just rejoining
    if (this.create && !this.everOpen) { p.set('create', '1'); p.set('key', this.key); }
    let ws;
    try { ws = new WebSocket(`${wsBase()}?${p}`); } catch { this.retry(); return; }
    this.ws = ws;
    ws.onopen = () => {
      this.everOpen = true;
      this.tries = 0;
      ws.send(JSON.stringify({ t: 'join', id: this.id, name: this.name }));
    };
    ws.onmessage = (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === 'joined') { this.seat = m.seat; this.onStatus?.('open'); this.onJoined?.(m.seat); } else if (m.t === 'state') this.onState?.(m.view);
      else if (m.t === 'nope' && m.why === 'full') { this.close(); this.onStatus?.('full'); }
    };
    ws.onclose = () => {
      if (this.ws !== ws || this.closed) return;
      // never got in: no such room (or, creating, the code's taken)
      if (!this.everOpen) { this.close(); this.onStatus?.(this.create ? 'failed' : 'gone'); return; }
      this.onStatus?.('reconnecting');
      this.retry();
    };
  }

  retry() {
    this.tries++;
    // a room that's gone away for good stops answering: give up after a minute or so
    if (this.tries > 12) { this.close(); this.onStatus?.('gone'); return; }
    this.timer = setTimeout(() => this.connect(), Math.min(8000, 500 * 2 ** this.tries));
  }

  send(m) {
    if (this.ws?.readyState === 1) { this.ws.send(JSON.stringify(m)); return true; }
    return false;
  }

  close() {
    this.closed = true;
    clearTimeout(this.timer);
    clearInterval(this.ping);
    document.removeEventListener('visibilitychange', this.onVisible);
    try { this.ws?.close(); } catch { /* fine */ }
  }
}
