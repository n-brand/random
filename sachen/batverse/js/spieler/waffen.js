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
  // Batarang neu (Nicolas 2026-11-16 "ueberarbeiten"): 34 cm Spannweite, Ohren, Fluegel mit drei Zacken an der Hinterkante, abgeschraegte Kanten,
  // dunkles Metall mit Kante in Stahl (zwei Materialien: Flaechen / Seiten). Halbe Kontur rechts (x >= 0, y nach vorne), gespiegelt.
  const sh = new THREE.Shape(), P = [[0, 0.62], [0.07, 0.86], [0.12, 0.62], [0.24, 0.6], [0.5, 0.74], [0.82, 0.86], [1, 0.62], [0.9, 0.36], [0.86, 0.04], [0.72, 0.18], [0.6, -0.06], [0.46, 0.12], [0.32, -0.12], [0.18, 0.1], [0.08, -0.06], [0, -0.3]], S = 0.17;
  P.forEach(([x, y], i) => sh[i ? "lineTo" : "moveTo"](x * S, y * S - 0.04)); for (let i = P.length - 2; i > 0; i--) sh.lineTo(-P[i][0] * S, P[i][1] * S - 0.04);
  const bat = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 1 }); bat.rotateX(-Math.PI / 2); bat.translate(0, -0.004, 0);
  const smokeT = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, "rgba(200,200,205,0.9)"); g.addColorStop(0.6, "rgba(170,172,178,0.45)"); g.addColorStop(1, "rgba(150,150,155,0)"); c.fillStyle = g; c.fillRect(0, 0, w, w); });
  const rope = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x222222 })); rope.visible = false; rope.frustumCulled = false; scene.add(rope);
  return { bat, batM: [new THREE.MeshStandardMaterial({ color: 0x16181c, metalness: 0.75, roughness: 0.3 }), new THREE.MeshStandardMaterial({ color: 0x8a9099, metalness: 0.9, roughness: 0.25 })], bomb: new THREE.SphereGeometry(0.09, 10, 8), bombM: new THREE.MeshStandardMaterial({ color: 0x4a4e55, roughness: 0.6 }), smokeT, rope };
})();
// Blickstrahl aus der Bildmitte: erster Treffer bis max m -> { p, hit } oder null
function aimHit(max) { AIM_ray.setFromCamera({ x: 0, y: 0 }, camera); const o = AIM_ray.ray.origin, d = AIM_ray.ray.direction, a = o.clone().addScaledVector(d, 0.6), b = new THREE.Vector3();
  for (let s = 0.6; s < max; s += 3) { b.copy(o).addScaledVector(d, Math.min(max, s + 3)); const h = shotSeg(a, b, null, 0.25); if (h) return h; a.copy(b); } return null; }
