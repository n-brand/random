// Batverse – S2 Zielen und Waffen zu Fuss (PLAN-GOTHAM Phase 9, Nicolas 2026-11-16 "Ja, S2").
// Waffe = Gegenstand der Art "Waffe" im gewaehlten Hotbar-Platz (inventar.js): Batarang, Rauchbombe, Greifhaken.
// Rechte Maustaste halten = zielen (Ansicht zoomt 1,8-fach, Zielkreis, Maus feiner). Mit Waffe in der Hand oeffnet Rechtsklick keine Tore und
// steigt nicht ein (zum Bedienen einen leeren Platz oder ein anderes Werkzeug waehlen). Linksklick bei gefangener Maus = Waffe benutzen.
// Handy: Knoepfe "Zielen" (an/aus) und "Werfen" bzw. "Haken". Treffer ueber shotAt/shotSeg (fahrzeuge/schiessen.js).
"use strict";
const AIM = { on: false, z: 1, cd: 0, proj: [], smoke: [], grap: null };
const weaponHeld = () => { const id = typeof invHeld === "function" ? invHeld() : null; return id && INV_ITEMS[id].art === "Waffe" ? id : null; };
const onFoot = () => walking && !ghost && !document.body.classList.contains("drive");
const aimK = () => AIM.z;
const AIM_V = new THREE.Vector3(), AIM_D = new THREE.Vector3(), AIM_ray = new THREE.Raycaster();
// Modelle: Batarang (flach, schwarz), Rauchbombe (Kugel), Rauch (weiche Sprites), Seil
const AIM_M = (() => {
  // Batarang neu (Nicolas 2026-11-16 "ueberarbeiten"): 34 cm Spannweite, abgeschraegte Kanten,
  // dunkles Metall mit Kante in Stahl (zwei Materialien: Flaechen / Seiten). Halbe Kontur rechts (x >= 0, y nach vorne), gespiegelt.
  // Form genau wie die Fledermaus des Batsignals (BAT_SIGNAL_PTS, gotham-polizei.js; Nicolas 2026-11-16), Canvas-y nach unten -> Form-y nach vorne
  // Form und Farbe wie die Metall-Batarangs im Film (BATARANG_PTS, inventar.js; Nicolas 2026-11-17): gebuerstetes champagnerfarbenes Metall, hellere Fase
  // Spitzen spitz und sauber (Nicolas 2026-11-17: "die Kanten an den Spitzen aussen sind nicht clean", "Spitzen sollen spitz sein", Bild: Oberkante und Fasenlinie parallel, Spitze schraeg nach oben):
  // eigene Fase statt ExtrudeGeometry-bevel (der kappt die Gehrung an spitzen Ecken -> Zacken). Innenlinie der Fase mit voller Gehrung, darum laeuft die Fase genau in die Spitze.
  // Haken und Unterkante als weiche Kurve (SplineCurve). Gruppe 0 = Flaechen oben/unten, Gruppe 1 = Fase und Rand.
  const S = 0.17, P = (() => { const B = BATARANG_PTS, it = B.findIndex(p => p[0] >= 1), ic = B.findIndex((p, i) => i > it && p[1] >= 0.35), V = (x, y) => new THREE.Vector2(x, y);
    const hook = new THREE.SplineCurve(B.slice(it, ic + 1).map(([x, y]) => V(x, y))).getPoints(28), low = new THREE.SplineCurve(B.slice(ic).map(([x, y]) => V(x, y))).getPoints(30);
    return [...B.slice(0, it), ...hook.map(v => [v.x, v.y]), ...low.slice(1).map(v => [v.x, v.y])]; })();
  const bat = (() => { const O = P.map(([x, y]) => [x * S, -y * S]); for (let i = P.length - 2; i > 0; i--) O.push([-P[i][0] * S, -P[i][1] * S]);
    let ar = 0; O.forEach((p, i) => { const q = O[(i + 1) % O.length]; ar += p[0] * q[1] - q[0] * p[1]; }); if (ar < 0) O.reverse();   // gegen den Uhrzeigersinn
    const n = O.length, d = 0.0045, nrm = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };   // Normale nach aussen
    const segD = (q, A, Bq) => { const ex = Bq[0] - A[0], ey = Bq[1] - A[1], t = Math.max(0, Math.min(1, ((q[0] - A[0]) * ex + (q[1] - A[1]) * ey) / (ex * ex + ey * ey || 1))); return Math.hypot(q[0] - A[0] - ex * t, q[1] - A[1] - ey * t); };
    // Innenlinie der Fase: Mittelpunkt des Kreises (Radius r <= d), der beide Nachbarkanten beruehrt und keine andere Kante schneidet. In schmalen Stellen (Spitzen) liegt sie damit
    // genau auf der Mittellinie: die Fasen beider Seiten treffen sich als Grat und laufen sauber in die Spitze.
    const I = O.map((p, i) => { const n1 = nrm(O[(i + n - 1) % n], p), n2 = nrm(p, O[(i + 1) % n]), sx = n1[0] + n2[0], sy = n1[1] + n2[1], l = Math.hypot(sx, sy); if (l < 1e-6) return p.slice();
      const u = [-sx / l, -sy / l], c = Math.sqrt(Math.max((1 + n1[0] * n2[0] + n1[1] * n2[1]) / 2, 1e-6)), ctr = r => [p[0] + u[0] * r / c, p[1] + u[1] * r / c];
      const ok = r => { const q = ctr(r); for (let e = 0; e < n; e++) { if (e === i || (e + 1) % n === i) continue; if (segD(q, O[e], O[(e + 1) % n]) < r * 0.999) return false; } return true; };
      let lo = 0, hi = d; if (ok(d)) lo = d; else for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; } return ctr(lo); });
    const zB = -0.0035, z0 = -0.0005, z1 = 0.0035, zT = 0.0065, pos = [], tri = ShapeUtils_tri(I);
    function ShapeUtils_tri(pts) { return THREE.ShapeUtils.triangulateShape(pts.map(([x, y]) => new THREE.Vector2(x, y)), []); }
    const T = (A, Bp, C) => pos.push(...A, ...Bp, ...C);
    for (const [i, j, k] of tri) { T([...I[i], zT], [...I[j], zT], [...I[k], zT]); T([...I[i], zB], [...I[k], zB], [...I[j], zB]); }   // oben, unten
    const g0 = pos.length / 3;
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, oi = O[i], oj = O[j], ii = I[i], ij = I[j];
      T([...oi, z1], [...oj, z1], [...ij, zT]); T([...oi, z1], [...ij, zT], [...ii, zT]);   // Fase oben
      T([...oi, z0], [...oj, z0], [...oj, z1]); T([...oi, z0], [...oj, z1], [...oi, z1]);   // Rand
      T([...oi, z0], [...ii, zB], [...ij, zB]); T([...oi, z0], [...ij, zB], [...oj, z0]); }   // Fase unten
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); g.addGroup(0, g0, 0); g.addGroup(g0, pos.length / 3 - g0, 1);
    g.rotateX(-Math.PI / 2); return g; })();
  const smokeT = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, "rgba(200,200,205,0.9)"); g.addColorStop(0.6, "rgba(170,172,178,0.45)"); g.addColorStop(1, "rgba(150,150,155,0)"); c.fillStyle = g; c.fillRect(0, 0, w, w); });
  const rope = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x222222 })); rope.visible = false; rope.frustumCulled = false; scene.add(rope);
  return { bat, batM: [new THREE.MeshStandardMaterial({ color: 0xbdb4a2, metalness: 0.85, roughness: 0.34 }), new THREE.MeshStandardMaterial({ color: 0xe6e0d2, metalness: 0.9, roughness: 0.2 })], bomb: new THREE.SphereGeometry(0.09, 10, 8), bombM: new THREE.MeshStandardMaterial({ color: 0x4a4e55, roughness: 0.6 }), smokeT, rope };
})();
// Blickstrahl aus der Bildmitte: erster Treffer bis max m -> { p, hit } oder null
function aimHit(max) { AIM_ray.setFromCamera({ x: 0, y: 0 }, camera); const o = AIM_ray.ray.origin, d = AIM_ray.ray.direction, a = o.clone().addScaledVector(d, 0.6), b = new THREE.Vector3();
  for (let s = 0.6; s < max; s += 3) { b.copy(o).addScaledVector(d, Math.min(max, s + 3)); const h = shotSeg(a, b, null, 0.25); if (h) return h; a.copy(b); } return null; }
