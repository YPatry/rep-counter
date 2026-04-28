// Service Worker — Rep Counter v2
const CACHE_NAME = 'rep-counter-v2';
const BASE = '/rep-counter';

const STATIC_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/stats/`,
  `${BASE}/stats/index.html`,
  `${BASE}/manifest.json`,
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Firebase & APIs externes → réseau uniquement
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken') ||
    url.hostname.includes('firebase') ||
    (url.hostname.includes('googleapis.com') && !url.hostname.includes('fonts'))
  ) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Google Fonts → cache first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // App shell → network first, cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            return cached || caches.match(`${BASE}/index.html`);
          });
        })
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
