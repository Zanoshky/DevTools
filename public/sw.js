const CACHE_NAME = 'devtoolbox-v3';

// Assets to precache on install for offline fallback
const PRECACHE_ASSETS = [
  '/',
  '/privacy',
  '/manifest.json',
];

// Only cache responses from our own origin and trusted CDNs
const TRUSTED_ORIGINS = [
  self.location.origin,
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

// Never cache these paths
const CACHE_BLOCKLIST = [
  '/api/',
  '/sw.js',
];

function isTrustedOrigin(url) {
  return TRUSTED_ORIGINS.some(origin => url.startsWith(origin));
}

function isBlocklisted(url) {
  return CACHE_BLOCKLIST.some(path => new URL(url).pathname.startsWith(path));
}

// Install - precache core assets, activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

// Activate - clean old caches, claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SW_UPDATED',
              message: 'Service worker updated - your data is safe',
            });
          });
        })
      )
  );
});

// Fetch - network-first for everything, fall back to cache when offline
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (event.request.method !== 'GET') return;
  if (!isTrustedOrigin(url)) return;
  if (isBlocklisted(url)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Got a network response - cache it for offline use
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;

          // For navigation requests, fall back to cached root
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
