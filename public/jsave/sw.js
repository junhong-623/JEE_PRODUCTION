const CACHE = 'jsave-v8'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  // Delete all old cache versions
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'JSave', {
      body: data.body || '',
      icon: '/jsave/icons/icon-192.png',
      badge: '/jsave/icons/icon-192.png',
      tag: data.tag || 'jsave-reminder',
      data: { url: '/jsave/' },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const jsave = list.find(c => c.url.includes('/jsave'))
      if (jsave) return jsave.focus()
      return clients.openWindow('/jsave/')
    })
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  if (url.origin !== location.origin) return

  // Navigation (HTML): network-first — always get fresh app shell, fall back to cache offline
  if (request.mode === 'navigate' && url.pathname.startsWith('/jsave')) {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Hashed static assets (JS/CSS/images): cache-first — hash changes = new file = cache miss
  if (/\.(js|css|png|jpg|webp|svg|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
      })
    )
  }
})
