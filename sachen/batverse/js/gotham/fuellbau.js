// Batverse – Gotham: Fuellbau-Vorlage (G3/G4, erster Entwurf Nicolas 2026-11-12 "wie stellst du dir die Fuellbauten vor").
// Klassisches Skript (braucht THREE, canvasTex aus kern/basis.js, mergeGeometries). buildFuellbau(o) -> THREE.Group, Ursprung = Mitte Grundflaeche am Boden,
// Front (Laeden, Feuertreppe) nach +z. Alles je Material zusammengefasst (wenige Zeichenaufrufe), Fenster als Textur je Fensterachse (3 m),
// nachts einzelne Fenster hell (emissiveMap). Regel Gotham: jedes Geschoss mind. 4,7 m.
// o: breite (m, Vielfaches von 3), tiefe, geschosse (inkl. EG), geschoss (4,7), stein (Backsteinfarbe), seed, laeden ([Name, Markisenfarbe] je Laden),
// id (Nicolas 2026-11-12: jeder Fuellbau/jede Baustelle hat eine klare ID, z. B. FB-0123 / BS-03; landet in userData.id, die Orbit-Ansicht kopiert sie mit)
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
  if (o.id) g.name = "Füllbau " + o.id;
  g.userData = { id: o.id || null, art: "Füllbau", breite: W, tiefe: D, hoehe: H + 1.6, geschosse: N, facadeM, nacht: k => { facadeM.emissiveIntensity = k * 1.2; glassM.emissiveIntensity = 0.08 + k * 0.9; } };
  return g;
}
// Baustelle als Lueckenfueller (Nicolas 2026-11-12: "damit die Luecken fuellen - Erde, darauf Materialien, ein paar Metallstangen, darum herum
// Gitter-Absperrungen"): kein Rohbau und kein Kran. buildBaustelle(o) -> Gruppe, Ursprung = Mitte am Boden, Einfahrt (Tor) an der Front +z.
// o: breite, tiefe (m, beliebig, z. B. die Restflaeche zwischen zwei Fuellbauten), seed
function buildBaustelle(o = {}) {
  const W = o.breite || 18, D = o.tiefe || 20; let rs = o.seed || 3; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + rnd() * (b - a);
  const erdeTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#6b5236"; c.fillRect(0, 0, w, h); for (let i = 0; i < 1800; i++) { const k = rnd(); c.fillStyle = k < 0.4 ? "#5a4430" : k < 0.75 ? "#7a6142" : k < 0.9 ? "#8b7a63" : "#4a3828"; c.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 4, 2 + rnd() * 4); }
    c.strokeStyle = "#4e3b28"; c.lineWidth = 6; for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(0, 60 + k * 120 + rnd() * 20); c.bezierCurveTo(w * 0.3, 40 + k * 120, w * 0.7, 90 + k * 120, w, 70 + k * 120); c.stroke(); } }, W / 6, D / 6);   // Reifenspuren
  const zaunTex = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "#c9ced3"; c.lineWidth = 2; for (let x = 0; x <= w; x += 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
  const erdeM = new THREE.MeshStandardMaterial({ map: erdeTex, roughness: 1 }), kiesM = new THREE.MeshStandardMaterial({ color: 0x8e8a82, roughness: 1, flatShading: true }), sandM = new THREE.MeshStandardMaterial({ color: 0xc8b07a, roughness: 1, flatShading: true });
  const stahlM = new THREE.MeshStandardMaterial({ color: 0x6b3a25, roughness: 0.7, metalness: 0.5 }), rohrM = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.5, metalness: 0.6 }), holzM = new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.9 });
  const steinM = new THREE.MeshStandardMaterial({ color: 0x9b4a35, roughness: 0.9 }), betonM = new THREE.MeshStandardMaterial({ color: 0xa9a7a1, roughness: 0.9 }), gelbM = new THREE.MeshStandardMaterial({ color: 0xf2c12e, roughness: 0.6 }), rotM = new THREE.MeshStandardMaterial({ color: 0xd8342b, roughness: 0.6 });
  const zaunM = new THREE.MeshStandardMaterial({ map: zaunTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 }), planeM = new THREE.MeshStandardMaterial({ color: 0x2f6b46, roughness: 0.9, side: THREE.DoubleSide });
  const folieM = new THREE.MeshStandardMaterial({ color: 0xdde4ea, transparent: true, opacity: 0.25, roughness: 0.2 }), contM = new THREE.MeshStandardMaterial({ color: 0xd9dcde, roughness: 0.7 }), glasM = new THREE.MeshStandardMaterial({ color: 0x1d2a33, roughness: 0.2 });
  const wcM = new THREE.MeshStandardMaterial({ color: 0x2f7fc1, roughness: 0.7 }), karreM = new THREE.MeshStandardMaterial({ color: 0xc23b22, roughness: 0.6 }), schwarzM = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const bucket = new Map(), add = (geo, m, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) => { if (rx) geo.rotateX(rx); if (rz) geo.rotateZ(rz); if (ry) geo.rotateY(ry); geo.translate(x, y, z); (bucket.get(m) || bucket.set(m, []).get(m)).push(geo); };
  const box = (sx, sy, sz, m, x, y, z, ry) => add(new THREE.BoxGeometry(sx, sy, sz), m, x, y, z, ry);
  // Erde: unebene Flaeche (leichte Buckel), am Rand flach
  { const g = new THREE.PlaneGeometry(W, D, Math.ceil(W), Math.ceil(D)).rotateX(-Math.PI / 2), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), rand = Math.abs(x) > W / 2 - 0.6 || Math.abs(z) > D / 2 - 0.6; p.setY(i, rand ? 0.05 : 0.08 + Math.max(0, Math.sin(x * 0.7 + z * 0.4) * 0.12) + rnd() * 0.06); }
    g.computeVertexNormals(); add(g, erdeM); }
  // Schuettgut: Kies-, Sand- und Erdhaufen (Kegel, verbeult)
  const haufen = (r, h, m, x, z) => { const g = new THREE.ConeGeometry(r, h, 10, 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < h / 2 - 0.01) p.setX(i, p.getX(i) * (0.85 + rnd() * 0.3)); g.computeVertexNormals(); add(g, m, x, h / 2, z); };
  haufen(2.6, 1.8, kiesM, -W / 2 + 3.5, -D / 2 + 3.5); haufen(2.0, 1.3, sandM, -W / 2 + 7.5, -D / 2 + 2.8); haufen(1.4, 0.9, erdeM, W / 2 - 3, -D / 2 + 6);
  // Paletten mit Ziegeln (in Folie), Stapel Betonplatten, Holzbohlen
  for (const [x, z] of [[W / 2 - 3, D / 2 - 5], [W / 2 - 5, D / 2 - 5]]) { box(1.2, 0.15, 1.0, holzM, x, 0.15, z); box(1.1, 0.9, 0.95, steinM, x, 0.68, z); box(1.12, 0.92, 0.97, folieM, x, 0.68, z); }
  for (let k = 0; k < 5; k++) box(2.4, 0.18, 1.2, betonM, W / 2 - 3.5, 0.2 + k * 0.2, -D / 2 + 10 + rr(-0.05, 0.05));
  for (let k = 0; k < 6; k++) box(4.2, 0.08, 0.25, holzM, -W / 2 + 4 + rr(-0.1, 0.1), 0.15 + Math.floor(k / 3) * 0.1, D / 2 - 6 + (k % 3) * 0.3, rr(-0.04, 0.04));
  // Metallstangen: Bewehrungseisen senkrecht aus zwei Fundamentstreifen, ein Buendel liegend auf Kanthoelzern, Geruestrohre an den Zaun gelehnt
  for (const zf of [-2.5, 2.5]) { box(W - 8, 0.4, 0.8, betonM, 0, 0.25, zf);
    for (let x = -W / 2 + 5; x <= W / 2 - 5; x += 1.0) for (const dz of [-0.2, 0.2]) { const h = rr(1.8, 3.2); add(new THREE.CylinderGeometry(0.02, 0.02, h, 5), stahlM, x + rr(-0.05, 0.05), 0.45 + h / 2, zf + dz, 0, rr(-0.04, 0.04), rr(-0.04, 0.04)); } }
  for (const x of [-1.5, 1.5]) box(0.15, 0.15, 1.6, holzM, x, 0.12, D / 2 - 3);
  for (let k = 0; k < 14; k++) add(new THREE.CylinderGeometry(0.02, 0.02, 6, 5), stahlM, rr(-0.2, 0.2), 0.24 + (k % 3) * 0.05, D / 2 - 3 + rr(-0.5, 0.5), 0, 0, Math.PI / 2);
  for (let k = 0; k < 5; k++) add(new THREE.CylinderGeometry(0.025, 0.025, 4, 6), rohrM, W / 2 - 1.2 - k * 0.12, 1.95, -D / 2 + 15, 0, 0, 0.32);
  // Baustellen-Container (Buero) mit Fenster, Toilette, Schubkarre
  box(6.06, 2.6, 2.44, contM, -W / 2 + 4, 1.4, D / 2 - 2.2); box(1.2, 0.8, 0.05, glasM, -W / 2 + 3, 1.7, D / 2 - 0.97);
  box(1.1, 2.3, 1.1, wcM, W / 2 - 1.5, 1.15, D / 2 - 9);
  box(0.6, 0.3, 0.9, karreM, 1.5, 0.55, 5.5, 0.4); add(new THREE.TorusGeometry(0.2, 0.06, 6, 12), schwarzM, 1.5 - 0.28, 0.25, 5.5 + 0.38, 0.4 + Math.PI / 2);
  // Bauzaun rundum: Gitterfelder ca. 3,5 x 2 m in Betonfuessen, Rueckseite mit gruener Plane, Tor an der Front, Absperrbaken davor
  const feld = (x0, z0, x1, z1, plane) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 3.5)), ry = Math.atan2(-(z1 - z0), x1 - x0);
    for (let k = 0; k < n; k++) { const a = k / n, b = (k + 1) / n, xa = x0 + (x1 - x0) * a, za = z0 + (z1 - z0) * a, xm = x0 + (x1 - x0) * (a + b) / 2, zm = z0 + (z1 - z0) * (a + b) / 2, l = L / n;
      const pg = new THREE.PlaneGeometry(l - 0.06, 1.9); const uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * l, uv.getY(i) * 1.9); add(pg, plane ? planeM : zaunM, xm, 1.15, zm, ry);
      box(l - 0.06, 0.04, 0.04, rohrM, xm, 2.1, zm, ry); box(l - 0.06, 0.04, 0.04, rohrM, xm, 0.2, zm, ry);
      add(new THREE.CylinderGeometry(0.025, 0.025, 2.0, 6), rohrM, xa, 1.15, za); box(0.6, 0.15, 0.25, betonM, xa, 0.075, za, ry); }
    add(new THREE.CylinderGeometry(0.025, 0.025, 2.0, 6), rohrM, x1, 1.15, z1); box(0.6, 0.15, 0.25, betonM, x1, 0.075, z1, ry); };
  const g = 4;   // Torbreite an der Front
  feld(-W / 2, -D / 2, W / 2, -D / 2, true); feld(W / 2, -D / 2, W / 2, D / 2); feld(-W / 2, D / 2, -W / 2, -D / 2); feld(W / 2, D / 2, g / 2, D / 2); feld(-g / 2, D / 2, -W / 2, D / 2);
  feld(-g / 2 + 0.05, D / 2 + 0.6, g / 2 - 0.05, D / 2 + 0.6);   // Torfluegel (zu), etwas vor der Flucht
  for (const x of [-W / 2 - 0.8, W / 2 + 0.8]) for (let k = 0; k < 3; k++) { const z = D / 2 - 2 - k * 1.6; box(0.12, 1.0, 0.25, k % 2 ? rotM : gelbM, x, 0.6, z); box(0.4, 0.1, 0.4, betonM, x, 0.05, z); }
  const gr = new THREE.Group();
  for (const [m, list] of bucket) { const mm = new THREE.Mesh(mergeGeometries(list.map(x => x.index ? x.toNonIndexed() : x), false), m); mm.castShadow = m !== zaunM && m !== folieM; mm.receiveShadow = true; gr.add(mm); }
  const st = canvasTex(256, 128, (c, w, h) => { c.fillStyle = "#f2c12e"; c.fillRect(0, 0, w, h); c.fillStyle = "#111"; c.fillRect(6, 6, w - 12, h - 12); c.fillStyle = "#f2c12e"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "bold 30px Arial, sans-serif"; c.fillText("BAUSTELLE", w / 2, h / 2 - 16); c.font = "bold 20px Arial, sans-serif"; c.fillText("Betreten verboten", w / 2, h / 2 + 22); });
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshStandardMaterial({ map: st, roughness: 0.6 })); sg.position.set(g / 2 + 1.75, 1.4, D / 2 + 0.05); gr.add(sg);   // Schild am Zaun neben dem Tor
  if (o.id) gr.name = "Baustelle " + o.id;
  gr.userData = { id: o.id || null, art: "Baustelle", breite: W, tiefe: D };   // id wie beim Fuellbau
  return gr;
}
