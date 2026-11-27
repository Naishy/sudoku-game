// Makes the QR code and a printable A6 insert for Heidi's Christmas card.
//
//   npm run card                      # QR opens the game and the present
//   npm run card -- --family CODE     # ...and signs her in to the family scoreboard
//
// Writes card/qr.svg, card/qr.png, card/insert.pdf and card/insert.png.
// card/ is git-ignored: with --family the files contain the family code.
// Needs Playwright + Chromium (for the PDF) and `npm install` (for qrcode).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const QRCode = require('qrcode');
const { chromium } = require('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', 'public');
const out = join(here, '..', 'card');

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const site = (opt('url') || 'https://gridworks.tequinox.net/').replace(/\/?$/, '/');
const family = opt('family');
const link = `${site}?card${family ? `&family=${encodeURIComponent(family)}` : ''}`;

await mkdir(out, { recursive: true });
const qrOpts = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#26221e', light: '#ffffff' } };
const svg = await QRCode.toString(link, { ...qrOpts, type: 'svg' });
await writeFile(join(out, 'qr.svg'), svg);
await QRCode.toFile(join(out, 'qr.png'), link, { ...qrOpts, width: 1024 });

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const page = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600&family=Fraunces:ital,wght@0,600;1,400&display=swap">
<style>
  @page { size: 105mm 148mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 105mm; height: 148mm; }
  body { font-family: "DM Sans", sans-serif; color: #26221e; background: #f6f4ef; display: flex; flex-direction: column; align-items: center; overflow: hidden; }
  .band { width: 100%; height: 6mm; background: #145a5c; flex: none; }
  .tag { margin-top: 7mm; font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase; color: #7a7166; }
  h1 { font-family: Fraunces, serif; font-weight: 600; margin: 2mm 0 0; font-size: 28pt; line-height: 1; text-align: center; }
  .mid { display: flex; align-items: center; gap: 3mm; margin-top: 7mm; }
  canvas { width: 34mm; height: 46mm; }
  .qr { background: #fff; border: 0.3mm solid #e2d9ca; border-radius: 2mm; padding: 1.5mm; text-align: center; }
  .qr img { width: 47mm; height: 47mm; display: block; }
  .qr b { font-weight: 600; font-size: 8.5pt; display: block; margin-top: 0.5mm; }
  .how { margin: 8mm 7mm 0; text-align: center; font-size: 9.5pt; line-height: 1.35; }
  .url { font-weight: 600; font-size: 8.5pt; margin-top: 1.5mm; color: #7a7166; }
  .code { font-size: 8pt; margin-top: 1mm; color: #7a7166; }
  .spacer { flex: 1; }
  .byline { font-family: Fraunces, serif; font-style: italic; color: #145a5c; font-size: 15pt; text-align: center; margin-top: -1mm; }
  .from { font-family: Fraunces, serif; font-style: italic; color: #145a5c; font-size: 11pt; margin-bottom: 4mm; }
</style></head><body>
  <div class="band"></div>
  <div class="tag">A new painting every day</div>
  <h1>Grid Works</h1>
  <div class="byline">by Heidi</div>
  <div class="mid">
    <canvas id="heidi" width="340" height="460"></canvas>
    <div class="qr"><img src="qr.svg" alt=""><b>Scan to open</b></div>
  </div>
  <div class="how">Point your phone's camera at the code to open your present: a new Sudoku every day, and every grid you finish becomes a painting.</div>
  <div class="url">${esc(site.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</div>
  ${family ? `<div class="code">Family scoreboard code: <b>${esc(family)}</b></div>` : ''}
  <div class="spacer"></div>
  <div class="from">Happy Christmas! Love from Tim &amp; Mel</div>
  <div class="band"></div>
<script type="module">
  import { drawHeidi } from './js/cast.js';
  await document.fonts.ready;
  const c = document.getElementById('heidi');
  const x = c.getContext('2d');
  drawHeidi(x, 170, 150, 1.5, { mood: 'happy', t: 0.1 });
  window.ready = true;
</script></body></html>`;

const server = createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/insert.html') { res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(page); return; }
  if (url === '/qr.svg') { res.setHeader('content-type', 'image/svg+xml'); res.end(svg); return; }
  try {
    const body = await readFile(join(root, url));
    res.setHeader('content-type', extname(url) === '.js' ? 'text/javascript; charset=utf-8' : 'application/octet-stream');
    res.end(body);
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 397, height: 559 }, deviceScaleFactor: 3 });
await tab.goto(`http://localhost:${server.address().port}/insert.html`);
await tab.waitForFunction('window.ready');
await tab.pdf({ path: join(out, 'insert.pdf'), width: '105mm', height: '148mm', printBackground: true });
await tab.screenshot({ path: join(out, 'insert.png') });
await browser.close();
server.close();
console.log(`QR link: ${link}`);
console.log(`wrote ${['qr.svg', 'qr.png', 'insert.pdf', 'insert.png'].map((f) => join('card', f)).join(', ')}`);
