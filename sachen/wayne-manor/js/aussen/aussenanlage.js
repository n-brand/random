// Wayne Manor 3D – Aussenanlage: Rondell, Veranda, Labyrinth, Pool, Plaetze, Wege
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Aussenanlage (Schritt 4) =====================
// Strassenbelaege als Texturen: u = quer (0..1), v = laengs (eine Periode)
const roadTex = {
  road: canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = "#4a4c50"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = 60 + r1() * 40; g.fillStyle = `rgba(${v},${v},${v + 4},.5)`; g.fillRect(r1() * w, r1() * h, 1.5, 1.5); }
    g.fillStyle = "#e8e4d8"; g.fillRect(4, 0, 3, h); g.fillRect(w - 7, 0, 3, h);
    g.fillStyle = "#e0c341"; g.fillRect(w / 2 - 2, 0, 4, h * 0.55);
  })
};
for (const t of Object.values(roadTex)) t.repeat.set(1, 1);
const roadPeriod = { road: 6 };
// Band entlang einer Kurve, folgt dem Gelaende
// o.t0/o.t1 = Abschnitt (0..1), o.off = seitlicher Versatz, o.y(d) = feste Hoehe statt Gelaende (Rampe), o.wall = senkrechtes Band von o.y bis o.top
function ribbon(curve, len, w, material, period, lift = 0.07, o = {}) {
  const t0 = o.t0 ?? 0, t1 = o.t1 ?? 1, off = o.off ?? 0, n = Math.max(1, Math.ceil((t1 - t0) * len)), pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + (t1 - t0) * i / n, p = curve.getPointAt(t), tg = curve.getTangentAt(t), nl = Math.hypot(tg.x, tg.z), nx = -tg.z / nl, nz = tg.x / nl;
    for (const sd of [-1, 1]) {
      const lat = o.wall ? off : off + w / 2 * sd, x = p.x + nx * lat, z = p.z + nz * lat;
      const y = o.wall ? (sd < 0 ? o.y(t * len) - 0.2 : o.top) : o.y ? o.y(t * len) + 0.02 : Math.max(terrainH(x, z), terrainH(p.x + nx * off, p.z + nz * off)) + lift + 0.25 * sst(5, 40, siteDist(x, z));   // in den Huegeln etwas hoeher (Gelaende zwischen den Stuetzpunkten)
      pos.push(x, y, z); uv.push(sd < 0 ? 0 : 1, t * len / period);
    }
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material); m.receiveShadow = true; m.userData.keep = true;
  if (!o.y) m.userData.noLift = true;                                     // liegt schon auf dem Gelaende (inkl. Plateau)
  scene.add(m);
  return m;
}

