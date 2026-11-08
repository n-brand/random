// Wayne Manor 3D – Fahrzeuge: Modelle (Tumbler, Rolls-Royce, Motorrad), Werte, Aufstellung
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Fahrzeuge (D1, erweitert 2026-11-08) =====================
// Mehrere fahrbare Fahrzeuge mit gemeinsamer Steuerung: Tumbler (Garage-Platz 1, mit Sprung), Rolls-Royce (Plaetze 3, 4, 6, 7, 9, je eigene
// Farbe), schwarzer Tumbler und Motorrad auf der drehenden Tiefgarage in der Batcave (drehen mit, auch beim Fahren), Batpod beim Batcomputer.
// E in der Naehe = ins naechste Fahrzeug einsteigen, im Fahrzeug E = aussteigen. W/S Gas/Bremse (rueckwaerts), A/D lenken, Shift schneller,
// Leertaste = Sprung mit Schub (nur Tumbler, ab 50 km/h), V = Kamera hinten/Fahrersicht, R = zuruecksetzen, L = Autoaufzug rufen/fahren,
// 1-3 = Halt im Autoaufzug. Kollision wie beim Laufen (Quader, Kreise, Tore, Leitplanken), Kreise fuer die Karosserie (je Fahrzeug).
// Das aktive Fahrzeug ist CAR; die Hilfsfunktionen arbeiten auf CAR (fuer geparkte Fahrzeuge wird CAR in carFrame kurz umgesetzt).
const speedEl = (() => { const d = document.createElement("div"); d.id = "car-speed"; d.hidden = true;
  d.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:6;padding:6px 14px;border-radius:999px;background:rgba(10,12,16,.72);color:#f4f4f0;font:600 15px system-ui,sans-serif;pointer-events:none";
  document.body.appendChild(d); return d; })();
