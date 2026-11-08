// Wayne Manor 3D – Hauptstrasse und Zufahrt: Verlauf, Naehe; Gelaendefunktionen genH/genH0
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Hauptstrasse und Zufahrt (E4) =====================
// Hauptstrasse geschwungen von Suedwesten (-61/200) zwischen Plateauhang und Kueste (mind. ca. 25 m Abstand) nach Nordosten (256/-217),
// Punkte von Nicolas (2026-11-08). Zufahrt vom Fuss der Serpentine (122/1,5) durch das Einfahrtstor (schraeg zum Anwesen, Skizze Nicolas)
// bis zur Hauptstrasse (T-Kreuzung). Hoehe: Hauptstrasse = Gelaende entlang der Linie, zweimal gleitend gemittelt (+-35 m);
// Zufahrt sanft von der Serpentine zur Kreuzung. Das Gelaende wird wie bei der Serpentine an die Fahrbahn angeglichen.
const GATE_C = [147.5, 10.4], GATE_U = [0.605, 0.796];                 // Tormitte, Fahrtrichtung nach aussen (Suedosten)
function makeRoad(pts, w, yFn) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
  const len = curve.getLength(), n = Math.ceil(len), samples = [], grid = new Map(), G = 10;
  for (let i = 0; i <= n; i++) { const p = curve.getPointAt(i / n); samples.push([p.x, p.z, i / n * len]); }
  for (const smp of samples) { const k = Math.floor(smp[0] / G) + "," + Math.floor(smp[1] / G); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(smp); }
  const R = { curve, len, samples, w, grid, G, ys: null };
  R.y = s => yFn(R, s);
  return R;
}
// Naechster Strassenpunkt (bis max Meter) ueber ein 10-m-Raster: { d, s, y } oder null
function roadNear(R, x, z, max) {
  const G = R.G, gx1 = Math.floor((x + max) / G), gz1 = Math.floor((z + max) / G);
  let bq = max * max, bs = -1;
  for (let gx = Math.floor((x - max) / G); gx <= gx1; gx++) for (let gz = Math.floor((z - max) / G); gz <= gz1; gz++) {
    const L = R.grid.get(gx + "," + gz); if (L) for (const [sx, sz, s] of L) { const q = (x - sx) ** 2 + (z - sz) ** 2; if (q < bq) { bq = q; bs = s; } }
  }
  return bs < 0 ? null : { d: Math.sqrt(bq), s: bs, y: R.y(bs) };
}
const smooth = (a, r) => a.map((_, i) => { let t = 0, n = 0; for (let k = Math.max(0, i - r); k <= Math.min(a.length - 1, i + r); k++) { t += a[k]; n++; } return t / n; });
const profileAt = (R, s) => { const f = clamp01(s / R.len) * (R.ys.length - 1), i = Math.floor(f); return lerp(R.ys[i], R.ys[Math.min(R.ys.length - 1, i + 1)], f - i); };
const MAIN = makeRoad([[-61, 200], [0, 168], [48, 138], [78, 108], [100, 78], [128, 55], [172, 36], [210, 0], [232, -60], [244, -130], [256, -217]], 8,
  (R, s) => { if (!R.ys) R.ys = smooth(smooth(R.samples.map(([x, z]) => genH0(x, z)), 35), 35); return profileAt(R, s); });
const MAIN_J = (() => { let b = null, bq = 1e9; for (const smp of MAIN.samples) { const q = (smp[0] - 172) ** 2 + (smp[1] - 36) ** 2; if (q < bq) { bq = q; b = smp; } } return b; })();   // Kreuzung
const ZUF = makeRoad([[121, 1.5], [131.5, 2.6], [GATE_C[0] - 6 * GATE_U[0], GATE_C[1] - 6 * GATE_U[1]], GATE_C, [GATE_C[0] + 6 * GATE_U[0], GATE_C[1] + 6 * GATE_U[1]], [MAIN_J[0], MAIN_J[1]]], 7.5,
  (R, s) => lerp(SERP_FOOT, MAIN.y(MAIN_J[2]), sst(0, R.len, s)));
const ROADS2 = [MAIN, ZUF];
function genH(x, z) {
  let h = genH0(x, z) + serpRug(x, z);
  const r = serpBlend(x, z); if (r) h = lerp(h, r.y, r.w);
  const q = wfBlend(x, z); if (q) h = lerp(h, q.y, q.w);
  for (const R of [ZUF, MAIN]) { const w = roadNear(R, x, z, R.w / 2 + 5.5); if (w) h = lerp(h, w.y - 0.08, 1 - sst(R.w / 2 + 1.5, R.w / 2 + 5.5, w.d)); }   // E4 (Hauptstrasse zuletzt: an der Kreuzung gilt ihre Hoehe)
  return h;
}
function genH0(x, z) {
  const sd = seaD(x, z);
  // Huegel ausserhalb des Anwesens. An der Kueste (Nicolas: "mehr Hoehenunterschiede") reichen sie bis an die Kante, etwas hoeher und mit
  // mittelgrossen Buckeln, so wechselt auch die Klippenhoehe. Um Wassertunnel und Felsbogen (|t| < 80) bleibt es wie vorher flach.
  const ch = sst(80, 170, Math.abs((z - x) * R2));
  let h = sst(0, 140, siteDist(x, z)) * Math.max(0, fbm(x / 170 + 3, z / 170 + 9) * lerp(16, 24, ch) + ch * 9 * (vnoise(x / 48 + 21, z / 48 + 13) - 0.5))
    * lerp(sst(0, -80, sd), sst(-6, -40, sd), ch);
  h += 170 * sst(700, 1300, Math.hypot(x, z)) * (0.45 + 0.8 * fbm(x / 260 + 11, z / 260 + 2)) * sst(-60, -320, sd);   // Berge am Horizont (nicht zum Meer hin)
  // Steilkueste: oben leicht erhoehte Felskante, dann ca. 32 m senkrecht hinab, am Fuss ein flacher Felssockel, weiter draussen tiefer
  // Klippe mindestens so breit wie ca. 1,6 Rasterzellen (draussen ist das Raster grob, sonst springt die Kante zackig von Zelle zu Zelle)
  const cw = Math.max(4, 1.6 * Math.max(gridStep(x), gridStep(z)));
  h = h * lerp(1 - sst(-25, -3, sd), 1 - sst(-0.62 * cw, 0.38 * cw, sd), ch) + 1.0 * sst(-30, -8, sd) * (1 - sst(-0.75 * cw, -0.25 * cw, sd)) - 38 * sst(-0.62 * cw, 0.38 * cw, sd) - 9 * sst(14, 60, sd);   // B1: Klippe 38 m
  for (const L of LAKES) h *= sst(1.0, 2.4, lakeD(L, x, z));                          // Seeufer flach
  // (A4: der alte Nordhang mit Felskante beim alten Wasserfall ist weg; die Plateau-Erweiterung mit Felswand uebernimmt, Wasserfall neu in A7)
  for (const L of LAKES) h -= L.depth * sst(1.0, 0.55, lakeD(L, x, z));
  const ph = plateauH(x, z);
  if (ph > 0.01) h = Math.max(h, ph);
  if (ph > HILL - 6) { const sdd = streamDist(x, z); if (sdd < 4) h -= 1.15 * (1 - sst(1.4, 3.6, sdd)); }   // Bachrinne (A7)
  return h;
}
