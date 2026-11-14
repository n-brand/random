"use strict";
// Gedrehte Kollision (Wayne Tower Task 1, Nicolas 2026-11-14; vorher nur fuer die Brueckenteile in gotham-bruecken.js): gedrehte Quader in einem
// eigenen 16-m-Raster, je 0,3 m groesser als sichtbar (Nicolas: Barrieren lieber weiter innen bzw. frueher halten). Gotham steht im Spiel gedreht,
// darum reichen die achsparallelen Quader (solids) dort nicht.
// - seitlich: dkPush schiebt Fahrzeuge und Fussgaenger hinaus (carPush, pushOut)
// - von unten: dkCeil ist Decke (schwebender DeLorean)
// - von oben: dkFloor ist Boden (groundAt, carSlopeG), nur Teile mit floor
// - Punkte: dkIn fuer Flugzeuge und Kamera
// - Hohlraeume unter der Erde (dkRoom): dort gilt dkFloor vor dem Gelaende, und die Kamera ist frei (camBlocked)
const DK = { parts: [], grid: new Map(), q: 0, cs: 16, rooms: [], rgrid: new Map(), rcs: 64 };
const dkKey = (i, k) => (i + 32768) * 65536 + (k + 32768);
// Teil: Mitte cx/cy/cz, Laengsrichtung ux/uz (Einheitsvektor), halbe Laenge hl, halbe Breite hw (quer), halbe Hoehe hh.
// floor = 0: kein Boden; chain = 1: Stueck einer Kette (Fahrbahnkasten, Seil): steckt etwas ganz darin, nur quer hinaus, nicht ins naechste Stueck;
// ceil = 0: keine Decke; m: Rand nach aussen
function dkCells(o, fn) {
  const cs = DK.cs, ex = Math.abs(o.ux) * o.hl + Math.abs(o.uz) * o.hw, ez = Math.abs(o.uz) * o.hl + Math.abs(o.ux) * o.hw;
  for (let i = Math.floor((o.cx - ex) / cs), i1 = Math.floor((o.cx + ex) / cs); i <= i1; i++) for (let k = Math.floor((o.cz - ez) / cs), k1 = Math.floor((o.cz + ez) / cs); k <= k1; k++) fn(dkKey(i, k));
}
function dkAdd({ cx, cy, cz, ux, uz, hl, hw, hh, floor = 1, chain = 0, ceil = 1, m = 0.3 }) {
  const o = { cx, cz, ux, uz, hl: hl + m, hw: hw + m, y0: cy - hh - m, y1: cy + hh + m, top: cy + hh, floor, chain, ceil, on: true, _q: 0 };
  DK.parts.push(o);
  dkCells(o, key => { let c = DK.grid.get(key); if (!c) DK.grid.set(key, c = []); c.push(o); });
  return o;
}
function dkRemove(o) {
  const j = DK.parts.indexOf(o); if (j < 0) return; DK.parts.splice(j, 1);
  dkCells(o, key => { const c = DK.grid.get(key); if (!c) return; const i = c.indexOf(o); if (i >= 0) c.splice(i, 1); if (!c.length) DK.grid.delete(key); });
}
function dkMove(o, dy) { o.y0 += dy; o.y1 += dy; o.top += dy; }
// Teile, deren Grundriss den Kreis (x, z, R) beruehrt; fn(o, a, b, ca, cb): Lage a/b im Teil, naechster Punkt ca/cb
function dkEach(x, z, R, fn) {
  const cs = DK.cs, q = ++DK.q;
  for (let i = Math.floor((x - R) / cs), i1 = Math.floor((x + R) / cs); i <= i1; i++) for (let k = Math.floor((z - R) / cs), k1 = Math.floor((z + R) / cs); k <= k1; k++) {
    const c = DK.grid.get(dkKey(i, k)); if (!c) continue;
    for (const o of c) { if (o._q === q || !o.on) continue; o._q = q;
      const dx = x - o.cx, dz = z - o.cz, a = dx * o.ux + dz * o.uz, b = -dx * o.uz + dz * o.ux;
      const ca = Math.max(-o.hl, Math.min(o.hl, a)), cb = Math.max(-o.hw, Math.min(o.hw, b));
      if ((a - ca) ** 2 + (b - cb) ** 2 < R * R || (a === ca && b === cb)) fn(o, a, b, ca, cb); }
  }
}
// seitlich hinausschieben, wenn sich y0..y1 (Koerper ab Stufenhoehe) mit dem Teil ueberschneidet
function dkPush(p, y0, y1, R) {
  dkEach(p.x, p.z, R, (o, a, b, ca, cb) => {
    if (o.y1 <= y0 || o.y0 >= y1) return;
    const ea = a - ca, eb = b - cb, d = Math.hypot(ea, eb); let na, nb;
    if (d > 1e-6) { na = ca + ea / d * R; nb = cb + eb / d * R; }
    else if (!o.chain && o.hl - Math.abs(a) < o.hw - Math.abs(b)) { na = (a < 0 ? -1 : 1) * (o.hl + R); nb = b; }
    else { na = a; nb = (b < 0 ? -1 : 1) * (o.hw + R); }
    p.x = o.cx + na * o.ux - nb * o.uz; p.z = o.cz + na * o.uz + nb * o.ux;
  });
}
// Decke: tiefste Unterkante eines Teils ab Hoehe y im Kreis (x, z, R), sonst Infinity
function dkCeil(x, z, R, y) { let c = Infinity; dkEach(x, z, R, o => { if (o.ceil && o.y0 >= y && o.y0 < c) c = o.y0; }); return c; }
// Boden: hoechste Oberseite (ohne Rand) eines Teils mit floor am Punkt, hoechstens 0,6 m ueber den Fuessen; sonst null
function dkFloor(x, z, feet) { let best = null; dkEach(x, z, 0, o => { if (o.floor && o.top <= feet + 0.6 && (best === null || o.top > best)) best = o.top; }); return best; }
// Punkt (mit Rand m) in einem Teil?
function dkIn(x, y, z, m = 0) { let hit = false; dkEach(x, z, m, o => { if (y > o.y0 - m && y < o.y1 + m) hit = true; }); return hit; }
// Hohlraeume: { poly: [[x, z] ...], y0, y1 } (Spielkoordinaten)
function dkRoom(r) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const [x, z] of r.poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  r.bb = [x0, z0, x1, z1]; DK.rooms.push(r); const cs = DK.rcs;
  for (let i = Math.floor(x0 / cs); i <= Math.floor(x1 / cs); i++) for (let k = Math.floor(z0 / cs); k <= Math.floor(z1 / cs); k++) { const key = dkKey(i, k); let c = DK.rgrid.get(key); if (!c) DK.rgrid.set(key, c = []); c.push(r); }
  return r;
}
function dkInRoom(x, y, z) {
  const c = DK.rgrid.get(dkKey(Math.floor(x / DK.rcs), Math.floor(z / DK.rcs))); if (!c) return null;
  for (const r of c) if (y >= r.y0 && y <= r.y1 && x >= r.bb[0] && x <= r.bb[2] && z >= r.bb[1] && z <= r.bb[3] && bautInPoly(r.poly, x, z)) return r;
  return null;
}
// Boden mit gedrehten Teilen: im Hohlraum gilt nur der dk-Boden, sonst der hoehere von beiden (g = bisheriger Boden)
function dkGround(x, z, feet, g) {
  const d = dkFloor(x, z, feet); if (d === null) return g;
  if (dkInRoom(x, feet + 0.5, z) || g === null || g > feet + 0.6 || d > g) return d;
  return g;
}
