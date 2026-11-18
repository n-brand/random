// Batverse – Schusswaffen zu Fuss (Nicolas 2026-11-16: "3D-Maschinengewehr und 3D-Pistole, 2D-Ansichten fuers Inventar, in der Hand die 3D-Variante, noch eine Sniper und eine Schrotflinte").
// Klassisches Skript nach spieler/waffen.js (Spiel und Werkstatt). Vier Waffen als Gegenstaende (Art "Waffe", inventar.js): pistole, mg, sniper, schrotflinte, dazu Munition.
// In der Hand: 3D-Modell in eigener Szene (GUN.scene), nach dem Hauptbild ueber alles gezeichnet (gunRender aus schleife.js / werkstatt.js, Tiefe geloescht: keine Waende im Gewehr).
// Schiessen: Linksklick (MG haelt Dauerfeuer), Treffer per shotSeg vom Auge aus (Streuung, Schrot 8 Kugeln), Funken/Staub am Treffer, Leuchtspur, Muendungsfeuer, Rueckstoss.
// Rechts halten = zielen (Waffe leicht zur Mitte und tiefer, die Bildmitte bleibt frei – Nicolas 2026-11-17; Sniper: Zielfernrohr 6-fach). Magazin, R laedt nach (leer: automatisch), Stand im Browser (wm-guns).
"use strict";
const GUN_SPEC = {
  pistole: { name: "Pistole", dmg: 10, ammo: "munition", mag: 12, rate: 0.16, auto: false, pellets: 1, spread: 0.012, spreadAim: 0.003, range: 90, zoom: 1.5, kick: 0.018, reload: 1.3, snd: [0.55, 0.16, 2600], hip: [0.14, -0.14, -0.42], ads: [0.1, -0.2, -0.44] },
  mg: { name: "Maschinengewehr", dmg: 7, ammo: "munition", mag: 40, rate: 0.085, auto: true, pellets: 1, spread: 0.022, spreadAim: 0.007, range: 160, zoom: 1.8, kick: 0.01, reload: 2.2, snd: [0.6, 0.14, 1900], hip: [0.17, -0.2, -0.38], ads: [0.12, -0.25, -0.42] },
  sniper: { name: "Scharfschützengewehr", dmg: 70, ammo: "gewehrmunition", mag: 5, rate: 1.1, auto: false, pellets: 1, spread: 0.03, spreadAim: 0, range: 420, zoom: 6, kick: 0.05, reload: 2.6, snd: [0.95, 0.38, 1400], hip: [0.19, -0.25, -0.46], ads: [0, -0.15, -0.3], scope: true },
  // EMP-Gewehr (Nicolas 2026-11-17, Filmbild "wie nennt man diese Waffe" -> "bau es jetzt"): keine Munition, 3 Ladungen, je 5 s Aufladen; der Puls legt Fahrzeuge und Busse
  // im Umkreis empR fuer empT Sekunden lahm (Motor aus). Wirkung in emp-Teil unten (empFire), Fahrzeuge pruefen v.empT (fahren.js carStep, Werkstatt fahren).
  emp: { name: "EMP-Gewehr", dmg: 0, ammo: null, emp: true, mag: 3, recharge: 5, rate: 0.9, auto: false, pellets: 1, spread: 0, spreadAim: 0, range: 120, zoom: 1.6, kick: 0.03, reload: 0, snd: [0.7, 0.55, 500], hip: [0.18, -0.21, -0.42], ads: [0.12, -0.25, -0.46], empR: 9, empT: 15 },
  schrotflinte: { name: "Schrotflinte", dmg: 6, ammo: "schrot", mag: 6, rate: 0.8, auto: false, pellets: 9, spread: 0.07, spreadAim: 0.05, range: 45, zoom: 1.4, kick: 0.045, reload: 2.4, snd: [1, 0.3, 1100], hip: [0.17, -0.2, -0.38], ads: [0.12, -0.25, -0.42] },
};
const GUN = { scene: new THREE.Scene(), models: {}, cur: null, g: null, mag: {}, cd: 0, trig: false, rel: 0, kick: 0, flashT: 0, ads: 0, fx: [], audio: null,
  v: new THREE.Vector3(), d: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Quaternion() };
try { const d = JSON.parse(localStorage.getItem("wm-guns") || "null"); if (d) GUN.mag = d; } catch (e) {}
const gunSave = () => { try { localStorage.setItem("wm-guns", JSON.stringify(GUN.mag)); } catch (e) {} };
for (const id in GUN_SPEC) if (GUN.mag[id] === undefined) GUN.mag[id] = GUN_SPEC[id].mag;
// Licht der Hand-Szene (eigene Szene, folgt nicht dem Tag: Waffe immer gut sichtbar, nachts etwas dunkler)
GUN.hemi = new THREE.HemisphereLight(0xdfe8ff, 0x3a3328, 1.1); GUN.sun = new THREE.DirectionalLight(0xffffff, 2.2); GUN.sun.position.set(0.7, 1, 0.4); GUN.fill = new THREE.DirectionalLight(0xbcd4ff, 0.9); GUN.fill.position.set(-1, 0.3, -0.6); GUN.scene.add(GUN.hemi, GUN.sun, GUN.sun.target, GUN.fill, GUN.fill.target);

