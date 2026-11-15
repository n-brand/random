"use strict";
// Batverse – Gotham: Wayne Tower unter der Erde (Plan 2026-11-14-wayne-tower, Task 5/6). Nicolas: zwei oeffentliche Tiefgaragen (nicht geheim, mit
// Schranke), Wayne-Aufzug in beiden Ebenen, geschwungene Rampe zwischen den Ebenen, Strasse zur unteren Strasse; geheimer Stock mit Gang (Task 6).
// Turm-Koordinaten wie gotham-wayne-daten.js (WTO). Rohbau, Einrichtung kommt am Schluss.
const WTU = { mats: null, group: null, parts: [], schranke: null };
// gedrehter Quader in Turm-Koordinaten, Laengsrichtung (da, db) (Einheitsvektor in Turm-Koordinaten)
function wtPartR(ca, cb, da, db, hl, hw, y0, y1, opt = {}) {
  const [cx, cz] = WTO.toW(ca, cb), ux = da * WTO.ux - db * WTO.uz, uz = da * WTO.uz + db * WTO.ux;
  const o = dkAdd(Object.assign({ cx, cy: WTO.Y + (y0 + y1) / 2, cz, ux, uz, hl, hw, hh: (y1 - y0) / 2 }, opt)); WTU.parts.push(o); return o;
}
const wtPartU = (a0, a1, b0, b1, y0, y1, opt) => wtPartR((a0 + a1) / 2, (b0 + b1) / 2, 1, 0, (a1 - a0) / 2, (b1 - b0) / 2, y0, y1, opt);
{
  const T = WTO.tg, H = WTO.helix, Z = WTO.zufahrt, K = WTO.kern, KG = WTO.kernGang, L1 = WTO.lv.tg1, L2 = WTO.lv.tg2, C1 = -1, C2 = -6;
  // ---------- Materialien ----------
  const concT = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#9a978f"; c.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { const v = 130 + Math.random() * 40; c.fillStyle = `rgb(${v},${v - 2},${v - 6})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    c.fillStyle = "rgba(0,0,0,0.2)"; c.fillRect(0, 0, w, 2); c.fillRect(0, 0, 2, h); }); concT.wrapS = concT.wrapT = THREE.RepeatWrapping;
  const asphT = canvasTex(128, 128, (c, w, h) => { const im = c.createImageData(w, h), d = im.data; for (let i = 0; i < w * h; i++) { const v = 62 + (Math.random() - 0.5) * 14; d[i * 4] = v; d[i * 4 + 1] = v + 1; d[i * 4 + 2] = v + 3; d[i * 4 + 3] = 255; } c.putImageData(im, 0, 0); });
  asphT.wrapS = asphT.wrapT = THREE.RepeatWrapping;
  const stripeT = canvasTex(128, 32, (c, w, h) => { c.fillStyle = "#e0b31c"; c.fillRect(0, 0, w, h); c.fillStyle = "#1d1d1d"; for (let x = -32; x < w + 32; x += 32) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 16, h); c.lineTo(x + 32, 0); c.lineTo(x + 16, 0); c.fill(); } });
  stripeT.wrapS = stripeT.wrapT = THREE.RepeatWrapping;
  const signT = canvasTex(512, 160, (c, w, h) => { c.fillStyle = "#1b3f8f"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.fillRect(10, 10, 140, 140); c.fillStyle = "#1b3f8f"; c.font = "bold 130px Arial, sans-serif"; c.textAlign = "center"; c.fillText("P", 80, 128);
    c.fillStyle = "#fff"; c.font = "bold 56px Arial, sans-serif"; c.textAlign = "left"; c.fillText("WAYNE TOWER", 170, 75); c.font = "38px Arial, sans-serif"; c.fillText("Parkhaus · Public", 170, 125); });
  const M2 = o => new THREE.MeshStandardMaterial(Object.assign({ side: THREE.DoubleSide }, o));
  const mats = WTU.mats = {                                                          // leicht selbst hell: unter der Erde kommt kaum Licht hin
    conc: M2({ map: concT, roughness: 0.9, emissive: 0x8a877f, emissiveIntensity: 0.35 }),
    floor: M2({ map: asphT, roughness: 0.85, emissive: 0x4a4a4a, emissiveIntensity: 0.3 }),
    line: M2({ color: 0xf2f2ea, emissive: 0xf2f2ea, emissiveIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    lamp: M2({ color: 0xfff6e0, emissive: 0xfff2d0, emissiveIntensity: 1.2 }),
    stripe: M2({ map: stripeT, roughness: 0.6, emissive: 0x806010, emissiveIntensity: 0.3 }),
    red: M2({ color: 0xc8202a, emissive: 0x5a0a0e, emissiveIntensity: 0.5 }), white: M2({ color: 0xf0f0f0, emissive: 0x606060, emissiveIntensity: 0.4 }),
    metal: M2({ color: 0x5b6670, metalness: 0.5, roughness: 0.5, emissive: 0x2a3036, emissiveIntensity: 0.4 }),
    sign: M2({ map: signT, emissive: 0xffffff, emissiveMap: signT, emissiveIntensity: 0.5 }),
  };
  // ---------- Geometrie in Turm-Koordinaten (x = a, z = b, y relativ zu WTO.Y) ----------
  const G = {}; for (const k of Object.keys(mats)) G[k] = { P: [], U: [], I: [] };
  const quad = (k, p, uv) => { const g = G[k], n = g.P.length / 3; for (const q of p) g.P.push(...q); for (const t of uv) g.U.push(...t); g.I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  const flat = (k, a0, a1, b0, b1, y, sc = 4) => quad(k, [[a0, y, b1], [a1, y, b1], [a1, y, b0], [a0, y, b0]], [[a0 / sc, b1 / sc], [a1 / sc, b1 / sc], [a1 / sc, b0 / sc], [a0 / sc, b0 / sc]]);
  const wallQ = (k, a0, b0, a1, b1, y0, y1, sc = 3) => { const L = Math.hypot(a1 - a0, b1 - b0); quad(k, [[a0, y0, b0], [a1, y0, b1], [a1, y1, b1], [a0, y1, b0]], [[0, y0 / sc], [L / sc, y0 / sc], [L / sc, y1 / sc], [0, y1 / sc]]); };
  const box = (k, a0, a1, b0, b1, y0, y1) => { wallQ(k, a0, b0, a1, b0, y0, y1); wallQ(k, a1, b0, a1, b1, y0, y1); wallQ(k, a1, b1, a0, b1, y0, y1); wallQ(k, a0, b1, a0, b0, y0, y1); flat(k, a0, a1, b0, b1, y1); };
  // Flaeche der Tiefgarage in 2-m-Zeilen ohne Loch (Wendel in TG 1), je Zeile zusammenhaengende Stuecke
  const hole1 = (a, b) => Math.hypot(a - H.ca, b - H.cb) < H.R + H.w / 2 + 0.3 && !(a > H.ca - H.R - H.w / 2 - 0.2 && a < H.ca - H.R + H.w / 2 + 0.2 && b > H.cb);
  const runs = hole => { const out = []; for (let b = T.b0; b < T.b1 - 0.01; b += 2) { let s = null; for (let a = T.a0; a <= T.a1 + 0.01; a += 1) { const ok = a < T.a1 - 0.01 && !hole(a + 0.5, b + 1); if (ok && s === null) s = a; if (!ok && s !== null) { out.push([s, a, b, Math.min(T.b1, b + 2)]); s = null; } } } return out; };
  const R1 = runs(hole1), R2 = runs(() => false);
  for (const [a0, a1, b0, b1] of R1) { flat("floor", a0, a1, b0, b1, L1); quad("conc", [[a0, C2, b0], [a1, C2, b0], [a1, C2, b1], [a0, C2, b1]], [[a0 / 3, b0 / 3], [a1 / 3, b0 / 3], [a1 / 3, b1 / 3], [a0 / 3, b1 / 3]]); }   // TG1-Boden, TG2-Decke
  for (const [a0, a1, b0, b1] of R2) flat("floor", a0, a1, b0, b1, L2);
  flat("conc", T.a0, T.a1, T.b0, T.b1, C1);                                                  // TG1-Decke (Unterseite der Strassenplatte)
  // Waende je Ebene mit Oeffnungen: Sued (+b) zum Kerngang, Nord (-b) in TG1 zur Zufahrt
  for (const [y0, y1, nord] of [[L1, C1, [Z.a0, Z.a1]], [L2, C2, null]]) {
    wallQ("conc", T.a0, T.b1, KG.a0, T.b1, y0, y1); wallQ("conc", KG.a1, T.b1, T.a1, T.b1, y0, y1);
    if (nord) { wallQ("conc", T.a0, T.b0, nord[0], T.b0, y0, y1); wallQ("conc", nord[1], T.b0, T.a1, T.b0, y0, y1); } else wallQ("conc", T.a0, T.b0, T.a1, T.b0, y0, y1);
    wallQ("conc", T.a0, T.b0, T.a0, T.b1, y0, y1); wallQ("conc", T.a1, T.b0, T.a1, T.b1, y0, y1);
    wallQ("stripe", T.a0, T.b1 - 0.02, T.a1, T.b1 - 0.02, y0, y0 + 0.5, 1); wallQ("stripe", T.a0, T.b0 + 0.02, T.a1, T.b0 + 0.02, y0, y0 + 0.5, 1);
    // Stuetzen, Lampen, Parkfelder
    for (const [a, b] of WTO.tgPfeiler) box("conc", a - 0.35, a + 0.35, b - 0.35, b + 0.35, y0, y1);
    for (let a = T.a0 + 6; a < T.a1 - 4; a += 10) for (let b = T.b0 + 8; b < T.b1 - 4; b += 12) if (y1 === C2 ? true : !hole1(a, b)) quad("lamp", [[a - 1.5, y1 - 0.06, b - 0.3], [a + 1.5, y1 - 0.06, b - 0.3], [a + 1.5, y1 - 0.06, b + 0.3], [a - 1.5, y1 - 0.06, b + 0.3]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const bay = (a0, a1, b0, b1, skip) => { for (let a = a0; a <= a1 + 0.01; a += 2.5) if (!skip(a)) flat("line", a - 0.06, a + 0.06, b0, b1, y0 + 0.02); };
    bay(T.a0 + 2, T.a1 - 2, T.b1 - 5, T.b1 - 0.3, a => a > KG.a0 - 1.5 && a < KG.a1 + 1.5);
    bay(T.a0 + 2, 2, -60, -50, a => false);
    bay(T.a0 + 2, T.a1 - 2, T.b0 + 0.3, T.b0 + 5, a => (nord && a > nord[0] - 2 && a < nord[1] + 2) || a > H.ca - H.R - H.w);
  }
  // Wendelrampe: eine Umdrehung, oben bei Winkel pi (Punkt ca - R, cb), Fahrt in Richtung -b, Winkel steigt bis 3 pi, Hoehe faellt gleichmaessig von TG1 auf TG2
  const hY = th => L1 + (L2 - L1) * (th - Math.PI) / (2 * Math.PI), rI = H.R - H.w / 2, rO = H.R + H.w / 2, P = (r, th) => [H.ca + r * Math.cos(th), H.cb + r * Math.sin(th)];
  { const N = 144; for (let i = 0; i < N; i++) { const t0 = Math.PI + i / N * 2 * Math.PI, t1 = Math.PI + (i + 1) / N * 2 * Math.PI, y0 = hY(t0), y1 = hY(t1);
      const [a0, b0] = P(rI, t0), [a1, b1] = P(rO, t0), [a2, b2] = P(rO, t1), [a3, b3] = P(rI, t1);
      quad("floor", [[a0, y0, b0], [a3, y1, b3], [a2, y1, b2], [a1, y0, b1]], [[0, 0], [1, 0], [1, 1], [0, 1]]); quad("conc", [[a0, y0 - 0.3, b0], [a1, y0 - 0.3, b1], [a2, y1 - 0.3, b2], [a3, y1 - 0.3, b3]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const [c0, d0] = P(H.R, t0), [c1, d1] = P(H.R, t1); quad("line", [[c0 - 0.0, y0 + 0.02, d0], [c1, y1 + 0.02, d1], [c1 + 0.12 * Math.cos(t1), y1 + 0.02, d1 + 0.12 * Math.sin(t1)], [c0 + 0.12 * Math.cos(t0), y0 + 0.02, d0 + 0.12 * Math.sin(t0)]], [[0, 0], [1, 0], [1, 1], [0, 1]]); } }
  // Aussenwand (offen an den Anschluessen: TG1 von +b her, TG2 nach -b hinaus) und Mittelsaeule mit Warnstreifen
  const inStrip = (a, b) => a > H.ca - rO - 0.3 && a < H.ca - rI + 0.3;
  for (let i = 0; i < 72; i++) { const t0 = i / 72 * 2 * Math.PI, t1 = (i + 1) / 72 * 2 * Math.PI, [a0, b0] = P(rO + 0.2, t0), [a1, b1] = P(rO + 0.2, t1), [am, bm] = P(rO + 0.2, (t0 + t1) / 2);
    const top = !(inStrip(am, bm) && bm > H.cb), bot = !(inStrip(am, bm) && bm < H.cb);
    if (top) wallQ("conc", a0, b0, a1, b1, L1, C1); if (bot) wallQ("conc", a0, b0, a1, b1, L2, C2);
    const [e0, f0] = P(rI - 0.2, t0), [e1, f1] = P(rI - 0.2, t1); wallQ("stripe", e0, f0, e1, f1, L2, L2 + 0.8, 1); wallQ("conc", e0, f0, e1, f1, L2 + 0.8, C1); }
  // Kerngang (TG-Suedwand bis Kern) in beiden Ebenen, Tuer zum Wayne-Aufzug geschlossen (Task 7)
  for (const [y0, y1] of [[L1, C1], [L2, C2]]) { flat("floor", KG.a0, KG.a1, T.b1, K.b0, y0); quad("conc", [[KG.a0, y1, T.b1], [KG.a1, y1, T.b1], [KG.a1, y1, K.b0], [KG.a0, y1, K.b0]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    wallQ("conc", KG.a0, T.b1, KG.a0, K.b0, y0, y1); wallQ("conc", KG.a1, T.b1, KG.a1, K.b0, y0, y1); wallQ("conc", KG.a0, K.b0, KG.a1, K.b0, y0, y1);
    box("metal", -WTO.kernTuer.w / 2, WTO.kernTuer.w / 2, K.b0 + 0.02, K.b0 + 0.12, y0, y0 + WTO.kernTuer.h);
    quad("lamp", [[-0.6, y1 - 0.06, -30], [0.6, y1 - 0.06, -30], [0.6, y1 - 0.06, -28], [-0.6, y1 - 0.06, -28]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
  // Zufahrt: ebener Tunnel auf TG1-Hoehe von der Nordwand bis an die untere Ringstrasse; Gehweg 1,5 m (Westseite, 15 cm), Schranke, Parkhaus-Schild
  { const e0 = Z.end[0], e1 = Z.end[1], eM = Math.min(e0, e1);
    for (let b = T.b0; b > eM - 0.01; b -= 10) { const bb = Math.max(eM - 1, b - 10); flat("floor", Z.a0 + 1.5, Z.a1, bb, b, L1); flat("conc", Z.a0, Z.a0 + 1.5, bb, b, L1 + 0.15); quad("conc", [[Z.a0, C1, bb], [Z.a1, C1, bb], [Z.a1, C1, b], [Z.a0, C1, b]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      quad("lamp", [[(Z.a0 + Z.a1) / 2 - 0.3, C1 - 0.06, b - 6], [(Z.a0 + Z.a1) / 2 + 0.3, C1 - 0.06, b - 6], [(Z.a0 + Z.a1) / 2 + 0.3, C1 - 0.06, b - 3], [(Z.a0 + Z.a1) / 2 - 0.3, C1 - 0.06, b - 3]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    wallQ("conc", Z.a0, T.b0, Z.a0, e0, L1, C1); wallQ("conc", Z.a1, T.b0, Z.a1, e1, L1, C1); wallQ("conc", Z.a0 + 1.5, T.b0, Z.a0 + 1.5, eM, L1, L1 + 0.15);
    for (let b = T.b0 - 5; b > eM + 3; b -= 6) flat("line", (Z.a0 + 1.5 + Z.a1) / 2 - 0.08, (Z.a0 + 1.5 + Z.a1) / 2 + 0.08, b - 3, b, L1 + 0.02);   // Mittellinie gestrichelt
    // Schild ueber der Einfahrt (von der Ringstrasse lesbar) und Pfosten der Schranke
    const sb = eM + 1.2; quad("sign", [[Z.a1 - 0.5, -2.6, sb], [Z.a0 + 0.5, -2.6, sb], [Z.a0 + 0.5, -1.2, sb], [Z.a1 - 0.5, -1.2, sb]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    box("metal", Z.a0 + 1.6, Z.a0 + 2.0, Z.schranke - 0.2, Z.schranke + 0.2, L1, L1 + 1.1); }
  // ---------- in die Welt setzen ----------
  const grp = WTU.group = new THREE.Group(); grp.name = "Wayne Tower unten"; grp.position.set(WTO.cx, WTO.Y, WTO.cz); grp.rotation.y = WTO.rot;
  for (const [k, g] of Object.entries(G)) { if (!g.I.length) continue;
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(g.P, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(g.U, 2)); geo.setIndex(g.I); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mats[k]); m.name = "Wayne Tower unten " + k; m.userData.keep = true; m.userData.noLift = true; grp.add(m); }
  // Schranke (rot-weisser Baum, dreht am Pfosten nach oben)
  { const Sg = new THREE.Group(), L = Z.a1 - Z.a0 - 2.3; Sg.position.set(Z.a0 + 1.8, L1 + 1.0, Z.schranke);
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(L / 6, 0.12, 0.08), i % 2 ? mats.white : mats.red); m.position.x = (i + 0.5) * L / 6; Sg.add(m); }
    Sg.userData.dynamic = true; grp.add(Sg);
    WTU.schranke = { g: Sg, open: 0, hold: 0, part: wtPartU(Z.a0 + 1.6, Z.a1, Z.schranke - 0.05, Z.schranke + 0.05, L1 + 0.94, L1 + 1.06) }; }
  grp.userData.keep = true; grp.userData.noLift = true; grp.userData.dynamic = true; scene.add(grp);
  // ---------- Kollision, Hohlraeume, Register ---------- (Bodenplatten mit 5 cm Rand: 0,3 m wirkten am Wendel-Ende als Kante)
  for (const [a0, a1, b0, b1] of R1) wtPartU(a0, a1, b0, b1, L1 - 0.5, L1, { chain: 1, m: 0.05 });
  for (const [a0, a1, b0, b1] of R2) wtPartU(a0, a1, b0, b1, L2 - 0.5, L2, { chain: 1, m: 0.05 });
  for (const [y0, y1, nord] of [[L1, C1, [Z.a0, Z.a1]], [L2, C2, null]]) {
    wtPartU(T.a0, KG.a0, T.b1 - 0.15, T.b1 + 0.15, y0, y1); wtPartU(KG.a1, T.a1, T.b1 - 0.15, T.b1 + 0.15, y0, y1);
    if (nord) { wtPartU(T.a0, nord[0], T.b0 - 0.15, T.b0 + 0.15, y0, y1); wtPartU(nord[1], T.a1, T.b0 - 0.15, T.b0 + 0.15, y0, y1); } else wtPartU(T.a0, T.a1, T.b0 - 0.15, T.b0 + 0.15, y0, y1);
    wtPartU(T.a0 - 0.15, T.a0 + 0.15, T.b0, T.b1, y0, y1); wtPartU(T.a1 - 0.15, T.a1 + 0.15, T.b0, T.b1, y0, y1);
    for (const [a, b] of WTO.tgPfeiler) wtPartU(a - 0.35, a + 0.35, b - 0.35, b + 0.35, y0, y1);
    wtPartU(KG.a0 - 0.15, KG.a0 + 0.15, T.b1, K.b0, y0, y1); wtPartU(KG.a1 - 0.15, KG.a1 + 0.15, T.b1, K.b0, y0, y1);
    wtPartU(KG.a0, KG.a1, K.b0 - 0.15, K.b0 + 0.15, y0 + WTO.kernTuer.h, y1); }
  WTU.kernTuer = { tg1: wtPartU(-WTO.kernTuer.w / 2, WTO.kernTuer.w / 2, K.b0 - 0.05, K.b0 + 0.15, L1, L1 + WTO.kernTuer.h), tg2: wtPartU(-WTO.kernTuer.w / 2, WTO.kernTuer.w / 2, K.b0 - 0.05, K.b0 + 0.15, L2, L2 + WTO.kernTuer.h) };
  for (const [y0] of [[L1], [L2]]) wtPartU(KG.a0, KG.a1, T.b1 - 0.5, K.b0, y0 - 0.5, y0, { chain: 1, m: 0.05 });
  // Wendel: Fahrbahn in 5-Grad-Stuecken (Boden), Aussenwand, Mittelsaeule
  for (let i = 0; i < 72; i++) { const th = Math.PI + (i + 0.5) / 72 * 2 * Math.PI, [a, b] = P(H.R, th), y = hY(th), ds = H.R * 2 * Math.PI / 72;
    wtPartR(a, b, -Math.sin(th), Math.cos(th), ds / 2 + 0.05, H.w / 2, y - 0.3, y, { chain: 1, m: 0.05 }); }
  for (let i = 0; i < 72; i++) { const th = (i + 0.5) / 72 * 2 * Math.PI, [a, b] = P(rO + 0.2, th), ds = (rO + 0.2) * 2 * Math.PI / 72, da = -Math.sin(th), db = Math.cos(th);
    const top = !(inStrip(a, b) && b > H.cb), bot = !(inStrip(a, b) && b < H.cb);
    if (top) wtPartR(a, b, da, db, ds / 2, 0.15, L1, C1, { floor: 0 }); if (bot) wtPartR(a, b, da, db, ds / 2, 0.15, L2, C2, { floor: 0 });
    const [c, d] = P(rI - 0.2, th); wtPartR(c, d, da, db, (rI - 0.2) * Math.PI / 72, 0.15, L2, C1, { floor: 0 }); }
  // Zufahrt: Boden, Gehweg, Waende, Decke
  { const e0 = Z.end[0], e1 = Z.end[1], eM = Math.min(e0, e1);
    for (let b = T.b0 + 0.5; b > eM - 1.5; b -= 10) { const bb = Math.max(eM - 2, b - 10); wtPartU(Z.a0 + 1.5, Z.a1, bb, b, L1 - 0.5, L1, { chain: 1, m: 0.05 }); wtPartU(Z.a0, Z.a0 + 1.5, bb, b, L1 - 0.5, L1 + 0.15, { chain: 1, m: 0.05 }); }
    wtPartU(Z.a0 - 0.15, Z.a0 + 0.15, e0, T.b0, L1, C1); wtPartU(Z.a1 - 0.15, Z.a1 + 0.15, e1, T.b0, L1, C1); }
  GR_NOSKIRT.push(WTO.poly(T.a0 - 4, T.a1 + 4, T.b0 - 4, T.b1 + 4), WTO.poly(Z.a0 - 4, Z.a1 + 4, Math.min(...Z.end) - 4, T.b0), WTO.poly(-40, 40, -40, 40));   // Tiefgaragen, Zufahrt, unter dem Turm
  GR_HOLES.push(WTO.poly(Z.a0 - 0.3, Z.a1 + 0.3, Math.min(...Z.end) - 1, Math.max(...Z.end) + 9));   // Gelaende am Tunnelmund (gotham-raster.js)
  for (const r of [{ poly: WTO.poly(T.a0, T.a1, T.b0, T.b1), y0: L2 - 0.2, y1: C1 }, { poly: WTO.poly(KG.a0, KG.a1, T.b1 - 1, K.b0), y0: L2 - 0.2, y1: C1 },
    { poly: WTO.poly(Z.a0, Z.a1, Math.min(...Z.end) - 3, T.b0 + 1), y0: L1 - 0.2, y1: C1 }]) dkRoom({ poly: r.poly, y0: WTO.Y + r.y0, y1: WTO.Y + r.y1 });
  bautAdd({ id: "GO-WAYNE-TG1", name: "Tiefgarage 1 (Wayne Tower)", art: "Parkhaus", poly: WTO.poly(T.a0, T.a1, T.b0, T.b1), y0: WTO.Y + L1 - 0.3, y1: WTO.Y + C1, info: "öffentlich" });
  bautAdd({ id: "GO-WAYNE-TG2", name: "Tiefgarage 2 (Wayne Tower)", art: "Parkhaus", poly: WTO.poly(T.a0, T.a1, T.b0, T.b1), y0: WTO.Y + L2 - 0.3, y1: WTO.Y + C2, info: "öffentlich" });
  bautAdd({ id: "GO-WAYNE-ZUFAHRT", name: "Zufahrt Parkhaus Wayne Tower", art: "Tunnel", poly: WTO.poly(Z.a0, Z.a1, Math.min(...Z.end), T.b0), y0: WTO.Y + L1 - 0.3, y1: WTO.Y + C1 });
}
// Schranke: oeffnet, wenn das aktive Fahrzeug langsamer als 3 m/s hoechstens 6 m vor ihr steht (beide Seiten), schliesst 4 s spaeter; zu ist sie fest
function wtSchrankeStep(dtIn) {
  const S = WTU.schranke; if (!S) return; const Z = WTO.zufahrt, now = performance.now() / 1000, dt = dtIn ?? Math.min(0.1, now - (S.t || now)); S.t = now;
  let want = false;
  if (typeof CAR !== "undefined" && CAR && CAR.on) { const [a, b] = WTO.toT(CAR.x, CAR.z); if (a > Z.a0 && a < Z.a1 + 1 && Math.abs(b - Z.schranke) < 6 + 2.5 && Math.abs(CAR.v) < 3 && Math.abs(CAR.y - (WTO.Y + WTO.lv.tg1)) < 2) want = true; }
  S.hold = want ? 4 : Math.max(0, S.hold - dt);
  const tgt = S.hold > 0 ? 1 : 0; if (S.open === tgt) return;
  S.open = tgt > S.open ? Math.min(1, S.open + dt / 1.5) : Math.max(0, S.open - dt / 1.5);
  S.g.rotation.z = S.open * Math.PI * 0.47; S.part.on = S.open < 0.35;
}
