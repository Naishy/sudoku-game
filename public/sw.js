// Offline play + auto-update. Serve from cache, refresh in the background.
// Bump VERSION on every deploy: that's what tells installed copies there's a new version.
const VERSION = 'v25'; // keep in step with VERSION in js/telemetry.js
const CACHE = `gridworks-${VERSION}`;
const ASSETS = [
  './',
  './css/style.css',
  './js/main.js',
  './js/sudoku.js',
  './js/puzzles.js',
  './js/days.js',
  './js/painting.js',
  './js/store.js',
  './js/lines.js',
  './js/cast.js',
  './js/audio.js',
  './js/haptics.js',
  './js/gift.js',
  './js/telemetry.js',
  './js/carry.js',
  './js/ziggy.js',
  './js/walk.js',
  './js/pair.js',
  './js/together.js',
  './js/examples.js',
  './js/vendor/qrcode.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('gridworks-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // app.webmanifest carries progress in its start address: always fresh, never cached
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('/app.webmanifest')) return;
  if (url.pathname.startsWith('/api/')) return;
  const key = req.mode === 'navigate' ? './' : req;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(key, { ignoreSearch: true });
      const fresh = fetch(req)
        .then((res) => { if (res.ok && !res.redirected) cache.put(key, res.clone()); return res; })
        .catch(() => hit);
      return hit || fresh;
    }),
  );
});
