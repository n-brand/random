// Polizei-Helikopter (Nicolas 2026-11-18, N46; neu 2026-11-19: "der Polizeihelikopter ist ja noch mega haesslich"). Eigener Entwurf eines leichten Zweimot-Polizeihubschraubers:
// glatter Rumpf als Loft (dunkelblau, Unterseite weiss), grosse Glaskanzel mit Rahmen, Schiebetueren mit Fenstern, Kufen mit Streben und Trittbrettern, Triebwerksverkleidung
// mit Einlaessen und Auspuffen, Vierblattrotor, Heckausleger mit ummanteltem Heckrotor in der Flosse und Hoehenflosse mit Endscheiben. Polizei-Ausruestung: Waermebild-Kugel
// unter der Nase, Suchscheinwerfer rechts unten, Lautsprecher, Blaulichter oben und unten (blinken im Flug), POLICE · GCPD seitlich, N-GCPD 1 am Ausleger.
// Vorne = -z, Kufen bei y 0. Fliegt wie The Bat (Senkrechtstarter-Steuerung), neigt sich staerker nach vorne. Standplatz: Dach des Polizeipraesidiums (heliPolizei).
function buildPolizeiHeli() {
  const g = new THREE.Group(), M2 = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.3, ...o });
  const blau = M2(0x16233f, { metalness: 0.45, roughness: 0.3 }), weiss = M2(0xeef0f2, { roughness: 0.35 }), dunkel = M2(0x1a1c20, { roughness: 0.6 }), metall = M2(0x9aa0a8, { metalness: 0.7, roughness: 0.3 }),
    glas = M2(0x0c141c, { metalness: 0.7, roughness: 0.06, transparent: true, opacity: 0.75 }), gelb = M2(0xe8c547, { roughness: 0.4 });
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0, par = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; par.add(o); return o; };
  const tf = T => f => { if (f >= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (f >= T[i][0]) { const [f0, a] = T[i - 1], [f1, b] = T[i]; return a + (b - a) * (f0 - f) / (f0 - f1); } return T[T.length - 1][1]; };
  const yb = tf([[2.45, 1.15], [2.2, 0.78], [1.6, 0.62], [-1.3, 0.62], [-2.5, 1.45]]), yt = tf([[2.45, 1.3], [2.15, 1.75], [1.4, 2.05], [0.9, 2.12], [-1.3, 2.12], [-2.5, 1.95]]), wd = tf([[2.45, 0.22], [2.2, 0.55], [1.6, 0.8], [-1.3, 0.82], [-2.5, 0.3]]);
  const sec = (f, s = 1, a0 = -Math.PI / 2, a1 = Math.PI / 2, n = 10) => { const b = yb(f), t = yt(f), h = t - b, w = wd(f) * s, P = []; for (let q = 0; q <= n; q++) { const a = a0 + (a1 - a0) * q / n; P.push([Math.max(0, Math.cos(a) * w), b + h / 2 + Math.sin(a) * h / 2 * s]); } if (a0 > -Math.PI / 2 + 1e-6) P.unshift([0, P[0][1]]); if (a1 < Math.PI / 2 - 1e-6) P.push([0, P[P.length - 1][1]]); return P; };
  const FS = []; for (let f = 2.45; f > -2.5; f -= 0.15) FS.push(+f.toFixed(3)); FS.push(-2.5);
  loftIn(g, FS.map(f => [f, sec(f)]), blau);
  loftIn(g, FS.map(f => [f, sec(f, 1.01, -Math.PI / 2, -0.35, 6)]), weiss);                                                                              // Unterseite weiss
  loftIn(g, FS.filter(f => f <= 2.38 && f >= 0.95).map(f => [f, sec(f, 1.012, -0.15, Math.PI / 2, 8)]), glas);                                                // Glaskanzel
  for (const sd of [-1, 1]) { add(new THREE.BoxGeometry(0.03, 0.8, 0.05), blau, sd * 0.79, 1.55, -1.0); add(new THREE.BoxGeometry(0.03, 0.03, 1.4), blau, sd * 0.8, 1.98, -0.45);
    for (const z of [-0.95, 0.35, 1.25]) add(new THREE.BoxGeometry(0.01, 1.15, 0.025), dunkel, sd * 0.81, 1.4, z); add(new THREE.BoxGeometry(0.02, 0.45, 0.62), glas, sd * 0.81, 1.62, 0.8);
    add(new THREE.BoxGeometry(0.04, 0.04, 2.0), metall, sd * 0.82, 1.99, 0.6); add(new THREE.BoxGeometry(0.05, 0.05, 0.14), metall, sd * 0.83, 1.3, 0.38); }
  add(new THREE.BoxGeometry(0.05, 0.05, 1.1), blau, 0, 1.94, -1.62, -0.55);                                                                                // Mittelstrebe der Kanzel
  // Schrift seitlich, Kennzeichen am Ausleger
  const lab = (t, col, bg) => new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(512, 96, (c, W, H) => { c.clearRect(0, 0, W, H); if (bg) { c.fillStyle = bg; c.fillRect(0, 0, W, H); } c.fillStyle = col; c.font = "bold 62px Arial"; c.textAlign = "center"; c.fillText(t, W / 2, 70); }) });
  for (const sd of [-1, 1]) { const p = add(new THREE.PlaneGeometry(1.7, 0.32), lab("POLICE · GCPD", "#eef0f2"), sd * 0.825, 1.18, 0.25, 0, sd * Math.PI / 2); p.castShadow = false;
    const n = add(new THREE.PlaneGeometry(1.2, 0.22), lab("N-GCPD 1", "#eef0f2"), sd * 0.22, 1.86, 3.4, 0, sd * Math.PI / 2 - sd * 0.05); n.castShadow = false; }
  // Kufen mit Streben und Trittbrettern
  for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(0.045, 0.045, 3.4, 10), metall, sx * 0.95, 0.06, -0.1, Math.PI / 2); add(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 10), metall, sx * 0.95, 0.13, -1.88, -0.7);
    for (const z of [-0.9, 0.8]) add(new THREE.CylinderGeometry(0.045, 0.045, 1.05, 8), metall, sx * 0.76, 0.42, z, 0, 0, sx * 0.55); add(new THREE.BoxGeometry(0.22, 0.03, 0.7), dunkel, sx * 0.95, 0.12, -0.6); }
  // Triebwerksverkleidung, Einlaesse, Auspuffe, Mast
  add(new THREE.BoxGeometry(1.0, 0.38, 2.0), blau, 0, 2.25, 0.3); add(new THREE.BoxGeometry(0.75, 0.2, 0.8), blau, 0, 2.5, 0.0);
  for (const sd of [-1, 1]) { add(new THREE.BoxGeometry(0.02, 0.18, 0.4), dunkel, sd * 0.51, 2.3, -0.3); for (let q = 0; q < 3; q++) add(new THREE.BoxGeometry(0.025, 0.02, 0.38), metall, sd * 0.52, 2.24 + q * 0.06, -0.3);
    add(new THREE.CylinderGeometry(0.1, 0.09, 0.35, 10), dunkel, sd * 0.3, 2.35, 1.38, Math.PI / 2 - 0.25, sd * 0.25); }
  add(new THREE.CylinderGeometry(0.08, 0.12, 0.35, 10), metall, 0, 2.75, -0.05);
  // Polizei-Ausruestung: Waermebild-Kugel, Suchscheinwerfer, Lautsprecher, Blaulichter
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), dunkel, 0, 0.62, -1.85); add(new THREE.SphereGeometry(0.17, 14, 10), M2(0xd8dade, { roughness: 0.4 }), 0, 0.46, -1.85); for (const sx of [-0.06, 0.06]) add(new THREE.CircleGeometry(0.045, 12), glas, sx, 0.47, -2.02, 0, Math.PI, 0);
  add(new THREE.BoxGeometry(0.06, 0.18, 0.06), dunkel, 0.62, 0.5, -0.9); const sw = new THREE.Group(); sw.position.set(0.62, 0.38, -0.92); g.add(sw); const swP = new THREE.Group(); sw.add(swP); swP.rotation.x = -0.3;   // Suchscheinwerfer schwenkbar (Gier sw, Neigung swP), Lampe zeigt nach -z
  add(new THREE.CylinderGeometry(0.13, 0.16, 0.3, 14), dunkel, 0, 0, -0.05, Math.PI / 2, 0, 0, swP); const swGlas = M2(0xfff6d8, { emissive: 0xfff2c0, emissiveIntensity: 0.3 }); add(new THREE.CircleGeometry(0.12, 14), swGlas, 0, 0, -0.205, 0, Math.PI, 0, swP);
  add(new THREE.BoxGeometry(0.3, 0.14, 0.2), dunkel, -0.5, 0.48, -0.3); for (let q = 0; q < 4; q++) add(new THREE.BoxGeometry(0.26, 0.015, 0.01), metall, -0.5, 0.43 + q * 0.03, -0.405);
  const blauL = new THREE.MeshBasicMaterial({ color: 0x2a5cff }), rotL = new THREE.MeshBasicMaterial({ color: 0xff2020 }), lichter = [add(new THREE.SphereGeometry(0.09, 10, 8), blauL, 0, 2.48, 1.2), add(new THREE.SphereGeometry(0.09, 10, 8), rotL, 0, 0.58, 0.5), add(new THREE.SphereGeometry(0.07, 8, 6), blauL, 0, 3.13, 6.0)];
  // Rotor
  const rotor = new THREE.Group(); rotor.position.set(0, 2.95, -0.05); g.add(rotor); add(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 14), dunkel, 0, 0, 0, 0, 0, 0, rotor); add(new THREE.SphereGeometry(0.14, 10, 8), blau, 0, 0.1, 0, 0, 0, 0, rotor);
  for (let k = 0; k < 4; k++) { const b = add(new THREE.BoxGeometry(0.26, 0.035, 4.7), dunkel, 0, 0.02, 0, 0, k * Math.PI / 2, 0, rotor); b.geometry.translate(0, 0, 2.5); add(new THREE.BoxGeometry(0.27, 0.036, 0.3), gelb, 0, 0.021, 4.95, 0, k * Math.PI / 2, 0, rotor).geometry.translate(0, 0, 0); }
  // Heck: Ausleger, Flosse mit ummanteltem Heckrotor, Hoehenflosse mit Endscheiben
  add(new THREE.CylinderGeometry(0.24, 0.13, 2.9, 14), blau, 0, 1.85, 3.8, Math.PI / 2 - 0.05);
  { const fin = new THREE.Shape(); fin.moveTo(-0.55, 0); fin.lineTo(0.55, 0); fin.lineTo(0.75, 1.0); fin.lineTo(0.45, 1.55); fin.lineTo(0.05, 1.55); fin.lineTo(-0.55, 0.6); const ho = new THREE.Path(); ho.absarc(0.05, 0.6, 0.36, 0, Math.PI * 2, true); fin.holes.push(ho);
    const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.3, bevelEnabled: false, curveSegments: 20 }); fg.translate(0, 0, -0.15); add(fg, blau, 0, 1.55, 5.75, 0, -Math.PI / 2); }
  const heck = new THREE.Group(); heck.position.set(0, 2.15, 5.8); heck.rotation.y = Math.PI / 2; g.add(heck); add(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 10), dunkel, 0, 0, 0, Math.PI / 2, 0, 0, heck);
  for (let k = 0; k < 8; k++) add(new THREE.BoxGeometry(0.06, 0.66, 0.015), dunkel, 0, 0, 0, 0, 0, k * Math.PI / 8, heck);
  add(new THREE.BoxGeometry(1.6, 0.05, 0.4), blau, 0, 1.9, 4.65); for (const sd of [-1, 1]) add(new THREE.BoxGeometry(0.04, 0.4, 0.45), weiss, sd * 0.8, 1.95, 4.65);
  add(new THREE.CylinderGeometry(0.008, 0.015, 0.4, 6), dunkel, 0, 2.6, 1.5);
  g.name = "Polizei-Helikopter"; return { g, rotor, heck, lichter, blauL, rotL, sw, swP, swGlas };
}
// Hubschrauber anlegen (auch militaer.js, N52): b = Ergebnis von buildPolizeiHeli (g, rotor, heck, lichter), k = Massstab (Kollision, Kamera, Ausstieg mitskaliert), o = Abweichungen
function flyAdd(name, b, k = 1, o = {}) { const S = (a) => a.map(p => p.map(v => v * k));
  const H = Object.assign({ name, g: b.g, rotors: [b.rotor], fans: [b.heck], legs: [], gear: null, gearT: 0, st: 0, x: 0, y: -9999, z: 0, h: 0, vx: 0, vy: 0, vz: 0, on: false, view: 0, pitch: 0, roll: 0, spin: 0, thrust: 0, circ: [],
    // tiefste Punkte 0,9 m: auf einem Dach (gedrehter Quader, Rand 0,3 + 0,5 m in batAir) waere sonst schon der Stand blockiert; Boden halten die Kufen (feet)
    pts: S([[0, 0.9, -2.2], [0, 0.9, 1.5], [-0.8, 1.4, -0.8], [0.8, 1.4, -0.8], [-0.8, 1.4, 0.8], [0.8, 1.4, 0.8], [0, 2.9, 0], [-4.6, 2.85, -0.1], [4.6, 2.85, -0.1], [0, 2.85, -4.7], [0, 2.85, 4.5], [0, 1.8, 6.2], [0, 2.6, 5.9]]).map(p => [p[0], Math.max(0.9, p[1]), p[2]]),
    feet: S([[-0.95, -1.8], [0.95, -1.8], [-0.95, 1.4], [0.95, 1.4]]), spec: { max: 55, acc: 16, up: 9, tilt: 0.24, tiltV: 0.004, turn: 1.0 }, camD: 19 * k, camDmin: 9.5 * k, cockpit: [-1.4 * k, 1.75 * k],
    circPts: S([[0, -1.3], [0, 0.6], [0, 3.2], [0, 5.4]]), circR: 1.1 * k, circH: 2.9 * k, exitPts: S([[2.3, -0.6], [-2.3, -0.6], [2.3, 1.0], [-2.3, 1.0], [0, -3.4]]), snd: "The Bat", lichter: b.lichter,
    pose(B) { if (!B.lichter) return; const an = B.on || B.thrust > 0.1, t = performance.now() / 1000; B.lichter[0].visible = B.lichter[2].visible = !an || Math.sin(t * 9) > 0; B.lichter[1].visible = !an || Math.sin(t * 9) <= 0; } }, o);   // Blaulichter blinken im Flug
  b.g.userData.dynamic = true; b.g.userData.noLift = true; b.g.visible = false; scene.add(b.g);
  for (let i = 0; i < 4; i++) { const c = [0, 0, 0, 0]; c.dyn = true; circles.push(c); H.circ.push(c); }
  FLYS.push(H); return H; }
