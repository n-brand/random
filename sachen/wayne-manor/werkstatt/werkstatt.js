// Wayne Manor 3D – Werkstatt (T5, Nicolas 2026-11-12): einzelnes Modell auf leerer Flaeche mit Rundkurs und Slalom testen, ohne die Spielwelt.
// Klassisches Skript nach ../js/kern/basis.js und ../js/fahrzeuge/modelle.js (gemeinsamer globaler Bereich: scene, camera, controls, renderer, sun, M ...).
// Fahren hier bewusst einfach (Einspurmodell auf ebenem Boden, keine Kollision): zum Ansehen der Modelle in Bewegung, Raeder, Lenkung, Groesse.
"use strict";

// ---------- Modelle (Bauplan + Werte aus modelle.js) ----------
const MODELLE = [
  { name: "Tumbler", spec: SPEC_TUMBLER, bau: () => buildTumbler(0x16181b, 0x0d0e10) },
  { name: "Nachtfalke", spec: SPEC_NACHTFALKE, bau: () => buildNachtfalke() },
  { name: "Aventador LP 700-4", spec: SPEC_AVENTADOR, bau: () => buildAventador() },
  { name: "Rolls-Royce Spectre", spec: SPEC_SPECTRE, bau: () => buildSpectre() },
  { name: "Rolls-Royce (grau)", spec: SPEC_ROLLS, bau: () => buildRolls(0x55585e) },
  { name: "Mercedes-Benz G-Klasse", spec: SPEC_GCLASS, bau: () => buildGClass(0x141a22) },
  { name: "Gotham Police", spec: SPEC_POLICE, bau: () => buildPolice() },
  { name: "Gotham Taxi", spec: SPEC_TAXI, bau: () => buildTaxi() },
  { name: "Panzer", spec: SPEC_TANK, bau: () => buildTank() },
  { name: "Gemini Concept GT", spec: SPEC_GEMINI, bau: () => buildGemini() },
  { name: "ChatGPT GPT-6 Concept GT", spec: SPEC_CHATGPT, bau: () => buildChatGPT() },
  { name: "DeepSeek Concept Car", spec: SPEC_DEEPSEEK, bau: () => buildDeepSeek() },
  { name: "Batpod", spec: SPEC_BATPOD, bau: () => buildBatpod() },
  { name: "Boxer-Streetfighter", spec: SPEC_STREETFIGHTER, bau: () => buildStreetfighter() },
  { name: "Motorrad (rot)", spec: SPEC_BIKE, bau: () => buildBike(0xb0141e) },
  // Fluggeraete (Nicolas 2026-11-12): Modell, Flugphysik, Kamera und Ton direkt aus jet.js / the-bat.js des Spiels (flache Welt aus flug-shim.js)
  { name: "Kampfjet", flug: "jet" },
  { name: "The Bat (Batwing)", flug: "bat" },
];

