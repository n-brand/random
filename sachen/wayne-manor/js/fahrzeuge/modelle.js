// Wayne Manor 3D – Fahrzeuge: Modelle (Tumbler, Rolls-Royce, G-Klasse, Nachtfalke, Motorrad, Batpod, Gemini, ChatGPT GPT-6, DeepSeek), Werte, Aufstellung
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Fahrzeuge (D1, erweitert 2026-11-08) =====================
// Mehrere fahrbare Fahrzeuge mit gemeinsamer Steuerung: Tumbler (Garage-Platz 1, mit Sprung), Rolls-Royce (Plaetze 3, 4, 6, 7, 9, je eigene
// Farbe), schwarzer Tumbler und Motorrad auf der drehenden Tiefgarage in der Batcave (drehen mit, auch beim Fahren), Batpod beim Batcomputer.
// E in der Naehe = ins naechste Fahrzeug einsteigen, im Fahrzeug E = aussteigen. W/S Gas/Bremse (rueckwaerts), A/D lenken,
// Leertaste = Sprung mit Schub (nur Tumbler, ab 50 km/h), V = Kamera hinten/Fahrersicht, R = zuruecksetzen, L = Autoaufzug rufen/fahren,
// 1-3 = Halt im Autoaufzug. Kollision wie beim Laufen (Quader, Kreise, Tore, Leitplanken), Kreise fuer die Karosserie (je Fahrzeug).
// Das aktive Fahrzeug ist CAR; die Hilfsfunktionen arbeiten auf CAR (fuer geparkte Fahrzeuge wird CAR in carFrame kurz umgesetzt).
const speedEl = (() => { const d = document.createElement("div"); d.id = "car-speed"; d.hidden = true;
  d.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:6;padding:6px 14px;border-radius:999px;background:rgba(10,12,16,.72);color:#f4f4f0;font:600 15px system-ui,sans-serif;pointer-events:none";
  document.body.appendChild(d); return d; })();
// Nitro-Leiste (Nachtfalke, Nicolas 2026-11-09): zeigt den Vorrat, laedt sichtbar nach (orange solange gesperrt), nur im Auto (body.car)
const nitroEl = (() => { const d = document.createElement("div"); d.id = "car-nitro"; d.hidden = true; d.innerHTML = "<span>NITRO</span><i><b></b></i>"; document.body.appendChild(d); return d; })();
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
// Reifen mit runden Schultern (Nicolas 2026-11-08: "von vorne runder", gilt fuer alle und kuenftige Fahrzeuge): Profil (Radius, Achse)
// von der Flanke (0,6 r) ueber eine Viertelkreis-Schulter zur Laufflaeche und zurueck, um die Achse gedreht. Achse entlang x.
function roundTireGeo(r, w, seg = 24) {
  const sh = Math.min(w * 0.3, r * 0.3), hw = w / 2, prof = [new THREE.Vector2(r * 0.6, -hw + 0.01)];
  for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI / 2; prof.push(new THREE.Vector2(r - sh + sh * Math.sin(a), -hw + sh - sh * Math.cos(a))); }
  for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI / 2; prof.push(new THREE.Vector2(r - sh + sh * Math.cos(a), hw - sh + sh * Math.sin(a))); }
  prof.push(new THREE.Vector2(r * 0.6, hw - 0.01));
  return new THREE.LatheGeometry(prof, Math.max(16, seg)).rotateZ(Math.PI / 2);
}
// Rad: Reifen (+ Stollen) als ein Netz, Felge extra; piv lenkt (Vorderrad), spin dreht
function addWheel(g, x, z, r, w, front, tireM, rimM, lugs = 0, seg = 16) {
  const piv = new THREE.Group(); piv.position.set(x, r, z); g.add(piv);
  const spin = new THREE.Group(); piv.add(spin);
  const parts = [roundTireGeo(r, w, seg).toNonIndexed()];
  for (let k = 0; k < lugs; k++) { const a = k / lugs * Math.PI * 2, b = new THREE.BoxGeometry(w * 0.82, 0.07, r * 0.25).rotateX(-a).translate(0, Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97).toNonIndexed(); parts.push(b); }   // Stollen nur auf der Laufflaeche
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
    for (const [dx, y, r, l, dn] of [[0, 0.58, 0.04, 0.6, 0], [sd * -0.02, 0.4, 0.03, 0.42, 0]]) {   // Rohre waagrecht (Nicolas: zeigten nach unten)
      const p = [GX + dx, y, -1.55], q = [GX + dx, y - dn, -1.55 - l];
      tube(p, q, r, gun, 10);
      const e = 0.14 / l; tube([q[0] - (q[0] - p[0]) * e, q[1] - (q[1] - p[1]) * e, q[2] - (q[2] - p[2]) * e], [q[0] + (q[0] - p[0]) * e * 0.3, q[1] + (q[1] - p[1]) * e * 0.3, q[2] + (q[2] - p[2]) * e * 0.3], r * 1.7, gun, 10);   // Muendung
    }
    boxIn(g, GX - 0.05, GX + 0.05, 0.62, 0.66, -1.62, -1.59, mat.glow);                                                   // Scheinwerfer vorne am Gehaeuse
    // Griffe (Nicolas, Foto; keine Rueckspiegel): kurzer Ausleger vorne seitlich an der Verkleidung, Griff steht schraeg nach oben, Hebel davor
    tube([sd * 0.16, 0.98, -0.86], [sd * 0.32, 0.98, -0.9], 0.025, gun);
    tube([sd * 0.32, 0.94, -0.9], [sd * 0.37, 1.16, -0.84], 0.035, matte, 10);
    tube([sd * 0.34, 1.1, -0.9], [sd * 0.4, 1.0, -1.02], 0.008, gun);
    // offene Mechanik: Leitungen und Federbein an der Seite (bleiben vor dem Hinterrad)
    path([[sd * 0.18, 0.62, -0.5], [sd * 0.22, 0.55, -0.05], [sd * 0.2, 0.5, 0.4]], 0.016, matte);
    tube([sd * 0.16, 0.48, 0.3], [sd * 0.2, 0.72, 0.56], 0.04, gun);
  }
  mergeStatic(g);
  // Ballonreifen (runde Schultern kommen aus addWheel) mit feinem Blockprofil als Textur (Nicolas, Frontfoto); Felge kleiner, sitzt im Innern
  const wheels = [addWheel(g, 0, -WZ, WR, TW, true, tireM, rimM, 0, 40), addWheel(g, 0, WZ, WR, TW, false, tireM, rimM, 0, 40)];
  const tread = canvasTex(64, 64, (c, w, h) => { c.fillStyle = "#1a1a1a"; c.fillRect(0, 0, w, h); c.fillStyle = "#0a0a0a"; for (let k = 0; k < 4; k++) { c.fillRect(k * 16, 0, 2, h); c.fillRect(0, k * 16, w, 2); } });
  tread.repeat.set(44, 6);
  const balloonM = M(0x8a8a8a, { map: tread, roughness: 0.9 });
  for (const wh of wheels) { const [tire, rim] = wh.spin.children; tire.material = balloonM; rim.scale.set(0.85, 0.75, 0.75); }
  return { g, wheels };
}

