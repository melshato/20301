// Service Worker — SAJCO PWA
const CACHE = 'sajco-v1';
const OFFLINE_ASSETS = ['/', '/index.html', '/style.css', '/assets/sajco-logo.svg'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE_ASSETS)).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // شبكة أولاً — fallback للكاش عند الانقطاع
    if (e.request.method !== 'GET') return;
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
    );
});
