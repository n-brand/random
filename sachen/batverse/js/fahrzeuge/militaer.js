// Militaerfahrzeuge (Nicolas 2026-11-18, N52, zu Phase 6): Kommandofahrzeug und Sanitaetsfahrzeug Piranha I, Panzerjaeger 90 (Piranha I mit Lenkwaffen-Turm),
// geschuetztes Mannschaftstransportfahrzeug Duro IIIP, Transporthelikopter Cougar, leichter Transport- und Schulungshelikopter. Eigene, vereinfachte Modelle in Oliv.
// Ueberarbeitet 2026-11-19 (Nicolas: "warum sieht der Panzer so viel besser aus" -> "Ja, ueberarbeiten"): gleicher Stil wie buildTank – facettierte Materialien
// (flatShading), dunklere zweite Farbe fuer Anbauteile, Wanne als Loft aus Querschnitten, Schweissnaehte, Schrauben, Gummilappen, Staukisten, Werkzeug, Lichter mit
// Schutzbuegeln, Abschlepphaken, Winkelspiegel, Luken, Radnaben mit Muttern; Hubschrauber als eigene Modelle (vorher umgefaerbter Polizei-Helikopter).
// Spiel und Werkstatt, nach fahrzeuge/modelle.js und fahrzeuge/heli.js (flyAdd). Radfahrzeuge: build*/SPEC_* wie die anderen (Werkstatt-Auswahl, Laden
// Gotham Defense Supply im Handy); Hubschrauber: FLYS (Werkstatt neben dem Landeplatz; Standort im Spiel noch offen, OFFENE-FRAGEN 52). Vorne = -z.
const MIL_OLIV = 0x4b5a3a, MIL_DUNKEL = 0x262a20;
function milMat() { const F = { flatShading: true };
  return { oliv: M(MIL_OLIV, { roughness: 0.8, metalness: 0.15, ...F }), oliv2: M(new THREE.Color(MIL_OLIV).multiplyScalar(0.8).getHex(), { roughness: 0.85, metalness: 0.15, ...F }),
    dunkel: M(MIL_DUNKEL, { roughness: 0.85, ...F }), stahl: M(0x5a5f63, { metalness: 0.6, roughness: 0.5, ...F }), gummi: M(0x161616, { roughness: 0.95 }), glas: M(0x10161c, { metalness: 0.7, roughness: 0.1 }),
    reifen: M(0x161616, { roughness: 0.92 }), felge: M(0x3c4630, { roughness: 0.7, metalness: 0.2, ...F }), holz: M(0x6b4a2a, { roughness: 0.9 }), plane: M(0x5b5a3e, { roughness: 1 }) }; }
const milCyl = (g, r0, r1, len, m, x, y, z, ax = "y", seg = 12) => { const geo = new THREE.CylinderGeometry(r0, r1, len, seg); if (ax === "x") geo.rotateZ(Math.PI / 2); else if (ax === "z") geo.rotateX(Math.PI / 2); return meshIn(g, geo, m, x, y, z); };
// Radnabe mit Scheibe, 8 Muttern und Deckel (dreht mit dem Rad: w.spin)
function milNabe(w, wd, K) { const s = w.spin, r = w.r, sd = Math.sign(w.piv.position.x) || 1, X = sd * (wd / 2 + 0.012);
  milCyl(s, r * 0.5, r * 0.56, 0.05, K.felge, X, 0, 0, "x", 18); milCyl(s, r * 0.17, r * 0.21, 0.1, K.stahl, X + sd * 0.03, 0, 0, "x", 10);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; milCyl(s, 0.022, 0.022, 0.05, K.stahl, X + sd * 0.03, Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34, "x", 6); } }
// Licht mit Gitter-Schutzbuegel (Front -z bzw. Heck +z: dir -1 / +1)
function milLicht(g, K, x, y, z, dir, m, w = 0.26, h = 0.16) { boxAt(g, w + 0.08, h + 0.08, 0.16, K.dunkel, x, y, z); boxAt(g, w, h, 0.02, m, x, y, z + dir * 0.085);
  for (const dx of [-1, 0, 1]) boxAt(g, 0.025, h + 0.14, 0.025, K.stahl, x + dx * (w / 2 + 0.03), y, z + dir * 0.15); boxAt(g, w + 0.12, 0.025, 0.025, K.stahl, x, y + h / 2 + 0.07, z + dir * 0.15); }
// Abschlepphaken (Oese mit Bolzen)
function milHaken(g, K, x, y, z) { boxAt(g, 0.08, 0.2, 0.16, K.stahl, x, y, z); boxAt(g, 0.22, 0.06, 0.16, K.stahl, x, y - 0.1, z); milCyl(g, 0.03, 0.03, 0.26, K.dunkel, x, y + 0.02, z, "x", 8); }
// Kanister in Halterung (seitlich), Kiste mit Verschluessen
function milKanister(g, K, x, y, z, sd) { boxAt(g, 0.16, 0.46, 0.34, K.oliv2, x, y, z); boxAt(g, 0.17, 0.04, 0.36, K.stahl, x, y - 0.12, z); boxAt(g, 0.06, 0.05, 0.1, K.dunkel, x - sd * 0.02, y + 0.25, z - 0.08); }
function milKiste(g, K, x0, x1, y0, y1, z0, z1, sd) { sideBox(g, x0, x1, y0, y1, z0, z1, K.oliv2); sideBox(g, x0 - sd * 0.01, x1 + sd * 0.01, y1 - 0.025, y1 + 0.005, z0 - 0.01, z1 + 0.01, K.oliv);
  const xa = Math.abs(x0) > Math.abs(x1) ? x0 : x1; for (const t of [0.25, 0.75]) boxAt(g, 0.03, 0.08, 0.06, K.stahl, xa + sd * 0.015, y1 - 0.08, z0 + (z1 - z0) * t); }
// Antenne mit Fuss und Feder
function milAntenne(g, K, x, y, z, h) { milCyl(g, 0.06, 0.07, 0.08, K.dunkel, x, y + 0.04, z); milCyl(g, 0.03, 0.03, 0.18, K.gummi, x, y + 0.17, z, "y", 8); milCyl(g, 0.008, 0.014, h, K.dunkel, x, y + 0.26 + h / 2, z, "y", 6); }
// Nebelwerfer-Buendel (n Rohre, schraeg nach vorne aussen)
function milNebel(g, K, x, y, z, sd, n = 3) { const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.set(0.55, sd * 0.35, 0); g.add(grp); boxAt(grp, 0.32, 0.06, 0.22, K.oliv2, 0, -0.06, 0);
  for (let k = 0; k < n; k++) { const t = milCyl(grp, 0.045, 0.05, 0.26, K.dunkel, (k - (n - 1) / 2) * 0.1, 0.07, -0.02, "z", 10); t.rotation.x = Math.PI / 2 - 0.9; } }
// Schild-Material (Schrift auf transparentem Grund)
function milSchrift(text, col = "#1a1d16", w = 512, h = 96, font = "bold 64px Arial") { return new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(w, h, (c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = col; c.font = font; c.textAlign = "center"; c.fillText(text, W / 2, H * 0.72); }) }); }
function milKreuzSchweiz() { return new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (c) => { c.fillStyle = "#c8102e"; c.fillRect(0, 0, 64, 64); c.fillStyle = "#fff"; c.fillRect(26, 12, 12, 40); c.fillRect(12, 26, 40, 12); }) }); }

