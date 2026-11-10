// Wayne Manor 3D – Tore: zielen, Rechtsklick/E, Bewegung, Kollision
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Tore in der Hoehle: zielen (Fadenkreuz bzw. Bildmitte) und nah genug (60 m, die Kanaele sind nur vom Ufer aus zu sehen) -> Hinweis, Rechtsklick oder Tipp darauf schaltet
const gateRay = new THREE.Raycaster(), gateCenter = new THREE.Vector2(0, 0);
let aimedGate = null, gateHintClock = 0;
// Regel (Nicolas 2026-11-10, gilt auch fuer kuenftige Tueren, Tore, Rampen): angezielt ist ein Tor, wenn man auf das Tor selbst ODER auf seine
// Flaeche im geschlossenen Zustand schaut (Box beim ersten Aufruf, alle starten zu) - offen also auch auf die Oeffnung, das "Loch".
// Hinweis und Funktion erst in der Naehe: Abstand des Spielers zur Box hoechstens t.near (Vorgabe 8 m, ueber Wasser/Kanaele mehr).
const gateV = new THREE.Vector3(), gateNear = t => t.near ?? (/^Felstor \(Lake|^Felswand \(SE|^Felswand \(NE/.test(t.name) ? 30 : 8);
function gateBox(t) { if (!t.box) { t.g.updateMatrixWorld(true); t.box = new THREE.Box3().setFromObject(t.g).expandByScalar(0.25); } return t.box; }
function findAimedGate() {
  if (!walking) return null;                                                 // auch im Geistmodus (Nicolas 2026-11-08: Tueren und Hebebuehne bedienen)
  gateRay.setFromCamera(gateCenter, camera); gateRay.far = 60;
  const hit = gateRay.intersectObjects(gates.map(t => t.g), true)[0], p = player.pos; let best = null, bd = 1e9;
  for (const t of gates) {
    const b = gateBox(t); if (b.isEmpty() || b.distanceToPoint(p) > gateNear(t)) continue;
    let d = 1e9; if (hit) for (let o = hit.object; o; o = o.parent) if (o === t.g) { d = hit.distance; break; }
    const q = gateRay.ray.intersectBox(b, gateV); if (q) d = Math.min(d, q.distanceTo(gateRay.ray.origin));
    if (d < bd && d <= 60) { bd = d; best = t; }
  }
  return best;
}
// Aufzuege per Rechtsklick (Nicolas 2026-11-08, statt Taste E): Tueren des Personenaufzugs als Ziel; der Autoaufzug traegt sich in autoaufzug.js ein.
// Solche Eintraege haben call statt open/target und werden in updateGates uebersprungen.
gates.push({ name: "Aufzug", g: doorG, call: () => useLift(), verbs: ["holen / fahren", "holen / fahren"], a: [SHAFT.cx, SHAFT.cz], b: [SHAFT.cx, SHAFT.cz] });
// Fahrzeuge (Nicolas 2026-11-10): Rechtsklick aufs Fahrzeug = einsteigen, Shift = aussteigen, E nicht mehr fuer Fahrzeuge
function findAimedVehicle() {
  if (!walking || ghost || (CAR && CAR.on) || BOAT.on || FLY.on) return null;
  gateRay.setFromCamera(gateCenter, camera); gateRay.far = 14;
  const list = [...VEH.map(v => [v.g, v]), [BOAT.g, BOAT], [FLY.g, FLY]], hit = gateRay.intersectObjects(list.map(l => l[0]), true)[0];
  if (!hit) return null; const e = list.find(([g]) => { for (let o = hit.object; o; o = o.parent) if (o === g) return true; return false; }); return e ? e[1] : null;
}
function enterVehicle(v) { const ok = v === BOAT ? useBoat() : v === FLY ? useFly() : useCar(v); if (!ok) toast("Näher hingehen zum Einsteigen"); }
const vehName = v => v === BOAT ? "Boot" : v === FLY ? "The Bat" : v.label.replace(/ \(.*\)$/, "");
let aimedVeh = null;
function toggleGate(t) {
  if (!t) return;
  if (t.call) return t.call();
  t.target = t.target ? 0 : 1; t.wantClose = false;
  if (t.target && t.also) for (const o of t.also) o.target = 1;           // gekoppelt oeffnen (Garagenrampe: Klappe und Rolltor), schliessen einzeln
  toast(t.name + (t.msgs ? t.msgs[t.target ? 0 : 1] : t.target ? " öffnet sich" : " schließt sich"));
}
// Rechtsklick ueber mousedown (wie die Villa): bei gefangener Maus schickt der Browser kein contextmenu
renderer.domElement.addEventListener("contextmenu", e => { if (walking) e.preventDefault(); });
renderer.domElement.addEventListener("mousedown", e => { if (!walking || e.button !== 2) return; e.preventDefault(); const g = findAimedGate();
  if (g) return toggleGate(g);
  if (!ghost) { const v = findAimedVehicle(); if (v) enterVehicle(v); return; }
  // Geist ohne Tor im Ziel (Nicolas 2026-11-10): Menue wie in der Orbit-Ansicht (Koordinaten kopieren, hierhin teleportieren); bei gefangener Maus am Fadenkreuz
  const locked = !!document.pointerLockElement; if (dragging) stopDrag();
  const r = renderer.domElement.getBoundingClientRect(); orbitPick.pickAt(locked ? r.left + r.width / 2 : e.clientX, locked ? r.top + r.height / 2 : e.clientY); });
$("door-hint").addEventListener("click", () => aimedGate ? toggleGate(aimedGate) : aimedVeh && enterVehicle(aimedVeh));
function updateGates(dt) {
  for (const t of gates) {
    if (t.call) continue;
    // Zurueckfahren (t.retry, Nicolas 2026-11-10): blockiert beim Schliessen -> wieder auf; 1 s frei -> schliesst von selbst, wieder blockiert -> wieder auf
    if (t.retry && t.target < t.open && t.block && t.block()) { t.target = 1; t.wantClose = true; t.clear = 0; }
    if (t.retry && t.wantClose && t.target) { t.clear = t.block() ? 0 : t.clear + dt; if (t.clear >= 1) { t.target = 0; t.wantClose = false; } }
    if (t.open !== t.target && t.target < t.open && t.block && t.block()) { if (!t.blocked) toast(t.blockMsg); t.blocked = true; continue; }   // C1: Sicherheitsstopp
    t.blocked = false;
    if (t.open !== t.target) { t.open = t.target > t.open ? Math.min(1, t.open + dt / (t.dur || 4)) : Math.max(0, t.open - dt / (t.dur || 4)); if (t.anim) t.anim(sst(0, 1, t.open)); else t.g.position.y = (t.y0 ?? BED) + sst(0, 1, t.open) * t.lift;
      // Durchgang, sobald es passt (Nicolas): Hubtore sperren nur unter ihrer Unterkante, Drehfluegel ab etwa halb offen nicht mehr
      if (t.solid) { if (t.anim) t.solid.on = t.open < 0.5; else { t.solidY0 ??= t.solid.y0; t.solid.y0 = t.solidY0 + sst(0, 1, t.open) * t.lift; t.solid.on = t.open < 0.999; } } }
  }
  gateHintClock += dt;
  if (gateHintClock < 0.15) return;
  gateHintClock = 0;
  aimedGate = findAimedGate(); aimedVeh = aimedGate ? null : findAimedVehicle();
  const hint = $("door-hint"), txt = aimedGate ? (touch ? "Tippen: " : aimedGate.call ? "Rechtsklick: " : "Rechtsklick/E: ") + aimedGate.name + " " + (aimedGate.verbs || ["öffnen", "schließen"])[aimedGate.target ? 1 : 0] : "";
  const vtxt = !aimedGate && aimedVeh ? (touch ? "Tippen: " : "Rechtsklick: ") + "einsteigen (" + vehName(aimedVeh) + ")" : "", show = !!(aimedGate || aimedVeh);
  if (hint.hidden !== !show) hint.hidden = !show;
  if (show && hint.textContent !== (txt || vtxt)) hint.textContent = txt || vtxt;
}