// ---------- Szene: Licht, Boden, Rundkurs, Slalom ----------
scene.fog = new THREE.Fog(SKY_DAY.clone(), 250, 900);
camera.far = 1500; camera.updateProjectionMatrix();
controls.maxDistance = 400; controls.minDistance = 2;
const flaeche = new THREE.Group(); scene.add(flaeche);
{ // Boden: Beton mit Raster (1 Feld = 10 m)
  const tex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#6f746f"; g.fillRect(0, 0, w, h); g.strokeStyle = "#5b5f5b"; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
    g.strokeStyle = "#646864"; g.lineWidth = 1; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); }, 120, 120);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  ground.receiveShadow = true; flaeche.add(ground);
}
// Rundkurs: zwei Geraden 220 m, Kurven Radius 60 m (Mitte), Fahrbahn 14 m; Startlinie bei x 0 / z 60
const KURS = { L: 220, R: 60, B: 14 };
{ const asph = new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.9 }), weiss = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6 });
  const stadion = (r) => { const s = new THREE.Shape(), h = KURS.L / 2; s.moveTo(-h, -r); s.lineTo(h, -r); s.absarc(h, 0, r, -Math.PI / 2, Math.PI / 2, false); s.lineTo(-h, r); s.absarc(-h, 0, r, Math.PI / 2, Math.PI * 1.5, false); return s; };
  const ring = (ri, ro, m, y) => { const s = stadion(ro); s.holes.push(stadion(ri)); const g = new THREE.ShapeGeometry(s, 48).rotateX(-Math.PI / 2); g.translate(0, y, 0); const o = new THREE.Mesh(g, m); o.receiveShadow = true; flaeche.add(o); };
  ring(KURS.R - KURS.B / 2, KURS.R + KURS.B / 2, asph, 0.02);
  ring(KURS.R - KURS.B / 2 + 0.3, KURS.R - KURS.B / 2 + 0.5, weiss, 0.03);   // Randlinien
  ring(KURS.R + KURS.B / 2 - 0.5, KURS.R + KURS.B / 2 - 0.3, weiss, 0.03);
  for (let k = 0; k < 8; k++) { const q = new THREE.Mesh(new THREE.PlaneGeometry(1, KURS.B / 8).rotateX(-Math.PI / 2), k % 2 ? weiss : new THREE.MeshStandardMaterial({ color: 0x111111 }));   // Startlinie kariert
    q.position.set(0, 0.035, KURS.R - KURS.B / 2 + (k + 0.5) * KURS.B / 8); flaeche.add(q); }
  // Slalom: Pylonen alle 12 m auf einer Geraden ausserhalb des Kurses (z -130)
  const kegel = new THREE.MeshStandardMaterial({ color: 0xff6a00, roughness: 0.6 });
  for (let k = 0; k < 10; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 14), kegel); c.position.set(-54 + k * 12, 0.375, -130); c.castShadow = true; flaeche.add(c); }
  // Masslatte 10 m neben dem Start (weiss/rot je 1 m) zum Groessenvergleich
  for (let k = 0; k < 10; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: k % 2 ? 0xd23a3a : 0xf2f2ee })); b.position.set(-5 + k + 0.5, 0.04, KURS.R + KURS.B / 2 + 4); flaeche.add(b); }
}
// Zielscheiben in der Mitte des Rundkurses (Nicolas 2026-11-12): beidseitig bemalt, auf Holzbock; Treffer klappt die Scheibe nach hinten um,
// nach 5 s steht sie wieder. Schiessen koennen alle Modelle mit Turm und Rohr (Bauplan liefert turret/gun, heute der Panzer).
const ZIELE = [];
{ const tex = canvasTex(256, 256, (g, w) => { const R = w / 2; for (let k = 0; k < 6; k++) { g.fillStyle = k === 5 ? "#ffd43b" : k % 2 ? "#d23a3a" : "#f4f1ea"; g.beginPath(); g.arc(R, R, R * (1 - k / 6) - 1, 0, 7); g.fill(); g.strokeStyle = "#1a1a1a"; g.lineWidth = 2; g.stroke(); } });
  const scheibeM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }), holzM = new THREE.MeshStandardMaterial({ color: 0x7a5534, roughness: 0.9 }), randM = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
  // [x, z, Radius, Hoehe der Mitte, Blickrichtung]: grosse Scheiben in der Mittelreihe, kleine davor/dahinter (je zur naechsten Geraden)
  for (const [x, z, r, y, h] of [[-80, 0, 1.6, 2.4, 0], [-40, 0, 1.6, 2.4, Math.PI], [0, 0, 1.6, 2.4, 0], [40, 0, 1.6, 2.4, Math.PI], [80, 0, 1.6, 2.4, 0],
    [-60, 28, 0.8, 1.4, 0], [-20, 28, 0.8, 1.4, 0], [20, 28, 0.8, 1.4, 0], [60, 28, 0.8, 1.4, 0], [-60, -28, 0.8, 1.4, Math.PI], [-20, -28, 0.8, 1.4, Math.PI], [20, -28, 0.8, 1.4, Math.PI], [60, -28, 0.8, 1.4, Math.PI]]) {
    const st = new THREE.Group(); st.position.set(x, 0, z); st.rotation.y = h; flaeche.add(st);
    for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, y + 0.2, 0.14), holzM); b.position.set(sx * r * 0.7, (y + 0.2) / 2, 0.25); b.castShadow = true; st.add(b); }   // Bock
    const kl = new THREE.Group(); kl.position.set(0, y - r - 0.05, 0); st.add(kl);   // Klappe: Drehachse unten an der Scheibe
    const s = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 40).rotateX(Math.PI / 2), [randM, scheibeM, scheibeM]); s.position.y = r + 0.05; s.castShadow = true; kl.add(s);
    ZIELE.push({ x, z, y, r, h, kl, fall: 0, t: 0 });
  }
}

// ---------- Fluggeraete ----------
const FLUG = { jet: () => JET, bat: () => FLY };
// Startbahn (Kampfjet) und Landeplatz (The Bat) am Nordrand der Flaeche
const PAD = { x: -100, z: -200 };
{ const asph = new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.9 }), weiss = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6 });
  const bahn = new THREE.Mesh(new THREE.PlaneGeometry(RUNWAY.x1 - RUNWAY.x0, RUNWAY.w).rotateX(-Math.PI / 2), asph); bahn.position.set((RUNWAY.x0 + RUNWAY.x1) / 2, 0.02, RUNWAY.z); bahn.receiveShadow = true; flaeche.add(bahn);
  for (let x = RUNWAY.x0 + 30; x < RUNWAY.x1 - 20; x += 40) { const l = new THREE.Mesh(new THREE.PlaneGeometry(20, 0.9).rotateX(-Math.PI / 2), weiss); l.position.set(x, 0.03, RUNWAY.z); flaeche.add(l); }   // Mittellinie
  for (const sz of [-1, 1]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(RUNWAY.x1 - RUNWAY.x0, 0.6).rotateX(-Math.PI / 2), weiss); r.position.set((RUNWAY.x0 + RUNWAY.x1) / 2, 0.03, RUNWAY.z + sz * (RUNWAY.w / 2 - 1)); flaeche.add(r); }
  const pad = new THREE.Mesh(new THREE.CircleGeometry(11, 48).rotateX(-Math.PI / 2), asph); pad.position.set(PAD.x, 0.02, PAD.z); flaeche.add(pad);
  const ring = new THREE.Mesh(new THREE.RingGeometry(9.6, 10.2, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffd43b })); ring.position.set(PAD.x, 0.03, PAD.z); flaeche.add(ring);
  for (const [w, d, x, z] of [[1, 7, -2.2, 0], [1, 7, 2.2, 0], [3.4, 1, 0, 0]]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), weiss); b.position.set(PAD.x + x, 0.03, PAD.z + z); flaeche.add(b); }   // H
}
Object.assign(FLY, { x: PAD.x, y: 0, z: PAD.z, h: -Math.PI / 2 }); FLY.home = { x: FLY.x, y: FLY.y, z: FLY.z, h: FLY.h }; batPose(FLY, 0);
for (const F of [JET, FLY]) F.g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
function flugReset(F) { if (F === JET) return jetReset(); Object.assign(F, { ...F.home, vx: 0, vy: 0, vz: 0, pitch: 0, roll: 0, gearT: 0 }); player.yaw = F.h; batPose(F, 0); toast("The Bat zurück auf dem Landeplatz"); }