// ---- Piranha I 8x8 (Radschuetzenpanzer): Wanne mit langer Bugplatte (Fahrer vorne links, Motor vorne rechts mit Lueftungsgittern), schmale Unterwanne zwischen den Raedern,
// Oberwanne ueber den Raedern auskragend mit schraegen Seiten, Sichtbloecke und Schiessluken, zwei Hecktueren, zwei Schiffsschrauben-Tunnel (schwimmfaehig), vier Achsen
// (vordere zwei lenken). v = "kommando" | "sanitaet" | "pzj90". 6,3 x 2,6 m, Dach 2,0 m.
function buildPiranha(v = "kommando") {
  const g = new THREE.Group(), K = milMat(), { oliv, oliv2, dunkel, stahl, gummi, glas } = K, weiss = M(0xeeeeea, { roughness: 0.6 }), rot = M(0xd0202a, { roughness: 0.5 });
  const yT = tabF([[3.15, 0.98], [2.95, 1.12], [1.5, 2.0], [-2.95, 2.0], [-3.15, 1.86]]), yB = tabF([[3.15, 0.8], [2.7, 0.42], [-2.85, 0.42], [-3.15, 0.62]]), wF = tabF([[3.15, 0.9], [2.7, 1.0], [-3.15, 1.0]]);
  const sec = f => { const yb = yB(f), yt = yT(f), w = wF(f), c = y => Math.min(yt, Math.max(yb, y)); return [[0, yb], [0.72 * w, yb], [0.88 * w, c(0.98)], [1.25 * w, c(1.15)], [1.25 * w, c(1.55)], [1.02 * w, yt], [0, yt]]; };
  loftIn(g, [3.15, 3.05, 2.95, 2.9, 2.7, 2.45, 2.24, 1.9, 1.5, 0.5, -0.5, -1.5, -2.85, -2.95, -3.05, -3.15].map(f => [f, sec(f)]), oliv);                 // Wanne
  // Bugplatte: Punkt auf der Flaeche bei f (Abstand d nach aussen), Neigung 0,545 rad
  const GA = 0.545, gl = (f, d = 0) => [1.12 + (2.95 - f) / 1.45 * 0.88 + Math.cos(GA) * d, -f - Math.sin(GA) * d];
  const aufBug = (geo, m, x, f, d) => { const [y, z] = gl(f, d); return meshIn(g, geo, m, x, y, z, -GA); };
  aufBug(new THREE.BoxGeometry(2.3, 0.025, 0.05), oliv2, 0, 2.93, 0.01);                                                                          // Schweissnaht Bugkante
  { aufBug(new THREE.BoxGeometry(2.0, 0.05, 0.62), oliv2, 0, 2.62, 0.04); for (let k = 0; k < 5; k++) aufBug(new THREE.BoxGeometry(0.05, 0.05, 0.6), oliv, -0.8 + k * 0.4, 2.62, 0.08); }   // Schwallblech (geklappt) mit Rippen
  // Motordeck rechts vorne: Lueftungsgitter (Lamellen), Fahrerluke links mit drei Winkelspiegeln
  aufBug(new THREE.BoxGeometry(0.9, 0.04, 0.7), dunkel, 0.55, 1.95, 0.02); for (let k = 0; k < 8; k++) aufBug(new THREE.BoxGeometry(0.86, 0.03, 0.035), stahl, 0.55, 1.68 + k * 0.077, 0.05);
  { const [y, z] = gl(1.72, 0.04); const h = meshIn(g, new THREE.CylinderGeometry(0.3, 0.32, 0.08, 16), oliv2, -0.55, y, z, -GA); meshIn(g, new THREE.BoxGeometry(0.1, 0.06, 0.08), stahl, -0.55, y + 0.05, z + 0.25, -GA); }
  for (const dx of [-0.22, 0, 0.22]) aufBug(new THREE.BoxGeometry(0.14, 0.09, 0.08), glas, -0.55 + dx, 2.08, 0.05);
  // Lichter vorne mit Schutzbuegeln, Abschlepphaken, Bugplatte unten mit Naht
  for (const sd of [-1, 1]) { milLicht(g, K, sd * 0.88, 1.2, -2.86, -1, mat.glow, 0.22, 0.12); boxAt(g, 0.12, 0.07, 0.04, M(0xffa020, { emissive: 0x803000 }), sd * 1.08, 1.2, -2.84); milHaken(g, K, sd * 0.55, 0.86, -3.2); }
  boxIn(g, -1.0, 1.0, 0.79, 0.82, -3.17, -3.12, oliv2);
  // Seiten: Kantenleiste ueber den Raedern, Sichtbloecke und Schiessluken im Kampfraum, Staukiste, Kanister, Gummilappen, Werkzeug, Auspuff rechts
  const oben = (sd, t) => [sd * (1.25 - 0.23 * t + 0.015), 1.55 + 0.45 * t];
  for (const sd of [-1, 1]) {
    sideBox(g, sd * 1.24, sd * 1.29, 1.12, 1.17, -2.24, 2.85, oliv2); sideBox(g, sd * 1.24, sd * 1.28, 1.53, 1.57, -2.24, 2.95, oliv2);
    for (const z of [0.25, 1.05, 1.85]) { const [x, y] = oben(sd, 0.5); const f = boxAt(g, 0.05, 0.2, 0.3, oliv2, x, y, z); f.rotation.z = sd * 0.47; const s = boxAt(g, 0.03, 0.13, 0.22, glas, x + sd * 0.02, y, z); s.rotation.z = sd * 0.47; }
    for (const z of [0.65, 1.45, 2.25]) { milCyl(g, 0.075, 0.08, 0.05, oliv2, sd * 1.27, 1.36, z, "x", 10); milCyl(g, 0.02, 0.02, 0.06, dunkel, sd * 1.3, 1.36, z, "x", 6); }
    milKiste(g, K, sd * 1.25, sd * 1.4, 1.2, 1.5, -1.25, -0.25, sd);
    for (const z of [2.45, 2.85]) milKanister(g, K, sd * 1.37, 1.4, z, sd);
    for (const z of [-0.42, 2.58]) sideBox(g, sd * 0.95, sd * 1.32, 0.42, 1.12, z, z + 0.03, gummi);
    { const [x, y] = oben(sd, 0.95); boxAt(g, 0.06, 0.04, 1.3, K.holz, x - sd * 0.05, y + 0.02, -0.6); boxAt(g, 0.18, 0.02, 0.26, stahl, x - sd * 0.05, y + 0.04, -1.3); boxAt(g, 0.04, 0.04, 1.4, stahl, x - sd * 0.16, y + 0.02, 0.6); }
    for (let k = 0; k < 4; k++) milCyl(g, 0.022, 0.022, 0.02, dunkel, sd * 1.295, 1.14, -1.9 + k * 1.3, "x", 6);
  }
  { milCyl(g, 0.08, 0.08, 0.9, dunkel, 1.36, 1.7, -1.2, "z", 10); const sch = boxAt(g, 0.08, 0.22, 1.0, oliv2, 1.42, 1.72, -1.2); for (let k = 0; k < 6; k++) boxAt(g, 0.09, 0.03, 0.06, dunkel, 1.43, 1.72, -1.6 + k * 0.16); }   // Auspuff mit Hitzeschild
  // Dach: Kommandantenluke mit Winkelspiegeln, zwei Dachluken hinten, Nebelwerfer, Griffstangen
  const luke = (x, z, r = 0.32) => { milCyl(g, r + 0.05, r + 0.07, 0.06, oliv2, x, 2.03, z, "y", 18); milCyl(g, r, r, 0.08, oliv, x, 2.08, z, "y", 18); boxAt(g, 0.1, 0.05, 0.08, stahl, x + r * 0.7, 2.12, z);
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.55; boxAt(g, 0.12, 0.09, 0.07, glas, x + Math.cos(a) * (r + 0.14), 2.08, z + Math.sin(a) * (r + 0.14)).rotation.y = -a + Math.PI / 2; } };
  if (v !== "sanitaet") luke(0.5, -1.15);
  for (const sd of [-1, 1]) { boxIn(g, sd > 0 ? 0.08 : -0.85, sd > 0 ? 0.85 : -0.08, 2.0, 2.05, 1.5, 2.75, oliv2); for (const z of [1.62, 2.63]) milCyl(g, 0.03, 0.03, 0.62, stahl, sd * 0.46, 2.06, z, "x", 8); boxAt(g, 0.1, 0.05, 0.14, stahl, sd * 0.46, 2.08, 2.1); }
  for (const sd of [-1, 1]) milNebel(g, K, sd * 0.86, 2.08, -1.38, sd, 3);
  for (const sd of [-1, 1]) { milCyl(g, 0.02, 0.02, 1.6, stahl, sd * 0.96, 2.08, 0.6, "z", 6); for (const z of [-0.15, 1.35]) milCyl(g, 0.015, 0.015, 0.08, stahl, sd * 0.96, 2.04, z, "y", 6); }
  // Heck: zwei Tueren mit Scharnieren, Griff und Sichtblock, Schraubentunnel mit Schraube, Ruecklichter mit Buegeln, Anhaengerkupplung, Haken
  for (const sd of [-1, 1]) { const x0 = sd * 0.06, x1 = sd * 0.95; sideBox(g, x0, x1, 0.94, 1.78, 3.15, 3.2, oliv2);
    for (const y of [1.08, 1.6]) milCyl(g, 0.04, 0.04, 0.16, stahl, sd * 0.97, y, 3.2, "y", 8); boxAt(g, 0.16, 0.04, 0.06, stahl, sd * 0.2, 1.25, 3.23); boxAt(g, 0.18, 0.12, 0.03, glas, sd * 0.5, 1.55, 3.21);
    const tun = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 20), oliv2); tun.position.set(sd * 0.62, 0.78, 3.17); g.add(tun); const sch = new THREE.Group(); sch.position.set(sd * 0.62, 0.78, 3.15); g.add(sch);
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.02), dunkel); b.position.y = 0.07; const p = new THREE.Group(); p.rotation.z = k * Math.PI * 2 / 3; p.add(b); sch.add(p); }
    milLicht(g, K, sd * 1.05, 1.62, 3.15, 1, mat.glowRed, 0.16, 0.1); milHaken(g, K, sd * 1.05, 0.78, 3.24); }
  boxAt(g, 0.22, 0.16, 0.2, stahl, 0, 0.72, 3.27); milCyl(g, 0.05, 0.05, 0.12, dunkel, 0, 0.72, 3.38, "z", 8);
  // Varianten
  if (v === "kommando") {   // Kommandofahrzeug: erhoehter Aufbau hinten, Antennen, Teleskopmast, Kabeltrommel, Zeltrolle, Klimageraet
    loftIn(g, [0.35, 0.25, -2.75, -2.9].map(f => [f, [[0, 2.0], [0.92, 2.0], [0.92, 2.42], [0.78, 2.55], [0, 2.55]]]), oliv);
    boxIn(g, -0.93, 0.93, 2.0, 2.04, -0.36, 2.92, oliv2); for (const z of [0.2, 1.4, 2.6]) for (const sd of [-1, 1]) boxAt(g, 0.04, 0.18, 0.4, oliv2, sd * 0.93, 2.25, z);
    milCyl(g, 0.12, 0.12, 2.6, K.plane, -0.98, 2.42, 1.2, "z", 10); for (const z of [0.2, 2.2]) boxAt(g, 0.06, 0.28, 0.05, stahl, -1.02, 2.38, z);
    milCyl(g, 0.07, 0.07, 2.7, stahl, 0.2, 2.62, 1.25, "z", 10); for (const z of [0.0, 1.3, 2.5]) boxAt(g, 0.2, 0.1, 0.08, dunkel, 0.2, 2.6, z); milCyl(g, 0.14, 0.14, 0.18, dunkel, 0.2, 2.62, -0.1, "z", 12);
    boxAt(g, 0.6, 0.4, 0.5, oliv2, 0.55, 2.75, 2.35); for (let k = 0; k < 5; k++) boxAt(g, 0.5, 0.03, 0.02, dunkel, 0.55, 2.65 + k * 0.06, 2.1);
    milCyl(g, 0.22, 0.22, 0.24, dunkel, 1.15, 1.82, 3.1, "x", 14); milCyl(g, 0.09, 0.09, 0.26, stahl, 1.15, 1.82, 3.1, "x", 10);
    milAntenne(g, K, -0.8, 2.55, 2.7, 2.8); milAntenne(g, K, 0.8, 2.55, 2.7, 2.4); milAntenne(g, K, -0.8, 2.05, -0.3, 2.0); milAntenne(g, K, -0.45, 2.55, 0.1, 1.2);
  } else if (v === "sanitaet") {   // Sanitaet: hoeherer Aufbau ab Fahrerplatz, Fenster mattiert, rotes Kreuz auf weissem Feld (Seiten, Heck, Dach), Blaulichter, Trittstufe
    // Aufbau (2026-11-19, Nicolas Bild: "beim Sanitaetsfahrzeug noch den oberen Teil fixen"): Seiten buendig mit der Wanne (sitzen auf der schraegen Oberwanne), Front schraeg,
    // Regenrinne, Blechfugen mit Nieten, gerahmte Milchglasfenster, Seitentuer mit Scharnieren und Griff, Klimageraet, Dachreling, Leiter, Arbeitsscheinwerfer, Blaulichter auf Sockeln
    const AS = (top) => [[0, 1.95], [1.0, 1.95], [1.18, 1.69], [1.18, Math.min(2.62, top - 0.16)], [1.05, top], [0, top]];
    loftIn(g, [[0.55, AS(2.3)], [0.15, AS(2.78)], [-3.08, AS(2.78)], [-3.15, AS(2.72)]], oliv);
    const milch = M(0xb8c4c8, { roughness: 0.3 }), blauL = M(0x2a5cff, { emissive: 0x1a40ff, emissiveIntensity: 0.6 });
    for (const sd of [-1, 1]) { const X = sd * 1.18;
      sideBox(g, X, X + sd * 0.05, 2.6, 2.65, -0.1, 3.1, oliv2);                                                                                        // Regenrinne
      for (const z of [0.95, 1.95, 2.75]) sideBox(g, X, X + sd * 0.008, 1.72, 2.6, z - 0.012, z + 0.012, dunkel);                                       // Blechfugen
      for (let k = 0; k < 12; k++) milCyl(g, 0.014, 0.014, 0.02, dunkel, X + sd * 0.01, 1.78, 0.05 + k * 0.26, "x", 6);                                   // Nietreihe
      sideBox(g, X, X + sd * 0.04, 2.12, 2.48, 0.25, 0.85, oliv2); sideBox(g, X + sd * 0.03, X + sd * 0.045, 2.16, 2.44, 0.29, 0.81, milch);               // Fenster mit Rahmen
      milCyl(g, 0.015, 0.015, 0.4, stahl, X + sd * 0.05, 2.1, 1.45, "z", 6); for (const z of [1.25, 1.65]) boxAt(g, 0.03, 0.04, 0.04, stahl, X + sd * 0.04, 2.1, z);   // Griffstange
      sideBox(g, X, X + sd * 0.25, 2.62, 2.66, 2.85, 2.95, stahl);                                                                                      // Spiegelarm hinten (Rueckfahrkamera)
      boxAt(g, 0.12, 0.1, 0.1, dunkel, X + sd * 0.25, 2.6, 2.9); boxAt(g, 0.02, 0.06, 0.06, glas, X + sd * 0.25, 2.6, 2.95); }
    { const X = 1.18; sideBox(g, X, X + 0.02, 1.75, 2.55, -0.25, 0.15, oliv2); for (const y of [1.85, 2.45]) milCyl(g, 0.03, 0.03, 0.12, stahl, X + 0.03, y, -0.27, "y", 8); boxAt(g, 0.04, 0.05, 0.16, stahl, X + 0.04, 2.1, 0.08); }   // Seitentuer rechts
    // Front schraeg: Blaulichter auf Sockeln, Arbeitsscheinwerfer, kleines Kreuz, Kante
    for (const sd of [-1, 1]) { boxAt(g, 0.3, 0.06, 0.3, dunkel, sd * 0.78, 2.81, 0.0); boxAt(g, 0.24, 0.13, 0.24, blauL, sd * 0.78, 2.905, 0.0); boxAt(g, 0.27, 0.02, 0.27, dunkel, sd * 0.78, 2.98, 0.0);
      milLicht(g, K, sd * 0.62, 2.12, -0.6, -1, mat.glow, 0.18, 0.1); }
    for (const [pw, ph, m, d] of [[0.42, 0.42, weiss, 0.006], [0.29, 0.085, rot, 0.009], [0.085, 0.29, rot, 0.009]]) { const o = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), m); o.position.set(0, 2.545 + 0.64 * d, -0.35 - 0.77 * d); o.lookAt(0, 3.185, -1.12); g.add(o); }   // kleines Kreuz auf der Schraege
    // Dach: Klimageraet mit Lamellen, Reling, Dachluke, Antenne
    boxAt(g, 0.9, 0.28, 0.7, oliv2, 0, 2.92, 2.3); for (let k = 0; k < 6; k++) boxAt(g, 0.8, 0.02, 0.025, dunkel, 0, 2.86 + k * 0.035, 1.94); boxAt(g, 0.5, 0.02, 0.5, dunkel, 0, 3.07, 2.3);
    for (const sd of [-1, 1]) { milCyl(g, 0.018, 0.018, 2.4, stahl, sd * 0.95, 2.86, 1.35, "z", 6); for (const z of [0.25, 1.35, 2.45]) milCyl(g, 0.015, 0.015, 0.08, stahl, sd * 0.95, 2.82, z, "y", 6); }
    milCyl(g, 0.3, 0.32, 0.05, oliv2, 0.4, 2.8, 0.6, "y", 16); milAntenne(g, K, -0.8, 2.78, 2.9, 1.6);
    // Heck: obere Tuerhaelften mit Fenstern und Scharnieren, Leiter rechts, Rueckfahrscheinwerfer, Trittstufe
    boxIn(g, -0.95, -0.06, 1.78, 2.6, 3.15, 3.2, oliv2); boxIn(g, 0.06, 0.95, 1.78, 2.6, 3.15, 3.2, oliv2);
    for (const sd of [-1, 1]) { sideBox(g, sd * 0.25, sd * 0.75, 2.25, 2.5, 3.2, 3.215, milch); for (const y of [2.0, 2.45]) milCyl(g, 0.035, 0.035, 0.14, stahl, sd * 0.97, y, 3.2, "y", 8); boxAt(g, 0.2, 0.1, 0.08, dunkel, sd * 0.85, 2.68, 3.2); boxAt(g, 0.16, 0.06, 0.02, mat.glow, sd * 0.85, 2.68, 3.245); }
    for (const x of [1.05, 1.25]) boxIn(g, x - 0.015, x + 0.015, 1.0, 2.75, 3.16, 3.2, stahl); for (let k = 0; k < 6; k++) boxIn(g, 1.04, 1.26, 1.1 + k * 0.28, 1.13 + k * 0.28, 3.16, 3.2, stahl);
    const kreuz = (x, y, z, ry, s = 1) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * s, 0.9 * s), weiss), c1 = new THREE.Mesh(new THREE.PlaneGeometry(0.62 * s, 0.18 * s), rot), c2 = new THREE.Mesh(new THREE.PlaneGeometry(0.18 * s, 0.62 * s), rot);
      for (const [o, d] of [[w, 0], [c1, 0.003], [c2, 0.003]]) { o.position.set(x, y, z); o.rotation.y = ry; o.translateZ(d); g.add(o); } };
    kreuz(1.186, 2.28, 1.45, Math.PI / 2); kreuz(-1.186, 2.28, 1.45, -Math.PI / 2); kreuz(0, 2.2, 3.255, 0, 0.75);
    { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), weiss); d.rotation.x = -Math.PI / 2; d.position.set(0, 2.785, 1.0); g.add(d); for (const [w, h] of [[0.62, 0.18], [0.18, 0.62]]) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), rot); o.rotation.x = -Math.PI / 2; o.position.set(0, 2.788, 1.0); g.add(o); } }
    boxIn(g, -0.6, 0.6, 0.62, 0.66, 3.2, 3.5, stahl); luke(0.5, -1.15);
  } else if (v === "pzj90") {   // Panzerjaeger 90: Turm mit Werfer auf Hebearm, zwei Lenkwaffenrohre neben dem Zielgeraet, Kommandantenluke, Nebelwerfer, Staukorb
    const t = new THREE.Group(); t.position.set(0, 2.0, 0.7); g.add(t); milCyl(t, 0.92, 0.95, 0.1, oliv2, 0, 0.05, 0, "y", 24);
    loftIn(t, [0.85, 0.75, -0.75, -0.95].map((f, i) => [f, [[0, 0.08], [i === 0 || i === 3 ? 0.55 : 0.75, 0.08], [i === 0 || i === 3 ? 0.5 : 0.72, 0.42], [i === 0 || i === 3 ? 0.4 : 0.6, 0.55], [0, 0.55]]]), oliv);
    for (let k = 0; k < 6; k++) milCyl(t, 0.022, 0.022, 0.02, dunkel, -0.6 + k * 0.24, 0.56, -0.78, "y", 6);
    const kor = boxAt(t, 1.3, 0.04, 0.5, stahl, 0, 0.12, 1.2); for (const x of [-0.64, 0.64]) boxAt(t, 0.03, 0.3, 0.5, stahl, x, 0.25, 1.2); boxAt(t, 1.3, 0.3, 0.03, stahl, 0, 0.25, 1.45); boxAt(t, 1.1, 0.22, 0.4, K.plane, 0, 0.25, 1.2);
    milCyl(t, 0.28, 0.3, 0.07, oliv2, -0.35, 0.58, 0.2, "y", 16); for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k - 1.5) * 0.6; boxAt(t, 0.1, 0.08, 0.06, glas, -0.35 + Math.cos(a) * 0.36, 0.6, 0.2 + Math.sin(a) * 0.36).rotation.y = -a + Math.PI / 2; }
    for (const sd of [-1, 1]) milNebel(t, K, sd * 0.68, 0.5, -0.55, sd, 2);
    const arm = new THREE.Group(); arm.position.set(0.3, 0.55, 0.1); t.add(arm); boxAt(arm, 0.22, 0.75, 0.32, oliv2, 0, 0.35, 0); milCyl(arm, 0.08, 0.08, 0.5, stahl, 0, 0.72, 0, "x", 10);
    const kopf = new THREE.Group(); kopf.position.set(0, 0.82, 0); arm.add(kopf); boxAt(kopf, 0.4, 0.38, 0.7, oliv, 0, 0, -0.1); boxAt(kopf, 0.3, 0.2, 0.03, glas, 0, 0.03, -0.46); boxAt(kopf, 0.36, 0.05, 0.12, oliv2, 0, 0.17, -0.5);
    for (const sx of [-0.36, 0.36]) { milCyl(kopf, 0.14, 0.14, 1.65, oliv2, sx, 0, -0.25, "z", 14); for (const z of [-0.9, -0.25, 0.4]) milCyl(kopf, 0.155, 0.155, 0.05, dunkel, sx, 0, z, "z", 14);
      milCyl(kopf, 0.15, 0.15, 0.05, oliv, sx, 0, -1.09, "z", 14); milCyl(kopf, 0.15, 0.15, 0.05, oliv, sx, 0, 0.6, "z", 14); boxAt(kopf, 0.12, 0.05, 0.08, stahl, sx, 0.15, -0.25); boxAt(kopf, Math.abs(sx) - 0.18, 0.08, 0.14, oliv2, sx / 2, 0, -0.1); }
    milCyl(kopf, 0.012, 0.012, 0.5, gummi, 0.05, -0.2, 0.25, "z", 6);
    g.userData.turm = t; milAntenne(g, K, -0.85, 2.05, 2.75, 2.0);
  }
  mergeStatic(g);
  const wheels = [[-1.12, -2.25, true], [1.12, -2.25, true], [-1.12, -1.1, true], [1.12, -1.1, true], [-1.12, 0.75, false], [1.12, 0.75, false], [-1.12, 1.9, false], [1.12, 1.9, false]].map(([x, z, f]) => addWheel(g, x, z, 0.55, 0.38, f, K.reifen, K.felge, 16, 22));
  for (const w of wheels) milNabe(w, 0.38, K);
  g.name = v === "pzj90" ? "Panzerjäger 90" : v === "sanitaet" ? "Piranha I Sanitätsfahrzeug" : "Piranha I Kommandofahrzeug"; return { g, wheels };
}
const SPEC_PIRANHA = { name: "Piranha I", wheels: [[-1.12, -2.25], [1.12, -2.25], [-1.12, -1.1], [1.12, -1.1], [-1.12, 0.75], [1.12, 0.75], [-1.12, 1.9], [1.12, 1.9]], wb: 3.6, track: 2.24, pts: [-2.6, -0.9, 0.9, 2.6], R: 1.35, circR: 1.3, enter: 4.8,
  maxN: 24, maxF: 27.8, acc: 6, steer: 0.5, jump: false, grade: 38, camD: 13, camH: 2.6, seat: [-0.55, 2.15, -1.6], bodyH: 2.8, bike: false, mass: 30, mu: 1.6,
  exits: [[-2.2, -1.2], [2.2, -1.2], [-2.2, 1.4], [2.2, 1.4], [0, -4.4], [0, 4.4]],
  msg: "Piranha I: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, Shift aussteigen" };
