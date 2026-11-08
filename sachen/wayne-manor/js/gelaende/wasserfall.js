// Wayne Manor 3D – Wasserfall, Bach, Teich, Wasser-Animation
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Wasserfall (A7) =====================
// Bach in der Rinne auf der Erweiterung, Fall ueber die Felswand bei WF_LIP (ca. 25 m) in den Teich, Wasservorhang mit laufender Textur
// (zwei Schichten), Gischt-Nebel (Sprites), Schaum auf dem Teich, Felsbrocken. Der Vorhang faellt nach aussen: dahinter Platz fuer A8.
const waterAnim = [];
// B7: Wellen auf Meer/Hoehle und Seen/Pool bewegen sich langsam
mat.water.normalMap = waveNormals(0.1); mat.water.normalScale = new THREE.Vector2(0.45, 0.45); mat.water.needsUpdate = true;
waterAnim.push([mat.sea.normalMap, 0.05], [mat.water.normalMap, 0.04]);
{
  const bed = HILL - 0.55;
  // Bach: Wasserband in der Rinne
  const sc = new THREE.CatmullRomCurve3(STREAM.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
  const streamTex = canvasTex(64, 256, (g, w, h) => {
    const rr = rng(12); g.fillStyle = "#3f7f96"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(225,240,250,${0.08 + rr() * 0.25})`; g.fillRect(rr() * w, rr() * h, 1 + rr() * 2, 6 + rr() * 26); }
  });
  const streamMat = M(0xffffff, { map: streamTex, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.88 });
  ribbon(sc, sc.getLength(), 2.6, streamMat, 6, 0, { y: () => bed });
  waterAnim.push([streamTex, -0.55]);                                     // fliesst zur Kante
  // Vorhang: von der Kante (Richtung der Felswand) nach aussen gekruemmt bis zum Teich
  const [lx, lz] = WF_LIP, dirX = -10 / Math.hypot(10, 57), dirZ = -57 / Math.hypot(10, 57), outX = -0.985, outZ = 0.173;
  const fallTex = canvasTex(128, 256, (g, w, h) => {
    const rr = rng(33); g.clearRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const x = rr() * w, a = 0.1 + rr() * 0.45, l = 20 + rr() * 90; const gr = g.createLinearGradient(0, 0, 0, l); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, `rgba(240,248,255,${a})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.save(); g.translate(x, rr() * h); g.fillRect(0, 0, 1 + rr() * 2.5, l); g.restore(); }
  });
  const mkCurtain = (W, push, alpha, speed, ofs) => {
    const nu = 12, nv = 24, pos = [], uv = [], idx = [], top = HILL - 0.5, bot = WATER_Y;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const v = j / nv, u = i / nu - 0.5, o = ofs + 0.4 + push * v ** 1.7 + 0.15 * Math.sin(u * 9 + v * 5), w = W * (1 + 0.35 * v);
      pos.push(lx + dirX * u * w + outX * o, lerp(top, bot, v), lz + dirZ * u * w + outZ * o); uv.push(i / nu, -v * 2.2);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + nu + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const t = fallTex.clone(); t.needsUpdate = true;
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: t, color: 0xe6f3fb, transparent: true, opacity: alpha, depthWrite: false, side: THREE.DoubleSide, roughness: 0.3, emissive: 0x223038, emissiveMap: t }));
    m.userData.keep = true; m.renderOrder = 2; scene.add(m); waterAnim.push([t, speed]);
  };
  mkCurtain(5.5, 3.2, 0.9, 2.4, 0); mkCurtain(6.5, 3.6, 0.55, 1.7, 0.35);
  // Kante: Wasser fliesst ueber den Rand (kurzes Stueck vom Bach bis zum Vorhang)
  // Schaum auf dem Teich am Fuss
  const fx = lx + outX * 3.9, fz = lz + outZ * 3.9;
  const foamTex = canvasTex(128, 128, (g, w, h) => { const rr = rng(8); for (let i = 0; i < 500; i++) { const a = rr() * 6.28, r = rr() ** 0.6 * 60; g.fillStyle = `rgba(255,255,255,${0.15 + rr() * 0.4 * (1 - r / 64)})`; g.beginPath(); g.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 1 + rr() * 3, 0, 7); g.fill(); } });
  const foam = new THREE.Mesh(new THREE.CircleGeometry(5.5, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, depthWrite: false }));
  foam.position.set(fx, WATER_Y + 0.04, fz); foam.userData.keep = true; scene.add(foam); waterAnim.push([foam, 0.15, "spin"]);
  // Gischt-Nebel
  const mistTex = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  for (let k = 0; k < 9; k++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, transparent: true, depthWrite: false, opacity: 0.5 }));
    const a = k / 9 * 6.28; sp.position.set(fx + Math.cos(a) * 2.5, WATER_Y + 1.2 + (k % 3) * 1.4, fz + Math.sin(a) * 3); sp.scale.setScalar(6 + (k % 4) * 1.5); sp.userData.keep = true; scene.add(sp);
    waterAnim.push([sp, k, "mist"]);
  }
  // Felsbrocken am Ufer und unter dem Fall (einige halb im Wasser)
  const geos = [], wr = rng(515);
  for (let k = 0, n = 0; k < 200 && n < 16; k++) {
    const a = wr() * 6.28, L = LAKES.find(q => q.name === "Wasserfall-Teich"), rr = 0.85 + wr() * 0.45;
    const x = L.cx + Math.cos(a) * L.rx * rr, z = L.cz + Math.sin(a) * L.rz * rr, s = 0.8 + wr() * 2.0;
    if (Math.hypot(x - fx, z - fz) < 4.5 || terrainH(x, z) > 1.5 || wfNear(x, z, s + 4)) continue;   // nicht in den Vorhang, nicht an die Wand, nicht auf die Ausfahrt (A8)
    const y = Math.max(terrainH(x, z), WATER_Y - 1.2);
    const g = makeRock(s, s * (0.55 + wr() * 0.3), s * (0.8 + wr() * 0.4), wr(), 3); g.rotateY(wr() * 6); g.translate(x, y + s * 0.15, z); geos.push(g);
    if (terrainH(x, z) > WATER_Y) circles.push([x, z, s * 0.8, y + s]);
    n++;
  }
  for (const [dx, dz, s] of [[1.5, 3.5, 1.6], [-1.2, -3.6, 1.9], [2.6, -1.5, 1.2]]) {   // Brocken direkt am Fuss
    const x = lx + outX * (1.5 + dx) + dirX * dz, z = lz + outZ * (1.5 + dx) + dirZ * dz;
    if (wfNear(x, z, s + 3.5)) continue;                                    // Ausfahrt (A8) frei
    const g = makeRock(s, s * 0.7, s, wr(), 3); g.translate(x, WATER_Y - 0.2, z); geos.push(g);
  }
  // Felsplatten vor der Wand links und rechts vom Fall (Schichten, Vorspruenge); hinter dem Vorhang bleibt frei (A8)
  for (const side of [-1, 1]) for (let k = 0, along = 4.2 + wr() * 1.5; k < 16 && along < 30; k++) {
    const w = 6 + wr() * 5, h = 9 + wr() * 9, dd = 2.2 + wr() * 1.8, y = k % 2 ? 9 + wr() * 6 : -1 + wr() * 3;   // unten und oben versetzt, ueberlappend
    const a = side * (along + w * 0.4), cx0 = lx + dirX * a, cz0 = lz + dirZ * a;
    // Wandfuss hier: so weit nach aussen, bis das Gelaende unter 60 % der Hoehe liegt
    let o = 0; while (o < 8 && terrainH(cx0 + outX * o, cz0 + outZ * o) > y + h * 0.3) o += 0.5;
    const g = makeRock(w / 2, h / 2, dd / 2, wr());
    g.rotateY(-Math.atan2(dirZ, dirX)); g.translate(cx0 + outX * (o - dd * 0.45), y + h / 2, cz0 + outZ * (o - dd * 0.45));
    const P = g.attributes.position; for (let q = 0; q < P.count; q++) if (P.getY(q) > HILL + 0.3) P.setY(q, HILL + 0.3);
    g.computeVertexNormals(); geos.push(g);
    along += w * (k % 2 ? 0.55 + wr() * 0.25 : 0.15);
  }
  if (geos.length) { const m = new THREE.Mesh(mergeGeometries(geos, false), M(0xffffff, { vertexColors: true, map: rockTex, roughness: 0.9 })); m.castShadow = m.receiveShadow = true; m.userData.keep = true; scene.add(m); }
}
