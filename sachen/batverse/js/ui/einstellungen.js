// Batverse – Einstellungen (Plan K6, 2026-11-11)
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Fenster "Einstellungen" (Knopf in der Orbit-Leiste und im T-Menue): Ladeweite, Gelaende-Detail, Schatten, Aufloesung, Lautstaerke, Messanzeige.
// Alles wird im Browser gemerkt (localStorage: wm-range, wm-detail, wm-shadow, wm-res, wm-vol, wm-perf) und wirkt sofort.
const SET_RES = { niedrig: 1, mittel: 1.25, hoch: 1.5, max: 2 };            // Pixel-Verhaeltnis (hoechstens das des Geraets)
const setStore = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const setLoad = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
function applyShadows(on) { sun.castShadow = on; renderer.shadowMap.needsUpdate = true; }
function applyRes(v) { renderer.setPixelRatio(Math.min(window.devicePixelRatio, SET_RES[v] || 1.5)); renderer.setSize(window.innerWidth, window.innerHeight); }
// Automatisch anpassen (Plan K8, Nicolas 2026-11-12 "T2 fertig machen"): das Spiel misst selbst. Laeuft es nach dem Laden (keine Kachel und kein
// Gelaendeblock mehr in der Warteschlange, Seite sichtbar) 5 s lang unter 28 Bildern/s, wird eine Stufe heruntergeschaltet, in dieser Reihenfolge:
// Aufloesung (hoch -> mittel -> niedrig), Schatten aus, Gelaende-Detail (hoch -> mittel -> niedrig), Ladeweite bis 3 Kacheln. Danach wieder 5 s messen.
// Es wird nur heruntergeschaltet, nie hinauf; die Werte bleiben gespeichert wie von Hand gesetzt. Schluss nach 3 guten Messungen in Folge oder nach
// 3 Minuten. Gemessen wird erst 10 s nach dem Start; ein Bild mit mehr als 250 ms Abstand (Tab im Hintergrund, gedrosselt, Ruckler beim Laden)
// verwirft die laufende Messung, damit nichts wegen einer Pause heruntergeschaltet wird. Abschaltbar in den Einstellungen (wm-auto = 0). Meldung unten mit der gemessenen Bildrate.
const AUTO = { on: (() => { try { return localStorage.getItem("wm-auto") !== "0"; } catch (e) { return true; } })(), t0: 0, n: 0, good: 0, start: performance.now(), done: false, last: 0 };
function autoRestart() { AUTO.start = performance.now(); AUTO.t0 = 0; AUTO.n = 0; AUTO.good = 0; AUTO.done = false; }
function autoStep() {
  const order = [
    () => SET.res === "max" || SET.res === "hoch" ? (SET.res = SET.res === "max" ? "hoch" : "mittel", setStore("wm-res", SET.res), applyRes(SET.res), "Auflösung " + SET.res) : null,
    () => SET.res === "mittel" ? (SET.res = "niedrig", setStore("wm-res", SET.res), applyRes(SET.res), "Auflösung niedrig") : null,
    () => SET.shadow ? (SET.shadow = false, setStore("wm-shadow", "0"), applyShadows(false), "Schatten aus") : null,
    () => TERR.detail !== "niedrig" ? (setTerrainDetail(TERR.detail === "hoch" ? "mittel" : "niedrig"), "Gelände " + TERR.detail) : null,
    () => TILES.range > 3 ? (setTileRange(TILES.range - 1), "Ladeweite " + TILES.range + " Kacheln") : null,
  ];
  for (const f of order) { const r = f(); if (r) return r; }
  return null;
}
(function autoLoop(now) {
  requestAnimationFrame(autoLoop);
  if (!AUTO.on || AUTO.done) return;
  if (now - AUTO.start > 180000) { AUTO.done = true; return; }
  const gap = now - (AUTO.prev || now); AUTO.prev = now;
  const busy = gap > 250 || now - AUTO.start < 10000 || document.hidden || TILES.queue.length > 0 || TERR.queue.length > 0 || (window.settingsOpen && settingsOpen());
  if (busy) { AUTO.t0 = 0; AUTO.n = 0; return; }
  if (!AUTO.t0) { AUTO.t0 = now; AUTO.n = 0; return; }
  AUTO.n++; const span = now - AUTO.t0; if (span < 5000) return;
  const fps = AUTO.n * 1000 / span; AUTO.last = fps; AUTO.t0 = 0; AUTO.n = 0;
  if (fps >= 28) { if (++AUTO.good >= 3) AUTO.done = true; return; }
  AUTO.good = 0; const what = autoStep();
  if (what) toast("Automatisch angepasst: " + what + " (" + Math.round(fps) + " Bilder/s)"); else AUTO.done = true;
})(performance.now());
const SET = {
  shadow: setLoad("wm-shadow") !== "0",
  res: SET_RES[setLoad("wm-res")] ? setLoad("wm-res") : (TILES.mobile ? "mittel" : "hoch"),
};
if (!SET.shadow) applyShadows(false);
if (setLoad("wm-res")) applyRes(SET.res);                                  // ohne Eintrag bleibt die bisherige Vorgabe (basis.js)
{
  const box = $("settings"), rng = $("set-range"), rngV = $("set-range-v"), sh = $("set-shadow"), perf = $("set-perf");
  const seg = (id, val) => box.querySelectorAll("#" + id + " button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === val)));
  function show() {
    rng.value = String(TILES.range); rngV.textContent = TILES.range + " Kacheln · " + TILES.range * TILE + " m";
    seg("set-detail", TERR.detail); seg("set-res", SET.res); sh.checked = SET.shadow; perf.checked = PERF.on; $("set-auto").checked = AUTO.on;
  }
  rng.addEventListener("input", () => { setTileRange(+rng.value); show(); });
  box.querySelectorAll("#set-detail button").forEach(b => b.addEventListener("click", () => { setTerrainDetail(b.dataset.v); show(); }));
  box.querySelectorAll("#set-res button").forEach(b => b.addEventListener("click", () => { SET.res = b.dataset.v; setStore("wm-res", SET.res); applyRes(SET.res); show(); }));
  sh.addEventListener("change", () => { SET.shadow = sh.checked; setStore("wm-shadow", sh.checked ? "1" : "0"); applyShadows(sh.checked); });
  perf.addEventListener("change", () => perfToggle(perf.checked));
  $("set-auto").addEventListener("change", e => { AUTO.on = e.target.checked; setStore("wm-auto", AUTO.on ? "1" : "0"); if (AUTO.on) autoRestart(); });
  $("set-reset").addEventListener("click", () => {
    for (const k of ["wm-range", "wm-detail", "wm-shadow", "wm-res", "wm-auto"]) try { localStorage.removeItem(k); } catch (e) {}
    AUTO.on = true; autoRestart();
    setTileRange(TILES.mobile ? 4 : 7); try { localStorage.removeItem("wm-range"); } catch (e) {}
    setTerrainDetail(TILES.mobile ? "niedrig" : "mittel"); try { localStorage.removeItem("wm-detail"); } catch (e) {}
    SET.shadow = true; applyShadows(true); SET.res = TILES.mobile ? "mittel" : "hoch"; applyRes(SET.res); setEngineVol(0.25); show();
    toast("Einstellungen zurückgesetzt");
  });
  function closeSettings() { box.hidden = true; if (typeof grabMouse === "function") grabMouse(); }
  $("set-close").addEventListener("click", closeSettings);
  window.openSettings = () => {
    if (window.tpMenuOpen && tpMenuOpen()) toggleTp();
    if (dragging) { dragging = false; document.body.classList.remove("looking"); if (document.pointerLockElement) document.exitPointerLock(); }
    keys.clear(); show(); box.hidden = false;
  };
  window.closeSettings = closeSettings;
  window.settingsOpen = () => !box.hidden;
  $("btn-settings").addEventListener("click", e => { e.currentTarget.blur(); openSettings(); });
  $("tp-settings").addEventListener("click", () => openSettings());
}
