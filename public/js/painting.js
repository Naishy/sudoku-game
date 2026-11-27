// A finished grid becomes a painting. Each number is a colour from the day's palette,
// and each level paints in its own way:
//   sketch       watercolour washes on paper
//   study        glazed tiles
//   composition  a colour field in oils
//   masterpiece  gouache shapes on board, after the Bauhaus
// Everything is seeded by the puzzle, so a work looks the same every time it's drawn.
import { rng } from './sudoku.js';

// Nine colours each, for the things Heidi loves. Number d is colour d − 1.
export const PALETTES = [
  { name: 'Sumac & Pistachio', colours: ['#b5373b', '#93a35b', '#e2a52c', '#6e3350', '#e09a7a', '#3f7262', '#eadcb8', '#2f2a2a', '#c4692b'] },
  { name: 'Emerald', colours: ['#0f5c4f', '#1f8a70', '#86cfae', '#d8efe2', '#e2bc4e', '#a87c33', '#24302e', '#e4d9c4', '#4f9aa3'] },
  { name: 'Canberra Autumn', colours: ['#8c2f1b', '#c4562a', '#e39b3a', '#f1d17a', '#7a8b4a', '#41573a', '#b38b6d', '#5b3a29', '#e1cfb1'] },
  { name: 'Persian Tiles', colours: ['#1d4e89', '#2f80c4', '#67bccd', '#e0d3b5', '#d9a441', '#b3532f', '#2c2c54', '#7da36b', '#9b3d5a'] },
  { name: 'Bondi Morning', colours: ['#0a6e8a', '#3aa7c4', '#a2dbe6', '#f6e7c9', '#f2b35a', '#e07a5f', '#3d405b', '#81b29a', '#e7d3ad'] },
  { name: 'Lemon Grove', colours: ['#f2d24b', '#e5a033', '#9cb35a', '#4d7c3f', '#ede0b4', '#c9d8a2', '#2f4a35', '#e7795b', '#8a6d3b'] },
  { name: 'Rose & Cardamom', colours: ['#e8a6a1', '#c55b6b', '#7d2f4b', '#f5dcd2', '#9fb38a', '#5c7a5a', '#d8b56a', '#3e3343', '#e6d9cb'] },
  { name: 'Gallery White', colours: ['#e2ded3', '#d9d6cf', '#b9b5ac', '#8c877d', '#5e5a52', '#33312d', '#b8443a', '#e3c26b', '#1d1b19'] },
  { name: 'Kitchen Garden', colours: ['#6b8e23', '#a8c45e', '#f2c14e', '#f78154', '#4d9078', '#b4436c', '#5d576b', '#ddd1b5', '#2e4057'] },
  { name: 'Blue Hour', colours: ['#14213d', '#274c77', '#6096ba', '#a8d0f0', '#d3dbe2', '#8b8c89', '#f4a261', '#e76f51', '#2a9d8f'] },
  { name: 'Saffron & Indigo', colours: ['#2e3a87', '#5664d8', '#a3acf2', '#f4b400', '#f9dc80', '#c2410c', '#f3d3a2', '#1b1b2f', '#7a4fa0'] },
  { name: 'Christmas Table', colours: ['#7d1f2b', '#b23a3a', '#1f4d3a', '#3f7a4f', '#d9b44a', '#e8d8b4', '#8a5a3b', '#2a2a2a', '#c97f5a'] },
];

export const STYLES = {
  sketch: { medium: 'Watercolour on paper' },
  study: { medium: 'Glazed tiles' },
  composition: { medium: 'Oil on canvas' },
  masterpiece: { medium: 'Gouache on board' },
};

/** The palette for a day (Christmas gets its own). */
export function paletteFor(day, date) {
  if (date && date.getMonth() === 11 && date.getDate() >= 24 && date.getDate() <= 26) return 11;
  return ((day % 11) + 11) % 11;
}

const seedOf = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** The work's title, like a painting's: "Study in Emerald". */
export function titleOf(level, palette) {
  const name = PALETTES[palette].name;
  if (level === 'masterpiece') return `Masterpiece (${name})`;
  return `${level[0].toUpperCase()}${level.slice(1)} in ${name}`;
}

/**
 * Paint a solved grid (81 digits) into ctx, size × size pixels, at x, y.
 * `reveal` (0–1) paints it in a wave from the top left, for the finishing animation.
 */
