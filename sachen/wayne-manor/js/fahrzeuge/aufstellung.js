// Wayne Manor 3D – Fahrzeuge: Aufstellung in der Welt (Garage, Batcave, Hauptstrasse, Rondell)
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Getrennt von modelle.js (Nicolas 2026-11-12, T5), damit die Werkstatt (werkstatt/) die Modelle ohne die Welt laden kann.
"use strict";
{
  const bays = world.userData.bays, gy = GY + HILL;
  CAR = addVehicle(SPEC_TUMBLER, buildTumbler(0x16181b, 0x0d0e10), bays[1].x, bays[1].z, gy, bays[1].h, "Tumbler schwarz (Garage Platz 1)", 0x16181b);
  addVehicle(SPEC_GCLASS, buildGClass(0x141a22), bays[2].x, bays[2].z, gy, bays[2].h, "Mercedes-Benz G-Klasse (Garage Platz 2)", 0x141a22);   // Nicolas 2026-11-09, Front zur Fahrgasse (wie der Tumbler)
  addVehicle(SPEC_NACHTFALKE, buildNachtfalke(), bays[5].x, bays[5].z, gy, bays[5].h, "Nachtfalke (Garage Platz 5)", 0x0f1012);   // Nicolas 2026-11-09, Front zur Fahrgasse
  addVehicle(SPEC_AVENTADOR, buildAventador(), bays[8].x, bays[8].z, gy, bays[8].h, "Aventador LP 700-4 (Garage Platz 8)", 0xe07012);
  addVehicle(SPEC_DELOREAN, buildDelorean(), bays[3].x, bays[3].z, gy, bays[3].h, "DeLorean Zeitmaschine (Garage Platz 3)", 0xc4c7c9);   // Nicolas 2026-11-12: klappt die Raeder ein und schwebt (H)   // Nicolas 2026-11-09, Front zur Fahrgasse
  { const S = MAIN.samples, p = S[Math.max(0, MAIN_J[2] | 0) - 40] || S[0], q = S[Math.max(0, (MAIN_J[2] | 0) - 36)] || S[1], h = Math.atan2(-(q[0] - p[0]), -(q[1] - p[1])), ox = Math.cos(h) * 7, oz = -Math.sin(h) * 7;   // Nicolas 2026-11-10: am Strassenrand vor der Kreuzung
    addVehicle(SPEC_POLICE, buildPolice(), p[0] + ox, p[1] + oz, terrainH(p[0] + ox, p[1] + oz), h, "Gotham Police (Hauptstrasse)", 0xeef0f2); }
  { const S = MAIN.samples, p = S[Math.max(0, (MAIN_J[2] | 0) - 58)] || S[0], q = S[Math.max(0, (MAIN_J[2] | 0) - 54)] || S[1], h = Math.atan2(-(q[0] - p[0]), -(q[1] - p[1])), ox = Math.cos(h) * 7, oz = -Math.sin(h) * 7;   // Nicolas 2026-11-10: Taxi hinter dem Polizeiauto am Strassenrand
    addVehicle(SPEC_TAXI, buildTaxi(), p[0] + ox, p[1] + oz, terrainH(p[0] + ox, p[1] + oz), h, "Gotham Taxi (Hauptstrasse)", 0xf2c218); }
  // Gotham Fire Department (Nicolas 2026-11-12) am Strassenrand der Hauptstrasse, Richtung Suedwesten hintereinander
  for (const [i, spec, b, lbl, col] of [[90, SPEC_FIRE_ENGINE, () => buildFireTruck("engine"), "Gotham Fire Engine (Hauptstrasse)", 0xb3121a], [108, SPEC_FIRE_LADDER, () => buildFireTruck("ladder"), "Gotham Fire Ladder (Hauptstrasse)", 0xb3121a], [124, SPEC_FIRE_CHIEF, buildFireChief, "Gotham Fire Chief (Hauptstrasse)", 0xb3121a], [140, SPEC_FIRE_CRANE, buildFireCrane, "Gotham Fire Crane (Hauptstrasse)", 0xb3121a],
    [158, SPEC_TOW, buildTowTruck, "Gotham Towing (Hauptstrasse)", 0xf2b705], [176, SPEC_BUS, buildBus, "Gotham Transit Bus (Hauptstrasse)", 0x1f4f8f], [198, SPEC_HAUL, buildHaulTruck, "Gotham Construction Grossmuldenkipper (Hauptstrasse)", 0xe8a80c]]) {
    const S = MAIN.samples, p = S[Math.max(0, (MAIN_J[2] | 0) - i)] || S[0], q = S[Math.max(0, (MAIN_J[2] | 0) - i + 4)] || S[1], h = Math.atan2(-(q[0] - p[0]), -(q[1] - p[1])), ox = Math.cos(h) * 7.5, oz = -Math.sin(h) * 7.5;
    addVehicle(spec, b(), p[0] + ox, p[1] + oz, terrainH(p[0] + ox, p[1] + oz), h, lbl, col); }
  { const x = -150, z = 33; addVehicle(SPEC_TANK, buildTank(), x, z, terrainH(x, z), Math.PI / 2, "Panzer (Kiesweg West)", 0x4d5a36); }   // Nicolas 2026-11-10, am Kiesweg zum Westtor, Bug nach Westen
  addVehicle(SPEC_SPECTRE, buildSpectre(), RON.x + 10, RON.z, HILL, Math.PI, "Rolls-Royce Spectre (Rondell)", 0xd2aa3c);   // Nicolas 2026-11-10 (statt Cullinan), auf dem Rondell vor dem Haupteingang
  { const b = bays[4], q = (k) => [b.x + Math.cos(b.h) * k, b.z - Math.sin(b.h) * k];   // Nicolas 2026-11-10: beide Motorraeder nebeneinander auf Platz 4, Front zur Fahrgasse
    const [x1, z1] = q(-0.8), [x2, z2] = q(0.8);
    addVehicle(SPEC_STREETFIGHTER, buildStreetfighter(), x1, z1, gy, b.h, "Boxer-Streetfighter (Garage Platz 4)", 0x1f6fd8);
    addVehicle(SPEC_BIKE, buildBike(0xb0141e), x2, z2, gy, b.h, "Motorrad rot (Garage Platz 4)", 0xb0141e); }   // vorher Batcave-Drehscheibe Feld 3
  for (const [no, col, nm] of [[9, 0x55585e, "grau"]])   // Nicolas 2026-11-10: nur noch der graue (rot, blau, silber, dunkelgruen entfernt)
    addVehicle(SPEC_ROLLS, buildRolls(col), bays[no].x, bays[no].z, gy, bays[no].h, "Rolls-Royce " + nm + " (Garage Platz " + no + ")", col);   // Front zur Fahrgasse (-z), Heck am hinteren Platzrand (6,1 m lang)
  // Drehende Tiefgarage (Batcave, Nicolas 2026-11-08): nur noch der schwarze Tumbler auf Feld 0, schaut nach aussen (rotes Motorrad seit 2026-11-10 in der Garage)
  const tt = world.userData.turntable, rr = 60 * CAVE_SC, ttPos = k => { const ang = (k + 0.5) / 6 * Math.PI * 2; return [tt.position.x + Math.cos(ang) * rr * 0.55, tt.position.z + Math.sin(ang) * rr * 0.55, Math.atan2(-Math.cos(ang), -Math.sin(ang))]; };
  { const [x, z, h] = ttPos(0); addVehicle(SPEC_TUMBLER, buildTumbler(0x16181b, 0x0d0e10), x, z, LY, h, "Tumbler schwarz (Batcave Drehscheibe)", 0x16181b); }
  // Versteck hinter der getarnten Felswand (frueher Geheimgang zum Autoaufzug, Nicolas 2026-11-08): schwarzer Tumbler, Bug zur Felswand
  addVehicle(SPEC_TUMBLER, buildTumbler(0x0e0f12, 0x08090b), -47.5, 36.8, LY, 0, "Tumbler schwarz (Versteck hinter der Felswand)", 0x0e0f12);
  // Batpod (schwarz) in der Batcave vor dem Batcomputer, Front nach Osten Richtung Hoehle
  addVehicle(SPEC_BATPOD, buildBatpod(), -49.5, -13, LY, -Math.PI / 2, "Batpod (Batcave beim Batcomputer)", 0x111214);
  // Concept Cars (Nicolas 2026-11-09) nebeneinander im noerdlichen Ausbau vor den Vitrinen, Front nach Sueden zur Halle
  addVehicle(SPEC_GEMINI, buildGemini(), -45, -21.5, LY, Math.PI, "Gemini Concept GT (Batcave)", 0x161a22);
  addVehicle(SPEC_CHATGPT, buildChatGPT(), -41, -21.5, LY, Math.PI, "ChatGPT GPT-6 Concept GT (Batcave)", 0xd7e0e8);
  addVehicle(SPEC_DEEPSEEK, buildDeepSeek(), -37, -21.5, LY, Math.PI, "DeepSeek Concept Car (Batcave)", 0x0a1628);
  world.userData.vehicles = VEH;
  world.userData.car = { leave: () => VEH.forEach(v => v.leave()) };
}
