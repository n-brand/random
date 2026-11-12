// Wayne Manor 3D – Teleport-Menue (Test): Orte und Fahrzeuge
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Orbit-Rechtsklick -> "Hierhin teleportieren" (Nicolas 2026-11-08): Begehen am getroffenen Punkt, Blick in die bisherige Kamerarichtung
function teleportToPoint(p) {
  if (belowView) $("btn-below").click();
  const dir = controls.target.clone().sub(camera.position), yaw = walking ? player.yaw : Math.atan2(-dir.x, -dir.z);   // im Geist: Blickrichtung des Geists
  startWalk(p.x, p.z, yaw);
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
    ["Kreuzung", MAIN_J[0] + 6, 0, MAIN_J[1] - 4, Math.atan2(GATE_U[0], GATE_U[1]), "cross"],
    (() => { const [x, z] = GOT.toGame(-2050, -330), [ax, az] = GOT.toGame(-2050, -100); return ["Gotham", x, GOT.STR, z, Math.atan2(-(ax - x), -(az - z)), "city"]; })()   // G1c: Inselmitte vor dem Wayne Circle, Blick zum Turm
  ];
  // Symbole (24er-Raster, Linien in currentColor; Fahrzeuge in ihrer Farbe)
  const ICONS = {
    manor: '<path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /><path d="M16 6V3.5h2V8" />',
    cave: '<path d="M12 8.5c1 0 1.7.8 1.8 1.7l2-2.7c1.6 1.4 3.6 2 6.2 1.8-1.7 1.4-2.4 3.2-2.1 5.3-1.4-1.3-3.2-1.6-4.9-.9.1 1.5-.8 2.9-3 4.3-2.2-1.4-3.1-2.8-3-4.3-1.7-.7-3.5-.4-4.9.9.3-2.1-.4-3.9-2.1-5.3 2.6.2 4.6-.4 6.2-1.8l2 2.7c.1-.9.8-1.7 1.8-1.7z" fill="currentColor" stroke="none" /><path d="M11 8.6l-.4-1.6M13 8.6l.4-1.6" />',
    fall: '<path d="M12 2.5c3.5 4.6 6 8 6 11.2a6 6 0 0 1-12 0C6 10.5 8.5 7.1 12 2.5z" /><path d="M9.2 14.2a3 3 0 0 0 2.6 2.8" />',
    city: '<path d="M3 21V11h4V6h4v15M11 21V3h5v18M16 21v-9h5v9M2 21h20" /><path d="M13 6.5h1M13 10h1M13 13.5h1M5 14h0.5M18 15h1" />',   // Skyline (Gotham)
    cross: '<path d="M7 21L10 3M17 21L14 3" /><path d="M12 4.5v2.5M12 10v3M12 16.5v3.5" />',
    car: '<path d="M3 15v-3l2-4.5h10l3 4.5 3 .8V15z" fill="currentColor" stroke="none" /><circle cx="7" cy="16" r="2.2" /><circle cx="17" cy="16" r="2.2" />',
    bike: '<circle cx="5.5" cy="16" r="3.2" /><circle cx="18.5" cy="16" r="3.2" /><path d="M5.5 16l4-6h5l4 6M9.5 10l3 6M13 7h3l-1.5 3" />',
    bat: '<path d="M12 7c1.2 0 2 1 2 2l4-1.5c1 2 2.5 3 4 3.5-1.6 1.1-2.4 2.6-2.6 4.5-1-1-2.4-1.4-3.6-1-.5-1.3-1.7-2-3.8-2s-3.3.7-3.8 2c-1.2-.4-2.6 0-3.6 1-.2-1.9-1-3.4-2.6-4.5 1.5-.5 3-1.5 4-3.5L10 9c0-1 .8-2 2-2z" fill="currentColor" stroke="none" />',
    jet: '<path d="M12 2.5c.8 0 1.3 1.2 1.4 3l.2 3.6 7.4 5.6v1.8l-7.3-2.4-.3 4 2.4 1.9v1.5L12 20.6l-3.8.9V20l2.4-1.9-.3-4-7.3 2.4v-1.8l7.4-5.6.2-3.6c.1-1.8.6-3 1.4-3z" fill="currentColor" stroke="none" />',   // Flugzeug von oben (Kampfjet)
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
    if (typeof JET !== "undefined") {                                         // Kampfjet (jet.js): zu gross zum Holen, der Spieler geht hin
      const b = document.createElement("button"); b.type = "button"; b.append(icon("jet", "#8b9198"), "Kampfjet (hingehen)");
      b.addEventListener("click", () => { closeTp(); goToJet(); }); vehList.appendChild(b);
      const o = document.createElement("option"); o.value = "vjet"; o.textContent = "Kampfjet (hingehen)"; vehGroup.appendChild(o);
    }
  }
  sel.addEventListener("pointerdown", fillVehicles); sel.addEventListener("focus", fillVehicles);
  sel.addEventListener("change", () => { const i = sel.value; sel.value = ""; sel.blur(); if (i === "vbat") summonBat(); else if (i === "vjet") goToJet(); else if (i.startsWith("v")) summonVehicle((world.userData.vehicles || [])[+i.slice(1)]); else if (i !== "") teleportTo(+i); });
  // Taste T: Menue auf/zu; Maus wird freigegeben, ohne das Begehen zu beenden
  function closeTp() { menu.hidden = true; if (typeof grabMouse === "function") grabMouse(); }   // Maus wieder fangen
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
