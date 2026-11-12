// Wayne Manor 3D – Fahrzeuge: Modelle (Tumbler, Rolls-Royce, G-Klasse, Nachtfalke, Motorrad, Batpod, Gemini, ChatGPT GPT-6, DeepSeek), Werte (Aufstellung in der Welt: aufstellung.js)
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
  spin.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.64, r * 0.64, w + 0.02, 24).rotateZ(Math.PI / 2), rimM));   // Felge rund (Nicolas: bei 8 Ecken sah man neben der Felge den Boden)
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

// ---- Boxer-Streetfighter (Nicolas 2026-11-10, Fotos Seite/schraeg; stilisiert, ohne Logos und Schriftzuege): Umriss nach dem Seitenfoto
// (1 px = 1,6 mm, Radstand 1,52 m): hoher flacher Tank in Carbon mit weissen Schraegstreifen, vorne schraeg abfallend, kleine Lampenmaske, flacher Sitz,
// kurzes hohes Heck, Boxermotor mit Zylindern seitlich heraus, zwei Endtoepfe links schraeg nach oben, blaue Gabel, dickes Hinterrad mit blauer
// 5-Speichen-Felge, Vorderrad schwarz. Profil-Koordinaten [f vorne, y hoch], vorne = -z
const SF_K = 1.15;
function buildStreetfighter() {
  const g = new THREE.Group();
  const carbon = M(0x1b1d21, { metalness: 0.5, roughness: 0.35, flatShading: true }), white = M(0xe9ecef, { roughness: 0.45 }), black = M(0x0e0f11, { roughness: 0.7 }), seatM = M(0x09090a, { roughness: 0.95 });
  const eng = M(0x5f646b, { metalness: 0.75, roughness: 0.35, flatShading: true }), blue = M(0x1f6fd8, { metalness: 0.75, roughness: 0.25 }), ti = M(0xb08a4a, { metalness: 0.85, roughness: 0.3 }), steel = M(0xb9bdc2, { metalness: 0.9, roughness: 0.22 });
  const tireM = M(0x111111, { roughness: 0.9 }), WF = 0.76, RF = 0.33, RR = 0.33;   // beide Raeder gleich gross (Nicolas)
  const tube = (p, q, r, m, seg = 10) => { const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), len = d.length(), o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m); o.position.set((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(o); return o; };
  const path = (pts, r, m) => { for (let k = 0; k < pts.length - 1; k++) { tube(pts[k], pts[k + 1], r, m); meshIn(g, new THREE.SphereGeometry(r, 10, 8), m, ...pts[k + 1]); } };
  const chai = (p, n = 2) => { for (let k = 0; k < n; k++) p = p.flatMap((a, i) => { const b = p[(i + 1) % p.length]; return [[a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]]; }); return p; };   // Ecken abrunden (Nicolas: zu eckig)
  const rp = (pts, w, m, b = 0.04) => { const sh = new THREE.Shape(); chai(pts).forEach(([f, y], i) => i ? sh.lineTo(f, y) : sh.moveTo(f, y)); const o = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: w - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.5, bevelSegments: 4 }).rotateY(Math.PI / 2).translate(-(w - 2 * b) / 2, 0, 0), m); g.add(o); return o; };   // Profil rund, Seitenkanten gerundet
  const P = (x, f, y) => [x, y, -f];                                                                                           // Punkt aus (quer, vorne, hoch)
  const tT = tabF([[0.61, 0.67], [0.5, 0.72], [0.42, 0.79], [0.33, 0.88], [0.22, 0.935], [0.1, 0.93], [0, 0.89], [-0.1, 0.82], [-0.22, 0.765]]), tW = tabF([[0.61, 0.08], [0.54, 0.17], [0.4, 0.225], [0.15, 0.235], [-0.1, 0.21], [-0.22, 0.15]]), tB = tabF([[0.61, 0.6], [0.4, 0.69], [-0.22, 0.6]]);   // Bauch steigt nach vorne steil an (Nicolas)   // Masse aus dem Seitenfoto; Oberlinie: Mulde am Sitz, Hoechstpunkt in der Tankmitte, vor dem Lenker schon unten (Nicolas, Skizze)   // Tank rund (Nicolas, Skizze/Foto)
  const tank = loftIn(g, Array.from({ length: 28 }, (_, k) => { const ff = 0.61 - k * 0.03, w = tW(ff), yt = tT(ff), yb = tB(ff), h = yt - yb; return [ff, [[0, yb], [w * 0.8, yb], [w, yb + 0.25 * h], [w, yb + 0.58 * h], [w * 0.88, yb + 0.84 * h], [w * 0.55, yt - 0.01], [0, yt]]]; }), carbon);
  { const rc = new THREE.Raycaster(), q = [], hit = (o, d, e) => { rc.set(o, d); const h = rc.intersectObject(tank)[0]; return h ? [h.point.x - d.x * e, h.point.y - d.y * e, h.point.z - d.z * e] : null; };   // weisse Streifen liegen auf der Woelbung
    const quad = (a, b, c, d) => { if (a && b && c && d) q.push(...a, ...b, ...c, ...a, ...c, ...d); };
    for (let k = 0; k < 7; k++) { const f0 = -0.1 + k * 0.09, N = 8;
      for (const sd of [-1, 1]) { const S = (t, u) => { const ff = f0 + u * 0.045 + t * 0.17, y = tT(f0) - 0.035 - t * (tT(f0) - tB(f0 + t * 0.17) - 0.06); return hit(new THREE.Vector3(sd, y, -ff), new THREE.Vector3(-sd, 0, 0), 0.004); };   // Seite: schraeg nach vorne unten
        for (let n = 0; n < N; n++) { const a = S(n / N, 0), b = S(n / N, 1), c = S((n + 1) / N, 1), d = S((n + 1) / N, 0); sd > 0 ? quad(a, d, c, b) : quad(a, b, c, d); } }
      const T = (t, u) => { const ff = f0 + u * 0.045, x = (t * 2 - 1) * tW(ff) * 0.86; return hit(new THREE.Vector3(x, 2, -ff), new THREE.Vector3(0, -1, 0), 0.004); };   // oben quer ueber den Tank
      for (let n = 0; n < N; n++) quad(T(n / N, 0), T((n + 1) / N, 0), T((n + 1) / N, 1), T(n / N, 1)); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(q, 3)); geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, M(0xe9ecef, { roughness: 0.45, side: THREE.DoubleSide }))); }
  rp([[0.3, 0.55], [0.5, 0.56], [0.56, 0.66], [0.34, 0.66]], 0.42, white, 0.04);                                            // weisse Seitenteile vorne unter dem Tank
  rp([[0.55, 0.69], [0.74, 0.71], [0.71, 0.78], [0.57, 0.84], [0.5, 0.82]], 0.22, carbon, 0.04);                             // Lampenmaske
  boxIn(g, -0.06, 0.06, 0.72, 0.755, -0.747, -0.74, mat.glow);                                                                 // Scheinwerfer (Schlitz)
  rp([[-0.18, 0.765], [-0.26, 0.74], [-0.34, 0.755], [-0.39, 0.8], [-0.37, 0.77], [-0.26, 0.71], [-0.18, 0.725]], 0.27, seatM, 0.035);   // Sitz: tief vorne, nach hinten schraeg hoch (Nicolas)                        // Sitz flach
  rp([[-0.2, 0.62], [-0.36, 0.58], [-0.5, 0.66], [-0.6, 0.77], [-0.6, 0.83], [-0.42, 0.855], [-0.37, 0.8], [-0.25, 0.75], [-0.2, 0.77]], 0.22, carbon, 0.05);   // Heck steigt nach hinten an                          // kurzes hohes Heck
  boxIn(g, -0.05, 0.05, 0.79, 0.815, 0.63, 0.637, mat.glowRed);                                                              // Ruecklicht
  rp([[-0.32, 0.22], [0.0, 0.19], [0.1, 0.24], [0.2, 0.36], [0.3, 0.52], [0.38, 0.64], [0.4, 0.7], [0.3, 0.7], [-0.2, 0.6], [-0.38, 0.54], [-0.34, 0.32]], 0.36, eng, 0.05);   // vorne im Bogen weggeschnitten, Vorderrad frei (Nicolas)   // Kasten (Motor, Seitenteile) genau im Umriss des Fotos (Nicolas): vorne senkrecht, unten flach, hinten schraeg hoch
  rp([[-0.22, 0.38], [0.06, 0.36], [0.16, 0.6], [-0.24, 0.6]], 0.39, black, 0.03);                                       // schwarze Seitenteile (Luftfilter)
  for (const sd of [-1, 1]) {
    meshIn(g, new THREE.CylinderGeometry(0.1, 0.11, 0.07, 16).rotateZ(Math.PI / 2), eng, sd * 0.2, 0.45, -0.22);            // Boxer-Zylinder, nur knapp seitlich (Nicolas: von oben nichts breit)
    boxAt(g, 0.04, 0.19, 0.24, black, sd * 0.25, 0.46, -0.23);      // Zylinderkopf, Deckel
    for (let k = 0; k < 4; k++) boxAt(g, 0.004, 0.012, 0.12, eng, sd * 0.202, 0.45 + k * 0.035, 0.03);                        // Gitter am Seitenteil
    tube(P(sd * 0.2, 0.42, 0.93), P(sd * 0.2, 0.564, 0.55), 0.03, blue); tube(P(sd * 0.2, 0.564, 0.55), P(sd * 0.2, 0.66, 0.33), 0.024, black);   // Gabel blau, unten schwarz
    meshIn(g, new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), blue, sd * 0.2, 0.95, -0.42);                                  // Gabelkappe
    tube(P(sd * 0.2, 0.44, 0.87), P(sd * 0.32, 0.41, 0.865), 0.021, black); tube(P(sd * 0.3, 0.415, 0.865), P(sd * 0.45, 0.39, 0.86), 0.03, seatM, 12); tube(P(sd * 0.3, 0.44, 0.875), P(sd * 0.43, 0.47, 0.87), 0.007, steel);   // Lenkerstummel, Griffe (14 cm, Nicolas: groesser), Hebel   // Lenkerstummel, Griff
  }
  meshIn(g, new THREE.BoxGeometry(0.48, 0.05, 0.12), black, 0, 0.91, -0.43);                                                   // obere Gabelbruecke
  path([P(-0.24, 0.15, 0.45), P(-0.2, 0.27, 0.3), P(-0.17, 0.24, 0.22), P(-0.16, 0.06, 0.2), P(-0.16, -0.17, 0.21), P(-0.17, -0.3, 0.27), P(-0.18, -0.32, 0.48), P(-0.19, -0.34, 0.6)], 0.032, ti);   // Auspuff nur links (Nicolas, Foto): vom Zylinderkopf nach vorne unten, unter dem Motor nach hinten, vor dem Hinterrad hoch
  tube(P(-0.19, -0.34, 0.6), P(-0.195, -0.37, 0.63), 0.04, ti); tube(P(-0.195, -0.37, 0.63), P(-0.195, -0.57, 0.78), 0.058, steel, 16); tube(P(-0.195, -0.57, 0.78), P(-0.195, -0.59, 0.795), 0.05, black, 16);   // ein Endtopf knapp unter und neben dem Sattel (Nicolas)
  tube(P(0.17, -0.1, 0.36), P(0.17, -WF, RR), 0.055, black); tube(P(0.17, -0.1, 0.36), P(0.1, 0.1, 0.4), 0.04, black);         // Einarm-Schwinge rechts
  { const X = -0.2, N = [[-0.08, 0.52], [-0.08, 0.36], [-0.24, 0.49], [-0.24, 0.35], [-0.38, 0.45], [-0.38, 0.33], [-0.54, 0.41], [-0.54, 0.31]], Q = ([f, y]) => P(X, f, y);   // flache Fachwerk-Strebe links vom Motor zur Hinterachse (Nicolas, Foto)
    for (const [u, v] of [[0, 2], [2, 4], [4, 6], [1, 3], [3, 5], [5, 7], [0, 1], [6, 7], [1, 2], [3, 4], [5, 6]]) tube(Q(N[u]), Q(N[v]), 0.016, black, 6);
    tube(Q(N[6]), P(X, -WF, RR + 0.04), 0.02, black, 6); tube(Q(N[7]), P(X, -WF, RR - 0.03), 0.02, black, 6);   // zur Achse
    boxAt(g, 0.03, 0.09, 0.12, steel, X - 0.01, 0.42, 0.62); meshIn(g, new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8).rotateZ(Math.PI / 2), steel, X - 0.06, 0.43, 0.5); meshIn(g, new THREE.SphereGeometry(0.022, 8, 6), M(0xd0202a, { roughness: 0.4 }), X - 0.02, 0.36, 0.6); }   // Bremssattel-Halter, Fussraste, rote Schraube
  tube(P(0, 0.43, 0.8), P(0, 0.36, 0.56), 0.04, black); tube(P(0, -0.2, 0.7), P(0, -0.1, 0.4), 0.035, black);               // Rahmen
  mergeStatic(g); for (const o of g.children) o.scale.x = 0.82;                                                             // etwas duenner (Nicolas)
  const wheels = [addWheel(g, 0, -0.66, RF, 0.26, true, tireM, black, 0, 28), addWheel(g, 0, WF, RR, 0.26, false, tireM, black, 0, 28)];
  const discM = M(0xa9adb3, { metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide });
  for (const [w, rimC, wd, discs] of [[wheels[0], black, 0.26, [-1, 1]], [wheels[1], blue, 0.26, [-1]]]) { w.spin.remove(w.spin.children[1]); const r = w.r;   // Felgen offen (Nicolas: man sieht durch): keine volle Scheibe
    w.spin.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, wd - 0.02, 32, 1, true).rotateZ(Math.PI / 2), M(rimC.color.getHex(), { metalness: 0.75, roughness: 0.3, side: THREE.DoubleSide })));   // Felgenbett
    for (const sx of discs) { const d = new THREE.Mesh(new THREE.RingGeometry(r * 0.22, r * (discs.length > 1 ? 0.5 : 0.42), 28).rotateY(Math.PI / 2), discM); d.position.x = sx * 0.06; w.spin.add(d); }   // Bremsscheibe als Ring
    for (const sx of [-1, 1]) {                // je Seite: 5 Speichen, Ring, Nabe
    const F = new THREE.Group(); F.position.x = sx * (wd / 2 + 0.006); w.spin.add(F);
    F.add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.6, 0.02, 6, 32).rotateY(Math.PI / 2), rimC));
    for (let k = 0; k < 5; k++) { const sp = new THREE.Group(); sp.rotation.x = k / 5 * Math.PI * 2; sp.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, r * 0.52, 0.045).translate(sx * 0.01, r * 0.33, 0), rimC)); F.add(sp); }
    F.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16).rotateZ(Math.PI / 2), rimC)); } }
  for (const w of wheels) w.spin.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.32, 10).rotateZ(Math.PI / 2), black));   // Achse
  g.scale.setScalar(SF_K);                                                                                                   // alles 15 % groesser (Nicolas: neben dem Spectre zu klein)
  return { g, wheels };
}
// Quader quer zur Fahrtrichtung zwischen zwei x-Werten in beliebiger Reihenfolge (fuer Teile mit sd * ..., sonst negative Breite = unsichtbar)
const sideBox = (g, xa, xb, y0, y1, z0, z1, m) => boxIn(g, Math.min(xa, xb), Math.max(xa, xb), y0, y1, z0, z1, m);
// Quader aus Mittelpunkt und Groesse (x quer, y hoch, z hinten), optional um die Querachse geneigt
const boxAt = (g, sx, sy, sz, m, x, y, z, rx = 0) => meshIn(g, new THREE.BoxGeometry(sx, sy, sz), m, x, y, z, rx);
// ---- Mercedes-Benz G-Klasse (Nicolas 2026-11-09, nach Seiten- und Frontfoto; stilisiert, ohne Stern): Kastenaufbau, hohe gerade Haube (Gurtlinie
// 1,22 m), drei Seitenfenster mit Saeulen, Tuerfugen, Zierleiste, aufgesetzte schwarze Kotfluegelverbreiterungen, runde Scheinwerfer mit Chromring,
// Blinker oben auf den Kotfluegeln, Grill mit senkrechten Streben, Trittbretter, Reserverad mit Chromdeckel. 4,66 x 1,86 x 2,0 m, Raeder r 0,43
function buildGClass(col = 0x17191c) {
  const g = new THREE.Group();
  const paint = M(col, { metalness: 0.55, roughness: 0.3, flatShading: true }), dark = M(0x0e0f11, { roughness: 0.75, flatShading: true }), trim = M(0x1b1d20, { roughness: 0.7, flatShading: true });
  const chrome = M(0xd5d8dc, { metalness: 0.9, roughness: 0.2 }), glass = M(0x0b1018, { metalness: 0.6, roughness: 0.1 }), amber = M(0xf0b060, { roughness: 0.4, emissive: 0x3a2000 });
  const tireM = M(0x111111, { roughness: 0.95 }), rimM = M(0xb6bac0, { metalness: 0.85, roughness: 0.22 }), R = 0.43;
  const arch = c => [[c - R - 0.13, 0.47], [c - R - 0.1, R + 0.2], [c - R * 0.6, 2 * R + 0.07], [c + R * 0.6, 2 * R + 0.07], [c + R + 0.1, R + 0.2], [c + R + 0.13, 0.47]];   // Radlauf (Profil nach vorne)
  boxIn(g, -0.78, 0.78, 0.45, 1.22, -2.3, 2.3, paint);                                                                    // Rumpf (innen)
  prismIn(g, [[0.9, 1.2], [0.9, 1.3], [0.6, 1.98], [-2.14, 1.98], [-2.26, 1.6], [-2.3, 1.3], [-2.3, 1.2]], 1.86, paint);                             // Kastenaufbau, Frontscheibe schraeg, Heck oben leicht eingezogen (Nicolas: weniger eckig)
  prismIn(g, [[2.27, 1.2], [2.27, 1.23], [0.9, 1.3], [0.9, 1.2]], 1.52, paint);                                           // Haube, steigt zur Scheibe leicht an
  for (const sd of [-1, 1]) {
    prismIn(g, [[2.3, 0.47], [2.3, 1.22], [-2.3, 1.22], [-2.3, 0.47], ...arch(-1.45), ...arch(1.45)], 0.15, paint, sd * 0.855);   // Seitenwand mit Radlaeufen
    for (const c of [-1.45, 1.45]) prismIn(g, [[c + R + 0.24, 0.52], [c + R + 0.2, R + 0.24], [c + R * 0.62, 2 * R + 0.16], [c - R * 0.62, 2 * R + 0.16], [c - R - 0.2, R + 0.24], [c - R - 0.24, 0.52],
      [c - R - 0.14, 0.52], [c - R - 0.1, R + 0.2], [c - R * 0.6, 2 * R + 0.07], [c + R * 0.6, 2 * R + 0.07], [c + R + 0.1, R + 0.2], [c + R + 0.14, 0.52]], 0.16, trim, sd * 0.99);   // Kotfluegelverbreiterung
    sideBox(g, sd * 0.76, sd * 0.93, 1.12, 1.23, -2.3, -0.9, paint);                                                     // Kotfluegel vorne (Kante)
    for (const [z0, z1] of [[-0.78, 0.12], [0.3, 1.18], [1.36, 2.16]]) prismIn(g, z0 < 0 ? [[0.62, 1.9], [0.84, 1.34], [-0.12, 1.34], [-0.12, 1.9]] : [[-z0, 1.9], [-z0, 1.34], [-z1, 1.34], [-z1 + (z1 > 2 ? 0.1 : 0), 1.9]], 0.02, glass, sd * 0.935);   // drei Seitenfenster (vorne schraeg)
    for (const z of [0.2, 1.26]) sideBox(g, sd * 0.93, sd * 0.935, 0.52, 1.96, z, z + 0.02, dark); sideBox(g, sd * 0.93, sd * 0.935, 0.52, 1.3, -0.88, -0.86, dark);               // Tuerfugen
    sideBox(g, sd * 0.93, sd * 0.945, 1.06, 1.09, -2.25, 2.28, chrome);                                                  // Zierleiste
    for (const z of [0.0, 1.06]) sideBox(g, sd * 0.93, sd * 0.955, 1.15, 1.19, z, z + 0.15, chrome);                    // Tuergriffe
    sideBox(g, sd * 0.93, sd * 1.13, 1.42, 1.56, -0.86, -0.74, paint);                                                  // Spiegel
    sideBox(g, sd * 0.88, sd * 1.06, 0.37, 0.43, -0.85, 0.95, dark);                                                    // Trittbrett
    sideBox(g, sd * 0.86, sd * 0.95, 1.98, 2.03, -0.6, 2.15, chrome);                                                    // Dachrinne
    meshIn(g, new THREE.CylinderGeometry(0.15, 0.15, 0.05, 20), mat.glow, sd * 0.64, 0.97, -2.33, Math.PI / 2);         // runde Scheinwerfer
    meshIn(g, new THREE.TorusGeometry(0.16, 0.025, 8, 24), chrome, sd * 0.64, 0.97, -2.355);
    sideBox(g, sd * 0.8, sd * 0.9, 1.23, 1.29, -2.26, -2.12, amber);                                                     // Blinker oben auf dem Kotfluegel
    sideBox(g, sd * 0.7, sd * 0.86, 0.82, 1.18, 2.3, 2.33, mat.glowRed);                                                // Rueckleuchten (hochkant)
  }
  prismIn(g, [[0.93, 1.31], [0.88, 1.31], [0.6, 1.93], [0.65, 1.93]], 1.6, glass); prismIn(g, [[-2.3, 1.36], [-2.33, 1.36], [-2.18, 1.88], [-2.15, 1.88]], 1.24, glass);              // Front-, Heckscheibe
  boxIn(g, -0.94, 0.94, 1.98, 2.02, -0.62, 2.16, dark);                                                                   // Dach
  boxIn(g, -0.44, 0.44, 0.7, 1.13, -2.33, -2.3, dark); for (let x = -0.36; x <= 0.37; x += 0.12) boxIn(g, x - 0.018, x + 0.018, 0.73, 1.1, -2.345, -2.33, chrome);   // Grill mit Streben
  meshIn(g, new THREE.CylinderGeometry(0.11, 0.11, 0.03, 18), chrome, 0, 0.92, -2.36, Math.PI / 2);                      // rundes Emblem
  boxIn(g, -1.0, 1.0, 0.43, 0.68, -2.46, -2.28, dark); boxIn(g, -0.45, 0.45, 0.45, 0.53, -2.48, -2.4, chrome);             // Stossfaenger vorne, Unterfahrschutz
  boxIn(g, -1.0, 1.0, 0.43, 0.66, 2.28, 2.44, dark);                                                                      // Stossfaenger hinten
  meshIn(g, new THREE.TorusGeometry(0.37, 0.12, 10, 28), tireM, 0, 1.3, 2.46); meshIn(g, new THREE.CylinderGeometry(0.38, 0.38, 0.14, 28), chrome, 0, 1.3, 2.48, Math.PI / 2);   // Reserverad mit Chromdeckel
  boxIn(g, -0.86, 0.86, 0.28, 0.45, -1.9, 1.9, dark);                                                                     // Unterboden
  mergeStatic(g);
  const wheels = [[-0.94, -1.45, true], [0.94, -1.45, true], [-0.94, 1.45, false], [0.94, 1.45, false]].map(([x, z, f]) => addWheel(g, x, z, R, 0.3, f, tireM, rimM, 0, 24));
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
  maxN: 34, maxF: 44.4, acc: 15, steer: 0.66, jump: false, boost: true, grade: 38, camD: 8.5, camH: 1.1, seat: [-0.4, 1.15, 0.15], bodyH: 1.4, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -3.8], [0, 3.8]],
  msg: "Nachtfalke: W/S Gas/Bremse, A/D lenken, Leertaste halten = Nitro, V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen" };
