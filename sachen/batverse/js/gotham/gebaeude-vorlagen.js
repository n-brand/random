// Batverse – Gotham: Gebaeude-Vorlagen (G3/G4, Nicolas 2026-11-15; Design docs/superpowers/specs/2026-11-15-gotham-gebaeude-design.md)
// Klassisches Skript, auch in der Werkstatt geladen (braucht nur THREE, canvasTex aus kern/basis.js). Keine eigenen Texturen je Gebaeude:
// gemeinsame Materialien (GBV.mats), Geometrie als Eimer je Material (Map key -> { p, n, uv, c }) in Spielkoordinaten.
// Lage: Ecke P0, Achsen e1 (Laenge L1) und e2 (Laenge L2) in x/z, Boden y. Seiten k (wie gbstSides): 0 t=0 (aussen -e2), 1 s=L1 (+e1), 2 t=L2 (+e2), 3 s=0 (-e1).
// Vorlagen: kratzer (Glas/Stein, Ruecksprung), buero, laden (Laden mit Wohnung), miet (Mietshaus mit Feuertreppe), fabrik, lager. Regel Gotham: Geschoss 4,7 m.
"use strict";
const GBV = { TYPES: ["kratzer", "buero", "laden", "miet", "fabrik", "lager"], GH: 4.7, mats: null,
  NAMES: { kratzer: "Wolkenkratzer", buero: "Bürohaus", laden: "Laden mit Wohnung", miet: "Mietshaus", fabrik: "Fabrik", lager: "Lagerhalle" },
  SIGNS: ["DELI", "LAUNDROMAT", "PAWN SHOP", "PHARMACY", "PIZZA", "LIQUOR", "BARBER", "DINER"], FACADE: ["ziegel", "stein", "glas", "fabrik", "laden"],
  night(k) { if (!GBV.mats) return; for (const key of GBV.FACADE) GBV.mats[key].emissiveIntensity = k * (key === "glas" ? 0.9 : 1.15); GBV.mats.schild.emissiveIntensity = 0.1 + k * 0.7; } };
