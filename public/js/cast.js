// Copied from Naishy/family-games cast/people.js at 297b775. Don't edit here: change it there, then re-sync.
// The family cast: cartoon people (and Nugget) shared by all the family games.
// Drawn with canvas paths, so they stay crisp at any size. No images, no DOM.
//
// Games don't load this live (they must work offline, and a change here
// mustn't surprise a game someone's playing). Each game copies a fixed version
// into itself with cast/sync.mjs, and updates it deliberately, in a PR.
//
// Every draw function is drawX(ctx, x, y, s, options), where (x, y) is the
// middle of the face and s the scale (a head is about 80-95 units tall at 1).
export const CAST_VERSION = '5';

const INK = '#2b1d14';
const SKIN = '#f3cdb2';
const SKIN_SH = '#e3b08f';

function ell(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}
function fs(ctx, fill, stroke = INK, lw = 3) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

function begin(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

function eyes(ctx, y, gap, { blink = false, lash = false, r = 4.5 } = {}) {
  for (const k of [-1, 1]) {
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(k * gap - 6, y);
      ctx.quadraticCurveTo(k * gap, y + 4, k * gap + 6, y);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
      continue;
    }
    ell(ctx, k * gap, y, r, r * 1.15);
    fs(ctx, '#3a2a20', null);
    ell(ctx, k * gap + 1.4, y - 1.6, 1.4, 1.4);
    fs(ctx, '#fff', null);
    if (lash) {
      ctx.beginPath();
      ctx.moveTo(k * gap + k * 4, y - 3);
      ctx.lineTo(k * gap + k * 8, y - 6);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    }
  }
}
function smile(ctx, y, w, open = 1, teeth = true) {
  ctx.beginPath();
  ctx.moveTo(-w, y);
  ctx.quadraticCurveTo(0, y + 3, w, y);
  ctx.quadraticCurveTo(w * 0.8, y + 12 * open, 0, y + 13 * open);
  ctx.quadraticCurveTo(-w * 0.8, y + 12 * open, -w, y);
  ctx.closePath();
  fs(ctx, '#8a2f2f', INK, 2.5);
  if (teeth) {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-w, y - 2, w * 2, 6);
    ctx.restore();
  }
}
function cheeks(ctx, y, gap) {
  for (const k of [-1, 1]) { ell(ctx, k * gap, y, 7, 4.5); fs(ctx, 'rgba(232,120,120,.35)', null); }
}


// --- Alice (from Alice's Prime Time) --------------------------------------------------------
// Long straight brown hair, warm smile, very slim, about 5ft 8 (the same height as Andy).
// Sheer black top with puffed sleeves; legs: cream jeans and black ankle boots.
const HAIR_A = '#5b3923';
const HAIR_A_HI = '#7d5234';

export function drawAlice(ctx, x, y, s = 1, { talk = 0, t = 0, mood = 'happy', wave = false, body = true, legs = false } = {}) {
  begin(ctx, x, y, s);
  if (body && legs) {
    // cream jeans and black ankle boots
    ctx.beginPath();
    // slim legs; she's about Andy's height (5ft 8)
    ctx.moveTo(-32, 158); ctx.lineTo(32, 158); ctx.lineTo(26, 300); ctx.lineTo(4, 300); ctx.lineTo(0, 196); ctx.lineTo(-4, 300); ctx.lineTo(-26, 300); ctx.closePath();
    fs(ctx, '#ece3d0');
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(k * 15 + k * 4, 306, 14, 8, 0, 0, Math.PI * 2); fs(ctx, '#1e1a1c'); }
  }
  // hair behind (to just below the shoulders; shorter when there's no body)
  const hairEnd = body ? 132 : 70;
  ctx.beginPath();
  ctx.moveTo(-30, -40);
  ctx.quadraticCurveTo(-48, 30, -41, hairEnd);
  ctx.lineTo(41, hairEnd);
  ctx.quadraticCurveTo(48, 30, 30, -40);
  ctx.closePath();
  fs(ctx, HAIR_A);
  if (body) {
    // sheer black top: body
    ctx.beginPath();
    // slim: narrow shoulders, in at the waist
    ctx.moveTo(-34, 170);
    ctx.quadraticCurveTo(-27, 140, -33, 104);
    ctx.quadraticCurveTo(-44, 70, -21, 60);
    ctx.lineTo(21, 60);
    ctx.quadraticCurveTo(44, 70, 33, 104);
    ctx.quadraticCurveTo(27, 140, 34, 170);
    ctx.closePath();
    fs(ctx, '#1e1a1c');
    // puffed sheer sleeves: see-through over the arms
    for (const k of [-1, 1]) {
      ctx.fillStyle = SKIN_SH;
      ctx.beginPath(); ctx.moveTo(k * 38, 70); ctx.quadraticCurveTo(k * 53, 120, k * 50, 184); ctx.lineTo(k * 41, 184); ctx.quadraticCurveTo(k * 42, 120, k * 34, 80); ctx.closePath(); ctx.fill();
      ell(ctx, k * 46, 188, 7, 8); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(k * 22, 60);
      ctx.quadraticCurveTo(k * 66, 62, k * 60, 124);
      ctx.quadraticCurveTo(k * 57, 154, k * 54, 168);
      ctx.lineTo(k * 39, 168);
      ctx.quadraticCurveTo(k * 39, 110, k * 33, 92);
      ctx.closePath();
      fs(ctx, 'rgba(30,26,30,.62)');
      ctx.strokeStyle = 'rgba(255,255,255,.16)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(k * (32 + i * 9), 66); ctx.quadraticCurveTo(k * (43 + i * 7), 110, k * (42 + i * 4), 166); ctx.stroke(); }
    }
    // neckline, a necklace
    ctx.beginPath();
    ctx.moveTo(-17, 60);
    ctx.quadraticCurveTo(0, 80, 17, 60);
    ctx.closePath();
    fs(ctx, SKIN_SH, INK, 2);
    ctx.beginPath();
    ctx.moveTo(-14, 62);
    ctx.quadraticCurveTo(0, 78, 14, 62);
    ctx.strokeStyle = '#d8d2c8'; ctx.lineWidth = 1.5; ctx.stroke();
    // neck
    ctx.fillStyle = SKIN_SH;
    ctx.fillRect(-10, 34, 20, 28);
    if (wave) {
      // a raised hand with the smartwatch
      ctx.save();
      ctx.translate(88, 40);
      ctx.rotate(-0.4 + Math.sin(t * 8) * 0.25);
      ctx.fillStyle = 'rgba(60,56,62,.85)';
      ctx.fillRect(-8, 0, 16, 50);
      ell(ctx, 0, -6, 11, 13); fs(ctx, SKIN);
      ctx.fillStyle = '#111'; ctx.fillRect(-8, 6, 16, 9);
      ctx.restore();
    }
  }
  // face
  ell(ctx, 0, 0, 35, 42);
  fs(ctx, SKIN);
  // hair in front: centre parting, falling either side of the face
  for (const k of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.quadraticCurveTo(k * 32, -46, k * 38, -16);
    ctx.quadraticCurveTo(k * 46, 34, k * 46, body ? 120 : 64);
    ctx.lineTo(k * 34, body ? 116 : 62);
    ctx.quadraticCurveTo(k * 36, 30, k * 30, 0);
    ctx.quadraticCurveTo(k * 22, -26, 0, -34);
    ctx.closePath();
    fs(ctx, HAIR_A);
    ctx.beginPath();
    ctx.moveTo(k * 8, -38);
    ctx.quadraticCurveTo(k * 32, -30, k * 36, 20);
    ctx.strokeStyle = HAIR_A_HI; ctx.lineWidth = 3; ctx.stroke();
  }
  // brows, eyes, smile
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(k * 7, -15); ctx.quadraticCurveTo(k * 14, -19, k * 22, -15);
    ctx.strokeStyle = '#4a2d1c'; ctx.lineWidth = 3; ctx.stroke();
  }
  eyes(ctx, -5, 13, { lash: true, blink: (t % 4) > 3.85 });
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, 10, 1, 12);
  ctx.strokeStyle = SKIN_SH; ctx.lineWidth = 2.5; ctx.stroke();
  cheeks(ctx, 12, 20);
  if (mood === 'oops') {
    ell(ctx, 0, 23, 6, 7); fs(ctx, '#8a2f2f', INK, 2.5);
  } else {
    const open = talk ? 0.55 + 0.45 * Math.abs(Math.sin(t * 16)) : 0.8;
    smile(ctx, 19, 13, open);
  }
  ctx.restore();
}

// --- Andy (from Andy's Big Pour) ---------------------------------------------------------
// Short dark hair, big dark-brown beard with a bit of ginger, big grin. Fit and muscular.
//   outfit 'site': white hard hat (Yorkshire rose), hi-vis over a navy jumper (Big Pour)
//   outfit 'home': no hat, black T-shirt; legs 'jeans' | 'shorts' (he changes into shorts at home)
// (x, y) is the middle of his face; the head is ~80 units tall at s = 1.
const ANDY_SKIN = '#f0c3a0';
const ANDY_SKIN_SH = '#e2b08c';
const BEARD = '#4b2e1f';
const BEARD_HI = '#6e3f25';
const HAIR = '#3a2618';

