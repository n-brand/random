// Batverse – Gotham: geparkte Autos zum Fahren und Zerstoeren, Stellplaetze mit P, Granate gegen Automaten und Tresore
// (Nicolas 2026-11-23: "In allen Parkhaeusern soll es Autos haben, die man fahren kann, zerstoeren kann etc. und auch bei Parkplaetzen ... und man soll auch bei all
// diesen Parkplaetzen die Moeglichkeit haben zu parken mit dem P-Symbol"; "mit einer Granate will ich auch Automaten, Tresore und Fahrzeuge zerstoeren koennen").
// Klassisches Skript nach ui/handy.js (braucht addVehicle, HANDY_CAT, VEH).
//
// Geparkte Autos (GPA.slots): gpaSlot(x, y, z, h, art, farbe, ort) legt einen Platz mit Auto an. Von weitem steht dort ein einfaches Instanz-Auto (gpaLod, wenig Kosten);
// naeher als GPA.R_IN (26 m, gleiche Ebene +-3 m) am Spieler bzw. aktiven Fahrzeug wird daraus ein echtes Fahrzeug (addVehicle, in VEH: einsteigen, fahren, beschiessen,
// Granate, Wrack). Weiter weg als GPA.R_OUT und unbenutzt kommt es wieder aus VEH heraus (Modell bleibt im Speicher und wird beim naechsten Mal wiederverwendet).
// Wer ein Parkauto faehrt, verschiebt oder zerstoert, "nimmt" es: dann bleibt es ein normales Fahrzeug in VEH (Platz bleibt leer). Je Bild hoechstens ein Aufbau.
// Parkautos stehen nicht im T-Menue (v.park), solange sie nicht genommen sind.
//
// Stellplaetze (GPA.bays): gpaBay(x, y, z, h, w, d, name) - im Fahrzeug auf einen freien Platz zielen zeigt das blaue P (wie in der Manor-Tiefgarage, kern/tore.js),
// Rechtsklick stellt das Fahrzeug hinein (h = Fahrtrichtung beim Einparken, vorne = (-sin h, -cos h)).
"use strict";
const GPA = { slots: [], bays: [], R_IN: 26, R_OUT: 42, DY: 3, t: 0, lods: [], built: 0,
  ARTEN: ["gclass", "gclass", "rolls", "rolls", "nachtfalke", "nachtfalke", "taxi", "aventador", "delorean", "bike"],   // ohne Spectre: Aufbau ca. 47 ms (Taxi 10, DeLorean 13, sonst 1-2 ms)
  FARBEN: [0x8c1c1c, 0x1c3f8c, 0xd0d0d0, 0x222222, 0x3d6b3d, 0x9a9a9a, 0xc7a83a, 0x5a2a6a, 0x17191c, 0xe8e8e8] };
// Zufall je Platz (fest, aus der Lage)
const gpaRnd = (x, z, k = 0) => { const s = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453; return s - Math.floor(s); };
function gpaSlot(x, y, z, h, art, farbe, ort) {
  if (!art) art = GPA.ARTEN[Math.floor(gpaRnd(x, z) * GPA.ARTEN.length)];
  const K = typeof HANDY_CAT !== "undefined" && HANDY_CAT[art]; if (!K) return null;
  if (farbe == null) farbe = K.cols.length ? K.cols[Math.floor(gpaRnd(x, z, 1) * K.cols.length)] : 0x16181b;
  const S = { x, y, z, h, art, farbe, ort: ort || "Parkplatz", v: null, cache: null, claimed: false, lod: null, li: -1 }; GPA.slots.push(S); return S;
}
// Fernansicht: je Gruppe von Plaetzen ein Instanz-Netz (Karosserie + Kabine, Farbe je Platz)
function gpaLod(slots, name = "Parkautos") {
  slots = slots.filter(Boolean); if (!slots.length) return null;
  const body = new THREE.BoxGeometry(1.8, 0.75, 4.3), cab = new THREE.BoxGeometry(1.6, 0.6, 2.2); body.translate(0, 0.55, 0); cab.translate(0, 1.2, 0.2);
  const ib = new THREE.InstancedMesh(body, new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.4 }), slots.length), ic = new THREE.InstancedMesh(cab, new THREE.MeshStandardMaterial({ color: 0x1a222c, roughness: 0.15, metalness: 0.6 }), slots.length);
  const L = { ib, ic, slots }; slots.forEach((S, i) => { S.lod = L; S.li = i; gpaLodSet(S, true); ib.setColorAt(i, new THREE.Color(S.farbe)); });
  ib.castShadow = ic.castShadow = true; ib.name = name; ic.name = name + " Kabine"; ib.userData.noLift = ic.userData.noLift = true; scene.add(ib, ic); GPA.lods.push(L); return L;
}
const GPA_M4 = new THREE.Matrix4(), GPA_Q = new THREE.Quaternion(), GPA_UP = new THREE.Vector3(0, 1, 0), GPA_P = new THREE.Vector3(), GPA_S1 = new THREE.Vector3(1, 1, 1), GPA_S0 = new THREE.Vector3(0, 0, 0);
function gpaLodSet(S, show) { const L = S.lod; if (!L) return; GPA_Q.setFromAxisAngle(GPA_UP, S.h); GPA_P.set(S.x, S.y, S.z); GPA_M4.compose(GPA_P, GPA_Q, show ? GPA_S1 : GPA_S0);
  L.ib.setMatrixAt(S.li, GPA_M4); L.ic.setMatrixAt(S.li, GPA_M4); L.ib.instanceMatrix.needsUpdate = L.ic.instanceMatrix.needsUpdate = true; }