export function paint(ctx, grid, { x = 0, y = 0, size, level, palette, seed = '', reveal = 1 }) {
  const P = PALETTES[palette].colours;
  const rnd = rng(seedOf(`${seed}:${level}`));
  const cell = size / 9;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath(); ctx.rect(0, 0, size, size); ctx.clip();
  const ground = { sketch: '#f7f3ea', study: '#efe9dd', composition: P[7] === '#2f2a2a' ? '#e8dfcc' : '#ece5d6', masterpiece: '#f1ebdd' }[level];
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, size, size);
  const shown = (r, c) => {
    // the wave: diagonal from the top left
    const k = (r + c) / 16;
    return Math.max(0, Math.min(1, (reveal * 1.6 - k) / 0.6));
  };
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const d = grid[r * 9 + c];
      const a = shown(r, c);
      const j = () => rnd() - 0.5;
      // draw the randomness even when hidden, so the work doesn't change as it's revealed
      const jit = Array.from({ length: 12 }, j);
      if (!d || a <= 0) continue;
      ctx.globalAlpha = a;
      const col = P[d - 1];
      const x0 = c * cell, y0 = r * cell;
      if (level === 'sketch') {
        // two soft washes, a little off-centre, with a darker edge where the paint pooled
        for (let k = 0; k < 2; k++) {
          const cx = x0 + cell / 2 + jit[k] * cell * 0.25, cy = y0 + cell / 2 + jit[k + 2] * cell * 0.25;
          const rad = cell * (0.62 + jit[k + 4] * 0.18);
          const gr = ctx.createRadialGradient(cx, cy, rad * 0.1, cx, cy, rad);
          gr.addColorStop(0, hexA(col, 0.55));
          gr.addColorStop(0.75, hexA(col, 0.42));
          gr.addColorStop(0.92, hexA(col, 0.6));
          gr.addColorStop(1, hexA(col, 0));
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
        }
      } else if (level === 'study') {
        const g = cell * 0.06;
        ctx.fillStyle = col;
        roundRect(ctx, x0 + g, y0 + g, cell - 2 * g, cell - 2 * g, cell * 0.08);
        ctx.fill();
        // the glaze: a highlight top left, a shadow bottom right
        const gl = ctx.createLinearGradient(x0, y0, x0 + cell, y0 + cell);
        gl.addColorStop(0, 'rgba(255,255,255,0.32)');
        gl.addColorStop(0.45, 'rgba(255,255,255,0.04)');
        gl.addColorStop(1, 'rgba(0,0,0,0.16)');
        ctx.fillStyle = gl;
        roundRect(ctx, x0 + g, y0 + g, cell - 2 * g, cell - 2 * g, cell * 0.08);
        ctx.fill();
      } else if (level === 'composition') {
        // a block of colour laid on in horizontal strokes, edges soft and a touch ragged
        ctx.fillStyle = col;
        ctx.fillRect(x0 - 0.5, y0 - 0.5, cell + 1, cell + 1);
        for (let k = 0; k < 6; k++) {
          const yy = y0 + (k + 0.5) * (cell / 6) + jit[k] * cell * 0.05;
          ctx.strokeStyle = k % 2 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.045)';
          ctx.lineWidth = cell / 7;
          ctx.beginPath(); ctx.moveTo(x0 - cell * 0.05, yy); ctx.lineTo(x0 + cell * 1.05, yy + jit[k + 6] * cell * 0.08); ctx.stroke();
        }
      } else {
        // a coloured ground and a shape: the number picks the shape, its place the turn
        ctx.fillStyle = col;
        ctx.fillRect(x0, y0, cell + 0.5, cell + 0.5);
        ctx.fillStyle = P[(d + 3) % 9];
        shape(ctx, (d - 1) % 5, x0, y0, cell, (r + c * 2) % 4);
      }
    }
  }
  ctx.globalAlpha = 1;
  // the surface: a fine grain so it reads as paint, not pixels
  if (reveal >= 1) grain(ctx, size, rnd, level);
  ctx.restore();
}

function shape(ctx, kind, x, y, s, turn) {
  ctx.save();
  ctx.translate(x + s / 2, y + s / 2);
  ctx.rotate((turn * Math.PI) / 2);
  ctx.beginPath();
  const h = s / 2;
  if (kind === 0) ctx.arc(0, 0, h * 0.62, 0, Math.PI * 2);
  else if (kind === 1) { ctx.moveTo(-h, -h); ctx.arc(-h, -h, s, 0, Math.PI / 2); ctx.closePath(); }
  else if (kind === 2) { ctx.moveTo(-h, h); ctx.arc(0, h, h, Math.PI, 0); ctx.closePath(); }
  else if (kind === 3) { ctx.moveTo(-h, h); ctx.lineTo(h, h); ctx.lineTo(-h, -h); ctx.closePath(); }
  else { ctx.rect(-h * 0.5, -h * 0.5, h, h); }
  ctx.fill();
  ctx.restore();
}

function grain(ctx, size, rnd, level) {
  const n = Math.round(size * size / 90);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${level === 'sketch' ? 0.08 : 0.05})` : `rgba(0,0,0,${level === 'sketch' ? 0.035 : 0.045})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1.2, 1.2);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** A canvas with the work in a frame, for the gallery and the finish. */
export function workCanvas(grid, opts, px = 300) {
  const dpr = typeof devicePixelRatio === 'number' ? Math.min(3, devicePixelRatio) : 1;
  const cv = document.createElement('canvas');
  cv.width = Math.round(px * dpr);
  cv.height = Math.round(px * dpr);
  cv.style.width = `${px}px`;
  cv.style.height = `${px}px`;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  paint(ctx, grid, { ...opts, size: px });
  return cv;
}
