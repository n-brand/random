// Batverse – Werkstatt (T5, Nicolas 2026-11-12): einzelnes Modell auf leerer Flaeche mit Rundkurs und Slalom testen, ohne die Spielwelt.
// Klassisches Skript nach ../js/kern/basis.js und ../js/fahrzeuge/modelle.js (gemeinsamer globaler Bereich: scene, camera, controls, renderer, sun, M ...).
// Fahren hier bewusst einfach (Einspurmodell auf ebenem Boden, keine Kollision): zum Ansehen der Modelle in Bewegung, Raeder, Lenkung, Groesse.
"use strict";

// ---------- Modelle (Bauplan + Werte aus modelle.js) ----------
const MODELLE = [
  { name: "Tumbler", spec: SPEC_TUMBLER, bau: () => buildTumbler(0x16181b, 0x0d0e10) },
  { name: "Nachtfalke", spec: SPEC_NACHTFALKE, bau: () => buildNachtfalke() },
  { name: "Aventador LP 700-4", spec: SPEC_AVENTADOR, bau: () => buildAventador() },
  { name: "Rolls-Royce Spectre", spec: SPEC_SPECTRE, bau: () => buildSpectre() },
  { name: "Rolls-Royce (grau)", spec: SPEC_ROLLS, bau: () => buildRolls(0x55585e) },
  { name: "Mercedes-Benz G-Klasse", spec: SPEC_GCLASS, bau: () => buildGClass(0x141a22) },
  { name: "Gotham Police", spec: SPEC_POLICE, bau: () => buildPolice() },
  { name: "Gotham Taxi", spec: SPEC_TAXI, bau: () => buildTaxi() },
  { name: "Gotham Fire Engine", spec: SPEC_FIRE_ENGINE, bau: () => buildFireTruck("engine") },
  { name: "Gotham Fire Ladder", spec: SPEC_FIRE_LADDER, bau: () => buildFireTruck("ladder") },
  { name: "Gotham Fire Chief", spec: SPEC_FIRE_CHIEF, bau: () => buildFireChief() },
  { name: "Gotham Fire Crane", spec: SPEC_FIRE_CRANE, bau: () => buildFireCrane() },
  { name: "Gotham Towing (Abschleppwagen)", spec: SPEC_TOW, bau: () => buildTowTruck(), offen: "Noch anzupassen: kann noch nicht abschleppen (Haken/Unterfahrlift ohne Funktion)." },
  { name: "Gotham Transit (Bus)", spec: SPEC_BUS, bau: () => buildBus() },
  { name: "Gotham Construction (Grossmuldenkipper)", spec: SPEC_HAUL, bau: () => buildHaulTruck() },
  { name: "Panzer", spec: SPEC_TANK, bau: () => buildTank() },
  { name: "Gemini Concept GT", spec: SPEC_GEMINI, bau: () => buildGemini() },
  { name: "ChatGPT GPT-6 Concept GT", spec: SPEC_CHATGPT, bau: () => buildChatGPT() },
  { name: "DeepSeek Concept Car", spec: SPEC_DEEPSEEK, bau: () => buildDeepSeek() },
  { name: "Batpod", spec: SPEC_BATPOD, bau: () => buildBatpod() },
  { name: "Boxer-Streetfighter", spec: SPEC_STREETFIGHTER, bau: () => buildStreetfighter() },
  { name: "Motorrad (rot)", spec: SPEC_BIKE, bau: () => buildBike(0xb0141e) },
  { name: "Lamborghini Terzo Millennio", spec: SPEC_TERZO, bau: () => buildTerzo() },
  { name: "DeLorean (Zeitmaschine, Leertaste: abheben)", spec: SPEC_DELOREAN, bau: () => buildDelorean() },
  // Fluggeraete (Nicolas 2026-11-12): Modell, Flugphysik, Kamera und Ton direkt aus jet.js / the-bat.js des Spiels (flache Welt aus flug-shim.js)
  { name: "Kampfjet", flug: "jet" },
  { name: "The Bat (Batwing)", flug: "bat" },
];

// ---------- Szene: Licht, Boden, Rundkurs, Slalom ----------
scene.fog = new THREE.Fog(SKY_DAY.clone(), 250, 900);
camera.far = 1500; camera.updateProjectionMatrix();
controls.maxDistance = 400; controls.minDistance = 2;
const flaeche = new THREE.Group(); scene.add(flaeche);
{ // Boden: Beton mit Raster (1 Feld = 10 m)
  const tex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#6f746f"; g.fillRect(0, 0, w, h); g.strokeStyle = "#5b5f5b"; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
    g.strokeStyle = "#646864"; g.lineWidth = 1; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); }, 120, 120);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  ground.receiveShadow = true; flaeche.add(ground);
}
// Rundkurs: zwei Geraden 220 m, Kurven Radius 60 m (Mitte), Fahrbahn 14 m; Startlinie bei x 0 / z 60
const KURS = { L: 220, R: 60, B: 14 };
{ const asph = new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.9 }), weiss = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6 });
  const stadion = (r) => { const s = new THREE.Shape(), h = KURS.L / 2; s.moveTo(-h, -r); s.lineTo(h, -r); s.absarc(h, 0, r, -Math.PI / 2, Math.PI / 2, false); s.lineTo(-h, r); s.absarc(-h, 0, r, Math.PI / 2, Math.PI * 1.5, false); return s; };
  const ring = (ri, ro, m, y) => { const s = stadion(ro); s.holes.push(stadion(ri)); const g = new THREE.ShapeGeometry(s, 48).rotateX(-Math.PI / 2); g.translate(0, y, 0); const o = new THREE.Mesh(g, m); o.receiveShadow = true; flaeche.add(o); };
  ring(KURS.R - KURS.B / 2, KURS.R + KURS.B / 2, asph, 0.02);
  ring(KURS.R - KURS.B / 2 + 0.3, KURS.R - KURS.B / 2 + 0.5, weiss, 0.03);   // Randlinien
  ring(KURS.R + KURS.B / 2 - 0.5, KURS.R + KURS.B / 2 - 0.3, weiss, 0.03);
  for (let k = 0; k < 8; k++) { const q = new THREE.Mesh(new THREE.PlaneGeometry(1, KURS.B / 8).rotateX(-Math.PI / 2), k % 2 ? weiss : new THREE.MeshStandardMaterial({ color: 0x111111 }));   // Startlinie kariert
    q.position.set(0, 0.035, KURS.R - KURS.B / 2 + (k + 0.5) * KURS.B / 8); flaeche.add(q); }
  // Slalom: Pylonen alle 12 m auf einer Geraden ausserhalb des Kurses (z -130)
  const kegel = new THREE.MeshStandardMaterial({ color: 0xff6a00, roughness: 0.6 });
  for (let k = 0; k < 10; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 14), kegel); c.position.set(-54 + k * 12, 0.375, -130); c.castShadow = true; flaeche.add(c); }
  // Masslatte 10 m neben dem Start (weiss/rot je 1 m) zum Groessenvergleich
  for (let k = 0; k < 10; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: k % 2 ? 0xd23a3a : 0xf2f2ee })); b.position.set(-5 + k + 0.5, 0.04, KURS.R + KURS.B / 2 + 4); flaeche.add(b); }
}
// Zielscheiben in der Mitte des Rundkurses (Nicolas 2026-11-12): beidseitig bemalt, auf Holzbock; Treffer klappt die Scheibe nach hinten um,
// nach 5 s steht sie wieder. Schiessen koennen alle Modelle mit Turm und Rohr (Bauplan liefert turret/gun, heute der Panzer).
const ZIELE = [], zielGruppe = new THREE.Group(); flaeche.add(zielGruppe);   // Zielscheiben nur sichtbar, wenn ein Modell mit Turm gewaehlt ist (Nicolas 2026-11-12)
{ const tex = canvasTex(256, 256, (g, w) => { const R = w / 2; for (let k = 0; k < 6; k++) { g.fillStyle = k === 5 ? "#ffd43b" : k % 2 ? "#d23a3a" : "#f4f1ea"; g.beginPath(); g.arc(R, R, R * (1 - k / 6) - 1, 0, 7); g.fill(); g.strokeStyle = "#1a1a1a"; g.lineWidth = 2; g.stroke(); } });
  const scheibeM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }), holzM = new THREE.MeshStandardMaterial({ color: 0x7a5534, roughness: 0.9 }), randM = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
  // [x, z, Radius, Hoehe der Mitte, Blickrichtung]: grosse Scheiben in der Mittelreihe, kleine davor/dahinter (je zur naechsten Geraden)
  for (const [x, z, r, y, h] of [[-80, 0, 1.6, 2.4, 0], [-40, 0, 1.6, 2.4, Math.PI], [0, 0, 1.6, 2.4, 0], [40, 0, 1.6, 2.4, Math.PI], [80, 0, 1.6, 2.4, 0],
    [-60, 28, 0.8, 1.4, 0], [-20, 28, 0.8, 1.4, 0], [20, 28, 0.8, 1.4, 0], [60, 28, 0.8, 1.4, 0], [-60, -28, 0.8, 1.4, Math.PI], [-20, -28, 0.8, 1.4, Math.PI], [20, -28, 0.8, 1.4, Math.PI], [60, -28, 0.8, 1.4, Math.PI]]) {
    const st = new THREE.Group(); st.position.set(x, 0, z); st.rotation.y = h; zielGruppe.add(st);
    for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, y + 0.2, 0.14), holzM); b.position.set(sx * r * 0.7, (y + 0.2) / 2, 0.25); b.castShadow = true; st.add(b); }   // Bock
    const kl = new THREE.Group(); kl.position.set(0, y - r - 0.05, 0); st.add(kl);   // Klappe: Drehachse unten an der Scheibe
    const s = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 40).rotateX(Math.PI / 2), [randM, scheibeM, scheibeM]); s.position.y = r + 0.05; s.castShadow = true; kl.add(s);
    ZIELE.push({ x, z, y, r, h, kl, fall: 0, t: 0 });
  }
}

