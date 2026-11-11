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
// Flugzeug-Silo (Nicolas 2026-11-11: Betonwand stand an der Ostseite fast 4 m frei, Loch mit Himmel an der Ecke): Erdwall rund um das Silo,
// oben auf der hoechsten Randhoehe (wie vorher die Klappen), Boeschung ca. 17 Grad, hoechstens 14 m breit
function genH(x, z) {
  const h = genHb(x, z), dx = Math.max(0, Math.abs(x - SILO.x) - SILO.h), dz = Math.max(0, Math.abs(z - SILO.z) - SILO.h), d = Math.hypot(dx, dz);
  if (d > 14) return h;
  if (SILO.top === undefined) { let m = -1e9; const R = SILO.h; for (let k = 0; k <= 8; k++) { const q = -R + k * R / 4; for (const [px, pz] of [[SILO.x - R, SILO.z + q], [SILO.x + R, SILO.z + q], [SILO.x + q, SILO.z - R], [SILO.x + q, SILO.z + R]]) m = Math.max(m, genHb(px, pz)); } SILO.top = m; }
  return Math.max(h, SILO.top - d * 0.3);
}
function genHb(x, z) {
  let h = genH0(x, z) + serpRug(x, z);
  const r = serpBlend(x, z); if (r) h = lerp(h, r.y, r.w);
  const q = wfBlend(x, z); if (q) h = lerp(h, q.y, q.w);
  { const w = roadNear(HFR, x, z, HFR.w / 2 + 5.5); if (w && (x < HF_XP - 0.3 || (x < HF_XP + 3 && Math.abs(z - HF_CZ) < 3.3))) h = lerp(h, w.y - 0.08, 1 - sst(HFR.w / 2 + 1.5, HFR.w / 2 + 5.5, w.d)); }   // Westweg (Kies), nicht ueber dem Tunnel
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
// ===================== Grundstuecksmauer: Verlauf (Nicolas 2026-11-09, Skizze) =====================
// Vom Einfahrtstor (Enden der Tormauern) im Norden um das Anwesen herum, der Wasserfall liegt ausserhalb; Westtor bei WALL_GATE2;
// im Sueden am Hangfuss zwischen Plateau und Hauptstrasse (bis 35 m, mind. 18 m von der Strasse, Serpentine frei). Zwei Luecken fuer Fussgaenger im Wald (WALL_GAPS). Gebaut in aussen/grundmauer.js; der Wald haelt Abstand.
const WALL_GATE2 = [-199.2, 35], WALL_GAPS = [{ x: 80, z: -125, kind: "ruin" }, { x: -190.75, z: 132.72, kind: "tree" }];   // Nicolas: Westtor und Baum getauscht
const WALL_LINES = (() => {
  const [ux, uz] = GATE_U, end = lz => [GATE_C[0] - lz * uz, GATE_C[1] + lz * ux];
  const chaikin = P => { for (let it = 0; it < 3; it++) { const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++) { const [a, b] = [P[i], P[i + 1]]; Q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } Q.push(P[P.length - 1]); P = Q; } return P; };
  const resample = (P, step) => { const out = [P[0]]; let acc = 0; for (let i = 1; i < P.length; i++) { const [a, b] = [P[i - 1], P[i]], l = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = step - acc;
    while (t <= l) { out.push([a[0] + (b[0] - a[0]) * t / l, a[1] + (b[1] - a[1]) * t / l]); t += step; } acc = l - (t - step); } const last = P[P.length - 1], q = out[out.length - 1]; if (Math.hypot(last[0] - q[0], last[1] - q[1]) > 0.3) out.push(last); return out; };
  const north = [end(-16), [158, -40], [134, -74], [106, -110], [56, -136], [-20, -150], [-92, -145], [-158, -123], [-186, -103], [-197, -70], [-200, -10], WALL_GATE2];
  // Sueden: Hauptstrasse um 35 m nach innen versetzt (Seite zur Anwesensmitte), nur bis x 108, dann zum suedlichen Tormauer-Ende
  const S = MAIN.samples, off = [];
  for (let i = 0; i < S.length - 1; i += 12) { const [x, z] = S[i], [x2, z2] = S[Math.min(S.length - 1, i + 1)], l = Math.hypot(x2 - x, z2 - z); let nx = -(z2 - z) / l, nz = (x2 - x) / l;
    if (nx * (-25 - x) + nz * (30 - z) < 0) { nx = -nx; nz = -nz; } let o = 35; while (o > 18 && plateauH(x + nx * o, z + nz * o) > 2.5) o -= 1;   // am Hangfuss statt am Plateauhang (Nicolas 2026-11-09), mind. 18 m zur Strasse
    while (o > 18 && SERP.samples.some(q => Math.hypot(q[0] - x - nx * o, q[1] - z - nz * o) < 20)) o -= 1;   // Serpentine frei lassen (Nicolas 2026-11-09)
    const p = [x + nx * o, z + nz * o]; if (p[0] < 108) off.push(p); }
  const south = [WALL_GATE2, [-198, 75], [-190.75, 132.72], [-176, 158], [-130, 170], ...off.filter(p => p[0] > -100), end(16)];
  const [N2, S2] = [north, south].map(P => resample(chaikin(P), 2));
  // Suedstueck vom Punkt (45/117) bis zur Tormauer gerade (Nicolas 2026-11-11: Schlangenlinie um die Serpentine weg);
  // gemessen mind. 17,7 m zur Serpentinen-Mitte (vorher ca. 12 m) und 13,9 m zur Hauptstrassen-Mitte
  const A = [45, 117]; let k = 0; S2.forEach((p, i) => { if (Math.hypot(p[0] - A[0], p[1] - A[1]) < Math.hypot(S2[k][0] - A[0], S2[k][1] - A[1])) k = i; });
  return [N2, [...S2.slice(0, k), ...resample([S2[k], S2[S2.length - 1]], 2)]];
})();
const WALL_GRID = new Map();
for (const L of WALL_LINES) for (const [x, z] of L) { const k = Math.floor(x / 10) + "," + Math.floor(z / 10); if (!WALL_GRID.has(k)) WALL_GRID.set(k, []); WALL_GRID.get(k).push([x, z]); }
function wallNear(x, z, d) {                                             // Punkt naeher als d an der Mauer, am Westtor oder an einer Luecke (Wald frei halten)
  if (Math.hypot(x - WALL_GATE2[0], z - WALL_GATE2[1]) < 16 || WALL_GAPS.some(G => Math.hypot(x - G.x, z - G.z) < 8)) return true;
  const cx = Math.floor(x / 10), cz = Math.floor(z / 10);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const [px, pz] of WALL_GRID.get((cx + i) + "," + (cz + j)) || []) if (Math.hypot(x - px, z - pz) < d + 1) return true;
  return false;
}
// ===================== Westweg (Nicolas 2026-11-09): Tunnel vom Autoaufzug (Hangfuss) durch den Westhang, Kiesstrasse bis durch das Westtor =====================
// Portal HF_XP: erste Stelle nach Westen, an der das Gelaende nur noch 6,4 m ueber dem Tunnelboden liegt (Decke 5,2 m plus Ueberdeckung).
// Davor ein Einschnitt mit Stuetzmauern (Gelaende per genH an die Strasse angeglichen), dann Kies dem Gelaende nach bis durch das Westtor.
const HF_CZ = (HF_TUN.z0 + HF_TUN.z1) / 2;
const HF_XP = (() => { for (let x = HF_TUN.x0; x > -140; x -= 0.5) if (plateauH(x, HF_CZ) < HF_Y + 6.4) return x; return -100; })();   // (genH0 braucht gelaende.js, ausserhalb des Anwesens ist es hier = Plateauhang)
// Gelaende ueber dem Tunnelmund (Portalkopf): urspruenglicher Hang (genH0), mind. 0,9 m ueber der Tunneldecke (Nicolas 2026-11-11: vorher flach
// auf 5,65 m -> Mulde hinter der Portalwand, in die Autos rutschten). Gilt fuer das Gelaendestueck (autoaufzug.js), groundAt und carSlopeG; null = ausserhalb
const hfCap = (x, z) => x > HF_XP + 0.3 && x < HF_XP + 10 && Math.abs(z - HF_CZ) < 6.5 ? Math.max(genH0(x, z), HF_Y + 5.2 + 0.9) : null;
HF_TUN.x0 = HF_XP - 1.0;                                                // Tunnel-Rechteck reicht bis vor die Portalwand (dort kein Gelaende)
const WALL_GATE2_U = (() => {                                            // Westtor: Fahrtrichtung nach aussen (Normale zur Mauer, weg von der Anwesensmitte)
  const L = WALL_LINES[0], a = L[L.length - 4], b = WALL_LINES[1][3]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
  let ux = dz, uz = -dx; if (ux * (WALL_GATE2[0] + 25) + uz * (WALL_GATE2[1] - 30) < 0) { ux = -ux; uz = -uz; } return [ux, uz]; })();
