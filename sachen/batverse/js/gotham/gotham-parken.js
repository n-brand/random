// Batverse – Gotham: Taxi-Depot und Parken (PLAN-GOTHAM V3/V4; Orte "taxi" und "parkhaus-1".."parkhaus-5" aus daten.js). Klassisches Skript nach gotham-bunker.js.
// V3 Taxi-Depot: Asphalthof mit Maschendrahtzaun und Tor, offene Wagenhalle, Buero, Zapfsaeule, Schild; 12 abgestellte Gotham-Taxis (fahrbar, spaet gebaut).
// V4 Parkhaeuser: je 5 Ebenen (3,2 m), oberste offen, Rampen an einer Laengsseite uebereinander (alle in dieselbe Richtung, 15 %), Bruestungen, Stuetzen,
//    Treppenturm mit P-Schild, geparkte Autos (eine Instanz-Liste). Befahrbar: Decks und Rampen als dkAdd (Rampen mit Neigung g).
// V4 Tiefgaragen: an grossen Gebaeuden (Kratzer/Buero ab 1500 m2) eine Einfahrt an der Front (dunkle Oeffnung, gelb-schwarzer Rahmen, P-Schild); innen nicht befahrbar.
"use strict";
const GPK = { done: false };
function* gpkGen() {
  while (!GSTR.done || !GGEB.done) yield "wait";
  gbvInit();
  let ax, az, e2; const setAx = o => { [ax, az] = gotAxis(o.x, o.z); e2 = [-az, ax]; }, Y = GOT.STR, out = new Map(), col = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };   // Achse je Ort (Werkstatt dreht einzeln)
  const frameOf = o => { const [cx, cz] = GOT.toGame(o.x, o.z), P0 = [cx - ax * o.w / 2 - e2[0] * o.d / 2, cz - az * o.w / 2 - e2[1] * o.d / 2]; return gbvFrame({ P0, e1: [ax, az], e2, L1: o.w, L2: o.d }); };
  const frontOf = (f, L1, L2) => { const out4 = [[0, -1], [1, 0], [0, 1], [-1, 0]]; let front = 0, bd = 1e9;
    for (let k = 0; k < 4; k++) { const sd = f.side(k), ms = sd[0] + sd[2] * sd[6] / 2, mt = sd[1] + sd[3] * sd[6] / 2; for (let d = 1; d < 30; d += 1.5) { const p = f.W(ms + out4[k][0] * d, mt + out4[k][1] * d, 0); if (GSTR.onRoad(p[0], p[2], 0)) { if (d < bd) { bd = d; front = k; } break; } } } return front; };
  const dkB = (f, s, t, ls, lt, y0, y1, o = {}) => { const p = f.W(s, t, 0); return dkAdd(Object.assign({ cx: p[0], cy: (y0 + y1) / 2, cz: p[2], ux: ax, uz: az, hl: ls / 2, hw: lt / 2, hh: (y1 - y0) / 2, m: 0.1 }, o)); };
  const signTex = (txt, bg, fg, w = 512, h = 96) => canvasTex(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; let px = h * 0.6; c.font = "bold " + px + "px Arial, sans-serif"; while (c.measureText(txt).width > w - 24 && px > 10) { px -= 2; c.font = "bold " + px + "px Arial, sans-serif"; } c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, w / 2, h / 2 + 2); });
  const M = { zaun: new THREE.MeshStandardMaterial({ map: (() => { const t = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "#9aa0a6"; c.lineWidth = 3; for (let k = -64; k < 128; k += 16) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + 64, 64); c.stroke(); c.beginPath(); c.moveTo(k + 64, 0); c.lineTo(k, 64); c.stroke(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })(), alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.5, roughness: 0.5 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x34363a, roughness: 0.95 }), dunkel: new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 1 }),
    taxiSchild: new THREE.MeshStandardMaterial({ map: signTex("GOTHAM CAB CO. · DEPOT", "#f2c200", "#151515"), roughness: 0.6 }), pSchild: new THREE.MeshStandardMaterial({ map: signTex("P", "#1f5fd0", "#ffffff", 128, 128), emissive: 0xffffff, emissiveMap: signTex("P", "#1f5fd0", "#ffffff", 128, 128), emissiveIntensity: 0.3 }),
    streifen: new THREE.MeshStandardMaterial({ map: (() => { const t = canvasTex(64, 64, (c, w, h) => { for (let k = -64; k < 128; k += 16) { c.fillStyle = (k / 16) % 2 ? "#151515" : "#f2c200"; c.beginPath(); c.moveTo(k, 0); c.lineTo(k + 8, 0); c.lineTo(k + 72, 64); c.lineTo(k + 64, 64); c.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })(), roughness: 0.7 }),
    linie: new THREE.MeshStandardMaterial({ color: 0xe8e8e0, roughness: 0.8 }) };
  const quadKey = (key, a, b, c, d, n, uv) => gbvQuad(gbvBucket(out, key), a, b, c, d, n, uv || [[0, 0], [1, 0], [1, 1], [0, 1]]);
  // ---------- V3 Taxi-Depot ----------
  const OT = GOTHAM.orte.find(o => o.id === "taxi");
  if (OT) { setAx(OT); const f = frameOf(OT), L1 = OT.w, L2 = OT.d, k = frontOf(f, L1, L2), [As, At, ds, dt, os, ot] = f.side(k), at = (u, w) => [As + ds * u - os * w, At + dt * u - ot * w], P = (u, w, y) => { const [s, t] = at(u, w); return f.W(s, t, y); };
    const D = k % 2 ? L1 : L2, Wd = k % 2 ? L2 : L1, nrm = (a, b) => { const U = f.dirW(ds, dt), V = f.dirW(-os, -ot); return [U[0] * a + V[0] * b, 0, U[2] * a + V[2] * b]; };   // u entlang der Front (0..Wd), w nach hinten (0..D)
    const bx = (key, u, w, lu, lw, y0, y1, c) => { const [s, t] = at(u, w); gbvBox(out, key, f, s, t, ds ? lu : lw, ds ? lw : lu, y0, y1, c); }, dk = (u, w, lu, lw, y0, y1, o) => { const [s, t] = at(u, w); dkB(f, s, t, ds ? lu : lw, ds ? lw : lu, y0, y1, o); };
    quadKey("asphalt", P(0, 0, Y + 0.05), P(Wd, 0, Y + 0.05), P(Wd, D, Y + 0.05), P(0, D, Y + 0.05), [0, 1, 0]);
    for (let u = 3; u < Wd - 3; u += 3.2) quadKey("linie", P(u, D - 21, Y + 0.07), P(u + 0.12, D - 21, Y + 0.07), P(u + 0.12, D - 15, Y + 0.07), P(u, D - 15, Y + 0.07), [0, 1, 0]);   // Stellplatzlinien im Hof
    // Zaun rundum (2,2 m), Tor vorne in der Mitte (8 m offen)
    const fence = (u0, w0, u1, w1, n) => { const L = Math.hypot(u1 - u0, w1 - w0); quadKey("zaun", P(u0, w0, Y), P(u1, w1, Y), P(u1, w1, Y + 2.2), P(u0, w0, Y + 2.2), n, [[0, 0], [L / 1.2, 0], [L / 1.2, 2.2 / 1.2], [0, 2.2 / 1.2]]);
      for (let s = 0; s <= L; s += 3) { const u = u0 + (u1 - u0) * s / L, w = w0 + (w1 - w0) * s / L; bx("eisen", u, w, 0.08, 0.08, Y, Y + 2.3); }
      const um = (u0 + u1) / 2, wm = (w0 + w1) / 2; dk(um, wm, Math.max(0.2, Math.abs(u1 - u0)), Math.max(0.2, Math.abs(w1 - w0)), Y, Y + 2.2, { floor: 0 }); };
    fence(0.3, 0.3, Wd / 2 - 4, 0.3, nrm(0, -1)); fence(Wd / 2 + 4, 0.3, Wd - 0.3, 0.3, nrm(0, -1)); fence(Wd - 0.3, 0.3, Wd - 0.3, D - 0.3, nrm(1, 0)); fence(0.3, D - 0.3, 0.3, 0.3, nrm(-1, 0));
    // Wagenhalle hinten (Breite Wd - 6, 12 m tief, 6 m hoch, vorne offen): Rueckwand, Seiten, Blechdach, Stuetzen
    const hw0 = 3, hw1 = Wd - 3, hd0 = D - 13, hd1 = D - 1;
    bx("blech", (hw0 + hw1) / 2, hd1 - 0.15, hw1 - hw0, 0.3, Y, Y + 6); bx("blech", hw0 + 0.15, (hd0 + hd1) / 2, 0.3, hd1 - hd0, Y, Y + 6); bx("blech", hw1 - 0.15, (hd0 + hd1) / 2, 0.3, hd1 - hd0, Y, Y + 6); bx("dach", (hw0 + hw1) / 2, (hd0 + hd1) / 2, hw1 - hw0 + 0.6, hd1 - hd0 + 1, Y + 6, Y + 6.4);
    for (let u = hw0 + 6; u < hw1 - 3; u += 6) bx("eisen", u, hd0 + 0.2, 0.3, 0.3, Y, Y + 6);
    dk((hw0 + hw1) / 2, hd1 - 0.15, hw1 - hw0, 0.3, Y, Y + 6, { floor: 0 }); dk(hw0 + 0.15, (hd0 + hd1) / 2, 0.3, hd1 - hd0, Y, Y + 6, { floor: 0 }); dk(hw1 - 0.15, (hd0 + hd1) / 2, 0.3, hd1 - hd0, Y, Y + 6, { floor: 0 }); dk((hw0 + hw1) / 2, (hd0 + hd1) / 2, hw1 - hw0, hd1 - hd0, Y + 6, Y + 6.4);
    { const [s, t] = at((hw0 + hw1) / 2, hd0 - 0.05), p = f.W(s, t, Y + 5.2), n = nrm(0, -1), Rr = [n[2], 0, -n[0]], w = 14, h = 2.4, Pt = (a, b) => [p[0] + Rr[0] * a, p[1] + b, p[2] + Rr[2] * a]; quadKey("taxiSchild", Pt(-w / 2, -h / 2), Pt(w / 2, -h / 2), Pt(w / 2, h / 2), Pt(-w / 2, h / 2), n); }
    // Buero (Container) und Zapfsaeule
    bx("farbe", 4.5, 6, 6, 3, Y, Y + 2.8, col(0xe8e2d0)); bx("glas", 4.5, 4.48, 3, 0.05, Y + 1, Y + 2.2); dk(4.5, 6, 6, 3, Y, Y + 2.8); bx("farbe", Wd - 6, 7, 1, 0.6, Y, Y + 1.9, col(0xc0392b)); bx("dach", Wd - 6, 7, 5, 4, Y + 4.5, Y + 4.8); bx("eisen", Wd - 6, 7, 0.25, 0.25, Y, Y + 4.5);
    // Taxis: 6 in der Halle, 6 im Hof (fahrbar, spaet gebaut), Front zur Hofmitte
    if (typeof addVehicle === "function" && typeof SPEC_TAXI !== "undefined") { const n = nrm(0, -1), hFwd = Math.atan2(-n[0], -n[2]), n2 = nrm(0, 1), hBack = Math.atan2(-n2[0], -n2[2]);
      for (let i = 0; i < 6; i++) { const [s, t] = at(hw0 + 3 + i * (hw1 - hw0 - 6) / 5, hd0 + 6), p = f.W(s, t, 0); addVehicle(SPEC_TAXI, () => buildTaxi(), p[0], p[2], Y, hFwd, "Gotham Taxi (Depot)", 0xf2c200); }
      for (let i = 0; i < 6; i++) { const [s, t] = at(4.6 + i * 3.2, D - 18), p = f.W(s, t, 0); addVehicle(SPEC_TAXI, () => buildTaxi(), p[0], p[2], Y, hBack, "Gotham Taxi (Depot)", 0xf2c200); } }
    if (typeof gpaBay === "function") { const n = nrm(0, -1), hFwd = Math.atan2(-n[0], -n[2]), n2 = nrm(0, 1), hBack = Math.atan2(-n2[0], -n2[2]);   // Stellplaetze mit P: Hof (alle Linien) und Halle
      for (let u = 4.6; u < Wd - 4; u += 3.2) { const [s, t] = at(u, D - 18), p = f.W(s, t, 0); gpaBay(p[0], Y, p[2], hBack, 3, 6, "Taxi-Depot Hof"); }
      for (let i = 0; i < 6; i++) { const [s, t] = at(hw0 + 3 + i * (hw1 - hw0 - 6) / 5, hd0 + 6), p = f.W(s, t, 0); gpaBay(p[0], Y, p[2], hFwd, 3, 6, "Taxi-Depot Halle"); } }
    bautAdd({ id: "GO-TAXI", name: "Taxi-Depot", art: "Gebäude", poly: [P(0, 0, 0), P(Wd, 0, 0), P(Wd, D, 0), P(0, D, 0)].map(p => [p[0], p[2]]), y0: Y - 1, y1: Y + 7, info: "Gotham Cab Co. · 12 Taxis" });
    yield; }
  // ---------- V4 Parkhaeuser ----------
  const cars = [], PAL = [0x8c1c1c, 0x1c3f8c, 0xd0d0d0, 0x222222, 0x3d6b3d, 0x9a9a9a, 0xc7a83a, 0x5a2a6a];
  for (const OP of GOTHAM.orte.filter(o => /^parkhaus-/.test(o.id))) {
    setAx(OP);
    const f = frameOf(OP), L1 = OP.w, L2 = OP.d, NL = 5, LH = 3.2, lane = 4.2, rA0 = 7, rA1 = rA0 + LH / 0.15;   // Rampen entlang s (L1) bei t 0.4..lane, s rA0..rA1
    for (let lv = 1; lv < NL; lv++) { const y = Y + lv * LH;
      // Deck ohne Rampenschlitz: Hauptflaeche (t > lane), Spur vor und hinter der Rampe
      for (const [s0, s1, t0, t1] of [[0, L1, lane, L2], [0, rA0, 0, lane], [rA1, L1, 0, lane]]) { gbvBox(out, "beton", f, (s0 + s1) / 2, (t0 + t1) / 2, s1 - s0, t1 - t0, y - 0.3, y, null, true, true); dkB(f, (s0 + s1) / 2, (t0 + t1) / 2, s1 - s0, t1 - t0, y - 0.3, y); }
      // Bruestung 1 m (Beton) rundum, offen nur ... (keine Oeffnungen oben noetig)
      for (const [s, t, ls, lt] of [[L1 / 2, 0.15, L1, 0.3], [L1 / 2, L2 - 0.15, L1, 0.3], [0.15, L2 / 2, 0.3, L2], [L1 - 0.15, L2 / 2, 0.3, L2]]) { gbvBox(out, "beton", f, s, t, ls, lt, y, y + 1); dkB(f, s, t, ls, lt, y, y + 1, { floor: 0 }); }
      // Parklinien und geparkte Autos (zwei Reihen quer, Fahrgasse in der Mitte)
      for (let s = 2.5; s < L1 - 2.5; s += 2.6) { for (const [t0, t1] of [[lane + 0.5, lane + 5.5], [L2 - 5.5, L2 - 0.5]]) { const p0 = f.W(s, t0, y + 0.02), p1 = f.W(s + 0.1, t0, y + 0.02), p2 = f.W(s + 0.1, t1, y + 0.02), p3 = f.W(s, t1, y + 0.02); quadKey("linie", p0, p1, p2, p3, [0, 1, 0]);
          if (s + 2.6 < L1 - 2.5) { const c = f.W(s + 1.3, (t0 + t1) / 2, y), fw = f.dirW(0, t0 < L2 / 2 ? 1 : -1), h = Math.atan2(-fw[0], -fw[2]);   // Front zur Fahrgasse
            if (typeof gpaBay === "function") gpaBay(c[0], y, c[2], h, 2.5, 5, "Parkhaus Ebene " + lv);   // Stellplatz mit P (gotham-parkautos.js)
            if (((s * 7 + lv * 3 + t0) | 0) % 3 !== 0) { if (typeof gpaSlot === "function") cars.push(gpaSlot(c[0], y, c[2], h, null, null, "Parkhaus")); else cars.push([c[0], y, c[2], PAL[((s * 13 + lv * 5 + t0) | 0) % PAL.length]]); } } } } }
    // Rampen (je Ebene eine, uebereinander, alle in +s): dkAdd mit Neigung g entlang s
    for (let lv = 0; lv < NL - 1; lv++) { const y0 = Y + lv * LH + (lv ? 0 : 0.02), y1 = Y + (lv + 1) * LH, o = gbvBucket(out, "beton"), tA = 0.4, tB = lane;
      gbvQuad(o, f.W(rA0, tA, y0), f.W(rA1, tA, y1), f.W(rA1, tB, y1), f.W(rA0, tB, y0), [0, 1, 0], [[0, 0], [7, 0], [7, 1.3], [0, 1.3]]); gbvQuad(o, f.W(rA0, tA, y0 - 0.3), f.W(rA1, tA, y1 - 0.3), f.W(rA1, tB, y1 - 0.3), f.W(rA0, tB, y0 - 0.3), [0, -1, 0], [[0, 0], [7, 0], [7, 1.3], [0, 1.3]]);
      gbvQuad(gbvBucket(out, "streifen"), f.W(rA0, tB, y0), f.W(rA1, tB, y1), f.W(rA1, tB, y1 + 0.5), f.W(rA0, tB, y0 + 0.5), f.dirW(0, 1), [[0, 0], [10, 0], [10, 0.25], [0, 0.25]]);   // Kante zur Fahrgasse
      const g = (y1 - y0) / (rA1 - rA0), SEG = 0.5;   // in 0,5-m-Stuecken: ein einziges geneigtes Teil wirkt seitlich wie eine Wand (dkPush prueft y0..y1)
      for (let s0 = rA0; s0 < rA1 - 1e-6; s0 += SEG) { const s1 = Math.min(rA1, s0 + SEG), yc = y0 + g * ((s0 + s1) / 2 - rA0), pm = f.W((s0 + s1) / 2, (tA + tB) / 2, 0); dkAdd({ cx: pm[0], cy: yc - 0.15, cz: pm[2], ux: ax, uz: az, hl: (s1 - s0) / 2, hw: (tB - tA) / 2, hh: 0.15, g, m: 0, ceil: 0 }); } }
    // Stuetzen (nicht in Fahrgasse/Rampen), Treppenturm mit P-Schild
    for (let s = 8; s < L1 - 4; s += 8) for (const t of [lane + 5.7, L2 - 5.7]) { gbvBox(out, "beton", f, s, t, 0.5, 0.5, Y, Y + (NL - 1) * LH - 0.3); dkB(f, s, t, 0.5, 0.5, Y, Y + (NL - 1) * LH, { floor: 0 }); }
    gbvBox(out, "stein", f, L1 - 2.5, L2 - 2.5, 5, 5, Y, Y + OP.h); dkB(f, L1 - 2.5, L2 - 2.5, 4.6, 4.6, Y, Y + OP.h);
    for (const [k, nn] of [[0, f.dirW(0, -1)], [1, f.dirW(1, 0)]]) { const c = f.W(k ? L1 + 0.02 : L1 - 2.5, k ? L2 - 2.5 : L2 - 5.02, Y + OP.h - 2.2), Rr = [nn[2], 0, -nn[0]], P = (a, b) => [c[0] + Rr[0] * a, c[1] + b, c[2] + Rr[2] * a]; quadKey("pSchild", P(-1.6, -1.6), P(1.6, -1.6), P(1.6, 1.6), P(-1.6, 1.6), nn); }
    bautAdd({ id: "GO-" + OP.id.toUpperCase(), name: "Parkhaus", art: "Gebäude", poly: [f.W(0, 0, 0), f.W(L1, 0, 0), f.W(L1, L2, 0), f.W(0, L2, 0)].map(p => [p[0], p[2]]), y0: Y - 1, y1: Y + OP.h, info: NL + " Ebenen, Rampen 15 %" });
    yield; }
  // ---------- V4 Tiefgaragen-Einfahrten an grossen Gebaeuden ----------
  let nE = 0;
  for (const b of GGEB.list) { if (!(b.type === "kratzer" || b.type === "buero") || b.F.L1 * b.F.L2 < 1500) continue;
    const F = b.F, ins = b.ins || [0, 0, 0, 0], f = gbvFrame({ P0: F.P0, e1: F.e1, e2: F.e2, L1: F.L1, L2: F.L2 }), k = b.front, sd = f.side(k), L = sd[6], [As, At, ds, dt, os, ot] = sd;
    const u = L - ins[(k + 1) % 4] - 5, w = ins[k] - 0.03; if (u < 8) continue;   // 5 m vom Ende der Front, auf der Fassade
    const at = (uu, ww) => [As + ds * uu - os * ww, At + dt * uu - ot * ww], P = (uu, ww, y) => { const [s, t] = at(uu, ww); return f.W(s, t, y); }, n = f.dirW(os, ot);
    quadKey("dunkel", P(u - 1.8, w, Y + 0.02), P(u + 1.8, w, Y + 0.02), P(u + 1.8, w, Y + 2.6), P(u - 1.8, w, Y + 2.6), n);
    for (const [a, b2, c, d] of [[u - 2.1, u - 1.8, Y, Y + 2.9], [u + 1.8, u + 2.1, Y, Y + 2.9], [u - 2.1, u + 2.1, Y + 2.6, Y + 2.9]]) quadKey("streifen", P(a, w - 0.02, c), P(b2, w - 0.02, c), P(b2, w - 0.02, d), P(a, w - 0.02, d), n, [[0, 0], [(b2 - a) * 2, 0], [(b2 - a) * 2, (d - c) * 2], [0, (d - c) * 2]]);
    const c = P(u + 3, w - 0.04, Y + 3.4), Rr = [n[2], 0, -n[0]], Q = (a, bb) => [c[0] + Rr[0] * a, c[1] + bb, c[2] + Rr[2] * a]; quadKey("pSchild", Q(-0.5, -0.5), Q(0.5, -0.5), Q(0.5, 0.5), Q(-0.5, 0.5), n);
    nE++; if (nE % 30 === 0) yield; }
  // ---------- Netze ----------
  const grp = new THREE.Group(); grp.name = "Gotham Parken"; grp.userData.keep = true; grp.userData.noLift = true; const GM = gbvInit();
  for (const [key, o] of out) { if (!o.p.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2)); if (o.c.length) geo.setAttribute("color", new THREE.Float32BufferAttribute(o.c, 3));
    const m = new THREE.Mesh(geo, M[key] || GM[key]); m.castShadow = key !== "linie" && key !== "dunkel"; m.receiveShadow = true; m.name = "Parken " + key; grp.add(m); }
  scene.add(grp); yield;
  // geparkte Autos (Karosserie + Kabine, eine Instanz-Liste je Teil)
  if (cars.length && typeof gpaLod === "function") { gpaLod(cars, "Parkhaus Autos"); cars.length = 0; }   // fahrbar und zerstoerbar, nah echt (Nicolas 2026-11-23)
  if (cars.length) { const body = new THREE.BoxGeometry(1.8, 0.75, 4.3), cab = new THREE.BoxGeometry(1.6, 0.6, 2.2); body.translate(0, 0.55, 0); cab.translate(0, 1.2, 0.2);
    const mb = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.4 }), mc = new THREE.MeshStandardMaterial({ color: 0x1a222c, roughness: 0.15, metalness: 0.6 }), ib = new THREE.InstancedMesh(body, mb, cars.length), ic = new THREE.InstancedMesh(cab, mc, cars.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(e2[0], e2[1])), cc = new THREE.Color();
    cars.forEach(([x, y, z, h], i) => { m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)); ib.setMatrixAt(i, m4); ic.setMatrixAt(i, m4); ib.setColorAt(i, cc.set(h)); }); ib.castShadow = ic.castShadow = true; ib.name = "Parkhaus Autos"; scene.add(ib, ic); }
  GPK.info = { cars: cars.length, einfahrten: nE };
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (GPK.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = gpkGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { GPK.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
