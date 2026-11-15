"use strict";
// Batverse – Gotham: Wayne Tower, gemeinsame Daten (Plan docs/superpowers/plans/2026-11-14-wayne-tower.md, Spec .../specs/2026-11-14-wayne-tower-design.md)
// Vor gotham-unterstrasse.js (die Wandoeffnungen GDECK.gaps muessen dort schon gelten). Turm-Koordinaten: a laengs der Karten-x, b laengs der
// Karten-z, Mitte des Turms 0/0, y relativ zur Strasse (WTO.Y = GOT.STR). Im Spiel ist alles um die Kartendrehung (manorLage.dreh) gedreht.
const WTO = (() => {
  const O = GOTHAM.orte.find(o => o.id === "wayne-tower"), [cx, cz] = GOT.toGame(O.x, O.z), t = GOTHAM.manorLage.dreh * Math.PI / 180;
  const ux = Math.cos(t), uz = -Math.sin(t);                                 // a-Achse im Spiel; b-Achse = (-uz, ux) = (sin t, cos t)
  const toW = (a, b) => [cx + a * ux - b * uz, cz + a * uz + b * ux];
  const toT = (x, z) => { const dx = x - cx, dz = z - cz; return [dx * ux + dz * uz, -dx * uz + dz * ux]; };
  const SD = { n: [0, -1], s: [0, 1], o: [1, 0], w: [-1, 0] };
  return {
    O, cx, cz, ux, uz, rot: t, Y: GOT.STR, toW, toT,
    // Rechteck in Turm-Koordinaten -> Spiel-Polygon (fuer Register und Hohlraeume)
    poly: (a0, a1, b0, b1) => [[a0, b0], [a1, b0], [a1, b1], [a0, b1]].map(([a, b]) => toW(a, b)),
    // Hoehen (Spec): Lobby 9,4 m, Geschosse 4,7 m, Ruecksprunge auf Geschossgrenzen
    lv: { lobby: 0, g: k => 9.4 + 4.7 * (k - 1), dach: 258.5, tg1: -5.5, tg2: -11, geheim: -8, N: 52 },
    // Stufen (halbe Breite, von, bis): Schaft 70 / 56 / 44 m, Krone 32 m bis 300, Antenne bis 320
    tiers: [{ h: 35, y0: 9.4, y1: 122.2 }, { h: 28, y0: 122.2, y1: 202.1 }, { h: 22, y0: 202.1, y1: 258.5 }],
    krone: { h: 16, y1: 300, antenne: 320 },
    vorplatz: O.vorplatz ? { dir: SD[O.vorplatz.seite], tiefe: O.vorplatz.tiefe } : null,
    // Aufzugskern innen an der Nordseite (b < 0): nur dort reicht er durch alle Ruecksprunge bis aufs Dach (Stufe 3: b >= -22); Tiefgaragen ebenfalls im Norden
    kern: { a0: -4, a1: 4, b0: -22, b1: -14 },
    kernTuer: { w: 2.4, h: 3 },                                               // Aufzugstuer in der Lobby (+b-Seite des Kerns)
    eingang: { w: 14, h: 7.5 },                                               // Eingang in der Mitte der Vorplatzseite
  };
})();
if (typeof GDECK !== "undefined") GDECK.gaps = GDECK.gaps || [];             // Wandoeffnungen der unteren Strassen { road, s0, s1, side } (Task 5/6)