const SPEC_PIRANHA_K = { ...SPEC_PIRANHA, name: "Piranha I Kommandofahrzeug", msg: SPEC_PIRANHA.msg.replace("Piranha I", "Piranha I Kommandofahrzeug") };
const SPEC_PIRANHA_S = { ...SPEC_PIRANHA, name: "Piranha I Sanitätsfahrzeug", msg: SPEC_PIRANHA.msg.replace("Piranha I", "Piranha I Sanitätsfahrzeug") };
const SPEC_PZJ90 = { ...SPEC_PIRANHA, name: "Panzerjäger 90", msg: SPEC_PIRANHA.msg.replace("Piranha I", "Panzerjäger 90") };

// ---- Duro IIIP 6x6: Leiterrahmen mit sichtbaren Achsen und Blattfedern, Motorhaube mit Grill und Rammschutz, Seilwinde, gepanzerte Kabine mit schraeger geteilter
// Frontscheibe, Tueren mit Panzerglas, Trittstufen und Spiegeln, geschuetzter Mannschaftsaufbau mit kleinen Panzerfenstern, Schiessluken, Hecktuer mit Leiter,
// Dachluke mit Lafettenring, Tank, Auspuff hinter der Kabine, Reserverad, Staukoerbe. 7,0 x 2,3 x 2,9 m.
function buildDuro() {
  const g = new THREE.Group(), K = milMat(), { oliv, oliv2, dunkel, stahl, gummi, glas } = K;
  // Rahmen, Achsen, Differentiale, Blattfedern
  for (const sd of [-1, 1]) boxIn(g, sd * 0.38, sd * 0.5, 0.58, 0.82, -3.3, 3.25, dunkel); for (const z of [-2.2, -0.6, 0.4, 1.7, 3.0]) boxIn(g, -0.4, 0.4, 0.62, 0.74, z - 0.05, z + 0.05, dunkel);
  for (const z of [-2.75, 1.0, 2.4]) { milCyl(g, 0.07, 0.07, 1.7, stahl, 0, 0.52, z, "x", 10); meshIn(g, new THREE.SphereGeometry(0.19, 10, 8), dunkel, 0, 0.5, z);
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) boxAt(g, 0.08, 0.025, 1.1 - k * 0.2, stahl, sd * 0.44, 0.6 + k * 0.03, z); }
  // Stossfaenger, Seilwinde, Rammschutz, Haken
  boxIn(g, -1.15, 1.15, 0.6, 0.86, -3.75, -3.5, oliv2); milCyl(g, 0.12, 0.12, 0.7, dunkel, 0, 0.73, -3.62, "x", 12); milCyl(g, 0.13, 0.13, 0.05, stahl, -0.36, 0.73, -3.62, "x", 12); milCyl(g, 0.13, 0.13, 0.05, stahl, 0.36, 0.73, -3.62, "x", 12);
  for (const sd of [-1, 1]) { milHaken(g, K, sd * 0.85, 0.72, -3.8); for (const x of [0.25, 0.65]) boxIn(g, sd * x - 0.03, sd * x + 0.03, 0.86, 1.55, -3.66, -3.6, stahl); }
  boxIn(g, -0.75, 0.75, 1.52, 1.57, -3.66, -3.6, stahl); boxIn(g, -0.75, 0.75, 1.15, 1.2, -3.66, -3.6, stahl);
  // Motorhaube (Profil), Grill, Kotfluegel mit Lichtern, Spritzlappen
  prismIn(g, [[3.5, 0.9], [3.5, 1.5], [3.4, 1.6], [2.1, 1.7], [2.1, 0.9]], 1.5, oliv); prismIn(g, [[3.51, 1.48], [3.41, 1.6], [3.39, 1.6], [3.49, 1.48]], 1.52, oliv2);
  for (let x = -0.6; x <= 0.61; x += 0.1) boxIn(g, x - 0.025, x + 0.025, 0.98, 1.44, -3.52, -3.49, dunkel); boxIn(g, -0.68, 0.68, 0.96, 0.99, -3.52, -3.49, stahl); boxIn(g, -0.68, 0.68, 1.43, 1.46, -3.52, -3.49, stahl);
  for (let k = 0; k < 6; k++) boxIn(g, -0.5, 0.5, 1.705 + k * 0.004, 1.715 + k * 0.004, -2.95 + k * 0.12, -2.9 + k * 0.12, dunkel);
  for (const sd of [-1, 1]) { prismIn(g, [[3.4, 1.08], [3.3, 1.22], [2.2, 1.22], [2.1, 1.1], [2.1, 1.05], [3.4, 1.05]], 0.5, oliv2, sd * 1.0); milLicht(g, K, sd * 1.0, 1.36, -3.32, -1, mat.glow, 0.2, 0.16);
    boxAt(g, 0.1, 0.06, 0.04, M(0xffa020, { emissive: 0x803000 }), sd * 1.18, 1.36, -3.36); sideBox(g, sd * 0.78, sd * 1.24, 0.42, 1.05, -2.12, -2.09, gummi); }
  // Kabine (Profil): schraege Frontscheibe zweigeteilt mit Rahmen, Seitenfenster, Tuerfugen, Griffe, Trittstufen, Spiegel, Dachluke
  prismIn(g, [[2.1, 0.95], [2.1, 1.65], [1.85, 2.45], [1.75, 2.55], [0.35, 2.55], [0.35, 0.95]], 2.3, oliv);
  prismIn(g, [[2.11, 1.66], [1.86, 2.44], [1.84, 2.44], [2.09, 1.66]], 2.32, oliv2);
  { const sl = Math.atan2(0.8, 0.25); for (const sd of [-1, 1]) { const p = boxAt(g, 0.95, 0.66, 0.03, glas, sd * 0.52, 2.06, -1.97); p.rotation.x = Math.PI / 2 - sl; }
    const ps = boxAt(g, 0.08, 0.8, 0.06, oliv2, 0, 2.06, -1.98); ps.rotation.x = Math.PI / 2 - sl; const wi = boxAt(g, 0.5, 0.03, 0.03, dunkel, -0.4, 1.8, -2.06); wi.rotation.z = 0.3; }
  for (const sd of [-1, 1]) { sideBox(g, sd * 1.15, sd * 1.17, 1.85, 2.35, -1.75, -0.95, glas); sideBox(g, sd * 1.15, sd * 1.18, 1.8, 1.85, -1.8, -0.9, oliv2); sideBox(g, sd * 1.15, sd * 1.18, 2.35, 2.4, -1.8, -0.9, oliv2);
    for (const z of [-1.95, -0.72]) sideBox(g, sd * 1.15, sd * 1.165, 1.0, 2.45, z, z + 0.02, dunkel); boxAt(g, 0.05, 0.05, 0.2, stahl, sd * 1.18, 1.65, -0.95);
    for (const y of [0.5, 0.8]) sideBox(g, sd * 0.9, sd * 1.22, y - 0.02, y + 0.02, -1.7, -1.1, stahl); sideBox(g, sd * 1.18, sd * 1.22, 0.45, 0.95, -1.72, -1.68, stahl);
    milCyl(g, 0.02, 0.02, 0.5, stahl, sd * 1.4, 2.2, -1.85, "x", 6); boxAt(g, 0.06, 0.38, 0.22, dunkel, sd * 1.66, 2.15, -1.85); boxAt(g, 0.02, 0.32, 0.18, glas, sd * 1.66, 2.15, -1.95); }
  milCyl(g, 0.3, 0.32, 0.06, oliv2, 0.4, 2.58, -1.0, "y", 16); for (let k = 0; k < 3; k++) boxAt(g, 0.12, 0.08, 0.06, glas, -0.3 + k * 0.25, 2.6, -1.6);
  boxIn(g, -1.0, 1.0, 1.1, 2.55, -0.35, -0.28, dunkel);
  // Auspuff hinter der Kabine rechts, Tank links, Batteriekasten rechts
  milCyl(g, 0.07, 0.07, 1.9, dunkel, 1.05, 2.0, -0.31, "y", 10); boxAt(g, 0.05, 1.0, 0.24, oliv2, 1.14, 2.1, -0.31); milCyl(g, 0.075, 0.075, 0.2, gummi, 1.05, 3.0, -0.31, "y", 10);
  boxIn(g, -1.05, -0.55, 0.6, 1.02, -1.95, -0.6, oliv2); for (const z of [-1.7, -0.85]) boxIn(g, -1.07, -0.55, 0.58, 0.62, z - 0.03, z + 0.03, stahl); milCyl(g, 0.06, 0.06, 0.05, dunkel, -0.8, 1.05, -1.3, "y", 8);
  milKiste(g, K, 1.05, 0.6, 0.62, 1.0, -1.9, -0.95, 1);
  // Mannschaftsaufbau (Loft): Panzerfenster mit dicken Rahmen, Schiessluken, Haltegriffe, Staukorb, Kanister, Spritzlappen, Kotfluegel ueber den Hinterachsen
  const ms = f => [[0, 1.1], [1.12, 1.1], [1.15, 1.25], [1.15, 2.4], [0.98, 2.82], [0, 2.82]];
  loftIn(g, [0.25, 0.15, -3.3, -3.4].map(f => [f, f === 0.25 || f === -3.4 ? ms(f).map(([x, y]) => [x * 0.97, y]) : ms(f)]), oliv);
  for (const sd of [-1, 1]) { for (const z of [0.4, 1.5, 2.6]) { sideBox(g, sd * 1.14, sd * 1.2, 1.78, 2.3, z - 0.3, z + 0.3, oliv2); sideBox(g, sd * 1.19, sd * 1.21, 1.85, 2.23, z - 0.23, z + 0.23, glas); }
      for (const z of [0.95, 2.05]) { milCyl(g, 0.07, 0.075, 0.05, oliv2, sd * 1.17, 1.55, z, "x", 10); milCyl(g, 0.02, 0.02, 0.06, dunkel, sd * 1.2, 1.55, z, "x", 6); }
      sideBox(g, sd * 1.13, sd * 1.17, 1.22, 1.27, -0.15, 3.35, oliv2); for (let k = 0; k < 5; k++) milCyl(g, 0.022, 0.022, 0.02, dunkel, sd * 1.17, 1.245, 0.2 + k * 0.75, "x", 6);
      prismIn(g, [[-0.25, 1.14], [-0.4, 1.2], [-2.9, 1.2], [-3.05, 1.14], [-3.05, 1.1], [-0.25, 1.1]], 0.36, oliv2, sd * 1.1);
      for (const z of [-0.4, 3.08]) sideBox(g, sd * 0.78, sd * 1.24, 0.42, 1.1, z, z + 0.03, gummi); milKanister(g, K, sd * 1.26, 1.5, 3.05, sd);
      for (let k = 0; k < 3; k++) milCyl(g, 0.018, 0.018, 0.4, stahl, sd * 0.7, 2.86, 0.6 + k * 1.0, "z", 6); }
  // Dach: Luke mit Lafettenring, Staukorb, Antennen; Heck: Tuer mit Panzerfenster, Leiter, Ruecklichter, Kupplung, Reserverad
  milCyl(g, 0.48, 0.5, 0.1, oliv2, 0, 2.87, 1.8, "y", 24); milCyl(g, 0.38, 0.4, 0.08, oliv, 0, 2.92, 1.8, "y", 20); boxAt(g, 0.12, 0.06, 0.1, stahl, 0.3, 2.97, 1.8);
  { const t = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 6, 32).rotateX(Math.PI / 2), stahl); t.position.set(0, 3.05, 1.8); g.add(t); for (const a of [0.8, 2.4, 3.9, 5.5]) milCyl(g, 0.015, 0.015, 0.16, stahl, Math.cos(a) * 0.5, 2.97, 1.8 + Math.sin(a) * 0.5, "y", 6); }
  boxIn(g, -0.9, 0.9, 2.82, 2.86, 0.0, 1.1, stahl); for (const x of [-0.88, 0.88]) boxIn(g, x - 0.02, x + 0.02, 2.82, 3.0, 0.0, 1.1, stahl); boxIn(g, -0.85, 0.85, 2.86, 3.08, 0.1, 1.0, K.plane);
  milAntenne(g, K, -0.85, 2.82, 3.1, 2.4); milAntenne(g, K, 0.85, 2.55, -0.6, 1.8);
  boxIn(g, -0.5, 0.5, 1.15, 2.55, 3.4, 3.45, oliv2); boxIn(g, -0.2, 0.2, 1.95, 2.3, 3.45, 3.47, glas); boxAt(g, 0.18, 0.05, 0.06, stahl, 0.32, 1.75, 3.48); for (const y of [1.4, 2.3]) milCyl(g, 0.04, 0.04, 0.14, stahl, -0.52, y, 3.44, "y", 8);
  for (const sd of [-1, 1]) boxIn(g, sd * 0.3 - 0.025, sd * 0.3 + 0.025, 0.35, 1.12, 3.46, 3.51, stahl); for (const y of [0.45, 0.75, 1.05]) boxIn(g, -0.3, 0.3, y - 0.02, y + 0.02, 3.46, 3.51, stahl);
  for (const sd of [-1, 1]) { milLicht(g, K, sd * 0.85, 1.35, 3.4, 1, mat.glowRed, 0.18, 0.12); milHaken(g, K, sd * 0.7, 0.72, 3.38); }
  boxAt(g, 0.22, 0.16, 0.2, stahl, 0, 0.72, 3.38);
  { const rr = new THREE.Group(); rr.position.set(0.82, 1.95, 3.6); g.add(rr); milCyl(rr, 0.5, 0.5, 0.34, K.reifen, 0, 0, 0, "z", 22); milCyl(rr, 0.3, 0.3, 0.36, K.felge, 0, 0, 0, "z", 16); boxAt(g, 0.12, 0.8, 0.14, stahl, 0.82, 1.95, 3.44); }
  mergeStatic(g);
  const wheels = [[-1.0, -2.75, true], [1.0, -2.75, true], [-1.0, 1.0, false], [1.0, 1.0, false], [-1.0, 2.4, false], [1.0, 2.4, false]].map(([x, z, f]) => addWheel(g, x, z, 0.52, 0.36, f, K.reifen, K.felge, 16, 22));
  for (const w of wheels) milNabe(w, 0.36, K);
  g.name = "Duro IIIP"; return { g, wheels };
}
const SPEC_DURO = { name: "Duro IIIP", wheels: [[-1.0, -2.75], [1.0, -2.75], [-1.0, 1.0], [1.0, 1.0], [-1.0, 2.4], [1.0, 2.4]], wb: 4.45, track: 2.0, pts: [-2.9, -1.0, 1.0, 2.9], R: 1.25, circR: 1.2, enter: 4.6,
  maxN: 24, maxF: 25, acc: 6, steer: 0.5, jump: false, grade: 40, camD: 12, camH: 2.6, seat: [-0.5, 2.15, -1.4], bodyH: 2.9, bike: false, mass: 16,
  exits: [[-2.0, -1.4], [2.0, -1.4], [-2.0, 1.2], [2.0, 1.2], [0, -4.6], [0, 4.6]],
  msg: "Duro IIIP: W/S Gas/Bremse, A/D lenken, V Kamera, R zurücksetzen, Shift aussteigen" };