// ---- Aventador LP 700-4 Coupe (Nicolas 2026-11-09, stilisiert, ohne Logos; Masse und Linien nach Seiten- und Draufsicht): Karosserie als Loft
// aus Querschnitten (von oben spitz zulaufende Nase, breite Hueften, eckige Radlaeufe), Glaskanzel mit langer, flacher Frontscheibe, Dach,
// Motorabdeckung mit Lamellen, Y-Scheinwerfer, Seiten- und Schulterhutzen, Y-Rueckleuchten, Gitter mit sechseckigem Endrohr, Diffusor.
// 4,78 x 2,03 x 1,14 m, Radstand 2,70 m. f = vorne (Profil), z = -f
function buildAventador(col = 0xe07012) {
  const g = new THREE.Group();
  const paint = M(col, { metalness: 0.5, roughness: 0.28, flatShading: true }), dark = M(0x0b0c0e, { roughness: 0.6, flatShading: true }), glass = M(0x070a0f, { metalness: 0.7, roughness: 0.06, flatShading: true });
  const chrome = M(0x9ea3a8, { metalness: 0.9, roughness: 0.25 }), tireM = M(0x101010, { roughness: 0.92 }), rimM = M(0x1d1e21, { metalness: 0.8, roughness: 0.3 });
  const tab = T => f => { if (f >= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (f >= T[i][0]) { const [f0, a] = T[i - 1], [f1, b] = T[i]; return a + (b - a) * (f0 - f) / (f0 - f1); } return T[T.length - 1][1]; };
  // Loft: Stationen [f, Halbschnitt von unten-Mitte ueber die Seite bis oben-Mitte], gespiegelt; Enden geschlossen
  const loft = (st, m) => { const pos = [], ring = ([f, h]) => [...h, ...h.slice().reverse().map(([x, y]) => [-x, y])].map(([x, y]) => [x, y, -f]);
    const R = st.map(ring), n = R[0].length, tri = (a, b, c) => pos.push(...a, ...c, ...b);   // Reihenfolge so, dass die Flaechen nach aussen zeigen (vorher sah man hinein)
    for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < n; j++) { const a = R[i][j], b = R[i][(j + 1) % n], c = R[i + 1][(j + 1) % n], d = R[i + 1][j]; tri(a, d, c); tri(a, c, b); }
    for (const [k, s] of [[0, 1], [R.length - 1, -1]]) { const r = R[k], c = r.reduce((q, p) => [q[0] + p[0] / n, q[1] + p[1] / n, q[2] + p[2] / n], [0, 0, 0]); for (let j = 0; j < n; j++) s > 0 ? tri(c, r[j], r[(j + 1) % n]) : tri(c, r[(j + 1) % n], r[j]); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, m)); };
  const W = [[1.35, 0.34], [-1.35, 0.36]], arch = f => { let y = 0.14; for (const [c, r] of W) { const R = r + 0.12, d = Math.abs(f - c); if (d < R + 0.06) y = Math.max(y, 0.14 + (2 * r + 0.06 - 0.14) * Math.min(1, (R + 0.06 - d) / 0.2)); } return y; };   // eckige Radlaeufe
  const hwS = tab([[2.39, 0.68], [2.2, 0.8], [1.8, 0.93], [1.35, 0.99], [0.9, 0.96], [0.2, 0.95], [-0.6, 0.99], [-1.35, 1.02], [-2.0, 1.0], [-2.39, 0.95]]);
  const yTc = tab([[2.39, 0.36], [2.2, 0.5], [1.8, 0.6], [1.14, 0.79], [0.95, 0.84], [-2.39, 0.86]]);
  const body = []; for (let f = 2.39; f > -2.4; f -= 0.08) { const ff = Math.max(-2.39, f), yb = ff > 2.25 ? 0.18 : arch(ff), hs = hwS(ff), yt = yTc(ff), ye = yt - 0.025, ys = Math.max(yb + 0.04, Math.min(ye - 0.1, 0.6));
    body.push([ff, [[0, yb], [hs - 0.1, yb], [hs, ys], [hs - 0.13, ye], [0, yt]]]); }
  loft(body, paint);                                                                                                         // Karosserie
  const gh = [[1.16, 0.79, 0.78], [0.8, 0.92, 0.8], [0.4, 1.04, 0.8], [0.09, 1.13, 0.79], [-0.26, 1.15, 0.78], [-0.58, 1.12, 0.74], [-0.95, 0.96, 0.62]];
  loft(gh.map(([f, yt, hb]) => [f, [[0, 0.8], [hb, 0.8], [hb - 0.22, yt - 0.03], [0, yt]]]), glass);                       // Glaskanzel (Front- und Seitenscheiben)
  loft([[0.06, 1.135, 0.56], [-0.26, 1.162, 0.58], [-0.62, 1.128, 0.55]].map(([f, yt, hw]) => [f, [[0, yt - 0.05], [hw, yt - 0.05], [hw - 0.04, yt], [0, yt + 0.008]]]), paint);   // Dach
  loft([[-0.5, 1.13], [-1.2, 1.03], [-1.9, 0.94], [-2.3, 0.9]].map(([f, yt]) => [f, [[0, 0.84], [0.62, 0.84], [0.5, yt], [0, yt + 0.01]]]), paint);   // Motorabdeckung
  for (let k = 0; k < 6; k++) { const z = 0.8 + k * 0.24, y = 1.13 - (z - 0.5) * 0.135 + 0.02; boxAt(g, 0.8, 0.03, 0.06, dark, 0, y, z, 0.135); }   // Lamellen
  for (const sd of [-1, 1]) {
    prismIn(g, [[-0.32, 0.34], [-0.86, 0.6], [-1.0, 0.6], [-1.0, 0.3]], 0.05, dark, sd * (hwS(-0.7) - 0.005));             // Seitenhutze vor dem Hinterrad
    sideBox(g, sd * 0.68, sd * 0.86, 0.86, 0.92, 0.62, 1.05, dark);                                                       // Schulterhutze
    sideBox(g, sd * 0.78, sd * 1.0, 0.9, 0.98, -0.82, -0.68, paint);                                                      // Spiegel
    boxAt(g, 0.36, 0.03, 0.3, dark, sd * 0.6, 0.535, -2.02, -0.245);                                                      // Scheinwerfergehaeuse (flach in der Haube)
    const y1 = boxAt(g, 0.34, 0.012, 0.035, mat.glow, sd * 0.6, 0.553, -2.06, -0.245); y1.rotation.y = -sd * 0.25;       // Y-Scheinwerfer
    const y2 = boxAt(g, 0.035, 0.012, 0.18, mat.glow, sd * 0.52, 0.56, -1.98, -0.245); y2.rotation.y = sd * 0.5;
    boxIn(g, sd > 0 ? 0.28 : -0.55, sd > 0 ? 0.55 : -0.28, 0.18, 0.3, -2.37, -2.2, dark);                                 // Lufteinlass vorne
    const r1 = boxAt(g, 0.46, 0.04, 0.03, mat.glowRed, sd * 0.6, 0.76, 2.4); r1.rotation.z = -sd * 0.12;                 // Y-Rueckleuchten
    const r2 = boxAt(g, 0.22, 0.04, 0.03, mat.glowRed, sd * 0.78, 0.66, 2.4); r2.rotation.z = sd * 0.8;
    for (let k = 0; k < 3; k++) boxAt(g, 0.03, 0.14, 0.4, dark, sd * (0.22 + k * 0.17), 0.26, 2.22);                    // Diffusor-Rippen
  }
  boxIn(g, -0.26, 0.26, 0.17, 0.26, -2.38, -2.25, dark);                                                                 // Frontsplitter Mitte
  boxIn(g, -0.86, 0.86, 0.3, 0.7, 2.37, 2.41, dark);                                                                     // Gitter hinten
  meshIn(g, new THREE.CylinderGeometry(0.14, 0.14, 0.12, 6), chrome, 0, 0.44, 2.44, Math.PI / 2); meshIn(g, new THREE.CylinderGeometry(0.1, 0.1, 0.13, 6), dark, 0, 0.44, 2.445, Math.PI / 2);   // Endrohr (sechseckig)
  boxAt(g, 1.0, 0.03, 0.22, dark, 0, 0.9, 2.16);                                                                         // Heckspoiler (flach)
  mergeStatic(g);
  const wheels = [[-0.84, -1.35, true, 0.34, 0.26], [0.84, -1.35, true, 0.34, 0.26], [-0.87, 1.35, false, 0.36, 0.34], [0.87, 1.35, false, 0.36, 0.34]].map(([x, z, f, r, w]) => addWheel(g, x, z, r, w, f, tireM, rimM, 0, 28));
  return { g, wheels };
}
const SPEC_AVENTADOR = { name: "Aventador LP 700-4", wheels: [[-0.84, -1.35], [0.84, -1.35], [-0.87, 1.35], [0.87, 1.35]], wb: 2.7, track: 1.7, pts: [-1.6, 0, 1.6], R: 1.0, circR: 0.95, enter: 3.8,
  maxN: 40, maxF: 61.1, acc: 12, steer: 0.68, jump: false, grade: 35, camD: 8.0, camH: 1.0, seat: [-0.38, 0.95, 0.2], bodyH: 1.15, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -3.8], [0, 3.8]],
  msg: "Aventador LP 700-4: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen" };
