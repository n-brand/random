// Wayne Manor 3D – Hoehle unten: Raster, Waende, See, Tunnel, Drehscheibe, Werkstatt, Steg, Tore
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Hoehle unten (Schritt 6, Karte "Lower Level") =====================
// Alles in Pixeln der Hoehlenkarte (caveMp). Raster aus 0,6-m-Zellen: 0 = Fels, 1 = Boden, 2 = Wasser.
// Boden y LY, Wasser WL, Kanalgrund BED, Decke LY + LH (unregelmaessig). Tunnel Sued (Gotham Exit) <-> Nord (Waterfall Exit).
const WL = SEA_Y, BED = SEA_Y - 3.5;                                      // B1: Hoehlenwasser = Meer, Grund 3,5 m tiefer
const toCave = (x, z) => [CAVE_LIFT[0] - (z - SHAFT.cz) / CAVE_SC, CAVE_LIFT[1] + (x - SHAFT.cx) / CAVE_SC];
const LOW_FLOOR = [[0, 435], [212, 435], [220, 370], [250, 340], [280, 325], [295, 300], [300, 275], [320, 245], [380, 250], [395, 290], [410, 310], [450, 312], [500, 320],
  [550, 325], [580, 365], [583, 395], [610, 435], [622, 460], [736, 460], [736, 505], [470, 505], [440, 472], [0, 472]];