if (typeof massSpec === "function") { massSpec(SPEC_DURO, 0.94); buildDuro = massBau(buildDuro, 0.94); }   // Duro 7,66 -> 7,2 m (echt 6,9), Dach 2,77 (MASSE-FAHRZEUGE.md)

// ---- Hubschrauber, eigene Modelle. Gebaut im Massstab des Polizei-Helikopters (Rotor auf ca. 2,8, Kufen bzw. Raeder bei y 0, Heck bis ca. z 6), innere Gruppe um k skaliert;
// flyAdd skaliert Kollision, Kamera und Ausstieg mit demselben k. Rueckgabe wie buildPolizeiHeli: { g, rotor, heck, lichter } (lichter = Blitzleuchten rot oben, rot unten, weiss hinten).
function milHeliTeile(k) { const g = new THREE.Group(), i = new THREE.Group(); i.scale.setScalar(k); g.add(i); const K = milMat();
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0, par = i) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; par.add(o); return o; };
  const blitz = [new THREE.MeshBasicMaterial({ color: 0xff2020 }), new THREE.MeshBasicMaterial({ color: 0xff2020 }), new THREE.MeshBasicMaterial({ color: 0xffffff })];
  return { g, i, K, add, blitz }; }
// Transporthelikopter Cougar: langer kastiger Rumpf, Cockpit mit grosser Verglasung und Drahtschneidern, Schiebetuer mit Fenstern, Seitenstummel mit Hauptfahrwerk,
// Bugrad, zwei Triebwerke oben mit Einlaessen und Auspuffen, Seilwinde ueber der Tuer, Vierblattrotor, Heckausleger mit Leitwerk links (Heckrotor) und Hoehenflosse rechts,
// Hecksporn, Antennen, Schweizerkreuz-Hoheitszeichen und Kennung T-301. Massstab 1,55 (Rotor ca. 15,6 m).
function buildCougar(k = 1.55) {
  const { g, i, K, add, blitz } = milHeliTeile(k), { oliv, oliv2, dunkel, stahl, gummi } = K, glasH = M(0x0c141c, { metalness: 0.7, roughness: 0.08, transparent: true, opacity: 0.8, flatShading: true });
  const yb = tabF([[2.55, 1.05], [2.3, 0.72], [1.7, 0.55], [-2.3, 0.55], [-4.2, 1.5]]), yt = tabF([[2.55, 1.2], [2.3, 1.55], [1.5, 1.95], [1.1, 2.05], [-2.3, 2.05], [-4.2, 1.88]]), wd = tabF([[2.55, 0.25], [2.3, 0.6], [1.7, 0.82], [-2.3, 0.86], [-4.2, 0.28]]);
  const sec = (f, s = 1, y0 = 0) => { const b = yb(f), t = yt(f), h = t - b, w = wd(f) * s; return [[0, b + y0 * h], [w * 0.8, b + y0 * h], [w, b + Math.max(y0, 0.15) * h], [w, b + 0.78 * h], [w * 0.72, t + (s - 1) * 0.5], [0, t + (s - 1) * 0.5]]; };
  const FS = [2.55, 2.45, 2.3, 2.1, 1.9, 1.7, 1.5, 1.3, 1.1, 0.5, -0.5, -1.5, -2.3, -2.8, -3.3, -3.8, -4.2]; loftIn(i, FS.map(f => [f, sec(f)]), oliv);
  loftIn(i, [2.45, 2.3, 2.1, 1.9, 1.7, 1.5, 1.35].map(f => [f, sec(f, 1.015, 0.45)]), glasH);                                                    // Cockpitverglasung
  for (const x of [0, -0.45, 0.45]) { const b = add(new THREE.BoxGeometry(0.05, 0.05, 1.0), oliv2, x, 1.75, -1.95, -0.62); }                // Rahmenstreben
  for (const sd of [-1, 1]) { add(new THREE.BoxGeometry(0.03, 0.55, 0.05), oliv2, sd * 0.84, 1.55, -1.35); add(new THREE.BoxGeometry(0.03, 0.3, 0.4), glasH, sd * 0.835, 0.85, -2.0); }   // Tuersaeule, Kinnfenster
  add(new THREE.BoxGeometry(0.04, 0.35, 0.04), stahl, 0, 2.22, -1.4, 0.4); add(new THREE.BoxGeometry(0.04, 0.3, 0.04), stahl, 0, 0.42, -1.9, -0.4);   // Drahtschneider
  for (const sd of [-1, 1]) add(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), stahl, sd * 0.3, 1.25, -2.75, Math.PI / 2);                  // Staurohre
  // Seiten: Schiebetuer (Fugen, Schiene, Fenster), Kabinenfenster, Seitenstummel mit Hauptrad, Seilwinde rechts
  for (const sd of [-1, 1]) { const X = sd * 0.865;
    for (const z of [-0.9, 0.55]) add(new THREE.BoxGeometry(0.01, 1.3, 0.025), dunkel, X, 1.25, z); add(new THREE.BoxGeometry(0.01, 0.025, 1.45), dunkel, X, 1.9, -0.17); add(new THREE.BoxGeometry(0.03, 0.04, 2.6), stahl, X + sd * 0.015, 1.97, 0.4);
    for (const z of [-0.5, 0.15, 1.0, 1.6]) { add(new THREE.BoxGeometry(0.02, 0.36, 0.42), oliv2, X, 1.55, z); add(new THREE.BoxGeometry(0.02, 0.3, 0.36), glasH, X + sd * 0.006, 1.55, z); }
    add(new THREE.BoxGeometry(0.06, 0.08, 0.14), stahl, X + sd * 0.02, 1.25, 0.45);
    const sp = new THREE.Group(); sp.position.set(sd * 1.0, 0.72, 0.6); i.add(sp); const s = add(new THREE.SphereGeometry(1, 14, 10), oliv, 0, 0, 0, 0, 0, 0, sp); s.scale.set(0.3, 0.22, 1.0);
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 8), stahl, sd * 1.02, 0.42, 0.75); const r = add(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 16), gummi, sd * 1.02, 0.24, 0.75, 0, 0, Math.PI / 2); add(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12), stahl, sd * 1.02, 0.24, 0.75, 0, 0, Math.PI / 2); }
  { add(new THREE.BoxGeometry(0.5, 0.08, 0.1), stahl, 1.05, 2.1, -0.4); add(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 10), dunkel, 1.28, 2.0, -0.4); add(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 4), stahl, 1.28, 1.65, -0.4); }   // Seilwinde
  add(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), stahl, 0, 0.3, -1.85); for (const sd of [-1, 1]) add(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 14), gummi, sd * 0.09, 0.17, -1.85, 0, 0, Math.PI / 2);   // Bugrad (zwei Reifen)
  // Oben: Triebwerksverkleidung, zwei Triebwerke mit Einlass (Gitter) und schraegem Auspuff, Getriebe, Mast; Wartungsklappen
  add(new THREE.BoxGeometry(1.25, 0.36, 2.4), oliv2, 0, 2.2, 0.0); add(new THREE.BoxGeometry(1.0, 0.28, 0.9), oliv, 0, 2.45, -0.15);
  for (const sd of [-1, 1]) { add(new THREE.CylinderGeometry(0.24, 0.26, 1.8, 14), oliv, sd * 0.42, 2.38, 0.3, Math.PI / 2); add(new THREE.CircleGeometry(0.2, 14), dunkel, sd * 0.42, 2.38, -0.61, 0, Math.PI);
    for (let q = 0; q < 4; q++) add(new THREE.BoxGeometry(0.36, 0.02, 0.02), stahl, sd * 0.42, 2.25 + q * 0.09, -0.62); add(new THREE.CylinderGeometry(0.15, 0.13, 0.5, 12), dunkel, sd * 0.55, 2.42, 1.35, Math.PI / 2 - 0.3, sd * 0.4);
    for (const z of [-0.3, 0.6]) add(new THREE.BoxGeometry(0.01, 0.2, 0.5), dunkel, sd * 0.63, 2.2, z); }
  add(new THREE.CylinderGeometry(0.1, 0.14, 0.4, 10), stahl, 0, 2.75, -0.15);
  const rotor = new THREE.Group(); rotor.position.set(0, 2.98, -0.15); i.add(rotor); add(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 16), dunkel, 0, 0, 0, 0, 0, 0, rotor); add(new THREE.CylinderGeometry(0.1, 0.18, 0.25, 10), stahl, 0, 0.15, 0, 0, 0, 0, rotor);
  for (let q = 0; q < 4; q++) { const b = add(new THREE.BoxGeometry(0.3, 0.04, 4.8), dunkel, 0, 0.02, 0, 0, q * Math.PI / 2, 0, rotor); b.geometry.translate(0, 0, 2.6); const a = add(new THREE.BoxGeometry(0.1, 0.08, 0.5), stahl, 0, 0, 0, 0, q * Math.PI / 2, 0, rotor); a.geometry.translate(0, 0, 0.35); }
  // Heck: Ausleger, Leitwerk (Flosse links mit Heckrotor), Hoehenflosse, Sporn, Antennen
  add(new THREE.CylinderGeometry(0.26, 0.15, 2.9, 12), oliv, 0, 1.8, 5.5, Math.PI / 2 - 0.04); add(new THREE.BoxGeometry(0.5, 0.06, 0.05), oliv2, 0, 1.78, 4.25);
  { const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(1.0, 0); fin.lineTo(1.45, 1.4); fin.lineTo(0.95, 1.45); fin.lineTo(0, 0.25); const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.1, bevelEnabled: false }); fg.translate(0, 0, -0.05); add(fg, oliv, 0, 1.75, 5.45, 0, -Math.PI / 2); }
  add(new THREE.BoxGeometry(1.0, 0.06, 0.5), oliv, 0.55, 1.95, 6.0); add(new THREE.BoxGeometry(0.05, 0.3, 0.45), oliv2, 1.05, 1.95, 6.0);
  add(new THREE.BoxGeometry(0.05, 0.35, 0.08), stahl, 0, 1.45, 6.3, 0.4); for (const [x, y, z, h] of [[0, 2.08, 1.8, 0.4], [0, 0.45, 0.2, 0.3], [0.3, 0.5, -0.8, 0.25]]) add(new THREE.CylinderGeometry(0.008, 0.015, h, 6), dunkel, x, y + (y > 1 ? h / 2 : -h / 2), z);
  const heck = new THREE.Group(); heck.position.set(-0.16, 2.72, 6.5); heck.rotation.y = Math.PI / 2; i.add(heck); add(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10), dunkel, 0, 0, 0, Math.PI / 2, 0, 0, heck);
  for (let q = 0; q < 5; q++) add(new THREE.BoxGeometry(0.12, 1.15, 0.02), dunkel, 0, 0, 0, 0, 0, q * Math.PI / 5, heck);
  // Kennung und Hoheitszeichen
  for (const sd of [-1, 1]) { const p = add(new THREE.PlaneGeometry(1.3, 0.3), milSchrift("T-301"), sd * 0.6, 1.62, 3.35, 0, sd * Math.PI / 2 - sd * 0.12); p.castShadow = false;
    const c = add(new THREE.PlaneGeometry(0.4, 0.4), milKreuzSchweiz(), sd * 0.82, 1.45, 2.15, 0, sd * Math.PI / 2 - sd * 0.08); c.castShadow = false; }
  const lichter = [add(new THREE.SphereGeometry(0.08, 10, 8), blitz[0], 0, 2.42, 1.0), add(new THREE.SphereGeometry(0.08, 10, 8), blitz[1], 0, 0.5, 0.4), add(new THREE.SphereGeometry(0.06, 8, 6), blitz[2], 0, 3.22, 6.6)];
  g.name = "Transporthelikopter Cougar"; return { g, rotor, heck, lichter };
}
// Seilwinde des Cougar (Nicolas 2026-11-19: "der Transporthelikopter hat ja eine Seilwinde rechts – die soll als Spezialfunktion irgendetwas mitnehmen koennen"): im Flug H = Seil mit
// Haken ablassen (bis 30 m oder zum Boden); trifft der Haken das Dach eines Fahrzeugs, wird es eingehaengt und auf 9 m hochgezogen und fliegt mit (dreht mit dem Hubschrauber);
// H nochmals = absetzen (faellt mit 9 m/s auf den Boden) bzw. Seil einziehen. Im Spiel alle abgestellten Fahrzeuge (VEH, Kennzeichen v.windeBy), in der Werkstatt das Modell (AKT).
const WINDE = { L: 0, ziel: 0, st: "ein", last: null, off: 0, fall: [], seil: null, haken: null, tip: null };
function windeTaste() { const W = WINDE; if (W.last) { W.fall.push(W.last); W.last.windeBy = null; W.last.windeFall = true; if (typeof toast === "function") toast("Last abgesetzt"); W.last = null; W.st = "ein"; return; }
  if (W.st === "ab") { W.st = "ein"; if (typeof toast === "function") toast("Seil wird eingezogen"); } else { W.st = "ab"; if (typeof toast === "function") toast("Seilwinde: Haken wird abgelassen – über ein Fahrzeug fliegen"); } }
