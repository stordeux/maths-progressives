// Service worker : met tout le site en cache pour qu'il marche hors ligne.
// La liste ASSETS et VERSION sont régénérées par « node tools/sw-assets.mjs » (vérifié par les tests).
const VERSION = '189b5369fd36';
const ASSETS = [
  './',
  './assets/css/base.css',
  './assets/css/home.css',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512-maskable.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon.svg',
  './assets/js/home.js',
  './engine/answers/checks.js',
  './engine/answers/fields.js',
  './engine/answers/index.js',
  './engine/draw/numberLine.js',
  './engine/draw/plot.js',
  './engine/draw/realLine.js',
  './engine/engine.js',
  './engine/keypad.js',
  './engine/scratchpad.js',
  './engine/storage.js',
  './engine/util/arith.js',
  './engine/util/fmt.js',
  './engine/util/rand.js',
  './index.html',
  './manifest.webmanifest',
  './modules/calcul/app.js',
  './modules/calcul/index.html',
  './modules/calcul/levels.js',
  './modules/fractions/index.html',
  './modules/fractions/levels.js',
  './modules/inegalites/index.html',
  './modules/inegalites/levels.js',
  './modules/poly2/index.html',
  './modules/poly2/levels.js',
  './modules/registry.js',
  './modules/relatifs/draw.js',
  './modules/relatifs/index.html',
  './modules/relatifs/levels.js',
  './modules/calcul/',
  './modules/fractions/',
  './modules/inegalites/',
  './modules/poly2/',
  './modules/relatifs/',
];
const CACHE = 'maths-progressives-' + VERSION;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('maths-progressives-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
