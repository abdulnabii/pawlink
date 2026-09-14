const CACHE_NAME = "pawlink-v2";

// Install: immediately take over
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate: clean up ALL old caches (including pawlink-v1) immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: NETWORK-FIRST for pages and APIs so users always see the latest code
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always fetch API calls directly from network
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: "Offline" }), {
            headers: { "Content-Type": "application/json" },
          })
      )
    );
    return;
  }

  // Network-first for HTML page navigation (ensures latest Vercel deployment is always visible)
  if (
    event.request.mode === "navigate" ||
    event.request.destination === "document"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // For static assets (images, icons), use network with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  let data = {
    title: "PawLink Alert",
    body: "You have a new notification.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    url: "/dashboard",
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/icon-192.png",
      badge: data.badge || "/icons/icon-192.png",
      tag: data.tag || "pawlink",
      data: { url: data.url || "/dashboard" },
      requireInteraction: true,
      actions: [
        { action: "open", title: "Open Dashboard" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
