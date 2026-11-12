// Wayne Manor 3D – Schiessen mit dem Panzer: Zielen ueber das Visier, Granate mit Flugbahn, Treffer, Schutzstufen, Explosion, Wracks
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Nicolas 2026-11-11: andere Fahrzeuge lassen sich mit dem Panzer zerstoeren; jedes Fahrzeug haelt eine Zahl Treffer aus (Taxi 1, Tumbler 4,
// Panzer 4), bei 0 explodiert es (Feuerball, Druckwelle, Truemmer, Knall, springt hoch) und bleibt als brennendes Wrack stehen.
// Bedienung: Leertaste (Handy: Knopf "Feuer") im Panzer, Nachladen 2,2 s. Gezielt wird auf den Punkt in der Mitte des Visiers: der Strahl von der
// Kamera durch das Visier trifft Gelaende, Quader, Kreise (Baeume, Felsen) oder Fahrzeuge; das Rohr hebt/senkt sich dorthin (C.elev) und die
// Granate fliegt von der Muendung gerade dorthin (320 m/s, bis 900 m). Wracks: nicht mehr fahrbar (Einsteigen gesperrt), "Fahrzeuge holen" im
// T-Menue repariert sie. Fahrzeuge als Kapsel (Laengsachse, Radius aus R und Hoehe) fuer Treffer.
const ARMOR = { "Gotham Taxi": 1, "Aventador LP 700-4": 1, "Gemini Concept GT": 1, "ChatGPT GPT-6 Concept GT": 1, "DeepSeek Concept Car": 1, "Motorrad": 1, "Boxer-Streetfighter": 1,
  "Gotham Police": 2, "Rolls-Royce": 2, "Rolls-Royce Spectre": 2, "Nachtfalke": 2, "Batpod": 2, "Mercedes-Benz G-Klasse": 3, "Tumbler": 4, "Panzer": 4 };
const armorOf = v => v === JET ? 2 : ARMOR[v.spec.name] || 2;   // Kampfjet (Nicolas 2026-11-11: auch zerstoerbar) haelt 2 Treffer
const bodyHOf = v => v === JET ? 3 : v.spec.bodyH;
// Kampfjet als Koerper in lokalen Koordinaten (Drehpunkt Rumpfmitte, vorne -z): Rumpf, Tragflaechen, Leitwerke
function jetHit(x, y, z) { const J = JET; if (J.on && !J.ground) return false; const dx = x - J.x, dz = z - J.z, dy = y - J.y, c = Math.cos(J.h), s = Math.sin(J.h), lx = dx * c - dz * s, lz = dx * s + dz * c;
  // grosszuegig (Nicolas 2026-11-11: Trefferzone sehr gross): Rumpf bis zum Boden und ueber die Leitwerke, Fluegel dick, ca. 1 m Zugabe rundum
  return (Math.abs(lx) < 2.6 && Math.abs(lz) < 10.5 && dy > -2.2 && dy < 2.6) || (Math.abs(lx) < 7.8 && lz > -3.6 && lz < 6.6 && dy > -1.4 && dy < 1.4) || (Math.abs(lx) < 3.6 && lz > 2 && lz < 9.6 && dy > 0 && dy < 4.3); }
const SHOT = { zoom: 1, zoomT: 1, cd: 0, RELOAD: 2.2, SPEED: 320, RANGE: 900, MUZZLE: 4.75, shells: [], fx: [], fires: [], aim: null, aimT: 0, recoil: 0 };
const shotV = new THREE.Vector3(), shotA = new THREE.Vector3(), shotB = new THREE.Vector3(), shotRay = new THREE.Raycaster(), shotN = new THREE.Vector2();
const fxGeo = new THREE.SphereGeometry(1, 14, 10), fxRing = new THREE.RingGeometry(0.8, 1, 40).rotateX(-Math.PI / 2), fxCone = new THREE.ConeGeometry(0.5, 1.6, 8, 1, true).translate(0, 0.8, 0), fxBox = new THREE.BoxGeometry(1, 1, 1);
const fxAdd = col => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
const fxSmoke = col => new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.8, roughness: 1, depthWrite: false });
// Kapsel eines Fahrzeugs: Mitte, Laengsachse (lokal z), halbe Laenge, Radius
function vehCapsule(v) { const sp = v.spec, L = Math.max(...sp.pts.map(Math.abs)) + sp.R * 0.5, r = Math.max(sp.R * 0.95, sp.bodyH * 0.5);
  return { x: v.x, y: v.y + sp.bodyH * 0.5, z: v.z, ax: Math.sin(v.h), az: Math.cos(v.h), L, r }; }