export function drawAndy(ctx, x, y, s = 1, { mood = 'happy', talk = 0, t = 0, body = true, scarf = false, outfit = 'site', legs = null } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (body && legs === 'jeans') {
    // trousers back on
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(k * 22 + k * 6, 302, 20, 10, 0, 0, Math.PI * 2); fs(ctx, '#f4f4f4'); }
    ctx.beginPath(); ctx.moveTo(-42, 158); ctx.lineTo(42, 158); ctx.lineTo(40, 296); ctx.lineTo(6, 296); ctx.lineTo(0, 205); ctx.lineTo(-6, 296); ctx.lineTo(-40, 296); ctx.closePath();
    fs(ctx, '#3b5a8a');
  }
  if (body && legs === 'shorts') {
    // home from work: shorts and bare legs
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(k * 22 - 13, 215, 26, 86, 11); fs(ctx, ANDY_SKIN);
      ctx.beginPath(); ctx.ellipse(k * 22 + k * 6, 302, 20, 10, 0, 0, Math.PI * 2); fs(ctx, '#f4f4f4');
    }
    ctx.beginPath(); ctx.moveTo(-42, 158); ctx.lineTo(42, 158); ctx.lineTo(46, 232); ctx.lineTo(5, 232); ctx.lineTo(0, 205); ctx.lineTo(-5, 232); ctx.lineTo(-46, 232); ctx.closePath();
    fs(ctx, '#d6453d');
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 5;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * 40, 164); ctx.lineTo(k * 43, 226); ctx.stroke(); }
  }
  if (body && outfit === 'home') {
    // muscular, not big: broad shoulders, narrow waist, arms out of short sleeves
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(k * 46, 92);
      ctx.bezierCurveTo(k * 92, 104, k * 84, 140, k * 72, 150);
      ctx.quadraticCurveTo(k * 70, 166, k * 68, 178);
      ctx.lineTo(k * 50, 178);
      ctx.quadraticCurveTo(k * 50, 150, k * 44, 112);
      ctx.closePath();
      fs(ctx, ANDY_SKIN);
      ell(ctx, k * 59, 184, 12, 10); fs(ctx, ANDY_SKIN);
      // a bit of bicep definition
      ctx.beginPath(); ctx.moveTo(k * 62, 128); ctx.quadraticCurveTo(k * 70, 140, k * 64, 150); ctx.strokeStyle = ANDY_SKIN_SH; ctx.lineWidth = 2.5; ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-42, 166);
    ctx.lineTo(-48, 108);
    ctx.quadraticCurveTo(-62, 62, -26, 52);
    ctx.lineTo(26, 52);
    ctx.quadraticCurveTo(62, 62, 48, 108);
    ctx.lineTo(42, 166);
    ctx.closePath();
    fs(ctx, '#1b1b1f');
    // short sleeves over the shoulders
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(k * 30, 54);
      ctx.quadraticCurveTo(k * 70, 56, k * 74, 104);
      ctx.lineTo(k * 48, 112);
      ctx.quadraticCurveTo(k * 44, 80, k * 30, 54);
      ctx.closePath();
      fs(ctx, '#1b1b1f');
    }
    // a hint of chest
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2.5;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * 4, 96); ctx.quadraticCurveTo(k * 22, 104, k * 36, 92); ctx.stroke(); }
    ctx.fillStyle = '#e2b08c'; ctx.fillRect(-15, 30, 30, 26);
  }
  if (body && outfit === 'site') {
    // navy jumper
    ctx.beginPath();
    ctx.moveTo(-86, 150);
    ctx.quadraticCurveTo(-84, 66, -30, 54);
    ctx.lineTo(30, 54);
    ctx.quadraticCurveTo(84, 66, 86, 150);
    ctx.closePath();
    fs(ctx, '#26324f');
    // hi-vis vest panels
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(k * 82, 150);
      ctx.quadraticCurveTo(k * 80, 70, k * 36, 58);
      ctx.lineTo(k * 18, 60);
      ctx.lineTo(k * 8, 150);
      ctx.closePath();
      fs(ctx, '#ff7a1a');
      // reflective strips
      ctx.save();
      ctx.clip();
      for (const sy of [96, 124]) {
        ctx.fillStyle = '#e9eef2';
        ctx.fillRect(-90, sy, 180, 10);
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        ctx.fillRect(-90, sy + 8, 180, 2);
      }
      ctx.restore();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // name badge
    ctx.fillStyle = '#fff';
    ctx.fillRect(28, 76, 30, 14);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 76, 30, 14);
    ctx.fillStyle = INK;
    ctx.font = '700 10px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ANDY', 43, 83.5);
    // neck
    ctx.fillStyle = '#e2b08c';
    ctx.fillRect(-15, 30, 30, 28);
    if (scarf) leedsScarf(ctx);
  }

  // ears
  for (const k of [-1, 1]) { ell(ctx, k * 37, 2, 8, 11); fs(ctx, ANDY_SKIN); }
  // face
  ell(ctx, 0, 0, 37, 43);
  fs(ctx, ANDY_SKIN);
  // hair at the sides, under the hat
  ctx.fillStyle = HAIR;
  for (const k of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(k * 36, -24);
    ctx.quadraticCurveTo(k * 40, -6, k * 35, 2);
    ctx.lineTo(k * 30, -4);
    ctx.quadraticCurveTo(k * 31, -16, k * 26, -26);
    ctx.closePath();
    ctx.fill();
  }

  // beard: full, dark, from the sideburns round under the chin
  ctx.beginPath();
  ctx.moveTo(-37, -6);
  ctx.quadraticCurveTo(-42, 38, -20, 56);
  ctx.quadraticCurveTo(0, 68, 20, 56);
  ctx.quadraticCurveTo(42, 38, 37, -6);
  ctx.quadraticCurveTo(32, 16, 20, 18);
  ctx.quadraticCurveTo(0, 12, -20, 18);
  ctx.quadraticCurveTo(-32, 16, -37, -6);
  ctx.closePath();
  fs(ctx, BEARD);
  // a bit of ginger in it
  ctx.strokeStyle = BEARD_HI;
  ctx.lineWidth = 2;
  for (const [ax, ay, bx, by] of [[-28, 22, -22, 36], [-14, 44, -8, 54], [24, 24, 20, 38], [10, 46, 6, 56], [-30, 6, -28, 16], [30, 6, 29, 16]]) {
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }

  // mouth
  const open = talk ? 0.6 + 0.4 * Math.abs(Math.sin(t * 18)) : 1;
  if (mood === 'jeez') {
    ell(ctx, 0, 33, 8, 10 * open);
    fs(ctx, '#5a1f1f', INK, 2.5);
  } else {
    ctx.beginPath();
    ctx.moveTo(-16, 26);
    ctx.quadraticCurveTo(0, 30, 16, 26);
    ctx.quadraticCurveTo(14, 26 + 16 * open, 0, 28 + 17 * open);
    ctx.quadraticCurveTo(-14, 26 + 16 * open, -16, 26);
    ctx.closePath();
    fs(ctx, '#5a1f1f', INK, 2.5);
    // teeth
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-16, 24, 32, 7);
    ctx.restore();
  }
  // moustache
  ctx.beginPath();
  ctx.moveTo(-20, 26);
  ctx.quadraticCurveTo(-10, 14, 0, 19);
  ctx.quadraticCurveTo(10, 14, 20, 26);
  ctx.quadraticCurveTo(10, 21, 0, 23);
  ctx.quadraticCurveTo(-10, 21, -20, 26);
  ctx.closePath();
  fs(ctx, BEARD, BEARD, 2);

  // nose
  ctx.beginPath();
  ctx.moveTo(-3, -2);
  ctx.quadraticCurveTo(-9, 12, -2, 13);
  ctx.quadraticCurveTo(4, 14, 7, 11);
  ctx.strokeStyle = '#b97d5c';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // cheeks
  ctx.fillStyle = 'rgba(230,110,100,.28)';
  ell(ctx, -22, 10, 8, 5); ctx.fill();
  ell(ctx, 22, 10, 8, 5); ctx.fill();

  // eyes and brows
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  if (mood === 'jeez') {
    for (const k of [-1, 1]) {
      ell(ctx, k * 13, -6, 6, 7); fs(ctx, '#fff', INK, 2);
      ell(ctx, k * 13, -5, 2.6, 3); ctx.fillStyle = INK; ctx.fill();
      ctx.beginPath(); ctx.moveTo(k * 5, -21); ctx.quadraticCurveTo(k * 13, -27, k * 22, -19);
      ctx.lineWidth = 4.5; ctx.strokeStyle = HAIR; ctx.stroke();
    }
  } else {
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(k * 19, -4); ctx.quadraticCurveTo(k * 13, -12, k * 7, -4);
      ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(k * 5, -17); ctx.quadraticCurveTo(k * 13, -21, k * 22, -16);
      ctx.lineWidth = 4.5; ctx.strokeStyle = HAIR; ctx.stroke();
    }
  }

  if (outfit === 'site') {
    // hard hat: white, site manager
    ctx.beginPath();
    ctx.moveTo(-44, -26);
    ctx.quadraticCurveTo(-44, -74, 0, -76);
    ctx.quadraticCurveTo(44, -74, 44, -26);
    ctx.closePath();
    fs(ctx, '#fbfbf7');
    ctx.beginPath();
    ctx.moveTo(0, -75); ctx.lineTo(0, -30);
    ctx.strokeStyle = '#d8d8d0'; ctx.lineWidth = 6; ctx.stroke();
    // brim
    ctx.beginPath();
    ctx.moveTo(-50, -24);
    ctx.quadraticCurveTo(0, -36, 52, -24);
    ctx.quadraticCurveTo(54, -18, 48, -18);
    ctx.quadraticCurveTo(0, -28, -48, -18);
    ctx.quadraticCurveTo(-54, -18, -50, -24);
    ctx.closePath();
    fs(ctx, '#ecece4');
    // Yorkshire rose sticker
    ell(ctx, -22, -48, 8, 8); fs(ctx, '#1f4fa3', INK, 1.5);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ell(ctx, -22 + Math.cos(a) * 3.2, -48 + Math.sin(a) * 3.2, 2.6, 2.6); ctx.fill();
    }
    ell(ctx, -22, -48, 1.6, 1.6); ctx.fillStyle = '#ffd23f'; ctx.fill();
  } else {
    // at home: short dark hair, no hat
    ctx.beginPath();
    ctx.moveTo(-36, -8); ctx.quadraticCurveTo(-40, -44, 0, -47); ctx.quadraticCurveTo(40, -44, 36, -8);
    ctx.quadraticCurveTo(30, -28, 0, -30); ctx.quadraticCurveTo(-30, -28, -36, -8); ctx.closePath();
    fs(ctx, HAIR);
  }
  ctx.restore();
}

function leedsScarf(ctx) {
  const cols = ['#ffffff', '#1d428a', '#ffd23f', '#1d428a'];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-34, 44); ctx.quadraticCurveTo(0, 70, 34, 44); ctx.lineTo(36, 60); ctx.quadraticCurveTo(0, 86, -36, 60); ctx.closePath();
  ctx.fillStyle = '#1d428a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  // the hanging end
  ctx.beginPath();
  ctx.rect(-30, 58, 22, 70);
  ctx.save(); ctx.clip();
  for (let i = 0; i < 8; i++) { ctx.fillStyle = cols[i % 4]; ctx.fillRect(-30, 58 + i * 9, 22, 9); }
  ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-30, 58, 22, 70);
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-28 + i * 4.5, 128); ctx.lineTo(-28 + i * 4.5, 136); ctx.stroke(); }
  ctx.restore();
}

// --- Ed ---------------------------------------------------------------------------------------
// Dark brown hair swept up into spikes, thick black round glasses, short ginger-brown
// beard, olive overshirt open over a black T-shirt with a little white skull.
const ED_SKIN = '#f2c6a6';
const ED_HAIR = '#3a281c';
const ED_HAIR_HI = '#5a3d29';
const ED_BEARD = '#8b5a38';
const ED_BEARD_DK = '#6d4429';
const OLIVE = '#5f6b45';
const OLIVE_DK = '#4a5535';

