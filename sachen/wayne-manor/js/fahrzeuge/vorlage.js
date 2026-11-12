function buildGemini() {
  const g = new THREE.Group();
  const bodyM = M(0x161a22, { metalness: 0.7, roughness: 0.25 }), accentM = M(0x1a2332, { metalness: 0.5, roughness: 0.4 });
  const glassM = M(0x05080e, { roughness: 0.05, metalness: 0.9 }), chromeM = M(0xe8eaec, { metalness: 0.95, roughness: 0.1 });
  const tireM = M(0x121212, { roughness: 0.9 }), rimM = M(0x1a8cff, { metalness: 0.8, roughness: 0.2 });

  // Aerodynamisches Seitenprofil für den Sportwagen (flache Front, geschwungene Kabine, flaches Heck)
  prismIn(g, [
    [2.5, 0.35], [2.2, 0.75], [1.1, 1.05], [-0.8, 1.12], 
    [-2.0, 0.85], [-2.5, 0.55], [-2.5, 0.3], [2.5, 0.3]
  ], 1.85, bodyM);

  // Cockpit-Glasverkleidung (Kabine)
  prismIn(g, [
    [1.0, 1.06], [0.6, 1.35], [-0.8, 1.38], [-1.2, 1.1]
  ], 1.5, glassM, 0);

  // Seitenakzente und Gemini-Leuchtstreifen
  for (const sd of [-1, 1]) {
    boxIn(g, sd * 0.94 - 0.02, sd * 0.94 + 0.02, 0.6, 0.95, -1.8, 1.6, accentM);
    boxIn(g, sd * 0.95 - 0.01, sd * 0.95 + 0.01, 0.82, 0.86, -2.4, -2.38, mat.glow); // LED-Streifen
    boxIn(g, sd * 0.8 - 0.15, sd * 0.8 + 0.15, 0.65, 0.75, -2.52, -2.48, mat.glow); // Scheinwerfer
    boxIn(g, sd * 0.75 - 0.15, sd * 0.75 + 0.15, 0.7, 0.78, 2.48, 2.52, mat.glowRed); // Rücklicht-Leiste
  }

  // Frontsplitter und Heckspoiler
  boxIn(g, -1.1, 1.1, 0.28, 0.42, -2.55, -2.4, accentM);
  boxIn(g, -1.0, 1.0, 1.25, 1.32, 2.1, 2.4, accentM);
  meshIn(g, new THREE.BoxGeometry(2.1, 0.04, 0.45), chromeM, 0, 1.25, 2.25);

  mergeStatic(g);

  // Sport-Räder mit coolen Felgen
  const wheels = [
    addWheel(g, -0.92, -1.5, 0.44, 0.36, true, tireM, rimM, 8, 24),
    addWheel(g, 0.92, -1.5, 0.44, 0.36, true, tireM, rimM, 8, 24),
    addWheel(g, -0.92, 1.5, 0.46, 0.38, false, tireM, rimM, 8, 24),
    addWheel(g, 0.92, 1.5, 0.46, 0.38, false, tireM, rimM, 8, 24)
  ];
  return { g, wheels };
}

// Physik- und Steuerungs-Spezifikation für den Gemini GT (schnell, mit Sprung-Funktion wie der Tumbler)
const SPEC_GEMINI = { name: "Gemini Concept GT", wheels: [[-0.92, -1.5], [0.92, -1.5], [-0.92, 1.5], [0.92, 1.5]], wb: 3.0, track: 1.84, pts: [-1.6, 0, 1.6], R: 1.1, circR: 1.05, enter: 3.8,
  maxN: 35, maxF: 58, acc: 16, steer: 0.7, jump: true, grade: 45, camD: 8.5, camH: 1.2, seat: [0, 1.2, 0.1], bodyH: 1.6, bike: false,
  exits: [[-1.9, -0.2], [1.9, -0.2], [-1.9, 1.3], [1.9, 1.3], [0, -3.8], [0, 3.8]],
  msg: "Gemini Concept GT: W/S Gas/Bremse, A/D lenken, Shift schneller, Leertaste Sprung, V Kamera, R zurücksetzen, L Autoaufzug, E aussteigen" };

const geminiModell = buildGemini();
  addVehicle(SPEC_GEMINI, geminiModell, -32.0, -13, LY, 0, "Gemini Concept GT (Batcave)", 0x161a22);