// Ziggy on the grid: when she gives a hint she strolls in from the nearest side and sits
// in an empty square beside the part of the grid to look at; when you carry on, she
// strolls off again. Drawn on a canvas laid over the grid that never takes a tap.
import { drawZiggy, ZIGGY_BOX } from './ziggy.js';

const WALK_MS = 950;
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (k) => 1 - Math.pow(1 - k, 3);

export class Walker {
  /** canvas: the overlay; grid: the grid element it sits over. */
  constructor(canvas, grid) {
    this.cv = canvas;
    this.grid = grid;
    this.ctx = canvas.getContext('2d');
    this.state = 'away'; // away | walking-in | sitting | walking-out
    this.seat = -1;
    this.x = 0; this.y = 0; // where she is, in cells (column, row of her square's centre)
    this.from = null; this.to = null; this.t0 = 0;
    this.face = 1; // 1 = facing right
    this.raf = 0;
  }

  /** Walk over and sit in this square (0–80). */
  sitAt(i) {
    if (i == null || i < 0) { this.leave(); return; }
    if (this.seat === i && this.state !== 'walking-out') return;
    const col = i % 9, row = Math.floor(i / 9);
    let from;
    if (this.state === 'away') from = { x: col <= 4 ? -1.2 : 10.2, y: row }; // in from the nearest side
    else from = { x: this.x, y: this.y };
    this.seat = i;
    this.go(from, { x: col, y: row }, 'walking-in');
  }

  leave() {
    if (this.state === 'away' || this.state === 'walking-out') return;
    this.seat = -1;
    this.go({ x: this.x, y: this.y }, { x: this.x <= 4 ? -1.4 : 10.4, y: this.y }, 'walking-out');
  }

  go(from, to, state) {
    this.from = from; this.to = to; this.state = state;
    this.t0 = performance.now();
    if (to.x !== from.x) this.face = to.x > from.x ? 1 : -1;
    if (reduceMotion()) { this.x = to.x; this.y = to.y; this.state = state === 'walking-out' ? 'away' : 'sitting'; }
    if (!this.raf) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  frame(now) {
    this.raf = 0;
    const g = this.grid.getBoundingClientRect();
    const c = this.cv.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    if (this.cv.width !== Math.round(c.width * dpr) || this.cv.height !== Math.round(c.height * dpr)) {
      this.cv.width = Math.round(c.width * dpr); this.cv.height = Math.round(c.height * dpr);
    }
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    if (this.state === 'away') return;
    let walking = this.state === 'walking-in' || this.state === 'walking-out';
    let k = 1;
    if (walking) {
      k = Math.min(1, (now - this.t0) / WALK_MS);
      // in: slowing to a stop; out: setting off slowly, then away
      const e = this.state === 'walking-out' ? k * k : ease(k);
      this.x = this.from.x + (this.to.x - this.from.x) * e;
      this.y = this.from.y + (this.to.y - this.from.y) * e;
      if (k >= 1) {
        this.state = this.state === 'walking-out' ? 'away' : 'sitting';
        walking = false;
        if (this.state === 'away') { ctx.clearRect(0, 0, c.width, c.height); return; }
      }
    }
    // draw her: about one square tall, paws on the bottom of her square
    const cell = g.width / 9;
    const B = ZIGGY_BOX;
    const s = (cell * 0.98) / (B.bottom - B.top);
    const cx = g.left - c.left + (this.x + 0.5) * cell;
    const foot = g.top - c.top + (this.y + 1) * cell - cell * 0.04;
    const bob = walking ? -Math.abs(Math.sin(k * Math.PI * 7)) * cell * 0.07 : 0;
    ctx.save();
    ctx.translate(cx, foot + bob);
    // she faces the way she's walking, then looks at the hint
    ctx.scale(this.face, 1);
    if (walking) ctx.rotate(Math.sin(k * Math.PI * 7) * 0.05);
    // a soft shadow
    ctx.fillStyle = 'rgba(40,30,20,0.16)';
    ctx.beginPath(); ctx.ellipse(0, -1, cell * 0.36, cell * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    const t = now / 1000;
    const blink = !walking && (t % 3.4) < 0.14;
    drawZiggy(ctx, -((B.right + B.left) / 2) * s, -B.bottom * s, s, { t, blink, body: true });
    ctx.restore();
    // keep going while she walks, swishes her tail and blinks
    this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }

  /** Off the grid at once (leaving a puzzle). */
  hide() {
    this.state = 'away'; this.seat = -1;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.cv.width, this.cv.height);
  }
}

/**
 * Where to sit: an empty square next to the squares the hint is about (not one of them,
 * and not one with notes if there's a choice), as close as possible. When nothing empty
 * is near (a nearly finished grid), a filled square will do, but never one in the same
 * row, column or box as the hint's target, so she hides nothing that matters.
 */
export function seatNear(values, notes, region, avoid, target = region[region.length - 1]) {
  const rc = (i) => [Math.floor(i / 9), i % 9];
  const box = (i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
  const near = (i) => Math.min(...region.map((j) => { const [a, b] = rc(i), [c, d] = rc(j); return Math.max(Math.abs(a - c), Math.abs(b - d)); }));
  const [tr, tc] = rc(target);
  let best = -1, bestScore = Infinity;
  for (let i = 0; i < 81; i++) {
    if (avoid.has(i)) continue;
    let score = near(i) * 10 + (notes[i] ? 5 : 0) + i / 100;
    if (values[i]) {
      const [r, c] = rc(i);
      if (r === tr || c === tc || box(i) === box(target)) continue;
      score += 25;
    }
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return best;
}
