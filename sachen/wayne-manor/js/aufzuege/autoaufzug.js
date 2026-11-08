// Wayne Manor 3D – Autoaufzug Garage - Hangfuss - Batcave
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Autoaufzug Garage - Hangfuss - Batcave (A3) =====================
// Schacht CSH (7,3 x 4,5 m, Laengsachse West-Ost, man faehrt durch). Halte: Garage (Tor Ost), Hangfuss (Tor West -> Tunnel -> Felstor),
// Batcave (Tor West -> Geheimgang -> getarnte Felswand in der Auto Repair). Rolltore an jedem Halt, Bedienung wie der Personenaufzug.
{
  const concrete = M(0x8e8c86, { map: texClone(rockTex, 1 / 3, 1 / 3), roughness: 0.95 }), stripe = M(0xf2c230, { roughness: 0.6 }), roofM = M(0xc9c2b2, { roughness: 0.85 });
  const cx = (CSH.x0 + CSH.x1) / 2, cz = (CSH.z0 + CSH.z1) / 2, top = HILL - 0.05;
  // Schachtwaende (Oeffnungen an den Halten), Dach im Hof als geschlossene Steinflaeche
  wall("x", CSH_OUT.x0, CSH_OUT.x1, CSH.z0 - 0.15, LY - 0.3, top, [], concrete, 0.3);
  wall("x", CSH_OUT.x0, CSH_OUT.x1, CSH.z1 + 0.15, LY - 0.3, top, [], concrete, 0.3);
  wall("z", CSH.z0, CSH.z1, CSH.x0 - 0.15, LY - 0.3, top, [[CSH.z0, CSH.z1, HF_Y, HF_Y + 4.0]], concrete, 0.3);   // Batcave: Westtor entfernt (Nicolas), dahinter das Versteck
  wall("z", CSH.z0, CSH.z1, CSH.x1 + 0.12, LY - 0.3, top, [[CSH.z0, CSH.z1, GY + HILL, GY + HILL + 3.6], [CSH.z0, CSH.z1, LY, LY + 4.0]], concrete, 0.24);   // E5: auch unten nach Osten offen
  B(CSH_OUT.x0 - 0.2, CSH_OUT.x1 + 0.2, top, HILL + 0.14, CSH_OUT.z0 - 0.2, CSH_OUT.z1 + 0.2, roofM);
  for (const y of [HF_Y, GY + HILL, LY]) B(CSH.x0 + 0.3, CSH.x1 - 0.3, y + 4.3, y + 4.38, cz - 0.15, cz + 0.15, mat.glow, false, world, false);
  // E5: Batcave-Tor nach Osten zum Hoehlentunnel. Die Plattform dreht sich nicht (Nicolas); wer von der Garage kommt, faehrt unten rueckwaerts hinaus.
  // Das fruehere Westtor (Geheimgang) ist zu; der Raum dahinter ist ein Versteck mit einem schwarzen Tumbler hinter der getarnten Felswand.
  // Plattform (faehrt), gelb-schwarze Kanten, Gelaender an den Laengsseiten
  const stops = [{ name: "Garage", y: GY + HILL, side: 1, sides: [1] }, { name: "Hangfuss (Felstor)", y: HF_Y, side: -1, sides: [-1] }, { name: "Batcave (Tunnel)", y: LY, side: 1, sides: [1] }];
  const L = { y: stops[0].y, at: 0, target: 0, state: "idle", t: 0, from: stops[0].y, to: stops[0].y, open: stops.map((_, i) => i === 0 ? 1 : 0), rot: 0, rotFrom: 0, rotTo: 0 };
  const plat = new THREE.Group(); plat.position.set(cx, L.y, cz); plat.userData.dynamic = true; world.add(plat);
  const hx = (CSH.x1 - CSH.x0) / 2 - 0.06, hz = (CSH.z1 - CSH.z0) / 2 - 0.06;
  B(-hx, hx, -0.3, 0, -hz, hz, mat.steel, false, plat);
  for (const s of [-1, 1]) {
    B(s * hx - 0.25, s * hx + 0.25, 0, 0.02, -hz, hz, stripe, false, plat, false);
    for (let k = 0; k < 6; k++) B(-hx + 0.4 + k * (2 * hx - 0.8) / 5 - 0.04, -hx + 0.4 + k * (2 * hx - 0.8) / 5 + 0.04, 0, 1.0, s * (hz - 0.08) - 0.04, s * (hz - 0.08) + 0.04, mat.steel, false, plat);
    B(-hx + 0.36, hx - 0.36, 0.95, 1.02, s * (hz - 0.08) - 0.04, s * (hz - 0.08) + 0.04, stripe, false, plat);
  }
  const floor = S(CSH.x0 + 0.05, CSH.x1 - 0.05, L.y - 0.3, L.y, CSH.z0 + 0.05, CSH.z1 - 0.05);
  // Rolltore: rollen nach oben ein (Hoehe skaliert), geschlossen sperren sie
  const doorG = new THREE.Group(); doorG.userData.dynamic = true; world.add(doorG);
  const doors = stops.flatMap((st, i) => st.sides.map(sd => ({ st, i, sd }))).map(({ st, i, sd }) => {
    const h = i === 0 ? 3.6 : 4.0, x = sd > 0 ? CSH.x1 + 0.02 : CSH.x0 - 0.02;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, CSH.z1 - CSH.z0).translate(0, -h / 2, 0), M(0x7c8189, { metalness: 0.5, roughness: 0.5, map: canvasTex(16, 64, (g, w, hh) => { g.fillStyle = "#c8ccd2"; g.fillRect(0, 0, w, hh); g.fillStyle = "#8a8f96"; for (let y = 0; y < hh; y += 4) g.fillRect(0, y, w, 1); }) }));
    m.position.set(x, st.y + h, cz); m.castShadow = true; doorG.add(m);
    return { m, i, y0: st.y, h, solid: S(x - 0.15, x + 0.15, st.y, st.y + h, CSH.z0, CSH.z1, i !== 0) };
  });
  const order = stops.map((_, i) => i).sort((a, b) => stops[a].y - stops[b].y);
  const inCarC = p => p.x > CSH.x0 + 0.05 && p.x < CSH.x1 - 0.05 && p.z > CSH.z0 + 0.05 && p.z < CSH.z1 - 0.05 && Math.abs(p.y - L.y) < 1.5;
  const nearC = p => inCarC(p) || (Math.hypot(p.x - cx, p.z - cz) < 10 && stops.some(s => Math.abs(p.y - s.y) < 2.5));
  function apply() {
    plat.position.y = L.y; Object.assign(floor, { y0: L.y - 0.3, y1: L.y });
    doors.forEach(d => { const o = L.open[d.i]; d.m.scale.y = Math.max(0.04, 1 - o); d.solid.y0 = d.y0 + d.h * o; d.solid.on = o < 0.999; });   // Unterkante rollt hoch: darunter frei
    plat.rotation.y = L.rot;
  }
  function update(dt) {
    if (L.state === "idle" && L.target !== L.at) L.state = "closing";
    if (L.state === "closing") { L.open[L.at] = Math.max(0, L.open[L.at] - dt / 1.6); if (L.open[L.at] <= 0) {
      L.state = "moving"; L.t = 0; L.from = L.y; L.to = stops[L.target].y;
      L.rotFrom = L.rot; L.rotTo = L.rot;                                         // kein Drehteller mehr (Nicolas 2026-11-08: "der Autoaufzug soll sich nicht drehen")
    } }
    else if (L.state === "moving") {
      L.t = Math.min(1, L.t + dt / Math.max(2.5, Math.abs(L.to - L.from) / 7)); L.y = lerp(L.from, L.to, sst(0, 1, L.t));
      const nr = lerp(L.rotFrom, L.rotTo, sst(0.1, 0.9, L.t)), da = nr - L.rot; L.rot = nr;
      if (da) {                                                                   // Auto und Spieler auf der Plattform drehen mit
        const c = Math.cos(da), s = Math.sin(da), turn = o => { const dx = o.x - cx, dz = o.z - cz; o.x = cx + dx * c + dz * s; o.z = cz - dx * s + dz * c; };
        const vs = world.userData.vehicles || [];
        for (const car of vs) if (inCarC({ x: car.x, y: car.y, z: car.z })) { turn(car); car.h += da; if (car.on) player.yaw += da; }
        if (walking && !ghost && !vs.some(v => v.on) && inCarC(player.pos)) { turn(player.pos); player.yaw += da; }
      }
      if (L.t >= 1) { L.at = L.target; L.state = "opening"; L.rot = L.rotTo % (Math.PI * 2); }
    }
    else if (L.state === "opening") { L.open[L.at] = Math.min(1, L.open[L.at] + dt / 1.6); if (L.open[L.at] >= 1) L.state = "idle"; }
    apply();
  }
  function use() {
    if (L.state !== "idle") return toast("Autoaufzug ist unterwegs");
    const p = player.pos;
    if (inCarC(p)) { const k = (order.indexOf(L.at) + 1) % order.length; L.target = order[k]; return toast("Fahrt: " + stops[L.target].name + " (Pfeil hoch/runter oder 1-3)"); }
    const here = stops.findIndex(s => Math.abs(p.y - s.y) < 2.5);
    if (here < 0) return toast("Zu weit vom Autoaufzug entfernt");
    if (L.at === here) return toast("Der Autoaufzug ist schon da");
    L.target = here; toast("Der Autoaufzug kommt");
  }
  function pick(i) { if (!walking || !inCarC(player.pos) || L.state !== "idle" || i === L.at || !stops[i]) return; L.target = i; toast("Fahrt: " + stops[i].name); }
  function step(dir) { const k = order.indexOf(L.at) + dir; if (k < 0 || k >= order.length) return toast(dir > 0 ? "Ganz oben" : "Ganz unten"); pick(order[k]); }
  apply();
  CAR_LIFT = { stops, order, L, inCar: inCarC, near: nearC, update, use, pick, step };
  // Licht im Schacht und im Tunnel (nur unter der Erde an)
  for (const [x, y, z] of [[cx, HF_Y + 3.5, cz], [-50, HF_Y + 3.6, cz]]) { const l = new THREE.PointLight(0xfff0d8, 0, 18, 1.6); l.position.set(x, y, z); l.userData.I = 22; scene.add(l); caveLights.push(l); }

  // Tunnel zum Westhang
  B(HF_TUN.x0, HF_TUN.x1, HF_Y - 0.4, HF_Y, HF_TUN.z0, HF_TUN.z1, concrete);
  B(HF_TUN.x0, HF_TUN.x1, HF_Y, HF_Y + 4.8, HF_TUN.z0 - 0.4, HF_TUN.z0, concrete);
  B(HF_TUN.x0, HF_TUN.x1, HF_Y, HF_Y + 4.8, HF_TUN.z1, HF_TUN.z1 + 0.4, concrete);
  B(HF_TUN.x0, HF_TUN.x1, HF_Y + 4.8, HF_Y + 5.2, HF_TUN.z0 - 0.4, HF_TUN.z1 + 0.4, concrete);
  for (let x = HF_TUN.x0 + 2; x < HF_TUN.x1 - 1; x += 4) B(x - 0.8, x + 0.8, HF_Y + 4.72, HF_Y + 4.8, cz - 0.12, cz + 0.12, mat.glow, false, world, false);
  // Getarntes Felstor am Portal (faehrt nach oben in den Fels), Felsen rahmen das Portal, steile Felspartie rundherum
  const rockGate = (name, gx, gz, along, len, h, y0, rotY) => {
    const g = new THREE.Group(); g.position.set(gx, y0, gz); g.rotation.y = rotY; g.userData.dynamic = true; world.add(g);
    const rockM = M(0x77736c, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1, flatShading: true });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(len, h, 1.0), rockM); slab.position.y = h / 2; slab.castShadow = slab.receiveShadow = true; g.add(slab);
    const gr = rng(name.length * 31);
    for (let k = 0; k < 22; k++) { const s = 0.5 + gr() * 1.2, m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), rockM); m.position.set((gr() - 0.5) * (len - 0.6), 0.4 + gr() * (h - 0.8), (k % 2 ? 1 : -1) * (0.35 + gr() * 0.25)); m.rotation.set(gr() * 6, gr() * 6, gr() * 6); m.scale.set(1, 1, 0.5); g.add(m); }
    const solid = along === "z" ? S(gx - 0.5, gx + 0.5, y0, y0 + h, gz - len / 2, gz + len / 2) : S(gx - len / 2, gx + len / 2, y0, y0 + h, gz - 0.5, gz + 0.5);
    const a = along === "z" ? [gx, gz - len / 2] : [gx - len / 2, gz], b = along === "z" ? [gx, gz + len / 2] : [gx + len / 2, gz];
    gates.push({ name, g, open: 0, target: 0, lift: h + 0.3, y0, solid, a, b });
  };
  rockGate("Felstor", HF_TUN.x0 + 0.5, cz, "z", HF_TUN.z1 - HF_TUN.z0 + 0.4, 4.9, HF_Y - 0.1, Math.PI / 2);
  // Fels rund um die Tunneloeffnung (das Gelaende ist dort fuer das Portal ausgeschnitten): Scheiben bis knapp unter die Gelaendeoberflaeche
  {
    const portalRock = M(0x8f8b84, { map: texClone(rockTex, 1 / 3, 1 / 3), roughness: 1 });
    // Saeulen im 0,8-m-Raster, jede bis knapp ueber das (ausgeschnittene) Gelaende an ihrer Stelle; im Tunnel erst ueber der Decke
    const st = 0.8;
    for (let x = HF_PORTAL.x0 + 1.2; x < HF_PORTAL.x1 + 2.2; x += st) for (let z = HF_PORTAL.z0 - 1.2; z < HF_PORTAL.z1 + 1.2; z += st) {
      const top = Math.min(HILL + 0.1, Math.max(terrainH(x, z), terrainH(x + st, z), terrainH(x, z + st), terrainH(x + st, z + st)) + 0.1);
      const inTun = z + st > HF_TUN.z0 && z < HF_TUN.z1, bot = inTun ? HF_Y + 4.8 : -0.6;
      if (top > bot + 0.05) B(x, x + st, bot, top, z, z + st, portalRock, !inTun);
    }
  }
  const geos = [], pr = rng(616);
  const put = (g, x, y, z, rot, yTop = HILL + 0.3) => { g.rotateY(rot); g.translate(x, y, z); const P = g.attributes.position; for (let q = 0; q < P.count; q++) if (P.getY(q) > yTop) P.setY(q, yTop); g.computeVertexNormals(); geos.push(g); };
  put(makeRock(1.4, 4.2, 1.6, pr()), HF_TUN.x0 - 0.6, 3.6, HF_TUN.z0 - 1.5, Math.PI / 2);
  put(makeRock(1.4, 4.2, 1.6, pr()), HF_TUN.x0 - 0.6, 3.6, HF_TUN.z1 + 1.5, Math.PI / 2);
  put(makeRock(4.6, 2.2, 1.8, pr()), HF_TUN.x0 - 0.4, HF_Y + 6.4, cz, Math.PI / 2);
  for (const sd of [-1, 1]) for (let a = 5.5; a < 12; a += 2.6 + pr() * 1.5) for (const y of [2 + pr() * 3, 11 + pr() * 6]) {
    const w = 3 + pr() * 3, h = 7 + pr() * 6;
    put(makeRock(w / 2, h / 2, 1.2 + pr() * 0.6, pr()), -56.6 - pr() * 0.8, y, cz + sd * a, Math.PI / 2 + (pr() - 0.5) * 0.3);
  }
  for (const z of [HF_TUN.z0 - 1.5, HF_TUN.z1 + 1.5]) circles.push([HF_TUN.x0 - 0.6, z, 1.3, 9]);
  // Platz vor dem Tor (hier schliesst spaeter die Zufahrt an)
  B(-67, HF_TUN.x0 - 0.9, -0.3, 0.05, cz - 1.8, cz + 9, M(0x8b8478, { map: texClone(rockTex, 1 / 3, 1 / 3), roughness: 0.95 }), false);

  // Geheimgang unten: getarnte Felswand am Nordende (von der Auto Repair aus sieht es wie Fels aus)
  rockGate("Felswand (Geheimgang)", (CGB.x0 + CGB.x1) / 2, CGB.z0 + 2.4, "x", CGB.x1 - CGB.x0 + 0.6, LH - 1.2, LY - 0.2, 0);
  if (geos.length) { const m = new THREE.Mesh(mergeGeometries(geos, false), M(0xffffff, { vertexColors: true, map: rockTex, roughness: 0.9 })); m.castShadow = m.receiveShadow = true; m.userData.keep = true; scene.add(m); }
}
