// Wayne Manor 3D – Haus: Umriss, Geschosse, Tueren, Treppen, Garage, Raeume
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Haus-Huelle (Schritt 3) =====================
// Umriss = rote Linie der Exterior-Grounds-Karte (Pixel px/py). Zwei Geschosse, Flachdach mit Balustrade,
// sechs Ecktuerme mit Pyramidendach, Glas-Satteldach ueber der Halle. Innen leer bis auf Aufzug und Treppe.
const HOUSE_PX = [[394, 689], [423, 689], [423, 703], [466, 703], [466, 696], [537, 696], [537, 703], [581, 703], [581, 689], [610, 689], [610, 722], [581, 722],
  [581, 862], [607, 862], [607, 895], [638, 895], [638, 992], [643, 992], [643, 1022], [613, 1022], [613, 992], [597, 992], [597, 895], [580, 895], [580, 880],
  [537, 880], [537, 887], [467, 887], [467, 878], [425, 878], [425, 893], [407, 893], [407, 993], [390, 993], [390, 1023], [362, 1023], [362, 1018], [228, 1018],
  [228, 1023], [197, 1023], [197, 993], [203, 993], [203, 950], [197, 950], [197, 865], [203, 865], [203, 820], [195, 820], [195, 792], [223, 792], [223, 800],
  [297, 800], [297, 827], [398, 827], [398, 722], [394, 722]];
