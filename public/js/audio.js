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
  // A purr, made the way a cat makes one: a buzz of about 25 pulses a second (each a
  // flutter of the voice box), rounded off and soft, in long breaths out and shorter
  // breaths in, a touch higher and quieter on the in-breath. A low sawtooth filtered
  // warm gives the flutter its rumble, which phone speakers can still play. No noise.
  purr(vol = 1) {
    if (!this.ok()) return;
    const c = this.ctx, t0 = this.now();
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.8;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70;
    const g = c.createGain(); g.gain.value = 0.0001;
    lp.connect(hp).connect(g).connect(this.out);
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.connect(lp);
    // out, in, out
    const breaths = [[0.95, 24, 0.55], [0.7, 27, 0.32], [0.95, 23.5, 0.5]];
    let t = t0;
    o.frequency.setValueAtTime(breaths[0][1], t);
    for (const [dur, hz, level] of breaths) {
      const v = level * vol;
      o.frequency.setTargetAtTime(hz, t, 0.05);
      g.gain.setTargetAtTime(v, t, 0.09);
      g.gain.setTargetAtTime(v * 0.75, t + dur * 0.5, 0.15);
      g.gain.setTargetAtTime(0.0001, t + dur - 0.14, 0.04);
      t += dur;
    }
    o.start(t0); o.stop(t + 0.3);
  }
  // A meow, made in code like the purr: a buzzy voice (a sawtooth) shaped by two formant
  // filters that slide from "ee" through "ah" to "oo" (mi-a-ow), its pitch rising then
  // falling, with a touch of wobble. 'meow' is the full one; 'mrrp' is the short, rising
  // chirrup a cat says hello with. `pitch` scales it so no two are quite the same.
  meow(kind = 'meow', pitch = 1, vol = 1) {
    if (!this.ok()) return 0;
    const c = this.ctx, t0 = this.now();
    const short = kind === 'mrrp';
    const dur = short ? 0.3 : 0.68;
    const o = c.createOscillator(); o.type = 'sawtooth';
    const vib = c.createOscillator(); vib.frequency.value = short ? 22 : 6; // a mrrp rolls
    const vg = c.createGain(); vg.gain.value = short ? 40 : 9;
    vib.connect(vg).connect(o.frequency);
    const f = (v) => v * pitch;
    const P = short ? [[0, 420], [0.55, 640], [1, 700]] : [[0, 560], [0.3, 820], [0.62, 700], [1, 430]];
    const F1 = short ? [[0, 400], [1, 750]] : [[0, 330], [0.35, 850], [0.7, 700], [1, 420]];
    const F2 = short ? [[0, 1800], [1, 1400]] : [[0, 2300], [0.35, 1400], [0.7, 1050], [1, 800]];
    const ramp = (param, pts, k = 1) => {
      param.setValueAtTime(pts[0][1] * k, t0);
      for (const [u, v] of pts.slice(1)) param.linearRampToValueAtTime(v * k, t0 + u * dur);
    };
    ramp(o.frequency, P.map(([u, v]) => [u, f(v)]));
    const g = c.createGain(); g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.32 * vol, t0 + (short ? 0.03 : 0.06));
    g.gain.setTargetAtTime(0.24 * vol, t0 + dur * 0.4, 0.1);
    g.gain.setTargetAtTime(0.0001, t0 + dur - (short ? 0.06 : 0.14), 0.04);
    for (const [pts, q, lvl] of [[F1, 5, 1], [F2, 7, 0.55]]) {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
      ramp(bp.frequency, pts, pitch);
      const lg = c.createGain(); lg.gain.value = lvl;
      o.connect(bp).connect(lg).connect(g);
    }
    g.connect(this.out);
    o.start(t0); vib.start(t0); o.stop(t0 + dur + 0.3); vib.stop(t0 + dur + 0.3);
    return dur;
  }
  hint() { if (this.ok()) { const t = this.now(); this.mallet(ROOT + 19, t, 0.12); this.mallet(ROOT + 24, t + 0.1, 0.1); } }
  finish() {
    if (!this.ok()) return;
    const t = this.now();
    [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => this.mallet(ROOT + n, t + i * 0.09, 0.16));
    [0, 4, 7, 12].forEach((n) => this.tone(ROOT + n - 12, t + 0.7, 2.4, 0.05));
  }
}