// ---------- Zielfahrzeuge (Nicolas 2026-11-12): geparkt suedlich der Startgeraden, Front zur Strecke; Schutzstufen wie im Spiel (ARMOR in
// modelle.js), Treffer als Kapsel wie vehCapsule in schiessen.js; zerstoert = verkohltes Wrack (springt hoch, raucht), nach 15 s wieder heil ----------
const ZIELAUTOS = [["Gotham Taxi", -60], ["Gotham Police", -30], ["Rolls-Royce (grau)", 0], ["Mercedes-Benz G-Klasse", 30], ["Tumbler", 60]].map(([n, x]) => {
  const m = MODELLE.find(q => q.name === n), b = m.bau(), z = 100; b.g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  b.g.position.set(x, 0, z); scene.add(b.g); const max = ARMOR[m.spec.name] || 2;
  return { name: n, spec: m.spec, g: b.g, x, z, h: 0, max, hp: max, dead: false, t: 0, puff: 0 };
});
function autoKapsel(v) { const sp = v.spec, L = Math.max(...sp.pts.map(Math.abs)) + sp.R * 0.5, r = Math.max(sp.R * 0.95, sp.bodyH * 0.5); return { y: sp.bodyH * 0.5, ax: Math.sin(v.h), az: Math.cos(v.h), L, r }; }
function autoAn(x, y, z) {   // Fahrzeug an Punkt? (wie shotAt im Spiel)
  for (const v of ZIELAUTOS) { const c = autoKapsel(v), dx = x - v.x, dz = z - v.z, t = Math.max(-c.L, Math.min(c.L, dx * c.ax + dz * c.az));
    const ex = dx - c.ax * t, ez = dz - c.az * t, ey = (y - c.y) * (c.r / Math.max(0.6, v.spec.bodyH * 0.55)); if (ex * ex + ey * ey + ez * ez < c.r * c.r) return v; }
  return null;
}
function autoTreffer(v, p) {
  if (v.dead) return;
  v.hp--; if (v.hp > 0) return toast(v.name + " getroffen – hält noch " + v.hp + " von " + v.max);
  v.dead = true; v.t = 0; v.roll = (Math.random() - 0.5) * 0.25; v.pitch = (Math.random() - 0.5) * 0.12; toast(v.name + " zerstört");
  fx(p, 0xfff0c0, 1.2, 0.2, 9); for (let i = 0; i < 5; i++) fx(new THREE.Vector3(v.x + (Math.random() - 0.5) * 2.5, 1 + Math.random() * 1.5, v.z + (Math.random() - 0.5) * 2.5), i % 2 ? 0xff7a1a : 0xffb23a, 0.8, 0.8, 4); knall(1);
  v.g.traverse(o => { if (!o.isMesh) return; o.userData.mat0 = o.material; const burn = m => { const c = m.clone(); if (c.color) c.color.lerp(new THREE.Color(0x1b1815), 0.86); if (c.emissive) c.emissive.set(0); if (c.map && !c.transparent) c.map = null; return c; };
    o.material = Array.isArray(o.material) ? o.material.map(burn) : burn(o.material); });
}
function autosStep(dt) {
  for (const v of ZIELAUTOS) { if (!v.dead) continue; v.t += dt; const t = v.t, up = t < 1.2 ? Math.max(0, 7 * t - 7 * t * t) * 0.45 : 0, k = Math.min(1, t / 1.2);
    v.g.position.set(v.x, up, v.z); v.g.rotation.set(v.pitch * k, v.h, v.roll * k, "YXZ");
    if ((v.puff -= dt) <= 0) { v.puff = 0.25; fx(new THREE.Vector3(v.x + (Math.random() - 0.5) * 1.5, v.spec.bodyH + up, v.z + (Math.random() - 0.5) * 1.5), 0x2b2a28, 0.5, 2.5, 1.6); }
    if (t > 15) { v.g.traverse(o => { if (o.isMesh && o.userData.mat0) { o.material = o.userData.mat0; delete o.userData.mat0; } }); v.dead = false; v.hp = v.max; v.g.position.set(v.x, 0, v.z); v.g.rotation.set(0, v.h, 0); toast(v.name + " ist wieder heil"); } }
}