const HOUSE = HOUSE_PX.map(([px, py]) => mp(px, py));                   // [x, z]
const TOWERS_PX = [[394, 423, 689, 722], [581, 610, 689, 722], [613, 643, 992, 1022], [197, 228, 993, 1023], [362, 390, 993, 1023], [195, 223, 792, 820]];
const FL0 = 0.6, FLOOR_H = 4.7, FL1 = FL0 + FLOOR_H, ROOF_Y = FL0 + 2 * FLOOR_H, WT = 0.8, TILE_W = 6.25;
function inPoly(poly, x, z) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
// Flaeche in Rechtecke zerlegen (fuer Boeden/Decken als Kollisionsquader), Loecher [x0, x1, z0, z1]
function rectCover(poly, holes = []) {
  const uniq = a => [...new Set(a.map(v => Math.round(v * 100) / 100))].sort((p, q) => p - q);
  const xs = uniq([...poly.map(p => p[0]), ...holes.flatMap(h => [h[0], h[1]])]), zs = uniq([...poly.map(p => p[1]), ...holes.flatMap(h => [h[2], h[3]])]);
  const rows = [];
  for (let j = 0; j < zs.length - 1; j++) {
    const cz = (zs[j] + zs[j + 1]) / 2, row = [];
    let run = null;
    for (let i = 0; i < xs.length - 1; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2, inside = inPoly(poly, cx, cz) && !holes.some(h => cx > h[0] && cx < h[1] && cz > h[2] && cz < h[3]);
      if (inside) { if (run) run[1] = xs[i + 1]; else run = [xs[i], xs[i + 1], zs[j], zs[j + 1]]; }
      else if (run) { row.push(run); run = null; }
    }
    if (run) row.push(run);
    rows.push(row);
  }
  // gleiche Streifen untereinander zusammenlegen
  const out = [];
  let open = [];
  for (const row of rows) {
    const next = [];
    for (const r of row) {
      const prev = open.find(o => o[0] === r[0] && o[1] === r[1] && o[3] === r[2]);
      if (prev) { prev[3] = r[3]; next.push(prev); } else { out.push(r); next.push(r); }
    }
    open = next;
  }
  return out;
}
const stoneLight = M(0xdccdaa, { roughness: 0.85 });
const flatMat = (o) => M(0xffffff, { roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, ...o });
const facadeTex = lit => canvasTex(256, 200, (g, w, h) => {
  if (!lit) {
    g.fillStyle = "#cdb68c"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(90,70,40,.22)"; g.lineWidth = 1;
    for (let y = 0; y < h; y += 19) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = ((y / 19) % 2 ? 0 : 20); x < w; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 19); g.stroke(); } }
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${100 + r1() * 60},${80 + r1() * 40},40,${r1() * 0.08})`; g.fillRect(r1() * w, r1() * h, 6 + r1() * 14, 3 + r1() * 8); }
  } else { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); }
  for (const cx of [64, 192]) {
    const x0 = cx - 33, y0 = 45, ww = 66, hh = 111;
    if (!lit) { g.fillStyle = "#e8dcc0"; g.fillRect(x0 - 6, y0 - 6, ww + 12, hh + 12); g.fillStyle = "#b9a67a"; g.fillRect(x0 - 6, y0 - 11, ww + 12, 5); }
    g.fillStyle = lit ? "#ffcf7a" : "#1d2b3b"; g.fillRect(x0, y0, ww, hh);
    g.fillStyle = lit ? "#000" : "#e1d4b4"; g.fillRect(cx - 1.5, y0, 3, hh); g.fillRect(x0, y0 + hh * 0.36, ww, 3); g.fillRect(x0, y0 + hh * 0.66, ww, 3);
  }
}, 1 / TILE_W, 1 / FLOOR_H);
mat.facade = M(0xffffff, { map: facadeTex(false), emissiveMap: facadeTex(true), emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.9 });
const floorMat = M(0xb9ab92, { map: texClone(marbleTex, 1 / 2.4, 1 / 2.4), roughness: 0.45 });

// Aufzug und Treppe (Lage aus dem Hausumriss-Overlay der Hoehlenkarte "Upper Level": Westfluegel, suedoestlich vom Turm)
// Aufzug genau nach dem Hausumriss-Overlay der Karte "Upper Level" (Karte 415 / 727, Westfluegel). Dort ist nur der Aufzug
// unter dem Haus eingezeichnet: die Treppe der Hoehlenkarten verbindet nur die Hoehlenebenen (liegt im Fels, ausserhalb des Hauses).
// Die Haustreppe EG <-> 1. OG liegt noerdlich neben dem Schacht.
const SHAFT = { x0: -55.3, x1: -51.9, z0: 15.2, z1: 18.6 };
SHAFT.cx = (SHAFT.x0 + SHAFT.x1) / 2; SHAFT.cz = (SHAFT.z0 + SHAFT.z1) / 2;
const SHAFT_OUT = [SHAFT.x0 - 0.2, SHAFT.x1 + 0.2, SHAFT.z0 - 0.2, SHAFT.z1 + 0.2];
const STAIR = { x0: -55.5, x1: -49.4, z0: 10.6, z1: 14.8 };
const HOLES_FL1 = [[STAIR.x0, STAIR.x1, STAIR.z0, STAIR.z1], [SHAFT_OUT[0], SHAFT_OUT[1], STAIR.z1, SHAFT_OUT[3]]];
// Tueren (Mitte nach der Karte, Breite fest): Haupteingang Osten zum Rondell, Nord (Veranda), Sued (Pool), Nordostfluegel (Wayne Gardens)
const door = (axis, px, py, half, h, porch = false) => {
  const [x, z] = mp(px, py);
  return axis === "z" ? { axis, line: x, a0: z - half, a1: z + half, h, porch } : { axis, line: z, a0: x - half, a1: x + half, h, porch };
};
const DOORS = [door("z", 500, 887, 2, 4.4, true), door("x", 581, 790, 2, 3.6), door("x", 197, 906, 2, 3.6), door("x", 638, 940, 2, 3.6)];
// Schritt 5: Obergeschosse nach der Karte "Auxiliary Floors" (Third Floor = 2. OG auf dem Dach, Fourth Floor = 3. OG).
// Third-Floor-Zeichnung -> Aussenkarte: px = 394 + (tx - 285) / 1,1, py = 689 + (ty - 460) / 1,1; Fourth Floor = gleiche Lage, 322 px tiefer gezeichnet.
const TF = ROOF_Y + 0.3, TF2 = TF + FLOOR_H + 0.3, HP = TF + FLOOR_H + 0.3;
const UY = -16, UH = 8.5;                                                 // Hoehle oben (Upper Level)
// Treppe zwischen den Hoehlenebenen (Karte: "Stairway" suedlich vom Aufzug): zwei Laeufe a 34 Stufen, unten und oben Ausgang nach Osten
const STW = { x0: -60.2, x1: -47, z0: 19.2, z1: 23.4 };
const inRect = (R, x, z, m = 0) => x > R.x0 - m && x < R.x1 + m && z > R.z0 - m && z < R.z1 + m;
const tmp = (tx, ty) => mp(394 + (tx - 285) / 1.1, 689 + (ty - 460) / 1.1);
const rectW = (a, b) => { const [xa, za] = a, [xb, zb] = b; return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: Math.min(za, zb), z1: Math.max(za, zb) }; };
const THEATRE = rectW(tmp(287.5, 532.5), tmp(467.5, 630));             // Theatre + Storage (2. OG), darueber Observatory (3. OG)
const PARLOR = rectW(tmp(122.5, 610), tmp(215, 782.5));                // Parlor II + Martha's Garden (2. OG), darauf der Landeplatz
const CORR = rectW(tmp(215, 610), tmp(315, 635));                      // Gang zwischen beiden
const THEATRE_DIV = tmp(385, 0)[1], GARDEN_X = tmp(0, 697.5)[0];
const TSTAIR = { x0: -37.4, x1: -31.3, z0: 8.9, z1: 13.1 };              // 1. OG -> 2. OG (rote Treppe im Theatre)
const OSTAIR = { x0: -37.4, x1: -31.3, z0: 13.5, z1: 17.7 };             // 2. OG -> Observatory
// Tiefgarage (Karte "Garage", gleiche Orientierung); Ein- und Ausfahrt sind seit A1 zu (nur Treppe und Aufzug)
const gmp = (gx, gy) => mp(337 + (gx - 200) * 0.697, 827 + (gy - 166) * 0.697);
// Nicolas 2026-11-10 (Skizze): vergroessert, Nord bis z 7,5 (kurz vor dem Brunnenbecken), Sued durchgehend bis z 61,5 (Nicolas: etwas laenger als der Spectre), Kerbe in der Mitte gefuellt; Ostwand x 4,7 mit Tor zur Garagenrampe
const GARAGE = [[-7.3, 165], [277.5, 165], [277.5, 58.5], [375, 58.5], [375, 156], [380.1, 156], [380.1, 441], [-7.3, 441]].map(([gx, gy]) => gmp(gx, gy));
const GSTAIR = { x0: -46.4, x1: -38.6, z0: 14.6, z1: 16.8 };             // Garage -> EG (gerade, steigt nach Westen)
const GHOLE = [GSTAIR.x0, -40.2, GSTAIR.z0, GSTAIR.z1];                  // Deckenloch lang genug fuer Kopffreiheit (Koerper 1,8 m)
{
  // Boden (EG), Decke/Boden 1. OG, Dach (begehbar, = Boden 2. OG)
  for (const [x0, x1, z0, z1] of rectCover(HOUSE, [SHAFT_OUT, GHOLE])) B(x0, x1, 0, FL0, z0, z1, floorMat);
  for (const [x0, x1, z0, z1] of rectCover(HOUSE, HOLES_FL1)) B(x0, x1, FL1 - 0.3, FL1, z0, z1, floorMat);
  for (const [x0, x1, z0, z1] of rectCover(HOUSE, [SHAFT_OUT, [TSTAIR.x0, TSTAIR.x1, TSTAIR.z0, TSTAIR.z1]])) B(x0, x1, ROOF_Y, TF, z0, z1, mat.slate);
  // Aussenwaende entlang jeder Kante (Aussenseite genau auf der Kartenlinie), Sockel, Gurtgesims, Dachgesims
  const wallRects = [], posts = [], rails = [];
  const n = HOUSE.length;
  for (let k = 0; k < n; k++) {
    const [ax, az] = HOUSE[k], [bx, bz] = HOUSE[(k + 1) % n];
    const axis = Math.abs(az - bz) < 1e-6 ? "x" : "z";
    const a0 = axis === "x" ? Math.min(ax, bx) : Math.min(az, bz), a1 = axis === "x" ? Math.max(ax, bx) : Math.max(az, bz);
    const L = axis === "x" ? az : ax, mid = (a0 + a1) / 2;
    const s = (axis === "x" ? inPoly(HOUSE, mid, L + 0.5) : inPoly(HOUSE, L + 0.5, mid)) ? 1 : -1;   // Richtung nach innen
    const open = DOORS.filter(d => d.axis === axis && Math.abs(d.line - L) < 0.01 && d.a0 >= a0 && d.a1 <= a1).map(d => [d.a0, d.a1, FL0, FL0 + d.h]);
    wall(axis, a0, a1, L + s * WT / 2, FL0, ROOF_Y, open, mat.facade, WT);
    wallRects.push(axis === "x" ? [a0, a1, Math.min(L, L + s * WT), Math.max(L, L + s * WT)] : [Math.min(L, L + s * WT), Math.max(L, L + s * WT), a0, a1]);
    const band = (out, y0, y1, ext) => {
      const p = [L - s * out, L + s * WT].sort((u, v) => u - v);
      if (axis === "x") B(a0 - ext, a1 + ext, y0, y1, p[0], p[1], stoneLight, false); else B(p[0], p[1], y0, y1, a0 - ext, a1 + ext, stoneLight, false);
    };
    band(0.12, 0, FL0, 0.12);
    band(0.18, FL1 - 0.25, FL1 + 0.05, 0.18);
    band(0.45, ROOF_Y, ROOF_Y + 0.5, 0.45);
    // Balustrade auf dem Dachrand
    const bl = L + s * 0.15, nn = Math.max(1, Math.round((a1 - a0) / 0.9));
    for (let i = 0; i <= nn; i++) { const t = a0 + (a1 - a0) * i / nn; posts.push(axis === "x" ? [t, ROOF_Y + 0.5, bl] : [bl, ROOF_Y + 0.5, t]); }
    rails.push(axis === "x" ? [[a0, bl], [a1, bl], ROOF_Y + 0.5] : [[bl, a0], [bl, a1], ROOF_Y + 0.5]);
    const q = [L, L + s * 0.4].sort((u, v) => u - v);                   // Dachrand: nicht hinunterfallen
    if (axis === "x") S(a0, a1, TF, TF + 1.3, q[0], q[1]); else S(q[0], q[1], TF, TF + 1.3, a0, a1);
  }
  // Innenecken: fehlendes Wandquadrat an einspringenden Ecken ergaenzen
  for (const [vx, vz] of HOUSE) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = vx + sx * WT / 2, cz = vz + sz * WT / 2;
    if (!inPoly(HOUSE, cx, cz) || wallRects.some(r => cx > r[0] && cx < r[1] && cz > r[2] && cz < r[3])) continue;
    const near = [[vx + sx * 1.5, vz], [vx, vz + sz * 1.5]].every(([x, z]) => inPoly(HOUSE, x, z));
    if (!near) continue;
    B(Math.min(vx, vx + sx * WT), Math.max(vx, vx + sx * WT), FL0, ROOF_Y, Math.min(vz, vz + sz * WT), Math.max(vz, vz + sz * WT), mat.facade);
  }
  // Ecktuerme: ein Geschoss hoeher, Gesims, Pyramidendach mit Spitze, vier Tuermchen
  for (const [p0, p1, q0, q1] of TOWERS_PX) {
    const [xa, za] = mp(p0, q0), [xb, zb] = mp(p1, q1);
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), z0 = Math.min(za, zb), z1 = Math.max(za, zb), top = ROOF_Y + FLOOR_H;
    B(x0, x1, ROOF_Y, top, z0, z1, mat.facade);
    B(x0 - 0.5, x1 + 0.5, top, top + 0.6, z0 - 0.5, z1 + 0.5, stoneLight, false);
    const w = Math.max(x1 - x0, z1 - z0), roof = new THREE.Mesh(new THREE.ConeGeometry(w / 2 * Math.SQRT2, 5, 4, 1).rotateY(Math.PI / 4), mat.slate);
    roof.scale.set((x1 - x0) / w, 1, (z1 - z0) / w); roof.position.set((x0 + x1) / 2, top + 0.6 + 2.5, (z0 + z1) / 2); roof.castShadow = true; world.add(roof);
    cyl(0.04, 0.2, 1.2, mat.gold, (x0 + x1) / 2, top + 5.7, (z0 + z1) / 2, world, 8);
    for (const cx of [x0 + 0.2, x1 - 0.2]) for (const cz of [z0 + 0.2, z1 - 0.2]) {
      cyl(0.4, 0.4, 2.0, stoneLight, cx, top + 1.6, cz, world, 10);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.6, 10), mat.slate); cone.position.set(cx, top + 3.4, cz); cone.castShadow = true; world.add(cone);
    }
  }
  // Grosse Halle in der Mitte: Satteldach aus Glas (wie das Vorbild), Kamine auf dem Dach
  { const [ga, gb] = [mp(470, 702), mp(534, 752)]; gableRoof(Math.min(ga[0], gb[0]), Math.max(ga[0], gb[0]), Math.min(ga[1], gb[1]), Math.max(ga[1], gb[1]), ROOF_Y + 0.3, 3.6, 0.2, M(0x9fc3d6, { roughness: 0.15, metalness: 0.4 })); }
  for (const [cx, cz] of [[-47, 30], [-30, 47], [-12, 37], [-15, 17], [-40, -11], [-55, -2], [-8, -20], [-35, 15], [-50, 42]]) {
    if (!inPoly(HOUSE, cx, cz) || !inPoly(HOUSE, cx + 3, cz + 1)) continue;
    if ([THEATRE, PARLOR, CORR].some(r => cx > r.x0 - 4 && cx < r.x1 + 1 && cz > r.z0 - 1.5 && cz < r.z1 + 1.5)) continue;
    for (let k = 0; k < 3; k++) B(cx + k * 1.1 - 0.35, cx + k * 1.1 + 0.35, ROOF_Y + 0.3, ROOF_Y + 3 + (k % 2) * 0.6, cz - 0.35, cz + 0.35, stoneLight, false);
    B(cx - 0.6, cx + 2.8, ROOF_Y + 0.3, ROOF_Y + 2.0, cz - 0.6, cz + 0.6, stoneLight);
  }
  // Haupteingang: Vorbau mit Saeulen, Plattform und Stufen; Nebentueren mit drei Stufen
  for (const d of DOORS) {
    if (d.porch) {
      const px0 = d.line, px1 = d.line + 4.5, W = 5;
      B(px0, px1, 0, FL0, -W, W, stoneLight);
      B(px1, px1 + 0.6, 0, 0.4, -W, W, stoneLight); B(px1 + 0.6, px1 + 1.2, 0, 0.2, -W, W, stoneLight);
      for (const z of [-4.4, -1.8, 1.8, 4.4]) { cyl(0.32, 0.38, FL1 - 0.4 - FL0, stoneLight, px1 - 0.5, (FL0 + FL1 - 0.4) / 2, z, world, 14); circles.push([px1 - 0.5, z, 0.4]); }
      B(px0, px1 + 0.2, FL1 - 0.4, FL1, -W - 0.3, W + 0.3, stoneLight, false);
      for (const [a, b] of [[[px0, -W - 0.1], [px1, -W - 0.1]], [[px1, -W - 0.1], [px1, W + 0.1]], [[px0, W + 0.1], [px1, W + 0.1]]]) {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]), nn = Math.round(len / 0.9);
        for (let i = 0; i <= nn; i++) posts.push([a[0] + (b[0] - a[0]) * i / nn, FL1, a[1] + (b[1] - a[1]) * i / nn]);
        rails.push([a, b, FL1]);
      }
      continue;
    }
    const out = -Math.sign(inPoly(HOUSE, d.a0 + 0.5, d.line + 0.5) ? 1 : -1);   // nach aussen (nur Achse x)
    for (let k = 0; k < 3; k++) {
      const z0 = d.line + out * k * 0.4, z1 = d.line + out * (k + 1) * 0.4;
      B(d.a0 - 0.6, d.a1 + 0.6, 0, FL0 - k * 0.2, Math.min(z0, z1), Math.max(z0, z1), stoneLight);
    }
  }
  // Balustraden als Instanzen
  const postM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.13, 1.0, 6), stoneLight, posts.length);
  const m4 = new THREE.Matrix4();
  posts.forEach(([x, y, z], i) => { m4.makeTranslation(x, y + 0.5, z); postM.setMatrixAt(i, m4); });
  const railM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.14, 0.26), stoneLight, rails.length);
  const qq = new THREE.Quaternion(), vv = new THREE.Vector3(), ss = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  rails.forEach(([a, b, y], i) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); qq.setFromAxisAngle(up, -Math.atan2(b[1] - a[1], b[0] - a[0])); m4.compose(vv.set((a[0] + b[0]) / 2, y + 1.0, (a[1] + b[1]) / 2), qq, ss.set(len + 0.26, 1, 1)); railM.setMatrixAt(i, m4); });
  postM.castShadow = railM.castShadow = true;
  world.add(postM, railM);

  // Treppe EG -> 1. OG (U-Form, 2 x 13 Stufen): Lauf 1 nach Westen, Podest, Lauf 2 zurueck nach Osten
  const r = FLOOR_H / 26, tread = 0.3, zA = [STAIR.z0 + 0.1, STAIR.z0 + 2.05], zB = [STAIR.z0 + 2.15, STAIR.z1];
  for (let i = 0; i < 13; i++) {
    B(STAIR.x1 - (i + 1) * tread, STAIR.x1 - i * tread, FL0, FL0 + (i + 1) * r, zA[0], zA[1], mat.floorWood);
    B(STAIR.x1 - (13 - i) * tread, STAIR.x1 - (12 - i) * tread, FL0, FL0 + (14 + i) * r, zB[0], zB[1], mat.floorWood);
  }
  B(STAIR.x0 + 0.2, STAIR.x1 - 13 * tread, FL0, FL0 + 13 * r, zA[0], zB[1], mat.floorWood);
  B(STAIR.x1 - 13 * tread, STAIR.x1, FL0, FL0 + 1.0, zA[1], zB[0], mat.trim);                               // Wange zwischen den Laeufen
  // Gelaender oben um das Treppenloch (ausser am Austritt)
  B(STAIR.x1, STAIR.x1 + 0.08, FL1, FL1 + 1.0, STAIR.z0, zA[1], mat.trim);
  B(SHAFT_OUT[1], STAIR.x1 + 0.08, FL1, FL1 + 1.0, STAIR.z1, STAIR.z1 + 0.08, mat.trim);
  B(STAIR.x0, STAIR.x1 + 0.08, FL1, FL1 + 1.0, STAIR.z0 - 0.08, STAIR.z0, mat.trim);
  B(STAIR.x0 - 0.08, STAIR.x0, FL1, FL1 + 1.0, STAIR.z0, STAIR.z1, mat.trim);

  // Aufzugschacht (Tueren nach Osten in jedem Halt, ueber dem Dach ein Aufbau); schon in Endhoehe (Plateau HILL)
  NOLIFT = true;
  const STOP_Y = [LY, UY, FL0 + HILL, FL1 + HILL, TF + HILL], SH_TOP = TF + HILL + 3.5, SH_BOT = LY - 0.3;
  const [sx0, sx1, sz0, sz1] = SHAFT_OUT;
  B(sx0, sx1, SH_BOT, SH_TOP, sz0, SHAFT.z0, mat.dark); B(sx0, sx1, SH_BOT, SH_TOP, SHAFT.z1, sz1, mat.dark); B(sx0, SHAFT.x0, SH_BOT, SH_TOP, SHAFT.z0, SHAFT.z1, mat.dark);
  const dz0 = SHAFT.cz - 1, dz1 = SHAFT.cz + 1;
  B(SHAFT.x1, sx1, SH_BOT, SH_TOP, SHAFT.z0, dz0, mat.dark); B(SHAFT.x1, sx1, SH_BOT, SH_TOP, dz1, SHAFT.z1, mat.dark);
  let yy = SH_BOT;
  for (const sy of STOP_Y) { B(SHAFT.x1, sx1, yy, sy, dz0, dz1, mat.dark); yy = sy + 3; }
  B(SHAFT.x1, sx1, yy, SH_TOP, dz0, dz1, mat.dark);
  B(sx0 - 0.2, sx1 + 0.2, SH_TOP, SH_TOP + 0.3, sz0 - 0.2, sz1 + 0.2, stoneLight, false);
  for (const y of STOP_Y) B(sx1, sx1 + 0.06, y + 3.2, y + 3.4, SHAFT.cz - 0.6, SHAFT.cz + 0.6, mat.glow, false, world, false);
  NOLIFT = false;

  // U-Treppe (2 x 13 Stufen): Lauf A von x1 nach Westen, Podest, Lauf B zurueck; Gelaender oben ausser am Austritt (x1, Lauf B)
  function stairU(St, yb, yt, rails = true) {
    const r = (yt - yb) / 26, tr = 0.3, zA = [St.z0 + 0.1, St.z0 + 2.05], zB = [St.z0 + 2.15, St.z1];
    for (let i = 0; i < 13; i++) {
      B(St.x1 - (i + 1) * tr, St.x1 - i * tr, yb, yb + (i + 1) * r, zA[0], zA[1], mat.floorWood);
      B(St.x1 - (13 - i) * tr, St.x1 - (12 - i) * tr, yb, yb + (14 + i) * r, zB[0], zB[1], mat.floorWood);
    }
    B(St.x0 + 0.2, St.x1 - 13 * tr, yb, yb + 13 * r, zA[0], zB[1], mat.floorWood);
    B(St.x1 - 13 * tr, St.x1, yb, yb + 1.0, zA[1], zB[0], mat.trim);
    if (!rails) return;
    B(St.x1, St.x1 + 0.08, yt, yt + 1.0, St.z0, zA[1], mat.trim);
    B(St.x0 - 0.08, St.x1 + 0.08, yt, yt + 1.0, St.z0 - 0.08, St.z0, mat.trim); B(St.x0 - 0.08, St.x1 + 0.08, yt, yt + 1.0, St.z1, St.z1 + 0.08, mat.trim);
    B(St.x0 - 0.08, St.x0, yt, yt + 1.0, St.z0, St.z1, mat.trim);
  }
  const box4 = (R, holes = []) => rectCover([[R.x0, R.z0], [R.x1, R.z0], [R.x1, R.z1], [R.x0, R.z1]], holes);
  // Raum: vier Waende (Aussenseite auf dem Rechteck), Oeffnungen je Seite [{ side: "x0"|"x1"|"z0"|"z1", a0, a1, h }]
  function room(R, y0, y1, open, m, t = 0.5) {
    const o = side => open.filter(p => p.side === side).map(p => [p.a0, p.a1, y0, y0 + p.h]);
    wall("x", R.x0, R.x1, R.z0 + t / 2, y0, y1, o("z0"), m, t); wall("x", R.x0, R.x1, R.z1 - t / 2, y0, y1, o("z1"), m, t);
    wall("z", R.z0 + t, R.z1 - t, R.x0 + t / 2, y0, y1, o("x0"), m, t); wall("z", R.z0 + t, R.z1 - t, R.x1 - t / 2, y0, y1, o("x1"), m, t);
  }

  // ===== Tiefgarage (Boden GY, Decke = EG-Boden; ausserhalb des Hauses eigene Decke unter dem Rasen) =====
  // Sichtbeton (Nicolas 2026-11-10: Waende zu einfarbig): Schalungstafeln 2,4 x 1,2 m mit Fugen, Ankerloechern und Flecken (UV in Metern)
  mat.garageWall = M(0xffffff, { roughness: 0.92, map: canvasTex(512, 256, (g, w, h) => { const R = rng(77); g.fillStyle = "#8e9094"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const v = 128 + (R() - 0.5) * 34; g.fillStyle = `rgba(${v},${v + 1},${v + 4},.16)`; g.beginPath(); g.arc(R() * w, R() * h, 4 + R() * 26, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(60,62,66,.07)"; g.fillRect(R() * w, R() * h * 0.3, 1 + R() * 2, h * (0.3 + R() * 0.7)); }
    g.fillStyle = "#5c5e62"; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h);
    g.fillStyle = "#4a4c50"; for (const x of [1 / 6, 1 / 2, 5 / 6]) for (const y of [1 / 4, 3 / 4]) { g.beginPath(); g.arc(x * w, y * h, 5, 0, 7); g.fill(); } }, 1 / 2.4, 1 / 1.2) });
  for (const [x0, x1, z0, z1] of rectCover(GARAGE)) B(x0, x1, GY - 0.3, GY, z0, z1, mat.floorStone);
  for (const [x0, x1, z0, z1] of rectCover(GARAGE, [GHOLE])) B(x0, x1, -0.3, -0.02, z0, z1, mat.garageWall, false);
  {
    const gn = GARAGE.length, gEdges = [];
    for (let k = 0; k < gn; k++) {
      const [ax, az] = GARAGE[k], [bx, bz] = GARAGE[(k + 1) % gn];
      const axis = Math.abs(az - bz) < 1e-6 ? "x" : "z";
      const a0 = axis === "x" ? Math.min(ax, bx) : Math.min(az, bz), a1 = axis === "x" ? Math.max(ax, bx) : Math.max(az, bz);
      const L = axis === "x" ? az : ax, mid = (a0 + a1) / 2;
      const s = (axis === "x" ? inPoly(GARAGE, mid, L + 0.3) : inPoly(GARAGE, L + 0.3, mid)) ? 1 : -1;
      const carOpen = axis === "z" && Math.abs(L - CSH.x1) < 0.2 ? [[CSH.z0, CSH.z1, GY, GY + 3.6]] : axis === "z" && Math.abs(L - 4.7) < 0.2 ? [[GRAMP.D0, GRAMP.D1, GY, GY + 3.6]] : [];   // A3: Tor zum Autoaufzug; Ostwand: Tor zur Garagenrampe
      wall(axis, a0, a1, L + s * 0.25, GY, -0.02, carOpen, mat.garageWall, 0.5); gEdges.push({ axis, a0, a1, L, s, open: carOpen });
    }
    // Stellplaetze (Nicolas 2026-11-10): alle nebeneinander an den Waenden, 3,2 x 6,4 m, 1 m Abstand, 1 m von der Wand (vor den Pfeilern),
    // Front zur Hallenmitte (h); frei bleiben Tor zur Rampe, Autoaufzug, Treppenraum und die Ecken
    { const paint = M(0xeeeeea, { roughness: 0.6 }), XW = GARAGE[0][0], XE = Math.max(...GARAGE.map(p => p[0])), ZS = Math.max(...GARAGE.map(p => p[1])), ZN = Math.min(...GARAGE.filter(p => p[0] > -35.5).map(p => p[1]));
      const OFF = 1.5, BW = 3.2, BD = 6.4, PITCH = 4.2, bays = (world.userData.bays = {}); let no = 0;
      const row = (h, a0, a1, fix) => { for (let c = a0 + BW / 2; c + BW / 2 <= a1 + 1e-6; c += PITCH) { const along = h === 0 || h === Math.PI, x = along ? c : fix, z = along ? fix : c; bays[++no] = { x, z, w: along ? BW : BD, d: along ? BD : BW, h }; } };
      row(Math.PI, XW - 0.3, XE - OFF - BD - 0.6, ZN + OFF + BD / 2);                                                  // Nordwand
      row(Math.PI / 2, ZN + OFF + BD + 0.8, GRAMP.D0 - 2, XE - OFF - BD / 2);                                          // Ostwand bis vor das Rampentor
      row(0, XW + OFF + BD + 0.8, XE - 1, ZS - OFF - BD / 2);                                                          // Suedwand
      row(-Math.PI / 2, 22.5, CSH.z0 - 2.5, XW + OFF + BD / 2); row(-Math.PI / 2, CSH.z1 + 2.5, ZS - OFF - BD - 0.8, XW + OFF + BD / 2);   // Westwand ohne Autoaufzug
      world.userData.bay1 = bays[1];
      for (const [k, b] of Object.entries(bays)) { const y = GY + 0.005, x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
        B(x0, x1, y, y + 0.01, z0, z0 + 0.1, paint, false, world, false); B(x0, x1, y, y + 0.01, z1 - 0.1, z1, paint, false, world, false);
        B(x0, x0 + 0.1, y, y + 0.01, z0, z1, paint, false, world, false); B(x1 - 0.1, x1, y, y + 0.01, z0, z1, paint, false, world, false);
        const t = canvasTex(64, 64, (g, w, h) => { g.fillStyle = "#3a3d44"; g.fillRect(0, 0, w, h); g.fillStyle = "#f2f2ee"; g.font = "800 44px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(k, w / 2, h / 2 + 3); });
        const lab = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), flatMat({ map: t })), e = BD / 2 - 0.8; lab.position.set(b.x - Math.sin(b.h) * e, GY + 0.02, b.z - Math.cos(b.h) * e); lab.userData.keep = true; world.add(lab); } }
    // Gym und Werkstatt entfernt (Nicolas 2026-11-10: einfach leerer Platz)
    // Treppe Garage -> EG (26 Stufen, steigt nach Westen), Gelaender oben am Loch
    const gr = (FL0 - GY) / 26;
    for (let i = 0; i < 26; i++) B(GSTAIR.x1 - (i + 1) * 0.3, GSTAIR.x1 - i * 0.3, GY, GY + (i + 1) * gr, GSTAIR.z0, GSTAIR.z1, mat.floorStone);
    B(GHOLE[0], GHOLE[1] + 0.08, FL0, FL0 + 1, GHOLE[2] - 0.08, GHOLE[2], mat.trim); B(GHOLE[0], GHOLE[1] + 0.08, FL0, FL0 + 1, GHOLE[3], GHOLE[3] + 0.08, mat.trim);
    B(GHOLE[1], GHOLE[1] + 0.08, FL0, FL0 + 1, GHOLE[2], GHOLE[3], mat.trim);
    // Tiefgaragen-Look (Nicolas 2026-11-10): Wandpfeiler alle ca. 6,5 m (nicht in Toren, Plaetzen, Treppe, Raeumen), unten gelb-schwarz,
    // dunkler Sockelstreifen 1,2 m mit gelber Linie an allen Waenden, Unterzuege unter der Decke (ohne Kollision), Pfeile zu Rampe und Autoaufzug
    { const hazM = M(0xffffff, { roughness: 0.7, map: canvasTex(64, 64, (g, w, h) => { g.fillStyle = "#f2c230"; g.fillRect(0, 0, w, h); g.fillStyle = "#1c1d20"; for (let k = -2; k < 4; k++) { g.beginPath(); g.moveTo(k * 32, h); g.lineTo(k * 32 + 16, h); g.lineTo(k * 32 + 16 + h, 0); g.lineTo(k * 32 + h, 0); g.fill(); } }, 1 / 0.45, 1 / 0.45) });
      const pilM = mat.garageWall.clone(); pilM.color.setHex(0xeadcc4);   // Pfeiler und Unterzuege: gleicher Beton, etwas waermer (Nicolas: andere Farbe, nicht zu sehr)
      const sockM = M(0x4c4f55, { roughness: 0.85 }), lineM = M(0xf2c230, { roughness: 0.6 }), bayR = Object.values(world.userData.bays).map(b => [b.x - b.w / 2 - 0.3, b.x + b.w / 2 + 0.3, b.z - b.d / 2 - 0.5, b.z + b.d / 2 + 0.3]);
      const free = (x0, x1, z0, z1) => !solids.some(q => q.y0 < GY + 1.5 && q.y1 > GY + 0.3 && q.x0 < x1 - 0.05 && q.x1 > x0 + 0.05 && q.z0 < z1 - 0.05 && q.z1 > z0 + 0.05) && !bayR.some(b => b[0] < x1 && b[1] > x0 && b[2] < z1 && b[3] > z0);
      const box = (e, a, b, d0, d1, y0, y1, m, solid) => { const p = e.L + e.s * d0, q = e.L + e.s * d1, [c0, c1] = [Math.min(p, q), Math.max(p, q)]; return e.axis === "x" ? B(a, b, y0, y1, c0, c1, m, solid) : B(c0, c1, y0, y1, a, b, m, solid); };
      for (const e of gEdges) {
        const holes = e.open.map(o => [o[0] - 0.05, o[1] + 0.05]), cuts = [e.a0, e.a1, ...holes.flat()].sort((p, q) => p - q);
        for (let k = 0; k < cuts.length - 1; k++) { const a = cuts[k], b = cuts[k + 1]; if (b - a < 0.05 || holes.some(h => h[0] < (a + b) / 2 && h[1] > (a + b) / 2)) continue;
          box(e, a, b, 0.5, 0.52, GY, GY + 1.2, sockM, false); box(e, a, b, 0.5, 0.525, GY + 1.2, GY + 1.28, lineM, false); }   // Sockel, gelbe Linie
        const len = e.a1 - e.a0, n = Math.max(0, Math.floor((len - 2) / 6.5));
        for (let i = 1; i <= n; i++) { const c = e.a0 + len * i / (n + 1); if (holes.some(h => c > h[0] - 1 && c < h[1] + 1)) continue;
          const p = e.L + e.s * 0.5, q = e.L + e.s * 0.95, [c0, c1] = [Math.min(p, q), Math.max(p, q)];
          if (!(e.axis === "x" ? free(c - 0.3, c + 0.3, c0, c1) : free(c0, c1, c - 0.3, c + 0.3))) continue;
          box(e, c - 0.3, c + 0.3, 0.5, 0.95, GY, -0.3, pilM, true); box(e, c - 0.32, c + 0.32, 0.5, 0.97, GY, GY + 0.9, hazM, false); } }   // Wandpfeiler
      const ga = GARAGE.reduce((a, [x, z]) => [Math.min(a[0], x), Math.max(a[1], x), Math.min(a[2], z), Math.max(a[3], z)], [1e9, -1e9, 1e9, -1e9]);
      for (let x = ga[0] + 6; x < ga[1] - 1; x += 6) { let z0 = null;   // Unterzuege Nord-Sued, wo die Garage ist (nicht ueber dem Treppenloch)
        for (let z = ga[2]; z <= ga[3] + 0.25; z += 0.25) { const inn = z <= ga[3] && inPoly(GARAGE, x - 0.3, z) && inPoly(GARAGE, x + 0.3, z) && !(x > GHOLE[0] - 0.5 && x < GHOLE[1] + 0.5 && z > GHOLE[2] - 0.5 && z < GHOLE[3] + 0.5);
          if (inn && z0 === null) z0 = z; if (!inn && z0 !== null) { if (z - z0 > 1) B(x - 0.2, x + 0.2, -0.72, -0.3, z0 + 0.5, z - 0.5, pilM, false); z0 = null; } } }
      const arrow = (x, z, rot, txt) => { const t = canvasTex(256, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "rgba(242,242,236,.92)"; g.beginPath(); g.moveTo(20, 50); g.lineTo(170, 50); g.lineTo(170, 22); g.lineTo(236, 64); g.lineTo(170, 106); g.lineTo(170, 78); g.lineTo(20, 78); g.fill();
        g.font = "800 30px system-ui, sans-serif"; g.textAlign = "center"; g.fillStyle = "#1c1d20"; g.fillText(txt, 95, 75); });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 2).rotateX(-Math.PI / 2).rotateY(rot), M(0xffffff, { map: t, transparent: true, roughness: 0.6 })); m.position.set(x, GY + 0.02, z); m.userData.keep = true; world.add(m); };
      arrow(-1.5, (GRAMP.D0 + GRAMP.D1) / 2, 0, "RAMPE"); arrow(CSH.x1 + 4, (CSH.z0 + CSH.z1) / 2, Math.PI, "LIFT"); }
    // Deckenlampen
    const ga = GARAGE.reduce((a, [x, z]) => [Math.min(a[0], x), Math.max(a[1], x), Math.min(a[2], z), Math.max(a[3], z)], [1e9, -1e9, 1e9, -1e9]);
    for (let x = ga[0] + 3; x < ga[1]; x += 6) for (let z = ga[2] + 3; z < ga[3]; z += 6) if (inPoly(GARAGE, x, z)) B(x - 0.8, x + 0.8, -0.36, -0.3, z - 0.1, z + 0.1, mat.glow, false, world, false);
  }

  // ===== 2. OG (Third Floor) und 3. OG (Fourth Floor) auf dem Dach =====
  {
    const T = THEATRE, PA = PARLOR, C = CORR, top2 = TF2 + FLOOR_H;
    // Theatre/Storage, darueber Observatory: zwei Geschosse, Tuer nach Westen (zum Aufzug), Oeffnung zum Gang im Sueden
    room(T, TF, top2, [{ side: "x0", a0: SHAFT.z0, a1: SHAFT.z1, h: 3 }, { side: "z1", a0: C.x0 + 0.5, a1: C.x1 - 0.5, h: 3 }], mat.facade);
    for (const [x0, x1, z0, z1] of box4({ x0: T.x0 + 0.5, x1: T.x1 - 0.5, z0: T.z0 + 0.5, z1: T.z1 - 0.5 }, [[OSTAIR.x0, OSTAIR.x1, OSTAIR.z0, OSTAIR.z1]])) B(x0, x1, TF2 - 0.3, TF2, z0, z1, floorMat);
    B(T.x0 - 0.3, T.x1 + 0.3, top2, top2 + 0.3, T.z0 - 0.3, T.z1 + 0.3, mat.slate);
    B(T.x0 - 0.4, T.x1 + 0.4, top2 - 0.4, top2, T.z0 - 0.4, T.z1 + 0.4, stoneLight, false);
    wall("x", T.x0 + 0.5, T.x1 - 0.5, THEATRE_DIV, TF, TF2 - 0.3, [[T.x0 + 3, T.x0 + 4.6, TF, TF + 2.6]], mat.white, 0.25);
    stairU(TSTAIR, FL1, TF); stairU(OSTAIR, TF, TF2);
    // Kinosaal: Leinwand an der Trennwand, Sitzreihen; Lager: Regale
    B(T.x0 + 1, T.x0 + 9, TF + 0.8, TF + 3.6, THEATRE_DIV + 0.13, THEATRE_DIV + 0.18, new THREE.MeshBasicMaterial({ color: 0xe8ecf2 }), false, world, false);
    for (let z = THEATRE_DIV + 4; z < T.z1 - 2; z += 1.6) B(T.x0 + 1, T.x0 + 9, TF, TF + 0.5 + (z - THEATRE_DIV) * 0.03, z, z + 0.7, mat.carpet, false);
    for (let x = T.x0 + 1; x < T.x1 - 1; x += 3) { B(x, x + 1.6, TF, TF + 2.4, T.z0 + 0.6, T.z0 + 1.1, mat.wood); }
    // Observatory: Teleskop, Kuppel auf dem Dach
    const ox = (T.x0 + T.x1) / 2, oz = (T.z0 + THEATRE_DIV) / 2;
    { const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.2, 14), mat.steel); tube.position.set(ox, TF2 + 1.9, oz); tube.rotation.z = 0.6; tube.castShadow = true; world.add(tube); }
    cyl(0.3, 0.4, 1.2, mat.dark, ox, TF2 + 0.6, oz); circles.push([ox, oz, 0.5, TF2 + 1.2]);
    cyl(6.2, 6.2, 1.0, stoneLight, ox, top2 + 0.8, oz, world, 32);
    { const dome = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), M(0xd8dde2, { metalness: 0.5, roughness: 0.35 })); dome.position.set(ox, top2 + 1.3, oz); dome.castShadow = true; world.add(dome); }
    B(ox - 0.7, ox + 0.7, top2 + 1.3, top2 + 7.2, oz + 5.1, oz + 5.4, mat.dark, false);
    // Gang zum Parlor
    wall("z", T.z1, PA.z0, C.x0 + 0.25, TF, TF + FLOOR_H, [], mat.facade, 0.5); wall("z", T.z1, PA.z0, C.x1 - 0.25, TF, TF + FLOOR_H, [], mat.facade, 0.5);
    B(C.x0 - 0.2, C.x1 + 0.2, TF + FLOOR_H, HP, T.z1, PA.z0, mat.slate);
    // Parlor II (Stein) und Martha's Garden (Glashaus), Durchgang dazwischen; Dach = Hubschrauberlandeplatz
    const PL = { x0: PA.x0, x1: GARDEN_X, z0: PA.z0, z1: PA.z1 }, GD = { x0: GARDEN_X, x1: PA.x1, z0: PA.z0, z1: PA.z1 }, mz = (PA.z0 + PA.z1) / 2;
    room(PL, TF, TF + FLOOR_H, [{ side: "z0", a0: C.x0 + 0.5, a1: C.x1 - 0.5, h: 3 }, { side: "x1", a0: mz - 1, a1: mz + 1, h: 2.8 }], mat.facade);
    room(GD, TF, TF + FLOOR_H, [{ side: "x0", a0: mz - 1, a1: mz + 1, h: 2.8 }], M(0xbfe3d2, { transparent: true, opacity: 0.35, roughness: 0.1 }), 0.12);
    for (let x = GD.x0 + 1.5; x < GD.x1 - 1; x += 2.2) for (const z of [GD.z0 + 1.2, GD.z1 - 1.2]) { B(x - 0.5, x + 0.5, TF, TF + 0.6, z - 0.5, z + 0.5, mat.wood); const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), mat.leaves); p.position.set(x, TF + 1.1, z); world.add(p); }
    B(PL.x0 + 2, PL.x0 + 3, TF, TF + 0.8, mz - 2, mz + 2, mat.cloth); B(PL.x0 + 5, PL.x0 + 6.5, TF, TF + 0.5, mz - 1, mz + 1, mat.wood);
    B(PA.x0 - 0.2, PA.x1 + 0.2, TF + FLOOR_H, HP, PA.z0 - 0.2, PA.z1 + 0.2, mat.concrete);
    const hx = (PA.x0 + PA.x1) / 2, hTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#3b3e44"; g.fillRect(0, 0, w, h); g.strokeStyle = "#f2d33b"; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.stroke(); g.fillStyle = "#f2f2ee"; g.font = "900 150px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("H", 128, 136); });
    hTex.repeat.set(1, 1);
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(13, 13).rotateX(-Math.PI / 2).rotateY(Math.PI / 2), flatMat({ map: hTex })); pad.position.set(hx, HP + 0.02, mz); pad.userData.keep = true; world.add(pad);
    // Treppe zum Landeplatz (aussen am Gang, steigt nach Sueden), Bruestung um den Landeplatz mit Luecke an der Treppe
    const HS = { x0: C.x1 + 0.2, x1: C.x1 + 2.2, z1: PA.z0 }, nS = 29, hr = (HP - TF) / nS; HS.z0 = HS.z1 - nS * 0.3;
    for (let i = 0; i < nS; i++) B(HS.x0, HS.x1, TF, TF + (i + 1) * hr, HS.z0 + i * 0.3, HS.z0 + (i + 1) * 0.3, stoneLight);
    const par = (x0, x1, z0, z1) => B(x0, x1, HP, HP + 0.7, z0, z1, stoneLight);
    par(PA.x0 - 0.2, HS.x0, PA.z0 - 0.2, PA.z0 + 0.1); par(HS.x1, PA.x1 + 0.2, PA.z0 - 0.2, PA.z0 + 0.1); par(PA.x0 - 0.2, PA.x1 + 0.2, PA.z1 - 0.1, PA.z1 + 0.2);
    par(PA.x0 - 0.2, PA.x0 + 0.1, PA.z0, PA.z1); par(PA.x1 - 0.1, PA.x1 + 0.2, PA.z0, PA.z1);
  }
}
