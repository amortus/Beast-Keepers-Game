/**
 * Service Worker para suporte offline (PWA)
 * Estratégia: Cache-first para assets, network-first para HTML
 */

const CACHE_VERSION = 'v2-no-music';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Assets para precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/player.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
];

// Install: precache de assets críticos
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: limpar caches antigos
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('static-') || name.startsWith('runtime-'))
          .filter(name => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: estratégia cache-first para assets, network-first para HTML
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições de outros domínios (ex: analytics)
  if (url.origin !== location.origin) {
    return;
  }

  // Ignora WebSocket e outras conexões não HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      // Cache-first: retorna do cache se disponível
      if (cached) {
        return cached;
      }

      // Network fallback com cache runtime
      return fetch(request).then(response => {
        // Não cachear respostas inválidas
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Cachear assets para uso offline futuro
        if (request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }

        return response;
      }).catch(() => {
        // Fallback offline: página HTML básica ou asset do cache
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