function weaponUse() {
  const id = weaponHeld(); if (id && typeof GUN_SPEC !== "undefined" && GUN_SPEC[id]) { if (onFoot() && !AIM.grap) gunTrigger(true); return; }   // Schusswaffen (schusswaffen.js)
  if (!id || !onFoot() || AIM.cd > 0 || AIM.grap) return;
  AIM_ray.setFromCamera({ x: 0, y: 0 }, camera); const d = AIM_ray.ray.direction.clone(), o = camera.position.clone().addScaledVector(d, 0.5); o.y -= 0.15;
  if (id === "batarang" || id === "rauchbombe") {
    if (!invTake(id, 1)) return; AIM.cd = 0.35; const bat = id === "batarang", m = new THREE.Mesh(bat ? AIM_M.bat : AIM_M.bomb, bat ? AIM_M.batM : AIM_M.bombM);
    m.position.copy(o); if (bat) m.position.addScaledVector(new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw)), 0.25);   // aus der rechten Hand
    m.userData.dynamic = true; scene.add(m); const v = d.clone().multiplyScalar(bat ? 30 : 17); if (!bat) v.y += 3.5;
    // Batarang als Bumerang: fliegt hinaus (beim Zielen gerade bis zum Zielpunkt, sonst im Linksbogen ca. 22 m), kehrt dann in die Hand zurueck
    const ah = bat && AIM.on ? aimHit(45) : null, tgt = bat && AIM.on ? (ah?.p || o.clone().addScaledVector(d, 45)) : null;   // trifft das Ziel eine Flaeche: weiter bis zum Aufprall (prallt ab)
    if (bat && !tgt) { const a = 0.65, ca = Math.cos(a), sa = Math.sin(a), vx = v.x, vz = v.z; v.x = vx * ca - vz * sa; v.z = vx * sa + vz * ca; }   // ohne Zielen ca. 37 Grad rechts vom Ziel los (Nicolas 2026-11-16)
    AIM.proj.push({ id, m, v, t: 0, stuck: 0, out: true, tgt, tgtHit: !!ah, range: tgt ? o.distanceTo(tgt) + (ah ? 3 : 0) : 22, o: o.clone() }); if (!invHas(id)) toast(INV_ITEMS[id].name + ": der letzte (kommt zurück)");
  } else if (id === "greifhaken") {
    AIM.cd = 0.6; const h = aimHit(70); if (!h) return toast("Greifhaken: nichts in Reichweite (70 m)");
    let to = h.p.clone(); const dir = d.clone().setY(0).normalize();
    // Decke von unten (Nicolas 2026-11-17: "mit dem Greifhaken komme ich durch die untere Decke auf die zweite Etage"): unter dem Treffer frei, darueber fest -> kein Halt
    // Probe knapp vor dem Treffer: darueber fest und geradeaus frei = Unterseite einer Decke (Fassaden: geradeaus fest)
    const pq = h.p.clone().addScaledVector(d, -0.3);
    if (d.y > 0.15 && shotAt(pq.x, pq.y + 0.45, pq.z) && !shotAt(pq.x + dir.x * 0.45, pq.y, pq.z + dir.z * 0.45)) return toast("Greifhaken: an der Decke kein Halt");
    const wand = h.hit === "solid" || shotAt(pq.x + dir.x * 0.45, pq.y, pq.z + dir.z * 0.45);   // senkrechte Flaeche voraus (auch Gebaeude-Quader, die als Boden zaehlen)
    if (wand) { const out = h.p.clone().addScaledVector(dir, -0.45); let ok = false;   // Spalte vor der Wand: muss bis zur Kante frei sein (sonst Decke/Ueberhang dazwischen)
      for (let k = 0.25; k <= 5; k += 0.25) { if (shotAt(out.x, h.p.y + k + 0.3, out.z)) break; const q = h.p.clone().addScaledVector(dir, 0.5); q.y = h.p.y + k;
        if (!shotAt(q.x, q.y + 0.3, q.z) && !shotAt(q.x, q.y + 1.5, q.z)) { to = q.addScaledVector(dir, 0.6); to.y = h.p.y + k; ok = true; break; } }   // auf die Kante hinauf (oben Platz fuer den Koerper)
      if (!ok) { to = out.clone(); to.y = Math.max(h.p.y - 1.4, player.pos.y); } }   // keine Kante: vor die Wand ziehen (danach faellt man)
    const from = player.pos.clone(), len = from.distanceTo(to); AIM.grap = { from, to, t: 0, dur: Math.max(0.35, len / 32), hit: h.p.clone() }; AIM_M.rope.visible = true; shotSound?.(0.15, 0.1);
  }
}
// Flugbahn beim Zielen mit der Rauchbombe (Nicolas 2026-11-16): gleiche Rechnung wie der Wurf (Start, 17 m/s + 3,5 m/s nach oben, Fall 9,8, shotSeg),
// Punkte alle 0,09 s bis zum Aufprall (hoechstens 4 s), Ring am Aufprallpunkt. Nur waehrend rechts gehalten wird.
const ARC = { dots: null, ring: null, M: new THREE.Matrix4(), p: new THREE.Vector3(), v: new THREE.Vector3(), b: new THREE.Vector3() };
function aimArcInit() {
  ARC.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }), 48);
  ARC.ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.48, 32), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
  ARC.ring.rotation.x = -Math.PI / 2; for (const o of [ARC.dots, ARC.ring]) { o.frustumCulled = false; o.userData.dynamic = true; o.renderOrder = 5; scene.add(o); } }
