// Wayne Manor 3D – Gotham: Gelaende und Wasser (Plan G1, Schritt G1a, Nicolas 2026-11-12 "mit G1 starten")
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Braucht GOTHAM aus ../gotham/daten.js (dieselben Daten wie die Planungskarte) und wird von genH0 (strassen/hauptstrasse.js) benutzt.
"use strict";

// Insel und Wasser werden genau wie in der Karte (gotham/index.html) berechnet: Inselumriss weich (Catmull-Rom), Fluesse als Band in ihrer Breite
// je Uferstueck, Meer im Sueden, alles in ein 8-m-Raster gezeichnet und weichgezeichnet (Festland-Ufer rund), Wasser bei 50 %.
// Daraus zwei Abstandsfelder (Karten-Meter, Chamfer-Abstand): DI = Abstand zum Inselrand (innen negativ), DW = Abstand zum Wasserrand
// (Wasser samt Insel innen negativ, Festland positiv).
// Hoehen (Welt-y, daten.js hoehen): Insel flach auf Strassenebene (-16); Wasser bei SEA_Y (-34); Flussgrund am Ufer ein 6 m breiter Kiesstreifen knapp
// ueber dem Wasser, dann weich tiefer bis -46 (12 m Wasser); Festland gegenueber steigt natuerlich an (ca. 18 Grad, etwas uneben) und geht in die
// bestehenden Berge ueber, die nur dort weichen (Nicolas 2026-11-12: "Nur Gotham-Flaeche", "Natuerlich abfallend").
// Lage: Karte -> Spiel ueber manorLage (Spiel = Drehung um -dreh von (Karte - Lage)); die Manor bleibt bei 0 / 0. Um die Manor (unter 1000 m) bleibt
// alles wie bisher, zwischen 1000 und 1300 m wird uebergeblendet.
const GOT = (() => {
  const G = GOTHAM, L = G.manorLage, t = L.dreh * Math.PI / 180, ct = Math.cos(t), st = Math.sin(t), WA = G.wasser;
  const toMap = (x, z) => [x * ct - z * st + L.x, x * st + z * ct + L.z];
  const toGame = (mx, mz) => { const dx = mx - L.x, dz = mz - L.z; return [dx * ct + dz * st, -dx * st + dz * ct]; };
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  // weiche Linie wie in der Karte (Catmull-Rom, ca. alle step m)
  function smoothL(P, step = 8, closed = false) {
    if (closed) P = [...P, P[0]];
    const n = P.length, Q = k => closed ? P[((k % (n - 1)) + (n - 1)) % (n - 1)] : P[cl(k, 0, n - 1)], out = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = Q(i - 1), p1 = P[i], p2 = P[i + 1], p3 = Q(i + 2), m = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
      for (let s = 0; s < m; s++) { const u = s / m, u2 = u * u, u3 = u2 * u;
        out.push([0, 1].map(c => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * u + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * u3))); }
    }
    out.push(P[n - 1]); return out;
  }
  const insel = smoothL(G.insel.umriss, 20, true); insel.pop();
  const meer = [...smoothL(WA.kueste, 20), ...WA.kuesteAlt, [1700, 2600], [-5200, 2600]];
  const IX = insel.map(p => p[0]), IZ = insel.map(p => p[1]), ICX = (Math.min(...IX) + Math.max(...IX)) / 2, ICZ = (Math.min(...IZ) + Math.max(...IZ)) / 2;
  const NI = insel.length, flussW = insel.map((p, i) => { const a = insel[(i + NI - 1) % NI], b = insel[(i + 1) % NI]; let nx = b[1] - a[1], nz = -(b[0] - a[0]); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
    if (nx * (p[0] - ICX) + nz * (p[1] - ICZ) < 0) { nx = -nx; nz = -nz; }
    return nx * nx * (nx > 0 ? WA.ost.breite : WA.west.breite) + nz * nz * (nz < 0 ? WA.nord.breite : WA.sued.breite); });
  for (let it = 0; it < 3; it++) { const w = flussW.slice(); flussW.forEach((_, i) => flussW[i] = (w[(i + NI - 1) % NI] + 2 * w[i] + w[(i + 1) % NI]) / 4); }
  // Raster (Karten-Koordinaten) ueber Insel, Fluesse und einen Rand fuer das ansteigende Festland
  const C = 8, X0 = Math.floor(Math.min(...IX) / 100) * 100 - 1100, Z0 = Math.floor(Math.min(...IZ) / 100) * 100 - 1100;
  const NX = Math.ceil((Math.max(...IX) + 1100 - X0) / C), NZ = Math.ceil((Math.max(...IZ) + 1100 - Z0) / C), N = NX * NZ;
  const draw = fn => { const cv = document.createElement("canvas"); cv.width = NX; cv.height = NZ; const c = cv.getContext("2d");
    c.setTransform(1 / C, 0, 0, 1 / C, -X0 / C, -Z0 / C); c.fillStyle = c.strokeStyle = "#000"; c.lineCap = "round"; fn(c);
    const px = c.getImageData(0, 0, NX, NZ).data, f = new Float32Array(N); for (let k = 0; k < N; k++) f[k] = px[k * 4 + 3] / 255; return f; };
  const poly = (c, P) => { c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); };
  const isl = draw(c => poly(c, insel));
  const wat = draw(c => { poly(c, meer); poly(c, insel); for (let i = 0; i < NI; i++) { const a = insel[i], b = insel[(i + 1) % NI]; c.lineWidth = 2 * flussW[i]; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); } });
  { const r = Math.max(1, Math.round((WA.rundung || 60) / C / 1.7)), tmp = new Float32Array(N);   // dreifacher Kastenfilter wie in der Karte
    const box = (src, dst, n, m, sa, sb) => { for (let b = 0; b < m; b++) { let s = 0; const at = a => src[cl(a, 0, n - 1) * sa + b * sb];
      for (let a = -r; a <= r; a++) s += at(a); for (let a = 0; a < n; a++) { dst[a * sa + b * sb] = s / (2 * r + 1); s += at(a + r + 1) - at(a - r); } } };
    for (let it = 0; it < 3; it++) { box(wat, tmp, NX, NZ, 1, NX); box(tmp, wat, NZ, NX, NX, 1); } }
  // vorzeichenbehafteter Abstand (Chamfer 1 / Wurzel 2, zwei Durchgaenge), in Metern
  function sdf(inside) {
    const INF = 1e9, a = new Float32Array(N), b = new Float32Array(N), D = Math.SQRT2;
    const pass = (d) => {
      for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) { const q = k * NX + i; let v = d[q]; if (!v) continue;
        if (i > 0) v = Math.min(v, d[q - 1] + 1); if (k > 0) { v = Math.min(v, d[q - NX] + 1); if (i > 0) v = Math.min(v, d[q - NX - 1] + D); if (i < NX - 1) v = Math.min(v, d[q - NX + 1] + D); } d[q] = v; }
      for (let k = NZ - 1; k >= 0; k--) for (let i = NX - 1; i >= 0; i--) { const q = k * NX + i; let v = d[q]; if (!v) continue;
        if (i < NX - 1) v = Math.min(v, d[q + 1] + 1); if (k < NZ - 1) { v = Math.min(v, d[q + NX] + 1); if (i < NX - 1) v = Math.min(v, d[q + NX + 1] + D); if (i > 0) v = Math.min(v, d[q + NX - 1] + D); } d[q] = v; }
    };
    for (let q = 0; q < N; q++) { const inn = inside(q); a[q] = inn ? 0 : INF; b[q] = inn ? INF : 0; }
    pass(a); pass(b);
    const s = new Float32Array(N); for (let q = 0; q < N; q++) s[q] = (a[q] > 0 ? a[q] - 0.5 : 0.5 - b[q]) * C; return s;
  }
  const DI = sdf(q => isl[q] >= 0.5), DW = sdf(q => wat[q] >= 0.5 || isl[q] >= 0.5);
  const samp = (F, mx, mz) => { const fx = (mx - X0) / C - 0.5, fz = (mz - Z0) / C - 0.5, i = cl(Math.floor(fx), 0, NX - 2), k = cl(Math.floor(fz), 0, NZ - 2), u = cl(fx - i, 0, 1), v = cl(fz - k, 0, 1), q = k * NX + i;
    return (F[q] * (1 - u) + F[q + 1] * u) * (1 - v) + (F[q + NX] * (1 - u) + F[q + NX + 1] * u) * v; };
  const inField = (mx, mz) => mx > X0 + C && mz > Z0 + C && mx < X0 + (NX - 2) * C && mz < Z0 + (NZ - 2) * C;
  const STR = G.hoehen.strasse, WY = G.hoehen.wasser;
  return {
    STR, WY, BED: WY - 12, toMap, toGame, insel, inField,
    // Gewicht der Gotham-Ebene: um die Manor nichts aendern
    w: (x, z) => { const r = Math.hypot(x, z); return r < 1000 ? 0 : r > 1300 ? 1 : (r - 1000) / 300; },
    sdi: (mx, mz) => samp(DI, mx, mz), sdw: (mx, mz) => samp(DW, mx, mz),
    di: (x, z) => { const [mx, mz] = toMap(x, z); return inField(mx, mz) ? samp(DI, mx, mz) : 1e4; },
    dw: (x, z) => { const [mx, mz] = toMap(x, z); return inField(mx, mz) ? samp(DW, mx, mz) : 1e4; },
    water: (x, z) => { const [mx, mz] = toMap(x, z); return inField(mx, mz) && samp(DW, mx, mz) < 0 && samp(DI, mx, mz) > 0; },
    bbox: (() => { const P = [[X0, Z0], [X0 + NX * C, Z0], [X0, Z0 + NZ * C], [X0 + NX * C, Z0 + NZ * C]].map(([a, b]) => toGame(a, b)); const xs = P.map(p => p[0]), zs = P.map(p => p[1]);
      return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; })(),
  };
})();
// G1d: genaue Uferlinie der Insel im Spiel (Punkte alle ca. 20 m, Umlauf wie in der Karte) und Abstand dazu (innen negativ). Das Abstandsfeld DI ist
// nur auf ca. 6 m genau (8-m-Raster); am Ufer zaehlt diese Linie: dort steht die Kaimauer (gotham/gotham-kai.js).
{
  const P = GOT.insel.map(([mx, mz]) => GOT.toGame(mx, mz)), n = P.length;
  let A = 0; for (let i = 0; i < n; i++) { const [x0, z0] = P[i], [x1, z1] = P[(i + 1) % n]; A += x0 * z1 - x1 * z0; }
  const sg = A > 0 ? 1 : -1, C = 40, B = new Map(), key = (i, k) => i * 100000 + k;
  // Normale nach innen je Strecke: (-dz, dx) * sg zeigt bei Umlauf mit A > 0 nach innen
  const segs = P.map((a, i) => { const b = P[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return { a, b, dx, dz, l, nx: -dz / l * sg, nz: dx / l * sg }; });
  segs.forEach((g, i) => { const x0 = Math.min(g.a[0], g.b[0]), x1 = Math.max(g.a[0], g.b[0]), z0 = Math.min(g.a[1], g.b[1]), z1 = Math.max(g.a[1], g.b[1]);
    for (let ci = Math.floor(x0 / C); ci <= Math.floor(x1 / C); ci++) for (let ck = Math.floor(z0 / C); ck <= Math.floor(z1 / C); ck++) { const k = key(ci, ck); if (!B.has(k)) B.set(k, []); B.get(k).push(i); } });
  GOT.edgePts = P; GOT.edgeIn = P.map((_, i) => { const g0 = segs[(i + n - 1) % n], g1 = segs[i], x = g0.nx + g1.nx, z = g0.nz + g1.nz, l = Math.hypot(x, z) || 1; return [x / l, z / l]; });
  // Abstand zur Linie, Vorzeichen ueber die Innennormale der naechsten Strecke (an Ecken gemittelt); weiter als ca. 40 m: Abstandsfeld DI
  GOT.edgeSD = (x, z) => {
    const ci = Math.floor(x / C), ck = Math.floor(z / C); let best = 1e9, bs = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = B.get(key(ci + a, ck + b)); if (!L) continue;
      for (const i of L) { const g = segs[i], t = Math.max(0, Math.min(1, ((x - g.a[0]) * g.dx + (z - g.a[1]) * g.dz) / (g.l * g.l))), qx = g.a[0] + g.dx * t, qz = g.a[1] + g.dz * t, d = Math.hypot(x - qx, z - qz);
        if (d < best - 1e-6) { best = d; let nx = g.nx, nz = g.nz; if (t <= 0 || t >= 1) { const v = GOT.edgeIn[t <= 0 ? i : (i + 1) % n]; nx = v[0]; nz = v[1]; } bs = (x - qx) * nx + (z - qz) * nz > 0 ? -1 : 1; } } }
    return best < 1e9 ? best * bs : GOT.di(x, z);
  };
}
// G2c (Nicolas 2026-11-12: "im Nordosten gehen die Bruecken in die Berge rein"): hinter dem anderen Ufer je Bruecke ein Anschluss im Festland,
// 40 m flach auf Fahrbahnhoehe, dann 6 % Steigung (bis 420 m): hoeheres Gelaende wird eingeschnitten (Boeschung 1:1), tieferes Land bis 120 m hinter
// dem Ufer zu einem Damm aufgeschuettet (Boeschung ca. 1:1,4; nur auf Land, nicht im Wasser). Die Strassen darauf kommen mit G2d.
GOT.cuts = GOTHAM_STADT.bruecken.map(b => { const P = b.pts.map(([x, z]) => GOT.toGame(x, z)), a = P[0], e = P[P.length - 1], L = Math.hypot(e[0] - a[0], e[1] - a[1]);
  const ux = (e[0] - a[0]) / L, uz = (e[1] - a[1]) / L; return { a, ux, uz, s0: L - 25, inner: b.w / 2 + 6.5 }; });
