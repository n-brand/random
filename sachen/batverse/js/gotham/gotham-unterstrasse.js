// Batverse – Gotham: zweistoeckige Strassen, untere Ebene (Plan G2, Schritt G2e, Nicolas 2026-11-12)
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Nach gotham-bruecken.js. Daten und Boden: GDECK, gdeckNear, gothamDeckAt in gotham-gelaende.js; die obere Fahrbahn zeichnet gotham-strassen.js
// (laesst sie ueber den Rampen aus, gdeckOpen). Hier: Boden der unteren Strasse (4 Spuren, Gehsteige), Unterseite der Fahrbahnplatte, Seitenwaende,
// Stuetzen in der Mitte alle 15 m, Deckenleuchten, Rampen mit Bruestung, obere Fahrspuren neben den Rampen, Abschlusswaende, Deckplatte ueber dem
// Gelaende-Ausschnitt. Kollision: Kreise (Waende innen, Stuetzen, Bruestungen), Regel: weiter innen als die sichtbare Flaeche.
"use strict";
const LICHT_AUS = { k: 0, gates: [], B: {} };   // Stromausfall je Bereich (N15): B[id] = { on, t, gates, set(an), drin(), text }, siehe lichtAus
function lichtBereich(id, o) { return LICHT_AUS.B[id] = { on: false, t: 0, gates: [], ...o }; }
lichtBereich("unten", { text: "in den unteren Strassen", set(an) { const m = GDECK.lampM; if (m) { m.emissiveIntensity = an ? 0 : 1.3; m.color.setHex(an ? 0x2a2c2a : 0xeefff0); }
    const G = GDECK.amp; if (G) { for (const k of ["r", "y", "g"]) G.L[k].on.visible = !an; for (const k of ["r", "g"]) G.P[k].visible = !an; } },
  drin(p) { return p.y < GOT.STR - 2 && p.y > GOT.STR - 9 && !!gdeckNear(p.x, p.z, 2); } });
