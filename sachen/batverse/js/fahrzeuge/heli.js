// Polizei-Helikopter (Nicolas 2026-11-18, N46: "Polizei-Helikopter und Polizei-Jeep"). Spiel und Werkstatt, nach fahrzeuge/the-bat.js (nutzt dessen Flugsystem: FLYS, useFly, flyStep).
// Eigener Entwurf, leichter Zweimot-Polizeihubschrauber: Kabine als gestreckte Kugel (dunkelblau, weisses Band, POLICE · GCPD), Glaskanzel, Heckausleger mit Seitenleitwerk,
// Hoehenleitwerk und Heckrotor, Kufen, Mast mit vier Rotorblaettern (10 m), Suchscheinwerfer unter der Nase, Blaulichter (blinken im Flug). Vorne = -z, Kufen bei y 0.
// Fliegt wie The Bat (Senkrechtstarter-Steuerung): W/S vor/zurueck, A/D drehen, Leertaste steigen, C sinken, V Kamera, Shift aussteigen (gelandet); neigt sich staerker nach vorne.
// Standplatz: Dach des Polizeipraesidiums (gotham-polizei.js ruft heliPolizei mit Lage und Hoehe; mit Landeplatz-Markierung).
function buildPolizeiHeli() {
  const g = new THREE.Group(), M2 = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.3, ...o });
  const blau = M2(0x16233f, { metalness: 0.4, roughness: 0.35 }), weiss = M2(0xeef0f2, { roughness: 0.4 }), dunkel = M2(0x1a1c20, { roughness: 0.6 }), metall = M2(0x9aa0a8, { metalness: 0.7, roughness: 0.3 }),
    glas = M2(0x0c141c, { metalness: 0.7, roughness: 0.08, transparent: true, opacity: 0.7 });
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0, par = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; par.add(o); return o; };
  const kab = add(new THREE.SphereGeometry(1, 28, 18), blau, 0, 1.45, -0.4); kab.scale.set(0.82, 0.86, 2.05);                         // Kabine
  const bauch = add(new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), weiss, 0, 1.43, -0.4); bauch.scale.set(0.835, 0.87, 2.07);   // weisse Unterseite
  const kz = add(new THREE.SphereGeometry(1, 24, 14, -Math.PI * 0.42, Math.PI * 0.84, 0, Math.PI * 0.55), glas, 0, 1.48, -0.55, 0, Math.PI); kz.scale.set(0.85, 0.88, 2.1);   // Glaskanzel vorne oben
  add(new THREE.BoxGeometry(1.2, 0.5, 1.6), blau, 0, 2.1, 0.5);                                                                          // Triebwerksverkleidung
  add(new THREE.CylinderGeometry(0.3, 0.15, 4.7, 14), blau, 0, 1.75, 3.6, Math.PI / 2 - 0.05);                                           // Heckausleger
  add(new THREE.BoxGeometry(1.9, 0.06, 0.45), blau, 0, 1.85, 5.2);                                                                       // Hoehenleitwerk
  { const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(0.9, 0); fin.lineTo(1.2, 1.3); fin.lineTo(0.75, 1.3); fin.lineTo(0, 0.3); const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.08, bevelEnabled: false }); fg.translate(0, 0, -0.04); add(fg, blau, 0, 1.75, 5.35, 0, Math.PI / 2); }   // Seitenleitwerk
  for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(0.045, 0.045, 3.6, 10), metall, sx * 0.95, 0.06, -0.2, Math.PI / 2);            // Kufen
    add(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 10), metall, sx * 0.95, 0.12, -2.0, -0.6);                                           // Kufenspitze hochgebogen
    for (const z of [-1.0, 0.7]) add(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8), metall, sx * 0.72, 0.5, z, 0, 0, sx * 0.5); }          // Streben
  // Band und Schrift beidseits, Kennzeichen unter dem Ausleger
  const lab = (t, w) => new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (c, W, H) => { c.fillStyle = "#eef0f2"; c.fillRect(0, 0, W, H); c.fillStyle = "#16233f"; c.font = "bold 62px Arial"; c.textAlign = "center"; c.fillText(t, W / 2, 70); }) });
  for (const sx of [-1, 1]) { const p = add(new THREE.PlaneGeometry(2.2, 0.4), lab("POLICE · GCPD"), sx * 0.86, 1.25, 0.1, 0, sx * Math.PI / 2); p.castShadow = false;
    const n = add(new THREE.PlaneGeometry(1.4, 0.2), lab("N-GCPD 1"), sx * 0.27, 1.75, 3.0, 0, sx * Math.PI / 2 - sx * 0.05); n.castShadow = false; }
  // Suchscheinwerfer unter der Nase, Blaulichter oben und unten
  const sw = add(new THREE.CylinderGeometry(0.13, 0.16, 0.25, 14), dunkel, 0.35, 0.62, -1.7); add(new THREE.CircleGeometry(0.12, 14), M2(0xfff6d8, { emissive: 0xfff2c0, emissiveIntensity: 0.8 }), 0.35, 0.49, -1.7, Math.PI / 2, 0, 0, g);
  const blauL = new THREE.MeshBasicMaterial({ color: 0x2a5cff }), rotL = new THREE.MeshBasicMaterial({ color: 0xff2020 }), lichter = [add(new THREE.SphereGeometry(0.09, 10, 8), blauL, 0, 2.38, 0.9), add(new THREE.SphereGeometry(0.09, 10, 8), rotL, 0, 0.55, 0.6), add(new THREE.SphereGeometry(0.07, 8, 6), blauL, 0, 2.6, 5.75)];
  // Rotor: Mast, Nabe, vier Blaetter (Durchmesser 10 m); Heckrotor seitlich (dreht um die Querachse)
  add(new THREE.CylinderGeometry(0.09, 0.12, 0.45, 10), metall, 0, 2.55, -0.1);
  const rotor = new THREE.Group(); rotor.position.set(0, 2.8, -0.1); g.add(rotor); add(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 14), dunkel, 0, 0, 0, 0, 0, 0, rotor);
  for (let k = 0; k < 4; k++) { const b = add(new THREE.BoxGeometry(0.28, 0.035, 4.8), dunkel, 0, 0.02, 0, 0, k * Math.PI / 2, 0, rotor); b.geometry.translate(0, 0, 2.5); }
  const heck = new THREE.Group(); heck.position.set(0.12, 2.25, 6.0); heck.rotation.y = Math.PI / 2; g.add(heck);   // lokale z = Querachse (fans drehen um z)
  for (let k = 0; k < 2; k++) { const b = add(new THREE.BoxGeometry(0.12, 1.25, 0.02), dunkel, 0, 0, 0, 0, 0, k * Math.PI / 2, heck); }
  g.name = "Polizei-Helikopter"; return { g, rotor, heck, lichter, blauL, rotL };
}
const HELI = (() => { const b = buildPolizeiHeli();
  const H = { name: "Polizei-Helikopter", g: b.g, rotors: [b.rotor], fans: [b.heck], legs: [], gear: null, gearT: 0, st: 0, x: 0, y: -9999, z: 0, h: 0, vx: 0, vy: 0, vz: 0, on: false, view: 0, pitch: 0, roll: 0, spin: 0, thrust: 0, circ: [],
    pts: [[0, 0.9, -2.2], [0, 0.9, 1.5], [-0.8, 1.4, -0.8], [0.8, 1.4, -0.8], [-0.8, 1.4, 0.8], [0.8, 1.4, 0.8], [0, 2.9, 0], [-4.6, 2.85, -0.1], [4.6, 2.85, -0.1], [0, 2.85, -4.7], [0, 2.85, 4.5], [0, 1.8, 6.2], [0, 2.6, 5.9]],
    // tiefste Punkte 0,9 m: auf einem Dach (gedrehter Quader, Rand 0,3 + 0,5 m in batAir) waere sonst schon der Stand blockiert; Boden halten die Kufen (feet)
    feet: [[-0.95, -1.8], [0.95, -1.8], [-0.95, 1.4], [0.95, 1.4]], spec: { max: 55, acc: 16, up: 9, tilt: 0.24, tiltV: 0.004, turn: 1.0 }, camD: 19, camDmin: 9.5, cockpit: [-1.4, 1.75],
    circPts: [[0, -1.3], [0, 0.6], [0, 3.2], [0, 5.4]], circR: 1.1, circH: 2.9, exitPts: [[2.3, -0.6], [-2.3, -0.6], [2.3, 1.0], [-2.3, 1.0], [0, -3.4]], snd: "The Bat", lichter: b.lichter,
    pose(B) { const an = B.on || B.thrust > 0.1, t = performance.now() / 1000; B.lichter[0].visible = B.lichter[2].visible = !an || Math.sin(t * 9) > 0; B.lichter[1].visible = !an || Math.sin(t * 9) <= 0; } };   // Blaulichter blinken im Flug
  b.g.userData.dynamic = true; b.g.userData.noLift = true; b.g.visible = false; scene.add(b.g);
  for (let k = 0; k < 4; k++) { const c = [0, 0, 0, 0]; c.dyn = true; circles.push(c); H.circ.push(c); }
  FLYS.push(H); return H; })();
// Standplatz setzen (Dach des Praesidiums), mit Landeplatz-Markierung (Kreis, H)
function heliPolizei(x, y, z, h, parent = scene) { Object.assign(HELI, { x, y: y + 0.02, z, h, vx: 0, vy: 0, vz: 0, pitch: 0, roll: 0 }); HELI.home = { x, y: y + 0.02, z, h }; HELI.g.visible = true; batPose(HELI, 0);
  const pad = new THREE.Group(), gelb = new THREE.MeshBasicMaterial({ color: 0xffd43b }), weiss = new THREE.MeshBasicMaterial({ color: 0xf2f2ee });
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.6, 6.0, 48).rotateX(-Math.PI / 2), gelb); pad.add(ring);
  for (const [w, d, px, pz] of [[0.6, 4, -1.3, 0], [0.6, 4, 1.3, 0], [2.0, 0.6, 0, 0]]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), weiss); b.position.set(px, 0, pz); pad.add(b); }
  pad.position.set(x, y + 0.03, z); pad.rotation.y = h; scene.add(pad); }
