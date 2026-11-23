// Batverse – Gotham: Casino (seit 2026-11-23 Casino v2, siehe unten; urspruenglich Nicolas 2026-11-16 "ein Casino mit der Aufschrift Casino - ueberleg dir was und ueberrasch mich")
// Klassisches Skript nach gotham-bus.js. Steht auf der frueheren Baustelle BS-02 (Uptown, 60 x 50 m; GBST.skip). Art-deco-Bau in Schwarz und Gold:
// Flachdach mit schlichter Bruestung, senkrechtes Neonschild C-A-S-I-N-O an der Ecke (Buchstaben leuchten nacheinander auf, dann blinkt alles),
// Vordach mit Lauflicht-Gluehbirnen und Schriftzug CASINO, roter Teppich mit Messingpfosten, zwei goldene Wuerfel auf Saeulen,
// nachts zwei kreisende Suchscheinwerfer in den Himmel.
"use strict";
const CAS = { done: false, anim: null };
// Seit 2026-11-23 steht hier Casino v2 (Nicolas: "ersetze das Casino mit Casino v2"; Bau in casino-v2.js, wie in der Werkstatt): Halle 58 x 44 m, 5,5 m hoch, 2 m hinter der Mitte des
// Bauplatzes BS-02 (60 x 50 m; vorne 5 m Vorplatz mit Vordach), Eingang zur Strasse, Dach mit Bruestung, Vorplatz aus Granit. Der alte Art-deco-Bau (Neonschild, zwei Etagen, Tresor) ist entfernt.
function* casinoGen() {
  while (!GSTR.done) yield "wait";
  while (typeof buildCasino2 !== "function") yield "wait";
  const b = gbstList().find(q => q.id === "BS-02"); if (!b) return;
  const F = gbstFrame(b), front = gbstGate(b), Y = GOT.STR;
  const sides = gbstSides(F, 0), sd = sides[front], A = F.at(sd[0], sd[1]), Bp = F.at(sd[2], sd[3]), W = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
  const D = front % 2 === 0 ? F.L2 : F.L1, cx0 = (A[0] + Bp[0]) / 2, cz0 = (A[1] + Bp[1]) / 2, [mx, mz] = F.at(F.L1 / 2, F.L2 / 2), inx = mx - cx0, inz = mz - cz0, il = Math.hypot(inx, inz), vx = inx / il, vz = inz / il;
  const C = { x: cx0 + vx * (D / 2 + 2), z: cz0 + vz * (D / 2 + 2), y: Y, rot: Math.atan2(vx, vz), W: Math.min(58, W - 2), D: Math.min(44, D - 4), H: 5.5, g: null };   // lokal +z = ins Grundstueck
  const g = buildCasino2(C, { dach: true, platz: { w: W - 1, d: D - 1, dz: -2 } }); CAS.c2 = C;
  const cr = Math.cos(C.rot), sr = Math.sin(C.rot), P = (x, z) => [C.x + x * cr + z * sr, C.z - x * sr + z * cr];
  bautAdd({ id: "GO-CASINO", name: "Casino", art: "Gebäude", poly: [P(-C.W / 2, -C.D / 2), P(C.W / 2, -C.D / 2), P(C.W / 2, C.D / 2), P(-C.W / 2, C.D / 2)], y0: Y - 1, y1: Y + C.H + 2, info: "Uptown · Casino v2 (Automatenfeld, Pit, High Limit, Kasse, Bar) · früher Baustelle BS-02" });
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (CAS.done || TILES.startup) return false;
  if (!this.gen) this.gen = casinoGen(); const r = this.gen.next(); if (r.done) { CAS.done = true; this.gen = null; } return false; } });
// je Bild (schleife.js): Neonbuchstaben, Lauflicht, Wuerfel, Suchscheinwerfer; nur wenn die Kamera naeher als 1,5 km ist
function casinoStep() {
  const A = CAS.anim; if (!A) return; const p = camera.position, gp = A.g.position; if (Math.abs(p.x - gp.x) > 1500 || Math.abs(p.z - gp.z) > 1500) return;
  const t = (performance.now() - A.t0) / 1000, n = typeof night === "number" ? night : 0;
  // Buchstaben: 0-3 s nacheinander an, 3-4,2 s blinken, dann alle an bis 6 s
  const ph = t % 6; A.letters.forEach((m, i) => { const on = ph < 3 ? ph > i * 0.45 : ph < 4.2 ? Math.floor(ph * 6) % 2 === 0 : true; m.color.setScalar(on ? 1 : 0.18); });
  A.bulbs.offset.x = -(t * 2) % 1;
  const V = CAS.vault; if (V) { V.a += ((V.open ? V.max || 1.75 : 0) - V.a) * 0.06; V.piv.rotation.y = V.a; }
  A.dice.forEach((d, i) => { d.rotation.y = t * (0.5 + i * 0.2); d.rotation.x = 0.6 + Math.sin(t * 0.7 + i) * 0.2; });
  A.glass.emissiveIntensity = 0.8 * n;   // tagsueber 0 (sonst wirkt das Glas braun)
  A.beamM.opacity = 0.08 * n; A.beams.forEach(b => { b.visible = n > 0.05; b.rotation.y = t * 0.4 + b.userData.ph; });
}

// ---- Personal als Spielfiguren (F4 Teil 1, "Ja, weiter" 2026-11-19): figurPersonal(parent, [[x, y, z, Drehung, Art], ...]) stellt Figuren (js/spieler/figur.js, laedt spaeter: wartet
// darauf) in lokalen Koordinaten auf; sie atmen und drehen ab und zu den Kopf (FIGUREN mit Tempo 0, figurStep). Arten: croupier, kasse, polizei, wache.
const FIG_PERSONAL = {
  croupier: [{ oberteil: 0x111214, hose: 0x111214, schuhe: 0x0b0b0c, haar: 0x2a1a10, frisur: 0, schulter: 1.05 }, { haut: 0xd8a880, oberteil: 0x111214, hose: 0x111214, haar: 0xb03a20, frisur: 1, schulter: 0.9, groesse: 0.97 }, { haut: 0x8a5a3a, oberteil: 0x111214, hose: 0x111214, haar: 0x1a1a1a, frisur: 2 }],
  kasse: [{ oberteil: 0x6a1420, hose: 0x111214, haar: 0x3a2414, frisur: 1, schulter: 0.9, groesse: 0.96 }, { haut: 0xc68a60, oberteil: 0x6a1420, hose: 0x111214, haar: 0x0e0a08, frisur: 0 }],
  polizei: [{ oberteil: 0x1b2c4f, hose: 0x1b2c4f, schuhe: 0x0b0b0c, haar: 0x2a1a10, frisur: 0, schulter: 1.12 }, { haut: 0xb07850, oberteil: 0x1b2c4f, hose: 0x1b2c4f, schuhe: 0x0b0b0c, haar: 0x0e0a08, frisur: 3, bart: true, schulter: 1.15 }],
};
function figurPersonal(parent, liste) { if (typeof buildFigur !== "function" || typeof FIGUREN === "undefined") return setTimeout(() => figurPersonal(parent, liste), 500);
  liste.forEach(([x, y, z, ry, art], i) => { const V = FIG_PERSONAL[art] || FIG_PERSONAL.croupier, f = buildFigur(V[i % V.length]); f.position.set(x, y, z); f.rotation.y = ry; f.userData.keep = true; f.name = "Personal " + art; parent.add(f);
    f.userData.phase = Math.random() * 6; FIGUREN.push({ g: f, tempo: 0, personal: true }); }); }
