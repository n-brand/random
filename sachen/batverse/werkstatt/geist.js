// Werkstatt – Geist-Modus (Nicolas 2026-11-17: "in der Werkstatt will ich auch in den Ghostmode gehen koennen"). Wie im Spiel (ui/bedienung.js ghostStep):
// Knopf "5 Geist" / Taste 5, Start an der aktuellen Kamera mit gleicher Blickrichtung. Linksklick faengt die Maus, WASD nur waagrecht, Leertaste hoch,
// C oder Strg runter, Shift dreimal so schnell, keine Kollision. Esc bei freier Maus: zurueck zum Ansehen (Ziel 25 m voraus). Nach werkstatt.js laden.
"use strict";
const GEIST = { yaw: 0, pitch: 0, v: 25 };
function geistStart() { const d = camera.getWorldDirection(new THREE.Vector3()); GEIST.yaw = Math.atan2(-d.x, -d.z); GEIST.pitch = Math.asin(Math.max(-1, Math.min(1, d.y))); ghost = true;
  toast("Geist: Linksklick fängt die Maus, WASD fliegen, Leertaste hoch, C runter, Shift schneller, Esc zurück"); }
function geistEnd() { ghost = false; const d = camera.getWorldDirection(new THREE.Vector3()); controls.target.copy(camera.position).addScaledVector(d, 25); controls.update(); }
function geistStep(dt) {
  let mx = 0, mz = 0, my = 0; if (keys.has("KeyW") || keys.has("ArrowUp")) mz += 1; if (keys.has("KeyS") || keys.has("ArrowDown")) mz -= 1; if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1; if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
  if (keys.has("Space")) my += 1; if (keys.has("KeyC") || keys.has("ControlLeft") || keys.has("ControlRight")) my -= 1;
  const sp = GEIST.v * (keys.has("ShiftLeft") || keys.has("ShiftRight") ? 3 : 1), l = Math.hypot(mx, mz) || 1, s = Math.sin(GEIST.yaw), c = Math.cos(GEIST.yaw);
  camera.position.x += (-s * mz + c * mx) / l * sp * dt; camera.position.z += (-c * mz - s * mx) / l * sp * dt; camera.position.y = Math.max(0.3, camera.position.y + my * sp * dt);
  camera.rotation.set(GEIST.pitch, GEIST.yaw, 0, "YXZ"); sunFollow(camera.position, 100); }
// Tasten im Geist-Modus (aus dem keydown der Werkstatt; true = erledigt). Ziffern laufen weiter (Moduswechsel).
function geistKey(e) {
  if (e.code === "Escape" && !document.pointerLockElement) { setModus("orbit"); return true; }
  if (["KeyE", "KeyF", "Space", "KeyC", "ControlLeft", "ControlRight"].includes(e.code)) { e.preventDefault(); return true; }   // nicht einsteigen, Strg+Taste nicht an den Browser
  return false;
}
renderer.domElement.addEventListener("mousedown", e => { if (modus !== "geist" || e.button !== 0) return; if (document.pointerLockElement) document.exitPointerLock(); else renderer.domElement.requestPointerLock?.(); });
addEventListener("mousemove", e => { if (modus !== "geist" || document.pointerLockElement !== renderer.domElement) return; const k = 0.0025; GEIST.yaw -= e.movementX * k; GEIST.pitch = Math.max(-1.55, Math.min(1.55, GEIST.pitch - e.movementY * k)); });
