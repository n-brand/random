// Wayne Manor 3D – Karte -> Welt, Gelaende-Grundlagen, Seen, Kueste, Wasserhoehlen, Becken, Plateau
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Karte -> Welt =====================
// Massstab 0,2 m pro Pixel (Rampe ca. 7 m breit, Haus ca. 65 x 90 m; vorher 0,4 war doppelt zu gross)
const SC = 0.2, OX = 500, OY = 995, MAP_W = 861, MAP_H = 1202;
const mp = (px, py) => [(py - OY) * SC, -(px - OX) * SC];                 // Karten-Pixel -> [x, z]

// ===================== Gelaende (Schritt 2) =====================
// Lage aus der kleinen Uebersichtskarte oben links (Massstab dort ca. 2,8-mal kleiner, Rondell bei 222/252):
// Welt x = (py - 252) * 0,56, z = -(px - 222) * 0,56.
const SITE = { x0: -100, x1: 60, z0: -90, z1: 120 };                 // Anwesen (Kartenbereich) bleibt flach (y 0)
const WATER_Y = -0.35, LIMIT_WORLD = 700;                               // WATER_Y = Seen im Inland
const LY = -28, LH = 10;                                                  // Hoehle unten (Lower Level): Boden und Hoehe
const SEA_Y = LY - 6;                                                     // B1: Meer = Wasser in der Hoehle bei -34 (6 m unter dem Hallenboden), Steilkueste ca. 38 m
const hash2 = (i, j) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return lerp(lerp(hash2(i, j), hash2(i + 1, j), u), lerp(hash2(i, j + 1), hash2(i + 1, j + 1), u), v);
}
const fbm = (x, z) => vnoise(x, z) * 0.53 + vnoise(x * 2.1 + 17, z * 2.1 + 5) * 0.29 + vnoise(x * 4.3 + 3, z * 4.3 + 41) * 0.18;
const LAKES = [
  { name: "Northwest Lake", cx: -150, cz: -55, rx: 24, rz: 36, s: 1.0, depth: 4 },
  // A7: neuer Teich am Fuss der Felswand (der alte bei -99/-126 ist weg); keepPlateau: schneidet die Felswand nicht ab
  { name: "Wasserfall-Teich", cx: -117.5, cz: -186, rx: 9.5, rz: 8.5, s: 2.3, depth: 2.6, keepPlateau: true }   // kleiner (Nicolas): Luecke fuer den Sprung mit dem Batmobil
];
const wob = (L, a) => 1 + 0.12 * Math.sin(3 * a + L.s) + 0.07 * Math.sin(5 * a + 2 * L.s) + 0.04 * Math.sin(8 * a + 3 * L.s);
function lakeD(L, x, z) { const ux = (x - L.cx) / L.rx, uz = (z - L.cz) / L.rz; return Math.hypot(ux, uz) / wob(L, Math.atan2(uz, ux)); }
const LAWNS = [{ name: "West Lawn", cx: -92, cz: 20, rx: 26, rz: 40 }, { name: "South Lawn", cx: -20, cz: 114, rx: 34, rz: 22 }];
const WATERFALL = { x: -117.5, z: -186 };                                   // Teich am Fuss (A7); Fallkante WF_LIP
const WF_LIP = [-105.3, -186];
// Bach auf der Plateau-Erweiterung: Quelle im Wald, schlaengelt sich nach Westen bis zur Fallkante
const STREAM = [[-35, -200], [-48, -196], [-60, -201], [-72, -195], [-84, -190], [-95, -188.5], WF_LIP];
function streamDist(x, z) {
  if (x < -112 || x > -28 || z < -210 || z > -178) return 1e9;
  let m = 1e9;
  for (let i = 0; i < STREAM.length - 1; i++) m = Math.min(m, segDist(x, z, [STREAM[i], STREAM[i + 1]]));
  return m;
}                                   // Felskante nördlich vom Teich (Ausgang der Hoehle folgt in Schritt 8)
const POLES = [[0, -160], [160, 0], [0, 160], [-160, 0]];
// Meer im Suedosten (Wunsch von Nicolas, statt Mideast Lake): s = Abstand Richtung Suedost, t = entlang der Kueste.
// Bucht dort, wo auf der Karte der Mideast Lake steht (Wasserweg der Hoehle, Lake Exit).
const R2 = Math.SQRT1_2;
// E3 (Nicolas, 2026-11-07, Skizze kueste-skizze-oben.webp): Kueste weniger gerade. Links (t > 0, Richtung Sued-West) eine grosse Bucht
// (t ca. 340..860, bis ca. 250 m ins Land), rechts (t < -291) biegt die Kueste in einem Bogen nach Norden ab (Meer im Osten).
// Dazu leichte Vor- und Ruecksprunge; der Abschnitt um den Wassertunnel (|t| < 90) bleibt wie bisher.
// Bucht rund (Nicolas: "zu eckig"): Halbellipse statt Hoecker, an der Einfahrt weich auslaufend, innen leicht unregelmaessig
const coastBay = t => {
  const u = (t - 600) / 270, a = Math.abs(u);
  if (a >= 1) return 0;
  return 240 * Math.sqrt(1 - u * u) * sst(1, 0.72, a) * (1 + 0.05 * Math.sin(t / 47 + 1));
};
const BEND_U = 376, BEND_D0 = 94 * (BEND_U / 181) ** 2.1, BEND_K = 2.1 * BEND_D0 / BEND_U;
const coastBend = t => {
  const u = -t - 291;
  if (u <= 0) return 0;
  if (u <= BEND_U) return 94 * (u / 181) ** 2.1;                         // Bogen (aus der Skizze abgelesen)
  return BEND_D0 + (u - BEND_U) + (BEND_K - 1) * 160 * (1 - Math.exp(-(u - BEND_U) / 160));   // laeuft dann nach Norden aus
};
const coastS = t => 200 - 45 * Math.exp(-(((t - 2) / 60) ** 2)) + 10 * Math.sin(t / 37) + 5 * Math.sin(t / 13 + 1)
  + sst(90, 220, Math.abs(t)) * (7 * Math.sin(t / 61 + 0.5) + 3 * Math.sin(t / 31 + 2.2)) - coastBay(t) - coastBend(t);