export function drawEd(ctx, x, y, s = 1, { mood = 'happy', talk = 0, t = 0, body = true, wink = false, scarf = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (body) {
    // black tee
    ctx.beginPath();
    ctx.moveTo(-92, 170);
    ctx.quadraticCurveTo(-90, 78, -34, 62);
    ctx.lineTo(34, 62);
    ctx.quadraticCurveTo(90, 78, 92, 170);
    ctx.closePath();
    fs(ctx, '#17171a');
    // the skull, on his chest
    drawSkull(ctx, 20, 118, 0.55);
    // olive overshirt, open
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(k * 96, 170);
      ctx.quadraticCurveTo(k * 94, 80, k * 40, 62);
      ctx.lineTo(k * 26, 66);
      ctx.lineTo(k * 30, 100);
      ctx.quadraticCurveTo(k * 22, 140, k * 28, 170);
      ctx.closePath();
      fs(ctx, OLIVE);
      // collar
      ctx.beginPath();
      ctx.moveTo(k * 26, 64);
      ctx.lineTo(k * 46, 60);
      ctx.lineTo(k * 44, 92);
      ctx.closePath();
      fs(ctx, OLIVE_DK, INK, 2.5);
      // pocket and buttons
      ctx.strokeStyle = OLIVE_DK;
      ctx.lineWidth = 2;
      ctx.strokeRect(k * 70 - 13, 112, 26, 24);
    }
    ctx.fillStyle = '#c9a77a';
    for (const by of [116, 146]) { ell(ctx, -30, by, 3.2, 3.2); ctx.fill(); }
    // neck
    ctx.fillStyle = '#e4b391';
    ctx.beginPath();
    ctx.moveTo(-17, 30); ctx.lineTo(17, 30); ctx.lineTo(19, 64); ctx.quadraticCurveTo(0, 74, -19, 64); ctx.closePath();
    ctx.fill();
    if (scarf) edScarf(ctx);
  }

  // ears
  for (const k of [-1, 1]) { ell(ctx, k * 39, 4, 8, 12); fs(ctx, ED_SKIN); }
  // face: a little long
  ctx.beginPath();
  ctx.moveTo(-37, -14);
  ctx.quadraticCurveTo(-39, 36, -20, 50);
  ctx.quadraticCurveTo(0, 60, 20, 50);
  ctx.quadraticCurveTo(39, 36, 37, -14);
  ctx.quadraticCurveTo(36, -52, 0, -54);
  ctx.quadraticCurveTo(-36, -52, -37, -14);
  ctx.closePath();
  fs(ctx, ED_SKIN);

  // beard: short, covering the jaw and chin, with a moustache
  ctx.beginPath();
  ctx.moveTo(-37, 6);
  ctx.quadraticCurveTo(-36, 30, -22, 48);
  ctx.quadraticCurveTo(0, 64, 22, 48);
  ctx.quadraticCurveTo(36, 30, 37, 6);
  ctx.quadraticCurveTo(30, 18, 26, 22);
  ctx.quadraticCurveTo(14, 18, 0, 18);
  ctx.quadraticCurveTo(-14, 18, -26, 22);
  ctx.quadraticCurveTo(-30, 18, -37, 6);
  ctx.closePath();
  fs(ctx, ED_BEARD, INK, 2.5);
  // stubble texture
  ctx.fillStyle = ED_BEARD_DK;
  for (let i = 0; i < 26; i++) {
    const a = (i * 2.39996) % (Math.PI * 2);
    const r = 8 + ((i * 7) % 22);
    const bx = Math.cos(a) * r * 1.1;
    const by = 36 + Math.sin(a) * r * 0.45;
    if (Math.abs(bx) < 32) { ell(ctx, bx, by, 1.3, 1.3); ctx.fill(); }
  }
  // moustache
  ctx.beginPath();
  ctx.moveTo(-18, 26);
  ctx.quadraticCurveTo(-8, 16, 0, 20);
  ctx.quadraticCurveTo(8, 16, 18, 26);
  ctx.quadraticCurveTo(8, 23, 0, 25);
  ctx.quadraticCurveTo(-8, 23, -18, 26);
  ctx.closePath();
  fs(ctx, ED_BEARD_DK, null);

  // mouth: a knowing closed smile, or talking
  const open = talk > 0 ? 0.5 + 0.5 * Math.abs(Math.sin(t * 14)) : 0;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  if (open > 0.1) {
    ell(ctx, 1, 33, 9, 3 + open * 6);
    fs(ctx, '#6a2a22', INK, 2.5);
  } else if (mood === 'worried') {
    ctx.beginPath(); ctx.moveTo(-10, 35); ctx.quadraticCurveTo(0, 30, 10, 35); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-13, 30); ctx.quadraticCurveTo(-2, 39, 14, 29); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, 29); ctx.lineTo(17, 27); ctx.stroke();
  }
  // nose
  ctx.strokeStyle = '#c98f6d';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(7, 12, 0, 15); ctx.stroke();
  // cheeks
  ctx.fillStyle = 'rgba(225,120,100,.25)';
  ell(ctx, -24, 12, 7, 4); ctx.fill();
  ell(ctx, 24, 12, 7, 4); ctx.fill();

  // eyes, behind the glasses
  const blink = !wink && (t % 4.3) < 0.12;
  for (const k of [-1, 1]) {
    const ex = k * 16;
    if (blink || (wink && k === 1)) {
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(ex - 6, -8); ctx.quadraticCurveTo(ex, -5, ex + 6, -8); ctx.stroke();
    } else {
      ell(ctx, ex, -8, 6.5, 6.5); fs(ctx, '#fff', INK, 1.5);
      ell(ctx, ex + (mood === 'worried' ? 0 : 1), -7.5, 3.6, 3.6); ctx.fillStyle = '#4a2e1c'; ctx.fill();
      ell(ctx, ex + 2, -9, 1.2, 1.2); ctx.fillStyle = '#fff'; ctx.fill();
    }
    // eyebrows
    ctx.strokeStyle = ED_HAIR;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    const lift = mood === 'worried' ? (k < 0 ? 2 : -2) : 0;
    ctx.moveTo(ex - 10, -25 + lift); ctx.quadraticCurveTo(ex, -30, ex + 10, -26 - lift); ctx.stroke();
  }
  // the glasses: thick black, roundish
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 5.5;
  for (const k of [-1, 1]) {
    ctx.beginPath();
    roundRect(ctx, k * 16 - 14, -21, 28, 25, 11);
    ctx.fillStyle = 'rgba(200,225,240,.18)';
    ctx.fill();
    ctx.stroke();
  }
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-3, -11); ctx.quadraticCurveTo(0, -14, 3, -11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-30, -14); ctx.lineTo(-38, -10); ctx.moveTo(30, -14); ctx.lineTo(38, -10); ctx.stroke();
  // a glint
  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-24, -15); ctx.lineTo(-20, -18); ctx.moveTo(8, -15); ctx.lineTo(12, -18); ctx.stroke();

  // hair: short at the sides, swept up into spikes on top
  ctx.beginPath();
  ctx.moveTo(-39, -2);
  ctx.quadraticCurveTo(-44, -30, -34, -46);
  ctx.lineTo(-36, -58);
  ctx.lineTo(-24, -58);
  ctx.lineTo(-20, -72);
  ctx.lineTo(-8, -62);
  ctx.lineTo(0, -78);
  ctx.lineTo(8, -63);
  ctx.lineTo(20, -76);
  ctx.lineTo(22, -60);
  ctx.lineTo(35, -64);
  ctx.lineTo(34, -48);
  ctx.quadraticCurveTo(44, -30, 39, -2);
  ctx.quadraticCurveTo(36, -26, 30, -34);
  ctx.quadraticCurveTo(8, -42, -10, -36);
  ctx.quadraticCurveTo(-28, -32, -33, -28);
  ctx.quadraticCurveTo(-37, -18, -39, -2);
  ctx.closePath();
  fs(ctx, ED_HAIR, INK, 3);
  ctx.strokeStyle = ED_HAIR_HI;
  ctx.lineWidth = 2.5;
  for (const [a, b, c, d] of [[-18, -42, -16, -62], [0, -44, 0, -70], [14, -44, 18, -66], [-30, -40, -32, -52]]) {
    ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke();
  }
  ctx.restore();
}

function drawSkull(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = '#f2efe8';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-22, 8); ctx.quadraticCurveTo(-26, -30, 0, -32); ctx.quadraticCurveTo(26, -30, 22, 8);
  ctx.lineTo(14, 14); ctx.lineTo(14, 26); ctx.lineTo(-14, 26); ctx.lineTo(-14, 14); ctx.closePath();
  ctx.stroke();
  for (const k of [-1, 1]) { ell(ctx, k * 9, -4, 7, 8); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-3, 12); ctx.lineTo(3, 12); ctx.closePath(); ctx.stroke();
  for (const tx of [-7, 0, 7]) { ctx.beginPath(); ctx.moveTo(tx, 18); ctx.lineTo(tx, 26); ctx.stroke(); }
  // the swirls on his shirt's skull
  ctx.beginPath(); ctx.arc(-6, -20, 6, Math.PI, Math.PI * 1.9); ctx.stroke();
  ctx.beginPath(); ctx.arc(8, -18, 5, Math.PI * 1.1, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function edScarf(ctx) {
  // a festive scarf for the card
  ctx.beginPath();
  ctx.moveTo(-40, 56); ctx.quadraticCurveTo(0, 82, 40, 56); ctx.lineTo(44, 72); ctx.quadraticCurveTo(0, 98, -44, 72); ctx.closePath();
  fs(ctx, '#9b1b30');
  ctx.beginPath(); ctx.moveTo(14, 78); ctx.lineTo(30, 140); ctx.lineTo(10, 142); ctx.lineTo(2, 82); ctx.closePath();
  fs(ctx, '#9b1b30');
  ctx.strokeStyle = '#d4a64a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-36, 66); ctx.quadraticCurveTo(0, 88, 36, 66); ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// --- customs officers -------------------------------------------------------------------------

// --- Mila (Alice and Andy's daughter, 5) --------------------------------------------------
// A big cloud of curly strawberry-blonde hair, round rosy face, pink sparkly dress
// with puff sleeves. Options: outfit 'party' | 'school' (red and white gingham dress,
// white socks), legs (to stand on a floor), bag (her school bag), mood 'happy' | 'wow'.
const MILA_HAIR = '#e4a66e';
const MILA_HAIR_DK = '#b8763f';
const MILA_HAIR_HI = '#f4c995';
const DRESS = '#f07fb0';
const DRESS_DK = '#d9578f';

// A soft shape made of overlapping circles, outlined only round the outside.
function cloud(ctx, blobs, fill, edge, lw = 2.5) {
  ctx.fillStyle = edge;
  for (const [x, y, r] of blobs) { ell(ctx, x, y, r + lw, r + lw); ctx.fill(); }
  ctx.fillStyle = fill;
  for (const [x, y, r] of blobs) { ell(ctx, x, y, r, r); ctx.fill(); }
}
function ringlets(ctx, pts, color, w = 2.2) {
  ctx.strokeStyle = color; ctx.lineWidth = w;
  for (const [x, y, r, a] of pts) { ctx.beginPath(); ctx.arc(x, y, r, a, a + Math.PI * 1.25); ctx.stroke(); }
}

export function drawMila(ctx, x, y, s = 1, { t = 0, mood = 'happy', body = true, legs = false, bag = false, outfit = 'party' } = {}) {
  const school = outfit === 'school';
  begin(ctx, x, y, s);
  // the cloud of curls behind her head, down past her shoulders
  const back = [[-44, 30, 17], [44, 30, 17], [-48, 6, 18], [48, 6, 18], [-42, -20, 19], [42, -20, 19],
    [-24, -40, 20], [24, -40, 20], [0, -46, 21], [-38, 52, 14], [38, 52, 14], [-30, 66, 10], [30, 66, 10]];
  cloud(ctx, back, MILA_HAIR, MILA_HAIR_DK);
  ringlets(ctx, [[-44, 32, 7, 0.4], [44, 30, 7, 2.2], [-46, 4, 7, 1], [46, 6, 7, 3], [-38, 54, 6, 0.2], [38, 52, 6, 2.6], [-40, -20, 7, 0.8], [40, -22, 7, 2.4]], MILA_HAIR_DK);
  if (legs) {
    for (const k of [-1, 1]) {
      // party: pink tights and shoes; school: white socks and black shoes
      ctx.beginPath(); ctx.roundRect(k * 14 - 8, 128, 16, 60, 7); fs(ctx, school ? SKIN : '#f6dfe4');
      if (school) { ctx.beginPath(); ctx.roundRect(k * 14 - 8, 166, 16, 22, 4); fs(ctx, '#fafafa'); }
      ell(ctx, k * 14 + k * 4, 192, 13, 7); fs(ctx, school ? '#1e1a1c' : '#c2185b');
    }
  }
  if (bag) {
    ctx.beginPath(); ctx.roundRect(28, 52, 40, 50, 10); fs(ctx, '#3d7fc4');
    ctx.beginPath(); ctx.roundRect(34, 74, 28, 18, 5); fs(ctx, '#5aa0e0');
  }
  if (body) {
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(k * 36 - 7, 62, 14, 50, 7); fs(ctx, SKIN);
      ell(ctx, k * 37, 114, 8, 8); fs(ctx, SKIN);
    }
    ctx.beginPath();
    ctx.moveTo(-22, 46); ctx.lineTo(22, 46); ctx.lineTo(26, 84);
    ctx.quadraticCurveTo(52, 118, 54, 136); ctx.lineTo(-54, 136); ctx.quadraticCurveTo(-52, 118, -26, 84);
    ctx.closePath();
    if (school) {
      // red and white gingham school dress, with a white collar
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = 'rgba(214,45,45,.55)';
      for (let gx = -60; gx < 60; gx += 12) ctx.fillRect(gx, 40, 6, 100);
      for (let gy = 40; gy < 140; gy += 12) ctx.fillRect(-60, gy, 120, 6);
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-26, 84); ctx.quadraticCurveTo(0, 90, 26, 84); ctx.strokeStyle = '#b8242c'; ctx.lineWidth = 3; ctx.stroke();
      for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 50); ctx.quadraticCurveTo(k * 14, 62, k * 22, 48); ctx.lineTo(k * 4, 46); ctx.closePath(); fs(ctx, '#fff', INK, 2); }
      for (const k of [-1, 1]) { ell(ctx, k * 28, 56, 12, 10); ctx.fillStyle = '#fff'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(214,45,45,.55)'; for (let gx = -6; gx < 6; gx += 2) ctx.fillRect(k * 28 + gx * 6, 44, 6, 24); ctx.restore(); ell(ctx, k * 28, 56, 12, 10); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke(); }
    } else {
    fs(ctx, DRESS);
    ctx.beginPath(); ctx.moveTo(-26, 84); ctx.quadraticCurveTo(0, 90, 26, 84); ctx.strokeStyle = DRESS_DK; ctx.lineWidth = 2.5; ctx.stroke();
    for (let i = 0; i < 30; i++) {
      const py = 52 + ((i * 23) % 80), px = (((i * 37) % 90) - 45) * (0.35 + (py - 46) / 150);
      const tw = 0.5 + 0.5 * Math.sin(t * 5 + i);
      ell(ctx, px, py, 2.2, 2.2); ctx.fillStyle = `rgba(255,${210 + tw * 40},${230 + tw * 25},${0.6 + tw * 0.4})`; ctx.fill();
    }
    for (const k of [-1, 1]) { ell(ctx, k * 28, 56, 13, 11); fs(ctx, DRESS); }
    }
  }
  // face: round, a bit bigger than before
  ell(ctx, 0, 8, 33, 35); fs(ctx, SKIN);
  // curls framing her face and a curly fringe
  cloud(ctx, [[-22, -24, 12], [-6, -29, 12], [10, -28, 12], [25, -21, 11], [-33, -6, 8], [34, -4, 8]], MILA_HAIR, MILA_HAIR_DK, 2);
  ringlets(ctx, [[-20, -24, 5, 0.6], [-4, -28, 5, 1.6], [12, -27, 5, 0.4], [26, -21, 5, 2]], MILA_HAIR_HI, 2);
  eyes(ctx, 8, 12, { r: 5.6, lash: true, blink: (t % 3.5) > 3.38 });
  ctx.beginPath(); ctx.moveTo(0, 14); ctx.quadraticCurveTo(-2, 19, 1, 20); ctx.strokeStyle = SKIN_SH; ctx.lineWidth = 2; ctx.stroke();
  cheeks(ctx, 21, 19);
  if (mood === 'wow') { ell(ctx, 0, 29, 6, 7.5); fs(ctx, '#8a2f2f', INK, 2.5); } else smile(ctx, 25, 10, 0.75);
  ctx.restore();
}

