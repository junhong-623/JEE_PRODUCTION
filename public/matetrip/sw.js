// MateTrip Service Worker — handles background push notifications
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// Handle push from server
self.addEventListener("push", e => {
  const data = e.data?.json() || {};
  const title = data.title || "MateTrip";
  const options = {
    body: data.body || "",
    icon: "/matetrip/icons/icon-192.png",
    badge: "/matetrip/icons/icon-192.png",
    data: { url: data.url || "/matetrip/" },
    vibrate: [100, 50, 100],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Tap notification → open app
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      const url = e.notification.data?.url || "/matetrip/";
      for (const client of clientList) {
        if (client.url.includes("/matetrip/") && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
