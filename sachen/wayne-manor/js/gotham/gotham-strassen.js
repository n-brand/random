// Wayne Manor 3D – Gotham: Strassen (Plan G2: G2a Hauptstrassen, G2b Nebenstrassen auf der Insel, Nicolas 2026-11-12)
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Nach gotham-kai.js. Daten: GOTHAM_STADT aus ../gotham/stadt.js (aus der Planungskarte exportiert, gleiche Linien wie dort).
"use strict";

// Linien aus der Karte (Karten-Koordinaten -> Spiel), alle 4 m abgetastet, nur die Stuecke auf der Insel (Festland, Highway und Bruecken folgen in
// G2c/G2d). Hauptstrassen: Fahrbahn w m (ab 13 m vier Spuren zu ca. 3,3 m mit gelber Doppellinie, gestrichelten Spur- und Randlinien, sonst zwei
// Spuren), 4 m Gehsteig. Nebenstrassen (G2b): 8 m mit gelber Doppellinie und 3 m Gehsteig, Gassen der Narrows 6 m ohne Linien mit 2 m Gehsteig;
// endet eine Nebenstrasse kurz vor einer anderen Fahrbahn (die Karte laesst sie dort aufhoeren), wird sie bis an deren Fahrbahn verlaengert.
// Kreuzungen (Strecken schneiden sich oder ein Ende liegt auf einer anderen Fahrbahn) sind schlichte Asphaltflaechen ohne Linien; Gehsteige setzen dort
// und auf anderen Fahrbahnen aus. Vorerst nur Optik: Boden bleibt die flache Strassenebene (-12), zweistoeckige Strassen kommen in G2e.
// Aufbau ca. 0,3 s: nicht beim Start, sondern einmal danach im Kachel-Zeitplan (gstrBuild), Gotham ist beim Start ohnehin weit weg.
const GSTR = { roads: [], patches: [], done: false };
function gstrBuild() {
  const S = GOTHAM_STADT, Y = GOT.STR, toG = ([x, z]) => GOT.toGame(x, z);
  const resample = (P, st) => { const out = [P[0]]; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / st));
    for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return out; };
  const onIsland = (x, z) => GOT.edgeSD(x, z) < -1;
  const add = (src, kind) => { const P = resample(src.pts.map(toG), 4); let run = [];
    const push = () => { if (run.length > 2) GSTR.roads.push({ id: src.id || null, name: src.name || null, w: src.w, kind, zweistock: !!src.zweistock, walk: kind === "haupt" ? 4 : src.w >= 8 ? 3 : 2, pts: run }); run = []; };
    for (const p of P) { if (onIsland(p[0], p[1])) run.push(p); else push(); } push(); };
  for (const h of S.haupt) add(h, "haupt");
  const nHaupt = GSTR.roads.length;
  for (const n of S.neben) add(n, "neben");
  // Raster mit allen Strecken (25-m-Zellen) fuer "liegt (x, z) auf einer anderen Fahrbahn?"
  const C = 25, key = (i, k) => i * 100000 + k;
  let grid;
  const build = () => { grid = new Map(); GSTR.roads.forEach((r, ri) => { for (let j = 1; j < r.pts.length; j++) { const a = r.pts[j - 1], b = r.pts[j], seen = new Set();
    for (const [x, z] of [a, b, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]]) { const k = key(Math.floor(x / C), Math.floor(z / C)); if (seen.has(k)) continue; seen.add(k); if (!grid.has(k)) grid.set(k, []); grid.get(k).push([ri, j]); } } }); };
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L)) : 0; return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const onOther = (x, z, self, pad) => { const ci = Math.floor(x / C), ck = Math.floor(z / C);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = grid.get(key(ci + a, ck + b)); if (!L) continue;
      for (const [ri, j] of L) { if (ri === self) continue; const r = GSTR.roads[ri]; if (segD(x, z, r.pts[j - 1], r.pts[j]) < r.w / 2 + pad) return r; } } return null; };
  build();
  // Nebenstrassen-Enden bis an die naechste Fahrbahn verlaengern (hoechstens 14 m, in Fahrtrichtung)
  for (let ri = nHaupt; ri < GSTR.roads.length; ri++) { const r = GSTR.roads[ri];
    for (const end of [0, 1]) { const P = r.pts, e = end ? P[P.length - 1] : P[0], q = end ? P[P.length - 2] : P[1], dx = e[0] - q[0], dz = e[1] - q[1], l = Math.hypot(dx, dz) || 1;
      if (onOther(e[0], e[1], ri, 0)) continue;
      for (let s = 0.5; s <= 14; s += 0.5) { const x = e[0] + dx / l * s, z = e[1] + dz / l * s; if (!onIsland(x, z)) break;
        const o = onOther(x, z, ri, -1.2); if (o) { const np = [x, z]; if (end) P.push(np); else P.unshift(np); break; } } } }
  build();
  // Kreuzungen
  const cross = (a, b, c, d) => { const r = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]); if (Math.abs(r) < 1e-9) return null;
    const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / r, u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / r;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] : null; };
  const PC = 40, pgrid = new Map();
  const nearPatch = (x, z, pad) => { const ci = Math.floor(x / PC), ck = Math.floor(z / PC);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = pgrid.get(key(ci + a, ck + b)); if (L) for (const p of L) if (Math.hypot(p[0] - x, p[1] - z) < p[2] + pad) return p; } return null; };
  const addPatch = (x, z, r) => { const o = nearPatch(x, z, 0); if (o && Math.hypot(o[0] - x, o[1] - z) < Math.max(o[2], r) * 0.6) { o[2] = Math.max(o[2], r); return; }
    const p = [x, z, r]; GSTR.patches.push(p); const k = key(Math.floor(x / PC), Math.floor(z / PC)); if (!pgrid.has(k)) pgrid.set(k, []); pgrid.get(k).push(p); };
  GSTR.roads.forEach((r, ri) => {
    for (let j = 1; j < r.pts.length; j++) { const a = r.pts[j - 1], b = r.pts[j], L = grid.get(key(Math.floor(a[0] / C), Math.floor(a[1] / C))) || [];
      for (const [rk, k] of L) { if (rk <= ri) continue; const o = GSTR.roads[rk], q = cross(a, b, o.pts[k - 1], o.pts[k]); if (q) addPatch(q[0], q[1], Math.max(r.w, o.w) / 2 + 2); } }
    for (const e of [r.pts[0], r.pts[r.pts.length - 1]]) { const o = onOther(e[0], e[1], ri, 1); if (o) addPatch(e[0], e[1], Math.max(r.w, o.kind === "haupt" ? r.w : o.w) / 2 + 2); }
  });
  // Texturen: Asphalt (Koernung), Linien quer zur Fahrbahn (v 0..1 = linker bis rechter Rand), 12 m je Wiederholung laengs
  const asph = (c, w, h) => { c.fillStyle = "#3b3d40"; c.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { const v = 45 + Math.random() * 30; c.fillStyle = `rgb(${v},${v + 1},${v + 3})`; c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } };
  const lineTex = vier => { const t = canvasTex(256, 256, (c, w, h) => { asph(c, w, h); const L = (v, col, dash, wd) => { c.fillStyle = col; for (let u = 0; u < w; u += dash ? w / 2 : w) c.fillRect(u, v * h - wd / 2, dash ? w / 4 : w, wd); };
      L(0.035, "#d8d8d2", false, 3); L(0.965, "#d8d8d2", false, 3); L(0.485, "#d9b23c", false, 3); L(0.515, "#d9b23c", false, 3); if (vier) { L(0.26, "#d8d8d2", true, 3); L(0.74, "#d8d8d2", true, 3); } });
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; return t; };
  const plain = canvasTex(128, 128, asph); plain.wrapS = plain.wrapT = THREE.RepeatWrapping;
  const walk = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#a3a19b"; c.fillRect(0, 0, w, h); c.strokeStyle = "#7f7d78"; c.lineWidth = 2; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(w, i * 32); c.moveTo(i * 32, 0); c.lineTo(i * 32, h); c.stroke(); }
    for (let i = 0; i < 1500; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }); walk.wrapS = walk.wrapT = THREE.RepeatWrapping;
  const gravel = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#8f8a7e"; c.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { const v = 100 + Math.random() * 70; c.fillStyle = `rgb(${v},${v - 4},${v - 12})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }); gravel.wrapS = gravel.wrapT = THREE.RepeatWrapping;
  const mat = (map, off) => M(0xffffff, { map, roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -off, polygonOffsetUnits: -off });
  const geo = () => ({ P: [], U: [], I: [] });
  // Band entlang der Linie zwischen den seitlichen Abstaenden d0 und d1 (links positiv); skip(x, z) laesst Vierecke aus; uv: u laengs/rep, v quer (0..1 oder Meter/vrep)
  function band(G, P, d0, d1, y, rep, vrep, skip) {
    const n = P.length, N = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
    let s = 0, prev = null;
    for (let i = 0; i < n; i++) { if (i) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      const k = G.P.length / 3, [nx, nz] = N[i], p = P[i];
      const yy = typeof y === "number" ? y : y[i];   // Festlandstrassen: Hoehe je Punkt
      for (const d of [d0, d1]) { G.P.push(p[0] + nx * d, yy, p[1] + nz * d); G.U.push(s / rep, vrep ? d / vrep : (d - d0) / (d1 - d0)); }
      const mx = p[0] + nx * (d0 + d1) / 2, mz = p[1] + nz * (d0 + d1) / 2, bad = skip && skip(mx, mz);
      if (prev !== null && !bad && !prev.bad) G.I.push(prev.k, k, prev.k + 1, prev.k + 1, k, k + 1);
      prev = { k, bad };
    }
  }
  const make = (G, m, name) => { if (!G.I.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(G.P, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(G.U, 2)); g.setIndex(G.I); g.computeVertexNormals(); g.computeBoundingSphere();
    const o = new THREE.Mesh(g, m); o.name = name; o.receiveShadow = true; o.userData.keep = true; o.userData.noLift = true; scene.add(o); return o; };
  const A4 = geo(), A2 = geo(), A0 = geo(), W = geo(), K = geo(), X = geo();
  GSTR.roads.forEach((r, ri) => {
    band(r.w >= 12.5 ? A4 : r.w >= 8 ? A2 : A0, r.pts, r.w / 2, -r.w / 2, Y + 0.05, 12, r.w < 8 ? 4 : 0, null);
    const sk = (x, z) => !!onOther(x, z, ri, 0.5) || !!nearPatch(x, z, 1);
    for (const sg of [1, -1]) { band(W, r.pts, sg * (r.w / 2 + 0.3), sg * (r.w / 2 + r.walk), Y + 0.04, 2, 2, sk); band(K, r.pts, sg * r.w / 2, sg * (r.w / 2 + 0.3), Y + 0.045, 2, 1, sk); }   // Gehsteig, Bordstein
  });
  // G2d: Festlandstrassen (GLAND aus gotham-gelaende.js): Fahrbahn mit Markierung auf dem Hoehenverlauf, 2 m Bankett aus Kies, Kreuzungen zwischen ihnen als Asphaltflaechen auf ihrer Hoehe
  const Kies = geo(), XL = geo();
  for (const r of GLAND.roads || []) { const yr = Array.from(r.y, v => v + 0.02), ys = Array.from(r.y, v => v - 0.02);
    band(r.w >= 12.5 ? A4 : A2, r.pts, r.w / 2, -r.w / 2, yr, 12, 0, null);
    for (const sg of [1, -1]) { band(Kies, r.pts, sg * r.w / 2, sg * (r.w / 2 + 2), ys, 2, 2, null); }
  }
  for (const r of GLAND.roads || []) for (const e of [0, r.pts.length - 1]) { const [x, z] = r.pts[e]; for (const o of GLAND.roads) { if (o === r) continue; let best = 1e9, by = 0; for (let j = 0; j < o.pts.length; j++) { const d = Math.hypot(o.pts[j][0] - x, o.pts[j][1] - z); if (d < best) { best = d; by = o.y[j]; } } if (best < o.w / 2 + 6) { const rr = Math.max(r.w, o.w) / 2 + 3, k = XL.P.length / 3; XL.P.push(x, by + 0.04, z); XL.U.push(x / 8, z / 8); for (let a = 0; a <= 24; a++) { const t = a / 24 * Math.PI * 2; XL.P.push(x + Math.cos(t) * rr, by + 0.04, z + Math.sin(t) * rr); XL.U.push((x + Math.cos(t) * rr) / 8, (z + Math.sin(t) * rr) / 8); if (a) XL.I.push(k, k + a + 1, k + a); } } } }
  for (const [x, z, rr] of GSTR.patches) { const k = X.P.length / 3; X.P.push(x, Y + 0.06, z); X.U.push(x / 8, z / 8);
    for (let a = 0; a <= 24; a++) { const t = a / 24 * Math.PI * 2; X.P.push(x + Math.cos(t) * rr, Y + 0.06, z + Math.sin(t) * rr); X.U.push((x + Math.cos(t) * rr) / 8, (z + Math.sin(t) * rr) / 8); if (a) X.I.push(k, k + a + 1, k + a); } }
  const kerb = M(0xc9c6bf, { roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1.5, polygonOffsetUnits: -1.5 });
  GSTR.meshes = [make(A4, mat(lineTex(true), 2), "Gotham-Strassen 4 Spuren"), make(A2, mat(lineTex(false), 2), "Gotham-Strassen 2 Spuren"), make(A0, mat(plain, 2), "Gotham-Gassen"),
    make(W, mat(walk, 1), "Gotham-Gehsteige"), make(Kies, mat(gravel, 1), "Gotham-Bankett"), make(XL, mat(plain, 3), "Gotham-Kreuzungen Festland"), make(K, kerb, "Gotham-Bordsteine"), make(X, mat(plain, 3), "Gotham-Kreuzungen")];
  GSTR.onRoad = (x, z, pad = 0) => !!onOther(x, z, -1, pad);                // fuer spaeter (Fuellbauten, Verkehr)
}

TILES.tasks.push({ plan() {}, step() { if (GSTR.done || TILES.startup || !TILES.frame || TILES.frame < 30) return false; GSTR.done = true; gstrBuild(); return false; } });