const HELI = (() => { const b = buildPolizeiHeli(), H = flyAdd("Polizei-Helikopter", b); H.licht = { sw: b.sw, swP: b.swP, glas: b.swGlas, an: false }; const p0 = H.pose; H.pose = (B, dt) => { p0(B, dt); heliLicht(B, dt || 0); }; return H; })();
// Suchscheinwerfer (Nicolas 2026-11-19: "Polizeihelikopter soll mit einmal Linksklick Licht aktivieren koennen und nochmal wieder aus – Scheinwerfer auch zielbar"):
// Linksklick (bei gefangener Maus, im fliegenden Polizeihubschrauber) schaltet; die Lampe schwenkt verzoegert auf die Bildmitte (Gier +-100 Grad, nur nach unten). Licht ohne echte
// Lichtquelle (keine Shader-Neuuebersetzung): heller Kegel von der Lampe zum Treffer und ein Lichtfleck dort (additiv, bis 250 m).
const HL_M = { kegel: new THREE.MeshBasicMaterial({ color: 0xfff4d0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  fleck: new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (c, w) => { const r = w / 2, gr = c.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, "rgba(255,246,214,1)"); gr.addColorStop(0.55, "rgba(255,240,200,.55)"); gr.addColorStop(1, "rgba(255,240,200,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, w); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }) };
function heliLicht(B, dt) { const L = B.licht; if (!L) return; const fliegt = B.on && typeof FLY !== "undefined" && FLY === B, auto = !!(B.auto && B.autoZ); if (!fliegt && !auto && B.thrust < 0.1) L.an = false;
  if (!L.kegel) { L.kegel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1, 1, 20, 1, true).translate(0, -0.5, 0).rotateX(-Math.PI / 2), HL_M.kegel); L.kegel.userData.dynamic = true; L.kegel.visible = false; scene.add(L.kegel);   // Spitze bei 0, oeffnet nach +z (lookAt)
    L.fleck = new THREE.Mesh(new THREE.CircleGeometry(1, 24), HL_M.fleck); L.fleck.userData.dynamic = true; L.fleck.visible = false; scene.add(L.fleck); }
  L.glas.emissiveIntensity = L.an ? 3 : 0.3;
  if (fliegt || auto) { let z; if (auto) z = B.autoZ.clone(); else { camera.updateMatrixWorld(); const o = camera.getWorldPosition(new THREE.Vector3()), d = camera.getWorldDirection(new THREE.Vector3()); z = o.clone().addScaledVector(d, 400);   // Zielpunkt Bildmitte (selbst geflogen) bzw. Einsatz-Ziel
    for (let s = 6, a = o.clone().addScaledVector(d, 6); s < 400; s += 8) { const b2 = o.clone().addScaledVector(d, s + 8), h = typeof shotSeg === "function" ? shotSeg(a, b2, null, 1) : null; if (h) { z.copy(h.p); break; } a.copy(b2); } }
    B.g.updateMatrixWorld(true); const loc = L.sw.parent.worldToLocal(z.clone()).sub(L.sw.position), yaw = Math.max(-1.75, Math.min(1.75, Math.atan2(-loc.x, -loc.z))), pit = Math.max(-1.45, Math.min(0, Math.atan2(loc.y, Math.hypot(loc.x, loc.z)))), k = Math.min(1, dt * 4);
    L.sw.rotation.y += (yaw - L.sw.rotation.y) * k; L.swP.rotation.x += (pit - L.swP.rotation.x) * k; }
  if (!L.an) { L.kegel.visible = L.fleck.visible = false; return; }
  B.g.updateMatrixWorld(true); const p = new THREE.Vector3(0, 0, -0.22).applyMatrix4(L.swP.matrixWorld), dir = new THREE.Vector3(0, 0, -1).transformDirection(L.swP.matrixWorld);
  let len = 250, hit = null; for (let s = 0, a = p.clone(); s < 250; s += 10) { const b2 = p.clone().addScaledVector(dir, s + 10), h = typeof shotSeg === "function" ? shotSeg(a, b2, null, 0.5) : null; if (h) { hit = h.p; len = h.p.distanceTo(p); break; } a.copy(b2); }
  const r = 0.12 + len * 0.09; L.kegel.visible = true; L.kegel.position.copy(p); L.kegel.lookAt(p.clone().add(dir)); L.kegel.scale.set(r, r, len);
  L.fleck.visible = !!hit; if (hit) { L.fleck.position.copy(hit).y += 0.06; L.fleck.lookAt(hit.x, hit.y + 10, hit.z); L.fleck.position.addScaledVector(dir, -0.05); L.fleck.scale.setScalar(r * 1.15); } }
addEventListener("mousedown", e => { if (e.button !== 0 || !(typeof FLY !== "undefined" && FLY === HELI && HELI.on && document.pointerLockElement)) return; HELI.licht.an = !HELI.licht.an; if (typeof toast === "function") toast("Suchscheinwerfer " + (HELI.licht.an ? "an" : "aus")); e.preventDefault(); e.stopImmediatePropagation(); }, true);
// Standplatz setzen (Dach des Praesidiums), mit Landeplatz-Markierung (Kreis, H)
function heliPolizei(x, y, z, h, parent = scene) { Object.assign(HELI, { x, y: y + 0.02, z, h, vx: 0, vy: 0, vz: 0, pitch: 0, roll: 0 }); HELI.home = { x, y: y + 0.02, z, h }; HELI.g.visible = true; batPose(HELI, 0);
  const pad = new THREE.Group(), gelb = new THREE.MeshBasicMaterial({ color: 0xffd43b }), weiss = new THREE.MeshBasicMaterial({ color: 0xf2f2ee });
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.6, 6.0, 48).rotateX(-Math.PI / 2), gelb); pad.add(ring);
  for (const [w, d, px, pz] of [[0.6, 4, -1.3, 0], [0.6, 4, 1.3, 0], [2.0, 0.6, 0, 0]]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), weiss); b.position.set(px, 0, pz); pad.add(b); }
  pad.position.set(x, y + 0.03, z); pad.rotation.y = h; scene.add(pad); }

