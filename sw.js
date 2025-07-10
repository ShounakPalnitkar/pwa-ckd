const CACHE_NAME = 'ckd-predictor-v2';
const urlsToCache = [
  '/',
  '/index-ckd.html',
  '/offline.html',
  '/assets/css/styles.css',
  '/assets/css/pwa.css',
  '/assets/js/app.js',
  '/assets/js/pwa.js',
  '/assets/images/logo.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js'
];

// Install event - cache all essential resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache addAll failed:', err);
      })
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If we got a response, cache it and return it
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed, try cache
        const cachedResponse = await caches.match(event.request);
        
        // Return cached response or offline page for HTML requests
        if (cachedResponse) {
          return cachedResponse;
        } else if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
        
        // Return empty response for images if not in cache
        if (event.request.headers.get('accept').includes('image')) {
          return new Response('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"></svg>', {
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Periodic sync (optional - for background updates)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

// Background update check
async function updateContent() {
  const cache = await caches.open(CACHE_NAME);
  const updatedResources = [];
  
  for (const url of urlsToCache) {
    try {
      const networkResponse = await fetch(url);
      if (networkResponse.ok) {
        await cache.put(url, networkResponse.clone());
        updatedResources.push(url);
      }
    } catch (err) {
      console.log(`Failed to update ${url}:`, err);
    }
  }
  
  if (updatedResources.length > 0) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'content-updated',
          resources: updatedResources
        });
      });
    });
  }
}
