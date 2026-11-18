// Militaerfahrzeuge (Nicolas 2026-11-18, N52, zu Phase 6): Kommandofahrzeug und Sanitaetsfahrzeug Piranha I, Panzerjaeger 90 (Piranha I mit Raketenwerfer-Turm),
// geschuetztes Mannschaftstransportfahrzeug Duro IIIP, Transporthelikopter Cougar, leichter Transport- und Schulungshelikopter. Vereinfachte eigene Modelle, olivgruen.
// Spiel und Werkstatt, nach fahrzeuge/modelle.js und fahrzeuge/heli.js (flyAdd, buildPolizeiHeli). Radfahrzeuge: build*/SPEC_* wie die anderen (Werkstatt-Auswahl, Laden
// Gotham Defense Supply im Handy); Hubschrauber: FLYS (Werkstatt neben dem Landeplatz; Standort im Spiel noch offen, OFFENE-FRAGEN 52). Vorne = -z.
const MIL_OLIV = 0x4b5a3a, MIL_DUNKEL = 0x262a20;
// Piranha I 8x8: flache Wanne mit schraeger Bugplatte, vier Achsen (vordere zwei lenken), Fahrerluke vorne links, Nebelwerfer, Heckrampe. v = "kommando" | "sanitaet" | "pzj90"
function buildPiranha(v = "kommando") {
  const g = new THREE.Group(), HW = 1.25, zF = -3.15, zR = 3.15, oliv = M(MIL_OLIV, { roughness: 0.8, metalness: 0.15 }), dunkel = M(MIL_DUNKEL, { roughness: 0.85 }), glas = M(0x0a0e14, { metalness: 0.6, roughness: 0.1 });
  const tireM = M(0x161616, { roughness: 0.95 }), rimM = M(0x3a4030, { roughness: 0.7 }), weiss = M(0xeeeeea, { roughness: 0.6 }), rot = M(0xd0202a, { roughness: 0.5 });
  boxIn(g, -HW, HW, 0.6, 1.4, zF + 1.0, zR, oliv);                                                 // Unterwanne
  boxIn(g, -HW + 0.15, HW - 0.15, 1.4, 2.0, zF + 1.4, zR, oliv);                                    // Oberwanne
  for (const sd of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, zR - zF - 1.4), oliv); p.position.set(sd * (HW - 0.09), 1.66, (zF + 1.4 + zR) / 2); p.rotation.z = sd * 0.35; g.add(p); }   // schraege Seitenwaende oben
  { const b = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.12, 1.75), oliv); b.position.set(0, 1.2, zF + 0.72); b.rotation.x = -0.62; g.add(b);   // Bugplatte schraeg
    const u = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.12, 1.15), oliv); u.position.set(0, 0.68, zF + 0.5); u.rotation.x = 0.5; g.add(u); }   // Bug unten
  boxIn(g, -HW + 0.25, -0.15, 2.0, 2.15, zF + 1.5, zF + 2.2, dunkel); boxIn(g, -HW + 0.3, -0.2, 1.88, 2.02, zF + 1.42, zF + 1.46, glas);   // Fahrerluke, Winkelspiegel
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8), dunkel); n.position.set(sd * (HW - 0.35) + sd * k * 0.09, 2.08, zF + 2.6); n.rotation.x = -0.6; g.add(n); }   // Nebelwerfer
  boxIn(g, -0.8, 0.8, 0.7, 1.9, zR, zR + 0.05, dunkel); for (const sd of [-1, 1]) boxIn(g, sd * 1.0 - 0.1, sd * 1.0 + 0.1, 1.0, 1.25, zR, zR + 0.04, M(0xc02020, { emissive: 0x400808 }));   // Heckrampe, Ruecklichter
  for (const sd of [-1, 1]) boxIn(g, sd * 0.85 - 0.12, sd * 0.85 + 0.12, 1.1, 1.22, zF + 0.05, zF + 0.12, mat.glow);   // Scheinwerfer
  const ant = (x, z, h) => { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, h, 6), dunkel); a.position.set(x, 2.0 + h / 2, z); g.add(a); };
  if (v === "kommando") { boxIn(g, -0.9, 0.9, 2.0, 2.55, 0.0, 2.6, oliv); ant(-0.9, 2.9, 2.8); ant(0.9, 2.9, 2.4); ant(-0.9, -0.4, 2.0); boxIn(g, 0.3, 0.9, 2.55, 2.75, 0.4, 1.4, dunkel); }   // Kommando: Aufbau, Antennen, Funkgeraetekasten
  else if (v === "sanitaet") { boxIn(g, -HW + 0.15, HW - 0.15, 2.0, 2.75, -0.2, zR, oliv);   // Sanitaet: hoeherer Aufbau, rotes Kreuz auf weissem Feld (Seiten, Heck, Dach)
    const kreuz = (x, y, z, ry) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), weiss), c1 = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.18), rot), c2 = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.62), rot);
      for (const [o, d] of [[w, 0], [c1, 0.002], [c2, 0.002]]) { o.position.set(x, y, z); o.rotation.y = ry; o.translateZ(d); g.add(o); } };
    kreuz(HW - 0.14, 2.2, 1.6, Math.PI / 2); kreuz(-HW + 0.14, 2.2, 1.6, -Math.PI / 2); kreuz(0, 2.3, zR + 0.06, 0); { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), weiss); d.rotation.x = -Math.PI / 2; d.position.set(0, 2.76, 1.4); g.add(d); const a = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.18), rot), b = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.62), rot); for (const o of [a, b]) { o.rotation.x = -Math.PI / 2; o.position.set(0, 2.762, 1.4); g.add(o); } }
    ant(-0.9, -0.4, 1.6); }
  else if (v === "pzj90") { const t = new THREE.Group(); t.position.set(0, 2.0, 0.6); g.add(t);   // Panzerjaeger 90: Turm mit zwei Lenkwaffen-Rohren auf einem Arm, Zielgeraet
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.35, 16), oliv); tb.position.y = 0.18; t.add(tb);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.3), oliv); arm.position.set(0.35, 0.7, 0); t.add(arm);
    for (const sx of [0.1, 0.6]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.6, 12), dunkel); r.rotation.x = Math.PI / 2; r.position.set(sx, 1.15, -0.25); t.add(r);
      const kp = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.06, 12), oliv); kp.rotation.x = Math.PI / 2; kp.position.set(sx, 1.15, -1.06); t.add(kp); }   // zwei Rohre mit Deckel
    const zg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.4), dunkel); zg.position.set(-0.3, 0.55, -0.2); t.add(zg); const ln = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), glas); ln.position.set(-0.3, 0.55, -0.41); ln.rotation.y = Math.PI; t.add(ln);
    g.userData.turm = t; ant(-0.9, 2.8, 2.0); }
  mergeStatic(g);
  const wheels = [[-1.12, -2.25, true], [1.12, -2.25, true], [-1.12, -1.1, true], [1.12, -1.1, true], [-1.12, 0.75, false], [1.12, 0.75, false], [-1.12, 1.9, false], [1.12, 1.9, false]].map(([x, z, f]) => addWheel(g, x, z, 0.55, 0.38, f, tireM, rimM, 0, 20));
  return { g, wheels };
}
const SPEC_PIRANHA = { name: "Piranha I", wheels: [[-1.12, -2.25], [1.12, -2.25], [-1.12, -1.1], [1.12, -1.1], [-1.12, 0.75], [1.12, 0.75], [-1.12, 1.9], [1.12, 1.9]], wb: 3.6, track: 2.24, pts: [-2.6, -0.9, 0.9, 2.6], R: 1.35, circR: 1.3, enter: 4.8,
  maxN: 24, maxF: 27.8, acc: 6, steer: 0.5, jump: false, grade: 38, camD: 13, camH: 2.6, seat: [-0.6, 2.2, -1.6], bodyH: 2.8, bike: false, mass: 30, mu: 1.6,
  exits: [[-2.2, -1.2], [2.2, -1.2], [-2.2, 1.4], [2.2, 1.4], [0, -4.4], [0, 4.4]],
  msg: "Piranha I: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, Shift aussteigen" };
