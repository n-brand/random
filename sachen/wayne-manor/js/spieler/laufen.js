// Wayne Manor 3D – Laufmodus und Geist: Spieler, Kollision, Boden, Wasser, Begehen/Orbit
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Laufmodus =====================
const touch = matchMedia("(pointer: coarse)").matches;
document.body.classList.toggle("touch", touch);
const EYE = 1.62, BODY = 1.8, RADIUS = 0.3, STEP = 0.45, WALK = 4.6, RUN = 9, JUMP = 6.4, GRAVITY = 22, LIMIT = LIMIT_WORLD;
const START = { x: 22, z: 0, yaw: Math.PI / 2 };                        // Blick nach Westen auf das Rondell (Ostrand des Plateaus)
const player = { pos: new THREE.Vector3(START.x, 0, START.z), vy: 0, yaw: START.yaw, pitch: 0.05, onGround: true, jump: false };
const keys = new Set();
let walking = false, dragging = false, jumpHeld = false, downHeld = false;
// Geistmodus (01): fliegen ohne Kollision und Schwerkraft, 20-mal Gehtempo, Aufzug/Boot/Tore reagieren nicht
let ghost = false;
const GHOST = WALK * 20, hintEl = document.getElementById("hint"), HINT_WALK = hintEl.innerHTML;
const orbitView = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
function pushOut(p, feet) {
  for (const s of solids) {
    if (!s.on || s.y1 <= feet + STEP || s.y0 >= feet + BODY) continue;
    const cx = Math.max(s.x0, Math.min(p.x, s.x1)), cz = Math.max(s.z0, Math.min(p.z, s.z1));
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= RADIUS * RADIUS) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + dx / d * RADIUS; p.z = cz + dz / d * RADIUS; }
    else {
      const out = [[p.x - s.x0, -1, 0], [s.x1 - p.x, 1, 0], [p.z - s.z0, 0, -1], [s.z1 - p.z, 0, 1]].sort((a, b) => a[0] - b[0])[0];
      p.x += out[1] * (out[0] + RADIUS); p.z += out[2] * (out[0] + RADIUS);
    }
  }
  for (const [cx, cz, r, top] of circles) {
    if (top !== undefined && (feet >= top || feet < top - 8)) continue;   // Hindernis mit Hoehe gilt nur auf seiner Ebene
    const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz), min = r + RADIUS;
    if (d < min && d > 1e-6 && !(top === undefined && feet < terrainH(cx, cz) - 3)) { p.x = cx + dx / d * min; p.z = cz + dz / d * min; }   // D1: Kreise ohne Hoehe (Baumstaemme) nur am Gelaende, nicht in Tunneln darunter
  }
  const far = Math.hypot(p.x, p.z);
  if (far > LIMIT) { p.x *= LIMIT / far; p.z *= LIMIT / far; }
}
// Boden ohne Quader: unter der Erde in der Garage (Boden dort aus Quadern), sonst Gelaende
function groundAt(x, z, feet = 0) {
  const sn = serpNear(x, z, SERP_W / 2);
  if (sn && feet > sn.y - 2) return sn.y + 0.07;                         // Serpentine (A5)
  for (const R of ROADS2) { const rn = roadNear(R, x, z, R.w / 2); if (rn && feet > rn.y - 2) return rn.y + 0.12; }   // Hauptstrasse, Zufahrt (E4)
  if (feet < HILL - 1 && (inRect(HF_TUN, x, z) || inRect(CSH_OUT, x, z))) return BED - 20;   // A3: Tunnel und Autoaufzug-Schacht
  if (feet < 3 && inRect(WF_PORTAL, x, z)) { const w = wfNear(x, z, WF_HW + 1); if (w) return w.y + 0.07; }   // Portalöffnung: Gelaende ist dort ausgeschnitten, es gilt die Fahrbahn
  if (feet < terrainH(x, z) - 1.5) { const w = wfInTunnel(x, z); if (w) return w.y + 0.07; }
  { const w = wfNear(x, z, 3); if (w && w.s > WFT.sG1 && feet > w.y - 2) return w.y + 0.14; }   // Kiesstrasse am Westufer (Sackgasse)   // A8: Waterfall-Exit-Tunnel: glatt nach dem Strassenverlauf (15 %, Quader waeren Stufen)
  if (feet < -20 && waterCaveAt(x, z)) return BED;                          // E2: Grund in den Wasserhoehlen
  if (inPoly(HOUSE, x, z)) return BED - 20;                              // im Haus traegt nur der Boden (Quader), darunter Garage/Schacht
  const ca = caveAt(x, z);
  if ((feet < HILL - 1 && inPoly(GARAGE, x, z)) || (feet < -1 && (ca === 1 || ca === 2 || ca === 4 || caveUpAt(x, z)))) return BED - 20;   // unter der Erde: Boden nur aus Quadern
  if (feet > HILL - 3) {                                                 // Becken: Brunnen (Rand begehbar) und Pool (auf dem Plateau)
    const fd = Math.hypot(x - FOUNT.x, z - FOUNT.z);
    if (fd < FOUNT.r - 0.4) return FOUNT.floor + HILL;
    if (fd < FOUNT.r) return FOUNT.rim + HILL;
    if (inPool(x, z)) return POOL.floor + HILL;
  }
  return terrainH(x, z);
}
function supportAt(p, feet) {
  let top = groundAt(p.x, p.z, feet);
  for (const s of solids) {
    if (!s.on || s.y1 > feet + STEP || s.y1 <= top) continue;
    if (p.x > s.x0 - 0.05 && p.x < s.x1 + 0.05 && p.z > s.z0 - 0.05 && p.z < s.z1 + 0.05) top = s.y1;
  }
  return top;
}
// Wasseroberflaeche an (x, z) oder null: Pool, Brunnen, Hoehle/Meer (gleiche Hoehe), Seen
function waterAt(x, z) {
  { const w = wfNear(x, z, 3.3); if (w && !WFT.inGap(w.s)) return null; }   // A8: Tunnel und Strasse trocken, ueber dem Teich Wasser
  if (inPool(x, z)) return POOL.water + HILL;
  if (Math.hypot(x - FOUNT.x, z - FOUNT.z) < FOUNT.r - 0.4) return FOUNT.water + HILL;
  const c = caveAt(x, z);
  if (c === 2 || c === 4 || c === 3) return SEA_Y;
  if (waterCaveAt(x, z)) return SEA_Y;                                    // E2: Wasserhoehlen
  if (c !== 1 && seaD(x, z) > -0.5) return SEA_Y;
  for (const L of LAKES) if (lakeD(L, x, z) < 1) return WATER_Y;
  return null;
}
// Klippenkante: Schritt nach (nx, nz) verboten, wenn er naeher als m Meter an die Kuestenlinie fuehrt und nicht landeinwaerts geht
const coastEdge = (nx, nz, x0, z0, m) => { const s1 = seaD(nx, nz); return s1 > -m && s1 > seaD(x0, z0) - 0.01; };
function updatePlayer(dt, moveX, moveZ, run) {
  const len = Math.hypot(moveX, moveZ);
  if (len > 1) { moveX /= len; moveZ /= len; }
  const surf = waterAt(player.pos.x, player.pos.z), swim = surf !== null && player.pos.y < surf - 0.3;
  const speed = swim ? 2.8 : run ? RUN : WALK, sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
  const next = player.pos.clone();
  next.x += (-sin * moveZ + cos * moveX) * speed * dt;
  next.z += (-cos * moveZ - sin * moveX) * speed * dt;
  pushOut(next, player.pos.y);
  // Steilkueste: oben an der Kante nicht hinunterfallen (Seen im Inland darf man betreten)
  if (player.pos.y > -3 && seaD(next.x, next.z) > -40 && terrainH(next.x, next.z) < WATER_Y - 0.5 && supportAt(next, player.pos.y) < WATER_Y - 0.5) { next.x = player.pos.x; next.z = player.pos.z; }
  // Klippenkante weiter innen (Nicolas): das Gelaende faellt 4-5 m vor der Kuestenlinie ab, davor steht die Felswand; 5 m Abstand, landeinwaerts geht immer
  if (player.pos.y > -3 && !swim && coastEdge(next.x, next.z, player.pos.x, player.pos.z, 5)) { next.x = player.pos.x; next.z = player.pos.z; }
  // Steile Haenge sperren: nur das Gelaende zaehlt (Stufen wie der Brunnenrand regelt supportAt)
  const slopeG = (x, z) => (player.pos.y < HILL - 3 && (inRect(HF_TUN, x, z) || inRect(CSH_OUT, x, z))) || (player.pos.y < terrainH(x, z) - 1.5 && wfInTunnel(x, z)) || (player.pos.y < 3 && inRect(WF_PORTAL, x, z)) || (player.pos.y < -20 && waterCaveAt(x, z)) ? -100 : terrainH(x, z);   // im Tunnel zaehlt der Hang darueber nicht
  const g0 = slopeG(player.pos.x, player.pos.z), g1 = slopeG(next.x, next.z), moved = Math.hypot(next.x - player.pos.x, next.z - player.pos.z);
  if (moved > 1e-6 && g1 - g0 > 1.1 * moved && player.pos.y < g0 + 0.15) { next.x = player.pos.x; next.z = player.pos.z; }
  player.pos.x = next.x; player.pos.z = next.z;
  const wasGround = player.onGround && !swim;
  if (swim) {
    // Schwimmen wie im Pool der Villa: langsam sinken, Leertaste halten = auftauchen, an der Oberflaeche hinausspringen
    const up = player.jump || jumpHeld || keys.has("Space");
    if (up && player.pos.y > surf - 0.8) player.vy = Math.max(player.vy, 5.6);
    else { player.vy -= 5 * dt; if (up) player.vy = 2.4; player.vy = Math.max(player.vy, -2); }
  } else {
    if (player.jump && player.onGround) { player.vy = JUMP; player.onGround = false; }
    player.vy -= GRAVITY * dt;
  }
  // B1 (Uebergang bis Treppen/Steg in B4): an der Uferkante in der Hoehle mit gehaltener Leertaste hochklettern
  if ((keys.has("Space") || jumpHeld) && player.pos.y < LY - 0.05 && player.pos.y > SEA_Y - 1.5) {
    let edge = false;
    for (let k = 0; k < 8 && !edge; k++) { const a = k / 8 * Math.PI * 2; edge = caveAt(player.pos.x + Math.cos(a) * 1.1, player.pos.z + Math.sin(a) * 1.1) === 1; }
    if (edge) player.vy = Math.max(player.vy, 3.2);
  }
  player.jump = false;
  player.pos.y += player.vy * dt;
  const support = supportAt(player.pos, player.pos.y);
  if (player.pos.y <= support || (wasGround && player.vy <= 0 && player.pos.y - support < 0.35)) { player.pos.y = support; player.vy = 0; player.onGround = true; } else player.onGround = false;
  for (const s of solids) {
    if (!s.on || s.y0 <= player.pos.y + STEP || s.y0 >= player.pos.y + BODY) continue;
    const cx = Math.max(s.x0, Math.min(player.pos.x, s.x1)), cz = Math.max(s.z0, Math.min(player.pos.z, s.z1));
    if ((player.pos.x - cx) ** 2 + (player.pos.z - cz) ** 2 >= (RADIUS * 0.7) ** 2) continue;
    player.pos.y = s.y0 - BODY; player.vy = Math.min(player.vy, 0);
  }
  camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0, "YXZ");
}
const look = (dx, dy) => { player.yaw -= dx; player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch - dy)); };
function stopDrag() {
  dragging = false;
  document.body.classList.remove("looking");
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
}
function startWalk(x = START.x, z = START.z, yaw = START.yaw) {
  if (!walking) { orbitView.pos.copy(camera.position); orbitView.target.copy(controls.target); }
  walking = true; ghost = false;
  document.body.classList.add("walk"); document.body.classList.remove("ghost"); hintEl.innerHTML = HINT_WALK;
  controls.enabled = false;
  if (world.userData.boat) world.userData.boat.on = false;
  if (world.userData.car) world.userData.car.leave();
  player.pos.set(x, terrainH(x, z), z); player.pos.y = supportAt(player.pos, player.pos.y + 1); player.yaw = yaw; player.pitch = 0.05; player.vy = 0;
  camera.fov = 70; camera.near = 0.15; camera.updateProjectionMatrix();
  updatePlayer(0.001, 0, 0, false);
}
function setWalk(on) {
  if (on) return startWalk();
  const wasGhost = ghost;
  if (world.userData.car) world.userData.car.leave();
  walking = false; ghost = false;
  document.body.classList.remove("walk", "ghost"); hintEl.innerHTML = HINT_WALK;
  controls.enabled = true;
  stopDrag(); keys.clear(); downHeld = jumpHeld = false;
  camera.fov = 45; camera.near = 0.6; camera.updateProjectionMatrix();
  if (wasGhost) {
    // Orbit-Kamera bleibt, wo der Geist war, und schaut in dieselbe Richtung (Ziel 25 m voraus)
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    controls.target.copy(camera.position).addScaledVector(dir, 25); camera.lookAt(controls.target);
    // unter dem Gelaende (Hoehle, Garage): Ansicht "Von unten" einschalten, sonst schiebt die Orbit-Ansicht die Kamera nach oben
    if (!belowView && camera.position.y < terrainH(camera.position.x, camera.position.z) + 3) {
      belowView = true; $("btn-below").setAttribute("aria-pressed", "true");
      belowSave.pos.copy(orbitView.pos); belowSave.target.copy(orbitView.target);
      controls.maxPolarAngle = Math.PI;
    }
    controls.update();
    return;
  }
  camera.position.copy(orbitView.pos); controls.target.copy(orbitView.target); camera.lookAt(orbitView.target);
}
function startGhost() {
  orbitView.pos.copy(camera.position); orbitView.target.copy(controls.target);
  const dir = controls.target.clone().sub(camera.position).normalize();
  if (BOAT.on) BOAT.on = false;
  if (world.userData.car) world.userData.car.leave();
  walking = true; ghost = true;
  document.body.classList.add("walk", "ghost");
  hintEl.innerHTML = "Geist &middot; WASD fliegen (waagrecht) &middot; Leertaste hoch &middot; C (oder Strg) runter &middot; Shift schneller &middot; Linksklick Maus übernehmen &middot; Esc zurück";
  controls.enabled = false;
  player.pos.set(camera.position.x, camera.position.y - EYE, camera.position.z);
  player.yaw = Math.atan2(-dir.x, -dir.z); player.pitch = Math.max(-1.5, Math.min(1.5, Math.asin(Math.max(-1, Math.min(1, dir.y)))));
  player.vy = 0; keys.clear();
  camera.fov = 70; camera.near = 0.15; camera.updateProjectionMatrix();
  camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0, "YXZ");
  toast("Geist: durch alles fliegen, Esc führt zurück");
}
function ghostStep(dt) {
  let mx = 0, mz = 0, my = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) mz += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) mz -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
  if (keys.has("Space") || jumpHeld) my += 1;
  if (keys.has("ControlLeft") || keys.has("ControlRight") || keys.has("KeyC") || downHeld) my -= 1;   // Strg oder C runter (C: Strg+W schliesst sonst den Tab)
  mx += moveStick.x; mz -= moveStick.y;
  look(lookStick.x * 2.6 * dt, lookStick.y * 1.8 * dt);
  const len = Math.hypot(mx, mz);
  if (len > 1) { mx /= len; mz /= len; }
  const fast = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 3 : 1;   // Shift: dreimal so schnell
  const sy = Math.sin(player.yaw), cy = Math.cos(player.yaw), v = GHOST * fast * dt;
  const p = player.pos;
  p.x += (-sy * mz + cy * mx) * v;                                          // nur waagrecht (Blick nach oben/unten aendert die Hoehe nicht)
  p.z += (-cy * mz - sy * mx) * v;
  p.y += my * v;
  const far = Math.hypot(p.x, p.z);
  if (far > LIMIT) { p.x *= LIMIT / far; p.z *= LIMIT / far; }
  p.y = Math.max(-200, Math.min(800, p.y));
  camera.position.set(p.x, p.y + EYE, p.z);
  camera.rotation.set(player.pitch, player.yaw, 0, "YXZ");
}
$("btn-walk-low").addEventListener("click", () => startWalk());
$("btn-ghost").addEventListener("click", e => { e.currentTarget.blur(); startGhost(); });
$("btn-walk-top").addEventListener("click", () => showMap((mapIdx + 1) % (MAPS.length + 1)));
showMap(MAPS.length);                                                     // Start ohne Karte (Wunsch von Nicolas)
$("btn-exit").addEventListener("click", () => setWalk(false));
// (Knopf "Aktion (E)" und "Menü (T)": siehe ui/bedienung.js)
