// Wayne Manor 3D – Fluggeraet "The Bat" (Batwing): Modell, Flugsteuerung, Kamera, Holen
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Nicolas 2026-11-09, ueberarbeitet ("wie eine Schildkroete", Fotos von vorne/seitlich): gewoelbter Panzer, hinten hoeher als vorne,
// der Bauch steigt nach hinten an; vorne der Kopf = Cockpit mit Glas (Batman steigt dort ein); links/rechts vorne die Arme = sechseckige
// Gondeln mit Propeller darin und Kanonen darunter; in der Mitte unter dem Bauch ein frei liegender Propeller; hinten zwei Beine nach
// aussen, die beim Lenken mitschwenken. Senkrechtstarter: schwebt, steigt, sinkt. Vorne = -z, Kufen bei y 0.
// Steuerung: E einsteigen/aussteigen (nur gelandet), W/S vor/zurueck, A/D drehen, Leertaste steigen, C sinken,
// V Kamera hinten/Cockpit, M Ton. Kollision: freier Raum (batAir) plus Boden und Wasser unter den Kufen.
// Originalmasse des Film-Requisits (Nicolas 2026-11-09): 9,14 m lang, 5,18 m breit. Modell gebaut mit 10,45 x 5,28 m -> skaliert.
const BAT_KX = 5.18 / 5.28, BAT_KZ = 9.14 / 10.45, BAT_ZC = 1.2;   // BAT_ZC: Dreh- und Kameramittelpunkt in der Rumpfmitte statt vorne (Nicolas 2026-11-10, lokal vor dem Skalieren)
function buildTheBat() {
  const g = new THREE.Group();
  const armor = M(0x2c2e33, { metalness: 0.45, roughness: 0.55, flatShading: true }), dark = M(0x18191c, { metalness: 0.5, roughness: 0.5, flatShading: true });
  const frameM = M(0x3a3d43, { metalness: 0.6, roughness: 0.4, flatShading: true }), glassM = M(0x0c141c, { metalness: 0.7, roughness: 0.08, transparent: true, opacity: 0.55 });
  const hexT = canvasTex(64, 56, (c, w, h) => { c.fillStyle = "#3a3d43"; c.fillRect(0, 0, w, h); c.fillStyle = "#0b0c0e"; for (let r = 0; r < 5; r++) for (let k = -1; k < 5; k++) { const cx = k * 16 + (r % 2) * 8, cy = r * 14; c.beginPath(); for (let a = 0; a < 6; a++) c.lineTo(cx + 6 * Math.cos(a * Math.PI / 3), cy + 6 * Math.sin(a * Math.PI / 3)); c.fill(); } });
  hexT.repeat.set(3, 3); const hexM = M(0xffffff, { map: hexT, metalness: 0.4, roughness: 0.6 });
  const thrustM = M(0x111214, { emissive: 0xff7a20, emissiveIntensity: 0, side: THREE.DoubleSide });
  const beam = (p, q, r, m, par = g) => { const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), o = new THREE.Mesh(new THREE.BoxGeometry(r, d.length(), r), m); o.position.set((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); par.add(o); return o; };
  // Kufen mit Stuetzen zum Bauch
  // (Nicolas: fahren beim Abheben in den Bauch ein und beim Landen wieder aus, eigene Gruppe, siehe batPose)
  const gear = new THREE.Group(); g.add(gear);
  // Kufen lang (Nicolas: an die lange Form angepasst), je drei Streben schraeg in die V-Platten des Kiels
  for (const sd of [-1, 1]) { boxIn(gear, sd * 1.1 - 0.07, sd * 1.1 + 0.07, 0, 0.1, -2.9, 4.3, dark); for (const [z, y] of [[-2.2, 1.35], [1.0, 1.6], [4.0, 2.0]]) beam([sd * 1.1, 0.05, z], [sd * 0.75, y, z], 0.1, dark, gear); }
  // Bauch schlank (Nicolas: eleganter), steigt nach hinten an; Panzer gewoelbt, hinten hoeher. Grundriss wie ein Fisch (Bild von oben):
  // vorne/Mitte am breitesten, nach hinten schmaler (Mittelteil lang, Seitenplatten kuerzer, breite Platten nur vorne/Mitte)
  // Bauch als Kiel (Nicolas 2026-11-09): von vorne laufen links und rechts spitz nach unten in der Mitte zusammen (V), aus einzelnen
  // schraegen Panzerplatten mit Fugen; nach hinten steigt der Kiel an und wird schmaler
  for (let zc = -1.25; zc <= 6.5; zc += 0.85) {                                                                          // laeuft bis ins lange Heck mit (Nicolas)
    const yT = 1.95 + Math.max(0, zc) * 0.06, yK = Math.min(yT - 0.3, 0.98 + Math.max(0, zc + 0.5) * 0.19), xo = Math.max(0.45, 1.7 - Math.max(0, zc - 0.9) * 0.24);
    const L = Math.hypot(xo - 0.08, yT - yK), a = Math.atan2(yT - yK, xo - 0.08);
    for (const sd of [-1, 1]) { const p = meshIn(g, new THREE.BoxGeometry(L, 0.09, 0.77), armor, sd * (xo + 0.08) / 2, (yT + yK) / 2, zc); p.rotation.z = sd * a; }
    meshIn(g, new THREE.BoxGeometry(0.16, 0.12, 0.77), dark, 0, yK - 0.02, zc);                                         // Kielleiste
  }
  prismIn(g, [[1.6, 1.9], [0.9, 2.35], [-0.4, 2.85], [-1.8, 3.2], [-2.9, 3.25], [-4.2, 3.1], [-4.2, 2.05], [-3.4, 2.05], [-1.0, 1.85], [1.0, 1.75]], 2.4, armor);   // Panzer Mitte
  // langes Heck (Nicolas 2026-11-09, Skizze): Rumpf laeuft weit nach hinten schmaler und flacher aus
  prismIn(g, [[-4.0, 3.12], [-5.3, 2.95], [-6.5, 2.6], [-6.7, 2.15], [-4.0, 1.98]], 1.8, armor);
  prismIn(g, [[-6.3, 2.65], [-7.4, 2.35], [-8.0, 2.05], [-7.7, 1.9], [-6.3, 2.02]], 1.0, armor);
  for (const sd of [-1, 1]) prismIn(g, [[-2.6, 2.9], [-3.9, 2.85], [-5.0, 2.6], [-5.2, 2.2], [-2.6, 2.0]], 0.5, armor, sd * 1.45);
  // Rumpf hinten voller (Nicolas, Skizze von oben): breite Platten hinter der Mitte, die erst kurz vor den Flossen schmaler werden
  for (const sd of [-1, 1]) {
    prismIn(g, [[-2.4, 2.75], [-3.4, 2.8], [-4.6, 2.55], [-4.9, 2.2], [-2.4, 1.95]], 1.2, armor, sd * 1.95);
    prismIn(g, [[-4.3, 2.6], [-5.4, 2.45], [-6.2, 2.2], [-6.3, 2.0], [-4.3, 1.95]], 1.0, armor, sd * 1.6);
    prismIn(g, [[-2.4, 2.25], [-4.6, 2.05], [-4.8, 1.85], [-2.4, 1.75]], 0.08, dark, sd * 2.58);                         // Schuerze hinten
  }
  for (const sd of [-1, 1]) {
    prismIn(g, [[1.3, 1.8], [0.7, 2.15], [-0.5, 2.55], [-1.9, 2.8], [-2.7, 2.65], [-3.0, 2.3], [-2.6, 2.0], [-1.0, 1.7], [0.8, 1.6]], 1.0, armor, sd * 1.7);
    prismIn(g, [[1.0, 1.75], [0.5, 2.05], [-0.5, 2.35], [-1.6, 2.5], [-2.0, 2.3], [-1.6, 1.95], [-0.4, 1.75], [0.7, 1.6]], 0.36, armor, sd * 2.38);
    prismIn(g, [[0.9, 1.55], [0.3, 1.85], [-0.6, 2.05], [-1.7, 2.15], [-1.9, 1.9], [-0.5, 1.6], [0.6, 1.45]], 0.08, dark, sd * 2.6);   // Schuerze
    meshIn(g, new THREE.BoxGeometry(0.8, 0.04, 0.95), hexM, sd * 0.62, 2.66, -0.25, -0.36);                              // Wabengitter vorne auf dem Panzer
    meshIn(g, new THREE.BoxGeometry(0.7, 0.04, 0.8), hexM, sd * 1.6, 2.4, -0.1, -0.3);
  }
  boxIn(g, -0.12, 0.12, 3.2, 3.36, -0.2, 3.2, frameM); beam([0, 3.28, 3.2], [0, 2.5, 7.7], 0.22, frameM); boxIn(g, -0.25, 0.25, 2.62, 2.72, -1.2, -0.5, frameM);             // Mittelgrat, Lueftung
  // Kopf, Gondeln und Kanonen als Gruppe (Nicolas 2026-11-09): tiefer und etwas weiter vorne als der Panzer
  const HD = [0, -0.45, -0.4], hd = new THREE.Group(); hd.position.set(...HD); g.add(hd);
  // Kopf (Cockpit): Glaskanzel mit Rahmen, Kinnplatte
  prismIn(hd, [[3.3, 1.25], [3.4, 1.6], [3.2, 2.2], [2.6, 2.42], [1.2, 2.45], [1.2, 1.25]], 1.2, glassM);
  boxIn(hd, -0.65, 0.65, 0.95, 1.25, -3.45, -1.1, frameM); boxIn(hd, -0.45, 0.45, 1.0, 1.45, -3.55, -3.3, frameM);         // Boden, Kinnplatte
  for (const sd of [-1, 1]) { beam([sd * 0.62, 1.25, -3.32], [sd * 0.62, 2.2, -3.18], 0.09, frameM, hd); beam([sd * 0.62, 2.2, -3.18], [sd * 0.62, 2.45, -2.6], 0.09, frameM, hd); beam([sd * 0.62, 2.45, -2.6], [sd * 0.62, 2.48, -1.2], 0.09, frameM, hd); }
  boxIn(hd, -0.66, 0.66, 2.2, 2.27, -3.25, -3.1, frameM);                                                                  // Rahmen oben vorne
  boxIn(hd, -0.25, 0.25, 1.25, 1.75, -2.1, -1.6, dark);                                                                    // Sitz
  // Arme: Streben vom Panzer zu den sechseckigen Gondeln, Gondeln mit Rand, Kanonen darunter, Lampe
  const podM = M(0x2c2e33, { metalness: 0.45, roughness: 0.55, flatShading: true, side: THREE.DoubleSide });
  const PX = 1.8, PY = 1.25, PZ = -4.1;                                                                 // Gondeln vor dem Cockpit (Nicolas: von oben gesehen vor dem Kopf)
  for (const sd of [-1, 1]) {
    beam([sd * 0.95, 1.95, -1.4], [sd * PX, PY + 0.45 + HD[1], PZ + 0.45 + HD[2]], 0.2, armor); beam([sd * 0.6, 1.2, -2.2], [sd * PX, PY - 0.35, PZ + 0.45], 0.12, dark, hd);   // Arme: oben vom Panzer, unten von der Kanzel
    meshIn(hd, new THREE.CylinderGeometry(0.7, 0.7, 1.82, 6, 1, true).rotateY(Math.PI / 6).rotateX(Math.PI / 2), podM, sd * PX, PY, PZ + 0.26);   // 40 % laenger nach hinten (Nicolas)    // Gondel (offen, beidseitig sichtbar: innen war sie aus manchen Winkeln unsichtbar)
    meshIn(hd, new THREE.CylinderGeometry(0.7, 0.7, 0.05, 6).rotateY(Math.PI / 6).rotateX(Math.PI / 2), dark, sd * PX, PY, PZ + 1.14);    // Rueckwand
    meshIn(hd, new THREE.CylinderGeometry(0.12, 0.12, 0.5, 10).rotateX(Math.PI / 2), frameM, sd * PX, PY, PZ + 0.2);                         // Nabe
    // Kanonen (Nicolas 2026-11-09): unten gekuerzt, dazu innen (zur Kanzel hin) eine zweite, je ein grosses Rohr 0,7 m
    meshIn(hd, new THREE.CylinderGeometry(0.1, 0.1, 0.7, 10), dark, sd * PX, PY - 0.62, PZ - 0.7, Math.PI / 2);                          // unten: ein grosses Rohr (Nicolas)
    meshIn(hd, new THREE.CylinderGeometry(0.1, 0.1, 1.4, 10), dark, sd * (PX - 0.72), PY, PZ - 1.05, Math.PI / 2);                       // innen: ein grosses Rohr, doppelt so lang (1,4 m, Nicolas)
    boxIn(hd, sd * (PX - 0.72) - 0.1, sd * (PX - 0.72) + 0.1, PY - 0.25, PY + 0.25, PZ - 0.45, PZ + 0.3, frameM);           // Halter innen
    boxIn(hd, sd * PX - 0.1, sd * PX + 0.1, PY - 0.75, PY - 0.5, PZ - 0.7, PZ + 0.3, frameM);
    boxIn(hd, sd * (PX + 0.55) - 0.08, sd * (PX + 0.55) + 0.08, PY - 0.45, PY - 0.3, PZ - 0.66, PZ - 0.63, mat.glow);
  }
  mergeStatic(hd);
  mergeStatic(g);
  // Bewegliche Teile: Propeller unter dem Bauch (frei), Propeller in den Gondeln, Beine hinten
  // zwei Propeller unter dem Kiel (Nicolas): vorne und hinten, je mit Schubgluehen
  const rotors = [[-0.6, 0.72], [3.2, 1.38]].map(([z, y]) => {
    const r = new THREE.Group(); r.position.set(0, y, z); g.add(r); r.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 10), frameM));
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.2), dark); b.position.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); b.rotation.y = a; b.rotation.x = 0.3; r.add(b); }
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24).rotateX(Math.PI / 2), thrustM); gl.position.set(0, y - 0.12, z); g.add(gl);
    return r;
  });
  const fans = [-1, 1].map(sd => {
    const f = new THREE.Group(); f.position.set(sd * PX, PY, PZ - 0.1); hd.add(f);
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.03), frameM); b.position.set(Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0); b.rotation.z = a - Math.PI / 2; b.rotation.y = 0.4; f.add(b); }
    return f;
  });
  // Flossen am Heckende (Nicolas): nicht gezackt, sondern zwei flache Platten mit geraden Kanten uebereinander, schraeg nach hinten aussen
  // und leicht nach unten; schwenken beim Lenken mit
  const legs = [-1, 1].map(sd => {
    const lg = new THREE.Group(); lg.position.set(sd * 0.45, 2.3, 6.2); lg.rotation.z = -sd * 0.45; g.add(lg); lg.userData.sd = sd;
    for (const [dy, k, m] of [[0, 1, podM], [-0.2, 0.82, dark]]) {
      const sh = new THREE.Shape(); [[0, 0], [sd * 0.9, 0.3], [sd * 2.0, 1.35], [sd * 1.95, 1.75], [sd * 0.7, 1.6], [0, 1.3]].forEach(([x, z], i) => i ? sh.lineTo(x * k, z * k) : sh.moveTo(x * k, z * k));
      const p = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false }).rotateX(Math.PI / 2), m); p.position.set(0, dy, 0.05 * (1 - k)); lg.add(p);
    }
    return lg;
  });
  for (const o of g.children) o.position.z -= BAT_ZC;                                                                    // Ursprung = Rumpfmitte
  g.scale.set(BAT_KX, 1, BAT_KZ);                                                                                         // auf Originalmasse (siehe BAT_KX)
  return { g, rotors, fans, legs, gear, thrustM };
}
const BAT_PTS = [[0, 1.3, 0], [0, 1.15, -3.9], [-1.8, 0.8, -5.1], [1.8, 0.8, -5.1], [-1.8, 0.15, -5.6], [1.8, 0.15, -5.6], [-1.08, 0.8, -6.25], [1.08, 0.8, -6.25], [-2.5, 0.8, -4.5], [2.5, 0.8, -4.5],
  [-2.6, 2.1, -0.6], [2.6, 2.1, -0.6], [-2.2, 2.3, 2.0], [2.2, 2.3, 2.0], [0, 3.35, 1.0], [-1.6, 2.3, 4.6], [1.6, 2.3, 4.6], [-2.5, 2.3, 4.0], [2.5, 2.3, 4.0], [-2.05, 2.2, 5.9], [2.05, 2.2, 5.9], [0, 2.4, 7.9], [-2.4, 2.1, 7.6], [2.4, 2.1, 7.6], [-1.1, 2.2, 7.8], [1.1, 2.2, 7.8]].map(([x, y, z]) => [x * BAT_KX, y, (z - BAT_ZC) * BAT_KZ]);   // Pruefpunkte (lokal): Kopf, Gondeln, Kanonen, Panzer, Heck, Beine
