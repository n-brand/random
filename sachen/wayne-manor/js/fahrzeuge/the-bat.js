// Wayne Manor 3D – Fluggeraet "The Bat" (Batwing): Modell, Flugsteuerung, Kamera, Holen
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Nicolas 2026-11-09 (Bilder: Drauf-, Schraeg-, Seiten- und Unteransicht): schmale Cockpit-Kanzel vorne mit Rippen, dahinter ein flacher
// Panzerpanzer aus Platten, der nach hinten breiter wird und an den Seiten wie gefaltete Fledermausfluegel nach unten haengt, Wabengitter
// vorne auf dem Panzer, Mittelgrat, vorne links/rechts kantige Waffengehaeuse auf Streben mit Doppelrohren und Antennen, unten ein
// Mantelrotor (Ring mit Rotor, glueht beim Schub) und Kufen. Senkrechtstarter: schwebt, steigt, sinkt. Vorne = -z, Kufen bei y 0.
// Steuerung: E einsteigen/aussteigen (nur gelandet), W/S vor/zurueck, A/D drehen, Leertaste steigen, C (oder Strg) sinken,
// Shift schneller, V Kamera hinten/Cockpit, M Ton. Kollision: freier Raum wie die Fahrzeugkamera (camBlocked) plus Boden unter den Kufen.
function buildTheBat() {
  const g = new THREE.Group();
  const armor = M(0x2c2e33, { metalness: 0.45, roughness: 0.55, flatShading: true }), dark = M(0x18191c, { metalness: 0.5, roughness: 0.5, flatShading: true });
  const frameM = M(0x3a3d43, { metalness: 0.6, roughness: 0.4, flatShading: true }), glassM = M(0x0c141c, { metalness: 0.7, roughness: 0.08, transparent: true, opacity: 0.6 });
  const hexT = canvasTex(64, 56, (c, w, h) => { c.fillStyle = "#3a3d43"; c.fillRect(0, 0, w, h); c.fillStyle = "#0b0c0e"; for (let r = 0; r < 5; r++) for (let k = -1; k < 5; k++) { const cx = k * 16 + (r % 2) * 8, cy = r * 14; c.beginPath(); for (let a = 0; a < 6; a++) c.lineTo(cx + 6 * Math.cos(a * Math.PI / 3), cy + 6 * Math.sin(a * Math.PI / 3)); c.fill(); } });
  hexT.repeat.set(3, 3); const hexM = M(0xffffff, { map: hexT, metalness: 0.4, roughness: 0.6 });
  const grillT = canvasTex(32, 32, (c, w, h) => { c.fillStyle = "#3a3d43"; c.fillRect(0, 0, w, h); c.fillStyle = "#0b0c0e"; for (let y = 3; y < h; y += 5) c.fillRect(4, y, w - 8, 2); });
  grillT.repeat.set(1, 1); const grillM = M(0xffffff, { map: grillT, metalness: 0.5, roughness: 0.5 });
  const thrustM = M(0x3a1a08, { emissive: 0xff7a20, emissiveIntensity: 0, side: THREE.DoubleSide });
  const beam = (p, q, r, m) => { const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), o = new THREE.Mesh(new THREE.BoxGeometry(r, d.length(), r), m); o.position.set((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(o); };
  // Kufen und Stuetzen, Bauch
  for (const sd of [-1, 1]) { boxIn(g, sd * 1.3 - 0.07, sd * 1.3 + 0.07, 0, 0.1, -2.1, 2.3, dark); for (const z of [-1.3, 1.5]) beam([sd * 1.3, 0.05, z], [sd * 0.9, 1.0, z], 0.1, dark); }
  prismIn(g, [[2.2, 0.95], [1.2, 0.85], [-2.0, 0.85], [-2.7, 1.15], [-2.5, 1.6], [1.6, 1.6]], 2.2, dark);                 // Bauch
  meshIn(g, new THREE.TorusGeometry(1.25, 0.14, 8, 32).rotateX(Math.PI / 2), frameM, 0, 0.82, 0.3);                       // Mantelring des Rotors
  // Cockpit-Kanzel: Glas, Rippen, Kiel, Sitz
  prismIn(g, [[3.7, 1.2], [3.45, 1.75], [2.7, 2.1], [1.2, 2.3], [1.2, 1.0], [3.1, 0.95]], 0.84, glassM);
  for (const f of [3.35, 2.6, 1.85]) { const t = f > 3 ? 1.85 : f > 2 ? 2.12 : 2.26; boxIn(g, -0.48, 0.48, t, t + 0.08, -f - 0.05, -f + 0.05, frameM); for (const sd of [-1, 1]) boxIn(g, sd * 0.45 - 0.04, sd * 0.45 + 0.04, 1.0, t, -f - 0.05, -f + 0.05, frameM); }
  prismIn(g, [[3.75, 1.15], [3.2, 0.9], [1.2, 0.95], [1.2, 1.1], [3.3, 1.05]], 1.0, frameM);                              // Kiel
  boxIn(g, -0.25, 0.25, 1.05, 1.55, -2.1, -1.6, dark);                                                                    // Sitz
  // Panzer: Mittelteil, seitliche Fluegelplatten (haengen nach aussen), hintere Spitzen, Wabengitter, Grat
  prismIn(g, [[1.7, 2.25], [0.8, 2.62], [-0.8, 2.72], [-2.4, 2.36], [-3.6, 1.72], [-3.95, 1.3], [-3.0, 1.4], [-1.6, 1.8], [0.2, 1.75], [1.5, 1.7]], 2.4, armor);
  for (const sd of [-1, 1]) {
    prismIn(g, [[1.3, 2.05], [0.2, 2.38], [-1.4, 2.34], [-3.0, 1.62], [-3.75, 0.9], [-3.35, 0.85], [-2.2, 1.3], [-0.6, 1.5], [0.9, 1.5]], 1.3, armor, sd * 1.75).rotation.z = -sd * 0.22;
    prismIn(g, [[-0.4, 1.95], [-2.2, 1.66], [-3.7, 0.55], [-3.25, 0.42], [-2.0, 1.2], [-0.5, 1.55]], 0.18, dark, sd * 2.62).rotation.z = -sd * 0.28;
    meshIn(g, new THREE.BoxGeometry(0.85, 0.04, 1.0), hexM, sd * 0.72, 2.47, -1.2, -0.41);                                // Wabengitter
    for (let k = 0; k < 3; k++) meshIn(g, new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8), frameM, sd * (1.3 + k * 0.08), 2.35 - k * 0.04, -0.4 + k * 0.25);   // Nieten
    // Waffengehaeuse vorne neben der Kanzel: Strebe, Kasten mit Gitter, Doppelrohr, Antenne, Licht
    beam([sd * 1.25, 1.45, -2.5], [sd * 0.5, 1.7, -1.6], 0.14, frameM); beam([sd * 1.25, 1.2, -2.2], [sd * 0.55, 1.0, -1.4], 0.1, dark);
    boxIn(g, sd * 1.55 - 0.38, sd * 1.55 + 0.38, 1.0, 1.75, -3.5, -2.1, frameM); meshIn(g, new THREE.BoxGeometry(0.6, 0.03, 1.1), grillM, sd * 1.55, 1.77, -2.8);
    for (const dx of [-0.12, 0.12]) meshIn(g, new THREE.CylinderGeometry(0.045, 0.045, 1.1, 8), dark, sd * 1.55 + dx, 1.15, -4.05, Math.PI / 2);
    boxIn(g, sd * 1.8 - 0.02, sd * 1.8 + 0.02, 1.75, 2.35, -2.65, -2.6, dark); boxIn(g, sd * 1.3 - 0.02, sd * 1.3 + 0.02, 1.75, 2.15, -3.3, -3.25, dark);
    boxIn(g, sd * 1.55 - 0.15, sd * 1.55 + 0.15, 1.5, 1.6, -3.53, -3.5, mat.glow);
  }
  boxIn(g, -0.13, 0.13, 2.62, 2.8, -0.8, 1.6, frameM); boxIn(g, -0.2, 0.2, 2.25, 2.45, -1.7, -0.9, grillM);              // Grat, Lueftung
  boxIn(g, -0.3, 0.3, 1.5, 1.62, 3.0, 3.05, mat.glowRed);                                                                  // Heckleuchte
  mergeStatic(g);
  // Rotor (dreht) und Schubgluehen unten
  const rotor = new THREE.Group(); rotor.position.set(0, 0.82, 0.3); g.add(rotor);
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.03, 0.22), dark); b.rotation.y = k / 6 * Math.PI; b.rotation.x = 0.25; rotor.add(b); }
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24).rotateX(Math.PI / 2), thrustM); glow.position.set(0, 0.7, 0.3); g.add(glow);
  return { g, rotor, thrustM };
}
const BAT_PTS = [[0, 1.2, 0], [0, 1.4, -3.7], [0, 1.6, -4.6], [0, 1.5, 3.8], [-2.8, 1.2, 0.5], [2.8, 1.2, 0.5], [-1.6, 1.3, -3.2], [1.6, 1.3, -3.2], [0, 2.7, 0]];   // Pruefpunkte (lokal)
const BAT_FEET = [[-1.3, -2.0], [1.3, -2.0], [-1.3, 2.2], [1.3, 2.2], [0, 0.3]];                                         // Kufen
const FLY = (() => {
  const b = buildTheBat();
  // Standplatz: untere Batcave auf der freien Flaeche vor dem Batcomputer, Nase nach Osten zur Halle und zum See (der Hangar oben ist fuer
  // 8,5 x 5,8 m zu eng und nur 8,5 m hoch). Hinaus geht es ueber den See und durch den Wassertunnel aufs Meer.
  const F = { g: b.g, rotor: b.rotor, thrustM: b.thrustM, x: -47, y: LY, z: -3, h: -Math.PI / 2, vx: 0, vy: 0, vz: 0, on: false, view: 0, pitch: 0, roll: 0, spin: 0, thrust: 0, circ: [] };
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
  if (y > SEA_Y - 0.5 && y < UY - 4 && [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]].every(([a, b]) => caveAt(x + a, z + b) !== 0)) return y < (polySD(LAKE_W, x, z) > 6 ? LY + LH - 4.4 : SEA_Y + 10.6);
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
  B.spin += dt * (6 + B.thrust * 30); B.rotor.rotation.y = B.spin; B.thrustM.emissiveIntensity = B.thrust * 2.2;
  const pts = [[0, 0], [0, -3], [0, 2.8]]; B.circ.forEach((c, i) => { const [x, z] = batW(B, pts[i][0], pts[i][1]); c[0] = x; c[1] = z; c[2] = B.on ? 0 : 2.0; c[3] = B.y + 2.6; });
}
function batCamera(B) {
  player.pos.set(B.x, B.y + 0.6, B.z);
  if (B.view === 1) { const [x, z] = batW(B, 0, -2.0); camera.position.set(x, B.y + 1.9, z); camera.rotation.set(player.pitch, player.yaw, 0, "YXZ"); return; }
  const D = 14, H = Math.max(1.2, Math.min(10, 3.2 - player.pitch * 8)), tx = B.x, ty = B.y + 1.8, tz = B.z, dx = Math.sin(player.yaw) * D, dz = Math.cos(player.yaw) * D;
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
      B.on = false; B.vx = B.vz = B.vy = 0; B.thrust = 0; engineStop(); batPose(B, 0);
      player.pos.set(x, top, z); player.vy = 0; speedEl.hidden = true; toast("Ausgestiegen"); return true;
    }
    toast("Hier ist kein Platz zum Aussteigen"); return true;
  }
  if (Math.hypot(p.x - B.x, p.z - B.z) > 5.5 || Math.abs(p.y - B.y) > 3) return false;
  if (world.userData.car) world.userData.car.leave();
  B.on = true; B.view = 0; keys.clear(); player.yaw = B.h; player.pitch = -0.2;
  toast("The Bat: W/S vor/zurück, A/D drehen, Leertaste steigen, C sinken, Shift schneller, V Kamera, E aussteigen (gelandet)");
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
  if (keys.has("KeyC") || keys.has("ControlLeft") || keys.has("ControlRight") || downHeld) up -= 1;
  th -= moveStick.y; st -= moveStick.x;
  look(lookStick.x * 2.6 * dt, lookStick.y * 1.8 * dt);
  const fast = keys.has("ShiftLeft") || keys.has("ShiftRight"), max = fast ? 70 : 32, acc = fast ? 24 : 13;
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
  B.thrust += ((landed && !up && !th ? 0.05 : 0.35 + 0.65 * Math.max(Math.abs(th), Math.max(0, up))) - B.thrust) * Math.min(1, dt * 3);
  // Lage: beim Beschleunigen Nase etwas runter, in Kurven schraeg, im Schweben leichtes Wiegen
  const along = B.vx * fx + B.vz * fz, t = performance.now() / 1000;
  B.pitch += ((landed ? 0 : -0.12 * th - along * 0.002 + 0.015 * Math.sin(t * 1.3)) - B.pitch) * Math.min(1, dt * 3);
  B.roll += ((landed ? 0 : st * Math.min(0.35, 0.1 + sp / 80) + 0.012 * Math.sin(t * 1.7)) - B.roll) * Math.min(1, dt * 3);
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
    if (Math.abs(y - p.y) < 2.5 && batFree(B, x, y + 0.02, z, h)) { Object.assign(B, { x, y: y + 0.02, z, h, vx: 0, vy: 0, vz: 0 }); batPose(B, 0); toast("The Bat ist gelandet (E einsteigen)"); return true; }
  }
  toast("Hier ist kein Platz für The Bat"); return false;
}
batPose(FLY, 0);
// Verlassen (Esc, Geist, anderes Fahrzeug) setzt auch The Bat ab: bleibt, wo sie ist
{ const prev = world.userData.car.leave; world.userData.car.leave = () => { prev(); if (FLY.on) { FLY.on = false; FLY.vx = FLY.vy = FLY.vz = 0; FLY.thrust = 0; engineStop(); speedEl.hidden = true; batPose(FLY, 0); } }; }
