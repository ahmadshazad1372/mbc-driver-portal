const CACHE_NAME = 'mbc-driver-portal-v5';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never cache calls to the Google Apps Script API — always go to network
  if (url.includes('script.google.com') || url.includes('googleusercontent.com')) return;

  // App shell (index.html) — ALWAYS try the network first so updates show
  // immediately; only fall back to cache if the device is offline.
  if (event.request.mode === 'navigate' || url.endsWith('/') || url.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Icons/manifest — cache-first is fine, they rarely change
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