// --- Nugget (Alice and Andy's apricot cockapoo; "she") ----------------------------------------
// A fluffy apricot cockapoo: soft curly coat, long curly ears, button nose, sitting up.
// Options: mood 'happy' | 'bark' | 'sad', chewing (a bit of cardboard).
const FUR = '#dda36d';
const FUR_LT = '#eebf8c';
const FUR_DK = '#b47942';
const FUR_EDGE = '#9a6334';

export function drawNugget(ctx, x, y, s = 1, { t = 0, mood = 'happy', chewing = false } = {}) {
  begin(ctx, x, y, s);
  // tail, wagging
  ctx.save(); ctx.translate(-46, 56); ctx.rotate(-0.5 + Math.sin(t * 12) * 0.45);
  cloud(ctx, [[0, 0, 10], [-5, -12, 9], [-7, -23, 8]], FUR_LT, FUR_EDGE, 2);
  ctx.restore();
  // sitting body: haunches and chest, as one soft shape
  cloud(ctx, [[-28, 70, 26], [28, 70, 26], [0, 58, 32], [0, 36, 24], [-18, 84, 18], [18, 84, 18]], FUR, FUR_EDGE);
  ringlets(ctx, [[-30, 66, 5, 0.5], [30, 68, 5, 2], [-14, 50, 4, 1.2], [16, 48, 4, 3], [-36, 82, 4, 0], [36, 80, 4, 2.4]], FUR_DK, 1.8);
  // front legs and paws
  for (const k of [-1, 1]) {
    // fluffy legs, soft into the chest (no hard outline), and little paws
    ctx.fillStyle = FUR_LT;
    for (const [ly, r] of [[66, 11], [78, 10], [88, 10]]) { ell(ctx, k * 13, ly, r, r); ctx.fill(); }
    ctx.strokeStyle = FUR_EDGE; ctx.lineWidth = 2;
    ell(ctx, k * 13, 97, 12, 7); ctx.fillStyle = FUR_LT; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = FUR_DK; ctx.lineWidth = 1.5;
    for (const dx of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(k * 13 + dx, 95); ctx.lineTo(k * 13 + dx, 100); ctx.stroke(); }
  }
  // long curly ears
  for (const k of [-1, 1]) {
    ctx.save(); ctx.translate(k * 28, -6); ctx.rotate(k * (0.1 + Math.sin(t * 3) * 0.05));
    cloud(ctx, [[0, 4, 12], [k * 2, 17, 12], [0, 30, 11], [k * 2, 41, 9]], FUR_DK, FUR_EDGE, 2);
    ringlets(ctx, [[k * 1, 10, 4, 0.5], [k * 2, 24, 4, 2], [0, 36, 4, 1]], FUR_EDGE, 1.6);
    ctx.restore();
  }
  // head with a fluffy topknot
  cloud(ctx, [[0, 0, 28], [-14, -22, 13], [0, -28, 14], [14, -22, 13], [-21, -8, 11], [21, -8, 11]], FUR, FUR_EDGE);
  ringlets(ctx, [[-12, -24, 5, 0.4], [2, -30, 5, 1.8], [14, -22, 5, 3], [-20, -8, 4, 1]], FUR_LT, 2);
  // muzzle
  ell(ctx, 0, 14, 17, 12); ctx.fillStyle = FUR_LT; ctx.fill();
  // eyes: dark and shiny
  for (const k of [-1, 1]) {
    ell(ctx, k * 11, -3, 5, 5.4); ctx.fillStyle = '#2b1d14'; ctx.fill();
    ell(ctx, k * 11 + 1.6, -4.6, 1.6, 1.6); ctx.fillStyle = '#fff'; ctx.fill();
    if (mood === 'sad') { ctx.beginPath(); ctx.moveTo(k * 5, -12); ctx.lineTo(k * 16, -9); ctx.strokeStyle = FUR_DK; ctx.lineWidth = 2.5; ctx.stroke(); }
  }
  // button nose
  ell(ctx, 0, 8, 6.5, 5); ctx.fillStyle = '#2b1d14'; ctx.fill();
  ell(ctx, -1.6, 6.6, 1.8, 1.2); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill();
  if (chewing) {
    ctx.fillStyle = '#b5875a'; ctx.fillRect(-14, 18, 28, 10);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(-14, 18, 28, 10);
  } else if (mood === 'bark') {
    ell(ctx, 0, 21, 7, 6); fs(ctx, '#8a2f2f', INK, 2);
  } else if (mood === 'sad') {
    ctx.beginPath(); ctx.moveTo(-6, 21); ctx.quadraticCurveTo(0, 16, 6, 21); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(0, 13); ctx.lineTo(0, 16); ctx.moveTo(-7, 17); ctx.quadraticCurveTo(0, 22, 7, 17);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ell(ctx, 2, 24, 4, 6); fs(ctx, '#f08a9a', INK, 1.5);
  }
  ctx.restore();
}

// --- Marlowe (Ed and Heidi's daughter; from Bounce Queen) ----------------------------------
// A trampolinist: dark brown hair slicked back with a centre parting into a high
// ponytail with a teal scrunchie, freckles, gold stud earrings, big open smile.
// Pink sparkly leotard with a teal stripe, white socks.
// Options: legs (to stand on a floor), mood 'happy' | 'dizzy', body.
const M_HAIR = '#3d2418';
const M_HAIR_HI = '#7a4a31';
const M_SKIN = '#f7d6c1';
const M_SKIN_SH = '#e6b49b';
const LEO = '#ff3d8b';
const LEO_DK = '#d2276f';
const TEAL = '#38d6c0';

function sparkle(ctx, x, y, r, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill(); ctx.restore();
}

export function drawMarlowe(ctx, x, y, s = 1, { t = 0, mood = 'happy', body = true, legs = false } = {}) {
  begin(ctx, x, y, s);
  // the high ponytail, swinging behind her head
  ctx.save();
  ctx.translate(26, -34); ctx.rotate(0.15 + Math.sin(t * 3) * 0.18);
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(26, 10, 18, 70); ctx.quadraticCurveTo(10, 84, 4, 70); ctx.quadraticCurveTo(10, 30, -8, 10); ctx.closePath();
  fs(ctx, M_HAIR);
  ctx.beginPath(); ctx.moveTo(2, 8); ctx.quadraticCurveTo(18, 24, 14, 60); ctx.strokeStyle = M_HAIR_HI; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
  if (legs) {
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(k * 16 - 9, 150, 18, 92, 8); fs(ctx, M_SKIN);
      ctx.beginPath(); ctx.roundRect(k * 16 - 10, 228, 20, 20, 6); fs(ctx, '#fff');
    }
  }
  if (body) {
    // arms in the leotard's sleeves
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(k * 40 - 8, 64, 16, 66, 8); fs(ctx, '#ff5c9d');
      ell(ctx, k * 40, 134, 8, 8); fs(ctx, M_SKIN);
    }
    // leotard: slim, high-cut, with a teal stripe and sparkles
    ctx.beginPath();
    ctx.moveTo(-28, 54); ctx.quadraticCurveTo(-40, 60, -36, 96); ctx.quadraticCurveTo(-30, 126, -30, 150);
    ctx.lineTo(-6, 162); ctx.lineTo(6, 162); ctx.lineTo(30, 150); ctx.quadraticCurveTo(30, 126, 36, 96);
    ctx.quadraticCurveTo(40, 60, 28, 54); ctx.closePath();
    fs(ctx, LEO);
    ctx.save(); ctx.clip();
    ctx.strokeStyle = TEAL; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-30, 70); ctx.lineTo(30, 150); ctx.stroke();
    ctx.restore();
    sparkle(ctx, -14, 90, 5, 0.6 + 0.4 * Math.sin(t * 6));
    sparkle(ctx, 16, 76, 4, 0.6 + 0.4 * Math.sin(t * 5 + 2));
    sparkle(ctx, -6, 132, 3.5, 0.6 + 0.4 * Math.sin(t * 7 + 4));
    ctx.fillStyle = M_SKIN_SH; ctx.fillRect(-10, 34, 20, 22); // neck
  }
  // ears with gold studs
  for (const k of [-1, 1]) { ell(ctx, k * 31, 4, 6, 9); fs(ctx, M_SKIN); ell(ctx, k * 31, 12, 2.4, 2.4); ctx.fillStyle = '#ffd34d'; ctx.fill(); }
  // face
  ell(ctx, 0, 2, 31, 37); fs(ctx, M_SKIN);
  // hair: slicked back with a centre parting
  ctx.beginPath();
  ctx.moveTo(-32, -4); ctx.quadraticCurveTo(-36, -40, 0, -44); ctx.quadraticCurveTo(36, -40, 32, -4);
  ctx.quadraticCurveTo(28, -24, 4, -30); ctx.lineTo(0, -40); ctx.lineTo(-4, -30); ctx.quadraticCurveTo(-28, -24, -32, -4); ctx.closePath();
  fs(ctx, M_HAIR);
  ctx.strokeStyle = M_HAIR_HI; ctx.lineWidth = 2;
  for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * 6, -36); ctx.quadraticCurveTo(k * 24, -32, k * 28, -12); ctx.stroke(); }
  // the scrunchie, peeping over the top
  ell(ctx, 16, -42, 9, 6, 0.4); fs(ctx, TEAL, INK, 2.5);
  if (mood === 'dizzy') {
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * 12 - 4, -6); ctx.lineTo(k * 12 + 4, 2); ctx.moveTo(k * 12 + 4, -6); ctx.lineTo(k * 12 - 4, 2); ctx.stroke(); }
    ell(ctx, 0, 22, 5, 6); fs(ctx, '#9b2346', INK, 2);
  } else {
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(k * 6, -12); ctx.quadraticCurveTo(k * 12, -16, k * 19, -12); ctx.strokeStyle = M_HAIR; ctx.lineWidth = 2.8; ctx.stroke();
    }
    eyes(ctx, -2, 12, { r: 4.6, lash: true, blink: (t % 3.9) > 3.76 });
    // freckles across her nose and cheeks
    ctx.fillStyle = '#c88866';
    for (const [fx, fy] of [[-18, 8], [-13, 11], [-8, 8], [8, 8], [13, 11], [18, 8], [-3, 10], [3, 10]]) { ell(ctx, fx, fy, 1.1, 1.1); ctx.fill(); }
    cheeks(ctx, 13, 19);
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(-3, 9, 1, 10); ctx.strokeStyle = M_SKIN_SH; ctx.lineWidth = 2; ctx.stroke();
    smile(ctx, 17, 12, 1);
  }
  ctx.restore();
}

