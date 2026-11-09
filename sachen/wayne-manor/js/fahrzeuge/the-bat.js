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
const BAT_KX = 5.18 / 5.28, BAT_KZ = 9.14 / 10.45;
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
  for (const sd of [-1, 1]) { boxIn(gear, sd * 1.1 - 0.07, sd * 1.1 + 0.07, 0, 0.1, -1.9, 2.1, dark); beam([sd * 1.1, 0.05, -1.3], [sd * 0.6, 1.3, -1.3], 0.1, dark, gear); beam([sd * 1.1, 0.05, 1.7], [sd * 0.6, 1.7, 1.7], 0.1, dark, gear); }
  // Bauch schlank (Nicolas: eleganter), steigt nach hinten an; Panzer gewoelbt, hinten hoeher. Grundriss wie ein Fisch (Bild von oben):
  // vorne/Mitte am breitesten, nach hinten schmaler (Mittelteil lang, Seitenplatten kuerzer, breite Platten nur vorne/Mitte)
  // Bauch als Kiel (Nicolas 2026-11-09): von vorne laufen links und rechts spitz nach unten in der Mitte zusammen (V), aus einzelnen
  // schraegen Panzerplatten mit Fugen; nach hinten steigt der Kiel an und wird schmaler
  for (let zc = -1.25; zc <= 3.0; zc += 0.85) {
    const yK = 0.98 + Math.max(0, zc + 0.5) * 0.28, yT = 1.95 + Math.max(0, zc) * 0.1, xo = 1.7 - Math.max(0, zc - 0.9) * 0.35;
    const L = Math.hypot(xo - 0.08, yT - yK), a = Math.atan2(yT - yK, xo - 0.08);
    for (const sd of [-1, 1]) { const p = meshIn(g, new THREE.BoxGeometry(L, 0.09, 0.77), armor, sd * (xo + 0.08) / 2, (yT + yK) / 2, zc); p.rotation.z = sd * a; }
    meshIn(g, new THREE.BoxGeometry(0.16, 0.12, 0.77), dark, 0, yK - 0.02, zc);                                         // Kielleiste
  }
  prismIn(g, [[1.6, 1.9], [0.9, 2.35], [-0.4, 2.85], [-1.8, 3.2], [-2.9, 3.25], [-3.6, 2.95], [-3.95, 2.45], [-3.4, 2.15], [-1.0, 1.85], [1.0, 1.75]], 2.4, armor);   // Panzer Mitte
  for (const sd of [-1, 1]) {
    prismIn(g, [[1.3, 1.8], [0.7, 2.15], [-0.5, 2.55], [-1.9, 2.8], [-2.7, 2.65], [-3.0, 2.3], [-2.6, 2.0], [-1.0, 1.7], [0.8, 1.6]], 1.0, armor, sd * 1.7);
    prismIn(g, [[1.0, 1.75], [0.5, 2.05], [-0.5, 2.35], [-1.6, 2.5], [-2.0, 2.3], [-1.6, 1.95], [-0.4, 1.75], [0.7, 1.6]], 0.36, armor, sd * 2.38);
    prismIn(g, [[0.9, 1.55], [0.3, 1.85], [-0.6, 2.05], [-1.7, 2.15], [-1.9, 1.9], [-0.5, 1.6], [0.6, 1.45]], 0.08, dark, sd * 2.6);   // Schuerze
    meshIn(g, new THREE.BoxGeometry(0.8, 0.04, 0.95), hexM, sd * 0.62, 2.66, -0.25, -0.36);                              // Wabengitter vorne auf dem Panzer
    meshIn(g, new THREE.BoxGeometry(0.7, 0.04, 0.8), hexM, sd * 1.6, 2.4, -0.1, -0.3);
  }
  boxIn(g, -0.12, 0.12, 3.2, 3.36, -0.2, 3.2, frameM); boxIn(g, -0.25, 0.25, 2.62, 2.72, -1.2, -0.5, frameM);             // Mittelgrat, Lueftung
  // Kopf (Cockpit): Glaskanzel mit Rahmen, Kinnplatte
  prismIn(g, [[3.3, 1.25], [3.4, 1.6], [3.2, 2.2], [2.6, 2.42], [1.2, 2.45], [1.2, 1.25]], 1.2, glassM);
  boxIn(g, -0.65, 0.65, 0.95, 1.25, -3.45, -1.1, frameM); boxIn(g, -0.45, 0.45, 1.0, 1.45, -3.55, -3.3, frameM);         // Boden, Kinnplatte
  for (const sd of [-1, 1]) { beam([sd * 0.62, 1.25, -3.32], [sd * 0.62, 2.2, -3.18], 0.09, frameM); beam([sd * 0.62, 2.2, -3.18], [sd * 0.62, 2.45, -2.6], 0.09, frameM); beam([sd * 0.62, 2.45, -2.6], [sd * 0.62, 2.48, -1.2], 0.09, frameM); }
  boxIn(g, -0.66, 0.66, 2.2, 2.27, -3.25, -3.1, frameM);                                                                  // Rahmen oben vorne
  boxIn(g, -0.25, 0.25, 1.25, 1.75, -2.1, -1.6, dark);                                                                    // Sitz
  // Arme: Streben vom Panzer zu den sechseckigen Gondeln, Gondeln mit Rand, Kanonen darunter, Lampe
  const podM = M(0x2c2e33, { metalness: 0.45, roughness: 0.55, flatShading: true, side: THREE.DoubleSide });
  const PX = 1.8, PY = 1.25, PZ = -4.1;                                                                 // Gondeln vor dem Cockpit (Nicolas: von oben gesehen vor dem Kopf)
  for (const sd of [-1, 1]) {
    beam([sd * 0.95, 1.95, -1.4], [sd * PX, PY + 0.45, PZ + 0.45], 0.2, armor); beam([sd * 0.6, 1.2, -2.2], [sd * PX, PY - 0.35, PZ + 0.45], 0.12, dark);   // Arme
    meshIn(g, new THREE.CylinderGeometry(0.7, 0.7, 1.3, 6, 1, true).rotateY(Math.PI / 6).rotateX(Math.PI / 2), podM, sd * PX, PY, PZ);    // Gondel (offen, beidseitig sichtbar: innen war sie aus manchen Winkeln unsichtbar)
    meshIn(g, new THREE.CylinderGeometry(0.7, 0.7, 0.05, 6).rotateY(Math.PI / 6).rotateX(Math.PI / 2), dark, sd * PX, PY, PZ + 0.62);    // Rueckwand
    meshIn(g, new THREE.CylinderGeometry(0.12, 0.12, 0.5, 10).rotateX(Math.PI / 2), frameM, sd * PX, PY, PZ + 0.2);                         // Nabe
    for (const dx of [-0.13, 0.13]) meshIn(g, new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), dark, sd * PX + dx, PY - 0.62, PZ - 1.0, Math.PI / 2);   // Kanonen
    boxIn(g, sd * PX - 0.1, sd * PX + 0.1, PY - 0.75, PY - 0.5, PZ - 0.7, PZ + 0.3, frameM);
    boxIn(g, sd * (PX + 0.55) - 0.08, sd * (PX + 0.55) + 0.08, PY - 0.45, PY - 0.3, PZ - 0.66, PZ - 0.63, mat.glow);
  }
  mergeStatic(g);
  // Bewegliche Teile: Propeller unter dem Bauch (frei), Propeller in den Gondeln, Beine hinten
  const rotor = new THREE.Group(); rotor.position.set(0, 0.98, 0.3); g.add(rotor);
  rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.2, 10), frameM));
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.03, 0.24), dark); b.position.set(Math.cos(a) * 0.68, 0, -Math.sin(a) * 0.68); b.rotation.y = a; b.rotation.x = 0.3; rotor.add(b); }
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24).rotateX(Math.PI / 2), thrustM); glow.position.set(0, 0.86, 0.3); g.add(glow);
  const fans = [-1, 1].map(sd => {
    const f = new THREE.Group(); f.position.set(sd * PX, PY, PZ - 0.1); g.add(f);
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.03), frameM); b.position.set(Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0); b.rotation.z = a - Math.PI / 2; b.rotation.y = 0.4; f.add(b); }
    return f;
  });
  // Flossen hinten wie eine Schwanzflosse (Nicolas, Skizze von oben): flache Spitzen schraeg nach hinten aussen, schwenken beim Lenken mit
  const legs = [-1, 1].map(sd => {
    const lg = new THREE.Group(); lg.position.set(sd * 1.2, 2.15, 2.8); lg.rotation.z = -sd * 0.12; g.add(lg); lg.userData.sd = sd;
    const sh = new THREE.Shape(); [[0, 0], [sd * 0.65, 0.55], [sd * 1.2, 2.05], [sd * 0.45, 1.3], [0, 1.05]].forEach(([x, z], k) => k ? sh.lineTo(x, z) : sh.moveTo(x, z));
    lg.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }).rotateX(Math.PI / 2), armor));
    const edge = new THREE.Shape(); [[sd * 0.65, 0.55], [sd * 1.2, 2.05], [sd * 1.05, 1.95], [sd * 0.55, 0.62]].forEach(([x, z], k) => k ? edge.lineTo(x, z) : edge.moveTo(x, z));
    const e = new THREE.Mesh(new THREE.ExtrudeGeometry(edge, { depth: 0.16, bevelEnabled: false }).rotateX(Math.PI / 2), dark); e.position.y = 0.02; lg.add(e);
    return lg;
  });
  g.scale.set(BAT_KX, 1, BAT_KZ);                                                                                         // auf Originalmasse (siehe BAT_KX)
  return { g, rotor, fans, legs, gear, thrustM };
}
const BAT_PTS = [[0, 1.3, 0], [0, 1.6, -3.5], [-1.8, 1.25, -4.7], [1.8, 1.25, -4.7], [-1.8, 0.6, -5.6], [1.8, 0.6, -5.6], [-2.5, 1.25, -4.1], [2.5, 1.25, -4.1],
  [-2.6, 2.1, -0.6], [2.6, 2.1, -0.6], [-2.2, 2.3, 2.0], [2.2, 2.3, 2.0], [0, 3.35, 1.0], [0, 2.6, 3.95], [-2.4, 1.95, 4.85], [2.4, 1.95, 4.85]].map(([x, y, z]) => [x * BAT_KX, y, z * BAT_KZ]);   // Pruefpunkte (lokal): Kopf, Gondeln, Kanonen, Panzer, Heck, Beine