// Rondell mit Brunnen, Vorplatz, zwei Baeume (Rondell-Mitte Karte 500 / 1000, aussen 70 px, Brunnen 30 px)
const [RX, RZ] = mp(500, 1000), RON = { x: RX, z: RZ, r: 70 * SC };
const gravelMat = flatMat({ color: 0xc9bc9c });
{
  const disc = new THREE.Mesh(new THREE.RingGeometry(FOUNT.r - 0.1, RON.r, 64).rotateX(-Math.PI / 2), gravelMat); disc.position.set(RON.x, 0.05, RON.z); disc.receiveShadow = true; scene.add(disc);
  const [fx0] = mp(0, 893), [fx1] = mp(0, 965), fw = 140 * SC;
  const fore = new THREE.Mesh(new THREE.PlaneGeometry(fx1 - fx0, fw).rotateX(-Math.PI / 2), gravelMat); fore.position.set((fx0 + fx1) / 2, 0.05, 0); fore.receiveShadow = true; scene.add(fore);
  const fr = 30 * SC;                                                     // Brunnen-Radius ca. 6 m
  const ring = new THREE.Mesh(new THREE.RingGeometry(fr + 0.4, fr + 0.8, 64).rotateX(-Math.PI / 2), flatMat({ color: 0x8c8676 })); ring.position.set(RON.x, 0.06, RON.z); scene.add(ring);
  // Brunnen: niedriger Rand (begehbar), Becken 1,4 m tief zum Hineingehen, Sockel und zwei Schalen
  const F = FOUNT, basin = M(0x9d978a, { roughness: 0.9, side: THREE.DoubleSide });
  { const o = new THREE.Mesh(new THREE.CylinderGeometry(F.r, F.r, F.rim + 0.1, 48, 1, true), stoneLight); o.position.set(F.x, (F.rim - 0.1) / 2, F.z); o.castShadow = o.receiveShadow = true; world.add(o);
    const i = new THREE.Mesh(new THREE.CylinderGeometry(F.r - 0.4, F.r - 0.4, F.rim - F.floor, 48, 1, true), basin); i.position.set(F.x, (F.rim + F.floor) / 2, F.z); world.add(i);
    const t = new THREE.Mesh(new THREE.RingGeometry(F.r - 0.4, F.r, 48).rotateX(-Math.PI / 2), stoneLight); t.position.set(F.x, F.rim, F.z); world.add(t);
    const b = new THREE.Mesh(new THREE.CircleGeometry(F.r - 0.4, 48).rotateX(-Math.PI / 2), basin); b.position.set(F.x, F.floor, F.z); world.add(b); }
  const water = new THREE.Mesh(new THREE.CircleGeometry(F.r - 0.4, 48).rotateX(-Math.PI / 2), mat.water); water.position.set(F.x, F.water, F.z); scene.add(water);
  cyl(1.0, 1.4, F.water - F.floor + 0.2, stoneLight, F.x, (F.floor + F.water + 0.2) / 2, F.z, world, 20);
  circles.push([F.x, F.z, 1.4, 3.4]);
  cyl(1.0, 1.4, 1.2, stoneLight, RON.x, 1.0, RON.z, world, 20);
  cyl(2.2, 0.8, 0.45, stoneLight, RON.x, 1.8, RON.z, world, 24);
  cyl(0.35, 0.5, 1.2, stoneLight, RON.x, 2.5, RON.z, world, 12);
  cyl(1.1, 0.4, 0.3, stoneLight, RON.x, 3.2, RON.z, world, 20);
  const jet = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.45, roughness: 0.1 }));
  jet.position.set(RON.x, 4.1, RON.z); jet.rotation.x = Math.PI; scene.add(jet);
  for (const [x, z] of [mp(445, 940), mp(550, 942)]) {
    cyl(0.25, 0.35, 3, mat.bark, x, 1.5, z, world, 8);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 1), mat.leaves); crown.position.set(x, 4.6, z); crown.scale.set(1, 0.85, 1); crown.castShadow = true; world.add(crown);
    circles.push([x, z, 0.4]);
  }
}

// Veranda nordlich vom Westfluegel (Holzdeck, Pfosten, Dach) und Weg zur Nordtuer
{
  const [vx0, vz1] = mp(642, 705), [vx1, vz0] = mp(688, 862);           // x -58..-26.6, z -28.4..-37.6
  const x0 = Math.min(vx0, vx1), x1 = Math.max(vx0, vx1), z0 = Math.min(vz0, vz1), z1 = Math.max(vz0, vz1);
  B(x0, x1, 0, 0.42, z0, z1, mat.floorWood);
  const [, sz] = mp(706, 0);
  B(x0 + 1, x1 - 1, 0, 0.21, sz, z0, mat.floorWood);                    // breite Stufe (Streifen auf der Karte)
  for (let x = x0 + 0.4; x <= x1 - 0.3; x += (x1 - x0 - 0.8) / 8) for (const z of [z0 + 0.4, z1 - 0.4]) { cyl(0.15, 0.15, 3.4, mat.white, x, 0.42 + 1.7, z, world, 8); circles.push([x, z, 0.2]); }
  B(x0 - 0.4, x1 + 0.4, 3.8, 4.1, z0 - 0.4, z1 + 0.4, mat.slate, false);
  B(x0 - 0.4, x1 + 0.4, 3.6, 3.8, z0 - 0.4, z1 + 0.4, mat.white, false);
  const dN = DOORS[1], pc = (dN.a0 + dN.a1) / 2, pz = dN.line - 1.2;
  const path = new THREE.Mesh(new THREE.PlaneGeometry(3, pz - z1).rotateX(-Math.PI / 2), gravelMat); path.position.set(pc, 0.05, (z1 + pz) / 2); scene.add(path);
  // Weg Veranda -> Wayne Gardens (Sued-Eingang des Labyrinths)
  const gz = mp(725, 0)[1];
  const p2 = new THREE.Mesh(new THREE.PlaneGeometry(3, sz - gz).rotateX(-Math.PI / 2), gravelMat); p2.position.set(pc, 0.05, (sz + gz) / 2); scene.add(p2);
}

