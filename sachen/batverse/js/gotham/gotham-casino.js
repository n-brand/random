// Batverse – Gotham: Casino (Nicolas 2026-11-16 "ein Casino mit der Aufschrift Casino - ueberleg dir was und ueberrasch mich")
// Klassisches Skript nach gotham-bus.js. Steht auf der frueheren Baustelle BS-02 (Uptown, 60 x 50 m; GBST.skip). Art-deco-Bau in Schwarz und Gold:
// Flachdach mit schlichter Bruestung, senkrechtes Neonschild C-A-S-I-N-O an der Ecke (Buchstaben leuchten nacheinander auf, dann blinkt alles),
// Vordach mit Lauflicht-Gluehbirnen und Schriftzug CASINO, roter Teppich mit Messingpfosten, zwei goldene Wuerfel auf Saeulen,
// nachts zwei kreisende Suchscheinwerfer in den Himmel.
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
  const HG = 7, T = 0.5, DW = 1.8, H2 = 13.5;   // Spielsaal im Erdgeschoss 7 m hoch (Nicolas 2026-11-17: "ins Casino reingehen"), Wandstaerke, halbe Tuerbreite (Tuer 3,6 x 4 m)
  for (const [w, x, z, d] of [[BW + 1, 0, Z0 + BD + 0.25, 0.5], [0.5, -BW / 2 - 0.25, Z0 + BD / 2, BD + 1], [0.5, BW / 2 + 0.25, Z0 + BD / 2, BD + 1], [BW / 2 + 0.5 - DW, -(BW / 2 + 0.5 + DW) / 2, Z0 - 0.25, 0.5], [BW / 2 + 0.5 - DW, (BW / 2 + 0.5 + DW) / 2, Z0 - 0.25, 0.5]]) box(w, 1.2, d, cream, x, 0.6, z);   // Sockel als Rand, vorne offen
  box(BW, H - H2, BD, black, 0, (H + H2) / 2, Z0 + BD / 2);                                                      // Obergeschosse ueber dem 2. Stock (Saal 2. Stock bis H2)
  box(BW, H2 - HG, T, black, 0, (HG + H2) / 2, Z0 + BD - T / 2); box(BW, H2 - HG, T, black, 0, (HG + H2) / 2, Z0 + T / 2); for (const sx of [-1, 1]) box(T, H2 - HG, BD, black, sx * (BW / 2 - T / 2), (HG + H2) / 2, Z0 + BD / 2);
  box(BW, HG, T, black, 0, HG / 2, Z0 + BD - T / 2); for (const sx of [-1, 1]) box(T, HG, BD, black, sx * (BW / 2 - T / 2), HG / 2, Z0 + BD / 2);
  const fw = BW / 2 - DW; for (const sx of [-1, 1]) box(fw, HG, T, black, sx * (DW + fw / 2), HG / 2, Z0 + T / 2); box(2 * DW, HG - 4, T, black, 0, 4 + (HG - 4) / 2, Z0 + T / 2);
  for (const sx of [-1, 1]) box(0.35, 4.2, 0.8, gold, sx * DW, 2.1, Z0 + 0.2); box(2 * DW + 0.7, 0.35, 0.8, gold, 0, 4.15, Z0 + 0.2);   // Tuerrahmen
  for (let x = -BW / 2; x <= BW / 2 + 0.01; x += BW / 10) { const dr = Math.abs(x) < DW + 0.4; box(0.5, dr ? H - 4.4 : H - 1.2, 0.5, gold, x, dr ? (H + 4.4) / 2 : H / 2 + 0.6, Z0 - 0.15); }   // ueber der Tuer erst ab 4,4 m
  for (const y of [7, 12, 17]) box(BW + 0.4, 0.35, 0.4, gold, 0, y, Z0 - 0.1);
  for (let x = -BW / 2 + BW / 20; x < BW / 2; x += BW / 10) for (const y of [9.5, 14.5, 19.3]) box(BW / 10 - 1.4, 3.2, 0.1, glass, x, y, Z0 - 0.06);
  box(BW + 2, 0.8, BD + 2, gold, 0, H + 0.4, Z0 + BD / 2);
  // Flachdach mit schlichter Bruestung (Nicolas 2026-11-17: Stufenkrone und Riesen-Roulette "unnoetig, nicht professionell", "unauffaelligeres Dach")
  const PH = 1, PT = 0.4, PY = H + 0.8, PW = BW + 2, PD = BD + 2, para = [[PW, PT, 0, Z0 - 1 + PT / 2], [PW, PT, 0, Z0 + BD + 1 - PT / 2], [PT, PD, -PW / 2 + PT / 2, Z0 + BD / 2], [PT, PD, PW / 2 - PT / 2, Z0 + BD / 2]];
  for (const [sx, sz, x, z] of para) { box(sx, PH, sz, black, x, PY + PH / 2, z); box(sx + 0.08, 0.1, sz + 0.08, gold, x, PY + PH + 0.05, z); }
  box(PW - 2 * PT, 0.05, PD - 2 * PT, stone, 0, PY + 0.025, Z0 + BD / 2);   // dunkle Dachflaeche, Gold nur noch als Gesims und Abdeckung
  // Eingang: Vordach mit Lauflicht und Schriftzug, Drehtueren, roter Teppich, Messingpfosten mit Kordel
  const bulbs = canvasTex(256, 16, (c, w, h) => { c.fillStyle = "#1a1206"; c.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { const gr = c.createRadialGradient(i * 16 + 8, 8, 0, i * 16 + 8, 8, 7); gr.addColorStop(0, i % 4 === 0 ? "#fff6d0" : "#7a5a20"); gr.addColorStop(1, "#1a1206"); c.fillStyle = gr; c.fillRect(i * 16, 0, 16, 16); } });
  bulbs.repeat.set(4, 1); const bulbM = new THREE.MeshBasicMaterial({ map: bulbs });
  box(22, 0.6, 8, gold, 0, 5.2, Z0 - 4); for (const sx of [-1, 1]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.5), bulbM); s.position.set(...L(sx * 11.02, 5.2, Z0 - 4)); s.rotation.y = sx * Math.PI / 2; g.add(s); }
  { const s = new THREE.Mesh(new THREE.PlaneGeometry(22, 0.5), bulbM); s.position.set(...L(0, 5.2, Z0 - 8.02)); s.rotation.y = Math.PI; g.add(s); }
  const word = (txt, w, h, col) => canvasTex(w, h, (c) => { c.fillStyle = "#0c0a08"; c.fillRect(0, 0, w, h); c.font = `900 ${h * 0.72}px "Arial Black", Impact, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.shadowColor = col; c.shadowBlur = h * 0.25; c.fillStyle = col; c.fillText(txt, w / 2, h / 2 + h * 0.04); c.shadowBlur = 0; c.fillStyle = "#fff8e8"; c.fillText(txt, w / 2, h / 2 + h * 0.04); });
  { const m = new THREE.MeshBasicMaterial({ map: word("CASINO", 1024, 160, "#ff2a55") }), s = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.5), m); s.position.set(...L(0, 6.9, Z0 - 7.9)); s.rotation.y = Math.PI; g.add(s); box(16.4, 2.8, 0.3, gold, 0, 6.9, Z0 - 7.7); }
  // Drehtueren links und rechts der Tuer entfernt (Nicolas 2026-11-17, Bild: "die zwei Saeulen hier sollen weg")
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
  // Roulette-Kessel-Textur (fuer die Tische im Spielsaal)
  const rouTex = canvasTex(512, 512, (c) => { const r = 256; c.fillStyle = "#3b2410"; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 37; i++) { const a0 = i / 37 * Math.PI * 2, a1 = (i + 1) / 37 * Math.PI * 2; c.beginPath(); c.moveTo(r, r); c.arc(r, r, 240, a0, a1); c.closePath(); c.fillStyle = i === 0 ? "#127a2e" : i % 2 ? "#b0101c" : "#111"; c.fill();
    c.save(); c.translate(r, r); c.rotate((a0 + a1) / 2); c.fillStyle = "#fff"; c.font = "bold 18px Arial"; c.textAlign = "center"; c.fillText(String(i), 205, 6); c.restore(); }
    c.beginPath(); c.arc(r, r, 150, 0, Math.PI * 2); c.fillStyle = "#5a3818"; c.fill(); c.beginPath(); c.arc(r, r, 60, 0, Math.PI * 2); c.fillStyle = "#d4a640"; c.fill(); c.strokeStyle = "#d4a640"; c.lineWidth = 8; c.beginPath(); c.arc(r, r, 246, 0, Math.PI * 2); c.stroke(); });
  // Suchscheinwerfer: zwei Lichtkegel vom Dach, kreisen; nur nachts
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff2cc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beams = []; for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(...L(sx * (BW / 2 - 3), H + 1.2, Z0 + BD / 2)); g.add(piv); cyl(0.9, 1.1, 1.6, gold, sx * (BW / 2 - 3), H + 1.6, Z0 + BD / 2, 16);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(9, 0.6, 260, 20, 1, true), beamM); cone.position.y = 130; const tilt = new THREE.Group(); tilt.rotation.z = 0.35; tilt.add(cone); piv.add(tilt); piv.userData.ph = sx > 0 ? 0 : Math.PI; beams.push(piv); }
  casinoInnen({ g, M, box, cyl, gold, black, red, rouTex, BW, BD, Z0, HG, T, DW, H2 });
  figurPersonal(g, CAS.personal);   // Personal (F4): Croupiers an Roulette und Blackjack, zwei Kassierer
  // Vordach getragen (Nicolas 2026-11-17: "die Platte beim Eingang schwebt"; vorher standen die Wuerfelsaeulen darunter): zwei Saeulen an den vorderen Ecken, Zugstangen zur Fassade
  for (const sx of [-1, 1]) { cyl(0.22, 0.26, 4.9, gold, sx * 10.4, 2.45, Z0 - 7.4, 12); cyl(0.4, 0.4, 0.2, gold, sx * 10.4, 0.2, Z0 - 7.4, 12); CAS.innen.push([0.6, 4.9, 0.6, sx * 10.4, Z0 - 7.4]);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, Math.hypot(7.6, 4.5), 6), gold); rod.position.set(sx * 10.4, 7.75, Z0 - 3.8); rod.rotation.x = Math.atan2(7.6, 4.5); g.add(rod); }
  scene.add(g); g.updateMatrixWorld(true);
  // Kollision: Obergeschosse (Dach begehbar), Waende mit Tuer, Einrichtung (je Teil ein gedrehter Quader in lokalen Koordinaten)
  const dk = (sx, sy, sz, x, y, z, m = 0.15) => { const [cx, cz] = P(x, z); return dkAdd({ cx, cy: Y + y, cz, ux: lx, uz: lz, hl: sx / 2, hw: sz / 2, hh: sy / 2, m }); };
  dk(BW, H - H2, BD, 0, (H + H2) / 2, Z0 + BD / 2, 0.3); dk(BW, H2, T, 0, H2 / 2, Z0 + BD - T / 2, 0.3); dk(BW, H2 - HG, T, 0, (HG + H2) / 2, Z0 + T / 2, 0.3);
  for (const sx of [-1, 1]) { dk(T, H2, BD, sx * (BW / 2 - T / 2), H2 / 2, Z0 + BD / 2, 0.3); dk(fw, HG, T, sx * (DW + fw / 2), HG / 2, Z0 + T / 2, 0.3); }
  dk(2 * DW, HG - 4, T, 0, 4 + (HG - 4) / 2, Z0 + T / 2, 0.1);
  for (const [sx, sz, x, z] of para) dk(sx, PH, sz, x, PY + PH / 2, z, 0.1);   // Dachbruestung
  for (const c of CAS.innen) dk(c[0], c[1], c[2], c[3], (c[5] || 0) + c[1] / 2, c[4], 0.1);
  // Freitreppe: je Stufe ein geneigtes Stueck (g = Steigung entlang lokal +z), Oberseite in der Mitte; ohne Rand, damit man von Stufe zu Stufe kommt
  { const S = CAS.stair, gs = S.RS / S.TS; for (const [w, zc, yc] of CAS.ramp) { const [cx, cz] = P(0, zc); dkAdd({ cx, cy: Y + yc / 2, cz, ux: vx, uz: vz, hl: S.TS / 2, hw: w / 2, hh: yc / 2, m: 0, g: gs, ceil: 0 }); } }
  // Tresortuer: Sperre in der Oeffnung, nur geschlossen
  if (CAS.vault && CAS.vault.door) { const d = CAS.vault.door; CAS.vault.blk = dk(d[0], d[1], d[2], d[3], d[1] / 2, d[4], 0.05); }
  // Rechtsklick-Ziele (Rechtsklick/E): Roulette-Tische (js/ui/roulette.js), Bankautomaten, Jeton-Automaten und Kasse (js/ui/jetons.js), Tresor
  for (const t of CAS.rouT) CAS.gates.push({ name: "Roulette", m: t, call: () => typeof rouletteOpen === "function" && rouletteOpen(), verbs: ["spielen", "spielen"], near: 3.5 });
  for (const q of CAS.gates) { const p = q.m.getWorldPosition(new THREE.Vector3()), o = { name: q.name, g: q.m, call: q.call, verbs: q.verbs || ["benutzen", "benutzen"], a: [p.x, p.z], b: [p.x, p.z], near: q.near || 3.5 }; gates.push(o); if (q.vault) CAS.vault.gate = o; }
  { const poly = [P(-BW / 2, Z0), P(BW / 2, Z0), P(BW / 2, Z0 + BD), P(-BW / 2, Z0 + BD)]; bautAdd({ id: "GO-CASINO", name: "Casino", art: "Gebäude", poly, y0: Y - 1, y1: Y + H + 2, info: "Uptown · Art déco, Spielsaal im Erdgeschoss · früher Baustelle BS-02" }); }
  CAS.anim = { glass, g, letters, bulbs, dice, beams, beamM, t0: performance.now() };
}
// Spielsaal (Nicolas 2026-11-17: "ich moechte in das Casino reingehen koennen"; "Kasse komplett ueberarbeiten, mehr Platz fuer Mitarbeiter hinten, 2. Stock mit grosszuegiger Treppe";
// "einen Tresor und auf beiden Etagen einen Bankautomaten"; Jeton-Automat). Erdgeschoss: Teppich, Kassettendecke, Holzpaneele, Kronleuchter, Roulette und Blackjack,
// Spielautomaten, Bar hinten links, Kasse hinten rechts (Glasfront mit drei Schaltern, Personalbereich mit Schreibtischen, Regal und begehbarem Tresor), Bankautomat
// und Jeton-Automaten. Freitreppe 7 m breit in der Mitte hinten (20 Stufen) zum 2. Stock (Boden HG + 0,3, Decke H2): Galerie mit Gelaender um das Treppenloch,
// grosser Kronleuchter darin, Lounge an den Fenstern, zwei Poker-Tische, Roulette und Blackjack, Spielautomaten, Bankautomat und Jeton-Automaten.
// Wiederholte Teile als InstancedMesh, Licht ueber leuchtende Materialien (keine zusaetzlichen Lichter). Kollision in CAS.innen [sx, sy, sz, x, z, y0] (lokal),
// Rechtsklick-Ziele in CAS.gates, Rampenstuecke der Treppe in CAS.ramp, Tresortuer in CAS.vault.
function casinoInnen({ g, M, box, cyl, gold, black, red, rouTex, BW, BD, Z0, HG, T, DW, H2 }) {
  const IX = BW / 2 - T, IZ0 = Z0 + T, IZ1 = Z0 + BD - T, IL = IZ1 - IZ0, IC = (IZ0 + IZ1) / 2, C = CAS.innen = []; CAS.rouT = []; CAS.personal = []; CAS.gates = []; CAS.ramp = []; const O = new THREE.Object3D();
  const FL2 = HG + 0.3, NS = 40, RS = FL2 / NS, TS = 0.3, SW = 3.5, ZE = IZ1 - 3, ZS = ZE - NS * TS;   // 2. Stock 7,3 m; Treppe 7 m breit, 40 Stufen zu 18,25 cm, Auftritt 30 cm (F6 2026-11-19: vorher 20 zu 36,5 cm, fuer eine 1,78-m-Figur doppelt so hoch wie ueblich)
  CAS.FL2 = FL2; CAS.stair = { SW, ZS, ZE, RS, TS };
  const inst = (geo, m, list, shadow = false) => { const im = new THREE.InstancedMesh(geo, m, list.length); list.forEach((t, i) => { O.position.set(t[0], t[1], t[2]); O.rotation.set(t[4] || 0, t[3] || 0, 0); O.scale.setScalar(t[5] || 1); O.updateMatrix(); im.setMatrixAt(i, O.matrix); });
    im.castShadow = shadow; im.receiveShadow = true; g.add(im); return im; };
  const tex = (w, h, draw, rx, ry) => { const t = canvasTex(w, h, draw); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); } return t; };
  const felt = M({ color: 0x0f5a32, roughness: 0.9, emissive: 0x06301a, emissiveIntensity: 0.6 }), wood = M({ color: 0x3e2414, roughness: 0.6 }), marble = M({ color: 0xe9e2d4, roughness: 0.25, metalness: 0.05 });
  const steel = M({ color: 0x6d737a, metalness: 0.75, roughness: 0.32 }), velvet = M({ color: 0x7a0c16, roughness: 0.9, emissive: 0x2a0306, emissiveIntensity: 0.6 }), screenM = new THREE.MeshBasicMaterial({ color: 0x3a8ad8 });
  // Flaechen ohne Treppenloch [x0, x1, z0, z1]
  const RECTS = [[-IX, IX, IZ0, ZS], [-IX, IX, ZE, IZ1], [-IX, -SW, ZS, ZE], [SW, IX, ZS, ZE]];
  const flat = (m0, t0, x0, x1, z0, z1, y, up) => { const w = x1 - x0, d = z1 - z0, m = m0.clone(); if (t0) { m.map = t0.clone(); m.map.repeat.set(w / 3, d / 3); m.map.offset.set(x0 / 3, z0 / 3); m.map.needsUpdate = true; if (m0.emissiveMap) m.emissiveMap = m.map; }
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = up ? -Math.PI / 2 : Math.PI / 2; p.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); p.receiveShadow = true; g.add(p); return p; };
  // Teppich, Decken, Paneele
  const carpetT = tex(256, 256, (c, w, h) => { c.fillStyle = "#5a0c12"; c.fillRect(0, 0, w, h); c.strokeStyle = "#c9973a"; c.lineWidth = 4; for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h], [w / 2, h / 2]]) { c.beginPath(); c.moveTo(x, y - 44); c.lineTo(x + 44, y); c.lineTo(x, y + 44); c.lineTo(x - 44, y); c.closePath(); c.stroke(); }
    c.fillStyle = "#c9973a"; for (const [x, y] of [[w / 2, h / 2], [0, 0], [w, h], [w, 0], [0, h]]) { c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill(); } }, 1, 1);
  const carpetM = M({ map: carpetT, roughness: 0.95, emissive: 0xffffff, emissiveMap: carpetT, emissiveIntensity: 0.18 });
  flat(carpetM, carpetT, -IX, IX, IZ0, IZ1, 0.125, true);
  for (const r of RECTS) flat(carpetM, carpetT, r[0], r[1], r[2], r[3], FL2 + 0.01, true);
  const ceilT = tex(128, 128, (c, w, h) => { c.fillStyle = "#1d1410"; c.fillRect(0, 0, w, h); c.fillStyle = "#2c1e15"; c.fillRect(14, 14, w - 28, h - 28); c.strokeStyle = "#c9973a"; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8); }, 1, 1);
  const ceilM = M({ map: ceilT, emissive: 0xffffff, emissiveMap: ceilT, emissiveIntensity: 0.35 });
  for (const r of RECTS) flat(ceilM, ceilT, r[0], r[1], r[2], r[3], HG - 0.02, false);
  flat(ceilM, ceilT, -IX, IX, IZ0, IZ1, H2 - 0.02, false);
  // Geschossdecke um das Treppenloch (Kollision = Boden des 2. Stocks), goldene Kante am Loch
  for (const [x0, x1, z0, z1] of RECTS) { box(x1 - x0, 0.3, z1 - z0, black, (x0 + x1) / 2, HG + 0.15, (z0 + z1) / 2); C.push([x1 - x0, 0.3, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2, HG]); }
  box(2 * SW + 0.1, 0.32, 0.06, gold, 0, HG + 0.15, ZS - 0.03); for (const sx of [-1, 1]) box(0.06, 0.32, ZE - ZS, gold, sx * (SW + 0.03), HG + 0.15, (ZS + ZE) / 2);
  const panT = tex(128, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "#3a2214"); gr.addColorStop(0.5, "#4e2e1a"); gr.addColorStop(1, "#3a2214"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#c9973a"; c.fillRect(0, h * 0.62, w, 4); c.fillRect(0, h - 6, w, 6); c.fillRect(0, 0, 3, h); }, 1, 1);
  const panM = M({ map: panT, emissive: 0xffffff, emissiveMap: panT, emissiveIntensity: 0.25 }); panT.wrapS = THREE.RepeatWrapping;
  const wallP = (w, h, x, y, z, ry, ry2 = 1, oy = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), panM.clone()); p.material.map = p.material.emissiveMap = panT.clone(); p.material.map.repeat.set(w / 3, ry2); p.material.map.offset.y = oy; p.material.map.wrapS = THREE.RepeatWrapping; p.material.map.needsUpdate = true; p.position.set(x, y, z); p.rotation.y = ry; g.add(p); return p; };
  const HU = H2 - FL2, YU = FL2 + HU / 2;
  wallP(2 * IX, HG, 0, HG / 2, IZ1 - 0.01, Math.PI); wallP(2 * IX, HU, 0, YU, IZ1 - 0.01, Math.PI);
  for (const sx of [-1, 1]) { wallP(IL, HG, sx * (IX - 0.01), HG / 2, IC, -sx * Math.PI / 2); wallP(IL, HU, sx * (IX - 0.01), YU, IC, -sx * Math.PI / 2); }
  // Innenseite der Frontwand (Nicolas 2026-11-17: "die eine Wand ist noch haesslich"): unten links/rechts der Tuer und darueber, oben ganz
  { const fw = IX - DW; for (const sx of [-1, 1]) wallP(fw, HG, sx * (DW + fw / 2), HG / 2, IZ0 + 0.01, 0); wallP(2 * DW, HG - 4, 0, 4 + (HG - 4) / 2, IZ0 + 0.01, 0, (HG - 4) / HG, 4 / HG); wallP(2 * IX, HU, 0, YU, IZ0 + 0.01, 0); }
  // Fenster im 2. Stock (gleiche Achsen wie die Fensterbaender aussen): Nachtstadt hinter Glas
  const cityT = canvasTex(128, 96, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0b1530"); gr.addColorStop(1, "#24304e"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 14) { const t = 30 + ((x * 37) % 50); c.fillStyle = "#0a0d16"; c.fillRect(x, t, 12, h - t); for (let y = t + 4; y < h - 4; y += 7) for (let k = 0; k < 2; k++) if ((x + y * 3 + k * 5) % 4) { c.fillStyle = (x + y) % 3 ? "#f5c66a" : "#9fd0ff"; c.fillRect(x + 2 + k * 5, y, 3, 3); } } });
  { const win = []; for (let x = -BW / 2 + BW / 20; x < BW / 2; x += BW / 10) win.push(x); const ww = BW / 10 - 1.4, wm = new THREE.MeshBasicMaterial({ map: cityT });
    for (const x of win) { const p = new THREE.Mesh(new THREE.PlaneGeometry(ww, 3.2), wm); p.position.set(x, 9.5, IZ0 + 0.03); g.add(p); box(ww + 0.2, 0.08, 0.2, gold, x, 7.86, IZ0 + 0.1); box(ww + 0.2, 0.08, 0.1, gold, x, 11.14, IZ0 + 0.05); } }
  // Kronleuchter (unten und oben, nicht ueber dem Treppenloch)
  const lights = [];
  for (const x of [-12, 0, 12]) for (const z of [IC - 6, IC + 6]) { if (!(x === 0 && z > ZS - 1)) lights.push([x, HG - 1.7, z]); if (!(x === 0 && z > ZS - 1)) lights.push([x, H2 - 1.7, z]); }
  inst(new THREE.TorusGeometry(1.3, 0.08, 6, 24), gold, lights.map(p => [p[0], p[1], p[2], 0, Math.PI / 2]));
  inst(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), gold, lights.map(p => [p[0], p[1] + 0.85, p[2]]));
  const crysM = new THREE.MeshBasicMaterial({ color: 0xfff1c9 }), cr = []; for (const p of lights) { for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; cr.push([p[0] + Math.cos(a) * 1.3, p[1] - 0.25, p[2] + Math.sin(a) * 1.3]); } cr.push([p[0], p[1] - 0.5, p[2], 0, 0, 2.2]); }
  // grosser Kronleuchter im Treppenloch: drei Ringe uebereinander an einer langen Kette
  { const cx = 0, cz = (ZS + ZE) / 2; cyl(0.05, 0.05, H2 - 9.2, gold, cx, (H2 + 9.2) / 2, cz, 6);
    for (const [r, y] of [[2.6, 9.2], [1.9, 8.6], [1.1, 8.0]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 6, 40), gold); t.rotation.x = Math.PI / 2; t.position.set(cx, y, cz); g.add(t);
      const n = Math.round(r * 11); for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; cr.push([cx + Math.cos(a) * r, y - 0.25, cz + Math.sin(a) * r, 0, 0, 1.2]); cr.push([cx + Math.cos(a) * r, y - 0.55, cz + Math.sin(a) * r, 0, 0, 0.8]); } }
    cr.push([cx, 7.4, cz, 0, 0, 4]); }
  inst(new THREE.SphereGeometry(0.16, 10, 8), crysM, cr);
  // Spielautomaten (Bildschirm mit 777, leuchtende Haube): unten links ganz, unten rechts bis vor die Kasse, oben beidseits
  const slotT = tex(128, 96, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2a0a4a"); gr.addColorStop(1, "#0a0420"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.fillRect(8, 22, w - 16, 52); c.font = "bold 40px Arial Black, Arial"; c.textAlign = "center"; c.fillStyle = "#e0102a"; c.fillText("777", w / 2, 64); c.fillStyle = "#ffd23a"; c.font = "bold 14px Arial"; c.fillText("JACKPOT", w / 2, 16); });
  const KX0 = 6, KZ = 33, slots = [];
  const slotRun = (sx, z0, z1, y) => { let z = z0; for (; z < z1; z += 1.3) slots.push([sx * (IX - 0.55), y + 0.85, z, sx < 0 ? -Math.PI / 2 : Math.PI / 2]); C.push([1.1, 2.6, z - z0 + 0.75, sx * (IX - 0.55), (z0 + z - 1.3) / 2, y]);   // Automaten 1,25-fach (N20): Abstand 1,3 m, weiter von der Wand
    // Rechtsklick-Ziel je Reihe (unsichtbarer Kasten ueber die ganze Reihe; tore.js misst den Abstand zum Kasten)
    const hb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.6, z - z0 + 0.2), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set(sx * (IX - 0.55), y + 1.3, (z0 + z - 1.3) / 2); g.add(hb);
    CAS.gates.push({ name: "Spielautomat", m: hb, call: () => typeof slotOpen === "function" && slotOpen(null), verbs: ["spielen", "spielen"], near: 2.5 }); };
  slotRun(-1, IZ0 + 5, IZ1 - 6, 0); slotRun(1, IZ0 + 5, KZ - 1.5, 0); slotRun(-1, IZ0 + 7, IZ1 - 2, FL2); slotRun(1, IZ0 + 7, IZ1 - 4, FL2);
  // Spielautomaten als 3D-Modelle (gotham/spielautomat-modell.js, Nicolas 2026-11-17: eigener Bauschritt) in vier Gehaeusefarben, als Instanzen; ohne Modell-Datei die alten Kaesten
  if (typeof spielautomatInstanzen === "function") { const cols = [0x6a1ab0, 0xb01028, 0x1a4ab0, 0x0f7a4a]; spielautomatInstanzen(g, slots.map((t, i) => [t[0], t[1] - 0.85, t[2], t[3], cols[(i * 7) % 4]])); }
  else { inst(new THREE.BoxGeometry(0.8, 1.7, 0.7), M({ color: 0x1b1d24, metalness: 0.5, roughness: 0.4 }), slots, true);
  inst(new THREE.PlaneGeometry(0.6, 0.45).rotateY(Math.PI).translate(0, 0.38, -0.36), M({ map: slotT, emissive: 0xffffff, emissiveMap: slotT, emissiveIntensity: 0.9 }), slots);
  inst(new THREE.BoxGeometry(0.82, 0.22, 0.72).translate(0, 0.96, 0), new THREE.MeshBasicMaterial({ color: 0xffb02e }), slots); }
  // Tische: Roulette (Rechtsklick spielt), Blackjack halbrund, Poker oval; Jeton-Stapel darauf
  const stools = [], chairs = [], chipL = [];
  const rouTable = (x, z, y, sx) => { CAS.personal.push([x - sx * 1.0, y, z - 1.25, Math.PI, "croupier"]); CAS.rouT.push(box(3.4, 0.82, 1.7, wood, x, y + 0.41, z)); const top = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.5), felt); top.rotation.x = -Math.PI / 2; top.position.set(x, y + 0.83, z); g.add(top);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.16, 32), [wood, M({ map: rouTex, emissive: 0x150808, emissiveIntensity: 1 }), wood]); wheel.position.set(x - sx * 1.15, y + 0.92, z); g.add(wheel); C.push([3.4, 0.9, 1.7, x, z, y]);
    for (const dx of [-0.9, 0, 0.9]) stools.push([x + dx, y + 0.38, z + 1.35]); chipL.push([x + sx * 0.4, y + 0.835, z - 0.3, [[100, 4, 0, 0], [1000, 2, 0.06, 0.05], [10, 6, -0.07, 0.03]]]); };
  const bjTable = (x, z, y) => { CAS.personal.push([x, y, z + 0.55, 0, "croupier"]); { const hm = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 2.6), new THREE.MeshBasicMaterial({ visible: false })); hm.position.set(x, y + 0.6, z - 0.4); g.add(hm); CAS.gates.push({ name: "Blackjack", m: hm, call: () => typeof cgOpen === "function" && cgOpen("bj"), verbs: ["spielen", "spielen"], near: 3.5 }); } const bj = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.82, 32, 1, false, Math.PI / 2, Math.PI), wood); bj.position.set(x, y + 0.41, z); g.add(bj);
    const bt = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32, Math.PI, Math.PI), felt); bt.rotation.x = -Math.PI / 2; bt.position.set(x, y + 0.83, z); g.add(bt); C.push([3.4, 0.9, 1.7, x, z - 0.4, y]);
    for (let k = 0; k < 5; k++) { const a = Math.PI * (0.15 + k * 0.175); stools.push([x - Math.cos(a) * 2.2, y + 0.38, z - Math.sin(a) * 2.2]); } chipL.push([x, y + 0.835, z - 0.35, [[100, 6, -0.1, 0], [1000, 4, 0.1, 0], [10000, 2, 0, 0.1]]]); };
  const pokerTable = (x, z, y) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.8, 40), wood); b.scale.set(1.7, 1, 1); b.position.set(x, y + 0.4, z); g.add(b);
    const t = new THREE.Mesh(new THREE.CircleGeometry(0.92, 40), felt); t.scale.set(1.7, 1, 1); t.rotation.x = -Math.PI / 2; t.position.set(x, y + 0.81, z); g.add(t);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.06, 6, 40), M({ color: 0x241208, roughness: 0.5 })); rim.scale.set(1.7, 1, 1); rim.rotation.x = Math.PI / 2; rim.position.set(x, y + 0.81, z); g.add(rim); C.push([3.5, 0.9, 2.1, x, z, y]);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; chairs.push([x + Math.cos(a) * 2.35, y, z + Math.sin(a) * 1.6, -a - Math.PI / 2]); } chipL.push([x, y + 0.815, z, [[100, 5, -0.4, 0.1], [1000, 3, 0.3, -0.1], [10, 8, 0, 0.25], [10000, 1, 0.5, 0.2]]]); };
  for (const sx of [-1, 1]) { rouTable(sx * 8, IC - 4, 0, sx); bjTable(sx * 8, IC + 5, 0); pokerTable(sx * 10, IC - 3, FL2); }
  rouTable(-11, IZ1 - 7, FL2, -1); bjTable(12, IZ1 - 6.5, FL2);
  // Bar hinten links: Theke, Regal mit Flaschen, Hocker
  { const bw = 13, bx = -IX + 1.5 + bw / 2, bz = IZ1 - 3.4; box(bw, 1.1, 0.9, wood, bx, 0.55, bz); box(bw + 0.2, 0.08, 1.1, gold, bx, 1.14, bz); C.push([bw, 1.2, 0.9, bx, bz]);
    box(bw, 2.8, 0.5, wood, bx, 1.4, IZ1 - 0.3); const glow = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.4, 2.2), new THREE.MeshBasicMaterial({ color: 0xffb860 })); glow.position.set(bx, 1.55, IZ1 - 0.56); glow.rotation.y = Math.PI; g.add(glow); C.push([bw, 2.8, 0.6, bx, IZ1 - 0.3]);
    for (const y of [0.9, 1.6, 2.3]) box(bw - 0.4, 0.05, 0.4, gold, bx, y, IZ1 - 0.65);
    const bott = [], bcol = []; let k = 0; for (const y of [0.92, 1.62, 2.32]) for (let x = bx - bw / 2 + 0.5; x < bx + bw / 2 - 0.4; x += 0.32) { bott.push([x, y + 0.14, IZ1 - 0.7]); bcol.push([0x2f7d3a, 0x8a3a12, 0xd8c070, 0x1e3a6a, 0x6a1a2a][k++ % 5]); }
    const im = inst(new THREE.CylinderGeometry(0.06, 0.07, 0.28, 8), new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.1, emissive: 0x222222 }), bott); bcol.forEach((cc, i) => im.setColorAt(i, new THREE.Color(cc))); im.instanceColor.needsUpdate = true;
    for (let x = bx - bw / 2 + 1; x <= bx + bw / 2 - 1; x += 1.4) stools.push([x, 0.38, bz - 1.1]);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.7), new THREE.MeshBasicMaterial({ map: canvasTex(256, 44, (c, w, h) => { c.fillStyle = "#0c0a08"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffb860"; c.font = "italic bold 30px Georgia, serif"; c.textAlign = "center"; c.fillText("Bar Noir", w / 2, 32); }) }));
    sg.position.set(bx, 3.4, IZ1 - 0.03); sg.rotation.y = Math.PI; g.add(sg); }
  // ---- Kasse (Nicolas 2026-11-17: "komplett ueberarbeiten, mehr Platz fuer Mitarbeiter hinten") ----
  // Front bei z KZ von x KX0 bis zur Seitenwand: Theke mit Marmor, Glas bis 2,7 m mit drei Schaltern (Sprechgitter, Geldschale, Kasse), darueber Holzwand mit Leuchtschild;
  // Seitenwand bei x KX0 mit Personaltuer; dahinter ca. 16 x 8 m Personalbereich mit Hockern, Schreibtischen, Regal (Tageskasse) und dem Tresorraum.
  const KW = IX - KX0, KXM = (KX0 + IX) / 2, DZ0 = IZ1 - 3.1, DZ1 = IZ1 - 1.7;
  box(KW, 1.1, 0.7, wood, KXM, 0.55, KZ); box(KW + 0.12, 0.06, 0.95, marble, KXM, 1.13, KZ); box(KW, 0.1, 0.72, gold, KXM, 0.17, KZ - 0.01);
  const glassK = new THREE.MeshStandardMaterial({ color: 0xa8d0e6, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const kGlass = new THREE.Mesh(new THREE.PlaneGeometry(KW, 1.55), glassK); kGlass.position.set(KXM, 1.16 + 0.775, KZ); g.add(kGlass);
  for (let i = 0; i <= 6; i++) box(0.07, 1.55, 0.1, gold, KX0 + i * KW / 6, 1.16 + 0.775, KZ); box(KW, 0.08, 0.14, gold, KXM, 2.74, KZ);
  box(KW, HG - 2.78, 0.3, wood, KXM, 2.78 + (HG - 2.78) / 2, KZ); wallP(KW, HG - 2.78, KXM, 2.78 + (HG - 2.78) / 2, KZ - 0.16, Math.PI, (HG - 2.78) / HG);
  C.push([KW, HG, 0.75, KXM, KZ]);
  for (let k = 0; k < 3; k++) { const x = KX0 + KW * (k + 0.5) / 3; cyl(0.16, 0.16, 0.03, gold, x, 1.55, KZ - 0.02, 20).rotation.x = Math.PI / 2; box(0.7, 0.04, 0.5, gold, x, 1.18, KZ - 0.1);
    box(0.5, 0.25, 0.4, M({ color: 0x24272c }), x + 0.6, 1.29, KZ + 0.25); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), screenM); sc.position.set(x + 0.6, 1.5, KZ + 0.3); sc.rotation.y = Math.PI; g.add(sc);
    if (k !== 1) CAS.personal.push([x, 0, KZ + 0.75, 0, "kasse"]); stools.push([x, 0.38, KZ + 1.0]); chipL.push([x - 0.1, 1.165, KZ - 0.08, [[1000, 3, 0, 0], [100, 5, 0.12, 0.02]]]);
    const nr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), new THREE.MeshBasicMaterial({ map: canvasTex(128, 46, (c, w, h) => { c.fillStyle = "#0c0a08"; c.fillRect(0, 0, w, h); c.fillStyle = "#7fe08a"; c.font = "bold 30px Arial"; c.textAlign = "center"; c.fillText("Schalter " + (k + 1), w / 2, 34); }) }));
    nr.position.set(x, 2.55, KZ - 0.06); nr.rotation.y = Math.PI; g.add(nr); }
  { const sg = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.15), new THREE.MeshBasicMaterial({ map: canvasTex(512, 84, (c, w, h) => { c.fillStyle = "#0c0a08"; c.fillRect(0, 0, w, h); c.strokeStyle = "#c9973a"; c.lineWidth = 4; c.strokeRect(4, 4, w - 8, h - 8); c.shadowColor = "#ffb02e"; c.shadowBlur = 12; c.fillStyle = "#ffd23a"; c.font = "bold 46px Arial"; c.textAlign = "center"; c.fillText("KASSE · JETONS", w / 2, 58); }) }));
    sg.position.set(KXM, 4.1, KZ - 0.32); sg.rotation.y = Math.PI; g.add(sg); }
  // Seitenwand mit Personaltuer (Durchgang 1,4 x 2,5 m) und Schild
  box(0.3, HG, DZ0 - KZ, wood, KX0, HG / 2, (KZ + DZ0) / 2); box(0.3, HG, IZ1 - DZ1, wood, KX0, HG / 2, (DZ1 + IZ1) / 2); box(0.3, HG - 2.5, DZ1 - DZ0, wood, KX0, 2.5 + (HG - 2.5) / 2, (DZ0 + DZ1) / 2);
  wallP(DZ0 - KZ, HG, KX0 - 0.16, HG / 2, (KZ + DZ0) / 2, -Math.PI / 2); wallP(IZ1 - DZ1, HG, KX0 - 0.16, HG / 2, (DZ1 + IZ1) / 2, -Math.PI / 2); wallP(DZ1 - DZ0, HG - 2.5, KX0 - 0.16, 2.5 + (HG - 2.5) / 2, (DZ0 + DZ1) / 2, -Math.PI / 2, (HG - 2.5) / HG, 2.5 / HG);
  C.push([0.35, HG, DZ0 - KZ, KX0, (KZ + DZ0) / 2]); C.push([0.35, HG, IZ1 - DZ1, KX0, (DZ1 + IZ1) / 2]);
  for (const z of [DZ0, DZ1]) box(0.4, 2.6, 0.1, gold, KX0, 1.3, z); box(0.4, 0.1, DZ1 - DZ0 + 0.1, gold, KX0, 2.55, (DZ0 + DZ1) / 2);
  { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: canvasTex(192, 48, (c, w, h) => { c.fillStyle = "#1a1206"; c.fillRect(0, 0, w, h); c.fillStyle = "#e8c547"; c.font = "bold 22px Arial"; c.textAlign = "center"; c.fillText("NUR PERSONAL", w / 2, 32); }) }));
    p.position.set(KX0 - 0.17, 2.85, (DZ0 + DZ1) / 2); p.rotation.y = -Math.PI / 2; g.add(p); }
  // Personalbereich: Parkett, Schreibtische mit Bildschirm, Stuehle, Regal mit Geldbuendeln
  { const fm = new THREE.Mesh(new THREE.PlaneGeometry(KW - 0.2, IZ1 - KZ - 0.4), M({ color: 0x4a3322, roughness: 0.7, emissive: 0x1a0f08, emissiveIntensity: 0.5 })); fm.rotation.x = -Math.PI / 2; fm.position.set(KXM + 0.1, 0.13, (KZ + IZ1) / 2 + 0.2); g.add(fm); }
  for (const x of [8.6, 12.0]) { box(2.4, 0.06, 1, wood, x, 0.76, 36.6); for (const s of [-1, 1]) box(0.06, 0.74, 0.9, wood, x + s * 1.15, 0.37, 36.6); C.push([2.4, 0.8, 1, x, 36.6]);
    box(0.7, 0.42, 0.05, M({ color: 0x111316 }), x - 0.4, 1.05, 36.3); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.36), screenM); sc.position.set(x - 0.4, 1.05, 36.32); g.add(sc);
    box(0.36, 0.2, 0.3, M({ color: 0x9aa0a6 }), x + 0.55, 0.89, 36.6); chairs.push([x, 0, 37.6, Math.PI]); }
  { const rx = 10.4, rw = 8, rz = IZ1 - 0.35; box(rw, 0.06, 0.55, wood, rx, 2.3, rz); for (const s of [-1, 1]) box(0.06, 2.3, 0.55, wood, rx + s * rw / 2, 1.15, rz); for (const y of [0.4, 1.05, 1.7]) box(rw, 0.05, 0.55, wood, rx, y, rz); C.push([rw, 2.35, 0.6, rx, rz]);
    const bund = []; for (const y of [0.43, 1.08, 1.73]) for (let x = rx - rw / 2 + 0.3; x < rx + rw / 2 - 0.2; x += 0.24) if ((x * 7 + y * 3) % 1 > 0.25) bund.push([x, y + 0.06, rz, 0]);
    inst(new THREE.BoxGeometry(0.18, 0.1, 0.4), M({ color: 0x4f8a4a, roughness: 0.8 }), bund);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.24), new THREE.MeshBasicMaterial({ map: canvasTex(160, 28, (c, w, h) => { c.fillStyle = "#1a1206"; c.fillRect(0, 0, w, h); c.fillStyle = "#e8c547"; c.font = "bold 18px Arial"; c.textAlign = "center"; c.fillText("TAGESKASSE", w / 2, 20); }) })); sg.position.set(rx, 2.55, IZ1 - 0.05); sg.rotation.y = Math.PI; g.add(sg); }
  // ---- Tresor (Nicolas 2026-11-17: "einen Tresor"; dann "viel zu gross, lieber einen kleinen, so gross wie ein Bankautomat"): Stahlschrank 0,95 x 1,85 x 0,85 m
  // hinten rechts im Personalbereich, Tuer mit Drehrad, Zahlenschloss und Scharnieren (Rechtsklick oeffnet/schliesst, dreht in casinoStep), innen zwei Boeden mit Gold, Geld und Jetons
  { const tw = 0.95, th = 1.85, td = 0.85, tx = IX - 1.2, tz = IZ1 - 0.3 - td / 2, t = 0.07, fz = tz - td / 2, vc = M({ color: 0x5d636b, metalness: 0.8, roughness: 0.35 });
    box(tw + 0.08, 0.1, td + 0.04, M({ color: 0x1a1b1e }), tx, 0.05, tz);                                           // Sockel
    C.push([tw + 0.1, th + 0.1, td, tx, tz]);
    // seit 2026-11-18 ein echter Tresor der Stufe 3 (gotham/tresor.js, N23): Code 0000 oder aufsprengen, Inhalt im Behaelter-Fenster
    if (typeof tresorAdd === "function") { const T = tresorAdd(g, 3, "casino", new THREE.Vector3(tx, 0.1, tz), 0, [["goldbarren", 6], ["jeton-1000", 20], ["jeton-10000", 5]], true); CAS.gates.push({ name: "Tresor", m: T.g, call: () => tresorUse(T), verbs: ["benutzen", "benutzen"], near: 3 }); } }
  // ---- Freitreppe in der Mitte hinten (Nicolas: "grosszuegige Treppe hoch"): Marmorstufen mit rotem Laeufer, Gelaender mit Goldstaeben, Pfosten mit Leuchtkugeln ----
  // Begehbar als Rampe (CAS.ramp, je Stufe ein geneigtes dk-Stueck wie die Parkhaus-Rampen, sonst ruckelt es): [Breite, z-Mitte, Hoehe in der Mitte]
  const bal = [];
  for (let i = 0; i < NS; i++) { const top = (i + 1) * RS, zc = ZS + (i + 0.5) * TS; box(2 * SW, top, TS, marble, 0, top / 2, zc); box(4.6, 0.02, TS, red, 0, top + 0.01, zc); box(4.6, RS, 0.02, red, 0, top - RS / 2, zc - TS / 2 - 0.005);
    box(2 * SW + 0.02, 0.03, 0.04, gold, 0, top - 0.015, zc - TS / 2 + 0.02); CAS.ramp.push([2 * SW, zc, (i + 0.5) * RS]);
    for (const sx of [-1, 1]) bal.push([sx * (SW - 0.12), top + 0.47, zc]); }
  inst(new THREE.CylinderGeometry(0.025, 0.035, 0.94, 8), gold, bal);
  { const len = Math.hypot(ZE - ZS, FL2), ang = Math.atan2(FL2, ZE - ZS); for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, len), gold); r.position.set(sx * (SW - 0.12), FL2 / 2 + 0.95, (ZS + ZE) / 2); r.rotation.x = -ang; g.add(r);
      cyl(0.1, 0.13, 1.25, gold, sx * (SW - 0.12), 0.625, ZS - 0.15, 12); const gl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c9 })); gl.position.set(sx * (SW - 0.12), 1.4, ZS - 0.15); g.add(gl); C.push([0.4, 1.4, 0.4, sx * (SW - 0.12), ZS - 0.15]); } }
  box(2 * SW + 1.4, 0.04, 1.6, red, 0, 0.145, ZS - 0.9);
  // Galerie-Gelaender im 2. Stock um das Loch (vorne und an den Seiten)
  { const posts = [], rail = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 0.35); for (let i = 0; i <= n; i++) posts.push([x0 + (x1 - x0) * i / n, FL2 + 0.5, z0 + (z1 - z0) * i / n]);
      box(Math.abs(x1 - x0) + 0.1, 0.08, Math.abs(z1 - z0) + 0.1, gold, (x0 + x1) / 2, FL2 + 1.02, (z0 + z1) / 2); C.push([Math.abs(x1 - x0) + 0.2, 1.1, Math.abs(z1 - z0) + 0.2, (x0 + x1) / 2, (z0 + z1) / 2, FL2]); };
    rail(-SW - 0.1, ZS - 0.1, SW + 0.1, ZS - 0.1); for (const sx of [-1, 1]) rail(sx * (SW + 0.1), ZS - 0.1, sx * (SW + 0.1), ZE - 0.6);
    inst(new THREE.CylinderGeometry(0.025, 0.025, 1, 8), gold, posts); }
  // ---- 2. Stock: Lounge an den Fenstern (Sofas aus rotem Samt, niedrige Tische) ----
  for (const sx of [-1, 1]) for (const cxs of [10.5, 17]) { const x = sx * cxs;
    for (const [z, f] of [[IZ0 + 1.4, 1], [IZ0 + 5.0, -1]]) { box(3.6, 0.45, 0.9, velvet, x, FL2 + 0.225, z); box(3.6, 0.55, 0.22, velvet, x, FL2 + 0.7, z - f * 0.34); for (const s of [-1, 1]) box(0.22, 0.65, 0.9, velvet, x + s * 1.8, FL2 + 0.33, z); C.push([3.9, 0.9, 0.95, x, z, FL2]); }
    box(1.8, 0.4, 0.9, M({ color: 0x15100c, roughness: 0.2, metalness: 0.3 }), x, FL2 + 0.2, IZ0 + 3.2); box(1.82, 0.03, 0.92, gold, x, FL2 + 0.41, IZ0 + 3.2); C.push([1.8, 0.45, 0.9, x, IZ0 + 3.2, FL2]); }
  // Saeulen unten und oben (x +-14 bei z IC - 8 und IC + 4)
  for (const x of [-14, 14]) for (const z of [IC - 8, IC + 4]) for (const [y0, h] of [[0, HG], [FL2, H2 - FL2]]) { cyl(0.45, 0.45, h, black, x, y0 + h / 2, z, 16); cyl(0.6, 0.6, 0.3, gold, x, y0 + 0.15, z, 16); cyl(0.6, 0.6, 0.3, gold, x, y0 + h - 0.3, z, 16); C.push([1, h, 1, x, z, y0]); }
  // Hocker, Stuehle (Poker, Buero), Jetons auf den Tischen
  inst(new THREE.CylinderGeometry(0.22, 0.18, 0.76, 12), M({ color: 0x8a0f17, roughness: 0.6 }), stools);
  inst(new THREE.BoxGeometry(0.5, 0.5, 0.5).translate(0, 0.25, 0), M({ color: 0x2a1a10, roughness: 0.6 }), chairs); inst(new THREE.BoxGeometry(0.5, 0.6, 0.08).translate(0, 0.8, 0.22), velvet, chairs);
  if (typeof jetStacks === "function") for (const [x, y, z, list] of chipL) { const st = jetStacks(list, 1.6); st.position.set(x, y, z); g.add(st); }
  // ---- Bankautomaten und Jeton-Automaten auf beiden Etagen (Rechtsklick) ----
  const dev = (build, x, z, ry, y, name, call) => { if (!build) return; const d = build(); d.position.set(x, y, z); d.rotation.y = ry; g.add(d);
    const hb = new THREE.Mesh(new THREE.BoxGeometry(1, 2.3, 0.9), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set(x, y + 1.15, z); hb.rotation.y = ry; g.add(hb); C.push([1.05, 2.3, 0.9, x, z, y]); CAS.gates.push({ name, m: hb, call, near: 3.5 }); };
  const bank = () => typeof kontoOpen === "function" && kontoOpen(), jet = ort => () => typeof jetonOpen === "function" && jetonOpen(ort);
  const BA = typeof buildBankautomat === "function" && buildBankautomat, JA = typeof buildJetonAutomat === "function" && buildJetonAutomat;
  dev(BA, 6.5, IZ0 + 0.45, Math.PI, 0, "Bankautomat", bank); dev(JA, -6.5, IZ0 + 0.45, Math.PI, 0, "Jeton-Automat", jet("Jeton-Automat"));
  dev(JA, KX0 - 0.6, KZ + 1.3, -Math.PI / 2, 0, "Jeton-Automat", jet("Jeton-Automat"));
  dev(BA, 6.4, IZ1 - 0.45, 0, FL2, "Bankautomat", bank); dev(JA, 7.9, IZ1 - 0.45, 0, FL2, "Jeton-Automat", jet("Jeton-Automat")); dev(JA, -6.5, IZ0 + 0.45, Math.PI, FL2, "Jeton-Automat", jet("Jeton-Automat"));
  // Casino-Spiele (Nicolas 2026-11-18, N29, gotham-casino.js "ins Casino"): Crash und Mines an der Frontwand neben Jeton- und Bankautomat, Gluecksrad mittig vor dem Eingang mit Blick zur Tuer
  if (typeof buildCrashAutomat === "function") { dev(buildCrashAutomat, -10, IZ0 + 0.65, Math.PI, 0, "Crash-Automat", () => cgOpen("crash")); dev(buildMinesAutomat, 10, IZ0 + 0.65, Math.PI, 0, "Mines-Automat", () => cgOpen("mines"));
    const rad = buildGluecksrad(); rad.position.set(0, 0.125, IZ0 + 7); g.add(rad); C.push([2.2, 2.7, 1.0, 0, IZ0 + 7]); CAS.gates.push({ name: "Glücksrad", m: rad, call: () => cgOpen("rad"), verbs: ["drehen", "drehen"], near: 3.5 }); }
  CAS.gates.push({ name: "Kasse", m: kGlass, call: jet("Kasse"), verbs: ["Jetons tauschen", "Jetons tauschen"], near: 3 });
}
// Tresortuer auf/zu (Rechtsklick); die Sperre in der Tueroeffnung gilt nur geschlossen
function casinoVault() { const V = CAS.vault; if (!V) return; V.open = !V.open; if (V.blk) V.blk.on = !V.open; if (V.gate) V.gate.verbs = V.open ? ["schließen", "schließen"] : ["öffnen", "öffnen"]; }
TILES.tasks.push({ gen: null, plan() {}, step() { if (CAS.done || TILES.startup) return false;
  if (!this.gen) this.gen = casinoGen(); const r = this.gen.next(); if (r.done) { CAS.done = true; this.gen = null; } return false; } });
// je Bild (schleife.js): Neonbuchstaben, Lauflicht, Wuerfel, Suchscheinwerfer; nur wenn die Kamera naeher als 1,5 km ist
function casinoStep() {
  const A = CAS.anim; if (!A) return; const p = camera.position, gp = A.g.position; if (Math.abs(p.x - gp.x) > 1500 || Math.abs(p.z - gp.z) > 1500) return;
  const t = (performance.now() - A.t0) / 1000, n = typeof night === "number" ? night : 0;
  // Buchstaben: 0-3 s nacheinander an, 3-4,2 s blinken, dann alle an bis 6 s
  const ph = t % 6; A.letters.forEach((m, i) => { const on = ph < 3 ? ph > i * 0.45 : ph < 4.2 ? Math.floor(ph * 6) % 2 === 0 : true; m.color.setScalar(on ? 1 : 0.18); });
  A.bulbs.offset.x = -(t * 2) % 1;
  const V = CAS.vault; if (V) { V.a += ((V.open ? V.max || 1.75 : 0) - V.a) * 0.06; V.piv.rotation.y = V.a; }
  A.dice.forEach((d, i) => { d.rotation.y = t * (0.5 + i * 0.2); d.rotation.x = 0.6 + Math.sin(t * 0.7 + i) * 0.2; });
  A.glass.emissiveIntensity = 0.8 * n;   // tagsueber 0 (sonst wirkt das Glas braun)
  A.beamM.opacity = 0.08 * n; A.beams.forEach(b => { b.visible = n > 0.05; b.rotation.y = t * 0.4 + b.userData.ph; });
}

// ---- Personal als Spielfiguren (F4 Teil 1, "Ja, weiter" 2026-11-19): figurPersonal(parent, [[x, y, z, Drehung, Art], ...]) stellt Figuren (js/spieler/figur.js, laedt spaeter: wartet
// darauf) in lokalen Koordinaten auf; sie atmen und drehen ab und zu den Kopf (FIGUREN mit Tempo 0, figurStep). Arten: croupier, kasse, polizei, wache.
const FIG_PERSONAL = {
  croupier: [{ oberteil: 0x111214, hose: 0x111214, schuhe: 0x0b0b0c, haar: 0x2a1a10, frisur: 0, schulter: 1.05 }, { haut: 0xd8a880, oberteil: 0x111214, hose: 0x111214, haar: 0xb03a20, frisur: 1, schulter: 0.9, groesse: 0.97 }, { haut: 0x8a5a3a, oberteil: 0x111214, hose: 0x111214, haar: 0x1a1a1a, frisur: 2 }],
  kasse: [{ oberteil: 0x6a1420, hose: 0x111214, haar: 0x3a2414, frisur: 1, schulter: 0.9, groesse: 0.96 }, { haut: 0xc68a60, oberteil: 0x6a1420, hose: 0x111214, haar: 0x0e0a08, frisur: 0 }],
  polizei: [{ oberteil: 0x1b2c4f, hose: 0x1b2c4f, schuhe: 0x0b0b0c, haar: 0x2a1a10, frisur: 0, schulter: 1.12 }, { haut: 0xb07850, oberteil: 0x1b2c4f, hose: 0x1b2c4f, schuhe: 0x0b0b0c, haar: 0x0e0a08, frisur: 3, bart: true, schulter: 1.15 }],
};
function figurPersonal(parent, liste) { if (typeof buildFigur !== "function" || typeof FIGUREN === "undefined") return setTimeout(() => figurPersonal(parent, liste), 500);
  liste.forEach(([x, y, z, ry, art], i) => { const V = FIG_PERSONAL[art] || FIG_PERSONAL.croupier, f = buildFigur(V[i % V.length]); f.position.set(x, y, z); f.rotation.y = ry; f.userData.keep = true; f.name = "Personal " + art; parent.add(f);
    f.userData.phase = Math.random() * 6; FIGUREN.push({ g: f, tempo: 0, personal: true }); }); }