function windeBoden(x, z, y) { return typeof groundAt === "function" ? groundAt(x, z, y) : 0; }
const windeAkt = () => { try { return typeof AKT !== "undefined" ? AKT : null; } catch (e) { return null; } };   // Werkstatt-Modell (let, beim Laden noch nicht da)
function windeStep(B, dt) { const W = WINDE; if (!B.on && W.L < 0.01 && !W.last && !W.fall.length) return; if (!W.tip) { W.tip = new THREE.Object3D(); W.tip.position.set(1.28, 1.45, -0.4); B.g.children[0].add(W.tip);
    W.seil = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6).translate(0, -0.5, 0), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 })); W.seil.userData.dynamic = true; W.seil.visible = false; scene.add(W.seil);
    W.haken = new THREE.Group(); const st = new THREE.MeshStandardMaterial({ color: 0xd4a640, metalness: 0.6, roughness: 0.35 }); W.haken.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.12), st)); const h = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 6, 12, Math.PI * 1.5), st); h.position.y = -0.3; W.haken.add(h);
    W.haken.userData.dynamic = true; W.haken.visible = false; scene.add(W.haken); }
  B.g.updateMatrixWorld(true); const T = W.tip.getWorldPosition(new THREE.Vector3()), gr = windeBoden(T.x, T.z, T.y);
  W.ziel = W.last ? 9 : W.st === "ab" ? Math.min(30, Math.max(0, T.y - gr - 0.5)) : 0; W.L += Math.sign(W.ziel - W.L) * Math.min(Math.abs(W.ziel - W.L), 5 * dt);
  const P = T.clone(); P.y -= W.L; W.seil.visible = W.haken.visible = W.L > 0.15; W.seil.position.copy(T); W.seil.scale.set(1, Math.max(0.01, W.L), 1); W.haken.position.copy(P); W.haken.rotation.y = B.h;
  const kand = []; if (typeof VEH !== "undefined") for (const v of VEH) if (!v.on && !v.dead && v.g && v.g.visible && !v.windeBy) kand.push(v); { const A = windeAkt(); if (A && A.g && !kand.includes(A)) kand.push(A); }
  if (W.st === "ab" && !W.last && W.L > 1) for (const v of kand) { const top = (v.y ?? 0) + ((v.spec && v.spec.bodyH) || 1.5), r = Math.max(1.2, ((v.spec && v.spec.R) || 1) * 1.1);
    if (Math.hypot(v.x - P.x, v.z - P.z) < r && Math.abs(P.y - top) < 1.3) { W.last = v; v.windeBy = B; W.off = (v.h || 0) - B.h; if (typeof toast === "function") toast((v.label || (v.spec && v.spec.name) || "Fahrzeug") + " eingehängt – H setzt ab"); break; } }
  if (W.last) { const v = W.last, bh = (v.spec && v.spec.bodyH) || 1.5; v.x = P.x; v.z = P.z; v.y = P.y - bh - 0.35; v.h = B.h + W.off; v.g.position.set(v.x, v.y, v.z); v.g.rotation.set(0, v.h, 0); if ("v" in v) v.v = 0; }
  for (let q = W.fall.length - 1; q >= 0; q--) { const v = W.fall[q], g0 = windeBoden(v.x, v.z, v.y + 1); v.y = Math.max(g0, v.y - 9 * dt); v.g.position.y = v.y; if (v.y <= g0 + 0.001) { v.windeFall = false; v.settled = false; W.fall.splice(q, 1); } } }
addEventListener("keydown", e => { if (e.code !== "KeyH" || e.repeat || !(typeof FLY !== "undefined" && FLY === COUGAR && COUGAR.on)) return; e.preventDefault(); windeTaste(); });
// Leichter Transport- und Schulungshelikopter: runder Rumpf mit grosser Verglasung, Schiebetueren hinten, Kufen, Triebwerke unter einer Verkleidung, Vierblattrotor,
// Heckausleger mit ummanteltem Heckrotor in der Flosse, Hoehenflosse mit Endscheiben, Kennung T-361. Massstab 1,0.
function buildSchulHeli(k = 1.0) {
  const { g, i, K, add, blitz } = milHeliTeile(k), { oliv, oliv2, dunkel, stahl, gummi } = K, olivR = M(MIL_OLIV, { roughness: 0.6, metalness: 0.2 }), glasH = M(0x0c141c, { metalness: 0.7, roughness: 0.06, transparent: true, opacity: 0.78 });
  const yb = tabF([[2.4, 1.15], [2.15, 0.78], [1.6, 0.62], [-1.3, 0.62], [-2.5, 1.45]]), yt = tabF([[2.4, 1.3], [2.1, 1.75], [1.4, 2.05], [0.9, 2.12], [-1.3, 2.12], [-2.5, 1.95]]), wd = tabF([[2.4, 0.22], [2.15, 0.55], [1.6, 0.78], [-1.3, 0.8], [-2.5, 0.3]]);
  const sec = (f, s = 1, y0 = 0) => { const b = yb(f), t = yt(f), h = t - b, w = wd(f) * s, n = 9, P = [], a0 = y0 > 0 ? Math.asin((y0 - 0.5) * 2 / s) : -Math.PI / 2; for (let q = 0; q <= n; q++) { const a = a0 + (Math.PI / 2 - a0) * q / n; P.push([Math.max(0, Math.cos(a) * w), b + h / 2 + Math.sin(a) * h / 2 * s]); } if (y0 > 0) P.unshift([0, P[0][1]]); return P; };
  const FS = []; for (let f = 2.4; f > -2.5; f -= 0.16) FS.push(+f.toFixed(3)); FS.push(-2.5); loftIn(i, FS.map(f => [f, sec(f)]), olivR);
  loftIn(i, FS.filter(f => f <= 2.32 && f >= 0.95).map(f => [f, sec(f, 1.012, 0.42)]), glasH);
  for (const sd of [-1, 1]) { add(new THREE.BoxGeometry(0.03, 0.75, 0.05), oliv2, sd * 0.77, 1.55, -1.0); add(new THREE.BoxGeometry(0.03, 0.03, 1.4), oliv2, sd * 0.79, 1.95, -0.45);
    for (const z of [-0.95, 0.3, 1.2]) add(new THREE.BoxGeometry(0.01, 1.1, 0.025), dunkel, sd * 0.8, 1.4, z); add(new THREE.BoxGeometry(0.02, 0.4, 0.6), glasH, sd * 0.8, 1.6, 0.75); add(new THREE.BoxGeometry(0.04, 0.04, 2.0), stahl, sd * 0.81, 1.98, 0.6);
    add(new THREE.BoxGeometry(0.05, 0.05, 0.14), stahl, sd * 0.82, 1.3, 0.35); }
  add(new THREE.BoxGeometry(0.05, 0.05, 1.1), oliv2, 0, 1.92, -1.65, -0.55);
  // Kufen mit Streben und Trittbrettern
  for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(0.045, 0.045, 3.4, 10), stahl, sx * 0.95, 0.06, -0.1, Math.PI / 2); add(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 10), stahl, sx * 0.95, 0.13, -1.88, -0.7);
    for (const z of [-0.9, 0.8]) add(new THREE.CylinderGeometry(0.045, 0.045, 1.05, 8), stahl, sx * 0.76, 0.42, z, 0, 0, sx * 0.55); add(new THREE.BoxGeometry(0.22, 0.03, 0.7), dunkel, sx * 0.95, 0.12, -0.6); }
  // Triebwerksverkleidung mit Einlaessen und Auspuffen, Mast, Rotor
  add(new THREE.BoxGeometry(1.0, 0.38, 2.0), olivR, 0, 2.25, 0.3); add(new THREE.BoxGeometry(0.75, 0.2, 0.8), olivR, 0, 2.5, 0.0);
  for (const sd of [-1, 1]) { add(new THREE.BoxGeometry(0.02, 0.18, 0.4), dunkel, sd * 0.51, 2.3, -0.3); for (let q = 0; q < 3; q++) add(new THREE.BoxGeometry(0.025, 0.02, 0.38), stahl, sd * 0.52, 2.24 + q * 0.06, -0.3);
    add(new THREE.CylinderGeometry(0.1, 0.09, 0.35, 10), dunkel, sd * 0.3, 2.35, 1.38, Math.PI / 2 - 0.25, sd * 0.25); }
  add(new THREE.CylinderGeometry(0.08, 0.12, 0.35, 10), stahl, 0, 2.75, -0.05);
  const rotor = new THREE.Group(); rotor.position.set(0, 2.95, -0.05); i.add(rotor); add(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 14), dunkel, 0, 0, 0, 0, 0, 0, rotor); add(new THREE.SphereGeometry(0.14, 10, 8), oliv2, 0, 0.1, 0, 0, 0, 0, rotor);
  for (let q = 0; q < 4; q++) { const b = add(new THREE.BoxGeometry(0.26, 0.035, 4.7), dunkel, 0, 0.02, 0, 0, q * Math.PI / 2, 0, rotor); b.geometry.translate(0, 0, 2.5); }
  // Heck: Ausleger, Flosse mit ummanteltem Heckrotor, Hoehenflosse mit Endscheiben
  add(new THREE.CylinderGeometry(0.24, 0.13, 2.9, 14), olivR, 0, 1.85, 3.8, Math.PI / 2 - 0.05);
  { const fin = new THREE.Shape(); fin.moveTo(-0.55, 0); fin.lineTo(0.55, 0); fin.lineTo(0.75, 1.0); fin.lineTo(0.45, 1.55); fin.lineTo(0.05, 1.55); fin.lineTo(-0.55, 0.6); const ho = new THREE.Path(); ho.absarc(0.05, 0.6, 0.36, 0, Math.PI * 2, true); fin.holes.push(ho);
    const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.3, bevelEnabled: false, curveSegments: 20 }); fg.translate(0, 0, -0.15); add(fg, olivR, 0, 1.55, 5.75, 0, -Math.PI / 2); }
  const heck = new THREE.Group(); heck.position.set(0, 2.15, 5.8); heck.rotation.y = Math.PI / 2; i.add(heck); add(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 10), dunkel, 0, 0, 0, Math.PI / 2, 0, 0, heck);
  for (let q = 0; q < 8; q++) add(new THREE.BoxGeometry(0.06, 0.66, 0.015), dunkel, 0, 0, 0, 0, 0, q * Math.PI / 8, heck);
  add(new THREE.BoxGeometry(1.6, 0.05, 0.4), olivR, 0, 1.9, 4.65); for (const sd of [-1, 1]) add(new THREE.BoxGeometry(0.04, 0.4, 0.45), oliv2, sd * 0.8, 1.95, 4.65);
  for (const sd of [-1, 1]) { const p = add(new THREE.PlaneGeometry(1.1, 0.26), milSchrift("T-361"), sd * 0.47, 1.62, 2.6, 0, sd * Math.PI / 2 - sd * 0.1); p.castShadow = false;
    const c = add(new THREE.PlaneGeometry(0.34, 0.34), milKreuzSchweiz(), sd * 0.8, 1.35, -0.05, 0, sd * Math.PI / 2); c.castShadow = false; }
  add(new THREE.CylinderGeometry(0.008, 0.015, 0.4, 6), dunkel, 0, 2.6, 1.5);
  const lichter = [add(new THREE.SphereGeometry(0.07, 10, 8), blitz[0], 0, 2.48, 1.2), add(new THREE.SphereGeometry(0.07, 10, 8), blitz[1], 0, 0.58, 0.5), add(new THREE.SphereGeometry(0.06, 8, 6), blitz[2], 0, 3.13, 6.0)];
  g.name = "Schulungshelikopter"; return { g, rotor, heck, lichter };
}
const COUGAR = flyAdd("Transporthelikopter Cougar", buildCougar(1.55), 1.55, { spec: { max: 42, acc: 10, up: 7, tilt: 0.16, tiltV: 0.003, turn: 0.7 },
  feet: [[-1.02 * 1.55, 0.75 * 1.55], [1.02 * 1.55, 0.75 * 1.55], [-0.1 * 1.55, -1.85 * 1.55], [0.1 * 1.55, -1.85 * 1.55]] });
{ const p0 = COUGAR.pose; COUGAR.pose = (B, dt) => { p0(B, dt); if (typeof windeStep === "function") windeStep(B, dt || 0); }; }   // Seilwinde
const SCHULHELI = flyAdd("Schulungshelikopter", buildSchulHeli(1.0), 1.0, { spec: { max: 50, acc: 15, up: 9, tilt: 0.22, tiltV: 0.004, turn: 1.0 } });
// Standplatz am Boden (ohne Landeplatz-Markierung)
function heliStand(H, x, y, z, h) { Object.assign(H, { x, y: y + 0.02, z, h, vx: 0, vy: 0, vz: 0, pitch: 0, roll: 0 }); H.home = { x, y: y + 0.02, z, h }; H.g.visible = true; batPose(H, 0); }

