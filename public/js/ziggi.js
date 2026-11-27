// Ziggi, Ed and Heidi's cat, who shows you round and gives the hints (by sitting next to
// the right part of the grid, as cats do). Drawn in the family cast's style: (x, y) is the
// middle of the face, s the scale; a head is about 80 units tall at 1.
//
// Drawn from Tim's photo: a brown tabby with dark stripes, a white chin and chest, and
// white paws. (To add Ziggi to the family cast later, move this into family-games
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

/** The size of Ziggi sitting, in her own units: for fitting her into a box. */
export const ZIGGI_BOX = { left: -52, right: 74, top: -48, bottom: 104 };

export function drawZiggi(ctx, x, y, s = 1, { t = 0, blink = false, body = true } = {}) {
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
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(k * 6, 70); ctx.lineTo(k * 6, 92); ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 2; ctx.stroke();
      ell(ctx, k * 13, 97, 12, 7.5); fs(ctx, C.white, INK, 2.5);
      ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.4;
      for (const dx of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(k * 13 + dx, 95); ctx.lineTo(k * 13 + dx, 100); ctx.stroke(); }
    }
  }
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
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, 13); ctx.moveTo(-7, 15); ctx.quadraticCurveTo(-3, 18, 0, 13); ctx.quadraticCurveTo(3, 18, 7, 15);
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  // whiskers
  ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.4;
  for (const k of [-1, 1]) for (const dy of [-2, 3]) { ctx.beginPath(); ctx.moveTo(k * 18, 12 + dy); ctx.lineTo(k * 46, 8 + dy * 2.2); ctx.stroke(); }
  ctx.restore();
}
