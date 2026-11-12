// Batverse – Kampfjet im Stil eines F-22 (stilisiert, ohne Hoheitszeichen, Logos und Schrift): Modell, Flug mit Tragflaechen, Kamera
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Auftrag 2026-11-10: fliegt wie ein Flugzeug (nicht senkrecht wie The Bat): Startrollen, Abheben ab JET_VS, Landen auf Strasse/Flaeche.
// Steuerung: Rechtsklick einsteigen, Shift aussteigen (nur am Boden und fast still), W/S Schub (bleibt stehen wie ein Gashebel; am Boden
// S bei Schub 0 = Bremse, im Stand langsam rueckwaerts), A/D rollen (am Boden Bugrad lenken), Maus hoch/runter oder Pfeil hoch/runter =
// Nase hoch/runter, V Kamera hinten/Cockpit, M Ton. Eigenes System wie FLY (nicht in VEH). Ursprung der Gruppe = Rumpfmitte (Drehpunkt
// und Kameraziel), die Raeder liegen JET_Y darunter. Vorne = -z. Masse ungefaehr wie das Vorbild: 18,9 m lang, 13,6 m Spannweite, 5 m hoch.
const JET_Y = 2.0, JET_VS = 42, JET_VR = 34, JET_LIM = 1400;           // Drehpunkt ueber Radunterkante, Abhebe-/Rotiertempo (m/s), Flugraum
function buildJet() {
  const g = new THREE.Group(), body = new THREE.Group(); body.position.y = -JET_Y; g.add(body);     // body: Modell mit Radunterkante bei y 0
  const paint = M(0x8b9198, { metalness: 0.3, roughness: 0.6, flatShading: true }), panel = M(0x767c83, { metalness: 0.3, roughness: 0.65, flatShading: true });
  const black = M(0x08090b, { roughness: 0.8 }), nozM = M(0x3a3c40, { metalness: 0.6, roughness: 0.45, flatShading: true }), glass = M(0x4a3c14, { metalness: 0.85, roughness: 0.06, transparent: true, opacity: 0.72 });
  const tireM = M(0x121212, { roughness: 0.9 }), rimM = M(0xb8bcc2, { metalness: 0.8, roughness: 0.3 }), glowM = M(0x141414, { emissive: 0xff7a20, emissiveIntensity: 0 });
  const flat = (pts, d, m, y, par = body) => { const sh = new THREE.Shape(); pts.forEach(([x, f], i) => i ? sh.lineTo(x, f) : sh.moveTo(x, f)); const bv = Math.min(0.05, d * 0.4);   // Fase: Kanten duenn und rund wie ein Profil (2026-11-11)
    return meshIn(par, new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.01, d - 2 * bv), bevelEnabled: true, bevelThickness: bv, bevelSize: bv * 0.9, bevelSegments: 2 }).rotateX(-Math.PI / 2).translate(0, bv, 0), m, 0, y, 0); };   // Platte in (x, vorne), Dicke nach oben
  // Rumpf als Loft (f = vorne): spitze Nase, Kante (Chine) seitlich, oben schmaler als unten, hinten flach zwischen den Duesen
  const hw = tabF([[9.45, 0.04], [8.6, 0.38], [7.4, 0.62], [6, 0.8], [4.5, 0.9], [2.5, 1.15], [0, 1.6], [-3, 1.75], [-6, 1.6], [-8, 1.4], [-8.7, 1.3]]);
  const yb = tabF([[9.45, 1.98], [8, 1.6], [6.5, 1.38], [4, 1.3], [-6, 1.3], [-8.7, 1.55]]), yt = tabF([[9.45, 2.02], [8, 2.35], [6.5, 2.62], [4, 2.78], [0, 2.75], [-4, 2.65], [-8.7, 2.35]]);
  const st = []; for (let f = 9.45; f > -8.71; f -= 0.3) { const w = hw(f), b = yb(f), t = yt(f); st.push([f, [[0, b], [w * 0.7, b + 0.05], [w, 1.95], [w * 0.55, t - 0.05], [0, t]]]); }
  loftIn(body, st, paint);
  // Glaskanzel (goldgetoent), Sitz darunter
  meshIn(body, new THREE.SphereGeometry(1, 28, 16).scale(0.58, 0.56, 2.4), glass, 0, 2.7, -5.5); boxIn(body, -0.3, 0.3, 2.4, 2.75, -5.0, -4.2, black); boxIn(body, -0.2, 0.2, 2.75, 3.1, -4.45, -4.25, black);   // Kanzel, Sitz mit Kopfstuetze
  boxIn(body, -0.35, 0.35, 2.55, 2.8, -6.6, -6.2, black);                                                                  // Instrumentenhutze
  { const fr = M(0x2c2f33, { metalness: 0.4, roughness: 0.5 }); meshIn(body, new THREE.TorusGeometry(0.565, 0.03, 6, 24, Math.PI).scale(1.02, 1, 1), fr, 0, 2.7, -5.6); meshIn(body, new THREE.TorusGeometry(0.565, 0.03, 6, 24, Math.PI), fr, 0, 2.7, -3.9).scale.set(0.77, 0.76, 1); }   // Kanzelrahmen (Boegen)
  // Lufteinlaesse seitlich am Cockpit: schraeger Rand (oben weiter vorne), dunkle Oeffnung
  for (const sd of [-1, 1]) { prismIn(body, [[4.6, 2.45], [3.9, 1.3], [-1, 1.3], [-1, 2.45]], 0.85, paint, sd * 1.25); prismIn(body, [[4.58, 2.37], [3.98, 1.38], [3.95, 1.38], [4.55, 2.37]], 0.7, black, sd * 1.25); }
  // Tragflaechen rautenfoermig (Vorderkante stark gepfeilt, Hinterkante leicht nach vorne), dunklere Vorderkante
  for (const sd of [-1, 1]) { flat([[sd * 1.2, 2.6], [sd * 6.78, -2.15], [sd * 6.78, -3.9], [sd * 1.2, -5.6]], 0.16, paint, 1.86); flat([[sd * 1.2, 2.6], [sd * 6.78, -2.15], [sd * 6.6, -2.32], [sd * 1.2, 2.25]], 0.18, panel, 1.855); }
  // Schubduesen eckig (je zwei Platten oben/unten und Seiten), innen Gluehen; Heckplatte dazwischen
  for (const sd of [-1, 1]) { const x = sd * 0.62; boxIn(body, x - 0.48, x + 0.48, 2.3, 2.42, 8.2, 9.5, nozM); boxIn(body, x - 0.48, x + 0.48, 1.58, 1.7, 8.2, 9.4, nozM); boxIn(body, x - 0.48, x - 0.38, 1.7, 2.3, 8.2, 9.45, nozM); boxIn(body, x + 0.38, x + 0.48, 1.7, 2.3, 8.2, 9.45, nozM); boxIn(body, x - 0.38, x + 0.38, 1.7, 2.3, 8.6, 8.7, glowM); for (let k = 0; k < 5; k++) { boxIn(body, x - 0.46 + k * 0.19, x - 0.3 + k * 0.19, 2.39, 2.43, 9.45, 9.75, nozM); boxIn(body, x - 0.46 + k * 0.19, x - 0.3 + k * 0.19, 1.57, 1.61, 9.4, 9.7, nozM); } }
  boxIn(body, -0.12, 0.12, 1.88, 2.0, 8.4, 9.7, paint);
  { const navR = new THREE.MeshBasicMaterial({ color: 0xff3030 }), navG = new THREE.MeshBasicMaterial({ color: 0x30ff60 }), form = M(0x9cff9c, { emissive: 0x2a6a2a });
    boxIn(body, -6.84, -6.74, 1.88, 2.06, 2.2, 2.6, navR); boxIn(body, 6.74, 6.84, 1.88, 2.06, 2.2, 2.6, navG); boxIn(body, -0.06, 0.06, 1.9, 2.0, 9.7, 9.76, mat.glow);
    for (const sd of [-1, 1]) boxIn(body, sd * 4.2 - 0.3, sd * 4.2 + 0.3, 2.02, 2.04, 1.6, 1.7, form); }   // Positions- und Formationslichter
  for (const sd of [-1, 1]) for (const [f0, f1] of [[-1.5, 2.5], [3.5, 5.5]]) boxIn(body, sd * 1.2 - 0.01, sd * 1.2 + 0.01, 2.0, 2.02, f0, f1, black);   // Wartungsklappen-Fugen
  // Seitenleitwerke: zwei, schraeg nach aussen gekippt (28 Grad), Vorderkante gepfeilt, Hinterkante nach vorne
  for (const sd of [-1, 1]) { const tg = new THREE.Group(); tg.position.set(sd * 1.25, 2.55, 0); tg.rotation.z = -sd * 0.49; body.add(tg); prismIn(tg, [[-3.4, 0], [-5.35, 2.75], [-6.7, 2.75], [-7.9, 0]], 0.14, paint); prismIn(tg, [[-3.4, 0], [-5.35, 2.75], [-5.5, 2.75], [-3.65, 0]], 0.16, panel); }
  mergeStatic(body);
  // Hoehenleitwerke (Pendelruder, drehen mit der Nase-Eingabe)
  const stabs = [-1, 1].map(sd => { const sg = new THREE.Group(); sg.position.set(0, 1.95, 7.8); body.add(sg); flat([[sd * 1.0, 1.8], [sd * 4.45, -1.1], [sd * 4.45, -2.0], [sd * 1.0, -1.8]], 0.12, paint, -0.06, sg); return sg; });
  // Fahrwerk: Bugrad und zwei Hauptraeder (addWheel, rund), Federbeine, Klappen; faehrt in den Rumpf ein (Gruppe gear)
  const gear = new THREE.Group(); body.add(gear);
  const wheels = [addWheel(gear, 0, -6.4, 0.33, 0.22, true, tireM, rimM), addWheel(gear, -1.65, 1.0, 0.42, 0.3, false, tireM, rimM), addWheel(gear, 1.65, 1.0, 0.42, 0.3, false, tireM, rimM)];
  boxIn(gear, -0.05, 0.05, 0.33, 1.4, -6.45, -6.35, rimM); for (const sd of [-1, 1]) boxIn(gear, sd * 0.3 - 0.02, sd * 0.3 + 0.02, 0.85, 1.4, -7.0, -6.0, panel);   // Bugrad-Klappen for (const sd of [-1, 1]) { boxIn(gear, sd * 1.65 - 0.06, sd * 1.65 + 0.06, 0.42, 1.35, 0.95, 1.05, rimM); boxIn(gear, sd * 2.0 - 0.03, sd * 2.0 + 0.03, 0.75, 1.32, 0.2, 1.8, panel); }
  // Nachbrenner-Flammen (ab viel Schub)
  const flameM = new THREE.MeshBasicMaterial({ color: 0xff9a40, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [-1, 1].map(sd => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.34, 3, 14, 1, true).rotateX(-Math.PI / 2).translate(0, 0, 1.5), flameM); f.position.set(sd * 0.62, 2.0, 9.45); f.visible = false; body.add(f); return f; });
  return { g, stabs, gear, wheels, flames, glowM };
}
// Pruefpunkte (lokal zum Drehpunkt): Nase, Kanzel, Fluegelspitzen und -vorderkanten, Hoehenleitwerke, Seitenleitwerke oben, Duesen, Bauch
const JET_PTS = [[0, 0, -9.4], [0, 1.35, -5.6], [-6.75, -0.05, 3.0], [6.75, -0.05, 3.0], [-4, -0.05, -0.2], [4, -0.05, -0.2], [-4.45, -0.05, 9.3], [4.45, -0.05, 9.3],
  [-2.54, 2.98, 6.0], [2.54, 2.98, 6.0], [-0.62, -0.4, 9.4], [0.62, -0.4, 9.4], [0, -0.7, -4], [0, -0.7, 3], [-1.6, -0.7, -2], [1.6, -0.7, -2]];
