// Batverse – Gotham-Karte im Spiel (T6): Pfade aus GOTHAM/GOTHAM_STADT, eigene Position, Minikarte, grosse Karte
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
// Design: docs/superpowers/specs/2026-11-15-gotham-karte-im-spiel-design.md. Farben/Strichstaerken aus gotham/index.html (Planungskarte, unveraendert).
"use strict";

// ===================== Daten: Pfade in Kartenkoordinaten (x rechts, z unten = Sueden) =====================
const SK = (() => {
  const G = GOTHAM, S = GOTHAM_STADT, paths = [], labels = [];
  const poly = (P, p = new Path2D()) => { P.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; };
  const line = (P, p = new Path2D()) => { P.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); return p; };
  const add = e => (paths.push(e), e);
  const wealthCol = w => `hsl(${20 + w * 190}, ${30 + w * 25}%, ${22 + w * 16}%)`;   // wie die Planungskarte
  // Insel: Ufer (Kies), Flaeche, Rand
  const insel = poly(GOT.insel);
  add({ p: insel, stroke: "#b8a77c", w: 14, minPx: 1.5 });
  add({ p: insel, fill: "#3a3f45", stroke: "#58606a", w: 3 });
  // Bezirke (nur auf der Insel: clip)
  for (const b of G.bezirke) add({ p: poly(b.poly), fill: wealthCol(b.wohlstand), alpha: 0.45, clip: insel });
  // Fuellbauten je Hoehenklasse, je ca. 300 in einem Pfad (Portionen fuers Vorzeichnen)
  const HB = [[0, 12, "#5b5650"], [12, 25, "#6c6760"], [25, 50, "#7f7b74"], [50, 100, "#95938e"], [100, 180, "#acadab"], [180, 999, "#c9ccd0"]];
  for (const [a, b, col] of HB) { const L = S.fuell.filter(q => q.h >= a && q.h < b);
    for (let i = 0; i < L.length; i += 300) { const p = new Path2D(); for (const q of L.slice(i, i + 300)) poly(q.c, p); add({ p, fill: col, stroke: "#1b1d20", w: 1.2, fuell: true }); } }
  // Nebenstrassen (Rand, Flaeche) je Breite
  for (const w of [...new Set(S.neben.map(s => s.w))]) { const p = new Path2D(); for (const s of S.neben) if (s.w === w) line(s.pts, p);
    add({ p, stroke: "#1b1d20", w: w + 3, minPx: 1 }); add({ p, stroke: w < 9 ? "#6f6a62" : "#7d838b", w, minPx: 0.8 }); }
  // Hauptstrassen
  for (const s of S.haupt) { const p = line(s.pts); add({ p, stroke: "#15171a", w: s.w + 5, minPx: 2 }); add({ p, stroke: "#a7adb5", w: s.w, minPx: 1.4 }); }
  // Bruecken
  for (const b of S.bruecken) { const p = line(b.pts); add({ p, stroke: "#15171a", w: b.w + 6, minPx: 2.2 }); add({ p, stroke: "#b9bfc7", w: b.w, minPx: 1.6 }); }
  // Baustellen (BS-01..08)
  { const p = new Path2D(); for (const b of S.baustellen || []) p.rect(b.x - b.w / 2, b.z - b.d / 2, b.w, b.d); add({ p, fill: "#f5a623", stroke: "#000", w: 2 }); }
  // Orte (Rechteck in Typfarbe, gedreht; Punkt-Typen als Kreis)
  for (const o of G.orte) { const T = TYPEN[o.typ] || { farbe: "#fff" }, p = new Path2D();
    if (T.punkt) p.arc(o.x, o.z, 9, 0, Math.PI * 2);
    else { const W = Math.max(o.w, 18), D = Math.max(o.d, 18), a = (o.dreh || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      poly([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [o.x + u * W / 2 * c - v * D / 2 * s, o.z + u * W / 2 * s + v * D / 2 * c]), p); }
    add({ p, fill: T.farbe, alpha: o.ebene < 0 ? 0.35 : 0.9, stroke: "#000", w: 3, ort: true });
    labels.push({ x: o.x, z: o.z - Math.max(o.d, 18) / 2 - 10, text: o.name.replace(/ \(.*\)$/, ""), size: o.typ === "wahrzeichen" || o.w > 150 ? 40 : 26, big: o.w >= 40 || o.typ === "wahrzeichen" }); }
  // Bezirksnamen: Mitte der Eckpunkte auf der Insel
  for (const b of G.bezirke) { let x = 0, z = 0, n = 0; for (const q of b.poly) if (GOT.sdi(q[0], q[1]) < 0) { x += q[0]; z += q[1]; n++; }
    if (n) labels.push({ x: x / n, z: z / n, text: b.name, size: 46, bezirk: true }); }
  return { paths, labels, view: G.ansicht, WATER: "#1d3b55", LAND: "#2f3d28" };
})();

