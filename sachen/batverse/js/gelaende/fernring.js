// Batverse – Fernring (T2, Plan Kacheln K5): grober Horizont ausserhalb des Gelaende-Rasters (±1500 m) bis ca. 3,6 km
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// 40-m-Raster ±FR_R, Hoehen aus genH0 (gleiche Formel wie das Gelaende: Berge, Kueste, Meeresgrund). Innerhalb des Rasters ±1500 m liegt der Ring
// 1,5 m tiefer unter dem echten Gelaende (kein Flimmern am Uebergang). Gebaut im Kachel-Zeitbudget (eine Reihe je Schritt), nicht beim Start.
// Sichtbar macht ihn der Ferndunst (FAR_K in kacheln.js): bis zur Ladegrenze wie bisher Nebel, dahinter dichter werdender Dunst bis FAR_K x Ladegrenze.
const FR_R = 4400, FR_S = 40, FR_N = FR_R * 2 / FR_S + 1, FR_IN = T_A + T_B;
const FERN = { row: 0, H: new Float32Array(FR_N * FR_N), mesh: null, ms: 0 };
TILES.tasks.push({
  plan() {},
  step() {
    if (FERN.mesh || TILES.startup) return false;                        // nicht im ersten Bild (Startzeit bleibt gleich)
    const t0 = performance.now(), j = FERN.row, z = -FR_R + j * FR_S;
    for (let i = 0; i < FR_N; i++) { const x = -FR_R + i * FR_S, inner = Math.abs(x) < FR_IN && Math.abs(z) < FR_IN;
      FERN.H[j * FR_N + i] = inner && Math.abs(x) < FR_IN - 2 * FR_S && Math.abs(z) < FR_IN - 2 * FR_S ? 0 : genH0(x, z) - (inner ? 1.5 : 0); }
    FERN.ms += performance.now() - t0;
    if (++FERN.row === FR_N) fernBuild();
    return true;
  },
});
function fernBuild() {
  const n = FR_N, P = new Float32Array(n * n * 3), Cc = new Float32Array(n * n * 3), U = new Float32Array(n * n * 2), I = [];
  const C = h => new THREE.Color(h), cA = C(0x5b8c3c), cB = C(0x739c47), cF = C(0x3b6430), cRock = C(0x85827c), cBed = C(0x5d5a46), cSnow = C(0xf2f4f6), c = new THREE.Color();
  const H = (i, j) => FERN.H[Math.max(0, Math.min(n - 1, j)) * n + Math.max(0, Math.min(n - 1, i))];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const q = j * n + i, x = -FR_R + i * FR_S, z = -FR_R + j * FR_S, h = H(i, j);
    P.set([x, h, z], q * 3); U[q * 2] = x / 10; U[q * 2 + 1] = -z / 10;
    const sl = Math.hypot(H(i + 1, j) - H(i - 1, j), H(i, j + 1) - H(i, j - 1)) / (2 * FR_S);   // Steigung (tan)
    c.copy(cA).lerp(cB, vnoise(x / 400, z / 400)).lerp(cF, 0.55 * sst(0.45, 0.7, vnoise(x / 300 + 7, z / 300 + 3)));   // Wiese, dunklere Waldflaechen
    c.lerp(cRock, Math.max(sst(0.45, 0.9, sl), sst(90, 160, h))).lerp(cSnow, sst(880, 1000, h + 60 * vnoise(x / 90, z / 90)));
    if (h < SEA_Y + 2) c.lerp(cBed, sst(SEA_Y + 2, SEA_Y - 2, h));
    Cc.set([c.r, c.g, c.b], q * 3);
  }
  const inner = (i, j) => Math.abs(-FR_R + i * FR_S) < FR_IN - FR_S && Math.abs(-FR_R + j * FR_S) < FR_IN - FR_S;   // ganz unter dem Gelaende-Raster
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
    if (inner(i, j) && inner(i + 1, j) && inner(i, j + 1) && inner(i + 1, j + 1)) continue;
    { const x = -FR_R + i * FR_S, z = -FR_R + j * FR_S; if (inGothamR(x, z) && inGothamR(x + FR_S, z + FR_S)) continue; }   // Gotham: eigenes Raster (G1b)
    const a = j * n + i, b = a + 1, cc = a + n, d = cc + 1; I.push(a, cc, b, b, cc, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("color", new THREE.BufferAttribute(Cc, 3)); g.setAttribute("uv", new THREE.BufferAttribute(U, 2));
  g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
  FERN.mesh = new THREE.Mesh(g, M(0xffffff, { map: grassTex, vertexColors: true, roughness: 1 }));
  FERN.mesh.name = "Fernring"; FERN.mesh.userData.keep = true; FERN.mesh.userData.noLift = true; FERN.tris = I.length / 3;
  scene.add(FERN.mesh);
}

