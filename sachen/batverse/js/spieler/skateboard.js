// Skateboard (Nicolas 2026-11-18, N34: "wie bei Schedule I: Rechtsklick so lange gedrueckt halten, bis der Kreis um die Maus voll ist, dann wechselt es automatisch in die
// Third Person und man ist auf dem Skateboard; mit W beschleunigt man und ist einiges schneller als zu Fuss"). Spiel und Werkstatt, nach gotham/tresor.js (holdRingEl, HAND3D).
// Aufsteigen: Skateboard in der Hand, rechte Maus 0,6 s halten. Fahren: W anschieben (bis 12 m/s, Shift 15), S bremsen, A/D und Maus lenken, Leertaste Ollie, rechte Maus absteigen.
// Spiel: skateMove(dt) statt der Laufbewegung (bedienung.js), nutzt updatePlayer mit eigener Geschwindigkeit (Kollision, Boden, Sprung wie zu Fuss). Werkstatt: person.js fragt SKATE.on.
// Ohne eigene Spielfigur (N35) steht eine einfache Ersatzfigur auf dem Brett.
const SKATE = { on: false, v: 0, hold: null, g: null, cam: new THREE.Vector3(), lean: 0 };
function buildSkateboard() {
  const g = new THREE.Group(), deckM = new THREE.MeshStandardMaterial({ color: 0x1a1a1d, roughness: 0.85 }), holz = new THREE.MeshStandardMaterial({ color: 0xc8a46a, roughness: 0.7 }), metall = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.85, roughness: 0.3 }),
    rad = new THREE.MeshStandardMaterial({ color: 0xf2e6c8, roughness: 0.5 }), gelb = new THREE.MeshStandardMaterial({ color: 0xf2c21b, roughness: 0.5 });
  const sh = new THREE.Shape(), L = 0.4, W = 0.1; sh.moveTo(-L + W, -W); sh.lineTo(L - W, -W); sh.absarc(L - W, 0, W, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(-L + W, W); sh.absarc(-L + W, 0, W, Math.PI / 2, Math.PI * 1.5, false);   // Brett 0,8 x 0,2 m mit runden Enden
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1, curveSegments: 12 }); geo.rotateX(-Math.PI / 2);
  { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), k = Math.max(0, Math.abs(x) - 0.27) / 0.13; p.setY(i, p.getY(i) + k * k * 0.05); } geo.computeVertexNormals(); }   // Kicktails vorne und hinten hochgebogen
  const deck = new THREE.Mesh(geo, [deckM, holz]); deck.position.y = 0.075; g.add(deck);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.035, 20), gelb); logo.rotation.x = -Math.PI / 2; logo.position.set(0, 0.0905, 0); g.add(logo);
  for (const sx of [-1, 1]) { const tr = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.15), metall); tr.position.set(sx * 0.24, 0.058, 0); g.add(tr); const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 8), metall); ax.rotation.x = Math.PI / 2; ax.position.set(sx * 0.24, 0.032, 0); g.add(ax);
    for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.032, 16), rad); w.rotation.x = Math.PI / 2; w.position.set(sx * 0.24, 0.028, sz * 0.09); g.add(w); } }   // Achsen und Rollen
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.name = "Skateboard"; return g; }   // Laengsachse x, Boden y 0
// Ersatzfigur (bis es Spielfiguren gibt): seitlich auf dem Brett, Knie leicht gebeugt, Arme zur Balance
function buildSkaterFigur() {
  const g = new THREE.Group(), stoff = new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.9 }), hose = new THREE.MeshStandardMaterial({ color: 0x2d3440, roughness: 0.9 }), haut = new THREE.MeshStandardMaterial({ color: 0xd9b08c, roughness: 0.8 }), schuh = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 });
  const cap = (m, r, l, x, y, z, rz = 0, rx = 0) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); g.add(o); return o; };
  for (const sx of [-1, 1]) { cap(hose, 0.07, 0.36, sx * 0.17, 0.33, 0, sx * -0.18); cap(hose, 0.065, 0.36, sx * 0.13, 0.72, 0, sx * 0.12); const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.24), schuh); s.position.set(sx * 0.22, 0.12, 0.02); s.rotation.y = Math.PI / 2; g.add(s); }   // Beine gegraetscht, Schuhe quer
  cap(stoff, 0.17, 0.32, 0, 1.12, 0, 0, 0.15); const kopf = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), haut); kopf.position.set(0, 1.5, -0.03); g.add(kopf);
  const haube = new THREE.Mesh(new THREE.SphereGeometry(0.118, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), stoff); haube.position.copy(kopf.position); haube.position.y += 0.01; g.add(haube);   // Kapuze
  for (const sx of [-1, 1]) cap(stoff, 0.055, 0.42, sx * 0.36, 1.18, 0, sx * 1.05);   // Arme seitlich ausgestreckt
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }   // Gesicht nach -z, Brett liegt quer (x)
function skateEnsure() { if (SKATE.g) return; const g = new THREE.Group(), b = buildSkateboard(), f = buildSkaterFigur(); f.position.y = 0.09; f.rotation.y = 0; g.add(b, f); g.userData.f = f; g.visible = false; g.userData.dynamic = true; scene.add(g); SKATE.g = g; }
function skateOn() { skateEnsure(); SKATE.on = true; SKATE.v = 0; SKATE.g.visible = true; const p = typeof player !== "undefined" ? player : null; if (p) SKATE.cam.set(p.pos.x, p.pos.y + 1.7, p.pos.z); toast("Auf dem Skateboard – W anschieben, S bremsen, Leertaste Ollie, Rechtsklick absteigen"); }
function skateOff() { SKATE.on = false; SKATE.v = 0; if (SKATE.g) SKATE.g.visible = false; if (typeof player !== "undefined") { camera.position.set(player.pos.x, player.pos.y + (typeof EYE !== "undefined" ? EYE : player.EYE || 1.62), player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0, "YXZ"); } toast("Abgestiegen"); }
// Geschwindigkeit aus den Tasten (gemeinsam fuer Spiel und Werkstatt)
function skateSpeed(dt) { const fw = keys.has("KeyW") || keys.has("ArrowUp"), bk = keys.has("KeyS") || keys.has("ArrowDown"), max = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 15 : 12;
  if (fw) SKATE.v = Math.min(max, SKATE.v + 6 * dt); else if (bk) SKATE.v = Math.max(0, SKATE.v - 10 * dt); else SKATE.v = Math.max(0, SKATE.v - 1.1 * dt);
  const turn = (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) - (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0); player.yaw += turn * 1.9 * dt; SKATE.lean += (turn * Math.min(1, SKATE.v / 6) * 0.25 - SKATE.lean) * Math.min(1, dt * 6); }
