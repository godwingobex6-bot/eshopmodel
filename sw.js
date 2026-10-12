/* ============================================================
   NUANCE — Service Worker (PWA)
   Stratégies : app-shell precachée, images cache-first,
   polices Google stale-while-revalidate, navigation network-first.
   ============================================================ */

const VERSION = 'nuance-v1.0.0';
const CORE_CACHE = `${VERSION}-core`;
const FONT_CACHE = `${VERSION}-fonts`;

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/js/data.js',
  './assets/js/store.js',
  './assets/js/router.js',
  './assets/js/ui.js',
  './assets/js/views/home.js',
  './assets/js/views/catalog.js',
  './assets/js/views/product.js',
  './assets/js/views/cart.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/img/products/velocity.jpg',
  './assets/img/products/terra.jpg',
  './assets/img/products/pulse.jpg',
  './assets/img/products/nomad.jpg',
  './assets/img/products/tote.jpg',
  './assets/img/products/odyssey.jpg',
  './assets/img/products/meridian.jpg',
  './assets/img/products/solstice.jpg',
  './assets/img/products/echo.jpg',
  './assets/img/products/carta.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CORE_CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Polices Google : stale-while-revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((res) => { cache.put(request, res.clone()); return res; }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Navigations : réseau d'abord, repli sur l'app-shell (mode hors-ligne)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CORE_CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Ressources statiques : cache d'abord, remplissage au passage
  e.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && url.origin === location.origin) {
            const copy = res.clone();
            caches.open(CORE_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
    )
  );
});