// ---- Insel-Welt (I2/I3, 2026-11-23): Inselring = grobes Gelaende (64 m) ausserhalb des Fernring-Quadrats ueber die ganze Insel, Hoehen aus genH0 (folgt ueber seaD der
// Inselkueste: Huegel, Berge, Steilkueste, Meeresgrund). Zellen, deren Ecken alle tief unter dem Meer liegen, fallen weg (dort nur Meer). Gebaut im Kachel-Zeitbudget
// (eine Reihe je Schritt) nach dem Fernring. Meer rundherum: eigene Flaeche ueber das ganze Inselgebiet (ohne die heutige Welt, dort liegt das alte Meer), etwas nach
// hinten versetzt (polygonOffset), damit es mit dem alten Meer nicht flimmert. terrainH liest ausserhalb des Fernrings dieses Raster (gotham-raster.js).
const IR = INSEL ? (() => { const S = 64, x0 = Math.floor(INSEL.x0 / S) * S, z0 = Math.floor(INSEL.z0 / S) * S, nx = Math.ceil((INSEL.x1 - x0) / S) + 1, nz = Math.ceil((INSEL.z1 - z0) / S) + 1;
  return { S, x0, z0, nx, nz, H: new Float32Array(nx * nz), row: 0, mesh: null, sea: null }; })() : null;
const irInnen = (x, z) => Math.abs(x) < FR_R - FR_S && Math.abs(z) < FR_R - FR_S;   // vom Fernring bedeckt
if (IR) TILES.tasks.push({
  plan() {},
  step() {
    if (IR.mesh || !FERN.mesh) return false;                             // nach dem Fernring
    const t0 = performance.now(); while (IR.row < IR.nz && performance.now() - t0 < 4) { const k = IR.row, z = IR.z0 + k * IR.S;
      for (let i = 0; i < IR.nx; i++) { const x = IR.x0 + i * IR.S; IR.H[k * IR.nx + i] = irInnen(x, z) ? fernTerrainH(x, z) - 1.5 : genH0(x, z); } IR.row++; }
    if (IR.row === IR.nz) irBuild(); return true;
  },
});
function inselTerrainH(x, z) { if (!IR || !IR.mesh) return genH0(x, z); const fx = (x - IR.x0) / IR.S, fz = (z - IR.z0) / IR.S, i = Math.max(0, Math.min(IR.nx - 2, Math.floor(fx))), k = Math.max(0, Math.min(IR.nz - 2, Math.floor(fz))), u = fx - i, v = fz - k;
  const H = (a, b) => IR.H[b * IR.nx + a], a = H(i, k), b = H(i + 1, k), c = H(i, k + 1); if (u + v <= 1) return a + (b - a) * u + (c - a) * v; const d = H(i + 1, k + 1); return d + (c - d) * (1 - u) + (b - d) * (1 - v); }
