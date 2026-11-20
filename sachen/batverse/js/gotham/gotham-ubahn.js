// Batverse – Gotham: U-Bahn, vier Ringlinien (V1, Nicolas 2026-11-12/16; PLAN-GOTHAM V1, Daten GOTHAM.ubahn in gotham/daten.js)
// Klassisches Skript nach gotham-gassen.js. Bahnsteig 11 m unter der Strasse (Ebene Tiefgarage 2), Gleisbett 1,1 m darunter.
// Je Ring ein Tunnel mit zwei Gleisen (beide Richtungen, Vorbild Yamanote-Linie), an Stationen mit Mittelbahnsteig (8 m), an den Kreuzungen zweier Ringe
// Umsteigestationen (Gleise kreuzen auf gleicher Hoehe, OFFENE-FRAGEN 9). Raeume unter der Erde ueber dkRoom/dkAdd (kern/drehkoll.js): Boden, Waende
// (ausserhalb des Raums gilt das Gelaende = Wand) und Kamera ohne eigene Regeln in groundAt. Netze in UNDERGROUND (nur sichtbar, wenn die Kamera unten ist).
// Zugang (OFFENE-FRAGEN 7, Nicolas 2026-11-20 "7 mit Treppe"): je Bahnsteig ein offener Treppenabgang neben dem Gehsteig, Gang im Zwischengeschoss, Treppe durch die Tunneldecke (ubTreppenPlan, ubEntrances).
// Zuege mit Fahrplan, Tueren und Verspaetung (Teil B unten); Mitfahren und Abfahrtsanzeigen in gotham-ubahn-fahrt.js (OFFENE-FRAGEN 8).
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
    const hc = GOT.toGame(D.x, D.z), ed = [0, 1, 2, 3].map(e => { const p = hall[e], q = hall[(e + 1) % 4], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], l = Math.hypot(q[0] - p[0], q[1] - p[1]), o = [m[0] - hc[0], m[1] - hc[1]], ol = Math.hypot(...o); return { m, l, o: [o[0] / ol, o[1] / ol] }; }),
      sh = Math.min(...ed.map(e => e.l)), gl = G[G.length - 1] || P0, door = ed.filter(e => e.l < sh + 1).sort((a, b) => Math.hypot(a.m[0] - gl[0], a.m[1] - gl[1]) - Math.hypot(b.m[0] - gl[0], b.m[1] - gl[1]))[0],
      Q = [P0, ...G.filter(p => !bautInPoly(hall, p[0], p[1]) && Math.hypot(p[0] - door.m[0], p[1] - door.m[1]) > 40), [door.m[0] + door.o[0] * 25, door.m[1] + door.o[1] * 25], door.m, hc], cv = new THREE.CatmullRomCurve3(Q.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal"), spur = cv.getSpacedPoints(Math.max(8, Math.round(cv.getLength() / 4))).map(v => [v.x, v.z]);   // als Kurve (an Ecken klafften sonst Keile ohne Wand/Boden/Decke)
    UB.depot = { spur, hall, hc, hw: 3.2 }; }
  const inSpur = (x, z, m = 0.3) => { const S = UB.depot.spur; for (let k = 0; k < S.length - 1; k++) { const [ax, az] = S[k], [bx, bz] = S[k + 1], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    if (Math.hypot(x - ax - dx * t, z - az - dz * t) < UB.depot.hw - m) return true; } return false; };
  const inHall = (x, z) => bautInPoly(UB.depot.hall, x, z);
  ubTreppenPlan(); yield;
  // Materialien
  const tile = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#d9d6cc"; c.fillRect(0, 0, w, h); c.strokeStyle = "#a9a59b"; c.lineWidth = 2; for (let x = 0; x <= w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
  const beton = canvasTex(128, 128, (c, w, h) => { const r = rng(311); c.fillStyle = "#6d6a64"; c.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${r() * 0.07})`; c.fillRect(r() * w, r() * h, 3, 3); } c.fillStyle = "rgba(0,0,0,.15)"; c.fillRect(0, h - 6, w, 6); });
  const bett = canvasTex(64, 128, (c, w, h) => { const r = rng(17); c.fillStyle = "#4b4640"; c.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(${r() < 0.5 ? "20,18,16" : "120,110,95"},${0.3 + r() * 0.3})`; c.fillRect(r() * w, r() * h, 2, 2); } c.fillStyle = "#3a2f25"; c.fillRect(0, 0, w, 22); c.fillRect(0, 64, w, 22); });   // Schwellen alle 0,6 m
  const M = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const mats = { wand: M({ map: beton, emissive: 0x2a2a28, emissiveIntensity: 1 }), decke: M({ color: 0x55534f, emissive: 0x1c1c1b, emissiveIntensity: 1 }), bett: M({ map: bett, emissive: 0x161412, emissiveIntensity: 1 }),
    schiene: M({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.35, emissive: 0x202224, emissiveIntensity: 1 }), kachel: M({ map: tile, emissive: 0x3a3934, emissiveIntensity: 1 }),
    bahnsteig: M({ color: 0xb5b0a4, emissive: 0x34322d, emissiveIntensity: 1 }), kante: M({ color: 0xe6c229, emissive: 0x3d3410, emissiveIntensity: 1 }),
    licht: new THREE.MeshBasicMaterial({ color: 0xfff3d6 }), farbe: M({ vertexColors: true, emissive: 0x111111, emissiveIntensity: 1 }) };
  // Stromausfall (N15, 2026-11-19): Lichtband aus, selbstleuchtende Flaechen fast dunkel; Kaesten auf den Bahnsteigen
  if (typeof lichtBereich === "function") lichtBereich("ubahn", { text: "in der U-Bahn", set(an) { for (const k in mats) if (k !== "licht") mats[k].emissiveIntensity = an ? 0.08 : 1; mats.licht.color.setHex(an ? 0x1a1a1a : 0xfff3d6); },
    drin(p) { return p.y > UB.BED - 1 && p.y < UB.Y + 4 && dkInRoom(p.x, p.y + 0.5, p.z); } });
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
      const loch = (r.holes || []).some(([a, b]) => (i >= a && i <= b) || (i + n >= a && i + n <= b));   // Oeffnung fuer die Treppe zum Zwischengeschoss (2,6 m breit)
      if (loch) { gbvQuad(B("decke"), W(p0, n0, -h0, ceil), W(p0, n0, -1.3, ceil), W(p1, n1, -1.3, ceil), W(p1, n1, -h1, ceil), [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]); gbvQuad(B("decke"), W(p0, n0, 1.3, ceil), W(p0, n0, h0, ceil), W(p1, n1, h1, ceil), W(p1, n1, 1.3, ceil), [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
      else gbvQuad(B("decke"), W(p0, n0, -h0, ceil), W(p0, n0, h0, ceil), W(p1, n1, h1, ceil), W(p1, n1, -h1, ceil), [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      if (i % 3 === 0 && !loch) gbvQuad(B("licht"), W(p0, n0, -0.3, ceil - 0.02), W(p0, n0, 0.3, ceil - 0.02), W(p1, n1, 0.3, ceil - 0.02), W(p1, n1, -0.3, ceil - 0.02), [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
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
    const NS = k => { const a = S[Math.max(0, k - 1)], b = S[Math.min(S.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; };   // Normale je Punkt (gemittelt)
    for (let k = 0; k < S.length - 1; k++) { const p0 = S[k], p1 = S[k + 1], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, ux = (p1[0] - p0[0]) / L, uz = (p1[1] - p0[1]) / L, nx = -uz, nz = ux, N0 = NS(k), N1 = NS(k + 1), W = (p, o, y) => { const q = p === p0 ? N0 : N1; return [p[0] + q[0] * o, y, p[1] + q[1] * o]; };
      if (inHall((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)) continue;
      gbvQuad(B("bett"), W(p0, -hw, BED), W(p1, -hw, BED), W(p1, hw, BED), W(p0, hw, BED), [0, 1, 0], [[0, k * L / 2.5], [0, (k + 1) * L / 2.5], [1.3, (k + 1) * L / 2.5], [1.3, k * L / 2.5]]);
      gbvQuad(B("decke"), W(p0, -hw, ceil), W(p0, hw, ceil), W(p1, hw, ceil), W(p1, -hw, ceil), [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (const sd of [-1, 1]) { const a = W(p0, sd * hw, 0), b = W(p1, sd * hw, 0); if (onRing((a[0] + b[0]) / 2, (a[2] + b[2]) / 2) || inHall((a[0] + b[0]) / 2, (a[2] + b[2]) / 2)) continue;
        gbvQuad(B("wand"), [a[0], BED, a[2]], [b[0], BED, b[2]], [b[0], ceil, b[2]], [a[0], ceil, a[2]], [-sd * nx, 0, -sd * nz], [[0, 0], [L / 2.5, 0], [L / 2.5, (ceil - BED) / 2.5], [0, (ceil - BED) / 2.5]]); }
      for (const rs of [-0.7175, 0.7175]) gbvQuad(B("schiene"), W(p0, rs - 0.04, BED + 0.18), W(p1, rs - 0.04, BED + 0.18), W(p1, rs + 0.04, BED + 0.18), W(p0, rs + 0.04, BED + 0.18), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      if (!onRing((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)) { dkRoom({ poly: [W(p0, -hw, 0), W(p1, -hw, 0), W(p1, hw, 0), W(p0, hw, 0)].map(q => [q[0], q[2]]), y0: BED - 0.3, y1: ceil });
        dkAdd({ cx: (p0[0] + p1[0]) / 2, cy: BED - 0.25, cz: (p0[1] + p1[1]) / 2, ux, uz, hl: L / 2 + 0.05, hw: hw - 0.3, hh: 0.25, m: 0, ceil: 0 }); } }
    // Halle: Rechteck aus den vier Ecken, drei Gleise laengs der laengeren Seite
    { const k = S.findIndex(p => inHall(p[0], p[1])); Dp.entry = S[Math.max(0, k)]; }   // Punkt, an dem das Gleis in die Halle tritt
    const Hh = Dp.hall, [A0, A1, A2, A3] = Hh, ceilH = BED + H + 1.5;
    gbvQuad(B("bett"), [A0[0], BED, A0[1]], [A1[0], BED, A1[1]], [A2[0], BED, A2[1]], [A3[0], BED, A3[1]], [0, 1, 0], [[0, 0], [24, 0], [24, 24], [0, 24]]);
    gbvQuad(B("decke"), [A0[0], ceilH, A0[1]], [A3[0], ceilH, A3[1]], [A2[0], ceilH, A2[1]], [A1[0], ceilH, A1[1]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const hcx = Dp.hc[0], hcz = Dp.hc[1];
    for (let e = 0; e < 4; e++) { const a = Hh[e], b = Hh[(e + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, nx = hcx - mx, nz = hcz - mz, nl = Math.hypot(nx, nz) || 1, steps = Math.ceil(L);   // 1-m-Stuecke: Einfahrt passt genau zur Zufahrt
      for (let q = 0; q < steps; q++) { const t0 = q / steps, t1 = (q + 1) / steps, x0 = a[0] + (b[0] - a[0]) * t0, z0 = a[1] + (b[1] - a[1]) * t0, x1 = a[0] + (b[0] - a[0]) * t1, z1 = a[1] + (b[1] - a[1]) * t1;
        if (Math.hypot((x0 + x1) / 2 - Dp.entry[0], (z0 + z1) / 2 - Dp.entry[1]) < hw - 0.2) continue;   // Einfahrt nur, wo das Gleis die Hallenwand kreuzt
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
// Treppen-Eingaenge (OFFENE-FRAGEN 7, Nicolas 2026-11-20: "7 mit Treppe"): je Bahnsteig (bei Umsteigestationen beide Ringe) ein offener Treppenabgang auf einem freien Streifen
// direkt hinter dem Gehsteig (Pflasterflaeche, Gelaende darunter ausgeschnitten: GR_HOLES), UBT.n1 Stufen hinunter ins Zwischengeschoss (UBT.M, 0,4 m ueber der Tunneldecke),
// Gang 2,6 m breit und 3 m hoch bis ueber den Bahnsteig, dort UBT.n2 Stufen durch eine Oeffnung der Tunneldecke auf den Mittelbahnsteig (14-22 m hinter der Stationsmitte).
// Stufen ca. 18 cm, Auftritt 30 cm. Begehbar: Raeume (dkRoom), Boden als geneigte Stuecke zu 0,4 m (dkAdd g; ein langes geneigtes Stueck wirkt seitlich als Wand), Gelaender und
// Treppenwangen als Waende. Oben ein Mast mit U in der Ringfarbe und dem Stationsnamen, unten "Ausgang". Kanaele weichen den Raeumen aus (gotham-kanal.js prueft dkInRoom).
const UBT = { RUN: 0.3, list: [], segs: [] };
const ubSegD = (x, z, q) => { const [ax, az, bx, bz] = q, dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
function ubRingAt(r, s) { const n = r.P.length, L = n * r.ds, u = (((s % L) + L) % L) / r.ds, i = Math.floor(u) % n, f = u - Math.floor(u), a = r.P[i], b = r.P[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (b[0] - a[0]) / l, (b[1] - a[1]) / l]; }
function ubTreppenPlan() {
  const YT = GOT.STR + GSTR.RAISE, M = UB.BED + UB.H + 0.4, n1 = Math.ceil((YT - M) / 0.185), Lf = n1 * UBT.RUN, n2 = Math.ceil((M - UB.Y) / 0.185), L2 = n2 * UBT.RUN;
  Object.assign(UBT, { YT, M, n1, Lf, n2, L2 });
  const dg = (x, z, rr) => typeof gdeckNear === "function" && !!gdeckNear(x, z, rr), tief = (x, z) => !bautAt(x, M + 1.5, z) && !dkInRoom(x, M + 1.5, z);
  const frei = (x, z) => !GSTR.onRoad(x, z, 0.3) && !GSTR.walkAt(x, z) && !bautAt(x, GOT.STR + 1, z) && !dg(x, z, 8) && tief(x, z);
  for (const r of UB.rings) { r.holes = []; for (const e of r.st) { const sb = e.i * r.ds + 14, stp = sb + L2, C = ubRingAt(r, stp + 6); let best = null, bd = 1e9;
    for (const relax of [0, 1]) { if (best) break; const RB = relax ? 2.8 : 4, RW = relax ? 450 : 260;   // zweiter Lauf: naeher an anderen Gaengen, weiter weg (Bahnsteige ohne freien Platz in der Naehe)
    for (const rd of GSTR.roads) { const Q = rd.pts; for (let i = 0; i < Q.length - 1; i++) { const [ax, az] = Q[i], [bx, bz] = Q[i + 1], Ln = Math.hypot(bx - ax, bz - az); if (!Ln) continue; const vx = (bx - ax) / Ln, vz = (bz - az) / Ln;
      for (let q = 0; q < Ln; q += 4) { const x0 = ax + vx * q, z0 = az + vz * q; if (Math.abs(x0 - C[0]) > RW || Math.abs(z0 - C[1]) > RW) continue;
        for (const sd of [-1, 1]) for (const sg of [-1, 1]) { const nx = -vz * sd, nz = vx * sd, ux = vx * sg, uz = vz * sg, o = rd.w / 2 + rd.walk + 2.2, ox = x0 + nx * o, oz = z0 + nz * o;
          const Ax = ox + ux * (Lf + 1.6), Az = oz + uz * (Lf + 1.6), d = Math.hypot(Ax - C[0], Az - C[1]); if (d >= bd || UBT.list.some(T => Math.hypot(T.O[0] - ox, T.O[1] - oz) < 20)) continue; let ok = true;
          for (let a = -2; a <= Lf + 2.4 && ok; a += 1) for (const b of [-2.2, -1.1, 0, 1.1, 2.0]) { if (!frei(ox + ux * a + nx * b, oz + uz * a + nz * b)) { ok = false; break; } }
          for (let k = 0, K = Math.max(1, Math.ceil(d / 3)); k <= K && ok; k++) { const x = Ax + (C[0] - Ax) * k / K, z = Az + (C[1] - Az) * k / K; if (dg(x, z, 6) || !tief(x, z)) ok = false; }
          const loc = (x, z) => [(x - ox) * ux + (z - oz) * uz, (x - ox) * nx + (z - oz) * nz];   // Gang nicht unter die eigene Treppe zurueck, Bahnsteig-Treppe nicht unter dem Abgang
          for (let k = 1, K = Math.max(1, Math.ceil(d / 1.5)); k <= K && ok; k++) { const [ls, lt] = loc(Ax + (C[0] - Ax) * k / K, Az + (C[1] - Az) * k / K); if (ls < Lf + 0.5 && Math.abs(lt) < 3.2) ok = false; }
          const belegt = (x, z) => UBT.segs.some(g => ubSegD(x, z, g) < RB);
          { const S0 = ubRingAt(r, sb - 3), S1 = ubRingAt(r, stp + 1), own = [S0[0], S0[1], S1[0], S1[1]];   // Gang nicht ueber die eigene Bahnsteig-Treppe
            for (let k = 0, K = Math.max(1, Math.ceil(d / 1.5)); k <= K && ok; k++) { const x = Ax + (C[0] - Ax) * k / K, z = Az + (C[1] - Az) * k / K; if (Math.hypot(x - C[0], z - C[1]) > 2 && ubSegD(x, z, own) < 3.5) ok = false; } }   // andere Gaenge, Abgaenge und Bahnsteig-Treppen
          for (let k = 0, K = Math.max(1, Math.ceil(d / 1.5)); k <= K && ok; k++) if (belegt(Ax + (C[0] - Ax) * k / K, Az + (C[1] - Az) * k / K)) ok = false;
          for (let a = -2; a <= Lf + 2 && ok; a += 2) if (belegt(ox + ux * a, oz + uz * a)) ok = false;
          for (let q = -3; q <= L2 + 8 && ok; q += 1) { if (belegt(...ubRingAt(r, sb + q).slice(0, 2))) { ok = false; break; } const P = ubRingAt(r, sb + q), [ls, lt] = loc(P[0], P[1]); if (ls > -3 && ls < Lf + 4 && Math.abs(lt) < 4.5) ok = false; }
          if (ok) { bd = d; best = { O: [ox, oz], u: [ux, uz], n: [nx, nz] }; } } } } } }
    if (!best) continue;
    const ia = Math.floor((sb + 2.5) / r.ds), ib = Math.floor((stp + 0.5) / r.ds); r.holes.push([ia, ib]);
    const T = { r, e, sb, stp, ia, ib, ...best, C: [C[0], C[1]] }; UBT.list.push(T); e.treppe = T;
    { const [ox, oz] = T.O, [ux, uz] = T.u, A = [ox + ux * (Lf + 1.6), oz + uz * (Lf + 1.6)], B = ubRingAt(r, stp), P3 = ubRingAt(r, sb - 3); UBT.segs.push([ox - ux * 2, oz - uz * 2, A[0], A[1]], [A[0], A[1], C[0], C[1]], [C[0], C[1], B[0], B[1]], [P3[0], P3[1], C[0], C[1]]); }
    const f = gbvFrame({ P0: T.O, e1: T.u, e2: T.n, L1: 1, L2: 1 }), RQ = (s0, s1, t0, t1) => [f.W(s0, t0, 0), f.W(s1, t0, 0), f.W(s1, t1, 0), f.W(s0, t1, 0)].map(q => [q[0], q[2]]);
    if (typeof GR_HOLES !== "undefined") { GR_HOLES.push(RQ(-2, Lf + 2.4, -2.2, 2.0)); GR_NOSKIRT.push(RQ(-3, Lf + 4, -3, 3)); }
    if (typeof UG_PORTALS !== "undefined") { const c = f.W(Lf / 2, 0, 0); UG_PORTALS.push([c[0], c[2]]); } } }
}
function* ubEntrances() {
  const { YT, M, n1, Lf, n2, L2, RUN } = UBT, Y = UB.Y, W2 = 1.3, CEIL = UB.BED + UB.H, DS = THREE.DoubleSide;
  const tile = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#e4e1d6"; c.fillRect(0, 0, w, h); c.strokeStyle = "#aaa69b"; c.lineWidth = 2; for (let x = 0; x <= w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.fillStyle = "#2b5a8a"; c.fillRect(0, h - 10, w, 6); });
  const pfl = canvasTex(128, 128, (c, w, h) => { const q = rng(77); c.fillStyle = "#8d8a84"; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 * 16; x < w + 32; x += 32) { c.fillStyle = "rgb(" + (130 + q() * 30 | 0) + "," + (127 + q() * 28 | 0) + "," + (120 + q() * 26 | 0) + ")"; c.fillRect(x + 1, y + 1, 30, 30); } });
  tile.wrapS = tile.wrapT = pfl.wrapS = pfl.wrapT = THREE.RepeatWrapping;
  const aus = canvasTex(256, 64, (c, w, h) => { c.fillStyle = "#14366b"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "bold 34px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("\u2191 Ausgang", w / 2, h / 2 + 2); });
  const uTex = canvasTex(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "bold 92px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("U", w / 2, h / 2 + 6); });
  const L = UBT.list, nameTex = canvasTex(512, 48 * Math.max(1, L.length), (c, w, h) => { L.forEach((T, q) => { const y = q * 48; c.fillStyle = "#1a1d22"; c.fillRect(0, y, w, 48); c.fillStyle = "#" + T.r.col.getHexString(); c.fillRect(0, y, 14, 48);
    c.fillStyle = "#f4f1e8"; c.textAlign = "center"; c.textBaseline = "middle"; let px = 30; c.font = "bold " + px + "px Arial, sans-serif"; const nm = T.e.name.replace(/^Umsteigen /, ""); while (c.measureText(nm).width > w - 40 && px > 12) { px -= 2; c.font = "bold " + px + "px Arial, sans-serif"; } c.fillText(nm, w / 2 + 7, y + 25); }); });
  nameTex.wrapS = nameTex.wrapT = THREE.ClampToEdgeWrapping;
  const Mt = o => new THREE.MeshStandardMaterial({ roughness: 0.8, side: DS, ...o });
  const TM = UBT.mats = { kachel: Mt({ map: tile, emissive: 0x3a3934, emissiveIntensity: 1 }), boden: Mt({ color: 0xb5b0a4, emissive: 0x34322d, emissiveIntensity: 1 }), stufe: Mt({ color: 0x9a968e, emissive: 0x2e2d2a, emissiveIntensity: 1 }),
    kante: Mt({ color: 0xe6c229, emissive: 0x3d3410, emissiveIntensity: 1 }), decke: Mt({ color: 0x5a5853, emissive: 0x1f1e1d, emissiveIntensity: 1 }), metall: Mt({ color: 0x3a3f45, metalness: 0.5, roughness: 0.4, emissive: 0x111214, emissiveIntensity: 1 }),
    pflaster: Mt({ map: pfl }), farbe: Mt({ vertexColors: true, emissive: 0x222222, emissiveIntensity: 1 }), licht: new THREE.MeshBasicMaterial({ color: 0xfff3d6, side: DS }), ausgang: new THREE.MeshBasicMaterial({ map: aus, side: DS }),
    rasen: typeof GR !== "undefined" ? Object.assign(GR.mat.clone(), { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }) : Mt({ color: 0x4f7a3a }),
    ubuch: new THREE.MeshBasicMaterial({ map: uTex, alphaTest: 0.5, side: DS }), name: new THREE.MeshBasicMaterial({ map: nameTex, side: DS }) };
  if (typeof LICHT_AUS !== "undefined" && LICHT_AUS.B.ubahn) { const B0 = LICHT_AUS.B.ubahn, set0 = B0.set; B0.set = an => { set0(an); for (const k of ["kachel", "boden", "stufe", "kante", "decke", "metall", "farbe"]) TM[k].emissiveIntensity = an ? 0.08 : 1; TM.licht.color.setHex(an ? 0x1a1a1a : 0xfff3d6); }; }   // Stromausfall gilt auch hier
  const top = new Map(), bot = new Map(), Q = (o, k, a, b, c, d, nn, uv) => gbvQuad(gbvBucket(o, k), a, b, c, d, nn, uv || [[0, 0], [1, 0], [1, 1], [0, 1]]), uvM = (l, h) => [[0, 0], [l / 2, 0], [l / 2, h / 2], [0, h / 2]];
  const plate = (o, key, cx, cz, y0, y1, w, vx, vz, uv) => { const rx = -vz, rz = vx; Q(o, key, [cx - rx * w / 2, y0, cz - rz * w / 2], [cx + rx * w / 2, y0, cz + rz * w / 2], [cx + rx * w / 2, y1, cz + rz * w / 2], [cx - rx * w / 2, y1, cz - rz * w / 2], [-vx, 0, -vz], uv); };   // lesbar fuer jemanden, der in (vx, vz) schaut
  const flat = (c, ux, uz, hl, hw, ty) => dkAdd({ cx: c[0], cy: ty - 0.25, cz: c[2], ux, uz, hl, hw, hh: 0.25, m: 0, ceil: 0 });
  const wand = (c, ux, uz, hl, hw, y0, y1) => dkAdd({ cx: c[0], cy: (y0 + y1) / 2, cz: c[2], ux, uz, hl, hw, hh: (y1 - y0) / 2, floor: 0, m: 0.1 });
  const rampe = (f, s0, s1, y0, y1, ux, uz) => { const g = (y1 - y0) / (s1 - s0); for (let q = s0; q < s1 - 1e-6; q += 0.4) { const e = Math.min(s1, q + 0.4), c = f.W((q + e) / 2, 0, 0), ty = y0 + g * ((q + e) / 2 - s0); dkAdd({ cx: c[0], cz: c[2], cy: ty - 0.15, ux, uz, hl: (e - q) / 2 + 0.02, hw: W2, hh: 0.15, g, m: 0, ceil: 0 }); } };
  // Gang als Linienzug mit Gehrung: Boden, Decke, Waende, Lichtband; Raum und Boden je Stueck
  const gang = (o, P, y0, H) => { const N = P.length, nrm = k => { const a = P[Math.max(0, k)], b = P[Math.min(N - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; };
    const off = (i, sg) => { let [nx, nz] = i === 0 ? nrm(0) : i === N - 1 ? nrm(N - 2) : (() => { const p1 = nrm(i - 1), p2 = nrm(i); return [p1[0] + p2[0], p1[1] + p2[1]]; })(); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
      let m = 1; if (i > 0 && i < N - 1) { const q = nrm(i - 1); m = 1 / Math.max(0.35, nx * q[0] + nz * q[1]); } return [P[i][0] + nx * W2 * m * sg, P[i][1] + nz * W2 * m * sg]; };
    for (let k = 0; k < N - 1; k++) { const L0 = off(k, 1), L1 = off(k + 1, 1), R0 = off(k, -1), R1 = off(k + 1, -1), [nx, nz] = nrm(k), a = P[k], b = P[k + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.01) continue; const ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len;
      Q(o, "boden", [L0[0], y0, L0[1]], [L1[0], y0, L1[1]], [R1[0], y0, R1[1]], [R0[0], y0, R0[1]], [0, 1, 0], uvM(len, 2 * W2));
      Q(o, "decke", [L0[0], y0 + H, L0[1]], [L1[0], y0 + H, L1[1]], [R1[0], y0 + H, R1[1]], [R0[0], y0 + H, R0[1]], [0, -1, 0]);
      Q(o, "kachel", [L0[0], y0, L0[1]], [L1[0], y0, L1[1]], [L1[0], y0 + H, L1[1]], [L0[0], y0 + H, L0[1]], [-nx, 0, -nz], uvM(len, H));
      Q(o, "kachel", [R0[0], y0, R0[1]], [R1[0], y0, R1[1]], [R1[0], y0 + H, R1[1]], [R0[0], y0 + H, R0[1]], [nx, 0, nz], uvM(len, H));
      if (len > 2) Q(o, "licht", [a[0] + ux - nx * 0.25, y0 + H - 0.02, a[1] + uz - nz * 0.25], [b[0] - ux - nx * 0.25, y0 + H - 0.02, b[1] - uz - nz * 0.25], [b[0] - ux + nx * 0.25, y0 + H - 0.02, b[1] - uz + nz * 0.25], [a[0] + ux + nx * 0.25, y0 + H - 0.02, a[1] + uz + nz * 0.25], [0, -1, 0]);
      dkRoom({ poly: [L0, L1, R1, R0], y0: y0 - 0.3, y1: y0 + H }); { const e0 = k > 0 ? 0.3 : 0, e1 = k < N - 2 ? 0.3 : 0, mid = (len + e1 - e0) / 2;   // nur an inneren Knicken ueberlappen (an den Enden laege der Gangboden ueber der Treppe)
        dkAdd({ cx: a[0] + ux * mid, cy: y0 - 0.25, cz: a[1] + uz * mid, ux, uz, hl: (len + e0 + e1) / 2, hw: W2, hh: 0.25, m: 0, ceil: 0 }); }
      if (typeof GR_NOSKIRT !== "undefined") GR_NOSKIRT.push([[L0[0] - nx * 2, L0[1] - nz * 2], [L1[0] - nx * 2, L1[1] - nz * 2], [R1[0] + nx * 2, R1[1] + nz * 2], [R0[0] + nx * 2, R0[1] + nz * 2]]); } };
  UBT.list.forEach((T, q) => { const r = T.r, col = [r.col.r, r.col.g, r.col.b], f = gbvFrame({ P0: T.O, e1: T.u, e2: T.n, L1: 1, L2: 1 }), [ux, uz] = T.u, [nx, nz] = T.n, rise1 = (YT - M) / n1;
    // oben: Pflasterflaeche um die Oeffnung (begehbar), Stufen, Treppenwaende, Abdeckstein und Gelaender, Wand ueber dem Gang, Mast mit U und Name
    for (const [s0, s1, t0, t1] of [[-2, Lf + 2.4, -2.2, -W2], [-2, Lf + 2.4, W2, 2.0], [-2, 0, -W2, W2], [Lf, Lf + 2.4, -W2, W2]]) { Q(top, "pflaster", f.W(s0, t0, YT + 0.01), f.W(s1, t0, YT + 0.01), f.W(s1, t1, YT + 0.01), f.W(s0, t1, YT + 0.01), [0, 1, 0], uvM(s1 - s0, t1 - t0)); flat(f.W((s0 + s1) / 2, (t0 + t1) / 2, 0), ux, uz, (s1 - s0) / 2, (t1 - t0) / 2, YT); }
    // Rasenflicken mit dem Gelaende-Material um die Pflasterflaeche: das Raster schneidet ganze Dreiecke (bis ca. 4 m ueber den Ausschnitt hinaus) heraus
    if (typeof grColor === "function") { const cc = new THREE.Color(), yr = GOT.STR + 0.01; for (const [s0, s1, t0, t1] of [[-6.5, Lf + 6.5, -2.2, -W2], [-6.5, Lf + 6.5, W2, 6.5], [-6.5, 0, -W2, W2], [Lf, Lf + 6.5, -W2, W2]]) { const P4 = [f.W(s0, t0, yr), f.W(s1, t0, yr), f.W(s1, t1, yr), f.W(s0, t1, yr)];
      grColor((P4[0][0] + P4[2][0]) / 2, GOT.STR, (P4[0][2] + P4[2][2]) / 2, 1, cc); Q(top, "rasen", ...P4, [0, 1, 0], P4.map(q => [q[0] / 10, -q[2] / 10])); const o = gbvBucket(top, "rasen"); while (o.c.length < o.p.length) o.c.push(cc.r, cc.g, cc.b); } }
    for (let j = 0; j < n1; j++) { const y = YT - (j + 1) * rise1; gbvBox(top, "stufe", f, (j + 0.5) * RUN, 0, RUN, 2 * W2, y - 0.3, y); gbvBox(top, "kante", f, j * RUN + 0.04, 0, 0.06, 2 * W2 - 0.1, y, y + 0.006); }
    rampe(f, 0, Lf, YT, M, ux, uz);
    for (const sd of [-1, 1]) { Q(top, "kachel", f.W(0, sd * W2, M - 0.3), f.W(Lf, sd * W2, M - 0.3), f.W(Lf, sd * W2, YT), f.W(0, sd * W2, YT), f.dirW(0, -sd), uvM(Lf, YT - M));
      gbvBox(top, "stufe", f, Lf / 2, sd * (W2 + 0.15), Lf + 0.3, 0.3, YT - 0.05, YT + 0.12);
      for (let k = 0; k <= 6; k++) gbvBox(top, "metall", f, k * Lf / 6, sd * (W2 + 0.15), 0.06, 0.06, YT + 0.12, YT + 1.05);
      gbvBox(top, "metall", f, Lf / 2, sd * (W2 + 0.15), Lf + 0.06, 0.07, YT + 1.02, YT + 1.09); wand(f.W(Lf / 2, sd * (W2 + 0.15), 0), ux, uz, Lf / 2 + 0.1, 0.08, YT, YT + 1.1); }
    Q(top, "kachel", f.W(Lf, -W2, M + 3), f.W(Lf, W2, M + 3), f.W(Lf, W2, YT), f.W(Lf, -W2, YT), f.dirW(-1, 0), uvM(2 * W2, YT - M - 3));
    gbvBox(top, "stufe", f, Lf + 0.15, 0, 0.3, 2 * W2 + 0.6, YT - 0.05, YT + 0.12); gbvBox(top, "metall", f, Lf + 0.15, 0, 0.07, 2 * W2 + 0.3, YT + 1.02, YT + 1.09);
    for (const t of [-W2, 0, W2]) gbvBox(top, "metall", f, Lf + 0.15, t, 0.06, 0.06, YT + 0.12, YT + 1.05); wand(f.W(Lf + 0.15, 0, 0), nx, nz, W2 + 0.3, 0.08, YT, YT + 1.1);
    dkRoom({ poly: [f.W(-0.2, -W2, 0), f.W(Lf + 0.05, -W2, 0), f.W(Lf + 0.05, W2, 0), f.W(-0.2, W2, 0)].map(c => [c[0], c[2]]), y0: M - 0.3, y1: YT + 3 });
    { const ms = -1.2, mt = W2 + 0.55; gbvBox(top, "metall", f, ms, mt, 0.12, 0.12, YT, YT + 3.5); gbvBox(top, "farbe", f, ms, mt, 0.9, 0.1, YT + 2.6, YT + 3.5, col); wand(f.W(ms, mt, 0), ux, uz, 0.1, 0.1, YT, YT + 2.5);
      const c = f.W(ms, mt, 0), v0 = 1 - (q + 1) / L.length, v1 = 1 - q / L.length;
      for (const sg of [1, -1]) { const vx = nx * sg, vz = nz * sg, cx = c[0] - vx * 0.06, cz = c[2] - vz * 0.06; plate(top, "ubuch", cx, cz, YT + 2.6, YT + 3.5, 0.9, vx, vz); plate(top, "name", cx, cz, YT + 2.15, YT + 2.5, 1.9, vx, vz, [[0, v0], [1, v0], [1, v1], [0, v1]]); }
      gbvBox(top, "metall", f, ms, mt, 1.95, 0.1, YT + 2.12, YT + 2.53); }
    // Gang im Zwischengeschoss: vom Treppenfuss bis ueber die Treppe zum Bahnsteig
    const B0 = ubRingAt(r, T.stp), Pf = f.W(Lf, 0, 0), Pa = f.W(Lf + 1.6, 0, 0); gang(bot, [[Pf[0], Pf[2]], [Pa[0], Pa[2]], T.C, [B0[0], B0[1]]], M, 3);
    // Treppe zum Bahnsteig (in Fahrtrichtung +u des Rings), Oeffnung der Tunneldecke, Wangen, Rueckwand, Schacht, Schild "Ausgang"
    const D = ubRingAt(r, T.sb + L2 / 2), P0 = ubRingAt(r, T.sb), f2 = gbvFrame({ P0: [P0[0], P0[1]], e1: [D[2], D[3]], e2: [-D[3], D[2]], L1: 1, L2: 1 }), u2x = D[2], u2z = D[3], rise2 = (M - Y) / n2;
    const so0 = T.ia * r.ds - T.sb, so1 = (T.ib + 1) * r.ds - T.sb, sLo = Math.min(0, so0), sHi = Math.max(L2, so1);
    for (let j = 0; j < n2; j++) { const y = Y + (j + 1) * rise2; gbvBox(bot, "stufe", f2, (j + 0.5) * RUN, 0, RUN, 2 * W2, Y, y); gbvBox(bot, "kante", f2, j * RUN + 0.04, 0, 0.06, 2 * W2 - 0.1, y, y + 0.006); }
    rampe(f2, 0, L2, Y, M, u2x, u2z);
    for (const sd of [-1, 1]) { Q(bot, "kachel", f2.W(sLo, sd * W2, Y), f2.W(sHi, sd * W2, Y), f2.W(sHi, sd * W2, M + 3), f2.W(sLo, sd * W2, M + 3), f2.dirW(0, -sd), uvM(sHi - sLo, M + 3 - Y));
      wand(f2.W((sLo + sHi) / 2, sd * (W2 + 0.05), 0), u2x, u2z, (sHi - sLo) / 2, 0.05, Y - 0.3, M + 3); }
    Q(bot, "kachel", f2.W(sHi, -W2, Y), f2.W(sHi, W2, Y), f2.W(sHi, W2, M), f2.W(sHi, -W2, M), f2.dirW(-1, 0), uvM(2 * W2, M - Y)); wand(f2.W(sHi, 0, 0), -u2z, u2x, W2, 0.05, Y - 0.3, M - 0.1);
    Q(bot, "kachel", f2.W(so0, -W2, CEIL), f2.W(so0, W2, CEIL), f2.W(so0, W2, M + 3), f2.W(so0, -W2, M + 3), f2.dirW(1, 0), uvM(2 * W2, M + 3 - CEIL));
    Q(bot, "decke", f2.W(so1, -W2, CEIL), f2.W(so1, W2, CEIL), f2.W(so1, W2, M), f2.W(so1, -W2, M), f2.dirW(-1, 0));
    Q(bot, "decke", f2.W(so0, -W2, M + 3), f2.W(L2, -W2, M + 3), f2.W(L2, W2, M + 3), f2.W(so0, W2, M + 3), [0, -1, 0]); Q(bot, "licht", f2.W(so0 + 0.5, -0.25, M + 2.98), f2.W(L2 - 0.3, -0.25, M + 2.98), f2.W(L2 - 0.3, 0.25, M + 2.98), f2.W(so0 + 0.5, 0.25, M + 2.98), [0, -1, 0]);
    dkRoom({ poly: [f2.W(sLo - 0.1, -W2, 0), f2.W(sHi, -W2, 0), f2.W(sHi, W2, 0), f2.W(sLo - 0.1, W2, 0)].map(c => [c[0], c[2]]), y0: Y - 0.5, y1: M + 3 });
    { const c = f2.W(sLo - 0.05, 0, 0); plate(bot, "ausgang", c[0], c[2], Y + 2.45, Y + 3.0, 2.4, u2x, u2z); }
    T.unten = f2.W(sLo - 1.5, 0, 0); });
  yield;
  for (const st of UB.stations) { const r = st.rings[0], P = r.P, n = P.length, kk = ((st.i ?? 0) + Math.round(40 / r.ds)) % n;   // Sicherungskasten auf dem Bahnsteig (N15)
    if (typeof lichtKasten === "function") { const a = P[(kk + Math.round(8 / r.ds)) % n], b2 = P[(kk + Math.round(9 / r.ds)) % n], l = Math.hypot(b2[0] - a[0], b2[1] - a[1]) || 1; lichtKasten("ubahn", a[0], UB.Y + 1.3, a[1], (b2[0] - a[0]) / l, (b2[1] - a[1]) / l, UB.grp); } }
  for (const [map, parent] of [[top, scene], [bot, UB.grp]]) for (const [key, o] of map) { const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2)); if (o.c.length) g.setAttribute("color", new THREE.Float32BufferAttribute(o.c, 3));
    const m = new THREE.Mesh(g, TM[key]); m.name = "U-Bahn Treppen " + key + (parent === scene ? " oben" : " unten"); m.castShadow = false; m.receiveShadow = parent === scene; m.userData.keep = true; m.userData.noLift = true; parent.add(m); yield; }
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (UB.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = ubGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { UB.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
const ubUnder = (x, z) => !!UB.under && UB.under.has(Math.floor(x / 8) * 100000 + Math.floor(z / 8));
function ubBuild() { for (const _ of ubGen()); UB.done = true; }   // Tests

// ---- Teil B: fahrende Zuege (je Ring 2 je Richtung, 3 Wagen a 16 m) mit Fahrplan, Tueren und Verspaetung (Nicolas 2026-11-20 zu OFFENE-FRAGEN 8) ----
// Rechtsverkehr: Richtung +1 faehrt auf dem Gleis rechts der Fahrtrichtung. Fahrplan je Zug: t.plan = geplante Abfahrt an der aktuellen (haelt) bzw. naechsten Station (faehrt),
// weiter jeweils um Fahrzeit (ubFahrzeit, Hoechsttempo UB.VMAX) + Halt UB.DWELL 20 s. Tueren an der Bahnsteigseite: offen -> schliesst (2,5 s, Signal) -> zu (0,6 s) -> Abfahrt;
// steht jemand in der Tuer oder haelt sie auf (ubTuerBlock, gotham-ubahn-fahrt.js), gehen sie wieder auf (mind. 3 s) und die Abfahrt verschiebt sich = Verspaetung.
// Verspaetet haelt er nur UB.DMIN 12 s und faehrt bis UB.VFAST (ca. 77 statt 58 km/h), bis er den Plan wieder einhaelt; t.anz (Anzeige der Verspaetung) bleibt, bis er
// wieder normal schnell faehrt. Mitfahren, Abfahrtsanzeigen und Fahrgast-Anzeige: gotham-ubahn-fahrt.js.
UB.trains = []; UB.CAR = 16, UB.GAP = 0.6, UB.VMAX = 16, UB.VFAST = 21.5, UB.ACC = 1.1, UB.DWELL = 20, UB.DMIN = 12, UB.T = 0, UB.TUER = [-3.8, 3.8];
function ubFahrzeit(d, v0 = 0, vm = UB.VMAX) { const a = UB.ACC; v0 = Math.min(v0, vm); const dA = (vm * vm - v0 * v0) / (2 * a), dB = vm * vm / (2 * a);
  if (dA + dB <= d) return (vm - v0) / a + (d - dA - dB) / vm + vm / a; const vp = Math.sqrt(a * d + v0 * v0 / 2); return Math.max(0, (vp - v0) / a) + vp / a; }
function ubNaechste(t, cur) { const L = t.r.P.length * t.r.ds; let best = null, bd = 1e9; for (const ss of t.stS) { let dd = t.d > 0 ? ss - cur : cur - ss; if (dd < 0) dd += L; if (dd < 5) dd += L; if (dd < bd) { bd = dd; best = ss; } } return [best, bd]; }
function ubTrainsInit() {
  const tex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = "#c9ccd0"; c.fillRect(0, 0, w, h); c.fillStyle = "#1d2630";   // Seite: Fensterband, Tueren (bei +-3,8 m wie die Tuerfluegel)
    for (let x = 8; x < w - 8; x += 31) c.fillRect(x, 14, 24, 20); c.fillStyle = "#5c6168"; for (const x of [65, 191]) c.fillRect(x - 10, 10, 20, 46); c.fillStyle = "#9da2a8"; c.fillRect(0, h - 6, w, 6); });
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(UB.CAR - UB.GAP, 3.3, 2.8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.3, emissive: 0x222326, emissiveIntensity: 1 }), 64);
  const band = new THREE.InstancedMesh(new THREE.BoxGeometry(UB.CAR - UB.GAP + 0.04, 0.35, 2.86), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, emissive: 0x333333, emissiveIntensity: 1 }), 64);
  const tt = canvasTex(64, 128, (c, w, h) => { c.fillStyle = "#59606a"; c.fillRect(0, 0, w, h); c.fillStyle = "#1d2630"; c.fillRect(8, 12, w - 16, 58); c.fillStyle = "#e6c229"; c.fillRect(0, h - 8, w, 4); });
  for (const m of [body, band]) { m.count = 0; m.frustumCulled = false; m.userData.keep = true; m.userData.noLift = true; UB.grp.add(m); }
  body.name = "U-Bahn Zuege"; band.name = "U-Bahn Zuege Farbband"; UB.inst = { body, band };
  for (const r of UB.rings) { const stS = r.st.map(s => s.i * r.ds).sort((a, b) => a - b);
    for (const d of [1, -1]) for (let k = 0; k < 2; k++) { const s0 = stS[Math.floor(k * stS.length / 2)], w = 8 + k * 9 + (d > 0 ? 0 : 5);
      UB.trains.push({ r, d, s: s0, v: 0, stS, next: null, halt: true, ab: UB.T + w, plan: UB.T + w, tuer: "offen", tuerT: 0, tuerMin: 0, offen: 1, late: 0, anz: false }); } }
  const tuer = new THREE.InstancedMesh(new THREE.BoxGeometry(0.64, 2.05, 0.05), new THREE.MeshStandardMaterial({ map: tt, roughness: 0.5, metalness: 0.3, emissive: 0x1a1b1d, emissiveIntensity: 1 }), UB.trains.length * 24);
  tuer.count = 0; tuer.frustumCulled = false; tuer.userData.keep = true; tuer.userData.noLift = true; tuer.name = "U-Bahn Tueren"; UB.grp.add(tuer); UB.inst.tuer = tuer;
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
  if (!UB.inst) return; const now = performance.now(), dt = Math.min(0.1, (now - UB.last) / 1000); UB.last = now; UB.T += dt; const T = UB.T;
  for (const t of UB.trains) { const L = t.r.P.length * t.r.ds;
    t.offen = Math.max(0, Math.min(1, t.offen + (t.tuer === "offen" ? 1 : -1) * dt / 0.8));
    if (t.halt) { t.late = Math.max(0, t.ab - t.plan); t.anz = t.late > 0.5;
      if (t.tuer === "offen") { if (T >= t.ab - 3 && T >= t.tuerMin) { t.tuer = "schliesst"; t.tuerT = 0; if (typeof ubTuerSignal === "function") ubTuerSignal(t); } }
      else if (t.tuer === "schliesst") { t.tuerT += dt; if (typeof ubTuerBlock === "function" && ubTuerBlock(t)) { t.tuer = "offen"; t.tuerMin = T + 3; t.ab = Math.max(t.ab, T + 6); if (typeof ubTuerAuf === "function") ubTuerAuf(t); } else if (t.tuerT >= 2.5) { t.tuer = "zu"; t.tuerT = 0; } }
      else if (t.tuerT += dt, t.tuerT >= 0.6) { t.halt = false; const [nx, dd] = ubNaechste(t, ((t.s % L) + L) % L); t.next = nx; t.plan += ubFahrzeit(dd) + UB.DWELL; }
      continue; }
    const cur = ((t.s % L) + L) % L; let dist = t.d > 0 ? t.next - cur : cur - t.next; if (dist < 0) dist += L;
    const late = T + ubFahrzeit(dist, t.v) + UB.DMIN - t.plan, vm = late > 0.5 ? UB.VFAST : UB.VMAX; t.late = late; t.anz = late > 0.5 || t.v > UB.VMAX + 0.3;
    const ziel = Math.min(vm, Math.sqrt(2 * UB.ACC * Math.max(0, dist))); t.v = t.v < ziel ? Math.min(ziel, t.v + UB.ACC * dt) : Math.max(ziel, t.v - UB.ACC * 1.5 * dt);
    const step = Math.min(dist, t.v * dt); t.s += t.d * step;
    if (dist - step < 0.05) { t.s = t.next; t.v = 0; t.halt = true; t.ab = Math.max(T + UB.DMIN, t.plan); t.tuer = "offen"; t.tuerMin = T + 4; } }
  if (typeof ubFahrtStep === "function") ubFahrtStep(dt);   // Mitfahren, Anzeigen (gotham-ubahn-fahrt.js)
  if (!UB.grp.visible) return;   // Matrizen nur, wenn man unten ist
  let n = 0, k = 0; const { body, band, tuer } = UB.inst;
  for (const t of UB.trains) for (let c = 0; c < 3; c++) { const p = ubPose(t.r, t.s - t.d * (c * UB.CAR + UB.CAR / 2), t.d), ux = Math.cos(p.yaw), uz = -Math.sin(p.yaw), nx = Math.sin(p.yaw), nz = Math.cos(p.yaw);
    ubQ.setFromEuler(ubE.set(0, p.yaw, 0)); ubV.set(p.x, UB.BED + 0.35 + 1.65, p.z); ubM.compose(ubV, ubQ, ubS); body.setMatrixAt(n, ubM);
    ubV.y = UB.BED + 0.35 + 0.9; ubM.compose(ubV, ubQ, ubS); band.setMatrixAt(n, ubM); n++;
    for (const sd of [1, -1]) { const o = sd === t.d ? t.offen : 0; for (const D of UB.TUER) for (const lf of [-1, 1]) { const a = D + lf * (0.33 + o * 0.62);   // Tuerfluegel schieben auf (nur Bahnsteigseite)
      ubV.set(p.x + ux * a + nx * sd * 1.43, UB.Y + 1.03, p.z + uz * a + nz * sd * 1.43); ubM.compose(ubV, ubQ, ubS); tuer.setMatrixAt(k++, ubM); } } }
  tuer.count = k; body.instanceMatrix.needsUpdate = band.instanceMatrix.needsUpdate = tuer.instanceMatrix.needsUpdate = true;
}
