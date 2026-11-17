// Batverse – Waterfall Exit bauen: Roehre, Kiesstrasse, Portal, Sackgasse
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Waterfall Exit bauen (A8) =====================
{
  const S3 = WFT.samples, NS3 = S3.length, rockIn = M(0x6f6b64, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1, side: THREE.DoubleSide });
  const tng = i => { const a = S3[Math.max(0, i - 1)], b = S3[Math.min(NS3 - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  // Roehre: Waende und Gewoelbe als Profil entlang des Wegs (bis zum Portal)
  const PROF = [[-WF_HW, -0.2], [-WF_HW, 3.6], [-3.8, 4.7], [-2.6, 5.4], [-0.9, 5.8], [0.9, 5.8], [2.6, 5.4], [3.8, 4.7], [WF_HW, 3.6], [WF_HW, -0.2]];
  const pos = [], uv = [], idx = [];
  const iEnd = S3.findIndex(([, , s]) => s > WFT.sP + 0.6);
  for (let i = 0; i <= iEnd; i++) {
    const [x, z, s] = S3[i], [tx, tz] = tng(i), nx = -tz, nz = tx, y = WFT.y(s);
    const bu = WFT.bulge(s), kw = WFT.hw(s) / WF_HW, kh = WFT.hf(s);   // Grotte: Profil breiter und hoeher, Fels unregelmaessig
    PROF.forEach(([l, h], k) => { const nz2 = bu ? (Math.sin(s * 1.7 + k * 2.3) + Math.sin(s * 0.6 - k * 1.1)) * 0.28 * bu : 0; pos.push(x + nx * (l * kw + Math.sign(l) * nz2), y + (h > 0 ? h * kh + nz2 : h), z + nz * (l * kw + Math.sign(l) * nz2)); uv.push(k / 3 * kw, s / 3); });
    if (i) { const a = (i - 1) * PROF.length, b = i * PROF.length; for (let k = 0; k < PROF.length - 1; k++) idx.push(a + k, b + k, a + k + 1, a + k + 1, b + k, b + k + 1); }
    for (const sd of [-1, 1]) circles.push([x + nx * sd * (WFT.hw(s) - 0.1), z + nz * sd * (WFT.hw(s) - 0.1), 0.6, y + 5.5 * WFT.hf(s)]);   // Wand: jeder Meter, ueberlappend (vorher 2 m Abstand: man lief schraeg hindurch)
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const tube = new THREE.Mesh(g, rockIn); tube.receiveShadow = true; tube.userData.keep = true; scene.add(tube);
  // Fahrbahn (wie der Hoehlentunnel), Boden darunter traegt
  const roadM = flatMat({ map: roadTex.road, side: THREE.DoubleSide });
  // Kiesstrasse am Stueck: Hoehlentunnel (ab Gotham Exit, LY) und Roehre bis zum Portal, 7,5 m breit, Fahrspuren, Rand dunkler
  {
    const gravelT = canvasTex(256, 256, (g, w, h) => {
      const rr = rng(313); g.fillStyle = "#776d61"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const v = 70 + rr() * 90; g.fillStyle = "rgba(" + (v + 10) + "," + (v + 2) + "," + (v - 8) + "," + (0.35 + rr() * 0.5) + ")"; g.beginPath(); g.arc(rr() * w, rr() * h, 0.6 + rr() * 2.2, 0, 7); g.fill(); }
      for (const x of [70, 186]) { const gr = g.createLinearGradient(x - 22, 0, x + 22, 0); gr.addColorStop(0, "rgba(40,36,32,0)"); gr.addColorStop(0.5, "rgba(40,36,32,.28)"); gr.addColorStop(1, "rgba(40,36,32,0)"); g.fillStyle = gr; g.fillRect(x - 22, 0, 44, h); }
      for (const [x0, x1] of [[0, 18], [w - 18, w]]) { const gr = g.createLinearGradient(x0, 0, x1, 0); const a = x0 === 0 ? [".35", "0"] : ["0", ".35"]; gr.addColorStop(0, "rgba(30,28,25," + a[0] + ")"); gr.addColorStop(1, "rgba(30,28,25," + a[1] + ")"); g.fillStyle = gr; g.fillRect(x0, 0, x1 - x0, h); }
    });
    gravelT.repeat.set(1, 1);
    const gravelM = flatMat({ map: gravelT, bumpMap: gravelT, bumpScale: 1.0, side: THREE.DoubleSide });
    const tunPts = TUN_PX.map(([px, py]) => { const [x, z] = caveMp(px, py); return new THREE.Vector3(x, 0, z); });
    const tunLen = new THREE.CatmullRomCurve3(tunPts, false, "centripetal").getLength();
    // Kiesstrasse nur bis zum inneren Ende der Grotte (gA); in der Grotte Fels und Pfuetze, ab dem Portal draussen wieder Kies bis an den Teich
    const wPts = S3.filter(([, , s], i) => s > 4 && s < WFT.gA - 3 && (i % 6 === 0)).map(([x, z]) => new THREE.Vector3(x, 0, z));
    const comb = new THREE.CatmullRomCurve3([...tunPts, ...wPts, (() => { const p = WFT.curve.getPointAt(WFT.gA / WFT.len); return new THREE.Vector3(p.x, 0, p.z); })()], false, "centripetal"), cl = comb.getLength();
    const gr = ribbon(comb, cl, 7.5, gravelM, 7.5, 0, { y: s => s <= tunLen ? LY : WFT.y(Math.min(WFT.gA, s - tunLen)) }); gr.userData.keep = false;
    const gr2 = ribbon(WFT.curve, WFT.len, 7.5, gravelM, 7.5, 0, { y: s => WFT.y(s), t0: (WFT.sP - 0.4) / WFT.len, t1: WFT.sG0 / WFT.len }); gr2.userData.keep = false;   // draussen bis an den Teich
    // Westufer: schmalere Kiesstrasse bis zur Wendeplatte (Sackgasse)
    const gw = ribbon(WFT.curve, WFT.len, 6, gravelM, 7.5, 0, { y: s => WFT.y(s) + 0.12, t0: WFT.sG1 / WFT.len, t1: 1 }); gw.userData.keep = false;
    const [ex, ez] = WFT.end, ey = WFT.y(WFT.len), et = WFT.curve.getTangentAt(1), ea = Math.atan2(et.x, et.z);   // Fahrtrichtung am Ende (nach Westen)
    const disc = new THREE.Mesh(new THREE.CircleGeometry(7, 40).rotateX(-Math.PI / 2), gravelM); disc.position.set(ex, ey + 0.08, ez); disc.receiveShadow = true; scene.add(disc);
    // Abschluss: Holzschranke rot-weiss quer am Ende, Felsbrocken links und rechts, Schild "Sackgasse" am Anfang
    const G = new THREE.Group(); G.position.set(ex, ey, ez); G.rotation.y = ea; G.userData.dynamic = true; scene.add(G);   // lokal: -z = weiter in Fahrtrichtung, x = quer
    const wood = M(0x7a5a3a, { roughness: 0.85 }), stripeT = canvasTex(128, 16, (g, w, h) => { for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? "#f2f2ee" : "#c8202a"; g.fillRect(k * 16, 0, 16, h); } }); stripeT.repeat.set(1, 1);
    const stripeM = M(0xffffff, { map: stripeT, roughness: 0.6 });
    const toW = (lx, lz) => [ex + lx * Math.cos(ea) + lz * Math.sin(ea), ez - lx * Math.sin(ea) + lz * Math.cos(ea)];
    for (const lx of [-4.2, -1.4, 1.4, 4.2]) { B(lx - 0.08, lx + 0.08, -0.3, 1.15, 7.4 - 0.08, 7.4 + 0.08, wood, false, G); circles.push([...toW(lx, 7.4), 0.25, ey + 1.2]); }
    B(-4.6, 4.6, 0.85, 1.1, 7.32, 7.48, stripeM, false, G); B(-4.6, 4.6, 0.4, 0.55, 7.34, 7.46, wood, false, G);
    for (let lx = -4.4; lx <= 4.4; lx += 0.6) circles.push([...toW(lx, 7.4), 0.3, ey + 1.2]);
    const rockM = M(0x77736c, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1, flatShading: true }), br = rng(77);
    for (const [lx, lz, s] of [[-6.4, 5.5, 1.4], [6.2, 5.8, 1.6], [-7.2, 2.2, 1.1], [7.0, 2.6, 1.0], [-5.6, 8.6, 1.2], [5.4, 8.8, 1.3]]) {
      const r = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), rockM); r.position.set(lx, s * 0.45, lz); r.rotation.set(br() * 6, br() * 6, br() * 6); r.scale.set(1, 0.75, 1); r.castShadow = true; G.add(r);
      circles.push([...toW(lx, lz), s * 0.9, ey + s * 1.3]);
    }
    { // Schild "Sackgasse" (blau, weisser Strich mit rotem Querbalken) rechts am Anfang der Strasse, schaut den Ankommenden entgegen
      const s0 = WFT.sG1 + 7, p = WFT.curve.getPointAt(s0 / WFT.len), t = WFT.curve.getTangentAt(s0 / WFT.len), nl = Math.hypot(t.x, t.z), rx = -t.z / nl, rz = t.x / nl, y0 = WFT.y(s0);
      const sx = p.x - rx * 4.0, sz = p.z - rz * 4.0;                       // rechte Seite in Fahrtrichtung (nach Westen)
      const signT = canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#1d56a8"; g.fillRect(0, 0, w, h); g.strokeStyle = "#ffffff"; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = "#ffffff"; g.fillRect(54, 40, 20, 72); g.fillStyle = "#d2232a"; g.fillRect(28, 22, 72, 20); });
      signT.repeat.set(1, 1);
      const sg = new THREE.Group(); sg.position.set(sx, y0, sz); sg.rotation.y = Math.atan2(-t.x, -t.z) + Math.PI; scene.add(sg);
      B(-0.04, 0.04, -0.2, 2.0, -0.04, 0.04, M(0x8d9298, { metalness: 0.6, roughness: 0.4 }), false, sg);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), M(0xffffff, { map: signT, roughness: 0.5 })); pl.position.set(0, 1.85, 0.05); sg.add(pl);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75).rotateY(Math.PI), M(0x8d9298, { metalness: 0.5 })); back.position.set(0, 1.85, 0.045); sg.add(back);
      circles.push([sx, sz, 0.15, y0 + 2]);
    }
  }
  const tunFloor = ribbon(WFT.curve, WFT.len, 2 * WF_HW + 0.4, M(0x4f4c47, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1, side: THREE.DoubleSide }), 4, 0, { y: s => WFT.y(s) - 0.05, t0: 0, t1: (WFT.sP + 0.6) / WFT.len });
  tunFloor.userData.keep = false;                                          // Tunnelboden ueber die ganze Breite
  // Boden in der Roehre traegt groundAt (glatt nach WFT.y), keine Quader mehr
  // Haengelampen alle 10 m, einige echte Lichter (nur unter der Erde an)
  for (let s = 5; s < WFT.sP - 2; s += 10) { if (s > WFT.gA - 3) continue;   // in der Grotte keine Haengelampen
    const p = WFT.curve.getPointAt(s / WFT.len), y = WFT.y(s);
    B(p.x - 0.5, p.x + 0.5, y + 4.8, y + 4.95, p.z - 0.15, p.z + 0.15, mat.glow, false, world, false); B(p.x - 0.02, p.x + 0.02, y + 4.95, y + 5.6, p.z - 0.02, p.z + 0.02, mat.dark, false, world, false);
  }
  for (const f of [0.12, 0.38, 0.62, 0.88]) { const s = f * WFT.sP, p = WFT.curve.getPointAt(s / WFT.len), l = new THREE.PointLight(0xffe2b8, 0, 40, 1.6); l.position.set(p.x, WFT.y(s) + 4.4, p.z); l.userData.I = 40; scene.add(l); caveLights.push(l); }
  // Portal: Fels um die Oeffnung (das Gelaende ist dort ausgeschnitten), Saeulen im 0,8-m-Raster bis knapp uebers Gelaende
  const portalRock = M(0x8f8b84, { map: texClone(rockTex, 1 / 3, 1 / 3), roughness: 1 }), [px, pz] = [-107.8, -186], st = 0.8;
  for (let x = WF_PORTAL.x0 + 1.4; x < WF_PORTAL.x1 + 2.4; x += st) for (let z = WF_PORTAL.z0 - 1.2; z < WF_PORTAL.z1 + 1.2; z += st) {
    const top = Math.min(HILL + 0.1, Math.max(terrainH(x, z), terrainH(x + st, z), terrainH(x, z + st), terrainH(x + st, z + st)) + 0.1);
    const w = wfNear(x + st / 2, z + st / 2, WF_HW + 0.3), inTun = w && w.s < WFT.sP + 1.5, bot = inTun ? w.y + 5.7 : -2.8;
    if (w && !inTun) continue;                                              // draussen auf der Fahrbahn frei lassen
    if (top > bot + 0.05) B(x, x + st, bot, top, z, z + st, portalRock, !inTun);
  }
  { const z0 = -186 - WF_HW - 0.8, z1 = -186 + WF_HW + 0.8, p0 = WFT.curve.getPointAt(WFT.sG0 / WFT.len);
    B(p0.x - 0.15, -107.6, -3.0, WFX_Y - 0.04, z0, z1, portalRock); }   // erst ab dem Portal (in der Roehre steigt die Fahrbahn, dort waere die Kante zu hoch)   // Felssockel: Kante zum Teich statt Loch
  // Abschluss zum Hoehlentunnel: Felswand mit Loch im Roehrenprofil (vorher sah man neben der Roehre ins Freie: Himmel, Baeume)
  { const [x, z] = S3[0], [tx, tz] = tng(0), nx = -tz, nz = tx, y = WFT.y(S3[0][2]);
    const sh = new THREE.Shape(); sh.moveTo(-11, -1.5); sh.lineTo(11, -1.5); sh.lineTo(11, 13); sh.lineTo(-11, 13); sh.closePath();
    const hole = new THREE.Path(); PROF.forEach(([l, h], k) => k ? hole.lineTo(l, h) : hole.moveTo(l, h)); hole.closePath(); sh.holes.push(hole);
    const geo = new THREE.ShapeGeometry(sh); { const p = geo.attributes.position, u = []; for (let i = 0; i < p.count; i++) u.push(p.getX(i) / 3, p.getY(i) / 3); geo.setAttribute("uv", new THREE.Float32BufferAttribute(u, 2)); }
    const m = new THREE.Mesh(geo, rockIn); m.position.set(x, y, z); m.rotation.y = Math.atan2(-nz, nx); m.receiveShadow = true; m.userData.keep = true; scene.add(m); }
  // Boden am Uebergang (Hoehlenboden endet vor dem Roehrenboden, daneben sah man durch)
  { const [x, z] = S3[0], y = WFT.y(S3[0][2]); B(x - WF_HW - 0.5, x + WF_HW + 0.5, y - 0.8, y - 0.03, z - 1.5, z + 2.2, M(0x4f4c47, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1 }), false); }
}
// ===================== Grotte hinter dem Wasserfall (Nicolas 2026-11-17, Filmbild) =====================
// Boden aus nassem dunklem Fels, darauf eine flache Pfuetze (Wasser ca. 20 cm, man geht und faehrt hindurch; der Boden fuer Spieler und Fahrzeuge bleibt die
// Fahrbahnhoehe WFX_Y), Tropfsteine an der Decke, Felsbrocken an den Waenden (Kollision), ein kaltes blaues Licht (nur unter der Erde an, wie die Hoehlenlichter).
{
  const S3 = WFT.samples, strip = (s0, s1, half, y, m) => { const P = [], I = [], U = []; let n = 0;
    for (let i = 0; i < S3.length; i++) { const [x, z, s] = S3[i]; if (s < s0 || s > s1) continue; const a = S3[Math.max(0, i - 1)], b = S3[Math.min(S3.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l, h = half(s);
      P.push(x - nx * h, y, z - nz * h, x + nx * h, y, z + nz * h); U.push(-h / 3, s / 3, h / 3, s / 3); if (n) { const k = (n - 1) * 2; I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } n++; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
    const o = new THREE.Mesh(g, m); o.receiveShadow = true; o.userData.keep = true; scene.add(o); return o; };
  const wetRock = M(0x2c2e30, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 0.35, metalness: 0.2, side: THREE.DoubleSide });
  strip(WFT.gA - 2, WFT.sP + 0.4, s => WFT.hw(s) + 0.3, WFX_Y + 0.08, wetRock);
  const water = M(0x0e2a38, { roughness: 0.04, metalness: 0.55, transparent: true, opacity: 0.78, emissive: 0x06202c, side: THREE.DoubleSide });
  WFT.pond = strip(WFT.gA + 1.5, WFT.sP - 0.6, s => Math.max(1.5, WFT.hw(s) - 0.4 - 0.5 * Math.sin(s * 0.9)), WFX_Y + 0.3, water);
  const rockM = M(0x4a4844, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 0.9, flatShading: true }), r = rng(911);
  for (let s = WFT.gA + 2; s < WFT.gB - 1; s += 1.6) { const p = WFT.curve.getPointAt(s / WFT.len), t = WFT.curve.getTangentAt(s / WFT.len), nx = -t.z, nz = t.x, y = WFT.y(s), hw = WFT.hw(s), top = y + 5.6 * WFT.hf(s);
    for (let k = 0; k < 2; k++) { const l = (r() * 2 - 1) * (hw - 1.2), len = 0.6 + r() * 1.8, st = new THREE.Mesh(new THREE.ConeGeometry(0.12 + r() * 0.25, len, 6), rockM); st.rotation.x = Math.PI; st.position.set(p.x + nx * l, top - len / 2 - 0.2 + (1 - Math.abs(l) / hw) * 0.6, p.z + nz * l); scene.add(st); }   // Tropfsteine
    if (WFT.bulge(s) > 0.35) for (const sd of [-1, 1]) if (r() < 0.55) { const sz = 0.5 + r() * 0.9, l = sd * (hw - 0.6 - sz * 0.5), q = new THREE.Mesh(new THREE.IcosahedronGeometry(sz, 0), rockM);   // Felsbrocken an der Wand
      q.position.set(p.x + nx * l, y + sz * 0.35, p.z + nz * l); q.rotation.set(r() * 6, r() * 6, r() * 6); q.scale.y = 0.7; q.castShadow = true; scene.add(q); circles.push([p.x + nx * l, p.z + nz * l, sz * 0.85, y + sz]); } }
  { const s = (WFT.gA + WFT.gB) / 2, p = WFT.curve.getPointAt(s / WFT.len), l = new THREE.PointLight(0x6aa8ff, 0, 34, 1.4); l.position.set(p.x, WFT.y(s) + 5, p.z); l.userData.I = 28; scene.add(l); caveLights.push(l); }
}