// Was liegt an Punkt p? null, "ground", "solid" oder { veh }
function shotAt(x, y, z, skip) {
  for (const v of VEH) { if (v === skip || !v.g.visible && !v.dead) continue; const c = vehCapsule(v), dx = x - c.x, dz = z - c.z, t = Math.max(-c.L, Math.min(c.L, dx * c.ax + dz * c.az));
    const ex = dx - c.ax * t, ez = dz - c.az * t, ey = (y - c.y) * (c.r / Math.max(0.6, v.spec.bodyH * 0.55)); if (ex * ex + ey * ey + ez * ez < c.r * c.r) return { veh: v }; }
  if (jetHit(x, y, z)) return { veh: JET };
  if (y < groundAt(x, z, y + 0.4)) return "ground";
  const [S, C] = collNear(x - 0.2, x + 0.2, z - 0.2, z + 0.2);
  for (const s of S) if (s.on && x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && y > s.y0 && y < s.y1) return "solid";
  for (const c of C) { if (c.dyn || c[2] <= 0) continue; const dx = x - c[0], dz = z - c[1]; if (dx * dx + dz * dz > c[2] * c[2]) continue;
    const top = c[3]; if (top === undefined ? y < terrainH(c[0], c[1]) + 7 && y > terrainH(c[0], c[1]) - 3 : y < top && y > top - 8) return "solid"; }
  return null;
}
// Erster Treffer auf der Strecke a -> b (Schritte von hoechstens st m): { p, hit } oder null
function shotSeg(a, b, skip, st = 0.5) { const len = a.distanceTo(b), n = Math.max(1, Math.ceil(len / st));
  for (let i = 1; i <= n; i++) { shotV.lerpVectors(a, b, i / n); const h = shotAt(shotV.x, shotV.y, shotV.z, skip); if (h) return { p: shotV.clone(), hit: h }; } return null; }
// Mitte des Visiers auf dem Bildschirm (-1..1)
function shotSightN() { const el = document.getElementById("tank-sight"), r = el.getBoundingClientRect(), W = renderer.domElement.clientWidth || innerWidth, H = renderer.domElement.clientHeight || innerHeight;
  return shotN.set((r.left + r.width / 2) / W * 2 - 1, -((r.top + r.height / 2) / H * 2 - 1)); }
