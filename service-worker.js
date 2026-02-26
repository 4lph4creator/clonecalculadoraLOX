// =====================
// VERSION CACHE
// =====================
const CACHE_NAME = "lox-cache-v2";

// =====================
// ARCHIVOS A CACHEAR
// =====================
const urlsToCache = [
  "./",
  "./index.html",
  "./stiletto.css",
  "./app.js",
  "./img/bg.png",
  "./img/logo.jpg",
  "./manifest.json"
];

// =====================
// INSTALL
// =====================
self.addEventListener("install", event => {
  self.skipWaiting(); // activa inmediatamente

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// =====================
// ACTIVATE (limpia caches viejos)
// =====================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// =====================
// FETCH
// =====================
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
