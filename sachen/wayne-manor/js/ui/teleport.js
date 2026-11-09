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
  // Nicolas 2026-11-09: nur noch vier Orte, jeder mit Symbol (Bilder erkennt man schneller als Text). [Name, x, y, z, Blick, Symbol]
  const TP = [
    ["Wayne Manor", 18, 0, 0, W, "manor"], ["Batcave", -50, LY, -6, W, "cave"], ["Wald am Wasserfall", -127, 0, -160, N, "fall"],
    ["Kreuzung", MAIN_J[0] + 6, 0, MAIN_J[1] - 4, Math.atan2(GATE_U[0], GATE_U[1]), "cross"]
  ];
  // Symbole (24er-Raster, Linien in currentColor; Fahrzeuge in ihrer Farbe)
  const ICONS = {
    manor: '<path d="M3 21h18M5 21V10l3-3 3 3v11M13 21v-8l3-3 3 3v8M8 3v4M16 6v4M8 14h0M16 16h0" />',
    cave: '<path d="M2 20c2-9 6-14 10-14s8 5 10 14z" /><path d="M7.5 13c1 .2 1.6.8 1.8 1.6.6-.7 1.6-.9 2.7-.3.9-.7 2.1-.5 2.7.3.2-.8.8-1.4 1.8-1.6-.6 1.5-1.4 2.5-2.6 3-1 .3-1.6 1-1.9 1.7-.3-.7-.9-1.4-1.9-1.7-1.2-.5-2-1.5-2.6-3z" fill="currentColor" stroke="none" />',
    fall: '<path d="M6 21l3.5-7h-2L11 8H9.5L12 3l2.5 5H13l3.5 6h-2L18 21z" /><path d="M2 21h20M20 6v8M18.5 9v5" />',
    cross: '<path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke-dasharray="1.5 1.5" />',
    car: '<path d="M3 15v-3l2-4.5h10l3 4.5 3 .8V15z" fill="currentColor" stroke="none" /><circle cx="7" cy="16" r="2.2" /><circle cx="17" cy="16" r="2.2" />',
    bike: '<circle cx="5.5" cy="16" r="3.2" /><circle cx="18.5" cy="16" r="3.2" /><path d="M5.5 16l4-6h5l4 6M9.5 10l3 6M13 7h3l-1.5 3" />',
    bat: '<path d="M12 7c1.2 0 2 1 2 2l4-1.5c1 2 2.5 3 4 3.5-1.6 1.1-2.4 2.6-2.6 4.5-1-1-2.4-1.4-3.6-1-.5-1.3-1.7-2-3.8-2s-3.3.7-3.8 2c-1.2-.4-2.6 0-3.6 1-.2-1.9-1-3.4-2.6-4.5 1.5-.5 3-1.5 4-3.5L10 9c0-1 .8-2 2-2z" fill="currentColor" stroke="none" />',
  };
  const icon = (k, col) => { const sp = document.createElement("span"); sp.className = "tp-ic"; if (col) sp.style.color = col;
    sp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[k] + "</svg>"; return sp; };
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
  TP.forEach(([name, , , , , ic], i) => {
    const o = document.createElement("option"); o.value = String(i); o.textContent = name; sel.appendChild(o);
    const b = document.createElement("button"); b.type = "button"; b.append(icon(ic), name); b.addEventListener("click", () => { closeTp(); teleportTo(i); }); list.appendChild(b);
  });
  const vehList = menu.querySelector(".tp-veh"), vehGroup = document.createElement("optgroup"); vehGroup.label = "Fahrzeuge"; sel.appendChild(vehGroup);
  function fillVehicles() {
    const vs = world.userData.vehicles || [];
    vehList.textContent = ""; vehGroup.textContent = "";
    vs.forEach((v, i) => {
      const b = document.createElement("button"); b.type = "button";
      const col = "#" + v.color.toString(16).padStart(6, "0"); b.append(icon(v.spec.bike ? "bike" : "car", col), v.label);
      b.addEventListener("click", () => { closeTp(); summonVehicle(v); }); vehList.appendChild(b);
      const o = document.createElement("option"); o.value = "v" + i; o.textContent = v.label; vehGroup.appendChild(o);
    });
    if (typeof FLY !== "undefined") {                                         // Fluggeraet The Bat (eigenes System, siehe the-bat.js)
      const b = document.createElement("button"); b.type = "button"; b.append(icon("bat", "#3a3d44"), "The Bat (Batwing)");
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
