// Renders the app icons: one box of a Sudoku as a painting in a gold frame on Heidi's emerald, with Ziggy sitting in front.
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
      const EMERALD = '#145a5c';
      const P = PALETTES.find((p) => p.name === 'Persian Tiles').colours;
      const ORDER = [0, 4, 2, 5, 8, 1, 7, 3, 6]; // which palette colour each number gets
      await document.fonts.load('700 40px Fraunces').catch(() => {});
      const lum = (h) => parseInt(h.slice(1, 3), 16) * 0.3 + parseInt(h.slice(3, 5), 16) * 0.59 + parseInt(h.slice(5, 7), 16) * 0.11;
      // scale < 1 shrinks the picture into the middle (the maskable icon's safe zone)
      window.render = (size, scale = 1) => {
        const c = document.getElementById('c'); c.width = c.height = size;
        const x = c.getContext('2d');
        x.fillStyle = EMERALD; x.fillRect(0, 0, size, size);
        const k = (size / 512) * scale;
        x.translate((size - 512 * k) / 2, (size - 512 * k) / 2);
        // the gold frame, its shadow and the mount
        const F = 60 * k, FS = 330 * k;
        x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(F + 8 * k, F + 14 * k, FS, FS);
        const g = x.createLinearGradient(F, F, F + FS, F + FS);
        g.addColorStop(0, '#e8c867'); g.addColorStop(0.5, '#b98d2f'); g.addColorStop(1, '#e2bd5a');
        x.fillStyle = g; x.fillRect(F, F, FS, FS);
        x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(F + 22 * k, F + 22 * k, FS - 44 * k, FS - 44 * k);
        x.fillStyle = '#f6f1e6'; x.fillRect(80 * k, 80 * k, 290 * k, 290 * k);
        // the painting: one box of a Sudoku, a colour for each number
        const X = 88 * k, cell = 274 * k / 3, gap = 6 * k;
        x.textAlign = 'center'; x.textBaseline = 'middle';
        x.font = '700 ' + cell * 0.58 + 'px Fraunces, Georgia, serif';
        for (let i = 0; i < 9; i++) {
          const col = P[ORDER[i]];
          const cx = X + (i % 3) * cell + gap / 2, cy = X + ((i / 3) | 0) * cell + gap / 2;
          x.fillStyle = col; x.beginPath(); x.roundRect(cx, cy, cell - gap, cell - gap, 10 * k); x.fill();
          x.fillStyle = lum(col) > 150 ? '#26221e' : '#ffffff';
          x.fillText(String(i + 1), cx + (cell - gap) / 2, cy + (cell - gap) / 2 + cell * 0.04);
        }
        // Ziggy, sitting in front of the frame's corner
        drawZiggy(x, 392 * k, 330 * k, 1.2 * k);
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