// Fuellbau-Beispiel (Nicolas 2026-11-12: wie stellst du dir die Fuellbauten vor?): Wohn- und Geschaeftshaus der Suedseite (Mittelstand) aus
// js/gotham/fuellbau.js, oestlich neben dem Rundkurs, Front mit Laeden zur Strecke (Westen), auf einem Gehweg
const FUELLBAU = (() => { const g = buildFuellbau({ breite: 24, tiefe: 20, geschosse: 7, seed: 11, id: "FB-MUSTER" }); g.position.set(238, 0, -10); g.rotation.y = -Math.PI / 2; scene.add(g);
  const bs = buildBaustelle({ breite: 18, tiefe: 20, seed: 5, id: "BS-MUSTER" }); bs.position.set(238, 0.15, 11.2); bs.rotation.y = -Math.PI / 2; scene.add(bs);   // Baustelle als Lueckenfueller daneben (Nicolas 2026-11-12)
  const walk = new THREE.Mesh(new THREE.BoxGeometry(28, 0.15, 46), new THREE.MeshStandardMaterial({ color: 0x9a9893, roughness: 0.9 })); walk.position.set(236, 0.075, 0); walk.receiveShadow = true; scene.add(walk); return g; })();
// ---------- Fluggeraete ----------
const FLUG = { jet: () => JET, bat: () => FLY };
// Startbahn (Kampfjet) und Landeplatz (The Bat) am Nordrand der Flaeche
const PAD = { x: -100, z: -200 };
{ const asph = new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.9 }), weiss = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6 });
  const bahn = new THREE.Mesh(new THREE.PlaneGeometry(RUNWAY.x1 - RUNWAY.x0, RUNWAY.w).rotateX(-Math.PI / 2), asph); bahn.position.set((RUNWAY.x0 + RUNWAY.x1) / 2, 0.02, RUNWAY.z); bahn.receiveShadow = true; flaeche.add(bahn);
  for (let x = RUNWAY.x0 + 30; x < RUNWAY.x1 - 20; x += 40) { const l = new THREE.Mesh(new THREE.PlaneGeometry(20, 0.9).rotateX(-Math.PI / 2), weiss); l.position.set(x, 0.03, RUNWAY.z); flaeche.add(l); }   // Mittellinie
  for (const sz of [-1, 1]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(RUNWAY.x1 - RUNWAY.x0, 0.6).rotateX(-Math.PI / 2), weiss); r.position.set((RUNWAY.x0 + RUNWAY.x1) / 2, 0.03, RUNWAY.z + sz * (RUNWAY.w / 2 - 1)); flaeche.add(r); }
  const pad = new THREE.Mesh(new THREE.CircleGeometry(11, 48).rotateX(-Math.PI / 2), asph); pad.position.set(PAD.x, 0.02, PAD.z); flaeche.add(pad);
  const ring = new THREE.Mesh(new THREE.RingGeometry(9.6, 10.2, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffd43b })); ring.position.set(PAD.x, 0.03, PAD.z); flaeche.add(ring);
  for (const [w, d, x, z] of [[1, 7, -2.2, 0], [1, 7, 2.2, 0], [3.4, 1, 0, 0]]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), weiss); b.position.set(PAD.x + x, 0.03, PAD.z + z); flaeche.add(b); }   // H
}
Object.assign(FLY, { x: PAD.x, y: 0, z: PAD.z, h: -Math.PI / 2 }); FLY.home = { x: FLY.x, y: FLY.y, z: FLY.z, h: FLY.h }; batPose(FLY, 0);
for (const F of [JET, FLY]) F.g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
function flugReset(F) { if (F === JET) return jetReset(); Object.assign(F, { ...F.home, vx: 0, vy: 0, vz: 0, pitch: 0, roll: 0, gearT: 0 }); player.yaw = F.h; batPose(F, 0); toast("The Bat zurück auf dem Landeplatz"); }

// ---------- Zielfahrzeuge (Nicolas 2026-11-12): geparkt suedlich der Startgeraden, Front zur Strecke; Schutzstufen wie im Spiel (ARMOR in
// modelle.js), Treffer als Kapsel wie vehCapsule in schiessen.js; zerstoert = verkohltes Wrack (springt hoch, raucht), nach 15 s wieder heil ----------
const ZIELAUTOS = [["Gotham Taxi", -60], ["Gotham Police", -30], ["Rolls-Royce (grau)", 0], ["Mercedes-Benz G-Klasse", 30], ["Tumbler", 60]].map(([n, x]) => {
  const m = MODELLE.find(q => q.name === n), b = m.bau(), z = 100; b.g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  b.g.position.set(x, 0, z); scene.add(b.g); const max = ARMOR[m.spec.name] || 2;
  return { name: n, spec: m.spec, g: b.g, x, z, h: 0, max, hp: max, dead: false, t: 0, puff: 0 };
});
function autoKapsel(v) { const sp = v.spec, L = Math.max(...sp.pts.map(Math.abs)) + sp.R * 0.5, r = Math.max(sp.R * 0.95, sp.bodyH * 0.5); return { y: sp.bodyH * 0.5, ax: Math.sin(v.h), az: Math.cos(v.h), L, r }; }
function autoAn(x, y, z) {   // Fahrzeug an Punkt? (wie shotAt im Spiel)
  for (const v of ZIELAUTOS) { const c = autoKapsel(v), dx = x - v.x, dz = z - v.z, t = Math.max(-c.L, Math.min(c.L, dx * c.ax + dz * c.az));
    const ex = dx - c.ax * t, ez = dz - c.az * t, ey = (y - c.y) * (c.r / Math.max(0.6, v.spec.bodyH * 0.55)); if (ex * ex + ey * ey + ez * ez < c.r * c.r) return v; }
  return null;
}
function autoTreffer(v, p) {
  if (v.dead) return;
  v.hp--; if (v.hp > 0) return toast(v.name + " getroffen – hält noch " + v.hp + " von " + v.max);
  v.dead = true; v.t = 0; v.roll = (Math.random() - 0.5) * 0.25; v.pitch = (Math.random() - 0.5) * 0.12; toast(v.name + " zerstört");
  fx(p, 0xfff0c0, 1.2, 0.2, 9); for (let i = 0; i < 5; i++) fx(new THREE.Vector3(v.x + (Math.random() - 0.5) * 2.5, 1 + Math.random() * 1.5, v.z + (Math.random() - 0.5) * 2.5), i % 2 ? 0xff7a1a : 0xffb23a, 0.8, 0.8, 4); knall(1);
  v.g.traverse(o => { if (!o.isMesh) return; o.userData.mat0 = o.material; const burn = m => { const c = m.clone(); if (c.color) c.color.lerp(new THREE.Color(0x1b1815), 0.86); if (c.emissive) c.emissive.set(0); if (c.map && !c.transparent) c.map = null; return c; };
    o.material = Array.isArray(o.material) ? o.material.map(burn) : burn(o.material); });
}
function autosStep(dt) {
  for (const v of ZIELAUTOS) { if (!v.dead) continue; v.t += dt; const t = v.t, up = t < 1.2 ? Math.max(0, 7 * t - 7 * t * t) * 0.45 : 0, k = Math.min(1, t / 1.2);
    v.g.position.set(v.x, up, v.z); v.g.rotation.set(v.pitch * k, v.h, v.roll * k, "YXZ");
    if ((v.puff -= dt) <= 0) { v.puff = 0.25; fx(new THREE.Vector3(v.x + (Math.random() - 0.5) * 1.5, v.spec.bodyH + up, v.z + (Math.random() - 0.5) * 1.5), 0x2b2a28, 0.5, 2.5, 1.6); }
    if (t > 15) { v.g.traverse(o => { if (o.isMesh && o.userData.mat0) { o.material = o.userData.mat0; delete o.userData.mat0; } }); v.dead = false; v.hp = v.max; v.g.position.set(v.x, 0, v.z); v.g.rotation.set(0, v.h, 0); toast(v.name + " ist wieder heil"); } }
}