// Pfade in einen Kontext zeichnen (Transformation Karte -> Pixel ist gesetzt; scale = Pixel je Meter fuer Mindestbreiten)
function skPaint(c, scale, from = 0, to = SK.paths.length) {
  for (let i = from; i < to; i++) { const e = SK.paths[i];
    if (e.fuell && scale < 0.05) continue;                                   // ganz herausgezoomt: Fuellbauten waeren nur Rauschen
    c.save(); if (e.clip) c.clip(e.clip); c.globalAlpha = e.alpha ?? 1;
    if (e.fill) { c.fillStyle = e.fill; c.fill(e.p); }
    c.globalAlpha = 1;
    if (e.stroke) { c.strokeStyle = e.stroke; c.lineWidth = Math.max(e.w, (e.minPx || 0) / scale); c.lineJoin = "round"; c.lineCap = "round"; if (!e.fill || e.w / 1 * scale > 0.4) c.stroke(e.p); }
    c.restore(); }
}

// Wasser als Bild (8-m-Raster aus GOT, gleiche Flaechen wie das Spiel); als Generator (je 60 Zeilen ein yield) oder am Stueck
function* skWaterGen() {
  const V = SK.view, C = 8, NX = Math.ceil((V.x1 - V.x0) / C), NZ = Math.ceil((V.z1 - V.z0) / C), cv = document.createElement("canvas");
  cv.width = NX; cv.height = NZ; const c = cv.getContext("2d"), im = c.createImageData(NX, NZ), d = im.data;
  for (let k = 0; k < NZ; k++) { for (let i = 0; i < NX; i++) { const mx = V.x0 + (i + 0.5) * C, mz = V.z0 + (k + 0.5) * C, q = (k * NX + i) * 4;
    if (GOT.sdw(mx, mz) < 0 && GOT.sdi(mx, mz) > 0) { d[q] = 0x1d; d[q + 1] = 0x3b; d[q + 2] = 0x55; d[q + 3] = 255; } } if (k % 60 === 59) yield; }
  c.putImageData(im, 0, 0); SK.water = { cv, C };
}
function skWater() { if (!SK.water) for (const _ of skWaterGen()); return SK.water; }

// ===================== Eigene Position =====================
// { mx, mz, ang (Karten-Norden = 0, im Uhrzeigersinn), mode, under }
const skDir = new THREE.Vector3();
function skPos() {
  let p = camera.position, mode = "orbit";
  if (walking && !ghost) { p = player.pos; mode = "walk"; } else if (ghost) mode = "ghost";
  for (const [o, m] of [[typeof CAR !== "undefined" && CAR, "car"], [typeof BOAT !== "undefined" && BOAT, "boat"], [typeof FLY !== "undefined" && FLY, "fly"], [typeof JET !== "undefined" && JET, "fly"]])
    if (o && o.on && o.x !== undefined) { p = { x: o.x, y: o.y ?? 0, z: o.z }; mode = m; break; }
  camera.getWorldDirection(skDir);
  const [mx, mz] = GOT.toMap(p.x, p.z), [ax, az] = GOT.toMap(p.x + skDir.x, p.z + skDir.z);
  return { mx, mz, ang: Math.atan2(ax - mx, -(az - mz)), mode, under: (p.y ?? 0) < terrainH(p.x, p.z) - 1.5 };
}

// ===================== Minikarte (unten rechts, dreht mit der Blickrichtung) =====================
// Hintergrundbild der ganzen Ansicht (SK.BGS px/m), nach dem Ladebildschirm als Kachel-Aufgabe in Portionen (hoechstens ca. 4 ms je Bild)
SK.BGS = 0.5; SK.bgDone = false; SK.bgMax = 0;
SK.mini = { on: (() => { try { return localStorage.getItem("wm-minikarte") !== "0"; } catch (e) { return true; } })(), last: null, D: 400, prev: null, v: 0 };
function* skBgGen() {
  const V = SK.view, s = SK.BGS, cv = document.createElement("canvas"); cv.width = Math.ceil((V.x1 - V.x0) * s); cv.height = Math.ceil((V.z1 - V.z0) * s);
  const c = cv.getContext("2d"); c.fillStyle = SK.LAND; c.fillRect(0, 0, cv.width, cv.height); yield;
  if (!SK.water) yield* skWaterGen(); const w = SK.water;
  c.setTransform(s, 0, 0, s, -V.x0 * s, -V.z0 * s); c.imageSmoothingEnabled = true; c.drawImage(w.cv, V.x0, V.z0, w.cv.width * w.C, w.cv.height * w.C); yield;
  for (let i = 0; i < SK.paths.length; i++) { skPaint(c, s, i, i + 1); yield; }
  SK.bg = cv; SK.bgDone = true;
}
TILES.tasks.push({ gen: null, done: false, t0: 0, last: 0, plan() {}, step() {
  if (TILES.startup || this.done || TILES.loading()) return false;
  const now = performance.now(); if (now - this.last > 8) this.t0 = now; this.last = now;   // neues Bild: eigene 4-ms-Scheibe
  if (now - this.t0 > 4) return false;
  if (!this.gen) this.gen = skBgGen();
  const a = performance.now(), r = this.gen.next(); SK.bgMax = Math.max(SK.bgMax, performance.now() - a);
  if (r.done) { this.done = true; return false; } return true; } });

