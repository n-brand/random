// Wayne Manor 3D – Einstellungen (Plan K6, 2026-11-11)
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Fenster "Einstellungen" (Knopf in der Orbit-Leiste und im T-Menue): Ladeweite, Gelaende-Detail, Schatten, Aufloesung, Lautstaerke, Messanzeige.
// Alles wird im Browser gemerkt (localStorage: wm-range, wm-detail, wm-shadow, wm-res, wm-vol, wm-perf) und wirkt sofort.
const SET_RES = { niedrig: 1, mittel: 1.25, hoch: 1.5, max: 2 };            // Pixel-Verhaeltnis (hoechstens das des Geraets)
const setStore = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const setLoad = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
function applyShadows(on) { sun.castShadow = on; renderer.shadowMap.needsUpdate = true; }
function applyRes(v) { renderer.setPixelRatio(Math.min(window.devicePixelRatio, SET_RES[v] || 1.5)); renderer.setSize(window.innerWidth, window.innerHeight); }
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
    seg("set-detail", TERR.detail); seg("set-res", SET.res); sh.checked = SET.shadow; perf.checked = PERF.on;
  }
  rng.addEventListener("input", () => { setTileRange(+rng.value); show(); });
  box.querySelectorAll("#set-detail button").forEach(b => b.addEventListener("click", () => { setTerrainDetail(b.dataset.v); show(); }));
  box.querySelectorAll("#set-res button").forEach(b => b.addEventListener("click", () => { SET.res = b.dataset.v; setStore("wm-res", SET.res); applyRes(SET.res); show(); }));
  sh.addEventListener("change", () => { SET.shadow = sh.checked; setStore("wm-shadow", sh.checked ? "1" : "0"); applyShadows(sh.checked); });
  perf.addEventListener("change", () => perfToggle(perf.checked));
  $("set-reset").addEventListener("click", () => {
    for (const k of ["wm-range", "wm-detail", "wm-shadow", "wm-res"]) try { localStorage.removeItem(k); } catch (e) {}
    setTileRange(TILES.mobile ? 4 : 7); try { localStorage.removeItem("wm-range"); } catch (e) {}
    setTerrainDetail(TILES.mobile ? "niedrig" : "mittel"); try { localStorage.removeItem("wm-detail"); } catch (e) {}
    SET.shadow = true; applyShadows(true); SET.res = TILES.mobile ? "mittel" : "hoch"; applyRes(SET.res); setEngineVol(0.25); show();
    toast("Einstellungen zurückgesetzt");
  });
  function closeSettings() { box.hidden = true; }
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
