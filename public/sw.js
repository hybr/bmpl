/**
 * Service Worker for V4L PWA
 * Provides offline support and caching
 */

const CACHE_NAME = 'v4l-cache-v1';
const RUNTIME_CACHE = 'v4l-runtime-v1';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
  '/manifest.json'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Precaching assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API requests - network first
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseClone = response.clone();

          // Cache successful responses
          if (response.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseClone = response.clone();

            // Cache the fetched response
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });

            return response;
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
