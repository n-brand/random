"use strict";
// Gebaeude-IDs des Anwesens und der Hoehle (Nicolas 2026-11-14, "alle Gebaeude bekommen eine ID"): Grundrisse aus den vorhandenen
// Umrissen, Hoehen in Endlage (Plateau +HILL). Raeume im Haus bekommen keine eigene ID, ausser dem Observatorium als eigenem Aufbau.
// Torhaus: in buildGate (aussen/einfahrtstor.js), Bruecken: gotham-bruecken.js.
{
  const R = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], RR = (o, m = 0) => R(o.x0 - m, o.x1 + m, o.z0 - m, o.z1 + m);
  const RP = (a, b) => { const o = rectW(a, b); return RR(o); };
  const circ = (cx, cz, r, n = 24) => Array.from({ length: n }, (_, k) => [cx + Math.cos(k / n * Math.PI * 2) * r, cz + Math.sin(k / n * Math.PI * 2) * r]);
  const C = (px, py) => caveMp(px, py), CP = pxs => pxs.map(([px, py]) => C(px, py));
  const top2 = TF2 + FLOOR_H;
  // Haus (samt Tuermen, Dachaufbauten) und Observatorium (ueber dem Theatre, Kuppel auf dem Dach)
  bautAdd({ id: "WM-HAUS", name: "Wayne Manor", art: "Haus", poly: HOUSE, y0: HILL - 0.3, y1: HILL + top2 + 2 });
  bautAdd({ id: "WM-OBSERVATORIUM", name: "Observatorium", art: "Aufbau", poly: R(THEATRE.x0, THEATRE.x1, Math.min(THEATRE.z0, THEATRE_DIV), Math.max(THEATRE.z0, THEATRE_DIV)), y0: HILL + TF2 - 0.5, y1: HILL + top2 + 8 });
  // Veranda und Poolhaus (gleiche Rechnung wie aussenanlage.js)
  { const [vx0, vz1] = mp(642, 705), [vx1, vz0] = mp(688, 862); bautAdd({ id: "WM-VERANDA", name: "Veranda", art: "Veranda", poly: RP([vx0, vz0], [vx1, vz1]), y0: HILL, y1: HILL + 4.2 }); }
  { const [hx0, hz1] = mp(58, 975), [hx1, hz0] = mp(83, 1015);
    const ax0 = Math.min(hx0, hx1), ax1 = Math.max(hx0, hx1), az0 = Math.max(Math.min(hz0, hz1), POOL.z1 + 1.8), az1 = Math.max(hz0, hz1);
    bautAdd({ id: "WM-POOLHAUS", name: "Poolhaus", art: "Poolhaus", poly: R(ax0, ax1, az0, az1), y0: HILL, y1: HILL + 4 }); }
  // Unter der Erde
  bautAdd({ id: "WM-TIEFGARAGE", name: "Tiefgarage", art: "Garage", poly: GARAGE, y0: HILL + GY, y1: HILL - 0.5 });
  bautAdd({ id: "WM-AUTOAUFZUG", name: "Autoaufzug", art: "Aufzug", poly: RR(CSH), y0: LY, y1: HILL + 0.5 });
  bautAdd({ id: "WM-SILO", name: "Flugzeug-Silo", art: "Silo", poly: R(SILO.x - 15, SILO.x + 15, SILO.z - 15, SILO.z + 15), y0: UY, y1: terrainH(SILO.x, SILO.z) + 1 });
  // Hangars der oberen Hoehle (Flaechen wie die gruene Toenung in hoehle-oben.js; der westliche mit der Erweiterung HGX)
  const hA = CP([[300, 275], [285, 290], [255, 320], [230, 360], [215, 400], [215, 437], [262, 440], [300, 425], [326, 390], [335, 345], [320, 300]]);
  const hB = CP([[550, 320], [575, 335], [600, 370], [610, 410], [622, 452], [590, 452], [565, 420], [548, 372]]);
  const cx = P => P.reduce((s, p) => s + p[0], 0) / P.length, [hW, hE] = cx(hA) < cx(hB) ? [hA, hB] : [hB, hA];
  bautAdd({ id: "WM-HANGAR-WEST", name: "Hangar West", art: "Hangar", poly: hW, y0: UY, y1: UY + UH + 3 });
  bautAdd({ id: "WM-HANGAR-WEST", name: "Hangar West", art: "Hangar", poly: RR(HGX), y0: UY, y1: UY + UH + 3 });
  bautAdd({ id: "WM-HANGAR-OST", name: "Hangar Ost", art: "Hangar", poly: hE, y0: UY, y1: UY + UH });
  { const [rx, rz] = C(382.5, 422.5); bautAdd({ id: "WM-RD-ARMORY", name: "Research & Development / Armory", art: "Raum", poly: circ(rx, rz, 60 * CAVE_SC), y0: UY, y1: UY + UH }); }
  bautAdd({ id: "WM-VORRAUM", name: "Vorraum (Hangartor)", art: "Raum", poly: R(-61, -44, 13.5, 25.5), y0: UY, y1: UY + UH });
  bautAdd({ id: "WM-BATCOMPUTER", name: "Batcomputer", art: "Anlage", poly: R(-61, -52.3, -14, 2), y0: LY, y1: LY + LH });
}
