// Werkstatt – Gegenstaende (Batarang, Rauchbombe, Greifhaken) wie im Spiel (Nicolas 2026-11-16: "die Items muessen auch in der Werkstatt funktionieren").
// Klassisches Skript nach gebaeude.js und VOR ../js/spieler/waffen.js (das Original des Spiels). Stellt bereit, was waffen.js aus der Spielwelt braucht:
// Treffer (shotAt/shotSeg wie fahrzeuge/schiessen.js, aber nur Boden y 0, das aktuelle Umbauprojekt und die Gotham-Gebaeude der Werkstatt als gedrehte Quader),
// EYE, touch, shotSound. Die Figur im Person-Modus ist dasselbe player-Objekt (person.js), der Greifhaken setzt sie also auch hier auf Kanten und Daecher.
"use strict";
const EYE = 1.65, touch = false;
const WG_DK = [];                                                            // gedrehte Quader aus gotham-shim.js (dkAdd), siehe unten
for (const o of (typeof WG_DK_ALL !== "undefined" ? WG_DK_ALL : [])) WG_DK.push(o);
function shotSound() {}
function dkHit(x, y, z) { for (const o of WG_DK) { const dx = x - o.cx, dz = z - o.cz, a = dx * o.ux + dz * o.uz, b = -dx * o.uz + dz * o.ux; if (Math.abs(a) < o.hl && Math.abs(b) < o.hw && y > o.cy - o.hh && y < o.cy + o.hh) return o; } return null; }
const WK_V = new THREE.Vector3();
function shotAt(x, y, z) {
  if (y < 0) return "ground";
  if (typeof projektG !== "undefined") { const b = WK_PB || (WK_PB = new THREE.Box3().setFromObject(projektG)); if (b.containsPoint(WK_V.set(x, y, z))) return "solid"; }
  return dkHit(x, y, z) ? "solid" : null;
}
let WK_PB = null;
function shotSeg(a, b, skip, st = 0.5) { const len = a.distanceTo(b), n = Math.max(1, Math.ceil(len / st)), v = new THREE.Vector3();
  for (let i = 1; i <= n; i++) { v.lerpVectors(a, b, i / n); const h = shotAt(v.x, v.y, v.z, skip); if (h) return { p: v.clone(), hit: h }; } return null; }
// Boden fuer die Figur: Dachflaechen der Gotham-Gebaeude (hoechste Oberseite unter den Fuessen + 0,6)
function personGround(x, z, y) { let g = 0; for (const o of WG_DK) { const dx = x - o.cx, dz = z - o.cz, a = dx * o.ux + dz * o.uz, b = -dx * o.uz + dz * o.ux, top = o.cy + o.hh; if (Math.abs(a) < o.hl && Math.abs(b) < o.hw && top <= y + 0.6 && top > g) g = top; } return g; }
