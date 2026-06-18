const CACHE_NAME = 'aventur-cache-v1';
const OFFLINE_URL = '/';

// Core static assets to cache immediately on SW install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  'https://ai.google.dev/static/site-assets/images/share-ais-513315318.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching static app shell...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Cleaning up old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass Service Worker cache for all API routes (always request fresh AI & sync endpoints)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.warn(`[ServiceWorker] Network error fetching API route ${url.pathname}:`, err);
        return new Response(
          JSON.stringify({ error: "Offline. Connect to the internet to query the travel AI planner." }),
          { 
            status: 503, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      })
    );
    return;
  }

  // 2. Bypass Service Worker cache for non-GET requests (POST, PUT, DELETE)
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. Stale-While-Revalidate Strategy for all other static/document resources (CSS, JS, Fonts, Images)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Cache a copy of the fresh network response if it's a valid 200 GET response
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[ServiceWorker] Fetch failed; returning cached resource if available.', err);
          // If network failed and there's no cache, fall back to offline home page for navigation requests
          if (event.request.mode === 'navigate') {
            return cache.match(OFFLINE_URL);
          }
          throw err;
        });

        // Return cached resource immediately if available, or wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});