const SPEC_PIRANHA_K = { ...SPEC_PIRANHA, name: "Piranha I Kommandofahrzeug", msg: SPEC_PIRANHA.msg.replace("Piranha I", "Piranha I Kommandofahrzeug") };
const SPEC_PIRANHA_S = { ...SPEC_PIRANHA, name: "Piranha I Sanitätsfahrzeug", msg: SPEC_PIRANHA.msg.replace("Piranha I", "Piranha I Sanitätsfahrzeug") };
const SPEC_PZJ90 = { ...SPEC_PIRANHA, name: "Panzerjäger 90", msg: SPEC_PIRANHA.msg.replace("Piranha I", "Panzerjäger 90") };
// Duro IIIP 6x6: gepanzerte Kabine vorne, geschuetzter Mannschaftsaufbau hinten mit Tuer und kleinen Fenstern, drei Achsen
function buildDuro() {
  const g = new THREE.Group(), HW = 1.15, zF = -3.5, zR = 3.4, oliv = M(MIL_OLIV, { roughness: 0.8, metalness: 0.15 }), dunkel = M(MIL_DUNKEL, { roughness: 0.85 }), glas = M(0x0a0e14, { metalness: 0.6, roughness: 0.1 });
  const tireM = M(0x161616, { roughness: 0.95 }), rimM = M(0x3a4030, { roughness: 0.7 });
  boxIn(g, -0.5, 0.5, 0.55, 0.85, zF + 0.4, zR - 0.3, dunkel);                                       // Rahmen
  boxIn(g, -HW, HW, 0.85, 1.6, zF, zF + 1.4, oliv); boxIn(g, -HW + 0.05, HW - 0.05, 1.6, 2.55, zF + 0.35, zF + 1.9, oliv); boxIn(g, -HW + 0.15, HW - 0.15, 1.85, 2.35, zF + 0.3, zF + 0.34, glas);   // Motorhaube, Kabine, Frontscheibe
  for (let x = -0.7; x <= 0.71; x += 0.14) boxIn(g, x - 0.03, x + 0.03, 1.0, 1.45, zF - 0.02, zF + 0.01, dunkel);   // Kuehlergrill
  boxIn(g, -HW - 0.05, HW + 0.05, 0.6, 0.85, zF - 0.25, zF + 0.05, dunkel);                          // Stossfaenger
  boxIn(g, -HW, HW, 0.95, 2.75, zF + 2.0, zR, oliv); boxIn(g, -HW + 0.05, HW - 0.05, 2.75, 2.82, zF + 2.05, zR - 0.05, dunkel);   // Mannschaftsaufbau, Dach
  for (const sd of [-1, 1]) { sideBox(g, sd * HW, sd * (HW + 0.02), 1.95, 2.35, zF + 0.55, zF + 1.6, glas); for (const z of [0.3, 1.5, 2.6]) sideBox(g, sd * HW, sd * (HW + 0.02), 1.9, 2.2, z - 0.25, z + 0.25, glas);
    boxIn(g, sd * 0.8 - 0.14, sd * 0.8 + 0.14, 1.25, 1.4, zF - 0.02, zF + 0.01, mat.glow); boxIn(g, sd * 0.95 - 0.1, sd * 0.95 + 0.1, 1.1, 1.35, zR, zR + 0.02, M(0xc02020, { emissive: 0x400808 })); }
  boxIn(g, -0.45, 0.45, 1.0, 2.5, zR, zR + 0.04, dunkel); boxIn(g, -0.3, 0.3, 1.8, 2.2, zR + 0.04, zR + 0.05, glas);   // Hecktuer mit Fenster
  for (const z of [-2.75, 1.0, 2.4]) for (const sd of [-1, 1]) boxIn(g, sd * HW - 0.1, sd * HW + 0.1, 0.95, 1.1, z - 0.6, z + 0.6, dunkel);   // Radlaeufe
  { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 2.2, 6), dunkel); a.position.set(-0.9, 3.9, zF + 1.6); g.add(a); }
  mergeStatic(g);
  const wheels = [[-1.0, -2.75, true], [1.0, -2.75, true], [-1.0, 1.0, false], [1.0, 1.0, false], [-1.0, 2.4, false], [1.0, 2.4, false]].map(([x, z, f]) => addWheel(g, x, z, 0.52, 0.36, f, tireM, rimM, 0, 20));
  return { g, wheels };
}
const SPEC_DURO = { name: "Duro IIIP", wheels: [[-1.0, -2.75], [1.0, -2.75], [-1.0, 1.0], [1.0, 1.0], [-1.0, 2.4], [1.0, 2.4]], wb: 4.45, track: 2.0, pts: [-2.9, -1.0, 1.0, 2.9], R: 1.25, circR: 1.2, enter: 4.6,
  maxN: 24, maxF: 25, acc: 6, steer: 0.5, jump: false, grade: 40, camD: 12, camH: 2.6, seat: [-0.5, 2.15, -2.4], bodyH: 2.9, bike: false, mass: 16,
  exits: [[-2.0, -2.4], [2.0, -2.4], [-2.0, 1.2], [2.0, 1.2], [0, -4.6], [0, 4.6]],
  msg: "Duro IIIP: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, Shift aussteigen" };