// ---- Polizeihubschrauber-Einsatz (Nicolas 2026-11-19 "Ja, weiter": erste Reaktion der Polizei auf Ueberfaelle): steigt die Fahndung (Akte, ui/akte.js) auf 2 oder mehr, startet der
// Hubschrauber vom Praesidium (nur wenn ihn niemand fliegt): steigt auf, fliegt in Reisehoehe zum Spieler, kreist 60 s in ca. 30 m Hoehe mit dem Suchscheinwerfer auf ihn,
// sucht 20 s an der letzten Stelle, wenn man untergetaucht ist (unter der Strasse, im Untergrund, im Fahrzeug unten), und fliegt dann zurueck und landet. Ohne Kollision (fliegt hoch).
const HEINS = { phase: null, t: 0, a: 0, last: null, f0: null };   // f0: letzte Fahndungsstufe (null = beim Laden nicht ausloesen)
function heliEinsatzStart() { if (!HELI.home || HEINS.phase || (typeof FLY !== "undefined" && FLY === HELI && HELI.on)) return; HEINS.phase = "start"; HEINS.t = 0; HELI.auto = true; HELI.thrust = 1; HELI.g.visible = true;
  if (typeof toast === "function") toast("Polizeihubschrauber gestartet – Fahndung läuft"); }
