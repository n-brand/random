// Wayne Manor 3D – Wald, Hoehenfeld und Gelaendenetz, Seen, Meer, Wald, Karten-Overlay
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Walddichte 0..1 (North Forest, West Forest, sonst verstreute Gruppen)
function forestD(x, z) {
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
  for (let k = 0; k < TN1 * TN1; k++) {
    const x = pos[k * 3], h = pos[k * 3 + 1], z = pos[k * 3 + 2];
    c.copy(cMeadowA).lerp(cMeadowB, vnoise(x / 40, z / 40));
    c.lerp(cLawn, 0.7 * Math.max(sst(40, 0, siteDist(x, z)), inLawn(x, z) ? 1 : 0));
    c.lerp(cForest, forestD(x, z) * 0.8);
    const dl = Math.min(...LAKES.map(L => lakeD(L, x, z)));
    if (dl < 1.15) c.lerp(cSand, sst(1.15, 1.0, dl));
    { const sdd = seaD(x, z), nn = vnoise(x / 9 + 3, z / 9 + 1); c.lerp(cRock, sst(-10 - 16 * nn, -2 - 4 * nn, sdd) * (0.55 + 0.45 * vnoise(x / 3, z / 3))); }   // Fels zur Kante hin, unregelmaessig
    if (h < WATER_Y) c.lerp(cBed, sst(WATER_Y, WATER_Y - 1, h));
    c.lerp(cRock, Math.max(sst(0.86, 0.7, nrm[k * 3 + 1]), sst(90, 160, h)));
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
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const terrain = new THREE.Mesh(g, M(0xffffff, { map: grassTex, vertexColors: true, roughness: 1 }));
  terrain.receiveShadow = terrain.castShadow = true;
  scene.add(terrain);
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
  for (let t = -2600; t <= 2600; t += Math.abs(t) < 1400 ? 4 : 25) {
    const [ax, az] = P(coastS(t) - 0.5 * Math.hypot(1, coastSlope(t)), t), [bx, bz] = P(3200, t);
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
    list.push([x, terrainH(x, z) - size * 0.35, z, size, rr(), rr(), rr(), rr()]);
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
// Wald: Nadel- und Laubbaeume als InstancedMesh, in 400-m-Felder geteilt (Sichtpruefung je Feld, auch fuer Schatten)
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
    const key = Math.floor(x / 400) + "," + Math.floor(z / 400);
    if (!cells.has(key)) cells.set(key, { con: [], dec: [] });
    cells.get(key)[con ? "con" : "dec"].push([x, y - 0.2, z, s, rot * Math.PI * 2, tint]);
    if (Math.hypot(x, z) < LIMIT_WORLD + 10) circles.push([x, z, (con ? 0.32 : 0.4) * s]);
  }
  const o = new THREE.Object3D(), tc = new THREE.Color();
  let count = 0;
  for (const cell of cells.values()) for (const [type, geo] of [["con", conGeo], ["dec", decGeo]]) {
    const list = cell[type];
    if (!list.length) continue;
    const im = new THREE.InstancedMesh(geo, treeMat, list.length);
    list.forEach(([x, y, z, s, r, t], i) => {
      o.position.set(x, y, z); o.rotation.set(0, r, 0); o.scale.set(s, s * (0.9 + t * 0.25), s); o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, tc.setRGB(0.8 + 0.35 * t, 0.86 + 0.24 * t, 0.78 + 0.3 * (1 - t)));
    });
    im.castShadow = im.receiveShadow = true;
    im.computeBoundingSphere();
    scene.add(im);
    count += list.length;
  }
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
