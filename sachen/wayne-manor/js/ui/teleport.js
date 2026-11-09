// Wayne Manor 3D – Teleport-Menue (Test): Orte und Fahrzeuge
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Orbit-Rechtsklick -> "Hierhin teleportieren" (Nicolas 2026-11-08): Begehen am getroffenen Punkt, Blick in die bisherige Kamerarichtung
function teleportToPoint(p) {
  if (belowView) $("btn-below").click();
  const dir = controls.target.clone().sub(camera.position);
  startWalk(p.x, p.z, Math.atan2(-dir.x, -dir.z));
  player.pos.set(p.x, p.y + 0.3, p.z); player.pos.y = supportAt(player.pos, p.y + 0.3); player.vy = 0;
  updatePlayer(0.001, 0, 0, false);
  toast("Teleport hierhin");
}
// TEST: Teleport-Ziele zum Testen (wird ganz am Ende entfernt). [Name, x, y, z, Blickrichtung]
{
  const cm = (px, py) => caveMp(px, py), W = Math.PI / 2, E = -Math.PI / 2, N = 0, S = Math.PI;
  const TP = [
    ["Rondell (vor dem Haus)", 18, 0, 0, W], ["Halle EG", -30, FL0, 0, W], ["Aufzug EG", -49, FL0, SHAFT.cz, W], ["1. Obergeschoss", -45, FL1, 3, W],
    ["Dach / 2. OG", -45, TF, SHAFT.cz, E], ["Theater", -44, TF, 10, N], ["Observatorium", -40, TF2, 0, N], ["Landeplatz", -18, HP, 42, W],
    ["Veranda", DOORS[1].a0 + 2, 0.42, -33, N], ["Labyrinth (Eingang Süd)", DOORS[1].a0 + 2, 0, -41, N], ["Pool", -12, 0, 70, N], ["Tennis/Basketball", -45, 0, 66, S],
    ["Tiefgarage", -28, GY, 32.7, E],
    ["Höhle unten: Drehplattform", -32, LY, 12.5, W], ["Höhle unten: Batcomputer", -50, LY, -6, W],
    ["Höhle unten: Anlegestelle (Weg)", ...(([x, z]) => [x, LY, z])(cm(340, 485)), E], ["Höhle unten: Steg", ...(([x, z]) => [x, SEA_Y + 0.5, z])(cm(300, 507)), E], ["Tunnel Süd (Gotham Exit)", ...(([x, z]) => [x, LY, z])(cm(40, 453)), N],
    ["Tunnel Nord (Waterfall Exit)", ...(([x, z]) => [x, LY, z])(cm(690, 482)), S],
    ["Höhle oben: Forschung", ...(([x, z]) => [x - 4, UY, z])(cm(382, 422)), E], ["Höhle oben: Hangar", ...(([x, z]) => [x, UY, z])(cm(270, 420)), W], ["Höhle oben: Vorraum Treppe", -46, UY, 18, E],
    ["Höhle oben: Training", ...(([x, z]) => [x, UY, z])(cm(500, 478)), N],
    ["Klippe über der Meereshöhle", 100, 0, 96, -3 * Math.PI / 4], ["Wasserfall-Teich", -127, 0, -160, N], ["Wasserfall oben (Bach)", -88, 0, -184, W], ["Plateau Nord (Wald)", -55, 0, -180, N], ["Serpentine oben (Rondell)", 20, 0, 0, E], ["Serpentine unten (Hangfuss)", 106, 0, 2, W], ["Einfahrtstor (aussen)", GATE_C[0] + 11 * GATE_U[0], 0, GATE_C[1] + 11 * GATE_U[1], Math.atan2(GATE_U[0], GATE_U[1])], ["Hauptstrasse (Kreuzung)", MAIN_J[0] + 6, 0, MAIN_J[1] - 4, Math.atan2(GATE_U[0], GATE_U[1])], ["Hauptstrasse (Südwest-Ende)", -58, 0, 196, Math.PI * 0.8], ["Autoaufzug (Garage)", -31, GY, 38.25, W], ["Hangfuss-Platz (Felstor)", -68, 0, 38.25, E], ["Auto Repair (Geheimgang)", -42, LY, 29.5, N], ["Waterfall Exit (Tunnel unten)", -25.8, LY, -42, N], ["Waterfall Exit (Tunnel Mitte)", ...(() => { const p = WFT.curve.getPointAt(WFT.sP / 2 / WFT.len), t = WFT.curve.getTangentAt(WFT.sP / 2 / WFT.len); return [p.x, WFT.y(WFT.sP / 2), p.z, Math.atan2(-t.x, -t.z)]; })()], ["Waterfall Exit (aussen, Westufer)", -134, 0, -186.4, E], ["Felswand West (oben)", -98, 0, -185, W]
  ];
  for (const t of TP) if (t[2] > -6 && plateauH(t[1], t[3]) > HILL - 0.5) t[2] += HILL;   // Ziele auf dem Plateau (A2)
  const sel = $("teleport"), menu = $("tp-menu"), list = menu.querySelector(".tp-orte"), dOrte = $("tp-orte"), dVeh = $("tp-veh");
  dOrte.addEventListener("toggle", () => { if (dOrte.open) dVeh.open = false; });   // immer nur ein Bereich offen
  dVeh.addEventListener("toggle", () => { if (dVeh.open) dOrte.open = false; });
  function teleportTo(i) {
    const t = TP[i];
    if (!t) return;
    const [, x, y, z, yaw] = t;
    if (belowView) $("btn-below").click();
    startWalk(x, z, yaw);
    player.pos.set(x, y + 0.3, z); player.pos.y = supportAt(player.pos, y + 0.3); player.vy = 0;
    updatePlayer(0.001, 0, 0, false);
    toast("Teleport: " + t[0]);
  }
  TP.forEach(([name], i) => {
    const o = document.createElement("option"); o.value = String(i); o.textContent = name; sel.appendChild(o);
    const b = document.createElement("button"); b.type = "button"; b.textContent = name; b.addEventListener("click", () => { closeTp(); teleportTo(i); }); list.appendChild(b);
  });
  const vehList = menu.querySelector(".tp-veh"), vehGroup = document.createElement("optgroup"); vehGroup.label = "Fahrzeuge"; sel.appendChild(vehGroup);
  function fillVehicles() {
    const vs = world.userData.vehicles || [];
    vehList.textContent = ""; vehGroup.textContent = "";
    vs.forEach((v, i) => {
      const b = document.createElement("button"); b.type = "button";
      const dot = document.createElement("i"); dot.style.background = "#" + v.color.toString(16).padStart(6, "0"); b.append(dot, v.label);
      b.addEventListener("click", () => { closeTp(); summonVehicle(v); }); vehList.appendChild(b);
      const o = document.createElement("option"); o.value = "v" + i; o.textContent = v.label; vehGroup.appendChild(o);
    });
    if (typeof FLY !== "undefined") {                                         // Fluggeraet The Bat (eigenes System, siehe the-bat.js)
      const b = document.createElement("button"); b.type = "button"; const dot = document.createElement("i"); dot.style.background = "#2c2e33"; b.append(dot, "The Bat (Batwing)");
      b.addEventListener("click", () => { closeTp(); summonBat(); }); vehList.appendChild(b);
      const o = document.createElement("option"); o.value = "vbat"; o.textContent = "The Bat (Batwing)"; vehGroup.appendChild(o);
    }
  }
  sel.addEventListener("pointerdown", fillVehicles); sel.addEventListener("focus", fillVehicles);
  sel.addEventListener("change", () => { const i = sel.value; sel.value = ""; sel.blur(); if (i === "vbat") summonBat(); else if (i.startsWith("v")) summonVehicle((world.userData.vehicles || [])[+i.slice(1)]); else if (i !== "") teleportTo(+i); });
  // Taste T: Menue auf/zu; Maus wird freigegeben, ohne das Begehen zu beenden
  function closeTp() { menu.hidden = true; }
  $("tp-close").addEventListener("click", closeTp);                          // Handy: kein Esc/T
  window.toggleTp = () => {
    if (!menu.hidden) return closeTp();
    if (dragging) { dragging = false; document.body.classList.remove("looking"); if (document.pointerLockElement) document.exitPointerLock(); }
    keys.clear();
    fillVehicles(); dOrte.open = false; dVeh.open = false;                   // beim Oeffnen immer alles eingeklappt (Nicolas)
    menu.hidden = false;
  };
  window.tpMenuOpen = () => !menu.hidden;
}
