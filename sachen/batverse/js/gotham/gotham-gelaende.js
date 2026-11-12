// Batverse – Gotham: Gelaende und Wasser (Plan G1, Schritt G1a, Nicolas 2026-11-12 "mit G1 starten")
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Braucht GOTHAM aus ../gotham/daten.js (dieselben Daten wie die Planungskarte) und wird von genH0 (strassen/hauptstrasse.js) benutzt.
"use strict";

// Insel und Wasser werden genau wie in der Karte (gotham/index.html) berechnet: Inselumriss weich (Catmull-Rom), Fluesse als Band in ihrer Breite
// je Uferstueck, Meer im Sueden, alles in ein 8-m-Raster gezeichnet und weichgezeichnet (Festland-Ufer rund), Wasser bei 50 %.
// Daraus zwei Abstandsfelder (Karten-Meter, Chamfer-Abstand): DI = Abstand zum Inselrand (innen negativ), DW = Abstand zum Wasserrand
// (Wasser samt Insel innen negativ, Festland positiv).
// Hoehen (Welt-y, daten.js hoehen): Insel flach auf Strassenebene (-12, Nicolas 2026-11-12: 4 m angehoben, vorher -16); Wasser bei SEA_Y (-34); Flussgrund am Ufer ein 6 m breiter Kiesstreifen knapp
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
    // Wo Gotham Land vorsieht, das Gelaende aber Meer der Manor ist (ihre Kuestenlinie gedacht nach Westen verlaengert), flache Ebene knapp ueber dem Wasser
    else g = Math.min(h < GOT.WY + 1 ? GOT.WY + 3 + Math.min(20, dw * 0.08) : h, GOT.WY + 0.6 + dw * 0.32 + 5 * (vnoise(x / 70 + 41, z / 70 + 17) - 0.5) * sst(0, 80, dw)); }   // Festland: natuerlich ansteigend, Berge dahinter bleiben
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

