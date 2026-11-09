// Wayne Manor 3D – Hoehle oben: Raster, Forschung, Hangars, Vorraum, Himmelsrichtungen
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Hoehle oben (Schritt 7, Karte "Upper Level") =====================
// Gleicher Kartenrahmen wie unten. Ebene UY, Hoehe UH, Raster wie unten (0 = Fels, 1 = Boden), Gitterboden (Streifen auf der Karte).
const UP_FLOOR = [[0, 435], [215, 435], [215, 400], [230, 360], [255, 320], [285, 290], [300, 275], [320, 245], [350, 237], [375, 245], [395, 280], [395, 300],
  [430, 310], [480, 315], [500, 322], [550, 320], [575, 335], [600, 370], [610, 410], [622, 450], [736, 450], [736, 495], [610, 495], [605, 530], [560, 540],
  [480, 540], [400, 535], [320, 530], [260, 525], [200, 520], [185, 500], [190, 482], [0, 482]];
const AIR_EXIT = [[187, 352], [240, 298], [270, 322], [215, 375]];
function caveCellUp(x, z) {
  if (inRect(HGX, x, z) || axtIn(x, z) || inSilo(x, z)) return 1;          // Hangar-Erweiterung West, Gang und Silo (Flugzeug-Ausgang)
  if (inRect(STW, x, z, 1.5)) return 1;
  const [px, py] = toCave(x, z);
  if (px < 0 || px > 736) return 0;
  return inPoly(UP_FLOOR, px, py) || inPoly(AIR_EXIT, px, py) ? 1 : 0;
}
const UCX0 = -150, UCNX = Math.ceil((CX0 + CNX * CELL - UCX0) / CELL), UCNZ = Math.ceil((150 - CZ0) / CELL);   // Raster oben nach Westen bis zum Flugzeug-Silo verlaengert (Nicolas 2026-11-09)
const CMU = new Uint8Array(UCNX * UCNZ);
for (let j = 0; j < UCNZ; j++) for (let i = 0; i < UCNX; i++) CMU[j * UCNX + i] = caveCellUp(UCX0 + (i + 0.5) * CELL, CZ0 + (j + 0.5) * CELL);
const cmuAt = (i, j) => (i < 0 || j < 0 || i >= UCNX || j >= UCNZ) ? 0 : CMU[j * UCNX + i];
function caveUpAt(x, z) { return cmuAt(Math.floor((x - UCX0) / CELL), Math.floor((z - CZ0) / CELL)); }
{
  const inShaft = (x, z) => x > SHAFT_OUT[0] - 0.3 && x < SHAFT_OUT[1] + 0.3 && z > SHAFT_OUT[2] - 0.3 && z < SHAFT_OUT[3] + 0.3;
  const hole = (x, z) => inShaft(x, z) || inRect(STW, x, z);
  const jit = (x, z) => [x + (vnoise(x * 0.45 + 13, z * 0.45) - 0.5) * 0.7, z + (vnoise(x * 0.45, z * 0.45 + 17) - 0.5) * 0.7];
  const ceilY = (x, z) => UY + UH - 2.2 * vnoise(x * 0.12 + 40, z * 0.12) - 1.0 * vnoise(x * 0.4 + 9, z * 0.4) + (axtIn(x, z, 0.6) || inRect(HGX, x, z, 0.6) ? 3 : 0);   // Gang und Hangar-Erweiterung 3 m hoeher (The Bat)
  const rock = [], floor = [];
  const push = (arr, pts, uvf) => { for (const k of [0, 1, 2, 0, 2, 3]) { const [x, y, z] = pts[k]; arr.push(x, y, z, ...uvf(x, y, z)); } };
  const uvWall = (x, y, z) => [(x + z) * 0.25, y * 0.25], uvFlat = (x, y, z) => [x * 0.5, z * 0.5];
  const corner = (i, j) => jit(UCX0 + i * CELL, CZ0 + j * CELL);
  for (let j = 0; j < UCNZ; j++) for (let i = 0; i < UCNX; i++) {
    if (!CMU[j * UCNX + i]) continue;
    const c = [corner(i, j), corner(i + 1, j), corner(i + 1, j + 1), corner(i, j + 1)], cx = UCX0 + (i + 0.5) * CELL, cz = CZ0 + (j + 0.5) * CELL;
    if (!hole(cx, cz)) push(floor, c.map(([x, z]) => [x, UY, z]), uvFlat);
    if (!inShaft(cx, cz) && !inSilo(cx, cz)) push(rock, c.map(([x, z]) => [x, ceilY(x, z), z]), uvWall);   // Silo: offen nach oben
    for (const [di, dj, a, b] of [[-1, 0, 3, 0], [1, 0, 1, 2], [0, -1, 0, 1], [0, 1, 2, 3]]) {
      if (cmuAt(i + di, j + dj)) continue;
      const [ax, az] = c[a], [bx, bz] = c[b];
      push(rock, [[ax, UY, az], [bx, UY, bz], [bx, ceilY(bx, bz), bz], [ax, ceilY(ax, az), az]], uvWall);
    }
  }
  const mk = (arr, m) => {
    const g = new THREE.BufferGeometry(), a = new Float32Array(arr), n = a.length / 5, pos = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    for (let k = 0; k < n; k++) { pos.set(a.subarray(k * 5, k * 5 + 3), k * 3); uv.set(a.subarray(k * 5 + 3, k * 5 + 5), k * 2); }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.userData.keep = true; scene.add(mesh); return mesh;
  };
  const grate = canvasTex(64, 64, (g, w, h) => { g.fillStyle = "#5d6168"; g.fillRect(0, 0, w, h); g.fillStyle = "#3b3e44"; for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 3); });
  grate.repeat.set(1, 1);
  mk(rock, M(0x6f6b64, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1, flatShading: true, side: THREE.DoubleSide }));
  mk(floor, M(0xffffff, { map: grate, roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide }));
  // Kollision: Boden (ohne Treppen- und Schachtloch), Felswaende
  const X = i => UCX0 + i * CELL, Z = j => CZ0 + j * CELL;
  const rowRuns = (test, fn) => { for (let j = 0; j < UCNZ; j++) { let s = -1; for (let i = 0; i <= UCNX; i++) { const ok = i < UCNX && test(i, j); if (ok && s < 0) s = i; if (!ok && s >= 0) { fn(s, i, j); s = -1; } } } };
  rowRuns((i, j) => CMU[j * UCNX + i] === 1 && !hole(X(i) + CELL / 2, Z(j) + CELL / 2), (a, b, j) => S(X(a), X(b), UY - 0.5, UY, Z(j), Z(j + 1)));
  const WM = 0.4;                                                          // wie unten: Kollision nach innen geschoben
  rowRuns((i, j) => CMU[j * UCNX + i] && !cmuAt(i, j - 1), (a, b, j) => S(X(a), X(b), UY, UY + UH + 3, Z(j) - 0.3 + WM, Z(j) + WM));
  rowRuns((i, j) => CMU[j * UCNX + i] && !cmuAt(i, j + 1), (a, b, j) => S(X(a), X(b), UY, UY + UH + 3, Z(j + 1) - WM, Z(j + 1) + 0.3 - WM));
  for (let i = 0; i < UCNX; i++) for (const d of [-1, 1]) {
    let s = -1;
    for (let j = 0; j <= UCNZ; j++) {
      const ok = j < UCNZ && CMU[j * UCNX + i] && !cmuAt(i + d, j);
      if (ok && s < 0) s = j;
      if (!ok && s >= 0) { const xl = d < 0 ? X(i) : X(i + 1); S(d < 0 ? xl - 0.3 + WM : xl - WM, d < 0 ? xl + WM : xl + 0.3 - WM, UY, UY + UH + 3, Z(s), Z(j)); s = -1; }
    }
  }

  // Treppe zwischen den Ebenen: Lauf A (Spur Nord) unten im Osten hinein nach Westen, Podest, Lauf B (Spur Sued) zurueck nach Osten, oben Podest im Osten
  {
    const n = 34, r = (UY - LY) / 2 / n, tr = 0.3, xe = STW.x1 - 1.5, xw = STW.x0 + 1.5, zA = [STW.z0 + 0.1, STW.z0 + 2.05], zB = [STW.z0 + 2.15, STW.z1 - 0.1], ym = LY + (UY - LY) / 2;
    for (let i = 0; i < n; i++) {
      B(xe - (i + 1) * tr, xe - i * tr, LY, LY + (i + 1) * r, zA[0], zA[1], mat.floorStone);
      B(xw + i * tr, xw + (i + 1) * tr, ym, ym + (i + 1) * r, zB[0], zB[1], mat.floorStone);
    }
    B(STW.x0, xw, LY, ym, STW.z0, STW.z1, mat.floorStone);
    B(xe, STW.x1, UY - 0.3, UY, STW.z0, STW.z1, mat.floorStone);
    // Schachtwaende des Treppenhauses zwischen den Ebenen (Fels), unten Eingang Spur A im Osten
    const rk = M(0x6f6b64, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1 });
    B(STW.x0 - 0.4, STW.x1, LY, UY, STW.z0 - 0.4, STW.z0, rk); B(STW.x0 - 0.4, STW.x1, LY, UY, STW.z1, STW.z1 + 0.4, rk); B(STW.x0 - 0.4, STW.x0, LY, UY, STW.z0, STW.z1, rk);
    B(STW.x1, STW.x1 + 0.4, LY + 2.8, UY - 0.3, STW.z0, STW.z1, rk); B(STW.x1, STW.x1 + 0.4, LY, LY + 2.8, zA[1], STW.z1, rk);
    // Gelaender oben am Loch
    B(STW.x0, xe, UY, UY + 1, STW.z0, STW.z0 + 0.08, mat.trim); B(STW.x0, xe, UY, UY + 1, STW.z1 - 0.08, STW.z1, mat.trim);
    B(STW.x0, STW.x0 + 0.08, UY, UY + 1, STW.z0, STW.z1, mat.trim); B(xe - 0.08, xe, UY, UY + 1, STW.z0, zA[1], mat.trim);
    for (const y of [LY + 3, ym + 3, UY + 3]) B(xe - 0.6, xe + 0.6, y, y + 0.1, STW.z0 + 0.05, STW.z0 + 0.1, mat.glow, false, world, false);
  }

  const C = (px, py) => caveMp(px, py);
  // Research and Development + Armory: runder Raum (rot), zwei Durchgaenge, Arbeitsring, drei Geraete, Waffenschraenke
  {
    const [cx, cz] = C(382.5, 422.5), R = 60 * CAVE_SC, segs = 48, red = M(0x7a1f22, { roughness: 0.5, metalness: 0.3 }), wallM = M(0x2c2f36, { roughness: 0.6, metalness: 0.4 });
    for (let k = 0; k < segs; k++) {
      const a0 = k / segs * Math.PI * 2, a1 = (k + 1) / segs * Math.PI * 2, am = (a0 + a1) / 2;
      if (Math.abs(Math.cos(am)) > 0.97) continue;                              // Durchgaenge nach Osten (Tunnel) und Westen (Hangar)
      const p0 = [cx + Math.cos(a0) * R, cz + Math.sin(a0) * R], p1 = [cx + Math.cos(a1) * R, cz + Math.sin(a1) * R];
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), w = new THREE.Mesh(new THREE.BoxGeometry(len + 0.05, 4, 0.3), wallM);
      w.position.set((p0[0] + p1[0]) / 2, UY + 2, (p0[1] + p1[1]) / 2); w.rotation.y = -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); world.add(w);
      const t = new THREE.Mesh(new THREE.BoxGeometry(len + 0.05, 0.3, 0.45), red); t.position.set(w.position.x, UY + 4.1, w.position.z); t.rotation.y = w.rotation.y; world.add(t);
      circles.push([cx + Math.cos(am) * R, cz + Math.sin(am) * R, 0.35, UY + 4]);
      if (k % 4 === 1) { const rk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.5), mat.dark); rk.position.set(cx + Math.cos(am) * (R - 0.5), UY + 1.2, cz + Math.sin(am) * (R - 0.5)); rk.rotation.y = w.rotation.y; world.add(rk);
        const gl = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.05), mat.glowRed); gl.position.set(cx + Math.cos(am) * (R - 0.76), UY + 2.2, cz + Math.sin(am) * (R - 0.76)); gl.rotation.y = w.rotation.y; world.add(gl); }
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(25 * CAVE_SC, 0.35, 8, 40).rotateX(Math.PI / 2), mat.steel); ring.position.set(cx, UY + 0.9, cz); world.add(ring);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, s = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.06), mat.glow); s.position.set(cx + Math.cos(a) * 25 * CAVE_SC, UY + 1.5, cz + Math.sin(a) * 25 * CAVE_SC); s.rotation.y = -a + Math.PI / 2; world.add(s); }
    for (const [px, py] of [[355, 424], [407.5, 410], [410, 424]]) { const [x, z] = C(px, py); cyl(0.5, 0.6, 1.4, mat.steel, x, UY + 0.7, z, world, 12); circles.push([x, z, 0.6, UY + 1.4]); }
  }
  // Flugzeug-Hangars (gruen) mit Batwing und Jets
  const tint = (pxs, color) => { const sh = new THREE.Shape(); pxs.forEach(([px, py], k) => { const [x, z] = C(px, py); if (k) sh.lineTo(x, -z); else sh.moveTo(x, -z); }); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2), flatMat({ color, transparent: true, opacity: 0.3 })); m.position.y = UY + 0.02; m.userData.keep = true; world.add(m); };
  tint([[300, 275], [285, 290], [255, 320], [230, 360], [215, 400], [215, 437], [262, 440], [300, 425], [326, 390], [335, 345], [320, 300]], 0x5fae4a);
  tint([[550, 320], [575, 335], [600, 370], [610, 410], [622, 452], [590, 452], [565, 420], [548, 372]], 0x5fae4a);
  const batShape = () => { const p = [[0, 3.2], [0.7, 1.4], [3.9, 1.0], [3.3, 0.1], [2.5, 0.35], [1.8, -0.5], [1.0, -0.2], [0.4, -1.4], [0, -0.9]]; const sh = new THREE.Shape(); [...p, ...p.slice(0, -1).reverse().map(([x, y]) => [-x, y])].forEach(([x, y], k) => k ? sh.lineTo(x, y) : sh.moveTo(x, y)); return sh; };
  const plane = (px, py, rot, scale, kind) => {
    const [x, z] = C(px, py), g = new THREE.Group(); g.position.set(x, UY, z); g.rotation.y = rot; g.scale.setScalar(scale); world.add(g);
    if (kind === "bat") { const w = new THREE.Mesh(new THREE.ExtrudeGeometry(batShape(), { depth: 0.25, bevelEnabled: false }).rotateX(-Math.PI / 2), mat.bat); w.position.y = 1.2; g.add(w); cyl(0.12, 0.12, 1.2, mat.dark, 0, 0.6, 0, g, 6); }
    else { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 5, 10).rotateX(Math.PI / 2), mat.bat); f.position.y = 1.2; g.add(f);
      const sh = new THREE.Shape(); sh.moveTo(0, 1.5); sh.lineTo(2.6, -1.2); sh.lineTo(-2.6, -1.2); sh.closePath(); const wg = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }).rotateX(-Math.PI / 2), mat.bat); wg.position.y = 1.1; g.add(wg);
      B(-0.06, 0.06, 1.2, 2.4, -2.4, -1.4, mat.bat, false, g); for (const sx of [-1, 1]) cyl(0.08, 0.08, 1.0, mat.dark, sx * 0.9, 0.5, 0, g, 6); }
    circles.push([x, z, 1.8 * scale, UY + 2]);
  };
  plane(283, 360, 0.5, 1, "jet"); plane(305, 400, 0.3, 0.85, "jet"); plane(568, 372, -0.6, 0.9, "jet");   // Platzhalter-Batwings weg: im Hangar West steht The Bat (fahrzeuge/the-bat.js, Nicolas 2026-11-09)
  // E1 (Nicolas, 2026-11-07, Loesung c): Vorraum aus Fels um Treppen- und Aufzugsausgang, Hangartor (Stahl) nach Osten.
  // Vorher stand der Hangar im Treppenhaus und ein Jet direkt im Ausgang.
  {
    const VX0 = -61, VX1 = -44, VZ0 = 13.5, VZ1 = 25.5, GZ0 = 14.8, GZ1 = 20.8, GH = 5.2, T = 0.8, top = UY + UH + 0.5;
    const rk = M(0x6f6b64, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1 });
    B(VX0, VX1 + T / 2, UY, top, VZ0 - T, VZ0, rk);                          // Nordwand
    B(VX0, VX1 + T / 2, UY, top, VZ1, VZ1 + T, rk);                          // Suedwand
    B(VX1 - T / 2, VX1 + T / 2, UY, top, VZ0, GZ0, rk); B(VX1 - T / 2, VX1 + T / 2, UY, top, GZ1, VZ1, rk);   // Ostwand neben dem Tor
    B(VX1 - T / 2, VX1 + T / 2, UY + GH, top, GZ0, GZ1, rk);                 // Sturz ueber dem Tor
    for (const s of [-1, 1]) { const x = VX1 + s * (T / 2 + 0.03); B(x - 0.03, x + 0.03, UY + GH + 0.3, UY + GH + 0.45, GZ0, GZ1, mat.glowOrange, false, world, false); }
    const l = new THREE.PointLight(0xdfe8ff, 0, 20, 1.6); l.position.set(-55, UY + 4.5, 21.5); l.userData.I = 24; scene.add(l); caveLights.push(l);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat.glow); f.position.copy(l.position); world.add(f);
    // Tor: faehrt nach oben in den Sturz (Rechtsklick wie die Felstore), geschlossen sperrt es
    const g = new THREE.Group(); g.position.set(VX1, UY, (GZ0 + GZ1) / 2); g.rotation.y = Math.PI / 2; g.userData.dynamic = true; world.add(g);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(GZ1 - GZ0, GH, 0.3), mat.steel); leaf.position.y = GH / 2; leaf.castShadow = leaf.receiveShadow = true; g.add(leaf);
    for (let k = 1; k < 5; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(GZ1 - GZ0 - 0.4, 0.1, 0.36), mat.glowOrange); s.position.y = k * GH / 5; g.add(s); }
    const solid = S(VX1 - 0.3, VX1 + 0.3, UY, UY + GH, GZ0, GZ1);
    gates.push({ name: "Hangartor", g, open: 0, target: 0, lift: GH - 0.1, y0: UY, solid, a: [VX1, GZ0], b: [VX1, GZ1] });
  }
  // Flugzeug-Ausgang (Nicolas 2026-11-09; das alte Stahltor am Aircraft Exit ist weg, dort ist jetzt die Hangar-Erweiterung):
  // getarnte Felstuer am Anfang des Gangs (faehrt in die Decke), Lampen im Gang, Silo mit Betonwaenden bis an die Oberflaeche, Landeplatz,
  // oben zwei getarnte Rasenklappen (gleiten nach Westen/Osten unter den Rasen), Rasenkragen ueber dem Gelaendeausschnitt
  {
    const [ax, az] = AXT.a, [bx, bz] = AXT.b, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    let t1 = 0; while (t1 < L && inRect(HGX, ax + ux * t1, az + uz * t1)) t1 += 0.25; t1 += 1.2;   // Tuer kurz nach dem Hangarrand
    const dx = ax + ux * t1, dz = az + uz * t1, W = AXT.hw * 2 + 1.0, H = 11.6;
    const rockM = M(0x6f6b64, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1, flatShading: true });
    const door = new THREE.Group(); door.position.set(dx, UY, dz); door.rotation.y = Math.atan2(ux, uz) + Math.PI / 2; door.userData.dynamic = true; world.add(door);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(W, H, 1.0), rockM); slab.position.y = H / 2; slab.castShadow = slab.receiveShadow = true; door.add(slab);
    const gr = rng(4711); for (let k = 0; k < 26; k++) { const sz = 0.5 + gr() * 1.3, m = new THREE.Mesh(new THREE.IcosahedronGeometry(sz, 0), rockM); m.position.set((gr() - 0.5) * (W - 0.8), 0.4 + gr() * (H - 0.8), (k % 2 ? 1 : -1) * (0.35 + gr() * 0.25)); m.rotation.set(gr() * 6, gr() * 6, gr() * 6); m.scale.set(1, 1, 0.5); door.add(m); }
    const boxes = []; for (let q = -W / 2; q <= W / 2 + 1e-6; q += 0.45) { const x = dx - uz * q, z = dz + ux * q; boxes.push(S(x - 0.3, x + 0.3, UY, UY + H, z - 0.3, z + 0.3)); }
    const solid = { set on(v) { for (const b of boxes) b.on = v; }, get on() { return boxes[0].on; }, set y0(v) { for (const b of boxes) b.y0 = v; }, get y0() { return boxes[0].y0; } };
    gates.push({ name: "Felstür (Flugzeug-Ausgang)", g: door, open: 0, target: 0, lift: H + 0.3, y0: UY, solid, a: [dx + uz * W / 2, dz - ux * W / 2], b: [dx - uz * W / 2, dz + ux * W / 2] });
    for (let t = t1 + 12; t < L - SILO.h - 2; t += 24) { const l = new THREE.PointLight(0xdfe8ff, 0, 22, 1.6); l.position.set(ax + ux * t, UY + 4.2, az + uz * t); l.userData.I = 22; scene.add(l); caveLights.push(l);
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat.glow); f.position.copy(l.position); world.add(f); }
    // Silo
    const cx = SILO.x, cz = SILO.z, R = SILO.h, concrete = M(0x8d8f92, { roughness: 0.9 }), T = 0.6;
    let rim = -1e9; for (let k = 0; k <= 8; k++) { const q = -R + k * R / 4; for (const [x, z] of [[cx - R, cz + q], [cx + R, cz + q], [cx + q, cz - R], [cx + q, cz + R]]) rim = Math.max(rim, terrainH(x, z)); }
    rim += 0.1; SILO.rim = rim;
    const y0 = UY + UH - 4;
    const wt = rim - 0.38;                                                    // Wandkrone unter dem Rasenkragen (getarnt)
    // Betonwaende; wo der Gang ankommt, offen bis zur Gangdecke (Sturz darueber)
    const yG = UY + UH - 0.3, side = (alongX, fixed, lo, hi) => { let q = lo; while (q < hi - 1e-6) { const gang = alongX ? axtIn(q + 0.25, fixed, 0.5) : axtIn(fixed, q + 0.25, 0.5); let e = q; while (e < hi - 1e-6 && (alongX ? axtIn(e + 0.25, fixed, 0.5) : axtIn(fixed, e + 0.25, 0.5)) === gang) e += 0.5; e = Math.min(e, hi);
        const yb = gang ? yG : y0; alongX ? B(q, e, yb, wt, fixed < cz ? fixed - T : fixed, fixed < cz ? fixed : fixed + T, concrete) : B(fixed < cx ? fixed - T : fixed, fixed < cx ? fixed : fixed + T, yb, wt, q, e, concrete); q = e; } };
    side(false, cx - R, cz - R - T, cz + R + T); side(false, cx + R, cz - R - T, cz + R + T); side(true, cz - R, cx - R, cx + R); side(true, cz + R, cx - R, cx + R);
    for (let y = y0 + 1.5; y < rim - 1; y += 3) for (const sd of [-1, 1]) B(cx - R + 0.05, cx + R - 0.05, y, y + 0.08, cz + sd * R - 0.03, cz + sd * R + 0.03, mat.glowOrange, false, world, false);   // Leuchtstreifen
    B(cx - 8, cx + 8, UY, UY + 0.04, cz - 8, cz + 8, M(0x3a3d42, { roughness: 0.8 }), false);                                    // Landeplatz
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.15, 6, 48).rotateX(Math.PI / 2), M(0xf2c230, { roughness: 0.6 })); ring.position.set(cx, UY + 0.06, cz); world.add(ring);
    { const l = new THREE.PointLight(0xdfe8ff, 0, 30, 1.4); l.position.set(cx, UY + 7, cz); l.userData.I = 30; scene.add(l); caveLights.push(l); }
    // Rasenklappen: zwei Haelften, buendig mit dem Rand; oeffnen = erst 0,6 m absenken, dann nach Westen/Osten unter den Rasen gleiten
    const gc = new THREE.Color(0x5b8c3c).lerp(new THREE.Color(0x739c47), vnoise(cx / 40, cz / 40)).lerp(new THREE.Color(0x3b6430), forestD(cx, cz) * 0.8), grassM = M(gc.getHex(), { map: grassTex, roughness: 1 }), hatch = new THREE.Group(); hatch.userData.dynamic = true; world.add(hatch); const halves = [];
    for (const sd of [-1, 1]) { const h = new THREE.Group(), p = new THREE.Mesh(new THREE.BoxGeometry(R, 0.35, 2 * R), [concrete, concrete, grassM, concrete, concrete, concrete]); p.position.set(sd * R / 2, -0.175, 0); p.castShadow = p.receiveShadow = true; h.add(p); h.position.set(cx, rim, cz); hatch.add(h); halves.push({ h, sd }); }
    const hs = S(cx - R, cx + R, rim - 0.35, rim, cz - R, cz + R);
    gates.push({ name: "Rasenklappe (Silo)", g: hatch, open: 0, target: 0, dur: 6, solid: hs, a: [cx - R, cz], b: [cx + R, cz],
      anim: f => { const sink = Math.min(1, f / 0.15) * 0.6, slide = Math.max(0, (f - 0.15) / 0.85) * (R + 0.3); for (const { h, sd } of halves) h.position.set(cx + sd * slide, rim - sink, cz); } });
    // Rasenkragen um den Schacht (der Gelaendeausschnitt ist etwas groesser als der Schacht): feines Netz wie das Gelaende, am Rand auf Randhoehe
    { const E = R + 3.6, st = 0.5, n = Math.round(2 * E / st), pos = [], col = [], uv = [], idx = [], c = new THREE.Color(), cA = new THREE.Color(0x5b8c3c), cB = new THREE.Color(0x739c47), cL = new THREE.Color(0x6aa84a), cF = new THREE.Color(0x3b6430);
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const x = cx - E + i * st, z = cz - E + j * st, d = Math.max(Math.abs(x - cx), Math.abs(z - cz));
        pos.push(x, Math.max(terrainH(x, z) + 0.04, rim - 0.01 - Math.max(0, d - R - T) * 0.5), z); uv.push(x / 10, -z / 10);
        c.copy(cA).lerp(cB, vnoise(x / 40, z / 40)).lerp(cL, 0.7 * Math.max(sst(40, 0, siteDist(x, z)), inLawn(x, z) ? 1 : 0)).lerp(cF, forestD(x, z) * 0.8); col.push(c.r, c.g, c.b); }
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const xm = cx - E + (i + 0.5) * st, zm = cz - E + (j + 0.5) * st; if (Math.abs(xm - cx) < R - 0.01 && Math.abs(zm - cz) < R - 0.01) continue; const a = j * (n + 1) + i, b = a + 1, d = a + n + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, M(0xffffff, { map: grassTex, vertexColors: true, roughness: 1 })); m.receiveShadow = true; world.add(m); }
  }
  // Training Area: niedrige Waende mit abgeschraegten Ecken, Matten, Ziele.
  // Vorlaeufig ausgeblendet (Nicolas, 2026-11-06): wird spaeter neu gestaltet, dann SHOW_TRAINING auf true.
  const SHOW_TRAINING = false;
  if (SHOW_TRAINING) {
    const pts = [[455, 450], [547, 450], [555, 460], [555, 495], [547, 505], [455, 505], [447, 495], [447, 460]].map(([px, py]) => C(px, py));
    for (let k = 0; k < pts.length; k++) {
      if (k === 3) continue;                                                    // Eingang auf der Ostseite
      const p0 = pts[k], p1 = pts[(k + 1) % pts.length], len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), w = new THREE.Mesh(new THREE.BoxGeometry(len, 1.2, 0.2), M(0x8a8d93));
      w.position.set((p0[0] + p1[0]) / 2, UY + 0.6, (p0[1] + p1[1]) / 2); w.rotation.y = -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); world.add(w);
      for (let t = 0.1; t < 1; t += 0.2) circles.push([lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t), 0.25, UY + 1.2]);
    }
    const [mx, mz] = C(500, 478); B(mx - 3, mx + 3, UY, UY + 0.08, mz - 5, mz + 5, M(0x2f5f8f), false);
    for (const px of [458, 466, 474]) { const [x, z] = C(px, 485); cyl(0.25, 0.3, 1.8, M(0xb08a5a), x, UY + 0.9, z, world, 10); circles.push([x, z, 0.3, UY + 1.8]); }
  }
  // Licht oben
  for (const [px, py] of [[382, 422], [270, 370], [580, 400]]) {
    const [x, z] = C(px, py), l = new THREE.PointLight(0xdfe8ff, 0, 30, 1.6); l.position.set(x, UY + 6, z); l.userData.I = 45; scene.add(l); caveLights.push(l);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat.glow); f.position.copy(l.position); world.add(f);
  }
}

// Himmelsrichtungen als Pfosten mit Schild (N = -z, O = +x, S = +z, W = -x), Nullpunkt rot
function label(text, x, z, color) {
  const tex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = color; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = "800 72px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 64, 70); });
  tex.repeat.set(1, 1);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, fog: false, depthWrite: false }));
  const gy = terrainH(x, z);
  sp.scale.set(14, 14, 1); sp.position.set(x, gy + 16, z);
  scene.add(sp);
  cyl(0.4, 0.4, 14, M(color), x, gy + 7, z, scene, 8);
}
label("N", 0, -260, "#2b6cb0"); label("O", 260, 0, "#c05621"); label("S", 0, 260, "#2f855a"); label("W", -260, 0, "#6b46c1");
