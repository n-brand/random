// Batverse – Gotham: Haengebruecken (Plan G2, Schritt G2c, Nicolas 2026-11-12)
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Nach gotham-strassen.js. Daten: GOTHAM_STADT.bruecken (gerade Linien aus der Karte: 25 m in der Insel bis 25 m hinter dem anderen Ufer).
"use strict";

// Stil Williamsburg/Manhattan Bridge, stilisiert: Fahrbahn auf Strassenebene (-12, 22 m ueber dem Wasser; Nicolas 2026-11-12: Insel 4 m angehoben), w m Fahrbahn plus je 2,5 m Gehweg,
// 3 m dicker Stahlkasten; am Festland weiter auf Pfeilern, bis das Gelaende die Fahrbahn erreicht (G2d baut dort die Strassen an). Je Ufer ein
// Stahlturm (zwei Beine aussen neben dem Deck, Querriegel und Kreuzstreben ueber der Durchfahrt, 62 m ueber der Fahrbahn), zwei Tragseile im Bogen
// von den Seil-Enden (bis 70 m hinter den Tuermen, kleiner Stahlschuh am Deck) ueber die Turmspitzen, Haenger alle 10 m. Gelaender 1,1 m mit Kollision, Boden ueber
// gothamBridgeAt (nur wer oben ist, nicht wer darunter schwimmt). Die Kaimauer hat an jeder Bruecke eine Luecke in der Bruestung (gotham-kai.js).
const GBR = { list: [] };
// Hohe Hindernisse: Kreise mit Oberkante gelten nur in den 8 m darunter, darum gestapelt alle 6 m (Turmbeine, Pfeiler, Ankerbloecke).
// Nicolas 2026-11-12: man lief in Turmbeine hinein.
const tallCircle = (x, z, r, y0, y1) => { for (let t = y0 + 6; t < y1 + 6; t += 6) circles.push([x, z, r, Math.min(t, y1)]); };
{
  const Y = GOT.STR + 0.07, steel = M(0x5b6670, { metalness: 0.5, roughness: 0.55 }), dark = M(0x3a4148, { metalness: 0.4, roughness: 0.6 }), conc = M(0x8f8b84, { roughness: 0.95 });
  const cableM = M(0x2c3136, { metalness: 0.6, roughness: 0.45 });
  const deckTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#3b3d40"; c.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { const v = 45 + Math.random() * 30; c.fillStyle = `rgb(${v},${v + 1},${v + 3})`; c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    const L = (u, col, dash) => { c.fillStyle = col; for (let v = 0; v < h; v += dash ? h / 2 : h) c.fillRect(u * w - 1.5, v, 3, dash ? h / 4 : h); };   // Linien laengs (v = laengs)
    L(0.035, "#d8d8d2"); L(0.965, "#d8d8d2"); L(0.485, "#d9b23c"); L(0.515, "#d9b23c"); L(0.26, "#d8d8d2", true); L(0.74, "#d8d8d2", true); });
  deckTex.wrapT = THREE.RepeatWrapping;
  const walkM = M(0x9c9a94, { roughness: 0.95 });
  const G = new THREE.Group(); G.name = "Gotham-Bruecken";
  const boxAtW = (sx, sy, sz, m, x, y, z, rotY, rotX = 0, rotZ = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); o.position.set(x, y, z); o.rotation.set(rotX, rotY, rotZ, "YXZ"); G.add(o); return o; };
  for (const b of GOTHAM_STADT.bruecken) {
    const P = b.pts.map(([x, z]) => GOT.toGame(x, z)), a = P[0], e0 = P[P.length - 1];
    let L = Math.hypot(e0[0] - a[0], e0[1] - a[1]); const ux = (e0[0] - a[0]) / L, uz = (e0[1] - a[1]) / L, nx = -uz, nz = ux, rot = Math.atan2(ux, uz);
    // Festland: weiter, bis das Gelaende die Fahrbahn erreicht (hoechstens 260 m)
    let ext = 0; while (ext < 260 && genH(e0[0] + ux * ext, e0[1] + uz * ext) < GOT.STR - 0.3) ext += 4;
    L += ext;
    const at = s => [a[0] + ux * s, a[1] + uz * s], half = b.w / 2 + 2.5, br = { name: b.name, a, ux, uz, nx, nz, L, half, w: b.w };
    GBR.list.push(br);
    // Fahrbahn: Stahlkasten, darauf Asphalt (mit Markierung) und Gehwege
    const [cx, cz] = at(L / 2);
    boxAtW(half * 2, 3, L, dark, cx, Y - 1.55, cz, rot);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(b.w, L).rotateX(-Math.PI / 2), M(0xffffff, { map: deckTex.clone(), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    top.material.map.wrapT = THREE.RepeatWrapping; top.material.map.repeat.set(1, L / 12); top.material.map.needsUpdate = true;
    top.position.set(cx, Y + 0.01, cz); top.rotation.y = rot; G.add(top);
    for (const sd of [-1, 1]) { boxAtW(2.5, 0.2, L, walkM, cx + nx * sd * (b.w / 2 + 1.25), Y + 0.08, cz + nz * sd * (b.w / 2 + 1.25), rot);   // Gehweg
      boxAtW(0.25, 1.1, L, steel, cx + nx * sd * (half - 0.12), Y + 0.55, cz + nz * sd * (half - 0.12), rot);                                  // Gelaender
      for (let s = 0.4; s < L; s += 1.2) { const [px, pz] = at(s); circles.push([px + nx * sd * (half - 0.65), pz + nz * sd * (half - 0.65), 0.65, Y + 1.1]); } }   // r 0,65 alle 1,2 m (ueberlappend)
    // Pfeiler unter dem Festlandstueck (alle 30 m, wo Luft unter der Fahrbahn ist)
    const sFar = L - ext - 25;                                                // Lage des anderen Ufers
    for (let s = sFar + 30; s < L - 8; s += 30) { const [px, pz] = at(s), g = genH(px, pz); if (Y - 3 - g > 1) boxAtW(half * 1.6, Y - 3 - g + 2, 3, conc, px, (Y - 3 + g - 2) / 2, pz, rot);
      for (let q = -half * 0.8 + 1.5; q <= half * 0.8 - 1.5 + 0.01; q += 1.4) tallCircle(px + nx * q, pz + nz * q, 1.8, g - 1, Y - 3); }
    // Tuerme an beiden Ufern, Anker 70 m dahinter
    const sT = [25, sFar], H = 62, legX = half + 1.6;
    for (const s of sT) { const [tx, tz] = at(s), base = Math.min(GOT.WY - 1, genH(tx, tz) - 1);
      for (const sd of [-1, 1]) boxAtW(3, Y + H - base, 3.4, steel, tx + nx * sd * legX, (Y + H + base) / 2, tz + nz * sd * legX, rot);
      for (const hy of [Y - 2.5, Y + 24, Y + 44, Y + H - 1.5]) boxAtW(legX * 2 + 3, hy > Y ? 2.4 : 3, 2.6, steel, tx, hy, tz, rot);               // Querriegel
      for (const [y0, y1] of [[Y + 24, Y + 44], [Y + 44, Y + H - 1.5]]) for (const sg of [-1, 1]) {                                            // Kreuzstreben ueber der Durchfahrt
        const dy = y1 - y0, l = Math.hypot(legX * 2, dy); boxAtW(1, l, 1.2, steel, tx, (y0 + y1) / 2, tz, rot, 0, sg * Math.atan2(legX * 2, dy)); }
      for (const sd of [-1, 1]) tallCircle(tx + nx * sd * legX, tz + nz * sd * legX, 2.5, base, Y + H); }
    // Tragseile (Bogen ueber die Turmspitzen), Ankerbloecke, Haenger
    const sA = [Math.max(0, sT[0] - 70), Math.min(L, sT[1] + 70)];
    // Seil-Enden (Nicolas 2026-11-12: keine Betonkloetze mehr, die standen neben der Fahrbahn): die Tragseile enden an beiden Brueckenenden in einem
    // kleinen Stahlschuh direkt neben dem Deck (wie bei selbstverankerten Haengebruecken), ohne Kollision
    for (const s of sA) { const [px, pz] = at(s); for (const sd of [-1, 1]) boxAtW(1.4, 1.6, 3, steel, px + nx * sd * legX, Y + 0.8, pz + nz * sd * legX, rot); }
    const yC = s => { const top = Y + H + 1, low = Y + 9;
      if (s <= sT[0]) return Y + 1.5 + (top - Y - 1.5) * (s - sA[0]) / (sT[0] - sA[0]);
      if (s >= sT[1]) return Y + 1.5 + (top - Y - 1.5) * (sA[1] - s) / (sA[1] - sT[1]);
      const u = (s - sT[0]) / (sT[1] - sT[0]) * 2 - 1; return low + (top - low) * u * u; };
    const hanger = [];
    for (const sd of [-1, 1]) { const pts = []; for (let s = sA[0]; s <= sA[1] + 0.01; s += 4) { const [px, pz] = at(s); pts.push(new THREE.Vector3(px + nx * sd * legX, yC(s), pz + nz * sd * legX)); }
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.55, 8, false), cableM); G.add(m);
      for (let s = sT[0] + 10; s < sT[1] - 5; s += 10) { const [px, pz] = at(s), y0 = Y + 1, y1 = yC(s); hanger.push(new THREE.CylinderGeometry(0.09, 0.09, y1 - y0, 5).translate(px + nx * sd * legX, (y0 + y1) / 2, pz + nz * sd * legX)); } }
    if (hanger.length) G.add(new THREE.Mesh(mergeGeometries(hanger, false), cableM));
  }
  G.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.userData.keep = true; } }); G.userData.keep = true; G.userData.noLift = true; G.userData.dynamic = true; scene.add(G);
  GBR.group = G; GBR.Y = Y;
}
// Boden auf einer Bruecke (Fahrbahn und Gehwege), nur fuer wen oben ist (Fuesse hoechstens 3 m unter der Fahrbahn); sonst null
function gothamBridgeAt(x, z, feet) {
  if (feet < GBR.Y - 3) return null;
  for (const b of GBR.list) { const dx = x - b.a[0], dz = z - b.a[1], s = dx * b.ux + dz * b.uz; if (s < 0 || s > b.L) continue; if (Math.abs(dx * b.nx + dz * b.nz) <= b.half) return GBR.Y; }
  return null;
}
