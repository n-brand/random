// Batverse – Karte -> Welt, Gelaende-Grundlagen, Seen, Kueste, Wasserhoehlen, Becken, Plateau
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Karte -> Welt =====================
// Massstab 0,2 m pro Pixel (Rampe ca. 7 m breit, Haus ca. 65 x 90 m; vorher 0,4 war doppelt zu gross)
const SC = 0.2, OX = 500, OY = 995, MAP_W = 861, MAP_H = 1202;
const mp = (px, py) => [(py - OY) * SC, -(px - OX) * SC];                 // Karten-Pixel -> [x, z]

// ===================== Gelaende (Schritt 2) =====================
// Lage aus der kleinen Uebersichtskarte oben links (Massstab dort ca. 2,8-mal kleiner, Rondell bei 222/252):
// Welt x = (py - 252) * 0,56, z = -(px - 222) * 0,56.
const SITE = { x0: -100, x1: 60, z0: -90, z1: 120 };                 // Anwesen (Kartenbereich) bleibt flach (y 0)
const WATER_Y = -0.35, LIMIT_WORLD = 4300;   // G1c (Nicolas 2026-11-12): bis Gotham (vorher 700; Insel bis 3,9 km, Fernring 4,4 km)                               // WATER_Y = Seen im Inland
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
// Kuestenstreifen oestlich der Manor (Nicolas 2026-11-20, Bild mit roter Linie auf der Planungskarte: "Rote Linie = neue Kueste", "ja, auch im Spiel"):
// Land von der heutigen Kueste bis zur gezeichneten Linie (bis ca. 450 m ins Meer, z -1370 .. -4265, Ende an der Weltgrenze). Seeseite = rote Linie
// (aus dem Bild ausgelesen, geglaettet; dort, wo sie weniger als ca. 30-120 m vor der Kueste lag, weich auf die alte Kueste zurueck), Landseite 40 m hinter der alten Kueste.
// In x/z (Weltmeter), Land = innen. Planungskarte: gotham/daten.js wasser.spiel (gleich nachgezogen).
const LAND_XZ = [[161,-1372], [162,-1445], [143,-1537], [133,-1649], [153,-1737], [211,-1828], [277,-1942], [323,-2023], [351,-2081], [380,-2140], [411,-2195], [435,-2253], [473,-2310], [504,-2381], [534,-2434], [559,-2481], [576,-2560], [588,-2656], [593,-2748], [575,-2842], [553,-2927], [526,-3023], [502,-3108], [479,-3201], [471,-3277], [471,-3344], [473,-3433], [463,-3537], [441,-3622], [386,-3700], [321,-3778], [253,-3856], [229,-3952], [222,-4046], [243,-4144], [274,-4238], [283,-4265], [99,-4253], [97,-4167], [111,-4078], [115,-4001], [92,-3924], [89,-3839], [108,-3745], [110,-3659], [98,-3578], [101,-3495], [112,-3413], [100,-3329], [89,-3250], [100,-3161], [114,-3064], [109,-2980], [95,-2915], [97,-2833], [106,-2730], [101,-2650], [94,-2580], [107,-2480], [117,-2383], [98,-2324], [87,-2255], [104,-2142], [113,-2047], [100,-1985], [100,-1903], [113,-1798], [106,-1721], [93,-1657], [103,-1559], [121,-1449], [121,-1367]];
const LANDS = [...LAND_TS.map(pts => pts.map(([t, s]) => [(s - t) * R2, (s + t) * R2])), LAND_XZ].map(p0 => {
  let p = p0;
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
const seaD0 = (x, z) => {
  let v = seaBase(x, z);
  for (const L of LANDS) if (x > L.box[0] - 80 && x < L.box[1] + 80 && z > L.box[2] - 80 && z < L.box[3] + 80) v = Math.min(v, landSD(L, x, z));
  return v;
};
// ===================== Insel-Welt (PLAN-GOTHAM N54, Schritte I2/I3; Nicolas 2026-11-20 "Passt, weiter mit I2", 2026-11-23 "mach die anderen offenen Punkte") =====================
// Die ganze Welt ist eine grosse Insel (Umriss auf der Planungskarte: gotham/daten.js welt.umriss + wasser.kuesteAlt + wasser.kueste, Inselchen welt.eilande; Kartenkoordinaten,
// hier ueber die Manor-Lage in Weltmeter umgerechnet). Daraus einmal ein Abstandsfeld (50-m-Raster, Rand gefuellt per Zeilen, Abstand exakt per EDT, ca. 0,1 s):
// INSEL.d(x, z) = Abstand zur Inselkueste in m, > 0 = Meer. seaD gilt innerhalb der heutigen Welt (Kreis LIMIT_WORLD) unveraendert (seaD0), dahinter bis 400 m weich
// die Inselkueste. Damit bauen dieselben Formeln wie heute (genH0: Huegel, Berge, Steilkueste, Meeresgrund -50) das neue Festland: ohne Baeume, ohne Strassen.
const INSEL = (() => { try {
  const W = typeof GOTHAM !== "undefined" && GOTHAM.welt, WA = W && GOTHAM.wasser, L0 = GOTHAM.manorLage; if (!W || !W.umriss || !WA || !L0) return null;
  const a = L0.dreh * Math.PI / 180, ct = Math.cos(a), st = Math.sin(a), inv = ([X, Z]) => { const dx = X - L0.x, dz = Z - L0.z; return [dx * ct + dz * st, -dx * st + dz * ct]; };
  const P = [...W.umriss, ...[...WA.kuesteAlt].reverse().slice(1), ...[...WA.kueste].reverse()].map(inv), EI = (W.eilande || []).map(([x, z, r]) => [...inv([x, z]), r]);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, rmax = 0; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); rmax = Math.max(rmax, Math.hypot(x, z)); }
  const G = 50, M = 3000; x0 = Math.floor((x0 - M) / G) * G; z0 = Math.floor((z0 - M) / G) * G; const nx = Math.ceil((x1 + M - x0) / G) + 1, nz = Math.ceil((z1 + M - z0) / G) + 1, N = nx * nz;
  const land = new Uint8Array(N);
  for (let k = 0; k < nz; k++) { const z = z0 + k * G, xs = [];   // Zeile fuellen (gerade-ungerade)
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [ax, az] = P[j], [bx, bz] = P[i]; if ((az > z) !== (bz > z)) xs.push(ax + (bx - ax) * (z - az) / (bz - az)); }
    xs.sort((u, v) => u - v); for (let q = 0; q + 1 < xs.length; q += 2) { const i0 = Math.max(0, Math.ceil((xs[q] - x0) / G)), i1 = Math.min(nx - 1, Math.floor((xs[q + 1] - x0) / G)); for (let i = i0; i <= i1; i++) land[k * nx + i] = 1; }
    for (const [ex, ez, er] of EI) { const dz = z - ez; if (Math.abs(dz) >= er) continue; const w = Math.sqrt(er * er - dz * dz), i0 = Math.max(0, Math.ceil((ex - w - x0) / G)), i1 = Math.min(nx - 1, Math.floor((ex + w - x0) / G)); for (let i = i0; i <= i1; i++) land[k * nx + i] = 1; } }
  // exakter euklidischer Abstand (Felzenszwalb) zu den Zellen der anderen Art
  const edt = ziel => { const INF = 1e20, f = new Float64Array(N); for (let q = 0; q < N; q++) f[q] = land[q] === ziel ? 0 : INF;
    const n = Math.max(nx, nz), g = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), zz = new Float64Array(n + 1);
    const pass = (len, get, set) => { for (let q = 0; q < len; q++) g[q] = get(q); let kk = 0; v[0] = 0; zz[0] = -INF; zz[1] = INF;
      for (let q = 1; q < len; q++) { let sx; do { const r = v[kk]; sx = ((g[q] + q * q) - (g[r] + r * r)) / (2 * q - 2 * r); if (sx <= zz[kk]) kk--; else break; } while (kk >= 0); kk++; v[kk] = q; zz[kk] = sx; zz[kk + 1] = INF; }
      kk = 0; for (let q = 0; q < len; q++) { while (zz[kk + 1] < q) kk++; const r = v[kk]; d[q] = (q - r) * (q - r) + g[r]; } for (let q = 0; q < len; q++) set(q, d[q]); };
    for (let k = 0; k < nz; k++) pass(nx, q => f[k * nx + q], (q, val) => { f[k * nx + q] = val; });
    for (let i = 0; i < nx; i++) pass(nz, q => f[q * nx + i], (q, val) => { f[q * nx + i] = val; });
    return f; };
  const zuLand = edt(1), zuMeer = edt(0), D = new Float32Array(N);
  for (let q = 0; q < N; q++) D[q] = land[q] ? -(Math.sqrt(zuMeer[q]) * G - G / 2) : Math.sqrt(zuLand[q]) * G - G / 2;
  const d = (x, z) => { const fx = (x - x0) / G, fz = (z - z0) / G; if (fx < 0 || fz < 0 || fx >= nx - 1 || fz >= nz - 1) return 3000; const i = Math.floor(fx), k = Math.floor(fz), u = fx - i, w = fz - k, q = k * nx + i;
    return (D[q] * (1 - u) + D[q + 1] * u) * (1 - w) + (D[q + nx] * (1 - u) + D[q + nx + 1] * u) * w; };
  return { d, x0, z0, x1: x0 + (nx - 1) * G, z1: z0 + (nz - 1) * G, rmax, G };
} catch (e) { console.warn("Insel-Welt:", e); return null; } })();
const INSEL_R0 = LIMIT_WORLD, INSEL_RB = 400;   // innerhalb heutige Kueste, dann 400 m Uebergang zur Inselkueste
const seaD = (x, z) => { if (!INSEL) return seaD0(x, z); const r2 = x * x + z * z; if (r2 < INSEL_R0 * INSEL_R0) return seaD0(x, z);
  const w = sst(INSEL_R0, INSEL_R0 + INSEL_RB, Math.sqrt(r2)), di = INSEL.d(x, z); return w >= 1 ? di : lerp(seaD0(x, z), di, w); };
