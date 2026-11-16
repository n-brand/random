// Werkstatt – Gotham-Gebaeude zum Bearbeiten (Nicolas 2026-11-16: "Polizeistation mit Verwahrstelle, Waffenladen, Autohaus, Casino und Parkhaus in die Werkstatt").
// Klassisches Skript nach ../gotham/daten.js und VOR den Gotham-Dateien des Spiels (gotham-baustellen.js, -casino.js, -polizei.js, -orte.js, -parken.js).
// Die Gebaeude kommen aus den ORIGINAL-Dateien des Spiels (eine Aenderung dort zeigt die Werkstatt beim Neuladen). Diese Datei stellt nur bereit, was sie
// aus der Spielwelt brauchen: GOT (Karte -> Werkstatt: gleiche Drehung wie im Spiel, jedes Gebaeude auf seinen Platz WG_ZIEL verschoben, Boden y 0),
// GSTR (keine echten Strassen; westlich jedes Gebaeudes ein Streifen, der als Strasse gilt, damit die Front zur Strecke zeigt), TILES (Aufgaben laufen
// in werkstatt/gebaeude.js am Stueck), und leere Platzhalter fuer Kollision (dkAdd), Tore (gates), Register (bautAdd). Nur fuer die Ansicht.
"use strict";
const WG_ZIEL = { "gcpd": [520, -190], "waffen-1": [520, -80], "auto-teuer": [520, 10], "BS-02": [520, 120], "parkhaus-1": [520, 230] };   // Mitte in der Werkstatt
const WG_NAME = { "gcpd": "Polizeipräsidium mit Verwahrstelle", "waffen-1": "Waffenladen (GUNS & AMMO)", "auto-teuer": "Autohaus (Prestige Motors)", "BS-02": "Casino", "parkhaus-1": "Parkhaus" };
const WG_MAP = { "BS-02": [-1300, -620, 60] };                                 // Kartenmitte und groesstes Mass; BS-02 aus gotham/stadt.js (Baustelle des Casinos)
for (const o of GOTHAM.orte) if (WG_ZIEL[o.id]) WG_MAP[o.id] = [o.x, o.z, Math.max(o.w, o.d)];
GOTHAM.orte = GOTHAM.orte.filter(o => WG_ZIEL[o.id]);                       // nur diese Orte bauen
const GCELL = 768;
const GOT = (() => {
  const L = GOTHAM.manorLage, t = L.dreh * Math.PI / 180, ct = Math.cos(t), st = Math.sin(t);
  const real = (mx, mz) => { const dx = mx - L.x, dz = mz - L.z; return [dx * ct + dz * st, -dx * st + dz * ct]; };   // wie GOT.toGame im Spiel
  const near = (mx, mz) => { let b = null, bd = Infinity; for (const id in WG_MAP) { const [x, z] = WG_MAP[id], d = (mx - x) ** 2 + (mz - z) ** 2; if (d < bd) { bd = d; b = id; } } return b; };
  const toGame = (mx, mz) => { const id = near(mx, mz), [cx, cz] = WG_MAP[id], [rx, rz] = real(mx, mz), [ox, oz] = real(cx, cz), T = WG_ZIEL[id]; return [rx - ox + T[0], rz - oz + T[1]]; };
  return { STR: 0, toGame, cuts: [], real };
})();
const GSTR = { done: true, roads: [], walkAt: () => false,
  onRoad(x, z) { for (const id in WG_ZIEL) { const [tx, tz] = WG_ZIEL[id], r = WG_MAP[id][2] * 0.75; if (Math.abs(z - tz) < r + 25 && x < tx - r - 2 && x > tx - r - 22) return true; } return false; } };
const GGEB = { done: true, list: [] };
const TILES = { tasks: [], startup: false, loading: () => false, slice: () => 50, frame: 999 };
const gates = [];
let night = 0;
const WG_DK_ALL = [];   // alle gedrehten Quader: Treffer und Daecher fuer die Gegenstaende (item-shim.js)
function dkAdd(o) { const r = { ...o, on: true, y0: o.cy - o.hh, y1: o.cy + o.hh, top: o.cy + o.hh }; WG_DK_ALL.push(r); return r; }
function dkRoom() { return {}; }
function bautAdd() {}
function bautAt() { return null; }
