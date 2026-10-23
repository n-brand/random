// Bei jeder Aenderung an ASSETS oder Inhalten hochzaehlen
// Grosse Dateien (z.B. GLB-Modelle) nicht vorladen, sie landen beim ersten Abruf im Cache
const CACHE = "random-v6";
const THREE = "https://unpkg.com/three@0.160.0/";
const ASSETS = [
  "./", "index.html", "manifest.webmanifest", "icon.svg",
  "sachen/helden/", "sachen/helden/manifest.webmanifest", "sachen/helden/icon.svg", "sachen/helden/vorschau.webp",
  THREE + "build/three.module.js",
  THREE + "examples/jsm/controls/OrbitControls.js",
  THREE + "examples/jsm/environments/RoomEnvironment.js",
  THREE + "examples/jsm/loaders/GLTFLoader.js",
  THREE + "examples/jsm/utils/BufferGeometryUtils.js"
];
// Gross, darum erst nach der Aktivierung im Hintergrund laden
const LAZY = ["ironman", "spiderman", "spiderman-variant", "hulk", "batman", "superman"].map(id => `sachen/helden/models/${id}.glb`);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
  caches.open(CACHE).then(cache => Promise.all(LAZY.map(url => cache.add(url).catch(() => {}))));
});

// Network first, bei Offline aus dem Cache. Eigene Dateien und die fest versionierte three.js-Bibliothek.
self.addEventListener("fetch", event => {
  const url = event.request.url;
  if (event.request.method !== "GET" || !(new URL(url).origin === location.origin || url.startsWith(THREE))) return;
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return res;
      })
      // Seiten mit ?held=... auch offline finden
      .catch(() => caches.match(event.request, { ignoreSearch: event.request.mode === "navigate" }))
  );
});