function aimArc() {
  const show = AIM.on && onFoot() && weaponHeld() === "rauchbombe" && !AIM.grap;
  if (!show) { if (ARC.dots) ARC.dots.visible = ARC.ring.visible = false; return; }
  if (!ARC.dots) aimArcInit();
  AIM_ray.setFromCamera({ x: 0, y: 0 }, camera); const d = AIM_ray.ray.direction, p = ARC.p.copy(camera.position).addScaledVector(d, 0.5), v = ARC.v.copy(d).multiplyScalar(17), b = ARC.b; p.y -= 0.15; v.y += 3.5;
  const dt = 0.03; let n = 0, hit = null;
  for (let i = 0; i < 134; i++) { v.y -= 9.8 * dt; b.copy(p).addScaledVector(v, dt); const h = shotSeg(p, b, null, 0.3); if (h) { hit = h.p; break; } p.copy(b);
    if (i % 3 === 2 && n < 48) ARC.dots.setMatrixAt(n++, ARC.M.makeTranslation(p.x, p.y, p.z)); }
  ARC.dots.count = n; ARC.dots.instanceMatrix.needsUpdate = true; ARC.dots.visible = true;
  ARC.ring.visible = !!hit; if (hit) ARC.ring.position.set(hit.x, hit.y + 0.05, hit.z); }
