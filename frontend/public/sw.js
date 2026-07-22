// GiftWise Service Worker — PWA offline + push notifications
// Next.js 16 compatible. Cache strategy: stale-while-revalidate for pages, cache-first for assets.

const CACHE_NAME = 'giftwise-v3'

// Critical assets to precache on install
const PRECACHE = [
  '/login',
  '/manifest.webmanifest',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png'
]

// ── Install ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE.map((url) =>
          fetch(url).then((response) => {
            if (response.ok) {
              return cache.put(url, response)
            }
          }).catch((err) => {
            console.warn(`Failed to precache ${url}:`, err)
          })
        )
      )
    })
  )
  self.skipWaiting()
})

// ── Activate — clean old caches ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch ──
self.addEventListener('fetch', (e) => {
  // Skip non-GET requests
  if (e.request.method !== 'GET') return

  const url = new URL(e.request.url)

  // Skip cross-origin requests (e.g., Supabase, external images) to prevent CORS/caching issues
  if (url.origin !== self.location.origin) return

  // Skip API routes, Chrome extensions, and Next.js router prefetches/data chunks
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/') ||
    url.searchParams.has('_rsc') ||
    url.protocol === 'chrome-extension:'
  ) {
    return
  }

  // For navigation requests (full page reloads), serve from network, fallback to cache/offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('/login').then(r => r || new Response('Offline — GiftWise', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }))
      )
    )
    return
  }

  // Only apply cache-first strategy for local static assets
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2|webmanifest)$/)

  if (isStaticAsset) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached || fetch(e.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
          }
          return response
        })
      )
    )
    return
  }

  // Let all other dynamic/page requests fall through to the network
})

// ── Push notifications ──
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'GiftWise', body: 'New update!' }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/web-app-manifest-192x192.png',
      badge: '/web-app-manifest-192x192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
      tag: data.tag || 'giftwise',
    })
  )
})

// ── Notification click ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const existing = windowClients.find(c => c.url === url && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
