// Batverse – Gotham: Boerse (N1, Nicolas 2026-11-17 Notizen und Filmbild eines Handelssaals; gebaut 2026-11-19 "Ja, weiter"). Eigener Entwurf, steht auf der frueheren
// Baustelle BS-01 (60 x 50 m; GBST.skip). Klassizistischer Bau: Vorplatz, Podest mit Stufen, Portikus mit acht Saeulen und Giebel "GOTHAM STOCK EXCHANGE", Fahnen.
// Innen ein hoher Handelssaal (begehbar): Pilaster, Kassettendecke mit Oberlicht, fuenf achteckige Handelsposten mit Bildschirmkranz und Leuchtdach, Haendlertische mit
// Monitoren an den Seiten, zwei grosse Kurstafeln und ein Laufband ueber dem Eingang (Kurse wie im Laptop: liest wm-boerse, sonst eigener Zufallslauf, alle 4 s),
// Papier am Boden. Licht ueber leuchtende Materialien. Kollision mit dkAdd (Waende mit Tuer, Posten, Tische, Stufen).
"use strict";
const GBOE = { done: false, anim: null };
const GBOE_AKT = [["WYNE", "Wayne Enterprises", 412], ["PMG", "Prestige Motors", 88], ["BGC", "Budget Cars", 14.5], ["ACE", "Ace Chemicals", 37], ["KANE", "Kane Textiles", 22], ["GARM", "Gotham Arms", 64], ["GCB", "Gotham City Bank", 129], ["GTRN", "Gotham Transit", 9.8]];
function gboeKurse() { let d = null; try { d = JSON.parse(localStorage.getItem("wm-boerse") || "null"); } catch (e) {}
  const K = GBOE.k || (GBOE.k = {}); for (const [s, , p0] of GBOE_AKT) { const alt = K[s] ? K[s].p : p0, neu = d && d.p && d.p[s] ? d.p[s] : Math.max(0.5, Math.round(alt * (1 + (p0 - alt) / p0 * 0.01 + (Math.random() - 0.5) * 0.03) * 100) / 100);
    K[s] = { p: neu, d: K[s] ? neu - K[s].p : 0 }; } return K; }
