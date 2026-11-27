// Renders the app icons: a little painting (a finished grid, oil on canvas), framed on the wall.
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
    res.end(`<canvas id=c></canvas><script type=module>
      import { paint } from './js/painting.js';
      import { parse } from './js/sudoku.js';
      const GRID = parse('534678912672195348198342567859761423426853791713924856961537284287419635345286179');
      window.render = (size) => {
        const c = document.getElementById('c'); c.width = c.height = size;
        const x = c.getContext('2d');
        const k = size / 512;
        x.fillStyle = '#efece6'; x.fillRect(0, 0, size, size);
        // the frame and its shadow
        x.fillStyle = 'rgba(40,30,20,0.18)'; x.fillRect(52 * k, 66 * k, 416 * k, 416 * k);
        x.fillStyle = '#ffffff'; x.fillRect(46 * k, 46 * k, 420 * k, 420 * k);
        paint(x, GRID, { x: 76 * k, y: 76 * k, size: 360 * k, level: 'composition', palette: 1, seed: 'icon' });
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
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const url = await page.evaluate((s) => window.render(s), size);
  await writeFile(join(root, 'icons', name), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', name);
}
await browser.close();
server.close();
