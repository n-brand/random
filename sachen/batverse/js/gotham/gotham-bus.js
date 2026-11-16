// Batverse – Gotham: Bus (V2, Nicolas 2026-11-16 "Ja, V2"; PLAN-GOTHAM V2, Daten GOTHAM.bus in gotham/daten.js)
// Klassisches Skript nach gotham-ubahn.js. Je Linie eine Route aus den genannten Hauptstrassen (Insel: GSTR.roads, Festland: GLAND.roads; Stuecke werden
// nach dem naechsten Ende verkettet, Luecken wie Bruecken gerade ueberbrueckt), Haltestellen alle GOTHAM.bus.abstand m beidseits (Wartehaeuschen und Mast
// in Linienfarbe auf dem Gehsteig), je Linie ein fahrender Bus (Modell "Gotham Transit" aus modelle.js) hin und zurueck mit Halt an jeder Haltestelle
// seiner Seite, Busbahnhof (Ort "busbahnhof") mit Dach, Steigen und zwei abgestellten Bussen. Nur Optik (Busse ohne Kollision).
"use strict";
const GBUS = { lines: [], buses: [], done: false, VMAX: 12, ACC: 1.2, DWELL: 10, last: performance.now() };
function busChain(L, pool) {
  const len = q => q.P.reduce((a, p, i) => i ? a + Math.hypot(p[0] - q.P[i - 1][0], p[1] - q.P[i - 1][1]) : 0, 0);
  let cur = (pool.some(q => q.id === L.strassen[0]) ? pool.filter(q => q.id === L.strassen[0]) : pool).sort((a, b) => len(b) - len(a))[0]; pool.splice(pool.indexOf(cur), 1);
  const route = cur.P.map(p => [p[0], p[1], cur.w, cur.walk]);
  while (pool.length) { const e = route[route.length - 1]; let best = null, bd = 1e9, rev = false;
    for (const q of pool) for (const [p, r] of [[q.P[0], false], [q.P[q.P.length - 1], true]]) { const d = Math.hypot(p[0] - e[0], p[1] - e[1]); if (d < bd) { bd = d; best = q; rev = r; } }
    if (bd > 900) break; if (bd > 40) console.warn("Bus " + L.name + ": Luecke " + Math.round(bd) + " m vor " + best.id + " (Strasse fehlt in der Linie?)"); pool.splice(pool.indexOf(best), 1); const P = rev ? [...best.P].reverse() : best.P; for (const p of P) route.push([p[0], p[1], best.w, best.walk]); }
  return route;
}
// Wegsuche: Netz aus allen Strassen (Insel GSTR, Festland GLAND); Strassen der Linie kosten 1, andere 2,5 je Meter (Verbindungsstuecke, die in der
// Linie fehlen, werden so trotzdem auf der Strasse gefahren); die Bruecken (GOT.cuts, Insel bis Festland) als eigene Stuecke, 1,2 je Meter. Kanten entlang jeder Strasse, Kreuzungen unter 12 m, Strassenenden (an Bruecken gekuerzt)
// zusaetzlich zum naechsten Punkt einer anderen Strasse bis 45 m. Kuerzester Weg vom Anfang der ersten Linienstrasse bis zum Eintritt in die letzte,
// dann die letzte ganz bis zu ihrem anderen Ende. Dijkstra mit Heap.
function busPath(L, pool) {
  const first = L.strassen[0], last = L.strassen[L.strassen.length - 1], inLine = new Set(L.strassen);
  const all = [...pool, ...GSTR.roads.filter(r => !inLine.has(r.id)).map(r => ({ id: r.id, P: r.pts, w: r.w, walk: r.walk, extra: true })), ...(GLAND.roads || []).filter(r => !inLine.has(r.id)).map(r => ({ id: r.id, P: r.pts.map(q => [q[0], q[1]]), w: r.w || 10, walk: 2, extra: true })),
    ...(GOT.cuts || []).map((c, k) => { const P = [], L = c.s0 + 25; for (let t = 0; t <= L; t += 4) P.push([c.a[0] + c.ux * t, c.a[1] + c.uz * t]); return { id: "bruecke-" + k, P, w: 14, walk: 2, extra: true, cost: 1.2 }; })].filter(q => q.P.length > 1);
  const X = [], Z = [], W = [], K = [], pieceOf = [], E = [];
  for (const [pi, q] of all.entries()) { const b = X.length, cost = q.cost || (q.extra ? 2.5 : 1); q.n0 = b;
    q.P.forEach((p, k) => { X.push(p[0]); Z.push(p[1]); W.push(q.w); K.push(q.walk); pieceOf.push(pi); E.push([]); if (k) { const l = Math.hypot(p[0] - q.P[k - 1][0], p[1] - q.P[k - 1][1]) * cost; E[b + k].push(b + k - 1, l); E[b + k - 1].push(b + k, l); } }); q.n1 = X.length - 1; }
  const n = X.length, C = 24, grid = new Map(), key = (a, b) => a * 100003 + b; for (let i = 0; i < n; i++) { const k = key(Math.floor(X[i] / C), Math.floor(Z[i] / C)); let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(i); }
  const near = (i, R, fn) => { const cx = Math.floor(X[i] / C), cz = Math.floor(Z[i] / C), m = Math.ceil(R / C); for (let a = -m; a <= m; a++) for (let b = -m; b <= m; b++) { const c = grid.get(key(cx + a, cz + b)); if (c) for (const j of c) if (pieceOf[j] !== pieceOf[i]) { const d = Math.hypot(X[j] - X[i], Z[j] - Z[i]); if (d < R) fn(j, d); } } };
  for (let i = 0; i < n; i++) near(i, 12, (j, d) => { if (j > i) { E[i].push(j, d); E[j].push(i, d); } });
  for (const q of all) for (const e of [q.n0, q.n1]) { let bj = -1, bd = 45; near(e, 45, (j, d) => { if (d < bd) { bd = d; bj = j; } }); if (bj >= 0) { E[e].push(bj, bd); E[bj].push(e, bd); } }
  const starts = pool.filter(q => q.id === first), ends = pool.filter(q => q.id === last); if (!starts.length || !ends.length) return null;
  const src = starts.sort((a, b) => b.P.length - a.P.length)[0].n0;
  const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1); dist[src] = 0;
  const H = [[0, src]], push = (d, v) => { H.push([d, v]); let i = H.length - 1; while (i) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const t = H[0], e = H.pop(); if (H.length) { H[0] = e; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return t; };
  while (H.length) { const [du, u] = pop(); if (du > dist[u]) continue; const e = E[u]; for (let k = 0; k < e.length; k += 2) { const v = e[k], nd = du + e[k + 1]; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; push(nd, v); } } }
  let best = null; for (const q of ends) for (const [entry, other] of [[q.n0, q.n1], [q.n1, q.n0]]) if (isFinite(dist[entry]) && (!best || dist[entry] < best.d)) best = { d: dist[entry], entry, other };
  if (!best) return null;
  const idx = []; for (let v = best.entry; v >= 0; v = prev[v]) idx.push(v); idx.reverse();
  const step = best.other > best.entry ? 1 : -1; for (let v = best.entry + step; step > 0 ? v <= best.other : v >= best.other; v += step) idx.push(v);
  return idx.map(i => [X[i], Z[i], W[i], K[i]]);
}
function* gbusGen() {
  while (!GSTR.done || !GGEB.done || !GBST.done) yield "wait";
  if (!GLAND.roads && typeof glandBuild === "function") glandBuild();
  const B = GOTHAM.bus, out = new Map(), Y = GOT.STR;
  const pieces = id => [...GSTR.roads.filter(r => r.id === id).map(r => ({ id, P: r.pts, w: r.w, walk: r.walk })), ...((GLAND.roads || []).filter(r => r.id === id).map(r => ({ id, P: r.pts.map(q => [q[0], q[1]]), w: r.w || 10, walk: 2 })))].filter(q => q.P.length > 1);
  for (const L of B.linien) {
    const col = new THREE.Color(L.farbe), pool = L.strassen.flatMap(pieces); if (!pool.length) continue;
    // Wegsuche (Nicolas 2026-11-16: Linie 3 fuhr 368 m quer ueber einen Huegel): alle Punkte der Linienstrassen als Netz, Kanten entlang jeder Strasse
    // und Einmuendungen/Kreuzungen zwischen Strassen unter 15 m; kuerzester Weg vom Anfang der ersten Strasse bis zum Eintritt in die letzte, dann die
    // letzte ganz bis zu ihrem anderen Ende. Ohne Weg: alte Verkettung (immer zum naechsten Ende).
    let route = busPath(L, pool);
    if (!route) { console.warn("Bus " + L.name + ": kein zusammenhaengender Weg, Verkettung"); route = busChain(L, pool); }
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
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, ux = (q[0] - p[0]) / l * b.d, uz = (q[1] - p[1]) / l * b.d, off0 = Math.min(p[2] / 4, 3.5);   // rechte Spur
    // zweistoeckige Strassen: liegt unter der Spur die Abfahrtsrampe (Mitte offen), weich auf die aeussere Spur ausweichen (Nicolas 2026-11-16, Bus fiel in die Rampe)
    const dk = p[2] >= 12 && typeof gothamDeckAt === "function" ? gothamDeckAt(x0 - uz * off0, z0 + ux * off0, GOT.STR + 1) : null, laneT = dk !== null && dk < GOT.STR - 0.8 ? 5.2 : off0;
    b.lane = b.lane === undefined ? laneT : b.lane + (laneT - b.lane) * Math.min(1, dt * 2); const off = b.lane, x = x0 - uz * off, z = z0 + ux * off;
    // Hoehe und Neigung aus dem Boden 5 m vor und hinter der Mitte (Nicolas 2026-11-16: "bei einer Steigung bewegt er sich nicht korrekt mit")
    const gy = (px, pz, y0) => { const g = gothamDeckAt(px, pz, y0 + 1) ?? groundAt(px, pz, y0 + 2); return g === null || !isFinite(g) || Math.abs(g - y0) > 1.2 ? y0 : g; }, yF = gy(x + ux * 5, z + uz * 5, b.yF ?? b.y), yB = gy(x - ux * 5, z - uz * 5, b.yB ?? b.y);   // gy: mehr als 1,2 m je Bild hoeher (Ueberfuehrung) oder tiefer (Kanal unter einer Rampe ohne Kollision in der Ferne) ist nicht der eigene Boden
    b.yF = yF; b.yB = yB; b.y = (yF + yB) / 2; b.g.position.set(x, b.y, z); b.g.rotation.set(Math.atan2(yF - yB, 10), Math.atan2(-ux, -uz), 0, "YXZ"); }
}
