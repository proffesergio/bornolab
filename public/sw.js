/* global self, caches, Response, fetch, URL */
/* BornoLab service worker v1 — offline reading shell.
 * - Precache: offline fallback page + core study routes (navigations cached on first visit).
 * - Static (_next/static, images, fonts): cache-first.
 * - APIs (/api/*): network-only, never cached (mutations stay server-authoritative).
 * - Navigations: network → cache → /offline fallback.
 */
const VERSION = "bornolab-sw-v2";
const PRECACHE = ["/offline"];
const STATIC_RE = /\/_next\/static\//;
const ASSET_RE = /\.(png|jpg|jpeg|svg|ico|woff2?|ttf)$/;
const PRIVATE_RE = /^\/(admin|account|dashboard|login|print-orders)(\/|$)|^\/printing\/(orders|quote)(\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      const current = await caches.open(VERSION);
      await Promise.all(keys.filter((key) => key !== VERSION).map(async (key) => {
        const previous = await caches.open(key);
        for (const request of await previous.keys()) {
          const url = new URL(request.url);
          if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || PRIVATE_RE.test(url.pathname)) continue;
          const response = await previous.match(request);
          if (response) await current.put(request, response);
        }
        await caches.delete(key);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Never cache or intercept API traffic.
  if (url.pathname.startsWith("/api/")) return;
  // Account, admin and printing records must never survive logout in an offline cache.
  if (PRIVATE_RE.test(url.pathname)) {
    if (req.mode === "navigate") {
      event.respondWith(fetch(req).catch(() => caches.match("/offline").then((page) => page || Response.error())));
    }
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match("/offline")).then((page) => page || Response.error())
        )
    );
    return;
  }

  if (STATIC_RE.test(url.pathname) || ASSET_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
            return res;
          })
      )
    );
  }
});