// Quader quer zur Fahrtrichtung zwischen zwei x-Werten in beliebiger Reihenfolge (fuer Teile mit sd * ..., sonst negative Breite = unsichtbar)
const sideBox = (g, xa, xb, y0, y1, z0, z1, m) => boxIn(g, Math.min(xa, xb), Math.max(xa, xb), y0, y1, z0, z1, m);
// Quader aus Mittelpunkt und Groesse (x quer, y hoch, z hinten), optional um die Querachse geneigt
const boxAt = (g, sx, sy, sz, m, x, y, z, rx = 0) => meshIn(g, new THREE.BoxGeometry(sx, sy, sz), m, x, y, z, rx);
// ---- Mercedes-Benz G-Klasse (Nicolas 2026-11-09): kantiger Gelaendewagen, lange Haube, hoher Aufbau, Reserverad hinten ----
function buildGClass(col = 0x17191c) {
  const g = new THREE.Group();
  const paint = M(col, { metalness: 0.55, roughness: 0.3, flatShading: true }), dark = M(0x17191c, { roughness: 0.75, flatShading: true }), trim = M(0x25282c, { metalness: 0.3, roughness: 0.6 });
  const chrome = M(0xd5d8dc, { metalness: 0.9, roughness: 0.2 }), glass = M(0x080d14, { metalness: 0.65, roughness: 0.12 }), grilleM = M(0x101215, { metalness: 0.45, roughness: 0.5 });
  const tireM = M(0x111111, { roughness: 0.95 }), rimM = M(0xb6bac0, { metalness: 0.85, roughness: 0.22 });
  prismIn(g, [[2.35, 0.48], [2.35, 0.83], [2.12, 0.99], [1.15, 1.03], [0.95, 1.13], [0.95, 1.93], [0.72, 2.02], [-1.25, 2.02], [-1.48, 1.91], [-1.48, 1.03], [-2.05, 1.0], [-2.35, 0.82], [-2.35, 0.48]], 1.82, paint);   // Grundkoerper
  boxIn(g, -0.87, 0.87, 0.32, 0.58, -2.25, 2.2, dark);                                                                     // Unterboden
  for (const sd of [-1, 1]) {
    const x = sd * 0.925;
    boxIn(g, x - 0.035, x + 0.035, 0.98, 1.015, -2.05, -0.98, trim);                                                       // Haubenkante
    boxIn(g, x - 0.045, x + 0.045, 1.88, 2.0, -1.35, 1.0, paint);                                                          // Dachaufbau
    boxIn(g, x - 0.018, x + 0.018, 1.28, 1.78, -1.22, -0.25, glass); boxIn(g, x - 0.018, x + 0.018, 1.28, 1.78, -0.15, 0.95, glass);   // Seitenscheiben
    boxIn(g, x - 0.035, x + 0.035, 1.22, 1.88, -0.23, -0.12, dark); boxIn(g, x - 0.035, x + 0.035, 1.12, 1.91, 0.99, 1.1, paint);       // B- und D-Saeule
    sideBox(g, x, x + sd * 0.025, 0.94, 0.98, -0.95, 1.15, chrome);                                                        // Zierleiste
    for (const z of [-0.55, 0.58]) sideBox(g, x, x + sd * 0.025, 1.12, 1.19, z, z + 0.18, chrome);                        // Tuergriffe
    sideBox(g, sd * 0.94, sd * 1.12, 1.48, 1.64, -1.12, -0.87, dark); sideBox(g, sd * 1.08, sd * 1.13, 1.52, 1.62, -1.08, -0.91, chrome);   // Spiegel
    for (const z of [-1.52, 1.48]) {
      const arch = meshIn(g, new THREE.TorusGeometry(0.56, 0.085, 8, 20), trim, sd * 0.97, 0.49, z); arch.rotation.y = Math.PI / 2;   // Kotfluegelverbreiterung
      boxIn(g, sd * 1.0 - 0.16, sd * 1.0 + 0.16, 0.99, 1.06, z - 0.5, z + 0.5, trim);                                    // Radhausblende ueber dem Reifen (vorher mitten im Rad)
    }
    boxIn(g, sd * 0.48 - 0.2, sd * 0.48 + 0.2, 0.82, 1.0, -2.37, -2.32, mat.glow);                                         // Scheinwerfer
    meshIn(g, new THREE.CylinderGeometry(0.105, 0.105, 0.055, 16), chrome, sd * 0.72, 0.91, -2.37, Math.PI / 2);         // runde Zusatzleuchten
    boxIn(g, sd * 0.75 - 0.13, sd * 0.75 + 0.13, 0.85, 1.15, 2.32, 2.37, mat.glowRed);                                     // Rueckleuchten
    sideBox(g, sd * 0.94, sd * 0.99, 2.0, 2.035, -1.35, 1.05, chrome);                                                     // Dachrinne
    boxIn(g, sd * 0.94 - 0.06, sd * 0.94 + 0.06, 0.38, 0.47, -0.9, 1.05, chrome);                                          // Trittbretter
  }
  boxIn(g, -0.67, 0.67, 1.005, 1.045, -2.0, -1.02, paint);                                                                 // Haube Mitte
  meshIn(g, new THREE.BoxGeometry(1.72, 0.035, 0.52), glass, 0, 1.48, -1.43, -0.18); meshIn(g, new THREE.BoxGeometry(1.7, 0.035, 0.48), glass, 0, 1.48, 1.36, 0.18);   // Front-/Heckscheibe
  boxIn(g, -0.94, 0.94, 2.0, 2.09, -1.35, 1.15, paint); boxIn(g, -0.55, 0.55, 2.09, 2.14, -0.9, 0.8, dark);               // Dach
  boxIn(g, -0.57, 0.57, 0.55, 0.96, -2.39, -2.34, grilleM);                                                                // Grill mit Streben und Stern
  for (let x = -0.43; x <= 0.43; x += 0.14) boxIn(g, x - 0.025, x + 0.025, 0.59, 0.91, -2.405, -2.38, chrome);
  meshIn(g, new THREE.CylinderGeometry(0.12, 0.12, 0.035, 12), chrome, 0, 0.76, -2.42, Math.PI / 2);
  boxIn(g, -1.02, 1.02, 0.39, 0.57, -2.47, -2.27, dark); boxIn(g, -1.02, 1.02, 0.39, 0.57, 2.27, 2.47, dark);             // Stossfaenger
  boxIn(g, -0.83, 0.83, 0.55, 1.87, 2.34, 2.39, paint);                                                                    // Heckklappe
  meshIn(g, new THREE.TorusGeometry(0.43, 0.115, 10, 24), tireM, 0, 1.23, 2.49); meshIn(g, new THREE.CylinderGeometry(0.27, 0.27, 0.12, 10), rimM, 0, 1.23, 2.48, Math.PI / 2);   // Reserverad
  mergeStatic(g);
  const wheels = [[-0.96, -1.52, true], [0.96, -1.52, true], [-0.96, 1.48, false], [0.96, 1.48, false]].map(([x, z, f]) => addWheel(g, x, z, 0.49, 0.36, f, tireM, rimM, 0, 24));
  return { g, wheels };
}
// ---- Gemini Concept GT (Nicolas 2026-11-09, Entwurf von Gemini): flacher Sportwagen, Glaskanzel, blaue Felgen, Splitter und Spoiler ----
function buildGemini() {
  const g = new THREE.Group();
  const bodyM = M(0x161a22, { metalness: 0.7, roughness: 0.25 }), accentM = M(0x1a2332, { metalness: 0.5, roughness: 0.4 });
  const glassM = M(0x05080e, { roughness: 0.05, metalness: 0.9 }), chromeM = M(0xe8eaec, { metalness: 0.95, roughness: 0.1 });
  const tireM = M(0x121212, { roughness: 0.9 }), rimM = M(0x1a8cff, { metalness: 0.8, roughness: 0.2 });
  prismIn(g, [[2.5, 0.35], [2.2, 0.75], [1.1, 1.05], [-0.8, 1.12], [-2.0, 0.85], [-2.5, 0.55], [-2.5, 0.3], [2.5, 0.3]], 1.85, bodyM);   // Seitenprofil
  prismIn(g, [[1.0, 1.06], [0.6, 1.35], [-0.8, 1.38], [-1.2, 1.1]], 1.5, glassM);                                         // Kanzel
  for (const sd of [-1, 1]) {
    boxIn(g, sd * 0.94 - 0.02, sd * 0.94 + 0.02, 0.6, 0.95, -1.8, 1.6, accentM);                                           // Seitenakzent
    boxIn(g, sd * 0.95 - 0.01, sd * 0.95 + 0.01, 0.82, 0.86, -2.4, -2.38, mat.glow);                                       // LED-Streifen
    boxIn(g, sd * 0.8 - 0.15, sd * 0.8 + 0.15, 0.65, 0.75, -2.52, -2.48, mat.glow);                                        // Scheinwerfer
    boxIn(g, sd * 0.75 - 0.15, sd * 0.75 + 0.15, 0.7, 0.78, 2.48, 2.52, mat.glowRed);                                      // Ruecklicht
  }
  boxIn(g, -1.1, 1.1, 0.28, 0.42, -2.55, -2.4, accentM); boxIn(g, -1.0, 1.0, 1.25, 1.32, 2.1, 2.4, accentM);             // Splitter, Spoiler
  meshIn(g, new THREE.BoxGeometry(2.1, 0.04, 0.45), chromeM, 0, 1.25, 2.25);
  mergeStatic(g);
  const wheels = [[-0.92, -1.5, true, 0.44, 0.36], [0.92, -1.5, true, 0.44, 0.36], [-0.92, 1.5, false, 0.46, 0.38], [0.92, 1.5, false, 0.46, 0.38]].map(([x, z, f, r, w]) => addWheel(g, x, z, r, w, f, tireM, rimM, 8, 24));
  return { g, wheels };
}
// ---- ChatGPT GPT-6 Concept GT (Nicolas 2026-11-09, Entwurf von ChatGPT): silbernes Hypercar, cyan Lichtlinien, Sechseck-Emblem, Heckfluegel ----
function buildChatGPT() {
  const g = new THREE.Group();
  const bodyM = M(0xd7e0e8, { metalness: 0.82, roughness: 0.22 }), accentM = M(0x152431, { metalness: 0.65, roughness: 0.32 }), glassM = M(0x050a12, { roughness: 0.045, metalness: 0.92 });
  const glowM = M(0x27d9e8, { metalness: 0.35, roughness: 0.18, emissive: 0x087d91, emissiveIntensity: 1.2 }), rearLightM = M(0xff263d, { metalness: 0.35, roughness: 0.2, emissive: 0x8c0015, emissiveIntensity: 1.0 });
  const chromeM = M(0xeaf4f7, { metalness: 0.95, roughness: 0.12 }), tireM = M(0x101317, { roughness: 0.92 }), rimM = M(0x8ecbd8, { metalness: 0.9, roughness: 0.18 });
  prismIn(g, [[2.55, 0.34], [2.28, 0.76], [1.08, 1.02], [-0.9, 1.1], [-2.05, 0.84], [-2.58, 0.52], [-2.58, 0.29], [2.55, 0.29]], 1.92, bodyM);   // Hauptkarosserie
  prismIn(g, [[1.03, 1.03], [0.58, 1.39], [-0.9, 1.42], [-1.28, 1.11]], 1.52, glassM);                                    // Cockpit
  for (const sd of [-1, 1]) {
    boxIn(g, sd * 0.965 - 0.035, sd * 0.965 + 0.035, 0.42, 0.58, -1.95, 1.7, accentM);                                     // Schweller
    boxIn(g, sd * 0.977 - 0.014, sd * 0.977 + 0.014, 0.69, 0.75, -1.75, 1.65, glowM);                                      // Seitenlicht
    boxIn(g, sd * 0.78 - 0.16, sd * 0.78 + 0.16, 0.64, 0.76, -2.55, -2.5, glowM);                                          // Scheinwerfer
    boxIn(g, sd * 0.92 - 0.012, sd * 0.92 + 0.012, 0.84, 0.89, -2.42, -2.39, glowM);                                       // LED-Linie
    boxIn(g, sd * 0.74 - 0.16, sd * 0.74 + 0.16, 0.68, 0.8, 2.49, 2.54, rearLightM);                                       // Rueckleuchten
    boxIn(g, sd * 0.82 - 0.045, sd * 0.82 + 0.045, 0.38, 0.62, 1.72, 2.38, accentM);                                       // Heckfinnen
  }
  boxIn(g, -0.055, 0.055, 0.91, 1.025, -2.05, -1.0, chromeM); boxIn(g, -0.022, 0.022, 1.025, 1.045, -1.95, -1.08, glowM);   // Mittelrippe
  for (const [r, h, m, y] of [[0.19, 0.035, chromeM, 0.995], [0.115, 0.04, glowM, 1.03], [0.055, 0.045, accentM, 1.055]]) meshIn(g, new THREE.CylinderGeometry(r, r, h, 6), m, 0, y, -1.45);   // Sechseck-Emblem
  boxIn(g, -1.18, 1.18, 0.27, 0.39, -2.64, -2.42, accentM); boxIn(g, -1.08, 1.08, 0.3, 0.43, 2.25, 2.55, accentM);       // Splitter, Diffusor
  boxIn(g, -0.82, -0.62, 0.31, 0.48, 2.27, 2.53, chromeM); boxIn(g, 0.62, 0.82, 0.31, 0.48, 2.27, 2.53, chromeM);         // Endrohre
  boxIn(g, -1.08, 1.08, 1.19, 1.26, 2.12, 2.42, accentM); boxIn(g, -1.02, 1.02, 1.255, 1.285, 2.16, 2.38, glowM);         // Heckspoiler
  mergeStatic(g);
  const wheels = [[-0.94, -1.5, true, 0.44, 0.36], [0.94, -1.5, true, 0.44, 0.36], [-0.94, 1.5, false, 0.46, 0.38], [0.94, 1.5, false, 0.46, 0.38]].map(([x, z, f, r, w]) => addWheel(g, x, z, r, w, f, tireM, rimM, 10, 28));
  return { g, wheels };
}
// ---- DeepSeek Concept Car (Nicolas 2026-11-09, Entwurf von DeepSeek): Hypercar in Mitternachtsblau, cyan Leuchtlinien, Heckfluegel, Diffusor.
// Der Entwurf hatte vorne auf +x und eigene Zylinderreifen; hier auf vorne = -z umgerechnet, Raeder ueber addWheel (runde Reifen).
function buildDeepSeek() {
  const g = new THREE.Group();
  const bodyM = M(0x0a1628, { metalness: 0.9, roughness: 0.18 }), darkM = M(0x050b14, { metalness: 0.8, roughness: 0.4 }), accentM = M(0x1a3a5c, { metalness: 0.65, roughness: 0.3 });
  const glassM = M(0x02101c, { roughness: 0.02, metalness: 0.99 }), chromeM = M(0xdce6f0, { metalness: 0.98, roughness: 0.05 }), tireM = M(0x0d0d0d, { roughness: 0.93 }), rimM = M(0x00b4ff, { metalness: 0.9, roughness: 0.12 });
  const glowM = M(0x00c8ff, { emissive: 0x00aaff, emissiveIntensity: 3.5, metalness: 0.4, roughness: 0.3 }), headM = M(0x00e5ff, { emissive: 0x00ccff, emissiveIntensity: 5.0, metalness: 0.5, roughness: 0.1 }), tailM = M(0xff2255, { emissive: 0xff0044, emissiveIntensity: 5.0, metalness: 0.5, roughness: 0.1 });
  prismIn(g, [[2.8, 0.18], [2.72, 0.38], [2.5, 0.55], [2.1, 0.72], [1.55, 0.86], [1.05, 0.98], [0.25, 1.22], [-0.6, 1.25], [-1.3, 1.1], [-1.95, 0.98], [-2.5, 0.85], [-2.75, 0.7], [-2.85, 0.45], [-2.85, 0.18]], 1.85, bodyM);   // Silhouette
  prismIn(g, [[2.65, 0.2], [2.55, 0.4], [1.6, 0.55], [0.5, 0.62], [-1.0, 0.6], [-2.0, 0.55], [-2.55, 0.45], [-2.75, 0.25]], 1.88, darkM);   // dunkler Unterteil
  prismIn(g, [[1.05, 0.96], [0.25, 1.26], [-0.6, 1.29], [-1.3, 1.12], [-1.3, 0.88], [1.05, 0.88]], 1.6, glassM);          // Glaskanzel
  boxAt(g, 1.92, 0.05, 0.55, darkM, 0, 0.14, -2.72); boxAt(g, 1.92, 0.035, 0.04, glowM, 0, 0.14, -2.98);                 // Frontsplitter mit Lichtkante
  boxAt(g, 1.7, 0.09, 0.06, tailM, 0, 0.42, 2.87); boxAt(g, 1.45, 0.02, 0.03, glowM, 0, 0.34, 2.88); boxAt(g, 1.1, 0.2, 0.03, darkM, 0, 0.27, 2.87);   // Rueckleuchten, Gitter
  boxAt(g, 1.8, 0.05, 0.55, accentM, 0, 1.22, 2.6, -0.06); boxAt(g, 1.8, 0.02, 0.03, glowM, 0, 1.2, 2.85);              // Heckfluegel
  boxAt(g, 1.8, 0.12, 0.45, darkM, 0, 0.2, 2.62); for (const x of [-0.65, -0.35, 0, 0.35, 0.65]) boxAt(g, 0.03, 0.16, 0.4, accentM, x, 0.22, 2.62);   // Diffusor
  for (const sd of [-1, 1]) {
    boxAt(g, 0.14, 0.025, 0.28, accentM, sd * 0.82, 0.28, -2.55, 0.15);                                                    // Canards
    boxAt(g, 0.38, 0.08, 0.06, headM, sd * 0.55, 0.38, -2.62, -0.1); boxAt(g, 0.42, 0.02, 0.04, glowM, sd * 0.55, 0.47, -2.63);   // Scheinwerfer, Tagfahrlicht
    boxAt(g, 0.08, 0.42, 0.08, darkM, sd * 0.65, 1.0, 2.6); boxAt(g, 0.03, 0.18, 0.5, darkM, sd * 0.88, 1.2, 2.6);         // Fluegelstuetzen, Endplatten
    boxAt(g, 0.05, 0.07, 2.8, darkM, sd * 0.925, 0.2, 0.1); boxAt(g, 0.025, 0.015, 1.8, glowM, sd * 0.935, 0.32, -0.1);    // Schweller mit Lichtlinie
    boxAt(g, 0.03, 0.2, 0.55, darkM, sd * 0.935, 0.55, 1.1, 0.12); boxAt(g, 0.18, 0.02, 0.6, darkM, sd * 0.35, 0.86, -1.7, 0.1);   // Lufteinlass, Haubenschlitz
    for (const z of [-1.6, 1.7]) { const ring = meshIn(g, new THREE.TorusGeometry(0.33, 0.02, 8, 32), glowM, sd * 1.19, 0.4, z); ring.rotation.y = Math.PI / 2; }   // Leuchtring an der Felge
  }
  meshIn(g, new THREE.CylinderGeometry(0.1, 0.1, 0.02, 24), chromeM, 0, 0.36, -2.6, Math.PI / 2); meshIn(g, new THREE.TorusGeometry(0.09, 0.01, 8, 24), glowM, 0, 0.36, -2.62);   // Emblem
  boxAt(g, 1.15, 0.03, 0.9, darkM, 0, 1.01, 1.6, -0.15); for (let i = 0; i < 4; i++) boxAt(g, 1.05, 0.02, 0.04, accentM, 0, 1.02 - i * 0.025, 1.3 + i * 0.18, -0.15);   // Motorabdeckung
  mergeStatic(g);
  const wheels = [[-1.02, -1.6, true], [1.02, -1.6, true], [-1.02, 1.7, false], [1.02, 1.7, false]].map(([x, z, f]) => addWheel(g, x, z, 0.4, 0.32, f, tireM, rimM, 0, 32));
  return { g, wheels };
}
// ---- Nachtfalke (Nicolas 2026-11-09, eigener Entwurf im Stil der spaeten 60er Muscle-Cars, ohne Marken): lange Haube mit Powerdome und Lufthutze,
// Kuehlergrill ueber die ganze Breite mit vier runden Scheinwerfern, Hueftschwung ueber den Hinterraedern, Dach mit Seitenfinnen bis aufs Heck und
// steiler Heckscheibe dazwischen, Entenbuerzel, Leuchtband hinten, Seitenauspuffe, Nitro-Duese unter dem Heck (Leertaste: Flamme und Schub)
function buildNachtfalke(col = 0x0f1012) {
  const g = new THREE.Group();
  const paint = M(col, { metalness: 0.55, roughness: 0.32, flatShading: true }), dark = M(0x070809, { roughness: 0.7, flatShading: true }), glass = M(0x06090d, { metalness: 0.7, roughness: 0.08 });
  const chrome = M(0x9aa0a6, { metalness: 0.9, roughness: 0.25 }), tireM = M(0x101010, { roughness: 0.92 }), rimM = M(0x2a2c30, { metalness: 0.8, roughness: 0.3 });
  const jetM = M(0x3a1a08, { emissive: 0xff6a10, emissiveIntensity: 0 }), nozM = M(0x2a2c30, { metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide });
  prismIn(g, [[2.58, 0.3], [2.64, 0.56], [2.6, 0.8], [2.4, 0.88], [0.7, 0.95], [-1.4, 0.98], [-2.5, 1.0], [-2.64, 1.06], [-2.68, 0.96], [-2.64, 0.42], [-2.45, 0.28], [2.3, 0.28]], 1.28, paint);   // Rumpf
  prismIn(g, [[0.75, 0.94], [0.05, 1.3], [-0.88, 1.31], [-1.15, 0.98]], 1.4, paint);                                    // Kabine
  for (const sd of [-1, 1]) {
    prismIn(g, [[2.55, 0.32], [2.62, 0.8], [2.4, 0.88], [0.7, 0.95], [-1.4, 0.98], [-2.5, 1.0], [-2.62, 0.94], [-2.6, 0.38], [-2.1, 0.38], [-2.05, 0.62], [-1.9, 0.82], [-1.55, 0.92],
      [-1.2, 0.82], [-1.05, 0.62], [-1.0, 0.36], [1.05, 0.34], [1.1, 0.58], [1.25, 0.76], [1.6, 0.84], [1.95, 0.76], [2.1, 0.58], [2.15, 0.34]], 0.24, paint, sd * 0.79);   // Seitenwand mit Radlaeufen
    prismIn(g, [[-0.85, 0.5], [-0.92, 0.9], [-1.55, 0.97], [-2.4, 0.96], [-2.5, 0.5], [-2.15, 0.5], [-2.05, 0.7], [-1.85, 0.88], [-1.55, 0.94], [-1.25, 0.88], [-1.05, 0.7], [-0.98, 0.5]], 0.1, paint, sd * 0.95);   // Hueftschwung
    prismIn(g, [[-0.86, 1.31], [-0.88, 1.31], [-2.35, 1.0], [-2.2, 1.0]], 0.1, paint, sd * 0.65);                         // Seitenfinnen bis aufs Heck
    sideBox(g, sd * 0.7, sd * 0.71, 1.0, 1.24, -0.32, 0.75, glass);                                                     // Seitenfenster
    sideBox(g, sd * 0.91, sd * 0.915, 0.86, 0.88, -2.3, 2.3, chrome);                                                   // Zierleiste
    meshIn(g, new THREE.CylinderGeometry(0.055, 0.065, 1.7, 10), chrome, sd * 0.94, 0.3, 0.02, Math.PI / 2);             // Seitenauspuff
    for (const x of [0.36, 0.6]) meshIn(g, new THREE.CylinderGeometry(0.075, 0.075, 0.04, 16), mat.glow, sd * x, 0.63, -2.68, Math.PI / 2);   // vier runde Scheinwerfer
    boxIn(g, sd * 0.25, sd * 0.9, 0.38, 0.45, 2.62, 2.72, chrome);                                                      // Stossstange hinten (Mitte frei fuer die Duese)
  }
  prismIn(g, [[2.2, 0.88], [1.9, 0.98], [0.9, 1.0], [0.75, 0.95]], 0.7, paint);                                         // Powerdome
  prismIn(g, [[1.95, 0.98], [1.8, 1.08], [1.3, 1.07], [1.2, 1.0]], 0.5, dark);                                          // Lufthutze
  boxIn(g, -0.84, 0.84, 0.48, 0.78, -2.67, -2.6, dark); for (const y of [0.53, 0.73]) boxIn(g, -0.84, 0.84, y - 0.012, y + 0.012, -2.69, -2.66, chrome);   // Kuehlergrill
  boxIn(g, -0.02, 0.02, 0.48, 0.78, -2.69, -2.66, chrome); boxIn(g, -0.92, 0.92, 0.36, 0.43, -2.74, -2.62, chrome);    // Mittelsteg, Stossstange vorne
  prismIn(g, [[0.8, 0.95], [0.76, 0.95], [0.06, 1.315], [0.1, 1.315]], 1.32, glass);                                    // Frontscheibe
  prismIn(g, [[-0.9, 1.315], [-0.93, 1.315], [-1.2, 0.975], [-1.17, 0.975]], 1.2, glass);                               // Heckscheibe zwischen den Finnen
  prismIn(g, [[-2.4, 1.0], [-2.66, 1.1], [-2.7, 1.06], [-2.5, 0.99]], 1.74, paint);                                     // Entenbuerzel
  boxIn(g, -0.9, 0.9, 0.7, 0.9, 2.6, 2.69, dark); boxIn(g, -0.86, 0.86, 0.74, 0.86, 2.68, 2.7, mat.glowRed);           // Leuchtband hinten
  meshIn(g, new THREE.CylinderGeometry(0.15, 0.18, 0.45, 18, 1, true), nozM, 0, 0.56, 2.75, Math.PI / 2);              // Nitro-Duese
  meshIn(g, new THREE.TorusGeometry(0.165, 0.025, 8, 24), chrome, 0, 0.56, 2.97); meshIn(g, new THREE.CircleGeometry(0.15, 18), jetM, 0, 0.56, 2.62);
  mergeStatic(g);
  // Flamme (nicht zusammengefasst): zwei Kegel nach hinten, Laenge folgt dem Nitro (carPose)
  const flame = new THREE.Group(); flame.position.set(0, 0.56, 2.95); flame.visible = false; g.add(flame);
  for (const [r, l, c, o] of [[0.13, 1.5, 0xff6a18, 0.75], [0.07, 0.9, 0xfff0b0, 0.9]])
    flame.add(new THREE.Mesh(new THREE.ConeGeometry(r, l, 14, 1, true).rotateX(Math.PI / 2).translate(0, 0, l / 2), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
  const wheels = [[-0.8, -1.6, true, 0.36, 0.28], [0.8, -1.6, true, 0.36, 0.28], [-0.84, 1.55, false, 0.42, 0.4], [0.84, 1.55, false, 0.42, 0.4]].map(([x, z, f, r, w]) => addWheel(g, x, z, r, w, f, tireM, rimM, 0, 24));
  return { g, wheels, jetM, flame };
}
const SPEC_NACHTFALKE = { name: "Nachtfalke", wheels: [[-0.8, -1.6], [0.8, -1.6], [-0.84, 1.55], [0.84, 1.55]], wb: 3.15, track: 1.66, pts: [-1.75, 0, 1.75], R: 1.0, circR: 0.95, enter: 3.8,
  maxN: 34, maxF: 60, acc: 15, steer: 0.66, jump: false, boost: true, grade: 38, camD: 8.5, camH: 1.1, seat: [-0.4, 1.15, 0.15], bodyH: 1.4, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -3.8], [0, 3.8]],
  msg: "Nachtfalke: W/S Gas/Bremse, A/D lenken, Leertaste halten = Nitro, V Kamera, R zurücksetzen, L Autoaufzug, E aussteigen" };
