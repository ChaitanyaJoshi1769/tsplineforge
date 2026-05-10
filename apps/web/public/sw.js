/**
 * Service Worker for TSplineForge
 * Enables offline support and performance optimization
 */

const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  static: `tsplineforge-static-${CACHE_VERSION}`,
  dynamic: `tsplineforge-dynamic-${CACHE_VERSION}`,
  api: `tsplineforge-api-${CACHE_VERSION}`,
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============= INSTALL EVENT =============

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore errors when adding assets
      });
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// ============= ACTIVATE EVENT =============

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// ============= FETCH EVENT =============

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(handleNetworkFirst(request));
});

// ============= CACHE STRATEGIES =============

/**
 * Network-first strategy: Try network first, fall back to cache
 */
async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page
    return caches.match('/offline.html') ||
           new Response('Offline - No cached data available', {
             status: 503,
             statusText: 'Service Unavailable',
           });
  }
}

/**
 * Cache-first strategy with TTL for static assets
 */
async function handleStaticAsset(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.static);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}

/**
 * API request handling with offline fallback
 */
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      // Cache successful API responses
      const cache = await caches.open(CACHE_NAMES.api);
      const cacheResponse = response.clone();

      // Add TTL metadata
      const cacheEntry = {
        response: cacheResponse,
        timestamp: Date.now(),
        ttl: API_CACHE_TTL,
      };

      cache.put(request, cacheResponse);
    }

    return response;
  } catch {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline error response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Unable to fetch data. Using cached data if available.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ============= UTILITIES =============

function isStaticAsset(pathname) {
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname === '/' ||
    pathname.endsWith('.html')
  );
}

// ============= MESSAGE HANDLING =============

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});
