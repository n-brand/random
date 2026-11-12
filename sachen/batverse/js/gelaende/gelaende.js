// Batverse – Wald, Hoehenfeld und Gelaendenetz, Seen, Meer, Wald, Karten-Overlay
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Walddichte 0..1 (North Forest, West Forest, sonst verstreute Gruppen)
function forestD(x, z) {
  { const n = glandNear(x, z, 20); if (n && n.d < n.r.w / 2 + 8) return 0; }   // Festlandstrassen von Gotham (G2d)
  if (siteDist(x, z) < 8 || inLawn(x, z) || seaD(x, z) > -30 || serpNear(x, z, 9) || serpZone(x, z) > 0.4 || ROADS2.some(R => roadNear(R, x, z, R.w / 2 + 6)) || roadNear(HFR, x, z, HFR.w / 2 + 5) || wallNear(x, z, 3) || inSilo(x, z, 7)) return 0;
  for (const L of LAKES) if (lakeD(L, x, z) < 1.25) return 0;
  if (Math.hypot(x - WATERFALL.x, z - WATERFALL.z) < 27 || streamDist(x, z) < 4.5) return 0;
  { const w = wfNear(x, z, 8); if ((w && w.s > WFT.sP) || Math.hypot(x - WFT.end[0], z - WFT.end[1]) < 13) return 0; }   // Waterfall-Exit draussen (Sackgasse)
  let d = 0.08 + 0.55 * sst(0.6, 0.75, vnoise(x / 60, z / 60));
  if (z < -100 || (z < -90 && x > -130 && x < 20)) d = 0.9;
  if (x < -118) d = Math.max(d, 0.85);
  return d * sst(1000, 800, Math.hypot(x, z));
}