const SPEC_GCLASS = { name: "Mercedes-Benz G-Klasse", wheels: [[-0.96, -1.52], [0.96, -1.52], [-0.96, 1.48], [0.96, 1.48]], wb: 3.0, track: 1.92, pts: [-1.6, 0, 1.6], R: 1.05, circR: 1.0, enter: 3.8,
  maxN: 22, maxF: 36, acc: 10, steer: 0.58, jump: false, grade: 38, camD: 9.0, camH: 1.4, seat: [0, 1.45, 0.1], bodyH: 2.05, bike: false,
  exits: [[-2.2, -0.2], [2.2, -0.2], [-2.2, 1.3], [2.2, 1.3], [0, -3.8], [0, 3.8]],
  msg: "Mercedes-Benz G-Klasse: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, E aussteigen" };
const SPEC_GEMINI = { name: "Gemini Concept GT", wheels: [[-0.92, -1.5], [0.92, -1.5], [-0.92, 1.5], [0.92, 1.5]], wb: 3.0, track: 1.84, pts: [-1.6, 0, 1.6], R: 1.1, circR: 1.05, enter: 3.8,
  maxN: 35, maxF: 58, acc: 16, steer: 0.7, jump: true, grade: 45, camD: 8.5, camH: 1.2, seat: [0, 1.2, 0.1], bodyH: 1.6, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -3.8], [0, 3.8]],
  msg: "Gemini Concept GT: W/S Gas/Bremse, A/D lenken, Leertaste Sprung (ab 50 km/h), V Kamera, R zurücksetzen, L Autoaufzug, E aussteigen" };
