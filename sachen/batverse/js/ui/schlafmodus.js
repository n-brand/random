// Batverse – Schlafmodus (Nicolas 2026-11-17: "wenn man die Seite laengere Zeit nicht benutzt, soll es einen Offline-Mode geben, bei erneutem Klick dann wieder Ladebildschirm").
// Nach SLEEP.idleMin Minuten ohne Eingabe (sichtbare Seite) oder SLEEP.hiddenMin Minuten im Hintergrund: Spielstand speichern (spielstand.js), Bildschleife anhalten,
// WebGL freigeben (Grafikspeicher, Akku) und eine Ruhe-Seite zeigen. Klick oder Taste laedt die Seite neu: Ladebildschirm, danach geht es dort weiter, wo man war
// (Einstellung "Beim Start weitermachen"). Werte aenderbar: localStorage wm-schlaf-min (Minuten ohne Eingabe, 0 = aus). Klassisches Skript, FILES nach ui/spielstand.js.
"use strict";
const SLEEP = { idleMin: 10, hiddenMin: 5, last: performance.now(), hiddenAt: document.hidden ? performance.now() : null, on: false, el: null };   // im Hintergrund geladen: zaehlt ab jetzt
try { const v = localStorage.getItem("wm-schlaf-min"); if (v !== null && !isNaN(+v)) SLEEP.idleMin = +v; } catch (e) {}
for (const ev of ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"]) addEventListener(ev, () => { SLEEP.last = performance.now(); }, { capture: true, passive: true });
document.addEventListener("visibilitychange", () => { if (document.hidden) SLEEP.hiddenAt = performance.now();
  else { if (SLEEP.hiddenAt !== null && performance.now() - SLEEP.hiddenAt > SLEEP.hiddenMin * 60000) sleepNow("hintergrund"); SLEEP.hiddenAt = null; SLEEP.last = performance.now(); } });
function sleepCheck() { if (SLEEP.on || !SLEEP.idleMin || document.getElementById("loading")) return; const now = performance.now();
  if (document.hidden) { if (SLEEP.hiddenAt !== null && now - SLEEP.hiddenAt > SLEEP.hiddenMin * 60000) sleepNow("hintergrund"); }
  else if (now - SLEEP.last > SLEEP.idleMin * 60000) sleepNow("inaktiv"); }
setInterval(sleepCheck, 15000);
function sleepNow(grund) {
  if (SLEEP.on) return; SLEEP.on = true;
  try { if (typeof STAND !== "undefined" && STAND.restored && typeof standSave === "function") standSave(); } catch (e) {}
  if (document.pointerLockElement) document.exitPointerLock();
  try { frame = () => {}; } catch (e) {}                                         // Bildschleife (kern/schleife.js) haelt beim naechsten Bild an
  setTimeout(() => { try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) {} }, 100);   // Grafikspeicher frei
  const el = SLEEP.el = document.createElement("div"); el.id = "schlaf";
  el.innerHTML = '<div class="sz-box"><div class="sz-moon">☾</div><b>Batverse ruht</b><p>' + (grund === "hintergrund" ? "Die Seite war länger im Hintergrund." : "Eine Weile keine Eingabe.") +
    " Die Welt ist entladen und spart Strom und Speicher.</p><button type=\"button\">Weiterspielen</button><small>" + (typeof STAND !== "undefined" && STAND.auto ? "Lädt neu – du machst dort weiter, wo du warst." : "Lädt neu (Weitermachen ist in den Einstellungen aus).") + "</small></div>";
  const st = document.createElement("style"); st.textContent = "#schlaf { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; background: radial-gradient(circle at 50% 40%, #1a2236, #07090f 70%); color: #e8ecf4; font: 15px system-ui, sans-serif; cursor: pointer; }" +
    "#schlaf .sz-box { text-align: center; max-width: 380px; padding: 24px; } #schlaf .sz-moon { font-size: 64px; color: #e8c547; text-shadow: 0 0 24px rgba(232,197,71,.5); animation: sz-p 3s ease-in-out infinite; } @keyframes sz-p { 50% { opacity: .55; } }" +
    "#schlaf b { display: block; font-size: 26px; margin: 6px 0 8px; } #schlaf p { margin: 0 0 18px; opacity: .8; line-height: 1.45; } #schlaf button { padding: 12px 28px; border: 0; border-radius: 999px; background: #e8c547; color: #14161c; font: 700 16px system-ui, sans-serif; cursor: pointer; } #schlaf small { display: block; margin-top: 12px; opacity: .6; }";
  document.head.appendChild(st); document.body.appendChild(el);
  const wake = () => { try { STAND.restored = false; walking = false; } catch (e) {} location.reload(); };   // nicht nochmal speichern (pagehide sieht sonst Orbit), walking aus: sonst fragt beforeunload nach
  el.addEventListener("click", wake); addEventListener("keydown", e => { if (SLEEP.on && !e.repeat) { e.preventDefault(); e.stopImmediatePropagation(); wake(); } }, true);
}