// fester Zufall aus der ID (wie gbstRand)
function gbvRand(id) { let s = (+String(id).replace(/\D/g, "") || 1) * 2654435761 + 7; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// Vorlagenwahl (Spec-Tabelle): Fabrik/Lager nur in Fabrikviertel und Narrows, gross und niedrig; Kratzer hoch und reich; Buero mittel und wohlhabend; Laden klein und niedrig
function gbvPick({ h, area, wohl, bezirk, id }) {
  const r = gbvRand(id), ind = /^(Fabrik|The Narrows)/.test(bezirk || ""), GH = GBV.GH;
  let type = "miet";
  if (ind && area >= 900 && h <= 20) type = r() < 0.5 ? "fabrik" : "lager";
  else if (h >= 60 && wohl >= 0.7) type = "kratzer";
  else if (wohl >= 0.55 && h >= 18) type = "buero";
  else if (h <= 14 && area <= 400) type = "laden";
  if (type === "fabrik" || type === "lager") { const H = Math.max(6, Math.min(12, h)); return { type, N: 1, H, glas: false }; }
  let N = Math.max(1, Math.round(h / GH)); if (type === "laden") N = Math.min(N, 3);
  return { type, N, H: N * GH, glas: type === "kratzer" && r() < 0.6 };
}

// ---------- Materialien (einmalig) ----------
function gbvInit() {
  if (GBV.mats) return GBV.mats;
  const PX = 48, TW = 3 * PX, TH = Math.round(4.7 * PX), rr = rng(9137);
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); return `rgb(${Math.min(255, ((n >> 16) & 255) * k) | 0},${Math.min(255, ((n >> 8) & 255) * k) | 0},${Math.min(255, (n & 255) * k) | 0})`; };
  const brick = (c, w, h, col) => { c.fillStyle = "#b5a794"; c.fillRect(0, 0, w, h); for (let y = 0, r = 0; y < h; y += 5, r++) for (let x = -(r % 2) * 6; x < w; x += 13) { c.fillStyle = shade(col, 0.85 + rr() * 0.3); c.fillRect(x, y, 12, 4); } };
  // Leuchtkachel: 8 x 4 Fensterachsen, Fenster zufaellig hell (Lage der Fenster je Kachel wie in der Fassade)
  const glow = (win, p = 0.35) => { const t = canvasTex(TW * 8, TH * 4, (c, w, h) => { c.fillStyle = "#000"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) for (const [x, y, ww, wh] of win) if (rr() < p) { c.fillStyle = rr() < 0.5 ? "#ffd89a" : "#fff1c8"; c.fillRect(i * TW + x + 3, j * TH + y + 3, ww - 6, wh - 6); } }); t.repeat.set(1 / 8, 1 / 4); return t; };
  const tile = (draw) => canvasTex(TW, TH, draw);
  // Ziegel mit Schiebefenstern (1,5 x 2,8 m), Sturz und Bank
  const WZ = [[(TW - 1.5 * PX) / 2, TH - 1.0 * PX - 2.8 * PX, 1.5 * PX, 2.8 * PX]];
  const ziegel = tile((c, w, h) => { brick(c, w, h, "#8a4632"); const [x, y, ww, wh] = WZ[0]; c.fillStyle = "#d9d2c4"; c.fillRect(x - 6, y - 10, ww + 12, 10); c.fillRect(x - 4, y + wh, ww + 8, 6);
    const g = c.createLinearGradient(0, y, 0, y + wh); g.addColorStop(0, "#22303d"); g.addColorStop(1, "#3c4d5c"); c.fillStyle = "#e9e6df"; c.fillRect(x, y, ww, wh); c.fillStyle = g; c.fillRect(x + 4, y + 4, ww - 8, wh / 2 - 6); c.fillRect(x + 4, y + wh / 2 + 2, ww - 8, wh / 2 - 6);
    c.fillStyle = "#cfc6b4"; c.fillRect(0, h - 4, w, 4); });   // Geschossband
  // Stein-Buero: Fensterband ueber die ganze Achse, Pfeiler
  const WS = [[0.35 * PX, 0.9 * PX, TW - 0.7 * PX, 2.6 * PX]];
  const stein = tile((c, w, h) => { c.fillStyle = "#b9b3a6"; c.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(0,0,0,${rr() * 0.06})`; c.fillRect(rr() * w, rr() * h, 3, 3); }
    const [x, y, ww, wh] = WS[0], g = c.createLinearGradient(0, y, 0, y + wh); g.addColorStop(0, "#1c2833"); g.addColorStop(1, "#40525f"); c.fillStyle = g; c.fillRect(x, y, ww, wh);
    c.fillStyle = "#8d877b"; c.fillRect(x + ww / 2 - 2, y, 4, wh); c.fillStyle = "#d6d0c3"; c.fillRect(0, h - 6, w, 6); });
  // Glas-Vorhang: Scheiben mit Sprossen, Spiegelung
  const WG = [[3, 3, TW / 2 - 6, TH - 0.8 * PX - 6], [TW / 2 + 3, 3, TW / 2 - 6, TH - 0.8 * PX - 6]];
  const glas = tile((c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#2d4a63"); g.addColorStop(0.5, "#5f86a3"); g.addColorStop(1, "#22384c"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#1a242c"; c.fillRect(0, 0, 3, h); c.fillRect(w / 2 - 1, 0, 3, h); c.fillRect(0, h - 0.8 * PX, w, 0.8 * PX); c.fillStyle = "#9fb3c2"; c.fillRect(0, h - 0.8 * PX, w, 2); });
  // Fabrik: Backstein mit grossem Sprossenfenster (eine Halle hoch: v = 1 ueber die Hallenhoehe)
  const WF = [[0.5 * PX, 0.25 * TH, TW - PX, 0.55 * TH]];
  const fabrik = tile((c, w, h) => { brick(c, w, h, "#7a4030"); const [x, y, ww, wh] = WF[0]; c.fillStyle = "#3b4146"; c.fillRect(x, y, ww, wh); c.fillStyle = "#8fa0a8";
    for (let i = 1; i < 4; i++) c.fillRect(x + ww * i / 4 - 1, y, 2, wh); for (let j = 1; j < 5; j++) c.fillRect(x, y + wh * j / 5 - 1, ww, 2); c.fillStyle = "#c9c1b0"; c.fillRect(x - 4, y - 8, ww + 8, 8); });
  const blech = tile((c, w, h) => { for (let x = 0; x < w; x += 6) { c.fillStyle = x % 12 ? "#7f8a8f" : "#6a757a"; c.fillRect(x, 0, 6, h); } for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(110,70,40,${rr() * 0.25})`; c.fillRect(rr() * w, rr() * h, 2, 8 + rr() * 30); } });
  const brand = tile((c, w, h) => brick(c, w, h, "#7d4433"));
  // Erdgeschoss mit Laden: Schaufenster und Kranz
  const WL = [[0.25 * PX, 0.5 * PX, TW - 0.5 * PX, 3.0 * PX]];
  const laden = tile((c, w, h) => { brick(c, w, h, "#6e3a2c"); const [x, y, ww, wh] = [WL[0][0], h - WL[0][1] - WL[0][3], WL[0][2], WL[0][3]];
    c.fillStyle = "#1e2226"; c.fillRect(x - 3, y - 3, ww + 6, wh + 6); const g = c.createLinearGradient(0, y, 0, y + wh); g.addColorStop(0, "#28343e"); g.addColorStop(1, "#4b5a63"); c.fillStyle = g; c.fillRect(x, y, ww, wh);
    c.fillStyle = "#d2cbbd"; c.fillRect(0, y - 0.6 * PX, w, 0.5 * PX); c.fillStyle = "#cfc6b4"; c.fillRect(0, h - 0.3 * PX, w, 0.3 * PX); });
  const WLg = [[WL[0][0], TH - WL[0][1] - WL[0][3], WL[0][2], WL[0][3]]];
  const dach = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#4a4c4f"; c.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { c.fillStyle = `rgba(${rr() < 0.5 ? "0,0,0" : "200,200,200"},${rr() * 0.12})`; c.fillRect(rr() * w, rr() * h, 2, 2); } });
  const schild = canvasTex(512, 512, (c, w, h) => { GBV.SIGNS.forEach((s, i) => { const y = i * 64; c.fillStyle = ["#15171a", "#1d2a3a", "#2a1a1a", "#1a2a1e"][i % 4]; c.fillRect(0, y, w, 64);
    c.fillStyle = "#f2e6c8"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "bold 40px Arial, sans-serif"; c.fillText(s, w / 2, y + 34); c.fillStyle = "#c9a54a"; c.fillRect(0, y, w, 3); c.fillRect(0, y + 61, w, 3); }); });
  schild.repeat.set(1, 1);
  const S = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.85, ...o });
  const F = (map, gl) => S(map, { emissiveMap: gl, emissive: 0xffffff, emissiveIntensity: 0 });
  GBV.mats = {
    ziegel: F(ziegel, glow(WZ)), stein: F(stein, glow(WS, 0.4)), glas: F(glas, glow(WG, 0.3)), fabrik: F(fabrik, glow(WF, 0.25)), laden: F(laden, glow(WLg, 0.6)),
    blech: S(blech, { roughness: 0.6, metalness: 0.4 }), brand: S(brand), dach: S(dach, { roughness: 0.95 }),
    kante: new THREE.MeshStandardMaterial({ color: 0xcfc8ba, roughness: 0.8 }),
    eisen: new THREE.MeshStandardMaterial({ color: 0x1c1e21, roughness: 0.6, metalness: 0.5 }),
    holz: new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.9 }),
    beton: new THREE.MeshStandardMaterial({ color: 0x8e8e8a, roughness: 0.95 }),
    farbe: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }),
    schild: S(schild, { emissiveMap: schild, emissive: 0xffffff, emissiveIntensity: 0.1, roughness: 0.6 }),
  };
  for (const [k, m] of Object.entries(GBV.mats)) m.name = "Gebäude " + k;
  return GBV.mats;
}

