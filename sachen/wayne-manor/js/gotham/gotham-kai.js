// Wayne Manor 3D – Gotham: Kaimauern rund um die Insel (Plan G1, Schritt G1d, Nicolas 2026-11-12)
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Nach gotham-raster.js. Braucht GOT (Uferlinie edgePts/edgeIn, edgeSD), canvasTex, M, circles.
"use strict";

// Profil quer zur Uferlinie (d = Meter nach innen, y = Welt-y): Mauerfuss unter dem Kies (-34,6), senkrechte Wand bis zur Bruestung (1,1 m ueber
// der Strasse, 0,5 m dick), dahinter die Kai-Platte auf Strassenhoehe, 12 m breit (deckt den Abbruch des Gelaende-Rasters zu, der 6 m innen liegt).
// Davor der Kiesstreifen knapp ueber dem Wasser (Gelaende, gotham-gelaende.js). Kollision: Kreise innen an der Bruestung (r 0,45, alle 0,8 m,
// Oberkante 1,1 m ueber der Strasse: man kommt weder zu Fuss noch mit dem Auto darueber). Luecken fuer Bruecken (G2) und Kanal-Auslaesse (U1) kommen spaeter.
const KAI = { breite: 12, bruestung: 1.1, dicke: 0.5, fuss: GOT.WY - 0.6 };
{
  const P = GOT.edgePts, N = GOT.edgeIn, n = P.length, S = GOT.STR, H = S + KAI.bruestung;
  const prof = [[0, KAI.fuss], [0, S + 0.03], [0, H], [KAI.dicke, H], [KAI.dicke, S + 0.03], [KAI.breite, S + 0.03], [KAI.breite, S - 1.2]], PAR = [1, 2, 3];   // Profilstuecke der Bruestung
  // Bruecken (G2c): dort hat die Bruestung eine Luecke (Fahrbahn plus Gehwege plus 1 m), auch ohne Kollision
  const BRL = GOTHAM_STADT.bruecken.map(b => { const P = b.pts.map(([x, z]) => GOT.toGame(x, z)); return { a: P[0], b: P[P.length - 1], r: b.w / 2 + 3.5 }; });
  const atBridge = (x, z) => BRL.some(q => { const dx = q.b[0] - q.a[0], dz = q.b[1] - q.a[1], L = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - q.a[0]) * dx + (z - q.a[1]) * dz) / L)); return Math.hypot(x - q.a[0] - dx * t, z - q.a[1] - dz * t) < q.r; });
  KAI.atBridge = atBridge; const gap = P.map(p => atBridge(p[0], p[1]));
  // Granit-Quader (Fugen), heller Deckstein; UV in Metern
  const tex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#8d8a84"; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { const o = r % 2 ? 42 : 0, v = 120 + Math.floor(Math.random() * 40); c.fillStyle = `rgb(${v},${v - 3},${v - 8})`; c.fillRect(((k * 85 + o) % w), r * 64, 83, 62); }
    c.strokeStyle = "#5e5b56"; c.lineWidth = 2; for (let r = 0; r <= 4; r++) { c.beginPath(); c.moveTo(0, r * 64); c.lineTo(w, r * 64); c.stroke(); }
    for (let r = 0; r < 4; r++) for (let k = 0; k <= 3; k++) { const x = (k * 85 + (r % 2 ? 42 : 0)) % w; c.beginPath(); c.moveTo(x, r * 64); c.lineTo(x, r * 64 + 64); c.stroke(); }
    for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const pos = [], uv = [], idx = [];
  let L = 0; const len = [0]; for (let i = 1; i <= n; i++) { const a = P[i - 1], b = P[i % n]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); len.push(L); }
  for (let s = 0; s < prof.length - 1; s++) {                                // je Profilstrecke ein Band rundum
    const [d0, y0] = prof[s], [d1, y1] = prof[s + 1], vert = Math.abs(y1 - y0) > Math.abs(d1 - d0), base = pos.length / 3;
    for (let i = 0; i <= n; i++) { const p = P[i % n], q = N[i % n];
      for (const [d, y] of [[d0, y0], [d1, y1]]) { pos.push(p[0] + q[0] * d, y, p[1] + q[1] * d); uv.push(len[i] / 3, (vert ? y : d) / 3); } }
    for (let i = 0; i < n; i++) { if (PAR.includes(s) && (gap[i] || gap[(i + 1) % n])) continue; const a = base + i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, M(0xffffff, { map: tex, roughness: 0.9, side: THREE.DoubleSide })); mesh.name = "Gotham-Kaimauer"; mesh.userData.keep = true; mesh.userData.noLift = true; mesh.receiveShadow = true; scene.add(mesh);
  KAI.mesh = mesh; KAI.len = L;
  // Kollision der Bruestung (Regel: weiter innen als die sichtbare Flaeche)
  let acc = 0;
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], qa = N[i], qb = N[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (; acc < l; acc += 0.8) { const t = acc / l, qx = qa[0] + (qb[0] - qa[0]) * t, qz = qa[1] + (qb[1] - qa[1]) * t; if (atBridge(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) continue; circles.push([a[0] + (b[0] - a[0]) * t + qx * 0.45, a[1] + (b[1] - a[1]) * t + qz * 0.45, 0.45, H]); }
    acc -= l; }
}
// Boden am Ufer genau: auf dem Kai (innen) Strassenebene, davor 6 m Kies knapp ueber dem Wasser (das 4-m-Raster haette dort eine Rampe).
// Die ersten 0,6 m vor der Mauer gelten schon als Kai: von unten haelt man Abstand zur Wand (Nicolas 2026-11-12: man lief hinein).
{ const t0 = gothamTerrainH;
  gothamTerrainH = (x, z) => { if (Math.abs(GOT.di(x, z)) < 24) { const sd = GOT.edgeSD(x, z); if (sd < 0.6) return GOT.STR; if (sd < 6) return GOT.WY + 0.4; } return t0(x, z); }; }
