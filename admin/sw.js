// Admin Service Worker — Krystle & Co
const CACHE = 'kc-admin-v1';
const ASSETS = [
  '/admin/index.html',
  '/admin/store.js',
  '/admin/ui.jsx',
  '/admin/main.jsx',
  '/admin/dashboard.jsx',
  '/admin/calendar.jsx',
  '/admin/clients.jsx',
  '/admin/gallery.jsx',
  '/admin/messages.jsx',
  '/admin/finance.jsx',
  '/admin/pricing.jsx',
  '/admin/stripe.jsx',
  '/admin/waivers.jsx',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network first for API calls — always get fresh data
  if (e.request.url.includes('api.krystleandco.com')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'offline' }), { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }
  // Cache first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});

// Push notifications for new bookings / messages
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Krystle & Co', {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.url || '/admin/index.html',
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data));
});