// Neues Festland (ausserhalb der heutigen Welt): Berge nur in einzelnen Gebirgszuegen (sonst wuerde die Bergformel des Horizonts die ganze Insel zu einem
// Felsplateau von 150-200 m machen), dazwischen gruene Huegel; Kueste abwechselnd Steilufer (wie heute) und flacher Sandstrand (inselStrand, genH0).
const inselBerg = (x, z) => { const r = Math.hypot(x, z); return r < INSEL_R0 ? 1 : lerp(1, sst(0.5, 0.72, fbm(x / 2000 + 5, z / 2000 + 8)), sst(INSEL_R0, INSEL_R0 + 900, Math.hypot(x, z))); };
const inselStrand = (x, z) => { const r2 = x * x + z * z; if (r2 < INSEL_R0 * INSEL_R0) return 0; return sst(INSEL_R0, INSEL_R0 + INSEL_RB, Math.sqrt(r2)) * sst(0.46, 0.6, fbm(x / 2200 + 31, z / 2200 + 17)); };
// Laufen, Fahren, Fliegen bis hinter die Inselkueste (vorher Kreis LIMIT_WORLD)
const WELT_R = INSEL ? Math.ceil(INSEL.rmax + 1500) : LIMIT_WORLD;
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
// Im Tunnel = im Rechteck UND unter der Tunneldecke (Oberkante HF_Y + 5,2). Nicolas 2026-11-11: vorher galt alles unter HILL - 1 als Tunnel;
// am Westweg liegt der Hang ueber dem Tunnel aber nur 6-12 m hoch -> man fiel oben durch das Gelaende in den Tunnel
const inHfTun = (x, z, y) => y < HF_Y + 5.3 && inRect(HF_TUN, x, z);
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
