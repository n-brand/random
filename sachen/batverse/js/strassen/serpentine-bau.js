// Batverse – Serpentine bauen: Asphalt, Felsen, Leitplanken, Leitpfosten; Hauptstrasse/Zufahrt zeichnen
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Serpentine bauen (A5, ueberarbeitet: Alpenpass): nach liftPlateau, alles ist schon in Endhoehe.
// Fahrbahn mit Asphalt-Textur (Farbunterschiede, Fahrspuren, Risse, Flickstellen, weisse Markierung) und Bankett, bergseitig Felsformationen
// im Einschnitt, talseitig Felsabbrueche unter dem Rand, Leitplanken (W-Profil, Pfosten bis in den Boden) an Talseite und Kehren,
// Natursteinbruestung an den Kehren, sonst Leitpfosten; Felsbrocken, Geroell und wenig Pflanzen. Kollision fuer Felsen, Planken, Mauern.
{
  const hw = SERP_W / 2, S2 = SERP.samples, NS = S2.length;
  const fr = rng(4242);
  // ---- Hilfen ----
  const tang = i => { const a = S2[Math.max(0, i - 1)], b = S2[Math.min(NS - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  // Abstand zu anderen Strassenstuecken (nicht dem eigenen Abschnitt um s0)
  const otherRoad = (x, z, s0) => { let m = 1e9; for (const [sx, sz, s] of S2) if (Math.abs(s - s0) > 28) m = Math.min(m, Math.hypot(x - sx, z - sz)); return m; };
  const otherInfo = (x, z, s0) => { let m = 1e9, ms = 0; for (const [sx, sz, s] of S2) if (Math.abs(s - s0) > 28) { const q = Math.hypot(x - sx, z - sz); if (q < m) { m = q; ms = s; } } return { d: m, y: SERP.y(ms) }; };
  // Kehre an Stelle i: Richtungsaenderung ueber +-7 m
  const turnAt = i => { const j = Math.min(NS - 1, i + 7), k = Math.max(0, i - 7), a1 = Math.atan2(S2[i][1] - S2[k][1], S2[i][0] - S2[k][0]), a2 = Math.atan2(S2[j][1] - S2[i][1], S2[j][0] - S2[i][0]); let d = Math.abs(a2 - a1); return Math.min(d, Math.PI * 2 - d); };
  // Talseite: urspruengliches Gelaende neben der Strasse tiefer als die Fahrbahn
  const drop = (i, sd) => { const [tx, tz] = tang(i), [x, z, s] = S2[i]; return SERP.y(s) - genH0(x - tz * sd * (hw + 5), z + tx * sd * (hw + 5)); };

  // ---- Asphalt (Schweizer Passstrasse): 7,5 m quer x 27 m laengs ----
  const asphalt = canvasTex(256, 1024, (g, w, h) => {
    const rr = rng(77);
    g.fillStyle = "#56595d"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 380; i++) { const v = rr() < 0.5 ? 40 : 120; g.fillStyle = `rgba(${v},${v},${v + 4},${0.04 + rr() * 0.05})`; g.beginPath(); g.ellipse(rr() * w, rr() * h, 8 + rr() * 40, 10 + rr() * 70, rr() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 26000; i++) { const v = 60 + rr() * 90; g.fillStyle = `rgba(${v},${v},${v + 3},${0.25 + rr() * 0.4})`; g.fillRect(rr() * w, rr() * h, rr() < 0.85 ? 1 : 2, rr() < 0.85 ? 1 : 2); }
    // Fahrspuren (Reifen poliert/dunkler)
    for (const x of [52, 90, 166, 204]) { const gr = g.createLinearGradient(x - 12, 0, x + 12, 0); gr.addColorStop(0, "rgba(30,30,34,0)"); gr.addColorStop(0.5, "rgba(30,30,34,.12)"); gr.addColorStop(1, "rgba(30,30,34,0)"); g.fillStyle = gr; g.fillRect(x - 12, 0, 24, h); }
    // Flickstellen
    for (let i = 0; i < 6; i++) {
      const pw = 30 + rr() * 80, ph = 50 + rr() * 200, px = 20 + rr() * (w - 40 - pw), py = rr() * (h - ph);
      g.fillStyle = `rgba(${62 + rr() * 14},${64 + rr() * 14},${68 + rr() * 12},.9)`; g.fillRect(px, py, pw, ph);
      for (let k = 0; k < pw * ph / 18; k++) { const v = 55 + rr() * 70; g.fillStyle = `rgba(${v},${v},${v},.4)`; g.fillRect(px + rr() * pw, py + rr() * ph, 1, 1); }
      g.strokeStyle = "rgba(28,28,30,.55)"; g.lineWidth = 1.4; g.strokeRect(px, py, pw, ph);
    }
    // Risse (laengs und quer, verzweigt)
    g.strokeStyle = "rgba(22,22,24,.6)";
    for (let i = 0; i < 34; i++) {
      let x = rr() * w, y = rr() * h, a = rr() < 0.6 ? Math.PI / 2 + (rr() - 0.5) * 0.6 : (rr() - 0.5) * 0.8;
      g.lineWidth = 0.8 + rr() * 0.9; g.beginPath(); g.moveTo(x, y);
      for (let k = 0, n = 6 + rr() * 14; k < n; k++) { a += (rr() - 0.5) * 0.9; x += Math.cos(a) * (4 + rr() * 8); y += Math.sin(a) * (4 + rr() * 8); g.lineTo(x, y); }
      g.stroke();
    }
    // Markierung: Randlinien durchgezogen, Mittellinie gestrichelt (3 m Strich, 6 m Luecke), leicht abgenutzt
    const paint = (x0, y0, ww, hh) => { g.fillStyle = "rgba(236,236,230,.9)"; g.fillRect(x0, y0, ww, hh); for (let k = 0; k < ww * hh / 7; k++) { g.fillStyle = `rgba(86,89,93,${0.3 + rr() * 0.6})`; g.fillRect(x0 + rr() * ww, y0 + rr() * hh, 1, 1); } };
    paint(9, 0, 5, h); paint(w - 14, 0, 5, h);
    for (let k = 0; k < 3; k++) paint(w / 2 - 3, k * h / 3, 6, h / 9);
  });
  asphalt.anisotropy = 8;
  const roadMat = flatMat({ map: asphalt, bumpMap: asphalt, bumpScale: 0.8, roughness: 0.9, side: THREE.DoubleSide });
  const road = ribbon(SERP.curve, SERP.len, SERP_W, roadMat, 27, 0, { y: SERP.y });
  road.userData.keep = false;
  // Bankett: schmaler Kies-/Erdstreifen beidseits
  const gravel = canvasTex(128, 128, (g, w, h) => {
    const rr = rng(91); g.fillStyle = "#77706a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const v = 80 + rr() * 90; g.fillStyle = `rgba(${v + 8},${v},${v - 8},.6)`; g.beginPath(); g.arc(rr() * w, rr() * h, 0.6 + rr() * 2.4, 0, 7); g.fill(); }
  });
  const shoulderMat = flatMat({ map: gravel, bumpMap: gravel, bumpScale: 1.2, side: THREE.DoubleSide });
  for (const sd of [-1, 1]) { const m = ribbon(SERP.curve, SERP.len, 0.95, shoulderMat, 2, 0, { y: s => SERP.y(s) - 0.05, off: sd * (hw + 0.45) }); m.userData.keep = false; }
  // E4: Hauptstrasse und Zufahrt; die Zufahrt liegt 2 cm tiefer (an der Kreuzung gewinnt die Hauptstrasse), Leitpfosten alle 40 m
  // Zufahrt endet am Rand der Hauptstrasse; dort setzt deren Bankett auf der Zufahrtseite aus
  const jT = MAIN_J[2] / MAIN.len, jW = (ZUF.w / 2 + 1.2) / MAIN.len, jt = MAIN.curve.getTangentAt(jT), jSide = Math.sign((GATE_C[0] - MAIN_J[0]) * -jt.z + (GATE_C[1] - MAIN_J[1]) * jt.x) || 1;
  for (const R of ROADS2) {
    const lo = R === ZUF ? 0.03 : 0.05, t1 = R === ZUF ? (R.len - MAIN.w / 2 + 0.15) / R.len : 1;
    const m = ribbon(R.curve, R.len, R.w, roadMat, 27, 0, { y: s => R.y(s) + lo, t1 }); m.userData.keep = false;
    for (const sd of [-1, 1]) {
      const parts = R === MAIN && sd === jSide ? [[0, jT - jW], [jT + jW, 1]] : [[0, R === ZUF ? (R.len - MAIN.w / 2 - 0.9) / R.len : 1]];
      for (const [a0, a1] of parts) { const b = ribbon(R.curve, R.len, 0.95, shoulderMat, 2, 0, { y: s => R.y(s) + lo - 0.06, off: sd * (R.w / 2 + 0.45), t0: a0, t1: a1 }); b.userData.keep = false; }
    }
  }
  { const postM = M(0xf2f2ee, { roughness: 0.6 }), bandM = M(0x1b1b1b), reflM = M(0xff9a2a, { emissive: 0x6a2a00 });
    for (let s = 20; s < MAIN.len - 10; s += 40) {
      const p = MAIN.curve.getPointAt(s / MAIN.len), tg = MAIN.curve.getTangentAt(s / MAIN.len), nl = Math.hypot(tg.x, tg.z), nx = -tg.z / nl, nz = tg.x / nl, y = MAIN.y(s);
      if (Math.hypot(p.x - MAIN_J[0], p.z - MAIN_J[1]) < 14) continue;                     // Kreuzung frei
      for (const sd of [-1, 1]) {
        const x = p.x + nx * sd * (MAIN.w / 2 + 1.1), z = p.z + nz * sd * (MAIN.w / 2 + 1.1), g = Math.min(y, terrainH(x, z));
        B(x - 0.06, x + 0.06, g - 0.3, y + 1.0, z - 0.06, z + 0.06, postM, false);
        B(x - 0.065, x + 0.065, y + 0.72, y + 0.86, z - 0.065, z + 0.065, bandM, false, world, false);
        B(x - 0.07, x + 0.07, y + 0.76, y + 0.82, z - 0.07, z + 0.07, reflM, false, world, false);
        circles.push([x, z, 0.12, y + 1.0]);
      }
    } }

  // ---- Felsen: verformte Kugel mit Bruchflaechen, Schichten, Rissen, Moos; viele zu einem Netz ----
  const rockGeos = [];
  // yTop: Felsen oben kappen (Felsabbrueche unter einer hoeher liegenden Fahrbahn duerfen nicht ueber deren Rand ragen)
  const placeRock = (g, x, y, z, rotY, yTop = Infinity) => {
    g.rotateY(rotY); g.translate(x, y, z);
    if (yTop < Infinity) { const P = g.attributes.position; for (let k = 0; k < P.count; k++) if (P.getY(k) > yTop) P.setY(k, yTop); g.computeVertexNormals(); }
    rockGeos.push(g);
  };
  // Kollision ueber die ganze Felsform (Nicolas 2026-11-11: man fuhr durch laengliche Felsen, ein Kreis in der Mitte reichte nicht): Kreise entlang der
  // Laengsachse (nach rotY gedreht), Radius folgt der Ellipse und bleibt etwas innerhalb der sichtbaren Flaeche (Regel Barrieren weiter innen)
  const rockCirc = (cx, cz, w, d, rot, top) => { const L = Math.max(w, d) / 2, Sh = Math.min(w, d) / 2, ax = w >= d ? [Math.cos(rot), -Math.sin(rot)] : [Math.sin(rot), Math.cos(rot)];
    for (let u = -L * 0.8; u <= L * 0.8 + 1e-6; u += Math.max(0.4, Sh * 0.6)) circles.push([cx + ax[0] * u, cz + ax[1] * u, Math.max(0.4, Sh * 0.85 * Math.sqrt(Math.max(0, 1 - (u / L) ** 2))), top]); };
  // Bergseitig im Einschnitt und talseitig unter dem Fahrbahnrand
  let i = 18;
  while (i < NS - 6) {
    const [x0, z0, s0] = S2[i], [tx, tz] = tang(i), y0 = SERP.y(s0), rot = -Math.atan2(tz, tx);
    if (x0 > 97) break;                                                    // Torbereich (A6) frei lassen
    for (const sd of [-1, 1]) {
      const nx = -tz * sd, nz = tx * sd, dp = drop(i, sd);
      const oi = otherInfo(x0 + nx * (hw + 2), z0 + nz * (hw + 2), s0);
      if (oi.d < 14 && oi.y > y0 + 1.5 && fr() < 0.95) {                  // Bergseite mit Strasse darueber: Felsabbruch fuellt den Streifen dazwischen
        const gap = oi.d + 2 - 2 * hw, d = Math.max(1.4, gap - 1.4), w = 5 + fr() * 5, h = oi.y - y0 + 0.4;
        const off = hw + 0.8 + d / 2, cx = x0 + nx * off, cz = z0 + nz * off;
        placeRock(makeRock(w / 2, h / 2, d / 2, fr()), cx, y0 - 0.7 + h / 2, cz, rot, oi.y - 0.35);
        rockCirc(cx, cz, w, d, rot, y0 + h * 0.6);
      } else if (oi.d < 16 && oi.y < y0 - 1.5) {                          // Talseite mit Strasse darunter: dort steht schon deren Felsabbruch
      } else if (dp < 0.8 && fr() < 0.93) {                               // Bergseite frei: Felswand im Einschnitt (fast durchgehend)
        const cut = Math.max(0, -dp), w = 4.5 + fr() * 5, d = 2.5 + fr() * 3.5, h = Math.min(11, Math.max(3.2, cut + 2.5 + fr() * 4.5));
        const off = hw + 1.25 + d * 0.42, cx = x0 + nx * off, cz = z0 + nz * off;
        if (otherRoad(cx, cz, s0) < hw + 1.1 + d * 0.5 || plateauH(cx, cz) > HILL - 2) continue;
        placeRock(makeRock(w / 2, h / 2, d / 2, fr()), cx, y0 - 1 + h * 0.36, cz, rot);
        rockCirc(cx, cz, w, d, rot, y0 + h * 0.85);
      } else if (dp > 2.5 && fr() < 0.6) {                                // Talseite: Felsabbruch unter dem Rand
        const w = 4 + fr() * 6, d = 3 + fr() * 4, h = Math.min(14, dp + 3 + fr() * 3);
        const off = hw + 1.7 + d * 0.45, cx = x0 + nx * off, cz = z0 + nz * off;
        if (otherRoad(cx, cz, s0) < hw + 1.1 + d * 0.5) continue;
        placeRock(makeRock(w / 2, h / 2, d / 2, fr()), cx, y0 - 0.5 - h * 0.45, cz, rot, y0 - 0.35);
        rockCirc(cx, cz, w, d, rot, y0 - 0.35);                            // von unten gesperrt, von der Fahrbahn darueber nicht
      }
    }
    i += 3 + Math.floor(fr() * 5);
  }
  // Felsnasen und Abbrueche zwischen den Schleifen und am Hang (halb im Boden, unregelmaessig verteilt)
  for (let k = 0, n = 0; k < 900 && n < 46; k++) {
    const x = 26 + fr() * 100, z = -70 + fr() * 140, w = 3 + fr() * 6, d = 2.5 + fr() * 4, h = 2 + fr() * 5;
    if (serpZone(x, z) < 0.5 || serpNear(x, z, hw + 1.2 + Math.max(w, d) * 0.55) || plateauH(x, z) > HILL - 2) continue;
    if (vnoise(x / 18 + 5, z / 18 + 11) < 0.42) continue;                   // in Gruppen, nicht gleichmaessig
    const y = terrainH(x, z), sn = serpNear(x, z, 30), rot = sn ? -Math.atan2(...(() => { const q = Math.max(1, Math.min(NS - 2, Math.round(sn.s))); return [S2[q + 1][1] - S2[q - 1][1], S2[q + 1][0] - S2[q - 1][0]]; })()) : fr() * 6;
    // nicht ueber eine hoeher liegende Fahrbahn in der Naehe hinausragen
    let yTop = Infinity; for (const [sx, sz, s] of S2) { const ry = SERP.y(s); if (ry > y && Math.hypot(x - sx, z - sz) < 13) yTop = Math.min(yTop, ry - 0.35); }
    const gR = makeRock(w / 2, h / 2, d / 2, fr()), rr = rot + (fr() - 0.5) * 0.6;   // gleiche Zufallsreihenfolge wie vorher (gleiche Felsen)
    placeRock(gR, x, y - h * 0.15, z, rr, yTop);
    rockCirc(x, z, w, d, rr, Math.min(yTop, y + h * 0.8)); n++;
  }
  // Einzelne grosse Brocken neben der Strasse und zwischen den Schleifen
  for (let k = 0, n = 0; k < 400 && n < 18; k++) {
    const x = 30 + fr() * 85, z = -60 + fr() * 120, s = 1.2 + fr() * 2.2;
    if (serpZone(x, z) < 0.6 || serpNear(x, z, hw + s + 1) || plateauH(x, z) > HILL - 2) continue;
    const y = terrainH(x, z); placeRock(makeRock(s, s * (0.6 + fr() * 0.3), s * (0.8 + fr() * 0.4), fr(), 3), x, y + s * 0.25, z, fr() * 6);
    circles.push([x, z, s * 0.85, y + s * 1.2]); n++;
  }
  if (rockGeos.length) {
    const detail = canvasTex(256, 256, (g, w, h) => {
      const rr = rng(5); g.fillStyle = "#c9c9c9"; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 2600; k++) { const v = 150 + rr() * 100; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(rr() * w, rr() * h, 1 + rr() * 2, 1 + rr() * 2); }
      g.strokeStyle = "rgba(60,60,60,.5)"; for (let k = 0; k < 40; k++) { g.lineWidth = 0.6 + rr(); g.beginPath(); let x = rr() * w, y = rr() * h; g.moveTo(x, y); for (let q = 0; q < 6; q++) { x += (rr() - 0.5) * 30; y += (rr() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
    });
    const rockMesh = new THREE.Mesh(mergeGeometries(rockGeos, false), M(0xffffff, { vertexColors: true, map: detail, bumpMap: detail, bumpScale: 2.5, roughness: 0.93 }));
    rockMesh.castShadow = rockMesh.receiveShadow = true; rockMesh.userData.keep = true; scene.add(rockMesh);
    rockGeos.forEach(g => g.dispose());
  }
  // Geroell am Fuss der Felsen und auf steilen Stellen, wenige Pflanzen in Spalten
  {
    const list = [], plants = [];
    for (let c = 0; c < 46; c++) {
      const cx = 28 + fr() * 90, cz = -62 + fr() * 124, rad = 3 + fr() * 7;
      if (serpZone(cx, cz) < 0.5 || plateauH(cx, cz) > HILL - 2) continue;
      for (let k = 0, n = 25 + fr() * 50; k < n; k++) {
        const a = fr() * 6.28, rr = rad * Math.sqrt(fr()), x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr * 0.6, s = 0.08 + fr() ** 2 * 0.5;
        if (serpNear(x, z, hw + 0.2)) continue;
        list.push([x, terrainH(x, z) - s * 0.25, z, s]);
      }
    }
    for (let k = 0; k < 900 && plants.length < 260; k++) {
      const x = 28 + fr() * 92, z = -64 + fr() * 128;
      if (serpZone(x, z) < 0.5 || serpNear(x, z, hw + 0.8) || plateauH(x, z) > HILL - 2 || vnoise(x / 7 + 3, z / 7) < 0.5) continue;
      plants.push([x, terrainH(x, z), z, 0.25 + fr() * 0.35]);
    }
    const o = new THREE.Object3D(), cc = new THREE.Color();
    const scree = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), M(0xffffff, { map: rockTex, roughness: 0.95 }), list.length);
    list.forEach(([x, y, z, s], k) => { o.position.set(x, y, z); o.rotation.set(fr() * 6, fr() * 6, fr() * 6); o.scale.set(s * (0.8 + fr() * 0.5), s * (0.5 + fr() * 0.4), s * (0.8 + fr() * 0.5)); o.updateMatrix(); scree.setMatrixAt(k, o.matrix); scree.setColorAt(k, cc.copy(TONES[k % TONES.length]).multiplyScalar(0.85 + fr() * 0.3)); });
    scree.castShadow = scree.receiveShadow = true; scree.computeBoundingSphere(); scene.add(scree);
    const tuft = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1, 6).translate(0, 0.5, 0), M(0xffffff, { roughness: 1 }), plants.length);
    plants.forEach(([x, y, z, s], k) => { o.position.set(x, y - 0.05, z); o.rotation.set(0, fr() * 6, 0); o.scale.set(s, s * (0.6 + fr() * 0.8), s); o.updateMatrix(); tuft.setMatrixAt(k, o.matrix); tuft.setColorAt(k, cc.setHSL(0.22 + fr() * 0.06, 0.35, 0.28 + fr() * 0.1)); });
    tuft.computeBoundingSphere(); scene.add(tuft);
  }

  // ---- Leitplanken (W-Profil) an der Talseite und an den Kehren, Natursteinbruestung an den Kehren, Leitpfosten sonst ----
  const need = { "-1": new Uint8Array(NS), "1": new Uint8Array(NS) }, kehreAt = new Uint8Array(NS);
  for (let k = 0; k < NS; k++) { kehreAt[k] = turnAt(k) > 0.75 ? 1 : 0; for (const sd of [-1, 1]) need[sd][k] = k > 14 && k < NS - 3 && S2[k][0] < 103 && (drop(k, sd) > 1.4 || (kehreAt[k] && drop(k, sd) > 0.2)) ? 1 : 0; }
  for (const sd of [-1, 1]) {                                             // Luecken unter 7 m schliessen, Stuecke unter 8 m weglassen
    const a = need[sd];
    for (let k = 0; k < NS; k++) if (!a[k]) { let j = k; while (j < NS && !a[j]) j++; if (k > 0 && j < NS && j - k < 7) for (let q = k; q < j; q++) a[q] = 1; k = j; }
    for (let k = 0; k < NS; k++) if (a[k]) { let j = k; while (j < NS && a[j]) j++; if (j - k < 8) for (let q = k; q < j; q++) a[q] = 0; k = j; }
  }
  const steel = M(0xb9bdc1, { metalness: 0.75, roughness: 0.32, side: THREE.DoubleSide }), postMat = M(0x8d9298, { metalness: 0.6, roughness: 0.45 });
  const PROF = [[0, 0.76], [-0.045, 0.73], [-0.075, 0.67], [-0.035, 0.61], [-0.075, 0.55], [-0.045, 0.49], [0, 0.46]];   // [quer zur Strasse, Hoehe]
  const railPos = [], railIdx = [], postGeos = [], wallGeos = [];
  const outer = (k, sd) => { const [tx, tz] = tang(k); return [-tz * sd, tx * sd]; };
  for (const sd of [-1, 1]) {
    const a = need[sd];
    for (let k = 0; k < NS; k++) {
      if (!a[k]) continue;
      let j = k; while (j < NS && a[j]) j++;
      const base = railPos.length / 3, L = j - k;
      for (let q = k; q < j; q++) {
        const [x, z, s] = S2[q], [ox, oz] = outer(q, sd), y = SERP.y(s), e = Math.min(q - k, j - 1 - q), dip = e < 3 ? (3 - e) / 3 * 0.55 : 0;   // Enden zum Boden gezogen
        for (const [lat, hh] of PROF) railPos.push(x + ox * (hw + 0.55 + lat), y + hh - dip, z + oz * (hw + 0.55 + lat));
        if (q > k) { const r0 = base + (q - k - 1) * PROF.length, r1 = r0 + PROF.length; for (let p = 0; p < PROF.length - 1; p++) railIdx.push(r0 + p, r1 + p, r0 + p + 1, r0 + p + 1, r1 + p, r1 + p + 1); }
        if ((q - k) % 2 === 0) {                                          // Pfosten alle 2 m, bis in den Boden
          const px = x + ox * (hw + 0.66), pz = z + oz * (hw + 0.66), top = y + 0.72, bot = Math.min(y - 0.3, terrainH(px, pz) - 0.35);
          postGeos.push(new THREE.BoxGeometry(0.09, top - bot, 0.14).rotateY(-Math.atan2(oz, ox)).translate(px, (top + bot) / 2, pz));
          circles.push([x + ox * (hw + 0.55), z + oz * (hw + 0.55), 0.22, y + 1.2]);
          if (q + 1 < j) circles.push([lerp(x, S2[q + 1][0], 1) + ox * (hw + 0.55), lerp(z, S2[q + 1][1], 1) + oz * (hw + 0.55), 0.22, y + 1.2]);
        }
        if (kehreAt[q] && drop(q, sd) > 0.2) {                           // Natursteinbruestung hinter der Planke (Kehre)
          const wx = x + ox * (hw + 1.35), wz = z + oz * (hw + 1.35), bot = Math.min(y - 0.2, terrainH(wx, wz) - 0.3);
          wallGeos.push(new THREE.BoxGeometry(1.08, y + 0.95 - bot, 0.5).rotateY(-Math.atan2(S2[Math.min(NS - 1, q + 1)][1] - z, S2[Math.min(NS - 1, q + 1)][0] - x)).translate(wx, (y + 0.95 + bot) / 2, wz));
        }
      }
      k = j;
    }
  }
  if (railPos.length) {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(railPos, 3)); g.setIndex(railIdx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, steel); m.castShadow = true; m.receiveShadow = true; m.userData.keep = true; scene.add(m);
  }
  if (postGeos.length) { const m = new THREE.Mesh(mergeGeometries(postGeos, false), postMat); m.castShadow = true; m.userData.keep = true; scene.add(m); }
  if (wallGeos.length) { const m = new THREE.Mesh(mergeGeometries(wallGeos, false), M(0xffffff, { map: texClone(brickTex, 1 / 1.5, 1 / 1.5), roughness: 0.95 })); m.castShadow = m.receiveShadow = true; m.userData.keep = true; scene.add(m); }
  // Leitpfosten (weiss, schwarzes Band, Reflektor) alle ca. 25 m, wo keine Planke steht
  {
    const pl = [];
    for (let k = 20; k < NS - 4; k += 25) for (const sd of [-1, 1]) if (!need[sd][k] && S2[k][0] < 104) { const [x, z, s] = S2[k], [ox, oz] = outer(k, sd); pl.push([x + ox * (hw + 0.75), SERP.y(s), z + oz * (hw + 0.75), sd]); }
    const o = new THREE.Object3D();
    const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 1.05, 0.1).translate(0, 0.52, 0), M(0xf2f2ee, { roughness: 0.5 }), pl.length);
    const band = new THREE.InstancedMesh(new THREE.BoxGeometry(0.125, 0.22, 0.105).translate(0, 0.78, 0), M(0x1a1a1a, { roughness: 0.6 }), pl.length);
    const refl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.08, 0.04).translate(0, 0.78, 0), new THREE.MeshStandardMaterial({ color: 0xffa020, emissive: 0x804000, roughness: 0.2, metalness: 0.3 }), pl.length);
    pl.forEach(([x, y, z], k) => { o.position.set(x, y - 0.15, z); o.rotation.set(0, fr() * 0.2, 0); o.updateMatrix(); body.setMatrixAt(k, o.matrix); band.setMatrixAt(k, o.matrix); refl.setMatrixAt(k, o.matrix); circles.push([x, z, 0.12, y + 1.1]); });
    for (const im of [body, band, refl]) { im.castShadow = true; im.computeBoundingSphere(); scene.add(im); }
  }
}