const HFR = (() => { const [gx, gz] = WALL_GATE2, [ux, uz] = WALL_GATE2_U, g = k => [gx + ux * k, gz + uz * k];
  return makeRoad([[HF_XP, HF_CZ], [HF_XP - 18, HF_CZ], g(-34), g(-16), g(-6), [gx, gz], g(8), g(18)], 6,
    (R, s) => { if (!R.ys) R.ys = smooth(smooth(R.samples.map(([x, z]) => genH0(x, z)), 8), 8); return lerp(HF_Y, profileAt(R, s), sst(14, 40, s)); }); })();
// ===================== Flugzeug-Ausgang (Nicolas 2026-11-09): Hangar West vergroessert (leer), Gang zum Silo unter der Wiese =====================
// HGX = Erweiterung des Hangars West (obere Hoehle, nur Raum), AXT = Gang (8,4 m breit) vom Hangar schraeg zum Silo, SILO = 20 x 20 m Schacht
// von UY bis an die Oberflaeche, oben zwei getarnte Rasenklappen. Gang, Erweiterung und Silo gehoeren zum Raster der oberen Hoehle (hoehle-oben.js).
const HGX = { x0: -70, x1: -46, z0: 26.5, z1: 46 }, AXT = { a: [-52.4, 41.5], b: [-130.62, 124.85], hw: 7 }, SILO = { x: -130.62, z: 124.85, h: 15 };   // Nicolas: fuer The Bat groesser (Gang 14 m, Silo 30 x 30 m)
function axtIn(x, z, m = 0) { const [ax, az] = AXT.a, [bx, bz] = AXT.b, dx = bx - ax, dz = bz - az, t = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)); return Math.hypot(x - ax - dx * t, z - az - dz * t) < AXT.hw + m; }
const inSilo = (x, z, m = 0) => Math.abs(x - SILO.x) < SILO.h + m && Math.abs(z - SILO.z) < SILO.h + m;
// ===================== Garagenrampe (Nicolas 2026-11-10): Klapprampe im Rasen oestlich vom Haus, Wendeplatz, Rolltor in die vergroesserte Garage =====================
// Klappe F (Scharnier am Nordende auf HILL, Suedende sinkt auf den Garagenboden), Wendeplatz P auf Garagenhoehe unter fester Decke, Tor in der Garagen-Ostwand (z D0..D1).
// GRAMP.f = Klappenstellung 0 (zu) .. 1 (offen), wird von aussen/garagenrampe.js gesetzt; y(z) = Oberkante der Klappe
const GRAMP = { F: { x0: 12, x1: 19, z0: 16.5, z1: 39.2 }, P: { x0: 4.2, x1: 19, z0: 39.2, z1: 53.2 }, D0: 46.5, D1: 52.7, f: 0,
  inF(x, z, m = 0) { const F = this.F; return x > F.x0 - m && x < F.x1 + m && z > F.z0 - m && z < F.z1 + m; },
  inP(x, z, m = 0) { const P = this.P; return x > P.x0 - m && x < P.x1 + m && z > P.z0 - m && z < P.z1 + m; },
  ang() { return this.f * Math.asin(-GY / (this.F.z1 - this.F.z0)); },
  y(z) { const a = this.ang(), s = z - this.F.z0; return s <= (this.F.z1 - this.F.z0) * Math.cos(a) ? HILL - s * Math.tan(a) : GY + HILL; } };