const JET_WH = [[0, -JET_Y, -6.4], [-1.65, -JET_Y, 1.0], [1.65, -JET_Y, 1.0]];   // Bugrad, Hauptraeder links/rechts (Aufstandspunkte)
const JET = (() => {
  const b = buildJet();
  // Standplatz (Auftrag: lange Gerade der Hauptstrasse): Suedwest-Ende der Hauptstrasse, Nase nach Nordosten. Dort ca. 100 m gerade, dann ein
  // sanfter Bogen, leichtes Gefaelle, Gelaende neben der Fahrbahn hoechstens 0,9 m hoeher (nach der Kreuzung stehen Boeschungen bis 1,5 m: Fluegel)
  const S = MAIN.samples, i = 12, p = S[i], q = S[i + 5], h = Math.atan2(-(q[0] - p[0]), -(q[1] - p[1]));
  const J = { g: b.g, stabs: b.stabs, gear: b.gear, wheels: b.wheels, flames: b.flames, glowM: b.glowM, x: p[0], z: p[1], y: MAIN.y(p[2]) + 0.12 + JET_Y, h, pitch: 0, roll: 0, v: 0, vyE: 0, thr: 0, rot: 0,
    ground: true, gearT: 0, on: false, view: 0, st: 0, pin: 0, circ: [], safeT: 0, warnT: 0 };
  J.home = { x: J.x, y: J.y, z: J.z, h }; J.safe = { ...J.home };
  b.g.userData.dynamic = true; b.g.userData.noLift = true; scene.add(b.g);
  for (let k = 0; k < 5; k++) { const c = [0, 0, 0, 0]; c.dyn = true; circles.push(c); J.circ.push(c); }        // Fussgaenger: Rumpf und Fluegel
  return J;
})();
const jetE = new THREE.Euler(), jetMx = new THREE.Matrix4(), jetV = new THREE.Vector3();
function jetMat(x, y, z, h, p, r) { jetMx.makeRotationFromEuler(jetE.set(p, h, r, "YXZ")); jetMx.setPosition(x, y, z); return jetMx; }
function jetNear(J) { const R = 45; const [a, b] = collNear(J.x - R - 2, J.x + R + 2, J.z - R - 2, J.z + R + 2); nearS = a.filter(s => s.x1 > J.x - R && s.x0 < J.x + R && s.z1 > J.z - R && s.z0 < J.z + R); nearC = b.filter(c => !JET.circ.includes(c) && !FLY.circ.includes(c) && Math.abs(c[0] - J.x) < R + c[2] && Math.abs(c[1] - J.z) < R + c[2]); }
// Punkt frei? Quader, Kreise (Baumstaemme ohne Hoehe nur bis r * 22 ueber dem Gelaende, etwas unter der Baumspitze (Laubbaum ca. 9,4 s, Nadelbaum 12,6 s hoch)), Gelaende, Wasser
function jetAir(x, y, z) {
  for (const s of nearS) if (s.on && x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && y > s.y0 && y < s.y1) return false;
  for (const [cx, cz, r, top] of nearC) if (r > 0 && (x - cx) ** 2 + (z - cz) ** 2 < r * r) { if (top === undefined) { const t = terrainH(cx, cz); if (y > t - 3 && y < t + r * 22) return false; } else if (y < top && y > top - 8) return false; }
  const w = waterAt(x, z); if (w !== null && y < w + 0.2) return false;
  return y >= terrainH(x, z) + 0.2;
}
function jetFree(J, x, y, z, h, p, r) {
  const m = jetMat(x, y, z, h, p, r);
  for (const [a, b, c] of JET_PTS) { jetV.set(a, b, c).applyMatrix4(m); if (!jetAir(jetV.x, jetV.y, jetV.z)) return false; }
  return Math.hypot(x, z) < JET_LIM && y < 900;
}
// Boden unter den Raedern: [Bugrad, links, rechts] (Hoehe der Oberflaeche), feet = Raeder plus Spielraum
function jetWheels(x, y, z, h, p, r, up = 1.0) {
  const m = jetMat(x, y, z, h, p, r);
  return JET_WH.map(([a, b, c]) => { jetV.set(a, b, c).applyMatrix4(m); const wy = jetV.y, gr = supportAt(new THREE.Vector3(jetV.x, wy + up, jetV.z), wy + up), w = waterAt(jetV.x, jetV.z); const wet = w !== null && w > gr; return { y: wy, g: wet ? w : gr, wet }; });   // Wasser: Oberflaeche zaehlt, ist aber kein Rollfeld (wet)
}
function jetPose(J, dt) {
  J.g.position.set(J.x, J.y, J.z); J.g.rotation.set(J.pitch, J.h, J.roll, "YXZ");
  J.gear.position.y = J.gearT * 0.95; J.gear.visible = J.gearT < 0.97;
  for (const s of J.stabs) s.rotation.x += (-J.pin * 0.35 - s.rotation.x) * Math.min(1, dt * 6);
  for (const w of J.wheels) { if (J.ground) w.spin.rotation.x -= J.v * dt / w.r; if (w.front) w.piv.rotation.y = J.ground ? J.st * 0.5 : 0; }
  J.glowM.emissiveIntensity = 0.2 + J.thr * 2.4;
  for (const f of J.flames) { f.visible = J.on && J.thr > 0.8; f.scale.set(1, 1, 0.5 + (J.thr - 0.8) * 5 * (0.9 + 0.1 * Math.random())); }
  const pts = [[0, -6], [0, 0], [0, 6], [-4.2, 1.5], [4.2, 1.5]]; J.circ.forEach((c, i) => { const s = Math.sin(J.h), co = Math.cos(J.h), [lx, lz] = pts[i]; c[0] = J.x + lx * co + lz * s; c[1] = J.z - lx * s + lz * co; c[2] = J.on ? 0 : i < 3 ? 1.7 : 2.0; c[3] = J.y + 1.2; });
}
function jetCamera(J) {
  player.pos.set(J.x, J.y - JET_Y, J.z);
  if (J.view === 1) { jetV.set(0, 1.05, -5.3).applyMatrix4(jetMat(J.x, J.y, J.z, J.h, J.pitch, J.roll)); camera.position.copy(jetV); camera.quaternion.setFromEuler(jetE.set(J.pitch, player.yaw, J.roll, "YXZ")); return; }
  // hinter dem Jet (Regeln wie bei The Bat): Kamera nie naeher als DMIN (sonst Blick aus dem Rumpf), statt naeher zu ruecken hebt sie sich an
  const D = 30, DMIN = 17, tx = J.x, ty = J.y + 1.2, tz = J.z;
  for (let e = Math.max(-0.9, Math.min(1.45, 0.17 - J.pitch * 0.75)); ; e = Math.min(1.45, e + 0.1)) {
    const dx = Math.sin(player.yaw) * Math.cos(e) * D, H = Math.sin(e) * D, dz = Math.cos(player.yaw) * Math.cos(e) * D;
    let k = 1; for (let t = 0.1; t <= 1.0001; t += 0.04) if (!jetAir(tx + dx * t, ty + H * t, tz + dz * t)) { k = t - 0.05; break; }
    if (k * D >= DMIN || e >= 1.45) { k = Math.max(k, DMIN / D); camera.position.set(tx + dx * k, ty + H * k, tz + dz * k); break; } }
  camera.lookAt(tx, ty, tz);
}
function jetLand(J) {            // auf den Boden setzen (Hoehe aus den Hauptraedern, Neigung aus Bug-/Hauptraedern)
  const w = jetWheels(J.x, J.y, J.z, J.h, J.pitch, 0, 1.5), gm = (w[1].g + w[2].g) / 2, gp = Math.atan2(w[0].g - gm, 7.4);
  J.gp = gp; J.pitch = gp + J.rot; J.roll = Math.atan2(w[2].g - w[1].g, 3.3);
  J.y = gm + JET_Y * Math.cos(J.pitch) + Math.sin(J.pitch); return w;
}
function jetCrash(J, msg) {
  Object.assign(J, { x: J.safe.x, y: J.safe.y, z: J.safe.z, h: J.safe.h, v: 0, vyE: 0, thr: 0, rot: 0, pitch: 0, roll: 0, ground: true, gearT: 0 }); jetNear(J); jetLand(J);
  player.yaw = J.h; toast(msg + " – Jet steht wieder am letzten sicheren Platz");
}
// Taste R (Nicolas 2026-11-10): zurueck an den Standplatz an der Hauptstrasse (Respawn), auch aus der Luft
function jetReset(J = JET) {
  Object.assign(J, { x: J.home.x, y: J.home.y, z: J.home.z, h: J.home.h, v: 0, vyE: 0, thr: 0, rot: 0, pitch: 0, roll: 0, ground: true, gearT: 0 }); J.safe = { ...J.home }; jetNear(J); jetLand(J);
  player.yaw = J.h; jetPose(J, 0); toast("Kampfjet zurück am Standplatz");
}
function useJet() {
  if (!walking || ghost) return false;
  const J = JET, p = player.pos;
  if (J.on) {
    if (!J.ground || Math.abs(J.v) > 1.5) { toast(J.ground ? "Zum Aussteigen anhalten (S bremst)" : "Zum Aussteigen landen und anhalten"); return true; }
    const m = jetMat(J.x, J.y, J.z, J.h, 0, 0);
    for (const [a, c] of [[-3.4, -6], [3.4, -6], [0, -12], [-8, 1.5], [8, 1.5]]) {
      jetV.set(a, -JET_Y + 1.5, c).applyMatrix4(m); const q = jetV.clone(), top = supportAt(q, q.y);
      if (Math.abs(top - (J.y - JET_Y)) > 1.5) continue;
      J.on = false; J.v = J.vyE = 0; J.thr = 0; engineStop(); jetPose(J, 0);
      player.pos.set(q.x, top, q.z); player.vy = 0; player.pitch = -0.1; speedEl.hidden = true; toast("Ausgestiegen"); return true;
    }
    toast("Hier ist kein Platz zum Aussteigen"); return true;
  }
  if (Math.hypot(p.x - J.x, p.z - J.z) > 13 || Math.abs(p.y - (J.y - JET_Y)) > 4) return false;
  if (world.userData.car) world.userData.car.leave();
  J.on = true; J.view = 0; J.thr = 0; keys.clear(); player.yaw = J.h; player.pitch = 0;
  toast("Kampfjet: W/S Schub, A/D rollen (am Boden lenken), Maus oder Pfeile hoch/runter = Nase, ab " + Math.round(JET_VS * 1.15 * 3.6) + " km/h abheben, V Kamera, R zurück zum Standplatz, Shift aussteigen (am Boden)");
  engineStart("Kampfjet"); speedEl.hidden = false; return true;
}
function jetStep(dt) {
  const J = JET; jetNear(J);
  let th = 0, st = 0, pin = 0;
  if (keys.has("KeyW") || jumpHeld) th += 1;
  if (keys.has("KeyS") || downHeld) th -= 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) st += 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) st -= 1;
  if (keys.has("ArrowUp")) pin += 1;
  if (keys.has("ArrowDown")) pin -= 1;
  st -= moveStick.x; pin -= moveStick.y; look(lookStick.x * 2.6 * dt, 0);
  const mouse = player.pitch * 0.8; player.pitch = 0;                                          // Maus hoch/runter = Nase (direkt, nicht Blick)
  J.pin = Math.max(-1, Math.min(1, pin + mouse / Math.max(dt, 1e-3) / 2));
  J.st += (st - J.st) * Math.min(1, dt * 5);
  J.thr = clamp01(J.thr + th * 1.2 * dt);
  const lift = clamp01((J.v / (JET_VS * 1.25)) ** 2);                                            // voller Auftrieb erst ab 1,25 x Abhebetempo: darunter sinkt er langsam (Landeanflug)
  let a = J.thr * (J.ground ? 22 : 14) - 0.0009 * J.v * Math.abs(J.v);   // am Boden mehr Schub (Nicolas 2026-11-10: schneller beschleunigen)
  if (J.ground) {
    // ---- am Boden: rollen, Bugrad lenkt, Bremse, ab JET_VR Nase hoch, ab JET_VS abheben ----
    a -= 9.81 * Math.sin(J.gp || 0) + (Math.abs(J.v) > 0.2 ? 0.25 * Math.sign(J.v) : 0);
    if (th < 0 && J.thr === 0) { if (J.v > 0.3) a -= 9; else J.v = Math.max(-3, J.v - 2 * dt); }
    J.v += a * dt; if (th >= 0 && J.thr === 0 && Math.abs(J.v) < 0.3) J.v = 0;
    J.h = wrapA(J.h + st * dt * 0.55 * Math.min(1, Math.abs(J.v) / 3) / (1 + Math.abs(J.v) / 20) * Math.sign(J.v || 1));
    const autoRot = J.v > JET_VS * 1.1 && J.thr > 0.5 && J.pin >= 0;                                  // mit viel Schub rotiert er von selbst (sonst "klebt" er am Boden)
    J.rot = J.v > JET_VR && (J.pin > 0 || autoRot) ? Math.min(0.14, J.rot + Math.max(J.pin, autoRot ? 0.5 : 0) * 0.5 * dt + mouse * 0.6) : Math.max(0, J.rot - 0.5 * dt);
    if (J.v > JET_VR && J.v - a * dt <= JET_VR) toast("Nase hoch (Maus oder Pfeil hoch) zum Abheben");
    const ox = J.x, oz = J.z, oy = J.y, op = J.pitch, orr = J.roll, oh = J.h;
    J.x -= Math.sin(J.h) * J.v * dt; J.z -= Math.cos(J.h) * J.v * dt;
    const w = jetLand(J);
    if (!jetFree(J, J.x, J.y, J.z, J.h, J.pitch, J.roll) || w.some(q => q.wet || q.g - q.y > 1.0)) {   // Hindernis, Stufe (ueber 1 m) oder Wasser
      Object.assign(J, { x: ox, z: oz, y: oy, pitch: op, roll: orr, h: oh }); if (Math.abs(J.v) > 8) toast("Hindernis!"); J.v = 0;
    } else if (Math.max(w[1].y, w[2].y) - Math.max(w[1].g, w[2].g) > 1.0 || (J.rot > 0.1 && J.v >= JET_VS * 1.15)) {   // abgehoben (oder ueber eine Kante gerollt); Querneigung der Strasse bleibt erst
      J.ground = false; J.vyE = 0; if (J.rot > 0.1) toast("Abgehoben");
    }
    J.safeT += dt; if (J.safeT > 1 && Math.abs(J.v) > 0.5 && Math.abs(J.v) < 15 && Math.abs(J.gp) < 0.15 && Math.abs(J.roll) < 0.1) { J.safeT = 0; J.safe = { x: J.x, y: J.y, z: J.z, h: J.h }; }   // nur beim langsamen Rollen auf ebener Flaeche
    J.gearT = Math.max(0, J.gearT - dt);
  } else {
    // ---- in der Luft: Tragflaechen-Auftrieb, Rollen = Kurve, Nase hoch/runter, Stroemungsabriss unter JET_VS ----
    J.pitch = Math.max(-1.25, Math.min(1.25, J.pitch + pin * 0.8 * dt + mouse));
    if (st) J.roll = Math.max(-1.35, Math.min(1.35, J.roll + st * 2.2 * dt)); else J.roll -= J.roll * Math.min(1, 1.6 * dt);
    if (J.v < JET_VS) J.pitch -= (1 - J.v / JET_VS) * 2.5 * dt;                                         // zu langsam: Nase faellt
    J.h = wrapA(J.h + Math.sin(J.roll) * 0.95 * Math.max(0.3, Math.min(1, J.v / 50)) * dt);
    { const r = Math.hypot(J.x, J.z); if (r > JET_LIM - 250) { const want = Math.atan2(J.x, J.z); J.h = wrapA(J.h + Math.max(-1, Math.min(1, wrapA(want - J.h))) * 0.7 * dt); if ((J.warnT -= dt) < 0) { J.warnT = 4; toast("Grenze – der Jet dreht um"); } } }
    a -= 9.81 * Math.sin(J.pitch) + (th < 0 && J.thr === 0 ? 0.0025 * J.v * J.v : 0); J.v = Math.max(0, J.v + a * dt);   // S bei Schub 0 = Luftbremse
    J.vyE = (J.vyE - 9.81 * (1 - lift) * dt) * Math.exp(-1.2 * lift * dt);
    const cp = Math.cos(J.pitch), vx = -Math.sin(J.h) * cp * J.v, vy = Math.sin(J.pitch) * J.v + J.vyE, vz = -Math.cos(J.h) * cp * J.v;
    const nx = J.x + vx * dt, nz = J.z + vz * dt; let ny = J.y + vy * dt;
    let w = jetWheels(nx, ny, nz, J.h, J.pitch, J.roll, 1.5);
    if (vy > 0.3) { const d = Math.max(...w.map(q => q.g + 0.03 - q.y)); if (d > 0 && d < 0.6) { ny += d; w = jetWheels(nx, ny, nz, J.h, J.pitch, J.roll, 1.5); } }   // steigend: Rad streift nur (Querneigung, Kuppe) -> anheben statt landen
    if (w.some(q => q.y < q.g + 0.02)) {                                                           // Aufsetzen
      if (w.some(q => q.wet)) jetCrash(J, "Im Wasser gelandet");
      else if (J.gearT < 0.3 && vy > -7.5 && J.pitch > -0.15 && J.pitch < 0.45 && Math.abs(J.roll) < 0.35) {
        J.x = nx; J.z = nz; J.ground = true; J.rot = Math.max(0, Math.min(0.14, J.pitch)); J.vyE = 0; J.v *= Math.max(0.6, cp); jetLand(J);
        if (!jetFree(J, J.x, J.y, J.z, J.h, J.pitch, J.roll)) jetCrash(J, "Bruchlandung"); else toast(vy < -4 ? "Harte Landung" : "Gelandet");
      } else jetCrash(J, J.gearT >= 0.3 ? "Ohne Fahrwerk aufgesetzt" : vy <= -7.5 ? "Zu hart aufgesetzt" : "Bruchlandung");
    } else if (!jetFree(J, nx, ny, nz, J.h, J.pitch, J.roll)) jetCrash(J, "Absturz");
    else { J.x = nx; J.y = ny; J.z = nz; }
    if (!J.ground) { const agl = J.y - JET_Y - Math.max(terrainH(J.x, J.z), waterAt(J.x, J.z) ?? -1e9); J.gearT = clamp01(J.gearT + (agl > 30 ? 1 : agl < 24 ? -1 : 0) * 0.8 * dt); }
  }
  // Kamera gleitet hinter den Jet (Maus links/rechts schaut kurz zur Seite)
  if (J.view === 0 && (Math.abs(J.v) > 3 || !J.ground)) player.yaw += wrapA(J.h - player.yaw) * Math.min(1, dt * 1.4);
  jetPose(J, dt); jetCamera(J);
  const agl = Math.max(0, Math.round(J.y - JET_Y - Math.max(terrainH(J.x, J.z), waterAt(J.x, J.z) ?? -1e9)));
  speedEl.textContent = Math.round(J.v * 3.6) + " km/h · " + (J.ground ? "am Boden" : agl + " m über Boden") + " · Schub " + Math.round(J.thr * 100) + " %" + (!J.ground && J.v < JET_VS ? " · ZU LANGSAM" : "");
  engineUpdate({ v: J.v, throttle: J.thr, air: !J.ground, wet: false });
}
// T-Menue: zum Jet gehen (er ist zu gross, um ihn zu holen): Spieler neben das Cockpit links
function goToJet() {
  const J = JET; if (J.on) return toast("Du sitzt schon im Kampfjet");
  jetV.set(-3.6, -JET_Y + 1.5, -6).applyMatrix4(jetMat(J.x, J.y, J.z, J.h, 0, 0));
  if (belowView) $("btn-below").click();
  startWalk(jetV.x, jetV.z, J.h - Math.PI / 2); player.pos.set(jetV.x, jetV.y, jetV.z); player.pos.y = supportAt(player.pos, jetV.y); player.vy = 0;
  updatePlayer(0.001, 0, 0, false); toast("Beim Kampfjet (Rechtsklick einsteigen)");
}
jetNear(JET); jetLand(JET); JET.home.y = JET.safe.y = JET.y; jetPose(JET, 0);
// Verlassen (Esc, Geist, anderes Fahrzeug): Jet bleibt, wo er ist (in der Luft: zurueck an den letzten sicheren Platz)
{ const prev = world.userData.car.leave; world.userData.car.leave = () => { prev(); const J = JET; if (J.on) { J.on = false; if (!J.ground) jetCrash(J, "Verlassen"); J.v = J.vyE = 0; J.thr = 0; engineStop(); speedEl.hidden = true; jetPose(J, 0); } }; }
