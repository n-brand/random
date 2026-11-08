// Wayne Manor 3D – Serpentine: Verlauf, Naehe, Gelaende-Angleichung, Felszone
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Serpentinenstrasse (A5) =====================
// Vom Ostrand des Rondells (25 m) in vier Kehren den Osthang hinab bis zum Hangfuss (ca. x 108). Mittellinie in Weltkoordinaten,
// Hoehe gleichmaessig nach Laenge (ca. 5-6 %). Kehren als Halbkreise (Radius 7 m). Das Gelaende wird an die Fahrbahn angeglichen (genH).
const SERP_W = 7.5, SERP_TOP = HILL, SERP_FOOT = 1.5;
const SERP = (() => {
  // Nicolas 2026-11-08: Kehren waren mit r 7 m nur im Schritttempo fahrbar -> zwei Kehren mit r 11 m, laengere Abschnitte (ca. 5 %)
  const pts = [[15, 0], [21, 0], [27, -2], [31.5, -8], [33, -16], [33.5, -28], [33, -40]];
  const kehre = (cx, cz, dir, from, r = 11) => { for (let k = 1; k < 8; k++) { const a = Math.PI * k / 8; pts.push([cx - from * r * Math.cos(a), cz + dir * r * Math.sin(a)]); } };
  // Abschnitt zwischen zwei Kehren: an den Enden genau auf x0 (Anschluss an die Kehre), dazwischen sanft gebogen (Nicolas: "zu perfekt gerade")
  const leg = (x0, zA, zB, a1, a2) => { for (let k = 1; k <= 7; k++) { const u = k / 8; pts.push([x0 + a1 * Math.sin(Math.PI * u) + a2 * Math.sin(2 * Math.PI * u), lerp(zA, zB, u)]); } pts.push([x0, zB]); };
  kehre(44, -40, -1, 1); pts.push([55, -40]); leg(55, -40, 52, 3.0, 1.2);
  kehre(66, 52, 1, 1); pts.push([77, 52]); leg(77, 52, 24, 1.5, 0.5);
  pts.push([78.5, 14], [83, 7.5], [91, 3.6], [101, 2.2], [112, 1.7], [122, 1.5]);
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
  const len = curve.getLength(), n = Math.ceil(len), samples = [];
  for (let i = 0; i <= n; i++) { const p = curve.getPointAt(i / n); samples.push([p.x, p.z, i / n * len]); }
  const box = samples.reduce((a, [x, z]) => [Math.min(a[0], x), Math.max(a[1], x), Math.min(a[2], z), Math.max(a[3], z)], [1e9, -1e9, 1e9, -1e9]);
  return { curve, len, samples, box, y: s => lerp(SERP_TOP, SERP_FOOT, clamp01(s / len)) };
})();
// Naechster Strassenpunkt (bis max Meter): { d, s, y } oder null
function serpNear(x, z, max) {
  const b = SERP.box;
  if (x < b[0] - max || x > b[1] + max || z < b[2] - max || z > b[3] + max) return null;
  let best = max * max, bs = -1;
  for (const [sx, sz, s] of SERP.samples) { const q = (x - sx) ** 2 + (z - sz) ** 2; if (q < best) { best = q; bs = s; } }
  return bs < 0 ? null : { d: Math.sqrt(best), s: bs, y: SERP.y(bs) };
}
// Gelaende an die Fahrbahn angleichen: gewichtetes Mittel der Strassenhoehe in der Naehe (zwischen zwei Schleifen weicher Uebergang)
function serpBlend(x, z) {
  const b = SERP.box, R = SERP_W / 2 + 4.5;
  if (x < b[0] - R || x > b[1] + R || z < b[2] - R || z > b[3] + R) return null;
  let W = 0, WY = 0, mw = 0;
  for (const [sx, sz, s] of SERP.samples) {
    const d = Math.hypot(x - sx, z - sz);
    if (d >= R) continue;
    const w = 1 - sst(SERP_W / 2 + 1.1, R, d);
    W += w; WY += w * SERP.y(s); mw = Math.max(mw, w);
  }
  return W > 0 ? { y: WY / W - 0.08, w: mw } : null;
}
// Bereich der Passstrasse (Osthang ausserhalb des Plateaus): Fels statt Wiese, unruhiges Gelaende mit Schichtstufen
function serpZone(x, z) { return sst(-74, -60, z) * sst(82, 68, z) * sst(22, 33, x) * sst(110, 99, x); }   // ab x ca. 105 Torbereich (A6)
function serpRug(x, z) {
  const zn = serpZone(x, z);
  if (zn <= 0) return 0;
  const ridge = 1 - Math.abs(2 * vnoise(x / 15 + 41, z / 15 + 17) - 1);
  let r = 4.2 * ridge * ridge + 2.0 * (vnoise(x / 6 + 3, z / 6 + 9) - 0.35) + 0.7 * (vnoise(x / 2.5 + 8, z / 2.5 + 2) - 0.5);
  const q = r / 1.4, f = q - Math.floor(q);
  r = 1.4 * (Math.floor(q) + sst(0.55, 1, f));                           // Gesteinsschichten als kleine Stufen
  return zn * r * (1 - sst(HILL - 3, HILL - 0.3, plateauH(x, z)));
}