// G2d: Strassen auf dem Festland (Nicolas 2026-11-12 "dann direkt Festland"): Highway, Highway-Zubringer, Strasse zur Manor, Zufahrten Westen/Sueden
// aus der Karte (GOTHAM_STADT.haupt), nur die Stuecke an Land (nicht auf der Insel, nicht im Wasser, innerhalb der Weltgrenze), alle 4 m.
// Hoehe: Gelaende ohne Strassen entlang der Linie, +-40 m gemittelt, mindestens 4 m ueber dem Wasser, an Brueckenenden genau die Fahrbahn,
// hoechstens 7 % Steigung (Durchgaenge vor und zurueck). Das Gelaende folgt (Fahrbahn plus 2 m Bankett eben, dann Einschnitt 1:1 bzw. Damm 1:1,4).
// Boden auf der Fahrbahn: gothamRoadAt (wie bei den Bruecken). Aufbau beim ersten Aufruf von genH0 (GLAND.building verhindert die Rueckkopplung).
const GLAND = { roads: null, building: false, grid: null, C: 25, ids: ["highway", "highway-bruecke", "manor-strasse", "nord-zufahrt", "west-nord", "west-sued"] };
const glKey = (i, k) => i * 100000 + k;
// Hoehe der Manor-Hauptstrasse an ihrem Suedwest-Ende, gerechnet wie MAIN.ys (zweimal +-35 Proben gemittelt) aus dem Gelaende ohne Festlandstrassen
function glMainY0() { if (GLAND.mainY0 === undefined) { const raw = MAIN.samples.slice(0, 71).map(([x, z]) => genH0(x, z)), m = a => a.map((_, i) => { let t = 0, c = 0; for (let k = Math.max(0, i - 35); k <= Math.min(a.length - 1, i + 35); k++) { t += a[k]; c++; } return t / c; }); GLAND.mainY0 = m(m(raw))[0]; } return GLAND.mainY0; }
function glandBuild() {
  GLAND.building = true; const roads = [];
  const ends = GOT.cuts.map(c => [c.a[0] + c.ux * (c.s0 + 25), c.a[1] + c.uz * (c.s0 + 25), c]);
  for (const h of GOTHAM_STADT.haupt) { if (!GLAND.ids.includes(h.id)) continue;
    const P0 = h.pts.map(([x, z]) => GOT.toGame(x, z)), P = [P0[0]];
    for (let i = 1; i < P0.length; i++) { const a = P0[i - 1], b = P0[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / 4)); for (let k = 1; k <= n; k++) P.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    let run = [];
    const push = () => { if (run.length > 6) roads.push({ id: h.id, name: h.name, w: h.w, pts: run }); run = []; };
    for (const p of P) { const ok = GOT.edgeSD(p[0], p[1]) > 2 && !GOT.water(p[0], p[1]) && Math.hypot(p[0], p[1]) < LIMIT_WORLD - 60; if (ok) run.push(p); else push(); } push(); }
  for (const r of roads) { const n = r.pts.length, raw = r.pts.map(([x, z]) => genH0(x, z)), y = new Float32Array(n), pin = new Array(n).fill(null);
    for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let k = Math.max(0, i - 10); k <= Math.min(n - 1, i + 10); k++) { s += raw[k]; c++; } y[i] = Math.max(GOT.WY + 4, s / c); }
    for (let i = 0; i < n; i++) for (const [ex, ez] of ends) if (Math.hypot(r.pts[i][0] - ex, r.pts[i][1] - ez) < 45) pin[i] = GOT.STR;
    // Anschluss an die Hauptstrasse der Manor (ihr Suedwest-Ende -61/200): dort genau deren Hoehe (gleiche Rechnung wie MAIN.ys, ohne Rueckkopplung)
    for (let i = 0; i < n; i++) if (Math.hypot(r.pts[i][0] - MAIN.samples[0][0], r.pts[i][1] - MAIN.samples[0][1]) < 6) pin[i] = glMainY0() + 0.1;
    // Enden auf einer schon berechneten Festlandstrasse (Einmuendung): dort deren Hoehe
    for (const i of [0, n - 1]) { const [px, pz] = r.pts[i]; for (const o of roads) { if (!o.y) continue; for (let j = 1; j < o.pts.length; j++) { const p0 = o.pts[j - 1], q = o.pts[j], dx = q[0] - p0[0], dz = q[1] - p0[1], LL = dx * dx + dz * dz, t = LL ? Math.max(0, Math.min(1, ((px - p0[0]) * dx + (pz - p0[1]) * dz) / LL)) : 0; if (Math.hypot(px - p0[0] - dx * t, pz - p0[1] - dz * t) < o.w / 2 + 3) { pin[i] = o.y[j - 1] + (o.y[j] - o.y[j - 1]) * t; break; } } } }
    for (let i = 0; i < n; i++) if (pin[i] !== null) y[i] = pin[i];
    // feste Punkte (Brueckenenden) bleiben, die Steigungsgrenze arbeitet sich von ihnen aus nach vorne und hinten
    const G = r.pts.map((p, i) => i ? 0.07 * Math.hypot(p[0] - r.pts[i - 1][0], p[1] - r.pts[i - 1][1]) : 0);   // 7 % je echtem Abstand (Proben bis 4 m)
    for (let it = 0; it < 4; it++) { for (let i = 1; i < n; i++) if (pin[i] === null) y[i] = Math.min(y[i - 1] + G[i], Math.max(y[i - 1] - G[i], y[i])); for (let i = n - 2; i >= 0; i--) if (pin[i] === null) y[i] = Math.min(y[i + 1] + G[i + 1], Math.max(y[i + 1] - G[i + 1], y[i])); }
    r.y = y; }
  const grid = new Map(), C = GLAND.C;
  roads.forEach((r, ri) => { for (let j = 1; j < r.pts.length; j++) { const a = r.pts[j - 1], b = r.pts[j]; for (const k of new Set([glKey(Math.floor(a[0] / C), Math.floor(a[1] / C)), glKey(Math.floor(b[0] / C), Math.floor(b[1] / C))])) { if (!grid.has(k)) grid.set(k, []); grid.get(k).push([ri, j]); } } });
  // grobe Vorpruefung: 100-m-Zellen, in deren Naehe (+1 Zelle) eine Festlandstrasse liegt
  const near = new Set(); for (const r of roads) for (const [x, z] of r.pts) { const i = Math.floor(x / 100), k = Math.floor(z / 100); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) near.add(glKey(i + a, k + b)); }
  GLAND.roads = roads; GLAND.grid = grid; GLAND.near = near; GLAND.building = false;
}
// naechste Festlandstrasse: { r, d (seitlicher Abstand), y (Fahrbahnhoehe dort) } innerhalb von reach, sonst null
function glandNear(x, z, reach) {
  if (GLAND.building) return null; if (!GLAND.roads) glandBuild();
  if (!GLAND.near.has(glKey(Math.floor(x / 100), Math.floor(z / 100)))) return null;
  const C = GLAND.C, ci = Math.floor(x / C), ck = Math.floor(z / C), m = Math.ceil(reach / C); let best = null;
  for (let a = -m; a <= m; a++) for (let b = -m; b <= m; b++) { const L = GLAND.grid.get(glKey(ci + a, ck + b)); if (!L) continue;
    for (const [ri, j] of L) { const r = GLAND.roads[ri], p = r.pts[j - 1], q = r.pts[j], dx = q[0] - p[0], dz = q[1] - p[1], LL = dx * dx + dz * dz, t = LL ? Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / LL)) : 0;
      const d = Math.hypot(x - p[0] - dx * t, z - p[1] - dz * t); if (d < reach && (!best || d - r.w / 2 < best.d - best.r.w / 2)) best = { r, d, y: r.y[j - 1] + (r.y[j] - r.y[j - 1]) * t }; } }
  return best;
}
function gothamLandRoadH(x, z, g) {
  if (x > 0 && z < -600) return g;                                       // Festlandstrassen liegen alle westlich/suedlich der Manor
  const n = glandNear(x, z, 60); if (!n) return g;
  const core = n.r.w / 2 + 2, out = Math.max(0, n.d - core), yy = n.y - 0.1;
  if (out === 0) return yy;
  return g > yy ? Math.min(g, yy + out) : Math.max(g, yy - out * 0.7);
}
// Boden auf einer Festlandstrasse (Fahrbahn plus Bankett), nur wer oben ist
function gothamRoadAt(x, z, feet) {
  if (!GLAND.roads || (x > 0 && z < -600)) return null;
  const n = glandNear(x, z, 12); if (!n || n.d > n.r.w / 2 + 1.5 || feet < n.y - 3) return null;
  return n.y - 0.05;
}