function irBuild() {
  const { nx, nz, S, x0, z0 } = IR, n = nx * nz, P = new Float32Array(n * 3), Cc = new Float32Array(n * 3), U = new Float32Array(n * 2), I = [];
  const C = h => new THREE.Color(h), cA = C(0x5b8c3c), cB = C(0x739c47), cF = C(0x3b6430), cRock = C(0x85827c), cBed = C(0x5d5a46), cSnow = C(0xf2f4f6), cSand = C(0xcdbb8c), c = new THREE.Color();
  const H = (i, k) => IR.H[Math.max(0, Math.min(nz - 1, k)) * nx + Math.max(0, Math.min(nx - 1, i))];
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) { const q = k * nx + i, x = x0 + i * S, z = z0 + k * S, h = H(i, k);
    P.set([x, h, z], q * 3); U[q * 2] = x / 10; U[q * 2 + 1] = -z / 10;
    const sl = Math.hypot(H(i + 1, k) - H(i - 1, k), H(i, k + 1) - H(i, k - 1)) / (2 * S);
    c.copy(cA).lerp(cB, vnoise(x / 400, z / 400)).lerp(cF, 0.55 * sst(0.45, 0.7, vnoise(x / 300 + 7, z / 300 + 3)));   // wie der Fernring (ohne Wald: nur dunklere Wiese)
    c.lerp(cRock, Math.max(sst(0.45, 0.9, sl), sst(90, 160, h))).lerp(cSnow, sst(880, 1000, h + 60 * vnoise(x / 90, z / 90))); c.lerp(cSand, inselStrand(x, z) * sst(SEA_Y + 5, SEA_Y + 2.5, h)); if (h < SEA_Y + 0.5) c.lerp(cBed, sst(SEA_Y + 0.5, SEA_Y - 3, h));   // Sand am Strand
    Cc.set([c.r, c.g, c.b], q * 3); }
  for (let k = 0; k < nz - 1; k++) for (let i = 0; i < nx - 1; i++) { const x = x0 + i * S, z = z0 + k * S;
    if (irInnen(x, z) && irInnen(x + S, z) && irInnen(x, z + S) && irInnen(x + S, z + S)) continue;   // Fernring
    if (Math.max(H(i, k), H(i + 1, k), H(i, k + 1), H(i + 1, k + 1)) < SEA_Y - 6) continue;             // tiefes Meer: nur Wasserflaeche
    const a = k * nx + i, b = a + 1, cc = a + nx, d = cc + 1; I.push(a, cc, b, b, cc, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("color", new THREE.BufferAttribute(Cc, 3)); g.setAttribute("uv", new THREE.BufferAttribute(U, 2));
  g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
  IR.mesh = new THREE.Mesh(g, M(0xffffff, { map: grassTex, vertexColors: true, roughness: 1 })); IR.mesh.name = "Inselring"; IR.mesh.userData.keep = true; IR.mesh.userData.noLift = true; IR.tris = I.length / 3; IR.mesh.receiveShadow = true;
  scene.add(IR.mesh);
  // Meer: 800-m-Zellen ueber das Inselgebiet, ohne Zellen ganz in der heutigen Welt
  const W = 800, sp = [], si = [], su = [], R0 = LIMIT_WORLD - 300; for (let z = x0 === x0 ? z0 : 0; z < z0 + (nz - 1) * S; z += W) for (let x = x0; x < x0 + (nx - 1) * S; x += W) {
    const cs = [[x, z], [x + W, z], [x, z + W], [x + W, z + W]]; if (cs.every(([a, b]) => Math.hypot(a, b) < R0)) continue;
    const b0 = sp.length / 3; for (const [a, b] of cs) { sp.push(a, 0, b); su.push(a / 10, -b / 10); } si.push(b0, b0 + 2, b0 + 1, b0 + 1, b0 + 2, b0 + 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute("uv", new THREE.Float32BufferAttribute(su, 2)); sg.setIndex(si); sg.computeVertexNormals();
  const sm = mat.sea.clone(); sm.polygonOffset = true; sm.polygonOffsetFactor = 2; sm.polygonOffsetUnits = 4;
  IR.sea = new THREE.Mesh(sg, sm); IR.sea.position.y = SEA_Y; IR.sea.name = "Inselmeer"; IR.sea.userData.keep = true; IR.sea.userData.noLift = true; IR.sea.receiveShadow = true; scene.add(IR.sea);
}
