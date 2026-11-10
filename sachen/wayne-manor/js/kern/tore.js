// Wayne Manor 3D – Tore: zielen, Rechtsklick/E, Bewegung, Kollision
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Tore in der Hoehle: zielen (Fadenkreuz bzw. Bildmitte) und nah genug (60 m, die Kanaele sind nur vom Ufer aus zu sehen) -> Hinweis, Rechtsklick oder Tipp darauf schaltet
const gateRay = new THREE.Raycaster(), gateCenter = new THREE.Vector2(0, 0);
let aimedGate = null, gateHintClock = 0;
function findAimedGate() {
  if (!walking) return null;                                                 // auch im Geistmodus (Nicolas 2026-11-08: Tueren und Hebebuehne bedienen)
  gateRay.setFromCamera(gateCenter, camera); gateRay.far = 60;
  const hit = gateRay.intersectObjects(gates.map(t => t.g), true)[0];
  return hit ? gates.find(t => { for (let o = hit.object; o; o = o.parent) if (o === t.g) return true; return false; }) : null;
}
// Aufzuege per Rechtsklick (Nicolas 2026-11-08, statt Taste E): Tueren des Personenaufzugs als Ziel; der Autoaufzug traegt sich in autoaufzug.js ein.
// Solche Eintraege haben call statt open/target und werden in updateGates uebersprungen.
gates.push({ name: "Aufzug", g: doorG, call: () => useLift(), verbs: ["holen / fahren", "holen / fahren"], a: [SHAFT.cx, SHAFT.cz], b: [SHAFT.cx, SHAFT.cz] });
function toggleGate(t) {
  if (!t) return;
  if (t.call) return t.call();
  t.target = t.target ? 0 : 1;
  if (t.target && t.also) for (const o of t.also) o.target = 1;           // gekoppelt oeffnen (Garagenrampe: Klappe und Rolltor), schliessen einzeln
  toast(t.name + (t.msgs ? t.msgs[t.target ? 0 : 1] : t.target ? " öffnet sich" : " schließt sich"));
}
// Rechtsklick ueber mousedown (wie die Villa): bei gefangener Maus schickt der Browser kein contextmenu
renderer.domElement.addEventListener("contextmenu", e => { if (walking) e.preventDefault(); });
renderer.domElement.addEventListener("mousedown", e => { if (!walking || e.button !== 2) return; e.preventDefault(); const g = findAimedGate();
  if (g || !ghost) return toggleGate(g);
  // Geist ohne Tor im Ziel (Nicolas 2026-11-10): Menue wie in der Orbit-Ansicht (Koordinaten kopieren, hierhin teleportieren); bei gefangener Maus am Fadenkreuz
  const locked = !!document.pointerLockElement; if (dragging) stopDrag();
  const r = renderer.domElement.getBoundingClientRect(); orbitPick.pickAt(locked ? r.left + r.width / 2 : e.clientX, locked ? r.top + r.height / 2 : e.clientY); });
$("door-hint").addEventListener("click", () => toggleGate(aimedGate));
function updateGates(dt) {
  for (const t of gates) {
    if (t.call) continue;
    if (t.open !== t.target && t.target < t.open && t.block && t.block()) { if (!t.blocked) toast(t.blockMsg); t.blocked = true; continue; }   // C1: Sicherheitsstopp
    t.blocked = false;
    if (t.open !== t.target) { t.open = t.target > t.open ? Math.min(1, t.open + dt / (t.dur || 4)) : Math.max(0, t.open - dt / (t.dur || 4)); if (t.anim) t.anim(sst(0, 1, t.open)); else t.g.position.y = (t.y0 ?? BED) + sst(0, 1, t.open) * t.lift;
      // Durchgang, sobald es passt (Nicolas): Hubtore sperren nur unter ihrer Unterkante, Drehfluegel ab etwa halb offen nicht mehr
      if (t.solid) { if (t.anim) t.solid.on = t.open < 0.5; else { t.solidY0 ??= t.solid.y0; t.solid.y0 = t.solidY0 + sst(0, 1, t.open) * t.lift; t.solid.on = t.open < 0.999; } } }
  }
  gateHintClock += dt;
  if (gateHintClock < 0.15) return;
  gateHintClock = 0;
  aimedGate = findAimedGate();
  const hint = $("door-hint"), txt = aimedGate ? (touch ? "Tippen: " : aimedGate.call ? "Rechtsklick: " : "Rechtsklick/E: ") + aimedGate.name + " " + (aimedGate.verbs || ["öffnen", "schließen"])[aimedGate.target ? 1 : 0] : "";
  if (hint.hidden !== !aimedGate) hint.hidden = !aimedGate;
  if (aimedGate && hint.textContent !== txt) hint.textContent = txt;
}
