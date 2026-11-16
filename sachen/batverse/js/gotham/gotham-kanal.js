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
    let run = []; const flush = () => { if (run.length > 3) KAN.sewers.push({ id: r.id, name: r.name, P: run, ring: ring && run.length === P.length }); run = []; };
    for (const p of P) { if (GOT.edgeSD(p[0], p[1]) > -16) flush(); else run.push(p); } flush(); }
  for (const S of KAN.sewers) { const P = S.P, n = P.length; S.N = P.map((p, i) => { const a = P[S.ring ? (i - 1 + n) % n : Math.max(0, i - 1)], b = P[S.ring ? (i + 1) % n : Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
    // Decke je Punkt: U-Bahn-Raum darueber -> tief, weich ueber 3 Punkte
    const low = P.map(([x, z], i) => [-HW, 0, HW].some(d => dkInRoom(x + S.N[i][0] * d, -24, z + S.N[i][1] * d)));
    yield;
    S.C = P.map((_, i) => { let k = 0; for (let j = -4; j <= 4; j++) { const q = S.ring ? (i + j + n) % n : i + j; if (q >= 0 && q < n && low[q]) k = Math.max(k, 1 - Math.max(0, Math.abs(j) - 1) / 4); } return Y + KAN.H - (Y + KAN.H - KAN.LOW) * k; }); }
  yield;
  // Raster fuer "liegt im Innenraum eines anderen Sammlers"
  const G = new Map(), gk = (x, z) => Math.floor(x / 16) * 100000 + Math.floor(z / 16);
  KAN.sewers.forEach((S, si) => S.P.forEach((p, i) => { const k = gk(p[0], p[1]); let c = G.get(k); if (!c) G.set(k, c = []); c.push([si, i]); }));
  const inOther = (x, z, si, r = HW - 0.15) => { const i0 = Math.floor(x / 16), k0 = Math.floor(z / 16);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const [sj, j] of G.get((i0 + a) * 100000 + k0 + b) || []) { if (sj === si) continue; const S = KAN.sewers[sj], P = S.P, q = P[j], n = P.length, q2 = P[S.ring ? (j + 1) % n : Math.min(n - 1, j + 1)];
      const dx = q2[0] - q[0], dz = q2[1] - q[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - q[0]) * dx + (z - q[1]) * dz) / L2)); if (Math.hypot(x - q[0] - dx * t, z - q[1] - dz * t) < r) return true; }
    return false; };
  KAN.inOther = inOther;
  const brick = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#4a3a30"; c.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { const x = (k + (r % 2) * 0.5) * 64 - 32, y = r * 32, v = 70 + Math.random() * 30;
    c.fillStyle = `rgb(${v + 30},${v * 0.75},${v * 0.6})`; c.fillRect(x + 3, y + 3, 58, 26); c.fillRect(x + 3 + 256, y + 3, 58, 26); } c.fillStyle = "rgba(40,60,30,0.35)"; c.fillRect(0, h * 0.8, w, h * 0.2); }, 1, 1);
  const conc = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#5c5a55"; c.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = 70 + Math.random() * 40; c.fillStyle = `rgb(${v},${v},${v - 4})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  KAN.waterTex = canvasTex(64, 256, (c, w, h) => { c.fillStyle = "#3d4a36"; c.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(${150 + Math.random() * 60},${160 + Math.random() * 60},120,0.25)`; c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 6, 1 + Math.random() * 18); } });
  yield;
  for (const t of [brick, conc, KAN.waterTex]) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const M = { ziegel: new THREE.MeshStandardMaterial({ map: brick, roughness: 0.9, side: THREE.DoubleSide }), steg: new THREE.MeshStandardMaterial({ map: conc, roughness: 0.95 }),
    wasser: new THREE.MeshStandardMaterial({ map: KAN.waterTex, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88, emissive: 0x18200f, emissiveIntensity: 1 }),
    lampe: new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffd590, emissiveIntensity: 1.6 }), eisen: new THREE.MeshStandardMaterial({ color: 0x2a2b2d, roughness: 0.6, metalness: 0.6 }) };
  // Schacht und Leiter unter jedem Gulli (Rohr bis in den Kanal), Deckel auf der Strasse (eigenes Netz ueber der Erde)
  const mk = (map, parent, name) => { for (const [key, b] of map) { if (!b.p.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(b.p, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(b.n, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
    const m = new THREE.Mesh(geo, M[key] || gbvInit()[key]); m.name = name + " " + key; m.receiveShadow = true; m.userData.keep = true; m.userData.noLift = true; parent.add(m); } };
  const grp = new THREE.Group(); grp.name = "Gotham Kanalisation"; KAN.grp = grp;   // Netze je Sammler (kleinere Portionen beim Aufbau)
  // 2. Netze und Kollision je Abschnitt
  const B = k => gbvBucket(out, k), V = (p, nn, d, y) => [p[0] + nn[0] * d, y, p[1] + nn[1] * d];
  const arch = 6, AR = Math.PI / arch;
  for (let si = 0; si < KAN.sewers.length; si++) { const S = KAN.sewers[si], P = S.P, n = P.length, segs = S.ring ? n : n - 1; let uu = 0; out = new Map();
    for (let i = 0; i < segs; i++) { const j = (i + 1) % n, p0 = P[i], p1 = P[j], n0 = S.N[i], n1 = S.N[j], c0 = S.C[i], c1 = S.C[j], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), u0 = uu, u1 = uu + L; uu = u1;
      const fx = (p1[0] - p0[0]) / (L || 1), fz = (p1[1] - p0[1]) / (L || 1), mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
      // Boden: Stege, Rinnenwaende, Rinnenboden, Wasser
      for (const sd of [-1, 1]) { const a = sd * CW, b = sd * HW; gbvQuad(B("steg"), V(p0, n0, a, Y), V(p1, n1, a, Y), V(p1, n1, b, Y), V(p0, n0, b, Y), [0, 1, 0], [[a / 2, u0 / 2], [a / 2, u1 / 2], [b / 2, u1 / 2], [b / 2, u0 / 2]]);
        gbvQuad(B("steg"), V(p0, n0, a, Y - 0.3), V(p1, n1, a, Y - 0.3), V(p1, n1, a, Y), V(p0, n0, a, Y), [-n0[0] * sd, 0, -n0[1] * sd], [[u0 / 2, 0], [u1 / 2, 0], [u1 / 2, 0.15], [u0 / 2, 0.15]]); }
      gbvQuad(B("steg"), V(p0, n0, -CW, Y - 0.3), V(p1, n1, -CW, Y - 0.3), V(p1, n1, CW, Y - 0.3), V(p0, n0, CW, Y - 0.3), [0, 1, 0], [[0, u0 / 2], [0, u1 / 2], [1, u1 / 2], [1, u0 / 2]]);
      gbvQuad(B("wasser"), V(p0, n0, -CW, Y - 0.12), V(p1, n1, -CW, Y - 0.12), V(p1, n1, CW, Y - 0.12), V(p0, n0, CW, Y - 0.12), [0, 1, 0], [[0, u0 / 6], [0, u1 / 6], [1, u1 / 6], [1, u0 / 6]]);
      // Waende und Gewoelbe (Seite weg, wenn im Innenraum eines anderen Sammlers)
      for (const sd of [-1, 1]) { const w0 = V(p0, n0, sd * HW, 0), w1 = V(p1, n1, sd * HW, 0); if (inOther(w0[0], w0[2], si) || inOther(w1[0], w1[2], si)) continue;
        const wt0 = c0 - Math.min(2.2, (c0 - Y) * 0.4), wt1 = c1 - Math.min(2.2, (c1 - Y) * 0.4);
        gbvQuad(B("ziegel"), V(p0, n0, sd * HW, Y - 0.05), V(p1, n1, sd * HW, Y - 0.05), V(p1, n1, sd * HW, wt1), V(p0, n0, sd * HW, wt0), [-n0[0] * sd, 0, -n0[1] * sd], [[u0 / 2, 0], [u1 / 2, 0], [u1 / 2, (wt1 - Y) / 2], [u0 / 2, (wt0 - Y) / 2]]);
        for (let k = 0; k < arch / 2; k++) { const aA = k * AR, aB = (k + 1) * AR, X = (a, p, nn, wt, c) => V(p, nn, sd * HW * Math.cos(a), wt + (c - wt) * Math.sin(a)), nrm = [-n0[0] * sd * Math.cos(aA + AR / 2), -Math.sin(aA + AR / 2), -n0[1] * sd * Math.cos(aA + AR / 2)];
          gbvQuad(B("ziegel"), X(aA, p0, n0, wt0, c0), X(aA, p1, n1, wt1, c1), X(aB, p1, n1, wt1, c1), X(aB, p0, n0, wt0, c0), nrm, [[u0 / 2, (wt0 - Y) / 2 + k * 0.9], [u1 / 2, (wt1 - Y) / 2 + k * 0.9], [u1 / 2, (wt1 - Y) / 2 + (k + 1) * 0.9], [u0 / 2, (wt0 - Y) / 2 + (k + 1) * 0.9]]); } }
      // Lampe alle 16 m (abwechselnd links/rechts)
      if (i % 4 === 0) { const sd = (i / 4) % 2 ? 1 : -1, [x, , z] = V(p0, n0, sd * (HW - 0.12), 0); if (!inOther(x, z, si)) gbvBox(out, "lampe", gbvFrame({ P0: [x, z], e1: [fx, fz], e2: [-fz, fx], L1: 1, L2: 1 }), 0, 0, 0.8, 0.2, Y + 3.0, Y + 3.25); }
      // Kollision: Raum, Stege, Rinne (Decke = tiefste der beiden Enden)
      const RW = HW - 0.4, e0 = !S.ring && i === 0 ? 0.5 : 0, e1 = !S.ring && j === n - 1 ? 0.5 : 0, q0 = [p0[0] + fx * e0, p0[1] + fz * e0], q1 = [p1[0] - fx * e1, p1[1] - fz * e1];   // Barriere weiter innen als die sichtbare Wand bzw. das Ende (Nicolas-Regel)
      dkRoom({ poly: [[q0[0] - n0[0] * RW, q0[1] - n0[1] * RW], [q1[0] - n1[0] * RW, q1[1] - n1[1] * RW], [q1[0] + n1[0] * RW, q1[1] + n1[1] * RW], [q0[0] + n0[0] * RW, q0[1] + n0[1] * RW]], y0: Y - 1, y1: Math.min(c0, c1) });
      for (const [d, hw, top] of [[-(HW + CW) / 2, (HW - CW) / 2, Y], [(HW + CW) / 2, (HW - CW) / 2, Y], [0, CW, Y - 0.3]]) dkAdd({ cx: mx + n0[0] * d, cy: top - 0.25, cz: mz + n0[1] * d, ux: fx, uz: fz, hl: L / 2 + 0.05, hw, hh: 0.25, m: 0, ceil: 0 });
      if (i % 12 === 0) yield; }
    // Enden zu (ausser im Innenraum eines anderen Sammlers)
    if (!S.ring) for (const [i, sg] of [[0, -1], [n - 1, 1]]) { const p = P[i], nn = S.N[i], c = S.C[i]; if (inOther(p[0], p[1], si, HW + 1)) continue;
      const q = P[i - sg] || p, l = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1, ex = (p[0] - q[0]) / l, ez = (p[1] - q[1]) / l;
      gbvQuad(B("ziegel"), V(p, nn, -HW, Y - 0.5), V(p, nn, HW, Y - 0.5), V(p, nn, HW, c), V(p, nn, -HW, c), [-ex, 0, -ez], [[0, 0], [4, 0], [4, (c - Y) / 2], [0, (c - Y) / 2]]); }
    yield; mk(out, grp, "Kanal " + S.id); yield; }
  // 3. Gullideckel alle 70 m (auf der Fahrbahn, Mitte), Schacht mit Leiter
  const step = Math.round((GOTHAM.kanal.gulliAbstand || 70) / DS);
  for (let si = 0; si < KAN.sewers.length; si++) { const S = KAN.sewers[si], P = S.P;
    for (let i = Math.floor(step / 2); i < P.length - 2; i += step) { const p = P[i], nn = S.N[i], [x, z] = [p[0] + nn[0] * (HW - 0.6), p[1] + nn[1] * (HW - 0.6)];
      if (inOther(x, z, si) || [-21, -15].some(y => dkInRoom(x, y, z))) continue;   // nicht an Kreuzungen, nicht ueber U-Bahn, unterer Strasse oder Tiefgarage (der Schacht ginge hindurch)
      KAN.gullis.push({ x, z, si, i, fx: -nn[1], fz: nn[0] }); } }
  yield;
  // 4. Netze
  const lad = new Map(), lid = new Map();
  for (const gq of KAN.gullis) { const f = gbvFrame({ P0: [gq.x, gq.z], e1: [gq.fx, gq.fz], e2: [-gq.fz, gq.fx], L1: 1, L2: 1 });
    const yTop = KAN.sewers[gq.si].C[gq.i];   // Leiter nur im Kanal sichtbar (darueber liegt der Schacht im Gelaende)
    for (const sx of [-0.25, 0.25]) gbvBox(lad, "eisen", f, sx, 0.45, 0.05, 0.05, Y, yTop, null, false); for (let y = Y + 0.3; y < yTop - 0.2; y += 0.3) gbvBox(lad, "eisen", f, 0, 0.45, 0.55, 0.04, y, y + 0.04, null, false);
    gbvCyl(lid, "eisen", f, 0, 0, 0.42, GOT.STR + 0.01, GOT.STR + 0.04, 16); if (KAN.gullis.indexOf(gq) % 30 === 29) yield; }
  yield; mk(lad, grp, "Kanal Leitern"); yield; scene.add(grp); UNDERGROUND.push(grp); grp.visible = typeof ugVis === "boolean" ? ugVis : false; KAN.grp = grp;
  yield; const lids = new THREE.Group(); lids.name = "Gullideckel"; mk(lid, lids, "Gulli"); scene.add(lids); yield;
  yield;
  // 5. Einstieg: Rechtsklick auf den Deckel (hinunter) bzw. die Leiter (hinauf); je Gulli ein unsichtbarer Klickkasten
  const hitM = new THREE.MeshBasicMaterial({ visible: false }), near = (x, z) => Math.hypot(player.pos.x - x, player.pos.z - z) < 4;
  for (const gq of KAN.gullis) { const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), hitM); top.position.set(gq.x, GOT.STR + 0.1, gq.z); scene.add(top);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1.2), hitM); bot.position.set(gq.x - gq.fz * 0.3, Y + 1.2, gq.z + gq.fx * 0.3); grp.add(bot);
    const S = KAN.sewers[gq.si], p = S.P[gq.i], nn = S.N[gq.i], dn = [p[0] + nn[0] * (HW - 1.6), p[1] + nn[1] * (HW - 1.6)];
    gates.push({ name: "Gullideckel", g: top, call: () => { if (!near(gq.x, gq.z)) return toast("Zu weit vom Gullideckel entfernt"); teleportToPoint({ x: dn[0], y: Y, z: dn[1] }); toast("Kanalisation unter " + S.name); }, verbs: ["hinuntersteigen", "hinuntersteigen"], a: [gq.x, gq.z], b: [gq.x, gq.z], near: 4 });
    gates.push({ name: "Leiter", g: bot, call: () => { if (!near(gq.x, gq.z)) return toast("Zu weit von der Leiter entfernt"); teleportToPoint({ x: gq.x + gq.fx * 2, y: GOT.STR + 0.5, z: gq.z + gq.fz * 2 }); toast("Oben auf der Strasse"); }, verbs: ["hinaufsteigen", "hinaufsteigen"], a: [gq.x, gq.z], b: [gq.x, gq.z], near: 4 });
    if (KAN.gullis.indexOf(gq) % 20 === 19) yield; }
  KAN.info = { sewers: KAN.sewers.length, km: +(KAN.sewers.reduce((a, S) => a + S.P.length * DS, 0) / 1000).toFixed(1), gullis: KAN.gullis.length, tris: grp.children.reduce((a, m) => a + m.geometry.attributes.position.count / 3, 0) };
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (KAN.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = kanGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { KAN.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
// je Bild (schleife.js): Wasser fliesst (nur wenn die Kanalisation sichtbar ist)
function kanStep(dt) { if (KAN.waterTex && KAN.grp && KAN.grp.visible) KAN.waterTex.offset.y -= dt * 0.25; }