// Schaufel schiebt (wie vehPushStep im Spiel): Kante spec.push gegen die Kapseln der Zielfahrzeuge, von jeder Seite, am Ende getroffen drehen sie sich
function schieben(A) {
  const P = A.spec.push, s = Math.sin(A.h), c = Math.cos(A.h); let pushed = false;
  for (const v of ZIELAUTOS) { const L = Math.max(...v.spec.pts.map(Math.abs)), r = v.spec.circR + 0.1, ax = Math.sin(v.h), az = Math.cos(v.h);
    let mx = 0, mz = 0, pmax = 0, tq = 0;
    for (let k = -2; k <= 2; k++) { const lx = P.w * k / 2, bx = A.x + lx * c + P.z * s, bz = A.z - lx * s + P.z * c;
      const t = Math.max(-L, Math.min(L, (bx - v.x) * ax + (bz - v.z) * az)), qx = v.x + ax * t, qz = v.z + az * t, d = Math.hypot(qx - bx, qz - bz);
      if (d >= r) continue;
      const nx = d > 1e-4 ? (qx - bx) / d : -s, nz = d > 1e-4 ? (qz - bz) / d : -c, pen = r - d;
      mx += nx * pen; mz += nz * pen; pmax = Math.max(pmax, pen); tq += (nx * -az + nz * ax) * pen * t; }
    if (pmax > 0) { const ml = Math.hypot(mx, mz) || 1; v.x += mx / ml * pmax; v.z += mz / ml * pmax; v.h = wrapW(v.h + tq / (L * L + 1) * 0.35); pushed = true; }
    if (!v.dead) { v.g.position.set(v.x, 0, v.z); v.g.rotation.set(0, v.h, 0); } }
  return pushed;
}
// Feuer zum Loeschen (Nicolas 2026-11-12): nur wenn ein Modell mit Wasserwerfer gewaehlt ist; Flammen und Rauch an fuenf Stellen im Innenfeld,
// Wasser schwaecht sie (staerke 1 -> 0), geloescht nach ca. 2 s Strahl, nach 30 s brennt es wieder
const FEUER = [], feuerGruppe = new THREE.Group(); feuerGruppe.visible = false; scene.add(feuerGruppe);
{ const flM = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), cone = new THREE.ConeGeometry(0.7, 2.2, 10, 1, true).translate(0, 1.1, 0);
  for (const [x, z] of [[-90, 20], [-30, -20], [10, 25], [55, -15], [95, 10]]) { const f = new THREE.Group(); f.position.set(x, 0, z); feuerGruppe.add(f);
    meshIn(f, new THREE.CylinderGeometry(1.1, 1.3, 0.25, 12), M(0x1a1714, { roughness: 1 }), 0, 0.12, 0);                           // verkohlter Haufen
    const cones = [0, 1, 2].map(i => { const o = new THREE.Mesh(cone, flM(i ? 0xff6a10 : 0xffc040)); o.position.set((i - 1) * 0.5, 0.2, (i % 2) * 0.4 - 0.2); f.add(o); return o; });
    FEUER.push({ x, z, g: f, cones, k: 1, t: 0, puff: 0 }); } }
