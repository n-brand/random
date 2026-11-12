// Batverse – Gotham: feines Gelaende-Raster (Plan G1, Schritt G1b, Nicolas 2026-11-12)
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Nach gelaende.js und fernring.js. Braucht genH, grassTex, TILES, sst, vnoise.
"use strict";

// Das Gelaende-Raster der Manor reicht nur bis +-1500 m (aussen 15-25 m Zellen), der Fernring hat 40 m. Gotham liegt 1,5-3,9 km entfernt.
// Darum ein eigenes 4-m-Raster ueber das Rechteck GOT_R (Kanten auf dem 40-m-Raster des Fernrings), 15 x 15 Bloecke zu 256 m.
// Gotham-Bereich = GOT_R und mehr als GOT_R0 (1050 m) von der Manor (naeher bleibt alles wie bisher: Hauptraster, Wald, Kueste).
// - Hoehen genH (wie das Hauptraster) erst, wenn ein Block sie braucht (je Punkt, kein Startaufwand).
// - Bloecke mit Detailstufe 1/2/4/8 (4/8/16/32 m) nach Abstand und Gelaende-Detail, Schuerzen an allen Blockkanten gegen Risse.
// - Hauptraster spart im Gotham-Bereich aus (gelaende.js cut), der Fernring spart GOT_R aus (fernring.js). Zwischen 1030 und 1050 m zeichnen
//   beide, das Gotham-Raster dort 0,3 m tiefer (keine Luecke, kein Flimmern).
// - terrainH liest im Gotham-Bereich dieses Raster (Laufen, Fahren, Kollision mit dem Boden).
// Wasserflaeche der Fluesse (Welt-y SEA_Y, Material wie das Meer): 32-m-Zellen ueberall, wo eine Ecke Gotham-Wasser ist und nicht schon
// das Meer der Manor liegt (seaD < 5). Ragt unter das Ufer (dort liegt das Gelaende hoeher und deckt sie zu); 2 cm unter dem Meer, damit es dort,
// wo sich beide ueberlappen, nicht flimmert.
{
  const S = 32, B = GOT.bbox, P = [], U = [], I = [];
  for (let z = Math.floor(B.z0 / S) * S; z < B.z1; z += S) for (let x = Math.floor(B.x0 / S) * S; x < B.x1; x += S) {
    const c = [[x, z], [x + S, z], [x, z + S], [x + S, z + S]];
    if (!c.some(([a, b]) => GOT.w(a, b) > 0 && GOT.water(a, b) && seaD(a, b) < 5)) continue;
    const k = P.length / 3; for (const [a, b] of c) { P.push(a, 0, b); U.push(a / 10, b / 10); } I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
  // mat.sea gibt es erst nach gelaende.js (darum hier und nicht in gotham-gelaende.js; vorher fehlte das Material, die Flaeche war weiss)
  const m = new THREE.Mesh(g, mat.sea); m.position.y = SEA_Y - 0.02; m.name = "Gotham-Wasser"; m.userData.keep = true; m.userData.noLift = true; m.receiveShadow = true; scene.add(m);
  GOT.waterMesh = m;
}
// Rand zum Fernring (Nicolas 2026-11-12, Bild: "gigantischer unschoener Schnitt" an der Nordkante z -1040): der Fernring hat 40-m-Dreiecke aus genH0,
// das Gotham-Raster 4 m. Bis GR_BLEND m vor jedem Rand, hinter dem der Fernring liegt, geht die Hoehe weich in die Fernring-Flaeche ueber; am Rand gleich.
const GR_BLEND = 160, GR_FH = new Map();
function grFern(x, z) {                                                    // Hoehe der Fernring-Dreiecke (wie fernTerrainH, Ecken aus genH0, gemerkt)
  const fx = (x + FR_R) / FR_S, fz = (z + FR_R) / FR_S, i = Math.floor(fx), k = Math.floor(fz), u = fx - i, v = fz - k;
  const H = (a, b) => { const key = a * 10000 + b; let h = GR_FH.get(key); if (h === undefined) { h = genH0(-FR_R + a * FR_S, -FR_R + b * FR_S); GR_FH.set(key, h); } return h; };
  const A = H(i, k), B = H(i + 1, k), C = H(i, k + 1); if (u + v <= 1) return A + (B - A) * u + (C - A) * v;
  const D = H(i + 1, k + 1); return D + (C - D) * (1 - u) + (B - D) * (1 - v);
}
function grEdgeD(x, z) {                                                   // Abstand zum naechsten Rand mit Fernring dahinter (Ostrand nur ausserhalb des Hauptrasters)
  const E = T_A + T_B; let e = Math.min(x - GOT_R.x0, GOT_R.z1 - z); if (Math.abs(x) >= E) e = Math.min(e, z - GOT_R.z0); if (Math.abs(z) >= E) e = Math.min(e, GOT_R.x1 - x); return e;   // Nord- und Ostkante grenzen nahe der Manor ans Hauptraster, nicht an den Fernring
}
const GR_C = 4, GR_B = 64, GR_NB = 15, GR_N1 = GR_B + 1;
const GR_H = new Map();                                                    // Hoehen je Block (Float32Array, NaN = noch nicht gerechnet)
function grH(gi, gk) {                                                     // Rasterpunkt (gi, gk) ab GOT_R.x0 / z0
  const bi = Math.min(GR_NB - 1, Math.floor(gi / GR_B)), bk = Math.min(GR_NB - 1, Math.floor(gk / GR_B)), key = bi * 100 + bk;
  let A = GR_H.get(key); if (!A) { A = new Float32Array(GR_N1 * GR_N1).fill(NaN); GR_H.set(key, A); }
  const q = (gk - bk * GR_B) * GR_N1 + (gi - bi * GR_B); let h = A[q];
  if (h !== h) { const x = GOT_R.x0 + gi * GR_C, z = GOT_R.z0 + gk * GR_C; h = genH(x, z); const e = grEdgeD(x, z); if (e < GR_BLEND && !glandNear(x, z, 30)) h = grFern(x, z) + (h - grFern(x, z)) * sst(0, GR_BLEND, e); A[q] = h; }
  return h;
}
// Hoehe genau wie das feinste Netz (Dreiecke a c b / b c d)
function gothamTerrainH(x, z) {
  const fx = (x - GOT_R.x0) / GR_C, fz = (z - GOT_R.z0) / GR_C, i = Math.max(0, Math.min(GR_NB * GR_B - 1, Math.floor(fx))), k = Math.max(0, Math.min(GR_NB * GR_B - 1, Math.floor(fz)));
  const u = fx - i, v = fz - k, a = grH(i, k), b = grH(i + 1, k), c = grH(i, k + 1);
  if (u + v <= 1) return a + (b - a) * u + (c - a) * v;
  const d = grH(i + 1, k + 1); return d + (c - d) * (1 - u) + (b - d) * (1 - v);
}
// Ausserhalb von Hauptraster (+-1500 m) und Gotham-Raster: Hoehe des Fernrings (gleiche Dreiecke; vor seinem Bau genH0) - G1c, Weltgrenze 4,3 km
function fernTerrainH(x, z) {
  if (!FERN.mesh) return genH0(x, z);
  const fx = (x + FR_R) / FR_S, fz = (z + FR_R) / FR_S, i = Math.max(0, Math.min(FR_N - 2, Math.floor(fx))), k = Math.max(0, Math.min(FR_N - 2, Math.floor(fz))), u = fx - i, v = fz - k;
  const H = (a, b) => FERN.H[b * FR_N + a], a = H(i, k), b = H(i + 1, k), c = H(i, k + 1);
  if (u + v <= 1) return a + (b - a) * u + (c - a) * v;
  const d = H(i + 1, k + 1); return d + (c - d) * (1 - u) + (b - d) * (1 - v);
}
{ const terrainH0 = terrainH, E = T_A + T_B;
  terrainH = (x, z) => inGothamG(x, z) ? gothamTerrainH(x, z) : Math.abs(x) < E && Math.abs(z) < E ? terrainH0(x, z) : fernTerrainH(x, z); }

// Farben: Wiese/Wald, Fels an steilen Stellen und hoch oben, Kies am Ufer, Flussgrund; Insel (Strassenebene) vorerst helle Wiese (Stadt kommt mit G2/G3)
const GR_COL = (() => { const C = h => new THREE.Color(h);
  return { a: C(0x5b8c3c), b: C(0x739c47), f: C(0x3b6430), rock: C(0x85827c), snow: C(0xf2f4f6), sand: C(0xb0a27a), bed: C(0x5d5a46), isl: C(0x7f9c5a) }; })();
function grColor(x, h, z, ny, c) {
  const K = GR_COL; c.copy(K.a).lerp(K.b, vnoise(x / 40, z / 40)).lerp(K.f, 0.5 * sst(0.45, 0.7, vnoise(x / 300 + 7, z / 300 + 3)));
  if (Math.abs(h - GOT.STR) < 0.3) c.copy(K.isl).lerp(K.b, 0.3 * vnoise(x / 30, z / 30));
  c.lerp(K.rock, Math.max(sst(0.86, 0.7, ny), sst(90, 160, h))).lerp(K.snow, sst(190, 240, h));
  if (h < GOT.WY + 2.5) c.lerp(K.sand, sst(GOT.WY + 2.5, GOT.WY + 0.8, h));
  if (h < GOT.WY - 0.5) c.lerp(K.bed, sst(GOT.WY - 0.5, GOT.WY - 3, h));
  return c;
}
const GR = { blocks: [], queue: [], tris: 0, mat: M(0xffffff, { map: grassTex, vertexColors: true, roughness: 1 }) };
for (let bk = 0; bk < GR_NB; bk++) for (let bi = 0; bi < GR_NB; bi++) {
  const x0 = GOT_R.x0 + bi * GR_B * GR_C, z0 = GOT_R.z0 + bk * GR_B * GR_C, x1 = x0 + GR_B * GR_C, z1 = z0 + GR_B * GR_C;
  const far = Math.hypot(Math.max(Math.abs(x0), Math.abs(x1)), Math.max(Math.abs(z0), Math.abs(z1)));   // weitester Punkt zur Manor
  if (far < GOT_R0 - 20) continue;                                           // ganz im Bereich der Manor: nichts zu zeichnen
  GR.blocks.push({ bi, bk, x0, z0, x1, z1, S: 0, want: 8, d: 0, mesh: null });
}
function grBuild(b, S) {
  const n = GR_B / S + 1, P = [], N = [], Cc = [], U = [], I = [], c = new THREE.Color(), gi0 = b.bi * GR_B, gk0 = b.bk * GR_B, keep = [];
  const off = (x, z) => Math.hypot(x, z) < GOT_R0 || ((z < GOT_R.z0 + 10 || x > GOT_R.x1 - 10) && Math.abs(x) < T_A + T_B && Math.abs(z) < T_A + T_B) ? -0.3 : 0;   // Uebergangsstreifen unter dem Hauptraster (Kreis und gerade Kanten)
  const add = (x, y, z, nx, ny, nz, h) => { P.push(x, y, z); N.push(nx, ny, nz); grColor(x, h, z, ny, c); Cc.push(c.r, c.g, c.b); U.push(x / 10, -z / 10); return P.length / 3 - 1; };
  const idx = new Int32Array(n * n);
  for (let v = 0; v < n; v++) for (let u = 0; u < n; u++) {
    const gi = gi0 + u * S, gk = gk0 + v * S, x = GOT_R.x0 + gi * GR_C, z = GOT_R.z0 + gk * GR_C, h = grH(gi, gk);
    const hx = grH(Math.min(GR_NB * GR_B, gi + S), gk) - grH(Math.max(0, gi - S), gk), hz = grH(gi, Math.min(GR_NB * GR_B, gk + S)) - grH(gi, Math.max(0, gk - S));
    const nx = -hx, nz = -hz, ny = 4 * S * GR_C / 2, l = Math.hypot(nx, ny, nz);
    keep.push(Math.hypot(x, z) > GOT_R0 - 20);
    idx[v * n + u] = add(x, h + off(x, z), z, nx / l, ny / l, nz / l, h);
  }
  for (let v = 0; v < n - 1; v++) for (let u = 0; u < n - 1; u++) {
    const a = v * n + u, bb = a + 1, cc = a + n, d = cc + 1;
    if (keep[a] && keep[cc] && keep[bb]) I.push(idx[a], idx[cc], idx[bb]);
    if (keep[bb] && keep[cc] && keep[d]) I.push(idx[bb], idx[cc], idx[d]);
  }
  // Schuerzen an den vier Kanten (haengen 2-14 m hinunter, verdecken Risse zu groeberen Nachbarn und zum Fernring)
  const sk = 2 + S * 1.5;
  const edge = (list) => { for (let t = 0; t < list.length - 1; t++) { const p = list[t], q = list[t + 1]; if (!keep[p] || !keep[q]) continue;
    const ia = idx[p], ib = idx[q], A = P.slice(ia * 3, ia * 3 + 3), B2 = P.slice(ib * 3, ib * 3 + 3);
    const la = add(A[0], A[1] - sk, A[2], N[ia * 3], N[ia * 3 + 1], N[ia * 3 + 2], A[1]), lb = add(B2[0], B2[1] - sk, B2[2], N[ib * 3], N[ib * 3 + 1], N[ib * 3 + 2], B2[1]);
    I.push(ia, la, ib, ib, la, lb, ia, ib, la, ib, lb, la); } };
  const row = v => Array.from({ length: n }, (_, u) => v * n + u), col = u => Array.from({ length: n }, (_, v) => v * n + u);
  edge(row(0)); edge(row(n - 1)); edge(col(0)); edge(col(n - 1));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I); g.computeBoundingSphere();
  if (b.mesh) { GR.tris -= b.mesh.geometry.index.count / 3; b.mesh.geometry.dispose(); b.mesh.geometry = g; }
  else { b.mesh = new THREE.Mesh(g, GR.mat); b.mesh.name = "Gotham-Gelaende " + b.bi + "," + b.bk; b.mesh.receiveShadow = true; b.mesh.userData.keep = true; b.mesh.userData.noLift = true; scene.add(b.mesh); }
  GR.tris += I.length / 3; b.S = S;
}
// Stufe je Block nach Abstand (wie die Gelaende-Bloecke), Umbau im Kachel-Zeitbudget; beim Start erst nach dem ersten Bild
TILES.tasks.push({
  plan(fx, fy, fz) {
    const f = TERR_F[TERR.detail], q = [];
    for (const b of GR.blocks) {
      const dx = Math.max(b.x0 - fx, 0, fx - b.x1), dz = Math.max(b.z0 - fz, 0, fz - b.z1), d = Math.hypot(dx, Math.max(0, fy - 200), dz);
      let S = 1; while (S < 8 && GR_C * S * 2 <= d * f) S *= 2;
      b.want = S; b.d = d; if (b.mesh) b.mesh.visible = d < (TILES.viewFar || 1e9) + 50;
      if (S !== b.S && (b.mesh || d < (TILES.viewFar || 1e9) + 200)) q.push(b);
    }
    q.sort((a, c) => a.d - c.d); GR.queue = q;
  },
  step() {
    if (TILES.startup) return false;
    const b = GR.queue.shift(); if (!b) return false;
    if (b.want !== b.S) grBuild(b, b.want);
    return true;
  },
});
