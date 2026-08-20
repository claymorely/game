// Minimal service worker for offline caching of core assets
const CACHE = "clayle-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./js/main.js",
  "./js/game.js",
  "./js/utils/seed.js",
  "./js/utils/geo.js",
  "./js/utils/storage.js",
  "./data/countries.json",
  "./manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
