"use strict";
// Batverse – Gotham: Wayne-Aufzug (Plan 2026-11-14-wayne-tower, Task 7; Nicolas: normaler Personenaufzug, nur fuer Menschen, von ganz unten bis ganz
// oben, haelt ueberall, der geheime Stock steht normal in der Halteliste). Kabine = ganzer Kern (WTO.kern, innen ca. 7,4 x 7,4 m).
// Tueren je Halt: Tiefgaragen nach -b (Kerngang), geheimer Stock / Lobby / Geschosse nach +b, Dach nach +a (Terrasse neben der Krone).
// Geschosse bei Bedarf (Ansatz A, Nicolas "ja A"): ein Geschoss-Netz je Turmbreite (70/56/44 m), wird an die Hoehe des Halts geschoben und
// gezeigt; es bleibt, solange der Spieler dort ausserhalb der Kabine steht. Rohbau: Boden, Decke, Stuetzen, Kernwaende, Fenster innen.
const WLIFT = (() => {
  const K = WTO.kern, D = WTO.kernTuer, lv = WTO.lv, Y = WTO.Y, AI = { a0: K.a0 + 0.3, a1: K.a1 - 0.3, b0: K.b0 + 0.3, b1: K.b1 - 0.3 };
  const stops = [{ name: "Tiefgarage 2", y: lv.tg2, side: "-b", part: WTU.kernTuer.tg2 }, { name: "Geheimer Stock", y: lv.geheim, side: "+b", part: WTU.kernTuer.geheim },
    { name: "Tiefgarage 1", y: lv.tg1, side: "-b", part: WTU.kernTuer.tg1 }, { name: "Lobby", y: 0.1, side: "+b", part: WTB.kernTuer }];
  for (let k = 1; k <= lv.N; k++) stops.push({ name: "Geschoss " + k, y: lv.g(k), side: "+b", floor: k });
  stops.push({ name: "Dach", y: lv.dach, side: "+a" });
  const L = { stops, at: 3, target: 3, state: "idle", t: 0, y: stops[3].y, from: 0, to: 0, open: stops.map((_, i) => i === 3 ? 1 : 0), shown: 0 };
  // ---------- Geometrie (Turm-Koordinaten, Gruppe wie der Turm) ----------
  const grp = new THREE.Group(); grp.position.set(WTO.cx, Y, WTO.cz); grp.rotation.y = WTO.rot; grp.userData.dynamic = true; grp.userData.keep = true; grp.userData.noLift = true; scene.add(grp);
  const M2 = o => new THREE.MeshStandardMaterial(Object.assign({ side: THREE.DoubleSide }, o));
  const mats = { cab: M2({ color: 0x3a3631, roughness: 0.5, metalness: 0.2, emissive: 0x1a1816, emissiveIntensity: 0.4 }), gold: M2({ color: 0xc9a352, metalness: 0.8, roughness: 0.3, emissive: 0x4a3a18, emissiveIntensity: 0.4 }),
    door: M2({ color: 0x8c949c, metalness: 0.7, roughness: 0.35, emissive: 0x30353a, emissiveIntensity: 0.4 }), light: M2({ color: 0xffffff, emissive: 0xfff4dc, emissiveIntensity: 1.2 }),
    floor: M2({ color: 0xbdb7aa, roughness: 0.35, emissive: 0x3a3833, emissiveIntensity: 0.35 }), ceil: M2({ color: 0xd8d6d0, roughness: 0.9, emissive: 0xd8d6d0, emissiveIntensity: 0.45 }),
    core: M2({ color: 0x8b8781, roughness: 0.6, emissive: 0x2a2826, emissiveIntensity: 0.4 }), col: M2({ color: 0xa3a19b, roughness: 0.85, emissive: 0x3a3936, emissiveIntensity: 0.3 }) };
  { // Fenster von innen (Stein mit Loechern, alphaTest): durch die Fassade (nur von aussen gezeichnet) sieht man sonst ungehindert hinaus
    const t = canvasTex(120, 188, (c, w, h) => { c.fillStyle = "#c9c6bf"; c.fillRect(0, 0, w, h); c.clearRect(w / 2 - 34, h - 36 - 116, 68, 116); c.fillStyle = "#8d8b86"; c.fillRect(w / 2 - 2, h - 152, 4, 116); c.fillRect(w / 2 - 34, h - 96, 68, 4); });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; mats.win = M2({ map: t, alphaTest: 0.5, roughness: 0.9, emissive: 0x6a6864, emissiveIntensity: 0.4 }); }
  const geo = () => ({ P: [], U: [], I: [] });
  const quad = (g, p, uv) => { const n = g.P.length / 3; for (const q of p) g.P.push(...q); for (const t of uv) g.U.push(...t); g.I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  const flat = (g, a0, a1, b0, b1, y, sc = 4) => quad(g, [[a0, y, b1], [a1, y, b1], [a1, y, b0], [a0, y, b0]], [[a0 / sc, b1 / sc], [a1 / sc, b1 / sc], [a1 / sc, b0 / sc], [a0 / sc, b0 / sc]]);
  const wallQ = (g, a0, b0, a1, b1, y0, y1, su = 3, sv = 3) => { const Ln = Math.hypot(a1 - a0, b1 - b0); quad(g, [[a0, y0, b0], [a1, y0, b1], [a1, y1, b1], [a0, y1, b0]], [[0, y0 / sv], [Ln / su, y0 / sv], [Ln / su, y1 / sv], [0, y1 / sv]]); };
  const box = (g, a0, a1, b0, b1, y0, y1) => { wallQ(g, a0, b0, a1, b0, y0, y1); wallQ(g, a1, b0, a1, b1, y0, y1); wallQ(g, a1, b1, a0, b1, y0, y1); wallQ(g, a0, b1, a0, b0, y0, y1); flat(g, a0, a1, b0, b1, y1); };
  const mesh = (g, m, parent, name) => { if (!g.I.length) return null; const b = new THREE.BufferGeometry(); b.setAttribute("position", new THREE.Float32BufferAttribute(g.P, 3)); b.setAttribute("uv", new THREE.Float32BufferAttribute(g.U, 2)); b.setIndex(g.I); b.computeVertexNormals();
    const o = new THREE.Mesh(b, m); o.name = name; o.userData.keep = true; o.userData.noLift = true; parent.add(o); return o; };
  // Wand mit Tueroeffnung in der Mitte (Seite side des Kerns), y0..y1
  const coreWalls = (g, y0, y1, doorSide) => { const H = Math.min(D.h, y1 - y0);
    for (const s of ["-b", "+b", "-a", "+a"]) { const along = s.endsWith("b"), c = s === "-b" ? K.b0 : s === "+b" ? K.b1 : s === "-a" ? K.a0 : K.a1, lo = along ? K.a0 : K.b0, hi = along ? K.a1 : K.b1, m = (lo + hi) / 2;
      const W = (p0, p1, q0, q1) => along ? wallQ(g, p0, c, p1, c, q0, q1) : wallQ(g, c, p0, c, p1, q0, q1);
      if (s === doorSide) { W(lo, m - D.w / 2, y0, y1); W(m + D.w / 2, hi, y0, y1); W(m - D.w / 2, m + D.w / 2, y0 + H, y1); } else W(lo, hi, y0, y1); } };
  // dk-Teile der Kernwaende (relativ zu y0) mit Tueroeffnung
  const coreParts = (y0, y1, doorSide) => { const out = [], H = D.h, t = 0.15;
    for (const s of ["-b", "+b", "-a", "+a"]) { const along = s.endsWith("b"), c = s === "-b" ? K.b0 : s === "+b" ? K.b1 : s === "-a" ? K.a0 : K.a1, lo = along ? K.a0 : K.b0, hi = along ? K.a1 : K.b1, m = (lo + hi) / 2;
      const P = (p0, p1, q0, q1) => out.push(along ? wtPartU(p0, p1, c - t, c + t, q0, q1) : wtPartU(c - t, c + t, p0, p1, q0, q1));
      if (s === doorSide) { P(lo, m - D.w / 2, y0, y1); P(m + D.w / 2, hi, y0, y1); P(m - D.w / 2, m + D.w / 2, y0 + H, y1); } else P(lo, hi, y0, y1); } return out; };
  // ---------- Tueren je Halt (zwei Fluegel, schieben zur Seite) ----------
  const doorG = new THREE.Group(); grp.add(doorG);
  const mkDoor = (side, y) => { const g = new THREE.Group(), along = side.endsWith("b"), c = side === "-b" ? K.b0 - 0.08 : side === "+b" ? K.b1 + 0.08 : K.a1 + 0.08, m = along ? (K.a0 + K.a1) / 2 : (K.b0 + K.b1) / 2;
    const leaves = [-1, 1].map(sg => { const b = new THREE.Mesh(new THREE.BoxGeometry(along ? D.w / 2 : 0.08, D.h, along ? 0.08 : D.w / 2), mats.door); b.userData.base = m + sg * D.w / 4; b.userData.sg = sg; b.userData.along = along;
      if (along) b.position.set(b.userData.base, y + D.h / 2, c); else b.position.set(c, y + D.h / 2, b.userData.base); g.add(b); return b; });
    g.userData.leaves = leaves; doorG.add(g); return g; };
  for (const st of stops) if (!st.floor) st.door = mkDoor(st.side, st.y);
  const floorDoor = mkDoor("+b", 0); floorDoor.visible = false;
  // ---------- Kabine (faehrt) ----------
  const cab = new THREE.Group(); grp.add(cab);
  { const g = geo(), gl = geo(), go = geo(); flat(g, AI.a0, AI.a1, AI.b0, AI.b1, 0.02, 2); quad(g, [[AI.a0, 3.2, AI.b0], [AI.a1, 3.2, AI.b0], [AI.a1, 3.2, AI.b1], [AI.a0, 3.2, AI.b1]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    wallQ(g, AI.a0, AI.b0, AI.a0, AI.b1, 0, 3.2);                                                     // -a: immer Wand
    for (const [s, c, lo, hi] of [["-b", AI.b0, AI.a0, AI.a1], ["+b", AI.b1, AI.a0, AI.a1], ["+a", AI.a1, AI.b0, AI.b1]]) { const m = (lo + hi) / 2, along = s.endsWith("b"), W = (p0, p1, q0, q1) => along ? wallQ(g, p0, c, p1, c, q0, q1) : wallQ(g, c, p0, c, p1, q0, q1);
      W(lo, m - D.w / 2, 0, 3.2); W(m + D.w / 2, hi, 0, 3.2); W(m - D.w / 2, m + D.w / 2, D.h, 3.2); }
    quad(gl, [[-1.2, 3.17, -19.2], [1.2, 3.17, -19.2], [1.2, 3.17, -16.8], [-1.2, 3.17, -16.8]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    wallQ(go, AI.a0 + 0.02, AI.b0 + 0.6, AI.a0 + 0.02, AI.b1 - 0.6, 1.0, 1.08);                       // Handlauf
    mesh(g, mats.cab, cab, "Wayne-Aufzug Kabine"); mesh(gl, mats.light, cab, "Wayne-Aufzug Licht"); mesh(go, mats.gold, cab, "Wayne-Aufzug Handlauf"); }
  const cabParts = { floor: wtPartU(AI.a0, AI.a1, AI.b0, AI.b1, -0.3, 0.02, { chain: 1, m: 0.05 }), "-a": wtPartU(AI.a0 - 0.15, AI.a0 + 0.15, AI.b0, AI.b1, 0.02, 3.2),
    "-b": wtPartU(AI.a0, AI.a1, AI.b0 - 0.15, AI.b0 + 0.15, 0.02, 3.2), "+b": wtPartU(AI.a0, AI.a1, AI.b1 - 0.15, AI.b1 + 0.15, 0.02, 3.2), "+a": wtPartU(AI.a1 - 0.15, AI.a1 + 0.15, AI.b0, AI.b1, 0.02, 3.2) };
  let cabY = 0;                                                                                   // Hoehe, auf der die Kabinen-Teile gerade liegen
  // ---------- Dach: Aufzugshaus auf der Terrasse, Tuer nach +a ----------
  { const g = geo(), y0 = lv.dach, y1 = lv.dach + 4; coreWalls(g, y0, y1, "+a"); flat(g, K.a0, K.a1, K.b0, K.b1, y1); mesh(g, mats.core, grp, "Wayne-Aufzug Dachhaus"); coreParts(y0, y1, "+a"); wtPartU(K.a0, K.a1, K.b0, K.b1, y1 - 0.3, y1); }
  stops[stops.length - 1].part = wtPartU(K.a1 - 0.15, K.a1 + 0.05, (K.b0 + K.b1) / 2 - D.w / 2, (K.b0 + K.b1) / 2 + D.w / 2, lv.dach, lv.dach + D.h);
  // ---------- Geschoss-Netze (je Turmbreite eines) ----------
  const tierOf = k => lv.g(k) < WTO.tiers[0].y1 - 0.1 ? 0 : lv.g(k) < WTO.tiers[1].y1 - 0.1 ? 1 : 2;
  const FL = WTO.tiers.map((T, ti) => { const h = T.h - 0.35, G = new THREE.Group(), gf = geo(), gc = geo(), gw = geo(), gk = geo(), gx = geo(), gl = geo(), parts = [];
    for (const [a0, a1, b0, b1] of [[-h, h, -h, K.b0], [-h, h, K.b1, h], [-h, K.a0, K.b0, K.b1], [K.a1, h, K.b0, K.b1]]) { flat(gf, a0, a1, b0, b1, 0.02, 6);
      quad(gc, [[a0, 4.65, b0], [a1, 4.65, b0], [a1, 4.65, b1], [a0, 4.65, b1]], [[0, 0], [1, 0], [1, 1], [0, 1]]); parts.push(wtPartU(a0, a1, b0, b1, -0.3, 0.02, { chain: 1, m: 0.05 })); }
    for (const [a0, b0, a1, b1] of [[-h, -h, h, -h], [h, -h, h, h], [h, h, -h, h], [-h, h, -h, -h]]) wallQ(gw, a0, b0, a1, b1, 0, 4.7, 3, 4.7);
    coreWalls(gk, 0, 4.65, "+b"); parts.push(...coreParts(0, 4.65, "+b"));
    const q = Math.round(h * 0.5); for (const a of [-q, q]) for (const b of [-q, q]) if (!(b < K.b1 + 2 && Math.abs(a) < K.a1 + 2)) { box(gx, a - 0.5, a + 0.5, b - 0.5, b + 0.5, 0, 4.65); parts.push(wtPartU(a - 0.5, a + 0.5, b - 0.5, b + 0.5, 0, 4.65)); }
    for (let a = -h + 6; a < h - 4; a += 9) for (let b = -h + 6; b < h - 4; b += 9) if (!(a > K.a0 - 2 && a < K.a1 + 2 && b > K.b0 - 2 && b < K.b1 + 2)) quad(gl, [[a - 1.5, 4.6, b - 0.25], [a + 1.5, 4.6, b - 0.25], [a + 1.5, 4.6, b + 0.25], [a - 1.5, 4.6, b + 0.25]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    mesh(gf, mats.floor, G, "Geschoss Boden"); mesh(gc, mats.ceil, G, "Geschoss Decke"); mesh(gw, mats.win, G, "Geschoss Fenster"); mesh(gk, mats.core, G, "Geschoss Kern"); mesh(gx, mats.col, G, "Geschoss Stuetzen"); mesh(gl, mats.light, G, "Geschoss Licht");
    G.visible = false; grp.add(G); for (const p of parts) p.on = false; return { G, parts, y: 0, ti }; });
  const fDoorPart = wtPartU(-D.w / 2, D.w / 2, K.b1 - 0.05, K.b1 + 0.15, 0, D.h); fDoorPart.on = false;
  let fY = 0;                                                                                     // Hoehe, auf der fDoorPart liegt
  function showFloor(k) {                                                                         // k = 0: keins
    for (const F of FL) { const on = k > 0 && F.ti === tierOf(k); if (on) { const y = lv.g(k); for (const p of F.parts) dkMove(p, y - F.y); F.y = y; F.G.position.y = y; } F.G.visible = on; for (const p of F.parts) p.on = on; }
    if (k > 0) { const y = lv.g(k); dkMove(fDoorPart, y - fY); fY = y; floorDoor.position.y = y; } floorDoor.visible = k > 0; L.shown = k;
  }
  // ---------- Bedienung ----------
  // in der Kabine: ganzer Kern (an offenen Tueren rutscht man sonst knapp hinaus und blieb beim Fahren an Terrassenkanten haengen)
  const inCar = p => { const [a, b] = WTO.toT(p.x, p.z); return a > K.a0 && a < K.a1 && b > K.b0 && b < K.b1 && Math.abs(p.y - (Y + L.y)) < 2; };
  const onFloor = p => { if (!L.shown) return false; const [a, b] = WTO.toT(p.x, p.z); return Math.abs(p.y - (Y + lv.g(L.shown))) < 2.5 && Math.abs(a) < 36 && Math.abs(b) < 36 && !inCar(p); };
  const order = stops.map((_, i) => i);                                                           // schon von unten nach oben
  function pick(i) { if (!walking || L.state !== "idle" || i === L.at || !stops[i]) return; L.target = i; toast("Wayne-Aufzug: " + stops[i].name); }
  function step(dir) { const k = L.at + dir; if (k < 0 || k >= stops.length) return toast(dir > 0 ? "Ganz oben" : "Ganz unten"); pick(k); }
  function use() {
    if (L.state !== "idle") return toast("Aufzug ist unterwegs"); const p = player.pos;
    if (inCar(p)) { step(1); return; }
    const [a, b] = WTO.toT(p.x, p.z); if (Math.hypot(a - (K.a0 + K.a1) / 2, b - (K.b0 + K.b1) / 2) > 12) return toast("Zu weit vom Aufzug entfernt");
    let here = -1, best = 2.5; stops.forEach((st, i) => { const d = Math.abs(p.y - (Y + st.y)); if (d < best && (!st.floor || st.floor === L.shown)) { best = d; here = i; } });
    if (here < 0) return toast("Zu weit vom Aufzug entfernt");
    if (L.at === here) return toast("Der Aufzug ist schon da"); L.target = here; toast("Der Aufzug kommt");
  }
  // Tuer i auf Oeffnung o setzen (Fluegel, Kollision, Kabinenwand der Tuerseite)
  function applyDoor(i) { const st = stops[i], o = L.open[i], d = st.floor ? floorDoor : st.door; if (d) for (const l of d.userData.leaves) { const v = l.userData.base + l.userData.sg * o * (D.w / 2 - 0.05); if (l.userData.along) l.position.x = v; else l.position.z = v; }
    const part = st.floor ? fDoorPart : st.part; if (part) part.on = o < 0.7 && (!st.floor || L.shown === st.floor); }
  function frame(dt) {
    if (L.state === "idle" && L.target !== L.at) L.state = "closing";
    if (L.state === "closing") { L.open[L.at] = Math.max(0, L.open[L.at] - dt / 0.9); applyDoor(L.at);
      if (L.open[L.at] <= 0) { L.state = "moving"; L.t = 0; L.from = L.y; L.to = stops[L.target].y;
        const p = player.pos; if (L.shown && !onFloor(p)) showFloor(0); } }                       // Geschoss weg, ausser der Spieler steht darauf
    else if (L.state === "moving") { const dist = Math.abs(L.to - L.from), v = dist > 50 ? 12 : 7; L.t = Math.min(1, L.t + dt / Math.max(2.5, dist / v)); L.y = lerp(L.from, L.to, sst(0, 1, L.t));
      if (L.t >= 1) { L.at = L.target; L.state = "opening"; const st = stops[L.at]; if (st.floor && !(L.shown && onFloor(player.pos))) showFloor(st.floor); } }
    else if (L.state === "opening") { L.open[L.at] = Math.min(1, L.open[L.at] + dt / 0.9); applyDoor(L.at); if (L.open[L.at] >= 1) L.state = "idle"; }
    // Kabine und ihre Teile
    cab.position.y = L.y; for (const p of Object.values(cabParts)) dkMove(p, L.y - cabY); cabY = L.y;
    const st = stops[L.at], openSide = (L.state === "idle" || L.state === "opening") && L.open[L.at] > 0.7 ? st.side : null; for (const s of ["-b", "+b", "+a"]) cabParts[s].on = s !== openSide;
    if (walking && !ghost && L.state === "moving" && inCar(player.pos)) { const p = player.pos, [a, b] = WTO.toT(p.x, p.z), m = 0.45, ca = Math.max(AI.a0 + m, Math.min(AI.a1 - m, a)), cb = Math.max(AI.b0 + m, Math.min(AI.b1 - m, b));
      if (ca !== a || cb !== b) { const [x, z] = WTO.toW(ca, cb); p.x = x; p.z = z; } player.pos.y = Y + L.y + 0.02; player.vy = 0; player.onGround = true; camera.position.y = player.pos.y + EYE; }
  }
  stops.forEach((_, i) => applyDoor(i));
  // Rechtsklick auf die Tueren (wie der Personenaufzug der Manor)
  gates.push({ name: "Wayne-Aufzug", g: doorG, call: () => use(), verbs: ["holen / fahren", "holen / fahren"], a: [WTO.cx, WTO.cz], b: [WTO.cx, WTO.cz] });
  return { L, stops, order, inCar, pick, step, use, frame, showFloor, onFloor, cabParts, FL };
})();
// Bildschleife (aus wtStep): eigene Zeit
function wliftStep(dtIn) { const now = performance.now() / 1000, dt = dtIn ?? Math.min(0.1, now - (WLIFT.t || now)); WLIFT.t = now; WLIFT.frame(dt); }