function skMiniToggle() { SK.mini.on = !SK.mini.on; try { localStorage.setItem("wm-minikarte", SK.mini.on ? "1" : "0"); } catch (e) {} SK.mini.last = null;
  if (typeof toast === "function") toast("Minikarte " + (SK.mini.on ? "an" : "aus") + " (Umschalt+K)"); }

// je Bild aus schleife.js; zeichnet nur neu, wenn sich Lage, Richtung oder Massstab sichtbar aendern
function skMiniStep() {
  const el = document.getElementById("minikarte"), big = typeof skBigIsOpen === "function" && skBigIsOpen();
  const show = SK.bgDone && SK.mini.on && !big && !document.getElementById("loading");
  if (el.hidden === show) el.hidden = !show; if (!show) { SK.mini.prev = null; return; }
  const P = skPos(), now = performance.now(), M = SK.mini;
  // Massstab: zu Fuss 400 m, im Fahrzeug/Flug mit dem Tempo groesser (bis 1200 m), weich
  let v = 0; if (M.prev) { const dt = (now - M.prev.t) / 1000; if (dt > 0 && dt < 0.5) v = Math.hypot(P.mx - M.prev.mx, P.mz - M.prev.mz) / dt; } M.prev = { mx: P.mx, mz: P.mz, t: now };
  if (v < 200) M.v += (v - M.v) * 0.05;                                       // Spruenge (Teleport) nicht mitzaehlen
  const goal = P.mode === "car" || P.mode === "boat" || P.mode === "fly" ? Math.min(1200, 400 + 6 * M.v) : 400; M.D += (goal - M.D) * 0.04;
  const dpr = Math.min(2, devicePixelRatio || 1), W = Math.round(el.clientWidth * dpr);
  if (el.width !== W) { el.width = el.height = W; M.last = null; }
  const L = M.last; if (L && Math.abs(L.mx - P.mx) * W / M.D < 0.5 && Math.abs(L.mz - P.mz) * W / M.D < 0.5 && Math.abs(L.ang - P.ang) < 0.009 && Math.abs(L.D - M.D) / M.D < 0.002 && L.under === P.under) return;
  M.last = { mx: P.mx, mz: P.mz, ang: P.ang, D: M.D, under: P.under };
  const c = el.getContext("2d"), R = W / 2, k = W / M.D, V = SK.view;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, W);
  c.save(); c.beginPath(); c.arc(R, R, R - dpr, 0, Math.PI * 2); c.clip(); c.fillStyle = SK.LAND; c.fillRect(0, 0, W, W);
  c.translate(R, R); c.rotate(-P.ang); c.scale(k, k); c.translate(-P.mx, -P.mz);
  c.imageSmoothingEnabled = true; c.drawImage(SK.bg, V.x0, V.z0, SK.bg.width / SK.BGS, SK.bg.height / SK.BGS);
  c.restore();
  const txt = (t, x, y, px, col) => { c.font = `700 ${px * dpr}px system-ui, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 3 * dpr; c.strokeStyle = "#000"; c.fillStyle = col; c.strokeText(t, x, y); c.fillText(t, x, y); };
  // ausserhalb der Karte: Pfeil am Rand Richtung Kartenmitte
  if (P.mx < V.x0 || P.mx > V.x1 || P.mz < V.z0 || P.mz > V.z1) {
    const a = Math.atan2((V.x0 + V.x1) / 2 - P.mx, -((V.z0 + V.z1) / 2 - P.mz)) - P.ang, r = R - 14 * dpr;
    c.save(); c.translate(R + Math.sin(a) * r, R - Math.cos(a) * r); c.rotate(a); c.fillStyle = "#e8c547"; c.strokeStyle = "#000"; c.lineWidth = 2 * dpr;
    c.beginPath(); c.moveTo(0, -9 * dpr); c.lineTo(7 * dpr, 6 * dpr); c.lineTo(-7 * dpr, 6 * dpr); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  { const a = -P.ang, r = R - 10 * dpr; txt("N", R + Math.sin(a) * r, R - Math.cos(a) * r, 11, "#fff"); }   // Norden am Rand
  if (P.under) txt("unter Tage", R, W - 24 * dpr, 10, "#e8c547");
  // eigener Pfeil (oben = Blickrichtung)
  c.save(); c.translate(R, R); c.fillStyle = "#e8c547"; c.strokeStyle = "#000"; c.lineWidth = 2 * dpr;
  c.beginPath(); c.moveTo(0, -10 * dpr); c.lineTo(7 * dpr, 8 * dpr); c.lineTo(0, 4 * dpr); c.lineTo(-7 * dpr, 8 * dpr); c.closePath(); c.fill(); c.stroke(); c.restore();
  c.beginPath(); c.arc(R, R, R - dpr, 0, Math.PI * 2); c.lineWidth = 2 * dpr; c.strokeStyle = "rgba(255,255,255,.55)"; c.stroke();
}