// ---------- Geometrie-Helfer (Eimer) ----------
const gbvBucket = (out, key) => { let o = out.get(key); if (!o) out.set(key, o = { p: [], n: [], uv: [], c: [] }); return o; };
// Dreieck mit Ausrichtung nach Normale n (Wicklung wird passend gedreht)
function gbvTri(o, a, b, c, n, ua, ub, uc, col) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
  if (cx * n[0] + cy * n[1] + cz * n[2] < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; }
  o.p.push(...a, ...b, ...c); o.n.push(...n, ...n, ...n); o.uv.push(...ua, ...ub, ...uc); if (col) o.c.push(...col, ...col, ...col);
}
const gbvQuad = (o, a, b, c, d, n, uv, col) => { gbvTri(o, a, b, c, n, uv[0], uv[1], uv[2], col); gbvTri(o, a, c, d, n, uv[0], uv[2], uv[3], col); };
// Lage-Objekt: lokal (s, t) -> Welt, Seiten
function gbvFrame(o) {
  const { P0, e1, e2, L1, L2 } = o, W = (s, t, y) => [P0[0] + e1[0] * s + e2[0] * t, y, P0[1] + e1[1] * s + e2[1] * t];
  const side = k => [[0, 0, 1, 0, 0, -1, L1], [L1, 0, 0, 1, 1, 0, L2], [L1, L2, -1, 0, 0, 1, L1], [0, L2, 0, -1, -1, 0, L2]][k];   // [A.s, A.t, d.s, d.t, out.s, out.t, Laenge]
  const dirW = (ds, dt) => [e1[0] * ds + e2[0] * dt, 0, e1[1] * ds + e2[1] * dt];
  return { W, side, dirW };
}
// senkrechte Wand auf Seite k von a bis b (laengs, Meter), y0..y1, UV: u in Achsen (3 m), v = Meter / vh
function gbvWall(out, key, f, k, a, b, y0, y1, ins, vh, uo = 0, vo = 0, base = 0) {   // v ab dem Gebaeudefuss (Gotham liegt auf -12; Review: sonst Fenster 2 m verschoben)
  const [As, At, ds, dt, os, ot] = f.side(k), p = u => [As + ds * u - os * ins, At + dt * u - ot * ins], [s0, t0] = p(a), [s1, t1] = p(b), n = f.dirW(os, ot);
  gbvQuad(gbvBucket(out, key), f.W(s0, t0, y0), f.W(s1, t1, y0), f.W(s1, t1, y1), f.W(s0, t0, y1), n, [[uo + a / 3, vo + (y0 - base) / vh], [uo + b / 3, vo + (y0 - base) / vh], [uo + b / 3, vo + (y1 - base) / vh], [uo + a / 3, vo + (y1 - base) / vh]]);
}
// Quader lokal: Mitte (s, t), Groesse ls x lt, y0..y1; Material key (Farbe col bei "farbe")
function gbvBox(out, key, f, s, t, ls, lt, y0, y1, col, top = true, bot = false) {
  const o = gbvBucket(out, key), c = [[s - ls / 2, t - lt / 2], [s + ls / 2, t - lt / 2], [s + ls / 2, t + lt / 2], [s - ls / 2, t + lt / 2]], N = [f.dirW(0, -1), f.dirW(1, 0), f.dirW(0, 1), f.dirW(-1, 0)];
  for (let k = 0; k < 4; k++) { const [a0, b0] = c[k], [a1, b1] = c[(k + 1) % 4], L = Math.hypot(a1 - a0, b1 - b0);
    gbvQuad(o, f.W(a0, b0, y0), f.W(a1, b1, y0), f.W(a1, b1, y1), f.W(a0, b0, y1), N[k], [[0, 0], [L / 3, 0], [L / 3, (y1 - y0) / 3], [0, (y1 - y0) / 3]], col); }
  if (top) gbvQuad(o, f.W(...c[0], y1), f.W(...c[1], y1), f.W(...c[2], y1), f.W(...c[3], y1), [0, 1, 0], [[0, 0], [ls / 3, 0], [ls / 3, lt / 3], [0, lt / 3]], col);
  if (bot) gbvQuad(o, f.W(...c[0], y0), f.W(...c[1], y0), f.W(...c[2], y0), f.W(...c[3], y0), [0, -1, 0], [[0, 0], [ls / 3, 0], [ls / 3, lt / 3], [0, lt / 3]], col);   // Unterseite (Markise, Vordach, Podest: von unten sichtbar)
}
// Box entlang einer Seite: u laengs (Mitte), w nach aussen (Mitte), Laenge len, Tiefe dep
function gbvBoxSide(out, key, f, k, u, w, len, dep, y0, y1, col, bot = false) { const [As, At, ds, dt, os, ot] = f.side(k), s = As + ds * u + os * w, t = At + dt * u + ot * w;
  gbvBox(out, key, f, s, t, ds ? len : dep, ds ? dep : len, y0, y1, col, true, bot); }