const SPEC_CHATGPT = { name: "ChatGPT GPT-6 Concept GT", wheels: [[-0.94, -1.5], [0.94, -1.5], [-0.94, 1.5], [0.94, 1.5]], wb: 3.0, track: 1.88, pts: [-1.65, 0, 1.65], R: 1.08, circR: 1.02, enter: 3.8,
  maxN: 38, maxF: 62, acc: 17, steer: 0.68, jump: false, grade: 42, camD: 8.8, camH: 1.35, seat: [0, 1.2, 0.05], bodyH: 1.5, bike: false,
  exits: [[-2.0, -0.2], [2.0, -0.2], [-2.0, 1.3], [2.0, 1.3], [0, -3.8], [0, 3.8]],
  msg: "ChatGPT GPT-6 Concept GT: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, E aussteigen" };
const SPEC_DEEPSEEK = { name: "DeepSeek Concept Car", wheels: [[-1.02, -1.6], [1.02, -1.6], [-1.02, 1.7], [1.02, 1.7]], wb: 3.3, track: 2.04, pts: [-1.9, 0, 1.9], R: 1.1, circR: 1.05, enter: 3.8,
  maxN: 38, maxF: 62, acc: 18, steer: 0.68, jump: true, grade: 45, camD: 8.8, camH: 1.2, seat: [0, 1.1, 0.1], bodyH: 1.3, bike: false,
  exits: [[-2.0, -0.2], [2.0, -0.2], [-2.0, 1.3], [2.0, 1.3], [0, -4.0], [0, 4.0]],
  msg: "DeepSeek Concept Car: W/S Gas/Bremse, A/D lenken, Leertaste Sprung (ab 50 km/h), V Kamera, R zurücksetzen, L Autoaufzug, E aussteigen" };
