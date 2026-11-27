// Ziggy on the move. On the grid: when she gives a hint she strolls in from the nearest
// side (side on, legs going) and sits in an empty square beside the part of the grid to
// look at; when you carry on, she strolls off again. Leave the grid alone for a while and
// she comes and curls up on it for a nap, till you touch anything. Drawn on a canvas laid
// over the grid that never takes a tap. Elsewhere (today's page) a Stroll brings her in to
// sit somewhere; she washes, wanders, dozes off, and purrs when you tap her.
import { drawZiggy, drawZiggyWalking, drawZiggySleeping, drawZzz, ZIGGY_BOX, ZIGGY_WALK_BOX } from './ziggy.js';

const WALK_MS = 950;
const PURR_MS = 2600; // a purr: the sound, the closed eyes and the little lines
const TURN_MS = 220; // turning from walking to sitting, and back
const LIE_MS = 700; // curling up to sleep, and sitting up again
const GROOM_MS = 4200; // one wash: a paw licked, or a face wiped
const ZZZ_AFTER = 1500; // asleep this long before the z's start
const rand = (a, b) => a + Math.random() * (b - a);
/**
 * A meow, now and then: `o.onMeow(kind)` plays it (and says how long it lasts, in
 * seconds) after `delay` ms, and her mouth opens with it. See mouthAt.
 */