const BAT_FEET = [[-1.1, -1.8], [1.1, -1.8], [-1.1, 2.0], [1.1, 2.0], [0, 0.3]].map(([x, z]) => [x * BAT_KX, z * BAT_KZ]);                                         // Kufen
const FLY = (() => {
  const b = buildTheBat();
  // Standplatz: untere Batcave auf der freien Flaeche vor dem Batcomputer, Nase nach Osten zur Halle und zum See (der Hangar oben ist fuer
  // 8,5 x 5,8 m zu eng und nur 8,5 m hoch). Hinaus geht es ueber den See und durch den Wassertunnel aufs Meer.
  const F = { g: b.g, rotor: b.rotor, fans: b.fans, legs: b.legs, gear: b.gear, gearT: 0, thrustM: b.thrustM, st: 0, x: -47, y: LY, z: -3, h: -Math.PI / 2, vx: 0, vy: 0, vz: 0, on: false, view: 0, pitch: 0, roll: 0, spin: 0, thrust: 0, circ: [] };
  F.home = { x: F.x, y: F.y, z: F.z, h: F.h };
  b.g.userData.dynamic = true; b.g.userData.noLift = true; scene.add(b.g);
  for (let k = 0; k < 3; k++) { const c = [0, 0, 2.2, 0]; circles.push(c); F.circ.push(c); }                             // Kollision fuer Fussgaenger (Mitte, vorne, hinten)
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
  B.spin += dt * (6 + B.thrust * 30); B.rotor.rotation.y = B.spin; for (const f of B.fans) f.rotation.z = B.spin * 1.4;
  B.gear.position.y = B.gearT * 0.9; B.gear.visible = B.gearT < 0.97;                                                    // Kufen ein-/ausgefahren
  for (const lg of B.legs) lg.rotation.y = lg.userData.sd * 0.05 + B.st * 0.4;                                       // Beine schwenken beim Lenken mit (wie Ruder) B.thrustM.emissiveIntensity = B.thrust * 2.2;
  const pts = [[0, 0], [0, -3], [0, 2.8]]; B.circ.forEach((c, i) => { const [x, z] = batW(B, pts[i][0], pts[i][1]); c[0] = x; c[1] = z; c[2] = B.on ? 0 : 2.0; c[3] = B.y + 2.6; });
}
function batCamera(B) {
  player.pos.set(B.x, B.y + 0.6, B.z);
  if (B.view === 1) { const [x, z] = batW(B, 0, -2.0); camera.position.set(x, B.y + 1.9, z); camera.rotation.set(player.pitch, player.yaw, 0, "YXZ"); return; }
  // Rundum-Ansicht (Nicolas 2026-11-09): Kamera auf einer Kugel um The Bat, Maus hoch/runter bis ueber und unter das Fluggeraet
  // (Hoehenwinkel e aus player.pitch: Standard -0,2 -> e 0,4 = leicht von oben)
  const D = 14, e = Math.max(-1.4, Math.min(1.45, 0.2 - player.pitch)), tx = B.x, ty = B.y + 1.8, tz = B.z;
  const dx = Math.sin(player.yaw) * Math.cos(e) * D, H = Math.sin(e) * D, dz = Math.cos(player.yaw) * Math.cos(e) * D;
  let k = 1;
  for (let t = 0.12; t <= 1.0001; t += 0.06) if (!batAir(tx + dx * t, ty + H * t, tz + dz * t)) { k = Math.max(0.12, t - 0.08); break; }
  camera.position.set(tx + dx * k, ty + H * k, tz + dz * k); camera.lookAt(tx, ty + 0.4, tz);
}
function useFly() {
  if (!walking || ghost) return false;
  const B = FLY, p = player.pos;
  if (B.on) {
    batNear(B);
    if (batFree(B, B.x, B.y - 0.15, B.z, B.h)) { toast("Zum Aussteigen landen (C sinken)"); return true; }
    for (const [lx, lz] of [[3.4, 0.5], [-3.4, 0.5], [0, 5.2], [3.4, -2.5], [-3.4, -2.5]]) {
      const [x, z] = batW(B, lx, lz), q = new THREE.Vector3(x, B.y + 1.5, z), top = supportAt(q, B.y + 1.5);
      if (Math.abs(top - B.y) > 1.2) continue;
      B.on = false; B.vx = B.vz = B.vy = 0; B.thrust = 0; B.gearT = 0; engineStop(); batPose(B, 0);
      player.pos.set(x, top, z); player.vy = 0; speedEl.hidden = true; toast("Ausgestiegen"); return true;
    }
    toast("Hier ist kein Platz zum Aussteigen"); return true;
  }
  if (Math.hypot(p.x - B.x, p.z - B.z) > 5.5 || Math.abs(p.y - B.y) > 3) return false;
  if (world.userData.car) world.userData.car.leave();
  B.on = true; B.view = 0; keys.clear(); player.yaw = B.h; player.pitch = -0.2;
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
  for (const [r, a] of [[7, 0], [7, Math.PI], [7, Math.PI / 2], [7, -Math.PI / 2], [10, 0], [10, Math.PI]]) {
    const ang = player.yaw + a, x = p.x - Math.sin(ang) * r, z = p.z - Math.cos(ang) * r, h = player.yaw;
    const y = supportAt(new THREE.Vector3(x, p.y + 1, z), p.y + 1);
    if (Math.abs(y - p.y) < 2.5 && batFree(B, x, y + 0.02, z, h)) { Object.assign(B, { x, y: y + 0.02, z, h, vx: 0, vy: 0, vz: 0, gearT: 0 }); batPose(B, 0); toast("The Bat ist gelandet (E einsteigen)"); return true; }
  }
  toast("Hier ist kein Platz für The Bat"); return false;
}
batPose(FLY, 0);
// Verlassen (Esc, Geist, anderes Fahrzeug) setzt auch The Bat ab: bleibt, wo sie ist
{ const prev = world.userData.car.leave; world.userData.car.leave = () => { prev(); if (FLY.on) { FLY.on = false; FLY.vx = FLY.vy = FLY.vz = 0; FLY.thrust = 0; engineStop(); speedEl.hidden = true; batPose(FLY, 0); } }; }