// ---- Modelle (Meter, Lauf nach -z, Ursprung am Griff) ----
const GUN_MAT = {
  metall: new THREE.MeshStandardMaterial({ color: 0x30343a, metalness: 0.35, roughness: 0.42 }),
  grau: new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.3, roughness: 0.5 }),
  kunst: new THREE.MeshStandardMaterial({ color: 0x2c3034, metalness: 0.05, roughness: 0.8 }),
  holz: new THREE.MeshStandardMaterial({ color: 0x6e4526, metalness: 0.05, roughness: 0.6 }),
  oliv: new THREE.MeshStandardMaterial({ color: 0x4a5236, metalness: 0.15, roughness: 0.7 }),
  glas: new THREE.MeshStandardMaterial({ color: 0x1f3d5c, metalness: 0.9, roughness: 0.1, emissive: 0x0a1a2a }),
  messing: new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: 0.4, roughness: 0.35 }),
  schwarz: new THREE.MeshStandardMaterial({ color: 0x16181c, metalness: 0.3, roughness: 0.45 }),
  empGlow: new THREE.MeshBasicMaterial({ color: 0x8ff0ff }),
  empDim: new THREE.MeshBasicMaterial({ color: 0x1a5a70 }),
};
function gunBuild(id) {
  const g = new THREE.Group(), M = GUN_MAT;
  const box = (m, w, h, l, x, y, z, rx = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m); o.position.set(x, y, z); o.rotation.x = rx; g.add(o); return o; };
  const cyl = (m, r, l, x, y, z, r2 = r, seg = 14) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, l, seg), m); o.rotation.x = Math.PI / 2; o.position.set(x, y, z); g.add(o); return o; };
  const prof = (m, pts, w, x = 0) => { const sh = new THREE.Shape(); pts.forEach(([z, y], i) => sh[i ? "lineTo" : "moveTo"](z, y)); const ge = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1 }); ge.translate(0, 0, -w / 2); const o = new THREE.Mesh(ge, m); o.rotation.y = -Math.PI / 2; o.position.x = x; g.add(o); return o; };   // Seitenprofil (z, y), quer extrudiert
  const guard = (x, y, z, r) => { const o = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0035, 6, 14, Math.PI), M.metall); o.rotation.set(0, Math.PI / 2, Math.PI); o.position.set(x, y, z); g.add(o); };
  let muzzle;
  if (id === "emp") {   // EMP-Gewehr: kantiger schwarzer Koerper, Kuehlrippen oben, breites Emitter-Gehaeuse vorne mit leuchtendem Ring, Ladeanzeige seitlich
    box(M.schwarz, 0.07, 0.1, 0.36, 0, 0.07, -0.14);                           // Gehaeuse
    box(M.kunst, 0.075, 0.03, 0.3, 0, 0.13, -0.15);                            // Deckel
    for (let k = 0; k < 4; k++) box(M.grau, 0.006, 0.06, 0.05, -0.024 + k * 0.016, 0.17, 0.0);   // senkrechte Rippen oben hinten
    box(M.schwarz, 0.13, 0.15, 0.14, 0, 0.08, -0.4);                           // Emitter-Gehaeuse
    box(M.kunst, 0.14, 0.16, 0.02, 0, 0.08, -0.33);                            // Kragen
    for (let k = 0; k < 3; k++) box(M.empGlow, 0.132, 0.006, 0.01, 0, 0.03 + k * 0.05, -0.47);   // Leuchtstreifen
    { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.011, 8, 32), M.empGlow); ring.scale.set(1, 1.22, 1); ring.position.set(0, 0.08, -0.475); g.add(ring);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.052, 24), M.empDim); disc.scale.set(1, 1.22, 1); disc.rotation.y = Math.PI; disc.position.set(0, 0.08, -0.474); g.add(disc); }
    box(M.kunst, 0.032, 0.1, 0.045, 0, 0.0, 0.0, 0.3); guard(0, 0.03, -0.045, 0.02);   // Griff, Abzugsbuegel
    prof(M.kunst, [[0.03, 0.115], [0.25, 0.105], [0.28, 0.085], [0.28, -0.005], [0.245, -0.012], [0.14, 0.04], [0.06, 0.035], [0.03, 0.045]], 0.045);   // Schulterstuetze als Profil (2026-11-18)
    for (let k = 0; k < 3; k++) box(M.empGlow, 0.004, 0.012, 0.03, 0.037, 0.09, -0.1 - k * 0.04);   // Ladeanzeige
    muzzle = [0, 0.08, -0.49];
  } else if (id === "pistole") {
    box(M.metall, 0.03, 0.03, 0.19, 0, 0.105, -0.06);                      // Schlitten
    for (let k = 0; k < 6; k++) box(M.grau, 0.031, 0.022, 0.003, 0, 0.106, 0.012 + k * 0.006);   // Rillen hinten
    prof(M.kunst, [[-0.15, 0.094], [0.03, 0.094], [0.048, 0.086], [0.05, 0.062], [0.08, -0.05], [0.033, -0.058], [0.004, 0.042], [-0.012, 0.05], [-0.06, 0.05], [-0.066, 0.072], [-0.15, 0.072]], 0.028);   // Griffstueck mit Griff (Profil, neu 2026-11-18)
    for (let k = 0; k < 5; k++) box(M.grau, 0.03, 0.004, 0.022, 0, 0.0 + k * 0.016, 0.042 - k * 0.005, -0.42);   // Riffelung am Griff
    box(M.grau, 0.026, 0.01, 0.05, 0, -0.058, 0.058, -0.2);                 // Magazinboden
    guard(0, 0.068, -0.03, 0.019); box(M.metall, 0.004, 0.016, 0.004, 0, 0.065, -0.025);   // Abzugsbuegel, Abzug
    cyl(M.grau, 0.0065, 0.012, 0, 0.105, -0.158);                           // Laufmuendung
    box(M.metall, 0.006, 0.007, 0.006, 0, 0.123, -0.145); box(M.metall, 0.018, 0.007, 0.006, 0, 0.123, 0.025);   // Korn, Kimme
    muzzle = [0, 0.105, -0.165];
  } else if (id === "mg") {
    // neu (Nicolas 2026-11-18: "Maschinenpistole auch"): oberes und unteres Gehaeuse, Schiene mit Zaehnen, achteckiger Handschutz mit Schlitzen, Lauf mit Feuerdaempfer,
    // gebogenes Magazin, Pistolengriff schraeg, Schaftrohr mit verstellbarer Schulterstuetze, Rotpunktvisier als Roehre
    box(M.metall, 0.044, 0.05, 0.3, 0, 0.1, -0.1);                          // oberes Gehaeuse
    box(M.metall, 0.04, 0.045, 0.2, 0, 0.055, -0.08);                       // unteres Gehaeuse (Magazinschacht)
    box(M.grau, 0.026, 0.01, 0.56, 0, 0.13, -0.25); for (let k = 0; k < 26; k++) box(M.grau, 0.03, 0.006, 0.01, 0, 0.137, 0.02 - k * 0.021);   // Schiene mit Zaehnen
    cyl(M.kunst, 0.031, 0.3, 0, 0.098, -0.4, 0.031, 8); for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) box(M.grau, 0.004, 0.012, 0.035, sx * 0.03, 0.098, -0.3 - k * 0.05);   // Handschutz mit Schlitzen
    cyl(M.metall, 0.011, 0.2, 0, 0.098, -0.64); cyl(M.grau, 0.016, 0.065, 0, 0.098, -0.765, 0.016, 6);   // Lauf, Feuerdaempfer
    { const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([-0.15 - 0.075 * t * t, 0.045 - 0.17 * t]); } for (let k = 8; k >= 0; k--) { const t = k / 8; pts.push([-0.085 - 0.06 * t * t, 0.045 - 0.165 * t]); } prof(M.metall, pts, 0.028); }   // gebogenes Magazin (Profil)
    box(M.kunst, 0.032, 0.1, 0.042, 0, 0.0, 0.01, 0.38);                    // Pistolengriff
    guard(0, 0.034, -0.04, 0.02); box(M.metall, 0.005, 0.02, 0.005, 0, 0.025, -0.045, 0.3);   // Abzugsbuegel, Abzug
    cyl(M.metall, 0.016, 0.17, 0, 0.098, 0.135);                             // Schaftrohr
    box(M.kunst, 0.04, 0.085, 0.13, 0, 0.078, 0.2); box(M.kunst, 0.042, 0.105, 0.016, 0, 0.07, 0.272);   // Schulterstuetze, Kappe
    box(M.grau, 0.018, 0.012, 0.02, 0, 0.122, 0.04);                        // Ladehebel
    cyl(M.metall, 0.021, 0.07, 0, 0.165, -0.06); box(M.metall, 0.022, 0.022, 0.05, 0, 0.145, -0.06); box(M.glas, 0.028, 0.028, 0.003, 0, 0.165, -0.096);   // Rotpunktvisier
    box(M.metall, 0.01, 0.01, 0.2, 0.014, 0.065, -0.47, 0.04); box(M.metall, 0.01, 0.01, 0.2, -0.014, 0.065, -0.47, 0.04);   // Zweibein (eingeklappt)
    box(M.messing, 0.012, 0.012, 0.03, 0.025, 0.1, -0.1);                    // Auswurf
    muzzle = [0, 0.098, -0.8];
  } else if (id === "sniper") {
    box(M.metall, 0.045, 0.055, 0.28, 0, 0.075, -0.1);                      // Verschluss
    cyl(M.metall, 0.012, 0.6, 0, 0.08, -0.54, 0.0095); cyl(M.grau, 0.02, 0.08, 0, 0.08, -0.88);   // Lauf, Muendungsbremse
    box(M.oliv, 0.05, 0.06, 0.36, 0, 0.055, -0.33);                         // Vorderschaft
    prof(M.oliv, [[0.04, 0.1], [0.2, 0.1], [0.23, 0.125], [0.345, 0.125], [0.36, 0.105], [0.36, -0.04], [0.31, -0.045], [0.17, 0.02], [0.07, 0.03], [0.04, 0.05]], 0.045);   // Schaft mit Wangenauflage als Profil (2026-11-18)
    box(M.kunst, 0.05, 0.17, 0.02, 0, 0.04, 0.37);                          // Schaftkappe
    box(M.oliv, 0.034, 0.1, 0.045, 0, -0.005, 0.02, 0.3); guard(0, 0.035, -0.04, 0.02);   // Griff
    box(M.metall, 0.03, 0.06, 0.05, 0, 0.02, -0.12);                        // Magazin
    cyl(M.metall, 0.019, 0.3, 0, 0.15, -0.1); cyl(M.metall, 0.03, 0.07, 0, 0.15, -0.28, 0.019); cyl(M.metall, 0.019, 0.05, 0, 0.15, 0.07, 0.026);   // Zielfernrohr
    cyl(M.glas, 0.027, 0.004, 0, 0.15, -0.316);
    for (const z of [-0.17, -0.03]) box(M.metall, 0.03, 0.04, 0.02, 0, 0.115, z);   // Montageringe
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 10), M.grau); t1.position.set(0, 0.18, -0.1); g.add(t1);
    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 10), M.grau); t2.rotation.z = Math.PI / 2; t2.position.set(0.03, 0.15, -0.1); g.add(t2);   // Tuerme
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), M.metall); bolt.position.set(0.055, 0.07, 0.0); g.add(bolt); box(M.metall, 0.04, 0.008, 0.008, 0.035, 0.075, 0.0);   // Kammerstengel
    box(M.metall, 0.01, 0.012, 0.22, 0.02, 0.025, -0.52, 0.04); box(M.metall, 0.01, 0.012, 0.22, -0.02, 0.025, -0.52, 0.04);   // Zweibein
    muzzle = [0, 0.08, -0.93];
  } else {                                                                   // schrotflinte (Vorderschaftrepetierer)
    // neu (Nicolas 2026-11-18: "schau dann nochmal die Shotgun an"): Gehaeuse laenger mit Auswurf, Lauf mit Laufschiene, Magazinrohr mit Kappe und Laufschelle,
    // Pumpe mit Rillen, Abzugsbuegel mit Abzug, Holzschaft aus Hals und Kolben, nach hinten abfallend, mit Schaftkappe (vorher flache schraege Platte)
    box(M.metall, 0.044, 0.072, 0.25, 0, 0.076, -0.075);                      // Gehaeuse
    box(M.kunst, 0.004, 0.026, 0.07, 0.023, 0.086, -0.07);                   // Auswurfoeffnung rechts
    box(M.metall, 0.03, 0.012, 0.06, 0, 0.034, -0.03);                       // Abzugsplatte unten
    cyl(M.metall, 0.0115, 0.5, 0, 0.099, -0.45); box(M.metall, 0.008, 0.006, 0.48, 0, 0.113, -0.45);   // Lauf, Laufschiene
    cyl(M.metall, 0.0115, 0.43, 0, 0.061, -0.415); cyl(M.metall, 0.0125, 0.02, 0, 0.061, -0.635);   // Roehrenmagazin, Kappe
    { const cl = box(M.metall, 0.03, 0.05, 0.016, 0, 0.08, -0.6); cl.material = M.metall; }   // Laufschelle
    const pump = cyl(M.holz, 0.024, 0.17, 0, 0.064, -0.36); for (let k = 0; k < 6; k++) cyl(M.kunst, 0.0245, 0.006, 0, 0.064, -0.3 - k * 0.022);   // Pumpe mit Rillen
    GUN.pump = pump;
    guard(0, 0.036, -0.03, 0.022); box(M.metall, 0.006, 0.022, 0.006, 0, 0.022, -0.035, 0.3);   // Abzugsbuegel, Abzug
    { const sh = new THREE.Shape(); sh.moveTo(0.04, 0.106); sh.lineTo(0.37, 0.088); sh.lineTo(0.37, -0.035); sh.quadraticCurveTo(0.25, -0.01, 0.15, 0.03); sh.quadraticCurveTo(0.09, 0.05, 0.07, 0.02); sh.lineTo(0.045, 0.02); sh.lineTo(0.04, 0.04); sh.lineTo(0.04, 0.106);
      const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.032, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 10 }); sg.translate(0, 0, -0.016);
      const st = new THREE.Mesh(sg, M.holz); st.rotation.y = -Math.PI / 2; g.add(st); }   // Holzschaft als Seitenprofil: Hals mit Pistolengriff-Bogen, gerader Ruecken, Kolben
    box(M.kunst, 0.042, 0.13, 0.018, 0, 0.027, 0.38);                        // Schaftkappe
    box(M.messing, 0.008, 0.008, 0.008, 0, 0.11, -0.715);                    // Korn
    box(M.messing, 0.012, 0.016, 0.03, 0.026, 0.075, -0.08);                 // Patrone im Auswurf
    cyl(M.metall, 0.0125, 0.02, 0, 0.062, -0.62);
    muzzle = [0, 0.095, -0.73];
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  g.userData.muzzle = new THREE.Vector3(...muzzle);
  // Muendungsfeuer
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: GUN_FLASH_TEX, color: 0xffd27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); fl.position.copy(g.userData.muzzle); fl.position.z -= 0.03;
  fl.scale.setScalar(id === "pistole" ? 0.12 : id === "schrotflinte" ? 0.22 : 0.18); fl.visible = false; g.add(fl); g.userData.flash = fl;
  return g;
}
const GUN_FLASH_TEX = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,230,1)"); gr.addColorStop(0.3, "rgba(255,190,80,.9)"); gr.addColorStop(1, "rgba(255,120,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  x.strokeStyle = "rgba(255,230,160,.9)"; x.lineWidth = 3; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; x.beginPath(); x.moveTo(32, 32); x.lineTo(32 + Math.cos(a) * 31, 32 + Math.sin(a) * 31); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const gunModel = id => GUN.models[id] || (GUN.models[id] = gunBuild(id));

// ---- Inventar: Gegenstaende, Symbole (Seitenansicht, Lauf nach rechts), Beschreibungen ----
const GUN_SVG = {
  pistole: '<path d="M3 6.6H22.4Q23.2 6.6 23.2 7.4V10Q23.2 10.6 22.4 10.6H3Q2.4 10.6 2.4 10V7.2Q2.4 6.6 3 6.6Z" fill="#2a2d32" stroke="#8b9198" stroke-width=".5"/><path d="M4.4 7.4v2.4M5.5 7.4v2.4M6.6 7.4v2.4" stroke="#5a5f66" stroke-width=".5"/><rect x="9.6" y="10.6" width="12" height="1.3" fill="#22252a" stroke="#8b9198" stroke-width=".4"/><path d="M3.4 10.6H10.8L10.4 12.2L8.9 21.2Q8.7 22.2 7.7 22.2H3.6Q2.6 22.2 2.8 21.2L3.6 13.2Q3.7 11.6 3.4 10.6Z" fill="#22252a" stroke="#8b9198" stroke-width=".5" stroke-linejoin="round"/><path d="M4.6 14.4h3.6M4.4 16.2h3.6M4.2 18h3.6M4 19.8h3.6" stroke="#3c4046" stroke-width=".5"/><path d="M10.4 12.2H14.6Q15.3 12.2 15.1 13Q14.6 15.1 12.2 15.2H9.9" fill="none" stroke="#8b9198" stroke-width=".8" stroke-linecap="round"/><path d="M12.3 12.4Q12.9 13.6 12.2 14.4" fill="none" stroke="#8b9198" stroke-width=".7" stroke-linecap="round"/><rect x="2.6" y="21.6" width="6.4" height="1" rx=".4" fill="#4a4f56"/><rect x="21.2" y="5.8" width=".9" height=".9" fill="#8b9198"/><rect x="3.4" y="5.8" width="1.6" height=".9" fill="#8b9198"/><rect x="23.2" y="7.8" width=".5" height="1.2" fill="#111"/>',   // Pistole neu gezeichnet (Nicolas 2026-11-17: Griff sah falsch aus): Griff schraeg nach hinten, Abzugsbuegel, Magazinboden
  mg: '<path d="M1 11.5 L5.5 10.6 H14.5 V9.4 H16 V10.6 H19.6 V11.4 H25 V12.6 H19.6 V14 H13.6 L12.6 18.8 H10.6 L11 14 H9.4 L8.6 16.6 H6.8 L7.4 13.8 L5.5 13.6 L1 15 Z" fill="#26292d" stroke="#8b9198" stroke-width=".5" stroke-linejoin="round"/><rect x="14.2" y="11.2" width="4.6" height="2.2" fill="#3c4148"/>',
  sniper: '<path d="M1 12 L6 11 H15.5 V11.6 H25 V12.5 H15.5 V13.6 H10.6 L9.8 16.6 H8.2 L8.6 13.8 L6 13.8 L1 15.4 Z" fill="#4a5236" stroke="#9aa184" stroke-width=".5" stroke-linejoin="round"/><rect x="8.6" y="7.6" width="7.6" height="2" rx=".9" fill="#1c1e22" stroke="#8b9198" stroke-width=".4"/><path d="M10 9.6 V11 M14.6 9.6 V11" stroke="#8b9198" stroke-width=".6"/>',
  emp: '<path d="M1 12 L4 10.4 H13 V9 H15 V8.4 H22.6 Q24.4 8.4 24.4 10.2 V15.6 Q24.4 17.4 22.6 17.4 H15 V15.2 H11.4 L10.4 19.2 H8.4 L8.8 15.2 H4 L1 14.4 Z" fill="#16181c" stroke="#7f8a96" stroke-width=".5" stroke-linejoin="round"/><path d="M5 9.6V8M6.2 9.6V8M7.4 9.6V8" stroke="#7f8a96" stroke-width=".6"/><rect x="22.4" y="9.2" width="1.6" height="7.4" rx=".8" fill="#8ff0ff"/><rect x="16.4" y="11.4" width="4.6" height=".8" fill="#8ff0ff"/><rect x="16.4" y="13.2" width="4.6" height=".8" fill="#8ff0ff"/><rect x="9.6" y="11.8" width=".8" height=".8" fill="#8ff0ff"/><rect x="11" y="11.8" width=".8" height=".8" fill="#8ff0ff"/>',
  schrotflinte: '<path d="M1 12.6 L7 11 H11.6 V11.4 H25 V12.4 H11.6 V13.6 L9.4 13.7 L8.4 16.4 H6.8 L7.2 13.8 L1 16 Z" fill="#6e4526" stroke="#b08a63" stroke-width=".5" stroke-linejoin="round"/><rect x="7" y="10.9" width="4.8" height="2.9" fill="#26292d"/><rect x="13" y="13.2" width="11" height="1.1" fill="#26292d"/><rect x="14.6" y="12.7" width="4.6" height="2.1" rx=".8" fill="#8a5a33"/>',
};
const GUN_AMMO = {
  gewehrmunition: { name: "Gewehrpatronen", art: "Munition", stack: 40, svg: '<g fill="#c9a14a" stroke="#6b5422" stroke-width=".4"><path d="M7 21 V9 L8.5 5 L10 9 V21 Z"/><path d="M12 21 V9 L13.5 5 L15 9 V21 Z"/><path d="M17 21 V9 L18.5 5 L20 9 V21 Z"/></g><path d="M7 9 H10 M12 9 H15 M17 9 H20" stroke="#8a6b2c"/>' },
  schrot: { name: "Schrotpatronen", art: "Munition", stack: 32, svg: '<g stroke="#5a1414" stroke-width=".4"><rect x="6" y="6" width="4.4" height="13" rx="1" fill="#b3262b"/><rect x="11" y="6" width="4.4" height="13" rx="1" fill="#b3262b"/><rect x="16" y="6" width="4.4" height="13" rx="1" fill="#b3262b"/></g><g fill="#c9a14a"><rect x="6" y="17" width="4.4" height="3.2"/><rect x="11" y="17" width="4.4" height="3.2"/><rect x="16" y="17" width="4.4" height="3.2"/></g>' },
};
const GUN_DESC = {
  pistole: "Halbautomatische 9-mm-Pistole, 12 Schuss. Linksklick schiesst, rechts halten zielt über Kimme und Korn, R lädt nach (9-mm-Munition).",
  mg: "Maschinengewehr mit 40-Schuss-Magazin. Linksklick halten für Dauerfeuer, rechts halten zielt über das Rotpunktvisier. Braucht 9-mm-Munition, R lädt nach.",
  sniper: "Repetier-Scharfschützengewehr mit 6-fach-Zielfernrohr, 5 Schuss, Reichweite über 400 m. Rechts halten blickt durchs Zielfernrohr. Braucht Gewehrpatronen.",
  emp: "EMP-Gewehr: schiesst einen elektromagnetischen Puls. Fahrzeuge und Busse im Umkreis von ca. 9 m am Einschlag bleiben 15 Sekunden stehen (Motor aus). 3 Ladungen, laedt sich selbst wieder auf (je 5 s), keine Munition.",
  schrotflinte: "Vorderschaft-Schrotflinte, 6 Patronen, je Schuss 9 Schrotkugeln. Stark auf kurze Entfernung. Braucht Schrotpatronen.",
  gewehrmunition: "Patronen für das Scharfschützengewehr.",
  schrot: "Schrotpatronen für die Schrotflinte.",
};
// Langwaffen schraeg und groesser, damit sie das Feld fuellen wie die Pistole (Nicolas 2026-11-17)
for (const id of ["mg", "sniper", "schrotflinte", "emp"]) GUN_SVG[id] = '<g transform="translate(13 13) rotate(-38) scale(1.1) translate(-13 -12.8)">' + GUN_SVG[id] + "</g>";
for (const id in GUN_SPEC) INV_ITEMS[id] = { name: GUN_SPEC[id].name, art: "Waffe", stack: 1, svg: GUN_SVG[id] };
Object.assign(INV_ITEMS, GUN_AMMO); Object.assign(INV_DESC, GUN_DESC);
INV_DESC.munition = "9-mm-Patronen für Pistole und Maschinengewehr.";
if (typeof INV_TEST_ALLE !== "undefined" && INV_TEST_ALLE) { for (const id of [...Object.keys(GUN_SPEC), ...Object.keys(GUN_AMMO)]) if (!invHas(id)) invAdd(id, INV_ITEMS[id].stack); }
invRender();

// ---- Anzeige: Munition, Zielfernrohr ----
const GUN_UI = (() => {
  const am = Object.assign(document.createElement("div"), { id: "gun-ammo" }); am.style.cssText = "position:fixed;right:max(3%,24px);bottom:calc(env(safe-area-inset-bottom,0px) + 250px);z-index:6;padding:4px 10px;border-radius:8px;background:rgba(12,14,18,.72);color:#fff;font:700 18px system-ui,sans-serif;pointer-events:none;text-shadow:0 1px 2px #000";
  am.hidden = true; document.body.appendChild(am);
  const sc = Object.assign(document.createElement("div"), { id: "gun-scope" }); sc.hidden = true;
  sc.style.cssText = "position:fixed;inset:0;z-index:3;pointer-events:none;background:radial-gradient(circle at 50% 50%, transparent 0, transparent min(38vh,38vw), #000 calc(min(38vh,38vw) + 2px))";
  sc.innerHTML = '<div style="position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(0,0,0,.85)"></div><div style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(0,0,0,.85)"></div>' +
    '<div style="position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#e33"></div>';
  document.body.appendChild(sc); return { am, sc };
})();
function gunAmmoText() { const id = GUN.cur; if (!id) return ""; const S = GUN_SPEC[id]; if (S.emp) return "EMP-Ladung " + GUN.mag[id] + " / " + S.mag + (GUN.mag[id] < S.mag ? "  ·  lädt " + Math.ceil(S.recharge - (GUN.empT || 0)) + " s" : ""); return (GUN.rel > 0 ? "lädt …" : GUN.mag[id] + " / " + S.mag) + "  ·  " + invCount(S.ammo); }

// ---- Ton (eigener Audio-Kontext, entsteht beim ersten Schuss = Mausklick) ----
function gunSound(id, empty) {
  try { const A = GUN.audio || (GUN.audio = new (window.AudioContext || window.webkitAudioContext)()); if (A.state === "suspended") A.resume();
    const vol = (typeof ENGINE !== "undefined" && ENGINE.vol !== undefined ? ENGINE.vol : 0.7) * (typeof ENGINE !== "undefined" && ENGINE.muted ? 0 : 1); if (vol <= 0) return;
    const [v, len, f] = empty ? [0.25, 0.04, 3000] : GUN_SPEC[id].snd, n = Math.floor(A.sampleRate * len), buf = A.createBuffer(1, n, A.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, empty ? 1 : 2.6);
    const src = A.createBufferSource(), lp = A.createBiquadFilter(), g = A.createGain(), t = A.currentTime; src.buffer = buf; lp.type = "lowpass"; lp.frequency.setValueAtTime(f, t); lp.frequency.exponentialRampToValueAtTime(120, t + len);
    g.gain.value = v * vol; src.connect(lp); lp.connect(g); g.connect(A.destination); src.start(t);
    if (!empty) { const o = A.createOscillator(), og = A.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); og.gain.setValueAtTime(v * vol * 0.8, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(og); og.connect(A.destination); o.start(t); o.stop(t + 0.2); }
  } catch (e) {} }

// ---- Treffer-Effekte (Hauptszene) ----
const GUN_FX = { spark: new THREE.SpriteMaterial({ map: GUN_FLASH_TEX, color: 0xffe0a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  dust: new THREE.SpriteMaterial({ color: 0x8a8476, transparent: true, opacity: 0.6, depthWrite: false }),
  tracer: new THREE.LineBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.7, depthWrite: false }) };
function gunFx(kind, a, b) { let o;
  if (kind === "tracer") { o = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a.clone(), b.clone()]), GUN_FX.tracer); o.userData.life = 0.05; }
  else { o = new THREE.Sprite(kind === "spark" ? GUN_FX.spark : GUN_FX.dust.clone()); o.position.copy(a); o.scale.setScalar(kind === "spark" ? 0.25 : 0.35); o.userData.life = kind === "spark" ? 0.08 : 0.6; o.userData.grow = kind === "dust"; }
  o.userData.dynamic = true; o.userData.t = 0; o.frustumCulled = false; scene.add(o); GUN.fx.push(o); }

