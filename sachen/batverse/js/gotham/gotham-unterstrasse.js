// Batverse – Gotham: zweistoeckige Strassen, untere Ebene (Plan G2, Schritt G2e, Nicolas 2026-11-12)
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Nach gotham-bruecken.js. Daten und Boden: GDECK, gdeckNear, gothamDeckAt in gotham-gelaende.js; die obere Fahrbahn zeichnet gotham-strassen.js
// (laesst sie ueber den Rampen aus, gdeckOpen). Hier: Boden der unteren Strasse (4 Spuren, Gehsteige), Unterseite der Fahrbahnplatte, Seitenwaende,
// Stuetzen in der Mitte alle 15 m, Deckenleuchten, Rampen mit Bruestung, obere Fahrspuren neben den Rampen, Abschlusswaende, Deckplatte ueber dem
// Gelaende-Ausschnitt. Kollision: Kreise (Waende innen, Stuetzen, Bruestungen), Regel: weiter innen als die sichtbare Flaeche.
"use strict";

// liegt (x, z) ueber einer Rampenoeffnung (dort keine obere Fahrbahn)
function gdeckOpen(x, z) { const n = gdeckNear(x, z, 12); return !!n && n.s >= -1 && n.s <= n.r.L + 1 && gdeckInRamp(n.r, n.s) && n.d < GDECK.RW / 2 + 0.6; }
{
  if (!GDECK.roads) gdeckBuild();
  const G = GDECK, S = GOT.STR, LY = G.LY, DY = G.DY, RW = G.RW;
  const conc = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#8a8782"; c.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { const v = 110 + Math.random() * 40; c.fillStyle = `rgb(${v},${v - 2},${v - 6})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(0, 0, w, 2); c.fillRect(0, 0, 2, h); }); conc.wrapS = conc.wrapT = THREE.RepeatWrapping;
  const asph = (c, w, h) => { const im = c.createImageData(w, h), d = im.data; for (let i = 0; i < w * h; i++) { const k = Math.random() < 0.15, v = k ? 40 + Math.random() * 28 : 53 + (Math.random() - 0.5) * 6; d[i * 4] = v; d[i * 4 + 1] = v + 2; d[i * 4 + 2] = v + 5; d[i * 4 + 3] = 255; } c.putImageData(im, 0, 0); };   // Pixel direkt (schneller)
  const lines = vier => { const t = canvasTex(256, 256, (c, w, h) => { asph(c, w, h); const L = (v, col, dash) => { c.fillStyle = col; for (let u = 0; u < w; u += dash ? w / 2 : w) c.fillRect(u, v * h - 1.5, dash ? w / 4 : w, 3); };
    L(0.035, "#d8d8d2"); L(0.965, "#d8d8d2"); if (vier) { L(0.47, "#d9b23c"); L(0.53, "#d9b23c"); L(0.25, "#d8d8d2", true); L(0.75, "#d8d8d2", true); } else { L(0.485, "#d9b23c"); L(0.515, "#d9b23c"); } });
    t.wrapS = THREE.RepeatWrapping; return t; };
  const plainT = canvasTex(128, 128, asph); plainT.wrapS = plainT.wrapT = THREE.RepeatWrapping;
  const walkT = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#a3a19b"; c.fillRect(0, 0, w, h); c.strokeStyle = "#7f7d78"; c.lineWidth = 2; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(w, i * 32); c.moveTo(i * 32, 0); c.lineTo(i * 32, h); c.stroke(); } });
  walkT.wrapS = walkT.wrapT = THREE.RepeatWrapping;
  const mat = (map, off, col = 0xffffff, ex = {}) => M(col, Object.assign({ map, roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -off, polygonOffsetUnits: -off }, ex));
  const geo = () => ({ P: [], U: [], I: [] });
  const FL = geo(), FLX = geo(), FLT = geo(), LG = geo(), LW = geo(), FL2 = geo(), WK = geo(), CE = geo(), WA = geo(), CO = geo(), UP = geo(), LAMP = geo();
  // Proben eines Stuecks s0..s1 (mit genauen Enden): [x, z, nx, nz, s]
  const sub = (r, s0, s1) => { const out = [], P = r.pts, at = s => { let j = 1; while (j < P.length - 1 && r.s[j] < s) j++; const a = P[j - 1], b = P[j], l = r.s[j] - r.s[j - 1] || 1, t = Math.max(0, Math.min(1, (s - r.s[j - 1]) / l)), dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, -dz, dx, s]; };
    out.push(at(s0)); for (let i = 0; i < P.length; i++) if (r.s[i] > s0 + 0.2 && r.s[i] < s1 - 0.2) out.push(at(r.s[i])); out.push(at(s1)); return out; };
  // waagrechtes Band zwischen d0 und d1, Hoehe y (Zahl oder Funktion von s); v quer 0..1 (vrep 0) oder in Metern/vrep
  const fv = (v, s) => typeof v === "number" ? v : v(s);                     // Zahl oder Funktion von s
  // mode "aus": Vierecke im Innenraum einer anderen unteren Strasse (Kreuzung) weglassen; "nur": nur dort zeichnen
  const flat = (Gm, Q, D0, D1, y, rep, vrep, mode) => { let pb = false; for (let i = 0; i < Q.length; i++) { const [x, z, nx, nz, s] = Q[i], yy = fv(y, s), d0 = fv(D0, s), d1 = fv(D1, s), k = Gm.P.length / 3;
    const bad = mode ? [d0, (d0 + d1) / 2, d1].some(d => inOther(x + nx * d, z + nz * d, curR, 0.3)) : false;
    for (const d of [d0, d1]) { Gm.P.push(x + nx * d, yy, z + nz * d); Gm.U.push(s / rep, vrep ? d / vrep : (d - d0) / (d1 - d0)); }
    if (i && (!mode || (mode === "aus" ? !bad && !pb : bad || pb))) Gm.I.push(k - 2, k, k - 1, k - 1, k, k + 1); pb = bad; } };
  // senkrechte Wand im Abstand d von y0 bis y1 (Zahlen oder Funktionen von s)
  const wall = (Gm, Q, D, y0, y1) => { let pin = false; for (let i = 0; i < Q.length; i++) { const [x, z, nx, nz, s] = Q[i], d = fv(D, s), a = typeof y0 === "number" ? y0 : y0(s), b = typeof y1 === "number" ? y1 : y1(s), k = Gm.P.length / 3, inn = inOther(x + nx * d, z + nz * d, curR);
    Gm.P.push(x + nx * d, a, z + nz * d, x + nx * d, b, z + nz * d); Gm.U.push(s / 3, a / 3, s / 3, b / 3); if (i && !(inn && pin)) Gm.I.push(k - 2, k, k - 1, k - 1, k, k + 1); pin = inn; } };
  // Wand quer zur Strasse bei s von d0 bis d1
  const cross = (Gm, r, s, d0, d1, y0, y1) => { const [x, z, nx, nz] = sub(r, s, s + 0.5)[0], k = Gm.P.length / 3;
    for (const d of [d0, d1]) for (const y of [y0, y1]) { Gm.P.push(x + nx * d, y, z + nz * d); Gm.U.push(d / 3, y / 3); } Gm.I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); };
  // liegt (x, z) im Innenraum einer anderen zweistoeckigen Strasse (Kreuzung unten): dort keine Waende
  const inOther = (x, z, me, pad = -0.2) => { const C = G.C, ci = Math.floor(x / C), ck = Math.floor(z / C), m = Math.ceil((17 + Math.max(0, pad)) / C);   // ueber das Raster GDECK.grid (Leistung 2026-11-13: vorher alle Punkte aller Strassen, ca. 0,4 s Laden)
    for (let a = -m; a <= m; a++) for (let b = -m; b <= m; b++) { const L = G.grid.get(glKey(ci + a, ck + b)); if (!L) continue;
      for (const [ri, j] of L) { const o = G.roads[ri]; if (o === me) continue; const A = o.pts[j - 1], B = o.pts[j], dx = B[0] - A[0], dz = B[1] - A[1], LL = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - A[0]) * dx + (z - A[1]) * dz) / LL)), s = o.s[j - 1] + t * Math.sqrt(LL);
        if (Math.hypot(x - A[0] - dx * t, z - A[1] - dz * t) < o.HW + pad && s > o.sA && s < o.sB) return true; } } return false; };
  let curR = null; const ring = (x, z, r, top) => { if (!inOther(x, z, curR)) circles.push([x, z, r, top]); };
  // wie sub, aber in den Trichtern alle 1 m
  const subF = (r, s0, s1) => { const Q = sub(r, s0, s1), out = []; for (let i = 0; i < Q.length; i++) { if (i) { const a = Q[i - 1], b = Q[i], n = gdeckK(r, (a[4] + b[4]) / 2) < 1 || inOther(a[0], a[1], r, 20) || inOther(b[0], b[1], r, 20) ? Math.ceil(b[4] - a[4]) : 1; for (let k = 1; k < n; k++) out.push(sub(r, a[4] + (b[4] - a[4]) * k / n, a[4] + (b[4] - a[4]) * k / n + 0.5)[0]); } out.push(Q[i]); } return out; };
  const posts = []; let nCirc = circles.length;
  for (const r of G.roads) { curR = r;
    const HW = r.HW, inner = subF(r, r.sA, r.sB), hw = s => gdeckHW(r, s), wk = s => 2 * gdeckK(r, s), all = sub(r, 0, r.L), rampY = s => gdeckRampY(r, s);
    // untere Strasse: Fahrbahn (4 Spuren, Mitte = Stuetzenreihe), Gehsteige, Unterseite der Platte, Seitenwaende
    // Fahrbahn: volle Breite mit 4-Spur-Textur; in den Trichtern (Nicolas 2026-11-12, Bild: Zickzack, weisse Spurlinien) schlichter Asphalt, die weissen
    // Spurlinien enden dort, gelbe Doppellinie und Randlinien laufen als eigene Streifen glatt bis an die Rampe (gleiche Lage wie in den Texturen)
    const f0 = r.ca ? r.sA : r.sA + G.TL, f1 = r.cb ? r.sB : r.sB - G.TL, half = s => hw(s) - wk(s);
    if (f1 > f0) flat(FL, subF(r, f0, f1), s => half(s), s => -half(s), LY + 0.03, 12, 0, "aus");
    // Kreuzungen unten (Nicolas 2026-11-12, Bild: Gehsteige und Linien liefen quer durch): dort schlichter Asphalt ueber die ganze Breite, ohne Linien
    flat(FLX, inner, s => hw(s), s => -hw(s), LY + 0.034, 4, 4, "nur");
    for (const [a, b] of [[r.sA, f0], [f1, r.sB]]) { if (b - a < 0.5) continue; const Q = subF(r, a, b);
      flat(FLT, Q, s => half(s), s => -half(s), LY + 0.03, 4, 4, "aus");
      const yel = s => 2 * half(s) * (0.015 + 0.015 * gdeckK(r, s)), edge = s => half(s) * 0.93;   // wie Textur: gelb 0,47/0,53 (4 Spuren) bzw. 0,485/0,515 (Rampe), Rand 0,035
      for (const sg of [1, -1]) { flat(LG, Q, s => sg * (yel(s) - 0.08), s => sg * (yel(s) + 0.08), LY + 0.04, 4, 4, "aus"); flat(LW, Q, s => sg * (edge(s) - 0.08), s => sg * (edge(s) + 0.08), LY + 0.04, 4, 4, "aus"); } }
    for (const sg of [1, -1]) { flat(WK, inner, s => sg * (hw(s) - wk(s)), s => sg * hw(s), LY + 0.15, 2, 2, "aus"); wall(WA, inner, s => sg * (hw(s) - wk(s)), LY, LY + 0.15); wall(WA, inner, s => sg * hw(s), LY - 0.6, DY); }
    flat(CE, inner, -HW, HW, DY, 3, 3);
    // Deckplatte ueber dem Gelaende-Ausschnitt (aussen neben den Gehsteigen, ganze Laenge)
    for (const sg of [1, -1]) flat(CO, all, sg * HW, sg * (HW + G.COVER), S + 0.035, 2, 2);
    // Rampen an offenen Enden: Boden, Waende mit Bruestung (1 m ueber der Strasse), obere Spuren daneben
    for (const end of [0, 1]) { if (end ? r.cb : r.ca) continue; const s0 = end ? r.sB : 0, s1 = end ? r.L : r.sA, Q = sub(r, s0, s1), sw0 = end ? r.sB : G.FL, sw1 = end ? r.L - G.FL : r.sA, QW = sub(r, sw0, sw1);
      flat(FL2, Q, RW / 2, -RW / 2, s => rampY(s) + 0.03, 12, 0);
      for (const sg of [1, -1]) { wall(WA, QW, sg * RW / 2, s => rampY(s) - 0.6, S + 1); wall(WA, QW, sg * (RW / 2 + 0.3), S, S + 1); flat(WA, QW, sg * RW / 2, sg * (RW / 2 + 0.3), S + 1, 3, 3);
        flat(UP, Q, sg * RW / 2, s => sg * gdeckUp(r, s), S + 0.05, 12, 4);
        flat(WK, Q, s => sg * gdeckUp(r, s), sg * (r.w / 2 + 0.3), S + 0.15, 2, 2); wall(WA, Q, s => sg * gdeckUp(r, s), S + 0.04, S + 0.15);   // Gehsteig (15 cm) neben dem oberen Trichter
        for (let s = sw0; s <= sw1; s += 0.8) { const [x, z, nx, nz] = sub(r, s, s + 0.5)[0]; ring(x + nx * sg * (RW / 2 + 0.15), z + nz * sg * (RW / 2 + 0.15), 0.45, S + 1); } }
      // Naht zur anschliessenden Strasse: 4 m Asphalt ueber das Strassenende hinaus (knapp unter deren Fahrbahn), sonst bleibt ein Wiesenstreifen
      { const P = r.pts, e = end ? P[P.length - 1] : P[0], q = end ? P[P.length - 2] : P[1], l = Math.hypot(e[0] - q[0], e[1] - q[1]) || 1, ux = (e[0] - q[0]) / l, uz = (e[1] - q[1]) / l, nx = end ? -uz : uz, nz = end ? ux : -ux, k = UP.P.length / 3;
        const joins = [...GOTHAM_STADT.haupt, ...GOTHAM_STADT.neben].some(o => o.id !== r.id && o.pts.some(([a, b]) => { const g = GOT.toGame(a, b); return Math.hypot(g[0] - e[0] - ux * 4, g[1] - e[1] - uz * 4) < 10; }));
        if (joins)
        { for (const t of [-0.5, 4]) for (const d of [-RW / 2, RW / 2]) { UP.P.push(e[0] + ux * t + nx * d, S + 0.045, e[1] + uz * t + nz * d); UP.U.push(t / 4, d / 4); } UP.I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
      // keine Querwand mehr: die Seitenwaende laufen im Trichter schraeg bis an die Rampenwaende
    }
    // geschlossene Enden: Wand quer ueber die ganze Breite
    for (const end of [0, 1]) { if (!(end ? r.cb : r.ca) || r.loop || (end ? r.joinB : r.joinA)) continue; const sx = end ? r.sB : r.sA; cross(WA, r, sx, -HW, HW, LY - 0.6, DY);
      for (let d = -HW; d <= HW; d += 0.8) { const [x, z, nx, nz] = sub(r, sx, sx + 0.5)[0]; ring(x + nx * d, z + nz * d, 0.45, DY); } }
    // Seitenwaende innen (Kollision), Stuetzen und Deckenleuchten alle 15 m
    for (let s = r.sA; s <= r.sB; s += 0.8) { const [x, z, nx, nz] = sub(r, s, s + 0.5)[0]; const h = gdeckHW(r, s) - 0.45; for (const sg of [1, -1]) ring(x + nx * sg * h, z + nz * sg * h, 0.45, DY); }
    for (let s = r.sA + 10; s <= r.sB - 10; s += 15) { if (gdeckK(r, s) < 0.999) continue; const [x, z, nx, nz] = sub(r, s, s + 0.5)[0]; if (inOther(x, z, r, 15)) continue;   // an Kreuzungen unten 15 m frei zum Abbiegen posts.push([x, z]); ring(x, z, 0.6, DY);   // nicht im Trichter
      for (const sg of [1, -1]) { const lx = x + nx * sg * HW / 2, lz = z + nz * sg * HW / 2, k = LAMP.P.length / 3, tx = -nz, tz = nx;
        for (const [a, b] of [[-1.2, -0.15], [1.2, -0.15], [-1.2, 0.15], [1.2, 0.15]]) { LAMP.P.push(lx + tx * a + nx * b, DY - 0.03, lz + tz * a + nz * b); LAMP.U.push(0, 0); } LAMP.I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
  }
  const make = (Gm, m, name) => { if (!Gm.I.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(Gm.P, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(Gm.U, 2)); g.setIndex(Gm.I); g.computeVertexNormals(); g.computeBoundingSphere();
    const o = new THREE.Mesh(g, m); o.name = name; o.receiveShadow = true; o.castShadow = name !== "Gotham-Untere Strasse Leuchten"; o.userData.keep = true; o.userData.noLift = true; scene.add(o); return o; };
  const postG = posts.map(([x, z]) => new THREE.CylinderGeometry(0.45, 0.5, DY - LY, 12).translate(x, (LY + DY) / 2, z));
  GDECK.meshes = [make(FL, mat(lines(true), 2), "Gotham-Untere Strasse"), make(FLT, mat(plainT, 2), "Gotham-Untere Strasse Trichter"), make(FLX, mat(plainT, 2.5), "Gotham-Untere Kreuzungen"), make(LG, M(0xd9b23c, { roughness: 0.8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), "Gotham-Untere Strasse Mittellinie"), make(LW, M(0xd8d8d2, { roughness: 0.8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), "Gotham-Untere Strasse Randlinien"), make(FL2, mat(lines(false), 2), "Gotham-Untere Strasse Rampen"), make(WK, mat(walkT, 1), "Gotham-Untere Strasse Gehsteige"),
    make(CE, mat(conc, 0, 0x6e6c68), "Gotham-Untere Strasse Decke"), make(WA, mat(conc, 0), "Gotham-Untere Strasse Waende"), make(CO, mat(walkT, 0.5), "Gotham-Deckplatten"),
    make(UP, mat(plainT, 2), "Gotham-Spuren neben Rampen"), make(LAMP, M(0xfff1c8, { emissive: 0xffe2a0, emissiveIntensity: 1.2, side: THREE.DoubleSide }), "Gotham-Untere Strasse Leuchten")];
  if (postG.length) { const m = new THREE.Mesh(mergeGeometries(postG, false), M(0x8a8782, { roughness: 0.9 })); m.name = "Gotham-Untere Strasse Stuetzen"; m.castShadow = m.receiveShadow = true; m.userData.keep = true; m.userData.noLift = true; scene.add(m); GDECK.meshes.push(m); }
  GDECK.nCircles = circles.length - nCirc;
}
