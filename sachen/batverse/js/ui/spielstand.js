// Batverse – Spielstand: Position und Modus merken (Nicolas 2026-11-16: "ein Cookie, der Position und Modus loggt, z. B. bei jedem Esc,
// und in den Einstellungen manuell"). Gespeichert wird im Browser (localStorage wm-stand, wie die anderen Spielstaende; kein echtes Cookie):
// automatisch bei Esc, wenn die Maus frei wird, wenn der Tab verborgen wird und beim Verlassen der Seite. Beim Start wird dort weitergemacht
// (abschaltbar in den Einstellungen, wm-stand-auto). Fahrzeug/Boot/Flug: man steht beim Fortsetzen zu Fuss an derselben Stelle.
"use strict";
const STAND = { key: "wm-stand", auto: true, restored: false };
try { STAND.auto = localStorage.getItem("wm-stand-auto") !== "0"; } catch (e) {}
function standMode() { if (!walking) return "orbit"; if (ghost) return "ghost"; const b = document.body.classList; return b.contains("car") ? "car" : b.contains("boat") ? "boat" : b.contains("fly") ? "fly" : "walk"; }
const STAND_NAMES = { orbit: "Orbit", walk: "Begehen", ghost: "Geist", car: "Fahrzeug", boat: "Boot", fly: "Flug" };
function standSave(manual) {
  const m = standMode(), r = n => Math.round(n * 100) / 100, d = { t: Date.now(), mode: m };
  if (m === "orbit") { d.cam = camera.position.toArray().map(r); d.tgt = controls.target.toArray().map(r); }
  else { const p = m === "ghost" ? player.pos : (typeof CAR !== "undefined" && CAR && CAR.on) ? { x: CAR.x, y: CAR.y, z: CAR.z } : player.pos; d.p = [r(p.x), r(p.y), r(p.z)]; d.yaw = r(player.yaw); d.pitch = r(player.pitch); }
  try { localStorage.setItem(STAND.key, JSON.stringify(d)); } catch (e) { if (manual) toast("Speichern nicht möglich (Browser-Speicher gesperrt)"); return; }
  standUI(); if (manual) toast("Position gespeichert (" + STAND_NAMES[m] + ")");
}
function standLoad(manual) {
  let d = null; try { d = JSON.parse(localStorage.getItem(STAND.key) || "null"); } catch (e) {}
  if (!d || !d.mode) { if (manual) toast("Noch keine Position gespeichert"); return false; }
  if (d.mode === "orbit" && d.cam && d.tgt) {
    if (walking) setWalk(false); camera.position.fromArray(d.cam); controls.target.fromArray(d.tgt); camera.lookAt(controls.target); controls.update();
  } else if (d.p) {
    const [x, y, z] = d.p;
    if (d.mode === "ghost") { if (walking) setWalk(false); camera.position.set(x, y + EYE, z); controls.target.set(x - Math.sin(d.yaw) * 25, y + EYE, z - Math.cos(d.yaw) * 25); startGhost(); player.yaw = d.yaw; player.pitch = d.pitch; }
    else { teleportToPoint({ x, y, z }); player.yaw = d.yaw; player.pitch = d.pitch; updatePlayer(0.001, 0, 0, false); }
  } else return false;
  toast((manual ? "Position geladen" : "Weiter, wo du warst") + " (" + STAND_NAMES[d.mode] + ")"); return true;
}
function standUI() {
  const el = document.getElementById("set-stand-info"); if (!el) return; let d = null; try { d = JSON.parse(localStorage.getItem(STAND.key) || "null"); } catch (e) {}
  el.textContent = d ? "Zuletzt gespeichert: " + new Date(d.t).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + " · " + STAND_NAMES[d.mode] : "Noch nichts gespeichert";
  const cb = document.getElementById("set-stand-auto"); if (cb) cb.checked = STAND.auto;
}
// automatisch speichern
addEventListener("keydown", e => { if (e.code === "Escape" && STAND.restored) standSave(); }, true);
document.addEventListener("pointerlockchange", () => { if (!document.pointerLockElement && STAND.restored) standSave(); });   // Esc bei gefangener Maus kommt nur so an
document.addEventListener("visibilitychange", () => { if (document.hidden && STAND.restored) standSave(); });
addEventListener("pagehide", () => { if (STAND.restored) standSave(); });
// Einstellungen
document.getElementById("set-stand-save")?.addEventListener("click", e => { e.currentTarget.blur(); standSave(true); });
document.getElementById("set-stand-load")?.addEventListener("click", e => { e.currentTarget.blur(); document.getElementById("set-close")?.click(); standLoad(true); });
document.getElementById("set-stand-auto")?.addEventListener("change", e => { STAND.auto = e.currentTarget.checked; try { localStorage.setItem("wm-stand-auto", STAND.auto ? "1" : "0"); } catch (err) {} });
standUI();
// beim Start: nach dem Ladebildschirm fortsetzen (vorher nicht speichern, sonst ueberschreibt der Startzustand den Stand)
{ const t0 = performance.now(), wait = () => { if (document.getElementById("loading") && performance.now() - t0 < 40000) return setTimeout(wait, 300);
    if (STAND.auto) try { standLoad(false); } catch (e) {} STAND.restored = true; standUI(); };
  setTimeout(wait, 300); }
