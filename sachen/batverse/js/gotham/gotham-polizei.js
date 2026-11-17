// Batverse – Gotham: Polizeipraesidium (GCPD) mit Batsignal (PLAN-GOTHAM Phase 3, P3a; Ort "gcpd" aus daten.js, 80 x 60 m)
// Klassisches Skript nach gotham-casino.js. Steinbau der 30er (Fassade "stein" aus den Gebaeude-Vorlagen, leuchtet nachts mit den anderen):
// Hauptblock 6 Geschosse, zurueckgesetztes Obergeschoss, Mittelturm 45 m mit Uhr, Saeulenportal mit Freitreppe, gruenen Polizeilaternen und
// Schriftband GOTHAM CITY POLICE DEPARTMENT, Granit-Vorplatz mit Streifenwagen. Auf dem Dach das Batsignal: Scheinwerfer auf Drehgestell,
// nachts Lichtkegel in den Himmel und das Fledermaus-Zeichen in den Wolken; geschaltet wird es mit dem Schalter im Inventar (GCPD.on).
"use strict";
// Kartenachse "Osten" im Spiel an einem Ort (Einheitsvektor). Im Spiel ueberall dieselbe Drehung (manorLage.dreh); in der Werkstatt dreht gotham-shim.js jedes
// Gebaeude zusaetzlich zur Strecke (Nicolas 2026-11-17), darum aus GOT.toGame statt aus dreh. Auch von gotham-orte.js und gotham-parken.js benutzt.
function gotAxis(x, z) { const a = GOT.toGame(x, z), b = GOT.toGame(x + 1, z), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; }
const GCPD = { done: false, on: true, sig: null };
function* gcpdGen() {
  while (!GSTR.done || !GBV) yield "wait";
  const O = GOTHAM.orte.find(o => o.id === "gcpd"); if (!O) return;
  const [ux, uz] = gotAxis(O.x, O.z), e2 = [-uz, ux], SH = -8, [cx0, cz0] = GOT.toGame(O.x, O.z), cx = cx0 + e2[0] * SH, cz = cz0 + e2[1] * SH;   // Nicolas 2026-11-16: 8 m nach vorne (mehr passt zwischen den Nachbarhaeusern nicht)
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
  // Nicolas 2026-11-16: Vorplatz bis an die Strasse (wo FB-0563 stand), Zufahrt mit Schranke an der Ostseite, Verwahrplatz fuer beschlagnahmte Fahrzeuge hinten
  gbvBox(out, "beton", f, 30, -14.5, 42, 29, Y, Y + 0.05);   // s 9..51, t -29..0
  for (const ss of [22, 30, 38]) { gbvBox(out, "eisen", f, ss, -22, 0.25, 0.25, Y, Y + 12); gbvBox(out, "farbe", f, ss + 1.1, -22, 2, 0.05, Y + 10.4, Y + 11.6, [0.12, 0.25, 0.6]); }   // Fahnenmasten
  const col = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; }, asph = col(0x34363a);
  gbvBox(out, "farbe", f, 84, 37, 8, 78, Y, Y + 0.06, asph); for (let tt = 4; tt < 74; tt += 6) gbvBox(out, "farbe", f, 84, tt, 0.15, 3, Y + 0.06, Y + 0.075, col(0xe8e8e0));   // Zufahrt mit Mittellinie
  gbvBox(out, "farbe", f, 43, 68.5, 90, 15, Y, Y + 0.06, asph); for (let ss = 2; ss < 80; ss += 4) for (const [t0, t1] of [[61.5, 66.5], [70.5, 75.5]]) gbvBox(out, "farbe", f, ss, (t0 + t1) / 2, 0.12, t1 - t0, Y + 0.06, Y + 0.075, col(0xe8e8e0));
  const fenceM = new THREE.MeshStandardMaterial({ map: (() => { const tx = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "#9aa0a6"; c.lineWidth = 3; for (let k = -64; k < 128; k += 16) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + 64, 64); c.stroke(); c.beginPath(); c.moveTo(k + 64, 0); c.lineTo(k, 64); c.stroke(); } }); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; return tx; })(), alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.5, roughness: 0.5 });
  const fenceG = new THREE.Group(); fenceG.userData.keep = true; fenceG.userData.noLift = true;
  const fence = (s0, t0, s1, t1) => { const a = f.W(s0, t0, Y), b = f.W(s1, t1, Y), L = Math.hypot(b[0] - a[0], b[2] - a[2]), g = new THREE.PlaneGeometry(L, 2.6); g.translate(0, 1.3, 0); const m = new THREE.Mesh(g, fenceM); m.position.set((a[0] + b[0]) / 2, Y, (a[2] + b[2]) / 2); m.rotation.y = Math.atan2(-(b[2] - a[2]), b[0] - a[0]);
    m.material.map.repeat; const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L / 1.3, uv.getY(i) * 2); fenceG.add(m); for (let k = 0; k <= L; k += 3) { const q = f.W(s0 + (s1 - s0) * k / L, t0 + (t1 - t0) * k / L, 0); gbvBox(out, "eisen", gbvFrame({ P0: [q[0], q[2]], e1: [ux, uz], e2, L1: 1, L2: 1 }), 0, 0, 0.1, 0.1, Y, Y + 2.7); }
    const c = f.W((s0 + s1) / 2, (t0 + t1) / 2, 0); dkAdd({ cx: c[0], cy: Y + 1.3, cz: c[2], ux: (b[0] - a[0]) / L, uz: (b[2] - a[2]) / L, hl: L / 2, hw: 0.1, hh: 1.3, floor: 0, m: 0.1 }); };
  fence(-2, 61, 80, 61); fence(-2, 61, -2, 76); fence(-2, 76, 88.5, 76); fence(88.5, 76, 88.5, 61); scene.add(fenceG);
  { const sg = canvasTex(512, 128, (c, w, h) => { c.fillStyle = "#1d2a4a"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "bold 52px Arial, sans-serif"; c.textAlign = "center"; c.fillText("GCPD · VERWAHRSTELLE", w / 2, 60); c.font = "30px Arial, sans-serif"; c.fillText("Zufahrt nur für Berechtigte", w / 2, 104); });
    const p = f.W(89.5, -1, Y + 2.6), m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshStandardMaterial({ map: sg, emissive: 0xffffff, emissiveMap: sg, emissiveIntensity: 0.3 })); m.position.set(p[0], p[1], p[2]); m.rotation.y = Math.atan2(-e2[0], -e2[1]); m.userData.keep = true; scene.add(m);
    gbvBox(out, "eisen", f, 89.5, -0.9, 0.12, 0.12, Y, Y + 2.2); }
  // Schranke (rot-weiss), Drehpunkt am Pfosten West, oeffnet nach oben
  { gbvBox(out, "farbe", f, 80.6, 1, 0.5, 0.5, Y, Y + 1.1, col(0xd8d8d0)); const piv = new THREE.Group(), pp = f.W(80.6, 1, Y + 1.0); piv.position.set(pp[0], pp[1], pp[2]); const th = Math.atan2(-uz, ux);
    for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: k % 2 ? 0xf0f0f0 : 0xc8202a, roughness: 0.6 })); m.position.x = 0.5 + k; piv.add(m); }
    piv.rotation.set(0, th, 0); piv.userData.keep = true; scene.add(piv); const hit = piv.children[3];
    const c = f.W(84.3, 1, 0), solid = dkAdd({ cx: c[0], cy: Y + 0.6, cz: c[2], ux, uz, hl: 3.6, hw: 0.15, hh: 0.6, floor: 0, m: 0.1 });
    gates.push({ name: "Schranke", g: hit, open: 0, target: 0, dur: 2.5, verbs: ["öffnen", "schliessen"], a: (([x, , z]) => [x, z])(f.W(80.6, 1, 0)), b: (([x, , z]) => [x, z])(f.W(87.6, 1, 0)), near: 12, solid, anim: k => { piv.rotation.set(0, th, k * 1.45); solid.on = k < 0.6; } }); }
  // beschlagnahmte Fahrzeuge (fahrbar, spaet gebaut)
  if (typeof addVehicle === "function") { const fwd = [e2[0], e2[1]], hIn = Math.atan2(fwd[0], fwd[1]), hOut = Math.atan2(-fwd[0], -fwd[1]);
    const V = [[SPEC_ROLLS, () => buildRolls(0x6b1f2a), 6, 64, "Rolls-Royce"], [SPEC_AVENTADOR, () => buildAventador(0x2a7a3a), 14, 64, "Aventador"], [SPEC_GCLASS, () => buildGClass(0x30343a), 22, 64, "G-Klasse"], [SPEC_TAXI, () => buildTaxi(), 30, 64, "Taxi"],
      [SPEC_NACHTFALKE, () => buildNachtfalke(0x5a1010), 42, 64, "Muscle-Car"], [SPEC_BIKE, () => buildBike(0x1f4f9a), 50, 64, "Motorrad"], [SPEC_SPECTRE, () => buildSpectre(0x8a8f96), 10, 73, "Spectre"], [SPEC_DELOREAN, () => buildDelorean(), 26, 73, "DeLorean"],
      [SPEC_STREETFIGHTER, () => buildStreetfighter(), 38, 73, "Streetfighter"], [SPEC_ROLLS, () => buildRolls(0x1a1a1a), 58, 73, "Rolls-Royce"]];
    for (const [spec, build, ss, tt, lbl] of V) { if (!spec) continue; const p = f.W(ss, tt, 0); addVehicle(spec, build, p[0], p[2], Y, tt < 68 ? hIn : hOut, lbl + " (beschlagnahmt)", 0x6b6f76); } }
  bautAdd({ id: "GO-GCPD-VERWAHR", name: "Verwahrstelle GCPD", art: "Platz", poly: [f.W(-2, 61, 0), f.W(88.5, 61, 0), f.W(88.5, 76, 0), f.W(-2, 76, 0)].map(p => [p[0], p[2]]), y0: Y - 1, y1: Y + 3, info: "beschlagnahmte Fahrzeuge · Zufahrt mit Schranke an der Ostseite" });
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
  // Geschaltet wird nur noch im Inventar (Schalter Batsignal, inventar.js; Nicolas 2026-11-16: kein Rechtsklick am Polizeigebaeude)
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
// Fledermaus des Batsignals: halbe Kontur (rechts, x 0..1, y nach unten wie im Canvas), gespiegelt; auch Form des Batarangs und seines Symbols (Nicolas 2026-11-16)
const BAT_SIGNAL_PTS = [[0, -0.16], [0.05, -0.3], [0.09, -0.18], [0.3, -0.24], [0.62, -0.34], [1, -0.05], [0.78, 0.02], [0.66, 0.24], [0.5, 0.08], [0.36, 0.3], [0.22, 0.12], [0, 0.36]];
function batShape(c, cx, cy, w, col) {
  const s = w / 2, P = BAT_SIGNAL_PTS;
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
