// Wayne Manor 3D – Kachel-Verwaltung (Plan K3, 2026-11-11, PLAN-KACHELN.md)
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Welt in Kacheln (Grundmass TILE = 128 m). Jede Ebene (Wald, spaeter Gelaende, Gotham-Gebaeude) hat ihre eigene Zellgroesse (Vielfaches von 128,
// groessere Zellen = weniger Zeichenaufrufe) und eine Funktion build(i, k) -> Object3D oder null. Um den Fokus (Kamera) werden alle Zellen innerhalb
// der Ladeweite gebaut, nahe und vorne zuerst, pro Bild nur bis zum Zeitbudget; ausserhalb Ladeweite + 1 Kachel werden sie ausgeblendet und
// kommen in einen Zwischenspeicher (Rueckweg sofort da), die aeltesten daraus werden freigegeben.
const TILE = 128;
const TILES = {
  mobile: matchMedia("(pointer: coarse)").matches,
  layers: [], frame: 0, cx: NaN, cz: NaN, queue: [], ms: 0, built: 0,
  startup: true,                                                          // erster Durchlauf ohne Zeitbudget (Bild beim Start sofort vollstaendig)
};
TILES.budget = TILES.mobile ? 2 : 4;                                       // ms pro Bild fuer den Aufbau
TILES.cacheMax = TILES.mobile ? 16 : 48;                                   // ausgeblendete Zellen im Zwischenspeicher je Ebene
// Ladeweite in Kacheln (128 m). Vorgabe bis K5 (Nebel folgt der Ladeweite) so, dass der Wald wie bisher bis in den Nebel reicht.
TILES.range = (() => { try { const v = parseInt(localStorage.getItem("wm-range"), 10); if (v >= 2 && v <= 12) return v; } catch (e) {} return TILES.mobile ? 4 : 8; })();
function setTileRange(n) { TILES.range = Math.max(2, Math.min(12, n | 0)); try { localStorage.setItem("wm-range", String(TILES.range)); } catch (e) {} TILES.cx = NaN; }

// Ebene anmelden. bounds = [x0, x1, z0, z1] (Weltmeter), ausserhalb gibt es nichts zu bauen.
function tileLayer(name, size, build, bounds, dispose) {
  const L = { name, size, build, bounds, dispose: dispose || (o => o.traverse(c => { if (c.isInstancedMesh) c.dispose(); })), cells: new Map(), cache: new Map() };
  TILES.layers.push(L); return L;
}
const tileKey = (i, k) => i + "," + k;

// Bedarf neu berechnen: welche Zellen fehlen (Warteschlange nach Vorrang), welche sind zu weit weg
function tilesPlan(fx, fz, dx, dz) {
  const R = TILES.range * TILE, q = [];
  for (const L of TILES.layers) {
    const s = L.size, half = s * 0.7072, b = L.bounds;
    for (const [key, c] of L.cells) {                                     // zu weit weg: ausblenden, in den Zwischenspeicher
      if (Math.hypot((c.i + 0.5) * s - fx, (c.k + 0.5) * s - fz) <= R + half + TILE) continue;
      L.cells.delete(key);
      if (c.obj) { scene.remove(c.obj); L.cache.delete(key); L.cache.set(key, c); }
    }
    while (L.cache.size > TILES.cacheMax) { const [key, c] = L.cache.entries().next().value; L.cache.delete(key); if (c.obj) L.dispose(c.obj); }
    const i0 = Math.floor((Math.max(fx - R, b[0])) / s), i1 = Math.floor((Math.min(fx + R, b[1])) / s);
    const k0 = Math.floor((Math.max(fz - R, b[2])) / s), k1 = Math.floor((Math.min(fz + R, b[3])) / s);
    for (let i = i0; i <= i1; i++) for (let k = k0; k <= k1; k++) {
      if (L.cells.has(tileKey(i, k))) continue;
      const ox = (i + 0.5) * s - fx, oz = (k + 0.5) * s - fz, d = Math.hypot(ox, oz);
      if (d > R + half) continue;
      const ahead = d > 1 ? (ox * dx + oz * dz) / d : 1;                 // -1 hinten .. 1 vorne
      q.push({ L, i, k, pri: Math.max(0, d - half) * (1.6 - 0.6 * ahead) });
    }
  }
  q.sort((a, b) => a.pri - b.pri);
  TILES.queue = q;
}

const tileDir = new THREE.Vector3();
// Jedes Bild: Fokus = Kamera (gilt fuer Begehen, Fahren, Fliegen, Orbit, Geist)
function tilesUpdate() {
  const t0 = performance.now(), p = camera.position;
  camera.getWorldDirection(tileDir);
  const ci = Math.floor(p.x / TILE * 2), ck = Math.floor(p.z / TILE * 2);  // neu planen, sobald man eine halbe Kachel weiter ist (und alle 30 Bilder)
  if (ci !== TILES.cx || ck !== TILES.cz || ++TILES.frame % 30 === 0) { TILES.cx = ci; TILES.cz = ck; tilesPlan(p.x, p.z, tileDir.x, tileDir.z); }
  const q = TILES.queue;
  while (q.length && (TILES.startup || performance.now() - t0 < TILES.budget)) {
    const { L, i, k } = q.shift(), key = tileKey(i, k);
    if (L.cells.has(key)) continue;
    let c = L.cache.get(key);
    if (c) L.cache.delete(key); else { c = { i, k, obj: L.build(i, k) }; TILES.built++; }
    L.cells.set(key, c);
    if (c.obj) scene.add(c.obj);
  }
  TILES.startup = false;
  TILES.ms = performance.now() - t0;
}
const tilesLoaded = () => TILES.layers.reduce((n, L) => n + L.cells.size, 0);