// Brett und Figur an den Spieler, Kamera hinter und ueber ihm (Third Person)
function skatePose(dt) { const g = SKATE.g, p = player.pos; g.position.set(p.x, p.y, p.z); g.rotation.set(0, player.yaw + Math.PI / 2, 0); g.userData.f.rotation.set(SKATE.lean, 0, 0);   // Brett laengs zur Fahrtrichtung, Figur seitlich darauf (Fuesse laengs, Blick zur Seite), neigt sich in die Kurve
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), want = new THREE.Vector3(p.x - fx * 3.4, p.y + 1.9 - player.pitch * 2, p.z - fz * 3.4); SKATE.cam.lerp(want, Math.min(1, dt * 8));
  camera.position.copy(SKATE.cam); camera.lookAt(p.x + fx * 1.5, p.y + 1.2, p.z + fz * 1.5); }
// Spiel: statt updatePlayer aus bedienung.js
function skateMove(dt) { skateSpeed(dt); const x0 = player.pos.x, z0 = player.pos.z; if (keys.has("Space") && player.onGround) player.jump = true;
  updatePlayer(dt, 0, SKATE.v > 0.05 ? 1 : 0, false, Math.max(0.01, SKATE.v)); const moved = Math.hypot(player.pos.x - x0, player.pos.z - z0);
  if (SKATE.v > 2 && moved < SKATE.v * dt * 0.3) SKATE.v *= 0.15;   // gegen etwas gefahren
  skatePose(dt); }
// Aufsteigen: rechte Maus mit Skateboard in der Hand 0,6 s halten (Kreis); auf dem Brett: rechte Maus steigt ab
addEventListener("mousedown", e => { if (e.button !== 2 || !document.pointerLockElement) return;
  if (SKATE.on) { e.preventDefault(); e.stopImmediatePropagation(); return skateOff(); }
  if (typeof invHeld !== "function" || invHeld() !== "skateboard" || (typeof onFoot === "function" && !onFoot())) return; e.preventDefault(); e.stopImmediatePropagation();
  const el = typeof holdRingEl === "function" ? holdRingEl() : null; if (!el) return skateOn(); el.querySelector("span").textContent = "Aufsteigen …"; el.hidden = false; SKATE.hold = { t: 0, el }; }, true);
addEventListener("mouseup", e => { if (e.button === 2 && SKATE.hold) { SKATE.hold.el.hidden = true; SKATE.hold = null; } });
function skateStep(dt) { const H = SKATE.hold; if (H) { if (typeof invHeld === "function" && invHeld() !== "skateboard") { H.el.hidden = true; SKATE.hold = null; } else { H.t += dt; H.el.querySelector(".hr-fg").style.strokeDashoffset = String(100 - Math.min(100, H.t / 0.6 * 100)); if (H.t >= 0.6) { H.el.hidden = true; SKATE.hold = null; skateOn(); } } }
  if (SKATE.on && ((typeof invHeld === "function" && invHeld() !== "skateboard") || (typeof walking !== "undefined" && !walking))) skateOff(); }   // Brett weggelegt oder Begehen beendet
// 3D in der Hand: Brett schraeg gehalten
if (typeof HAND3D !== "undefined") HAND3D.skateboard = () => { const g = new THREE.Group(), b = buildSkateboard(); b.rotation.set(0.2, 0, 1.25); b.position.set(0.05, -0.1, -0.05); b.scale.setScalar(0.85); g.add(b); return g; };