// ---- Limousinen-Bausatz (Nicolas 2026-11-11: Polizeiauto und Taxi realistischer wie der Spectre, Grundform bleibt): Karosserie als Loft aus
// Querschnitten alle 6 cm (von oben gerundete Ecken, Gurtlinie, Charakterlinie, runde Radlaeufe), Kabine als zweiter Loft (Saeulen in Wagenfarbe,
// Scheiben eingesetzt bzw. auf der Flaeche), Teile vorne/hinten folgen der Rundung (face), Aufkleber/Fenster/Fugen liegen auf der Flaeche (skin),
// Radhaeuser geschlossen (Regel Radhaus). o: f vorne/hinten (fF, fR), Radstellen wf, Radius r, Tabellen hw/yT/yb/roof, Scheibenfuss fw/fr.
function sedanKit(o, paint, glass, dark) {
  const g = new THREE.Group(), hw = tabF(o.hw), yT = tabF(o.yT), ybT = tabF(o.yb), roof = tabF(o.roof), R = o.r, ARCH = 2 * R + 0.08;
  const arch = f => { let y = ybT(f); for (const c of o.wf) { const d = Math.abs(f - c), RR = R + 0.16; if (d < RR) y = Math.max(y, ybT(f) + (ARCH - ybT(f)) * Math.sqrt(1 - (d / RR) ** 2)); } return y; };
  const sec = f => { const hs = hw(f), yb = arch(f), ye = yT(f), p = [[0, yb], [hs - 0.08, yb], [hs - 0.01, yb + 0.07], [hs, o.ys || 0.6], [hs - 0.03, ye - 0.06], [hs - 0.1, ye], [0, ye + 0.03]];
    for (let i = 2; i < p.length; i++) p[i][1] = Math.max(p[i][1], p[i - 1][1] + 0.015); return p; };
  const smooth = m => { const gg = mergeVertices(m.geometry.deleteAttribute("normal")); gg.computeVertexNormals(); m.geometry = gg; return m; };
  const FS = []; for (let f = o.fF; f > o.fR; f -= 0.06) FS.push(f); FS.push(o.fR);
  smooth(loftIn(g, FS.map(f => [f, sec(f)]), paint));                                                                          // Karosserie
  const bodyX = (f, y) => { const p = sec(f); if (y <= p[1][1]) return y < p[0][1] ? -1 : p[1][0]; for (let i = 1; i < p.length - 1; i++) { const [xa, ya] = p[i], [xb, yb] = p[i + 1]; if (y <= yb) return xa + (xb - xa) * (y - ya) / Math.max(1e-6, yb - ya); } return 0; };
  const endF = (x, y, s) => { for (let k = 0; k < 160; k++) { const f = s > 0 ? o.fF - k * 0.005 : o.fR + k * 0.005; if (bodyX(f, y) >= Math.abs(x)) return f; } return s > 0 ? o.fF - 0.8 : o.fR + 0.8; };
  // Teil vorne (s 1) oder hinten (s -1) auf der Rundung, in 2-cm-Stuecken: steht d vor, 3 cm in der Karosserie
  const face = (s, xa, xb, y0, y1, d, m) => { const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb); for (let x = x0; x < x1 - 1e-6; x += 0.02) { const xm = Math.min(x1, x + 0.02), ym = (y0 + y1) / 2,
    fz = s > 0 ? Math.max(endF(x, ym, 1), endF(xm, ym, 1)) : Math.min(endF(x, ym, -1), endF(xm, ym, -1)); s > 0 ? boxIn(g, x, xm, y0, y1, -fz - d, -fz + 0.03, m) : boxIn(g, x, xm, y0, y1, -fz - 0.03, -fz + d, m); } };
  // Haut auf einer Seitenflaeche: f von fa bis fb, y von lo(f) bis hi(f), x = xf(f, y) + off; UV u laeuft lesbar (rechts = vorne bzw. hinten)
  const skin = (sd, fa, fb, lo, hi, xf, m, off = 0.006, nf = 24, ny = 6) => { const f0 = Math.min(fa, fb), f1 = Math.max(fa, fb), q = [], uv = [], L = typeof lo === "function" ? lo : () => lo, H = typeof hi === "function" ? hi : () => hi, yA = L(f0), yZ = H(f0);
    const P = (f, y) => [sd * (xf(f, y) + off), y, -f], U = f => sd > 0 ? (f - f0) / (f1 - f0) : (f1 - f) / (f1 - f0);
    for (let i = 0; i < nf; i++) { const fa_ = f0 + (f1 - f0) * i / nf, fb_ = f0 + (f1 - f0) * (i + 1) / nf;
      for (let j = 0; j < ny; j++) { const Y = (f, k) => { const l = L(f), h = H(f); return l + (h - l) * k / ny; }, la = L(fa_), ha = H(fa_), lb = L(fb_), hb = H(fb_); if (ha - la < 0.01 || hb - lb < 0.01) continue;
        if (o.clip !== false && xf === bodyX && (Y(fa_, j) < arch(fa_) + 0.01 || Y(fb_, j) < arch(fb_) + 0.01)) continue;
        const a = P(fa_, Y(fa_, j)), b = P(fb_, Y(fb_, j)), c = P(fb_, Y(fb_, j + 1)), d = P(fa_, Y(fa_, j + 1)), va = (Y(fa_, j) - L(fa_)) / (H(fa_) - L(fa_)), vb = (Y(fa_, j + 1) - L(fa_)) / (H(fa_) - L(fa_)),
          vc = (Y(fb_, j) - L(fb_)) / (H(fb_) - L(fb_)), vd = (Y(fb_, j + 1) - L(fb_)) / (H(fb_) - L(fb_)), ua = U(fa_), ub = U(fb_);
        if (sd > 0) { q.push(...a, ...b, ...c, ...a, ...c, ...d); uv.push(ua, va, ub, vc, ub, vd, ua, va, ub, vd, ua, vb); } else { q.push(...a, ...c, ...b, ...a, ...d, ...c); uv.push(ua, va, ub, vd, ub, vc, ua, va, ua, vb, ub, vd); } } }
    if (!q.length) return null; const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(q, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals(); const me = new THREE.Mesh(geo, m); g.add(me); return me; };
  // Kabine: von der Frontscheibe (fw) bis zur Heckscheibe (fr), oben schmaler (Dachkante hw - 0,36), Seiten leicht eingezogen
  const gy0 = f => yT(f) - 0.02, gy1 = f => Math.max(roof(f) - 0.025, yT(f)), hb = f => hw(f) - 0.09, ht = f => hw(f) - 0.36;
  const glassX = (f, y) => hb(f) + (ht(f) - hb(f)) * Math.min(1, Math.max(0, (y - gy0(f)) / Math.max(0.01, gy1(f) - gy0(f))));
  const GS = []; for (let f = o.fw; f > o.fr; f -= 0.05) GS.push(f); GS.push(o.fr);
  smooth(loftIn(g, GS.map(f => [f, [[0, gy0(f)], [hb(f), gy0(f)], [ht(f), gy1(f)], [0, roof(f)]]]), paint));                  // Kabine in Wagenfarbe (Saeulen, Dach)
  const pane = (fa, fb) => { const S = []; for (let f = fa; f > fb; f -= 0.04) S.push(f); S.push(fb); loftIn(g, S.map(f => [f, [[0, gy0(f) + 0.024], [hb(f) - 0.1, gy0(f) + 0.024], [ht(f) - 0.08, Math.max(gy1(f) + 0.008, gy0(f) + 0.04)], [0, Math.max(roof(f) + 0.008, gy0(f) + 0.05)]]]), glass); };
  let pa = o.fw - 0.02, pb = o.fr + 0.02; while (roof(pa) - yT(pa) < 0.06) pa -= 0.01; while (roof(pb) - yT(pb) < 0.06) pb += 0.01; pane(pa, o.ws); pane(o.rs, pb);                                                                           // Front- und Heckscheibe mit Rahmen
  const sideGlass = glass.clone(); sideGlass.polygonOffset = true; sideGlass.polygonOffsetFactor = -3; sideGlass.polygonOffsetUnits = -3;
  const tall = f => roof(f) - yT(f) > 0.22;   // Fenster nur, wo die Kabine hoch genug ist (sonst knickt die Flaeche an der Scheibenwurzel)
  for (const [fa0, fb0] of o.win) { let fa = fa0, fb = fb0; while (fa > fb && !tall(fa)) fa -= 0.01; while (fb < fa && !tall(fb)) fb += 0.01;
    for (const sd of [-1, 1]) skin(sd, fa, fb, f => yT(f) + 0.04, f => roof(f) - 0.065, glassX, sideGlass, 0.01, 40, 3); }   // Seitenfenster
  // Radhaeuser: dunkle Wand hinter jedem Rad ueber den ganzen Radlauf (Regel Radhaus), Schale innen
  const wellM = M(0x0c0d0f, { roughness: 0.9, side: THREE.DoubleSide }), wx = o.track / 2 - o.tw / 2 - 0.01;
  for (const f of o.wf) { boxIn(g, -wx, wx, ybT(f), ARCH, -f - R - 0.16, -f + R + 0.16, wellM);
    const xo = hw(f) - 0.04; for (const sd of [-1, 1]) meshIn(g, new THREE.CylinderGeometry(R + 0.1, R + 0.1, xo - wx, 24, 1, true, 0.35, Math.PI - 0.7).rotateZ(Math.PI / 2), wellM, sd * (wx + xo) / 2, R, -f); }
  return { g, hw, yT, roof, arch, sec, bodyX, glassX, endF, face, skin, wellM };
}
// Rad mit Radkappe/Felgenblende aussen (dreht mit): Scheibe, Loecher bzw. Rippen, Nabe
function sedanCap(w, tw, rimC, capC, holes) {
  const F = new THREE.Group(), sx = Math.sign(w.piv.position.x), r = w.r; F.position.x = sx * (tw / 2 + 0.012); w.spin.add(F);
  const rim = M(rimC, { metalness: 0.8, roughness: 0.3 }), cap = M(capC, { metalness: 0.9, roughness: 0.2 }), dk = M(0x16171a, { roughness: 0.7 });
  F.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.66, r * 0.66, 0.012, 28).rotateZ(Math.PI / 2), rim));
  for (let k = 0; k < holes; k++) { const a = k / holes * Math.PI * 2, h = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.09, r * 0.09, 0.014, 10).rotateZ(Math.PI / 2), dk); h.position.set(sx * 0.002, Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42); F.add(h); }
  const c = new THREE.Mesh(new THREE.SphereGeometry(r * 0.24, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-sx * Math.PI / 2), cap); c.position.x = sx * 0.004; F.add(c);
}
const SEDAN = { fF: 2.52, fR: -2.5, r: 0.34, wf: [1.45, -1.5], ys: 0.6, track: 1.64, tw: 0.24, fw: 1.05, fr: -1.75, ws: 0.36, rs: -1.18,
  hw: [[2.52, 0.66], [2.48, 0.8], [2.4, 0.87], [2.2, 0.9], [1.4, 0.91], [0, 0.915], [-1.5, 0.915], [-2.25, 0.9], [-2.42, 0.86], [-2.5, 0.74]],
  yT: [[2.52, 0.7], [2.47, 0.8], [2.35, 0.86], [2.0, 0.9], [1.1, 0.95], [0, 0.98], [-1.7, 0.99], [-2.2, 0.99], [-2.42, 0.95], [-2.5, 0.86]],
  yb: [[2.52, 0.42], [2.45, 0.31], [2.3, 0.25], [-2.3, 0.25], [-2.45, 0.31], [-2.5, 0.42]],
  roof: [[1.05, 0.95], [0.75, 1.13], [0.45, 1.32], [0.25, 1.39], [0, 1.41], [-0.9, 1.41], [-1.15, 1.37], [-1.45, 1.17], [-1.75, 0.99]],
  win: [[1.0, -0.31], [-0.4, -1.4]] };