function startMeow(o, kind, delay = 0, play = o.onMeow) {
  if (!play) return;
  o.meowAt = performance.now() + delay; o.meowMs = kind === 'mrrp' ? 300 : 680;
  setTimeout(() => { const d = play(kind); if (d) o.meowMs = d * 1000; }, delay);
}
/** How far open her mouth is (0 to 1) for a meow under way. */
function mouthAt(o, now) {
  const k = (now - (o.meowAt ?? -1e9)) / (o.meowMs || 1);
  return k > 0 && k < 1 ? Math.pow(Math.sin(k * Math.PI), 0.6) : 0;
}
/** How far curled up she is (0 sitting, 1 asleep), easing between the two. */
function lieAt(o, now) {
  const k = Math.min(1, Math.max(0, (now - o.lieT0) / LIE_MS));
  return o.lieFrom + (o.lieTo - o.lieFrom) * (k * k * (3 - 2 * k));
}
function setLie(o, to, now, start = now) {
  o.lieFrom = lieAt(o, now); o.lieTo = to; o.lieT0 = start;
}
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
export function drawCat(ctx, cx, foot, size, { sit = 1, phase = 0, face = 1, t = 0, blink = false, look = 0, shadow = true, lie = 0, groom = null, meow = 0 } = {}) {
  const B = ZIGGY_BOX, W = ZIGGY_WALK_BOX;
  const s = size / (B.bottom - B.top);
  ctx.save();
  ctx.translate(cx, foot);
  if (shadow) {
    ctx.fillStyle = 'rgba(40,30,20,0.16)';
    const rx = size * (0.36 + (1 - sit) * 0.28 + lie * 0.14);
    ctx.beginPath(); ctx.ellipse(0, -1, rx, size * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (sit < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - sit;
    ctx.scale(face, 1);
    drawZiggyWalking(ctx, -((W.right + W.left) / 2) * s, 0, s, { phase, t, blink, look });
    ctx.restore();
  }
  if (sit > 0 && lie < 1) {
    ctx.save();
    ctx.globalAlpha *= sit * (1 - lie);
    ctx.scale(face, 1);
    drawZiggy(ctx, -((B.right + B.left) / 2) * s, -B.bottom * s, s, { t, blink, body: true, groom, meow });
    ctx.restore();
  }
  if (sit > 0 && lie > 0) {
    ctx.save();
    ctx.globalAlpha *= sit * lie;
    ctx.scale(face, 1);
    drawZiggySleeping(ctx, -((B.right + B.left) / 2) * s, -B.bottom * s, s, { t });
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
    this.purrAt = -1e9;
    this.leaveTimer = 0;
    this.raf = 0;
    this.napping = false; // she came to sleep, not to point at a hint
    this.lieFrom = 0; this.lieTo = 0; this.lieT0 = 0;
    this.groomAt = -1e9; this.groomKind = 'paw'; this.nextGroom = 0;
    this.onMeow = null; // (kind) => seconds: plays a meow
    this.onLeave = null; // called once she's walked out of the grid
    this.goneTimer = 0;
  }

  /** Asleep (or curling up, or still waking): anything you do should wake her. */
  get asleep() { return this.napping || this.lieTo > 0 || lieAt(this, performance.now()) > 0; }

  /** A purr where she sits (she stays put till it's done). */
  purr() {
    if (this.state !== 'sitting') return;
    this.purrAt = performance.now();
    this.groomAt = -1e9;
    if (!this.raf) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  /** Walk over and sit in this square (0–80). */
  sitAt(i) {
    if (i == null || i < 0) { this.leave(); return; }
    clearTimeout(this.leaveTimer);
    clearTimeout(this.goneTimer);
    this.onLeave = null;
    if (this.seat === i && this.state !== 'walking-out') return;
    this.napping = false;
    const col = i % 9, row = Math.floor(i / 9);
    let from;
    if (this.state === 'away') from = { x: col <= 4 ? -1.2 : 10.2, y: row }; // in from the nearest side
    else from = { x: this.x, y: this.y };
    this.seat = i;
    this.go(from, { x: col, y: row }, 'walking-in');
  }

  /** Stroll over to this square (0–80) and curl up on it for a nap. */
  nap(i) {
    if (this.state !== 'away' || i == null || i < 0) return;
    this.sitAt(i);
    this.napping = true;
    if (this.state === 'sitting') setLie(this, 1, performance.now()); // no walking with reduced motion
  }

  leave() {
    this.napping = false;
    if (this.state === 'away' || this.state === 'walking-out') return;
    // mid-purr, she finishes it first
    const left = PURR_MS - (performance.now() - this.purrAt);
    if (this.state === 'sitting' && left > 0) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = setTimeout(() => this.leave(), left);
      return;
    }
    this.seat = -1;
    this.go({ x: this.x, y: this.y }, { x: this.x <= 4 ? -1.6 : 10.6, y: this.y }, 'walking-out');
    // whatever goes with her (her words) goes once she's out of sight
    const cb = this.onLeave; this.onLeave = null;
    if (cb) { clearTimeout(this.goneTimer); this.goneTimer = setTimeout(cb, reduceMotion() ? 1500 : WALK_MS); }
  }

  go(from, to, state) {
    const now = performance.now();
    this.from = from; this.to = to; this.state = state;
    this.t0 = now;
    this.groomAt = -1e9;
    // asleep, she sits up first (and stretches) before she goes anywhere
    const lie = lieAt(this, now);
    if (lie > 0 || this.lieTo > 0) {
      const up = LIE_MS * Math.max(lie, 0.3);
      this.t0 = now + up + 250; setLie(this, 0, now);
      // woken from a nap, she sometimes says so (a grumbly little mrrp) before she goes
      if (lie > 0.9 && Math.random() < 0.3) { startMeow(this, 'mrrp', up * 0.7); this.t0 += 350; }
    }
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
      const k = Math.max(0, Math.min(1, (now - this.t0) / WALK_MS));
      // in: slowing to a stop; out: setting off slowly, then away
      const e = this.state === 'walking-out' ? k * k : ease(k);
      const nx = this.from.x + (this.to.x - this.from.x) * e;
      const ny = this.from.y + (this.to.y - this.from.y) * e;
      this.dist += Math.hypot(nx - this.x, ny - this.y);
      this.x = nx; this.y = ny;
      if (k >= 1) {
        this.state = this.state === 'walking-out' ? 'away' : 'sitting';
        this.sat = now;
        this.nextGroom = now + rand(7000, 11000);
        walking = false;
        if (this.state === 'away') { ctx.clearRect(0, 0, c.width, c.height); return; }
        if (this.napping) setLie(this, 1, now, now + 900); // a look round, then she curls up
      }
    }
    const lie = lieAt(this, now);
    const settled = this.state === 'sitting' && lie === 0 && !this.napping;
    // sitting beside a hint a while, she has a wash
    if (settled && now > this.nextGroom && now - this.purrAt > PURR_MS && !reduceMotion()) {
      this.groomAt = now; this.groomKind = Math.random() < 0.5 ? 'paw' : 'face';
      this.nextGroom = now + GROOM_MS + rand(9000, 15000);
    }
    const groom = settled && now - this.groomAt < GROOM_MS ? { kind: this.groomKind, k: (now - this.groomAt) / GROOM_MS } : null;
    // draw her: about one square tall, paws on the bottom of her square
    const cell = g.width / 9;
    const cx = g.left - c.left + (this.x + 0.5) * cell;
    const foot = g.top - c.top + (this.y + 1) * cell - cell * 0.04;
    // walking side on; when she arrives she turns and sits; setting off, she gets up first
    let sit = walking ? 0 : Math.min(1, (now - this.sat) / TURN_MS);
    if (this.state === 'walking-out') sit = Math.max(0, 1 - (now - this.t0) / TURN_MS);
    if (walking && now < this.t0) sit = 1; // still getting up
    const t = now / 1000;
    const purring = now - this.purrAt < PURR_MS;
    const blink = sit === 1 && (purring || (t % 3.4) < 0.14);
    drawCat(ctx, cx, foot, cell * 0.98, { sit, phase: this.dist * Math.PI * 2 / 0.95, face: this.face, t, blink, lie, groom, meow: mouthAt(this, now) });
    if (purring) drawPurr(ctx, cx, foot - cell * 0.98 * 0.98, cell * 0.98, (now - this.purrAt) / PURR_MS);
    if (lie === 1 && this.lieTo === 1 && now - this.lieT0 > LIE_MS + ZZZ_AFTER) drawZzz(ctx, cx + cell * 0.1, foot - cell * 0.5, cell, t);
    // keep going while she walks, swishes her tail and blinks
    this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }

  /** Off the grid at once (leaving a puzzle). */
  hide() {
    clearTimeout(this.leaveTimer);
    this.state = 'away'; this.seat = -1;
    this.napping = false; this.lieFrom = this.lieTo = 0;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.cv.width, this.cv.height);
  }
}