const SPEC_TUMBLER = { name: "Tumbler", wheels: [[-1.0, -1.75], [1.0, -1.75], [-0.95, 1.55], [0.95, 1.55]], wb: 3.3, track: 1.95, pts: [-1.45, 0, 1.45], R: 1.25, circR: 1.15, enter: 3.8,
  maxN: 24, maxF: 38, acc: 14, steer: 0.72, jump: true, grade: 40, camD: 8.5, camH: 1.3, seat: [0, 1.42, 0.2], bodyH: 1.9, bike: false,
  exits: [[-2.2, -0.3], [2.2, -0.3], [-2.4, 1.2], [2.4, 1.2], [0, -3.6], [0, 3.6]],
  msg: "Tumbler: W/S Gas/Bremse, A/D lenken, Leertaste Sprung (ab 50 km/h), V Kamera, R zurücksetzen, L Autoaufzug, E aussteigen" };
const SPEC_ROLLS = { name: "Rolls-Royce", wheels: [[-0.86, -1.78], [0.86, -1.78], [-0.86, 1.78], [0.86, 1.78]], wb: 3.56, track: 1.72, pts: [-1.95, 0, 1.95], R: 1.05, circR: 1.0, enter: 3.8,
  maxN: 30, maxF: 48, acc: 10, steer: 0.62, jump: false, grade: 35, camD: 9.5, camH: 1.2, seat: [-0.45, 1.32, 0.1], bodyH: 1.8, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -4.0], [0, 4.0]],
  msg: "Rolls-Royce: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, E aussteigen" };
