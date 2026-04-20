/* ─── Saroj Dashboard — Service Worker ─── */
const CACHE_NAME = 'saroj-dash-v4';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './accounting.html',
  './personal.html',
  './poetry.html',
  './calculator.html',
  './cv.html',
  './note.html'
];

/* Install — cache core shell */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(
        PRECACHE.filter(url => {
          // Only precache pages that actually exist
          return true;
        })
      ).catch(() => {
        // Silently fail if sub-pages don't exist yet
        return cache.add('./index.html');
      });
    }).then(() => self.skipWaiting())
  );
});

/* Activate — clean old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* Fetch — network-first with cache fallback */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For same-origin HTML navigations: network first, fallback to cache
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a fresh copy
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        }))
    );
    return;
  }

  // For external requests (fonts etc.): cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