/**
 * Ziggy strolling about a canvas of her own (today's page): she walks in
 * from one side and sits at a spot; now and then she gets up and wanders to another; tap
 * her and she purrs. `seat(width)` gives the x to sit at; `size` is her sitting height (px).
 */
export class Stroll {
  constructor(canvas, { size = 70, seat = (w) => w / 2, wander = null, onTap = null, onMeow = null } = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = size;
    this.seatOf = seat;
    this.wander = wander; // (width) => x to wander to, or null to stay put
    this.onTap = onTap;
    this.onMeow = onMeow; // (kind, why) => seconds: plays a meow ('hello', 'woken', 'idle')
    this.state = 'away';
    this.x = 0; this.face = 1; this.dist = 0;
    this.raf = 0; this.purrAt = -1e9; this.nextWander = 0;
    this.lieFrom = 0; this.lieTo = 0; this.lieT0 = 0;
    this.groomAt = -1e9; this.groomKind = 'paw'; this.nextGroom = 0;
    canvas.addEventListener('pointerdown', (e) => {
      if (this.state === 'away') return;
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      if (Math.abs(px - this.x) < this.size * 0.75 && py > r.height - this.size * 1.15) {
        const woke = this.wake();
        let delay = woke ? LIE_MS : 0;
        // woken, she sometimes mrrps before the purr
        if (woke && Math.random() < 0.35) { this.meow('mrrp', 'woken', LIE_MS * 0.8); delay += 450; }
        this.purr(delay);
        this.onTap?.({ woke, delay });
      }
    });
  }

  /** Asleep (or nodding off)? */
  get asleep() { return this.lieTo > 0; }

  meow(kind, why, delay = 0) {
    if (this.onMeow) startMeow(this, kind, delay, (k) => this.onMeow(k, why));
  }

  /** Sit up, if she's asleep. Says whether she was. */
  wake() {
    if (!this.asleep) return false;
    const now = performance.now();
    setLie(this, 0, now);
    this.nextWander = now + rand(16000, 26000);
    this.nextSleep = now + rand(50000, 80000);
    this.nextGroom = now + rand(6000, 10000);
    return true;
  }