// Wayne Gardens: Heckenlabyrinth (Zellen 4 m, Hecken 2,3 m hoch), Eingaenge Ost und West
{
  const C = 2.6, HH = 2.3, T = 0.6, [GX0] = mp(0, 637), GZ0 = mp(810, 0)[1], NX = Math.round((mp(0, 905)[0] - GX0) / C), NZ = Math.round((mp(725, 0)[1] - GZ0) / C);
  const SOUTH = Math.floor(((DOORS[1].a0 + DOORS[1].a1) / 2 - GX0) / C), MID = Math.floor(NZ / 2);
  const hedge = M(0x2f6a32, { roughness: 1, map: texClone(grassTex, 1 / 2, 1 / 2) });
  const mr = rng(2024), seen = new Uint8Array(NX * NZ), wallE = new Uint8Array(NX * NZ).fill(1), wallS = new Uint8Array(NX * NZ).fill(1);
  const stack = [[SOUTH, NZ - 1]]; seen[(NZ - 1) * NX + SOUTH] = 1;
  while (stack.length) {
    const [cx, cz] = stack[stack.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [cx + dx, cz + dz, dx, dz]).filter(([x, z]) => x >= 0 && z >= 0 && x < NX && z < NZ && !seen[z * NX + x]);
    if (!nb.length) { stack.pop(); continue; }
    const [nx, nz, dx, dz] = nb[Math.floor(mr() * nb.length)];
    if (dx === 1) wallE[cz * NX + cx] = 0; else if (dx === -1) wallE[nz * NX + nx] = 0; else if (dz === 1) wallS[cz * NX + cx] = 0; else wallS[nz * NX + nx] = 0;
    seen[nz * NX + nx] = 1; stack.push([nx, nz]);
  }
  const hb = (x0, x1, z0, z1) => B(x0, x1, 0, HH, z0, z1, hedge);
  // Rand; Eingaenge: Mitte Ost und West, Sued beim Weg von der Veranda
  hb(GX0 - T / 2, GX0 + NX * C + T / 2, GZ0 - T / 2, GZ0 + T / 2);
  hb(GX0 - T / 2, GX0 + SOUTH * C, GZ0 + NZ * C - T / 2, GZ0 + NZ * C + T / 2); hb(GX0 + (SOUTH + 1) * C, GX0 + NX * C + T / 2, GZ0 + NZ * C - T / 2, GZ0 + NZ * C + T / 2);
  for (const x of [GX0, GX0 + NX * C]) { hb(x - T / 2, x + T / 2, GZ0, GZ0 + MID * C); hb(x - T / 2, x + T / 2, GZ0 + (MID + 1) * C, GZ0 + NZ * C); }
  for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) {
    const px = GX0 + x * C, pz = GZ0 + z * C;
    if (x < NX - 1 && wallE[z * NX + x]) hb(px + C - T / 2, px + C + T / 2, pz - T / 2, pz + C + T / 2);
    if (z < NZ - 1 && wallS[z * NX + x]) hb(px - T / 2, px + C + T / 2, pz + C - T / 2, pz + C + T / 2);
  }
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(NX * C, NZ * C).rotateX(-Math.PI / 2), gravelMat); lawn.position.set(GX0 + NX * C / 2, 0.04, GZ0 + NZ * C / 2); scene.add(lawn);
}

