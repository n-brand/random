// Batverse – Gotham: Casino (Nicolas 2026-11-16 "ein Casino mit der Aufschrift Casino - ueberleg dir was und ueberrasch mich")
// Klassisches Skript nach gotham-bus.js. Steht auf der frueheren Baustelle BS-02 (Uptown, 60 x 50 m; GBST.skip). Art-deco-Bau in Schwarz und Gold:
// Stufenkrone mit Sonnenstrahlen, senkrechtes Neonschild C-A-S-I-N-O an der Ecke (Buchstaben leuchten nacheinander auf, dann blinkt alles),
// Vordach mit Lauflicht-Gluehbirnen und Schriftzug CASINO, roter Teppich mit Messingpfosten, zwei goldene Wuerfel auf Saeulen,
// auf dem Dach ein drehendes Riesen-Roulette mit springender Kugel, nachts zwei kreisende Suchscheinwerfer in den Himmel.
"use strict";
const CAS = { done: false, anim: null };
function* casinoGen() {
  while (!GSTR.done) yield "wait";
  const b = gbstList().find(q => q.id === "BS-02"); if (!b) return;
  const F = gbstFrame(b), front = gbstGate(b), Y = GOT.STR;
  // Lage: lokal u entlang der Front, v ins Grundstueck (Front bei v = 0)
  const sides = gbstSides(F, 0), sd = sides[front], A = F.at(sd[0], sd[1]), Bp = F.at(sd[2], sd[3]), W = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), ux = (Bp[0] - A[0]) / W, uz = (Bp[1] - A[1]) / W;
  const D = front % 2 === 0 ? F.L2 : F.L1, cx0 = (A[0] + Bp[0]) / 2, cz0 = (A[1] + Bp[1]) / 2, [mx, mz] = F.at(F.L1 / 2, F.L2 / 2), inx = mx - cx0, inz = mz - cz0, il = Math.hypot(inx, inz), vx = inx / il, vz = inz / il;
  // Gruppe: lokal +z = ins Grundstueck (v), Front bei z = 0; lokal +x ergibt sich aus der Drehung (u passt dazu)
  const g = new THREE.Group(); g.name = "Gotham Casino"; g.userData.keep = true; g.userData.noLift = true;
  const th = Math.atan2(vx, vz); g.position.set(cx0, Y, cz0); g.rotation.y = th; const lx = Math.cos(th), lz = -Math.sin(th);   // lokal +x in der Welt
  const P = (x, z) => [cx0 + lx * x + vx * z, cz0 + lz * x + vz * z];
  const L = (x, y, z) => [x, y, z];
  const M = o => new THREE.MeshStandardMaterial({ roughness: 0.5, ...o });
  const black = M({ color: 0x0d0e10, roughness: 0.25, metalness: 0.6 }), gold = M({ color: 0xd4a640, metalness: 1, roughness: 0.28, emissive: 0x3a2a08, emissiveIntensity: 1 }), red = M({ color: 0x8a0f17, roughness: 0.85 }), cream = M({ color: 0xe8dcc0 }), glass = M({ color: 0x1a2a3a, metalness: 0, roughness: 0.08, emissive: 0xffb860, emissiveIntensity: 0 }), stone = M({ color: 0x2a2b30, roughness: 0.35, metalness: 0.2 });
  const box = (sx, sy, sz, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); o.position.set(...L(x, y, z)); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const cyl = (rt, rb, h, m, x, y, z, seg = 24) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(...L(x, y, z)); o.castShadow = true; g.add(o); return o; };
  const BW = Math.min(46, W - 8), BD = Math.min(32, D - 14), Z0 = 10, H = 22;   // Bau: 10 m hinter der Front (Vorplatz), 22 m hoch
  // Vorplatz ueber das ganze Grundstueck (dunkler Granit, Goldfugen)
  const tileT = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#26272c"; c.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { c.fillStyle = "rgba(255,255,255," + (Math.random() * 0.05) + ")"; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    c.strokeStyle = "#8a6c2c"; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3); });   // Granitplatte 2,5 m mit Goldfuge
  tileT.wrapS = tileT.wrapT = THREE.RepeatWrapping; tileT.repeat.set((W - 1) / 2.5, (D - 1) / 2.5);
  box(W - 1, 0.1, D - 1, M({ map: tileT, roughness: 0.35, metalness: 0.3 }), 0, 0.05, D / 2);
  // Sockel, Koerper mit goldenen Lisenen und Fensterbaendern, Gesims
  const HG = 7, T = 0.5, DW = 1.8;   // Spielsaal im Erdgeschoss 7 m hoch (Nicolas 2026-11-17: "ins Casino reingehen"), Wandstaerke, halbe Tuerbreite (Tuer 3,6 x 4 m)
  for (const [w, x, z, d] of [[BW + 1, 0, Z0 + BD + 0.25, 0.5], [0.5, -BW / 2 - 0.25, Z0 + BD / 2, BD + 1], [0.5, BW / 2 + 0.25, Z0 + BD / 2, BD + 1], [BW / 2 + 0.5 - DW, -(BW / 2 + 0.5 + DW) / 2, Z0 - 0.25, 0.5], [BW / 2 + 0.5 - DW, (BW / 2 + 0.5 + DW) / 2, Z0 - 0.25, 0.5]]) box(w, 1.2, d, cream, x, 0.6, z);   // Sockel als Rand, vorne offen
  box(BW, H - HG, BD, black, 0, (H + HG) / 2, Z0 + BD / 2);                                                      // Obergeschosse
  box(BW, HG, T, black, 0, HG / 2, Z0 + BD - T / 2); for (const sx of [-1, 1]) box(T, HG, BD, black, sx * (BW / 2 - T / 2), HG / 2, Z0 + BD / 2);
  const fw = BW / 2 - DW; for (const sx of [-1, 1]) box(fw, HG, T, black, sx * (DW + fw / 2), HG / 2, Z0 + T / 2); box(2 * DW, HG - 4, T, black, 0, 4 + (HG - 4) / 2, Z0 + T / 2);
  for (const sx of [-1, 1]) box(0.35, 4.2, 0.8, gold, sx * DW, 2.1, Z0 + 0.2); box(2 * DW + 0.7, 0.35, 0.8, gold, 0, 4.15, Z0 + 0.2);   // Tuerrahmen
  for (let x = -BW / 2; x <= BW / 2 + 0.01; x += BW / 10) { const dr = Math.abs(x) < DW + 0.4; box(0.5, dr ? H - 4.4 : H - 1.2, 0.5, gold, x, dr ? (H + 4.4) / 2 : H / 2 + 0.6, Z0 - 0.15); }   // ueber der Tuer erst ab 4,4 m
  for (const y of [7, 12, 17]) box(BW + 0.4, 0.35, 0.4, gold, 0, y, Z0 - 0.1);
  for (let x = -BW / 2 + BW / 20; x < BW / 2; x += BW / 10) for (const y of [9.5, 14.5, 19.3]) box(BW / 10 - 1.4, 3.2, 0.1, glass, x, y, Z0 - 0.06);
  box(BW + 2, 0.8, BD + 2, gold, 0, H + 0.4, Z0 + BD / 2);
  // Stufenkrone mit Sonnenstrahlen
  box(BW * 0.6, 5, BD * 0.6, black, 0, H + 3.3, Z0 + BD / 2); box(BW * 0.6 + 1, 0.5, BD * 0.6 + 1, gold, 0, H + 5.8, Z0 + BD / 2);
  box(BW * 0.32, 4, BD * 0.32, black, 0, H + 8, Z0 + BD / 2); box(BW * 0.32 + 0.8, 0.4, BD * 0.32 + 0.8, gold, 0, H + 10.2, Z0 + BD / 2);
  for (let k = -6; k <= 6; k++) { const a = k / 7 * 1.1, ray = box(0.35, 7, 0.2, gold, Math.sin(a) * 3.5, H + 2.5 + Math.cos(a) * 3.5, Z0 + BD / 2 - BD * 0.3 - 0.15); ray.rotation.z = -a; }
  // Eingang: Vordach mit Lauflicht und Schriftzug, Drehtueren, roter Teppich, Messingpfosten mit Kordel
  const bulbs = canvasTex(256, 16, (c, w, h) => { c.fillStyle = "#1a1206"; c.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { const gr = c.createRadialGradient(i * 16 + 8, 8, 0, i * 16 + 8, 8, 7); gr.addColorStop(0, i % 4 === 0 ? "#fff6d0" : "#7a5a20"); gr.addColorStop(1, "#1a1206"); c.fillStyle = gr; c.fillRect(i * 16, 0, 16, 16); } });
  bulbs.repeat.set(4, 1); const bulbM = new THREE.MeshBasicMaterial({ map: bulbs });
  box(22, 0.6, 8, gold, 0, 5.2, Z0 - 4); for (const sx of [-1, 1]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.5), bulbM); s.position.set(...L(sx * 11.02, 5.2, Z0 - 4)); s.rotation.y = sx * Math.PI / 2; g.add(s); }
  { const s = new THREE.Mesh(new THREE.PlaneGeometry(22, 0.5), bulbM); s.position.set(...L(0, 5.2, Z0 - 8.02)); s.rotation.y = Math.PI; g.add(s); }
  const word = (txt, w, h, col) => canvasTex(w, h, (c) => { c.fillStyle = "#0c0a08"; c.fillRect(0, 0, w, h); c.font = `900 ${h * 0.72}px "Arial Black", Impact, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.shadowColor = col; c.shadowBlur = h * 0.25; c.fillStyle = col; c.fillText(txt, w / 2, h / 2 + h * 0.04); c.shadowBlur = 0; c.fillStyle = "#fff8e8"; c.fillText(txt, w / 2, h / 2 + h * 0.04); });
  { const m = new THREE.MeshBasicMaterial({ map: word("CASINO", 1024, 160, "#ff2a55") }), s = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.5), m); s.position.set(...L(0, 6.9, Z0 - 7.9)); s.rotation.y = Math.PI; g.add(s); box(16.4, 2.8, 0.3, gold, 0, 6.9, Z0 - 7.7); }
  for (const x of [-4.6, 4.6]) { const d = cyl(1.3, 1.3, 3.6, glass, x, 1.8, Z0 - 0.4, 16); for (let k = 0; k < 4; k++) box(0.06, 3.6, 2.5, gold, x, 1.8, Z0 - 0.4, k * Math.PI / 4); box(2.8, 0.2, 2.8, gold, x, 3.7, Z0 - 0.4); }   // Drehtueren
  box(7, 0.04, Z0 + 2, red, 0, 0.14, (Z0 - 2) / 2 - 1); box(3.4, 0.04, 6, red, 0, 0.145, Z0 + 2.5); for (const sx of [-1, 1]) for (let z = 0; z < Z0 - 1; z += 2.4) { cyl(0.08, 0.1, 1, gold, sx * 4, 0.5, z + 0.5, 10); cyl(0.14, 0.14, 0.14, gold, sx * 4, 1.05, z + 0.5, 10); if (z + 2.9 < Z0 - 1) box(0.06, 0.06, 2.3, red, sx * 4, 0.9, z + 1.7); }
  // zwei goldene Riesenwuerfel auf Saeulen links und rechts des Teppichs (Nicolas 2026-11-17: hoeher; 6,5 m, neben dem Vordach statt darin)
  const dieTex = n => canvasTex(128, 128, (c) => { c.fillStyle = "#f0c84a"; c.fillRect(0, 0, 128, 128); c.fillStyle = "#1a1206"; const P2 = { 1: [[64, 64]], 2: [[32, 32], [96, 96]], 3: [[32, 32], [64, 64], [96, 96]], 4: [[32, 32], [96, 32], [32, 96], [96, 96]], 5: [[32, 32], [96, 32], [64, 64], [32, 96], [96, 96]], 6: [[32, 28], [96, 28], [32, 64], [96, 64], [32, 100], [96, 100]] }[n]; for (const [x, y] of P2) { c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.fill(); } });
  const dieM = [1, 6, 2, 5, 3, 4].map(n => M({ map: dieTex(n), metalness: 0.6, roughness: 0.3, emissive: 0x2a1c04, emissiveIntensity: 1 })), dice = [];
  for (const sx of [-1, 1]) { cyl(1.2, 1.4, 6.5, black, sx * 13, 3.25, Z0 - 6, 20); box(2.6, 0.3, 2.6, gold, sx * 13, 6.65, Z0 - 6); const d = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), dieM); d.position.set(...L(sx * 13, 8.1, Z0 - 6)); d.rotation.set(0.6, sx * 0.7, 0.4); d.castShadow = true; g.add(d); dice.push(d); }
  // senkrechtes Neonschild an der linken Ecke: C A S I N O, jeder Buchstabe eigenes Material (Lauf-Animation)
  const blade = new THREE.Group(), letters = []; blade.position.set(...L(-BW / 2 - 0.2, 0, Z0 - 2.2)); g.add(blade);
  { const bb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 15.5, 3.6), black); bb.position.y = 13.2; blade.add(bb); const fr = new THREE.Mesh(new THREE.BoxGeometry(0.9, 15.9, 3.9), gold); fr.position.y = 13.2; fr.scale.set(1, 1, 1); blade.add(fr); bb.renderOrder = 1; }
  "CASINO".split("").forEach((ch, i) => { const m = new THREE.MeshBasicMaterial({ map: word(ch, 160, 160, "#ff2a55"), color: 0x555555 }); letters.push(m);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), m); p.position.set(s * 0.47, 19.4 - i * 2.45, 0); p.rotation.y = s * Math.PI / 2; blade.add(p); } });
  // Dach: drehendes Riesen-Roulette (8 m) auf Sockel, Kugel springt ueber die Facher
  const rouTex = canvasTex(512, 512, (c) => { const r = 256; c.fillStyle = "#3b2410"; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 37; i++) { const a0 = i / 37 * Math.PI * 2, a1 = (i + 1) / 37 * Math.PI * 2; c.beginPath(); c.moveTo(r, r); c.arc(r, r, 240, a0, a1); c.closePath(); c.fillStyle = i === 0 ? "#127a2e" : i % 2 ? "#b0101c" : "#111"; c.fill();
    c.save(); c.translate(r, r); c.rotate((a0 + a1) / 2); c.fillStyle = "#fff"; c.font = "bold 18px Arial"; c.textAlign = "center"; c.fillText(String(i), 205, 6); c.restore(); }
    c.beginPath(); c.arc(r, r, 150, 0, Math.PI * 2); c.fillStyle = "#5a3818"; c.fill(); c.beginPath(); c.arc(r, r, 60, 0, Math.PI * 2); c.fillStyle = "#d4a640"; c.fill(); c.strokeStyle = "#d4a640"; c.lineWidth = 8; c.beginPath(); c.arc(r, r, 246, 0, Math.PI * 2); c.stroke(); });
  const rou = new THREE.Group(); rou.position.set(...L(0, H + 10.4 + 1.2, Z0 + BD / 2)); g.add(rou);
  { const disc = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.6, 48), [M({ color: 0x3b2410 }), M({ map: rouTex, emissive: 0x150808, emissiveIntensity: 1 }), M({ color: 0x3b2410 })]); rou.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(4.15, 0.25, 8, 48), gold); rim.rotation.x = Math.PI / 2; rim.position.y = 0.35; rou.add(rim);
    const spin = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 4), gold); spin.position.y = 1; rou.add(spin); for (let k = 0; k < 4; k++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.15), gold); arm.position.y = 1.1; arm.rotation.y = k * Math.PI / 4; rou.add(arm); } }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), M({ color: 0xffffff, roughness: 0.2, emissive: 0x444444, emissiveIntensity: 1 })); g.add(ball);
  cyl(4.6, 5, 1.2, black, 0, H + 10.4 + 0.6 - 0.6 + 0.6, Z0 + BD / 2, 32);
  // Suchscheinwerfer: zwei Lichtkegel vom Dach, kreisen; nur nachts
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff2cc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beams = []; for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(...L(sx * (BW / 2 - 3), H + 1.2, Z0 + BD / 2)); g.add(piv); cyl(0.9, 1.1, 1.6, gold, sx * (BW / 2 - 3), H + 1.6, Z0 + BD / 2, 16);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(9, 0.6, 260, 20, 1, true), beamM); cone.position.y = 130; const tilt = new THREE.Group(); tilt.rotation.z = 0.35; tilt.add(cone); piv.add(tilt); piv.userData.ph = sx > 0 ? 0 : Math.PI; beams.push(piv); }
  casinoInnen({ g, M, box, cyl, gold, black, red, rouTex, BW, BD, Z0, HG, T });
  scene.add(g); g.updateMatrixWorld(true);
  // Kollision: Obergeschosse (Dach begehbar), Waende mit Tuer, Einrichtung (je Teil ein gedrehter Quader in lokalen Koordinaten)
  const dk = (sx, sy, sz, x, y, z, m = 0.15) => { const [cx, cz] = P(x, z); return dkAdd({ cx, cy: Y + y, cz, ux: lx, uz: lz, hl: sx / 2, hw: sz / 2, hh: sy / 2, m }); };
  dk(BW, H - HG, BD, 0, (H + HG) / 2, Z0 + BD / 2, 0.3); dk(BW, HG, T, 0, HG / 2, Z0 + BD - T / 2, 0.3);
  for (const sx of [-1, 1]) { dk(T, HG, BD, sx * (BW / 2 - T / 2), HG / 2, Z0 + BD / 2, 0.3); dk(fw, HG, T, sx * (DW + fw / 2), HG / 2, Z0 + T / 2, 0.3); }
  dk(2 * DW, HG - 4, T, 0, 4 + (HG - 4) / 2, Z0 + T / 2, 0.1);
  for (const c of CAS.innen) dk(c[0], c[1], c[2], c[3], c[1] / 2, c[4], 0.1);
  { const poly = [P(-BW / 2, Z0), P(BW / 2, Z0), P(BW / 2, Z0 + BD), P(-BW / 2, Z0 + BD)]; bautAdd({ id: "GO-CASINO", name: "Casino", art: "Gebäude", poly, y0: Y - 1, y1: Y + H + 12, info: "Uptown · Art déco, Roulette auf dem Dach · früher Baustelle BS-02" }); }
  CAS.anim = { glass, g, letters, bulbs, rou, ball, dice, beams, beamM, rouY: H + 10.4 + 1.2, rouZ: Z0 + BD / 2, t0: performance.now() };
}
// Spielsaal (Nicolas 2026-11-17: "ich moechte in das Casino reingehen koennen"): Teppich, Kassettendecke, Holzpaneele, 6 Kronleuchter, 2 Roulette- und 2 Blackjack-Tische
// mit Hockern, Spielautomaten an beiden Seitenwaenden, Bar mit beleuchtetem Flaschenregal, Kasse mit Gitter. Wiederholte Teile als InstancedMesh, Licht ueber
// leuchtende Materialien (keine zusaetzlichen Lichter: die wuerden im Spiel alle Shader neu uebersetzen). Kollisionsquader in CAS.innen [sx, sy, sz, x, z] (lokal).
function casinoInnen({ g, M, box, cyl, gold, black, red, rouTex, BW, BD, Z0, HG, T }) {
  const IX = BW / 2 - T, IZ0 = Z0 + T, IZ1 = Z0 + BD - T, IL = IZ1 - IZ0, IC = (IZ0 + IZ1) / 2, C = CAS.innen = [], O = new THREE.Object3D();
  const inst = (geo, m, list, shadow = false) => { const im = new THREE.InstancedMesh(geo, m, list.length); list.forEach((t, i) => { O.position.set(t[0], t[1], t[2]); O.rotation.set(t[4] || 0, t[3] || 0, 0); O.scale.setScalar(t[5] || 1); O.updateMatrix(); im.setMatrixAt(i, O.matrix); });
    im.castShadow = shadow; im.receiveShadow = true; g.add(im); return im; };
  const tex = (w, h, draw, rx, ry) => { const t = canvasTex(w, h, draw); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); } return t; };
  // Teppich, Decke, Paneele
  const carpetT = tex(256, 256, (c, w, h) => { c.fillStyle = "#5a0c12"; c.fillRect(0, 0, w, h); c.strokeStyle = "#c9973a"; c.lineWidth = 4; for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h], [w / 2, h / 2]]) { c.beginPath(); c.moveTo(x, y - 44); c.lineTo(x + 44, y); c.lineTo(x, y + 44); c.lineTo(x - 44, y); c.closePath(); c.stroke(); }
    c.fillStyle = "#c9973a"; for (const [x, y] of [[w / 2, h / 2], [0, 0], [w, h], [w, 0], [0, h]]) { c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill(); } }, 2 * IX / 3, IL / 3);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2 * IX, IL), M({ map: carpetT, roughness: 0.95, emissive: 0xffffff, emissiveMap: carpetT, emissiveIntensity: 0.18 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.125, IC); carpet.receiveShadow = true; g.add(carpet);
  const ceilT = tex(128, 128, (c, w, h) => { c.fillStyle = "#1d1410"; c.fillRect(0, 0, w, h); c.fillStyle = "#2c1e15"; c.fillRect(14, 14, w - 28, h - 28); c.strokeStyle = "#c9973a"; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8); }, 2 * IX / 3, IL / 3);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2 * IX, IL), M({ map: ceilT, emissive: 0xffffff, emissiveMap: ceilT, emissiveIntensity: 0.35 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, HG - 0.02, IC); g.add(ceil);
  const panT = tex(128, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "#3a2214"); gr.addColorStop(0.5, "#4e2e1a"); gr.addColorStop(1, "#3a2214"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#c9973a"; c.fillRect(0, h * 0.62, w, 4); c.fillRect(0, h - 6, w, 6); c.fillRect(0, 0, 3, h); }, 1, 1);
  const panM = M({ map: panT, emissive: 0xffffff, emissiveMap: panT, emissiveIntensity: 0.25 }); panT.wrapS = THREE.RepeatWrapping;
  { const back = new THREE.Mesh(new THREE.PlaneGeometry(2 * IX, HG), panM.clone()); back.material.map = back.material.emissiveMap = panT.clone(); back.material.map.repeat.set(2 * IX / 3, 1); back.material.map.wrapS = THREE.RepeatWrapping; back.material.map.needsUpdate = true; back.position.set(0, HG / 2, IZ1 - 0.01); back.rotation.y = Math.PI; g.add(back);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(IL, HG), panM.clone()); p.material.map = p.material.emissiveMap = panT.clone(); p.material.map.repeat.set(IL / 3, 1); p.material.map.wrapS = THREE.RepeatWrapping; p.material.map.needsUpdate = true; p.position.set(sx * (IX - 0.01), HG / 2, IC); p.rotation.y = -sx * Math.PI / 2; g.add(p); } }
  // Kronleuchter: Ring, Kette, Kristalle (alle leuchtend, instanziert)
  const lights = []; for (const x of [-12, 0, 12]) for (const z of [IC - 6, IC + 6]) lights.push([x, HG - 1.7, z]);
  inst(new THREE.TorusGeometry(1.3, 0.08, 6, 24), gold, lights.map(p => [p[0], p[1], p[2], 0, Math.PI / 2]));
  inst(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), gold, lights.map(p => [p[0], HG - 0.85, p[2]]));
  const cr = []; for (const p of lights) { for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; cr.push([p[0] + Math.cos(a) * 1.3, p[1] - 0.25, p[2] + Math.sin(a) * 1.3]); } cr.push([p[0], p[1] - 0.5, p[2], 0, 0, 2.2]); }
  inst(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }), cr);
  // Spielautomaten an beiden Seitenwaenden (Bildschirm mit 777, leuchtende Haube)
  const slotT = tex(128, 96, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2a0a4a"); gr.addColorStop(1, "#0a0420"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.fillRect(8, 22, w - 16, 52); c.font = "bold 40px Arial Black, Arial"; c.textAlign = "center"; c.fillStyle = "#e0102a"; c.fillText("777", w / 2, 64); c.fillStyle = "#ffd23a"; c.font = "bold 14px Arial"; c.fillText("JACKPOT", w / 2, 16); });
  const slots = []; for (const sx of [-1, 1]) for (let z = IZ0 + 5; z < IZ1 - 6; z += 1.15) slots.push([sx * (IX - 0.45), 0.85, z, sx < 0 ? -Math.PI / 2 : Math.PI / 2]);
  inst(new THREE.BoxGeometry(0.8, 1.7, 0.7), M({ color: 0x1b1d24, metalness: 0.5, roughness: 0.4 }), slots, true);
  inst(new THREE.PlaneGeometry(0.6, 0.45).rotateY(Math.PI).translate(0, 0.38, -0.36), M({ map: slotT, emissive: 0xffffff, emissiveMap: slotT, emissiveIntensity: 0.9 }), slots);
  inst(new THREE.BoxGeometry(0.82, 0.22, 0.72).translate(0, 0.96, 0), new THREE.MeshBasicMaterial({ color: 0xffb02e }), slots);
  for (const sx of [-1, 1]) C.push([0.9, 1.8, IZ1 - 6 - (IZ0 + 5) + 0.7, sx * (IX - 0.45), (IZ0 + 5 + IZ1 - 6) / 2 - 0.3]);
  // Roulette (vorne) und Blackjack (hinten), je links und rechts des Mittelgangs
  const felt = M({ color: 0x0f5a32, roughness: 0.9, emissive: 0x06301a, emissiveIntensity: 0.6 }), wood = M({ color: 0x3e2414, roughness: 0.6 });
  const stools = [];
  for (const sx of [-1, 1]) { const x = sx * 8, z = IC - 4;
    box(3.4, 0.82, 1.7, wood, x, 0.41, z); const top = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.5), felt); top.rotation.x = -Math.PI / 2; top.position.set(x, 0.83, z); g.add(top);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.16, 32), [wood, M({ map: rouTex, emissive: 0x150808, emissiveIntensity: 1 }), wood]); wheel.position.set(x - sx * 1.15, 0.92, z); g.add(wheel); C.push([3.4, 0.9, 1.7, x, z]);
    for (const dx of [-0.9, 0, 0.9]) stools.push([x + dx, 0.38, z + 1.35]);
    const bz = IC + 5, bj = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.82, 32, 1, false, Math.PI / 2, Math.PI), wood); bj.position.set(x, 0.41, bz); g.add(bj);
    const bt = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32, Math.PI, Math.PI), felt); bt.rotation.x = -Math.PI / 2; bt.position.set(x, 0.83, bz); g.add(bt); C.push([3.4, 0.9, 1.7, x, bz - 0.4]);
    for (let k = 0; k < 5; k++) { const a = Math.PI * (0.15 + k * 0.175); stools.push([x - Math.cos(a) * 2.2, 0.38, bz - Math.sin(a) * 2.2]); } }
  // Bar an der Rueckwand: Theke, Regal mit Flaschen, Hocker
  const bw = 16, bz = IZ1 - 3.4; box(bw, 1.1, 0.9, wood, 0, 0.55, bz); box(bw + 0.2, 0.08, 1.1, gold, 0, 1.14, bz); C.push([bw, 1.2, 0.9, 0, bz]);
  box(bw, 2.8, 0.5, wood, 0, 1.4, IZ1 - 0.3); const glow = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.4, 2.2), new THREE.MeshBasicMaterial({ color: 0xffb860 })); glow.position.set(0, 1.55, IZ1 - 0.56); glow.rotation.y = Math.PI; g.add(glow); C.push([bw, 2.8, 0.6, 0, IZ1 - 0.3]);
  for (const y of [0.9, 1.6, 2.3]) box(bw - 0.4, 0.05, 0.4, gold, 0, y, IZ1 - 0.65);
  const bott = [], bcol = []; let k = 0; for (const y of [0.92, 1.62, 2.32]) for (let x = -bw / 2 + 0.5; x < bw / 2 - 0.4; x += 0.32) { bott.push([x, y + 0.14, IZ1 - 0.7]); bcol.push([0x2f7d3a, 0x8a3a12, 0xd8c070, 0x1e3a6a, 0x6a1a2a][k++ % 5]); }
  { const im = inst(new THREE.CylinderGeometry(0.06, 0.07, 0.28, 8), new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.1, emissive: 0x222222 }), bott); bcol.forEach((cc, i) => im.setColorAt(i, new THREE.Color(cc))); im.instanceColor.needsUpdate = true; }
  for (let x = -bw / 2 + 1; x <= bw / 2 - 1; x += 1.4) stools.push([x, 0.38, bz - 1.1]);
  inst(new THREE.CylinderGeometry(0.22, 0.18, 0.76, 12), M({ color: 0x8a0f17, roughness: 0.6 }), stools);
  // Kasse in der hinteren rechten Ecke mit Gitter und Schild
  const kx = IX - 3.5, kz = IZ1 - 8; box(5, 1.2, 0.8, wood, kx, 0.6, kz); box(5.2, 0.08, 1, gold, kx, 1.24, kz); C.push([5, 1.3, 0.8, kx, kz]);
  inst(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), gold, Array.from({ length: 21 }, (_, i) => [kx - 2.4 + i * 0.24, 1.93, kz]));
  { const sg = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.6), new THREE.MeshBasicMaterial({ map: canvasTex(256, 52, (c, w, h) => { c.fillStyle = "#0c0a08"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffd23a"; c.font = "bold 34px Arial"; c.textAlign = "center"; c.fillText("KASSE", w / 2, 38); }) })); sg.position.set(kx, 2.9, kz - 0.05); sg.rotation.y = Math.PI; g.add(sg); }
  // Saeulen
  for (const x of [-14, 14]) for (const z of [IC - 8, IC + 8]) { cyl(0.45, 0.45, HG, black, x, HG / 2, z, 16); cyl(0.6, 0.6, 0.3, gold, x, 0.15, z, 16); cyl(0.6, 0.6, 0.3, gold, x, HG - 0.3, z, 16); C.push([1, HG, 1, x, z]); }
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (CAS.done || TILES.startup) return false;
  if (!this.gen) this.gen = casinoGen(); const r = this.gen.next(); if (r.done) { CAS.done = true; this.gen = null; } return false; } });
// je Bild (schleife.js): Neonbuchstaben, Lauflicht, Roulette und Kugel, Wuerfel, Suchscheinwerfer; nur wenn die Kamera naeher als 1,5 km ist
function casinoStep() {
  const A = CAS.anim; if (!A) return; const p = camera.position, gp = A.g.position; if (Math.abs(p.x - gp.x) > 1500 || Math.abs(p.z - gp.z) > 1500) return;
  const t = (performance.now() - A.t0) / 1000, n = typeof night === "number" ? night : 0;
  // Buchstaben: 0-3 s nacheinander an, 3-4,2 s blinken, dann alle an bis 6 s
  const ph = t % 6; A.letters.forEach((m, i) => { const on = ph < 3 ? ph > i * 0.45 : ph < 4.2 ? Math.floor(ph * 6) % 2 === 0 : true; m.color.setScalar(on ? 1 : 0.18); });
  A.bulbs.offset.x = -(t * 2) % 1;
  A.rou.rotation.y = t * 0.6; const ba = -t * 1.7, br = 3.2 + 0.35 * Math.sin(t * 0.9), hop = Math.abs(Math.sin(t * 7)) * 0.25 * (0.5 + 0.5 * Math.sin(t * 0.5));
  A.ball.position.set(Math.cos(ba) * br, A.rouY + 0.6 + hop, A.rouZ + Math.sin(ba) * br);
  A.dice.forEach((d, i) => { d.rotation.y = t * (0.5 + i * 0.2); d.rotation.x = 0.6 + Math.sin(t * 0.7 + i) * 0.2; });
  A.glass.emissiveIntensity = 0.8 * n;   // tagsueber 0 (sonst wirkt das Glas braun)
  A.beamM.opacity = 0.08 * n; A.beams.forEach(b => { b.visible = n > 0.05; b.rotation.y = t * 0.4 + b.userData.ph; });
}