const BAT_FEET = [[-1.1, -2.7], [1.1, -2.7], [-1.1, 4.1], [1.1, 4.1], [0, 0.6]].map(([x, z]) => [x * BAT_KX, (z - BAT_ZC) * BAT_KZ]);                                         // Kufen
const FLY = (() => {
  const b = buildTheBat();
  // Standplatz: untere Batcave auf der freien Flaeche vor dem Batcomputer, Nase nach Osten zur Halle und zum See (der Hangar oben ist fuer
  // 8,5 x 5,8 m zu eng und nur 8,5 m hoch). Hinaus geht es ueber den See und durch den Wassertunnel aufs Meer.
  const F = { g: b.g, rotors: b.rotors, fans: b.fans, legs: b.legs, gear: b.gear, gearT: 0, thrustM: b.thrustM, st: 0, x: -47 - BAT_ZC * BAT_KZ, y: LY, z: -3, h: -Math.PI / 2, vx: 0, vy: 0, vz: 0, on: false, view: 0, pitch: 0, roll: 0, spin: 0, thrust: 0, circ: [] };
  F.home = { x: F.x, y: F.y, z: F.z, h: F.h };
  b.g.userData.dynamic = true; b.g.userData.noLift = true; scene.add(b.g);
  for (let k = 0; k < 4; k++) { const c = [0, 0, 2.2, 0]; circles.push(c); F.circ.push(c); }                             // Kollision fuer Fussgaenger entlang des Rumpfs
  return F;
})();
// Welt-Punkt aus lokalem Punkt (vorne = -z)
function batW(B, lx, lz, x = B.x, z = B.z, h = B.h) { const s = Math.sin(h), c = Math.cos(h); return [x + lx * c + lz * s, z - lx * s + lz * c]; }
function batNear(B) { const R = 18; nearS = solids.filter(s => s.x1 > B.x - R && s.x0 < B.x + R && s.z1 > B.z - R && s.z0 < B.z + R); nearC = circles.filter(c => !FLY.circ.includes(c) && Math.abs(c[0] - B.x) < R + c[2] && Math.abs(c[1] - B.z) < R + c[2]); }
// Punkt im freien Luftraum? Wie die Fahrzeugkamera (camBlocked), in der unteren Hoehle aber mit den echten Deckenhoehen:
// Halle ab LY+LH-3,8, Seegewoelbe ab SEA_Y+11,2 (jeweils mit Rand nach innen, Nicolas: Barrieren lieber weiter innen), auch ueber dem Wasser
function batAir(x, y, z) {
  for (const s of nearS) if (s.on && x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && y > s.y0 && y < s.y1) return false;
  for (const [cx, cz, r, top] of nearC) if (r > 0 && (x - cx) ** 2 + (z - cz) ** 2 < r * r && (top === undefined ? y > terrainH(cx, cz) - 3 : y < top && y > top - 8)) return false;
  if (y >= terrainH(x, z) + 0.2) return true;
  if (y > SEA_Y - 0.5 && y < UY - 4 && [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]].every(([a, b]) => caveAt(x + a, z + b) !== 0)) return y < (polySD(LAKE_W, x, z) > 6 ? LY + LH - 4.4 : SEA_Y + 10.9);
  return !camBlocked(x, y, z);
}
// Lage frei? Koerperpunkte im freien Raum, Kufen ueber Boden und Wasser
function batFree(B, x, y, z, h) {
  for (const [lx, ly, lz] of BAT_PTS) { const [px, pz] = batW(B, lx, lz, x, z, h); if (!batAir(px, y + ly, pz)) return false; }
  for (const [lx, lz] of BAT_FEET) { const [px, pz] = batW(B, lx, lz, x, z, h), w = waterAt(px, pz); if (y < supportAt(new THREE.Vector3(px, y + 0.6, pz), y + 0.6) - 0.02 || (w !== null && y < w + 0.4)) return false; }
  return Math.hypot(x, z) < LIMIT && y < 400;
}
function batPose(B, dt) {
  B.g.position.set(B.x, B.y, B.z); B.g.rotation.set(B.pitch, B.h, B.roll, "YXZ");
  B.spin += dt * (6 + B.thrust * 30); for (const r of B.rotors) r.rotation.y = B.spin; for (const f of B.fans) f.rotation.z = B.spin * 1.4;
  B.gear.position.y = B.gearT * 0.9; B.gear.visible = B.gearT < 0.97;                                                    // Kufen ein-/ausgefahren
  for (const lg of B.legs) { lg.rotation.y = 0; lg.rotation.z = -lg.userData.sd * 0.45 + B.st * 0.45; }                // Flossen klappen beim Lenken wie Querruder gegenlaeufig hoch/runter, kein Schwenken zur Seite (Nicolas)                                       // Beine schwenken beim Lenken mit (wie Ruder) B.thrustM.emissiveIntensity = B.thrust * 2.2;
  const pts = [[0, -2.6], [0, 0], [0, 2.6], [0, 5.6]].map(([x, z]) => [x, z - BAT_ZC * BAT_KZ]); B.circ.forEach((c, i) => { const [x, z] = batW(B, pts[i][0], pts[i][1]); c[0] = x; c[1] = z; c[2] = B.on || B.landing ? 0 : 2.0; c[3] = B.y + 2.6; });
}
function batCamera(B) {
  player.pos.set(B.x, B.y + 0.6, B.z);
  if (B.view === 1) { const [x, z] = batW(B, 0, -2.3 - BAT_ZC * BAT_KZ); camera.position.set(x, B.y + 1.45, z); camera.rotation.set(player.pitch, player.yaw, 0, "YXZ"); return; }
  // Rundum-Ansicht (Nicolas 2026-11-09): Kamera auf einer Kugel um The Bat, Maus hoch/runter bis ueber und unter das Fluggeraet
  // (Hoehenwinkel e aus player.pitch: Standard -0,2 -> e 0,4 = leicht von oben)
  // Nicolas 2026-11-10: weiter weg (gross), Mittelpunkt Rumpfmitte; nie naeher als DMIN (sonst Ansicht im Rumpf), statt naeher ruecken wird die Kamera angehoben
  const D = 21, DMIN = 10.5, tx = B.x, ty = B.y + 1.8, tz = B.z;
  for (let e = Math.max(-1.4, Math.min(1.45, 0.2 - player.pitch)); ; e = Math.min(1.45, e + 0.1)) {
    const dx = Math.sin(player.yaw) * Math.cos(e) * D, H = Math.sin(e) * D, dz = Math.cos(player.yaw) * Math.cos(e) * D;
    let k = 1; for (let t = 0.12; t <= 1.0001; t += 0.04) if (!batAir(tx + dx * t, ty + H * t, tz + dz * t)) { k = t - 0.05; break; }
    if (k * D >= DMIN || e >= 1.45) { k = Math.max(k, DMIN / D); camera.position.set(tx + dx * k, ty + H * k, tz + dz * k); break; } }
  camera.lookAt(tx, ty + 0.4, tz);
}
function useFly() {
  if (!walking || ghost) return false;
  const B = FLY, p = player.pos;
  if (B.on) {
    batNear(B);
    if (batFree(B, B.x, B.y - 0.15, B.z, B.h)) { toast("Zum Aussteigen landen (C sinken)"); return true; }
    for (const [lx, lz] of [[3.4, 0.5], [-3.4, 0.5], [0, 5.2], [3.4, -2.5], [-3.4, -2.5]].map(([x, z]) => [x, z - BAT_ZC * BAT_KZ])) {
      const [x, z] = batW(B, lx, lz), q = new THREE.Vector3(x, B.y + 1.5, z), top = supportAt(q, B.y + 1.5);
      if (Math.abs(top - B.y) > 1.2) continue;
      B.on = false; B.vx = B.vz = B.vy = 0; B.thrust = 0; B.gearT = 0; engineStop(); batPose(B, 0);
      player.pos.set(x, top, z); player.vy = 0; speedEl.hidden = true; toast("Ausgestiegen"); return true;
    }
    toast("Hier ist kein Platz zum Aussteigen"); return true;
  }
  if (Math.hypot(p.x - B.x, p.z - B.z) > 5.5 || Math.abs(p.y - B.y) > 3) return false;
  if (world.userData.car) world.userData.car.leave();
  B.on = true; B.landing = null; B.view = 0; keys.clear(); player.yaw = B.h; player.pitch = -0.2;
  toast("The Bat: W/S vor/zurück, A/D drehen, Leertaste steigen, C sinken, V Kamera, E aussteigen (gelandet)");
  engineStart("The Bat"); speedEl.hidden = false; return true;
}
function flyStep(dt) {
  const B = FLY; batNear(B);
  let th = 0, st = 0, up = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) th += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) th -= 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) st += 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) st -= 1;
  if (keys.has("Space") || jumpHeld) up += 1;
  if (keys.has("KeyC") || downHeld) up -= 1;                                                             // nur C (Nicolas: kein Strg, Strg loest Browser-Kuerzel aus)
  th -= moveStick.y; st -= moveStick.x;
  look(lookStick.x * 2.6 * dt, lookStick.y * 1.8 * dt);
  const fast = true, max = 70, acc = 24;                                                                  // nur W, kein Shift (Nicolas 2026-11-09)
  B.st += (st - B.st) * Math.min(1, dt * 5);
  const dh = st * 1.15 * dt; B.h = wrapA(B.h + dh); player.yaw += dh;
  const fx = -Math.sin(B.h), fz = -Math.cos(B.h);
  B.vx += fx * th * acc * dt; B.vz += fz * th * acc * dt;
  const damp = Math.exp(-(th ? 0.35 : 0.9) * dt); B.vx *= damp; B.vz *= damp;                                              // ohne Gas bremst die Luft
  const sp = Math.hypot(B.vx, B.vz); if (sp > max) { B.vx *= max / sp; B.vz *= max / sp; }
  B.vy += ((fast ? 12 : 7) * up - B.vy) * Math.min(1, dt * 3);                                                          // Senkrechtstarter: Hoehe halten, steigen, sinken
  // Bewegen mit Kollision: erst alles, sonst je Achse (gleitet an Waenden entlang)
  const nx = B.x + B.vx * dt, ny = B.y + B.vy * dt, nz = B.z + B.vz * dt;
  if (batFree(B, nx, ny, nz, B.h)) { B.x = nx; B.y = ny; B.z = nz; }
  else {
    if (batFree(B, nx, B.y, B.z, B.h)) B.x = nx; else B.vx *= -0.2;
    if (batFree(B, B.x, B.y, nz, B.h)) B.z = nz; else B.vz *= -0.2;
    if (batFree(B, B.x, ny, B.z, B.h)) B.y = ny; else B.vy = 0;
  }
  if (!batFree(B, B.x, B.y, B.z, B.h + 1e-9)) B.h -= dh;                                                                  // Drehung gegen eine Wand zuruecknehmen
  const landed = !batFree(B, B.x, B.y - 0.1, B.z, B.h);
  const agl = B.y - supportAt(new THREE.Vector3(B.x, B.y + 0.6, B.z), B.y + 0.6), gearIn = !landed && agl > 1.5 && !(agl < 3 && (up < 0 || B.vy < -0.5));
  B.gearT = Math.min(1, Math.max(0, B.gearT + (gearIn ? 1 : -1) * dt * 1.3));                                            // Kufen: ab 1,5 m ein, unter 3 m beim Sinken aus
  B.thrust += ((landed && !up && !th ? 0.05 : 0.35 + 0.65 * Math.max(Math.abs(th), Math.max(0, up))) - B.thrust) * Math.min(1, dt * 3);
  // Lage: beim Beschleunigen Nase etwas runter, in Kurven schraeg, im Schweben leichtes Wiegen
  const along = B.vx * fx + B.vz * fz, t = performance.now() / 1000;
  B.pitch += ((landed ? 0 : -0.12 * th - along * 0.002 + 0.015 * Math.sin(t * 1.3)) - B.pitch) * Math.min(1, dt * 3);
  B.roll += ((landed ? 0 : st * Math.min(0.35, 0.1 + sp / 80) + 0.012 * Math.sin(t * 1.7)) - B.roll) * Math.min(1, dt * 3);
  // Beim Vorwaertsfliegen gleitet die Ansicht langsam zurueck hinter The Bat in die Standardhoehe (Nicolas 2026-11-09)
  if (B.view === 0 && along > 3 && th > 0) { const k = Math.min(1, dt * 0.9); player.yaw += Math.atan2(Math.sin(B.h - player.yaw), Math.cos(B.h - player.yaw)) * k; player.pitch += (-0.2 - player.pitch) * k; }
  batPose(B, dt); batCamera(B);
  speedEl.textContent = Math.round(sp * 3.6) + " km/h · " + Math.max(0, Math.round(B.y - supportAt(new THREE.Vector3(B.x, B.y + 0.6, B.z), B.y + 0.6))) + " m über Boden";
  engineUpdate({ v: sp + Math.abs(B.vy) * 2, throttle: B.thrust, air: false, wet: false });
}
// T-Menue: The Bat zum Spieler holen (schwebt neben ihm ein, falls dort Platz ist)
function summonBat() {
  if (!walking || ghost) { toast("Zuerst „Begehen“ starten, dann The Bat holen"); return false; }
  const B = FLY, p = player.pos; if (B.on) return toast("Du sitzt schon in The Bat"), false;
  batNear({ x: p.x, z: p.z });
  // Nicolas 2026-11-09: wenn ueber dir genug Platz ist, erscheint The Bat hoch ueber dir und landet langsam auf dir (danach direkt drin)
  for (let k = 0; k < 8; k++) for (let dy = 0; dy <= 1.0; dy += 0.2) {                // 8 Ausrichtungen, bis 1 m Unebenheit
    const h = player.yaw + k * Math.PI / 4, ty = supportAt(new THREE.Vector3(p.x, p.y + 1, p.z), p.y + 1) + 0.02 + dy; let H = 0;
    if (!batFree(B, p.x, ty, p.z, h)) continue;
    for (let d = 2; d <= 30; d += 2) { if (!batFree(B, p.x, ty + d, p.z, h)) break; H = d; }
    if (H >= 8) { Object.assign(B, { x: p.x, y: ty + H, z: p.z, h, vx: 0, vy: 0, vz: 0, gearT: 1, landing: { y: ty } }); batPose(B, 0); engineStart("The Bat"); toast("The Bat landet über dir"); return true; } }
  for (const [r, a] of [[7, 0], [7, Math.PI], [7, Math.PI / 2], [7, -Math.PI / 2], [10, 0], [10, Math.PI]]) {
    const ang = player.yaw + a, x = p.x - Math.sin(ang) * r, z = p.z - Math.cos(ang) * r, h = player.yaw;
    const y = supportAt(new THREE.Vector3(x, p.y + 1, z), p.y + 1);
    if (Math.abs(y - p.y) < 2.5 && batFree(B, x, y + 0.02, z, h)) { Object.assign(B, { x, y: y + 0.02, z, h, vx: 0, vy: 0, vz: 0, gearT: 0 }); batPose(B, 0); toast("The Bat ist gelandet (E einsteigen)"); return true; }
  }
  toast("Hier ist kein Platz für The Bat"); return false;
}
// Landeanflug nach dem Holen (siehe summonBat): sinkt langsam (zum Schluss sanfter), Kufen fahren aus; steht der Spieler darunter, sitzt er danach drin
function batLandStep(dt) {
  const B = FLY, L = B.landing; if (!L) return;
  B.y = Math.max(L.y, B.y - Math.min(7, 0.8 + (B.y - L.y) * 0.7) * dt); B.thrust = 0.5; if (B.y - L.y < 4) B.gearT = Math.max(0, B.gearT - dt * 1.3);
  batPose(B, dt);
  if (B.y > L.y + 1e-3) return;
  B.landing = null; B.gearT = 0; B.thrust = 0; batPose(B, 0); engineStop();
  if (!useFly()) toast("The Bat ist gelandet (E einsteigen)");
}
batPose(FLY, 0);
// Verlassen (Esc, Geist, anderes Fahrzeug) setzt auch The Bat ab: bleibt, wo sie ist
{ const prev = world.userData.car.leave; world.userData.car.leave = () => { prev(); if (BOAT.on) { BOAT.on = false; BOAT.v = 0; engineStop(); } if (FLY.on) { FLY.on = false; FLY.vx = FLY.vy = FLY.vz = 0; FLY.thrust = 0; engineStop(); speedEl.hidden = true; batPose(FLY, 0); } }; }
