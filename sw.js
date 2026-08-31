/**
 * SERVICE WORKER — Chris Legend of Shadows Universe
 * Strategy: Cache-first for static assets, Network-first for data/API.
 * Provides offline shell so the app works even without connectivity.
 */

const CACHE_NAME   = 'cls-universe-v2';
const BASE         = 'https://legend200711.github.io/universe';
const OFFLINE_PAGE = `${BASE}/index.html`;

// Files to precache on install (app shell)
const PRECACHE_URLS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/css/main.css`,
  `${BASE}/js/app.js`,
  `${BASE}/js/canvas.js`,
  `${BASE}/js/firebase-service.js`,
  `${BASE}/firebase-config.js`,
  `${BASE}/manifest.json`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
  // Google Fonts are intentionally excluded from precache to avoid CORS issues
];

// ── Install: precache app shell ───────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch strategy ────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, and Firebase API requests
  if (request.method !== 'GET') return;
  if (url.origin.includes('firestore.googleapis.com')) return;
  if (url.origin.includes('firebase')) return;
  if (url.protocol === 'chrome-extension:') return;

  // For navigation requests: try network, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_PAGE))
    );
    return;
  }

  // For static assets: cache-first
  if (
    url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff2?|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