// ---- Polizeiauto "Gotham Police" (Nicolas 2026-11-10, eigener Entwurf; 2026-11-11 als Loft): weisse Limousine, dunkelblaues Band, POLICE / GOTHAM CITY
// auf beiden Seiten und hinten (Canvas, auf der Flaeche), Lichtbalken rot/blau (blinkt beim Fahren), Rammschutz aus Rohr, Suchscheinwerfer, Antenne
function buildPolice() {
  const paint = M(0xeef0f2, { metalness: 0.4, roughness: 0.32 }), blue = M(0x1b2c4f, { metalness: 0.3, roughness: 0.4 }), dark = M(0x0a0b0c, { roughness: 0.7 });
  const glass = M(0x0a0e14, { metalness: 0.65, roughness: 0.08 }), chrome = M(0xa8adb3, { metalness: 0.9, roughness: 0.25 }), tireM = M(0x111111, { roughness: 0.92 }), rimM = M(0x2a2c30, { metalness: 0.6, roughness: 0.4 });
  const red = new THREE.MeshStandardMaterial({ color: 0x5a0a0a, emissive: 0xff2020, emissiveIntensity: 0.2, transparent: true, opacity: 0.92 }), blu = new THREE.MeshStandardMaterial({ color: 0x0a1a5a, emissive: 0x2a5cff, emissiveIntensity: 0.2, transparent: true, opacity: 0.92 });
  const amber = M(0xffa020, { emissive: 0x6a3a00 });
  const text = (big, small) => { const t = canvasTex(512, 160, (c, W, H) => { c.clearRect(0, 0, W, H); c.textAlign = "center"; c.textBaseline = "middle"; const fit = (str, px, max) => { let p = px; c.font = "bold " + p + "px Arial, sans-serif"; while (c.measureText(str).width > max) { p -= 2; c.font = "bold " + p + "px Arial, sans-serif"; } };
    c.fillStyle = "#1b2c4f"; c.fillRect(0, 108, W, 52); fit(big, 96, W - 60); c.lineWidth = 6; c.strokeStyle = "#1b2c4f"; c.strokeText(big, W / 2, 56); c.fillStyle = "#e08a2c"; c.fillText(big, W / 2, 56); fit(small, 34, W - 60); c.fillStyle = "#ffffff"; c.fillText(small, W / 2, 135); });
    t.repeat.set(1, 1); return new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }); };
  const k = sedanKit(SEDAN, paint, glass, dark), g = k.g, word = text("POLICE", "GOTHAM CITY");
  for (const sd of [-1, 1]) {
    k.skin(sd, -2.32, 2.36, 0.37, 0.56, k.bodyX, blue, 0.004, 60, 2);                                                   // dunkelblaues Band (setzt an den Radlaeufen aus)
    k.skin(sd, -1.02, 0.88, 0.365, 0.955, k.bodyX, word, 0.008, 30, 8);                                                  // Schriftzug
    for (const f of [1.0, -0.36]) k.skin(sd, f, f - 0.012, f => k.arch(f) + 0.03, f => k.yT(f) - 0.02, k.bodyX, dark, 0.009, 1, 6);   // Tuerfugen
    k.skin(sd, -1.15, -1.162, f => k.arch(f) + 0.03, f => k.yT(f) - 0.02, k.bodyX, dark, 0.009, 1, 6);
    for (const f of [-0.12, -1.0]) k.skin(sd, f, f - 0.16, 0.8, 0.84, k.bodyX, dark, 0.014, 2, 1);                       // Tuergriffe
    sideBox(g, sd * (k.hw(0.85) - 0.06), sd * (k.hw(0.85) + 0.1), 0.97, 1.0, -0.88, -0.8, dark); sideBox(g, sd * (k.hw(0.85) + 0.06), sd * (k.hw(0.85) + 0.2), 0.96, 1.1, -0.92, -0.78, dark);   // Spiegel
    k.face(1, sd * 0.42, sd * 0.78, 0.63, 0.74, 0.012, mat.glow); k.face(1, sd * 0.78, sd * 0.84, 0.63, 0.7, 0.012, amber);   // Scheinwerfer, Blinker
    k.face(-1, sd * 0.5, sd * 0.84, 0.72, 0.86, 0.012, mat.glowRed);                                                      // Rueckleuchten
    for (const y of [0.42, 0.66]) meshIn(g, new THREE.CylinderGeometry(0.035, 0.035, 0.5, 10).rotateZ(Math.PI / 2), dark, sd * 0.3, y, -2.66);   // Rammschutz Querrohre
    meshIn(g, new THREE.CylinderGeometry(0.04, 0.04, 0.5, 10), dark, sd * 0.32, 0.5, -2.68); meshIn(g, new THREE.CylinderGeometry(0.025, 0.025, 0.16, 8).rotateX(Math.PI / 2), dark, sd * 0.32, 0.42, -2.58);   // Rammschutz Pfosten, Halter
    boxIn(g, sd * 0.5 - 0.04, sd * 0.5 + 0.04, 1.41, 1.45, -0.38, -0.3, dark);                                            // Fuesse Lichtbalken
    const lens = meshIn(g, new THREE.CapsuleGeometry(0.075, 0.42, 4, 12).rotateZ(Math.PI / 2), sd < 0 ? red : blu, sd * 0.38, 1.53, -0.39); lens.scale.z = 1.25;   // Lichtbalken rot/blau
  }
  k.face(1, -0.4, 0.4, 0.5, 0.66, 0.008, dark); for (let x = -0.36; x <= 0.37; x += 0.06) k.face(1, x - 0.008, x + 0.008, 0.51, 0.65, 0.016, chrome);   // Grill
  k.face(1, -0.86, 0.86, 0.27, 0.45, 0.04, dark); k.face(-1, -0.88, 0.88, 0.27, 0.47, 0.04, dark);                          // Stossfaenger
  k.face(-1, -0.22, 0.22, 0.5, 0.62, 0.008, M(0xe6e8ea, { roughness: 0.5 }));                                               // Kennzeichenfeld
  boxIn(g, -0.75, 0.75, 1.45, 1.49, -0.47, -0.31, dark); boxIn(g, -0.12, 0.12, 1.49, 1.59, -0.44, -0.34, dark);             // Lichtbalken Traeger und Mitte
  meshIn(g, new THREE.CylinderGeometry(0.06, 0.07, 0.12, 12).rotateX(Math.PI / 2), chrome, -0.88, 1.06, -0.98); meshIn(g, new THREE.CircleGeometry(0.055, 12), mat.glow, -0.88, 1.06, -1.045, Math.PI); boxIn(g, -0.86, -0.8, 0.94, 1.03, -0.99, -0.95, dark);   // Suchscheinwerfer (Fahrerseite)
  { const t = meshIn(g, new THREE.PlaneGeometry(0.9, 0.28), text("POLICE", "GOTHAM CITY"), 0, 0.76, -k.endF(0, 0.76, -1) + 0.012); }   // Schriftzug hinten
  meshIn(g, new THREE.CylinderGeometry(0.006, 0.006, 0.8, 4), dark, 0.5, 1.38, 2.05);                                     // Antenne
  mergeStatic(g);
  const wheels = [[-0.82, -1.45, true], [0.82, -1.45, true], [-0.82, 1.5, false], [0.82, 1.5, false]].map(([x, z, f]) => addWheel(g, x, z, 0.34, 0.24, f, tireM, rimM, 0, 24));
  for (const w of wheels) sedanCap(w, 0.24, 0x2a2c30, 0xc8ccd0, 6);                                                        // schwarze Stahlfelge, Chromkappe
  return { g, wheels, beacon: [red, blu] };
}
const SPEC_POLICE = { name: "Gotham Police", wheels: [[-0.82, -1.45], [0.82, -1.45], [-0.82, 1.5], [0.82, 1.5]], wb: 2.95, track: 1.64, pts: [-1.7, 0, 1.7], R: 1.0, circR: 0.95, enter: 3.8,
  maxN: 34, maxF: 41.7, acc: 13, steer: 0.66, jump: false, grade: 36, camD: 8.5, camH: 1.2, seat: [-0.4, 1.15, 0.1], bodyH: 1.5, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -3.8], [0, 3.8]],
  msg: "Gotham Police: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen (Blaulicht blinkt beim Fahren)" };