function heliEinsatzStep(dt) { if (typeof HELI === "undefined" || typeof AKTE === "undefined") return; const f = AKTE.fahndung || 0; if (f >= 2 && HEINS.f0 !== null && HEINS.f0 < 2) heliEinsatzStart(); HEINS.f0 = f;
  const E = HEINS, H = HELI; if (!E.phase) return; if (typeof FLY !== "undefined" && FLY === H && H.on) { E.phase = null; H.auto = false; H.autoZ = null; return; }   // Spieler ist eingestiegen
  E.t += dt; const hm = H.home, pp = typeof player !== "undefined" ? player.pos : camera.position, Y0 = typeof GOT !== "undefined" ? GOT.STR : 0, reise = Math.max(hm.y + 60, Y0 + 140);
  const sichtbar = !(typeof under === "number" && under > 0.5) && pp.y > Y0 - 3; if (sichtbar) E.last = pp.clone();
  let T, vmax = 30;
  if (E.phase === "start") { T = new THREE.Vector3(hm.x, hm.y + 40, hm.z); vmax = 8; if (H.y > hm.y + 38) E.phase = "flug"; }
  else if (E.phase === "flug") { const L = E.last || pp; T = new THREE.Vector3(L.x, reise, L.z); if (Math.hypot(H.x - L.x, H.z - L.z) < 60) { E.phase = "kreisen"; E.t = 0; E.a = Math.atan2(H.z - L.z, H.x - L.x); } }
  else if (E.phase === "kreisen" || E.phase === "suche") { const L = E.last || pp; E.a += dt * 0.28; T = new THREE.Vector3(L.x + Math.cos(E.a) * 28, Math.max(L.y + 30, Y0 + 30), L.z + Math.sin(E.a) * 28); vmax = 16;
    if (E.phase === "kreisen" && !sichtbar) { E.phase = "suche"; E.t = 0; if (typeof toast === "function") toast("Der Hubschrauber hat dich verloren – er sucht noch"); }
    else if (E.phase === "suche" && sichtbar) { E.phase = "kreisen"; }
    if ((E.phase === "kreisen" && (E.t > 60 || f === 0)) || (E.phase === "suche" && E.t > 20)) { E.phase = "rueck"; if (typeof toast === "function") toast("Polizeihubschrauber dreht ab"); } }
  else if (E.phase === "rueck") { T = new THREE.Vector3(hm.x, reise, hm.z); if (Math.hypot(H.x - hm.x, H.z - hm.z) < 3) E.phase = "landen"; }
  else if (E.phase === "landen") { T = new THREE.Vector3(hm.x, hm.y, hm.z); vmax = 4; if (Math.abs(H.y - hm.y) < 0.1 && Math.hypot(H.x - hm.x, H.z - hm.z) < 0.3) { Object.assign(H, { x: hm.x, y: hm.y, z: hm.z, h: hm.h, pitch: 0, roll: 0, thrust: 0, auto: false, autoZ: null }); E.phase = null; batPose(H, dt); return; } }
  // bewegen: erst Hoehe (beim Start und Landen), sonst gleichzeitig; Nase in Flugrichtung, beim Kreisen zum Ziel
  const dx = T.x - H.x, dy = T.y - H.y, dz = T.z - H.z, dh = Math.hypot(dx, dz), stieg = E.phase === "kreisen" || E.phase === "suche" ? 1.6 : 1;
  const sh = Math.min(dh, vmax * dt * (E.phase === "start" ? 0 : 1)), sy = Math.sign(dy) * Math.min(Math.abs(dy), 9 * dt * stieg + (E.phase === "landen" ? 0 : 0));
  if (dh > 0.01) { H.x += dx / dh * sh; H.z += dz / dh * sh; } H.y += sy;
  const L = E.last || pp, zu = E.phase === "kreisen" || E.phase === "suche" ? [L.x - H.x, L.z - H.z] : dh > 1 ? [dx, dz] : null; if (zu) { const hs = Math.atan2(-zu[0], -zu[1]), d = Math.atan2(Math.sin(hs - H.h), Math.cos(hs - H.h)); H.h += d * Math.min(1, dt * 1.5); }
  H.pitch = -Math.min(0.18, sh / Math.max(dt, 1e-3) / vmax * 0.15); H.roll = 0; H.thrust = 1;
  H.licht.an = E.phase === "kreisen" || E.phase === "suche"; H.autoZ = H.licht.an ? new THREE.Vector3(L.x, L.y + 0.9, L.z) : null; batPose(H, dt); }
