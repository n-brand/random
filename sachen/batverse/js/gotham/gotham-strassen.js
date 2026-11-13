// Batverse – Gotham: Strassen (Plan G2: G2a Hauptstrassen, G2b Nebenstrassen auf der Insel, Nicolas 2026-11-12)
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Nach gotham-kai.js. Daten: GOTHAM_STADT aus ../gotham/stadt.js (aus der Planungskarte exportiert, gleiche Linien wie dort).
"use strict";

// Linien aus der Karte (Karten-Koordinaten -> Spiel), alle 4 m abgetastet, nur die Stuecke auf der Insel (Festland, Highway und Bruecken folgen in
// G2c/G2d). Hauptstrassen: Fahrbahn w m (ab 13 m vier Spuren zu ca. 3,3 m mit gelber Doppellinie, gestrichelten Spur- und Randlinien, sonst zwei
// Spuren), 4 m Gehsteig. Nebenstrassen (G2b): 8 m mit gelber Doppellinie und 3 m Gehsteig, Gassen der Narrows 6 m ohne Linien mit 2 m Gehsteig;
// endet eine Nebenstrasse kurz vor einer anderen Fahrbahn (die Karte laesst sie dort aufhoeren), wird sie bis an deren Fahrbahn verlaengert.
// Kreuzungen (Strecken schneiden sich oder ein Ende liegt auf einer anderen Fahrbahn) sind schlichte Asphaltflaechen ohne Linien; Gehsteige setzen dort
// und auf anderen Fahrbahnen aus. Gehsteige liegen 15 cm hoeher (Bordstein, auch begehbar: GSTR.walkAt), sonst Boden = Strassenebene (-12).
// Aufbau ca. 0,3 s: nicht beim Start, sondern einmal danach im Kachel-Zeitplan (gstrBuild), Gotham ist beim Start ohnehin weit weg.
const GSTR = { roads: [], patches: [], done: false, RAISE: 0.15, walkAt: null };   // RAISE: Gehsteig ueber der Fahrbahn (Bordstein 15 cm)
function* gstrGen() {                                                       // Aufbau in Etappen (yield = hier darf pausiert werden), Leistung 2026-11-13
  const S = GOTHAM_STADT, Y = GOT.STR, toG = ([x, z]) => GOT.toGame(x, z);
  const resample = (P, st) => { const out = [P[0]]; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / st));
    for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return out; };
  const onIsland = (x, z) => GOT.edgeSD(x, z) < -1;
  const add = (src, kind) => { const P = resample(src.pts.map(toG), 4); let run = [];
    const push = () => { if (run.length > 2) GSTR.roads.push({ id: src.id || null, name: src.name || null, w: src.w, kind, zweistock: !!src.zweistock, walk: kind === "haupt" ? 4 : src.w >= 8 ? 3 : 2, pts: run }); run = []; };
    for (const p of P) { if (onIsland(p[0], p[1])) run.push(p); else push(); } push(); };
  for (const h of S.haupt) add(h, "haupt");
  const nHaupt = GSTR.roads.length;
  yield;
  for (const n of S.neben) add(n, "neben");
  yield;
  // Raster mit allen Strecken (25-m-Zellen) fuer "liegt (x, z) auf einer anderen Fahrbahn?"
  const C = 25, key = (i, k) => i * 100000 + k;
  let grid;
  const build = () => { grid = new Map(); GSTR.roads.forEach((r, ri) => { for (let j = 1; j < r.pts.length; j++) { const a = r.pts[j - 1], b = r.pts[j], seen = new Set();
    for (const [x, z] of [a, b, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]]) { const k = key(Math.floor(x / C), Math.floor(z / C)); if (seen.has(k)) continue; seen.add(k); if (!grid.has(k)) grid.set(k, []); grid.get(k).push([ri, j]); } } }); };
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L)) : 0; return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const onOther = (x, z, self, pad) => { const ci = Math.floor(x / C), ck = Math.floor(z / C);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = grid.get(key(ci + a, ck + b)); if (!L) continue;
      for (const [ri, j] of L) { if (ri === self) continue; const r = GSTR.roads[ri]; if (segD(x, z, r.pts[j - 1], r.pts[j]) < r.w / 2 + pad) return r; } } return null; };
  // liegt (x, z) auf Fahrbahn oder Gehsteig einer anderen Strasse (bis w/2 + walk + extra)
  const onOtherW = (x, z, self, extra) => { const ci = Math.floor(x / C), ck = Math.floor(z / C);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = grid.get(key(ci + a, ck + b)); if (!L) continue;
      for (const [ri, j] of L) { if (ri === self) continue; const r = GSTR.roads[ri]; if (segD(x, z, r.pts[j - 1], r.pts[j]) < r.w / 2 + r.walk + extra) return r; } } return null; };
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
  for (let ri = 0; ri < GSTR.roads.length; ri++) { const r = GSTR.roads[ri]; if (ri % 15 === 14) yield;
    for (let j = 1; j < r.pts.length; j++) { const a = r.pts[j - 1], b = r.pts[j], L = grid.get(key(Math.floor(a[0] / C), Math.floor(a[1] / C))) || [];
      for (const [rk, k] of L) { if (rk <= ri) continue; const o = GSTR.roads[rk], q = cross(a, b, o.pts[k - 1], o.pts[k]); if (q) addPatch(q[0], q[1], Math.max(r.w, o.w) / 2 + 2); } }
    for (const e of [r.pts[0], r.pts[r.pts.length - 1]]) { const o = onOther(e[0], e[1], ri, 1); if (o) addPatch(e[0], e[1], Math.max(r.w, o.kind === "haupt" ? r.w : o.w) / 2 + 2); }
  }
  // Gehsteige und Bordsteine (Nicolas 2026-11-12: Loecher an Kreuzungsecken, Bordstein als Erhoehung): an Kreuzungen und Einmuendungen alle 2 m
  // statt 4 m abgetastet (sonst enden sie in 4-m-Stufen und lassen Wiesenecken frei)
  const inPatch = (x, z) => !!nearPatch(x, z, 0);
  for (let ri = 0; ri < GSTR.roads.length; ri++) { const r = GSTR.roads[ri], F = [r.pts[0]]; if (ri % 15 === 14) yield;
    for (let j = 1; j < r.pts.length; j++) { const a = r.pts[j - 1], b = r.pts[j], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const fine = [a, b].some(p => nearPatch(p[0], p[1], 10) || onOtherW(p[0], p[1], ri, r.walk + 3)), n = fine ? Math.max(1, Math.ceil(l / 2)) : 1;   // an Kreuzungen alle 2 m (1 m war doppelt so viele Punkte, kaum sichtbar besser)
      for (let k = 1; k <= n; k++) F.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    r.fine = F; }
  // Texturen: Asphalt (Koernung), Linien quer zur Fahrbahn (v 0..1 = linker bis rechter Rand), 12 m je Wiederholung laengs
  // Koernung direkt in die Pixel (vorher 5000 einzelne Rechtecke mit Farbwechsel, ca. 50 ms je Textur)
  const asph = (c, w, h) => { const im = c.createImageData(w, h), d = im.data; for (let i = 0; i < w * h; i++) { const k = Math.random() < 0.15, v = k ? 45 + Math.random() * 30 : 59 + (Math.random() - 0.5) * 6; d[i * 4] = v; d[i * 4 + 1] = v + 2; d[i * 4 + 2] = v + 5; d[i * 4 + 3] = 255; } c.putImageData(im, 0, 0); };
  const lineTex = vier => { const t = canvasTex(256, 256, (c, w, h) => { asph(c, w, h); const L = (v, col, dash, wd) => { c.fillStyle = col; for (let u = 0; u < w; u += dash ? w / 2 : w) c.fillRect(u, v * h - wd / 2, dash ? w / 4 : w, wd); };
      L(0.035, "#d8d8d2", false, 3); L(0.965, "#d8d8d2", false, 3); L(0.485, "#d9b23c", false, 3); L(0.515, "#d9b23c", false, 3); if (vier) { L(0.26, "#d8d8d2", true, 3); L(0.74, "#d8d8d2", true, 3); } });
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; return t; };
  yield; const plain = canvasTex(128, 128, asph); plain.wrapS = plain.wrapT = THREE.RepeatWrapping;
  yield; const walk = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#a3a19b"; c.fillRect(0, 0, w, h); c.strokeStyle = "#7f7d78"; c.lineWidth = 2; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(w, i * 32); c.moveTo(i * 32, 0); c.lineTo(i * 32, h); c.stroke(); }
    for (let i = 0; i < 1500; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }); walk.wrapS = walk.wrapT = THREE.RepeatWrapping;
  yield; const gravel = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#8f8a7e"; c.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { const v = 100 + Math.random() * 70; c.fillStyle = `rgb(${v},${v - 4},${v - 12})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }); gravel.wrapS = gravel.wrapT = THREE.RepeatWrapping;
  const mat = (map, off) => M(0xffffff, { map, roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -off, polygonOffsetUnits: -off });
  const geo = () => ({ P: [], U: [], I: [] });
  // Band entlang der Linie zwischen den seitlichen Abstaenden d0 und d1 (links positiv); skip(x, z) laesst Vierecke aus; uv: u laengs/rep, v quer (0..1 oder Meter/vrep)
  function band(G, P, d0, d1, y, rep, vrep, skip, fix) {
    const n = P.length, N = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
    let s = 0, prev = null;
    for (let i = 0; i < n; i++) { if (i) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      const k = G.P.length / 3, [nx, nz] = N[i], p = P[i];
      const yy = typeof y === "number" ? y : y[i];   // Festlandstrassen: Hoehe je Punkt
      for (const d of [d0, d1]) { let px = p[0] + nx * d, pz = p[1] + nz * d; if (fix) [px, pz] = fix(px, pz); G.P.push(px, yy, pz); G.U.push(s / rep, vrep ? d / vrep : (d - d0) / (d1 - d0)); }
      const mx = p[0] + nx * (d0 + d1) / 2, mz = p[1] + nz * (d0 + d1) / 2, bad = skip && skip(mx, mz);
      if (prev !== null && (fix ? !(bad && prev.bad) : !bad && !prev.bad)) G.I.push(prev.k, k, prev.k + 1, prev.k + 1, k, k + 1);   // mit fix: nur ganz innen liegende Vierecke weg
      prev = { k, bad };
    }
  }
  // senkrechtes Band im Abstand d von y0 bis y1 (Bordsteinkante); skip(x, z) am Band
  function vband(G, P, d, y0, y1, skip, fix) {
    const n = P.length, N = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
    let s = 0, prev = null;
    for (let i = 0; i < n; i++) { if (i) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      const k = G.P.length / 3, [nx, nz] = N[i]; let x = P[i][0] + nx * d, z = P[i][1] + nz * d; const bad = skip && skip(x, z); if (fix) [x, z] = fix(x, z);
      G.P.push(x, y0, z, x, y1, z); G.U.push(s / 2, 0, s / 2, 0.1);
      if (prev !== null && (fix ? !(bad && prev.bad) : !bad && !prev.bad)) G.I.push(prev.k, k, prev.k + 1, prev.k + 1, k, k + 1);   // mit fix: nur ganz innen liegende Vierecke weg
      prev = { k, bad }; }
  }
  const make = (G, m, name) => { if (!G.I.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(G.P, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(G.U, 2)); g.setIndex(G.I); g.computeVertexNormals(); g.computeBoundingSphere();
    return gsplit(g, m, name, { free: /Gehsteige|Bordstein|Bankett/.test(name) }); };   // in Zellen, weit weg ausgeblendet; Gehsteige/Bordsteine ohne JS-Kopie
  const A4 = geo(), A2 = geo(), A0 = geo(), W = geo(), K = geo(), X = geo(), KF = geo(), RS = GSTR.RAISE;   // Bordsteinkante eigenes Netz (Normalen in zwei Etappen statt einer langen)
  // Punkt auf einer anderen Fahrbahn (nicht ri) oder Kreuzungsflaeche -> auf deren Rand schieben (ri -1: alle Strassen)
  const mkFix = ri => (x, z) => { for (let it = 0; it < 3; it++) { let moved = false;
      const pc = nearPatch(x, z, 0); if (pc) { const dx = x - pc[0], dz = z - pc[1], l = Math.hypot(dx, dz) || 1; x = pc[0] + dx / l * (pc[2] + 0.01); z = pc[1] + dz / l * (pc[2] + 0.01); moved = true; }
      const ci = Math.floor(x / C), ck = Math.floor(z / C);
      for (let a = -1; a <= 1 && !moved; a++) for (let b = -1; b <= 1 && !moved; b++) { const L = grid.get(key(ci + a, ck + b)); if (!L) continue;
        for (const [rk, j] of L) { if (rk === ri) continue; const o = GSTR.roads[rk], A = o.pts[j - 1], B = o.pts[j], dx = B[0] - A[0], dz = B[1] - A[1], LL = dx * dx + dz * dz, t = LL ? Math.max(0, Math.min(1, ((x - A[0]) * dx + (z - A[1]) * dz) / LL)) : 0;
          const qx = A[0] + dx * t, qz = A[1] + dz * t, d = Math.hypot(x - qx, z - qz); if (d < o.w / 2) { const l = d || 1; x = qx + (x - qx) / l * (o.w / 2 + 0.01); z = qz + (z - qz) / l * (o.w / 2 + 0.01); moved = true; break; } } }
      if (!moved) break; } return [x, z]; };
  for (let ri = 0; ri < GSTR.roads.length; ri++) { const r = GSTR.roads[ri]; if (ri && (ri < 20 || ri % 3 === 2)) yield;   // Hauptstrassen (lang) einzeln
    band(r.w >= 12.5 ? A4 : r.w >= 8 ? A2 : A0, r.pts, r.w / 2, -r.w / 2, Y + 0.05, 12, r.w < 8 ? 4 : 0, r.zweistock ? gdeckOpen : null);   // G2e: ueber den Rampen keine Fahrbahn
    // Gehsteig 15 cm hoch (GSTR.RAISE), Bordstein = Kante plus 0,3 m Deckstein; die Kreuzungsflaeche bekommt einen runden Bordstein
    // Ecken genau: Punkte, die auf einer anderen Fahrbahn oder Kreuzungsflaeche liegen, werden auf deren Rand geschoben (die Vierecke dort werden
    // flach), so enden Gehsteig und Bordstein genau an der Kante und die Gehsteige beider Strassen fuellen die Ecke
    const inO = (x, z) => !!onOther(x, z, ri, 0) || inPatch(x, z);
    const fix = mkFix(ri);
    for (const sg of [1, -1]) { band(W, r.fine, sg * (r.w / 2 + 0.3), sg * (r.w / 2 + r.walk), Y + RS, 2, 2, inO, fix); band(K, r.fine, sg * r.w / 2, sg * (r.w / 2 + 0.3), Y + RS + 0.002, 2, 1, inO, fix); vband(KF, r.fine, sg * r.w / 2, Y + 0.04, Y + RS, inO, fix); }
  }
  // G2d: Festlandstrassen (GLAND aus gotham-gelaende.js): Fahrbahn mit Markierung auf dem Hoehenverlauf, 2 m Bankett aus Kies, Kreuzungen zwischen ihnen als Asphaltflaechen auf ihrer Hoehe
  const Kies = geo(), XL = geo();
  for (const r of GLAND.roads || []) { const yr = Array.from(r.y, v => v + 0.02), ys = Array.from(r.y, v => v - 0.02);
    band(r.w >= 12.5 ? A4 : A2, r.pts, r.w / 2, -r.w / 2, yr, 12, 0, null);
    for (const sg of [1, -1]) { band(Kies, r.pts, sg * r.w / 2, sg * (r.w / 2 + 2), ys, 2, 2, null); }
  }
  for (const r of GLAND.roads || []) for (const e of [0, r.pts.length - 1]) { const [x, z] = r.pts[e]; for (const o of GLAND.roads) { if (o === r) continue; let best = 1e9, by = 0; for (let j = 0; j < o.pts.length; j++) { const d = Math.hypot(o.pts[j][0] - x, o.pts[j][1] - z); if (d < best) { best = d; by = o.y[j]; } } if (best < o.w / 2 + 6) { const rr = Math.max(r.w, o.w) / 2 + 3, k = XL.P.length / 3; XL.P.push(x, by + 0.04, z); XL.U.push(x / 8, z / 8); for (let a = 0; a <= 24; a++) { const t = a / 24 * Math.PI * 2; XL.P.push(x + Math.cos(t) * rr, by + 0.04, z + Math.sin(t) * rr); XL.U.push((x + Math.cos(t) * rr) / 8, (z + Math.sin(t) * rr) / 8); if (a) XL.I.push(k, k + a + 1, k + a); } } } }
  for (const [x, z, rr] of GSTR.patches) { const k = X.P.length / 3; X.P.push(x, Y + 0.06, z); X.U.push(x / 8, z / 8);
    for (let a = 0; a <= 24; a++) { const t = a / 24 * Math.PI * 2; X.P.push(x + Math.cos(t) * rr, Y + 0.06, z + Math.sin(t) * rr); X.U.push((x + Math.cos(t) * rr) / 8, (z + Math.sin(t) * rr) / 8); if (a) X.I.push(k, k + a + 1, k + a); } }
  // Rand der Kreuzungsflaechen: Bordstein im Bogen, wo dahinter Gehsteig liegt (nicht ueber Fahrbahnen, nicht in einer anderen Kreuzungsflaeche)
  const inOtherPatch = (x, z, me) => { const ci = Math.floor(x / PC), ck = Math.floor(z / PC); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = pgrid.get(key(ci + a, ck + b)); if (L) for (const p of L) if (p !== me && Math.hypot(p[0] - x, p[1] - z) < p[2]) return true; } return false; };
  let pi = 0; for (const p of GSTR.patches) { if (++pi % 20 === 0) yield; const [cx, cz, rr] = p, na = Math.max(12, Math.ceil(Math.PI * 2 * rr / 0.6)); let prev = null;
    for (let a = 0; a <= na; a++) { const t = a / na * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), x = cx + c * rr, z = cz + s * rr;
      const ok = !onOther(x, z, -1, 0.3) && !!onOtherW(x, z, -1, 0) && !inOtherPatch(x, z, p);
      if (ok && prev) { const k = K.P.length / 3; for (const [px, pz, pc, ps] of [prev, [x, z, c, s]]) { K.P.push(px, Y + RS + 0.002, pz, px + pc * 0.3, Y + RS + 0.002, pz + ps * 0.3); K.U.push(0, 0, 0, 1); }
        K.I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
        const q = KF.P.length / 3; for (const [px, pz] of [prev, [x, z]]) { KF.P.push(px, Y + 0.04, pz, px, Y + RS, pz); KF.U.push(0, 0, 0, 0.1); } KF.I.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
      prev = ok ? [x, z, c, s] : null; } }
  // Ecken der Kreuzungen: Gehsteig-Ring 4,5 m breit um jede Kreuzungsflaeche (auf Fahrbahnen weggelassen bzw. an deren Rand geschoben), fuellt die
  // Ecken zwischen den Gehsteigen beider Strassen (Nicolas 2026-11-12: Wiesenloecher an den Ecken)
  { const fixA = mkFix(-1), inR = (x, z) => !!onOther(x, z, -1, 0);
    let qi = 0; for (const p of GSTR.patches) { if (++qi % 20 === 0) yield; const [cx, cz, rr] = p, na = Math.max(12, Math.ceil(Math.PI * 2 * (rr + 4.5) / 0.8)); let prev = null;
      for (let a = 0; a <= na; a++) { const t = a / na * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t), k = W.P.length / 3, bad = inR(cx + c * (rr + 2.2), cz + sn * (rr + 2.2)) || inOtherPatch(cx + c * (rr + 2.2), cz + sn * (rr + 2.2), p);
        for (const d of [rr + 0.3, rr + 4.5]) { const [x, z] = fixA(cx + c * d, cz + sn * d); W.P.push(x, Y + RS - 0.004, z); W.U.push(x / 2, z / 2); }
        if (prev && !(bad && prev.bad)) W.I.push(prev.k, k, prev.k + 1, prev.k + 1, k, k + 1);
        prev = { k, bad }; } } }
  yield;
  const kerb = M(0xc9c6bf, { roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1.5, polygonOffsetUnits: -1.5 });
  // Netze einzeln bauen, dazwischen pausieren (Normalen der grossen Netze kosten je bis ca. 0,1 s)
  GSTR.meshes = [];
  GSTR.meshes.push(make(A4, mat(lineTex(true), 2), "Gotham-Strassen 4 Spuren")); yield;
  GSTR.meshes.push(make(A2, mat(lineTex(false), 2), "Gotham-Strassen 2 Spuren")); yield;
  GSTR.meshes.push(make(A0, mat(plain, 2), "Gotham-Gassen")); yield;
  GSTR.meshes.push(make(W, mat(walk, 1), "Gotham-Gehsteige")); yield;
  GSTR.meshes.push(make(Kies, mat(gravel, 1), "Gotham-Bankett")); yield;
  GSTR.meshes.push(make(XL, mat(plain, 3), "Gotham-Kreuzungen Festland")); yield;
  GSTR.meshes.push(make(K, kerb, "Gotham-Bordsteine")); yield;
  GSTR.meshes.push(make(KF, kerb, "Gotham-Bordsteinkanten")); yield;
  GSTR.meshes.push(make(X, mat(plain, 3), "Gotham-Kreuzungen")); yield;
  GSTR.onRoad = (x, z, pad = 0) => !!onOther(x, z, -1, pad);                // fuer spaeter (Fuellbauten, Verkehr)
  // auf einem Gehsteig (nicht auf einer Fahrbahn oder Kreuzungsflaeche): dort ist der Boden GSTR.RAISE hoeher (groundAt in laufen.js)
  GSTR.walkAt = (x, z) => !onOther(x, z, -1, 0) && !inPatch(x, z) && !!onOtherW(x, z, -1, 0);
}

// ganz auf einmal (Tests); im Spiel in Etappen ueber die Kachel-Aufgabe: je Bild hoechstens ca. 6 ms (vorher 2,7 s am Stueck, Nicolas 2026-11-13: lag)
function gstrBuild() { for (const _ of gstrGen()); GSTR.done = true; }
TILES.tasks.push({ gen: null, plan() {}, step() { if (GSTR.done || TILES.startup || !TILES.frame || TILES.frame < 30) return false;
  if (!this.gen) this.gen = gstrGen(); const t0 = performance.now(); while (performance.now() - t0 < 6) if (this.gen.next().done) { GSTR.done = true; this.gen = null; return false; } return false; } });
