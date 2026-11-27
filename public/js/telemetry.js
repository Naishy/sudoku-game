// Anonymous gameplay logging for the pilot: what happened, when, and how close.
// Sent in batches to POST /api/log. Nothing personal: a random id per phone and
// per visit, the screen size and browser. Off with ?notelemetry; off locally unless ?telemetry.
export const VERSION = 'v15'; // keep in step with VERSION in sw.js

const DEVICE_KEY = 'gw.device';
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export class Telemetry {
  constructor() {
    const p = new URLSearchParams(location.search);
    this.enabled = p.has('telemetry') || (!p.has('notelemetry') && location.protocol === 'https:');
    this.sid = rid();
    this.did = null;
    try {
      this.did = localStorage.getItem(DEVICE_KEY);
      if (!this.did) { this.did = rid(); localStorage.setItem(DEVICE_KEY, this.did); }
    } catch { this.did = this.sid; }
    this.t0 = performance.now();
    this.n = 0;
    this.buf = [];
    if (!this.enabled) return;
    setInterval(() => this.flush(), 10_000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.flush(true); });
    window.addEventListener('pagehide', () => this.flush(true));
  }

  log(type, d = null) {
    if (!this.enabled) return;
    this.buf.push({ n: this.n++, t: Math.round((performance.now() - this.t0) / 10) / 100, type, d });
    if (this.buf.length >= 150) this.flush();
  }

  flush(leaving = false) {
    if (!this.enabled || !this.buf.length) return;
    const body = JSON.stringify({ sid: this.sid, did: this.did, v: VERSION, events: this.buf.splice(0, 200) });
    try {
      if (leaving && navigator.sendBeacon) navigator.sendBeacon('/api/log', new Blob([body], { type: 'application/json' }));
      else fetch('/api/log', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
    } catch { /* never let logging break the game */ }
  }
}