  /** Curl up for a nap where she sits. */
  sleep(now = performance.now()) {
    if (this.state !== 'sitting' || this.asleep) return;
    setLie(this, 1, now);
    this.groomAt = -1e9;
    this.wakeAt = now + rand(45000, 75000); // a cat nap
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
    this.nextGroom = start + rand(6000, 9000);
    // late at night she's soon asleep; otherwise after a while she may doze off
    const h = new Date().getHours();
    this.nextSleep = start + (h >= 22 || h < 6 ? rand(4000, 6000) : rand(30000, 50000));
    // very occasionally a hello when she arrives, and a meow about something later on
    this.greet = Math.random() < 0.2;
    this.nextMeow = Math.random() < 0.5 ? start + rand(25000, 90000) : Infinity;
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

  purr(delay = 0) {
    if (this.state !== 'sitting') return;
    this.purrAt = performance.now() + delay;
    this.groomAt = -1e9;
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
      if (k >= 1) {
        this.state = 'sitting'; this.sat = now;
        this.nextWander = now + 16000 + Math.random() * 16000;
        this.nextGroom = Math.max(this.nextGroom, now + rand(5000, 8000));
        if (this.greet) { this.greet = false; this.meow('mrrp', 'hello', 450); }
      }
    }
    if (this.state === 'waiting') { this.raf = requestAnimationFrame((t) => this.frame(t)); return; }
    const quiet = now - this.purrAt > 4000;
    if (this.state === 'sitting' && this.asleep) {
      if (now > this.wakeAt) this.wake(); // she wakes by herself in the end
    } else if (this.state === 'sitting' && quiet && now - this.groomAt > GROOM_MS && lieAt(this, now) === 0) {
      if (now > this.nextMeow) { this.nextMeow = Infinity; this.meow('meow', 'idle'); this.nextGroom = Math.max(this.nextGroom, now + 3000); this.nextWander = Math.max(this.nextWander, now + 3000); this.nextSleep = Math.max(this.nextSleep, now + 3000); }
      else if (now > this.nextSleep) this.sleep(now);
      // now and then she wanders somewhere else
      else if (this.wander && now > this.nextWander && !reduceMotion()) {
        this.walkTo(this.wander(c.width, this.x), now + TURN_MS);
        this.getUp = now;
      } else if (now > this.nextGroom && !reduceMotion()) { // or has a wash
        this.groomAt = now; this.groomKind = Math.random() < 0.5 ? 'paw' : 'face';
        this.nextGroom = now + GROOM_MS + rand(8000, 14000);
      }
    }
    const t = now / 1000;
    let sit = 0;
    if (this.state === 'sitting') sit = Math.min(1, (now - this.sat) / TURN_MS);
    else if (this.state === 'waiting' && this.getUp) sit = Math.max(0, 1 - (now - this.getUp) / TURN_MS);
    const purring = now >= this.purrAt && now - this.purrAt < PURR_MS;
    const blink = sit === 1 && (purring || (t % 4.1) < 0.14);
    const lie = this.state === 'sitting' ? lieAt(this, now) : 0;
    const groom = this.state === 'sitting' && lie === 0 && now - this.groomAt < GROOM_MS ? { kind: this.groomKind, k: (now - this.groomAt) / GROOM_MS } : null;
    const meow = this.state === 'sitting' && lie < 0.5 ? mouthAt(this, now) : 0;
    drawCat(this.ctx, this.x, c.height - 2, this.size, { sit, phase: this.dist / this.size * Math.PI * 2 / 0.62, face: this.face, t, blink: blink && !meow, lie, groom: meow ? null : groom, meow });
    if (purring) drawPurr(this.ctx, this.x, c.height - this.size * 0.98, this.size, (now - this.purrAt) / PURR_MS);
    if (lie === 1 && this.lieTo === 1 && now - this.lieT0 > LIE_MS + ZZZ_AFTER) drawZzz(this.ctx, this.x + this.size * 0.1, c.height - this.size * 0.5, this.size, t);
    this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }

  hide() {
    this.state = 'away'; this.getUp = 0;
    this.lieFrom = this.lieTo = 0; this.groomAt = -1e9;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.cv.width, this.cv.height);
  }
}

// a purr: soft curved lines rising beside her head and fading
export function drawPurr(ctx, x, top, size, k) {
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

/**
 * Where she naps when the grid's left alone: on a given number (she likes to be in the
 * way, but not too much), never the selected square or one in its row, column or box,
 * in a finished box, row or column if there is one, and away from the edges if she can. `pick` chooses among the candidates (random by default).
 */
export function napSeat(values, givens, sel, pick = (n) => Math.floor(Math.random() * n)) {
  const rc = (i) => [Math.floor(i / 9), i % 9];
  const box = (i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
  const clash = (i) => sel >= 0 && (i === sel || rc(i)[0] === rc(sel)[0] || rc(i)[1] === rc(sel)[1] || box(i) === box(sel));
  // best of all a finished box (nothing left to see there), then a finished row or column
  const done = (cells) => cells.every((j) => values[j]);
  const inBox = (i) => { const b0 = Math.floor(box(i) / 3) * 27 + (box(i) % 3) * 3; return [0, 1, 2, 9, 10, 11, 18, 19, 20].map((d) => b0 + d); };
  const inRow = (i) => Array.from({ length: 9 }, (_, c) => rc(i)[0] * 9 + c);
  const inCol = (i) => Array.from({ length: 9 }, (_, r) => r * 9 + rc(i)[1]);
  const inner = (i) => rc(i).every((v) => v > 0 && v < 8);
  for (const ok of [
    (i) => givens[i] && inner(i) && done(inBox(i)),
    (i) => givens[i] && done(inBox(i)),
    (i) => givens[i] && (done(inRow(i)) || done(inCol(i))),
    (i) => givens[i] && inner(i), (i) => givens[i], (i) => values[i],
  ]) {
    const c = [];
    for (let i = 0; i < 81; i++) if (ok(i) && !clash(i)) c.push(i);
    if (c.length) return c[pick(c.length)];
  }
  return -1;
}
