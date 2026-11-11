// Wayne Manor 3D – Bedienung: Von unten, Zeichnen, Tastatur, Maus, Joysticks, Knoepfe
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Ansicht von unten: Kamera darf unter das Gelaende (Gelaende ist von unten durchsichtig), Blick auf Garage und Hoehle
let belowView = false;
const belowSave = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
$("btn-below").addEventListener("click", e => {
  if (walking) setWalk(false);
  belowView = !belowView;
  e.currentTarget.setAttribute("aria-pressed", String(belowView));
  if (belowView) {
    belowSave.pos.copy(camera.position); belowSave.target.copy(controls.target);
    controls.maxPolarAngle = Math.PI;
    controls.target.set(-30, -18, 18); camera.position.set(40, -75, 70);
  } else {
    controls.maxPolarAngle = Math.PI * 0.495;
    camera.position.copy(belowSave.pos); controls.target.copy(belowSave.target);
  }
  controls.update();
});
// Zeichnen: 1. Klick aktiviert (pink), 2. Klick loescht die Zeichnung und beendet. Ansicht steht still, solange gezeichnet wird.
{
  const cv = $("draw-layer"), cx = cv.getContext("2d"), btn = $("btn-draw");
  let on = false, last = null, pen = "#ff2fa8";
  const COLORS = [["Pink", "#ff2fa8"], ["Gelb", "#ffe600"], ["Grün", "#39ff14"], ["Cyan", "#00e5ff"], ["Orange", "#ff6a00"]];
  const box = $("draw-colors");
  for (const [name, c] of COLORS) {
    const b = document.createElement("button");
    b.type = "button"; b.title = name; b.setAttribute("aria-label", name); b.style.setProperty("--c", c);
    b.setAttribute("aria-pressed", String(c === pen));
    b.addEventListener("click", () => {
      pen = c; btn.style.setProperty("--pen", c);
      for (const o of box.children) o.setAttribute("aria-pressed", String(o === b));
    });
    box.appendChild(b);
  }
  const fit = () => {
    const r = devicePixelRatio || 1, w = Math.round(innerWidth * r), h = Math.round(innerHeight * r);
    if (cv.width === w && cv.height === h) return;
    const old = cv.width && cv.height ? cx.getImageData(0, 0, cv.width, cv.height) : null;
    cv.width = w; cv.height = h; if (old) cx.putImageData(old, 0, 0);
  };
  const pt = e => { const r = devicePixelRatio || 1; return [e.clientX * r, e.clientY * r]; };
  const set = v => {
    on = v; last = null; document.body.classList.toggle("drawing", on);
    btn.setAttribute("aria-pressed", String(on)); btn.textContent = on ? "Zeichnung löschen" : "Zeichnen";
    if (!on) cx.clearRect(0, 0, cv.width, cv.height);
  };
  btn.addEventListener("click", () => { if (walking) setWalk(false); fit(); set(!on); });
  addEventListener("resize", fit);
  cv.addEventListener("pointerdown", e => {
    if (!on || e.button !== 0) return;
    cv.setPointerCapture(e.pointerId); last = pt(e);
    const r = devicePixelRatio || 1; cx.fillStyle = pen; cx.beginPath(); cx.arc(last[0], last[1], 2.5 * r, 0, Math.PI * 2); cx.fill();
  });
  cv.addEventListener("pointermove", e => {
    if (!last) return;
    const p = pt(e), r = devicePixelRatio || 1;
    cx.strokeStyle = pen; cx.lineWidth = 5 * r; cx.lineCap = cx.lineJoin = "round";
    cx.beginPath(); cx.moveTo(last[0], last[1]); cx.lineTo(p[0], p[1]); cx.stroke(); last = p;
  });
  const up = () => { last = null; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("contextmenu", e => e.preventDefault());
}
renderer.domElement.addEventListener("mousedown", e => {
  if (!walking || touch || e.button !== 0) return;
  e.preventDefault();
  if (dragging) return stopDrag();
  dragging = true;
  document.body.classList.add("looking");
  renderer.domElement.requestPointerLock?.()?.catch?.(() => {});
});
// Maus frei ohne eigenes Freigeben: Esc beendet das Begehen. Verliert das Fenster dabei den Fokus (Win+Shift+S Screenshot, Alt+Tab), bleibt man drin (Nicolas 2026-11-10)
document.addEventListener("pointerlockchange", () => { if (document.pointerLockElement || !dragging) return; stopDrag(); setTimeout(() => { if (!walking) return; if (document.hasFocus()) setWalk(false); else toast("Maus freigegeben (Linksklick übernimmt wieder)"); }, 250); });
const MOUSE_SENS = 0.0025 * 0.5;                                          // fest 50 % (Wunsch von Nicolas, nicht einstellbar)
document.addEventListener("mousemove", e => { if (dragging) look(e.movementX * MOUSE_SENS / zoomK(), e.movementY * MOUSE_SENS / zoomK()); });   // im Panzer-Zoom feiner (schiessen.js)
// Strg+W schliesst den Tab, das kann eine Webseite nicht verhindern: beim Begehen/Geist/Fahren fragt der Browser wenigstens nach (Nicolas)
addEventListener("beforeunload", e => { if (walking) { e.preventDefault(); e.returnValue = ""; } });
// Vollbild mit Tastensperre (Nicolas): im Vollbild bekommt die Seite Strg+W & Co. (Keyboard Lock, Chrome/Edge) und verhindert sie;
// Esc gedrueckt halten verlaesst das Vollbild. Knopf "Vollbild" (Orbit-Leiste und beim Begehen) oder Taste F.
async function toggleFullscreen() {
  if (document.fullscreenElement) { try { navigator.keyboard?.unlock?.(); } catch (e) {} return document.exitFullscreen().catch(() => {}); }
  try { await document.documentElement.requestFullscreen({ navigationUI: "hide" }); } catch (e) { return toast("Vollbild ist hier nicht möglich"); }
  let locked = false; try { if (navigator.keyboard && navigator.keyboard.lock) { await navigator.keyboard.lock(); locked = true; } } catch (e) {}
  toast(locked ? "Vollbild: Strg+W ist gesperrt. Esc gedrückt halten zum Verlassen" : "Vollbild (dieser Browser kann Strg+W nicht sperren)");
}
for (const id of ["btn-fs", "btn-fs2"]) $(id).addEventListener("click", e => { e.currentTarget.blur(); toggleFullscreen(); });
document.addEventListener("fullscreenchange", () => { for (const id of ["btn-fs", "btn-fs2"]) $(id).setAttribute("aria-pressed", String(!!document.fullscreenElement)); });
addEventListener("keydown", e => {
  if (document.fullscreenElement && (e.ctrlKey || e.metaKey) && !["KeyC", "KeyV", "KeyX", "KeyA"].includes(e.code)) e.preventDefault();   // Vollbild: Strg+W/T/N/R usw. abfangen
  if (e.code === "KeyF" && !e.repeat && !e.ctrlKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) { toggleFullscreen(); return; }
  if (window.settingsOpen && settingsOpen()) { if (e.code === "Escape" || e.code === "KeyT") closeSettings(); return; }   // K6: Einstellungen offen
  if (e.code === "KeyT" && !e.repeat && !(e.target instanceof HTMLSelectElement)) return toggleTp();   // TEST: Teleport-Menue
  if (tpMenuOpen()) { if (e.code === "Escape") toggleTp(); return; }
  if (e.code === "KeyG" && !e.repeat && !e.ctrlKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) { if (ghost) ghostToWalk(); else startGhost(); return; }   // G: Geist an/aus (Nicolas 2026-11-09)
  if (!walking) return;
  if (e.code === "Escape") return setWalk(false);
  if (ghost && e.code === "KeyE" && !e.repeat) { const ag = findAimedGate(); if (ag && !ag.call) toggleGate(ag); return; }   // Geist: E schaltet Tore/Tueren/Hebebuehne
  if (ghost) { keys.add(e.code); if (e.code.startsWith("Arrow") || e.code === "Space" || e.ctrlKey) e.preventDefault(); return; }   // Geist: Aufzugstasten ohne Wirkung; Strg+Taste ohne Browserbefehl (Strg+W laesst sich nicht abfangen)
  if (e.code === "KeyE" && !e.repeat) {
    const ag = findAimedGate();
    if (ag && !ag.call) toggleGate(ag);                                          // Naehe regelt findAimedGate (gateNear)
    // Aufzuege nicht mehr mit E, sondern per Rechtsklick auf die Tuer (Nicolas 2026-11-08, siehe tore.js)
    return;
  }
  if (FLY.on) {                                                             // The Bat: V Kamera, M Ton, sonst Flugtasten
    if (e.code.startsWith("Arrow") || e.code === "Space" || e.ctrlKey) e.preventDefault();
    if (e.code === "KeyV" && !e.repeat) { FLY.view = FLY.view === 1 ? 0 : 1; player.pitch = FLY.view ? 0 : -0.2; return toast(FLY.view ? "Cockpit" : "Kamera hinter The Bat"); }
    if (e.code === "KeyM" && !e.repeat) { engineMute(); if (!ENGINE.muted) engineStart("The Bat"); return; }
    keys.add(e.code); return;
  }
  if (JET.on) {                                                             // Kampfjet: V Kamera, M Ton, sonst Flugtasten
    if (e.code.startsWith("Arrow") || e.code === "Space" || e.ctrlKey) e.preventDefault();
    if (e.code === "KeyV" && !e.repeat) { JET.view = JET.view === 1 ? 0 : 1; player.yaw = JET.h; return toast(JET.view ? "Cockpit" : "Kamera hinter dem Jet"); }
    if (e.code === "KeyM" && !e.repeat) { engineMute(); if (!ENGINE.muted) engineStart("Kampfjet"); return; }
    if (e.code === "KeyR" && !e.repeat) return jetReset();                     // R: zurueck an den Standplatz
    keys.add(e.code); return;
  }
  if (BOAT.on && e.code === "KeyV" && !e.repeat) { BOAT.view = BOAT.view === 1 ? 0 : 1; player.pitch = BOAT.view ? 0 : -0.12; return toast(BOAT.view ? "Fahrersicht" : "Kamera hinter dem Boot"); }
  if (BOAT.on) { keys.add(e.code); if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault(); return; }
  if (CAR.on) {
    if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
    if (e.repeat) return;
    if (e.code === "KeyV") { CAR.view = 1 - CAR.view; player.pitch = CAR.view ? 0 : -0.12; return toast(CAR.view ? "Fahrersicht" : "Kamera hinter dem Auto"); }
    if (e.code === "KeyR") return carReset();
    if (e.code === "KeyM") return engineMute();
    { const v = VEH.find(c => c.on), p = v ? { x: v.x, y: v.y, z: v.z } : player.pos;   // Garagenrampe (Nicolas 2026-11-10): unten am Tor das Rolltor, sonst die Klappe
      if (e.code === "KeyL" && GRAMP.gate && GRAMP.near(p) && !(CAR_LIFT && CAR_LIFT.near(player.pos))) return toggleGate(p.y < HILL - 2.5 && (inPoly(GARAGE, p.x, p.z) || Math.hypot(p.x - 4.5, p.z - (GRAMP.D0 + GRAMP.D1) / 2) < 9) ? GRAMP.door : GRAMP.gate); }
    if (e.code === "KeyL" && CAR_LIFT) return CAR_LIFT.near(player.pos) ? CAR_LIFT.use() : toast("Kein Autoaufzug in der Nähe");
    if (CAR_LIFT && CAR_LIFT.inCar(player.pos) && /^(Digit|Numpad)[1-3]$/.test(e.code)) return CAR_LIFT.pick(CAR_LIFT.order[+e.code.slice(-1) - 1]);
    keys.add(e.code); if (e.code === "Space") player.jump = true;
    return;
  }
  if (CAR_LIFT && CAR_LIFT.inCar(player.pos)) {
    if (/^(Digit|Numpad)[1-3]$/.test(e.code)) return CAR_LIFT.pick(CAR_LIFT.order[+e.code.slice(-1) - 1]);
    if (e.code === "ArrowUp" || e.code === "ArrowDown") { e.preventDefault(); if (!e.repeat) CAR_LIFT.step(e.code === "ArrowUp" ? 1 : -1); return; }
  }
  if (inCar(player.pos)) {
    if (/^(Digit|Numpad)[1-5]$/.test(e.code)) return pickStop(STOP_ORDER[+e.code.slice(-1) - 1]);
    if (e.code === "ArrowUp" || e.code === "ArrowDown") { e.preventDefault(); if (!e.repeat) stepStop(e.code === "ArrowUp" ? 1 : -1); return; }
  }
  keys.add(e.code);
  if (e.code === "Space") { player.jump = true; e.preventDefault(); }
});
// Shift allein (ohne andere Taste dazwischen, ohne Win/Alt/Strg) = aussteigen; Win+Shift+S (Screenshot) loest es nicht aus
let shiftTap = false;
addEventListener("keydown", e => { shiftTap = (e.code === "ShiftLeft" || e.code === "ShiftRight") && !e.repeat ? !(e.metaKey || e.altKey || e.ctrlKey) : e.repeat && shiftTap && e.code.startsWith("Shift"); }, true);
addEventListener("blur", () => { shiftTap = false; });
addEventListener("keyup", e => { keys.delete(e.code); if (!e.code.startsWith("Shift") || !shiftTap || !walking || ghost) return; shiftTap = false; if (BOAT.on) useBoat(); else if (FLY.on) useFly(); else if (JET.on) useJet(); else if (CAR && CAR.on) useCar(); });
addEventListener("blur", () => keys.clear());
function joystick(el) {
  const knob = el.querySelector("span"), state = { x: 0, y: 0, id: null };
  const move = e => {
    const r = el.getBoundingClientRect(), max = r.width / 2 - 20;
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(x, y);
    if (len > max) { x *= max / len; y *= max / len; }
    state.x = x / max; state.y = y / max;
    knob.style.transform = `translate(${x}px, ${y}px)`;
  };
  el.addEventListener("pointerdown", e => { state.id = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch (err) {} move(e); });
  el.addEventListener("pointermove", e => { if (e.pointerId === state.id) move(e); });
  const end = e => { if (e.pointerId !== state.id) return; state.id = null; state.x = 0; state.y = 0; knob.style.transform = ""; };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  return state;
}
const moveStick = joystick($("stick-move")), lookStick = joystick($("stick-look"));
$("btn-jump").addEventListener("pointerdown", e => { e.preventDefault(); player.jump = true; jumpHeld = true; });
for (const type of ["pointerup", "pointercancel", "pointerleave"]) $("btn-jump").addEventListener(type, () => { jumpHeld = false; });
// Handy und Maus (Nicolas 2026-11-09): Knoepfe loesen dieselben Tasten aus wie die Tastatur (E, T, V, R, L, M)
const pressKey = code => { window.dispatchEvent(new KeyboardEvent("keydown", { code })); window.dispatchEvent(new KeyboardEvent("keyup", { code })); };
$("btn-act").addEventListener("click", e => { e.currentTarget.blur(); if (BOAT.on) useBoat(); else if (FLY.on) useFly(); else if (JET.on) useJet(); else if (CAR && CAR.on) useCar(); else if (!aimedGate && !useBoat() && !useFly() && !useJet() && !useCar()) pressKey("KeyE"); });   // Handy: Aktion = ein-/aussteigen oder Tor
$("btn-tp").addEventListener("click", e => { e.currentTarget.blur(); toggleTp(); });
for (const b of document.querySelectorAll("#veh-btns button")) b.addEventListener("click", () => { b.blur(); pressKey(b.dataset.key); });
// Modus als Klasse am body (fuer die Handy-Knoepfe): car, boat, fly, drive; Sprung-Knopf heisst beim Fliegen "Hoch"
let modeNow = "";
function syncModeClasses() {
  const m = !walking ? "" : FLY.on || JET.on ? "fly" : BOAT.on ? "boat" : CAR && CAR.on ? "car" : "";
  const tank = m === "car" && !!CAR.turret;                                  // Panzer: Zielvisier (Nicolas 2026-11-11)
  if (m + JET.on + tank === modeNow) return; modeNow = m + JET.on + tank; document.body.classList.toggle("tank", tank);
  for (const k of ["fly", "boat", "car"]) document.body.classList.toggle(k, k === m);
  document.body.classList.toggle("drive", !!m); document.body.classList.toggle("jet", JET.on); $("btn-jump").textContent = JET.on ? "Schub +" : m === "fly" ? "Hoch" : m === "car" && CAR.spec.boost ? "Nitro" : tank ? "Feuer" : "Sprung"; $("btn-down").textContent = JET.on ? "Schub −" : "Runter";   // Kampfjet: Knoepfe = Schub
}
$("btn-down").addEventListener("pointerdown", e => { e.preventDefault(); downHeld = true; });
for (const type of ["pointerup", "pointercancel", "pointerleave"]) $("btn-down").addEventListener(type, () => { downHeld = false; });
function walkStep(dt) {
  if (ghost) return ghostStep(dt);
  if (BOAT.on) return boatStep(dt);
  if (FLY.on) return flyStep(dt);
  if (JET.on) return jetStep(dt);
  if (FLY.landing) batLandStep(dt);                                       // The Bat landet nach dem Holen (siehe the-bat.js)
  if (CAR.on) return carStep(dt);
  let mx = 0, mz = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) mz += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) mz -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
  mx += moveStick.x; mz -= moveStick.y;
  look(lookStick.x * 2.6 * dt, lookStick.y * 1.8 * dt);
  updatePlayer(dt, mx, mz, keys.has("ShiftLeft") || keys.has("ShiftRight"));
}
$("btn-night").addEventListener("click", e => { nightTarget = nightTarget ? 0 : 1; e.currentTarget.setAttribute("aria-pressed", String(!!nightTarget)); });
addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