// G2e: zweistoeckige Strassen (Nicolas 2026-11-12 "Ja, G2e"; Plan: Park Row und Uferstrasse Nord, oben normaler Verkehr, 5,5 m darunter die untere
// Strasse (Lower Level) auf Hoehe der Tiefgarage 1). Gleiche Linien wie gotham-strassen.js (4-m-Proben, nur auf der Insel). Unten: Boden GDECK.LY
// (-17,5), Fahrbahnplatte 1 m (Unterkante -13, 4,5 m licht), Innenbreite wie oben Fahrbahn plus Gehsteige (HW = w/2 + 4). Einfahrt an jedem Ende
// als Rampe in der Strassenmitte (RW 7 m, RL 80 m bei ca. 6,9 %, die letzten 12 m flach), die obere Fahrbahn laeuft beidseits daran vorbei; ein Ende
// an einer Bruecke oder nahe am Kai bleibt zu (Wand 30 m vor dem Ende). Gelaende darunter ausgeschnitten (bis HW + 6, damit das 4-m-Raster nicht
// in den Raum ragt), obendrauf deckt eine Platte bis HW + 12 den Ausschnitt ab (gotham-unterstrasse.js). Boden: gothamDeckAt (oben wer oben ist).
const GDECK = { roads: null, building: false, C: 25, grid: null, RW: 7, RL: 80, FL: 12, CL: 30, TL: 50, LY: GOT.STR - 5.5, DY: GOT.STR - 1, COVER: 12 };
function gdeckBuild() {
  GDECK.building = true; const roads = [];
  const brEnds = GOTHAM_STADT.bruecken.flatMap(b => [b.pts[0], b.pts[b.pts.length - 1]].map(([x, z]) => GOT.toGame(x, z)));
  for (const h of GOTHAM_STADT.haupt) { if (!h.zweistock) continue;
    const P0 = h.pts.map(([x, z]) => GOT.toGame(x, z)), P = [P0[0]];
    for (let i = 1; i < P0.length; i++) { const a = P0[i - 1], b = P0[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / 4)); for (let k = 1; k <= n; k++) P.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    let run = [];
    const push = () => { if (run.length > 2) { const s = [0]; for (let i = 1; i < run.length; i++) s.push(s[i - 1] + Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]));
      const L = s[s.length - 1], closed = e => GOT.edgeSD(e[0], e[1]) > -40 || brEnds.some(b => Math.hypot(b[0] - e[0], b[1] - e[1]) < 60);
      const ca = closed(run[0]), cb = closed(run[run.length - 1]), sA = ca ? GDECK.CL : GDECK.FL + GDECK.RL, sB = L - (cb ? GDECK.CL : GDECK.FL + GDECK.RL);
      if (h.ring) { roads.push({ id: h.id, w: h.w, HW: h.w / 2 + 4, pts: run, s, L, ca: true, cb: true, sA: 0, sB: L, loop: true }); run = []; return; }   // Ring (Wayne Circle): rundum unten, ohne Enden
      if (sB - sA > 40) roads.push({ id: h.id, w: h.w, HW: h.w / 2 + 4, pts: run, s, L, ca, cb, sA, sB }); } run = []; };
    for (const p of P) { if (GOT.edgeSD(p[0], p[1]) < -1) run.push(p); else push(); } push(); }
  // Muendung (Nicolas 2026-11-12: Wayne Circle unten, Park Row endet am Ring): liegt ein Ende im Innenraum einer anderen zweistoeckigen Strasse,
  // geht die untere Strasse dort ohne Rampe und ohne Wand bis ans Ende weiter (die Waende beider Strassen fallen dort weg, gotham-unterstrasse.js)
  const segD = (p, o) => { let m = 1e9; for (let j = 1; j < o.pts.length; j++) { const a = o.pts[j - 1], b = o.pts[j], dx = b[0] - a[0], dz = b[1] - a[1], LL = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / LL)); m = Math.min(m, Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)); } return m; };
  for (const r of roads) { if (r.loop) continue; for (const end of [0, 1]) { const e = end ? r.pts[r.pts.length - 1] : r.pts[0];
    if (roads.some(o => o !== r && segD(e, o) < o.HW)) { if (end) { r.cb = true; r.joinB = true; r.sB = r.L; } else { r.ca = true; r.joinA = true; r.sA = 0; } } } }
  const grid = new Map(), C = GDECK.C;
  roads.forEach((r, ri) => { for (let j = 1; j < r.pts.length; j++) { const a = r.pts[j - 1], b = r.pts[j]; for (const k of new Set([glKey(Math.floor(a[0] / C), Math.floor(a[1] / C)), glKey(Math.floor(b[0] / C), Math.floor(b[1] / C))])) { if (!grid.has(k)) grid.set(k, []); grid.get(k).push([ri, j]); } } });
  GDECK.roads = roads; GDECK.grid = grid; GDECK.building = false;
}
// naechste zweistoeckige Strasse: { r, d (seitlich, Betrag), s (laengs, vor dem Anfang negativ, hinter dem Ende > L) } innerhalb von reach, sonst null
function gdeckNear(x, z, reach) {
  if (GDECK.building) return null; if (!GDECK.roads) gdeckBuild();
  const C = GDECK.C, ci = Math.floor(x / C), ck = Math.floor(z / C), m = Math.ceil(reach / C); let best = null;
  for (let a = -m; a <= m; a++) for (let b = -m; b <= m; b++) { const L = GDECK.grid.get(glKey(ci + a, ck + b)); if (!L) continue;
    for (const [ri, j] of L) { const r = GDECK.roads[ri], p = r.pts[j - 1], q = r.pts[j], dx = q[0] - p[0], dz = q[1] - p[1], LL = dx * dx + dz * dz, l = Math.sqrt(LL) || 1, t0 = LL ? ((x - p[0]) * dx + (z - p[1]) * dz) / LL : 0, t = Math.max(0, Math.min(1, t0));
      const d = Math.hypot(x - p[0] - dx * t, z - p[1] - dz * t); if (d >= reach || (best && d >= best.dd)) continue;
      const out = (j === 1 && t0 < 0) || (j === r.pts.length - 1 && t0 > 1);
      best = { r, dd: d, d: out ? Math.abs((x - p[0]) * dz - (z - p[1]) * dx) / l : d, s: r.s[j - 1] + (out ? t0 : t) * l }; } }
  return best;
}
// wie gdeckNear, aber nur fuer die Strasse o (Projektion auf ihre Linie)
function gdeckNearOn(o, x, z) { let best = null; for (let j = 1; j < o.pts.length; j++) { const a = o.pts[j - 1], b = o.pts[j], dx = b[0] - a[0], dz = b[1] - a[1], LL = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / LL)), d = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
  if (!best || d < best.d) best = { d, s: o.s[j - 1] + t * Math.sqrt(LL) }; } return best && best.d < o.HW + 2 ? best : null; }
