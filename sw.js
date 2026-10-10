/* Inkstone Service Worker · build 4d84bf56 */
const VERSION = 'inkstone-4d84bf56';
const PRECACHE = [
  "app.html",
  "app/database/blog-list.json",
  "app/css/base.eae2cd618c.css",
  "app/core/app.561c91e64a.js",
  "app/core/enhance.149f04836d.js",
  "app/core/reading.f188e2a875.js",
  "app/core/search-ui.ceb6ee997e.js",
  "app/core/sw-register.a926a8e5e9.js",
  "app/core/theme-mode.ff76841c8a.js",
  "app/search/engine.js",
  "app/search/worker.js",
  "app/theme/ink/css/theme.86f7593448.css",
  "app/theme/ink/css/typography.0af5821fdd.css",
  "app/theme/ink/js/background.f357049189.js",
  "app/theme/ink/js/particles.4cd8497376.js",
  "app/theme/ink/js/theme.6e4552e5a1.js",
  "app/assets/icon-192.png",
  "app/assets/icon-512.png",
  "app/assets/icon.svg"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE).catch(() => undefined)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // 导航请求：网络优先，离线回退缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('app.html')))
    );
    return;
  }

  // 数据与静态资源：缓存优先，后台更新
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
