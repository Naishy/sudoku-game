// Ziggy, Ed and Heidi's cat, who shows you round and gives the hints (by sitting next to
// the right part of the grid, as cats do). Drawn in the family cast's style: (x, y) is the
// middle of the face, s the scale; a head is about 80 units tall at 1.
//
// Drawn from Tim's photo: a brown tabby with dark stripes, a white chin and chest, and
// white paws. (To add Ziggy to the family cast later, move this into family-games
// cast/people.js so every game draws her alike.)
const INK = '#2b1d14';
export const COAT = {
  fur: '#8c7b66', // warm grey-brown tabby
  dark: '#43372c', // the stripes
  white: '#f1ece4', // chin, chest and paws
  ear: '#e2a29c',
  eyes: '#b8c14a',
  nose: '#d99a95',
};

function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
function fs(ctx, fill, stroke = INK, lw = 3) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function stripe(ctx, pts, w = 4) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
  ctx.strokeStyle = COAT.dark; ctx.lineWidth = w; ctx.stroke();
}

/** The size of Ziggy sitting, in her own units: for fitting her into a box. */
export const ZIGGY_BOX = { left: -52, right: 74, top: -48, bottom: 104 };

/**
 * Where her paw goes while she washes: `kind` is 'paw' (licking it) or 'face' (wiping it
 * over her cheek and ear); k runs 0 to 1 over one wash. Lift eases the paw up and back down.
 */
export function groomPose(kind, k, t = 0) {
  const lift = Math.min(1, k / 0.14, (1 - k) / 0.14);
  const L = lift * lift * (3 - 2 * lift);
  if (kind === 'face') {
    const u = (1 - Math.cos(Math.max(0, k - 0.14) / 0.72 * Math.PI * 2 * 3)) / 2; // three wipes
    return { lift: L, px: 22 + u * 10, py: 14 - u * 36, tilt: 0.2 * L, tongue: 0 };
  }
  return { lift: L, px: 17, py: 27 + Math.sin(t * 9) * 2, tilt: -0.1 * L, tongue: L > 0.9 && Math.sin(t * 9) > 0 ? 1 : 0 };
}

export function drawZiggy(ctx, x, y, s = 1, { t = 0, blink = false, body = true, groom = null, meow = 0 } = {}) {
  const C = COAT;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (body) {
    // the tail, curled round to the front, in rings with a dark tip
    const tail = () => { ctx.beginPath(); ctx.moveTo(30, 94); ctx.bezierCurveTo(72, 98, 74, 60 + Math.sin(t * 2) * 4, 54, 42); };
    tail(); ctx.strokeStyle = INK; ctx.lineWidth = 17; ctx.stroke();
    tail(); ctx.strokeStyle = C.fur; ctx.lineWidth = 12; ctx.stroke();
    ctx.save(); ctx.setLineDash([7, 9]); tail(); ctx.strokeStyle = C.dark; ctx.lineWidth = 12; ctx.stroke(); ctx.restore();
    // sitting body
    ctx.beginPath();
    ctx.moveTo(-26, 24);
    ctx.bezierCurveTo(-48, 50, -50, 92, -30, 99);
    ctx.lineTo(30, 99);
    ctx.bezierCurveTo(50, 92, 48, 50, 26, 24);
    ctx.closePath();
    fs(ctx, C.fur);
    // tabby stripes down the sides
    ctx.save();
    ctx.clip();
    for (const k of [-1, 1]) {
      for (const yy of [40, 55, 70, 85]) stripe(ctx, [k * 48, yy, k * 36, yy + 3, k * 26, yy + 11], 5);
    }
    ctx.restore();
    // the white chest
    ctx.beginPath();
    ctx.moveTo(-14, 26); ctx.quadraticCurveTo(-22, 60, -12, 92); ctx.lineTo(12, 92); ctx.quadraticCurveTo(22, 60, 14, 26); ctx.closePath();
    fs(ctx, C.white, null);
    // front legs (tabby) with white paws
    const g = groom ? groomPose(groom.kind, groom.k, t) : null;
    for (const k of [-1, 1]) {
      if (k === 1 && g && g.lift > 0.05) continue; // that paw's up, washing
      ctx.beginPath(); ctx.moveTo(k * 6, 70); ctx.lineTo(k * 6, 92); ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 2; ctx.stroke();
      ell(ctx, k * 13, 97, 12, 7.5); fs(ctx, C.white, INK, 2.5);
      ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.4;
      for (const dx of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(k * 13 + dx, 95); ctx.lineTo(k * 13 + dx, 100); ctx.stroke(); }
    }
  }
  const g = groom ? groomPose(groom.kind, groom.k, t) : null;
  if (g) { ctx.save(); ctx.translate(0, 20); ctx.rotate(g.tilt); ctx.translate(0, -20); }
  drawHead(ctx, { blink: blink || !!(g && g.lift > 0.5), tongue: g?.tongue, meow: g ? 0 : meow });
  if (g) ctx.restore();
  // the washing paw, up in front of her face
  if (g && g.lift > 0.05) {
    const px = 13 + (g.px - 13) * g.lift, py = 97 + (g.py - 97) * g.lift;
    const leg = () => { ctx.beginPath(); ctx.moveTo(12, 44); ctx.quadraticCurveTo(26 + 6 * g.lift, (44 + py) / 2 + 8, px, py + 6); };
    leg(); ctx.strokeStyle = INK; ctx.lineWidth = 17; ctx.stroke();
    leg(); ctx.strokeStyle = COAT.fur; ctx.lineWidth = 12; ctx.stroke();
    ell(ctx, px, py, 9, 11, -0.5); fs(ctx, COAT.white, INK, 2.5);
  }
  ctx.restore();
}

