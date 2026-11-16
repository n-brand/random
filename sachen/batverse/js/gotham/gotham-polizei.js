// Batverse – Gotham: Polizeipraesidium (GCPD) mit Batsignal (PLAN-GOTHAM Phase 3, P3a; Ort "gcpd" aus daten.js, 80 x 60 m)
// Klassisches Skript nach gotham-casino.js. Steinbau der 30er (Fassade "stein" aus den Gebaeude-Vorlagen, leuchtet nachts mit den anderen):
// Hauptblock 6 Geschosse, zurueckgesetztes Obergeschoss, Mittelturm 45 m mit Uhr, Saeulenportal mit Freitreppe, gruenen Polizeilaternen und
// Schriftband GOTHAM CITY POLICE DEPARTMENT, Granit-Vorplatz mit Streifenwagen. Auf dem Dach das Batsignal: Scheinwerfer auf Drehgestell,
// nachts Lichtkegel in den Himmel und das Fledermaus-Zeichen in den Wolken; Rechtsklick/E am Scheinwerfer schaltet es (GCPD.on).
"use strict";
const GCPD = { done: false, on: true, sig: null };
function* gcpdGen() {
  while (!GSTR.done || !GBV) yield "wait";
  const O = GOTHAM.orte.find(o => o.id === "gcpd"); if (!O) return;
  const [cx, cz] = GOT.toGame(O.x, O.z), t = GOTHAM.manorLage.dreh * Math.PI / 180, ux = Math.cos(t), uz = -Math.sin(t), e2 = [-uz, ux];
  const L1 = O.w, L2 = O.d, Y = GOT.STR, P0 = [cx - ux * L1 / 2 - e2[0] * L2 / 2, cz - uz * L1 / 2 - e2[1] * L2 / 2];
  const f = gbvFrame({ P0, e1: [ux, uz], e2, L1, L2 }), out = new Map(), GH = GBV.GH, sm = L1 / 2;   // s 0..80 entlang der Front, t 0..60 nach hinten (Front t = 0, zur Strasse im Norden)
  const wall4 = (key, s0, s1, t0, t1, y0, y1) => { const W = s1 - s0, D = t1 - t0, o = gbvFrame({ P0: f.W(s0, t0, 0).filter((_, i) => i !== 1), e1: [ux, uz], e2, L1: W, L2: D });
    for (let k = 0; k < 4; k++) gbvWall(out, key, o, k, 0, o.side(k)[6], y0, y1, 0, GH, 0, 0, Y);
    gbvBox(out, "dach", f, (s0 + s1) / 2, (t0 + t1) / 2, W, D, y1 - 0.02, y1); for (let k = 0; k < 4; k++) gbvBoxSide(out, "kante", o, k, o.side(k)[6] / 2, -0.15, o.side(k)[6], 0.3, y1, y1 + 0.9); };
  // Vorplatz (Granit) und Gruenstreifen
  gbvBox(out, "beton", f, sm, L2 / 2 - 1, L1 + 16, L2 + 16, Y, Y + 0.05);
  // Hauptblock (6 Geschosse), Obergeschoss zurueckgesetzt, Mittelturm
  const H1 = Y + 6 * GH, H2 = H1 + 2 * GH, H3 = Y + O.h;
  wall4("stein", 4, L1 - 4, 8, L2 - 4, Y, H1);
  wall4("stein", 12, L1 - 12, 14, L2 - 10, H1, H2);
  wall4("stein", sm - 11, sm + 11, 6, 22, Y, H3);
  gbvBox(out, "kante", f, sm, 14, 24, 18, H3, H3 + 1.2); gbvBox(out, "kante", f, sm, 14, 14, 10, H3 + 1.2, H3 + 4); gbvBox(out, "eisen", f, sm, 14, 0.4, 0.4, H3 + 4, H3 + 12);   // Turmkrone, Fahnenmast
  // Gesimse und Sockel (heller Stein)
  for (const [y, w] of [[Y + 2 * GH, 0.5], [H1 - 0.4, 0.8]]) { gbvBox(out, "kante", f, sm, 8 - w / 2 + 0.1, L1 - 8 + 1, w, y, y + 0.45); gbvBox(out, "kante", f, sm, L2 - 4 + w / 2 - 0.1, L1 - 8 + 1, w, y, y + 0.45); gbvBox(out, "kante", f, 4 - w / 2 + 0.1, L2 / 2 + 2, w, L2 - 12, y, y + 0.45); gbvBox(out, "kante", f, L1 - 4 + w / 2 - 0.1, L2 / 2 + 2, w, L2 - 12, y, y + 0.45); }
  gbvBox(out, "kante", f, sm, L2 / 2 + 2, L1 - 7.4, L2 - 11.4, Y, Y + 1.2, null, false);
  // Portal: Freitreppe, sechs Saeulen, Gebaelk mit Giebelfeld
  const step = i => [sm, (1.8 - i * 0.45 + 6) / 2, 26 + i * 0.8, 6 - 1.8 + i * 0.45, Y, Y + 1.2 - i * 0.24];   // i = 0: Podest t 1,8..6, darunter 4 Stufen
  for (let i = 0; i < 5; i++) gbvBox(out, "kante", f, ...step(i));
  for (let i = 0; i < 6; i++) { gbvCyl(out, "kante", f, sm - 10 + i * 4, 3, 0.7, Y + 1.2, Y + 11, 14); gbvBox(out, "kante", f, sm - 10 + i * 4, 3, 1.8, 1.8, Y + 11, Y + 11.5); }
  gbvBox(out, "kante", f, sm, 3.9, 24, 4.4, Y + 11.5, Y + 13.5); gbvBox(out, "kante", f, sm, 4, 20, 4, Y + 13.5, Y + 15.5); gbvBox(out, "eisen", f, sm, 5.9, 6, 0.2, Y + 1.2, Y + 6.5);   // Gebaelk, Attika, Tuer
  const grp = gbvMesh(out); grp.name = "Gotham Polizeipräsidium"; grp.userData.keep = true; grp.userData.noLift = true;
  const gm = new THREE.Group(); gm.add(grp); scene.add(gm); yield;
  // Schriftband, Uhr, Laternen (eigene Netze in Turm-Ausrichtung)
  const rotY = Math.atan2(-e2[0], -e2[1]);   // Ebene schaut nach -t (Front)
  const plane = (tex, w, h, s, tt, y, mat = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, ...mat })); const [x, , z] = f.W(s, tt, y); m.position.set(x, y, z); m.rotation.y = rotY; gm.add(m); return m; };
  const band = canvasTex(1024, 96, (c, w, h) => { c.fillStyle = "#cfc8ba"; c.fillRect(0, 0, w, h); c.fillStyle = "#3c3a36"; let px = 54; c.font = "bold 54px Georgia, serif"; while (c.measureText("GOTHAM CITY POLICE DEPARTMENT").width > w - 40) { px -= 2; c.font = "bold " + px + "px Georgia, serif"; } c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("GOTHAM CITY POLICE DEPARTMENT", w / 2, h / 2 + 3); });
  plane(band, 22, 2, sm, 1.65, Y + 12.5);
  const clock = canvasTex(256, 256, (c, w) => { const r = w / 2; c.fillStyle = "#e9e2cf"; c.beginPath(); c.arc(r, r, r - 4, 0, 7); c.fill(); c.lineWidth = 10; c.strokeStyle = "#2b2a27"; c.stroke(); c.fillStyle = "#2b2a27";
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(r + Math.sin(a) * (r - 26) - 4, r - Math.cos(a) * (r - 26) - 10, 8, 20); } c.beginPath(); c.arc(r, r, 8, 0, 7); c.fill(); });
  const clk = plane(clock, 6, 6, sm, 5.92, H3 - 6, { emissive: 0xffe9b0, emissiveMap: clock, emissiveIntensity: 0 }), hands = [];
  for (const [len, wd] of [[1.7, 0.22], [2.5, 0.14]]) { const h = new THREE.Mesh(new THREE.BoxGeometry(wd, len, 0.05), GBV.mats.eisen); h.geometry.translate(0, len / 2, 0); const pv = new THREE.Group(); pv.position.copy(clk.position); pv.rotation.y = rotY; pv.translateZ(0.08); pv.add(h); gm.add(pv); hands.push(h); }
  const lampM = new THREE.MeshStandardMaterial({ color: 0x2f8a46, emissive: 0x3cff6e, emissiveIntensity: 0.2, roughness: 0.3 });
  for (const sx of [-1, 1]) { const [x, , z] = f.W(sm + sx * 15, -1.5, 0); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.4, 8), GBV.mats.eisen); post.position.set(x, Y + 1.7, z); gm.add(post);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), lampM); gl.position.set(x, Y + 3.7, z); gm.add(gl); }
  // Batsignal auf dem Hauptdach (vorne rechts), zielt schraeg nach Norden in den Himmel
  const [bx, , bz] = f.W(L1 - 14, 18, 0), by = H1 + 0.9, base = new THREE.Group(); base.position.set(bx, by, bz); gm.add(base);
  const steel = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.5, metalness: 0.6 });
  { const plat = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.5, 24), steel); plat.position.y = 0.25; base.add(plat); for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 0.6), steel); arm.position.set(sx * 1.55, 1.8, 0); base.add(arm); } }
  const head = new THREE.Group(); head.position.y = 2.8; base.add(head);
  const lensTex = canvasTex(256, 256, (c, w) => { const r = w / 2, g = c.createRadialGradient(r, r, 10, r, r, r); g.addColorStop(0, "#fff8d8"); g.addColorStop(1, "#d8b860"); c.fillStyle = g; c.fillRect(0, 0, w, w); batShape(c, r, r * 1.04, w * 0.78, "#111"); });
  { const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.1, 2.6, 28, 1, true), steel); drum.rotation.x = Math.PI / 2; head.add(drum);
    const back = new THREE.Mesh(new THREE.CircleGeometry(1.1, 28), steel); back.position.z = -1.3; back.rotation.y = Math.PI; head.add(back);
    const lensM = new THREE.MeshStandardMaterial({ map: lensTex, emissiveMap: lensTex, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.2 });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(1.28, 28), lensM); lens.position.z = 1.3; head.add(lens);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.09, 8, 28), steel); rim.position.z = 1.3; head.add(rim); GCPD.lensM = lensM; }
  // Ziel: 330 m hoch, 180 m vor dem Haus (nach -t); Kegel von der Linse bis dorthin, Zeichen als Sprite (schaut immer zur Kamera)
  const [tx, , tz] = f.W(L1 - 14, 18 - 180, 0), tgt = new THREE.Vector3(tx, Y + 330, tz);
  base.lookAt(tgt.x, by, tgt.z); head.updateMatrixWorld(true); const hp = head.getWorldPosition(new THREE.Vector3()); head.lookAt(tgt);   // lookAt: +z zur Linse
  const dist = hp.distanceTo(tgt), beamM = new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(30, 1.2, dist, 24, 1, true), beamM); beam.rotation.x = Math.PI / 2; beam.position.z = 1.3 + dist / 2; head.add(beam);
  const symTex = canvasTex(512, 512, (c, w) => { const r = w / 2, g = c.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, "rgba(255,236,170,1)"); g.addColorStop(0.62, "rgba(255,226,140,0.85)"); g.addColorStop(0.72, "rgba(255,220,130,0.25)"); g.addColorStop(1, "rgba(255,220,130,0)");
    c.save(); c.translate(r, r); c.scale(1, 0.62); c.translate(-r, -r); c.fillStyle = g; c.fillRect(0, 0, w, w); c.restore(); batShape(c, r, r * 1.03, w * 0.62, "#000"); });
  const symM = new THREE.SpriteMaterial({ map: symTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), sym = new THREE.Sprite(symM);
  sym.position.copy(tgt); sym.scale.set(110, 110, 1); scene.add(sym);
  gates.push({ name: "Batsignal", g: head, call: () => { GCPD.on = !GCPD.on; toast(GCPD.on ? "Batsignal an (leuchtet nachts)" : "Batsignal aus"); }, verbs: ["schalten", "schalten"], a: [bx, bz], b: [bx, bz], near: 10 });
  GCPD.sig = { beamM, symM, sym, hands, clkM: clk.material, lampM, gm };
  yield;
  // Kollision: Bloecke als gedrehte Quader (Dach begehbar), Saeulen, Freitreppe als Boden
  const box = (s, tt, ls, lt, y0, y1) => { const [x, , z] = f.W(s, tt, 0); dkAdd({ cx: x, cy: (y0 + y1) / 2, cz: z, ux, uz, hl: ls / 2, hw: lt / 2, hh: (y1 - y0) / 2, m: 0.3 }); };
  box(sm, (8 + L2 - 4) / 2, L1 - 8 - 0.6, L2 - 12 - 0.6, Y, H1); box(sm, (14 + L2 - 10) / 2, L1 - 24 - 0.6, L2 - 24 - 0.6, H1, H2); box(sm, 14, 21.4, 15.4, Y, H3);
  for (let i = 0; i < 6; i++) box(sm - 10 + i * 4, 3, 1.2, 1.2, Y + 1.2, Y + 11);
  for (let i = 0; i < 5; i++) { const [a, b, c, d, y0, y1] = step(i); box(a, b, c, d, y0, y1); }
  box(L1 - 14, 18, 3.4, 3.4, H1, H1 + 3.4);   // Batsignal
  bautAdd({ id: "GO-GCPD", name: "Polizeipräsidium", art: "Gebäude", poly: [f.W(4, 8, 0), f.W(L1 - 4, 8, 0), f.W(L1 - 4, L2 - 4, 0), f.W(4, L2 - 4, 0)].map(p => [p[0], p[2]]), y0: Y - 1, y1: H3 + 4, info: "GCPD · Batsignal auf dem Dach (Rechtsklick schaltet) · " + Math.round(O.h) + " m" });
  // Streifenwagen auf dem Vorplatz (spaet gebaut wie die anderen Fahrzeuge)
  if (typeof addVehicle === "function" && typeof SPEC_POLICE !== "undefined") for (const [s, tt] of [[10, -2], [16, -2], [L1 - 16, -2], [L1 - 10, -2]]) { const [x, , z] = f.W(s, tt, 0); addVehicle(SPEC_POLICE, () => buildPolice(), x, z, Y, Math.atan2(e2[0], e2[1]), "Gotham Police (Präsidium)", 0xeef0f2); }
}
// Fledermaus-Umriss (eigene Form: Fluegel mit drei Zacken unten, Kopf mit zwei Ohren), Mitte cx/cy, Breite w
function batShape(c, cx, cy, w, col) {
  const s = w / 2, P = [[0, -0.16], [0.05, -0.3], [0.09, -0.18], [0.3, -0.24], [0.62, -0.34], [1, -0.05], [0.78, 0.02], [0.66, 0.24], [0.5, 0.08], [0.36, 0.3], [0.22, 0.12], [0, 0.36]];
  c.fillStyle = col; c.beginPath(); P.forEach(([x, y], i) => c[i ? "lineTo" : "moveTo"](cx + x * s, cy + y * s)); for (let i = P.length - 2; i >= 0; i--) c.lineTo(cx - P[i][0] * s, cy + P[i][1] * s); c.closePath(); c.fill();
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (GCPD.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = gcpdGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { GCPD.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
// je Bild (schleife.js): Batsignal nachts, Uhr, Laternen; nur bis 3 km von der Kamera
function gcpdStep() {
  const S = GCPD.sig; if (!S) return; const n = typeof night === "number" ? night : 0, p = camera.position, q = S.sym.position;
  const on = GCPD.on && n > 0.25 && Math.abs(p.x - q.x) < 3000 && Math.abs(p.z - q.z) < 3000, k = on ? Math.min(1, (n - 0.25) / 0.4) : 0;
  S.beamM.opacity = 0.09 * k; S.symM.opacity = 0.9 * k; S.sym.visible = k > 0; GCPD.lensM.emissiveIntensity = 0.15 + 1.6 * k;
  S.lampM.emissiveIntensity = 0.2 + 1.4 * n; S.clkM.emissiveIntensity = 0.6 * n;
  const d = new Date(), hm = (d.getHours() % 12 + d.getMinutes() / 60) / 12, mm = d.getMinutes() / 60; S.hands[0].rotation.z = -hm * Math.PI * 2; S.hands[1].rotation.z = -mm * Math.PI * 2;
}
