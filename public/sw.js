// Service Worker for The Roofing Friend PWA
const CACHE_NAME = 'trf-app-shell-v1';
const OFFLINE_URL = '/offline.html';

// Core app shell resources to cache
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching core assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // IMPORTANT: never cache Vite dev/HMR module URLs (they include /src/*, /node_modules/.vite/*, and ?t=)
  // Caching these is the #1 cause of "Failed to fetch dynamically imported module" blank screens.
  const isViteDevModule =
    url.searchParams.has('t') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('/node_modules/.vite/');

  if (isViteDevModule) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Also avoid caching JS/CSS module requests (keep them network-only to prevent stale-chunk issues)
  if (event.request.destination === 'script' || event.request.destination === 'style') {
    event.respondWith(fetch(event.request));
    return;
  }

  // For navigations, do network-first but DO NOT cache HTML (prevents serving old index.html after deploy)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Use different strategies based on request type
  if (event.request.destination === 'image') {
    // Cache-first strategy for images (faster loading for PDFs)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() =>
            new Response('', {
              status: 404,
              statusText: 'Image not found',
            })
          );
      })
    );
    return;
  }

  // Network-first strategy for other requests (API, etc.)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses best-effort
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return new Response('Offline - content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        })
      )
  );
});

// Handle background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(
      // Here you could implement offline form submission sync
      Promise.resolve()
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event);
  
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();
  console.log('Push notification data:', data);

  const options = {
    body: data.body || 'You have a new message',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: data.url || '/mobile/messages',
      channelId: data.channelId,
      ...data.data
    },
    vibrate: [200, 100, 200],
    tag: data.tag || 'message-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open Chat'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'New Message', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/mobile/messages';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});