const LOW_DOCK = [265, 350, 468, 525];
const CHANNELS = [
  { w: 70, pts: [[100, 560], [130, 520], [200, 515], [300, 520], [400, 525], [500, 525], [605, 525]] },             // Wasserband unter dem Tunnel
  { w: 65, pts: [[130, 520], [95, 580], [80, 640], [110, 700], [165, 735], [205, 760], [222, 790]] },               // Southeast Bay
  { w: 65, pts: [[400, 525], [405, 600], [400, 660], [390, 720], [350, 770], [300, 795], [240, 795]] },             // Northeast Bay
  { w: 60, pts: [[222, 790], [205, 850], [195, 910], [205, 960], [240, 1000], [250, 1042]] }                         // zum Lake Exit
];
// B3: Hoehlensee statt der beiden Bucht-Kanaele und des Felsblocks dazwischen (Aussenrand = bisherige Aussenkanten der Kanaele),
// vom Wasserband unter dem Tunnel bis zur Engstelle zum Lake Exit (ca. 50 x 45 m). Kartenpixel, zweimal geglaettet.
let LAKE_PX = [[98, 488], [432, 488], [437, 600], [432, 660], [420, 728], [372, 795], [300, 828], [235, 830], [195, 815], [170, 780], [140, 755], [80, 705], [48, 640], [63, 580], [90, 525]];
for (let k = 0; k < 2; k++) LAKE_PX = LAKE_PX.flatMap((a, i) => { const b = LAKE_PX[(i + 1) % LAKE_PX.length]; return [[a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]]; });
const LAKE_W = LAKE_PX.map(([px, py]) => caveMp(px, py));
const LAKE_C = LAKE_W.reduce((a, [x, z]) => [a[0] + x / LAKE_W.length, a[1] + z / LAKE_W.length], [0, 0]);
function plDist(pts, px, py) {
  let m = 1e9;
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1], dx = bx - ax, dy = by - ay, t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy));
    m = Math.min(m, Math.hypot(px - ax - dx * t, py - ay - dy * t));
  }
  return m;
}
// 3 = offen (Meer vor der Meereshoehle): keine Hoehlengeometrie, keine Wand dorthin
function caveCell(x, z) {
  if (inRect(STW, x, z, 1.5)) return 1;
  if (inRect(CSH, x, z) || inRect(CGA, x, z) || inRect(CGB, x, z) || inRect(CGC, x, z) || inRect(CGE, x, z)) return 1;   // A3: Autoaufzug-Schacht und Geheimgang
  if (x > -25.8 - WF_HW - 0.5 && x < -25.8 + WF_HW + 0.5 && z < -35.0) return 3;   // A8: Nordende offen, dort beginnt der Waterfall-Exit-Tunnel
  if (seaTunDist(x, z) < SEA_TUN_W / 2) { const sd = seaD(x, z); return sd > 6 ? 3 : sd > -1.5 ? 4 : 2; }   // 4 = vor der Klippe: nur Grund
  if (x > -32.3 && x < -12 && z > 64 && z < 70) return 1;                  // Wendeplatz reicht 6 m hinter das (geschlossene) Tunnelende
  const [px, py] = toCave(x, z);
  if (px < 0 || px > 736 || py > 1042) return 0;
  if (inPoly(LOW_FLOOR, px, py)) return 1;                                   // B4: alte Anlegestelle (LOW_DOCK) entfernt
  if (plDist(TUN_PX, px, py) < 4.1 / CAVE_SC) return 1;                      // Kiesstrasse ganz auf Boden (am See hing sie ueber dem Wasser, man fiel durch)
  if (x > -28 && x < -19.5 && z > 29 && z < 50) return 1;                    // vor dem Autoaufzug breiter (Nicolas: leichter einbiegen)
  if (px > 255 && px < 372 && py > 470 && py < 500) return 2;                // B4: Wasser bis an den Tunnelrand (Weg und Treppen stehen darin)
  if (inPoly(LAKE_PX, px, py)) return 2;                                     // B3: Hoehlensee
  for (const c of CHANNELS) if (plDist(c.pts, px, py) < c.w / 2) return 2;
  if (plDist(TUN_PX, px, py) < 4.3 / CAVE_SC) return 1;                      // Hoehlentunnel breiter (Kiesstrasse 7,5 m)
  if (x > -27.6 && x < -12 && z > 40.5 && z < 70) return 1;               // Wendeplatz (Nicolas, 2026-11-08): Felswand zwischen Gotham-Tunnel und See weg
  if (x > -16.5 && x < 6.5 && z > -21 && z < 6) return 2;                    // Felsblock oestlich vom Wasserband weg, der See geht dort weiter (Nicolas)
  if ((x > -64 && x < -47 && z > -24 && z < 11) || (x > -49 && x < -24 && z > -29 && z < -17) || (x > -49 && x < -35 && z > -17.5 && z < -10.5)) return 1;   // Batcave-Ausbau West und Nord (batcave-ausbau.js)
  return 0;
}
const CELL = 0.6, CX0 = -62, CZ0 = -38, CNX = Math.ceil(196 / CELL), CNZ = Math.ceil(175 / CELL), CM = new Uint8Array(CNX * CNZ);
for (let j = 0; j < CNZ; j++) for (let i = 0; i < CNX; i++) CM[j * CNX + i] = caveCell(CX0 + (i + 0.5) * CELL, CZ0 + (j + 0.5) * CELL);
const cmAt = (i, j) => (i < 0 || j < 0 || i >= CNX || j >= CNZ) ? 0 : CM[j * CNX + i];
function caveAt(x, z) { return cmAt(Math.floor((x - CX0) / CELL), Math.floor((z - CZ0) / CELL)); }
// Wendeplatz: niedrige Steinbruestung am Seeufer (Zellen mit Wasser daneben), sonst rutscht man beim Wenden in den See
{
  const stoneM = M(0x7a756c, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 0.95 });
  for (let j = 0; j < CNZ; j++) for (let i = 0; i < CNX; i++) {
    const x = CX0 + (i + 0.5) * CELL, z = CZ0 + (j + 0.5) * CELL;
    if (x < -28 || x > -12 || z < 2 || z > 70 || (z > 14 && z < 22.5) || cmAt(i, j) !== 1) continue;   // Luecke beim Steinweg zu Treppe und Steg   // Wendeplatz und Tunnel entlang des Sees
    if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => cmAt(i + a, j + b) === 2)) continue;
    B(x - CELL / 2, x + CELL / 2, LY - 0.4, LY + 0.72 + 0.22 * vnoise(x * 0.9, z * 0.9), z - CELL / 2, z + CELL / 2, stoneM);
  }
}
const caveLights = [], gates = [];
{
  const jit = (x, z) => [x + (vnoise(x * 0.45 + 3, z * 0.45) - 0.5) * 0.7, z + (vnoise(x * 0.45, z * 0.45 + 7) - 0.5) * 0.7];
  const ceilBase = (x, z) => LY + LH - 2.6 * vnoise(x * 0.12, z * 0.12) - 1.2 * vnoise(x * 0.4 + 5, z * 0.4);
  const ceilY = (x, z) => {
    const sd = polySD(LAKE_W, x, z);
    if (sd > 6) return ceilBase(x, z);
    const dome = 1 - clamp01(Math.hypot(x - LAKE_C[0], z - LAKE_C[1]) / 28) ** 2;
    return lerp(ceilBase(x, z), SEA_Y + 12 + 2 * dome - 0.8 * vnoise(x * 0.3 + 2, z * 0.3), sst(6, -6, sd));   // B3: Gewoelbe ueber dem See
  };
  const inShaft = (x, z) => x > SHAFT_OUT[0] - 0.3 && x < SHAFT_OUT[1] + 0.3 && z > SHAFT_OUT[2] - 0.3 && z < SHAFT_OUT[3] + 0.3;
  const G = { rock: [], floor: [], bed: [], water: [] };
  const push = (arr, pts, uvf) => { for (const k of [0, 1, 2, 0, 2, 3]) { const [x, y, z] = pts[k]; arr.push(x, y, z, ...uvf(x, y, z)); } };
  const uvWall = (x, y, z) => [(x + z) * 0.25, y * 0.25], uvFlat = (x, y, z) => [x * 0.25, z * 0.25];
  const corner = (i, j) => jit(CX0 + i * CELL, CZ0 + j * CELL);
  for (let j = 0; j < CNZ; j++) for (let i = 0; i < CNX; i++) {
    const t = CM[j * CNX + i];
    if (!t || t === 3) continue;
    const c = [corner(i, j), corner(i + 1, j), corner(i + 1, j + 1), corner(i, j + 1)];   // 00, 10, 11, 01
    if (t === 4) { push(G.bed, c.map(([x, z]) => [x, BED, z]), uvFlat); continue; }
    const ccx0 = CX0 + (i + 0.5) * CELL, ccz0 = CZ0 + (j + 0.5) * CELL;
    const fy = t === 1 ? LY : BED;
    push(t === 1 ? G.floor : G.bed, c.map(([x, z]) => [x, fy, z]), uvFlat);
    if (t === 2 && !(seaTunDist(ccx0, ccz0) < SEA_TUN_W / 2 + 0.6 && seaD(ccx0, ccz0) > -19)) push(G.water, c.map(([x, z]) => [x, WL, z]), uvFlat);   // vorne deckt die Meer-Zunge
    const ccx = CX0 + (i + 0.5) * CELL, ccz = CZ0 + (j + 0.5) * CELL;
    if (!inShaft(ccx, ccz) && !inRect(STW, ccx, ccz) && !inRect(CSH_OUT, ccx, ccz)) push(G.rock, c.map(([x, z]) => [x, ceilY(x, z), z]), uvWall);
    for (const [di, dj, a, b] of [[-1, 0, 3, 0], [1, 0, 1, 2], [0, -1, 0, 1], [0, 1, 2, 3]]) {
      const nt = cmAt(i + di, j + dj), [ax, az] = c[a], [bx, bz] = c[b];
      if (nt === 0) push(G.rock, [[ax, fy, az], [bx, fy, bz], [bx, ceilY(bx, bz), bz], [ax, ceilY(ax, az), az]], uvWall);
      else if (t === 1 && nt === 2) push(G.rock, [[ax, BED, az], [bx, BED, bz], [bx, LY, bz], [ax, LY, az]], uvWall);
    }
  }
  const mk = (arr, m) => {
    const g = new THREE.BufferGeometry(), a = new Float32Array(arr), n = a.length / 5, pos = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    for (let k = 0; k < n; k++) { pos.set(a.subarray(k * 5, k * 5 + 3), k * 3); uv.set(a.subarray(k * 5 + 3, k * 5 + 5), k * 2); }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.userData.keep = true; scene.add(mesh); return mesh;
  };
  mk(G.rock, M(0x77736c, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1, flatShading: true, side: THREE.DoubleSide }));
  mk(G.floor, M(0x55575c, { map: texClone(rockTex, 1 / 3, 1 / 3), roughness: 0.95, side: THREE.DoubleSide }));
  mk(G.bed, M(0x2d3a40, { roughness: 1, side: THREE.DoubleSide }));
  mk(G.water, mat.sea);
  // Meer als Zunge in den Wassertunnel (von 20 m hinter der Klippe bis ins Meer), ueberlappt mit dem Hoehlenwasser
  {
    const curve = new THREE.CatmullRomCurve3(SEA_TUNNEL.map(([x, z]) => new THREE.Vector3(x, 0, z))), len = curve.getLength();
    let t0 = 0, t1 = 1;
    for (let t = 0; t <= 1; t += 0.002) { const p = curve.getPointAt(t), sd = seaD(p.x, p.z); if (sd < -20) t0 = t; if (sd > 4 && t1 === 1) t1 = t; }
    ribbon(curve, len, SEA_TUN_W + 1.2, mat.sea, 4, 0, { t0, t1, y: () => SEA_Y - 0.02 });
  }
  // Kollision: Boden (Zeilen-Laeufe), Wasser gesperrt, Felswaende an jeder Kante zu Fels
  const runs = (test, fn) => { for (let j = 0; j < CNZ; j++) { let s = -1; for (let i = 0; i <= CNX; i++) { const ok = i < CNX && test(i, j); if (ok && s < 0) s = i; if (!ok && s >= 0) { fn(s, i, j); s = -1; } } } };
  const X = i => CX0 + i * CELL, Z = j => CZ0 + j * CELL;
  runs((i, j) => CM[j * CNX + i] === 1, (a, b, j) => S(X(a), X(b), BED - 1.5, LY, Z(j), Z(j + 1)));   // B1: bis unter den Grund
  runs((i, j) => CM[j * CNX + i] === 2 || CM[j * CNX + i] === 4, (a, b, j) => S(X(a), X(b), BED - 0.5, BED, Z(j), Z(j + 1)));   // Grund im Wasser (man kann hinein und schwimmen)
  const isC = v => v === 1 || v === 2;
  // Wandkollision um WM nach innen geschoben: die sichtbaren Felsecken sind bis 0,35 m verrauscht, sonst sieht man durch die Wand
  const WM = 0.4;
  runs((i, j) => isC(CM[j * CNX + i]) && cmAt(i, j - 1) === 0, (a, b, j) => S(X(a), X(b), BED, LY + LH, Z(j) - 0.3 + WM, Z(j) + WM));
  runs((i, j) => isC(CM[j * CNX + i]) && cmAt(i, j + 1) === 0, (a, b, j) => S(X(a), X(b), BED, LY + LH, Z(j + 1) - WM, Z(j + 1) + 0.3 - WM));
  for (let i = 0; i < CNX; i++) for (const d of [-1, 1]) {                // senkrechte Kanten spaltenweise
    let s = -1;
    for (let j = 0; j <= CNZ; j++) {
      const ok = j < CNZ && isC(CM[j * CNX + i]) && cmAt(i + d, j) === 0;
      if (ok && s < 0) s = j;
      if (!ok && s >= 0) { const xl = d < 0 ? X(i) : X(i + 1); S(d < 0 ? xl - 0.3 + WM : xl - WM, d < 0 ? xl + WM : xl + 0.3 - WM, BED, LY + LH, Z(s), Z(j)); s = -1; }
    }
  }

  const C = (px, py) => caveMp(px, py);
  // Tunnel: Fahrbahn mit Mittellinie, Haengelampen, Schilder an beiden Enden
  const TUN = TUN_PX.map(([px, py]) => { const [x, z] = C(px, py); return new THREE.Vector3(x, 0, z); });   // Fahrbahn: Kiesstrasse am Stueck (Waterfall-Exit-Block)
  const tc = new THREE.CatmullRomCurve3(TUN, false, "centripetal"), tl = tc.getLength();
  for (let d = 4; d < tl; d += 8) { const p = tc.getPointAt(d / tl); B(p.x - 0.5, p.x + 0.5, LY + 6, LY + 6.15, p.z - 0.15, p.z + 0.15, mat.glow, false, world, false); B(p.x - 0.02, p.x + 0.02, LY + 6.15, LY + 8.5, p.z - 0.02, p.z + 0.02, mat.dark, false, world, false); }
  const sign = (text, arrow, px, py, face) => {
    const t = canvasTex(512, 128, (g, w, h) => { g.fillStyle = "#1b2a1f"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7fbf7a"; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = "#cfe8c8"; let fs = 54; do { g.font = "800 " + fs + "px system-ui, sans-serif"; fs -= 2; } while (g.measureText(text + " " + arrow).width > w - 44 && fs > 20); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text + " " + arrow, w / 2, h / 2 + 2); });
    t.repeat.set(1, 1);
    const [x, z] = C(px, py), m = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: t }));
    m.position.set(x, LY + 4, z); m.rotation.y = face; m.userData.keep = true; world.add(m);
  };
  sign("GOTHAM EXIT", "↓", 6, 453, Math.PI); sign("WATERFALL EXIT " + Math.round(WFT.sP / 10) * 10 + " m", "↑", 730, 482, 0);
  // Drehende Tiefgarage: Scheibe mit 6 Feldern, dreht langsam (vier fahrbare Tumbler darauf, siehe Fahrzeuge)
  const [rx, rz] = [-44, 12.5], rr = 60 * CAVE_SC;                          // Nicolas: 9 m nach Westen, ragte in die Kiesstrasse
  const turn = new THREE.Group(); turn.position.set(rx, LY, rz); turn.userData.dynamic = true; world.add(turn);
  { const disc = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 0.12, 48), M(0x2e3036, { metalness: 0.5, roughness: 0.4 })); disc.position.y = 0.06; turn.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.12, 6, 64).rotateX(Math.PI / 2), mat.gold); ring.position.y = 0.1; turn.add(ring);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, l = new THREE.Mesh(new THREE.BoxGeometry(rr, 0.02, 0.08), M(0xd9c27a)); l.position.set(Math.cos(a) * rr / 2, 0.13, Math.sin(a) * rr / 2); l.rotation.y = -a; turn.add(l); }
  }
  world.userData.turntable = turn;
  // Medical Bay (tuerkis): Boden getoent, OR/ICU als Glasraum, vier Betten
  const tint = (pxs, color) => { const sh = new THREE.Shape(); pxs.forEach(([px, py], k) => { const [x, z] = C(px, py); if (k) sh.lineTo(x, -z); else sh.moveTo(x, -z); }); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2), flatMat({ color, transparent: true, opacity: 0.35 })); m.position.y = LY + 0.02; m.userData.keep = true; world.add(m); };
  tint([[452, 312], [500, 320], [550, 325], [580, 365], [583, 395], [610, 435], [620, 455], [560, 457], [450, 375]], 0x3fb7a5);
  tint([[212, 435], [220, 370], [250, 340], [280, 325], [295, 300], [300, 292], [318, 340], [322, 435]], 0x8a5bc4);
  const panel = ([ax, az], [bx, bz], y0, y1, m, th = 0.08) => { const len = Math.hypot(bx - ax, bz - az), p = new THREE.Mesh(new THREE.BoxGeometry(len, y1 - y0, th), m); p.position.set((ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2); p.rotation.y = -Math.atan2(bz - az, bx - ax); world.add(p); return p; };
  const icu = [[505, 340], [530, 320], [582, 370], [560, 390]].map(([px, py]) => C(px, py)), glassW = M(0xcfeee8, { transparent: true, opacity: 0.3, roughness: 0.1 });
  for (let k = 0; k < 4; k++) panel(icu[k], icu[(k + 1) % 4], LY, LY + 3, glassW);
  { const [ax, az] = C(450, 375), [bx, bz] = C(560, 457), ang = -Math.atan2(bz - az, bx - ax);
    for (const [px, py] of [[478, 372], [498, 388], [518, 404], [538, 420]]) { const [x, z] = C(px, py), bed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.6, 1.0), mat.white); bed.position.set(x, LY + 0.3, z); bed.rotation.y = ang + Math.PI / 2; world.add(bed); circles.push([x, z, 0.6, LY + 0.6]); } }
  // Auto Repair (lila): Auffahr-Hebebuehne (C1, ersetzt die zwei einfachen), Werkzeugwagen
  // Zwei Lochblech-Schienen laengs z (je 0,6 x 4,5 m, 1 m Abstand), Auffahrt von Norden (-z, Rampen klappen beim Hochfahren hoch),
  // Radstopper im Sueden (+z), Hubzylinder in der Mitte (versenkt im Boden). Bedienpult rechts daneben: Rechtsklick/E -> in 5 s 1,8 m hoch/runter.
  // Wer oben steht, faehrt mit (Schienen = Kollisionsquader mit wanderndem y); oben 1,86 m Kopffreiheit darunter. Absenken stoppt, solange jemand darunter steht.
  {
    const [cx, cz] = C(250, 406), RIN = 0.5, RW = 0.6, RL = 4.5, T0 = LY + 0.18, TH = 0.12, RISE = 1.8, hz = RL / 2;
    const holes = (() => {
      const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
      g.fillStyle = "#9aa1a8"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#16181b";
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) for (const o of [-64, 0, 64]) { g.beginPath(); g.arc((8 + x * 16 + (y % 2) * 8) + o, 8 + y * 16, 4.2, 0, 7); g.fill(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
    })();
    const railM = M(0xffffff, { map: holes, metalness: 0.5, roughness: 0.45 }), frameM = M(0x1f4e8c, { roughness: 0.5, metalness: 0.3 }), yel = M(0xf2c230, { roughness: 0.6 });
    const chrome = M(0xdfe3e8, { metalness: 0.9, roughness: 0.18 }), dark = M(0x26282c, { roughness: 0.7, metalness: 0.4 });
    const gp = new THREE.Group(); gp.userData.dynamic = true; world.add(gp);          // alles Bewegliche + Pult (Ziel fuer Rechtsklick)
    const plat = new THREE.Group(); plat.position.set(cx, 0, cz); gp.add(plat);
    const ramps = [];
    for (const sd of [-1, 1]) {
      const xa = sd * RIN, xb = sd * (RIN + RW), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), xm = (xa + xb) / 2;
      const r = B(x0, x1, T0 - TH, T0, -hz, hz, railM, false, plat); r.material = railM.clone(); r.material.map = holes.clone(); r.material.map.repeat.set(RW * 3, RL * 3); r.material.map.needsUpdate = true;
      B(sd > 0 ? x1 : x0 - 0.04, sd > 0 ? x1 + 0.04 : x0, T0 - 0.22, T0 + 0.06, -hz, hz, frameM, false, plat);       // Aussenkante (Wange)
      B(sd > 0 ? x0 - 0.03 : x1, sd > 0 ? x0 : x1 + 0.03, T0 - 0.16, T0 + 0.03, -hz, hz, frameM, false, plat);       // Innenkante
      B(xm - 0.27, xm + 0.27, T0, T0 + 0.13, hz - 0.36, hz - 0.22, yel, false, plat);                                  // Radstopper
      B(xm - 0.27, xm + 0.27, T0, T0 + 0.02, -hz + 0.05, -hz + 0.25, yel, false, plat, false);                        // Markierung Auffahrt
      const pv = new THREE.Group(); pv.position.set(xm, T0 - 0.015, -hz); plat.add(pv);                                // Rampe am Scharnier
      B(-RW / 2, RW / 2, -0.015, 0.015, -0.9, 0, railM, false, pv); B(-RW / 2, RW / 2, -0.03, 0.04, -0.9, -0.84, yel, false, pv, false);
      ramps.push(pv);
      B(x0, x1, LY, LY + 0.06, -hz, hz, dark, false, plat, false);                                                    // Bodenrahmen (bleibt unten: wird in anim gegengerechnet)
    }
    const base = plat.children.filter(o => o.isMesh && o.material === dark);
    for (const zz of [-hz + 0.05, hz - 0.3]) B(-RIN - RW, RIN + RW, T0 - 0.24, T0 - TH, zz, zz + 0.25, frameM, false, plat);   // Quertraeger an den Enden
    B(-RIN, RIN, T0 - 0.32, T0 - TH, -0.25, 0.25, frameM, false, plat);                                               // Joch ueber dem Zylinder
    const PISTON_TOP = T0 - 0.32;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 24), dark); sleeve.position.set(cx, LY + 0.015, cz); gp.add(sleeve);
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1, 20).translate(0, 0.5, 0), chrome); piston.position.set(cx, LY, cz); piston.castShadow = true; gp.add(piston);
    // Sicherheitsmarkierung am Boden (gelb-schwarz) um die Buehne
    { const c = document.createElement("canvas"); c.width = 64; c.height = 8; const g = c.getContext("2d"); g.fillStyle = "#f2c230"; g.fillRect(0, 0, 64, 8); g.fillStyle = "#1a1a1a"; for (let k = -1; k < 9; k++) { g.beginPath(); g.moveTo(k * 8, 8); g.lineTo(k * 8 + 4, 8); g.lineTo(k * 8 + 8, 0); g.lineTo(k * 8 + 4, 0); g.fill(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping;
      const ex = RIN + RW + 0.6, ez0 = -hz - 1.1, ez1 = hz + 0.4;
      for (const [a, b2, c2, d2, len] of [[-ex, -ex + 0.1, ez0, ez1, ez1 - ez0], [ex - 0.1, ex, ez0, ez1, ez1 - ez0], [-ex, ex, ez1 - 0.1, ez1, 2 * ex]]) {
        const tm = t.clone(); tm.repeat.set(len * 2, 1); tm.needsUpdate = true; const m = M(0xffffff, { map: tm, roughness: 0.8 });
        const lenAlongZ = d2 - c2 > b2 - a; const geo = new THREE.PlaneGeometry(lenAlongZ ? d2 - c2 : b2 - a, lenAlongZ ? b2 - a : d2 - c2).rotateX(-Math.PI / 2); if (lenAlongZ) geo.rotateY(Math.PI / 2);
        const mm = new THREE.Mesh(geo, m); mm.position.set(cx + (a + b2) / 2, LY + 0.012, cz + (c2 + d2) / 2); mm.receiveShadow = true; gp.add(mm);
      } }
    // Bedienpult rechts (+x) neben dem Nordende: Saeule, Kasten, Knoepfe gruen (hoch) / rot (runter), Not-Aus
    const px = cx + RIN + RW + 1.1, pz = cz + hz - 0.6;
    B(px - 0.1, px + 0.1, LY, LY + 1.05, pz - 0.1, pz + 0.1, mat.steel);
    B(px - 0.17, px + 0.17, LY + 1.05, LY + 1.5, pz - 0.14, pz + 0.14, yel, false, gp);
    B(px - 0.19, px - 0.17, LY + 1.12, LY + 1.44, pz - 0.12, pz + 0.12, dark, false, gp, false);
    const btn = (y, z, col) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12).rotateZ(Math.PI / 2), M(col, { emissive: col, emissiveIntensity: 0.6 })); m.position.set(px - 0.205, y, z); gp.add(m); return m; };
    btn(LY + 1.36, pz - 0.05, 0x2ecc40); btn(LY + 1.26, pz - 0.05, 0xe03030);
    const stop = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16).rotateZ(Math.PI / 2), M(0xd01818, { emissive: 0x500000 })); stop.position.set(px - 0.21, LY + 1.31, pz + 0.06); gp.add(stop);
    // Kollision: Schienen und Zylinder wandern mit
    const rails = [-1, 1].map(sd => { const xa = cx + sd * RIN, xb = cx + sd * (RIN + RW); return S(Math.min(xa, xb), Math.max(xa, xb), T0 - TH, T0, cz - hz, cz + hz); });
    const pist = S(cx - 0.16, cx + 0.16, LY - 0.5, PISTON_TOP, cz - 0.16, cz + 0.16);
    const anim = f => {
      const dy = f * RISE; plat.position.y = dy;
      for (const o of base) o.position.y = LY + 0.03 - dy;                       // Bodenrahmen bleibt am Boden
      for (const pv of ramps) pv.rotation.x = -0.2 + 1.45 * sst(0, 0.25, f);    // Rampen klappen zu Beginn hoch
      piston.scale.y = Math.max(0.01, PISTON_TOP + dy - LY);
      for (const s of rails) { s.y0 = T0 - TH + dy; s.y1 = T0 + dy; }
      pist.y1 = PISTON_TOP + dy;
    };
    anim(0);
    const under = () => player.pos.x > cx - RIN - RW - 0.3 && player.pos.x < cx + RIN + RW + 0.3 && player.pos.z > cz - hz - 0.3 && player.pos.z < cz + hz + 0.3 && player.pos.y < T0 - TH + plat.position.y - 0.5;
    gates.push({ name: "Hebebühne", g: gp, open: 0, target: 0, dur: 5, anim, a: [cx, cz], b: [cx, cz], block: under,
      verbs: ["hochfahren", "absenken"], msgs: [" fährt hoch", " fährt runter"], blockMsg: "Hebebühne stoppt: jemand steht darunter" });
    world.userData.liftBay = { x: cx, z: cz, h: Math.PI, y: () => T0 + plat.position.y };   // fester Stellplatz fuer das Auto (D1): Mitte, Bug nach +z (Sueden)
  }
  { const [x, z] = C(240, 357); B(x - 0.4, x + 0.4, LY, LY + 1.0, z - 0.6, z + 0.6, M(0xb33b2e)); }
  // Anlegestelle mit Boot, Stufen zum Wasser
  // Boot (fahrbar, siehe "Boot fahren"): Rumpf mit Spitze, Kabine, Frontscheibe, Lichter; Bug zeigt lokal nach -z
  {
    const x = C(0, 522)[0] + 3.7, z = C(291.5, 0)[1], g = new THREE.Group(); g.position.set(x, WL, z); g.userData.dynamic = true; world.add(g);   // B4: in der Bootsbox, Bug an der Westwand
    const hull = new THREE.Shape(); hull.moveTo(-1.1, 3.0); hull.lineTo(1.1, 3.0); hull.lineTo(1.15, -1.6); hull.lineTo(0, -3.6); hull.lineTo(-1.15, -1.6); hull.closePath();
    const hm = new THREE.Mesh(new THREE.ExtrudeGeometry(hull, { depth: 0.9, bevelEnabled: false }).rotateX(Math.PI / 2), mat.bat); hm.position.y = 0.5; hm.castShadow = true; g.add(hm);
    B(-0.95, 0.95, 0.5, 0.56, -1.4, 2.8, mat.dark, false, g, false);                                    // Deck
    B(-0.8, 0.8, 0.56, 1.35, -0.4, 1.0, mat.bat, false, g);                                             // Kabine
    const ws = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.06), mat.glass); ws.position.set(0, 1.0, -0.62); ws.rotation.x = -0.5; g.add(ws);
    B(-0.5, 0.5, 0.56, 0.95, 1.4, 2.0, mat.dark, false, g);                                             // Sitz
    for (const sx of [-0.7, 0.7]) B(sx - 0.12, sx + 0.12, 0.62, 0.72, -2.55, -2.45, mat.glow, false, g, false);
    B(-0.25, 0.25, 0.75, 0.85, 2.98, 3.02, mat.glowRed, false, g, false);
    world.userData.boat = { g, x, z, h: Math.PI / 2, v: 0, on: false, home: { x, z, h: Math.PI / 2 } };   // Spitze nach Westen; home = Platz in der Bootsbox (B5)
  }
  // B4: Weg vom Tunnelrand und Treppe 1 aus Stein, Podest bei -31, Treppe 2 aus Holz hinunter zum U-Steg (-33,5) mit Bootsbox (offen nach Osten).
  // Kartenpixel nach der Hoehlenkarte; Treppe 1 ca. 1 m laenger als auf der Karte (flacher), Treppe 2 schliesst am Podest an.
  {
    const R = (pa, pb, qa, qb) => { const [xa, za] = C(pa, qa), [xb, zb] = C(pb, qb); return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: Math.min(za, zb), z1: Math.max(za, zb) }; };
    const stone = mat.floorStone, wood = mat.floorWood, pile = M(0x4a3727, { roughness: 0.9 }), iron = M(0x24262a, { metalness: 0.5, roughness: 0.5 });
    const W = R(321, 362, 476, 494); W.x0 -= 0.7;                            // Weg (Hallenhoehe), an den Tunnelboden angeschlossen
    B(W.x0, W.x1, BED, LY, W.z0, W.z1, stone);
    const T1 = R(350, 364, 494, 523), PODY = LY - 3, STEG = SEA_Y + 0.5;    // Treppe 1 (17 Stufen nach Osten hinab)
    const t1x0 = W.x1, t1x1 = T1.x1 + 0.6, n1 = 17, run1 = (t1x1 - t1x0) / n1;
    for (let k = 0; k < n1; k++) B(t1x0 + k * run1, t1x0 + (k + 1) * run1, BED, LY - (k + 1) * (LY - PODY) / n1, T1.z0, T1.z1, stone);
    const P = { x0: t1x1, x1: t1x1 + 2.3, z0: T1.z0, z1: T1.z1 };           // Podest
    B(P.x0, P.x1, BED, PODY, P.z0, P.z1, stone);
    const T2 = { x0: P.x0 + 0.1, x1: P.x1, z0: P.z1, z1: C(320, 0)[1] }, n2 = 17, run2 = (T2.z1 - T2.z0) / n2;   // Treppe 2 (Holz) nach Sueden hinab
    for (let k = 0; k < n2; k++) {
      const top = PODY - (k + 1) * (PODY - STEG) / n2;
      B(T2.x0, T2.x1, top - 0.12, top, T2.z0 + k * run2, T2.z0 + (k + 1) * run2, wood);
      if (k % 4 === 0) for (const x of [T2.x0 + 0.1, T2.x1 - 0.1]) cyl(0.09, 0.09, top - BED, pile, x, (top + BED) / 2, T2.z0 + (k + 0.5) * run2, world, 8);
    }
    // U-Steg aus Holz: oberer Balken, linker Arm, rechter Block; dazwischen die Bootsbox
    const top = R(265, 320, 503, 511), left = R(265, 276, 503, 553), right = R(307, 320, 511, 538);
    right.x1 = Math.max(right.x1, T2.x1);                                   // Treppe 2 landet auf dem rechten Block
    for (const r of [top, left, right]) {
      B(r.x0, r.x1, STEG - 0.15, STEG, r.z0, r.z1, wood);
      for (let x = r.x0 + 0.3; x <= r.x1 - 0.2; x += 2) for (const z of [r.z0 + 0.2, r.z1 - 0.2]) { cyl(0.13, 0.13, STEG - BED, pile, x, (STEG + BED) / 2, z, world, 8); circles.push([x, z, 0.16, STEG - 0.2]); }
      for (let x = r.x0; x < r.x1; x += 0.6) B(x, x + 0.04, STEG, STEG + 0.005, r.z0, r.z1, M(0x5b4632), false, world, false);   // Fugen
    }
    // Poller an der Bootsbox, Laternen an den Ecken
    for (const [x, z] of [[left.x1 - 0.4, left.z0 + 0.4], [right.x1 - 0.4, right.z1 - 0.4], [left.x0 + 2, left.z0 + 0.4], [right.x0 + 1.5, right.z1 - 0.4]]) { cyl(0.16, 0.2, 0.5, iron, x, STEG + 0.25, z, world, 10); cyl(0.24, 0.24, 0.08, iron, x, STEG + 0.52, z, world, 10); circles.push([x, z, 0.25, STEG + 0.6]); }
    for (const [x, z] of [[top.x0 + 0.3, top.z1 - 0.3], [top.x0 + 0.3, top.z0 + 0.3], [left.x1 - 0.3, left.z1 - 0.3], [right.x1 - 0.3, right.z0 + 0.3]]) {
      cyl(0.06, 0.08, 2.4, iron, x, STEG + 1.2, z, world, 8); circles.push([x, z, 0.12, STEG + 2.4]);
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.28), mat.glowOrange); l.position.set(x, STEG + 2.55, z); world.add(l);
    }
    { const l = new THREE.PointLight(0xffd59a, 0, 26, 1.6); l.position.set((top.x0 + right.x1) / 2, STEG + 4, (top.z0 + left.z1) / 2); l.userData.I = 30; scene.add(l); caveLights.push(l); }
  }
  // Tore (SE und NE Gate): getarnte Felswaende quer ueber den Kanal; von beiden Seiten sieht es aus, als ende die Hoehle.
  // Rechtsklick (wie die Tueren der Villa) faehrt die Wand nach oben in die Decke.
  // B3: SE/NE Gate entfernt (stuenden mitten im See). B6: ein Felstor quer ueber die Engstelle zum Lake Exit (Karte ca. 215/830, ca. 10 m)
  for (const [name, a, b] of [["Felstor (Lake Exit)", [179, 820], [251, 840]]]) {
    const A = C(...a), Bp = C(...b), len = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]) + 3.2, h = LY + LH + 1 - BED;
    const g = new THREE.Group(); g.position.set((A[0] + Bp[0]) / 2, BED, (A[1] + Bp[1]) / 2); g.rotation.y = -Math.atan2(Bp[1] - A[1], Bp[0] - A[0]);
    g.userData.dynamic = true; world.add(g);
    const rockM = M(0x77736c, { map: texClone(rockTex, 1 / 2, 1 / 2), roughness: 1, flatShading: true });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(len, h, 1.4), rockM); slab.position.y = h / 2; slab.castShadow = slab.receiveShadow = true; g.add(slab);
    const gr = rng(name.length * 97);
    for (let k = 0; k < 26; k++) {                                            // Felsbrocken auf beiden Seiten (natuerlicher Abschluss)
      const s = 0.8 + gr() * 1.8, m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), rockM);
      m.position.set((gr() - 0.5) * (len - 1), 0.5 + gr() * (h - 1), (k % 2 ? 1 : -1) * (0.5 + gr() * 0.4)); m.rotation.set(gr() * 6, gr() * 6, gr() * 6); m.scale.set(1, 1, 0.55); g.add(m);
    }
    gates.push({ name, g, open: 0, target: 0, lift: h + 0.5, a: A, b: Bp });
  }
  // (B2: der alte Felsbogen ueber dem Wassertunnel ist weg; der Batcave-Eingang ist jetzt eine Oeffnung in der Felshaut der Kueste)
  // Checkpoint I am Lake Exit
  { const [x, z] = C(255, 1036); cyl(0.12, 0.12, 3, mat.dark, x, WL + 1.5, z, world, 8); const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), mat.glowRed); l.position.set(x, WL + 3.2, z); world.add(l); }
  // Licht: einige echte Punktlichter (nur unter der Erde an, siehe applyNight), Wandlampen als Leuchtkoerper
  for (const [px, py] of [[350, 300], [385, 417], [520, 400], [250, 390], [300, 520]]) {
    const [x, z] = C(px, py), l = new THREE.PointLight(0xffe2b8, 0, 34, 1.6); l.position.set(x, LY + 6, z); l.userData.I = 55; scene.add(l); caveLights.push(l);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat.glowOrange); f.position.copy(l.position); world.add(f);
  }
}
