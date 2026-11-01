/* Bump VERSION whenever a shipped asset changes. New workers wait for open games to close. */
const VERSION = '2.0.2';
const SCOPE = new URL(self.registration.scope);
const PREFIX = `pension-plan:${SCOPE.pathname}:`;
const CACHE = PREFIX + VERSION;
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./story.js",
  "./journey.js",
  "./alabama.js",
  "./golf.js",
  "./state.js",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png"
];
const URLS = new Set(ASSETS.map(path => new URL(path, SCOPE).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    ASSETS.map(path => new Request(new URL(path, SCOPE), { cache: 'reload' }))
  )));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  url.search = '';
  url.hash = '';
  if (!URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(url.href);
    return saved || fetch(event.request);
  })());
});
