// Batverse – Gotham: Kanalisation, U1 Teil A (Nicolas 2026-11-16 "Ja, U1 Teil A"; PLAN-GOTHAM U1, Liste kanal.hauptsammler in daten.js).
// Klassisches Skript nach gotham-orte.js. Hauptsammler unter den 9 Strassen: Sohle 17 m unter der Strasse (KAN.Y = -29), Gewoelbe bis 6 m hoch;
// wo ein U-Bahn-Tunnel darueber liegt (Gleisbett -24,1), sinkt die Decke weich auf -24,9 (ca. 4 m licht).
// Querschnitt 8 m: Rinne in der Mitte (2,4 m breit, 0,3 m tief: 0,4 m war fuer die Stufenregel beim Laufen zu hoch, fliessendes Wasser), beidseits Stege 2,8 m (zu Fuss und mit dem Batpod),
// Ziegelwaende mit Gewoelbe, Lampen alle 16 m. Raeume ueber dkRoom (wie die U-Bahn: ausserhalb gilt das Gelaende = Wand), Boeden dkAdd.
// Kreuzungen: Waende, die im Innenraum eines anderen Sammlers liegen, fallen weg. Enden zu, ausser im Innenraum eines anderen; Sammler enden 16 m vor der Kaikante
// (Auslaesse mit Absturzschacht kommen mit Teil B). Gullideckel alle 70 m auf der Fahrbahn mit Leiter darunter; Rechtsklick steigt hinunter/hinauf
// (OFFENE-FRAGEN: spaeter nur mit Gullihaken aus dem Inventar S1). Netze in UNDERGROUND (nur sichtbar, wenn die Kamera unten ist).
"use strict";
const KAN = { Y: GOT.STR - 17, HW: 4, CW: 1.2, H: 6, LOW: -24.9, DS: 4, sewers: [], done: false, grp: null, waterTex: null, gullis: [] };
function* kanGen() {
  while (!GSTR.done || !UB.done || !GGEB.done) yield "wait";
  const ids = GOTHAM.kanal.hauptsammler, Y = KAN.Y, HW = KAN.HW, CW = KAN.CW, DS = KAN.DS;
  let out = new Map();
  // 1. Linien: alle 4 m, bis 16 m vor der Kaikante; Ringe schliessen
  for (const r of GSTR.roads) { if (!ids.includes(r.id)) continue; const Q = r.pts, ring = Math.hypot(Q[0][0] - Q[Q.length - 1][0], Q[0][1] - Q[Q.length - 1][1]) < 10;
    const P = []; let carry = 0; for (let i = 0; i < Q.length - 1; i++) { const [ax, az] = Q[i], [bx, bz] = Q[i + 1], L = Math.hypot(bx - ax, bz - az); for (let s = carry; s < L; s += DS) P.push([ax + (bx - ax) * s / L, az + (bz - az) * s / L]); carry = (carry - L) % DS; if (carry < 0) carry += DS; }
    if (!ring) P.push(Q[Q.length - 1].slice());
    let run = [], cutA = false; const flush = cutB => { if (run.length > 3) KAN.sewers.push({ id: r.id, name: r.name, P: run, ring: ring && run.length === P.length, outA: cutA, outB: cutB }); run = []; };
    for (const p of P) { if (GOT.edgeSD(p[0], p[1]) > -16) { flush(true); cutA = true; } else { if (!run.length && !cutA) cutA = false; run.push(p); } } flush(false); }   // outA/outB: Ende an der Kaikante (Auslass, Teil B)
  kanHubLines();
  for (const S of KAN.sewers) { if (S.hub) continue; const P = S.P, n = P.length; S.N = P.map((p, i) => { const a = P[S.ring ? (i - 1 + n) % n : Math.max(0, i - 1)], b = P[S.ring ? (i + 1) % n : Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
    // Decke je Punkt: U-Bahn-Raum darueber -> tief, weich ueber 3 Punkte
    const low = P.map(([x, z], i) => [-HW, 0, HW].some(d => dkInRoom(x + S.N[i][0] * d, -24, z + S.N[i][1] * d)));
    yield;
    S.C = P.map((_, i) => { let k = 0; for (let j = -4; j <= 4; j++) { const q = S.ring ? (i + j + n) % n : i + j; if (q >= 0 && q < n && low[q]) k = Math.max(k, 1 - Math.max(0, Math.abs(j) - 1) / 4); } return Y + KAN.H - (Y + KAN.H - KAN.LOW) * k; }); if (S.spoke) S.C = S.C.map(c => Math.min(c, -24.5)); }   // Zugaenge zum Hub: Decke unter der Hallendecke
  yield;
  // Raster fuer "liegt im Innenraum eines anderen Sammlers"
  const G = new Map(), gk = (x, z) => Math.floor(x / 16) * 100000 + Math.floor(z / 16);
  KAN.sewers.forEach((S, si) => { if (S.hub) { const [hx, hz] = S.P[0], r = S.hw + 2; for (let x = hx - r; x <= hx + r + 16; x += 16) for (let z = hz - r; z <= hz + r + 16; z += 16) { const k = gk(Math.min(x, hx + r), Math.min(z, hz + r)); let c = G.get(k); if (!c) G.set(k, c = []); if (!c.some(e => e[0] === si)) c.push([si, 0]); } return; } S.P.forEach((p, i) => { const k = gk(p[0], p[1]); let c = G.get(k); if (!c) G.set(k, c = []); c.push([si, i]); }); });
  const inOther = (x, z, si, r0) => { const i0 = Math.floor(x / 16), k0 = Math.floor(z / 16);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const [sj, j] of G.get((i0 + a) * 100000 + k0 + b) || []) { if (sj === si) continue; const S = KAN.sewers[sj], P = S.P, q = P[j], n = P.length, q2 = P[S.ring ? (j + 1) % n : Math.min(n - 1, j + 1)], r = S.hub ? S.hw + (r0 !== undefined ? 1.5 : -0.15) : r0 ?? (S.hw || HW) - 0.15;
      const dx = q2[0] - q[0], dz = q2[1] - q[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - q[0]) * dx + (z - q[1]) * dz) / L2)); const dd = Math.hypot(x - q[0] - dx * t, z - q[1] - dz * t); if (dd < r) return S.side ? S.F[j] + 2 + Math.sqrt(Math.max(0, 1 - (dd / S.hw) ** 2)) - 0.05 : Infinity; }   // Nebensammler: Hoehe seines Gewoelbes an dieser Stelle (Sturz der Hauptwand)
    return false; };
  KAN.inOther = inOther;
  yield* kanSide(G, gk);
  const brick = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#4a3a30"; c.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { const x = (k + (r % 2) * 0.5) * 64 - 32, y = r * 32, v = 70 + Math.random() * 30;
    c.fillStyle = `rgb(${v + 30},${v * 0.75},${v * 0.6})`; c.fillRect(x + 3, y + 3, 58, 26); c.fillRect(x + 3 + 256, y + 3, 58, 26); } c.fillStyle = "rgba(40,60,30,0.35)"; c.fillRect(0, h * 0.8, w, h * 0.2); }, 1, 1);
  const conc = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#5c5a55"; c.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = 70 + Math.random() * 40; c.fillStyle = `rgb(${v},${v},${v - 4})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  KAN.waterTex = canvasTex(64, 256, (c, w, h) => { c.fillStyle = "#3d4a36"; c.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(${150 + Math.random() * 60},${160 + Math.random() * 60},120,0.25)`; c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 6, 1 + Math.random() * 18); } });
  yield;
  for (const t of [brick, conc, KAN.waterTex]) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const M = { ziegel: new THREE.MeshStandardMaterial({ map: brick, roughness: 0.9, side: THREE.DoubleSide }), steg: new THREE.MeshStandardMaterial({ map: conc, roughness: 0.95 }),
    wasser: new THREE.MeshStandardMaterial({ map: KAN.waterTex, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88, emissive: 0x18200f, emissiveIntensity: 1 }),
    lampe: new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffd590, emissiveIntensity: 1.6 }), eisen: new THREE.MeshStandardMaterial({ color: 0x2a2b2d, roughness: 0.6, metalness: 0.6 }),
    pflaster: new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#3d3a35"; c.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 95 + Math.random() * 45; c.fillStyle = `rgb(${v},${v - 4},${v - 10})`; c.beginPath(); c.roundRect(x * 16 + 1 + (y % 2) * 8, y * 16 + 1, 14, 14, 4); c.fill(); } }, 1, 1), roughness: 0.95 }),
    rost: new THREE.MeshStandardMaterial({ color: 0x6b3a1f, roughness: 0.8, metalness: 0.4 }), dunkel: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1, side: THREE.DoubleSide }) };
  M.pflaster.map.wrapS = M.pflaster.map.wrapT = THREE.RepeatWrapping;
  { const gt = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#3a3d40"; for (let k = 0; k < 4; k++) { c.fillRect(k * 16, 0, 4, h); c.fillRect(0, k * 16, w, 4); } }); gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
    const sign = (txt, bg) => canvasTex(256, 96, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "bold 54px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, w / 2, h / 2 + 3); });
    const scr = canvasTex(128, 96, (c, w, h) => { c.fillStyle = "#031"; c.fillRect(0, 0, w, h); c.fillStyle = "#3f6"; c.font = "9px monospace"; for (let k = 0; k < 9; k++) c.fillText(Array.from({ length: 18 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join(""), 4, 12 + k * 10); });
    Object.assign(M, { gitter: new THREE.MeshStandardMaterial({ map: gt, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 }), stahl: new THREE.MeshStandardMaterial({ color: 0x3b3f44, metalness: 0.6, roughness: 0.5 }),
      plane: new THREE.MeshStandardMaterial({ color: 0x4a5236, roughness: 1 }), waffe: new THREE.MeshStandardMaterial({ color: 0x18191b, metalness: 0.7, roughness: 0.4 }), holz: new THREE.MeshStandardMaterial({ color: 0x5d4632, roughness: 0.9 }),
      schirm: new THREE.MeshStandardMaterial({ map: scr, emissiveMap: scr, emissive: 0xffffff, emissiveIntensity: 1.2 }), sack: new THREE.MeshStandardMaterial({ color: 0x7a1414, roughness: 0.7 }),
      gischt: new THREE.MeshStandardMaterial({ color: 0xdfe6d8, transparent: true, opacity: 0.5, roughness: 1 }), schildK: new THREE.MeshStandardMaterial({ map: sign("KANAL", "#1f4d7a"), emissiveMap: sign("KANAL", "#1f4d7a"), emissive: 0xffffff, emissiveIntensity: 0.4 }),
      schildU: new THREE.MeshStandardMaterial({ map: sign("U-BAHN", "#1f6e3a"), emissiveMap: sign("U-BAHN", "#1f6e3a"), emissive: 0xffffff, emissiveIntensity: 0.4 }) }); }
  // Schacht und Leiter unter jedem Gulli (Rohr bis in den Kanal), Deckel auf der Strasse (eigenes Netz ueber der Erde)
  const mk = (map, parent, name) => { for (const [key, b] of map) { if (!b.p.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(b.p, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(b.n, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
    const m = new THREE.Mesh(geo, M[key] || gbvInit()[key]); m.name = name + " " + key; m.receiveShadow = true; m.userData.keep = true; m.userData.noLift = true; parent.add(m); } };
  const grp = new THREE.Group(); grp.name = "Gotham Kanalisation"; KAN.grp = grp;   // Netze je Sammler (kleinere Portionen beim Aufbau)
  // 2. Netze und Kollision je Abschnitt
  const B = k => gbvBucket(out, k), V = (p, nn, d, y) => [p[0] + nn[0] * d, y, p[1] + nn[1] * d];
  const arch = 6, AR = Math.PI / arch;
  for (let si = 0; si < KAN.sewers.length; si++) { const S = KAN.sewers[si], P = S.P, n = P.length, segs = S.ring ? n : n - 1; let uu = 0; out = new Map(); if (S.hub) { kanHubBuild(out, B); yield; mk(out, grp, "Kanal-Hub"); yield; continue; } if (S.side) { kanSideBuild(S, si, out, B, V, inOther); yield; mk(out, grp, "Nebensammler " + si); yield; continue; }
    for (let i = 0; i < segs; i++) { const j = (i + 1) % n, p0 = P[i], p1 = P[j], n0 = S.N[i], n1 = S.N[j], c0 = S.C[i], c1 = S.C[j], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), u0 = uu, u1 = uu + L; uu = u1;
      const fx = (p1[0] - p0[0]) / (L || 1), fz = (p1[1] - p0[1]) / (L || 1), mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
      // Boden: Stege, Rinnenwaende, Rinnenboden, Wasser
      for (const sd of [-1, 1]) { const a = sd * CW, b = sd * HW; gbvQuad(B("steg"), V(p0, n0, a, Y), V(p1, n1, a, Y), V(p1, n1, b, Y), V(p0, n0, b, Y), [0, 1, 0], [[a / 2, u0 / 2], [a / 2, u1 / 2], [b / 2, u1 / 2], [b / 2, u0 / 2]]);
        gbvQuad(B("steg"), V(p0, n0, a, Y - 0.3), V(p1, n1, a, Y - 0.3), V(p1, n1, a, Y), V(p0, n0, a, Y), [-n0[0] * sd, 0, -n0[1] * sd], [[u0 / 2, 0], [u1 / 2, 0], [u1 / 2, 0.15], [u0 / 2, 0.15]]); }
      gbvQuad(B("steg"), V(p0, n0, -CW, Y - 0.3), V(p1, n1, -CW, Y - 0.3), V(p1, n1, CW, Y - 0.3), V(p0, n0, CW, Y - 0.3), [0, 1, 0], [[0, u0 / 2], [0, u1 / 2], [1, u1 / 2], [1, u0 / 2]]);
      gbvQuad(B("wasser"), V(p0, n0, -CW, Y - 0.12), V(p1, n1, -CW, Y - 0.12), V(p1, n1, CW, Y - 0.12), V(p0, n0, CW, Y - 0.12), [0, 1, 0], [[0, u0 / 6], [0, u1 / 6], [1, u1 / 6], [1, u0 / 6]]);
      // Waende und Gewoelbe (Seite weg, wenn im Innenraum eines anderen Sammlers)
      for (const sd of [-1, 1]) { const Wt = t => V(kanL(P[i], P[j], t), kanL(S.N[i], S.N[j], t), sd * HW, 0), NS = [0, 0.25, 0.5, 0.75, 1].some(t => { const w = Wt(t); return inOther(w[0], w[2], si); }) ? 16 : 1;   // an Einmuendungen/Kreuzungen in 25-cm-Stuecken
       for (let q = 0; q < NS; q++) { const ta = q / NS, tb = (q + 1) / NS, wm = Wt((ta + tb) / 2), om = inOther(wm[0], wm[2], si); if (om === Infinity) continue;   // im anderen Hauptsammler: keine Wand; ueber einem Nebensammler: erst ab dessen Decke
        const p0 = kanL(P[i], P[j], ta), p1 = kanL(P[i], P[j], tb), n0 = kanL(S.N[i], S.N[j], ta), n1 = kanL(S.N[i], S.N[j], tb), c0 = kanL(S.C[i], S.C[j], ta), c1 = kanL(S.C[i], S.C[j], tb), u0 = kanL(uu - L, uu, ta), u1 = kanL(uu - L, uu, tb), wb = om || Y - 0.05;
        const wt0 = c0 - Math.min(2.2, (c0 - Y) * 0.4), wt1 = c1 - Math.min(2.2, (c1 - Y) * 0.4);
        gbvQuad(B("ziegel"), V(p0, n0, sd * HW, wb), V(p1, n1, sd * HW, wb), V(p1, n1, sd * HW, wt1), V(p0, n0, sd * HW, wt0), [-n0[0] * sd, 0, -n0[1] * sd], [[u0 / 2, (wb - Y) / 2], [u1 / 2, (wb - Y) / 2], [u1 / 2, (wt1 - Y) / 2], [u0 / 2, (wt0 - Y) / 2]]);
        for (let k = 0; k < arch / 2; k++) { const aA = k * AR, aB = (k + 1) * AR, X = (a, p, nn, wt, c) => V(p, nn, sd * HW * Math.cos(a), wt + (c - wt) * Math.sin(a)), nrm = [-n0[0] * sd * Math.cos(aA + AR / 2), -Math.sin(aA + AR / 2), -n0[1] * sd * Math.cos(aA + AR / 2)];
          gbvQuad(B("ziegel"), X(aA, p0, n0, wt0, c0), X(aA, p1, n1, wt1, c1), X(aB, p1, n1, wt1, c1), X(aB, p0, n0, wt0, c0), nrm, [[u0 / 2, (wt0 - Y) / 2 + k * 0.9], [u1 / 2, (wt1 - Y) / 2 + k * 0.9], [u1 / 2, (wt1 - Y) / 2 + (k + 1) * 0.9], [u0 / 2, (wt0 - Y) / 2 + (k + 1) * 0.9]]); } } }
      // Lampe alle 16 m (abwechselnd links/rechts)
      if (i % 4 === 0) { const sd = (i / 4) % 2 ? 1 : -1, [x, , z] = V(p0, n0, sd * (HW - 0.12), 0); if (!inOther(x, z, si)) gbvBox(out, "lampe", gbvFrame({ P0: [x, z], e1: [fx, fz], e2: [-fz, fx], L1: 1, L2: 1 }), 0, 0, 0.8, 0.2, Y + 3.0, Y + 3.25); }
      // Kollision: Raum, Stege, Rinne (Decke = tiefste der beiden Enden)
      const RW = HW - 0.4, e0 = !S.ring && i === 0 ? 0.5 : 0, e1 = !S.ring && j === n - 1 ? 0.5 : 0, q0 = [p0[0] + fx * e0, p0[1] + fz * e0], q1 = [p1[0] - fx * e1, p1[1] - fz * e1];   // Barriere weiter innen als die sichtbare Wand bzw. das Ende (Nicolas-Regel)
      dkRoom({ poly: [[q0[0] - n0[0] * RW, q0[1] - n0[1] * RW], [q1[0] - n1[0] * RW, q1[1] - n1[1] * RW], [q1[0] + n1[0] * RW, q1[1] + n1[1] * RW], [q0[0] + n0[0] * RW, q0[1] + n0[1] * RW]], y0: Y - 1, y1: Math.min(c0, c1) });
      for (const [d, hw, top] of [[-(HW + CW) / 2, (HW - CW) / 2, Y], [(HW + CW) / 2, (HW - CW) / 2, Y], [0, CW, Y - 0.3]]) dkAdd({ cx: mx + n0[0] * d, cy: top - 0.25, cz: mz + n0[1] * d, ux: fx, uz: fz, hl: L / 2 + 0.05, hw, hh: 0.25, m: 0, ceil: 0 });
      if (i % 12 === 0) yield; }
    // Enden zu (ausser im Innenraum eines anderen Sammlers)
    if (!S.ring) for (const [i, sg] of [[0, -1], [n - 1, 1]]) { const p = P[i], nn = S.N[i], c = S.C[i]; if (inOther(p[0], p[1], si, HW + 1)) continue; if (i === 0 ? S.outA : S.outB) { kanOutlet(S, i, sg, out, B, V); continue; }
      const q = P[i - sg] || p, l = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1, ex = (p[0] - q[0]) / l, ez = (p[1] - q[1]) / l;
      gbvQuad(B("ziegel"), V(p, nn, -HW, Y - 0.5), V(p, nn, HW, Y - 0.5), V(p, nn, HW, c), V(p, nn, -HW, c), [-ex, 0, -ez], [[0, 0], [4, 0], [4, (c - Y) / 2], [0, (c - Y) / 2]]); }
    yield; mk(out, grp, "Kanal " + S.id); yield; }
  // 3. Gullideckel alle 70 m (auf der Fahrbahn, Mitte), Schacht mit Leiter
  const step = Math.round((GOTHAM.kanal.gulliAbstand || 70) / DS);
  for (let si = 0; si < KAN.sewers.length; si++) { const S = KAN.sewers[si], P = S.P;
    if (S.hub || S.spoke) continue;
    if (S.side) { const p = P[0], nn = S.N[0], q = P[1], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, x = p[0] + (q[0] - p[0]) / l * 1.2, z = p[1] + (q[1] - p[1]) / l * 1.2; KAN.gullis.push({ x, z, si, i: 0, fx: -nn[1], fz: nn[0], side: true }); continue; }
    for (let i = Math.floor(step / 2); i < P.length - 2; i += step) { const p = P[i], nn = S.N[i], [x, z] = [p[0] + nn[0] * (HW - 0.6), p[1] + nn[1] * (HW - 0.6)];
      if (inOther(x, z, si) || [-21, -15].some(y => dkInRoom(x, y, z))) continue;   // nicht an Kreuzungen, nicht ueber U-Bahn, unterer Strasse oder Tiefgarage (der Schacht ginge hindurch)
      KAN.gullis.push({ x, z, si, i, fx: -nn[1], fz: nn[0] }); } }
  yield;
  // 4. Netze
  const lad = new Map(), lid = new Map();
  for (const gq of KAN.gullis) { const f = gbvFrame({ P0: [gq.x, gq.z], e1: [gq.fx, gq.fz], e2: [-gq.fz, gq.fx], L1: 1, L2: 1 });
    const GS = KAN.sewers[gq.si], yB = GS.side ? GS.F[0] : Y, yTop = GS.side ? GS.F[0] + KAN.SH : GS.C[gq.i];   // Leiter nur im Kanal sichtbar (darueber liegt der Schacht im Gelaende)
    for (const sx of [-0.25, 0.25]) gbvBox(lad, "eisen", f, sx, gq.side ? 0 : 0.45, 0.05, 0.05, yB, yTop, null, false); for (let y = yB + 0.3; y < yTop - 0.2; y += 0.3) gbvBox(lad, "eisen", f, 0, gq.side ? 0 : 0.45, 0.55, 0.04, y, y + 0.04, null, false);
    gbvCyl(lid, "eisen", f, 0, 0, 0.42, GOT.STR + 0.01, GOT.STR + 0.04, 16); if (KAN.gullis.indexOf(gq) % 30 === 29) yield; }
  { const u2 = new Map(); kanU2(u2); mk(u2, grp, "Kanal U2"); }
  yield; mk(lad, grp, "Kanal Leitern"); yield; scene.add(grp); UNDERGROUND.push(grp); grp.visible = typeof ugVis === "boolean" ? ugVis : false; KAN.grp = grp;
  if (KAN.outOut) { const og = new THREE.Group(); og.name = "Kanal Auslaesse"; mk(KAN.outOut, og, "Auslass"); og.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(og); KAN.outGrp = og; }
  yield; const lids = new THREE.Group(); lids.name = "Gullideckel"; mk(lid, lids, "Gulli"); scene.add(lids); yield;
  yield;
  // 5. Einstieg: Rechtsklick auf den Deckel (hinunter) bzw. die Leiter (hinauf); je Gulli ein unsichtbarer Klickkasten
  const hitM = new THREE.MeshBasicMaterial({ visible: false }), near = (x, z) => Math.hypot(player.pos.x - x, player.pos.z - z) < 4;
  for (const gq of KAN.gullis) { const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), hitM); top.position.set(gq.x, GOT.STR + 0.1, gq.z); scene.add(top);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1.2), hitM); bot.position.set(gq.x - gq.fz * (gq.side ? 0 : 0.3), (gq.side ? KAN.sewers[gq.si].F[0] : Y) + 1.2, gq.z + gq.fx * (gq.side ? 0 : 0.3)); grp.add(bot);
    const S = KAN.sewers[gq.si], p = S.P[gq.side ? 1 : gq.i], nn = S.N[gq.i], dn = gq.side ? [p[0], p[1]] : [p[0] + nn[0] * (HW - 1.6), p[1] + nn[1] * (HW - 1.6)], dy = gq.side ? S.F[1] : Y;
    gates.push({ name: "Gullideckel", g: top, call: () => { if (!near(gq.x, gq.z)) return toast("Zu weit vom Gullideckel entfernt"); if (typeof invHas === "function" && !invHas("gullihaken")) return toast("Dafür brauchst du den Gullihaken (Inventar)"); teleportToPoint({ x: dn[0], y: dy, z: dn[1] }); toast((S.side ? "Nebensammler unter " : "Kanalisation unter ") + S.name); }, verbs: ["hinuntersteigen", "hinuntersteigen"], a: [gq.x, gq.z], b: [gq.x, gq.z], near: 4 });
    gates.push({ name: "Leiter", g: bot, call: () => { if (!near(gq.x, gq.z)) return toast("Zu weit von der Leiter entfernt"); teleportToPoint({ x: gq.x + gq.fx * 2, y: GOT.STR + 0.5, z: gq.z + gq.fz * 2 }); toast("Oben auf der Strasse"); }, verbs: ["hinaufsteigen", "hinaufsteigen"], a: [gq.x, gq.z], b: [gq.x, gq.z], near: 4 });
    if (KAN.gullis.indexOf(gq) % 20 === 19) yield; }
  KAN.info = { u2: (KAN.u2 || []).length, hub: !!KAN.hub, sides: KAN.sides, auslass: (KAN.auslass || []).length, sewers: KAN.sewers.length, km: +(KAN.sewers.reduce((a, S) => a + S.P.length * DS, 0) / 1000).toFixed(1), gullis: KAN.gullis.length, tris: grp.children.reduce((a, m) => a + m.geometry.attributes.position.count / 3, 0) };
}
// Wandstueck an einer Einmuendung/Kreuzung: nur der Teil ausserhalb des anderen Sammlers (sonst fehlten bis zu 4 m Wand, man sah durch das Gelaende)
function kanClip(isIn, A, B) { const a = isIn(A[0], A[1]), b = isIn(B[0], B[1]); if (a && b) return null; if (!a && !b) return [0, 1];
  let lo = 0, hi = 1; for (let k = 0; k < 10; k++) { const m = (lo + hi) / 2; if (isIn(A[0] + (B[0] - A[0]) * m, A[1] + (B[1] - A[1]) * m) === a) lo = m; else hi = m; } const t = (lo + hi) / 2; return a ? [t, 1] : [0, t]; }
