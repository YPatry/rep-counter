// Service Worker — Rep Counter
// Stratégie: Cache First pour les assets, Network First pour les données

const CACHE_NAME = 'rep-counter-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/stats/',
  '/stats/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap',
];

// ── INSTALL: mise en cache des assets statiques ──────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http') || url.includes('fonts.googleapis')));
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: nettoyage des anciens caches ────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: stratégie hybride ──────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Firebase / external APIs: network only (avec fallback silencieux)
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com') && !url.hostname.includes('fonts')) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Google Fonts: cache first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }))
    );
    return;
  }

  // App shell: cache first avec fallback réseau
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached || new Response('Offline', { status: 503 }));
        return cached || networkFetch;
      })
    );
    return;
  }

  // Tout le reste: réseau
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// ── BACKGROUND SYNC (si supporté) ────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reps') {
    // Le sync sera déclenché par l'app principale
    event.waitUntil(Promise.resolve());
  }
});