// ---- Gotham Taxi (Nicolas 2026-11-10, eigener Entwurf, ohne Marken; 2026-11-11 als Loft): gelbe Limousine mit Stufenheck, Schachbrettband ueber den
// Radlaeufen, "GOTHAM CAB" auf den Tueren und hinten, beleuchtetes TAXI-Schild auf dem Dach, Chromstossstangen und Grill, Radkappen
function buildTaxi() {
  const paint = M(0xf2c218, { metalness: 0.35, roughness: 0.32 }), dark = M(0x0a0b0c, { roughness: 0.7 });
  const glass = M(0x0a0e14, { metalness: 0.65, roughness: 0.08 }), chrome = M(0xc4c8cc, { metalness: 0.9, roughness: 0.22 }), tireM = M(0x111111, { roughness: 0.92 }), rimM = M(0xc0c4c8, { metalness: 0.85, roughness: 0.25 });
  const amber = M(0xffa020, { emissive: 0x6a3a00 });
  const checker = (() => { const t = canvasTex(512, 16, (c, W, H) => { for (let i = 0; i < 64; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? "#f4f4f0" : "#111"; c.fillRect(i * 8, j * 8, 8, 8); } }); t.repeat.set(1, 1); return M(0xffffff, { map: t, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }); })();
  const text = (str, col) => { const t = canvasTex(512, 96, (c, W, H) => { c.clearRect(0, 0, W, H); c.textAlign = "center"; c.textBaseline = "middle"; let p = 76; c.font = "bold " + p + "px Arial, sans-serif"; while (c.measureText(str).width > W - 30) { p -= 2; c.font = "bold " + p + "px Arial, sans-serif"; } c.fillStyle = col; c.fillText(str, W / 2, H / 2 + 3); });
    t.repeat.set(1, 1); return new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 }); };
  const T = { ...SEDAN, wf: [1.5, -1.5], fF: 2.55, roof: [[1.05, 0.95], [0.75, 1.12], [0.45, 1.3], [0.25, 1.36], [0, 1.38], [-0.9, 1.38], [-1.12, 1.34], [-1.4, 1.15], [-1.65, 0.99]], fr: -1.65, rs: -1.1, win: [[1.0, -0.31], [-0.4, -1.32]],
    hw: [[2.55, 0.68], [2.5, 0.82], [2.42, 0.89], [2.2, 0.91], [0, 0.915], [-2.25, 0.91], [-2.42, 0.87], [-2.5, 0.76]], yT: [[2.55, 0.72], [2.5, 0.8], [2.38, 0.86], [2.0, 0.89], [1.1, 0.93], [0, 0.96], [-1.6, 0.97], [-2.3, 0.97], [-2.44, 0.93], [-2.5, 0.85]],
    yb: [[2.55, 0.42], [2.48, 0.31], [2.32, 0.25], [-2.3, 0.25], [-2.45, 0.31], [-2.5, 0.42]] };
  const k = sedanKit(T, paint, glass, dark), g = k.g, cab = text("GOTHAM CAB", "#111");
  for (const sd of [-1, 1]) {
    k.skin(sd, -2.36, 2.4, 0.79, 0.87, k.bodyX, checker, 0.006, 70, 1);                                                  // Schachbrettband ueber den Radlaeufen
    k.skin(sd, -0.95, 0.75, 0.42, 0.72, k.bodyX, cab, 0.006, 20, 4);                                                     // GOTHAM CAB auf den Tueren
    for (const f of [1.02, -0.36]) k.skin(sd, f, f - 0.012, f => k.arch(f) + 0.03, f => k.yT(f) - 0.02, k.bodyX, dark, 0.009, 1, 6);   // Tuerfugen
    k.skin(sd, -1.13, -1.142, f => k.arch(f) + 0.03, f => k.yT(f) - 0.02, k.bodyX, dark, 0.009, 1, 6);
    for (const f of [-0.12, -0.98]) k.skin(sd, f, f - 0.16, 0.74, 0.77, k.bodyX, chrome, 0.014, 2, 1);                   // Tuergriffe (Chrom)
    k.skin(sd, -2.2, 2.3, 0.33, 0.36, k.bodyX, chrome, 0.008, 50, 1);                                                    // Zierleiste unten
    sideBox(g, sd * (k.hw(0.85) - 0.06), sd * (k.hw(0.85) + 0.1), 0.95, 0.98, -0.88, -0.8, chrome); sideBox(g, sd * (k.hw(0.85) + 0.06), sd * (k.hw(0.85) + 0.2), 0.94, 1.08, -0.92, -0.78, paint);   // Spiegel
    k.face(1, sd * 0.48, sd * 0.78, 0.6, 0.74, 0.012, mat.glow); k.face(1, sd * 0.24, sd * 0.4, 0.62, 0.72, 0.012, mat.glow); k.face(1, sd * 0.78, sd * 0.86, 0.6, 0.68, 0.012, amber);   // Scheinwerfer, Zusatz, Blinker
    k.face(-1, sd * 0.5, sd * 0.84, 0.62, 0.8, 0.012, mat.glowRed);                                                       // Rueckleuchten
  }
  k.face(1, -0.42, 0.42, 0.46, 0.6, 0.008, dark); for (let x = -0.38; x <= 0.39; x += 0.06) k.face(1, x - 0.01, x + 0.01, 0.47, 0.59, 0.016, chrome);   // Grill
  k.face(1, -0.92, 0.92, 0.28, 0.42, 0.08, chrome); k.face(-1, -0.92, 0.92, 0.28, 0.42, 0.08, chrome);                      // Stossstangen (Chrom)
  k.face(-1, -0.22, 0.22, 0.45, 0.57, 0.008, M(0xe6e8ea, { roughness: 0.5 }));                                               // Kennzeichenfeld
  { const t = meshIn(g, new THREE.PlaneGeometry(1.0, 0.18), text("GOTHAM CAB", "#111"), 0, 0.72, -k.endF(0, 0.72, -1) + 0.012); }   // Schriftzug hinten
  mergeStatic(g);
  // TAXI-Schild auf dem Dach (nicht zusammengefasst: eigene Materialien je Seite), leuchtet; Fuss in Wagenfarbe
  const lit = (() => { const t = canvasTex(256, 80, (c, W, H) => { c.fillStyle = "#fff6c8"; c.fillRect(0, 0, W, H); c.fillStyle = "#111"; c.font = "bold 62px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("TAXI", W / 2, H / 2 + 3); }); t.repeat.set(1, 1); return new THREE.MeshBasicMaterial({ map: t }); })();
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.24), [dark, dark, M(0xf4e6a0, { emissive: 0x6a5a20 }), dark, lit, lit]); sign.position.set(0, 1.52, 0.3); g.add(sign);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.2), dark); foot.position.set(0, 1.4, 0.3); g.add(foot);
  const wheels = [[-0.82, -1.5, true], [0.82, -1.5, true], [-0.82, 1.5, false], [0.82, 1.5, false]].map(([x, z, f]) => addWheel(g, x, z, 0.34, 0.24, f, tireM, rimM, 0, 24));
  for (const w of wheels) sedanCap(w, 0.24, 0xc4c8cc, 0xe4e7ea, 8);                                                       // Chrom-Radkappen
  return { g, wheels };
}
const SPEC_TAXI = { name: "Gotham Taxi", wheels: [[-0.82, -1.5], [0.82, -1.5], [-0.82, 1.5], [0.82, 1.5]], wb: 3.0, track: 1.64, pts: [-1.7, 0, 1.7], R: 1.0, circR: 0.95, enter: 3.8,
  maxN: 30, maxF: 36.1, acc: 11, steer: 0.68, jump: false, grade: 36, camD: 8.5, camH: 1.2, seat: [-0.4, 1.15, 0.1], bodyH: 1.65, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -3.8], [0, 3.8]],
  msg: "Gotham Taxi: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen" };