function gothamCut(x, z, g, land) {
  for (const c of GOT.cuts) { const dx = x - c.a[0], dz = z - c.a[1], s = dx * c.ux + dz * c.uz; if (s < c.s0 - 10 || s > c.s0 + 420) continue;
    const lat = Math.abs(dz * c.ux - dx * c.uz); if (lat > c.inner + 140) continue;
    const hc = GOT.STR + Math.max(0, s - c.s0 - 40) * 0.06, out = Math.max(0, lat - c.inner);
    g = Math.min(g, hc + out);
    if (land && s > c.s0 - 5 && s < c.s0 + 120) g = Math.max(g, hc - out * 0.7); }
  return g;
}
// Hoehe mit Gotham (h = bisherige Hoehe aus genH0). Insel flach, Fluesse mit Kiesrand und Grund, Festland weich ansteigend bis zu den Bergen.
function gothamH(x, z, h) {
  const w = GOT.w(x, z); if (w <= 0) return h;
  const [mx, mz] = GOT.toMap(x, z); if (!GOT.inField(mx, mz)) return h;
  let sd = GOT.sdi(mx, mz), g; if (Math.abs(sd) < 24) sd = GOT.edgeSD(x, z);   // am Ufer genau (G1d)
  if (sd < -6) g = GOT.STR;                                                    // Insel: Strassenebene; die letzten 6 m vor dem Ufer liegen unter der Kai-Platte (G1d)
  else { const dw = GOT.sdw(mx, mz);
    if (dw < 0 || sd < 0) { const ds = Math.min(Math.max(sd, 0), -dw); g = GOT.WY + 0.4 - (GOT.WY + 0.4 - GOT.BED) * sst(6, 80, ds); }   // Fluss: Kiesstreifen am Mauerfuss, dann bis 12 m tief
    else g = Math.min(h, GOT.WY + 0.6 + dw * 0.32 + 5 * (vnoise(x / 70 + 41, z / 70 + 17) - 0.5) * sst(0, 80, dw)); }   // Festland: natuerlich ansteigend, Berge dahinter bleiben
  const res = h + (g - h) * w;
  // Brueckenanschluss (G2c) auch im Uebergang zur Manor voll, erst unter 1000 m bleibt alles wie bisher
  const wc = Math.min(1, (Math.hypot(x, z) - 1000) / 60); if (wc <= 0) return res;
  const land = sd >= 0 && GOT.sdw(mx, mz) > 4;
  return res + (gothamCut(x, z, res, land) - res) * wc;
}
// G1b: Gotham-Bereich fuer das eigene 4-m-Raster (gotham-raster.js). Rechteck mit Kanten auf dem 40-m-Raster des Fernrings und 15 x 256 m gross,
// deckt Insel, Fluesse und Ufer ab; dazu mehr als GOT_R0 von der Manor (naeher bleibt das Hauptraster).
const GOT_R = { x0: -4240, x1: -400, z0: -1040, z1: 2800 }, GOT_R0 = 1050;
const inGothamR = (x, z) => x >= GOT_R.x0 && x <= GOT_R.x1 && z >= GOT_R.z0 && z <= GOT_R.z1;
const inGothamG = (x, z) => inGothamR(x, z) && x * x + z * z > GOT_R0 * GOT_R0;
