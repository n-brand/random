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
  const exitT = canvasTex(512, 160, (c, w, h) => { c.fillStyle = "#1f7a3a"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "bold 72px Arial, sans-serif"; c.textAlign = "center"; c.fillText("AUSGANG", w / 2 - 30, 100);
    c.beginPath(); c.moveTo(w - 70, 58); c.lineTo(w - 22, 80); c.lineTo(w - 70, 102); c.closePath(); c.fill(); c.font = "32px Arial, sans-serif"; c.fillText("Exit · Lower Level", w / 2 - 30, 142); });
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
    sign: M2({ map: signT, emissive: 0xffffff, emissiveMap: signT, emissiveIntensity: 0.5, side: THREE.FrontSide }),   // nur von der Ringstrasse lesbar
    exit: M2({ map: exitT, emissive: 0xffffff, emissiveMap: exitT, emissiveIntensity: 0.5, side: THREE.FrontSide }),   // Rueckseite (Nicolas 2026-11-15: von innen "Ausgang")
  };
  // ---------- Geometrie in Turm-Koordinaten (x = a, z = b, y relativ zu WTO.Y) ----------
  const G = {}; for (const k of Object.keys(mats)) G[k] = { P: [], U: [], I: [] };
  const quad = (k, p, uv) => { const g = G[k], n = g.P.length / 3; for (const q of p) g.P.push(...q); for (const t of uv) g.U.push(...t); g.I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  const flat = (k, a0, a1, b0, b1, y, sc = 4) => quad(k, [[a0, y, b1], [a1, y, b1], [a1, y, b0], [a0, y, b0]], [[a0 / sc, b1 / sc], [a1 / sc, b1 / sc], [a1 / sc, b0 / sc], [a0 / sc, b0 / sc]]);
  const wallQ = (k, a0, b0, a1, b1, y0, y1, sc = 3) => { const L = Math.hypot(a1 - a0, b1 - b0); quad(k, [[a0, y0, b0], [a1, y0, b1], [a1, y1, b1], [a0, y1, b0]], [[0, y0 / sc], [L / sc, y0 / sc], [L / sc, y1 / sc], [0, y1 / sc]]); };
  const box = (k, a0, a1, b0, b1, y0, y1) => { wallQ(k, a0, b0, a1, b0, y0, y1); wallQ(k, a1, b0, a1, b1, y0, y1); wallQ(k, a1, b1, a0, b1, y0, y1); wallQ(k, a0, b1, a0, b0, y0, y1); flat(k, a0, a1, b0, b1, y1); };
  // Flaeche der Tiefgarage in 2-m-Zeilen ohne Loch (Wendel in TG 1), je Zeile zusammenhaengende Stuecke
  // (Nicolas 2026-11-15, Geist in TG1: "relativ viel offen": der Rand war in 2-m-Stufen gezackt) Loch bis an die Aussenwand, im Band der Wendel 0,5-m-Zellen
  const hole1 = (a, b) => Math.hypot(a - H.ca, b - H.cb) < H.R + H.w / 2 + 0.25 && !(a > H.ca - H.R - H.w / 2 - 0.2 && a < H.ca - H.R + H.w / 2 + 0.2 && b > H.cb);
  const runs = hole => { const out = [], band = b => b > H.cb - H.R - H.w - 1 && b < H.cb + H.R + H.w + 1;
    for (let b = T.b0; b < T.b1 - 0.01;) { const st = band(b) || band(b + 2) ? 0.5 : 2, b1 = Math.min(T.b1, b + st); let s = null;
      for (let a = T.a0; a <= T.a1 + 0.01; a += st) { const ok = a < T.a1 - 0.01 && !hole(a + st / 2, (b + b1) / 2); if (ok && s === null) s = a; if (!ok && s !== null) { out.push([s, a, b, b1]); s = null; } }
      b = b1; } return out; };
  const R1 = runs(hole1), R2 = runs(() => false);
  // TG1-Boden und TG2-Decke als eine Flaeche mit rundem Loch (glatter Rand an der Wendel-Aussenwand; die Zellen R1 sind nur noch Kollision)
  { const rW = H.R + H.w / 2 + 0.2, aS = H.ca - H.R + H.w / 2 + 0.25, th1 = 2 * Math.PI + Math.acos((aS - H.ca) / rW), sh = new THREE.Shape([[T.a0, T.b0], [T.a1, T.b0], [T.a1, T.b1], [T.a0, T.b1]].map(([a, b]) => new THREE.Vector2(a, b)));
    const hp = []; for (let k = 0; k <= 96; k++) { const t = Math.PI + (th1 - Math.PI) * k / 96; hp.push(new THREE.Vector2(H.ca + rW * Math.cos(t), H.cb + rW * Math.sin(t))); }
    hp.push(new THREE.Vector2(aS, H.cb)); sh.holes.push(new THREE.Path(hp));
    for (const [k, y] of [["floor", L1], ["conc", C2]]) { const g = new THREE.ShapeGeometry(sh, 4).rotateX(Math.PI / 2).translate(0, y, 0), uv = g.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setXY(j, uv.getX(j) / 4, uv.getY(j) / 4);
      const G2 = G[k], n = G2.P.length / 3; G2.P.push(...g.attributes.position.array); G2.U.push(...uv.array); for (const ix of g.index.array) G2.I.push(n + ix); } }
  for (const [a0, a1, b0, b1] of R2) flat("floor", a0, a1, b0, b1, L2);
  flat("conc", T.a0, T.a1, T.b0, T.b1, C1);                                                  // TG1-Decke (Unterseite der Strassenplatte)
  // Waende je Ebene mit Oeffnungen: Sued (+b) zum Kerngang, Nord (-b) in TG1 zur Zufahrt
  for (const [y0, y1, nord] of [[L1, C1, [Z.a0, Z.a1]], [L2, C2, null]]) {
    wallQ("conc", T.a0, T.b1, KG.a0, T.b1, y0, y1); wallQ("conc", KG.a1, T.b1, T.a1, T.b1, y0, y1);
    if (nord) { wallQ("conc", T.a0, T.b0, nord[0], T.b0, y0, y1); wallQ("conc", nord[1], T.b0, T.a1, T.b0, y0, y1); } else wallQ("conc", T.a0, T.b0, T.a1, T.b0, y0, y1);
    wallQ("conc", T.a0, T.b0, T.a0, T.b1, y0, y1); wallQ("conc", T.a1, T.b0, T.a1, T.b1, y0, y1);
    // Warnstreifen am Wandfuss, nicht durch die Oeffnungen (Nicolas 2026-11-15: lief als gelber Balken quer ueber die Einfahrt)
    for (const [a0, a1] of [[T.a0, KG.a0], [KG.a1, T.a1]]) wallQ("stripe", a0, T.b1 - 0.02, a1, T.b1 - 0.02, y0, y0 + 0.5, 1);
    for (const [a0, a1] of nord ? [[T.a0, nord[0]], [nord[1], T.a1]] : [[T.a0, T.a1]]) wallQ("stripe", a0, T.b0 + 0.02, a1, T.b0 + 0.02, y0, y0 + 0.5, 1);
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
  // Aussenwand 0,3 m stark (Nicolas 2026-11-15: "sieht aus wie duennes Papier"): Innen- und Aussenflaeche, Stirnseiten an den Oeffnungen, Deck-/Unterflaechen
  const span = i => { i = (i + 72) % 72; const [am, bm] = P(rO + 0.35, (i + 0.5) / 72 * 2 * Math.PI), top = !(inStrip(am, bm) && bm > H.cb), bot = !(inStrip(am, bm) && bm < H.cb); return !top ? [L2, L1 - 0.3] : !bot ? [C2, C1] : [L2, C1]; };
  for (let i = 0; i < 72; i++) { const t0 = i / 72 * 2 * Math.PI, t1 = (i + 1) / 72 * 2 * Math.PI, [y0, y1] = span(i), r1 = rO + 0.2, r2 = rO + 0.5;
    const [a0, b0] = P(r1, t0), [a1, b1] = P(r1, t1), [c0, d0] = P(r2, t0), [c1, d1] = P(r2, t1);
    wallQ("conc", a0, b0, a1, b1, y0, y1); wallQ("conc", c0, d0, c1, d1, y0, y1);
    if (y1 < C1) quad("conc", [[a0, y1, b0], [a1, y1, b1], [c1, y1, d1], [c0, y1, d0]], [[0, 0], [1, 0], [1, 1], [0, 1]]); if (y0 > L2) quad("conc", [[a0, y0, b0], [a1, y0, b1], [c1, y0, d1], [c0, y0, d0]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const [n, a, b, c, d] of [[i - 1, a0, b0, c0, d0], [i + 1, a1, b1, c1, d1]]) { const sp = span(n); if (sp[0] !== y0 || sp[1] !== y1) wallQ("conc", a, b, c, d, y0, y1); }
    const [e0, f0] = P(rI - 0.2, t0), [e1, f1] = P(rI - 0.2, t1); wallQ("stripe", e0, f0, e1, f1, L2, L2 + 0.8, 1); wallQ("conc", e0, f0, e1, f1, L2 + 0.8, C1); }
  // Innenseite der Anschlussstreifen (Nicolas 2026-11-15: offen zum Schacht): TG1 Bruestung 1,1 m ueber dem Streifen (haengt bis unter die Platte),
  // TG2 3 m hohe Wand unter der Wendel (darueber faehrt die Rampe)
  { const aI = H.ca - rI + 0.25, L = Math.sqrt((rO + 0.2) ** 2 - (H.ca - aI) ** 2); WTU.bru = { aI, L };
    for (const k of [0, 1]) { const b0 = k ? H.cb : H.cb - L, b1 = k ? H.cb + L : H.cb, y0 = k ? L1 - 0.3 : L2, y1 = k ? L1 + 1.1 : L2 + 3;
      box("conc", aI - 0.15, aI + 0.15, b0, b1, y0, y1); wallQ("stripe", aI - 0.17, b0, aI - 0.17, b1, y0 + (k ? 0.3 : 0), y0 + (k ? 0.8 : 0.5), 1); } }
  // Kerngang (TG-Suedwand bis Kern) in beiden Ebenen, Tuer zum Wayne-Aufzug geschlossen (Task 7)
  for (const [y0, y1] of [[L1, C1], [L2, C2]]) { flat("floor", KG.a0, KG.a1, T.b1, K.b0, y0); quad("conc", [[KG.a0, y1, T.b1], [KG.a1, y1, T.b1], [KG.a1, y1, K.b0], [KG.a0, y1, K.b0]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    wallQ("conc", KG.a0, T.b1, KG.a0, K.b0, y0, y1); wallQ("conc", KG.a1, T.b1, KG.a1, K.b0, y0, y1); wallQ("conc", KG.a0, K.b0, KG.a1, K.b0, y0, y1);
    quad("lamp", [[-0.6, y1 - 0.06, -30], [0.6, y1 - 0.06, -30], [0.6, y1 - 0.06, -28], [-0.6, y1 - 0.06, -28]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
  // Zufahrt: ebener Tunnel auf TG1-Hoehe von der Nordwand bis an die untere Ringstrasse; Gehweg 1,5 m (Westseite, 15 cm), Schranke, Parkhaus-Schild
  { const e0 = Z.end[0], e1 = Z.end[1], eM = Math.min(e0, e1);
    const eX = Math.max(e0, e1); for (let b = T.b0; b > eX + 0.01; b -= 10) { const bb = Math.max(eX, b - 10); flat("floor", Z.a0 + 1.5, Z.a1, bb, b, L1); flat("conc", Z.a0, Z.a0 + 1.5, bb, b, L1 + 0.15); quad("conc", [[Z.a0, C1, bb], [Z.a1, C1, bb], [Z.a1, C1, b], [Z.a0, C1, b]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      quad("lamp", [[(Z.a0 + Z.a1) / 2 - 0.3, C1 - 0.06, b - 6], [(Z.a0 + Z.a1) / 2 + 0.3, C1 - 0.06, b - 6], [(Z.a0 + Z.a1) / 2 + 0.3, C1 - 0.06, b - 3], [(Z.a0 + Z.a1) / 2 - 0.3, C1 - 0.06, b - 3]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    if (eM < eX) { flat("floor", Z.a0 + 1.5, Z.a1, eM - 0.3, eX, L1 - 0.01); quad("conc", [[Z.a0, C1 + 0.01, eM - 0.3], [Z.a1, C1 + 0.01, eM - 0.3], [Z.a1, C1 + 0.01, eX], [Z.a0, C1 + 0.01, eX]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }   // Keil bis an die schraege Ringwand, knapp unter/ueber den Flaechen der Ringstrasse
    wallQ("conc", Z.a0, T.b0, Z.a0, e0, L1, C1); wallQ("conc", Z.a1, T.b0, Z.a1, e1, L1, C1); wallQ("conc", Z.a0 + 1.5, T.b0, Z.a0 + 1.5, eM, L1, L1 + 0.15); wallQ("conc", Z.a0, T.b0, Z.a0 + 1.5, T.b0, L1, L1 + 0.15);   // Stirnseite des Gehwegs an der Garage (man sah darunter durch)
    for (let b = T.b0 - 5; b > eM + 3; b -= 6) flat("line", (Z.a0 + 1.5 + Z.a1) / 2 - 0.08, (Z.a0 + 1.5 + Z.a1) / 2 + 0.08, b - 3, b, L1 + 0.02);   // Mittellinie gestrichelt
    // Schild ueber der Einfahrt (von der Ringstrasse lesbar) und Pfosten der Schranke
    const sb = Math.max(e0, e1) + 1.2; quad("sign", [[Z.a1 - 0.5, -2.6, sb], [Z.a0 + 0.5, -2.6, sb], [Z.a0 + 0.5, -1.2, sb], [Z.a1 - 0.5, -1.2, sb]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    quad("exit", [[Z.a0 + 0.5, -2.6, sb + 0.04], [Z.a1 - 0.5, -2.6, sb + 0.04], [Z.a1 - 0.5, -1.2, sb + 0.04], [Z.a0 + 0.5, -1.2, sb + 0.04]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
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
    const g = (L2 - L1) / (2 * Math.PI * H.R), e = g * (ds / 2 + 0.05);   // geneigte Oberseite (dkAdd g): glatt statt Stufen
    wtPartR(a, b, -Math.sin(th), Math.cos(th), ds / 2 + 0.05, H.w / 2, y - 0.3 - Math.abs(e), y + Math.abs(e), { chain: 1, m: 0.05, g }).top = WTO.Y + y; }   // Oberseite in der Mitte = y
  for (let i = 0; i < 72; i++) { const th = (i + 0.5) / 72 * 2 * Math.PI, [a, b] = P(rO + 0.2, th), ds = (rO + 0.2) * 2 * Math.PI / 72, da = -Math.sin(th), db = Math.cos(th);
    const top = !(inStrip(a, b) && b > H.cb), bot = !(inStrip(a, b) && b < H.cb);
    if (!top) wtPartR(a, b, da, db, ds / 2, 0.15, L2, L1 - 0.3, { floor: 0 }); else if (!bot) wtPartR(a, b, da, db, ds / 2, 0.15, C2, C1, { floor: 0 }); else wtPartR(a, b, da, db, ds / 2, 0.15, L2, C1, { floor: 0 });
    const [c, d] = P(rI - 0.2, th); wtPartR(c, d, da, db, (rI - 0.2) * Math.PI / 72, 0.15, L2, C1, { floor: 0 }); }
  { const { aI, L } = WTU.bru; wtPartU(aI - 0.15, aI + 0.15, H.cb, H.cb + L, L1 - 0.3, L1 + 1.1, { floor: 0 }); wtPartU(aI - 0.15, aI + 0.15, H.cb - L, H.cb, L2, L2 + 3, { floor: 0 }); }
  // Zufahrt: Boden, Gehweg, Waende, Decke
  { const e0 = Z.end[0], e1 = Z.end[1], eM = Math.min(e0, e1);
    for (let b = T.b0 + 0.5; b > eM - 1.5; b -= 10) { const bb = Math.max(eM - 2, b - 10); wtPartU(Z.a0 + 1.5, Z.a1, bb, b, L1 - 0.5, L1, { chain: 1, m: 0.05 }); wtPartU(Z.a0, Z.a0 + 1.5, bb, b, L1 - 0.5, L1 + 0.15, { chain: 1, m: 0.05 }); }
    wtPartU(Z.a0 - 0.15, Z.a0 + 0.15, e0, T.b0, L1, C1); wtPartU(Z.a1 - 0.15, Z.a1 + 0.15, e1, T.b0, L1, C1); }
  GR_NOSKIRT.push(WTO.poly(T.a0 - 4, T.a1 + 4, T.b0 - 4, T.b1 + 4), WTO.poly(Z.a0 - 4, Z.a1 + 4, Math.min(...Z.end) - 4, T.b0), WTO.poly(-40, 40, -40, 40));   // Tiefgaragen, Zufahrt, unter dem Turm
  GR_HOLES.push(WTO.poly(Z.a0 - 3, Z.a1 + 3, Math.min(...Z.end) - 1, Math.max(...Z.end) + 8));   // 3 m breiter: 4-m-Dreiecke daneben ragten sonst in den Tunnel   // Gelaende am Tunnelmund (gotham-raster.js)
  for (const r of [{ poly: WTO.poly(T.a0, T.a1, T.b0, T.b1), y0: L2 - 0.2, y1: C1 }, { poly: WTO.poly(KG.a0, KG.a1, T.b1 - 1, K.b0), y0: L2 - 0.2, y1: C1 },
    { poly: WTO.poly(Z.a0, Z.a1, Math.min(...Z.end) - 3, T.b0 + 1), y0: L1 - 0.2, y1: C1 }]) dkRoom({ poly: r.poly, y0: WTO.Y + r.y0, y1: WTO.Y + r.y1 });
  bautAdd({ id: "GO-WAYNE-TG1", name: "Tiefgarage 1 (Wayne Tower)", art: "Parkhaus", poly: WTO.poly(T.a0, T.a1, T.b0, T.b1), y0: WTO.Y + L1 - 0.3, y1: WTO.Y + C1, info: "öffentlich" });
  bautAdd({ id: "GO-WAYNE-TG2", name: "Tiefgarage 2 (Wayne Tower)", art: "Parkhaus", poly: WTO.poly(T.a0, T.a1, T.b0, T.b1), y0: WTO.Y + L2 - 0.3, y1: WTO.Y + C2, info: "öffentlich" });
  bautAdd({ id: "GO-WAYNE-ZUFAHRT", name: "Zufahrt Parkhaus Wayne Tower", art: "Tunnel", poly: WTO.poly(Z.a0, Z.a1, Math.min(...Z.end), T.b0), y0: WTO.Y + L1 - 0.3, y1: WTO.Y + C1 });
}
// ---------- Geheimer Stock und Gang (Task 6; Nicolas: weite niedrige Halle, runde Pfeiler, runde Deckenleuchten, graue Waende, glaenzender Boden,
// Vorbild karten/planung/wayne-geheimstock-vorbild.png; Tumbler, Prototypen, Gadgets erst am Schluss) ----------
{
  const Hl = WTO.halle, Gg = WTO.gang, K = WTO.kern, D = WTO.kernTuer, aE = Math.max(...Gg.end), aE0 = Math.min(...Gg.end);
  const gy = a => Hl.y0 + (WTO.lv.tg1 - Hl.y0) * Math.max(0, Math.min(1, (a - Hl.a1) / (aE0 - Hl.a1)));   // Gangboden: -11 an der Halle (2 Tiefgaragen hoch), -5,5 an der Ringwand
  const M2 = o => new THREE.MeshStandardMaterial(Object.assign({ side: THREE.DoubleSide }, o));
  const wallT = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#8e9094"; c.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = 128 + Math.random() * 30; c.fillStyle = `rgba(${v},${v + 1},${v + 4},0.5)`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    c.fillStyle = "rgba(0,0,0,0.15)"; c.fillRect(0, 0, w, 1); c.fillRect(0, 0, 1, h); }); wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping;
  // Design (Nicolas 2026-11-16: "zu einfarbig"): dunkler polierter Boden mit leuchtendem Linienraster, unten dunkle Wandpaneele mit Lichtband, Pfeiler mit Sockel und Leuchtring,
  // Deckentraeger, Drehscheibe mit Leuchtrand fuer den Tumbler, goldenes W an der Suedwand
  const floorT = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#1c1f24"; c.fillRect(0, 0, w, h); for (let i = 0; i < 600; i++) { c.fillStyle = "rgba(255,255,255,0.03)"; c.fillRect(Math.random() * w, Math.random() * h, 3, 3); } c.fillStyle = "#2fd3ff"; c.fillRect(0, 0, w, 3); c.fillRect(0, 0, 3, h); c.fillStyle = "rgba(47,211,255,0.25)"; c.fillRect(0, 3, w, 3); c.fillRect(3, 0, 3, h); }); floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping;
  const W_T = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#14161a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#d6a640"; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = "#d6a640"; c.beginPath(); const P = [[40, 70], [80, 70], [104, 160], [128, 95], [152, 160], [176, 70], [216, 70], [172, 200], [140, 200], [128, 160], [116, 200], [84, 200]]; P.forEach(([x, y], i) => c[i ? "lineTo" : "moveTo"](x, y)); c.closePath(); c.fill(); });
  const mats = { wall: M2({ map: wallT, roughness: 0.8, emissive: 0x6c6e72, emissiveIntensity: 0.3 }), floor: M2({ map: floorT, roughness: 0.15, metalness: 0.3, emissive: 0xffffff, emissiveMap: floorT, emissiveIntensity: 0.45 }),
    panel: M2({ color: 0x26292f, roughness: 0.4, metalness: 0.4, emissive: 0x101216, emissiveIntensity: 1 }), led: M2({ color: 0x2fd3ff, emissive: 0x2fd3ff, emissiveIntensity: 1.6 }), beam: M2({ color: 0x2c2f35, roughness: 0.5, metalness: 0.5, emissive: 0x121418, emissiveIntensity: 1 }),
    logo: M2({ map: W_T, emissive: 0xffffff, emissiveMap: W_T, emissiveIntensity: 0.6, side: THREE.FrontSide }), disc: M2({ color: 0x15171b, roughness: 0.25, metalness: 0.6, emissive: 0x0a0b0d, emissiveIntensity: 1 }),
    ceil: M2({ color: 0x9c9ea2, roughness: 0.9, emissive: 0x8a8c90, emissiveIntensity: 0.4 }), light: M2({ color: 0xffffff, emissive: 0xf4f8ff, emissiveIntensity: 1.4 }),
    pillar: M2({ color: 0xa4a6aa, roughness: 0.5, emissive: 0x5a5c60, emissiveIntensity: 0.35 }), metal: WTU.mats.metal, road: WTU.mats.floor, conc: WTU.mats.conc, lamp: WTU.mats.lamp, line: WTU.mats.line };
  const G = {}; for (const k of Object.keys(mats)) G[k] = { P: [], U: [], I: [] };
  const quad = (k, p, uv) => { const g = G[k], n = g.P.length / 3; for (const q of p) g.P.push(...q); for (const t of uv) g.U.push(...t); g.I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  const flat = (k, a0, a1, b0, b1, y, sc = 4) => quad(k, [[a0, y, b1], [a1, y, b1], [a1, y, b0], [a0, y, b0]], [[a0 / sc, b1 / sc], [a1 / sc, b1 / sc], [a1 / sc, b0 / sc], [a0 / sc, b0 / sc]]);
  const wallQ = (k, a0, b0, a1, b1, y0, y1, sc = 3) => { const L = Math.hypot(a1 - a0, b1 - b0); quad(k, [[a0, y0, b0], [a1, y0, b1], [a1, y1, b1], [a0, y1, b0]], [[0, y0 / sc], [L / sc, y0 / sc], [L / sc, y1 / sc], [0, y1 / sc]]); };
  // Halle: Boden, Decke, Waende (Nord mit Kern-Tuer, Ost mit Gang)
  flat("floor", Hl.a0, Hl.a1, Hl.b0, Hl.b1, Hl.y0, 6); quad("ceil", [[Hl.a0, Hl.y1, Hl.b0], [Hl.a1, Hl.y1, Hl.b0], [Hl.a1, Hl.y1, Hl.b1], [Hl.a0, Hl.y1, Hl.b1]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  wallQ("wall", Hl.a0, Hl.b0, -D.w / 2, Hl.b0, Hl.y0, Hl.y1); wallQ("wall", D.w / 2, Hl.b0, Hl.a1, Hl.b0, Hl.y0, Hl.y1); wallQ("wall", -D.w / 2, Hl.b0, D.w / 2, Hl.b0, Hl.y0 + D.h, Hl.y1);
  wallQ("wall", Hl.a0, Hl.b1, Hl.a1, Hl.b1, Hl.y0, Hl.y1); wallQ("wall", Hl.a0, Hl.b0, Hl.a0, Hl.b1, Hl.y0, Hl.y1);
  wallQ("wall", Hl.a1, Hl.b0, Hl.a1, Gg.b0, Hl.y0, Hl.y1); wallQ("wall", Hl.a1, Gg.b1, Hl.a1, Hl.b1, Hl.y0, Hl.y1); wallQ("wall", Hl.a1, Gg.b0, Hl.a1, Gg.b1, Hl.y0 + 4.5, Hl.y1);
  // runde Pfeiler (frei bleiben Kern-Tuer und der Weg zum Gang) und runde Deckenleuchten
  const pillars = []; for (const a of [-27, -18, -9, 0, 9, 18, 27]) for (const b of [-6, 3, 12, 21, 30]) if (!(a >= 18 && b >= 12 && b <= 30) && !(Math.abs(a) < 3 && b < -3)) pillars.push([a, b]);
  const pg = pillars.map(([a, b]) => new THREE.CylinderGeometry(0.55, 0.55, Hl.y1 - Hl.y0, 20).translate(a, (Hl.y0 + Hl.y1) / 2, b));
  for (const a of [-22.5, -13.5, -4.5, 4.5, 13.5, 22.5]) for (const b of [-1.5, 7.5, 16.5, 25.5]) { const n = 16, k0 = G.light.P.length / 3; G.light.P.push(a, Hl.y1 - 0.04, b); G.light.U.push(0.5, 0.5);
    for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2; G.light.P.push(a + Math.cos(t) * 0.8, Hl.y1 - 0.04, b + Math.sin(t) * 0.8); G.light.U.push(0, 0); if (i) G.light.I.push(k0, k0 + i, k0 + i + 1); } }
  // Design: Wandpaneele (unten 3,5 m) mit Lichtband darueber und oben, Deckentraeger, Pfeiler-Sockel und Leuchtringe, Drehscheibe, W-Logo
  { const band = (k, a0, b0, a1, b1, da, db, y0, y1) => quad(k, [[a0 + da * 0.04, y0, b0 + db * 0.04], [a1 + da * 0.04, y0, b1 + db * 0.04], [a1 + da * 0.04, y1, b1 + db * 0.04], [a0 + da * 0.04, y1, b0 + db * 0.04]], [[0, 0], [Math.hypot(a1 - a0, b1 - b0) / 3, 0], [Math.hypot(a1 - a0, b1 - b0) / 3, 1], [0, 1]]);
    const W4 = [[Hl.a0, Hl.b0, -D.w / 2, Hl.b0, 0, 1], [D.w / 2, Hl.b0, Hl.a1, Hl.b0, 0, 1], [Hl.a0, Hl.b1, Hl.a1, Hl.b1, 0, -1], [Hl.a0, Hl.b0, Hl.a0, Hl.b1, 1, 0], [Hl.a1, Hl.b0, Hl.a1, Gg.b0, -1, 0], [Hl.a1, Gg.b1, Hl.a1, Hl.b1, -1, 0]];
    for (const [a0, b0, a1, b1, da, db] of W4) { band("panel", a0, b0, a1, b1, da, db, Hl.y0, Hl.y0 + 3.5); band("led", a0, b0, a1, b1, da * 1.5, db * 1.5, Hl.y0 + 3.5, Hl.y0 + 3.62); band("led", a0, b0, a1, b1, da * 1.5, db * 1.5, Hl.y1 - 0.9, Hl.y1 - 0.82); }
    for (let a = Hl.a0 + 4.5; a < Hl.a1; a += 9) for (const [b0, b1] of [[Hl.b0, Hl.b1]]) { quad("beam", [[a - 0.4, Hl.y1 - 0.7, b0], [a + 0.4, Hl.y1 - 0.7, b0], [a + 0.4, Hl.y1 - 0.7, b1], [a - 0.4, Hl.y1 - 0.7, b1]], [[0, 0], [1, 0], [1, 1], [0, 1]]); for (const s of [-0.4, 0.4]) quad("beam", [[a + s, Hl.y1 - 0.7, b0], [a + s, Hl.y1, b0], [a + s, Hl.y1, b1], [a + s, Hl.y1 - 0.7, b1]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    const n = 48, cx = 0, cz = 12, R = 6.5;   // Drehscheibe (Platz fuer den Tumbler), Leuchtrand
    for (let i = 0; i < n; i++) { const t0 = i / n * Math.PI * 2, t1 = (i + 1) / n * Math.PI * 2, P = (t, r, y) => [cx + Math.cos(t) * r, y, cz + Math.sin(t) * r];
      quad("disc", [P(t0, 0.01, Hl.y0 + 0.03), P(t0, R, Hl.y0 + 0.03), P(t1, R, Hl.y0 + 0.03), P(t1, 0.01, Hl.y0 + 0.03)], [[0, 0], [1, 0], [1, 1], [0, 1]]); quad("led", [P(t0, R, Hl.y0 + 0.04), P(t0, R + 0.25, Hl.y0 + 0.04), P(t1, R + 0.25, Hl.y0 + 0.04), P(t1, R, Hl.y0 + 0.04)], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    quad("logo", [[-5, Hl.y0 + 4.5, Hl.b1 - 0.06], [5, Hl.y0 + 4.5, Hl.b1 - 0.06], [5, Hl.y0 + 9.5, Hl.b1 - 0.06], [-5, Hl.y0 + 9.5, Hl.b1 - 0.06]], [[1, 0], [0, 0], [0, 1], [1, 1]]); }
  const pg2 = pillars.map(([a, b]) => new THREE.CylinderGeometry(0.7, 0.75, 1.6, 20).translate(a, Hl.y0 + 0.8, b)), pg3 = pillars.map(([a, b]) => new THREE.CylinderGeometry(0.58, 0.58, 0.12, 20).translate(a, Hl.y0 + 3.56, b));
  // Gang: Boden (steigt), Decke, Waende, Lampen; endet an der Ringwand
  for (let a = Hl.a1; a < aE0 - 0.01; a += 4) { const a1 = Math.min(aE0, a + 4), y0 = gy(a), y1 = gy(a1);   // bis an die Ringwand (darueber hinaus flimmerten Boden und Decke mit denen der Ringstrasse)
    quad("road", [[a, y0, Gg.b1], [a1, y1, Gg.b1], [a1, y1, Gg.b0], [a, y0, Gg.b0]], [[a / 4, Gg.b1 / 4], [a1 / 4, Gg.b1 / 4], [a1 / 4, Gg.b0 / 4], [a / 4, Gg.b0 / 4]]);
    quad("conc", [[a, y0 + 4.5, Gg.b0], [a1, y1 + 4.5, Gg.b0], [a1, y1 + 4.5, Gg.b1], [a, y0 + 4.5, Gg.b1]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const b of [Gg.b0, Gg.b1]) quad("conc", [[a, y0, b], [a1, y1, b], [a1, y1 + 4.5, b], [a, y0 + 4.5, b]], [[a / 3, y0 / 3], [a1 / 3, y1 / 3], [a1 / 3, (y1 + 4.5) / 3], [a / 3, (y0 + 4.5) / 3]]);
    if (Math.round(a) % 12 === 2) quad("lamp", [[a, y0 + 4.44, 19.7], [a + 3, y1 + 4.44, 19.7], [a + 3, y1 + 4.44, 20.3], [a, y0 + 4.44, 20.3]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
  for (const [b, e] of [[Gg.b0, Gg.end[0]], [Gg.b1, Gg.end[1]]]) if (e > aE0) { const y = gy(aE0); quad("conc", [[aE0, y, b], [e, y, b], [e, y + 4.5, b], [aE0, y + 4.5, b]], [[aE0 / 3, y / 3], [e / 3, y / 3], [e / 3, (y + 4.5) / 3], [aE0 / 3, (y + 4.5) / 3]]); }   // Seitenwand bis an die eigene Ringwand (Review: Keil offen)
  if (aE > aE0) { const y = gy(aE0); quad("road", [[aE0, y - 0.01, Gg.b1], [aE + 0.3, y - 0.01, Gg.b1], [aE + 0.3, y - 0.01, Gg.b0], [aE0, y - 0.01, Gg.b0]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    quad("conc", [[aE0, y + 4.51, Gg.b0], [aE + 0.3, y + 4.51, Gg.b0], [aE + 0.3, y + 4.51, Gg.b1], [aE0, y + 4.51, Gg.b1]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }   // Keil bis an die schraege Ringwand
  const grp = new THREE.Group(); grp.name = "Wayne Tower geheim"; grp.position.set(WTO.cx, WTO.Y, WTO.cz); grp.rotation.y = WTO.rot;
  for (const [k, g] of Object.entries(G)) { if (!g.I.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(g.P, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(g.U, 2)); geo.setIndex(g.I); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mats[k]); m.name = "Wayne Tower geheim " + k; m.userData.keep = true; m.userData.noLift = true; grp.add(m); }
  { const m = new THREE.Mesh(mergeGeometries(pg, false), mats.pillar); m.name = "Wayne Tower geheim Pfeiler"; m.userData.keep = true; m.userData.noLift = true; grp.add(m); }
  for (const [geos, mk, nm] of [[pg2, "panel", "Sockel"], [pg3, "led", "Leuchtringe"]]) { const m = new THREE.Mesh(mergeGeometries(geos, false), mats[mk]); m.name = "Wayne Tower geheim " + nm; m.userData.keep = true; m.userData.noLift = true; grp.add(m); }
  grp.userData.keep = true; grp.userData.noLift = true; grp.userData.dynamic = true; scene.add(grp); WTU.geheim = grp;
  // Wandplatte: in der Wand der unteren Ringstrasse, gleiche Waende-Textur (Material der Strasse, u = s / 3, v = y / 3), faehrt in 2 s nach unten in den Boden
  // (nach oben ginge sie durch die Deckplatte auf Strassenhoehe)
  { const gap = Gg.end.gap, R = GDECK.roads.find(o => o.id === "ring"), LY = GDECK.LY, DY = GDECK.DY;
    const at = s => { let j = 1; while (j < R.pts.length - 1 && R.s[j] < s) j++; const p = R.pts[j - 1], q = R.pts[j], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, t = (s - R.s[j - 1]) / l, nx = -(q[1] - p[1]) / l, nz = (q[0] - p[0]) / l, d = gap.side * (R.HW - 0.02);
      return [p[0] + (q[0] - p[0]) * t + nx * d, p[1] + (q[1] - p[1]) * t + nz * d]; };
    const wm = (GDECK.meshes || []).find(g => g && g.name === "Gotham-Untere Strasse Waende"), mat = wm && wm.children[0] ? wm.children[0].material : mats.wall;
    const A = at(gap.s0 - 0.3), Bp = at(gap.s1 + 0.3), y0 = LY - 0.6, y1 = DY, geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([A[0], y0, A[1], Bp[0], y0, Bp[1], Bp[0], y1, Bp[1], A[0], y1, A[1]], 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([(gap.s0 - 0.3) / 3, y0 / 3, (gap.s1 + 0.3) / 3, y0 / 3, (gap.s1 + 0.3) / 3, y1 / 3, (gap.s0 - 0.3) / 3, y1 / 3], 2)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.name = "Wayne Tower Wandplatte"; m.userData.dynamic = true; m.userData.keep = true; m.userData.noLift = true; scene.add(m);
    const mx = (A[0] + Bp[0]) / 2, mz = (A[1] + Bp[1]) / 2, L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
    const part = dkAdd({ cx: mx, cy: (y0 + y1) / 2, cz: mz, ux: (Bp[0] - A[0]) / L, uz: (Bp[1] - A[1]) / L, hl: L / 2, hw: 0.15, hh: (y1 - y0) / 2, floor: 0 }); WTU.parts.push(part);
    WTU.platte = { m, part, x: mx, z: mz, open: 0, want: 0, h: y1 - y0 + 0.2 }; }
  // Kollision, Hohlraeume, Register
  wtPartU(Hl.a0, Hl.a1, Hl.b0, Hl.b1, Hl.y0 - 0.5, Hl.y0, { chain: 1, m: 0.05 });
  wtPartU(Hl.a0, -D.w / 2, Hl.b0 - 0.15, Hl.b0 + 0.15, Hl.y0, Hl.y1); wtPartU(D.w / 2, Hl.a1, Hl.b0 - 0.15, Hl.b0 + 0.15, Hl.y0, Hl.y1); wtPartU(-D.w / 2, D.w / 2, Hl.b0 - 0.15, Hl.b0 + 0.15, Hl.y0 + D.h, Hl.y1);
  wtPartU(Hl.a0, Hl.a1, Hl.b1 - 0.15, Hl.b1 + 0.15, Hl.y0, Hl.y1); wtPartU(Hl.a0 - 0.15, Hl.a0 + 0.15, Hl.b0, Hl.b1, Hl.y0, Hl.y1);
  wtPartU(Hl.a1 - 0.15, Hl.a1 + 0.15, Hl.b0, Gg.b0, Hl.y0, Hl.y1); wtPartU(Hl.a1 - 0.15, Hl.a1 + 0.15, Gg.b1, Hl.b1, Hl.y0, Hl.y1);
  WTU.kernTuer.geheim = wtPartU(-D.w / 2, D.w / 2, Hl.b0 - 0.15, Hl.b0 + 0.05, Hl.y0, Hl.y0 + D.h);
  for (const [a, b] of pillars) wtPartU(a - 0.55, a + 0.55, b - 0.55, b + 0.55, Hl.y0, Hl.y1);
  for (let a = Hl.a1 - 0.5; a < aE + 1; a += 5) { const a1 = Math.min(aE + 1.5, a + 5); wtPartU(a, a1, Gg.b0, Gg.b1, gy((a + a1) / 2) - 0.5, gy((a + a1) / 2), { chain: 1, m: 0.05 }); }
  for (const [b, e] of [[Gg.b0, Gg.end[0]], [Gg.b1, Gg.end[1]]]) for (let a = Hl.a1; a < e; a += 20) { const a1 = Math.min(e, a + 20); if (a1 > a) wtPartU(a, a1, b - 0.15, b + 0.15, gy(a), gy(a1) + 4.5); }
  dkRoom({ poly: WTO.poly(Hl.a0, Hl.a1, Hl.b0, Hl.b1), y0: WTO.Y + Hl.y0 - 0.2, y1: WTO.Y + Hl.y1 });
  for (let a = Hl.a1 - 1; a < aE + 3; a += 20) { const a1 = Math.min(aE + 3, a + 20); dkRoom({ poly: WTO.poly(a, a1, Gg.b0, Gg.b1), y0: WTO.Y + gy(a) - 0.2, y1: WTO.Y + gy(a) + 4.4 }); }   // Scheiben unter der steigenden Decke (Review: Kamera kam bis 2,6 m ueber die Decke)
  GR_NOSKIRT.push(WTO.poly(Hl.a1, aE + 4, Gg.b0 - 4, Gg.b1 + 4)); GR_HOLES.push(WTO.poly(aE0 - 8, aE + 1, Gg.b0 - 3, Gg.b1 + 3));
  bautAdd({ id: "GO-WAYNE-GEHEIM", name: "Geheimer Wayne-Stock", art: "Geheim", poly: WTO.poly(Hl.a0, Hl.a1, Hl.b0, Hl.b1), y0: WTO.Y + Hl.y0 - 0.3, y1: WTO.Y + Hl.y1 });
  bautAdd({ id: "GO-WAYNE-GANG", name: "Geheimgang Wayne Tower", art: "Geheim", poly: WTO.poly(Hl.a1, aE, Gg.b0, Gg.b1), y0: WTO.Y + Hl.y0 - 0.3, y1: WTO.Y + WTO.lv.tg1 + 4.5 });
}
// Wandplatte: L im Fahrzeug hoechstens 15 m davor (beide Seiten) oeffnet bzw. schliesst sie
function wtPlatteNah() { const P = WTU.platte; if (!P || typeof CAR === "undefined" || !CAR || !CAR.on) return false; return Math.hypot(CAR.x - P.x, CAR.z - P.z) < 15 && Math.abs(CAR.y - GDECK.LY) < 4; }
function wtPlatteToggle() { const P = WTU.platte; P.want = P.want ? 0 : 1; toast(P.want ? "Wandplatte öffnet" : "Wandplatte schließt"); }
function wtPlatteStep(dtIn) {
  const P = WTU.platte; if (!P) return; const now = performance.now() / 1000, dt = dtIn ?? Math.min(0.1, now - (P.t || now)); P.t = now;
  if (P.open === P.want) return; P.open = P.want > P.open ? Math.min(1, P.open + dt / 2) : Math.max(0, P.open - dt / 2);
  P.m.position.y = -P.open * P.h; P.part.on = P.open < 0.7;
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
