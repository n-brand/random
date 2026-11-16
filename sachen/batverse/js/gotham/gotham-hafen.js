// Batverse – Gotham: Hafen / Containerterminal an der Inselspitze (PLAN-GOTHAM Phase 3, P3a; Ort "hafen" aus daten.js)
// Klassisches Skript nach gotham-polizei.js. Die Kaikante wird aus der Kueste bestimmt (Gerade durch die Uferpunkte des Ortes, ca. 190 m),
// alles liegt in diesem Rahmen: s entlang der Kante, t landeinwaerts (t = 0 Wasserkante, Kai 0..12 m).
// Vier Containerbruecken (Portalkraene) mit fahrender Katze und Spreader, ein Containerschiff am Kai, Containerlager in Bloecken (1-4 hoch,
// nur wo frei: keine Strasse, kein Gehsteig, kein Gebaeude), Betonflaeche, zwei Lagerhallen, Lichtmasten. Container begehbar (dkAdd).
"use strict";
const GHAF = { done: false, anim: null };
function* ghafGen() {
  while (!GSTR.done || !GGEB.done || !GBST.done) yield "wait";
  const O = GOTHAM.orte.find(o => o.id === "hafen"); if (!O) return;
  const [ocx, ocz] = GOT.toGame(O.x, O.z), rt = GOTHAM.manorLage.dreh * Math.PI / 180, ax = Math.cos(rt), az = -Math.sin(rt), bx = -az, bz = ax;
  const OW = (a, b) => [ocx + a * ax + b * bx, ocz + a * az + b * bz];
  // Uferpunkte (erste Wasserstelle in +b) zwischen a -225 und -35, Ausgleichsgerade
  const C = []; for (let a = -225; a <= -35; a += 5) for (let b = -60; b < 90; b += 0.25) { const [x, z] = OW(a, b); if (GOT.edgeSD(x, z) > 0) { C.push([x, z]); break; } }
  if (C.length < 10) return; yield;
  let mx = 0, mz = 0; for (const [x, z] of C) { mx += x; mz += z; } mx /= C.length; mz /= C.length;
  let sxx = 0, sxz = 0, szz = 0; for (const [x, z] of C) { sxx += (x - mx) ** 2; sxz += (x - mx) * (z - mz); szz += (z - mz) ** 2; }
  const th = 0.5 * Math.atan2(2 * sxz, sxx - szz); let dx = Math.cos(th), dz = Math.sin(th);
  if (dx * ax + dz * az < 0) { dx = -dx; dz = -dz; }
  let nx = -dz, nz = dx; if (nx * bx + nz * bz > 0) { nx = -nx; nz = -nz; }   // n: landeinwaerts (gegen +b)
  let s0 = 1e9, s1 = -1e9, tmin = 1e9, tmax = -1e9; for (const [x, z] of C) { const s = (x - mx) * dx + (z - mz) * dz, t = (x - mx) * nx + (z - mz) * nz; s0 = Math.min(s0, s); s1 = Math.max(s1, s); tmin = Math.min(tmin, t); tmax = Math.max(tmax, t); }
  const L = s1 - s0, P0 = [mx + dx * s0 + nx * tmin, mz + dz * s0 + nz * tmin];   // t = 0: aeusserster Uferpunkt (Kante liegt dort ueber dem Wasser)
  const f = gbvFrame({ P0, e1: [dx, dz], e2: [nx, nz], L1: L, L2: 120 }), Y = GOT.STR, WY = GOT.WY;
  const Wp = (s, t) => { const p = f.W(s, t, 0); return [p[0], p[2]]; };
  const free = (s, t) => { const [x, z] = Wp(s, t); return GOT.edgeSD(x, z) < -KAI.breite - 1 && !GSTR.onRoad(x, z, 1) && !GSTR.walkAt(x, z) && !bautAt(x, Y + 1, z); };
  const rectFree = (sa, sb, ta, tb, st = 4) => { for (let s = sa; s <= sb + 0.01; s += st) for (let t = ta; t <= tb + 0.01; t += st) if (!free(Math.min(s, sb), Math.min(t, tb))) return false; return true; };
  const out = new Map(), col = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  // Betonflaeche: 6-m-Zellen hinter dem Kai, wo frei
  // Nicolas 2026-11-16: Kranschiene/Fundament darf nicht ueber die Kaikante ragen -> wasserseitiges Bein 3 m hinter dem innersten Uferpunkt (+ Bruestung)
  const TA = Math.max(4, tmax - tmin + 3 + KAI.dicke), TB = TA + 26, TM = TA + 13;
  const CS = 6, cells = []; let tMax = 0;
  for (let s = -10; s < L + 10; s += CS) for (let t = KAI.breite; t < 115; t += CS) if (free(s + CS / 2, t + CS / 2) || t < KAI.breite + CS) { cells.push([s, t]); tMax = Math.max(tMax, t + CS); }
  { const o = gbvBucket(out, "beton"); for (const [s, t] of cells) gbvQuad(o, f.W(s, t, Y + 0.04), f.W(s + CS, t, Y + 0.04), f.W(s + CS, t + CS, Y + 0.04), f.W(s, t + CS, Y + 0.04), [0, 1, 0], [[s / 3, t / 3], [(s + CS) / 3, t / 3], [(s + CS) / 3, (t + CS) / 3], [s / 3, (t + CS) / 3]]); }
  const onPlate = (s, t) => cells.some(([a, b]) => s >= a && s < a + CS && t >= b && t < b + CS);
  yield;
  // Container (eine Instanz-Liste fuer Lager und Schiff): [s, t, y, Farbe]
  const CL = 12.19, CW = 2.44, CHt = 2.59, PAL = [0xb33a2e, 0x2c5f8e, 0x3d7a4a, 0xd9822b, 0x8a8f94, 0xe6e2d6, 0xd9b52b, 0x6b4a33, 0x1f3a5f, 0x9c2f5e];
  let seed = 9173; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const cont = [], coll = [];
  // Lager: Bloecke zu 5 Stellplaetzen laengs und 6 Reihen quer, Fahrgassen 8 m (laengs) bzw. 10 m (quer); erst ab t 34 (hinter dem landseitigen Kranbein)
  for (let tb = Math.max(36, TB + 6); tb + 6 * (CW + 0.3) < tMax; tb += 6 * (CW + 0.3) + 10) for (let sb = 6; sb + CL < L - 4; sb += 5 * (CL + 0.6) + 8)
    for (let i = 0; i < 5; i++) { const sc = sb + i * (CL + 0.6) + CL / 2; if (sc + CL / 2 > L - 4) break;
      for (let r = 0; r < 6; r++) { const tc = tb + r * (CW + 0.3) + CW / 2; if (!rectFree(sc - CL / 2, sc + CL / 2, tc - CW / 2, tc + CW / 2, 3) || !onPlate(sc, tc)) continue;
        const n = 1 + Math.floor(rnd() * rnd() * 4.99); for (let k = 0; k < n; k++) cont.push([sc, tc, Y + 0.04 + k * CHt, PAL[Math.floor(rnd() * PAL.length)]]); coll.push([sc, tc, n]); } }
  yield;
  // Lagerhallen (Vorlage "lager") hinten, wo 60 x 24 m frei sind
  let halls = 0; for (let tb = tMax - 26; tb >= 50 && halls < 2; tb -= 6) for (let sb = 4; sb + 60 < L && halls < 2; sb += 8) { if (!rectFree(sb, sb + 60, tb, tb + 24, 4) || !onPlate(sb + 30, tb + 12)) continue;
    const [x0, z0] = Wp(sb, tb); gbvShell({ P0: [x0, z0], e1: [dx, dz], e2: [nx, nz], L1: 60, L2: 24, front: 0, type: "lager", N: 1, H: 10, glas: false, seed: 11 + halls, fire: [0, 0, 0, 0], y: Y }, out);
    // Container, die in der Halle stehen wuerden, weg
    for (let i = cont.length - 1; i >= 0; i--) if (cont[i][0] > sb - 2 && cont[i][0] < sb + 62 && cont[i][1] > tb - 2 && cont[i][1] < tb + 26) cont.splice(i, 1);
    for (let i = coll.length - 1; i >= 0; i--) if (coll[i][0] > sb - 2 && coll[i][0] < sb + 62 && coll[i][1] > tb - 2 && coll[i][1] < tb + 26) coll.splice(i, 1);
    const [cx, cz] = Wp(sb + 30, tb + 12); dkAdd({ cx, cy: Y + 5, cz, ux: dx, uz: dz, hl: 29.7, hw: 11.7, hh: 5, m: 0.3 }); bautAdd({ id: "GO-HAFEN-HALLE-" + (halls + 1), name: "Lagerhalle", art: "Gebäude", poly: [Wp(sb, tb), Wp(sb + 60, tb), Wp(sb + 60, tb + 24), Wp(sb, tb + 24)], y0: Y - 1, y1: Y + 11, info: "Hafen" });
    halls++; sb += 64; }
  yield;
  // Schiff am Kai (Wasserseite, t < 0): Rumpf dunkelblau mit rotem Unterwasserschiff, Aufbau weiss am Heck, Container an Deck
  const sOut = new Map(), scont = [];
  const SL = Math.min(200, L - 6), SW = 32, sm = L / 2, tS = -13 - SW / 2,   /* Kiesstreifen am Mauerfuss liegt bis ca. 12 m vor der Mauer ueber dem Wasser */ deck = WY + 17, hull = col(0x1d2836), red = col(0x8c2a22), wht = col(0xe8e6df), dark = col(0x23272c);
  const sx0 = sm - SL / 2 + 8;   // Aufbau am Heck (Rumpf und Aufbau: buildCargoShip in gotham-schiffe.js, Loft)
  for (let b = 0; sx0 + 26 + (b + 1) * (CL + 0.8) < sm + SL / 2 - 36; b++) { const sc = sx0 + 26 + b * (CL + 0.8) + CL / 2, n = 2 + Math.floor(rnd() * 4);
    for (let r = 0; r < 12; r++) { const tc = tS - 6 * (CW + 0.1) + r * (CW + 0.1) + CW / 2, hh = Math.max(1, n - (r === 0 || r === 11 ? 1 : 0)); for (let k = 0; k < hh; k++) scont.push([sc, tc, deck + k * CHt, PAL[Math.floor(rnd() * PAL.length)]]); } }
  // Nicolas 2026-11-16: Schiffe fahrbar -> eigenes Netz um den Drehpunkt (Schiffsmitte), angemeldet in gotham-schiffe.js (shipAdd)
  yield;
  // Containerbruecken: Beine auf t TA (Wasserseite, hinter der Kaikante) und TA + 26, Portal 18 m frei, Hauptträger auf 40 m von t -48 (Ausleger) bis +40, A-Bock bis 62 m
  const KR = col(0xc0392b), KW = col(0xeeeeea), cranes = [];
  const nC = Math.max(2, Math.min(4, Math.floor(L / 45)));
  for (let c = 0; c < nC; c++) { const s = 22 + c * (L - 44) / (nC - 1);
    for (const ds of [-8, 8]) { for (const t of [TA, TB]) gbvBox(out, "farbe", f, s + ds, t, 1.4, 1.4, Y, Y + 40, KR); gbvBox(out, "farbe", f, s + ds, TM, 1.2, 27.4, Y + 18, Y + 19.4, KR); gbvBox(out, "farbe", f, s + ds, TM, 2.2, 28, Y, Y + 1.2, col(0x333333)); }
    for (const t of [TA, TB]) gbvBox(out, "farbe", f, s, t, 17.4, 1.2, Y + 38, Y + 40, KR);
    for (const ds of [-3.5, 3.5]) gbvBox(out, "farbe", f, s + ds, -4, 1.1, 88, Y + 40, Y + 42.2, KW);   // Haupttraeger t -48..40
    gbvBox(out, "farbe", f, s, 32, 9, 10, Y + 42.2, Y + 47, KW);   // Maschinenhaus
    for (const ds of [-3.5, 3.5]) { gbvBox(out, "farbe", f, s + ds, 8, 1, 1, Y + 42.2, Y + 62, KR); gbvBox(out, "farbe", f, s + ds, 20, 1, 1, Y + 42.2, Y + 58, KR); }
    gbvBox(out, "farbe", f, s, 8, 8, 1.2, Y + 61, Y + 63, KR);
    for (const ds of [-3.5, 3.5]) { ghafBeam(out, f, s + ds, 8, Y + 62, -46, Y + 42.2, 0.45, KR); ghafBeam(out, f, s + ds, 8, Y + 62, 38, Y + 42.2, 0.45, KR); ghafBeam(out, f, s + ds, 20, Y + 58, 8, Y + 42.2, 0.5, KR); }   // Abspannung zu Ausleger und Rueckarm, Strebe
    cranes.push(s);
    const [cx, cz] = Wp(s, TM); for (const ds of [-8, 8]) for (const t of [TA, TB]) { const [x, z] = Wp(s + ds, t); dkAdd({ cx: x, cy: Y + 9, cz: z, ux: dx, uz: dz, hl: 0.7, hw: 0.7, hh: 9, m: 0.3 }); }
    void cx; void cz; }
  // Lichtmasten: alle ca. 45 m auf t 32 und am hinteren Rand
  const lampM = new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xffe2a8, emissiveIntensity: 0.1 }), heads = [];
  for (let s = 10; s < L - 5; s += 45) for (const t of [32, Math.max(40, tMax - 4)]) { if (!onPlate(s, t)) continue; gbvBox(out, "eisen", f, s, t, 0.6, 0.6, Y, Y + 30); heads.push(f.W(s, t, Y + 30.6)); }
  yield;
  // Netze
  const grp = gbvMesh(out); grp.name = "Gotham Hafen"; grp.userData.keep = true; grp.userData.noLift = true; scene.add(grp);
  if (heads.length) { const hg = new THREE.BoxGeometry(3, 0.8, 1.6), im = new THREE.InstancedMesh(hg, lampM, heads.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(dx, dz));
    heads.forEach((p, i) => im.setMatrixAt(i, m4.compose(new THREE.Vector3(...p), q, new THREE.Vector3(1, 1, 1)))); im.name = "Hafen Lampen"; scene.add(im); }
  const cTex = canvasTex(128, 32, (c, w, h) => { c.fillStyle = "#fff"; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 4) { c.fillStyle = x % 8 ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.3)"; c.fillRect(x, 0, 2, h); } c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(0, 0, w, 2); c.fillRect(0, h - 2, w, 2); });
  const cGeo = new THREE.BoxGeometry(CW, CHt, CL); cGeo.translate(0, CHt / 2, 0);
  const cMat = new THREE.MeshStandardMaterial({ map: cTex, roughness: 0.75, metalness: 0.2 }), cim = new THREE.InstancedMesh(cGeo, cMat, cont.length + nC);
  const qd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(dx, dz)), M4 = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), cc = new THREE.Color();
  cont.forEach(([s, t, y, h], i) => { const p = f.W(s, t, y); cim.setMatrixAt(i, M4.compose(new THREE.Vector3(...p), qd, one)); cim.setColorAt(i, cc.set(h).offsetHSL(0, 0, (rnd() - 0.5) * 0.08)); });
  cim.name = "Hafen Container"; cim.castShadow = true; cim.receiveShadow = true; scene.add(cim);
  // Katzen mit Spreader und haengendem Container (eigene kleine Netze, bewegt in ghafStep); die letzten nC Instanzen sind die haengenden Container
  const trolM = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.6, metalness: 0.4 }), ropeM = new THREE.MeshBasicMaterial({ color: 0x222222 }), trol = [];
  cranes.forEach((s, i) => { const g = new THREE.Group(), tb = new THREE.Mesh(new THREE.BoxGeometry(8.4, 2, 6), trolM); tb.position.y = 1; g.add(tb);
    const rope = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 0.12), ropeM); g.add(rope); const spr = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 12.4), new THREE.MeshStandardMaterial({ color: 0xd9b52b, roughness: 0.6 })); g.add(spr);
    g.quaternion.copy(qd); scene.add(g); trol.push({ g, rope, spr, s, ph: i * 1.9, col: PAL[(i * 3) % PAL.length] }); cim.setColorAt(cont.length + i, cc.set(PAL[(i * 3) % PAL.length])); });
  cim.instanceColor.needsUpdate = true;
  // Containerschiff als eigene Gruppe (Drehpunkt = Schiffsmitte), fahrbar ueber gotham-schiffe.js; dazu ein Hafenschlepper
  const h0 = Math.atan2(-dx, -dz);
  { const [px, pz] = Wp(sm, tS), sg = new THREE.Group(); sg.name = "Containerschiff"; sg.userData.keep = true; sg.userData.noLift = true;
    const body = buildCargoShip(SL, SW, deck - WY, -(sx0 + 7 - sm), -(sx0 + 18 - sm)); body.rotation.y = h0; body.position.y = WY; sg.add(body);
    const sim = new THREE.InstancedMesh(cGeo, cMat, scont.length); scont.forEach(([s, t, y, h], i) => { const p = f.W(s, t, y); sim.setMatrixAt(i, M4.compose(new THREE.Vector3(p[0] - px, p[1], p[2] - pz), qd, one)); sim.setColorAt(i, cc.set(h)); });
    sim.castShadow = true; sim.name = "Schiff Container"; sg.add(sim); sg.position.set(px, 0, pz); scene.add(sg);
    if (typeof shipAdd === "function") GHAF.ship = shipAdd({ g: sg, h: h0, h0, L: SL, W: SW, deckY: deck, label: "Containerschiff", maxV: 7, acc: 0.45, turn: 0.09, tall: true, cam: [200, 70], bridge: [0, sm - (sx0 + 7), deck + 28 - WY] }); }
  if (typeof buildTug === "function") { const T = { L: 26, W: 9 }; T.pts = shipPts(T);
    for (const [s, t] of [[sm + SL / 2 + 30, -22], [sm - SL / 2 - 30, -22], [sm + SL / 2 + 30, -45], [sm, -75]]) { const [x, z] = Wp(s, t); if (shipScore(T, x, z, h0) >= -1) continue;
      const tg = new THREE.Group(), inner = buildTug(); inner.position.y = WY; tg.add(inner); tg.name = "Hafenschlepper"; tg.userData.keep = true; tg.userData.noLift = true; tg.position.set(x, 0, z); scene.add(tg);
      GHAF.tug = shipAdd({ g: tg, h: h0, h0: 0, L: 26, W: 9, deckY: WY + 2.5, label: "Hafenschlepper", maxV: 11, acc: 2.2, turn: 0.45, cam: [32, 12], bridge: [0, -2.6, 7.4] }); shipPose(GHAF.tug); break; } }
  yield;
  // Kollision: Containerstapel (Oberseite begehbar)
  for (const [s, t, n] of coll) { const [x, z] = Wp(s, t); dkAdd({ cx: x, cy: Y + n * CHt / 2, cz: z, ux: dx, uz: dz, hl: CL / 2 - 0.3, hw: CW / 2 - 0.3, hh: n * CHt / 2, m: 0.3 }); }
  bautAdd({ id: "GO-HAFEN", name: "Hafen / Containerterminal", art: "Hafen", poly: [Wp(0, 0), Wp(L, 0), Wp(L, tMax), Wp(0, tMax)], y0: WY - 6, y1: Y + 63, info: nC + " Containerbrücken · " + cont.length + " Container · " + halls + " Lagerhallen" });
  GHAF.anim = { TA, f, trol, cim, base: cont.length, lampM, qd, M4, one, deck, Y, cx: mx, cz: mz };
  GHAF.info = { TA, L, tMax, cranes: nC, cont: cont.length, stacks: coll.length, halls, cells: cells.length };
}
// schraeger Balken in der Ebene s = const: von (t0, y0) nach (t1, y1), Querschnitt w x w (Vertexfarbe col)
function ghafBeam(out, f, s, t0, y0, t1, y1, w, col) {
  const o = gbvBucket(out, "farbe"), L = Math.hypot(t1 - t0, y1 - y0), ct = (t1 - t0) / L, cy = (y1 - y0) / L, pt = -cy * w / 2, py = ct * w / 2;   // Querrichtung in der t-y-Ebene
  const P = (t, y, ds, k) => f.W(s + ds, t + pt * k, y + py * k), uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (const [a, b, n] of [[[-w / 2, -1], [w / 2, -1], [-pt, -py]], [[w / 2, 1], [-w / 2, 1], [pt, py]]]) { const N = f.dirW(0, n[0] / (w / 2)); gbvQuad(o, P(t0, y0, a[0], a[1]), P(t0, y0, b[0], b[1]), P(t1, y1, b[0], b[1]), P(t1, y1, a[0], a[1]), [N[0], n[1] / (w / 2), N[2]], uv, col); }
  for (const ds of [-w / 2, w / 2]) { const N = f.dirW(Math.sign(ds), 0); gbvQuad(o, P(t0, y0, ds, -1), P(t0, y0, ds, 1), P(t1, y1, ds, 1), P(t1, y1, ds, -1), N, uv, col); }
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (GHAF.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = ghafGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { GHAF.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
// je Bild (schleife.js): Katzen fahren zwischen Schiff (t -30) und Kai (t 8), Spreader senkt sich, Container haengt in der Hinfahrt; nur bis 1,2 km
function ghafStep() {
  const A = GHAF.anim; if (!A) return; const p = camera.position; A.lampM.emissiveIntensity = 0.1 + 2 * (typeof night === "number" ? night : 0);
  if (Math.abs(p.x - A.cx) > 1200 || Math.abs(p.z - A.cz) > 1200) return;
  const T = performance.now() / 1000;
  const away = GHAF.ship && Math.hypot(GHAF.ship.x - GHAF.ship.home.x, GHAF.ship.z - GHAF.ship.home.z) > 3;   // Schiff weggefahren: Katzen warten am Kai
  A.trol.forEach((c, i) => { const u = away ? 0.3 : ((T / 40 + c.ph / 6.28) % 1);   // 40 s je Spiel: 0-.25 hin (beladen), .25-.4 senken/heben, .4-.65 zurueck, .65-1 senken/heben am Schiff
    const mv = x => x * x * (3 - 2 * x), K = A.TA + 6, tt = u < 0.25 ? -30 + (K + 30) * mv(u / 0.25) : u < 0.4 ? K : u < 0.65 ? K - (K + 30) * mv((u - 0.4) / 0.25) : -30;
    const dip = away ? 0 : u >= 0.25 && u < 0.4 ? Math.sin((u - 0.25) / 0.15 * Math.PI) : u >= 0.65 ? Math.sin((u - 0.65) / 0.35 * Math.PI) : 0;
    const yTop = A.Y + 39.6, low = tt > 0 ? A.Y + 3.4 : A.deck + 14, ySpr = yTop - 6 - dip * (yTop - 6 - low);
    const [x, , z] = A.f.W(c.s, tt, 0); c.g.position.set(x, yTop - 2, z);
    c.spr.position.y = ySpr - (yTop - 2); c.rope.scale.y = Math.max(0.1, yTop - 2 - ySpr); c.rope.position.y = (c.spr.position.y) / 2;
    const loaded = !away && (u < 0.25 || (u >= 0.25 && u < 0.32) || u >= 0.82);   // beladen von der Aufnahme am Schiff bis zum Absetzen am Kai
    A.M4.compose(new THREE.Vector3(x, loaded ? ySpr - 0.3 - 2.59 : -999, z), A.qd, A.one); A.cim.setMatrixAt(A.base + i, A.M4); });
  A.cim.instanceMatrix.needsUpdate = true;
}