// ---- Panzer (Nicolas 2026-11-10, eigener Entwurf; 2026-11-11 realistischer, Grundform und Masse bleiben): Wanne mit schraegem Bug, Ketten aus
// einzelnen Gliedern (laufen um Treibrad vorne mit Zaehnen und Leitrad hinten, oben auf Stuetzrollen), 6 Laufrollen je Seite mit Naben,
// Schuerzen in Segmenten mit Schrauben und Gummilappen, Kotfluegel, Staukisten, Fahrerluke mit Winkelspiegeln, Motordeck mit Lamellen,
// Abgasgitter, Abschlepphaken; Turm facettiert mit Hecküberhang, Staukorb, Kommandantenkuppel mit MG, Zielgeraet, Nebelwerfer (Antennen entfernt, Nicolas 2026-11-11);
// Kanone mit Blende, Rauchabsauger, Waermeschutzhuelle, Muendung. Ca. 6,8 x 3,5 x 2,5 m (Rohr ragt ca. 3 m vor)
function buildTank(col = 0x4d5a36) {
  const g = new THREE.Group();
  const paint = M(col, { roughness: 0.8, metalness: 0.2, flatShading: true }), dark = M(0x2a2e24, { roughness: 0.85, flatShading: true }), track = M(0x232323, { roughness: 0.9, metalness: 0.4, flatShading: true });
  const steel = M(0x5a5f63, { metalness: 0.6, roughness: 0.5, flatShading: true }), rubber = M(0x161616, { roughness: 0.95 }), tireM = M(0x161616, { roughness: 0.9 }), rimM = M(0x4a5532, { roughness: 0.7, metalness: 0.2 });
  const paint2 = M(new THREE.Color(col).multiplyScalar(0.82).getHex(), { roughness: 0.85, metalness: 0.15, flatShading: true }), canvasM = M(0x5b5a3e, { roughness: 1 }), glassM = M(0x10161c, { metalness: 0.7, roughness: 0.1 });
  prismIn(g, [[3.4, 0.7], [3.0, 1.35], [-2.9, 1.45], [-3.3, 1.2], [-3.3, 0.6], [-2.9, 0.45], [2.9, 0.45]], 2.3, paint);     // Wanne
  prismIn(g, [[3.38, 0.72], [3.02, 1.3], [2.98, 1.3], [3.34, 0.72]], 2.32, paint2);                                       // Schweissnaht Bugplatte
  // Kette: Glieder entlang einer Schleife (unten gerade, hinten um das Leitrad, oben gerade auf den Stuetzrollen, vorne um das Treibrad)
  const loop = []; const arc = (cz, cy, r, a0, a1) => { for (let k = 0; k <= 12; k++) { const a = a0 + (a1 - a0) * k / 12; loop.push([cz + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  loop.push([-2.25, 0.035], [2.25, 0.035]); arc(2.75, 0.55, 0.39, -2.1, Math.PI / 2); arc(-2.75, 0.55, 0.45, Math.PI / 2, 4.19); loop.push(loop[0]);
  const LINK = 0.155, links = []; { let carry = 0; for (let i = 0; i < loop.length - 1; i++) { const [z0, y0] = loop[i], [z1, y1] = loop[i + 1], L = Math.hypot(z1 - z0, y1 - y0); let s = carry;
    for (; s < L; s += LINK) { const u = s / L; links.push([z0 + (z1 - z0) * u, y0 + (y1 - y0) * u, Math.atan2(-(y1 - y0), z1 - z0)]); } carry = s - L; } }
  const linkG = new THREE.BoxGeometry(0.62, 0.05, LINK - 0.02), cleatG = new THREE.BoxGeometry(0.58, 0.035, 0.035).translate(0, -0.04, 0), hornG = new THREE.BoxGeometry(0.06, 0.07, 0.07).translate(0, 0.055, 0);
  for (const sd of [-1, 1]) {
    const X = sd * 1.4;
    for (const [z, y, a] of links) { meshIn(g, linkG, track, X, y, z, a); meshIn(g, cleatG, track, X, y, z, a); meshIn(g, hornG, steel, X, y, z, a); }   // Glied, Greifsteg aussen, Fuehrungszahn innen
    // Treibrad vorne: zwei Zahnkraenze, Nabe; Leitrad hinten; Stuetzrollen oben
    for (const dx of [-0.18, 0.18]) { meshIn(g, new THREE.CylinderGeometry(0.4, 0.4, 0.1, 18).rotateZ(Math.PI / 2), steel, X + dx, 0.55, -2.75);
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; meshIn(g, new THREE.BoxGeometry(0.1, 0.08, 0.09), steel, X + dx, 0.55 + Math.sin(a) * 0.43, -2.75 + Math.cos(a) * 0.43, -a); } }
    meshIn(g, new THREE.CylinderGeometry(0.16, 0.2, 0.5, 12).rotateZ(Math.PI / 2), dark, X, 0.55, -2.75);
    for (const dx of [-0.17, 0.17]) meshIn(g, new THREE.CylinderGeometry(0.36, 0.36, 0.12, 18).rotateZ(Math.PI / 2), steel, X + dx, 0.55, 2.75);
    meshIn(g, new THREE.CylinderGeometry(0.12, 0.12, 0.52, 10).rotateZ(Math.PI / 2), dark, X, 0.55, 2.75);
    for (const z of [-1.4, 0, 1.4]) meshIn(g, new THREE.CylinderGeometry(0.09, 0.09, 0.3, 10).rotateZ(Math.PI / 2), steel, X, 0.88, z);
    // Kotfluegel, Schuerzen in 5 Segmenten (Fugen, Schrauben, Gummilappen unten), Schmutzfaenger vorne
    sideBox(g, sd * 1.12, sd * 1.78, 1.04, 1.1, -3.25, 3.2, paint);
    for (let k = 0; k < 5; k++) { const z0 = -3.1 + k * 1.24, z1 = z0 + 1.2; sideBox(g, sd * 1.72, sd * 1.77, 0.6, 1.04, z0, z1, paint); sideBox(g, sd * 1.73, sd * 1.76, 0.44, 0.6, z0, z1, rubber);
      for (let b = 0; b < 4; b++) meshIn(g, new THREE.CylinderGeometry(0.022, 0.022, 0.02, 6).rotateZ(Math.PI / 2), dark, sd * 1.775, 0.98, z0 + 0.12 + b * 0.32); }
    boxIn(g, Math.min(sd * 1.12, sd * 1.78), Math.max(sd * 1.12, sd * 1.78), 0.62, 1.06, -3.3, -3.26, rubber);
    // Staukisten hinten auf dem Kotfluegel, Werkzeug (Spaten, Brechstange) vorne
    sideBox(g, sd * 1.22, sd * 1.7, 1.1, 1.33, 1.6, 2.9, paint2); sideBox(g, sd * 1.2, sd * 1.72, 1.29, 1.31, 1.58, 2.92, paint);
    sideBox(g, sd * 1.3, sd * 1.36, 1.1, 1.14, -2.9, -1.6, M(0x6b4a2a, { roughness: 0.9 })); sideBox(g, sd * 1.5, sd * 1.54, 1.1, 1.13, -2.8, -1.2, steel);
    // Scheinwerfer mit Schutzbuegel, Ruecklicht, Abschlepphaken
    boxAt(g, 0.36, 0.22, 0.2, dark, sd * 0.85, 1.42, -2.95); boxAt(g, 0.26, 0.12, 0.03, mat.glow, sd * 0.85, 1.43, -3.06);
    for (const dx of [-0.2, 0.2]) boxAt(g, 0.03, 0.3, 0.03, steel, sd * 0.85 + dx, 1.42, -3.12); boxAt(g, 0.43, 0.03, 0.03, steel, sd * 0.85, 1.56, -3.12);
    boxAt(g, 0.18, 0.12, 0.04, mat.glowRed, sd * 0.9, 1.25, 3.31);
    for (const z of [-3.42, 3.33]) { boxAt(g, 0.08, 0.2, 0.14, steel, sd * 0.55, 0.78, z); boxAt(g, 0.22, 0.06, 0.14, steel, sd * 0.55, 0.68, z); }
  }
  // Fahrerluke mit drei Winkelspiegeln; Motordeck mit Lamellen; Abgasgitter und Ersatzglieder am Heck
  meshIn(g, new THREE.CylinderGeometry(0.3, 0.32, 0.08, 16), paint2, 0, 1.41, -2.35); for (const dx of [-0.22, 0, 0.22]) boxAt(g, 0.14, 0.07, 0.08, glassM, dx, 1.42, -2.68);
  boxAt(g, 1.6, 0.25, 0.9, dark, 0, 1.55, 2.4); for (let z = 2.0; z <= 2.81; z += 0.09) boxAt(g, 1.5, 0.03, 0.04, steel, 0, 1.685, z);
  for (const sd of [-1, 1]) { boxIn(g, sd * 0.35, sd * 1.0, 0.85, 1.15, 3.3, 3.34, dark); for (let y = 0.88; y < 1.13; y += 0.05) boxIn(g, Math.min(sd * 0.37, sd * 0.98), Math.max(sd * 0.37, sd * 0.98), y, y + 0.015, 3.34, 3.36, steel); }
  for (const dx of [-0.16, 0.16]) boxAt(g, 0.62, 0.05, 0.14, track, dx, 0.68, 3.32);
  mergeStatic(g);
  // Turm (eigene Gruppe, dreht): facettierter Loft (vorne keilfoermig, Hecküberhang), Querschnitt mit schraegen Seiten
  const turret = new THREE.Group(); turret.position.set(0, 1.58, 0.35); g.add(turret);
  const T = new THREE.Group(); turret.add(T);
  const tsec = (w, yb, yt) => [[0, yb], [w - 0.14, yb], [w, yb + 0.14], [w - 0.07, yt - 0.07], [w - 0.2, yt], [0, yt]];
  loftIn(T, [[1.3, tsec(0.48, 0.1, 0.42)], [1.05, tsec(0.84, 0.0, 0.58)], [0.3, tsec(0.96, 0.0, 0.64)], [-0.95, tsec(0.96, 0.0, 0.66)], [-1.2, tsec(0.92, 0.04, 0.66)], [-1.62, tsec(0.86, 0.14, 0.62)], [-1.78, tsec(0.76, 0.18, 0.56)]], paint);
  meshIn(T, new THREE.CylinderGeometry(1.0, 1.05, 0.16, 24), dark, 0, -0.06, 0);                                          // Drehkranz
  // Staukorb am Heck: Rahmen aus Stangen, darin Planen und Kisten
  for (const x of [-0.8, 0.8]) boxIn(T, x - 0.02, x + 0.02, 0.2, 0.55, 1.78, 2.3, steel); boxIn(T, -0.82, 0.82, 0.53, 0.56, 2.27, 2.31, steel); boxIn(T, -0.82, 0.82, 0.2, 0.23, 2.27, 2.31, steel);
  for (const x of [-0.8, 0.8]) boxIn(T, x - 0.02, x + 0.02, 0.53, 0.56, 1.78, 2.3, steel);
  meshIn(T, new THREE.CylinderGeometry(0.15, 0.15, 1.2, 10).rotateZ(Math.PI / 2), canvasM, -0.1, 0.38, 2.02); boxIn(T, 0.4, 0.75, 0.22, 0.48, 1.82, 2.22, paint2);
  // Kommandantenkuppel mit Winkelspiegeln, Lukendeckel und MG; Ladeschuetzenluke; Zielgeraet; Nebelwerfer; Antennen
  meshIn(T, new THREE.CylinderGeometry(0.38, 0.42, 0.18, 18), paint, -0.45, 0.74, 0.3);
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; boxAt(T, 0.1, 0.07, 0.06, glassM, -0.45 + Math.sin(a) * 0.4, 0.75, 0.3 + Math.cos(a) * 0.4).rotation.y = a; }
  meshIn(T, new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16), paint2, -0.45, 0.86, 0.3);
  boxAt(T, 0.08, 0.2, 0.08, steel, -0.12, 0.9, 0.1); boxAt(T, 0.12, 0.12, 0.42, dark, -0.12, 1.02, 0.0); meshIn(T, new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8), dark, -0.12, 1.03, -0.55, Math.PI / 2);   // MG
  meshIn(T, new THREE.CylinderGeometry(0.3, 0.3, 0.06, 14), paint2, 0.5, 0.7, 0.5);                                      // Ladeschuetzenluke
  boxAt(T, 0.36, 0.28, 0.4, paint, 0.52, 0.8, -0.65); boxAt(T, 0.3, 0.2, 0.02, glassM, 0.52, 0.82, -0.86);                 // Zielgeraet (Richtschuetze)
  for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const tb = meshIn(T, new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), dark, sd * (0.86 - k * 0.0), 0.36 + k * 0.08, -0.55 - k * 0.05, -0.9); tb.rotation.z = sd * 0.5; }   // Nebelwerfer
  mergeStatic(T);
  // Kanone als eigene Gruppe mit Drehpunkt an der Blende (Nicolas 2026-11-11: Rohr in der Hoehe verstellbar, bleibt in Weltlage)
  const gun = new THREE.Group(); gun.position.set(0, 0.32, -1.3); T.add(gun);
  prismIn(gun, [[0.42, -0.24], [0.42, 0.2], [0.05, 0.28], [-0.25, 0.28], [-0.25, -0.28], [0.05, -0.28]], 0.72, paint);   // Blende (keilfoermig)
  boxAt(gun, 0.08, 0.08, 0.06, dark, 0.22, 0.05, -0.43);                                                                   // Koaxial-MG
  meshIn(gun, new THREE.CylinderGeometry(0.115, 0.13, 1.2, 14), steel, 0, 0, -0.95, Math.PI / 2);                            // Rohr hinten
  meshIn(gun, new THREE.CylinderGeometry(0.18, 0.18, 0.6, 14), paint2, 0, 0, -1.85, Math.PI / 2);                            // Rauchabsauger
  for (let k = 0; k < 3; k++) meshIn(gun, new THREE.CylinderGeometry(0.125, 0.125, 0.6, 14), paint, 0, 0, -2.5 - k * 0.62, Math.PI / 2);   // Waermeschutzhuelle in Segmenten
  meshIn(gun, new THREE.CylinderGeometry(0.1, 0.115, 0.6, 14), steel, 0, 0, -4.25, Math.PI / 2);                              // Rohrende
  meshIn(gun, new THREE.CylinderGeometry(0.14, 0.12, 0.2, 14), dark, 0, 0, -4.65, Math.PI / 2);                              // Muendung
  mergeStatic(gun); for (const o of gun.children) o.castShadow = true;
  for (const o of [...T.children]) o.castShadow = true;
  // Laufrollen (6 je Seite, drehen mit), rund ueber addWheel; aussen Nabe mit Schrauben
  const wheels = [];
  for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { const w = addWheel(g, sd * 1.4, -2.0 + k * 0.8, 0.36, 0.48, false, tireM, rimM, 0, 16), F = new THREE.Group(); F.position.x = sd * 0.25; w.spin.add(F);
    F.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 12).rotateZ(Math.PI / 2), dark));
    for (let b = 0; b < 6; b++) { const a = b / 6 * Math.PI * 2, bo = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 6).rotateZ(Math.PI / 2), steel); bo.position.set(0, Math.cos(a) * 0.17, Math.sin(a) * 0.17); F.add(bo); }
    wheels.push(w); }
  // Rohr darf nie in die Wanne (Nicolas 2026-11-11): tiefster Rohrwinkel je Turmdrehung (1-Grad-Schritte), aus der Oberkante der Wanne
  // (Deck, Bug-Schraege, Motordeck, Scheinwerferkaesten, Kettenbleche) und Punkten entlang des Rohrs (Radius 0,15 + 3 cm Luft)
  const top = (x, z) => {                                                  // Oberkante der Wanne an (x, z), lokal, -1 = nichts
    let h = -1, ax = Math.abs(x);
    if (ax <= 1.15 && z >= -3.4 && z <= 3.3) h = z < -3.0 ? 0.7 + (z + 3.4) / 0.4 * 0.65 : 1.35 + (z + 3.0) / 5.9 * 0.1;
    if (ax > 1.12 && ax <= 1.75 && Math.abs(z) <= 3.2) h = Math.max(h, 1.12);
    if (ax <= 0.8 && z >= 1.95 && z <= 2.85) h = Math.max(h, 1.675);
    if (ax >= 0.6 && ax <= 1.1 && z >= -3.15 && z <= -2.85) h = Math.max(h, 1.58);
    if (ax <= 0.35 && z >= -2.75 && z <= -2.05) h = Math.max(h, 1.46);                      // Fahrerluke, Winkelspiegel
    if (ax > 1.2 && ax <= 1.72 && z >= 1.58 && z <= 2.92) h = Math.max(h, 1.33);            // Staukisten
    if (ax <= 0.8 && z >= 1.95 && z <= 2.85) h = Math.max(h, 1.7);                          // Lamellen Motordeck
    return h;
  };
  const gunMin = new Float32Array(360);
  for (let a = 0; a < 360; a++) {
    const psi = a * Math.PI / 180, sn = Math.sin(psi), cs = Math.cos(psi), px = -1.3 * sn, pz = 0.35 - 1.3 * cs, py = 1.58 + 0.32;
    let p = -0.45;
    for (; p < 0.6; p += 0.005) {
      let ok = true;
      for (let t = 0.4; t <= 4.75 && ok; t += 0.1) { const x = px - sn * Math.cos(p) * t, z = pz - cs * Math.cos(p) * t, y = py + Math.sin(p) * t; if (y - 0.18 < top(x, z)) ok = false; }
      if (ok) break;
    }
    gunMin[a] = p;
  }
  // Glatter Verlauf (Nicolas 2026-11-11: Rohr zitterte beim Drehen an Kanten): erst Maximum ueber +-6 Grad, dann Mittel ueber +-6 Grad.
  // Das Mittel der Maxima ist an jeder Stelle mindestens so hoch wie der echte Mindestwinkel, das Rohr kommt also nie tiefer als erlaubt.
  { const W = 6, mx = gunMin.map((_, a) => { let m = -9; for (let d = -W; d <= W; d++) m = Math.max(m, gunMin[(a + d + 360) % 360]); return m; });
    for (let a = 0; a < 360; a++) { let t = 0; for (let d = -W; d <= W; d++) t += mx[(a + d + 360) % 360]; gunMin[a] = t / (2 * W + 1); } }
  return { g, wheels, turret, gun, gunMin };
}
const SPEC_TANK = { name: "Panzer", turretSpeed: 40, gunSpeed: 20, wheels: [[-1.4, -2.4], [1.4, -2.4], [-1.4, 2.4], [1.4, 2.4]], wb: 4.8, track: 2.8, pts: [-2.3, 0, 2.3], R: 1.7, circR: 1.7, enter: 4.5,
  maxN: 14, maxF: 18, revMax: 18, acc: 6, steer: 0.95, jump: false, grade: 75, tracks: true, hull: [-1.6, 0, 1.6].flatMap(x => [-3.3, -1.6, 0, 1.6, 3.3].map(z => [x, 0.05, z])), camD: 11, camH: 2.0, seat: [0, 2.6, 0.3], bodyH: 2.5, bike: false,
  exits: [[-2.6, 0], [2.6, 0], [-2.6, 1.5], [2.6, 1.5], [0, -4.5], [0, 4.5]],
  msg: "Panzer: W/S Gas/Bremse, A/D lenken, Maus dreht den Turm, V Kamera, R zurücksetzen, Shift aussteigen" };
