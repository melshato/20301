// Service Worker — SAJCO PWA v2
const CACHE_STATIC = 'sajco-static-v2';
const CACHE_PAGES  = 'sajco-pages-v1';

const STATIC_ASSETS = [
    '/assets/sajco-logo.svg',
    '/icon-192.svg',
    '/style.css',
    '/manifest.json'
];

// ── Install: cache static assets ──────────────────────────
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_STATIC)
            .then(c => c.addAll(STATIC_ASSETS))
            .catch(() => {}) // صامت لو فشل أي أصل
    );
    self.skipWaiting();
});

// ── Activate: حذف الكاش القديم ──────────────────────────
self.addEventListener('activate', e => {
    const validCaches = [CACHE_STATIC, CACHE_PAGES];
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys
                .filter(k => !validCaches.includes(k))
                .map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch: استراتيجية ذكية حسب نوع الطلب ──────────────────
self.addEventListener('fetch', e => {
    const { request } = e;
    const url = new URL(request.url);

    // لا نتدخل في طلبات Supabase أو CDN
    if (url.hostname.includes('supabase') ||
        url.hostname.includes('cdnjs') ||
        url.hostname.includes('jsdelivr') ||
        url.hostname.includes('fonts.g') ||
        request.method !== 'GET') return;

    // الأصول الثابتة (CSS/SVG/icons): Cache First
    if (STATIC_ASSETS.some(a => url.pathname.endsWith(a.replace('/',''))) ||
        url.pathname.match(/\.(css|svg|png|jpg|ico|woff2?)$/)) {
        e.respondWith(
            caches.match(request).then(cached =>
                cached || fetch(request).then(res => {
                    const clone = res.clone();
                    caches.open(CACHE_STATIC).then(c => c.put(request, clone));
                    return res;
                })
            )
        );
        return;
    }

    // صفحات HTML: Network First → Cache Fallback
    if (request.headers.get('accept')?.includes('text/html') ||
        url.pathname.endsWith('.html') || url.pathname === '/') {
        e.respondWith(
            fetch(request)
                .then(res => {
                    const clone = res.clone();
                    caches.open(CACHE_PAGES).then(c => c.put(request, clone));
                    return res;
                })
                .catch(() => caches.match(request).then(cached =>
                    cached || caches.match('/index.html')
                ))
        );
        return;
    }
});

// ── Message (suppress Chromium async-response warning) ──────
self.addEventListener('message', e => {
    // No async work — prevents "message channel closed before response" warning
});

// ── Push Notifications ─────────────────────────────────────
self.addEventListener('push', e => {
    if (!e.data) return;
    let payload;
    try { payload = e.data.json(); } catch { payload = { title: 'ساجكو', body: e.data.text() }; }

    e.waitUntil(
        self.registration.showNotification(payload.title || 'ساجكو', {
            body:    payload.body    || '',
            icon:    payload.icon    || '/icon-192.svg',
            badge:   '/icon-192.svg',
            tag:     payload.tag     || 'sajco-notif',
            data:    payload.url     || '/',
            vibrate: [200, 100, 200],
            requireInteraction: payload.requireInteraction || false
        })
    );
});

// ── Notification Click ─────────────────────────────────────
self.addEventListener('notificationclick', e => {
    e.notification.close();
    const url = e.notification.data || '/';
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            const existing = list.find(c => c.url.includes(url) && 'focus' in c);
            if (existing) return existing.focus();
            return clients.openWindow(url);
        })
    );
});