// ---- "Minotaurus" Drohnenpanzer (N52, eigener Entwurf nach OFFENE-FRAGEN 42): unbemannter Kettenroboter, 3,9 x 2,9 x 2,1 m. Flache Wanne mit Keilbug, Sensorleiste
// mit Kameras und LED-Scheinwerfern, Ketten aus Gliedern um Treib- und Leitrad, fuenf Laufrollen je Seite, Seitenschuerzen mit Schrauben, Akkupaket hinten mit Lamellen.
// Fernbedienbare Waffenstation (Turm wie beim Panzer: turret/gun/gunMin, schiesst mit Linksklick/Leertaste): Gehaeuse mit 30-mm-Kanone, Lenkwaffen-Behaelter links,
// Optik rechts, Nebelwerfer, Rundumkamera auf einem Mast, Funk- und GPS-Antennen. Gefahren wird er wie ein Fahrzeug (ferngesteuert gedacht).
function buildMinotaurus() {
  const g = new THREE.Group(), K = milMat(), { oliv, oliv2, dunkel, stahl, gummi, glas } = K, track = M(0x232323, { roughness: 0.9, metalness: 0.4, flatShading: true }), led = M(0xdfefff, { emissive: 0xbfdfff, emissiveIntensity: 0.9 });
  const sec = (w, yb, yt) => [[0, yb], [w - 0.1, yb], [w, yb + 0.12], [w, yt - 0.12], [w - 0.15, yt], [0, yt]];
  loftIn(g, [[1.95, sec(0.7, 0.62, 0.72)], [1.75, sec(0.9, 0.4, 0.92)], [1.25, sec(0.95, 0.32, 1.12)], [-1.6, sec(0.95, 0.32, 1.12)], [-1.85, sec(0.9, 0.42, 1.06)]], oliv);
  // Ketten: Glieder entlang einer Schleife (Treibrad vorne, Leitrad hinten)
  const loop = [], arc = (cz, cy, r, a0, a1) => { for (let k = 0; k <= 10; k++) { const a = a0 + (a1 - a0) * k / 10; loop.push([cz + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  loop.push([-1.4, 0.03], [1.4, 0.03]); arc(1.65, 0.4, 0.37, -2.3, Math.PI / 2); arc(-1.7, 0.42, 0.39, Math.PI / 2, 4.3); loop.push(loop[0]);
  const LINK = 0.13, links = []; { let carry = 0; for (let i = 0; i < loop.length - 1; i++) { const [z0, y0] = loop[i], [z1, y1] = loop[i + 1], L = Math.hypot(z1 - z0, y1 - y0); let s = carry;
    for (; s < L; s += LINK) { const u = s / L; links.push([z0 + (z1 - z0) * u, y0 + (y1 - y0) * u, Math.atan2(-(y1 - y0), z1 - z0)]); } carry = s - L; } }
  const linkG = new THREE.BoxGeometry(0.42, 0.045, LINK - 0.015), cleatG = new THREE.BoxGeometry(0.4, 0.03, 0.03).translate(0, -0.035, 0);
  for (const sd of [-1, 1]) { const X = sd * 1.15;
    for (const [z, y, a] of links) { meshIn(g, linkG, track, X, y, z, a); meshIn(g, cleatG, track, X, y, z, a); }
    for (const dx of [-0.13, 0.13]) { milCyl(g, 0.34, 0.34, 0.08, stahl, X + dx, 0.4, 1.65, "x", 16); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; meshIn(g, new THREE.BoxGeometry(0.08, 0.07, 0.07), stahl, X + dx, 0.4 + Math.sin(a) * 0.37, 1.65 + Math.cos(a) * 0.37, -a); } }
    milCyl(g, 0.13, 0.16, 0.36, dunkel, X, 0.4, 1.65, "x", 10); for (const dx of [-0.12, 0.12]) milCyl(g, 0.33, 0.33, 0.1, stahl, X + dx, 0.42, -1.7, "x", 16); milCyl(g, 0.1, 0.1, 0.36, dunkel, X, 0.42, -1.7, "x", 10);
    for (const z of [-0.7, 0.7]) milCyl(g, 0.07, 0.07, 0.24, stahl, X, 0.82, z, "x", 8);
    for (let k = 0; k < 3; k++) { const z0 = -1.6 + k * 1.08, z1 = z0 + 1.04; sideBox(g, sd * 1.4, sd * 1.45, 0.48, 0.9, z0, z1, oliv); sideBox(g, sd * 1.41, sd * 1.44, 0.34, 0.48, z0, z1, gummi);
      for (let b = 0; b < 4; b++) milCyl(g, 0.018, 0.018, 0.02, dunkel, sd * 1.455, 0.84, z0 + 0.1 + b * 0.28, "x", 6); }   // Schuerze in drei Feldern mit Schrauben und Gummilappen
    sideBox(g, sd * 0.92, sd * 1.46, 0.88, 0.94, -1.75, 1.8, oliv2);
    milHaken(g, K, sd * 0.6, 0.62, -1.98); milHaken(g, K, sd * 0.6, 0.62, 1.9); }
  // Sensorleiste vorne: Kameras, LED-Scheinwerfer, Laserscanner
  boxAt(g, 1.5, 0.16, 0.14, dunkel, 0, 0.98, -1.72); for (const x of [-0.55, -0.2, 0.2, 0.55]) { milCyl(g, 0.05, 0.05, 0.06, glas, x, 0.98, -1.8, "z", 12); milCyl(g, 0.065, 0.065, 0.03, stahl, x, 0.98, -1.78, "z", 12); }
  for (const sd of [-1, 1]) { boxAt(g, 0.3, 0.07, 0.06, dunkel, sd * 0.85, 0.8, -1.86); boxAt(g, 0.26, 0.04, 0.02, led, sd * 0.85, 0.8, -1.9); }
  milCyl(g, 0.09, 0.1, 0.12, dunkel, 0, 1.12, -1.6, "y", 14); milCyl(g, 0.08, 0.08, 0.04, glas, 0, 1.2, -1.6, "y", 14);
  // Deck: Akkupaket mit Lamellen hinten, Griffleisten, Ruecklichter, Staukiste, Nummer
  boxAt(g, 1.3, 0.2, 0.9, oliv2, 0, 1.22, 1.15); for (let k = 0; k < 8; k++) boxAt(g, 1.2, 0.03, 0.03, stahl, 0, 1.33, 0.78 + k * 0.1);
  for (const sd of [-1, 1]) { milCyl(g, 0.02, 0.02, 1.2, stahl, sd * 0.88, 1.17, 0.0, "z", 6); boxAt(g, 0.12, 0.08, 0.2, M(0xc02020, { emissive: 0x400808 }), sd * 0.7, 0.95, 1.86); }
  milKiste(g, K, -0.88, -0.45, 1.12, 1.32, -1.35, -0.85, -1);
  for (const sd of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.16), milSchrift("M-01", "#e8e6d8", 256, 64, "bold 44px Arial")); p.position.set(sd * 0.955, 0.75, -0.6); p.rotation.y = sd * Math.PI / 2; g.add(p); }
  // Rundumkamera auf Mast, Antennen, GPS-Kuppel
  milCyl(g, 0.04, 0.05, 0.9, stahl, -0.6, 1.57, 1.45, "y", 8); meshIn(g, new THREE.SphereGeometry(0.12, 12, 8), dunkel, -0.6, 2.05, 1.45); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; boxAt(g, 0.06, 0.05, 0.03, glas, -0.6 + Math.sin(a) * 0.11, 2.05, 1.45 + Math.cos(a) * 0.11).rotation.y = a; }
  milAntenne(g, K, 0.75, 1.12, 1.7, 1.4); meshIn(g, new THREE.SphereGeometry(0.1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0xd8d8cc, { roughness: 0.6 }), 0.4, 1.32, 1.65);
  mergeStatic(g);
  // Waffenstation (dreht): Gehaeuse, Lenkwaffen-Behaelter links, Optik mit Laser rechts, Nebelwerfer; Kanone als eigene Gruppe
  const turret = new THREE.Group(); turret.position.set(0, 1.12, -0.15); g.add(turret); const T = new THREE.Group(); turret.add(T);
  milCyl(T, 0.62, 0.66, 0.1, dunkel, 0, 0.05, 0, "y", 20);
  const ts = (w, yb, yt) => [[0, yb], [w, yb], [w, yt - 0.1], [w - 0.13, yt], [0, yt]];
  loftIn(T, [[0.72, ts(0.36, 0.12, 0.42)], [0.45, ts(0.55, 0.1, 0.65)], [-0.6, ts(0.55, 0.1, 0.65)], [-0.75, ts(0.48, 0.14, 0.6)]], oliv);
  for (let k = 0; k < 5; k++) milCyl(T, 0.02, 0.02, 0.02, dunkel, -0.4 + k * 0.2, 0.66, 0.3, "y", 6);
  boxAt(T, 0.3, 0.36, 1.1, oliv2, -0.75, 0.48, -0.05); for (const y of [0.39, 0.57]) milCyl(T, 0.08, 0.08, 0.04, dunkel, -0.75, y, -0.62, "z", 12); boxAt(T, 0.06, 0.4, 0.06, stahl, -0.6, 0.3, -0.05);
  boxAt(T, 0.28, 0.26, 0.36, dunkel, 0.62, 0.5, -0.25); boxAt(T, 0.2, 0.14, 0.02, glas, 0.62, 0.52, -0.44); boxAt(T, 0.06, 0.06, 0.02, M(0xff3030, { emissive: 0x800000 }), 0.68, 0.42, -0.44);
  for (const sd of [-1, 1]) milNebel(T, K, sd * 0.42, 0.66, 0.35, sd, 3);
  mergeStatic(T);
  const gun = new THREE.Group(); gun.position.set(0, 0.36, -0.55); T.add(gun);
  boxAt(gun, 0.34, 0.3, 0.36, oliv2, 0, 0, -0.05); milCyl(gun, 0.07, 0.08, 0.8, stahl, 0, 0, -0.6, "z", 12); milCyl(gun, 0.09, 0.09, 0.3, dunkel, 0, 0, -0.95, "z", 12);
  milCyl(gun, 0.05, 0.055, 1.0, stahl, 0, 0, -1.6, "z", 12); milCyl(gun, 0.075, 0.065, 0.2, dunkel, 0, 0, -2.18, "z", 12); for (let k = 0; k < 3; k++) boxAt(gun, 0.16, 0.02, 0.02, dunkel, 0, 0.05, -2.12 + k * 0.05);
  boxAt(gun, 0.08, 0.08, 0.3, dunkel, 0.2, 0.06, -0.3);
  mergeStatic(gun); for (const o of [...gun.children, ...T.children]) o.castShadow = true;
  const wheels = []; for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) { const w = addWheel(g, sd * 1.15, -1.1 + k * 0.55, 0.24, 0.34, false, gummi, K.felge, 0, 14); milCyl(w.spin, 0.08, 0.1, 0.04, dunkel, sd * 0.18, 0, 0, "x", 10); wheels.push(w); }
  const gunMin = new Float32Array(360).fill(-0.14);
  g.name = "Minotaurus"; return { g, wheels, turret, gun, gunMin };
}
const SPEC_MINOTAURUS = { name: "Minotaurus (Drohnenpanzer)", turretSpeed: 70, gunSpeed: 40, gunMax: 1.05, muzzle: 2.3, sight: [0.62, 0.75, -0.45], wheels: [[-1.15, -1.3], [1.15, -1.3], [-1.15, 1.3], [1.15, 1.3]], wb: 2.6, track: 2.3, pts: [-1.2, 0, 1.2], R: 1.3, circR: 1.25, enter: 3.6,
  maxN: 16, maxF: 22, revMax: 14, acc: 7, steer: 1.2, jump: false, grade: 75, tracks: true, hull: [-1.2, 0, 1.2].flatMap(x => [-1.9, -0.6, 0.6, 1.9].map(z => [x, 0.05, z])), camD: 8, camH: 1.7, seat: [0, 1.95, 0.4], bodyH: 1.9, bike: false, mass: 9,
  exits: [[-2.2, 0], [2.2, 0], [-2.2, 1.2], [2.2, 1.2], [0, -3.2], [0, 3.2]],
  msg: "Minotaurus (ferngesteuert): W/S Gas/Bremse, A/D lenken, Maus dreht die Waffenstation, Linksklick/Leertaste schiessen, V Kamera, Shift aussteigen" };

