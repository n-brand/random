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
    c.lerp(cRock, Math.max(sst(0.45, 0.9, sl), sst(90, 160, h))).lerp(cSnow, sst(190, 240, h));
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