/** Her head, facing you, centred on (0, 0). Used sitting, washing and asleep. */
function drawHead(ctx, { blink = false, tongue = 0, sleep = false, meow = 0 } = {}) {
  const C = COAT;
  // ears
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(k * 14, -26); ctx.lineTo(k * 34, -46); ctx.lineTo(k * 38, -12); ctx.closePath();
    fs(ctx, C.fur);
    ctx.beginPath(); ctx.moveTo(k * 20, -24); ctx.lineTo(k * 32, -38); ctx.lineTo(k * 33, -18); ctx.closePath();
    fs(ctx, C.ear, null);
  }
  // head, with the tabby "M" on the forehead and stripes on the cheeks
  ell(ctx, 0, 0, 40, 33); fs(ctx, C.fur);
  ctx.save();
  ell(ctx, 0, 0, 38.5, 31.5); ctx.clip();
  stripe(ctx, [-16, -30, -12, -22, -10, -14], 4);
  stripe(ctx, [-5, -32, -4, -24, -3, -17], 4);
  stripe(ctx, [5, -32, 4, -24, 3, -17], 4);
  stripe(ctx, [16, -30, 12, -22, 10, -14], 4);
  for (const k of [-1, 1]) {
    stripe(ctx, [k * 40, -2, k * 33, -1, k * 26, 2], 4);
    stripe(ctx, [k * 40, 9, k * 34, 9, k * 28, 11], 4);
  }
  ctx.restore();
  // white chin and muzzle
  ell(ctx, 0, 17, 13, 9); fs(ctx, C.white, null);
  for (const k of [-1, 1]) { ell(ctx, k * 8, 12, 10, 8); fs(ctx, C.white, null); }
  // eyes: big, with slit pupils (shut when blinking)
  for (const k of [-1, 1]) {
    if (sleep) { // shut tight, curving down
      ctx.beginPath(); ctx.moveTo(k * 15 - 7, -5); ctx.quadraticCurveTo(k * 15, 1, k * 15 + 7, -5);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
      continue;
    }
    if (blink) {
      ctx.beginPath(); ctx.moveTo(k * 15 - 7, -3); ctx.quadraticCurveTo(k * 15, 2, k * 15 + 7, -3);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
      continue;
    }
    ell(ctx, k * 15, -4, 8, 8.5); fs(ctx, C.eyes, INK, 2);
    ell(ctx, k * 15, -4, 2.2, 7); fs(ctx, INK, null);
    ell(ctx, k * 15 + 2.5, -7, 1.6, 1.6); fs(ctx, '#fff', null);
  }
  // nose and mouth
  ctx.beginPath(); ctx.moveTo(-4, 6); ctx.lineTo(4, 6); ctx.lineTo(0, 10); ctx.closePath(); fs(ctx, C.nose, INK, 1.5);
  if (meow > 0.05) { // mouth open (0 to 1), a pink tongue at the bottom
    const h = 3 + meow * 8, w = 5 + meow * 2.5;
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, 12.5); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ell(ctx, 0, 13 + h / 2, w, h / 2); fs(ctx, '#5a2a2a', INK, 2);
    ctx.save(); ell(ctx, 0, 13 + h / 2, w, h / 2); ctx.clip();
    ell(ctx, 0, 13 + h, w * 0.8, h * 0.4); fs(ctx, '#e58a8f', null);
    ctx.restore();
  } else {
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, 13); ctx.moveTo(-7, 15); ctx.quadraticCurveTo(-3, 18, 0, 13); ctx.quadraticCurveTo(3, 18, 7, 15);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  }
  if (tongue) { ell(ctx, 4, 18, 4, 4.5, -0.4); fs(ctx, '#e58a8f', INK, 1.5); }
  // whiskers
  ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.4;
  for (const k of [-1, 1]) for (const dy of [-2, 3]) { ctx.beginPath(); ctx.moveTo(k * 18, 12 + dy); ctx.lineTo(k * 46, 8 + dy * 2.2); ctx.stroke(); }
}

