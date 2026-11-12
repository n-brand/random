// Bei jeder Aenderung an ASSETS oder Inhalten hochzaehlen
// Grosse Dateien (z.B. GLB-Modelle) nicht vorladen, sie landen beim ersten Abruf im Cache
const CACHE = "random-v266";
const THREE = "https://unpkg.com/three@0.160.0/";
const JSZIP = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
// Google Fonts der Retro-Game-Hub-Praesentationen (CSS und Schriftdateien werden mitgespeichert)
const FONTS_CSS = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap";
const isFont = url => url.startsWith("https://fonts.googleapis.com/") || url.startsWith("https://fonts.gstatic.com/");
const ASSETS = [
  "./", "index.html", "manifest.webmanifest", "icon.svg", "shared/orbit-pick.js",
  "sachen/helden/", "sachen/helden/manifest.webmanifest", "sachen/helden/icon.svg", "sachen/helden/vorschau.webp",
  "sachen/haus/", "sachen/haus/vorschau.webp",
  "sachen/villa/", "sachen/villa/vorschau.webp",
  "sachen/camper/", "sachen/camper/vorschau.webp",
  "sachen/wayne-berg/",
  "sachen/wayne-manor/", "sachen/wayne-manor/gotham/", "sachen/wayne-manor/gotham/daten.js", "sachen/wayne-manor/gotham/schnitt.html", "sachen/wayne-manor/gotham/umsetzung.html", "sachen/wayne-manor/gotham/umsetzung.js", "sachen/wayne-manor/werkstatt/", "sachen/wayne-manor/werkstatt/werkstatt.js", "sachen/wayne-manor/js/gotham/fuellbau.js", "sachen/wayne-manor/js/gotham/gotham-gelaende.js", "sachen/wayne-manor/werkstatt/flug-shim.js", "sachen/wayne-manor/vorschau.webp", "sachen/wayne-manor/style.css",
  "sachen/wayne-manor/js/ui/einstellungen.js", "sachen/wayne-manor/js/kern/basis.js", "sachen/wayne-manor/js/kern/kacheln.js", "sachen/wayne-manor/js/gelaende/fernring.js", "sachen/wayne-manor/js/gelaende/karte-kueste.js", "sachen/wayne-manor/js/strassen/serpentine.js", "sachen/wayne-manor/js/strassen/waterfall-exit.js", "sachen/wayne-manor/js/strassen/hauptstrasse.js", "sachen/wayne-manor/js/gelaende/gelaende.js", "sachen/wayne-manor/js/haus/haus.js", "sachen/wayne-manor/js/aufzuege/personenaufzug.js", "sachen/wayne-manor/js/ui/karten-overlay.js", "sachen/wayne-manor/js/aussen/aussenanlage.js", "sachen/wayne-manor/js/hoehle/hoehle-unten.js", "sachen/wayne-manor/js/hoehle/batcave-ausbau.js", "sachen/wayne-manor/js/hoehle/hoehle-oben.js", "sachen/wayne-manor/js/kern/tag-nacht.js", "sachen/wayne-manor/js/spieler/laufen.js", "sachen/wayne-manor/js/ui/teleport.js", "sachen/wayne-manor/js/kern/tore.js", "sachen/wayne-manor/js/fahrzeuge/boot.js", "sachen/wayne-manor/js/fahrzeuge/motorton.js", "sachen/wayne-manor/js/fahrzeuge/modelle.js", "sachen/wayne-manor/js/fahrzeuge/aufstellung.js", "sachen/wayne-manor/js/fahrzeuge/fahren.js", "sachen/wayne-manor/js/fahrzeuge/the-bat.js", "sachen/wayne-manor/js/fahrzeuge/jet.js", "sachen/wayne-manor/js/fahrzeuge/schiessen.js", "sachen/wayne-manor/js/ui/bedienung.js", "sachen/wayne-manor/js/kern/schleife.js", "sachen/wayne-manor/js/gelaende/felsen.js", "sachen/wayne-manor/js/strassen/serpentine-bau.js", "sachen/wayne-manor/js/aussen/einfahrtstor.js", "sachen/wayne-manor/js/aussen/grundmauer.js", "sachen/wayne-manor/js/gelaende/wasserfall.js", "sachen/wayne-manor/js/aufzuege/autoaufzug.js", "sachen/wayne-manor/js/aussen/garagenrampe.js", "sachen/wayne-manor/js/strassen/waterfall-exit-bau.js", "sachen/wayne-manor/js/gelaende/steilkueste.js", "sachen/wayne-manor/js/kern/start.js", "sachen/wayne-manor/karten/aussenanlage.webp", "sachen/wayne-manor/karten/hoehle-oberes-level.webp", "sachen/wayne-manor/karten/hoehle-unteres-level.webp",
  "blockbench/cowboyhut/", "blockbench/cowboyhut/cowboy_hat.json", "blockbench/cowboyhut/cowboy_hat.png",
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
self.addEventListener("fetch", event => {
  const url = event.request.url;
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