function weaponUse() {
  const id = weaponHeld(); if (!id || !onFoot() || AIM.cd > 0 || AIM.grap) return;
  AIM_ray.setFromCamera({ x: 0, y: 0 }, camera); const d = AIM_ray.ray.direction.clone(), o = camera.position.clone().addScaledVector(d, 0.5); o.y -= 0.15;
  if (id === "batarang" || id === "rauchbombe") {
    if (!invTake(id, 1)) return; AIM.cd = 0.35; const bat = id === "batarang", m = new THREE.Mesh(bat ? AIM_M.bat : AIM_M.bomb, bat ? AIM_M.batM : AIM_M.bombM);
    m.position.copy(o); if (bat) m.position.addScaledVector(new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw)), 0.25);   // aus der rechten Hand
    m.userData.dynamic = true; scene.add(m); const v = d.clone().multiplyScalar(bat ? 30 : 17); if (!bat) v.y += 3.5;
    // Batarang als Bumerang: fliegt hinaus (beim Zielen gerade bis zum Zielpunkt, sonst im Linksbogen ca. 22 m), kehrt dann in die Hand zurueck
    const tgt = bat && AIM.on ? (aimHit(45)?.p || o.clone().addScaledVector(d, 45)) : null;
    AIM.proj.push({ id, m, v, t: 0, stuck: 0, out: true, tgt, range: tgt ? o.distanceTo(tgt) : 22, o: o.clone() }); if (!invHas(id)) toast(INV_ITEMS[id].name + ": der letzte (kommt zurück)");
  } else if (id === "greifhaken") {
    AIM.cd = 0.6; const h = aimHit(70); if (!h) return toast("Greifhaken: nichts in Reichweite (70 m)");
    let to = h.p.clone(); const dir = d.clone().setY(0).normalize();
    if (h.hit === "solid") { for (let k = 0.25; k <= 5; k += 0.25) { const q = h.p.clone().addScaledVector(dir, 0.5); q.y = h.p.y + k; if (!shotAt(q.x, q.y + 0.3, q.z)) { to = q.addScaledVector(dir, 0.6); to.y = h.p.y + k; break; } } }   // auf die Kante hinauf
    const from = player.pos.clone(), len = from.distanceTo(to); AIM.grap = { from, to, t: 0, dur: Math.max(0.35, len / 32), hit: h.p.clone() }; AIM_M.rope.visible = true; shotSound?.(0.15, 0.1);
  }
}
// je Bild aus schleife.js
function weaponsStep(dt) {
  AIM.cd = Math.max(0, AIM.cd - dt);
  const can = onFoot() && !!weaponHeld(); if (!can && AIM.on) AIM.on = false;
  const zt = AIM.on ? 1.8 : 1; if (Math.abs(AIM.z - zt) > 0.001 || (AIM.on && camera.fov !== 70 / AIM.z)) { AIM.z += (zt - AIM.z) * Math.min(1, dt * 12); if (Math.abs(AIM.z - zt) < 0.002) AIM.z = zt; if (onFoot()) { camera.fov = 70 / AIM.z; camera.updateProjectionMatrix(); } }
  document.body.classList.toggle("aiming", AIM.on); document.body.classList.toggle("armed", can);
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
function batarangStep(P, dt, i) {
  const m = P.m, hand = BAT_HAND.set(player.pos.x, player.pos.y + EYE - 0.35, player.pos.z);
  if (P.lie) { m.rotation.y += 0; if (onFoot() && Math.hypot(m.position.x - player.pos.x, m.position.z - player.pos.z) < 1.6 && Math.abs(m.position.y - player.pos.y) < 2.2) { invAdd("batarang", 1); toast("Batarang aufgehoben"); scene.remove(m); AIM.proj.splice(i, 1); } return; }
  if (P.fall) { P.v.y -= 9.8 * dt; const a = m.position.clone(), b = a.clone().addScaledVector(P.v, dt), h = shotSeg(a, b, null, 0.15);
    if (h || P.t > 12) { m.position.copy(h ? h.p : b); m.position.y += 0.02; m.rotation.set(0, m.rotation.y, 0); P.lie = true; return; } m.position.copy(b); m.rotation.y += dt * 8; return; }
  m.rotation.y += dt * 32; m.rotation.z = 0.25;                              // dreht flach, leicht gekippt
  if (P.out) { if (P.tgt) P.v.copy(P.tgt).sub(m.position).normalize().multiplyScalar(30);
    else { const c = Math.cos(dt * 0.9), s = Math.sin(dt * 0.9), vx = P.v.x, vz = P.v.z; P.v.x = vx * c - vz * s; P.v.z = vx * s + vz * c; P.v.y -= 1.2 * dt; }   // Linksbogen
    if (m.position.distanceTo(P.o) >= P.range - 0.5 || (P.tgt && m.position.distanceTo(P.tgt) < 0.8)) P.out = false; }
  else { const want = hand.clone().sub(m.position), dist = want.length(), sp = Math.min(38, 22 + P.t * 6); P.v.lerp(want.normalize().multiplyScalar(sp), Math.min(1, dt * 5));
    if (dist < 1.1 || (dist < 2.5 && P.t > 0.6)) { invAdd("batarang", 1); scene.remove(m); AIM.proj.splice(i, 1); return; } }
  const a = m.position.clone(), b = a.clone().addScaledVector(P.v, dt), h = P.t > 0.05 ? shotSeg(a, b, null, 0.3) : null;
  if (h) { m.position.copy(h.p).addScaledVector(P.v.clone().normalize(), -0.35); if (h.hit && h.hit.veh) toast("Batarang trifft " + (h.hit.veh.label || "das Fahrzeug")); P.fall = true; P.v.multiplyScalar(-0.15); return; }
  m.position.copy(b); if (P.t > 8) { P.fall = true; P.v.set(0, 0, 0); }
}
function aimSmoke(p) { const S = { t: 0, s: [] }; for (let k = 0; k < 26; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: AIM_M.smokeT, transparent: true, depthWrite: false, opacity: 0.75 }));
    s.position.copy(p); s.position.y += 0.4; const a = Math.random() * 6.28, r = Math.random(); s.userData.v = new THREE.Vector3(Math.cos(a) * 3 * r, 0.6 + Math.random() * 1.6, Math.sin(a) * 3 * r); s.userData.r = 0.5 + r; s.userData.dynamic = true; scene.add(s); S.s.push(s); }
  AIM.smoke.push(S); shotSound?.(0.25, 0.4); }
// Maus: rechts halten = zielen, links (gefangen) = benutzen. Laeuft vor dem Rechtsklick in tore.js (dort wird bei Waffe abgebrochen).
renderer.domElement.addEventListener("mousedown", e => { if (touch || !onFoot() || !weaponHeld()) return;
  if (e.button === 2) { e.preventDefault(); AIM.on = true; } else if (e.button === 0 && dragging) weaponUse(); });
addEventListener("mouseup", e => { if (e.button === 2) AIM.on = false; });
document.getElementById("btn-aim")?.addEventListener("click", e => { e.currentTarget.blur(); AIM.on = !AIM.on && onFoot() && !!weaponHeld(); });
document.getElementById("btn-use")?.addEventListener("click", e => { e.currentTarget.blur(); weaponUse(); });