const SPEC_BIKE = { name: "Motorrad", wheels: [[0, -0.72], [0, 0.72]], wb: 1.44, track: 0, pts: [-0.55, 0.55], R: 0.42, circR: 0.4, enter: 2.5,
  maxN: 32, maxF: 52, acc: 13, steer: 0.6, jump: false, grade: 45, camD: 5.5, camH: 1.0, seat: [0, 1.42, 0.25], bodyH: 1.7, bike: true,
  exits: [[-1.0, 0], [1.0, 0], [-1.1, 0.6], [1.1, 0.6], [0, -1.8], [0, 1.8]],
  msg: "Motorrad: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, E absteigen" };
const SPEC_BATPOD = { name: "Batpod", wheels: [[0, -1.18], [0, 1.18]], wb: 2.36, track: 0, pts: [-0.95, 0, 0.95], R: 0.5, circR: 0.5, enter: 2.8,
  maxN: 34, maxF: 56, acc: 15, steer: 0.55, jump: true, grade: 45, camD: 6.5, camH: 1.0, seat: [0, 1.25, 0.15], bodyH: 1.4, bike: true,
  exits: [[-1.1, 0], [1.1, 0], [-1.2, 0.8], [1.2, 0.8], [0, -2.5], [0, 2.5]],
  msg: "Batpod: W/S Gas/Bremse, A/D lenken, Leertaste Sprung (ab 50 km/h), V Kamera, R zurücksetzen, L Autoaufzug, E absteigen" };
