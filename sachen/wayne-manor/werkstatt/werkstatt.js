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

// ---------- Modell laden ----------
const START = { x: 0, z: KURS.R, h: -Math.PI / 2 };   // auf der Startlinie, Front nach Osten (+x)
let AKT = null;   // { m, g, wheels, spec, x, z, h, v, steer, maße }
const $info = $("info"), $speed = $("speed"), fmt = v => String(Math.round(v * 100) / 100).replace(".", ",");
function laden(i) {
  if (AKT) { scene.remove(AKT.g); AKT.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  const m = MODELLE[i], b = m.bau(); b.g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(b.g);
  b.g.rotation.set(0, 0, 0); b.g.position.set(0, 0, 0); b.g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(b.g), size = box.getSize(new THREE.Vector3());
  AKT = { m, g: b.g, wheels: b.wheels || [], spec: m.spec, x: START.x, z: START.z, h: START.h, v: 0, steer: 0, size, lean: 0 };
  setze();
  const s = m.spec;
  $info.innerHTML = `<table>
    <tr><td>Länge</td><td>${fmt(size.z)} m</td></tr><tr><td>Breite</td><td>${fmt(size.x)} m</td></tr><tr><td>Höhe</td><td>${fmt(size.y)} m</td></tr>
    <tr><td>Radstand</td><td>${fmt(s.wb)} m</td></tr><tr><td>Spur</td><td>${s.track ? fmt(s.track) + " m" : "Zweirad"}</td></tr>
    <tr><td>Höchstgeschw.</td><td>${Math.round((s.maxF || s.maxN) * 3.6)} km/h</td></tr><tr><td>Beschleunigung</td><td>${fmt(s.acc)} m/s²</td></tr></table>`;
  if (modus !== "drive") { controls.target.set(AKT.x, size.y * 0.45, AKT.z); camera.position.set(AKT.x + size.z * 1.1 + 3, size.y + 2.5, AKT.z + size.z * 1.3 + 3); }
  try { localStorage.setItem("werkstatt-modell", String(i)); } catch (e) {}
}
function setze() { const A = AKT; A.g.position.set(A.x, 0, A.z); A.g.rotation.set(0, A.h, A.spec.track ? 0 : A.lean, "YXZ"); }
window.werkstattTeleport = p => { if (!AKT) return; AKT.x = p.x; AKT.z = p.z; AKT.v = 0; setze(); };

// ---------- Auswahl und Ansicht ----------
const pick = $("pick");
MODELLE.forEach((m, i) => { const o = document.createElement("option"); o.value = i; o.textContent = m.name; pick.appendChild(o); });
{ const og = document.createElement("optgroup"); og.label = "Gebäude-Vorlagen (kommen mit G3)"; const o = document.createElement("option"); o.disabled = true; o.textContent = "noch keine"; og.appendChild(o); pick.appendChild(og); }
pick.onchange = () => laden(+pick.value);
let modus = "orbit";
const setModus = m => { modus = m; for (const [id, k] of [["m-orbit", "orbit"], ["m-drive", "drive"], ["m-spin", "spin"]]) $(id).setAttribute("aria-pressed", String(m === k));
  document.body.classList.toggle("drive", m === "drive"); controls.enabled = m !== "drive"; $speed.hidden = m !== "drive";
  if (m !== "drive" && AKT) controls.target.set(AKT.x, AKT.size.y * 0.45, AKT.z); };
$("m-orbit").onclick = () => setModus("orbit"); $("m-drive").onclick = () => setModus("drive"); $("m-spin").onclick = () => setModus("spin");
if (matchMedia("(pointer: coarse)").matches) document.body.classList.add("touch");

// ---------- Tasten ----------
const keys = new Set();
addEventListener("keydown", e => { if (e.target.tagName === "SELECT") return; keys.add(e.code);
  if (e.code === "KeyR" && AKT) { Object.assign(AKT, { x: START.x, z: START.z, h: START.h, v: 0, steer: 0 }); setze(); }
  if (e.code === "KeyV") kamNah = !kamNah;
  if (e.code === "KeyF" || (e.code === "KeyE" && modus !== "drive")) setModus(modus === "drive" ? "orbit" : "drive");
  if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault(); });
addEventListener("keyup", e => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
for (const b of document.querySelectorAll("#touch button")) { const k = b.dataset.k;
  b.addEventListener("pointerdown", e => { e.preventDefault(); keys.add(k); }); for (const ev of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(ev, () => keys.delete(k)); }
const down = (...c) => c.some(k => keys.has(k));
let kamNah = false;

// ---------- Fahren (Einspurmodell) ----------
function fahren(dt) {
  const A = AKT, s = A.spec, vmax = s.maxF || s.maxN || 30, gas = down("KeyW", "ArrowUp"), brems = down("KeyS", "ArrowDown"), links = down("KeyA", "ArrowLeft"), rechts = down("KeyD", "ArrowRight");
  if (gas) A.v += (A.v < 0 ? s.acc * 2.5 : s.acc) * dt;
  else if (brems) A.v -= (A.v > 0 ? s.acc * 2.5 : s.acc * 0.6) * dt;
  else A.v -= Math.sign(A.v) * Math.min(Math.abs(A.v), 2.5 * dt);   // ausrollen
  if (down("Space")) A.v -= Math.sign(A.v) * Math.min(Math.abs(A.v), 14 * dt);
  A.v = Math.max(-vmax * 0.3, Math.min(vmax, A.v));
  const ziel = (links ? 1 : 0) - (rechts ? 1 : 0), maxL = (s.steer || 0.6) / (1 + Math.abs(A.v) / 18);   // bei Tempo weniger Lenkeinschlag
  A.steer += (ziel * maxL - A.steer) * Math.min(1, dt * 6);
  A.h += A.v / s.wb * Math.tan(A.steer) * dt;
  A.x -= Math.sin(A.h) * A.v * dt; A.z -= Math.cos(A.h) * A.v * dt;   // vorne = -z im Modell
  const lim = 580; A.x = Math.max(-lim, Math.min(lim, A.x)); A.z = Math.max(-lim, Math.min(lim, A.z));
  A.lean += ((s.track ? 0 : Math.max(-0.6, Math.min(0.6, A.v * A.v / 9.81 * Math.tan(A.steer) / s.wb))) - A.lean) * Math.min(1, dt * 5);   // Zweirad legt sich in die Kurve
  for (const w of A.wheels) { w.spin.rotation.x -= A.v * dt / w.r; if (w.front) w.piv.rotation.y = A.steer; }
  setze();
  $speed.textContent = Math.round(Math.abs(A.v) * 3.6) + " km/h";
  // Kamera folgt (hinten oder nah)
  const d = kamNah ? (s.camD || 8) * 0.55 : (s.camD || 8), hgt = (s.camH || 1.2) + (kamNah ? 0.6 : 1.8), cx = A.x + Math.sin(A.h) * d, cz = A.z + Math.cos(A.h) * d;
  camera.position.lerp(new THREE.Vector3(cx, hgt + A.size.y * 0.5, cz), Math.min(1, dt * 5));
  camera.lookAt(A.x - Math.sin(A.h) * 3, A.size.y * 0.55, A.z - Math.cos(A.h) * 3);
}

// ---------- Schleife ----------
function groesse() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize", groesse);
let last = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  if (AKT) {
    if (modus === "drive") fahren(dt);
    else { if (modus === "spin") { AKT.h += dt * 0.5; setze(); } controls.update(); }
    sun.position.set(AKT.x + SUN_DIR.x * 100, SUN_DIR.y * 100, AKT.z + SUN_DIR.z * 100); sun.target.position.set(AKT.x, 0, AKT.z);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
groesse();
let start = 0; try { start = Math.min(MODELLE.length - 1, Math.max(0, +localStorage.getItem("werkstatt-modell") || 0)); } catch (e) {}
pick.value = start; laden(start);
requestAnimationFrame(loop);
