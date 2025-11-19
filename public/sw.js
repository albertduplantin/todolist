const CACHE_NAME = 'taskflow-v3'; // Bumped version to invalidate old cache
const urlsToCache = [
  '/',
  '/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache opened:', CACHE_NAME);
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests (POST, PUT, DELETE, etc.)
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignore chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Ignore non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // ⚠️ CRITICAL: NEVER cache API routes - they must always be fresh
  // This prevents stale message data from being served from cache
  if (event.request.url.includes('/api/')) {
    console.log('[SW] Bypassing cache for API route:', event.request.url);
    event.respondWith(fetch(event.request));
    return;
  }

  // ⚠️ NEVER cache Clerk auth routes
  if (event.request.url.includes('/sign-in') || 
      event.request.url.includes('/sign-up') ||
      event.request.url.includes('clerk')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        console.log('[SW] Serving from cache:', event.request.url);
        return response;
      }

      // Cache miss - fetch from network
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache static assets only (HTML, CSS, JS, images)
        if (event.request.url.match(/\.(html|css|js|png|jpg|jpeg|svg|ico|json)$/)) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      }).catch((error) => {
        console.error('[SW] Fetch failed:', error);
        // Network request failed, return from cache if available
        return caches.match(event.request);
      });
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

