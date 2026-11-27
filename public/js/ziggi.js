// Ziggi, Ed and Heidi's cat, who shows you round and gives the hints (by sitting next to
// the right part of the grid, as cats do). Drawn in the family cast's style: (x, y) is the
// middle of the face, s the scale; a head is about 80 units tall at 1.
//
// Ziggi is a black cat. (To add Ziggi to the family cast later, move this into
// family-games cast/people.js so every game draws them alike.)
const INK = '#2b1d14';
export const COAT = {
  fur: '#2b282b', // black, with a soft sheen so the shape still reads
  dark: '#1b191b',
  light: '#3f3a3e',
  stripes: false,
  eyes: '#cfd23a',
  sheen: '#4a454a',
  nose: '#5c3b43',
  whisker: 'rgba(240,236,228,0.75)',
};

function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
function fs(ctx, fill, stroke = INK, lw = 3) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

export function drawZiggi(ctx, x, y, s = 1, { t = 0, blink = false, body = true } = {}) {
  const C = COAT;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (body) {
    // the tail, curled round the front
    ctx.beginPath();
    ctx.moveTo(30, 92);
    ctx.bezierCurveTo(70, 96, 72, 60 + Math.sin(t * 2) * 4, 52, 44);
    ctx.strokeStyle = INK; ctx.lineWidth = 17; ctx.stroke();
    ctx.strokeStyle = C.fur; ctx.lineWidth = 12; ctx.stroke();
    // sitting body
    ctx.beginPath();
    ctx.moveTo(-26, 24);
    ctx.bezierCurveTo(-48, 50, -50, 92, -30, 98);
    ctx.lineTo(30, 98);
    ctx.bezierCurveTo(50, 92, 48, 50, 26, 24);
    ctx.closePath();
    fs(ctx, C.fur);
    // chest
    ell(ctx, 0, 56, 16, 26); fs(ctx, C.light, null);
    // front paws
    for (const k of [-1, 1]) { ell(ctx, k * 12, 96, 11, 7); fs(ctx, C.light, INK, 2.5); }
    if (C.stripes) {
      ctx.strokeStyle = C.dark; ctx.lineWidth = 4;
      for (const k of [-1, 1]) for (const yy of [50, 64, 78]) { ctx.beginPath(); ctx.moveTo(k * 42, yy); ctx.quadraticCurveTo(k * 34, yy + 2, k * 30, yy + 8); ctx.stroke(); }
    }
  }
  if (body) { ctx.beginPath(); ctx.moveTo(-36, 50); ctx.quadraticCurveTo(-34, 32, -22, 28); ctx.strokeStyle = C.sheen; ctx.lineWidth = 3; ctx.stroke(); }
  // ears
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(k * 14, -26); ctx.lineTo(k * 34, -46); ctx.lineTo(k * 38, -12); ctx.closePath();
    fs(ctx, C.fur);
    ctx.beginPath(); ctx.moveTo(k * 20, -24); ctx.lineTo(k * 32, -38); ctx.lineTo(k * 33, -18); ctx.closePath();
    fs(ctx, '#6e4a55', null);
  }
  // head
  ell(ctx, 0, 0, 40, 33); fs(ctx, C.fur);
  ctx.beginPath(); ctx.arc(0, 2, 32, Math.PI * 1.15, Math.PI * 1.45); ctx.strokeStyle = C.sheen; ctx.lineWidth = 3; ctx.stroke();
  if (C.stripes) {
    ctx.strokeStyle = C.dark; ctx.lineWidth = 4;
    for (const dx of [-9, 0, 9]) { ctx.beginPath(); ctx.moveTo(dx, -31); ctx.lineTo(dx * 0.7, -19); ctx.stroke(); }
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * 39, -2); ctx.lineTo(k * 29, 0); ctx.moveTo(k * 38, 8); ctx.lineTo(k * 29, 8); ctx.stroke(); }
  }
  // muzzle
  for (const k of [-1, 1]) { ell(ctx, k * 8, 12, 10, 8); fs(ctx, C.light, null); }
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
  ctx.strokeStyle = C.sheen; ctx.lineWidth = 2; ctx.stroke();
  // whiskers
  ctx.strokeStyle = C.whisker; ctx.lineWidth = 1.4;
  for (const k of [-1, 1]) for (const dy of [-2, 3]) { ctx.beginPath(); ctx.moveTo(k * 18, 12 + dy); ctx.lineTo(k * 46, 8 + dy * 2.2); ctx.stroke(); }
  ctx.restore();
}