// echtes Fahrzeug an den Platz holen bzw. wieder einpacken
function gpaReal(S) {
  let C = S.cache;
  if (C) { Object.assign(C, { x: S.x, y: S.y, z: S.z, h: S.h, v: 0, vy: 0, air: false, settled: false, steer: 0 }); C.home = { x: S.x, z: S.z, y: S.y, h: S.h }; VEH.push(C); scene.add(C.g); C.g.visible = true; }
  else { const K = HANDY_CAT[S.art]; C = addVehicle(K.spec(), K.build(S.farbe), S.x, S.z, S.y, S.h, K.art + " (" + S.ort + ")", S.farbe); C.idx = GPA.built++; }
  C.park = S; S.v = C; S.cache = null; gpaLodSet(S, false); return C;
}
function gpaPack(S) { const C = S.v, i = VEH.indexOf(C); if (i >= 0) VEH.splice(i, 1); scene.remove(C.g); S.cache = C; S.v = null; gpaLodSet(S, true); }
function gpaRef() { if (typeof CAR !== "undefined" && CAR && CAR.on) return CAR; if (typeof walking !== "undefined" && walking && typeof player !== "undefined") return player.pos; return camera.position; }
function gpaStep() {
  if (!GPA.slots.length) return;
  const R = gpaRef(), rx = R.x, ry = R.y, rz = R.z; let built = false;
  for (const S of GPA.slots) {
    if (S.claimed) continue;
    const C = S.v;
    if (C) {
      if (C.on || C.dead || C.towBy || C.windeBy || Math.hypot(C.x - S.x, C.z - S.z) > 0.8 || Math.abs(C.y - S.y) > 1.2) { S.claimed = true; C.park = null; continue; }   // genommen: bleibt ein normales Fahrzeug
      if (Math.hypot(C.x - rx, C.z - rz) > GPA.R_OUT || Math.abs(C.y - ry) > GPA.DY + 4) gpaPack(S);
      continue; }
    if (built) continue;
    const dx = S.x - rx, dz = S.z - rz; if (dx * dx + dz * dz > GPA.R_IN * GPA.R_IN || Math.abs(S.y - ry) > GPA.DY) continue;
    gpaReal(S); built = true; }
}
// ---------- Stellplaetze mit P ----------
function gpaBay(x, y, z, h, w = 2.6, d = 5, name = "Stellplatz") { const B = { x, y, z, h, w, d, name, n: name }; GPA.bays.push(B); return B; }
// Punkt in einem Platz? (Laenge d entlang der Fahrtrichtung, Breite w quer)
function gpaInBay(B, x, z, m = 0) { const fx = -Math.sin(B.h), fz = -Math.cos(B.h), dx = x - B.x, dz = z - B.z, a = dx * fx + dz * fz, b = dx * fz - dz * fx; return Math.abs(a) < B.d / 2 + m && Math.abs(b) < B.w / 2 + m; }
function gpaBayFree(B, me) {
  if (VEH.some(v => v !== me && !v.dead && Math.abs(v.y - B.y) < 2 && gpaInBay(B, v.x, v.z, 0.3))) return false;
  return !GPA.slots.some(S => !S.claimed && !S.v && Math.abs(S.y - B.y) < 1.5 && gpaInBay(B, S.x, S.z, 0.3));   // eingepacktes Parkauto steht noch dort
}
const GPA_RAY = new THREE.Raycaster(), GPA_PL = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), GPA_PT = new THREE.Vector3();
function gpaFindBay(C, mouse) {
  if (!C || !C.on || !GPA.bays.length) return null;
  GPA_RAY.setFromCamera(mouse, camera); let best = null;
  for (const yl of [...new Set(GPA.bays.filter(B => Math.abs(B.y - C.y) < 2.2 && Math.hypot(B.x - C.x, B.z - C.z) < 60).map(B => Math.round(B.y * 4) / 4))]) {
    GPA_PL.constant = -yl; if (!GPA_RAY.ray.intersectPlane(GPA_PL, GPA_PT) || GPA_PT.distanceTo(camera.position) > 45) continue;
    for (const B of GPA.bays) if (Math.abs(B.y - yl) < 0.3 && gpaInBay(B, GPA_PT.x, GPA_PT.z)) { best = B; break; }
    if (best) break; }
  return best && gpaBayFree(best, C) ? best : null;
}
// ---------- Granate: Automaten und Tresore (Fahrzeuge macht waffen.js ueber vehHit, Bankautomaten ueber atmShot) ----------
// zerstAdd({ name, g }) = Gruppe (Jeton-Automat, Spiel-Automaten), oder { name, im: [InstancedMesh...], i, at: () => Vector3 } fuer Instanzen (Spielautomaten im Casino).
const ZERST = { list: [], burn: null };
function zerstAdd(o) { o.dead = false; ZERST.list.push(o); return o; }
function zerstPos(o) { if (o.at) return o.at(); const v = new THREE.Vector3(); o.g.getWorldPosition(v); return v; }
function zerstKill(o, p) {
  if (o.dead) return; o.dead = true;
  const burn = m => { const c = m.clone(); if (c.color) c.color.lerp(new THREE.Color(0x1b1815), 0.85); if (c.emissive) c.emissive.set(0); if ("emissiveIntensity" in c) c.emissiveIntensity = 0; if (c.map && !c.transparent) c.map = null; return c; };
  if (o.g) { o.g.traverse(q => { if (q.isMesh) q.material = Array.isArray(q.material) ? q.material.map(burn) : burn(q.material); }); o.g.rotation.z += (gpaRnd(p.x, p.z) - 0.5) * 0.25; o.g.userData.kaputt = true; }
  if (o.im) { const M = new THREE.Matrix4(), O = new THREE.Matrix4().makeScale(0, 0, 0);   // Instanz ausblenden, Wrack hinstellen
    for (const im of o.im) { const k = im.userData.scr >= 0 ? (o.i % 3 === im.userData.scr ? Math.floor(o.i / 3) : -1) : o.i; if (k < 0 || k >= im.count) continue; im.getMatrixAt(k, M); im.setMatrixAt(k, O); im.instanceMatrix.needsUpdate = true; }
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.5, 0.7), ZERST.burn || (ZERST.burn = new THREE.MeshStandardMaterial({ color: 0x1b1815, roughness: 1 }))), q = o.at(); w.position.set(q.x, q.y + 0.7, q.z); w.rotation.set(0.12, gpaRnd(q.x, q.z) * 6, 0.18); scene.add(w); }
  if (typeof aimSmoke === "function") aimSmoke(zerstPos(o));
  if (typeof toast === "function") toast((o.name || "Automat") + " zerstört");
  if (typeof akteEintrag === "function") akteEintrag((o.name || "Automat") + " gesprengt (Sachbeschädigung)", "Fahndung +1", 1);
}
// aus granateStep (waffen.js): alles im Umkreis
function zerstBoom(p) {
  for (const o of ZERST.list) { if (o.dead) continue; const q = zerstPos(o); if (Math.hypot(q.x - p.x, q.z - p.z) < 3.5 && Math.abs(q.y + 1 - p.y) < 3) zerstKill(o, p); }
  if (typeof TRESOR !== "undefined" && typeof tresorBreak === "function") for (const T of TRESOR.list) { if (T.broken || !T.g) continue; const q = new THREE.Vector3(); T.g.getWorldPosition(q);   // Tresore Stufe 1-4: Tuer fliegt auf; Batman-Tresor (5) haelt
    if (Math.hypot(q.x - p.x, q.z - p.z) > 3 || Math.abs(q.y - p.y) > 3) continue;
    if (T.stufe >= 5) { if (typeof toast === "function") toast(TRESOR_STUFEN[T.stufe].name + " hält der Granate stand"); continue; }
    tresorBreak(T, "spreng"); }
}
// je Bild (schleife.js)
function gpaFrame(dt) { gpaStep(); }
