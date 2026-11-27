// Ziggy on the move. On the grid: when she gives a hint she strolls in from the nearest
// side (side on, legs going) and sits in an empty square beside the part of the grid to
// look at; when you carry on, she strolls off again. Drawn on a canvas laid over the grid
// that never takes a tap. Elsewhere (today's page, a finished work) a Stroll brings her in
// to sit somewhere, and she purrs when you tap her.
import { drawZiggy, drawZiggyWalking, ZIGGY_BOX, ZIGGY_WALK_BOX } from './ziggy.js';

const WALK_MS = 950;
const TURN_MS = 220; // turning from walking to sitting, and back
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (k) => 1 - Math.pow(1 - k, 3);
const sizeCanvas = (cv) => {
  const c = cv.getBoundingClientRect();
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(c.width * dpr) || cv.height !== Math.round(c.height * dpr)) {
    cv.width = Math.round(c.width * dpr); cv.height = Math.round(c.height * dpr);
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, c.width, c.height);
  return c;
};

/**
 * Ziggy at (cx, foot), `size` px tall when sitting (the same scale when walking). `sit` is
 * 0 for walking side on, 1 for sitting facing you, and in between while she turns.
 */
export function drawCat(ctx, cx, foot, size, { sit = 1, phase = 0, face = 1, t = 0, blink = false, look = 0, shadow = true } = {}) {
  const B = ZIGGY_BOX, W = ZIGGY_WALK_BOX;
  const s = size / (B.bottom - B.top);
  ctx.save();
  ctx.translate(cx, foot);
  if (shadow) {
    ctx.fillStyle = 'rgba(40,30,20,0.16)';
    const rx = size * (0.36 + (1 - sit) * 0.28);
    ctx.beginPath(); ctx.ellipse(0, -1, rx, size * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (sit < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - sit;
    ctx.scale(face, 1);
    drawZiggyWalking(ctx, -((W.right + W.left) / 2) * s, 0, s, { phase, t, blink, look });
    ctx.restore();
  }
  if (sit > 0) {
    ctx.save();
    ctx.globalAlpha *= sit;
    ctx.scale(face, 1);
    drawZiggy(ctx, -((B.right + B.left) / 2) * s, -B.bottom * s, s, { t, blink, body: true });
    ctx.restore();
  }
  ctx.restore();
}

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
    this.dist = 0; // how far she's walked, in cells: it sets her stride
    this.sat = 0; // when she sat down
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
    this.go({ x: this.x, y: this.y }, { x: this.x <= 4 ? -1.6 : 10.6, y: this.y }, 'walking-out');
  }

  go(from, to, state) {
    this.from = from; this.to = to; this.state = state;
    this.t0 = performance.now();
    this.dist = 0;
    if (to.x !== from.x) this.face = to.x > from.x ? 1 : -1;
    if (reduceMotion()) { this.x = to.x; this.y = to.y; this.state = state === 'walking-out' ? 'away' : 'sitting'; this.sat = 0; }
    if (!this.raf) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  frame(now) {
    this.raf = 0;
    const g = this.grid.getBoundingClientRect();
    const c = sizeCanvas(this.cv);
    if (this.state === 'away') return;
    const ctx = this.ctx;
    let walking = this.state === 'walking-in' || this.state === 'walking-out';
    if (walking) {
      const k = Math.min(1, (now - this.t0) / WALK_MS);
      // in: slowing to a stop; out: setting off slowly, then away
      const e = this.state === 'walking-out' ? k * k : ease(k);
      const nx = this.from.x + (this.to.x - this.from.x) * e;
      const ny = this.from.y + (this.to.y - this.from.y) * e;
      this.dist += Math.hypot(nx - this.x, ny - this.y);
      this.x = nx; this.y = ny;
      if (k >= 1) {
        this.state = this.state === 'walking-out' ? 'away' : 'sitting';
        this.sat = now;
        walking = false;
        if (this.state === 'away') { ctx.clearRect(0, 0, c.width, c.height); return; }
      }
    }
    // draw her: about one square tall, paws on the bottom of her square
    const cell = g.width / 9;
    const cx = g.left - c.left + (this.x + 0.5) * cell;
    const foot = g.top - c.top + (this.y + 1) * cell - cell * 0.04;
    // walking side on; when she arrives she turns and sits; setting off, she gets up first
    let sit = walking ? 0 : Math.min(1, (now - this.sat) / TURN_MS);
    if (this.state === 'walking-out') sit = Math.max(0, 1 - (now - this.t0) / TURN_MS);
    const t = now / 1000;
    const blink = sit === 1 && (t % 3.4) < 0.14;
    drawCat(ctx, cx, foot, cell * 0.98, { sit, phase: this.dist * Math.PI * 2 / 0.95, face: this.face, t, blink });
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
 * Ziggy strolling about a canvas of her own (today's page, a finished work): she walks in
 * from one side and sits at a spot; now and then she gets up and wanders to another; tap
 * her and she purrs. `seat(width)` gives the x to sit at; `size` is her sitting height (px).
 */
export class Stroll {
  constructor(canvas, { size = 70, seat = (w) => w / 2, wander = null, onTap = null } = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = size;
    this.seatOf = seat;
    this.wander = wander; // (width) => x to wander to, or null to stay put
    this.onTap = onTap;
    this.state = 'away';
    this.x = 0; this.face = 1; this.dist = 0;
    this.raf = 0; this.purrAt = -1e9; this.nextWander = 0;
    canvas.addEventListener('pointerdown', (e) => {
      if (this.state === 'away') return;
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      if (Math.abs(px - this.x) < this.size * 0.6 && py > r.height - this.size * 1.15) { this.purr(); this.onTap?.(); }
    });
  }

  /** In from a side (the one nearer her seat unless `from` says), to sit. */
  enter({ from = null, delay = 0 } = {}) {
    this.hide();
    const w = this.cv.getBoundingClientRect().width;
    if (!w) return;
    const to = this.seatOf(w);
    const side = from || (to > w / 2 ? 'right' : 'left');
    this.x = side === 'right' ? w + this.size : -this.size;
    this.state = 'waiting';
    const start = performance.now() + delay;
    if (reduceMotion()) { this.x = to; this.state = 'sitting'; this.sat = -1e9; }
    else this.walkTo(to, start);
    this.nextWander = start + 14000 + Math.random() * 12000;
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  walkTo(x, start = performance.now()) {
    this.from = this.x; this.to = x;
    this.face = x > this.x ? 1 : -1;
    this.t0 = start;
    this.ms = Math.max(600, Math.abs(x - this.x) / (this.size * 1.9) * 1000);
    this.dist = 0;
    this.state = 'waiting';
  }

  purr() {
    if (this.state !== 'sitting') return;
    this.purrAt = performance.now();
  }

  frame(now) {
    this.raf = 0;
    const c = sizeCanvas(this.cv);
    if (this.state === 'away' || !c.width) return;
    if (this.state === 'waiting' && now >= this.t0) this.state = 'walking';
    if (this.state === 'walking') {
      const k = Math.min(1, (now - this.t0) / this.ms);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const nx = this.from + (this.to - this.from) * e;
      this.dist += Math.abs(nx - this.x);
      this.x = nx;
      if (k >= 1) { this.state = 'sitting'; this.sat = now; this.nextWander = now + 16000 + Math.random() * 16000; }
    }
    if (this.state === 'waiting') { this.raf = requestAnimationFrame((t) => this.frame(t)); return; }
    // now and then she wanders somewhere else (not while purring)
    if (this.state === 'sitting' && this.wander && now > this.nextWander && now - this.purrAt > 4000 && !reduceMotion()) {
      this.walkTo(this.wander(c.width, this.x), now + TURN_MS);
      this.getUp = now;
    }
    const t = now / 1000;
    let sit = 0;
    if (this.state === 'sitting') sit = Math.min(1, (now - this.sat) / TURN_MS);
    else if (this.state === 'waiting' && this.getUp) sit = Math.max(0, 1 - (now - this.getUp) / TURN_MS);
    const purring = now - this.purrAt < 2600;
    const blink = sit === 1 && (purring || (t % 4.1) < 0.14);
    drawCat(this.ctx, this.x, c.height - 2, this.size, { sit, phase: this.dist / this.size * Math.PI * 2 / 0.62, face: this.face, t, blink });
    if (purring) drawPurr(this.ctx, this.x, c.height - this.size * 0.98, this.size, (now - this.purrAt) / 2600);
    this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }

  hide() {
    this.state = 'away'; this.getUp = 0;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.cv.width, this.cv.height);
  }
}

// a purr: soft curved lines rising beside her head and fading
function drawPurr(ctx, x, top, size, k) {
  ctx.save();
  ctx.strokeStyle = '#7a7166';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, size * 0.028);
  for (let i = 0; i < 3; i++) {
    const kk = k * 1.4 - i * 0.2;
    if (kk <= 0 || kk >= 1) continue;
    ctx.globalAlpha = Math.sin(kk * Math.PI) * 0.8;
    const yy = top + size * 0.1 - kk * size * 0.35;
    for (const side of [-1, 1]) {
      const xx = x + side * (size * 0.42 + kk * size * 0.08);
      ctx.beginPath();
      ctx.arc(xx, yy, size * 0.08, side > 0 ? -0.9 : Math.PI - 0.9, side > 0 ? 0.9 : Math.PI + 0.9);
      ctx.stroke();
    }
  }
  ctx.restore();
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