const VEH = [];
let CAR = null;
// Profil in (vorne, hoch) -> Netz: Breite entlang x, vorne = -z
const prismIn = (g, pts, w, m, x = 0) => {
  const sh = new THREE.Shape(); pts.forEach(([f, y], i) => i ? sh.lineTo(f, y) : sh.moveTo(f, y));
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }).rotateY(Math.PI / 2).translate(x - w / 2, 0, 0), m);
  g.add(mesh); return mesh;
};
const boxIn = (g, x0, x1, y0, y1, z0, z1, m) => B(x0, x1, y0, y1, z0, z1, m, false, g);
const meshIn = (g, geo, m, x, y, z, rx = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.x = rx; g.add(o); return o; };
// Feste Teile eines Fahrzeugs je Material zu einem Netz zusammenfassen (Fahrzeuge sind "dynamisch" und werden sonst nicht zusammengefasst)
function mergeStatic(g) {
  const byMat = new Map(), keep = [];
  for (const o of [...g.children]) {
    if (!o.isMesh) { keep.push(o); continue; }
    o.updateMatrix();
    const gg = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); gg.applyMatrix4(o.matrix);
    for (const k of Object.keys(gg.attributes)) if (!["position", "normal", "uv"].includes(k)) gg.deleteAttribute(k);
    if (!gg.attributes.uv) gg.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2));
    gg.clearGroups();
    if (!byMat.has(o.material)) byMat.set(o.material, []); byMat.get(o.material).push(gg);
  }
  g.clear(); for (const o of keep) g.add(o);
  for (const [m, list] of byMat) { const mm = new THREE.Mesh(mergeGeometries(list, false), m); mm.castShadow = true; mm.receiveShadow = true; g.add(mm); }
}
// Rad: Reifen (+ Stollen) als ein Netz, Felge extra; piv lenkt (Vorderrad), spin dreht
function addWheel(g, x, z, r, w, front, tireM, rimM, lugs = 0, seg = 16) {
  const piv = new THREE.Group(); piv.position.set(x, r, z); g.add(piv);
  const spin = new THREE.Group(); piv.add(spin);
  const parts = [new THREE.CylinderGeometry(r, r, w, seg).rotateZ(Math.PI / 2).toNonIndexed()];
  for (let k = 0; k < lugs; k++) { const a = k / lugs * Math.PI * 2, b = new THREE.BoxGeometry(w + 0.04, 0.07, r * 0.25).rotateX(-a).translate(0, Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97).toNonIndexed(); parts.push(b); }
  for (const p of parts) { for (const k of Object.keys(p.attributes)) if (!["position", "normal", "uv"].includes(k)) p.deleteAttribute(k); p.clearGroups(); }
  const t = new THREE.Mesh(mergeGeometries(parts, false), tireM); t.castShadow = true; spin.add(t);
  spin.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.02, 8).rotateZ(Math.PI / 2), rimM));
  return { piv, spin, r, front };
}
// ---- Tumbler: schwarz, kantig, breite Front mit Vorderraedern unter Kotfluegeln, sehr grosse Hinterraeder, Duesen hinten ----
function buildTumbler(bodyCol, armorCol) {
  const g = new THREE.Group();
  const body = M(bodyCol, { roughness: 0.62, metalness: 0.3, flatShading: true }), armor = M(armorCol, { roughness: 0.85, metalness: 0.2, flatShading: true });
  const tireM = M(0x101010, { roughness: 0.95, flatShading: true }), rimM = M(0x2b2e33, { metalness: 0.6, roughness: 0.45, flatShading: true });
  const glassM = M(0x07090c, { roughness: 0.08, metalness: 0.7 }), jetM = M(0x3a1a08, { emissive: 0xff6a10, emissiveIntensity: 0 }), nozM = M(0x2a2c30, { metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide });
  prismIn(g, [[2.35, 0.42], [2.45, 0.72], [2.15, 0.98], [1.0, 1.16], [0.35, 1.56], [-0.95, 1.62], [-1.95, 1.38], [-2.4, 1.12], [-2.45, 0.55], [-2.05, 0.32], [1.95, 0.32]], 1.3, body);   // Rumpf
  prismIn(g, [[1.1, 1.18], [0.35, 1.6], [-0.95, 1.66], [-1.2, 1.5], [0.2, 1.42]], 0.9, armor);                                  // Dachpanzer
  for (const sd of [-1, 1]) {
    prismIn(g, [[2.4, 0.5], [2.42, 0.86], [2.0, 1.04], [1.25, 1.02], [1.08, 0.62]], 0.5, body, sd * 1.0);                    // Kotfluegel vorne
    prismIn(g, [[2.3, 0.86], [1.95, 1.0], [1.3, 0.99], [1.6, 0.88]], 0.52, armor, sd * 1.0);
    boxIn(g, sd > 0 ? 0.62 : -0.78, sd > 0 ? 0.78 : -0.62, 0.62, 0.78, -2.05, -1.2, armor);                                // Querlenker zum Rumpf
    prismIn(g, [[0.9, 0.38], [0.9, 0.98], [-0.6, 1.08], [-1.0, 0.95], [-0.85, 0.38]], 0.22, armor, sd * 0.72);              // Seitenkasten
    boxIn(g, sd > 0 ? 0.645 : -0.66, sd > 0 ? 0.66 : -0.645, 1.2, 1.38, -0.75, 0.15, glassM);                             // Seitenfenster
    boxIn(g, sd * 1.0 - 0.22, sd * 1.0 + 0.22, 0.8, 0.88, -2.44, -2.41, mat.glow);                                         // Scheinwerfer
    boxIn(g, sd * 0.45 - 0.14, sd * 0.45 + 0.14, 0.95, 1.05, 2.42, 2.46, mat.glowRed);                                     // Ruecklicht
    boxIn(g, sd * 0.92 - 0.35, sd * 0.92 + 0.35, 1.12, 1.2, 0.9, 2.15, armor);                                              // Kotfluegel hinten (Panzerplatte)
  }
  boxIn(g, -1.3, 1.3, 0.3, 0.52, -2.62, -2.2, armor);                                                                      // breite Frontschuerze
  meshIn(g, new THREE.BoxGeometry(1.05, 0.03, 0.74), glassM, 0, 1.38, -0.68, -0.56);                                       // Frontscheibe
  for (const [x, y, r] of [[0, 0.95, 0.27], [-0.42, 0.62, 0.14], [0.42, 0.62, 0.14]]) {                                   // Duesen (gluehen beim Sprung)
    meshIn(g, new THREE.CylinderGeometry(r, r * 1.15, 0.4, 14, 1, true).rotateX(Math.PI / 2), nozM, x, y, 2.55);
    meshIn(g, new THREE.CircleGeometry(r * 0.95, 14), jetM, x, y, 2.45);
  }
  mergeStatic(g);
  // Raeder: vorne r 0,46 / 0,4 breit, hinten r 0,74 / 0,56 breit (Spur passt auf die Hebebuehne)
  const wheels = [addWheel(g, -1.0, -1.75, 0.46, 0.4, true, tireM, rimM, 7, 14), addWheel(g, 1.0, -1.75, 0.46, 0.4, true, tireM, rimM, 7, 14), addWheel(g, -0.95, 1.55, 0.74, 0.56, false, tireM, rimM, 7, 14), addWheel(g, 0.95, 1.55, 0.74, 0.56, false, tireM, rimM, 7, 14)];
  return { g, wheels, jetM };
}
// ---- Rolls-Royce (Stil Phantom): lange Haube, hoher Chromgrill, aufrechte Front, kurzer Hecküberhang, grosse Raeder ----
function buildRolls(col) {
  const g = new THREE.Group();
  const paint = M(col, { metalness: 0.55, roughness: 0.3 }), chrome = M(0xe8eaec, { metalness: 0.95, roughness: 0.12 }), glass = M(0x0b0e13, { roughness: 0.06, metalness: 0.8 });
  const tireM = M(0x141414, { roughness: 0.92 }), dark = M(0x1b1c1f, { roughness: 0.6, metalness: 0.3 }), rimM = M(0xdfe2e5, { metalness: 0.9, roughness: 0.2 });
  const grilleT = canvasTex(64, 64, (c, w, h) => { c.fillStyle = "#dfe2e5"; c.fillRect(0, 0, w, h); c.fillStyle = "#24262a"; for (let x = 2; x < w; x += 5) c.fillRect(x, 0, 3, h); }); grilleT.repeat.set(1, 1);
  const grille = M(0xffffff, { map: grilleT, metalness: 0.85, roughness: 0.25 });
  // Oberer Aufbau (volle Breite ab 0,76 m), unten schmaler Kern; Schweller und Ueberhaenge seitlich, Radhaeuser bleiben offen
  prismIn(g, [[3.05, 0.76], [2.98, 1.06], [1.2, 1.12], [0.45, 1.58], [-1.5, 1.63], [-2.3, 1.22], [-2.98, 1.08], [-3.05, 0.76]], 1.98, paint);
  boxIn(g, -0.7, 0.7, 0.3, 0.77, -3.0, 3.0, paint);
  for (const sd of [-1, 1]) {
    const x0 = sd > 0 ? 0.7 : -0.99, x1 = sd > 0 ? 0.99 : -0.7;
    for (const [z0, z1] of [[-3.04, -2.27], [-1.27, 1.27], [2.27, 3.04]]) boxIn(g, x0, x1, 0.34, 0.77, z0, z1, paint);
    boxIn(g, sd * 0.993 - 0.007, sd * 0.993 + 0.007, 1.17, 1.5, -0.42, 1.45, glass);                                   // Seitenfenster
    boxIn(g, sd * 0.996 - 0.005, sd * 0.996 + 0.005, 1.1, 1.13, -2.95, 2.95, chrome);                                  // Zierleiste
    boxIn(g, sd * 0.86 - 0.17, sd * 0.86 + 0.17, 0.8, 0.93, -3.08, -3.02, mat.glow);                                   // Scheinwerfer
    boxIn(g, sd * 0.82 - 0.12, sd * 0.82 + 0.12, 0.74, 1.02, 3.02, 3.08, mat.glowRed);                                 // Ruecklicht
    boxIn(g, sd * 1.07 - 0.08, sd * 1.07 + 0.08, 1.13, 1.25, -0.62, -0.44, paint);                                     // Spiegel
    boxIn(g, sd * 0.999 - 0.01, sd * 0.999 + 0.01, 0.98, 1.01, -0.1, 0.12, chrome);                                    // Tuergriffe
    boxIn(g, sd * 0.999 - 0.01, sd * 0.999 + 0.01, 0.98, 1.01, 1.05, 1.27, chrome);
  }
  meshIn(g, new THREE.BoxGeometry(1.8, 0.02, 0.88), glass, 0, 1.36, -0.83, -0.55);                                           // Frontscheibe
  meshIn(g, new THREE.BoxGeometry(1.7, 0.02, 0.9), glass, 0, 1.43, 1.9, 0.47);                                               // Heckscheibe
  boxIn(g, -0.36, 0.36, 0.5, 1.04, -3.13, -3.05, grille);                                                                    // Grill (Pantheon)
  boxIn(g, -0.41, 0.41, 1.04, 1.1, -3.14, -2.98, chrome); boxIn(g, -0.41, -0.36, 0.48, 1.04, -3.14, -3.03, chrome); boxIn(g, 0.36, 0.41, 0.48, 1.04, -3.14, -3.03, chrome);
  meshIn(g, new THREE.CylinderGeometry(0.018, 0.024, 0.07, 8), chrome, 0, 1.135, -3.0); meshIn(g, new THREE.BoxGeometry(0.03, 0.09, 0.07), chrome, 0, 1.2, -2.99, 0.5);   // Kuehlerfigur
  boxIn(g, -1.0, 1.0, 0.36, 0.47, -3.14, -3.02, chrome); boxIn(g, -1.0, 1.0, 0.36, 0.47, 3.02, 3.12, chrome);                // Stossstangen
  boxIn(g, -0.95, 0.95, 0.2, 0.34, -2.8, 2.8, dark);                                                                         // Unterboden
  mergeStatic(g);
  const wheels = [[-0.86, -1.78, true], [0.86, -1.78, true], [-0.86, 1.78, false], [0.86, 1.78, false]].map(([x, z, f]) => addWheel(g, x, z, 0.43, 0.3, f, tireM, rimM, 0, 22));
  return { g, wheels };
}
// ---- Motorrad: sportliches Naked Bike (Tank, Sitzbank, Motorblock, Auspuff, Gabel, Lenker, Scheinwerfer) ----
function buildBike(col) {
  const g = new THREE.Group();
  const paint = M(col, { metalness: 0.5, roughness: 0.32 }), black = M(0x141517, { roughness: 0.7 }), metal = M(0x8d9298, { metalness: 0.85, roughness: 0.3 }), chrome = M(0xe8eaec, { metalness: 0.95, roughness: 0.12 });
  const tireM = M(0x121212, { roughness: 0.9 }), rimM = M(0x2a2c30, { metalness: 0.6, roughness: 0.4 });
  prismIn(g, [[0.42, 0.72], [0.36, 0.97], [0.0, 1.0], [-0.22, 0.92], [-0.18, 0.72]], 0.36, paint);                           // Tank
  prismIn(g, [[-0.15, 0.86], [-0.2, 0.92], [-0.7, 0.92], [-0.95, 1.02], [-1.0, 0.96], [-0.7, 0.84]], 0.28, black);            // Sitzbank
  prismIn(g, [[-0.85, 0.9], [-1.05, 1.02], [-1.12, 0.98], [-0.9, 0.82]], 0.22, paint);                                       // Heckbuerzel
  prismIn(g, [[0.55, 0.62], [0.45, 0.78], [-0.65, 0.88], [-0.75, 0.74], [0.35, 0.5]], 0.14, metal);                         // Rahmen
  prismIn(g, [[0.38, 0.28], [0.42, 0.62], [-0.2, 0.7], [-0.3, 0.3]], 0.42, metal);                                           // Motorblock
  meshIn(g, new THREE.CylinderGeometry(0.055, 0.065, 0.85, 10).rotateX(Math.PI / 2), chrome, 0.2, 0.36, 0.42);               // Auspuff
  for (const sd of [-1, 1]) meshIn(g, new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), chrome, sd * 0.1, 0.66, -0.6, 0.38);   // Gabel
  boxIn(g, -0.38, 0.38, 1.02, 1.05, -0.5, -0.46, black);                                                                     // Lenker
  meshIn(g, new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14).rotateX(Math.PI / 2), mat.glow, 0, 0.93, -0.62);                // Scheinwerfer
  boxIn(g, -0.07, 0.07, 0.98, 1.02, 1.1, 1.13, mat.glowRed);                                                                // Ruecklicht
  prismIn(g, [[0.66, 0.42], [0.72, 0.5], [0.45, 0.52], [0.42, 0.46]], 0.14, paint);                                          // Kotfluegel vorne
  mergeStatic(g);
  const wheels = [addWheel(g, 0, -0.72, 0.31, 0.12, true, tireM, rimM, 0, 20), addWheel(g, 0, 0.72, 0.32, 0.18, false, tireM, rimM, 0, 20)];
  return { g, wheels };
}
// ---- Batpod (Nicolas 2026-11-08, nach Fotos): zwei gleich grosse, sehr breite Stollenraeder weit auseinander, Schwingen links und rechts
// vom Rad (Nabenlenkung), duenner geschwungener Rahmen aus Rohren statt Block, kleiner Motor unten, Verkleidung ("Tank") steigt nach vorne an,
// Fahrer liegt flach, KEINE Platte ueber dem Vorderrad, Kanonengehaeuse neben dem Vorderrad mit langen Rohren weit nach vorne,
// Sitz hinten, offene Mechanik. Ganz schwarz, keine Duesen.
function buildBatpod() {
  const g = new THREE.Group();
  const body = M(0x111214, { metalness: 0.55, roughness: 0.38, flatShading: true }), matte = M(0x0a0b0c, { roughness: 0.85, flatShading: true });
  const gun = M(0x1e2024, { metalness: 0.75, roughness: 0.3, flatShading: true }), seatM = M(0x070708, { roughness: 0.95 });
  const tireM = M(0x0d0d0d, { roughness: 0.95, flatShading: true }), rimM = M(0x18191c, { metalness: 0.6, roughness: 0.4, flatShading: true });
  // Masse nach Fotos und Original (Nicolas: ca. 3,80 m lang): Radstand 2,36 m, Raeder r 0,42 und 0,56 breit,
  // Kanonen reichen ca. 1 m vor die Vorderradnabe -> von der Muendung bis hinter das Hinterrad 3,80 m
  const WZ = 1.18, WR = 0.42, TW = 0.56;
  // Rohr von p nach q (lokal: x quer, y hoch, z hinten)
  const tube = (p, q, r, m, seg = 8) => {
    const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), len = d.length();
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m); o.position.set((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(o); return o;
  };
  const path = (pts, r, m) => { for (let k = 0; k < pts.length - 1; k++) { tube(pts[k], pts[k + 1], r, m); meshIn(g, new THREE.SphereGeometry(r, 8, 6), m, ...pts[k + 1]); } };
  // Rahmen: Mittelrohr geschwungen (vorne hoch, Mitte, hinten tief), zwei duenne Unterzuege
  path([[0, 0.62, -0.62], [0, 0.84, -0.25], [0, 0.8, 0.15], [0, 0.62, 0.45], [0, 0.5, 0.66]], 0.055, gun);
  for (const sd of [-1, 1]) path([[sd * 0.12, 0.5, -0.62], [sd * 0.13, 0.38, -0.2], [sd * 0.13, 0.36, 0.2], [sd * 0.12, 0.44, 0.66]], 0.032, matte);
  prismIn(g, [[0.25, 0.32], [0.3, 0.56], [-0.2, 0.6], [-0.32, 0.36]], 0.26, matte);                                    // kleiner Motor unten
  prismIn(g, [[0.62, 0.8], [0.95, 1.02], [0.76, 1.1], [0.1, 0.98], [-0.12, 0.93], [-0.2, 0.8], [-0.02, 0.76]], 0.36, body);   // Verkleidung ("Tank"), endet vor dem Sattel
  // Sattel (Nicolas, Foto): schmales flaches Polster hinter der Verkleidung, hinten leicht hochgezogen, auf einer Stuetze; ueber dem Hinterrad nichts
  prismIn(g, [[-0.14, 0.9], [-0.5, 0.92], [-0.6, 0.97], [-0.57, 1.0], [-0.48, 0.97], [-0.14, 0.96]], 0.24, seatM);
  tube([0, 0.78, 0.18], [0, 0.91, 0.36], 0.03, gun);
  for (const sd of [-1, 1]) {
    // Schwingen beidseits der Raeder (Nabenlenkung): vorne schraeg hoch zum Rahmen, hinten flach
    // Proportionen nach der Frontansicht (Nicolas): Reifen sehr breit (TW), Schwingen und Naben aussen daneben, Kanonen weit aussen
    const SA = sd * (TW / 2 + 0.06), GX = sd * (TW / 2 + 0.25);
    tube([SA, WR, -WZ], [sd * 0.2, 0.8, -0.42], 0.05, gun); tube([SA, WR - 0.06, -WZ + 0.1], [sd * 0.16, 0.5, -0.6], 0.03, matte);
    tube([SA, WR, WZ], [sd * 0.18, 0.56, 0.5], 0.05, gun); tube([SA, WR - 0.08, WZ - 0.1], [sd * 0.14, 0.4, 0.62], 0.03, matte);
    meshIn(g, new THREE.CylinderGeometry(0.12, 0.12, 0.09, 12).rotateZ(Math.PI / 2), gun, SA, WR, -WZ);                 // Nabendeckel
    meshIn(g, new THREE.CylinderGeometry(0.12, 0.12, 0.09, 12).rotateZ(Math.PI / 2), gun, SA, WR, WZ);
    // Kanonen: Achsstummel von der Nabe nach aussen, kantiges Gehaeuse, zwei lange Rohre schraeg nach vorne unten (mit Muendung)
    tube([SA, WR, -WZ], [GX, WR, -WZ], 0.06, gun);
    prismIn(g, [[0.85, 0.36], [0.95, 0.72], [1.5, 0.7], [1.6, 0.52], [1.5, 0.34]], 0.17, gun, GX);
    for (const [dx, y, r, l, dn] of [[0, 0.58, 0.04, 0.6, 0.1], [sd * -0.02, 0.4, 0.03, 0.42, 0.07]]) {
      const p = [GX + dx, y, -1.55], q = [GX + dx + sd * 0.05, y - dn, -1.55 - l];
      tube(p, q, r, gun, 10);
      const e = 0.14 / l; tube([q[0] - (q[0] - p[0]) * e, q[1] - (q[1] - p[1]) * e, q[2] - (q[2] - p[2]) * e], [q[0] + (q[0] - p[0]) * e * 0.3, q[1] + (q[1] - p[1]) * e * 0.3, q[2] + (q[2] - p[2]) * e * 0.3], r * 1.7, gun, 10);   // Muendung
    }
    boxIn(g, GX - 0.05, GX + 0.05, 0.62, 0.66, -1.62, -1.59, mat.glow);                                                   // Scheinwerfer vorne am Gehaeuse
    // Griffe weit vorne (Fahrer liegt flach), Spiegel auf Stielen nach oben-aussen
    boxIn(g, sd > 0 ? 0.2 : -0.38, sd > 0 ? 0.38 : -0.2, 1.0, 1.06, -0.98, -0.86, matte);
    tube([sd * 0.32, 1.04, -0.92], [sd * 0.42, 1.28, -0.98], 0.015, gun); boxIn(g, sd * 0.42 - 0.08, sd * 0.42 + 0.08, 1.24, 1.38, -1.0, -0.96, matte);
    // offene Mechanik: Leitungen und Federbein an der Seite (bleiben vor dem Hinterrad)
    path([[sd * 0.18, 0.62, -0.5], [sd * 0.22, 0.55, -0.05], [sd * 0.2, 0.5, 0.4]], 0.016, matte);
    tube([sd * 0.16, 0.48, 0.3], [sd * 0.2, 0.72, 0.56], 0.04, gun);
  }
  mergeStatic(g);
  const wheels = [addWheel(g, 0, -WZ, WR, TW, true, tireM, rimM, 26, 26), addWheel(g, 0, WZ, WR, TW, false, tireM, rimM, 26, 26)];
  return { g, wheels };
}
const SPEC_TUMBLER = { name: "Tumbler", wheels: [[-1.0, -1.75], [1.0, -1.75], [-0.95, 1.55], [0.95, 1.55]], wb: 3.3, track: 1.95, pts: [-1.45, 0, 1.45], R: 1.25, circR: 1.15, enter: 3.8,
  maxN: 24, maxF: 38, acc: 14, steer: 0.72, jump: true, grade: 40, camD: 8.5, camH: 1.3, seat: [0, 1.42, 0.2], bodyH: 1.9, bike: false,
  exits: [[-2.2, -0.3], [2.2, -0.3], [-2.4, 1.2], [2.4, 1.2], [0, -3.6], [0, 3.6]],
  msg: "Tumbler: W/S Gas/Bremse, A/D lenken, Shift schneller, Leertaste Sprung (ab 50 km/h), V Kamera, R zurücksetzen, L Autoaufzug, E aussteigen" };