// Glatter Koerper aus Querschnitten (wie beim Aventador): Stationen [f, Halbschnitt von unten-Mitte ueber die Seite bis oben-Mitte], gespiegelt, Enden zu
function loftIn(g, st, m) {
  const pos = [], ring = ([f, h]) => [...h, ...h.slice().reverse().map(([x, y]) => [-x, y])].map(([x, y]) => [x, y, -f]);
  const R = st.map(ring), n = R[0].length, tri = (a, b, c) => pos.push(...a, ...c, ...b);
  for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < n; j++) { const a = R[i][j], b = R[i][(j + 1) % n], c = R[i + 1][(j + 1) % n], d = R[i + 1][j]; tri(a, d, c); tri(a, c, b); }
  for (const [k, s] of [[0, 1], [R.length - 1, -1]]) { const r = R[k], c = r.reduce((q, p) => [q[0] + p[0] / n, q[1] + p[1] / n, q[2] + p[2] / n], [0, 0, 0]); for (let j = 0; j < n; j++) s > 0 ? tri(c, r[j], r[(j + 1) % n]) : tri(c, r[(j + 1) % n], r[j]); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals(); const o = new THREE.Mesh(geo, m); g.add(o); return o;
}
const tabF = T => f => { if (f >= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (f >= T[i][0]) { const [f0, a] = T[i - 1], [f1, b] = T[i]; return a + (b - a) * (f0 - f) / (f0 - f1); } return T[T.length - 1][1]; };
// ---- Rolls-Royce Spectre (Nicolas 2026-11-10, Fotos vorne und oben; stilisiert, ohne Logos/Schriftzug): grosses Coupe mit einer Tuer je Seite,
// von oben rund (schmale Nase und Heck, breite Hueften), Fastback, zweifarbig Gold mit schwarzer Haube, schwarzem Dach und schwarzem Heckdeckel,
// hoher Chromgrill, geteilte Scheinwerfer (schmales Tagfahrlicht oben), Kuehlerfigur stilisiert, Chromlinie unter den Fenstern. Profil nach Seitenfoto: Gurtlinie bis 1,22 m, Fastback bis ans Heck. Ca. 5,2 x 2,0 x 1,56 m
function buildSpectre(col = 0xd2aa3c) {
  const g = new THREE.Group();
  const paint = M(col, { metalness: 0.35, roughness: 0.3, flatShading: true }), black = M(0x0b0c0e, { metalness: 0.6, roughness: 0.18, flatShading: true }), glass = M(0x070a0f, { metalness: 0.7, roughness: 0.06, flatShading: true });
  const chrome = M(0xdfe2e6, { metalness: 0.95, roughness: 0.15 }), dark = M(0x111214, { roughness: 0.6, flatShading: true }), tireM = M(0x101010, { roughness: 0.92 }), rimM = M(0xb9bdc3, { metalness: 0.9, roughness: 0.2 }), silver = M(0xb4b9bf, { metalness: 0.3, roughness: 0.3 }), R = 0.45;
  const W = [[1.72, R], [-1.6, R]], arch = f => { let y = 0.16; for (const [c, r] of W) { const d = Math.abs(f - c), RR = r + 0.1; if (d < RR + 0.05) y = Math.max(y, 0.16 + (2 * r + 0.06 - 0.16) * Math.sqrt(Math.max(0, 1 - (d / (RR + 0.05)) ** 2))); } return y; };   // runde Radlaeufe
  const hwT = tabF([[2.6, 0.7], [2.44, 0.87], [2.1, 0.96], [1.7, 1.0], [0.9, 0.99], [0, 0.98], [-0.9, 1.0], [-1.6, 1.03], [-2.2, 1.0], [-2.55, 0.95], [-2.74, 0.84]]), RF0 = -2.5, RD = 0.3, W0 = hwT(RF0);
  const hw = f => f >= RF0 ? hwT(f) : W0 * Math.sqrt(Math.max(0, 1 - ((RF0 - f) / RD) ** 2)), rearFs = (t0 = 0) => Array.from({ length: 9 }, (_, k) => RF0 - RD * Math.sin(t0 + (1.45 - t0) * k / 8));   // Heck von oben leicht rund (Nicolas)
  const yT = tabF([[2.6, 1.0], [2.4, 1.08], [1.7, 1.14], [0.8, 1.2], [0, 1.22], [-1.2, 1.23], [-2.3, 1.23], [-2.6, 1.19], [-2.74, 1.04]]);   // Nicolas: mehr Volumen ueber dem Vorderrad und hinter dem Hinterrad
  const noseF = (x, y) => { for (let f = 2.6; f > 1.6; f -= 0.005) { const hs = hw(f), ye = yT(f) - 0.03, ys = Math.max(0.25, Math.min(ye - 0.14, 0.62)), w = y <= ys ? hs : hs - 0.12 * (y - ys) / (ye - ys); if (w >= Math.abs(x)) return f; } return 1.6; };
  const nose = (xa, xb, y0, y1, d, m) => { const st = 0.02, x0 = Math.min(xa, xb), x1 = Math.max(xa, xb); for (let x = x0; x < x1 - 1e-6; x += st) { const xm = Math.min(x1, x + st), fz = Math.max(noseF(x, (y0 + y1) / 2), noseF(xm, (y0 + y1) / 2)); boxIn(g, x, xm, y0, y1, -fz - d, -fz + 0.03, m); } };   // Nicolas: nichts steht seitlich heraus
  const body = [], cap = []; const FS = []; for (let f = 2.6; f > RF0; f -= 0.08) FS.push(f); FS.push(...rearFs()); for (const ff of FS) { const yb = ff < -2.4 ? Math.max(arch(ff), 0.28 + (-2.4 - ff) * 0.45) : ff > 2.45 ? 0.2 : Math.max(0.19, arch(ff)), hs = hw(ff), yt = yT(ff), ye = yt - 0.03, ys = Math.max(yb + 0.05, Math.min(ye - 0.14, 0.62));
    body.push([ff, [[0, yb], [Math.max(0, hs - 0.1), yb], [hs, ys], [Math.max(0, hs - 0.12), ye], [0, yt]]]); if ((ff > 0.78 && ff < 2.54) || ff < -2.0) { const cw = ff < 0 ? Math.max(0.02, Math.min(0.6, hs - 0.17)) : hs - 0.17; cap.push([ff, [[0, yt - 0.01], [cw, yt - 0.01], [cw, yt + 0.012], [0, yt + 0.016]]]); } }   // Heckdeckel so schmal wie das Dach, die Schultern bleiben gold (Nicolas)
  const bodyM = loftIn(g, body, paint);                                                                                                      // Karosserie gold
  loftIn(g, cap, black);                                                                                                       // Haube und Heckdeckel schwarz (Nicolas: Heck wie Foto)
  const roofY = tabF([[0.95, 1.2], [0.55, 1.43], [0.1, 1.58], [-0.5, 1.6], [-1.2, 1.52], [-1.9, 1.38], [-2.4, 1.27], [-2.62, 1.22]]), gh = [], ws = [];   // Nicolas: Dach hoeher und als langer Bogen bis ans Heck
  for (let f = 0.95; f > -2.63; f -= 0.08) { const ff = Math.max(-2.62, f), hb = hw(ff) - 0.2, yt = roofY(ff), ht = Math.min(hb, 0.66); const sec = [ff, [[0, yT(ff) - 0.02], [hb, yT(ff) - 0.02], [ht, Math.max(yt - 0.02, yT(ff))], [0, yt]]]; gh.push(sec);
    if (ff > 0.16 && ff < 0.94) ws.push([ff, [[0, yT(ff) + 0.004], [hb - 0.13, yT(ff) + 0.004], [ht - 0.11, Math.max(yt - 0.02, yT(ff)) + 0.008], [0, yt + 0.008]]]); }   // Frontscheibe eingesetzt: Rahmen und A-Saeulen bleiben in Wagenfarbe
  { const f = -2.62, hb = hw(f) - 0.2 + 0.006, yt = roofY(f) + 0.014, ht = Math.min(hb, 0.666), y0 = yT(f) - 0.03, sec = [[0, y0], [hb, y0], [ht, Math.max(yt - 0.02, yT(f))], [0, yt]]; loftIn(g, [[f + 0.004, sec], [f - 0.008, sec]], black); }   // Dachende hinten schwarz, keine goldene Kante (Nicolas)
  loftIn(g, gh, paint); loftIn(g, ws, glass);                                                                                 // Frontscheibe, Fastback-Dach gold (Seitenfenster unten)
  { const wT = tabF([[0.84, 1.26], [0.4, 1.47], [-0.4, 1.54], [-1.0, 1.46], [-1.3, 1.28]]), wB = f => 1.26 + (0.84 - f) / 2.14 * 0.02, q = [], N = 40, K = 4;   // Seitenfenster liegen auf der Dachflaeche (Nicolas: ragten heraus)
    const sx = (f, y) => { const hb = hw(f) - 0.2, y0 = yT(f) - 0.02, y1 = Math.max(roofY(f) - 0.02, yT(f)), ht = Math.min(hb, 0.66); return hb + (ht - hb) * Math.min(1, Math.max(0, (y - y0) / Math.max(0.01, y1 - y0))) + 0.006; };
    for (const sd of [-1, 1]) { const P = (f, k) => { const y = wB(f) + (wT(f) - wB(f)) * k / K; return [sd * sx(f, y), y, -f]; };
      for (let i = 0; i < N; i++) for (let k = 0; k < K; k++) { const fa = 0.84 - i / N * 2.14, fb = 0.84 - (i + 1) / N * 2.14, a = P(fa, k), b = P(fb, k), c = P(fb, k + 1), d = P(fa, k + 1); q.push(...(sd < 0 ? [...a, ...b, ...c, ...a, ...c, ...d] : [...a, ...c, ...b, ...a, ...d, ...c])); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(q, 3)); geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, glass)); }
  const rf = []; for (let f = 0.14; f > -2.6; f -= 0.08) rf.push([f, [[0, roofY(f) - 0.005], [0.6, roofY(f) - 0.03], [0.6, roofY(f) - 0.01], [0, roofY(f) + 0.012]]]);
  loftIn(g, rf, black);                                                                                                        // Dach schwarz
  for (const sd of [-1, 1]) {
    const x = sd * (hw(0) - 0.01);
    sideBox(g, x, x + sd * 0.025, 1.04, 1.07, -0.78, -0.42, chrome);                                                       // Tuergriff
    sideBox(g, sd * 0.78, sd * 0.84, 1.22, 1.25, -0.72, 1.3, chrome);                                    // Chromlinie unter den Fenstern
    sideBox(g, sd * 0.8, sd * 0.98, 1.19, 1.23, -0.74, -0.68, paint); sideBox(g, sd * 0.94, sd * 1.12, 1.2, 1.33, -0.74, -0.6, paint);   // Spiegel: Arm auf der Gurtlinie, Gehaeuse aussen                                                     // Spiegel
    nose(sd * 0.48, sd * 0.8, 0.925, 0.945, 0.012, mat.glow);                                                                // Tagfahrlicht: schmaler Strich, folgt der Rundung
    nose(sd * 0.5, sd * 0.8, 0.72, 0.84, 0.01, dark); for (const k of [0, 1, 2]) nose(sd * (0.56 + k * 0.07), sd * (0.6 + k * 0.07), 0.76, 0.8, 0.016, mat.glow);   // Scheinwerferband mit drei Lichtern
    { // Rueckleuchte als ein Stueck um die Ecke (Nicolas): auf der runden Heckflaeche ab x 0,66 nach vorne als Keil (oben breit, unten spitz), buendig auf der Karosserie
      const surfX = (f, y) => { const hs = hw(f), ye = yT(f) - 0.03, ys = Math.max(0.25, Math.min(ye - 0.14, 0.62)); return (y <= ys ? hs : hs - 0.12 * (y - ys) / (ye - ys)) + 0.006; };
      const P = (f, y) => [sd * surfX(f, y), y, -f + 0.006], q = [], fR = RF0 - RD * Math.sqrt(1 - (0.66 / W0) ** 2), LL = -2.36 - fR;
      const tri = (a, b, c) => q.push(...(sd > 0 ? [...a, ...b, ...c] : [...a, ...c, ...b]));
      for (let i = 0; i < 16; i++) { const fa = fR + i / 16 * LL, fb = fR + (i + 1) / 16 * LL, ta = 1.0 - i / 16 * 0.06, ba = 0.8 + i / 16 * 0.14, tb = 1.0 - (i + 1) / 16 * 0.06, bb = 0.8 + (i + 1) / 16 * 0.14; tri(P(fa, ta), P(fa, ba), P(fb, tb)); tri(P(fa, ba), P(fb, bb), P(fb, tb)); }   // ein Stueck von hinten (folgt der Rundung) bis vorne spitz
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(q, 3)); geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff3b30, side: THREE.DoubleSide }))); }
    sideBox(g, sd * 0.93, sd * 1.02, 0.17, 0.29, -1.12, 0.98, silver); sideBox(g, sd * 1.02, sd * 1.025, 0.24, 0.26, -1.05, 0.9, chrome);   // silberner Schweller (Nicolas, Foto)
  }
  boxIn(g, -0.45, 0.45, 0.5, 0.99, -2.66, -2.57, silver); boxIn(g, -0.39, 0.39, 0.55, 0.94, -2.67, -2.65, M(0xd3d7dc, { roughness: 0.35 }));   // hoher Grill silbern wie das Unterteil
  for (let x = -0.35; x <= 0.36; x += 0.035) boxIn(g, x - 0.008, x + 0.008, 0.56, 0.93, -2.68, -2.67, silver);            // dichte senkrechte Streben
  meshIn(g, new THREE.CylinderGeometry(0.018, 0.024, 0.07, 8), silver, 0, 1.075, -2.5); meshIn(g, new THREE.BoxGeometry(0.03, 0.09, 0.07), silver, 0, 1.14, -2.49, 0.5);   // Kuehlerfigur (stilisiert), silbern
  nose(-0.86, 0.86, 0.17, 0.25, 0.04, silver);                                                                           // silberne Frontlippe (folgt der Nase)
  nose(-0.82, 0.82, 0.27, 0.44, 0.01, dark); for (const y of [0.3, 0.4]) nose(-0.78, 0.78, y, y + 0.015, 0.018, silver);   // Lufteinlass mit zwei silbernen Leisten
  { const st = []; for (let f = -2.3; f > RF0; f -= 0.04) st.push(f); st.push(...rearFs(), rearFs()[8] - 0.012); loftIn(g, st.map(f => { const yb = 0.18 + Math.max(0, -2.4 - f) * 0.45, w = Math.min(hw(Math.max(f, -2.797)) + 0.012, 1.0); return [f, [[0, yb], [w, yb], [w, yb + 0.15], [0, yb + 0.15]]]; }), silver); }   // Diffusor silbern, steigt nach hinten schraeg an, folgt dem runden Heck
  { const bot = x => 0.92 + 0.15 * (x / 0.62) ** 2, q = [], NX = 48, NY = 16;   // Heckblende schwarz unter der Scheibe bis zum Bogen, Punkte liegen auf dem runden Heck (Nicolas, Skizze)
    const rc = new THREE.Raycaster(), P = (x, y) => { rc.set(new THREE.Vector3(x, y, 4), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObject(bodyM)[0]; return [x, y + 0.01, h.point.z + 0.01]; };   // Punkte direkt auf der Karosserie
    for (let i = 0; i < NX; i++) { const xa = -0.62 + i / NX * 1.24, xb = xa + 1.24 / NX, Y = (x, k) => bot(x) + (1.1 - bot(x)) * k / NY;
      for (let k = 0; k < NY; k++) { const a0 = P(xa, Y(xa, k)), b0 = P(xb, Y(xb, k)), b1 = P(xb, Y(xb, k + 1)), a1 = P(xa, Y(xa, k + 1)); q.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(q, 3)); geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, M(0x0b0c0e, { metalness: 0.6, roughness: 0.18 }))); }
  for (let x = -0.7; x < 0.699; x += 0.035) { const xm = Math.max(Math.abs(x), Math.abs(x + 0.035)) - 0.012, fz = RF0 - RD * Math.sqrt(Math.max(0, 1 - (Math.min(xm, W0) / W0) ** 2)); boxIn(g, x, x + 0.035, 0.44, 0.46, -fz - 0.03, -fz + 0.012, chrome); }   // Chromleiste folgt dem runden Heck
  boxIn(g, -0.22, 0.22, 0.62, 0.7, 2.782, 2.802, dark);   // Kennzeichenfeld (leer)
  const wellM = M(0x0c0d0f, { roughness: 0.9, side: THREE.DoubleSide });                                                          // Radhaeuser (Nicolas: man sah hinter den Reifen durch)
  for (const z of [-1.72, 1.6]) for (const sd of [-1, 1]) { meshIn(g, new THREE.CylinderGeometry(R + 0.08, R + 0.08, 0.3, 28, 1, true, -0.3, Math.PI + 0.6).rotateZ(Math.PI / 2), wellM, sd * 0.71, R, z);   // schmaler, bleibt hinter der Karosserie (Nicolas: von aussen sichtbar)
    meshIn(g, new THREE.CircleGeometry(R + 0.08, 28, -0.3, Math.PI + 0.6).rotateY(Math.PI / 2), wellM, sd * 0.56, R, z); }
  for (const z of [-1.72, 1.6]) boxIn(g, -0.72, 0.72, 0.19, 2 * R + 0.08, z - R - 0.17, z + R + 0.17, dark);   // Wand hinter jedem Rad ab Wagenboden, ueber den ganzen Radlauf: kein Durchblick (Nicolas)
  mergeStatic(g);
  const wheels = [[-0.9, -1.72, true], [0.9, -1.72, true], [-0.9, 1.6, false], [0.9, 1.6, false]].map(([x, z, f]) => addWheel(g, x, z, R, 0.3, f, tireM, rimM, 0, 28));
  // Felgen-Design (Nicolas, Foto): dunkle Scheibe mit sieben breiten hellen Speichen als geschwungene Blaetter, dunkle Nabe mit Silberring, aussen
  const faceM = M(0x15161a, { metalness: 0.7, roughness: 0.3 }), bladeM = M(0xe4e7eb, { metalness: 0.25, roughness: 0.3, emissive: 0x2a2c30, side: THREE.DoubleSide });
  for (const w of wheels) { const sx = Math.sign(w.piv.position.x), ox = sx * 0.165, F = new THREE.Group(); F.position.x = ox; w.spin.add(F);
    F.add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.63, R * 0.63, 0.012, 32).rotateZ(Math.PI / 2), faceM));
    for (let k = 0; k < 7; k++) { const sh = new THREE.Shape(); sh.moveTo(0.06, -0.02); sh.lineTo(R * 0.6, -0.05); sh.lineTo(R * 0.6, 0.06); sh.lineTo(0.06, 0.03); sh.closePath();
      const b = new THREE.Mesh(new THREE.ShapeGeometry(sh), bladeM); b.rotation.y = sx * Math.PI / 2; const piv = new THREE.Group(); piv.rotation.x = k / 7 * Math.PI * 2; piv.position.x = sx * 0.008; piv.add(b); b.rotation.z = 0.25; F.add(piv); }
    F.add(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 20).rotateZ(Math.PI / 2), faceM)); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.008, 6, 24).rotateY(Math.PI / 2), bladeM); ring.position.x = sx * 0.016; F.add(ring); }
  return { g, wheels };
}
const SPEC_SPECTRE = { name: "Rolls-Royce Spectre", wheels: [[-0.9, -1.72], [0.9, -1.72], [-0.9, 1.6], [0.9, 1.6]], wb: 3.32, track: 1.8, pts: [-1.85, 0, 1.85], R: 1.05, circR: 1.0, enter: 3.8,
  maxN: 30, maxF: 44.4, acc: 27, steer: 0.62, jump: false, grade: 36, camD: 9.5, camH: 1.2, seat: [-0.45, 1.2, 0.3], bodyH: 1.6, bike: false,
  exits: [[-2.0, -0.2], [2.0, -0.2], [-2.0, 1.3], [2.0, 1.3], [0, -4.0], [0, 4.0]],
  msg: "Rolls-Royce Spectre: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen" };