// --- Tim, Mel, Nonna (Sally) and Pops (Paul) ---------------------------------------------------
// Drawn from Tim's photo of the four of them on a sunny walk.
// Shared bits: shoulders in a top, and a little check pattern.
function shoulders(ctx, w, fill, { neckline = 'round', lw = 3 } = {}) {
  ctx.beginPath();
  ctx.moveTo(-w, 170);
  ctx.quadraticCurveTo(-w + 2, 80, -34, 62);
  ctx.lineTo(34, 62);
  ctx.quadraticCurveTo(w - 2, 80, w, 170);
  ctx.closePath();
  fs(ctx, fill, INK, lw);
}
function neck(ctx, skin, top = 30, bottom = 66) {
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-15, top); ctx.lineTo(15, top); ctx.lineTo(17, bottom); ctx.quadraticCurveTo(0, bottom + 8, -17, bottom); ctx.closePath();
  ctx.fill();
}
function bigSmile(ctx, y, w, talk, t) {
  const open = talk ? 0.6 + 0.4 * Math.abs(Math.sin(t * 16)) : 1;
  smile(ctx, y, w, open);
}

// Tim: slim face, short brown hair swept up at the front, light stubble, grey-green eyes,
// a big grin. Navy polo shirt, a rucksack strap over one shoulder.
const TIM_SKIN = '#f1c6a7';
const TIM_SKIN_SH = '#e0ab88';
const TIM_HAIR = '#6a4a31';
const TIM_HAIR_HI = '#8c6644';
const NAVY_POLO = '#1f2a44';

export function drawTim(ctx, x, y, s = 1, { mood = 'happy', talk = 0, t = 0, body = true } = {}) {
  begin(ctx, x, y, s);
  if (body) {
    shoulders(ctx, 90, NAVY_POLO);
    neck(ctx, TIM_SKIN_SH);
    // polo collar and placket
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(k * 4, 66); ctx.lineTo(k * 30, 58); ctx.lineTo(k * 36, 78); ctx.closePath();
      fs(ctx, '#2a3758', INK, 2.5);
    }
    ctx.strokeStyle = '#121a2e'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 70); ctx.lineTo(0, 104); ctx.stroke();
    ctx.fillStyle = '#c8ccd6'; for (const by of [80, 94]) { ell(ctx, 4, by, 2.4, 2.4); ctx.fill(); }
    // rucksack strap
    ctx.beginPath(); ctx.moveTo(-58, 68); ctx.lineTo(-44, 66); ctx.lineTo(-58, 170); ctx.lineTo(-74, 170); ctx.closePath();
    fs(ctx, '#23252b', INK, 2.5);
    ctx.strokeStyle = '#7c8088'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-54, 110); ctx.lineTo(-64, 112); ctx.stroke();
  }
  for (const k of [-1, 1]) { ell(ctx, k * 38, 2, 8, 12); fs(ctx, TIM_SKIN); }
  // face: slim and a little long
  ctx.beginPath();
  ctx.moveTo(-36, -16);
  ctx.quadraticCurveTo(-38, 34, -18, 50);
  ctx.quadraticCurveTo(0, 60, 18, 50);
  ctx.quadraticCurveTo(38, 34, 36, -16);
  ctx.quadraticCurveTo(35, -54, 0, -56);
  ctx.quadraticCurveTo(-35, -54, -36, -16);
  ctx.closePath();
  fs(ctx, TIM_SKIN);
  // stubble round the jaw and chin
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(120,90,64,.28)';
  ctx.beginPath();
  ctx.moveTo(-36, 8); ctx.quadraticCurveTo(-30, 24, -14, 22); ctx.quadraticCurveTo(0, 18, 14, 22); ctx.quadraticCurveTo(30, 24, 36, 8);
  ctx.lineTo(40, 70); ctx.lineTo(-40, 70); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(100,72,50,.45)';
  for (let i = 0; i < 40; i++) {
    const a = (i * 2.39996) % (Math.PI * 2);
    const r = 6 + ((i * 7) % 26);
    const bx = Math.cos(a) * r * 1.15, by = 38 + Math.sin(a) * r * 0.5;
    if (Math.abs(bx) < 34 && by > 22) { ell(ctx, bx, by, 1, 1); ctx.fill(); }
  }
  ctx.restore();
  // brows, eyes (grey-green), nose, smile lines
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(k * 8, -20); ctx.quadraticCurveTo(k * 17, -25, k * 27, -20);
    ctx.strokeStyle = TIM_HAIR; ctx.lineWidth = 4; ctx.stroke();
    const blink = (t % 4.6) > 4.48;
    if (blink) { ctx.beginPath(); ctx.moveTo(k * 17 - 6, -8); ctx.quadraticCurveTo(k * 17, -5, k * 17 + 6, -8); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke(); }
    else {
      ell(ctx, k * 17, -8, 6, 5); fs(ctx, '#fff', INK, 1.5);
      ell(ctx, k * 17 + 0.5, -7.5, 3.4, 3.4); fs(ctx, '#6e7f68', null);
      ell(ctx, k * 17 + 0.5, -7.5, 1.6, 1.6); fs(ctx, '#22201c', null);
      ell(ctx, k * 17 + 2, -9, 1, 1); fs(ctx, '#fff', null);
    }
    // crinkles from grinning
    ctx.strokeStyle = TIM_SKIN_SH; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(k * 27, -6); ctx.lineTo(k * 31, -3); ctx.moveTo(k * 27, -2); ctx.lineTo(k * 30, 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(k * 18, 14); ctx.quadraticCurveTo(k * 24, 24, k * 22, 32); ctx.stroke();
  }
  ctx.strokeStyle = TIM_SKIN_SH; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(2, -4); ctx.quadraticCurveTo(8, 10, 0, 13); ctx.stroke();
  if (mood === 'worried') { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, 30); ctx.quadraticCurveTo(0, 25, 10, 30); ctx.stroke(); }
  else bigSmile(ctx, 22, 16, talk, t);
  // hair: short at the sides, swept up at the front, a little higher at the temples
  ctx.beginPath();
  ctx.moveTo(-38, -4);
  ctx.quadraticCurveTo(-44, -36, -30, -54);
  ctx.quadraticCurveTo(-18, -70, 2, -72);
  ctx.quadraticCurveTo(26, -74, 34, -58);
  ctx.quadraticCurveTo(44, -40, 38, -4);
  ctx.quadraticCurveTo(35, -26, 30, -36);
  ctx.quadraticCurveTo(22, -44, 12, -42);
  ctx.quadraticCurveTo(0, -50, -12, -42);
  ctx.quadraticCurveTo(-24, -42, -30, -36);
  ctx.quadraticCurveTo(-35, -24, -38, -4);
  ctx.closePath();
  fs(ctx, TIM_HAIR, INK, 3);
  ctx.strokeStyle = TIM_HAIR_HI; ctx.lineWidth = 2.5;
  for (const [a, b, c, d] of [[-16, -48, -6, -66], [0, -52, 10, -68], [14, -48, 22, -64]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  ctx.restore();
}

// Mel: straight dark-brown hair to the shoulders, centre parting, burgundy rectangular
// glasses, freckles, a big smile. White top with little navy and green flowers, a silver cross.
const MEL_SKIN = '#f4d0b6';
const MEL_SKIN_SH = '#e5b293';
const MEL_HAIR = '#4e2c1f';
const MEL_HAIR_HI = '#734331';

export function drawMel(ctx, x, y, s = 1, { mood = 'happy', talk = 0, t = 0, body = true } = {}) {
  begin(ctx, x, y, s);
  const hairEnd = body ? 104 : 64;
  // hair behind
  ctx.beginPath();
  ctx.moveTo(-32, -44); ctx.quadraticCurveTo(-54, 20, -50, hairEnd); ctx.lineTo(50, hairEnd); ctx.quadraticCurveTo(54, 20, 32, -44); ctx.quadraticCurveTo(0, -60, -32, -44); ctx.closePath();
  fs(ctx, MEL_HAIR);
  if (body) {
    shoulders(ctx, 82, '#eef1f6');
    // little flowers
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-82, 170); ctx.quadraticCurveTo(-80, 80, -34, 62); ctx.lineTo(34, 62); ctx.quadraticCurveTo(80, 80, 82, 170); ctx.closePath(); ctx.clip();
    for (let i = 0; i < 70; i++) {
      const fx = -80 + ((i * 37) % 160), fy = 64 + ((i * 53) % 108);
      ctx.fillStyle = i % 3 === 0 ? '#5b8a6a' : '#2f4475';
      ell(ctx, fx, fy, 2.6, 2.2, i); ctx.fill();
    }
    ctx.restore();
    // V neck, and the cross on a fine chain
    ctx.beginPath(); ctx.moveTo(-26, 60); ctx.lineTo(0, 104); ctx.lineTo(26, 60); ctx.closePath();
    fs(ctx, MEL_SKIN_SH, INK, 2.5);
    neck(ctx, MEL_SKIN_SH, 30, 64);
    ctx.strokeStyle = '#d9dde2'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-15, 62); ctx.quadraticCurveTo(-2, 86, 0, 88); ctx.quadraticCurveTo(2, 86, 15, 62); ctx.stroke();
    ctx.fillStyle = '#e4e7ea'; ctx.strokeStyle = '#8a9096'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.rect(-1.6, 88, 3.2, 13); ctx.rect(-5, 92, 10, 3); ctx.fill(); ctx.stroke();
  }
  // face
  ell(ctx, 0, 0, 35, 43); fs(ctx, MEL_SKIN);
  // freckles
  ctx.fillStyle = 'rgba(170,100,70,.45)';
  for (let i = 0; i < 18; i++) { const fx = (i % 2 ? 1 : -1) * (10 + ((i * 5) % 16)), fy = 4 + ((i * 7) % 12); ell(ctx, fx, fy, 1, 1); ctx.fill(); }
  // hair in front: centre parting, straight down past the face
  for (const k of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -43);
    ctx.quadraticCurveTo(k * 34, -46, k * 40, -14);
    ctx.quadraticCurveTo(k * 46, 30, k * 48, hairEnd);
    ctx.lineTo(k * 36, hairEnd - 4);
    ctx.quadraticCurveTo(k * 36, 30, k * 31, 2);
    ctx.quadraticCurveTo(k * 24, -28, 0, -36);
    ctx.closePath();
    fs(ctx, MEL_HAIR);
    ctx.beginPath(); ctx.moveTo(k * 8, -40); ctx.quadraticCurveTo(k * 34, -30, k * 39, 30);
    ctx.strokeStyle = MEL_HAIR_HI; ctx.lineWidth = 3; ctx.stroke();
  }
  // earring studs peeking out
  for (const k of [-1, 1]) { ell(ctx, k * 33, 14, 2, 2); fs(ctx, '#f2f4f6', '#9aa0a6', 1); }
  // brows, eyes, glasses
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(k * 7, -19); ctx.quadraticCurveTo(k * 15, -23, k * 25, -19);
    ctx.strokeStyle = '#3e2418'; ctx.lineWidth = 3; ctx.stroke();
  }
  eyes(ctx, -6, 15, { lash: true, blink: (t % 4.2) > 4.06, r: 4 });
  ctx.strokeStyle = '#6b2433'; ctx.lineWidth = 3.5;
  for (const k of [-1, 1]) { ctx.beginPath(); roundRect(ctx, k * 15 - 13, -16, 26, 19, 4); ctx.fillStyle = 'rgba(220,230,240,.15)'; ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-2, -8); ctx.quadraticCurveTo(0, -10, 2, -8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-28, -10); ctx.lineTo(-35, -8); ctx.moveTo(28, -10); ctx.lineTo(35, -8); ctx.stroke();
  // nose, cheeks, smile
  ctx.strokeStyle = MEL_SKIN_SH; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(-4, 11, 1, 13); ctx.stroke();
  cheeks(ctx, 14, 21);
  if (mood === 'worried') { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, 26); ctx.quadraticCurveTo(0, 22, 9, 26); ctx.stroke(); }
  else bigSmile(ctx, 20, 14, talk, t);
  ctx.restore();
}

// Nonna (Sally, Mum): a big mop of tight chestnut corkscrew curls with caramel highlights,
// round burgundy glasses, silver studs, a huge open smile. Oatmeal cardigan with red stripes.
const SALLY_SKIN = '#f1c7ad';
const SALLY_SKIN_SH = '#dba486';
const CURL = '#6b4129';
const CURL_DK = '#3f2416';
const CURL_HI = '#b88452';
const OATMEAL = '#ddcdb6';
const STRIPE = '#c8323a';

