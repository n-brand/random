// Batverse – Gotham: U-Bahn, vier Ringlinien (V1, Nicolas 2026-11-12/16; PLAN-GOTHAM V1, Daten GOTHAM.ubahn in gotham/daten.js)
// Klassisches Skript nach gotham-gassen.js. Bahnsteig 11 m unter der Strasse (Ebene Tiefgarage 2), Gleisbett 1,1 m darunter.
// Je Ring ein Tunnel mit zwei Gleisen (beide Richtungen, Vorbild Yamanote-Linie), an Stationen mit Mittelbahnsteig (8 m), an den Kreuzungen zweier Ringe
// Umsteigestationen (Gleise kreuzen auf gleicher Hoehe, OFFENE-FRAGEN 9). Raeume unter der Erde ueber dkRoom/dkAdd (kern/drehkoll.js): Boden, Waende
// (ausserhalb des Raums gilt das Gelaende = Wand) und Kamera ohne eigene Regeln in groundAt. Netze in UNDERGROUND (nur sichtbar, wenn die Kamera unten ist).
// Zugang (OFFENE-FRAGEN 7): je Station ein Aufzug-Pavillon auf dem Gehsteig, Rechtsklick faehrt hinunter bzw. vom Bahnsteig-Pavillon hinauf.
"use strict";
const UB = { Y: GOT.STR - 11, BED: GOT.STR - 12.1, H: 5.6, TR: 2.25, TS: 5.75, PL: 60, rings: [], stations: [], done: false, grp: null };
// Ring als geschlossene Linie in Spielkoordinaten, alle ca. 4 m (Ellipse wie in der Karte)
function ubRingPts(R) {
  const d = (R.dreh || 0) * Math.PI / 180, ell = t => { const x = Math.cos(t) * R.rx, z = Math.sin(t) * R.rz; return GOT.toGame(R.cx + x * Math.cos(d) - z * Math.sin(d), R.cz + x * Math.sin(d) + z * Math.cos(d)); };
  const F = []; for (let k = 0; k < 1440; k++) F.push(ell(k / 1440 * Math.PI * 2));
  const cum = [0]; for (let k = 1; k <= F.length; k++) cum.push(cum[k - 1] + Math.hypot(F[k % F.length][0] - F[k - 1][0], F[k % F.length][1] - F[k - 1][1]));
  const L = cum[F.length], n = Math.round(L / 4), out = []; let j = 0;
  for (let i = 0; i < n; i++) { const s = i / n * L; while (cum[j + 1] < s) j++; const t = (s - cum[j]) / (cum[j + 1] - cum[j] || 1), a = F[j], b = F[(j + 1) % F.length]; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  return { P: out, L, ds: L / n, ang: i => Math.round(i / n * 1440) };
}
// Abstand Punkt -> Ring (Laengsposition s in m, Abstand d)
function ubNear(r, x, z) { let best = 1e9, bi = 0; const P = r.P; for (let i = 0; i < P.length; i += 4) { const q = (P[i][0] - x) ** 2 + (P[i][1] - z) ** 2; if (q < best) { best = q; bi = i; } }
  for (let i = bi - 6; i <= bi + 6; i++) { const k = (i + P.length) % P.length, q = (P[k][0] - x) ** 2 + (P[k][1] - z) ** 2; if (q < best) { best = q; bi = k; } }
  return { i: bi, d: Math.sqrt(best) }; }
// Gleisabstand von der Mitte (2,25 m; an Stationen 5,75 m fuer den Mittelbahnsteig, Uebergang ueber 30 m)
function ubTrack(r, i) { let best = 1e9; for (const st of r.st) { const di = Math.abs(i - st.i), d = Math.min(di, r.P.length - di) * r.ds; if (d < best) best = d; }
  const e = Math.max(0, best - UB.PL); return e >= 30 ? UB.TR : UB.TS - (UB.TS - UB.TR) * (1 - Math.cos(e / 30 * Math.PI)) / 2; }
const ubHW = (r, i) => ubTrack(r, i) + 2.9;   // halbe Tunnelbreite

function* ubGen() {
  while (!GSTR.done || !GGEB.done) yield "wait";
  const U = GOTHAM.ubahn, Y = UB.Y, BED = UB.BED, H = UB.H;
  // Ringe, Stationen, Kreuzungen
  for (const R of U.ringe) { const g = ubRingPts(R); UB.rings.push({ R, name: R.name, col: new THREE.Color(R.farbe), P: g.P, L: g.L, ds: g.ds, st: [] }); }
  for (const r of UB.rings) for (const s of r.R.stationen) { const n = r.P.length, i = Math.round((((s.a % 360) + 360) % 360) / 360 * n) % n;
    const st = { name: s.name, i, rings: [r], haupt: !!s.haupt }; r.st.push(st); UB.stations.push(st); }
  for (let a = 0; a < UB.rings.length; a++) for (let b = a + 1; b < UB.rings.length; b++) { const A = UB.rings[a], B = UB.rings[b];
    for (let i = 0; i < A.P.length; i++) { const p = A.P[i], q = A.P[(i + 1) % A.P.length];
      for (let j = 0; j < B.P.length; j++) { const u = B.P[j], v = B.P[(j + 1) % B.P.length], rx = q[0] - p[0], rz = q[1] - p[1], sx = v[0] - u[0], sz = v[1] - u[1], den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) continue;
        const t = ((u[0] - p[0]) * sz - (u[1] - p[1]) * sx) / den, w = ((u[0] - p[0]) * rz - (u[1] - p[1]) * rx) / den; if (t < 0 || t > 1 || w < 0 || w > 1) continue;
        const st = { name: "Umsteigen " + A.name.replace(/^Ring \d /, "") + " / " + B.name.replace(/^Ring \d /, ""), i, j, rings: [A, B], cross: [p[0] + rx * t, p[1] + rz * t] };
        const sh = k => Math.round((UB.PL + 25) / k.ds);   // Bahnsteig hinter der Kreuzung (sonst laege er quer ueber den Gleisen des anderen Rings)
        st.i = (i + sh(A)) % A.P.length; A.st.push({ ...st, i: st.i, ref: st }); B.st.push({ ...st, i: (j + sh(B)) % B.P.length, ref: st }); UB.stations.push(st); } } yield; }
  // Abstellanlage (Teil C): Zufahrtsgleis vom Hauptbahnhof (Karte: depot.gleis, Anfang = Hauptbahnhof) zur Halle (depot x/z/w/d, Karten-Achsen)
  { const D = U.depot, R1 = UB.rings[0], H0 = R1.st.find(q => q.haupt) || R1.st[0], P0 = R1.P[H0.i], G = D.gleis.slice(1).map(([x, z]) => GOT.toGame(x, z)), hall = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => GOT.toGame(D.x + a * D.w / 2, D.z + b * D.d / 2));
    const hc = GOT.toGame(D.x, D.z), Q = [P0, ...G, hc], spur = []; for (let k = 0; k < Q.length - 1; k++) { const [ax, az] = Q[k], [bx, bz] = Q[k + 1], L = Math.hypot(bx - ax, bz - az); for (let t = 0; t < L; t += 4) spur.push([ax + (bx - ax) * t / L, az + (bz - az) * t / L]); }
    spur.push(hc); UB.depot = { spur, hall, hc, hw: 3.2 }; }
  const inSpur = (x, z, m = 0.3) => { const S = UB.depot.spur; for (let k = 0; k < S.length - 1; k++) { const [ax, az] = S[k], [bx, bz] = S[k + 1], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    if (Math.hypot(x - ax - dx * t, z - az - dz * t) < UB.depot.hw - m) return true; } return false; };
  const inHall = (x, z) => bautInPoly(UB.depot.hall, x, z);
  // Materialien
  const tile = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#d9d6cc"; c.fillRect(0, 0, w, h); c.strokeStyle = "#a9a59b"; c.lineWidth = 2; for (let x = 0; x <= w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
  const beton = canvasTex(128, 128, (c, w, h) => { const r = rng(311); c.fillStyle = "#6d6a64"; c.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${r() * 0.07})`; c.fillRect(r() * w, r() * h, 3, 3); } c.fillStyle = "rgba(0,0,0,.15)"; c.fillRect(0, h - 6, w, 6); });
  const bett = canvasTex(64, 128, (c, w, h) => { const r = rng(17); c.fillStyle = "#4b4640"; c.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(${r() < 0.5 ? "20,18,16" : "120,110,95"},${0.3 + r() * 0.3})`; c.fillRect(r() * w, r() * h, 2, 2); } c.fillStyle = "#3a2f25"; c.fillRect(0, 0, w, 22); c.fillRect(0, 64, w, 22); });   // Schwellen alle 0,6 m
  const M = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const mats = { wand: M({ map: beton, emissive: 0x2a2a28, emissiveIntensity: 1 }), decke: M({ color: 0x55534f, emissive: 0x1c1c1b, emissiveIntensity: 1 }), bett: M({ map: bett, emissive: 0x161412, emissiveIntensity: 1 }),
    schiene: M({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.35, emissive: 0x202224, emissiveIntensity: 1 }), kachel: M({ map: tile, emissive: 0x3a3934, emissiveIntensity: 1 }),
    bahnsteig: M({ color: 0xb5b0a4, emissive: 0x34322d, emissiveIntensity: 1 }), kante: M({ color: 0xe6c229, emissive: 0x3d3410, emissiveIntensity: 1 }),
    licht: new THREE.MeshBasicMaterial({ color: 0xfff3d6 }), farbe: M({ vertexColors: true, emissive: 0x111111, emissiveIntensity: 1 }) };
  const out = new Map(), B = k => gbvBucket(out, k);
  const grp = new THREE.Group(); grp.name = "Gotham-U-Bahn"; grp.userData.keep = true; grp.userData.noLift = true;
  for (const r of UB.rings) {
    const P = r.P, n = P.length, inStation = i => { for (const st of r.st) { const di = Math.abs(i - st.i), d = Math.min(di, n - di) * r.ds; if (d <= UB.PL) return st; } return null; };
    // andere Tunnel (Kreuzungen): Wandstueck weglassen, wenn es im Innenraum eines anderen Rings liegt
    const others = UB.rings.filter(o => o !== r), inOther = (x, z) => inSpur(x, z) || inHall(x, z) || others.some(o => { const q = ubNear(o, x, z); return q.d < ubHW(o, q.i) - 0.3; });
    const N = i => { const a = P[(i - 1 + n) % n], b = P[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; };   // links
    for (let i = 0; i < n; i++) { const i1 = (i + 1) % n, p0 = P[i], p1 = P[i1], n0 = N(i), n1 = N(i1), h0 = ubHW(r, i), h1 = ubHW(r, i1), t0 = ubTrack(r, i), t1 = ubTrack(r, i1), st = inStation(i), ceil = BED + H;   // ueberall gleich hoch (eine hoehere Stationsdecke liess am Uebergang einen Spalt)
      const W = (p, nn, o, y) => [p[0] + nn[0] * o, y, p[1] + nn[1] * o], sv = i * r.ds / 2.5;
      // Gleisbett, Decke, Lichtband
      gbvQuad(B("bett"), W(p0, n0, -h0, BED), W(p1, n1, -h1, BED), W(p1, n1, h1, BED), W(p0, n0, h0, BED), [0, 1, 0], [[0, sv], [0, sv + r.ds / 2.5], [h1 / 2, sv + r.ds / 2.5], [h0 / 2, sv]]);
      gbvQuad(B("decke"), W(p0, n0, -h0, ceil), W(p0, n0, h0, ceil), W(p1, n1, h1, ceil), W(p1, n1, -h1, ceil), [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      if (i % 3 === 0) gbvQuad(B("licht"), W(p0, n0, -0.3, ceil - 0.02), W(p0, n0, 0.3, ceil - 0.02), W(p1, n1, 0.3, ceil - 0.02), W(p1, n1, -0.3, ceil - 0.02), [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      // Waende (Kacheln an Stationen), ausser im Innenraum eines anderen Rings
      for (const sd of [-1, 1]) { const a = W(p0, n0, sd * h0, 0), b = W(p1, n1, sd * h1, 0); if (inOther((a[0] + b[0]) / 2, (a[2] + b[2]) / 2)) continue;
        gbvQuad(B(st ? "kachel" : "wand"), [a[0], BED, a[2]], [b[0], BED, b[2]], [b[0], ceil, b[2]], [a[0], ceil, a[2]], [-sd * (n0[0] + n1[0]) / 2, 0, -sd * (n0[1] + n1[1]) / 2], [[sv, 0], [sv + r.ds / 2.5, 0], [sv + r.ds / 2.5, (ceil - BED) / 2.5], [sv, (ceil - BED) / 2.5]]); }
      // Schienen: je Gleis zwei (Spur 1,435 m), Oberkante 0,18 ueber dem Bett
      for (const tsd of [-1, 1]) for (const rs of [-0.7175, 0.7175]) { const o0 = tsd * t0 + rs, o1 = tsd * t1 + rs, y = BED + 0.18;
        gbvQuad(B("schiene"), W(p0, n0, o0 - 0.04, y), W(p1, n1, o1 - 0.04, y), W(p1, n1, o1 + 0.04, y), W(p0, n0, o0 + 0.04, y), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        gbvQuad(B("schiene"), W(p0, n0, o0 + 0.04, BED), W(p1, n1, o1 + 0.04, BED), W(p1, n1, o1 + 0.04, y), W(p0, n0, o0 + 0.04, y), [n0[0], 0, n0[1]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        gbvQuad(B("schiene"), W(p0, n0, o0 - 0.04, BED), W(p1, n1, o1 - 0.04, BED), W(p1, n1, o1 - 0.04, y), W(p0, n0, o0 - 0.04, y), [-n0[0], 0, -n0[1]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
      // Mittelbahnsteig (Oberkante UB.Y, gelbe Kante), nur bei voller Gleisweite
      if (st && t0 > UB.TS - 0.05 && t1 > UB.TS - 0.05) { const pw = UB.TS - 1.75;
        gbvQuad(B("bahnsteig"), W(p0, n0, -pw, Y), W(p0, n0, pw, Y), W(p1, n1, pw, Y), W(p1, n1, -pw, Y), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        for (const sd of [-1, 1]) { gbvQuad(B("kante"), W(p0, n0, sd * pw, Y + 0.005), W(p0, n0, sd * (pw - 0.5), Y + 0.005), W(p1, n1, sd * (pw - 0.5), Y + 0.005), W(p1, n1, sd * pw, Y + 0.005), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
          gbvQuad(B("wand"), W(p0, n0, sd * pw, BED), W(p1, n1, sd * pw, BED), W(p1, n1, sd * pw, Y), W(p0, n0, sd * pw, Y), [sd * n0[0], 0, sd * n0[1]], [[0, 0], [1, 0], [1, 0.4], [0, 0.4]]); }
        // Boden des Bahnsteigs (dk) je Stueck
        const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2, ux = (p1[0] - p0[0]) / r.ds, uz = (p1[1] - p0[1]) / r.ds;
        dkAdd({ cx: mx, cy: Y - 0.55, cz: mz, ux, uz, hl: r.ds / 2 + 0.05, hw: pw, hh: 0.55, m: 0, ceil: 0 }); }
      // Raum und Gleisbett-Boden (dk)
      { const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2, ux = (p1[0] - p0[0]) / r.ds, uz = (p1[1] - p0[1]) / r.ds, hw = Math.min(h0, h1) - 0.3;
        dkRoom({ poly: [[p0[0] - n0[0] * h0, p0[1] - n0[1] * h0], [p1[0] - n1[0] * h1, p1[1] - n1[1] * h1], [p1[0] + n1[0] * h1, p1[1] + n1[1] * h1], [p0[0] + n0[0] * h0, p0[1] + n0[1] * h0]], y0: BED - 0.3, y1: ceil });
        dkAdd({ cx: mx, cy: BED - 0.25, cz: mz, ux, uz, hl: r.ds / 2 + 0.05, hw, hh: 0.25, m: 0, ceil: 0 }); }
      if (i % 40 === 39) yield;
    }
    // Kreuzungen: Raum und Boden ueber die ganze Kreuzung (sonst Kante im Schnitt der beiden Raeume)
  }
  // Zufahrt (ein Gleis, 6,4 m breit) und Halle (3 Gleise, Waende/Decke, Lichtband); Waende im Ring-Innenraum bzw. in der Halle weggelassen
  { const Dp = UB.depot, S = Dp.spur, hw = Dp.hw, ceil = BED + H, onRing = (x, z) => UB.rings.some(o => { const q = ubNear(o, x, z); return q.d < ubHW(o, q.i) - 0.3; });
    for (let k = 0; k < S.length - 1; k++) { const p0 = S[k], p1 = S[k + 1], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, ux = (p1[0] - p0[0]) / L, uz = (p1[1] - p0[1]) / L, nx = -uz, nz = ux, W = (p, o, y) => [p[0] + nx * o, y, p[1] + nz * o];
      if (inHall((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)) continue;
      gbvQuad(B("bett"), W(p0, -hw, BED), W(p1, -hw, BED), W(p1, hw, BED), W(p0, hw, BED), [0, 1, 0], [[0, k * L / 2.5], [0, (k + 1) * L / 2.5], [1.3, (k + 1) * L / 2.5], [1.3, k * L / 2.5]]);
      gbvQuad(B("decke"), W(p0, -hw, ceil), W(p0, hw, ceil), W(p1, hw, ceil), W(p1, -hw, ceil), [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (const sd of [-1, 1]) { const a = W(p0, sd * hw, 0), b = W(p1, sd * hw, 0); if (onRing((a[0] + b[0]) / 2, (a[2] + b[2]) / 2) || inHall((a[0] + b[0]) / 2, (a[2] + b[2]) / 2)) continue;
        gbvQuad(B("wand"), [a[0], BED, a[2]], [b[0], BED, b[2]], [b[0], ceil, b[2]], [a[0], ceil, a[2]], [-sd * nx, 0, -sd * nz], [[0, 0], [L / 2.5, 0], [L / 2.5, (ceil - BED) / 2.5], [0, (ceil - BED) / 2.5]]); }
      for (const rs of [-0.7175, 0.7175]) gbvQuad(B("schiene"), W(p0, rs - 0.04, BED + 0.18), W(p1, rs - 0.04, BED + 0.18), W(p1, rs + 0.04, BED + 0.18), W(p0, rs + 0.04, BED + 0.18), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      if (!onRing((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)) { dkRoom({ poly: [W(p0, -hw, 0), W(p1, -hw, 0), W(p1, hw, 0), W(p0, hw, 0)].map(q => [q[0], q[2]]), y0: BED - 0.3, y1: ceil });
        dkAdd({ cx: (p0[0] + p1[0]) / 2, cy: BED - 0.25, cz: (p0[1] + p1[1]) / 2, ux, uz, hl: L / 2 + 0.05, hw: hw - 0.3, hh: 0.25, m: 0, ceil: 0 }); } }
    // Halle: Rechteck aus den vier Ecken, drei Gleise laengs der laengeren Seite
    const Hh = Dp.hall, [A0, A1, A2, A3] = Hh, ceilH = BED + H + 1.5;
    gbvQuad(B("bett"), [A0[0], BED, A0[1]], [A1[0], BED, A1[1]], [A2[0], BED, A2[1]], [A3[0], BED, A3[1]], [0, 1, 0], [[0, 0], [24, 0], [24, 24], [0, 24]]);
    gbvQuad(B("decke"), [A0[0], ceilH, A0[1]], [A3[0], ceilH, A3[1]], [A2[0], ceilH, A2[1]], [A1[0], ceilH, A1[1]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const hcx = Dp.hc[0], hcz = Dp.hc[1];
    for (let e = 0; e < 4; e++) { const a = Hh[e], b = Hh[(e + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, nx = hcx - mx, nz = hcz - mz, nl = Math.hypot(nx, nz) || 1, steps = Math.ceil(L / 4);
      for (let q = 0; q < steps; q++) { const t0 = q / steps, t1 = (q + 1) / steps, x0 = a[0] + (b[0] - a[0]) * t0, z0 = a[1] + (b[1] - a[1]) * t0, x1 = a[0] + (b[0] - a[0]) * t1, z1 = a[1] + (b[1] - a[1]) * t1;
        if (inSpur((x0 + x1) / 2 + nx / nl * 0.5, (z0 + z1) / 2 + nz / nl * 0.5, -0.5)) continue;   // Einfahrt offen
        gbvQuad(B("wand"), [x0, BED, z0], [x1, BED, z1], [x1, ceilH, z1], [x0, ceilH, z0], [nx / nl, 0, nz / nl], [[0, 0], [1.6, 0], [1.6, 3], [0, 3]]); } }
    const lng = Math.hypot(A1[0] - A0[0], A1[1] - A0[1]) >= Math.hypot(A3[0] - A0[0], A3[1] - A0[1]), [E0, E1, E3] = lng ? [A0, A1, A3] : [A0, A3, A1], ex = [(E1[0] - E0[0]), (E1[1] - E0[1])], ey = [(E3[0] - E0[0]), (E3[1] - E0[1])], hl = Math.hypot(...ex), hb = Math.hypot(...ey);
    Dp.tracks = [];
    for (const f of [0.25, 0.5, 0.75]) { const s0 = [E0[0] + ey[0] * f, E0[1] + ey[1] * f], s1 = [s0[0] + ex[0], s0[1] + ex[1]], ux = ex[0] / hl, uz = ex[1] / hl, nx = -uz, nz = ux; Dp.tracks.push([s0, s1]);
      for (const rs of [-0.7175, 0.7175]) gbvQuad(B("schiene"), [s0[0] + nx * (rs - 0.04), BED + 0.18, s0[1] + nz * (rs - 0.04)], [s1[0] + nx * (rs - 0.04), BED + 0.18, s1[1] + nz * (rs - 0.04)], [s1[0] + nx * (rs + 0.04), BED + 0.18, s1[1] + nz * (rs + 0.04)], [s0[0] + nx * (rs + 0.04), BED + 0.18, s0[1] + nz * (rs + 0.04)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (let t = 4; t < hl; t += 12) gbvQuad(B("licht"), [s0[0] + ux * t - nx * 0.4, ceilH - 0.02, s0[1] + uz * t - nz * 0.4], [s0[0] + ux * t + nx * 0.4, ceilH - 0.02, s0[1] + uz * t + nz * 0.4], [s0[0] + ux * (t + 3) + nx * 0.4, ceilH - 0.02, s0[1] + uz * (t + 3) + nz * 0.4], [s0[0] + ux * (t + 3) - nx * 0.4, ceilH - 0.02, s0[1] + uz * (t + 3) - nz * 0.4], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    dkRoom({ poly: Hh, y0: BED - 0.3, y1: ceilH }); { const ux = ex[0] / hl, uz = ex[1] / hl; dkAdd({ cx: hcx, cy: BED - 0.25, cz: hcz, ux, uz, hl: hl / 2 - 0.3, hw: hb / 2 - 0.3, hh: 0.25, m: 0, ceil: 0 }); }
    yield; }
  // Graffiti "NBR" (Karte: Ring 4 zwischen Narrows und Fabrikviertel, "im Tunnel Richtung Fabrikviertel") an der Aussenwand, 8 m lang
  { const r4 = UB.rings.find(q => /Narrows|Ost/.test(q.name)) || UB.rings[3], sa = r4.R.stationen, a0 = (sa.find(q => q.name === "Narrows") || { a: 150 }).a, a1 = (sa.find(q => q.name === "Fabrikviertel") || { a: 210 }).a;
    const n = r4.P.length, k = Math.round(((a0 + a1) / 2) / 360 * n) % n, P = r4.P, a = P[(k - 1 + n) % n], b = P[(k + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l, hw = ubHW(r4, k) - 0.04;
    for (const sd of [-1, 1]) { const nx = uz * sd, nz = -ux * sd, cx = P[k][0] - uz * sd * hw, cz = P[k][1] + ux * sd * hw, [L0, R0] = (ux * nz - uz * nx) > 0 ? [[cx - ux * 4, cz - uz * 4], [cx + ux * 4, cz + uz * 4]] : [[cx + ux * 4, cz + uz * 4], [cx - ux * 4, cz - uz * 4]];
      gbvQuad(B("graffiti"), [L0[0], BED + 1.2, L0[1]], [R0[0], BED + 1.2, R0[1]], [R0[0], BED + 3.6, R0[1]], [L0[0], BED + 3.6, L0[1]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    UB.graffiti = [P[k][0], P[k][1]];
    mats.graffiti = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, map: canvasTex(512, 160, (c, w, h) => { c.clearRect(0, 0, w, h); c.lineJoin = "round";
      c.font = "italic 900 132px Impact, Arial Black, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 14; c.strokeStyle = "#1b0b22"; c.strokeText("NBR", w / 2, h / 2 + 6);
      const g = c.createLinearGradient(0, 20, 0, h - 20); g.addColorStop(0, "#ff7be6"); g.addColorStop(1, "#c21fa8"); c.fillStyle = g; c.fillText("NBR", w / 2, h / 2 + 6);
      c.fillStyle = "rgba(255,79,216,.8)"; for (let i = 0; i < 9; i++) c.fillRect(120 + i * 32, h / 2 + 50, 3, 14 + (i * 37) % 30); }) }); }
  // Stationsschilder an den Tunnelwaenden (Name, Ringfarbe): ein Atlas fuer alle (je Zeile 64 px), ein Netz (vorher je Schild ein Netz)
  const SN = []; for (const r of UB.rings) for (const st of r.st) SN.push([r, st]);
  const atlas = canvasTex(512, 64 * SN.length, (c, w, h) => { SN.forEach(([r, st], q) => { const y = q * 64, name = st.name; c.fillStyle = "#1a1d22"; c.fillRect(0, y, w, 64); c.fillStyle = "#" + r.col.getHexString(); c.fillRect(0, y, 18, 64); c.fillRect(w - 18, y, 18, 64);
    c.fillStyle = "#f4f1e8"; c.textAlign = "center"; c.textBaseline = "middle"; let px = 34; c.font = "bold " + px + "px Arial, sans-serif"; while (c.measureText(name).width > w - 60 && px > 14) { px -= 2; c.font = "bold " + px + "px Arial, sans-serif"; } c.fillText(name, w / 2, y + 34); }); });
  atlas.wrapS = atlas.wrapT = THREE.ClampToEdgeWrapping; mats.schild = new THREE.MeshBasicMaterial({ map: atlas });
  SN.forEach(([r, st], q) => { const P = r.P, n = P.length, v0 = 1 - (q + 1) / SN.length, v1 = 1 - q / SN.length;
    for (const off of [-30, 0, 30]) { const k = (st.i + Math.round(off / r.ds) + n) % n, pa = P[(k - 1 + n) % n], pb = P[(k + 1) % n], l = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) || 1, ux = (pb[0] - pa[0]) / l, uz = (pb[1] - pa[1]) / l, hw = ubHW(r, k) - 0.05;
      for (const sd of [-1, 1]) { const cx = P[k][0] - uz * sd * hw, cz = P[k][1] + ux * sd * hw, y0 = UB.Y + 2.25, y1 = UB.Y + 3.0, nx = uz * sd, nz = -ux * sd;   // Normale zur Tunnelmitte
        const A = [cx - ux * 3, cz - uz * 3], Bq = [cx + ux * 3, cz + uz * 3], [L0, R0] = (ux * nz - uz * nx) > 0 ? [A, Bq] : [Bq, A];   // Schrift von innen lesbar
        gbvQuad(B("schild"), [L0[0], y0, L0[1]], [R0[0], y0, R0[1]], [R0[0], y1, R0[1]], [L0[0], y1, L0[1]], [nx, 0, nz], [[0, v0], [1, v0], [1, v1], [0, v1]]); } } });
  yield;
  for (const [key, o] of out) { if (!o.p.length) continue; const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2));
    if (o.c.length) g.setAttribute("color", new THREE.Float32BufferAttribute(o.c, 3));
    const m = new THREE.Mesh(g, mats[key]); m.name = "U-Bahn " + key; m.receiveShadow = false; m.castShadow = false; grp.add(m); yield; }
  // Raster der Tunnelflaeche (8 m, mit 6 m Rand) fuer die Gelaende-Schuerzen (gotham-raster.js); danach alle Gotham-Rasterbloecke neu bauen (im Kachel-Budget)
  UB.under = new Set(); for (const r of UB.rings) for (let i = 0; i < r.P.length; i++) { const h = ubHW(r, i) + 6, [x, z] = r.P[i]; for (let a = -h; a <= h; a += 4) for (let b = -h; b <= h; b += 4) UB.under.add(Math.floor((x + a) / 8) * 100000 + Math.floor((z + b) / 8)); }
  if (typeof GR !== "undefined") for (const b of GR.blocks) if (b.mesh) b.S = 0;
  UB.grp = grp; scene.add(grp); UNDERGROUND.push(grp); grp.visible = typeof ugVis === "boolean" ? ugVis : false;
  yield* ubEntrances();
  ubTrainsInit();
}
// Aufzug-Pavillons: oben auf dem Gehsteig (naechster freier Gehsteigpunkt zur Station), unten am Bahnsteigende; Rechtsklick faehrt (Teleport mit Meldung).
// Alle Pavillons oben zusammen in wenigen Netzen (Glas, Rahmen, U-Schild je Ringfarbe ueber Vertexfarben), ebenso unten; je Station ein unsichtbarer Klickkasten.
function* ubEntrances() {
  const glas = new THREE.MeshStandardMaterial({ color: 0x9fb8c9, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.55 }), rahmen = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.6, metalness: 0.4 });
  const uTex = canvasTex(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "bold 92px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("U", w / 2, h / 2 + 6); });   // weisses U, Rest durchsichtig
  const schild = new THREE.MeshBasicMaterial({ vertexColors: true }), ubuch = new THREE.MeshBasicMaterial({ map: uTex, alphaTest: 0.5 }), PM = { glas, rahmen, schild, ubuch }, hitM = new THREE.MeshBasicMaterial({ visible: false });
  const top = new Map(), bot = new Map();
  const pav = (out, x, y, z, col) => { const f = gbvFrame({ P0: [x, z], e1: [1, 0], e2: [0, 1], L1: 1, L2: 1 });
    gbvBox(out, "glas", f, 0, 0, 3, 3, y, y + 2.8); gbvBox(out, "rahmen", f, 0, 0, 3.2, 3.2, y + 2.8, y + 3.0, null, true, true); gbvBox(out, "rahmen", f, 0, 0, 0.15, 0.15, y + 3.0, y + 3.25);
    for (const [a, b] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) gbvBox(out, "rahmen", f, a, b, 0.12, 0.12, y, y + 2.8);
    const o = gbvBucket(out, "schild"), c = [col.r, col.g, col.b]; for (const [nx, nz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const cx = x + nx * 1.62, cz = z + nz * 1.62, ux = -nz, uz = nx, yy = y + 3.05;
      gbvQuad(o, [cx - ux * 0.45, yy, cz - uz * 0.45], [cx + ux * 0.45, yy, cz + uz * 0.45], [cx + ux * 0.45, yy + 0.9, cz + uz * 0.45], [cx - ux * 0.45, yy + 0.9, cz - uz * 0.45], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c);
      const q = 0.02, [L0, R0] = [[cx - ux * 0.45 + nx * q, cz - uz * 0.45 + nz * q], [cx + ux * 0.45 + nx * q, cz + uz * 0.45 + nz * q]];   // U davor (Lesrichtung von aussen)
      gbvQuad(gbvBucket(out, "ubuch"), [L0[0], yy, L0[1]], [R0[0], yy, R0[1]], [R0[0], yy + 0.9, R0[1]], [L0[0], yy + 0.9, L0[1]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]]); } };
  const hit = (parent, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.4, 3.2), hitM); m.position.set(x, y + 1.7, z); parent.add(m); return m; };
  for (const st of UB.stations) { const r = st.rings[0], P = r.P, k = st.i ?? 0, c = st.cross || P[k];
    // Gehsteigpunkt in der Naehe (Proben auf Strassen im Umkreis 220 m, Mitte des Gehsteigs, nicht an der Fahrbahn, nicht in Gebaeude/Baustelle)
    let best = null, bd = 1e9;
    for (const rd of GSTR.roads) { const Q = rd.pts; for (let i = 0; i < Q.length - 1; i++) { const [ax, az] = Q[i], [bx, bz] = Q[i + 1], Ln = Math.hypot(bx - ax, bz - az); if (!Ln) continue; const ux = (bx - ax) / Ln, uz = (bz - az) / Ln;
      for (let s = 0; s < Ln; s += 6) { const x0 = ax + ux * s, z0 = az + uz * s; if (Math.abs(x0 - c[0]) > 220 || Math.abs(z0 - c[1]) > 220) continue;
        for (const sd of [-1, 1]) { const off = rd.w / 2 + rd.walk * 0.55, x = x0 - uz * sd * off, z = z0 + ux * sd * off, d = Math.hypot(x - c[0], z - c[1]);
          if (d < bd && GSTR.walkAt(x, z) && !GSTR.onRoad(x, z, 1.8) && !bautAt(x, GOT.STR + 1, z)) { bd = d; best = [x, z]; } } } } }
    if (!best) continue;
    const n = P.length, kk = (k + Math.round(40 / r.ds)) % n, toP = P[(k + n - Math.round(4 / r.ds)) % n];
    pav(top, best[0], GOT.STR + GSTR.RAISE, best[1], r.col); pav(bot, P[kk][0], UB.Y, P[kk][1], r.col);
    st.up = best; st.down = [P[kk][0], P[kk][1]];
    const hu = hit(scene, best[0], GOT.STR, best[1]), hd = hit(UB.grp, P[kk][0], UB.Y, P[kk][1]), lines = st.rings.map(q => q.name).join(" / ");
    const near = p => Math.hypot(player.pos.x - p[0], player.pos.z - p[1]) < 6;
    gates.push({ name: "U-Bahn " + st.name, g: hu, call: () => { if (!near(best)) return toast("Zu weit vom Aufzug entfernt"); teleportToPoint({ x: toP[0], y: UB.Y, z: toP[1] }); toast("U-Bahn " + st.name + " (" + lines + ")"); }, verbs: ["hinunter", "hinunter"], a: best, b: best });
    gates.push({ name: "U-Bahn " + st.name + " Ausgang", g: hd, call: () => { if (!near(st.down)) return toast("Zu weit vom Aufzug entfernt"); teleportToPoint({ x: best[0] + 2.5, y: GOT.STR + 1, z: best[1] }); toast("Ausgang " + st.name); }, verbs: ["hinauf", "hinauf"], a: st.down, b: st.down });
    yield; }
  for (const [map, parent] of [[top, scene], [bot, UB.grp]]) for (const [key, o] of map) { const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2)); if (o.c.length) g.setAttribute("color", new THREE.Float32BufferAttribute(o.c, 3));
    const m = new THREE.Mesh(g, PM[key]); m.name = "U-Bahn Pavillons " + key; m.castShadow = parent === scene; m.userData.keep = true; m.userData.noLift = true; parent.add(m); }
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (UB.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = ubGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { UB.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
const ubUnder = (x, z) => !!UB.under && UB.under.has(Math.floor(x / 8) * 100000 + Math.floor(z / 8));
function ubBuild() { for (const _ of ubGen()); UB.done = true; }   // Tests

// ---- Teil B: fahrende Zuege (je Ring 2 je Richtung, 3 Wagen a 16 m), halten 20 s an jeder Station; alle Wagen in zwei InstancedMesh (Kasten, Farbband) ----
// Rechtsverkehr: Richtung +1 faehrt auf dem Gleis rechts der Fahrtrichtung. Nur Optik (keine Kollision, noch kein Mitfahren: OFFENE-FRAGEN 8).
UB.trains = []; UB.CAR = 16, UB.GAP = 0.6, UB.VMAX = 16, UB.ACC = 1.1, UB.DWELL = 20;
function ubTrainsInit() {
  const tex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = "#c9ccd0"; c.fillRect(0, 0, w, h); c.fillStyle = "#1d2630";   // Seite: Fensterband, Tueren
    for (let x = 8; x < w - 8; x += 31) c.fillRect(x, 14, 24, 20); c.fillStyle = "#5c6168"; for (const x of [60, 186]) c.fillRect(x - 10, 10, 20, 46); c.fillStyle = "#9da2a8"; c.fillRect(0, h - 6, w, 6); });
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(UB.CAR - UB.GAP, 3.3, 2.8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.3, emissive: 0x222326, emissiveIntensity: 1 }), 64);
  const band = new THREE.InstancedMesh(new THREE.BoxGeometry(UB.CAR - UB.GAP + 0.04, 0.35, 2.86), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, emissive: 0x333333, emissiveIntensity: 1 }), 64);
  for (const m of [body, band]) { m.count = 0; m.frustumCulled = false; m.userData.keep = true; m.userData.noLift = true; UB.grp.add(m); }
  body.name = "U-Bahn Zuege"; band.name = "U-Bahn Zuege Farbband"; UB.inst = { body, band };
  for (const r of UB.rings) { const stS = r.st.map(s => s.i * r.ds).sort((a, b) => a - b);
    for (const d of [1, -1]) for (let k = 0; k < 2; k++) { const s0 = stS[Math.floor(k * stS.length / 2)];
      UB.trains.push({ r, d, s: s0, v: 0, wait: k * 9 + (d > 0 ? 0 : 5), stS, next: null }); } }
  let n = 0; for (const t of UB.trains) for (let c = 0; c < 3; c++) band.setColorAt(n++, t.r.col);
  UB.parked = n; const Dp = UB.depot, gray = new THREE.Color(0x777777);   // abgestellte Zuege (ausser Betrieb, graues Band) je Hallengleis ein Zug
  for (const [s0, s1] of Dp.tracks || []) { const L = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]), ux = (s1[0] - s0[0]) / L, uz = (s1[1] - s0[1]) / L, yaw = Math.atan2(-uz, ux);
    for (let c = 0; c < 3; c++) { const t = L / 2 + (c - 1) * UB.CAR; ubQ.setFromEuler(ubE.set(0, yaw, 0)); ubV.set(s0[0] + ux * t, UB.BED + 0.35 + 1.65, s0[1] + uz * t); ubM.compose(ubV, ubQ, ubS); body.setMatrixAt(n, ubM); ubV.y = UB.BED + 0.35 + 0.9; ubM.compose(ubV, ubQ, ubS); band.setMatrixAt(n, ubM); band.setColorAt(n, gray); n++; } }
  band.instanceColor.needsUpdate = true; body.count = band.count = n; UB.last = performance.now();
}
// Lage auf dem Ring: s (m) -> Punkt auf dem Gleis der Richtung d, Blickwinkel
const ubM = new THREE.Matrix4(), ubQ = new THREE.Quaternion(), ubE = new THREE.Euler(), ubV = new THREE.Vector3(), ubS = new THREE.Vector3(1, 1, 1);
function ubPose(r, s, d) {
  const n = r.P.length, L = n * r.ds, u = ((s % L) + L) % L / r.ds, i = Math.floor(u) % n, f = u - Math.floor(u), a = r.P[i], b = r.P[(i + 1) % n];
  const ux = b[0] - a[0], uz = b[1] - a[1], l = Math.hypot(ux, uz) || 1, nx = -uz / l, nz = ux / l, off = -d * (ubTrack(r, i) * (1 - f) + ubTrack(r, (i + 1) % n) * f);
  return { x: a[0] + ux * f + nx * off, z: a[1] + uz * f + nz * off, yaw: Math.atan2(-uz, ux) };   // Drehung, die die lokale x-Achse (Wagenlaenge) auf die Fahrtrichtung legt
}
function ubTrainStep() {
  if (!UB.inst) return; const now = performance.now(), dt = Math.min(0.1, (now - UB.last) / 1000); UB.last = now;
  for (const t of UB.trains) { const L = t.r.P.length * t.r.ds;
    if (t.wait > 0) { t.wait -= dt; continue; }
    if (t.next === null) { const cur = ((t.s % L) + L) % L; let best = null, bd = 1e9; for (const ss of t.stS) { let dd = t.d > 0 ? ss - cur : cur - ss; if (dd < 5) dd += L; if (dd < bd) { bd = dd; best = ss; } } t.next = best; }
    const cur = ((t.s % L) + L) % L; let dist = t.d > 0 ? t.next - cur : cur - t.next; if (dist < 0) dist += L;
    t.v = Math.min(UB.VMAX, t.v + UB.ACC * dt, Math.sqrt(2 * UB.ACC * Math.max(0, dist)));
    const step = Math.min(dist, t.v * dt); t.s += t.d * step;
    if (dist - step < 0.05) { t.s = t.d > 0 ? t.next : t.next; t.v = 0; t.wait = UB.DWELL; t.next = null; } }
  if (!UB.grp.visible) return;   // Matrizen nur, wenn man unten ist
  let n = 0; const { body, band } = UB.inst;
  for (const t of UB.trains) for (let c = 0; c < 3; c++) { const p = ubPose(t.r, t.s - t.d * (c * UB.CAR + UB.CAR / 2), t.d);
    ubQ.setFromEuler(ubE.set(0, p.yaw, 0)); ubV.set(p.x, UB.BED + 0.35 + 1.65, p.z); ubM.compose(ubV, ubQ, ubS); body.setMatrixAt(n, ubM);
    ubV.y = UB.BED + 0.35 + 0.9; ubM.compose(ubV, ubQ, ubS); band.setMatrixAt(n, ubM); n++; }
  body.instanceMatrix.needsUpdate = band.instanceMatrix.needsUpdate = true;
}