// Hubschrauber: Polizei-Modell umgefaerbt (olivgruen, ohne Blaulicht, eigene Aufschrift); Cougar groesser und traeger
function milHeli(text) { const b = buildPolizeiHeli(), lab = canvasTex(512, 96, (c, W, H) => { c.fillStyle = "#3d4a30"; c.fillRect(0, 0, W, H); c.fillStyle = "#e8e8e0"; c.font = "bold 62px Arial"; c.textAlign = "center"; c.fillText(text, W / 2, 70); });
  b.g.traverse(o => { if (!o.isMesh) return; const m = o.material, hex = m.color && m.color.getHex(); if (m.map && m.isMeshBasicMaterial) o.material = new THREE.MeshBasicMaterial({ map: lab });
    else if (hex === 0x16233f) o.material = new THREE.MeshStandardMaterial({ color: MIL_OLIV, roughness: 0.75, metalness: 0.15 }); else if (hex === 0xeef0f2) o.material = new THREE.MeshStandardMaterial({ color: 0x3d4a30, roughness: 0.75 }); });
  for (const l of b.lichter) l.visible = false; b.lichter = null; return b; }
const COUGAR = flyAdd("Transporthelikopter Cougar", milHeli("ARMEE · T-301"), 1.55, { spec: { max: 42, acc: 10, up: 7, tilt: 0.16, tiltV: 0.003, turn: 0.7 } });
const SCHULHELI = flyAdd("Schulungshelikopter", milHeli("ARMEE · T-361"), 1.0, { spec: { max: 50, acc: 15, up: 9, tilt: 0.22, tiltV: 0.004, turn: 1.0 } });
// Standplatz am Boden (ohne Landeplatz-Markierung)
function heliStand(H, x, y, z, h) { Object.assign(H, { x, y: y + 0.02, z, h, vx: 0, vy: 0, vz: 0, pitch: 0, roll: 0 }); H.home = { x, y: y + 0.02, z, h }; H.g.visible = true; batPose(H, 0); }