// ---- Schiessen ----
function gunTrigger(on) { const id = weaponHeld(); if (!GUN_SPEC[id]) return; if (on && (GUN.cd > 0 || GUN.rel > 0)) { GUN.trig = !touch && GUN_SPEC[id].auto; return; } GUN.trig = on && !touch && GUN_SPEC[id].auto; if (on) gunFire(id); }
function gunReload(id) { const S = GUN_SPEC[id]; if (!S || S.emp || GUN.rel > 0 || GUN.mag[id] >= S.mag) return; if (!invHas(S.ammo)) { toast("Keine " + INV_ITEMS[S.ammo].name + " mehr"); return; } GUN.rel = S.reload; GUN.relId = id; }
function gunFire(id) {
  const S = GUN_SPEC[id]; if (S.emp) return empFire(id, S); if (GUN.mag[id] <= 0) { gunSound(id, true); GUN.cd = 0.25; if (invHas(S.ammo)) gunReload(id); else toast("Keine " + INV_ITEMS[S.ammo].name + " – Magazin leer"); return; }
  GUN.mag[id]--; gunSave(); GUN.cd = S.rate; GUN.kick = 1; GUN.flashT = 0.05; gunSound(id);
  if (id === "schrotflinte" || id === "sniper") GUN.cycle = 1;                         // Pumpe bzw. Kammer nachladen (Animation)
  camera.updateMatrixWorld(); const o = GUN.a.copy(camera.position), fwd = camera.getWorldDirection(GUN.d).clone(), up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion), rt = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const sp = AIM.on ? S.spreadAim : S.spread, mz = gunModel(id).userData.muzzle.clone(); gunPose(); if (GUN.g) GUN.g.updateMatrixWorld(true); const mw = GUN.g ? GUN.g.localToWorld(mz) : o.clone();
  for (let k = 0; k < S.pellets; k++) {
    const r = sp * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2, dir = fwd.clone().addScaledVector(rt, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize();
    const st = o.clone().addScaledVector(dir, 0.35), end = o.clone().addScaledVector(dir, S.range), h = shotSeg(st, end, null, S.range > 200 ? 0.6 : 0.4), p = h ? h.p : end;
    if (h) { gunFx("spark", p); gunFx("dust", p); if (h.hit && h.hit.veh) gunDamage(h.hit.veh, p, S.dmg); }
    if (k === 0 && (id === "mg" || id === "sniper" || Math.random() < 0.3)) gunFx("tracer", mw, p); }
  const kp = S.kick * (AIM.on ? 0.6 : 1); player.pitch = Math.min(1.5, player.pitch + kp); player.yaw += (Math.random() - 0.5) * kp * 0.4;   // Rueckstoss
  if (GUN.mag[id] === 0 && invHas(S.ammo)) gunReload(id);
}
// Schaden an Fahrzeugen (Nicolas 2026-11-17 "weiter"): Treffer sammeln Punkte, je 100 Punkte kostet ein Panzerungs-Treffer (vehHit, schiessen.js: kleine Explosion,
// bei 0 Wrack). Normales Auto (Panzerung 1) also ca. 10 Pistolen-, 15 MG-, 2 Sniper-Schuss.
function gunDamage(v, p, dmg) { if (typeof vehHit !== "function" || v.dead) return; v.bdmg = (v.bdmg || 0) + dmg; if (v.bdmg >= 100) { v.bdmg -= 100; vehHit(v, p.clone()); } }
// Lage der Hand-Waffe vor der Kamera (Hueftanschlag bzw. Zielen), Rueckstoss, Nachladen
function gunPose() { const id = GUN.cur, g = GUN.g; if (!id || !g) return; const S = GUN_SPEC[id], a = GUN.ads, h = S.hip, d = S.ads;
  const x = h[0] + (d[0] - h[0]) * a, y = h[1] + (d[1] - h[1]) * a, z = h[2] + (d[2] - h[2]) * a + GUN.kick * 0.045, rl = GUN.rel > 0 ? Math.sin(Math.min(1, (S.reload - GUN.rel) / S.reload) * Math.PI) : 0;
  g.position.copy(camera.position); g.quaternion.copy(camera.quaternion); g.translateX(x); g.translateY(y - rl * 0.12); g.translateZ(z);
  g.rotateX(GUN.kick * 0.08 + rl * 0.6); g.rotateY((1 - a) * 0.06); g.rotateZ(rl * 0.3); }
