// Wayne Manor 3D – Garagenrampe: Klapprampe im Rasen oestlich vom Haus, Wendeplatz unter fester Decke, Rolltor in die Tiefgarage
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Nicolas 2026-11-10 (Skizze): Klappe 7 x 22,7 m (Scharnier im Norden auf Rasenhoehe), offen sinkt das Suedende auf den Garagenboden (ca. 10 %),
// Wendeplatz 14 x 14 m auf Garagenhoehe, Rolltor in der Ostwand der nach Sueden vergroesserten Garage. Masse in GRAMP (strassen/hauptstrasse.js).
// Gebaut nach liftPlateau in Endhoehe. Boden/Kollision: groundAt (Klappe, Wendeplatz), Waende als Quader. Ein Tor-Eintrag oeffnet erst die Klappe, dann das Rolltor.
"use strict";

{
  const F = GRAMP.F, P = GRAMP.P, Y0 = GY + HILL, L = F.z1 - F.z0, TOP = HILL + 0.02, TP = HILL - 0.42, concrete = mat.garageWall, cx = (F.x0 + F.x1) / 2;
  // Grube unter der Klappe und Wendeplatz: Boden, Waende (Oberkante knapp unter dem Rasen), Decke ueber dem Wendeplatz
  B(F.x0, F.x1, Y0 - 0.3, Y0, F.z0, P.z0, concrete); B(P.x0, P.x1, Y0 - 0.3, Y0, P.z0, P.z1, mat.floorStone);
  B(F.x0 - 0.4, F.x0, Y0, TOP, F.z0 - 0.4, P.z0, concrete); B(F.x1, F.x1 + 0.4, Y0, TOP, F.z0 - 0.4, P.z0, concrete); B(F.x1, F.x1 + 0.4, Y0, TP, P.z0, P.z1 + 0.4, concrete);   // Seitenwaende bis unter den Rasenkragen (Nicolas: Luecken mit Himmel), Ost laeuft am Wendeplatz weiter
  B(F.x0, F.x1, Y0, HILL - 0.33, F.z0 - 0.4, F.z0, concrete);                                                                         // Nordwand unter dem Scharnier
  B(P.x0, F.x0, Y0, TP, P.z0 - 0.4, P.z0, concrete); B(4.2, F.x1, Y0, TP, 52.95, P.z1 + 0.4, concrete);                      // Wendeplatz Nord (bis zur Klappe) und Sued (bis an die Garagenecke, Nicolas: Loch neben dem Tor)
  B(P.x0, F.x1 + 0.4, HILL - 0.42, HILL - 0.08, P.z0, P.z1 + 0.4, concrete); B(F.x0 - 0.4, F.x1 + 0.4, HILL - 0.42, TOP, P.z0, P.z0 + 0.4, concrete);   // Decke (Rasen bleibt darueber), Vorderkante bis unter den Rasenkragen
  for (let x = P.x0 + 2; x < P.x1 - 1; x += 4) for (let z = P.z0 + 2.5; z < P.z1 - 1; z += 4) B(x - 0.7, x + 0.7, HILL - 0.47, HILL - 0.42, z - 0.08, z + 0.08, mat.glow, false, world, false);   // Deckenlampen
  for (const x of [F.x0 + 0.02, F.x1 - 0.02]) for (let z = F.z0 + 2; z < P.z0; z += 5) B(x - 0.03, x + 0.03, Y0 + 0.9, Y0 + 1.0, z - 0.6, z + 0.6, mat.glow, false, world, false);   // Leuchten in der Grube
  for (let z = F.z0 + 1; z < P.z0 - 0.5; z += 1.6) B(cx - 0.3, cx + 0.3, Y0 + 0.005, Y0 + 0.015, z, z + 0.8, M(0xf2c230, { roughness: 0.6 }), false, world, false);   // gelbe Mittelmarkierung
  // Rasenkragen um die Klappe (der Gelaendeausschnitt ist bis ca. 2 m groesser): feines Netz wie das Gelaende, Loch fuer die Klappe
  { const E = 3, st = 0.5, x0 = F.x0 - E, z0 = F.z0 - E, nx = Math.round((F.x1 - F.x0 + 2 * E) / st), nz = Math.round((F.z1 - F.z0 + 2 * E) / st), pos = [], col = [], uv = [], idx = [], c = new THREE.Color(), cA = new THREE.Color(0x5b8c3c), cB = new THREE.Color(0x739c47), cL = new THREE.Color(0x6aa84a);
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = x0 + i * st, z = z0 + j * st; pos.push(x, terrainH(x, z) + 0.03, z); uv.push(x / 10, -z / 10);
      c.copy(cA).lerp(cB, vnoise(x / 40, z / 40)).lerp(cL, 0.7 * Math.max(sst(40, 0, siteDist(x, z)), inLawn(x, z) ? 1 : 0)); col.push(c.r, c.g, c.b); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { if (GRAMP.inF(x0 + (i + 0.5) * st, z0 + (j + 0.5) * st, -0.01)) continue; const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, M(0xffffff, { map: grassTex, vertexColors: true, roughness: 1 })); m.receiveShadow = true; world.add(m); }
  // Klappe (dreht um das Scharnier am Nordende) und Rolltor in der Garagen-Ostwand: zwei eigene Tore (Nicolas: einzeln oeffnen)
  const g = new THREE.Group(), gd = new THREE.Group(); g.userData.dynamic = gd.userData.dynamic = true; world.add(g, gd);
  const gc = new THREE.Color(0x5b8c3c).lerp(new THREE.Color(0x6aa84a), 0.7), grassM = M(gc.getHex(), { map: texClone(grassTex, 0.1, 0.1), roughness: 1 });
  const piv = new THREE.Group(); piv.position.set(cx, HILL + 0.03, F.z0); g.add(piv);
  { const w = F.x1 - F.x0 - 0.06, bg = new THREE.BoxGeometry(w, 0.3, L - 0.04); boxUV(bg, w, 0.3, L); const p = new THREE.Mesh(bg, [concrete, concrete, grassM, concrete, concrete, concrete]); p.position.set(0, -0.15, L / 2); p.castShadow = p.receiveShadow = true; piv.add(p);
    for (const sd of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, L - 0.1), M(0xf2c230, { roughness: 0.6 })); r.position.set(sd * (w / 2 - 0.3), -0.33, L / 2); piv.add(r); } }   // gelbe Kanten unten (sichtbar, wenn offen)
  const DH = 3.6, door = new THREE.Mesh(new THREE.BoxGeometry(0.1, DH, GRAMP.D1 - GRAMP.D0).translate(0, -DH / 2, 0), M(0x7c8189, { metalness: 0.5, roughness: 0.5, map: canvasTex(16, 64, (c2, w, hh) => { c2.fillStyle = "#c8ccd2"; c2.fillRect(0, 0, w, hh); c2.fillStyle = "#8a8f96"; for (let y = 0; y < hh; y += 4) c2.fillRect(0, y, w, 1); }) }));
  door.position.set(4.5, Y0 + DH, (GRAMP.D0 + GRAMP.D1) / 2); door.castShadow = true; gd.add(door);
  const doorS = S(4.25, 4.75, Y0, Y0 + DH, GRAMP.D0, GRAMP.D1);
  const animF = f => { GRAMP.f = f; piv.rotation.x = GRAMP.ang(); }, animD = o => { door.scale.y = Math.max(0.04, 1 - o); doorS.y0 = Y0 + DH * o; doorS.on = o < 0.999; };
  animF(0); animD(0);
  const inDoor = (x, z, m) => x > 4.5 - m && x < 4.5 + m && z > GRAMP.D0 && z < GRAMP.D1, onF = (x, y, z, m) => GRAMP.inF(x, z, m) && y < HILL - 0.2 && y > GRAMP.y(z) - 1, onD = (x, y, z, m) => inDoor(x, z, m + 0.3) && y < Y0 + 3;   // nur wer wirklich auf der Klappe oder im Tor steht
  const blk = on => () => (!VEH.some(v => v.on) && on(player.pos.x, player.pos.y, player.pos.z, 0.2)) || VEH.some(v => on(v.x, v.y, v.z, 0.5));   // im Fahrzeug zaehlt nur das Fahrzeug (player.pos bleibt am Einstiegsort)
  GRAMP.near = p => Math.max(P.x0 - p.x, p.x - P.x1, 0) ** 2 + Math.max(F.z0 - p.z, p.z - P.z1, 0) ** 2 < 15 * 15 && Math.abs(p.y - HILL + 2) < 8;
  GRAMP.gate = { name: "Garagenrampe (Klappe)", g, open: 0, target: 0, dur: 6, anim: animF, a: [cx, F.z0 + 6], b: [cx, F.z1 - 6], verbs: ["öffnen", "schließen"], block: blk(onF), blockMsg: "Garagenrampe stoppt: erst von der Klappe fahren" };
  GRAMP.door = { name: "Garagentor (Rampe)", g: gd, open: 0, target: 0, dur: 3, anim: animD, a: [4.5, GRAMP.D0], b: [4.5, GRAMP.D1], verbs: ["öffnen", "schließen"], block: blk(onD), blockMsg: "Garagentor stoppt: erst aus dem Tor fahren" };
  GRAMP.gate.retry = GRAMP.door.retry = true;   // Nicolas: blockiert -> wieder auf, 1 s frei -> schliesst von selbst
  GRAMP.gate.also = [GRAMP.door]; GRAMP.door.also = [GRAMP.gate];   // Nicolas: zusammen oeffnen, einzeln schliessen
  gates.push(GRAMP.gate, GRAMP.door);
}
