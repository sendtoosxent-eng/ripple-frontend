const CACHE = "ripple-shell-v3"
const SHELL = ["/", "/icon.svg", "/pwa-192.png", "/pwa-512.png", "/apple-icon.png"]
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))) })
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting()
})
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))); self.clients.claim() })
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((response) => response || caches.match("/"))))
})
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {}
  const incomingCall = Boolean(data.incoming_call)
  event.waitUntil(self.registration.showNotification(data.title || "Ripple", {
    body: data.body || "You have a new notification",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    tag: data.tag || data.url || "ripple-notification",
    renotify: incomingCall,
    requireInteraction: Boolean(data.require_interaction),
    data: { url: data.url || "/notifications" },
    vibrate: incomingCall ? [500, 200, 500, 200, 500, 200, 800] : [100, 50, 100],
    actions: incomingCall ? [{ action: "answer", title: "Open call" }, { action: "dismiss", title: "Dismiss" }] : [],
  }))
})
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  if (event.action === "dismiss") return
  const target = new URL(event.notification.data?.url || "/notifications", self.location.origin).href
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url.startsWith(self.location.origin))
    if (existing) { existing.navigate(target); return existing.focus() }
    return self.clients.openWindow(target)
  }))
})
