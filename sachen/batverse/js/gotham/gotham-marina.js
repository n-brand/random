// Batverse – Gotham: Gotham Marina (Nicolas 2026-11-23: "Hafen bei Gotham viel zu haesslich und zu gross … wir machen einfach einen ganz kleinen", dann "bau den Hafen in
// Batverse in 3D in Gotham um, nur der in Gotham"). Nach gotham-hafen.js (Containerterminal bleibt). Lage aus gotham/daten.js haefen[id "gotham"]: Kai A..B, 4 Stege, Hafenmeisterei.
// Die Kaimauer ist 22 m hoch (Strasse -12, Wasser -34): Schwimmstege auf dem Wasser, eine Rampe an der Mauer entlang (12 %) von der Luecke in der Bruestung
// (KAI.marinaRampe, gotham-kai.js) hinunter zu einem Quersteg, davon 4 Stege mit Fingerstegen und festgemachten Booten, Laternen, Poller. Begehbar (dkAdd), Boote nur Optik.
// Rahmen: s entlang des Kais (A -> B), t aufs Wasser (t = 0 Kaipunkt A).
"use strict";
const GMAR = { done: false };
function* gmarGen() {
  while (!GSTR.done || !GGEB.done || (typeof GHAF !== "undefined" && !GHAF.done)) yield "wait";
  const Hm = (GOTHAM.haefen || []).find(h => h.id === "gotham"); if (!Hm || typeof KAI === "undefined" || !KAI.marinaRampe) return;
  gbvInit();
  const A = GOT.toGame(...Hm.kai[0]), Bk = GOT.toGame(...Hm.kai[1]), KL = Math.hypot(Bk[0] - A[0], Bk[1] - A[1]), e1 = [(Bk[0] - A[0]) / KL, (Bk[1] - A[1]) / KL];
  let e2 = [-e1[1], e1[0]]; if (GOT.edgeSD(A[0] + e2[0] * 40, A[1] + e2[1] * 40) < GOT.edgeSD(A[0] - e2[0] * 40, A[1] - e2[1] * 40)) e2 = [-e2[0], -e2[1]];   // aufs Wasser
  const f = gbvFrame({ P0: A, e1, e2, L1: KL, L2: 200 }), ST = (x, z) => [(x - A[0]) * e1[0] + (z - A[1]) * e1[1], (x - A[0]) * e2[0] + (z - A[1]) * e2[1]];
  const Y = GOT.STR, WY = GOT.WY, DY = WY + 0.75, ux = e1[0], uz = e1[1];
  // Mauerlinie: je s die Stelle, wo das Wasser beginnt; t0 = groesster Wert (Stege sicher vor der Mauer)
  let t0 = -1e9; for (let s = 0; s <= KL; s += 10) { let w = -20; while (w < 80 && GOT.edgeSD(...(([x, , z]) => [x, z])(f.W(s, w, 0))) < 0) w += 0.5; t0 = Math.max(t0, w); }
  const [sR, tR] = ST(...KAI.marinaRampe), TW = t0 + 16;                                  // Rampe oben, Quersteg 16 m vor der Mauer (Kiesstreifen am Mauerfuss)
  const out = new Map(), dk = (s, t, ls, lt, y0, y1, o = {}) => { const p = f.W(s, t, 0); return dkAdd(Object.assign({ cx: p[0], cy: (y0 + y1) / 2, cz: p[2], ux, uz, hl: ls / 2, hw: lt / 2, hh: (y1 - y0) / 2, m: 0.05 }, o)); };
  const box = (key, s, t, ls, lt, y0, y1, col) => gbvBox(out, key, f, s, t, ls, lt, y0, y1, col, true, true);
  const holzTex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = "#8a6a48"; c.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { const v = 110 + (i * 37) % 40; c.fillStyle = `rgb(${v + 20},${v - 5},${v - 40})`; c.fillRect(0, i * 8, w, 7); }
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`; c.fillRect(Math.random() * w, Math.random() * h, 6, 1); } }); holzTex.wrapS = holzTex.wrapT = THREE.RepeatWrapping;
  const MM = { holz: new THREE.MeshStandardMaterial({ map: holzTex, roughness: 0.85 }), stahl: new THREE.MeshStandardMaterial({ color: 0x5c6168, roughness: 0.5, metalness: 0.4 }),
    schwimmer: new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.8 }), licht: new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xffe2a0, emissiveIntensity: 0.9 }),
    weiss: new THREE.MeshStandardMaterial({ color: 0xeef0f2, roughness: 0.4 }), glas: new THREE.MeshStandardMaterial({ color: 0x223040, roughness: 0.15, metalness: 0.5 }) };
  // ---- Rampe: oben Plattform an der Bruestungsluecke, dann an der Mauer entlang Richtung B (12 %), unten Plattform bis zum Quersteg ----
  const RW = 2.4, rt = t0 + 2.6, drop = Y - DY, RL = drop / 0.12, s1 = sR + 1.5, s2 = s1 + RL;
  box("holz", sR, (tR - 1 + rt + RW / 2) / 2, 3, rt + RW / 2 - tR + 1, Y - 0.3, Y + 0.03); dk(sR, (tR - 1 + rt + RW / 2) / 2, 3, rt + RW / 2 - tR + 1, Y - 0.3, Y + 0.03);
  { const o = gbvBucket(out, "holz"), a = rt - RW / 2, b = rt + RW / 2; gbvQuad(o, f.W(s1, a, Y + 0.03), f.W(s2, a, DY), f.W(s2, b, DY), f.W(s1, b, Y + 0.03), [0, 1, 0], [[0, 0], [RL / 4, 0], [RL / 4, 1], [0, 1]]);
    gbvQuad(o, f.W(s1, b, Y - 0.3), f.W(s2, b, DY - 0.3), f.W(s2, a, DY - 0.3), f.W(s1, a, Y - 0.3), [0, -1, 0], [[0, 0], [RL / 4, 0], [RL / 4, 1], [0, 1]]);
    const g = (DY - Y) / RL; for (let s = s1; s < s2 - 1e-6; s += 0.5) { const sb = Math.min(s2, s + 0.5), yc = Y + g * ((s + sb) / 2 - s1), p = f.W((s + sb) / 2, rt, 0); dkAdd({ cx: p[0], cy: yc - 0.15, cz: p[2], ux, uz, hl: (sb - s) / 2, hw: RW / 2, hh: 0.15, g, m: 0.02, ceil: 0 }); }   // m 0,02: Stuecke ueberlappen (an den Fugen sonst Luecke durch Rundung)
    // Gelaender auf der Wasserseite (Pfosten alle 2,5 m, Handlauf) und Konsolen an der Mauer alle 8 m
    for (let s = s1; s <= s2; s += 2.5) { const y = Y + g * (s - s1); box("stahl", s, b - 0.05, 0.08, 0.08, y, y + 1.1); }
    for (let k = 0; k < 40; k++) { const sa = s1 + k * RL / 40, sb = s1 + (k + 1) * RL / 40; gbvQuad(gbvBucket(out, "stahl"), f.W(sa, b - 0.05, Y + g * (sa - s1) + 1.05), f.W(sb, b - 0.05, Y + g * (sb - s1) + 1.05), f.W(sb, b - 0.05, Y + g * (sb - s1) + 1.12), f.W(sa, b - 0.05, Y + g * (sa - s1) + 1.12), f.dirW(0, 1), [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    for (let k = 0; k < 40; k++) { const sm = s1 + (k + 0.5) * RL / 40, p = f.W(sm, b - 0.05, 0); dkAdd({ cx: p[0], cy: Y + g * (sm - s1) + 0.6, cz: p[2], ux, uz, hl: RL / 80, hw: 0.05, hh: 0.6, g, m: 0.1, floor: 0 }); }
    for (let s = s1 + 4; s < s2; s += 8) { const y = Y + g * (s - s1); box("stahl", s, t0 + 0.7, 0.2, 1.4 + 2.4, y - 1.6, y - 0.3); } }
  box("holz", s2 + 3, (rt - RW / 2 + TW + 1.5) / 2, 6, TW + 1.5 - rt + RW / 2, DY - 0.5, DY); dk(s2 + 3, (rt - RW / 2 + TW + 1.5) / 2, 6, TW + 1.5 - rt + RW / 2, DY - 0.5, DY);
  // ---- Quersteg und Stege mit Fingerstegen ----
  const stege = Hm.stege.map(([a, b]) => { const [sa] = ST(...GOT.toGame(...a)), [, tb] = ST(...GOT.toGame(...b)); return [sa, tb]; });
  const sMin = Math.min(...stege.map(q => q[0]), s2) - 4, sMax = Math.max(...stege.map(q => q[0]), s2 + 6) + 4;
  const schwimm = (s, t, ls, lt) => { box("holz", s, t, ls, lt, DY - 0.18, DY); box("schwimmer", s, t, ls * 0.96, lt * 0.8, WY - 0.3, DY - 0.18); dk(s, t, ls, lt, DY - 0.5, DY); };
  schwimm((sMin + sMax) / 2, TW, sMax - sMin, 3);
  const plaetze = [], lampen = [], poller = [];
  for (const [s, tb] of stege) { const len = Math.max(40, tb - TW - 1.5); schwimm(s, TW + 1.5 + len / 2, 2.4, len);
    for (let t = TW + 8; t < TW + 1.5 + len - 6; t += 12) for (const sg of [-1, 1]) { schwimm(s + sg * (1.2 + 4), t, 8, 0.9); poller.push([s + sg * (1.2 + 8), t]); plaetze.push([s + sg * (1.2 + 4.2), t + 6, sg]); }
    for (let t = TW + 6; t < TW + len; t += 24) lampen.push([s + 1.05, t]); }
  for (let s = sMin + 6; s < sMax; s += 24) lampen.push([s, TW - 1.3]);
  for (const [s, t] of lampen) { box("stahl", s, t, 0.12, 0.12, DY, DY + 3.2); box("licht", s, t, 0.35, 0.35, DY + 3.2, DY + 3.5); }
  for (const [s, t] of poller) box("stahl", s, t, 0.25, 0.25, DY, DY + 0.35);
  // ---- Hafenmeisterei auf der Kai-Platte (nur wo frei) ----
  { const gb = Hm.gebaeude[0]; if (gb) { const [gx, gz] = GOT.toGame(gb[0], gb[1]), [s, tt] = ST(gx, gz), t = Math.min(tt, t0 - 6 - gb[3] / 2), p = f.W(s, t, 0);
    if (!bautAt(p[0], Y + 1, p[2]) && !GSTR.onRoad(p[0], p[2], 1)) { const L = Math.min(gb[2], 24), D = Math.min(gb[3], 10);
      box("weiss", s, t, L, D, Y, Y + 3.6); box("glas", s, t + D / 2, L - 1, 0.1, Y + 1, Y + 3); box("stahl", s, t, L + 1, D + 1, Y + 3.6, Y + 3.9); box("weiss", s + L / 2 - 2, t, 3, 3, Y + 3.9, Y + 7.5);   // mit kleinem Turm
      dk(s, t, L, D, Y, Y + 3.9); dk(s + L / 2 - 2, t, 3, 3, Y + 3.9, Y + 7.5);
      bautAdd({ id: "GO-MARINA-HM", name: "Hafenmeisterei", art: "Gebäude", poly: [f.W(s - L / 2, t - D / 2, 0), f.W(s + L / 2, t - D / 2, 0), f.W(s + L / 2, t + D / 2, 0), f.W(s - L / 2, t + D / 2, 0)].map(q => [q[0], q[2]]), y0: Y, y1: Y + 7.5, info: "Gotham Marina" }); } } }
  yield;
  // ---- Netze ----
  const grp = new THREE.Group(); grp.name = "Gotham Marina"; grp.userData.keep = true; grp.userData.noLift = true; const GM = gbvInit();
  for (const [key, o] of out) { if (!o.p.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2)); if (o.c.length) geo.setAttribute("color", new THREE.Float32BufferAttribute(o.c, 3));
    const m = new THREE.Mesh(geo, MM[key] || GM[key]); m.castShadow = key !== "licht"; m.receiveShadow = true; m.name = "Marina " + key; grp.add(m); }
  // ---- Boote: Motorjachten und Segelboote (zwei Instanz-Listen je Teil), nur in gut 2/3 der Plaetze ----
  const rnd = (() => { let q = 7919; return () => { q = (q * 16807) % 2147483647; return q / 2147483647; }; })(), boote = plaetze.filter(() => rnd() < 0.7);
  const rumpfForm = (() => { const sh = new THREE.Shape(); sh.moveTo(-0.5, -0.5); sh.lineTo(0.5, -0.5); sh.lineTo(0.5, 0.18); sh.quadraticCurveTo(0.45, 0.42, 0, 0.5); sh.quadraticCurveTo(-0.45, 0.42, -0.5, 0.18); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, -0.35, 0); return g; })();   // Grundriss: Bug in +z (nach Drehung), Hoehe 0..1 -> -0.35..0.65
  const teile = [[rumpfForm, new THREE.MeshStandardMaterial({ roughness: 0.35 }), true], [new THREE.BoxGeometry(1, 1, 1), MM.weiss, false], [new THREE.BoxGeometry(1, 1, 1), MM.glas, false], [new THREE.CylinderGeometry(0.06, 0.08, 1, 6), MM.stahl, false]];
  const IM = teile.map(([g, m]) => { const im = new THREE.InstancedMesh(g, m, boote.length); im.castShadow = true; im.receiveShadow = true; grp.add(im); return im; });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color(), FARBEN = [0xf4f4f2, 0xf4f4f2, 0x1d2b44, 0xe8e2d4, 0x8b1e24, 0x2f4f3a];
  const leer = new THREE.Matrix4().makeScale(0, 0, 0);
  boote.forEach(([s, t, sg], i) => { const segel = rnd() < 0.35, L = 7 + rnd() * 4, B = 2.4 + rnd() * 0.8, p = f.W(s, t, 0), h = Math.atan2(e1[0] * sg, e1[1] * sg);   // Bug vom Steg weg
    q.setFromAxisAngle(v.set(0, 1, 0), h); const put = (k, dx, y, dz, sx, sy, sz) => { const lx = Math.sin(h) * dz + Math.cos(h) * dx, lz = Math.cos(h) * dz - Math.sin(h) * dx; m4.compose(v.set(p[0] + lx, y, p[2] + lz), q, sc.set(sx, sy, sz)); IM[k].setMatrixAt(i, m4); };
    put(0, 0, WY + 0.1 + 0.35 * 1.4, 0, B, 1.4, L); IM[0].setColorAt(i, col.set(FARBEN[Math.floor(rnd() * FARBEN.length)]));
    if (segel) { put(1, 0, WY + 1.1, -L * 0.12, B * 0.6, 0.6, L * 0.35); IM[2].setMatrixAt(i, leer); put(3, 0, WY + 1 + L * 0.65, L * 0.08, 1, L * 1.3, 1); }
    else { put(1, 0, WY + 1.35, -L * 0.08, B * 0.75, 1.1, L * 0.45); put(2, 0, WY + 1.55, L * 0.15 - L * 0.08, B * 0.72, 0.5, 0.08); IM[3].setMatrixAt(i, leer); } });
  for (const im of IM) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  scene.add(grp);
  bautAdd({ id: "GO-MARINA", name: Hm.name, art: "Hafen", poly: [f.W(sMin, t0, 0), f.W(sMax, t0, 0), f.W(sMax, TW + 140, 0), f.W(sMin, TW + 140, 0)].map(p => [p[0], p[2]]), y0: WY, y1: Y, info: "4 Stege, " + boote.length + " Boote, Rampe 12 %" });
  GMAR.info = { stege: stege.length, boote: boote.length, plaetze: plaetze.length, rampe: Math.round(RL), t0: +t0.toFixed(1) };
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (GMAR.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = gmarGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { GMAR.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