/** The size of Ziggy curled up asleep, in the same units and on the same ground (y = 104). */
export const ZIGGY_SLEEP_BOX = { left: -70, right: 70, top: 22, bottom: 104 };

/**
 * Ziggy curled up asleep, facing you: a round loaf with her head down on her paws and her
 * tail wrapped round the front. Same scale and ground as drawZiggy sitting at (x, y).
 * `t` is time in seconds: she breathes slowly, and the tip of her tail twitches now and then.
 */
export function drawZiggySleeping(ctx, x, y, s = 1, { t = 0 } = {}) {
  const C = COAT;
  const breathe = Math.sin(t * 1.5) * 0.035;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // the curled body, rising and falling
  ctx.save();
  ctx.translate(0, 99); ctx.scale(1, 1 + breathe); ctx.translate(0, -99);
  ctx.beginPath();
  ctx.moveTo(-62, 99);
  ctx.bezierCurveTo(-72, 60, -30, 40, 8, 42);
  ctx.bezierCurveTo(52, 42, 74, 66, 64, 99);
  ctx.closePath();
  fs(ctx, C.fur);
  ctx.save(); ctx.clip();
  for (const xx of [-6, 10, 26, 42, 58]) stripe(ctx, [xx, 38, xx + 6, 56, xx + 2, 76], 5);
  ctx.restore();
  ctx.restore();
  // the tail, wrapped round the front, with a twitching dark tip
  const tw = Math.max(0, Math.sin(t * 0.9)) > 0.97 ? Math.sin(t * 30) * 3 : 0;
  const tail = () => { ctx.beginPath(); ctx.moveTo(60, 90); ctx.bezierCurveTo(46, 108, -30, 108, -56 + tw, 92); };
  tail(); ctx.strokeStyle = INK; ctx.lineWidth = 17; ctx.stroke();
  tail(); ctx.strokeStyle = C.fur; ctx.lineWidth = 12; ctx.stroke();
  ctx.save(); ctx.setLineDash([7, 9]); tail(); ctx.strokeStyle = C.dark; ctx.lineWidth = 12; ctx.stroke(); ctx.restore();
  ell(ctx, -56 + tw, 92, 6.5, 6); fs(ctx, C.dark, INK, 2.5);
  // a white paw tucked in front, for her chin to rest on
  ell(ctx, 4, 90, 13, 7); fs(ctx, C.white, INK, 2.5);
  // her head, down on her paw and tilted, eyes shut
  ctx.save();
  ctx.translate(-22, 66 + breathe * 30);
  ctx.rotate(-0.28);
  ctx.scale(0.82, 0.82);
  drawHead(ctx, { sleep: true });
  ctx.restore();
  ctx.restore();
}

