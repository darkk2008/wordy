/* Service worker: makes wwordy open offline.
 * - App files (built JS/CSS/icons) are pre-cached at install (the list is filled in at build time).
 * - Page loads: network first, falling back to the cached app shell when offline.
 * - Fonts, flag icons and the Supabase script are cached the first time they load.
 * - Everything else (Supabase API, Groq AI, analytics, POST requests) always goes to the network.
 */
const VERSION = "__BUILD_ID__";
const CACHE = "wwordy-" + VERSION;
const PRECACHE = "__PRECACHE__"; // replaced by an array at build time
const RUNTIME_HOSTS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdnjs.cloudflare.com",
  "cdn.jsdelivr.net",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(Array.isArray(PRECACHE) ? PRECACHE : ["/"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("wwordy-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Page loads: network first, cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || Response.error()))
    );
    return;
  }

  // Our own built files: cache first (their names change with every build).
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/netlify/") || url.pathname.startsWith("/.netlify/")) return;
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Fonts / icon CSS / Supabase script: stale-while-revalidate.
  if (RUNTIME_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then((hit) => {
          const net = fetch(req)
            .then((res) => {
              if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
              return res;
            })
            .catch(() => hit);
          return hit || net;
        })
      )
    );
  }
});