// Zielpunkt: Strahl von der Kamera durch die Mitte des Visiers
function shotAimPoint(skip) {
  shotRay.setFromCamera(shotSightN(), camera);
  const o = shotRay.ray.origin, d = shotRay.ray.direction; shotA.copy(o).addScaledVector(d, 6);           // ab 6 m vor der Kamera (der eigene Panzer steht davor)
  for (let s = 6; s < SHOT.RANGE; s += 3) { shotB.copy(o).addScaledVector(d, s + 3); const h = shotSeg(shotA, shotB, skip, 1); if (h) return h.p; shotA.copy(shotB); }
  return shotB.clone();
}
// ---- Effekte ----
function fxAddMesh(geo, m, p, s) { const o = new THREE.Mesh(geo, m); o.position.copy(p); o.scale.setScalar(s); o.userData.dynamic = true; scene.add(o); return o; }
function fxBoom(p, big) {            // Explosion: Blitz, Feuerball, Rauch, (gross) Druckwelle und Truemmer
  const k = big ? 1 : 0.35, now = clock.elapsedTime;
  SHOT.fx.push({ o: fxAddMesh(fxGeo, fxAdd(0xfff0c0), p, 1.2 * k), t0: now, life: 0.18, grow: 9 * k, fade: true });
  for (let i = 0; i < (big ? 7 : 3); i++) { const q = p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2.5 * k, Math.random() * 1.5 * k, (Math.random() - 0.5) * 2.5 * k));
    SHOT.fx.push({ o: fxAddMesh(fxGeo, fxAdd(i % 2 ? 0xff7a1a : 0xffb23a), q, 0.8 * k), t0: now, life: 0.7 + Math.random() * 0.4, grow: (3 + Math.random() * 2) * k, fade: true, vy: 2.5 * k }); }
  for (let i = 0; i < (big ? 10 : 4); i++) { const q = p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3 * k, Math.random() * k, (Math.random() - 0.5) * 3 * k));
    SHOT.fx.push({ o: fxAddMesh(fxGeo, fxSmoke(i % 2 ? 0x2b2a28 : 0x4a4744), q, 0.6 * k), t0: now + 0.1, life: 2.5 + Math.random() * 1.5, grow: (2.5 + Math.random() * 2) * k, fade: true, vy: (2 + Math.random() * 1.5) * k }); }
  if (big) { const ring = fxAddMesh(fxRing, fxAdd(0xffd9a0), p.clone().setY(p.y - 0.6), 1); ring.material.side = THREE.DoubleSide; SHOT.fx.push({ o: ring, t0: now, life: 0.6, grow: 22, fade: true });
    for (let i = 0; i < 14; i++) { const m = new THREE.MeshStandardMaterial({ color: i % 3 ? 0x1c1c1c : 0x5a4a30, roughness: 0.9 }), o = fxAddMesh(fxBox, m, p, 1); o.scale.set(0.2 + Math.random() * 0.5, 0.08 + Math.random() * 0.15, 0.2 + Math.random() * 0.4);
      const a = Math.random() * Math.PI * 2, sp = 6 + Math.random() * 9; SHOT.fx.push({ o, t0: now, life: 4, debris: true, v: new THREE.Vector3(Math.cos(a) * sp, 8 + Math.random() * 9, Math.sin(a) * sp), w: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8) }); } }
  shotSound(big ? 1 : 0.45, big ? 1.8 : 0.8);
}
function shotSound(vol, len) {       // Knall: gefiltertes Rauschen (Tiefpass faellt), dazu tiefer Schlag
  const ctx = ENGINE.ctx; if (!ctx || ENGINE.muted) return;
  const n = Math.floor(ctx.sampleRate * len), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2);
  const src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime; src.buffer = buf; lp.type = "lowpass"; lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(90, t + len);
  g.gain.setValueAtTime(vol * 2.2, t); src.connect(lp); lp.connect(g); g.connect(engineOut(ctx)); src.start(t);
  const os = ctx.createOscillator(), og = ctx.createGain(); os.frequency.setValueAtTime(70, t); os.frequency.exponentialRampToValueAtTime(30, t + 0.6); og.gain.setValueAtTime(vol * 1.6, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
  os.connect(og); og.connect(engineOut(ctx)); os.start(t); os.stop(t + 0.75);
}
// ---- Schaden, Explosion, Wrack, Reparatur ----
function vehHit(v, p) {
  if (v.dead) { fxBoom(p, false); return; }
  const max = armorOf(v); v.hp = (v.hp ?? max) - 1; fxBoom(p, false);
  if (v.hp > 0) { toast(vehName(v) + " getroffen – hält noch " + v.hp + " von " + max); return; }
  vehDestroy(v);
}
function vehDestroy(v) {
  v.dead = true; v.boomT = clock.elapsedTime; v.wreckRoll = (Math.random() - 0.5) * 0.25; v.wreckPitch = (Math.random() - 0.5) * 0.12;
  fxBoom(new THREE.Vector3(v.x, v.y + (v === JET ? 0 : bodyHOf(v) * 0.6), v.z), true); toast(vehName(v) + " zerstört");
  v.g.traverse(o => { if (!o.isMesh) return; o.userData.mat0 = o.material; const burn = m => { const c = m.clone(); if (c.color) c.color.lerp(new THREE.Color(0x1b1815), 0.86); if (c.emissive) c.emissive.set(0); if (c.map && !c.transparent) c.map = null; return c; };
    o.material = Array.isArray(o.material) ? o.material.map(burn) : burn(o.material); });
  SHOT.fires.push({ v, t0: clock.elapsedTime, cones: [0, 1, 2].map(i => { const c = fxAddMesh(fxCone, fxAdd(i ? 0xff6a10 : 0xffc040), new THREE.Vector3(), 1); return c; }), puff: 0 });
}
function vehRepair(v) {
  if (!v.dead) { v.hp = undefined; return; }
  v.g.traverse(o => { if (o.isMesh && o.userData.mat0) { o.material = o.userData.mat0; delete o.userData.mat0; } });
  v.dead = false; v.hp = undefined; const f = SHOT.fires.findIndex(q => q.v === v); if (f >= 0) { for (const c of SHOT.fires[f].cones) scene.remove(c); SHOT.fires.splice(f, 1); }
}
// Einsteigen in Wracks sperren, Holen repariert
{ const enter0 = enterVehicle; enterVehicle = v => { if (v && v.dead) return toast(vehName(v) + (v === JET ? " ist zerstört – „Kampfjet (hingehen)“ im Menü (T) repariert ihn" : " ist zerstört – „Fahrzeuge holen“ im Menü (T) repariert es")); return enter0(v); };
  const go0 = goToJet; goToJet = () => { if (JET.dead) { vehRepair(JET); jetReset(JET); toast("Kampfjet repariert"); } else JET.hp = undefined; return go0(); };
  const sum0 = summonVehicle; summonVehicle = v => { if (v && v.dead) { vehRepair(v); toast(vehName(v) + " repariert"); } else if (v) v.hp = undefined; return sum0(v); }; }
