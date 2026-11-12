// Bei jeder Aenderung an ASSETS oder Inhalten hochzaehlen
// Grosse Dateien (z.B. GLB-Modelle) nicht vorladen, sie landen beim ersten Abruf im Cache
const CACHE = "random-v285";
const THREE = "https://unpkg.com/three@0.160.0/";
const JSZIP = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
// Google Fonts der Retro-Game-Hub-Praesentationen (CSS und Schriftdateien werden mitgespeichert)
const FONTS_CSS = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap";
const isFont = url => url.startsWith("https://fonts.googleapis.com/") || url.startsWith("https://fonts.gstatic.com/");
// Batverse (sachen/batverse/): die 3D-Welt selbst ist absichtlich NICHT offline (zu gross, Nicolas 2026-11-12); Werkstatt und Planungsseiten schon
const ASSETS = [
  "./", "index.html", "manifest.webmanifest", "icon.svg", "shared/orbit-pick.js",
  "sachen/helden/", "sachen/helden/manifest.webmanifest", "sachen/helden/icon.svg", "sachen/helden/vorschau.webp",
  "sachen/haus/", "sachen/haus/vorschau.webp",
  "sachen/villa/", "sachen/villa/vorschau.webp",
  "sachen/camper/", "sachen/camper/vorschau.webp",
  "sachen/wayne-berg/",
  "sachen/batverse/gotham/", "sachen/batverse/gotham/daten.js", "sachen/batverse/gotham/schnitt.html", "sachen/batverse/gotham/umsetzung.html", "sachen/batverse/gotham/umsetzung.js", "sachen/batverse/werkstatt/", "sachen/batverse/werkstatt/werkstatt.js", "sachen/batverse/js/gotham/fuellbau.js", "sachen/batverse/werkstatt/flug-shim.js", "sachen/batverse/vorschau.webp", "sachen/batverse/js/kern/basis.js", "sachen/batverse/js/fahrzeuge/motorton.js", "sachen/batverse/js/fahrzeuge/modelle.js", "sachen/batverse/js/fahrzeuge/the-bat.js", "sachen/batverse/js/fahrzeuge/jet.js", "blockbench/cowboyhut/", "blockbench/cowboyhut/cowboy_hat.json", "blockbench/cowboyhut/cowboy_hat.png",
  "blockbench/cowboyhut/skin.png", "blockbench/cowboyhut/vorschau.webp",
  "pruefung/ui-design/", "pruefung/ui-design/inhalt.js",
  "blockbench/viewer/", JSZIP,
  "blockbench/halloween/", "blockbench/halloween/halloween-pack.zip", "blockbench/halloween/pack.png", "blockbench/halloween/vorschau.webp",
  THREE + "build/three.module.js",
  THREE + "examples/jsm/controls/OrbitControls.js",
  THREE + "examples/jsm/environments/RoomEnvironment.js",
  THREE + "examples/jsm/loaders/GLTFLoader.js",
  THREE + "examples/jsm/utils/BufferGeometryUtils.js"
];
// Gross, darum erst nach der Aktivierung im Hintergrund laden
const LAZY = ["ironman", "spiderman", "spiderman-variant", "hulk", "batman", "superman"].map(id => `sachen/helden/models/${id}.glb`)
  // Retro-Game-Hub-Praesentationen (je ca. 1 MB, alles eingebettet)
  .concat(["sachen/retro-hub/", "sachen/retro-hub-titel/"]);

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
  // Schriften vorab laden: CSS holen, die darin genannten Schriftdateien ebenfalls speichern
  caches.open(CACHE).then(async cache => {
    const css = await fetch(FONTS_CSS);
    await cache.put(FONTS_CSS, css.clone());
    const files = [...(await css.text()).matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);
    await Promise.all(files.map(u => cache.add(u).catch(() => {})));
  }).catch(() => {});
});

// Network first, bei Offline aus dem Cache. Eigene Dateien und die fest versionierte three.js-Bibliothek.
// Batverse-Welt (alles unter sachen/batverse/ ausser Planung, Werkstatt, deren Skripte und Vorschaubild) nie speichern: nur vom Server
const BV_KEEP = ["gotham/", "werkstatt/", "vorschau.webp", "js/kern/basis.js", "js/fahrzeuge/modelle.js", "js/fahrzeuge/motorton.js", "js/fahrzeuge/the-bat.js", "js/fahrzeuge/jet.js", "js/gotham/fuellbau.js"];
const isWorld = url => { const p = new URL(url).pathname, i = p.indexOf("/sachen/batverse/"); if (i < 0) return false; const r = p.slice(i + 17); return !BV_KEEP.some(k => r === k || (k.endsWith("/") && r.startsWith(k))) || r === "gotham/stadt.js"; };
self.addEventListener("fetch", event => {
  const url = event.request.url;
  if (isWorld(url)) return;                                                 // Batverse-Welt: Browser holt sie normal, kein Offline-Speicher
  if (event.request.method !== "GET" || !(new URL(url).origin === location.origin || url.startsWith(THREE) || url === JSZIP || isFont(url))) return;
  // Eigene Dateien immer beim Server nachfragen (no-cache), sonst liefert der HTTP-Cache des Browsers alte Seiten
  const same = new URL(url).origin === location.origin;
  event.respondWith(
    (same ? fetch(url, { cache: "no-cache", credentials: "same-origin" }) : fetch(event.request))
      .then(res => {
        // Auch undurchsichtige Antworten (Stylesheet per <link> ohne CORS) speichern, sonst fehlen die Schriften offline
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return res;
      })
      // Seiten mit ?held=... auch offline finden
      .catch(() => caches.match(event.request, { ignoreSearch: event.request.mode === "navigate" }))
  );
});