// Hoehenfeld: Gitter wird zur Mitte hin feiner (ca. 2 m am Anwesen, 3-6 m an der Kueste, gross am Rand bei 1500 m)
const T_N = 640, T_A = 640, T_B = 860, TN1 = T_N + 1;                   // Mitte ca. 2 m, Kueste 3-6 m (A2, E3)
const warp = u => Math.sign(u) * (T_A * Math.abs(u) + T_B * Math.abs(u) ** 3);
function unwarp(x) {
  const s = Math.min(Math.abs(x), T_A + T_B);
  let t = Math.min(1, s / T_A);
  for (let k = 0; k < 6; k++) t -= (T_A * t + T_B * t * t * t - s) / (T_A + 3 * T_B * t * t);
  return Math.sign(x) * t;
}
function gridStep(v) { const u = unwarp(v); return (T_A + 3 * T_B * u * u) * 2 / T_N; }   // Rasterweite an der Stelle v (m)
const TX = Float32Array.from({ length: TN1 }, (_, i) => warp(i / (T_N / 2) - 1));
const TH = new Float32Array(TN1 * TN1);
for (let j = 0; j < TN1; j++) for (let i = 0; i < TN1; i++) TH[j * TN1 + i] = genH(TX[i], TX[j]);
// Hoehe genau wie das Netz (gleiche Dreiecke), damit man weder schwebt noch einsinkt
function terrainH(x, z) {
  const cell = v => { const i = Math.max(0, Math.min(T_N - 1, Math.floor((unwarp(v) + 1) * T_N / 2))); return [i, clamp01((v - TX[i]) / (TX[i + 1] - TX[i]))]; };
  const [i, fx] = cell(x), [j, fz] = cell(z), k = j * TN1 + i;
  const a = TH[k], b = TH[k + 1], c = TH[k + TN1], d = TH[k + TN1 + 1];
  return fx + fz <= 1 ? a + (b - a) * fx + (c - a) * fz : d + (c - d) * (1 - fx) + (b - d) * (1 - fz);
}
// Gelaende-Bloecke (K4). TB Zellen je Block, Schritt S je Block; TERR_F = erlaubter Punktabstand / Abstand zur Kamera (Gelaende-Detail)
const TB = 64, TBN = T_N / TB;                                           // 64 Zellen = 128 m in der Mitte (32 gab zu viele Zeichenaufrufe)
const TERR = { blocks: [], detail: (() => { try { const v = localStorage.getItem("wm-detail"); if (v === "niedrig" || v === "mittel" || v === "hoch") return v; } catch (e) {} return TILES.mobile ? "niedrig" : "mittel"; })(), queue: [], tris: 0 };
const TERR_F = { niedrig: 0.03, mittel: 0.015, hoch: 0.008 };
function setTerrainDetail(v) { if (!TERR_F[v]) return; TERR.detail = v; try { localStorage.setItem("wm-detail", v); } catch (e) {} TILES.cx = NaN; }
function terrainBlocks(pos, nrm, col, cut, colAt, mtl) {
  for (let bj = 0; bj < TBN; bj++) for (let bi = 0; bi < TBN; bi++) {
    const i0 = bi * TB, j0 = bj * TB; let hasCut = false, y0 = 1e9, y1 = -1e9;
    for (let j = j0; j <= j0 + TB; j++) for (let i = i0; i <= i0 + TB; i++) { const k = j * TN1 + i; if (cut[k]) hasCut = true; y0 = Math.min(y0, TH[k]); y1 = Math.max(y1, TH[k]); }
    TERR.blocks.push({ bi, bj, i0, j0, hasCut, y0, y1, S: 0, want: 1, d: 0, mesh: null, cell: (TX[i0 + TB] - TX[i0]) / TB });
  }
  const B = (bi, bj) => bi >= 0 && bj >= 0 && bi < TBN && bj < TBN ? TERR.blocks[bj * TBN + bi] : null;
  // Netz eines Blocks mit Schritt S bauen (Dreiecke wie das alte Netz: a c b / b c d, Ausschnitte weglassen)
  function build(b, S) {
    const n = TB / S + 1, P = new Float32Array(n * n * 3), N = new Float32Array(n * n * 3), Cc = new Float32Array(n * n * 3), U = new Float32Array(n * n * 2), I = [];
    for (let v = 0; v < n; v++) for (let u = 0; u < n; u++) {
      const k = (b.j0 + v * S) * TN1 + b.i0 + u * S, q = v * n + u; colAt(k);
      P.set(pos.subarray(k * 3, k * 3 + 3), q * 3); N.set(nrm.subarray(k * 3, k * 3 + 3), q * 3); Cc.set(col.subarray(k * 3, k * 3 + 3), q * 3);
      U[q * 2] = P[q * 3] / 10; U[q * 2 + 1] = -P[q * 3 + 2] / 10;
    }
    const ck = (u, v) => cut[(b.j0 + v * S) * TN1 + b.i0 + u * S];
    for (let v = 0; v < n - 1; v++) for (let u = 0; u < n - 1; u++) {
      const a = v * n + u, bb = a + 1, c = a + n, d = c + 1;
      if (!(ck(u, v) || ck(u + 1, v) || ck(u, v + 1))) I.push(a, c, bb);
      if (!(ck(u + 1, v) || ck(u, v + 1) || ck(u + 1, v + 1))) I.push(bb, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.BufferAttribute(N, 3));
    g.setAttribute("color", new THREE.BufferAttribute(Cc, 3)); g.setAttribute("uv", new THREE.BufferAttribute(U, 2));
    g.setIndex(I); g.computeBoundingSphere(); g.computeBoundingBox();
    if (b.mesh) { TERR.tris -= b.mesh.geometry.index.count / 3; b.mesh.geometry.dispose(); b.mesh.geometry = g; }
    else { b.mesh = new THREE.Mesh(g, mtl); b.mesh.name = "Gelaende " + b.bi + "," + b.bj; b.mesh.receiveShadow = b.mesh.castShadow = true; b.mesh.userData.keep = true; scene.add(b.mesh); }
    TERR.tris += I.length / 3; b.S = S;
  }
  // Randpunkte an groebere Nachbarn anlegen (sonst Risse). Seiten: 0 West (u = 0), 1 Ost, 2 Nord (v = 0), 3 Sued
  function fixEdges(b) {
    if (!b.mesh) return;
    const S = b.S, n = TB / S + 1, P = b.mesh.geometry.attributes.position, A = P.array;
    const nb = [B(b.bi - 1, b.bj), B(b.bi + 1, b.bj), B(b.bi, b.bj - 1), B(b.bi, b.bj + 1)];
    for (let side = 0; side < 4; side++) {
      const Sn = nb[side] && nb[side].mesh ? nb[side].S : S, along = side < 2;   // West/Ost: Kante laeuft entlang j
      for (let t = 0; t < n; t++) {
        const u = side === 0 ? 0 : side === 1 ? n - 1 : t, v = side === 2 ? 0 : side === 3 ? n - 1 : t, q = v * n + u;
        const gi = b.i0 + u * S, gj = b.j0 + v * S, off = along ? gj - b.j0 : gi - b.i0;
        let h = TH[gj * TN1 + gi];
        if (Sn > S && off % Sn) {
          const a0 = off - off % Sn, a1 = a0 + Sn;
          if (along) { const ja = b.j0 + a0, jb = b.j0 + a1, w = (TX[gj] - TX[ja]) / (TX[jb] - TX[ja]); h = TH[ja * TN1 + gi] * (1 - w) + TH[jb * TN1 + gi] * w; }
          else { const ia = b.i0 + a0, ib = b.i0 + a1, w = (TX[gi] - TX[ia]) / (TX[ib] - TX[ia]); h = TH[gj * TN1 + ia] * (1 - w) + TH[gj * TN1 + ib] * w; }
        }
        A[q * 3 + 1] = h;
      }
    }
    P.needsUpdate = true;
  }
  // Gewuenschte Stufe je Block (bei jedem Neuplanen der Kacheln), Umbau nach Vorrang mit dem Kachel-Zeitbudget
  TILES.tasks.push({
    plan(fx, fy, fz) {
      const f = TERR_F[TERR.detail], q = [];
      for (const b of TERR.blocks) {
        const x0 = TX[b.i0], x1 = TX[b.i0 + TB], z0 = TX[b.j0], z1 = TX[b.j0 + TB];
        const dx = Math.max(x0 - fx, 0, fx - x1), dz = Math.max(z0 - fz, 0, fz - z1), dy = Math.max(b.y0 - fy, 0, fy - b.y1), d = Math.hypot(dx, dy, dz);
        let S = 1; if (!b.hasCut) while (S < 8 && b.cell * S * 2 <= d * f) S *= 2;
        b.want = S; b.d = d; if (b.mesh) b.mesh.visible = d < (TILES.viewFar || 1e9) + 50;   // K5/T2: hinter dem Ferndunst nicht zeichnen
        if (S !== b.S && (b.mesh || d < (TILES.viewFar || 1e9) + 200)) q.push(b);   // K7: Bloecke hinter dem Dunst erst bauen, wenn man naeher kommt
      }
      q.sort((a, c) => a.d - c.d); TERR.queue = q;
    },
    step() {
      const b = TERR.queue.shift(); if (!b) return false;
      if (b.want !== b.S) { build(b, b.want); for (const o of [b, B(b.bi - 1, b.bj), B(b.bi + 1, b.bj), B(b.bi, b.bj - 1), B(b.bi, b.bj + 1)]) if (o) fixEdges(o); }
      return true;
    },
  });
}
const grassTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#dcdcdc"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) { const v = 175 + r1() * 80; g.fillStyle = `rgba(${v - 12},${v},${v - 22},.5)`; g.fillRect(r1() * w, r1() * h, 1 + r1() * 2, 2 + r1() * 4); }
});
{
  const pos = new Float32Array(TN1 * TN1 * 3), uv = new Float32Array(TN1 * TN1 * 2), idx = new Uint32Array(T_N * T_N * 6);
  for (let j = 0, k = 0; j < TN1; j++) for (let i = 0; i < TN1; i++, k++) {
    pos.set([TX[i], TH[k], TX[j]], k * 3); uv.set([TX[i] / 10, -TX[j] / 10], k * 2);
  }
  // Dreiecke mit einer Ecke in einem Becken oder in der Meereshoehle weglassen
  const cut = new Uint8Array(TN1 * TN1);
  for (let k = 0; k < TN1 * TN1; k++) {
    const vx = pos[k * 3], vz = pos[k * 3 + 2];
    if (inPool(vx, vz) || Math.hypot(vx - FOUNT.x, vz - FOUNT.z) < FOUNT.r - 0.2) { cut[k] = 1; continue; }   // Becken (Pool, Brunnen)
    if (pos[k * 3 + 1] < -8 && seaD(vx, vz) < 5 && seaTunDist(vx, vz) < SEA_TUN_W / 2 + 1.5) cut[k] = 1;   // Meereshoehle
    if (pos[k * 3 + 1] < SEA_Y + 9 && waterCaveAt(vx, vz, 1.5)) cut[k] = 1;                                // Wasserhoehlen (E2)
    if (inGothamG(vx, vz) && vz > GOT_R.z0 + 10 && vx < GOT_R.x1 - 10) { cut[k] = 1; continue; }   // Gotham (G1b): eigenes 4-m-Raster (gotham/gotham-raster.js); an den geraden Kanten 10 m Ueberlappung (Nicolas 2026-11-12: Riss bei z -1040), das Gotham-Raster liegt dort 0,3 m tiefer
    if (inSilo(vx, vz, 0.6)) cut[k] = 1;
    if (GRAMP.inF(vx, vz)) cut[k] = 1;                                         // Garagenrampe: Klappe (Rasenkragen deckt den groesseren Ausschnitt ab)                                     // Flugzeug-Silo (Rasenklappen und Kragen decken ab)
    if (vx > HF_XP - 1.5 && vx < HF_XP + 6 && Math.abs(vz - HF_CZ) < 3.2) cut[k] = 1;   // Tunnelmund Westweg (Portalkopf deckt ab)
    if (vx > WF_PORTAL.x0 && vx < WF_PORTAL.x1 && vz > WF_PORTAL.z0 && vz < WF_PORTAL.z1 && pos[k * 3 + 1] < 7.5 && pos[k * 3 + 1] > -1.5) cut[k] = 1;   // Waterfall Exit (A8)
  }
  let n = 0;
  for (let j = 0; j < T_N; j++) for (let i = 0; i < T_N; i++) {
    const a = j * TN1 + i, b = a + 1, c = a + TN1, d = c + 1;
    if (!(cut[a] || cut[b] || cut[c])) { idx.set([a, c, b], n); n += 3; }
    if (!(cut[b] || cut[c] || cut[d])) { idx.set([b, c, d], n); n += 3; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx.subarray(0, n), 1));
  g.computeVertexNormals();
  // Farben: Wiese, gemaehter Rasen, Waldboden, Sand am Ufer, Seegrund, Fels an steilen Stellen, Schnee
  const nrm = g.attributes.normal.array, col = new Float32Array(TN1 * TN1 * 3);
  const C = h => new THREE.Color(h), cMeadowA = C(0x5b8c3c), cMeadowB = C(0x739c47), cLawn = C(0x6aa84a), cForest = C(0x3b6430),
    cSand = C(0xb0a27a), cBed = C(0x5d5a46), cRock = C(0x85827c), cSnow = C(0xf2f4f6), c = new THREE.Color(),
    cPassGrey = C(0x8a8780), cPassBrown = C(0x7d6c5a), cPassBeige = C(0xa99e88), cPassDark = C(0x56534f), pc = new THREE.Color();
  // K7 (2026-11-11): Farbe erst, wenn ein Block den Punkt wirklich zeichnet (weit weg nur jeder 4./8. Punkt), gleiche Formel wie vorher
  const cdone = new Uint8Array(TN1 * TN1);
  function terrColor(k) {
    cdone[k] = 1;
    const x = pos[k * 3], h = pos[k * 3 + 1], z = pos[k * 3 + 2];
    c.copy(cMeadowA).lerp(cMeadowB, vnoise(x / 40, z / 40));
    c.lerp(cLawn, 0.7 * Math.max(sst(40, 0, siteDist(x, z)), inLawn(x, z) ? 1 : 0));
    c.lerp(cForest, forestD(x, z) * 0.8);
    const dl = Math.min(...LAKES.map(L => lakeD(L, x, z)));
    if (dl < 1.15) c.lerp(cSand, sst(1.15, 1.0, dl));
    { const sdd = seaD(x, z), nn = vnoise(x / 9 + 3, z / 9 + 1); c.lerp(cRock, sst(-10 - 16 * nn, -2 - 4 * nn, sdd) * (0.55 + 0.45 * vnoise(x / 3, z / 3))); }   // Fels zur Kante hin, unregelmaessig
    if (h < WATER_Y) c.lerp(cBed, sst(WATER_Y, WATER_Y - 1, h));
    // Fels an steilen Stellen; nicht an der Westweg-Kiesstrasse (Nicolas 2026-11-11: graue Flecken in der Wiese am Eingang; die Boeschungen dort
    // sind nur Raster-Artefakte, darueber liegt Wiese)
    c.lerp(cRock, Math.max(roadNear(HFR, x, z, HFR.w / 2 + 11) ? 0 : sst(0.86, 0.7, nrm[k * 3 + 1]), sst(90, 160, h)));
    c.lerp(cSnow, sst(190, 240, h));
    const zn = serpZone(x, z) * sst(HILL - 0.4, HILL - 2.5, h);      // Plateau-Oberseite bleibt Rasen
    if (zn > 0) {
      const n1 = vnoise(x / 11 + 5, z / 11 + 2), n2 = vnoise(x / 4 + 9, z / 4 + 1), n3 = vnoise(x / 30 + 1, z / 30 + 7);
      pc.copy(cPassGrey).lerp(cPassBrown, sst(0.45, 0.8, n3)).lerp(cPassBeige, sst(0.6, 0.85, n1) * 0.7).lerp(cPassDark, sst(0.55, 0.9, n2) * 0.45);
      pc.multiplyScalar(0.88 + 0.24 * n2);
      const veg = sst(0.66, 0.8, vnoise(x / 8 + 31, z / 8 + 3)) * sst(0.955, 0.985, nrm[k * 3 + 1]);   // kleine Grasflecken nur auf wirklich flachen Stellen
      c.lerp(pc, zn * (1 - 0.6 * veg));
    }
    col.set([c.r, c.g, c.b], k * 3);
  }
  // K4 (2026-11-11): statt eines Netzes 640 x 640 jetzt Bloecke zu 32 x 32 Zellen desselben Rasters (Variante A: gleiche Punkte, gleiche Normalen
  // und Farben, die Form aendert sich nicht). Jeder Block hat eine Detailstufe (Schritt 1, 2, 4, 8 Zellen) nach Abstand zur Kamera und Einstellung
  // Gelaende-Detail; Bloecke mit Ausschnitt (Pool, Portal, Silo ...) immer Schritt 1. Gegen Risse: Randpunkte eines feineren Blocks liegen auf der
  // Kante des groeberen Nachbarn (Hoehe dort linear zwischen dessen Punkten). Laufen/Fahren rechnen weiter mit terrainH (volles Raster).
  terrainBlocks(pos, g.attributes.normal.array, col, cut, k => cdone[k] || terrColor(k), M(0xffffff, { map: grassTex, vertexColors: true, roughness: 1 }));
  g.dispose();
}
// Seen (Wasserflaeche etwas groesser als der Uferrand, der Rand verschwindet im Gelaende)
for (const L of LAKES) {
  const sh = new THREE.Shape();
  for (let k = 0; k <= 96; k++) {
    const a = k / 96 * Math.PI * 2, w = wob(L, a) * 1.02, x = L.cx + Math.cos(a) * L.rx * w, z = L.cz + Math.sin(a) * L.rz * w;
    if (k) sh.lineTo(x, -z); else sh.moveTo(x, -z);
  }
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2), mat.water);
  m.position.y = WATER_Y; m.receiveShadow = true;
  scene.add(m);
}
// Ein gemeinsames Wasser fuer Meer, Meereshoehle und Hoehlenkanaele (gleiche Hoehe SEA_Y, undurchsichtig: keine sichtbaren Kanten)
// B7: Wasser ohne ueberstrahlten weissen Fleck. Wellen-Normalmap (nahtlos: Summe von Sinuswellen mit ganzzahligen Frequenzen),
// etwas rauer, nicht metallisch, gedaempfte Spiegelung -> schmaler, glitzernder Lichtstreifen, das Wasser bleibt blau. Bewegt sich (waterAnim).
const waveNormals = (() => {
  const N = 256, c = document.createElement("canvas"); c.width = c.height = N;
  const g = c.getContext("2d"), img = g.createImageData(N, N), wr = rng(606), W = [];
  for (let k = 0; k < 14; k++) { const a = wr() * Math.PI * 2, f = 1 + Math.floor(wr() * (k < 5 ? 4 : 12)); W.push([Math.round(Math.cos(a) * f), Math.round(Math.sin(a) * f), (0.6 / Math.max(1, Math.hypot(Math.cos(a) * f, Math.sin(a) * f))) * (0.6 + wr()), wr() * 6.28]); }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let dx = 0, dy = 0;
    for (const [kx, ky, amp, ph] of W) { const s = Math.cos(2 * Math.PI * (kx * x + ky * y) / N + ph) * amp * 2 * Math.PI / N * N / 8; dx += s * kx; dy += s * ky; }
    const l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (-dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return rep => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; return t; };
})();
mat.sea = new THREE.MeshPhysicalMaterial({ color: 0x1d5f80, roughness: 0.3, metalness: 0, specularIntensity: 0.55, normalMap: waveNormals(1), normalScale: new THREE.Vector2(0.55, 0.55), side: THREE.DoubleSide });
// Meer: Flaeche von der Kuestenlinie bis weit hinter den Horizont
{
  // Als Streifen von der Kueste (s = coastS) bis s = 3200 (E3: ein grosses Vieleck mit vielen Punkten wurde nicht mehr ganz trianguliert)
  const P = (s, t) => [(s - t) * R2, -(s + t) * R2];
  const sp = [], si = [], su = [];
  for (let t = -4600; t <= 4600; t += Math.abs(t) < 1400 ? 4 : 25) {   // T2: bis hinter den Fernring (3,6 km)
    const [ax, az] = P(coastS(t) - 0.5 * Math.hypot(1, coastSlope(t)), t), [bx, bz] = P(5200, t);
    sp.push(ax, 0, -az, bx, 0, -bz); su.push(ax / 10, -az / 10, bx / 10, -bz / 10);
  }
  for (let k = 0; k < sp.length / 6 - 1; k++) { const a = k * 2; si.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const seaG = new THREE.BufferGeometry();
  seaG.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); seaG.setAttribute("uv", new THREE.Float32BufferAttribute(su, 2)); seaG.setIndex(si); seaG.computeVertexNormals();
  const sea = new THREE.Mesh(seaG, mat.sea);
  sea.position.y = SEA_Y; sea.receiveShadow = true;
  scene.add(sea);
  // Eckige Felsbrocken entlang der Kueste (statt Strand)
  const rr = rng(303), list = [];
  // oben an der Kante wenige kleine, unten am Klippenfuss grosse Brocken im Wasser
  for (let t = -1300; t <= 1300; t += 2.6) for (let k = 0; k < 2; k++) {
    const top = k === 0, off = top ? -15 + rr() * 11 : 2 + rr() * 16, size = top ? 0.6 + rr() ** 2 * 1.8 : 1.5 + rr() ** 2 * 5, s = coastS(t) + off * Math.hypot(1, coastSlope(t)), x = (s - t) * R2, z = (s + t) * R2;
    if (rr() < (top ? 0.6 : 0.2) || Math.hypot(x, z) > 1250 || seaTunDist(x, z) < 10 || seaD(x, z) < seaBase(x, z) - 0.5 || waterCaveAt(x, z, 4) || SEA_STACKS.some(s => Math.hypot(x - s.x, z - s.z) < s.r + 3)) continue;
    const q = [x, terrainH(x, z) - size * 0.35, z, size, rr(), rr(), rr(), rr()], gn = glandNear(x, z, 16);   // Zufall immer ziehen: uebrige Brocken bleiben gleich
    if (!gn || gn.d > gn.r.w / 2 + 4 + size) list.push(q);                    // nicht auf Gothams Festlandstrassen (G2d)
  }
  const rockM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), M(0xffffff, { map: rockTex, roughness: 1, flatShading: true }), list.length);
  const o = new THREE.Object3D(), cc = new THREE.Color();
  list.forEach(([x, y, z, s, a, b, c, d], i) => {
    o.position.set(x, y, z); o.rotation.set(a * 6, b * 6, c * 6); o.scale.set(s * (0.8 + a * 0.6), s * (0.6 + b * 0.5), s * (0.8 + c * 0.6)); o.updateMatrix();
    rockM.setMatrixAt(i, o.matrix);
    rockM.setColorAt(i, cc.setRGB(0.75 + d * 0.3, 0.74 + d * 0.28, 0.72 + d * 0.26));
    if (Math.hypot(x, z) < LIMIT_WORLD + 20 && y + s > WATER_Y) circles.push([x, z, s * 0.75, y + s * 0.9]);
  });
  rockM.castShadow = rockM.receiveShadow = true;
  rockM.computeBoundingSphere();
  scene.add(rockM);
}
// Wald: Nadel- und Laubbaeume als InstancedMesh. Standorte wie bisher beim Start (gleicher Zufall, gleiche Baeume, Stamm-Kreise fuer die Kollision);
// die Netze baut seit K3 (2026-11-11) die Kachel-Verwaltung je 256-m-Feld erst, wenn das Feld in der Ladeweite liegt (kern/kacheln.js)
{
  function treeGeo(parts) {
    return mergeGeometries(parts.map(([geo, hex]) => {
      const g = geo.toNonIndexed(), cc = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) a.set([cc.r, cc.g, cc.b], i * 3);
      g.setAttribute("color", new THREE.BufferAttribute(a, 3));
      return g;
    }));
  }
  const conGeo = treeGeo([[new THREE.CylinderGeometry(0.22, 0.34, 3.2, 6).translate(0, 1.6, 0), 0x5a3d22], [new THREE.ConeGeometry(2.7, 6.2, 8).translate(0, 5.6, 0), 0x2d5a2e],
    [new THREE.ConeGeometry(2.0, 4.8, 8).translate(0, 8.6, 0), 0x336535], [new THREE.ConeGeometry(1.2, 3.2, 8).translate(0, 11, 0), 0x3a6e3a]]);
  const decGeo = treeGeo([[new THREE.CylinderGeometry(0.28, 0.4, 4.2, 6).translate(0, 2.1, 0), 0x5f4228], [new THREE.IcosahedronGeometry(3.3, 1).scale(1, 0.85, 1).translate(0, 6.6, 0), 0x3f7a35],
    [new THREE.IcosahedronGeometry(2.2, 1).translate(1.6, 5.6, 0.8), 0x4a8a3c]]);
  const treeMat = M(0xffffff, { vertexColors: true, roughness: 1, flatShading: true });
  const tr = rng(77), cells = new Map();
  for (let gx = -950; gx <= 950; gx += 10) for (let gz = -950; gz <= 950; gz += 10) {
    const x = gx + (tr() - 0.5) * 8, z = gz + (tr() - 0.5) * 8, pick = tr(), kind = tr(), sc = tr(), rot = tr(), tint = tr();
    let d = forestD(x, z);
    if (Math.hypot(x, z) > 450) d *= 0.55;                                   // in der Ferne lockerer (dort liegt Nebel)
    if (pick >= d || POLES.some(([px, pz]) => Math.hypot(x - px, z - pz) < 5)) continue;
    const y = terrainH(x, z);
    if (y > 150 || y < 0) continue;
    const con = kind < (z < -150 ? 0.75 : x < -235 ? 0.5 : 0.3), s = 0.75 + sc * 0.6;
    const key = Math.floor(x / 256) + "," + Math.floor(z / 256);
    if (!cells.has(key)) cells.set(key, { con: [], dec: [] });
    cells.get(key)[con ? "con" : "dec"].push([x, y - 0.2, z, s, rot * Math.PI * 2, tint]);
    if (Math.hypot(x, z) < LIMIT_WORLD + 10) circles.push([x, z, (con ? 0.32 : 0.4) * s]);
  }
  const o = new THREE.Object3D(), tc = new THREE.Color();
  let count = 0;
  for (const cell of cells.values()) count += cell.con.length + cell.dec.length;
  tileLayer("Wald", 256, (i, k) => {
    const cell = cells.get(i + "," + k); if (!cell) return null;
    const g = new THREE.Group(); g.name = "Wald " + i + "," + k;
    for (const [type, geo] of [["con", conGeo], ["dec", decGeo]]) {
      const list = cell[type];
      if (!list.length) continue;
      const im = new THREE.InstancedMesh(geo, treeMat, list.length);
      list.forEach(([x, y, z, s, r, t], n) => {
        o.position.set(x, y, z); o.rotation.set(0, r, 0); o.scale.set(s, s * (0.9 + t * 0.25), s); o.updateMatrix();
        im.setMatrixAt(n, o.matrix);
        im.setColorAt(n, tc.setRGB(0.8 + 0.35 * t, 0.86 + 0.24 * t, 0.78 + 0.3 * (1 - t)));
      });
      im.castShadow = im.receiveShadow = true;
      im.computeBoundingSphere();
      g.add(im);
    }
    return g;
  }, [-960, 960, -960, 960]);
  world.userData.trees = count;
}

// Karte als Overlay (nur der untere Teil mit dem Anwesen; Uebersicht und Titel oben weggelassen)
const MAP_Y0 = 560;
const mapTex = new THREE.TextureLoader().load("karten/aussenanlage.webp");
mapTex.colorSpace = THREE.SRGBColorSpace;
mapTex.anisotropy = 8;
mapTex.repeat.set(1, (MAP_H - MAP_Y0) / MAP_H);
const mapMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_W * SC, (MAP_H - MAP_Y0) * SC).rotateX(-Math.PI / 2).rotateY(Math.PI / 2),
  new THREE.MeshBasicMaterial({ map: mapTex, transparent: true, opacity: 0.9, depthWrite: false }));
{ const [cx, cz] = mp(MAP_W / 2, (MAP_Y0 + MAP_H) / 2); mapMesh.position.set(cx, HILL + 0.06, cz); }
mapMesh.userData.noLift = true;
scene.add(mapMesh);