function feuerStep(dt) {
  const an = !!(AKT && AKT.monitor); feuerGruppe.visible = an; if (!an) return;
  for (const F of FEUER) { if (F.k <= 0) { F.t += dt; if (F.t > 30) { F.k = 1; F.t = 0; } F.cones.forEach(c => c.visible = false); continue; }
    F.cones.forEach((c, i) => { c.visible = true; const fl = 0.8 + 0.4 * Math.random(); c.scale.set(F.k * fl * (i ? 1 : 0.7), F.k * fl * (1.3 - i * 0.15), F.k * fl * (i ? 1 : 0.7)); });
    if ((F.puff -= dt) <= 0) { F.puff = 0.2; fx(new THREE.Vector3(F.x + (Math.random() - 0.5), 2.5 * F.k + 0.5, F.z + (Math.random() - 0.5)), 0x2b2a28, 0.5 + F.k * 0.4, 2.5, 1.8); } }
}
// ---------- Modell laden ----------
const START = { x: 0, z: KURS.R, h: -Math.PI / 2 };   // auf der Startlinie, Front nach Osten (+x)
let AKT = null;   // { m, g, wheels, spec, x, z, h, v, steer, maße }
const $info = $("info"), $speed = $("speed"), $nitro = $("nitro"), fmt = v => String(Math.round(v * 100) / 100).replace(".", ",");
function laden(i) {
  $nitro.hidden = true;
  world.userData.car.leave();                                             // Jet / The Bat aussteigen (bleiben stehen, wo sie sind)
  if (AKT && !AKT.flug) { engineStop(true); scene.remove(AKT.g); AKT.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  const m = MODELLE[i];
  if (m.flug) {
    const F = FLUG[m.flug](), r = F.g.rotation.clone(); F.g.rotation.set(0, 0, 0); F.g.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(F.g).getSize(new THREE.Vector3()); F.g.rotation.copy(r); F.g.updateMatrixWorld(true);
    AKT = { m, flug: m.flug, F, g: F.g, size, spec: {} }; sicht();
    $info.innerHTML = `<table><tr><td>Länge</td><td>${fmt(size.z)} m</td></tr><tr><td>Breite</td><td>${fmt(size.x)} m</td></tr><tr><td>Höhe</td><td>${fmt(size.y)} m</td></tr>
      ${m.flug === "jet" ? `<tr><td>Abheben ab</td><td>${Math.round(JET_VS * 1.15 * 3.6)} km/h</td></tr><tr><td>Steuerung</td><td>W/S Schub, A/D rollen, Maus Nase</td></tr>` : `<tr><td>Höchstgeschw.</td><td>252 km/h</td></tr><tr><td>Steuerung</td><td>W/S, A/D, Leertaste/C</td></tr>`}</table>
      <div class="note">Flugphysik, Kamera und Ton wie im Spiel. V Kamera, R zurück ${m.flug === "jet" ? "an den Start der Piste" : "auf den Landeplatz"}.</div>`;
    if (modus === "drive") flugStart(); else { controls.target.set(F.x, F.y + 1, F.z); camera.position.set(F.x + size.z * 0.9 + 6, F.y + size.y + 6, F.z + size.z * 1.1 + 6); }
    try { localStorage.setItem("werkstatt-modell", String(i)); } catch (e) {}
    return;
  }
  const b = m.bau(); b.g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(b.g);
  b.g.rotation.set(0, 0, 0); b.g.position.set(0, 0, 0); b.g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(b.g), size = box.getSize(new THREE.Vector3());
  AKT = { m, g: b.g, wheels: b.wheels || [], spec: m.spec, x: START.x, z: START.z, h: START.h, v: 0, steer: 0, size, lean: 0, turret: b.turret && b.gun ? b.turret : null, gun: b.gun, gunMin: b.gunMin, beacon: b.beacon || null, monitor: b.monitor || null, dumpG: b.dump || null,
    y: 0, vy: 0, air: false, pitch: 0, roll: 0, wheelGlow: b.wheelGlow || null, folds: b.folds || null, glowM: b.glowM || null, fold: 0, hoverWant: false, flying: false, hPrev: false, jetM: b.jetM || null, flame: b.flame || null, jet: 0, boostE: 1, boostT: 0, boostOn: false, spPrev: false };   // Sprung/Nitro wie im Spiel
  if (AKT.gun) AKT.gun.userData.z0 = AKT.gun.position.z;
  AKT.foldPose = () => { const A = AKT; if (!A.folds) return; const f = A.fold, e = f * f * (3 - 2 * f); for (const q of A.folds) q.g.rotation.z = -q.sd * Math.PI / 2 * e; if (A.glowM) A.glowM.opacity = e * (0.55 + 0.2 * Math.sin(performance.now() / 1000 * 9)); };
  kYaw = START.h; kPitch = -0.12; ZOOM.z = ZOOM.t = 1; if (modus === "drive") { camera.fov = 70; camera.updateProjectionMatrix(); }
  setze(); sicht();
  const s = m.spec;
  $info.innerHTML = `<table>
    <tr><td>Länge</td><td>${fmt(size.z)} m</td></tr><tr><td>Breite</td><td>${fmt(size.x)} m</td></tr><tr><td>Höhe</td><td>${fmt(size.y)} m</td></tr>
    <tr><td>Radstand</td><td>${fmt(s.wb)} m</td></tr><tr><td>Spur</td><td>${s.track ? fmt(s.track) + " m" : "Zweirad"}</td></tr>
    <tr><td>Höchstgeschw.</td><td>${Math.round((s.maxF || s.maxN) * 3.6)} km/h</td></tr><tr><td>Beschleunigung</td><td>${fmt(s.acc)} m/s²</td></tr></table>${m.offen ? `<div class="note">Erinnerung: ${m.offen}</div>` : ""}`;   // offene Punkte je Modell
  if (modus !== "drive") { controls.target.set(AKT.x, size.y * 0.45, AKT.z); camera.position.set(AKT.x + size.z * 1.1 + 3, size.y + 2.5, AKT.z + size.z * 1.3 + 3); }
  tonAn();
  try { localStorage.setItem("werkstatt-modell", String(i)); } catch (e) {}
}
// Ton wie im Spiel (Nicolas 2026-11-12: in der Werkstatt sollen alle Sounds gehen): Motorton aus motorton.js (Profil nach spec.name), an beim Fahren,
// aus beim Ansehen/Drehteller und beim Modellwechsel; Jet und The Bat starten ihren Ton selbst (jet.js / the-bat.js). M = Ton an/aus, Lautstaerke wie im Spiel.
function tonAn() { if (modus === "drive" && AKT && !AKT.flug) engineStart(AKT.spec.name); else if (!(AKT && AKT.flug && modus === "drive")) engineStop(); }
function flugStart() { const F = AKT.F; player.pos.set(F.x, AKT.flug === "jet" ? F.y - JET_Y : F.y, F.z); if (!(AKT.flug === "jet" ? useJet() : useFly())) toast("Einsteigen ging nicht"); }
function setze() { const A = AKT; if (A.flug) return; A.g.position.set(A.x, A.y || 0, A.z); A.g.rotation.set(A.pitch || 0, A.h, A.spec.track ? (A.roll || 0) : A.lean, "YXZ"); }
window.werkstattTeleport = p => { if (!AKT || AKT.flug) return; AKT.x = p.x; AKT.z = p.z; AKT.v = 0; setze(); };

// ---------- Auswahl und Ansicht ----------
const pick = $("pick");
MODELLE.forEach((m, i) => { const o = document.createElement("option"); o.value = i; o.textContent = m.name; pick.appendChild(o); });
{ const og = document.createElement("optgroup"); og.label = "Gebäude-Vorlagen (kommen mit G3)"; const o = document.createElement("option"); o.disabled = true; o.textContent = "noch keine"; og.appendChild(o); pick.appendChild(og); }
pick.onchange = () => laden(+pick.value);
let modus = "orbit";
const setModus = m => { const war = modus; modus = m;
  if (AKT && AKT.flug && war === "drive" && m !== "drive") world.userData.car.leave(); for (const [id, k] of [["m-orbit", "orbit"], ["m-drive", "drive"], ["m-spin", "spin"]]) $(id).setAttribute("aria-pressed", String(m === k));
  document.body.classList.toggle("drive", m === "drive"); if (m !== "drive") $nitro.hidden = true; controls.enabled = m !== "drive"; $speed.hidden = m !== "drive";
  if (m !== "drive" && document.pointerLockElement) document.exitPointerLock();
  if (m === "drive" && AKT && !AKT.flug) { kYaw = AKT.h; kPitch = -0.12; A_view = 0; }
  if (m === "drive" && AKT && AKT.flug && war !== "drive") flugStart();
  if (m !== "drive") { ZOOM.z = ZOOM.t = 1; ZOOM.un = 0; }
  camera.fov = m === "drive" ? 70 : 45; camera.updateProjectionMatrix();
  if (m !== "drive" && AKT) { if (AKT.flug) controls.target.set(AKT.F.x, AKT.F.y + 1, AKT.F.z); else controls.target.set(AKT.x, AKT.size.y * 0.45, AKT.z); }
  sicht(); tonAn(); };
const MODI = ["orbit", "drive", "spin"];
$("m-orbit").onclick = () => setModus("orbit"); $("m-drive").onclick = () => setModus("drive"); $("m-spin").onclick = () => setModus("spin");
// Visier (nur Fahren mit Turm) und Hinweis zur Maus
function sicht() { const z = modus === "drive" && AKT && AKT.turret; $("visier").hidden = !z; if (!z) $("rohr").hidden = true;
  if (!(modus === "drive" && AKT && AKT.monitor)) { $("wsicht").hidden = true; WZOOM.t = WZOOM.z = 1; } document.body.classList.toggle("waffe", !!z); maushinweis(); }
function maushinweis() { $("maus").hidden = modus !== "drive" || !!document.pointerLockElement || document.body.classList.contains("touch"); }

// ---------- Maus einfangen (Fahren): Linksklick faengt die Maus, erneuter Linksklick oder Esc gibt sie frei ----------
// Wie im Spiel (fahren.js carCamera, bedienung.js): kYaw/kPitch = player.yaw/pitch, Empfindlichkeit fest 50 %, im Panzer-Zoom feiner
let kYaw = 0, kPitch = -0.12, A_view = 0;   // A_view 1 = Fahrersicht (V)
const MOUSE_SENS = 0.0025 * 0.5, ZOOM = { z: 1, t: 1, un: 0 };
const ZOOM_SENS_GLEICH = true;   // TEST wie schiessen.js (Nicolas 2026-11-12): Maus im Zoom gleich schnell; false = durch den Zoom geteilt
renderer.domElement.addEventListener("mousedown", e => { if (e.button !== 0 || modus !== "drive") return; if (document.pointerLockElement) document.exitPointerLock(); else renderer.domElement.requestPointerLock(); });
document.addEventListener("pointerlockchange", maushinweis);
addEventListener("mousemove", e => { if (document.pointerLockElement !== renderer.domElement) return;
  if (AKT && AKT.flug) return look(e.movementX * MOUSE_SENS, e.movementY * MOUSE_SENS);   // Fluggeraete: Blick wie im Spiel (player.yaw/pitch)
  const k = ZOOM_SENS_GLEICH ? 1 : ZOOM.z; kYaw -= e.movementX * MOUSE_SENS / k; kPitch = Math.max(-1.5, Math.min(1.5, kPitch - e.movementY * MOUSE_SENS / k)); });
// Mausrad im Panzer: Zoom 1x bis 6x (wie schiessen.js)
addEventListener("wheel", e => { if (modus === "drive" && AKT && AKT.monitor) { e.preventDefault(); WZOOM.t = Math.max(1, Math.min(4, WZOOM.t * (e.deltaY < 0 ? 1.25 : 0.8))); if (WZOOM.t < 1.05) WZOOM.t = 1; return; }   // Wasserwerfer-Zoom
  if (!(modus === "drive" && AKT && AKT.turret)) return; e.preventDefault(); ZOOM.t = Math.max(1, Math.min(6, ZOOM.t * (e.deltaY < 0 ? 1.25 : 0.8))); if (ZOOM.t < 1.05) ZOOM.t = 1; }, { passive: false });
if (matchMedia("(pointer: coarse)").matches) document.body.classList.add("touch");

// ---------- Tasten ----------
const keys = new Set();
addEventListener("keydown", e => { if (e.target.tagName === "SELECT") return; keys.add(e.code);
  if (AKT && AKT.flug) { if (modus === "drive" && !e.repeat) { const F = AKT.F;   // Fluggeraete: V Kamera, R zurueck (wie bedienung.js)
      if (e.code === "KeyV") { F.view = F.view === 1 ? 0 : 1; if (F === JET) player.yaw = F.h; else player.pitch = F.view ? 0 : -0.2; }
      if (e.code === "KeyR") flugReset(F);
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") { if (F === JET ? useJet() : useFly()) if (!F.on) setModus("orbit"); } }   // Shift aussteigen (nur gelandet, wie im Spiel)
  } else if (e.code === "KeyR" && AKT) { Object.assign(AKT, { x: START.x, z: START.z, h: START.h, v: 0, steer: 0 }); setze(); }
  if (e.code === "KeyV" && !e.repeat && !(AKT && AKT.flug)) A_view = A_view ? 0 : 1;
  if (e.code === "KeyM" && !e.repeat) { ENGINE.muted = !ENGINE.muted; if (ENGINE.muted) engineStop(true); else tonAn(); toast(ENGINE.muted ? "Ton aus (M)" : "Ton an (M)"); }
  if (e.code === "KeyF" || (e.code === "KeyE" && modus !== "drive")) setModus(modus === "drive" ? "orbit" : "drive");
  const n = /^(Digit|Numpad)([1-3])$/.exec(e.code); if (n) setModus(MODI[+n[2] - 1]);   // 1 Ansehen, 2 Fahren, 3 Drehteller
  if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault(); });
addEventListener("keyup", e => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
for (const b of document.querySelectorAll("#touch button")) { const k = b.dataset.k;
  b.addEventListener("pointerdown", e => { e.preventDefault(); keys.add(k); }); for (const ev of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(ev, () => keys.delete(k)); }
const down = (...c) => c.some(k => keys.has(k));

// ---------- Fahren (Einspurmodell) ----------
// Verfolger-Kamera und Fahrersicht (aus fahren() herausgezogen, damit der DeLorean beim Schweben dieselbe Kamera nutzt; Nicolas 2026-11-12)
function folgeKamera(A, s, dt) {
  if (A.wheelGlow) A.wheelGlow.emissiveIntensity = 0.35 + 1.4 * Math.min(1, Math.abs(A.v) / 20);   // Terzo: Felgen leuchten mit dem Tempo
  engineUpdate({ v: A.v, throttle: down("KeyW", "ArrowUp") ? 1 : 0, air: A.air || A.flying });   // Motorton (Drehzahl, Gaenge, in der Luft hoch)
  // Kamera wie im Spiel (fahren.js): Lenken dreht den Blick mit (ausser Panzer), ab 3 m/s gleitet er hinter das Fahrzeug (rueckwaerts davor)
  const dh = A.h - (A.dh0 ?? A.h); A.dh0 = A.h;
  if (!A.turret) { kYaw += dh; if (Math.abs(A.v) > 3) kYaw += wrapW(A.h + (A.v < 0 ? Math.PI : 0) - kYaw) * Math.min(1, dt * 1.2); }
  // erst die normale Kamera (Verfolger oder Fahrersicht), danach zielt die Waffe von dort und setzt gezoomt die Zieloptik
  const camT = A.air && !A.flying ? 0 : Math.abs(A.v); A.camV = A.camV === undefined ? camT : A.camV + (camT - A.camV) * Math.min(1, dt * 2.5);   // geglaettet wie fahren.js
  const TG = tempoGefuehl(A.camV, performance.now() / 1000);   // Tempo-Gefuehl wie fahren.js carCamera (modelle.js)
  if (!A.turret && Math.abs(camera.fov - TG.fov) > 0.05) { camera.fov = TG.fov; camera.updateProjectionMatrix(); }
  if (A_view === 1 && s.seat) { const [sx, sy, sz] = s.seat, sn = Math.sin(A.h), c = Math.cos(A.h);
    camera.position.set(A.x + sx * c + sz * sn, sy + (A.y || 0), A.z - sx * sn + sz * c); camera.rotation.set(kPitch + TG.sy * 0.15, kYaw + TG.sx * 0.1, 0, "YXZ"); }
  else { const D = (s.camD || 8) * TG.dK, H = Math.max(0.9, Math.min(7, 2.2 - kPitch * 6)), tx = A.x, ty = (s.camH || 1.2) + (A.y || 0), tz = A.z;
    const ex = Math.sin(kYaw) * D, ey = Math.max(0.5, H - 1.3 + 0.9 + TG.hK), ez = Math.cos(kYaw) * D;
    camera.position.set(tx + ex + TG.sx, Math.max(0.3, ty + ey + TG.sy), tz + ez); camera.up.set(0, 1, 0); camera.lookAt(tx, ty + 0.3, tz); }
}
function fahren(dt) {
  const A = AKT, s = A.spec, vmax = s.maxF || s.maxN || 30, gas = down("KeyW", "ArrowUp"), brems = down("KeyS", "ArrowDown"), links = down("KeyA", "ArrowLeft"), rechts = down("KeyD", "ArrowRight");
  // wie im Spiel (fahren.js carStep): Gas/Bremse/Ausrollen, Lenken mit Anlaufzeit, Kurvenphysik (modelle.js); Gelaende ist hier eben
  const th = gas ? 1 : brems ? -1 : 0, st = (links ? 1 : 0) - (rechts ? 1 : 0);
  if (st && Math.sign(st) === A.stDir) A.stHold = (A.stHold || 0) + dt; else { A.stHold = 0; A.stDir = Math.sign(st); }
  const hk = Math.min(1, A.stHold / 0.45), stF = st ? 0.25 + 0.75 * hk * hk * (3 - 2 * hk) : 0;
  A.steer += (st * stF * s.steer / (1 + Math.abs(A.v) / 14) - A.steer) * Math.min(1, dt * 8);
  const KP = kurvenPhysik(s, A.v, A.steer, th, vmax); A.aLat = A.v * A.v * Math.abs(KP.k);
  A.h += A.v * KP.k * dt;
  const brk = (s.brake || 28) + Math.abs(A.v) * 0.2;
  if (th > 0) A.v += (A.v < -0.2 ? brk : s.acc * (1 - Math.max(0, A.v) / (vmax + 8)) * KP.thF) * dt;
  else if (th < 0) A.v -= (A.v > 0.2 ? brk : s.revMax ? s.acc * (1 - Math.max(0, -A.v) / (s.revMax + 8)) : 6) * dt;
  else A.v -= Math.sign(A.v) * Math.min(Math.abs(A.v), (3 + Math.abs(A.v) * 0.06) * dt);
  if (A.monitor) { const el = Math.max(-0.9, Math.min(0.9, kPitch + 0.32)), M0 = monitorPose(A.g, A.monitor, wrapW(kYaw - A.h), el, dt, down("Space"));   // Arm-Wasserwerfer (wie schiessen.js wasserFrame)
    if (down("Space") && M0.ready) wasserSpritzen(dt, M0.tip, kYaw, el - 0.32);
    A.wz = { tip: M0.tip, el, ready: M0.ready }; }
  else if (A.dumpG) dumpPose(A.dumpG, A, down("Space"), dt);   // Muldenkipper: Mulde kippen (wie fahren.js carPose)
  else if (down("Space") && !A.turret && !s.jump && !s.boost && !s.hover) A.v -= Math.sign(A.v) * Math.min(Math.abs(A.v), 14 * dt);   // Handbremse (mit Turm = schiessen, mit Sprung/Nitro = springen/Nitro)
  // DeLorean schwebt wie im Spiel (fahren.js hoverStep): Leertaste klappt die Raeder auch beim Fahren fluessig ein und hebt im gleichen Takt ab,
  // dann Leertaste hoch, C runter, C unten halten oder H landet (Raeder klappen beim Sinken aus). Boden hier eben (y 0).
  if (s.hover) { const sp2 = down("Space"), hk = down("KeyH"), tap = (sp2 && !A.hvPrev) || (hk && !A.hPrev); A.hvPrev = sp2; A.hPrev = hk;
    if (!A.flying && tap) { A.flying = true; A.hoverWant = true; A.vy = 0; A.lowT = 0; toast("Räder klappen ein – Leertaste hoch, C runter, Leertaste doppelt = landen"); }
    else if (A.flying && A.hoverWant && hk && tap) { A.hoverWant = false; toast("Landen – Räder klappen aus"); }
    else if (A.flying && A.hoverWant && tap) { const now = performance.now() / 1000; if (now - (A.tapT ?? -9) < 0.35) { A.hoverWant = false; A.tapT = -9; toast("Landen – Räder klappen aus"); } else A.tapT = now; }   // Leertaste doppelt tippen = landen
    if (A.flying) {
      if (A.hoverWant) A.fold = Math.min(1, A.fold + dt / 1.0); const e = A.fold * A.fold * (3 - 2 * A.fold), dn = down("KeyC");
      A.v += (th * 30 - A.v) * Math.min(1, dt * (th ? 0.7 : 0.25)); A.h += st * 1.3 * dt;   // Blick dreht folgeKamera mit (dh)
      A.vy += ((A.hoverWant ? (A.fold < 1 ? 0 : ((sp2 ? 1 : 0) - (dn ? 1 : 0)) * 6) : -4) - A.vy) * Math.min(1, dt * 3);
      let ny = Math.min(400, A.y + A.vy * dt);
      if (A.hoverWant) { const min = 0.6 * e; if (ny < min) { ny = Math.min(min, Math.max(ny, A.y) + 1.2 * dt + (min - Math.max(ny, A.y)) * Math.min(1, dt * 4)); if (A.vy < 0) A.vy = 0; }
        A.lowT = dn && ny <= 0.65 ? (A.lowT || 0) + dt : 0; if (A.lowT > 0.4) { A.hoverWant = false; toast("Landen – Räder klappen aus"); } }
      else { A.fold = Math.min(A.fold, Math.max(0, ny / 1.5)); if (ny <= 0.02) { ny = 0; A.vy = 0; A.fold = 0; A.flying = false; toast("Gelandet"); } }
      A.y = ny;
      A.pitch += (-th * 0.08 - A.pitch) * Math.min(1, dt * 2); A.roll += (st * 0.22 * Math.min(1, Math.abs(A.v) / 8) - A.roll) * Math.min(1, dt * 3);
      A.x -= Math.sin(A.h) * A.v * dt; A.z -= Math.cos(A.h) * A.v * dt;
      for (const w of A.wheels || []) if (w.spin) w.spin.rotation.x -= A.v * dt / w.r * (1 - A.fold);
      A.foldPose(); setze(); $speed.textContent = Math.round(Math.abs(A.v) * 3.6) + " km/h" + (A.hoverWant ? (A.fold < 1 ? " · Räder klappen ein" : " · schwebt") : " · landet");
      folgeKamera(A, s, dt); return; }
    A.hoverWant = false; if (A.fold > 0) A.fold = Math.max(0, A.fold - dt / 1.0); A.roll = 0; A.foldPose(); }
  // Sprung und Nitro wie im Spiel (fahren.js carStep, Nicolas 2026-11-12: in der Werkstatt konnte man nicht springen): Sprung ab 14 m/s (50 km/h),
  // Steigtempo 7,5 m/s, +6 m/s Schub mit Duese (Tumbler) bzw. +3 ohne (Batpod), Schwerkraft 14; Nitro: Leertaste halten, 80 m/s² bis 40 km/h ueber dem Hoechsttempo, Vorrat 4 s
  const spc = down("Space"), tap = spc && !A.spPrev; A.spPrev = spc;
  const boosting = !!s.boost && spc && !A.air && th >= 0 && A.boostE > 0;
  if (s.boost) { if (boosting && !A.boostOn && typeof engineJet === "function") engineJet(); A.boostOn = boosting;
    if (boosting) { A.boostE = Math.max(0, A.boostE - dt / 4); A.boostT = -2; A.jet = Math.max(A.jet, 0.5); }
    else if (A.boostE < 1) { A.boostT += dt; if (A.boostT >= 0.6) { A.boostT -= 0.6; A.boostE = Math.min(1, Math.floor(A.boostE * 10 + 1e-6) / 10 + 0.1); } }
    if (tap && A.boostE <= 0) toast("Nitro leer – lädt nach");
    $nitro.lastChild.firstChild.style.width = Math.round(A.boostE * 100) + "%"; $nitro.className = boosting ? "on" : A.boostE <= 0 ? "lock" : A.boostE < 1 ? "load" : ""; }   // Leiste wie im Spiel
  $nitro.hidden = !s.boost;
  if (boosting && A.v < vmax + 40 / 3.6) A.v = Math.min(vmax + 40 / 3.6, A.v + 80 * dt);
  if (s.jump && tap && !A.air && A.v >= 14) { A.air = true; A.vy = 7.5; A.v += A.jetM ? 6 : 3; A.jet = 0.9; toast("Sprung!"); if (A.jetM && typeof engineJet === "function") engineJet(); }
  if (A.air) { A.vy -= 14 * dt; A.y += A.vy * dt; const tp = Math.max(-0.12, Math.min(0.2, Math.atan2(A.vy, Math.max(8, Math.abs(A.v))) * 0.4)); A.pitch += (tp - A.pitch) * Math.min(1, dt * 2);
    if (A.y <= 0) { A.y = 0; A.vy = 0; A.air = false; } }
  else A.pitch += (0 - A.pitch) * Math.min(1, dt * 10);
  if (A.jetM) { A.jet = Math.max(0, A.jet - dt); A.jetM.emissiveIntensity = Math.min(2.5, A.jet * 4); }
  if (A.flame) { const k = A.boostOn ? 0.85 + 0.3 * Math.random() : Math.min(1, A.jet * 2); A.flame.visible = k > 0.02; A.flame.scale.set(0.8 + 0.3 * k, 0.8 + 0.3 * k, k); }
  A.v -= Math.sign(A.v) * Math.min(Math.abs(A.v), KP.dec * dt);                                   // Kurvenwiderstand / Radieren
  A.v = Math.max(th < 0 ? -(s.revMax || 8) : -16, Math.min(vmax + (boosting ? 40 / 3.6 : 0) + (A.air ? 6 : 0), A.v));
  A.x -= Math.sin(A.h) * A.v * dt; A.z -= Math.cos(A.h) * A.v * dt;   // vorne = -z im Modell
  if (s.push && schieben(A)) A.v *= Math.max(0, 1 - dt * 1.2);           // Schaufel schiebt Zielfahrzeuge (wie vehPushStep in fahren.js)
  const lim = 580; A.x = Math.max(-lim, Math.min(lim, A.x)); A.z = Math.max(-lim, Math.min(lim, A.z));
  A.lean += ((s.track ? 0 : A.steer * Math.min(1, Math.abs(A.v) / 6) * 0.9) - A.lean) * Math.min(1, dt * 5);   // Zweirad legt sich in die Kurve (wie fahren.js)
  if (A.beacon) { const t = performance.now() / 1000 * 6, on = Math.sin(t) > 0; A.beacon[0].emissiveIntensity = 0.2 + 2.4 * (on ? 1 : 0); A.beacon[1].emissiveIntensity = 0.2 + 2.4 * (on ? 0 : 1); }   // Blinklicht beim Fahren (wie fahren.js)
  for (const w of A.wheels) { w.spin.rotation.x -= A.v * dt / w.r * (1 - (A.fold || 0)); if (w.front) w.piv.rotation.y = A.steer; }
  setze();
  $speed.textContent = Math.round(Math.abs(A.v) * 3.6) + " km/h";
  folgeKamera(A, s, dt);
  if (A.turret) waffe(dt);
  if (A.monitor && A.wz) { wasserZoomStep(dt); const ws = $("wsicht");   // Wasserwerfer-Ziel und Zoom wie schiessen.js
    const imp = wasserZiel(A.wz.tip, kYaw, A.wz.el, () => 0); if (A_view !== 1) monitorCamera(A.monitor, imp, dt); wasserZielZeigen(ws, imp); if (!A.wz.ready) ws.hidden = true;   // Ring nur bei ausgefahrenem Arm   // Kamera oben auf dem Arm
    ws.lastChild.textContent = (down("Space") ? (A.wz.ready ? "Wasser" : "Arm fährt aus …") : "Leertaste: Wasser") + (WZOOM.t > 1 ? " · " + WZOOM.t.toFixed(1).replace(".", ",") + "x" : " · Mausrad: Zoom"); }
}
const wrapW = a => Math.atan2(Math.sin(a), Math.cos(a));

// ---------- Schiessen (Modelle mit Turm): Visier auf 36 % der Bildhoehe wie im Spiel, Granate 320 m/s gerade zum Zielpunkt ----------
const SCHUSS = { cd: 0, RELOAD: 2.2, V: 320, MUZZLE: 4.75, shells: [], fx: [], treffer: 0, schuesse: 0, rueck: 0 };
const rc = new THREE.Raycaster(), vA = new THREE.Vector3(), vB = new THREE.Vector3();
const fxGeo = new THREE.SphereGeometry(1, 12, 8), fxMat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, fog: false });
function zielpunkt() {   // Strahl durch das Visier: erste Scheibe oder der Boden, sonst 900 m voraus
  rc.setFromCamera(new THREE.Vector2(0, 0.28), camera);
  let best = 900; const o = rc.ray.origin, dv = rc.ray.direction;
  if (dv.y < -1e-4) best = Math.min(best, -o.y / dv.y);
  for (let t = 6; t < best; t += 1) { const q = o.clone().addScaledVector(dv, t); if (autoAn(q.x, q.y, q.z)) { best = t; break; } }   // Zielfahrzeuge
  for (const Z of ZIELE) { if (Z.fall > 0.05) continue; vA.set(Z.x, Z.y, Z.z); const t = vA.sub(o).dot(dv); if (t > 0 && t < best && o.clone().addScaledVector(dv, t).distanceTo(new THREE.Vector3(Z.x, Z.y, Z.z)) < Z.r) best = t; }
  return o.clone().addScaledVector(dv, best);
}
function waffe(dt) {   // wie schiessen.js: Turm zeigt in Blickrichtung, das Rohr hebt/senkt sich zum Zielpunkt im Visier
  // Zielen immer mit der normalen Kamera bei 70 Grad: der Zoom aendert nur das Bild, nicht wohin das Visier zeigt (Nicolas 2026-11-12)
  if (camera.fov !== 70) { camera.fov = 70; camera.updateProjectionMatrix(); }
  camera.updateMatrixWorld();
  const A = AKT, aim = zielpunkt(); A.aim = aim;
  // Turm und Rohr laufen dem Visier nach (wie fahren.js/schiessen.js, Variante A zum Testen): Turm spec.turretSpeed, Rohr spec.gunSpeed Grad/s
  A.g.updateMatrixWorld(true); A.turret.getWorldPosition(vA); A.gun.getWorldPosition(vB);
  A.tw = A.tw ?? A.h; const tv = (A.spec.turretSpeed || 40) * Math.PI / 180 * dt, gv = (A.spec.gunSpeed || 20) * Math.PI / 180 * dt;
  A.tw += Math.max(-tv, Math.min(tv, wrapW(Math.atan2(-(aim.x - vA.x), -(aim.z - vA.z)) - A.tw)));
  A.elev = A.elev ?? 0; A.elev += Math.max(-gv, Math.min(gv, Math.max(-0.4, Math.min(0.55, Math.atan2(aim.y - vB.y, Math.hypot(aim.x - vB.x, aim.z - vB.z)))) - A.elev));
  A.turret.rotation.y = wrapW(A.tw - A.h);
  const ad = (((A.turret.rotation.y * 180 / Math.PI) % 360) + 360) % 360, a0 = Math.floor(ad) % 360, fr = ad - Math.floor(ad), lo = A.gunMin ? A.gunMin[a0] * (1 - fr) + A.gunMin[(a0 + 1) % 360] * fr : -0.45;
  A.gun.rotation.x = Math.max(lo, Math.min(0.6, A.elev));
  // Zoom: ab mehr als 1x sitzt die Kamera in der Zieloptik oben am Turm; nach einem Schuss nach 0,35 s zurueck auf 1x (wie im Spiel, dort TEST)
  if (ZOOM.un > 0 && (ZOOM.un -= dt) <= 0) ZOOM.t = 1;
  ZOOM.z += (ZOOM.t - ZOOM.z) * Math.min(1, dt * 10); const fov = 70 / ZOOM.z; if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  // gezoomt (wie schiessen.js): Kamera auf dem Visier-Strahl der normalen Kamera neben der Zieloptik am Turm, Blick entlang des Strahls,
  // um den Visier-Winkel gesenkt: Visier zeigt wie ohne Zoom, Ansicht unabhaengig von der Zielentfernung (keine Parallaxe)
  if (ZOOM.z > 1.01) { A.turret.updateWorldMatrix(true, false); A.turret.localToWorld(vA.set(0.52, 1.25, -0.9));
    const o = rc.ray.origin, d = rc.ray.direction, t = Math.max(0, vA.sub(o).dot(d)); camera.position.copy(o).addScaledVector(d, t);
    camera.up.set(0, 1, 0); camera.lookAt(camera.position.clone().add(d)); camera.rotateX(-Math.atan(0.28 * Math.tan(fov * Math.PI / 360))); }
  SCHUSS.cd = Math.max(0, SCHUSS.cd - dt);
  if (down("Space") && SCHUSS.cd === 0) {
    SCHUSS.cd = SCHUSS.RELOAD; SCHUSS.schuesse++; SCHUSS.rueck = 1;
    A.gun.updateWorldMatrix(true, false); A.gun.getWorldPosition(vB); const mz = A.gun.localToWorld(new THREE.Vector3(0, 0, -(A.spec.muzzle || SCHUSS.MUZZLE))), dir = mz.clone().sub(vB).normalize();   // entlang des Rohrs
    const o = new THREE.Mesh(fxGeo, fxMat(0xffe2a0)); o.scale.set(0.12, 0.12, 0.5); o.position.copy(mz); o.lookAt(mz.clone().add(dir)); scene.add(o);
    SCHUSS.shells.push({ o, p: mz.clone(), dir, s: 0 });
    fx(mz, 0xffc070, 0.6, 0.12, 4); knall(0.5); if (ZOOM.t > 1) ZOOM.un = 0.35;
  }
  rohrMarke(A, aim);
  SCHUSS.rueck = Math.max(0, SCHUSS.rueck - dt * 2.5); A.gun.position.z = A.gun.userData.z0 + Math.sin(Math.min(1, SCHUSS.rueck) * Math.PI / 2) * 0.45;
  $("visier-t").textContent = (SCHUSS.cd > 0 ? "lädt … " + SCHUSS.cd.toFixed(1).replace(".", ",") + " s" : "Leertaste: schießen") + ` · Treffer ${SCHUSS.treffer} / ${SCHUSS.schuesse}` + (ZOOM.t > 1 ? " · " + ZOOM.t.toFixed(1).replace(".", ",") + "x" : " · Mausrad: Zoom");
}
// Rohr-Markierung (wie gunMark in schiessen.js): Punkt entlang des Rohrs in Zielentfernung, sichtbar ab 10 px neben der Visiermitte
function rohrMarke(A, aim) {
  const el = $("rohr"); A.gun.updateWorldMatrix(true, false); A.gun.getWorldPosition(vB);
  const mz = A.gun.localToWorld(new THREE.Vector3(0, 0, -(A.spec.muzzle || SCHUSS.MUZZLE))), dir = mz.clone().sub(vB).normalize(), p = mz.addScaledVector(dir, Math.max(5, aim.distanceTo(mz)));
  camera.updateMatrixWorld(); p.project(camera);
  const x = (p.x + 1) / 2 * innerWidth, y = (1 - p.y) / 2 * innerHeight, sy = (1 - 0.28) / 2 * innerHeight;
  el.hidden = p.z > 1 || Math.hypot(x - innerWidth / 2, y - sy) < 10; el.style.left = x + "px"; el.style.top = y + "px";
}
function fx(p, c, r, life, grow) { const o = new THREE.Mesh(fxGeo, fxMat(c)); o.position.copy(p); o.scale.setScalar(r); scene.add(o); SCHUSS.fx.push({ o, r, life, grow, t: 0 }); }
function schuesseStep(dt) {
  for (let i = SCHUSS.shells.length - 1; i >= 0; i--) {
    const S = SCHUSS.shells[i], weg = SCHUSS.V * dt; let hit = null;
    for (let s = 0; s < weg && !hit; s += 0.5) {
      const p = S.p.clone().addScaledVector(S.dir, s);
      if (p.y <= 0) hit = { p };
      for (const Z of ZIELE) if (Z.fall < 0.05 && Math.hypot(p.x - Z.x, p.y - Z.y, p.z - Z.z) < Z.r + 0.15) { hit = { p, Z }; break; }
      if (!hit && S.s + s > 3) { const v = autoAn(p.x, p.y, p.z); if (v) hit = { p, v }; }
    }
    S.p.addScaledVector(S.dir, weg); S.s += weg; S.o.position.copy(S.p);
    if (hit || S.s > 900) {
      scene.remove(S.o); S.o.material.dispose(); SCHUSS.shells.splice(i, 1);
      if (hit) { fx(hit.p, 0xffa040, 0.8, 0.35, 5); fx(hit.p, 0x8a8780, 0.6, 1.4, 3); knall(0.3);
        if (hit.Z) { hit.Z.fall = 0.06; hit.Z.t = 0; SCHUSS.treffer++; }
        if (hit.v) { if (!hit.v.dead) SCHUSS.treffer++; autoTreffer(hit.v, hit.p); } }
    }
  }
  for (let i = SCHUSS.fx.length - 1; i >= 0; i--) { const F = SCHUSS.fx[i]; F.t += dt; const k = F.t / F.life;
    if (k >= 1) { scene.remove(F.o); F.o.material.dispose(); SCHUSS.fx.splice(i, 1); continue; }
    F.o.scale.setScalar(F.r * (1 + F.grow * k)); F.o.material.opacity = 1 - k; }
  for (const Z of ZIELE) {   // getroffene Scheiben klappen nach hinten um und stehen nach 5 s wieder auf
    if (Z.fall <= 0) continue; Z.t += dt;
    Z.fall = Z.t < 5 ? Math.min(1, Z.fall + dt * 3) : Math.max(0, Z.fall - dt * 1.2);
    Z.kl.rotation.x = -Z.fall * Math.PI / 2 * 0.95;
  }
}
function knall(vol) {   // kurzer Knall aus gefiltertem Rauschen (Web Audio, ohne Dateien); ueber ENGINE wie im Spiel: Lautstaerke und M gelten
  if (ENGINE.muted) return;
  try { const a = ENGINE.ctx ??= new (window.AudioContext || window.webkitAudioContext)(); if (a.state === "suspended") a.resume(); n = a.sampleRate * 0.6, buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = buf; f.type = "lowpass"; f.frequency.setValueAtTime(1800, a.currentTime); f.frequency.exponentialRampToValueAtTime(120, a.currentTime + 0.5);
    g.gain.value = vol * 0.6; s.connect(f).connect(g).connect(engineOut(a)); s.start();
    const o = a.createOscillator(), og = a.createGain(), t = a.currentTime; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.5); og.gain.setValueAtTime(vol * 1.2, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(og).connect(engineOut(a)); o.start(t); o.stop(t + 0.6); } catch (e) {}   // tiefer Schlag wie shotSound
}

// ---------- Schleife ----------
function groesse() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize", groesse);
let last = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  if (AKT) {
    const F = AKT.F;
    if (AKT.flug) {   // Jet / The Bat: Schritt, Kamera und Ton aus dem Spiel; Anzeige aus dessen Tempo-Text
      if (modus === "drive" && F.on) { if (F === JET) jetStep(dt); else flyStep(dt); $speed.textContent = speedEl.textContent; }
      else { if (modus === "spin") { F.h += dt * 0.5; if (F === JET) jetPose(F, dt); else batPose(F, dt); } controls.update(); }
    } else if (modus === "drive") fahren(dt);
    else { if (modus === "spin") { AKT.h += dt * 0.5; setze(); } controls.update(); }
    const px = F ? F.x : AKT.x, pz = F ? F.z : AKT.z, py = F ? Math.max(0, F.y - 10) : 0;
    sunFollow(new THREE.Vector3(px, py, pz), 100);   // in ganzen Schatten-Texeln (basis.js, gegen Flimmern beim schnellen Fahren)
  }
  zielGruppe.visible = !!(AKT && AKT.turret); feuerStep(dt);   // Zielscheiben nur im Panzer, Feuer nur mit Loeschfahrzeug
  schuesseStep(dt); autosStep(dt);
  wasserStep(dt, () => 0, p => {   // Wasser: Zielscheiben kippen um, brennende Wracks sind geloescht
    for (const F of FEUER) if (feuerGruppe.visible && F.k > 0 && Math.hypot(p.x - F.x, p.z - F.z) < 2.2 && p.y < 3.5) { F.k = Math.max(0, F.k - 0.004); if (F.k === 0) { F.t = 0; toast("Feuer gelöscht"); } return true; }
    for (const Z of ZIELE) if (zielGruppe.visible && Z.fall < 0.05 && Math.hypot(p.x - Z.x, p.y - Z.y, p.z - Z.z) < Z.r + 0.2) { Z.fall = 0.06; Z.t = 0; return true; }
    for (const v of ZIELAUTOS) if (v.dead && Math.hypot(p.x - v.x, p.z - v.z) < 3 && p.y < 4) { if (v.t < 14) { v.t = 14; toast(v.name + ": Feuer gelöscht"); } return true; }
    return false; });
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
groesse();
let start = 0; try { start = Math.min(MODELLE.length - 1, Math.max(0, +localStorage.getItem("werkstatt-modell") || 0)); } catch (e) {}
pick.value = start; laden(start);
requestAnimationFrame(loop);
