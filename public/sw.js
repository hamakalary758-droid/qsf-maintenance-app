const CACHE_NAME = 'qsf-shell-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png'
];

// Install event: pre-cache static app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: cache-first for same-origin static assets & navigation; network-only for Supabase
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always network-only for Supabase requests or non-GET requests
  if (url.hostname.includes('supabase.co') || event.request.method !== 'GET') {
    return;
  }

  // Handle navigation requests and same-origin static assets
  if (event.request.mode === 'navigate' || url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Cache-first: return cached asset, update cache in background if network is available
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
        });
      })
    );
  }
});
