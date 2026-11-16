// Batverse – Gotham: Bus (V2, Nicolas 2026-11-16 "Ja, V2"; PLAN-GOTHAM V2, Daten GOTHAM.bus in gotham/daten.js)
// Klassisches Skript nach gotham-ubahn.js. Je Linie eine Route aus den genannten Hauptstrassen (Insel: GSTR.roads, Festland: GLAND.roads; Stuecke werden
// nach dem naechsten Ende verkettet, Luecken wie Bruecken gerade ueberbrueckt), Haltestellen alle GOTHAM.bus.abstand m beidseits (Wartehaeuschen und Mast
// in Linienfarbe auf dem Gehsteig), je Linie ein fahrender Bus (Modell "Gotham Transit" aus modelle.js) hin und zurueck mit Halt an jeder Haltestelle
// seiner Seite, Busbahnhof (Ort "busbahnhof") mit Dach, Steigen und zwei abgestellten Bussen. Nur Optik (Busse ohne Kollision).
"use strict";
const GBUS = { lines: [], buses: [], done: false, VMAX: 12, ACC: 1.2, DWELL: 10, last: performance.now() };
function* gbusGen() {
  while (!GSTR.done || !GGEB.done || !GBST.done) yield "wait";
  if (!GLAND.roads && typeof glandBuild === "function") glandBuild();
  const B = GOTHAM.bus, out = new Map(), Y = GOT.STR;
  const pieces = id => [...GSTR.roads.filter(r => r.id === id).map(r => ({ id, P: r.pts, w: r.w, walk: r.walk })), ...((GLAND.roads || []).filter(r => r.id === id).map(r => ({ id, P: r.pts.map(q => [q[0], q[1]]), w: r.w || 10, walk: 2 })))].filter(q => q.P.length > 1);
  for (const L of B.linien) {
    const col = new THREE.Color(L.farbe), pool = L.strassen.flatMap(pieces); if (!pool.length) continue;
    // verketten: laengstes Stueck der ersten Strasse, dann immer das naechste Ende
    const len = q => q.P.reduce((a, p, i) => i ? a + Math.hypot(p[0] - q.P[i - 1][0], p[1] - q.P[i - 1][1]) : 0, 0);
    let cur = (pool.some(q => q.id === L.strassen[0]) ? pool.filter(q => q.id === L.strassen[0]) : pool).sort((a, b) => len(b) - len(a))[0]; pool.splice(pool.indexOf(cur), 1);
    const route = cur.P.map(p => [p[0], p[1], cur.w, cur.walk]);
    while (pool.length) { const e = route[route.length - 1]; let best = null, bd = 1e9, rev = false;
      for (const q of pool) for (const [p, r] of [[q.P[0], false], [q.P[q.P.length - 1], true]]) { const d = Math.hypot(p[0] - e[0], p[1] - e[1]); if (d < bd) { bd = d; best = q; rev = r; } }
      if (bd > 900) break; if (bd > 40) console.warn("Bus " + L.name + ": Luecke " + Math.round(bd) + " m vor " + best.id + " (Strasse fehlt in der Linie?)"); pool.splice(pool.indexOf(best), 1); const P = rev ? [...best.P].reverse() : best.P; for (const p of P) route.push([p[0], p[1], best.w, best.walk]); }
    // gleichmaessig alle 4 m
    const R = []; for (let i = 0; i < route.length - 1; i++) { const a = route[i], b = route[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.01) continue; for (let s = 0; s < l; s += 4) R.push([a[0] + (b[0] - a[0]) * s / l, a[1] + (b[1] - a[1]) * s / l, a[2], a[3]]); }
    R.push(route[route.length - 1]);
    if (R.length < 40) continue;                                            // zu kurz (Strassen nicht gefunden)
    const line = { name: L.name, col, R, len: (R.length - 1) * 4, stops: [] }; GBUS.lines.push(line);
    // Haltestellen alle B.abstand m, beidseits auf dem Gehsteig (rechts der jeweiligen Fahrtrichtung)
    for (let s = B.abstand / 2; s < line.len - 50; s += B.abstand) for (const dir of [1, -1]) {
      const i = Math.round(s / 4), a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / l * dir, uz = (b[1] - a[1]) / l * dir, rx = -uz, rz = ux, w = R[i][2], wk = R[i][3];
      let spot = null; for (const ds of [0, 8, -8, 16, -16, 24]) { const x = R[i][0] + (b[0] - a[0]) / l * ds, z = R[i][1] + (b[1] - a[1]) / l * ds, o = GOT.edgeSD(R[i][0], R[i][1]) > 4 ? w / 2 + 3 : w / 2 + wk * 0.6, px = x + rx * o, pz = z + rz * o;   // rechts der Fahrtrichtung (wie die Spur des Busses)
        const land = GOT.edgeSD(px, pz) > 4;   // Festland: kein Gehsteig, Haltestelle aufs Bankett neben der Fahrbahn
        if ((land ? !GSTR.onRoad(px, pz, 0.3) : GSTR.walkAt(px, pz)) && !bautAt(px, Y + 1, pz)) { spot = [px, pz, s + ds * dir, land]; break; } }
      if (!spot) continue; line.stops.push({ x: spot[0], z: spot[1], s: spot[2], dir });
      // Wartehaeuschen (Rueckwand zur Hausseite, Dach), Mast mit Schild in Linienfarbe
      const f = gbvFrame({ P0: [spot[0], spot[1]], e1: [ux, uz], e2: [rx, rz], L1: 1, L2: 1 }), y = spot[3] ? terrainH(spot[0], spot[1]) : Y + GSTR.RAISE;   // t > 0 = von der Strasse weg
      gbvBox(out, "glas", f, 0, 0.9, 3.6, 0.08, y, y + 2.4); for (const sx of [-1.8, 1.8]) gbvBox(out, "glas", f, sx, 0.45, 0.08, 0.9, y, y + 2.4);
      gbvBox(out, "rahmen", f, 0, 0.45, 3.9, 1.3, y + 2.4, y + 2.55, null, true, true); gbvBox(out, "holz", f, 0, 0.7, 2.6, 0.4, y + 0.45, y + 0.5);
      gbvBox(out, "rahmen", f, 2.6, -0.2, 0.1, 0.1, y, y + 3.0); gbvBox(out, "farbe", f, 2.6, -0.2, 0.7, 0.06, y + 2.5, y + 3.2, [col.r, col.g, col.b]);
    }
    yield;
  }
  // Busbahnhof (Ort "busbahnhof"): Dach auf Stuetzen, 4 Steige mit Bordstein, Wartehalle
  { const o = GOTHAM.orte.find(q => q.id === "busbahnhof"); if (o) { const [cx, cz] = GOT.toGame(o.x, o.z), [ax, az] = GOT.toGame(o.x + 1, o.z), ux = ax - cx, uz = az - cz, f = gbvFrame({ P0: [cx, cz], e1: [ux, uz], e2: [-uz, ux], L1: 1, L2: 1 }), W = o.w, D = o.d, y = Y;
    gbvBox(out, "beton", f, 0, 0, W, D, y, y + 0.06);
    for (let k = 0; k < 4; k++) { const t = -D / 2 + 8 + k * 11; gbvBox(out, "beton", f, 0, t, W - 16, 2, y, y + 0.18); }   // Steige
    for (let s = -W / 2 + 6; s <= W / 2 - 6; s += 13) for (const t of [-D / 2 + 3, D / 2 - 3]) gbvBox(out, "rahmen", f, s, t, 0.4, 0.4, y, y + 7);
    gbvBox(out, "rahmen", f, 0, 0, W - 4, D - 2, y + 7, y + 7.4, null, true, true); gbvBox(out, "glas", f, 0, 0, W - 10, D - 10, y + 7.4, y + 7.7);
    gbvBox(out, "brand", f, -W / 2 + 7, 0, 10, D - 14, y, y + 4.5);   // Wartehalle
    GBUS.station = { cx, cz, ux, uz, W, D }; } }
  // Netze
  const mats = gbvInit(), glas = new THREE.MeshStandardMaterial({ color: 0xa9c4d4, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.45, side: THREE.DoubleSide }), rahmen = new THREE.MeshStandardMaterial({ color: 0x2f3338, roughness: 0.6, metalness: 0.5 });
  const M = { ...mats, glas, rahmen };
  for (const [key, o] of out) { if (!o.p.length) continue; const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2));
    if (o.c.length) g.setAttribute("color", new THREE.Float32BufferAttribute(o.c, 3));
    gsplit(g, M[key], "Gotham-Bus " + key, { cast: key !== "glas" }); yield; }
  // Busse: je Linie einer (fahrend), zwei im Busbahnhof
  for (const line of GBUS.lines) { const b = buildBus(); b.g.name = "Bus " + line.name; b.g.userData.keep = true; b.g.userData.noLift = true; scene.add(b.g);
    GBUS.buses.push({ line, g: b.g, s: 30, d: 1, v: 0, wait: 0, y: Y }); yield; }
  if (GBUS.station) { const S = GBUS.station; for (const k of [0, 2]) { const b = buildBus(), t = -S.D / 2 + 8 + k * 11 + 3; b.g.position.set(S.cx + S.ux * 4 - S.uz * t, Y, S.cz + S.uz * 4 + S.ux * t); b.g.rotation.y = Math.atan2(-S.ux, -S.uz) + Math.PI / 2; b.g.userData.keep = true; b.g.userData.noLift = true; b.g.name = "Bus abgestellt"; scene.add(b.g); } }
  GBUS.last = performance.now();
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (GBUS.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = gbusGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { GBUS.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
// je Bild (schleife.js): Busse fahren hin und zurueck, halten an den Haltestellen ihrer Seite; Lage nur, wenn naeher als 700 m an der Kamera
function gbusStep() {
  if (!GBUS.buses.length) return; const now = performance.now(), dt = Math.min(0.1, (now - GBUS.last) / 1000); GBUS.last = now; const cam = camera.position;
  for (const b of GBUS.buses) { const L = b.line;
    if (b.wait > 0) b.wait -= dt;
    else { // naechster Halt in Fahrtrichtung (oder Routenende)
      let target = b.d > 0 ? L.len - 8 : 8, tst = null; for (const st of L.stops) if (st !== b.prev && st.dir === b.d && (b.d > 0 ? st.s > b.s - 0.5 && st.s < target : st.s < b.s + 0.5 && st.s > target)) { target = st.s; tst = st; }   // naechster Halt (nicht der gerade bediente)
      const dist = Math.abs(target - b.s); b.v = Math.min(GBUS.VMAX, b.v + GBUS.ACC * dt, Math.sqrt(2 * GBUS.ACC * dist)); const step = Math.min(dist, b.v * dt); b.s += b.d * step;
      if (dist - step < 0.05) { b.v = 0; b.wait = GBUS.DWELL; b.prev = tst; if (!tst) b.d = -b.d; } }
    const i = Math.max(0, Math.min(L.R.length - 2, Math.floor(b.s / 4))), f = b.s / 4 - i, p = L.R[i], q = L.R[i + 1], x0 = p[0] + (q[0] - p[0]) * f, z0 = p[1] + (q[1] - p[1]) * f;
    if (Math.abs(x0 - cam.x) > 700 || Math.abs(z0 - cam.z) > 700) { b.g.visible = false; continue; } b.g.visible = true;
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, ux = (q[0] - p[0]) / l * b.d, uz = (q[1] - p[1]) / l * b.d, off = Math.min(p[2] / 4, 3.5), x = x0 - uz * off, z = z0 + ux * off;   // rechte Spur
    const g = groundAt(x, z, b.y + 2); b.y = g === null || !isFinite(g) ? b.y : g; b.g.position.set(x, b.y, z); b.g.rotation.set(0, Math.atan2(-ux, -uz), 0); }
}
