/* Application-owned worker: the public runtime is outside the app's URL scope.
   Keep this explicit list aligned with snippets.js; bump VERSION on deployment. */
const VERSION = "17";
const PREFIX = `aellux-library:${self.registration.scope}:`;
const CACHE = PREFIX + VERSION;
const app = path => new URL(path, self.registration.scope).href;
const dist = file => new URL(file, "https://cdn.jsdelivr.net/gh/aelluxjs/core@af06c0fae0fb0d0364f0c77a8cd3ad423539d961/dist/").href;
const extensions = ["input", "present", "adaptive", "scrollbox", "scrollbox-snap", "viewport", "preference", "focus", "anchor", "feedback", "state-navigation", "pwa"];
const styled = ["input", "present", "adaptive", "scrollbox", "anchor", "feedback"];
const PRECACHE = [
  "index.htm", "manifest.webmanifest", "assets/library.css?v=17", "assets/library.js?v=14", "assets/snippets.js",
  "assets/icon.svg", "assets/icon-192.png", "assets/icon-512.png", "assets/geist-latin.woff2", "vendor/bootstrap.min.css",
  "../assets/bootstrap-brand.css"
].map(app).concat(
  ["aellux.js", "aellux.full.js", "aellux.full.css", "aellux.orchestrator.js", "aellux.extensions.min.json", "aellux.input.point.js", "aellux.input.keyboard.js"].map(dist),
  extensions.map(name => dist(`aellux.ext.${name}.js`)),
  styled.map(name => dist(`aellux.ext.${name}.css`))
);
const allowed = new Set(PRECACHE);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Installation succeeds only when the complete app and every example are available.
    for (const url of PRECACHE) {
      const response = await fetch(url, { cache: "reload", credentials: "omit" });
      if (!response.ok || response.redirected || response.type === "opaque") throw new Error(`Cannot precache ${url}`);
      await cache.put(url, response);
    }
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "AELLUX_PWA_SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("authorization") || request.headers.has("range")) return;
  const url = new URL(request.url);
  const isEntry = url.href === app("") || url.href === app("index.htm") ||
    (url.origin + url.pathname === app("index.htm") || url.origin + url.pathname === app(""));
  if (request.mode === "navigate") {
    if (url.origin !== self.location.origin || !isEntry) return;
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch { return (await caches.open(CACHE)).match(app("index.htm")); }
    })());
    return;
  }
  if (!allowed.has(url.href)) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(CACHE)).match(url.href);
    return cached || fetch(request);
  })());
});
