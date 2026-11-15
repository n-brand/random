"use strict";
// Batverse – Gotham: Wayne Tower, Huelle aussen (Plan 2026-11-14-wayne-tower, Task 3; Nicolas: Art-Deco-Stein mit Ruecksprungen, WAYNE-Schrift oben
// am Hauptschaft direkt unter dem ersten Ruecksprung, Krone mit Lichtband und Antenne, graue Steinfassade mit Fensterraster wie im Vorbild
// karten/planung/wayne-logo-vorbild.png, hoher Sockel mit Eingangsvordach; Vorplatz Nicolas "Ja, Vorplatz").
// Alles in Turm-Koordinaten (WTO, gotham-wayne-daten.js) gebaut, je Material zusammengefasst und mit der Kartendrehung in die Welt gesetzt.
// Nicht in GHIDE: der Turm bleibt auch von weitem sichtbar (Spec: Fernform; die Huelle hat nur wenige Flaechen, sie ist selbst die Fernform).
// Kollision: gedrehte Quader (kern/drehkoll.js), Waende duenn (innen kommen Lobby, Geschosse und Aufzug, Task 4/7), Terrassen und Krone als Boden.
const WTB = { mats: null, group: null, parts: [] };
// gedrehter Quader in Turm-Koordinaten fuer die Kollision
function wtPart(a0, a1, b0, b1, y0, y1, opt = {}) {
  const [cx, cz] = WTO.toW((a0 + a1) / 2, (b0 + b1) / 2);
  const o = dkAdd(Object.assign({ cx, cy: WTO.Y + (y0 + y1) / 2, cz, ux: WTO.ux, uz: WTO.uz, hl: (a1 - a0) / 2, hw: (b1 - b0) / 2, hh: (y1 - y0) / 2 }, opt));
  WTB.parts.push(o); return o;
}
{
  const Y = WTO.Y;
  // ---------- Texturen ----------
  const PX = 40, BAYW = 3, GH = 4.7;
  const stoneCol = "#b2b0aa";
  const facTex = canvasTex(BAYW * PX, Math.round(GH * PX), (c, w, h) => {
    c.fillStyle = stoneCol; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { const v = 140 + Math.random() * 30; c.fillStyle = `rgba(${v},${v - 2},${v - 6},0.35)`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    const ww = 1.7 * PX, wh = 2.9 * PX, x = (w - ww) / 2, y = h - 0.9 * PX - wh;
    c.fillStyle = "#6f6e6a"; c.fillRect(x - 3, y - 3, ww + 6, wh + 6);                     // Laibung
    const g = c.createLinearGradient(0, y, 0, y + wh); g.addColorStop(0, "#2a3542"); g.addColorStop(1, "#46566a");
    c.fillStyle = g; c.fillRect(x, y, ww, wh);
    c.fillStyle = "#8d8b86"; c.fillRect(x + ww / 2 - 2, y, 4, wh); c.fillRect(x, y + wh / 2 - 2, ww, 4);   // Sprossenkreuz (2 x 2 Felder wie im Vorbild)
    c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(x + 4, y + 4, ww * 0.2, wh / 2 - 8);
    c.fillStyle = "rgba(0,0,0,0.18)"; c.fillRect(0, h - 4, w, 4); });                      // Geschossfuge
  const glowTex = canvasTex(BAYW * PX * 8, Math.round(GH * PX) * 8, (c, w, h) => {          // nachts: zufaellig helle Fenster (8 x 8 Felder)
    c.fillStyle = "#000"; c.fillRect(0, 0, w, h); const tw = BAYW * PX, th = Math.round(GH * PX), ww = 1.7 * PX, wh = 2.9 * PX;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (Math.random() < 0.42) { c.fillStyle = Math.random() < 0.5 ? "#ffe2a8" : "#fff4d6"; c.fillRect(i * tw + (tw - ww) / 2, j * th + th - 0.9 * PX - wh, ww, wh); } });
  glowTex.wrapS = glowTex.wrapT = THREE.RepeatWrapping; glowTex.repeat.set(1 / 8, 1 / 8);
  const lobbyTex = canvasTex(256, 256, (c, w, h) => {                                         // Sockel: hohe Fenster zwischen Steinpfeilern (eine Achse 6 m x 9,4 m)
    c.fillStyle = "#7d7b77"; c.fillRect(0, 0, w, h); const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#1f2a35"); g.addColorStop(1, "#3a4a5c");
    c.fillStyle = g; c.fillRect(40, 30, w - 80, h - 50); c.fillStyle = "#6c6a66"; for (let i = 1; i < 4; i++) c.fillRect(40 + i * (w - 80) / 4 - 2, 30, 4, h - 50); c.fillRect(40, 30 + (h - 50) * 0.62, w - 80, 5);
    c.fillStyle = "#5e5c58"; c.fillRect(0, 0, w, 14); });
  const plazaTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#a9a59c"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) { const v = 150 + Math.random() * 40; c.fillStyle = `rgba(${v},${v - 3},${v - 9},0.5)`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    c.strokeStyle = "#8b877e"; c.lineWidth = 2; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.moveTo(i * 64, 0); c.lineTo(i * 64, h); c.stroke(); } });
  plazaTex.wrapS = plazaTex.wrapT = THREE.RepeatWrapping;
  // WAYNE-Schrift mit W-Emblem und Seitenbalken (Vorbild): silberne Buchstaben, Rest durchsichtig
  const signTex = canvasTex(1024, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h); const sil = c.createLinearGradient(0, 0, 0, h); sil.addColorStop(0, "#f2f2ee"); sil.addColorStop(1, "#a9aaa8");
    c.fillStyle = sil; c.font = "bold 190px Arial, Helvetica, sans-serif"; c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.save(); c.translate(w / 2, 170); c.scale(1.12, 1); c.lineWidth = 14; c.strokeStyle = sil; c.strokeText("WAYNE", 0, 0); c.fillText("WAYNE", 0, 0); c.restore();
    c.fillRect(60, 282, 320, 28); c.fillRect(w - 380, 282, 320, 28);                         // Seitenbalken
    c.beginPath(); c.moveTo(400, 220); c.lineTo(624, 220); c.lineTo(600, 420); c.lineTo(512, 460); c.lineTo(424, 420); c.closePath(); c.fill();   // Schild
    c.fillStyle = "rgba(60,62,66,1)"; c.font = "bold 170px Georgia, serif"; c.fillText("W", w / 2, 405); });
  const M2 = (o) => new THREE.MeshStandardMaterial(o);
  const mats = WTB.mats = {
    fac: M2({ map: facTex, emissiveMap: glowTex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.85 }),
    stone: M2({ color: 0xa3a19b, roughness: 0.85 }),
    dark: M2({ color: 0x6f6d69, roughness: 0.9 }),
    lobby: M2({ map: lobbyTex, roughness: 0.4, metalness: 0.1, emissive: 0xffe6b0, emissiveIntensity: 0, side: THREE.DoubleSide }),
    plaza: M2({ map: plazaTex, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    sign: M2({ map: signTex, transparent: false, alphaTest: 0.5, metalness: 0.6, roughness: 0.35, emissive: 0xdfe6ff, emissiveMap: signTex, emissiveIntensity: 0, side: THREE.DoubleSide }),
    light: M2({ color: 0xfff1c4, emissive: 0xffe08a, emissiveIntensity: 0.6, roughness: 0.5, side: THREE.DoubleSide }),
    metal: M2({ color: 0x4a4f55, metalness: 0.6, roughness: 0.4 }),
    red: M2({ color: 0x400000, emissive: 0xff2010, emissiveIntensity: 1.5 }),
    lfloor: M2({ color: 0xcfc9bd, roughness: 0.25, metalness: 0.05 }),             // Lobby (Task 4, Rohbau): glatter heller Stein
    ceil: M2({ color: 0xd8d6d0, roughness: 0.9, emissive: 0xd8d6d0, emissiveIntensity: 0.45 }),   // von unten kommt kein Licht: leicht selbst hell
    core: M2({ color: 0x8b8781, roughness: 0.6 }),
  };
  // ---------- Geometrie in Turm-Koordinaten (x = a, z = b) ----------
  const G = {}; for (const k of Object.keys(mats)) G[k] = { P: [], U: [], I: [] };
  // Viereck p0..p3 (gegen den Uhrzeigersinn von aussen gesehen), uv je Ecke
  const quad = (k, p, uv) => { const g = G[k], n = g.P.length / 3; for (const q of p) g.P.push(...q); for (const t of uv) g.U.push(...t); g.I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  // senkrechte Wand von (a0, b0) nach (a1, b1), aussen links der Laufrichtung; u in Achsen (bay), v in Geschossen ab y0
  const wallQ = (k, a0, b0, a1, b1, y0, y1, bay = 0, vh = 0) => {
    const L = Math.hypot(a1 - a0, b1 - b0), nu = bay ? Math.max(1, Math.round(L / bay)) : L / 4, nv = vh ? (y1 - y0) / vh : (y1 - y0) / 4;
    quad(k, [[a0, y0, b0], [a1, y0, b1], [a1, y1, b1], [a0, y1, b0]], [[0, 0], [nu, 0], [nu, nv], [0, nv]]); };
  // Normale einer Wand in Laufrichtung (da, db) ist (-db, da): Umlauf so, dass sie nach aussen zeigt (y0 > y1 dreht sie nach innen)
  const ring = (k, h, y0, y1, bay, vh, hb = h) => {
    wallQ(k, h, -hb, -h, -hb, y0, y1, bay, vh); wallQ(k, -h, -hb, -h, hb, y0, y1, bay, vh); wallQ(k, -h, hb, h, hb, y0, y1, bay, vh); wallQ(k, h, hb, h, -hb, y0, y1, bay, vh); };
  // waagrechte Flaeche (oben sichtbar)
  const flat = (k, a0, a1, b0, b1, y, sc = 4) => quad(k, [[a0, y, b1], [a1, y, b1], [a1, y, b0], [a0, y, b0]], [[a0 / sc, b1 / sc], [a1 / sc, b1 / sc], [a1 / sc, b0 / sc], [a0 / sc, b0 / sc]]);
  // ganzer Quader (Pfeiler, Vordach, Krone): Seiten und Deckel
  const box = (k, a0, a1, b0, b1, y0, y1, top = k) => { wallQ(k, a1, b0, a0, b0, y0, y1); wallQ(k, a0, b0, a0, b1, y0, y1); wallQ(k, a0, b1, a1, b1, y0, y1); wallQ(k, a1, b1, a1, b0, y0, y1); flat(top, a0, a1, b0, b1, y1); };
  // Sockel (Lobby): 0..9,4, Glas zwischen Pfeilern, Eingang in der Mitte der Vorplatzseite (+b), Steinband oben
  const S = 35.6, E = WTO.eingang, eh = E.w / 2;
  const vb = WTO.vorplatz && WTO.vorplatz.dir[1] > 0;                           // Vorplatz an +b (Seite s)
  wallQ("lobby", S, -S, -S, -S, 0, 9.4, 6, 9.4); wallQ("lobby", S, S, S, -S, 0, 9.4, 6, 9.4); wallQ("lobby", -S, -S, -S, S, 0, 9.4, 6, 9.4);
  wallQ("lobby", -S, S, -eh, S, 0, 9.4, 6, 9.4); wallQ("lobby", eh, S, S, S, 0, 9.4, 6, 9.4); wallQ("dark", -eh, S, eh, S, E.h, 9.4);
  for (const s of [-1, 1]) box("dark", s * eh - 0.6, s * eh + 0.6, S - 0.2, S + 0.6, 0, E.h);                                   // Eingangspfosten
  box("stone", -eh - 3, eh + 3, S, S + 7, 7.8, 8.6); flat("light", -eh - 2.5, eh + 2.5, S + 0.5, S + 6.5, 7.79);                // Vordach (unten Licht)
  ring("dark", S + 0.3, 9.4, 11.2, 0, 0); flat("stone", -S - 0.3, S + 0.3, -S - 0.3, S + 0.3, 11.2);                          // Gesims ueber dem Sockel
  // Schaft und Ruecksprunge: Fassade mit Fensterraster, Terrassen oben, Bruestung
  WTO.tiers.forEach((T, i) => {
    ring("fac", T.h, T.y0 + (i ? 0 : 1.8), T.y1, BAYW, GH);
    const inner = i < 2 ? WTO.tiers[i + 1].h : WTO.krone.h;
    for (const [a0, a1, b0, b1] of [[-T.h, T.h, -T.h, -inner], [-T.h, T.h, inner, T.h], [-T.h, -inner, -inner, inner], [inner, T.h, -inner, inner]]) flat("stone", a0, a1, b0, b1, T.y1);
    ring("stone", T.h + 0.25, T.y1, T.y1 + 1.2, 0, 0); ring("stone", T.h - 0.05, T.y1 + 1.2, T.y1, 0, 0); flat("stone", -T.h - 0.25, T.h + 0.25, -T.h - 0.25, -T.h + 0.05, T.y1 + 1.2);   // Bruestung (aussen, innen, Deckel)
    flat("stone", -T.h - 0.25, T.h + 0.25, T.h - 0.05, T.h + 0.25, T.y1 + 1.2); flat("stone", -T.h - 0.25, -T.h + 0.05, -T.h, T.h, T.y1 + 1.2); flat("stone", T.h - 0.05, T.h + 0.25, -T.h, T.h, T.y1 + 1.2);
    // Lisenen: Eckpfeiler (ueber die Bruestung hinaus) und je zwei Zwischenpfeiler je Seite
    for (const sa of [-1, 1]) for (const sb of [-1, 1]) box("stone", sa * T.h - 1.2, sa * T.h + 1.2, sb * T.h - 1.2, sb * T.h + 1.2, T.y0, T.y1 + 4);
    const q = Math.round(T.h * 0.45); for (const s of [-q, q]) for (const sd of [-1, 1]) { box("stone", s - 0.6, s + 0.6, sd * T.h - (sd > 0 ? 0 : 0.6), sd * T.h + (sd > 0 ? 0.6 : 0), T.y0, T.y1 + 1.2); box("stone", sd * T.h - (sd > 0 ? 0 : 0.6), sd * T.h + (sd > 0 ? 0.6 : 0), s - 0.6, s + 0.6, T.y0, T.y1 + 1.2); }
  });
  // Krone: drei Stufen mit Lichtband, Antenne mit rotem Licht
  { const K = WTO.krone, y0 = WTO.lv.dach, st = [[K.h, y0, 280], [13, 280, 292], [9, 292, K.y1]];
    for (const [h, a, b] of st) { ring("fac", h, a, b, BAYW, GH); flat("stone", -h, h, -h, h, b); ring("light", h + 0.15, b - 1.6, b - 0.8, 0, 0); }
    for (const sa of [-1, 1]) for (const sb of [-1, 1]) box("stone", sa * K.h - 1, sa * K.h + 1, sb * K.h - 1, sb * K.h + 1, y0, 284);
    box("metal", -0.6, 0.6, -0.6, 0.6, K.y1, K.antenne - 1.2); box("red", -0.7, 0.7, -0.7, 0.7, K.antenne - 1.2, K.antenne); }
  // WAYNE-Schrift auf allen vier Seiten direkt unter dem ersten Ruecksprung, 0,2 m vor der Fassade
  { const T = WTO.tiers[0], w = 40, hgt = w / 2, yt = T.y1 + 1.2, d = T.h + 0.2;
    for (const [ca, cb, ta, tb] of [[0, d, 1, 0], [d, 0, 0, -1], [0, -d, -1, 0], [-d, 0, 0, 1]])
      quad("sign", [[ca - ta * w / 2, yt - hgt, cb - tb * w / 2], [ca + ta * w / 2, yt - hgt, cb + tb * w / 2], [ca + ta * w / 2, yt, cb + tb * w / 2], [ca - ta * w / 2, yt, cb - tb * w / 2]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
  // Vorplatz (Steinplatten, 8 cm ueber der Strasse) und schmaler Sockelstreifen rundum
  // Tiefe bis an den Gehsteig der naechsten Strasse (Nicolas: kein Wiesenstreifen dazwischen), hoechstens die Kartentiefe + 6 m
  if (WTO.vorplatz) { const [da, db] = WTO.vorplatz.dir; let t = WTO.vorplatz.tiefe;
    const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz, u = L ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L)) : 0; return Math.hypot(x - a[0] - dx * u, z - a[1] - dz * u); };
    // Strassenstuecke (Karten-Koordinaten) bis 160 m um den Turm, Gehsteig wie gotham-strassen.js (vorher alle: 0,1 s beim Laden)
    const SG = []; for (const [L, wk] of [[GOTHAM_STADT.haupt, 4], [GOTHAM_STADT.neben, 0]]) for (const r of L) for (let j = 1; j < r.pts.length; j++) { const a = r.pts[j - 1], b = r.pts[j];
      if (segD(WTO.O.x, WTO.O.z, a, b) < 160) SG.push([a, b, r.w / 2 + (wk || (r.w >= 8 ? 3 : 2)) - 0.2]); }
    const onWalk = (a, b) => { const x = WTO.O.x + a, z = WTO.O.z + b; return SG.some(([p, q, lim]) => segD(x, z, p, q) < lim); };
    // je 2-m-Streifen quer bis an den Gehsteig (die Strasse laeuft schraeg), hoechstens Kartentiefe + 12 m
    const P = (q, d) => da ? [da * (S + d), q] : [q, db * (S + d)], depth = q => { for (let d = 1; d <= t + 12; d += 0.5) if (onWalk(...P(q, d))) return d + 0.4; return t; };
    let qa = -S, da0 = depth(qa); WTO.vorplatz.tiefeIst = da0;
    for (let qb = -S + 2; qb <= S + 0.01; qb += 2) { const db0 = depth(qb), p = [P(qa, 0), P(qb, 0), P(qb, db0), P(qa, da0)];
      const up = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]) < 0; const o = up ? p : [p[0], p[3], p[2], p[1]];
      quad("plaza", o.map(([a, b]) => [a, 0.08, b]), o.map(([a, b]) => [a / 4, b / 4])); qa = qb; da0 = db0; } }
  flat("plaza", -S - 2, S + 2, -S - 2, -S, 0.08); flat("plaza", -S - 2, S + 2, S, S + 2, 0.08); flat("plaza", -S - 2, -S, -S, S, 0.08); flat("plaza", S, S + 2, -S, S, 0.08);
  // ---------- Lobby und Aufzugskern (Task 4, Rohbau; Einrichtung erst am Schluss) ----------
  { const K = WTO.kern, D = WTO.kernTuer, I = S - 0.4;                          // I: Innenkante der Sockelwand
    const around = (fn) => { fn(-I, I, -I, K.b0); fn(-I, I, K.b1, I); fn(-I, K.a0, K.b0, K.b1); fn(K.a1, I, K.b0, K.b1); };   // Flaeche ohne den Kern
    around((a0, a1, b0, b1) => flat("lfloor", a0, a1, b0, b1, 0.1, 6));
    around((a0, a1, b0, b1) => quad("ceil", [[a0, 9.4, b0], [a1, 9.4, b0], [a1, 9.4, b1], [a0, 9.4, b1]], [[0, 0], [1, 0], [1, 1], [0, 1]]));   // Decke (nach unten)
    for (const a of [-24, -12, 12, 24]) for (const b of [-26, -2, 22]) box("stone", a - 0.6, a + 0.6, b - 0.6, b + 0.6, 0.1, 9.4);           // Stuetzen
    for (const a of [-24, -12, 0, 12, 24]) for (const b of [-28, -8, 12, 28]) if (!(a === 0 && b === -8)) quad("light", [[a - 2, 9.35, b - 0.5], [a + 2, 9.35, b - 0.5], [a + 2, 9.35, b + 0.5], [a - 2, 9.35, b + 0.5]], [[0, 0], [1, 0], [1, 1], [0, 1]]);   // Lichtfelder
    // Kern: Waende aussen, Tuer zur Lobby (+b) in der Mitte; Tuerblaetter zu (der Aufzug kommt in Task 7)
    wallQ("core", K.a1, K.b0, K.a0, K.b0, 0.1, 9.4); wallQ("core", K.a0, K.b0, K.a0, K.b1, 0.1, 9.4); wallQ("core", K.a1, K.b1, K.a1, K.b0, 0.1, 9.4);
    wallQ("core", K.a0, K.b1, -D.w / 2, K.b1, 0.1, 9.4); wallQ("core", D.w / 2, K.b1, K.a1, K.b1, 0.1, 9.4); wallQ("core", -D.w / 2, K.b1, D.w / 2, K.b1, D.h, 9.4);
    box("metal", -D.w / 2, D.w / 2, K.b1 - 0.12, K.b1 - 0.02, 0.1, D.h);
    box("stone", -D.w / 2 - 0.25, D.w / 2 + 0.25, K.b1, K.b1 + 0.15, D.h, D.h + 0.3); }
  // ---------- in die Welt setzen ----------
  const grp = WTB.group = new THREE.Group(); grp.name = "Wayne Tower";
  grp.position.set(WTO.cx, Y, WTO.cz); grp.rotation.y = WTO.rot;
  for (const [k, g] of Object.entries(G)) { if (!g.I.length) continue;
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(g.P, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(g.U, 2)); geo.setIndex(g.I); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mats[k]); m.name = "Wayne Tower " + k; m.castShadow = k !== "plaza" && k !== "sign"; m.receiveShadow = true; m.userData.keep = true; m.userData.noLift = true; grp.add(m); }
  for (const t of [facTex]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  lobbyTex.wrapS = lobbyTex.wrapT = THREE.RepeatWrapping;
  grp.userData.keep = true; grp.userData.noLift = true; grp.userData.dynamic = true; scene.add(grp);
  // ---------- Kollision ----------
  const th = 0.6;
  // Sockelwaende mit Eingang, Vordach (Boden), Gesims
  wtPart(-S, S, -S - th / 2, -S + th / 2, 0, 11.2); wtPart(S - th / 2, S + th / 2, -S, S, 0, 11.2); wtPart(-S - th / 2, -S + th / 2, -S, S, 0, 11.2);
  wtPart(eh, S, S - th / 2, S + th / 2, 0, 11.2); wtPart(-S, -eh, S - th / 2, S + th / 2, 0, 11.2); wtPart(-eh, eh, S - th / 2, S + th / 2, E.h, 11.2);
  wtPart(-eh - 3, eh + 3, S, S + 7, 7.8, 8.6);
  // Stufen: Waende, Terrassen-Streifen (Boden), Bruestung
  WTO.tiers.forEach((T, i) => { const h = T.h, inner = i < 2 ? WTO.tiers[i + 1].h : WTO.krone.h;
    wtPart(-h, h, -h - th / 2, -h + th / 2, T.y0, T.y1); wtPart(-h, h, h - th / 2, h + th / 2, T.y0, T.y1); wtPart(-h - th / 2, -h + th / 2, -h, h, T.y0, T.y1); wtPart(h - th / 2, h + th / 2, -h, h, T.y0, T.y1);
    for (const [a0, a1, b0, b1] of [[-h, h, -h, -inner], [-h, h, inner, h], [-h, -inner, -inner, inner], [inner, h, -inner, inner]]) wtPart(a0, a1, b0, b1, T.y1 - 0.4, T.y1, { chain: 1 });
    wtPart(-h - 0.3, h + 0.3, -h - 0.3, -h + 0.1, T.y1, T.y1 + 1.2); wtPart(-h - 0.3, h + 0.3, h - 0.1, h + 0.3, T.y1, T.y1 + 1.2); wtPart(-h - 0.3, -h + 0.1, -h, h, T.y1, T.y1 + 1.2); wtPart(h - 0.1, h + 0.3, -h, h, T.y1, T.y1 + 1.2);
    for (const sa of [-1, 1]) for (const sb of [-1, 1]) wtPart(sa * h - 1.2, sa * h + 1.2, sb * h - 1.2, sb * h + 1.2, T.y0, T.y1 + 4); });
  { const K = WTO.krone; for (const [h, a, b] of [[K.h, WTO.lv.dach, 280], [13, 280, 292], [9, 292, K.y1]]) wtPart(-h, h, -h, h, a, b); wtPart(-0.6, 0.6, -0.6, 0.6, K.y1, K.antenne); }
  // Lobby: Boden, Decke (Boden von Geschoss 1), Stuetzen, Kern mit geschlossener Tuer (WTB.kernTuer, Task 7 oeffnet sie)
  { const K = WTO.kern, D = WTO.kernTuer, I = S - 0.4;
    for (const [a0, a1, b0, b1] of [[-I, I, -I, K.b0], [-I, I, K.b1, I], [-I, K.a0, K.b0, K.b1], [K.a1, I, K.b0, K.b1]]) { wtPart(a0, a1, b0, b1, -0.3, 0.1, { chain: 1 }); wtPart(a0, a1, b0, b1, 9.4, 9.8, { chain: 1 }); }
    for (const a of [-24, -12, 12, 24]) for (const b of [-26, -2, 22]) wtPart(a - 0.6, a + 0.6, b - 0.6, b + 0.6, 0.1, 9.4);
    wtPart(K.a0, K.a1, K.b0 - 0.15, K.b0 + 0.15, 0.1, 9.4); wtPart(K.a0 - 0.15, K.a0 + 0.15, K.b0, K.b1, 0.1, 9.4); wtPart(K.a1 - 0.15, K.a1 + 0.15, K.b0, K.b1, 0.1, 9.4);
    wtPart(K.a0, -D.w / 2, K.b1 - 0.15, K.b1 + 0.15, 0.1, 9.4); wtPart(D.w / 2, K.a1, K.b1 - 0.15, K.b1 + 0.15, 0.1, 9.4); wtPart(-D.w / 2, D.w / 2, K.b1 - 0.15, K.b1 + 0.15, D.h, 9.4);
    WTB.kernTuer = wtPart(-D.w / 2, D.w / 2, K.b1 - 0.15, K.b1 + 0.05, 0.1, D.h); }
  // Register
  bautAdd({ id: "GO-WAYNE-TOWER", name: "Wayne Tower", art: "Hochhaus", poly: WTO.poly(-S, S, -S, S), y0: Y - 0.5, y1: Y + WTO.krone.antenne, info: "320 m" });
}
// Nachtlicht (aus der Schleife): Fenster, Lobby, Schrift, Lichtband
function wtStep() {
  const m = WTB.mats; if (!m) return; const n = typeof night === "number" ? night : 0;
  if (m._n === n) return; m._n = n;
  m.fac.emissiveIntensity = n * 1.1; m.lobby.emissiveIntensity = n * 0.5; m.sign.emissiveIntensity = 0.25 + n * 0.6; m.light.emissiveIntensity = 0.6 + n * 2.4;
}