/** Little z's drifting up from her while she sleeps: (x, top) is above her head. */
export function drawZzz(ctx, x, top, size, t) {
  ctx.save();
  ctx.fillStyle = '#7a7166';
  ctx.textAlign = 'center';
  for (let i = 0; i < 3; i++) {
    const k = (t / 3.6 + i / 3) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.75;
    const fsz = Math.round(Math.max(11, size * 0.13) * (1 + k * 0.8));
    ctx.font = `600 ${fsz}px "DM Sans", system-ui, sans-serif`;
    ctx.fillText('z', x + k * size * 0.32 + Math.sin(k * 6) * size * 0.04, top - k * size * 0.42);
  }
  ctx.restore();
}

/** The size of Ziggy walking, side on and facing right, in the same units (paws at y = 0). */
export const ZIGGY_WALK_BOX = { left: -96, right: 98, top: -144, bottom: 2 };

/**
 * Ziggy walking, side on, facing right: the same cat as drawZiggy at the same scale. (x, y)
 * is the ground under her middle. `phase` turns once per stride (radians); `t` swishes the
 * tail; `look` turns her head up a little (0 to 1), as when she's admiring a picture.
 */
export function drawZiggyWalking(ctx, x, y, s = 1, { phase = 0, t = 0, blink = false, look = 0 } = {}) {
  const C = COAT;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // a walking cat moves the legs on one side together, near and far half a stride apart
  const leg = (hx, hy, ph, near) => {
    const swing = Math.sin(ph) * 13;
    const lift = Math.max(0, Math.cos(ph)) * 9;
    const fx = hx + swing, fy = -lift;
    const kx = hx + swing * 0.45 + (hx > 0 ? 4 : -5), ky = (hy + fy) / 2 - 2;
    const path = () => { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(kx, ky, fx, fy - 5); };
    path(); ctx.strokeStyle = INK; ctx.lineWidth = 17; ctx.stroke();
    path(); ctx.strokeStyle = near ? C.fur : '#76674f'; ctx.lineWidth = 12; ctx.stroke();
    // a stripe round the leg, then the white paw
    ctx.strokeStyle = C.dark; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo((hx + kx) / 2 - 6, (hy + ky) / 2); ctx.lineTo((hx + kx) / 2 + 6, (hy + ky) / 2 + 1); ctx.stroke();
    ell(ctx, fx + 3, fy - 3, 10, 6); fs(ctx, near ? C.white : '#ddd6cb', INK, 2.5);
  };
  const BACK = [-36, -54], FRONT = [34, -54];
  // far legs first, behind the body
  leg(BACK[0] + 6, BACK[1], phase + Math.PI, false);
  leg(FRONT[0] + 6, FRONT[1], phase, false);
  ctx.save();
  ctx.translate(0, -10); // the body rides on the legs
  // the tail, up and curling over at the tip, with rings and a dark tip
  const sw = Math.sin(t * 2.2) * 5;
  const tail = () => { ctx.beginPath(); ctx.moveTo(-52, -62); ctx.bezierCurveTo(-80, -70, -86 + sw * 0.4, -104, -76 + sw, -124); };
  tail(); ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.stroke();
  tail(); ctx.strokeStyle = C.fur; ctx.lineWidth = 11; ctx.stroke();
  ctx.save(); ctx.setLineDash([7, 8]); tail(); ctx.strokeStyle = C.dark; ctx.lineWidth = 11; ctx.stroke(); ctx.restore();
  ell(ctx, -76 + sw, -124, 6, 6); fs(ctx, C.dark, INK, 2.5);
  // the body: a long loaf, a touch higher at the shoulders
  ctx.beginPath();
  ctx.moveTo(-56, -58);
  ctx.bezierCurveTo(-60, -84, -20, -84, 10, -82);
  ctx.bezierCurveTo(40, -84, 60, -78, 58, -56);
  ctx.bezierCurveTo(56, -38, 30, -34, 10, -36);
  ctx.bezierCurveTo(-20, -34, -54, -34, -56, -58);
  ctx.closePath();
  fs(ctx, C.fur);
  ctx.save();
  ctx.clip();
  // tabby stripes over the back and down the sides
  for (const xx of [-40, -26, -12, 2, 16, 30]) stripe(ctx, [xx, -86, xx - 3, -70, xx + 1, -54], 5);
  // white belly and chest
  ell(ctx, 40, -42, 22, 12, -0.2); fs(ctx, C.white, null);
  ctx.restore();
  ctx.restore();
  // near legs, in front of the body
  leg(BACK[0], BACK[1] + 2, phase, true);
  leg(FRONT[0], FRONT[1] + 2, phase + Math.PI, true);
  // the head, in profile, looking ahead (or up at something)
  ctx.save();
  ctx.translate(62, -92);
  ctx.rotate(-0.32 * look);
  // ears: the far one peeping out behind the near one
  ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(-20, -44); ctx.lineTo(2, -26); ctx.closePath(); fs(ctx, '#76674f');
  ctx.beginPath(); ctx.moveTo(-4, -24); ctx.lineTo(6, -48); ctx.lineTo(18, -22); ctx.closePath(); fs(ctx, C.fur);
  ctx.beginPath(); ctx.moveTo(1, -26); ctx.lineTo(7, -40); ctx.lineTo(14, -24); ctx.closePath(); fs(ctx, C.ear, null);
  ell(ctx, 4, -2, 30, 26); fs(ctx, C.fur);
  ctx.save();
  ell(ctx, 4, -2, 28.5, 24.5); ctx.clip();
  // the forehead stripes, and one along the cheek
  stripe(ctx, [-6, -28, -4, -20, -2, -13], 4);
  stripe(ctx, [4, -28, 5, -20, 6, -14], 4);
  stripe(ctx, [-24, -4, -16, -2, -8, 2], 4);
  stripe(ctx, [-22, 8, -14, 9, -6, 12], 4);
  // the white muzzle and chin
  ell(ctx, 24, 9, 14, 10); fs(ctx, C.white, null);
  ell(ctx, 16, 17, 12, 7); fs(ctx, C.white, null);
  ctx.restore();
  // eye: almond, with a slit pupil (shut when blinking)
  if (blink) {
    ctx.beginPath(); ctx.moveTo(8, -6); ctx.quadraticCurveTo(14, -1, 20, -6);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
  } else {
    ell(ctx, 14, -6, 6.5, 7); fs(ctx, C.eyes, INK, 2);
    ell(ctx, 16, -6, 1.8, 5.6); fs(ctx, INK, null);
    ell(ctx, 17.5, -8.5, 1.3, 1.3); fs(ctx, '#fff', null);
  }
  // nose, mouth and whiskers
  ctx.beginPath(); ctx.moveTo(33, 1); ctx.lineTo(36, 5); ctx.lineTo(31, 6); ctx.closePath(); fs(ctx, C.nose, INK, 1.5);
  ctx.beginPath(); ctx.moveTo(32, 6); ctx.quadraticCurveTo(31, 12, 25, 13); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.4;
  for (const dy of [-1, 4, 9]) { ctx.beginPath(); ctx.moveTo(24, 8 + dy * 0.6); ctx.lineTo(50, 4 + dy * 1.6); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
}