// je Bild aus schleife.js
function weaponsStep(dt) {
  AIM.cd = Math.max(0, AIM.cd - dt);
  const can = onFoot() && !!weaponHeld(); if (!can && AIM.on) AIM.on = false;
  const zt = AIM.on ? (typeof gunZoom === "function" ? gunZoom() : 1.8) : 1; if (Math.abs(AIM.z - zt) > 0.001 || (AIM.on && camera.fov !== 70 / AIM.z)) { AIM.z += (zt - AIM.z) * Math.min(1, dt * 12); if (Math.abs(AIM.z - zt) < 0.002) AIM.z = zt; if (onFoot()) { camera.fov = 70 / AIM.z; camera.updateProjectionMatrix(); } }
  document.body.classList.toggle("aiming", AIM.on); document.body.classList.toggle("armed", can);
  aimArc(); if (typeof gunStep === "function") gunStep(dt);
  // Wurfgeschosse
  for (let i = AIM.proj.length - 1; i >= 0; i--) { const P = AIM.proj[i]; P.t += dt;
    if (P.id === "batarang") { batarangStep(P, dt, i); continue; }
    if (P.stuck) { if ((P.stuck += dt) > 6) { scene.remove(P.m); AIM.proj.splice(i, 1); } continue; }
    P.v.y -= (P.id === "batarang" ? 2.5 : 9.8) * dt; const a = P.m.position.clone(), b = a.clone().addScaledVector(P.v, dt), h = shotSeg(a, b, null, 0.3);
    if (P.id === "batarang") P.m.rotation.y += dt * 30;
    if (h || P.t > 4) { P.m.position.copy(h ? h.p : b);
      if (P.id === "rauchbombe") { aimSmoke(P.m.position); scene.remove(P.m); AIM.proj.splice(i, 1); continue; }
      P.stuck = 0.01; if (h && h.hit && h.hit.veh) toast("Batarang trifft " + (h.hit.veh.label || "das Fahrzeug")); continue; }
    P.m.position.copy(b); }
  // Rauch
  for (let i = AIM.smoke.length - 1; i >= 0; i--) { const S = AIM.smoke[i]; S.t += dt; const k = S.t / 12;
    for (const s of S.s) { s.position.addScaledVector(s.userData.v, dt); s.userData.v.multiplyScalar(1 - dt * 0.6); const sc = 1.5 + 5 * Math.min(1, S.t / 3) * s.userData.r; s.scale.set(sc, sc, 1); s.material.opacity = Math.max(0, 0.75 * (1 - k)); }
    if (k >= 1) { for (const s of S.s) { scene.remove(s); s.material.dispose(); } AIM.smoke.splice(i, 1); } }
  // Greifhaken: Spieler fliegt am Seil zum Ziel (leichter Bogen)
  const G = AIM.grap; if (G) { G.t += dt; const u = Math.min(1, G.t / G.dur), e = u * u * (3 - 2 * u);
    player.pos.lerpVectors(G.from, G.to, e); player.pos.y += Math.sin(u * Math.PI) * Math.min(3, G.from.distanceTo(G.to) * 0.08); player.vy = 0; player.onGround = false;
    camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z);
    const pa = AIM_M.rope.geometry.attributes.position; pa.setXYZ(0, player.pos.x, player.pos.y + 1.2, player.pos.z); pa.setXYZ(1, G.hit.x, G.hit.y, G.hit.z); pa.needsUpdate = true;
    if (u >= 1 || !onFoot()) { AIM.grap = null; AIM_M.rope.visible = false; } }
}
// Batarang-Flug: hinaus, Rueckkehr (zielt auf die Hand, wird schneller), Fang = wieder im Inventar. Trifft er etwas, faellt er zu Boden
// und bleibt liegen, bis man darueber laeuft (1,6 m, aufheben). Fliegt er nach 8 s nicht heim (weit weg/verloren), faellt er herunter.
const BAT_HAND = new THREE.Vector3();
// Abprallen (Nicolas 2026-11-17: "beim Treffen eines Gebaeudes, Fahrzeugs oder Baums abprallen"): Flaechennormale durch Proben um den Treffer (frei = Richtung nach aussen),
// Geschwindigkeit spiegeln und auf 45 % daempfen, danach faellt er (Schwerkraft) und bleibt liegen. Fahrzeuge nehmen Schaden wie von einer Pistolenkugel x 2.
const BAT_DIRS = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]].map(a => new THREE.Vector3(...a));
function batBounce(P, h) { const m = P.m, vd = P.v.clone().normalize(), p = h.p.clone().addScaledVector(vd, -0.3); let n = null, best = -2;
  for (const D of BAT_DIRS) { const q = p.clone().addScaledVector(D, 0.45); if (shotAt(q.x, q.y, q.z)) continue; const k = -vd.dot(D); if (k > best) { best = k; n = D; } }
  if (!n) n = vd.clone().negate(); const vn = P.v.dot(n); if (vn < 0) P.v.addScaledVector(n, -2 * vn); P.v.multiplyScalar(0.45); m.position.copy(p).addScaledVector(n, 0.12);
  if (h.hit && h.hit.veh && typeof gunDamage === "function") gunDamage(h.hit.veh, h.p, 20);
  P.fall = true; P.out = false; if (typeof shotSound === "function") shotSound(0.05, 0.05); }