// Pool mit Steinterrasse, Poolhaus, Whirlpool
{
  // Pool: Becken 1,7 m tief (Gelaende ausgeschnitten), breite Steinterrasse verdeckt den Schnittrand, Stufen an der Ostseite
  const { x0, x1, z0, z1 } = POOL, d = 3.2, tile = M(0x3d9fc9, { roughness: 0.4 });
  for (const [a, b, c, e] of [[x0 - d, x1 + d, z0 - d, z0], [x0 - d, x1 + d, z1, z1 + d], [x0 - d, x0, z0, z1], [x1, x1 + d, z0, z1]]) B(a, b, -0.2, 0.3, c, e, stoneLight);
  B(x0, x1, POOL.floor - 0.2, POOL.floor, z0, z1, tile);
  B(x0, x1, POOL.floor, 0.3, z0 - 0.2, z0, tile); B(x0, x1, POOL.floor, 0.3, z1, z1 + 0.2, tile); B(x0 - 0.2, x0, POOL.floor, 0.3, z0, z1, tile); B(x1, x1 + 0.2, POOL.floor, 0.3, z0, z1, tile);
  const pm = (z0 + z1) / 2;
  [-0.25, -0.7, -1.15].forEach((top, k) => B(x1 - (k + 1) * 0.45, x1 - k * 0.45, POOL.floor, top, pm - 1.2, pm + 1.2, tile));
  { const w = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), mat.water); w.position.set((x0 + x1) / 2, POOL.water, (z0 + z1) / 2); w.userData.keep = true; scene.add(w); }
  // Poolhaus
  const [hx0, hz1] = mp(58, 975), [hx1, hz0] = mp(83, 1015);
  const ax0 = Math.min(hx0, hx1), ax1 = Math.max(hx0, hx1), az0 = Math.max(Math.min(hz0, hz1), z1 + 1.8), az1 = Math.max(hz0, hz1);
  B(ax0, ax1, 0, 3.6, az0, az1, mat.facade);
  B(ax0 - 0.3, ax1 + 0.3, 3.6, 3.9, az0 - 0.3, az1 + 0.3, stoneLight, false);
  B((ax0 + ax1) / 2 - 0.6, (ax0 + ax1) / 2 + 0.6, 0, 2.3, az0 - 0.05, az0, mat.trim, false);
  // Whirlpool (Kreis neben dem Poolhaus)
  const [wx, wz] = mp(78, 1030);
  cyl(1.6, 1.6, 0.8, mat.wood, wx, 0.4, wz, world, 24);
  const ww = new THREE.Mesh(new THREE.CircleGeometry(1.35, 24).rotateX(-Math.PI / 2), mat.water); ww.position.set(wx, 0.78, wz); scene.add(ww);
  circles.push([wx, wz, 1.6, 0.8]);
}