// Rampenboden (an offenen Enden), sonst LY bzw. Strassenhoehe
function gdeckRampY(r, s) { const G = GDECK, u = Math.min(r.ca ? 1e9 : s, r.cb ? 1e9 : r.L - s); return u <= G.FL ? GOT.STR : u >= G.FL + G.RL ? G.LY : GOT.STR + (G.LY - GOT.STR) * (u - G.FL) / G.RL; }
// Trichter (Nicolas 2026-11-12, Bild: unten muessen die Spuren zur Rampe zusammenlaufen): an offenen Enden wird die untere Strasse auf den letzten
// TL 50 m vor der Rampe von HW auf RW/2 schmaler (Seitenwaende schraeg, Gehsteige laufen aus); gdeckK = 0 an der Rampe, 1 = volle Breite
function gdeckK(r, s) { const u = Math.min(r.ca ? 1e9 : s - r.sA, r.cb ? 1e9 : r.sB - s); return sst(0, GDECK.TL, u); }
const gdeckHW = (r, s) => GDECK.RW / 2 + (r.HW - GDECK.RW / 2) * gdeckK(r, s);
const gdeckInRamp = (r, s) => (!r.ca && s < r.sA) || (!r.cb && s > r.sB);
// grob: liegt (x, z) im Gotham-Rechteck (vor gotham-raster.js schon nutzbar)
function inGothamG0(x, z) { return x > -4240 && x < -400 && z > -1040 && z < 2800; }
// Gelaende: Ausschnitt unter dem unteren Raum und unter den Rampen
function gothamDeckH(x, z, g) {
  if (g > GOT.STR + 0.5 || !inGothamG0(x, z)) return g;
  const n = gdeckNear(x, z, 24); if (!n) return g; const r = n.r, s = n.s;
  if (s >= r.sA - 6 && s <= r.sB + 6 && n.d < r.HW + 6) return Math.min(g, GDECK.LY - 0.5);
  if (s >= -2 && s <= r.L + 2 && gdeckInRamp(r, s) && n.d < GDECK.RW / 2 + 6) return Math.min(g, gdeckRampY(r, Math.max(0, Math.min(r.L, s))) - 0.5);
  return g;
}
// Boden: oben die Fahrbahn (wer oben ist), unten der Boden der unteren Strasse, in der Rampe der Rampenboden; sonst null
function gothamDeckAt(x, z, feet) {
  if (!GDECK.roads || !inGothamG0(x, z)) return null;
  const n = gdeckNear(x, z, 26); if (!n) return null; const r = n.r, s = n.s, G = GDECK;
  // unten an Kreuzungen/Muendungen: liegt der Punkt im Innenraum einer anderen Strasse (nicht der naechsten), gilt deren Boden
  if (feet <= GOT.STR - 2.5 && !(s >= r.sA && s <= r.sB && n.d < gdeckHW(r, s))) for (const o of G.roads) { if (o === r) continue; const m = gdeckNearOn(o, x, z); if (m && m.s >= o.sA && m.s <= o.sB && m.d < gdeckHW(o, m.s)) return G.LY; }
  if (s < 0 || s > r.L || n.d > r.HW + G.COVER) return null;
  if (gdeckInRamp(r, s) && n.d < G.RW / 2) return gdeckRampY(r, s);
  if (feet > GOT.STR - 2.5) return GOT.STR;
  if (s >= r.sA && s <= r.sB) { const hw = gdeckHW(r, s); if (n.d < hw) return G.LY + (n.d > hw - 2 * gdeckK(r, s) ? 0.15 : 0); }   // Gehsteige unten 15 cm hoch (im Trichter schmaler)
  return null;
}
// Kamera: in der Fahrbahnplatte und in den Waenden unten gesperrt (true), sonst undefined (normale Pruefung)
function gothamDeckCam(x, y, z) {
  if (!GDECK.roads || y > GOT.STR + 0.3 || y < GDECK.LY - 1 || !inGothamG0(x, z)) return undefined;
  const n = gdeckNear(x, z, 26); if (!n) return undefined; const r = n.r, s = n.s, G = GDECK;
  if (s < 0 || s > r.L || n.d > r.HW + G.COVER) return undefined;
  if (gdeckInRamp(r, s) && n.d < G.RW / 2 - 0.5) return y < gdeckRampY(r, s) + 0.3;
  if (s >= r.sA && s <= r.sB && n.d < gdeckHW(r, s) - 0.6) return y > G.DY - 0.3;
  return y < GOT.STR + 0.2;
}
