// Soft, wooden sounds, made in code (Web Audio): each number plays its own note of a
// marimba-like scale, a finished row or box plays a little run, a finished grid a chord.
// Nothing hisses: no noise at all.
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19]; // a major pentatonic, 1 to 9
const ROOT = 60; // middle C
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class Sound {
  constructor() { this.ctx = null; this.enabled = true; }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.out = this.ctx.createGain();
      this.out.gain.value = 0.5;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
      this.out.connect(lp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(m, t, dur, vol, type = 'sine') {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = hz(m);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // a struck bar: the note, a quiet fourth harmonic, a fast decay
  mallet(m, t, vol = 0.2) {
    this.tone(m, t, 0.55, vol);
    this.tone(m + 24, t, 0.12, vol * 0.18);
    this.tone(m + 12, t, 0.3, vol * 0.12, 'triangle');
  }

  ok() { if (!this.enabled) return false; this.unlock(); return !!this.ctx; }
  now() { return this.ctx.currentTime + 0.01; }

  place(d) { if (this.ok()) this.mallet(ROOT + SCALE[d - 1], this.now(), 0.22); }
  note() { if (this.ok()) this.mallet(ROOT + 24 + SCALE[4], this.now(), 0.06); }
  erase() { if (this.ok()) this.mallet(ROOT - 5, this.now(), 0.1); }
  tap() { if (this.ok()) this.mallet(ROOT + 28, this.now(), 0.05); }
  unit(d) {
    if (!this.ok()) return;
    const t = this.now() + 0.08;
    [0, 2, 4].forEach((k, i) => this.mallet(ROOT + 12 + SCALE[(d - 1 + k) % 9], t + i * 0.07, 0.12));
  }
  // a purr: a soft low hum, pulsing as a cat's does (no noise)
  purr() {
    if (!this.ok()) return;
    const c = this.ctx, t = this.now(), dur = 1.6;
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 96;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.25);
    g.gain.setValueAtTime(0.22, t + dur - 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const pulse = c.createGain(); pulse.gain.value = 0.5;
    const lfo = c.createOscillator(); lfo.frequency.value = 24;
    const depth = c.createGain(); depth.gain.value = 0.5;
    lfo.connect(depth).connect(pulse.gain);
    o.connect(pulse).connect(g).connect(this.out);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }
  hint() { if (this.ok()) { const t = this.now(); this.mallet(ROOT + 19, t, 0.12); this.mallet(ROOT + 24, t + 0.1, 0.1); } }
  finish() {
    if (!this.ok()) return;
    const t = this.now();
    [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => this.mallet(ROOT + n, t + i * 0.09, 0.16));
    [0, 4, 7, 12].forEach((n) => this.tone(ROOT + n - 12, t + 0.7, 2.4, 0.05));
  }
}
