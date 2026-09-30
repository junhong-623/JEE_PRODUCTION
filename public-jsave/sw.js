// Replaced with the asset manifest hash during build so every deployment installs a fresh worker.
const CACHE = 'jsave-__BUILD_ID__'

self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(
    fetch('/precache-manifest.json', { cache: 'no-store' })
      .then(response => response.json())
      .then(({ assets }) => caches.open(CACHE).then(cache => cache.addAll(assets)))
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      // Open tabs may still request lazy-loaded files from the previous build.
      const jsaveKeys = keys.filter(key => key.startsWith('jsave-'))
      const keep = new Set([...jsaveKeys.slice(-2), CACHE])
      return Promise.all(jsaveKeys.filter(key => !keep.has(key)).map(key => caches.delete(key)))
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'JSave', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'jsave-reminder',
      data: { url: '/' },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const jsave = list.find(c => c.url.includes(self.registration.scope))
      if (jsave) return jsave.focus()
      return clients.openWindow('/')
    })
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  if (url.origin !== location.origin) return

  // A shortcut download must never receive the offline HTML app shell.
  if (url.pathname.startsWith('/shortcuts/') && url.pathname.endsWith('.shortcut')) return

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(async res => {
          const clone = res.clone()
          if (res.ok) await caches.open(CACHE).then(c => c.put(request, clone))
          return res
        })
        .catch(async () => {
          const cache = await caches.open(CACHE)
          return (await cache.match(request)) || (await cache.match('/jsave.html'))
        })
    )
    return
  }

  if (/\.(js|css|png|jpg|webp|svg|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = (await cache.match(request)) || (await caches.match(request))
        if (cached) return cached
        return fetch(request).then(async res => {
          if (res.ok) {
            const clone = res.clone()
            await cache.put(request, clone)
          }
          return res
        })
      })
    )
  }
})
