"use strict";
// Hover-Schild fuer Gebaeude-IDs (Nicolas 2026-11-14): Orbit-Ansicht an der Maus, Geist unter dem Fadenkreuz (Bildmitte).
// Kein Szenen-Strahl (zu teuer ueber die grossen zusammengefassten Netze): der Strahl wird in Schritten abgelaufen,
// bis er einen Grundriss im Register (bautAt) oder das Gelaende trifft. Hoechstens alle 125 ms und nur nach Bewegung.
const BHOV = { el: document.getElementById("baut-tip"), mx: -1, my: -1, moved: false, down: false, t: 0, cam: new THREE.Vector3(1e9, 0, 0), q: new THREE.Quaternion(), last: null };
{
  const cv = renderer.domElement, coarse = matchMedia("(pointer: coarse)").matches;
  if (coarse) BHOV.off = true;
  cv.addEventListener("pointermove", e => { BHOV.mx = e.clientX; BHOV.my = e.clientY; BHOV.moved = true; if (!e.buttons) BHOV.down = false; });
  cv.addEventListener("pointerdown", () => { BHOV.down = true; bautHoverShow(null); });
  addEventListener("pointerup", () => { BHOV.down = false; BHOV.moved = true; });
  cv.addEventListener("pointerleave", () => { BHOV.mx = -1; bautHoverShow(null); });
  addEventListener("wheel", () => { BHOV.moved = true; }, { passive: true });
}
function bautHoverShow(e, x, y) {
  const el = BHOV.el; if (!el) return;
  if (!e) { if (!el.hidden) el.hidden = true; BHOV.last = null; return; }
  if (BHOV.last !== e) { el.textContent = bautText(e); BHOV.last = e; }
  el.hidden = false;
  if (x == null) { el.classList.add("mid"); el.style.left = el.style.top = ""; }
  else { el.classList.remove("mid"); el.style.left = Math.min(innerWidth - el.offsetWidth - 6, x + 14) + "px"; el.style.top = Math.min(innerHeight - el.offsetHeight - 6, y + 14) + "px"; }
}
const _bhR = new THREE.Raycaster(), _bhN = new THREE.Vector2();
// Strahl ablaufen: Schritt waechst mit dem Abstand (0,5 m nah, bis 6 m weit), bis 2500 m
function bautRay(o, d) {
  const under = o.y < terrainH(o.x, o.z) - 1;                         // unter dem Gelaende (Geist in Hoehle/Garage, "Von unten"): Gelaende nicht pruefen
  for (let s = 0.5; s < (under ? 300 : 2500);) {
    const x = o.x + d.x * s, y = o.y + d.y * s, z = o.z + d.z * s;
    const e = bautAt(x, y, z); if (e) return e;
    if (!under && y < terrainH(x, z) - 0.2) return null;
    s += Math.min(6, Math.max(0.5, s * 0.006));
  }
  return null;
}
function bautHoverStep() {
  if (BHOV.off || !BHOV.el) return;
  const orbit = !walking, geist = ghost;
  if (!(orbit || geist) || BHOV.down || document.body.classList.contains("paused") || (orbit && BHOV.mx < 0)) return bautHoverShow(null);
  const now = performance.now(); if (now - BHOV.t < 125) return;
  const camMoved = BHOV.cam.distanceToSquared(camera.position) > 0.01 || BHOV.q.angleTo(camera.quaternion) > 0.002;
  if (!BHOV.moved && !camMoved) return;
  BHOV.t = now; BHOV.moved = false; BHOV.cam.copy(camera.position); BHOV.q.copy(camera.quaternion);
  if (orbit) { const r = renderer.domElement.getBoundingClientRect(); _bhN.set((BHOV.mx - r.left) / r.width * 2 - 1, -(BHOV.my - r.top) / r.height * 2 + 1); }
  else _bhN.set(0, 0);
  camera.updateMatrixWorld(); _bhR.setFromCamera(_bhN, camera);
  const e = bautRay(_bhR.ray.origin, _bhR.ray.direction);
  orbit ? bautHoverShow(e, BHOV.mx, BHOV.my) : bautHoverShow(e);
}