function gunStep(dt) {
  empStep(dt);
  const id = weaponHeld(), on = !!GUN_SPEC[id] && onFoot();
  if (GUN.cur !== (on ? id : null)) { if (GUN.g) GUN.scene.remove(GUN.g); GUN.cur = on ? id : null; GUN.g = on ? gunModel(id) : null; if (GUN.g) GUN.scene.add(GUN.g); GUN.trig = false; GUN.rel = 0; GUN.ads = 0; }
  GUN.cd = Math.max(0, GUN.cd - dt); GUN.kick = Math.max(0, GUN.kick - dt * 9); GUN.cycle = Math.max(0, (GUN.cycle || 0) - dt * 2.2);
  for (let i = GUN.fx.length - 1; i >= 0; i--) { const o = GUN.fx[i]; o.userData.t += dt; const k = o.userData.t / o.userData.life; if (o.userData.grow) { o.scale.setScalar(0.35 + k * 0.8); o.material.opacity = 0.6 * (1 - k); }
    if (k >= 1) { scene.remove(o); if (o.isLine) o.geometry.dispose(); else if (o.userData.grow) o.material.dispose(); GUN.fx.splice(i, 1); } }
  const scopeOn = on && GUN_SPEC[id].scope && AIM.on && GUN.ads > 0.9;
  GUN_UI.sc.hidden = !scopeOn; GUN_UI.am.hidden = !on; const ar = document.getElementById("aim-ring"); if (ar) ar.style.visibility = scopeOn ? "hidden" : ""; if (!on) return;
  GUN_UI.am.textContent = gunAmmoText();
  if (GUN.rel > 0) { GUN.rel -= dt; if (GUN.rel <= 0) { const S = GUN_SPEC[GUN.relId], need = S.mag - GUN.mag[GUN.relId], have = Math.min(need, invCount(S.ammo)); if (have > 0 && invTake(S.ammo, have)) GUN.mag[GUN.relId] += have; GUN.rel = 0; gunSave(); } }
  if (GUN.trig && GUN.cd <= 0 && GUN.rel <= 0) gunFire(id);
  GUN.ads += ((AIM.on ? 1 : 0) - GUN.ads) * Math.min(1, dt * 14);
  if (GUN.pump) GUN.pump.position.z = -0.36 + Math.sin(GUN.cycle * Math.PI) * 0.06 * (id === "schrotflinte" ? 1 : 0);
  GUN.g.userData.flash.visible = GUN.flashT > 0; if (GUN.flashT > 0) { GUN.flashT -= dt; GUN.g.userData.flash.material.rotation = Math.random() * 6; }
  GUN.g.visible = !scopeOn;
  const n = typeof night !== "undefined" ? night : 0; GUN.hemi.intensity = 1.1 - n * 0.6; GUN.sun.intensity = 2.2 - n * 1.4; GUN.fill.intensity = 0.9 - n * 0.5;
}
// nach dem Hauptbild: Hand-Waffe ueber alles (eigene Tiefe)
function gunRender() { if (!GUN.cur || !GUN.g) return; gunPose(); const ac = renderer.autoClear; renderer.autoClear = false; renderer.clearDepth(); renderer.render(GUN.scene, camera); renderer.autoClear = ac; }
const gunZoom = () => { const id = weaponHeld(); return GUN_SPEC[id] ? GUN_SPEC[id].zoom : 1.8; };
addEventListener("mouseup", e => { if (e.button === 0) GUN.trig = false; });
addEventListener("blur", () => { GUN.trig = false; });
addEventListener("keydown", e => { if (e.code === "KeyR" && !e.repeat && GUN.cur && onFoot()) gunReload(GUN.cur); });

