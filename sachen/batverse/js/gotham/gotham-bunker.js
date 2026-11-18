// Batverse – Gotham: Geheimbasis im Container (PLAN-GOTHAM Phase 5, P5; Orte "container-base" und "bunker" aus daten.js). Klassisches Skript nach gotham-kanal.js.
// Oben ein ganz normaler blauer 20-Fuss-Seecontainer (6,06 x 2,44 x 2,59 m, Wellblech, zweifluegelige Tuer mit Verriegelungsstangen, keine Fenster).
// Er ist ein Aufzug: faehrt samt Spieler oder Auto 5,5 m hinunter (Rechtsklick auf das Bedienfeld innen, die Rufsaeule oben bzw. unten, im Auto Taste L);
// unten ist er offen zum Gang (Tuer zeigt zur Halle). Ist er unten, schliesst oben eine Stahlplatte den Schacht.
// Unten eine flache, weite Halle (90 x 50 m, Boden Strasse - 5,5 m, 4,7 m hoch): Sichtbeton, Decke ganz aus Lichtpaneelen, glatter Betonboden.
// Batmobil (Tumbler) in der Mitte, Anzug faehrt aus dem Boden, Motorrad und Batpod hinter Wandtoren, Computer, aufklappbare Wand mit Waffen und Gadgets,
// Geheimwand mit Tresor (Goldbarren, Bargeld), hinten Reifenstapel und Werkbank. Alle Mechanismen als Tore (anzielen, Rechtsklick/E).
"use strict";
const GCB = { done: false, t: 0, target: 0, moving: false };
function* gcbGen() {
  while (!GSTR.done || !GGEB.done) yield "wait";
  const OB = GOTHAM.orte.find(o => o.id === "bunker"), OC = GOTHAM.orte.find(o => o.id === "container-base"); if (!OB || !OC) return;
  const Cg = GOT.toGame(OC.x, OC.z), Y = GOT.STR, YF = Y + (OB.ebene || -5.5), YC = YF + 4.7, HA = OB.w / 2, HB = Math.min(OB.d / 2, 19);
  // Lage (Nicolas 2026-11-16, Test): am Kartenort der Halle liegt die untere Etage der zweistoeckigen Uferstrasse Nord auf gleicher Hoehe, darunter der Kanal.
  // Darum liegt die Halle laengs im freien Streifen zwischen Strassengraben und Kaimauer (ca. 48 m breit, parallel zum Ufer), 90 x 38 m statt 90 x 50 m,
  // mit dem Container an der Stirnseite (+a). Achsen: a entlang des Ufers (vom Hallenzentrum zum Container), b quer.
  const gr = (() => { const e = 2, a = GOT.edgeSD(Cg[0] + e, Cg[1]) - GOT.edgeSD(Cg[0] - e, Cg[1]), b = GOT.edgeSD(Cg[0], Cg[1] + e) - GOT.edgeSD(Cg[0], Cg[1] - e), l = Math.hypot(a, b) || 1; return [a / l, b / l]; })(), Lu = [-gr[1], gr[0]];
  const freeAt = (x, z) => terrainH(x, z) > -12.5 && GOT.edgeSD(x, z) < -15 && !(typeof gdeckNear === "function" && gdeckNear(x, z) && gdeckNear(x, z).d < 16);
  let best = null; for (const sg of [1, -1]) { const A = [Lu[0] * sg, Lu[1] * sg], Bv = [-A[1], A[0]], Hc = [Cg[0] - A[0] * (HA + 4), Cg[1] - A[1] * (HA + 4)]; let n = 0;
    for (let a = -HA; a <= HA; a += 6) for (let b = -HB - 3; b <= HB + 3; b += 6) if (freeAt(Hc[0] + A[0] * a + Bv[0] * b, Hc[1] + A[1] * a + Bv[1] * b)) n++; if (!best || n > best.n) best = { n, A, Hc }; }
  const ax = best.A[0], az = best.A[1], bx = -az, bz = ax, Bk = best.Hc; GCB.freeCells = best.n;
  const f = gbvFrame({ P0: Bk, e1: [ax, az], e2: [bx, bz], L1: 1, L2: 1 }), W = (a, b) => { const p = f.W(a, b, 0); return [p[0], p[2]]; };
  const ca = (Cg[0] - Bk[0]) * ax + (Cg[1] - Bk[1]) * az, cb = (Cg[0] - Bk[0]) * bx + (Cg[1] - Bk[1]) * bz, sA = ca > 0 ? -1 : 1;   // Tuer zeigt zur Halle (-sA ... ), sA: Richtung von der Halle weg = Vorzeichen von ca
  const CL = 6.06, CWd = 2.44, CH = 2.59, aDoor = ca + sA * CL / 2;   // Tuerseite des Containers (Halle zugewandt)
  const out = new Map(), B = k => gbvBucket(out, k), box = (key, a, b, la, lb, y0, y1, col) => gbvBox(out, key, f, a, b, la, lb, y0, y1, col);
  const dk = (a, b, la, lb, y0, y1, o = {}) => { const [x, z] = W(a, b); return dkAdd(Object.assign({ cx: x, cy: (y0 + y1) / 2, cz: z, ux: ax, uz: az, hl: la / 2, hw: lb / 2, hh: (y1 - y0) / 2, m: 0.1 }, o)); };
  const room = (a0, a1, b0, b1, y0, y1) => dkRoom({ poly: [W(a0, b0), W(a1, b0), W(a1, b1), W(a0, b1)], y0, y1 });
  const q = (key, a0, b0, a1, b1, y0, y1, n, uv) => gbvQuad(B(key), f.W(a0, b0, y0), f.W(a1, b1, y0), f.W(a1, b1, y1), f.W(a0, b0, y1), n, uv || [[0, (y0 - YF) / 3], [Math.hypot(a1 - a0, b1 - b0) / 3, (y0 - YF) / 3], [Math.hypot(a1 - a0, b1 - b0) / 3, (y1 - YF) / 3], [0, (y1 - YF) / 3]]);
  const dW = (a, b) => f.dirW(a, b);
  // ---------- Materialien ----------
  const tex = (w, h, fn, rep) => { const t = canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  // Sichtbeton wie im Filmbild (Nicolas 2026-11-17): Schalungstafeln 1,5 m mit senkrechten Fugen, Ankerloecher, dunkle Laufspuren und Flecken (Kachel = 3 x 3 m)
  const beton = tex(256, 256, (c, w, h) => { c.fillStyle = "#77736b"; c.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const v = 95 + Math.random() * 45; c.fillStyle = `rgba(${v},${v - 3},${v - 9},0.35)`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    for (let k = 0; k < 14; k++) { const x = Math.random() * w, y0 = Math.random() * h * 0.5, len = 60 + Math.random() * 160, gr = c.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, "rgba(40,36,30,0.35)"); gr.addColorStop(1, "rgba(40,36,30,0)"); c.fillStyle = gr; c.fillRect(x, y0, 3 + Math.random() * 10, len); }
    for (let k = 0; k < 6; k++) { c.fillStyle = "rgba(55,50,44,0.18)"; c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 18 + Math.random() * 30, 10 + Math.random() * 25, 0, 0, 7); c.fill(); }
    c.fillStyle = "rgba(30,28,25,0.55)"; for (const x of [0, 128]) c.fillRect(x, 0, 3, h); c.fillStyle = "rgba(200,196,188,0.18)"; for (const x of [3, 131]) c.fillRect(x, 0, 2, h);
    c.fillStyle = "#4a4740"; for (const x of [40, 88, 168, 216]) for (const y of [56, 184]) { c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); } });
  // Lichtdecke: Kachel 4 x 4 m, duenne dunkle Rasterlinien, darin feine Lichtstreifen
  const licht = tex(256, 256, (c, w, h) => { c.fillStyle = "#f6f8ff"; c.fillRect(0, 0, w, h); c.fillStyle = "#d9dee8"; for (let y = 8; y < h; y += 16) c.fillRect(0, y, w, 2); c.fillStyle = "#2a2c30"; c.fillRect(0, 0, w, 4); c.fillRect(0, 0, 4, h); });
  // Boden: dunkler, rauer Beton mit Rissen und Flecken (Kachel 6 x 6 m)
  const bodenT = tex(512, 512, (c, w, h) => { c.fillStyle = "#71706b"; c.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = 90 + Math.random() * 50; c.fillStyle = `rgba(${v},${v},${v - 4},0.3)`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    for (let k = 0; k < 10; k++) { c.fillStyle = "rgba(30,30,28,0.07)"; c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 70, 20 + Math.random() * 50, Math.random() * 3, 0, 7); c.fill(); }
    c.strokeStyle = "rgba(25,25,24,0.4)"; c.lineWidth = 1.2; for (let k = 0; k < 7; k++) { let x = Math.random() * w, y = Math.random() * h; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 9; j++) { x += (Math.random() - 0.3) * 40; y += (Math.random() - 0.5) * 40; c.lineTo(x, y); } c.stroke(); }
    c.fillStyle = "rgba(20,20,20,0.35)"; c.fillRect(0, 0, w, 2); c.fillRect(0, 0, 2, h); });
  // Bildschirme der Computer-Ecke: Ueberwachungskamera, Nachrichten, Stadtplan
  const cctv = tex(256, 160, (c, w, h) => { c.fillStyle = "#1c2226"; c.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { const v = 40 + Math.random() * 110; c.fillStyle = `rgb(${v},${v + 6},${v + 10})`; c.fillRect(Math.random() * w, 20 + Math.random() * (h - 40), 10 + Math.random() * 60, 6 + Math.random() * 40); }
    for (let i = 0; i < 2000; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`; c.fillRect(Math.random() * w, Math.random() * h, 1, 1); } c.fillStyle = "#cfe8ff"; c.font = "10px monospace"; c.fillText("CAM 07  GOTHAM HARBOR", 6, 12); c.fillText("REC \u25CF 23:14:08", w - 92, h - 6); });
  const news = tex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#3a4a52"); gr.addColorStop(1, "#1a2024"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(220,220,210,0.25)"; c.beginPath(); c.ellipse(w / 2, h * 0.45, 46, 54, 0, 0, 7); c.fill();
    c.fillStyle = "#0a0c10"; c.fillRect(0, h - 34, w, 34); c.fillStyle = "#d8dde2"; c.font = "bold 18px Arial"; c.fillText("G C N", 10, h - 11); c.font = "9px Arial"; c.fillText("GOTHAM CABLE NEWS", 62, h - 20); c.fillText("BREAKING NEWS", 62, h - 9); });
  const karte = tex(256, 160, (c, w, h) => { c.fillStyle = "#04121e"; c.fillRect(0, 0, w, h); c.strokeStyle = "#1f6a8a"; c.lineWidth = 1; for (let x = 0; x < w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 20, h); c.stroke(); } for (let y = 0; y < h; y += 14) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y - 10); c.stroke(); }
    c.strokeStyle = "#e8d23a"; c.lineWidth = 2; c.beginPath(); c.moveTo(20, 130); c.lineTo(90, 70); c.lineTo(160, 90); c.lineTo(230, 30); c.stroke(); c.fillStyle = "#ff3a3a"; for (const [x, y] of [[90, 70], [160, 90], [200, 52]]) { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); } });
  const welle = tex(64, 64, (c, w, h) => { c.fillStyle = "#2f5f9e"; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(x, 0, 3, h); c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(x + 4, 0, 2, h); } });
  const M = { wand: new THREE.MeshStandardMaterial({ map: beton, roughness: 0.92 }), boden: new THREE.MeshStandardMaterial({ map: bodenT, roughness: 0.75, metalness: 0.05 }),
    block: new THREE.MeshStandardMaterial({ map: beton, color: 0xc4bfb6, roughness: 0.95 }), rost: new THREE.MeshStandardMaterial({ color: 0x6a4e3a, roughness: 0.9, metalness: 0.3 }), weiss: new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: 0.4 }),
    karton: new THREE.MeshStandardMaterial({ map: canvasTex(128, 96, (c, w, h) => { c.fillStyle = "#6b4a30"; c.fillRect(0, 0, w, h); c.fillStyle = "#4a3220"; c.fillRect(0, 0, w, 6); c.fillStyle = "#e8e6df"; c.fillRect(20, 44, 88, 34); c.fillStyle = "#333"; for (let k = 0; k < 4; k++) c.fillRect(26, 50 + k * 7, 40 + (k * 13) % 30, 3); c.fillStyle = "#2a1c12"; c.fillRect(48, 16, 32, 8); }), roughness: 0.9 }),
    spot: new THREE.MeshBasicMaterial({ color: 0xfff4dc }), led: new THREE.MeshBasicMaterial({ color: 0x3a8cff }), ledg: new THREE.MeshBasicMaterial({ color: 0x3aff7a }),
    cctv: new THREE.MeshStandardMaterial({ map: cctv, emissiveMap: cctv, emissive: 0xffffff, emissiveIntensity: 0.9 }), news: new THREE.MeshStandardMaterial({ map: news, emissiveMap: news, emissive: 0xffffff, emissiveIntensity: 0.9 }), karte: new THREE.MeshStandardMaterial({ map: karte, emissiveMap: karte, emissive: 0xffffff, emissiveIntensity: 0.9 }),
    licht: new THREE.MeshStandardMaterial({ map: licht, emissiveMap: licht, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.6 }), cont: new THREE.MeshStandardMaterial({ map: welle, roughness: 0.6, metalness: 0.3 }),
    stahl: new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.5, metalness: 0.6 }), dunkel: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.5, metalness: 0.3 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xe0b03a, metalness: 1, roughness: 0.25, emissive: 0x3a2a08, emissiveIntensity: 1 }), geld: new THREE.MeshStandardMaterial({ color: 0x7a9a6a, roughness: 0.9 }),
    reifen: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 }), holz: new THREE.MeshStandardMaterial({ color: 0x6a5038, roughness: 0.9 }), gelb: new THREE.MeshStandardMaterial({ color: 0xe8c22a, roughness: 0.6 }),
    schirm: new THREE.MeshStandardMaterial({ map: (() => canvasTex(256, 160, (c, w, h) => { c.fillStyle = "#04121e"; c.fillRect(0, 0, w, h); c.strokeStyle = "#3cf"; c.lineWidth = 2; c.beginPath(); for (let x = 0; x < w; x += 4) c.lineTo(x, 80 + Math.sin(x / 13) * 30 + Math.random() * 10); c.stroke(); c.fillStyle = "#3cf"; c.font = "12px monospace"; for (let k = 0; k < 6; k++) c.fillText("GCPD-NET " + (Math.random() * 1e6 | 0), 8, 18 + k * 22); }))(), emissive: 0xffffff, emissiveIntensity: 0.9 }) };
  M.schirm.emissiveMap = M.schirm.map;
  // ---------- Halle ----------
  q("wand", -HA, -HB, HA, -HB, YF, YC, dW(0, 1)); q("wand", HA, HB, -HA, HB, YF, YC, dW(0, -1)); q("wand", HA, -HB, HA, -4, YF, YC, dW(-1, 0)); q("wand", HA, 4, HA, HB, YF, YC, dW(-1, 0)); q("wand", HA, -4, HA, 4, YF + 4.2, YC, dW(-1, 0)); q("wand", -HA, HB, -HA, -HB, YF, YC, dW(1, 0));
  gbvQuad(B("boden"), f.W(-HA, -HB, YF), f.W(HA, -HB, YF), f.W(HA, HB, YF), f.W(-HA, HB, YF), [0, 1, 0], [[0, 0], [HA / 3, 0], [HA / 3, HB / 3], [0, HB / 3]]);   // Kachel 6 m
  gbvQuad(B("licht"), f.W(-HA, -HB, YC), f.W(HA, -HB, YC), f.W(HA, HB, YC), f.W(-HA, HB, YC), [0, -1, 0], [[0, 0], [HA / 2, 0], [HA / 2, HB / 2], [0, HB / 2]]);   // Lichtdecke (Raster 4 x 4 m, feine Streifen)
  box("dunkel", -HA * 0.35, 0, 22, 1.4, YC - 0.03, YC - 0.01);   // dunkle Deckenoeffnung (Wartungsschacht) wie im Filmbild
  room(-HA + 0.4, HA - 0.4, -HB + 0.4, HB - 0.4, YF - 1, YC); dk(0, 0, 2 * HA, 2 * HB, YF - 0.5, YF, { ceil: 0 });
  // ---------- Gang zum Aufzugsschacht (entlang a, 8 m breit, 4,2 m hoch) ----------
  const g0 = ca > 0 ? HA : -HA, g1 = aDoor; const ga = Math.min(g0, g1), gb = Math.max(g0, g1);
  for (const s of [-1, 1]) q("wand", ga, s * 4, gb, s * 4, YF, YF + 4.2, dW(0, -s));
  gbvQuad(B("boden"), f.W(ga, -4, YF), f.W(gb, -4, YF), f.W(gb, 4, YF), f.W(ga, 4, YF), [0, 1, 0], [[0, 0], [(gb - ga) / 6, 0], [(gb - ga) / 6, 8 / 6], [0, 8 / 6]]);
  gbvQuad(B("licht"), f.W(ga, -4, YF + 4.2), f.W(gb, -4, YF + 4.2), f.W(gb, 4, YF + 4.2), f.W(ga, 4, YF + 4.2), [0, -1, 0], [[0, 0], [(gb - ga) / 4, 0], [(gb - ga) / 4, 2], [0, 2]]);
  room(ga - 0.5, gb + 0.5, -3.6, 3.6, YF - 1, YF + 4.2); dk((ga + gb) / 2, 0, gb - ga, 8, YF - 0.5, YF, { ceil: 0 });
  { const ae = aDoor, s = sA; q("wand", ae, -4, ae, -CWd / 2 - 0.2, YF, YF + 4.2, dW(s, 0)); q("wand", ae, CWd / 2 + 0.2, ae, 4, YF, YF + 4.2, dW(s, 0)); q("wand", ae, -CWd / 2 - 0.2, ae, CWd / 2 + 0.2, YF + CH + 0.3, YF + 4.2, dW(s, 0)); }   // Stirnwand mit Schachtoeffnung
  // ---------- Schacht (unter dem Container, offen zum Gang) ----------
  const s0 = ca - CL / 2 - 0.25, s1 = ca + CL / 2 + 0.25, w0 = cb - CWd / 2 - 0.25, w1 = cb + CWd / 2 + 0.25;
  q("wand", s0, w0, s1, w0, YF - 0.3, Y - 0.3, dW(0, 1)); q("wand", s1, w1, s0, w1, YF - 0.3, Y - 0.3, dW(0, -1)); if (sA > 0) q("wand", s0, w1, s0, w0, YF - 0.3, Y - 0.3, dW(1, 0)); else q("wand", s1, w0, s1, w1, YF - 0.3, Y - 0.3, dW(-1, 0));
  gbvQuad(B("stahl"), f.W(s0, w0, YF - 0.3), f.W(s1, w0, YF - 0.3), f.W(s1, w1, YF - 0.3), f.W(s0, w1, YF - 0.3), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  { const e1 = aDoor + sA * 0.6, e2 = ca - sA * CL / 2 + sA * 0.15; room(Math.min(e1, e2), Math.max(e1, e2), cb - CWd / 2 + 0.15, cb + CWd / 2 - 0.15, YF - 1, Y + 3.2); }   // Containerinneres bis ueber die Strasse (Gelaende zaehlt dort nicht)
  yield;
  // ---------- Container (bewegliche Gruppe) ----------
  const cg = new THREE.Group(); cg.name = "Container-Aufzug"; cg.userData.keep = true; cg.userData.noLift = true;
  const lc = (a, b, y) => { const p = f.W(a, b, y); return new THREE.Vector3(p[0], p[1], p[2]); };
  { const cOut = new Map(), fc = gbvFrame({ P0: Cg, e1: [ax, az], e2: [bx, bz], L1: 1, L2: 1 }), bb = (key, a, b, la, lb, y0, y1) => gbvBox(cOut, key, fc, a, b, la, lb, y0, y1);
    const back = -sA;   // Rueckwand auf der von der Halle abgewandten Seite (lokal +-CL/2)
    bb("cont", 0, -CWd / 2 + 0.03, CL, 0.06, Y + 0.15, Y + CH); bb("cont", 0, CWd / 2 - 0.03, CL, 0.06, Y + 0.15, Y + CH); bb("cont", back * (CL / 2 - 0.03), 0, 0.06, CWd, Y + 0.15, Y + CH);
    bb("cont", 0, 0, CL, CWd, Y + CH - 0.06, Y + CH); bb("stahl", 0, 0, CL, CWd, Y, Y + 0.15);
    for (const a of [-CL / 2, CL / 2]) for (const b of [-CWd / 2, CWd / 2]) bb("stahl", a - Math.sign(a) * 0.08, b - Math.sign(b) * 0.08, 0.16, 0.16, Y, Y + CH);   // Eckbeschlaege
    bb("stahl", ca * 0 + -back * (CL / 2 - 0.15), -CWd / 2 + 0.25, 0.1, 0.3, Y + 1.1, Y + 1.4);   // Bedienfeld innen (neben der Tuer)
    for (const [key, o] of cOut) { const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2)); const m = new THREE.Mesh(geo, M[key]); m.castShadow = m.receiveShadow = true; cg.add(m); }
    // Tuerfluegel (Scharnier an den Ecken der Tuerseite, oeffnen nach aussen), Verriegelungsstangen
    GCB.doors = []; for (const s of [-1, 1]) { const piv = new THREE.Group();
      const pp = f.W(aDoor, cb + s * CWd / 2, Y + 0.15); piv.position.set(pp[0] - Cg[0], pp[1], pp[2] - Cg[1]); piv.rotation.y = Math.atan2(ax, az) - Math.PI / 2;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.05, CH - 0.2, CWd / 2), M.cont); leaf.position.set(0, (CH - 0.2) / 2, -s * CWd / 4); piv.add(leaf);
      for (const k of [0.25, 0.75]) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, CH - 0.3, 6), M.stahl); bar.position.set(-0.05, (CH - 0.2) / 2, -s * CWd / 2 * k); piv.add(bar); }
      const holder = new THREE.Group(); holder.position.set(Cg[0], 0, Cg[1]); holder.add(piv); cg.add(holder); GCB.doors.push({ piv, s }); }
  }
  scene.add(cg); GCB.cg = cg;
  // Bodenplatte des Aufzugs (bewegliches dk-Teil) und Schachtdeckel oben (fest, nur wenn der Container unten ist)
  GCB.floor = dk(ca, cb, CL - 0.1, CWd - 0.1, Y - 0.2, Y + 0.15, { ceil: 0, m: 0 }); GCB.floor0 = { top: GCB.floor.top, y0: GCB.floor.y0, y1: GCB.floor.y1 };
  GCB.hatch = dk(ca, cb, CL + 0.4, CWd + 0.4, Y - 0.3, Y, { ceil: 0, m: 0 }); GCB.hatch.on = false;
  { const hm = new THREE.Mesh(new THREE.BoxGeometry(CWd + 0.5, 0.06, CL + 0.5), M.stahl); const p = f.W(ca, cb, Y + 0.01); hm.position.set(p[0], p[1], p[2]); hm.rotation.y = Math.atan2(ax, az); hm.visible = false; hm.userData.keep = true; scene.add(hm); GCB.hatchM = hm; }
  GCB.drop = Y - YF; GCB.Y = Y; GCB.c = Cg;
  // ---------- Ausstattung der Halle ----------
  // Batmobil (Tumbler) in der Mitte
  if (typeof addVehicle === "function" && typeof SPEC_TUMBLER !== "undefined") { const [x, z] = W(0, 0); GCB.tumbler = addVehicle(SPEC_TUMBLER, () => buildTumbler(0x111214, 0x1c1e22), x, z, YF, Math.atan2(ax, az) + (sA > 0 ? Math.PI / 2 : -Math.PI / 2), "Tumbler (Geheimbasis)", 0x111214); }
  // Anzug aus dem Boden: Bodenluke, Sockel mit Figur (faehrt hoch)
  const suit = new THREE.Group(); { const blk = M.dunkel, add = (geo, y, x = 0, z = 0) => { const m = new THREE.Mesh(geo, blk); m.position.set(x, y, z); suit.add(m); return m; };
    add(new THREE.CylinderGeometry(0.8, 0.8, 0.3, 24), 0.15); add(new THREE.CylinderGeometry(0.2, 0.17, 0.95, 10), 0.8, -0.13); add(new THREE.CylinderGeometry(0.2, 0.17, 0.95, 10), 0.8, 0.13); add(new THREE.CylinderGeometry(0.28, 0.22, 0.75, 12), 1.65);
    add(new THREE.SphereGeometry(0.15, 12, 10), 2.18); add(new THREE.ConeGeometry(0.035, 0.12, 6), 2.37, -0.07); add(new THREE.ConeGeometry(0.035, 0.12, 6), 2.37, 0.07); add(new THREE.CylinderGeometry(0.08, 0.07, 0.7, 8), 1.6, -0.36).rotation.x = 0.1; add(new THREE.CylinderGeometry(0.08, 0.07, 0.7, 8), 1.6, 0.36).rotation.x = -0.1;
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.6), new THREE.MeshStandardMaterial({ color: 0x0c0c0e, side: THREE.DoubleSide, roughness: 0.7 })); cape.position.set(-0.28, 1.2, 0); cape.rotation.y = Math.PI / 2; suit.add(cape);
    const em = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), M.gelb); em.position.set(0.29, 1.8, 0); em.rotation.y = Math.PI / 2; suit.add(em);
    // runder Stahlkaefig mit Betondeckel (Nicolas 2026-11-17, Filmbild "der Anzug faehrt so aus dem Boden"): 12 Staebe, 3 Ringe, Deckel oben = Bodenluke im eingefahrenen Zustand
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.5, 0.06), M.stahl); bar.position.set(Math.cos(a) * 1.0, 1.25, Math.sin(a) * 1.0); suit.add(bar); }
    for (const y of [0.25, 1.3, 2.35]) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.035, 6, 32), M.stahl); r.rotation.x = Math.PI / 2; r.position.y = y; suit.add(r); }
    { const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.25, 32), M.block); lid.position.y = 2.625; suit.add(lid); const pl = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 32), M.stahl); pl.position.y = 0.04; suit.add(pl); } }
  { const p = f.W(-14, -14, 0); suit.position.set(p[0], YF - 2.75, p[2]); suit.rotation.y = Math.atan2(ax, az); suit.userData.keep = true; scene.add(suit); }
  { const ring = new THREE.Mesh(new THREE.RingGeometry(1.18, 1.32, 40).rotateX(-Math.PI / 2), M.dunkel), p = f.W(-14, -14, YF + 0.004); ring.position.set(p[0], p[1], p[2]); ring.userData.keep = true; scene.add(ring); }   // dunkler Spalt um die Luke
  const cageSolid = dk(-14, -14, 2.3, 2.3, YF, YF + 2.75, { floor: 1, m: 0.05 }); cageSolid.on = false;   // Kaefig steht oben im Weg (Deckel begehbar)
  const suitHit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 2.2), new THREE.MeshBasicMaterial({ visible: false })); { const p = f.W(-14, -14, YF + 0.3);   // Schalter = Bodenluke (die Figur selbst ist der Batsuit zum Nehmen)
 suitHit.position.set(p[0], p[1], p[2]); scene.add(suitHit); }
  gates.push({ name: "Anzug", g: suitHit, open: 0, target: 0, dur: 5, verbs: ["hochfahren", "versenken"], msgs: ["Der Anzug fährt aus dem Boden", "Der Anzug fährt in den Boden"], a: W(-15, -14), b: W(-13, -14), near: 8, anim: k => { suit.position.y = YF - 2.75 + k * 2.75; cageSolid.on = k > 0.3; } });
  // Wandtore mit Motorrad und Batpod (Nischen in der Wand b = -HB, Tore fahren hoch)
  const niche = (a0, label, spec, build) => { const a1 = a0 + 4, d = 4; room(a0 + 0.4, a1 - 0.4, -HB - d + 0.4, -HB + 0.5, YF - 1, YF + 3.2); dk((a0 + a1) / 2, -HB - d / 2, 4, d, YF - 0.5, YF, { ceil: 0 });
    q("wand", a0, -HB - d, a1, -HB - d, YF, YF + 3.2, dW(0, 1)); q("wand", a0, -HB, a0, -HB - d, YF, YF + 3.2, dW(1, 0)); q("wand", a1, -HB - d, a1, -HB, YF, YF + 3.2, dW(-1, 0));
    gbvQuad(B("licht"), f.W(a0, -HB - d, YF + 3.2), f.W(a1, -HB - d, YF + 3.2), f.W(a1, -HB, YF + 3.2), f.W(a0, -HB, YF + 3.2), [0, -1, 0], [[0, 0], [2, 0], [2, 2], [0, 2]]); gbvQuad(B("boden"), f.W(a0, -HB - d, YF), f.W(a1, -HB - d, YF), f.W(a1, -HB, YF), f.W(a0, -HB, YF), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 4), M.wand); const p = f.W((a0 + a1) / 2, -HB + 0.05, YF + 1.6); door.position.set(p[0], p[1], p[2]); door.rotation.y = Math.atan2(ax, az); door.userData.keep = true; scene.add(door);
    const solid = dk((a0 + a1) / 2, -HB + 0.1, 4, 0.3, YF, YF + 3.2, { floor: 0, m: 0.1 });
    gates.push({ name: "Wandtor (" + label + ")", g: door, open: 0, target: 0, dur: 3, a: W(a0, -HB), b: W(a1, -HB), near: 10, solid, y0: YF + 1.6, lift: 3.2, anim: k => { door.position.y = YF + 1.6 + k * 3.2; solid.on = k < 0.5; } });
    if (typeof addVehicle === "function" && spec) { const [x, z] = W((a0 + a1) / 2, -HB - d / 2); addVehicle(spec, build, x, z, YF, Math.atan2(bx, bz) + Math.PI, label + " (Geheimbasis)", 0x16181b); } };
  niche(-30, "Motorrad", typeof SPEC_BIKE !== "undefined" ? SPEC_BIKE : null, () => buildBike(0x15171a)); niche(-22, "Batpod", typeof SPEC_BATPOD !== "undefined" ? SPEC_BATPOD : null, () => buildBatpod());
  // Computer-Ecke (Nicolas 2026-11-17, Filmbilder: "dort unten hat es auch einen Computer und einen Server in einer Ecke"): schwerer Betonblock als Tisch, darueber eine
  // niedrige Betonplatte als Vordach mit Spots auf einer rostigen Saeule, Stahlgestell mit sechs Bildschirmen (Ueberwachung, Nachrichten, Stadtplan), Server-Schrank mit
  // blinkenden LEDs (Blau/Gruen), Stuhl, Kleinkram auf dem Tisch, Stahlklappen an der Wand dahinter. Wand b = -HB, um a 24.
  { const A0 = 24, wb = -HB, tb = wb + 3.4;
    box("block", A0, tb, 6.5, 1.7, YF, YF + 0.86); dk(A0, tb, 6.5, 1.7, YF, YF + 0.86, { floor: 0 });                                      // Betontisch
    box("block", A0 - 0.6, wb + 3.4, 11.5, 6.8, YF + 3.3, YF + 3.75); box("block", A0 - 0.6, wb + 6.75, 11.5, 0.12, YF + 3.15, YF + 3.75);    // Vordach mit Kante
    box("rost", A0 - 5.6, wb + 6.1, 0.46, 0.46, YF, YF + 3.3); box("rost", A0 - 5.6, wb + 6.1, 0.9, 0.9, YF + 3.12, YF + 3.3); dk(A0 - 5.6, wb + 6.1, 0.5, 0.5, YF, YF + 3.3, { floor: 0 });   // Saeule
    for (let i = 0; i < 5; i++) for (let k = 0; k < 2; k++) box("spot", A0 - 4.8 + i * 2.3, wb + 2.2 + k * 3, 0.18, 0.18, YF + 3.27, YF + 3.3);   // Spots
    // Stahlgestell an der Wand, Bildschirme leicht zum Platz gedreht
    for (const da of [-3, 3]) { box("stahl", A0 + da, wb + 0.8, 0.12, 0.12, YF, YF + 3.2); } for (const y of [1.15, 2.3, 3.15]) box("stahl", A0, wb + 0.8, 6.2, 0.1, YF + y, YF + y + 0.1);
    for (let k = 0; k < 6; k++) box("stahl", A0 - 2.6 + k * 1.05, wb + 0.8, 0.05, 0.05, YF + 2.4, YF + 3.15);                                  // Fachwerk
    const mon = (da, y, w, h, r, key) => { const P0 = W(A0 + da, wb + 1.15), fq = gbvFrame({ P0, e1: [Math.cos(r) * ax - Math.sin(r) * bx, Math.cos(r) * az - Math.sin(r) * bz], e2: [Math.sin(r) * ax + Math.cos(r) * bx, Math.sin(r) * az + Math.cos(r) * bz], L1: 1, L2: 1 });
      gbvBox(out, "dunkel", fq, 0, 0, w, 0.1, YF + y, YF + y + h); gbvBox(out, key, fq, 0, 0.055, w - 0.1, 0.02, YF + y + 0.05, YF + y + h - 0.05); gbvBox(out, "stahl", fq, 0, -0.15, 0.12, 0.3, YF + y + h / 2 - 0.06, YF + y + h / 2 + 0.06); };
    mon(-2.0, 1.3, 1.6, 0.95, 0.22, "cctv"); mon(0, 1.3, 1.6, 0.95, 0, "news"); mon(2.0, 1.3, 1.6, 0.95, -0.22, "karte"); mon(-1.9, 2.35, 1.4, 0.8, 0.18, "news"); mon(0.2, 2.35, 1.4, 0.8, 0, "cctv"); mon(2.1, 2.4, 1.6, 0.9, -0.2, "cctv");
    dk(A0, wb + 1.0, 6.4, 0.6, YF, YF + 3.2, { floor: 0 });
    // Server-Schrank rechts in der Ecke mit LED-Reihen
    const sa = A0 + 4.3, sb = wb + 0.7; box("dunkel", sa, sb, 0.8, 1.1, YF, YF + 2.1); dk(sa, sb, 0.8, 1.1, YF, YF + 2.1, { floor: 0 });
    for (let k = 0; k < 9; k++) { const y = YF + 0.2 + k * 0.21; box("stahl", sa, sb + 0.555, 0.72, 0.01, y, y + 0.16); for (let j = 0; j < 4; j++) box(j % 2 ? "ledg" : "led", sa - 0.28 + j * 0.06 + (k % 3) * 0.04, sb + 0.565, 0.025, 0.01, y + 0.06, y + 0.085); }
    box("dunkel", sa - 1.0, sb, 0.8, 1.1, YF, YF + 1.6); dk(sa - 1.0, sb, 0.8, 1.1, YF, YF + 1.6, { floor: 0 }); for (let k = 0; k < 6; k++) box("led", sa - 1.25 + (k % 3) * 0.15, sb + 0.555, 0.03, 0.01, YF + 0.4 + k * 0.18, YF + 0.42 + k * 0.18);
    // Stuhl (Sitz, Lehne, Fuss), Kleinkram auf dem Tisch
    box("dunkel", A0 + 0.4, tb + 1.5, 0.55, 0.55, YF + 0.45, YF + 0.52); box("dunkel", A0 + 0.4, tb + 1.78, 0.55, 0.06, YF + 0.52, YF + 1.25); box("stahl", A0 + 0.4, tb + 1.5, 0.08, 0.08, YF, YF + 0.45);
    box("stahl", A0 - 1.8, tb - 0.2, 0.12, 0.12, YF + 0.86, YF + 1.2); box("dunkel", A0 + 1.6, tb - 0.1, 0.45, 0.32, YF + 0.86, YF + 0.88); box("karte", A0 + 1.6, tb - 0.24, 0.43, 0.02, YF + 0.88, YF + 1.15);   // Thermoskanne, Laptop
    box("stahl", A0 - 0.6, tb - 0.25, 0.55, 0.38, YF + 0.86, YF + 0.98); box("weiss", A0 + 2.7, tb + 0.3, 0.1, 0.1, YF + 0.86, YF + 0.95); box("weiss", A0 + 0.4, tb + 0.35, 0.6, 0.4, YF + 0.86, YF + 0.87);   // Koffer, Tasse, Papiere
    for (const t of [cctv, news, karte]) { t.repeat.set(-1, 1); t.offset.x = 1; }   // Bildschirme werden von der Rueckseite der Box gezeigt: Bild spiegeln, damit die Schrift lesbar ist
    // Brennoefen fuer Akten und Beweismittel (Nicolas 2026-11-17, Filmbild): zwei Stahloefen in der Wand links vom Gestell, Tuer schwenkt auf (Rechtsklick), innen Glut;
    // Abzugsrohr nach oben, davor Archivkartons mit Etiketten am Boden
    const glutM = new THREE.MeshBasicMaterial({ color: 0xff7a1a }), doorM = M.dunkel;
    for (const da of [-6.6, -8.8]) { const fa = A0 + da;
      box("stahl", fa, wb + 0.3, 1.35, 0.6, YF + 0.75, YF + 2.15); box("dunkel", fa, wb + 0.62, 1.15, 0.04, YF + 0.88, YF + 2.02); box("stahl", fa, wb + 0.3, 0.25, 0.25, YF + 2.15, YF + 4.7);   // Ofen, Oeffnung, Abzug
      box("stahl", fa - 0.45, wb + 0.5, 0.12, 0.12, YF, YF + 0.75); box("stahl", fa + 0.45, wb + 0.5, 0.12, 0.12, YF, YF + 0.75); dk(fa, wb + 0.35, 1.4, 0.7, YF, YF + 2.15, { floor: 0 });   // Stuetzen
      const pg = f.W(fa, wb + 0.66, YF + 0.95), glow = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.95), glutM); glow.position.set(pg[0], pg[1] + 0.47, pg[2]); glow.rotation.y = Math.atan2(bx, bz); glow.visible = false; glow.userData.keep = true; scene.add(glow);
      const piv = new THREE.Group(), pp = f.W(fa - 0.55, wb + 0.66, YF + 0.92); piv.position.set(pp[0], pp[1], pp[2]); piv.rotation.y = Math.atan2(bx, bz); piv.userData.keep = true; scene.add(piv); const r0 = piv.rotation.y;
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.08, 0.06), doorM); door.position.set(0.55, 0.54, 0.03); piv.add(door); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.08), M.stahl); hd.position.set(0.95, 0.6, 0.09); piv.add(hd);
      gates.push({ name: "Brennofen", g: door, open: 0, target: 0, dur: 1.2, verbs: ["öffnen", "schliessen"], a: W(fa - 0.6, wb + 0.7), b: W(fa + 0.6, wb + 0.7), near: 3, anim: k => { piv.rotation.y = r0 + k * 1.7; glow.visible = k > 0.05; } }); }
    for (const [da, db, h] of [[-5.6, 2.2, 0], [-6.25, 2.3, 0], [-7.1, 2.0, 0], [-8.0, 2.4, 0], [-8.6, 1.6, 0], [-9.3, 2.1, 0], [-6.25, 2.3, 0.32]]) { box("karton", A0 + da, wb + db, 0.5, 0.36, YF + h, YF + h + 0.31); dk(A0 + da, wb + db, 0.5, 0.36, YF, YF + h + 0.31, { floor: 1, m: 0.02 }); } }
  // Werkzeugschraenke an den Waenden (wie im Filmbild rechts)
  for (const [a, b, dir] of [[32, HB - 0.45, -1], [34, HB - 0.45, -1], [-8, HB - 0.45, -1]]) { box("dunkel", a, b, 1.6, 0.8, YF, YF + 1.9); for (let k = 0; k < 7; k++) box("stahl", a, b + dir * 0.405, 1.5, 0.01, YF + 0.15 + k * 0.24, YF + 0.17 + k * 0.24); dk(a, b, 1.6, 0.8, YF, YF + 1.9, { floor: 0 }); }
  // Aufklappbare Wand mit Waffen und Gadgets (Wand -HA, b -12..-6): Tafel davor schwenkt auf
  { const r0 = -12, r1 = -6, ah = -HA + 0.15; box("dunkel", ah + 0.05, (r0 + r1) / 2, 0.1, r1 - r0, YF + 0.4, YF + 3.6);
    for (let k = 0; k < 5; k++) { const b = r0 + 0.8 + k * 1.1; box("stahl", ah + 0.15, b, 0.12, 0.18, YF + 2.6, YF + 3.1); box("stahl", ah + 0.15, b, 0.12, 0.6, YF + 2.75, YF + 2.85); }   // Greifhaken
    for (let k = 0; k < 8; k++) { const b = r0 + 0.6 + k * 0.65, fq = gbvFrame({ P0: W(ah + 0.14, b), e1: [ax, az], e2: [bx, bz], L1: 1, L2: 1 }); gbvBox(out, "dunkel", fq, 0, 0, 0.05, 0.4, YF + 1.8, YF + 1.95); gbvBox(out, "dunkel", fq, 0, 0, 0.05, 0.15, YF + 1.7, YF + 2.05); }   // Batarangs
    for (let k = 0; k < 4; k++) box("stahl", ah + 0.15, r0 + 1 + k * 1.3, 0.1, 1.0, YF + 0.9, YF + 1.05);   // Gewehre
    const piv = new THREE.Group(), pp = f.W(ah + 0.35, r0, YF + 0.3); piv.position.set(pp[0], pp[1], pp[2]); piv.rotation.y = Math.atan2(-ax, -az); const pan = new THREE.Mesh(new THREE.BoxGeometry(r1 - r0, 3.4, 0.2), M.wand); pan.position.set((r1 - r0) / 2, 1.7, 0); piv.add(pan); piv.userData.keep = true; scene.add(piv);
    const r0p = piv.rotation.y, solid = dk(ah + 0.35, (r0 + r1) / 2, 0.3, r1 - r0, YF, YF + 3.6, { floor: 0, m: 0.1 });
    gates.push({ name: "Waffenwand", g: pan, open: 0, target: 0, dur: 2.5, verbs: ["aufklappen", "zuklappen"], a: W(ah, r0), b: W(ah, r1), near: 10, solid, anim: k => { piv.rotation.y = r0p - k * Math.PI * 0.55; solid.on = k < 0.5; } }); }
  // Geheimwand mit Tresor (Wand -HA, b 6..12): Wandstueck faehrt zur Seite, dahinter ein Tresorraum mit Goldbarren und Bargeld
  { const t0 = 6, t1 = 12, dd = 3.5; room(-HA - dd + 0.3, -HA + 0.5, t0 + 0.3, t1 - 0.3, YF - 1, YF + 3); dk(-HA - dd / 2, (t0 + t1) / 2, dd, t1 - t0, YF - 0.5, YF, { ceil: 0 });
    q("wand", -HA - dd, t1, -HA - dd, t0, YF, YF + 3, dW(1, 0)); q("wand", -HA, t0, -HA - dd, t0, YF, YF + 3, dW(0, 1)); q("wand", -HA - dd, t1, -HA, t1, YF, YF + 3, dW(0, -1));
    gbvQuad(B("licht"), f.W(-HA - dd, t0, YF + 3), f.W(-HA, t0, YF + 3), f.W(-HA, t1, YF + 3), f.W(-HA - dd, t1, YF + 3), [0, -1, 0], [[0, 0], [2, 0], [2, 3], [0, 3]]); gbvQuad(B("boden"), f.W(-HA - dd, t0, YF), f.W(-HA, t0, YF), f.W(-HA, t1, YF), f.W(-HA - dd, t1, YF), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // Batman-Tresor (Stufe 5, gotham/tresor.js; Nicolas 2026-11-18 "Tresore auch im Spiel"): an der Rueckwand, Front zur Oeffnung; ersetzt die Gold- und Geldstapel (Inhalt jetzt im Tresor)
    if (typeof tresorAdd === "function") { const p = f.W(-HA - dd + 0.8, (t0 + t1) / 2, YF), T = tresorAdd(scene, 5, "geheimbasis", new THREE.Vector3(p[0], p[1], p[2]), Math.atan2(-ax, -az), [["goldbarren", 16], ["goldbarren", 16], ["goldbarren", 16], ["jeton-10000", 10]], true);
      T.g.traverse(o => o.userData.keep = true); GCB.tresor = T; dk(-HA - dd + 0.8, (t0 + t1) / 2, 0.95, 1.05, YF, YF + 1.6, { floor: 1, m: 0.05 }); }
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, t1 - t0), M.wand), p = f.W(-HA + 0.15, (t0 + t1) / 2, YF + 1.6); wall.position.set(p[0], p[1], p[2]); wall.rotation.y = Math.atan2(bx, bz); wall.userData.keep = true; scene.add(wall);
    const solid = dk(-HA + 0.15, (t0 + t1) / 2, 0.3, t1 - t0, YF, YF + 3.2, { floor: 0, m: 0.1 }), slide = [bx * (t1 - t0 + 0.2), bz * (t1 - t0 + 0.2)];
    gates.push({ name: "Geheimwand", g: wall, open: 0, target: 0, dur: 3, verbs: ["öffnen", "schliessen"], a: W(-HA, t0), b: W(-HA, t1), near: 10, solid, anim: k => { wall.position.set(p[0] + slide[0] * k, p[1], p[2] + slide[1] * k); solid.on = k < 0.5; } }); }
  // S1 Inventar: Ausruestung, Tresor und Anzug nehmen (Rechtsklick, wenn Wand/Tresor offen bzw. Anzug oben)
  { const hit = (a, b, la, lb, y0, y1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(la, y1 - y0, lb), new THREE.MeshBasicMaterial({ visible: false })), p = f.W(a, b, (y0 + y1) / 2); m.position.set(p[0], p[1], p[2]); m.rotation.y = Math.atan2(ax, az); scene.add(m); return m; };
    const g = n => gates.find(t => t.name === n), give = (list) => { const got = []; for (const [id, n] of list) { const k = invAdd(id, n); if (k) got.push(k + " " + INV_ITEMS[id].name); } toast(got.length ? "Genommen: " + got.join(", ") : "Inventar voll"); };
    const wb = typeof invBox === "function" ? invBox("geheimbasis-waffen", "Waffenwand (Geheimbasis)", 27, [["greifhaken", 1], ["batarang", 16], ["rauchbombe", 8], ["emp", 1], ["sniper", 1], ["munition", 64], ["gewehrmunition", 40], ["brechstange", 1], ["sprenggas", 4], ["feuerzeug", 1]]) : null;   // Behaelter (N22): rein und raus wie im Inventar
    gates.push({ name: "Ausrüstung", g: hit(-HA + 0.5, -9, 0.8, 6, YF + 0.4, YF + 3.4), call: () => { if (g("Waffenwand").open < 0.9) return toast("Erst die Waffenwand aufklappen"); if (wb) invBoxOpen(wb); }, verbs: ["öffnen", "öffnen"], a: W(-HA, -12), b: W(-HA, -6), near: 5 });
    if (GCB.tresor) gates.push({ name: "Batman-Tresor", g: GCB.tresor.g, call: () => { if (g("Geheimwand").open < 0.9) return toast("Der Tresor ist hinter der Geheimwand"); tresorUse(GCB.tresor); }, verbs: ["benutzen", "benutzen"], a: W(-HA - 3, 6), b: W(-HA - 3, 12), near: 6 });
    gates.push({ name: "Batsuit", g: hit(-14, -14, 0.9, 0.9, YF + 0.9, YF + 2.6), call: () => { if (g("Anzug").open < 0.9) return toast("Erst den Anzug hochfahren"); if (invHas("batsuit")) return toast("Den Batsuit hast du schon"); give([["batsuit", 1]]); }, verbs: ["nehmen", "nehmen"], a: W(-15, -14), b: W(-13, -14), near: 4 }); }
  // Reifenstapel und Werkbank hinten
  for (const [a, b, n] of [[-38, 13, 5], [-36.6, 13, 4], [-38, 14.5, 6], [-36.6, 14.5, 3]]) for (let k = 0; k < n; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.18, 8, 16), M.reifen); const p = f.W(a, b, YF + 0.18 + k * 0.36); t.position.set(p[0], p[1], p[2]); t.rotation.x = Math.PI / 2; t.userData.keep = true; scene.add(t); }
  box("holz", -30, 15.8, 5, 1.2, YF + 0.85, YF + 0.95); for (const [a, b] of [[-32.3, 15.4], [-27.7, 15.4], [-32.3, 16.2], [-27.7, 16.2]]) box("stahl", a, b, 0.08, 0.08, YF, YF + 0.85); box("dunkel", -30, 17.4, 5, 0.06, YF + 1.2, YF + 2.6); box("gelb", -31, 15.6, 0.6, 0.35, YF + 0.95, YF + 1.25);
  dk(-30, 15.8, 5, 1.2, YF, YF + 0.95, { floor: 0 }); dk(-37.3, 13.75, 3.4, 3.4, YF, YF + 1.8, { floor: 0 });
  // Rufsaeulen fuer den Aufzug (oben neben der Tuer, unten im Gang)
  const call = (a, b, y) => { box("stahl", a, b, 0.25, 0.25, y, y + 1.2); box("gelb", a, b, 0.27, 0.27, y + 1.05, y + 1.2); const hit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), new THREE.MeshBasicMaterial({ visible: false })); const p = f.W(a, b, y + 0.7); hit.position.set(p[0], p[1], p[2]); scene.add(hit); return hit; };
  const callTop = call(aDoor + sA * 2.5, cb + CWd / 2 + 1.2, Y), callBot = call(aDoor + sA * 1.5, cb + 3.2, YF);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), new THREE.MeshBasicMaterial({ visible: false })); { const p = f.W(ca + sA * (CL / 2 - 0.4), cb - CWd / 2 + 0.4, Y + 1.25); panel.position.set(p[0], p[1], p[2]); cg.add(panel); }
  gates.push({ name: "Container-Aufzug", g: panel, call: () => gcbToggle(), verbs: ["fahren", "fahren"], a: Cg, b: Cg, near: 4 });
  gates.push({ name: "Container-Aufzug rufen", g: callTop, call: () => gcbCall(0), verbs: ["", ""], a: Cg, b: Cg, near: 4 });
  gates.push({ name: "Container-Aufzug rufen", g: callBot, call: () => gcbCall(1), verbs: ["", ""], a: Cg, b: Cg, near: 4 });
  GCB.panelGate = gates[gates.length - 3];
  // Netze (Halle unter der Erde: UNDERGROUND; Container und Rufsaeule oben normal)
  const grp = new THREE.Group(); grp.name = "Geheimbasis"; grp.userData.keep = true; grp.userData.noLift = true; const GM = gbvInit();
  for (const [key, o] of out) { if (!o.p.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2)); const m = new THREE.Mesh(geo, M[key] || GM[key]); m.receiveShadow = true; grp.add(m); }
  { const rustT = canvasTex(64, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#4a3020"); gr.addColorStop(0.45, "#7a5032"); gr.addColorStop(0.7, "#8a7a68"); gr.addColorStop(1, "#a8a49c"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(${120 + Math.random() * 80},${70 + Math.random() * 40},30,${0.15 + Math.random() * 0.3})`; c.fillRect(Math.random() * w, Math.random() * h * 0.7, 2 + Math.random() * 5, 10 + Math.random() * 60); } });
    const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1, 24).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ map: rustT, roughness: 0.85, metalness: 0.35 })), p = f.W(ca, cb, YF - 0.3);
    ram.position.set(p[0], p[1], p[2]); grp.add(ram); const col = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.1, 24), M.block); col.position.set(p[0], YF + 0.25, p[2]); grp.add(col);   // Saeule, heller Sockel
    GCB.ram = { m: ram, y0: YF - 0.3, dk: dk(ca, cb, 1.0, 1.0, YF, Y - 0.2, { floor: 0, m: 0.05 }) }; }
  scene.add(grp); UNDERGROUND.push(grp); grp.visible = typeof ugVis === "boolean" ? ugVis : false;
  bautAdd({ id: "GO-CONTAINER", name: "Seecontainer", art: "Container", poly: [W(ca - CL / 2, cb - CWd / 2), W(ca + CL / 2, cb - CWd / 2), W(ca + CL / 2, cb + CWd / 2), W(ca - CL / 2, cb + CWd / 2)], y0: Y - 1, y1: Y + CH, info: "ganz normaler 20-Fuss-Container" });
  // keine Gelaende-Schuerzen ueber Halle, Gang und Schacht (hingen sonst bis 14 m tief als gruene Waende hinein; wie bei U-Bahn und Wayne-Tiefgaragen), Bloecke neu bauen
  if (typeof GR_NOSKIRT !== "undefined") { GR_NOSKIRT.push([W(-HA - 6, -HB - 6), W(HA + 2, -HB - 6), W(HA + 2, HB + 2), W(-HA - 6, HB + 2)], [W(Math.min(ca, HA) - 2, -6), W(ca + CL, -6), W(ca + CL, 6), W(Math.min(ca, HA) - 2, 6)]); for (const b of GR.blocks) if (b.mesh) b.S = 0; }
  GCB.W = W; GCB.ca = ca; GCB.cb = cb; GCB.YF = YF;
}
// Aufzug: t 0 oben, 1 unten
function gcbToggle() { if (GCB.moving) return; GCB.target = GCB.t < 0.5 ? 1 : 0; GCB.moving = true; GCB.hatch.on = false; toast(GCB.target ? "Container fährt hinunter" : "Container fährt hinauf"); }
function gcbCall(where) { if (GCB.moving) return; if (Math.round(GCB.t) === where) return toast("Der Container ist schon da"); gcbToggle(); }
function gcbNear() { const C = typeof CAR !== "undefined" && CAR && CAR.on ? CAR : null; if (!C || !GCB.c) return false; return Math.hypot(C.x - GCB.c[0], C.z - GCB.c[1]) < 3.5; }
// je Bild (schleife.js): Fahrt, Boden mitbewegen, Tuer (offen, solange er steht), Deckel oben
function gcbStep(dt) {
  if (!GCB.cg) return;
  if (GCB.moving) { const v = dt / 7; GCB.t = GCB.target > GCB.t ? Math.min(1, GCB.t + v) : Math.max(0, GCB.t - v); if (GCB.t === GCB.target) { GCB.moving = false; GCB.panelGate.box = null; toast(GCB.t ? "Unten: Geheimbasis" : "Oben"); } }
  const k = GCB.t * GCB.t * (3 - 2 * GCB.t), dy = -GCB.drop * k;
  GCB.cg.position.y = dy; if (GCB.ram) { const R = GCB.ram; R.m.scale.y = Math.max(0.05, GCB.Y + dy - R.y0); R.dk.y1 = R.dk.top = GCB.Y + dy - 0.25; R.dk.on = R.dk.y1 > R.dk.y0 + 0.3; }   // Sperre nur bis unter die Plattform (sonst schoebe sie den Spieler im Container weg)   // Hubsaeule bis unter die Plattform
  const F = GCB.floor, F0 = GCB.floor0; F.top = F0.top + dy; F.y0 = F0.y0 + dy; F.y1 = F0.y1 + dy;
  GCB.hatch.on = GCB.t > 0.98; GCB.hatchM.visible = GCB.t > 0.02;
  const open = GCB.moving ? 0 : 1; for (const d of GCB.doors) { const cur = d.cur || 0, nx = cur + Math.sign(open - cur) * Math.min(Math.abs(open - cur), dt / 1.5); d.cur = nx; d.piv.rotation.y = d.base ?? (d.base = d.piv.rotation.y); d.piv.rotation.y = d.base + d.s * nx * Math.PI * 0.6; }
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (GCB.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = gcbGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { GCB.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
