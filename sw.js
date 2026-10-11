/* Inkstone Service Worker · build ebc84040 */
const VERSION = 'inkstone-ebc84040';
const PRECACHE = [
  "index.html",
  "app/database/blog-list.json",
  "app/css/base.3e7336ce2b.css",
  "app/core/app.fc9adb74c1.js",
  "app/core/enhance.5155c90e88.js",
  "app/core/nav.67d8ead59f.js",
  "app/core/reading.8aafb1e2d7.js",
  "app/core/search-ui.cdc570d5e8.js",
  "app/core/sw-register.a926a8e5e9.js",
  "app/core/theme-mode.977f523551.js",
  "app/search/engine.js",
  "app/search/worker.js",
  "app/theme/ink/css/theme.c5d31ff153.css",
  "app/theme/ink/css/typography.38b04656e2.css",
  "app/theme/ink/js/background.f357049189.js",
  "app/theme/ink/js/particles.4cd8497376.js",
  "app/theme/ink/js/theme.e19e27a04b.js",
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
