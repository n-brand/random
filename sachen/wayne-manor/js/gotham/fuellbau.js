// Wayne Manor 3D – Gotham: Fuellbau-Vorlage (G3/G4, erster Entwurf Nicolas 2026-11-12 "wie stellst du dir die Fuellbauten vor").
// Klassisches Skript (braucht THREE, canvasTex aus kern/basis.js, mergeGeometries). buildFuellbau(o) -> THREE.Group, Ursprung = Mitte Grundflaeche am Boden,
// Front (Laeden, Feuertreppe) nach +z. Alles je Material zusammengefasst (wenige Zeichenaufrufe), Fenster als Textur je Fensterachse (3 m),
// nachts einzelne Fenster hell (emissiveMap). Regel Gotham: jedes Geschoss mind. 4,7 m.
// o: breite (m, Vielfaches von 3), tiefe, geschosse (inkl. EG), geschoss (4,7), stein (Backsteinfarbe), seed, laeden ([Name, Markisenfarbe] je Laden)
"use strict";
function buildFuellbau(o = {}) {
  const W = o.breite || 24, D = o.tiefe || 20, N = o.geschosse || 7, GH = o.geschoss || 4.7, H = N * GH, BAY = 3, seed = o.seed || 7;
  let rs = seed; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  const ziegel = o.stein || "#8a4632";
  // Backstein (64 px je m): Laeufer-Verband, Fugen, leichte Farbunterschiede und Schmutz nach unten
  const brick = (c, w, h, x0 = 0) => { c.fillStyle = "#b9ab98"; c.fillRect(x0, 0, w, h); const bw = 16, bh = 5;
    for (let y = 0, r = 0; y < h; y += bh + 1, r++) for (let x = -(r % 2) * bw / 2; x < w; x += bw + 1) { const k = 0.85 + rnd() * 0.3; c.fillStyle = shade(ziegel, k); c.fillRect(x0 + x, y, bw, bh); } };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), r = Math.min(255, ((n >> 16) & 255) * k), g = Math.min(255, ((n >> 8) & 255) * k), b = Math.min(255, (n & 255) * k); return `rgb(${r | 0},${g | 0},${b | 0})`; };
  // Fensterachse 3 x 4,7 m: Ziegel, Fenster 1,5 x 2,8 m (Schiebefenster mit Sprosse), Sturz und Bank aus hellem Stein
  const PX = 64, TW = BAY * PX, TH = Math.round(GH * PX);
  const winTex = canvasTex(TW, TH, (c, w, h) => { brick(c, w, h); const ww = 1.5 * PX, wh = 2.8 * PX, x = (w - ww) / 2, y = h - 1.0 * PX - wh;
    c.fillStyle = "#d9d2c4"; c.fillRect(x - 8, y - 14, ww + 16, 14); c.fillRect(x - 6, y + wh, ww + 12, 8);   // Sturz, Bank
    c.fillStyle = "#e9e6df"; c.fillRect(x, y, ww, wh); const g = c.createLinearGradient(0, y, 0, y + wh); g.addColorStop(0, "#22303d"); g.addColorStop(1, "#3c4d5c");
    c.fillStyle = g; c.fillRect(x + 5, y + 5, ww - 10, wh / 2 - 7); c.fillRect(x + 5, y + wh / 2 + 2, ww - 10, wh / 2 - 7);   // zwei Fluegel
    c.fillStyle = "#ffffff22"; c.fillRect(x + 8, y + 8, ww * 0.25, wh / 2 - 12); });
  const glow = canvasTex(TW * 8, TH * 4, (c, w, h) => { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); const ww = 1.5 * PX, wh = 2.8 * PX;   // 8 x 4 Fenster, zufaellig hell
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) if (rnd() < 0.35) { c.fillStyle = rnd() < 0.5 ? "#ffd89a" : "#fff1c8"; c.fillRect(i * TW + (TW - ww) / 2 + 5, j * TH + TH - PX - wh + 5, ww - 10, wh - 10); } });
  const brickTex = canvasTex(256, 256, (c, w, h) => brick(c, w, h));
  for (const t of [winTex, brickTex]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  glow.wrapS = glow.wrapT = THREE.RepeatWrapping; glow.repeat.set(1 / 8, 1 / 4);   // eine Glow-Kachel = 8 x 4 Fensterachsen
  const facadeM = new THREE.MeshStandardMaterial({ map: winTex, emissiveMap: glow, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.85 });
  const wallM = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9 }), stoneM = new THREE.MeshStandardMaterial({ color: 0xd2cbbd, roughness: 0.8 });
  const ironM = new THREE.MeshStandardMaterial({ color: 0x1c1e21, roughness: 0.6, metalness: 0.5 }), roofM = new THREE.MeshStandardMaterial({ color: 0x3b3d40, roughness: 0.95 });
  const woodM = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.9 }), glassM = new THREE.MeshStandardMaterial({ color: 0x1d2a33, roughness: 0.15, metalness: 0.4, emissive: 0xffe0a8, emissiveIntensity: 0.08 });
  const bucket = new Map(), add = (geo, m, x = 0, y = 0, z = 0, ry = 0) => { if (ry) geo.rotateY(ry); geo.translate(x, y, z); (bucket.get(m) || bucket.set(m, []).get(m)).push(geo); };
  const box = (sx, sy, sz, m, x, y, z, ry) => add(new THREE.BoxGeometry(sx, sy, sz), m, x, y, z, ry);
  // Fassaden-Flaeche mit UV in Fensterachsen (u = Achsen, v = Geschosse)
  const face = (w, h, m, x, y, z, ry, u = w / BAY, v = h / GH) => { const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v); add(g, m, x, y, z, ry); };
  // Obergeschosse: Front und Rueckseite mit Fenstern, Seiten als Brandwand (nur Ziegel); Kern als Box dahinter
  const UH = H - GH;
  box(W - 0.1, UH, D - 0.1, roofM, 0, GH + UH / 2, 0);
  face(W, UH, facadeM, 0, GH + UH / 2, D / 2, 0); face(W, UH, facadeM, 0, GH + UH / 2, -D / 2, Math.PI);
  face(D, UH, wallM, W / 2, GH + UH / 2, 0, Math.PI / 2, D / 4, UH / 4); face(D, UH, wallM, -W / 2, GH + UH / 2, 0, -Math.PI / 2, D / 4, UH / 4);
  // Geschossbaender, Hauptgesims mit Konsolen, Attika
  for (let f = 1; f < N; f++) box(W + 0.2, 0.22, D + 0.2, stoneM, 0, f * GH, 0);
  box(W + 1.2, 0.5, D + 1.2, stoneM, 0, H + 0.25, 0); box(W + 0.4, 1.0, D + 0.4, wallM, 0, H + 1.0, 0); box(W + 0.6, 0.15, D + 0.6, stoneM, 0, H + 1.55, 0);
  for (let x = -W / 2 + 0.75; x <= W / 2 - 0.7; x += 1.5) box(0.25, 0.45, 0.55, stoneM, x, H - 0.2, D / 2 + 0.3);
  // Erdgeschoss: Laeden mit Schaufenster, Markise, Schild; Hauseingang mit Stufen in der Mitte
  box(W, GH, D, wallM, 0, GH / 2, 0); box(W + 0.3, 0.6, 0.4, stoneM, 0, GH - 0.3, D / 2 + 0.1);   // Ladenkranz oben
  const laeden = o.laeden || [["DELI", 0x2f7d4a], ["LAUNDROMAT", 0x2b5d9c], ["PAWN SHOP", 0x9c2b2b]], tuer = 2.4, LW = (W - tuer - 1.2) / laeden.length;
  const signs = [];
  laeden.forEach(([name, col], i) => { let x0 = -W / 2 + 0.6 + i * LW; if (i >= Math.ceil(laeden.length / 2)) x0 += tuer; const xm = x0 + LW / 2, z = D / 2;
    box(LW - 0.6, 3.0, 0.08, glassM, xm, 1.95, z + 0.04); box(LW - 0.4, 0.12, 0.2, ironM, xm, 3.5, z + 0.08); box(LW - 0.4, 0.45, 0.25, stoneM, xm, 0.22, z + 0.1);   // Schaufenster, Rahmen, Sockel
    for (let k = 1; k < 3; k++) box(0.08, 3.0, 0.12, ironM, x0 + 0.3 + k * (LW - 0.6) / 3, 1.95, z + 0.08);
    const aw = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, side: THREE.DoubleSide }), m = new THREE.BoxGeometry(LW - 0.3, 0.06, 1.6); m.rotateX(0.35); add(m, aw, xm, 3.75, z + 0.75);   // Markise
    signs.push([name, xm, z]); });
  const dx = -W / 2 + 0.6 + Math.ceil(laeden.length / 2) * LW + tuer / 2;   // Hauseingang in der Luecke zwischen den Laeden
  box(tuer - 0.3, 3.2, 0.1, woodM, dx, 1.6 + 0.3, D / 2 + 0.06); box(tuer, 0.25, 0.3, stoneM, dx, 3.65, D / 2 + 0.12);   // Haustuer, Sturz
  box(tuer + 0.6, 0.15, 1.0, stoneM, dx, 0.075, D / 2 + 0.5); box(tuer + 0.6, 0.15, 0.6, stoneM, dx, 0.225, D / 2 + 0.3);
  // Feuertreppe an der Front ueber zwei Achsen: Podest je Geschoss mit Gelaender, Treppen im Zickzack, Fallleiter unten
  const fx0 = -W / 2 + BAY * 1, fw = BAY * 2, fz = D / 2 + 0.75;
  for (let f = 1; f < N; f++) { const y = f * GH + 0.9; box(fw, 0.08, 1.4, ironM, fx0 + fw / 2, y, fz);
    box(fw, 0.05, 0.05, ironM, fx0 + fw / 2, y + 1.0, fz + 0.7); for (const sx of [fx0, fx0 + fw]) box(0.05, 1.0, 1.4, ironM, sx, y + 0.5, fz);
    for (let x = fx0; x <= fx0 + fw + 0.01; x += 0.5) box(0.03, 1.0, 0.03, ironM, x, y + 0.5, fz + 0.7);
    if (f < N - 1) { const st = new THREE.BoxGeometry(Math.hypot(fw * 0.7, GH), 0.06, 0.65); st.rotateZ((f % 2 ? 1 : -1) * Math.atan2(GH, fw * 0.7)); add(st, ironM, fx0 + fw / 2, y + GH / 2, fz + 0.25); } }
  box(0.5, 2.6, 0.05, ironM, fx0 + 0.6, GH + 0.9 - 1.3, fz + 0.5);   // Fallleiter
  // Dach: Wassertank auf Stahlbeinen, Treppenhaus, Lueftungen, Kamine
  const tx = W / 2 - 4, tz = -D / 2 + 4, ty = H + 1.0;
  for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) box(0.2, 3, 0.2, ironM, tx + dx, ty + 1.5, tz + dz);
  add(new THREE.CylinderGeometry(2.1, 2.1, 3.6, 20), woodM, tx, ty + 4.8, tz); add(new THREE.ConeGeometry(2.3, 1.4, 20), woodM, tx, ty + 7.3, tz);
  for (const y of [3.6, 4.8, 6.0]) add(new THREE.CylinderGeometry(2.14, 2.14, 0.08, 20), ironM, tx, ty + y, tz);
  box(3.2, 3.0, 3.6, wallM, -W / 2 + 3, H + 1.5, -D / 2 + 3.5); box(3.6, 0.2, 4.0, stoneM, -W / 2 + 3, H + 3.1, -D / 2 + 3.5);
  for (let k = 0; k < 3; k++) box(1.6, 1.1, 1.2, new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.6, metalness: 0.3 }), -2 + k * 2.6, H + 0.55, 1.5);
  for (const x of [-W / 2 + 1, W / 2 - 1]) box(1.0, 2.4, 0.8, wallM, x, H + 1.2, 2);
  // zusammenfassen
  const g = new THREE.Group();
  for (const [m, list] of bucket) { const mm = new THREE.Mesh(mergeGeometries(list.map(x => x.index ? x.toNonIndexed() : x), false), m); mm.castShadow = mm.receiveShadow = true; g.add(mm); }
  // Ladenschilder (Canvas-Schrift ueber der Markise)
  for (const [name, xm, z] of signs) { const t = canvasTex(256, 48, (c, w, h) => { c.fillStyle = "#15171a"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2e6c8"; c.textAlign = "center"; c.textBaseline = "middle"; let p = 34; c.font = "bold " + p + "px Arial, sans-serif"; while (c.measureText(name).width > w - 16) { p -= 2; c.font = "bold " + p + "px Arial, sans-serif"; } c.fillText(name, w / 2, h / 2 + 2); });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(LW - 0.8, (LW - 0.8) * 48 / 256), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })); s.position.set(xm, 4.4, z + 0.33); g.add(s); }   // vor dem Ladenkranz
  g.userData = { breite: W, tiefe: D, hoehe: H + 1.6, geschosse: N, facadeM, nacht: k => { facadeM.emissiveIntensity = k * 1.2; glassM.emissiveIntensity = 0.08 + k * 0.9; } };
  return g;
}