// tight corkscrews: little spirals in the dark and caramel tones
function corkscrews(ctx, pts) {
  for (const [cx, cy, r, a] of pts) {
    for (const [col, w, off] of [[CURL_DK, 2.6, 0], [CURL_HI, 1.8, 1.3]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const th = a + off + i * 0.55, rr = r * (0.35 + i / 22);
        const px = cx + Math.cos(th) * rr, py = cy + Math.sin(th) * rr;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
  }
}

export function drawSally(ctx, x, y, s = 1, { mood = 'happy', talk = 0, t = 0, body = true } = {}) {
  begin(ctx, x, y, s);
  // the mop of curls behind: wide at the temples, down to about the jaw
  const back = [[-48, -8, 18], [48, -8, 18], [-48, 14, 15], [48, 14, 15], [-42, 30, 11], [42, 30, 11],
    [-40, -34, 19], [40, -34, 19], [-20, -54, 21], [20, -54, 21], [0, -60, 20]];
  cloud(ctx, back, CURL, CURL_DK);
  corkscrews(ctx, [[-50, 12, 8, 0.3], [50, 10, 8, 2.1], [-42, 30, 6, 1.2], [42, 30, 6, 2.8], [-50, -10, 8, 0.6], [50, -12, 8, 3.1]]);
  if (body) {
    shoulders(ctx, 84, OATMEAL);
    // red stripes
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-84, 170); ctx.quadraticCurveTo(-82, 80, -34, 62); ctx.lineTo(34, 62); ctx.quadraticCurveTo(82, 80, 84, 170); ctx.closePath(); ctx.clip();
    ctx.fillStyle = STRIPE;
    for (let sy = 74; sy < 172; sy += 11) ctx.fillRect(-90, sy, 180, 4.5);
    // the cardigan's button band down the middle, with brown buttons
    ctx.fillStyle = OATMEAL; ctx.fillRect(-6, 76, 12, 96);
    ctx.strokeStyle = '#b9a68a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-6, 76); ctx.lineTo(-6, 172); ctx.moveTo(6, 76); ctx.lineTo(6, 172); ctx.stroke();
    for (const by of [92, 118, 144]) { ell(ctx, 0, by, 4, 4); fs(ctx, '#8a6a4c', '#5a412c', 1.5); }
    ctx.restore();
    neck(ctx, SALLY_SKIN_SH, 30, 64);
    // round knitted neckline
    ctx.beginPath(); ctx.moveTo(-28, 62); ctx.quadraticCurveTo(0, 90, 28, 62);
    ctx.strokeStyle = '#b9a68a'; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
  }
  // face
  ell(ctx, 0, 4, 34, 42); fs(ctx, SALLY_SKIN);
  // silver studs
  for (const k of [-1, 1]) { ell(ctx, k * 34, 16, 2.2, 2.2); fs(ctx, '#eef0f2', '#9aa0a6', 1); }
  // laughter lines
  ctx.strokeStyle = SALLY_SKIN_SH; ctx.lineWidth = 2;
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(k * 16, 12); ctx.quadraticCurveTo(k * 25, 24, k * 20, 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(k * 29, -4); ctx.lineTo(k * 33, -1); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, 11, 1, 13); ctx.lineWidth = 2.5; ctx.stroke();
  cheeks(ctx, 14, 21);
  // brows, eyes, then round burgundy glasses
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(k * 8, -22); ctx.quadraticCurveTo(k * 16, -27, k * 25, -22);
    ctx.strokeStyle = '#5a3a26'; ctx.lineWidth = 3; ctx.stroke();
  }
  eyes(ctx, -7, 15, { lash: true, blink: (t % 4.4) > 4.26, r: 3.8 });
  for (const k of [-1, 1]) {
    ell(ctx, k * 15, -7, 13, 12.5);
    fs(ctx, 'rgba(225,235,245,.18)', '#7a2236', 3.5);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(k * 15, -7, 9.5, 3.7, 4.3); ctx.stroke();
  }
  ctx.strokeStyle = '#7a2236'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-3, -9); ctx.quadraticCurveTo(0, -11, 3, -9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-28, -9); ctx.lineTo(-34, -6); ctx.moveTo(28, -9); ctx.lineTo(34, -6); ctx.stroke();
  // a huge open laugh
  if (mood === 'worried') { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, 28); ctx.quadraticCurveTo(0, 24, 9, 28); ctx.stroke(); }
  else {
    const open = talk ? 0.7 + 0.5 * Math.abs(Math.sin(t * 16)) : 1.2;
    smile(ctx, 21, 16, open);
  }
  // curls on top and tumbling over the forehead
  cloud(ctx, [[-30, -40, 14], [-12, -50, 15], [8, -50, 15], [28, -42, 14], [-40, -24, 11], [40, -22, 11], [0, -40, 10], [-20, -36, 9], [20, -34, 9]], CURL, CURL_DK);
  corkscrews(ctx, [
    [-30, -42, 8, 0.2], [-10, -52, 9, 1.4], [10, -52, 9, 2.6], [30, -44, 8, 0.9], [-42, -24, 6, 2], [42, -22, 6, 0.5],
    [-20, -36, 6, 3], [0, -40, 6, 1.8], [20, -34, 6, 0.1], [-24, -64, 7, 2.2], [0, -70, 7, 0.7], [24, -64, 7, 1.6],
  ]);
  ctx.restore();
}

// Pops (Paul, Dad): short salt-and-pepper hair, a tanned face and a big toothy grin.
// Blue and white check shirt, open at the neck.
const PAUL_SKIN = '#ecb994';
const PAUL_SKIN_SH = '#d6a07c';
const PAUL_HAIR = '#5e4f42';
const PAUL_HAIR_HI = '#9c8f82';

export function drawPaul(ctx, x, y, s = 1, { mood = 'happy', talk = 0, t = 0, body = true } = {}) {
  begin(ctx, x, y, s);
  if (body) {
    shoulders(ctx, 92, '#f4f7fc');
    // blue check
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-92, 170); ctx.quadraticCurveTo(-90, 80, -34, 62); ctx.lineTo(34, 62); ctx.quadraticCurveTo(90, 80, 92, 170); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = 'rgba(70,110,200,.75)'; ctx.lineWidth = 2;
    for (let gx = -96; gx < 100; gx += 9) { ctx.beginPath(); ctx.moveTo(gx, 56); ctx.lineTo(gx, 172); ctx.stroke(); }
    for (let gy = 60; gy < 172; gy += 9) { ctx.beginPath(); ctx.moveTo(-96, gy); ctx.lineTo(96, gy); ctx.stroke(); }
    ctx.restore();
    neck(ctx, PAUL_SKIN_SH, 30, 70);
    // open collar
    ctx.beginPath(); ctx.moveTo(-18, 62); ctx.lineTo(0, 96); ctx.lineTo(18, 62); ctx.closePath(); fs(ctx, PAUL_SKIN_SH, INK, 2.5);
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(k * 16, 56); ctx.lineTo(k * 40, 62); ctx.lineTo(k * 26, 94); ctx.lineTo(k * 4, 96); ctx.closePath();
      fs(ctx, '#f4f7fc', INK, 2.5);
    }
    ctx.fillStyle = '#e9e4d6'; for (const by of [112, 140]) { ell(ctx, 0, by, 3, 3); fs(ctx, '#ece7da', '#9aa4b8', 1); }
  }
  for (const k of [-1, 1]) { ell(ctx, k * 38, 4, 9, 13); fs(ctx, PAUL_SKIN); }
  // face: long, lined
  ctx.beginPath();
  ctx.moveTo(-36, -16);
  ctx.quadraticCurveTo(-38, 36, -18, 52);
  ctx.quadraticCurveTo(0, 60, 18, 52);
  ctx.quadraticCurveTo(38, 36, 36, -16);
  ctx.quadraticCurveTo(35, -54, 0, -56);
  ctx.quadraticCurveTo(-35, -54, -36, -16);
  ctx.closePath();
  fs(ctx, PAUL_SKIN);
  ctx.strokeStyle = PAUL_SKIN_SH; ctx.lineWidth = 1.8;
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(k * 18, 14); ctx.quadraticCurveTo(k * 25, 22, k * 22, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(k * 27, -5); ctx.lineTo(k * 31, -3); ctx.stroke();
  }
  // brows, eyes, nose
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(k * 8, -18); ctx.quadraticCurveTo(k * 17, -22, k * 27, -17);
    ctx.strokeStyle = '#4a3d32'; ctx.lineWidth = 4; ctx.stroke();
  }
  const blink = (t % 4.9) > 4.76;
  for (const k of [-1, 1]) {
    if (blink) { ctx.beginPath(); ctx.moveTo(k * 17 - 6, -7); ctx.quadraticCurveTo(k * 17, -4, k * 17 + 6, -7); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke(); }
    else {
      // smiling eyes: a bit narrowed
      ell(ctx, k * 17, -7, 5.5, 4); fs(ctx, '#fff', INK, 1.5);
      ell(ctx, k * 17, -6.5, 3, 3); fs(ctx, '#4c3a2c', null);
      ell(ctx, k * 17 + 1.4, -8, 1, 1); fs(ctx, '#fff', null);
    }
  }
  ctx.strokeStyle = PAUL_SKIN_SH; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(2, -3); ctx.quadraticCurveTo(9, 12, 0, 15); ctx.stroke();
  ctx.fillStyle = 'rgba(220,110,90,.22)'; ell(ctx, -23, 14, 7, 4); ctx.fill(); ell(ctx, 23, 14, 7, 4); ctx.fill();
  if (mood === 'worried') { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, 32); ctx.quadraticCurveTo(0, 27, 10, 32); ctx.stroke(); }
  else bigSmile(ctx, 24, 17, talk, t);
  // hair: short and grey, swept to the side
  ctx.beginPath();
  ctx.moveTo(-38, -2);
  ctx.quadraticCurveTo(-46, -42, -28, -60);
  ctx.quadraticCurveTo(-6, -76, 16, -72);
  ctx.quadraticCurveTo(40, -66, 40, -40);
  ctx.quadraticCurveTo(42, -20, 38, -2);
  ctx.quadraticCurveTo(35, -24, 30, -34);
  ctx.quadraticCurveTo(10, -46, -14, -40);
  ctx.quadraticCurveTo(-30, -36, -33, -26);
  ctx.quadraticCurveTo(-36, -14, -38, -2);
  ctx.closePath();
  fs(ctx, PAUL_HAIR, INK, 3);
  ctx.strokeStyle = PAUL_HAIR_HI; ctx.lineWidth = 2.5;
  for (const [a, b, c, d] of [[-24, -46, 0, -66], [-6, -48, 20, -66], [12, -46, 32, -54]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo((a + c) / 2, d - 2, c, d); ctx.stroke(); }
  ctx.restore();
}

// Heidi: long, wavy dark-brown hair, a soft side parting, hazel eyes, freckles, a gentle
// closed smile. Emerald satin top with puffed sleeves. Option: the white feather fascinator.
const HEIDI_SKIN = '#f2cdb5';
const HEIDI_SKIN_SH = '#e0ae92';
const HEIDI_HAIR = '#3f2519';
const HEIDI_HAIR_HI = '#6a3f2a';
const EMERALD = '#145a5c';
const EMERALD_HI = '#2e8a87';

function waves(ctx, k, top, bottom, x0, x1) {
  // one side of long wavy hair, as a wiggly band
  ctx.beginPath();
  ctx.moveTo(k * x0, top);
  const n = 5, h = (bottom - top) / n;
  for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(k * (x1 + (i % 2 ? 8 : -2)), top + h * (i - 0.5), k * (x1 + (i % 2 ? 2 : 6)), top + h * i);
  ctx.lineTo(k * (x0 + 4), bottom - 4);
  for (let i = n - 1; i >= 0; i--) ctx.quadraticCurveTo(k * (x0 - (i % 2 ? 6 : -2)), top + h * (i + 0.5), k * x0, top + h * i);
  ctx.closePath();
}