// Zylinder (senkrecht) lokal
function gbvCyl(out, key, f, s, t, r, y0, y1, seg = 10, top = true) { const o = gbvBucket(out, key);
  for (let i = 0; i < seg; i++) { const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, P = (a, y) => f.W(s + Math.cos(a) * r, t + Math.sin(a) * r, y), am = (a0 + a1) / 2, n = f.dirW(Math.cos(am), Math.sin(am));
    gbvQuad(o, P(a0, y0), P(a1, y0), P(a1, y1), P(a0, y1), n, [[i / seg, 0], [(i + 1) / seg, 0], [(i + 1) / seg, 1], [i / seg, 1]]);
    if (top) gbvTri(o, f.W(s, t, y1), P(a0, y1), P(a1, y1), [0, 1, 0], [0.5, 0.5], [0, 0], [1, 0]); } }

// ---------- Huelle ----------
// o: { P0, e1, e2, L1, L2, front, type, N, H, glas, seed, fire:[4 bool], y }; Rueckgabe: Dreiecke
function gbvShell(o, out) {
  const n0 = gbvCount(out), f = gbvFrame(o), y = o.y || 0, H = o.H, GH = GBV.GH, t = o.type, sd = o.seed || 0, uo = sd % 8, vo = Math.floor(sd / 8) % 4;
  const facade = t === "kratzer" ? (o.glas ? "glas" : "stein") : t === "buero" ? "stein" : t === "fabrik" ? "fabrik" : t === "lager" ? "blech" : "ziegel";
  const hall = t === "fabrik" || t === "lager";
  const body = (ins, yb, yt, front) => {   // vier Waende (ins = Einzug je Seite), Dach, Dachkante
    for (let k = 0; k < 4; k++) { const len = f.side(k)[6] - 2 * ins, key = o.fire[k] && !hall && t !== "kratzer" ? "brand" : facade, vh = hall ? H : GH;
      if (front && k === o.front && (t === "laden" || t === "miet") && yb === y) { gbvWall(out, "laden", f, k, ins, ins + len, y, y + GH, ins, GH, uo, vo, y); if (yt > y + GH + 0.01) gbvWall(out, key, f, k, ins, ins + len, y + GH, yt, ins, vh, uo, vo, y); }
      else gbvWall(out, key, f, k, ins, ins + len, yb, yt, ins, vh, uo, vo, y); }
    const c = [[ins, ins], [o.L1 - ins, ins], [o.L1 - ins, o.L2 - ins], [ins, o.L2 - ins]];
    gbvQuad(gbvBucket(out, "dach"), ...c.map(([s, q]) => f.W(s, q, yt)), [0, 1, 0], c.map(([s, q]) => [s / 6, q / 6]));
    // Attika/Dachkante: 0,8 m hoch, 0,3 m stark, innen ohne Flaeche (vom Dach aus kaum sichtbar)
    for (let k = 0; k < 4; k++) { const [As, At, ds, dt, os, ot, L] = f.side(k), len = L - 2 * ins; gbvBoxSide(out, "kante", f, k, ins + len / 2, -ins - 0.15, len, 0.3, yt, yt + (hall ? 0.5 : 0.8)); }
  };
  if (t === "kratzer" && o.L1 >= 30 && o.L2 >= 30) { const yk = y + Math.round(H * 0.4 / GH) * GH; body(0, y, yk, true); body(4, yk, y + H, false); }
  else body(0, y, y + H, true);
  return gbvCount(out) - n0;
}
function gbvCount(out) { let n = 0; for (const o of out.values()) n += o.p.length / 9; return n; }