const coastSlope = t => coastS(t + 0.5) - coastS(t - 0.5);
// > 0 = im Meer; durch die Steigung der Kuestenlinie geteilt, damit der Wert auch an schraegen Stellen ungefaehr Meter sind
const seaBase = (x, z) => { const t = (z - x) * R2; return ((x + z) * R2 - coastS(t)) / Math.hypot(1, coastSlope(t)); };
// Landstuecke in der Bucht (Nicolas, 2026-11-07, Zeichnung: Bucht mit schmaler Einfahrt): links ein Arm vom Westufer entlang der Einfahrt,
// rechts eine breite Landzunge bis ca. 170 m ins Meer, schliesst bei t ca. 124 wieder an die Kueste an. Punkte als [t, s] aus der Zeichnung
// (Bildlage aus Buchtecken und S-Schild geschaetzt), inland geschlossen, dreimal geglaettet (Chaikin). Land = innen.
const LAND_TS = [
  [[793, 29], [811, 90], [800, 156], [749, 190], [544, 228], [546, 252], [648, 273], [780, 246], [974, 159], [1117, 178], [1117, 120], [870, 120], [800, -20]],
  [[493, 13], [421, 123], [410, 231], [424, 328], [360, 369], [317, 336], [297, 339], [202, 239], [124, 186], [124, 120], [300, 100], [493, -60]]
];
const LANDS = LAND_TS.map(pts => {
  let p = pts.map(([t, s]) => [(s - t) * R2, (s + t) * R2]);
  for (let k = 0; k < 3; k++) p = p.flatMap((a, i) => { const b = p[(i + 1) % p.length]; return [[a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]]; });
  const box = p.reduce((a, [x, z]) => [Math.min(a[0], x), Math.max(a[1], x), Math.min(a[2], z), Math.max(a[3], z)], [1e9, -1e9, 1e9, -1e9]);
  return { p, box };
});
function landSD(L, x, z) {                                                // Abstand zum Umriss, innen (Land) negativ
  let m = 1e9, inside = false;
  for (let i = 0, j = L.p.length - 1; i < L.p.length; j = i++) {
    const [ax, az] = L.p[j], [bx, bz] = L.p[i], dx = bx - ax, dz = bz - az, t = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
    m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t));
    if ((bz > z) !== (az > z) && x < ax + dx * (z - az) / dz) inside = !inside;
  }
  return inside ? -m : m;
}
const seaD = (x, z) => {
  let v = seaBase(x, z);
  for (const L of LANDS) if (x > L.box[0] - 80 && x < L.box[1] + 80 && z > L.box[2] - 80 && z < L.box[3] + 80) v = Math.min(v, landSD(L, x, z));
  return v;
};
// ===================== E2/B2: Wasserhoehlen und Felsnadeln an der Steilkueste =====================
const coastPt = t => { const s = coastS(t); return [(s - t) * R2, (s + t) * R2]; };
const coastN = t => { const k = coastSlope(t), l = Math.hypot(1, k), ns = 1 / l, nt = -k / l; return [(ns - nt) * R2, (ns + nt) * R2]; };   // Normale zum Meer
// [t entlang der Kueste, Breite, Hoehe ueber dem Wasser, Tiefe]; ab 6 m Breite faehrt das Boot hinein und kann wenden, die kleinen sind Nischen
const WATER_CAVES = [[-110, 9.5, 6.5, 14], [-290, 10, 7, 15], [-470, 9, 6, 13], [85, 9, 6.5, 14],
  [-55, 3.5, 3, 6], [-165, 2.6, 2.4, 5], [-215, 4.5, 3.5, 8], [-360, 3, 2.6, 6], [-415, 5, 3.8, 9], [-530, 2.8, 2.2, 5]].map(([t, w, h, d]) => {
  const [cx, cz] = coastPt(t), [nx, nz] = coastN(t);
  return { t, w, h, d, cx, cz, nx, nz, big: w >= 6 };
});
// Hoehle an (x, z)? v = Tiefe ins Land (Mund bei v ca. 0, davor bis -4), u = quer; die Hoehle wird nach hinten schmaler
function waterCaveAt(x, z, pad = 0) {
  for (const c of WATER_CAVES) {
    const dx = x - c.cx, dz = z - c.cz;
    if (Math.abs(dx) > 30 || Math.abs(dz) > 30) continue;
    const v = -(dx * c.nx + dz * c.nz), u = -dx * c.nz + dz * c.nx;
    if (v > -8 - pad && v < c.d + pad && Math.abs(u) < c.w / 2 * (1 - 0.35 * clamp01(v / c.d)) + pad) return c;
  }
  return null;
}
// Felsnadeln im Meer: [t, Abstand vor der Kueste, Radius, Hoehe ueber dem Wasser]
const SEA_STACKS = [[-140, 30, 4.5, 22], [-255, 48, 3.5, 15], [-385, 22, 5, 25], [60, 42, 3, 12], [-520, 34, 4, 18]].map(([t, off, r, h]) => {
  const [cx, cz] = coastPt(t), [nx, nz] = coastN(t); return { x: cx + nx * off, z: cz + nz * off, r, h };
});
// Strassen und Garagenrampen sind entfernt (Plan A1, 2026-11-07): Autos kommen spaeter ueber den Autoaufzug (A3) und die Serpentine (A5)
// Wassertunnel vom Ende des Lake-Exit-Kanals (Hoehlenkarte 250/1042) bis zur Meereshoehle in der Bucht (Weltkoordinaten)
const SEA_TUNNEL = [[49.8, 30.7], [70, 58], [95, 92], [112, 115], [128, 131]], SEA_TUN_W = 9;
function seaTunDist(x, z) {
  let m = 1e9;
  for (let k = 0; k < SEA_TUNNEL.length - 1; k++) {
    const [ax, az] = SEA_TUNNEL[k], [bx, bz] = SEA_TUNNEL[k + 1], dx = bx - ax, dz = bz - az, t = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
    m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return m;
}
// Becken zum Hineingehen (Wunsch von Nicolas): Pool (Karte 90..140 / 912..985) und Springbrunnen im Rondell (Karte 500/1000, r 30 px)
const POOL = (() => { const [ax, az] = mp(90, 912), [bx, bz] = mp(140, 985); return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz), floor: -1.6, water: 0.12 }; })();
const FOUNT = (() => { const [x, z] = mp(500, 1000); return { x, z, r: 30 * SC, floor: -1.0, water: 0.36, rim: 0.42 }; })();
const inPool = (x, z) => x > POOL.x0 && x < POOL.x1 && z > POOL.z0 && z < POOL.z1;
const GY = -5.5;                                                          // Boden der Tiefgarage (Nicolas 2026-11-10: 1,5 m tiefer, Decke hoeher)
const siteDist = (x, z) => Math.hypot(Math.max(SITE.x0 - x, 0, x - SITE.x1), Math.max(SITE.z0 - z, 0, z - SITE.z1));
const inLawn = (x, z) => LAWNS.some(l => Math.hypot((x - l.cx) / l.rx, (z - l.cz) / l.rz) < 1);
// Plateau (A2): Umriss von Nicolas (Skizze plateau-wasserfall.webp, grob), flach bis PL_FLAT Meter ausserhalb der Linie
// (so bleiben rund 10 m Rand um alle Bauten), dann Hang ueber PL_W Meter: oben steiler, unten flach auslaufend (im Mittel ca. 30 Grad).
const PLATEAU = [[-44, 97], [-46, 30], [-64, 22], [-77, -38], [-77, -69], [-50, -76], [-19, -69], [-2, -44], [15, -35], [18, 13], [12, 96], [-19, 101]];
// A4 (2026-11-07): Erweiterung nach Norden, gleiche Hoehe, bewaldet (Skizze plateau-wasserfall.webp). Keine Bauten, darum ohne Zusatzrand.
// Westkante (PL_CLIFF) als steile Felswand fuer den Wasserfall (A7), sonst Haenge wie beim Plateau.
const PLATEAU_N = [[-77, -70], [-78, -134], [-100, -156], [-110, -213], [-100, -241], [-72, -249], [-61, -221], [-30, -213], [-17, -204], [-30, -156], [-29, -128], [-13, -109], [-20, -83]];
const PL_CLIFF = [[-100, -156], [-110, -213]];   // Fallkante des Wasserfalls (A7) bei z -186
// A3 Autoaufzug: Schacht im Hof westlich der Tiefgarage, Halte Garage (GY + HILL) / Hangfuss (HF_Y) / Batcave (LY).
// Am Hangfuss Tunnel nach Westen bis zum Portal im Westhang (Nicolas 2026-11-09: kein Einschnitt mehr, Tunnel bis HF_XP, dann Kiesstrasse HFR zum Westtor).
const CSH = { x0: -41, x1: -33.7, z0: 36, z1: 40.5 }, CSH_OUT = { x0: -41.3, x1: -33.4, z0: 35.7, z1: 40.8 };
const HF_Y = 0.15, HF_TUN = { x0: -58.9, x1: -41, z0: 35.6, z1: 40.9 };   // x0 wird in strassen/hauptstrasse.js auf das Portal HF_XP gesetzt
// Geheimgang unten: nach Westen, dann nach Norden in die Auto Repair. D1: nach Westen auf ca. 10 x 10 m verbreitert (x0 -47,9 -> -53),
// sonst kann der Tumbler (4,8 m) in der Kurve nicht wenden
const CGA = { x0: -53, x1: -41, z0: 36, z1: 40.5 }, CGB = { x0: -53, x1: -43.2, z0: 30.5, z1: 40.5 }, CGC = { x0: -53, x1: -43.2, z0: 26, z1: 30.5 }, CGE = { x0: -34.2, x1: -31.5, z0: 35.5, z1: 46.5 };   // CGE (E5): Vorplatz vor dem Osttor zum Hoehlentunnel   // CGC: Vorplatz hinter der Felswand (Auto Repair), sonst 2,8 m Engstelle
const PL_FLAT = 8, PL_W = 42;
const PL_BOX = [...PLATEAU, ...PLATEAU_N].reduce((a, [x, z]) => [Math.min(a[0], x), Math.max(a[1], x), Math.min(a[2], z), Math.max(a[3], z)], [1e9, -1e9, 1e9, -1e9]);
function polySD(poly, x, z) {                                             // Abstand zur Umrisslinie, innen negativ
  let m = 1e9, inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[j], [bx, bz] = poly[i], dx = bx - ax, dz = bz - az, t = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
    m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t));
    if ((bz > z) !== (az > z) && x < ax + dx * (z - az) / dz) inside = !inside;
  }
  return inside ? -m : m;
}
const plateauSD = (x, z) => polySD(PLATEAU, x, z);
function segDist(x, z, [[ax, az], [bx, bz]]) { const dx = bx - ax, dz = bz - az, t = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)); return Math.hypot(x - ax - dx * t, z - az - dz * t); }
// Hoehe des Plateaus samt Hang an (x, z); 0 weit draussen. Seen schneiden den Hangfuss ab.
function plateauH(x, z) {
  const MG = PL_FLAT + PL_W * 1.6;
  if (x < PL_BOX[0] - MG || x > PL_BOX[1] + MG || z < PL_BOX[2] - MG || z > PL_BOX[3] + MG) return 0;
  const dn = polySD(PLATEAU_N, x, z), d = Math.min(plateauSD(x, z) - PL_FLAT, dn);
  if (d <= 0) return HILL;
  // an der Westkante der Erweiterung eine fast senkrechte Felswand (ca. 4 m breit), zu den Enden hin wieder normaler Hang
  const wall = dn <= d + 0.01 ? 1 - sst(6, 30, segDist(x, z, PL_CLIFF) - dn) : 0;
  // A5: im Bereich der Serpentine (Osthang, z -60..70) ist der Hang ca. 62 m breit und gleichmaessig (Platz fuer vier Kehren)
  const sz = sst(-75, -55, z) * sst(80, 62, z) * sst(5, 18, x);
  const t = d / lerp(lerp(PL_W * (0.85 + 0.3 * vnoise(x / 70 + 4, z / 70 + 8)), 4, wall), 62, sz);   // Hangbreite leicht wechselnd
  if (t >= 1) return 0;
  let f = (1 - t) ** lerp(1.5, 1.05, sz);
  f += f * (1 - f) * 0.5 * (fbm(x / 22 + 31, z / 22 + 7) - 0.5);       // Buckel und Mulden im Hang (oben und unten 0)
  for (const L of LAKES) if (!L.keepPlateau) f *= sst(1.0, 1.4, lakeD(L, x, z));
  return HILL * Math.max(0, f);
}
