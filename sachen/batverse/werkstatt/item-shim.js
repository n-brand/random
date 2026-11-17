// Werkstatt – Gegenstaende (Batarang, Rauchbombe, Greifhaken) wie im Spiel (Nicolas 2026-11-16: "die Items muessen auch in der Werkstatt funktionieren").
// Klassisches Skript nach gebaeude.js und VOR ../js/spieler/waffen.js (das Original des Spiels). Stellt bereit, was waffen.js aus der Spielwelt braucht:
// Treffer (shotAt/shotSeg wie fahrzeuge/schiessen.js, aber nur Boden y 0, das aktuelle Umbauprojekt und die Gotham-Gebaeude der Werkstatt als gedrehte Quader),
// EYE, touch, shotSound. Die Figur im Person-Modus ist dasselbe player-Objekt (person.js), der Greifhaken setzt sie also auch hier auf Kanten und Daecher.
"use strict";
const EYE = 1.65, touch = false;
const WG_DK = typeof WG_DK_ALL !== "undefined" ? WG_DK_ALL : [];                                                            // gedrehte Quader aus gotham-shim.js (dkAdd), siehe unten
// dieselbe Liste (auch spaeter gebaute Teile wie die Casino-Treppe zaehlen)
function shotSound() {}
function dkHit(x, y, z) { for (const o of WG_DK) { const dx = x - o.cx, dz = z - o.cz, a = dx * o.ux + dz * o.uz, b = -dx * o.uz + dz * o.ux; if (Math.abs(a) < o.hl && Math.abs(b) < o.hw && y > o.cy - o.hh && y < o.cy + o.hh) return o; } return null; }
const WK_V = new THREE.Vector3();
function shotAt(x, y, z) {
  if (y < 0) return "ground";
  if (typeof projektG !== "undefined") { const L = WK_PB || (WK_PB = projektG.children.filter(o => o.userData.kind).map(o => new THREE.Box3().setFromObject(o))); WK_V.set(x, y, z); for (const b of L) if (b.containsPoint(WK_V)) return "solid"; }   // je Teil (Automat, Laptop-Tisch)
  return dkHit(x, y, z) ? "solid" : null;
}
let WK_PB = null;
function shotSeg(a, b, skip, st = 0.5) { const len = a.distanceTo(b), n = Math.max(1, Math.ceil(len / st)), v = new THREE.Vector3();
  for (let i = 1; i <= n; i++) { v.lerpVectors(a, b, i / n); const h = shotAt(v.x, v.y, v.z, skip); if (h) return { p: v.clone(), hit: h }; } return null; }
// Boden fuer die Figur: Dachflaechen der Gotham-Gebaeude (hoechste Oberseite unter den Fuessen + 0,6)
function personGround(x, z, y) { let g = 0; for (const o of WG_DK) { if (!o.on || !o.floor) continue; const dx = x - o.cx, dz = z - o.cz, a = dx * o.ux + dz * o.uz, b = -dx * o.uz + dz * o.ux, top = o.top + (o.g || 0) * a; if (Math.abs(a) < o.hl && Math.abs(b) < o.hw && top <= y + 0.6 && top > g) g = top; } return g; }
// seitlich aus den gedrehten Quadern hinausschieben wie dkPush im Spiel (Koerper ab Stufenhoehe 0,45 bis 1,8 m, Radius 0,3; Nicolas 2026-11-17: "im Casino kann man durch viele Gegenstaende laufen")
function personPush(p) { const y0 = p.y + 0.45, y1 = p.y + 1.8, R = 0.3; for (const o of WG_DK) { if (!o.on || o.y1 <= y0 || o.y0 >= y1) continue;
    const dx = p.x - o.cx, dz = p.z - o.cz, a = dx * o.ux + dz * o.uz, b = -dx * o.uz + dz * o.ux; if (Math.abs(a) > o.hl + R || Math.abs(b) > o.hw + R) continue;
    const ca = Math.max(-o.hl, Math.min(o.hl, a)), cb = Math.max(-o.hw, Math.min(o.hw, b)), ea = a - ca, eb = b - cb, d = Math.hypot(ea, eb); let na, nb;
    if (d >= R) continue; if (d > 1e-6) { na = ca + ea / d * R; nb = cb + eb / d * R; } else if (o.hl - Math.abs(a) < o.hw - Math.abs(b)) { na = (a < 0 ? -1 : 1) * (o.hl + R); nb = b; } else { na = a; nb = (b < 0 ? -1 : 1) * (o.hw + R); }
    p.x = o.cx + na * o.ux - nb * o.uz; p.z = o.cz + na * o.uz + nb * o.ux; } }
