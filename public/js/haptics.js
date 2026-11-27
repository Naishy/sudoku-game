// Touch you can feel: a tick for each number, a double tap when a row, column or box
// is complete, and a flourish when the grid is done.
//
// Android: the Vibration API, with proper patterns.
// iPhone: web pages can't vibrate, but Safari (iOS 18 and later) gives a light tap of
// the Taptic Engine when an on/off switch is flipped. So on an iPhone each cue flips a
// hidden switch: one light tap, no patterns. It only works straight from a touch, so
// cues asked for during a touch are played as the finger lifts (main.js calls flush()).
const KEY = 'gw.haptics';

const isIOS = () => typeof navigator !== 'undefined'
  && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export class Haptics {
  constructor() {
    this.vibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    this.ios = !this.vibrate && isIOS();
    this.supported = this.vibrate || this.ios;
    this.enabled = true;
    try { this.enabled = localStorage.getItem(KEY) !== '0'; } catch { /* private mode */ }
    this.label = null;
    this.pending = false;
  }

  setEnabled(on) {
    this.enabled = on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* ignore */ }
    if (on) this.buzz([20, 40, 20]);
  }

  /** The hidden switch whose flip makes an iPhone tap. */
  iosTap() {
    if (!this.label) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      label.append(input);
      label.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
      label.setAttribute('aria-hidden', 'true');
      document.body.append(label);
      this.label = label;
    }
    this.label.click();
  }

  /** iPhone: play a tap asked for during this touch. Call from a pointerup or click. */
  flush() {
    if (!this.pending || !this.ios || !this.enabled) { this.pending = false; return; }
    this.pending = false;
    try { this.iosTap(); } catch { /* ignore */ }
  }

  buzz(pattern, { ios = true } = {}) {
    if (!this.supported || !this.enabled) return;
    try {
      if (this.vibrate) navigator.vibrate(pattern);
      else if (ios) this.pending = true;
    } catch { /* ignore */ }
  }

  // Android motors barely register under ~20 ms, so even the light cues are 18 ms and up.
  tap() { this.buzz(18); }
  place() { this.buzz(24); }
  note() { this.buzz(18, { ios: false }); }
  unit() { this.buzz([30, 50, 40]); }
  hint() { this.buzz([20, 40, 20]); }
  purr() { this.buzz([10, 30, 10, 30, 10, 30, 10, 30, 10]); }
  finish() { this.buzz([40, 70, 40, 70, 40, 70, 160]); }
}
