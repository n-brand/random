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
GDECK.gaps = GDECK.gaps || [];                                                // Wandoeffnungen der unteren Strassen { road, s0, s1, side } (gotham-unterstrasse.js)
// Wandoeffnung in der unteren Ringstrasse fuer einen Gang in Turm-Koordinaten von (a0..a1) auf der Linie b (a-Gang) bzw. umgekehrt: probe(a, b) -> Spielpunkt,
// geht in Richtung (da, db) bis in den Innenraum des Rings; liefert die Enden je Seite und traegt die Luecke ein (Seite zum Turm hin)
function wtGap(q0, q1, start, da, db) {
  if (!GDECK.roads) gdeckBuild(); const R = GDECK.roads.find(o => o.id === "ring"), P = (q, t) => da ? [start + da * t, q] : [q, start + db * t];
  const ends = [q0, q1].map(q => { for (let t = 0; t < 400; t += 0.25) { const [x, z] = WTO.toW(...P(q, t)); const n = gdeckNearOn(R, x, z); if (n && n.d < R.HW) return { t, s: n.s, x, z }; } return null; });
  const s0 = Math.min(ends[0].s, ends[1].s), s1 = Math.max(ends[0].s, ends[1].s), sm = (s0 + s1) / 2;
  let j = 1; while (j < R.pts.length - 1 && R.s[j] < sm) j++; const p = R.pts[j - 1], q = R.pts[j], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, nx = -(q[1] - p[1]) / l, nz = (q[0] - p[0]) / l;
  const side = Math.sign((WTO.cx - p[0]) * nx + (WTO.cz - p[1]) * nz) || 1;
  const gap = { road: "ring", s0, s1, side }; GDECK.gaps.push(gap);
  const out = ends.map(e => start + (da || db) * e.t); out.gap = gap; return out;
}
// Tiefgaragen (Task 5): noerdlich des Turms (-b, Seite des Kerns), TG1 Boden -5,5 / Decke -1, TG2 Boden -11 / Decke -6
WTO.tg = { a0: -35, a1: 35, b0: -100, b1: -37 };
WTO.helix = { ca: 20, cb: -78, R: 8, w: 4.6 };                                // Wendelrampe: eine Umdrehung, oben bei (ca - R, cb) Richtung -b, ca. 11 %
WTO.kernGang = { a0: -2.2, a1: 2.2 };                                         // Gang TG-Suedwand -> Kern (beide Ebenen)
WTO.tgPfeiler = [[-30, -55], [-20, -55], [-10, -55], [0, -55], [20, -55], [30, -55], [-30, -85], [-10, -85], [0, -85]];
WTO.zufahrt = { a0: -24.5, a1: -15.5, schranke: -104 };                       // 7,5 m Fahrbahn + 1,5 m Gehweg (Westseite), gerade nach Norden zur Ringstrasse
WTO.zufahrt.end = wtGap(WTO.zufahrt.a0, WTO.zufahrt.a1, WTO.tg.b0, 0, -1);
// Geheimer Stock (Task 6): Halle unter dem Turm (Boden -8, Decke -0,3 unter der Lobby-Platte), Kern-Tuer in der Nordwand; Gang nach Osten (+a) zur
// unteren Ringstrasse, 7 m breit, steigt gleichmaessig von -8 auf -5,5, endet an einer getarnten Wandplatte in der Ringwand
WTO.halle = { a0: -34, a1: 34, b0: -14, b1: 34, y0: -8, y1: -0.3 };
WTO.gang = { b0: 16.5, b1: 23.5 };
WTO.gang.end = wtGap(WTO.gang.b0, WTO.gang.b1, WTO.halle.a1, 1, 0);
