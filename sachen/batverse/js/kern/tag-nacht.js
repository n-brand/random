// Batverse – Tag und Nacht, unter der Erde
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Tag und Nacht =====================
let night = 0, nightTarget = 0, under = 0;                                   // under: 1 = unter der Erde (Tiefgarage), Sonne/Himmel aus, Kunstlicht an
const SUN_DAYC = new THREE.Color(0xfff2d6), SUN_NIGHTC = new THREE.Color(0x7f9ce8);
function applyNight() {
  scene.background.copy(SKY_DAY).lerp(SKY_NIGHT, night);
  scene.fog.color.copy(scene.background);
  sun.color.copy(SUN_DAYC).lerp(SUN_NIGHTC, night);
  const aus = typeof LICHT_AUS !== "undefined" ? LICHT_AUS.k : 0;   // Stromausfall unten (N15, gotham-unterstrasse.js): nur solange man in einer unteren Strasse ist (k > 0)
  sun.intensity = lerp(2.4, 0.5, night) * (1 - under) * (1 - 0.9 * aus);
  hemi.intensity = lerp(1.0, 0.16, night) * (1 - 0.8 * under) * (1 - 0.85 * aus);
  cave.intensity = 1.1 * under * (1 - 0.9 * aus);
  for (const l of caveLights) l.intensity = l.userData.I * under;
  mat.facade.emissiveIntensity = night * 1.2;
  if (mat.gateLamp) mat.gateLamp.emissiveIntensity = 0.15 + night * 2.6;
}
applyNight();