export function drawHeidi(ctx, x, y, s = 1, { mood = 'happy', talk = 0, t = 0, body = true, fascinator = false } = {}) {
  begin(ctx, x, y, s);
  const hairEnd = body ? 128 : 70;
  // hair behind
  ctx.beginPath();
  ctx.moveTo(-34, -44); ctx.quadraticCurveTo(-58, 20, -54, hairEnd); ctx.lineTo(54, hairEnd); ctx.quadraticCurveTo(58, 20, 34, -44); ctx.quadraticCurveTo(0, -60, -34, -44); ctx.closePath();
  fs(ctx, HEIDI_HAIR);
  if (body) {
    shoulders(ctx, 80, EMERALD);
    // puffed satin sleeves with a sheen
    for (const k of [-1, 1]) {
      ell(ctx, k * 66, 104, 24, 40, k * 0.2); fs(ctx, EMERALD, INK, 3);
      ctx.strokeStyle = EMERALD_HI; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(k * 60, 76); ctx.quadraticCurveTo(k * 74, 100, k * 64, 132); ctx.stroke();
    }
    ctx.strokeStyle = EMERALD_HI; ctx.lineWidth = 3;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * 20, 110); ctx.quadraticCurveTo(k * 30, 140, k * 24, 168); ctx.stroke(); }
    // deep V neckline
    ctx.beginPath(); ctx.moveTo(-24, 60); ctx.lineTo(0, 112); ctx.lineTo(24, 60); ctx.closePath();
    fs(ctx, HEIDI_SKIN_SH, INK, 2.5);
    neck(ctx, HEIDI_SKIN_SH, 30, 64);
  }
  // face
  ell(ctx, 0, 0, 34, 43); fs(ctx, HEIDI_SKIN);
  ctx.fillStyle = 'rgba(165,95,65,.4)';
  for (let i = 0; i < 16; i++) { const fx = (i % 2 ? 1 : -1) * (9 + ((i * 5) % 15)), fy = 3 + ((i * 7) % 11); ell(ctx, fx, fy, 0.9, 0.9); ctx.fill(); }
  // hair in front: a soft side parting (to her right), waves falling past the shoulders
  ctx.beginPath();
  ctx.moveTo(-10, -44);
  ctx.quadraticCurveTo(-40, -42, -40, -8);
  ctx.lineTo(-30, 0);
  ctx.quadraticCurveTo(-28, -30, -10, -36);
  ctx.closePath();
  fs(ctx, HEIDI_HAIR);
  ctx.beginPath();
  ctx.moveTo(-10, -44);
  ctx.quadraticCurveTo(30, -48, 40, -10);
  ctx.lineTo(31, 4);
  ctx.quadraticCurveTo(24, -26, -10, -36);
  ctx.closePath();
  fs(ctx, HEIDI_HAIR);
  for (const k of [-1, 1]) {
    waves(ctx, k, -12, hairEnd, 34, 48);
    fs(ctx, HEIDI_HAIR, INK, 2.5);
    ctx.strokeStyle = HEIDI_HAIR_HI; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(k * 40, 0); ctx.quadraticCurveTo(k * 50, 30, k * 42, 60); ctx.quadraticCurveTo(k * 50, 86, k * 44, hairEnd - 10); ctx.stroke();
  }
  ctx.strokeStyle = HEIDI_HAIR_HI; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-6, -42); ctx.quadraticCurveTo(24, -42, 34, -14); ctx.stroke();
  // brows, eyes (hazel), nose
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(k * 7, -18); ctx.quadraticCurveTo(k * 15, -22, k * 24, -18);
    ctx.strokeStyle = '#3a2216'; ctx.lineWidth = 3; ctx.stroke();
  }
  const blink = (t % 4.4) > 4.27;
  for (const k of [-1, 1]) {
    if (blink) { ctx.beginPath(); ctx.moveTo(k * 15 - 6, -6); ctx.quadraticCurveTo(k * 15, -3, k * 15 + 6, -6); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke(); continue; }
    ell(ctx, k * 15, -6, 6, 4.6); fs(ctx, '#fff', INK, 1.5);
    ell(ctx, k * 15, -5.5, 3.3, 3.3); fs(ctx, '#7a7a4a', null);
    ell(ctx, k * 15, -5.5, 1.5, 1.5); fs(ctx, '#22201c', null);
    ell(ctx, k * 15 + 1.5, -7, 1, 1); fs(ctx, '#fff', null);
    ctx.beginPath(); ctx.moveTo(k * 15 + k * 5, -8); ctx.lineTo(k * 15 + k * 9, -11); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.strokeStyle = HEIDI_SKIN_SH; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, 1); ctx.quadraticCurveTo(-4, 11, 1, 13); ctx.stroke();
  cheeks(ctx, 13, 20);
  // a gentle closed smile (talking opens it)
  if (talk) bigSmile(ctx, 21, 11, talk, t);
  else if (mood === 'worried') { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, 26); ctx.quadraticCurveTo(0, 22, 9, 26); ctx.stroke(); }
  else {
    ctx.strokeStyle = '#a14a4a'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-12, 22); ctx.quadraticCurveTo(0, 30, 12, 22); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-13, 21); ctx.lineTo(-15, 19); ctx.moveTo(13, 21); ctx.lineTo(15, 19); ctx.stroke();
  }
  if (fascinator) {
    // white feather fascinator, perched on the top of her head
    ctx.save();
    ctx.translate(14, -50);
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI + (i / 15) * Math.PI * 1.1;
      const len = 26 + ((i * 7) % 14);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.7 - 6, Math.cos(a) * len, Math.sin(a) * len * 0.8);
      ctx.strokeStyle = '#8f8370'; ctx.lineWidth = 7.5; ctx.stroke();
      ctx.strokeStyle = i % 2 ? '#fbf7ee' : '#ebe3d2'; ctx.lineWidth = 5; ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(20, -14); ctx.quadraticCurveTo(46, -40, 60, -70);
    ctx.strokeStyle = '#8f8370'; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.strokeStyle = '#fbf7ee'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// --- Faith (from Faith's Café) -----------------------------------------------------------------
// Ported exactly from the café's SVG (art.js faithSVG): long brown hair with a middle
// parting and caramel ends, fair skin, freckles, silver hoop earrings, a black top and the
// claret apron with her name badge. Moods: 'happy' (big grin), 'smirk' (side-eye), 'wow'.
// The SVG paths are drawn as they are, moved so (0, 0) is the middle of her face.
const P = (d) => new Path2D(d);
let FAITH_PATHS = null;
function faithPaths() {
  if (FAITH_PATHS || typeof Path2D === 'undefined') return FAITH_PATHS;
  FAITH_PATHS = {
    hairBack: P('M100,30 C58,30 44,62 45,98 C46,132 40,172 30,220 L170,220 C160,172 154,132 155,98 C156,62 142,30 100,30Z'),
    top: P('M34,220 C36,172 60,154 100,154 C140,154 164,172 166,220Z'),
    neckV: P('M89,153 L100,168 L111,153Z'),
    apron: P('M68,220 L71,178 C86,184 114,184 129,178 L132,220Z'),
    straps: P('M72,179 L80,157 M128,179 L120,157'),
    lockL: P('M63,108 C56,140 54,178 60,212 C67,192 72,160 73,128Z'),
    lockR: P('M139,108 C147,140 149,174 143,206 C136,188 131,160 129,130Z'),
    face: P('M68,82 C68,46 132,46 132,82 C132,108 118,126 100,128 C82,126 68,108 68,82Z'),
    fringeL: P('M100,34 C76,34 61,52 62,82 C63,104 66,118 63,136 C72,122 74,104 73,88 C73,66 84,48 100,41Z'),
    fringeR: P('M100,34 C123,34 139,50 138,80 C136,70 132,64 128,60 C120,50 110,44 100,41Z'),
    shine: P('M99,37 C90,41 82,50 76,64 M101,37 C110,41 118,48 124,56'),
    nose: P('M100,90 Q98,97 101.6,98'),
  };
  return FAITH_PATHS;
}

export function drawFaith(ctx, x, y, s = 1, { mood = 'happy', t = 0, body = true, apron = true } = {}) {
  const fp = faithPaths();
  if (!fp) return; // no Path2D (e.g. a pretend canvas in tests)
  begin(ctx, x, y, s);
  ctx.translate(-100, -88);
  const grad = (stops) => { const g = ctx.createLinearGradient(0, 30, 0, 220); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const hairG = grad([[0, '#4e2a1c'], [0.55, '#6e3a22'], [1, '#a5643a']]);
  const fringeG = grad([[0, '#5c3220'], [0.6, '#7c4428'], [1, '#b57444']]);
  const skin = '#f8dccb', shade = '#eec3ad';
  const fill = (p, c) => { ctx.fillStyle = c; ctx.fill(p); };
  const line = (p, c, w) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(p); };
  if (!body) { ctx.beginPath(); ctx.rect(0, 0, 200, 150); ctx.clip(); }
  fill(fp.hairBack, hairG);
  ctx.fillStyle = shade; ctx.beginPath(); roundRect(ctx, 89, 116, 22, 42, 9); ctx.fill();
  if (body) {
    fill(fp.top, '#26201f');
    fill(fp.neckV, shade);
    if (apron) {
      fill(fp.apron, '#7b1e3a');
      line(fp.straps, '#7b1e3a', 5);
      ctx.fillStyle = '#f7efe4'; ctx.beginPath(); roundRect(ctx, 106, 191, 21, 9, 2); ctx.fill();
      ctx.fillStyle = '#7b1e3a'; ctx.font = '800 5.6px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('FAITH', 116.5, 197.8);
    }
  }
  fill(fp.lockL, fringeG);
  fill(fp.lockR, fringeG);
  // ear and silver hoop
  ell(ctx, 134, 90, 6, 9); ctx.fillStyle = shade; ctx.fill();
  ell(ctx, 135, 95, 1.6, 1.6); ctx.fillStyle = '#eef0f6'; ctx.fill();
  ctx.beginPath(); ctx.arc(134.5, 101, 4, 0, Math.PI * 2); ctx.strokeStyle = '#d6d9e2'; ctx.lineWidth = 1.7; ctx.stroke();
  fill(fp.face, skin);
  fill(fp.fringeL, fringeG);
  fill(fp.fringeR, fringeG);
  ctx.globalAlpha = 0.55; line(fp.shine, '#c0824f', 1.6); ctx.globalAlpha = 1;
  faithFace(ctx, mood, t, line, fp);
  ctx.restore();
}