// Zoom beim Zielen (Nicolas 2026-11-11): Mausrad im Panzer, 1x bis 6x (Sichtwinkel 70 / Zoom), Maus dreht dann entsprechend feiner;
// beim Aussteigen zurueck auf 1x. Anzeige im Visier-Hinweis.
// TEST (Nicolas 2026-11-12, "zum Testen"): Maus dreht im Zoom gleich schnell wie ohne (vorher / SHOT.zoom, also bei 6x sechsmal langsamer).
// Zurueck: ZOOM_SENS_GLEICH = false (Vorschlag dazwischen: / Math.sqrt(SHOT.zoom)). Gleich in werkstatt.js.
const ZOOM_SENS_GLEICH = true;
const zoomK = () => ZOOM_SENS_GLEICH ? 1 : SHOT.zoom;
// TEST (Nicolas 2026-11-11, "nur zum Testen"): nach einem Schuss nach 0,35 s automatisch auf 1x rauszoomen. Gefaellt es nicht: AUTO_UNZOOM = false
// bzw. die zwei markierten Stellen entfernen (siehe CLAUDE.md).
const AUTO_UNZOOM = true;
addEventListener("wheel", e => { if (!(CAR && CAR.on && CAR.turret)) return; e.preventDefault(); SHOT.zoomT = Math.max(1, Math.min(6, SHOT.zoomT * (e.deltaY < 0 ? 1.25 : 0.8))); if (SHOT.zoomT < 1.05) SHOT.zoomT = 1; }, { passive: false });
// ---- jedes Bild (nach carFrame) ----
function shotsStep(dt) {
  const C = CAR && CAR.on && CAR.turret ? CAR : null, now = clock.elapsedTime, label = document.querySelector("#tank-sight span");
  SHOT.cd = Math.max(0, SHOT.cd - dt);
  if (C) {
    // Zielen immer mit der Verfolgerkamera (carCamera) bei 70 Grad; der Zoom aendert nur das Bild, nicht wohin das Visier zeigt (Nicolas 2026-11-12)
    if (camera.fov !== 70) { camera.fov = 70; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
    if ((SHOT.aimT -= dt) <= 0) { SHOT.aimT = 0.1; SHOT.aim = shotAimPoint(C); }                       // Zielpunkt 10-mal pro Sekunde
    const sn = shotSightN(); shotRay.setFromCamera(sn, camera);                                         // Bezugsstrahl durch das Visier (jedes Bild, fuer die Zieloptik)
    const sny = sn.y;
    C.gun.updateWorldMatrix(true, false); C.gun.getWorldPosition(shotA);
    if (SHOT.aim) { const dx = SHOT.aim.x - shotA.x, dz = SHOT.aim.z - shotA.z; C.elev += (Math.max(-0.4, Math.min(0.55, Math.atan2(SHOT.aim.y - shotA.y, Math.hypot(dx, dz)))) - C.elev) * Math.min(1, dt * 8); }   // Rohr hebt/senkt sich zum Ziel
    if (SHOT.unzoom > 0 && (SHOT.unzoom -= dt) <= 0) SHOT.zoomT = 1;   // TEST Auto-Rauszoomen
    SHOT.zoom += (SHOT.zoomT - SHOT.zoom) * Math.min(1, dt * 10); const fov = 70 / SHOT.zoom; if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    // gezoomt: Kamera nach vorne auf den Visier-Strahl der normalen Kamera, auf den Punkt neben der Zieloptik am Turm (sonst sah man den eigenen
    // Turm gross), Blick entlang dieses Strahls, um den Visier-Winkel gesenkt: das Visier zeigt genau dorthin wie ohne Zoom, und die Ansicht ist
    // unabhaengig davon, wie weit das Ziel weg ist (Nicolas 2026-11-12: auf nahe Ziele lag die Ansicht vorher etwas hoeher, Parallaxe der Optik)
    if (SHOT.zoom > 1.01) { C.turret.updateWorldMatrix(true, false); C.turret.localToWorld(shotB.set(0.52, 1.25, -0.9));
      const o = shotRay.ray.origin, d = shotRay.ray.direction, t = Math.max(0, shotB.sub(o).dot(d)); camera.position.copy(o).addScaledVector(d, t);
      camera.up.set(0, 1, 0); camera.lookAt(shotB.copy(camera.position).add(d)); camera.rotateX(-Math.atan(sny * Math.tan(fov * Math.PI / 360))); }
    if (label) label.textContent = (SHOT.cd > 0 ? "lädt … " + SHOT.cd.toFixed(1) + " s" : "Leertaste: schießen") + (SHOT.zoomT > 1 ? " · " + SHOT.zoomT.toFixed(1).replace(".", ",") + "x" : " · Mausrad: Zoom");
    if ((keys.has("Space") || jumpHeld) && SHOT.cd === 0 && SHOT.aim) {
      SHOT.cd = SHOT.RELOAD; const mz = C.gun.localToWorld(new THREE.Vector3(0, 0, -SHOT.MUZZLE)), dir = SHOT.aim.clone().sub(mz).normalize();
      const shell = fxAddMesh(fxGeo, fxAdd(0xffe2a0), mz, 0.14); shell.scale.set(0.12, 0.12, 0.5); shell.lookAt(mz.clone().add(dir));
      SHOT.shells.push({ o: shell, p: mz.clone(), dir, s: 0, from: C });
      SHOT.fx.push({ o: fxAddMesh(fxGeo, fxAdd(0xffc070), mz, 0.6), t0: now, life: 0.12, grow: 4, fade: true });   // Muendungsblitz
      for (let i = 0; i < 3; i++) SHOT.fx.push({ o: fxAddMesh(fxGeo, fxSmoke(0x8a8780), mz.clone().addScaledVector(dir, 0.6 + i * 0.7), 0.4), t0: now, life: 1.6, grow: 2.2, fade: true, vy: 0.8 });
      SHOT.recoil = 1; shotSound(0.6, 0.9); if (AUTO_UNZOOM && SHOT.zoomT > 1) SHOT.unzoom = 0.35;   // TEST Auto-Rauszoomen
    }
    if (C.gun.userData.z0 === undefined) C.gun.userData.z0 = C.gun.position.z;
    SHOT.recoil = Math.max(0, SHOT.recoil - dt * 2.5); C.gun.position.z = C.gun.userData.z0 + Math.sin(Math.min(1, SHOT.recoil) * Math.PI / 2) * 0.45;   // Rueckstoss
  }
  if (!C && SHOT.zoom !== 1) { SHOT.zoom = SHOT.zoomT = 1; if (walking && camera.fov !== 70 && !JET.on && !FLY.on) { camera.fov = 70; camera.updateProjectionMatrix(); } }   // ausgestiegen: Zoom zurueck
  // Granaten fliegen
  for (let i = SHOT.shells.length - 1; i >= 0; i--) { const s = SHOT.shells[i], step = SHOT.SPEED * dt, b = s.p.clone().addScaledVector(s.dir, step), h = shotSeg(s.p, b, s.from);
    s.s += step; s.p.copy(h ? h.p : b); s.o.position.copy(s.p);
    if (h || s.s > SHOT.RANGE) { scene.remove(s.o); SHOT.shells.splice(i, 1); if (h) { if (h.hit.veh) vehHit(h.hit.veh, h.p); else fxBoom(h.p, false); } } }
  // Effekte
  for (let i = SHOT.fx.length - 1; i >= 0; i--) { const f = SHOT.fx[i], a = (now - f.t0) / f.life; if (a < 0) { f.o.visible = false; continue; } f.o.visible = true;
    if (a >= 1) { scene.remove(f.o); f.o.material.dispose(); SHOT.fx.splice(i, 1); continue; }
    if (f.debris) { f.v.y -= 18 * dt; f.o.position.addScaledVector(f.v, dt); const gy = groundAt(f.o.position.x, f.o.position.z, f.o.position.y + 0.3); if (f.o.position.y < gy + 0.05) { f.o.position.y = gy + 0.05; f.v.multiplyScalar(0.3); f.v.y = Math.abs(f.v.y) * 0.3; } else { f.o.rotation.x += f.w.x * dt; f.o.rotation.y += f.w.y * dt; f.o.rotation.z += f.w.z * dt; } continue; }
    if (f.grow) f.o.scale.multiplyScalar(1 + f.grow * dt / Math.max(1, f.o.scale.x)); if (f.vy) f.o.position.y += f.vy * dt; if (f.fade) f.o.material.opacity = (f.o.material.blending === THREE.AdditiveBlending ? 1 : 0.8) * (1 - a); }
  // Wracks: hochspringen (1,2 s), dann schraeg liegen bleiben; Feuer flackert, Rauch steigt (Feuer 40 s, Rauch danach schwaecher bis 90 s)
  for (const W of SHOT.fires) { const v = W.v, t = now - v.boomT, up = t < 1.2 ? Math.max(0, 7 * t - 0.5 * 14 * t * t) * 0.45 : 0, sp = t < 1.2 ? t / 1.2 : 1;
    v.g.position.set(v.x, v.y + up, v.z); v.g.rotation.set(v.pitch + v.wreckPitch * sp + (t < 1.2 ? Math.sin(t * 9) * 0.08 : 0), v.h, v.roll + v.wreckRoll * sp, "YXZ"); v.g.updateMatrix();
    const fire = t < 40 ? 1 : 0; W.cones.forEach((c, i) => { c.visible = fire > 0 && v.g.visible; const fl = 0.75 + 0.5 * Math.random(); c.position.set(v.x + (i - 1) * 0.7 * Math.cos(v.h), v.y + (v === JET ? 0.3 : bodyHOf(v) * 0.55) + up, v.z - (i - 1) * 0.7 * Math.sin(v.h)); c.scale.set(fl * (i ? 0.9 : 0.6), fl * (i ? 1.1 : 1.6), fl * (i ? 0.9 : 0.6)); c.material.opacity = 0.75; });
    if (t < 90 && v.g.visible && (W.puff -= dt) <= 0) { W.puff = t < 40 ? 0.18 : 0.6; const q = new THREE.Vector3(v.x + (Math.random() - 0.5) * 1.5, v.y + (v === JET ? 1.2 : bodyHOf(v)) + up, v.z + (Math.random() - 0.5) * 1.5);
      SHOT.fx.push({ o: fxAddMesh(fxGeo, fxSmoke(t < 40 ? 0x1e1d1b : 0x55524d), q, 0.5), t0: now, life: 3.5, grow: 1.6, fade: true, vy: 2.6 }); } }
}