const kanL = (a, b, t) => Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * t) : a + (b - a) * t;
// ---------- U1b Nebensammler (Teil B) ----------
// Unter Nebenstrassen, die an einem Hauptsammler enden: jede zweite. Lauf von der Einmuendung (Sohle -29) gleichmaessig (ca. 11 %, je 5 m flach an den Enden)
// hinauf, bis die Decke 1,2 m unter der Strasse liegt (Sohle -16,2, ca. 125 m); oben ein Gullideckel mit Leiter. 3,2 m breit, 3 m hoch (Batpod mit Fahrer).
// Verworfen, wenn der Lauf einen anderen Raum schneidet (U-Bahn, untere Strasse, Tiefgarage), an die Kaikante kommt oder einen anderen Hauptsammler streift.
KAN.SH = 3; KAN.SHW = 1.6;
function* kanSide(G, gk) {
  const Y = KAN.Y, top = GOT.STR - 1.2 - KAN.SH, drop = top - Y, mains = KAN.sewers.length, cand = [];
  const nearSide = (x, z, r) => { const i0 = Math.floor(x / 16), k0 = Math.floor(z / 16); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const [sj, j] of G.get((i0 + a) * 100000 + k0 + b) || []) { const S = KAN.sewers[sj]; if (S.side && Math.hypot(S.P[j][0] - x, S.P[j][1] - z) < r) return true; } return false; };
  const nearMain = (x, z, r) => { const i0 = Math.floor(x / 16), k0 = Math.floor(z / 16); let best = null;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const [sj, j] of G.get((i0 + a) * 100000 + k0 + b) || []) { const S = KAN.sewers[sj]; if (S.side) continue;
      const P = S.P, q = P[j], q2 = P[Math.min(P.length - 1, j + 1)], dx = q2[0] - q[0], dz = q2[1] - q[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - q[0]) * dx + (z - q[1]) * dz) / L2)), d = Math.hypot(x - q[0] - dx * t, z - q[1] - dz * t);
      if (d < r && (!best || d < best.d)) best = { si: sj, d }; } return best; };
  for (const r of GSTR.roads) { if (r.kind === "haupt" || r.w > 9) continue; for (const end of [0, 1]) { const Q = end ? r.pts.slice().reverse() : r.pts; if (Q.length < 3) continue; const m = nearMain(Q[0][0], Q[0][1], 14); if (m) cand.push({ r, Q, m }); } }
  cand.sort((a, b) => a.Q[0][0] - b.Q[0][0] || a.Q[0][1] - b.Q[0][1]);
  const Ls = drop / 0.11 + 10;
  for (let ci = 0; ci < cand.length; ci += 2) { const { r, Q, m } = cand[ci];
    // Anfang bis in den Hauptsammler verlaengern (HW - 0.8 von dessen Mitte), dann alle 4 m die Strasse entlang
    const dir0 = [Q[0][0] - Q[1][0], Q[0][1] - Q[1][1]], l0 = Math.hypot(dir0[0], dir0[1]) || 1, e = Q[0].slice();
    for (let k = 0; k < 40; k++) { const nm = nearMain(e[0], e[1], 30); if (!nm || nm.d <= KAN.HW - 0.8) break; e[0] += dir0[0] / l0 * 0.5; e[1] += dir0[1] / l0 * 0.5; }
    const P = [e]; let acc = 0, ok = true;
    for (let i = 1; i < Q.length && acc < Ls; i++) { acc += Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]); P.push(Q[i].slice()); }   // Strassenpunkte liegen schon alle 4 m
    const rej = KAN.rej || (KAN.rej = { kurz: 0, kai: 0, haupt: 0, raum: 0 }); if (acc < Ls - 4) { rej.kurz++; continue; }
    P.reverse();   // oben (Gulli) zuerst, Einmuendung zuletzt
    let s = 0; const S2 = [0]; for (let i = 1; i < P.length; i++) S2.push(s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); const Lt = s;
    const F = S2.map(v => Y + drop * Math.min(1, Math.max(0, (Lt - v) - 5) / (Lt - 10)));
    for (let i = 0; i < P.length && ok; i++) { const [x, z] = P[i]; if (GOT.edgeSD(x, z) > -16) { ok = false; rej.kai++; break; } const nearJ = Lt - S2[i] < 10;
      if (!nearJ && nearMain(x, z, KAN.HW + KAN.SHW + 1)) { ok = false; rej.haupt++; break; }
      if (nearSide(x, z, 2 * KAN.SHW + 3)) { ok = false; rej.neben = (rej.neben || 0) + 1; break; }   // kein zweiter Nebensammler daneben (verschiedene Hoehen gaeben Loecher)
      if (!nearJ) for (const d of [-KAN.SHW, 0, KAN.SHW]) for (const y of [F[i] + 0.5, F[i] + KAN.SH - 0.3]) if (ok && dkInRoom(x + d * 0.7, y, z + d * 0.7)) { ok = false; rej.raum++; } }
    if (!ok) continue;
    const n = P.length, N = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
    const S = { id: r.id || "neben", name: r.name || "einer Nebenstrasse", P, N, F, side: true, hw: KAN.SHW, main: m.si, C: F.map(f => f + KAN.SH) }, si = KAN.sewers.length; KAN.sewers.push(S);
    P.forEach((p, i) => { const k = gk(p[0], p[1]); let c = G.get(k); if (!c) G.set(k, c = []); c.push([si, i]); });
    if (ci % 8 === 0) yield; }
  KAN.sides = KAN.sewers.length - mains;
}
// Nebensammler bauen: geneigter Boden, schmales Wasser in der Mitte, Ziegelwaende 2 m, Gewoelbe bis 3 m; Kollision mit geneigtem dk-Boden
function kanSideBuild(S, si, out, B, V, inOther) {
  const P = S.P, F = S.F, n = P.length, hw = S.hw, AR = Math.PI / 6; let uu = 0;
  for (let i = 0; i < n - 1; i++) { const p0 = P[i], p1 = P[i + 1], n0 = S.N[i], n1 = S.N[i + 1], f0 = F[i], f1 = F[i + 1], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, u0 = uu, u1 = uu + L; uu = u1;
    const fx = (p1[0] - p0[0]) / L, fz = (p1[1] - p0[1]) / L;
    { const cc = kanClip((x, z) => inOther(x, z, si) === Infinity, P[i], P[i + 1]) || [0, 0], p0 = kanL(P[i], P[i + 1], cc[0]), p1 = kanL(P[i], P[i + 1], cc[1]), f0 = kanL(F[i], F[i + 1], cc[0]), f1 = kanL(F[i], F[i + 1], cc[1]);   // Boden nur bis zur Hauptsammler-Grenze (sonst flimmert er auf dessen Steg)
    gbvQuad(B("steg"), V(p0, n0, -hw, f0), V(p1, n1, -hw, f1), V(p1, n1, hw, f1), V(p0, n0, hw, f0), [0, 1, 0], [[-hw / 2, u0 / 2], [-hw / 2, u1 / 2], [hw / 2, u1 / 2], [hw / 2, u0 / 2]]);
    gbvQuad(B("wasser"), V(p0, n0, -0.35, f0 + 0.02), V(p1, n1, -0.35, f1 + 0.02), V(p1, n1, 0.35, f1 + 0.02), V(p0, n0, 0.35, f0 + 0.02), [0, 1, 0], [[0, u0 / 6], [0, u1 / 6], [0.3, u1 / 6], [0.3, u0 / 6]]); }
    for (const sd of [-1, 1]) { const W0 = V(P[i], S.N[i], sd * hw, 0), W1 = V(P[i + 1], S.N[i + 1], sd * hw, 0), cl = kanClip((x, z) => !!inOther(x, z, si), [W0[0], W0[2]], [W1[0], W1[2]]); if (!cl) continue;
      const p0 = kanL(P[i], P[i + 1], cl[0]), p1 = kanL(P[i], P[i + 1], cl[1]), n0 = kanL(S.N[i], S.N[i + 1], cl[0]), n1 = kanL(S.N[i], S.N[i + 1], cl[1]), f0 = kanL(F[i], F[i + 1], cl[0]), f1 = kanL(F[i], F[i + 1], cl[1]), u0 = kanL(uu - L, uu, cl[0]), u1 = kanL(uu - L, uu, cl[1]);
      const wt0 = f0 + 2, wt1 = f1 + 2, c0 = f0 + KAN.SH, c1 = f1 + KAN.SH;
      gbvQuad(B("ziegel"), V(p0, n0, sd * hw, f0 - 0.05), V(p1, n1, sd * hw, f1 - 0.05), V(p1, n1, sd * hw, wt1), V(p0, n0, sd * hw, wt0), [-n0[0] * sd, 0, -n0[1] * sd], [[u0 / 2, 0], [u1 / 2, 0], [u1 / 2, 1], [u0 / 2, 1]]);
      for (let k = 0; k < 3; k++) { const aA = k * AR, aB = (k + 1) * AR, X = (a, p, nn, wt, c) => V(p, nn, sd * hw * Math.cos(a), wt + (c - wt) * Math.sin(a)), nrm = [-n0[0] * sd * Math.cos(aA + AR / 2), -Math.sin(aA + AR / 2), -n0[1] * sd * Math.cos(aA + AR / 2)];
        gbvQuad(B("ziegel"), X(aA, p0, n0, wt0, c0), X(aA, p1, n1, wt1, c1), X(aB, p1, n1, wt1, c1), X(aB, p0, n0, wt0, c0), nrm, [[u0 / 2, 1 + k * 0.4], [u1 / 2, 1 + k * 0.4], [u1 / 2, 1 + (k + 1) * 0.4], [u0 / 2, 1 + (k + 1) * 0.4]]); } }
    if (i % 4 === 2 && !inOther(...(([a, , b]) => [a, b])(V(p0, n0, hw - 0.1, 0)), si)) { const [x, , z] = V(p0, n0, hw - 0.1, 0); gbvBox(out, "lampe", gbvFrame({ P0: [x, z], e1: [fx, fz], e2: [-fz, fx], L1: 1, L2: 1 }), 0, 0, 0.6, 0.15, f0 + 2.2, f0 + 2.4); }
    const RW = hw - 0.35, e0 = i === 0 ? 0.5 : 0, q0 = [p0[0] + fx * e0, p0[1] + fz * e0], mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
    dkRoom({ poly: [[q0[0] - n0[0] * RW, q0[1] - n0[1] * RW], [p1[0] - n1[0] * RW, p1[1] - n1[1] * RW], [p1[0] + n1[0] * RW, p1[1] + n1[1] * RW], [q0[0] + n0[0] * RW, q0[1] + n0[1] * RW]], y0: Math.min(f0, f1) - 1, y1: Math.min(f0, f1) + KAN.SH });
    dkAdd({ cx: mx, cy: (f0 + f1) / 2 - 0.25, cz: mz, ux: fx, uz: fz, hl: L / 2 + 0.05, hw, hh: 0.25, m: 0, ceil: 0, g: (f1 - f0) / L }); }
  const p = P[0], nn = S.N[0], q = P[1], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;   // oberes Ende zu
  gbvQuad(B("ziegel"), V(p, nn, -hw, F[0] - 0.3), V(p, nn, hw, F[0] - 0.3), V(p, nn, hw, F[0] + KAN.SH), V(p, nn, -hw, F[0] + KAN.SH), [(q[0] - p[0]) / l, 0, (q[1] - p[1]) / l], [[0, 0], [1.6, 0], [1.6, 1.5], [0, 1.5]]);
}
// ---------- Auslass (Teil B) ----------
// Innen: Gelaender am Sammlerende, dahinter Absturzschacht 8 x 8 m (Wasserfall auf Wasserhoehe), Rohr 6 m bis zur Kaimauer (die Mauer hat keine Rueckseite: man sieht hinaus).
// Aussen vor der Mauer: Betonstirnwand mit Rohrmund und rostigem Gitter, trichterfoermige Fluegelwaende aus Pflaster (14 m an der Wand, 36 m am Wasser, 24 m),
// gepflasterte Sohle bis ins Wasser, Betontreppe an einer Fluegelwand. Kollision fuer Fluegelwaende und Treppe (dkAdd).
function kanOutlet(S, i, sg, out, B, V) {
  const Y = KAN.Y, HW = KAN.HW, WY = GOT.WY, P = S.P, E = P[i], q = P[i - sg], l = Math.hypot(E[0] - q[0], E[1] - q[1]) || 1, d = [(E[0] - q[0]) / l, (E[1] - q[1]) / l], nn = S.N[i], c = S.C[i];
  const O = KAN.outOut || (KAN.outOut = new Map()), A = KAN.auslass || (KAN.auslass = []), cfg = GOTHAM.kanal.auslass || { rohr: 6, wand: 14, wasser: 36, tiefe: 24 };
  const fr = gbvFrame({ P0: E, e1: [nn[0], nn[1]], e2: d, L1: 1, L2: 1 });
  gbvBox(out, "eisen", fr, 0, 0.1, 2 * HW, 0.08, Y + 1.0, Y + 1.1); gbvBox(out, "eisen", fr, 0, 0.1, 2 * HW, 0.06, Y + 0.5, Y + 0.56); for (let k = -3; k <= 3; k++) gbvBox(out, "eisen", fr, k * HW / 3.2, 0.1, 0.07, 0.07, Y - 0.3, Y + 1.1);
  const C = [E[0] + d[0] * 4.2, E[1] + d[1] * 4.2], fs = gbvFrame({ P0: C, e1: [nn[0], nn[1]], e2: d, L1: 1, L2: 1 }), yb = WY - 0.6;
  gbvBox(out, "steg", fs, -HW - 0.2, 0, 0.4, 8.4, yb, c); gbvBox(out, "steg", fs, HW + 0.2, 0, 0.4, 8.4, yb, c); gbvBox(out, "steg", fs, 0, 0, 2 * HW + 0.8, 8.4, c, c + 0.4);   // Seitenwaende, Decke
  for (const [a, w, y0, y1] of [[-(HW + 3) / 2, HW - 3, yb, c], [(HW + 3) / 2, HW - 3, yb, c], [0, 6, WY + 5.6, c]]) gbvBox(out, "steg", fs, a, 4.2, w, 0.4, y0, y1);   // Stirnseite mit Rohroeffnung 6 x 6
  gbvBox(out, "steg", fs, 0, -4.1, 2 * HW, 0.3, yb, Y - 0.3);   // Wand unter dem Sammlerende
  const C2 = [C[0] + d[0] * 4, C[1] + d[1] * 4], C1 = [C[0] - d[0] * 4, C[1] - d[1] * 4];
  gbvQuad(B("wasser"), V(C1, nn, -HW, WY + 0.2), V(C2, nn, -HW, WY + 0.2), V(C2, nn, HW, WY + 0.2), V(C1, nn, HW, WY + 0.2), [0, 1, 0], [[0, 0], [0, 1], [1, 1], [1, 0]]);   // Becken
  { const a = [E[0] + d[0] * 0.05, E[1] + d[1] * 0.05], b = [E[0] + d[0] * 0.5, E[1] + d[1] * 0.5]; gbvQuad(B("wasser"), V(a, nn, -KAN.CW, Y - 0.12), V(a, nn, KAN.CW, Y - 0.12), V(b, nn, KAN.CW, WY + 0.2), V(b, nn, -KAN.CW, WY + 0.2), [d[0], 0, d[1]], [[0, 0], [1, 0], [1, 2], [0, 2]]); }   // Wasserfall
  // Mauerpunkt: von der Schacht-Stirnseite senkrecht zur Kaikante (Gradient von edgeSD) bis edgeSD = 0
  const g = (() => { const e = 2, a = GOT.edgeSD(C[0] + e, C[1]) - GOT.edgeSD(C[0] - e, C[1]), b = GOT.edgeSD(C[0], C[1] + e) - GOT.edgeSD(C[0], C[1] - e), L = Math.hypot(a, b) || 1; return [a / L, b / L]; })();
  const F0 = [C[0] + d[0] * 4.2, C[1] + d[1] * 4.2], W = F0.slice(); for (let k = 0; k < 240 && GOT.edgeSD(W[0], W[1]) < 0; k++) { W[0] += g[0] * 0.25; W[1] += g[1] * 0.25; }
  const R = cfg.rohr / 2, yc = WY + R - 0.4;
  const pipe = (from, to, map, key, inside) => { const dx = to[0] - from[0], dz = to[1] - from[1], L = Math.hypot(dx, dz) || 0.01, geo = new THREE.CylinderGeometry(R, R, L, 24, 1, true); geo.rotateX(Math.PI / 2); geo.lookAt(new THREE.Vector3(dx, 0, dz)); geo.translate((from[0] + to[0]) / 2, yc, (from[1] + to[1]) / 2);
    const pos = geo.attributes.position.array, nor = geo.attributes.normal.array, uv = geo.attributes.uv.array, idx = geo.index.array, o = gbvBucket(map, key), sgn = inside ? -1 : 1;
    for (let t = 0; t < idx.length; t += 3) for (const v of inside ? [idx[t], idx[t + 2], idx[t + 1]] : [idx[t], idx[t + 1], idx[t + 2]]) { o.p.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); o.n.push(sgn * nor[v * 3], sgn * nor[v * 3 + 1], sgn * nor[v * 3 + 2]); o.uv.push(uv[v * 2] * 6, uv[v * 2 + 1] * L / 2); } };
  pipe(F0, W, out, "steg", true);
  const t = [-g[1], g[0]], Wo = [W[0] + g[0] * 0.05, W[1] + g[1] * 0.05], ff = gbvFrame({ P0: Wo, e1: t, e2: g, L1: 1, L2: 1 }), mouth = [Wo[0] + g[0] * 1.5, Wo[1] + g[1] * 1.5];
  pipe(Wo, mouth, O, "beton", false); pipe(Wo, mouth, O, "dunkel", true);
  { const o = gbvBucket(O, "dunkel"), nS = 24; for (let k = 0; k < nS; k++) { const a0 = k / nS * Math.PI * 2, a1 = (k + 1) / nS * Math.PI * 2, P2 = a => [Wo[0] + t[0] * Math.cos(a) * R, yc + Math.sin(a) * R, Wo[1] + t[1] * Math.cos(a) * R]; gbvTri(o, [Wo[0], yc, Wo[1]], P2(a0), P2(a1), [g[0], 0, g[1]], [0.5, 0.5], [0, 0], [1, 0]); } }
  const hw0 = cfg.wand / 2, yTop = WY + cfg.rohr + 1.2;
  for (const [a, w, y0, y1] of [[-(hw0 + R + 0.3) / 2, hw0 - R - 0.3, WY - 1, yTop], [(hw0 + R + 0.3) / 2, hw0 - R - 0.3, WY - 1, yTop], [0, 2 * R + 0.6, yc + R + 0.2, yTop]]) gbvBox(O, "beton", ff, a, 0.4, w, 0.8, y0, y1);   // Stirnwand um den Rohrmund
  gbvBox(O, "beton", ff, 0, 0.4, cfg.wand + 0.4, 1, yTop, yTop + 0.4);
  const gy = 1.55; for (let a = -R; a <= R + 0.01; a += 0.5) gbvBox(O, "rost", ff, a, gy, 0.08, 0.1, WY - 0.6, yc + R); for (let y = WY - 0.5; y <= yc + R; y += 0.5) gbvBox(O, "rost", ff, 0, gy, 2 * R, 0.1, y, y + 0.08);   // Gitter (quadratisch)
  for (const a of [-R - 0.15, R + 0.15]) gbvBox(O, "rost", ff, a, gy, 0.3, 0.3, WY - 1, yc + R + 0.3); gbvBox(O, "rost", ff, 0, gy, 2 * R + 0.6, 0.3, yc + R, yc + R + 0.3);   // Stahlrahmen
  { const [gx, gz] = [Wo[0] + g[0] * gy, Wo[1] + g[1] * gy]; dkAdd({ cx: gx, cy: yc, cz: gz, ux: t[0], uz: t[1], hl: R + 0.3, hw: 0.2, hh: R + 0.6, m: 0.2, floor: 0 }); }
  // Fluegelwaende: von der Stirnwand (+-7 m) schraeg nach aussen bis +-18 m bei 24 m; Oberkante faellt von yTop auf WY + 1
  const D = cfg.tiefe, hw1 = cfg.wasser / 2, P3 = (a, w) => [Wo[0] + t[0] * a + g[0] * w, Wo[1] + t[1] * a + g[1] * w];
  for (const s2 of [-1, 1]) { const a0 = P3(s2 * hw0, 0.8), a1 = P3(s2 * hw1, D), L = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]), ux = (a1[0] - a0[0]) / L, uz = (a1[1] - a0[1]) / L, nx = -uz * s2, nz = ux * s2, th = 0.8, y1a = yTop, y1b = WY + 1;
    const Q = (p, k, y) => [p[0] + nx * k * th / 2, y, p[1] + nz * k * th / 2], o = gbvBucket(O, "pflaster");
    for (const k of [-1, 1]) gbvQuad(o, Q(a0, k, WY - 1.5), Q(a1, k, WY - 1.5), Q(a1, k, y1b), Q(a0, k, y1a), [nx * k, 0, nz * k], [[0, 0], [L / 2, 0], [L / 2, (y1b - WY + 1.5) / 2], [0, (y1a - WY + 1.5) / 2]]);
    gbvQuad(gbvBucket(O, "beton"), Q(a0, -1, y1a), Q(a1, -1, y1b), Q(a1, 1, y1b), Q(a0, 1, y1a), [0, 1, 0], [[0, 0], [L / 2, 0], [L / 2, 0.3], [0, 0.3]]);
    gbvQuad(o, Q(a1, -1, WY - 1.5), Q(a1, 1, WY - 1.5), Q(a1, 1, y1b), Q(a1, -1, y1b), [ux, 0, uz], [[0, 0], [0.4, 0], [0.4, 1], [0, 1]]);
    dkAdd({ cx: (a0[0] + a1[0]) / 2, cy: (WY - 1.5 + (y1a + y1b) / 2) / 2, cz: (a0[1] + a1[1]) / 2, ux, uz, hl: L / 2, hw: th / 2, hh: ((y1a + y1b) / 2 - WY + 1.5) / 2, g: (y1b - y1a) / L, m: 0.3 });
    if (s2 === 1) for (let k = 0; k < 16; k++) { const f2 = 0.1 + k / 16 * 0.75, p = [a1[0] + (a0[0] - a1[0]) * f2 - nx * 1.2, a1[1] + (a0[1] - a1[1]) * f2 - nz * 1.2], yS = WY + 0.2 + k * ((y1a - 0.6 - WY) / 16), fq = gbvFrame({ P0: p, e1: [ux, uz], e2: [nx, nz], L1: 1, L2: 1 });   // Betontreppe innen
      gbvBox(O, "beton", fq, 0, 0, L * 0.75 / 16 + 0.05, 1.6, WY - 1, yS); dkAdd({ cx: p[0], cy: (WY - 1 + yS) / 2, cz: p[1], ux, uz, hl: L * 0.75 / 32, hw: 0.8, hh: (yS - WY + 1) / 2, m: 0 }); } }
  { const o = gbvBucket(O, "pflaster"), a = P3(-hw0, 0.8), b = P3(hw0, 0.8), c2 = P3(hw1, D), d2 = P3(-hw1, D); gbvQuad(o, [a[0], WY + 0.7, a[1]], [b[0], WY + 0.7, b[1]], [c2[0], WY - 0.05, c2[1]], [d2[0], WY - 0.05, d2[1]], [0, 1, 0], [[0, 0], [7, 0], [18, 12], [-11, 12]]); }   // Sohle ins Wasser
  A.push({ x: W[0], z: W[1], sewer: S.id });
}
// ---------- U3 Kanal-Hub mit Schurkenbasis (Teil C) ----------
// Runde Halle direkt unter dem Wayne Tower (Mitte WTO, Achsen u = Turm-a, v = Turm-b), Radius KAN.HR. Ebenen: Galerie (Gitterboden) auf Sammlerhoehe KAN.Y (-29),
// Hallenboden 8 m tiefer (-37), Decke -24,3 (darueber liegen Wayne-Geheimstock und Tiefgarage bis ca. -23). Vier Zugaenge (Hauptsammler-Querschnitt) vom Ringkanal;
// aus dem Zugang +u faellt das Abwasser als Wasserfall in einen gemauerten Kanal quer durch die Halle (Gitterrost darueber, offen unter dem Wasserfall, Gelaender).
// Pfeiler rundum, Steg quer ueber die Halle auf Galeriehoehe, zwei Stahltreppen hinunter. Basis der Boesen: Waffen unter Planen, herumliegende Waffen,
// Tisch mit Computer, Boxsack, Faesser. Kollision: dkRoom (Kreis), Boeden/Stufen/Gelaender/Moebel als dkAdd.
KAN.HR = 28;
function kanHubLines() {
  const H = [WTO.cx, WTO.cz], R = KAN.HR, ring = KAN.sewers.find(s => s.id === "ring"); if (!ring) return;
  const hub = { id: "hub", name: "dem Wayne Tower (Kanal-Hub)", P: [H], N: [[1, 0]], hub: true, hw: R, ring: false }; KAN.sewers.push(hub); KAN.hub = hub;
  const dRing = (x, z) => { let b = 1e9; for (const p of ring.P) { const d = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
  for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const dx = WTO.ux * a - WTO.uz * b, dz = WTO.uz * a + WTO.ux * b, P = [];
    for (let r = R - 0.3; r < 600; r += 4) { const x = H[0] + dx * r, z = H[1] + dz * r; P.push([x, z]); if (dRing(x, z) < KAN.HW - 1.5) break; }
    if (P.length > 3) KAN.sewers.push({ id: "hub-" + (a ? (a > 0 ? "u+" : "u-") : (b > 0 ? "v+" : "v-")), name: "dem Zugang zum Kanal-Hub", P, spoke: true, dir: [dx, dz], ring: false }); }
}
function kanHubBuild(out, B) {
  const H = [WTO.cx, WTO.cz], R = KAN.HR, ux = WTO.ux, uz = WTO.uz, YG = KAN.Y, YF = YG - 8, YC = -24.3, HW = KAN.HW, cw = 2;
  const W = (u, v, y) => [H[0] + u * ux - v * uz, y, H[1] + u * uz + v * ux], dirW = (u, v) => [u * ux - v * uz, 0, u * uz + v * ux];
  const spokes = KAN.sewers.filter(s => s.spoke), sC = s => s.C[0], f = gbvFrame({ P0: H, e1: [ux, uz], e2: [-uz, ux], L1: 1, L2: 1 });   // f: s = u, t = v
  const box = (key, u, v, lu, lv, y0, y1, col) => gbvBox(out, key, f, u, v, lu, lv, y0, y1, col);
  const dk = (u, v, lu, lv, y0, y1, o = {}) => { const [x, , z] = W(u, v, 0); dkAdd(Object.assign({ cx: x, cy: (y0 + y1) / 2, cz: z, ux, uz, hl: lu / 2, hw: lv / 2, hh: (y1 - y0) / 2, m: 0.1 }, o)); };
  // Wand (96 Stuecke) mit Oeffnungen der Zugaenge (oberhalb der Galerie bis zum Gewoelbe des Zugangs)
  const NW = 96;
  for (let k = 0; k < NW; k++) { const a0 = k / NW * Math.PI * 2, a1 = (k + 1) / NW * Math.PI * 2, am = (a0 + a1) / 2, P = a => [Math.cos(a) * R, Math.sin(a) * R], [mu, mv] = P(am), wn = dirW(-Math.cos(am), -Math.sin(am));
    let open = null; for (const s of spokes) { const sd = [s.dir[0], s.dir[1]], pw = W(mu, mv, 0), rx = pw[0] - H[0], rz = pw[2] - H[1], dot = rx * sd[0] + rz * sd[1], lat = Math.abs(rx * sd[1] - rz * sd[0]);
      if (dot > 0 && lat < HW) { const c = sC(s), wt = c - Math.min(2.2, (c - YG) * 0.4); open = wt + (c - wt) * Math.sqrt(Math.max(0, 1 - (lat / HW) ** 2)) - 0.05; } }
    const [u0, v0] = P(a0), [u1, v1] = P(a1), q = (y0, y1) => gbvQuad(B("ziegel"), W(u0, v0, y0), W(u1, v1, y0), W(u1, v1, y1), W(u0, v0, y1), wn, [[k * 0.9, (y0 - YF) / 2], [(k + 1) * 0.9, (y0 - YF) / 2], [(k + 1) * 0.9, (y1 - YF) / 2], [k * 0.9, (y1 - YF) / 2]]);
    if (open === null) q(YF - 0.1, YC); else { q(YF - 0.1, YG - 0.05); q(open, YC); } }
  // Decke (Fan) und Traeger
  { const o = gbvBucket(out, "steg"); for (let k = 0; k < 48; k++) { const a0 = k / 48 * Math.PI * 2, a1 = (k + 1) / 48 * Math.PI * 2; gbvTri(o, W(0, 0, YC), W(Math.cos(a0) * R, Math.sin(a0) * R, YC), W(Math.cos(a1) * R, Math.sin(a1) * R, YC), [0, -1, 0], [0, 0], [R / 3, 0], [0, R / 3]); } }
  for (const [lu, lv] of [[2 * R, 0.6], [0.6, 2 * R]]) box("stahl", 0, 0, lu, lv, YC - 0.9, YC);
  // Hallenboden (zwei Haelften neben dem Kanal), Kanal (Sohle, Waende, Wasser), Gitterrost, offenes Stueck unter dem Wasserfall
  const uc = Math.sqrt(R * R - cw * cw), uOpen = R - 12;
  for (const s2 of [-1, 1]) { const o = gbvBucket(out, "steg"), pts = []; const a0 = Math.asin(cw / R);
    for (let k = 0; k <= 32; k++) { const a = s2 > 0 ? a0 + (Math.PI - 2 * a0) * k / 32 : -a0 - (Math.PI - 2 * a0) * k / 32; pts.push([Math.cos(a) * R, Math.sin(a) * R]); }
    const c = [0, s2 * R * 0.5]; for (let k = 0; k < pts.length - 1; k++) gbvTri(o, W(c[0], c[1], YF), W(pts[k][0], pts[k][1], YF), W(pts[k + 1][0], pts[k + 1][1], YF), [0, 1, 0], [c[0] / 3, c[1] / 3], [pts[k][0] / 3, pts[k][1] / 3], [pts[k + 1][0] / 3, pts[k + 1][1] / 3]);
    gbvTri(o, W(c[0], c[1], YF), W(pts[pts.length - 1][0], pts[pts.length - 1][1], YF), W(pts[0][0], pts[0][1], YF), [0, 1, 0], [0, 0], [1, 0], [0, 1]); }
  gbvQuad(B("ziegel"), W(-uc, -cw, YF - 1.5), W(uc, -cw, YF - 1.5), W(uc, cw, YF - 1.5), W(-uc, cw, YF - 1.5), [0, 1, 0], [[0, 0], [uc, 0], [uc, 2], [0, 2]]);
  for (const s2 of [-1, 1]) gbvQuad(B("ziegel"), W(-uc, s2 * cw, YF - 1.5), W(uc, s2 * cw, YF - 1.5), W(uc, s2 * cw, YF), W(-uc, s2 * cw, YF), dirW(0, -s2), [[0, 0], [uc, 0], [uc, 0.75], [0, 0.75]]);
  gbvQuad(B("wasser"), W(-uc, -cw, YF - 1.2), W(uc, -cw, YF - 1.2), W(uc, cw, YF - 1.2), W(-uc, cw, YF - 1.2), [0, 1, 0], [[0, 0], [0, uc / 3], [1, uc / 3], [1, 0]]);
  gbvQuad(B("gitter"), W(-uc, -cw, YF - 0.02), W(uOpen, -cw, YF - 0.02), W(uOpen, cw, YF - 0.02), W(-uc, cw, YF - 0.02), [0, 1, 0], [[0, 0], [(uOpen + uc) * 2, 0], [(uOpen + uc) * 2, 8], [0, 8]]);
  // Wasserfall aus dem Zugang +u in den Kanal, Gischt
  gbvQuad(B("wasser"), W(R - 0.3, -1.2, YG - 0.12), W(R - 0.3, 1.2, YG - 0.12), W(R - 1.2, 1.2, YF - 1.2), W(R - 1.2, -1.2, YF - 1.2), dirW(-1, 0), [[0, 0], [1, 0], [1, 3], [0, 3]]);
  box("gischt", R - 2, 0, 2.4, 3.6, YF - 1.2, YF - 0.6);
  // Galerie (Gitterboden-Ring) mit Gelaender, Luecken an Steg und Treppen
  const RI = R - 3, gaps = [Math.PI / 2, -Math.PI / 2, Math.PI - Math.asin(9 / RI), Math.PI + Math.asin(9 / RI)], inGap = a => gaps.some(g => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) < 1.4 / RI * 1.2);
  for (let k = 0; k < 64; k++) { const a0 = k / 64 * Math.PI * 2, a1 = (k + 1) / 64 * Math.PI * 2, am = (a0 + a1) / 2, P = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];
    const [i0, j0] = P(a0, RI), [i1, j1] = P(a1, RI), [o0, p0] = P(a0, R), [o1, p1] = P(a1, R);
    gbvQuad(B("gitter"), W(i0, j0, YG), W(i1, j1, YG), W(o1, p1, YG), W(o0, p0, YG), [0, 1, 0], [[0, 0], [2, 0], [2, 6], [0, 6]]);
    gbvQuad(B("stahl"), W(i0, j0, YG - 0.3), W(i1, j1, YG - 0.3), W(i1, j1, YG), W(i0, j0, YG), dirW(-Math.cos(am), -Math.sin(am)), [[0, 0], [1, 0], [1, 0.1], [0, 0.1]]);
    const [mu, mv] = P(am, (RI + R) / 2), [x, , z] = W(mu, mv, 0), ta = [-Math.sin(am) * ux - Math.cos(am) * uz, 0];
    dkAdd({ cx: x, cy: YG - 0.15, cz: z, ux: Math.cos(am) * ux - Math.sin(am) * uz, uz: Math.cos(am) * uz + Math.sin(am) * ux, hl: 1.5, hw: Math.PI * R / 64 + 0.1, hh: 0.15, m: 0, ceil: 0 }); void ta;
    if (!inGap(am)) { const [gu, gv] = P(a0, RI); box("eisen", gu, gv, 0.06, 0.06, YG, YG + 1.1); gbvQuad(B("eisen"), W(i0, j0, YG + 1.05), W(i1, j1, YG + 1.05), W(i1, j1, YG + 1.1), W(i0, j0, YG + 1.1), dirW(-Math.cos(am), -Math.sin(am)), [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const [ru, rv] = P(am, RI + 0.1); dk(ru, rv, 0.3, Math.PI * RI / 64 * 2, YG, YG + 1.1, { floor: 0 }); } }
  // Steg quer ueber die Halle (entlang v) auf Galeriehoehe, mit Gelaender
  box("gitter", 0, 0, 2.4, 2 * RI, YG - 0.02, YG); box("stahl", 0, 0, 0.3, 2 * RI, YG - 0.6, YG - 0.02);
  for (const s2 of [-1, 1]) { box("eisen", s2 * 1.2, 0, 0.06, 2 * RI, YG + 1.05, YG + 1.1); for (let v = -RI; v <= RI; v += 2.5) box("eisen", s2 * 1.2, v, 0.06, 0.06, YG, YG + 1.1); dk(s2 * 1.25, 0, 0.2, 2 * RI - 1, YG, YG + 1.1, { floor: 0 }); }
  dk(0, 0, 2.4, 2 * RI, YG - 0.3, YG, { ceil: 0 });
  // Treppen: von der Galerie (u = -sqrt(RI^2 - 81), v = +-9) in +u hinunter auf den Hallenboden, 32 Stufen a 0,25 x 0,45
  const us = -Math.sqrt(RI * RI - 81);
  for (const sv of [-9, 9]) { for (let k = 0; k < 32; k++) { const u = us + 0.225 + k * 0.45, y = YG - (k + 1) * 0.25; box("stahl", u, sv, 0.45, 1.6, y - 0.08, y); dk(u, sv, 0.45, 1.6, y - 0.3, y, { ceil: 0 }); }
    for (const s3 of [-1, 1]) { const a = W(us, sv + s3 * 0.85, YG + 1), b = W(us + 14.4, sv + s3 * 0.85, YF + 1), o = gbvBucket(out, "eisen"), n = dirW(0, s3);
      gbvQuad(o, a, b, [b[0], b[1] + 0.06, b[2]], [a[0], a[1] + 0.06, a[2]], n, [[0, 0], [1, 0], [1, 1], [0, 1]]); for (let k = 0; k <= 4; k++) { const u = us + k * 3.6; box("eisen", u, sv + s3 * 0.85, 0.05, 0.05, YG - k * 2, YG - k * 2 + 1); } } }
  // Pfeiler rundum (nicht vor Treppen, Steg, Zugaengen)
  for (let k = 0; k < 16; k++) { const a = (k + 0.5) / 16 * Math.PI * 2, r = R - 3.6, u = Math.cos(a) * r, v = Math.sin(a) * r; if (Math.abs(v) < 2.5 && u < 0 || Math.abs(u) < 3) continue;
    gbvCyl(out, "ziegel", f, u, v, 0.7, YF, YC, 14, false); dk(u, v, 1.1, 1.1, YF, YG - 0.35, { floor: 0 }); }
  // Lampen
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2, u = Math.cos(a) * 15, v = Math.sin(a) * 15; box("lampe", u, v, 0.8, 0.8, YC - 1.6, YC - 1.3); box("eisen", u, v, 0.04, 0.04, YC - 1.3, YC); }
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, u = Math.cos(a) * (R - 0.15), v = Math.sin(a) * (R - 0.15); box("lampe", u, v, 0.25, 0.25, YG + 2.6, YG + 2.8); }
  // Basis der Boesen: Waffen unter Planen, Waffen, Tisch mit Computer, Boxsack, Faesser (Hallenboden, v < -cw und v > cw)
  for (const [u, v] of [[4, -10], [6.2, -10.4], [5, -12.3]]) { box("holz", u, v, 1.6, 1, YF, YF + 0.9); box("plane", u, v, 1.9, 1.3, YF + 0.88, YF + 1.05); box("plane", u, v + 0.62, 1.9, 0.06, YF + 0.2, YF + 1.05); dk(u, v, 1.6, 1, YF, YF + 1.05); }
  box("plane", 9, -7.5, 3.2, 2.2, YF, YF + 0.5); box("plane", 9, -7.5, 2.6, 1.6, YF + 0.5, YF + 0.8);   // Plane ueber einem Stapel
  for (const [u, v, r] of [[3, -7, 0.3], [7.5, -12, 1.2], [11, -10, 2.0], [4.8, -10.2, 0.6], [2, -13, 2.6], [-2, -8, 1.0]]) { const fq = gbvFrame({ P0: (([x, , z]) => [x, z])(W(u, v, 0)), e1: [Math.cos(r) * ux - Math.sin(r) * uz, Math.cos(r) * uz + Math.sin(r) * ux], e2: [-(Math.cos(r) * uz + Math.sin(r) * ux), Math.cos(r) * ux - Math.sin(r) * uz], L1: 1, L2: 1 });
    const y = u === 4.8 ? YF + 1.05 : YF; gbvBox(out, "waffe", fq, 0, 0, 1.0, 0.07, y, y + 0.12); gbvBox(out, "waffe", fq, -0.55, 0, 0.3, 0.09, y, y + 0.18); gbvBox(out, "waffe", fq, 0.1, 0, 0.06, 0.05, y - 0.0, y + 0.22); }
  box("holz", -4, 12, 2.4, 1.1, YF + 0.72, YF + 0.78); for (const [a, b] of [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]]) box("eisen", -4 + a, 12 + b, 0.06, 0.06, YF, YF + 0.72); dk(-4, 12, 2.4, 1.1, YF, YF + 0.78);
  for (const a of [-0.6, 0.55]) { box("eisen", -4 + a, 12.3, 0.9, 0.06, YF + 0.78, YF + 1.35); box("schirm", -4 + a, 12.26, 0.84, 0.02, YF + 0.82, YF + 1.31); }
  box("eisen", -4, 11.8, 0.7, 0.2, YF + 0.78, YF + 0.81); box("stahl", -4, 10.9, 0.55, 0.55, YF, YF + 0.5); box("stahl", -4, 10.65, 0.55, 0.08, YF + 0.5, YF + 1.1);
  box("eisen", 8, 13, 0.04, 0.04, YF + 2.2, YC - 0.9); gbvCyl(out, "sack", f, 8, 13, 0.35, YF + 0.9, YF + 2.2, 14, true); dk(8, 13, 0.7, 0.7, YF + 0.9, YF + 2.2, { floor: 0 });
  for (const [u, v] of [[14, 8], [15, 9.4], [13.2, 9.8], [-12, -6], [-13, -7.3]]) { gbvCyl(out, "rost", f, u, v, 0.45, YF, YF + 1.2, 12, true); dk(u, v, 0.9, 0.9, YF, YF + 1.2); }
  // Kollision: Raum, Boeden (Halbscheiben in Streifen), Kanal (offen unter dem Wasserfall), Gelaender ums offene Stueck
  dkRoom({ poly: Array.from({ length: 32 }, (_, k) => { const a = k / 32 * Math.PI * 2, p = W(Math.cos(a) * (R - 0.4), Math.sin(a) * (R - 0.4), 0); return [p[0], p[2]]; }), y0: YF - 2.5, y1: YC });
  for (let u = -R; u < R; u += 4) for (const s2 of [-1, 1]) { const um = u + 2, half = Math.sqrt(Math.max(0, (R - 0.4) ** 2 - um * um)); if (half <= cw) continue; dk(um, s2 * (cw + half) / 2, 4, half - cw, YF - 0.5, YF, { ceil: 0 }); }
  dk((-uc + uOpen) / 2, 0, uOpen + uc, 2 * cw, YF - 0.3, YF, { ceil: 0 }); dk((uOpen + uc) / 2, 0, uc - uOpen, 2 * cw, YF - 1.8, YF - 1.5, { ceil: 0 });
  for (const s2 of [-1, 1]) { box("eisen", (uOpen + uc) / 2, s2 * (cw + 0.05), uc - uOpen, 0.06, YF + 1.05, YF + 1.1); for (let u = uOpen; u <= uc; u += 2) box("eisen", u, s2 * (cw + 0.05), 0.06, 0.06, YF, YF + 1.1); dk((uOpen + uc) / 2, s2 * (cw + 0.1), uc - uOpen, 0.2, YF, YF + 1.1, { floor: 0 }); }
  box("eisen", uOpen, 0, 0.06, 2 * cw, YF + 1.05, YF + 1.1); dk(uOpen - 0.1, 0, 0.2, 2 * cw, YF, YF + 1.1, { floor: 0 });
  KAN.hubInfo = { R, YF, YG, YC };
}
// ---------- U2 Uebergaenge U-Bahn <-> Kanal (Teil C) ----------
// An 4 Stellen, wo ein Hauptsammler unter einem U-Bahn-Tunnel durchgeht (tiefe Decke), je eine Stahltuer mit Schild KANAL in der Tunnelwand
// und eine Tuer U-BAHN in der Kanalwand; Rechtsklick geht hindurch (Teleport, wie die Aufzuege der U-Bahn).
function kanU2(out, B) {
  const Y = KAN.Y, HW = KAN.HW, cand = [];
  for (const S of KAN.sewers) { if (S.side || S.hub || S.spoke || !S.C) continue; let run = null; S.P.forEach((p, i) => { const low = S.C[i] < Y + KAN.H - 0.5; if (low && !run) run = [i, i]; else if (low) run[1] = i; else if (run) { cand.push([S, Math.round((run[0] + run[1]) / 2)]); run = null; } }); }
  const pick = []; while (pick.length < 4 && cand.length) { let best = null, bd = -1; for (const c of cand) { const p = c[0].P[c[1]], d = pick.length ? Math.min(...pick.map(q => Math.hypot(q[0].P[q[1]][0] - p[0], q[0].P[q[1]][1] - p[1]))) : 1e9; if (d > bd) { bd = d; best = c; } } pick.push(best); cand.splice(cand.indexOf(best), 1); }
  const hitM = new THREE.MeshBasicMaterial({ visible: false }), near = (x, z) => Math.hypot(player.pos.x - x, player.pos.z - z) < 4;
  for (const [S, i0] of pick) { const p = S.P[i0];
    let br = null, bk = 0, bd = 1e9; for (const r of UB.rings) for (let k = 0; k < r.P.length; k++) { const d = Math.hypot(r.P[k][0] - p[0], r.P[k][1] - p[1]); if (d < bd) { bd = d; br = r; bk = k; } }
    if (!br || bd > 12) continue;
    const n = br.P.length, a = br.P[(bk - 1 + n) % n], b = br.P[(bk + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l;
    // Tuer im U-Bahn-Tunnel: 12 m neben der Kreuzung an der Wand (Seite +), Blick zur Tunnelmitte
    const k2 = (bk + 3) % n, c2 = br.P[k2], hw = ubHW(br, k2) - 0.06, dU = [c2[0] - tz * hw, c2[1] + tx * hw], nU = [tz, -tx];
    // Tuer im Kanal: 10 m neben der Kreuzung an der Wand (Seite +)
    const j = Math.min(S.P.length - 2, i0 + 3), sp = S.P[j], sn = S.N[j], dK = [sp[0] + sn[0] * (HW - 0.06), sp[1] + sn[1] * (HW - 0.06)], nK = [-sn[0], -sn[1]];
    for (const [D, N, y0, label, M] of [[dU, nU, UB.BED, "KANAL", "schildK"], [dK, nK, Y, "U-BAHN", "schildU"]]) { const fq = gbvFrame({ P0: D, e1: [N[1], -N[0]], e2: N, L1: 1, L2: 1 });
      gbvBox(out, "eisen", fq, 0, 0.05, 1.5, 0.1, y0, y0 + 2.3); gbvBox(out, "stahl", fq, 0, 0.02, 1.8, 0.06, y0 + 2.3, y0 + 2.5); for (const s of [-0.85, 0.85]) gbvBox(out, "stahl", fq, s, 0.02, 0.15, 0.06, y0, y0 + 2.5);
      gbvBox(out, M, fq, 0, 0.11, 1.0, 0.02, y0 + 2.6, y0 + 2.95); void label; }
    const hu = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.8), hitM); hu.position.set(dU[0], UB.BED + 1.2, dU[1]); KAN.grp.add(hu);
    const hk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.8), hitM); hk.position.set(dK[0], Y + 1.2, dK[1]); KAN.grp.add(hk);
    const toK = [dK[0] + nK[0] * 1.6, dK[1] + nK[1] * 1.6], toU = [dU[0] + nU[0] * 1.6, dU[1] + nU[1] * 1.6];
    gates.push({ name: "Wartungstür Kanal", g: hu, call: () => { if (!near(dU[0], dU[1])) return toast("Zu weit von der Tür entfernt"); teleportToPoint({ x: toK[0], y: Y, z: toK[1] }); toast("Kanalisation unter " + S.name); }, verbs: ["öffnen", "öffnen"], a: dU, b: dU, near: 4 });
    gates.push({ name: "Wartungstür U-Bahn", g: hk, call: () => { if (!near(dK[0], dK[1])) return toast("Zu weit von der Tür entfernt"); teleportToPoint({ x: toU[0], y: UB.BED, z: toU[1] }); toast("U-Bahn-Tunnel " + br.name); }, verbs: ["öffnen", "öffnen"], a: dK, b: dK, near: 4 });
    (KAN.u2 || (KAN.u2 = [])).push({ sewer: S.id, ring: br.name, u: dU, k: dK }); }
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (KAN.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = kanGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { KAN.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
// je Bild (schleife.js): Wasser fliesst (nur wenn die Kanalisation sichtbar ist)
function kanStep(dt) { if (KAN.waterTex && KAN.grp && KAN.grp.visible) KAN.waterTex.offset.y -= dt * 0.25; }