function faithFace(ctx, mood, t, line, fp) {
  const brow = '#5b2e1c', lash = '#2a1810';
  const curve = (x0, y0, cx, cy, x1, y1, c, w) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); };
  const dot = (cx, cy, r, c, a = 1) => { ctx.globalAlpha = a; ell(ctx, cx, cy, r, r); ctx.fillStyle = c; ctx.fill(); ctx.globalAlpha = 1; };
  const blush = () => { ctx.globalAlpha = 0.45; ell(ctx, 80, 99, 6.5, 3.6); ctx.fillStyle = '#f2a197'; ctx.fill(); ell(ctx, 120, 99, 6.5, 3.6); ctx.fill(); ctx.globalAlpha = 1; };
  const freckles = () => { for (const [fx, fy, r] of [[85, 95, 0.8], [89, 97, 0.7], [111, 97, 0.7], [115, 95, 0.8]]) dot(fx, fy, r, '#d9a07f', 0.5); };
  const nose = () => line(fp.nose, '#dba58e', 1.6);
  const mouth = (open, inner, tongue) => {
    ctx.beginPath(); ctx.moveTo(open[0], 103); ctx.quadraticCurveTo(100, open[1], 200 - open[0], 103); ctx.quadraticCurveTo(open[2], open[3], 100, open[3]); ctx.quadraticCurveTo(200 - open[2], open[3], open[0], 103); ctx.closePath();
    ctx.fillStyle = inner; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#fffaf2'; ctx.fillRect(80, 98, 40, 9.4); ctx.restore();
    ell(ctx, 100, tongue, 5.5, 2.3); ctx.fillStyle = '#e4797a'; ctx.fill();
  };
  ctx.lineCap = 'round';
  if (mood === 'smirk') {
    curve(80, 74, 87, 72, 94, 74, brow, 2.6);
    curve(106, 70, 113, 65, 120, 69, brow, 2.6);
    ell(ctx, 87, 85.5, 5.2, 3.4); ctx.fillStyle = '#fff'; ctx.fill(); dot(89.6, 86, 2.9, '#4a3426');
    ell(ctx, 113, 85, 5.2, 3.6); ctx.fillStyle = '#fff'; ctx.fill(); dot(115.6, 85.6, 2.9, '#4a3426');
    curve(81.2, 84, 87, 81, 92.8, 84, lash, 2.4);
    curve(107.2, 83.6, 113, 80.6, 118.8, 83.6, lash, 2.4);
    nose(); freckles();
    curve(93, 107.5, 101, 109, 108.5, 104.5, '#b5504c', 2.4);
    ctx.globalAlpha = 0.35; ell(ctx, 120, 99, 6, 3.4); ctx.fillStyle = '#f2a197'; ctx.fill(); ctx.globalAlpha = 1;
    return;
  }
  if (mood === 'wow') {
    curve(80, 71, 87, 66, 94, 70, brow, 2.6);
    curve(106, 70, 113, 66, 120, 71, brow, 2.6);
    curve(82, 86, 87, 80, 92, 86, lash, 2.6);
    curve(108, 86, 113, 80, 118, 86, lash, 2.6);
    nose(); freckles(); blush();
    mouth([89, 102, 109, 117], '#8e3434', 113.5);
    return;
  }
  // happy: a big open grin (blinks now and then)
  curve(80, 73, 87, 69, 94, 72, brow, 2.6);
  curve(106, 72, 113, 69, 120, 73, brow, 2.6);
  if ((t % 4.5) > 4.36) {
    curve(82, 86, 87, 88, 92, 86, lash, 2.4);
    curve(108, 86, 113, 88, 118, 86, lash, 2.4);
  } else {
    for (const ex of [87, 113]) {
      ctx.beginPath(); ctx.moveTo(ex - 5, 87); ctx.quadraticCurveTo(ex, 82.5, ex + 5, 87); ctx.quadraticCurveTo(ex, 85.5, ex - 5, 87); ctx.closePath();
      ctx.fillStyle = '#4a3426'; ctx.fill(); ctx.strokeStyle = '#4a3426'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();
      dot(ex + 1.6, 84.8, 1, '#fff');
    }
  }
  nose(); freckles(); blush();
  mouth([88, 101, 109, 116.5], '#9b3c3c', 113);
}

// --- Rex (from Rex's Rummage) ------------------------------------------------------------------
// Drawn from Tim's photos. Straight, shoulder-length dark-brown hair with a sharp centre
// parting, a few lighter streaks and a curtain fringe; fair skin, grey-green eyes, a sideways
// smirk. Grunge and vintage: a huge oversized black sweatshirt (or hoodie) with a little white
// print, and a gold chain with a peace-sign pendant.
// Moods: 'smirk' (his look in the photo), 'happy' (big grin), 'wow', 'oops', 'deadpan' (the stare).
const REX_SKIN = '#f5d3bf';
const REX_SKIN_SH = '#e6b49c';
const REX_HAIR = '#4f3424';
const REX_HAIR_DK = '#33211a';
const REX_HAIR_HI = '#8e6a48';
const REX_NAVY = '#24232a';
const REX_NAVY_DK = '#141317';
const GOLD = '#d8b04a';

export function drawRex(ctx, x, y, s = 1, { mood = 'smirk', talk = 0, t = 0, body = true, hoodie = false } = {}) {
  begin(ctx, x, y, s);
  // hair behind: shaggy, down past the jaw, choppy ends
  const end = body ? 66 : 54;
  ctx.beginPath();
  ctx.moveTo(-30, -48);
  ctx.quadraticCurveTo(-58, -20, -54, 22);
  ctx.lineTo(-54, end); ctx.lineTo(-40, end - 2); ctx.lineTo(-30, end - 14);
  ctx.lineTo(30, end - 14); ctx.lineTo(40, end - 2); ctx.lineTo(54, end);
  ctx.lineTo(54, 22);
  ctx.quadraticCurveTo(58, -20, 30, -48);
  ctx.quadraticCurveTo(0, -64, -30, -48);
  ctx.closePath();
  fs(ctx, REX_HAIR_DK);
  if (body) {
    // oversized: wide, dropped shoulders
    if (hoodie) {
      ctx.beginPath(); ctx.moveTo(-56, 74); ctx.quadraticCurveTo(-60, 40, -36, 44); ctx.lineTo(36, 44); ctx.quadraticCurveTo(60, 40, 56, 74); ctx.closePath();
      fs(ctx, REX_NAVY_DK, INK, 2.5); // the hood, bunched behind the neck
    }
    ctx.beginPath();
    ctx.moveTo(-108, 170);
    ctx.quadraticCurveTo(-110, 96, -82, 78);
    ctx.quadraticCurveTo(-56, 64, -32, 60);
    ctx.lineTo(32, 60);
    ctx.quadraticCurveTo(56, 64, 82, 78);
    ctx.quadraticCurveTo(110, 96, 108, 170);
    ctx.closePath();
    fs(ctx, REX_NAVY);
    // baggy folds, and the dropped shoulder seams
    ctx.strokeStyle = REX_NAVY_DK; ctx.lineWidth = 2.5;
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(k * 78, 82); ctx.quadraticCurveTo(k * 90, 120, k * 86, 168); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(k * 44, 118); ctx.quadraticCurveTo(k * 54, 140, k * 50, 166); ctx.stroke();
    }
    neck(ctx, REX_SKIN_SH, 30, 62);
    // neckline: ribbed crew, or the hoodie's with drawstrings
    ctx.beginPath(); ctx.moveTo(-32, 60); ctx.quadraticCurveTo(0, 80, 32, 60);
    ctx.strokeStyle = REX_NAVY_DK; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    if (hoodie) {
      ctx.strokeStyle = '#e9e4da'; ctx.lineWidth = 3;
      for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * 12, 74); ctx.quadraticCurveTo(k * 14, 100, k * 10, 122); ctx.stroke(); }
    }
    // a little white print on the chest (made-up, no words)
    ctx.save();
    ctx.translate(30, 104); ctx.rotate(-0.12);
    ctx.strokeStyle = '#f2efe8'; ctx.lineWidth = 3;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) { const bx = -14 + i * 8; ctx.moveTo(bx, r * 9); ctx.lineTo(bx + 5, r * 9 - (i % 2 ? 4 : 0)); }
      ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(22, -6); ctx.lineTo(20, 12); ctx.stroke();
    ell(ctx, 19.6, 18, 1.8, 1.8); ctx.fillStyle = '#f2efe8'; ctx.fill();
    ctx.restore();
    // gold chain and the peace-sign pendant
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-17, 58); ctx.quadraticCurveTo(-6, 90, 0, 92); ctx.quadraticCurveTo(6, 90, 17, 58); ctx.stroke();
    ell(ctx, 0, 99, 6.5, 6.5); fs(ctx, null, GOLD, 2.4);
    ctx.beginPath(); ctx.moveTo(0, 92.5); ctx.lineTo(0, 105.5); ctx.moveTo(0, 99); ctx.lineTo(-4.6, 103.6); ctx.moveTo(0, 99); ctx.lineTo(4.6, 103.6);
    ctx.lineWidth = 1.6; ctx.stroke();
  }
  // ears, mostly hidden by the hair
  for (const k of [-1, 1]) { ell(ctx, k * 35, 4, 7, 11); fs(ctx, REX_SKIN); }
  // face: soft, young, a gently rounded chin
  ctx.beginPath();
  ctx.moveTo(-34, -14);
  ctx.quadraticCurveTo(-36, 30, -16, 46);
  ctx.quadraticCurveTo(0, 54, 16, 46);
  ctx.quadraticCurveTo(36, 30, 34, -14);
  ctx.quadraticCurveTo(32, -50, 0, -52);
  ctx.quadraticCurveTo(-32, -50, -34, -14);
  ctx.closePath();
  fs(ctx, REX_SKIN);
  // brows: soft, light brown; the left one a touch higher when smirking
  for (const k of [-1, 1]) {
    const lift = mood === 'smirk' && k < 0 ? -2 : mood === 'wow' ? -4 : 0;
    const low = mood === 'deadpan' ? 3 : 0; // brows down, straight across
    ctx.beginPath(); ctx.moveTo(k * 7, -17 + lift + low); ctx.quadraticCurveTo(k * 16, -21 + lift + (low ? 1 : 0), k * 26, -19 + lift);
    ctx.strokeStyle = '#4a3122'; ctx.lineWidth = 3.4; ctx.stroke();
  }
  // eyes: grey-green, a little heavy-lidded
  const blink = (t % 4.4) > 4.27;
  for (const k of [-1, 1]) {
    if (blink) { ctx.beginPath(); ctx.moveTo(k * 16 - 6, -6); ctx.quadraticCurveTo(k * 16, -3, k * 16 + 6, -6); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke(); continue; }
    ell(ctx, k * 16, -6, 6.2, mood === 'wow' ? 5.6 : 4.6); fs(ctx, '#fff', INK, 1.5);
    ell(ctx, k * 16 + 0.6, -5.6, 3.3, 3.3); fs(ctx, '#7c8a72', null);
    ell(ctx, k * 16 + 0.6, -5.6, 1.6, 1.6); fs(ctx, '#1f1c18', null);
    ell(ctx, k * 16 + 1.8, -7, 1, 1); fs(ctx, '#fff', null);
    if (mood === 'deadpan') { ctx.beginPath(); ctx.moveTo(k * 16 - 6.5, -6.5); ctx.lineTo(k * 16 + 6.5, -6.5); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke(); }
    else if (mood !== 'wow') { ctx.beginPath(); ctx.moveTo(k * 16 - 6.5, -8); ctx.quadraticCurveTo(k * 16, -11.5, k * 16 + 6.5, -8); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); }
  }
  // nose and cheeks
  ctx.strokeStyle = REX_SKIN_SH; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(1, 0); ctx.quadraticCurveTo(-4, 11, 2, 13); ctx.stroke();
  cheeks(ctx, 14, 20);
  // mouth
  ctx.strokeStyle = INK; ctx.lineWidth = 2.8;
  if (talk) bigSmile(ctx, 22, 12, talk, t);
  else if (mood === 'happy') bigSmile(ctx, 21, 14, 0, t);
  else if (mood === 'wow') { ell(ctx, 0, 27, 5, 6.5); fs(ctx, '#8a2f2f', INK, 2.5); }
  else if (mood === 'deadpan') { ctx.beginPath(); ctx.moveTo(-9, 26); ctx.quadraticCurveTo(0, 24, 9, 26); ctx.stroke(); }
  else if (mood === 'oops') { ctx.beginPath(); ctx.moveTo(-10, 27); ctx.quadraticCurveTo(-4, 24, 0, 27); ctx.quadraticCurveTo(4, 30, 10, 26); ctx.stroke(); }
  else {
    // the smirk: closed, pulled up on one side
    ctx.beginPath(); ctx.moveTo(-11, 24); ctx.quadraticCurveTo(0, 29, 12, 21); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, 21); ctx.quadraticCurveTo(15, 20, 15, 17); ctx.stroke();
  }
  // curtain fringe: parted in the middle, swept out to both sides, wispy ends past the cheeks
  for (const k of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(k * 2, -50);
    ctx.quadraticCurveTo(k * 40, -54, k * 44, -10);
    ctx.quadraticCurveTo(k * 47, 20, k * 48, 40);
    ctx.lineTo(k * 44, 48); ctx.lineTo(k * 36, 46); ctx.lineTo(k * 31, 24);
    ctx.quadraticCurveTo(k * 30, 0, k * 26, -14);
    ctx.quadraticCurveTo(k * 22, -26, k * 13, -30);
    ctx.quadraticCurveTo(k * 8, -40, k * 2, -44);
    ctx.closePath();
    fs(ctx, REX_HAIR);
    // sun-bleached streaks
    ctx.strokeStyle = REX_HAIR_HI; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(k * 8, -46); ctx.quadraticCurveTo(k * 30, -44, k * 36, -6); ctx.quadraticCurveTo(k * 39, 12, k * 39, 34); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(k * 14, -40); ctx.quadraticCurveTo(k * 24, -30, k * 20, -22); ctx.stroke();
    ctx.strokeStyle = REX_HAIR_DK; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(k * 20, -46); ctx.quadraticCurveTo(k * 38, -36, k * 41, 10); ctx.stroke();
  }
  ctx.restore();
}