function* gboeGen() {
  while (!GSTR.done) yield "wait";
  const b = gbstList().find(q => q.id === "BS-01"); if (!b) return;
  const F = gbstFrame(b), front = gbstGate(b), Y = GOT.STR;
  const sides = gbstSides(F, 0), sd = sides[front], A = F.at(sd[0], sd[1]), Bp = F.at(sd[2], sd[3]), W = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
  const D = front % 2 === 0 ? F.L2 : F.L1, cx0 = (A[0] + Bp[0]) / 2, cz0 = (A[1] + Bp[1]) / 2, [mx, mz] = F.at(F.L1 / 2, F.L2 / 2), il = Math.hypot(mx - cx0, mz - cz0), vx = (mx - cx0) / il, vz = (mz - cz0) / il;
  const g = new THREE.Group(); g.name = "Gotham Stock Exchange"; g.userData.keep = true; g.userData.noLift = true; const th = Math.atan2(vx, vz); g.position.set(cx0, Y, cz0); g.rotation.y = th; const lx = Math.cos(th), lz = -Math.sin(th);
  const P = (x, z) => [cx0 + lx * x + vx * z, cz0 + lz * x + vz * z], M = o => new THREE.MeshStandardMaterial({ roughness: 0.6, ...o });
  const box = (sx, sy, sz, m, x, y, z, par = g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; par.add(o); return o; };
  const cyl = (rt, rb, h, m, x, y, z, seg = 20) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  const dk = (sx, sy, sz, x, y0, z, m = 0.15) => { const [cx, cz] = P(x, z); return dkAdd({ cx, cy: Y + y0 + sy / 2, cz, ux: lx, uz: lz, hl: sx / 2, hw: sz / 2, hh: sy / 2, m }); };
  const stein = M({ color: 0xd8d2c4, emissive: 0x2a2824 }), stein2 = M({ color: 0xc4bdae, emissive: 0x24221e }), dunkel = M({ color: 0x24262a, roughness: 0.5, metalness: 0.3 }), holz = M({ color: 0x6a4428, emissive: 0x1a0e06 }), gold = M({ color: 0xc9a640, metalness: 0.8, roughness: 0.3, emissive: 0x2a1e06 });
  const licht = new THREE.MeshBasicMaterial({ color: 0xfff6e0 }), boden = M({ color: 0x8a7a66, roughness: 0.35, map: canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#9a8a74"; c.fillRect(0, 0, w, h); c.fillStyle = "#6a5a48"; c.fillRect(0, 0, w / 2, h / 2); c.fillRect(w / 2, h / 2, w / 2, h / 2); }, 20, 14), emissive: 0x2a241c });
  const BW = 48, BD = 34, Z0 = 12, H = 24, HS = 14, T = 0.6, DW = 2.4;   // Bau 48 x 34 m, 12 m hinter der Front, 24 m hoch, Saal 14 m hoch, Tuer 4,8 m breit
  // Vorplatz, Podest mit Stufen (je 0,2 m), Portikus
  box(W - 1, 0.08, Z0 - 0.5, M({ color: 0x9a948a, roughness: 0.5 }), 0, 0.04, (Z0 - 0.5) / 2);
  for (let k = 0; k < 4; k++) { const z0 = Z0 - 6 + k * 0.5, d = Z0 - z0; box(BW + 2 - k * 0.4, 0.2, d, stein2, 0, 0.1 + k * 0.2, z0 + d / 2); dk(BW + 2 - k * 0.4, 0.2 * (k + 1), d, 0, 0, z0 + d / 2, 0.05); }   // Stufen und Podest (Oberkante 0,8)
  const YP = 0.8;
  for (let i = 0; i < 8; i++) { const x = -BW / 2 + 3 + i * (BW - 6) / 7; if (Math.abs(x) < DW + 0.4) continue; cyl(0.75, 0.85, 14, stein, x, YP + 7.4, Z0 - 3.5, 24); box(2, 0.5, 2, stein2, x, YP + 0.25, Z0 - 3.5); box(2, 0.6, 2, stein2, x, YP + 14.6, Z0 - 3.5); dk(1.7, 15, 1.7, x, YP, Z0 - 3.5); }
  for (const sx of [-1, 1]) { const x = sx * (DW + 1.4); cyl(0.75, 0.85, 14, stein, x, YP + 7.4, Z0 - 3.5, 24); box(2, 0.6, 2, stein2, x, YP + 14.6, Z0 - 3.5); dk(1.7, 15, 1.7, x, YP, Z0 - 3.5); }
  box(BW + 1, 2.2, 6, stein, 0, YP + 16, Z0 - 3);   // Gebaelk
  { const s = new THREE.Shape(); s.moveTo(-BW / 2 - 0.5, 0); s.lineTo(BW / 2 + 0.5, 0); s.lineTo(0, 5.5); s.lineTo(-BW / 2 - 0.5, 0); const ge = new THREE.ExtrudeGeometry(s, { depth: 6, bevelEnabled: false }); ge.translate(0, 0, -3); const gi = new THREE.Mesh(ge, stein); gi.position.set(0, YP + 17.1, Z0 - 3); gi.castShadow = true; g.add(gi); }   // Giebel
  { const t = canvasTex(1024, 96, (c, w, h) => { c.fillStyle = "#d8d2c4"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a3630"; c.font = "bold 64px Georgia"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("GOTHAM  STOCK  EXCHANGE", w / 2, h / 2 + 4); });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(30, 2.8), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, emissive: 0x3a3630, emissiveMap: t })); p.position.set(0, YP + 16, Z0 - 6.02); p.rotation.y = Math.PI; g.add(p); }
  for (const sx of [-1, 1]) { cyl(0.08, 0.1, 12, dunkel, sx * (BW / 2 + 3), 6, 3, 8); box(2.4, 1.5, 0.04, M({ color: 0x1b3a7a }), sx * (BW / 2 + 3) - sx * 1.25, 11, 3); dk(0.4, 12, 0.4, sx * (BW / 2 + 3), 0, 3); }   // Fahnen
  // Baukoerper: Saal innen BW x BD bis HS, darueber geschlossen; Waende mit Tuer
  box(BW, H - HS, BD, stein, 0, (H + HS) / 2, Z0 + BD / 2); box(BW + 1, 1, BD + 1, stein2, 0, H + 0.5, Z0 + BD / 2);
  for (const [sx, sy, sz, x, z] of [[BW, HS, T, 0, Z0 + BD - T / 2], [T, HS, BD, -BW / 2 + T / 2, Z0 + BD / 2], [T, HS, BD, BW / 2 - T / 2, Z0 + BD / 2], [BW / 2 - DW, HS, T, -(BW / 2 + DW) / 2, Z0 + T / 2], [BW / 2 - DW, HS, T, (BW / 2 + DW) / 2, Z0 + T / 2]]) { box(sx, sy, sz, stein, x, sy / 2, z); dk(sx, sy, sz, x, 0, z); }
  box(2 * DW, HS - 6, T, stein, 0, 6 + (HS - 6) / 2, Z0 + T / 2); for (const s of [-1, 1]) box(0.4, 6.2, 0.9, gold, s * DW, 3.1, Z0 + 0.2); box(2 * DW + 0.8, 0.4, 0.9, gold, 0, 6.1, Z0 + 0.2);   // Tuer 4,8 x 6 m mit Goldrahmen
  for (let x = -BW / 2 + 4; x < BW / 2 - 2; x += 4) for (const y of [4.5, 9.5]) if (Math.abs(x) > DW + 1) box(1.6, 3, 0.1, M({ color: 0x1a2a3a, roughness: 0.1, emissive: 0xffd8a0, emissiveIntensity: 0.25 }), x, y, Z0 - 0.06);   // Fenster vorne
  // Innen: Boden, Pilaster, Kassettendecke mit Oberlicht
  box(BW - 2 * T, 0.04, BD - 2 * T, boden, 0, 0.02, Z0 + BD / 2);
  const IW = BW / 2 - T, iz0 = Z0 + T, iz1 = Z0 + BD - T;
  for (let z = iz0 + 3; z < iz1 - 1; z += 5) for (const sx of [-1, 1]) box(0.8, HS - 0.5, 0.9, stein2, sx * (IW - 0.4), (HS - 0.5) / 2, z);
  { const kas = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#e8e2d4"; c.fillRect(0, 0, w, h); c.fillStyle = "#c9c0ac"; c.fillRect(10, 10, w - 20, h - 20); c.fillStyle = "#ddd5c4"; c.fillRect(22, 22, w - 44, h - 44); c.fillStyle = "#c9a640"; c.beginPath(); c.arc(w / 2, h / 2, 6, 0, 7); c.fill(); }, BW / 3, BD / 3);
    box(BW - 2 * T, 0.3, BD - 2 * T, M({ map: kas, emissive: 0x8a8478, emissiveMap: kas, roughness: 0.9 }), 0, HS - 0.15, Z0 + BD / 2);
    box(BW * 0.45, 0.05, BD * 0.45, M({ color: 0xe8f4ff, emissive: 0xdde8f2, emissiveIntensity: 0.9 }), 0, HS - 0.33, Z0 + BD / 2); }   // Oberlicht
  // Handelsposten: achteckiger Tresen, Saeule, Bildschirmkranz (8 Bildschirme, gemeinsame Kurs-Textur), Leuchtdach
  const scr = document.createElement("canvas"); scr.width = 256; scr.height = 128; const scrT = new THREE.CanvasTexture(scr), scrM = new THREE.MeshBasicMaterial({ map: scrT });
  const posten = [[0, Z0 + BD / 2], [-11, Z0 + BD / 2 - 6], [11, Z0 + BD / 2 - 6], [-11, Z0 + BD / 2 + 7], [11, Z0 + BD / 2 + 7]];
  for (const [x, z] of posten) { const t = cyl(2.6, 2.6, 1.05, holz, x, 0.525, z, 8); t.rotation.y = Math.PI / 8; const tp = cyl(2.75, 2.75, 0.06, dunkel, x, 1.08, z, 8); tp.rotation.y = Math.PI / 8; cyl(1.9, 1.9, 1.1, stein2, x, 0.55, z, 8).rotation.y = Math.PI / 8;
    cyl(0.35, 0.35, 4.6, dunkel, x, 3.4, z, 12); dk(5.2, 1.1, 5.2, x, 0, z);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), scrM); s.position.set(x + Math.sin(a) * 1.25, 3.4, z + Math.cos(a) * 1.25); s.rotation.y = a; g.add(s); const r = box(1.6, 0.85, 0.08, dunkel, 0, 0, 0); r.position.set(x + Math.sin(a) * 1.2, 3.4, z + Math.cos(a) * 1.2); r.rotation.y = a; }
    const dach = cyl(3.2, 3.2, 0.25, dunkel, x, 5.75, z, 8); dach.rotation.y = Math.PI / 8; const dl = cyl(3.0, 3.0, 0.05, licht, x, 5.6, z, 8); dl.rotation.y = Math.PI / 8;
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2, m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), M({ color: 0x30ff60, emissive: 0x20c040 })); m.position.set(x + Math.sin(a) * 2.68, 1.15, z + Math.cos(a) * 2.68); g.add(m); } }
  yield;
  // Haendlertische entlang der Seitenwaende mit je drei Monitoren (InstancedMesh), Stuehle
  { const tische = []; for (const sx of [-1, 1]) for (let z = iz0 + 4; z < iz1 - 3; z += 3.2) tische.push([sx * (IW - 3.2), z, sx]);
    const tg = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.06, 2.6), holz, tische.length), mg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.42, 0.62), dunkel, tische.length * 3), sg = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.56, 0.36), scrM, tische.length * 3);
    const bg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.74, 2.5), dunkel, tische.length), q = new THREE.Object3D(); let n = 0;
    tische.forEach(([x, z, sx], i) => { q.position.set(x, 0.76, z); q.rotation.set(0, 0, 0); q.updateMatrix(); tg.setMatrixAt(i, q.matrix); q.position.set(x - sx * 0.45, 0.37, z); q.updateMatrix(); bg.setMatrixAt(i, q.matrix);
      for (const dz of [-0.8, 0, 0.8]) { q.position.set(x - sx * 0.3, 1.05, z + dz); q.rotation.set(0, 0, 0); q.updateMatrix(); mg.setMatrixAt(n, q.matrix); q.position.set(x - sx * 0.27, 1.05, z + dz); q.rotation.set(0, sx > 0 ? Math.PI / 2 : -Math.PI / 2, 0); q.updateMatrix(); sg.setMatrixAt(n, q.matrix); n++; }   // Bildschirm zur Saalmitte
      dk(1.0, 0.8, 2.6, x, 0, z); });
    for (const m of [tg, mg, sg, bg]) { m.castShadow = m !== sg; g.add(m); } }
  // Kurstafeln an den Seitenwaenden (oben) und Laufband ueber dem Eingang
  const taf = document.createElement("canvas"); taf.width = 1024; taf.height = 256; const tafT = new THREE.CanvasTexture(taf), tafM = new THREE.MeshBasicMaterial({ map: tafT });
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(20, 5), tafM); p.position.set(sx * (IW - 0.9), 9.5, Z0 + BD / 2); p.rotation.y = -sx * Math.PI / 2; g.add(p); box(0.2, 5.4, 20.4, dunkel, sx * (IW - 0.98), 9.5, Z0 + BD / 2); }
  const lauf = document.createElement("canvas"); lauf.width = 2048; lauf.height = 64; const laufT = new THREE.CanvasTexture(lauf); laufT.wrapS = THREE.RepeatWrapping; laufT.repeat.set(1.6, 1);
  { const p = new THREE.Mesh(new THREE.PlaneGeometry(BW - 4, 1.2), new THREE.MeshBasicMaterial({ map: laufT })); p.position.set(0, 8, iz0 + 0.05); g.add(p); box(BW - 3.6, 1.5, 0.15, dunkel, 0, 8, iz0 + 0.0); }
  // Papier am Boden (Zettel), Seile und Pfosten am Eingang
  { const N = 260, pm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.21, 0.3), M({ color: 0xf2f0ea, side: THREE.DoubleSide, roughness: 0.9 }), N), q = new THREE.Object3D(); let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < N; i++) { q.position.set((rnd() - 0.5) * (BW - 4), 0.05 + rnd() * 0.01, iz0 + 2 + rnd() * (BD - 5)); q.rotation.set(-Math.PI / 2, 0, rnd() * 6.3); q.updateMatrix(); pm.setMatrixAt(i, q.matrix); } g.add(pm); }
  for (const sx of [-1, 1]) for (const z of [iz0 + 2, iz0 + 5]) { cyl(0.05, 0.05, 1, gold, sx * (DW + 0.5), 0.5, z, 10); cyl(0.12, 0.15, 0.06, gold, sx * (DW + 0.5), 0.03, z, 12); }
  scene.add(g);
  // Rechtsklick an einem Handelsposten: Boersen-App (ui/aktien.js) zum Kaufen und Verkaufen
  g.updateMatrixWorld(true); for (const [x, z] of posten) { const hm = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.6, 5.4), new THREE.MeshBasicMaterial({ visible: false })); hm.position.set(x, 0.8, z); g.add(hm); hm.updateMatrixWorld(true); const p = hm.getWorldPosition(new THREE.Vector3());
    gates.push({ name: "Handelsposten", g: hm, call: () => typeof akxOeffne === "function" ? akxOeffne() : typeof toast === "function" && toast("Börse: Handeln im Handy (App Börse)"), verbs: ["Aktien handeln", "Aktien handeln"], a: [p.x, p.z], b: [p.x, p.z], near: 4.5 }); }
  { const poly = [P(-BW / 2, Z0), P(BW / 2, Z0), P(BW / 2, Z0 + BD), P(-BW / 2, Z0 + BD)]; bautAdd({ id: "GO-BOERSE", name: "Gotham Stock Exchange", art: "Gebäude", poly, y0: Y - 1, y1: Y + H + 2, info: "Börse mit Handelssaal (begehbar) · früher Baustelle BS-01" }); }
  GBOE.anim = { g, scr, scrT, taf, tafT, lauf, laufT, t: -99, off: 0 }; gboeZeichnen();
}
// Kurs-Texturen: Bildschirme (Kursliste), Tafeln (alle Kurse gross mit Pfeil), Laufband
function gboeZeichnen() { const A = GBOE.anim; if (!A) return; const K = gboeKurse(), fmt = v => v.toFixed(2).replace(".", ",");
  { const c = A.scr.getContext("2d"); c.fillStyle = "#06120a"; c.fillRect(0, 0, 256, 128); c.font = "bold 15px monospace"; GBOE_AKT.forEach(([s], i) => { const k = K[s], up = k.d >= 0; c.fillStyle = "#cfe0ee"; c.fillText(s, 8, 18 + i * 14.5); c.fillStyle = up ? "#5dff8a" : "#ff5a5a"; c.fillText((up ? "▲ " : "▼ ") + fmt(k.p), 96, 18 + i * 14.5); }); A.scrT.needsUpdate = true; }
  { const c = A.taf.getContext("2d"); c.fillStyle = "#0a0c10"; c.fillRect(0, 0, 1024, 256); c.fillStyle = "#ffd43b"; c.font = "bold 26px Arial"; c.fillText("GOTHAM STOCK EXCHANGE · KURSE", 20, 32);
    GBOE_AKT.forEach(([s, name], i) => { const k = K[s], up = k.d >= 0, x = 20 + (i % 4) * 252, y = 90 + Math.floor(i / 4) * 92; c.fillStyle = "#e8eef4"; c.font = "bold 30px Arial"; c.fillText(s, x, y); c.font = "16px Arial"; c.fillStyle = "#9aa8b4"; c.fillText(name, x, y + 22);
      c.fillStyle = up ? "#5dff8a" : "#ff5a5a"; c.font = "bold 30px monospace"; c.fillText((up ? "▲" : "▼") + fmt(k.p), x + 92, y); c.font = "16px monospace"; c.fillText((up ? "+" : "") + fmt(k.d), x + 130, y + 22); }); A.tafT.needsUpdate = true; }
  { const c = A.lauf.getContext("2d"); c.fillStyle = "#05070a"; c.fillRect(0, 0, 2048, 64); c.font = "bold 38px monospace"; let x = 10; for (const [s] of GBOE_AKT) { const k = K[s], up = k.d >= 0; c.fillStyle = "#ffd43b"; c.fillText(s, x, 46); x += c.measureText(s + " ").width; c.fillStyle = up ? "#5dff8a" : "#ff5a5a"; const t = fmt(k.p) + (up ? " ▲   " : " ▼   "); c.fillText(t, x, 46); x += c.measureText(t).width; } A.laufT.needsUpdate = true; } }
TILES.tasks.push({ gen: null, plan() {}, step() { if (GBOE.done || TILES.startup) return false;
  if (!this.gen) this.gen = gboeGen(); const r = this.gen.next(); if (r.done) { GBOE.done = true; this.gen = null; } return false; } });
// je Bild (schleife.js): Laufband schieben, alle 4 s neue Kurse; nur in der Naehe (400 m)
function gboeStep(dt = 0.016) { const A = GBOE.anim; if (!A) return; const p = camera.position, gp = A.g.position; if (Math.abs(p.x - gp.x) > 400 || Math.abs(p.z - gp.z) > 400) return;
  A.laufT.offset.x = (A.laufT.offset.x + dt * 0.05) % 1; const t = performance.now() / 1000; if (t - A.t > 4) { A.t = t; gboeZeichnen(); } }