const SPEC_ROLLS = { name: "Rolls-Royce", wheels: [[-0.86, -1.78], [0.86, -1.78], [-0.86, 1.78], [0.86, 1.78]], wb: 3.56, track: 1.72, pts: [-1.95, 0, 1.95], R: 1.05, circR: 1.0, enter: 3.8,
  maxN: 30, maxF: 48, acc: 10, steer: 0.62, jump: false, grade: 35, camD: 9.5, camH: 1.2, seat: [-0.45, 1.32, 0.1], bodyH: 1.8, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -4.0], [0, 4.0]],
  msg: "Rolls-Royce: W/S Gas/Bremse, A/D lenken, Shift schneller, V Kamera, R zurücksetzen, L Autoaufzug, E aussteigen" };
const SPEC_BIKE = { name: "Motorrad", wheels: [[0, -0.72], [0, 0.72]], wb: 1.44, track: 0, pts: [-0.55, 0.55], R: 0.42, circR: 0.4, enter: 2.5,
  maxN: 32, maxF: 52, acc: 13, steer: 0.6, jump: false, grade: 45, camD: 5.5, camH: 1.0, seat: [0, 1.42, 0.25], bodyH: 1.7, bike: true,
  exits: [[-1.0, 0], [1.0, 0], [-1.1, 0.6], [1.1, 0.6], [0, -1.8], [0, 1.8]],
  msg: "Motorrad: W/S Gas/Bremse, A/D lenken, Shift schneller, V Kamera, R zurücksetzen, L Autoaufzug, E absteigen" };
