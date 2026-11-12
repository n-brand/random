// Batverse – Steilkueste mit Felshaut, Wasserhoehlen, Batcave-Eingang
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Steilkueste mit Struktur (E2) und Batcave-Eingang (B2) =====================
// Felshaut vor der ganzen Kueste (das Gelaende-Raster ist dort 2-6 m grob): Schichten mit Vorspruengen, Ueberhaenge, Risse, Absatz ueber dem
// Wasser, ausgewaschene Kerbe und nasses/gruenes Band an der Wasserlinie. Oeffnungen fuer die Wasserhoehlen und den Batcave-Eingang,
// dahinter Hoehlenroehren (nach hinten dunkler) mit Wasser. Felsnadeln im Meer, Brocken am Fuss. Alles in Klippenfarbe.
{
  const cCliff = new THREE.Color(0x85827c), cBeige = new THREE.Color(0x9c9381), cWet = new THREE.Color(0x3d3c39), cAlgae = new THREE.Color(0x3f5130), tc = new THREE.Color();
  const cwAt = (x, z) => Math.max(4, 1.6 * Math.max(gridStep(x), gridStep(z)));
  // Batcave-Eingang: dort, wo der Wassertunnel die Kueste kreuzt
  let M0 = null;
  for (let k = 0; k < SEA_TUNNEL.length - 1 && !M0; k++) for (let t = 0; t <= 1; t += 0.01) {
    const x = lerp(SEA_TUNNEL[k][0], SEA_TUNNEL[k + 1][0], t), z = lerp(SEA_TUNNEL[k][1], SEA_TUNNEL[k + 1][1], t);
    if (seaD(x, z) > -0.5) { M0 = [x, z]; break; }
  }
  const [ta, tb] = [SEA_TUNNEL[SEA_TUNNEL.length - 2], SEA_TUNNEL[SEA_TUNNEL.length - 1]], tl = Math.hypot(tb[0] - ta[0], tb[1] - ta[1]), bnx = (tb[0] - ta[0]) / tl, bnz = (tb[1] - ta[1]) / tl;   // Richtung des Wassertunnels
  const BAT = { cx: M0[0], cz: M0[1], nx: bnx, nz: bnz, w: 9.6, h: 7, d: 11, open: true };
  const holes = [...WATER_CAVES, BAT];
  // ---- Kuestenlinien sammeln: Grundkueste (wo kein Landstueck davor liegt, inkl. Bucht) und Raender der Landstuecke ----
  const lines = [], STEP = 0.8;
  let cur = null;
  for (let t = -1100; t <= 1700; t += STEP * 0.7) {
    const [x, z] = coastPt(t), r = Math.hypot(x, z), ok = r < 1250 && LANDS.every(L => landSD(L, x, z) > -2.5);   // leicht ueberlappen, sonst Spalt am Anschluss der Landstuecke
    if (!ok) { cur = null; continue; }
    if (cur && Math.hypot(x - cur[cur.length - 1][0], z - cur[cur.length - 1][1]) < STEP * Math.max(1, r / 420)) continue;   // ca. 0,8 m, weit draussen groeber
    if (!cur) lines.push(cur = []);
    const [nx, nz] = coastN(t); cur.push([x, z, nx, nz]);
  }
  for (const L of LANDS) {
    const P = L.p, pts = [];
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / STEP)); for (let k = 0; k < n; k++) pts.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); }
    let start = pts.findIndex(([x, z]) => seaBase(x, z) <= 1); if (start < 0) start = 0;
    cur = null;
    for (let k = 0; k <= pts.length; k++) {
      const q = (start + k) % pts.length, [x, z] = pts[q], ok = seaBase(x, z) > -2.5 && Math.hypot(x, z) < 1250;
      if (!ok) { cur = null; continue; }
      if (!cur) lines.push(cur = []);
      const [ax, az] = pts[(q - 1 + pts.length) % pts.length], [bx, bz] = pts[(q + 1) % pts.length];
      let nx = bz - az, nz = -(bx - ax); const l = Math.hypot(nx, nz); nx /= l; nz /= l;
      if (seaD(x + nx * 2, z + nz * 2) < seaD(x - nx * 2, z - nz * 2)) { nx = -nx; nz = -nz; }
      cur.push([x, z, nx, nz]);
    }
  }
  // ---- Felswand (Nicolas, 2026-11-07: realistische Alpenfelswand) ----
  // Pro Spalte (0,8 m) 56 Reihen. Versatz zum Meer aus: Pfeilern und tiefen Spalten (gross), geneigten Gesteinsschichten mit eigener
  // Tiefe je Schicht und Abschnitt, Gesteinsplatten (Zellen), Ueberhaengen an den Schichtkoepfen und unter der Kante, Erosionsrinnen,
  // feinen Bruechen. Farbe danach aus Normalen: Spalten dunkel (Tiefe), Feuchte-Streifen, Moos auf Absaetzen, oben unregelmaessig in die Wiese.
  const NR = 56, pos = [], uv = [], idx = [], meta = [];
  const inHole = (x, z, y) => {
    for (const h of holes) {
      const dx = x - h.cx, dz = z - h.cz;
      if (dx * dx + dz * dz > (h.w + 6) ** 2) continue;
      const u = -dx * h.nz + dz * h.nx, yy = y - (SEA_Y - 2.5), H = h.h + 2.5;
      if (yy < H && Math.abs(u) < h.w / 2 * Math.sqrt(Math.max(0, 1 - (yy / H) ** 2)) * (1 + 0.16 * (vnoise(u * 0.7 + h.cx, y * 0.6) - 0.5))) return true;
    }
    return false;
  };
  const ridged = (x, y) => 1 - Math.abs(2 * vnoise(x, y) - 1);
  const bump = (y, c, w) => Math.max(0, 1 - Math.abs(y - c) / w);
  const feet = [];                                                          // Wandfuss fuer Geroell
  let lineNo = 0;
  for (const line of lines) {
    if (line.length < 4) continue;
    const base = pos.length / 3, A0 = 137 * ++lineNo; let along = 0;
    for (let i = 0; i < line.length; i++) {
      const [x, z, nx, nz] = line[i];
      if (i) along += Math.hypot(x - line[i - 1][0], z - line[i - 1][1]);
      const a = along + A0, cw = cwAt(x, z), top = terrainH(x - nx * 0.9 * cw, z - nz * 0.9 * cw), bot = SEA_Y - 4;
      const topJ = top + 0.15 + 0.7 * (vnoise(a / 3.1, 2) - 0.4), lipH = 1.4 + 2.2 * vnoise(a / 9, 5);   // gezackte Kante
      const butt = 2.4 * (ridged(a / 16 + 3, 1) - 0.55) + 1.0 * (ridged(a / 6 + 1, 4) - 0.5);           // Pfeiler
      const ohMask = sst(0.6, 0.78, vnoise(a / 34 + 7, 4));                                             // grosse Ueberhaenge unter der Kante
      const Lth = 2.4 + 3.6 * vnoise(a / 70 + 2, 9), dip = 5 * Math.sin(a / 95) + 2.5 * vnoise(a / 28, 1);
      for (let j = 0; j <= NR; j++) {
        const y = j === NR ? topJ : lerp(bot, topJ, j / NR), q = clamp01((top - y) / (top - bot));
        // Schichten (geneigt), Tiefe je Schicht und Abschnitt, Kopf steht vor (Ueberhang), Fuss zurueck
        const yy = y + dip, lay = yy / Lth, li = Math.floor(lay), f = lay - li;
        const seg = Math.floor(a / (6 + 7 * hash2(li, 7)) + hash2(li, 3) * 9);
        const layerDepth = 1.5 * (hash2(li * 31 + 5, seg) - 0.5);
        const ledge = 0.75 * sst(0.8, 0.98, f) - 0.55 * (1 - sst(0, 0.22, f));
        // Gesteinsplatten (Zellen 2-4 m), tiefe Spalten, Rinnen, feine Brueche
        const cx = Math.floor(a / (2.4 + 1.6 * vnoise(li, 1)) + li * 0.37), plate = 0.55 * (hash2(cx, li * 13 + 1) - 0.5);
        const crev = Math.pow(1 - Math.abs(Math.sin(a / 7.3 + 2.5 * vnoise(a / 30, y / 25))), 22) * (0.6 + 0.6 * vnoise(a / 12, y / 18));
        const rill = Math.pow(1 - Math.abs(Math.sin(a * 1.7 + 3 * vnoise(a / 4, y / 9))), 30) * sst(top - 2, top - 14, y);
        const fine = 0.28 * (vnoise(a / 0.9 + 3, y / 0.9) - 0.5) + 0.14 * (vnoise(a / 0.4, y / 0.45 + 7) - 0.5);
        const oh = ohMask * (1.7 * bump(y, top - 3.2, 1.8) - 1.1 * bump(y, top - 6.5, 2.4));
        const shelf = 1.4 * sst(0.55, 0.7, vnoise(a / 55 + 9, 2)) * sst(SEA_Y + 3.4, SEA_Y + 2.2, y) * sst(SEA_Y + 0.6, SEA_Y + 1.6, y);
        const notch = -1.0 * bump(y, SEA_Y + 0.6, 1.7);
        const smooth = 0.5 * cw + 1.6 + butt + layerDepth;                     // grobe Form (fuer die Tiefe/Schatten-Farbe)
        let o = smooth + ledge + plate - 2.4 * crev - 0.45 * rill + fine + oh + shelf + notch;
        o = Math.max(o, lerp(-0.62 * cw, 0.38 * cw, q) + 0.25);              // nie hinter die grobe Gelaende-Klippe
        const lip = sst(top - lipH, topJ, y);
        o = lerp(o, -0.9 * cw, lip);                                          // oben ueber die Kante zurueck aufs Land
        pos.push(x + nx * o, y, z + nz * o); uv.push(a / 4, y / 4);
        meta.push(a, y, smooth + ledge + plate - o, crev, li, lip, top);
        if (j === 3) feet.push([x + nx * (o + 0.6), z + nz * (o + 0.6), nx, nz, a]);
      }
    }
    for (let i = 0; i < line.length - 1; i++) for (let j = 0; j < NR; j++) {
      const a0 = base + i * (NR + 1) + j, b0 = a0 + NR + 1;
      const mx = (line[i][0] + line[i + 1][0]) / 2, mz = (line[i][1] + line[i + 1][1]) / 2, my = (pos[a0 * 3 + 1] + pos[a0 * 3 + 4]) / 2;
      if (inHole(mx, mz, my)) continue;
      idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  // Farben aus Lage, Normale und Tiefe
  const N = g.attributes.normal, col = new Float32Array(pos.length);
  const cGrey = new THREE.Color(0x8a867f), cSlate = new THREE.Color(0x4e5156), cBrown = new THREE.Color(0x7c6b58), cWeather = new THREE.Color(0xb0a998),
    cMoss = new THREE.Color(0x56692f), cGrass = new THREE.Color(0x5f8a3a), cWetS = new THREE.Color(0x2f3032);
  for (let v = 0; v < pos.length / 3; v++) {
    const [a, y, rec, crev, li, lip, top] = meta.slice(v * 7, v * 7 + 7), ny = N.getY(v);
    tc.copy(cGrey).lerp(cSlate, sst(0.45, 0.85, hash2(li, 77)) * 0.7).lerp(cBrown, 0.45 * sst(0.55, 0.85, vnoise(a / 40 + 3, y / 30)));
    tc.lerp(cWeather, 0.35 * sst(-0.2, -0.9, rec) + 0.15 * vnoise(a / 3, y / 3));                 // vorstehend: verwittert, heller
    tc.multiplyScalar((1 - 0.55 * clamp01(rec / 1.6)) * (1 - 0.6 * clamp01(crev * 1.6)) * (0.88 + 0.24 * vnoise(a / 1.3, y / 1.1)));   // Tiefe dunkel
    const streak = Math.pow(1 - Math.abs(Math.sin(a * 0.55 + 4 * vnoise(a / 7, 0))), 10) * sst(top + 1, top - 20, y);
    tc.lerp(cWetS, 0.45 * streak);                                                                     // Feuchte-Streifen
    if (ny > 0.45 && y > SEA_Y + 3) tc.lerp(cMoss, sst(0.45, 0.85, ny) * sst(0.4, 0.7, vnoise(a / 5 + 11, y / 4)) * 0.7);   // Moos auf Absaetzen
    tc.lerp(cGrass, lip * sst(0.35, 0.65, vnoise(a / 4 + 2, 3)) * 0.85);                            // oben unregelmaessig in die Wiese
    if (y < SEA_Y + 1.4) tc.lerp(cWet, sst(SEA_Y + 1.4, SEA_Y + 0.3, y) * 0.75);
    if (y > SEA_Y - 0.2 && y < SEA_Y + 1.1) tc.lerp(cAlgae, 0.45 * sst(0.3, 0.7, vnoise(a / 4, 5)));
    col.set([tc.r, tc.g, tc.b], v * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  // Gesteinstextur mit Relief: Hoehenbild (Koernung, Bruchlinien, kleine Platten) -> Farbe und Normalmap
  const TS = 512, hc = document.createElement("canvas"); hc.width = hc.height = TS;
  { const g2 = hc.getContext("2d"), rr = rng(4711); g2.fillStyle = "#808080"; g2.fillRect(0, 0, TS, TS);
    for (let i = 0; i < 1400; i++) { const v = 100 + rr() * 60; g2.fillStyle = `rgba(${v},${v},${v},.35)`; g2.beginPath(); g2.ellipse(rr() * TS, rr() * TS, 4 + rr() * 30, 3 + rr() * 16, rr() * 0.6 - 0.3, 0, 7); g2.fill(); }
    for (let i = 0; i < 9000; i++) { const v = 70 + rr() * 120; g2.fillStyle = `rgba(${v},${v},${v},.5)`; g2.fillRect(rr() * TS, rr() * TS, 1 + rr() * 2, 1 + rr() * 2); }
    g2.strokeStyle = "rgba(20,20,20,.75)";
    for (let i = 0; i < 70; i++) { g2.lineWidth = 0.8 + rr() * 1.8; g2.beginPath(); let x = rr() * TS, y = rr() * TS, ang = rr() < 0.6 ? (rr() - 0.5) * 0.5 : Math.PI / 2 + (rr() - 0.5) * 0.6; g2.moveTo(x, y); for (let k = 0; k < 8 + rr() * 10; k++) { ang += (rr() - 0.5) * 0.7; x += Math.cos(ang) * (6 + rr() * 12); y += Math.sin(ang) * (6 + rr() * 12); g2.lineTo(x, y); } g2.stroke(); } }
  const hd = hc.getContext("2d").getImageData(0, 0, TS, TS).data, nc = document.createElement("canvas"); nc.width = nc.height = TS;
  { const nctx = nc.getContext("2d"), out = nctx.createImageData(TS, TS), H = (x, y) => hd[(((y + TS) % TS) * TS + ((x + TS) % TS)) * 4] / 255;
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) { const dx = (H(x - 1, y) - H(x + 1, y)) * 3, dy = (H(x, y - 1) - H(x, y + 1)) * 3, l = Math.hypot(dx, dy, 1), k = (y * TS + x) * 4; out.data[k] = (dx / l * 0.5 + 0.5) * 255; out.data[k + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[k + 3] = 255; }
    nctx.putImageData(out, 0, 0); }
  const albedo = new THREE.CanvasTexture(hc); albedo.colorSpace = THREE.SRGBColorSpace; albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping; albedo.anisotropy = 8;
  const nmap = new THREE.CanvasTexture(nc); nmap.wrapS = nmap.wrapT = THREE.RepeatWrapping; nmap.anisotropy = 8;
  const skinMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: albedo, normalMap: nmap, normalScale: new THREE.Vector2(1.3, 1.3), roughness: 0.93, metalness: 0, side: THREE.DoubleSide });
  skinMat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n diffuseColor.rgb *= 1.55;"); };   // Textur als Detail (mittelgrau -> neutral)
  const skin = new THREE.Mesh(g, skinMat);
  skin.castShadow = skin.receiveShadow = true; skin.userData.keep = true; scene.add(skin);
  // ---- Geroell und Brocken am Wandfuss, Polster und Bueschel in Spalten und auf Absaetzen ----
  {
    const scree = [], fr2 = rng(2026);
    for (const [x, z, nx, nz, a] of feet) {
      if (fr2() < 0.45 || inHole(x, z, SEA_Y + 0.5)) continue;
      for (let k = 0, n = 1 + Math.floor(fr2() * 3); k < n; k++) {
        const s = fr2() < 0.15 ? 0.9 + fr2() * 1.8 : 0.2 + fr2() * 0.7, off = fr2() * 3.2, side = (fr2() - 0.5) * 1.6;
        scree.push([x + nx * off - nz * side, SEA_Y - s * 0.35 + fr2() * 0.3, z + nz * off + nx * side, s]);
      }
    }
    const o = new THREE.Object3D(), cc = new THREE.Color();
    const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ map: albedo, normalMap: nmap, roughness: 0.95 }), scree.length);
    scree.forEach(([x, y, z, s], k) => { o.position.set(x, y, z); o.rotation.set(fr2() * 6, fr2() * 6, fr2() * 6); o.scale.set(s * (0.8 + fr2() * 0.5), s * (0.55 + fr2() * 0.35), s * (0.8 + fr2() * 0.5)); o.updateMatrix(); im.setMatrixAt(k, o.matrix); im.setColorAt(k, cc.copy(fr2() < 0.5 ? cGrey : cSlate).lerp(cBrown, fr2() * 0.4).multiplyScalar(0.75 + fr2() * 0.3)); });
    im.castShadow = im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im);
    // Polster/Bueschel: auf nach oben zeigenden Stellen der Wand (Absaetze, Spalten) und an der Kante
    const tufts = [];
    for (let v = 0; v < pos.length / 3 && tufts.length < 1400; v += 3) {
      const ny = N.getY(v), y = pos[v * 3 + 1], lip = meta[v * 7 + 5];
      if (y < SEA_Y + 4 || (ny < 0.55 && lip < 0.3) || fr2() > 0.09) continue;
      tufts.push([pos[v * 3], y, pos[v * 3 + 2], lip > 0.3 && fr2() < 0.35 ? 0.6 + fr2() * 0.7 : 0.18 + fr2() * 0.3]);
    }
    const tim = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), tufts.length);
    tufts.forEach(([x, y, z, s], k) => { o.position.set(x, y + s * 0.3, z); o.rotation.set(0, fr2() * 6, 0); o.scale.set(s, s * (0.55 + fr2() * 0.4), s); o.updateMatrix(); tim.setMatrixAt(k, o.matrix); tim.setColorAt(k, cc.setHSL(0.2 + fr2() * 0.08, 0.35 + fr2() * 0.2, 0.2 + fr2() * 0.12)); });
    tim.castShadow = true; tim.computeBoundingSphere(); scene.add(tim);
  }
  // ---- Hoehlenroehren (halbe Ellipse, nach hinten schmaler und dunkler), Wasser darin, Kollision an den Seiten ----
  const tp = [], tcol = [], tidx = [], wp = [], widx = [];
  for (const h of holes) {
    const cw = cwAt(h.cx, h.cz), NA = 16, NRG = 14, v0 = -(0.5 * cw + 5), taper = h.open ? 0 : 0.38, b0 = tp.length / 3, w0 = wp.length / 3;
    for (let k = 0; k <= NRG; k++) {
      const v = lerp(v0, h.d, k / NRG), f = clamp01(v / h.d) ** 1.2, a = h.w / 2 * (1 - taper * f) + 0.3, bb = h.h * (1 - (h.open ? 0 : 0.3) * f) + 0.3;
      for (let m = 0; m <= NA; m++) {
        const th = Math.PI * m / NA, r = 1 + 0.12 * (vnoise(k * 0.9 + h.cx, m * 0.8) - 0.5), u = a * Math.cos(th) * r, y = SEA_Y - 2.5 + (bb + 2.5) * Math.sin(th) * r;
        tp.push(h.cx - h.nx * v - h.nz * u, y, h.cz - h.nz * v + h.nx * u);
        tc.copy(cCliff).multiplyScalar(lerp(0.85, h.open ? 0.3 : 0.12, (k / NRG)) * (0.85 + 0.3 * vnoise(k, m)));
        if (y < SEA_Y + 1) tc.lerp(cWet, 0.6);
        tcol.push(tc.r, tc.g, tc.b);
      }
      for (const s of [-1, 1]) { wp.push(h.cx - h.nx * v - h.nz * s * a * 0.98, SEA_Y - 0.02, h.cz - h.nz * v + h.nx * s * a * 0.98); }
      if (k) { const p0 = b0 + (k - 1) * (NA + 1), p1 = p0 + NA + 1; for (let m = 0; m < NA; m++) tidx.push(p0 + m, p1 + m, p0 + m + 1, p0 + m + 1, p1 + m, p1 + m + 1);
        const q0 = w0 + (k - 1) * 2; widx.push(q0, q0 + 2, q0 + 1, q0 + 1, q0 + 2, q0 + 3); }
      if (v > 0 && !h.open) for (const s of [-1, 1]) circles.push([h.cx - h.nx * v - h.nz * s * a, h.cz - h.nz * v + h.nx * s * a, 0.6, SEA_Y + h.h + 1]);
    }
    if (!h.open) {                                                          // Rueckwand
      const last = b0 + NRG * (NA + 1), c = tp.length / 3, [ex, ez] = [h.cx - h.nx * (h.d + 0.6), h.cz - h.nz * (h.d + 0.6)];
      tp.push(ex, SEA_Y + h.h * 0.3, ez); tcol.push(cWet.r * 0.4, cWet.g * 0.4, cWet.b * 0.4);
      for (let m = 0; m < NA; m++) tidx.push(last + m, c, last + m + 1);
      tidx.push(last + NA, c, last);                                    // unten zwischen den Enden schliessen
      circles.push([ex + h.nx * 0.6, ez + h.nz * 0.6, h.w * 0.3, SEA_Y + h.h + 1]);
    }
  }
  const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute("color", new THREE.Float32BufferAttribute(tcol, 3)); tg.setIndex(tidx); tg.computeVertexNormals();
  const tubes = new THREE.Mesh(tg, M(0xffffff, { vertexColors: true, roughness: 1, side: THREE.DoubleSide })); tubes.receiveShadow = true; tubes.userData.keep = true; scene.add(tubes);
  const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute("uv", new THREE.Float32BufferAttribute(wp.flatMap((v, i) => i % 3 === 1 ? [] : [v / 10]), 2)); wg.setIndex(widx); wg.computeVertexNormals();
  const cwater = new THREE.Mesh(wg, mat.sea); cwater.userData.keep = true; scene.add(cwater);
  // ---- Felsnadeln und Brocken am Fuss (Felsgenerator, in Klippenfarbe) ----
  const geos = [], sr = rng(919);
  for (const st of SEA_STACKS) {
    const H = st.h + 8, g2 = makeRock(st.r, H / 2, st.r * 0.9, sr(), 4), P = g2.attributes.position;
    for (let q = 0; q < P.count; q++) { const f = clamp01((P.getY(q) + H / 2) / H), k = lerp(1.15, 0.45, f); P.setX(q, P.getX(q) * k); P.setZ(q, P.getZ(q) * k); }
    g2.computeVertexNormals(); g2.rotateY(sr() * 6); g2.translate(st.x, SEA_Y - 8 + H / 2, st.z); geos.push(g2);
    circles.push([st.x, st.z, st.r * 1.05, SEA_Y + st.h]);
  }
  for (const h of holes) if (h.w >= 6) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
    const u = s * (h.w / 2 + 2 + sr() * 4), v = -2 - sr() * 3, sz = 1.2 + sr() * 1.8, x = h.cx - h.nx * v - h.nz * u, z = h.cz - h.nz * v + h.nx * u;
    const g2 = makeRock(sz, sz * 0.7, sz, sr(), 3); g2.rotateY(sr() * 6); g2.translate(x, SEA_Y - 0.4, z); geos.push(g2);
  }
  if (geos.length) { const m = new THREE.Mesh(mergeGeometries(geos, false), M(0xffffff, { vertexColors: true, map: rockTex, roughness: 0.95 })); m.castShadow = m.receiveShadow = true; m.userData.keep = true; scene.add(m); }
}