// Basketball- und Tennisplatz mit Zaun (Tor zur Seite des Wegs)
{
  const [cx0, cz1] = mp(50, 812), [cx1, cz0] = mp(140, 893);            // ca. 16 x 18 m
  const x0 = Math.min(cx0, cx1), x1 = Math.max(cx0, cx1), z0 = Math.min(cz0, cz1), z1 = Math.max(cz0, cz1), zm = mp(90, 0)[1];
  const courtTex = (bg, draw) => { const t = canvasTex(512, 256, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = "#f4f4f0"; g.lineWidth = 3; draw(g, w, h); }); t.repeat.set(1, 1); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
  const tennis = courtTex("#3f7d5a", (g, w, h) => { g.fillStyle = "#3a6ea8"; g.fillRect(70, 40, w - 140, h - 80); g.strokeRect(70, 40, w - 140, h - 80); g.strokeRect(70, 62, w - 140, h - 124); g.beginPath(); g.moveTo(w / 2, 40); g.lineTo(w / 2, h - 40); g.moveTo(150, h / 2); g.lineTo(w - 150, h / 2); g.moveTo(150, 62); g.lineTo(150, h - 62); g.moveTo(w - 150, 62); g.lineTo(w - 150, h - 62); g.stroke(); });
  const bball = courtTex("#b5643a", (g, w, h) => { g.strokeRect(20, 20, w - 40, h - 40); g.beginPath(); g.moveTo(w / 2, 20); g.lineTo(w / 2, h - 20); g.stroke(); g.beginPath(); g.arc(w / 2, h / 2, 32, 0, 7); g.stroke(); for (const s of [0, 1]) { const x = s ? w - 20 : 20; g.strokeRect(s ? x - 90 : x, h / 2 - 34, 90, 68); g.beginPath(); g.arc(x, h / 2, 110, s ? Math.PI / 2 : -Math.PI / 2, s ? Math.PI * 1.5 : Math.PI / 2); g.stroke(); } });
  const plate = (za, zb, tex) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, zb - za).rotateX(-Math.PI / 2), flatMat({ map: tex })); m.position.set((x0 + x1) / 2, 0.05, (za + zb) / 2); m.receiveShadow = true; scene.add(m); };
  plate(zm, z1, tennis); plate(z0, zm, bball);
  B((x0 + x1) / 2 - 0.05, (x0 + x1) / 2 + 0.05, 0, 1.0, zm + 0.8, z1 - 0.8, mat.dark, false);         // Netz
  for (const s of [-1, 1]) {                                                                              // Koerbe
    const x = s < 0 ? x0 + 1.2 : x1 - 1.2, z = (z0 + zm) / 2;
    cyl(0.12, 0.12, 3.6, mat.dark, x, 1.8, z, world, 8); circles.push([x, z, 0.15]);
    B(x + s * -0.6 - 0.05, x + s * -0.6 + 0.05, 2.9, 4.0, z - 0.9, z + 0.9, mat.white, false);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 6, 16).rotateX(Math.PI / 2), mat.red); hoop.position.set(x + s * -0.95, 3.05, z); world.add(hoop);
  }
  // Zaun: Pfosten, Gitter (durchscheinend), Oeffnung an der Ostseite zum Weg
  const fence = M(0x2b3a2e, { transparent: true, opacity: 0.35, side: THREE.DoubleSide, roughness: 0.6 });
  const gx = mp(0, 872)[0];                                                                               // Tor an der Nordseite, wo der Weg ankommt
  const fz = (a, b, z) => { B(a, b, 0, 3, z - 0.04, z + 0.04, fence, false); S(a, b, 0, 3, z - 0.1, z + 0.1); };
  fz(x0, gx - 1.2, z0); fz(gx + 1.2, x1, z0); fz(x0, x1, z1);
  for (const x of [x0, x1]) { B(x - 0.04, x + 0.04, 0, 3, z0, z1, fence, false); S(x - 0.1, x + 0.1, 0, 3, z0, z1); }
  for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 8) for (const z of [z0, z1]) cyl(0.06, 0.06, 3.1, mat.dark, x, 1.55, z, world, 6);
}
// Wege: Plaetze -> Suedtuer -> Pool (Kiesband)
{
  const walk = (pts, w) => { const c = new THREE.CatmullRomCurve3(pts.map(([px, py]) => { const [x, z] = mp(px, py); return new THREE.Vector3(x, 0, z); })); ribbon(c, c.getLength(), w, gravelMat, 4, 0.06); };
  walk([[140, 872], [158, 876], [163, 900], [163, 950], [156, 975], [142, 985]], 2);
  walk([[163, 905], [180, 906], [197, 906]], 2);
  walk([[638, 940], [655, 932], [700, 912], [760, 905], [810, 905], [818, 885]], 2);                        // Nordostfluegel -> Wayne Gardens
}