const batTurnLeft = (v, a) => { const c = Math.cos(a), s = Math.sin(a), vx = v.x, vz = v.z; v.x = vx * c + vz * s; v.z = -vx * s + vz * c; };   // von oben gesehen gegen den Uhrzeiger
function batarangStep(P, dt, i) {
  const m = P.m, hand = BAT_HAND.set(player.pos.x, player.pos.y + EYE - 0.35, player.pos.z);
  if (P.lie) { m.rotation.y += 0; if (onFoot() && Math.hypot(m.position.x - player.pos.x, m.position.z - player.pos.z) < 1.6 && Math.abs(m.position.y - player.pos.y) < 2.2) { invAdd("batarang", 1); toast("Batarang aufgehoben"); scene.remove(m); AIM.proj.splice(i, 1); } return; }
  if (P.fall) { P.v.y -= 9.8 * dt; const a = m.position.clone(), b = a.clone().addScaledVector(P.v, dt), h = shotSeg(a, b, null, 0.15);
    if (h && !P.b2 && P.v.length() > 6 && h.hit !== "ground") { P.b2 = true; batBounce(P, h); return; }
    if (h || P.t > 12) { m.position.copy(h ? h.p : b); m.position.y += 0.02; m.rotation.set(0, m.rotation.y, 0); P.lie = true; return; } m.position.copy(b); m.rotation.y += dt * 8; return; }
  m.rotation.y += dt * 32; m.rotation.z = 0.25;                              // dreht flach, leicht gekippt
  if (P.out) { if (P.tgt && m.position.distanceTo(P.tgt) > 0.5) P.v.copy(P.tgt).sub(m.position).normalize().multiplyScalar(30);
    else { batTurnLeft(P.v, dt * 1.65); P.v.y *= Math.exp(-2.5 * dt); }   // Steigen beim Hinausfliegen abklingen lassen (Nicolas 2026-11-18: "in der Haelfte fliegt er viel hoeher"); Linksbogen: rechts hinaus, kreuzt die Mitte bei ca. 22 m (Nicolas 2026-11-16: vorher Rechtskurve)
    if (m.position.distanceTo(P.o) >= P.range - 0.5 || (P.tgt && !P.tgtHit && m.position.distanceTo(P.tgt) < 0.8)) P.out = false; }
  else { const want = hand.clone().sub(m.position), dist = want.length(), sp = Math.min(38, 22 + P.t * 6);
    if (!P.tgt && !P.home) { batTurnLeft(P.v, dt * 6); const vy = P.v.y + ((hand.y - m.position.y) * 2 - P.v.y) * Math.min(1, dt * 4), hs = Math.sqrt(Math.max(0, sp * sp - vy * vy)), hl = Math.hypot(P.v.x, P.v.z) || 1; P.v.x *= hs / hl; P.v.z *= hs / hl; P.v.y = vy; const dv = Math.hypot(P.v.x, P.v.z), dw = Math.hypot(want.x, want.z); if ((P.v.x * want.x + P.v.z * want.z) / (dv * dw || 1) > 0.7 || P.t > 4) P.home = true; }   // weiter links herum, links zurueck; beim Wenden zur Handhoehe steuern, nur waagrecht beschleunigen (vorher wuchs das Steigen mit)
    else P.v.lerp(want.normalize().multiplyScalar(sp), Math.min(1, dt * 5));
    if (dist < 1.1 || (dist < 2.5 && P.t > 0.6)) { invAdd("batarang", 1); scene.remove(m); AIM.proj.splice(i, 1); return; } }
  const a = m.position.clone(), b = a.clone().addScaledVector(P.v, dt), h = shotSeg(a, b, null, 0.25);   // ab dem Abwurf pruefen (vorher erst nach 0,05 s: nah an Wand oder Automat flog er durch, Nicolas 2026-11-17)
  if (h) { batBounce(P, h); return; }
  m.position.copy(b); if (P.t > 8) { P.fall = true; P.v.set(0, 0, 0); }
}
function aimSmoke(p) { const S = { t: 0, s: [] }; for (let k = 0; k < 26; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: AIM_M.smokeT, transparent: true, depthWrite: false, opacity: 0.75 }));
    s.position.copy(p); s.position.y += 0.4; const a = Math.random() * 6.28, r = Math.random(); s.userData.v = new THREE.Vector3(Math.cos(a) * 3 * r, 0.6 + Math.random() * 1.6, Math.sin(a) * 3 * r); s.userData.r = 0.5 + r; s.userData.dynamic = true; scene.add(s); S.s.push(s); }
  AIM.smoke.push(S); shotSound?.(0.25, 0.4); }
