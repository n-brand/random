// Batverse – Gotham: Haengebruecken (Plan G2, Schritt G2c, Nicolas 2026-11-12)
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Nach gotham-strassen.js. Daten: GOTHAM_STADT.bruecken (gerade Linien aus der Karte: 25 m in der Insel bis 25 m hinter dem anderen Ufer).
"use strict";

// Stil Williamsburg/Manhattan Bridge, stilisiert: Fahrbahn auf Strassenebene (-12, 22 m ueber dem Wasser; Nicolas 2026-11-12: Insel 4 m angehoben), w m Fahrbahn plus je 2,5 m Gehweg,
// 3 m dicker Stahlkasten; am Festland weiter auf Pfeilern, bis das Gelaende die Fahrbahn erreicht (G2d baut dort die Strassen an). Je Ufer ein
// Stahlturm (zwei Beine aussen neben dem Deck, Querriegel und Kreuzstreben ueber der Durchfahrt, 62 m ueber der Fahrbahn), zwei Tragseile im Bogen
// von den Seil-Enden (bis 70 m hinter den Tuermen, kleiner Stahlschuh am Deck) ueber die Turmspitzen, Haenger alle 10 m. Gelaender 1,1 m mit Kollision, Boden ueber
// gothamBridgeAt (nur wer oben ist, nicht wer darunter schwimmt). Die Kaimauer hat an jeder Bruecke eine Luecke in der Bruestung (gotham-kai.js).
const GBR = { list: [], parts: [], grid: new Map(), q: 0 };
// Feste Brueckenteile (Nicolas 2026-11-14: "der DeLorean sollte nicht durch die Brueckenteile durchfliegen koennen", "generell sollen die
// Brueckenteile fest sein"): Fahrbahnkasten, Querriegel, Kreuzstreben, Turmbeine, Pfeiler, Seil-Enden, Tragseile und Haenger als gedrehte Quader
// in einem 16-m-Raster, je 0,3 m groesser als sichtbar (Nicolas: lieber frueher halten). Seitlich schieben sie Fahrzeuge und Fussgaenger weg
// (gbrPush), von unten sind sie Decke (gbrCeil), von oben Boden (gothamBridgeAt), Flugzeuge und Kamera pruefen Punkte (gbrIn).
// Teil: Mitte cx/cy/cz, Laengsrichtung ux/uz, halbe Laenge hl, halbe Breite hw (quer), halbe Hoehe hh; floor = 0: kein Boden (Fahrbahnkasten: der Boden kommt von gothamBridgeAt)
// chain = 1: Stueck einer Kette (Fahrbahnkasten, Tragseil): steckt etwas ganz darin, nur quer hinausschieben, nicht ins naechste Stueck
function gbrPart(cx, cy, cz, ux, uz, hl, hw, hh, floor = 1, chain = 0, m = 0.3) {
  const o = { cx, cz, ux, uz, hl: hl + m, hw: hw + m, y0: cy - hh - m, y1: cy + hh + m, top: cy + hh, floor, chain, _q: 0 };
  GBR.parts.push(o);
  const cs = 16, ex = Math.abs(ux) * o.hl + Math.abs(uz) * o.hw, ez = Math.abs(uz) * o.hl + Math.abs(ux) * o.hw;
  for (let i = Math.floor((cx - ex) / cs); i <= Math.floor((cx + ex) / cs); i++) for (let k = Math.floor((cz - ez) / cs); k <= Math.floor((cz + ez) / cs); k++) {
    const key = collKey(i, k); let c = GBR.grid.get(key); if (!c) GBR.grid.set(key, c = []); c.push(o); }
  return o;
}
// Teile, deren Grundriss den Kreis (x, z, R) beruehrt; fn(o, a, b, ca, cb) mit Lage a/b im Teil und naechstem Punkt ca/cb
function gbrEach(x, z, R, fn) {
  const cs = 16, q = ++GBR.q;
  for (let i = Math.floor((x - R) / cs), i1 = Math.floor((x + R) / cs); i <= i1; i++) for (let k = Math.floor((z - R) / cs), k1 = Math.floor((z + R) / cs); k <= k1; k++) {
    const c = GBR.grid.get(collKey(i, k)); if (!c) continue;
    for (const o of c) { if (o._q === q) continue; o._q = q;
      const dx = x - o.cx, dz = z - o.cz, a = dx * o.ux + dz * o.uz, b = -dx * o.uz + dz * o.ux;
      const ca = Math.max(-o.hl, Math.min(o.hl, a)), cb = Math.max(-o.hw, Math.min(o.hw, b));
      if ((a - ca) ** 2 + (b - cb) ** 2 < R * R || (a === ca && b === cb)) fn(o, a, b, ca, cb); }
  }
}
// seitlich hinausschieben, wenn sich y0..y1 (Koerper ab Stufenhoehe) mit dem Teil ueberschneidet
function gbrPush(p, y0, y1, R) {
  gbrEach(p.x, p.z, R, (o, a, b, ca, cb) => {
    if (o.y1 <= y0 || o.y0 >= y1) return;
    const ea = a - ca, eb = b - cb, d = Math.hypot(ea, eb); let na, nb;
    if (d > 1e-6) { na = ca + ea / d * R; nb = cb + eb / d * R; }
    else if (!o.chain && o.hl - Math.abs(a) < o.hw - Math.abs(b)) { na = (a < 0 ? -1 : 1) * (o.hl + R); nb = b; }
    else { na = a; nb = (b < 0 ? -1 : 1) * (o.hw + R); }
    p.x = o.cx + na * o.ux - nb * o.uz; p.z = o.cz + na * o.uz + nb * o.ux;
  });
}
// Decke: tiefste Unterkante eines Teils ab Hoehe y im Kreis (x, z, R), sonst Infinity
function gbrCeil(x, z, R, y) { let c = Infinity; gbrEach(x, z, R, o => { if (o.y0 >= y && o.y0 < c) c = o.y0; }); return c; }
// Punkt (mit Rand m) in einem Teil?
function gbrIn(x, y, z, m = 0) { let hit = false; gbrEach(x, z, m, o => { if (y > o.y0 - m && y < o.y1 + m) hit = true; }); return hit; }
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
    { const q = half + 3.2, id = "GO-BR-" + b.name.split(" (")[0].replace(/^Gotham-/, "").replace(/-?[Bb]rücke$/, "").toUpperCase().replace(/Ü/g, "UE").replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/[^A-Z0-9]+/g, "-");   // Gebaeude-ID (bauten.js)
      bautAdd({ id, name: b.name, art: "Brücke", poly: [[-q, 0], [q, 0], [q, L], [-q, L]].map(([d, s]) => [a[0] + ux * s + nx * d, a[1] + uz * s + nz * d]), y0: GOT.WY - 2, y1: Y + 64, info: Math.round(L) + " m" }); }
    // Fahrbahn: Stahlkasten, darauf Asphalt (mit Markierung) und Gehwege
    const [cx, cz] = at(L / 2);
    boxAtW(half * 2, 3, L, dark, cx, Y - 1.55, cz, rot);
    for (let s = 0; s < L; s += 16) { const l = Math.min(16, L - s), [px, pz] = at(s + l / 2); gbrPart(px, Y - 1.55, pz, ux, uz, l / 2, half, 1.5, 0, 1); }   // Fahrbahnkasten in 16-m-Stuecken
    const top = new THREE.Mesh(new THREE.PlaneGeometry(b.w, L).rotateX(-Math.PI / 2), M(0xffffff, { map: deckTex.clone(), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    top.material.map.wrapT = THREE.RepeatWrapping; top.material.map.repeat.set(1, L / 12); top.material.map.needsUpdate = true;
    top.position.set(cx, Y + 0.01, cz); top.rotation.y = rot; G.add(top);
    for (const sd of [-1, 1]) { boxAtW(2.5, 0.2, L, walkM, cx + nx * sd * (b.w / 2 + 1.25), Y + 0.08, cz + nz * sd * (b.w / 2 + 1.25), rot);   // Gehweg
      boxAtW(0.25, 1.1, L, steel, cx + nx * sd * (half - 0.12), Y + 0.55, cz + nz * sd * (half - 0.12), rot);                                  // Gelaender
      for (let s = 0.4; s < L; s += 1.2) { const [px, pz] = at(s); circles.push([px + nx * sd * (half - 0.65), pz + nz * sd * (half - 0.65), 0.65, Y + 1.1]); } }   // r 0,65 alle 1,2 m (ueberlappend)
    // Pfeiler unter dem Festlandstueck (alle 30 m, wo Luft unter der Fahrbahn ist)
    const sFar = L - ext - 25;                                                // Lage des anderen Ufers
    for (let s = sFar + 30; s < L - 8; s += 30) { const [px, pz] = at(s), g = genH(px, pz); if (Y - 3 - g > 1) { boxAtW(half * 1.6, Y - 3 - g + 2, 3, conc, px, (Y - 3 + g - 2) / 2, pz, rot); gbrPart(px, (Y - 3 + g - 2) / 2, pz, ux, uz, 1.5, half * 0.8, (Y - 3 - g + 2) / 2, 0); }
      for (let q = -half * 0.8 + 1.5; q <= half * 0.8 - 1.5 + 0.01; q += 1.4) tallCircle(px + nx * q, pz + nz * q, 1.8, g - 1, Y - 3); }
    // Tuerme an beiden Ufern, Anker 70 m dahinter
    const sT = [25, sFar], H = 62, legX = half + 1.6;
    for (const s of sT) { const [tx, tz] = at(s), base = Math.min(GOT.WY - 1, genH(tx, tz) - 1);
      for (const sd of [-1, 1]) { boxAtW(3, Y + H - base, 3.4, steel, tx + nx * sd * legX, (Y + H + base) / 2, tz + nz * sd * legX, rot); gbrPart(tx + nx * sd * legX, (Y + H + base) / 2, tz + nz * sd * legX, ux, uz, 1.7, 1.5, (Y + H - base) / 2); }
      for (const hy of [Y - 2.5, Y + 24, Y + 44, Y + H - 1.5]) { const hh = hy > Y ? 1.2 : 1.5; boxAtW(legX * 2 + 3, hh * 2, 2.6, steel, tx, hy, tz, rot); gbrPart(tx, hy, tz, ux, uz, 1.3, legX + 1.5, hh); }   // Querriegel
      for (const [y0, y1] of [[Y + 24, Y + 44], [Y + 44, Y + H - 1.5]]) for (const sg of [-1, 1]) {                                            // Kreuzstreben ueber der Durchfahrt
        const dy = y1 - y0, l = Math.hypot(legX * 2, dy); boxAtW(1, l, 1.2, steel, tx, (y0 + y1) / 2, tz, rot, 0, sg * Math.atan2(legX * 2, dy));
        const n = 12; for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, q = sg * legX * (2 * u - 1); gbrPart(tx + nx * q, y0 + dy * u, tz + nz * q, ux, uz, 0.6, legX / n, dy / n / 2 + 0.5); } }   // Stuecke laengs der Strebe (beide Diagonalen, je sg eine)
      for (const sd of [-1, 1]) tallCircle(tx + nx * sd * legX, tz + nz * sd * legX, 2.5, base, Y + H); }
    // Tragseile (Bogen ueber die Turmspitzen), Ankerbloecke, Haenger
    const sA = [Math.max(0, sT[0] - 70), Math.min(L, sT[1] + 70)];
    // Seil-Enden (Nicolas 2026-11-12: keine Betonkloetze mehr, die standen neben der Fahrbahn): die Tragseile enden an beiden Brueckenenden in einem
    // kleinen Stahlschuh direkt neben dem Deck (wie bei selbstverankerten Haengebruecken), ohne Kollision
    for (const s of sA) { const [px, pz] = at(s); for (const sd of [-1, 1]) { boxAtW(1.4, 1.6, 3, steel, px + nx * sd * legX, Y + 0.8, pz + nz * sd * legX, rot); gbrPart(px + nx * sd * legX, Y + 0.8, pz + nz * sd * legX, ux, uz, 1.5, 0.7, 0.8); } }
    const yC = s => { const top = Y + H + 1, low = Y + 9;
      if (s <= sT[0]) return Y + 1.5 + (top - Y - 1.5) * (s - sA[0]) / (sT[0] - sA[0]);
      if (s >= sT[1]) return Y + 1.5 + (top - Y - 1.5) * (sA[1] - s) / (sA[1] - sT[1]);
      const u = (s - sT[0]) / (sT[1] - sT[0]) * 2 - 1; return low + (top - low) * u * u; };
    const hanger = [];
    for (const sd of [-1, 1]) { const pts = []; for (let s = sA[0]; s <= sA[1] + 0.01; s += 4) { const [px, pz] = at(s); pts.push(new THREE.Vector3(px + nx * sd * legX, yC(s), pz + nz * sd * legX)); }
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.55, 8, false), cableM); G.add(m);
      for (let s = sA[0]; s < sA[1]; s += 2) { const s1 = Math.min(sA[1], s + 2), ya = yC(s), yb = yC(s1), [px, pz] = at((s + s1) / 2);           // Tragseil in 2-m-Stuecken
        gbrPart(px + nx * sd * legX, (ya + yb) / 2, pz + nz * sd * legX, ux, uz, (s1 - s) / 2, 0.55, Math.abs(ya - yb) / 2 + 0.55, 1, 1); }
      for (let s = sT[0] + 10; s < sT[1] - 5; s += 10) { const [px, pz] = at(s), y0 = Y + 1, y1 = yC(s); hanger.push(new THREE.CylinderGeometry(0.09, 0.09, y1 - y0, 5).translate(px + nx * sd * legX, (y0 + y1) / 2, pz + nz * sd * legX));
        gbrPart(px + nx * sd * legX, (y0 + y1) / 2, pz + nz * sd * legX, ux, uz, 0.09, 0.09, (y1 - y0) / 2); } }
    if (hanger.length) G.add(new THREE.Mesh(mergeGeometries(hanger, false), cableM));
  }
  G.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.userData.keep = true; } }); G.userData.keep = true; G.userData.noLift = true; G.userData.dynamic = true; scene.add(G);
  GBR.group = G; GBR.Y = Y;
}
// Boden auf einer Bruecke (Fahrbahn und Gehwege), nur fuer wen oben ist (Fuesse hoechstens 3 m unter der Fahrbahn); sonst null
// Dazu die Oberseite fester Teile (Querriegel, Seile ...), wenn die Fuesse hoechstens 0,6 m darunter sind (Nicolas 2026-11-14: Brueckenteile fest)
function gothamBridgeAt(x, z, feet) {
  let best = null;
  if (feet >= GBR.Y - 3) for (const b of GBR.list) { const dx = x - b.a[0], dz = z - b.a[1], s = dx * b.ux + dz * b.uz; if (s < 0 || s > b.L) continue; if (Math.abs(dx * b.nx + dz * b.nz) <= b.half) { best = GBR.Y; break; } }
  if (GBR.grid.has(collKey(Math.floor(x / 16), Math.floor(z / 16)))) gbrEach(x, z, 0, o => { if (o.floor && o.top <= feet + 0.6 && (best === null || o.top > best)) best = o.top; });
  return best;
}