// ---- Aufklaerungsdrohne (N52, Vorbild RQ-4, ohne Marken): schlanker Rumpf mit Buckel (Satellitenantenne), sehr lange schmale Fluegel (ca. 40 m), Triebwerk oben hinten
// mit Einlauf, V-Leitwerk, Bugrad und Hauptfahrwerk, Sensorkuppel unten, Positions- und Blitzlicht. Massstab 1:1, Nase -z.
// Im Spiel kreist sie autonom ueber Gotham (450 m hoch, Kreis 900 m um den Wayne Tower, 60 m/s); in der Werkstatt steht sie am Boden (drohneStand). Nicht steuerbar (OFFENE-FRAGEN 54).
function buildAufklaerungsdrohne() {
  const g = new THREE.Group(), grau = M(0xc9ccc8, { roughness: 0.55, metalness: 0.2 }), grau2 = M(0xa9aca8, { roughness: 0.6, metalness: 0.2 }), dunkel = M(0x2a2c2e, { roughness: 0.7 }), stahl = M(0x7a7f84, { metalness: 0.6, roughness: 0.4 }), gummi = M(0x161616, { roughness: 0.95 });
  const hw = tabF([[7.3, 0.05], [7.0, 0.45], [6.2, 0.72], [4.5, 0.82], [2.0, 0.75], [-2.0, 0.62], [-5.0, 0.42], [-7.0, 0.22], [-7.3, 0.12]]), top = tabF([[7.3, 1.75], [7.0, 2.2], [6.0, 2.6], [4.3, 2.95], [2.8, 2.75], [0, 2.45], [-3.5, 2.3], [-7.0, 2.1], [-7.3, 2.05]]),
    bot = tabF([[7.3, 1.7], [7.0, 1.35], [6.0, 1.15], [3.0, 1.1], [-2.0, 1.2], [-5.0, 1.55], [-7.3, 1.85]]);
  const FS = []; for (let f = 7.3; f > -7.3; f -= 0.35) FS.push(+f.toFixed(2)); FS.push(-7.3);
  loftIn(g, FS.map(f => { const w = hw(f), t = top(f), b = bot(f), m = (t + b) / 2, h = (t - b) / 2, P = []; for (let q = 0; q <= 10; q++) { const a = -Math.PI / 2 + Math.PI * q / 10; P.push([Math.max(0, Math.cos(a) * w), m + Math.sin(a) * h]); } return [f, P]; }), grau);
  // Fluegel: schmal, leicht gepfeilt, nach aussen spitz zulaufend, mit Querrudern und Positionslichtern
  for (const sd of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 2.0); sh.lineTo(19.5, 0.9); sh.lineTo(19.9, 0.55); sh.lineTo(19.5, 0.1); sh.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 }); geo.rotateX(Math.PI / 2); if (sd < 0) geo.rotateZ(Math.PI);
    const w = new THREE.Mesh(geo, grau); w.position.set(sd * 0.55, 2.12, 0.6); w.rotation.z = sd * 0.03; g.add(w);
    for (let k = 0; k < 3; k++) { const a = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.06, 0.35), grau2); a.position.set(sd * (5.55 + k * 4.8), 2.1 + k * 0.15, 2.45 - k * 0.27); a.rotation.z = sd * 0.03; g.add(a); }
    const nav = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: sd < 0 ? 0xff2020 : 0x20ff40 })); nav.position.set(sd * 20.3, 2.75, 1.15); g.add(nav); }
  // Triebwerk oben hinten mit Einlauf und Duese, Pylon, V-Leitwerk
  { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 3.6, 18).rotateX(Math.PI / 2), grau); n.position.set(0, 2.75, 4.6); g.add(n); const e = new THREE.Mesh(new THREE.CircleGeometry(0.5, 18), dunkel); e.position.set(0, 2.75, 2.79); e.rotation.y = Math.PI; g.add(e);
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.8, 16).rotateX(Math.PI / 2), stahl); d.position.set(0, 2.72, 6.7); g.add(d); const s = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 2.0), grau); s.position.set(0, 2.45, 4.2); g.add(s); }
  for (const sd of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(1.9, 0); sh.lineTo(2.2, 3.1); sh.lineTo(1.4, 3.1); sh.lineTo(0, 0); const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false }); geo.translate(0, 0, -0.05);
    geo.rotateX(-sd * 0.8); const t = new THREE.Mesh(geo, grau); t.position.set(sd * 0.2, 2.3, 5.2); t.rotation.y = -Math.PI / 2; g.add(t); }
  // Fahrwerk: Bugrad, zwei Hauptraeder; Sensorkuppel unten, Antennen, Blitzlicht
  const rad = (x, z, h, r) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 8), stahl); s.position.set(x, r + h / 2, z); g.add(s); const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.2, 14).rotateZ(Math.PI / 2), gummi); t.position.set(x, r, z); g.add(t); };
  rad(0, -5.6, 0.85, 0.28); for (const sd of [-1, 1]) rad(sd * 1.1, 0.9, 0.75, 0.38); for (const sd of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.2), stahl); b.position.set(sd * 0.6, 1.12, 0.9); b.rotation.z = sd * 0.2; g.add(b); }
  { const k = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), dunkel); k.position.set(0, 1.12, -3.2); g.add(k); }
  for (const [z, h] of [[-1.0, 0.5], [1.8, 0.4]]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, 0.25), dunkel); a.position.set(0, 2.5 + h / 2, z); g.add(a); }
  const blitz = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); blitz.position.set(0, 3.0, 1.0); g.add(blitz);
  for (const o of g.children) o.castShadow = true;
  g.name = "Aufklärungsdrohne"; g.userData.blitz = blitz; return g;
}
// Drohne einmal anlegen; im Spiel Kreisflug (drohneStep aus tresorStep), in der Werkstatt Stand (drohneStand)
const DROHNE = { g: null, stand: false, a: 0, R: 900, H: 450, V: 60, c: null };
function drohneHolen() { if (!DROHNE.g) { DROHNE.g = buildAufklaerungsdrohne(); DROHNE.g.userData.dynamic = true; scene.add(DROHNE.g); } return DROHNE.g; }
function drohneStand(x, y, z, h) { const g = drohneHolen(); DROHNE.stand = true; g.position.set(x, y, z); g.rotation.set(0, h, 0); }
function drohneStep(dt) { if (DROHNE.stand) return; if (!DROHNE.c) { if (typeof WTO === "undefined") return; DROHNE.c = [WTO.cx, WTO.cz]; drohneHolen(); }
  const D = DROHNE, g = D.g; D.a += dt * D.V / D.R;
  g.position.set(D.c[0] + Math.cos(D.a) * D.R, D.H, D.c[1] + Math.sin(D.a) * D.R); g.rotation.set(0, Math.PI - D.a, 0);   // Nase entlang der Kreisbahn
  g.userData.blitz.visible = Math.sin(performance.now() / 160) > 0.6; }

// ---- Kampfhubschrauber (Nicolas 2026-11-19: "noch so einen Helikopter fuers Militaer, der schiessen kann – als neues Modell, such mal im Internet"). Eigener Entwurf nach der
// ueblichen Bauweise (Vorbilder AH-1 Cobra, AH-64 Apache): schmaler Rumpf, Tandem-Cockpit (Schuetze vorne, Pilot erhoeht dahinter, zwei Glaskuppeln), Sensorkugel an der Nase,
// Kanone im Drehturm unter der Nase, Stummelfluegel mit je einem Raketenbehaelter und zwei Lenkwaffen, zwei Triebwerke seitlich oben, Vierblattrotor, Heckausleger mit Leitwerk,
// Heckrotor und Hoehenflosse, Spornradfahrwerk. Massstab 1,4 (ca. 15 m lang, Rotor ca. 12,6 m).
// Waffen im Flug (khWaffen aus pose): Linksklick oder Q = Kanone (Dauerfeuer, Leuchtspur, 10 Schuss/s, Treffer an Fahrzeugen ueber gunDamage), Rechtsklick oder X = Rakete
// (Rauchspur, Explosion fxBoom, Fahrzeuge im Umkreis 6 m vehHit; alle 0,6 s). Ziel = Bildmitte; Visier und Anzeige (#kh-visier). In der Werkstatt ohne Fahrzeugschaden (dort nur Blitz).
function buildKampfheli(k = 1.4) {
  const { g, i, K, add, blitz } = milHeliTeile(k), { oliv, oliv2, dunkel, stahl, gummi } = K, grau = M(0x3c4436, { roughness: 0.7, metalness: 0.2, flatShading: true }), glasH = M(0x0c141c, { metalness: 0.7, roughness: 0.06, transparent: true, opacity: 0.75 });
  const yb = tabF([[2.75, 1.05], [2.4, 0.8], [1.8, 0.62], [-1.0, 0.66], [-1.9, 1.15]]), yt = tabF([[2.75, 1.18], [2.4, 1.42], [1.9, 1.55], [0.9, 1.72], [-0.2, 1.92], [-1.9, 1.72]]), wd = tabF([[2.75, 0.16], [2.4, 0.36], [1.9, 0.46], [-1.0, 0.5], [-1.9, 0.3]]);
  const FS = []; for (let f = 2.75; f > -1.9; f -= 0.12) FS.push(+f.toFixed(2)); FS.push(-1.9);
  loftIn(i, FS.map(f => { const b = yb(f), t = yt(f), w = wd(f), h = t - b; return [f, [[0, b], [w * 0.7, b], [w, b + 0.25 * h], [w, b + 0.75 * h], [w * 0.6, t], [0, t]]]; }), grau);
  // Tandem-Cockpit: zwei Glaskuppeln mit Rahmen, Sensorkugel an der Nase
  for (const [z, y, sx, sy, sz] of [[-1.75, 1.6, 0.4, 0.34, 0.62], [-0.75, 1.85, 0.44, 0.38, 0.64]]) { const c = add(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glasH, 0, y, z); c.scale.set(sx, sy, sz);
    add(new THREE.BoxGeometry(0.05, 0.05, sz * 2), oliv2, 0, y + sy - 0.02, z); const r = add(new THREE.TorusGeometry(1, 0.03, 6, 20, Math.PI), oliv2, 0, y, z, 0, Math.PI / 2, 0); r.scale.set(sz, sy, sx); }
  add(new THREE.SphereGeometry(0.22, 14, 10), dunkel, 0, 1.0, -2.68); for (const sx of [-0.08, 0.08]) add(new THREE.CircleGeometry(0.06, 12), glasH, sx, 1.02, -2.9, 0, Math.PI, 0);
  // Kanonenturm unter der Nase (dreht zum Ziel)
  const turm = new THREE.Group(); turm.position.set(0, 0.55, -2.05); i.add(turm); add(new THREE.SphereGeometry(0.17, 12, 10), dunkel, 0, 0, 0, 0, 0, 0, turm);
  const rohr = new THREE.Group(); turm.add(rohr); add(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 10), stahl, 0, 0, -0.22, Math.PI / 2, 0, 0, rohr); add(new THREE.CylinderGeometry(0.025, 0.03, 0.85, 8), stahl, 0, 0, -0.65, Math.PI / 2, 0, 0, rohr);
  add(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), dunkel, 0, 0, -1.08, Math.PI / 2, 0, 0, rohr); const mund = new THREE.Object3D(); mund.position.set(0, 0, -1.12); rohr.add(mund);
  // Stummelfluegel mit Raketenbehaelter (innen) und zwei Lenkwaffen (aussen)
  const starts = [];
  for (const sd of [-1, 1]) { const w = add(new THREE.BoxGeometry(1.15, 0.08, 0.75), grau, sd * 1.05, 1.18, 0.2, 0, 0, sd * 0.1);
    add(new THREE.BoxGeometry(0.06, 0.22, 0.4), oliv2, sd * 0.95, 1.02, 0.15); add(new THREE.BoxGeometry(0.06, 0.22, 0.4), oliv2, sd * 1.45, 1.06, 0.15);
    const pod = add(new THREE.CylinderGeometry(0.17, 0.17, 1.0, 14), oliv2, sd * 0.95, 0.8, 0.1, Math.PI / 2, 0, 0); add(new THREE.CircleGeometry(0.16, 14), dunkel, sd * 0.95, 0.8, -0.41, 0, Math.PI, 0);
    for (let q = 0; q < 7; q++) { const a = q / 6 * Math.PI * 2, r = q ? 0.09 : 0; add(new THREE.CircleGeometry(0.03, 8), M(0x101010), sd * 0.95 + Math.cos(a) * r, 0.8 + Math.sin(a) * r, -0.415, 0, Math.PI, 0); }
    const st = new THREE.Object3D(); st.position.set(sd * 0.95, 0.8, -0.5); i.add(st); starts.push(st);
    add(new THREE.BoxGeometry(0.06, 0.05, 1.0), stahl, sd * 1.45, 0.92, 0.15); for (const dx of [-0.11, 0.11]) { add(new THREE.CylinderGeometry(0.055, 0.055, 1.05, 10), M(0xdcdcd4, { roughness: 0.5 }), sd * 1.45 + dx, 0.84, 0.1, Math.PI / 2, 0, 0);
      add(new THREE.ConeGeometry(0.055, 0.16, 10), dunkel, sd * 1.45 + dx, 0.84, -0.5, -Math.PI / 2, 0, 0); } }
  // Triebwerke seitlich oben mit Einlass und Auspuff, Getriebe, Mast, Rotor
  for (const sd of [-1, 1]) { add(new THREE.CylinderGeometry(0.2, 0.22, 1.4, 12), grau, sd * 0.55, 1.88, 0.25, Math.PI / 2, 0, 0); add(new THREE.CircleGeometry(0.17, 12), dunkel, sd * 0.55, 1.88, -0.46, 0, Math.PI, 0);
    add(new THREE.CylinderGeometry(0.13, 0.11, 0.35, 10), dunkel, sd * 0.68, 1.95, 1.05, Math.PI / 2 - 0.3, sd * 0.5, 0); }
  add(new THREE.BoxGeometry(0.7, 0.3, 1.1), grau, 0, 2.02, 0.1); add(new THREE.CylinderGeometry(0.08, 0.11, 0.4, 10), stahl, 0, 2.35, 0.0);
  const rotor = new THREE.Group(); rotor.position.set(0, 2.58, 0.0); i.add(rotor); add(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 14), dunkel, 0, 0, 0, 0, 0, 0, rotor);
  for (let q = 0; q < 4; q++) { const b = add(new THREE.BoxGeometry(0.26, 0.035, 4.4), dunkel, 0, 0.02, 0, 0, q * Math.PI / 2, 0, rotor); b.geometry.translate(0, 0, 2.35); }
  // Heck: Ausleger, Leitwerk, Heckrotor, Hoehenflosse, Spornrad
  add(new THREE.CylinderGeometry(0.24, 0.13, 3.8, 12), grau, 0, 1.55, 3.6, Math.PI / 2 - 0.03, 0, 0);
  { const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(0.8, 0); fin.lineTo(1.2, 1.2); fin.lineTo(0.75, 1.25); fin.lineTo(0, 0.2); const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.08, bevelEnabled: false }); fg.translate(0, 0, -0.04); add(fg, grau, 0, 1.5, 4.95, 0, -Math.PI / 2); }
  add(new THREE.BoxGeometry(1.5, 0.05, 0.4), grau, 0, 1.6, 5.1);
  const heck = new THREE.Group(); heck.position.set(-0.13, 2.45, 5.85); heck.rotation.y = Math.PI / 2; i.add(heck); for (let q = 0; q < 4; q++) add(new THREE.BoxGeometry(0.1, 1.1, 0.02), dunkel, 0, 0, 0, 0, 0, q * Math.PI / 4, heck);
  for (const sd of [-1, 1]) { add(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 8), stahl, sd * 0.55, 0.45, -1.0, 0, 0, sd * 0.35); add(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14), gummi, sd * 0.68, 0.2, -1.0, 0, 0, Math.PI / 2); }
  add(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 8), stahl, 0, 0.75, 5.0, 0.5, 0, 0); add(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), gummi, 0, 0.12, 5.25, 0, 0, Math.PI / 2);
  // Kennung, Hoheitszeichen, Antennen
  for (const sd of [-1, 1]) { const p = add(new THREE.PlaneGeometry(0.9, 0.22), milSchrift("T-410"), sd * 0.43, 1.42, 1.2, 0, sd * Math.PI / 2 - sd * 0.06); p.castShadow = false; const c = add(new THREE.PlaneGeometry(0.3, 0.3), milKreuzSchweiz(), sd * 0.25, 1.6, 3.0, 0, sd * Math.PI / 2 - sd * 0.06); c.castShadow = false; }
  add(new THREE.CylinderGeometry(0.008, 0.012, 0.4, 4), dunkel, 0, 2.15, 1.3);
  const lichter = [add(new THREE.SphereGeometry(0.06, 10, 8), blitz[0], 0, 2.2, 0.9), add(new THREE.SphereGeometry(0.06, 10, 8), blitz[1], 0, 0.6, 0.0), add(new THREE.SphereGeometry(0.05, 8, 6), blitz[2], 0, 2.7, 5.6)];
  g.name = "Kampfhubschrauber"; return { g, rotor, heck, lichter, turm, rohr, mund, starts };
}
const KAMPFHELI = (() => { const b = buildKampfheli(1.4), k = 1.4;
  const H = flyAdd("Kampfhubschrauber", b, k, { spec: { max: 72, acc: 20, up: 11, tilt: 0.28, tiltV: 0.0045, turn: 1.15 }, feet: [[-0.68 * k, -1.0 * k], [0.68 * k, -1.0 * k], [-0.1 * k, 5.25 * k], [0.1 * k, 5.25 * k]] });
  H.camHoch = 5.5; H.mausDreht = true;   // Maus dreht den ganzen Hubschrauber verzoegert (Nicolas 2026-11-19), Kamera folgt nicht selbst nach   // Kamera hoeher: Hubschrauber im unteren Bilddrittel, Visier (Bildmitte) frei ueber ihm (Nicolas 2026-11-19 "Kamera hoeher")
  H.waffen = { turm: b.turm, rohr: b.rohr, mund: b.mund, starts: b.starts, cd: 0, rcd: 0, kanone: false, rak: false, seite: 0, kugeln: [], raketen: [], fx: [] };
  const pose0 = H.pose; H.pose = (B, dt) => { pose0(B, dt); if (typeof khWaffen === "function") khWaffen(B, dt || 0); }; return H; })();
