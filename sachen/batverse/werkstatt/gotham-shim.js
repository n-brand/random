// Werkstatt – Gotham-Gebaeude zum Bearbeiten (Nicolas 2026-11-16: "Polizeistation mit Verwahrstelle, Waffenladen, Autohaus, Casino und Parkhaus in die Werkstatt").
// Klassisches Skript nach ../gotham/daten.js und VOR den Gotham-Dateien des Spiels (gotham-baustellen.js, -casino.js, -polizei.js, -orte.js, -parken.js).
// Die Gebaeude kommen aus den ORIGINAL-Dateien des Spiels (eine Aenderung dort zeigt die Werkstatt beim Neuladen). Diese Datei stellt nur bereit, was sie
// aus der Spielwelt brauchen: GOT (Karte -> Werkstatt: gleiche Drehung wie im Spiel, jedes Gebaeude auf seinen Platz WG_ZIEL verschoben, Boden y 0),
// GSTR (keine echten Strassen; der Rundkurs der Werkstatt gilt als Strasse, damit die Front zur Strecke zeigt), TILES (Aufgaben laufen
// in werkstatt/gebaeude.js am Stueck), und leere Platzhalter fuer Kollision (dkAdd), Tore (gates), Register (bautAdd). Nur fuer die Ansicht.
"use strict";
// Um den Rundkurs (Nicolas 2026-11-17: "die hinteren Gebaeude sollen um die Fahrbahn stehen"): Mitte [x, z] und Richtung der Front zur Strecke [dx, dz].
// Jedes Gebaeude wird um seine Mitte so gedreht, dass die Kartenseite "Norden" (Front des Polizeipraesidiums, im Spiel zur Strasse) zur Strecke zeigt.
const WG_ZIEL = { "gcpd": [-245, 0], "waffen-1": [-120, -92], "auto-teuer": [128, 112], "BS-02": [-125, 105], "parkhaus-1": [122, -100] };
const WG_FRONT = { "gcpd": [1, 0], "waffen-1": [0, 1], "auto-teuer": [0, -1], "BS-02": [0, -1], "parkhaus-1": [0, 1] };
const WG_NAME = { "gcpd": "Polizeipräsidium mit Verwahrstelle", "waffen-1": "Waffenladen (GUNS & AMMO)", "auto-teuer": "Autohaus (Prestige Motors)", "BS-02": "Casino", "parkhaus-1": "Parkhaus" };
const WG_MAP = { "BS-02": [-1300, -620, 60] };                                 // Kartenmitte und groesstes Mass; BS-02 aus gotham/stadt.js (Baustelle des Casinos)
for (const o of GOTHAM.orte) if (WG_ZIEL[o.id]) WG_MAP[o.id] = [o.x, o.z, Math.max(o.w, o.d)];
const GOTHAM_ORTE_ALLE = GOTHAM.orte.slice();                                // alle Orte (Karten-App der Laptops, js/ui/laptop.js)
GOTHAM.orte = GOTHAM.orte.filter(o => WG_ZIEL[o.id]);                       // nur diese Orte bauen
const GCELL = 768;
const GOT = (() => {
  const L = GOTHAM.manorLage, t = L.dreh * Math.PI / 180, ct = Math.cos(t), st = Math.sin(t);
  const real = (mx, mz) => { const dx = mx - L.x, dz = mz - L.z; return [dx * ct + dz * st, -dx * st + dz * ct]; };   // wie GOT.toGame im Spiel
  const near = (mx, mz) => { let b = null, bd = Infinity; for (const id in WG_MAP) { const [x, z] = WG_MAP[id], d = (mx - x) ** 2 + (mz - z) ** 2; if (d < bd) { bd = d; b = id; } } return b; };
  const f0 = real(0, -1), a0 = Math.atan2(f0[1] - real(0, 0)[1], f0[0] - real(0, 0)[0]), ROT = {};   // Kartennorden nach der Spieldrehung
  for (const id in WG_FRONT) { const d = WG_FRONT[id], a = Math.atan2(d[1], d[0]) - a0; ROT[id] = [Math.cos(a), Math.sin(a)]; }
  const toGame = (mx, mz) => { const id = near(mx, mz), [cx, cz] = WG_MAP[id], [rx, rz] = real(mx, mz), [ox, oz] = real(cx, cz), T = WG_ZIEL[id], [c, sn] = ROT[id], vx = rx - ox, vz = rz - oz;
    return [vx * c - vz * sn + T[0], vx * sn + vz * c + T[1]]; };
  return { STR: 0, toGame, cuts: [], real };
})();
const GSTR = { done: true, roads: [], walkAt: () => false,
  onRoad(x, z) { const R = 60, h = 110, w = 7.5; if (Math.abs(x) <= h) return Math.abs(Math.abs(z) - R) <= w; return Math.abs(Math.hypot(Math.abs(x) - h, z) - R) <= w; } };   // der Rundkurs der Werkstatt (KURS in werkstatt.js)
const GGEB = { done: true, list: [] };
const TILES = { tasks: [], startup: false, loading: () => false, slice: () => 50, frame: 999 };
const gates = [];
let night = 0;
const WG_DK_ALL = [];   // alle gedrehten Quader: Treffer und Daecher fuer die Gegenstaende (item-shim.js)
// wie kern/drehkoll.js: Rand m (Standard 0,3) seitlich und in der Hoehe, Oberseite ohne Rand, g = Neigung, floor = 0 kein Boden (Nicolas 2026-11-17: in der Werkstatt lief man durch Gelaender)
function dkAdd(o) { const m = o.m ?? 0.3, r = { ...o, on: true, hl: o.hl + m, hw: o.hw + m, y0: o.cy - o.hh - m, y1: o.cy + o.hh + m, top: o.cy + o.hh, g: o.g || 0, floor: o.floor ?? 1 }; WG_DK_ALL.push(r); return r; }
function dkRoom() { return {}; }
function bautAdd() {}
function bautAt() { return null; }