const SPEC_GCLASS = { name: "Mercedes-Benz G-Klasse", wheels: [[-0.94, -1.45], [0.94, -1.45], [-0.94, 1.45], [0.94, 1.45]], wb: 2.9, track: 1.88, pts: [-1.6, 0, 1.6], R: 1.05, circR: 1.0, enter: 3.8,
  maxN: 22, maxF: 30.6, acc: 10, steer: 0.58, jump: false, grade: 38, camD: 9.0, camH: 1.4, seat: [-0.42, 1.55, 0.15], bodyH: 2.05, bike: false,
  exits: [[-2.2, -0.2], [2.2, -0.2], [-2.2, 1.3], [2.2, 1.3], [0, -3.8], [0, 3.8]],
  msg: "Mercedes-Benz G-Klasse: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen" };
const SPEC_GEMINI = { name: "Gemini Concept GT", wheels: [[-0.92, -1.5], [0.92, -1.5], [-0.92, 1.5], [0.92, 1.5]], wb: 3.0, track: 1.84, pts: [-1.6, 0, 1.6], R: 1.1, circR: 1.05, enter: 3.8,
  maxN: 35, maxF: 44.4, acc: 16, steer: 0.7, jump: true, grade: 45, camD: 8.5, camH: 1.2, seat: [0, 1.2, 0.1], bodyH: 1.6, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -3.8], [0, 3.8]],
  msg: "Gemini Concept GT: W/S Gas/Bremse, A/D lenken, Leertaste Sprung (ab 50 km/h), V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen" };
const SPEC_CHATGPT = { name: "ChatGPT GPT-6 Concept GT", wheels: [[-0.94, -1.5], [0.94, -1.5], [-0.94, 1.5], [0.94, 1.5]], wb: 3.0, track: 1.88, pts: [-1.65, 0, 1.65], R: 1.08, circR: 1.02, enter: 3.8,
  maxN: 38, maxF: 47.2, acc: 17, steer: 0.68, jump: false, grade: 42, camD: 8.8, camH: 1.35, seat: [0, 1.2, 0.05], bodyH: 1.5, bike: false,
  exits: [[-2.0, -0.2], [2.0, -0.2], [-2.0, 1.3], [2.0, 1.3], [0, -3.8], [0, 3.8]],
  msg: "ChatGPT GPT-6 Concept GT: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen" };
const SPEC_DEEPSEEK = { name: "DeepSeek Concept Car", wheels: [[-1.02, -1.6], [1.02, -1.6], [-1.02, 1.7], [1.02, 1.7]], wb: 3.3, track: 2.04, pts: [-1.9, 0, 1.9], R: 1.1, circR: 1.05, enter: 3.8,
  maxN: 38, maxF: 47.2, acc: 18, steer: 0.68, jump: true, grade: 45, camD: 8.8, camH: 1.2, seat: [0, 1.1, 0.1], bodyH: 1.3, bike: false,
  exits: [[-2.0, -0.2], [2.0, -0.2], [-2.0, 1.3], [2.0, 1.3], [0, -4.0], [0, 4.0]],
  msg: "DeepSeek Concept Car: W/S Gas/Bremse, A/D lenken, Leertaste Sprung (ab 50 km/h), V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen" };
const SPEC_TUMBLER = { name: "Tumbler", wheels: [[-1.0, -1.75], [1.0, -1.75], [-0.95, 1.55], [0.95, 1.55]], wb: 3.3, track: 1.95, pts: [-1.45, 0, 1.45], R: 1.25, circR: 1.15, enter: 3.8,
  maxN: 24, maxF: 30.6, acc: 14, steer: 0.72, jump: true, grade: 40, camD: 8.5, camH: 1.3, seat: [0, 1.42, 0.2], bodyH: 1.9, bike: false,
  exits: [[-2.2, -0.3], [2.2, -0.3], [-2.4, 1.2], [2.4, 1.2], [0, -3.6], [0, 3.6]],
  msg: "Tumbler: W/S Gas/Bremse, A/D lenken, Leertaste Sprung (ab 50 km/h), V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen" };
const SPEC_ROLLS = { name: "Rolls-Royce", wheels: [[-0.86, -1.78], [0.86, -1.78], [-0.86, 1.78], [0.86, 1.78]], wb: 3.56, track: 1.72, pts: [-1.95, 0, 1.95], R: 1.05, circR: 1.0, enter: 3.8,
  maxN: 30, maxF: 36.1, acc: 10, steer: 0.62, jump: false, grade: 35, camD: 9.5, camH: 1.2, seat: [-0.45, 1.32, 0.1], bodyH: 1.8, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -4.0], [0, 4.0]],
  msg: "Rolls-Royce: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, Shift aussteigen" };
const SPEC_BIKE = { name: "Motorrad", wheels: [[0, -0.72], [0, 0.72]], wb: 1.44, track: 0, pts: [-0.55, 0.55], R: 0.42, circR: 0.4, enter: 2.5,
  maxN: 32, maxF: 38.9, acc: 13, steer: 0.6, jump: false, grade: 45, camD: 5.5, camH: 1.0, seat: [0, 1.42, 0.25], bodyH: 1.7, bike: true,
  exits: [[-1.0, 0], [1.0, 0], [-1.1, 0.6], [1.1, 0.6], [0, -1.8], [0, 1.8]],
  msg: "Motorrad: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, Shift absteigen" };
const SPEC_STREETFIGHTER = { name: "Boxer-Streetfighter", wheels: [[0, -0.66 * SF_K], [0, 0.76 * SF_K]], wb: 1.42 * SF_K, track: 0, pts: [-0.7, 0.7], R: 0.46, circR: 0.45, enter: 2.6,
  maxN: 34, maxF: 50, acc: 16, steer: 0.6, jump: false, grade: 45, camD: 5.5, camH: 1.0, seat: [0, 1.42, 0.41], bodyH: 1.75, bike: true,
  exits: [[-1.0, 0], [1.0, 0], [-1.1, 0.6], [1.1, 0.6], [0, -1.9], [0, 1.9]],
  msg: "Boxer-Streetfighter: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, L Autoaufzug, Shift absteigen" };
const SPEC_BATPOD = { name: "Batpod", wheels: [[0, -1.18], [0, 1.18]], wb: 2.36, track: 0, pts: [-0.95, 0, 0.95], R: 0.5, circR: 0.5, enter: 2.8,
  maxN: 34, maxF: 41.7, acc: 15, steer: 0.55, jump: true, grade: 45, camD: 6.5, camH: 1.0, seat: [0, 1.25, 0.15], bodyH: 1.4, bike: true,
  exits: [[-1.1, 0], [1.1, 0], [-1.2, 0.8], [1.2, 0.8], [0, -2.5], [0, 2.5]],
  msg: "Batpod: W/S Gas/Bremse, A/D lenken, Leertaste Sprung (ab 50 km/h), V Kamera, R zurücksetzen, L Autoaufzug, Shift absteigen" };
function addVehicle(spec, built, x, z, y, h, label = spec.name, color = 0x16181b) {
  built.g.userData.dynamic = true; built.g.userData.noLift = true; scene.add(built.g);
  const C = { spec, g: built.g, wheels: built.wheels, jetM: built.jetM || null, flame: built.flame || null, beacon: built.beacon || null, turret: built.turret || null, gun: built.gun || null, gunMin: built.gunMin || null, elev: 0, x, z, y, h, v: 0, vy: 0, air: false, wet: false, on: false, view: 0, steer: 0, jet: 0, lean: 0,
    pitch: 0, roll: 0, circ: null, safe: null, safeT: 0, msgT: 0, settled: false, spun: false, home: { x, z, y, h }, idx: VEH.length, label, color };
  C.leave = () => { if (C.on) { C.on = false; C.v = 0; speedEl.hidden = true; engineStop(); } };
  VEH.push(C); return C;
}// ===================== Kurvenphysik (Nicolas 2026-11-12, alle Bodenfahrzeuge; gilt im Spiel (fahren.js) und in der Werkstatt) =====================
// 1 Haftgrenze: Querbeschleunigung hoechstens spec.mu x g (Vorgabe Auto 1,5, Zweirad 2,0, Panzer 1,0; spielerisch, echte Werte waeren 0,9 / 1,0 / 0,5); zu eng gelenkt ->
//   der Bogen wird weiter (Untersteuern). 2 Kurvenwiderstand: die Seitenkraft der schraeg laufenden Reifen zeigt etwas nach hinten,
//   Bremsung = Querbeschl. x (Schraeglaufwinkel bis ca. 2 Grad + 0,2 x Lenkwinkel); Motorraeder die Haelfte. 3 Radieren: was ueber der
//   Haftgrenze verlangt wird, bremst zu 12 % mit (hoechstens 0,2 x mu x g). 4 Kammscher Kreis: Antrieb braucht Haftung, mit Gas bleibt weniger
//   Seitenhaftung; Ketten (spec.tracks): Lenken kostet Antrieb und bremst mit der Drehrate (Ketten rutschen seitlich ueber den Boden).
// Rueckgabe: k = Kruemmung (1/m, Drehung = v * k), dec = Bremsung (m/s², gegen die Fahrtrichtung), thF = Faktor fuer den Antrieb.
const KURVE_G = 9.81;
// AUS (Nicolas 2026-11-12: Fahren wurde dadurch extrem langsamer und weniger spassig). Code bleibt fuer spaeter; true = wieder an.
const KURVEN_PHYSIK = false;
function kurvenPhysik(sp, v, steer, gas, vmax) {
  const av = Math.abs(v), kWant = Math.tan(steer) / sp.wb;
  if (!KURVEN_PHYSIK || av < 2) return { k: kWant, dec: 0, thF: 1 };                         // langsam: wie bisher (Rangieren, Aufzuege)
  const mu = sp.mu || (sp.tracks ? 1.0 : sp.track ? 1.5 : 2.0), muG = mu * KURVE_G;   // Nicolas 2026-11-12: spielerischer (vorher 0,5 / 0,9 / 1,0: bremste zu stark, Batpod zu weite Kurven)
  const aLong = gas > 0 && v > 0 ? sp.acc * Math.max(0, 1 - v / ((vmax || sp.maxF || 30) + 8)) : 0, x = Math.min(0.3, aLong / muG);
  const aMax = muG * Math.sqrt(1 - x * x), aWant = v * v * Math.abs(kWant), aLat = Math.min(aWant, aMax);
  const k = aWant > 1e-6 ? kWant * aLat / aWant : kWant, d = Math.abs(Math.atan(k * sp.wb));
  let dec = aLat * (0.04 * aLat / aMax + 0.2 * d) * (sp.track ? 1 : 0.5);
  if (aWant > aMax) dec += Math.min(0.2 * muG, (aWant - aMax) * 0.12);
  let thF = Math.sqrt(Math.max(0.15, 1 - (aLat / muG) ** 2));               // Kammscher Kreis andersherum: Querhaftung belegt, weniger Antrieb
  if (sp.tracks) { const w = Math.abs(v * k); dec += 1.5 * w; thF = 1 - 0.35 * Math.min(1, Math.abs(steer) / (sp.steer || 0.6)); }
  return { k, dec, thF };
}
// Schutzstufen: Treffer bis kaputt (Nicolas 2026-11-11; genutzt in schiessen.js und in der Werkstatt)
const ARMOR = { "Gotham Taxi": 1, "Aventador LP 700-4": 1, "Gemini Concept GT": 1, "ChatGPT GPT-6 Concept GT": 1, "DeepSeek Concept Car": 1, "Motorrad": 1, "Boxer-Streetfighter": 1,
  "Gotham Police": 2, "Rolls-Royce": 2, "Rolls-Royce Spectre": 2, "Nachtfalke": 2, "Batpod": 2, "Mercedes-Benz G-Klasse": 3, "Tumbler": 4, "Panzer": 4 };