// Waffen: Ziel aus der Bildmitte, Turm folgt, Kugeln und Raketen fliegen bis zum Treffer
const KH_V = new THREE.Vector3(), KH_A = new THREE.Vector3(), KH_B = new THREE.Vector3(), KH_Q = new THREE.Quaternion();
const KH_M = { spur: new THREE.MeshBasicMaterial({ color: 0xffd27a }), rak: new THREE.MeshStandardMaterial({ color: 0xdcdcd4, roughness: 0.5 }), flamme: new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
  rauch: new THREE.MeshBasicMaterial({ color: 0x9a9a9a, transparent: true, opacity: 0.5, depthWrite: false }), blitz: new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }) };
const KH_G = { spur: new THREE.BoxGeometry(0.06, 0.06, 2.2), rak: new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8).rotateX(Math.PI / 2), kugel: new THREE.SphereGeometry(1, 10, 8) };
function khZiel() { camera.updateMatrixWorld(); const o = camera.getWorldPosition(new THREE.Vector3()), d = camera.getWorldDirection(new THREE.Vector3()); KH_A.copy(o).addScaledVector(d, 12);
  for (let s = 12; s < 1500; s += 6) { KH_B.copy(o).addScaledVector(d, s + 6); const h = typeof shotSeg === "function" ? shotSeg(KH_A, KH_B, null, 2) : null; if (h) return h.p; KH_A.copy(KH_B); } return KH_B.clone(); }
function khFx(p, r, life, m) { const o = new THREE.Mesh(KH_G.kugel, m.clone()); o.position.copy(p); o.scale.setScalar(r); o.userData.dynamic = true; scene.add(o); KAMPFHELI.waffen.fx.push({ o, t: 0, life, r, rauch: m === KH_M.rauch, add: m.blending === THREE.AdditiveBlending }); }
function khTreffer(p, hit, rakete) { const v = hit && hit.veh;
  if (rakete) { if (typeof fxBoom === "function") fxBoom(p.clone(), false); else khFx(p, 4, 0.6, KH_M.blitz); if (typeof shotSound === "function") shotSound(0.6, 0.6);
    if (typeof VEH !== "undefined" && typeof vehHit === "function") for (const w of VEH) if (!w.dead && w.g.visible && Math.hypot(w.x - p.x, w.z - p.z) < 6) vehHit(w, p.clone()); }
  else { khFx(p, 0.35, 0.15, KH_M.blitz); if (v && typeof gunDamage === "function") gunDamage(v, p, 12); } }
function khWaffen(B, dt) { const W = B.waffen; if (!W) return; const an = B.on && typeof FLY !== "undefined" && FLY === B;
  const el = document.getElementById("kh-visier") || (() => { const e = document.createElement("div"); e.id = "kh-visier"; e.hidden = true; e.innerHTML = "<i></i><span></span>"; document.body.appendChild(e);
    const st = document.createElement("style"); st.textContent = "#kh-visier{position:fixed;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border:2px solid rgba(120,255,140,.85);border-radius:50%;pointer-events:none;z-index:6}#kh-visier i{position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px;background:#7cff8c;border-radius:50%}#kh-visier span{position:absolute;top:52px;left:50%;transform:translateX(-50%);white-space:nowrap;font:600 12px system-ui;color:#c8ffd0;text-shadow:0 1px 2px #000}#kh-visier[hidden]{display:none}"; document.head.appendChild(st); return e; })();
  el.hidden = !an; W.cd = Math.max(0, W.cd - dt); W.rcd = Math.max(0, W.rcd - dt);
  // Zoom mit dem Mausrad (Nicolas 2026-11-19 "zoomen auch bitte"): 1x bis 6x auf die Bildmitte, weich; beim Aussteigen zurueck
  if (an) { if (!W.fov0) W.fov0 = camera.fov; W.zt = W.zt || 1; W.z = (W.z || 1) + (W.zt - (W.z || 1)) * Math.min(1, dt * 8); const fv = W.fov0 / W.z; if (Math.abs(camera.fov - fv) > 0.01) { camera.fov = fv; camera.updateProjectionMatrix(); } }
  else if (W.fov0) { camera.fov = W.fov0; camera.updateProjectionMatrix(); W.fov0 = null; W.z = W.zt = 1; }
  if (an) { { const dh = Math.atan2(Math.sin(player.yaw - B.h), Math.cos(player.yaw - B.h)), turn = Math.max(-1.2 * dt, Math.min(1.2 * dt, dh * Math.min(1, dt * 2)));   // Hubschrauber dreht verzoegert zur Blickrichtung (hoechstens ca. 70 Grad/s)
      if (Math.abs(turn) > 1e-5 && (typeof batFree !== "function" || batFree(B, B.x, B.y, B.z, B.h + turn))) B.h = Math.atan2(Math.sin(B.h + turn), Math.cos(B.h + turn)); }
    const ziel = khZiel(); B.g.updateMatrixWorld(true);
    { const rk = document.getElementById("kh-rak") || (() => { const e = document.createElement("div"); e.id = "kh-rak"; e.style.cssText = "position:fixed;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:6;border:2px solid rgba(255,200,90,.9);transform:rotate(45deg)"; document.body.appendChild(e); return e; })();
      const fw = B.g.getWorldDirection(new THREE.Vector3()).negate(), q = B.g.position.clone().addScaledVector(fw, 250); q.project(camera); rk.hidden = q.z > 1; rk.style.left = ((q.x + 1) / 2 * innerWidth) + "px"; rk.style.top = ((1 - q.y) / 2 * innerHeight) + "px"; }   // Raketen-Markierung (geradeaus, 250 m)
    // Turm zum Ziel drehen (lokale Richtung im Hubschrauber)
    W.turm.parent.updateMatrixWorld(true); const loc = W.turm.parent.worldToLocal(ziel.clone()).sub(W.turm.position); const yaw = Math.atan2(-loc.x, -loc.z), pit = Math.atan2(loc.y, Math.hypot(loc.x, loc.z));
    W.turm.rotation.y += (Math.max(-1.6, Math.min(1.6, yaw)) - W.turm.rotation.y) * Math.min(1, dt * 8); W.rohr.rotation.x += (Math.max(-1.0, Math.min(0.25, pit)) - W.rohr.rotation.x) * Math.min(1, dt * 8);
    el.querySelector("span").textContent = "Linksklick/Q Kanone (Kreis) · Rechtsklick/X Rakete (Raute, geradeaus)" + (W.rcd > 0 ? " (lädt)" : "") + " · Mausrad Zoom " + (W.z || 1).toFixed(1).replace(".", ",") + "×";
    if (W.kanone && W.cd === 0) { W.cd = 0.1; const m = W.mund.getWorldPosition(new THREE.Vector3()), d = ziel.clone().sub(m).normalize(); d.x += (Math.random() - 0.5) * 0.012; d.y += (Math.random() - 0.5) * 0.012; d.z += (Math.random() - 0.5) * 0.012; d.normalize();
      const o = new THREE.Mesh(KH_G.spur, KH_M.spur); o.position.copy(m); o.lookAt(m.clone().add(d)); o.userData.dynamic = true; scene.add(o); W.kugeln.push({ o, p: m.clone(), d, t: 0 }); khFx(m.clone().addScaledVector(d, 0.3), 0.18, 0.05, KH_M.blitz);
      if (typeof shotSound === "function" && Math.random() < 0.5) shotSound(0.15, 0.12); }
    if (W.rak && W.rcd === 0) { W.rcd = 0.6; W.rak = false; const st = W.starts[W.seite++ % W.starts.length], m = st.getWorldPosition(new THREE.Vector3()), d = B.g.getWorldDirection(new THREE.Vector3()).negate();   // Raketen fliegen geradeaus in Nasenrichtung (Nicolas 2026-11-19)
      const o = new THREE.Mesh(KH_G.rak, KH_M.rak); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 8).rotateX(-Math.PI / 2).translate(0, 0, 0.75), KH_M.flamme); o.add(fl); o.position.copy(m); o.lookAt(m.clone().add(d)); o.userData.dynamic = true; scene.add(o);
      W.raketen.push({ o, p: m.clone(), d, v: 60, t: 0, rt: 0 }); if (typeof shotSound === "function") shotSound(0.35, 0.4); } }
  else { W.kanone = false; W.rak = false; const rk = document.getElementById("kh-rak"); if (rk) rk.hidden = true; }
  // Kugeln (600 m/s), Raketen (beschleunigen auf 180 m/s, Rauchspur), Blitze und Rauch ausblenden
  for (let q = W.kugeln.length - 1; q >= 0; q--) { const K = W.kugeln[q]; K.t += dt; const n = K.p.clone().addScaledVector(K.d, 600 * dt), h = typeof shotSeg === "function" ? shotSeg(K.p, n, null, 1) : null;
    if (h || K.t > 2.5) { if (h) khTreffer(h.p, h.hit, false); scene.remove(K.o); W.kugeln.splice(q, 1); continue; } K.p.copy(n); K.o.position.copy(n); }
  for (let q = W.raketen.length - 1; q >= 0; q--) { const R = W.raketen[q]; R.t += dt; R.v = Math.min(180, R.v + 240 * dt); const n = R.p.clone().addScaledVector(R.d, R.v * dt), h = typeof shotSeg === "function" ? shotSeg(R.p, n, null, 0.8) : null;
    R.rt += dt; if (R.rt > 0.03) { R.rt = 0; khFx(R.p.clone(), 0.35, 1.2, KH_M.rauch); }
    if (h || R.t > 6) { khTreffer(h ? h.p : R.p, h && h.hit, true); scene.remove(R.o); W.raketen.splice(q, 1); continue; } R.p.copy(n); R.o.position.copy(n); }
  for (let q = W.fx.length - 1; q >= 0; q--) { const F = W.fx[q]; F.t += dt; const u = F.t / F.life; if (u >= 1) { scene.remove(F.o); F.o.material.dispose(); W.fx.splice(q, 1); continue; }
    F.o.scale.setScalar(F.r * (1 + u * (F.rauch ? 2 : 0.6))); F.o.material.opacity = (1 - u) * (F.add ? 1 : 0.5); } }
// Bedienung: Maus (bei gefangener Maus) und Tasten Q/X, nur im fliegenden Kampfhubschrauber
addEventListener("mousedown", e => { if (!(typeof FLY !== "undefined" && FLY === KAMPFHELI && KAMPFHELI.on && document.pointerLockElement)) return;
  if (e.button === 0) KAMPFHELI.waffen.kanone = true; else if (e.button === 2) KAMPFHELI.waffen.rak = true; else return; e.preventDefault(); e.stopImmediatePropagation(); }, true);
addEventListener("mouseup", e => { if (e.button === 0) KAMPFHELI.waffen.kanone = false; }, true);
addEventListener("keydown", e => { if (!(typeof FLY !== "undefined" && FLY === KAMPFHELI && KAMPFHELI.on) || e.repeat) return; if (e.code === "KeyQ") KAMPFHELI.waffen.kanone = true; else if (e.code === "KeyX") KAMPFHELI.waffen.rak = true; });
addEventListener("keyup", e => { if (e.code === "KeyQ") KAMPFHELI.waffen.kanone = false; });
addEventListener("wheel", e => { if (!(typeof FLY !== "undefined" && FLY === KAMPFHELI && KAMPFHELI.on)) return; e.preventDefault(); const W = KAMPFHELI.waffen; W.zt = Math.max(1, Math.min(6, (W.zt || 1) * (e.deltaY < 0 ? 1.25 : 0.8))); if (W.zt < 1.05) W.zt = 1; }, { passive: false });
const khZoomK = () => typeof FLY !== "undefined" && FLY === KAMPFHELI && KAMPFHELI.on ? (KAMPFHELI.waffen.z || 1) : 1;   // feinere Maus beim Zoomen (bedienung.js ueber zoomK)