// ---- EMP-Gewehr: Puls, Wirkung, Aufladen (Nicolas 2026-11-17) ----
// Strahl aus der Bildmitte bis 120 m (shotSeg); am Einschlag eine blaue Kugel, die auf empR waechst und verblasst, dazu ein Leuchtstrahl von der Muendung.
// Getroffen werden: das direkt getroffene Fahrzeug und alle Fahrzeuge (VEH, Werkstatt auch AKT) und Busse (GBUS) im Umkreis: v.empT = Zeitpunkt, bis zu dem der Motor aus ist.
const EMP = { fx: [], ringM: new THREE.MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  beamM: new THREE.LineBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: 0.9 }) };
const empDead = v => !!(v && v.empT && v.empT > performance.now());
function empFire(id, S) {
  if (GUN.mag[id] <= 0) { GUN.cd = 0.3; if (typeof toast === "function") toast("EMP lädt noch …"); return; }
  GUN.mag[id]--; gunSave(); GUN.cd = S.rate; GUN.kick = 1; GUN.flashT = 0.08; gunSound(id);
  camera.updateMatrixWorld(); const o = camera.position.clone(), d = camera.getWorldDirection(new THREE.Vector3()), st = o.clone().addScaledVector(d, 0.35), end = o.clone().addScaledVector(d, S.range);
  const h = shotSeg(st, end, null, 0.6), p = h ? h.p.clone() : end;
  gunPose(); if (GUN.g) GUN.g.updateMatrixWorld(true); const mw = GUN.g ? GUN.g.localToWorld(gunModel(id).userData.muzzle.clone()) : o.clone();
  const beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([mw, p]), EMP.beamM.clone()); beam.frustumCulled = false; scene.add(beam); EMP.fx.push({ o: beam, t: 0, life: 0.25, beam: true });
  // flacher Ring waechst auf empR (zeigt den Wirkradius), kleiner Blitz bis 1,2 m (eine grosse Kugel faerbte das ganze Bild, wenn man nah stand)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 48), EMP.ringM.clone()); ring.rotation.x = Math.PI / 2; ring.position.copy(p); ring.position.y += 0.3; scene.add(ring); EMP.fx.push({ o: ring, t: 0, life: 0.7, R: S.empR });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), EMP.ringM.clone()); ball.position.copy(p); scene.add(ball); EMP.fx.push({ o: ball, t: 0, life: 0.3, R: 1.2 });
  const until = performance.now() + S.empT * 1000, hit = new Set(); let n = 0, nb = 0;
  if (h && h.hit && h.hit.veh) hit.add(h.hit.veh);
  if (typeof VEH !== "undefined") for (const v of VEH) { const q = v.g && v.g.position; if (q && Math.hypot(q.x - p.x, q.z - p.z) < S.empR && Math.abs(q.y - p.y) < S.empR) hit.add(v); }
  if (typeof AKT !== "undefined" && AKT && AKT.x !== undefined && Math.hypot(AKT.x - p.x, AKT.z - p.z) < S.empR) hit.add(AKT);
  for (const v of hit) { v.empT = until; n++; }
  if (typeof GBUS !== "undefined" && GBUS.buses) for (const b of GBUS.buses) { const q = b.g && b.g.position; if (q && Math.hypot(q.x - p.x, q.z - p.z) < S.empR + 4) { b.hold = Math.max(b.hold || 0, S.empT); b.v = 0; nb++; } }
  if (typeof toast === "function") toast(n + nb ? "EMP: " + (n ? n + " Fahrzeug" + (n > 1 ? "e" : "") : "") + (n && nb ? " und " : "") + (nb ? nb + " Bus" + (nb > 1 ? "se" : "") : "") + " lahmgelegt (" + S.empT + " s)" : "EMP: nichts Elektronisches getroffen");
  EMP.last = { p, n, nb };
}
function empStep(dt) {
  const S = GUN_SPEC.emp; if (GUN.mag.emp < S.mag) { GUN.empT = (GUN.empT || 0) + dt; if (GUN.empT >= S.recharge) { GUN.empT = 0; GUN.mag.emp++; gunSave(); } } else GUN.empT = 0;
  for (let i = EMP.fx.length - 1; i >= 0; i--) { const F = EMP.fx[i]; F.t += dt; const k = Math.min(1, F.t / F.life);
    if (F.beam) F.o.material.opacity = 0.9 * (1 - k); else { F.o.scale.setScalar(0.3 + (F.R - 0.3) * Math.sqrt(k)); F.o.material.opacity = 0.55 * (1 - k); }
    if (k >= 1) { scene.remove(F.o); F.o.geometry.dispose(); F.o.material.dispose(); EMP.fx.splice(i, 1); } }
}// Waffenwand (Nicolas 2026-11-18, N27: "hinter den Tisch eine Waffenwand, wo alle bisherigen Waffen hängen, mit Rechtsklick das Inventar der Wand"): Lochwand mit Rahmen,
// die Waffen hängen seitlich (Lauf nach links). Front -z, Boden y 0, Breite 3 m. Inhalt = Behälter "waffenwand" (inventar.js invBox); was nicht mehr drin ist, verschwindet von der Wand (waffenwandSync).
const WAFFENWAND_INHALT = [["sniper", 1], ["mg", 1], ["schrotflinte", 1], ["emp", 1], ["pistole", 1], ["greifhaken", 1], ["batarang", 6], ["rauchbombe", 4], ["munition", 64], ["gewehrmunition", 40], ["schrot", 32]];
function buildWaffenwand() {
  const g = new THREE.Group(), W = 3.0, H = 2.25, frame = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.5, metalness: 0.4 });
  const peg = canvasTex(256, 192, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#e4e9ee"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });   // hell leuchtende Tafel (Nicolas 2026-11-18, Bild Waffenkammer: "die Waffenwand soll hell sein wie hier")
  const board = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.05), [frame, frame, frame, frame, frame, new THREE.MeshStandardMaterial({ map: peg, emissiveMap: peg, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.6 })]); board.position.set(0, 0.25 + H / 2, 0); g.add(board);   // Seite -z = Lochwand
  for (const [w, h, x, y] of [[W + 0.1, 0.08, 0, 0.25], [W + 0.1, 0.08, 0, 0.25 + H], [0.08, H, -W / 2, 0.25 + H / 2], [0.08, H, W / 2, 0.25 + H / 2]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), frame); f.position.set(x, y, -0.01); g.add(f); }
  for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.3), frame); l.position.set(x, 0.125, 0.05); g.add(l); }   // Fuesse
  const items = {}, hook = new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.8, roughness: 0.3 }), put = (id, o) => { (items[id] = items[id] || []).push(o); g.add(o); };
  const one = id => { if (GUN_SPEC[id]) { const o = new THREE.Group(), m = gunBuild(id); m.rotation.y = -Math.PI / 2; o.add(m); return o; }
    if (id === "batarang") { const o = new THREE.Group(), m = new THREE.Mesh(AIM_M.bat, AIM_M.batM); m.rotation.set(Math.PI / 2, 0, 0); o.add(m); return o; }   // Ohren oben
    if (id === "rauchbombe") { const o = new THREE.Group(), m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), AIM_M.bombM); o.add(m); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.05, 14), hook); c.position.y = 0.1; o.add(c);
      const lv = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.1, 0.006), hook); lv.position.set(0.03, 0.08, -0.02); lv.rotation.z = -0.35; o.add(lv); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.004, 6, 16), hook); ring.position.set(-0.035, 0.12, -0.02); o.add(ring);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.091, 0.091, 0.02, 20), new THREE.MeshStandardMaterial({ color: 0xd9c23a, roughness: 0.6 })); o.add(band); return o; }   // Kugel mit Zuender, Buegel, Sicherungsring, gelbem Band
    if (id === "greifhaken" && typeof buildGreifhaken === "function") { const o = new THREE.Group(), m = buildGreifhaken(); m.rotation.y = -Math.PI / 2; o.add(m); return o; }   // 3D-Modell (waffen.js, N44)
    const it = INV_ITEMS[id]; if (!it) return null;   // Munition: Schachtel mit Aufschrift
    const [bg, t1, t2] = id === "schrot" ? ["#8a1e22", "12 GA", "SCHROT"] : id === "gewehrmunition" ? ["#4f5226", "7.62", "GEWEHR"] : ["#22324f", "9 MM", "PISTOLE"];
    const lab = canvasTex(128, 80, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = "#f1e6c8"; c.fillRect(6, 6, w - 12, 4); c.fillRect(6, h - 10, w - 12, 4); c.font = "bold 30px Arial"; c.textAlign = "center"; c.fillText(t1, w / 2, 44); c.font = "bold 14px Arial"; c.fillText(t2, w / 2, 62); }), mb = new THREE.MeshStandardMaterial({ color: new THREE.Color(bg), roughness: 0.7 });
    return new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.08), [mb, mb, mb, mb, mb, new THREE.MeshStandardMaterial({ map: lab, roughness: 0.7 })]); };
  // Reihen von oben: lange Waffen, mittlere, kurze Dinge mit Ablage; je Reihe gleichmaessig verteilt nach Breite
  const rows = [[["sniper"], ["mg"]], [["schrotflinte"], ["emp"]], [["pistole"], ["greifhaken"], ["batarang", 3], ["rauchbombe", 2]], [["munition"], ["gewehrmunition"], ["schrot"]]], ys = [2.15, 1.65, 1.1, 0.55];
  rows.forEach((row, r) => { const objs = []; for (const [id, n = 1] of row) for (let k = 0; k < n; k++) { const o = one(id); if (o) objs.push([id, o]); }
    const ws = objs.map(([, o]) => { const b = new THREE.Box3().setFromObject(o); return Math.max(0.12, b.max.x - b.min.x); }), gap = (W - 0.3 - ws.reduce((a, b) => a + b, 0)) / Math.max(1, objs.length - 1);
    const gp = Math.min(gap, 0.45), tot = ws.reduce((a, b) => a + b, 0) + gp * (objs.length - 1); let x = -tot / 2; objs.forEach(([id, o], i) => { const b = new THREE.Box3().setFromObject(o); o.position.set(x - b.min.x, ys[r] - (b.max.y + b.min.y) / 2, -0.03 - b.max.z); put(id, o); x += ws[i] + gp; });   // Reihe mittig
    if (r === 3) { const sh = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.03, 0.2), frame); sh.position.set(0, ys[r] - 0.07, -0.12); g.add(sh); } });   // Ablage fuer die Munition
  g.userData.items = items; g.name = "Waffenwand"; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g;
}
function waffenwandSync(wall, B) { for (const id in wall.userData.items) { const n = invBoxCount(B, id); wall.userData.items[id].forEach((o, k) => o.visible = k < n); } }   // so viele Stueck sichtbar wie im Behaelter (hoechstens die gebauten)
