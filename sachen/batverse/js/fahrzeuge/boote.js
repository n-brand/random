// Batverse – Schnellboot, U-Boot, Laufsteg und Schwimmsteg im Hoehlensee (Nicolas 2026-11-16, Phase 7: "Schnellboot und U-Boot", Liegeplatz "am Steg im See")
// Klassisches Skript nach fahrzeuge/boot.js (BOATS, BOAT_BLOCKS) und gotham/gotham-schiffe.js (shipHull, shipRBox, shipMat: Rumpf als Loft, Regel fuer Schiffe).
// - Laufsteg: verlaengert den linken Arm des U-Stegs nach Osten und biegt nach Sueden zu einem Schwimmsteg (16 x 1,5 m) mitten im See; begehbar (solids).
// - Schnellboot (8 m, schwarz mit Goldstreifen, zwei Aussenborder) neben dem Laufsteg (Verlaengerung des linken Arms), Bug nach Sueden zum offenen See; schnell (24 m/s), wendig.
// - U-Boot (16 m, Durchmesser 3 m, Turm, Tiefenruder, Kreuzleitwerk, Schraube) aufgetaucht suedlich des Schwimmstegs. Taucht bis knapp ueber den Grund
//   (12 m Wasser, Grund -46): Leertaste hoch, C runter; getaucht hoechstens 7 m/s, unter Stegen und Schwimmsteg durch. Aussteigen nur aufgetaucht.
// - Stege (U-Steg, Laufsteg, Schwimmsteg) sperren jetzt alle Boote (BOAT_BLOCKS); vorher fuhr das Boot durch den U-Steg.
"use strict";
{
  const STEG = SEA_Y + 0.5, Y0 = SEA_Y - 0.6;
  const plankT = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#6b5236"; c.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#735a3c" : "#63492f"; c.fillRect(0, i * 16, w, 15); c.fillStyle = "#3e2e1e"; c.fillRect(0, i * 16 + 15, w, 1); } });
  plankT.wrapS = plankT.wrapT = THREE.RepeatWrapping;
  const woodM = new THREE.MeshStandardMaterial({ map: plankT, roughness: 0.85 }), floatM = new THREE.MeshStandardMaterial({ color: 0x2c3036, roughness: 0.7 }), ironM = new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.6, roughness: 0.4 });
  const deck = (x0, x1, z0, z1) => { const w = x1 - x0, d = z1 - z0, g = new THREE.BoxGeometry(w, 0.18, d), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 2, uv.getY(i) * d / 2);
    const m = new THREE.Mesh(g, woodM); m.position.set((x0 + x1) / 2, STEG - 0.09, (z0 + z1) / 2); m.receiveShadow = m.castShadow = true; m.userData.noLift = true; scene.add(m);
    const f = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.5, d - 0.3), floatM); f.position.set((x0 + x1) / 2, STEG - 0.42, (z0 + z1) / 2); f.userData.noLift = true; scene.add(f);   // Schwimmkoerper
    solids.push({ x0, x1, z0, z1, y0: Y0, y1: STEG, on: true }); BOAT_BLOCKS.push({ x0: x0 - 0.3, x1: x1 + 0.3, z0: z0 - 0.3, z1: z1 + 0.3, deep: 0.7 }); };
  // U-Steg (B4, hoehle-unten.js) als Sperre fuer Boote: Querbalken, linker Arm, rechter Block (Weltkoordinaten aus der Hoehlenkarte)
  for (const [x0, x1, z0, z1] of [[-23, -21.9, 21.3, 28.7], [-23, -16.2, 27.2, 28.7], [-21.9, -18.2, 21.3, 23]]) BOAT_BLOCKS.push({ x0: x0 - 0.3, x1: x1 + 0.3, z0: z0 - 0.3, z1: z1 + 0.3, deep: 2 });
  deck(-16.2, -4.5, 27.2, 28.7);                                            // Laufsteg nach Osten (verlaengert den linken Arm)
  deck(-6, -4.5, 28.7, 33);                                                 // nach Sueden
  deck(-6, 10, 33, 34.5);                                                   // Schwimmsteg
  for (const [x, z] of [[-4.9, 34.1], [2, 34.1], [9.4, 34.1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.5, 10), ironM); p.position.set(x, STEG + 0.25, z); p.userData.noLift = true; scene.add(p); circles.push([x, z, 0.2, STEG + 0.5]); }   // Poller
  for (const [x, z] of [[-5.25, 28.9], [9.6, 33.3]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.4, 8), ironM); l.position.set(x, STEG + 1.2, z); l.userData.noLift = true; scene.add(l);
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.26), mat.glowOrange); k.position.set(x, STEG + 2.5, z); k.userData.noLift = true; scene.add(k); circles.push([x, z, 0.12, STEG + 2.4]); }
  { const L = new THREE.PointLight(0xffd59a, 0, 22, 1.6); L.position.set(2, STEG + 4, 33.8); L.userData.I = 24; scene.add(L); caveLights.push(L); }

  // ---------- Schnellboot ----------
  function buildSpeedboat() {
    const g = new THREE.Group(), blk = shipMat(0x121316, { roughness: 0.3, metalness: 0.3 }), grey = shipMat(0x2e3238, { roughness: 0.6 }), gold = shipMat(0xd9b24a, { metalness: 0.7, roughness: 0.3 }), seatM = shipMat(0x3a3d42, { roughness: 0.8 }), glass = new THREE.MeshStandardMaterial({ color: 0x9fb8c8, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.3, side: THREE.DoubleSide });
    const H = shipHull(g, { L: 8, W: 2.5, keel: -0.55, split: 0.12, deck: 0.8, bow: 3.4, stern: 0.4, sheer: 0.3, lower: grey, upper: blk });
    { const sh = new THREE.Shape(), P = []; for (let i = 0; i <= 30; i++) { const f = -4 + 8 * i / 30; P.push([H.hw(f) * 0.92, -f]); } sh.moveTo(-P[0][0], P[0][1]); for (const [x, z] of P) sh.lineTo(-x, z); for (let i = P.length - 1; i >= 0; i--) sh.lineTo(P[i][0], P[i][1]);
      const geo = new THREE.ShapeGeometry(sh); geo.rotateX(Math.PI / 2); geo.translate(0, 0.78, 0); const d = new THREE.Mesh(geo, seatM); d.material.side = THREE.DoubleSide; g.add(d); }   // Deck
    for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 5.6), gold); st.position.set(s * 1.24, 0.55, 0.3); st.rotation.y = s * 0.035; g.add(st); }   // Goldstreifen
    shipRBox(g, grey, 0, 0.78, -0.2, 1.0, 0.7, 0.6, 0.15);                  // Steuerkonsole
    const ws = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.45, 20, 1, true, -1.1, 2.2), glass); ws.position.set(0, 1.55, 0.6); ws.rotation.set(0, Math.PI, 0); ws.scale.set(1, 1, 0.7); g.add(ws);   // gebogene Scheibe
    for (const x of [-0.45, 0.45]) shipRBox(g, seatM, x, 0.78, 0.6, 0.6, 0.55, 0.6, 0.15);   // zwei Sitze
    shipRBox(g, seatM, 0, 0.78, 2.6, 2.0, 0.5, 0.8, 0.2);                  // Heckbank
    for (const x of [-0.5, 0.5]) { shipRBox(g, blk, x, 0.3, 4.15, 0.42, 1.0, 0.5, 0.12); const s = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.3), grey); s.position.set(x, -0.1, 4.2); g.add(s); }   // Aussenborder
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 6), gold); r.rotation.x = Math.PI / 2; r.position.set(s * 1.05, 1.1, -2.2); g.add(r); }   // Reling am Bug
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g;
  }
  // ---------- U-Boot ----------
  function buildSubmarine() {
    const g = new THREE.Group(), hullM = shipMat(0x15171a, { roughness: 0.55, metalness: 0.35 }), dark = shipMat(0x0b0c0e, { roughness: 0.6 }), glow = mat.glowOrange;
    const P = []; for (let i = 0; i <= 40; i++) { const t = i / 40, y = 8 - 16 * t; let r; if (y > 5) r = 1.5 * Math.sqrt(Math.max(0, 1 - ((y - 5) / 3) ** 2)); else if (y > -3.5) r = 1.5; else r = 0.22 + 1.28 * Math.cos((y + 3.5) / 4.5 * Math.PI / 2); P.push(new THREE.Vector2(Math.max(0.001, r), y)); }
    P.reverse(); const body = new THREE.Mesh(new THREE.LatheGeometry(P, 32), hullM); body.rotation.x = -Math.PI / 2; g.add(body);   // Spitze nach vorne (-z)
    shipRBox(g, hullM, 0, 1.1, -1.6, 0.9, 2.1, 3.4, 0.4);                   // Turm
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 0.7), hullM); f.position.set(s * 1.1, 2.3, -2.2); g.add(f); }   // Tiefenruder am Turm
    for (const a of [0, 1, 2, 3]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.3, 1.1), hullM); f.position.set(0, 0, 6.6); f.rotation.z = a * Math.PI / 2; f.translateY(0.85); g.add(f); }   // Kreuzleitwerk
    const prop = new THREE.Group(); prop.position.set(0, 0, 8.1); for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.05), dark); b.position.y = 0.35; const h = new THREE.Group(); h.rotation.z = k / 5 * Math.PI * 2; b.rotation.y = 0.5; h.add(b); prop.add(h); } g.add(prop);
    for (const x of [-0.25, 0.25]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), glow); l.position.set(x, 2.6, -3.32); g.add(l); }   // Lichter am Turm
    const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16), dark); hatch.position.set(0, 3.25, -1.2); g.add(hatch);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return { g, prop };
  }
  const add = (name, g, x, z, h, spec, y) => { g.position.set(x, y ?? SEA_Y, z); g.rotation.y = h; g.userData.dynamic = true; g.userData.noLift = true; scene.add(g);
    const b = { name, g, x, z, h, v: 0, on: false, y: y ?? SEA_Y, spec, home: { x, z, h, y: y ?? SEA_Y } }; BOATS.push(b); return b; };
  add("Schnellboot", buildSpeedboat(), -11, 33.6, Math.PI, { name: "Schnellboot", max: 24, acc: 9, rev: 4, turn: 1.25, enter: 4.5, trim: 0.14, camD: 9, camH: 1.6, seat: [0.6, 0.9], engine: "Boot",
    hull: [[0, -4], [0, 3.8], [-1.15, -1.5], [1.15, -1.5], [-1.15, 3.5], [1.15, 3.5]] });
  { const S = buildSubmarine(), top = SEA_Y - 0.35, b = add("U-Boot", S.g, 2, 36.4, -Math.PI / 2, { name: "U-Boot", max: 10, acc: 3, rev: 2, turn: 0.55, enter: 6, trim: 0.03, rock: 0.4, camD: 17, camH: 3, seat: [1.6, 3.2], engine: "Boot", exitR: 2,
      hull: [[0, -7.6], [0, 7.8], [-1.5, -4], [1.5, -4], [-1.5, 4], [1.5, 4], [-1.5, 0], [1.5, 0]], sub: { r: 1.5, top, climb: 1.4, vUnder: 7 } }, top);
    b.spin = dt => { S.prop.rotation.z += dt * b.v * 1.2; }; }
}
