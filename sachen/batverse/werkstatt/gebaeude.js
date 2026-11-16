// Werkstatt – Gotham-Gebaeude aufbauen und anzeigen (nach den Gotham-Dateien des Spiels und gotham-shim.js).
// Baut die Aufgaben von Casino, Polizei, Orten (Waffenladen, Autohaus) und Parken am Stueck, stellt deren Fahrzeuge hin,
// ergaenzt die Auswahl oben um "Gebaeude (Gotham)" und laesst Casino-Neon und Batsignal laufen.
"use strict";
// Casino: nur die Baustelle BS-02 (gotham/stadt.js: x -1300, z -620, 60 x 50 m), statt die ganze Stadtliste zu laden
gbstList = function () { const r = [[-1330, -645], [-1270, -645], [-1270, -595], [-1330, -595]], poly = r.map(([x, z]) => GOT.toGame(x, z)), cx = poly.reduce((a, p) => a + p[0], 0) / 4, cz = poly.reduce((a, p) => a + p[1], 0) / 4;
  return [{ id: "BS-02", poly, h: 0, wohl: 0.95, bezirk: "Uptown", cx, cz, cell: 0, gate: 0 }]; };
const WG = { built: [], t: 0 }; GBST.done = true;   // Baustellen-Aufgabe laeuft hier nicht; die Orte warten sonst darauf
{ const v0 = VEH.length, t0 = performance.now();
  for (const [name, done] of [["CAS", () => CAS.done], ["GCPD", () => GCPD.done], ["GORT", () => GORT.done], ["GPK", () => GPK.done]]) {
    const task = TILES.tasks.find(t => t.step.toString().includes(name + ".done")); if (!task) continue;
    for (let i = 0; i < 20000 && !done(); i++) task.step();
    WG.built.push(name + (done() ? "" : " (nicht fertig)")); }
  for (const v of VEH.slice(v0)) { if (v.lazy) vehReal(v); v.g.position.set(v.x, v.y || 0, v.z); v.g.rotation.set(0, v.h, 0); v.g.visible = true; }   // Streifenwagen, Verwahrstelle
  WG.ms = Math.round(performance.now() - t0); }
// Auswahl: "Gebaeude (Gotham)"
{ const og = document.createElement("optgroup"); og.label = "Gebäude (Gotham, aus dem Spiel)";
  for (const id in WG_ZIEL) { const o = document.createElement("option"); o.value = "geb:" + id; o.textContent = WG_NAME[id]; og.appendChild(o); }
  const pick = document.getElementById("pick"), pg = pick.querySelector('optgroup[label="Umbauprojekt"]'); pick.insertBefore(og, pg ? pg.nextSibling : pick.firstChild); }
function gebZeigen(id) { if (modus !== "orbit") setModus("orbit"); const [x, z] = WG_ZIEL[id], r = WG_MAP[id][2], o = GOTHAM.orte.find(q => q.id === id), h = o ? o.h : 22;
  controls.target.set(x, Math.min(h, 30) * 0.4, z); camera.position.set(x - r * 1.5, Math.min(h, 40) + r * 0.6, z + r * 0.9); controls.update();
  $info.innerHTML = "<table><tr><td>Gebäude</td><td>" + WG_NAME[id] + "</td></tr><tr><td>Grundstück</td><td>" + (o ? o.w + " x " + o.d + " m" : "60 x 50 m") + "</td></tr></table><div class=\"note\">Aus den Spieldateien gebaut (" + WG.built.join(", ") + ", " + WG.ms + " ms). Ohne Kollision, Tore und Strassen.</div>"; }
// Neon, Batsignal, Uhr
(function wgLoop() { if (typeof casinoStep === "function") try { casinoStep(); } catch (e) {} if (typeof gcpdStep === "function") try { gcpdStep(); } catch (e) {} requestAnimationFrame(wgLoop); })();
