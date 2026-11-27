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
  // A meow, made in code like the purr, kept soft and round: a pure voice (a sine, with a
  // little triangle for warmth) through a gentle low-pass that opens and closes like a
  // mouth, "ee" to "ah" to "oo" (mi-a-ow). Its pitch rises then falls, with a slight
  // wobble; it swells in and fades out slowly. 'meow' is the full one; 'mrrp' is the short,
  // rising chirrup a cat says hello with, its roll a soft flutter in the loudness. `pitch`
  // scales it so no two are quite the same. No noise.
  meow(kind = 'meow', pitch = 1, vol = 1) {
    if (!this.ok()) return 0;
    const c = this.ctx, t0 = this.now();
    const short = kind === 'mrrp';
    const dur = short ? 0.32 : 0.7;
    const P = short ? [[0, 440], [0.6, 600], [1, 640]] : [[0, 520], [0.3, 700], [0.65, 620], [1, 430]];
    const MOUTH = short ? [[0, 900], [1, 1500]] : [[0, 900], [0.35, 1900], [0.75, 1300], [1, 800]];
    const ramp = (param, pts, k = 1) => {
      param.setValueAtTime(pts[0][1] * k, t0);
      for (const [u, v] of pts.slice(1)) param.linearRampToValueAtTime(v * k, t0 + u * dur);
    };
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2;
    ramp(lp.frequency, MOUTH, pitch);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07 * vol, t0 + (short ? 0.06 : 0.11));
    g.gain.setTargetAtTime(0.052 * vol, t0 + dur * 0.45, 0.12);
    g.gain.setTargetAtTime(0.0001, t0 + dur - (short ? 0.08 : 0.18), 0.06);
    lp.connect(g).connect(this.out);
    const vib = c.createOscillator(); vib.frequency.value = 5.5;
    const vg = c.createGain(); vg.gain.value = short ? 3 : 7;
    vib.connect(vg);
    const oscs = [];
    for (const [type, mult, level] of [['sine', 1, 1], ['triangle', 1, 0.35], ['sine', 2, 0.18]]) {
      const o = c.createOscillator(); o.type = type;
      ramp(o.frequency, P.map(([u, v]) => [u, v * pitch * mult]));
      vg.connect(o.frequency);
      const lg = c.createGain(); lg.gain.value = level;
      o.connect(lg).connect(lp);
      oscs.push(o);
    }
    if (short) { // the roll: a soft flutter in the loudness
      const roll = c.createOscillator(); roll.frequency.value = 26;
      const rg = c.createGain(); rg.gain.value = 0.018 * vol;
      roll.connect(rg).connect(g.gain);
      oscs.push(roll);
    }
    for (const o of [...oscs, vib]) { o.start(t0); o.stop(t0 + dur + 0.4); }
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
