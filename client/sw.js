const CACHE_NAME = 'vibe-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/feed.html',
  '/profile.html',
  '/settings.html',
  '/search.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/animations.css',
  '/css/components.css',
  '/css/layout.css',
  '/css/pages.css',
  '/css/dark-mode.css',
  '/js/config.js',
  '/js/theme.js',
  '/js/utils.js',
  '/js/api.js',
  '/js/socket.js',
  '/js/router.js',
  '/js/auth.js',
  '/js/post.js',
  '/js/comments.js',
  '/js/feed.js',
  '/js/profile.js',
  '/js/search.js',
  '/js/settings.js',
  '/js/notifications.js',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching offline app shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ Purging legacy service worker cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch events intercept
self.addEventListener('fetch', (event) => {
  // Let API requests go directly to network
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache new static files dynamically
        if (event.request.method === 'GET' && networkResponse.status === 200) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Fallback offline page (e.g. index.html)
      return caches.match('/index.html');
    })
  );
});