// Sicherungskasten (Mesh fuer den Rechtsklick und Gehaeuse) an (x, y, z), Front zeigt nach (dx, dz); Ziel erst im ersten Bild in gates (gampelStep)
function lichtKasten(id, x, y, z, dx, dz, par = scene) { const g = new THREE.Group(), h = Math.atan2(dx, dz); g.position.set(x, y, z); g.rotation.y = h; g.userData.keep = true; par.add(g);
  const M = LICHT_AUS.M || (LICHT_AUS.M = { k: new THREE.MeshStandardMaterial({ color: 0x8a8e92, roughness: 0.5, metalness: 0.4 }), s: new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (c, w, h) => { c.fillStyle = "#ffd43b"; c.beginPath(); c.moveTo(w / 2, 4); c.lineTo(w - 4, h - 6); c.lineTo(4, h - 6); c.fill(); c.fillStyle = "#111"; c.font = "bold 34px Arial"; c.textAlign = "center"; c.fillText("⚡", w / 2, h - 14); }) }) });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.85, 0.22), M.k); g.add(b); const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.2), M.s); sg.position.set(0, 0.1, 0.115); g.add(sg);
  const hm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.5), new THREE.MeshBasicMaterial({ visible: false })); g.add(hm); g.updateMatrixWorld(true); const w = hm.getWorldPosition(new THREE.Vector3());
  const B = LICHT_AUS.B[id], gt = { name: "Sicherungskasten", g: hm, call: () => lichtAus(!B.on, id), verbs: ["Strom abschalten", "Strom abschalten"], a: [w.x, w.z], b: [w.x, w.z], near: 2.5 }; B.gates.push(gt); LICHT_AUS.gates.push(gt); LICHT_AUS.pend = true; return g; }

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
  GDECK.ampeln = []; const MK = geo(), FLB = geo(), FL = geo(), FLX = geo(), FLT = geo(), LG = geo(), LW = geo(), FL2 = geo(), WK = geo(), CE = geo(), WA = geo(), CO = geo(), UP = geo(), LAMP = geo();
  // Fahrbahn-Markierung oben an den Rampen (Variante B, Nicolas 2026-11-13): Atlas 4 Kacheln (0 geradeaus, 1 LOWER mit Pfeil links hinunter, 2 Einfaedeln
  // nach rechts, 3 nur rechts), Spitze oben in der Kachel = in Fahrtrichtung; decal legt ein Rechteck w (quer) x l (laengs) mit Spitze in Richtung (fx, fz)
  const mkTex = canvasTex(640, 128, c => { c.clearRect(0, 0, 640, 128); c.fillStyle = "#e6e6df"; c.strokeStyle = "#e6e6df"; c.lineCap = "butt"; c.lineJoin = "miter";
    const head = (x, y, a) => { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, -26); c.lineTo(-22, 8); c.lineTo(22, 8); c.closePath(); c.fill(); c.restore(); };   // Spitze bei (x, y), a = Richtung (0 = oben)
    const path = (pts) => { c.lineWidth = 18; c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p); c.stroke(); };
    path([[64, 128], [64, 40]]); head(64, 22, 0);                                                              // 0 geradeaus
    c.save(); c.translate(128, 0); path([[70, 74], [70, 52], [44, 26]]); head(36, 18, -Math.PI / 4); c.font = "bold 30px sans-serif"; c.textAlign = "center"; c.fillText("LOWER", 64, 112); c.restore();   // 1 LOWER
    c.save(); c.translate(256, 0); c.lineWidth = 18; c.beginPath(); c.moveTo(48, 128); c.lineTo(48, 78); c.quadraticCurveTo(48, 40, 82, 30); c.stroke(); head(92, 26, Math.PI * 0.42); c.restore();   // 2 einfaedeln rechts
    c.save(); c.translate(384, 0); path([[48, 128], [48, 54], [84, 54]]); head(100, 54, Math.PI / 2); c.restore();   // 3 nur rechts
    c.save(); c.translate(512, 0); path([[64, 82], [64, 40]]); head(64, 22, 0); c.font = "bold 30px sans-serif"; c.textAlign = "center"; c.fillText("UPPER", 64, 112); c.restore(); });   // 4 UPPER (Rampe hinauf, Ring-Rampen unten)
  const decal = (x, z, fx, fz, w, l, tile, y) => { const rx = -fz, rz = fx, k = MK.P.length / 3, u0 = tile / 5, u1 = (tile + 1) / 5;
    for (const [a, b, u, v] of [[-1, -1, u0, 0], [1, -1, u1, 0], [-1, 1, u0, 1], [1, 1, u1, 1]]) { MK.P.push(x + rx * a * w / 2 + fx * b * l / 2, y, z + rz * a * w / 2 + fz * b * l / 2); MK.U.push(u, v); }
    MK.I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); (GDECK.mkPts || (GDECK.mkPts = [])).push([x, z, tile]); };
  // Linie durch Weltpunkte (Breite w) ins Netz LW
  const lineW = (pts, w, y) => { for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], l = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / l * w / 2, nz = (bx - ax) / l * w / 2, k = LW.P.length / 3;
    LW.P.push(ax + nx, y, az + nz, ax - nx, y, az - nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz); LW.U.push(0, 0, 0, 0, 0, 0, 0, 0); LW.I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } };
  const lineG = (pts, w, y) => { for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], l = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / l * w / 2, nz = (bx - ax) / l * w / 2, k = LG.P.length / 3;
    LG.P.push(ax + nx, y, az + nz, ax - nx, y, az - nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz); LG.U.push(0, 0, 0, 0, 0, 0, 0, 0); LG.I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } };
  // Proben eines Stuecks s0..s1 (mit genauen Enden): [x, z, nx, nz, s]
  const sub = (r, s0, s1) => { const out = [], P = r.pts, at = s => { let j = 1; while (j < P.length - 1 && r.s[j] < s) j++; const a = P[j - 1], b = P[j], l = r.s[j] - r.s[j - 1] || 1, t = Math.max(0, Math.min(1, (s - r.s[j - 1]) / l));
    let dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l;
    // an Eckpunkten Querrichtung gemittelt (Nicolas 2026-11-13, Park Row -1598/634: am Knick klaffte aussen ein Keil, innen ueberlappte alles)
    const sideAvg = (k, m) => { if (k < 1 || k > P.length - 2) return; const c2 = P[k + 1], a2 = P[k - 1], l1 = Math.hypot(P[k][0] - a2[0], P[k][1] - a2[1]) || 1, l2 = Math.hypot(c2[0] - P[k][0], c2[1] - P[k][1]) || 1; const ex = (P[k][0] - a2[0]) / l1 + (c2[0] - P[k][0]) / l2, ez = (P[k][1] - a2[1]) / l1 + (c2[1] - P[k][1]) / l2, el = Math.hypot(ex, ez) || 1; dx = ex / el; dz = ez / el; };
    if (t > 0.999) sideAvg(j); else if (t < 0.001) sideAvg(j - 1);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, -dz, dx, s]; };
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
  const gapsOf = (r, sg) => (G.gaps || []).filter(g => g.road === r.id && g.side === sg).map(g => [g.s0, g.s1]);
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
    // Ring-Rampen (mid): unten von 20 m vor dem Rampenbeginn bis zum Portal eigene Markierung statt der 4-Spur-Textur
    const mids = r.ramps.filter(p => p.mid), zoneL = p => [Math.min(p.a - 20 * p.sg, p.b + G.UZ * p.sg), Math.max(p.a - 20 * p.sg, p.b + G.UZ * p.sg)];
    const cutR = (lo, hi, holes) => { const out = []; let c = lo; for (const [h0, h1] of holes.slice().sort((x, y) => x[0] - y[0])) { if (h1 <= c || h0 >= hi) continue; if (h0 > c) out.push([c, h0]); c = Math.max(c, h1); } if (c < hi) out.push([c, hi]); return out; };
    for (const [a, b] of cutR(f0, f1, mids.map(zoneL))) if (b - a > 0.5) flat(FL, subF(r, a, b), s => half(s), s => -half(s), LY + 0.03, 12, 0, "aus");
    // Kreuzungen unten (Nicolas 2026-11-12, Bild: Gehsteige und Linien liefen quer durch): dort schlichter Asphalt ueber die ganze Breite, ohne Linien
    flat(FLX, inner, s => hw(s), s => -hw(s), LY + 0.034, 4, 4, "nur");
    flat(FLB, inner, s => hw(s) + 0.3, s => -hw(s) - 0.3, LY + 0.004 + 0.002 * G.roads.indexOf(r), 4, 4);   // Bodenplatte darunter (Nicolas 2026-11-13, -1855/645: an der Muendung sah man durch Spalten zwischen den Bodennetzen auf das Gelaende)
    for (const [a, b] of [[r.sA, f0], [f1, r.sB]]) { if (b - a < 0.5) continue; const Q = subF(r, a, b);
      flat(FLT, Q, s => half(s), s => -half(s), LY + 0.03, 4, 4, "aus");
      const yel = s => 2 * half(s) * (0.015 + 0.015 * gdeckK(r, s)), edge = s => half(s) * 0.93;   // wie Textur: gelb 0,47/0,53 (4 Spuren) bzw. 0,485/0,515 (Rampe), Rand 0,035
      for (const sg of [1, -1]) { flat(LG, Q, s => sg * (yel(s) - 0.08), s => sg * (yel(s) + 0.08), LY + 0.04, 4, 4, "aus"); flat(LW, Q, s => sg * (edge(s) - 0.08), s => sg * (edge(s) + 0.08), LY + 0.04, 4, 4, "aus"); } }
    for (const sg of [1, -1]) { flat(WK, inner, s => sg * (hw(s) - wk(s)), s => sg * hw(s), LY + 0.15, 2, 2, "aus"); wall(WA, inner, s => sg * (hw(s) - wk(s)), LY, LY + 0.15); for (const [a, b] of cutR(r.sA, r.sB, gapsOf(r, sg))) if (b - a > 0.5) wall(WA, subF(r, a, b), s => sg * hw(s), LY - 0.6, DY); }   // Wandoeffnungen (Wayne Tower: Zufahrt, Geheimgang)
    { const sh = mids.map(p => [Math.min(p.a + G.FL * p.sg, p.b), Math.max(p.a + G.FL * p.sg, p.b)]);   // Decke ueber dem abfallenden Teil der Ring-Rampen offen
      for (const [a, b] of cutR(r.sA, r.sB, sh)) flat(CE, subF(r, a, b), -HW, HW, DY, 3, 3);
      for (const [a, b] of sh) for (const sg of [1, -1]) flat(CE, subF(r, a, b), sg * (RW / 2 + 0.3), sg * HW, DY, 3, 3); }
    // Deckplatte ueber dem Gelaende-Ausschnitt (aussen neben den Gehsteigen, ganze Laenge)
    for (const sg of [1, -1]) flat(CO, all, sg * HW, sg * (HW + G.COVER), S + 0.035, 2, 2);
    // Deckplatte auch unter der ganzen Breite (Nicolas 2026-11-13, -2063/1128: oben neben einer Kreuzungsflaeche sah man durch eine Luecke auf die untere
    // Strasse, weil das Gelaende ueber dem unteren Raum ausgeschnitten ist): 4 cm unter der Fahrbahn, ueber den Rampenoeffnungen frei; je Strasse etwas
    // andere Hoehe, damit sich zwei Platten an Kreuzungen nicht flimmernd ueberlagern
    { const yI = S - 0.002 - 0.003 * G.roads.indexOf(r), dO = RW / 2 + 0.3, shO = mids.map(p => [Math.min(p.a, p.b), Math.max(p.a, p.b)]);
      for (const [a, b] of cutR(r.sA, r.sB, shO)) flat(CO, subF(r, a, b), -HW, HW, yI, 2, 2);
      for (const [a, b] of [[0, r.sA], [r.sB, r.L], ...shO]) if (b - a > 0.5) for (const sg of [1, -1]) flat(CO, subF(r, a, b), sg * dO, sg * HW, yI, 2, 2); }
    // Rampen an offenen Enden: Boden, Waende mit Bruestung (1 m ueber der Strasse), obere Spuren daneben
    for (const rp of r.ramps) { const end = rp.sg < 0, mid = !!rp.mid, s0 = Math.min(rp.a, rp.b), s1 = Math.max(rp.a, rp.b), Q = sub(r, s0, s1), wA = rp.a + G.FL * rp.sg, sw0 = Math.min(wA, rp.b), sw1 = Math.max(wA, rp.b), QW = sub(r, sw0, sw1);   // Enden und Ring-Mitte (mid)
      // andere Strassen (Kartendaten, Spielkoordinaten) bei diesem Ende: an Einmuendungen keine Striche, Pfeile, Gehsteige neben der oberen Spur
      const eE = sub(r, rp.a, rp.a)[0], oth = [...GOTHAM_STADT.haupt, ...GOTHAM_STADT.neben].filter(o => o.id !== r.id).map(o => ({ w: o.w, P: o.pts.map(([a, b]) => GOT.toGame(a, b)) })).filter(o => o.P.some(p => Math.hypot(p[0] - eE[0], p[1] - eE[1]) < G.FL + G.RL + G.PZ + 120));
      const onOth = (x, z, pad) => oth.some(o => { for (let j = 1; j < o.P.length; j++) { const A = o.P[j - 1], B = o.P[j], dx = B[0] - A[0], dz = B[1] - A[1], LL = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - A[0]) * dx + (z - A[1]) * dz) / LL)); if (Math.hypot(x - A[0] - dx * t, z - A[1] - dz * t) < o.w / 2 + pad) return true; } return false; });
      flat(FL2, Q, RW / 2, -RW / 2, s => rampY(s) + 0.03, 12, 0);
      for (const sg of [1, -1]) { wall(WA, QW, sg * RW / 2, mid ? LY - 0.6 : s => rampY(s) - 0.6, S + 1); wall(WA, QW, sg * (RW / 2 + 0.3), mid ? LY - 0.6 : S, S + 1);   // Ring: Waende bis unten (daneben faehrt man unten)
        for (const sx of [wA, rp.b]) cross(WA, r, sx, sg * RW / 2, sg * (RW / 2 + 0.3), mid ? LY - 0.6 : rampY(sx) - 0.6, S + 1);   // Stirnflaechen an beiden Wandenden (Nicolas 2026-11-14: man sah durch die Mauer, zwischen Innen- und Aussenflaeche) flat(WA, QW, sg * RW / 2, sg * (RW / 2 + 0.3), S + 1, 3, 3);
        flat(UP, Q, sg * RW / 2, s => sg * gdeckUp(r, s), S + 0.05, 12, 4);
        if (!mid) { let run = []; const put = () => { if (run.length > 1) { flat(WK, run, s => sg * gdeckUp(r, s), sg * (r.w / 2 + 0.3), S + 0.15, 2, 2); wall(WA, run, s => sg * gdeckUp(r, s), S + 0.04, S + 0.15); } run = []; };   // Gehsteig (15 cm) neben der oberen Spur, nicht in Einmuendungen
          for (const q of subF(r, s0, s1)) { if (onOth(q[0] + q[2] * sg * (r.w / 2 + 0.15), q[1] + q[3] * sg * (r.w / 2 + 0.15), 0.3)) put(); else run.push(q); } put(); }
        for (let s = sw0; s <= sw1; s += 1.2) { const [x, z, nx, nz] = sub(r, s, s + 0.5)[0]; ring(x + nx * sg * (RW / 2 + 0.15), z + nz * sg * (RW / 2 + 0.15), 0.65, S + 1); } }
      // Naht zur anschliessenden Strasse: 4 m Asphalt ueber das Strassenende hinaus (knapp unter deren Fahrbahn), sonst bleibt ein Wiesenstreifen
      if (!mid) { const P = r.pts, e = end ? P[P.length - 1] : P[0], q = end ? P[P.length - 2] : P[1], l = Math.hypot(e[0] - q[0], e[1] - q[1]) || 1, ux = (e[0] - q[0]) / l, uz = (e[1] - q[1]) / l, nx = end ? -uz : uz, nz = end ? ux : -ux, k = UP.P.length / 3;
        const joins = [...GOTHAM_STADT.haupt, ...GOTHAM_STADT.neben].some(o => o.id !== r.id && o.pts.some(([a, b]) => { const g = GOT.toGame(a, b); return Math.hypot(g[0] - e[0] - ux * 4, g[1] - e[1] - uz * 4) < 10; }));
        if (joins)
        { for (const t of [-0.5, 4]) for (const d of [-r.w / 2, r.w / 2]) { UP.P.push(e[0] + ux * t + nx * d, S + 0.045, e[1] + uz * t + nz * d); UP.U.push(t / 4, d / 4); } UP.I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
      // Bruestung am Portal quer ueber den Schacht (Variante B, Fahrtest 2026-11-13: wer oben innen bis ans Portal fuhr, fiel hinunter), wie die Rampenseiten 1 m
      { const sx = rp.b, sh = -0.3 * rp.sg; flat(UP, end ? sub(r, sx - 4.5, sx) : sub(r, sx, sx + 4.5), -r.w / 2, r.w / 2, S + 0.045, 12, 4);   // Fahrbahn direkt hinter der Bruestung (das Band der Deck-Fahrbahn setzt dort erst nach einer Probe ein)
        cross(WA, r, sx, -RW / 2 - 0.3, RW / 2 + 0.3, S, S + 1); cross(WA, r, sx + sh, -RW / 2 - 0.3, RW / 2 + 0.3, S, S + 1);
        { const [x, z, nx, nz] = sub(r, sx, sx + 0.5)[0], [x2, z2] = sub(r, sx + sh, sx + sh + 0.5)[0], k = WA.P.length / 3; for (const d of [-RW / 2 - 0.3, RW / 2 + 0.3]) { WA.P.push(x + nx * d, S + 1, z + nz * d, x2 + nx * d, S + 1, z2 + nz * d); WA.U.push(0, 0, 0.1, 0); } WA.I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
        // Kollision als kleine Quader nur auf Deckhoehe (Kreise gelten 8 m nach unten und sperrten die Rampe darunter)
        for (let d = -RW / 2 - 0.3; d <= RW / 2 + 0.31; d += 0.25) { const [x, z, nx, nz] = sub(r, sx + sh / 2, sx + sh / 2 + 0.5)[0], px = x + nx * d, pz = z + nz * d; solids.push({ x0: px - 0.15, x1: px + 0.15, y0: S - 0.2, y1: S + 1, z0: pz - 0.15, z1: pz + 0.15, on: true, noLift: true }); } }
      // Markierung oben (Variante B): u = Abstand vom Strassenende, "hinein" = Richtung zum Deck (rechte Seite sgIn), Portal bei u = FL + RL
      { const sgIn = rp.sg, sOf = u => rp.a + rp.sg * u, at = (u, d) => { const [x, z, nx, nz] = sub(r, sOf(u), sOf(u))[0]; return [x + nx * d, z + nz * d]; }, dirIn = u => { const [, , nx, nz] = sub(r, sOf(u), sOf(u))[0]; return [nz * sgIn, -nx * sgIn]; };
        const YM = S + 0.08, PU = G.FL + G.RL, LN = 3.36, halfW = r.w / 2;
        const lineU = (u0, u1, d, w = 0.16, dash = 0) => { if (!dash) { const pts = []; for (let u = u0; u < u1; u += 2) pts.push(at(u, d)); pts.push(at(u1, d)); lineW(pts, w, YM); return; } for (let u = u0; u < u1; u += 2 * dash) { const m = at(u + dash / 2, d); if (!onOth(m[0], m[1], 1)) lineU(u, Math.min(u1, u + dash), d, w); } };
        // Pfeil bei u, sonst bis 6 m daneben, wenn er dort auf einer Einmuendung laege (ganz weglassen, wenn nirgends frei)
        const arrow = (u, d, tile, back, w, l) => { for (const du of [0, 3, -3, 6, -6]) { const v = u + du; if (![-l / 2, 0, l / 2].every(q => { const m = at(v + q, d); return !onOth(m[0], m[1], 2); })) continue; const [x, z] = at(v, d), [fx, fz] = dirIn(v); decal(x, z, back ? -fx : fx, back ? -fz : fz, w, l, tile, YM); return; } };
        for (const sg of [1, -1]) { lineU(0, G.FL - 15, sg * RW / 2, 0.16, 3); lineU(G.FL - 15, G.FL, sg * RW / 2); lineU(0, PU, sg * (halfW - 0.25)); }   // Trennlinie Rampe/oben, Randlinie
        for (const u of [13, 24]) { arrow(u, sgIn * RW / 4, 1, false, 2.6, 6); arrow(u, sgIn * (RW / 2 + halfW) / 2, 0, false, 1.6, 5); }   // hinein: innen LOWER, aussen geradeaus
        for (const u of [G.FL + 12.5, G.FL + 37.5, G.FL + 62.5]) { arrow(u, sgIn * 5.4, 0, false, 1.4, 4.5); arrow(u, -sgIn * 5.4, 0, true, 1.4, 4.5); }   // Leitpfeile neben dem Schacht
        // Portalzone auf dem Deck (p = Meter hinter dem Portal): Sperrflaeche als Keil in der inneren Spur (am Portal volle Breite, nach 30 m spitz), danach Spurlinie
        for (const sg of [1, -1]) { const P = (p, d) => at(PU + p, sg * d), D0 = 0.35, inT = (p, d) => p >= 0 && d >= D0 && p / 30 + (d - D0) / (LN - D0) <= 1;
          const out = []; for (let p = 0; p <= 30; p += 2) out.push(P(p, LN - (LN - D0) * p / 30)); lineW(out, 0.16, YM);
          for (let c0 = -3; c0 < 30; c0 += 2) { let q0 = null, q1 = null; for (let e = 0; e <= LN - D0; e += 0.05) if (inT(c0 + e, D0 + e)) { if (q0 === null) q0 = e; q1 = e; } if (q0 !== null && q1 - q0 > 0.2) lineW([P(c0 + q0, D0 + q0), P(c0 + q1, D0 + q1)], 0.3, YM); }
          lineU(PU + 30, PU + G.PZ, sg * LN, 0.16, 3); }
        { let n = 0, last = -99; for (let p = 35; p <= 78 && n < 3; p++) { if (p - last < 12) continue; const ok = [-3, 0, 3].every(q => { const m = at(PU + p + q, -sgIn * 1.85); return !onOth(m[0], m[1], 4); }); if (ok) { arrow(PU + p, -sgIn * 1.85, 2, true, 1.8, 5); last = p; n++; } } }   // hinaus: innere Spur endet, rechts einfaedeln (nicht in Einmuendungen)
        // Seitenstrassen, die neben dem Schacht enden (ab 5 m vor dem Rampenbeginn bis 5 m hinter dem Portal): nur rechts abbiegen, Pfeil 14 m vor der Fahrbahnkante
        const axisD = (x, z) => { const n = gdeckNear(x, z, 40); return n && n.r === r ? n.d : 99; };
        for (const o of oth) for (const k of [0, o.P.length - 1]) { const E = o.P[k], m = gdeckNearOn(r, E[0], E[1]); if (!m || m.d > halfW + 8) continue; const u = (m.s - rp.a) * rp.sg; if (u < G.FL - 5 || u > PU + 5) continue;
          const dir = k ? -1 : 1; let pt = null, nx0 = 0, nz0 = 0;
          for (let j = k + dir; j >= 0 && j < o.P.length && !pt; j += dir) { const A = o.P[j - dir], B = o.P[j], l = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
            for (let t = 0; t <= l; t += 1) { const x = A[0] + (B[0] - A[0]) * t / l, z = A[1] + (B[1] - A[1]) * t / l; if (axisD(x, z) >= halfW + 14) { pt = [x, z]; nx0 = (A[0] - B[0]) / l; nz0 = (A[1] - B[1]) / l; break; } } }
          if (!pt) continue; const lx = -nz0 * o.w / 4, lz = nx0 * o.w / 4;   // Fahrtrichtung zur Uferstrasse (nx0, nz0), Mitte der rechten Spur
          decal(pt[0] + lx, pt[1] + lz, nx0, nz0, 1.8, 5, 3, YM); (GDECK.sideJ || (GDECK.sideJ = [])).push([Math.round(E[0]), Math.round(E[1]), Math.round(u)]); }
      }
      // Ring-Rampe unten: Stirnwand unter dem Ende des ebenen Teils, davor Sperrflaeche (beide inneren Spuren enden bzw. beginnen), Linien, Einfaedelpfeile
      if (mid) flat(UP, rp.sg > 0 ? sub(r, rp.a - 4.5, rp.a + 0.5) : sub(r, rp.a - 0.5, rp.a + 4.5), -r.w / 2, r.w / 2, S + 0.045, 12, 4);   // Fahrbahn direkt vor dem Rampenbeginn (das Band setzt eine Probe frueher aus)
      if (mid) { cross(WA, r, wA, -RW / 2 - 0.3, RW / 2 + 0.3, LY - 0.6, DY); for (let d = -RW / 2; d <= RW / 2 + 0.01; d += 1.2) { const [x, z, nx, nz] = sub(r, wA, wA + 0.5)[0]; ring(x + nx * d, z + nz * d, 0.65, DY); }
        const YL = LY + 0.045, atL = (s, d) => { const [x, z, nx, nz] = sub(r, s, s)[0]; return [x + nx * d, z + nz * d]; }, sZ = rp.a - 20 * rp.sg, D1 = RW / 2 + 0.3, Lz = Math.abs(wA - sZ);
        const sE = rp.b + G.UZ * rp.sg, Qz = subF(r, Math.min(sZ, sE), Math.max(sZ, sE)); flat(FLT, Qz, s => half(s), s => -half(s), LY + 0.03, 4, 4, "aus");
        for (const sg of [1, -1]) { flat(LW, Qz, s => sg * (half(s) * 0.93 - 0.08), s => sg * (half(s) * 0.93 + 0.08), LY + 0.04, 4, 4, "aus");   // Randlinie
          const wl = []; for (let q = sw0; q < sw1; q += 2) wl.push(atL(q, sg * (D1 + 0.25))); wl.push(atL(sw1, sg * (D1 + 0.25))); lineW(wl, 0.16, YL);   // Linie neben der Rampenwand
          const ol = []; for (let k = 0; k <= 25; k++) { const t = k / 25; ol.push(atL(sZ + (wA - sZ) * t, sg * D1 * t)); } lineW(ol, 0.16, YL);   // Umriss der Sperrflaeche
          for (let c = 3; c < Lz - 1; c += 2.5) { const q1 = sZ + rp.sg * c, q2 = q1 + rp.sg * 1.5, d2 = D1 * Math.min(1, (c + 1.5) / Lz) - 0.25; if (d2 > 0.5) lineW([atL(q1, sg * 0.15), atL(q2, sg * d2)], 0.3, YL); } }   // Schraegstriche
        for (const u of [-62, -47, -32]) { const q = rp.a + u * rp.sg, [x, z] = atL(q, rp.sg * 2.25), [, , nx, nz] = sub(r, q, q)[0]; decal(x, z, nz * rp.sg, -nx * rp.sg, 1.8, 5, 2, LY + 0.08); }   // innere Spur endet: rechts einfaedeln
        // Auffahrt von unten (Nicolas 2026-11-14, Bild: von unten nach oben ueberarbeiten): auf den UZ m vor dem Portal fuehren die Linien weich in die Rampe:
        // gelbe Doppellinie von der Lage der 4-Spur-Textur (+-0,54) auf die der Rampe (+-0,1), Spurlinie +-4,5 erst gestrichelt, dann durchgezogen zur Wandlinie;
        // Pfeile fuer die Gegenrichtung: innen UPPER (Rampe hinauf), aussen geradeaus (unten bleiben)
        const back = sg2 => sg2 * -rp.sg, sP = t => rp.b + rp.sg * t, sm = t => t * t * (3 - 2 * t);
        for (const sg of [1, -1]) { const yl = []; for (let t = 0; t <= G.UZ; t += 1) yl.push(atL(sP(t), sg * (0.105 + (0.54 - 0.105) * sm(t / G.UZ)))); lineG(yl, 0.16, LY + 0.047);
          const LL = 15, sl = []; for (let t = 0; t <= LL; t += 1) sl.push(atL(sP(t), sg * (D1 + 0.25 + (4.5 - D1 - 0.25) * sm(t / LL)))); lineW(sl, 0.16, YL);
          for (let t = LL + 1.5; t < G.UZ; t += 6) lineW([atL(sP(t), sg * 4.5), atL(sP(Math.min(G.UZ, t + 3)), sg * 4.5)], 0.16, YL); }
        for (const t of [10, 22]) { const q = sP(t), [, , nx, nz] = sub(r, q, q)[0], fx = -nz * rp.sg, fz = nx * rp.sg; let [x, z] = atL(q, -rp.sg * 2.1); decal(x, z, fx, fz, 2.6, 6, 4, LY + 0.08); [x, z] = atL(q, -rp.sg * 6.7); decal(x, z, fx, fz, 1.6, 5, 0, LY + 0.08); }
      }
      // keine Querwand mehr: die Seitenwaende laufen im Trichter schraeg bis an die Rampenwaende
    }
    // geschlossene Enden: Wand quer ueber die ganze Breite
    for (const end of [0, 1]) { if (!(end ? r.cb : r.ca) || r.loop || (end ? r.joinB : r.joinA)) continue; const sx = end ? r.sB : r.sA; cross(WA, r, sx, -HW, HW, LY - 0.6, DY);
      for (let d = -HW; d <= HW; d += 1.2) { const [x, z, nx, nz] = sub(r, sx, sx + 0.5)[0]; ring(x + nx * d, z + nz * d, 0.65, DY); } }
    // Seitenwaende innen (Kollision), Stuetzen und Deckenleuchten alle 15 m
    { const last = { 1: null, "-1": null };   // Untergrund-Pruefung 2026-11-16: an Knickpunkten sprang die Kette um bis 1,75 m, beim Rennen kam man durch -> Zwischenkreis bei mehr als 1,25 m
    for (let s = r.sA; s <= r.sB; s += 1.2) { const [x, z, nx, nz] = sub(r, s, s + 0.5)[0]; const h = gdeckHW(r, s) - 0.65; for (const sg of [1, -1]) { if (gapsOf(r, sg).some(([a, b]) => s > a - 0.65 && s < b + 0.65)) { last[sg] = null; continue; }
      const cx = x + nx * sg * h, cz = z + nz * sg * h, L = last[sg]; if (L && Math.hypot(cx - L[0], cz - L[1]) > 1.25 && Math.hypot(cx - L[0], cz - L[1]) < 4) ring((cx + L[0]) / 2, (cz + L[1]) / 2, 0.65, DY); ring(cx, cz, 0.65, DY); last[sg] = [cx, cz]; } } }   // r 0,65 alle 1,2 m (ueberlappend, Leistung 2026-11-13)
    for (let s = r.sA + 10; s <= r.sB - 10; s += 15) { if (gdeckK(r, s) < 0.999 || mids.some(p => s > Math.min(p.a - 25 * p.sg, p.b) - 4 && s < Math.max(p.a - 25 * p.sg, p.b) + G.UZ + 5)) continue; const [x, z, nx, nz] = sub(r, s, s + 0.5)[0]; if (inOther(x, z, r, 15)) continue; posts.push([x, z]); ring(x, z, 0.6, DY); }   // an Kreuzungen unten 15 m frei zum Abbiegen, nicht im Trichter (posts.push stand seit 2026-11-13 versehentlich im Kommentar)
    // Leuchtroehren (N14, Nicolas 2026-11-17 Filmbild: dunkle Decke mit Reihen gruenlich-weisser Roehren; 2026-11-19): alle 4 m vier Reihen quer, je 1,8 m lang; auch an Kreuzungen
    for (let s = r.sA + 3; s <= r.sB - 3; s += 4) { if (gdeckK(r, s) < 0.999 || mids.some(p => s > Math.min(p.a - 25 * p.sg, p.b) - 2 && s < Math.max(p.a - 25 * p.sg, p.b) + G.UZ + 3)) continue; const [x, z, nx, nz] = sub(r, s, s + 0.5)[0], tx = -nz, tz = nx;
      for (const q of [-0.72, -0.26, 0.26, 0.72]) { const lx = x + nx * q * HW, lz = z + nz * q * HW, k = LAMP.P.length / 3;
        for (const [a, b] of [[-0.9, -0.07], [0.9, -0.07], [-0.9, 0.07], [0.9, 0.07]]) { LAMP.P.push(lx + tx * a + nx * b, DY - 0.03, lz + tz * a + nz * b); LAMP.U.push(0, 0); } LAMP.I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
    // Ampeln an den Kreuzungen unten: Eintritt in den Innenraum einer anderen unteren Strasse (alle 2 m geprueft), Mast rechts 4 m davor, Lichter zum Verkehr
    { let prev = null; for (let s = r.sA + 2; s <= r.sB - 2; s += 2) { const [x, z] = sub(r, s, s + 0.5)[0], ins = inOther(x, z, r, 0); if (prev !== null && ins !== prev) { const d = ins ? 1 : -1, sa = s - d * 5, [ax, az, anx, anz] = sub(r, sa, sa + 0.5)[0], fx = -anz * d, fz = anx * d, sg = -d;
        GDECK.ampeln.push({ x: ax + anx * sg * (HW - 1.2), z: az + anz * sg * (HW - 1.2), fx, fz, rx: -anx * d, rz: -anz * d, ph: Math.abs(fx) > Math.abs(fz) ? 0 : 1 }); } prev = ins; } }
  }
  const make = (Gm, m, name) => { if (!Gm.I.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(Gm.P, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(Gm.U, 2)); g.setIndex(Gm.I); g.computeVertexNormals(); g.computeBoundingSphere();
    return gsplit(g, m, name, { cast: name !== "Gotham-Untere Strasse Leuchten", free: /Waende|Decke|Deckplatten|Gehsteige|Leuchten|Sperr|Trichter|Mittellinie|Randlinien/.test(name) }); };
  const postG = posts.map(([x, z]) => new THREE.CylinderGeometry(0.45, 0.5, DY - LY, 12).translate(x, (LY + DY) / 2, z));
  GDECK.meshes = [make(MK, mat(mkTex, 3.5, 0xffffff, { alphaTest: 0.5 }), "Gotham-Rampen Markierung"), make(FL, mat(lines(true), 2), "Gotham-Untere Strasse"), make(FLT, mat(plainT, 2), "Gotham-Untere Strasse Trichter"), make(FLX, mat(plainT, 2.5), "Gotham-Untere Kreuzungen"), make(FLB, mat(plainT, 1), "Gotham-Untere Bodenplatte"), make(LG, M(0xd9b23c, { roughness: 0.8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), "Gotham-Untere Strasse Mittellinie"), make(LW, M(0xd8d8d2, { roughness: 0.8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), "Gotham-Untere Strasse Randlinien"), make(FL2, mat(lines(false), 2), "Gotham-Untere Strasse Rampen"), make(WK, mat(walkT, 1), "Gotham-Untere Strasse Gehsteige"),
    make(CE, mat(conc, 0, 0x6e6c68), "Gotham-Untere Strasse Decke"), make(WA, mat(conc, 0), "Gotham-Untere Strasse Waende"), make(CO, mat(walkT, 0.5), "Gotham-Deckplatten"),
    make(UP, mat(plainT, 2), "Gotham-Spuren neben Rampen"), make(LAMP, GDECK.lampM = M(0xeefff0, { emissive: 0xd8f5d6, emissiveIntensity: 1.3, side: THREE.DoubleSide }), "Gotham-Untere Strasse Leuchten")];   // gruenlich-weiss (Leuchtroehren)
  gampelBau(LY);
  if (postG.length) { const m = new THREE.Mesh(mergeGeometries(postG, false), M(0x8a8782, { roughness: 0.9 })); m.name = "Gotham-Untere Strasse Stuetzen"; m.castShadow = m.receiveShadow = true; m.userData.keep = true; m.userData.noLift = true; scene.add(m); GDECK.meshes.push(m); }
  GDECK.nCircles = circles.length - nCirc;
}

// Ampeln (N14): Mast, Gehaeuse mit Rot/Gelb/Gruen zum Verkehr, Fussgaengersignal seitlich; als InstancedMesh. Takt 24 s: Richtung 0 (eher x) gruen 0-9, gelb 9-11, rot 11-24;
// Richtung 1 versetzt um 12 s; Fussgaenger gruen, wenn ihre Fahrzeugrichtung rot hat. gampelStep (schleife.js) setzt die Lampen nur bei einem Wechsel.
function gampelBau(LY) { const A = GDECK.ampeln, n = A.length; if (!n) return; const q = new THREE.Object3D(), M = (c, e) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.3, ...(e ? { emissive: e, emissiveIntensity: 1.6 } : {}) });
  const mk = (geo, m, cnt) => { const im = new THREE.InstancedMesh(geo, m, cnt); im.userData.keep = true; im.userData.noLift = true; im.frustumCulled = false; scene.add(im); return im; };
  const mast = mk(new THREE.CylinderGeometry(0.07, 0.08, 3.4, 8), M(0x2a2c30), n), geh = mk(new THREE.BoxGeometry(0.34, 0.95, 0.28), M(0x16171a), n), fg = mk(new THREE.BoxGeometry(0.3, 0.55, 0.22), M(0x16171a), n);
  const L = {}; for (const [k, c, y] of [["r", 0xff2a20, 0.3], ["y", 0xffb020, 0], ["g", 0x30ff70, -0.3]]) L[k] = { on: mk(new THREE.CircleGeometry(0.1, 14), new THREE.MeshBasicMaterial({ color: c }), n), y };
  const P = { r: mk(new THREE.CircleGeometry(0.075, 12), new THREE.MeshBasicMaterial({ color: 0xff3a30 }), n), g: mk(new THREE.CircleGeometry(0.075, 12), new THREE.MeshBasicMaterial({ color: 0x40ff80 }), n) };
  A.forEach((a, i) => { const h = Math.atan2(-a.fx, -a.fz); q.rotation.set(0, h, 0); q.position.set(a.x, LY + 1.7, a.z); q.updateMatrix(); mast.setMatrixAt(i, q.matrix);
    q.position.set(a.x, LY + 3.2, a.z); q.updateMatrix(); geh.setMatrixAt(i, q.matrix); q.position.set(a.x + a.rx * 0.25, LY + 2.2, a.z + a.rz * 0.25); q.rotation.set(0, h, 0); q.updateMatrix(); fg.setMatrixAt(i, q.matrix); });
  GDECK.amp = { L, P, LY, ph: -1 }; gampelStep(true);
  // Sicherungskasten an der Wand je Ampel (N15 "Lichter aus"): Rechtsklick schaltet den Strom unten ab bzw. wieder an
  A.forEach(a => lichtKasten("unten", a.x + a.rx * 1.05 - a.fx * 2, LY + 1.4, a.z + a.rz * 1.05 - a.fz * 2, -a.rx, -a.rz)); }
// Stromausfall unten (N15, Nicolas 2026-11-17 Idee "Lichter aus und Nachtsichtbrille"; gebaut 2026-11-19 nur fuer die unteren Strassen): Roehren und Ampeln aus, Kunstlicht unter der Erde
// fast aus (applyNight, tag-nacht.js), nach 90 s von selbst wieder an. Mit der Nachtsichtbrille (Kopf, B) sieht man weiter.
function lichtAus(an, id = "unten") { const B = LICHT_AUS.B[id]; if (!B) return; B.on = an; B.t = an ? 90 : 0; B.set(an);
  for (const g of B.gates) g.verbs = an ? ["Strom einschalten", "Strom einschalten"] : ["Strom abschalten", "Strom abschalten"];
  if (typeof toast === "function") toast(an ? "Strom " + B.text + " abgeschaltet – 90 s dunkel (Nachtsichtbrille: B)" : "Strom " + B.text + " wieder an"); }
function gampelStep(force) { if (LICHT_AUS.pend && typeof gates !== "undefined") { LICHT_AUS.pend = false; const i0 = LICHT_AUS.gi || 0; gates.push(...LICHT_AUS.gates.slice(i0)); LICHT_AUS.gi = LICHT_AUS.gates.length; }   // Sicherungskaesten erst jetzt in gates (tore.js laedt spaeter)
  { const L = LICHT_AUS, dt = Math.min(0.1, (performance.now() - (L.last || performance.now())) / 1000); L.last = performance.now(); for (const id in L.B) { const B = L.B[id]; if (B.on && (B.t -= dt) <= 0) lichtAus(false, id); }
    const pp = typeof player !== "undefined" ? player.pos : null, zu = !!pp && typeof walking !== "undefined" && walking, kz = zu && Object.values(L.B).some(B => B.on && B.drin(pp)) ? 1 : 0; if (L.k !== kz) { L.k = L.k < kz ? Math.min(kz, L.k + dt * 3) : Math.max(kz, L.k - dt * 1.5); if (typeof applyNight === "function") applyNight(); } }
  const G = GDECK.amp; if (!G) return; const t = (performance.now() / 1000) % 24, st = k => { const u = (t - k * 12 + 24) % 24; return u < 9 ? "g" : u < 11 ? "y" : "r"; }, key = st(0) + st(1);
  if (!force && key === G.ph) return; G.ph = key; const A = GDECK.ampeln, q = new THREE.Object3D(), z = new THREE.Matrix4().makeScale(0, 0, 0);
  A.forEach((a, i) => { const s = st(a.ph), h = Math.atan2(-a.fx, -a.fz), hp = h;
    for (const k of ["r", "y", "g"]) { if (k !== s) { G.L[k].on.setMatrixAt(i, z); continue; } q.position.set(a.x - a.fx * 0.15, G.LY + 3.2 + G.L[k].y, a.z - a.fz * 0.15); q.rotation.set(0, h, 0); q.updateMatrix(); G.L[k].on.setMatrixAt(i, q.matrix); }
    const fp = s === "r" ? "g" : "r", ex = a.x + a.rx * 0.25 - a.fx * 0.12, ez = a.z + a.rz * 0.25 - a.fz * 0.12; for (const k of ["r", "g"]) { if (k !== fp) { G.P[k].setMatrixAt(i, z); continue; } q.position.set(ex, G.LY + 2.2 + (k === "r" ? 0.12 : -0.12), ez); q.rotation.set(0, hp, 0); q.updateMatrix(); G.P[k].setMatrixAt(i, q.matrix); } });
  for (const k of ["r", "y", "g"]) G.L[k].on.instanceMatrix.needsUpdate = true; for (const k of ["r", "g"]) G.P[k].instanceMatrix.needsUpdate = true; }