// Maus: rechts halten = zielen, links (gefangen) = benutzen. Laeuft vor dem Rechtsklick in tore.js (dort wird bei Waffe abgebrochen).
renderer.domElement.addEventListener("mousedown", e => { if (touch || !onFoot() || !weaponHeld()) return;
  if (e.button === 2) { e.preventDefault(); AIM.on = true; } else if (e.button === 0 && dragging) weaponUse(); });
// Bat-Knopf (Nicolas 2026-11-17: "ein Item, vielleicht ein Bat-Knopf, mit dem man das Batsignal an- und ausschalten kann"): in der Hand Linksklick schaltet GCPD.on
function batKnopf() { if (typeof GCPD === "undefined") return toast("Kein Batsignal in Reichweite"); GCPD.on = !GCPD.on; toast(GCPD.on ? "Batsignal an (leuchtet nachts über Gotham)" : "Batsignal aus"); if (typeof invRender === "function") invRender(); }
renderer.domElement.addEventListener("mousedown", e => { if (e.button === 0 && dragging && onFoot() && typeof invHeld === "function" && invHeld() === "batknopf") batKnopf(); });
document.getElementById("btn-use")?.addEventListener("click", () => { if (typeof invHeld === "function" && invHeld() === "batknopf" && onFoot()) batKnopf(); });
addEventListener("mouseup", e => { if (e.button === 2) AIM.on = false; });
document.getElementById("btn-aim")?.addEventListener("click", e => { e.currentTarget.blur(); AIM.on = !AIM.on && onFoot() && !!weaponHeld(); });
document.getElementById("btn-use")?.addEventListener("click", e => { e.currentTarget.blur(); weaponUse(); });
// Samt-Etui mit drei Batarangs (Nicolas 2026-11-17, Filmbild: "eine Samtschachtel, wie bei dem Bild drei Stueck rein"): schwarzes Etui mit Schaumstoff-Einlage,
// Deckel hinten offen, drei Batarangs in Reihen, halb in die Einlage gesenkt. Boden bei y 0, Front nach -z. Fuer die Werkstatt (Laptop-Tisch).
function buildBatarangEtui() {
  const g = new THREE.Group(), velvet = new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 1 }), foam = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.95 }), rim = new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.6, metalness: 0.2 });
  const W = 0.42, D = 0.34, H = 0.055, box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  box(W, H, D, velvet, 0, H / 2, 0); box(W + 0.006, 0.006, D + 0.006, rim, 0, H, 0); box(W - 0.02, 0.004, D - 0.02, foam, 0, H + 0.002, 0);
  const lid = new THREE.Group(); lid.position.set(0, H, D / 2); lid.rotation.x = 1.75; g.add(lid);   // Deckel hinten, aufgeklappt
  { const l = new THREE.Mesh(new THREE.BoxGeometry(W, 0.03, D), velvet); l.position.set(0, 0.015, -D / 2); lid.add(l); const p = new THREE.Mesh(new THREE.BoxGeometry(W - 0.03, 0.006, D - 0.03), foam); p.position.set(0, -0.002, -D / 2); lid.add(p); }
  AIM_M.bat.computeBoundingBox(); const bc = (AIM_M.bat.boundingBox.min.z + AIM_M.bat.boundingBox.max.z) / 2 * 1.05;   // Mitte der Form (Drehpunkt liegt am Kopf), damit die Batarangs im Etui zentriert liegen
  for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(AIM_M.bat, AIM_M.batM); b.scale.setScalar(1.05); b.position.set(0, H + 0.002, -0.1 + k * 0.1 + bc); b.rotation.y = Math.PI; b.castShadow = true; g.add(b);   // Spitze nach vorne zum Betrachter, Ohren zum Deckel (Nicolas 2026-11-17: "sie sollen zu mir zeigen")
    const cut = new THREE.Mesh(AIM_M.bat, new THREE.MeshBasicMaterial({ color: 0x030304 })); cut.scale.set(1.12, 0.3, 1.25); cut.position.set(0, H + 0.0035, -0.1 + k * 0.1 + bc * 1.25 / 1.05); cut.rotation.y = Math.PI; g.add(cut); }   // Ausschnitt in der Einlage
  g.name = "Batarang-Etui"; return g;
}// Batarang in der Hand als 3D-Modell rechts unten (Nicolas 2026-11-17: "3D soll auch in der Hand gezeigt werden, rechts"), eigene Szene wie Jetons und Schusswaffen
function batHandRender() {
  const id = typeof invHeld === "function" ? invHeld() : null, foot = typeof onFoot === "function" ? onFoot() : true;
  if (id !== "batarang" || !foot || (typeof invIsOpen === "function" && invIsOpen()) || (AIM.cd > 0.05)) return;
  let H = AIM.hand; if (!H) { const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x404040, 1.3)); const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(1, 2, 1.5); sc.add(sun);
    const g = new THREE.Group(), m = new THREE.Mesh(AIM_M.bat, AIM_M.batM.map(q => { const c = q.clone(); c.metalness = 0.45; return c; })); m.rotation.set(1.2, 0, -0.35); g.add(m); const pl = new THREE.PointLight(0xffffff, 3, 0, 0); pl.position.set(-0.15, 0.25, 0.35); g.add(pl); sc.add(g); H = AIM.hand = { sc, g }; }   // schraeg in der Hand, Flaeche zum Betrachter; Licht faehrt mit der Kamera (sonst je nach Blickrichtung dunkel)
  H.g.position.copy(camera.position); H.g.quaternion.copy(camera.quaternion); H.g.scale.setScalar(1.05); { const zz = 0.45, th = Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()) / 2); H.g.translateX(0.64 * th * camera.aspect * zz); H.g.translateY(-0.3 * th * zz); H.g.translateZ(-zz); }   // ganz rechts nach Bildschirmanteil wie das 2D-Handbild (Nicolas 2026-11-17: "Jetons und Batarang sollen auch ganz rechts sein")
  const ac = renderer.autoClear; renderer.autoClear = false; renderer.clearDepth(); renderer.render(H.sc, camera); renderer.autoClear = ac;
}
