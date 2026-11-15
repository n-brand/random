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

// Wasser als Bild (8-m-Raster aus GOT, gleiche Flaechen wie das Spiel), erst bei Bedarf
function skWater() {
  if (SK.water) return SK.water;
  const V = SK.view, C = 8, NX = Math.ceil((V.x1 - V.x0) / C), NZ = Math.ceil((V.z1 - V.z0) / C), cv = document.createElement("canvas");
  cv.width = NX; cv.height = NZ; const c = cv.getContext("2d"), im = c.createImageData(NX, NZ), d = im.data;
  for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) { const mx = V.x0 + (i + 0.5) * C, mz = V.z0 + (k + 0.5) * C, q = (k * NX + i) * 4;
    if (GOT.sdw(mx, mz) < 0 && GOT.sdi(mx, mz) > 0) { d[q] = 0x1d; d[q + 1] = 0x3b; d[q + 2] = 0x55; d[q + 3] = 255; } }
  c.putImageData(im, 0, 0); return SK.water = { cv, C };
}

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
