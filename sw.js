/* Inkstone Service Worker · build 43e9fe1a */
const VERSION = 'inkstone-43e9fe1a';
const PRECACHE = [
  "index.html",
  "app/database/blog-list.json",
  "app/css/base.f69732b650.css",
  "app/core/app.2339bbb0d5.js",
  "app/core/enhance.0bc351819f.js",
  "app/core/nav.6101d08de6.js",
  "app/core/reading.a3e1882596.js",
  "app/core/search-ui.fe594dae00.js",
  "app/core/sw-register.a926a8e5e9.js",
  "app/core/theme-mode.977f523551.js",
  "app/search/engine.js",
  "app/search/worker.js",
  "app/theme/ink/css/theme.621e1c951e.css",
  "app/theme/ink/css/typography.ef346dc27d.css",
  "app/theme/ink/js/background.f357049189.js",
  "app/theme/ink/js/particles.4cd8497376.js",
  "app/theme/ink/js/theme.e19e27a04b.js",
  "app/assets/icon-192.png",
  "app/assets/icon-512.png",
  "app/assets/icon-maskable-192.png",
  "app/assets/icon-maskable-512.png",
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

  // 导航请求（含站内软导航 X-Ink-Nav）：网络优先，离线回退缓存
  const isNavigation = request.mode === 'navigate' || request.headers.get('x-ink-nav') === '1';
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('index.html')))
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