const SPEC_BATPOD = { name: "Batpod", wheels: [[0, -1.18], [0, 1.18]], wb: 2.36, track: 0, pts: [-0.95, 0, 0.95], R: 0.5, circR: 0.5, enter: 2.8,
  maxN: 34, maxF: 56, acc: 15, steer: 0.55, jump: true, grade: 45, camD: 6.5, camH: 1.0, seat: [0, 1.25, 0.15], bodyH: 1.4, bike: true,
  exits: [[-1.1, 0], [1.1, 0], [-1.2, 0.8], [1.2, 0.8], [0, -2.5], [0, 2.5]],
  msg: "Batpod: W/S Gas/Bremse, A/D lenken, Shift schneller, Leertaste Sprung (ab 50 km/h), V Kamera, R zurücksetzen, L Autoaufzug, E absteigen" };
function addVehicle(spec, built, x, z, y, h, label = spec.name, color = 0x16181b) {
  built.g.userData.dynamic = true; built.g.userData.noLift = true; scene.add(built.g);
  const C = { spec, g: built.g, wheels: built.wheels, jetM: built.jetM || null, x, z, y, h, v: 0, vy: 0, air: false, wet: false, on: false, view: 0, steer: 0, jet: 0, lean: 0,
    pitch: 0, roll: 0, circ: null, safe: null, safeT: 0, msgT: 0, settled: false, spun: false, home: { x, z, y, h }, idx: VEH.length, label, color };
  C.leave = () => { if (C.on) { C.on = false; C.v = 0; speedEl.hidden = true; engineStop(); } };
  VEH.push(C); return C;
}
{
  const bays = world.userData.bays, gy = GY + HILL;
  CAR = addVehicle(SPEC_TUMBLER, buildTumbler(0x16181b, 0x0d0e10), bays[1].x, bays[1].z, gy, Math.PI, "Tumbler schwarz (Garage Platz 1)", 0x16181b);
  for (const [no, col, nm] of [[3, 0x8c1d1d, "rot"], [4, 0x2b4c7e, "blau"], [6, 0xc9c9c4, "silber"], [7, 0x1d3b2a, "dunkelgrün"], [9, 0x55585e, "grau"]])
    addVehicle(SPEC_ROLLS, buildRolls(col), bays[no].x, bays[no].z + bays[no].d / 2 - 3.3, gy, 0, "Rolls-Royce " + nm + " (Garage Platz " + no + ")", col);   // Front zur Fahrgasse (-z), Heck am hinteren Platzrand (6,1 m lang)
  // Drehende Tiefgarage (Batcave, Nicolas 2026-11-08): nur noch der schwarze Tumbler und das rote Motorrad (vorher Garage Platz 2),
  // gegenueber auf den Feldern 0 und 3, beide schauen nach aussen; die farbigen Tumbler sind weg
  const tt = world.userData.turntable, rr = 60 * CAVE_SC, ttPos = k => { const ang = (k + 0.5) / 6 * Math.PI * 2; return [tt.position.x + Math.cos(ang) * rr * 0.55, tt.position.z + Math.sin(ang) * rr * 0.55, Math.atan2(-Math.cos(ang), -Math.sin(ang))]; };
  { const [x, z, h] = ttPos(0); addVehicle(SPEC_TUMBLER, buildTumbler(0x16181b, 0x0d0e10), x, z, LY, h, "Tumbler schwarz (Batcave Drehscheibe)", 0x16181b); }
  { const [x, z, h] = ttPos(3); addVehicle(SPEC_BIKE, buildBike(0xb0141e), x, z, LY, h, "Motorrad rot (Batcave Drehscheibe)", 0xb0141e); }
  // Versteck hinter der getarnten Felswand (frueher Geheimgang zum Autoaufzug, Nicolas 2026-11-08): schwarzer Tumbler, Bug zur Felswand
  addVehicle(SPEC_TUMBLER, buildTumbler(0x0e0f12, 0x08090b), -47.5, 36.8, LY, 0, "Tumbler schwarz (Versteck hinter der Felswand)", 0x0e0f12);
  // Batpod (schwarz) in der Batcave vor dem Batcomputer, Front nach Osten Richtung Hoehle
  addVehicle(SPEC_BATPOD, buildBatpod(), -49.5, -13, LY, -Math.PI / 2, "Batpod (Batcave beim Batcomputer)", 0x111214);
  world.userData.vehicles = VEH;
  world.userData.car = { leave: () => VEH.forEach(v => v.leave()) };
}