function addVehicle(spec, built, x, z, y, h, label = spec.name, color = 0x16181b) {
  built.g.userData.dynamic = true; built.g.userData.noLift = true; scene.add(built.g);
  const C = { spec, g: built.g, wheels: built.wheels, jetM: built.jetM || null, flame: built.flame || null, x, z, y, h, v: 0, vy: 0, air: false, wet: false, on: false, view: 0, steer: 0, jet: 0, lean: 0,
    pitch: 0, roll: 0, circ: null, safe: null, safeT: 0, msgT: 0, settled: false, spun: false, home: { x, z, y, h }, idx: VEH.length, label, color };
  C.leave = () => { if (C.on) { C.on = false; C.v = 0; speedEl.hidden = true; engineStop(); } };
  VEH.push(C); return C;
}
{
  const bays = world.userData.bays, gy = GY + HILL;
  CAR = addVehicle(SPEC_TUMBLER, buildTumbler(0x16181b, 0x0d0e10), bays[1].x, bays[1].z, gy, Math.PI, "Tumbler schwarz (Garage Platz 1)", 0x16181b);
  addVehicle(SPEC_GCLASS, buildGClass(0x141a22), bays[2].x, bays[2].z, gy, 0, "Mercedes-Benz G-Klasse (Garage Platz 2)", 0x141a22);   // Nicolas 2026-11-09
  addVehicle(SPEC_NACHTFALKE, buildNachtfalke(), bays[5].x, bays[5].z + bays[5].d / 2 - 2.8, gy, 0, "Nachtfalke (Garage Platz 5)", 0x0f1012);   // Nicolas 2026-11-09, Front zur Fahrgasse
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
  // Concept Cars (Nicolas 2026-11-09) nebeneinander im noerdlichen Ausbau vor den Vitrinen, Front nach Sueden zur Halle
  addVehicle(SPEC_GEMINI, buildGemini(), -45, -21.5, LY, Math.PI, "Gemini Concept GT (Batcave)", 0x161a22);
  addVehicle(SPEC_CHATGPT, buildChatGPT(), -41, -21.5, LY, Math.PI, "ChatGPT GPT-6 Concept GT (Batcave)", 0xd7e0e8);
  addVehicle(SPEC_DEEPSEEK, buildDeepSeek(), -37, -21.5, LY, Math.PI, "DeepSeek Concept Car (Batcave)", 0x0a1628);
  world.userData.vehicles = VEH;
  world.userData.car = { leave: () => VEH.forEach(v => v.leave()) };
}