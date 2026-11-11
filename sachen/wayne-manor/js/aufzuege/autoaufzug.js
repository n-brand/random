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
  for (const y of [HF_Y, GY + HILL, LY]) { const ly = Math.min(y + 4.3, HILL - 0.5); B(CSH.x0 + 0.3, CSH.x1 - 0.3, ly, ly + 0.08, cz - 0.15, cz + 0.15, mat.glow, false, world, false); }   // Garage: unter der Rasenflaeche (ragte durch)
  // E5: Batcave-Tor nach Osten zum Hoehlentunnel. Die Plattform dreht sich nicht (Nicolas); wer von der Garage kommt, faehrt unten rueckwaerts hinaus.
  // Das fruehere Westtor (Geheimgang) ist zu; der Raum dahinter ist ein Versteck mit einem schwarzen Tumbler hinter der getarnten Felswand.
  // Plattform (faehrt), gelb-schwarze Kanten, Gelaender an den Laengsseiten
  const stops = [{ name: "Garage", y: GY + HILL, side: 1, sides: [1] }, { name: "Hangfuss (Felstor)", y: HF_Y, side: -1, sides: [-1] }, { name: "Batcave (Tunnel)", y: LY, side: 1, sides: [1] }];
  const L = { y: stops[0].y, at: 0, target: 0, state: "idle", t: 0, from: stops[0].y, to: stops[0].y, open: stops.map((_, i) => i === 0 ? 1 : 0), rot: 0, rotFrom: 0, rotTo: 0 };
  const plat = new THREE.Group(); plat.position.set(cx, L.y, cz); plat.userData.dynamic = true; world.add(plat);
  const hx = (CSH.x1 - CSH.x0) / 2 - 0.06, hz = (CSH.z1 - CSH.z0) / 2 - 0.06;
  B(-hx, hx, -0.3, 0.04, -hz, hz, mat.steel, false, plat);   // Deck 4 cm ueber der Haltestelle: unten lag es genau auf dem Batcave-Boden (flimmerte, Nicolas 2026-11-10)
  for (const s of [-1, 1]) {
    B(s * hx - 0.25, s * hx + 0.25, 0.04, 0.06, -hz, hz, stripe, false, plat, false);
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
  // Rechtsklick auf ein Rolltor holt den Autoaufzug (Nicolas 2026-11-08, statt Taste E; siehe tore.js)
  gates.push({ name: "Autoaufzug", g: doorG, call: () => nearC(player.pos) ? use() : toast("Zu weit vom Autoaufzug entfernt"), verbs: ["holen / fahren", "holen / fahren"], a: [cx, cz], b: [cx, cz] });
  // Licht im Schacht und im Tunnel (nur unter der Erde an)
  for (const [x, y, z] of [[cx, HF_Y + 3.5, cz], [-50, HF_Y + 3.6, cz]]) { const l = new THREE.PointLight(0xfff0d8, 0, 18, 1.6); l.position.set(x, y, z); l.userData.I = 22; scene.add(l); caveLights.push(l); }

  // Tunnel zum Westhang
  B(HF_TUN.x0, HF_TUN.x1, HF_Y - 0.4, HF_Y, HF_TUN.z0, HF_TUN.z1, concrete);
  B(HF_TUN.x0, HF_TUN.x1, HF_Y, HF_Y + 4.8, HF_TUN.z0 - 0.4, HF_TUN.z0, concrete);
  B(HF_TUN.x0, HF_TUN.x1, HF_Y, HF_Y + 4.8, HF_TUN.z1, HF_TUN.z1 + 0.4, concrete);
  B(HF_TUN.x0, HF_TUN.x1, HF_Y + 4.8, HF_Y + 5.2, HF_TUN.z0 - 0.4, HF_TUN.z1 + 0.4, concrete);
  B(CSH.x0 - 0.35, CSH.x0 + 0.1, HF_Y - 0.4, HF_Y + 5.2, HF_TUN.z0 - 0.4, CSH.z0 + 0.05, concrete); B(CSH.x0 - 0.35, CSH.x0 + 0.1, HF_Y - 0.4, HF_Y + 5.2, CSH.z1 - 0.05, HF_TUN.z1 + 0.4, concrete);   // Tunnel breiter als der Schacht: Ecken zur Schachtwand schliessen (Nicolas: Luecken)
  for (let x = HF_TUN.x0 + 2; x < HF_TUN.x1 - 1; x += 4) B(x - 0.8, x + 0.8, HF_Y + 4.72, HF_Y + 4.8, cz - 0.12, cz + 0.12, mat.glow, false, world, false);
  // Getarntes Felstor (faehrt nach oben in den Fels), hier fuer den Geheimgang in der Batcave
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
  // Westweg (Nicolas 2026-11-09, statt Felstor im Einschnitt): Natursteinportal am Tunnelende HF_XP, Stuetzmauern am Einschnitt, Kiesstrasse HFR
  // bis durch das Westtor; Lampen im verlaengerten Tunnel
  {
    const stoneM = M(0xffffff, { map: texClone(brickTex, 1 / 1.5, 1 / 1.5), roughness: 0.95 }), capM = M(0xbdb6a6, { roughness: 0.8 }), X = HF_XP, Z0 = HF_TUN.z0, Z1 = HF_TUN.z1, HT = HF_Y + 4.8;
    // Quader mit schraeger Oberkante (folgt dem Gelaende wie die Grundstuecksmauer): along "x" oder "z" von a0 nach a1, Oberkante tA -> tB; fest per S()
    const raked = (along, a0, a1, yb, tA, tB, c0, c1, m, solid = true) => { const [bA, bB] = Array.isArray(yb) ? yb : [yb, yb]; const L = a1 - a0, g = new THREE.BoxGeometry(along === "x" ? Math.abs(L) : c1 - c0, 1, along === "x" ? c1 - c0 : Math.abs(L)).toNonIndexed(), P = g.attributes.position, U = g.attributes.uv;
      for (let k = 0; k < P.count; k++) { const u = (along === "x" ? P.getX(k) : P.getZ(k)) / L + 0.5, y = P.getY(k) > 0 ? tA + (tB - tA) * u : bA + (bB - bA) * u; P.setY(k, y); U.setXY(k, a0 + u * L + (along === "x" ? P.getZ(k) : P.getX(k)) * 0.7, y); }
      g.computeVertexNormals(); g.translate(along === "x" ? (a0 + a1) / 2 : (c0 + c1) / 2, 0, along === "x" ? (c0 + c1) / 2 : (a0 + a1) / 2);
      const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; world.add(o);
      if (solid) along === "x" ? S(Math.min(a0, a1), Math.max(a0, a1), Math.min(bA, bB), Math.max(tA, tB), c0, c1) : S(c0, c1, Math.min(bA, bB), Math.max(tA, tB), Math.min(a0, a1), Math.max(a0, a1)); };
    // Portalwand: Oberkante folgt dem Hang (Gelaende 1 m hinter der Wand + 0,3), ueber der Oeffnung mindestens 0,9 m Sturz
    const top = z => Math.max(genH0(X + 1.0, z) + 0.3, z > Z0 - 0.5 && z < Z1 + 0.5 ? HT + 0.9 : HF_Y + 1.5);
    for (const [za, zb] of [[cz - 8, Z0 - 0.4], [Z1 + 0.4, cz + 8]]) for (let z = za, n = Math.ceil(zb - za); n > 0; n--) { const z1 = Math.min(zb, z + 1);
      { raked("z", z, z1, HF_Y - 0.5, top(z), top(z1), X - 0.8, X + 0.4, stoneM); raked("z", z, z1, [top(z), top(z1)], top(z) + 0.18, top(z1) + 0.18, X - 1.0, X + 0.4, capM, false); } z = z1; }
    raked("z", Z0 - 0.4, Z1 + 0.4, HT + 0.4, top(Z0 - 0.4), top(Z1 + 0.4), X - 0.8, X + 0.4, stoneM); raked("z", Z0 - 0.4, Z1 + 0.4, [top(Z0 - 0.4), top(Z1 + 0.4)], top(Z0 - 0.4) + 0.18, top(Z1 + 0.4) + 0.18, X - 1.0, X + 0.4, capM, false);
    // Gelaendestueck ueber dem Tunnelmund (Nicolas: gruener Block haesslich): feines Netz wie das Gelaende (gleiche Grastextur und Farben), ueber
    // dem Ausschnitt mind. 0,7 m ueber der Tunneldecke, zu den Raendern weich in den Hang; leicht ueber dem Gelaende, damit nichts durchschaut
    { const x0 = X - 40, x1 = X + 10, z0 = cz - 10, z1 = cz + 10, st = 0.5, nx = Math.round((x1 - x0) / st), nz = Math.round((z1 - z0) / st), pos = [], col = [], uv = [], idx = [], lift = [];
      const cA = new THREE.Color(0x5b8c3c), cB = new THREE.Color(0x739c47), cL = new THREE.Color(0x6aa84a), cF = new THREE.Color(0x3b6430), c = new THREE.Color();
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = x0 + i * st, z = z0 + j * st, dz = Math.abs(z - cz);
        const T = terrainH(x, z), cp = hfCap(x, z), h = Math.max(T, cp ?? -1e9) + 0.04;   // urspruenglicher Hang, keine Mulde (hfCap in strassen/hauptstrasse.js)
        lift.push(cp !== null && (cp - T > 0.02 || (x >= X - 0.6 && x < X + 9.5 && dz < 6)));   // ueber dem Raster, und immer ueber dem Ausschnitt (Tunnelmund, gelaende.js cut), nie in der Einfahrt
        pos.push(x, h, z); uv.push(x / 10, -z / 10);
        c.copy(cA).lerp(cB, vnoise(x / 40, z / 40)).lerp(cL, 0.7 * Math.max(sst(40, 0, siteDist(x, z)), inLawn(x, z) ? 1 : 0)).lerp(cF, forestD(x, z) * 0.8); col.push(c.r, c.g, c.b); }
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1; if (lift[a] && lift[b] && lift[d] && lift[e]) idx.push(a, d, b, b, d, e); }   // nur wo alle Ecken ueber dem Raster liegen (sonst gruene Wand im Portalmund)
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx); geo.computeVertexNormals(); const patch = new THREE.Mesh(geo, M(0xffffff, { map: grassTex, vertexColors: true, roughness: 1 })); patch.receiveShadow = true; world.add(patch); }
    B(X - 1.0, X - 0.8, HF_Y, HT + 0.4, Z0 - 0.4, Z0, capM, false); B(X - 1.0, X - 0.8, HF_Y, HT + 0.4, Z1, Z1 + 0.4, capM, false); B(X - 1.0, X - 0.8, HT, HT + 0.4, Z0, Z1, capM, false);   // Rahmen
    // Stuetzmauern am Einschnitt, schraeg mit dem urspruenglichen Gelaende, solange der Einschnitt tiefer als 0,4 m ist
    for (const sd of [-1, 1]) { const zw = sd < 0 ? Z0 - 0.6 : Z1 + 0.6, za = sd < 0 ? Z0 - 1.0 : Z1 + 0.2, zb = sd < 0 ? Z0 - 0.2 : Z1 + 1.0, h0 = x => genH0(x, zw) + 0.35;
      for (let x = X - 0.8; x > X - 40; x -= 1.5) { const rn = roadNear(HFR, x - 0.75, cz, 8); if (!rn || genH0(x - 0.75, zw) - rn.y < 0.4) break;
        raked("x", x, x - 1.5, rn.y - 0.6, h0(x), h0(x - 1.5), za, zb, stoneM); raked("x", x, x - 1.5, [h0(x), h0(x - 1.5)], h0(x) + 0.15, h0(x - 1.5) + 0.15, za - 0.1, zb + 0.1, capM, false); } }
    const kies = canvasTex(256, 256, (g, w, h) => { const rr = rng(777); g.fillStyle = "#8a8070"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const v = 85 + rr() * 90; g.fillStyle = "rgba(" + (v + 10) + "," + (v + 2) + "," + (v - 8) + "," + (0.35 + rr() * 0.5) + ")"; g.beginPath(); g.arc(rr() * w, rr() * h, 0.6 + rr() * 2.2, 0, 7); g.fill(); }
      for (const x of [70, 186]) { g.fillStyle = "rgba(50,45,40,.18)"; g.fillRect(x - 16, 0, 32, h); } }); kies.repeat.set(1, 1);
    const kr = ribbon(HFR.curve, HFR.len, HFR.w, flatMat({ map: kies, bumpMap: kies, bumpScale: 1.0, side: THREE.DoubleSide }), 7.5, 0, { y: s => HFR.y(s) + 0.1 }); kr.userData.keep = false;
    for (let x = HF_TUN.x1 - 22; x > X + 4; x -= 16) { const l = new THREE.PointLight(0xfff0d8, 0, 18, 1.6); l.position.set(x, HF_Y + 3.6, cz); l.userData.I = 22; scene.add(l); caveLights.push(l); }
  }
  // Geheimgang unten: getarnte Felswand am Nordende (von der Auto Repair aus sieht es wie Fels aus)
  rockGate("Felswand (Geheimgang)", (CGB.x0 + CGB.x1) / 2, CGB.z0 + 2.4, "x", CGB.x1 - CGB.x0 + 0.6, LH - 1.2, LY - 0.2, 0);
}
