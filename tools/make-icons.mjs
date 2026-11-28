// Renders the app icons: a finished Sudoku as a painting in a gold frame, hanging on a gallery wall, with Ziggy sitting big in front.
// Usage: npm run icons   (needs Playwright + Chromium available)
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const server = createServer(async (req, res) => {
  if (req.url === '/icon.html') {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&display=swap">
    <canvas id=c></canvas><script type=module>
      import { PALETTES } from './js/painting.js';
      import { drawZiggy } from './js/ziggy.js';
      const P = PALETTES.find((p) => p.name === 'Persian Tiles').colours;
      const ORDER = [0, 4, 2, 5, 8, 1, 7, 3, 6]; // which palette colour each number gets
      await document.fonts.load('700 40px Fraunces').catch(() => {});
      // scale < 1 shrinks the picture into the middle (the maskable icon's safe zone)
      // a solved grid: the painting on the wall shows its numbers as colours
      const SOL = ['534678912', '672195348', '198342567', '859761423', '426853791', '713924856', '961537284', '287419635', '345286179'];
      // scale < 1 shrinks the picture into the middle (the maskable icon's safe zone)
      window.render = (size, scale = 1) => {
        const c = document.getElementById('c'); c.width = c.height = size;
        const x = c.getContext('2d');
        // the gallery wall, a little warmer at the top as if lit from above
        const wall = x.createLinearGradient(0, 0, 0, size);
        wall.addColorStop(0, '#f7f2e8'); wall.addColorStop(1, '#e6dece');
        x.fillStyle = wall; x.fillRect(0, 0, size, size);
        const k = (size / 512) * scale;
        x.translate((size - 512 * k) / 2, (size - 512 * k) / 2);
        // the picture wire from its hook
        x.strokeStyle = '#8c877d'; x.lineWidth = 3 * k; x.lineCap = 'round';
        x.beginPath(); x.moveTo(146 * k, 104 * k); x.lineTo(256 * k, 38 * k); x.lineTo(366 * k, 104 * k); x.stroke();
        x.fillStyle = '#5e5a52'; x.beginPath(); x.arc(256 * k, 36 * k, 7 * k, 0, 7); x.fill();
        // the gold frame, its shadow and the mount
        const F = 124 * k, T = 80 * k, FS = 264 * k, B = 20 * k;
        x.fillStyle = 'rgba(40,30,20,0.22)'; x.fillRect(F + 8 * k, T + 14 * k, FS, FS);
        const g = x.createLinearGradient(F, T, F + FS, T + FS);
        g.addColorStop(0, '#e8c867'); g.addColorStop(0.5, '#b98d2f'); g.addColorStop(1, '#e2bd5a');
        x.fillStyle = g; x.fillRect(F, T, FS, FS);
        x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(F + B, T + B, FS - 2 * B, FS - 2 * B);
        // the painting: a whole solved Sudoku, a colour for each number, with the boxes picked out
        const X = F + B + 4 * k, Y = T + B + 4 * k, S = FS - 2 * B - 8 * k, cell = S / 9;
        for (let r = 0; r < 9; r++) for (let q = 0; q < 9; q++) {
          x.fillStyle = P[ORDER[SOL[r][q] - 1]]; x.fillRect(X + q * cell, Y + r * cell, cell + 0.5, cell + 0.5);
        }
        x.strokeStyle = '#f6f1e6';
        for (let i = 0; i <= 9; i++) {
          x.lineWidth = (i % 3 ? 1.2 : 4.5) * k;
          x.beginPath(); x.moveTo(X + i * cell, Y); x.lineTo(X + i * cell, Y + S); x.moveTo(X, Y + i * cell); x.lineTo(X + S, Y + i * cell); x.stroke();
        }
        // Ziggy, big, sitting on the gallery floor in front of it, with his shadow
        x.fillStyle = 'rgba(40,30,20,0.18)'; x.beginPath(); x.ellipse(268 * k, 484 * k, 112 * k, 14 * k, 0, 0, 7); x.fill();
        drawZiggy(x, 256 * k, 304 * k, 1.8 * k);
        return c.toDataURL('image/png');
      };
      window.ready = true;
    </script>`);
    return;
  }
  try {
    const body = await readFile(join(root, req.url));
    res.setHeader('content-type', extname(req.url) === '.js' ? 'text/javascript; charset=utf-8' : 'application/octet-stream');
    res.end(body);
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/icon.html`);
await page.waitForFunction('window.ready');
for (const [name, size, scale] of [['icon-192.png', 192, 1], ['icon-512.png', 512, 1], ['apple-touch-icon.png', 180, 1], ['icon-maskable-512.png', 512, 0.74]]) {
  const url = await page.evaluate(([s, k]) => window.render(s, k), [size, scale]);
  await writeFile(join(root, 'icons', name), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', name);
}
await browser.close();
server.close();