// ---------- Modell laden ----------
const START = { x: 0, z: KURS.R, h: -Math.PI / 2 };   // auf der Startlinie, Front nach Osten (+x)
let AKT = null;   // { m, g, wheels, spec, x, z, h, v, steer, maße }
const $info = $("info"), $speed = $("speed"), fmt = v => String(Math.round(v * 100) / 100).replace(".", ",");
function laden(i) {
  world.userData.car.leave();                                             // Jet / The Bat aussteigen (bleiben stehen, wo sie sind)
  if (AKT && !AKT.flug) { scene.remove(AKT.g); AKT.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  const m = MODELLE[i];
  if (m.flug) {
    const F = FLUG[m.flug](), r = F.g.rotation.clone(); F.g.rotation.set(0, 0, 0); F.g.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(F.g).getSize(new THREE.Vector3()); F.g.rotation.copy(r); F.g.updateMatrixWorld(true);
    AKT = { m, flug: m.flug, F, g: F.g, size, spec: {} }; sicht();
    $info.innerHTML = `<table><tr><td>Länge</td><td>${fmt(size.z)} m</td></tr><tr><td>Breite</td><td>${fmt(size.x)} m</td></tr><tr><td>Höhe</td><td>${fmt(size.y)} m</td></tr>
      ${m.flug === "jet" ? `<tr><td>Abheben ab</td><td>${Math.round(JET_VS * 1.15 * 3.6)} km/h</td></tr><tr><td>Steuerung</td><td>W/S Schub, A/D rollen, Maus Nase</td></tr>` : `<tr><td>Höchstgeschw.</td><td>252 km/h</td></tr><tr><td>Steuerung</td><td>W/S, A/D, Leertaste/C</td></tr>`}</table>
      <div class="note">Flugphysik, Kamera und Ton wie im Spiel. V Kamera, R zurück ${m.flug === "jet" ? "an den Start der Piste" : "auf den Landeplatz"}.</div>`;
    if (modus === "drive") flugStart(); else { controls.target.set(F.x, F.y + 1, F.z); camera.position.set(F.x + size.z * 0.9 + 6, F.y + size.y + 6, F.z + size.z * 1.1 + 6); }
    try { localStorage.setItem("werkstatt-modell", String(i)); } catch (e) {}
    return;
  }
  const b = m.bau(); b.g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(b.g);
  b.g.rotation.set(0, 0, 0); b.g.position.set(0, 0, 0); b.g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(b.g), size = box.getSize(new THREE.Vector3());
  AKT = { m, g: b.g, wheels: b.wheels || [], spec: m.spec, x: START.x, z: START.z, h: START.h, v: 0, steer: 0, size, lean: 0, turret: b.turret && b.gun ? b.turret : null, gun: b.gun, gunMin: b.gunMin };
  if (AKT.gun) AKT.gun.userData.z0 = AKT.gun.position.z;
  kYaw = START.h; kPitch = -0.12; ZOOM.z = ZOOM.t = 1; if (modus === "drive") { camera.fov = 70; camera.updateProjectionMatrix(); }
  setze(); sicht();
  const s = m.spec;
  $info.innerHTML = `<table>
    <tr><td>Länge</td><td>${fmt(size.z)} m</td></tr><tr><td>Breite</td><td>${fmt(size.x)} m</td></tr><tr><td>Höhe</td><td>${fmt(size.y)} m</td></tr>
    <tr><td>Radstand</td><td>${fmt(s.wb)} m</td></tr><tr><td>Spur</td><td>${s.track ? fmt(s.track) + " m" : "Zweirad"}</td></tr>
    <tr><td>Höchstgeschw.</td><td>${Math.round((s.maxF || s.maxN) * 3.6)} km/h</td></tr><tr><td>Beschleunigung</td><td>${fmt(s.acc)} m/s²</td></tr></table>`;
  if (modus !== "drive") { controls.target.set(AKT.x, size.y * 0.45, AKT.z); camera.position.set(AKT.x + size.z * 1.1 + 3, size.y + 2.5, AKT.z + size.z * 1.3 + 3); }
  try { localStorage.setItem("werkstatt-modell", String(i)); } catch (e) {}
}
function flugStart() { const F = AKT.F; player.pos.set(F.x, AKT.flug === "jet" ? F.y - JET_Y : F.y, F.z); if (!(AKT.flug === "jet" ? useJet() : useFly())) toast("Einsteigen ging nicht"); }
function setze() { const A = AKT; if (A.flug) return; A.g.position.set(A.x, 0, A.z); A.g.rotation.set(0, A.h, A.spec.track ? 0 : A.lean, "YXZ"); }
window.werkstattTeleport = p => { if (!AKT || AKT.flug) return; AKT.x = p.x; AKT.z = p.z; AKT.v = 0; setze(); };

// ---------- Auswahl und Ansicht ----------
const pick = $("pick");
MODELLE.forEach((m, i) => { const o = document.createElement("option"); o.value = i; o.textContent = m.name; pick.appendChild(o); });
{ const og = document.createElement("optgroup"); og.label = "Gebäude-Vorlagen (kommen mit G3)"; const o = document.createElement("option"); o.disabled = true; o.textContent = "noch keine"; og.appendChild(o); pick.appendChild(og); }
pick.onchange = () => laden(+pick.value);
let modus = "orbit";
const setModus = m => { const war = modus; modus = m;
  if (AKT && AKT.flug && war === "drive" && m !== "drive") world.userData.car.leave(); for (const [id, k] of [["m-orbit", "orbit"], ["m-drive", "drive"], ["m-spin", "spin"]]) $(id).setAttribute("aria-pressed", String(m === k));
  document.body.classList.toggle("drive", m === "drive"); controls.enabled = m !== "drive"; $speed.hidden = m !== "drive";
  if (m !== "drive" && document.pointerLockElement) document.exitPointerLock();
  if (m === "drive" && AKT && !AKT.flug) { kYaw = AKT.h; kPitch = -0.12; A_view = 0; }
  if (m === "drive" && AKT && AKT.flug && war !== "drive") flugStart();
  if (m !== "drive") { ZOOM.z = ZOOM.t = 1; ZOOM.un = 0; }
  camera.fov = m === "drive" ? 70 : 45; camera.updateProjectionMatrix();
  if (m !== "drive" && AKT) { if (AKT.flug) controls.target.set(AKT.F.x, AKT.F.y + 1, AKT.F.z); else controls.target.set(AKT.x, AKT.size.y * 0.45, AKT.z); }
  sicht(); };
const MODI = ["orbit", "drive", "spin"];
$("m-orbit").onclick = () => setModus("orbit"); $("m-drive").onclick = () => setModus("drive"); $("m-spin").onclick = () => setModus("spin");
// Visier (nur Fahren mit Turm) und Hinweis zur Maus
function sicht() { const z = modus === "drive" && AKT && AKT.turret; $("visier").hidden = !z; if (!z) $("rohr").hidden = true; document.body.classList.toggle("waffe", !!z); maushinweis(); }
function maushinweis() { $("maus").hidden = modus !== "drive" || !!document.pointerLockElement || document.body.classList.contains("touch"); }

// ---------- Maus einfangen (Fahren): Linksklick faengt die Maus, erneuter Linksklick oder Esc gibt sie frei ----------
// Wie im Spiel (fahren.js carCamera, bedienung.js): kYaw/kPitch = player.yaw/pitch, Empfindlichkeit fest 50 %, im Panzer-Zoom feiner
let kYaw = 0, kPitch = -0.12, A_view = 0;   // A_view 1 = Fahrersicht (V)
const MOUSE_SENS = 0.0025 * 0.5, ZOOM = { z: 1, t: 1, un: 0 };
const ZOOM_SENS_GLEICH = true;   // TEST wie schiessen.js (Nicolas 2026-11-12): Maus im Zoom gleich schnell; false = durch den Zoom geteilt
renderer.domElement.addEventListener("mousedown", e => { if (e.button !== 0 || modus !== "drive") return; if (document.pointerLockElement) document.exitPointerLock(); else renderer.domElement.requestPointerLock(); });
document.addEventListener("pointerlockchange", maushinweis);
addEventListener("mousemove", e => { if (document.pointerLockElement !== renderer.domElement) return;
  if (AKT && AKT.flug) return look(e.movementX * MOUSE_SENS, e.movementY * MOUSE_SENS);   // Fluggeraete: Blick wie im Spiel (player.yaw/pitch)
  const k = ZOOM_SENS_GLEICH ? 1 : ZOOM.z; kYaw -= e.movementX * MOUSE_SENS / k; kPitch = Math.max(-1.5, Math.min(1.5, kPitch - e.movementY * MOUSE_SENS / k)); });
// Mausrad im Panzer: Zoom 1x bis 6x (wie schiessen.js)
addEventListener("wheel", e => { if (!(modus === "drive" && AKT && AKT.turret)) return; e.preventDefault(); ZOOM.t = Math.max(1, Math.min(6, ZOOM.t * (e.deltaY < 0 ? 1.25 : 0.8))); if (ZOOM.t < 1.05) ZOOM.t = 1; }, { passive: false });
if (matchMedia("(pointer: coarse)").matches) document.body.classList.add("touch");

// ---------- Tasten ----------
const keys = new Set();
addEventListener("keydown", e => { if (e.target.tagName === "SELECT") return; keys.add(e.code);
  if (AKT && AKT.flug) { if (modus === "drive" && !e.repeat) { const F = AKT.F;   // Fluggeraete: V Kamera, R zurueck (wie bedienung.js)
      if (e.code === "KeyV") { F.view = F.view === 1 ? 0 : 1; if (F === JET) player.yaw = F.h; else player.pitch = F.view ? 0 : -0.2; }
      if (e.code === "KeyR") flugReset(F);
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") { if (F === JET ? useJet() : useFly()) if (!F.on) setModus("orbit"); } }   // Shift aussteigen (nur gelandet, wie im Spiel)
  } else if (e.code === "KeyR" && AKT) { Object.assign(AKT, { x: START.x, z: START.z, h: START.h, v: 0, steer: 0 }); setze(); }
  if (e.code === "KeyV" && !e.repeat && !(AKT && AKT.flug)) A_view = A_view ? 0 : 1;
  if (e.code === "KeyF" || (e.code === "KeyE" && modus !== "drive")) setModus(modus === "drive" ? "orbit" : "drive");
  const n = /^(Digit|Numpad)([1-3])$/.exec(e.code); if (n) setModus(MODI[+n[2] - 1]);   // 1 Ansehen, 2 Fahren, 3 Drehteller
  if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault(); });
addEventListener("keyup", e => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
for (const b of document.querySelectorAll("#touch button")) { const k = b.dataset.k;
  b.addEventListener("pointerdown", e => { e.preventDefault(); keys.add(k); }); for (const ev of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(ev, () => keys.delete(k)); }
const down = (...c) => c.some(k => keys.has(k));

// ---------- Fahren (Einspurmodell) ----------
function fahren(dt) {
  const A = AKT, s = A.spec, vmax = s.maxF || s.maxN || 30, gas = down("KeyW", "ArrowUp"), brems = down("KeyS", "ArrowDown"), links = down("KeyA", "ArrowLeft"), rechts = down("KeyD", "ArrowRight");
  // wie im Spiel (fahren.js carStep): Gas/Bremse/Ausrollen, Lenken mit Anlaufzeit, Kurvenphysik (modelle.js); Gelaende ist hier eben
  const th = gas ? 1 : brems ? -1 : 0, st = (links ? 1 : 0) - (rechts ? 1 : 0);
  if (st && Math.sign(st) === A.stDir) A.stHold = (A.stHold || 0) + dt; else { A.stHold = 0; A.stDir = Math.sign(st); }
  const hk = Math.min(1, A.stHold / 0.45), stF = st ? 0.25 + 0.75 * hk * hk * (3 - 2 * hk) : 0;
  A.steer += (st * stF * s.steer / (1 + Math.abs(A.v) / 14) - A.steer) * Math.min(1, dt * 8);
  const KP = kurvenPhysik(s, A.v, A.steer, th, vmax); A.aLat = A.v * A.v * Math.abs(KP.k);
  A.h += A.v * KP.k * dt;
  const brk = (s.brake || 28) + Math.abs(A.v) * 0.2;
  if (th > 0) A.v += (A.v < -0.2 ? brk : s.acc * (1 - Math.max(0, A.v) / (vmax + 8)) * KP.thF) * dt;
  else if (th < 0) A.v -= (A.v > 0.2 ? brk : s.revMax ? s.acc * (1 - Math.max(0, -A.v) / (s.revMax + 8)) : 6) * dt;
  else A.v -= Math.sign(A.v) * Math.min(Math.abs(A.v), (3 + Math.abs(A.v) * 0.06) * dt);
  if (down("Space") && !A.turret) A.v -= Math.sign(A.v) * Math.min(Math.abs(A.v), 14 * dt);   // Handbremse (mit Turm ist Leertaste = schiessen)
  A.v -= Math.sign(A.v) * Math.min(Math.abs(A.v), KP.dec * dt);                                   // Kurvenwiderstand / Radieren
  A.v = Math.max(th < 0 ? -(s.revMax || 8) : -16, Math.min(vmax, A.v));
  A.x -= Math.sin(A.h) * A.v * dt; A.z -= Math.cos(A.h) * A.v * dt;   // vorne = -z im Modell
  const lim = 580; A.x = Math.max(-lim, Math.min(lim, A.x)); A.z = Math.max(-lim, Math.min(lim, A.z));
  A.lean += ((s.track ? 0 : A.steer * Math.min(1, Math.abs(A.v) / 6) * 0.9) - A.lean) * Math.min(1, dt * 5);   // Zweirad legt sich in die Kurve (wie fahren.js)
  for (const w of A.wheels) { w.spin.rotation.x -= A.v * dt / w.r; if (w.front) w.piv.rotation.y = A.steer; }
  setze();
  $speed.textContent = Math.round(Math.abs(A.v) * 3.6) + " km/h";
  // Kamera wie im Spiel (fahren.js): Lenken dreht den Blick mit (ausser Panzer), ab 3 m/s gleitet er hinter das Fahrzeug (rueckwaerts davor)
  const dh = A.h - (A.dh0 ?? A.h); A.dh0 = A.h;
  if (!A.turret) { kYaw += dh; if (Math.abs(A.v) > 3) kYaw += wrapW(A.h + (A.v < 0 ? Math.PI : 0) - kYaw) * Math.min(1, dt * 1.2); }
  // erst die normale Kamera (Verfolger oder Fahrersicht), danach zielt die Waffe von dort und setzt gezoomt die Zieloptik
  const TG = tempoGefuehl(A.v, performance.now() / 1000);   // Tempo-Gefuehl wie fahren.js carCamera (modelle.js)
  if (!A.turret && Math.abs(camera.fov - TG.fov) > 0.05) { camera.fov = TG.fov; camera.updateProjectionMatrix(); }
  if (A_view === 1 && s.seat) { const [sx, sy, sz] = s.seat, sn = Math.sin(A.h), c = Math.cos(A.h);
    camera.position.set(A.x + sx * c + sz * sn, sy, A.z - sx * sn + sz * c); camera.rotation.set(kPitch + TG.sy * 0.15, kYaw + TG.sx * 0.1, 0, "YXZ"); }
  else { const D = (s.camD || 8) * TG.dK, H = Math.max(0.9, Math.min(7, 2.2 - kPitch * 6)), tx = A.x, ty = s.camH || 1.2, tz = A.z;
    const ex = Math.sin(kYaw) * D, ey = Math.max(0.5, H - 1.3 + 0.9 + TG.hK), ez = Math.cos(kYaw) * D;
    camera.position.set(tx + ex + TG.sx, Math.max(0.3, ty + ey + TG.sy), tz + ez); camera.up.set(0, 1, 0); camera.lookAt(tx, ty + 0.3, tz); }
  if (A.turret) waffe(dt);
}
const wrapW = a => Math.atan2(Math.sin(a), Math.cos(a));

// ---------- Schiessen (Modelle mit Turm): Visier auf 36 % der Bildhoehe wie im Spiel, Granate 320 m/s gerade zum Zielpunkt ----------
const SCHUSS = { cd: 0, RELOAD: 2.2, V: 320, MUZZLE: 4.75, shells: [], fx: [], treffer: 0, schuesse: 0, rueck: 0 };
const rc = new THREE.Raycaster(), vA = new THREE.Vector3(), vB = new THREE.Vector3();
const fxGeo = new THREE.SphereGeometry(1, 12, 8), fxMat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, fog: false });
function zielpunkt() {   // Strahl durch das Visier: erste Scheibe oder der Boden, sonst 900 m voraus
  rc.setFromCamera(new THREE.Vector2(0, 0.28), camera);
  let best = 900; const o = rc.ray.origin, dv = rc.ray.direction;
  if (dv.y < -1e-4) best = Math.min(best, -o.y / dv.y);
  for (let t = 6; t < best; t += 1) { const q = o.clone().addScaledVector(dv, t); if (autoAn(q.x, q.y, q.z)) { best = t; break; } }   // Zielfahrzeuge
  for (const Z of ZIELE) { if (Z.fall > 0.05) continue; vA.set(Z.x, Z.y, Z.z); const t = vA.sub(o).dot(dv); if (t > 0 && t < best && o.clone().addScaledVector(dv, t).distanceTo(new THREE.Vector3(Z.x, Z.y, Z.z)) < Z.r) best = t; }
  return o.clone().addScaledVector(dv, best);
}
function waffe(dt) {   // wie schiessen.js: Turm zeigt in Blickrichtung, das Rohr hebt/senkt sich zum Zielpunkt im Visier
  // Zielen immer mit der normalen Kamera bei 70 Grad: der Zoom aendert nur das Bild, nicht wohin das Visier zeigt (Nicolas 2026-11-12)
  if (camera.fov !== 70) { camera.fov = 70; camera.updateProjectionMatrix(); }
  camera.updateMatrixWorld();
  const A = AKT, aim = zielpunkt(); A.aim = aim;
  // Turm und Rohr laufen dem Visier nach (wie fahren.js/schiessen.js, Variante A zum Testen): Turm spec.turretSpeed, Rohr spec.gunSpeed Grad/s
  A.g.updateMatrixWorld(true); A.turret.getWorldPosition(vA); A.gun.getWorldPosition(vB);
  A.tw = A.tw ?? A.h; const tv = (A.spec.turretSpeed || 40) * Math.PI / 180 * dt, gv = (A.spec.gunSpeed || 20) * Math.PI / 180 * dt;
  A.tw += Math.max(-tv, Math.min(tv, wrapW(Math.atan2(-(aim.x - vA.x), -(aim.z - vA.z)) - A.tw)));
  A.elev = A.elev ?? 0; A.elev += Math.max(-gv, Math.min(gv, Math.max(-0.4, Math.min(0.55, Math.atan2(aim.y - vB.y, Math.hypot(aim.x - vB.x, aim.z - vB.z)))) - A.elev));
  A.turret.rotation.y = wrapW(A.tw - A.h);
  const ad = (((A.turret.rotation.y * 180 / Math.PI) % 360) + 360) % 360, a0 = Math.floor(ad) % 360, fr = ad - Math.floor(ad), lo = A.gunMin ? A.gunMin[a0] * (1 - fr) + A.gunMin[(a0 + 1) % 360] * fr : -0.45;
  A.gun.rotation.x = Math.max(lo, Math.min(0.6, A.elev));
  // Zoom: ab mehr als 1x sitzt die Kamera in der Zieloptik oben am Turm; nach einem Schuss nach 0,35 s zurueck auf 1x (wie im Spiel, dort TEST)
  if (ZOOM.un > 0 && (ZOOM.un -= dt) <= 0) ZOOM.t = 1;
  ZOOM.z += (ZOOM.t - ZOOM.z) * Math.min(1, dt * 10); const fov = 70 / ZOOM.z; if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  // gezoomt (wie schiessen.js): Kamera auf dem Visier-Strahl der normalen Kamera neben der Zieloptik am Turm, Blick entlang des Strahls,
  // um den Visier-Winkel gesenkt: Visier zeigt wie ohne Zoom, Ansicht unabhaengig von der Zielentfernung (keine Parallaxe)
  if (ZOOM.z > 1.01) { A.turret.updateWorldMatrix(true, false); A.turret.localToWorld(vA.set(0.52, 1.25, -0.9));
    const o = rc.ray.origin, d = rc.ray.direction, t = Math.max(0, vA.sub(o).dot(d)); camera.position.copy(o).addScaledVector(d, t);
    camera.up.set(0, 1, 0); camera.lookAt(camera.position.clone().add(d)); camera.rotateX(-Math.atan(0.28 * Math.tan(fov * Math.PI / 360))); }
  SCHUSS.cd = Math.max(0, SCHUSS.cd - dt);
  if (down("Space") && SCHUSS.cd === 0) {
    SCHUSS.cd = SCHUSS.RELOAD; SCHUSS.schuesse++; SCHUSS.rueck = 1;
    A.gun.updateWorldMatrix(true, false); A.gun.getWorldPosition(vB); const mz = A.gun.localToWorld(new THREE.Vector3(0, 0, -(A.spec.muzzle || SCHUSS.MUZZLE))), dir = mz.clone().sub(vB).normalize();   // entlang des Rohrs
    const o = new THREE.Mesh(fxGeo, fxMat(0xffe2a0)); o.scale.set(0.12, 0.12, 0.5); o.position.copy(mz); o.lookAt(mz.clone().add(dir)); scene.add(o);
    SCHUSS.shells.push({ o, p: mz.clone(), dir, s: 0 });
    fx(mz, 0xffc070, 0.6, 0.12, 4); knall(0.5); if (ZOOM.t > 1) ZOOM.un = 0.35;
  }
  rohrMarke(A, aim);
  SCHUSS.rueck = Math.max(0, SCHUSS.rueck - dt * 2.5); A.gun.position.z = A.gun.userData.z0 + Math.sin(Math.min(1, SCHUSS.rueck) * Math.PI / 2) * 0.45;
  $("visier-t").textContent = (SCHUSS.cd > 0 ? "lädt … " + SCHUSS.cd.toFixed(1).replace(".", ",") + " s" : "Leertaste: schießen") + ` · Treffer ${SCHUSS.treffer} / ${SCHUSS.schuesse}` + (ZOOM.t > 1 ? " · " + ZOOM.t.toFixed(1).replace(".", ",") + "x" : " · Mausrad: Zoom");
}
// Rohr-Markierung (wie gunMark in schiessen.js): Punkt entlang des Rohrs in Zielentfernung, sichtbar ab 10 px neben der Visiermitte
function rohrMarke(A, aim) {
  const el = $("rohr"); A.gun.updateWorldMatrix(true, false); A.gun.getWorldPosition(vB);
  const mz = A.gun.localToWorld(new THREE.Vector3(0, 0, -(A.spec.muzzle || SCHUSS.MUZZLE))), dir = mz.clone().sub(vB).normalize(), p = mz.addScaledVector(dir, Math.max(5, aim.distanceTo(mz)));
  camera.updateMatrixWorld(); p.project(camera);
  const x = (p.x + 1) / 2 * innerWidth, y = (1 - p.y) / 2 * innerHeight, sy = (1 - 0.28) / 2 * innerHeight;
  el.hidden = p.z > 1 || Math.hypot(x - innerWidth / 2, y - sy) < 10; el.style.left = x + "px"; el.style.top = y + "px";
}
function fx(p, c, r, life, grow) { const o = new THREE.Mesh(fxGeo, fxMat(c)); o.position.copy(p); o.scale.setScalar(r); scene.add(o); SCHUSS.fx.push({ o, r, life, grow, t: 0 }); }
function schuesseStep(dt) {
  for (let i = SCHUSS.shells.length - 1; i >= 0; i--) {
    const S = SCHUSS.shells[i], weg = SCHUSS.V * dt; let hit = null;
    for (let s = 0; s < weg && !hit; s += 0.5) {
      const p = S.p.clone().addScaledVector(S.dir, s);
      if (p.y <= 0) hit = { p };
      for (const Z of ZIELE) if (Z.fall < 0.05 && Math.hypot(p.x - Z.x, p.y - Z.y, p.z - Z.z) < Z.r + 0.15) { hit = { p, Z }; break; }
      if (!hit && S.s + s > 3) { const v = autoAn(p.x, p.y, p.z); if (v) hit = { p, v }; }
    }
    S.p.addScaledVector(S.dir, weg); S.s += weg; S.o.position.copy(S.p);
    if (hit || S.s > 900) {
      scene.remove(S.o); S.o.material.dispose(); SCHUSS.shells.splice(i, 1);
      if (hit) { fx(hit.p, 0xffa040, 0.8, 0.35, 5); fx(hit.p, 0x8a8780, 0.6, 1.4, 3); knall(0.3);
        if (hit.Z) { hit.Z.fall = 0.06; hit.Z.t = 0; SCHUSS.treffer++; }
        if (hit.v) { if (!hit.v.dead) SCHUSS.treffer++; autoTreffer(hit.v, hit.p); } }
    }
  }
  for (let i = SCHUSS.fx.length - 1; i >= 0; i--) { const F = SCHUSS.fx[i]; F.t += dt; const k = F.t / F.life;
    if (k >= 1) { scene.remove(F.o); F.o.material.dispose(); SCHUSS.fx.splice(i, 1); continue; }
    F.o.scale.setScalar(F.r * (1 + F.grow * k)); F.o.material.opacity = 1 - k; }
  for (const Z of ZIELE) {   // getroffene Scheiben klappen nach hinten um und stehen nach 5 s wieder auf
    if (Z.fall <= 0) continue; Z.t += dt;
    Z.fall = Z.t < 5 ? Math.min(1, Z.fall + dt * 3) : Math.max(0, Z.fall - dt * 1.2);
    Z.kl.rotation.x = -Z.fall * Math.PI / 2 * 0.95;
  }
}
let audio = null;
function knall(vol) {   // kurzer Knall aus gefiltertem Rauschen (Web Audio, ohne Dateien)
  try { audio = audio || new AudioContext(); const a = audio, n = a.sampleRate * 0.6, buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = buf; f.type = "lowpass"; f.frequency.setValueAtTime(1800, a.currentTime); f.frequency.exponentialRampToValueAtTime(120, a.currentTime + 0.5);
    g.gain.value = vol * 0.6; s.connect(f).connect(g).connect(a.destination); s.start(); } catch (e) {}
}

// ---------- Schleife ----------
function groesse() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize", groesse);
let last = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  if (AKT) {
    const F = AKT.F;
    if (AKT.flug) {   // Jet / The Bat: Schritt, Kamera und Ton aus dem Spiel; Anzeige aus dessen Tempo-Text
      if (modus === "drive" && F.on) { if (F === JET) jetStep(dt); else flyStep(dt); $speed.textContent = speedEl.textContent; }
      else { if (modus === "spin") { F.h += dt * 0.5; if (F === JET) jetPose(F, dt); else batPose(F, dt); } controls.update(); }
    } else if (modus === "drive") fahren(dt);
    else { if (modus === "spin") { AKT.h += dt * 0.5; setze(); } controls.update(); }
    const px = F ? F.x : AKT.x, pz = F ? F.z : AKT.z, py = F ? Math.max(0, F.y - 10) : 0;
    sun.position.set(px + SUN_DIR.x * 100, py + SUN_DIR.y * 100, pz + SUN_DIR.z * 100); sun.target.position.set(px, py, pz);
  }
  schuesseStep(dt); autosStep(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
groesse();
let start = 0; try { start = Math.min(MODELLE.length - 1, Math.max(0, +localStorage.getItem("werkstatt-modell") || 0)); } catch (e) {}
pick.value = start; laden(start);
requestAnimationFrame(loop);
