/* NNLOMNE Notify — service worker
 * Strategy:
 *  - navigations: network-first, fallback to the cached app shell
 *  - static assets (JS/CSS/fonts/images): stale-while-revalidate
 *  - /api/* requests: network only (never cached, avoids stale data)
 */
const CACHE = "nnlomne-cache-v2";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        // Cache each shell asset individually so one failure (e.g. a 404 icon)
        // never prevents the service worker from installing.
        Promise.all(
          SHELL.map((url) =>
            cache.add(url).catch(() => {
              /* skip unavailable asset */
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first with app-shell fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copy));
          return res;
        })
        .catch(() =>
          caches.match("/").then((cached) => cached || new Response("Offline", { status: 503 }))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || new Response("Offline", { status: 503 }));
      return cached || network;
    })
  );
});