// ---------- Anbauten (nur in der Naehe) ----------
function gbvDetails(o, out) {
  const n0 = gbvCount(out), f = gbvFrame(o), y = o.y || 0, H = o.H, GH = GBV.GH, t = o.type, r = gbvRand(o.seed * 7 + 3), k = o.front, Lf = f.side(k)[6];
  const top = y + H;
  if (t === "laden" || t === "miet") {
    // Laeden: Markisen (Farbe) und Schilder ueber den Schaufenstern, Hauseingang mit Stufen in der Mitte
    const nL = Math.max(1, Math.min(4, Math.floor((Lf - 3) / 6))), LW = (Lf - 3) / nL, cols = [[0.18, 0.49, 0.29], [0.17, 0.36, 0.61], [0.61, 0.17, 0.17], [0.7, 0.55, 0.15]];
    for (let i = 0; i < nL; i++) { let u0 = i * LW + (i >= Math.ceil(nL / 2) ? 3 : 0); const um = u0 + LW / 2, col = cols[Math.floor(r() * 4)];
      gbvBoxSide(out, "farbe", f, k, um, 0.8, LW - 0.6, 1.6, y + 3.55, y + 3.65, col, true);                                                  // Markise (flach, 1,6 m vor der Wand)
      const [As, At, ds, dt, os, ot] = f.side(k), si = Math.floor(r() * GBV.SIGNS.length), sw = Math.min(LW - 1, 5), a = um - sw / 2, b = um + sw / 2, q = 0.06;   // Schild
      const P = (u, yy) => f.W(As + ds * u + os * q, At + dt * u + ot * q, yy), v0 = 1 - (si + 1) / 8, v1 = 1 - si / 8;
      const nw = f.dirW(os, ot), dw = f.dirW(ds, dt), mir = dw[0] * nw[2] - dw[2] * nw[0] < 0, su0 = mir ? 1 : 0, su1 = 1 - su0;   // Schrift von aussen lesbar (gespiegelte Achsen)
      gbvQuad(gbvBucket(out, "schild"), P(a, y + 3.85), P(b, y + 3.85), P(b, y + 4.45), P(a, y + 4.45), nw, [[su0, v0], [su1, v0], [su1, v1], [su0, v1]]); }
    const dm = Math.ceil(nL / 2) * LW + 1.5; gbvBoxSide(out, "holz", f, k, dm, 0.05, 2.0, 0.12, y, y + 3.2); gbvBoxSide(out, "beton", f, k, dm, 0.5, 2.8, 1.0, y, y + 0.15);
    if (t === "miet" && o.N > 1) {   // Feuertreppe ueber zwei Achsen an der Front: Podest, Gelaender, Treppe je Geschoss
      const u0 = Math.min(Lf - 7, 3 + Math.floor(r() * Math.max(1, Lf / 3 - 3)) * 3), fw = 6;
      for (let fl = 1; fl < o.N; fl++) { const yy = y + fl * GH + 0.9; gbvBoxSide(out, "eisen", f, k, u0 + fw / 2, 0.75, fw, 1.4, yy - 0.08, yy, null, true);
        gbvBoxSide(out, "eisen", f, k, u0 + fw / 2, 1.42, fw, 0.05, yy, yy + 1.0);
        if (fl < o.N - 1) gbvBoxSide(out, "eisen", f, k, u0 + fw / 2, 0.45, fw * 0.75, 0.6, yy + GH * 0.45, yy + GH * 0.55); } }
  }
  if (t === "kratzer" || t === "buero") { const [, , , , os, ot] = f.side(k); gbvBoxSide(out, "kante", f, k, Lf / 2, 1.5, Math.min(14, Lf - 2), 3, y + 4.2, y + 4.6, null, true);   // Vordach
    gbvBoxSide(out, "eisen", f, k, Lf / 2, 0.05, Math.min(8, Lf - 4), 0.1, y, y + 3.6); }   // Eingangsfront dunkel
  if (t === "fabrik") { for (let i = 0; i < Math.max(2, Math.floor(o.L1 / 10)); i++) { const s = (i + 0.5) * o.L1 / Math.max(2, Math.floor(o.L1 / 10)); gbvBox(out, "fabrik", f, s, o.L2 / 2, 3, o.L2 - 2, top, top + 2.2); }   // Sheddach-Zaehne
    gbvCyl(out, "beton", f, o.L1 * 0.8, o.L2 * 0.3, 1.1, top, top + 14, 10); }   // Schornstein
  if (t === "lager") { const n = Math.max(1, Math.min(4, Math.floor(Lf / 9))); for (let i = 0; i < n; i++) { const um = (i + 0.5) * Lf / n; gbvBoxSide(out, "eisen", f, k, um, 0.06, 5, 0.12, y, y + 5);   // Rolltore
    gbvBoxSide(out, "beton", f, k, um, 0.5, 6, 1.0, y, y + 0.9); } }   // Laderampe, nur 1 m tief (Review: ragte 3 m auf Gehsteig/Strasse)
  // Dach: Wassertank (Miet, Laden, teils Buero), Treppenhaus, Lueftungen
  if (t === "miet" || t === "laden" || (t === "buero" && r() < 0.5)) { const s = o.L1 * (0.25 + r() * 0.5), q = o.L2 * (0.25 + r() * 0.5);
    for (const [a, b] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) gbvBox(out, "eisen", f, s + a, q + b, 0.2, 0.2, top, top + 3);
    gbvCyl(out, "holz", f, s, q, 2.1, top + 3, top + 6.6, 12); }
  if (t !== "fabrik" && t !== "lager") { gbvBox(out, "brand", f, Math.min(o.L1 - 3, 3.5), Math.min(o.L2 - 3, 3.5), 3.2, 3.6, top, top + 3);
    for (let i = 0; i < 2; i++) gbvBox(out, "beton", f, o.L1 * (0.4 + 0.25 * i), o.L2 * 0.7, 1.6, 1.2, top, top + 1.1); }
  return gbvCount(out) - n0;
}
// Eimer -> Gruppe (je Material ein Mesh), fuer Werkstatt und Tests
function gbvMesh(out, opt = {}) {
  const g = new THREE.Group(), M = gbvInit();
  for (const [key, o] of out) { if (!o.p.length) continue; const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2));
    if (o.c.length) geo.setAttribute("color", new THREE.Float32BufferAttribute(o.c, 3));
    const m = new THREE.Mesh(geo, M[key]); m.castShadow = opt.cast !== false; m.receiveShadow = true; m.name = "Gebäude " + key; g.add(m); }
  return g;
}
