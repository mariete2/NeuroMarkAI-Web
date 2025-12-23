const CACHE_NAME = 'neuromarkai-v1.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/manifest.json',
  '/politica-privacidad/', 
  '/politica-cookies/',
  '/vsl-exclusivo/',
  '/blog-ia/',
  '/images/logo.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/og-image.png'
];

// INSTALAR - Cachear recursos
self.addEventListener('install', function(event) {
  console.log('Service Worker instalándose...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache abierto:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Todos los recursos cacheados');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.log('Error en cache:', error);
      })
  );
});

// ACTIVAR - Limpiar caches viejos
self.addEventListener('activate', function(event) {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// FETCH - Servir desde cache cuando sea posible
self.addEventListener('fetch', function(event) {
  // No cachear requests externos o de analytics
  if (event.request.url.includes('google') || 
      event.request.url.includes('facebook') ||
      event.request.url.includes('formsubmit') ||
      event.request.url.includes('gstatic') || // Evitar cachear fuentes de Google dinámicamente
      event.request.url.includes('fontawesome')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Devuelve desde cache si existe
        if (response) {
          console.log('Sirviendo desde cache:', event.request.url);
          return response;
        }
        
        // Sino, hace fetch y guarda en cache para después
        return fetch(event.request).then(function(fetchResponse) {
          // Solo cachear respuestas válidas
          if (fetchResponse && fetchResponse.status === 200 && fetchResponse.type === 'basic') {
            var responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
                console.log('Guardado en cache:', event.request.url);
              });
          }
          return fetchResponse;
        });
      })
  );
});