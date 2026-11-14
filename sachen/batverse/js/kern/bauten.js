"use strict";
// Gebaeude-Register (Nicolas 2026-11-14: jedes Gebaeude hat eine ID, sichtbar beim Hovern in Orbit/Geist und beim Koordinaten-Kopieren).
// Netze werden beim Laden je Material zusammengefasst, eine ID am Objekt ginge verloren; darum ein Register mit Grundrissen.
// Eintrag: { id, name, art, poly: [[x, z] ...] (Spielkoordinaten), y0, y1, info? }. Praefixe: FB-0001, BS-01, WM-..., GO-BR-..., GB-...
const BAUTEN = [];
const BAUT_CS = 64, BAUT_GRID = new Map();
function bautAdd(e) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, A = 0;
  for (let i = 0, n = e.poly.length; i < n; i++) {
    const p = e.poly[i], q = e.poly[(i + 1) % n];
    x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); A += p[0] * q[1] - q[0] * p[1];
  }
  e.area = Math.abs(A) / 2; e.bb = [x0, z0, x1, z1];
  BAUTEN.push(e);
  for (let i = Math.floor(x0 / BAUT_CS); i <= Math.floor(x1 / BAUT_CS); i++)
    for (let k = Math.floor(z0 / BAUT_CS); k <= Math.floor(z1 / BAUT_CS); k++) {
      const key = i + "," + k; let c = BAUT_GRID.get(key); if (!c) BAUT_GRID.set(key, c = []); c.push(e);
    }
  return e;
}
function bautClear() { BAUTEN.length = 0; BAUT_GRID.clear(); }
function bautInPoly(P, x, z) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++)
    if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
  return c;
}
// Eintrag am Punkt: Grundriss enthaelt (x, z) und y liegt in y0-1..y1+1; bei mehreren der kleinste Grundriss
function bautAt(x, y, z) {
  const c = BAUT_GRID.get(Math.floor(x / BAUT_CS) + "," + Math.floor(z / BAUT_CS)); if (!c) return null;
  let best = null;
  for (const e of c) {
    if (y < e.y0 - 1 || y > e.y1 + 1 || x < e.bb[0] || x > e.bb[2] || z < e.bb[1] || z > e.bb[3]) continue;
    if ((!best || e.area < best.area) && bautInPoly(e.poly, x, z)) best = e;
  }
  return best;
}
function bautText(e) { return [e.id, e.name && e.name !== e.id ? e.name : e.art, e.info].filter(Boolean).join(" · "); }
